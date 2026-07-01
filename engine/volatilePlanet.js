import { waterRadiusInflation, compositionClass, waterRegime } from "./planet/composition.js";
import { equilibriumTemperatureK, computeAbsorbedFluxWm2 } from "./planet/temperature.js";
import {
  calcOrbitalPeriodDaysKepler,
  calcOrbitalPeriodYearsKepler,
  calcRvSemiAmplitudeMs,
  calcTransitDepthFraction,
  calcTransitProbabilityFraction,
  earthMassToKg,
  orbitalDirectionFromInclination,
} from "./physics/orbital.js";
import { evaluateJeansEscapeSpecies, xuvFluxAtOrbitErgCm2S } from "./physics/escape.js";
import { SOLAR_MASS_KG } from "./physics/constants.js";
import { clamp, fmt, round, toFinite } from "./utils.js";
import { buildEnvironmentForcing, formatEnvironmentForcingSummary } from "./environment/index.js";

export const VOLATILE_RADIUS_MODEL_VERSION = "volatile-radius-lopez-fortney-v1";

const EARTH_RADIUS_KM = 6371;
const EARTH_DENSITY_GCM3 = 5.51;
const EARTH_GRAVITY_MS2 = 9.80665;
const EARTH_ESCAPE_VELOCITY_KMS = 11.186;
const SOLAR_RADIUS_KM = 695700;
const G = 6.674e-11;
const S_PER_GYR = 3.15576e16;
const EARTH_REFERENCE_XUV_FLUX_ERG_CM2_S = 4.64;
const HEATING_EFFICIENCY = 0.1;

const GAS_SPECIES = [
  { key: "h2", label: "H\u2082", mw: 0.002 },
  { key: "he", label: "He", mw: 0.004 },
];

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveOrNull(value) {
  const number = finiteOrNull(value);
  return number != null && number > 0 ? number : null;
}

function solidRadiusEarth({ solidMassEarth, cmfFraction, wmfFraction }) {
  const mass = Math.max(Number(solidMassEarth) || 0, 1e-6);
  const cmf = clamp(cmfFraction, 0, 0.95);
  const wmf = clamp(wmfFraction, 0, 0.95);
  const alpha = Math.min(1 / 3, 0.257 - 0.0161 * Math.log(mass));
  const dryRadiusEarth = (1.07 - 0.21 * cmf) * mass ** alpha;
  const radiusEarth = dryRadiusEarth * waterRadiusInflation(mass, wmf);
  return {
    dryRadiusEarth,
    radiusEarth,
    densityDryGcm3: (mass * EARTH_DENSITY_GCM3) / dryRadiusEarth ** 3,
  };
}

function envelopeThicknessEarth({
  solidMassEarth,
  hHeEnvelopeMassFraction,
  insolationEarth,
  ageGyr,
  envelopeMetallicitySolar,
}) {
  const fEnv = Math.max(hHeEnvelopeMassFraction, 0);
  if (fEnv <= 0) return 0;
  const massScale = Math.max(solidMassEarth, 0.1) / 5;
  const envelopeScale = Math.max(fEnv, 1e-5) / 0.05;
  const fluxScale = Math.max(insolationEarth, 0.01);
  const ageScale = Math.max(ageGyr, 0.1) / 5;
  const metallicityScale = Math.max(envelopeMetallicitySolar, 0.1);

  return (
    2.06 *
    envelopeScale ** 0.59 *
    massScale ** -0.21 *
    fluxScale ** 0.044 *
    ageScale ** -0.18 *
    metallicityScale ** -0.03
  );
}

