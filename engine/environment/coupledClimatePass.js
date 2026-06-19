import { buildCoupledValueTrace, selectEffectiveValue } from "../contexts/couplingPolicy.js";
import { CONFIDENCE } from "../contexts/validation.js";
import { classifyClimateState, waterBoilingK } from "../planet/composition.js";
import { computeMoonClimate } from "../moon/climate.js";
import { hydrosphereStateFromPlanet } from "../habitability/hydrosphere.js";
import { hydrosphereStateFromMoon } from "../moon/hydrosphere.js";
import { round, toFinite } from "../utils.js";

const MODEL_VERSION = "coupled-climate-pass-v1";
const SOURCE_KEYS = ["coupledClimatePass"];
const MIN_LIQUID_PRESSURE_ATM = 0.006;

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizedConfidence(value) {
  const confidence = String(value || "").toLowerCase();
  if (confidence === CONFIDENCE.HIGH) return CONFIDENCE.HIGH;
  if (confidence === CONFIDENCE.MEDIUM) return CONFIDENCE.MEDIUM;
  if (confidence === CONFIDENCE.LOW) return CONFIDENCE.LOW;
  return CONFIDENCE.UNKNOWN;
}

function tempBand(tempK, pressureAtm = 1) {
  const temp = Math.max(toFinite(tempK, 0), 0);
  if (temp <= 0) return "unknown";
  if (temp < 273.15) return "frozen";
  if (temp > waterBoilingK(Math.max(toFinite(pressureAtm, 0), MIN_LIQUID_PRESSURE_ATM))) {
    return "steam";
  }
  return "liquid-window";
}

function waterBoundaryCrossings({ baselineTempK, coupledTempK, pressureAtm }) {
  const baselineBand = tempBand(baselineTempK, pressureAtm);
  const coupledBand = tempBand(coupledTempK, pressureAtm);
  return baselineBand !== coupledBand
    ? [
        {
          kind: "water-phase-window",
          from: baselineBand,
          to: coupledBand,
        },
      ]
    : [];
}

function hydrosphereBoundaryCrossings({ baselineHydrosphere, coupledHydrosphere }) {
  const crossings = [];
  const baselineLiquid = toFinite(baselineHydrosphere?.surfaceAccessibleLiquidFraction, 0);
  const coupledLiquid = toFinite(coupledHydrosphere?.surfaceAccessibleLiquidFraction, 0);
  const baselineSteam = toFinite(baselineHydrosphere?.steamFraction, 0);
  const coupledSteam = toFinite(coupledHydrosphere?.steamFraction, 0);
  const baselineIce = toFinite(baselineHydrosphere?.permanentIceFraction, 0);
  const coupledIce = toFinite(coupledHydrosphere?.permanentIceFraction, 0);

  if (baselineLiquid > 0 !== coupledLiquid > 0) {
    crossings.push({
      kind: "surface-liquid-access",
      from: baselineLiquid > 0 ? "present" : "absent",
      to: coupledLiquid > 0 ? "present" : "absent",
    });
  }
  if (baselineSteam > 0.5 !== coupledSteam > 0.5) {
    crossings.push({
      kind: "steam-dominance",
      from: baselineSteam > 0.5 ? "dominant" : "not-dominant",
      to: coupledSteam > 0.5 ? "dominant" : "not-dominant",
    });
  }
  if (baselineIce > 0.5 !== coupledIce > 0.5) {
    crossings.push({
      kind: "ice-dominance",
      from: baselineIce > 0.5 ? "dominant" : "not-dominant",
      to: coupledIce > 0.5 ? "dominant" : "not-dominant",
    });
  }
  return crossings;
}

function climateStateCrossings({ baselineClimateState, coupledClimateState }) {
  const baseline = String(baselineClimateState || "Stable");
  const coupled = String(coupledClimateState || baseline);
  return baseline !== coupled
    ? [
        {
          kind: "climate-state",
          from: baseline,
          to: coupled,
        },
      ]
    : [];
}

export function classifyCoupledClimateBoundaryRisk({
  baselineSurfaceTempK = 0,
  coupledSurfaceTempK = null,
  pressureAtm = 1,
  baselineClimateState = "Stable",
  coupledClimateState = "Stable",
  baselineHydrosphere = null,
  coupledHydrosphere = null,
} = {}) {
  const coupled = finitePositive(coupledSurfaceTempK);
  const baseline = finitePositive(baselineSurfaceTempK);
  if (coupled == null || baseline == null) {
    return {
      boundaryRisk: "high",
      boundaryCrossings: [{ kind: "invalid-temperature", from: baseline, to: coupled }],
    };
  }

  const boundaryCrossings = [
    ...waterBoundaryCrossings({ baselineTempK: baseline, coupledTempK: coupled, pressureAtm }),
    ...climateStateCrossings({ baselineClimateState, coupledClimateState }),
    ...hydrosphereBoundaryCrossings({ baselineHydrosphere, coupledHydrosphere }),
  ];
  const extremeClimate = String(coupledClimateState || "").toLowerCase();
  const boundaryRisk =
    extremeClimate.includes("runaway") || boundaryCrossings.length >= 3
      ? "medium"
      : boundaryCrossings.length > 0
        ? "medium"
        : "low";

  return { boundaryRisk, boundaryCrossings };
}

