import { LOCAL_CLUSTER_DEFAULTS, normalizeLocalClusterInputs } from "../../engine/localCluster.js";
import { normalizeRingMode } from "../../engine/planetaryRings.js";
import { normalizeRingStyleId } from "../ringAppearanceProfiles.js";
import { getComets } from "./cometModel.js";
import { sanitizeImportedValue } from "./importValidation.js";
import { normalizeOortCloudConfig } from "./oortCloudModel.js";
import { normalizeGasGiant } from "./gasGiantModel.js";
import {
  syncLegacyPlanetCollections,
  syncMoonParentAliases,
  syncUnifiedPlanetaryBodies,
} from "./compat/planetaryBodyCompatibility.js";
import {
  applyCompatibilityStarShape,
  ensureLegacyMoonCollection,
  ensureLegacyPlanetCollection,
  migrateLegacyOutermostGasGiant,
  normalizeLegacyMoonInputs,
  normalizeLegacyPlanetInputs,
} from "./compat/worldShapeMigrationHelpers.js";
import { PLANETARY_BODY_STORAGE_VERSION } from "./planetaryBodyModel.js";
import {
  canonicalizeSystemFeatures,
  makeCollection,
  normalizeClusterSystemNames,
} from "./systemCollections.js";
import { SCHEMA_VERSION, mergeWorldForMigration } from "./worldSchema.js";

