// SPDX-License-Identifier: MPL-2.0
import { clamp, round, toFinite } from "../utils.js";
import { waterBoilingK } from "../planet/composition.js";
import { normalizeHabitabilityInventory } from "../habitability/species.js";

const LUNAR_MASS_KG = 7.342e22;
const LUNAR_RADIUS_M = 1737.4e3;
const WATER_DENSITY_KG_M3 = 1000;
const MIN_LIQUID_PRESSURE_ATM = 0.006;
const HIGH_PRESSURE_ICE_THRESHOLD_PA = 300e6;

const WATER_FRACTION_BY_CLASS = {
  "Very icy": 0.08,
  Icy: 0.06,
  "Subsurface ocean": 0.05,
  "Mixed rock/ice": 0.035,
  Rocky: 0.004,
  "Partially molten": 0.002,
  "Iron-rich": 0,
};

const SUBSURFACE_SUPPORT_BY_CLASS = {
  "Very icy": 0.55,
  Icy: 0.45,
  "Subsurface ocean": 0.75,
  "Mixed rock/ice": 0.28,
  Rocky: 0.08,
  "Partially molten": 0.04,
  "Iron-rich": 0,
};

function normalizeFractions(state) {
  const land = clamp(toFinite(state.landFraction, 0), 0, 1);
  const liquid = clamp(toFinite(state.liquidOceanFraction, 0), 0, 1);
  const ice = clamp(toFinite(state.permanentIceFraction, 0), 0, 1);
  const steam = clamp(toFinite(state.steamFraction, 0), 0, 1);
  const total = land + liquid + ice + steam;

  if (total <= 0) {
    return {
      liquidOceanFraction: 0,
      landFraction: 1,
      permanentIceFraction: 0,
      steamFraction: 0,
    };
  }

  return {
    liquidOceanFraction: liquid / total,
    landFraction: land / total,
    permanentIceFraction: ice / total,
    steamFraction: steam / total,
  };
}

function moonWaterInventoryEntry(volatileInventory = []) {
  return normalizeHabitabilityInventory(volatileInventory).find(
    (volatile) => volatile?.canonicalSpecies === "h2o",
  );
}

function classifyMoonComposition({ compositionOverride, compositionClass, densityGcm3 }) {
  const explicit = String(compositionOverride || compositionClass || "").trim();
  if (explicit) return explicit;
  const density = Math.max(toFinite(densityGcm3, 0), 0);
  if (density < 1) return "Very icy";
  if (density < 2) return "Icy";
  if (density < 3.2) return "Mixed rock/ice";
  if (density <= 5) return "Rocky";
  return "Iron-rich";
}

function estimateWaterMassFraction({ waterPresent, compositionKey }) {
  if (!waterPresent) return 0;
  return WATER_FRACTION_BY_CLASS[compositionKey] ?? 0.01;
}

function estimateEquivalentWaterDepthM({ massMoon, radiusMoon, waterMassFraction }) {
  const bodyMassKg = Math.max(toFinite(massMoon, 0), 0) * LUNAR_MASS_KG;
  const radiusMeters = Math.max(toFinite(radiusMoon, 0), 0) * LUNAR_RADIUS_M;
  const fraction = clamp(toFinite(waterMassFraction, 0), 0, 1);
  if (bodyMassKg <= 0 || radiusMeters <= 0 || fraction <= 0) return 0;

  const waterMassKg = bodyMassKg * fraction;
  const surfaceAreaM2 = 4 * Math.PI * radiusMeters ** 2;
  if (surfaceAreaM2 <= 0) return 0;
  return waterMassKg / (surfaceAreaM2 * WATER_DENSITY_KG_M3);
}

function surfaceCoverageFromDepthKm(depthKm) {
  const depth = Math.max(toFinite(depthKm, 0), 0);
  if (depth <= 0) return 0;
  if (depth < 0.5) return 0.08 + 0.12 * (depth / 0.5);
  if (depth < 5) return 0.2 + 0.3 * ((depth - 0.5) / 4.5);
  if (depth < 20) return 0.5 + 0.25 * ((depth - 5) / 15);
  if (depth < 80) return 0.75 + 0.2 * ((depth - 20) / 60);
  return 0.95;
}

function pressureAccessibilityPenalty(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0) return 0;
  if (pressure < 0.01) return 0.35;
  if (pressure < 0.1) return 0.55;
  if (pressure < 0.5) return 0.8;
  return 1;
}

