import { clamp, round, toFinite } from "../utils.js";
import { buildRockyBodyCompositionCoupling } from "../compositionCoupling.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

export const INTERIOR_EVOLUTION_MODEL_VERSION = "interior-evolution-context-v1";

const SOURCE_KEYS = ["interiorEvolution"];
const EARTH_INTERNAL_HEAT_FLUX_WM2 = 0.087;

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function optionalFraction(value) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, 0, 1) : NaN;
}

function logRangeScore(value, lower, upper) {
  const number = finiteNonNegative(value, 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const low = Math.log10(Math.max(lower, 1e-12));
  const high = Math.log10(Math.max(upper, lower * 1.0001));
  return clamp((Math.log10(Math.max(number, 1e-12)) - low) / (high - low), 0, 1);
}

function classFromScore(score, labels = {}) {
  return scoreToClass(score, {
    high: labels.high || "strong",
    medium: labels.medium || "moderate",
    low: labels.low || "weak",
    none: labels.none || "minimal",
    highAt: labels.highAt ?? 0.72,
    mediumAt: labels.mediumAt ?? 0.42,
    lowAt: labels.lowAt ?? 0.16,
  });
}

function tectonicRegimeScore(regime) {
  const text = String(regime || "").toLowerCase();
  if (text.includes("mobile") || text.includes("plate")) return 0.88;
  if (text.includes("episodic")) return 0.62;
  if (text.includes("plutonic") || text.includes("squishy")) return 0.48;
  if (text.includes("stagnant")) return 0.22;
  if (text.includes("none") || text.includes("quiet")) return 0.05;
  return 0.35;
}

function temperatureSupport(surfaceTempK) {
  const temp = finiteNonNegative(surfaceTempK, 288);
  if (temp < 160 || temp > 900) return 0.08;
  if (temp > 650) return 0.2;
  if (temp > 500) return 0.38;
  if (temp < 240) return 0.42;
  return 0.78;
}

function coreCrystallizationLabel(score) {
  if (score >= 0.82) return "late crystallization or solidification likely";
  if (score >= 0.5) return "partial crystallization likely";
  if (score >= 0.22) return "early crystallization possible";
  return "mostly liquid or poorly constrained";
}

function secularCoolingLabel(score) {
  if (score >= 0.72) return "slow retained cooling";
  if (score >= 0.42) return "mature secular cooling";
  if (score >= 0.16) return "rapid early cooling";
  return "cooling-limited";
}

function dynamoSupportLabel({ score, active, coreFraction, fieldLabel }) {
  if (active && score >= 0.58) return "long-lived dynamo support";
  if (active && coreFraction >= 0.55) return "weak special-case dynamo support";
  if (active) return `${String(fieldLabel || "active")} dynamo support`.trim();
  if (score >= 0.5) return "thermal support but rotation/field-limited";
  if (score >= 0.22) return "waning or early-lost dynamo support";
  return "weak dynamo support";
}

function confidenceFor({ massEarth, radiusEarth, densityGcm3, coreMassFraction, ageGyr }) {
  const finiteCount = [massEarth, radiusEarth, densityGcm3, coreMassFraction, ageGyr].filter((v) =>
    Number.isFinite(Number(v)),
  ).length;
  if (finiteCount >= 5) return CONFIDENCE.HIGH;
  if (finiteCount >= 3) return CONFIDENCE.MEDIUM;
  return CONFIDENCE.LOW;
}

export function buildInteriorEvolutionContext({
  bodyType = "planet",
  massEarth = 1,
  radiusEarth = 1,
  densityGcm3 = 5.51,
  ageGyr = 4.6,
  radiogenicHeatingWm2 = EARTH_INTERNAL_HEAT_FLUX_WM2,
  tidalHeatingWm2 = 0,
  coreMassFraction = 0.33,
  hydrosphere = null,
  tectonicRegime = "",
  tectonicProbabilities = null,
  surfaceTempK = 288,
  magneticFieldContext = null,
  geology = null,
  rockyBodyComposition = null,
} = {}) {
  const assumptions = [
    "Interior evolution is a bounded comparative screen, not a solved thermal-history model.",
  ];
  const limitingFactors = [];
  const compositionCoupling = buildRockyBodyCompositionCoupling(rockyBodyComposition);
  const mass = finiteNonNegative(massEarth, 1);
  const radius = finiteNonNegative(radiusEarth, 1);
  const density = finiteNonNegative(densityGcm3, 5.51);
  const age = finiteNonNegative(ageGyr, 4.6);
  const coreFraction = fraction(coreMassFraction, 0.33);
  const radiogenic = finiteNonNegative(radiogenicHeatingWm2, EARTH_INTERNAL_HEAT_FLUX_WM2);
  const tidal = finiteNonNegative(tidalHeatingWm2, 0);
  const heatFlux = radiogenic + tidal;
  const heatFluxEarth = heatFlux / EARTH_INTERNAL_HEAT_FLUX_WM2;
  const radiogenicEarth = radiogenic / EARTH_INTERNAL_HEAT_FLUX_WM2;
  const tidalEarth = tidal / EARTH_INTERNAL_HEAT_FLUX_WM2;
  const heatScore = logRangeScore(heatFluxEarth, 0.08, 8);
  const radiogenicScore = logRangeScore(radiogenicEarth, 0.08, 3);
  const tidalScore = logRangeScore(tidalEarth, 0.01, 20);
  const compositionCoreScore = fraction(compositionCoupling.interior?.coreMetalScore, 0);
  const compositionVolatileScore = fraction(
    compositionCoupling.interior?.volatileSofteningScore,
    0,
  );
  const massRetentionScore = clamp(
    0.62 * logRangeScore(Math.max(mass, 1e-6), 0.08, 5) +
      0.38 * logRangeScore(Math.max(radius, 1e-6), 0.28, 1.7),
    0,
    1,
  );
  const coreScore = clamp(Math.sqrt(coreFraction / 0.33), 0, 1.35);
  const effectiveCoreScore = compositionCoupling.available
    ? clamp(0.82 * Math.min(coreScore, 1.35) + 0.18 * compositionCoreScore, 0, 1.35)
    : coreScore;
  const nominalCoreLifetimeGyr =
    (2 + 12 * coreFraction * Math.sqrt(Math.max(mass, 0.01))) *
    Math.max(0.4, radiogenicEarth ** 0.35) *
    (1 + 0.35 * Math.min(tidalEarth, 2));
  const ageRatio = nominalCoreLifetimeGyr > 0 ? age / nominalCoreLifetimeGyr : 99;
  const crystallizationScore = clamp((ageRatio - 0.18) / 1.1, 0, 1);
  const crystallizationSweetSpot = clamp(1 - Math.abs(crystallizationScore - 0.55) / 0.55, 0, 1);
  const coolingRetentionScore = clamp(
    0.38 * heatScore +
      0.28 * massRetentionScore +
      0.18 * radiogenicScore +
      0.16 * Math.min(effectiveCoreScore, 1),
    0,
    1,
  );
  const waterSupport = clamp(
    toFinite(
      hydrosphere?.surfaceAccessibleLiquidFraction ??
        hydrosphere?.liquidOceanFraction ??
        hydrosphere?.subsurfaceOceanScore,
      0,
    ),
    0,
    1,
  );
  const land = fraction(hydrosphere?.landFraction, bodyType === "moon" ? 0 : 0.5);
  const tempSupport = temperatureSupport(surfaceTempK);
  const explicitMobile = optionalFraction(tectonicProbabilities?.mobile);
  const regimeScore = Number.isFinite(explicitMobile)
    ? explicitMobile
    : tectonicRegimeScore(tectonicRegime || geology?.dominantProcess || geology?.resurfacingClass);
  const resurfacingActivity = Math.max(
    fraction(geology?.volcanicActivityScore, 0),
    fraction(geology?.cryovolcanicActivityScore, 0) * 0.85,
    fraction(geology?.resurfacingScore, 0),
  );
  const volcanicLongevityScore = clamp(
    0.5 * heatScore +
      0.23 * tidalScore +
      0.15 * massRetentionScore +
      0.12 * Math.max(resurfacingActivity, regimeScore * 0.7),
    0,
    1,
  );
  const mantleRecyclingScore = clamp(
    0.34 * regimeScore +
      0.2 * waterSupport +
      0.16 * heatScore +
      0.12 * massRetentionScore +
      0.1 * tempSupport +
      0.08 * land,
    0,
    1,
  );
  const dynamoActive = magneticFieldContext?.dynamoActive === true;
  const dynamoScore = clamp(
    0.35 * coolingRetentionScore +
      0.22 * Math.min(effectiveCoreScore, 1) +
      0.2 * crystallizationSweetSpot +
      0.14 * radiogenicScore +
      0.09 * Math.min(1, tidalScore),
    0,
    1,
  );

  if (heatScore < 0.16) limitingFactors.push("low internal heat limits long-term volcanism");
  if (massRetentionScore < 0.18) limitingFactors.push("small body size favors rapid cooling");
  if (coreFraction < 0.08) limitingFactors.push("small metallic core weakens dynamo support");
  if (waterSupport < 0.1)
    limitingFactors.push("limited water reduces Earth-like mantle recycling support");
  if (surfaceTempK > 650)
    limitingFactors.push("hot surface conditions can inhibit Earth-like plate recycling");
  if (tidalEarth >= 5)
    assumptions.push("High tidal heat supports volcanism but does not imply plate tectonics.");
  if (coreFraction >= 0.55 && bodyType === "planet") {
    assumptions.push(
      "Large metallic cores can support weak or unusual dynamos even when simple cooling proxies are uncertain.",
    );
  }
  if (compositionCoupling.available) {
    assumptions.push(
      "Rocky-body composition inventory is coupled as bounded reservoir diagnostics; extreme totals are clamped before downstream use.",
    );
    if (compositionCoreScore >= 0.65) {
      assumptions.push(
        "Fe/Ni and metal inventory strengthen the qualitative core/dynamo support diagnostic.",
      );
    }
    if (compositionVolatileScore >= 0.45) {
      assumptions.push(
        "Water/volatile-rich inventory can soften interiors and sustain low-temperature transport, but does not imply plate tectonics.",
      );
    }
    if (compositionCoupling.traceRadiogenic) {
      assumptions.push(
        "K/U/Th trace inventory is represented through the radiogenic heat input when explicit isotope controls are unset.",
      );
    }
  }

  return makeContext({
    modelVersion: INTERIOR_EVOLUTION_MODEL_VERSION,
    status: heatFlux > 0 || coreFraction > 0 ? CONTEXT_STATUS.SUPPORTED : CONTEXT_STATUS.LIMITED,
    confidence: confidenceFor({ massEarth, radiusEarth, densityGcm3, coreMassFraction, ageGyr }),
    inputs: {
      bodyType,
      massEarth: roundMaybe(mass, 5),
      radiusEarth: roundMaybe(radius, 5),
      densityGcm3: roundMaybe(density, 3),
      ageGyr: roundMaybe(age, 3),
      radiogenicHeatingWm2: roundMaybe(radiogenic, 6),
      tidalHeatingWm2: roundMaybe(tidal, 6),
      coreMassFraction: roundMaybe(coreFraction, 4),
      tectonicRegime: String(tectonicRegime || ""),
      magneticFieldModelVersion: magneticFieldContext?.modelVersion || null,
      rockyBodyCompositionModelVersion: compositionCoupling.available
        ? compositionCoupling.modelVersion
        : null,
    },
    outputs: {
      heatFluxEarth: round(heatFluxEarth, 3),
      radiogenicBudgetClass: classFromScore(radiogenicScore, {
        high: "radiogenically rich",
        medium: "earth-like radiogenic budget",
        low: "radiogenically depleted",
        none: "radiogenically poor",
      }),
      radiogenicBudgetScore: round(radiogenicScore, 3),
      compositionCoreScore: round(compositionCoreScore, 3),
      compositionVolatileScore: round(compositionVolatileScore, 3),
      compositionRadiogenicTraceAbundance:
        compositionCoupling.interior?.radiogenicTraceAbundance ?? null,
      compositionDiagnosticClass: compositionCoupling.visual?.dominantDiagnostic || "none",
      secularCoolingClass: secularCoolingLabel(coolingRetentionScore),
      secularCoolingScore: round(coolingRetentionScore, 3),
      coreCrystallizationLikelihood: coreCrystallizationLabel(crystallizationScore),
      coreCrystallizationScore: round(crystallizationScore, 3),
      nominalCoreLifetimeGyr: round(nominalCoreLifetimeGyr, 2),
      dynamoLifetimeSupportClass: dynamoSupportLabel({
        score: dynamoScore,
        active: dynamoActive,
        coreFraction,
        fieldLabel: magneticFieldContext?.fieldLabel,
      }),
      dynamoLifetimeSupportScore: round(dynamoScore, 3),
      volcanicLongevityClass: classFromScore(volcanicLongevityScore, {
        high: "strong long-lived volcanism support",
        medium: "moderate volcanic longevity",
        low: "waning volcanic longevity",
        none: "minimal volcanic longevity",
      }),
      volcanicLongevityScore: round(volcanicLongevityScore, 3),
      mantleRecyclingSupportClass: classFromScore(mantleRecyclingScore, {
        high: "active recycling support",
        medium: "episodic recycling support",
        low: "stagnant-lid recycling support",
        none: "minimal recycling support",
      }),
      mantleRecyclingSupportScore: round(mantleRecyclingScore, 3),
      tidalVolcanismScore: round(tidalScore, 3),
      heatRetentionScore: round(massRetentionScore, 3),
      magneticTraceClass: dynamoActive ? "current field resolved" : "no current global field",
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
