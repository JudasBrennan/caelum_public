import {
  ROCKY_BODY_COMPONENT_KEYS,
  ROCKY_BODY_ELEMENT_KEYS,
  ROCKY_BODY_TRACE_ELEMENT_KEYS,
} from "../engine/rockyBodyComposition.js";
import {
  buildCompositionSuggestionPatch,
  elementPctFromComponentPct,
} from "../engine/rockyBodyCompositionSuggestions.js";
import { fmt } from "../engine/utils.js";
import { createElement, replaceChildren } from "./domHelpers.js";
import { tipIconNode } from "./tooltip.js";
import { structuredTip } from "./tooltipCopy.js";

export const COMPOSITION_COMPONENT_FIELDS = Object.freeze(
  [
    [
      "metal",
      "Metal core",
      "Metal",
      structuredTip({
        overview: "Fe/Ni metal and sulfide core inventory.",
        feedsInto:
          "Core mass fraction, density, differentiation, dynamo context, and solid-body response.",
        caveat:
          "Reservoir percentages are bulk composition controls, not a mineral-phase equilibrium solve.",
        references: "See Science & Maths: rocky body composition and solid-body structure.",
      }),
    ],
    [
      "silicate",
      "Silicate mantle",
      "Silicate",
      structuredTip({
        overview: "Rock-forming silicate mantle inventory.",
        feedsInto:
          "Mantle fraction, density, thermal response, tectonic/geology context, and material response.",
        caveat: "Composition is bulk reservoir mass, not detailed mantle mineralogy.",
        references: "See Science & Maths: rocky body composition and solid-body structure.",
      }),
    ],
    [
      "waterIce",
      "H2O inventory",
      "H2O",
      structuredTip({
        overview: "Water inventory across ice, liquid water, and hydrated reservoirs.",
        feedsInto:
          "Water mass fraction, ocean/ice context, density, and high-pressure ice interpretation.",
        caveat:
          "Phase partitioning is solved downstream from environment; this field is a bulk reservoir input.",
        references: "See Science & Maths: hydrosphere and water inventory.",
      }),
    ],
    ["volatileIce", "Volatile ice", "Volatile", "CO2, CO, N2, CH4, NH3, and related ices."],
    [
      "carbonaceous",
      "Carbonaceous",
      "Carbon",
      structuredTip({
        overview: "Organics, graphite, carbonates, and carbon-rich solids.",
        feedsInto: "Bulk density, volatile budget, and carbonaceous composition diagnostics.",
        caveat: "Chemistry is reservoir-level; individual organic species are not simulated.",
        references: "See Science & Maths: rocky body composition.",
      }),
    ],
    [
      "sulfur",
      "Sulfur/sulfides",
      "Sulfur",
      structuredTip({
        overview: "Elemental sulfur, sulfides, and sulfate-bearing solids.",
        feedsInto: "Bulk composition, density, and volatile/mineral reservoir diagnostics.",
        caveat: "Oxidation state and detailed geochemistry are not solved.",
        references: "See Science & Maths: rocky body composition.",
      }),
    ],
    [
      "salts",
      "Salts",
      "Salts",
      structuredTip({
        overview: "Evaporites and dissolved/solid salt reservoirs.",
        feedsInto:
          "Bulk composition, water-reservoir interpretation, and surface/ocean chemistry context.",
        caveat: "Specific brine chemistry is not fully simulated.",
        references: "See Science & Maths: rocky body composition and ocean chemistry.",
      }),
    ],
  ]
    .filter(([key]) => ROCKY_BODY_COMPONENT_KEYS.includes(key))
    .map(([key, label, shortLabel, tip]) => ({ key, label, shortLabel, tip })),
);

