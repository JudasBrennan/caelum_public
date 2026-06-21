import { clamp, toFinite } from "./utils.js";
import {
  calcMoonMaterialProfileFromDensity,
  calcRockyPlanetRigidityPa,
  calcRockyPlanetTidalQualityFactor,
  getMoonMaterialProfileByClass,
} from "./physics/materials.js";

const ROCKY_BODY_COMPOSITION_MODEL_VERSION = "rocky-body-composition-v2";

const SUBLIMATION_TABLE = [
  { species: "N\u2082", tempK: 63, label: "nitrogen" },
  { species: "CO", tempK: 68, label: "carbon monoxide" },
  { species: "CH\u2084", tempK: 91, label: "methane" },
  { species: "H\u2082O", tempK: 170, label: "water ice" },
  { species: "CO\u2082", tempK: 195, label: "carbon dioxide" },
];

const MU_FE = 55.85;
const MU_MG = 24.31;
const MU_SI = 28.09;
const MU_O = 16.0;
const SOLAR_FE_MG = 0.83;
const SOLAR_SI_MG = 0.95;

export const ROCKY_BODY_COMPONENT_KEYS = Object.freeze([
  "metal",
  "silicate",
  "waterIce",
  "volatileIce",
  "carbonaceous",
  "sulfur",
  "salts",
]);

export const ROCKY_BODY_ELEMENT_KEYS = Object.freeze([
  "iron",
  "nickel",
  "magnesium",
  "silicon",
  "oxygen",
  "hydrogen",
  "carbon",
  "nitrogen",
  "sulfur",
  "sodium",
  "chlorine",
  "aluminium",
  "calcium",
]);

export const ROCKY_BODY_TRACE_ELEMENT_KEYS = Object.freeze(["potassium", "uranium", "thorium"]);

const COMPONENT_DENSITY_GCM3 = Object.freeze({
  metal: 7.8,
  silicate: 3.3,
  waterIce: 0.93,
  volatileIce: 0.8,
  carbonaceous: 1.8,
  sulfur: 2.0,
  salts: 2.2,
});

const EARTH_DENSITY_GCM3 = 5.51;

const COMPONENT_KEYS = ROCKY_BODY_COMPONENT_KEYS;

const MOON_CLASS_COMPONENTS = Object.freeze({
  "Very icy": {
    metal: 0.01,
    silicate: 0.12,
    waterIce: 0.72,
    volatileIce: 0.08,
    carbonaceous: 0.04,
    sulfur: 0.01,
    salts: 0.02,
  },
  Icy: {
    metal: 0.03,
    silicate: 0.32,
    waterIce: 0.5,
    volatileIce: 0.06,
    carbonaceous: 0.04,
    sulfur: 0.02,
    salts: 0.03,
  },
  "Subsurface ocean": {
    metal: 0.02,
    silicate: 0.28,
    waterIce: 0.55,
    volatileIce: 0.04,
    carbonaceous: 0.03,
    sulfur: 0.02,
    salts: 0.06,
  },
  "Mixed rock/ice": {
    metal: 0.07,
    silicate: 0.58,
    waterIce: 0.26,
    volatileIce: 0.03,
    carbonaceous: 0.03,
    sulfur: 0.02,
    salts: 0.01,
  },
  Rocky: {
    metal: 0.18,
    silicate: 0.75,
    waterIce: 0.02,
    volatileIce: 0.005,
    carbonaceous: 0.015,
    sulfur: 0.02,
    salts: 0.01,
  },
  "Partially molten": {
    metal: 0.18,
    silicate: 0.76,
    waterIce: 0.005,
    volatileIce: 0.005,
    carbonaceous: 0.01,
    sulfur: 0.03,
    salts: 0.01,
  },
  "Iron-rich": {
    metal: 0.6,
    silicate: 0.36,
    waterIce: 0.005,
    volatileIce: 0.002,
    carbonaceous: 0.003,
    sulfur: 0.02,
    salts: 0.01,
  },
});

const MOON_CLASS_DENSITY_GCM3 = Object.freeze({
  "Very icy": 0.8,
  Icy: 1.5,
  "Subsurface ocean": 1.7,
  "Mixed rock/ice": 2.6,
  Rocky: 3.6,
  "Partially molten": 3.6,
  "Iron-rich": 5.5,
});

const COMPONENT_ELEMENT_FRACTIONS = Object.freeze({
  metal: { iron: 0.86, nickel: 0.05, sulfur: 0.09 },
  silicate: {
    oxygen: 0.44,
    magnesium: 0.22,
    silicon: 0.21,
    iron: 0.08,
    calcium: 0.025,
    aluminium: 0.025,
  },
  waterIce: { oxygen: 0.888, hydrogen: 0.112 },
  volatileIce: { oxygen: 0.44, carbon: 0.24, nitrogen: 0.18, hydrogen: 0.14 },
  carbonaceous: { carbon: 0.7, oxygen: 0.15, hydrogen: 0.05, nitrogen: 0.05, sulfur: 0.05 },
  sulfur: { sulfur: 1 },
  salts: { chlorine: 0.55, sodium: 0.25, magnesium: 0.1, sulfur: 0.1 },
});

function makeValidationMessage(code, severity, field, message) {
  return { code, severity, field, message };
}

function normalizeCompositionMode(mode) {
  const normalized = String(mode || "inferred").toLowerCase();
  if (normalized === "reservoir" || normalized === "expert-elements") return normalized;
  return "inferred";
}

function normalizeMassFractionMode(mode) {
  return String(mode || "warn").toLowerCase() === "normalize" ? "normalize" : "warn";
}

function pickFractions(input, keys) {
  const result = {};
  for (const key of keys) {
    result[key] = Math.max(toFinite(input?.[key], 0), 0);
  }
  return result;
}

function sumKeys(input, keys) {
  return keys.reduce((sum, key) => sum + Math.max(toFinite(input?.[key], 0), 0), 0);
}

function hasAnyFiniteInput(input, keys) {
  return keys.some((key) => {
    const value = input?.[key];
    return value !== null && value !== "" && Number.isFinite(Number(value));
  });
}

function normalizePositiveFractions(input, keys) {
  const picked = pickFractions(input, keys);
  const total = sumKeys(picked, keys);
  if (total <= 0) return picked;
  return Object.fromEntries(keys.map((key) => [key, picked[key] / total]));
}

