import { clamp, toFinite } from "./utils.js";
import {
  componentFractionsToElements,
  normalizeMassFractionInput,
  ROCKY_BODY_COMPONENT_KEYS,
  ROCKY_BODY_ELEMENT_KEYS,
  solveRockyBodyComposition,
  suggestedCmfFromMetallicity,
} from "./rockyBodyComposition.js";

export const ROCKY_BODY_COMPOSITION_SUGGESTION_MODEL_VERSION =
  "rocky-body-composition-suggestions-v1";

const TRACE_DEFAULT_MIN = 0.5;
const TRACE_DEFAULT_MAX = 1.8;
const TRACE_CONTROL_MAX = 5;

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pctToFraction(value, fallback = 0) {
  const number = finiteOrNull(value);
  return number == null ? fallback : clamp(number / 100, 0, 1);
}

function roundSuggestionValue(value, places = 6) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const scale = 10 ** places;
  return Math.round(Math.max(number, 0) * scale) / scale;
}

function fractionsToPct(fractions, keys) {
  const out = {};
  for (const key of keys) out[key] = roundSuggestionValue((fractions?.[key] || 0) * 100);
  return out;
}

function normalizeComponentFractions(fractions = {}) {
  const sanitized = {};
  let total = 0;
  for (const key of ROCKY_BODY_COMPONENT_KEYS) {
    const value = Math.max(toFinite(fractions[key], 0), 0);
    sanitized[key] = value;
    total += value;
  }
  if (total <= 0) {
    return Object.fromEntries(
      ROCKY_BODY_COMPONENT_KEYS.map((key) => [key, key === "silicate" ? 1 : 0]),
    );
  }
  return Object.fromEntries(ROCKY_BODY_COMPONENT_KEYS.map((key) => [key, sanitized[key] / total]));
}

function raiseComponentMinimum(fractions, key, minimum, donorKeys = []) {
  const target = clamp(toFinite(minimum, 0), 0, 0.95);
  const next = normalizeComponentFractions(fractions);
  if (next[key] >= target) return next;

  let delta = target - next[key];
  next[key] = target;
  const donors = donorKeys.length
    ? donorKeys
    : ROCKY_BODY_COMPONENT_KEYS.filter((candidate) => candidate !== key);
  for (const donor of donors) {
    if (donor === key || delta <= 0) continue;
    const available = Math.max(next[donor] || 0, 0);
    const take = Math.min(available, delta);
    next[donor] = available - take;
    delta -= take;
  }
  return normalizeComponentFractions(next);
}

function currentMetallicityFeH(bodyInputs = {}, starContext = {}) {
  return toFinite(
    starContext.metallicityFeH ?? starContext.starMetallicityFeH ?? bodyInputs.starMetallicityFeH,
    0,
  );
}

function buildPlanetInferredComposition(bodyInputs = {}, starContext = {}) {
  const feH = currentMetallicityFeH(bodyInputs, starContext);
  const cmfPct = finiteOrNull(bodyInputs.cmfPct);
  const coreMassFraction =
    cmfPct == null || cmfPct < 0 ? suggestedCmfFromMetallicity(feH) : clamp(cmfPct / 100, 0, 1);
  const waterMassFraction = pctToFraction(bodyInputs.wmfPct, 0);
  return solveRockyBodyComposition({
    bodyType: "planet",
    massEarth: bodyInputs.massEarth,
    densityGcm3: bodyInputs.bulkDensityGcm3 ?? bodyInputs.densityGcm3,
    radiusEarth: bodyInputs.radiusEarth,
    observedRadiusEarth: bodyInputs.observedRadiusEarth ?? bodyInputs.radiusEarth,
    coreMassFraction,
    waterMassFraction,
    starMetallicityFeH: feH,
    compositionMode: "inferred",
  });
}

function buildMoonInferredComposition(bodyInputs = {}) {
  const compositionOverride = bodyInputs.compositionOverride || bodyInputs.compositionClass || null;
  const compositionClassHint =
    bodyInputs.compositionClassHint || compositionOverride || "Mixed rock/ice";
  return solveRockyBodyComposition({
    bodyType: "moon",
    densityGcm3: bodyInputs.densityGcm3,
    radiusMoon: bodyInputs.radiusMoon,
    compositionOverride,
    compositionClassHint,
    differentiatedInterior: bodyInputs.differentiatedInterior,
    waterMassFraction: pctToFraction(bodyInputs.waterMassFractionPct, 0),
    ammoniaMassFraction: pctToFraction(bodyInputs.ammoniaPct, 0),
    compositionMode: "inferred",
  });
}

