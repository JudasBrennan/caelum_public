import { clamp, round, toFinite } from "../utils.js";
import { classifyWaterPhaseAtSeafloor } from "./waterPhaseDiagram.js";

export const HIGH_PRESSURE_ICE_BANDS = Object.freeze({
  cautionPa: 300e6,
  plausiblePa: 600e6,
  iceViLikelyPa: 1.1e9,
  iceViiPlausiblePa: 2.2e9,
});

const DEFAULT_WATER_DENSITY_KG_M3 = 1000;
const EARTH_GRAVITY_MS2 = 9.80665;

export const OCEAN_PRESSURE_MODELS = Object.freeze({
  constantDensity: "constant-density",
  effectiveDensity: "effective-density",
});

export const OCEAN_COLUMN_PRESSURE_DEFAULTS = Object.freeze({
  densityKgM3: DEFAULT_WATER_DENSITY_KG_M3,
  maxDensityMultiplier: 1.12,
  compressionScalePressurePa: 2e9,
});

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function gravityMs2FromGravityG(gravityG) {
  const gravity = finitePositive(gravityG);
  return gravity == null ? null : gravity * EARTH_GRAVITY_MS2;
}

function roundNullable(value, digits = 3) {
  const number = Number(value);
  return Number.isFinite(number) ? round(number, digits) : null;
}

function normalizePressureModel(pressureModel) {
  return pressureModel === OCEAN_PRESSURE_MODELS.effectiveDensity
    ? OCEAN_PRESSURE_MODELS.effectiveDensity
    : OCEAN_PRESSURE_MODELS.constantDensity;
}

export function pressurePaFromDepthKm({
  depthKm,
  gravityG,
  densityKgM3 = DEFAULT_WATER_DENSITY_KG_M3,
} = {}) {
  const depth = finitePositive(depthKm);
  const gravityMs2 = gravityMs2FromGravityG(gravityG);
  const density = finitePositive(densityKgM3);
  if (depth == null || gravityMs2 == null || density == null) return null;
  return density * gravityMs2 * depth * 1000;
}

export function estimateOceanColumnPressurePa({
  depthKm,
  gravityG,
  densityKgM3 = OCEAN_COLUMN_PRESSURE_DEFAULTS.densityKgM3,
  pressureModel = OCEAN_PRESSURE_MODELS.constantDensity,
  maxDensityMultiplier = OCEAN_COLUMN_PRESSURE_DEFAULTS.maxDensityMultiplier,
  compressionScalePressurePa = OCEAN_COLUMN_PRESSURE_DEFAULTS.compressionScalePressurePa,
} = {}) {
  const model = normalizePressureModel(pressureModel);
  const density = finitePositive(densityKgM3);
  const constantDensityPressurePa = pressurePaFromDepthKm({ depthKm, gravityG, densityKgM3 });
  if (constantDensityPressurePa == null || density == null) {
    return {
      pressurePa: null,
      pressureGPa: null,
      pressureModel: model,
      constantDensityPressurePa: null,
      constantDensityPressureGPa: null,
      effectiveDensityKgM3: null,
      densityMultiplier: null,
    };
  }

  let densityMultiplier = 1;
  if (model === OCEAN_PRESSURE_MODELS.effectiveDensity) {
    const maxMultiplier = Math.max(finitePositive(maxDensityMultiplier) ?? 1, 1);
    const scalePressurePa =
      finitePositive(compressionScalePressurePa) ??
      OCEAN_COLUMN_PRESSURE_DEFAULTS.compressionScalePressurePa;
    const compressionFraction =
      constantDensityPressurePa / (constantDensityPressurePa + scalePressurePa);
    densityMultiplier = 1 + (maxMultiplier - 1) * compressionFraction;
  }

  const pressurePa = constantDensityPressurePa * densityMultiplier;
  return {
    pressurePa,
    pressureGPa: pressurePa / 1e9,
    pressureModel: model,
    constantDensityPressurePa,
    constantDensityPressureGPa: constantDensityPressurePa / 1e9,
    effectiveDensityKgM3: density * densityMultiplier,
    densityMultiplier,
  };
}

