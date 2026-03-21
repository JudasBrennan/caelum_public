import {
  calcEquilibriumFourthPowerFromFluxWm2,
  calcEquilibriumTemperatureFromFluxK,
  calcStellarFluxWm2,
} from "../physics/radiative.js";
import { earthMassToKg } from "../physics/orbital.js";

const STEFAN_BOLTZ = 5.6704e-8;
const EARTH_INTERNAL_HEAT_W = 44e12;
const KG_PER_MEARTH = earthMassToKg(1);

export function computeMoonTemperature({
  albedo,
  planetSemiMajorAxisAu,
  starLuminosityLsol,
  extraFluxEarth = 0,
  surfaceAreaM2,
  moonMassKg,
  radioisotopeAbundance,
  tidalHeatingWm2,
  parentReflectedFluxWm2 = 0,
  parentThermalFluxWm2 = 0,
  eclipseCoolingPenalty = 0,
  greenhouseTauEquivalent = 0,
  antiGreenhouseFraction = 0,
}) {
  const stellarFluxAtDistanceWm2 =
    calcStellarFluxWm2({
      starLuminosityLsol,
      orbitalDistanceAu: planetSemiMajorAxisAu,
    }) +
    calcStellarFluxWm2({
      starLuminosityLsol: Math.max(extraFluxEarth, 0) * Math.max(planetSemiMajorAxisAu, 0.01) ** 2,
      orbitalDistanceAu: planetSemiMajorAxisAu,
    });
  const eclipsePenalty = clampPenalty(eclipseCoolingPenalty);
  const effectiveStellarFluxWm2 = stellarFluxAtDistanceWm2 * (1 - eclipsePenalty);
  const equilibriumFourthPower = calcEquilibriumFourthPowerFromFluxWm2({
    stellarFluxAtDistanceWm2: effectiveStellarFluxWm2,
    albedoBond: albedo,
    redistributionFactor: 4,
  });
  const equilibriumK = calcEquilibriumTemperatureFromFluxK({
    stellarFluxAtDistanceWm2: effectiveStellarFluxWm2,
    albedoBond: albedo,
    redistributionFactor: 4,
  });

  const radiogenicWm2 =
    surfaceAreaM2 > 0
      ? (EARTH_INTERNAL_HEAT_W * (moonMassKg / KG_PER_MEARTH) * radioisotopeAbundance) /
        surfaceAreaM2
      : 0;

  const antiGreenhouse = Math.max(0, Math.min(1, antiGreenhouseFraction));
  const greenhouseTau = Math.max(0, greenhouseTauEquivalent);
  const reflectedFourthPower = (Math.max(0, parentReflectedFluxWm2) * (1 - albedo)) / STEFAN_BOLTZ;
  const thermalFourthPower = Math.max(0, parentThermalFluxWm2) / STEFAN_BOLTZ;
  const adjustedRadiativeFourthPower =
    (equilibriumFourthPower + reflectedFourthPower + thermalFourthPower) *
    (1 - antiGreenhouse) *
    (1 + (3 * greenhouseTau) / 4);
  const surfaceFourthPower =
    adjustedRadiativeFourthPower + tidalHeatingWm2 / STEFAN_BOLTZ + radiogenicWm2 / STEFAN_BOLTZ;
  const surfaceK =
    surfaceFourthPower > 0 ? Math.round(Math.sqrt(Math.sqrt(surfaceFourthPower))) : 0;

  return {
    equilibriumK,
    surfaceK,
    surfaceC: surfaceK - 273,
    radiogenicWm2,
    greenhouseTauEquivalent: greenhouseTau,
    antiGreenhouseFraction: antiGreenhouse,
    parentReflectedFluxWm2: Math.max(0, parentReflectedFluxWm2),
    parentThermalFluxWm2: Math.max(0, parentThermalFluxWm2),
    eclipseCoolingPenalty: eclipsePenalty,
  };
}

function clampPenalty(value) {
  return Math.max(0, Math.min(0.5, Number.isFinite(value) ? value : 0));
}
