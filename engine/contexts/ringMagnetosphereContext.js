import { clamp, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

const MODEL_VERSION = "ring-magnetosphere-context-v1";
const SOURCE_KEYS = ["ringMagnetosphere"];

function qualitative(score, labels = {}) {
  return scoreToClass(score, {
    high: labels.high || "high",
    medium: labels.medium || "moderate",
    low: labels.low || "low",
    none: labels.none || "minimal",
  });
}

export function buildRingMagnetosphereContext({
  ringScience = null,
  ringProperties = null,
  rocheLimitKm = null,
  ringSourceMoon = null,
  exospherePressureAtm = 0,
  resonanceContext = null,
  impactEnvironmentContext = null,
  smallBodyReservoirContext = null,
  magnetosphereEnvironment = null,
  planetRadiationEnvironmentContext = null,
  atmospherePressureAtm = 1,
  atmosphereComposition = null,
  rotationPeriodHours = 24,
  axialTiltDeg = 0,
  parentPlasmaContext = null,
} = {}) {
  const assumptions = [];
  const limitingFactors = [];
  const ringVisible =
    ringScience?.scienceEnabled === true ||
    ringProperties?.opticalDepthClass === "Dense" ||
    ringProperties?.opticalDepthClass === "Moderate";
  const reservoirOutputs =
    smallBodyReservoirContext && typeof smallBodyReservoirContext === "object"
      ? smallBodyReservoirContext.outputs || {}
      : {};
  const smallBodySupplyScore = clamp(
    0.65 * toFinite(reservoirOutputs.debrisFluxScore, 0) +
      0.35 * toFinite(reservoirOutputs.cometDeliveryScore, 0),
    0,
    1,
  );
  const sourceScore = ringSourceMoon
    ? 0.75
    : Math.max(impactEnvironmentContext?.outputs?.impactFluxScore || 0.15, smallBodySupplyScore);
  const exosphereDragScore = clamp(
    Math.log10(1 + toFinite(exospherePressureAtm, 0) * 1e9) / 8,
    0,
    1,
  );
  const resonanceScore = resonanceContext ? 0.65 : 0.18;
  const ringLifetimeScore = clamp(
    (ringVisible ? 0.55 : 0.25) + 0.25 * sourceScore - 0.35 * exosphereDragScore,
    0,
    1,
  );
  const magneticField =
    clamp(toFinite(magnetosphereEnvironment?.surfaceFieldEarths, 0), 0, 10) / 10;
  const windCompression =
    String(magnetosphereEnvironment?.compressionClass || "")
      .toLowerCase()
      .includes("compressed") || toFinite(magnetosphereEnvironment?.windPressureEarthRatio, 1) > 5
      ? 0.35
      : 0.75;
  const atmosphereScore = clamp(
    Math.log10(1 + toFinite(atmospherePressureAtm, 1) * 15) / 1.4,
    0,
    1,
  );
  const radiationOutputs =
    planetRadiationEnvironmentContext && typeof planetRadiationEnvironmentContext === "object"
      ? planetRadiationEnvironmentContext.outputs || {}
      : {};
  const plasmaScore = parentPlasmaContext ? 0.75 : 0.25;
  const auroraScore = Number.isFinite(Number(radiationOutputs.auroraReadinessScore))
    ? clamp(toFinite(radiationOutputs.auroraReadinessScore, 0), 0, 1)
    : clamp(
        0.35 * magneticField + 0.3 * atmosphereScore + 0.2 * plasmaScore + 0.15 * windCompression,
        0,
        1,
      );
  const radiationScore = clamp(
    0.45 * magneticField +
      0.35 * plasmaScore +
      0.2 * (1 - windCompression) +
      0.15 * toFinite(radiationOutputs.stellarParticleHazardScore, 0),
    0,
    1,
  );

  if (exosphereDragScore > 0.5)
    limitingFactors.push("dense exosphere or upper atmosphere can shorten ring lifetime");
  if (!magnetosphereEnvironment)
    assumptions.push("No magnetosphere context was available for aurora/radiation visibility.");
  if (!ringSourceMoon)
    assumptions.push("No explicit source moon was available for ring persistence.");

  return makeContext({
    modelVersion: MODEL_VERSION,
    status: CONTEXT_STATUS.SUPPORTED,
    confidence:
      magnetosphereEnvironment || ringProperties || ringScience
        ? CONFIDENCE.MEDIUM
        : CONFIDENCE.LOW,
    inputs: {
      rocheLimitKm: roundMaybe(rocheLimitKm, 0),
      exospherePressureAtm: roundMaybe(exospherePressureAtm, 10),
      atmospherePressureAtm: roundMaybe(atmospherePressureAtm, 6),
      rotationPeriodHours: roundMaybe(rotationPeriodHours, 3),
      axialTiltDeg: roundMaybe(axialTiltDeg, 3),
      dominantAtmosphereSpecies: atmosphereComposition?.dominantSpecies || null,
      smallBodyReservoirModelVersion: smallBodyReservoirContext?.modelVersion || null,
      planetRadiationEnvironmentModelVersion:
        planetRadiationEnvironmentContext?.modelVersion || null,
      parentPlasmaSourceMode: parentPlasmaContext?.plasmaSourceMode || null,
    },
    outputs: {
      ringArchitectureClass: ringVisible ? "visible-ring-supported" : "ring-poor-or-tenuous",
      resonantGapLikelihood: qualitative(resonanceScore, {
        high: "likely",
        medium: "possible",
        low: "weak",
        none: "unknown",
      }),
      exosphereDragLimitClass: qualitative(exosphereDragScore, {
        high: "strong",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      sourcePersistenceClass: qualitative(sourceScore, {
        high: "source-supported",
        medium: "source-plausible",
        low: "source-weak",
        none: "source-unknown",
      }),
      debrisSupplyClass: qualitative(smallBodySupplyScore, {
        high: "debris-rich",
        medium: "debris-supported",
        low: "faint-debris",
        none: "not-detected",
      }),
      ringLifetimeClass: qualitative(ringLifetimeScore, {
        high: "long-lived-plausible",
        medium: "transient-plausible",
        low: "short-lived",
        none: "unsupported",
      }),
      visibleRingConfidence: ringVisible ? "medium" : "low",
      auroraLikelihood: qualitative(auroraScore, {
        high: "likely",
        medium: "possible",
        low: "weak",
        none: "unlikely",
      }),
      polarOvalLatitudeClass:
        Math.abs(toFinite(axialTiltDeg, 0)) > 60 ? "tilted-or-seasonally-shifted" : "high-latitude",
      surfaceVisibleAuroraClass:
        atmosphereScore > 0.25 ? qualitative(auroraScore) : "no-durable-atmosphere",
      radiationBeltClass: qualitative(radiationScore, {
        high: "strong",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      parentPlasmaSourceClass: parentPlasmaContext?.plasmaSourceClass || "not-detected",
      parentPlasmaSourceConfidence: parentPlasmaContext?.plasmaSourceConfidence || "unknown",
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
