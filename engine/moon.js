// SPDX-License-Identifier: MPL-2.0
import { clamp, fmt, toFinite } from "./utils.js";
import { computeMoonAtmosphere } from "./moon/atmosphere.js";
import { compositionFromClass, compositionFromDensity } from "./moon/composition.js";
import { computeMoonOrbit } from "./moon/orbit.js";
import {
  analyseMoonVolatiles,
  computeMagnetosphericRadiation,
  radiationLabel,
} from "./moon/retention.js";
import { computeMoonTemperature } from "./moon/temperature.js";
import { computeMoonTidalState, formatOrbitalFate, formatRecession } from "./moon/tides.js";
import { buildMoonHabitabilityContext } from "./habitability/context.js";
import { hydrosphereStateFromMoon } from "./habitability/hydrosphere.js";
import { moonRadiationProfile } from "./habitability/radiation.js";
import { computeMoonClimate } from "./moon/climate.js";
import { computeMoonIllumination } from "./moon/illumination.js";
import { computeMoonGeology } from "./moon/geology.js";
import { computeMoonBiosphere } from "./moon/biosphere.js";
import {
  computeEarthSimilarityIndex,
  computeMoonHabitabilityIndex,
} from "./habitability/metrics.js";
import { calcPlanetExact } from "./planet.js";
import { massToLuminosity, massToRadius } from "./star.js";

export { compositionFromDensity } from "./moon/composition.js";

function buildMoonSummaryResult({
  mStarMsol,
  rStarRsol,
  lStarLsol,
  ageGyr,
  mPlanetME,
  rhoPlanetGcm3,
  rPlanetRE,
  aPlanetAU,
  ePlanet,
  rotPlanetHours,
  mMoonMM,
  rhoMoonGcm3,
  albedo,
  aMoonKmInput,
  eMoon,
  inc,
  initialRotHours,
  compositionOverride,
  rMoonRM,
  gMoonG,
  vEscKmS,
  orbit,
  temperature,
  atmosphere,
  hydrosphere,
  climate,
  biosphere,
  unifiedMoonHabitability,
}) {
  return {
    star: { massMsol: mStarMsol, radiusRsol: rStarRsol, luminosityLsol: lStarLsol, ageGyr },
    planet: {
      massEarth: mPlanetME,
      densityGcm3: rhoPlanetGcm3,
      radiusEarth: rPlanetRE,
      semiMajorAxisAu: aPlanetAU,
      eccentricity: ePlanet,
      rotationPeriodHours: rotPlanetHours,
    },
    inputs: {
      massMoon: mMoonMM,
      densityGcm3: rhoMoonGcm3,
      albedo,
      semiMajorAxisKmInput: aMoonKmInput,
      semiMajorAxisKm: orbit.semiMajorAxisKm,
      eccentricity: eMoon,
      inclinationDeg: inc,
      initialRotationPeriodHours: initialRotHours,
      compositionOverride: compositionOverride || null,
    },
    physical: {
      radiusMoon: rMoonRM,
      gravityG: gMoonG,
      escapeVelocityKmS: vEscKmS,
    },
    orbit: {
      moonZoneInnerKm: orbit.zoneInnerKm,
      moonZoneOuterKm: orbit.zoneOuterKm,
      semiMajorAxisGuard: orbit.semiMajorAxisGuard,
      orbitalDirection: orbit.orbitalDirection,
      orbitalPeriodSiderealDays: orbit.orbitalPeriodSiderealDays,
      orbitalPeriodSynodicDays: orbit.orbitalPeriodSynodicDays,
    },
    temperature: {
      equilibriumK: Math.round(temperature.equilibriumK),
      surfaceK: temperature.surfaceK,
      surfaceC: temperature.surfaceC,
      radiogenicWm2: temperature.radiogenicWm2,
    },
    atmosphere: {
      atmosphereClass: atmosphere.atmosphereClass,
      sourceClass: atmosphere.sourceClass,
      surfacePressurePa: atmosphere.surfacePressurePa,
      compositionSummary: atmosphere.compositionSummary,
    },
    hydrosphere: {
      regime: hydrosphere.regime,
      hydrosphereState: hydrosphere.hydrosphereState,
      subsurfaceOceanPresent: hydrosphere.subsurfaceOceanPresent,
      surfaceAccessibleLiquidFraction: hydrosphere.surfaceAccessibleLiquidFraction,
    },
    climate: {
      climateState: climate.climateState,
      seasonalitySummary: climate.seasonalitySummary,
    },
    biosphere: {
      surfaceBiosphereClass: biosphere.surfaceBiosphereClass,
      plantLifePlausibility: biosphere.plantLifePlausibility,
    },
    habitability: {
      habitabilityIndex: unifiedMoonHabitability.score,
      habitabilityModelVersion: unifiedMoonHabitability.version,
      breakdown: {
        solventPathway: unifiedMoonHabitability.breakdown.solventPathway,
      },
      hydrosphere,
    },
    display: {
      atmosphereClass: atmosphere.atmosphereClass,
      hydrosphereState: hydrosphere.hydrosphereState,
      climateState: climate.climateState,
      surfaceBiosphere: biosphere.surfaceBiosphereClass,
      subsurfaceOcean: hydrosphere.subsurfaceOceanPresent ? "Yes" : "No",
      habitabilityIndex: fmt(unifiedMoonHabitability.score, 3),
    },
  };
}

