import {
  EARTH_MASS_KG,
  EARTH_RADIUS_KM,
  OVERLAY_MODEL_VERSION,
  clamp,
  compactObject,
  finiteOrNull,
  gravityMs2FromMassRadius,
  overlayReason,
  roundTo,
} from "./common.js";

const WATER_DENSITY_KG_M3 = 1000;
const HIGH_PRESSURE_ICE_GPA = 0.6;
const DEEP_OCEAN_KM = 60;

function inferOceanCoverage(inputs, mode) {
  const liquidOceanFraction = finiteOrNull(inputs.liquidOceanFraction);
  if (liquidOceanFraction != null) return clamp(liquidOceanFraction, 0.01, 1);
  const accessibleLiquid = finiteOrNull(inputs.surfaceAccessibleLiquidFraction);
  if (accessibleLiquid != null) return clamp(accessibleLiquid, 0.01, 1);
  const landFraction = finiteOrNull(inputs.landFraction);
  if (landFraction != null) return clamp(1 - landFraction, 0.01, 1);
  const wmfPct = finiteOrNull(inputs.wmfPct);
  if (wmfPct == null) return mode === "waterWorld" ? 0.95 : 0.7;
  if (wmfPct >= 20) return 0.98;
  if (wmfPct >= 10) return 0.92;
  if (wmfPct >= 1) return 0.75;
  return 0.5;
}

function landSurfaceLikelihood(inputs, mode) {
  const landFraction = finiteOrNull(inputs.landFraction);
  if (landFraction != null) {
    if (landFraction >= 0.15) return "meaningful exposed land";
    if (landFraction >= 0.03) return "island-chain land only";
    if (landFraction > 0) return "very low exposed land";
    return "no exposed land in current hydrosphere model";
  }
  const wmfPct = finiteOrNull(inputs.wmfPct);
  if (wmfPct != null && wmfPct >= 20) return "very low by water inventory";
  if (wmfPct != null && wmfPct >= 10) return "low by water inventory";
  return mode === "waterWorld" ? "low but unresolved" : "uncertain";
}

export function buildOceanWorldOverlay(inputs = {}, { mode = "oceanWorld" } = {}) {
  const wmfPct = finiteOrNull(inputs.wmfPct);
  const massEarth = finiteOrNull(inputs.massEarth);
  const radiusEarth = finiteOrNull(inputs.radiusEarth);
  const oceanCoverage = inferOceanCoverage(inputs, mode);
  const gravityMs2 = gravityMs2FromMassRadius(massEarth, radiusEarth, inputs.gravityG);

  let waterMassKg = null;
  let meanOceanDepthKm = null;
  let seafloorPressureGPa = null;
  if (wmfPct != null && massEarth != null && radiusEarth != null && oceanCoverage > 0) {
    waterMassKg = EARTH_MASS_KG * massEarth * (wmfPct / 100);
    const surfaceAreaM2 = 4 * Math.PI * (EARTH_RADIUS_KM * radiusEarth * 1000) ** 2;
    const oceanAreaM2 = surfaceAreaM2 * oceanCoverage;
    meanOceanDepthKm = waterMassKg / WATER_DENSITY_KG_M3 / oceanAreaM2 / 1000;
    if (gravityMs2 != null) {
      seafloorPressureGPa =
        (WATER_DENSITY_KG_M3 * gravityMs2 * meanOceanDepthKm * 1000) / 1_000_000_000;
    }
  }

  const highPressureIceRisk =
    (seafloorPressureGPa != null && seafloorPressureGPa >= HIGH_PRESSURE_ICE_GPA) ||
    (meanOceanDepthKm != null && meanOceanDepthKm >= DEEP_OCEAN_KM) ||
    (wmfPct != null && wmfPct >= 10);
  const landLikelihood = landSurfaceLikelihood(inputs, mode);
  const reasons = [];
  const warnings = [];

  if (meanOceanDepthKm != null) {
    reasons.push(
      overlayReason(
        "oceanDepthEstimate",
        "Ocean inventory implies a deep global-water layer.",
        `${roundTo(meanOceanDepthKm, meanOceanDepthKm >= 100 ? 0 : 1)} km mean depth estimate`,
      ),
    );
  } else {
    reasons.push(
      overlayReason(
        "oceanDepthEstimateLimited",
        "Ocean depth is unresolved because mass, radius, or water inventory is incomplete.",
      ),
    );
  }
  reasons.push(
    overlayReason(
      "landSurfaceLikelihood",
      "Land-surface likelihood is inferred from water inventory and hydrosphere coverage.",
      landLikelihood,
    ),
  );
  if (highPressureIceRisk) {
    warnings.push(
      overlayReason(
        "highPressureIceLikely",
        "Deep water may form high-pressure ice at the ocean floor.",
        seafloorPressureGPa != null
          ? `${roundTo(seafloorPressureGPa, 2)} GPa estimated seafloor pressure`
          : "Water inventory is high enough for high-pressure ice caution.",
        "warning",
      ),
    );
  }

  return {
    modelVersion: OVERLAY_MODEL_VERSION,
    overlayId: mode,
    summary: highPressureIceRisk
      ? "Deep-water interpretation; high-pressure ice is plausible."
      : "Surface ocean interpretation with no high-pressure ice flag from the current estimate.",
    metrics: compactObject({
      waterMassKg: roundTo(waterMassKg, 0),
      oceanCoverageFraction: roundTo(oceanCoverage, 3),
      meanOceanDepthKm: roundTo(
        meanOceanDepthKm,
        meanOceanDepthKm != null && meanOceanDepthKm >= 100 ? 0 : 2,
      ),
      seafloorPressureGPa: roundTo(seafloorPressureGPa, 3),
    }),
    interpretation: compactObject({
      landSurfaceLikelihood: landLikelihood,
      highPressureIceRisk,
    }),
    reasons,
    warnings,
  };
}