export const COMPOSITION_ELEMENT_FIELDS = Object.freeze(
  [
    ["iron", "Iron", "Fe"],
    ["nickel", "Nickel", "Ni"],
    ["magnesium", "Magnesium", "Mg"],
    ["silicon", "Silicon", "Si"],
    ["oxygen", "Oxygen", "O"],
    ["hydrogen", "Hydrogen", "H"],
    ["carbon", "Carbon", "C"],
    ["nitrogen", "Nitrogen", "N"],
    ["sulfur", "Sulfur", "S"],
    ["sodium", "Sodium", "Na"],
    ["chlorine", "Chlorine", "Cl"],
    ["aluminium", "Aluminium", "Al"],
    ["calcium", "Calcium", "Ca"],
  ]
    .filter(([key]) => ROCKY_BODY_ELEMENT_KEYS.includes(key))
    .map(([key, label, shortLabel]) => ({
      key,
      label,
      shortLabel,
      tip: structuredTip({
        overview: `${label} mass fraction in the explicit element inventory.`,
        feedsInto:
          "Bulk composition checks, reservoir conversion, structure context, and downstream material diagnostics.",
        caveat:
          "Element mode is an expert inventory and does not solve complete mineral equilibrium.",
        references: "See Science & Maths: rocky body composition.",
      }),
    })),
);

export const COMPOSITION_TRACE_FIELDS = Object.freeze(
  [
    ["potassium", "Potassium", "K"],
    ["uranium", "Uranium", "U"],
    ["thorium", "Thorium", "Th"],
  ]
    .filter(([key]) => ROCKY_BODY_TRACE_ELEMENT_KEYS.includes(key))
    .map(([key, label, shortLabel]) => ({
      key,
      label,
      shortLabel,
      tip: structuredTip({
        overview: `${label} abundance relative to the reference radiogenic inventory.`,
        feedsInto:
          "Radiogenic heating, thermal evolution context, geology state, and solid-body response.",
        caveat:
          "Abundance scales heat production; isotope decay chains and crustal concentration are simplified.",
        references: "See Science & Maths: radiogenic heating.",
      }),
    })),
);

const MODE_OPTIONS = Object.freeze([
  { value: "inferred", label: "Inferred" },
  { value: "reservoir", label: "Reservoir" },
  { value: "expert-elements", label: "Elements" },
]);

const NORMALIZE_OPTIONS = Object.freeze([
  { value: "warn", label: "Warn" },
  { value: "normalize", label: "Normalize" },
]);

const STRUCTURE_OPTIONS = Object.freeze([
  { value: "inferred", label: "Inferred" },
  { value: "components", label: "Components" },
]);

function normalizeCompositionMode(mode) {
  const value = String(mode || "inferred").toLowerCase();
  if (value === "reservoir" || value === "expert-elements") return value;
  return "inferred";
}

function normalizeMode(mode) {
  return String(mode || "warn").toLowerCase() === "normalize" ? "normalize" : "warn";
}

function normalizeStructureSource(source) {
  return String(source || "inferred").toLowerCase() === "components" ? "components" : "inferred";
}

function pctValue(values = {}, pctKey, fractionKey, key) {
  const pct = values?.[pctKey]?.[key];
  if (pct !== null && pct !== undefined && pct !== "" && Number.isFinite(Number(pct))) {
    return formatInputNumber(Number(pct));
  }
  const fraction = values?.[fractionKey]?.[key];
  if (
    fraction !== null &&
    fraction !== undefined &&
    fraction !== "" &&
    Number.isFinite(Number(fraction))
  ) {
    return formatInputNumber(Number(fraction) * 100);
  }
  return "";
}

function abundanceValue(values = {}, key) {
  const value = values?.manualTraceElementAbundance?.[key];
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) {
    return "";
  }
  return formatInputNumber(Number(value));
}

function formatInputNumber(value) {
  if (!Number.isFinite(Number(value))) return "";
  const rounded = Math.round(Number(value) * 1000000) / 1000000;
  return String(rounded);
}

function createLabel(text, tip = "") {
  return createElement("div", { className: "label composition-editor__label" }, [
    text,
    tip ? " " : "",
    tipIconNode(tip),
  ]);
}

function createSegmentedControl({ className, name, idPrefix, options, selectedValue }) {
  return createElement(
    "div",
    {
      className,
    },
    [
      ...options.flatMap((option) => {
        const id = `${idPrefix}-${option.value}`;
        return [
          createElement("input", {
            attrs: {
              type: "radio",
              name,
              id,
              value: option.value,
            },
            checked: option.value === selectedValue,
          }),
          createElement("label", { attrs: { for: id }, text: option.label }),
        ];
      }),
      createElement("span"),
    ],
  );
}

