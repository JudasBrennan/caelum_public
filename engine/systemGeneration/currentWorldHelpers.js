import { normalizeGasGiant } from "../../ui/store/gasGiantModel.js";
import {
  getDebrisDisks,
  getGasGiants,
  listFromCollection,
} from "../../ui/store/systemCollections.js";
import {
  normalizeStellarSystem,
  projectPrimaryStarFromStellarSystem,
} from "../../ui/store/stellarSystemModel.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizedWorld(value) {
  return value && typeof value === "object" ? value : {};
}

function inferQuadLayoutKind(stellarSystem) {
  const pairIds = new Set(stellarSystem?.pairs?.order || []);
  if (pairIds.has("pair_root") && pairIds.has("pair_cd")) return "paired";
  return pairIds.has("pair_abcd") ? "chain" : null;
}

function inferTopologyRecipeId(stellarSystem) {
  const normalized = normalizeStellarSystem(stellarSystem);
  switch (normalized?.topologyKind) {
    case "binary": {
      const rootPair = normalized?.pairs?.byId?.[normalized.rootNodeId] || null;
      return Number(rootPair?.semiMajorAxisAu || 0) < 1 ? "close-binary" : "wide-binary";
    }
    case "triple":
      return "triple";
    case "quad":
      return inferQuadLayoutKind(normalized) === "paired" ? "quad-paired" : "quad-chain";
    case "single":
    default:
      return "single";
  }
}

export function buildTopologyDraftFromWorld(worldLike = {}) {
  const world = normalizedWorld(worldLike);
  const stellarSystem = normalizeStellarSystem(world?.stellarSystem, { fallbackStar: world?.star });
  return {
    stellarSystem: clone(stellarSystem),
    recipeId: inferTopologyRecipeId(stellarSystem),
    quadLayoutKind: inferQuadLayoutKind(stellarSystem),
    star: projectPrimaryStarFromStellarSystem(stellarSystem, world?.star || {}),
  };
}

export function listExistingPlanets(worldLike = {}) {
  const world = normalizedWorld(worldLike);
  return listFromCollection(world?.planets).map((entry) => clone(entry));
}

export function listExistingMoons(worldLike = {}) {
  const world = normalizedWorld(worldLike);
  return listFromCollection(world?.moons).map((entry) => clone(entry));
}

export function listExistingGasGiants(worldLike = {}) {
  const world = normalizedWorld(worldLike);
  return getGasGiants(world, normalizeGasGiant).map((entry) => clone(entry));
}

export function listExistingDebrisDisks(worldLike = {}) {
  const world = normalizedWorld(worldLike);
  return getDebrisDisks(world).map((entry) => clone(entry));
}

export function getSelectedPlanetEntry(worldLike = {}) {
  const world = normalizedWorld(worldLike);
  const selectedId = String(world?.planets?.selectedId || "").trim();
  const entry = selectedId ? world?.planets?.byId?.[selectedId] : null;
  if (entry && typeof entry === "object") return clone(entry);
  const first = listFromCollection(world?.planets)[0];
  return first && typeof first === "object" ? clone(first) : null;
}

export function getSelectedGasGiantEntry(worldLike = {}) {
  const world = normalizedWorld(worldLike);
  const selectedId = String(world?.system?.gasGiants?.selectedId || "").trim();
  const entry = selectedId ? world?.system?.gasGiants?.byId?.[selectedId] : null;
  if (entry && typeof entry === "object") return clone(normalizeGasGiant(entry));
  const first = getGasGiants(world, normalizeGasGiant)[0];
  return first && typeof first === "object" ? clone(first) : null;
}

export function reserveStarNames(namePicker, stellarSystem) {
  if (!namePicker || typeof namePicker.reserve !== "function") return;
  for (const starId of stellarSystem?.stars?.order || []) {
    const starName = String(stellarSystem?.stars?.byId?.[starId]?.name || "").trim();
    if (starName) namePicker.reserve(starName);
  }
}

export function reservePrimaryBodyNames(namePicker, worldLike = {}) {
  if (!namePicker || typeof namePicker.reserve !== "function") return;
  for (const entry of listExistingPlanets(worldLike)) {
    if (entry?.name) namePicker.reserve(entry.name);
  }
  for (const entry of listExistingGasGiants(worldLike)) {
    if (entry?.name) namePicker.reserve(entry.name);
  }
}

export function renameExistingWorldBodies(worldLike = {}, namePicker) {
  const world = normalizedWorld(worldLike);
  const topologyDraft = buildTopologyDraftFromWorld(world);
  const stellarSystem = clone(topologyDraft.stellarSystem);
  const starIds = stellarSystem?.stars?.order || [];
  const { systemStem, starNames } =
    typeof namePicker?.buildStarNames === "function"
      ? namePicker.buildStarNames(starIds.length)
      : { systemStem: "", starNames: [] };

  for (let index = 0; index < starIds.length; index += 1) {
    const starId = starIds[index];
    if (stellarSystem?.stars?.byId?.[starId]) {
      stellarSystem.stars.byId[starId].name =
        starNames[index] || stellarSystem.stars.byId[starId].name;
    }
  }

  const planets = listExistingPlanets(world).map((planet) => ({
    ...planet,
    name:
      typeof namePicker?.pickPlanetName === "function" ? namePicker.pickPlanetName() : planet.name,
  }));
  const gasGiants = listExistingGasGiants(world).map((gasGiant) => ({
    ...gasGiant,
    name:
      typeof namePicker?.pickPlanetName === "function"
        ? namePicker.pickPlanetName()
        : gasGiant.name,
  }));
  const moons = listExistingMoons(world).map((moon) => ({
    ...moon,
    name: typeof namePicker?.pickMoonName === "function" ? namePicker.pickMoonName() : moon.name,
  }));
  const debrisDisks = listExistingDebrisDisks(world);

  return {
    topologyDraft: {
      ...topologyDraft,
      stellarSystem,
      star: projectPrimaryStarFromStellarSystem(stellarSystem, world?.star || {}),
    },
    systemStem,
    planets,
    gasGiants,
    moons,
    debrisDisks,
  };
}
