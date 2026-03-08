// SPDX-License-Identifier: MPL-2.0
// Habitability-facing radiation helpers.
//
// Stage 6 starts with moon magnetospheric radiation only. Planets keep a
// neutral multiplier until a broader radiation model exists.

import { clamp, toFinite } from "../utils.js";
import { normalizeHabitabilityContext } from "./schema.js";

export function radiationPenaltyFromMagnetosphericDose(remDay) {
  const dose = Math.max(toFinite(remDay, 0), 0);
  if (dose <= 0.01) return 1.0;
  if (dose <= 0.1) return 0.9;
  if (dose <= 1) return 0.7;
  if (dose <= 10) return 0.35;
  return 0.05;
}

export function moonRadiationProfile({ magnetosphericRadRemDay } = {}) {
  return {
    modelVersion: "magnetosphere-v1",
    magnetosphericRadRemDay: Math.max(toFinite(magnetosphericRadRemDay, 0), 0),
    radiationPenalty: clamp(radiationPenaltyFromMagnetosphericDose(magnetosphericRadRemDay), 0, 1),
  };
}

function pressureWindowScore(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0) return 0;
  return clamp(1 - Math.abs(Math.log10(Math.max(pressure, 0.01))) / 2.2, 0, 1);
}

export function computeHabitabilityRadiationModel(
  context = {},
  { photochemicalShieldingScore = 0 } = {},
) {
  const normalized = normalizeHabitabilityContext(context);
  const surface = normalized.surface;
  const chemistry = normalized.chemistry;
  const environment = normalized.environment;
  const energy = normalized.energy;
  const magnetosphereMultiplier = clamp(
    radiationPenaltyFromMagnetosphericDose(environment.magnetosphericRadRemDay),
    0,
    1,
  );
  const xuvFluxRatio = Math.max(toFinite(energy.xuvFluxRatio, 0), 0);
  const stellarExposureMultiplier =
    xuvFluxRatio <= 1 ? 1 : clamp(1 - Math.log10(Math.max(xuvFluxRatio, 1)) / 3, 0.25, 1);
  const surfaceShieldingScore = clamp(
    0.45 * pressureWindowScore(surface.pressureAtm) +
      0.25 * clamp(toFinite(chemistry.surfaceFieldEarths, 0) / 0.3, 0, 1) +
      0.3 * clamp(toFinite(photochemicalShieldingScore, 0), 0, 1),
    0,
    1,
  );
  const stellarRadiationMultiplier = clamp(
    stellarExposureMultiplier + (1 - stellarExposureMultiplier) * surfaceShieldingScore,
    0,
    1,
  );
  const multiplier = clamp(Math.min(magnetosphereMultiplier, stellarRadiationMultiplier), 0, 1);

  return {
    multiplier,
    modelVersion: "radiation-v1",
    breakdown: {
      magnetosphereMultiplier,
      stellarExposureMultiplier,
      surfaceShieldingScore,
      stellarRadiationMultiplier,
    },
  };
}
