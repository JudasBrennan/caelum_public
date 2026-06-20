import { fmt } from "../../engine/utils.js";

export function formatMeanOceanDepthMeta({
  surfaceLiquidCoverage,
  oceanPhaseDiagnostics = "",
  seafloorPressureGPa = null,
} = {}) {
  return [
    `Surface liquid coverage ${fmt(surfaceLiquidCoverage * 100, 0)}%`,
    oceanPhaseDiagnostics,
    !oceanPhaseDiagnostics && Number.isFinite(seafloorPressureGPa) && seafloorPressureGPa > 0
      ? `Seafloor pressure ${fmt(seafloorPressureGPa, seafloorPressureGPa >= 1 ? 2 : 3)} GPa`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export function buildSurfaceOceanCoverageItems({ derived = {}, display = {} } = {}) {
  const context = derived.hydrosphere?.surfaceOceanCoverageContext || null;
  const coverageSource = String(context?.source || "").trim();
  const coverageClass = String(display.surfaceOceanCoverageReason || "").trim();
  const inferredOceanCoverageMeta = [
    coverageClass ? `Class ${coverageClass}` : "",
    display.surfaceAccessibleLiquid ? `surface liquid ${display.surfaceAccessibleLiquid}` : "",
    coverageSource === "inferred" ? "inventory plus basin capacity" : coverageSource,
  ]
    .filter(Boolean)
    .join(" | ");
  const exposedLandMeta = [
    context?.exposedLandClass || "",
    coverageClass ? `flood class ${coverageClass}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  const coverageConfidenceMeta = [
    context?.modelVersion || derived.hydrosphere?.coverageModelVersion || "",
    Array.isArray(context?.assumptions) ? context.assumptions.slice(0, 2).join(" | ") : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return [
    {
      label: "Inferred Ocean Coverage",
      value: display.inferredOceanCoverage,
      meta: inferredOceanCoverageMeta,
    },
    {
      label: "Exposed Land",
      value: display.exposedLand,
      meta: exposedLandMeta,
    },
    {
      label: "Coverage Confidence",
      value: display.surfaceOceanCoverageConfidence,
      meta: coverageConfidenceMeta,
    },
  ];
}

export function buildSurfaceOceanOutputContext({
  derived = {},
  display = {},
  inputs = {},
  surfaceLiquidCoverage = Number(derived.surfaceAccessibleLiquidFraction),
} = {}) {
  const meanOceanDepthKm = Number(derived.hydrosphere?.estimatedMeanOceanDepthKm);
  const seafloorPressureGPa = Number(derived.hydrosphere?.seafloorPressureGPa);
  const oceanPhaseDiagnostics = String(display.oceanPhaseDiagnostics || "").trim();
  const showMeanOceanDepth =
    Number.isFinite(surfaceLiquidCoverage) &&
    surfaceLiquidCoverage >= 0.05 &&
    Number.isFinite(meanOceanDepthKm) &&
    meanOceanDepthKm > 0 &&
    display.meanOceanDepth;
  return {
    showMeanOceanDepth,
    waterRegimeMeta: showMeanOceanDepth
      ? `~${fmt(inputs.wmfPct, 2)}% water by mass | Mean depth ${display.meanOceanDepth}`
      : `~${fmt(inputs.wmfPct, 2)}% water by mass`,
    meanOceanDepthMeta: formatMeanOceanDepthMeta({
      surfaceLiquidCoverage,
      oceanPhaseDiagnostics,
      seafloorPressureGPa,
    }),
    surfaceOceanCoverageItems: buildSurfaceOceanCoverageItems({ derived, display }),
  };
}