function estimateSubsurfaceOceanScore({
  waterPresent,
  frozenSurface,
  temperatureK,
  tidalHeatingEarth,
  equivalentWaterDepthKm,
  compositionKey,
  compositionOverride,
} = {}) {
  if (!waterPresent || !frozenSurface) return 0;

  const compositionSupport = SUBSURFACE_SUPPORT_BY_CLASS[compositionKey] ?? 0;
  const coldSurfaceScore =
    temperatureK > 0 && temperatureK < 273 ? clamp((273 - temperatureK) / 160, 0, 1) : 0;
  const tidalSupport = clamp(
    Math.log10(1 + Math.max(toFinite(tidalHeatingEarth, 0), 0) * 20) / 2.2,
    0,
    1,
  );
  const inventorySupport = clamp(
    Math.log10(1 + Math.max(toFinite(equivalentWaterDepthKm, 0), 0)) / 2.2,
    0,
    1,
  );
  const overrideSupport = String(compositionOverride || "") === "Subsurface ocean" ? 1 : 0;

  return clamp(
    0.2 * compositionSupport +
      0.15 * coldSurfaceScore +
      0.25 * tidalSupport +
      0.15 * inventorySupport +
      0.25 * overrideSupport,
    0,
    1,
  );
}

function highPressureIceThresholdKm(gravityG) {
  const gravityMs2 = Math.max(toFinite(gravityG, 0), 0) * 9.80665;
  if (gravityMs2 <= 0) return Infinity;
  return HIGH_PRESSURE_ICE_THRESHOLD_PA / (WATER_DENSITY_KG_M3 * gravityMs2) / 1000;
}