function applyPlanetContextAdjustments(componentFractions, bodyInputs = {}, caveats = []) {
  let next = normalizeComponentFractions(componentFractions);
  const carbonRichness = String(bodyInputs.carbonRichness || "").toLowerCase();
  if (carbonRichness === "carbonrich") {
    next = raiseComponentMinimum(next, "carbonaceous", 0.05, ["silicate", "waterIce", "metal"]);
    caveats.push("Carbon-rich preset raised the carbonaceous reservoir as a first-order prior.");
  } else if (carbonRichness === "high") {
    next = raiseComponentMinimum(next, "carbonaceous", 0.03, ["silicate", "waterIce", "metal"]);
    caveats.push("High carbon context raised the carbonaceous reservoir as a bounded prior.");
  } else if (carbonRichness === "enhanced") {
    next = raiseComponentMinimum(next, "carbonaceous", 0.015, ["silicate", "waterIce", "metal"]);
    caveats.push("Enhanced carbon context mildly raised the carbonaceous reservoir.");
  }
  return next;
}

function applyMoonContextAdjustments(componentFractions, bodyInputs = {}, caveats = []) {
  let next = normalizeComponentFractions(componentFractions);
  const compositionText = String(
    bodyInputs.compositionOverride ||
      bodyInputs.compositionClass ||
      bodyInputs.compositionClassHint ||
      "",
  ).toLowerCase();
  const salinityPct = clamp(toFinite(bodyInputs.salinityPct, 0), 0, 100);
  const ammoniaPct = clamp(toFinite(bodyInputs.ammoniaPct, 0), 0, 100);
  const waterPct = clamp(toFinite(bodyInputs.waterMassFractionPct, 0), 0, 90);
  const so2Pct = clamp(toFinite(bodyInputs.so2Pct, 0), 0, 100);

  if (salinityPct > 0 && (next.waterIce > 0.01 || waterPct > 0)) {
    const waterLike = Math.max(next.waterIce, waterPct / 100);
    next = raiseComponentMinimum(
      next,
      "salts",
      clamp(waterLike * (salinityPct / 100), 0.002, 0.2),
      ["silicate", "waterIce", "metal"],
    );
    caveats.push("Moon salinity was translated into a bounded salt-reservoir prior.");
  }

  if (ammoniaPct > 0) {
    next = raiseComponentMinimum(
      next,
      "volatileIce",
      clamp(next.volatileIce + ammoniaPct / 100, 0, 0.45),
      ["waterIce", "silicate", "metal"],
    );
    caveats.push("Ammonia input was treated as volatile ice inventory, not as water ice.");
  }

  if (compositionText.includes("subsurface ocean")) {
    next = raiseComponentMinimum(next, "salts", 0.04, ["silicate", "waterIce", "metal"]);
  }

  if (compositionText.includes("partially molten") || so2Pct > 0) {
    next = raiseComponentMinimum(next, "sulfur", 0.04, ["silicate", "metal", "carbonaceous"]);
    caveats.push(
      "Sulfur was raised from volcanic or sulfur-atmosphere context, not density alone.",
    );
  }

  return next;
}

function buildTraceSuggestion(bodyInputs = {}, starContext = {}, parentContext = {}, caveats = []) {
  const radioMode = String(bodyInputs.radioisotopeMode || "").toLowerCase();
  const u238 = finiteOrNull(bodyInputs.u238Abundance);
  const u235 = finiteOrNull(bodyInputs.u235Abundance);
  const th232 = finiteOrNull(bodyInputs.th232Abundance);
  const k40 = finiteOrNull(bodyInputs.k40Abundance);
  if (radioMode === "advanced" && [u238, u235, th232, k40].some((value) => value != null)) {
    const uranium =
      u238 != null && u235 != null ? (u238 * 0.39 + u235 * 0.04) / 0.43 : (u238 ?? u235 ?? 1);
    return {
      potassium: roundSuggestionValue(clamp(k40 ?? 1, 0, TRACE_CONTROL_MAX)),
      uranium: roundSuggestionValue(clamp(uranium, 0, TRACE_CONTROL_MAX)),
      thorium: roundSuggestionValue(clamp(th232 ?? 1, 0, TRACE_CONTROL_MAX)),
    };
  }

  const simple =
    finiteOrNull(bodyInputs.radioisotopeAbundance) ??
    finiteOrNull(parentContext.radioisotopeAbundance) ??
    null;
  if (simple != null && simple > 0) {
    const bounded = roundSuggestionValue(clamp(simple, 0, TRACE_CONTROL_MAX));
    return {
      potassium: bounded,
      uranium: bounded,
      thorium: bounded,
    };
  }

  const feH = currentMetallicityFeH(bodyInputs, starContext);
  const metallicityScale = roundSuggestionValue(
    clamp(10 ** feH, TRACE_DEFAULT_MIN, TRACE_DEFAULT_MAX),
  );
  if (Math.abs(metallicityScale - 1) > 0.05) {
    caveats.push(
      "[Fe/H] weakly adjusted trace heat defaults; it is not a direct K/U/Th abundance.",
    );
  }
  return {
    potassium: metallicityScale,
    uranium: metallicityScale,
    thorium: metallicityScale,
  };
}

