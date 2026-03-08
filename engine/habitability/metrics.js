// SPDX-License-Identifier: MPL-2.0
// Shared habitability metrics for rocky planets and moons.
//
// ESI measures Earth-likeness. Stage 7 unifies PHI under explicit solvent,
// chemistry, radiation, and persistence submodels so planets and moons use
// the same explainable scoring core.

import { clamp, toFinite } from "../utils.js";
import { normalizeHabitabilityContext } from "./schema.js";
import { resolveClimateStability } from "./stability.js";
import { computeUnifiedSolventModel } from "./solvent.js";
import { computeHabitabilityChemistryModel } from "./chemistry.js";
import { computeHabitabilityRadiationModel } from "./radiation.js";
import { computeHabitabilityPersistenceModel } from "./persistence.js";

const EARTH_REFERENCE = {
  radiusEarth: 1,
  densityGcm3: 5.514,
  escapeVelocityVEarth: 1,
  surfaceTempK: 288,
};

const ESI_WEIGHTS = {
  radius: 0.57,
  density: 1.07,
  escapeVelocity: 0.7,
  surfaceTemp: 5.58,
};

function safeMetric(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function similarityComponent(value, earthValue, weight) {
  const metric = safeMetric(value);
  const reference = safeMetric(earthValue);
  const denominator = metric + reference;
  if (denominator <= 0) {
    return { similarity: 0, weighted: 0 };
  }
  const similarity = clamp(1 - Math.abs(metric - reference) / denominator, 0, 1);
  return {
    similarity,
    weighted: similarity ** (weight / 4),
  };
}

export function computeEarthSimilarityIndex(context = {}) {
  const normalized = normalizeHabitabilityContext(context);
  const bulk = normalized.bulk;
  const surface = normalized.surface;
  const radius = similarityComponent(
    bulk.radiusEarth,
    EARTH_REFERENCE.radiusEarth,
    ESI_WEIGHTS.radius,
  );
  const density = similarityComponent(
    bulk.densityGcm3,
    EARTH_REFERENCE.densityGcm3,
    ESI_WEIGHTS.density,
  );
  const escapeVelocity = similarityComponent(
    bulk.escapeVelocityVEarth,
    EARTH_REFERENCE.escapeVelocityVEarth,
    ESI_WEIGHTS.escapeVelocity,
  );
  const surfaceTemp = similarityComponent(
    surface.surfaceTempK,
    EARTH_REFERENCE.surfaceTempK,
    ESI_WEIGHTS.surfaceTemp,
  );

  const score = clamp(
    radius.weighted * density.weighted * escapeVelocity.weighted * surfaceTemp.weighted,
    0,
    1,
  );

  return {
    score,
    components: {
      radius: radius.similarity,
      density: density.similarity,
      escapeVelocity: escapeVelocity.similarity,
      surfaceTemp: surfaceTemp.similarity,
    },
  };
}

export function computePlanetHabitabilityIndex(context = {}, options = {}) {
  return computeUnifiedHabitabilityIndex(context, options);
}

export function computeMoonHabitabilityIndex(context = {}, options = {}) {
  return computeUnifiedHabitabilityIndex(context, options);
}

export function computeUnifiedHabitabilityIndex(context = {}, { solventPolicy } = {}) {
  const normalized = normalizeHabitabilityContext(context);
  const surface = normalized.surface;
  const energyContext = normalized.energy;
  const climate = normalized.climate;
  const landFraction = clamp(toFinite(surface.landFraction, 0), 0, 1);
  const liquidOceanFraction = clamp(toFinite(surface.liquidOceanFraction, 0), 0, 1);
  const landBalanceScore = clamp(1 - Math.abs(landFraction - 0.35) / 0.7, 0, 1);
  const exposedSurfaceScore = clamp(landFraction + 0.25 * liquidOceanFraction, 0, 1);
  const substrate = clamp(0.7 * landBalanceScore + 0.3 * exposedSurfaceScore, 0, 1);

  const solventModel = computeUnifiedSolventModel(normalized, { policy: solventPolicy });
  const solvent = solventModel.score;

  const insolationEarth = Math.max(safeMetric(energyContext.insolationEarth, 1e-6), 1e-6);
  const stellarEnergyScore = clamp(1 - Math.abs(Math.log2(insolationEarth)) / 2, 0, 1);
  const planetTidalHeatingEarth = safeMetric(energyContext.tidalHeatingEarth, 0);
  const internalHeatPenalty =
    planetTidalHeatingEarth <= 0.1
      ? 1
      : clamp(1 - Math.log10(planetTidalHeatingEarth / 0.1) / 2, 0, 1);
  const geophysicalEnergyScore = clamp(
    Math.log10(1 + planetTidalHeatingEarth + safeMetric(energyContext.radiogenicHeatingEarth, 0)) /
      2,
    0,
    1,
  );
  let energy = clamp(0.85 * stellarEnergyScore + 0.15 * internalHeatPenalty, 0, 1);
  if (solventModel.selectedPathway === "subsurface-water") {
    energy = Math.max(energy, clamp(0.25 + 0.75 * geophysicalEnergyScore, 0, 1));
  } else if (solventModel.selectedPathway === "alternative-solvent") {
    energy = Math.max(
      energy,
      clamp(0.15 + 0.65 * Math.max(stellarEnergyScore, geophysicalEnergyScore), 0, 1),
    );
  }

  const chemistryModel = computeHabitabilityChemistryModel(normalized);
  const chemistry = chemistryModel.score;

  const baseScore = clamp((substrate * solvent * energy * chemistry) ** 0.25, 0, 1);
  const climateBreakdown = resolveClimateStability({
    climateState: climate.climateState,
    climateLivabilityFraction: climate.climateLivabilityFraction,
    collapsePenalty: climate.collapsePenalty,
  });
  const stabilityMultiplier = clamp(
    Math.max(climateBreakdown.stabilityMultiplier, toFinite(solventModel.stabilityFloor, 0)),
    0,
    1,
  );
  const radiationModel = computeHabitabilityRadiationModel(normalized, {
    photochemicalShieldingScore: chemistryModel.breakdown.photochemicalShieldingScore,
  });
  const persistenceModel = computeHabitabilityPersistenceModel(normalized, {
    stabilityFloor: solventModel.stabilityFloor,
  });
  const score = clamp(
    baseScore * stabilityMultiplier * radiationModel.multiplier * persistenceModel.multiplier,
    0,
    1,
  );

  return {
    score,
    version: "phi-unified-v1",
    breakdown: {
      substrate,
      solvent,
      energy,
      chemistry,
      stabilityMultiplier,
      radiationMultiplier: radiationModel.multiplier,
      persistenceMultiplier: persistenceModel.multiplier,
      climateLivabilityFraction: climateBreakdown.climateLivabilityFraction,
      climateLivabilityScore: climateBreakdown.climateLivabilityScore,
      climateStatePenalty: climateBreakdown.climateStatePenalty,
      collapsePenalty: climateBreakdown.collapsePenalty,
      landBalanceScore,
      exposedSurfaceScore,
      liquidOceanFraction,
      stellarEnergyScore,
      internalHeatPenalty,
      geophysicalEnergyScore,
      solventModel: solventModel.modelVersion,
      solventPolicyVersion: solventModel.policyVersion,
      solventPathway: solventModel.selectedPathway,
      supportedSolventPathways: solventModel.supportedPathways,
      surfaceWaterScore: solventModel.breakdown.surfaceWaterScore,
      subsurfaceWaterScore: solventModel.breakdown.subsurfaceWaterScore,
      altSolventScore: solventModel.breakdown.altSolventScore,
      surfaceAccessibilityPenalty: solventModel.breakdown.surfaceAccessibilityPenalty,
      alternativeSolventCandidate: solventModel.breakdown.alternativeSolventCandidate,
      chemistryModel: chemistryModel.modelVersion,
      atmosphereRetentionScore: chemistryModel.breakdown.atmosphereRetentionScore,
      volatileInventoryScore: chemistryModel.breakdown.volatileInventoryScore,
      redoxScore: chemistryModel.breakdown.redoxScore,
      photochemicalShieldingScore: chemistryModel.breakdown.photochemicalShieldingScore,
      pressureScore: chemistryModel.breakdown.pressureScore,
      xuvProtectionScore: chemistryModel.breakdown.xuvProtectionScore,
      radiationModel: radiationModel.modelVersion,
      magnetosphereMultiplier: radiationModel.breakdown.magnetosphereMultiplier,
      stellarExposureMultiplier: radiationModel.breakdown.stellarExposureMultiplier,
      surfaceShieldingScore: radiationModel.breakdown.surfaceShieldingScore,
      stellarRadiationMultiplier: radiationModel.breakdown.stellarRadiationMultiplier,
      persistenceModel: persistenceModel.modelVersion,
      ageScore: persistenceModel.breakdown.ageScore,
      xuvScore: persistenceModel.breakdown.xuvScore,
      atmosphericEscapeScore: persistenceModel.breakdown.atmosphericEscapeScore,
      climatePersistenceScore: persistenceModel.breakdown.climatePersistenceScore,
      tidalPersistenceScore: persistenceModel.breakdown.tidalScore,
    },
  };
}
