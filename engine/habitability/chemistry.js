// SPDX-License-Identifier: MPL-2.0
// Unified chemistry and photochemistry scoring for PHI.

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

function redoxScoreForOxidation(mantleOxidationKey) {
  switch (String(mantleOxidationKey || "earth")) {
    case "earth":
      return 1;
    case "oxidized":
      return 0.85;
    case "reduced":
      return 0.7;
    case "highly-reduced":
      return 0.55;
    default:
      return 0.75;
  }
}

function volatileInventoryPresenceScore(
  atmosphereComposition = {},
  volatileInventory = [],
  surfaceAccessibleLiquidFraction = 0,
) {
  const waterPresent =
    Math.max(toFinite(surfaceAccessibleLiquidFraction, 0), 0) > 0 ||
    Math.max(toFinite(atmosphereComposition.h2o, 0), 0) > 0 ||
    volatileInventory.some((entry) => entry?.species === "H₂O" && entry?.present);
  const carbonPresent =
    Math.max(toFinite(atmosphereComposition.co2, 0), 0) > 0 ||
    Math.max(toFinite(atmosphereComposition.ch4, 0), 0) > 0 ||
    volatileInventory.some(
      (entry) => (entry?.species === "CO₂" || entry?.species === "CH₄") && entry?.present,
    );
  const nitrogenPresent =
    Math.max(toFinite(atmosphereComposition.n2, 0), 0) > 0 ||
    Math.max(toFinite(atmosphereComposition.nh3, 0), 0) > 0 ||
    volatileInventory.some(
      (entry) => (entry?.species === "N₂" || entry?.species === "NH₃") && entry?.present,
    );

  return clamp(
    (waterPresent ? 0.4 : 0) + (carbonPresent ? 0.3 : 0) + (nitrogenPresent ? 0.3 : 0),
    0,
    1,
  );
}

export function computeHabitabilityChemistryModel(context = {}) {
  const normalized = normalizeHabitabilityContext(context);
  const surface = normalized.surface;
  const chemistry = normalized.chemistry;
  const energy = normalized.energy;
  const atmosphereComposition = chemistry.atmosphereComposition || {};
  const volatileInventory = Array.isArray(chemistry.volatileInventory)
    ? chemistry.volatileInventory
    : [];
  const pressureScore = pressureWindowScore(surface.pressureAtm);
  const atmosphereRetentionScore = weightedMean(
    [pressureScore, retainedHeavySpeciesScore(surface.pressureAtm, chemistry.jeansEscapeSpecies)],
    [0.55, 0.45],
  );
  const volatileInventoryScore = volatileInventoryPresenceScore(
    atmosphereComposition,
    volatileInventory,
    surface.surfaceAccessibleLiquidFraction,
  );
  const redoxScore = redoxScoreForOxidation(chemistry.mantleOxidationKey);
  const compositionShieldingScore = clamp(
    2.5 * Math.max(toFinite(atmosphereComposition.o2, 0), 0) +
      1.5 * Math.max(toFinite(atmosphereComposition.co2, 0), 0) +
      1.0 * Math.max(toFinite(atmosphereComposition.n2, 0), 0),
    0,
    1,
  );
  const fieldShieldingScore = clamp(toFinite(chemistry.surfaceFieldEarths, 0) / 0.3, 0, 1);
  const xuvProtectionScore =
    toFinite(energy.xuvFluxRatio, 0) <= 1
      ? 1
      : clamp(1 - Math.log10(Math.max(toFinite(energy.xuvFluxRatio, 0), 1)) / 2.5, 0, 1);
  const photochemicalShieldingScore = weightedMean(
    [pressureScore, compositionShieldingScore, fieldShieldingScore, xuvProtectionScore],
    [0.35, 0.25, 0.2, 0.2],
  );
  const score = weightedMean(
    [atmosphereRetentionScore, volatileInventoryScore, redoxScore, photochemicalShieldingScore],
    [0.3, 0.25, 0.2, 0.25],
  );

  return {
    score: clamp(score, 0, 1),
    modelVersion: "chemistry-v1",
    breakdown: {
      atmosphereRetentionScore,
      volatileInventoryScore,
      redoxScore,
      photochemicalShieldingScore,
      pressureScore,
      xuvProtectionScore,
    },
  };
}
