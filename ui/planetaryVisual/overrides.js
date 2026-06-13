export const VISUAL_OVERRIDE_SCHEMA_VERSION = 1;

const VISUAL_MODE_ALIASES = Object.freeze({
  auto: "auto",
  default: "auto",
  generated: "auto",
  science: "auto",
  mixed: "mixed",
  partial: "mixed",
  blend: "mixed",
  custom: "custom",
  manual: "custom",
  override: "custom",
});

const METADATA_KEYS = new Set([
  "schemaVersion",
  "version",
  "visualMode",
  "mode",
  "presetId",
  "seed",
  "lockedFields",
  "visualOverrides",
  "appearance",
  "sections",
]);

const SIGNATURE_METADATA_KEYS = new Set(["presetId", "seed"]);
const RESERVED_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const DEFAULT_SECTION_IDS = Object.freeze([
  "palette",
  "surface",
  "atmosphere",
  "clouds",
  "bands",
  "storms",
  "rings",
  "subtype",
  "material",
]);
const DEFAULT_SECTION_SET = new Set(DEFAULT_SECTION_IDS);

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeIdentifier(value) {
  const id = String(value ?? "").trim();
  if (!id || RESERVED_KEYS.has(id)) return "";
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) return "";
  return id;
}

function normalizeControlPath(value) {
  const path = String(value ?? "")
    .trim()
    .replace(/\[(\w+)\]/g, ".$1")
    .replace(/\s+/g, "");
  if (!path) return "";
  const parts = path.split(".").map(normalizeIdentifier).filter(Boolean);
  if (!parts.length || parts.length > 8) return "";
  if (parts.join(".") !== path) return "";
  return parts.join(".");
}

function normalizeString(value, maxLength = 96) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : "";
}

function normalizeOverrideValue(value) {
  if (value == null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const normalized = normalizeString(value, 160);
    return normalized || undefined;
  }
  return undefined;
}

function deepClone(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value;
  return JSON.parse(JSON.stringify(value));
}

function sortedStableValue(value) {
  if (Array.isArray(value)) return value.map(sortedStableValue);
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const key of Object.keys(value).sort()) {
    const child = value[key];
    if (child === undefined) continue;
    out[key] = sortedStableValue(child);
  }
  return out;
}

function stableStringify(value) {
  return JSON.stringify(sortedStableValue(value));
}

