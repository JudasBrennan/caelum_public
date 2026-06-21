import { classifyPlanetaryBody } from "../../../engine/planetaryClassification.js";
import {
  normalizeCompositionInventoryInputs,
  normalizePresentCompositionInventoryInputs,
} from "../compositionInventoryInputs.js";
import { normalizeGasGiant } from "../gasGiantModel.js";
import {
  PLANETARY_BODY_STORAGE_VERSION,
  normalizePlanetaryBody,
  normalizePlanetaryBodyAppearance,
} from "../planetaryBodyModel.js";

const EARTH_MASS_PER_MJUP = 317.83;
const JUPITER_RADIUS_KM = 69911;
const EARTH_RADIUS_KM = 6371;
const RJ_PER_RE = JUPITER_RADIUS_KM / EARTH_RADIUS_KM;

function clonePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...value };
}

function normalizeProjectedVisualState(appearance) {
  const normalized = normalizePlanetaryBodyAppearance(appearance);
  if (!normalized?.visualMode && !normalized?.visualOverrides) return null;
  return normalized;
}

function hasOwnField(value, key) {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
}

function orderedItems(section) {
  if (Array.isArray(section)) return section.filter(Boolean);
  if (!section || typeof section !== "object") return [];
  const byId = section.byId && typeof section.byId === "object" ? section.byId : {};
  const order = Array.isArray(section.order) ? section.order : Object.keys(byId);
  return order.map((id) => byId[id]).filter(Boolean);
}

function collectionHasItems(section) {
  return orderedItems(section).length > 0;
}

function makeCollection(entries) {
  const order = [];
  const byId = {};
  for (const entry of entries || []) {
    if (!entry?.id) continue;
    const id = String(entry.id);
    if (!id || id === "__proto__" || id === "constructor" || id === "prototype") continue;
    order.push(id);
    byId[id] = entry;
  }
  return {
    schemaVersion: PLANETARY_BODY_STORAGE_VERSION,
    selectedId: null,
    order,
    byId,
  };
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

function pruneUndefinedFields(value) {
  if (!value || typeof value !== "object") return value;
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) delete value[key];
  }
  return value;
}

function optionalEvidenceFields(source, fields, normalizeValue) {
  const out = {};
  const raw = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  for (const field of fields) {
    if (hasOwnField(raw, field)) out[field] = normalizeValue(raw[field]);
  }
  return out;
}

function hasFields(value) {
  return !!value && typeof value === "object" && Object.keys(value).length > 0;
}

