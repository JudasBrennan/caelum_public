import { LOCAL_CLUSTER_DEFAULTS, normalizeLocalClusterInputs } from "../engine/localCluster.js";
import { buildHomeSystemContext, resolveHostFrameContext } from "../engine/homeSystem/context.js";
import { deepMerge } from "./store/deepMerge.js";
import {
  assignMoonToPlanetInWorld,
  assignPlanetToSlotInWorld,
  applyMoonSiblingPatchInWorld,
  createMoonInWorld,
  createPlanetInWorld,
  deleteMoonInWorld,
  deletePlanetInWorld,
  selectMoonInWorld,
  selectPlanetInWorld,
  toggleMoonLockInWorld,
  togglePlanetLockInWorld,
  updateMoonInWorld,
  updatePlanetInWorld,
} from "./store/bodyMutations.js";
import { stripLegacyKeys, validateEnvelope } from "./store/importValidation.js";
import { normalizeGasGiant as normalizeGasGiantModel } from "./store/gasGiantModel.js";
import {
  clearAllSavedData as clearAllSavedDataFromPersistence,
  clearCurrentSavedWorld,
  clearStorageError,
  getStorageError,
  readWorldRaw,
  resetStorePersistenceForTests,
  saveWorldRaw,
} from "./store/persistenceBridge.js";
import {
  getDebrisDisks as getDebrisDisksModel,
  getGasGiants,
  makeCollection,
  normalizeDebrisDisk as normalizeDebrisDiskModel,
  normalizeClusterSystemNames,
} from "./store/systemCollections.js";
import { migrateWorld, normalizeWorld } from "./store/worldMigration.js";
import { SCHEMA_VERSION, defaultWorld, mergeWorldForMigration } from "./store/worldSchema.js";
import {
  getDefaultHostFrameId,
  getPrimaryStarId,
  listStellarSystemHostFrames,
  listStellarSystemPairs,
  listStellarSystemStars,
  normalizeStellarSystem,
  projectPrimaryStarFromStellarSystem,
} from "./store/stellarSystemModel.js";

export { validateEnvelope };
export {
  BROWN_DWARF_MASS_MAX_MJUP,
  BROWN_DWARF_MASS_MIN_MJUP,
  GAS_GIANT_MASS_MAX_MJUP,
  GAS_GIANT_MASS_MIN_MJUP,
  GAS_GIANT_MASS_STEP_MJUP,
  GAS_GIANT_METALLICITY_MAX,
  GAS_GIANT_METALLICITY_MIN,
  GAS_GIANT_METALLICITY_STEP,
  GAS_GIANT_RADIUS_MAX_RJ,
  GAS_GIANT_RADIUS_MIN_RJ,
  GAS_GIANT_RADIUS_STEP_RJ,
  GIANT_COMPANION_CLASS_BROWN_DWARF,
  GIANT_COMPANION_CLASS_GAS_GIANT,
  getGiantCompanionMassBounds,
  randomGasGiantRadiusRj,
} from "./store/gasGiantModel.js";
export {
  createBackup,
  flushStorage,
  hasAnySavedData,
  hasSavedWorldInLocalStorage,
  listBackups,
  restoreBackup,
  waitForStorageReady,
} from "./store/persistenceBridge.js";
export { normalizeWorld } from "./store/worldMigration.js";

// Shared World Model store (local-only).
// This keeps Star/System/Planet pages consistent.

export const TOOL_ID = "WorldSmith Web";

let worldLoadFailure = null;
let worldLoadFailureSignature = "";

function buildWorldLoadFailureSignature(failure) {
  if (!failure) return "";
  return [
    failure.stage || "",
    failure.sourceKey || "",
    failure.message || "",
    failure.cause || "",
    typeof failure.raw === "string" ? failure.raw.length : 0,
    typeof failure.raw === "string" ? failure.raw.slice(0, 96) : "",
  ].join("|");
}

