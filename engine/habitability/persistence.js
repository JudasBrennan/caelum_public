// Long-term persistence multiplier for WorldSmith habitability.

import { clamp, toFinite } from "../utils.js";
import { normalizeHabitabilityContext } from "./schema.js";

function weightedMean(values = [], weights = []) {
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = clamp(toFinite(values[index], 0), 0, 1);
    const weight = Math.max(toFinite(weights[index], 0), 0);
    numerator += value * weight;
    denominator += weight;
  }
  return denominator > 0 ? numerator / denominator : 0;
}

function ageMaturityScore(ageGyr) {
  const age = Math.max(toFinite(ageGyr, 0), 0);
  if (age < 0.3) return 0.2;
  if (age < 1.5) return 0.2 + ((age - 0.3) / 1.2) * 0.5;
  if (age <= 8) return 0.7 + ((Math.min(age, 4) - 1.5) / 2.5) * 0.3;
  if (age <= 12) return 1 - ((age - 8) / 4) * 0.15;
  return 0.85 - Math.min((age - 12) / 8, 1) * 0.25;
}

function xuvPersistenceScore(xuvFluxRatio) {
  const xuv = Math.max(toFinite(xuvFluxRatio, 0), 0);
  if (xuv <= 1) return 1;
  return clamp(1 - Math.log10(Math.max(xuv, 1)) / 3, 0.2, 1);
}

function pressureWindowScore(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0) return 0;
  return clamp(1 - Math.abs(Math.log10(Math.max(pressure, 0.01))) / 2.2, 0, 1);
}

function retainedHeavySpeciesScore(jeansEscapeSpecies = {}) {
  const keys = ["n2", "o2", "co2", "ar"];
  const retained = keys.reduce((count, key) => {
    const status = jeansEscapeSpecies?.[key]?.status;
    return status && status !== "Lost" ? count + 1 : count;
  }, 0);
  return retained / keys.length;
}

function includesText(value, needle) {
  return String(value || "")
    .toLowerCase()
    .includes(String(needle || "").toLowerCase());
}

function atmosphereEvolutionPersistenceScore(environment = {}) {
  const pressureTrend = environment.atmosphereEvolutionPressureTrendClass;
  const volatileLoss = environment.atmosphereEvolutionVolatileLossRiskClass;
  const lifetime = environment.atmosphereEvolutionLifetimeClass;
  const composition = environment.atmosphereEvolutionCompositionStabilityClass;
  if (!pressureTrend && !volatileLoss && !lifetime && !composition) return null;

  let score = 1;
  if (includesText(pressureTrend, "rapid") || includesText(pressureTrend, "no durable")) {
    score = Math.min(score, 0.25);
  } else if (includesText(pressureTrend, "declin")) {
    score = Math.min(score, 0.48);
  } else if (includesText(pressureTrend, "balanced")) {
    score = Math.min(score, 0.82);
  }

  if (includesText(volatileLoss, "high")) score = Math.min(score, 0.36);
  else if (includesText(volatileLoss, "moderate")) score = Math.min(score, 0.65);
  else if (includesText(volatileLoss, "low")) score = Math.min(score, 0.86);

  if (includesText(lifetime, "none")) score = Math.min(score, 0.2);
  else if (includesText(lifetime, "rapid") || includesText(lifetime, "transient")) {
    score = Math.min(score, 0.45);
  } else if (includesText(lifetime, "short")) {
    score = Math.min(score, 0.58);
  }

  if (includesText(composition, "escape-sensitive")) score = Math.min(score, 0.68);
  if (includesText(composition, "surface-buffered")) score = Math.max(score, 0.75);
  return clamp(score, 0, 1);
}

function stellarHistoryPersistenceScore(environment = {}) {
  const rawDose = Number(environment.stellarHistoryIntegratedXuvDoseEarth);
  const hasDose = Number.isFinite(rawDose);
  const dose = Math.max(hasDose ? rawDose : 1, 0);
  const waterLossScore = clamp(toFinite(environment.stellarHistoryWaterLossRiskScore, 0), 0, 1);
  const abioticOxygenScore = clamp(
    toFinite(environment.stellarHistoryAbioticOxygenRiskScore, 0),
    0,
    1,
  );
  const waterLossClass = environment.stellarHistoryWaterLossRiskClass;
  const abioticClass = environment.stellarHistoryAbioticOxygenRiskClass;
  if (
    !hasDose &&
    !waterLossClass &&
    !abioticClass &&
    waterLossScore <= 0 &&
    abioticOxygenScore <= 0
  ) {
    return null;
  }

  let score = 1 - 0.55 * waterLossScore - 0.3 * abioticOxygenScore;
  if (dose > 1) score = Math.min(score, xuvPersistenceScore(dose));
  if (includesText(waterLossClass, "high") || includesText(abioticClass, "high")) {
    score = Math.min(score, 0.38);
  } else if (includesText(waterLossClass, "moderate") || includesText(abioticClass, "moderate")) {
    score = Math.min(score, 0.68);
  }
  return clamp(score, 0.15, 1);
}

