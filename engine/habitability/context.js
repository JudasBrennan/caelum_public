// SPDX-License-Identifier: MPL-2.0
// Shared habitability-context adapters.
//
// Stage 5 moves the metric layer onto a normalized nested schema so planets
// and moons can share one scoring core.

import { toFinite } from "../utils.js";
import { hydrosphereStateFromMoon, hydrosphereStateFromPlanet } from "./hydrosphere.js";
import { moonRadiationProfile } from "./radiation.js";
import { assertHabitabilityContext, normalizeHabitabilityContext } from "./schema.js";
import { resolveClimateStability } from "./stability.js";
import { computeXuvFluxRatio } from "../planet/atmosphere.js";

const LUNAR_RADIUS_IN_EARTHS = 1737.4 / 6371;
const EARTH_ESCAPE_VELOCITY_KMS = 11.186;

function planetBodyClassFor(massEarth, bodyClass) {
  if (String(bodyClass || "") === "Dwarf planet" || toFinite(massEarth, 0) < 0.01) {
    return "dwarf-planet";
  }
  return "rocky-planet";
}

function moonWaterVolatileEntry(volatileInventory = []) {
  const inventory = Array.isArray(volatileInventory) ? volatileInventory : [];
  return inventory.find((volatile) => {
    const species = String(volatile?.species || "");
    return species.includes("H") && species.includes("O");
  });
}

function normalizeAtmosphereComposition(raw = {}) {
  const composition = raw && typeof raw === "object" ? raw : {};
  return {
    o2: Math.max(toFinite(composition.o2, 0), 0),
    co2: Math.max(toFinite(composition.co2, 0), 0),
    ar: Math.max(toFinite(composition.ar, 0), 0),
    n2: Math.max(toFinite(composition.n2, 0), 0),
    h2o: Math.max(toFinite(composition.h2o, 0), 0),
    ch4: Math.max(toFinite(composition.ch4, 0), 0),
    h2: Math.max(toFinite(composition.h2, 0), 0),
    he: Math.max(toFinite(composition.he, 0), 0),
    so2: Math.max(toFinite(composition.so2, 0), 0),
    nh3: Math.max(toFinite(composition.nh3, 0), 0),
  };
}

function deriveAlternativeSolventCandidate({ surfaceTempK, pressureAtm, atmosphereComposition }) {
  const composition = normalizeAtmosphereComposition(atmosphereComposition);
  const tempK = Math.max(toFinite(surfaceTempK, 0), 0);
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);

  if (pressure >= 0.05 && tempK >= 70 && tempK <= 115 && composition.ch4 >= 0.01) {
    return "methane-lakes";
  }
  if (pressure >= 0.05 && tempK >= 150 && tempK <= 240 && composition.nh3 >= 0.002) {
    return "ammonia-brines";
  }
  return "";
}

function planetAtmosphereComposition(model = {}) {
  const inputs = model.inputs || {};
  const derived = model.derived || {};
  const pressureAtm = Math.max(toFinite(inputs.pressureAtm, 0), 0);
  if (pressureAtm <= 0) {
    return normalizeAtmosphereComposition();
  }
  return normalizeAtmosphereComposition({
    o2: toFinite(derived.ppO2Atm, 0) / pressureAtm,
    co2: toFinite(derived.ppCO2Atm, 0) / pressureAtm,
    ar: toFinite(derived.ppArAtm, 0) / pressureAtm,
    n2: toFinite(derived.ppN2Atm, 0) / pressureAtm,
    h2o: toFinite(derived.ppH2OAtm, 0) / pressureAtm,
    ch4: toFinite(derived.ppCH4Atm, 0) / pressureAtm,
    h2: toFinite(derived.ppH2Atm, 0) / pressureAtm,
    he: toFinite(derived.ppHeAtm, 0) / pressureAtm,
    so2: toFinite(derived.ppSO2Atm, 0) / pressureAtm,
    nh3: toFinite(derived.ppNH3Atm, 0) / pressureAtm,
  });
}

function moonAtmosphereComposition(modelOrInventory = [], surfacePressurePa = 0) {
  const atmosphereComposition = normalizeAtmosphereComposition(
    modelOrInventory?.atmosphere?.composition || {},
  );
  const explicitTotal = Object.values(atmosphereComposition).reduce((sum, value) => sum + value, 0);
  if (explicitTotal > 0) return atmosphereComposition;

  const volatileInventory = Array.isArray(modelOrInventory)
    ? modelOrInventory
    : modelOrInventory?.volatiles?.inventory;
  const totalPressurePa = Math.max(toFinite(surfacePressurePa, 0), 0);
  if (totalPressurePa <= 0) return normalizeAtmosphereComposition();
  const composition = {};
  for (const entry of Array.isArray(volatileInventory) ? volatileInventory : []) {
    if (!entry?.retained || !entry?.pressurePa) continue;
    const share = Math.max(toFinite(entry.pressurePa, 0), 0) / totalPressurePa;
    if (entry.species === "N₂") composition.n2 = share;
    else if (entry.species === "CO₂") composition.co2 = share;
    else if (entry.species === "CH₄") composition.ch4 = share;
    else if (entry.species === "NH₃") composition.nh3 = share;
    else if (entry.species === "H₂O") composition.h2o = share;
  }
  return normalizeAtmosphereComposition(composition);
}