function dispatchWorldLoadEvent(type, detail) {
  try {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  } catch {
    // Ignore dispatch failures.
  }
}

function setWorldLoadFailure(failure) {
  if (!failure) return;
  const signature = buildWorldLoadFailureSignature(failure);
  if (signature && signature === worldLoadFailureSignature) return;
  worldLoadFailure = failure;
  worldLoadFailureSignature = signature;
  dispatchWorldLoadEvent("worldsmith:worldLoadFailure", {
    stage: failure.stage,
    sourceKey: failure.sourceKey,
    message: failure.message,
    cause: failure.cause,
    detectedAt: failure.detectedAt,
  });
}

function clearWorldLoadFailure() {
  if (!worldLoadFailure) return false;
  worldLoadFailure = null;
  worldLoadFailureSignature = "";
  dispatchWorldLoadEvent("worldsmith:worldLoadRecovered", {});
  return true;
}

function toWorldLoadFailure({ stage, sourceKey, raw, error }) {
  const cause = error?.message || String(error || "");
  const message =
    stage === "parse"
      ? "WorldSmith could not parse the saved world data."
      : "WorldSmith could not migrate the saved world data to the current format.";
  return {
    stage,
    sourceKey: sourceKey || null,
    raw: typeof raw === "string" ? raw : null,
    message,
    cause,
    detectedAt: new Date().toISOString(),
  };
}

export function getSchemaVersion() {
  return SCHEMA_VERSION;
}

export function loadWorld() {
  const stored = readWorldRaw();
  const raw = stored?.raw;
  if (!raw) {
    clearWorldLoadFailure();
    return defaultWorld();
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    setWorldLoadFailure(
      toWorldLoadFailure({
        stage: "parse",
        sourceKey: stored?.sourceKey,
        raw,
        error,
      }),
    );
    return defaultWorld();
  }

  try {
    const world = migrateWorld(mergeWorldForMigration(parsed));
    clearWorldLoadFailure();
    return world;
  } catch (error) {
    setWorldLoadFailure(
      toWorldLoadFailure({
        stage: "migrate",
        sourceKey: stored?.sourceKey,
        raw,
        error,
      }),
    );
    return defaultWorld();
  }
}

export function getWorldLoadFailure() {
  return worldLoadFailure ? { ...worldLoadFailure } : null;
}

export function hasWorldLoadFailure() {
  return !!worldLoadFailure;
}

export function getLastStorageError() {
  return getStorageError();
}

export function clearLastStorageError() {
  return clearStorageError();
}

export function clearAllSavedData() {
  clearWorldLoadFailure();
  clearStorageError();
  return clearAllSavedDataFromPersistence();
}

export async function clearUnreadableSavedWorld() {
  const result = await clearCurrentSavedWorld();
  if (result?.ok) clearWorldLoadFailure();
  return result;
}

/** Resolve effective R/L/T overrides and evolution mode from the star state. */
export function getStarOverrides(star) {
  const ev = star?.evolutionMode || "zams";
  if (star?.physicsMode === "advanced") {
    const mode = star.advancedDerivationMode;
    const radius = star.radiusRsolOverride;
    const luminosity = star.luminosityLsolOverride;
    const temp = star.tempKOverride;
    if (mode === "rt") return { r: radius, l: null, t: temp, ev };
    if (mode === "lt") return { r: null, l: luminosity, t: temp, ev };
    return { r: radius, l: luminosity, t: null, ev };
  }
  return { r: null, l: null, t: null, ev };
}

function buildNormalizedHomeSystemWorld(world = loadWorld()) {
  const baseWorld =
    world && typeof world === "object" && !Array.isArray(world) ? world : loadWorld();
  const stellarSystem = normalizeStellarSystem(baseWorld?.stellarSystem, {
    fallbackStar: baseWorld?.star,
  });
  const projectedPrimaryStar = projectPrimaryStarFromStellarSystem(stellarSystem, baseWorld?.star);
  return {
    ...baseWorld,
    stellarSystem,
    star: projectedPrimaryStar,
  };
}

