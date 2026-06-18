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

function optionalFraction(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? clamp(numeric, 0, 1) : NaN;
}

function optionalSignedFraction(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? clamp(numeric, -1, 1) : NaN;
}

function optionalFiniteNonNegative(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(numeric, 0) : NaN;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" ? value : {};
}

function stringArray(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry)).filter(Boolean) : [];
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
  const dynamical = objectOrEmpty(raw.dynamical);
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
      waterCoverageFraction: fraction(surface.waterCoverageFraction, 0),
      iceShellThicknessKm: finiteNonNegative(surface.iceShellThicknessKm, 0),
      subsurfaceOceanDepthKm: finiteNonNegative(surface.subsurfaceOceanDepthKm, 0),
      highPressureIceBarrier: surface.highPressureIceBarrier === true,
      subsurfaceOceanScore: fraction(surface.subsurfaceOceanScore, 0),
      subsurfaceOceanPotential: surface.subsurfaceOceanPotential === true,
      alternativeSolventCandidate: String(surface.alternativeSolventCandidate || ""),
    },
    energy: {
      insolationEarth: finiteNonNegative(energy.insolationEarth, 0),
      tidalHeatingEarth: finiteNonNegative(energy.tidalHeatingEarth, 0),
      radiogenicHeatingEarth: finiteNonNegative(energy.radiogenicHeatingEarth, 0),
      xuvFluxRatio: finiteNonNegative(energy.xuvFluxRatio, 0),
      internalHeatSupport: optionalFraction(energy.internalHeatSupport),
      stellarHeatSupport: optionalFraction(energy.stellarHeatSupport),
    },
    chemistry: {
      surfaceFieldEarths: finiteNonNegative(chemistry.surfaceFieldEarths, 0),
      intrinsicFieldKnown: chemistry.intrinsicFieldKnown !== false,
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
      ozoneColumnDobsonUnits: optionalFiniteNonNegative(chemistry.ozoneColumnDobsonUnits),
      ozoneEarthRatio: optionalFiniteNonNegative(chemistry.ozoneEarthRatio),
      uvShieldingScore: optionalFraction(chemistry.uvShieldingScore),
      uvShieldingClass: String(chemistry.uvShieldingClass || ""),
      prebioticUvWindowClass: String(chemistry.prebioticUvWindowClass || ""),
      prebioticUvSurfaceFluxErgCm2S: optionalFiniteNonNegative(
        chemistry.prebioticUvSurfaceFluxErgCm2S,
      ),
      prebioticUvTopOfAtmosphereFluxErgCm2S: optionalFiniteNonNegative(
        chemistry.prebioticUvTopOfAtmosphereFluxErgCm2S,
      ),
      photochemicalHazeClass: String(chemistry.photochemicalHazeClass || ""),
      hazeLikelihoodScore: optionalFraction(chemistry.hazeLikelihoodScore),
      hazeAntiGreenhouseCoolingK: optionalFiniteNonNegative(chemistry.hazeAntiGreenhouseCoolingK),
      hazeSurfaceLightReductionFraction: optionalFraction(
        chemistry.hazeSurfaceLightReductionFraction,
      ),
      photochemicalWarningCodes: Array.isArray(chemistry.photochemicalWarningCodes)
        ? chemistry.photochemicalWarningCodes.map((code) => String(code))
        : [],
    },
    climate: {
      climateState: String(climate.climateState || "Stable"),
      climateLivabilityFraction: fraction(climate.climateLivabilityFraction, 1),
      climateLivabilityScore: fraction(climate.climateLivabilityScore, 1),
      climateStatePenalty: fraction(climate.climateStatePenalty, 1),
      collapsePenalty: fraction(climate.collapsePenalty, 1),
      stabilityMultiplier: fraction(climate.stabilityMultiplier, 1),
      coupledSurfaceTempK: optionalFiniteNonNegative(climate.coupledSurfaceTempK),
      climateChemistryNetDeltaK: optionalSignedFraction(climate.climateChemistryNetDeltaK),
      coupledClimateTendency: String(climate.coupledClimateTendency || ""),
      optInClimateState: String(climate.optInClimateState || ""),
      climateChemistryConfidence: String(climate.climateChemistryConfidence || ""),
    },
    environment: {
      magnetosphericRadRemDay: finiteNonNegative(environment.magnetosphericRadRemDay, 0),
      radiationPenalty: fraction(environment.radiationPenalty, 1),
      surfaceExposureRemDayEquivalent: optionalFiniteNonNegative(
        environment.surfaceExposureRemDayEquivalent,
      ),
      subsurfaceExposureRemDayEquivalent: optionalFiniteNonNegative(
        environment.subsurfaceExposureRemDayEquivalent,
      ),
      surfaceRadiationPenalty: optionalFraction(environment.surfaceRadiationPenalty),
      subsurfaceRadiationPenalty: optionalFraction(environment.subsurfaceRadiationPenalty),
      atmosphereShielding: optionalFraction(environment.atmosphereShielding),
      intrinsicFieldShielding: optionalFraction(environment.intrinsicFieldShielding),
      inducedFieldShielding: optionalFraction(environment.inducedFieldShielding),
      magneticShielding: optionalFraction(environment.magneticShielding),
      combinedShielding: optionalFraction(environment.combinedShielding),
      surfaceRadiationClass: String(environment.surfaceRadiationClass || ""),
      subsurfaceRadiationClass: String(environment.subsurfaceRadiationClass || ""),
      surfaceRadiationShieldingFactor: optionalFraction(
        environment.surfaceRadiationShieldingFactor,
      ),
      atmosphereTrendClass: String(environment.atmosphereTrendClass || ""),
      atmosphereTimescaleClass: String(environment.atmosphereTimescaleClass || ""),
      atmosphereSourceIndex: optionalFraction(environment.atmosphereSourceIndex),
      atmosphereSinkIndex: optionalFraction(environment.atmosphereSinkIndex),
      atmosphereNetBalance: optionalSignedFraction(environment.atmosphereNetBalance),
      atmosphereDominantSource: String(environment.atmosphereDominantSource || ""),
      atmosphereDominantSink: String(environment.atmosphereDominantSink || ""),
      atmosphereLedgerConfidence: String(environment.atmosphereLedgerConfidence || ""),
      carbonCycleTendency: String(environment.carbonCycleTendency || ""),
      carbonCycleConfidence: String(environment.carbonCycleConfidence || ""),
      carbonCycleStabilityModifier: optionalFraction(environment.carbonCycleStabilityModifier),
      carbonCycleThermostatStrength: optionalFraction(environment.carbonCycleThermostatStrength),
      oceanChemistryConfidence: String(environment.oceanChemistryConfidence || ""),
      oceanChemistryWaterContext: String(environment.oceanChemistryWaterContext || ""),
      oceanChemistryAcidityClass: String(environment.oceanChemistryAcidityClass || ""),
      carbonateSaturationClass: String(environment.carbonateSaturationClass || ""),
      nutrientSupportClass: String(environment.nutrientSupportClass || ""),
      biosignatureInterpretationClass: String(environment.biosignatureInterpretationClass || ""),
      biosignatureConfidence: String(environment.biosignatureConfidence || ""),
      biosignatureDisequilibriumStrength: String(
        environment.biosignatureDisequilibriumStrength || "",
      ),
      o2O3FalsePositiveRisk: String(environment.o2O3FalsePositiveRisk || ""),
      methaneContext: String(environment.methaneContext || ""),
      coBuildupRisk: String(environment.coBuildupRisk || ""),
      cloudHeatRedistributionEfficiency: optionalFraction(
        environment.cloudHeatRedistributionEfficiency,
      ),
      surfaceExomoonCalibrationPenalty: optionalFraction(
        environment.surfaceExomoonCalibrationPenalty,
      ),
      surfaceExomoonCalibrationApplicable: environment.surfaceExomoonCalibrationApplicable === true,
      surfaceExomoonCalibrationPass: environment.surfaceExomoonCalibrationPass !== false,
      stellarAgeGyr: finiteNonNegative(environment.stellarAgeGyr, 0),
      tidallyLockedToPrimary: environment.tidallyLockedToPrimary === true,
      tidallyLockedToStar: environment.tidallyLockedToStar === true,
      insideMagnetosphere: environment.insideMagnetosphere === true,
    },
    dynamical: {
      modelVersion: String(dynamical.modelVersion || "dynamical-habitability-bridge-v1"),
      persistenceModifier: clamp(toFinite(dynamical.persistenceModifier, 1), 0, 1),
      modifierTarget: String(dynamical.modifierTarget || "confidence"),
      confidence: String(dynamical.confidence || "unknown"),
      sustainedTidalHeatingClass: String(dynamical.sustainedTidalHeatingClass || "unknown"),
      reasons: stringArray(dynamical.reasons),
      noOpReason: String(dynamical.noOpReason || ""),
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
