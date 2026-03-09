// SPDX-License-Identifier: MPL-2.0
// Unified solvent model for rocky planets and moons.

import { clamp, toFinite } from "../utils.js";
import { normalizeHabitabilityContext } from "./schema.js";

export const SURFACE_ONLY_SOLVENT_POLICY = Object.freeze({
  surfaceWater: true,
  subsurfaceWater: false,
  alternativeSolvents: false,
  version: "surface-water-only-v1",
});

export const DEFAULT_SOLVENT_POLICY = Object.freeze({
  surfaceWater: true,
  subsurfaceWater: true,
  alternativeSolvents: false,
  version: "surface-plus-subsurface-water-v1",
});

export const FULL_SOLVENT_POLICY = Object.freeze({
  surfaceWater: true,
  subsurfaceWater: true,
  alternativeSolvents: true,
  version: "surface-subsurface-plus-alt-solvents-v1",
});

function weightedMean(values = [], weights = []) {
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = clamp(toFinite(values[index], 0), 0, 1);
    const weight = Math.max(toFinite(weights[index], 0), 0);
    numerator += value * weight;
    denominator += weight;
  }
  return denominator > 0 ? numerator / denominator : 0;
}

function mergeSolventPolicy(policy = {}) {
  const merged = {
    ...DEFAULT_SOLVENT_POLICY,
    ...(policy && typeof policy === "object" ? policy : {}),
  };
  return {
    surfaceWater: merged.surfaceWater !== false,
    subsurfaceWater: merged.subsurfaceWater === true,
    alternativeSolvents: merged.alternativeSolvents === true,
    version:
      String(merged.version || "").trim() ||
      (merged.alternativeSolvents
        ? FULL_SOLVENT_POLICY.version
        : merged.subsurfaceWater
          ? DEFAULT_SOLVENT_POLICY.version
          : SURFACE_ONLY_SOLVENT_POLICY.version),
  };
}

function pressureWindowScore(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0) return 0;
  return clamp(1 - Math.abs(Math.log10(Math.max(pressure, 0.01))) / 2.2, 0, 1);
}

function centeredWindowScore(value, center, halfWidth) {
  if (!Number.isFinite(value) || !Number.isFinite(center) || !Number.isFinite(halfWidth)) return 0;
  if (halfWidth <= 0) return 0;
  return clamp(1 - Math.abs(value - center) / halfWidth, 0, 1);
}

function internalSupportScore(context) {
  const energy = context.energy || {};
  if (Number.isFinite(toFinite(energy.internalHeatSupport, NaN))) {
    return clamp(toFinite(energy.internalHeatSupport, 0), 0, 1);
  }
  return clamp(
    Math.log10(
      1 +
        Math.max(toFinite(energy.tidalHeatingEarth, 0), 0) +
        Math.max(toFinite(energy.radiogenicHeatingEarth, 0), 0),
    ) / 1.6,
    0,
    1,
  );
}

function shellAccessScore(iceShellThicknessKm) {
  const thicknessKm = Math.max(toFinite(iceShellThicknessKm, 0), 0);
  if (thicknessKm <= 0) return 0;
  if (thicknessKm <= 3) return 0.55;
  if (thicknessKm <= 30) return 1;
  if (thicknessKm <= 80) return 1 - ((thicknessKm - 30) / 50) * 0.45;
  return 0.35;
}

