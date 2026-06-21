import {
  ensureCanonicalPlanetaryBodyStorage,
  findPlanetaryBody,
  gasGiantEntryFromPlanetaryBody,
  getSelectedPlanetaryBodyLegacyId,
  legacyParentIdForBody,
  listClassifiedPlanetaryBodies,
  listGasGiantEntries,
  listPlanetaryBodies,
  listRockyPlanetEntries,
  planetFromGasGiantEntry,
  planetFromRockyEntry,
  replacePlanetaryBodiesByLegacyKind,
  rockyEntryFromPlanetaryBody,
  selectPlanetaryBodyByLegacyId,
  splitPlanetaryBodiesByLegacyKind,
  syncLegacyPlanetCollections,
  syncMoonParentAliases,
  syncUnifiedPlanetaryBodies,
} from "./compat/planetaryBodyCompatibility.js";
import {
  normalizeVisualMode,
  normalizeVisualOverrides,
  stripEmptyVisualOverrides,
} from "../planetaryVisual/overrides.js";
import {
  normalizeCompositionInventoryInputs,
  normalizePresentCompositionInventoryInputs,
} from "./compositionInventoryInputs.js";

export {
  ensureCanonicalPlanetaryBodyStorage,
  findPlanetaryBody,
  gasGiantEntryFromPlanetaryBody,
  getSelectedPlanetaryBodyLegacyId,
  listGasGiantEntries,
  listPlanetaryBodies,
  listRockyPlanetEntries,
  planetFromGasGiantEntry,
  planetFromRockyEntry,
  replacePlanetaryBodiesByLegacyKind,
  rockyEntryFromPlanetaryBody,
  selectPlanetaryBodyByLegacyId,
  splitPlanetaryBodiesByLegacyKind,
  syncLegacyPlanetCollections,
  syncMoonParentAliases,
  syncUnifiedPlanetaryBodies,
};

export const PLANETARY_BODY_STORAGE_VERSION = 1;

function clonePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...value };
}