export function getProjectedPrimaryStar(world = loadWorld()) {
  return buildNormalizedHomeSystemWorld(world).star;
}

export function buildWorldHomeSystemContext(world = loadWorld()) {
  return buildHomeSystemContext(buildNormalizedHomeSystemWorld(world));
}

export function resolveWorldHostFrameContext(
  world = loadWorld(),
  hostFrameId = null,
  homeSystemContext = null,
) {
  const resolvedWorld = buildNormalizedHomeSystemWorld(world);
  const context = homeSystemContext || buildHomeSystemContext(resolvedWorld);
  const fallbackHostFrameId = context?.defaultHostFrameId || context?.primaryStarId || null;
  return (
    resolveHostFrameContext(context, normalizeHostFrameId(hostFrameId, fallbackHostFrameId)) ||
    resolveHostFrameContext(context, fallbackHostFrameId)
  );
}

export function listPlanets(world = loadWorld()) {
  return world.planets.order.map((id) => world.planets.byId[id]).filter(Boolean);
}

export function getSelectedPlanet(world = loadWorld()) {
  return world.planets.byId[world.planets.selectedId];
}

export function selectPlanet(planetId) {
  const world = loadWorld();
  selectPlanetInWorld(world, planetId);
  saveWorld(world);
  return world;
}

export function createPlanetFromInputs(inputs, { name = "New Planet" } = {}) {
  const world = loadWorld();
  createPlanetInWorld(world, inputs, { name });
  saveWorld(world);
  return world;
}

export function deletePlanet(planetId) {
  const world = loadWorld();
  deletePlanetInWorld(world, planetId);
  saveWorld(world);
  return world;
}

export function updatePlanet(planetId, patch) {
  const world = loadWorld();
  updatePlanetInWorld(world, planetId, patch);
  saveWorld(world);
  return world;
}

export function listMoons(world = loadWorld()) {
  return world.moons.order.map((id) => world.moons.byId[id]).filter(Boolean);
}

export function getSelectedMoon(world = loadWorld()) {
  return world.moons.byId[world.moons.selectedId];
}

export function selectMoon(moonId) {
  const world = loadWorld();
  selectMoonInWorld(world, moonId);
  saveWorld(world);
  return world;
}

export function createMoonFromInputs(inputs, { name = "New Moon", planetId } = {}) {
  const world = loadWorld();
  createMoonInWorld(world, inputs, { name, planetId });
  saveWorld(world);
  return world;
}

export function deleteMoon(moonId) {
  const world = loadWorld();
  deleteMoonInWorld(world, moonId);
  saveWorld(world);
  return world;
}

export function updateMoon(moonId, patch) {
  const world = loadWorld();
  updateMoonInWorld(world, moonId, patch);
  saveWorld(world);
  return world;
}

export function toggleMoonLock(moonId) {
  const world = loadWorld();
  toggleMoonLockInWorld(world, moonId);
  saveWorld(world);
  return world;
}

export function assignMoonToPlanet(moonId, planetIdOrNull, { force = false } = {}) {
  const world = loadWorld();
  assignMoonToPlanetInWorld(world, moonId, planetIdOrNull, { force });
  saveWorld(world);
  return world;
}

export function applyMoonSiblingPatch(siblingPatch, options = {}) {
  const world = loadWorld();
  const result = applyMoonSiblingPatchInWorld(world, siblingPatch, options);
  saveWorld(world);
  return result;
}

export function togglePlanetLock(planetId) {
  const world = loadWorld();
  togglePlanetLockInWorld(world, planetId);
  saveWorld(world);
  return world;
}

