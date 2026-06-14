// Shared hydrosphere interpretation for rocky-body habitability metrics.
//
// Stage 2 establishes one authoritative engine-side source of truth for
// surface liquid, land, ice, and steam fractions. The current model is
// intentionally heuristic, but deterministic and internally consistent.

import { clamp, round, toFinite } from "../utils.js";
import { OCEAN_PRESSURE_MODELS, classifyHighPressureIce } from "./highPressureIce.js";
import { estimateBottomOceanTemperature } from "./oceanThermalProfile.js";
import { waterBoilingK } from "../planet/composition.js";
export { hydrosphereStateFromMoon } from "../moon/hydrosphere.js";

const EARTH_MASS_KG = 5.972e24;
const EARTH_RADIUS_KM = 6371;
const WATER_DENSITY_KG_M3 = 1000;
const MIN_LIQUID_PRESSURE_ATM = 0.006;

const BASELINE_FRACTIONS = {
  Dry: { liquidOceanFraction: 0, landFraction: 1, permanentIceFraction: 0, steamFraction: 0 },
  "Shallow oceans": {
    liquidOceanFraction: 0.35,
    landFraction: 0.65,
    permanentIceFraction: 0,
    steamFraction: 0,
  },
  "Extensive oceans": {
    liquidOceanFraction: 0.71,
    landFraction: 0.29,
    permanentIceFraction: 0,
    steamFraction: 0,
  },
  "Global ocean": {
    liquidOceanFraction: 0.92,
    landFraction: 0.08,
    permanentIceFraction: 0,
    steamFraction: 0,
  },
  "Deep ocean": {
    liquidOceanFraction: 0.98,
    landFraction: 0.02,
    permanentIceFraction: 0,
    steamFraction: 0,
  },
  "Ice world": {
    liquidOceanFraction: 0,
    landFraction: 0,
    permanentIceFraction: 1,
    steamFraction: 0,
  },
};

function normalizeFractions(state) {
  const land = clamp(toFinite(state.landFraction, 0), 0, 1);
  const liquid = clamp(toFinite(state.liquidOceanFraction, 0), 0, 1);
  const ice = clamp(toFinite(state.permanentIceFraction, 0), 0, 1);
  const steam = clamp(toFinite(state.steamFraction, 0), 0, 1);
  const total = land + liquid + ice + steam;

  if (total <= 0) {
    return {
      liquidOceanFraction: 0,
      landFraction: 1,
      permanentIceFraction: 0,
      steamFraction: 0,
    };
  }

  return {
    liquidOceanFraction: liquid / total,
    landFraction: land / total,
    permanentIceFraction: ice / total,
    steamFraction: steam / total,
  };
}

function transferFraction(state, fromKey, toKey, share = 1) {
  const source = clamp(toFinite(state[fromKey], 0), 0, 1);
  const moved = source * clamp(toFinite(share, 0), 0, 1);
  state[fromKey] = Math.max(0, source - moved);
  state[toKey] = clamp(toFinite(state[toKey], 0) + moved, 0, 1);
}

function computeAccessibleLiquidFraction(state, regime, climateState) {
  let accessible = clamp(toFinite(state.liquidOceanFraction, 0), 0, 1);

  if (accessible <= 0) return 0;
  if (climateState === "Snowball" || climateState === "Runaway greenhouse") return 0;

  if (regime === "Global ocean") accessible *= 0.7;
  else if (regime === "Deep ocean") accessible *= 0.45;
  else if (regime === "Ice world") accessible = 0;

  if (climateState === "Moist greenhouse") accessible *= 0.35;

  return clamp(accessible, 0, 1);
}

export function physicalWaterCoverageFromDepthM(depthM) {
  const depth = Math.max(toFinite(depthM, 0), 0);
  if (depth <= 0) return 0;
  if (depth <= 10) return 0.02 * (depth / 10);
  if (depth <= 100) return 0.02 + ((depth - 10) / 90) * 0.08;
  if (depth <= 1000) return 0.1 + ((depth - 100) / 900) * 0.25;
  if (depth <= 4000) return 0.35 + ((depth - 1000) / 3000) * 0.4;
  if (depth <= 10000) return 0.75 + ((depth - 4000) / 6000) * 0.17;
  if (depth <= 30000) return 0.92 + ((depth - 10000) / 20000) * 0.06;
  return 0.98;
}

