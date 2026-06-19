import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

const MODEL_VERSION = "observability-context-v1";
const SOURCE_KEYS = ["observability"];
const EARTH_RADIUS_KM = 6371;
const SOL_RADIUS_KM = 695700;
const EARTH_MASS_MJUP = 1 / 317.828;

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function detectClass(score) {
  return scoreToClass(score, {
    high: "favorable",
    medium: "challenging",
    low: "difficult",
    none: "unfavorable",
    highAt: 0.7,
    mediumAt: 0.38,
    lowAt: 0.12,
  });
}

function interpretationClass(score) {
  return scoreToClass(score, {
    high: "high-context",
    medium: "medium-context",
    low: "low-context",
    none: "not-supported",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.16,
  });
}

function persistenceClass(score) {
  return scoreToClass(score, {
    high: "persistent",
    medium: "limited",
    low: "fragile",
    none: "not-persistent",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.16,
  });
}

function activityNoiseClass(score) {
  return scoreToClass(score, {
    high: "severe",
    medium: "active",
    low: "moderate",
    none: "quiet",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.16,
  });
}

function outputsOf(context) {
  const source = objectOrEmpty(context);
  return Object.keys(objectOrEmpty(source.outputs)).length ? source.outputs : source;
}

function includesText(value, needle) {
  return String(value || "")
    .toLowerCase()
    .includes(String(needle || "").toLowerCase());
}

function atmospherePersistenceScore(atmosphereEvolutionContext = null) {
  const context = outputsOf(atmosphereEvolutionContext);
  if (!Object.keys(context).length) return null;
  const trend = String(context.pressureTrendClass || "").toLowerCase();
  const lifetime = String(context.atmosphereLifetimeClass || "").toLowerCase();
  const loss = String(context.volatileLossRiskClass || "").toLowerCase();
  let score = 0.7;
  if (includesText(trend, "stable") || includesText(trend, "replenished")) score = 0.88;
  else if (includesText(trend, "balanced")) score = 0.72;
  else if (includesText(trend, "declining")) score = 0.45;
  else if (includesText(trend, "rapid") || includesText(trend, "no durable")) score = 0.14;

  if (includesText(lifetime, "none")) score = Math.min(score, 0.05);
  else if (includesText(lifetime, "transient") || includesText(lifetime, "rapid")) {
    score = Math.min(score, 0.18);
  } else if (includesText(lifetime, "short")) {
    score = Math.min(score, 0.35);
  } else if (includesText(lifetime, "geologic")) {
    score = Math.max(score, 0.72);
  }

  if (includesText(loss, "high")) score = Math.min(score, 0.24);
  else if (includesText(loss, "moderate")) score = Math.min(score, 0.52);
  else if (includesText(loss, "minimal")) score = Math.max(score, 0.76);
  return clamp(score, 0, 1);
}

function stellarActivityNoiseScore({
  environmentForcing = null,
  stellarHistoryDoseContext = null,
}) {
  const forcing = objectOrEmpty(environmentForcing);
  const hazards = objectOrEmpty(forcing.hazards);
  const activity = objectOrEmpty(forcing.activity);
  const history = outputsOf(stellarHistoryDoseContext);
  const hazardScore = Math.max(
    toFinite(hazards.xuvHazardScore, 0),
    toFinite(hazards.uvOverexposureScore, 0),
    toFinite(hazards.windCompressionScore, 0),
    toFinite(hazards.flareVariabilityScore, 0),
    clamp(Math.log10(Math.max(toFinite(forcing.flux?.xuvEarthAtOrbit, 1), 1)) / 2, 0, 1),
    clamp(toFinite(activity.activityFactor, 0) / 10, 0, 1),
    clamp(toFinite(activity.flareFrequencyRelative, 0) / 10, 0, 1),
  );
  const historyScore = Math.max(
    toFinite(history.waterLossRiskScore, 0),
    includesText(history.preMainSequenceExposureClass, "high") ? 0.45 : 0,
    includesText(history.windErosionDoseClass, "high") ? 0.45 : 0,
  );
  return clamp(Math.max(hazardScore, historyScore * 0.8), 0, 1);
}