function stableSignaturePayload({
  bodyType,
  bodyInputs = {},
  starContext = {},
  parentContext = {},
}) {
  const keyList =
    bodyType === "moon"
      ? [
          "massMoon",
          "densityGcm3",
          "radiusMoon",
          "compositionOverride",
          "compositionClass",
          "compositionClassHint",
          "differentiatedInterior",
          "waterMassFractionPct",
          "salinityPct",
          "ammoniaPct",
          "so2Pct",
          "radioisotopeMode",
          "radioisotopeAbundance",
          "u238Abundance",
          "u235Abundance",
          "th232Abundance",
          "k40Abundance",
        ]
      : [
          "massEarth",
          "cmfPct",
          "wmfPct",
          "bulkDensityGcm3",
          "densityGcm3",
          "radiusEarth",
          "observedRadiusEarth",
          "carbonRichness",
          "radioisotopeMode",
          "radioisotopeAbundance",
          "u238Abundance",
          "u235Abundance",
          "th232Abundance",
          "k40Abundance",
        ];

  const payload = { bodyType, starMetallicityFeH: currentMetallicityFeH(bodyInputs, starContext) };
  for (const key of keyList) {
    const value = bodyInputs[key];
    if (value === undefined) continue;
    payload[key] = Number.isFinite(Number(value)) ? roundSuggestionValue(Number(value), 5) : value;
  }
  if (parentContext.parentType) payload.parentType = parentContext.parentType;
  return payload;
}

function buildBodySignature(args) {
  return JSON.stringify(stableSignaturePayload(args));
}

export function elementPctFromComponentPct(componentPct = {}) {
  const normalized = normalizeMassFractionInput(componentPct, ROCKY_BODY_COMPONENT_KEYS, {
    normalizeMode: "normalize",
    inputUnit: "percent",
    label: "suggested component inventory",
  });
  const elements = componentFractionsToElements(normalized.fractions);
  return fractionsToPct(elements, ROCKY_BODY_ELEMENT_KEYS);
}

export function buildCompositionSuggestionPatch(suggestion, { applyMode = "replace-all" } = {}) {
  if (!suggestion) return {};
  const patch = {
    compositionMode: "expert-elements",
    compositionNormalizeMode: "normalize",
    compositionStructureSource: "components",
    manualComponentPct: { ...(suggestion.componentPct || {}) },
    manualElementPct: { ...(suggestion.elementPct || {}) },
    manualTraceElementAbundance: { ...(suggestion.traceElementAbundance || {}) },
    compositionSuggestionMeta: {
      modelVersion: suggestion.modelVersion,
      source: suggestion.source,
      confidence: suggestion.confidence,
      bodySignature: suggestion.bodySignature,
      caveats: Array.isArray(suggestion.caveats) ? suggestion.caveats.slice(0, 6) : [],
    },
  };
  if (applyMode === "fill-empty") patch.__compositionApplyMode = "fill-empty";
  return patch;
}

export function suggestRockyBodyCompositionInventory({
  bodyType = "planet",
  bodyInputs = {},
  starContext = {},
  parentContext = {},
} = {}) {
  const normalizedBodyType =
    String(bodyType || "planet").toLowerCase() === "moon" ? "moon" : "planet";
  const caveats = [];
  const inferred =
    normalizedBodyType === "moon"
      ? buildMoonInferredComposition(bodyInputs)
      : buildPlanetInferredComposition(bodyInputs, starContext);
  const baseComponents = inferred?.componentMassFractions || {};
  let componentFractions =
    normalizedBodyType === "moon"
      ? applyMoonContextAdjustments(baseComponents, bodyInputs, caveats)
      : applyPlanetContextAdjustments(baseComponents, bodyInputs, caveats);

  if (!inferred) {
    componentFractions = normalizeComponentFractions(componentFractions);
    caveats.push("Low-information body used a generic rocky/icy fallback inventory.");
  }

  const componentPct = fractionsToPct(componentFractions, ROCKY_BODY_COMPONENT_KEYS);
  const elementPct = elementPctFromComponentPct(componentPct);
  const traceElementAbundance = buildTraceSuggestion(
    bodyInputs,
    starContext,
    parentContext,
    caveats,
  );
  const bodySignature = buildBodySignature({
    bodyType: normalizedBodyType,
    bodyInputs,
    starContext,
    parentContext,
  });

  const confidence =
    inferred && normalizedBodyType === "planet"
      ? "high"
      : inferred && (bodyInputs.densityGcm3 || bodyInputs.compositionOverride)
        ? "medium"
        : "low";

  return {
    modelVersion: ROCKY_BODY_COMPOSITION_SUGGESTION_MODEL_VERSION,
    source: "current-inferred-solver",
    confidence,
    componentPct,
    elementPct,
    traceElementAbundance,
    sourceSummary:
      normalizedBodyType === "moon"
        ? "Seeded from moon density/class, volatile inventory, salinity, ammonia, radiogenic controls, and host metallicity where available."
        : "Seeded from current mass, CMF, WMF, carbon context, radiogenic controls, and host metallicity where available.",
    caveats,
    bodySignature,
  };
}