function computeEnergyLimitedEscape({ massKg, radiusKm, envelopeMassKg, xuvFluxRatio }) {
  if (massKg <= 0 || radiusKm <= 0 || envelopeMassKg <= 0) {
    return {
      massLossRateKgS: 0,
      envelopeSurvivalTimescaleGyr: 0,
    };
  }
  const radiusM = radiusKm * 1000;
  const fXuvSI = xuvFluxRatio * EARTH_REFERENCE_XUV_FLUX_ERG_CM2_S * 1e-3;
  const massLossRateKgS = (HEATING_EFFICIENCY * Math.PI * radiusM ** 3 * fXuvSI) / (G * massKg);
  const survivalGyr = envelopeMassKg / Math.max(massLossRateKgS, 1e-30) / S_PER_GYR;
  return {
    massLossRateKgS,
    envelopeSurvivalTimescaleGyr: Math.min(survivalGyr, 1e12),
  };
}

function envelopeState({
  hHeEnvelopeMassFraction,
  envelopeSurvivalTimescaleGyr,
  ageGyr,
  xuvFluxRatio,
}) {
  if (hHeEnvelopeMassFraction <= 0.00001) {
    return {
      state: "stripped",
      label: "Stripped",
      reason: "No meaningful H/He envelope is present.",
    };
  }
  if (envelopeSurvivalTimescaleGyr < Math.min(0.25, ageGyr * 0.1)) {
    return {
      state: "stripping",
      label: "Actively stripping",
      reason: "Energy-limited escape removes the envelope much faster than the system age.",
    };
  }
  if (envelopeSurvivalTimescaleGyr < ageGyr || xuvFluxRatio > 1000) {
    return {
      state: "eroding",
      label: "Eroding",
      reason: "The H/He envelope survives for now but is vulnerable to XUV-driven loss.",
    };
  }
  return {
    state: "retained",
    label: "Retained",
    reason: "Envelope survival timescale exceeds the system age.",
  };
}

function formatTimescale(gyr) {
  if (!Number.isFinite(gyr)) return "unknown";
  if (gyr >= 1000) return `>${fmt(1000, 0)} Gyr`;
  if (gyr >= 1) return `${fmt(gyr, 2)} Gyr`;
  return `${fmt(gyr * 1000, 1)} Myr`;
}