export function assignPlanetToSlot(planetId, slotIndexOrNull) {
  const world = loadWorld();
  assignPlanetToSlotInWorld(world, planetId, slotIndexOrNull);
  saveWorld(world);
  return world;
}

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function resolveOrbitSlotsForHostFrame(homeSystemContext, hostFrameId, fallbackSlots) {
  const fallbackHostFrameId =
    homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || null;
  const resolvedHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  const orbitSlots = homeSystemContext?.hostFramesById?.[resolvedHostFrameId]?.system?.orbitsAu;
  if (Array.isArray(orbitSlots) && orbitSlots.length) return orbitSlots;
  return Array.isArray(fallbackSlots) ? fallbackSlots : [];
}

/**
 * Switch between guided (slot-based) and manual orbit placement modes.
 * When switching to manual, slot-bound planets and gas giants inherit the slot AU.
 */
export function setOrbitMode(mode, orbitsAu) {
  const world = loadWorld();
  const prev = world.system.orbitMode || "guided";
  const next = mode === "manual" ? "manual" : "guided";
  if (prev === next) return world;

  if (next === "manual") {
    const homeSystemContext = buildHomeSystemContext(world);
    for (const planetId of world.planets.order) {
      const planet = world.planets.byId[planetId];
      if (!planet || planet.slotIndex == null) continue;
      const orbitSlots = resolveOrbitSlotsForHostFrame(
        homeSystemContext,
        planet.hostFrameId,
        orbitsAu,
      );
      const slotAu = orbitSlots[planet.slotIndex - 1];
      if (Number.isFinite(slotAu) && slotAu > 0) {
        planet.inputs.semiMajorAxisAu = slotAu;
      }
    }
    const gasGiants = world.system.gasGiants;
    if (gasGiants?.byId) {
      for (const gasGiantId of gasGiants.order || []) {
        const gasGiant = gasGiants.byId[gasGiantId];
        if (!gasGiant || gasGiant.slotIndex == null) continue;
        const orbitSlots = resolveOrbitSlotsForHostFrame(
          homeSystemContext,
          gasGiant.hostFrameId,
          orbitsAu,
        );
        const slotAu = orbitSlots[gasGiant.slotIndex - 1];
        if (Number.isFinite(slotAu) && slotAu > 0) gasGiant.au = slotAu;
      }
    }
  }

  world.system.orbitMode = next;
  const selectedPlanet = world.planets.byId[world.planets.selectedId];
  if (selectedPlanet) {
    world.planet = { ...selectedPlanet.inputs, name: selectedPlanet.name };
  }
  saveWorld(world);
  return world;
}

export function saveWorld(world, options = {}) {
  const normalized = migrateWorld(mergeWorldForMigration(world));
  return saveWorldRaw(JSON.stringify(normalized), options);
}