export function migrateWorld(world) {
  if (!world.version) world.version = 1;
  const incomingVersion = Number(world.version) || 1;
  const hasIncomingCanonicalPlanetaryBodies =
    !!world.planetaryBodies &&
    typeof world.planetaryBodies === "object" &&
    !Array.isArray(world.planetaryBodies) &&
    Number(world.planetaryBodies.schemaVersion) >= PLANETARY_BODY_STORAGE_VERSION &&
    Array.isArray(world.planetaryBodies.order) &&
    world.planetaryBodies.order.length > 0;

  const defaultHostFrameId = applyCompatibilityStarShape(world);

  world.cluster = normalizeLocalClusterInputs(world.cluster || LOCAL_CLUSTER_DEFAULTS);
  world.clusterSystemNames = normalizeClusterSystemNames(world.clusterSystemNames);

  ensureLegacyPlanetCollection(world, defaultHostFrameId);

  if (hasIncomingCanonicalPlanetaryBodies && incomingVersion >= SCHEMA_VERSION) {
    syncLegacyPlanetCollections(world);
  }

  ensureLegacyMoonCollection(world, defaultHostFrameId);
  migrateLegacyOutermostGasGiant(world, defaultHostFrameId);

  if (!world.selectedBodyType) world.selectedBodyType = "planet";
  if (world.system.gasGiants && world.system.gasGiants.selectedId === undefined) {
    world.system.gasGiants.selectedId = world.system.gasGiants.order?.[0] || null;
  }
  if (world.system?.gasGiants?.byId) {
    for (const gasGiantId of Object.keys(world.system.gasGiants.byId)) {
      const gasGiant = world.system.gasGiants.byId[gasGiantId];
      if (!gasGiant) continue;
      gasGiant.hostFrameId =
        String(gasGiant.hostFrameId ?? "").trim() || defaultHostFrameId || null;
    }
  }

  const prevSelectedCometId = String(world.system?.comets?.selectedId || "").trim() || null;
  const comets = getComets(world, { fallbackHostFrameId: defaultHostFrameId });
  world.system.comets = makeCollection(comets, "c");
  world.system.comets.selectedId =
    prevSelectedCometId && world.system.comets.byId[prevSelectedCometId]
      ? prevSelectedCometId
      : world.system.comets.order[0] || null;
  world.system.oortCloud = normalizeOortCloudConfig(world.system?.oortCloud);

  normalizeLegacyPlanetInputs(world);
  normalizeLegacyMoonInputs(world);

  if (!world.tectonics || typeof world.tectonics !== "object") {
    world.tectonics = {
      ridgeHeightM: 2600,
      mountainRanges: [
        {
          id: "mr1",
          type: "andean",
          label: "Range 1",
          widths: {},
          heights: {},
          slabAngleDeg: 45,
          convergenceMmYr: 50,
        },
      ],
      inactiveRanges: [],
      spreadingRateFraction: 0.5,
      isostasyMode: "off",
      margin: { shelfWidthKm: 80, shelfDepthM: 130, slopeAngleDeg: 3.5 },
      shieldVolcanoes: [],
      riftValleys: [],
    };
  }

  if (world.tectonics) {
    const tectonics = world.tectonics;
    if ("simulator" in tectonics) delete tectonics.simulator;
    if (tectonics.spreadingRateFraction == null) tectonics.spreadingRateFraction = 0.5;
    if (!tectonics.isostasyMode) tectonics.isostasyMode = "off";
    if (!tectonics.margin) {
      tectonics.margin = { shelfWidthKm: 80, shelfDepthM: 130, slopeAngleDeg: 3.5 };
    }
    if (!Array.isArray(tectonics.shieldVolcanoes)) tectonics.shieldVolcanoes = [];
    if (!Array.isArray(tectonics.riftValleys)) tectonics.riftValleys = [];
    if (Array.isArray(tectonics.mountainRanges)) {
      for (const mountainRange of tectonics.mountainRanges) {
        if (mountainRange.slabAngleDeg == null) mountainRange.slabAngleDeg = 45;
      }
    }
  }

  if (world.tectonics && Array.isArray(world.tectonics.mountainRanges)) {
    for (const mountainRange of world.tectonics.mountainRanges) {
      if (mountainRange.convergenceMmYr == null) mountainRange.convergenceMmYr = 50;
    }
  }

  if (!world.population || typeof world.population !== "object") {
    world.population = {
      techEra: "Medieval",
      initialPopulation: 1000,
      growthRate: null,
      timeElapsedYears: 500,
      continentCount: 6,
      regionCount: 10,
      zipfExponent: 1.0,
      oceanPctOverride: null,
      habitablePctOverride: null,
      productivePctOverride: null,
      cropPctOverride: null,
    };
  }

  if (!world.climate || typeof world.climate !== "object") {
    world.climate = { altitudeM: 0 };
  }

  if (!world.system.orbitMode) world.system.orbitMode = "guided";

  canonicalizeSystemFeatures(world, {
    normalizeGasGiant,
    fallbackHostFrameId: defaultHostFrameId,
  });

  if (world.system?.gasGiants?.byId) {
    for (const gasGiantId of Object.keys(world.system.gasGiants.byId)) {
      const gasGiant = world.system.gasGiants.byId[gasGiantId];
      if (!gasGiant) continue;
      gasGiant.ringMode = normalizeRingMode(gasGiant.ringMode);
      gasGiant.ringStyleId = normalizeRingStyleId(gasGiant.ringStyleId);
    }
  }

  if (hasIncomingCanonicalPlanetaryBodies && incomingVersion >= SCHEMA_VERSION) {
    syncLegacyPlanetCollections(world);
  } else {
    syncUnifiedPlanetaryBodies(world);
  }
  syncMoonParentAliases(world);

  const finalSelectedMoon = world.moons?.byId?.[world.moons?.selectedId];
  if (finalSelectedMoon?.inputs) {
    world.moon = {
      ...finalSelectedMoon.inputs,
      name: finalSelectedMoon.name || finalSelectedMoon.inputs.name,
    };
  }

  const finalSelectedPlanet = world.planets?.byId?.[world.planets?.selectedId];
  if (finalSelectedPlanet?.inputs) {
    world.planet = {
      ...finalSelectedPlanet.inputs,
      name: finalSelectedPlanet.name || finalSelectedPlanet.inputs.name,
    };
  }

  if (world.version !== SCHEMA_VERSION) world.version = SCHEMA_VERSION;

  return world;
}

export function normalizeWorld(worldLike) {
  const merged = mergeWorldForMigration(sanitizeImportedValue(worldLike));
  return migrateWorld(merged);
}