export function calcMoonExact({
  starMassMsol,
  starAgeGyr,
  starMetallicityFeH,
  starRadiusRsolOverride,
  starLuminosityLsolOverride,
  starTempKOverride,
  starEvolutionMode,
  planet,
  moon,
  parentOverride,
  habitabilityPolicy,
  detailLevel = "full",
}) {
  const parent =
    parentOverride ||
    calcPlanetExact({
      starMassMsol,
      starAgeGyr,
      starMetallicityFeH,
      starRadiusRsolOverride,
      starLuminosityLsolOverride,
      starTempKOverride,
      starEvolutionMode,
      planet,
      detailLevel: detailLevel === "summary" ? "summary" : "full",
    });

  const mStarMsol = clamp(starMassMsol, 0.01, 100);
  const ageGyr = clamp(starAgeGyr, 0, 20);

  const mPlanetME = clamp(parent.inputs.massEarth, 0.001, 10000);
  const rhoPlanetGcm3 = clamp(parent.derived.densityGcm3, 0.1, 100);
  const rPlanetRE = clamp(parent.derived.radiusEarth, 0.01, 1000);
  const aPlanetAU = clamp(parent.inputs.semiMajorAxisAu, 0.001, 1e6);
  const ePlanet = clamp(parent.inputs.eccentricity, 0, 0.99);
  const rotPlanetHours = clamp(parent.inputs.rotationPeriodHours, 0.1, 1e6);
  const surfaceFieldEarths = clamp(parent.derived?.surfaceFieldEarths ?? 0, 0, 1000);
  const radioisotopeAbundance = clamp(parent.derived?.radioisotopeAbundance ?? 1, 0.01, 5);

  const mMoonMM = clamp(moon.massMoon ?? 1.0, 1e-8, 10000);
  const rhoMoonGcm3 = clamp(moon.densityGcm3 ?? 3.34, 0.1, 100);
  const albedo = clamp(moon.albedo ?? 0.11, 0, 0.95);
  const aMoonKmInput = clamp(moon.semiMajorAxisKm ?? 384748, 10, 1e9);
  const eMoon = clamp(moon.eccentricity ?? 0.055, 0, 0.99);
  const inc = clamp(moon.inclinationDeg ?? 5.15, 0, 180);
  const initialRotHours = moon.initialRotationPeriodHours
    ? toFinite(moon.initialRotationPeriodHours, 12)
    : 12;

  const rStarRsol = massToRadius(mStarMsol);
  const lStarLsol = massToLuminosity(mStarMsol);
  const starTempK = rStarRsol > 0 ? (lStarLsol / rStarRsol ** 2) ** 0.25 * 5776 : 0;

  const rMoonRM = (mMoonMM / (rhoMoonGcm3 / 3.34)) ** (1 / 3);
  const gMoonG = (mMoonMM / rMoonRM ** 2) * 0.1654;
  const vEscKmS = Math.sqrt(mMoonMM / rMoonRM) * 2.38;

  const orbit = computeMoonOrbit({
    starMassMsol: mStarMsol,
    planetMassEarth: mPlanetME,
    planetDensityGcm3: rhoPlanetGcm3,
    planetRadiusEarth: rPlanetRE,
    planetSemiMajorAxisAu: aPlanetAU,
    planetEccentricity: ePlanet,
    moonMassMoon: mMoonMM,
    moonDensityGcm3: rhoMoonGcm3,
    moonSemiMajorAxisKmInput: aMoonKmInput,
    moonEccentricity: eMoon,
    moonInclinationDeg: inc,
  });

  const moonComposition =
    (moon.compositionOverride && compositionFromClass(moon.compositionOverride)) ||
    compositionFromDensity(rhoMoonGcm3);

  const tides = computeMoonTidalState({
    systemAgeGyr: ageGyr,
    starMassMsol: mStarMsol,
    planetMassEarth: mPlanetME,
    planetDensityGcm3: rhoPlanetGcm3,
    planetRadiusEarth: rPlanetRE,
    planetSemiMajorAxisAu: aPlanetAU,
    planetRotationHours: rotPlanetHours,
    moonMassMoon: mMoonMM,
    moonDensityGcm3: rhoMoonGcm3,
    moonRadiusMoon: rMoonRM,
    moonGravityG: gMoonG,
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    moonEccentricity: eMoon,
    initialRotationPeriodHours: initialRotHours,
    zoneInnerKm: orbit.zoneInnerKm,
    zoneOuterKm: orbit.zoneOuterKm,
    orbitalPeriodSiderealDays: orbit.orbitalPeriodSiderealDays,
    orbitalPeriodSynodicDays: orbit.orbitalPeriodSynodicDays,
    orbitalDirection: orbit.orbitalDirection,
    composition: moonComposition,
    hasCompositionOverride: Boolean(moon.compositionOverride),
  });

  const baselineTemperature = computeMoonTemperature({
    albedo,
    planetSemiMajorAxisAu: aPlanetAU,
    starLuminosityLsol: lStarLsol,
    surfaceAreaM2: tides.surfaceAreaM2,
    moonMassKg: tides.moonMassKg,
    radioisotopeAbundance,
    tidalHeatingWm2: tides.tidalHeatingWm2,
  });
  const illumination = computeMoonIllumination({
    starLuminosityLsol: lStarLsol,
    planetSemiMajorAxisAu: aPlanetAU,
    planetRadiusEarth: rPlanetRE,
    planetDensityGcm3: rhoPlanetGcm3,
    planetAlbedoBond: parent.inputs?.albedoBond,
    parentSurfaceTempK: parent.derived?.surfaceTempK,
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    moonInclinationDeg: inc,
    parentAxialTiltDeg: parent.inputs?.axialTiltDeg,
    moonLockedToPlanet: tides.moonLockedToPlanet === "Yes",
  });

  let temperature = computeMoonTemperature({
    albedo,
    planetSemiMajorAxisAu: aPlanetAU,
    starLuminosityLsol: lStarLsol,
    surfaceAreaM2: tides.surfaceAreaM2,
    moonMassKg: tides.moonMassKg,
    radioisotopeAbundance,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    parentReflectedFluxWm2: illumination.parentReflectedFluxWm2,
    parentThermalFluxWm2: illumination.parentThermalFluxWm2,
    eclipseCoolingPenalty: illumination.eclipseCoolingPenalty,
  });

  const allowAtmosphereTemperatureFeedback = baselineTemperature.equilibriumK <= 180;
  let volatileResults = [];
  let atmosphere = computeMoonAtmosphere();
  for (let pass = 0; pass < 3; pass += 1) {
    volatileResults = analyseMoonVolatiles(
      rhoMoonGcm3,
      temperature.surfaceK,
      vEscKmS,
      tides.moonGravityMs2,
      ageGyr,
      tides.tidalFeedbackActive,
    );
    atmosphere = computeMoonAtmosphere({
      volatileInventory: volatileResults,
      surfaceTempK: temperature.surfaceK,
      gravityMs2: tides.moonGravityMs2,
      tidalFeedbackActive: tides.tidalFeedbackActive,
    });
    const nextTemperature = computeMoonTemperature({
      albedo,
      planetSemiMajorAxisAu: aPlanetAU,
      starLuminosityLsol: lStarLsol,
      surfaceAreaM2: tides.surfaceAreaM2,
      moonMassKg: tides.moonMassKg,
      radioisotopeAbundance,
      tidalHeatingWm2: tides.tidalHeatingWm2,
      parentReflectedFluxWm2: illumination.parentReflectedFluxWm2,
      parentThermalFluxWm2: illumination.parentThermalFluxWm2,
      eclipseCoolingPenalty: illumination.eclipseCoolingPenalty,
      greenhouseTauEquivalent: allowAtmosphereTemperatureFeedback
        ? atmosphere.greenhouseTauEquivalent
        : 0,
      antiGreenhouseFraction: allowAtmosphereTemperatureFeedback
        ? atmosphere.antiGreenhouseFraction
        : 0,
    });
    if (Math.abs(nextTemperature.surfaceK - temperature.surfaceK) <= 1) {
      temperature = nextTemperature;
      break;
    }
    temperature = nextTemperature;
  }

  volatileResults = analyseMoonVolatiles(
    rhoMoonGcm3,
    temperature.surfaceK,
    vEscKmS,
    tides.moonGravityMs2,
    ageGyr,
    tides.tidalFeedbackActive,
  );
  atmosphere = computeMoonAtmosphere({
    volatileInventory: volatileResults,
    surfaceTempK: temperature.surfaceK,
    gravityMs2: tides.moonGravityMs2,
    tidalFeedbackActive: tides.tidalFeedbackActive,
  });
  temperature = computeMoonTemperature({
    albedo,
    planetSemiMajorAxisAu: aPlanetAU,
    starLuminosityLsol: lStarLsol,
    surfaceAreaM2: tides.surfaceAreaM2,
    moonMassKg: tides.moonMassKg,
    radioisotopeAbundance,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    parentReflectedFluxWm2: illumination.parentReflectedFluxWm2,
    parentThermalFluxWm2: illumination.parentThermalFluxWm2,
    eclipseCoolingPenalty: illumination.eclipseCoolingPenalty,
    greenhouseTauEquivalent: allowAtmosphereTemperatureFeedback
      ? atmosphere.greenhouseTauEquivalent
      : 0,
    antiGreenhouseFraction: allowAtmosphereTemperatureFeedback
      ? atmosphere.antiGreenhouseFraction
      : 0,
  });
  atmosphere = {
    ...atmosphere,
    greenhouseWarmingK: Math.max(0, temperature.surfaceK - baselineTemperature.surfaceK),
  };
  const retainedVolatiles = volatileResults.filter(
    (volatile) => volatile.status === "Thin atmosphere",
  );
  const surfacePressurePa = atmosphere.surfacePressurePa;
  const primaryAtmosphere =
    retainedVolatiles.length > 0
      ? retainedVolatiles.reduce((left, right) =>
          left.pressurePa > right.pressurePa ? left : right,
        )
      : null;
  const stableIces = volatileResults.filter((volatile) => volatile.status === "Stable ice");

  const radiation = computeMagnetosphericRadiation({
    surfaceFieldEarths,
    magnetopauseRp: parent.derived?.magnetopauseRp,
    planetSemiMajorAxisAu: aPlanetAU,
    planetRadiusEarth: rPlanetRE,
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
  });
  const hydrosphere = hydrosphereStateFromMoon({
    volatileInventory: volatileResults,
    surfaceTempK: temperature.surfaceK,
    surfacePressurePa,
    tidalHeatingEarth: tides.tidalHeatingEarth,
    gravityG: gMoonG,
    densityGcm3: rhoMoonGcm3,
    massMoon: mMoonMM,
    radiusMoon: rMoonRM,
    compositionClass: tides.compositionClass,
    compositionOverride: moon.compositionOverride || null,
  });
  const climate = computeMoonClimate({
    surfaceTempK: temperature.surfaceK,
    pressurePa: surfacePressurePa,
    gravityG: gMoonG,
    hydrosphere,
    atmosphereComposition: atmosphere.composition,
    illumination,
    moonLockedToPlanet: tides.moonLockedToPlanet === "Yes",
  });
  const geology = computeMoonGeology({
    tidalHeatingEarth: tides.tidalHeatingEarth,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    radiogenicHeatingWm2: temperature.radiogenicWm2,
    massMoon: mMoonMM,
    gravityG: gMoonG,
    densityGcm3: rhoMoonGcm3,
    compositionClass: tides.compositionClass,
    compositionOverride: moon.compositionOverride || null,
    hydrosphere,
  });
  const radiationProfile = moonRadiationProfile({
    magnetosphericRadRemDay: radiation.magnetosphericRadRemDay,
  });
  const biosphere = computeMoonBiosphere({
    starTempK,
    insolationEarth: aPlanetAU > 0 ? lStarLsol / aPlanetAU ** 2 : 0,
    surfacePressurePa,
    atmosphereComposition: atmosphere.composition,
    hydrosphere,
    climate,
    radiation: radiationProfile,
    orbitalPeriodSynodicDays: orbit.orbitalPeriodSynodicDays,
    moonLockedToPlanet: tides.moonLockedToPlanet === "Yes",
  });
  const habitabilityContext = buildMoonHabitabilityContext({
    star: { massMsol: mStarMsol, radiusRsol: rStarRsol, luminosityLsol: lStarLsol, ageGyr },
    planet: {
      massEarth: mPlanetME,
      cmfPct: parent.inputs.cmfPct,
      densityGcm3: rhoPlanetGcm3,
      radiusEarth: rPlanetRE,
      gravityG: parent.derived.gravityG,
      semiMajorAxisAu: aPlanetAU,
      eccentricity: ePlanet,
      periapsisAu: orbit.periPlanetAu,
      orbitalPeriodDays: orbit.periodPlanetDays,
      rotationPeriodHours: rotPlanetHours,
    },
    inputs: {
      massMoon: mMoonMM,
      densityGcm3: rhoMoonGcm3,
      albedo,
      semiMajorAxisKmInput: aMoonKmInput,
      semiMajorAxisKm: orbit.semiMajorAxisKm,
      eccentricity: eMoon,
      inclinationDeg: inc,
      initialRotationPeriodHours: initialRotHours,
      compositionOverride: moon.compositionOverride || null,
    },
    physical: {
      radiusMoon: rMoonRM,
      gravityG: gMoonG,
      escapeVelocityKmS: vEscKmS,
    },
    temperature: {
      equilibriumK: Math.round(temperature.equilibriumK),
      surfaceK: temperature.surfaceK,
      surfaceC: temperature.surfaceC,
      radiogenicWm2: temperature.radiogenicWm2,
    },
    volatiles: {
      inventory: volatileResults,
      primaryAtmosphere: primaryAtmosphere ? primaryAtmosphere.species : null,
      surfacePressurePa,
      hasVolatileAtmosphere: retainedVolatiles.length > 0,
    },
    atmosphere,
    radiation: {
      magnetosphericRadRemDay: radiation.magnetosphericRadRemDay,
      magnetosphericLabel: radiationLabel(radiation.magnetosphericRadRemDay),
      magnetopauseLShell: radiation.magnetopauseLShell,
      bAtMoonGauss: radiation.bAtMoonGauss,
      lShell: radiation.lShell,
      insideMagnetosphere: radiation.insideMagnetosphere,
    },
    tides: {
      totalEarthTides: tides.totalEarthTides,
      moonContributionPct: tides.moonContributionPct,
      starContributionPct: tides.starContributionPct,
      tidalHeatingW: tides.tidalHeatingW,
      tidalHeatingWm2: tides.tidalHeatingWm2,
      tidalHeatingEarth: tides.tidalHeatingEarth,
      compositionClass: tides.compositionClass,
      k2Moon: tides.k2Moon,
      qMoon: tides.qMoon,
      rigidityMoonGPa: tides.rigidityMoonGPa,
      compositionOverride: moon.compositionOverride || null,
      tidalFeedbackActive: tides.tidalFeedbackActive,
      meltFraction: tides.meltFraction,
      qEffective: tides.qEffective,
      rigidityEffectiveGPa: tides.rigidityEffectiveGPa,
      recessionCmYr: tides.recessionCmYr,
      timeToRocheGyr: tides.timeToRocheGyr,
      timeToEscapeGyr: tides.timeToEscapeGyr,
      moonLockedToPlanet: tides.moonLockedToPlanet,
      planetLockedToMoon: tides.planetLockedToMoon,
      planetLockedToStar: tides.planetLockedToStar,
      lockingTimesGyr: tides.lockingTimesGyr,
    },
    habitability: {
      hydrosphere,
      radiation: radiationProfile,
    },
    climate,
    geology,
    biosphere,
  });
  const earthSimilarity = computeEarthSimilarityIndex(habitabilityContext);
  const unifiedMoonHabitability = computeMoonHabitabilityIndex(habitabilityContext, {
    solventPolicy: habitabilityPolicy,
  });

  if (detailLevel === "summary") {
    return buildMoonSummaryResult({
      mStarMsol,
      rStarRsol,
      lStarLsol,
      ageGyr,
      mPlanetME,
      rhoPlanetGcm3,
      rPlanetRE,
      aPlanetAU,
      ePlanet,
      rotPlanetHours,
      mMoonMM,
      rhoMoonGcm3,
      albedo,
      aMoonKmInput,
      eMoon,
      inc,
      initialRotHours,
      compositionOverride: moon.compositionOverride,
      rMoonRM,
      gMoonG,
      vEscKmS,
      orbit,
      temperature,
      atmosphere,
      hydrosphere,
      climate,
      biosphere,
      unifiedMoonHabitability,
    });
  }

  return {
    star: { massMsol: mStarMsol, radiusRsol: rStarRsol, luminosityLsol: lStarLsol, ageGyr },
    planet: {
      massEarth: mPlanetME,
      cmfPct: parent.inputs.cmfPct,
      densityGcm3: rhoPlanetGcm3,
      radiusEarth: rPlanetRE,
      gravityG: parent.derived.gravityG,
      semiMajorAxisAu: aPlanetAU,
      eccentricity: ePlanet,
      periapsisAu: orbit.periPlanetAu,
      orbitalPeriodDays: orbit.periodPlanetDays,
      rotationPeriodHours: rotPlanetHours,
    },

    inputs: {
      massMoon: mMoonMM,
      densityGcm3: rhoMoonGcm3,
      albedo,
      semiMajorAxisKmInput: aMoonKmInput,
      semiMajorAxisKm: orbit.semiMajorAxisKm,
      eccentricity: eMoon,
      inclinationDeg: inc,
      initialRotationPeriodHours: initialRotHours,
    },

    physical: {
      radiusMoon: rMoonRM,
      gravityG: gMoonG,
      escapeVelocityKmS: vEscKmS,
    },

    orbit: {
      moonZoneInnerKm: orbit.zoneInnerKm,
      moonZoneOuterKm: orbit.zoneOuterKm,
      semiMajorAxisAllowedMinKm: orbit.minAMoonKm,
      semiMajorAxisAllowedMaxKm: orbit.maxAMoonKm,
      semiMajorAxisGuard: orbit.semiMajorAxisGuard,
      periapsisKm: orbit.periapsisKm,
      apoapsisKm: orbit.apoapsisKm,
      orbitalDirection: orbit.orbitalDirection,
      orbitalPeriodSiderealDays: orbit.orbitalPeriodSiderealDays,
      orbitalPeriodSynodicDays: orbit.orbitalPeriodSynodicDays,
      rotationPeriodDays: tides.rotationPeriodDays,
    },

    temperature: {
      equilibriumK: Math.round(temperature.equilibriumK),
      surfaceK: temperature.surfaceK,
      surfaceC: temperature.surfaceC,
      radiogenicWm2: temperature.radiogenicWm2,
    },

    volatiles: {
      inventory: volatileResults,
      primaryAtmosphere: primaryAtmosphere ? primaryAtmosphere.species : null,
      surfacePressurePa,
      hasVolatileAtmosphere: retainedVolatiles.length > 0,
    },

    atmosphere,

    radiation: {
      magnetosphericRadRemDay: radiation.magnetosphericRadRemDay,
      magnetosphericLabel: radiationLabel(radiation.magnetosphericRadRemDay),
      magnetopauseLShell: radiation.magnetopauseLShell,
      bAtMoonGauss: radiation.bAtMoonGauss,
      lShell: radiation.lShell,
      insideMagnetosphere: radiation.insideMagnetosphere,
    },

    habitability: {
      earthSimilarityIndex: earthSimilarity.score,
      earthSimilarityBreakdown: earthSimilarity.components,
      habitabilityIndex: unifiedMoonHabitability.score,
      habitabilityModelVersion: unifiedMoonHabitability.version,
      habitabilityPolicyVersion: unifiedMoonHabitability.breakdown.solventPolicyVersion,
      breakdown: unifiedMoonHabitability.breakdown,
      hydrosphere,
      radiation: radiationProfile,
    },

    climate,

    geology,

    biosphere,

    tides: {
      totalEarthTides: tides.totalEarthTides,
      moonContributionPct: tides.moonContributionPct,
      starContributionPct: tides.starContributionPct,
      tidalHeatingW: tides.tidalHeatingW,
      tidalHeatingWm2: tides.tidalHeatingWm2,
      tidalHeatingEarth: tides.tidalHeatingEarth,
      compositionClass: tides.compositionClass,
      k2Moon: tides.k2Moon,
      qMoon: tides.qMoon,
      rigidityMoonGPa: tides.rigidityMoonGPa,
      compositionOverride: moon.compositionOverride || null,
      tidalFeedbackActive: tides.tidalFeedbackActive,
      meltFraction: tides.meltFraction,
      qEffective: tides.qEffective,
      rigidityEffectiveGPa: tides.rigidityEffectiveGPa,
      recessionCmYr: tides.recessionCmYr,
      timeToRocheGyr: tides.timeToRocheGyr,
      timeToEscapeGyr: tides.timeToEscapeGyr,
      moonLockedToPlanet: tides.moonLockedToPlanet,
      planetLockedToMoon: tides.planetLockedToMoon,
      planetLockedToStar: tides.planetLockedToStar,
      lockingTimesGyr: tides.lockingTimesGyr,
    },

    display: {
      radius: `${fmt(rMoonRM, 3)} R☾`,
      gravity: `${fmt(gMoonG, 3)} g`,
      esc: `${fmt(vEscKmS, 2)} km/s`,
      equilibriumTemp: `${Math.round(temperature.equilibriumK)} K`,
      earthSimilarityIndex: fmt(earthSimilarity.score, 3),
      habitabilityIndex: fmt(unifiedMoonHabitability.score, 3),
      surfaceTemp: `${temperature.surfaceK} K (${temperature.surfaceC} °C)`,
      zoneInner: `${fmt(orbit.zoneInnerKm, 0)} km`,
      zoneOuter: `${fmt(orbit.zoneOuterKm, 0)} km`,
      peri: `${fmt(orbit.periapsisKm, 0)} km`,
      apo: `${fmt(orbit.apoapsisKm, 0)} km`,
      sidereal: `${fmt(orbit.orbitalPeriodSiderealDays, 3)} days`,
      synodic: `${fmt(orbit.orbitalPeriodSynodicDays, 3)} days`,
      rot:
        tides.rotationPeriodDays === null
          ? "Not tidally locked"
          : tides.moonLockedToPlanet === "Yes"
            ? `${fmt(tides.rotationPeriodDays, 3)} days (locked)`
            : `${fmt(tides.rotationPeriodDays, 3)} days (est.)`,
      initialRot: `${fmt(initialRotHours, 2)} hours`,
      tides: `${fmt(tides.totalEarthTides, 3)} Earth tides`,
      moonPct: `${fmt(tides.moonContributionPct, 1)} %`,
      starPct: `${fmt(tides.starContributionPct, 1)} %`,
      compositionClass: tides.tidalFeedbackActive
        ? `${tides.compositionClass} (partially molten)`
        : tides.compositionClass,
      tidalHeating:
        tides.tidalHeatingWm2 < 1e-6
          ? "Negligible"
          : tides.tidalHeatingWm2 < 0.001
            ? `${tides.tidalHeatingWm2.toExponential(2)} W/m²`
            : `${fmt(tides.tidalHeatingWm2, 4)} W/m²`,
      tidalHeatingTotal:
        tides.tidalHeatingW < 1
          ? "Negligible"
          : tides.tidalHeatingW < 1e6
            ? `${fmt(tides.tidalHeatingW, 0)} W`
            : `${tides.tidalHeatingW.toExponential(2)} W`,
      tidalHeatingXEarth:
        tides.tidalHeatingEarth < 1e-4 ? "Negligible" : `${fmt(tides.tidalHeatingEarth, 2)}× Earth`,
      radiogenicHeating:
        temperature.radiogenicWm2 < 1e-6
          ? "Negligible"
          : temperature.radiogenicWm2 < 0.001
            ? `${temperature.radiogenicWm2.toExponential(2)} W/m²`
            : `${fmt(temperature.radiogenicWm2, 4)} W/m²`,
      atmosphereClass: atmosphere.atmosphereClass,
      surfacePressure:
        surfacePressurePa <= 0
          ? "0 Pa"
          : surfacePressurePa < 1
            ? `${surfacePressurePa.toExponential(2)} Pa`
            : surfacePressurePa < 1000
              ? `${fmt(surfacePressurePa, 2)} Pa`
              : surfacePressurePa < 100000
                ? `${fmt(surfacePressurePa / 1000, 2)} kPa`
                : `${fmt(surfacePressurePa / 101325, 2)} atm`,
      atmosphereComposition: atmosphere.compositionSummary,
      atmosphereSource: atmosphere.sourceClass,
      greenhouseWarming:
        atmosphere.greenhouseWarmingK <= 0 ? "+0 K" : `+${fmt(atmosphere.greenhouseWarmingK, 1)} K`,
      volcanicActivity: geology.volcanicActivity,
      cryovolcanicActivity: geology.cryovolcanicActivity,
      resurfacing: geology.resurfacingClass,
      volatileReplenishment: geology.volatileReplenishmentTendency,
      oceanPersistence: geology.oceanPersistenceTendency,
      surfaceBiosphere: biosphere.surfaceBiosphereClass,
      plantLife: biosphere.plantLifePlausibility,
      vegetation:
        biosphere.vegetationEligible && biosphere.vegetation ? "Supported" : "Not supported",
      vegetationColours:
        biosphere.vegetationEligible && biosphere.vegetation
          ? `${biosphere.vegetation.paleHex} → ${biosphere.vegetation.deepHex}`
          : "N/A",
      vegetationNote:
        biosphere.vegetationEligible && biosphere.vegetation
          ? biosphere.vegetation.note
          : "No surface vegetation under the current biosphere gate",
      biosphereLimits: biosphere.limitingFactorsDisplay,
      climateState: climate.climateState,
      climateZones: climate.climateZones?.display?.dominantClass
        ? `${climate.climateZones.display.dominantClass} (${climate.climateZones.display.zoneCount} zones)`
        : "N/A",
      climateZoneSummary: climate.climateZones?.display?.summary || "N/A",
      seasonality: climate.seasonalitySummary,
      surfaceTempRange: `${fmt(climate.surfaceTempMinK, 0)}–${fmt(climate.surfaceTempMaxK, 0)} K`,
      planetshine:
        climate.planetshineFluxWm2 <= 0
          ? "Negligible"
          : climate.planetshineFluxWm2 < 1
            ? `${fmt(climate.planetshineFluxWm2, 3)} W/m²`
            : `${fmt(climate.planetshineFluxWm2, 2)} W/m²`,
      eclipseCooling:
        climate.eclipseCoolingPenalty <= 0
          ? "Negligible"
          : `${fmt(climate.eclipseCoolingPenalty * 100, 1)}% stellar loss`,
      hydrosphereState: hydrosphere.hydrosphereState,
      surfaceWater:
        hydrosphere.surfaceAccessibleLiquidFraction > 0
          ? `${fmt(hydrosphere.surfaceAccessibleLiquidFraction * 100, 0)}% accessible liquid`
          : hydrosphere.liquidOceanFraction > 0
            ? `${fmt(hydrosphere.liquidOceanFraction * 100, 0)}% liquid cover`
            : hydrosphere.permanentIceFraction > 0
              ? `${fmt(hydrosphere.permanentIceFraction * 100, 0)}% surface ice`
              : hydrosphere.steamFraction > 0
                ? `${fmt(hydrosphere.steamFraction * 100, 0)}% vapour cover`
                : "None",
      subsurfaceOcean: hydrosphere.subsurfaceOceanPresent
        ? `Yes (${fmt(hydrosphere.subsurfaceOceanScore, 2)})`
        : hydrosphere.subsurfaceOceanScore >= 0.25
          ? `Possible (${fmt(hydrosphere.subsurfaceOceanScore, 2)})`
          : "No",
      oceanDepth:
        hydrosphere.estimatedSurfaceOceanDepthKm > 0
          ? `${fmt(hydrosphere.estimatedSurfaceOceanDepthKm, 1)} km surface ocean`
          : hydrosphere.estimatedSubsurfaceOceanDepthKm > 0
            ? `${fmt(hydrosphere.estimatedSubsurfaceOceanDepthKm, 1)} km subsurface ocean`
            : "None",
      iceShell:
        hydrosphere.estimatedIceShellThicknessKm > 0
          ? `${fmt(hydrosphere.estimatedIceShellThicknessKm, 1)} km`
          : "None",
      highPressureIce: hydrosphere.highPressureIceBarrier
        ? `Likely (>${fmt(hydrosphere.highPressureIceThresholdKm, 0)} km)`
        : "No",
      magnetosphericRad:
        radiation.magnetosphericRadRemDay < 0.001
          ? "Negligible"
          : radiation.magnetosphericRadRemDay < 1
            ? `${fmt(radiation.magnetosphericRadRemDay, 3)} rem/day`
            : radiation.magnetosphericRadRemDay < 1000
              ? `${fmt(radiation.magnetosphericRadRemDay, 1)} rem/day`
              : `${radiation.magnetosphericRadRemDay.toExponential(2)} rem/day`,
      magnetosphericLabel: radiationLabel(radiation.magnetosphericRadRemDay),
      recession: formatRecession(tides.recessionCmYr),
      orbitalFate: formatOrbitalFate(tides.dadtTotal, tides.timeToRocheGyr, tides.timeToEscapeGyr),
      moonLocked: tides.moonLockedToPlanet,
      planetLockedMoon: tides.planetLockedToMoon || "—",
      planetLockedStar: tides.planetLockedToStar,
      surfaceIces: stableIces.map((volatile) => volatile.species).join(", ") || "None",
      volatileAtmosphere: primaryAtmosphere
        ? primaryAtmosphere.pressurePa >= 1
          ? `${primaryAtmosphere.species} (~${fmt(primaryAtmosphere.pressurePa, 0)} Pa)`
          : `${primaryAtmosphere.species} (~${primaryAtmosphere.pressurePa.toExponential(1)} Pa)`
        : "None",
      tMoonLock: `${fmt(tides.lockingTimesGyr.moonToPlanet, 6)} Gyr`,
      tPlanetMoon: `${fmt(tides.lockingTimesGyr.planetToMoon, 6)} Gyr`,
      tPlanetStar: `${fmt(tides.lockingTimesGyr.planetToStar, 6)} Gyr`,
    },
  };
}

export const calcMoon = calcMoonExact;
