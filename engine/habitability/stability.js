// Shared climate-stability helpers for rocky-world habitability metrics.

import { clamp, toFinite } from "../utils.js";
import { climateLivabilityScore, habitabilityFraction } from "./climateLivability.js";
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

function retainedSpeciesScore(jeansEscapeSpecies = {}, requiredKeys = []) {
  if (!requiredKeys.length) return 0;
  const retained = requiredKeys.reduce((count, key) => {
    const status = jeansEscapeSpecies?.[key]?.status;
    return status && status !== "Lost" ? count + 1 : count;
  }, 0);
  return retained / requiredKeys.length;
}

export function climateStatePenaltyFor(climateState = "Stable") {
  switch (String(climateState || "Stable")) {
    case "Snowball":
      return 0.35;
    case "Moist greenhouse":
      return 0.2;
    case "Runaway greenhouse":
      return 0.02;
    case "Stable":
    default:
      return 1;
  }
}

export function resolveClimateStability({
  climateState = "Stable",
  climateLivabilityFraction = 1,
  collapsePenalty = 1,
} = {}) {
  const livabilityFraction = clamp(toFinite(climateLivabilityFraction, 1), 0, 1);
  const livabilityScore = climateLivabilityScore(livabilityFraction);
  const climateStatePenalty = climateStatePenaltyFor(climateState);
  const resolvedCollapsePenalty = clamp(toFinite(collapsePenalty, 1), 0, 1);

  return {
    climateLivabilityFraction: livabilityFraction,
    climateLivabilityScore: livabilityScore,
    climateStatePenalty,
    collapsePenalty: resolvedCollapsePenalty,
    stabilityMultiplier: clamp(
      climateStatePenalty * livabilityScore * resolvedCollapsePenalty,
      0,
      1,
    ),
    notes: [],
  };
}

export function evaluateClimateLivability({
  zones = [],
  climateState = "Stable",
  tidallyLockedToStar: _tidallyLockedToStar = false,
  pressureAtm: _pressureAtm = 1,
  collapsePenalty = 1,
} = {}) {
  return resolveClimateStability({
    climateState,
    climateLivabilityFraction: habitabilityFraction(zones),
    collapsePenalty,
  });
}

export function resolvePathwayStability(
  context = {},
  { selectedPathway = "none", solventModel = null } = {},
) {
  const normalized = normalizeHabitabilityContext(context);
  const surface = normalized.surface;
  const energy = normalized.energy;
  const chemistry = normalized.chemistry;
  const climate = normalized.climate;
  const environment = normalized.environment;
  const pathwayInputs = solventModel?.pathwayInputs || {};
  const climatePenalty = climateStatePenaltyFor(climate.climateState);

  const surfaceCollapsePenalty = weightedMean(
    [climatePenalty, climate.climateLivabilityScore, pressureWindowScore(surface.pressureAtm)],
    [0.45, 0.35, 0.2],
  );
  const surfaceExomoonCalibrationPenalty =
    normalized.bodyType === "moon" && environment.surfaceExomoonCalibrationApplicable
      ? clamp(toFinite(environment.surfaceExomoonCalibrationPenalty, 1), 0, 1)
      : 1;

  const shellPersistenceScore =
    surface.iceShellThicknessKm <= 0
      ? 0
      : surface.iceShellThicknessKm <= 40
        ? 1
        : surface.iceShellThicknessKm <= 120
          ? 1 - ((surface.iceShellThicknessKm - 40) / 80) * 0.4
          : 0.6;
  const subsurfaceCollapsePenalty = weightedMean(
    [
      shellPersistenceScore,
      surface.highPressureIceBarrier ? 0.35 : 1,
      clamp(
        Math.log10(
          1 +
            Math.max(toFinite(energy.tidalHeatingEarth, 0), 0) +
            Math.max(toFinite(energy.radiogenicHeatingEarth, 0), 0),
        ) / 1.8,
        0,
        1,
      ),
    ],
    [0.35, 0.3, 0.35],
  );

  const solventTempWindow =
    String(surface.alternativeSolventCandidate || "") === "ammonia-brines"
      ? centeredWindowScore(surface.surfaceTempK, 200, 35)
      : centeredWindowScore(surface.surfaceTempK, 94, 22);
  const altCollapsePenalty = weightedMean(
    [
      pressureWindowScore(surface.pressureAtm),
      pathwayInputs.solventTempWindow || solventTempWindow,
      retainedSpeciesScore(chemistry.jeansEscapeSpecies, ["n2", "ch4", "nh3", "co2", "co"]),
    ],
    [0.3, 0.4, 0.3],
  );

  const stabilityMultiplier =
    selectedPathway === "surface-water"
      ? surfaceCollapsePenalty * surfaceExomoonCalibrationPenalty
      : selectedPathway === "subsurface-water"
        ? subsurfaceCollapsePenalty
        : selectedPathway === "alternative-solvent"
          ? altCollapsePenalty
          : 0;

  return {
    climateLivabilityFraction: climate.climateLivabilityFraction,
    climateLivabilityScore: climate.climateLivabilityScore,
    climateStatePenalty: climatePenalty,
    collapsePenalty: clamp(stabilityMultiplier, 0, 1),
    surfaceCollapsePenalty,
    surfaceExomoonCalibrationPenalty,
    subsurfaceCollapsePenalty,
    altCollapsePenalty,
    shellPersistenceScore,
    stabilityMultiplier: clamp(stabilityMultiplier, 0, 1),
    modelVersion: "stability-v2",
    notes: [],
  };
}
