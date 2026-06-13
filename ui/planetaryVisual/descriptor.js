import { buildSubtypeVisualDescriptor } from "../planet/subtypeVisualHints.js";
import {
  VISUAL_OVERRIDE_SCHEMA_VERSION,
  mergeVisualOverrides,
  normalizeVisualMode,
  normalizeVisualOverrides,
  stripEmptyVisualOverrides,
  __planetaryVisualOverrideInternals,
} from "./overrides.js";

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function cloneVisualValue(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value ?? null;
  return JSON.parse(JSON.stringify(value));
}

function firstString(...values) {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function firstObject(...values) {
  for (const value of values) {
    if (isPlainObject(value)) return value;
  }
  return null;
}

function appearanceFrom(input, body) {
  return firstObject(input.appearance, body?.appearance);
}

function overridesFrom(input, body, appearance) {
  return firstObject(
    input.visualOverrides,
    appearance?.visualOverrides,
    body?.visualOverrides,
    body?.inputs?.visualOverrides,
  );
}

function subtypeSourceFrom(input, body) {
  return (
    input.subtypeSource ||
    input.solvedBody ||
    input.unifiedBodyCalc ||
    input.unifiedModel ||
    input.model ||
    body ||
    input
  );
}

function buildAutoSignature(descriptor) {
  return __planetaryVisualOverrideInternals.stableStringify({
    schemaVersion: VISUAL_OVERRIDE_SCHEMA_VERSION,
    bodyId: descriptor.bodyId || "",
    renderFamily: descriptor.renderFamily || "",
    renderModel: descriptor.renderModel || "",
    baseRecipeId: descriptor.baseRecipeId || "",
    styleId: descriptor.styleId || "",
    visualSubtypeKey: descriptor.visualSubtypeKey || "",
    visualProfile: descriptor.visualProfile || null,
    gasProfile: descriptor.gasProfile || null,
    ringAppearance: descriptor.ringAppearance || null,
    textureDescriptor: descriptor.textureDescriptor || null,
    meshDescriptor: descriptor.meshDescriptor || null,
  });
}

function buildRenderSignature(autoSignature, overrideSignature) {
  return __planetaryVisualOverrideInternals.stableStringify({
    auto: autoSignature || "",
    override: overrideSignature || "",
  });
}

function buildSubtypeDescriptor(input, body) {
  const explicit = input.subtypeVisualDescriptor;
  if (isPlainObject(explicit)) return cloneVisualValue(explicit);
  return buildSubtypeVisualDescriptor(subtypeSourceFrom(input, body));
}

function withExplicitSubtypeKey(subtypeVisualDescriptor, input, body) {
  const visualSubtypeKey = firstString(
    input.visualSubtypeKey,
    body?.visualSubtypeKey,
    subtypeVisualDescriptor?.visualSubtypeKey,
  );
  if (!visualSubtypeKey) return subtypeVisualDescriptor;
  return {
    ...(subtypeVisualDescriptor || {}),
    visualSubtypeKey,
  };
}

export function resolvePlanetaryVisualDescriptor(input = {}) {
  const body = input.body || input.planet || input.gasGiant || null;
  const appearance = appearanceFrom(input, body);
  const visualMode = normalizeVisualMode(
    input.visualMode ?? appearance?.visualMode ?? body?.visualMode ?? body?.inputs?.visualMode,
  );
  const rawOverrides = overridesFrom(input, body, appearance);
  const subtypeVisualDescriptor = withExplicitSubtypeKey(
    buildSubtypeDescriptor(input, body),
    input,
    body,
  );
  const visualSubtypeKey = firstString(subtypeVisualDescriptor?.visualSubtypeKey);
  const visualProfile = cloneVisualValue(
    input.visualProfile ?? input.autoProfile ?? body?.visualProfile ?? null,
  );
  const gasProfile = cloneVisualValue(input.gasProfile ?? body?.gasProfile ?? null);
  const ringAppearance = cloneVisualValue(
    input.ringAppearance ?? input.autoRingAppearance ?? body?.ringAppearance ?? null,
  );
  const descriptor = {
    schemaVersion: VISUAL_OVERRIDE_SCHEMA_VERSION,
    bodyId: firstString(input.bodyId, body?.id),
    renderFamily: firstString(input.renderFamily, body?.renderFamily, body?.bodyType),
    renderModel: firstString(input.renderModel, body?.renderModel),
    sourceMode: visualMode,
    presetId: "auto",
    baseRecipeId: firstString(
      input.baseRecipeId,
      input.recipeId,
      body?.recipeId,
      visualProfile?.recipeId,
      body?.visualProfile?.recipeId,
      body?.inputs?.appearanceRecipeId,
    ),
    styleId: firstString(input.styleId, input.style, body?.styleId, body?.style),
    seed: firstString(input.seed, body?.seed),
    visualSubtypeKey,
    subtypeVisualDescriptor,
    visualProfile,
    gasProfile,
    ringAppearance,
    textureDescriptor: cloneVisualValue(input.textureDescriptor ?? body?.textureDescriptor ?? null),
    meshDescriptor: cloneVisualValue(input.meshDescriptor ?? body?.meshDescriptor ?? null),
    activeOverridePaths: [],
    unavailableOverridePaths: [],
    warnings: [],
    normalizedVisualOverrides: null,
    appliedVisualOverrides: null,
    visualOverrideCount: 0,
    overrideSignature: "",
  };
  descriptor.autoSignature = buildAutoSignature(descriptor);
  descriptor.renderSignature = buildRenderSignature(descriptor.autoSignature, "");

  if (visualMode === "auto") return descriptor;

  const normalizedOverrides = normalizeVisualOverrides(rawOverrides, input.manifest);
  if (!stripEmptyVisualOverrides(normalizedOverrides)) return descriptor;

  const merged = mergeVisualOverrides(descriptor, normalizedOverrides, input.manifest);
  merged.sourceMode = visualMode;
  merged.visualSubtypeKey = visualSubtypeKey;
  merged.subtypeVisualDescriptor = subtypeVisualDescriptor;
  merged.autoSignature = descriptor.autoSignature;
  merged.renderSignature = buildRenderSignature(merged.autoSignature, merged.overrideSignature);
  return merged;
}

export const __planetaryVisualDescriptorInternals = Object.freeze({
  buildAutoSignature,
  buildRenderSignature,
});