function alternativeSolventScores(context) {
  const surface = context.surface || {};
  const chemistry = context.chemistry || {};
  const atmosphere = chemistry.atmosphereComposition || {};
  const tempK = Math.max(toFinite(surface.surfaceTempK, 0), 0);
  const pressureScore = pressureWindowScore(surface.pressureAtm);

  const methaneTempScore = centeredWindowScore(tempK, 94, 22);
  const methaneCarbonScore = clamp(
    (Math.max(toFinite(atmosphere.ch4, 0), 0) + Math.max(toFinite(atmosphere.co, 0), 0)) / 0.03,
    0,
    1,
  );
  const methaneNitrogenCarrierScore = clamp(Math.max(toFinite(atmosphere.n2, 0), 0) / 0.2, 0, 1);
  const altMethaneScore = weightedMean(
    [methaneTempScore, pressureScore, methaneCarbonScore, methaneNitrogenCarrierScore],
    [0.35, 0.2, 0.3, 0.15],
  );

  const ammoniaTempScore = centeredWindowScore(tempK, 200, 35);
  const ammoniaScore = clamp(Math.max(toFinite(atmosphere.nh3, 0), 0) / 0.01, 0, 1);
  const waterCarrierScore = clamp(
    (Math.max(toFinite(atmosphere.h2o, 0), 0) +
      Math.max(toFinite(surface.permanentIceFraction, 0), 0)) /
      0.2,
    0,
    1,
  );
  const altAmmoniaScore = weightedMean(
    [ammoniaTempScore, pressureScore, ammoniaScore, waterCarrierScore],
    [0.3, 0.2, 0.3, 0.2],
  );

  return {
    altMethaneScore,
    altAmmoniaScore,
    altSolventScore: Math.max(altMethaneScore, altAmmoniaScore),
    solventTempWindow: Math.max(methaneTempScore, ammoniaTempScore),
    altBasinCoverageFraction: clamp(Math.max(altMethaneScore, altAmmoniaScore) * 0.35, 0, 0.35),
  };
}

export function computeUnifiedSolventModel(context = {}, { policy } = {}) {
  const normalized = normalizeHabitabilityContext(context);
  const mergedPolicy = mergeSolventPolicy(policy);
  const surface = normalized.surface;
  const accessibleSurfaceLiquid = Math.max(toFinite(surface.surfaceAccessibleLiquidFraction, 0), 0);

  const pressureAccessibilityPenalty = clamp(
    0.6 + 0.4 * pressureWindowScore(surface.pressureAtm),
    0,
    1,
  );
  const surfaceWaterScore =
    mergedPolicy.surfaceWater && accessibleSurfaceLiquid > 0
      ? clamp(
          (0.35 + 0.65 * Math.sqrt(accessibleSurfaceLiquid)) * pressureAccessibilityPenalty,
          0,
          1,
        )
      : 0;

  const resolvedShellAccessScore = shellAccessScore(surface.iceShellThicknessKm);
  const barrierScore = surface.highPressureIceBarrier ? 0.25 : 1;
  const resolvedInternalSupport = internalSupportScore(normalized);
  const subsurfaceWaterScore =
    mergedPolicy.subsurfaceWater && surface.subsurfaceOceanPotential
      ? weightedMean(
          [
            surface.subsurfaceOceanScore,
            resolvedShellAccessScore,
            barrierScore,
            resolvedInternalSupport,
          ],
          [0.35, 0.25, 0.2, 0.2],
        )
      : 0;

  const altScores = alternativeSolventScores(normalized);
  const altSolventScore = mergedPolicy.alternativeSolvents ? altScores.altSolventScore : 0;

  const pathwayScores = {
    surfaceWaterScore,
    subsurfaceWaterScore,
    altSolventScore,
  };
  const rankedPathways = [
    ["surface-water", surfaceWaterScore],
    ["subsurface-water", subsurfaceWaterScore],
    ["alternative-solvent", altSolventScore],
  ];
  let selectedPathway = "none";
  let score = 0;
  for (const [pathway, pathwayScore] of rankedPathways) {
    if (pathwayScore > score) {
      selectedPathway = pathway;
      score = pathwayScore;
    }
  }

  return {
    score: clamp(score, 0, 1),
    selectedPathway,
    pathwayScores,
    pathwayInputs: {
      pressureAccessibilityPenalty,
      shellAccessScore: resolvedShellAccessScore,
      barrierScore,
      internalSupportScore: resolvedInternalSupport,
      methaneTempScore: centeredWindowScore(surface.surfaceTempK, 94, 22),
      ammoniaTempScore: centeredWindowScore(surface.surfaceTempK, 200, 35),
      solventTempWindow: altScores.solventTempWindow,
      altBasinCoverageFraction: altScores.altBasinCoverageFraction,
      alternativeSolventCandidate: String(surface.alternativeSolventCandidate || ""),
    },
    policyVersion: mergedPolicy.version,
    modelVersion: "solvent-v2",
    supportedPathways: {
      surfaceWater: mergedPolicy.surfaceWater,
      subsurfaceWater: mergedPolicy.subsurfaceWater,
      alternativeSolvents: mergedPolicy.alternativeSolvents,
    },
  };
}