function blockedPass({
  baselineSurfaceTempK,
  baselineClimateState,
  baselineHydrosphere,
  confidence,
  manualOverride,
  reason,
  contextKey,
}) {
  return {
    modelVersion: MODEL_VERSION,
    status: "baseline",
    applied: false,
    confidence,
    baselineSurfaceTempK: round(toFinite(baselineSurfaceTempK, 0), 2),
    candidateSurfaceTempK: null,
    effectiveSurfaceTempK: round(toFinite(baselineSurfaceTempK, 0), 2),
    baselineClimateState,
    candidateClimateState: baselineClimateState,
    effectiveClimateState: baselineClimateState,
    baselineHydrosphere,
    candidateHydrosphere: baselineHydrosphere,
    effectiveHydrosphere: baselineHydrosphere,
    boundaryRisk: "high",
    boundaryCrossings: [],
    trace: buildCoupledValueTrace({
      baseline: baselineSurfaceTempK,
      effective: baselineSurfaceTempK,
      contextKey,
      confidence,
      reason,
      applied: false,
      manualOverride,
    }),
    assumptions: ["No finite coupled surface temperature was available."],
    sourceKeys: SOURCE_KEYS,
  };
}

export function resolveCoupledClimatePassForPlanet({
  baselineSurfaceTempK = 0,
  baselineClimateState = "Stable",
  baselineHydrosphere = null,
  climateChemistryForcing = null,
  pressureAtm = 1,
  waterRegime = "Dry",
  wmfPct = 0,
  massEarth = 1,
  radiusKm = 6371,
  gravityG = 1,
  absorbedFluxWm2 = 0,
  waterPresent = false,
  geothermalFluxWm2 = 0,
  tidalHeatFluxWm2 = 0,
  salinityPct = 0,
  ammoniaPct = 0,
  manualOverride = false,
  userMode = "auto",
} = {}) {
  const confidence = normalizedConfidence(climateChemistryForcing?.confidence);
  const candidateSurfaceTempK = finitePositive(climateChemistryForcing?.coupledSurfaceTempK);
  if (candidateSurfaceTempK == null) {
    return blockedPass({
      baselineSurfaceTempK,
      baselineClimateState,
      baselineHydrosphere,
      confidence,
      manualOverride,
      reason: "missing-coupled-temperature",
      contextKey: "coupledClimatePass",
    });
  }

  const candidateClimateState = classifyClimateState(
    candidateSurfaceTempK,
    absorbedFluxWm2,
    waterPresent,
  );
  const candidateHydrosphere = hydrosphereStateFromPlanet({
    waterRegime,
    wmfPct,
    massEarth,
    radiusKm,
    gravityG,
    surfaceTempK: candidateSurfaceTempK,
    pressureAtm,
    climateState: candidateClimateState,
    geothermalFluxWm2,
    tidalHeatFluxWm2,
    salinityPct,
    ammoniaPct,
  });
  const { boundaryRisk, boundaryCrossings } = classifyCoupledClimateBoundaryRisk({
    baselineSurfaceTempK,
    coupledSurfaceTempK: candidateSurfaceTempK,
    pressureAtm,
    baselineClimateState,
    coupledClimateState: candidateClimateState,
    baselineHydrosphere,
    coupledHydrosphere: candidateHydrosphere,
  });
  const selected = selectEffectiveValue({
    baseline: baselineSurfaceTempK,
    coupled: candidateSurfaceTempK,
    confidence,
    manualOverride,
    userMode,
    boundaryRisk,
    contextKey: "coupledClimatePass",
  });
  const applied = selected.applied;

  return {
    modelVersion: MODEL_VERSION,
    status: applied ? "applied" : "baseline",
    applied,
    confidence,
    baselineSurfaceTempK: round(toFinite(baselineSurfaceTempK, 0), 2),
    candidateSurfaceTempK: round(candidateSurfaceTempK, 2),
    effectiveSurfaceTempK: round(toFinite(selected.selectedValue, baselineSurfaceTempK), 2),
    baselineClimateState,
    candidateClimateState,
    effectiveClimateState: applied ? candidateClimateState : baselineClimateState,
    baselineHydrosphere,
    candidateHydrosphere,
    effectiveHydrosphere: applied ? candidateHydrosphere : baselineHydrosphere,
    boundaryRisk,
    boundaryCrossings,
    trace: selected.trace,
    assumptions: [
      "Single bounded second pass; no iterative climate, chemistry, or cloud feedback solve.",
    ],
    sourceKeys: SOURCE_KEYS,
  };
}

