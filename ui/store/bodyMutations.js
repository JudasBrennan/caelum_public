import { normalizeMoonInputs } from "../../engine/moon/config.js";
import {
  ensureCanonicalPlanetaryBodyStorage,
  getSelectedPlanetaryBodyLegacyId,
  listRockyPlanetEntries,
  replacePlanetaryBodiesByLegacyKind,
  selectPlanetaryBodyByLegacyId,
  syncMoonParentAliases,
  syncLegacyPlanetCollections,
} from "./compat/planetaryBodyCompatibility.js";
import { isValidMoonParentId } from "./planetaryBodyModel.js";

function makeEntityId(prefix) {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function syncSelectedPlanetSnapshot(world) {
  const selectedPlanet = world.planets?.byId?.[world.planets?.selectedId];
  if (selectedPlanet) {
    world.planet = { ...selectedPlanet.inputs, name: selectedPlanet.name };
  }
}

function normalizeHostFrameKey(value) {
  const id = String(value ?? "").trim();
  return id || "__default__";
}

function syncSelectedMoonSnapshot(world) {
  const selectedMoon = world.moons?.selectedId ? world.moons.byId?.[world.moons.selectedId] : null;
  if (selectedMoon) {
    world.moon = { ...selectedMoon.inputs, name: selectedMoon.name || selectedMoon.inputs?.name };
  }
}

function syncBodyStorage(world) {
  ensureCanonicalPlanetaryBodyStorage(world);
  syncLegacyPlanetCollections(world);
  syncMoonParentAliases(world);
  return world;
}

export function selectPlanetInWorld(world, planetId) {
  if (!selectPlanetaryBodyByLegacyId(world, "rocky", planetId)) return world;
  world.selectedBodyType = "planet";
  syncSelectedPlanetSnapshot(world);
  return world;
}

export function createPlanetInWorld(world, inputs, { name = "New Planet" } = {}) {
  const id = makeEntityId("p");
  const normalizedInputs = { ...(inputs || {}) };
  if (Object.prototype.hasOwnProperty.call(normalizedInputs, "hostFrameId")) {
    delete normalizedInputs.hostFrameId;
  }
  if (normalizedInputs.ringMode == null) normalizedInputs.ringMode = "auto";
  if (normalizedInputs.ringStyleId == null) normalizedInputs.ringStyleId = "auto";
  const planet = {
    id,
    name: name || inputs?.name || "New Planet",
    slotIndex: null,
    hostFrameId: inputs?.hostFrameId || null,
    locked: false,
    inputs: normalizedInputs,
  };
  const planets = listRockyPlanetEntries(world);
  planets.push(planet);
  replacePlanetaryBodiesByLegacyKind(world, "rocky", planets, { selectedLegacyId: id });
  world.selectedBodyType = "planet";
  world.planet = { ...planet.inputs, name: planet.name };
  return world;
}

export function deletePlanetInWorld(world, planetId) {
  const planets = listRockyPlanetEntries(world);
  if (!planets.some((planet) => planet.id === planetId)) return world;
  const nextPlanets = planets.filter((planet) => planet.id !== planetId);
  const fallbackPlanetId = nextPlanets[0]?.id || null;

  replacePlanetaryBodiesByLegacyKind(world, "rocky", nextPlanets, {
    selectedLegacyId:
      getSelectedPlanetaryBodyLegacyId(world, "rocky") === planetId ? fallbackPlanetId : undefined,
  });

  if (world.moons?.byId && typeof world.moons.byId === "object") {
    for (const moonId of Object.keys(world.moons.byId)) {
      const moon = world.moons.byId[moonId];
      if (!moon || moon.planetId !== planetId) continue;
      moon.planetId = null;
      moon.locked = false;
    }
    world.moons.order = (world.moons.order || []).filter((moonId) => !!world.moons.byId[moonId]);
    if (!world.moons.byId[world.moons.selectedId]) {
      world.moons.selectedId = world.moons.order[0] || Object.keys(world.moons.byId)[0] || null;
    }
  }

  syncSelectedPlanetSnapshot(world);
  syncSelectedMoonSnapshot(world);
  return syncBodyStorage(world);
}

export function updatePlanetInWorld(world, planetId, patch) {
  const planets = listRockyPlanetEntries(world);
  const planet = planets.find((entry) => entry.id === planetId);
  if (!planet) return world;

  if (patch.name != null) planet.name = patch.name;
  if (patch.slotIndex !== undefined) planet.slotIndex = patch.slotIndex;
  if (patch.hostFrameId !== undefined) planet.hostFrameId = patch.hostFrameId || null;
  if (patch.inputs) planet.inputs = { ...planet.inputs, ...patch.inputs };

  replacePlanetaryBodiesByLegacyKind(world, "rocky", planets, {
    selectedLegacyId: getSelectedPlanetaryBodyLegacyId(world, "rocky"),
  });
  syncSelectedPlanetSnapshot(world);
  return world;
}

export function selectMoonInWorld(world, moonId) {
  if (!world.moons.byId[moonId]) return world;
  world.moons.selectedId = moonId;
  syncSelectedMoonSnapshot(world);
  return syncBodyStorage(world);
}

export function createMoonInWorld(world, inputs, { name = "New Moon", planetId } = {}) {
  const id = makeEntityId("m");
  const parentId =
    planetId === undefined
      ? getSelectedPlanetaryBodyLegacyId(world, "rocky") || null
      : planetId || null;
  const moon = {
    id,
    name: name || inputs?.name || "New Moon",
    planetId: parentId,
    locked: false,
    inputs: normalizeMoonInputs(inputs || {}),
  };
  world.moons.byId[id] = moon;
  world.moons.order.push(id);
  world.moons.selectedId = id;
  world.moon = { ...moon.inputs, name: moon.name };
  return syncBodyStorage(world);
}

export function deleteMoonInWorld(world, moonId) {
  if (!world.moons.byId[moonId]) return world;
  delete world.moons.byId[moonId];
  world.moons.order = world.moons.order.filter((id) => id !== moonId);
  if (world.moons.selectedId === moonId) {
    world.moons.selectedId = world.moons.order[0] || Object.keys(world.moons.byId)[0];
  }
  syncSelectedMoonSnapshot(world);
  return syncBodyStorage(world);
}

export function updateMoonInWorld(world, moonId, patch) {
  const moon = world.moons.byId[moonId];
  if (!moon) return world;

  if (patch.name != null) moon.name = patch.name;
  if (Object.prototype.hasOwnProperty.call(patch, "locked")) {
    const nextLocked = !!patch.locked;
    moon.locked = moon.planetId == null ? false : nextLocked;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "planetId")) {
    const nextPlanetId =
      patch.planetId == null || patch.planetId === "" ? null : String(patch.planetId);
    if (
      (nextPlanetId == null || isValidMoonParentId(world, nextPlanetId)) &&
      (!moon.locked || nextPlanetId === moon.planetId)
    ) {
      moon.planetId = nextPlanetId;
      if (nextPlanetId == null) moon.locked = false;
    }
  }
  if (patch.inputs) moon.inputs = normalizeMoonInputs({ ...moon.inputs, ...patch.inputs });

  if (world.moons.selectedId === moonId) syncSelectedMoonSnapshot(world);
  return syncBodyStorage(world);
}