function withMetalsAggregate(elementMassFractions) {
  const elements = pickFractions(elementMassFractions, ROCKY_BODY_ELEMENT_KEYS);
  elements.metals =
    (elements.iron || 0) +
    (elements.nickel || 0) +
    (elements.magnesium || 0) +
    (elements.aluminium || 0) +
    (elements.calcium || 0) +
    (elements.sodium || 0);
  return elements;
}

export function normalizeMassFractionInput(input, keys, options = {}) {
  const mode = normalizeMassFractionMode(options.normalizeMode || options.compositionNormalizeMode);
  const inputUnit = String(options.inputUnit || "fraction").toLowerCase();
  const label = options.label || "mass fraction";
  const fallbackFractions = options.fallbackFractions || null;
  const messages = [];
  const fractions = {};
  const rawFractions = {};
  let hasAny = false;
  let valid = true;

  for (const key of keys) {
    const rawValue = input?.[key];
    fractions[key] = 0;
    if (rawValue === null || rawValue === undefined || rawValue === "") continue;

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      valid = false;
      messages.push(
        makeValidationMessage(
          `${key}-not-finite`,
          "error",
          key,
          `${label} ${key} must be a finite number.`,
        ),
      );
      continue;
    }

    hasAny = true;
    const fraction = inputUnit === "percent" ? numericValue / 100 : numericValue;
    rawFractions[key] = fraction;
    fractions[key] = Math.max(fraction, 0);

    if (fraction < 0) {
      valid = false;
      messages.push(
        makeValidationMessage(
          `${key}-negative`,
          "error",
          key,
          `${label} ${key} cannot be negative.`,
        ),
      );
    } else if (fraction > 1) {
      valid = false;
      messages.push(
        makeValidationMessage(
          `${key}-above-total`,
          "error",
          key,
          `${label} ${key} cannot exceed 100% of the body mass.`,
        ),
      );
    }
  }

  if (!valid) {
    return {
      fractions: fallbackFractions
        ? pickFractions(fallbackFractions, keys)
        : pickFractions({}, keys),
      rawFractions,
      total: sumKeys(fractions, keys),
      hasAny,
      valid: false,
      normalized: false,
      usedFallback: Boolean(fallbackFractions),
      messages,
    };
  }

  const total = sumKeys(fractions, keys);
  if (total <= 0) {
    return {
      fractions: fallbackFractions ? pickFractions(fallbackFractions, keys) : fractions,
      rawFractions,
      total,
      hasAny,
      valid: true,
      normalized: false,
      usedFallback: Boolean(fallbackFractions),
      messages,
    };
  }

  if (mode === "normalize") {
    const normalizedFractions = Object.fromEntries(
      keys.map((key) => [key, fractions[key] / total]),
    );
    if (Math.abs(total - 1) > 1e-9) {
      messages.push(
        makeValidationMessage(
          "mass-fraction-normalized",
          "info",
          label,
          `${label} values were normalized from ${(total * 100).toFixed(2)}% to 100%.`,
        ),
      );
    }
    return {
      fractions: normalizedFractions,
      rawFractions,
      total,
      hasAny,
      valid: true,
      normalized: Math.abs(total - 1) > 1e-9,
      usedFallback: false,
      messages,
    };
  }

  if (Math.abs(total - 1) > 0.01) {
    messages.push(
      makeValidationMessage(
        "mass-fraction-total-off",
        "warning",
        label,
        `${label} values sum to ${(total * 100).toFixed(2)}%; expected about 100%.`,
      ),
    );
  }

  return {
    fractions,
    rawFractions,
    total,
    hasAny,
    valid: true,
    normalized: false,
    usedFallback: false,
    messages,
  };
}

export function compositionClass(cmf, wmf) {
  if (wmf > 0.1) return "Ice world";
  if (wmf > 0.001) return "Ocean world";
  if (cmf > 0.6) return "Iron world";
  if (cmf > 0.45) return "Mercury-like";
  if (cmf >= 0.25) return "Earth-like";
  if (cmf >= 0.1) return "Mars-like";
  return "Coreless";
}

export function waterRegime(wmf) {
  if (wmf < 0.0001) return "Dry";
  if (wmf < 0.001) return "Shallow oceans";
  if (wmf < 0.01) return "Extensive oceans";
  if (wmf < 0.1) return "Global ocean";
  if (wmf < 0.3) return "Deep ocean";
  return "Ice world";
}

export function bodyClass(massEarth) {
  return massEarth < 0.01 ? "Dwarf planet" : "Planet";
}

export function classifyRockySurfaceState({
  surfaceTempK,
  tidallyLockedToStar = false,
  bodyClass = "Planet",
}) {
  if (bodyClass === "Dwarf planet") {
    return {
      key: "dwarf-rocky",
      label: "Dwarf rocky world",
      reason: "Low-mass rocky body without persistent silicate-melt conditions.",
    };
  }
  if (surfaceTempK >= 1800) {
    return {
      key: "magma-ocean-world",
      label: "Magma ocean world",
      reason: "Average surface temperature is high enough for globally extensive silicate melt.",
    };
  }
  if (surfaceTempK >= 1400 || (tidallyLockedToStar && surfaceTempK >= 1100)) {
    return {
      key: "lava-world",
      label: "Lava world",
      reason:
        tidallyLockedToStar && surfaceTempK < 1400
          ? "High average temperature plus permanent dayside heating suggests molten surface regions."
          : "Average surface temperature is high enough for extensive surface silicate melting.",
    };
  }
  return {
    key: "standard-rocky",
    label: "Standard rocky world",
    reason: "Surface temperatures stay below the model's silicate-melt classification thresholds.",
  };
}

export function classifyClimateState(surfaceTempK, absorbedFluxWm2, hasWater) {
  if (!hasWater) return "Stable";
  if (absorbedFluxWm2 > 282) return "Runaway greenhouse";
  if (surfaceTempK > 340) return "Moist greenhouse";
  if (surfaceTempK < 240) return "Snowball";
  return "Stable";
}

