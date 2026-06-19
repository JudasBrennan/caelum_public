import { clamp, round, toFinite } from "../utils.js";

export const CONTEXT_STATUS = Object.freeze({
  SUPPORTED: "supported",
  LIMITED: "limited",
  UNKNOWN: "unknown",
});

export const CONFIDENCE = Object.freeze({
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  UNKNOWN: "unknown",
});

export function finiteNumber(value, fallback = NaN) {
  return toFinite(value, fallback);
}

export function finiteNonNegative(value, fallback = 0) {
  return Math.max(0, toFinite(value, fallback));
}

export function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

export function scoreToClass(
  score,
  {
    high = "high",
    medium = "medium",
    low = "low",
    none = "none",
    highAt = 0.72,
    mediumAt = 0.38,
    lowAt = 0.12,
  } = {},
) {
  const x = fraction(score, 0);
  if (x >= highAt) return high;
  if (x >= mediumAt) return medium;
  if (x >= lowAt) return low;
  return none;
}

export function confidenceFromParts(parts = []) {
  const values = parts.filter(Boolean);
  if (!values.length) return CONFIDENCE.UNKNOWN;
  if (values.includes(CONFIDENCE.UNKNOWN)) return CONFIDENCE.UNKNOWN;
  if (values.includes(CONFIDENCE.LOW)) return CONFIDENCE.LOW;
  if (values.includes(CONFIDENCE.MEDIUM)) return CONFIDENCE.MEDIUM;
  return CONFIDENCE.HIGH;
}

export function makeContext({
  modelVersion,
  status = CONTEXT_STATUS.SUPPORTED,
  confidence = CONFIDENCE.MEDIUM,
  inputs = {},
  outputs = {},
  assumptions = [],
  limitingFactors = [],
  notes = [],
  sourceKeys = [],
} = {}) {
  return {
    modelVersion,
    status,
    confidence,
    inputs,
    outputs,
    assumptions: [...assumptions],
    limitingFactors: [...limitingFactors],
    notes: [...notes],
    sourceKeys: [...sourceKeys],
  };
}

export function unknownContext(modelVersion, reason, sourceKeys = []) {
  return makeContext({
    modelVersion,
    status: CONTEXT_STATUS.UNKNOWN,
    confidence: CONFIDENCE.UNKNOWN,
    limitingFactors: reason ? [reason] : [],
    sourceKeys,
  });
}

export function roundMaybe(value, dp = 3) {
  const n = Number(value);
  return Number.isFinite(n) ? round(n, dp) : null;
}