function setPath(target, path, value) {
  const parts = String(path || "")
    .split(".")
    .filter(Boolean);
  if (!parts.length) return target;
  let cursor = target;
  for (let idx = 0; idx < parts.length - 1; idx += 1) {
    const key = parts[idx];
    if (!isPlainObject(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
  return target;
}

function getPath(value, path) {
  const parts = String(path || "")
    .split(".")
    .filter(Boolean);
  let cursor = value;
  for (const key of parts) {
    if (!isPlainObject(cursor) && !Array.isArray(cursor)) return undefined;
    cursor = cursor?.[key];
  }
  return cursor;
}

function stripObject(value) {
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const key of Object.keys(value).sort()) {
    if (RESERVED_KEYS.has(key)) continue;
    const child = stripObject(value[key]);
    if (child === undefined) continue;
    if (isPlainObject(child) && Object.keys(child).length === 0) continue;
    out[key] = child;
  }
  return out;
}

function collectSectionControls(section, sectionAvailable, out) {
  const sectionId = normalizeIdentifier(section?.id || section?.key || section?.name);
  if (sectionId) {
    out.sections.add(sectionId);
    out.sectionAvailability.set(sectionId, sectionAvailable !== false);
  }
  const controls = Array.isArray(section?.controls) ? section.controls : [];
  for (const control of controls) {
    const rawPath =
      control?.path ||
      control?.id ||
      control?.key ||
      (sectionId && control?.name ? `${sectionId}.${control.name}` : "");
    const path = normalizeControlPath(rawPath);
    if (!path) continue;
    const root = path.split(".")[0];
    out.knownPaths.add(path);
    out.sections.add(root);
    out.pathAvailability.set(path, sectionAvailable !== false && control?.available !== false);
  }
}

function collectControlList(controls, out) {
  if (!Array.isArray(controls)) return;
  for (const control of controls) {
    const path = normalizeControlPath(
      isPlainObject(control) ? control.path || control.id || control.key : control,
    );
    if (!path) continue;
    out.knownPaths.add(path);
    out.sections.add(path.split(".")[0]);
    out.pathAvailability.set(path, !isPlainObject(control) || control.available !== false);
  }
}

function buildManifestIndex(manifest) {
  const out = {
    knownPaths: new Set(),
    pathAvailability: new Map(),
    sections: new Set(),
    sectionAvailability: new Map(),
  };
  if (!isPlainObject(manifest)) {
    for (const section of DEFAULT_SECTION_IDS) {
      out.sections.add(section);
      out.sectionAvailability.set(section, true);
    }
    return out;
  }

  collectControlList(manifest.controls, out);
  collectControlList(manifest.availableControls, out);
  collectControlList(manifest.unavailableControls, {
    ...out,
    pathAvailability: {
      set(path) {
        out.pathAvailability.set(path, false);
      },
    },
  });

  if (isPlainObject(manifest.controlAvailability)) {
    for (const [rawPath, available] of Object.entries(manifest.controlAvailability)) {
      const path = normalizeControlPath(rawPath);
      if (!path) continue;
      out.knownPaths.add(path);
      out.sections.add(path.split(".")[0]);
      out.pathAvailability.set(path, available !== false);
    }
  }

  if (Array.isArray(manifest.sections)) {
    for (const section of manifest.sections) {
      const sectionAvailable = section?.available !== false;
      collectSectionControls(section, sectionAvailable, out);
      const sectionId = normalizeIdentifier(section?.id || section?.key || section?.name);
      if (sectionId && !Array.isArray(section?.controls)) {
        out.sections.add(sectionId);
        out.sectionAvailability.set(sectionId, sectionAvailable);
      }
    }
  }

  if (isPlainObject(manifest.sections)) {
    for (const [rawId, section] of Object.entries(manifest.sections)) {
      const sectionId = normalizeIdentifier(rawId);
      if (!sectionId) continue;
      const sectionAvailable = section?.available !== false;
      out.sections.add(sectionId);
      out.sectionAvailability.set(sectionId, sectionAvailable);
      collectSectionControls({ id: sectionId, ...(section || {}) }, sectionAvailable, out);
    }
  }

  if (!out.sections.size) {
    for (const section of DEFAULT_SECTION_IDS) {
      out.sections.add(section);
      out.sectionAvailability.set(section, true);
    }
  }

  return out;
}

function pathAllowed(path, manifestIndex) {
  const root = path.split(".")[0];
  if (manifestIndex.knownPaths.size > 0) return manifestIndex.knownPaths.has(path);
  if (manifestIndex.sections.size > 0) return manifestIndex.sections.has(root);
  return DEFAULT_SECTION_SET.has(root);
}

function pathAvailable(path, manifestIndex) {
  const root = path.split(".")[0];
  if (!pathAllowed(path, manifestIndex)) return false;
  if (manifestIndex.pathAvailability.has(path)) return manifestIndex.pathAvailability.get(path);
  if (manifestIndex.sectionAvailability.has(root)) {
    return manifestIndex.sectionAvailability.get(root) !== false;
  }
  return true;
}

function normalizeOverrideTree(source, manifestIndex, rootPath = "") {
  const out = {};
  if (!isPlainObject(source)) return out;
  for (const key of Object.keys(source).sort()) {
    const segment = normalizeIdentifier(key);
    if (!segment || METADATA_KEYS.has(segment)) continue;
    const path = rootPath ? `${rootPath}.${segment}` : segment;
    const child = source[key];
    if (isPlainObject(child)) {
      const nested = normalizeOverrideTree(child, manifestIndex, path);
      if (Object.keys(nested).length) out[segment] = nested;
      continue;
    }
    const value = normalizeOverrideValue(child);
    if (value === undefined || !pathAllowed(path, manifestIndex)) continue;
    out[segment] = value;
  }
  return out;
}

function collectLeaves(value, prefix = "") {
  if (!isPlainObject(value)) return [];
  const leaves = [];
  for (const key of Object.keys(value).sort()) {
    if (RESERVED_KEYS.has(key)) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    const child = value[key];
    if (isPlainObject(child)) {
      leaves.push(...collectLeaves(child, path));
    } else if (child !== undefined) {
      leaves.push({ path, value: child });
    }
  }
  return leaves;
}

function sourceOverridesFrom(raw) {
  if (!isPlainObject(raw)) return {};
  if (isPlainObject(raw.visualOverrides)) return raw.visualOverrides;
  if (isPlainObject(raw.appearance?.visualOverrides)) return raw.appearance.visualOverrides;
  return raw;
}

function normalizeLockedFields(value) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map(normalizeControlPath).filter(Boolean))].sort();
}

function renderRelevantSignaturePayload(overrides) {
  const stripped = stripEmptyVisualOverrides(overrides);
  if (!stripped) return null;
  const payload = {};
  for (const key of Object.keys(stripped).sort()) {
    if (key === "schemaVersion" || key === "lockedFields") continue;
    if (SIGNATURE_METADATA_KEYS.has(key)) {
      payload[key] = stripped[key];
      continue;
    }
    if (DEFAULT_SECTION_SET.has(key)) payload[key] = stripped[key];
  }
  return Object.keys(payload).length ? payload : null;
}

