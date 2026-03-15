const AU_M = 149597870000;
const AU_KM = 149597870;
const KG_PER_MSOL = 1.989e30;
const KG_PER_MEARTH = 5.972e24;
const KG_PER_MMOON = 7.342e22;
const G = 6.674e-11;

export function auToMeters(distanceAu) {
  return distanceAu * AU_M;
}

export function auToKilometers(distanceAu) {
  return distanceAu * AU_KM;
}

export function solarMassToKg(massSolar) {
  return massSolar * KG_PER_MSOL;
}

export function earthMassToKg(massEarth) {
  return massEarth * KG_PER_MEARTH;
}

export function moonMassToKg(massMoon) {
  return massMoon * KG_PER_MMOON;
}

export function calcOrbitalPeriodYearsKepler({ semiMajorAxisAu, centralMassMsol }) {
  return Math.sqrt(semiMajorAxisAu ** 3 / centralMassMsol);
}

export function orbitalPeriodYearsKepler(semiMajorAxisAu, centralMassMsol) {
  return calcOrbitalPeriodYearsKepler({ semiMajorAxisAu, centralMassMsol });
}

export function calcOrbitalPeriodDaysKepler({
  semiMajorAxisAu,
  centralMassMsol,
  daysPerYear = 365.25,
}) {
  return calcOrbitalPeriodYearsKepler({ semiMajorAxisAu, centralMassMsol }) * daysPerYear;
}

export function orbitalPeriodDaysKepler(semiMajorAxisAu, centralMassMsol, daysPerYear = 365.25) {
  return calcOrbitalPeriodDaysKepler({
    semiMajorAxisAu,
    centralMassMsol,
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
  gravitationalConstant = 6.67e-11,
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
  gravitationalConstant = 6.67e-11,
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
