import { suggestRockyBodyCompositionInventory } from "../../engine/rockyBodyCompositionSuggestions.js";
import { fmt } from "../../engine/utils.js";
import {
  COMPOSITION_COMPONENT_FIELDS,
  COMPOSITION_ELEMENT_FIELDS,
  formatCompositionFractionSummary,
  formatCompositionModeLabel,
  formatCompositionSourceLabel,
  formatCompositionValidationMessages,
  formatCompositionValidationStatus,
} from "../compositionEditor.js";

export function formatCompositionPctValue(value, dp = 1) {
  return Number.isFinite(Number(value)) ? `${fmt(Number(value), dp)}%` : "Not evaluated";
}

export function buildRockyCompositionOutputModel({
  derived = {},
  display = {},
  inputs = {},
  planetInputs = {},
} = {}) {
  const rockyComposition = derived.rockyBodyComposition || {};
  const compositionValidation =
    rockyComposition.validation || derived.compositionValidation || null;
  const compositionMode =
    rockyComposition.compositionMode ||
    derived.compositionMode ||
    planetInputs.compositionMode ||
    "inferred";
  const effectiveCmfPct = Number(
    derived.effectiveCoreMassFractionPct ?? rockyComposition.coreMassFractionPct ?? inputs.cmfPct,
  );
  const effectiveWmfPct = Number(
    derived.effectiveWaterMassFractionPct ?? rockyComposition.waterMassFractionPct ?? inputs.wmfPct,
  );
  const authoredCmfPct = Number(inputs.cmfPct);
  const authoredWmfPct = Number(inputs.wmfPct);
  const componentSummary = formatCompositionFractionSummary(
    rockyComposition.componentMassFractions || derived.componentMassFractions,
    COMPOSITION_COMPONENT_FIELDS,
  );
  const elementSummary = formatCompositionFractionSummary(
    rockyComposition.elementMassFractions || derived.elementMassFractions,
    COMPOSITION_ELEMENT_FIELDS,
    { limit: 6 },
  );
  const rigidityPa = Number(
    rockyComposition.rigidityPa ?? rockyComposition.mu ?? derived.rigidityPa,
  );
  const tidalQ = Number(
    rockyComposition.tidalQualityFactor ?? rockyComposition.Q ?? derived.tidalQualityFactor,
  );
  const materialResponse = [
    Number.isFinite(rigidityPa) && rigidityPa > 0
      ? `mu ${fmt(rigidityPa / 1e9, rigidityPa < 1e9 ? 2 : 1)} GPa`
      : "",
    Number.isFinite(tidalQ) && tidalQ > 0 ? `Q ${fmt(tidalQ, 0)}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  const compositionInputMeta = [
    Number.isFinite(authoredCmfPct)
      ? `input CMF ${fmt(authoredCmfPct, 1)}%${derived.cmfIsAuto ? " (auto)" : ""}`
      : "",
    Number.isFinite(authoredWmfPct) ? `input WMF ${fmt(authoredWmfPct, 2)}%` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  const compositionItems = [
    {
      label: "Composition Mode",
      value: formatCompositionModeLabel(compositionMode),
      meta: formatCompositionSourceLabel(rockyComposition.compositionSource),
    },
    {
      label: "Effective CMF",
      value: formatCompositionPctValue(effectiveCmfPct, 1),
      meta: compositionInputMeta,
    },
    {
      label: "Effective WMF",
      value: formatCompositionPctValue(effectiveWmfPct, 2),
      meta: `Water regime ${display.waterRegime || "not evaluated"}`,
    },
    { label: "Bulk Mix", value: componentSummary },
    { label: "Element Mix", value: elementSummary },
    {
      label: "Validation",
      value: formatCompositionValidationStatus(compositionValidation),
      meta: formatCompositionValidationMessages(compositionValidation),
    },
    {
      label: "Material Response",
      value: materialResponse || "Not evaluated",
      meta: rockyComposition.classificationScheme || "",
    },
  ];

  return {
    compositionInputMeta,
    compositionItems,
    compositionValidation,
    effectiveCmfPct,
    effectiveWmfPct,
  };
}

function readNumberForSeed(root, selector, fallback = null) {
  const raw = String(root?.querySelector(selector)?.value ?? "").trim();
  if (!raw) return fallback;
  const number = Number(raw);
  return Number.isFinite(number) ? number : fallback;
}

function firstFiniteForSeed(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function readModeForSeed(root, name, fallback) {
  return root?.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
}

export function buildRockyCompositionSuggestionFromForm({
  bodyInputsEl,
  cmfIsAuto = false,
  planetInputs = {},
  solveContext = {},
  world = {},
} = {}) {
  const p = planetInputs || {};
  return suggestRockyBodyCompositionInventory({
    bodyType: "planet",
    bodyInputs: {
      ...p,
      massEarth: readNumberForSeed(bodyInputsEl, "#mass", p.massEarth),
      cmfPct: cmfIsAuto ? -1 : readNumberForSeed(bodyInputsEl, "#cmf", p.cmfPct),
      wmfPct: readNumberForSeed(bodyInputsEl, "#wmf", p.wmfPct),
      bulkDensityGcm3: readNumberForSeed(bodyInputsEl, "#bulkDensityGcm3", p.bulkDensityGcm3),
      radiusEarth: readNumberForSeed(bodyInputsEl, "#observedRadius", p.radiusEarth),
      carbonRichness: bodyInputsEl?.querySelector("#carbonRichness")?.value || p.carbonRichness,
      radioisotopeMode: readModeForSeed(bodyInputsEl, "isoMode", p.radioisotopeMode || "simple"),
      radioisotopeAbundance: readNumberForSeed(
        bodyInputsEl,
        "#isoAbundance",
        p.radioisotopeAbundance,
      ),
      u238Abundance: readNumberForSeed(bodyInputsEl, "#isoU238", p.u238Abundance),
      u235Abundance: readNumberForSeed(bodyInputsEl, "#isoU235", p.u235Abundance),
      th232Abundance: readNumberForSeed(bodyInputsEl, "#isoTh232", p.th232Abundance),
      k40Abundance: readNumberForSeed(bodyInputsEl, "#isoK40", p.k40Abundance),
    },
    starContext: {
      metallicityFeH: firstFiniteForSeed(
        solveContext?.starConfig?.metallicityFeH,
        world?.star?.metallicityFeH,
        0,
      ),
    },
  });
}
