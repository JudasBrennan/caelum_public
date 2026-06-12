import {
  OVERLAY_MODEL_VERSION,
  clamp,
  compactObject,
  finiteOrNull,
  overlayReason,
  roundTo,
} from "./common.js";

function evidenceScore(inputs) {
  const semiMajorAxisAu = finiteOrNull(inputs.semiMajorAxisAu);
  const insolationEarth = finiteOrNull(inputs.insolationEarth);
  const cmfPct = finiteOrNull(inputs.cmfPct);
  const densityGcm3 = finiteOrNull(inputs.densityGcm3);
  const hHeEnvelopeMassPct = finiteOrNull(inputs.hHeEnvelopeMassPct);
  const closeInScore = Math.max(
    semiMajorAxisAu == null ? 0 : clamp((0.08 - semiMajorAxisAu) / 0.08, 0, 1),
    insolationEarth == null ? 0 : clamp(Math.log10(Math.max(insolationEarth, 1)) / 3.2, 0, 1),
  );
  const denseScore = Math.max(
    cmfPct == null ? 0 : clamp((cmfPct - 45) / 35, 0, 1),
    densityGcm3 == null ? 0 : clamp((densityGcm3 - 5.5) / 4, 0, 1),
  );
  const envelopeScore =
    hHeEnvelopeMassPct == null ? 0.5 : clamp((0.1 - hHeEnvelopeMassPct) / 0.1, 0, 1);
  const explicitScore =
    inputs.strippedEnvelopeCandidate === true || inputs.migratedCloseIn === true ? 1 : 0;
  return clamp(
    closeInScore * 0.34 + denseScore * 0.28 + envelopeScore * 0.2 + explicitScore * 0.18,
    0,
    1,
  );
}

function lossRegime(score) {
  if (score >= 0.82) return "strong stripped-core candidate";
  if (score >= 0.6) return "plausible stripped-envelope remnant";
  return "candidate remnant, ancestry uncertain";
}

export function buildChthonianOverlay(inputs = {}) {
  const score = evidenceScore(inputs);
  const regime = lossRegime(score);
  const hHeEnvelopeMassPct = finiteOrNull(inputs.hHeEnvelopeMassPct);
  const severeEnvelopeLoss = hHeEnvelopeMassPct == null || hHeEnvelopeMassPct < 0.02;
  const reasons = [
    overlayReason(
      "strippedCoreEvidenceScore",
      "Combined orbit, density, and envelope evidence supports a remnant interpretation.",
      `${roundTo(score, 2)} evidence score`,
    ),
  ];
  const warnings = [
    overlayReason(
      "closeInEnvelopeLossWarning",
      "Close-in remnant candidates may have lost prior volatile envelopes.",
      regime,
      "warning",
    ),
  ];

  return {
    modelVersion: OVERLAY_MODEL_VERSION,
    overlayId: "chthonianCandidate",
    summary: regime,
    metrics: compactObject({
      strippedCoreEvidenceScore: roundTo(score, 3),
      semiMajorAxisAu: roundTo(inputs.semiMajorAxisAu, 4),
      insolationEarth: roundTo(inputs.insolationEarth, 2),
      cmfPct: roundTo(inputs.cmfPct, 2),
      densityGcm3: roundTo(inputs.densityGcm3, 3),
      hHeEnvelopeMassPct: roundTo(hHeEnvelopeMassPct, 4),
    }),
    interpretation: compactObject({
      envelopeLossRegime: regime,
      severeEnvelopeLoss,
    }),
    reasons,
    warnings,
  };
}
