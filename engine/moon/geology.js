import { clamp, toFinite } from "../utils.js";

const VOLCANIC_CLASS_FACTOR = {
  "Very icy": 0,
  Icy: 0.05,
  "Subsurface ocean": 0.02,
  "Mixed rock/ice": 0.25,
  Rocky: 0.8,
  "Partially molten": 1,
  "Iron-rich": 0.65,
};

const CRYOVOLCANIC_CLASS_FACTOR = {
  "Very icy": 0.95,
  Icy: 0.9,
  "Subsurface ocean": 1,
  "Mixed rock/ice": 0.7,
  Rocky: 0.1,
  "Partially molten": 0,
  "Iron-rich": 0,
};

function activityLabel(score) {
  const value = clamp(toFinite(score, 0), 0, 1);
  if (value < 0.08) return "None";
  if (value < 0.2) return "Trace";
  if (value < 0.4) return "Low";
  if (value < 0.65) return "Moderate";
  if (value < 0.85) return "High";
  return "Extreme";
}

function tendencyLabel(score) {
  const value = clamp(toFinite(score, 0), 0, 1);
  if (value < 0.08) return "None";
  if (value < 0.25) return "Weak";
  if (value < 0.5) return "Moderate";
  if (value < 0.75) return "Strong";
  return "Robust";
}

function resurfacingClass(volcanicScore, cryovolcanicScore) {
  const volcanic = clamp(toFinite(volcanicScore, 0), 0, 1);
  const cryovolcanic = clamp(toFinite(cryovolcanicScore, 0), 0, 1);
  const dominantProcess =
    volcanic > cryovolcanic + 0.05
      ? "volcanic"
      : cryovolcanic > volcanic + 0.05
        ? "cryovolcanic"
        : volcanic > 0 || cryovolcanic > 0
          ? "mixed"
          : "none";
  const peak = Math.max(volcanic, cryovolcanic);

  if (peak < 0.08) {
    return {
      resurfacingClass: "Ancient / geologically quiet",
      dominantProcess,
    };
  }
  if (peak < 0.2) {
    return {
      resurfacingClass: "Mostly inactive cratered surface",
      dominantProcess,
    };
  }
  if (peak < 0.45) {
    return {
      resurfacingClass: "Localized resurfacing",
      dominantProcess,
    };
  }
  if (peak < 0.75) {
    return {
      resurfacingClass:
        dominantProcess === "cryovolcanic"
          ? "Active cryovolcanic resurfacing"
          : dominantProcess === "volcanic"
            ? "Active volcanic resurfacing"
            : "Active mixed resurfacing",
      dominantProcess,
    };
  }
  return {
    resurfacingClass:
      dominantProcess === "cryovolcanic"
        ? "Intense cryovolcanic resurfacing"
        : dominantProcess === "volcanic"
          ? "Intense volcanic resurfacing"
          : "Intense mixed resurfacing",
    dominantProcess,
  };
}

function logarithmicScore(value, multiplier, divisor) {
  const safeValue = Math.max(toFinite(value, 0), 0);
  return clamp(Math.log10(1 + safeValue * multiplier) / divisor, 0, 1);
}

function compositionKeyFromInputs({ compositionOverride, compositionClass, densityGcm3 }) {
  const explicit = String(compositionOverride || compositionClass || "").trim();
  if (explicit) return explicit;
  const density = Math.max(toFinite(densityGcm3, 0), 0);
  if (density < 1) return "Very icy";
  if (density < 2) return "Icy";
  if (density < 3.2) return "Mixed rock/ice";
  if (density <= 5) return "Rocky";
  return "Iron-rich";
}

function computeSilicateVolcanism({
  compositionKey,
  tidalHeatingEarth,
  radiogenicHeatingWm2,
  massMoon,
  gravityG,
  compositionOverride,
}) {
  const classFactor = VOLCANIC_CLASS_FACTOR[compositionKey] ?? 0;
  const heatScore = clamp(
    0.92 * logarithmicScore(tidalHeatingEarth, 8, 2) +
      0.08 * clamp(toFinite(radiogenicHeatingWm2, 0) / 0.02, 0, 1),
    0,
    1,
  );
  const interiorRetention = logarithmicScore(massMoon, 1.5, 0.45);
  const gravitySupport = clamp(toFinite(gravityG, 0) / 0.18, 0.05, 1);
  const modifier = 0.25 + 0.75 * Math.sqrt(interiorRetention * gravitySupport);
  let score = clamp(classFactor * heatScore * modifier, 0, 1);

  if (String(compositionOverride || "") === "Partially molten") {
    score = Math.max(score, clamp(0.72 + 0.22 * heatScore, 0, 1));
  }

  return {
    score,
    heatScore,
    interiorRetention,
    gravitySupport,
  };
}