export function depthKmForPressurePa({
  pressurePa,
  gravityG,
  densityKgM3 = DEFAULT_WATER_DENSITY_KG_M3,
} = {}) {
  const pressure = finitePositive(pressurePa);
  const gravityMs2 = gravityMs2FromGravityG(gravityG);
  const density = finitePositive(densityKgM3);
  if (pressure == null || gravityMs2 == null || density == null) return Infinity;
  return pressure / (density * gravityMs2) / 1000;
}

function thresholdDepthsKm(gravityG, densityKgM3) {
  return {
    caution: roundNullable(
      depthKmForPressurePa({
        pressurePa: HIGH_PRESSURE_ICE_BANDS.cautionPa,
        gravityG,
        densityKgM3,
      }),
      1,
    ),
    plausible: roundNullable(
      depthKmForPressurePa({
        pressurePa: HIGH_PRESSURE_ICE_BANDS.plausiblePa,
        gravityG,
        densityKgM3,
      }),
      1,
    ),
    iceViLikely: roundNullable(
      depthKmForPressurePa({
        pressurePa: HIGH_PRESSURE_ICE_BANDS.iceViLikelyPa,
        gravityG,
        densityKgM3,
      }),
      1,
    ),
    iceViiPlausible: roundNullable(
      depthKmForPressurePa({
        pressurePa: HIGH_PRESSURE_ICE_BANDS.iceViiPlausiblePa,
        gravityG,
        densityKgM3,
      }),
      1,
    ),
  };
}

function inferBand(pressurePa) {
  if (pressurePa >= HIGH_PRESSURE_ICE_BANDS.iceViiPlausiblePa) return "ice-vii";
  if (pressurePa >= HIGH_PRESSURE_ICE_BANDS.iceViLikelyPa) return "likely";
  if (pressurePa >= HIGH_PRESSURE_ICE_BANDS.plausiblePa) return "plausible";
  if (pressurePa >= HIGH_PRESSURE_ICE_BANDS.cautionPa) return "caution";
  return "none";
}

function labelForBand(band) {
  switch (band) {
    case "ice-vii":
      return "Ice VII plausible";
    case "likely":
      return "Likely";
    case "plausible":
      return "Plausible";
    case "caution":
      return "Caution";
    default:
      return "No pressure flag";
  }
}

function reasonCodeForBand(band) {
  switch (band) {
    case "ice-vii":
      return "iceViiPlausible";
    case "likely":
      return "highPressureIceLikely";
    case "plausible":
      return "highPressureIcePlausible";
    case "caution":
      return "highPressureIceCaution";
    default:
      return "highPressureIceBelowThreshold";
  }
}

function explanationForBand(band, { pressureGPa, plausibleDepthKm }) {
  const pressureText = Number.isFinite(pressureGPa) ? `${pressureGPa.toFixed(2)} GPa` : "";
  const thresholdText = Number.isFinite(plausibleDepthKm)
    ? ` The 0.6 GPa threshold is reached near ${plausibleDepthKm.toFixed(1)} km at this gravity.`
    : "";
  switch (band) {
    case "ice-vii":
      return `Estimated seafloor pressure is ${pressureText}; Ice VII regime pressures are plausible at depth.`;
    case "likely":
      return `Estimated seafloor pressure is ${pressureText}; Ice VI style high-pressure ice is likely at depth if the lower ocean is cool enough.`;
    case "plausible":
      return `Estimated seafloor pressure is ${pressureText}; high-pressure ice is plausible at depth, depending on ocean temperature.`;
    case "caution":
      return `Estimated seafloor pressure is ${pressureText}; high-pressure ice is possible only under cold deep-ocean conditions.${thresholdText}`;
    default:
      return `Estimated seafloor pressure is ${pressureText || "below the pressure bands"}. No high-pressure ice flag is raised from pressure alone.${thresholdText}`;
  }
}