export function resolveCoupledClimatePassForMoon({
  baselineSurfaceTempK = 0,
  baselineClimate = null,
  baselineHydrosphere = null,
  climateChemistryForcing = null,
  surfacePressurePa = 0,
  volatileInventory = [],
  tidalHeatingEarth = 0,
  tidalHeatFluxWm2 = 0,
  internalHeatFluxWm2 = 0,
  gravityG = 1,
  densityGcm3 = 3,
  massMoon = 1,
  radiusMoon = 1,
  compositionClass = "",
  compositionOverride = null,
  hydrosphereMode = "core",
  waterMassFractionPct = null,
  salinityPct = 0,
  ammoniaPct = 0,
  differentiatedInterior = null,
  tidalPersistenceContext = null,
  atmosphereComposition = null,
  dominantAtmosphereSpecies = "",
  illumination = null,
  spinState = null,
  moonLockedToPlanet = false,
  moonSemiMajorAxisKm = 0,
  tidalHabitableZone = null,
  manualOverride = false,
  userMode = "auto",
} = {}) {
  const confidence = normalizedConfidence(climateChemistryForcing?.confidence);
  const baselineClimateState = String(baselineClimate?.climateState || "Stable");
  const candidateSurfaceTempK = finitePositive(climateChemistryForcing?.coupledSurfaceTempK);
  if (candidateSurfaceTempK == null) {
    return blockedPass({
      baselineSurfaceTempK,
      baselineClimateState,
      baselineHydrosphere,
      confidence,
      manualOverride,
      reason: "missing-coupled-temperature",
      contextKey: "coupledClimatePass",
    });
  }

  const candidateHydrosphere = hydrosphereStateFromMoon({
    volatileInventory,
    surfaceTempK: candidateSurfaceTempK,
    surfacePressurePa,
    tidalHeatingEarth,
    tidalHeatFluxWm2,
    internalHeatFluxWm2,
    gravityG,
    densityGcm3,
    massMoon,
    radiusMoon,
    compositionClass,
    compositionOverride,
    mode: hydrosphereMode,
    waterMassFractionPct,
    salinityPct,
    ammoniaPct,
    differentiatedInterior,
    tidalPersistenceContext,
  });
  const candidateClimate = computeMoonClimate({
    surfaceTempK: candidateSurfaceTempK,
    pressurePa: surfacePressurePa,
    gravityG,
    hydrosphere: candidateHydrosphere,
    atmosphereComposition,
    dominantAtmosphereSpecies,
    illumination,
    spinState,
    moonLockedToPlanet,
    moonSemiMajorAxisKm,
    tidalHabitableZone,
  });
  const { boundaryRisk, boundaryCrossings } = classifyCoupledClimateBoundaryRisk({
    baselineSurfaceTempK,
    coupledSurfaceTempK: candidateSurfaceTempK,
    pressureAtm: Math.max(toFinite(surfacePressurePa, 0), 0) / 101325,
    baselineClimateState,
    coupledClimateState: candidateClimate.climateState,
    baselineHydrosphere,
    coupledHydrosphere: candidateHydrosphere,
  });
  const selected = selectEffectiveValue({
    baseline: baselineSurfaceTempK,
    coupled: candidateSurfaceTempK,
    confidence,
    manualOverride,
    userMode,
    boundaryRisk,
    contextKey: "coupledClimatePass",
  });
  const applied = selected.applied;

  return {
    modelVersion: MODEL_VERSION,
    status: applied ? "applied" : "baseline",
    applied,
    confidence,
    baselineSurfaceTempK: round(toFinite(baselineSurfaceTempK, 0), 2),
    candidateSurfaceTempK: round(candidateSurfaceTempK, 2),
    effectiveSurfaceTempK: round(toFinite(selected.selectedValue, baselineSurfaceTempK), 2),
    baselineClimateState,
    candidateClimateState: candidateClimate.climateState,
    effectiveClimateState: applied ? candidateClimate.climateState : baselineClimateState,
    baselineHydrosphere,
    candidateHydrosphere,
    effectiveHydrosphere: applied ? candidateHydrosphere : baselineHydrosphere,
    candidateClimate,
    effectiveClimate: applied ? candidateClimate : baselineClimate,
    boundaryRisk,
    boundaryCrossings,
    trace: selected.trace,
    assumptions: [
      "Single bounded second pass; no iterative climate, chemistry, or cloud feedback solve.",
    ],
    sourceKeys: SOURCE_KEYS,
  };
}

export const COUPLED_CLIMATE_PASS_MODEL_VERSION = MODEL_VERSION;
