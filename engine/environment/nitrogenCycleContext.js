import { clamp, round, toFinite } from "../utils.js";
import {
  CONFIDENCE,
  CONTEXT_STATUS,
  finiteNonNegative,
  fraction,
  makeContext,
  roundMaybe,
  scoreToClass,
} from "../contexts/validation.js";

const MODEL_VERSION = "nitrogen-cycle-context-v1";
const SOURCE_KEYS = ["nitrogenCycle"];

function logRangeScore(value, lower, upper) {
  const number = finiteNonNegative(value, 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const low = Math.log10(Math.max(lower, 1e-12));
  const high = Math.log10(Math.max(upper, lower * 1.0001));
  return clamp((Math.log10(Math.max(number, 1e-12)) - low) / (high - low), 0, 1);
}

function outputOf(context = null) {
  return context && typeof context === "object" ? context.outputs || context : {};
}

function resolveCompositionPartial({
  composition = {},
  pressureAtm = 0,
  key,
  fallbackPartialAtm = null,
}) {
  const fallback = toFinite(fallbackPartialAtm, NaN);
  if (Number.isFinite(fallback) && fallback >= 0) return fallback;
  const pressure = finiteNonNegative(pressureAtm, 0);
  const raw = finiteNonNegative(composition?.[key], NaN);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  if (raw <= 1.25 && pressure > 0) return raw * pressure;
  if (raw <= 150 && pressure > 0) return (raw / 100) * pressure;
  return raw;
}

function resolveN2Fraction({ pressureAtm, n2Fraction, ppN2Atm, composition }) {
  const explicitFraction = toFinite(n2Fraction, NaN);
  if (Number.isFinite(explicitFraction)) return clamp(explicitFraction, 0, 1);
  const pressure = finiteNonNegative(pressureAtm, 0);
  if (pressure > 0) {
    const partial = finiteNonNegative(ppN2Atm, NaN);
    if (Number.isFinite(partial)) return clamp(partial / pressure, 0, 1);
  }
  const raw = finiteNonNegative(composition?.n2, NaN);
  if (!Number.isFinite(raw)) return 0;
  return raw > 1.25 ? clamp(raw / 100, 0, 1) : clamp(raw, 0, 1);
}

function reservoirClass(partialAtm) {
  if (partialAtm < 1e-5) return "no meaningful N2 reservoir";
  if (partialAtm < 0.01) return "trace N2 reservoir";
  if (partialAtm < 0.1) return "weak N2 reservoir";
  if (partialAtm < 0.5) return "moderate N2 reservoir";
  if (partialAtm <= 2) return "strong N2 reservoir";
  return "massive N2 reservoir";
}

function pressureBufferClass(score) {
  return scoreToClass(score, {
    high: "strong pressure buffer",
    medium: "moderate pressure buffer",
    low: "weak pressure buffer",
    none: "minimal pressure buffer",
    highAt: 0.7,
    mediumAt: 0.38,
    lowAt: 0.12,
  });
}

function greenhouseBroadeningClass(score) {
  return scoreToClass(score, {
    high: "strong broadening support",
    medium: "moderate broadening support",
    low: "weak broadening support",
    none: "minimal broadening support",
    highAt: 0.68,
    mediumAt: 0.35,
    lowAt: 0.1,
  });
}

function fixedNitrogenClass(score) {
  return scoreToClass(score, {
    high: "strong fixed-nitrogen availability",
    medium: "moderate fixed-nitrogen availability",
    low: "limited fixed-nitrogen availability",
    none: "poor fixed-nitrogen availability",
    highAt: 0.65,
    mediumAt: 0.34,
    lowAt: 0.12,
  });
}

function nutrientLimitationClass(score) {
  if (score >= 0.65) return "not nitrogen-limited";
  if (score >= 0.34) return "mild nitrogen limitation";
  if (score >= 0.12) return "strong nitrogen limitation";
  return "severe nitrogen limitation";
}

function temperatureFixationScore(surfaceTempK) {
  const temp = toFinite(surfaceTempK, NaN);
  if (!Number.isFinite(temp)) return 0.35;
  if (temp >= 273 && temp <= 323) return 1;
  if (temp >= 250 && temp < 273) return clamp((temp - 250) / 23, 0.1, 0.85);
  if (temp > 323 && temp <= 373) return clamp((373 - temp) / 50, 0.15, 0.9);
  if (temp > 223 && temp < 250) return 0.08;
  return 0;
}

function liquidWaterScore(hydrosphere = {}) {
  const surface = fraction(
    hydrosphere?.surfaceAccessibleLiquidFraction ?? hydrosphere?.liquidOceanFraction,
    0,
  );
  const ocean = fraction(hydrosphere?.liquidOceanFraction, 0);
  const subsurface =
    hydrosphere?.subsurfaceOceanPresent === true
      ? 0.45
      : 0.45 * fraction(hydrosphere?.subsurfaceOceanScore, 0);
  return clamp(Math.max(Math.sqrt(surface), 0.75 * ocean, subsurface), 0, 1);
}

function geologyScore({ geology = null, outgassing = null, interiorEvolutionContext = null }) {
  const interior = outputOf(interiorEvolutionContext);
  const volcanicText = [
    geology?.volcanicActivity,
    geology?.cryovolcanicActivity,
    geology?.dominantProcess,
    geology?.resurfacingClass,
    interior.volcanicLongevityClass,
    outgassing?.sourceClass,
    outgassing?.primarySpecies,
  ]
    .join(" ")
    .toLowerCase();
  const numeric = Math.max(
    fraction(geology?.volcanicActivityScore, 0),
    fraction(geology?.cryovolcanicActivityScore, 0) * 0.8,
    /strong|active|sustained/.test(volcanicText) ? 0.72 : 0,
    /moderate|episodic|cryovolcanic|volcanic/.test(volcanicText) ? 0.5 : 0,
    /weak|waning|limited/.test(volcanicText) ? 0.22 : 0,
  );
  return clamp(numeric || 0.35, 0, 1);
}

function energyScore({
  lightningUvProxy = null,
  environmentForcing = null,
  photochemistry = null,
}) {
  const uv = finiteNonNegative(
    lightningUvProxy,
    finiteNonNegative(
      environmentForcing?.flux?.prebioticUvEarthAtOrbit,
      finiteNonNegative(photochemistry?.prebioticUv?.topOfAtmosphereFluxErgCm2S, NaN),
    ),
  );
  if (Number.isFinite(uv)) return clamp(Math.log10(1 + uv) / Math.log10(11), 0, 1);
  return 0.5;
}

function confidenceClass({
  pressureAtm,
  ppN2Atm,
  surfaceTempK,
  hydrosphere,
  manualOverrideProtected,
}) {
  if (manualOverrideProtected) return CONFIDENCE.MEDIUM;
  const known = [
    Number.isFinite(toFinite(pressureAtm, NaN)),
    Number.isFinite(toFinite(ppN2Atm, NaN)),
    Number.isFinite(toFinite(surfaceTempK, NaN)),
    hydrosphere && typeof hydrosphere === "object",
  ].filter(Boolean).length;
  if (known >= 4) return CONFIDENCE.HIGH;
  if (known >= 2) return CONFIDENCE.MEDIUM;
  if (known >= 1) return CONFIDENCE.LOW;
  return CONFIDENCE.UNKNOWN;
}

function guidedRecommendation({ pressureAtm, ppN2Atm, fixedNitrogenScore, surfaceTempK, manual }) {
  if (manual) {
    return "Manual atmosphere values are retained; nitrogen context adds caveats only.";
  }
  const pressure = finiteNonNegative(pressureAtm, 0);
  const n2 = finiteNonNegative(ppN2Atm, 0);
  const temp = toFinite(surfaceTempK, NaN);
  const temperate = Number.isFinite(temp) && temp >= 250 && temp <= 373;
  if (pressure > 0.02 && n2 < 0.03 && temperate) {
    return "Consider a non-reactive background gas reservoir if a pressure-buffered, water-compatible atmosphere is intended.";
  }
  if (n2 >= 0.5 && fixedNitrogenScore < 0.12) {
    return "Bulk N2 is present, but temperature or solvent context keeps fixed nitrogen poorly available.";
  }
  return "No nitrogen-specific atmosphere change is recommended by the bounded context.";
}

export function buildNitrogenCycleContext({
  pressureAtm = 0,
  n2Fraction = null,
  ppN2Atm = null,
  composition = {},
  greenhouseGasPartialAtm = null,
  surfaceTempK = null,
  hydrosphere = null,
  geology = null,
  outgassing = null,
  interiorEvolutionContext = null,
  oceanChemistryContext = null,
  lightningUvProxy = null,
  environmentForcing = null,
  photochemistry = null,
  atmosphereEvolutionContext = null,
  manualMode = false,
} = {}) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  const n2Partial = finiteNonNegative(
    ppN2Atm,
    resolveCompositionPartial({ composition, pressureAtm: pressure, key: "n2" }),
  );
  const resolvedN2Fraction = resolveN2Fraction({
    pressureAtm: pressure,
    n2Fraction,
    ppN2Atm: n2Partial,
    composition,
  });
  const greenhousePartial =
    finiteNonNegative(greenhouseGasPartialAtm, NaN) ||
    ["co2", "h2o", "ch4", "h2", "nh3", "so2"].reduce(
      (sum, key) =>
        sum +
        resolveCompositionPartial({
          composition,
          pressureAtm: pressure,
          key,
        }),
      0,
    );

  const n2ReservoirScore = logRangeScore(n2Partial, 0.005, 0.78);
  const pressureBufferScore = round(
    clamp(
      0.55 * logRangeScore(pressure, 0.03, 1) + 0.45 * logRangeScore(n2Partial, 0.03, 0.78),
      0,
      1,
    ),
    3,
  );
  const broadeningScore = round(
    clamp(
      Math.sqrt(
        logRangeScore(Math.max(n2Partial, pressure * resolvedN2Fraction), 0.02, 0.78) *
          logRangeScore(greenhousePartial, 1e-5, 0.01),
      ) * logRangeScore(pressure, 0.05, 1),
      0,
      1,
    ),
    3,
  );
  const tempScore = temperatureFixationScore(surfaceTempK);
  const liquidScore = liquidWaterScore(hydrosphere || {});
  const geoScore = geologyScore({ geology, outgassing, interiorEvolutionContext });
  const uvScore = energyScore({ lightningUvProxy, environmentForcing, photochemistry });
  const ocean = outputOf(oceanChemistryContext);
  const rockOceanScore = fraction(ocean.rockOceanAccess, liquidScore > 0 ? 0.45 : 0.15);
  const oceanNutrientScore = fraction(ocean.nutrientSupportScore, NaN);
  const fixedNitrogenScore = round(
    clamp(
      n2ReservoirScore *
        tempScore *
        (0.45 * liquidScore + 0.2 * geoScore + 0.2 * uvScore + 0.15 * rockOceanScore),
      0,
      1,
    ),
    3,
  );
  const nutrientScore = Number.isFinite(oceanNutrientScore)
    ? round(Math.min(fixedNitrogenScore, oceanNutrientScore), 3)
    : fixedNitrogenScore;
  const manualOverrideProtected =
    manualMode === true || String(manualMode).toLowerCase() === "manual";
  const assumptions = [
    "Nitrogen context estimates pressure buffering and fixed-nitrogen availability only; it does not assert biology.",
  ];
  const limitingFactors = [];
  if (pressureBufferScore < 0.12)
    limitingFactors.push("N2 does not provide a meaningful pressure buffer.");
  if (fixedNitrogenScore < 0.12)
    limitingFactors.push("Fixed nitrogen availability is strongly limited.");
  if (tempScore <= 0.08 && n2Partial >= 0.1) {
    limitingFactors.push(
      "Bulk N2 is cold-trapped or solvent-limited for Earth-like nitrogen cycling.",
    );
  }
  if (liquidScore <= 0.05)
    limitingFactors.push("Limited liquid-water access restricts Earth-like nitrogen cycling.");

  const atmosphereEvolutionOutputs = outputOf(atmosphereEvolutionContext);
  const notes = [
    "Bulk atmospheric N2 is treated as a background reservoir, not an automatic nutrient supply.",
  ];
  if (manualOverrideProtected) {
    notes.push("Manual atmosphere settings are reported but not overwritten.");
  }
  if (broadeningScore >= 0.35) {
    notes.push(
      "N2 pressure broadening can support greenhouse effectiveness when greenhouse gases are present.",
    );
  }
  if (
    /escape|loss|transient/i.test(String(atmosphereEvolutionOutputs.volatileLossRiskClass || ""))
  ) {
    notes.push("Atmosphere evolution context can reduce confidence in long-term N2 retention.");
  }

  const confidence = confidenceClass({
    pressureAtm: pressure,
    ppN2Atm: n2Partial,
    surfaceTempK,
    hydrosphere,
    manualOverrideProtected,
  });
  const status =
    pressure <= 0 || n2Partial <= 0
      ? CONTEXT_STATUS.LIMITED
      : confidence === CONFIDENCE.UNKNOWN
        ? CONTEXT_STATUS.UNKNOWN
        : CONTEXT_STATUS.SUPPORTED;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      pressureAtm: roundMaybe(pressure, pressure < 0.01 ? 8 : 4),
      n2Fraction: roundMaybe(resolvedN2Fraction, 4),
      ppN2Atm: roundMaybe(n2Partial, n2Partial < 0.01 ? 8 : 4),
      greenhouseGasPartialAtm: roundMaybe(greenhousePartial, greenhousePartial < 0.01 ? 8 : 4),
      surfaceTempK: roundMaybe(surfaceTempK, 2),
      liquidWaterScore: roundMaybe(liquidScore, 3),
      geologyOutgassingScore: roundMaybe(geoScore, 3),
      lightningUvProxyScore: roundMaybe(uvScore, 3),
      oceanChemistryModelVersion: oceanChemistryContext?.modelVersion || null,
      atmosphereEvolutionModelVersion: atmosphereEvolutionContext?.modelVersion || null,
    },
    outputs: {
      n2ReservoirClass: reservoirClass(n2Partial),
      n2ReservoirScore: round(n2ReservoirScore, 3),
      pressureBufferSupportClass: pressureBufferClass(pressureBufferScore),
      pressureBufferSupportScore: pressureBufferScore,
      fixedNitrogenAvailabilityClass: fixedNitrogenClass(fixedNitrogenScore),
      fixedNitrogenAvailabilityScore: fixedNitrogenScore,
      nutrientLimitationClass: nutrientLimitationClass(nutrientScore),
      nutrientSupportScore: nutrientScore,
      greenhouseBroadeningSupportClass: greenhouseBroadeningClass(broadeningScore),
      greenhouseBroadeningSupportScore: broadeningScore,
      climatePressureSupportNote:
        pressureBufferScore >= 0.38
          ? "N2 contributes meaningful background pressure support."
          : "N2 pressure support is weak or absent.",
      guidedAtmosphereRecommendation: guidedRecommendation({
        pressureAtm: pressure,
        ppN2Atm: n2Partial,
        fixedNitrogenScore,
        surfaceTempK,
        manual: manualOverrideProtected,
      }),
      productivityNutrientModifier: round(clamp(0.35 + 0.65 * nutrientScore, 0.35, 1), 3),
      biosignatureNitrogenCaveatClass:
        nutrientScore < 0.12
          ? "severe-nitrogen-limitation-caveat"
          : nutrientScore < 0.34
            ? "nitrogen-limitation-caveat"
            : "nitrogen-context-neutral",
    },
    assumptions,
    limitingFactors,
    notes,
    sourceKeys: SOURCE_KEYS,
  });
}

export const NITROGEN_CYCLE_CONTEXT_MODEL_VERSION = MODEL_VERSION;