function bottomTempUncertaintyK(bottomTempK, bottomTempRangeK) {
  const temp = toFinite(bottomTempK, NaN);
  if (!Number.isFinite(temp)) return undefined;
  let min = null;
  let max = null;
  if (Array.isArray(bottomTempRangeK)) {
    min = toFinite(bottomTempRangeK[0], NaN);
    max = toFinite(bottomTempRangeK[1], NaN);
  } else if (bottomTempRangeK && typeof bottomTempRangeK === "object") {
    min = toFinite(bottomTempRangeK.minBottomTempK ?? bottomTempRangeK.min, NaN);
    max = toFinite(bottomTempRangeK.maxBottomTempK ?? bottomTempRangeK.max, NaN);
  }
  const deltas = [min, max]
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.abs(value - temp));
  return deltas.length ? Math.max(...deltas, 0) : undefined;
}

function phaseBandFromResult(phaseResult) {
  if (!phaseResult?.highPressureIceStable) {
    return phaseResult?.reasonCode === "nearLiquidusBoundary" ? "caution" : "none";
  }
  if (phaseResult.confidence !== "high") return "plausible";
  return phaseResult.highPressureIcePhase === "ice-vii" ? "ice-vii" : "likely";
}

function rockOceanBarrierFromPhase({ band, phaseResult }) {
  if (phaseResult?.seafloorPhase === "unknown") return "unknown";
  if (phaseResult?.seafloorPhase === "supercritical-fluid") return "none";
  switch (band) {
    case "ice-vii":
    case "likely":
      return "likely";
    case "plausible":
      return "plausible";
    case "caution":
      return "possible";
    default:
      return "none";
  }
}

function phaseDiagramExplanation({ phaseResult, pressureGPa, band }) {
  const boundary = phaseResult.phaseBoundary;
  const pressureText = Number.isFinite(pressureGPa) ? `${pressureGPa.toFixed(2)} GPa` : "unknown";
  const tempText = Number.isFinite(phaseResult.bottomTempK)
    ? `${phaseResult.bottomTempK.toFixed(1)} K`
    : "unknown";
  if (!boundary) {
    return `${phaseResult.explanation} Estimated seafloor pressure is ${pressureText}; estimated bottom-ocean temperature is ${tempText}.`;
  }
  const boundaryPressureText = Number.isFinite(boundary.pressureGPa)
    ? `${boundary.pressureGPa.toFixed(2)} GPa`
    : "unknown";
  const prefix =
    band === "none"
      ? "Seafloor pressure is below"
      : band === "caution"
        ? "Seafloor pressure is close to"
        : "Seafloor pressure is above";
  return `${prefix} the ${boundary.phase} liquidus boundary for the estimated bottom-ocean temperature. Estimated seafloor pressure is ${pressureText}; ${boundary.phase} boundary is near ${boundaryPressureText} at ${tempText}.`;
}

