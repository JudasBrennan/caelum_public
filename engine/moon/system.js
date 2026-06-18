import { calcMoonExact } from "../moon.js";
import { toFinite } from "../utils.js";
import { normalizeMoonInputs } from "./config.js";
import { computeMoonStabilityLimits } from "./orbit.js";
import {
  classifyMigrationTrendState,
  classifyMigrationTrendStrength,
  computeForcedEccentricity,
  computePeriodRatioDriftPctPerGyr,
  findNearestResonance,
  formatMigrationTrendDisplay,
} from "./resonance.js";
import { buildMoonTorqueBudget, estimateMoonEccentricityEquilibrium } from "./tidalEvolution.js";
import {
  buildHabitabilityPersistenceBridge,
  buildSustainedTidalHeatingContext,
} from "../dynamics/habitabilityBridge.js";

const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_KM = 6371;
const LUNAR_MASS_IN_EARTH = 0.0123000371;
const G = 6.6743e-11;

function normalizeDetailLevel(detailLevel) {
  return detailLevel === "summary" ? "summary" : "full";
}

function orbitalPeriodSiderealDays(parentMassEarth, semiMajorAxisKm) {
  const planetMassKg = Math.max(toFinite(parentMassEarth, 0), 0) * EARTH_MASS_KG;
  const semiMajorAxisM = Math.max(toFinite(semiMajorAxisKm, 0), 0) * 1000;
  if (planetMassKg <= 0 || semiMajorAxisM <= 0) return Infinity;
  const periodSeconds = 2 * Math.PI * Math.sqrt(semiMajorAxisM ** 3 / (G * planetMassKg));
  return periodSeconds / 86400;
}

function fallbackHabitableZone(starLuminosityLsol) {
  const rootLuminosity = Math.sqrt(Math.max(toFinite(starLuminosityLsol, 1), 0.01));
  return {
    inner: 0.95 * rootLuminosity,
    outer: 1.67 * rootLuminosity,
  };
}

function buildTidalHabitableZone({
  parentKind,
  parentOverride,
  starHabitableZoneAu,
  starMassMsol,
}) {
  const parentRadiusKm =
    Math.max(toFinite(parentOverride?.derived?.radiusEarth, 0), 0.01) * EARTH_RADIUS_KM;
  const parentOrbitAu = Math.max(toFinite(parentOverride?.inputs?.semiMajorAxisAu, 0), 0.001);
  const hz = starHabitableZoneAu || fallbackHabitableZone();
  const starHzEligible = parentOrbitAu >= hz.inner && parentOrbitAu <= hz.outer;
  const stabilityLimits = computeMoonStabilityLimits({
    starMassMsol: Math.max(toFinite(starMassMsol, 1), 0.01),
    planetMassEarth: Math.max(toFinite(parentOverride?.inputs?.massEarth, 0), 0.001),
    planetSemiMajorAxisAu: parentOrbitAu,
    moonInclinationDeg: 0,
  });
  const baseInnerRp = parentKind === "gasGiant" ? 6 : 4;
  const baseOuterRp = parentKind === "gasGiant" ? 45 : 18;
  return {
    starHzEligible,
    innerKm: parentRadiusKm * baseInnerRp,
    outerKm: parentRadiusKm * baseOuterRp,
    hillRadiusKm: stabilityLimits.hillRadiusKm,
    stableOuterLimitKm: stabilityLimits.stableOuterLimitKm,
    progradeStableOuterLimitKm: stabilityLimits.progradeStableOuterLimitKm,
    retrogradeStableOuterLimitKm: stabilityLimits.retrogradeStableOuterLimitKm,
    notes: starHzEligible
      ? ["parent-in-stellar-habitable-zone"]
      : ["parent-outside-stellar-habitable-zone"],
  };
}

