import { clamp, fmt } from "../utils.js";
import {
  DIFFERENTIATED_PLANET_K2_SCALE,
  EARTHLIKE_HOST_TIDAL_QUALITY_FACTOR,
  GAS_GIANT_HOST_TIDAL_QUALITY_FACTOR,
  getMoonMaterialProfileByClass,
  SILICATE_RIGIDITY_PA,
} from "../physics/materials.js";
import { auToMeters, earthMassToKg, moonMassToKg, solarMassToKg } from "../physics/orbital.js";
import {
  calcEccentricityFactor,
  calcK2LoveNumber,
  calcTidalLockTimeSeconds,
  selectSpinOrbitResonance,
} from "../physics/rotation.js";
import {
  classifySmallBodyRegime,
  estimateSmallBodyLoveNumber,
  estimateSmallBodyRigidity,
  estimateSmallBodyTidalQ,
} from "./smallBody.js";

const PI = Math.PI;
const G = 6.67e-11;
const KM_PER_REARTH = 6371;
const KM_PER_RMOON = 1737.4;
const SEC_PER_DAY = 86400;
const SECONDS_TO_GYR = 3.171e-17;

const RIGIDITY = SILICATE_RIGIDITY_PA;
const EARTH_TIDES_REF = 1501373691439.2996;
const EARTH_GEOTHERMAL_WM2 = 0.09;
const NUMERICAL_FLOOR_MOON_MASS = 1e-12;

const MELT_FLUX_CRIT = 0.02;
const PARTIALLY_MOLTEN_PROFILE = getMoonMaterialProfileByClass({
  className: "Partially molten",
});
const MELT_MU = PARTIALLY_MOLTEN_PROFILE.mu;
const MELT_Q = PARTIALLY_MOLTEN_PROFILE.Q;

function planetLockStatusFromGyr(tGyr) {
  if (tGyr < 0.001) return "Very Likely Locked";
  if (tGyr < 0.01) return "Maybe (~Myr)";
  if (tGyr < 0.1) return "Maybe (~10s Myr)";
  if (tGyr < 1) return "Maybe (~100s Myr)";
  if (tGyr < 10) return "Maybe (~Gyr)";
  if (tGyr < 100) return "Maybe (~10s Gyr)";
  if (tGyr >= 100) return "Maybe (~100s Gyr)";
  return "";
}

function estimateHostTidalQualityFactor({ isGasGiant, planetMassEarth }) {
  if (isGasGiant) return GAS_GIANT_HOST_TIDAL_QUALITY_FACTOR;

  const mass = clamp(Number(planetMassEarth) || 1, 0.05, 10);
  const massScaling = mass < 1 ? mass ** -0.9 : mass ** -0.25;
  return clamp(EARTHLIKE_HOST_TIDAL_QUALITY_FACTOR * massScaling, 10, 300);
}

function buildMoonSpinState({ tidallyEvolved, resonance }) {
  if (!tidallyEvolved || !resonance) {
    return {
      modelVersion: "moon-spin-state-v1",
      state: "Non-resonant / not tidally evolved",
      ratio: null,
      tidallyEvolved: false,
      climateNote:
        "The moon has not fully despun into a stable spin-orbit resonance, so no permanent parent-facing hemisphere is enforced.",
      surfaceHabitabilityModifier: 1,
      contrastScale: 0.08,
    };
  }

  if (resonance.ratio === "1:1") {
    return {
      modelVersion: "moon-spin-state-v1",
      state: "1:1 synchronous",
      ratio: "1:1",
      tidallyEvolved: true,
      climateNote:
        "A synchronous lock keeps one hemisphere permanently facing the parent, strengthening long-term hemispheric contrast.",
      surfaceHabitabilityModifier: 0.92,
      contrastScale: 1,
    };
  }

  if (resonance.ratio === "3:2") {
    return {
      modelVersion: "moon-spin-state-v1",
      state: "3:2 resonance",
      ratio: "3:2",
      tidallyEvolved: true,
      climateNote:
        "A 3:2 spin-orbit resonance rotates the sub-parent point and softens permanent contrast relative to a 1:1 lock.",
      surfaceHabitabilityModifier: 1.04,
      contrastScale: 0.38,
    };
  }

  return {
    modelVersion: "moon-spin-state-v1",
    state: `${resonance.ratio} resonance`,
    ratio: resonance.ratio,
    tidallyEvolved: true,
    climateNote:
      "A higher-order spin-orbit resonance still redistributes parent-facing geometry more effectively than a strict 1:1 lock.",
    surfaceHabitabilityModifier: 1.01,
    contrastScale: 0.24,
  };
}