export function analyseVolatiles(tEqPeriK, tEqApoK) {
  return SUBLIMATION_TABLE.map(({ species, tempK, label }) => {
    const periAbove = tEqPeriK >= tempK;
    const apoAbove = tEqApoK >= tempK;
    let note;
    if (!periAbove) {
      note = `${species} ice stable`;
    } else if (!apoAbove) {
      note = `Transient ${label} atmosphere near periapsis`;
    } else {
      note = `${label} sublimation throughout orbit`;
    }
    return {
      species,
      tempK,
      canSublimate: periAbove,
      transient: periAbove && !apoAbove,
      persistent: periAbove && apoAbove,
      note,
    };
  });
}

export function waterRadiusInflation(massEarth, wmf) {
  if (wmf <= 0) return 1.0;
  const rDryZeng = 1.0 * massEarth ** 0.27;
  const r50Zeng = 1.38 * massEarth ** 0.263;
  const inflation = (r50Zeng / rDryZeng - 1) * Math.min(wmf / 0.5, 1);
  return 1 + inflation;
}

export function suggestedCmfFromMetallicity(feH) {
  const feMg = SOLAR_FE_MG * 10 ** feH;
  const siMg = SOLAR_SI_MG;
  const muMantle = MU_MG + MU_O + siMg * (MU_SI + 2 * MU_O);
  return (feMg * MU_FE) / (feMg * MU_FE + muMantle);
}

export function waterBoilingK(pAtm) {
  if (pAtm <= 0) return 0;
  if (pAtm >= 218) return 647;
  const lvOverR = 40700 / 8.314;
  return 1 / (1 / 373.15 - Math.log(pAtm) / lvOverR);
}

export function inferMoonCoreMassFraction({
  densityGcm3,
  compositionClass,
  differentiatedInterior,
}) {
  const density = Math.max(toFinite(densityGcm3, 0), 0);
  const composition = String(compositionClass || "").toLowerCase();
  if (differentiatedInterior === false && density < 2.5) return 0.03;
  if (composition.includes("silicate") || composition.includes("rock")) {
    return clamp(0.12 + Math.max(0, density - 3) * 0.08, 0.1, 0.28);
  }
  if (density >= 4) return 0.22;
  if (density >= 3) return differentiatedInterior === true ? 0.14 : 0.1;
  if (density >= 2) return differentiatedInterior === true ? 0.08 : 0.05;
  return differentiatedInterior === true ? 0.05 : 0.03;
}

function normalizedComponentFractions(fractions) {
  const sanitized = {};
  for (const key of COMPONENT_KEYS) {
    sanitized[key] = Math.max(toFinite(fractions?.[key], 0), 0);
  }
  const total = Object.values(sanitized).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return { ...sanitized, silicate: 1 };
  if (Math.abs(total - 1) <= 1e-12) return sanitized;
  if (total < 1) return { ...sanitized, silicate: sanitized.silicate + (1 - total) };
  return Object.fromEntries(Object.entries(sanitized).map(([key, value]) => [key, value / total]));
}

export function componentFractionsToElements(componentMassFractions) {
  const elements = {};
  for (const [component, componentFraction] of Object.entries(componentMassFractions)) {
    const elementFractions = COMPONENT_ELEMENT_FRACTIONS[component];
    if (!elementFractions) continue;
    for (const [element, elementFraction] of Object.entries(elementFractions)) {
      elements[element] = (elements[element] || 0) + componentFraction * elementFraction;
    }
  }
  return withMetalsAggregate(elements);
}

export function elementsToComponentHints(elementMassFractions) {
  const elements = pickFractions(elementMassFractions, ROCKY_BODY_ELEMENT_KEYS);
  const waterPotential =
    elements.hydrogen > 0 && elements.oxygen > 0
      ? Math.min(elements.hydrogen / 0.112, elements.oxygen / 0.888)
      : 0;
  const silicatePotential =
    elements.oxygen > 0 && elements.magnesium + elements.silicon > 0
      ? Math.min((elements.magnesium + elements.silicon) / 0.43, elements.oxygen / 0.44)
      : 0;
  const saltPotential =
    elements.sodium > 0 && elements.chlorine > 0
      ? Math.min(elements.sodium / 0.25, elements.chlorine / 0.55)
      : 0;
  const hints = {
    metal: clamp((elements.iron + elements.nickel) / 0.91, 0, 1),
    silicate: clamp(silicatePotential, 0, 1),
    waterIce: clamp(waterPotential, 0, 1),
    volatileIce: clamp(elements.carbon + elements.nitrogen + elements.hydrogen * 0.35, 0, 1),
    carbonaceous: clamp(elements.carbon / 0.7, 0, 1),
    sulfur: clamp(elements.sulfur, 0, 1),
    salts: clamp(saltPotential, 0, 1),
  };
  return {
    rawHints: hints,
    componentHints: normalizePositiveFractions(hints, ROCKY_BODY_COMPONENT_KEYS),
  };
}

export function estimateComponentDensityGcm3(componentMassFractions) {
  const normalized = normalizePositiveFractions(componentMassFractions, ROCKY_BODY_COMPONENT_KEYS);
  let specificVolume = 0;
  for (const key of ROCKY_BODY_COMPONENT_KEYS) {
    const density = COMPONENT_DENSITY_GCM3[key];
    const fraction = normalized[key] || 0;
    if (density > 0 && fraction > 0) specificVolume += fraction / density;
  }
  return specificVolume > 0 ? 1 / specificVolume : NaN;
}

export function estimateCompressedPlanetDensityGcm3({
  massEarth = 1,
  componentMassFractions = {},
} = {}) {
  const mass = clamp(toFinite(massEarth, 1), 0.0001, 1000);
  const coreMassFraction = clamp(toFinite(componentMassFractions?.metal, 0), 0, 1);
  const waterMassFraction = clamp(
    toFinite(componentMassFractions?.waterIce, 0) +
      toFinite(componentMassFractions?.volatileIce, 0) * 0.35,
    0,
    0.9,
  );
  const alpha = Math.min(1 / 3, 0.257 - 0.0161 * Math.log(Math.max(mass, 1e-6)));
  const radiusDry = (1.07 - 0.21 * coreMassFraction) * mass ** alpha;
  if (!Number.isFinite(radiusDry) || radiusDry <= 0) return NaN;
  const radiusEarth = radiusDry * waterRadiusInflation(mass, waterMassFraction);
  if (!Number.isFinite(radiusEarth) || radiusEarth <= 0) return NaN;
  return (mass * EARTH_DENSITY_GCM3) / radiusEarth ** 3;
}

