import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

const MODEL_VERSION = "geodynamics-context-v1";
const SOURCE_KEYS = ["geodynamics"];
const EARTH_HEAT_FLUX_WM2 = 0.087;

function heatClass(earthFlux) {
  if (earthFlux >= 8) return "extreme";
  if (earthFlux >= 2) return "high";
  if (earthFlux >= 0.45) return "earth-like";
  if (earthFlux >= 0.12) return "declining";
  return "low";
}

function tectonicRegimeFromScore(score, fallback) {
  if (score >= 0.68) return "mobile-lid-favored";
  if (score >= 0.42) return "episodic-lid-plausible";
  if (score >= 0.18) return "stagnant-lid-favored";
  return fallback || "geologically-quiet";
}

export function buildGeodynamicsContext({
  massEarth = 1,
  gravityG = 1,
  densityGcm3 = 5.51,
  ageGyr = 4.6,
  compositionClass = "Earth-like",
  surfaceTempK = 288,
  hydrosphere = null,
  radiogenicHeatingWm2 = EARTH_HEAT_FLUX_WM2,
  tidalHeatingWm2 = 0,
  tectonicRegime = "",
  tectonicProbabilities = null,
  carbonCycleContext = null,
  oceanChemistryContext = null,
  atmosphereLedger = null,
  surfaceClimateContext = null,
  interiorEvolutionContext = null,
} = {}) {
  const assumptions = [
    "Mantle viscosity and convective vigor are proxy classes, not solved interior dynamics.",
  ];
  const limitingFactors = [];
  const radio = Math.max(0, toFinite(radiogenicHeatingWm2, EARTH_HEAT_FLUX_WM2));
  const tidal = Math.max(0, toFinite(tidalHeatingWm2, 0));
  const heatFlux = radio + tidal;
  const earthFlux = heatFlux / EARTH_HEAT_FLUX_WM2;
  const waterSupport = clamp(
    toFinite(
      hydrosphere?.surfaceAccessibleLiquidFraction ??
        hydrosphere?.liquidOceanFraction ??
        hydrosphere?.landFraction,
      0,
    ),
    0,
    1,
  );
  const land = clamp(toFinite(hydrosphere?.landFraction, 0.5), 0, 1);
  const temp = toFinite(surfaceTempK, 288);
  const tempSupport =
    temp < 180 || temp > 850 ? 0.05 : temp > 500 ? 0.28 : temp < 240 ? 0.35 : 0.75;
  const massSupport = clamp(
    Math.log10(1 + Math.max(0, toFinite(massEarth, 1))) / Math.log10(6),
    0,
    1,
  );
  const agePenalty = clamp(1 - Math.max(0, toFinite(ageGyr, 4.6) - 5) / 8, 0.25, 1);
  const heatScore = clamp(Math.log10(1 + earthFlux) / Math.log10(5), 0, 1);
  const interiorOutputs =
    interiorEvolutionContext && typeof interiorEvolutionContext === "object"
      ? interiorEvolutionContext.outputs || interiorEvolutionContext
      : {};
  const interiorCoolingSupport = clamp(
    toFinite(interiorOutputs.secularCoolingScore, heatScore),
    0,
    1,
  );
  const interiorVolcanicSupport = clamp(
    toFinite(interiorOutputs.volcanicLongevityScore, heatScore),
    0,
    1,
  );
  const rawInteriorRecyclingSupport = toFinite(interiorOutputs.mantleRecyclingSupportScore, NaN);
  const interiorRecyclingSupport = Number.isFinite(rawInteriorRecyclingSupport)
    ? clamp(rawInteriorRecyclingSupport, 0, 1)
    : NaN;
  const mobileProb = clamp(toFinite(tectonicProbabilities?.mobile, NaN), 0, 1);
  const inferredScore = Number.isFinite(mobileProb)
    ? mobileProb
    : clamp(
        0.32 * heatScore +
          0.18 * interiorCoolingSupport +
          0.24 * waterSupport +
          0.14 * massSupport +
          0.12 * tempSupport,
        0,
        1,
      );
  const recyclingAdjustedScore = Number.isFinite(interiorRecyclingSupport)
    ? clamp(0.68 * inferredScore + 0.32 * interiorRecyclingSupport, 0, 1)
    : inferredScore;
  const vigorScore = clamp(
    (0.54 * heatScore + 0.26 * interiorCoolingSupport + 0.2 * massSupport) * agePenalty,
    0,
    1,
  );
  const erosionScore = clamp(
    0.45 * waterSupport +
      0.3 * (surfaceClimateContext?.outputs?.ariditySummary?.class === "humid" ? 1 : 0.45) +
      0.25 * land,
    0,
    1,
  );
  const weatheringScore = clamp(
    0.35 * waterSupport +
      0.25 * land +
      0.25 *
        (carbonCycleContext?.weatheringEfficiency ??
          carbonCycleContext?.thermostatStrength ??
          0.4) +
      0.15 * tempSupport,
    0,
    1,
  );
  const resurfacingScore = clamp(
    0.42 * heatScore +
      0.18 * interiorVolcanicSupport +
      0.25 * Math.min(1, tidal / EARTH_HEAT_FLUX_WM2) +
      0.15 * (String(tectonicRegime).toLowerCase().includes("mobile") ? 1 : recyclingAdjustedScore),
    0,
    1,
  );

  if (heatScore < 0.18) limitingFactors.push("low internal heat limits convection");
  if (waterSupport < 0.12)
    limitingFactors.push("limited surface-accessible water weakens tectonic/weathering support");
  if (temp > 700)
    limitingFactors.push("extreme surface temperature weakens Earth-like tectonic inference");
  if (hydrosphere?.highPressureIceBarrier) {
    limitingFactors.push("high-pressure ice can isolate ocean and rock exchange");
  }

  return makeContext({
    modelVersion: MODEL_VERSION,
    status: heatFlux > 0 ? CONTEXT_STATUS.SUPPORTED : CONTEXT_STATUS.LIMITED,
    confidence: interiorEvolutionContext
      ? CONFIDENCE.HIGH
      : tectonicProbabilities
        ? CONFIDENCE.MEDIUM
        : CONFIDENCE.LOW,
    inputs: {
      massEarth: roundMaybe(massEarth, 3),
      gravityG: roundMaybe(gravityG, 3),
      densityGcm3: roundMaybe(densityGcm3, 3),
      ageGyr: roundMaybe(ageGyr, 3),
      compositionClass,
      surfaceTempK: roundMaybe(surfaceTempK, 2),
      radiogenicHeatingWm2: roundMaybe(radiogenicHeatingWm2, 6),
      tidalHeatingWm2: roundMaybe(tidalHeatingWm2, 6),
      interiorEvolutionModelVersion: interiorEvolutionContext?.modelVersion || null,
    },
    outputs: {
      heatFluxWm2: round(heatFlux, 6),
      internalHeatClass: heatClass(earthFlux),
      mantleViscosityClass:
        temp > 650
          ? "very-low-viscosity-surface-caveat"
          : heatScore >= 0.5
            ? "warm-mobile"
            : "cool-stiff",
      convectiveVigorClass: scoreToClass(vigorScore, {
        high: "vigorous",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      rayleighProxyClass: scoreToClass(vigorScore, {
        high: "above-threshold-proxy",
        medium: "near-threshold-proxy",
        low: "below-threshold-proxy",
        none: "inactive-proxy",
      }),
      tectonicRegime: tectonicRegimeFromScore(recyclingAdjustedScore, tectonicRegime),
      interiorCoolingSupportClass: interiorOutputs.secularCoolingClass || "not-evaluated",
      interiorVolcanicSupportClass: interiorOutputs.volcanicLongevityClass || "not-evaluated",
      interiorRecyclingSupportClass: interiorOutputs.mantleRecyclingSupportClass || "not-evaluated",
      weatheringFeedbackClass: scoreToClass(weatheringScore, {
        high: "strong",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      erosionPotentialClass: scoreToClass(erosionScore, {
        high: "strong",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      resurfacingPotentialClass: scoreToClass(resurfacingScore, {
        high: "active",
        medium: "moderate",
        low: "limited",
        none: "ancient",
      }),
      volcanicOutgassingSupport: scoreToClass(resurfacingScore * (atmosphereLedger ? 1 : 0.85), {
        high: "strong",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      oceanRockExchangeClass: oceanChemistryContext?.rockOceanAccess
        ? scoreToClass(oceanChemistryContext.rockOceanAccess, {
            high: "strong",
            medium: "moderate",
            low: "weak",
            none: "isolated",
          })
        : "unknown",
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
