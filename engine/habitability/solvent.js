// SPDX-License-Identifier: MPL-2.0
// Unified solvent model for rocky planets and moons.
//
// Stage 7 makes solvent support explicit and policy-driven, so surface
// water, subsurface water, and alternative solvents can be enabled or
// disabled intentionally under tests and UI disclosure.

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

function alternativeSolventScoreForCandidate(candidate, context) {
  const surface = context.surface;
  const chemistry = context.chemistry;
  const pressureScore = pressureWindowScore(surface.pressureAtm);
  const composition = chemistry.atmosphereComposition || {};
  const tempK = Math.max(toFinite(surface.surfaceTempK, 0), 0);

  if (candidate === "methane-lakes") {
    const tempScore = centeredWindowScore(tempK, 94, 30);
    const methaneScore = clamp(Math.max(toFinite(composition.ch4, 0), 0) / 0.03, 0, 1);
    return clamp(0.2 + 0.2 * tempScore + 0.15 * pressureScore + 0.1 * methaneScore, 0, 0.65);
  }

  if (candidate === "ammonia-brines") {
    const tempScore = centeredWindowScore(tempK, 185, 45);
    const ammoniaScore = clamp(Math.max(toFinite(composition.nh3, 0), 0) / 0.01, 0, 1);
    return clamp(0.18 + 0.18 * tempScore + 0.14 * pressureScore + 0.12 * ammoniaScore, 0, 0.6);
  }

  return 0;
}

export function computeUnifiedSolventModel(context = {}, { policy } = {}) {
  const normalized = normalizeHabitabilityContext(context);
  const mergedPolicy = mergeSolventPolicy(policy);
  const surface = normalized.surface;
  const energy = normalized.energy;
  const accessibleLiquid = clamp(toFinite(surface.surfaceAccessibleLiquidFraction, 0), 0, 1);
  const surfaceAccessibilityPenalty =
    accessibleLiquid > 0 ? clamp(0.6 + 0.4 * pressureWindowScore(surface.pressureAtm), 0, 1) : 0;

  const surfaceWaterScore = mergedPolicy.surfaceWater
    ? clamp((0.3 + 0.7 * Math.sqrt(accessibleLiquid)) * surfaceAccessibilityPenalty, 0, 1)
    : 0;

  const icyCover = clamp(
    toFinite(surface.permanentIceFraction, 0) + 0.5 * toFinite(surface.landFraction, 0),
    0,
    1,
  );
  const tidalSupport = clamp(
    Math.log10(1 + Math.max(toFinite(energy.tidalHeatingEarth, 0), 0)) / 2,
    0,
    1,
  );
  const subsurfaceWaterScore =
    mergedPolicy.subsurfaceWater && surface.subsurfaceOceanPotential
      ? clamp(0.2 + 0.2 * icyCover + 0.2 * tidalSupport, 0, 0.6)
      : 0;

  const alternativeSolventCandidate = String(surface.alternativeSolventCandidate || "");
  const altSolventScore =
    mergedPolicy.alternativeSolvents && alternativeSolventCandidate
      ? alternativeSolventScoreForCandidate(alternativeSolventCandidate, normalized)
      : 0;

  const selectedScore = Math.max(surfaceWaterScore, subsurfaceWaterScore, altSolventScore);
  let selectedPathway = "none";
  let stabilityFloor = 0;
  if (selectedScore === surfaceWaterScore && surfaceWaterScore > 0) {
    selectedPathway = "surface-water";
  } else if (selectedScore === subsurfaceWaterScore && subsurfaceWaterScore > 0) {
    selectedPathway = "subsurface-water";
    stabilityFloor = 0.45;
  } else if (selectedScore === altSolventScore && altSolventScore > 0) {
    selectedPathway = "alternative-solvent";
    stabilityFloor = 0.35;
  }

  return {
    score: clamp(selectedScore, 0, 1),
    modelVersion: "solvent-v1",
    policyVersion: mergedPolicy.version,
    supportedPathways: {
      surfaceWater: mergedPolicy.surfaceWater,
      subsurfaceWater: mergedPolicy.subsurfaceWater,
      alternativeSolvents: mergedPolicy.alternativeSolvents,
    },
    selectedPathway,
    stabilityFloor,
    breakdown: {
      surfaceWaterScore,
      subsurfaceWaterScore,
      altSolventScore,
      surfaceAccessibilityPenalty,
      alternativeSolventCandidate,
    },
  };
}