function selectManualInput(input, fractionKey, pctKey) {
  if (input?.[pctKey] && hasAnyFiniteInput(input[pctKey], Object.keys(input[pctKey]))) {
    return { values: input[pctKey], inputUnit: "percent" };
  }
  return { values: input?.[fractionKey] || {}, inputUnit: "fraction" };
}

export function solveManualComponentInventory(input = {}, inferredComposition = {}) {
  const selected = selectManualInput(input, "manualComponentMassFractions", "manualComponentPct");
  const normalized = normalizeMassFractionInput(selected.values, ROCKY_BODY_COMPONENT_KEYS, {
    normalizeMode: input.compositionNormalizeMode,
    inputUnit: selected.inputUnit,
    label: "manual component inventory",
    fallbackFractions: inferredComposition.componentMassFractions,
  });
  const messages = [...normalized.messages];

  if (!normalized.hasAny) {
    messages.push(
      makeValidationMessage(
        "manual-components-empty",
        "warning",
        "manualComponentMassFractions",
        "Manual reservoir mode has no component values; inferred inventory was retained.",
      ),
    );
  }

  return {
    componentMassFractions: normalized.hasAny
      ? normalized.fractions
      : pickFractions(inferredComposition.componentMassFractions, ROCKY_BODY_COMPONENT_KEYS),
    rawComponentMassFractions: normalized.rawFractions,
    total: normalized.total,
    normalized: normalized.normalized,
    usedFallback: normalized.usedFallback || !normalized.hasAny,
    valid: normalized.valid,
    messages,
  };
}

export function solveManualElementInventory(input = {}, inferredComposition = {}) {
  const selected = selectManualInput(input, "manualElementMassFractions", "manualElementPct");
  const normalized = normalizeMassFractionInput(selected.values, ROCKY_BODY_ELEMENT_KEYS, {
    normalizeMode: input.compositionNormalizeMode,
    inputUnit: selected.inputUnit,
    label: "manual element inventory",
    fallbackFractions: inferredComposition.elementMassFractions,
  });
  const messages = [...normalized.messages];

  if (!normalized.hasAny) {
    messages.push(
      makeValidationMessage(
        "manual-elements-empty",
        "warning",
        "manualElementMassFractions",
        "Expert element mode has no element values; component-derived elements were retained.",
      ),
    );
  }

  const fallbackElements = withMetalsAggregate(inferredComposition.elementMassFractions || {});
  const elementMassFractions = normalized.hasAny
    ? withMetalsAggregate(normalized.fractions)
    : fallbackElements;

  return {
    elementMassFractions,
    manualElementMassFractions: normalized.hasAny
      ? pickFractions(normalized.rawFractions, ROCKY_BODY_ELEMENT_KEYS)
      : null,
    componentHints: normalized.hasAny
      ? elementsToComponentHints(elementMassFractions).componentHints
      : null,
    total: normalized.total,
    normalized: normalized.normalized,
    usedFallback: normalized.usedFallback || !normalized.hasAny,
    valid: normalized.valid,
    messages,
  };
}

function normalizeTraceElementAbundance(input = {}) {
  const traceInput = input.manualTraceElementAbundance || {};
  const trace = {};
  for (const key of ROCKY_BODY_TRACE_ELEMENT_KEYS) {
    const value = Number(traceInput[key]);
    if (Number.isFinite(value) && value >= 0) trace[key] = value;
  }
  return Object.keys(trace).length ? trace : null;
}

function validationStatus(messages) {
  if (messages.some((message) => message.severity === "error")) {
    return { status: "invalid", confidence: "low" };
  }
  if (messages.some((message) => message.severity === "warning")) {
    return { status: "caution", confidence: "medium" };
  }
  return { status: "ok", confidence: "high" };
}