function classifyFormation({ parentKind, moonInputs, parentOverride, nearestResonance }) {
  const inclination = Math.max(toFinite(moonInputs?.inclinationDeg, 0), 0);
  const semiMajorAxisKm = Math.max(toFinite(moonInputs?.semiMajorAxisKm, 0), 0);
  const parentRadiusKm =
    Math.max(toFinite(parentOverride?.derived?.radiusEarth, 0), 0.01) * EARTH_RADIUS_KM;
  const semiMajorAxisRp = parentRadiusKm > 0 ? semiMajorAxisKm / parentRadiusKm : Infinity;
  const moonMassEarth = Math.max(toFinite(moonInputs?.massMoon, 0), 0) * LUNAR_MASS_IN_EARTH;
  const parentMassEarth = Math.max(toFinite(parentOverride?.inputs?.massEarth, 0), 0.001);
  const massRatio = moonMassEarth / parentMassEarth;

  if (inclination > 90 || semiMajorAxisRp > 65 || inclination > 35) {
    return {
      scenarioLabel: "Captured irregular",
      confidence: 0.82,
      rationale:
        "Large inclination, retrograde geometry, or a very distant orbit favors capture over in-situ formation.",
    };
  }
  if (parentKind === "planet" && massRatio >= 0.006) {
    return {
      scenarioLabel: "Impact-formed major moon",
      confidence: 0.74,
      rationale:
        "A relatively massive moon close to a rocky planet is most consistent with debris-disk / giant-impact formation.",
    };
  }
  if (parentKind === "gasGiant" && semiMajorAxisRp <= 30 && inclination <= 10) {
    return {
      scenarioLabel:
        nearestResonance?.offsetPct <= 2.5 ? "Resonant regular moon" : "Co-accreted regular moon",
      confidence: nearestResonance?.offsetPct <= 2.5 ? 0.78 : 0.7,
      rationale:
        nearestResonance?.offsetPct <= 2.5
          ? "A low-inclination regular moon in a near resonance fits migration and resonance locking in a circumplanetary disk."
          : "A close, prograde, low-inclination moon around a giant planet is consistent with formation in a circumplanetary disk.",
    };
  }
  return {
    scenarioLabel: "Disk-accreted moon",
    confidence: 0.55,
    rationale:
      "The orbit is regular enough to fit in-system accretion, but the formation pathway is not strongly constrained.",
  };
}

function buildManualResonanceState(entries) {
  const byId = new Map();
  const grouped = new Map();
  for (const entry of entries) {
    const groupId = entry.inputs.manualResonanceGroupId;
    if (!groupId) continue;
    if (!grouped.has(groupId)) grouped.set(groupId, []);
    grouped.get(groupId).push(entry);
  }
  for (const [groupId, groupEntries] of grouped.entries()) {
    groupEntries.sort(
      (left, right) =>
        (left.inputs.manualResonanceOrder ?? Number.POSITIVE_INFINITY) -
          (right.inputs.manualResonanceOrder ?? Number.POSITIVE_INFINITY) ||
        left.inputs.semiMajorAxisKm - right.inputs.semiMajorAxisKm,
    );
    for (let index = 0; index < groupEntries.length; index += 1) {
      const entry = groupEntries[index];
      const prev = index > 0 ? groupEntries[index - 1] : null;
      byId.set(entry.id, {
        nearestResonance: prev
          ? {
              label: `${entry.inputs.manualResonanceRatio || 2}:1`,
              offsetPct: 0,
              withMoonId: prev.id,
              withMoonName: prev.inputs.name || prev.id,
            }
          : null,
        chainMembership: groupId,
        laplaceChainId: groupEntries.length >= 3 ? groupId : null,
        autoForcedEccentricity: 0,
        forcingPartnerMoonId: null,
        forcingPartnerMoonName: null,
        forcingOffsetPct: null,
        forcedEccentricity:
          entry.inputs.forcedEccentricity != null
            ? Math.max(0, entry.inputs.forcedEccentricity)
            : 0,
        forcedEccentricitySource: entry.inputs.forcedEccentricity != null ? "manual" : "none",
        sustainedHeatingLikely:
          (entry.inputs.forcedEccentricity ?? 0) >= 0.003 || groupEntries.length >= 3,
      });
    }
  }
  return byId;
}

