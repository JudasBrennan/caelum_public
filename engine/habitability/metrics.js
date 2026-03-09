// SPDX-License-Identifier: MPL-2.0
// Shared habitability metrics for rocky planets and moons.

import { clamp, toFinite } from "../utils.js";
import { normalizeHabitabilityContext } from "./schema.js";
import { resolvePathwayStability } from "./stability.js";
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

function centeredWindowScore(value, center, halfWidth) {
  if (!Number.isFinite(value) || !Number.isFinite(center) || !Number.isFinite(halfWidth)) return 0;
  if (halfWidth <= 0) return 0;
  return clamp(1 - Math.abs(value - center) / halfWidth, 0, 1);
}

function pressureWindowScore(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0) return 0;
  return clamp(1 - Math.abs(Math.log10(Math.max(pressure, 0.01))) / 2.2, 0, 1);
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

function selectPathwayTerm(selectedPathway, values) {
  if (selectedPathway === "surface-water") return values.surface;
  if (selectedPathway === "subsurface-water") return values.subsurface;
  if (selectedPathway === "alternative-solvent") return values.alternative;
  return 0;
}

function computeSubstrateScores(context, solventModel) {
  const surface = context.surface;
  const coastlineMixScore = clamp(1 - Math.abs(surface.landFraction - 0.35) / 0.65, 0, 1);
  const exposedSurfaceScore = clamp(
    surface.landFraction + 0.35 * surface.liquidOceanFraction,
    0,
    1,
  );
  const surfaceScore = weightedMean([coastlineMixScore, exposedSurfaceScore], [0.65, 0.35]);

  const shellInterfaceScore = solventModel.pathwayInputs?.shellAccessScore || 0;
  const barrierInterfaceScore = surface.highPressureIceBarrier ? 0.2 : 1;
  const subsurfaceScore = weightedMean(
    [surface.subsurfaceOceanScore, shellInterfaceScore, barrierInterfaceScore],
    [0.4, 0.35, 0.25],
  );

  const basinCoverageFraction =
    surface.liquidOceanFraction > 0
      ? surface.liquidOceanFraction
      : solventModel.pathwayInputs?.altBasinCoverageFraction || 0;
  const basinCoverageScore = clamp(basinCoverageFraction / 0.25, 0, 1);
  const solidInterfaceScore = clamp(
    surface.landFraction + 0.25 * surface.permanentIceFraction,
    0,
    1,
  );
  const pressurePersistenceScore = pressureWindowScore(surface.pressureAtm);
  const alternativeScore = weightedMean(
    [basinCoverageScore, solidInterfaceScore, pressurePersistenceScore],
    [0.4, 0.35, 0.25],
  );

  return {
    surface: clamp(surfaceScore, 0, 1),
    subsurface: clamp(subsurfaceScore, 0, 1),
    alternative: clamp(alternativeScore, 0, 1),
    breakdown: {
      coastlineMixScore,
      exposedSurfaceScore,
      shellInterfaceScore,
      barrierInterfaceScore,
      basinCoverageScore,
      solidInterfaceScore,
      pressurePersistenceScore,
    },
  };
}