function createModeControl(values, idPrefix) {
  const selectedValue = normalizeCompositionMode(values.compositionMode);
  return createElement("div", { className: "composition-editor__control" }, [
    createLabel(
      "Composition Mode",
      structuredTip({
        overview: "Choose how bulk composition is authored.",
        changes:
          "Inferred uses solver defaults, reservoir edits broad material groups, and Elements edits an expert element inventory.",
        feedsInto:
          "Density, CMF/WMF, internal heat, geology, material response, and derived composition outputs.",
        caveat:
          "Changing mode can make previous manual entries inactive until that mode is selected again.",
        references: "See Science & Maths: rocky body composition.",
      }),
    ),
    createSegmentedControl({
      className: "physics-trio-toggle composition-editor__mode",
      name: `${idPrefix}-composition-mode`,
      idPrefix: `${idPrefix}-mode`,
      options: MODE_OPTIONS,
      selectedValue,
    }),
  ]);
}

function createNormalizeControl(values, idPrefix) {
  const selectedValue = normalizeMode(values.compositionNormalizeMode);
  return createElement("div", { className: "composition-editor__control" }, [
    createLabel(
      "Total Handling",
      structuredTip({
        overview: "Controls how manual composition totals are handled.",
        changes:
          "Warn preserves authored percentages; Normalize rescales manual percentages to 100%.",
        feedsInto: "Composition validation and downstream structure calculations.",
        caveat: "Normalizing can hide intentionally under/over-specified draft inventories.",
      }),
    ),
    createSegmentedControl({
      className: "physics-duo-toggle",
      name: `${idPrefix}-composition-normalize-mode`,
      idPrefix: `${idPrefix}-normalize`,
      options: NORMALIZE_OPTIONS,
      selectedValue,
    }),
  ]);
}

function createStructureControl(values, idPrefix) {
  const selectedValue = normalizeStructureSource(values.compositionStructureSource);
  return createElement(
    "div",
    {
      className: "composition-editor__control",
      dataset: { compositionSection: "structure-source" },
    },
    [
      createLabel(
        "Structure",
        structuredTip({
          overview: "Choose which composition source drives structure outputs.",
          changes: "Inferred uses solver structure; Components uses the manual reservoir grid.",
          feedsInto: "Core/mantle/water fractions, density, geology, and solid-body response.",
          caveat:
            "Manual reservoir structure is still interpreted by the app's simplified material model.",
          references: "See Science & Maths: solid-body structure.",
        }),
      ),
      createSegmentedControl({
        className: "physics-duo-toggle",
        name: `${idPrefix}-composition-structure-source`,
        idPrefix: `${idPrefix}-structure`,
        options: STRUCTURE_OPTIONS,
        selectedValue,
      }),
    ],
  );
}

function formatSuggestionStatus(values = {}, suggestionStatus = null) {
  if (suggestionStatus?.message) return String(suggestionStatus.message);
  const meta = values.compositionSuggestionMeta;
  if (!meta || typeof meta !== "object") return "";
  if (suggestionStatus?.stale) return "Suggested values may be stale after recent body changes.";
  const source =
    meta.source === "current-inferred-solver" ? "current solver" : meta.source || "solver";
  return `Seeded from ${source}.`;
}

function createNumberField({ field, idPrefix, group, value, unit = "%" }) {
  const inputId = `${idPrefix}-${group}-${field.key}`;
  return createElement("div", { className: "composition-field" }, [
    createElement(
      "label",
      {
        className: "composition-field__label",
        attrs: { for: inputId },
      },
      [
        createElement("span", { text: field.shortLabel || field.label }),
        tipIconNode(field.tip || ""),
      ],
    ),
    createElement("div", { className: "composition-field__input-wrap" }, [
      createElement("input", {
        attrs: {
          id: inputId,
          type: "number",
          inputmode: "decimal",
          step: group === "manualTraceElementAbundance" ? "0.01" : "0.001",
          min: "0",
          max: group === "manualTraceElementAbundance" ? null : "100",
          value,
          "aria-label": field.label,
        },
        dataset: {
          compositionGroup: group,
          compositionKey: field.key,
          compositionPath: `${group}.${field.key}`,
        },
      }),
      createElement("span", { className: "composition-field__unit", text: unit }),
    ]),
  ]);
}

