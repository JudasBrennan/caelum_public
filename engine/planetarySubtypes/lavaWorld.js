import {
  OVERLAY_MODEL_VERSION,
  clamp,
  compactObject,
  finiteOrNull,
  overlayReason,
  roundTo,
} from "./common.js";

function inferMeltState(inputs) {
  const surfaceTempK = finiteOrNull(inputs.surfaceTempK);
  const equilibriumTempK = finiteOrNull(inputs.equilibriumTempK);
  const insolationEarth = finiteOrNull(inputs.insolationEarth);
  const tidalHeatFluxWm2 = finiteOrNull(inputs.tidalHeatFluxWm2);
  if (
    (surfaceTempK != null && surfaceTempK >= 1700) ||
    (equilibriumTempK != null && equilibriumTempK >= 1450) ||
    (insolationEarth != null && insolationEarth >= 1200)
  ) {
    return "global or dayside magma-ocean candidate";
  }
  if (
    (surfaceTempK != null && surfaceTempK >= 1200) ||
    (equilibriumTempK != null && equilibriumTempK >= 1000) ||
    (insolationEarth != null && insolationEarth >= 400) ||
    (tidalHeatFluxWm2 != null && tidalHeatFluxWm2 >= 2)
  ) {
    return "silicate-melt surface patches likely";
  }
  return "thermal melt warning";
}

function meltSeverityScore(inputs) {
  const surfaceTempK = finiteOrNull(inputs.surfaceTempK);
  const equilibriumTempK = finiteOrNull(inputs.equilibriumTempK);
  const insolationEarth = finiteOrNull(inputs.insolationEarth);
  const tidalHeatFluxWm2 = finiteOrNull(inputs.tidalHeatFluxWm2);
  const tempScore = Math.max(
    surfaceTempK == null ? 0 : clamp((surfaceTempK - 1000) / 900, 0, 1),
    equilibriumTempK == null ? 0 : clamp((equilibriumTempK - 900) / 700, 0, 1),
  );
  const irradiationScore =
    insolationEarth == null ? 0 : clamp(Math.log10(Math.max(insolationEarth, 1)) / 3.2, 0, 1);
  const tidalScore =
    tidalHeatFluxWm2 == null
      ? 0
      : clamp(Math.log10(Math.max(tidalHeatFluxWm2, 0.01) * 100) / 4, 0, 1);
  return clamp(Math.max(tempScore, irradiationScore, tidalScore), 0, 1);
}

export function buildLavaWorldOverlay(inputs = {}) {
  const meltState = inferMeltState(inputs);
  const severityScore = meltSeverityScore(inputs);
  const semiMajorAxisAu = finiteOrNull(inputs.semiMajorAxisAu);
  const tidallyLocked =
    inputs.tidallyLockedToStar === true ||
    String(inputs.rotationState || "")
      .toLowerCase()
      .includes("locked");
  const closeIn = semiMajorAxisAu != null && semiMajorAxisAu <= 0.05;
  const daysideNightsideCaution = tidallyLocked || closeIn;

  const reasons = [
    overlayReason(
      "meltStateInterpretation",
      "Thermal inputs support a lava-surface interpretation.",
      meltState,
    ),
  ];
  const warnings = [];
  if (daysideNightsideCaution) {
    warnings.push(
      overlayReason(
        "daysideNightsideContrastCaution",
        "Close-in or locked lava worlds may have extreme dayside/nightside contrast.",
        tidallyLocked ? "Tidally locked state is modelled." : "Orbit is inside 0.05 AU.",
        "warning",
      ),
    );
  }

  return {
    modelVersion: OVERLAY_MODEL_VERSION,
    overlayId: "lavaWorld",
    summary: `${meltState}; climate outputs remain limited.`,
    metrics: compactObject({
      meltSeverityScore: roundTo(severityScore, 3),
      surfaceTempK: roundTo(inputs.surfaceTempK, 1),
      equilibriumTempK: roundTo(inputs.equilibriumTempK, 1),
      insolationEarth: roundTo(inputs.insolationEarth, 2),
      tidalHeatFluxWm2: roundTo(inputs.tidalHeatFluxWm2, 3),
    }),
    interpretation: compactObject({
      meltState,
      daysideNightsideCaution,
      lockedOrCloseIn: daysideNightsideCaution,
    }),
    reasons,
    warnings,
  };
}
