import {
  countActiveVisualOverrides,
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

function normalizeAppearanceDraft(appearance = {}, manifest = null) {
  const visualMode = normalizeVisualMode(appearance?.visualMode);
  const visualOverrides = stripEmptyVisualOverrides(
    normalizeVisualOverrides(appearance?.visualOverrides, manifest),
  );
  return {
    visualMode,
    visualOverrides,
  };
}

function stableValue(value) {
  return __planetaryVisualOverrideInternals.stableStringify(value || null);
}

function splitPath(path) {
  return String(path || "")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getPath(value, path) {
  const parts = splitPath(path);
  let cursor = value;
  for (const part of parts) {
    if (!isPlainObject(cursor)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function setPath(target, path, value) {
  const parts = splitPath(path);
  if (!parts.length) return target;
  let cursor = target;
  for (let idx = 0; idx < parts.length - 1; idx += 1) {
    const part = parts[idx];
    if (!isPlainObject(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }
  if (value === undefined || value === null || value === "") {
    delete cursor[parts[parts.length - 1]];
  } else {
    cursor[parts[parts.length - 1]] = value;
  }
  return target;
}

function deleteRoot(target, root) {
  if (!isPlainObject(target)) return {};
  const out = cloneVisualValue(target) || {};
  delete out[root];
  return out;
}

function pruneEmptyParents(root, parts) {
  if (!isPlainObject(root) || !Array.isArray(parts) || parts.length < 2) return;
  for (let depth = parts.length - 1; depth > 0; depth -= 1) {
    const parentParts = parts.slice(0, depth);
    const parent = getPath(root, parentParts.join("."));
    if (!isPlainObject(parent) || Object.keys(parent).length > 0) break;
    const grandparent = depth === 1 ? root : getPath(root, parentParts.slice(0, -1).join("."));
    if (!isPlainObject(grandparent)) break;
    delete grandparent[parentParts[parentParts.length - 1]];
  }
}

function deletePath(target, path) {
  if (!isPlainObject(target)) return {};
  const parts = splitPath(path);
  if (!parts.length) return cloneVisualValue(target) || {};
  const out = cloneVisualValue(target) || {};
  let cursor = out;
  for (let idx = 0; idx < parts.length - 1; idx += 1) {
    cursor = cursor?.[parts[idx]];
    if (!isPlainObject(cursor)) return out;
  }
  delete cursor[parts[parts.length - 1]];
  pruneEmptyParents(out, parts);
  return out;
}

function sectionControlPaths(state, sectionId) {
  const section = (state?.manifest?.sections || []).find((entry) => entry?.id === sectionId);
  if (!Array.isArray(section?.controls)) return [];
  return section.controls
    .map((control) => String(control?.path || control?.id || control?.key || "").trim())
    .filter(Boolean);
}

function normalizeLockedFields(value) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map((entry) => String(entry || "").trim()).filter(Boolean))].sort();
}

function normalizeDraftOverrides(overrides, manifest) {
  return stripEmptyVisualOverrides(normalizeVisualOverrides(overrides, manifest));
}

function withDraftOverrides(state, overrides, visualMode = null) {
  const visualOverrides = normalizeDraftOverrides(overrides, state.manifest);
  const nextMode =
    visualMode ||
    (visualOverrides ? state.draft?.visualMode || "custom" : state.draft?.visualMode || "auto");
  return {
    ...state,
    draft: {
      visualMode: normalizeVisualMode(nextMode),
      visualOverrides,
    },
  };
}

function mergePatchValue(base, patch) {
  if (patch == null) return null;
  if (!isPlainObject(base) || !isPlainObject(patch)) return cloneVisualValue(patch);
  const out = cloneVisualValue(base) || {};
  for (const [key, value] of Object.entries(patch)) {
    if (value == null) {
      delete out[key];
    } else if (isPlainObject(value)) {
      out[key] = mergePatchValue(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function deriveClassificationLabel(input = {}) {
  return (
    input.classificationLabel ||
    input.classification?.displayLabel ||
    input.classification?.label ||
    input.classification?.family ||
    "Planetary body"
  );
}

function deriveSubtypeLabels(input = {}) {
  const explicit = Array.isArray(input.subtypeLabels) ? input.subtypeLabels : [];
  const fromSummary = Array.isArray(input.subtypeSummary?.subtypes)
    ? input.subtypeSummary.subtypes.map((entry) => entry?.label || entry?.id)
    : [];
  const fromClassification = Array.isArray(input.classification?.subtypes)
    ? input.classification.subtypes.map((entry) => entry?.label || entry?.id)
    : [];
  return [...explicit, ...fromSummary, ...fromClassification]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

export function createPlanetaryVisualEditorState(input = {}) {
  const body = input.body || {};
  const manifest = input.manifest || null;
  const originalAppearance = normalizeAppearanceDraft(
    body.appearance || input.appearance,
    manifest,
  );
  const draft = normalizeAppearanceDraft(input.draftAppearance || originalAppearance, manifest);

  return {
    bodyId: String(input.bodyId || body.id || ""),
    bodyName: String(input.bodyName || body.name || body.id || "Planetary body"),
    classificationLabel: String(deriveClassificationLabel(input)),
    subtypeLabels: deriveSubtypeLabels(input),
    autoSeed: String(input.autoSeed || ""),
    manifest,
    originalAppearance,
    draft,
    compareMode: input.compareMode === "auto" ? "auto" : "custom",
  };
}

export function setPlanetaryVisualEditorMode(state, visualMode) {
  const draft = {
    ...state.draft,
    visualMode: normalizeVisualMode(visualMode),
  };
  return { ...state, draft };
}

export function mergePlanetaryVisualEditorOverrides(state, patch) {
  const merged = mergePatchValue(state.draft?.visualOverrides || {}, patch);
  return withDraftOverrides(state, merged, merged ? "custom" : state.draft?.visualMode);
}

export function applyPlanetaryVisualEditorPatch(state, patch = {}) {
  return withDraftOverrides(
    state,
    patch.visualOverrides,
    patch.visualMode || state.draft?.visualMode || "auto",
  );
}

export function getPlanetaryVisualEditorControlValue(state, path) {
  return getPath(state?.draft?.visualOverrides, path);
}

export function hasPlanetaryVisualEditorControlValue(state, path) {
  return getPlanetaryVisualEditorControlValue(state, path) !== undefined;
}

export function isPlanetaryVisualEditorFieldLocked(state, path) {
  return normalizeLockedFields(state?.draft?.visualOverrides?.lockedFields).includes(path);
}

export function setPlanetaryVisualEditorControlValue(state, path, value) {
  if (isPlanetaryVisualEditorFieldLocked(state, path)) return state;
  const overrides = cloneVisualValue(state.draft?.visualOverrides) || {};
  setPath(overrides, path, value);
  return withDraftOverrides(state, overrides, "custom");
}

export function setPlanetaryVisualEditorLockedField(state, path, locked) {
  const normalizedPath = String(path || "").trim();
  if (!normalizedPath) return state;
  const overrides = cloneVisualValue(state.draft?.visualOverrides) || {};
  const lockedFields = new Set(normalizeLockedFields(overrides.lockedFields));
  if (locked) lockedFields.add(normalizedPath);
  else lockedFields.delete(normalizedPath);
  overrides.lockedFields = [...lockedFields].sort();
  return withDraftOverrides(state, overrides, state.draft?.visualMode || "auto");
}

export function resetPlanetaryVisualEditorSection(state, sectionId) {
  const root = String(sectionId || "").trim();
  if (!root) return state;
  const controlPaths = sectionControlPaths(state, root);
  let overrides = state.draft?.visualOverrides;
  if (controlPaths.length) {
    for (const path of controlPaths) overrides = deletePath(overrides, path);
  } else {
    overrides = deleteRoot(overrides, root);
  }
  const lockedFields = normalizeLockedFields(overrides.lockedFields).filter((path) =>
    controlPaths.length
      ? !controlPaths.some(
          (controlPath) => path === controlPath || path.startsWith(`${controlPath}.`),
        )
      : !path.startsWith(`${root}.`),
  );
  if (lockedFields.length) overrides.lockedFields = lockedFields;
  else delete overrides.lockedFields;
  return withDraftOverrides(state, overrides, state.draft?.visualMode || "auto");
}

export function resetPlanetaryVisualEditorDraft(state) {
  return {
    ...state,
    draft: {
      visualMode: "auto",
      visualOverrides: null,
    },
    compareMode: "custom",
  };
}

export function setPlanetaryVisualEditorCompareMode(state, compareMode) {
  return {
    ...state,
    compareMode: compareMode === "auto" ? "auto" : "custom",
  };
}

export function countPlanetaryVisualEditorOverrides(state) {
  return countActiveVisualOverrides(state?.draft?.visualOverrides);
}

export function isPlanetaryVisualEditorDirty(state) {
  return stableValue(state?.draft) !== stableValue(state?.originalAppearance);
}

export function getPlanetaryVisualEditorPreviewAppearance(state) {
  if (state?.compareMode === "auto") {
    return {
      visualMode: "auto",
      visualOverrides: null,
    };
  }
  return {
    visualMode: normalizeVisualMode(state?.draft?.visualMode),
    visualOverrides: stripEmptyVisualOverrides(
      normalizeVisualOverrides(state?.draft?.visualOverrides, state?.manifest),
    ),
  };
}

export function buildPlanetaryVisualEditorSavePatch(state) {
  const draft = {
    visualMode: normalizeVisualMode(state?.draft?.visualMode),
    visualOverrides: stripEmptyVisualOverrides(
      normalizeVisualOverrides(state?.draft?.visualOverrides, state?.manifest),
    ),
  };
  return {
    visualMode: draft.visualMode,
    visualOverrides: draft.visualOverrides,
  };
}

export function summarizePlanetaryVisualEditorState(state) {
  const overrideCount = countPlanetaryVisualEditorOverrides(state);
  return {
    bodyId: state?.bodyId || "",
    bodyName: state?.bodyName || "Planetary body",
    classificationLabel: state?.classificationLabel || "Planetary body",
    subtypeText: (state?.subtypeLabels || []).join(", "),
    visualMode: normalizeVisualMode(state?.draft?.visualMode),
    compareMode: state?.compareMode === "auto" ? "auto" : "custom",
    overrideCount,
    dirty: isPlanetaryVisualEditorDirty(state),
  };
}
