import { clamp, toFinite } from "../utils.js";
import { buildRockyBodyCompositionCoupling } from "../compositionCoupling.js";

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

function normalizeTidalPersistenceContext(context) {
  if (!context || typeof context !== "object") return null;
  return {
    modelVersion: context.modelVersion || "sustained-tidal-heating-context-v1",
    currentTidalHeatingClass: String(context.currentTidalHeatingClass || "unknown"),
    sustainedTidalHeatingClass: String(context.sustainedTidalHeatingClass || "unknown"),
    eccentricityPersistence: String(context.eccentricityPersistence || "uncertain"),
    persistenceConfidence: String(context.persistenceConfidence || context.confidence || "unknown"),
    supportingMechanism: String(context.supportingMechanism || "none"),
    limitingFactor: String(context.limitingFactor || ""),
    note: String(context.note || ""),
  };
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
  tidalPersistenceContext = null,
  rockyBodyComposition = null,
} = {}) {
  const notes = ["moon-geology-v1"];
  const compositionCoupling = buildRockyBodyCompositionCoupling(rockyBodyComposition);
  const persistenceContext = normalizeTidalPersistenceContext(tidalPersistenceContext);
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
  const sulfurScore = clamp(toFinite(compositionCoupling.reservoirScores?.sulfur, 0), 0, 1);
  const saltScore = clamp(toFinite(compositionCoupling.reservoirScores?.salt, 0), 0, 1);
  const volatileScore = clamp(toFinite(compositionCoupling.reservoirScores?.volatile, 0), 0, 1);
  const silicateScore = clamp(toFinite(compositionCoupling.reservoirScores?.silicate, 0), 0, 1);
  const volcanicCompositionBoost = compositionCoupling.available
    ? volcanic.heatScore *
      (0.12 * sulfurScore + 0.06 * silicateScore) *
      (0.35 + 0.65 * volcanic.interiorRetention)
    : 0;
  const cryovolcanicCompositionBoost = compositionCoupling.available
    ? cryovolcanic.heatScore * cryovolcanic.waterSupport * (0.16 * saltScore + 0.08 * volatileScore)
    : 0;
  const volcanicScore = clamp(volcanic.score + volcanicCompositionBoost, 0, 1);
  const cryovolcanicScore = clamp(cryovolcanic.score + cryovolcanicCompositionBoost, 0, 1);
  const resurfacing = resurfacingClass(volcanicScore, cryovolcanicScore);
  const volatileReplenishmentScore = computeVolatileReplenishment(
    volcanicScore,
    cryovolcanicScore,
    cryovolcanic.waterSupport,
  );
  const oceanPersistenceScore = clamp(
    computeOceanPersistence({
      hydrosphere,
      cryovolcanicHeatScore: cryovolcanic.heatScore,
      radiogenicHeatingWm2,
      tidalHeatingEarth,
      massMoon,
      gravityG,
    }) +
      (compositionCoupling.available
        ? (0.07 * saltScore + 0.05 * volatileScore) * cryovolcanic.waterSupport
        : 0),
    0,
    1,
  );

  if (volcanicScore >= 0.4) notes.push("active-silicate-volcanism");
  if (cryovolcanicScore >= 0.4) notes.push("active-cryovolcanism");
  if (volatileReplenishmentScore >= 0.4) notes.push("volatile-replenishment-supported");
  if (oceanPersistenceScore >= 0.4) notes.push("ocean-persistence-supported");
  if (compositionCoupling.available) {
    if (sulfurScore >= 0.45) notes.push("composition-sulfur-volcanism-supported");
    if (saltScore >= 0.45) notes.push("composition-salt-brine-cryovolcanism-supported");
    if (volatileScore >= 0.45) notes.push("composition-volatile-replenishment-supported");
  }
  if (persistenceContext?.sustainedTidalHeatingClass === "likely-sustained") {
    notes.push("tidal-heating-likely-sustained");
  } else if (persistenceContext?.sustainedTidalHeatingClass === "damping") {
    notes.push("tidal-heating-may-damp");
  } else if (persistenceContext?.sustainedTidalHeatingClass === "overdriven") {
    notes.push("overdriven-tidal-heating-stress");
  } else if (
    persistenceContext?.sustainedTidalHeatingClass === "uncertain" &&
    persistenceContext.currentTidalHeatingClass !== "low"
  ) {
    notes.push("tidal-heating-persistence-uncertain");
  }

  return {
    modelVersion: "moon-geology-v1",
    compositionKey,
    volcanicActivityScore: volcanicScore,
    volcanicActivity: activityLabel(volcanicScore),
    cryovolcanicActivityScore: cryovolcanicScore,
    cryovolcanicActivity: activityLabel(cryovolcanicScore),
    resurfacingScore: Math.max(volcanicScore, cryovolcanicScore),
    resurfacingClass: resurfacing.resurfacingClass,
    resurfacingDominantProcess: resurfacing.dominantProcess,
    volatileReplenishmentScore,
    volatileReplenishmentTendency: tendencyLabel(volatileReplenishmentScore),
    oceanPersistenceScore,
    oceanPersistenceTendency: tendencyLabel(oceanPersistenceScore),
    dynamicalPersistenceContext: persistenceContext,
    currentTidalHeatingClass: persistenceContext?.currentTidalHeatingClass || "unknown",
    sustainedTidalHeatingClass: persistenceContext?.sustainedTidalHeatingClass || "unknown",
    tidalPersistenceConfidence: persistenceContext?.persistenceConfidence || "unknown",
    tidalPersistenceNote: persistenceContext?.note || "",
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
      compositionVolcanicBoost: volcanicCompositionBoost,
      compositionCryovolcanicBoost: cryovolcanicCompositionBoost,
      compositionSaltScore: saltScore,
      compositionSulfurScore: sulfurScore,
      compositionVolatileScore: volatileScore,
    },
    compositionResurfacingBias: compositionCoupling.available
      ? {
          modelVersion: compositionCoupling.modelVersion,
          volcanicBoost: volcanicCompositionBoost,
          cryovolcanicBoost: cryovolcanicCompositionBoost,
          saltScore,
          sulfurScore,
          volatileScore,
          caveats: compositionCoupling.caveats,
        }
      : null,
    notes,
  };
}