function createFieldGrid({ title, fields, values, idPrefix, group, unit, attrs = {} }) {
  return createElement(
    "section",
    {
      className: "composition-editor__group",
      attrs,
    },
    [
      createElement("div", { className: "composition-editor__group-title", text: title }),
      createElement(
        "div",
        { className: "composition-grid" },
        fields.map((field) =>
          createNumberField({
            field,
            idPrefix,
            group,
            unit,
            value:
              group === "manualComponentPct"
                ? pctValue(values, "manualComponentPct", "manualComponentMassFractions", field.key)
                : group === "manualElementPct"
                  ? pctValue(values, "manualElementPct", "manualElementMassFractions", field.key)
                  : abundanceValue(values, field.key),
          }),
        ),
      ),
    ],
  );
}

function createSeedTools(values, suggestionStatus) {
  const statusText = formatSuggestionStatus(values, suggestionStatus);
  return createElement("div", { className: "composition-editor__seed-tools" }, [
    createElement("div", { className: "composition-editor__seed-actions" }, [
      createElement("button", {
        className: "small composition-editor__seed-button",
        attrs: { type: "button" },
        dataset: { compositionSeedButton: "1" },
        text: "Seed sensible values",
      }),
      createElement(
        "div",
        {
          className: "composition-editor__seed-choice",
          attrs: { hidden: "hidden" },
          dataset: { compositionSeedChoice: "1" },
        },
        [
          createElement("button", {
            className: "small",
            attrs: { type: "button" },
            dataset: { compositionSeedApply: "fill-empty" },
            text: "Fill empty only",
          }),
          createElement("button", {
            className: "small",
            attrs: { type: "button" },
            dataset: { compositionSeedApply: "replace-all" },
            text: "Replace all",
          }),
        ],
      ),
    ]),
    createElement("div", {
      className: "composition-editor__seed-status",
      dataset: {
        compositionSeedStatus: "1",
        stale: suggestionStatus?.stale ? "1" : "0",
      },
      text: statusText,
    }),
  ]);
}

function createElementSyncTools() {
  return createElement(
    "div",
    {
      className: "composition-editor__element-tools",
      attrs: { "data-composition-section": "elements" },
    },
    [
      createElement("button", {
        className: "small composition-editor__sync-elements-button",
        attrs: { type: "button" },
        dataset: { compositionSyncElementsButton: "1" },
        text: "Sync elements from reservoirs",
      }),
    ],
  );
}

export function formatCompositionModeLabel(mode) {
  switch (normalizeCompositionMode(mode)) {
    case "reservoir":
      return "Manual Reservoir";
    case "expert-elements":
      return "Expert Elements";
    default:
      return "Inferred";
  }
}

export function formatCompositionSourceLabel(source) {
  switch (String(source || "")) {
    case "class-override":
      return "Composition override";
    case "density":
      return "Density-derived";
    case "class-hint":
      return "Class hint";
    case "cmf-wmf":
      return "Core/water fractions";
    case "manual-reservoir":
      return "Manual reservoir";
    case "manual-elements":
      return "Manual elements";
    case "manual-reservoir+elements":
      return "Manual reservoir + elements";
    default:
      return source ? String(source) : "Not evaluated";
  }
}

export function formatCompositionValidationStatus(validation) {
  switch (String(validation?.status || "").toLowerCase()) {
    case "ok":
      return "OK";
    case "caution":
      return "Caution";
    case "invalid":
      return "Invalid";
    default:
      return "Not evaluated";
  }
}

export function formatCompositionValidationMessages(validation) {
  const messages = Array.isArray(validation?.messages) ? validation.messages : [];
  if (!messages.length) {
    return validation?.status ? "No composition warnings." : "";
  }
  return messages
    .map((message) => String(message?.message || "").trim())
    .filter(Boolean)
    .join("\n");
}

export function formatFractionPct(value, dp = 1) {
  const fraction = Number(value);
  if (!Number.isFinite(fraction)) return "";
  return `${fmt(fraction * 100, dp)}%`;
}

export function formatCompositionFractionSummary(
  fractions,
  fields,
  { limit = 4, minFraction = 0.0005 } = {},
) {
  const entries = (fields || [])
    .map((field) => ({
      key: field.key,
      label: field.shortLabel || field.label,
      fraction: Number(fractions?.[field.key]),
    }))
    .filter((entry) => Number.isFinite(entry.fraction) && entry.fraction >= minFraction)
    .sort((a, b) => b.fraction - a.fraction);

  if (!entries.length) return "Not evaluated";

  return entries
    .slice(0, limit)
    .map((entry) => `${entry.label} ${formatFractionPct(entry.fraction)}`)
    .join(" | ");
}