function derivePlanetSubsurfacePotential(model = {}, hydrosphere) {
  const inputs = model.inputs || {};
  const derived = model.derived || {};
  if (toFinite(hydrosphere?.permanentIceFraction, 0) <= 0) return false;
  return (
    toFinite(inputs.wmfPct, 0) >= 10 ||
    String(derived.waterRegime || "") === "Ice world" ||
    String(derived.waterRegime || "") === "Deep ocean"
  );
}

function deriveMoonSubsurfacePotential(model = {}, hydrosphere) {
  if (hydrosphere?.subsurfaceOceanPresent === true) return true;
  if (toFinite(hydrosphere?.subsurfaceOceanScore, 0) >= 0.45) return true;
  const water = moonWaterVolatileEntry(model?.volatiles?.inventory);
  if (!water?.present || toFinite(hydrosphere?.permanentIceFraction, 0) <= 0) return false;
  if (String(model?.inputs?.compositionOverride || "") === "Subsurface ocean") return true;
  return toFinite(model?.tides?.tidalHeatingEarth, 0) >= 1;
}

function deriveMoonBodyClass(model = {}, hydrosphere) {
  const water = moonWaterVolatileEntry(model?.volatiles?.inventory);
  const densityGcm3 = Math.max(toFinite(model.inputs?.densityGcm3, 0), 0);
  if (
    hydrosphere?.liquidOceanFraction > 0 ||
    hydrosphere?.permanentIceFraction > 0 ||
    water?.present
  ) {
    return "icy-moon";
  }
  return densityGcm3 < 2.5 ? "icy-moon" : "rocky-moon";
}

function moonJeansEscapeSpeciesFromInventory(volatileInventory = []) {
  const mapping = {
    "N₂": "n2",
    N2: "n2",
    "CO₂": "co2",
    CO2: "co2",
    Ar: "ar",
    "O₂": "o2",
    O2: "o2",
  };
  const inventory = Array.isArray(volatileInventory) ? volatileInventory : [];
  return inventory.reduce((species, entry) => {
    const key = mapping[String(entry?.species || "")];
    if (!key) return species;
    species[key] = {
      status: entry?.status === "Thin atmosphere" ? "Retained" : "Lost",
    };
    return species;
  }, {});
}

function deriveMoonClimateState(hydrosphere) {
  if (toFinite(hydrosphere?.steamFraction, 0) > 0) {
    return { climateState: "Runaway greenhouse", climateLivabilityFraction: 0 };
  }
  if (
    toFinite(hydrosphere?.permanentIceFraction, 0) > 0 &&
    toFinite(hydrosphere?.surfaceAccessibleLiquidFraction, 0) <= 0
  ) {
    return { climateState: "Snowball", climateLivabilityFraction: 0 };
  }
  return { climateState: "Stable", climateLivabilityFraction: 1 };
}

