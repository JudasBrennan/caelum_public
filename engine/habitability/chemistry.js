// SPDX-License-Identifier: MPL-2.0
// Unified chemistry and photochemistry scoring for WorldSmith habitability.

import { clamp, toFinite } from "../utils.js";
import { normalizeHabitabilityContext } from "./schema.js";
import { inventoryHasFamily, normalizeHabitabilityInventory, speciesFamilyFor } from "./species.js";

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

function weightedMeanIgnoringNulls(values = [], weights = []) {
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const rawValue = values[index];
    if (rawValue == null || Number.isNaN(rawValue)) continue;
    const value = clamp(toFinite(rawValue, 0), 0, 1);
    const weight = Math.max(toFinite(weights[index], 0), 0);
    numerator += value * weight;
    denominator += weight;
  }
  return denominator > 0 ? numerator / denominator : 0;
}

function pressureWindowScore(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0) return 0;
  return clamp(1 - Math.abs(Math.log10(Math.max(pressure, 0.01))) / 2.2, 0, 1);
}

function retainedSpeciesScore(jeansEscapeSpecies = {}, requiredKeys = []) {
  if (!requiredKeys.length) return 0;
  const retained = requiredKeys.reduce((count, key) => {
    const status = jeansEscapeSpecies?.[key]?.status;
    return status && status !== "Lost" ? count + 1 : count;
  }, 0);
  return retained / requiredKeys.length;
}