function analyseSystemCoupling({
  moonEntries,
  parentKind,
  parentOverride,
  starHabitableZoneAu,
  starMassMsol,
}) {
  const entries = moonEntries
    .map((entry) => ({ ...entry, inputs: normalizeMoonInputs(entry.inputs || entry) }))
    .sort((left, right) => left.inputs.semiMajorAxisKm - right.inputs.semiMajorAxisKm);
  const parentMassEarth = Math.max(toFinite(parentOverride?.inputs?.massEarth, 0), 0.001);
  const states = new Map();
  const manualStates = buildManualResonanceState(entries);
  const tidalHabitableZone = buildTidalHabitableZone({
    parentKind,
    parentOverride,
    starHabitableZoneAu,
    starMassMsol,
  });

  for (const entry of entries) {
    if (manualStates.has(entry.id)) {
      const manualState = manualStates.get(entry.id);
      states.set(entry.id, {
        ...manualState,
        tidalHabitableZone,
      });
    }
  }

  for (let index = 0; index < entries.length; index += 1) {
    const current = entries[index];
    if (states.has(current.id)) continue;

    const inner = index > 0 ? entries[index - 1] : null;
    const outer = index + 1 < entries.length ? entries[index + 1] : null;
    const currentPeriod = orbitalPeriodSiderealDays(
      parentMassEarth,
      current.inputs.semiMajorAxisKm,
    );
    const comparisons = [];
    if (inner) {
      comparisons.push({
        partnerId: inner.id,
        partnerName: inner.inputs.name || inner.id,
        ratio:
          currentPeriod / orbitalPeriodSiderealDays(parentMassEarth, inner.inputs.semiMajorAxisKm),
      });
    }
    if (outer) {
      comparisons.push({
        partnerId: outer.id,
        partnerName: outer.inputs.name || outer.id,
        ratio:
          orbitalPeriodSiderealDays(parentMassEarth, outer.inputs.semiMajorAxisKm) / currentPeriod,
      });
    }

    const nearest = comparisons
      .map((comparison) => ({
        ...comparison,
        resonance: findNearestResonance(comparison.ratio),
      }))
      .filter((comparison) => comparison.resonance)
      .sort((left, right) => left.resonance.offsetPct - right.resonance.offsetPct)[0];

    const hasResonance = nearest && nearest.resonance.offsetPct <= 2.5;
    const autoForcedEccentricity = hasResonance
      ? computeForcedEccentricity({
          resonanceLabel: nearest.resonance.label,
          offsetPct: nearest.resonance.offsetPct,
          perturberMassMoon:
            inner && nearest.partnerId === inner.id
              ? inner.inputs.massMoon
              : outer?.inputs.massMoon,
          parentMassEarth,
          semiMajorAxisKm: current.inputs.semiMajorAxisKm,
          perturberSemiMajorAxisKm:
            inner && nearest.partnerId === inner.id
              ? inner.inputs.semiMajorAxisKm
              : outer?.inputs.semiMajorAxisKm,
        })
      : 0;
    const forcedEccentricity =
      current.inputs.forcedEccentricity != null
        ? Math.max(current.inputs.forcedEccentricity, 0)
        : autoForcedEccentricity;
    states.set(current.id, {
      nearestResonance: hasResonance
        ? {
            label: nearest.resonance.label,
            offsetPct: nearest.resonance.offsetPct,
            withMoonId: nearest.partnerId,
            withMoonName: nearest.partnerName,
          }
        : null,
      chainMembership: null,
      laplaceChainId: null,
      autoForcedEccentricity,
      forcingPartnerMoonId: hasResonance ? nearest.partnerId : null,
      forcingPartnerMoonName: hasResonance ? nearest.partnerName : null,
      forcingOffsetPct: hasResonance ? nearest.resonance.offsetPct : null,
      forcedEccentricity,
      forcedEccentricitySource:
        current.inputs.forcedEccentricity != null
          ? "manual"
          : autoForcedEccentricity > 0
            ? "resonant-mass-model"
            : "none",
      sustainedHeatingLikely: forcedEccentricity >= 0.003,
      tidalHabitableZone,
    });
  }

  for (let index = 0; index + 2 < entries.length; index += 1) {
    if (
      manualStates.has(entries[index].id) ||
      manualStates.has(entries[index + 1].id) ||
      manualStates.has(entries[index + 2].id)
    ) {
      continue;
    }
    const first = states.get(entries[index].id);
    const second = states.get(entries[index + 1].id);
    const firstNearTwoToOne = first?.nearestResonance?.label === "2:1";
    const secondNearTwoToOne = second?.nearestResonance?.label === "2:1";
    if (!firstNearTwoToOne || !secondNearTwoToOne) continue;
    const chainId = `laplace:${entries[index].id}:${entries[index + 1].id}:${entries[index + 2].id}`;
    for (const entry of [entries[index], entries[index + 1], entries[index + 2]]) {
      const state = states.get(entry.id);
      state.chainMembership = chainId;
      state.laplaceChainId = chainId;
      if (state.forcedEccentricitySource !== "manual" && state.forcedEccentricity < 0.0035) {
        state.forcedEccentricity = 0.0035;
        state.forcedEccentricitySource = "laplace-chain-floor";
      }
      state.sustainedHeatingLikely = state.forcedEccentricity >= 0.003 || !!state.laplaceChainId;
    }
  }

  return states;
}

