import { escapeTimescaleSeconds } from "../utils.js";
import { computeStarXuvFluxAtOrbitErgCm2S, computeStarXuvFluxRatioEarth } from "../star.js";

const DEFAULT_JEANS_RETAINED = 6;
const DEFAULT_JEANS_MARGINAL = 3;
const DEFAULT_NON_THERMAL_TEMP_FLOOR_K = 100;
const DEFAULT_NON_THERMAL_FACTORS = [
  { maxMw: 0.002, factor: 3.0 },
  { maxMw: 0.004, factor: 5.0 },
];

function roundToDigits(value, digits) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function nonThermalThresholdFactor(molecularWeight, nonThermalFactors) {
  for (const rule of nonThermalFactors) {
    if (molecularWeight <= rule.maxMw) return rule.factor;
  }
  return 1;
}

export function xuvFluxAtOrbitErgCm2S({
  starMassMsol = 1,
  starLuminosityLsol,
  starAgeGyr,
  orbitAu,
}) {
  return computeStarXuvFluxAtOrbitErgCm2S({
    massMsol: starMassMsol,
    luminosityLsol: starLuminosityLsol,
    ageGyr: starAgeGyr,
    orbitAu,
  });
}

export function xuvFluxRatioEarth(options) {
  return computeStarXuvFluxRatioEarth({
    massMsol: options.starMassMsol ?? 1,
    luminosityLsol: options.starLuminosityLsol,
    ageGyr: options.starAgeGyr,
    orbitAu: options.orbitAu,
  });
}

export function jeansStatus(
  lambda,
  { retainedThreshold = DEFAULT_JEANS_RETAINED, marginalThreshold = DEFAULT_JEANS_MARGINAL } = {},
) {
  if (lambda >= retainedThreshold) return "Retained";
  if (lambda >= marginalThreshold) return "Marginal";
  return "Lost";
}

export function effectiveJeansStatus({
  lambda,
  molecularWeight,
  exobaseTempK,
  retainedThreshold = DEFAULT_JEANS_RETAINED,
  marginalThreshold = DEFAULT_JEANS_MARGINAL,
  nonThermalTempFloorK = DEFAULT_NON_THERMAL_TEMP_FLOOR_K,
  nonThermalFactors = DEFAULT_NON_THERMAL_FACTORS,
}) {
  const thermal = jeansStatus(lambda, {
    retainedThreshold,
    marginalThreshold,
  });
  if (exobaseTempK <= nonThermalTempFloorK) return thermal;
  const factor = nonThermalThresholdFactor(molecularWeight, nonThermalFactors);
  if (factor <= 1) return thermal;
  return jeansStatus(lambda, {
    retainedThreshold: retainedThreshold * factor,
    marginalThreshold: marginalThreshold * factor,
  });
}

export function evaluateJeansEscapeSpecies({
  escapeVelocityKms,
  exobaseTempK,
  gasSpecies,
  retainedThreshold = DEFAULT_JEANS_RETAINED,
  marginalThreshold = DEFAULT_JEANS_MARGINAL,
  nonThermalTempFloorK = DEFAULT_NON_THERMAL_TEMP_FLOOR_K,
  nonThermalFactors = DEFAULT_NON_THERMAL_FACTORS,
  lambdaDigits = null,
}) {
  const escapeVelocityMs = escapeVelocityKms * 1000;
  const escapeVelocitySquared = escapeVelocityMs * escapeVelocityMs;
  const denominator = 2 * 8.3145 * Math.max(exobaseTempK, 1);
  const species = {};

  for (const gas of gasSpecies) {
    const lambda = (escapeVelocitySquared * gas.mw) / denominator;
    const thermal = jeansStatus(lambda, {
      retainedThreshold,
      marginalThreshold,
    });
    const status = effectiveJeansStatus({
      lambda,
      molecularWeight: gas.mw,
      exobaseTempK,
      retainedThreshold,
      marginalThreshold,
      nonThermalTempFloorK,
      nonThermalFactors,
    });

    species[gas.key] = {
      lambda: Number.isInteger(lambdaDigits) ? roundToDigits(lambda, lambdaDigits) : lambda,
      thermalStatus: thermal,
      status,
      nonThermal: status !== thermal,
      label: gas.label,
    };
  }

  return species;
}

export function evaluateVolatileRetention({
  pressurePa,
  gravityMs2,
  massAmu,
  tempK,
  lambda,
  ageGyr,
  minimumLambdaExclusive = DEFAULT_JEANS_RETAINED,
}) {
  if (!(lambda > minimumLambdaExclusive)) {
    return { retained: false, escapeSeconds: 0 };
  }

  const escapeSeconds = escapeTimescaleSeconds(pressurePa, gravityMs2, massAmu, tempK, lambda);
  return {
    retained: escapeSeconds > Math.max(0, ageGyr) * 3.156e16,
    escapeSeconds,
  };
}