function mapRedox(mantleOxidationKey) {
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

function atmosphereFamilyShare(atmosphereComposition = {}, family) {
  return Object.entries(atmosphereComposition || {}).reduce((sum, [species, value]) => {
    return speciesFamilyFor(species).includes(family) ? sum + Math.max(toFinite(value, 0), 0) : sum;
  }, 0);
}

function volatileFamilyScore(context, family) {
  const surface = context.surface || {};
  const chemistry = context.chemistry || {};
  const atmosphere = chemistry.atmosphereComposition || {};
  const inventory = normalizeHabitabilityInventory(chemistry.volatileInventory);
  const familyPresent = inventoryHasFamily(inventory, family);

  switch (family) {
    case "water":
      return clamp(
        Math.max(
          Math.max(toFinite(surface.surfaceAccessibleLiquidFraction, 0), 0),
          0.7 * Math.max(toFinite(surface.subsurfaceOceanScore, 0), 0),
          0.4 * Math.max(toFinite(surface.permanentIceFraction, 0), 0),
          Math.max(toFinite(atmosphere.h2o, 0), 0) / 0.01,
          familyPresent ? 0.6 : 0,
        ),
        0,
        1,
      );
    case "carbon":
      return clamp(
        Math.max(
          (Math.max(toFinite(atmosphere.co2, 0), 0) +
            Math.max(toFinite(atmosphere.ch4, 0), 0) +
            Math.max(toFinite(atmosphere.co, 0), 0)) /
            0.03,
          familyPresent ? 0.6 : 0,
        ),
        0,
        1,
      );
    case "nitrogen":
      return clamp(
        Math.max(
          (Math.max(toFinite(atmosphere.n2, 0), 0) + Math.max(toFinite(atmosphere.nh3, 0), 0)) /
            0.2,
          familyPresent ? 0.6 : 0,
        ),
        0,
        1,
      );
    case "hydrogen-carrier":
      return clamp(
        Math.max(atmosphereFamilyShare(atmosphere, family) / 0.03, familyPresent ? 0.6 : 0),
        0,
        1,
      );
    default:
      return 0;
  }
}

function uvScreeningScore(context) {
  const surface = context.surface || {};
  const chemistry = context.chemistry || {};
  const energy = context.energy || {};
  const atmosphere = chemistry.atmosphereComposition || {};
  const denseAtmShield = pressureWindowScore(surface.pressureAtm);
  const fieldShield =
    chemistry.intrinsicFieldKnown === false
      ? null
      : clamp(Math.max(toFinite(chemistry.surfaceFieldEarths, 0), 0) / 0.3, 0, 1);
  const ozoneProxy = clamp(Math.max(toFinite(atmosphere.o2, 0), 0) / 0.1, 0, 1);
  const hazeProxy = clamp(
    (Math.max(toFinite(atmosphere.ch4, 0), 0) + Math.max(toFinite(atmosphere.n2, 0), 0)) / 0.12,
    0,
    1,
  );
  const xuvFluxRatio = Math.max(toFinite(energy.xuvFluxRatio, 0), 0);
  const xuvProtection =
    xuvFluxRatio <= 1 ? 1 : clamp(1 - Math.log10(Math.max(xuvFluxRatio, 1)) / 2.5, 0, 1);

  return {
    score: weightedMeanIgnoringNulls(
      [denseAtmShield, fieldShield, Math.max(ozoneProxy, hazeProxy), xuvProtection],
      [0.35, 0.15, 0.2, 0.3],
    ),
    denseAtmShield,
    fieldShield,
    ozoneProxy,
    hazeProxy,
    xuvProtection,
  };
}

export function computeHabitabilityChemistryModel(
  context = {},
  { selectedPathway = "surface-water" } = {},
) {
  const normalized = normalizeHabitabilityContext(context);
  const surface = normalized.surface;
  const chemistry = normalized.chemistry;
  const redoxScore = mapRedox(chemistry.mantleOxidationKey);
  const screening = uvScreeningScore(normalized);
  const waterFamily = volatileFamilyScore(normalized, "water");
  const carbonFamily = volatileFamilyScore(normalized, "carbon");
  const nitrogenFamily = volatileFamilyScore(normalized, "nitrogen");
  const hydrogenCarrierFamily = volatileFamilyScore(normalized, "hydrogen-carrier");

  const surfaceRetentionScore = weightedMean(
    [
      pressureWindowScore(surface.pressureAtm),
      retainedSpeciesScore(chemistry.jeansEscapeSpecies, ["n2", "o2", "co2", "ar", "h2o"]),
    ],
    [0.55, 0.45],
  );
  const subsurfaceRetentionScore = weightedMean(
    [
      pressureWindowScore(surface.pressureAtm),
      retainedSpeciesScore(chemistry.jeansEscapeSpecies, ["n2", "co2", "nh3", "h2o"]),
    ],
    [0.45, 0.55],
  );
  const alternativeRetentionScore = weightedMean(
    [
      pressureWindowScore(surface.pressureAtm),
      retainedSpeciesScore(chemistry.jeansEscapeSpecies, ["n2", "ch4", "co2", "nh3", "co"]),
    ],
    [0.5, 0.5],
  );

  const surfaceVolatileInventoryScore =
    0.45 * waterFamily + 0.3 * carbonFamily + 0.25 * nitrogenFamily;
  const subsurfaceVolatileInventoryScore =
    0.5 * waterFamily + 0.25 * carbonFamily + 0.25 * nitrogenFamily;
  const alternativeVolatileInventoryScore =
    0.45 * carbonFamily + 0.35 * nitrogenFamily + 0.2 * hydrogenCarrierFamily;

  const chemistrySurface = weightedMean(
    [surfaceRetentionScore, surfaceVolatileInventoryScore, redoxScore, screening.score],
    [0.3, 0.25, 0.2, 0.25],
  );

  const chemistrySubsurface = weightedMean(
    [subsurfaceRetentionScore, subsurfaceVolatileInventoryScore, redoxScore, screening.score],
    [0.25, 0.3, 0.25, 0.2],
  );

  const chemistryAlt = weightedMean(
    [alternativeRetentionScore, alternativeVolatileInventoryScore, redoxScore, screening.score],
    [0.3, 0.3, 0.2, 0.2],
  );

  const pathwayScores = {
    surface: clamp(chemistrySurface, 0, 1),
    subsurface: clamp(chemistrySubsurface, 0, 1),
    alternative: clamp(chemistryAlt, 0, 1),
  };
  const score =
    selectedPathway === "surface-water"
      ? pathwayScores.surface
      : selectedPathway === "subsurface-water"
        ? pathwayScores.subsurface
        : selectedPathway === "alternative-solvent"
          ? pathwayScores.alternative
          : 0;

  return {
    score: clamp(score, 0, 1),
    modelVersion: "chemistry-v2",
    pathwayScores,
    breakdown: {
      redoxScore,
      waterFamily,
      carbonFamily,
      nitrogenFamily,
      hydrogenCarrierFamily,
      atmosphereRetentionScore:
        selectedPathway === "subsurface-water"
          ? subsurfaceRetentionScore
          : selectedPathway === "alternative-solvent"
            ? alternativeRetentionScore
            : surfaceRetentionScore,
      volatileInventoryScore:
        selectedPathway === "subsurface-water"
          ? subsurfaceVolatileInventoryScore
          : selectedPathway === "alternative-solvent"
            ? alternativeVolatileInventoryScore
            : surfaceVolatileInventoryScore,
      uvScreeningScore: screening.score,
      denseAtmShield: screening.denseAtmShield,
      fieldShield: screening.fieldShield,
      ozoneProxy: screening.ozoneProxy,
      hazeProxy: screening.hazeProxy,
      xuvProtection: screening.xuvProtection,
    },
  };
}
