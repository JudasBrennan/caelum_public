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
  return optionalEvidenceFields(source, ["carbonRichness"], normalizeOptionalScalar);
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
    const id = normalizeId(raw.id, `body${idx}`);
    const legacyKind = raw.legacyKind === "gasGiant" ? "gasGiant" : "rocky";
    const companionClass =
      raw.giant?.companionClass || raw.classificationSeed?.companionClass || "gasGiant";
    const isSubstellar = legacyKind === "gasGiant" && companionClass === "brownDwarf";
    const selectorType = legacyKind === "gasGiant" ? "gasGiant" : "planet";
    return {
      ...raw,
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
