import { clamp, round, toFinite } from "../utils.js";

const MODEL_VERSION = "icy-moon-exosphere-v1";
const MOON_RADIUS_KM = 1738.1;
const EUROPA_RADIUS_KM = 1560.8;
const EUROPA_O2_PRODUCTION_KG_S = 12;
const EUROPA_PARENT_BELT_LEVEL = 0.9306;
const BROAD_O2_RANGE_KG_S = [0.1, 100];

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function logRangeScore(value, lower, upper) {
  const number = finiteNonNegative(value, 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const low = Math.log10(Math.max(lower, 1e-12));
  const high = Math.log10(Math.max(upper, lower * 1.0001));
  return clamp((Math.log10(Math.max(number, 1e-12)) - low) / (high - low), 0, 1);
}

function classFromScore(score, labels = ["low", "moderate", "high"]) {
  if (score >= 0.66) return labels[2];
  if (score >= 0.33) return labels[1];
  return labels[0];
}

function radiusKmFromInput({ radiusMoon, radiusKm }) {
  const explicitKm = finiteNonNegative(radiusKm, NaN);
  if (Number.isFinite(explicitKm) && explicitKm > 0) return explicitKm;
  const radius = finiteNonNegative(radiusMoon, 0);
  if (radius <= 0) return 0;
  return radius > 100 ? radius : radius * MOON_RADIUS_KM;
}

function pressureScore(surfacePressurePa) {
  const pressurePa = finiteNonNegative(surfacePressurePa, 0);
  if (pressurePa <= 0.1) return 1;
  if (pressurePa >= 1000) return 0.02;
  return clamp(1 - logRangeScore(pressurePa, 0.1, 1000), 0.02, 1);
}

function coldSurfaceScore(surfaceTempK) {
  const tempK = finiteNonNegative(surfaceTempK, 0);
  if (tempK <= 0) return 0.45;
  if (tempK >= 70 && tempK <= 160) return 1;
  if (tempK < 70) return clamp(0.65 + (tempK / 70) * 0.25, 0.55, 0.9);
  if (tempK < 230) return clamp(1 - (tempK - 160) / 140, 0.5, 1);
  if (tempK < 273) return 0.25;
  return 0.05;
}

function waterInventoryScore(hydrosphere = {}) {
  const waterMass = fraction(hydrosphere?.waterMassFraction, 0);
  const equivalentDepthScore = logRangeScore(hydrosphere?.equivalentWaterDepthM, 100, 100000);
  const coverage = Math.max(
    fraction(hydrosphere?.permanentIceFraction, 0),
    fraction(hydrosphere?.waterCoverageFraction, 0),
  );
  const explicitWater = waterMass > 0 ? clamp(waterMass / 0.08, 0.25, 1) : 0;
  const inferredWater = /ice|ocean|water/i.test(
    `${hydrosphere?.regime || ""} ${hydrosphere?.hydrosphereState || ""} ${hydrosphere?.compositionKey || ""}`,
  )
    ? 0.7
    : 0;
  return clamp(Math.max(explicitWater, equivalentDepthScore, coverage, inferredWater), 0, 1);
}

function iceSurfaceScore(hydrosphere = {}) {
  const iceFraction = fraction(hydrosphere?.permanentIceFraction, 0);
  const frozenSurface = hydrosphere?.frozenSurface === true ? 1 : 0;
  const iceText = /ice shell|surface ice|frozen|subsurface ocean/i.test(
    `${hydrosphere?.regime || ""} ${hydrosphere?.hydrosphereState || ""}`,
  )
    ? 0.75
    : 0;
  const liquidPenalty =
    fraction(hydrosphere?.liquidOceanFraction, 0) > 0.05 ||
    hydrosphere?.surfaceLiquidPresent === true ||
    hydrosphere?.steamPresent === true
      ? 0.45
      : 1;
  return clamp(Math.max(iceFraction, frozenSurface, iceText) * liquidPenalty, 0, 1);
}

function particleScore(radiation = {}) {
  const parentBelt = fraction(radiation?.parentBeltLevel, 0);
  const surfaceExposure = fraction(radiation?.surfaceExposure, 0);
  const doseScore = logRangeScore(radiation?.surfaceExposureRemDayEquivalent, 0.1, 500);
  const parentScore = Math.max(parentBelt, surfaceExposure, doseScore);
  if (radiation?.insideMagnetosphere === true) return clamp(parentScore, 0, 1);
  const stellarOnly = Math.max(
    fraction(radiation?.stellarXuvLevel, 0),
    logRangeScore(radiation?.stellarXuvFluxRatio, 1, 100),
  );
  return clamp(Math.max(parentScore * 0.35, stellarOnly * 0.3), 0, 0.45);
}

function magnetosphereMembershipScore(radiation = {}) {
  if (radiation?.insideMagnetosphere === true) {
    const compression = String(radiation?.parentMagnetosphereCompressionClass || "").toLowerCase();
    if (compression.includes("extended") || compression.includes("expanded")) return 1;
    return 0.85;
  }
  if (finiteNonNegative(radiation?.surfaceExposureRemDayEquivalent, 0) > 0) return 0.2;
  return 0;
}

function unsupportedOutput(reason) {
  return {
    modelVersion: MODEL_VERSION,
    supported: false,
    present: false,
    sourceMechanism: "unsupported",
    secondaryMechanisms: [],
    dominantNeutralSpecies: [],
    dominantIonSpecies: [],
    minorNeutralSpecies: [],
    exosphereClass: "No icy sputtered O2 exosphere",
    retainedAtmosphereCoupling: "none",
    supportScore: 0,
    evidenceClass: "unsupported",
    calibrationClass: "unsupported",
    oxygenProductionKgS: null,
    oxygenProductionRangeKgS: null,
    oxygenProductionConfidence: "unsupported",
    hydrogenEscapeClass: "unsupported",
    surfaceRetentionClass: "unsupported",
    oxidantDeliveryClass: "unsupported",
    ionPickupClass: "unsupported",
    surfaceErosionClass: "unsupported",
    abioticOxygenSource: false,
    pressureContributionAtm: 0,
    pressureContributionPa: 0,
    greenhouseContributionK: 0,
    breathabilityContribution: "none",
    biosignatureContribution: "none",
    assumptions: [],
    notes: [reason],
  };
}

function suppressedOutput({ supportScore, notes }) {
  return {
    ...unsupportedOutput("suppressed"),
    supported: true,
    sourceMechanism: "none",
    exosphereClass: "Suppressed by retained atmosphere",
    supportScore: round(supportScore, 3),
    evidenceClass: "low",
    calibrationClass: "suppressed",
    notes,
  };
}

function particleFluxRatio({ radiation = {}, calibrationReference = null }) {
  const exposure = finiteNonNegative(radiation?.surfaceExposureRemDayEquivalent, 0);
  const referenceExposure = finiteNonNegative(
    calibrationReference?.europaSurfaceExposureRemDayEquivalent,
    0,
  );
  if (referenceExposure > 0 && exposure > 0) {
    return clamp(exposure / referenceExposure, 0.01, 25);
  }
  const normalizedParticle = Math.max(
    fraction(radiation?.parentBeltLevel, 0),
    fraction(radiation?.surfaceExposure, 0),
  );
  if (normalizedParticle <= 0) return 0;
  return clamp(
    normalizedParticle ** 1.2 / Math.max(EUROPA_PARENT_BELT_LEVEL ** 1.2, 1e-6),
    0.01,
    25,
  );
}

export function estimateSputteredOxygenProductionKgS({
  radiusKm,
  radiation,
  iceSurfaceScore: iceScore = 1,
  lowPressureScore = 1,
  sputterEfficiencyClassFactor = 1,
  confidenceLimiter = 1,
  calibrationReference = null,
} = {}) {
  const bodyRadiusKm = finiteNonNegative(radiusKm, 0);
  if (bodyRadiusKm <= 0) return null;
  const areaRatio = (bodyRadiusKm / EUROPA_RADIUS_KM) ** 2;
  const fluxRatio = particleFluxRatio({ radiation, calibrationReference });
  if (fluxRatio <= 0) return null;
  const estimate =
    EUROPA_O2_PRODUCTION_KG_S *
    areaRatio *
    fluxRatio ** 0.7 *
    clamp(iceScore, 0, 1) *
    clamp(lowPressureScore, 0, 1) *
    clamp(sputterEfficiencyClassFactor, 0.1, 2) *
    clamp(confidenceLimiter, 0, 1);
  return round(clamp(estimate, BROAD_O2_RANGE_KG_S[0], BROAD_O2_RANGE_KG_S[1]), 3);
}

export function scoreIcyMoonExosphereSupport({
  hydrosphere = {},
  atmosphere = {},
  radiation = {},
  temperature = {},
} = {}) {
  const surfacePressurePa = finiteNonNegative(atmosphere?.surfacePressurePa, 0);
  const pressure = pressureScore(surfacePressurePa);
  const scores = {
    iceSurfaceScore: iceSurfaceScore(hydrosphere),
    parentParticleScore: particleScore(radiation),
    magnetosphereMembershipScore: magnetosphereMembershipScore(radiation),
    lowPressureScore: pressure,
    coldSurfaceScore: coldSurfaceScore(
      temperature?.surfaceK ?? temperature?.effectiveSurfaceK ?? temperature?.baselineSurfaceK,
    ),
    waterInventoryScore: waterInventoryScore(hydrosphere),
    retainedAtmosphereSuppression: pressure,
  };
  const supportScore = Object.values(scores).reduce((product, score) => product * score, 1);
  return {
    ...Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, round(value, 3)])),
    supportScore: round(clamp(supportScore, 0, 1), 3),
  };
}

