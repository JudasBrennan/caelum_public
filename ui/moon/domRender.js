import { createElement, replaceChildren } from "../domHelpers.js";
import { createKpiGrid, enableKpiInteractions } from "../planet/outputRender.js";
import { renderKpiSections } from "../kpiSections.js";
import { renderDerivedDetails } from "../derivedDetails.js";
import { createResultSummary, renderResultSummary } from "../resultSummary.js";
import { createGuidedCreationOverlay } from "../guidedCreation/components/overlay.js";

function createOptionNode(value, label) {
  return createElement("option", {
    attrs: { value: value == null ? "" : String(value) },
    text: label == null ? "" : String(label),
  });
}

function createOptgroupNode(label, entries = []) {
  if (!entries.length) return null;
  return createElement(
    "optgroup",
    { attrs: { label } },
    entries.map((entry) => createOptionNode(entry?.value, entry?.label)),
  );
}

export function renderMoonParentSelector(
  selectEl,
  { planets = [], gasGiants = [], selectedValue = "", disabled = false, title = "" } = {},
) {
  replaceChildren(selectEl, [
    createOptionNode("", "Unassigned"),
    createOptgroupNode(
      "Planets",
      (planets || []).map((planet) => ({
        value: planet?.moonParentId || planet?.id || "",
        label: `${planet?.name || planet?.inputs?.name || planet?.id || "Planet"}${
          planet?.classification?.displayLabel ? ` - ${planet.classification.displayLabel}` : ""
        }`,
      })),
    ),
    createOptgroupNode(
      "Gas Giants",
      (gasGiants || []).map((gasGiant) => ({
        value: gasGiant?.moonParentId || gasGiant?.id || "",
        label: `${gasGiant?.name || gasGiant?.id || "Gas Giant"}${
          gasGiant?.classification?.displayLabel ? ` - ${gasGiant.classification.displayLabel}` : ""
        }`,
      })),
    ),
  ]);

  const rawSelectedValue = selectedValue == null ? "" : String(selectedValue);
  selectEl.value = [...selectEl.options].some((option) => option.value === rawSelectedValue)
    ? rawSelectedValue
    : "";
  selectEl.disabled = Boolean(disabled);
  selectEl.title = title || "";
  return selectEl;
}

export function renderMoonSelector(selectEl, moons = [], selectedValue = "") {
  const normalizedMoons = Array.isArray(moons) ? moons : [];
  replaceChildren(
    selectEl,
    normalizedMoons.map((moon) =>
      createOptionNode(moon?.id || "", moon?.name || moon?.inputs?.name || moon?.id || "Moon"),
    ),
  );

  if (!normalizedMoons.length) {
    selectEl.value = "";
    return selectEl;
  }

  const rawSelectedValue = String(selectedValue || "");
  const fallbackValue = String(normalizedMoons[0]?.id || "");
  selectEl.value = [...selectEl.options].some((option) => option.value === rawSelectedValue)
    ? rawSelectedValue
    : fallbackValue;
  return selectEl;
}

export function renderMoonKpis(container, items = []) {
  const grid = createKpiGrid(items);
  replaceChildren(container, [...grid.childNodes]);
  enableKpiInteractions(container);
  return container;
}

export function renderMoonKpiSections(container, sections = []) {
  return renderKpiSections(container, sections);
}

export function createMoonResultSummary(summary = {}) {
  return createResultSummary(summary, {
    id: "moonResultSummary",
    className: "moon-result-summary",
    subject: "Moon",
    ariaLabel: "Moon result summary",
  });
}

export function renderMoonResultSummary(container, summary = {}) {
  return renderResultSummary(container, summary, {
    id: "moonResultSummary",
    className: "moon-result-summary",
    subject: "Moon",
    ariaLabel: "Moon result summary",
  });
}

export function renderMoonDerivedDetails(container, sections = [], options = {}) {
  renderDerivedDetails(container, sections, options);
  return container;
}

function inferMoonRecipeHint(recipe) {
  const preview = recipe?.preview || {};
  const tides = preview?.tides || {};
  const inputs = preview?.inputs || {};
  const physical = preview?.physical || {};
  const comp = String(tides?.compositionClass || "");
  const name = String(recipe?.id || "");
  const heating = Number(tides?.tidalHeatingEarth) || 0;
  const albedo = Number(inputs?.albedo) || 0;
  const radiusMoon = Number(physical?.radiusMoon) || 0;

  if (name === "irregular-capture") return "Dark captured rubble body";
  if (name === "phobos" || name === "deimos") return "Tiny captured moonlet";
  if (heating >= 12) return "Volcanic resurfacing world";
  if (heating >= 1 && comp === "Subsurface ocean") return "Fractured ice over an interior ocean";
  if (comp === "Subsurface ocean") return "Ice shell with likely ocean below";
  if (comp === "Icy" || comp === "Very icy") return "Bright frozen surface";
  if (comp === "Mixed rock/ice" && radiusMoon >= 1.2 && albedo <= 0.25) {
    return "Cold haze-prone ice-rock moon";
  }
  if (comp === "Mixed rock/ice") return "Blended rock and ice surface";
  if (comp === "Partially molten") return "Heated molten companion";
  if (radiusMoon < 0.05) return "Small irregular capture";
  return "Rocky major moon";
}

export function createMoonRecipePickerOverlay(recipes = []) {
  const categories = [
    ...new Set((recipes || []).map((recipe) => recipe?.category).filter(Boolean)),
  ];
  return createElement("div", { className: "rp-picker-overlay rp-picker-overlay--moon" }, [
    createElement("div", { className: "rp-picker-dialog rp-picker-dialog--moon panel" }, [
      createElement("div", { className: "panel__header" }, [
        createElement("div", { className: "rp-picker-heading" }, [
          createElement("h2", { text: "Moon Recipes" }),
          createElement("div", {
            className: "rp-picker-subtitle",
            text: "Pick a visual and physical starting point for the current moon.",
          }),
        ]),
        createElement("button", {
          className: "small rp-picker-close",
          attrs: { type: "button" },
          text: "Close",
        }),
      ]),
      createElement("div", { className: "rp-picker-progress" }, [createElement("span")]),
      createElement(
        "div",
        { className: "panel__body" },
        categories.flatMap((category) => [
          createElement("div", { className: "rp-picker-category", text: category }),
          createElement(
            "div",
            { className: "rp-picker-grid" },
            (recipes || [])
              .filter((recipe) => recipe?.category === category)
              .map((recipe) =>
                createElement(
                  "div",
                  {
                    className: "rp-picker-card",
                    dataset: { recipe: recipe?.id || "" },
                  },
                  [
                    createElement("canvas", { attrs: { width: "90", height: "90" } }),
                    createElement("div", {
                      className: "rp-picker-card__label",
                      text: recipe?.label || recipe?.id || "Moon recipe",
                    }),
                    createElement("div", {
                      className: "rp-picker-card__hint",
                      text: recipe?.hint || inferMoonRecipeHint(recipe),
                    }),
                  ],
                ),
              ),
          ),
        ]),
      ),
    ]),
  ]);
}

export function createMoonGuidedCreationOverlay() {
  return createGuidedCreationOverlay({
    overlayClassName: "rp-picker-overlay--moon moon-guided-overlay",
    dialogClassName: "rp-picker-dialog--moon moon-guided-dialog",
    closeButtonClassName: "moon-guided-overlay__close",
    contentClassName: "moon-guided-overlay__content",
    closeLabel: "Close moon guided creation",
  });
}