function fieldOrFallback(source, key, fallback) {
  return hasOwnField(source, key) ? source[key] : fallback;
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

function buildCollision(id, legacyKindsById) {
  const duplicateLegacyKinds = legacyKindsById?.get(id) || [];
  if (duplicateLegacyKinds.length <= 1) return null;
  return {
    id,
    duplicateLegacyKinds,
  };
}

function withCollisionMetadata(bodies) {
  const legacyKindsById = new Map();
  for (const body of bodies) {
    if (!body?.id) continue;
    if (!legacyKindsById.has(body.id)) legacyKindsById.set(body.id, []);
    legacyKindsById.get(body.id).push(body.legacyKind);
  }

  return bodies.map((body) => ({
    ...body,
    collision: buildCollision(body.id, legacyKindsById),
  }));
}

function sortByOrbit(bodies) {
  return [...bodies].sort((left, right) => {
    const leftOrbit = finiteOrDefault(left?.orbit?.semiMajorAxisAu, Number.POSITIVE_INFINITY);
    const rightOrbit = finiteOrDefault(right?.orbit?.semiMajorAxisAu, Number.POSITIVE_INFINITY);
    return leftOrbit - rightOrbit;
  });
}

function selectorTypeForLegacyKind(legacyKind) {
  return legacyKind === "gasGiant" ? "gasGiant" : "planet";
}

export function legacyParentIdForBody(body) {
  return String(body?.legacyId || body?.id || "").trim();
}

function deterministicCollisionId(originalId, legacyKind, usedIds) {
  const base = `${originalId}__${legacyKind === "gasGiant" ? "gasGiant" : "rocky"}`;
  let candidate = base;
  let index = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}_${index++}`;
  }
  return candidate;
}

function repairIdCollisions(bodies, { moonParentIds = new Set(), selectedLegacyKind = null } = {}) {
  const groups = new Map();
  for (const body of bodies) {
    const originalId = legacyParentIdForBody(body);
    if (!originalId) continue;
    if (!groups.has(originalId)) groups.set(originalId, []);
    groups.get(originalId).push(body);
  }

  const usedIds = new Set();
  const repaired = [];

  for (const [originalId, group] of groups.entries()) {
    if (group.length === 1) {
      const [body] = group;
      const id = body.id || originalId;
      usedIds.add(id);
      repaired.push({ ...body, id });
      continue;
    }

    let keepIndex = group.findIndex(
      (body) => selectedLegacyKind && body.legacyKind === selectedLegacyKind,
    );
    if (keepIndex < 0 && moonParentIds.has(originalId)) {
      keepIndex = group.findIndex((body) => body.legacyKind === "rocky");
    }
    if (keepIndex < 0) keepIndex = 0;

    group.forEach((body, index) => {
      if (index === keepIndex && !usedIds.has(originalId)) {
        usedIds.add(originalId);
        repaired.push({
          ...body,
          id: originalId,
          legacyId: body.legacyId && body.legacyId !== originalId ? body.legacyId : undefined,
          collisionResolution: {
            reason: "legacy-id-collision-kept-parent-id",
            legacyId: originalId,
          },
        });
        return;
      }

      const storageId = deterministicCollisionId(originalId, body.legacyKind, usedIds);
      usedIds.add(storageId);
      const selectorType = selectorTypeForLegacyKind(body.legacyKind);
      repaired.push({
        ...body,
        id: storageId,
        legacyId: body.legacyId || originalId,
        selector: {
          ...(body.selector || {}),
          type: selectorType,
          value: `${selectorType}:${storageId}`,
        },
        collisionResolution: {
          reason: "legacy-id-collision-repaired",
          legacyId: originalId,
          storageId,
          legacyKind: body.legacyKind,
        },
      });
    });
  }

  return repaired;
}

function collectMoonParentIds(world) {
  const ids = new Set();
  for (const moon of orderedItems(world?.moons)) {
    const id = String(moon?.planetId || moon?.parentBodyId || "").trim();
    if (id) ids.add(id);
  }
  return ids;
}

function selectCanonicalBodyId(bodies, world) {
  const selectedLegacyKind = world?.selectedBodyType === "gasGiant" ? "gasGiant" : "rocky";
  const selectedLegacyId =
    selectedLegacyKind === "gasGiant"
      ? world?.system?.gasGiants?.selectedId
      : world?.planets?.selectedId;
  const match = bodies.find(
    (body) =>
      body.legacyKind === selectedLegacyKind && legacyParentIdForBody(body) === selectedLegacyId,
  );
  return match?.id || bodies[0]?.id || null;
}

function normalizeCanonicalCollection(world, bodies) {
  const selectedLegacyKind = world?.selectedBodyType === "gasGiant" ? "gasGiant" : "rocky";
  const normalized = repairIdCollisions(
    bodies.map((body, index) => normalizePlanetaryBody(body, index + 1)),
    {
      moonParentIds: collectMoonParentIds(world),
      selectedLegacyKind,
    },
  );
  const collection = makeCollection(sortByOrbit(normalized));
  collection.selectedId = selectCanonicalBodyId(normalized, world);
  return collection;
}

function hasCanonicalPlanetaryBodyStorage(world) {
  return (
    world?.planetaryBodies &&
    typeof world.planetaryBodies === "object" &&
    !Array.isArray(world.planetaryBodies) &&
    Number(world.planetaryBodies.schemaVersion) >= PLANETARY_BODY_STORAGE_VERSION
  );
}

function hasAuthoritativeCanonicalBodies(world) {
  if (!hasCanonicalPlanetaryBodyStorage(world)) return false;
  if (collectionHasItems(world.planetaryBodies)) return true;
  return !collectionHasItems(world?.planets) && !collectionHasItems(world?.system?.gasGiants);
}

function getCanonicalBodies(world) {
  return orderedItems(world?.planetaryBodies).map((body, index) =>
    normalizePlanetaryBody(body, index + 1),
  );
}

function bodyLegacyId(body) {
  return legacyParentIdForBody(body);
}

function bodyMatchesLegacyId(body, legacyKind, legacyId) {
  const id = String(legacyId ?? "").trim();
  return (
    !!id &&
    body?.legacyKind === legacyKind &&
    (String(body?.id || "") === id || String(body?.legacyId || "") === id)
  );
}

function selectBodyIdForLegacyId(world, legacyKind, legacyId, fallbackToKind = true) {
  const bodies = orderedItems(world?.planetaryBodies).map((body, index) =>
    normalizePlanetaryBody(body, index + 1),
  );
  const match = bodies.find((body) => bodyMatchesLegacyId(body, legacyKind, legacyId));
  if (match) return match.id;
  if (!fallbackToKind) return null;
  return bodies.find((body) => body.legacyKind === legacyKind)?.id || bodies[0]?.id || null;
}

export function planetFromRockyEntry(planet, idx = 1, options = {}) {
  const raw = planet && typeof planet === "object" ? planet : {};
  const inputs = raw.inputs && typeof raw.inputs === "object" ? raw.inputs : {};
  const id = normalizeId(raw.id, `p${idx}`);
  const name = String(raw.name || inputs.name || id);
  const massEarth = finiteOrDefault(inputs.massEarth, 1);
  const authoringIntent = normalizeAuthoringIntent(
    raw.authoringIntent || inputs.authoringIntent,
    options.authoringIntent || "rocky",
  );

  return {
    id,
    name,
    role: "planetaryBody",
    bodyType: "planetaryBody",
    legacyKind: "rocky",
    authoringIntent,
    hostFrameId: normalizeHostFrameId(raw.hostFrameId),
    slotIndex: normalizeSlotIndex(raw.slotIndex),
    locked: Boolean(raw.locked),
    orbit: {
      semiMajorAxisAu: finiteOrDefault(inputs.semiMajorAxisAu, 0),
      eccentricity: finiteOrNull(inputs.eccentricity),
      inclinationDeg: finiteOrNull(inputs.inclinationDeg),
      longitudeOfPeriapsisDeg: finiteOrNull(inputs.longitudeOfPeriapsisDeg),
    },
    rotation: {
      axialTiltDeg: finiteOrNull(inputs.axialTiltDeg),
      rotationPeriodHours: finiteOrNull(inputs.rotationPeriodHours),
      subsolarLongitudeDeg: finiteOrNull(inputs.subsolarLongitudeDeg),
    },
    composition: {
      massEarth,
      radiusEarth: finiteOrNull(inputs.radiusEarth),
      cmfPct: finiteOrNull(inputs.cmfPct),
      wmfPct: finiteOrDefault(inputs.wmfPct, 0),
      hHeEnvelopeMassPct: finiteOrNull(inputs.hHeEnvelopeMassPct),
      ...normalizeCompositionInventoryInputs(inputs),
      ...normalizeCompositionEvidence(inputs),
      ...normalizeDensityEvidence(inputs),
    },
    atmosphere: {
      pressureAtm: finiteOrNull(inputs.pressureAtm),
      greenhouseMode: inputs.greenhouseMode || "manual",
      greenhouseEffect: finiteOrNull(inputs.greenhouseEffect),
      gasMixPct: {
        o2: finiteOrNull(inputs.o2Pct),
        co2: finiteOrNull(inputs.co2Pct),
        ar: finiteOrNull(inputs.arPct),
        h2o: finiteOrNull(inputs.h2oPct),
        ch4: finiteOrNull(inputs.ch4Pct),
        h2: finiteOrNull(inputs.h2Pct),
        he: finiteOrNull(inputs.hePct),
        so2: finiteOrNull(inputs.so2Pct),
        nh3: finiteOrNull(inputs.nh3Pct),
      },
      escapeFilterEnabled:
        inputs.atmosphericEscape == null ? null : Boolean(inputs.atmosphericEscape),
    },
    thermal: {
      albedoBond: finiteOrNull(inputs.albedoBond),
      ...normalizeThermalEvidence(inputs),
    },
    ...(hasFields(normalizeHistoryEvidence(inputs))
      ? { history: normalizeHistoryEvidence(inputs) }
      : {}),
    observer: {
      observerHeightM: finiteOrNull(inputs.observerHeightM),
    },
    geology: {
      tectonicRegime: inputs.tectonicRegime || null,
      mantleOxidation: inputs.mantleOxidation || null,
    },
    interior: {
      radioisotopeMode: inputs.radioisotopeMode || null,
      radioisotopeAbundance: finiteOrNull(inputs.radioisotopeAbundance),
      u238Abundance: finiteOrNull(inputs.u238Abundance),
      u235Abundance: finiteOrNull(inputs.u235Abundance),
      th232Abundance: finiteOrNull(inputs.th232Abundance),
      k40Abundance: finiteOrNull(inputs.k40Abundance),
    },
    appearance: {
      ...(normalizePlanetaryBodyAppearance(raw.appearance) || {}),
      rockyRecipeId: String(inputs.appearanceRecipeId || raw.appearance?.rockyRecipeId || ""),
      giantRecipeId: String(raw.appearance?.giantRecipeId || ""),
      styleId: String(inputs.appearanceRecipeId || raw.appearance?.styleId || ""),
    },
    rings: {
      mode: inputs.ringMode || "auto",
      styleId: inputs.ringStyleId || "auto",
      legacyEnabled: false,
    },
    selector: {
      type: "planet",
      value: `planet:${id}`,
      badge: massEarth < 0.01 ? "D" : "R",
    },
    classificationSeed: {
      source: "legacy-rocky",
      legacyKind: "rocky",
      massEarth,
      radiusEarth: finiteOrNull(inputs.radiusEarth),
      cmfPct: finiteOrNull(inputs.cmfPct),
      wmfPct: finiteOrDefault(inputs.wmfPct, 0),
      hHeEnvelopeMassPct: finiteOrNull(inputs.hHeEnvelopeMassPct),
      companionClass: null,
    },
    legacy: {
      kind: "rocky",
      collection: "world.planets",
      source: raw,
    },
    legacyInputs: clonePlainObject(inputs),
  };
}

export function planetFromGasGiantEntry(giant, idx = 1, options = {}) {
  const normalized = normalizeGasGiant(giant || {}, idx);
  const id = normalizeId(normalized.id, `gg${idx}`);
  const companionClass = normalized.companionClass || "gasGiant";
  const isSubstellar = companionClass === "brownDwarf";
  const massEarth =
    normalized.massMjup == null ? null : Number(normalized.massMjup) * EARTH_MASS_PER_MJUP;
  const radiusEarth = normalized.radiusRj == null ? null : Number(normalized.radiusRj) * RJ_PER_RE;
  const authoringIntent = normalizeAuthoringIntent(
    giant?.authoringIntent,
    options.authoringIntent || (isSubstellar ? "substellar" : "gasGiant"),
  );

  return {
    id,
    name: normalized.name || id,
    role: isSubstellar ? "substellarCompanion" : "planetaryBody",
    bodyType: "planetaryBody",
    legacyKind: "gasGiant",
    authoringIntent,
    hostFrameId: normalizeHostFrameId(normalized.hostFrameId),
    slotIndex: normalizeSlotIndex(normalized.slotIndex),
    locked: Boolean(giant?.locked),
    orbit: {
      semiMajorAxisAu: finiteOrDefault(normalized.au, 0),
      eccentricity: finiteOrNull(normalized.eccentricity),
      inclinationDeg: finiteOrNull(normalized.inclinationDeg),
      longitudeOfPeriapsisDeg: finiteOrNull(normalized.longitudeOfPeriapsisDeg),
    },
    rotation: {
      axialTiltDeg: finiteOrNull(normalized.axialTiltDeg),
      rotationPeriodHours: finiteOrNull(normalized.rotationPeriodHours),
      subsolarLongitudeDeg: null,
    },
    composition: {
      massEarth,
      radiusEarth,
      cmfPct: null,
      wmfPct: null,
      hHeEnvelopeMassPct: null,
      ...normalizeCompositionEvidence(giant),
      ...normalizeDensityEvidence(giant),
    },
    giant: {
      massMjup: finiteOrNull(normalized.massMjup),
      radiusRj: finiteOrNull(normalized.radiusRj),
      metallicitySolar: finiteOrNull(normalized.metallicity),
      companionClass,
    },
    appearance: {
      ...(normalizePlanetaryBodyAppearance(giant?.appearance) || {}),
      rockyRecipeId: String(giant?.appearance?.rockyRecipeId || ""),
      giantRecipeId: normalized.appearanceRecipeId || giant?.appearance?.giantRecipeId || "",
      styleId: normalized.style || giant?.appearance?.styleId || "",
    },
    rings: {
      mode: normalized.ringMode || "auto",
      styleId: normalized.ringStyleId || "auto",
      legacyEnabled: Boolean(normalized.rings),
    },
    ...(hasFields(normalizeThermalEvidence(giant))
      ? { thermal: normalizeThermalEvidence(giant) }
      : {}),
    ...(hasFields(normalizeHistoryEvidence(giant))
      ? { history: normalizeHistoryEvidence(giant) }
      : {}),
    selector: {
      type: "gasGiant",
      value: `gasGiant:${id}`,
      badge: isSubstellar ? "B" : "G",
    },
    classificationSeed: {
      source: "legacy-gas-giant",
      legacyKind: "gasGiant",
      massEarth,
      radiusEarth,
      massMjup: finiteOrNull(normalized.massMjup),
      radiusRj: finiteOrNull(normalized.radiusRj),
      companionClass,
      style: normalized.style || "",
    },
    legacy: {
      kind: "gasGiant",
      collection: "world.system.gasGiants",
      source: giant,
    },
    legacyInputs: clonePlainObject(giant),
  };
}

export function ensureCanonicalPlanetaryBodyStorage(world) {
  if (!world || typeof world !== "object") return world;
  if (hasAuthoritativeCanonicalBodies(world)) {
    const previousSelectedId = world.planetaryBodies?.selectedId || null;
    const canonical = normalizeCanonicalCollection(world, getCanonicalBodies(world));
    if (previousSelectedId && canonical.byId[previousSelectedId]) {
      canonical.selectedId = previousSelectedId;
    }
    world.planetaryBodies = canonical;
    syncMoonParentAliases(world);
    return world;
  }
  return syncUnifiedPlanetaryBodies(world);
}

export function listRockyPlanetEntries(world) {
  return splitPlanetaryBodiesByLegacyKind(listPlanetaryBodies(world)).rocky.map((body, index) =>
    rockyEntryFromPlanetaryBody(body, index + 1),
  );
}

export function listGasGiantEntries(world) {
  return splitPlanetaryBodiesByLegacyKind(listPlanetaryBodies(world)).gasGiants.map((body, index) =>
    gasGiantEntryFromPlanetaryBody(body, index + 1),
  );
}

export function getSelectedPlanetaryBodyLegacyId(world, legacyKind) {
  const kind = legacyKind === "gasGiant" ? "gasGiant" : "rocky";
  const bodies = listPlanetaryBodies(world);
  const selected = bodies.find((body) => body.id === world?.planetaryBodies?.selectedId);
  if (selected?.legacyKind === kind) return bodyLegacyId(selected);
  const projectedSelectedId =
    kind === "gasGiant" ? world?.system?.gasGiants?.selectedId : world?.planets?.selectedId;
  if (projectedSelectedId) return String(projectedSelectedId);
  return bodyLegacyId(bodies.find((body) => body.legacyKind === kind)) || null;
}

export function replacePlanetaryBodiesByLegacyKind(
  world,
  legacyKind,
  entries,
  { selectedLegacyId, fallbackToKind = true } = {},
) {
  if (!world || typeof world !== "object") return world;
  const kind = legacyKind === "gasGiant" ? "gasGiant" : "rocky";
  ensureCanonicalPlanetaryBodyStorage(world);

  const previousSelectedId = world.planetaryBodies?.selectedId || null;
  const preservedBodies = listPlanetaryBodies(world).filter((body) => body.legacyKind !== kind);
  const replacementBodies = (entries || []).map((entry, index) =>
    kind === "gasGiant"
      ? planetFromGasGiantEntry(entry, index + 1)
      : planetFromRockyEntry(entry, index + 1),
  );

  const canonical = normalizeCanonicalCollection(world, [...preservedBodies, ...replacementBodies]);
  world.planetaryBodies = canonical;

  if (selectedLegacyId !== undefined) {
    world.planetaryBodies.selectedId = selectBodyIdForLegacyId(
      world,
      kind,
      selectedLegacyId,
      fallbackToKind,
    );
  } else if (previousSelectedId && world.planetaryBodies.byId[previousSelectedId]) {
    world.planetaryBodies.selectedId = previousSelectedId;
  }

  syncLegacyPlanetCollections(world);
  return world;
}

export function selectPlanetaryBodyByLegacyId(world, legacyKind, legacyId) {
  if (!world || typeof world !== "object") return null;
  const kind = legacyKind === "gasGiant" ? "gasGiant" : "rocky";
  ensureCanonicalPlanetaryBodyStorage(world);
  const selectedId = selectBodyIdForLegacyId(world, kind, legacyId, false);
  if (!selectedId) return null;
  world.planetaryBodies.selectedId = selectedId;
  syncLegacyPlanetCollections(world);
  return world.planetaryBodies.byId[selectedId] || null;
}

export function rockyEntryFromPlanetaryBody(body, idx = 1) {
  const normalized = normalizePlanetaryBody(body, idx, { legacyKind: "rocky" });
  const legacyInputs = clonePlainObject(normalized.legacyInputs);
  const gasMixPct = normalized.atmosphere?.gasMixPct || {};
  const inputs = pruneUndefinedFields({
    ...legacyInputs,
    name: normalized.name || legacyInputs.name || normalized.id,
    semiMajorAxisAu: finiteOrDefault(
      normalized.orbit?.semiMajorAxisAu,
      legacyInputs.semiMajorAxisAu ?? 0,
    ),
    eccentricity: normalized.orbit?.eccentricity ?? legacyInputs.eccentricity,
    inclinationDeg: normalized.orbit?.inclinationDeg ?? legacyInputs.inclinationDeg,
    longitudeOfPeriapsisDeg:
      normalized.orbit?.longitudeOfPeriapsisDeg ?? legacyInputs.longitudeOfPeriapsisDeg,
    axialTiltDeg: normalized.rotation?.axialTiltDeg ?? legacyInputs.axialTiltDeg,
    rotationPeriodHours:
      normalized.rotation?.rotationPeriodHours ?? legacyInputs.rotationPeriodHours,
    subsolarLongitudeDeg:
      normalized.rotation?.subsolarLongitudeDeg ?? legacyInputs.subsolarLongitudeDeg,
    massEarth: finiteOrDefault(normalized.composition?.massEarth, legacyInputs.massEarth ?? 1),
    radiusEarth: normalized.composition?.radiusEarth ?? legacyInputs.radiusEarth,
    cmfPct: normalized.composition?.cmfPct ?? legacyInputs.cmfPct,
    wmfPct: normalized.composition?.wmfPct ?? legacyInputs.wmfPct,
    hHeEnvelopeMassPct:
      normalized.composition?.hHeEnvelopeMassPct ?? legacyInputs.hHeEnvelopeMassPct,
    carbonRichness: fieldOrFallback(
      normalized.composition,
      "carbonRichness",
      legacyInputs.carbonRichness,
    ),
    bulkDensityGcm3: fieldOrFallback(
      normalized.composition,
      "bulkDensityGcm3",
      legacyInputs.bulkDensityGcm3,
    ),
    ...normalizeCompositionInventoryInputs({
      ...legacyInputs,
      ...normalizePresentCompositionInventoryInputs(normalized.composition),
    }),
    albedoBond: normalized.thermal?.albedoBond ?? legacyInputs.albedoBond,
    internalHeatFluxWm2: fieldOrFallback(
      normalized.thermal,
      "internalHeatFluxWm2",
      legacyInputs.internalHeatFluxWm2,
    ),
    tidalHeatFluxWm2: fieldOrFallback(
      normalized.thermal,
      "tidalHeatFluxWm2",
      legacyInputs.tidalHeatFluxWm2,
    ),
    greenhouseMode: normalized.atmosphere?.greenhouseMode ?? legacyInputs.greenhouseMode,
    greenhouseEffect: normalized.atmosphere?.greenhouseEffect ?? legacyInputs.greenhouseEffect,
    pressureAtm: normalized.atmosphere?.pressureAtm ?? legacyInputs.pressureAtm,
    o2Pct: gasMixPct.o2 ?? legacyInputs.o2Pct,
    co2Pct: gasMixPct.co2 ?? legacyInputs.co2Pct,
    arPct: gasMixPct.ar ?? legacyInputs.arPct,
    h2oPct: gasMixPct.h2o ?? legacyInputs.h2oPct,
    ch4Pct: gasMixPct.ch4 ?? legacyInputs.ch4Pct,
    h2Pct: gasMixPct.h2 ?? legacyInputs.h2Pct,
    hePct: gasMixPct.he ?? legacyInputs.hePct,
    so2Pct: gasMixPct.so2 ?? legacyInputs.so2Pct,
    nh3Pct: gasMixPct.nh3 ?? legacyInputs.nh3Pct,
    atmosphericEscape: normalized.atmosphere?.escapeFilterEnabled ?? legacyInputs.atmosphericEscape,
    observerHeightM: normalized.observer?.observerHeightM ?? legacyInputs.observerHeightM,
    tectonicRegime: normalized.geology?.tectonicRegime ?? legacyInputs.tectonicRegime,
    mantleOxidation: normalized.geology?.mantleOxidation ?? legacyInputs.mantleOxidation,
    radioisotopeMode: normalized.interior?.radioisotopeMode ?? legacyInputs.radioisotopeMode,
    radioisotopeAbundance:
      normalized.interior?.radioisotopeAbundance ?? legacyInputs.radioisotopeAbundance,
    u238Abundance: normalized.interior?.u238Abundance ?? legacyInputs.u238Abundance,
    u235Abundance: normalized.interior?.u235Abundance ?? legacyInputs.u235Abundance,
    th232Abundance: normalized.interior?.th232Abundance ?? legacyInputs.th232Abundance,
    k40Abundance: normalized.interior?.k40Abundance ?? legacyInputs.k40Abundance,
    appearanceRecipeId:
      normalized.appearance?.rockyRecipeId ||
      normalized.appearance?.styleId ||
      legacyInputs.appearanceRecipeId,
    strippedEnvelopeCandidate: fieldOrFallback(
      normalized.history,
      "strippedEnvelopeCandidate",
      legacyInputs.strippedEnvelopeCandidate,
    ),
    migratedCloseIn: fieldOrFallback(
      normalized.history,
      "migratedCloseIn",
      legacyInputs.migratedCloseIn,
    ),
    rogueCandidate: fieldOrFallback(
      normalized.history,
      "rogueCandidate",
      legacyInputs.rogueCandidate,
    ),
    ringMode: normalized.rings?.mode ?? legacyInputs.ringMode,
    ringStyleId: normalized.rings?.styleId ?? legacyInputs.ringStyleId,
  });

  const entry = {
    id: normalized.legacyId || normalized.id || `p${idx}`,
    name: normalized.name || inputs.name || `Planet ${idx}`,
    hostFrameId: normalizeHostFrameId(normalized.hostFrameId),
    slotIndex: normalizeSlotIndex(normalized.slotIndex),
    inputs,
  };
  const appearance = normalizeProjectedVisualState(normalized.appearance);
  if (appearance) entry.appearance = appearance;
  const source = normalized.legacy?.source || {};
  if (Object.prototype.hasOwnProperty.call(source, "locked") || normalized.locked) {
    entry.locked = Boolean(normalized.locked);
  }
  if (
    Object.prototype.hasOwnProperty.call(source, "authoringIntent") ||
    (normalized.authoringIntent && normalized.authoringIntent !== "rocky")
  ) {
    entry.authoringIntent = normalized.authoringIntent || "rocky";
  }
  return entry;
}

export function gasGiantEntryFromPlanetaryBody(body, idx = 1) {
  const normalized = normalizePlanetaryBody(body, idx, { legacyKind: "gasGiant" });
  const legacyInputs = clonePlainObject(normalized.legacyInputs);
  const entry = pruneUndefinedFields({
    ...legacyInputs,
    id: normalized.legacyId || normalized.id || `gg${idx}`,
    name: normalized.name || legacyInputs.name || `Gas giant ${idx}`,
    hostFrameId: normalizeHostFrameId(normalized.hostFrameId),
    au: finiteOrDefault(normalized.orbit?.semiMajorAxisAu, legacyInputs.au ?? 0),
    slotIndex: normalizeSlotIndex(normalized.slotIndex),
    companionClass: normalized.giant?.companionClass || legacyInputs.companionClass || "gasGiant",
    style: normalized.appearance?.styleId || legacyInputs.style || "jupiter",
    appearanceRecipeId:
      normalized.appearance?.giantRecipeId || legacyInputs.appearanceRecipeId || "",
    ringMode: normalized.rings?.mode ?? legacyInputs.ringMode,
    ringStyleId: normalized.rings?.styleId ?? legacyInputs.ringStyleId,
    rings: normalized.rings?.legacyEnabled ?? legacyInputs.rings,
    radiusRj: normalized.giant?.radiusRj ?? legacyInputs.radiusRj,
    massMjup: normalized.giant?.massMjup ?? legacyInputs.massMjup,
    carbonRichness: fieldOrFallback(
      normalized.composition,
      "carbonRichness",
      legacyInputs.carbonRichness,
    ),
    bulkDensityGcm3: fieldOrFallback(
      normalized.composition,
      "bulkDensityGcm3",
      legacyInputs.bulkDensityGcm3,
    ),
    internalHeatFluxWm2: fieldOrFallback(
      normalized.thermal,
      "internalHeatFluxWm2",
      legacyInputs.internalHeatFluxWm2,
    ),
    tidalHeatFluxWm2: fieldOrFallback(
      normalized.thermal,
      "tidalHeatFluxWm2",
      legacyInputs.tidalHeatFluxWm2,
    ),
    strippedEnvelopeCandidate: fieldOrFallback(
      normalized.history,
      "strippedEnvelopeCandidate",
      legacyInputs.strippedEnvelopeCandidate,
    ),
    migratedCloseIn: fieldOrFallback(
      normalized.history,
      "migratedCloseIn",
      legacyInputs.migratedCloseIn,
    ),
    rogueCandidate: fieldOrFallback(
      normalized.history,
      "rogueCandidate",
      legacyInputs.rogueCandidate,
    ),
    rotationPeriodHours:
      normalized.rotation?.rotationPeriodHours ?? legacyInputs.rotationPeriodHours,
    metallicity: normalized.giant?.metallicitySolar ?? legacyInputs.metallicity,
    eccentricity: normalized.orbit?.eccentricity ?? legacyInputs.eccentricity,
    inclinationDeg: normalized.orbit?.inclinationDeg ?? legacyInputs.inclinationDeg,
    longitudeOfPeriapsisDeg:
      normalized.orbit?.longitudeOfPeriapsisDeg ?? legacyInputs.longitudeOfPeriapsisDeg,
    axialTiltDeg: normalized.rotation?.axialTiltDeg ?? legacyInputs.axialTiltDeg,
  });
  const appearance = normalizeProjectedVisualState(normalized.appearance);
  if (appearance) entry.appearance = appearance;
  const source = normalized.legacy?.source || {};
  if (Object.prototype.hasOwnProperty.call(source, "locked") || normalized.locked) {
    entry.locked = Boolean(normalized.locked);
  }
  if (
    Object.prototype.hasOwnProperty.call(source, "authoringIntent") ||
    (normalized.authoringIntent && !["gasGiant", "substellar"].includes(normalized.authoringIntent))
  ) {
    entry.authoringIntent = normalized.authoringIntent;
  }
  return entry;
}

export function syncUnifiedPlanetaryBodies(world) {
  if (!world || typeof world !== "object") return world;
  const bodies = [
    ...orderedItems(world.planets).map((planet, index) => planetFromRockyEntry(planet, index + 1)),
    ...orderedItems(world.system?.gasGiants).map((giant, index) =>
      planetFromGasGiantEntry(giant, index + 1),
    ),
  ];
  world.planetaryBodies = normalizeCanonicalCollection(world, bodies);
  syncMoonParentAliases(world);
  return world;
}

export function syncLegacyPlanetCollections(world) {
  if (!world || typeof world !== "object") return world;
  const canonicalBodies = sortByOrbit(getCanonicalBodies(world));
  const canonical = makeCollection(canonicalBodies);
  canonical.selectedId =
    world.planetaryBodies?.selectedId && canonical.byId[world.planetaryBodies.selectedId]
      ? world.planetaryBodies.selectedId
      : selectCanonicalBodyId(canonicalBodies, world);
  world.planetaryBodies = canonical;

  const rockyEntries = [];
  const gasGiantEntries = [];
  for (const body of orderedItems(canonical)) {
    if (body.legacyKind === "gasGiant") {
      gasGiantEntries.push(gasGiantEntryFromPlanetaryBody(body, gasGiantEntries.length + 1));
    } else {
      rockyEntries.push(rockyEntryFromPlanetaryBody(body, rockyEntries.length + 1));
    }
  }

  const previousPlanetSelectedId = world.planets?.selectedId ?? null;
  const previousGasSelectedId = world.system?.gasGiants?.selectedId ?? null;
  world.planets = makeCollection(rockyEntries);
  delete world.planets.schemaVersion;
  const selectedBody = canonical.selectedId ? canonical.byId[canonical.selectedId] : null;
  const selectedLegacyId = selectedBody ? legacyParentIdForBody(selectedBody) : null;
  world.planets.selectedId =
    selectedBody?.legacyKind === "rocky" && world.planets.byId[selectedLegacyId]
      ? selectedLegacyId
      : previousPlanetSelectedId && world.planets.byId[previousPlanetSelectedId]
        ? previousPlanetSelectedId
        : world.planets.order[0] || null;

  if (!world.system || typeof world.system !== "object") world.system = {};
  world.system.gasGiants = makeCollection(gasGiantEntries);
  delete world.system.gasGiants.schemaVersion;
  world.system.gasGiants.selectedId =
    selectedBody?.legacyKind === "gasGiant" && world.system.gasGiants.byId[selectedLegacyId]
      ? selectedLegacyId
      : previousGasSelectedId && world.system.gasGiants.byId[previousGasSelectedId]
        ? previousGasSelectedId
        : world.system.gasGiants.order[0] || null;

  syncMoonParentAliases(world);
  return world;
}

export function syncMoonParentAliases(world) {
  if (!world?.moons?.byId) return world;
  const bodies = hasCanonicalPlanetaryBodyStorage(world)
    ? getCanonicalBodies(world)
    : [
        ...orderedItems(world.planets).map((planet, index) =>
          planetFromRockyEntry(planet, index + 1),
        ),
        ...orderedItems(world.system?.gasGiants).map((giant, index) =>
          planetFromGasGiantEntry(giant, index + 1),
        ),
      ];
  const byCanonicalId = new Map();
  const byLegacyKey = new Map();
  const byLegacyId = new Map();
  for (const body of bodies) {
    byCanonicalId.set(body.id, body);
    const legacyId = legacyParentIdForBody(body);
    if (legacyId) {
      if (!byLegacyId.has(legacyId)) byLegacyId.set(legacyId, body);
      byLegacyKey.set(`${body.legacyKind}:${legacyId}`, body);
    }
  }

  for (const moon of Object.values(world.moons.byId)) {
    if (!moon) continue;
    if (moon.planetId === "") moon.planetId = null;
    const desiredKind =
      moon.parentKind === "gasGiant" ? "gasGiant" : moon.parentKind === "planet" ? "rocky" : null;
    const parent =
      (moon.parentBodyId && byCanonicalId.get(moon.parentBodyId)) ||
      (desiredKind && moon.planetId && byLegacyKey.get(`${desiredKind}:${moon.planetId}`)) ||
      (moon.planetId && byCanonicalId.get(moon.planetId)) ||
      (moon.planetId && byLegacyId.get(moon.planetId)) ||
      null;

    if (!parent) {
      moon.parentBodyId = null;
      moon.parentKind = null;
      continue;
    }

    moon.parentBodyId = parent.id;
    moon.parentKind = parent.legacyKind === "gasGiant" ? "gasGiant" : "planet";
    moon.planetId = legacyParentIdForBody(parent);
  }
  return world;
}

export function listPlanetaryBodies(world) {
  if (hasAuthoritativeCanonicalBodies(world)) {
    return withCollisionMetadata(sortByOrbit(getCanonicalBodies(world)));
  }

  const rockyBodies = orderedItems(world?.planets).map((planet, index) =>
    planetFromRockyEntry(planet, index + 1),
  );
  const giantBodies = orderedItems(world?.system?.gasGiants).map((giant, index) =>
    planetFromGasGiantEntry(giant, index + 1),
  );

  return withCollisionMetadata(sortByOrbit([...rockyBodies, ...giantBodies]));
}

export function findPlanetaryBody(world, idOrSelectorValue) {
  const value = String(idOrSelectorValue ?? "").trim();
  if (!value) return null;
  const bodies = listPlanetaryBodies(world);
  const typedMatch = value.match(/^(planet|gasGiant):(.+)$/);
  if (typedMatch) {
    const [, selectorType, id] = typedMatch;
    return (
      bodies.find(
        (body) => (body.id === id || body.legacyId === id) && body.selector?.type === selectorType,
      ) || null
    );
  }
  return bodies.find((body) => body.id === value || body.legacyId === value) || null;
}

export function splitPlanetaryBodiesByLegacyKind(bodies) {
  const rocky = [];
  const gasGiants = [];
  for (const body of bodies || []) {
    if (body?.legacyKind === "gasGiant") {
      gasGiants.push(body);
    } else if (body?.legacyKind === "rocky") {
      rocky.push(body);
    }
  }
  return { rocky, gasGiants };
}

export function listClassifiedPlanetaryBodies(world) {
  return listPlanetaryBodies(world).map((body) => ({
    ...body,
    classification: classifyPlanetaryBody(body),
  }));
}