export function validateRockyBodyInventory(input = {}, solvedComposition = {}, context = {}) {
  const messages = [
    ...(Array.isArray(input.messages) ? input.messages : []),
    ...(Array.isArray(context.messages) ? context.messages : []),
  ];
  const componentMassFractions = solvedComposition.componentMassFractions || {};
  const elementMassFractions = solvedComposition.elementMassFractions || {};
  const bodyType = String(context.bodyType || solvedComposition.bodyType || "planet").toLowerCase();
  const compositionMode = normalizeCompositionMode(
    input.compositionMode || solvedComposition.compositionMode || "inferred",
  );
  const isManualInventory = compositionMode !== "inferred";
  const referenceDensity = Number(context.densityGcm3 ?? solvedComposition.densityGcm3);
  const densityComparison =
    bodyType === "planet"
      ? {
          densityGcm3: estimateCompressedPlanetDensityGcm3({
            massEarth: solvedComposition.massEarth ?? context.massEarth,
            componentMassFractions,
          }),
          label: "modeled density",
          detail: "after mass-radius compression",
          errorForLargeMismatch: true,
        }
      : {
          densityGcm3: estimateComponentDensityGcm3(componentMassFractions),
          label: "density proxy",
          detail: "from reservoir mixture",
          errorForLargeMismatch: false,
        };
  const estimatedDensityGcm3 = densityComparison.densityGcm3;

  if (
    isManualInventory &&
    Number.isFinite(referenceDensity) &&
    referenceDensity > 0 &&
    Number.isFinite(estimatedDensityGcm3) &&
    estimatedDensityGcm3 > 0
  ) {
    const relativeDelta = Math.abs(estimatedDensityGcm3 - referenceDensity) / referenceDensity;
    if (relativeDelta > 0.5) {
      messages.push(
        makeValidationMessage(
          "component-density-mismatch-large",
          densityComparison.errorForLargeMismatch ? "error" : "warning",
          "densityGcm3",
          `Manual inventory ${densityComparison.label} (${estimatedDensityGcm3.toFixed(
            2,
          )} g/cm3 ${densityComparison.detail}) is far from the body density (${referenceDensity.toFixed(
            2,
          )} g/cm3).`,
        ),
      );
    } else if (relativeDelta > 0.2) {
      messages.push(
        makeValidationMessage(
          "component-density-mismatch",
          "warning",
          "densityGcm3",
          `Manual inventory ${densityComparison.label} (${estimatedDensityGcm3.toFixed(
            2,
          )} g/cm3 ${densityComparison.detail}) differs from the body density (${referenceDensity.toFixed(
            2,
          )} g/cm3).`,
        ),
      );
    }
  }

  const modeledRadiusEarth = Number(context.radiusEarth ?? solvedComposition.radiusEarth);
  const observedRadiusEarth = Number(
    context.observedRadiusEarth ?? solvedComposition.observedRadiusEarth,
  );
  if (
    bodyType === "planet" &&
    Number.isFinite(modeledRadiusEarth) &&
    modeledRadiusEarth > 0 &&
    Number.isFinite(observedRadiusEarth) &&
    observedRadiusEarth > 0
  ) {
    const relativeDelta = Math.abs(modeledRadiusEarth - observedRadiusEarth) / observedRadiusEarth;
    if (relativeDelta > 0.1) {
      messages.push(
        makeValidationMessage(
          relativeDelta > 0.25 ? "observed-radius-mismatch-large" : "observed-radius-mismatch",
          "warning",
          "radiusEarth",
          `Modeled radius from mass and composition (${modeledRadiusEarth.toFixed(
            2,
          )} R_Earth) differs from the observed/input radius (${observedRadiusEarth.toFixed(
            2,
          )} R_Earth).`,
        ),
      );
    }
  }

  const radiusMoon = Number(context.radiusMoon);
  if (
    bodyType === "moon" &&
    Number.isFinite(radiusMoon) &&
    radiusMoon > 0 &&
    radiusMoon < 0.05 &&
    (componentMassFractions.metal > 0.3 || context.differentiatedInterior === true)
  ) {
    messages.push(
      makeValidationMessage(
        "small-body-differentiation-uncertain",
        "warning",
        "manualComponentMassFractions.metal",
        "Tiny moons are often porous or undifferentiated; a metal-rich differentiated inventory is uncertain.",
      ),
    );
  }

  const oxygen = elementMassFractions.oxygen || 0;
  const hydrogen = elementMassFractions.hydrogen || 0;
  const magnesium = elementMassFractions.magnesium || 0;
  const silicon = elementMassFractions.silicon || 0;
  const carbon = elementMassFractions.carbon || 0;
  const nitrogen = elementMassFractions.nitrogen || 0;
  const sulfur = elementMassFractions.sulfur || 0;
  const sodium = elementMassFractions.sodium || 0;
  const chlorine = elementMassFractions.chlorine || 0;
  const waterLike =
    (componentMassFractions.waterIce || 0) + (componentMassFractions.volatileIce || 0);

  if (waterLike > 0.05 && hydrogen < waterLike * 0.04) {
    messages.push(
      makeValidationMessage(
        "water-hydrogen-low",
        "warning",
        "manualElementMassFractions.hydrogen",
        "Water-rich reservoirs need a compatible hydrogen inventory.",
      ),
    );
  }
  if (magnesium + silicon > 0.12 && oxygen < 0.12) {
    messages.push(
      makeValidationMessage(
        "silicate-oxygen-low",
        "warning",
        "manualElementMassFractions.oxygen",
        "Mg/Si-rich rocky inventories usually require substantial oxygen in silicates.",
      ),
    );
  }
  if (
    carbon > 0.05 &&
    (componentMassFractions.carbonaceous || 0) + (componentMassFractions.volatileIce || 0) < 0.03
  ) {
    messages.push(
      makeValidationMessage(
        "carbon-reservoir-low",
        "warning",
        "manualComponentMassFractions.carbonaceous",
        "High carbon inventory should usually be paired with carbonaceous or volatile reservoirs.",
      ),
    );
  }
  if (nitrogen > 0.03 && (componentMassFractions.volatileIce || 0) < 0.03) {
    messages.push(
      makeValidationMessage(
        "nitrogen-volatile-low",
        "warning",
        "manualComponentMassFractions.volatileIce",
        "High nitrogen inventory should usually be paired with volatile ice or atmosphere-source reservoirs.",
      ),
    );
  }
  if (sodium + chlorine > 0.02 && (componentMassFractions.salts || 0) < 0.01) {
    messages.push(
      makeValidationMessage(
        "salt-reservoir-low",
        "warning",
        "manualComponentMassFractions.salts",
        "Na/Cl-rich inventories should usually include a salt reservoir.",
      ),
    );
  }
  const sulfurReservoirCapacity =
    (componentMassFractions.sulfur || 0) +
    (componentMassFractions.metal || 0) * 0.09 +
    (componentMassFractions.carbonaceous || 0) * 0.05 +
    (componentMassFractions.salts || 0) * 0.1;
  if (sulfur > Math.max(0.04, sulfurReservoirCapacity + 0.02)) {
    messages.push(
      makeValidationMessage(
        "sulfur-reservoir-low",
        "warning",
        "manualComponentMassFractions.sulfur",
        "Sulfur-rich inventories should usually include sulfur, sulfide, or sulfate reservoirs.",
      ),
    );
  }

  if (isManualInventory && (componentMassFractions.salts || 0) > 0.25) {
    messages.push(
      makeValidationMessage(
        "salt-reservoir-outside-supported-range",
        "warning",
        "manualComponentMassFractions.salts",
        "Salt reservoirs above 25% of body mass are outside the calibrated rocky/icy-body chemistry range; downstream salinity is qualitative.",
      ),
    );
  }
  if (isManualInventory && (componentMassFractions.sulfur || 0) > 0.25) {
    messages.push(
      makeValidationMessage(
        "sulfur-reservoir-outside-supported-range",
        "warning",
        "manualComponentMassFractions.sulfur",
        "Sulfur reservoirs above 25% of body mass are outside the calibrated moon/planet chemistry range; downstream volcanism and atmosphere coupling are qualitative.",
      ),
    );
  }
  if (isManualInventory && (componentMassFractions.carbonaceous || 0) > 0.35) {
    messages.push(
      makeValidationMessage(
        "carbonaceous-reservoir-outside-supported-range",
        "warning",
        "manualComponentMassFractions.carbonaceous",
        "Carbonaceous reservoirs above 35% of body mass are treated as a qualitative diagnostic rather than solved mineralogy.",
      ),
    );
  }

  const trace = solvedComposition.traceElementAbundance || {};
  for (const key of ROCKY_BODY_TRACE_ELEMENT_KEYS) {
    const value = Number(trace[key]);
    if (isManualInventory && Number.isFinite(value) && value > 5) {
      messages.push(
        makeValidationMessage(
          `${key}-trace-outside-supported-range`,
          "warning",
          `manualTraceElementAbundance.${key}`,
          `${key} trace abundance above 5x Earth is outside the supported radiogenic coupling range; downstream heat contribution will be clamped.`,
        ),
      );
    }
  }

  const summary = validationStatus(messages);
  return {
    ...summary,
    normalized: Boolean(input.normalized || context.normalized),
    messages,
  };
}

