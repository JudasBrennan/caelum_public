import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

export const PLANET_RADIATION_ENVIRONMENT_MODEL_VERSION = "planet-radiation-environment-context-v1";

const SOURCE_KEYS = ["planetRadiationEnvironment"];

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

function hazardClass(score) {
  return scoreToClass(score, {
    high: "severe hazard",
    medium: "high hazard",
    low: "elevated hazard",
    none: "low hazard",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.16,
  });
}

function shieldingClass(score) {
  return scoreToClass(score, {
    high: "strong shielding",
    medium: "moderate shielding",
    low: "weak shielding",
    none: "minimal shielding",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.16,
  });
}

function surfaceClass(score) {
  return scoreToClass(score, {
    high: "severe surface radiation",
    medium: "hazardous surface radiation",
    low: "elevated surface radiation",
    none: "shielded surface radiation",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.16,
  });
}

function refugeClass(score) {
  return scoreToClass(score, {
    high: "strong subsurface refuge",
    medium: "moderate subsurface refuge",
    low: "limited subsurface refuge",
    none: "minimal subsurface refuge",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.16,
  });
}

function readinessClass(score) {
  return scoreToClass(score, {
    high: "likely",
    medium: "possible",
    low: "weak",
    none: "unlikely",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0.1,
  });
}

function pressureShieldingScore(pressureAtm) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  if (pressure <= 0) return 0;
  return clamp(Math.log10(1 + pressure * 20) / Math.log10(1 + 20), 0, 1);
}

function ozoneShieldingScore(photochemistry = {}) {
  if (photochemistry?.uvShieldingScore != null) return fraction(photochemistry.uvShieldingScore, 0);
  const ozoneRatio = finiteNonNegative(photochemistry?.ozoneEarthRatio, 0);
  if (ozoneRatio > 0) return clamp(Math.log10(1 + ozoneRatio * 9) / 1, 0, 1);
  const label = String(photochemistry?.uvShieldingClass || "").toLowerCase();
  if (label.includes("shielded")) return 0.9;
  if (label.includes("partial")) return 0.45;
  if (label.includes("unshielded")) return 0.08;
  return 0;
}

function magneticShieldingScore(magnetosphereEnvironment = {}) {
  const explicit = Number(magnetosphereEnvironment?.radiationShieldingFactor);
  if (Number.isFinite(explicit)) return clamp(explicit, 0, 1);
  const field = clamp(
    finiteNonNegative(magnetosphereEnvironment?.surfaceFieldEarths, 0) / 0.3,
    0,
    1,
  );
  const compressed =
    String(magnetosphereEnvironment?.compressionClass || "")
      .toLowerCase()
      .includes("compressed") ||
    finiteNonNegative(magnetosphereEnvironment?.windPressureEarthRatio, 1) > 5;
  return clamp(field * (compressed ? 0.72 : 1), 0, 1);
}

function confidenceForRadiationContext({
  forcing = {},
  photochemistry = null,
  magnetosphereEnvironment = null,
  pressureAtm = 0,
} = {}) {
  if (forcing.flux && forcing.wind && photochemistry && magnetosphereEnvironment) {
    return CONFIDENCE.HIGH;
  }
  if (forcing.flux || forcing.wind || magnetosphereEnvironment || pressureAtm > 0) {
    return CONFIDENCE.MEDIUM;
  }
  return CONFIDENCE.LOW;
}