function applyMigrationTrendMetadata(results) {
  const resultsById = new Map(results.map((entry) => [entry.raw.id, entry]));

  for (const entry of results) {
    const resonance = entry.model?.resonance;
    if (!resonance) continue;

    let ratioDriftPctPerGyr = null;
    const partnerId = resonance.nearestResonance?.withMoonId;
    if (partnerId) {
      const partnerEntry = resultsById.get(partnerId);
      const currentSemiMajorAxisKm = toFinite(entry.model?.inputs?.semiMajorAxisKm, 0);
      const partnerSemiMajorAxisKm = toFinite(partnerEntry?.model?.inputs?.semiMajorAxisKm, 0);
      const currentDadtMs = toFinite(entry.model?.tides?.dadtTotalMs, 0);
      const partnerDadtMs = toFinite(partnerEntry?.model?.tides?.dadtTotalMs, 0);

      if (currentSemiMajorAxisKm > 0 && partnerSemiMajorAxisKm > 0) {
        ratioDriftPctPerGyr =
          currentSemiMajorAxisKm <= partnerSemiMajorAxisKm
            ? computePeriodRatioDriftPctPerGyr({
                semiMajorAxisInnerKm: currentSemiMajorAxisKm,
                semiMajorAxisOuterKm: partnerSemiMajorAxisKm,
                dadtInnerMs: currentDadtMs,
                dadtOuterMs: partnerDadtMs,
              })
            : computePeriodRatioDriftPctPerGyr({
                semiMajorAxisInnerKm: partnerSemiMajorAxisKm,
                semiMajorAxisOuterKm: currentSemiMajorAxisKm,
                dadtInnerMs: partnerDadtMs,
                dadtOuterMs: currentDadtMs,
              });
      }
    }

    resonance.ratioDriftPctPerGyr =
      ratioDriftPctPerGyr == null ? null : toFinite(ratioDriftPctPerGyr, null);
    resonance.migrationTrendState = classifyMigrationTrendState(ratioDriftPctPerGyr);
    resonance.migrationTrendStrength = classifyMigrationTrendStrength(ratioDriftPctPerGyr);
    if (entry.model.display) {
      entry.model.display.migrationTrend = formatMigrationTrendDisplay(resonance);
    }
  }

  return results;
}

function formatEccentricityEquilibriumDisplay(equilibrium) {
  if (!equilibrium) return "Unknown";
  switch (equilibrium.state) {
    case "maintained":
      return `Maintained (${equilibrium.confidence})`;
    case "damping":
      return `Damping (${equilibrium.confidence})`;
    case "overdriven":
      return `Overdriven (${equilibrium.confidence})`;
    default:
      return `Uncertain (${equilibrium.confidence || "low"})`;
  }
}

