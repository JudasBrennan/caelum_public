import { calcCalendarModel } from "../../engine/calendar.js";
import { buildOrbitalEpochContext } from "../../engine/contexts/orbitalEpochContext.js";
import {
  buildObserverFrameContext,
  listObserverFrameCandidates,
  observerRefToSelectValue,
} from "../../engine/contexts/observerFrameContext.js";
import {
  getCalendarBasisMetrics,
  normalizeLeapRules,
  normalizeMonthLengthOverrides,
  normalizeNameList,
} from "../../engine/usableCalendar.js";
import {
  buildHolidayAlgorithmSupport,
  createCalendarStateStoreBindings,
  findById,
  moonsForPlanet,
  normFestivalRules,
  normHolidayRules,
  normIntercalaryPeriods,
  normalizeAstronomySettings,
  normalizeHolidayAlgorithmPresetScope,
  normalizeIcsIncludes,
  normalizeIsoDate,
  normalizeWeekendDayIndexes,
  normalizeWeekendRule,
  normWorkCycleRules,
  uniqIds,
} from "./stateModel.js";
import { buildWorldSnapshot } from "../../engine/worldSnapshot.js";
import { solvePlanetaryBodyForWorld } from "../bodySolveHelpers.js";
import { findPlanetaryBody, getSelectedPlanet, listMoons, listPlanets } from "../store.js";
import {
  buildSubtypeUnsupportedMessage,
  getSubtypePageApplicability,
} from "../planet/bodyClassificationSummary.js";

const { deriveMoonSynodicDays, derivePlanetPeriodDays } = createCalendarStateStoreBindings({
  getSelectedPlanet,
  listMoons,
  listPlanets,
});

const N = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};
const I = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : f;
};
const clampI = (v, min, max) => Math.max(min, Math.min(max, I(v, min)));
const mod = (v, b) => (b > 0 ? ((v % b) + b) % b : 0);