export function buildPlanetRadiationEnvironmentContext({
  environmentForcing = null,
  stellarHistoryDoseContext = null,
  pressureAtm = 0,
  composition = {},
  photochemistry = null,
  magnetosphereEnvironment = null,
  gravityG = 1,
  escapeVelocityKms = 11.2,
  hydrosphere = null,
} = {}) {
  const assumptions = [
    "Planet radiation environment is a qualitative shielding and hazard screen, not a dose transport model.",
  ];
  const limitingFactors = [];
  const forcing =
    environmentForcing && typeof environmentForcing === "object" ? environmentForcing : {};
  const historyOutputs =
    stellarHistoryDoseContext && typeof stellarHistoryDoseContext === "object"
      ? stellarHistoryDoseContext.outputs || stellarHistoryDoseContext
      : {};
  const pressure = finiteNonNegative(pressureAtm, 0);
  const pressureShield = pressureShieldingScore(pressure);
  const ozoneShield = ozoneShieldingScore(photochemistry || {});
  const magneticShield = magneticShieldingScore(magnetosphereEnvironment || {});
  const xuvScore = logRangeScore(forcing.flux?.xuvEarthAtOrbit, 1, 100);
  const windScore = logRangeScore(forcing.wind?.ramPressureEarthRatio, 1, 300);
  const historyWaterLossScore = fraction(historyOutputs.waterLossRiskScore, 0);
  const backgroundParticleScore = forcing.wind || forcing.flux ? 0.15 : 0;
  const particleHazardScore = clamp(
    backgroundParticleScore + 0.36 * xuvScore + 0.32 * windScore + 0.17 * historyWaterLossScore,
    0,
    1,
  );
  const surfaceUvFlux = finiteNonNegative(
    photochemistry?.prebioticUv?.surfaceFluxErgCm2S,
    forcing.flux?.prebioticUvEarthAtOrbit,
  );
  const toaUvFlux = finiteNonNegative(
    photochemistry?.prebioticUv?.topOfAtmosphereFluxErgCm2S,
    forcing.flux?.prebioticUvToaAtOrbitErgCm2S,
  );
  const uvFluxScore = Math.max(
    logRangeScore(surfaceUvFlux, 0.5, 50),
    logRangeScore(toaUvFlux, 1, 100),
  );
  const uvLeakage = (1 - ozoneShield) ** 1.35;
  const uvSurfaceHazardScore = clamp(
    0.55 * uvFluxScore * uvLeakage + 0.45 * (1 - ozoneShield) * (1 - 0.7 * pressureShield),
    0,
    1,
  );
  const particleSurfaceHazardScore = clamp(
    particleHazardScore * (1 - 0.62 * pressureShield) * (1 - 0.55 * magneticShield),
    0,
    1,
  );
  const surfaceRadiationHazardScore = clamp(
    0.56 * particleSurfaceHazardScore + 0.44 * uvSurfaceHazardScore,
    0,
    1,
  );
  const atmosphereShielding = clamp(
    0.72 * pressureShield +
      0.18 * ozoneShield +
      0.1 * clamp(finiteNonNegative(gravityG, 1) / 1.5, 0, 1),
    0,
    1,
  );
  const escapeShield = clamp(finiteNonNegative(escapeVelocityKms, 11.2) / 11.2, 0, 1.4);
  const surfaceProtectionScore = clamp(
    0.45 * atmosphereShielding + 0.33 * magneticShield + 0.14 * ozoneShield + 0.08 * escapeShield,
    0,
    1,
  );
  const iceRefuge = Math.max(
    fraction(hydrosphere?.permanentIceFraction, 0),
    fraction(hydrosphere?.subsurfaceOceanScore, 0),
  );
  const subsurfaceRefugeScore = clamp(
    Math.max(iceRefuge, 0.55 * pressureShield) * (0.65 + 0.35 * surfaceRadiationHazardScore),
    0,
    1,
  );
  const auroraReadinessScore = clamp(
    particleHazardScore * (0.5 * magneticShield + 0.35 * pressureShield + 0.15 * ozoneShield),
    0,
    1,
  );

  if (pressureShield < 0.16)
    limitingFactors.push("thin or absent atmosphere limits surface shielding");
  if (magneticShield < 0.16)
    limitingFactors.push("weak intrinsic magnetosphere limits charged-particle shielding");
  if (ozoneShield < 0.16) limitingFactors.push("weak ozone/UV shielding raises surface UV hazard");
  if (!forcing.flux)
    assumptions.push("No current high-energy stellar forcing context was available.");

  return makeContext({
    modelVersion: PLANET_RADIATION_ENVIRONMENT_MODEL_VERSION,
    status: CONTEXT_STATUS.SUPPORTED,
    confidence: confidenceForRadiationContext({
      forcing,
      photochemistry,
      magnetosphereEnvironment,
      pressureAtm: pressure,
    }),
    inputs: {
      pressureAtm: roundMaybe(pressure, 6),
      gravityG: roundMaybe(gravityG, 3),
      escapeVelocityKms: roundMaybe(escapeVelocityKms, 3),
      o2Atm: roundMaybe(composition?.o2, 6),
      co2Atm: roundMaybe(composition?.co2, 6),
      xuvEarthAtOrbit: roundMaybe(forcing.flux?.xuvEarthAtOrbit, 4),
      windPressureEarthRatio: roundMaybe(forcing.wind?.ramPressureEarthRatio, 4),
      ozoneEarthRatio: roundMaybe(photochemistry?.ozoneEarthRatio, 4),
      stellarHistoryDoseModelVersion: stellarHistoryDoseContext?.modelVersion || null,
    },
    outputs: {
      stellarParticleHazardClass: hazardClass(particleHazardScore),
      stellarParticleHazardScore: round(particleHazardScore, 3),
      uvSurfaceHazardClass: hazardClass(uvSurfaceHazardScore),
      uvSurfaceHazardScore: round(uvSurfaceHazardScore, 3),
      atmosphereShieldingClass: shieldingClass(atmosphereShielding),
      atmosphereShieldingScore: round(atmosphereShielding, 3),
      magnetosphereShieldingClass: shieldingClass(magneticShield),
      magnetosphereShieldingScore: round(magneticShield, 3),
      surfaceRadiationClass: surfaceClass(surfaceRadiationHazardScore),
      surfaceRadiationHazardScore: round(surfaceRadiationHazardScore, 3),
      surfaceRadiationPenalty: round(clamp(1 - 0.88 * surfaceRadiationHazardScore, 0.05, 1), 3),
      surfaceProtectionScore: round(surfaceProtectionScore, 3),
      subsurfaceRefugeClass: refugeClass(subsurfaceRefugeScore),
      subsurfaceRefugeScore: round(subsurfaceRefugeScore, 3),
      auroraReadinessClass: readinessClass(auroraReadinessScore),
      auroraReadinessScore: round(auroraReadinessScore, 3),
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