function buildMoonStabilityContextForHabitabilityBridge(orbit = {}) {
  const stabilityClass = String(orbit.orbitStabilityClass || "unknown");
  const requestedStabilityClass = String(orbit.requestedOrbitStabilityClass || "");
  const hardClasses = new Set([
    "inside-parent-collision-limit",
    "inside-roche-limit",
    "outside-hill-sphere",
    "outside-conservative-stable-region",
  ]);
  const requestedHard = hardClasses.has(requestedStabilityClass);
  if (hardClasses.has(stabilityClass) || requestedHard) {
    return {
      state: "unstable",
      confidence: "high",
      reasons: [
        requestedHard ? orbit.requestedOrbitStabilityLabel : orbit.orbitStabilityLabel,
      ].filter(Boolean),
    };
  }
  if (stabilityClass === "near-outer-stability-edge" || orbit.longTermStable === false) {
    return {
      state: "crowded",
      confidence: "low",
      reasons: [orbit.orbitStabilityLabel || "Moon orbit is near the stability edge."],
    };
  }
  if (!stabilityClass || stabilityClass === "unknown") {
    return {
      state: "unknown",
      confidence: "unknown",
      reasons: ["Moon orbital stability context is incomplete."],
    };
  }
  return {
    state: "stable",
    confidence: "high",
    reasons: [orbit.orbitStabilityLabel].filter(Boolean),
  };
}

function habitabilityBridgeBreakdown(bridge) {
  return {
    modelVersion: bridge.modelVersion,
    persistenceModifier: bridge.persistenceModifier,
    modifierTarget: bridge.modifierTarget,
    confidence: bridge.confidence,
    sustainedTidalHeatingClass: bridge.sustainedTidalHeatingClass,
    reasons: bridge.reasons,
    noOpReason: bridge.noOpReason,
    appliedToScore: false,
  };
}

function applyTidalPersistenceContext(model, context, { bodyId = null } = {}) {
  if (!model || !context) return;
  const habitabilityBridge = buildHabitabilityPersistenceBridge({
    bodyId,
    bodyKind: "moon",
    stabilityContext: buildMoonStabilityContextForHabitabilityBridge(model.orbit || {}),
    tidalContext: {
      tidalHeatingEarth: model.tides?.tidalHeatingEarth,
      eccentricityPersistence: context.eccentricityPersistence,
      heatingLikelySustained: context.heatingLikelySustained,
    },
    hydrosphere: model.habitability?.hydrosphere || model.hydrosphere || null,
    geology: model.geology || null,
  });
  const fields = {
    dynamicalPersistenceContext: context,
    currentTidalHeatingClass: context.currentTidalHeatingClass,
    sustainedTidalHeatingClass: context.sustainedTidalHeatingClass,
    tidalPersistenceConfidence: context.persistenceConfidence,
    tidalPersistenceNote: context.note,
  };
  model.dynamicalContext = {
    ...(model.dynamicalContext && typeof model.dynamicalContext === "object"
      ? model.dynamicalContext
      : {}),
    tidalPersistenceContext: context,
    habitabilityBridge,
  };
  if (model.habitability && typeof model.habitability === "object") {
    model.habitability.dynamicalPersistence = habitabilityBridge;
    model.habitability.breakdown = {
      ...(model.habitability.breakdown && typeof model.habitability.breakdown === "object"
        ? model.habitability.breakdown
        : {}),
      dynamicalPersistence: habitabilityBridgeBreakdown(habitabilityBridge),
    };
  }
  for (const target of [
    model.hydrosphere,
    model.habitability?.hydrosphere,
    model.geology,
    model.oceanChemistryContext,
    model.environment?.oceanChemistryContext,
    model.habitability?.oceanChemistryContext,
    model.climate?.oceanChemistryContext,
    model.temperature?.thermalEnvelope,
  ]) {
    if (!target || typeof target !== "object") continue;
    Object.assign(target, fields);
    if (Array.isArray(target.notes) && context.note && !target.notes.includes(context.note)) {
      target.notes.push(context.note);
    }
  }
  if (model.display) {
    model.display.dynamicalPersistenceConfidence = habitabilityBridge.confidence;
  }
}