export function baselineHydrosphereFractionsForRegime(waterRegime) {
  const regime = BASELINE_FRACTIONS[waterRegime] ? waterRegime : "Shallow oceans";
  const baseline = BASELINE_FRACTIONS[regime];
  return {
    regime,
    modelVersion: "hydrosphere-v2",
    liquidOceanFraction: baseline.liquidOceanFraction,
    landFraction: baseline.landFraction,
    permanentIceFraction: baseline.permanentIceFraction,
    steamFraction: baseline.steamFraction,
    waterCoverageFraction: baseline.liquidOceanFraction + baseline.permanentIceFraction,
    surfaceAccessibleLiquidFraction: computeAccessibleLiquidFraction(baseline, regime, "Stable"),
    notes: ["baseline-regime-map"],
  };
}

export function estimateEquivalentWaterDepthM({ massEarth, wmfPct, radiusKm } = {}) {
  const bodyMassEarth = Math.max(toFinite(massEarth, 0), 0);
  const waterMassFraction = clamp(toFinite(wmfPct, 0) / 100, 0, 1);
  const radiusMeters = Math.max(toFinite(radiusKm, 0), 0) * 1000;
  if (bodyMassEarth <= 0 || waterMassFraction <= 0 || radiusMeters <= 0) return 0;

  const waterMassKg = bodyMassEarth * EARTH_MASS_KG * waterMassFraction;
  const surfaceAreaM2 = 4 * Math.PI * radiusMeters ** 2;
  if (surfaceAreaM2 <= 0) return 0;

  return waterMassKg / (surfaceAreaM2 * WATER_DENSITY_KG_M3);
}

function gravityGFromMassRadius({ massEarth, radiusKm, gravityG } = {}) {
  const explicitGravity = toFinite(gravityG, NaN);
  if (Number.isFinite(explicitGravity) && explicitGravity > 0) return explicitGravity;
  const mass = Math.max(toFinite(massEarth, 0), 0);
  const radiusEarth = Math.max(toFinite(radiusKm, 0), 0) / EARTH_RADIUS_KM;
  if (mass <= 0 || radiusEarth <= 0) return null;
  return mass / radiusEarth ** 2;
}

