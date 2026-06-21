// Compatibility helpers for persisted world-shape migration.
//
// These functions isolate old storage shapes that still need to be repaired
// while `migrateWorld()` remains the public migration orchestrator.

import { normalizeMoonInputs } from "../../../engine/moon/config.js";
import { normalizeRingStyleId } from "../../ringAppearanceProfiles.js";
import { withCompositionInventoryDefaults } from "../compositionInventoryInputs.js";
import { normalizeGasGiant } from "../gasGiantModel.js";
import { getGasGiants, makeCollection } from "../systemCollections.js";
import {
  applyCompatibilityStarToStellarSystem,
  getDefaultHostFrameId,
  normalizeStellarSystem,
  projectPrimaryStarFromStellarSystem,
} from "../stellarSystemModel.js";
import { SCHEMA_VERSION } from "../worldSchema.js";

export function applyCompatibilityStarShape(world) {
  const hasExplicitStar =
    !!world.star && typeof world.star === "object" && !Array.isArray(world.star);
  const compatibilityStar = hasExplicitStar ? { ...world.star } : {};
  const hasExplicitStellarSystem =
    !!world.stellarSystem &&
    typeof world.stellarSystem === "object" &&
    !Array.isArray(world.stellarSystem);

  world.stellarSystem = normalizeStellarSystem(
    hasExplicitStellarSystem ? world.stellarSystem : null,
    { fallbackStar: compatibilityStar },
  );

  const shouldApplyCompatibilityStar =
    hasExplicitStar && (!hasExplicitStellarSystem || world.stellarSystem.topologyKind === "single");
  if (shouldApplyCompatibilityStar) {
    world.stellarSystem = applyCompatibilityStarToStellarSystem(
      world.stellarSystem,
      compatibilityStar,
    );
  }

  world.star = projectPrimaryStarFromStellarSystem(world.stellarSystem, compatibilityStar);
  return getDefaultHostFrameId(world.stellarSystem);
}

export function ensureLegacyPlanetCollection(world, defaultHostFrameId) {
  if (!world.planets || !world.planets.byId) {
    const legacyInputs = world.planet ? { ...world.planet } : null;
    const defaultPlanetInputs = withCompositionInventoryDefaults({
      name: "New Planet",
      semiMajorAxisAu: 1.0,
      eccentricity: 0.0167,
      inclinationDeg: 0.0,
      longitudeOfPeriapsisDeg: 283.0,
      subsolarLongitudeDeg: 0.0,
      rotationPeriodHours: 24.0,
      axialTiltDeg: 23.44,
      massEarth: 1.0,
      cmfPct: -1,
      albedoBond: 0.3,
      greenhouseEffect: 1.65,
      observerHeightM: 1.75,
      pressureAtm: 1.0,
      o2Pct: 20.95,
      co2Pct: 0.04,
      arPct: 0.93,
    });
    const p1 = {
      id: "p1",
      name: legacyInputs?.name || "New Planet",
      slotIndex: null,
      locked: false,
      inputs: withCompositionInventoryDefaults(legacyInputs || defaultPlanetInputs),
    };
    world.planets = { selectedId: "p1", order: ["p1"], byId: { p1 } };
    world.version = SCHEMA_VERSION;
  }

  if (!world.planets.selectedId || !world.planets.byId[world.planets.selectedId]) {
    world.planets.selectedId = world.planets.order[0] || Object.keys(world.planets.byId)[0] || null;
  }

  if (world.planets && world.planets.byId) {
    for (const planetId of Object.keys(world.planets.byId)) {
      const planet = world.planets.byId[planetId];
      if (!planet) continue;
      if (!planet.inputs) planet.inputs = {};
      planet.inputs = withCompositionInventoryDefaults(planet.inputs);
      if (!planet.name) planet.name = planet.inputs.name || "New Planet";
      if (!planet.inputs.name) planet.inputs.name = planet.name;
      const hostFrameId = String(planet.hostFrameId ?? "").trim();
      planet.hostFrameId = hostFrameId || defaultHostFrameId || null;
    }
  }

  const selectedPlanet = world.planets.byId[world.planets.selectedId];
  if (selectedPlanet && selectedPlanet.inputs) {
    world.planet = {
      ...selectedPlanet.inputs,
      name: selectedPlanet.name || selectedPlanet.inputs.name,
    };
  }

  return world;
}