export function buildPlanetHabitabilityContext(model = {}) {
  const inputs = model.inputs || {};
  const derived = model.derived || {};
  const hydrosphere =
    derived.hydrosphere && typeof derived.hydrosphere === "object"
      ? derived.hydrosphere
      : hydrosphereStateFromPlanet({
          waterRegime: derived.waterRegime,
          wmfPct: inputs.wmfPct,
          massEarth: inputs.massEarth,
          radiusKm: derived.radiusKm,
          surfaceTempK: derived.surfaceTempK,
          pressureAtm: inputs.pressureAtm,
          climateState: derived.climateState,
        });
  const oceanFraction = toFinite(
    hydrosphere.liquidOceanFraction,
    toFinite(derived.liquidOceanFraction, 0),
  );
  const landFraction = toFinite(hydrosphere.landFraction, toFinite(derived.landFraction, 1));
  const atmosphereComposition = planetAtmosphereComposition(model);
  const alternativeSolventCandidate = deriveAlternativeSolventCandidate({
    surfaceTempK: derived.surfaceTempK,
    pressureAtm: inputs.pressureAtm,
    atmosphereComposition,
  });
  const context = normalizeHabitabilityContext({
    version: "context-v2",
    bodyType: "planet",
    bodyClass: planetBodyClassFor(inputs.massEarth, derived.bodyClass),
    bulk: {
      radiusEarth: toFinite(derived.radiusEarth, 0),
      densityGcm3: toFinite(derived.densityGcm3, 0),
      escapeVelocityVEarth: toFinite(derived.escapeVelocityVEarth, 0),
      gravityG: toFinite(derived.gravityG, 0),
    },
    surface: {
      surfaceTempK: toFinite(derived.surfaceTempK, 0),
      pressureAtm: toFinite(inputs.pressureAtm, 0),
      landFraction,
      liquidOceanFraction: oceanFraction,
      permanentIceFraction: toFinite(
        hydrosphere.permanentIceFraction,
        toFinite(derived.permanentIceFraction, 0),
      ),
      steamFraction: toFinite(hydrosphere.steamFraction, toFinite(derived.steamFraction, 0)),
      surfaceAccessibleLiquidFraction: toFinite(
        hydrosphere.surfaceAccessibleLiquidFraction,
        toFinite(derived.surfaceAccessibleLiquidFraction, 0),
      ),
      subsurfaceOceanPotential: derivePlanetSubsurfacePotential(model, hydrosphere),
      alternativeSolventCandidate,
    },
    energy: {
      insolationEarth: toFinite(derived.insolationEarth, 0),
      tidalHeatingEarth: toFinite(derived.planetTidalHeatingEarth, 0),
      radiogenicHeatingEarth: 0,
      xuvFluxRatio: toFinite(derived.jeansEscape?.xuvFluxRatio, 0),
    },
    chemistry: {
      surfaceFieldEarths: toFinite(derived.surfaceFieldEarths, 0),
      jeansEscapeSpecies: derived.jeansEscape?.species || {},
      atmosphereComposition,
      volatileInventory: [],
      mantleOxidationKey: String(inputs.mantleOxidation || derived.mantleOxidationKey || "earth"),
      primaryOutgassedSpecies: String(derived.primaryOutgassedSpecies || ""),
    },
    climate: {
      climateState: String(derived.climateState || "Stable"),
      climateLivabilityFraction: toFinite(derived.climateLivabilityFraction, 1),
      climateLivabilityScore: toFinite(derived.climateLivabilityScore, 1),
      climateStatePenalty: toFinite(derived.climateStatePenalty, 1),
      collapsePenalty: toFinite(derived.collapsePenalty, 1),
      stabilityMultiplier: toFinite(derived.stabilityMultiplier, 1),
    },
    environment: {
      magnetosphericRadRemDay: 0,
      radiationPenalty: 1,
      stellarAgeGyr: toFinite(model.star?.inputs?.ageGyr ?? model.star?.ageGyr, 0),
      tidallyLockedToPrimary: false,
      tidallyLockedToStar: derived.tidallyLockedToStar === true,
      insideMagnetosphere: false,
    },
    provenance: {
      hydrosphereModelVersion: String(hydrosphere.modelVersion || "heuristic-v1"),
      habitabilityModelVersion: String(derived.habitabilityModelVersion || "phi-unified-v1"),
    },
  });
  return assertHabitabilityContext(context);
}

