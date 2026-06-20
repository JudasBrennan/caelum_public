import { clamp, toFinite } from "../utils.js";

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const number = finiteOrNull(value);
    if (number != null) return number;
  }
  return null;
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

export function getSurfaceOceanCoverageContext(hydrosphere = null) {
  const context = hydrosphere?.surfaceOceanCoverageContext;
  return context && typeof context === "object" && !Array.isArray(context) ? context : null;
}

export function resolveSurfaceOceanFractions(hydrosphere = null) {
  const context = getSurfaceOceanCoverageContext(hydrosphere);
  const liquid = fraction(
    firstFinite(context?.liquidOceanFraction, hydrosphere?.liquidOceanFraction, 0),
    0,
  );
  const permanentIce = fraction(
    firstFinite(context?.permanentIceFraction, hydrosphere?.permanentIceFraction, 0),
    0,
  );
  const steam = fraction(firstFinite(context?.steamFraction, hydrosphere?.steamFraction, 0), 0);
  const land = fraction(
    firstFinite(
      context?.exposedLandFraction,
      context?.landFraction,
      hydrosphere?.landFraction,
      Math.max(0, 1 - liquid - permanentIce - steam),
    ),
    0,
  );
  const waterCoverage = fraction(
    firstFinite(
      context?.waterCoverageFraction,
      hydrosphere?.waterCoverageFraction,
      liquid + permanentIce,
    ),
    liquid + permanentIce,
  );
  const accessibleLiquid = fraction(
    firstFinite(
      context?.surfaceAccessibleLiquidFraction,
      hydrosphere?.surfaceAccessibleLiquidFraction,
      liquid,
    ),
    liquid,
  );

  return {
    liquidOceanFraction: liquid,
    exposedLandFraction: land,
    landFraction: land,
    permanentIceFraction: permanentIce,
    steamFraction: steam,
    waterCoverageFraction: waterCoverage,
    surfaceAccessibleLiquidFraction: accessibleLiquid,
    modelVersion: context?.modelVersion || hydrosphere?.coverageModelVersion || null,
    confidence: context?.confidence || hydrosphere?.coverageConfidence || null,
    source: context?.source || null,
    floodClass: context?.floodClass || null,
    exposedLandClass: context?.exposedLandClass || null,
  };
}

export function resolveMeanOceanDepthKm(hydrosphere = null) {
  const context = getSurfaceOceanCoverageContext(hydrosphere);
  const depth = firstFinite(
    context?.meanOceanDepthKm,
    hydrosphere?.estimatedMeanOceanDepthKm,
    hydrosphere?.estimatedSurfaceOceanDepthKm,
    hydrosphere?.estimatedSubsurfaceOceanDepthKm,
    hydrosphere?.subsurfaceOceanDepthKm,
    hydrosphere?.oceanDepthKm,
  );
  if (depth != null && depth > 0) return depth;
  const equivalentDepthKm = Math.max(toFinite(hydrosphere?.equivalentWaterDepthM, 0), 0) / 1000;
  return equivalentDepthKm > 0 ? equivalentDepthKm : 0;
}

export function hasHighPressureIceCaveat(hydrosphere = null) {
  const context = getSurfaceOceanCoverageContext(hydrosphere);
  const barrierText = String(
    hydrosphere?.rockOceanBarrier ?? context?.rockOceanBarrier ?? "",
  ).toLowerCase();
  return (
    hydrosphere?.highPressureIceBarrier === true ||
    hydrosphere?.highPressureIceRisk === true ||
    hydrosphere?.highPressureIceLikely === true ||
    context?.highPressureIceRisk === true ||
    context?.highPressureIceLikely === true ||
    (barrierText && barrierText !== "none")
  );
}

export function hasRockOceanExchangeBarrier(hydrosphere = null) {
  const context = getSurfaceOceanCoverageContext(hydrosphere);
  const barrierText = String(
    hydrosphere?.rockOceanBarrier ?? context?.rockOceanBarrier ?? "",
  ).toLowerCase();
  return (
    hydrosphere?.highPressureIceBarrier === true ||
    hydrosphere?.highPressureIceLikely === true ||
    context?.highPressureIceLikely === true ||
    hydrosphere?.highPressureIceStable === true ||
    barrierText.includes("likely") ||
    barrierText.includes("present") ||
    barrierText.includes("isolated")
  );
}
