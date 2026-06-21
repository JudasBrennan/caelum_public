import {
  ROCKY_BODY_COMPONENT_KEYS,
  ROCKY_BODY_ELEMENT_KEYS,
  ROCKY_BODY_TRACE_ELEMENT_KEYS,
} from "../../engine/rockyBodyComposition.js";

export const COMPOSITION_INPUT_FIELDS = Object.freeze([
  "compositionMode",
  "compositionNormalizeMode",
  "compositionStructureSource",
  "manualComponentPct",
  "manualElementPct",
  "manualTraceElementAbundance",
  "compositionSuggestionMeta",
]);

const MANUAL_GROUP_KEYS = Object.freeze({
  manualComponentPct: ROCKY_BODY_COMPONENT_KEYS,
  manualElementPct: ROCKY_BODY_ELEMENT_KEYS,
  manualTraceElementAbundance: ROCKY_BODY_TRACE_ELEMENT_KEYS,
});

function hasOwnField(source, key) {
  return !!source && Object.prototype.hasOwnProperty.call(source, key);
}

function normalizeCompositionMode(value) {
  const mode = String(value || "").trim();
  return ["inferred", "reservoir", "expert-elements"].includes(mode) ? mode : "inferred";
}

function normalizeCompositionNormalizeMode(value) {
  const mode = String(value || "").trim();
  return mode === "normalize" ? "normalize" : "warn";
}

function normalizeCompositionStructureSource(value) {
  const mode = String(value || "").trim();
  return mode === "components" ? "components" : "inferred";
}

function normalizeFiniteOrNull(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeManualGroup(value, keys) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = {};
  for (const key of keys) out[key] = normalizeFiniteOrNull(source[key]);
  return out;
}

function normalizeString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeSuggestionMeta(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const modelVersion = normalizeString(value.modelVersion);
  const source = normalizeString(value.source);
  const confidence = normalizeString(value.confidence);
  const bodySignature = normalizeString(value.bodySignature);
  const caveats = Array.isArray(value.caveats)
    ? value.caveats
        .map((caveat) => normalizeString(caveat))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  if (!modelVersion && !source && !bodySignature && !caveats.length) return null;
  return {
    modelVersion,
    source,
    confidence: ["low", "medium", "high"].includes(confidence) ? confidence : "",
    bodySignature,
    caveats,
  };
}

export function hasCompositionInventoryInputs(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return false;
  return COMPOSITION_INPUT_FIELDS.some((field) => hasOwnField(source, field));
}

export function pickCompositionInventoryInputs(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  const out = {};
  for (const field of COMPOSITION_INPUT_FIELDS) {
    if (hasOwnField(source, field)) out[field] = source[field];
  }
  return out;
}

export function normalizeCompositionInventoryInputs(source = {}) {
  const raw = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  return {
    compositionMode: normalizeCompositionMode(raw.compositionMode),
    compositionNormalizeMode: normalizeCompositionNormalizeMode(raw.compositionNormalizeMode),
    compositionStructureSource: normalizeCompositionStructureSource(raw.compositionStructureSource),
    manualComponentPct: normalizeManualGroup(
      raw.manualComponentPct,
      MANUAL_GROUP_KEYS.manualComponentPct,
    ),
    manualElementPct: normalizeManualGroup(
      raw.manualElementPct,
      MANUAL_GROUP_KEYS.manualElementPct,
    ),
    manualTraceElementAbundance: normalizeManualGroup(
      raw.manualTraceElementAbundance,
      MANUAL_GROUP_KEYS.manualTraceElementAbundance,
    ),
    compositionSuggestionMeta: normalizeSuggestionMeta(raw.compositionSuggestionMeta),
  };
}

export function normalizePresentCompositionInventoryInputs(source = {}) {
  const raw = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  const out = {};
  if (hasOwnField(raw, "compositionMode")) {
    out.compositionMode = normalizeCompositionMode(raw.compositionMode);
  }
  if (hasOwnField(raw, "compositionNormalizeMode")) {
    out.compositionNormalizeMode = normalizeCompositionNormalizeMode(raw.compositionNormalizeMode);
  }
  if (hasOwnField(raw, "compositionStructureSource")) {
    out.compositionStructureSource = normalizeCompositionStructureSource(
      raw.compositionStructureSource,
    );
  }
  for (const [field, keys] of Object.entries(MANUAL_GROUP_KEYS)) {
    if (hasOwnField(raw, field)) out[field] = normalizeManualGroup(raw[field], keys);
  }
  if (hasOwnField(raw, "compositionSuggestionMeta")) {
    out.compositionSuggestionMeta = normalizeSuggestionMeta(raw.compositionSuggestionMeta);
  }
  return out;
}

export function mergeCompositionInventoryInputPatch(baseInputs = {}, patchInputs = {}) {
  const base = baseInputs && typeof baseInputs === "object" ? baseInputs : {};
  const patch = patchInputs && typeof patchInputs === "object" ? patchInputs : {};
  const next = { ...base, ...patch };

  for (const field of Object.keys(MANUAL_GROUP_KEYS)) {
    if (!hasOwnField(patch, field)) continue;
    const baseGroup = base[field] && typeof base[field] === "object" ? base[field] : {};
    const patchGroup = patch[field] && typeof patch[field] === "object" ? patch[field] : {};
    next[field] = { ...baseGroup, ...patchGroup };
  }

  return {
    ...next,
    ...normalizeCompositionInventoryInputs(next),
  };
}

export function preserveCompositionInventoryInputs(currentInputs = {}, nextInputs = {}) {
  const current = currentInputs && typeof currentInputs === "object" ? currentInputs : {};
  const next = nextInputs && typeof nextInputs === "object" ? nextInputs : {};
  if (hasCompositionInventoryInputs(next)) {
    return mergeCompositionInventoryInputPatch(current, next);
  }
  return {
    ...next,
    ...normalizeCompositionInventoryInputs(current),
  };
}

export function withCompositionInventoryDefaults(inputs = {}) {
  const source = inputs && typeof inputs === "object" ? inputs : {};
  return {
    ...source,
    ...normalizeCompositionInventoryInputs(source),
  };
}