export function toggleMoonLockInWorld(world, moonId) {
  const moon = world.moons.byId[moonId];
  if (!moon) return world;
  if (moon.planetId == null) {
    moon.locked = false;
    return syncBodyStorage(world);
  }
  moon.locked = !moon.locked;
  return syncBodyStorage(world);
}

export function assignMoonToPlanetInWorld(world, moonId, planetIdOrNull, { force = false } = {}) {
  const moon = world.moons.byId[moonId];
  if (!moon) return world;

  const nextPlanetId =
    planetIdOrNull == null || planetIdOrNull === "" ? null : String(planetIdOrNull);
  const isValidParent = isValidMoonParentId(world, nextPlanetId);
  if (nextPlanetId != null && !isValidParent) return world;
  if (!force && moon.locked && nextPlanetId !== moon.planetId) return world;

  moon.planetId = nextPlanetId;
  if (nextPlanetId == null) moon.locked = false;
  if (world.moons.selectedId === moonId) syncSelectedMoonSnapshot(world);
  return syncBodyStorage(world);
}

export function applyMoonSiblingPatchInWorld(
  world,
  siblingPatch,
  { preserveSelectedMoonId = null } = {},
) {
  const operations = Array.isArray(siblingPatch?.operations) ? siblingPatch.operations : [];
  if (!operations.length) {
    return {
      changed: false,
      createdMoonIds: [],
      updatedMoonIds: [],
    };
  }

  const createdMoonIds = [];
  const updatedMoonIds = [];
  const selectedMoonId = preserveSelectedMoonId || world.moons.selectedId || null;

  for (const operation of operations) {
    if (!operation || typeof operation !== "object") continue;

    if (operation.type === "create" && operation.inputs) {
      createMoonInWorld(world, operation.inputs, {
        name: operation.name || operation.inputs?.name || "New Moon",
        planetId: operation.planetId,
      });
      const createdMoonId = world.moons.selectedId;
      if (createdMoonId && world.moons.byId[createdMoonId]) {
        if (Object.prototype.hasOwnProperty.call(operation, "locked")) {
          world.moons.byId[createdMoonId].locked =
            world.moons.byId[createdMoonId].planetId == null ? false : !!operation.locked;
        }
        createdMoonIds.push(createdMoonId);
      }
      continue;
    }

    if (operation.type === "update" && operation.moonId && world.moons.byId[operation.moonId]) {
      if (Object.prototype.hasOwnProperty.call(operation, "planetId")) {
        assignMoonToPlanetInWorld(world, operation.moonId, operation.planetId, {
          force: true,
        });
      }
      const moonPatch = {
        inputs: operation.inputPatch || {},
      };
      if (Object.prototype.hasOwnProperty.call(operation, "name")) moonPatch.name = operation.name;
      if (Object.prototype.hasOwnProperty.call(operation, "locked"))
        moonPatch.locked = operation.locked;
      updateMoonInWorld(world, operation.moonId, moonPatch);
      updatedMoonIds.push(operation.moonId);
    }
  }

  if (selectedMoonId && world.moons.byId[selectedMoonId]) {
    world.moons.selectedId = selectedMoonId;
  }
  syncSelectedMoonSnapshot(world);

  syncBodyStorage(world);

  return {
    changed: createdMoonIds.length > 0 || updatedMoonIds.length > 0,
    createdMoonIds,
    updatedMoonIds,
  };
}

