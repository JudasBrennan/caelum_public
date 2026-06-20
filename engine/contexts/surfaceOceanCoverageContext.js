import { classifyHighPressureIce, OCEAN_PRESSURE_MODELS } from "../habitability/highPressureIce.js";
import { waterBoilingK } from "../planet/composition.js";
import { clamp, round, toFinite } from "../utils.js";

const MODEL_VERSION = "surface-ocean-coverage-v1";
const EARTH_MASS_KG = 5.972e24;
const EARTH_RADIUS_KM = 6371;
const EARTH_OCEAN_EQUIVALENT_DEPTH_M = 2700;
const MIN_LIQUID_PRESSURE_ATM = 0.006;
const WATER_DENSITY_KG_M3 = 1000;
const GRAVITY_MS2_EARTH = 9.80665;

export const EARTH_HYPSOMETRY_FILL_TABLE = Object.freeze([
  [0, 0],
  [10, 0.005],
  [100, 0.04],
  [500, 0.18],
  [1000, 0.35],
  [2000, 0.58],
  [2700, 0.71],
  [4000, 0.82],
  [8000, 0.94],
  [16000, 0.985],
  [30000, 0.995],
]);

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function optionalNumber(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function estimateEquivalentWaterDepthM({ massEarth, wmfPct, radiusKm } = {}) {
  const bodyMassEarth = finiteNonNegative(massEarth, 0);
  const waterMassFraction = fraction(toFinite(wmfPct, 0) / 100, 0);
  const radiusMeters = finiteNonNegative(radiusKm, 0) * 1000;
  if (bodyMassEarth <= 0 || waterMassFraction <= 0 || radiusMeters <= 0) return 0;

  const waterMassKg = bodyMassEarth * EARTH_MASS_KG * waterMassFraction;
  const surfaceAreaM2 = 4 * Math.PI * radiusMeters ** 2;
  if (surfaceAreaM2 <= 0) return 0;

  return waterMassKg / (surfaceAreaM2 * WATER_DENSITY_KG_M3);
}

function normalizeFractions(state) {
  const liquid = fraction(state.liquidOceanFraction, 0);
  const land = fraction(state.exposedLandFraction ?? state.landFraction, 0);
  const ice = fraction(state.permanentIceFraction, 0);
  const steam = fraction(state.steamFraction, 0);
  const total = liquid + land + ice + steam;
  if (total <= 0) {
    return {
      liquidOceanFraction: 0,
      exposedLandFraction: 1,
      permanentIceFraction: 0,
      steamFraction: 0,
    };
  }
  return {
    liquidOceanFraction: liquid / total,
    exposedLandFraction: land / total,
    permanentIceFraction: ice / total,
    steamFraction: steam / total,
  };
}

function gravityGFromMassRadius({ massEarth, radiusKm, gravityG } = {}) {
  const explicit = optionalNumber(gravityG);
  if (explicit != null && explicit > 0) return explicit;
  const mass = finiteNonNegative(massEarth, 0);
  const radiusEarth = finiteNonNegative(radiusKm, 0) / EARTH_RADIUS_KM;
  if (mass <= 0 || radiusEarth <= 0) return null;
  return mass / radiusEarth ** 2;
}

function tectonicReliefFactor({ tectonicContext = null, geodynamicsContext = null, gravityG }) {
  const text = [
    tectonicContext?.tectonicRegime,
    tectonicContext?.regime,
    tectonicContext?.plateRegime,
    tectonicContext?.tectonicsClass,
    geodynamicsContext?.tectonicRegime,
    geodynamicsContext?.regime,
    geodynamicsContext?.lidRegime,
    geodynamicsContext?.outputs?.tectonicRegime,
    geodynamicsContext?.outputs?.lidRegime,
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("stagnant")) return { factor: 0.8, source: "stagnant-lid" };
  if (text.includes("mobile") || text.includes("plate") || text.includes("earth")) {
    return { factor: 1, source: "mobile-lid" };
  }
  if (finiteNonNegative(gravityG, 1) < 0.45) {
    return { factor: 1.2, source: "low-gravity-high-relief" };
  }
  return { factor: 1, source: "unknown-tectonic-relief" };
}

function confidenceFromInputs({
  supported,
  source,
  hasMass,
  hasRadius,
  hasWater,
  hasClimate,
  hasPressure,
  reliefSource,
}) {
  if (!supported) return "low";
  if (source === "manual-override") return hasWater ? "medium" : "low";
  if (source === "dry") return hasMass && hasRadius ? "high" : "medium";
  const complete = hasMass && hasRadius && hasWater && hasClimate && hasPressure;
  if (complete && reliefSource !== "unknown-tectonic-relief") return "high";
  if (complete) return "medium";
  return "low";
}

function classFromCoverage(fill) {
  const coverage = fraction(fill, 0);
  if (coverage <= 0) return "dry";
  if (coverage < 0.08) return "dune-shallow";
  if (coverage < 0.35) return "basin-limited";
  if (coverage < 0.62) return "continent-ocean";
  if (coverage < 0.82) return "earth-like-basin-fill";
  if (coverage < 0.94) return "ocean-dominated";
  return "waterworld";
}

function exposedLandClassFromFraction(exposedLandFraction) {
  const land = fraction(exposedLandFraction, 0);
  if (land >= 0.65) return "continent-dominated";
  if (land >= 0.3) return "substantial exposed land";
  if (land >= 0.08) return "limited exposed land";
  if (land > 0) return "trace exposed land";
  return "no exposed land";
}

function floodClassFromCoverage(coverage) {
  const fillClass = classFromCoverage(coverage);
  if (fillClass === "dry") return "dry";
  if (fillClass === "dune-shallow") return "dune seas";
  if (fillClass === "basin-limited") return "shallow basins";
  if (fillClass === "continent-ocean") return "continent-ocean";
  if (fillClass === "earth-like-basin-fill") return "earth-like ocean coverage";
  if (fillClass === "ocean-dominated") return "ocean dominated";
  return "waterworld";
}

function seafloorPressureGPa({ meanOceanDepthKm, gravityG }) {
  const depthM = finiteNonNegative(meanOceanDepthKm, 0) * 1000;
  if (depthM <= 0) return 0;
  const gravityMs2 = finiteNonNegative(gravityG, 1) * GRAVITY_MS2_EARTH;
  return round((WATER_DENSITY_KG_M3 * gravityMs2 * depthM) / 1e9, 3);
}

function meanOceanDepthKmFromCoverage(equivalentGlobalWaterDepthM, liquidCoverage) {
  const depthKm = finiteNonNegative(equivalentGlobalWaterDepthM, 0) / 1000;
  const coverage = fraction(liquidCoverage, 0);
  if (depthKm <= 0 || coverage <= 0) return 0;
  return depthKm / coverage;
}

function applyClimateTransfer({
  basinFillFraction,
  climateState,
  surfaceTempK,
  pressureAtm,
  notes,
}) {
  const climate = String(climateState || "Stable");
  const tempK = finiteNonNegative(surfaceTempK, 0);
  const pressure = finiteNonNegative(pressureAtm, 0);
  const boilingK = waterBoilingK(Math.max(pressure, MIN_LIQUID_PRESSURE_ATM));
  const state = {
    liquidOceanFraction: basinFillFraction,
    exposedLandFraction: Math.max(0, 1 - basinFillFraction),
    permanentIceFraction: 0,
    steamFraction: 0,
  };

  if (basinFillFraction <= 0) return state;

  if (/runaway/i.test(climate)) {
    state.steamFraction = basinFillFraction;
    state.liquidOceanFraction = 0;
    notes.push("runaway-greenhouse-steam-coverage");
    return state;
  }
  if (/snowball/i.test(climate)) {
    state.permanentIceFraction = basinFillFraction;
    state.liquidOceanFraction = 0;
    notes.push("snowball-basin-fill-to-ice");
    return state;
  }
  if (pressure < MIN_LIQUID_PRESSURE_ATM) {
    if (tempK > 0 && tempK < 273) {
      state.permanentIceFraction = basinFillFraction;
      notes.push("low-pressure-basin-fill-to-ice");
    } else {
      state.steamFraction = basinFillFraction;
      notes.push("low-pressure-basin-fill-to-vapor");
    }
    state.liquidOceanFraction = 0;
    return state;
  }
  if (tempK > 0 && tempK < 273) {
    state.permanentIceFraction = basinFillFraction;
    state.liquidOceanFraction = 0;
    notes.push("subfreezing-basin-fill-to-ice");
    return state;
  }
  if (tempK > 0 && tempK > boilingK) {
    state.steamFraction = basinFillFraction;
    state.liquidOceanFraction = 0;
    notes.push("boiling-basin-fill-to-steam");
    return state;
  }
  if (/moist greenhouse/i.test(climate)) {
    const steamShare = basinFillFraction * 0.35;
    state.steamFraction = steamShare;
    state.liquidOceanFraction = Math.max(0, basinFillFraction - steamShare);
    notes.push("moist-greenhouse-partial-steam");
  }
  return state;
}

export function interpolateHypsometryFillFraction(
  effectiveDepthM,
  table = EARTH_HYPSOMETRY_FILL_TABLE,
) {
  const depth = finiteNonNegative(effectiveDepthM, 0);
  const points = Array.isArray(table) ? table : EARTH_HYPSOMETRY_FILL_TABLE;
  if (!points.length) return 0;
  const sorted = [...points].sort((left, right) => Number(left[0]) - Number(right[0]));
  if (depth <= Number(sorted[0][0])) return fraction(sorted[0][1], 0);
  for (let i = 1; i < sorted.length; i += 1) {
    const [leftDepth, leftFill] = sorted[i - 1].map(Number);
    const [rightDepth, rightFill] = sorted[i].map(Number);
    if (depth <= rightDepth) {
      const span = Math.max(rightDepth - leftDepth, 1e-9);
      const t = (depth - leftDepth) / span;
      return clamp(leftFill + t * (rightFill - leftFill), 0, 1);
    }
  }
  return fraction(sorted[sorted.length - 1][1], 0);
}

export function estimateReliefScaleEarth({
  gravityG = null,
  massEarth = null,
  radiusKm = null,
  tectonicContext = null,
  geodynamicsContext = null,
} = {}) {
  const resolvedGravityG = gravityGFromMassRadius({ gravityG, massEarth, radiusKm });
  if (resolvedGravityG == null) {
    return {
      reliefScaleEarth: 1,
      gravityG: null,
      tectonicReliefFactor: 1,
      tectonicReliefSource: "missing-gravity",
      confidence: "low",
      assumptions: ["earth-relief-fallback"],
    };
  }
  const tectonic = tectonicReliefFactor({
    tectonicContext,
    geodynamicsContext,
    gravityG: resolvedGravityG,
  });
  const reliefScaleEarth = clamp(tectonic.factor * resolvedGravityG ** -0.45, 0.45, 2.5);
  return {
    reliefScaleEarth: round(reliefScaleEarth, 3),
    gravityG: round(resolvedGravityG, 3),
    tectonicReliefFactor: tectonic.factor,
    tectonicReliefSource: tectonic.source,
    confidence: tectonic.source === "unknown-tectonic-relief" ? "medium" : "high",
    assumptions: [
      "relief-capacity-scaling-only",
      `tectonic-relief:${tectonic.source}`,
      "gravity-muted-relief-proxy",
    ],
  };
}

export function buildSurfaceOceanCoverageContext({
  massEarth = null,
  radiusKm = null,
  gravityG = null,
  wmfPct = null,
  waterRegime = null,
  climateState = "Stable",
  surfaceTempK = null,
  pressureAtm = null,
  tectonicContext = null,
  geodynamicsContext = null,
  explicitOceanCoverageFraction = null,
} = {}) {
  const notes = [];
  const assumptions = ["earth-hypsometry-proxy", "global-average-basin-fill"];
  const hasMass = finiteNonNegative(massEarth, 0) > 0;
  const hasRadius = finiteNonNegative(radiusKm, 0) > 0;
  const waterMassInput = optionalNumber(wmfPct);
  const hasWaterInput = waterMassInput != null;
  const waterMassPct = finiteNonNegative(waterMassInput, 0);
  const hasWater = waterMassPct > 0;
  const hasClimate = surfaceTempK != null && surfaceTempK !== "" && climateState != null;
  const hasPressure = pressureAtm != null && pressureAtm !== "";
  const manualCoverage = optionalNumber(explicitOceanCoverageFraction);
  const manualSource = manualCoverage != null;
  const relief = estimateReliefScaleEarth({
    gravityG,
    massEarth,
    radiusKm,
    tectonicContext,
    geodynamicsContext,
  });
  assumptions.push(...relief.assumptions);

  if (!hasMass || !hasRadius) {
    notes.push(!hasMass ? "missing-mass" : "missing-radius");
    return {
      modelVersion: MODEL_VERSION,
      supported: false,
      source: "unsupported",
      equivalentGlobalWaterDepthM: 0,
      surfaceWaterInventoryEarthOceans: 0,
      reliefScaleEarth: relief.reliefScaleEarth,
      basinCapacityClass: "unsupported",
      basinFillFraction: 0,
      liquidOceanFraction: 0,
      exposedLandFraction: 1,
      landFraction: 1,
      permanentIceFraction: 0,
      steamFraction: 0,
      waterCoverageFraction: 0,
      surfaceAccessibleLiquidFraction: 0,
      meanOceanDepthKm: 0,
      seafloorPressureGPa: 0,
      floodClass: "unsupported",
      exposedLandClass: "unknown",
      confidence: "low",
      assumptions,
      notes,
    };
  }

  if (!hasWaterInput && !manualSource && String(waterRegime || "").toLowerCase() !== "dry") {
    notes.push("missing-water-inventory");
    return {
      modelVersion: MODEL_VERSION,
      supported: false,
      source: "unsupported",
      equivalentGlobalWaterDepthM: 0,
      surfaceWaterInventoryEarthOceans: 0,
      reliefScaleEarth: relief.reliefScaleEarth,
      gravityG: relief.gravityG,
      tectonicReliefFactor: relief.tectonicReliefFactor,
      tectonicReliefSource: relief.tectonicReliefSource,
      basinCapacityClass: "unsupported",
      basinFillFraction: 0,
      liquidOceanFraction: 0,
      exposedLandFraction: 1,
      landFraction: 1,
      permanentIceFraction: 0,
      steamFraction: 0,
      waterCoverageFraction: 0,
      surfaceAccessibleLiquidFraction: 0,
      meanOceanDepthKm: 0,
      seafloorPressureGPa: 0,
      floodClass: "unsupported",
      exposedLandClass: "unknown",
      confidence: "low",
      assumptions,
      notes,
    };
  }

  const equivalentGlobalWaterDepthM = estimateEquivalentWaterDepthM({
    massEarth,
    wmfPct: waterMassPct,
    radiusKm,
  });
  const surfaceWaterInventoryEarthOceans = round(
    equivalentGlobalWaterDepthM / EARTH_OCEAN_EQUIVALENT_DEPTH_M,
    3,
  );
  const basinFillFraction = manualSource
    ? fraction(manualCoverage, 0)
    : interpolateHypsometryFillFraction(
        equivalentGlobalWaterDepthM / Math.max(relief.reliefScaleEarth, 1e-6),
      );

  if (!hasWater && !manualSource) {
    notes.push("no-water-inventory");
    return {
      modelVersion: MODEL_VERSION,
      supported: true,
      source: "dry",
      equivalentGlobalWaterDepthM: 0,
      surfaceWaterInventoryEarthOceans: 0,
      reliefScaleEarth: relief.reliefScaleEarth,
      gravityG: relief.gravityG,
      tectonicReliefFactor: relief.tectonicReliefFactor,
      tectonicReliefSource: relief.tectonicReliefSource,
      basinCapacityClass: "dry",
      basinFillFraction: 0,
      liquidOceanFraction: 0,
      exposedLandFraction: 1,
      landFraction: 1,
      permanentIceFraction: 0,
      steamFraction: 0,
      waterCoverageFraction: 0,
      surfaceAccessibleLiquidFraction: 0,
      meanOceanDepthKm: 0,
      seafloorPressureGPa: 0,
      highPressureIceBand: "none",
      highPressureIceRisk: false,
      highPressureIceLikely: false,
      floodClass: "dry",
      exposedLandClass: "continent-dominated",
      confidence: confidenceFromInputs({
        supported: true,
        source: "dry",
        hasMass,
        hasRadius,
        hasWater,
        hasClimate,
        hasPressure,
        reliefSource: relief.tectonicReliefSource,
      }),
      assumptions,
      notes,
    };
  }

  if (!hasWater && !manualSource) notes.push("zero-water-mass-fraction");
  if (manualSource) {
    notes.push("manual-ocean-coverage-override");
    assumptions.push("coverage-authoring-override");
  }

  const climateTransferred = normalizeFractions(
    applyClimateTransfer({
      basinFillFraction,
      climateState,
      surfaceTempK,
      pressureAtm,
      notes,
    }),
  );
  const meanOceanDepthKm = meanOceanDepthKmFromCoverage(
    equivalentGlobalWaterDepthM,
    climateTransferred.liquidOceanFraction,
  );
  const pressureGPa = seafloorPressureGPa({
    meanOceanDepthKm,
    gravityG: relief.gravityG,
  });
  const highPressureIce = classifyHighPressureIce({
    depthKm: meanOceanDepthKm,
    gravityG: relief.gravityG,
    pressureModel: OCEAN_PRESSURE_MODELS.effectiveDensity,
    surfaceTempK: finiteNonNegative(surfaceTempK, 0),
    climateState,
    steamFraction: climateTransferred.steamFraction,
    permanentIceFraction: climateTransferred.permanentIceFraction,
  });
  if (meanOceanDepthKm >= 30 || highPressureIce.highPressureIceRisk) {
    notes.push("deep-ocean-pressure-caveat");
  }

  const waterCoverageFraction =
    climateTransferred.liquidOceanFraction + climateTransferred.permanentIceFraction;
  const surfaceAccessibleLiquidFraction = /runaway|snowball/i.test(String(climateState || ""))
    ? 0
    : climateTransferred.liquidOceanFraction;
  const source = manualSource ? "manual-override" : hasWater ? "inferred" : "dry";
  const confidence = confidenceFromInputs({
    supported: true,
    source,
    hasMass,
    hasRadius,
    hasWater,
    hasClimate,
    hasPressure,
    reliefSource: relief.tectonicReliefSource,
  });

  return {
    modelVersion: MODEL_VERSION,
    supported: true,
    source,
    equivalentGlobalWaterDepthM: round(equivalentGlobalWaterDepthM, 1),
    surfaceWaterInventoryEarthOceans,
    reliefScaleEarth: relief.reliefScaleEarth,
    gravityG: relief.gravityG,
    tectonicReliefFactor: relief.tectonicReliefFactor,
    tectonicReliefSource: relief.tectonicReliefSource,
    basinCapacityClass: classFromCoverage(basinFillFraction),
    basinFillFraction: round(basinFillFraction, 3),
    liquidOceanFraction: round(climateTransferred.liquidOceanFraction, 3),
    exposedLandFraction: round(climateTransferred.exposedLandFraction, 3),
    landFraction: round(climateTransferred.exposedLandFraction, 3),
    permanentIceFraction: round(climateTransferred.permanentIceFraction, 3),
    steamFraction: round(climateTransferred.steamFraction, 3),
    waterCoverageFraction: round(waterCoverageFraction, 3),
    surfaceAccessibleLiquidFraction: round(surfaceAccessibleLiquidFraction, 3),
    meanOceanDepthKm: round(meanOceanDepthKm, 2),
    seafloorPressureGPa: pressureGPa,
    highPressureIceBand: highPressureIce.band,
    highPressureIceRisk: highPressureIce.highPressureIceRisk,
    highPressureIceLikely: highPressureIce.highPressureIceLikely,
    floodClass: floodClassFromCoverage(basinFillFraction),
    exposedLandClass: exposedLandClassFromFraction(climateTransferred.exposedLandFraction),
    confidence,
    assumptions,
    notes,
  };
}