function applyEccentricityEquilibriumMetadata(results, { systemAgeGyr } = {}) {
  for (const entry of results) {
    const model = entry.model;
    if (!model?.resonance) continue;
    const equilibrium = estimateMoonEccentricityEquilibrium({
      currentEccentricity: model.inputs?.eccentricity,
      forcedEccentricity: model.resonance.forcedEccentricity,
      forcedEccentricitySource: model.resonance.forcedEccentricitySource,
      nearestResonance: model.resonance.nearestResonance,
      migrationTrendState: model.resonance.migrationTrendState,
      tidalHeatingEarth: model.tides?.tidalHeatingEarth,
      circularisationTimescaleGyr: model.tides?.eccentricityDampingTimescaleGyr,
      systemAgeGyr,
    });
    model.resonance.eccentricityEquilibrium = equilibrium;
    model.tidalEvolution = {
      ...(model.tidalEvolution && typeof model.tidalEvolution === "object"
        ? model.tidalEvolution
        : {}),
      eccentricityEquilibrium: equilibrium,
    };
    const persistenceContext = buildSustainedTidalHeatingContext({
      tidalHeatingEarth: model.tides?.tidalHeatingEarth,
      eccentricityPersistence: equilibrium.state,
      heatingLikelySustained: equilibrium.heatingLikelySustained,
      supportingMechanism:
        model.resonance?.forcedEccentricitySource ||
        (model.resonance?.nearestResonance ? "near-resonance" : "none"),
      limitingFactor: equilibrium.state === "damping" ? "no-sustained-eccentricity-pump" : "",
      reasons: [equilibrium.note, model.tides?.synchronousOrbitNote].filter(Boolean),
    });
    applyTidalPersistenceContext(model, persistenceContext, { bodyId: entry.raw?.id || null });
    if (model.display) {
      model.display.eccentricityEquilibrium = formatEccentricityEquilibriumDisplay(equilibrium);
      model.display.eccentricityEquilibriumNote = equilibrium.note;
      model.display.tidalHeatingPersistence = equilibrium.heatingLikelySustained
        ? "Likely sustained"
        : equilibrium.state === "damping"
          ? "Likely damping"
          : "Uncertain";
      model.display.tidalHeatingPersistenceClass = persistenceContext.sustainedTidalHeatingClass;
    }
  }
  return results;
}

export function buildRockyMoonParentOverride(model, { includeRadiation = true } = {}) {
  return {
    inputs: {
      massEarth: model.inputs.massEarth,
      semiMajorAxisAu: model.inputs.semiMajorAxisAu,
      eccentricity: model.inputs.eccentricity,
      rotationPeriodHours: model.inputs.rotationPeriodHours,
      cmfPct: model.inputs.cmfPct,
    },
    derived: {
      densityGcm3: model.derived.densityGcm3,
      radiusEarth: model.derived.radiusEarth,
      gravityG: model.derived.gravityG,
      radioisotopeAbundance: model.inputs.radioisotopeAbundance ?? 1,
      ...(includeRadiation
        ? {
            surfaceFieldEarths: model.derived?.surfaceFieldEarths ?? 0,
            magnetopauseRp: model.derived?.magnetopauseRp ?? null,
            magnetosphereEnvironment: model.derived?.magnetosphereEnvironment ?? null,
          }
        : {}),
    },
  };
}

export function buildGasGiantMoonParentOverride(model, { includeRadiation = true } = {}) {
  return {
    inputs: {
      massEarth: model.physical.massEarth,
      semiMajorAxisAu: model.inputs.orbitAu,
      eccentricity: model.inputs.eccentricity,
      rotationPeriodHours: model.inputs.rotationPeriodHours,
      cmfPct: 0,
    },
    derived: {
      densityGcm3: model.physical.densityGcm3,
      radiusEarth: model.physical.radiusEarth,
      gravityG: model.physical.gravityG,
      radioisotopeAbundance: 1,
      ...(includeRadiation
        ? {
            surfaceFieldEarths: model.magnetic?.surfaceFieldEarths ?? 0,
            magnetopauseRp: model.magnetic?.magnetopauseRp ?? null,
            magnetosphereEnvironment: model.magnetic?.magnetosphereEnvironment ?? null,
          }
        : {}),
    },
  };
}