function confidenceRank(value) {
  return { high: 3, medium: 2, low: 1, unknown: 0 }[String(value || "unknown")] ?? 0;
}

function dynamicalVariabilityPersistenceScore(environment = {}) {
  const riskClass = String(environment.dynamicalVariabilityRiskClass || "").toLowerCase();
  const warning = String(environment.dynamicalVariabilityWarning || "").toLowerCase();
  const confidence = String(environment.dynamicalVariabilityConfidence || "unknown");
  const explicitModifier = Number(environment.dynamicalVariabilityPersistenceModifier);
  if (!riskClass && !warning && !Number.isFinite(explicitModifier)) return null;
  if (confidenceRank(confidence) < confidenceRank("medium")) return null;
  if (Number.isFinite(explicitModifier)) return clamp(explicitModifier, 0, 1);
  if (riskClass === "high" || warning.includes("high")) return 0.82;
  if (riskClass === "moderate" || warning.includes("seasonal")) return 0.9;
  if (riskClass === "low") return 0.96;
  return 1;
}

function tidalPersistenceScore(tidalHeatingEarth) {
  const tidal = Math.max(toFinite(tidalHeatingEarth, 0), 0);
  if (tidal <= 0.05) return 1;
  if (tidal <= 1) return 0.95;
  if (tidal <= 10) return 0.7;
  if (tidal <= 100) return 0.4;
  return 0.2;
}

export function computeHabitabilityPersistenceModel(
  context = {},
  { selectedPathway = "none", pathwayPersistenceScore = 0 } = {},
) {
  const normalized = normalizeHabitabilityContext(context);
  const surface = normalized.surface;
  const chemistry = normalized.chemistry;
  const climate = normalized.climate;
  const energy = normalized.energy;
  const environment = normalized.environment;

  const ageScore = ageMaturityScore(environment.stellarAgeGyr);
  const xuvScore = xuvPersistenceScore(energy.xuvFluxRatio);
  const escapeScore = weightedMean(
    [
      pressureWindowScore(surface.pressureAtm),
      retainedHeavySpeciesScore(chemistry.jeansEscapeSpecies),
    ],
    [0.45, 0.55],
  );
  const resolvedPathwayPersistenceScore =
    selectedPathway === "none"
      ? clamp(toFinite(climate.stabilityMultiplier, 0), 0, 1)
      : clamp(toFinite(pathwayPersistenceScore, 0), 0, 1);
  const tidalScore = tidalPersistenceScore(energy.tidalHeatingEarth);
  const atmosphereEvolutionScore = atmosphereEvolutionPersistenceScore(environment);
  const stellarHistoryScore = stellarHistoryPersistenceScore(environment);
  const dynamicalVariabilityScore = dynamicalVariabilityPersistenceScore(environment);
  const multiplier = weightedMean(
    [
      ageScore,
      xuvScore,
      escapeScore,
      resolvedPathwayPersistenceScore,
      tidalScore,
      atmosphereEvolutionScore ?? escapeScore,
      stellarHistoryScore ?? xuvScore,
      dynamicalVariabilityScore ?? resolvedPathwayPersistenceScore,
    ],
    [
      0.17,
      0.15,
      0.2,
      0.17,
      0.12,
      atmosphereEvolutionScore == null ? 0 : 0.11,
      stellarHistoryScore == null ? 0 : 0.08,
      dynamicalVariabilityScore == null ? 0 : 0.05,
    ],
  );

  return {
    multiplier: clamp(multiplier, 0, 1),
    modelVersion: "persistence-v2",
    breakdown: {
      ageScore,
      xuvScore,
      escapeScore,
      climatePersistenceScore: resolvedPathwayPersistenceScore,
      pathwayPersistenceScore: resolvedPathwayPersistenceScore,
      tidalScore,
      atmosphereEvolutionScore,
      stellarHistoryScore,
      dynamicalVariabilityScore,
    },
  };
}