function computeCryovolcanism({
  compositionKey,
  compositionOverride,
  tidalHeatingEarth,
  radiogenicHeatingWm2,
  gravityG,
  hydrosphere,
}) {
  const classFactor = CRYOVOLCANIC_CLASS_FACTOR[compositionKey] ?? 0;
  const hydrology = hydrosphere && typeof hydrosphere === "object" ? hydrosphere : {};
  const subsurfaceOceanScore = clamp(toFinite(hydrology.subsurfaceOceanScore, 0), 0, 1);
  const waterSupport = clamp(
    0.45 * (hydrology.subsurfaceOceanPresent ? 1 : subsurfaceOceanScore) +
      0.25 * clamp(toFinite(hydrology.permanentIceFraction, 0), 0, 1) +
      0.2 * clamp(toFinite(hydrology.liquidOceanFraction, 0), 0, 1) +
      0.1 * clamp(toFinite(hydrology.surfaceAccessibleLiquidFraction, 0), 0, 1),
    0,
    1,
  );
  const heatScore = clamp(
    0.8 * logarithmicScore(tidalHeatingEarth, 12, 1.35) +
      0.2 * clamp(toFinite(radiogenicHeatingWm2, 0) / 0.01, 0, 1),
    0,
    1,
  );
  const inventoryDepthKm = Math.max(
    toFinite(hydrology.estimatedSubsurfaceOceanDepthKm, 0),
    toFinite(hydrology.estimatedSurfaceOceanDepthKm, 0),
  );
  const inventoryDepthScore = logarithmicScore(inventoryDepthKm, 1, 1.4);
  const ventingScore = clamp(1 - toFinite(gravityG, 0) / 0.45, 0.35, 1);
  const modifier = 0.4 + 0.6 * Math.sqrt(inventoryDepthScore * ventingScore);
  let score = clamp(
    classFactor *
      (0.4 * waterSupport + 0.35 * heatScore + 0.15 * inventoryDepthScore + 0.1 * ventingScore) *
      modifier,
    0,
    1,
  );

  if (
    String(compositionOverride || "") === "Subsurface ocean" &&
    hydrology.subsurfaceOceanPresent
  ) {
    score = Math.max(score, clamp(0.58 + 0.18 * heatScore + 0.1 * inventoryDepthScore, 0, 1));
  }

  return {
    score,
    heatScore,
    waterSupport,
    inventoryDepthScore,
    ventingScore,
  };
}

function computeVolatileReplenishment(volcanicScore, cryovolcanicScore, waterSupport) {
  const sourceScore = Math.max(volcanicScore, cryovolcanicScore);
  return clamp(
    0.6 * sourceScore + 0.25 * cryovolcanicScore + 0.15 * clamp(toFinite(waterSupport, 0), 0, 1),
    0,
    1,
  );
}

function computeOceanPersistence({
  hydrosphere,
  cryovolcanicHeatScore,
  radiogenicHeatingWm2,
  tidalHeatingEarth,
  massMoon,
  gravityG,
}) {
  const hydrology = hydrosphere && typeof hydrosphere === "object" ? hydrosphere : {};
  const hydroSupport = clamp(
    Math.max(
      toFinite(hydrology.subsurfaceOceanScore, 0),
      toFinite(hydrology.surfaceAccessibleLiquidFraction, 0),
      toFinite(hydrology.liquidOceanFraction, 0) * 0.9,
      toFinite(hydrology.permanentIceFraction, 0) * 0.35,
    ),
    0,
    1,
  );
  if (hydroSupport <= 0) return 0;

  const bulkRetention =
    0.5 * logarithmicScore(massMoon, 3, 0.8) + 0.5 * clamp(toFinite(gravityG, 0) / 0.2, 0, 1);
  const thermalSupport = clamp(
    0.55 * clamp(toFinite(cryovolcanicHeatScore, 0), 0, 1) +
      0.25 * clamp(toFinite(radiogenicHeatingWm2, 0) / 0.005, 0, 1) +
      0.2 * logarithmicScore(tidalHeatingEarth, 4, 1.1),
    0,
    1,
  );
  const barrierFactor = hydrology.highPressureIceBarrier ? 0.7 : 1;

  return clamp(
    hydroSupport * (0.45 + 0.25 * thermalSupport + 0.2 * bulkRetention + 0.1) * barrierFactor,
    0,
    1,
  );
}