function buildPlanetComponentMassFractions({ coreMassFraction, waterMassFraction }) {
  const metal = clamp(coreMassFraction, 0, 1);
  const waterLike = clamp(waterMassFraction, 0, 0.9);
  const volatileIce = clamp(waterLike * 0.04, 0, 0.02);
  const waterIce = Math.max(0, waterLike - volatileIce);
  const carbonaceous = clamp(0.003 + waterLike * 0.01, 0, 0.02);
  const sulfur = clamp(0.002 + metal * 0.004, 0, 0.01);
  const salts = clamp(waterLike * 0.015, 0, 0.01);
  const silicate = Math.max(0, 1 - metal - waterIce - volatileIce - carbonaceous - sulfur - salts);
  return normalizedComponentFractions({
    metal,
    silicate,
    waterIce,
    volatileIce,
    carbonaceous,
    sulfur,
    salts,
  });
}

function withMinimumComponentFraction(fractions, key, minimum) {
  const target = clamp(minimum, 0, 0.9);
  const current = clamp(fractions[key], 0, 1);
  if (target <= current) return fractions;

  const next = { ...fractions };
  let delta = target - current;
  next[key] = target;
  for (const donor of ["silicate", "metal", "carbonaceous", "sulfur", "salts", "volatileIce"]) {
    if (donor === key || delta <= 0) continue;
    const available = Math.max(next[donor], 0);
    const take = Math.min(available, delta);
    next[donor] = available - take;
    delta -= take;
  }
  return normalizedComponentFractions(next);
}

function buildMoonComponentMassFractions({
  compositionClass,
  waterMassFraction,
  ammoniaMassFraction,
}) {
  const base = MOON_CLASS_COMPONENTS[compositionClass] || MOON_CLASS_COMPONENTS["Mixed rock/ice"];
  const explicitWater = toFinite(waterMassFraction, NaN);
  const explicitAmmonia = toFinite(ammoniaMassFraction, NaN);
  let fractions = normalizedComponentFractions(base);
  if (Number.isFinite(explicitWater) && explicitWater > fractions.waterIce) {
    fractions = withMinimumComponentFraction(fractions, "waterIce", explicitWater);
  }
  if (Number.isFinite(explicitAmmonia) && explicitAmmonia > 0) {
    fractions = withMinimumComponentFraction(
      fractions,
      "volatileIce",
      fractions.volatileIce + clamp(explicitAmmonia, 0, 0.5),
    );
  }
  return fractions;
}

function moonClassFromComponents(componentMassFractions, fallbackClass = "Mixed rock/ice") {
  const metal = Math.max(toFinite(componentMassFractions?.metal, 0), 0);
  const waterVolatile =
    Math.max(toFinite(componentMassFractions?.waterIce, 0), 0) +
    Math.max(toFinite(componentMassFractions?.volatileIce, 0), 0);
  if (metal >= 0.45) return "Iron-rich";
  if (waterVolatile >= 0.65) return "Very icy";
  if (waterVolatile >= 0.35) return "Icy";
  if (waterVolatile >= 0.12) return "Mixed rock/ice";
  if (fallbackClass === "Subsurface ocean" || fallbackClass === "Partially molten") {
    return fallbackClass;
  }
  return "Rocky";
}

function recomputePlanetCompositionFromComponents(
  baseComposition,
  componentMassFractions,
  options = {},
) {
  const coreMassFraction = clamp(componentMassFractions.metal || 0, 0, 1);
  const waterMassFraction = clamp(
    (componentMassFractions.waterIce || 0) + (componentMassFractions.volatileIce || 0) * 0.35,
    0,
    0.9,
  );
  const rigidityPa = calcRockyPlanetRigidityPa({
    coreMassFraction,
    waterMassFraction,
  });
  const tidalQualityFactor = calcRockyPlanetTidalQualityFactor({
    coreMassFraction,
    waterMassFraction,
  });

  return {
    ...baseComposition,
    compositionSource: options.compositionSource || baseComposition.compositionSource,
    classificationScheme: options.classificationScheme || baseComposition.classificationScheme,
    compositionClass: compositionClass(coreMassFraction, waterMassFraction),
    waterRegime: waterRegime(waterMassFraction),
    coreMassFraction,
    coreMassFractionPct: coreMassFraction * 100,
    waterMassFraction,
    waterMassFractionPct: waterMassFraction * 100,
    componentMassFractions,
    elementMassFractions: componentFractionsToElements(componentMassFractions),
    rigidityPa,
    tidalQualityFactor,
    mu: rigidityPa,
    Q: tidalQualityFactor,
  };
}

function recomputeMoonCompositionFromComponents(
  baseComposition,
  componentMassFractions,
  options = {},
) {
  const preserveOverrideClass = Boolean(options.hasCompositionOverride);
  const resolvedCompositionClass = preserveOverrideClass
    ? baseComposition.compositionClass
    : moonClassFromComponents(componentMassFractions, baseComposition.compositionClass);
  const materialProfile = preserveOverrideClass
    ? baseComposition
    : getMoonMaterialProfileByClass({ className: resolvedCompositionClass }) || baseComposition;
  const coreMassFraction = clamp(componentMassFractions.metal || 0, 0, 1);
  const waterMassFraction = clamp(componentMassFractions.waterIce || 0, 0, 1);

  return {
    ...baseComposition,
    compositionSource: options.compositionSource || baseComposition.compositionSource,
    classificationScheme: options.classificationScheme || baseComposition.classificationScheme,
    compositionClass: resolvedCompositionClass,
    coreMassFraction,
    coreMassFractionPct: coreMassFraction * 100,
    waterMassFraction,
    waterMassFractionPct: waterMassFraction * 100,
    componentMassFractions,
    elementMassFractions: componentFractionsToElements(componentMassFractions),
    rigidityPa: materialProfile.rigidityPa || materialProfile.mu,
    tidalQualityFactor: materialProfile.tidalQualityFactor || materialProfile.Q,
    mu: materialProfile.mu || materialProfile.rigidityPa,
    Q: materialProfile.Q || materialProfile.tidalQualityFactor,
  };
}