export function normalizeVisualMode(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return VISUAL_MODE_ALIASES[normalized] || "auto";
}

export function normalizeVisualOverrides(raw, manifest = null) {
  const source = sourceOverridesFrom(raw);
  const manifestIndex = buildManifestIndex(manifest);
  const out = { schemaVersion: VISUAL_OVERRIDE_SCHEMA_VERSION };
  const presetId = normalizeString(source.presetId, 80);
  const seed = normalizeString(source.seed, 96);
  const lockedFields = normalizeLockedFields(source.lockedFields);
  if (presetId && presetId !== "auto") out.presetId = presetId;
  if (seed) out.seed = seed;
  if (lockedFields.length) out.lockedFields = lockedFields;

  const sectionSource = isPlainObject(source.sections) ? source.sections : source;
  const tree = normalizeOverrideTree(sectionSource, manifestIndex);
  for (const [key, value] of Object.entries(tree)) out[key] = value;
  return out;
}

export function stripEmptyVisualOverrides(overrides) {
  if (!isPlainObject(overrides)) return null;
  const out = { schemaVersion: VISUAL_OVERRIDE_SCHEMA_VERSION };
  const presetId = normalizeString(overrides.presetId, 80);
  const seed = normalizeString(overrides.seed, 96);
  const lockedFields = normalizeLockedFields(overrides.lockedFields);
  if (presetId && presetId !== "auto") out.presetId = presetId;
  if (seed) out.seed = seed;
  if (lockedFields.length) out.lockedFields = lockedFields;

  for (const key of Object.keys(overrides).sort()) {
    if (METADATA_KEYS.has(key) || !DEFAULT_SECTION_SET.has(key)) continue;
    const stripped = stripObject(overrides[key]);
    if (isPlainObject(stripped) && Object.keys(stripped).length) out[key] = stripped;
  }

  return Object.keys(out).length > 1 ? out : null;
}

export function countActiveVisualOverrides(overrides) {
  const payload = renderRelevantSignaturePayload(overrides);
  if (!payload) return 0;
  let count = 0;
  for (const key of Object.keys(payload)) {
    if (SIGNATURE_METADATA_KEYS.has(key)) {
      count += 1;
      continue;
    }
    count += collectLeaves(payload[key]).length;
  }
  return count;
}

export function buildVisualOverrideSignature(overrides) {
  const payload = renderRelevantSignaturePayload(overrides);
  return payload ? `v${VISUAL_OVERRIDE_SCHEMA_VERSION}:${stableStringify(payload)}` : "";
}

function applyRingOverride(descriptor, relativePath, value) {
  if (!isPlainObject(descriptor.ringAppearance)) descriptor.ringAppearance = {};
  if (relativePath === "enabled") {
    descriptor.ringAppearance.enabled = value === true;
    if (isPlainObject(descriptor.visualProfile?.ring))
      descriptor.visualProfile.ring.enabled = value === true;
    return;
  }
  if (relativePath === "styleId" || relativePath === "effectiveStyleId") {
    descriptor.ringAppearance.ringStyleId = String(value);
    descriptor.ringAppearance.effectiveStyleId = String(value);
    if (!isPlainObject(descriptor.ringAppearance.appearance))
      descriptor.ringAppearance.appearance = {};
    descriptor.ringAppearance.appearance.styleId = String(value);
    return;
  }
  if (!isPlainObject(descriptor.ringAppearance.appearance))
    descriptor.ringAppearance.appearance = {};
  setPath(descriptor.ringAppearance.appearance, relativePath, value);
}

function applyProfileRenderAlias(profile, root, relativePath, value) {
  if (!isPlainObject(profile) || !relativePath) return;
  if (root === "palette") {
    const paletteKey =
      relativePath === "primary"
        ? "c1"
        : relativePath === "secondary"
          ? "c2"
          : relativePath === "accent"
            ? "c3"
            : "";
    if (paletteKey) {
      setPath(profile, `palette.${paletteKey}`, value);
      if (isPlainObject(profile.landPalette)) setPath(profile, `landPalette.${paletteKey}`, value);
    }
    return;
  }

  if (root === "surface") {
    if (relativePath === "oceanCoverage") {
      setPath(profile, "ocean.coverage", value);
    } else if (relativePath === "ocean.colour" || relativePath === "ocean.color") {
      setPath(profile, "ocean.colour", value);
    } else if (relativePath === "ice.colour" || relativePath === "ice.color") {
      setPath(profile, "iceCaps.colour", value);
    } else if (relativePath === "iceCoverage") {
      profile.iceCoverage = value;
      setPath(profile, "iceCaps.north", value);
      setPath(profile, "iceCaps.south", value);
    } else if (relativePath === "craterDensity") {
      setPath(profile, "terrain.craterDensity", value);
    } else if (relativePath === "roughness") {
      setPath(profile, "terrain.roughness", value);
    } else if (relativePath === "terrainContrast") {
      setPath(profile, "terrain.contrast", value);
    } else if (relativePath === "vegetationCoverage") {
      setPath(profile, "vegetation.coverage", value);
    } else if (relativePath === "desertCoverage") {
      setPath(profile, "desert.coverage", value);
    } else if (relativePath === "lavaCoverage") {
      setPath(profile, "lava.coverage", value);
    }
  }
}