function finiteOrFallback(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function findSourcePlanetaryBody(world, planet) {
  if (!planet?.id) return null;
  return findPlanetaryBody(world, `planet:${planet.id}`) || findPlanetaryBody(world, planet.id);
}

function snapshotParentEntry(snapshot, parentId) {
  const id = String(parentId || "").trim();
  if (!id) return null;
  return snapshot?.planetsById?.[id] || snapshot?.gasGiantsById?.[id] || null;
}

function entryOrbitAu(entry) {
  return finiteOrFallback(
    entry?.orbitAu ??
      entry?.model?.inputs?.semiMajorAxisAu ??
      entry?.model?.inputs?.orbitAu ??
      entry?.model?.orbit?.semiMajorAxisAu ??
      entry?.source?.inputs?.semiMajorAxisAu ??
      entry?.source?.au,
    1,
  );
}

function entryEccentricity(entry) {
  return Number(
    entry?.model?.inputs?.eccentricity ??
      entry?.model?.orbit?.eccentricity ??
      entry?.source?.inputs?.eccentricity ??
      entry?.source?.eccentricity ??
      entry?.source?.ecc ??
      0,
  );
}

function entryInclinationDeg(entry) {
  return Number(
    entry?.model?.inputs?.inclinationDeg ??
      entry?.model?.orbit?.inclinationDeg ??
      entry?.source?.inputs?.inclinationDeg ??
      entry?.source?.inclinationDeg ??
      entry?.source?.inclination ??
      0,
  );
}

function moonSynodicDaysFromSnapshot(snapshot, moonId, fallback = 29.5306) {
  const moon = snapshot?.moonsById?.[moonId];
  return finiteOrFallback(
    moon?.model?.orbit?.orbitalPeriodSynodicDays ??
      moon?.model?.inputs?.orbitalPeriodSynodicDays ??
      moon?.orbitalPeriodSynodicDays,
    fallback,
  );
}

function candidateLabel(candidate, fallback = "Reference body") {
  if (!candidate) return fallback;
  if (candidate.kind === "moon" && candidate.parentName) {
    return `${candidate.label} around ${candidate.parentName}`;
  }
  return candidate.label || fallback;
}

export function createCalendarContextBuilder({ buildMonthModel }) {
  function buildContext(world, state) {
    const planets = listPlanets(world);
    const allMoons = listMoons(world);
    const snapshot = buildWorldSnapshot(world, { mode: "full" });
    const observerCandidates = listObserverFrameCandidates(snapshot);
    const requestedObserver =
      state.inputs.observerRef ||
      (state.inputs.sourcePlanetId ? { kind: "planet", id: state.inputs.sourcePlanetId } : null);
    const observerFrameContext = buildObserverFrameContext(snapshot, requestedObserver);
    const observerRef = observerFrameContext.observerRef;
    const observerCandidate = observerFrameContext.candidate || null;
    const isMoonObserver = observerRef?.kind === "moon";
    const sourcePlanetId = isMoonObserver ? observerRef?.parentId || "" : observerRef?.id || "";
    const planet =
      (!isMoonObserver && findById(planets, sourcePlanetId)) ||
      findById(planets, state.inputs.sourcePlanetId) ||
      getSelectedPlanet(world) ||
      planets[0] ||
      null;
    const planetMoons = moonsForPlanet(allMoons, sourcePlanetId);
    const parentEntry = isMoonObserver
      ? snapshotParentEntry(snapshot, sourcePlanetId)
      : snapshot?.planetsById?.[sourcePlanetId] || null;
    const sourceBody = !isMoonObserver ? findSourcePlanetaryBody(world, planet) : null;
    const pageSourceBody = sourceBody
      ? solvePlanetaryBodyForWorld(world, sourceBody).model || sourceBody
      : null;
    const sourceApplicability = pageSourceBody
      ? getSubtypePageApplicability(pageSourceBody, "calendar")
      : null;
    const sourceSubtypeMessage =
      sourceApplicability && sourceApplicability.status !== "full"
        ? buildSubtypeUnsupportedMessage(pageSourceBody, "calendar")
        : "";
    const unsupportedSourceMessage =
      sourceApplicability?.status === "none" ? sourceSubtypeMessage : "";
    const limitedSourceMessage =
      sourceApplicability?.status === "limited" ? sourceSubtypeMessage : "";

    let primaryMoon = isMoonObserver
      ? findById(planetMoons, observerRef?.id)
      : findById(planetMoons, state.inputs.primaryMoonId);
    if (!primaryMoon && !isMoonObserver) primaryMoon = planetMoons[0] || null;

    const extras = uniqIds(state.inputs.extraMoonIds)
      .filter((id) => id && id !== primaryMoon?.id)
      .filter((id) => !!findById(planetMoons, id));
    const fallbackExtras = planetMoons
      .filter((moon) => moon.id !== primaryMoon?.id)
      .map((moon) => moon.id)
      .filter((id) => !extras.includes(id));
    const extraMoonIds = [...extras, ...fallbackExtras].slice(0, 3);
    while (extraMoonIds.length < 3) extraMoonIds.push("");

    state.inputs.sourcePlanetId = sourcePlanetId;
    state.inputs.observerRef =
      observerRef || (sourcePlanetId ? { kind: "planet", id: sourcePlanetId } : null);
    state.inputs.primaryMoonId = primaryMoon?.id || "";
    state.inputs.extraMoonIds = extraMoonIds;

    const frameOutputs = observerFrameContext.outputs || {};
    const planetOrbitalPeriodDays = isMoonObserver
      ? finiteOrFallback(frameOutputs.hostStarYearDays, 365.2422)
      : unsupportedSourceMessage
        ? 365.2422
        : derivePlanetPeriodDays(world, planet);
    const planetRotationPeriodHours = isMoonObserver
      ? finiteOrFallback(frameOutputs.localSiderealDayHours, 24)
      : unsupportedSourceMessage
        ? 24
        : Math.max(0.1, N(planet?.inputs?.rotationPeriodHours, 24));

    const moonDefs = [];
    if (isMoonObserver) {
      const parentName =
        observerCandidate?.parentName || parentEntry?.name || sourcePlanetId || "Parent";
      moonDefs.push({
        id: `parent:${sourcePlanetId || "body"}`,
        name: `${parentName} phase`,
        synodicDays: finiteOrFallback(frameOutputs.primaryPhaseCycleDays, 29.5306),
        phaseCycleKind: frameOutputs.primaryPhaseCycleKind || "parent-phase",
      });
    } else if (primaryMoon) {
      moonDefs.push({
        id: primaryMoon.id,
        name: primaryMoon.name || primaryMoon.inputs?.name || "Primary moon",
        synodicDays: deriveMoonSynodicDays(world, planet, primaryMoon),
      });
    } else {
      moonDefs.push({ id: "__primary__", name: "Primary moon", synodicDays: 29.5306 });
    }

    for (const moonId of extraMoonIds) {
      if (!moonId) continue;
      const moon = findById(planetMoons, moonId);
      if (!moon) continue;
      moonDefs.push({
        id: moon.id,
        name: moon.name || moon.inputs?.name || moon.id,
        synodicDays: isMoonObserver
          ? moonSynodicDaysFromSnapshot(snapshot, moon.id)
          : deriveMoonSynodicDays(world, planet, moon),
      });
      if (moonDefs.length >= 4) break;
    }

    const primaryMoonSynodicDaysRaw = Math.max(0.1, N(moonDefs[0]?.synodicDays, 29.5306));

    let planetOrbitalPeriodDaysClamped = planetOrbitalPeriodDays;
    let primaryMoonSynodicDays = primaryMoonSynodicDaysRaw;
    let planetRotationPeriodHoursClamped = planetRotationPeriodHours;
    if (state.ui.derivedRoundEnabled) {
      const dp = clampI(state.ui.derivedDecimalPlaces ?? 6, 0, 6);
      const dpFactor = 10 ** dp;
      planetOrbitalPeriodDaysClamped = Math.round(planetOrbitalPeriodDays * dpFactor) / dpFactor;
      primaryMoonSynodicDays = Math.round(primaryMoonSynodicDaysRaw * dpFactor) / dpFactor;
      planetRotationPeriodHoursClamped =
        Math.round(planetRotationPeriodHours * dpFactor) / dpFactor;
    }

    const derivedMonthsPerYear = Math.max(
      1,
      Math.round(planetOrbitalPeriodDaysClamped / primaryMoonSynodicDays),
    );
    if (
      state.inputs.monthsPerYear == null ||
      !Number.isFinite(Number(state.inputs.monthsPerYear))
    ) {
      state.inputs.monthsPerYear = derivedMonthsPerYear;
    }

    const orbitalHours = planetOrbitalPeriodDaysClamped * 24;
    const siderealHours = planetRotationPeriodHoursClamped;
    const recipDiff = 1 / siderealHours - 1 / orbitalHours;
    const solarDayHours = isMoonObserver
      ? finiteOrFallback(frameOutputs.localSolarDayHours, siderealHours)
      : recipDiff > 1e-9
        ? 1 / recipDiff
        : siderealHours;

    const calendarModel = calcCalendarModel({
      yearPeriodDays: planetOrbitalPeriodDaysClamped,
      monthCycleDays: primaryMoonSynodicDays,
      rotationPeriodHours: solarDayHours,
      frameKind:
        frameOutputs.calendarFrameClass || (isMoonObserver ? "moon-local" : "planet-local"),
      phaseCycleKind:
        frameOutputs.primaryPhaseCycleKind || (isMoonObserver ? "parent-phase" : "moon-phase"),
      observerRef,
      weeksPerMonth: 4,
    });
    const base = getCalendarBasisMetrics(calendarModel, state.ui.basis);
    const overrideMonths = clampI(state.inputs.monthsPerYear, 1, 240);

    const yearLen =
      base.basis === "solar"
        ? calendarModel.solar.commonYearLength
        : base.basis === "lunar"
          ? calendarModel.lunar.yearLength
          : calendarModel.lunisolar.commonYearLength;

    const autoDpm = Math.max(1, Math.floor(yearLen / overrideMonths));
    const effectiveDpm =
      state.inputs.daysPerMonth != null ? clampI(state.inputs.daysPerMonth, 1, 500) : autoDpm;

    const maxDpw = Math.min(30, effectiveDpm);
    const autoDpw = Math.max(1, Math.floor(effectiveDpm / 4));
    const effectiveDpw =
      state.inputs.daysPerWeek != null ? clampI(state.inputs.daysPerWeek, 1, maxDpw) : autoDpw;

    const weeksPerMonth = Math.max(1, Math.floor(effectiveDpm / effectiveDpw));
    const yearlyIntercalary = yearLen - overrideMonths * effectiveDpm;

    const metrics = {
      ...base,
      monthsPerYear: overrideMonths,
      daysPerMonth: effectiveDpm,
      daysPerWeek: effectiveDpw,
      weeksPerMonth,
      intercalaryDays: yearlyIntercalary,
    };
    state.ui.startDayOfYear = mod(I(state.ui.startDayOfYear, 0), metrics.daysPerWeek);
    state.ui.weekStartsOn = mod(I(state.ui.weekStartsOn, 0), metrics.daysPerWeek);
    state.ui.monthIndex = clampI(state.ui.monthIndex, 0, metrics.monthsPerYear - 1);

    const dayNames = normalizeNameList(state.ui.dayNames, metrics.daysPerWeek, "Day");
    const monthNames = normalizeNameList(state.ui.monthNames, metrics.monthsPerYear, "Month");
    const holidayAlgorithmPresetScope = normalizeHolidayAlgorithmPresetScope(
      state.ui.holidayAlgorithmPresetScope,
    );
    const holidayAlgorithmSupport = buildHolidayAlgorithmSupport(holidayAlgorithmPresetScope);
    state.ui.holidayAlgorithmPresetScope = holidayAlgorithmPresetScope;
    const holidays = normHolidayRules(state.ui.holidays, metrics.monthsPerYear);
    const festivals = normFestivalRules(state.ui.festivalRules, metrics.monthsPerYear);
    const intercalaryPeriods = normIntercalaryPeriods(
      state.ui.intercalaryPeriods,
      metrics.monthsPerYear,
    );
    const workCycles = normWorkCycleRules(state.ui.workCycles);
    const workWeekendRule = normalizeWeekendRule(state.ui.workWeekendRule);
    const weekendDayIndexes = normalizeWeekendDayIndexes(
      state.ui.weekendDayIndexes,
      metrics.daysPerWeek,
    );
    const astronomySettings = normalizeAstronomySettings(state.ui.astronomy);
    state.ui.astronomy = astronomySettings;
    state.ui.workCycles = workCycles;
    state.ui.workWeekendRule = workWeekendRule;
    state.ui.weekendDayIndexes = weekendDayIndexes;
    state.ui.exportAnchorDate = normalizeIsoDate(state.ui.exportAnchorDate);
    state.ui.icsIncludes = normalizeIcsIncludes(state.ui.icsIncludes);
    const leapRules = normalizeLeapRules(state.ui.leapRules, metrics.monthsPerYear);
    const monthLengthOverrides = state.ui.monthLengthOverridesEnabled
      ? normalizeMonthLengthOverrides(state.ui.monthLengthOverrides, metrics.monthsPerYear)
      : [];
    const orbitalEpochFactory = (absoluteDay) =>
      buildOrbitalEpochContext({
        epochDay: N(absoluteDay, 0),
        homeBody: {
          id: sourcePlanetId || planet?.id || "",
          orbitAu: isMoonObserver
            ? entryOrbitAu(parentEntry)
            : (planet?.inputs?.semiMajorAxisAu ?? planet?.semiMajorAxisAu ?? 1),
          orbitalPeriodDays: planetOrbitalPeriodDaysClamped,
          eccentricity: isMoonObserver
            ? entryEccentricity(parentEntry)
            : (planet?.inputs?.eccentricity ?? planet?.eccentricity ?? 0),
          inclinationDeg: isMoonObserver
            ? entryInclinationDeg(parentEntry)
            : (planet?.inputs?.inclinationDeg ?? planet?.inclinationDeg ?? 0),
        },
        moons: moonDefs.map((moon) => ({
          id: moon.id,
          name: moon.name,
          synodicDays: moon.synodicDays,
        })),
      });
    const monthModel = buildMonthModel({
      metrics,
      year: state.ui.year,
      monthIndex: state.ui.monthIndex,
      firstYearStartDayIndex: state.ui.startDayOfYear,
      weekStartDayIndex: state.ui.weekStartsOn,
      leapRules,
      monthLengthOverrides,
      dayNames,
      weekNames: state.ui.weekNames,
      monthNames,
      intercalaryPeriods,
      moonDefs,
      moonEpochOffsetDays: state.ui.moonEpochOffsetDays,
      holidays,
      festivals,
      astronomySettings,
      workCycles,
      weekendDayIndexes,
      holidayAlgorithmSupport,
      orbitalEpochFactory,
    });
    state.ui.selectedDay = clampI(state.ui.selectedDay, 1, monthModel.monthLength);
    const orbitalEpochContext = orbitalEpochFactory(
      N(monthModel?.absoluteDayStart, 0) + state.ui.selectedDay - 1,
    );

    return {
      planets,
      planetMoons,
      sourcePlanetId,
      sourceObserverValue: observerRefToSelectValue(observerRef),
      sourceObserverLabel: candidateLabel(observerCandidate),
      observerRef,
      observerCandidates,
      observerFrameContext,
      isMoonObserver,
      sourceParentLabel: observerCandidate?.parentName || parentEntry?.name || "",
      unsupportedSourceMessage,
      limitedSourceMessage,
      moonDefs,
      planetOrbitalPeriodDays: planetOrbitalPeriodDaysClamped,
      planetRotationPeriodHours: planetRotationPeriodHoursClamped,
      solarDayHours,
      primaryMoonSynodicDays,
      derivedMonthsPerYear,
      metrics,
      yearLen,
      yearlyIntercalary,
      dayNames,
      monthNames,
      holidays,
      festivals,
      intercalaryPeriods,
      workCycles,
      workWeekendRule,
      weekendDayIndexes,
      astronomySettings,
      leapRules,
      monthLengthOverrides,
      monthModel,
      orbitalEpochContext,
      holidayIssueById: monthModel.holidayIssueById || {},
      holidayAlgorithmPresetScope,
      holidayAlgorithmSupport,
    };
  }

  return { buildContext };
}