function biosignatureContextScore({
  biosignatureContext = null,
  atmospherePersistence = null,
  activityNoiseScore: activityScore = 0,
}) {
  const bio = outputsOf(biosignatureContext);
  if (!Object.keys(bio).length) return 0.15;
  const falsePositiveRisk = String(bio.o2O3FalsePositiveRisk || "").toLowerCase();
  const confidence = String(bio.confidence || biosignatureContext?.confidence || "").toLowerCase();
  let score = bio.disequilibriumStrength === "High" ? 0.78 : bio.interpretationClass ? 0.48 : 0.2;
  if (confidence === "high") score += 0.08;
  if (confidence === "low") score -= 0.12;
  if (falsePositiveRisk.includes("high")) score = Math.min(score, 0.22);
  else if (falsePositiveRisk.includes("moderate")) score = Math.min(score, 0.48);
  if (atmospherePersistence != null && atmospherePersistence < 0.42) {
    score = Math.min(score, 0.32);
  }
  if (activityScore >= 0.72) score = Math.min(score, 0.28);
  else if (activityScore >= 0.42) score = Math.min(score, 0.5);
  return clamp(score, 0, 1);
}

export function buildObservabilityContext({
  bodyRadiusKm = EARTH_RADIUS_KM,
  bodyMassEarth = 1,
  starRadiusRsol = 1,
  starMassMsol = 1,
  semiMajorAxisAu = 1,
  orbitalPeriodDays = 365.25,
  distancePc = 10,
  atmosphereScaleHeightKm = null,
  baselineSurfaceTempK = null,
  effectiveSurfaceTempK = null,
  coupledClimatePass = null,
  cloudFraction = 0,
  hazeReductionFraction = 0,
  atmosphereEvolutionContext = null,
  stellarHistoryDoseContext = null,
  planetRadiationEnvironmentContext = null,
  environmentForcing = null,
  orbitalEpochContext = null,
  biosignatureContext = null,
  productivityContext = null,
} = {}) {
  const radiusKm = Math.max(0.001, toFinite(bodyRadiusKm, EARTH_RADIUS_KM));
  const starRadiusKm = Math.max(0.001, toFinite(starRadiusRsol, 1) * SOL_RADIUS_KM);
  const transitDepthPpm = (radiusKm / starRadiusKm) ** 2 * 1e6;
  const aAu = Math.max(0.000001, toFinite(semiMajorAxisAu, 1));
  const transitProbability = clamp((starRadiusKm + radiusKm) / (aAu * 149597870.7), 0, 1);
  const periodYears = Math.max(0.000001, toFinite(orbitalPeriodDays, 365.25) / 365.25);
  const massMjup = Math.max(0, toFinite(bodyMassEarth, 1) * EARTH_MASS_MJUP);
  const rvSemiAmplitudeMs =
    28.4329 *
    massMjup *
    periodYears ** (-1 / 3) *
    Math.max(0.0001, toFinite(starMassMsol, 1)) ** (-2 / 3);
  const angularSepArcsec = aAu / Math.max(0.001, toFinite(distancePc, 10));
  const contrastScore = clamp(Math.log10(1 + (aAu * radiusKm) / EARTH_RADIUS_KM) / 2.2, 0, 1);
  const angularScore = clamp((angularSepArcsec - 0.03) / 0.25, 0, 1);
  const transitSnrScore = clamp(Math.log10(1 + transitDepthPpm / 80) / 1.2, 0, 1);
  const scaleHeight = Math.max(0, toFinite(atmosphereScaleHeightKm, radiusKm > 0 ? 8 : 0));
  const atmospherePersistence = atmospherePersistenceScore(atmosphereEvolutionContext);
  const persistenceMute =
    atmospherePersistence == null ? 1 : clamp(0.2 + 0.8 * atmospherePersistence, 0, 1);
  const activityScore = stellarActivityNoiseScore({
    environmentForcing,
    stellarHistoryDoseContext,
  });
  const radiationOutputs = outputsOf(planetRadiationEnvironmentContext);
  const cloudMute = clamp(
    1 - 0.55 * toFinite(cloudFraction, 0) - 0.65 * toFinite(hazeReductionFraction, 0),
    0,
    1,
  );
  const featureScore =
    clamp(Math.log10(1 + (scaleHeight / 8) * (transitDepthPpm / 84)) / 1.5, 0, 1) *
    cloudMute *
    persistenceMute;
  const transmissionReadinessScore = clamp(featureScore * (1 - 0.35 * activityScore), 0, 1);
  const bioContextScore = biosignatureContextScore({
    biosignatureContext,
    atmospherePersistence,
    activityNoiseScore: activityScore,
  });
  const productivityScore = clamp(
    toFinite(productivityContext?.outputs?.primaryProductivityPotential, 0.2),
    0,
    1,
  );
  const biosignatureObservabilityScore = clamp(
    featureScore * (0.55 * bioContextScore + 0.45 * productivityScore),
    0,
    1,
  );

  return makeContext({
    modelVersion: MODEL_VERSION,
    status: CONTEXT_STATUS.SUPPORTED,
    confidence:
      orbitalEpochContext?.confidence === CONFIDENCE.LOW ? CONFIDENCE.LOW : CONFIDENCE.MEDIUM,
    inputs: {
      bodyRadiusKm: roundMaybe(radiusKm, 2),
      bodyMassEarth: roundMaybe(bodyMassEarth, 4),
      starRadiusRsol: roundMaybe(starRadiusRsol, 4),
      starMassMsol: roundMaybe(starMassMsol, 4),
      semiMajorAxisAu: roundMaybe(aAu, 6),
      distancePc: roundMaybe(distancePc, 3),
      baselineSurfaceTempK: roundMaybe(baselineSurfaceTempK, 3),
      effectiveSurfaceTempK: roundMaybe(
        effectiveSurfaceTempK ?? coupledClimatePass?.effectiveSurfaceTempK,
        3,
      ),
      coupledClimateApplied: coupledClimatePass?.applied === true,
    },
    outputs: {
      transitDepthPpm: round(transitDepthPpm, 2),
      geometricTransitProbability: round(transitProbability, 5),
      rvSemiAmplitudeMs: round(rvSemiAmplitudeMs, 4),
      directImagingContrastClass: detectClass(contrastScore),
      angularSeparationArcsec: round(angularSepArcsec, 4),
      angularSeparationClass: detectClass(angularScore),
      transitSnrClass: detectClass(transitSnrScore),
      transmissionFeatureDetectabilityClass: detectClass(featureScore),
      transmissionSpectrumReadinessClass: detectClass(transmissionReadinessScore),
      transmissionFeatureScore: roundMaybe(featureScore, 4),
      transmissionSpectrumReadinessScore: roundMaybe(transmissionReadinessScore, 4),
      atmospherePersistenceObservabilityClass:
        atmospherePersistence == null ? "not-evaluated" : persistenceClass(atmospherePersistence),
      atmospherePersistenceScore: roundMaybe(atmospherePersistence, 4),
      stellarActivityNoiseClass: activityNoiseClass(activityScore),
      biosignatureInterpretationConfidence: interpretationClass(bioContextScore),
      biosignatureObservabilityClass: detectClass(biosignatureObservabilityScore),
      cloudHazeMuted: cloudMute < 0.5,
      atmospherePersistenceMuted: atmospherePersistence != null && atmospherePersistence < 0.42,
      activityNoiseScore: roundMaybe(activityScore, 4),
      surfaceRadiationContextClass: radiationOutputs.surfaceRadiationClass || "not-evaluated",
    },
    assumptions: [
      "Instrument outputs are class estimates unless a specific telescope model is selected.",
      "Atmosphere lifetime, clouds, haze, and stellar activity affect transmission/readiness classes, not transit or RV formulas.",
    ],
    limitingFactors: [
      ...(cloudMute < 0.5 ? ["clouds or haze mute atmospheric spectral features"] : []),
      ...(atmospherePersistence != null && atmospherePersistence < 0.42
        ? ["atmosphere persistence limits repeatable spectral interpretation"]
        : []),
      ...(activityScore >= 0.42
        ? ["stellar activity can add noise or false-positive context to atmospheric interpretation"]
        : []),
    ],
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