export function formatRecession(cmYr) {
  if (!Number.isFinite(cmYr) || Math.abs(cmYr) < 1e-10) return "Stable";
  const direction = cmYr > 0 ? "outward" : "inward";
  const magnitude = Math.abs(cmYr);
  if (magnitude < 0.01) return `${magnitude.toExponential(1)} cm/yr (${direction})`;
  return `${cmYr > 0 ? "+" : "−"}${fmt(magnitude, 2)} cm/yr (${direction})`;
}

function computeIntegratedMigrationTimeGyr({ semiMajorAxisM, targetSemiMajorAxisM, dadtMs }) {
  if (!Number.isFinite(semiMajorAxisM) || semiMajorAxisM <= 0) return Infinity;
  if (!Number.isFinite(targetSemiMajorAxisM) || targetSemiMajorAxisM <= 0) return Infinity;
  if (!Number.isFinite(dadtMs) || Math.abs(dadtMs) < 1e-30) return Infinity;

  const ratio = targetSemiMajorAxisM / semiMajorAxisM;
  const dtSec = (2 / 13) * (semiMajorAxisM / Math.abs(dadtMs)) * Math.abs(ratio ** (13 / 2) - 1);
  return dtSec * SECONDS_TO_GYR;
}

function formatLongFate(prefix, timeGyr) {
  if (timeGyr < 0.001) return `${prefix} in < 1 Myr`;
  if (timeGyr < 1) return `${prefix} in ~${fmt(timeGyr * 1000, 0)} Myr`;
  if (timeGyr < 1000) return `${prefix} in ~${fmt(timeGyr, 1)} Gyr`;
  if (timeGyr < 1e6) return `${prefix} in ~${fmt(timeGyr, 0)} Gyr`;
  return `${prefix} in > 1,000,000 Gyr`;
}

export function formatOrbitalFate(
  dadtTotalMs,
  toRocheGyr,
  toEscapeGyr,
  innerFateTargetLabel = "Roche limit",
) {
  if (!Number.isFinite(dadtTotalMs) || Math.abs(dadtTotalMs) < 1e-30) return "Stable";
  if (dadtTotalMs < 0 && Number.isFinite(toRocheGyr)) {
    return formatLongFate(innerFateTargetLabel || "Roche limit", toRocheGyr);
  }
  if (dadtTotalMs > 0 && Number.isFinite(toEscapeGyr)) {
    return formatLongFate("Escape", toEscapeGyr);
  }
  return "Stable";
}

