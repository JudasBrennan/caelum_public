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
  const multiplier = weightedMean(
    [ageScore, xuvScore, escapeScore, resolvedPathwayPersistenceScore, tidalScore],
    [0.2, 0.2, 0.25, 0.2, 0.15],
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
    },
  };
}