export function computeMoonGeology({
  tidalHeatingEarth = 0,
  tidalHeatingWm2 = 0,
  radiogenicHeatingWm2 = 0,
  massMoon = 0,
  gravityG = 0,
  densityGcm3 = 0,
  compositionClass = "",
  compositionOverride = "",
  hydrosphere = null,
} = {}) {
  const notes = ["moon-geology-v1"];
  const compositionKey = compositionKeyFromInputs({
    compositionOverride,
    compositionClass,
    densityGcm3,
  });
  const volcanic = computeSilicateVolcanism({
    compositionKey,
    tidalHeatingEarth,
    radiogenicHeatingWm2,
    massMoon,
    gravityG,
    compositionOverride,
  });
  const cryovolcanic = computeCryovolcanism({
    compositionKey,
    compositionOverride,
    tidalHeatingEarth,
    radiogenicHeatingWm2,
    gravityG,
    hydrosphere,
  });
  const resurfacing = resurfacingClass(volcanic.score, cryovolcanic.score);
  const volatileReplenishmentScore = computeVolatileReplenishment(
    volcanic.score,
    cryovolcanic.score,
    cryovolcanic.waterSupport,
  );
  const oceanPersistenceScore = computeOceanPersistence({
    hydrosphere,
    cryovolcanicHeatScore: cryovolcanic.heatScore,
    radiogenicHeatingWm2,
    tidalHeatingEarth,
    massMoon,
    gravityG,
  });

  if (volcanic.score >= 0.4) notes.push("active-silicate-volcanism");
  if (cryovolcanic.score >= 0.4) notes.push("active-cryovolcanism");
  if (volatileReplenishmentScore >= 0.4) notes.push("volatile-replenishment-supported");
  if (oceanPersistenceScore >= 0.4) notes.push("ocean-persistence-supported");

  return {
    modelVersion: "moon-geology-v1",
    compositionKey,
    volcanicActivityScore: volcanic.score,
    volcanicActivity: activityLabel(volcanic.score),
    cryovolcanicActivityScore: cryovolcanic.score,
    cryovolcanicActivity: activityLabel(cryovolcanic.score),
    resurfacingScore: Math.max(volcanic.score, cryovolcanic.score),
    resurfacingClass: resurfacing.resurfacingClass,
    resurfacingDominantProcess: resurfacing.dominantProcess,
    volatileReplenishmentScore,
    volatileReplenishmentTendency: tendencyLabel(volatileReplenishmentScore),
    oceanPersistenceScore,
    oceanPersistenceTendency: tendencyLabel(oceanPersistenceScore),
    inputs: {
      tidalHeatingEarth: Math.max(toFinite(tidalHeatingEarth, 0), 0),
      tidalHeatingWm2: Math.max(toFinite(tidalHeatingWm2, 0), 0),
      radiogenicHeatingWm2: Math.max(toFinite(radiogenicHeatingWm2, 0), 0),
      massMoon: Math.max(toFinite(massMoon, 0), 0),
      gravityG: Math.max(toFinite(gravityG, 0), 0),
    },
    breakdown: {
      silicateHeatScore: volcanic.heatScore,
      cryovolcanicHeatScore: cryovolcanic.heatScore,
      waterSupport: cryovolcanic.waterSupport,
      inventoryDepthScore: cryovolcanic.inventoryDepthScore,
      ventingScore: cryovolcanic.ventingScore,
      interiorRetention: volcanic.interiorRetention,
      gravitySupport: volcanic.gravitySupport,
    },
    notes,
  };
}
