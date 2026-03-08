// SPDX-License-Identifier: MPL-2.0
// Long-term persistence multiplier for unified PHI.

import { clamp, toFinite } from "../utils.js";
import { normalizeHabitabilityContext } from "./schema.js";

const HEAVY_SPECIES = ["n2", "o2", "co2", "ar"];

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
  return clamp(1 - Math.abs(Math.log10(Math.max(pressure, 0.01))) / 2, 0, 1);
}

function retainedHeavySpeciesScore(pressureAtm, jeansEscapeSpecies = {}) {
  if (Math.max(toFinite(pressureAtm, 0), 0) <= 0) return 0;
  const retained = HEAVY_SPECIES.reduce((count, species) => {
    const status = jeansEscapeSpecies?.[species]?.status;
    return status && status !== "Lost" ? count + 1 : count;
  }, 0);
  return retained / HEAVY_SPECIES.length;
}

function tidalPersistenceScore(tidalHeatingEarth) {
  const tidal = Math.max(toFinite(tidalHeatingEarth, 0), 0);
  if (tidal <= 0.05) return 1;
  if (tidal <= 1) return 0.95;
  if (tidal <= 10) return 0.7;
  if (tidal <= 100) return 0.4;
  return 0.2;
}

export function computeHabitabilityPersistenceModel(context = {}, { stabilityFloor = 0 } = {}) {
  const normalized = normalizeHabitabilityContext(context);
  const surface = normalized.surface;
  const chemistry = normalized.chemistry;
  const climate = normalized.climate;
  const energy = normalized.energy;
  const environment = normalized.environment;

  const ageScore = ageMaturityScore(environment.stellarAgeGyr);
  const xuvScore = xuvPersistenceScore(energy.xuvFluxRatio);
  const atmosphericEscapeScore = weightedMean(
    [
      pressureWindowScore(surface.pressureAtm),
      retainedHeavySpeciesScore(surface.pressureAtm, chemistry.jeansEscapeSpecies),
      xuvScore,
    ],
    [0.35, 0.4, 0.25],
  );
  const climatePersistenceScore = clamp(
    Math.max(toFinite(climate.stabilityMultiplier, 0), toFinite(stabilityFloor, 0)) *
      clamp(toFinite(climate.collapsePenalty, 1), 0, 1),
    0,
    1,
  );
  const tidalScore = tidalPersistenceScore(energy.tidalHeatingEarth);
  const multiplier = weightedMean(
    [ageScore, xuvScore, atmosphericEscapeScore, climatePersistenceScore, tidalScore],
    [0.2, 0.2, 0.25, 0.2, 0.15],
  );

  return {
    multiplier: clamp(multiplier, 0, 1),
    modelVersion: "persistence-v1",
    breakdown: {
      ageScore,
      xuvScore,
      atmosphericEscapeScore,
      climatePersistenceScore,
      tidalScore,
    },
  };
}
