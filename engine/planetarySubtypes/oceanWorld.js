import {
  EARTH_MASS_KG,
  EARTH_RADIUS_KM,
  EARTH_GRAVITY_MS2,
  OVERLAY_MODEL_VERSION,
  clamp,
  compactObject,
  finiteOrNull,
  gravityMs2FromMassRadius,
  overlayReason,
  roundTo,
} from "./common.js";
import {
  OCEAN_PRESSURE_MODELS,
  classifyHighPressureIce,
  estimateOceanColumnPressurePa,
} from "../habitability/highPressureIce.js";
import { formatOceanPhaseDiagnostics } from "../habitability/oceanPhaseDisplay.js";

const WATER_DENSITY_KG_M3 = 1000;

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

function firstPresent(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return null;
}

function normalizeBottomTempRangeK(value) {
  if (Array.isArray(value) && value.length >= 2) {
    const min = finiteOrNull(value[0]);
    const max = finiteOrNull(value[1]);
    return min == null || max == null ? null : [roundTo(min, 1), roundTo(max, 1)];
  }
  if (value && typeof value === "object") {
    const min = finiteOrNull(value.minBottomTempK ?? value.min);
    const max = finiteOrNull(value.maxBottomTempK ?? value.max);
    return min == null || max == null ? null : [roundTo(min, 1), roundTo(max, 1)];
  }
  return null;
}

function phaseDiagramFieldsPresent(hydrosphere) {
  return (
    firstString(hydrosphere.highPressureIceClassificationMode) != null ||
    firstString(hydrosphere.seafloorPhase) != null ||
    finiteOrNull(hydrosphere.liquidusPressureGPa) != null ||
    finiteOrNull(hydrosphere.bottomOceanTempK) != null
  );
}

function resolveHighPressureIceInterpretation({
  hydrosphere,
  fallback,
  bottomOceanTempK,
  bottomOceanTempRangeK,
  seafloorPressureGPa,
}) {
  if (!phaseDiagramFieldsPresent(hydrosphere)) {
    return {
      ...fallback,
      bottomOceanTempK,
      bottomOceanTempRangeK,
      phaseDiagramExplanation: fallback.explanation,
    };
  }

  const classificationMode = firstString(
    hydrosphere.highPressureIceClassificationMode,
    fallback.classificationMode,
  );
  return {
    ...fallback,
    band: firstString(hydrosphere.highPressureIceBand, fallback.band),
    pressureGPa: finiteOrNull(firstPresent(hydrosphere.seafloorPressureGPa, seafloorPressureGPa)),
    pressureModel: firstString(hydrosphere.pressureModel, fallback.pressureModel),
    constantDensityPressureGPa: finiteOrNull(
      firstPresent(
        hydrosphere.constantDensitySeafloorPressureGPa,
        fallback.constantDensityPressureGPa,
      ),
    ),
    effectiveDensityKgM3: finiteOrNull(
      firstPresent(hydrosphere.oceanEffectiveDensityKgM3, fallback.effectiveDensityKgM3),
    ),
    densityMultiplier: finiteOrNull(
      firstPresent(hydrosphere.oceanDensityMultiplier, fallback.densityMultiplier),
    ),
    thresholdDepthsKm: hydrosphere.highPressureIceThresholdDepthsKm ?? fallback.thresholdDepthsKm,
    classificationMode,
    seafloorPhase: firstString(hydrosphere.seafloorPhase, fallback.seafloorPhase),
    liquidusPressureGPa: finiteOrNull(
      firstPresent(hydrosphere.liquidusPressureGPa, fallback.liquidusPressureGPa),
    ),
    liquidusBoundaryPhase: firstString(
      hydrosphere.liquidusBoundaryPhase,
      fallback.liquidusBoundaryPhase,
    ),
    highPressureIceStable:
      hydrosphere.highPressureIceStable ?? fallback.highPressureIceStable ?? false,
    highPressureIcePhase: firstString(
      hydrosphere.highPressureIcePhase,
      fallback.highPressureIcePhase,
    ),
    rockOceanBarrier: firstString(hydrosphere.rockOceanBarrier, fallback.rockOceanBarrier),
    phaseDiagramConfidence: firstString(
      hydrosphere.phaseDiagramConfidence,
      fallback.phaseDiagramConfidence,
    ),
    phaseDiagramExplanation: firstString(hydrosphere.phaseDiagramExplanation, fallback.explanation),
    highPressureIceRisk: hydrosphere.highPressureIceRisk ?? fallback.highPressureIceRisk ?? false,
    highPressureIceLikely:
      hydrosphere.highPressureIceLikely ?? fallback.highPressureIceLikely ?? false,
    bottomOceanTempK: finiteOrNull(
      firstPresent(hydrosphere.bottomOceanTempK, fallback.bottomOceanTempK, bottomOceanTempK),
    ),
    bottomOceanTempRangeK:
      normalizeBottomTempRangeK(hydrosphere.bottomOceanTempRangeK) ??
      normalizeBottomTempRangeK(fallback.bottomOceanTempRangeK) ??
      bottomOceanTempRangeK,
  };
}