function computeEnergyScores(context, solventModel) {
  const surface = context.surface;
  const energy = context.energy;
  const stellarTemperateScore = Number.isFinite(toFinite(energy.stellarHeatSupport, NaN))
    ? clamp(toFinite(energy.stellarHeatSupport, 0), 0, 1)
    : clamp(1 - Math.abs(Math.log2(Math.max(toFinite(energy.insolationEarth, 0), 1e-6))) / 2, 0, 1);
  const internalHeatSupport = Number.isFinite(toFinite(energy.internalHeatSupport, NaN))
    ? clamp(toFinite(energy.internalHeatSupport, 0), 0, 1)
    : clamp(
        Math.log10(
          1 +
            Math.max(toFinite(energy.tidalHeatingEarth, 0), 0) +
            Math.max(toFinite(energy.radiogenicHeatingEarth, 0), 0),
        ) / 1.8,
        0,
        1,
      );
  const overheatPenalty =
    energy.tidalHeatingEarth <= 0.1
      ? 1
      : clamp(1 - Math.log10(Math.max(energy.tidalHeatingEarth, 0.1) / 0.1) / 2, 0, 1);
  const surfaceScore = weightedMean(
    [stellarTemperateScore, internalHeatSupport, overheatPenalty],
    [0.65, 0.15, 0.2],
  );
  const subsurfaceScore = weightedMean(
    [internalHeatSupport, overheatPenalty, clamp(0.25 + 0.75 * stellarTemperateScore, 0, 1)],
    [0.55, 0.25, 0.2],
  );
  const solventTempWindow =
    String(surface.alternativeSolventCandidate || "") === "ammonia-brines"
      ? centeredWindowScore(surface.surfaceTempK, 200, 35)
      : centeredWindowScore(surface.surfaceTempK, 94, 22);
  const alternativeScore = weightedMean(
    [
      solventModel.pathwayInputs?.solventTempWindow || solventTempWindow,
      internalHeatSupport,
      overheatPenalty,
    ],
    [0.55, 0.2, 0.25],
  );
  return {
    surface: clamp(surfaceScore, 0, 1),
    subsurface: clamp(subsurfaceScore, 0, 1),
    alternative: clamp(alternativeScore, 0, 1),
    breakdown: {
      stellarTemperateScore,
      internalHeatSupport,
      overheatPenalty,
      solventTempWindow: solventModel.pathwayInputs?.solventTempWindow || solventTempWindow,
    },
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
  const solventModel = computeUnifiedSolventModel(normalized, { policy: solventPolicy });
  const selectedPathway = solventModel.selectedPathway;
  const substrateScores = computeSubstrateScores(normalized, solventModel);
  const energyScores = computeEnergyScores(normalized, solventModel);
  const chemistryModel = computeHabitabilityChemistryModel(normalized, { selectedPathway });
  const substrate = selectPathwayTerm(selectedPathway, substrateScores);
  const energy = selectPathwayTerm(selectedPathway, energyScores);
  const chemistry = chemistryModel.score;
  const solvent = solventModel.score;
  const baseScore = clamp((substrate * solvent * energy * chemistry) ** 0.25, 0, 1);
  const stabilityModel = resolvePathwayStability(normalized, {
    selectedPathway,
    solventModel,
  });
  const radiationModel = computeHabitabilityRadiationModel(normalized, {
    selectedPathway,
    photochemicalShieldingScore: chemistryModel.breakdown.uvScreeningScore,
  });
  const persistenceModel = computeHabitabilityPersistenceModel(normalized, {
    selectedPathway,
    pathwayPersistenceScore: stabilityModel.stabilityMultiplier,
  });
  const score = clamp(
    baseScore *
      stabilityModel.stabilityMultiplier *
      radiationModel.multiplier *
      persistenceModel.multiplier,
    0,
    1,
  );

  return {
    score,
    version: "phi-unified-v2",
    breakdown: {
      substrate,
      solvent,
      energy,
      chemistry,
      climateStatePenalty: stabilityModel.climateStatePenalty,
      collapsePenalty: stabilityModel.collapsePenalty,
      stabilityMultiplier: stabilityModel.stabilityMultiplier,
      radiationMultiplier: radiationModel.multiplier,
      persistenceMultiplier: persistenceModel.multiplier,
      solventPathway: selectedPathway,
      solventPolicyVersion: solventModel.policyVersion,
      pathwayScores: solventModel.pathwayScores,
      modelVersions: {
        solvent: solventModel.modelVersion,
        chemistry: chemistryModel.modelVersion,
        radiation: radiationModel.modelVersion,
        persistence: persistenceModel.modelVersion,
        stability: stabilityModel.modelVersion,
        hydrosphere: normalized.provenance.hydrosphereModelVersion || "",
      },
      substrateBreakdown: substrateScores.breakdown,
      energyBreakdown: energyScores.breakdown,
      chemistryBreakdown: chemistryModel.breakdown,
      stabilityBreakdown: {
        climateLivabilityFraction: stabilityModel.climateLivabilityFraction,
        climateLivabilityScore: stabilityModel.climateLivabilityScore,
        climateStatePenalty: stabilityModel.climateStatePenalty,
        collapsePenalty: stabilityModel.collapsePenalty,
        surfaceCollapsePenalty: stabilityModel.surfaceCollapsePenalty,
        subsurfaceCollapsePenalty: stabilityModel.subsurfaceCollapsePenalty,
        altCollapsePenalty: stabilityModel.altCollapsePenalty,
        shellPersistenceScore: stabilityModel.shellPersistenceScore,
      },
      radiationBreakdown: radiationModel.breakdown,
      persistenceBreakdown: persistenceModel.breakdown,
    },
  };
}
