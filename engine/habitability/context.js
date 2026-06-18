// Shared habitability-context adapters.
//
// Stage 5 moves the metric layer onto a normalized nested schema so planets
// and moons can share one scoring core.

import { clamp, toFinite } from "../utils.js";
import { hydrosphereStateFromMoon, hydrosphereStateFromPlanet } from "./hydrosphere.js";
import { moonRadiationProfile } from "./radiation.js";
import { assertHabitabilityContext, normalizeHabitabilityContext } from "./schema.js";
import { resolveClimateStability } from "./stability.js";
import { computeXuvFluxRatio } from "../planet/atmosphere.js";
import { EARTH_INTERNAL_HEAT_FLUX_WM2 } from "./constants.js";
import { inventoryRetainedSpeciesMap, normalizeHabitabilityInventory } from "./species.js";

const LUNAR_RADIUS_IN_EARTHS = 1737.4 / 6371;
const EARTH_ESCAPE_VELOCITY_KMS = 11.186;

function planetBodyClassFor(massEarth, bodyClass) {
  if (String(bodyClass || "") === "Dwarf planet" || toFinite(massEarth, 0) < 0.01) {
    return "dwarf-planet";
  }
  return "rocky-planet";
}

function moonWaterVolatileEntry(volatileInventory = []) {
  return normalizeHabitabilityInventory(volatileInventory).find(
    (volatile) => volatile?.canonicalSpecies === "h2o",
  );
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
    co: Math.max(toFinite(composition.co, 0), 0),
  };
}

function pressureWindowScore(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0) return 0;
  return clamp(1 - Math.abs(Math.log10(Math.max(pressure, 0.01))) / 2.2, 0, 1);
}

function computeInternalHeatSupport(tidalHeatingEarth, radiogenicHeatingEarth) {
  return clamp(
    Math.log10(
      1 +
        Math.max(toFinite(tidalHeatingEarth, 0), 0) +
        Math.max(toFinite(radiogenicHeatingEarth, 0), 0),
    ) / 1.8,
    0,
    1,
  );
}

function computeStellarHeatSupport(insolationEarth) {
  const insolation = Math.max(toFinite(insolationEarth, 0), 1e-6);
  return clamp(1 - Math.abs(Math.log2(insolation)) / 2, 0, 1);
}

