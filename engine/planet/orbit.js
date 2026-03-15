import {
  auToMeters,
  calcOrbitalPeriodYearsKepler,
  calcTwoBodyOrbitalPeriodSeconds,
  earthMassToKg,
  moonMassToKg,
  orbitalDirectionFromInclination as sharedOrbitalDirectionFromInclination,
} from "../physics/orbital.js";
import { calcEccentricityFactor, calcTidalLockTimeGyr } from "../physics/rotation.js";

const G = 6.67e-11;
const C_ATM_TIDE = 12;

function clampUnit(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function planetTidalHeatingFromMoon(
  k2Planet,
  qualityFactor,
  radiusM,
  moonMassKg,
  semiMajorAxisM,
  orbitalPeriodS,
  ecc,
) {
  if (semiMajorAxisM <= 0 || orbitalPeriodS <= 0 || ecc <= 0) return 0;
  const meanMotion = (2 * Math.PI) / orbitalPeriodS;
  return (
    (21 / 2) *
    (k2Planet / qualityFactor) *
    ((G * moonMassKg ** 2 * radiusM ** 5 * meanMotion) / semiMajorAxisM ** 6) *
    calcEccentricityFactor({ eccentricity: ecc })
  );
}

export function atmosphereTideRatio(pressureAtm, insolationEarth, gravityMs2, tEqK) {
  if (pressureAtm <= 0 || tEqK <= 0 || gravityMs2 <= 0) return 0;
  return (C_ATM_TIDE * pressureAtm * insolationEarth) / (gravityMs2 * tEqK);
}

export function totalPlanetTidalHeating(moons, k2Planet, qualityFactor, mPlanetKg, radiusM) {
  if (!moons || moons.length === 0) return 0;
  let total = 0;
  for (const moon of moons) {
    const moonMassKg = moonMassToKg(Number(moon.massMoon) || 0);
    const semiMajorAxisM = (Number(moon.semiMajorAxisKm) || 0) * 1000;
    const ecc = Number(moon.eccentricity) || 0;
    if (moonMassKg <= 0 || semiMajorAxisM <= 0) continue;
    const orbitalPeriodS = calcTwoBodyOrbitalPeriodSeconds({
      semiMajorAxisM,
      primaryMassKg: mPlanetKg,
    });
    total += planetTidalHeatingFromMoon(
      k2Planet,
      qualityFactor,
      radiusM,
      moonMassKg,
      semiMajorAxisM,
      orbitalPeriodS,
      ecc,
    );
  }
  return total;
}

export function tidalLockTimeGyr(omega, orbitM, momentI, qualityFactor, mOtherKg, k2, radiusM) {
  return calcTidalLockTimeGyr({
    spinRateRadPerSec: omega,
    orbitalSeparationM: orbitM,
    momentOfInertiaKgM2: momentI,
    qualityFactor,
    otherMassKg: mOtherKg,
    loveNumberK2: k2,
    radiusM,
  });
}

export function planetMassEarthToKg(massEarth) {
  return earthMassToKg(massEarth);
}

export function semiMajorAxisAuToMeters(semiMajorAxisAu) {
  return auToMeters(semiMajorAxisAu);
}

export function orbitalPeriodEarthYears(semiMajorAxisAu, starMassMsol) {
  return calcOrbitalPeriodYearsKepler({
    semiMajorAxisAu,
    centralMassMsol: starMassMsol,
  });
}

export function orbitalDirectionFromInclination(inclinationDeg) {
  return sharedOrbitalDirectionFromInclination(inclinationDeg);
}

export function calcRockyOblateness({
  massEarth,
  radiusKm,
  rotationPeriodHours,
  cmfPct = 32.5,
  wmfPct = 0,
}) {
  const massKg = planetMassEarthToKg(Math.max(Number(massEarth) || 0, 0));
  const radiusM = Math.max(Number(radiusKm) || 0, 0) * 1000;
  const rotationHours = Math.max(Number(rotationPeriodHours) || 0, 0);
  if (massKg <= 0 || radiusM <= 0 || rotationHours <= 0) {
    return {
      flattening: 0,
      equatorialRadiusKm: Math.max(Number(radiusKm) || 0, 0),
      polarRadiusKm: Math.max(Number(radiusKm) || 0, 0),
      j2: 0,
      rotationalParameterQ: 0,
      momentOfInertiaFactor: 0.33,
    };
  }

  const omega = (2 * Math.PI) / (rotationHours * 3600);
  const rotationalParameterQ = (omega ** 2 * radiusM ** 3) / (G * massKg);
  const cmf = clampUnit((Number(cmfPct) || 0) / 100);
  const wmf = clampUnit((Number(wmfPct) || 0) / 100, 0, 0.5);
  const lowMassBonus = 0.05 * (1 - Math.min(Math.max(Number(massEarth) || 0, 0), 1) ** 0.2);
  const momentOfInertiaFactor = Math.min(
    Math.max(0.4 - 0.12 * Math.sqrt(cmf) + 0.03 * Math.sqrt(wmf) + lowMassBonus, 0.3),
    0.4,
  );

  // Darwin-Radau-inspired hydrostatic estimate for rotational flattening.
  const radauTerm = 2.5 * (1 - 1.5 * momentOfInertiaFactor);
  const flattening = Math.min(
    Math.max((5 * rotationalParameterQ) / (2 * (1 + radauTerm ** 2)), 0),
    0.2,
  );
  const equatorialRadiusKm = radiusKm * (1 + flattening / 3);
  const polarRadiusKm = radiusKm * (1 - (2 * flattening) / 3);
  const j2 = Math.max((2 * flattening - rotationalParameterQ) / 3, 0);

  return {
    flattening,
    equatorialRadiusKm,
    polarRadiusKm,
    j2,
    rotationalParameterQ,
    momentOfInertiaFactor,
  };
}
