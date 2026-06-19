import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

export const STELLAR_HISTORY_DOSE_MODEL_VERSION = "stellar-history-dose-context-v1";

const SOURCE_KEYS = ["stellarHistoryDose"];
const EARTH_HISTORY_XUV_DOSE_NORMALISER = (1 * 4.5 + 10 * 0.1) / 4.6;

function finiteNonNegative(value, fallback = 0) {
  return Math.max(0, toFinite(value, fallback));
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function logRangeScore(value, lower, upper) {
  const number = finiteNonNegative(value, 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const low = Math.log10(Math.max(lower, 1e-30));
  const high = Math.log10(Math.max(upper, lower * 1.0001));
  return clamp((Math.log10(Math.max(number, 1e-30)) - low) / (high - low), 0, 1);
}

function saturationDurationGyr(starMassMsol) {
  const mass = Math.max(toFinite(starMassMsol, 1), 0.08);
  if (mass < 0.2) return 1.5;
  if (mass < 0.35) return 1.0;
  if (mass < 0.6) return 0.45;
  if (mass < 0.9) return 0.18;
  return 0.1;
}

function saturatedXuvAt1Au(starMassMsol) {
  const mass = Math.max(toFinite(starMassMsol, 1), 0.08);
  if (mass < 0.2) return 100;
  if (mass < 0.35) return 75;
  if (mass < 0.6) return 45;
  if (mass < 0.9) return 20;
  return 10;
}

function preMainSequenceDurationGyr(starMassMsol) {
  const mass = Math.max(toFinite(starMassMsol, 1), 0.08);
  if (mass < 0.2) return 1.8;
  if (mass < 0.35) return 1.2;
  if (mass < 0.6) return 0.45;
  if (mass < 0.9) return 0.12;
  return 0.05;
}

function durationClass(durationGyr) {
  return scoreToClass(logRangeScore(durationGyr, 0.05, 1.5), {
    high: "prolonged-saturation",
    medium: "extended-saturation",
    low: "short-saturation",
    none: "brief-saturation",
    highAt: 0.72,
    mediumAt: 0.38,
    lowAt: 0.08,
  });
}

function exposureClass(score) {
  return scoreToClass(score, {
    high: "extreme-exposure",
    medium: "high-exposure",
    low: "moderate-exposure",
    none: "low-exposure",
    highAt: 0.72,
    mediumAt: 0.44,
    lowAt: 0.16,
  });
}

function riskClass(score, noun) {
  return scoreToClass(score, {
    high: `high ${noun} risk`,
    medium: `moderate ${noun} risk`,
    low: `low ${noun} risk`,
    none: `minimal ${noun} risk`,
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.16,
  });
}

function unsupportedEvolutionMode(mode) {
  const text = String(mode || "").toLowerCase();
  if (!text || text === "zams" || text === "main-sequence" || text === "mainsequence") {
    return false;
  }
  return true;
}

export function buildStellarHistoryDoseContext({
  starMassMsol = 1,
  starAgeGyr = 4.6,
  starLuminosityLsol = 1,
  starEvolutionMode = "zams",
  presentXuvEarthAtOrbit = 1,
  windPressureEarthAtOrbit = 1,
  orbitAu = 1,
  eccentricity = 0,
  massEarth = 1,
  gravityG = 1,
  escapeVelocityKms = 11.2,
  atmospherePressureAtm = 1,
  hydrosphere = null,
} = {}) {
  const assumptions = [
    "Stellar history dose is a bounded relative fluence screen, not a stellar evolution grid.",
  ];
  const limitingFactors = [];
  const mass = Math.max(toFinite(starMassMsol, 1), 0.08);
  const age = finiteNonNegative(starAgeGyr, 4.6);
  const luminosity = finiteNonNegative(starLuminosityLsol, 1);
  const orbit = Math.max(toFinite(orbitAu, 1), 0.01);
  const ecc = clamp(toFinite(eccentricity, 0), 0, 0.99);
  const meanInverseSquareFactor = 1 / (orbit ** 2 * Math.sqrt(1 - ecc ** 2));
  const currentXuv = finiteNonNegative(presentXuvEarthAtOrbit, 1);
  const currentWind = finiteNonNegative(windPressureEarthAtOrbit, 0);
  const saturationDuration = saturationDurationGyr(mass);
  const saturationWindow = Math.min(age, saturationDuration);
  const saturatedXuvAtOrbit = saturatedXuvAt1Au(mass) * meanInverseSquareFactor;
  const currentWindow = Math.max(age - saturationWindow, 0);
  const meanHistoryXuv =
    age > 0
      ? (currentXuv * currentWindow + saturatedXuvAtOrbit * saturationWindow) / age
      : saturatedXuvAtOrbit;
  const integratedXuvDoseEarth = clamp(
    meanHistoryXuv / EARTH_HISTORY_XUV_DOSE_NORMALISER,
    0,
    1_000_000,
  );

  const preMainSequenceDuration = preMainSequenceDurationGyr(mass);
  const preMainSequenceExposureScore = clamp(
    0.65 * logRangeScore(preMainSequenceDuration * meanInverseSquareFactor * luminosity, 0.05, 80) +
      0.35 * logRangeScore(saturatedXuvAtOrbit, 5, 5000),
    0,
    1,
  );
  const windErosionDoseScore = clamp(
    0.7 * logRangeScore(currentWind, 1, 300) +
      0.3 * logRangeScore(currentWind * Math.max(age, 0.1), 0.5, 600),
    0,
    1,
  );
  const escapeShield = clamp(
    0.6 * clamp(toFinite(escapeVelocityKms, 11.2) / 11.2, 0, 2) +
      0.25 * clamp(toFinite(gravityG, 1), 0, 2) +
      0.15 * logRangeScore(massEarth, 0.1, 10),
    0,
    1.6,
  );
  const pressureShield = logRangeScore(atmospherePressureAtm, 0.01, 10);
  const surfaceLiquid = Math.max(
    fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0),
    fraction(hydrosphere?.liquidOceanFraction, 0),
  );
  const steamFraction = fraction(hydrosphere?.steamFraction, 0);
  const waterInventoryCue = Math.max(
    surfaceLiquid,
    steamFraction,
    fraction(hydrosphere?.permanentIceFraction, 0) * 0.5,
    fraction(hydrosphere?.subsurfaceOceanScore, 0) * 0.45,
  );
  const doseScore = logRangeScore(integratedXuvDoseEarth, 1, 1000);
  const presentXuvScore = logRangeScore(currentXuv, 1, 100);
  const waterLossRiskScore = clamp(
    0.42 * doseScore +
      0.24 * preMainSequenceExposureScore +
      0.18 * presentXuvScore +
      0.12 * windErosionDoseScore +
      0.1 * steamFraction -
      0.16 * Math.min(escapeShield, 1.2) -
      0.12 * pressureShield +
      0.08 * (waterInventoryCue > 0 ? 1 : 0.35),
    0,
    1,
  );
  const abioticOxygenRiskScore = clamp(
    0.62 * waterLossRiskScore +
      0.22 * doseScore +
      0.16 * preMainSequenceExposureScore -
      0.18 * surfaceLiquid -
      0.08 * pressureShield,
    0,
    1,
  );

  if (unsupportedEvolutionMode(starEvolutionMode)) {
    limitingFactors.push(
      "Non-main-sequence evolution mode is only flagged; no full evolved-star fluence track is solved.",
    );
  }
  if (age <= 0) limitingFactors.push("Star age is unavailable, so dose is a present-state proxy.");
  if (currentWind <= 0) assumptions.push("Wind history is unavailable or zero in current forcing.");

  const confidence =
    unsupportedEvolutionMode(starEvolutionMode) || age <= 0
      ? CONFIDENCE.LOW
      : currentXuv > 0
        ? CONFIDENCE.MEDIUM
        : CONFIDENCE.LOW;

  return makeContext({
    modelVersion: STELLAR_HISTORY_DOSE_MODEL_VERSION,
    status: CONTEXT_STATUS.SUPPORTED,
    confidence,
    inputs: {
      starMassMsol: roundMaybe(mass, 3),
      starAgeGyr: roundMaybe(age, 3),
      starLuminosityLsol: roundMaybe(luminosity, 6),
      starEvolutionMode: String(starEvolutionMode || "zams"),
      presentXuvEarthAtOrbit: roundMaybe(currentXuv, 4),
      windPressureEarthAtOrbit: roundMaybe(currentWind, 4),
      orbitAu: roundMaybe(orbit, 6),
      eccentricity: roundMaybe(ecc, 4),
      escapeVelocityKms: roundMaybe(escapeVelocityKms, 3),
      atmospherePressureAtm: roundMaybe(atmospherePressureAtm, 6),
    },
    outputs: {
      saturatedXuvDurationGyr: round(saturationDuration, 3),
      saturatedXuvDurationClass: durationClass(saturationDuration),
      integratedXuvDoseEarth: round(integratedXuvDoseEarth, integratedXuvDoseEarth < 10 ? 3 : 1),
      preMainSequenceExposureClass: exposureClass(preMainSequenceExposureScore),
      preMainSequenceExposureScore: round(preMainSequenceExposureScore, 3),
      windErosionDoseClass: exposureClass(windErosionDoseScore),
      windErosionDoseScore: round(windErosionDoseScore, 3),
      waterLossRiskClass: riskClass(waterLossRiskScore, "water-loss"),
      waterLossRiskScore: round(waterLossRiskScore, 3),
      abioticOxygenRiskClass: riskClass(abioticOxygenRiskScore, "abiotic oxygen"),
      abioticOxygenRiskScore: round(abioticOxygenRiskScore, 3),
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
