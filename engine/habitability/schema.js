// SPDX-License-Identifier: MPL-2.0
// Shared normalized habitability-context schema.
//
// Stage 5 makes the metric layer consume a single versioned nested shape
// so planets and moons can share the same scoring code without ad-hoc
// body-specific fields leaking into the formulas.

import { clamp, toFinite } from "../utils.js";

const VALID_BODY_TYPES = new Set(["planet", "moon"]);
const VALID_BODY_CLASSES = new Set(["rocky-planet", "dwarf-planet", "rocky-moon", "icy-moon"]);
const FRACTION_EPSILON = 5e-3;

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function objectOrEmpty(value) {
  return value && typeof value === "object" ? value : {};
}

function normalizeBodyType(value) {
  return VALID_BODY_TYPES.has(value) ? value : "planet";
}

function normalizeBodyClass(value, bodyType) {
  if (VALID_BODY_CLASSES.has(value)) return value;
  return bodyType === "moon" ? "rocky-moon" : "rocky-planet";
}

export function normalizeHabitabilityContext(rawContext = {}) {
  const raw = objectOrEmpty(rawContext);
  const bodyType = normalizeBodyType(raw.bodyType);
  const bulk = objectOrEmpty(raw.bulk);
  const surface = objectOrEmpty(raw.surface);
  const energy = objectOrEmpty(raw.energy);
  const chemistry = objectOrEmpty(raw.chemistry);
  const climate = objectOrEmpty(raw.climate);
  const environment = objectOrEmpty(raw.environment);
  const provenance = objectOrEmpty(raw.provenance);

  return {
    version: "context-v2",
    bodyType,
    bodyClass: normalizeBodyClass(raw.bodyClass, bodyType),
    bulk: {
      radiusEarth: finiteNonNegative(bulk.radiusEarth, 0),
      densityGcm3: finiteNonNegative(bulk.densityGcm3, 0),
      escapeVelocityVEarth: finiteNonNegative(bulk.escapeVelocityVEarth, 0),
      gravityG: finiteNonNegative(bulk.gravityG, 0),
    },
    surface: {
      surfaceTempK: finiteNonNegative(surface.surfaceTempK, 0),
      pressureAtm: finiteNonNegative(surface.pressureAtm, 0),
      landFraction: fraction(surface.landFraction, 0),
      liquidOceanFraction: fraction(surface.liquidOceanFraction, 0),
      permanentIceFraction: fraction(surface.permanentIceFraction, 0),
      steamFraction: fraction(surface.steamFraction, 0),
      surfaceAccessibleLiquidFraction: fraction(surface.surfaceAccessibleLiquidFraction, 0),
      subsurfaceOceanPotential: surface.subsurfaceOceanPotential === true,
      alternativeSolventCandidate: String(surface.alternativeSolventCandidate || ""),
    },
    energy: {
      insolationEarth: finiteNonNegative(energy.insolationEarth, 0),
      tidalHeatingEarth: finiteNonNegative(energy.tidalHeatingEarth, 0),
      radiogenicHeatingEarth: finiteNonNegative(energy.radiogenicHeatingEarth, 0),
      xuvFluxRatio: finiteNonNegative(energy.xuvFluxRatio, 0),
    },
    chemistry: {
      surfaceFieldEarths: finiteNonNegative(chemistry.surfaceFieldEarths, 0),
      jeansEscapeSpecies:
        chemistry.jeansEscapeSpecies && typeof chemistry.jeansEscapeSpecies === "object"
          ? chemistry.jeansEscapeSpecies
          : {},
      atmosphereComposition:
        chemistry.atmosphereComposition && typeof chemistry.atmosphereComposition === "object"
          ? chemistry.atmosphereComposition
          : {},
      volatileInventory: Array.isArray(chemistry.volatileInventory)
        ? chemistry.volatileInventory
        : [],
      mantleOxidationKey: String(chemistry.mantleOxidationKey || "earth"),
      primaryOutgassedSpecies: String(chemistry.primaryOutgassedSpecies || ""),
    },
    climate: {
      climateState: String(climate.climateState || "Stable"),
      climateLivabilityFraction: fraction(climate.climateLivabilityFraction, 1),
      climateLivabilityScore: fraction(climate.climateLivabilityScore, 1),
      climateStatePenalty: fraction(climate.climateStatePenalty, 1),
      collapsePenalty: fraction(climate.collapsePenalty, 1),
      stabilityMultiplier: fraction(climate.stabilityMultiplier, 1),
    },
    environment: {
      magnetosphericRadRemDay: finiteNonNegative(environment.magnetosphericRadRemDay, 0),
      radiationPenalty: fraction(environment.radiationPenalty, 1),
      stellarAgeGyr: finiteNonNegative(environment.stellarAgeGyr, 0),
      tidallyLockedToPrimary: environment.tidallyLockedToPrimary === true,
      tidallyLockedToStar: environment.tidallyLockedToStar === true,
      insideMagnetosphere: environment.insideMagnetosphere === true,
    },
    provenance: {
      hydrosphereModelVersion: String(provenance.hydrosphereModelVersion || ""),
      habitabilityModelVersion: String(provenance.habitabilityModelVersion || ""),
      solventPolicyVersion: String(provenance.solventPolicyVersion || ""),
    },
  };
}

export function assertHabitabilityContext(context = {}) {
  const raw = objectOrEmpty(context);
  const normalized = normalizeHabitabilityContext(context);
  const requiredPaths = [
    ["bulk", "radiusEarth"],
    ["bulk", "densityGcm3"],
    ["bulk", "escapeVelocityVEarth"],
    ["surface", "surfaceTempK"],
    ["surface", "pressureAtm"],
  ];

  for (const [section, key] of requiredPaths) {
    const rawSection = objectOrEmpty(raw[section]);
    const rawValue = rawSection[key];
    if (!Number.isFinite(rawValue)) {
      throw new Error(`Habitability context missing required numeric field: ${section}.${key}`);
    }
  }

  const surface = normalized.surface;
  const surfaceFractions = [
    surface.landFraction,
    surface.liquidOceanFraction,
    surface.permanentIceFraction,
    surface.steamFraction,
  ];
  for (const value of surfaceFractions) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error("Habitability context surface fractions must stay within [0, 1]");
    }
  }

  const surfaceTotal = surfaceFractions.reduce((sum, value) => sum + value, 0);
  if (Math.abs(surfaceTotal - 1) > FRACTION_EPSILON) {
    throw new Error(
      `Habitability context surface fractions must sum to 1, got ${surfaceTotal.toFixed(6)}`,
    );
  }

  return normalized;
}
