import { round, toFinite } from "../utils.js";
import { CONFIDENCE } from "./validation.js";

const MODEL_VERSION = "coupling-policy-v1";

const CONFIDENCE_RANK = Object.freeze({
  [CONFIDENCE.UNKNOWN]: 0,
  [CONFIDENCE.LOW]: 1,
  [CONFIDENCE.MEDIUM]: 2,
  [CONFIDENCE.HIGH]: 3,
});

const BLOCKING_BOUNDARY_RISKS = new Set(["high", "critical", "unsupported", "unsafe"]);

function confidenceRank(confidence) {
  return CONFIDENCE_RANK[String(confidence || "").toLowerCase()] ?? 0;
}

function isManualOverride(manualOverride) {
  if (manualOverride === true) return true;
  if (manualOverride === false || manualOverride == null) return false;
  if (Array.isArray(manualOverride)) return manualOverride.length > 0;
  if (typeof manualOverride === "string") return manualOverride.trim().length > 0;
  if (typeof manualOverride === "object") return Object.keys(manualOverride).length > 0;
  return Boolean(manualOverride);
}

function normalizedUserMode(userMode) {
  const mode = String(userMode || "")
    .trim()
    .toLowerCase();
  if (mode === "manual") return "manual";
  if (mode === "guided") return "guided";
  if (mode === "auto" || mode === "automatic") return "auto";
  return "unknown";
}

function boundaryRiskBlocks(boundaryRisk) {
  if (boundaryRisk === true) return true;
  const risk = String(boundaryRisk || "")
    .trim()
    .toLowerCase();
  return BLOCKING_BOUNDARY_RISKS.has(risk);
}

function finiteDelta(baseline, effective) {
  const base = Number(baseline);
  const next = Number(effective);
  return Number.isFinite(base) && Number.isFinite(next) ? round(next - base, 6) : null;
}

export function canApplyCoupledContext({
  confidence = CONFIDENCE.UNKNOWN,
  manualOverride = false,
  userMode = "auto",
  boundaryRisk = "low",
  requiredConfidence = CONFIDENCE.MEDIUM,
} = {}) {
  if (isManualOverride(manualOverride)) return false;
  if (normalizedUserMode(userMode) === "manual") return false;
  if (boundaryRiskBlocks(boundaryRisk)) return false;
  return confidenceRank(confidence) >= confidenceRank(requiredConfidence);
}

export function buildCoupledValueTrace({
  baseline = null,
  effective = null,
  contextKey = "",
  confidence = CONFIDENCE.UNKNOWN,
  reason = "",
  applied = false,
  manualOverride = false,
} = {}) {
  return {
    modelVersion: MODEL_VERSION,
    contextKey: String(contextKey || ""),
    baselineValue: Number.isFinite(Number(baseline)) ? toFinite(baseline, null) : baseline,
    effectiveValue: Number.isFinite(Number(effective)) ? toFinite(effective, null) : effective,
    delta: finiteDelta(baseline, effective),
    applied: Boolean(applied),
    appliedReason: String(reason || ""),
    confidence: String(confidence || CONFIDENCE.UNKNOWN).toLowerCase(),
    manualOverrideProtected: isManualOverride(manualOverride),
  };
}

export function selectEffectiveValue({
  baseline = null,
  coupled = null,
  confidence = CONFIDENCE.UNKNOWN,
  manualOverride = false,
  userMode = "auto",
  boundaryRisk = "low",
  contextKey = "",
  requiredConfidence = CONFIDENCE.MEDIUM,
} = {}) {
  const coupledNumber = Number(coupled);
  const coupledFinite = Number.isFinite(coupledNumber);
  const allowed =
    coupledFinite &&
    canApplyCoupledContext({
      confidence,
      manualOverride,
      userMode,
      boundaryRisk,
      requiredConfidence,
    });
  let reason = "applied-coupled-context";
  if (!coupledFinite) reason = "invalid-coupled-value";
  else if (isManualOverride(manualOverride) || normalizedUserMode(userMode) === "manual") {
    reason = "manual-override-protected";
  } else if (boundaryRiskBlocks(boundaryRisk)) {
    reason = "boundary-risk-blocked";
  } else if (confidenceRank(confidence) < confidenceRank(requiredConfidence)) {
    reason = "confidence-below-threshold";
  }

  const effective = allowed ? coupledNumber : baseline;
  return {
    selectedValue: effective,
    applied: allowed,
    trace: buildCoupledValueTrace({
      baseline,
      effective,
      contextKey,
      confidence,
      reason,
      applied: allowed,
      manualOverride,
    }),
  };
}

export const COUPLING_POLICY_MODEL_VERSION = MODEL_VERSION;
