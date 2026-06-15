import { createElement, replaceSelectOptions } from "../domHelpers.js";
import {
  getPlanetaryVisualEditorControlValue,
  hasPlanetaryVisualEditorControlValue,
  isPlanetaryVisualEditorFieldLocked,
} from "./editorState.js";

const COLOR_SWATCHES = Object.freeze([
  "#2b3440",
  "#4a5968",
  "#8aa9b8",
  "#c7d8dd",
  "#e8e2cf",
  "#c79b6d",
  "#9e6a4b",
  "#3e5f8f",
  "#1f7e9a",
  "#77dfd8",
  "#dce9ed",
  "#8f4730",
  "#d28b56",
]);

const CONTROL_TIPS = Object.freeze({
  "surface.terrainContrast": "Changes the apparent strength of large terrain features.",
  "atmosphere.haze": "Adds suspended aerosols or photochemical haze to the limb and horizon.",
  "atmosphere.limbGlow": "Controls the bright atmospheric edge seen around the planet.",
  "atmosphere.envelopeTint": "Tints a volatile envelope without claiming a solid surface color.",
  "clouds.softness": "Controls how sharp or diffuse the cloud edges appear.",
  "clouds.cloudDeck": "Brown dwarf cloud deck strength for dusty or methane-rich atmospheres.",
  "bands.turbulence": "Controls procedural disruption in gas giant and brown dwarf bands.",
  "bands.shear": "Controls how strongly neighboring bands are pulled in opposite directions.",
  "bands.polarTint": "Tints the high-latitude banding and polar regions.",
  "storms.greatSpot": "Enables a persistent large oval storm.",
  "rings.inner": "Ring radius measured relative to the body radius.",
  "rings.outer": "Ring radius measured relative to the body radius.",
  "rings.tiltDeg": "Ring plane tilt in degrees for the visual preview.",
  "rings.yawDeg": "Ring plane yaw in degrees for the visual preview.",
  "rings.banding": "Controls visible contrast between ring bands.",
  "rings.gaps": "Controls the strength of ring divisions and gaps.",
  "material.emissive": "Adds self-lit surface emission, useful for lava worlds.",
  "material.glow": "Adds substellar glow for brown dwarf styling.",
  "material.warmth": "Shifts brown dwarf warmth between cooler and warmer tones.",
  seed: "Controls the procedural texture layout. Leave blank to use the automatic body seed.",
});

