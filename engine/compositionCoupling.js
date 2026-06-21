import { clamp, round, toFinite } from "./utils.js";
import {
  ROCKY_BODY_COMPONENT_KEYS,
  ROCKY_BODY_ELEMENT_KEYS,
  ROCKY_BODY_TRACE_ELEMENT_KEYS,
} from "./rockyBodyComposition.js";

export const ROCKY_BODY_COMPOSITION_COUPLING_MODEL_VERSION = "rocky-body-composition-coupling-v1";

const TRACE_HEAT_FRACTIONS = Object.freeze({
  uranium: 0.43,
  thorium: 0.4,
  potassium: 0.17,
});

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function boundedFractions(input = {}, keys = []) {
  const values = {};
  let total = 0;
  for (const key of keys) {
    const value = finiteNonNegative(input?.[key], 0);
    values[key] = value;
    total += value;
  }
  const divisor = total > 1 ? total : 1;
  return {
    values: Object.fromEntries(keys.map((key) => [key, clamp(values[key] / divisor, 0, 1)])),
    rawTotal: total,
    scaled: total > 1,
  };
}

function scoreFromFraction(value, fullAt) {
  return clamp(finiteNonNegative(value, 0) / Math.max(fullAt, 1e-9), 0, 1);
}

function firstPresentTrace(trace = {}, key, fallback = 1) {
  const value = Number(trace?.[key]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function resolveTraceRadiogenicAbundance(composition = null) {
  const trace =
    composition?.traceElementAbundance || composition?.manualTraceElementAbundance || {};
  const hasTrace = ROCKY_BODY_TRACE_ELEMENT_KEYS.some((key) => {
    const value = Number(trace?.[key]);
    return Number.isFinite(value) && value >= 0;
  });
  if (!hasTrace) return null;

  const uranium = firstPresentTrace(trace, "uranium", 1);
  const thorium = firstPresentTrace(trace, "thorium", 1);
  const potassium = firstPresentTrace(trace, "potassium", 1);
  const abundance =
    uranium * TRACE_HEAT_FRACTIONS.uranium +
    thorium * TRACE_HEAT_FRACTIONS.thorium +
    potassium * TRACE_HEAT_FRACTIONS.potassium;

  return {
    modelVersion: `${ROCKY_BODY_COMPOSITION_COUPLING_MODEL_VERSION}-radiogenic-trace`,
    abundance: round(clamp(abundance, 0.01, 5), 4),
    rawAbundance: round(abundance, 4),
    traceElementAbundance: {
      uranium: round(uranium, 4),
      thorium: round(thorium, 4),
      potassium: round(potassium, 4),
    },
    source: "manual-trace-elements",
    caveat:
      "K, U, and Th trace values are treated as present-day Earth-relative heat multipliers; missing species keep Earth-relative abundance.",
    clamped: abundance < 0.01 || abundance > 5,
  };
}

function visualDiagnostic({
  carbonScore,
  sulfurScore,
  saltScore,
  ironScore,
  carbonaceous,
  sulfurReservoir,
  salts,
  metal,
}) {
  const candidates = [
    {
      key: "iron-rich",
      label: "Iron-rich inventory",
      score: Math.max(ironScore, scoreFromFraction(metal, 0.45)),
      active: ironScore >= 0.72 || metal >= 0.38,
    },
    {
      key: "sulfur-rich",
      label: "Sulfur-rich inventory",
      score: Math.max(sulfurScore, scoreFromFraction(sulfurReservoir, 0.12)),
      active: sulfurScore >= 0.58 || sulfurReservoir >= 0.08,
    },
    {
      key: "salt-rich",
      label: "Salt-rich inventory",
      score: Math.max(saltScore, scoreFromFraction(salts, 0.08)),
      active: saltScore >= 0.55 || salts >= 0.05,
    },
    {
      key: "dark-carbonaceous",
      label: "Dark carbonaceous inventory",
      score: Math.max(carbonScore, scoreFromFraction(carbonaceous, 0.16)),
      active: carbonScore >= 0.5 || carbonaceous >= 0.1,
    },
  ].filter((item) => item.active);

  const dominant = candidates.sort((left, right) => right.score - left.score)[0] || null;
  return {
    activeDiagnostics: candidates.map(({ key, label, score }) => ({
      key,
      label,
      score: round(score, 3),
    })),
    dominantDiagnostic: dominant?.key || "none",
    dominantLabel: dominant?.label || "No strong inventory visual diagnostic",
  };
}

export function buildRockyBodyCompositionCoupling(composition = null) {
  if (!composition || typeof composition !== "object") {
    return {
      modelVersion: ROCKY_BODY_COMPOSITION_COUPLING_MODEL_VERSION,
      available: false,
      caveats: ["No rocky-body composition inventory was supplied."],
    };
  }

  const components = boundedFractions(
    composition.componentMassFractions,
    ROCKY_BODY_COMPONENT_KEYS,
  );
  const elements = boundedFractions(composition.elementMassFractions, ROCKY_BODY_ELEMENT_KEYS);
  const c = components.values;
  const e = elements.values;

  const metal = fraction(c.metal, 0);
  const silicate = fraction(c.silicate, 0);
  const waterIce = fraction(c.waterIce, 0);
  const volatileIce = fraction(c.volatileIce, 0);
  const carbonaceous = fraction(c.carbonaceous, 0);
  const sulfurReservoir = fraction(c.sulfur, 0);
  const salts = fraction(c.salts, 0);

  const iron = fraction(e.iron, 0);
  const nickel = fraction(e.nickel, 0);
  const carbon = fraction(e.carbon, 0);
  const nitrogen = fraction(e.nitrogen, 0);
  const sulfur = fraction(e.sulfur, 0);
  const hydrogen = fraction(e.hydrogen, 0);
  const oxygen = fraction(e.oxygen, 0);
  const sodium = fraction(e.sodium, 0);
  const chlorine = fraction(e.chlorine, 0);
  const magnesium = fraction(e.magnesium, 0);
  const silicon = fraction(e.silicon, 0);

  const ironNickelFraction = clamp(iron + nickel, 0, 1);
  const sodiumChlorineFraction = clamp(sodium + chlorine, 0, 1);
  const waterReservoirFraction = clamp(waterIce + volatileIce * 0.35, 0, 1);
  const volatileReservoirFraction = clamp(
    waterIce * 0.25 + volatileIce + carbonaceous * 0.45 + sulfurReservoir * 0.25,
    0,
    1,
  );
  const silicateElementFraction = clamp(magnesium + silicon + oxygen * 0.25, 0, 1);

  const saltScore = clamp(
    scoreFromFraction(salts, 0.08) * 0.75 + scoreFromFraction(sodiumChlorineFraction, 0.06) * 0.25,
    0,
    1,
  );
  const sulfurScore = clamp(
    scoreFromFraction(sulfurReservoir, 0.12) * 0.65 + scoreFromFraction(sulfur, 0.12) * 0.35,
    0,
    1,
  );
  const carbonScore = clamp(
    scoreFromFraction(carbonaceous, 0.16) * 0.65 +
      scoreFromFraction(carbon + volatileIce * 0.24, 0.12) * 0.35,
    0,
    1,
  );
  const nitrogenScore = clamp(
    scoreFromFraction(volatileIce, 0.08) * 0.45 + scoreFromFraction(nitrogen, 0.04) * 0.55,
    0,
    1,
  );
  const waterScore = clamp(
    scoreFromFraction(waterReservoirFraction, 0.25) * 0.75 +
      scoreFromFraction(Math.min(hydrogen / 0.112, oxygen / 0.888), 0.25) * 0.25,
    0,
    1,
  );
  const ironScore = clamp(
    scoreFromFraction(metal, 0.35) * 0.7 + scoreFromFraction(ironNickelFraction, 0.36) * 0.3,
    0,
    1,
  );
  const silicateScore = clamp(
    scoreFromFraction(silicate, 0.65) * 0.7 + scoreFromFraction(silicateElementFraction, 0.6) * 0.3,
    0,
    1,
  );

  const traceRadiogenic = resolveTraceRadiogenicAbundance(composition);
  const caveats = [
    "Downstream composition coupling uses bounded reservoir diagnostics, not full mineral speciation.",
  ];
  if (components.scaled) {
    caveats.push("Component fractions exceeded 100%; downstream coupling scaled them before use.");
  }
  if (elements.scaled) {
    caveats.push("Element fractions exceeded 100%; downstream coupling scaled them before use.");
  }
  if (traceRadiogenic?.clamped) {
    caveats.push("Trace-element radiogenic heat was clamped to the supported 0.01-5x range.");
  }

  const visual = visualDiagnostic({
    carbonScore,
    sulfurScore,
    saltScore,
    ironScore,
    carbonaceous,
    sulfurReservoir,
    salts,
    metal,
  });

  return {
    modelVersion: ROCKY_BODY_COMPOSITION_COUPLING_MODEL_VERSION,
    available: true,
    compositionMode: composition.compositionMode || "inferred",
    validationStatus: composition.validation?.status || "unknown",
    componentMassFractions: c,
    elementMassFractions: e,
    componentTotal: round(components.rawTotal, 4),
    elementTotal: round(elements.rawTotal, 4),
    componentFractionsScaled: components.scaled,
    elementFractionsScaled: elements.scaled,
    reservoirFractions: {
      metal: round(metal, 4),
      silicate: round(silicate, 4),
      waterIce: round(waterIce, 4),
      volatileIce: round(volatileIce, 4),
      carbonaceous: round(carbonaceous, 4),
      sulfur: round(sulfurReservoir, 4),
      salts: round(salts, 4),
      waterLike: round(waterReservoirFraction, 4),
      volatileLike: round(volatileReservoirFraction, 4),
    },
    elementBudgets: {
      ironNickel: round(ironNickelFraction, 4),
      carbon: round(carbon, 4),
      nitrogen: round(nitrogen, 4),
      sulfur: round(sulfur, 4),
      hydrogen: round(hydrogen, 4),
      oxygen: round(oxygen, 4),
      sodiumChlorine: round(sodiumChlorineFraction, 4),
    },
    reservoirScores: {
      salt: round(saltScore, 3),
      sulfur: round(sulfurScore, 3),
      carbonaceous: round(carbonScore, 3),
      nitrogenVolatile: round(nitrogenScore, 3),
      water: round(waterScore, 3),
      ironNickel: round(ironScore, 3),
      silicate: round(silicateScore, 3),
      volatile: round(
        clamp(
          0.35 * waterScore +
            0.25 * nitrogenScore +
            0.2 * carbonScore +
            0.12 * sulfurScore +
            0.08 * saltScore,
          0,
          1,
        ),
        3,
      ),
    },
    ocean: {
      salinityBiasPct: round(
        clamp(salts * 100 + sulfurReservoir * 15 + sodiumChlorineFraction * 10, 0, 18),
        2,
      ),
      ammoniaBiasPct: round(clamp(volatileIce * 45 + nitrogen * 42 + hydrogen * 8, 0, 12), 2),
      saltInventoryScore: round(saltScore, 3),
      sulfurInventoryScore: round(sulfurScore, 3),
      carbonInventoryScore: round(carbonScore, 3),
      nitrogenInventoryScore: round(nitrogenScore, 3),
    },
    atmosphere: {
      volatileSourceScore: round(
        clamp(
          0.32 * waterScore +
            0.24 * nitrogenScore +
            0.2 * carbonScore +
            0.16 * sulfurScore +
            0.08 * saltScore,
          0,
          1,
        ),
        3,
      ),
      carbonBudgetScore: round(carbonScore, 3),
      nitrogenBudgetScore: round(nitrogenScore, 3),
      sulfurBudgetScore: round(sulfurScore, 3),
      waterBudgetScore: round(waterScore, 3),
    },
    interior: {
      coreMetalScore: round(ironScore, 3),
      ironNickelFraction: round(ironNickelFraction, 4),
      metalFraction: round(metal, 4),
      silicateScore: round(silicateScore, 3),
      volatileSofteningScore: round(
        clamp(0.65 * waterScore + 0.35 * volatileReservoirFraction, 0, 1),
        3,
      ),
      ironNickelRelativeToEarth: round(clamp(ironNickelFraction / 0.34, 0, 2.5), 3),
      radiogenicTraceAbundance: traceRadiogenic?.abundance ?? null,
    },
    visual,
    traceRadiogenic,
    caveats,
  };
}