function surfaceRadiationShieldingFactor({
  pressureAtm,
  surfaceFieldEarths,
  intrinsicFieldKnown = true,
  magnetosphereRadiationShieldingFactor = null,
}) {
  const pressureShield = pressureWindowScore(pressureAtm);
  if (intrinsicFieldKnown === false) return pressureShield;
  const explicitMagnetosphereShield = Number(magnetosphereRadiationShieldingFactor);
  const fieldShield = Number.isFinite(explicitMagnetosphereShield)
    ? clamp(explicitMagnetosphereShield, 0, 1)
    : clamp(Math.max(toFinite(surfaceFieldEarths, 0), 0) / 0.3, 0, 1);
  return clamp(0.65 * pressureShield + 0.35 * fieldShield, 0, 1);
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

  const volatileInventory = normalizeHabitabilityInventory(
    Array.isArray(modelOrInventory) ? modelOrInventory : modelOrInventory?.volatiles?.inventory,
  );
  const totalPressurePa = Math.max(toFinite(surfacePressurePa, 0), 0);
  if (totalPressurePa <= 0) return normalizeAtmosphereComposition();
  const composition = {};
  for (const entry of volatileInventory) {
    if (!entry?.retained || !entry?.pressurePa) continue;
    const share = Math.max(toFinite(entry.pressurePa, 0), 0) / totalPressurePa;
    if (entry.canonicalSpecies === "n2") composition.n2 = share;
    else if (entry.canonicalSpecies === "co2") composition.co2 = share;
    else if (entry.canonicalSpecies === "ch4") composition.ch4 = share;
    else if (entry.canonicalSpecies === "nh3") composition.nh3 = share;
    else if (entry.canonicalSpecies === "h2o") composition.h2o = share;
    else if (entry.canonicalSpecies === "co") composition.co = share;
    else if (entry.canonicalSpecies === "so2") composition.so2 = share;
    else if (entry.canonicalSpecies === "o2") composition.o2 = share;
    else if (entry.canonicalSpecies === "ar") composition.ar = share;
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
  return inventoryRetainedSpeciesMap(volatileInventory);
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
          gravityG: derived.gravityG,
          surfaceTempK: derived.surfaceTempK,
          pressureAtm: inputs.pressureAtm,
          climateState: derived.climateState,
          geothermalFluxWm2: derived.radiogenicHeatingWm2,
          tidalHeatFluxWm2: derived.planetTidalHeatingWm2,
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
  const radiogenicHeatingEarth = Math.max(toFinite(derived.radiogenicHeatingEarth, 0), 0);
  const atmosphereLedger =
    derived.atmosphereLedger && typeof derived.atmosphereLedger === "object"
      ? derived.atmosphereLedger
      : {};
  const climateChemistryForcing =
    derived.climateChemistryForcing && typeof derived.climateChemistryForcing === "object"
      ? derived.climateChemistryForcing
      : {};
  const carbonCycleContext =
    derived.carbonCycleContext && typeof derived.carbonCycleContext === "object"
      ? derived.carbonCycleContext
      : {};
  const oceanChemistryContext =
    derived.oceanChemistryContext && typeof derived.oceanChemistryContext === "object"
      ? derived.oceanChemistryContext
      : {};
  const biosignatureContext =
    derived.biosignatureContext && typeof derived.biosignatureContext === "object"
      ? derived.biosignatureContext
      : {};
  const cloudCirculation =
    derived.cloudCirculation && typeof derived.cloudCirculation === "object"
      ? derived.cloudCirculation
      : {};
  const internalHeatSupport = computeInternalHeatSupport(
    derived.planetTidalHeatingEarth,
    radiogenicHeatingEarth,
  );
  const stellarHeatSupport = computeStellarHeatSupport(derived.insolationEarth);
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
      waterCoverageFraction: toFinite(hydrosphere.liquidOceanFraction, 0),
      iceShellThicknessKm: 0,
      subsurfaceOceanDepthKm: 0,
      highPressureIceBarrier: false,
      subsurfaceOceanScore: 0,
      subsurfaceOceanPotential: derivePlanetSubsurfacePotential(model, hydrosphere),
      alternativeSolventCandidate,
    },
    energy: {
      insolationEarth: toFinite(derived.insolationEarth, 0),
      tidalHeatingEarth: toFinite(derived.planetTidalHeatingEarth, 0),
      radiogenicHeatingEarth,
      xuvFluxRatio: toFinite(derived.jeansEscape?.xuvFluxRatio, 0),
      internalHeatSupport,
      stellarHeatSupport,
    },
    chemistry: {
      surfaceFieldEarths: toFinite(derived.surfaceFieldEarths, 0),
      intrinsicFieldKnown: true,
      jeansEscapeSpecies: derived.jeansEscape?.species || {},
      atmosphereComposition,
      volatileInventory: [],
      mantleOxidationKey: String(inputs.mantleOxidation || derived.mantleOxidationKey || "earth"),
      primaryOutgassedSpecies: String(derived.primaryOutgassedSpecies || ""),
      ozoneColumnDobsonUnits: derived.photochemistry?.ozoneColumnDobsonUnits,
      ozoneEarthRatio: derived.photochemistry?.ozoneEarthRatio,
      uvShieldingScore: derived.photochemistry?.uvShieldingScore,
      uvShieldingClass: String(derived.photochemistry?.uvShieldingClass || ""),
      prebioticUvWindowClass: String(derived.photochemistry?.prebioticUv?.class || ""),
      prebioticUvSurfaceFluxErgCm2S: derived.photochemistry?.prebioticUv?.surfaceFluxErgCm2S,
      prebioticUvTopOfAtmosphereFluxErgCm2S:
        derived.photochemistry?.prebioticUv?.topOfAtmosphereFluxErgCm2S,
      photochemicalHazeClass: String(derived.photochemistry?.haze?.hazeClass || ""),
      hazeLikelihoodScore: derived.photochemistry?.haze?.likelihoodScore,
      hazeAntiGreenhouseCoolingK: derived.photochemistry?.haze?.antiGreenhouseCoolingK,
      hazeSurfaceLightReductionFraction:
        derived.photochemistry?.haze?.surfaceLightReductionFraction,
      photochemicalWarningCodes: Array.isArray(derived.photochemistry?.warningCodes)
        ? derived.photochemistry.warningCodes
        : [],
    },
    climate: {
      climateState: String(derived.climateState || "Stable"),
      climateLivabilityFraction: toFinite(derived.climateLivabilityFraction, 1),
      climateLivabilityScore: toFinite(derived.climateLivabilityScore, 1),
      climateStatePenalty: toFinite(derived.climateStatePenalty, 1),
      collapsePenalty: toFinite(derived.collapsePenalty, 1),
      stabilityMultiplier: toFinite(derived.stabilityMultiplier, 1),
      coupledSurfaceTempK: climateChemistryForcing.coupledSurfaceTempK,
      climateChemistryNetDeltaK: climateChemistryForcing.netDeltaK,
      coupledClimateTendency: climateChemistryForcing.labelOnlyClimateState,
      optInClimateState: climateChemistryForcing.optInClimateState,
      climateChemistryConfidence: climateChemistryForcing.confidence,
    },
    environment: {
      magnetosphericRadRemDay: 0,
      radiationPenalty: 1,
      surfaceRadiationShieldingFactor: surfaceRadiationShieldingFactor({
        pressureAtm: inputs.pressureAtm,
        surfaceFieldEarths: derived.surfaceFieldEarths,
        intrinsicFieldKnown: true,
        magnetosphereRadiationShieldingFactor:
          derived.magnetosphereEnvironment?.radiationShieldingFactor,
      }),
      atmosphereTrendClass: atmosphereLedger.trendClass,
      atmosphereTimescaleClass: atmosphereLedger.timescaleClass,
      atmosphereSourceIndex: atmosphereLedger.sourceIndex,
      atmosphereSinkIndex: atmosphereLedger.sinkIndex,
      atmosphereNetBalance: atmosphereLedger.netBalance,
      atmosphereDominantSource: atmosphereLedger.dominantSource?.id,
      atmosphereDominantSink: atmosphereLedger.dominantSink?.id,
      atmosphereLedgerConfidence: atmosphereLedger.confidence,
      carbonCycleTendency: carbonCycleContext.tendencyClass,
      carbonCycleConfidence: carbonCycleContext.confidence,
      carbonCycleStabilityModifier:
        carbonCycleContext.confidence === "high" ? carbonCycleContext.stabilityModifier : NaN,
      carbonCycleThermostatStrength: carbonCycleContext.thermostatStrength,
      oceanChemistryConfidence: oceanChemistryContext.confidence,
      oceanChemistryWaterContext: oceanChemistryContext.waterContext,
      oceanChemistryAcidityClass: oceanChemistryContext.acidityClass,
      carbonateSaturationClass: oceanChemistryContext.carbonateSaturationClass,
      nutrientSupportClass: oceanChemistryContext.nutrientSupportClass,
      biosignatureInterpretationClass: biosignatureContext.interpretationClass,
      biosignatureConfidence: biosignatureContext.confidence,
      biosignatureDisequilibriumStrength: biosignatureContext.disequilibriumStrength,
      o2O3FalsePositiveRisk: biosignatureContext.o2O3FalsePositiveRisk,
      methaneContext: biosignatureContext.methaneContext,
      coBuildupRisk: biosignatureContext.coBuildupRisk,
      cloudHeatRedistributionEfficiency: cloudCirculation.heatRedistributionEfficiency,
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
          surfaceExposureRemDayEquivalent: radiation.surfaceExposureRemDayEquivalent,
          subsurfaceExposureRemDayEquivalent: radiation.subsurfaceExposureRemDayEquivalent,
          surfaceClass: radiation.surfaceClass,
          subsurfaceClass: radiation.subsurfaceClass,
          atmosphereShielding: radiation.atmosphereShielding,
          intrinsicFieldShielding: radiation.intrinsicFieldShielding,
          inducedFieldShielding: radiation.inducedFieldShielding,
          magneticShielding: radiation.magneticShielding,
          combinedShielding: radiation.combinedShielding,
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
  const radiogenicHeatingEarth =
    Math.max(toFinite(temperature.radiogenicWm2, 0), 0) / EARTH_INTERNAL_HEAT_FLUX_WM2;
  const surfaceExomoonCalibration = model.habitability?.summary?.surfaceExomoonCalibration || {};
  const moonIntrinsicField = Math.max(toFinite(model.physical?.surfaceFieldEarths, 0), 0);
  const intrinsicFieldKnown = Number.isFinite(model?.physical?.surfaceFieldEarths);
  const atmosphereLedger =
    atmosphere.ledger && typeof atmosphere.ledger === "object" ? atmosphere.ledger : {};
  const climateChemistryForcing =
    model.climateChemistryForcing && typeof model.climateChemistryForcing === "object"
      ? model.climateChemistryForcing
      : model.derived?.climateChemistryForcing &&
          typeof model.derived.climateChemistryForcing === "object"
        ? model.derived.climateChemistryForcing
        : {};
  const dynamicalPersistence =
    model.dynamical && typeof model.dynamical === "object"
      ? model.dynamical
      : model.habitability?.dynamicalPersistence &&
          typeof model.habitability.dynamicalPersistence === "object"
        ? model.habitability.dynamicalPersistence
        : model.dynamicalContext?.habitabilityBridge &&
            typeof model.dynamicalContext.habitabilityBridge === "object"
          ? model.dynamicalContext.habitabilityBridge
          : {};
  const carbonCycleContext =
    model.carbonCycleContext && typeof model.carbonCycleContext === "object"
      ? model.carbonCycleContext
      : model.derived?.carbonCycleContext && typeof model.derived.carbonCycleContext === "object"
        ? model.derived.carbonCycleContext
        : {};
  const oceanChemistryContext =
    model.oceanChemistryContext && typeof model.oceanChemistryContext === "object"
      ? model.oceanChemistryContext
      : model.derived?.oceanChemistryContext &&
          typeof model.derived.oceanChemistryContext === "object"
        ? model.derived.oceanChemistryContext
        : {};
  const biosignatureContext =
    model.biosignatureContext && typeof model.biosignatureContext === "object"
      ? model.biosignatureContext
      : model.derived?.biosignatureContext && typeof model.derived.biosignatureContext === "object"
        ? model.derived.biosignatureContext
        : {};
  const cloudCirculation =
    model.cloudCirculation && typeof model.cloudCirculation === "object"
      ? model.cloudCirculation
      : model.derived?.cloudCirculation && typeof model.derived.cloudCirculation === "object"
        ? model.derived.cloudCirculation
        : {};
  const insolationEarth =
    planetSemiMajorAxisAu > 0 ? starLuminosityLsol / planetSemiMajorAxisAu ** 2 : 0;
  const internalHeatSupport = computeInternalHeatSupport(
    tides.tidalHeatingEarth,
    radiogenicHeatingEarth,
  );
  const stellarHeatSupport = computeStellarHeatSupport(insolationEarth);

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
      waterCoverageFraction: toFinite(
        hydrosphere.waterCoverageFraction,
        hydrosphere.liquidOceanFraction + hydrosphere.permanentIceFraction,
      ),
      iceShellThicknessKm: toFinite(hydrosphere.estimatedIceShellThicknessKm, 0),
      subsurfaceOceanDepthKm: toFinite(hydrosphere.estimatedSubsurfaceOceanDepthKm, 0),
      highPressureIceBarrier: hydrosphere.highPressureIceBarrier === true,
      subsurfaceOceanScore: toFinite(hydrosphere.subsurfaceOceanScore, 0),
      subsurfaceOceanPotential: deriveMoonSubsurfacePotential(model, hydrosphere),
      alternativeSolventCandidate,
    },
    energy: {
      insolationEarth,
      tidalHeatingEarth: toFinite(tides.tidalHeatingEarth, 0),
      radiogenicHeatingEarth,
      xuvFluxRatio: computeXuvFluxRatio(
        toFinite(model.star?.massMsol, 1),
        starLuminosityLsol,
        toFinite(model.star?.ageGyr, 0),
        planetSemiMajorAxisAu,
      ),
      internalHeatSupport,
      stellarHeatSupport,
    },
    chemistry: {
      surfaceFieldEarths: intrinsicFieldKnown ? moonIntrinsicField : 0,
      intrinsicFieldKnown,
      jeansEscapeSpecies: moonJeansEscapeSpeciesFromInventory(volatiles.inventory),
      atmosphereComposition,
      volatileInventory: normalizeHabitabilityInventory(volatiles.inventory),
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
      coupledSurfaceTempK: climateChemistryForcing.coupledSurfaceTempK,
      climateChemistryNetDeltaK: climateChemistryForcing.netDeltaK,
      coupledClimateTendency: climateChemistryForcing.labelOnlyClimateState,
      optInClimateState: climateChemistryForcing.optInClimateState,
      climateChemistryConfidence: climateChemistryForcing.confidence,
    },
    environment: {
      magnetosphericRadRemDay: toFinite(radiation.magnetosphericRadRemDay, 0),
      radiationPenalty: toFinite(radiationProfile.radiationPenalty, 1),
      surfaceExposureRemDayEquivalent: toFinite(
        radiation.surfaceExposureRemDayEquivalent,
        toFinite(radiationProfile.surfaceExposureRemDayEquivalent, 0),
      ),
      subsurfaceExposureRemDayEquivalent: toFinite(
        radiation.subsurfaceExposureRemDayEquivalent,
        toFinite(radiationProfile.subsurfaceExposureRemDayEquivalent, 0),
      ),
      surfaceRadiationPenalty: toFinite(radiationProfile.surfaceRadiationPenalty, NaN),
      subsurfaceRadiationPenalty: toFinite(radiationProfile.subsurfaceRadiationPenalty, NaN),
      atmosphereShielding: toFinite(
        radiation.atmosphereShielding,
        toFinite(radiationProfile.atmosphereShielding, NaN),
      ),
      intrinsicFieldShielding: toFinite(
        radiation.intrinsicFieldShielding,
        toFinite(radiationProfile.intrinsicFieldShielding, NaN),
      ),
      inducedFieldShielding: toFinite(
        radiation.inducedFieldShielding,
        toFinite(radiationProfile.inducedFieldShielding, NaN),
      ),
      magneticShielding: toFinite(
        radiation.magneticShielding,
        toFinite(radiationProfile.magneticShielding, NaN),
      ),
      combinedShielding: toFinite(
        radiation.combinedShielding,
        toFinite(radiationProfile.combinedShielding, NaN),
      ),
      surfaceRadiationClass: String(radiation.surfaceClass || radiationProfile.surfaceClass || ""),
      subsurfaceRadiationClass: String(
        radiation.subsurfaceClass || radiationProfile.subsurfaceClass || "",
      ),
      surfaceRadiationShieldingFactor: surfaceRadiationShieldingFactor({
        pressureAtm: surfacePressurePa / 101325,
        surfaceFieldEarths: intrinsicFieldKnown ? moonIntrinsicField : 0,
        intrinsicFieldKnown,
      }),
      atmosphereTrendClass: atmosphereLedger.trendClass,
      atmosphereTimescaleClass: atmosphereLedger.timescaleClass,
      atmosphereSourceIndex: atmosphereLedger.sourceIndex,
      atmosphereSinkIndex: atmosphereLedger.sinkIndex,
      atmosphereNetBalance: atmosphereLedger.netBalance,
      atmosphereDominantSource: atmosphereLedger.dominantSource?.id,
      atmosphereDominantSink: atmosphereLedger.dominantSink?.id,
      atmosphereLedgerConfidence: atmosphereLedger.confidence,
      carbonCycleTendency: carbonCycleContext.tendencyClass,
      carbonCycleConfidence: carbonCycleContext.confidence,
      carbonCycleStabilityModifier:
        carbonCycleContext.confidence === "high" ? carbonCycleContext.stabilityModifier : NaN,
      carbonCycleThermostatStrength: carbonCycleContext.thermostatStrength,
      oceanChemistryConfidence: oceanChemistryContext.confidence,
      oceanChemistryWaterContext: oceanChemistryContext.waterContext,
      oceanChemistryAcidityClass: oceanChemistryContext.acidityClass,
      carbonateSaturationClass: oceanChemistryContext.carbonateSaturationClass,
      nutrientSupportClass: oceanChemistryContext.nutrientSupportClass,
      biosignatureInterpretationClass: biosignatureContext.interpretationClass,
      biosignatureConfidence: biosignatureContext.confidence,
      biosignatureDisequilibriumStrength: biosignatureContext.disequilibriumStrength,
      o2O3FalsePositiveRisk: biosignatureContext.o2O3FalsePositiveRisk,
      methaneContext: biosignatureContext.methaneContext,
      coBuildupRisk: biosignatureContext.coBuildupRisk,
      cloudHeatRedistributionEfficiency: cloudCirculation.heatRedistributionEfficiency,
      surfaceExomoonCalibrationPenalty: surfaceExomoonCalibration.penalty,
      surfaceExomoonCalibrationApplicable: surfaceExomoonCalibration.applicable === true,
      surfaceExomoonCalibrationPass: surfaceExomoonCalibration.overallPass !== false,
      stellarAgeGyr: toFinite(model.star?.ageGyr, 0),
      tidallyLockedToPrimary: tides.moonLockedToPlanet === "Yes",
      tidallyLockedToStar: false,
      insideMagnetosphere: radiation.insideMagnetosphere === true,
    },
    dynamical: dynamicalPersistence,
    provenance: {
      hydrosphereModelVersion: String(hydrosphere.modelVersion || "moon-heuristic-v1"),
      habitabilityModelVersion: String(model.habitability?.habitabilityModelVersion || ""),
    },
  });
  return assertHabitabilityContext(context);
}
