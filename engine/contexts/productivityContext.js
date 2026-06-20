import { clamp, round, toFinite } from "../utils.js";
import { resolveSurfaceOceanFractions } from "./surfaceOceanCoverageAccessors.js";
import {
  CONFIDENCE,
  CONTEXT_STATUS,
  fraction,
  makeContext,
  roundMaybe,
  scoreToClass,
} from "./validation.js";

const MODEL_VERSION = "productivity-context-v1";
const SOURCE_KEYS = ["productivity"];

function classFromLimitScore(score) {
  return scoreToClass(score, {
    high: "strong",
    medium: "moderate",
    low: "weak",
    none: "poor",
    highAt: 0.7,
    mediumAt: 0.4,
    lowAt: 0.12,
  });
}

function nutrientScoreFromClass(label) {
  const text = String(label || "").toLowerCase();
  if (text.includes("strong")) return 0.9;
  if (text.includes("moderate")) return 0.62;
  if (text.includes("reduced") || text.includes("weak")) return 0.28;
  if (text.includes("poor") || text.includes("none")) return 0.05;
  return 0.35;
}

function nitrogenScoreFromContext(context = null) {
  const outputs = context && typeof context === "object" ? context.outputs || context : {};
  const explicit = Number(outputs.nutrientSupportScore ?? outputs.fixedNitrogenAvailabilityScore);
  if (Number.isFinite(explicit)) return clamp(explicit, 0, 1);
  const text = [
    outputs.nutrientLimitationClass,
    outputs.fixedNitrogenAvailabilityClass,
    outputs.n2ReservoirClass,
  ]
    .join(" ")
    .toLowerCase();
  if (!text.trim()) return null;
  if (text.includes("not nitrogen-limited") || text.includes("strong fixed")) return 0.88;
  if (text.includes("mild") || text.includes("moderate fixed")) return 0.58;
  if (text.includes("strong nitrogen") || text.includes("limited fixed")) return 0.22;
  if (text.includes("severe") || text.includes("poor fixed") || text.includes("trace")) return 0.05;
  return null;
}

function radiationScore(label, shieldingFactor) {
  const text = String(label || "").toLowerCase();
  if (text.includes("steril")) return 0.03;
  if (text.includes("hazard") || text.includes("severe")) return 0.18;
  if (text.includes("high")) return 0.35;
  if (text.includes("shield")) return 0.82;
  if (shieldingFactor == null || shieldingFactor === "") return 0.7;
  const shield = Number(shieldingFactor);
  if (Number.isFinite(shield)) return clamp(0.35 + 0.65 * shield, 0, 1);
  return 0.7;
}

function carbonAvailabilityScore(ppCO2Atm, carbonCycleContext) {
  const co2 = Math.max(0, toFinite(ppCO2Atm, 0));
  if (co2 <= 0) return carbonCycleContext?.thermostatStrength ? 0.18 : 0.05;
  const ppm = co2 * 1_000_000;
  const lowCo2Ramp = clamp((ppm - 20) / 130, 0, 1);
  const saturation = clamp(Math.log10(1 + ppm / 80) / Math.log10(1 + 1200 / 80), 0, 1);
  const thermostatBonus = carbonCycleContext?.thermostatStrength ? 0.08 : 0;
  return clamp(0.12 + 0.58 * lowCo2Ramp + 0.22 * saturation + thermostatBonus, 0, 1);
}