export function applyGeneratedSystemDraft(draftEnvelope, options = {}) {
  const currentWorld = loadWorld();
  const draftWorld =
    draftEnvelope?.draftWorld && typeof draftEnvelope.draftWorld === "object"
      ? draftEnvelope.draftWorld
      : null;
  if (!draftWorld) return currentWorld;

  const nextWorld = defaultWorld();
  nextWorld.cluster = normalizeLocalClusterInputs(currentWorld.cluster || nextWorld.cluster);
  nextWorld.clusterSystemNames = normalizeClusterSystemNames(currentWorld.clusterSystemNames);
  nextWorld.clusterAdjustments =
    currentWorld.clusterAdjustments && typeof currentWorld.clusterAdjustments === "object"
      ? {
          addedSystems: Array.isArray(currentWorld.clusterAdjustments.addedSystems)
            ? currentWorld.clusterAdjustments.addedSystems
            : [],
          removedSystemIds: Array.isArray(currentWorld.clusterAdjustments.removedSystemIds)
            ? currentWorld.clusterAdjustments.removedSystemIds
            : [],
          componentOverrides:
            currentWorld.clusterAdjustments.componentOverrides &&
            typeof currentWorld.clusterAdjustments.componentOverrides === "object"
              ? currentWorld.clusterAdjustments.componentOverrides
              : {},
        }
      : nextWorld.clusterAdjustments;

  nextWorld.star =
    draftWorld.star && typeof draftWorld.star === "object"
      ? { ...draftWorld.star }
      : nextWorld.star;
  nextWorld.stellarSystem =
    draftWorld.stellarSystem && typeof draftWorld.stellarSystem === "object"
      ? normalizeStellarSystem(draftWorld.stellarSystem, { fallbackStar: nextWorld.star })
      : nextWorld.stellarSystem;
  nextWorld.system =
    draftWorld.system && typeof draftWorld.system === "object"
      ? deepMerge(nextWorld.system, draftWorld.system)
      : nextWorld.system;
  nextWorld.planets =
    draftWorld.planets && typeof draftWorld.planets === "object"
      ? draftWorld.planets
      : nextWorld.planets;
  nextWorld.planet =
    draftWorld.planet && typeof draftWorld.planet === "object" ? draftWorld.planet : {};
  nextWorld.moons =
    draftWorld.moons && typeof draftWorld.moons === "object" ? draftWorld.moons : nextWorld.moons;
  nextWorld.moon = draftWorld.moon && typeof draftWorld.moon === "object" ? draftWorld.moon : {};
  nextWorld.selectedBodyType = draftWorld.selectedBodyType === "gasGiant" ? "gasGiant" : "planet";

  const preserveWorldSections = Array.isArray(draftEnvelope?.generationMeta?.preserveWorldSections)
    ? draftEnvelope.generationMeta.preserveWorldSections
    : Array.isArray(draftWorld?.generationMeta?.preserveWorldSections)
      ? draftWorld.generationMeta.preserveWorldSections
      : [];
  for (const section of preserveWorldSections) {
    if (!section || typeof currentWorld?.[section] !== "object" || currentWorld[section] == null)
      continue;
    nextWorld[section] = structuredClone(currentWorld[section]);
  }

  if (draftWorld.generationMeta && typeof draftWorld.generationMeta === "object") {
    nextWorld.generationMeta = {
      ...draftWorld.generationMeta,
      generatedUtc: new Date().toISOString(),
    };
  }

  saveWorld(nextWorld, options);
  return nextWorld;
}

export function updateWorld(patch) {
  const world = loadWorld();
  const next = migrateWorld(deepMerge(world, patch));
  saveWorld(next);
  return next;
}

export function getClusterInputs(world = loadWorld()) {
  return normalizeLocalClusterInputs(world.cluster || LOCAL_CLUSTER_DEFAULTS);
}

export function updateClusterInputs(patch) {
  return updateWorld({ cluster: { ...(patch || {}) } });
}

export function getClusterSystemNames(world = loadWorld()) {
  return normalizeClusterSystemNames(world.clusterSystemNames);
}

export function updateClusterSystemNames(nextNames) {
  const world = loadWorld();
  world.clusterSystemNames = normalizeClusterSystemNames(nextNames);
  saveWorld(world);
  return world;
}

const DEFAULT_CLUSTER_ADJUSTMENTS = Object.freeze({
  addedSystems: [],
  removedSystemIds: [],
  componentOverrides: {},
});

export function getClusterAdjustments(world = loadWorld()) {
  const raw = world.clusterAdjustments;
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_CLUSTER_ADJUSTMENTS,
      addedSystems: [],
      removedSystemIds: [],
      componentOverrides: {},
    };
  }
  return {
    addedSystems: Array.isArray(raw.addedSystems) ? raw.addedSystems : [],
    removedSystemIds: Array.isArray(raw.removedSystemIds) ? raw.removedSystemIds : [],
    componentOverrides:
      raw.componentOverrides && typeof raw.componentOverrides === "object"
        ? raw.componentOverrides
        : {},
  };
}

export function updateClusterAdjustments(adj) {
  const world = loadWorld();
  world.clusterAdjustments = adj;
  saveWorld(world);
  return world;
}