function renderValidationNode(validation) {
  const status = formatCompositionValidationStatus(validation);
  const messages = Array.isArray(validation?.messages) ? validation.messages : [];
  return [
    createElement("div", { className: "composition-editor__validation-status" }, [
      createElement("strong", { text: status }),
      validation?.normalized ? createElement("span", { text: " normalized" }) : null,
    ]),
    messages.length
      ? createElement(
          "ul",
          { className: "composition-editor__validation-list" },
          messages
            .map((message) => String(message?.message || "").trim())
            .filter(Boolean)
            .slice(0, 4)
            .map((message) => createElement("li", { text: message })),
        )
      : null,
  ];
}

export function renderCompositionEditor({
  values = {},
  bodyType = "planet",
  idPrefix = "composition",
  validation = null,
  suggestionStatus = null,
} = {}) {
  const node = createElement(
    "div",
    {
      className: "composition-editor",
      dataset: {
        compositionEditor: bodyType,
      },
    },
    [
      createModeControl(values, idPrefix),
      createSeedTools(values, suggestionStatus),
      createElement(
        "div",
        {
          className: "composition-editor__manual-tools",
          dataset: { compositionSection: "manual-tools" },
        },
        [
          createElement("div", { className: "composition-editor__tool-toggles" }, [
            createNormalizeControl(values, idPrefix),
            createStructureControl(values, idPrefix),
          ]),
          createElement("button", {
            className: "small composition-editor__normalize-button",
            attrs: { type: "button" },
            dataset: { compositionNormalizeButton: "1" },
            text: "Normalize",
          }),
        ],
      ),
      createFieldGrid({
        title: "Reservoirs",
        fields: COMPOSITION_COMPONENT_FIELDS,
        values,
        idPrefix,
        group: "manualComponentPct",
        unit: "%",
        attrs: { "data-composition-section": "reservoir" },
      }),
      createFieldGrid({
        title: "Elements",
        fields: COMPOSITION_ELEMENT_FIELDS,
        values,
        idPrefix,
        group: "manualElementPct",
        unit: "%",
        attrs: { "data-composition-section": "elements" },
      }),
      createElementSyncTools(),
      createFieldGrid({
        title: "Trace Heat Inventory",
        fields: COMPOSITION_TRACE_FIELDS,
        values,
        idPrefix,
        group: "manualTraceElementAbundance",
        unit: "x",
        attrs: { "data-composition-section": "trace" },
      }),
      createElement(
        "div",
        {
          className: "composition-editor__validation",
          dataset: {
            compositionValidation: "1",
            status: String(validation?.status || "pending"),
          },
        },
        renderValidationNode(validation),
      ),
    ],
  );
  syncCompositionEditorVisibility(node);
  return node;
}

function readRadioValue(root, nameSuffix, fallback) {
  return root.querySelector(`input[name$="${nameSuffix}"]:checked`)?.value || fallback;
}

