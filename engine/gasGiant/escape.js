import { evaluateJeansEscapeSpecies } from "../physics/escape.js";
import { auToKilometers } from "../physics/orbital.js";
import { computeStarXuvFluxAtOrbitErgCm2S, computeStarXuvFluxRatioEarth } from "../star.js";
import { round } from "../utils.js";

const G = 6.674e-11;
const JUPITER_MASS_KG = 1.8982e27;
const MSOL_PER_MJUP = 1047.35;
const S_PER_GYR = 3.156e16;

const HEATING_EFFICIENCY = 0.15;
const MW_H2 = 0.002;
const MW_HE = 0.004;
const MW_CH4 = 0.016;
const MW_NH3 = 0.017;
const MW_H2O = 0.018;
const MW_CO = 0.028;

const GG_EXOBASE_BASE_K = 200;
const GG_EXOBASE_XUV_COEFF = 3.5;
const GG_EXOBASE_MAX_K = 10000;
const EARTH_REFERENCE_XUV_FLUX_ERG_CM2_S = 4.64;

const GAS_SPECIES = [
  { key: "h2", label: "H\u2082", mw: MW_H2 },
  { key: "he", label: "He", mw: MW_HE },
  { key: "ch4", label: "CH\u2084", mw: MW_CH4 },
  { key: "nh3", label: "NH\u2083", mw: MW_NH3 },
  { key: "h2o", label: "H\u2082O", mw: MW_H2O },
  { key: "co", label: "CO", mw: MW_CO },
];

function gasGiantNonThermalFactors({ massLossRateKgS = 0 } = {}) {
  const escapeRate = Math.max(Number(massLossRateKgS) || 0, 0);
  const heFactor = escapeRate >= 2e5 ? 5.0 : escapeRate >= 1e5 ? 3.4 : 2.5;
  return [
    { maxMw: MW_H2, factor: 4.0 },
    { maxMw: MW_HE, factor: heFactor },
  ];
}

export function calcMassLoss(
  massMjup,
  radiusKm,
  orbitAu,
  starMassMsol,
  starLuminosityLsol,
  starAgeGyr,
  extraXuvFluxRatioEarth = 0,
  hostXuvFluxRatioAt1Au = null,
) {
  const massKg = massMjup * JUPITER_MASS_KG;
  const radiusM = radiusKm * 1000;
  const resolvedHostXuvFluxRatioAt1Au = Number(hostXuvFluxRatioAt1Au);
  const hostXuvFluxRatioEarth =
    Number.isFinite(resolvedHostXuvFluxRatioAt1Au) && resolvedHostXuvFluxRatioAt1Au > 0
      ? resolvedHostXuvFluxRatioAt1Au / Math.max(Number(orbitAu) || 0, 0.01) ** 2
      : computeStarXuvFluxRatioEarth({
          massMsol: starMassMsol,
          luminosityLsol: starLuminosityLsol,
          ageGyr: starAgeGyr,
          orbitAu,
        });
  const fXuvAtOrbit =
    hostXuvFluxRatioEarth * EARTH_REFERENCE_XUV_FLUX_ERG_CM2_S ||
    computeStarXuvFluxAtOrbitErgCm2S({
      massMsol: starMassMsol,
      luminosityLsol: starLuminosityLsol,
      ageGyr: starAgeGyr,
      orbitAu,
    });
  const totalXuvFluxErgCm2S =
    fXuvAtOrbit +
    Math.max(0, Number(extraXuvFluxRatioEarth) || 0) * EARTH_REFERENCE_XUV_FLUX_ERG_CM2_S;
  const fXuvSI = totalXuvFluxErgCm2S * 1e-3;
  const massLossKgS = (HEATING_EFFICIENCY * Math.PI * radiusM ** 3 * fXuvSI) / (G * massKg);
  const evapTimescaleGyr = massKg / Math.max(massLossKgS, 1e-30) / S_PER_GYR;
  const starMassMjup = starMassMsol * MSOL_PER_MJUP;
  const rocheLobeKm = 0.462 * auToKilometers(orbitAu) * (massMjup / (3 * starMassMjup)) ** (1 / 3);
  const rocheOverflow = radiusKm > rocheLobeKm;
  return {
    massLossRateKgS: massLossKgS,
    evaporationTimescaleGyr: round(Math.min(evapTimescaleGyr, 1e12), 3),
    xuvFluxErgCm2S: round(totalXuvFluxErgCm2S, 4),
    xuvFluxRatioEarth: hostXuvFluxRatioEarth + Math.max(0, Number(extraXuvFluxRatioEarth) || 0),
    rocheLobeRadiusKm: round(rocheLobeKm, 0),
    rocheLobeOverflow: rocheOverflow,
  };
}

export function computeGasGiantExobaseTemp(tEffK, fXuvRatio) {
  if (tEffK <= 0) return 0;
  const base = Math.max(tEffK, GG_EXOBASE_BASE_K);
  return Math.min(
    base * (1 + GG_EXOBASE_XUV_COEFF * Math.sqrt(Math.max(0, fXuvRatio))),
    GG_EXOBASE_MAX_K,
  );
}

export function computeGasGiantJeansEscape(escapeVelocityKms, exobaseTempK, options = {}) {
  return evaluateJeansEscapeSpecies({
    escapeVelocityKms,
    exobaseTempK,
    gasSpecies: GAS_SPECIES,
    nonThermalFactors: gasGiantNonThermalFactors(options),
    lambdaDigits: 1,
  });
}