export function ensureLegacyMoonCollection(world, defaultHostFrameId) {
  if (!world.moons || !world.moons.byId) {
    const legacyMoon = world.moon
      ? { ...world.moon }
      : {
          name: "Luna",
          semiMajorAxisKm: 384748,
          eccentricity: 0.055,
          inclinationDeg: 5.15,
          massMoon: 1.0,
          densityGcm3: 3.34,
          albedo: 0.11,
        };
    const planetId = world.planets?.selectedId || "p1";
    const m1 = {
      id: "m1",
      name: legacyMoon.name || "Luna",
      planetId,
      locked: false,
      inputs: legacyMoon,
    };
    world.moons = { selectedId: "m1", order: ["m1"], byId: { m1 } };
  }

  if (!world.moons.selectedId || !world.moons.byId[world.moons.selectedId]) {
    world.moons.selectedId = world.moons.order[0] || Object.keys(world.moons.byId)[0] || null;
  }

  if (world.moons && world.moons.byId) {
    for (const moonId of Object.keys(world.moons.byId)) {
      const moon = world.moons.byId[moonId];
      if (!moon) continue;
      moon.inputs = normalizeMoonInputs(moon.inputs || {});
      if (!moon.name) moon.name = moon.inputs.name || "Luna";
      if (!moon.inputs.name) moon.inputs.name = moon.name;
      if (typeof moon.locked !== "boolean") moon.locked = false;
      if (moon.planetId === "") moon.planetId = null;
      if (
        moon.planetId != null &&
        !world.planets.byId[moon.planetId] &&
        !world.system?.gasGiants?.byId?.[moon.planetId]
      ) {
        moon.planetId = null;
      }
      if (!moon.hostFrameId) {
        const parentHostFrameId =
          world.planets.byId[moon.planetId]?.hostFrameId ||
          world.system?.gasGiants?.byId?.[moon.planetId]?.hostFrameId ||
          defaultHostFrameId ||
          null;
        moon.hostFrameId = parentHostFrameId;
      }
    }
  }

  const selectedMoon = world.moons.byId[world.moons.selectedId];
  if (selectedMoon && selectedMoon.inputs) {
    world.moon = { ...selectedMoon.inputs, name: selectedMoon.name || selectedMoon.inputs.name };
  }

  return world;
}

export function migrateLegacyOutermostGasGiant(world, defaultHostFrameId) {
  if (!world.system) return world;

  const legacyOuterGasGiantAu = Number(world.system.outermostGasGiantAu);
  if (Number.isFinite(legacyOuterGasGiantAu) && legacyOuterGasGiantAu > 0) {
    const existingGasGiants = getGasGiants(world, normalizeGasGiant);
    if (!existingGasGiants.length) {
      const gasGiant = normalizeGasGiant(
        {
          id: "gg1",
          name: "Outermost gas giant",
          au: legacyOuterGasGiantAu,
          hostFrameId: defaultHostFrameId || null,
          style: "jupiter",
        },
        1,
      );
      world.system.gasGiants = makeCollection([gasGiant], "gg");
    }
  }
  delete world.system.outermostGasGiantAu;
  return world;
}

export function normalizeLegacyPlanetInputs(world) {
  if (world.planets && world.planets.byId) {
    for (const planetId of Object.keys(world.planets.byId)) {
      const inputs = world.planets.byId[planetId]?.inputs;
      if (!inputs) continue;
      if (inputs.ringMode == null) inputs.ringMode = "auto";
      inputs.ringStyleId = normalizeRingStyleId(inputs.ringStyleId);
      if (!inputs.greenhouseMode) inputs.greenhouseMode = "manual";
      if (inputs.h2oPct == null) inputs.h2oPct = 0;
      if (inputs.ch4Pct == null) inputs.ch4Pct = 0;
      if (inputs.h2Pct == null) inputs.h2Pct = 0;
      if (inputs.hePct == null) inputs.hePct = 0;
      if (inputs.so2Pct == null) inputs.so2Pct = 0;
      if (inputs.nh3Pct == null) inputs.nh3Pct = 0;
      if (inputs.wmfPct == null) inputs.wmfPct = 0;
      if (inputs.tectonicRegime == null) inputs.tectonicRegime = "unknown";
      if (inputs.mantleOxidation == null) inputs.mantleOxidation = "earth";
      if (inputs.tectonicRegime === "unknown" || inputs.tectonicRegime === "mobile") {
        inputs.tectonicRegime = "auto";
      }
      if (inputs.cmfPct === 32 || inputs.cmfPct === 32.0) inputs.cmfPct = -1;
      if (inputs.radioisotopeAbundance === undefined) inputs.radioisotopeAbundance = null;
      if (inputs.radioisotopeMode === undefined) inputs.radioisotopeMode = "simple";
      if (inputs.u238Abundance === undefined) inputs.u238Abundance = null;
      if (inputs.u235Abundance === undefined) inputs.u235Abundance = null;
      if (inputs.th232Abundance === undefined) inputs.th232Abundance = null;
      if (inputs.k40Abundance === undefined) inputs.k40Abundance = null;
      Object.assign(inputs, withCompositionInventoryDefaults(inputs));
    }
  }

  if (world.planet && world.planet.ringMode == null) {
    world.planet.ringMode = "auto";
  }
  if (world.planet) {
    world.planet.ringStyleId = normalizeRingStyleId(world.planet.ringStyleId);
    if (world.planet.radioisotopeAbundance === undefined) {
      world.planet.radioisotopeAbundance = null;
    }
    if (world.planet.radioisotopeMode === undefined) world.planet.radioisotopeMode = "simple";
    if (world.planet.u238Abundance === undefined) world.planet.u238Abundance = null;
    if (world.planet.u235Abundance === undefined) world.planet.u235Abundance = null;
    if (world.planet.th232Abundance === undefined) world.planet.th232Abundance = null;
    if (world.planet.k40Abundance === undefined) world.planet.k40Abundance = null;
    Object.assign(world.planet, withCompositionInventoryDefaults(world.planet));
  }

  return world;
}

export function normalizeLegacyMoonInputs(world) {
  if (world.moons && world.moons.byId) {
    for (const moonId of Object.keys(world.moons.byId)) {
      const inputs = world.moons.byId[moonId]?.inputs;
      if (inputs) world.moons.byId[moonId].inputs = normalizeMoonInputs(inputs);
    }
  }
  if (world.moon) world.moon = normalizeMoonInputs(world.moon);
  return world;
}