function classifyCalibration({ support, radiation, radiusKm }) {
  if (support.supportScore < 0.25) return "unsupported";
  const parentParticle = support.parentParticleScore;
  if (support.lowPressureScore < 0.25 || support.retainedAtmosphereSuppression < 0.25) {
    return "suppressed";
  }
  if (
    support.supportScore >= 0.55 &&
    radiation?.insideMagnetosphere === true &&
    parentParticle >= 0.65 &&
    radiusKm >= 800 &&
    radiusKm <= 3200
  ) {
    return "Europa-like";
  }
  if (radiation?.insideMagnetosphere === true && parentParticle >= 0.25) {
    return "icy-magnetospheric";
  }
  return "weak-solar-wind";
}

function oxygenProductionRange(estimate) {
  if (!Number.isFinite(Number(estimate)) || estimate <= 0) return null;
  return [
    round(clamp(estimate * 0.5, BROAD_O2_RANGE_KG_S[0], BROAD_O2_RANGE_KG_S[1]), 3),
    round(clamp(estimate * 1.5, BROAD_O2_RANGE_KG_S[0], BROAD_O2_RANGE_KG_S[1]), 3),
  ];
}

export function computeIcyMoonExosphere({
  hydrosphere = {},
  atmosphere = {},
  radiation = {},
  temperature = {},
  radiusMoon = null,
  radiusKm = null,
  calibrationReference = null,
} = {}) {
  const resolvedRadiusKm = radiusKmFromInput({ radiusMoon, radiusKm });
  if (resolvedRadiusKm <= 0) return unsupportedOutput("missing-radius");
  if (!radiation || typeof radiation !== "object") return unsupportedOutput("missing-radiation");

  const support = scoreIcyMoonExosphereSupport({
    hydrosphere,
    atmosphere,
    radiation,
    temperature,
  });
  const notes = [];
  if (support.waterInventoryScore <= 0.05 || support.iceSurfaceScore <= 0.05) {
    return unsupportedOutput("missing-water-ice");
  }
  if (support.lowPressureScore < 0.25) {
    return suppressedOutput({
      supportScore: support.supportScore,
      notes: ["thick-atmosphere-shielding"],
    });
  }
  if (support.parentParticleScore <= 0.05 || support.magnetosphereMembershipScore <= 0.05) {
    return unsupportedOutput("weak-parent-particle-context");
  }

  const calibrationClass = classifyCalibration({ support, radiation, radiusKm: resolvedRadiusKm });
  if (calibrationClass === "unsupported") {
    return unsupportedOutput("support-below-threshold");
  }
  if (calibrationClass === "suppressed") {
    return suppressedOutput({
      supportScore: support.supportScore,
      notes: ["thick-atmosphere-shielding"],
    });
  }

  const quantified = support.supportScore >= 0.55 && support.parentParticleScore >= 0.45;
  const oxygenProductionKgS = quantified
    ? estimateSputteredOxygenProductionKgS({
        radiusKm: resolvedRadiusKm,
        radiation,
        iceSurfaceScore: support.iceSurfaceScore,
        lowPressureScore: support.lowPressureScore,
        calibrationReference,
      })
    : null;
  if (!quantified) notes.push("qualitative-exosphere-only");
  if (calibrationClass !== "Europa-like") notes.push("not-europa-calibrated");

  const evidenceClass =
    support.supportScore >= 0.75 ? "high" : support.supportScore >= 0.4 ? "medium" : "low";
  const ionPickupClass = classFromScore(support.parentParticleScore, [
    "weak pickup-ion loss",
    "moderate pickup-ion loss",
    "strong pickup-ion loss",
  ]);
  const surfaceRetentionClass = classFromScore(support.coldSurfaceScore * support.iceSurfaceScore, [
    "limited surface retention",
    "moderate surface retention",
    "strong surface retention",
  ]);
  const oxidantDeliveryClass = classFromScore(
    (support.supportScore + fraction(hydrosphere?.subsurfaceOceanScore, 0)) / 2,
    ["low oxidant context", "moderate oxidant context", "strong oxidant context"],
  );
  const surfaceErosionClass = classFromScore(support.parentParticleScore, [
    "weak radiolytic erosion",
    "moderate radiolytic erosion",
    "strong radiolytic erosion",
  ]);

  return {
    modelVersion: MODEL_VERSION,
    supported: true,
    present: support.supportScore >= 0.25,
    sourceMechanism:
      calibrationClass === "weak-solar-wind" ? "weak-photolysis" : "radiolysis-sputtering",
    secondaryMechanisms: ["thermal-diffusion", "surface-reimplantation"],
    dominantNeutralSpecies: ["O2", "H2"],
    dominantIonSpecies: ["O2+", "H2+"],
    minorNeutralSpecies: ["H", "O", "OH", "H2O"],
    exosphereClass:
      calibrationClass === "Europa-like"
        ? "Europa-like sputtered O2/H2 exosphere"
        : calibrationClass === "icy-magnetospheric"
          ? "Icy magnetospheric water-group exosphere"
          : "Weak photolytic icy exosphere",
    retainedAtmosphereCoupling: "exosphere-only",
    ...support,
    evidenceClass,
    calibrationClass,
    oxygenProductionKgS,
    oxygenProductionRangeKgS: oxygenProductionRange(oxygenProductionKgS),
    oxygenProductionConfidence: quantified ? evidenceClass : "low",
    hydrogenEscapeClass: "non-thermal escape-prone",
    surfaceRetentionClass,
    oxidantDeliveryClass,
    ionPickupClass,
    surfaceErosionClass,
    abioticOxygenSource: true,
    pressureContributionAtm: 0,
    pressureContributionPa: 0,
    greenhouseContributionK: 0,
    breathabilityContribution: "none",
    biosignatureContribution: "abiotic-caution-only",
    assumptions: [
      "global-average-exosphere-proxy",
      "oxygen-production-calibrated-to-europa",
      "no-neutral-column-density-map",
    ],
    notes,
  };
}