function formatTempEstimate(tempK, rangeK) {
  if (tempK == null && !rangeK) return "";
  const tempText = tempK == null ? "unknown" : `${roundTo(tempK, 1)} K`;
  if (!rangeK) return tempText;
  return `${tempText} estimated bottom temperature; range ${rangeK[0]}-${rangeK[1]} K`;
}

function warningCodeForHighPressureIce(highPressureIce) {
  if (highPressureIce.classificationMode !== "phase-diagram") {
    if (!highPressureIce.highPressureIceRisk) return null;
    return highPressureIce.band === "caution"
      ? "highPressureIcePossible"
      : "highPressureIcePlausible";
  }

  if (
    highPressureIce.phaseDiagramConfidence === "low" ||
    highPressureIce.seafloorPhase === "unknown"
  ) {
    return "phaseDiagramUncertain";
  }
  if (!highPressureIce.highPressureIceRisk) return null;
  if (highPressureIce.highPressureIceStable && highPressureIce.highPressureIcePhase === "ice-vii") {
    return "iceViiStable";
  }
  if (highPressureIce.highPressureIceLikely) return "highPressureIceLikely";
  if (highPressureIce.rockOceanBarrier === "possible" || highPressureIce.band === "caution") {
    return "highPressureIcePossible";
  }
  return "highPressureIcePlausible";
}

function warningLabelForHighPressureIce(highPressureIce) {
  if (highPressureIce.classificationMode !== "phase-diagram") {
    return "Pressure-only caution: bottom-ocean temperature is not constrained.";
  }
  if (highPressureIce.seafloorPhase === "unknown") {
    return "Water phase state is uncertain for the current pressure-temperature estimate.";
  }
  if (highPressureIce.highPressureIcePhase === "ice-vii") {
    return "Ice VII is stable or near-stable at the estimated ocean floor.";
  }
  if (highPressureIce.highPressureIceLikely) {
    return "High-pressure ice is likely at the estimated ocean floor.";
  }
  return "High-pressure ice is possible at the estimated ocean floor.";
}

function overlaySummary(highPressureIce) {
  if (highPressureIce.classificationMode === "phase-diagram") {
    if (highPressureIce.seafloorPhase === "liquid" && !highPressureIce.highPressureIceRisk) {
      return "Surface ocean interpretation; seafloor pressure is below the current liquidus estimate.";
    }
    if (highPressureIce.highPressureIceStable) {
      return "Deep-water interpretation; phase diagram supports high-pressure ice at the ocean floor.";
    }
    if (highPressureIce.seafloorPhase === "unknown") {
      return "Surface ocean interpretation with uncertain seafloor phase state.";
    }
  }
  return highPressureIce.highPressureIceRisk
    ? "Deep-water interpretation; high-pressure ice is plausible."
    : "Surface ocean interpretation with no high-pressure ice flag from the current estimate.";
}

