import { auToMeters } from "./orbital.js";

const SOLAR_LUMINOSITY_W = 3.828e26;
const STEFAN_BOLTZ_WM2K4 = 5.6704e-8;
const SOLAR_CONSTANT_WM2 = 1361;
const PLANCK_H_JS = 6.62607015e-34;
const LIGHT_SPEED_MS = 299792458;
const BOLTZMANN_K_JK = 1.380649e-23;
const PLANCK_SECOND_RADIATION_CONSTANT_MK = (PLANCK_H_JS * LIGHT_SPEED_MS) / BOLTZMANN_K_JK;
const BLACKBODY_DIMENSIONLESS_TOTAL = Math.PI ** 4 / 15;

function planckDimensionlessIntegrand(x) {
  if (!Number.isFinite(x) || x <= 0) return 0;
  if (x > 700) return 0;
  if (x < 1e-5) return x * x;
  return x ** 3 / Math.expm1(x);
}

function evenStepCount(value) {
  const parsed = Math.round(Number(value));
  const safe = Number.isFinite(parsed) ? Math.max(2, parsed) : 128;
  return safe % 2 === 0 ? safe : safe + 1;
}

export function blackbodyBandFraction({
  teffK,
  wavelengthMinNm,
  wavelengthMaxNm,
  steps = 128,
} = {}) {
  const tempK = Number(teffK);
  const minNm = Number(wavelengthMinNm);
  const maxNm = Number(wavelengthMaxNm);
  if (
    !Number.isFinite(tempK) ||
    tempK <= 0 ||
    !Number.isFinite(minNm) ||
    minNm <= 0 ||
    !Number.isFinite(maxNm) ||
    maxNm <= minNm
  ) {
    return 0;
  }

  const lowerX = PLANCK_SECOND_RADIATION_CONSTANT_MK / (maxNm * 1e-9 * tempK);
  const upperX = PLANCK_SECOND_RADIATION_CONSTANT_MK / (minNm * 1e-9 * tempK);
  if (!Number.isFinite(lowerX) || !Number.isFinite(upperX) || upperX <= lowerX) return 0;

  const count = evenStepCount(steps);
  const h = (upperX - lowerX) / count;
  let sum = planckDimensionlessIntegrand(lowerX) + planckDimensionlessIntegrand(upperX);
  for (let i = 1; i < count; i += 1) {
    const x = lowerX + h * i;
    sum += (i % 2 === 0 ? 2 : 4) * planckDimensionlessIntegrand(x);
  }
  const integral = (h / 3) * sum;
  return Math.max(0, Math.min(1, integral / BLACKBODY_DIMENSIONLESS_TOTAL));
}

export function calcInsolationEarthRatio({ starLuminosityLsol, orbitalDistanceAu }) {
  if (orbitalDistanceAu <= 0) return 0;
  return starLuminosityLsol / orbitalDistanceAu ** 2;
}

export function insolationEarthRatio(starLuminosityLsol, distanceAu) {
  return calcInsolationEarthRatio({
    starLuminosityLsol,
    orbitalDistanceAu: distanceAu,
  });
}

export function calcStellarFluxWm2({ starLuminosityLsol, orbitalDistanceAu }) {
  if (orbitalDistanceAu <= 0) return 0;
  const orbitalDistanceM = auToMeters(orbitalDistanceAu);
  return (starLuminosityLsol * SOLAR_LUMINOSITY_W) / (4 * Math.PI * orbitalDistanceM ** 2);
}

export function stellarFluxWm2(starLuminosityLsol, distanceAu) {
  return calcStellarFluxWm2({
    starLuminosityLsol,
    orbitalDistanceAu: distanceAu,
  });
}

export function calcAbsorbedFluxWm2({
  insolationEarthRatio,
  albedoBond,
  solarConstantWm2 = SOLAR_CONSTANT_WM2,
}) {
  return (insolationEarthRatio * solarConstantWm2 * (1 - albedoBond)) / 4;
}

export function absorbedFluxWm2(
  insolationEarth,
  albedoBond,
  solarConstantWm2 = SOLAR_CONSTANT_WM2,
) {
  return calcAbsorbedFluxWm2({
    insolationEarthRatio: insolationEarth,
    albedoBond,
    solarConstantWm2,
  });
}

export function calcEquilibriumFourthPowerFromFluxWm2({
  stellarFluxAtDistanceWm2,
  albedoBond,
  redistributionFactor = 4,
}) {
  if (stellarFluxAtDistanceWm2 <= 0 || redistributionFactor <= 0) return 0;
  return (
    (stellarFluxAtDistanceWm2 * (1 - albedoBond)) / (redistributionFactor * STEFAN_BOLTZ_WM2K4)
  );
}

export function equilibriumFourthPowerFromFluxWm2(
  stellarFluxAtDistanceWm2,
  albedoBond,
  redistributionFactor = 4,
) {
  return calcEquilibriumFourthPowerFromFluxWm2({
    stellarFluxAtDistanceWm2,
    albedoBond,
    redistributionFactor,
  });
}

export function calcEquilibriumTemperatureFromFluxK({
  stellarFluxAtDistanceWm2,
  albedoBond,
  redistributionFactor = 4,
}) {
  const fourthPower = calcEquilibriumFourthPowerFromFluxWm2({
    stellarFluxAtDistanceWm2,
    albedoBond,
    redistributionFactor,
  });
  return fourthPower > 0 ? Math.sqrt(Math.sqrt(fourthPower)) : 0;
}

export function equilibriumTemperatureFromFluxK(
  stellarFluxAtDistanceWm2,
  albedoBond,
  redistributionFactor = 4,
) {
  return calcEquilibriumTemperatureFromFluxK({
    stellarFluxAtDistanceWm2,
    albedoBond,
    redistributionFactor,
  });
}

export function calcEquilibriumTemperatureAtDistanceK({
  starLuminosityLsol,
  albedoBond,
  orbitalDistanceAu,
  coefficientK = 279,
  luminosityExponent = 0.25,
}) {
  if (orbitalDistanceAu <= 0) return 0;
  return (
    (coefficientK * starLuminosityLsol ** luminosityExponent * (1 - albedoBond) ** 0.25) /
    Math.sqrt(orbitalDistanceAu)
  );
}

export function equilibriumTemperatureK({
  starLuminosityLsol,
  albedoBond,
  distanceAu,
  coefficientK = 279,
  luminosityExponent = 0.25,
}) {
  return calcEquilibriumTemperatureAtDistanceK({
    starLuminosityLsol,
    albedoBond,
    orbitalDistanceAu: distanceAu,
    coefficientK,
    luminosityExponent,
  });
}