export function buildMoonHabitabilityContext(model = {}) {
  const inputs = model.inputs || {};
  const physical = model.physical || {};
  const temperature = model.temperature || {};
  const volatiles = model.volatiles || {};
  const atmosphere = model.atmosphere || {};
  const radiation = model.radiation || {};
  const tides = model.tides || {};
  const hydrosphere =
    model.habitability?.hydrosphere && typeof model.habitability.hydrosphere === "object"
      ? model.habitability.hydrosphere
      : hydrosphereStateFromMoon({
          volatileInventory: volatiles.inventory,
          surfaceTempK: temperature.surfaceK,
          surfacePressurePa: volatiles.surfacePressurePa,
          tidalHeatingEarth: tides.tidalHeatingEarth,
          gravityG: physical.gravityG,
          densityGcm3: inputs.densityGcm3,
          massMoon: inputs.massMoon,
          radiusMoon: physical.radiusMoon,
          compositionClass: tides.compositionClass,
          compositionOverride: inputs.compositionOverride,
        });
  const climateSeed = deriveMoonClimateState(hydrosphere);
  const explicitClimate = model.climate && typeof model.climate === "object" ? model.climate : null;
  const climate = explicitClimate
    ? {
        climateState: String(explicitClimate.climateState || climateSeed.climateState),
        climateLivabilityFraction: toFinite(
          explicitClimate.climateLivabilityFraction,
          climateSeed.climateLivabilityFraction,
        ),
        climateLivabilityScore: toFinite(
          explicitClimate.climateLivabilityScore,
          climateSeed.climateLivabilityFraction,
        ),
        climateStatePenalty: toFinite(explicitClimate.climateStatePenalty, 1),
        collapsePenalty: toFinite(explicitClimate.collapsePenalty, 1),
        stabilityMultiplier: toFinite(explicitClimate.stabilityMultiplier, 1),
      }
    : resolveClimateStability({
        climateState: climateSeed.climateState,
        climateLivabilityFraction: climateSeed.climateLivabilityFraction,
        collapsePenalty: 1,
      });
  const radiationProfile =
    model.habitability?.radiation && typeof model.habitability.radiation === "object"
      ? model.habitability.radiation
      : moonRadiationProfile({
          magnetosphericRadRemDay: radiation.magnetosphericRadRemDay,
        });
  const planetSemiMajorAxisAu = Math.max(toFinite(model.planet?.semiMajorAxisAu, 0), 0);
  const starLuminosityLsol = Math.max(toFinite(model.star?.luminosityLsol, 0), 0);
  const surfacePressurePa = Math.max(
    toFinite(atmosphere.surfacePressurePa, toFinite(volatiles.surfacePressurePa, 0)),
    0,
  );
  const atmosphereComposition = moonAtmosphereComposition(model, surfacePressurePa);
  const alternativeSolventCandidate = deriveAlternativeSolventCandidate({
    surfaceTempK: temperature.surfaceK,
    pressureAtm: surfacePressurePa / 101325,
    atmosphereComposition,
  });

  const context = normalizeHabitabilityContext({
    version: "context-v2",
    bodyType: "moon",
    bodyClass: deriveMoonBodyClass(model, hydrosphere),
    bulk: {
      radiusEarth: toFinite(physical.radiusMoon, 0) * LUNAR_RADIUS_IN_EARTHS,
      densityGcm3: toFinite(inputs.densityGcm3, 0),
      escapeVelocityVEarth: toFinite(physical.escapeVelocityKmS, 0) / EARTH_ESCAPE_VELOCITY_KMS,
      gravityG: toFinite(physical.gravityG, 0),
    },
    surface: {
      surfaceTempK: toFinite(temperature.surfaceK, 0),
      pressureAtm: surfacePressurePa / 101325,
      landFraction: hydrosphere.landFraction,
      liquidOceanFraction: hydrosphere.liquidOceanFraction,
      permanentIceFraction: hydrosphere.permanentIceFraction,
      steamFraction: hydrosphere.steamFraction,
      surfaceAccessibleLiquidFraction: hydrosphere.surfaceAccessibleLiquidFraction,
      subsurfaceOceanPotential: deriveMoonSubsurfacePotential(model, hydrosphere),
      alternativeSolventCandidate,
    },
    energy: {
      insolationEarth:
        planetSemiMajorAxisAu > 0 ? starLuminosityLsol / planetSemiMajorAxisAu ** 2 : 0,
      tidalHeatingEarth: toFinite(tides.tidalHeatingEarth, 0),
      radiogenicHeatingEarth: 0,
      xuvFluxRatio: computeXuvFluxRatio(
        starLuminosityLsol,
        toFinite(model.star?.ageGyr, 0),
        planetSemiMajorAxisAu,
      ),
    },
    chemistry: {
      surfaceFieldEarths: 0,
      jeansEscapeSpecies: moonJeansEscapeSpeciesFromInventory(volatiles.inventory),
      atmosphereComposition,
      volatileInventory: Array.isArray(volatiles.inventory) ? volatiles.inventory : [],
      mantleOxidationKey:
        deriveMoonBodyClass(model, hydrosphere) === "icy-moon" ? "reduced" : "earth",
      primaryOutgassedSpecies: String(
        atmosphere.dominantSpecies || volatiles.primaryAtmosphere || "",
      ),
    },
    climate: {
      climateState: climate.climateState || climateSeed.climateState,
      climateLivabilityFraction: climate.climateLivabilityFraction,
      climateLivabilityScore: climate.climateLivabilityScore,
      climateStatePenalty: climate.climateStatePenalty,
      collapsePenalty: climate.collapsePenalty,
      stabilityMultiplier: climate.stabilityMultiplier,
    },
    environment: {
      magnetosphericRadRemDay: toFinite(radiation.magnetosphericRadRemDay, 0),
      radiationPenalty: toFinite(radiationProfile.radiationPenalty, 1),
      stellarAgeGyr: toFinite(model.star?.ageGyr, 0),
      tidallyLockedToPrimary: tides.moonLockedToPlanet === "Yes",
      tidallyLockedToStar: false,
      insideMagnetosphere: radiation.insideMagnetosphere === true,
    },
    provenance: {
      hydrosphereModelVersion: String(hydrosphere.modelVersion || "moon-heuristic-v1"),
      habitabilityModelVersion: String(model.habitability?.habitabilityModelVersion || ""),
    },
  });
  return assertHabitabilityContext(context);
}