export function buildOceanWorldOverlay(inputs = {}, { mode = "oceanWorld" } = {}) {
  const wmfPct = finiteOrNull(inputs.wmfPct);
  const massEarth = finiteOrNull(inputs.massEarth);
  const radiusEarth = finiteOrNull(inputs.radiusEarth);
  const hydrosphere =
    inputs.hydrosphere && typeof inputs.hydrosphere === "object" ? inputs.hydrosphere : {};
  const oceanCoverage = inferOceanCoverage(inputs, mode);
  const gravityMs2 = gravityMs2FromMassRadius(massEarth, radiusEarth, inputs.gravityG);
  const resolvedGravityG = gravityMs2 == null ? inputs.gravityG : gravityMs2 / EARTH_GRAVITY_MS2;

  let waterMassKg = null;
  let equivalentWaterDepthKm = finiteOrNull(hydrosphere.equivalentWaterDepthM);
  if (equivalentWaterDepthKm != null) equivalentWaterDepthKm /= 1000;
  let meanOceanDepthKm = null;
  let seafloorPressureGPa = finiteOrNull(hydrosphere.seafloorPressureGPa);
  let pressureModel = firstString(hydrosphere.pressureModel);
  if (wmfPct != null && massEarth != null && radiusEarth != null && oceanCoverage > 0) {
    waterMassKg = EARTH_MASS_KG * massEarth * (wmfPct / 100);
    const surfaceAreaM2 = 4 * Math.PI * (EARTH_RADIUS_KM * radiusEarth * 1000) ** 2;
    if (equivalentWaterDepthKm == null) {
      equivalentWaterDepthKm = waterMassKg / WATER_DENSITY_KG_M3 / surfaceAreaM2 / 1000;
    }
    const oceanAreaM2 = surfaceAreaM2 * oceanCoverage;
    meanOceanDepthKm = finiteOrNull(hydrosphere.estimatedMeanOceanDepthKm);
    if (meanOceanDepthKm == null) {
      meanOceanDepthKm = waterMassKg / WATER_DENSITY_KG_M3 / oceanAreaM2 / 1000;
    }
    if (seafloorPressureGPa == null && gravityMs2 != null) {
      const pressureEstimate = estimateOceanColumnPressurePa({
        depthKm: meanOceanDepthKm,
        gravityG: resolvedGravityG,
        densityKgM3: WATER_DENSITY_KG_M3,
        pressureModel: OCEAN_PRESSURE_MODELS.effectiveDensity,
      });
      seafloorPressureGPa = finiteOrNull(pressureEstimate.pressureGPa);
      pressureModel = pressureEstimate.pressureModel;
    }
  }
  if (seafloorPressureGPa != null) {
    pressureModel = firstString(pressureModel, OCEAN_PRESSURE_MODELS.constantDensity);
  }

  const bottomOceanTempK = finiteOrNull(
    firstPresent(hydrosphere.bottomOceanTempK, inputs.bottomOceanTempK),
  );
  const bottomOceanTempRangeK = normalizeBottomTempRangeK(
    firstPresent(hydrosphere.bottomOceanTempRangeK, inputs.bottomOceanTempRangeK),
  );
  const fallbackHighPressureIce = classifyHighPressureIce({
    seafloorPressurePa: seafloorPressureGPa == null ? null : seafloorPressureGPa * 1e9,
    depthKm: meanOceanDepthKm,
    gravityG: resolvedGravityG,
    pressureModel,
    surfaceTempK: inputs.surfaceTempK,
    bottomTempK: bottomOceanTempK,
    bottomTempRangeK: bottomOceanTempRangeK ?? undefined,
    salinityPct: inputs.salinityPct,
    climateState: inputs.climateState,
    steamFraction: inputs.steamFraction,
    permanentIceFraction: inputs.permanentIceFraction,
  });
  const highPressureIce = resolveHighPressureIceInterpretation({
    hydrosphere,
    fallback: fallbackHighPressureIce,
    bottomOceanTempK,
    bottomOceanTempRangeK,
    seafloorPressureGPa,
  });
  const phaseDiagnostics = formatOceanPhaseDiagnostics({
    ...highPressureIce,
    seafloorPressureGPa,
    highPressureIceClassificationMode: highPressureIce.classificationMode,
  });
  const highPressureIceRisk = highPressureIce.highPressureIceRisk;
  const landLikelihood = landSurfaceLikelihood(inputs, mode);
  const reasons = [];
  const warnings = [];

  if (meanOceanDepthKm != null && meanOceanDepthKm > 0) {
    reasons.push(
      overlayReason(
        "oceanDepthEstimate",
        "Ocean inventory implies a deep global-water layer.",
        `${roundTo(meanOceanDepthKm, meanOceanDepthKm >= 100 ? 0 : 1)} km mean depth estimate`,
      ),
    );
  } else if (equivalentWaterDepthKm != null && equivalentWaterDepthKm > 0) {
    reasons.push(
      overlayReason(
        "equivalentWaterLayerEstimate",
        "Water inventory is tracked as an equivalent global layer, but the current hydrosphere state does not expose a liquid-ocean floor.",
        `${roundTo(equivalentWaterDepthKm, equivalentWaterDepthKm >= 100 ? 0 : 1)} km equivalent global layer`,
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
  if (seafloorPressureGPa != null && seafloorPressureGPa > 0) {
    const plausibleDepth = finiteOrNull(highPressureIce.thresholdDepthsKm?.plausible);
    const thresholdDetail =
      plausibleDepth == null
        ? ""
        : `; 0.6 GPa threshold near ${roundTo(plausibleDepth, plausibleDepth >= 100 ? 0 : 1)} km at this gravity`;
    const modelDetail = highPressureIce.pressureModel ? ` (${highPressureIce.pressureModel})` : "";
    reasons.push(
      overlayReason(
        "seafloorPressureEstimate",
        "Estimated seafloor pressure is derived from local gravity and mean ocean depth.",
        `${roundTo(seafloorPressureGPa, 2)} GPa estimated seafloor pressure${modelDetail}${thresholdDetail}`,
      ),
    );
  }
  if (highPressureIce.bottomOceanTempK != null || highPressureIce.bottomOceanTempRangeK) {
    reasons.push(
      overlayReason(
        "bottomOceanTemperatureEstimate",
        "Bottom-ocean temperature is estimated before judging high-pressure ice stability.",
        formatTempEstimate(highPressureIce.bottomOceanTempK, highPressureIce.bottomOceanTempRangeK),
      ),
    );
  }
  if (highPressureIce.liquidusPressureGPa != null) {
    const phaseDetail = highPressureIce.liquidusBoundaryPhase
      ? `${highPressureIce.liquidusBoundaryPhase} boundary`
      : "water liquidus boundary";
    reasons.push(
      overlayReason(
        "liquidusPressureEstimate",
        "The high-pressure ice check compares seafloor pressure with the temperature-dependent liquidus.",
        `${phaseDetail} near ${roundTo(highPressureIce.liquidusPressureGPa, 3)} GPa`,
      ),
    );
  }
  if (highPressureIce.seafloorPhase) {
    reasons.push(
      overlayReason(
        "seafloorPhaseEstimate",
        "Estimated seafloor phase is inferred from the water phase diagram.",
        highPressureIce.seafloorPhase,
      ),
    );
  }
  if (highPressureIce.rockOceanBarrier) {
    reasons.push(
      overlayReason(
        "rockOceanBarrierEstimate",
        "Dense-ice barrier likelihood is interpreted separately from raw seafloor phase.",
        highPressureIce.rockOceanBarrier,
      ),
    );
  }

  const highPressureIceWarningCode = warningCodeForHighPressureIce(highPressureIce);
  if (highPressureIceWarningCode) {
    warnings.push(
      overlayReason(
        highPressureIceWarningCode,
        warningLabelForHighPressureIce(highPressureIce),
        phaseDiagnostics?.text ||
          highPressureIce.phaseDiagramExplanation ||
          highPressureIce.explanation,
        "warning",
      ),
    );
  }
  if (
    highPressureIce.classificationMode !== "phase-diagram" &&
    highPressureIce.highPressureIceRisk
  ) {
    warnings.push(
      overlayReason(
        "phaseDiagramUncertain",
        "Bottom-ocean temperature is not constrained, so this is a pressure-only caution.",
        phaseDiagnostics?.text ||
          highPressureIce.phaseDiagramExplanation ||
          highPressureIce.explanation,
        "warning",
      ),
    );
  }

  return {
    modelVersion: OVERLAY_MODEL_VERSION,
    overlayId: mode,
    summary: overlaySummary(highPressureIce),
    metrics: compactObject({
      waterMassKg: roundTo(waterMassKg, 0),
      equivalentWaterDepthKm: roundTo(
        equivalentWaterDepthKm,
        equivalentWaterDepthKm != null && equivalentWaterDepthKm >= 100 ? 0 : 2,
      ),
      oceanCoverageFraction: roundTo(oceanCoverage, 3),
      meanOceanDepthKm: roundTo(
        meanOceanDepthKm,
        meanOceanDepthKm != null && meanOceanDepthKm >= 100 ? 0 : 2,
      ),
      seafloorPressureGPa: roundTo(seafloorPressureGPa, 3),
      pressureModel: highPressureIce.pressureModel,
      constantDensitySeafloorPressureGPa: roundTo(highPressureIce.constantDensityPressureGPa, 3),
      oceanEffectiveDensityKgM3: roundTo(highPressureIce.effectiveDensityKgM3, 1),
      oceanDensityMultiplier: roundTo(highPressureIce.densityMultiplier, 4),
      highPressureIceThresholdDepthsKm: highPressureIce.thresholdDepthsKm,
      bottomOceanTempK: roundTo(highPressureIce.bottomOceanTempK, 1),
      bottomOceanTempRangeK: highPressureIce.bottomOceanTempRangeK,
      liquidusPressureGPa: roundTo(highPressureIce.liquidusPressureGPa, 4),
      oceanPhaseDiagnostics: phaseDiagnostics?.text,
    }),
    interpretation: compactObject({
      landSurfaceLikelihood: landLikelihood,
      pressureModel: highPressureIce.pressureModel,
      highPressureIceClassificationMode: highPressureIce.classificationMode,
      highPressureIceBand: highPressureIce.band,
      highPressureIceRisk,
      highPressureIceLikely: highPressureIce.highPressureIceLikely,
      seafloorPhase: highPressureIce.seafloorPhase,
      highPressureIceStable: highPressureIce.highPressureIceStable,
      highPressureIcePhase: highPressureIce.highPressureIcePhase,
      liquidusBoundaryPhase: highPressureIce.liquidusBoundaryPhase,
      rockOceanBarrier: highPressureIce.rockOceanBarrier,
      phaseDiagramConfidence: highPressureIce.phaseDiagramConfidence,
    }),
    reasons,
    warnings,
  };
}