export function classifyHighPressureIce({
  seafloorPressurePa,
  depthKm,
  gravityG,
  densityKgM3 = DEFAULT_WATER_DENSITY_KG_M3,
  pressureModel = OCEAN_PRESSURE_MODELS.constantDensity,
  surfaceTempK,
  bottomTempK,
  bottomTempRangeK,
  usePhaseDiagram = true,
  salinityPct,
  climateState,
  steamFraction,
  permanentIceFraction,
} = {}) {
  const directPressure = finitePositive(seafloorPressurePa);
  const pressureEstimate = estimateOceanColumnPressurePa({
    depthKm,
    gravityG,
    densityKgM3,
    pressureModel,
  });
  const resolvedPressureModel = pressureEstimate.pressureModel;
  const pressurePa = directPressure ?? pressureEstimate.pressurePa ?? 0;
  const pressureGPa = pressurePa / 1e9;
  const thresholdDepths = thresholdDepthsKm(gravityG, densityKgM3);
  const climate = String(climateState || "").trim();
  const tempK = toFinite(surfaceTempK, 0);
  const coldSupport =
    (tempK > 0 && tempK < 273) ||
    climate === "Snowball" ||
    clamp(toFinite(permanentIceFraction, 0), 0, 1) >= 0.5;
  const hotSuppression =
    climate === "Runaway greenhouse" ||
    clamp(toFinite(steamFraction, 0), 0, 1) >= 0.5 ||
    (tempK > 0 && tempK >= 373);

  let band = inferBand(pressurePa);
  if (hotSuppression && band === "caution") band = "none";
  const pressureGPaRounded = roundNullable(pressureGPa, 3) ?? 0;
  const bottomTemp = toFinite(bottomTempK, NaN);
  const canUsePhaseDiagram =
    usePhaseDiagram !== false && pressurePa > 0 && Number.isFinite(bottomTemp) && bottomTemp > 0;
  if (canUsePhaseDiagram) {
    // Temperature-constrained worlds use the IAPWS liquidus comparison. The older pressure
    // bands below remain only as a fallback when bottom temperature is unknown.
    const phaseResult = classifyWaterPhaseAtSeafloor({
      pressurePa,
      bottomTempK: bottomTemp,
      salinityPct,
      uncertaintyTempK: bottomTempUncertaintyK(bottomTemp, bottomTempRangeK),
    });
    const phaseBand = phaseBandFromResult(phaseResult);
    const rockOceanBarrier = rockOceanBarrierFromPhase({
      band: phaseBand,
      phaseResult,
    });
    const phaseLikely = phaseBand === "likely" || phaseBand === "ice-vii";
    return {
      band: phaseBand,
      label: labelForBand(phaseBand),
      pressurePa: roundNullable(pressurePa, 0) ?? 0,
      pressureGPa: pressureGPaRounded,
      pressureModel: resolvedPressureModel,
      constantDensityPressureGPa: roundNullable(pressureEstimate.constantDensityPressureGPa),
      effectiveDensityKgM3: roundNullable(pressureEstimate.effectiveDensityKgM3, 1),
      densityMultiplier: roundNullable(pressureEstimate.densityMultiplier, 4),
      thresholdDepthsKm: thresholdDepths,
      coldSupport,
      hotSuppression,
      classificationMode: "phase-diagram",
      seafloorPhase: phaseResult.seafloorPhase,
      liquidusPressureGPa: phaseResult.phaseBoundary?.pressureGPa ?? null,
      liquidusBoundaryPhase: phaseResult.phaseBoundary?.phase ?? null,
      highPressureIceStable: phaseResult.highPressureIceStable,
      highPressureIcePhase: phaseResult.highPressureIcePhase,
      rockOceanBarrier,
      phaseDiagramConfidence: phaseResult.confidence,
      highPressureIceRisk: phaseBand !== "none",
      highPressureIceLikely: phaseLikely,
      reasonCode:
        phaseBand === "none"
          ? phaseResult.reasonCode
          : phaseBand === "ice-vii"
            ? "iceViiStable"
            : reasonCodeForBand(phaseBand),
      explanation: phaseDiagramExplanation({
        phaseResult,
        pressureGPa: pressureGPaRounded,
        band: phaseBand,
      }),
    };
  }

  return {
    band,
    label: labelForBand(band),
    pressurePa: roundNullable(pressurePa, 0) ?? 0,
    pressureGPa: pressureGPaRounded,
    pressureModel: resolvedPressureModel,
    constantDensityPressureGPa: roundNullable(pressureEstimate.constantDensityPressureGPa),
    effectiveDensityKgM3: roundNullable(pressureEstimate.effectiveDensityKgM3, 1),
    densityMultiplier: roundNullable(pressureEstimate.densityMultiplier, 4),
    thresholdDepthsKm: thresholdDepths,
    coldSupport,
    hotSuppression,
    classificationMode: "pressure-band",
    seafloorPhase: null,
    liquidusPressureGPa: null,
    liquidusBoundaryPhase: null,
    highPressureIceStable: false,
    highPressureIcePhase: null,
    rockOceanBarrier: band === "none" ? "none" : band === "caution" ? "possible" : "plausible",
    phaseDiagramConfidence: null,
    highPressureIceRisk: band !== "none",
    highPressureIceLikely: band === "likely" || band === "ice-vii",
    reasonCode: reasonCodeForBand(band),
    explanation: `Pressure-only estimate: ${explanationForBand(band, {
      pressureGPa: pressureGPaRounded,
      plausibleDepthKm: thresholdDepths.plausible,
    })}`,
  };
}