export function calcVolatilePlanet({
  name = "Volatile planet",
  massEarth = 5,
  observedRadiusEarth = null,
  cmfPct = 32,
  wmfPct = 0,
  hHeEnvelopeMassPct = 0,
  envelopeMetallicitySolar = 1,
  ageGyr = 4.6,
  starMassMsol = 1,
  starLuminosityLsol = 1,
  starRadiusRsol = 1,
  semiMajorAxisAu = 1,
  eccentricity = 0,
  inclinationDeg = 0,
  albedoBond = 0.3,
  companionFluxEarth = 0,
  companionXuvFluxEarth = 0,
  companionPrebioticUvEarth = 0,
  companionWindPressureEarth = 0,
  hostXuvFluxEarthAt1Au = null,
  hostPrebioticUvEarthAt1Au = null,
  hostWindPressureEarthAt1Au = null,
  hostFrameId = null,
  hostFrame = null,
  fluxVariabilityFraction = 0,
} = {}) {
  const resolvedMassEarth = Math.max(toFinite(massEarth, 5), 0.01);
  const envelopeFraction = clamp(toFinite(hHeEnvelopeMassPct, 0) / 100, 0, 0.8);
  const solidMassEarth = Math.max(resolvedMassEarth * (1 - envelopeFraction), 0.001);
  const age = Math.max(toFinite(ageGyr, 4.6), 0.01);
  const orbitAu = Math.max(toFinite(semiMajorAxisAu, 1), 0.01);
  const ecc = clamp(toFinite(eccentricity, 0), 0, 0.99);
  const inclination = clamp(toFinite(inclinationDeg, 0), 0, 180);
  const albedo = clamp(toFinite(albedoBond, 0.3), 0, 0.95);
  const stellarLuminosity = Math.max(toFinite(starLuminosityLsol, 1), 1e-9);
  const environmentForcing = buildEnvironmentForcing({
    bodyType: "volatile",
    solverFamily: "volatile",
    starConfig: {
      massMsol: starMassMsol,
      ageGyr: age,
      radiusRsolOverride: starRadiusRsol,
      luminosityLsolOverride: stellarLuminosity,
    },
    orbitAu,
    eccentricity: ecc,
    hostFrame,
    hostFrameId,
    hostXuvFluxEarthAt1Au,
    hostPrebioticUvEarthAt1Au,
    hostWindPressureEarthAt1Au,
    companionFluxEarth,
    companionXuvFluxEarth,
    companionPrebioticUvEarth,
    companionWindPressureEarth,
    fluxVariabilityFraction,
  });
  const totalInsolationEarth = Math.max(
    toFinite(environmentForcing.flux?.bolometricEarthAtOrbit, 0),
    0,
  );
  const effectiveLuminosityLsol = Math.max(totalInsolationEarth * orbitAu ** 2, 1e-9);
  const equilibriumTempK = equilibriumTemperatureK(effectiveLuminosityLsol, albedo, orbitAu);
  const absorbedFluxWm2 = computeAbsorbedFluxWm2(totalInsolationEarth, albedo);
  const solid = solidRadiusEarth({
    solidMassEarth,
    cmfFraction: clamp(toFinite(cmfPct, 32), 0, 100) / 100,
    wmfFraction: clamp(toFinite(wmfPct, 0), 0, 95) / 100,
  });
  const envelopeRadiusEarth = envelopeThicknessEarth({
    solidMassEarth,
    hHeEnvelopeMassFraction: envelopeFraction,
    insolationEarth: totalInsolationEarth,
    ageGyr: age,
    envelopeMetallicitySolar: Math.max(toFinite(envelopeMetallicitySolar, 1), 0.1),
  });
  const modelRadiusEarth = solid.radiusEarth + envelopeRadiusEarth;
  const observedRadius = positiveOrNull(observedRadiusEarth);
  const transitRadiusEarth = observedRadius ?? modelRadiusEarth;
  const radiusSource = observedRadius == null ? "modelled" : "observed";
  const transitRadiusKm = transitRadiusEarth * EARTH_RADIUS_KM;
  const modelRadiusKm = modelRadiusEarth * EARTH_RADIUS_KM;
  const solidRadiusKm = solid.radiusEarth * EARTH_RADIUS_KM;
  const massKg = earthMassToKg(resolvedMassEarth);
  const envelopeMassEarth = resolvedMassEarth * envelopeFraction;
  const envelopeMassKg = earthMassToKg(envelopeMassEarth);
  const planetMassMsol = massKg / SOLAR_MASS_KG;
  const bulkDensityGcm3 = (resolvedMassEarth * EARTH_DENSITY_GCM3) / transitRadiusEarth ** 3;
  const solidDensityGcm3 = (solidMassEarth * EARTH_DENSITY_GCM3) / solid.radiusEarth ** 3;
  const gravityG = resolvedMassEarth / transitRadiusEarth ** 2;
  const gravityMs2 = gravityG * EARTH_GRAVITY_MS2;
  const escapeVelocityKms =
    Math.sqrt(resolvedMassEarth / transitRadiusEarth) * EARTH_ESCAPE_VELOCITY_KMS;
  const orbitalPeriodYears = calcOrbitalPeriodYearsKepler({
    semiMajorAxisAu: orbitAu,
    centralMassMsol: Math.max(toFinite(starMassMsol, 1), 0.01),
    secondaryMassMsol: planetMassMsol,
  });
  const orbitalPeriodDays = calcOrbitalPeriodDaysKepler({
    semiMajorAxisAu: orbitAu,
    centralMassMsol: Math.max(toFinite(starMassMsol, 1), 0.01),
    secondaryMassMsol: planetMassMsol,
  });
  const xuvRatio = Math.max(toFinite(environmentForcing.flux?.xuvEarthAtOrbit, 0), 0);
  const xuvFluxErgCm2S =
    xuvRatio * EARTH_REFERENCE_XUV_FLUX_ERG_CM2_S ||
    xuvFluxAtOrbitErgCm2S({
      starMassMsol,
      starLuminosityLsol: stellarLuminosity,
      starAgeGyr: age,
      orbitAu,
    });
  const exobaseTempK = Math.min(
    Math.max(equilibriumTempK, 200) * (1 + 2.5 * Math.sqrt(Math.max(xuvRatio, 0))),
    10000,
  );
  const escape = computeEnergyLimitedEscape({
    massKg,
    radiusKm: transitRadiusKm,
    envelopeMassKg,
    xuvFluxRatio: xuvRatio,
  });
  const envelope = envelopeState({
    hHeEnvelopeMassFraction: envelopeFraction,
    envelopeSurvivalTimescaleGyr: escape.envelopeSurvivalTimescaleGyr,
    ageGyr: age,
    xuvFluxRatio: xuvRatio,
  });
  const jeansEscape = evaluateJeansEscapeSpecies({
    escapeVelocityKms,
    exobaseTempK,
    gasSpecies: GAS_SPECIES,
    lambdaDigits: 1,
  });
  const starRadiusKm = Math.max(toFinite(starRadiusRsol, 1), 0.01) * SOLAR_RADIUS_KM;
  const transitDepthFraction = calcTransitDepthFraction({
    bodyRadiusKm: transitRadiusKm,
    starRadiusKm,
  });
  const transitProbabilityFraction = calcTransitProbabilityFraction({
    bodyRadiusKm: transitRadiusKm,
    starRadiusKm,
    semiMajorAxisAu: orbitAu,
  });
  const rvSemiAmplitudeMs = calcRvSemiAmplitudeMs({
    orbitalPeriodDays,
    primaryMassMsol: Math.max(toFinite(starMassMsol, 1), 0.01),
    secondaryMassKg: massKg,
    eccentricity: ecc,
    sinI: Math.sin((inclination || 90) * (Math.PI / 180)) || 1,
  });

  return {
    modelVersion: VOLATILE_RADIUS_MODEL_VERSION,
    name,
    inputs: {
      massEarth: round(resolvedMassEarth, 4),
      observedRadiusEarth: observedRadius,
      cmfPct: round(clamp(toFinite(cmfPct, 32), 0, 100), 3),
      wmfPct: round(clamp(toFinite(wmfPct, 0), 0, 95), 3),
      hHeEnvelopeMassPct: round(envelopeFraction * 100, 5),
      envelopeMetallicitySolar: round(Math.max(toFinite(envelopeMetallicitySolar, 1), 0.1), 3),
      ageGyr: round(age, 4),
      semiMajorAxisAu: round(orbitAu, 6),
      eccentricity: round(ecc, 5),
      inclinationDeg: round(inclination, 3),
      albedoBond: round(albedo, 3),
    },
    orbit: {
      semiMajorAxisAu: round(orbitAu, 6),
      eccentricity: round(ecc, 5),
      inclinationDeg: round(inclination, 3),
      orbitalDirection: orbitalDirectionFromInclination(inclination),
      orbitalPeriodYears: round(orbitalPeriodYears, 5),
      orbitalPeriodDays: round(orbitalPeriodDays, 3),
    },
    physical: {
      massEarth: round(resolvedMassEarth, 4),
      massKg,
      solidMassEarth: round(solidMassEarth, 4),
      transitRadiusEarth: round(transitRadiusEarth, 4),
      transitRadiusKm: round(transitRadiusKm, 0),
      modelRadiusEarth: round(modelRadiusEarth, 4),
      modelRadiusKm: round(modelRadiusKm, 0),
      solidRadiusEarth: round(solid.radiusEarth, 4),
      solidRadiusKm: round(solidRadiusKm, 0),
      dryCoreRadiusEarth: round(solid.dryRadiusEarth, 4),
      envelopeRadiusEarth: round(envelopeRadiusEarth, 4),
      observedRadiusEarth: observedRadius,
      radiusSource,
      bulkDensityGcm3: round(bulkDensityGcm3, 4),
      solidDensityGcm3: round(solidDensityGcm3, 4),
      gravityG: round(gravityG, 4),
      gravityMs2: round(gravityMs2, 3),
      escapeVelocityKms: round(escapeVelocityKms, 3),
      compositionClass: compositionClass(
        clamp(toFinite(cmfPct, 32), 0, 100) / 100,
        clamp(toFinite(wmfPct, 0), 0, 95) / 100,
      ),
      waterRegime: waterRegime(clamp(toFinite(wmfPct, 0), 0, 95) / 100),
    },
    derived: {
      environmentForcing,
    },
    environment: {
      forcing: environmentForcing,
    },
    environmentForcing,
    thermal: {
      insolationEarth: round(totalInsolationEarth, 5),
      absorbedFluxWm2: round(absorbedFluxWm2, 3),
      equilibriumTempK: round(equilibriumTempK, 2),
    },
    envelope: {
      massEarth: round(envelopeMassEarth, 6),
      massKg: envelopeMassKg,
      massFraction: round(envelopeFraction, 6),
      massPct: round(envelopeFraction * 100, 5),
      metallicitySolar: round(Math.max(toFinite(envelopeMetallicitySolar, 1), 0.1), 3),
      radiusContributionEarth: round(envelopeRadiusEarth, 4),
      massLossRateKgS: round(escape.massLossRateKgS, 3),
      survivalTimescaleGyr: round(escape.envelopeSurvivalTimescaleGyr, 5),
      state: envelope.state,
      stateLabel: envelope.label,
      stateReason: envelope.reason,
      xuvFluxRatioEarth: round(xuvRatio, 4),
      xuvFluxErgCm2S: round(xuvFluxErgCm2S, 4),
      exobaseTempK: round(exobaseTempK, 1),
      jeansEscape,
    },
    habitability: {
      liquidWaterPossible: false,
      climateState: null,
      surfaceState: "No accessible solid surface model",
      hydrosphere: null,
      earthSimilarityIndex: null,
      habitabilityIndex: null,
      habitabilityBreakdown: null,
    },
    detection: {
      transitDepthFraction: round(transitDepthFraction, 8),
      transitDepthPpm: round(transitDepthFraction * 1e6, 2),
      transitProbabilityFraction: round(transitProbabilityFraction, 6),
      rvSemiAmplitudeMs: round(rvSemiAmplitudeMs, 4),
    },
    display: {
      radiusSource:
        radiusSource === "observed"
          ? "Observed transit/photosphere radius"
          : "Modelled transit/photosphere radius",
      transitRadius: `${fmt(transitRadiusEarth, 3)} R\u2295`,
      modelRadius: `${fmt(modelRadiusEarth, 3)} R\u2295`,
      solidRadius: `${fmt(solid.radiusEarth, 3)} R\u2295`,
      envelopeThickness: `${fmt(envelopeRadiusEarth, 3)} R\u2295`,
      density: `${fmt(bulkDensityGcm3, 3)} g/cm\u00b3`,
      gravity: `${fmt(gravityG, 3)} g`,
      escape: `${fmt(escapeVelocityKms, 2)} km/s`,
      equilibriumTemp: `${fmt(equilibriumTempK, 0)} K`,
      insolation: `${fmt(totalInsolationEarth, 3)}x Earth`,
      environmentForcing: formatEnvironmentForcingSummary(environmentForcing),
      envelopeMass: `${fmt(envelopeMassEarth, 4)} M\u2295 (${fmt(envelopeFraction * 100, 3)}%)`,
      envelopeState: envelope.label,
      envelopeTimescale: formatTimescale(escape.envelopeSurvivalTimescaleGyr),
      massLossRate: `${fmt(escape.massLossRateKgS, escape.massLossRateKgS >= 1000 ? 0 : 2)} kg/s`,
      transitDepth: `${fmt(transitDepthFraction * 100, transitDepthFraction * 100 >= 0.1 ? 2 : 4)}% (${fmt(transitDepthFraction * 1e6, 0)} ppm)`,
      transitProbability: `${fmt(transitProbabilityFraction * 100, 2)}% geometric probability`,
      rvSemiAmplitude: `${fmt(rvSemiAmplitudeMs, rvSemiAmplitudeMs >= 10 ? 2 : 3)} m/s`,
    },
  };
}