function readNumberValue(input) {
  const raw = String(input?.value || "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function collectGroup(root, group, fields) {
  const result = {};
  for (const field of fields) {
    const input = root.querySelector(
      `[data-composition-group="${group}"][data-composition-key="${field.key}"]`,
    );
    result[field.key] = readNumberValue(input);
  }
  return result;
}

function getGroupFields(group) {
  if (group === "manualComponentPct") return COMPOSITION_COMPONENT_FIELDS;
  if (group === "manualElementPct") return COMPOSITION_ELEMENT_FIELDS;
  if (group === "manualTraceElementAbundance") return COMPOSITION_TRACE_FIELDS;
  return [];
}

function getGroupInput(root, group, key) {
  return root.querySelector(`[data-composition-group="${group}"][data-composition-key="${key}"]`);
}

function hasFilledInput(input) {
  return String(input?.value || "").trim() !== "";
}

function hasAnyCompositionValues(root) {
  return Array.from(root.querySelectorAll("[data-composition-group]")).some(hasFilledInput);
}

function hasAnyReservoirValues(root) {
  return Array.from(root.querySelectorAll('[data-composition-group="manualComponentPct"]')).some(
    hasFilledInput,
  );
}

function setRadioValue(root, nameSuffix, value) {
  if (!value) return;
  root.querySelectorAll(`input[name$="${nameSuffix}"]`).forEach((input) => {
    input.checked = input.value === value;
  });
}

function setGroupValues(root, group, values = {}, { applyMode = "replace-all" } = {}) {
  for (const field of getGroupFields(group)) {
    const input = getGroupInput(root, group, field.key);
    if (!input) continue;
    if (applyMode === "fill-empty" && hasFilledInput(input)) continue;
    const value = values[field.key];
    input.value =
      value === null || value === undefined || value === "" || !Number.isFinite(Number(value))
        ? ""
        : formatInputNumber(Number(value));
  }
}

function applyCompositionPatchToEditor(root, patch = {}, { applyMode = "replace-all" } = {}) {
  if (!root || !patch) return;
  if (patch.compositionMode) setRadioValue(root, "composition-mode", patch.compositionMode);
  if (patch.compositionNormalizeMode) {
    setRadioValue(root, "composition-normalize-mode", patch.compositionNormalizeMode);
  }
  if (patch.compositionStructureSource) {
    setRadioValue(root, "composition-structure-source", patch.compositionStructureSource);
  }
  if (patch.manualComponentPct) {
    setGroupValues(root, "manualComponentPct", patch.manualComponentPct, { applyMode });
  }
  if (patch.manualElementPct) {
    setGroupValues(root, "manualElementPct", patch.manualElementPct, { applyMode });
  }
  if (patch.manualTraceElementAbundance) {
    setGroupValues(root, "manualTraceElementAbundance", patch.manualTraceElementAbundance, {
      applyMode,
    });
  }
}

function updateSeedStatus(root, text, { stale = false } = {}) {
  const statusEl = root?.querySelector("[data-composition-seed-status]");
  if (!statusEl) return;
  statusEl.textContent = text || "";
  statusEl.dataset.stale = stale ? "1" : "0";
}

function setSeedChoiceVisible(root, visible) {
  const choiceEl = root?.querySelector("[data-composition-seed-choice]");
  if (!choiceEl) return;
  choiceEl.hidden = !visible;
}

function coerceSuggestionToPatch(seedResult, applyMode) {
  if (!seedResult) return null;
  if (seedResult.componentPct || seedResult.elementPct || seedResult.traceElementAbundance) {
    return buildCompositionSuggestionPatch(seedResult, { applyMode });
  }
  return {
    ...seedResult,
    __compositionApplyMode: applyMode,
  };
}

function emitPatchedEditorState(root, onPatch, sourcePatch = {}) {
  const patch = collectCompositionEditorPatch(root);
  if (sourcePatch.compositionSuggestionMeta) {
    patch.compositionSuggestionMeta = sourcePatch.compositionSuggestionMeta;
  }
  onPatch?.(patch);
}

export function collectCompositionEditorPatch(root) {
  if (!root) return {};
  return {
    compositionMode: normalizeCompositionMode(readRadioValue(root, "composition-mode", "inferred")),
    compositionNormalizeMode: normalizeMode(
      readRadioValue(root, "composition-normalize-mode", "warn"),
    ),
    compositionStructureSource: normalizeStructureSource(
      readRadioValue(root, "composition-structure-source", "inferred"),
    ),
    manualComponentPct: collectGroup(root, "manualComponentPct", COMPOSITION_COMPONENT_FIELDS),
    manualElementPct: collectGroup(root, "manualElementPct", COMPOSITION_ELEMENT_FIELDS),
    manualTraceElementAbundance: collectGroup(
      root,
      "manualTraceElementAbundance",
      COMPOSITION_TRACE_FIELDS,
    ),
  };
}

function setSectionHidden(root, sectionName, hidden) {
  root.querySelectorAll(`[data-composition-section="${sectionName}"]`).forEach((section) => {
    section.hidden = hidden;
  });
}

export function syncCompositionEditorVisibility(root) {
  if (!root) return;
  const mode = normalizeCompositionMode(readRadioValue(root, "composition-mode", "inferred"));
  const inferred = mode === "inferred";
  const expert = mode === "expert-elements";
  setSectionHidden(root, "manual-tools", inferred);
  setSectionHidden(root, "reservoir", inferred);
  setSectionHidden(root, "elements", !expert);
  setSectionHidden(root, "trace", !expert);
  setSectionHidden(root, "structure-source", !expert);
  const syncElementsButton = root.querySelector("[data-composition-sync-elements-button]");
  if (syncElementsButton) syncElementsButton.disabled = !hasAnyReservoirValues(root);
}

function setNormalizeMode(root) {
  const normalizeInput = root.querySelector(
    'input[name$="composition-normalize-mode"][value="normalize"]',
  );
  if (normalizeInput) normalizeInput.checked = true;
}

function normalizeInputGroup(root, group) {
  const inputs = Array.from(root.querySelectorAll(`[data-composition-group="${group}"]`));
  const values = inputs.map((input) => Math.max(readNumberValue(input) || 0, 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return false;
  inputs.forEach((input, index) => {
    input.value = formatInputNumber((values[index] / total) * 100);
  });
  return true;
}

function normalizeVisibleGroups(root) {
  const mode = normalizeCompositionMode(readRadioValue(root, "composition-mode", "inferred"));
  if (mode === "inferred") return false;
  const normalizedComponents = normalizeInputGroup(root, "manualComponentPct");
  const normalizedElements =
    mode === "expert-elements" ? normalizeInputGroup(root, "manualElementPct") : false;
  if (normalizedComponents || normalizedElements) setNormalizeMode(root);
  return normalizedComponents || normalizedElements;
}

export function bindCompositionEditor(root, { onPatch, onSeedSensibleValues } = {}) {
  if (!root || root.__compositionEditorBound) return;
  root.__compositionEditorBound = true;
  root.addEventListener("change", () => {
    syncCompositionEditorVisibility(root);
    onPatch?.(collectCompositionEditorPatch(root));
  });
  root.querySelector("[data-composition-normalize-button]")?.addEventListener("click", () => {
    if (!normalizeVisibleGroups(root)) return;
    syncCompositionEditorVisibility(root);
    onPatch?.(collectCompositionEditorPatch(root));
  });
  root.querySelector("[data-composition-seed-button]")?.addEventListener("click", () => {
    if (hasAnyCompositionValues(root)) {
      setSeedChoiceVisible(root, true);
      return;
    }
    const seedResult = onSeedSensibleValues?.({
      applyMode: "replace-all",
      currentPatch: collectCompositionEditorPatch(root),
    });
    const seedPatch = coerceSuggestionToPatch(seedResult, "replace-all");
    if (!seedPatch) return;
    applyCompositionPatchToEditor(root, seedPatch, { applyMode: "replace-all" });
    syncCompositionEditorVisibility(root);
    setSeedChoiceVisible(root, false);
    updateSeedStatus(root, seedResult.sourceSummary || "Seeded from current solver.");
    emitPatchedEditorState(root, onPatch, seedPatch);
  });
  root.querySelectorAll("[data-composition-seed-apply]").forEach((button) => {
    button.addEventListener("click", () => {
      const applyMode = button.dataset.compositionSeedApply || "replace-all";
      const seedResult = onSeedSensibleValues?.({
        applyMode,
        currentPatch: collectCompositionEditorPatch(root),
      });
      const seedPatch = coerceSuggestionToPatch(seedResult, applyMode);
      if (!seedPatch) return;
      applyCompositionPatchToEditor(root, seedPatch, { applyMode });
      syncCompositionEditorVisibility(root);
      setSeedChoiceVisible(root, false);
      updateSeedStatus(root, seedResult.sourceSummary || "Seeded from current solver.");
      emitPatchedEditorState(root, onPatch, seedPatch);
    });
  });
  root.querySelector("[data-composition-sync-elements-button]")?.addEventListener("click", () => {
    if (!hasAnyReservoirValues(root)) return;
    const componentPct = collectGroup(root, "manualComponentPct", COMPOSITION_COMPONENT_FIELDS);
    const manualElementPct = elementPctFromComponentPct(componentPct);
    applyCompositionPatchToEditor(root, { manualElementPct }, { applyMode: "replace-all" });
    syncCompositionEditorVisibility(root);
    updateSeedStatus(root, "Elements synced from reservoir values.");
    emitPatchedEditorState(root, onPatch);
  });
  syncCompositionEditorVisibility(root);
}

export function updateCompositionEditorValidation(root, validation) {
  if (!root) return;
  const validationEl = root.querySelector("[data-composition-validation]");
  if (!validationEl) return;
  validationEl.dataset.status = String(validation?.status || "pending");
  replaceChildren(validationEl, renderValidationNode(validation));
}
