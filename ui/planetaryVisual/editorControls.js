import { createElement, replaceSelectOptions } from "../domHelpers.js";
import { createPlanetaryVisualControlSections } from "./controlRenderers.js";
import { listPlanetaryVisualPresets } from "./presets.js";

export const PLANETARY_VISUAL_MODE_OPTIONS = Object.freeze([
  {
    value: "auto",
    label: "Auto",
  },
  {
    value: "mixed",
    label: "Mixed",
  },
  {
    value: "custom",
    label: "Custom",
  },
]);

export const PLANETARY_VISUAL_COMPARE_OPTIONS = Object.freeze([
  {
    value: "custom",
    label: "Draft",
  },
  {
    value: "auto",
    label: "Auto",
  },
]);

export function listPlanetaryVisualModeOptions(selectedMode = "auto") {
  return PLANETARY_VISUAL_MODE_OPTIONS.map((option) => ({
    ...option,
    selected: option.value === selectedMode,
  }));
}

export function listPlanetaryVisualCompareOptions(selectedMode = "custom") {
  const mode = selectedMode === "auto" ? "auto" : "custom";
  return PLANETARY_VISUAL_COMPARE_OPTIONS.map((option) => ({
    ...option,
    selected: option.value === mode,
  }));
}

export function createPlanetaryVisualPresetSelect(state, source = {}) {
  const select = createElement("select", {
    className: "planetary-visual-editor__preset-select",
    attrs: { "aria-label": "Visual preset" },
    dataset: { presetSelect: "true" },
  });
  const currentPreset = state?.draft?.visualOverrides?.presetId || "";
  replaceSelectOptions(select, [
    { value: "", label: "Choose preset", selected: !currentPreset },
    ...listPlanetaryVisualPresets(source).map((preset) => ({
      value: preset.id,
      label: preset.label,
      selected: preset.id === currentPreset,
    })),
  ]);
  return select;
}

export function createPlanetaryVisualEditorControls(state, options = {}) {
  return createElement("div", { className: "planetary-visual-controls" }, [
    createElement("div", { className: "planetary-visual-controls__common" }, [
      createElement("label", { className: "planetary-visual-editor__field" }, [
        createElement("span", { text: "Preset" }),
        createPlanetaryVisualPresetSelect(state, options.presetSource || options),
      ]),
      createElement("button", {
        className: "small",
        attrs: { type: "button" },
        dataset: { randomizeAll: "true" },
        text: "Randomize all",
      }),
    ]),
    createElement(
      "div",
      { className: "planetary-visual-controls__sections" },
      createPlanetaryVisualControlSections(state, options),
    ),
  ]);
}