function meanOceanDepthKmFromEquivalentLayer(equivalentWaterDepthM, liquidOceanFraction) {
  const equivalentKm = Math.max(toFinite(equivalentWaterDepthM, 0), 0) / 1000;
  const liquidFraction = clamp(toFinite(liquidOceanFraction, 0), 0, 1);
  if (equivalentKm <= 0 || liquidFraction <= 0) return 0;
  return equivalentKm / liquidFraction;
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function bottomOceanTempRangeK(profile) {
  const min = finiteOrNull(profile?.minBottomTempK);
  const max = finiteOrNull(profile?.maxBottomTempK);
  return min == null || max == null ? null : [round(min, 1), round(max, 1)];
}

function phaseDiagramHydrosphereFields(highPressureIce, bottomOceanProfile = null) {
  return {
    bottomOceanTempK: finiteOrNull(bottomOceanProfile?.bottomTempK),
    bottomOceanTempRangeK: bottomOceanTempRangeK(bottomOceanProfile),
    bottomOceanTempMethod: bottomOceanProfile?.method ?? null,
    bottomOceanTempConfidence: bottomOceanProfile?.confidence ?? null,
    bottomOceanTempAssumptions: Array.isArray(bottomOceanProfile?.assumptions)
      ? [...bottomOceanProfile.assumptions]
      : [],
    highPressureIceClassificationMode: highPressureIce.classificationMode,
    pressureModel: highPressureIce.pressureModel,
    constantDensitySeafloorPressureGPa: highPressureIce.constantDensityPressureGPa,
    oceanEffectiveDensityKgM3: highPressureIce.effectiveDensityKgM3,
    oceanDensityMultiplier: highPressureIce.densityMultiplier,
    liquidusPressureGPa: highPressureIce.liquidusPressureGPa,
    liquidusBoundaryPhase: highPressureIce.liquidusBoundaryPhase,
    seafloorPhase: highPressureIce.seafloorPhase,
    highPressureIceStable: highPressureIce.highPressureIceStable,
    highPressureIcePhase: highPressureIce.highPressureIcePhase,
    rockOceanBarrier: highPressureIce.rockOceanBarrier,
    phaseDiagramConfidence: highPressureIce.phaseDiagramConfidence,
    phaseDiagramExplanation: highPressureIce.explanation,
  };
}

export function hydrosphereStateFromPlanet({
  waterRegime,
  wmfPct,
  massEarth,
  radiusKm,
  gravityG,
  surfaceTempK,
  pressureAtm,
  climateState,
  geothermalFluxWm2,
  tidalHeatFluxWm2,
  salinityPct,
  ammoniaPct,
} = {}) {
  const baseline = baselineHydrosphereFractionsForRegime(waterRegime);
  const notes = [...baseline.notes];
  const state = {
    liquidOceanFraction: baseline.liquidOceanFraction,
    landFraction: baseline.landFraction,
    permanentIceFraction: baseline.permanentIceFraction,
    steamFraction: baseline.steamFraction,
  };

  const waterInventoryPresent =
    clamp(toFinite(wmfPct, 0), 0, 100) > 0 || String(waterRegime || "") !== "Dry";
  const tempK = Math.max(toFinite(surfaceTempK, 0), 0);
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  const regime = baseline.regime;
  const stateClimate = String(climateState || "Stable");
  const resolvedGravityG = gravityGFromMassRadius({ massEarth, radiusKm, gravityG });
  const emptyHighPressureIce = classifyHighPressureIce({
    gravityG: resolvedGravityG,
    surfaceTempK: tempK,
    climateState: stateClimate,
  });

  if (!waterInventoryPresent) {
    notes.push("no-water-inventory");
    return {
      regime,
      modelVersion: "hydrosphere-v2",
      equivalentWaterDepthM: 0,
      liquidOceanFraction: 0,
      landFraction: 1,
      permanentIceFraction: 0,
      steamFraction: 0,
      waterCoverageFraction: 0,
      surfaceAccessibleLiquidFraction: 0,
      estimatedMeanOceanDepthKm: 0,
      seafloorPressureGPa: 0,
      highPressureIceBand: emptyHighPressureIce.band,
      highPressureIceRisk: false,
      highPressureIceLikely: false,
      highPressureIceThresholdDepthsKm: emptyHighPressureIce.thresholdDepthsKm,
      ...phaseDiagramHydrosphereFields(emptyHighPressureIce),
      notes,
    };
  }

  const equivalentWaterDepthM = estimateEquivalentWaterDepthM({ massEarth, wmfPct, radiusKm });
  const physicalCoverage = physicalWaterCoverageFromDepthM(equivalentWaterDepthM);
  const blendedLiquidCoverage = 0.35 * baseline.liquidOceanFraction + 0.65 * physicalCoverage;
  state.liquidOceanFraction = clamp(blendedLiquidCoverage, 0, 1);
  state.landFraction = Math.max(0, 1 - state.liquidOceanFraction);
  if (regime === "Ice world") {
    state.liquidOceanFraction = 0;
    state.permanentIceFraction = 1;
    state.landFraction = 0;
  }
  notes.push("depth-coverage-blend");

  if (pressure < MIN_LIQUID_PRESSURE_ATM && state.liquidOceanFraction > 0) {
    if (tempK > 0 && tempK < 273) {
      transferFraction(state, "liquidOceanFraction", "permanentIceFraction", 1);
      notes.push("low-pressure-sublimation-to-ice");
    } else {
      transferFraction(state, "liquidOceanFraction", "steamFraction", 1);
      notes.push("low-pressure-no-surface-liquid");
    }
  } else if (tempK > 0 && tempK < 273 && state.liquidOceanFraction > 0) {
    transferFraction(state, "liquidOceanFraction", "permanentIceFraction", 1);
    notes.push("subfreezing-surface");
  } else if (
    state.liquidOceanFraction > 0 &&
    tempK > 0 &&
    tempK > waterBoilingK(Math.max(pressure, MIN_LIQUID_PRESSURE_ATM))
  ) {
    transferFraction(state, "liquidOceanFraction", "steamFraction", 1);
    notes.push("surface-water-boils");
  }

  if (stateClimate === "Snowball") {
    transferFraction(state, "liquidOceanFraction", "permanentIceFraction", 1);
    notes.push("snowball-climate");
  } else if (stateClimate === "Moist greenhouse") {
    transferFraction(state, "liquidOceanFraction", "steamFraction", 0.35);
    notes.push("moist-greenhouse-bias");
  } else if (stateClimate === "Runaway greenhouse") {
    transferFraction(state, "liquidOceanFraction", "steamFraction", 1);
    transferFraction(state, "permanentIceFraction", "steamFraction", 1);
    notes.push("runaway-greenhouse");
  }

  const normalized = normalizeFractions(state);
  const estimatedMeanOceanDepthKm = meanOceanDepthKmFromEquivalentLayer(
    equivalentWaterDepthM,
    normalized.liquidOceanFraction,
  );
  const surfaceAccessibleLiquidFraction = computeAccessibleLiquidFraction(
    normalized,
    regime,
    stateClimate,
  );
  const bottomOceanProfile =
    normalized.liquidOceanFraction > 0 && estimatedMeanOceanDepthKm > 0
      ? estimateBottomOceanTemperature({
          surfaceTempK: tempK,
          climateState: stateClimate,
          pressureAtm: pressure,
          oceanDepthKm: estimatedMeanOceanDepthKm,
          geothermalFluxWm2,
          tidalHeatFluxWm2,
          salinityPct,
          ammoniaPct,
          hydrosphere: {
            ...normalized,
            surfaceAccessibleLiquidFraction,
          },
        })
      : null;
  const highPressureIce = classifyHighPressureIce({
    depthKm: estimatedMeanOceanDepthKm,
    gravityG: resolvedGravityG,
    pressureModel: OCEAN_PRESSURE_MODELS.effectiveDensity,
    surfaceTempK: tempK,
    bottomTempK: bottomOceanProfile?.bottomTempK,
    bottomTempRangeK: bottomOceanProfile
      ? {
          minBottomTempK: bottomOceanProfile.minBottomTempK,
          maxBottomTempK: bottomOceanProfile.maxBottomTempK,
        }
      : undefined,
    salinityPct,
    climateState: stateClimate,
    steamFraction: normalized.steamFraction,
    permanentIceFraction: normalized.permanentIceFraction,
  });
  return {
    regime,
    modelVersion: "hydrosphere-v2",
    equivalentWaterDepthM: round(equivalentWaterDepthM, 1),
    liquidOceanFraction: round(normalized.liquidOceanFraction, 3),
    landFraction: round(normalized.landFraction, 3),
    permanentIceFraction: round(normalized.permanentIceFraction, 3),
    steamFraction: round(normalized.steamFraction, 3),
    waterCoverageFraction: round(
      normalized.liquidOceanFraction + normalized.permanentIceFraction,
      3,
    ),
    surfaceAccessibleLiquidFraction: round(surfaceAccessibleLiquidFraction, 3),
    estimatedMeanOceanDepthKm: round(estimatedMeanOceanDepthKm, 2),
    seafloorPressureGPa: highPressureIce.pressureGPa,
    highPressureIceBand: highPressureIce.band,
    highPressureIceRisk: highPressureIce.highPressureIceRisk,
    highPressureIceLikely: highPressureIce.highPressureIceLikely,
    highPressureIceThresholdDepthsKm: highPressureIce.thresholdDepthsKm,
    ...phaseDiagramHydrosphereFields(highPressureIce, bottomOceanProfile),
    notes,
  };
}