export function hydrosphereStateFromMoon({
  volatileInventory,
  surfaceTempK,
  surfacePressurePa,
  tidalHeatingEarth,
  gravityG,
  densityGcm3,
  massMoon,
  radiusMoon,
  compositionClass,
  compositionOverride,
} = {}) {
  const notes = ["moon-hydrosphere-v1"];
  const water = moonWaterInventoryEntry(volatileInventory);
  const tempK = Math.max(toFinite(surfaceTempK, 0), 0);
  const pressureAtm = Math.max(toFinite(surfacePressurePa, 0), 0) / 101325;
  const tidalHeating = Math.max(toFinite(tidalHeatingEarth, 0), 0);
  const compositionKey = classifyMoonComposition({
    compositionOverride,
    compositionClass,
    densityGcm3,
  });
  const waterMassFraction = estimateWaterMassFraction({
    waterPresent: water?.present === true,
    compositionKey,
  });
  const equivalentWaterDepthM = estimateEquivalentWaterDepthM({
    massMoon,
    radiusMoon,
    waterMassFraction,
  });
  const equivalentWaterDepthKm = equivalentWaterDepthM / 1000;
  const coverageFraction = water?.present ? surfaceCoverageFromDepthKm(equivalentWaterDepthKm) : 0;
  const boilingPointK = waterBoilingK(Math.max(pressureAtm, MIN_LIQUID_PRESSURE_ATM));
  const nearMeltingWithStrongTides =
    pressureAtm >= MIN_LIQUID_PRESSURE_ATM && tempK >= 260 && tempK < 273 && tidalHeating >= 1;
  const supportsSurfaceLiquid =
    water?.present &&
    pressureAtm >= MIN_LIQUID_PRESSURE_ATM &&
    ((tempK >= 273 && tempK <= boilingPointK) || nearMeltingWithStrongTides);
  const supportsSteam =
    water?.present &&
    !supportsSurfaceLiquid &&
    ((pressureAtm < MIN_LIQUID_PRESSURE_ATM && tempK >= 273) ||
      (tempK > 0 && tempK > boilingPointK));
  const frozenSurface = water?.present && !supportsSurfaceLiquid && !supportsSteam;
  const subsurfaceOceanScore = estimateSubsurfaceOceanScore({
    waterPresent: water?.present === true,
    frozenSurface,
    temperatureK: tempK,
    tidalHeatingEarth: tidalHeating,
    equivalentWaterDepthKm,
    compositionKey,
    compositionOverride,
  });
  const subsurfaceOceanPresent = subsurfaceOceanScore >= 0.55;

  if (!water?.present) {
    notes.push("no-water-inventory");
    return {
      regime: "Dry",
      hydrosphereState: "Dry surface",
      modelVersion: "moon-hydrosphere-v2",
      compositionKey,
      waterMassFraction: 0,
      equivalentWaterDepthM: 0,
      waterCoverageFraction: 0,
      liquidOceanFraction: 0,
      landFraction: 1,
      permanentIceFraction: 0,
      steamFraction: 0,
      surfaceAccessibleLiquidFraction: 0,
      subsurfaceOceanPresent: false,
      subsurfaceOceanScore: 0,
      highPressureIceBarrier: false,
      highPressureIceThresholdKm: round(highPressureIceThresholdKm(gravityG), 1),
      iceShellThicknessKm: 0,
      subsurfaceOceanDepthKm: 0,
      estimatedSurfaceOceanDepthKm: 0,
      estimatedSubsurfaceOceanDepthKm: 0,
      estimatedIceShellThicknessKm: 0,
      notes,
    };
  }

  if (nearMeltingWithStrongTides) notes.push("tidal-thaw-support");

  let regime = "Surface ice";
  let hydrosphereState = "Frozen surface";
  let liquidOceanFraction = 0;
  let permanentIceFraction = 0;
  let steamFraction = 0;
  let landFraction = 1;
  let surfaceAccessibleLiquidFraction = 0;
  let estimatedSurfaceOceanDepthKm = 0;
  let estimatedSubsurfaceOceanDepthKm = 0;
  let estimatedIceShellThicknessKm = 0;

  if (supportsSurfaceLiquid) {
    liquidOceanFraction = coverageFraction;
    landFraction = Math.max(0, 1 - coverageFraction);
    surfaceAccessibleLiquidFraction =
      liquidOceanFraction * pressureAccessibilityPenalty(pressureAtm);
    estimatedSurfaceOceanDepthKm = clamp(
      Math.max(equivalentWaterDepthKm * 0.7, coverageFraction >= 0.8 ? 15 : 1),
      1,
      250,
    );
    regime =
      coverageFraction >= 0.8
        ? "Global ocean"
        : coverageFraction >= 0.35
          ? "Surface ocean"
          : "Thin liquid";
    hydrosphereState = regime;
    notes.push("surface-liquid-water");
  } else if (supportsSteam) {
    steamFraction = coverageFraction > 0 ? coverageFraction : 1;
    landFraction = Math.max(0, 1 - steamFraction);
    regime = "Steam";
    hydrosphereState = "Steam / vapour";
    notes.push("surface-water-vapour");
  } else if (subsurfaceOceanPresent) {
    permanentIceFraction = coverageFraction > 0 ? coverageFraction : 0.85;
    landFraction = Math.max(0, 1 - permanentIceFraction);
    estimatedSubsurfaceOceanDepthKm = clamp(
      Math.max(equivalentWaterDepthKm * (0.35 + 0.35 * subsurfaceOceanScore), 5),
      5,
      250,
    );
    const tideScore = clamp(Math.log10(1 + tidalHeating * 20) / 2.2, 0, 1);
    const inventoryScore = clamp(Math.log10(1 + equivalentWaterDepthKm) / 2.2, 0, 1);
    estimatedIceShellThicknessKm = clamp(
      4 + 45 * (1 - tideScore) + 15 * (1 - inventoryScore),
      2,
      120,
    );
    regime = "Subsurface ocean";
    hydrosphereState = "Ice shell over subsurface ocean";
    notes.push("subsurface-ocean-supported");
  } else {
    permanentIceFraction = coverageFraction > 0 ? coverageFraction : 1;
    landFraction = Math.max(0, 1 - permanentIceFraction);
    estimatedIceShellThicknessKm = clamp(Math.max(equivalentWaterDepthKm * 0.8, 1), 1, 200);
    regime = coverageFraction >= 0.8 ? "Ice shell" : "Surface ice";
    hydrosphereState = regime;
    notes.push(water.status === "Stable ice" ? "stable-surface-ice" : "frozen-water-inventory");
  }

  const normalized = normalizeFractions({
    liquidOceanFraction,
    landFraction,
    permanentIceFraction,
    steamFraction,
  });
  const oceanDepthForBarrier = Math.max(
    estimatedSurfaceOceanDepthKm,
    estimatedSubsurfaceOceanDepthKm,
  );
  const highPressureThresholdKm = highPressureIceThresholdKm(gravityG);
  const highPressureIceBarrier =
    oceanDepthForBarrier > 0 && oceanDepthForBarrier >= highPressureThresholdKm;
  if (highPressureIceBarrier) notes.push("high-pressure-ice-barrier");

  return {
    regime,
    hydrosphereState,
    modelVersion: "moon-hydrosphere-v2",
    compositionKey,
    waterMassFraction: round(waterMassFraction, 4),
    equivalentWaterDepthM: round(equivalentWaterDepthM, 1),
    waterCoverageFraction: round(coverageFraction, 3),
    liquidOceanFraction: round(normalized.liquidOceanFraction, 3),
    landFraction: round(normalized.landFraction, 3),
    permanentIceFraction: round(normalized.permanentIceFraction, 3),
    steamFraction: round(normalized.steamFraction, 3),
    surfaceAccessibleLiquidFraction: round(surfaceAccessibleLiquidFraction, 3),
    subsurfaceOceanPresent,
    subsurfaceOceanScore: round(subsurfaceOceanScore, 3),
    highPressureIceBarrier,
    highPressureIceThresholdKm: round(highPressureThresholdKm, 1),
    iceShellThicknessKm: round(estimatedIceShellThicknessKm, 1),
    subsurfaceOceanDepthKm: round(estimatedSubsurfaceOceanDepthKm, 1),
    estimatedSurfaceOceanDepthKm: round(estimatedSurfaceOceanDepthKm, 1),
    estimatedSubsurfaceOceanDepthKm: round(estimatedSubsurfaceOceanDepthKm, 1),
    estimatedIceShellThicknessKm: round(estimatedIceShellThicknessKm, 1),
    notes,
  };
}