export function computeMoonTidalState({
  systemAgeGyr,
  starMassMsol,
  planetMassEarth,
  planetDensityGcm3,
  planetRadiusEarth,
  planetSemiMajorAxisAu,
  planetRotationHours,
  moonMassMoon,
  moonDensityGcm3,
  moonRadiusMoon,
  moonGravityG,
  moonSemiMajorAxisKm,
  moonEccentricity,
  initialRotationPeriodHours,
  zoneInnerKm,
  zoneOuterKm,
  orbitalPeriodSiderealDays,
  orbitalPeriodSynodicDays,
  orbitalDirection,
  composition,
  hasCompositionOverride,
  innerFateTargetLabel = "Roche limit",
}) {
  const inputValidationMassMoon = Math.max(0, Number(moonMassMoon) || 0);
  const physicsMassMoon = inputValidationMassMoon;
  const numericalFloorMassMoon = NUMERICAL_FLOOR_MOON_MASS;
  const moonMassKg = moonMassToKg(physicsMassMoon);
  const moonMassKgForDivision = Math.max(moonMassKg, moonMassToKg(numericalFloorMassMoon));
  const moonRadiusM = moonRadiusMoon * KM_PER_RMOON * 1000;
  const moonDensityKgM3 = moonDensityGcm3 * 1000;
  const moonGravityMs2 = moonGravityG * 9.81;
  const moonRadiusKm = moonRadiusM / 1000;
  const moonDiameterKm = moonRadiusKm * 2;

  const planetMassKg = earthMassToKg(planetMassEarth);
  const planetRadiusM = planetRadiusEarth * KM_PER_REARTH * 1000;
  const planetDensityKgM3 = planetDensityGcm3 * 1000;
  const planetGravityMs2 = (planetMassEarth / planetRadiusEarth ** 2) * 9.81;
  const starMassKg = solarMassToKg(starMassMsol);
  const isGasGiant = planetDensityGcm3 < 2;
  const qPlanetEff = estimateHostTidalQualityFactor({ isGasGiant, planetMassEarth });
  const qPlanetModel = isGasGiant ? "gas-giant-host-q-v1" : "rocky-host-mass-scaled-q-v1";

  const omegaMoon = (2 * PI) / (initialRotationPeriodHours * 3600);
  const omegaPlanet = (2 * PI) / (planetRotationHours * 3600);
  const moonSemiMajorAxisM = moonSemiMajorAxisKm * 1000;
  const planetSemiMajorAxisM = auToMeters(planetSemiMajorAxisAu);

  const inertiaMoon = 0.4 * moonMassKg * moonRadiusM ** 2;
  const planetMomentOfInertiaFactor = isGasGiant ? 0.25 : 0.3307;
  const inertiaPlanet = planetMomentOfInertiaFactor * planetMassKg * planetRadiusM ** 2;

  const smallBodyRegime = classifySmallBodyRegime({
    massMoon: physicsMassMoon,
    massKg: moonMassKg,
    radiusM: moonRadiusM,
    radiusKm: moonRadiusKm,
    densityGcm3: moonDensityGcm3,
    diameterKm: moonDiameterKm,
    gravityMs2: moonGravityMs2,
  });

  let moonResponseRigidity = composition.mu;
  let qMoon = composition.Q;
  let k2Model = "homogeneous-elastic-moon-v1";
  let qModel = hasCompositionOverride ? "composition-override-q-v1" : "density-derived-moon-q-v1";
  if (smallBodyRegime.appliesSmallBodyTides) {
    moonResponseRigidity = estimateSmallBodyRigidity({
      densityGcm3: moonDensityGcm3,
      diameterKm: moonDiameterKm,
      structuralClass: smallBodyRegime.structuralClass,
      compositionRigidityPa: composition.mu,
    });
    qMoon = estimateSmallBodyTidalQ({
      densityGcm3: moonDensityGcm3,
      diameterKm: moonDiameterKm,
      gravityMs2: moonGravityMs2,
      structuralClass: smallBodyRegime.structuralClass,
    });
    k2Model = "small-body-elastic-gravity-v1";
    qModel = "small-body-porosity-gravity-q-v1";
  }

  let k2Moon = calcK2LoveNumber({
    densityKgM3: moonDensityKgM3,
    gravityMs2: moonGravityMs2,
    radiusM: moonRadiusM,
    rigidityPa: moonResponseRigidity,
  });
  if (smallBodyRegime.appliesSmallBodyTides) {
    k2Moon = estimateSmallBodyLoveNumber({
      densityKgM3: moonDensityKgM3,
      densityGcm3: moonDensityGcm3,
      gravityMs2: moonGravityMs2,
      radiusM: moonRadiusM,
      diameterKm: moonDiameterKm,
      rigidityPa: moonResponseRigidity,
    });
  }
  const k2Planet = calcK2LoveNumber({
    densityKgM3: planetDensityKgM3,
    gravityMs2: planetGravityMs2,
    radiusM: planetRadiusM,
    rigidityPa: RIGIDITY,
  });
  const k2PlanetForLock = isGasGiant ? k2Planet : k2Planet * DIFFERENTIATED_PLANET_K2_SCALE;

  const tMoonLockGyr =
    calcTidalLockTimeSeconds({
      spinRateRadPerSec: omegaMoon,
      orbitalSeparationM: moonSemiMajorAxisM,
      momentOfInertiaKgM2: inertiaMoon,
      qualityFactor: qMoon,
      otherMassKg: planetMassKg,
      loveNumberK2: k2Moon,
      radiusM: moonRadiusM,
    }) * SECONDS_TO_GYR;
  const tPlanetLockToMoonGyr =
    calcTidalLockTimeSeconds({
      spinRateRadPerSec: omegaPlanet,
      orbitalSeparationM: moonSemiMajorAxisM,
      momentOfInertiaKgM2: inertiaPlanet,
      qualityFactor: qPlanetEff,
      otherMassKg: moonMassKgForDivision,
      loveNumberK2: k2PlanetForLock,
      radiusM: planetRadiusM,
    }) * SECONDS_TO_GYR;
  const tPlanetLockToStarGyr =
    calcTidalLockTimeSeconds({
      spinRateRadPerSec: omegaPlanet,
      orbitalSeparationM: planetSemiMajorAxisM,
      momentOfInertiaKgM2: inertiaPlanet,
      qualityFactor: qPlanetEff,
      otherMassKg: starMassKg,
      loveNumberK2: k2PlanetForLock,
      radiusM: planetRadiusM,
    }) * SECONDS_TO_GYR;

  const tideMoon = (2 * G * moonMassKg * planetMassKg) / moonSemiMajorAxisM ** 3;
  const tideStar = (2 * G * planetMassKg * starMassKg) / planetSemiMajorAxisM ** 3;
  const tideTotal = tideMoon + tideStar;

  const totalEarthTides = (tideMoon + tideStar) / EARTH_TIDES_REF;
  const moonContributionPct = tideTotal > 0 ? (tideMoon / tideTotal) * 100 : 0;
  const starContributionPct = tideTotal > 0 ? (tideStar / tideTotal) * 100 : 0;

  const nMeanMotion = (2 * PI) / (orbitalPeriodSiderealDays * SEC_PER_DAY);
  const surfaceAreaM2 = 4 * PI * moonRadiusM ** 2;
  const tidalGeomFactor =
    (21 / 2) *
    ((G * planetMassKg ** 2 * moonRadiusM ** 5 * nMeanMotion) / moonSemiMajorAxisM ** 6) *
    calcEccentricityFactor({ eccentricity: moonEccentricity });

  const tidalHeatingW0 = tidalGeomFactor * (k2Moon / qMoon);
  const tidalFlux0 = surfaceAreaM2 > 0 ? tidalHeatingW0 / surfaceAreaM2 : 0;

  let tidalFeedbackActive = false;
  let meltFraction = 0;
  let effectiveRigidity = moonResponseRigidity;
  let effectiveQ = qMoon;
  let tidalHeatingW = tidalHeatingW0;

  if (
    !smallBodyRegime.appliesSmallBodyTides &&
    !hasCompositionOverride &&
    moonDensityGcm3 >= 3.2 &&
    tidalFlux0 > 0
  ) {
    const ratio = tidalFlux0 / MELT_FLUX_CRIT;
    meltFraction = ratio > 0 ? 1 / (1 + ratio ** -3) : 0;
    if (meltFraction > 0.01) {
      tidalFeedbackActive = true;
      effectiveRigidity = Math.exp(
        Math.log(composition.mu) * (1 - meltFraction) + Math.log(MELT_MU) * meltFraction,
      );
      effectiveQ = composition.Q * (1 - meltFraction) + MELT_Q * meltFraction;
      const k2Effective = calcK2LoveNumber({
        densityKgM3: moonDensityKgM3,
        gravityMs2: moonGravityMs2,
        radiusM: moonRadiusM,
        rigidityPa: effectiveRigidity,
      });
      tidalHeatingW = tidalGeomFactor * (k2Effective / effectiveQ);
    }
  }

  const tidalHeatingWm2 = surfaceAreaM2 > 0 ? tidalHeatingW / surfaceAreaM2 : 0;
  const tidalHeatingEarth = tidalHeatingWm2 / EARTH_GEOTHERMAL_WM2;

  const k2PlanetEff = k2Planet * DIFFERENTIATED_PLANET_K2_SCALE;
  const signFactor = orbitalDirection === "Retrograde" ? -1 : Math.sign(omegaPlanet - nMeanMotion);
  const dadtPlanet =
    signFactor *
    3 *
    (k2PlanetEff / qPlanetEff) *
    (moonMassKg / planetMassKg) *
    nMeanMotion *
    (planetRadiusM ** 5 / moonSemiMajorAxisM ** 4);
  const dadtMoon =
    ((-21 / 2) *
      (k2Moon / qMoon) *
      (planetMassKg / moonMassKgForDivision) *
      nMeanMotion *
      (moonRadiusM ** 5 * moonEccentricity ** 2)) /
    moonSemiMajorAxisM ** 4;
  const dadtTotalMs = dadtPlanet + dadtMoon;
  const recessionCmYr = dadtTotalMs * 100 * 365.25 * SEC_PER_DAY;

  const zoneInnerM = zoneInnerKm * 1000;
  const zoneOuterM = zoneOuterKm * 1000;
  const timeToRocheGyr =
    dadtTotalMs < 0 && zoneInnerM > 0 && zoneInnerM < moonSemiMajorAxisM
      ? computeIntegratedMigrationTimeGyr({
          semiMajorAxisM: moonSemiMajorAxisM,
          targetSemiMajorAxisM: zoneInnerM,
          dadtMs: dadtTotalMs,
        })
      : Infinity;
  const timeToEscapeGyr =
    dadtTotalMs > 0 && zoneOuterM > moonSemiMajorAxisM
      ? computeIntegratedMigrationTimeGyr({
          semiMajorAxisM: moonSemiMajorAxisM,
          targetSemiMajorAxisM: zoneOuterM,
          dadtMs: dadtTotalMs,
        })
      : Infinity;

  const tidallyEvolvedMoon = tMoonLockGyr <= systemAgeGyr;
  const spinOrbitResonance = tidallyEvolvedMoon
    ? selectSpinOrbitResonance({ eccentricity: moonEccentricity })
    : null;
  const spinState = buildMoonSpinState({
    tidallyEvolved: tidallyEvolvedMoon,
    resonance: spinOrbitResonance,
  });
  const moonLockedToPlanet = spinState.tidallyEvolved && spinState.ratio === "1:1" ? "Yes" : "No";
  const planetLockedToMoon = planetLockStatusFromGyr(tPlanetLockToMoonGyr);
  const planetLockedToStar = tPlanetLockToStarGyr <= systemAgeGyr ? "Yes" : "No";

  let rotationPeriodDays;
  if (spinState.tidallyEvolved && spinOrbitResonance?.p > 0) {
    rotationPeriodDays = orbitalPeriodSiderealDays / spinOrbitResonance.p;
  } else {
    const tau = tMoonLockGyr / 5;
    const nSync = (2 * PI) / (orbitalPeriodSynodicDays * 24 * 3600);
    const omegaCurrent = nSync + (omegaMoon - nSync) * Math.exp(-systemAgeGyr / tau);
    rotationPeriodDays = omegaCurrent > 0 ? (2 * PI) / omegaCurrent / (24 * 3600) : null;
  }

  return {
    totalEarthTides,
    moonContributionPct,
    starContributionPct,
    tidalHeatingW,
    tidalHeatingWm2,
    tidalHeatingEarth,
    compositionClass: composition.compositionClass,
    k2Moon,
    qMoon,
    rigidityMoonGPa: moonResponseRigidity / 1e9,
    tidalRegime: smallBodyRegime.tidalRegime,
    smallBodyRegime,
    k2Model,
    qModel,
    qPlanet: qPlanetEff,
    qPlanetModel,
    k2Planet,
    k2PlanetEffective: k2PlanetEff,
    tidalUncertaintyCaveats: smallBodyRegime.caveats,
    massModel: {
      inputValidationMassMoon,
      physicsMassMoon,
      displayMassMoon: physicsMassMoon,
      numericalFloorMassMoon,
      physicsMassKg: moonMassKg,
      numericalFloorMassKg: moonMassKgForDivision,
    },
    tidalFeedbackActive,
    meltFraction,
    qEffective: effectiveQ,
    rigidityEffectiveGPa: effectiveRigidity / 1e9,
    recessionCmYr,
    dadtTotalMs,
    dadtPlanetMs: dadtPlanet,
    dadtMoonMs: dadtMoon,
    fateTimescaleMethod: "integrated-a^-11/2-v1",
    innerFateTargetLabel,
    timeToRocheGyr,
    timeToEscapeGyr,
    tidallyEvolvedMoon,
    spinOrbitResonance: spinOrbitResonance ? spinOrbitResonance.ratio : null,
    spinState,
    moonLockedToPlanet,
    planetLockedToMoon,
    planetLockedToStar,
    lockingTimesGyr: {
      moonToPlanet: tMoonLockGyr,
      planetToMoon: tPlanetLockToMoonGyr,
      planetToStar: tPlanetLockToStarGyr,
    },
    rotationPeriodDays,
    surfaceAreaM2,
    moonMassKg,
    moonGravityMs2,
  };
}