export function listSystemGasGiants(world = loadWorld()) {
  return getGasGiants(world, normalizeGasGiantModel);
}

export function getStellarSystem(world = loadWorld()) {
  return normalizeStellarSystem(world?.stellarSystem, { fallbackStar: world?.star });
}

export function saveStellarSystem(stellarSystem, options = {}) {
  const world = loadWorld();
  world.stellarSystem = normalizeStellarSystem(stellarSystem, { fallbackStar: world?.star });
  world.star = projectPrimaryStarFromStellarSystem(world.stellarSystem, world?.star);
  saveWorld(world, options);
  return world;
}

export function getPrimaryHomeStarId(world = loadWorld()) {
  return getPrimaryStarId(getStellarSystem(world));
}

export function getDefaultHomeSystemHostFrameId(world = loadWorld()) {
  return getDefaultHostFrameId(getStellarSystem(world));
}

export function listHomeSystemStars(world = loadWorld()) {
  return listStellarSystemStars(getStellarSystem(world));
}

export function listHomeSystemPairs(world = loadWorld()) {
  return listStellarSystemPairs(getStellarSystem(world));
}

export function listHomeSystemHostFrames(world = loadWorld()) {
  return listStellarSystemHostFrames(getStellarSystem(world));
}

export function listSystemDebrisDisks(world = loadWorld(), options = {}) {
  return getDebrisDisksModel(world, options);
}

export function saveSystemGasGiants(list) {
  const world = loadWorld();
  const prevSelectedGg = world.system.gasGiants?.selectedId ?? null;
  const giants = (list || []).map((gasGiant, index) => normalizeGasGiantModel(gasGiant, index + 1));
  world.system.gasGiants = makeCollection(giants, "gg");
  world.system.gasGiants.selectedId =
    prevSelectedGg && world.system.gasGiants.byId[prevSelectedGg]
      ? prevSelectedGg
      : world.system.gasGiants.order[0] || null;
  const next = migrateWorld(world);
  saveWorld(next);
  return next;
}

export function getSelectedGasGiant(world = loadWorld()) {
  const id = world.system?.gasGiants?.selectedId;
  if (!id) return null;
  const raw = world.system.gasGiants.byId?.[id];
  return raw ? normalizeGasGiantModel(raw, 1) : null;
}

export function selectGasGiant(gasGiantId) {
  const world = loadWorld();
  if (!world.system?.gasGiants?.byId?.[gasGiantId]) return world;
  world.system.gasGiants.selectedId = gasGiantId;
  world.selectedBodyType = "gasGiant";
  saveWorld(world);
  return world;
}

export function selectBodyType(type) {
  const world = loadWorld();
  world.selectedBodyType = type === "gasGiant" ? "gasGiant" : "planet";
  saveWorld(world);
  return world;
}

export function saveSystemDebrisDisks(list) {
  const world = loadWorld();
  const fallbackHostFrameId =
    String(world?.stellarSystem?.defaultHostFrameId ?? "").trim() || "star_a";
  world.system.debrisDisks = makeCollection(
    (list || []).map((disk, index) =>
      normalizeDebrisDiskModel(disk, index + 1, { fallbackHostFrameId }),
    ),
    "dd",
  );
  const next = migrateWorld(world);
  saveWorld(next);
  return next;
}

export function exportEnvelope() {
  const world = stripLegacyKeys(loadWorld());
  return {
    tool: TOOL_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedUtc: new Date().toISOString(),
    world,
  };
}

export function importWorld(worldLike) {
  const normalized = normalizeWorld(worldLike);
  saveWorld(normalized, { immediate: true });
  clearWorldLoadFailure();
  return normalized;
}

export async function __resetStoreForTests(options = {}) {
  clearWorldLoadFailure();
  clearStorageError();
  await resetStorePersistenceForTests(options);
}