function finalizeComposition(composition, modeContext = {}, validationContext = {}) {
  const inferredComponentMassFractions =
    modeContext.inferredComponentMassFractions || composition.componentMassFractions || {};
  const inferredElementMassFractions =
    modeContext.inferredElementMassFractions ||
    componentFractionsToElements(inferredComponentMassFractions);
  const validation = validateRockyBodyInventory(
    {
      messages: modeContext.messages || [],
      normalized: modeContext.normalized,
      compositionMode: modeContext.compositionMode,
    },
    composition,
    validationContext,
  );

  return {
    ...composition,
    modelVersion: ROCKY_BODY_COMPOSITION_MODEL_VERSION,
    compositionMode: modeContext.compositionMode || "inferred",
    inferredComponentMassFractions,
    inferredElementMassFractions,
    manualElementMassFractions: modeContext.manualElementMassFractions || null,
    traceElementAbundance: modeContext.traceElementAbundance || null,
    validation,
  };
}

function applyManualCompositionMode(baseComposition, options = {}, validationContext = {}) {
  const compositionMode = normalizeCompositionMode(options.compositionMode);
  const inferredComponentMassFractions = baseComposition.componentMassFractions;
  const inferredElementMassFractions =
    baseComposition.elementMassFractions ||
    componentFractionsToElements(inferredComponentMassFractions);
  const traceElementAbundance = normalizeTraceElementAbundance(options);

  if (compositionMode === "inferred") {
    return finalizeComposition(
      baseComposition,
      {
        compositionMode,
        inferredComponentMassFractions,
        inferredElementMassFractions,
        traceElementAbundance,
      },
      validationContext,
    );
  }

  const messages = [];
  let normalized = false;
  let composition = baseComposition;

  if (compositionMode === "reservoir") {
    const componentInventory = solveManualComponentInventory(options, baseComposition);
    messages.push(...componentInventory.messages);
    normalized = normalized || componentInventory.normalized;
    composition =
      baseComposition.bodyType === "moon"
        ? recomputeMoonCompositionFromComponents(
            baseComposition,
            componentInventory.componentMassFractions,
            {
              compositionSource: "manual-reservoir",
              classificationScheme: "manual-reservoir-v1",
              hasCompositionOverride: Boolean(options.compositionOverride),
            },
          )
        : recomputePlanetCompositionFromComponents(
            baseComposition,
            componentInventory.componentMassFractions,
            {
              compositionSource: "manual-reservoir",
              classificationScheme: "manual-reservoir-v1",
            },
          );
  } else if (compositionMode === "expert-elements") {
    const structureSource =
      String(options.compositionStructureSource || "inferred").toLowerCase() === "components"
        ? "components"
        : "inferred";

    if (structureSource === "components") {
      const componentInventory = solveManualComponentInventory(options, baseComposition);
      messages.push(...componentInventory.messages);
      normalized = normalized || componentInventory.normalized;
      composition =
        baseComposition.bodyType === "moon"
          ? recomputeMoonCompositionFromComponents(
              baseComposition,
              componentInventory.componentMassFractions,
              {
                compositionSource: "manual-reservoir+elements",
                classificationScheme: "manual-reservoir-elements-v1",
                hasCompositionOverride: Boolean(options.compositionOverride),
              },
            )
          : recomputePlanetCompositionFromComponents(
              baseComposition,
              componentInventory.componentMassFractions,
              {
                compositionSource: "manual-reservoir+elements",
                classificationScheme: "manual-reservoir-elements-v1",
              },
            );
    } else {
      composition = {
        ...baseComposition,
        compositionSource: "manual-elements",
        classificationScheme: `${baseComposition.classificationScheme}+manual-elements-v1`,
      };
    }

    const elementInventory = solveManualElementInventory(options, composition);
    messages.push(...elementInventory.messages);
    normalized = normalized || elementInventory.normalized;
    composition = {
      ...composition,
      elementMassFractions: elementInventory.elementMassFractions,
    };

    return finalizeComposition(
      composition,
      {
        compositionMode,
        inferredComponentMassFractions,
        inferredElementMassFractions,
        manualElementMassFractions: elementInventory.manualElementMassFractions,
        traceElementAbundance,
        messages,
        normalized,
      },
      validationContext,
    );
  }

  return finalizeComposition(
    composition,
    {
      compositionMode,
      inferredComponentMassFractions,
      inferredElementMassFractions,
      traceElementAbundance,
      messages,
      normalized,
    },
    validationContext,
  );
}