function applySubtypeRenderOverride(descriptor, relativePath, value) {
  if (relativePath === "recipeId") {
    descriptor.baseRecipeId = String(value);
    if (isPlainObject(descriptor.visualProfile)) descriptor.visualProfile.recipeId = String(value);
    return;
  }
  if (relativePath === "envelopeStyleId") {
    const styleId = String(value);
    if (styleId && styleId !== "auto") descriptor.styleId = styleId;
  }
}

function visualTargetForOverride(descriptor, root) {
  const renderFamily = String(descriptor?.renderFamily || "")
    .trim()
    .toLowerCase();
  const gasLike =
    isPlainObject(descriptor?.gasProfile) &&
    (renderFamily === "gas" ||
      renderFamily === "gasgiant" ||
      renderFamily === "volatile" ||
      !isPlainObject(descriptor?.visualProfile));
  if (
    gasLike &&
    ["palette", "atmosphere", "clouds", "bands", "storms", "material"].includes(root)
  ) {
    return "gasProfile";
  }
  if (root === "bands" || root === "storms") {
    return descriptor.gasProfile ? "gasProfile" : "visualProfile";
  }
  if (root === "material") return "material";
  return "visualProfile";
}

function applyVisualOverride(descriptor, path, value) {
  const [root, ...rest] = path.split(".");
  const relativePath = rest.join(".");
  if (!relativePath) return false;
  if (root === "rings") {
    applyRingOverride(descriptor, relativePath, value);
    return true;
  }
  if (root === "subtype") {
    if (!isPlainObject(descriptor.subtypeOverrides)) descriptor.subtypeOverrides = {};
    setPath(descriptor.subtypeOverrides, relativePath, value);
    applySubtypeRenderOverride(descriptor, relativePath, value);
    return true;
  }
  const visualTarget = visualTargetForOverride(descriptor, root);
  if (!isPlainObject(descriptor[visualTarget])) descriptor[visualTarget] = {};
  setPath(descriptor[visualTarget], path, value);
  applyProfileRenderAlias(descriptor[visualTarget], root, relativePath, value);
  return true;
}

export function mergeVisualOverrides(baseDescriptor, overrides, manifest = null) {
  const descriptor = deepClone(baseDescriptor || {});
  const normalized = normalizeVisualOverrides(overrides, manifest);
  const stripped = stripEmptyVisualOverrides(normalized);
  const manifestIndex = buildManifestIndex(manifest);
  const activeOverridePaths = [];
  const unavailableOverridePaths = [];
  const appliedOverrides = { schemaVersion: VISUAL_OVERRIDE_SCHEMA_VERSION };
  const warnings = Array.isArray(descriptor.warnings) ? [...descriptor.warnings] : [];

  if (stripped?.presetId) {
    descriptor.presetId = stripped.presetId;
    appliedOverrides.presetId = stripped.presetId;
  }
  if (stripped?.seed) {
    descriptor.seed = stripped.seed;
    appliedOverrides.seed = stripped.seed;
  }

  const leaves = DEFAULT_SECTION_IDS.flatMap((section) =>
    collectLeaves(stripped?.[section], section),
  );
  for (const { path, value } of leaves) {
    if (!pathAvailable(path, manifestIndex)) {
      unavailableOverridePaths.push(path);
      warnings.push(`Visual override '${path}' is unavailable for this body and was ignored.`);
      continue;
    }
    if (!applyVisualOverride(descriptor, path, value)) continue;
    activeOverridePaths.push(path);
    setPath(appliedOverrides, path, value);
  }

  descriptor.activeOverridePaths = activeOverridePaths.sort();
  descriptor.unavailableOverridePaths = unavailableOverridePaths.sort();
  descriptor.warnings = warnings;
  descriptor.normalizedVisualOverrides = stripped || null;
  descriptor.appliedVisualOverrides = stripEmptyVisualOverrides(appliedOverrides);
  descriptor.visualOverrideCount = countActiveVisualOverrides(descriptor.appliedVisualOverrides);
  descriptor.overrideSignature = buildVisualOverrideSignature(descriptor.appliedVisualOverrides);
  descriptor.renderSignature = stableStringify({
    auto: descriptor.autoSignature || "",
    override: descriptor.overrideSignature || "",
  });
  return descriptor;
}

export const __planetaryVisualOverrideInternals = Object.freeze({
  getPath,
  stableStringify,
});
