// Shared hydrosphere interpretation for rocky-body habitability metrics.
//
// Stage 2 establishes one authoritative engine-side source of truth for
// surface liquid, land, ice, and steam fractions. The current model is
// intentionally heuristic, but deterministic and internally consistent.

import { clamp, round, toFinite } from "../utils.js";
import { buildSurfaceOceanCoverageContext } from "../contexts/surfaceOceanCoverageContext.js";
import { OCEAN_PRESSURE_MODELS, classifyHighPressureIce } from "./highPressureIce.js";
import { estimateBottomOceanTemperature } from "./oceanThermalProfile.js";
export { hydrosphereStateFromMoon } from "../moon/hydrosphere.js";

const EARTH_MASS_KG = 5.972e24;
const EARTH_RADIUS_KM = 6371;
const WATER_DENSITY_KG_M3 = 1000;

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

function contextWithDetailedHydrosphereFields(context, details) {
  if (!context || typeof context !== "object") return context;
  return {
    ...context,
    highPressureIceBand: details.highPressureIceBand,
    highPressureIceRisk: details.highPressureIceRisk,
    highPressureIceLikely: details.highPressureIceLikely,
    seafloorPressureGPa: details.seafloorPressureGPa,
    meanOceanDepthKm: details.estimatedMeanOceanDepthKm,
    surfaceAccessibleLiquidFraction: details.surfaceAccessibleLiquidFraction,
  };
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
  tectonicContext = null,
  geodynamicsContext = null,
  explicitOceanCoverageFraction = null,
} = {}) {
  const baseline = baselineHydrosphereFractionsForRegime(waterRegime);
  const tempK = Math.max(toFinite(surfaceTempK, 0), 0);
  const regime = baseline.regime;
  const stateClimate = String(climateState || "Stable");
  const resolvedGravityG = gravityGFromMassRadius({ massEarth, radiusKm, gravityG });

  const surfaceOceanCoverageContext = buildSurfaceOceanCoverageContext({
    massEarth,
    radiusKm,
    gravityG,
    wmfPct,
    waterRegime,
    climateState,
    surfaceTempK,
    pressureAtm,
    tectonicContext,
    geodynamicsContext,
    explicitOceanCoverageFraction,
  });
  const equivalentWaterDepthM = toFinite(
    surfaceOceanCoverageContext.equivalentGlobalWaterDepthM,
    estimateEquivalentWaterDepthM({ massEarth, wmfPct, radiusKm }),
  );
  const normalized = {
    liquidOceanFraction: clamp(toFinite(surfaceOceanCoverageContext.liquidOceanFraction, 0), 0, 1),
    landFraction: clamp(toFinite(surfaceOceanCoverageContext.exposedLandFraction, 1), 0, 1),
    permanentIceFraction: clamp(
      toFinite(surfaceOceanCoverageContext.permanentIceFraction, 0),
      0,
      1,
    ),
    steamFraction: clamp(toFinite(surfaceOceanCoverageContext.steamFraction, 0), 0, 1),
  };
  const estimatedMeanOceanDepthKm = Math.max(
    0,
    toFinite(
      surfaceOceanCoverageContext.meanOceanDepthKm,
      meanOceanDepthKmFromEquivalentLayer(equivalentWaterDepthM, normalized.liquidOceanFraction),
    ),
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
          pressureAtm,
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
  const result = {
    regime,
    modelVersion: "hydrosphere-v2",
    coverageModelVersion: surfaceOceanCoverageContext.modelVersion,
    coverageConfidence: surfaceOceanCoverageContext.confidence,
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
    notes: [
      ...new Set([
        ...baseline.notes,
        "hypsometry-coverage-context",
        ...(Array.isArray(surfaceOceanCoverageContext.notes)
          ? surfaceOceanCoverageContext.notes
          : []),
      ]),
    ],
  };
  return {
    ...result,
    surfaceOceanCoverageContext: contextWithDetailedHydrosphereFields(
      surfaceOceanCoverageContext,
      result,
    ),
  };
}