export function solveMoonSystem({
  starMassMsol,
  starAgeGyr,
  starMetallicityFeH,
  starRadiusRsolOverride,
  starLuminosityLsolOverride,
  starTempKOverride,
  starEvolutionMode,
  starHabitableZoneAu,
  hostFrameId = null,
  hostFrame = null,
  hostXuvFluxEarthAt1Au = null,
  hostPrebioticUvEarthAt1Au = null,
  hostWindPressureEarthAt1Au = null,
  companionFluxEarth = 0,
  companionXuvFluxEarth = 0,
  companionPrebioticUvEarth = 0,
  companionWindPressureEarth = 0,
  fluxVariabilityFraction = 0,
  parentKind,
  parentOverride,
  moonEntries,
  habitabilityPolicy,
  detailLevel = "full",
}) {
  const detail = normalizeDetailLevel(detailLevel);
  const couplingStates = analyseSystemCoupling({
    moonEntries,
    parentKind,
    parentOverride,
    starHabitableZoneAu,
    starMassMsol,
  });

  const results = moonEntries.map((entry) => {
    const normalizedInputs = normalizeMoonInputs(entry.inputs || entry);
    const couplingState = couplingStates.get(entry.id) || {
      nearestResonance: null,
      chainMembership: null,
      laplaceChainId: null,
      autoForcedEccentricity: 0,
      forcingPartnerMoonId: null,
      forcingPartnerMoonName: null,
      forcingOffsetPct: null,
      forcedEccentricity: normalizedInputs.forcedEccentricity ?? 0,
      forcedEccentricitySource: normalizedInputs.forcedEccentricity != null ? "manual" : "none",
      sustainedHeatingLikely: false,
      tidalHabitableZone: buildTidalHabitableZone({
        parentKind,
        parentOverride,
        starHabitableZoneAu,
        starMassMsol,
      }),
    };
    const model = calcMoonExact({
      starMassMsol,
      starAgeGyr,
      starMetallicityFeH,
      starRadiusRsolOverride,
      starLuminosityLsolOverride,
      starTempKOverride,
      starEvolutionMode,
      hostFrameId,
      hostFrame,
      starHabitableZoneAu,
      hostXuvFluxEarthAt1Au,
      hostPrebioticUvEarthAt1Au,
      hostWindPressureEarthAt1Au,
      companionFluxEarth,
      companionXuvFluxEarth,
      companionPrebioticUvEarth,
      companionWindPressureEarth,
      fluxVariabilityFraction,
      moon: normalizedInputs,
      parentOverride,
      habitabilityPolicy,
      detailLevel: detail,
      moonSystemContext: {
        siblingCount: moonEntries.length,
        nearestResonance: couplingState.nearestResonance,
        chainMembership: couplingState.chainMembership,
        laplaceChainId: couplingState.laplaceChainId,
        autoForcedEccentricity: couplingState.autoForcedEccentricity,
        forcingPartnerMoonId: couplingState.forcingPartnerMoonId,
        forcingPartnerMoonName: couplingState.forcingPartnerMoonName,
        forcingOffsetPct: couplingState.forcingOffsetPct,
        forcedEccentricity: couplingState.forcedEccentricity,
        forcedEccentricitySource: couplingState.forcedEccentricitySource,
        sustainedHeatingLikely: couplingState.sustainedHeatingLikely,
        tidalHabitableZone: couplingState.tidalHabitableZone,
        formation: classifyFormation({
          parentKind,
          moonInputs: normalizedInputs,
          parentOverride,
          nearestResonance: couplingState.nearestResonance,
        }),
      },
    });
    return {
      raw: entry,
      model,
      coupling: model.resonance,
      formation: model.formation,
    };
  });

  const finalizedResults = applyEccentricityEquilibriumMetadata(
    applyMigrationTrendMetadata(results),
    {
      systemAgeGyr: starAgeGyr,
    },
  );
  finalizedResults.parentBudget = buildMoonTorqueBudget({
    parent: {
      id: parentOverride?.id || null,
      name: parentOverride?.name || (parentKind === "gasGiant" ? "Gas giant" : "Planet"),
    },
    moonResults: finalizedResults,
  });
  return finalizedResults;
}
