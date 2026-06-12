import {
  OVERLAY_MODEL_VERSION,
  clamp,
  compactObject,
  finiteOrNull,
  firstFinite,
  overlayReason,
  roundTo,
} from "./common.js";

function retentionScore(inputs) {
  const massEarth = finiteOrNull(inputs.massEarth);
  const radiusEarth = finiteOrNull(inputs.radiusEarth);
  const surfaceTempK = firstFinite(inputs.surfaceTempK, inputs.equilibriumTempK);
  const semiMajorAxisAu = finiteOrNull(inputs.semiMajorAxisAu);
  const wmfPct = finiteOrNull(inputs.wmfPct);
  const massTerm =
    massEarth == null ? 0.12 : clamp(Math.log10(Math.max(massEarth, 0.0001)) + 4, 0, 1) * 0.25;
  const radiusTerm = radiusEarth == null ? 0.08 : clamp(radiusEarth / 0.35, 0, 1) * 0.15;
  const coldTerm = surfaceTempK == null ? 0.2 : clamp((220 - surfaceTempK) / 120, 0, 1) * 0.35;
  const distanceTerm =
    semiMajorAxisAu == null
      ? 0.05
      : clamp(Math.log10(Math.max(semiMajorAxisAu, 1)) / 2, 0, 1) * 0.15;
  const waterTerm = wmfPct == null ? 0 : clamp(wmfPct / 20, 0, 1) * 0.1;
  return clamp(massTerm + radiusTerm + coldTerm + distanceTerm + waterTerm, 0, 1);
}

function retentionClass(score) {
  if (score >= 0.72) return "strong volatile retention";
  if (score >= 0.45) return "moderate volatile retention";
  return "weak volatile retention";
}

function sublimationState(inputs) {
  const tempK = firstFinite(inputs.surfaceTempK, inputs.equilibriumTempK);
  if (tempK == null) return "sublimation unresolved";
  if (tempK <= 120) return "deep-freeze surface";
  if (tempK <= 170) return "surface ice mostly stable";
  if (tempK <= 220) return "slow sublimation risk";
  return "active sublimation risk";
}

function surfaceIceInventory(inputs) {
  const permanentIceFraction = finiteOrNull(inputs.permanentIceFraction);
  if (permanentIceFraction != null) return clamp(permanentIceFraction, 0, 1);
  const wmfPct = finiteOrNull(inputs.wmfPct);
  if (wmfPct == null) return null;
  return clamp(wmfPct / 35, 0.05, 0.95);
}

export function buildIcyDwarfOverlay(inputs = {}) {
  const score = retentionScore(inputs);
  const retention = retentionClass(score);
  const sublimation = sublimationState(inputs);
  const iceInventory = surfaceIceInventory(inputs);
  const reasons = [
    overlayReason(
      "volatileRetentionEstimate",
      "Cold dwarf-scale conditions support retained surface volatiles.",
      retention,
    ),
  ];
  const warnings = [];
  if (sublimation.includes("risk")) {
    warnings.push(
      overlayReason(
        "sublimationRisk",
        "Surface ice may be geologically unstable under the current thermal estimate.",
        sublimation,
        "warning",
      ),
    );
  }

  return {
    modelVersion: OVERLAY_MODEL_VERSION,
    overlayId: "icyDwarf",
    summary: `${retention}; ${sublimation}.`,
    metrics: compactObject({
      volatileRetentionScore: roundTo(score, 3),
      likelySurfaceIceFraction: roundTo(iceInventory, 3),
      surfaceTempK: roundTo(inputs.surfaceTempK, 1),
      equilibriumTempK: roundTo(inputs.equilibriumTempK, 1),
    }),
    interpretation: compactObject({
      volatileRetention: retention,
      sublimationState: sublimation,
      surfaceIceInventory: iceInventory == null ? "unresolved" : "ice-rich surface likely",
    }),
    reasons,
    warnings,
  };
}