export function buildProductivityContext({
  surfaceClimateContext = null,
  hydrosphere = null,
  oceanChemistryContext = null,
  nitrogenCycleContext = null,
  carbonCycleContext = null,
  biosignatureContext = null,
  pressureAtm = 1,
  ppO2Atm = 0,
  ppCO2Atm = 0,
  ppN2Atm = 0,
  radiationClass = "",
  radiationShieldingFactor = null,
  planetRadiationEnvironmentContext = null,
  surfaceLightFraction = 1,
  solventPathway = "surface",
} = {}) {
  const assumptions = [
    "Productivity estimates environmental potential only; they do not assert life.",
  ];
  const limitingFactors = [];
  const climate = surfaceClimateContext?.outputs || {};
  const climateScore = clamp(
    toFinite(climate.climateLivabilityScore, toFinite(climate.climateLivabilityFraction, 0)),
    0,
    1,
  );
  const coverage = resolveSurfaceOceanFractions(hydrosphere);
  const land = fraction(coverage.landFraction, 0);
  const ocean = fraction(coverage.liquidOceanFraction, 0);
  const surfaceLiquid = fraction(coverage.surfaceAccessibleLiquidFraction, 0);
  const lightScore = clamp(toFinite(surfaceLightFraction, 1), 0, 1);
  const oceanNutrientScore = nutrientScoreFromClass(oceanChemistryContext?.nutrientSupportClass);
  const nitrogenNutrientScore = nitrogenScoreFromContext(nitrogenCycleContext);
  const nutrientScore =
    nitrogenNutrientScore == null
      ? oceanNutrientScore
      : Math.min(oceanNutrientScore, nitrogenNutrientScore);
  const carbonScore = carbonAvailabilityScore(ppCO2Atm, carbonCycleContext);
  const oxygenScore = clamp(
    0.35 +
      0.35 * Math.min(1, Math.max(0, toFinite(ppO2Atm, 0)) / 0.05) +
      0.15 * Math.min(1, Math.max(0, toFinite(ppN2Atm, 0)) / 0.5),
    0,
    1,
  );
  const radiationOutputs =
    planetRadiationEnvironmentContext && typeof planetRadiationEnvironmentContext === "object"
      ? planetRadiationEnvironmentContext.outputs || {}
      : {};
  const radScore =
    radiationOutputs.surfaceProtectionScore != null
      ? clamp(toFinite(radiationOutputs.surfaceProtectionScore, 0), 0, 1)
      : radiationScore(radiationClass, radiationShieldingFactor);
  const pressureScore =
    toFinite(pressureAtm, 1) <= 1e-5 ? 0 : clamp(Math.log10(1 + pressureAtm * 10) / 1.2, 0, 1);
  const solventScore = String(solventPathway).includes("subsurface")
    ? Math.max(0.2, surfaceLiquid * 0.4)
    : surfaceLiquid;

  const limitingScores = {
    climate: climateScore,
    light: lightScore,
    solvent: solventScore,
    nutrients: nutrientScore,
    carbon: carbonScore,
    oxygenation: oxygenScore,
    radiation: radScore,
    pressure: pressureScore,
  };
  for (const [key, value] of Object.entries(limitingScores)) {
    if (value < 0.25) limitingFactors.push(`${key} limits productivity potential`);
  }

  const basePotential = Math.min(...Object.values(limitingScores));
  const surfaceAreaOpportunity = clamp(0.55 * land + 0.45 * ocean, 0, 1);
  const potential = round(clamp(basePotential * (0.55 + 0.45 * surfaceAreaOpportunity), 0, 1), 3);
  const vegetationPlausibility =
    String(solventPathway).includes("subsurface") || land <= 0.02
      ? "not-supported"
      : potential >= 0.65
        ? "plausible"
        : potential >= 0.35
          ? "limited"
          : "not-supported";

  const status =
    surfaceClimateContext?.status === CONTEXT_STATUS.UNKNOWN
      ? CONTEXT_STATUS.UNKNOWN
      : potential <= 0.05
        ? CONTEXT_STATUS.LIMITED
        : CONTEXT_STATUS.SUPPORTED;
  const confidence =
    surfaceClimateContext?.confidence === CONFIDENCE.HIGH &&
    oceanChemistryContext?.confidence !== "low" &&
    surfaceClimateContext?.status !== CONTEXT_STATUS.UNKNOWN
      ? CONFIDENCE.MEDIUM
      : CONFIDENCE.LOW;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      landFraction: roundMaybe(land, 3),
      oceanFraction: roundMaybe(ocean, 3),
      surfaceLiquidFraction: roundMaybe(surfaceLiquid, 3),
      surfaceLightFraction: roundMaybe(lightScore, 3),
      surfaceOceanCoverageModelVersion: coverage.modelVersion,
      pressureAtm: roundMaybe(pressureAtm, 6),
      ppO2Atm: roundMaybe(ppO2Atm, 6),
      ppCO2Atm: roundMaybe(ppCO2Atm, 8),
      ppN2Atm: roundMaybe(ppN2Atm, 6),
      solventPathway,
      planetRadiationEnvironmentModelVersion:
        planetRadiationEnvironmentContext?.modelVersion || null,
      nitrogenCycleModelVersion: nitrogenCycleContext?.modelVersion || null,
    },
    outputs: {
      primaryProductivityPotential: potential,
      landProductivityClass: classFromLimitScore(potential * (land > 0.02 ? 1 : 0)),
      oceanProductivityClass: classFromLimitScore(potential * (ocean > 0.02 ? 1 : 0.2)),
      nutrientLimitClass: classFromLimitScore(nutrientScore),
      oceanNutrientLimitClass: classFromLimitScore(oceanNutrientScore),
      nitrogenNutrientLimitClass:
        nitrogenNutrientScore == null
          ? "not-evaluated"
          : classFromLimitScore(nitrogenNutrientScore),
      lightLimitClass: classFromLimitScore(lightScore),
      radiationLimitClass: classFromLimitScore(radScore),
      oxygenationSupportClass: classFromLimitScore(oxygenScore),
      vegetationPlausibilityClass: vegetationPlausibility,
      biosignatureInterpretationModifier:
        potential >= 0.6 && biosignatureContext?.interpretationClass
          ? "environmentally-supported-context"
          : potential <= 0.18
            ? "environmentally-limited-context"
            : "context-neutral",
      populationCarryingCapacityModifier: round(clamp(0.25 + 0.9 * potential, 0.1, 1.15), 3),
    },
    assumptions,
    limitingFactors,
    notes:
      potential > 0.6
        ? [
            "Environmental productivity potential is favorable, but life is not asserted.",
            ...(nitrogenNutrientScore != null
              ? [
                  "Nitrogen nutrient context is included as a limiting factor, not as a biology claim.",
                ]
              : []),
          ]
        : nitrogenNutrientScore != null
          ? ["Nitrogen nutrient context is included as a limiting factor, not as a biology claim."]
          : [],
    sourceKeys: SOURCE_KEYS,
  });
}