function solvePlanetComposition({
  massEarth,
  coreMassFraction,
  waterMassFraction,
  starMetallicityFeH,
  densityGcm3,
  radiusEarth,
  observedRadiusEarth,
  compositionMode,
  compositionNormalizeMode,
  manualComponentMassFractions,
  manualComponentPct,
  manualElementMassFractions,
  manualElementPct,
  manualTraceElementAbundance,
  compositionStructureSource,
}) {
  const metallicity = toFinite(starMetallicityFeH, 0);
  const inferredCoreMassFraction = suggestedCmfFromMetallicity(metallicity);
  const cmf = Number.isFinite(Number(coreMassFraction))
    ? clamp(coreMassFraction, 0, 1)
    : inferredCoreMassFraction;
  const wmf = Number.isFinite(Number(waterMassFraction)) ? clamp(waterMassFraction, 0, 0.9) : 0;
  const resolvedCompositionClass = compositionClass(cmf, wmf);
  const resolvedWaterRegime = waterRegime(wmf);
  const resolvedDensityGcm3 = Number(densityGcm3);
  const resolvedRadiusEarth = Number(radiusEarth);
  const resolvedObservedRadiusEarth = Number(observedRadiusEarth);
  const rigidityPa = calcRockyPlanetRigidityPa({
    coreMassFraction: cmf,
    waterMassFraction: wmf,
  });
  const tidalQualityFactor = calcRockyPlanetTidalQualityFactor({
    coreMassFraction: cmf,
    waterMassFraction: wmf,
  });
  const componentMassFractions = buildPlanetComponentMassFractions({
    coreMassFraction: cmf,
    waterMassFraction: wmf,
  });

  const inferredComposition = {
    modelVersion: ROCKY_BODY_COMPOSITION_MODEL_VERSION,
    bodyType: "planet",
    compositionSource: "cmf-wmf",
    classificationScheme: "planet-cmf-wmf-v1",
    massEarth: toFinite(massEarth, null),
    compositionClass: resolvedCompositionClass,
    waterRegime: resolvedWaterRegime,
    densityGcm3: Number.isFinite(resolvedDensityGcm3) ? resolvedDensityGcm3 : null,
    radiusEarth: Number.isFinite(resolvedRadiusEarth) ? resolvedRadiusEarth : null,
    observedRadiusEarth: Number.isFinite(resolvedObservedRadiusEarth)
      ? resolvedObservedRadiusEarth
      : null,
    coreMassFraction: cmf,
    coreMassFractionPct: cmf * 100,
    waterMassFraction: wmf,
    waterMassFractionPct: wmf * 100,
    suggestedCoreMassFraction: inferredCoreMassFraction,
    suggestedCoreMassFractionPct: inferredCoreMassFraction * 100,
    componentMassFractions,
    elementMassFractions: componentFractionsToElements(componentMassFractions),
    rigidityPa,
    tidalQualityFactor,
    mu: rigidityPa,
    Q: tidalQualityFactor,
  };

  return applyManualCompositionMode(
    inferredComposition,
    {
      compositionMode,
      compositionNormalizeMode,
      manualComponentMassFractions,
      manualComponentPct,
      manualElementMassFractions,
      manualElementPct,
      manualTraceElementAbundance,
      compositionStructureSource,
    },
    {
      bodyType: "planet",
      densityGcm3,
      radiusEarth,
      observedRadiusEarth,
    },
  );
}

function solveMoonComposition({
  densityGcm3,
  radiusMoon,
  compositionOverride,
  compositionClassHint,
  differentiatedInterior,
  waterMassFraction,
  ammoniaMassFraction,
  compositionMode,
  compositionNormalizeMode,
  manualComponentMassFractions,
  manualComponentPct,
  manualElementMassFractions,
  manualElementPct,
  manualTraceElementAbundance,
  compositionStructureSource,
}) {
  const overrideProfile = compositionOverride
    ? getMoonMaterialProfileByClass({ className: compositionOverride })
    : null;
  const hasDensity = Number.isFinite(Number(densityGcm3));
  const hintProfile =
    !overrideProfile && compositionClassHint
      ? getMoonMaterialProfileByClass({ className: compositionClassHint })
      : null;
  const materialProfile =
    overrideProfile ||
    (hasDensity ? calcMoonMaterialProfileFromDensity({ densityGcm3 }) : null) ||
    hintProfile;

  if (!materialProfile) return null;

  const resolvedCompositionClass = materialProfile.compositionClass;
  const representativeDensityGcm3 = hasDensity
    ? densityGcm3
    : MOON_CLASS_DENSITY_GCM3[resolvedCompositionClass] || 2.6;
  const coreMassFraction = inferMoonCoreMassFraction({
    densityGcm3: representativeDensityGcm3,
    compositionClass: resolvedCompositionClass,
    differentiatedInterior,
  });
  const componentMassFractions = buildMoonComponentMassFractions({
    compositionClass: resolvedCompositionClass,
    waterMassFraction,
    ammoniaMassFraction,
  });

  const inferredComposition = {
    ...materialProfile,
    modelVersion: ROCKY_BODY_COMPOSITION_MODEL_VERSION,
    bodyType: "moon",
    compositionSource: overrideProfile ? "class-override" : hasDensity ? "density" : "class-hint",
    classificationScheme: overrideProfile ? "moon-class-material-v1" : "moon-density-material-v1",
    densityGcm3: representativeDensityGcm3,
    compositionClass: resolvedCompositionClass,
    coreMassFraction,
    coreMassFractionPct: coreMassFraction * 100,
    waterMassFraction: componentMassFractions.waterIce,
    waterMassFractionPct: componentMassFractions.waterIce * 100,
    componentMassFractions,
    elementMassFractions: componentFractionsToElements(componentMassFractions),
    rigidityPa: materialProfile.mu,
    tidalQualityFactor: materialProfile.Q,
  };

  return applyManualCompositionMode(
    inferredComposition,
    {
      compositionMode,
      compositionNormalizeMode,
      manualComponentMassFractions,
      manualComponentPct,
      manualElementMassFractions,
      manualElementPct,
      manualTraceElementAbundance,
      compositionStructureSource,
      compositionOverride,
    },
    {
      bodyType: "moon",
      densityGcm3: representativeDensityGcm3,
      radiusMoon,
      differentiatedInterior,
    },
  );
}

export function solveRockyBodyComposition({
  bodyType = "planet",
  massEarth,
  densityGcm3,
  radiusEarth,
  radiusMoon,
  observedRadiusEarth,
  coreMassFraction,
  waterMassFraction,
  ammoniaMassFraction,
  starMetallicityFeH,
  compositionOverride,
  compositionClassHint,
  differentiatedInterior,
  compositionMode,
  compositionNormalizeMode,
  manualComponentMassFractions,
  manualComponentPct,
  manualElementMassFractions,
  manualElementPct,
  manualTraceElementAbundance,
  compositionStructureSource,
} = {}) {
  const normalizedBodyType = String(bodyType || "planet").toLowerCase();
  if (normalizedBodyType === "moon") {
    return solveMoonComposition({
      densityGcm3,
      radiusMoon,
      compositionOverride,
      compositionClassHint,
      differentiatedInterior,
      waterMassFraction,
      ammoniaMassFraction,
      compositionMode,
      compositionNormalizeMode,
      manualComponentMassFractions,
      manualComponentPct,
      manualElementMassFractions,
      manualElementPct,
      manualTraceElementAbundance,
      compositionStructureSource,
    });
  }
  return solvePlanetComposition({
    massEarth,
    densityGcm3,
    radiusEarth,
    observedRadiusEarth,
    coreMassFraction,
    waterMassFraction,
    starMetallicityFeH,
    compositionMode,
    compositionNormalizeMode,
    manualComponentMassFractions,
    manualComponentPct,
    manualElementMassFractions,
    manualElementPct,
    manualTraceElementAbundance,
    compositionStructureSource,
  });
}
