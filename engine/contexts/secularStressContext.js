import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, scoreToClass } from "./validation.js";
import { buildSecularDynamicsContext as buildDetailedSecularDynamicsContext } from "./secularDynamicsContext.js";

const MODEL_VERSION = "secular-stress-context-v1";
const SOURCE_KEYS = ["secularStress"];

function classLabel(score, labels) {
  return scoreToClass(score, {
    high: labels.high,
    medium: labels.medium,
    low: labels.low,
    none: labels.none,
  });
}

export function buildSecularDynamicsContext({
  hostFrameKind = "single",
  companionSeparationAu = null,
  semiMajorAxisAu = 1,
  eccentricity = 0,
  inclinationDeg = 0,
  adjacentSpacingMutualHill = null,
} = {}) {
  const detailed = buildDetailedSecularDynamicsContext({
    hostFrameKind,
    companionSeparationAu,
    innerSemiMajorAxisAu: semiMajorAxisAu,
    outerSemiMajorAxisAu: companionSeparationAu,
    eccentricity,
    mutualInclinationDeg: inclinationDeg,
    adjacentSpacingMutualHill,
  });
  return {
    ...detailed,
    modelVersion: MODEL_VERSION,
    sourceKeys: SOURCE_KEYS,
  };
}

export function buildTidalStressMorphologyContext({
  tidalHeatingEarth = 0,
  eccentricity = 0,
  resonanceContext = null,
  hydrosphere = null,
  geodynamicsContext = null,
  compositionClass = "",
  iceShellState = "",
} = {}) {
  const assumptions = ["Stress morphology is analog-based and qualitative."];
  const heat = Math.max(0, toFinite(tidalHeatingEarth, 0));
  const e = clamp(toFinite(eccentricity, 0), 0, 1);
  const surfaceWater = toFinite(
    hydrosphere?.liquidOceanFraction ?? hydrosphere?.surfaceAccessibleLiquidFraction,
    0,
  );
  const subsurfaceWater = hydrosphere?.subsurfaceOceanPresent
    ? toFinite(hydrosphere?.subsurfaceOceanScore, 0.7)
    : 0;
  const water = clamp(Math.max(surfaceWater, subsurfaceWater), 0, 1);
  const resonance = resonanceContext ? 0.35 : 0;
  const volcanicScore = clamp(Math.log10(1 + heat) / 1.2 + resonance, 0, 1);
  const icyScore = clamp(0.42 * water + (0.35 * Math.log10(1 + heat)) / 1.4 + 0.23 * e, 0, 1);
  const resurfacing = String(
    geodynamicsContext?.outputs?.resurfacingPotentialClass || "",
  ).toLowerCase();
  const active = resurfacing.includes("active") || heat > 1;
  const fractureScore = clamp(
    0.42 * water + 0.34 * (Math.log10(1 + heat) / 0.55) + 0.24 * (active ? 1 : 0),
    0,
    1,
  );
  const text = `${compositionClass} ${iceShellState}`.toLowerCase();
  let stressMorphologyClass = "quiet-ancient";
  if (volcanicScore > 0.72 && !text.includes("ice")) stressMorphologyClass = "io-like-volcanic";
  else if (fractureScore > 0.55 && heat > 0.2) stressMorphologyClass = "enceladus-like-fractures";
  else if (icyScore > 0.45 || text.includes("ice")) stressMorphologyClass = "europa-like-lineae";
  else if (active) stressMorphologyClass = "mixed-active";

  return makeContext({
    modelVersion: MODEL_VERSION,
    status: CONTEXT_STATUS.SUPPORTED,
    confidence: heat > 0 || e > 0 || resonanceContext ? CONFIDENCE.MEDIUM : CONFIDENCE.LOW,
    inputs: {
      tidalHeatingEarth: round(heat, 4),
      eccentricity: round(e, 5),
      compositionClass,
      iceShellState,
    },
    outputs: {
      stressMorphologyClass,
      globalFaultingLikelihood: classLabel(Math.max(icyScore, volcanicScore, fractureScore), {
        high: "likely",
        medium: "possible",
        low: "weak",
        none: "unlikely",
      }),
      lineaeLikelihood: classLabel(icyScore, {
        high: "likely",
        medium: "possible",
        low: "weak",
        none: "unlikely",
      }),
      plumeFractureLikelihood: classLabel(fractureScore * (water > 0 ? 1 : 0.35), {
        high: "likely",
        medium: "possible",
        low: "weak",
        none: "unlikely",
      }),
      stressConfidence: heat > 0 || resonanceContext ? "medium" : "low",
      surfaceTerrainNotes:
        stressMorphologyClass === "quiet-ancient"
          ? ["Low modeled tidal stress favors ancient cratered terrain."]
          : [`Modeled tidal stress favors ${stressMorphologyClass} terrain.`],
    },
    assumptions,
    limitingFactors: [],
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
