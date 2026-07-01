import { AU_KM, AU_M, EARTH_MASS_KG, G_SI, SOLAR_MASS_KG } from "./constants.js";

const KG_PER_MMOON = 7.342e22;
const G = G_SI;

export function auToMeters(distanceAu) {
  return distanceAu * AU_M;
}

export function auToKilometers(distanceAu) {
  return distanceAu * AU_KM;
}

export function solarMassToKg(massSolar) {
  return massSolar * SOLAR_MASS_KG;
}

export function earthMassToKg(massEarth) {
  return massEarth * EARTH_MASS_KG;
}

export function moonMassToKg(massMoon) {
  return massMoon * KG_PER_MMOON;
}

export function calcOrbitalPeriodYearsKepler({
  semiMajorAxisAu,
  centralMassMsol,
  secondaryMassMsol = 0,
}) {
  const totalMassMsol = Number(centralMassMsol) + Math.max(Number(secondaryMassMsol) || 0, 0);
  if (!(semiMajorAxisAu > 0) || !(totalMassMsol > 0)) return 0;
  return Math.sqrt(semiMajorAxisAu ** 3 / totalMassMsol);
}

export function orbitalPeriodYearsKepler(semiMajorAxisAu, centralMassMsol, secondaryMassMsol = 0) {
  return calcOrbitalPeriodYearsKepler({ semiMajorAxisAu, centralMassMsol, secondaryMassMsol });
}

export function calcOrbitalPeriodDaysKepler({
  semiMajorAxisAu,
  centralMassMsol,
  secondaryMassMsol = 0,
  daysPerYear = 365.25,
}) {
  return (
    calcOrbitalPeriodYearsKepler({ semiMajorAxisAu, centralMassMsol, secondaryMassMsol }) *
    daysPerYear
  );
}

export function orbitalPeriodDaysKepler(
  semiMajorAxisAu,
  centralMassMsol,
  daysPerYear = 365.25,
  secondaryMassMsol = 0,
) {
  return calcOrbitalPeriodDaysKepler({
    semiMajorAxisAu,
    centralMassMsol,
    secondaryMassMsol,
    daysPerYear,
  });
}

export function orbitalDirectionFromInclination(inclinationDeg) {
  if (inclinationDeg > 90) return "Retrograde";
  if (inclinationDeg < 90) return "Prograde";
  return "Undefined";
}

export function calcTwoBodyOrbitalPeriodSeconds({
  semiMajorAxisM,
  primaryMassKg,
  secondaryMassKg = 0,
  gravitationalConstant = G_SI,
}) {
  return (
    2 *
    Math.PI *
    Math.sqrt(semiMajorAxisM ** 3 / (gravitationalConstant * (primaryMassKg + secondaryMassKg)))
  );
}

export function twoBodyOrbitalPeriodSeconds(
  semiMajorAxisM,
  primaryMassKg,
  secondaryMassKg = 0,
  gravitationalConstant = G_SI,
) {
  return calcTwoBodyOrbitalPeriodSeconds({
    semiMajorAxisM,
    primaryMassKg,
    secondaryMassKg,
    gravitationalConstant,
  });
}

export function calcTransitDepthFraction({ bodyRadiusKm, starRadiusKm }) {
  const bodyRadius = Math.max(Number(bodyRadiusKm) || 0, 0);
  const starRadius = Math.max(Number(starRadiusKm) || 0, 0);
  if (bodyRadius <= 0 || starRadius <= 0) return 0;
  return (bodyRadius / starRadius) ** 2;
}

export function calcTransitProbabilityFraction({ bodyRadiusKm, starRadiusKm, semiMajorAxisAu }) {
  const bodyRadiusM = Math.max(Number(bodyRadiusKm) || 0, 0) * 1000;
  const starRadiusM = Math.max(Number(starRadiusKm) || 0, 0) * 1000;
  const semiMajorAxisM = auToMeters(Math.max(Number(semiMajorAxisAu) || 0, 0));
  if (semiMajorAxisM <= 0 || starRadiusM <= 0) return 0;
  return Math.min((bodyRadiusM + starRadiusM) / semiMajorAxisM, 1);
}

export function calcRvSemiAmplitudeMs({
  orbitalPeriodDays,
  primaryMassMsol,
  secondaryMassKg,
  eccentricity = 0,
  sinI = 1,
}) {
  const periodSeconds = Math.max(Number(orbitalPeriodDays) || 0, 0) * 86400;
  const primaryMassKg = solarMassToKg(Math.max(Number(primaryMassMsol) || 0, 0));
  const companionMassKg = Math.max(Number(secondaryMassKg) || 0, 0);
  const eccentricityTerm = Math.sqrt(Math.max(1 - (Number(eccentricity) || 0) ** 2, 1e-9));
  const sinInclination = Math.max(Number(sinI) || 0, 0);
  if (periodSeconds <= 0 || primaryMassKg <= 0 || companionMassKg <= 0 || sinInclination <= 0) {
    return 0;
  }
  return (
    (((2 * Math.PI * G) / periodSeconds) ** (1 / 3) *
      ((companionMassKg * sinInclination) / (primaryMassKg + companionMassKg) ** (2 / 3))) /
    eccentricityTerm
  );
}