export function togglePlanetLockInWorld(world, planetId) {
  const planets = listRockyPlanetEntries(world);
  const planet = planets.find((entry) => entry.id === planetId);
  if (!planet) return world;
  planet.locked = !planet.locked;
  replacePlanetaryBodiesByLegacyKind(world, "rocky", planets, {
    selectedLegacyId: getSelectedPlanetaryBodyLegacyId(world, "rocky"),
  });
  return world;
}

export function assignPlanetToSlotInWorld(world, planetId, slotIndexOrNull, options = {}) {
  const planets = listRockyPlanetEntries(world);
  const planet = planets.find((entry) => entry.id === planetId);
  if (!planet) return world;
  const targetHostFrameKey = normalizeHostFrameKey(planet.hostFrameId);

  if (slotIndexOrNull != null) {
    for (const other of planets) {
      if (other.id === planetId) continue;
      if (!other) continue;
      if (normalizeHostFrameKey(other.hostFrameId) !== targetHostFrameKey) continue;
      if (other.slotIndex === slotIndexOrNull) other.slotIndex = null;
    }
  }

  planet.slotIndex = slotIndexOrNull;
  syncPlanetOrbitAuToSlot(planet, slotIndexOrNull, options.orbitsAu);
  replacePlanetaryBodiesByLegacyKind(world, "rocky", planets, {
    selectedLegacyId: getSelectedPlanetaryBodyLegacyId(world, "rocky"),
  });
  syncSelectedPlanetSnapshot(world);
  return world;
}

function syncPlanetOrbitAuToSlot(planet, slotIndex, orbitsAu) {
  if (slotIndex == null || !Array.isArray(orbitsAu)) return;
  const slotAu = Number(orbitsAu[Number(slotIndex) - 1]);
  if (!(Number.isFinite(slotAu) && slotAu > 0)) return;
  planet.inputs = {
    ...(planet.inputs || {}),
    semiMajorAxisAu: slotAu,
  };
}

export function movePlanetToSlotInWorld(world, planetId, slotIndexOrNull, options = {}) {
  const planets = listRockyPlanetEntries(world);
  const planet = planets.find((entry) => entry.id === planetId);
  if (!planet) return { world, changed: false, reason: "missing-planet" };
  if (planet.locked) return { world, changed: false, reason: "source-locked" };

  const targetSlot = slotIndexOrNull == null ? null : Number(slotIndexOrNull);
  if (targetSlot != null && (!Number.isInteger(targetSlot) || targetSlot < 1)) {
    return { world, changed: false, reason: "invalid-slot" };
  }

  const sourceSlot = planet.slotIndex == null ? null : Number(planet.slotIndex);
  const targetHostFrameKey = normalizeHostFrameKey(planet.hostFrameId);

  if (targetSlot == null) {
    if (sourceSlot == null) return { world, changed: false, reason: "already-unassigned" };
    planet.slotIndex = null;
    replacePlanetaryBodiesByLegacyKind(world, "rocky", planets, {
      selectedLegacyId: getSelectedPlanetaryBodyLegacyId(world, "rocky"),
    });
    syncSelectedPlanetSnapshot(world);
    return { world, changed: true, reason: "unassigned" };
  }

  if (sourceSlot === targetSlot) return { world, changed: false, reason: "same-slot" };

  const occupant = planets.find(
    (entry) =>
      entry?.id !== planetId &&
      Number(entry?.slotIndex) === targetSlot &&
      normalizeHostFrameKey(entry?.hostFrameId) === targetHostFrameKey,
  );
  if (occupant?.locked) return { world, changed: false, reason: "target-locked" };
  if (occupant && sourceSlot == null) return { world, changed: false, reason: "target-occupied" };

  planet.slotIndex = targetSlot;
  syncPlanetOrbitAuToSlot(planet, targetSlot, options.orbitsAu);

  if (occupant) {
    occupant.slotIndex = sourceSlot;
    syncPlanetOrbitAuToSlot(occupant, sourceSlot, options.orbitsAu);
  }

  replacePlanetaryBodiesByLegacyKind(world, "rocky", planets, {
    selectedLegacyId: getSelectedPlanetaryBodyLegacyId(world, "rocky"),
  });
  syncSelectedPlanetSnapshot(world);
  return {
    world,
    changed: true,
    reason: occupant ? "swapped" : "moved",
    swappedWithId: occupant?.id || null,
  };
}