function controlPath(control) {
  return String(control?.path || control?.id || control?.key || "").trim();
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function inputValueFor(control, value) {
  if (value !== undefined && value !== null && value !== "") return value;
  if (control.type === "color") return "#8aa9b8";
  if (control.type === "boolean") return false;
  if (control.type === "select")
    return control.options?.[0]?.value ?? control.options?.[0]?.id ?? "";
  if (Number.isFinite(control.min) && Number.isFinite(control.max)) {
    return Number(((control.min + control.max) / 2).toFixed(2));
  }
  return control.min ?? 0;
}

function tipNode(control) {
  const text = control?.help || CONTROL_TIPS[controlPath(control)] || "";
  if (!text) return null;
  return createElement("span", {
    className: "tip-icon planetary-visual-control__tip",
    attrs: { tabindex: "0", role: "note", "aria-label": "Info", title: text },
    dataset: { tip: text },
    text: "i",
  });
}

function createLockControl(control, path, locked, className = "planetary-visual-control__lock") {
  const label = control.label || path;
  return createElement(
    "label",
    {
      className,
      attrs: { title: `Lock ${label}` },
    },
    [
      createElement("input", {
        attrs: {
          type: "checkbox",
          checked: locked ? "true" : null,
          "aria-label": `Lock ${label}`,
        },
        dataset: { lockPath: path },
      }),
      createElement("span", {
        className: "planetary-visual-control__lock-text",
        attrs: { "aria-hidden": "true" },
        text: "Lock",
      }),
    ],
  );
}

function createColorControl(control, value, locked) {
  const path = controlPath(control);
  const colorValue = String(inputValueFor(control, value));
  return createElement("div", { className: "planetary-visual-control__color" }, [
    createElement(
      "div",
      { className: "planetary-visual-control__swatches" },
      COLOR_SWATCHES.map((swatch) =>
        createElement("button", {
          className: "planetary-visual-control__swatch",
          attrs: {
            type: "button",
            style: `--swatch-color: ${swatch}`,
            title: swatch,
            "aria-label": `${control.label} ${swatch}`,
            disabled: locked ? "true" : null,
          },
          dataset: { controlPath: path, swatchValue: swatch },
          text: "",
        }),
      ),
    ),
    createElement("div", { className: "planetary-visual-control__color-actions" }, [
      createElement("input", {
        className: "planetary-visual-control__input planetary-visual-control__input--color",
        attrs: {
          type: "color",
          value: colorValue,
          disabled: locked ? "true" : null,
          "aria-label": control.label,
        },
        dataset: { controlPath: path, controlType: "color" },
      }),
      createElement("button", {
        className: "small planetary-visual-control__apply",
        attrs: {
          type: "button",
          disabled: locked ? "true" : null,
          title: `Apply ${control.label}`,
          "aria-label": `Apply ${control.label}`,
        },
        dataset: { colorCommitPath: path },
        text: "Apply",
      }),
      createLockControl(
        control,
        path,
        locked,
        "planetary-visual-control__lock planetary-visual-control__lock--inline",
      ),
      createElement("input", {
        className: "planetary-visual-control__input planetary-visual-control__input--text",
        attrs: {
          type: "text",
          value: value ?? "",
          disabled: locked ? "true" : null,
          "aria-label": `${control.label} hex value`,
        },
        dataset: { controlPath: path, controlType: "colorText" },
      }),
    ]),
  ]);
}

function createRangeControl(control, value, locked) {
  const path = controlPath(control);
  const min = safeNumber(control.min, 0);
  const max = safeNumber(control.max, 1);
  const step = safeNumber(control.step, 0.01);
  const resolvedValue = safeNumber(inputValueFor(control, value), min);
  return createElement("div", { className: "planetary-visual-control__range" }, [
    createElement("input", {
      className: "planetary-visual-control__input planetary-visual-control__input--range",
      attrs: {
        type: "range",
        min,
        max,
        step,
        value: resolvedValue,
        disabled: locked ? "true" : null,
        "aria-label": control.label,
      },
      dataset: { controlPath: path, controlType: control.type },
    }),
    createElement("input", {
      className: "planetary-visual-control__input planetary-visual-control__input--number",
      attrs: {
        type: "number",
        min,
        max,
        step,
        value: value ?? "",
        disabled: locked ? "true" : null,
        "aria-label": `${control.label} value`,
      },
      dataset: { controlPath: path, controlType: control.type },
    }),
  ]);
}

function createBooleanControl(control, value, locked) {
  return createElement("label", { className: "planetary-visual-control__toggle" }, [
    createElement("input", {
      attrs: {
        type: "checkbox",
        checked: value === true ? "true" : null,
        disabled: locked ? "true" : null,
        "aria-label": control.label,
      },
      dataset: { controlPath: controlPath(control), controlType: "boolean" },
    }),
    createElement("span", { text: "Enabled" }),
  ]);
}

function createSelectControl(control, value, locked) {
  const select = createElement("select", {
    className: "planetary-visual-control__input planetary-visual-control__input--select",
    attrs: {
      disabled: locked ? "true" : null,
      "aria-label": control.label,
    },
    dataset: { controlPath: controlPath(control), controlType: "select" },
  });
  replaceSelectOptions(
    select,
    (control.options || []).map((option) => ({
      value: option.value ?? option.id ?? "",
      label: option.label || option.value || option.id || "",
      selected: String(option.value ?? option.id ?? "") === String(inputValueFor(control, value)),
    })),
  );
  return select;
}

function createValueControl(control, value, locked) {
  if (control.type === "color") return createColorControl(control, value, locked);
  if (control.type === "range" || control.type === "number")
    return createRangeControl(control, value, locked);
  if (control.type === "boolean") return createBooleanControl(control, value, locked);
  if (control.type === "select") return createSelectControl(control, value, locked);
  return createElement("input", {
    className: "planetary-visual-control__input",
    attrs: {
      type: "text",
      value: value ?? "",
      placeholder: control.placeholder || "",
      title: control.autoValue ? `Auto seed: ${control.autoValue}` : null,
      disabled: locked ? "true" : null,
      "aria-label": control.label || controlPath(control),
    },
    dataset: { controlPath: controlPath(control), controlType: "text" },
  });
}

function createAutoCoverageReadout(path, state) {
  const readout = state?.autoCoverageReadouts?.[path];
  if (!readout) return null;
  const label = readout.label || (readout.percentLabel ? `Auto ${readout.percentLabel}` : "Auto");
  const explanation = String(readout.explanation || "").trim();
  return createElement(
    "div",
    {
      className: "planetary-visual-control__auto-readout",
      attrs: { role: "note" },
      dataset: { autoReadoutPath: path, confidence: readout.confidence || "medium" },
    },
    [
      createElement("span", {
        className: "planetary-visual-control__auto-value",
        text: label,
      }),
      explanation
        ? createElement("small", {
            className: "planetary-visual-control__auto-reason",
            text: explanation,
          })
        : null,
    ],
  );
}

function controlForState(control, state, path) {
  if (path !== "seed") return control;
  const autoSeed = String(state?.autoSeed || "").trim();
  if (!autoSeed) return control;
  return {
    ...control,
    autoValue: autoSeed,
    placeholder: `Auto: ${autoSeed}`,
  };
}

export function createPlanetaryVisualControl(control, state) {
  const path = controlPath(control);
  const displayControl = controlForState(control, state, path);
  const value = getPlanetaryVisualEditorControlValue(state, path);
  const hasValue = hasPlanetaryVisualEditorControlValue(state, path);
  const locked = isPlanetaryVisualEditorFieldLocked(state, path);
  const isColorControl = displayControl.type === "color";
  return createElement(
    "div",
    {
      className: isColorControl
        ? "planetary-visual-control planetary-visual-control--color"
        : "planetary-visual-control",
      dataset: { controlPath: path, locked: locked ? "true" : "false" },
    },
    [
      createElement("div", { className: "planetary-visual-control__label" }, [
        createElement("span", { text: displayControl.label || path }),
        tipNode(displayControl),
      ]),
      createElement("div", { className: "planetary-visual-control__source" }, [
        createElement("span", {
          className: hasValue
            ? "planetary-visual-control__source-pill is-custom"
            : "planetary-visual-control__source-pill",
          text: hasValue ? "Custom" : "Auto",
        }),
        createAutoCoverageReadout(path, state),
      ]),
      createValueControl(displayControl, value, locked),
      isColorControl ? null : createLockControl(displayControl, path, locked),
    ],
  );
}

export function createPlanetaryVisualSection(section, state, options = {}) {
  const controls = Array.isArray(section?.controls) ? section.controls : [];
  const warning =
    section?.id === "rings" ? options.ringWarning || options.ringState?.scienceReason || "" : "";
  return createElement(
    "details",
    {
      className: "planetary-visual-section",
      attrs: { open: "", "data-section-id": section.id },
    },
    [
      createElement("summary", { className: "planetary-visual-section__summary" }, [
        createElement("span", {
          className: "planetary-visual-section__title",
          text: section.label,
        }),
        createElement("span", {
          className: "planetary-visual-section__count",
          text: `${controls.length} controls`,
        }),
      ]),
      warning
        ? createElement("div", {
            className: "planetary-visual-section__warning",
            attrs: { role: "note" },
            text: warning,
          })
        : null,
      createElement("div", { className: "planetary-visual-section__toolbar" }, [
        createElement("button", {
          className: "small",
          attrs: { type: "button" },
          dataset: { randomizeSection: section.id },
          text: "Randomize section",
        }),
        createElement("button", {
          className: "small",
          attrs: { type: "button" },
          dataset: { resetSection: section.id },
          text: "Reset section",
        }),
      ]),
      createElement(
        "div",
        { className: "planetary-visual-section__controls" },
        controls.map((control) => createPlanetaryVisualControl(control, state)),
      ),
    ],
  );
}

export function createPlanetaryVisualControlSections(state, options = {}) {
  const sections = Array.isArray(state?.manifest?.sections) ? state.manifest.sections : [];
  return sections.map((section) => createPlanetaryVisualSection(section, state, options));
}