function hasOwnField(value, key) {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeHostFrameId(value) {
  return String(value ?? "").trim() || null;
}

function normalizeId(value, fallback) {
  const id = String(value ?? "").trim();
  return id || fallback;
}

function normalizeAuthoringIntent(value, fallback = "auto") {
  const normalized = String(value || "").trim();
  switch (normalized) {
    case "rocky":
    case "volatile":
    case "iceGiant":
    case "gasGiant":
    case "substellar":
    case "auto":
      return normalized;
    default:
      return fallback;
  }
}

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function optionalFiniteOrNull(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeOptionalScalar(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeAppearanceString(value) {
  return String(value ?? "").trim();
}

function normalizeOptionalFlag(value) {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value > 0 : null;
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  if (["true", "yes", "y", "1", "on"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "off"].includes(normalized)) return false;
  return null;
}

function optionalEvidenceFields(source, fields, normalizeValue) {
  const out = {};
  const raw = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  for (const field of fields) {
    if (hasOwnField(raw, field)) out[field] = normalizeValue(raw[field]);
  }
  return out;
}

function normalizeCompositionEvidence(source) {
  return {
    ...optionalEvidenceFields(source, ["carbonRichness"], normalizeOptionalScalar),
    ...normalizePresentCompositionInventoryInputs(source),
  };
}

function normalizeDensityEvidence(source) {
  return optionalEvidenceFields(source, ["bulkDensityGcm3"], optionalFiniteOrNull);
}

function normalizeThermalEvidence(source) {
  return optionalEvidenceFields(
    source,
    ["internalHeatFluxWm2", "tidalHeatFluxWm2"],
    optionalFiniteOrNull,
  );
}

function normalizeHistoryEvidence(source) {
  return optionalEvidenceFields(
    source,
    ["strippedEnvelopeCandidate", "migratedCloseIn", "rogueCandidate"],
    normalizeOptionalFlag,
  );
}

function finiteOrDefault(value, fallback) {
  const number = finiteOrNull(value);
  return number == null ? fallback : number;
}

function normalizeSlotIndex(value) {
  const slot = Number(value);
  return Number.isFinite(slot) && slot > 0 ? Math.round(slot) : null;
}

function isPlanetaryBodyLike(value) {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.bodyType === "planetaryBody"
  );
}

export function normalizePlanetaryBodyAppearance(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  for (const field of ["rockyRecipeId", "giantRecipeId", "styleId"]) {
    if (hasOwnField(raw, field)) out[field] = normalizeAppearanceString(raw[field]);
  }
  if (hasOwnField(raw, "visualMode")) out.visualMode = normalizeVisualMode(raw.visualMode);
  if (hasOwnField(raw, "visualOverrides")) {
    const visualOverrides = stripEmptyVisualOverrides(
      normalizeVisualOverrides(raw.visualOverrides),
    );
    if (visualOverrides) out.visualOverrides = visualOverrides;
  }
  return Object.keys(out).length ? out : null;
}

function mergeVisualOverridePatch(baseOverrides, patchOverrides) {
  if (patchOverrides == null) return null;
  if (
    !baseOverrides ||
    typeof baseOverrides !== "object" ||
    Array.isArray(baseOverrides) ||
    typeof patchOverrides !== "object" ||
    Array.isArray(patchOverrides)
  ) {
    return patchOverrides;
  }
  const out = { ...baseOverrides };
  for (const [key, value] of Object.entries(patchOverrides)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = mergeVisualOverridePatch(baseOverrides[key], value);
    } else if (value == null) {
      delete out[key];
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function mergePlanetaryBodyVisualAppearance(appearance, patch) {
  const current = normalizePlanetaryBodyAppearance(appearance) || {};
  const source =
    patch?.appearance && typeof patch.appearance === "object" && !Array.isArray(patch.appearance)
      ? patch.appearance
      : patch && typeof patch === "object" && !Array.isArray(patch)
        ? patch
        : {};
  const next = { ...current };
  for (const field of ["rockyRecipeId", "giantRecipeId", "styleId"]) {
    if (hasOwnField(source, field)) next[field] = normalizeAppearanceString(source[field]);
  }
  if (hasOwnField(source, "visualMode")) next.visualMode = normalizeVisualMode(source.visualMode);
  if (hasOwnField(source, "visualOverrides")) {
    const merged = mergeVisualOverridePatch(current.visualOverrides, source.visualOverrides);
    const visualOverrides = stripEmptyVisualOverrides(normalizeVisualOverrides(merged));
    if (visualOverrides) next.visualOverrides = visualOverrides;
    else delete next.visualOverrides;
  }
  return normalizePlanetaryBodyAppearance(next);
}

function deleteVisualOverridePath(overrides, path) {
  const parts = String(path || "")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length || !overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return overrides;
  }
  const out = JSON.parse(JSON.stringify(overrides));
  let cursor = out;
  for (let idx = 0; idx < parts.length - 1; idx += 1) {
    cursor = cursor?.[parts[idx]];
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return out;
  }
  delete cursor[parts[parts.length - 1]];
  return out;
}

export function resetPlanetaryBodyVisualAppearance(appearance, scope = "all") {
  const current = normalizePlanetaryBodyAppearance(appearance) || {};
  const normalizedScope = String(scope || "all").trim() || "all";
  const next = { ...current };
  if (["all", "visual", "appearance"].includes(normalizedScope)) {
    delete next.visualOverrides;
    next.visualMode = "auto";
    return normalizePlanetaryBodyAppearance(next);
  }
  if (normalizedScope === "mode") {
    next.visualMode = "auto";
    return normalizePlanetaryBodyAppearance(next);
  }
  if (normalizedScope === "overrides") {
    delete next.visualOverrides;
    if (next.visualMode === "custom" || next.visualMode === "mixed") next.visualMode = "auto";
    return normalizePlanetaryBodyAppearance(next);
  }
  const visualOverrides = stripEmptyVisualOverrides(
    normalizeVisualOverrides(deleteVisualOverridePath(next.visualOverrides, normalizedScope)),
  );
  if (visualOverrides) {
    next.visualOverrides = visualOverrides;
  } else {
    delete next.visualOverrides;
    if (next.visualMode === "custom" || next.visualMode === "mixed") next.visualMode = "auto";
  }
  return normalizePlanetaryBodyAppearance(next);
}

function bodyOrbitAu(body) {
  return finiteOrDefault(body?.orbit?.semiMajorAxisAu, 0);
}

function toPerturberEntry(body) {
  return {
    id: body.id,
    name: body.name,
    au: bodyOrbitAu(body),
    hostFrameId: body.hostFrameId,
    slotIndex: body.slotIndex,
    companionClass: body.giant?.companionClass || body.classificationSeed?.companionClass || null,
    massMjup: body.giant?.massMjup ?? body.classificationSeed?.massMjup ?? null,
    radiusRj: body.giant?.radiusRj ?? body.classificationSeed?.radiusRj ?? null,
    legacyKind: body.legacyKind,
    classification: body.classification,
    sourceBody: body,
  };
}

function toApparentOrbitSample(body) {
  return {
    id: body.selector?.value || `${body.legacyKind}:${body.id}`,
    bodyId: body.id,
    selectorValue: body.selector?.value || null,
    kind: body.legacyKind === "gasGiant" ? "gasGiant" : "planet",
    name: body.name,
    hostFrameId: body.hostFrameId,
    orbitAu: bodyOrbitAu(body),
    legacyKind: body.legacyKind,
    classification: body.classification,
  };
}

function moonParentKindForBody(body) {
  const family = body?.classification?.family;
  if (family === "brownDwarf") return null;
  return body?.legacyKind === "gasGiant" ? "gasGiant" : "planet";
}

export function normalizePlanetaryBody(raw, idx = 1, options = {}) {
  if (isPlanetaryBodyLike(raw)) {
    const { appearance: _appearance, ...rawBody } = raw;
    const id = normalizeId(raw.id, `body${idx}`);
    const legacyKind = raw.legacyKind === "gasGiant" ? "gasGiant" : "rocky";
    const companionClass =
      raw.giant?.companionClass || raw.classificationSeed?.companionClass || "gasGiant";
    const isSubstellar = legacyKind === "gasGiant" && companionClass === "brownDwarf";
    const selectorType = legacyKind === "gasGiant" ? "gasGiant" : "planet";
    const appearance = normalizePlanetaryBodyAppearance(_appearance);
    return {
      ...rawBody,
      id,
      bodyType: "planetaryBody",
      legacyKind,
      role: raw.role || (isSubstellar ? "substellarCompanion" : "planetaryBody"),
      hostFrameId: normalizeHostFrameId(raw.hostFrameId),
      slotIndex: normalizeSlotIndex(raw.slotIndex),
      authoringIntent: normalizeAuthoringIntent(raw.authoringIntent, options.authoringIntent),
      orbit: {
        ...(raw.orbit || {}),
        semiMajorAxisAu: finiteOrDefault(raw.orbit?.semiMajorAxisAu, 0),
      },
      composition: {
        ...(raw.composition || {}),
        ...(legacyKind === "rocky"
          ? normalizeCompositionInventoryInputs(raw.composition || {})
          : {}),
        ...normalizeCompositionEvidence(raw.composition),
        ...normalizeDensityEvidence(raw.composition),
      },
      ...(raw.thermal && typeof raw.thermal === "object" && !Array.isArray(raw.thermal)
        ? {
            thermal: {
              ...raw.thermal,
              ...normalizeThermalEvidence(raw.thermal),
            },
          }
        : {}),
      ...(raw.history && typeof raw.history === "object" && !Array.isArray(raw.history)
        ? {
            history: {
              ...raw.history,
              ...normalizeHistoryEvidence(raw.history),
            },
          }
        : {}),
      giant:
        legacyKind === "gasGiant"
          ? {
              ...(raw.giant || {}),
              companionClass,
            }
          : raw.giant,
      selector: {
        ...(raw.selector || {}),
        type: selectorType,
        value: `${selectorType}:${id}`,
        badge:
          raw.selector?.badge || (legacyKind === "gasGiant" ? (isSubstellar ? "B" : "G") : "R"),
      },
      classificationSeed: {
        source: raw.classificationSeed?.source || "canonical",
        legacyKind,
        ...(raw.classificationSeed || {}),
      },
      ...(appearance ? { appearance } : {}),
      legacyInputs: clonePlainObject(raw.legacyInputs),
    };
  }

  const legacyKind = String(options.legacyKind || raw?.legacyKind || "").trim();
  if (legacyKind === "gasGiant") return planetFromGasGiantEntry(raw, idx, options);
  return planetFromRockyEntry(raw, idx, options);
}

export function listPlanetaryBodiesByHostFrame(world, hostFrameId) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId);
  const bodies = listPlanetaryBodies(world);
  if (!targetHostFrameId) return bodies;
  return bodies.filter((body) => normalizeHostFrameId(body.hostFrameId) === targetHostFrameId);
}

export function listMoonParentBodies(world) {
  return listClassifiedPlanetaryBodies(world)
    .map((body) => {
      const moonParentKind = moonParentKindForBody(body);
      if (!moonParentKind) return null;
      return {
        ...body,
        moonParentId: body.id,
        moonParentKind,
      };
    })
    .filter(Boolean);
}

export function isValidMoonParentId(world, parentId) {
  const id = String(parentId ?? "").trim();
  if (!id) return false;
  return listMoonParentBodies(world).some((body) => {
    const legacyId = legacyParentIdForBody(body);
    return String(body?.id || "") === id || String(legacyId || "") === id;
  });
}

export function listRockyLikeBodies(world) {
  return listClassifiedPlanetaryBodies(world).filter((body) =>
    ["dwarfRocky", "rocky", "superEarth", "radiusValley"].includes(body.classification?.family),
  );
}

export function listVolatilePlanetBodies(world) {
  return listClassifiedPlanetaryBodies(world).filter((body) =>
    ["miniNeptune", "volatileCandidate"].includes(body.classification?.family),
  );
}

export function listGiantPlanetBodies(world) {
  return listClassifiedPlanetaryBodies(world).filter((body) =>
    ["iceGiant", "gasGiant"].includes(body.classification?.family),
  );
}

export function listSubstellarCompanionBodies(world) {
  return listClassifiedPlanetaryBodies(world).filter(
    (body) => body.classification?.family === "brownDwarf",
  );
}

export function listDebrisDiskPerturbers(world, { hostFrameId = null } = {}) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId);
  return listClassifiedPlanetaryBodies(world)
    .filter((body) => ["iceGiant", "gasGiant", "brownDwarf"].includes(body.classification?.family))
    .filter(
      (body) => !targetHostFrameId || normalizeHostFrameId(body.hostFrameId) === targetHostFrameId,
    )
    .map(toPerturberEntry)
    .sort((left, right) => finiteOrDefault(left.au, 0) - finiteOrDefault(right.au, 0));
}

export function listApparentOrbitSamples(world, { hostFrameId = null } = {}) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId);
  return listClassifiedPlanetaryBodies(world)
    .filter(
      (body) => !targetHostFrameId || normalizeHostFrameId(body.hostFrameId) === targetHostFrameId,
    )
    .map(toApparentOrbitSample)
    .filter((sample) => sample.orbitAu > 0)
    .sort((left, right) => left.orbitAu - right.orbitAu);
}
