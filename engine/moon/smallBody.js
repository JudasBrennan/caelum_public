import { clamp } from "../utils.js";
import { calcK2LoveNumber } from "../physics/rotation.js";

const MODEL_VERSION = "moon-small-body-regime-v1";
const MINOR_BODY_DIAMETER_KM = 120;
const TINY_COHESIVE_DIAMETER_KM = 20;
const TRANSITIONAL_BODY_DIAMETER_KM = 600;
const MINOR_BODY_MASS_MOON = 1e-5;
const LOW_GRAVITY_MS2 = 0.02;
const TRANSITIONAL_GRAVITY_MS2 = 0.2;

function finitePositive(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function structuralClassFromDensity({ densityGcm3, diameterKm }) {
  if (densityGcm3 < 1.25) return "porous icy aggregate";
  if (densityGcm3 < 2.25) return "porous rubble-pile";
  if (densityGcm3 < 3.2) return diameterKm < 50 ? "cohesive rock-ice fragment" : "mixed small body";
  return diameterKm < 50 ? "cohesive rocky fragment" : "rocky small body";
}

export function classifySmallBodyRegime({
  massMoon,
  massKg,
  radiusM,
  radiusKm,
  densityGcm3,
  diameterKm,
  gravityMs2,
}) {
  const resolvedRadiusKm = finitePositive(radiusKm, finitePositive(radiusM, 0) / 1000);
  const resolvedDiameterKm = finitePositive(diameterKm, resolvedRadiusKm * 2);
  const resolvedGravityMs2 = finitePositive(gravityMs2, 0);
  const resolvedDensityGcm3 = finitePositive(densityGcm3, 0);
  const resolvedMassMoon = finitePositive(massMoon, 0);
  const resolvedMassKg = finitePositive(massKg, 0);
  const tinyCohesiveCandidate =
    resolvedDiameterKm > 0 && resolvedDiameterKm < TINY_COHESIVE_DIAMETER_KM;
  const minorBody =
    tinyCohesiveCandidate ||
    (resolvedDiameterKm > 0 && resolvedDiameterKm < MINOR_BODY_DIAMETER_KM) ||
    (resolvedMassMoon > 0 && resolvedMassMoon < MINOR_BODY_MASS_MOON) ||
    (resolvedGravityMs2 > 0 && resolvedGravityMs2 < LOW_GRAVITY_MS2);
  const transitionalBody =
    minorBody ||
    (resolvedDiameterKm > 0 && resolvedDiameterKm < TRANSITIONAL_BODY_DIAMETER_KM) ||
    (resolvedGravityMs2 > 0 && resolvedGravityMs2 < TRANSITIONAL_GRAVITY_MS2) ||
    (resolvedMassMoon > 0 && resolvedMassMoon < 0.01);
  const structuralClass = structuralClassFromDensity({
    densityGcm3: resolvedDensityGcm3,
    diameterKm: resolvedDiameterKm,
  });
  const rubbleLike = structuralClass.includes("porous") || structuralClass.includes("rubble");

  let tidalRegime = "regular moon";
  if (minorBody) tidalRegime = rubbleLike ? "small rubble-pile body" : "small cohesive body";
  else if (transitionalBody) tidalRegime = "transitional small moon";

  const caveats = [];
  if (minorBody) {
    caveats.push(
      "Small-body tidal response is weak and shape-, porosity-, and fracture-history dependent.",
    );
  }
  if (rubbleLike) {
    caveats.push(
      "Rubble-pile dissipation is uncertain; treat migration and heating as broad-order outputs.",
    );
  }
  if (tinyCohesiveCandidate) {
    caveats.push("Below roughly 20 km, material strength can dominate self-gravity.");
  }

  return {
    modelVersion: MODEL_VERSION,
    isSmallBody: minorBody,
    isTransitionalSmallBody: transitionalBody && !minorBody,
    appliesSmallBodyTides: minorBody,
    tidalRegime,
    structuralClass,
    tinyCohesiveCandidate,
    rubbleLike,
    confidence: minorBody ? "low" : transitionalBody ? "medium" : "high",
    diameterKm: resolvedDiameterKm,
    radiusKm: resolvedRadiusKm,
    gravityMs2: resolvedGravityMs2,
    densityGcm3: resolvedDensityGcm3,
    massMoon: resolvedMassMoon,
    massKg: resolvedMassKg,
    caveats,
  };
}

export function estimateSmallBodyRigidity({
  densityGcm3,
  diameterKm,
  structuralClass,
  compositionRigidityPa,
}) {
  const density = finitePositive(densityGcm3, 2);
  const diameter = finitePositive(diameterKm, 50);
  const sourceRigidity = finitePositive(compositionRigidityPa, 0);
  let baseRigidityPa;
  if (density < 1.25) baseRigidityPa = 5e9;
  else if (density < 2.25) baseRigidityPa = 15e9;
  else if (density < 3.2) baseRigidityPa = 25e9;
  else baseRigidityPa = 45e9;

  const classText = String(structuralClass || "").toLowerCase();
  if (classText.includes("rubble")) baseRigidityPa *= 1.15;
  if (classText.includes("cohesive")) baseRigidityPa *= 1.25;

  const diameterFactor = diameter < 20 ? 1.25 : diameter < 120 ? 1 : 0.85;
  return clamp(Math.max(sourceRigidity, baseRigidityPa) * diameterFactor, 1e9, 100e9);
}

export function estimateSmallBodyTidalQ({ densityGcm3, diameterKm, gravityMs2, structuralClass }) {
  const density = finitePositive(densityGcm3, 2);
  const diameter = finitePositive(diameterKm, 50);
  const gravity = finitePositive(gravityMs2, 0.01);
  const classText = String(structuralClass || "").toLowerCase();

  let q = density < 1.25 ? 100 : density < 2.25 ? 120 : density < 3.2 ? 150 : 180;
  if (classText.includes("rubble") || classText.includes("porous")) q *= 1.15;
  if (classText.includes("cohesive")) q *= 1.1;
  q *= clamp((0.05 / gravity) ** 0.2, 0.8, 1.6);
  q *= diameter < 20 ? 1.15 : diameter < 120 ? 1 : 0.9;

  return clamp(q, 50, 350);
}

export function estimateSmallBodyLoveNumber({
  densityKgM3,
  densityGcm3,
  gravityMs2,
  radiusM,
  diameterKm,
  rigidityPa,
}) {
  const density = finitePositive(densityKgM3, finitePositive(densityGcm3, 2) * 1000);
  const gravity = finitePositive(gravityMs2, 0);
  const radius = finitePositive(radiusM, finitePositive(diameterKm, 0) * 500);
  const rigidity = finitePositive(rigidityPa, 15e9);
  if (!(density > 0) || !(gravity > 0) || !(radius > 0)) return 0;

  const elasticK2 = calcK2LoveNumber({
    densityKgM3: density,
    gravityMs2: gravity,
    radiusM: radius,
    rigidityPa: rigidity,
  });
  const gravityCoupling = clamp((gravity / 0.05) ** 0.35, 0.18, 1);
  const diameterCoupling = clamp(
    (finitePositive(diameterKm, (radius / 1000) * 2) / 120) ** 0.15,
    0.65,
    1,
  );

  return clamp(elasticK2 * gravityCoupling * diameterCoupling, 1e-9, 1.5);
}

export function estimateCohesiveStrengthRegime({
  densityGcm3,
  diameterKm,
  rigidityPa,
  structuralClass,
}) {
  const density = finitePositive(densityGcm3, 2);
  const diameter = finitePositive(diameterKm, 0);
  const rigidity = finitePositive(rigidityPa, 0);
  const classText = String(structuralClass || "").toLowerCase();
  const tiny = diameter > 0 && diameter < TINY_COHESIVE_DIAMETER_KM;
  const rubbleLike = classText.includes("rubble") || classText.includes("porous") || density < 2.25;
  const cohesionPa = rubbleLike
    ? clamp(20_000 / Math.max(diameter, 1), 50, 5000)
    : clamp(rigidity / 1e7, 1000, 20_000);

  return {
    modelVersion: MODEL_VERSION,
    canBypassRocheByStrength: tiny && cohesionPa >= 50,
    strengthClass: rubbleLike ? "weak cohesive aggregate" : "cohesive monolith",
    cohesionPa,
    confidence: rubbleLike ? "low" : "medium",
  };
}

export function summarizeSmallBodyRegime(regime) {
  if (!regime) return "Regular moon";
  const label = String(regime.tidalRegime || "regular moon");
  const confidence = String(regime.confidence || "").trim();
  return confidence ? `${label} (${confidence} confidence)` : label;
}
