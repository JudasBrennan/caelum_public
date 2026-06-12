import { calcCalendarModel } from "../../engine/calendar.js";
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

function findSourcePlanetaryBody(world, planet) {
  if (!planet?.id) return null;
  return findPlanetaryBody(world, `planet:${planet.id}`) || findPlanetaryBody(world, planet.id);
}

export function createCalendarContextBuilder({ buildMonthModel }) {
  function buildContext(world, state) {
    const planets = listPlanets(world);
    const allMoons = listMoons(world);
    const planet =
      findById(planets, state.inputs.sourcePlanetId) ||
      getSelectedPlanet(world) ||
      planets[0] ||
      null;
    const sourcePlanetId = planet?.id || "";
    const planetMoons = moonsForPlanet(allMoons, sourcePlanetId);
    const sourceBody = findSourcePlanetaryBody(world, planet);
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

    let primaryMoon = findById(planetMoons, state.inputs.primaryMoonId);
    if (!primaryMoon) primaryMoon = planetMoons[0] || null;

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
    state.inputs.primaryMoonId = primaryMoon?.id || "";
    state.inputs.extraMoonIds = extraMoonIds;

    const planetOrbitalPeriodDays = unsupportedSourceMessage
      ? 365.2422
      : derivePlanetPeriodDays(world, planet);
    const planetRotationPeriodHours = unsupportedSourceMessage
      ? 24
      : Math.max(0.1, N(planet?.inputs?.rotationPeriodHours, 24));

    const moonDefs = [];
    if (primaryMoon) {
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
        synodicDays: deriveMoonSynodicDays(world, planet, moon),
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
    const solarDayHours = recipDiff > 1e-9 ? 1 / recipDiff : siderealHours;

    const calendarModel = calcCalendarModel({
      planetOrbitalPeriodDays: planetOrbitalPeriodDaysClamped,
      moonOrbitalPeriodDays: primaryMoonSynodicDays,
      planetRotationPeriodHours: solarDayHours,
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
    });
    state.ui.selectedDay = clampI(state.ui.selectedDay, 1, monthModel.monthLength);

    return {
      planets,
      planetMoons,
      sourcePlanetId,
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
      holidayIssueById: monthModel.holidayIssueById || {},
      holidayAlgorithmPresetScope,
      holidayAlgorithmSupport,
    };
  }

  return { buildContext };
}
