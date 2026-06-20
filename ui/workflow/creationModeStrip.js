import { createElement } from "../domHelpers.js";

export const CREATION_MODE_ORDER = Object.freeze(["quick", "guided", "recipes", "advanced"]);

const MODE_LABELS = Object.freeze({
  quick: "Quick",
  guided: "Guided",
  recipes: "Recipes",
  advanced: "Advanced",
});

function normalizeModeConfig(mode) {
  if (typeof mode === "string") return { id: mode };
  return mode && typeof mode === "object" ? { ...mode } : null;
}

function modeNode(mode, selectedMode, onSelect) {
  const id = String(mode.id || "").trim();
  const isSelected = id === selectedMode;
  const isDisabled = !!mode.disabled;
  const isStatic = !!mode.currentMarker || !!mode.static;
  const node = createElement(isStatic ? "span" : "button", {
    className: [
      "workflow-mode-strip__mode",
      mode.className || "",
      isSelected ? "is-selected" : "",
      isDisabled ? "is-disabled" : "",
      isStatic ? "workflow-mode-strip__mode--current" : "",
    ]
      .filter(Boolean)
      .join(" "),
    attrs: {
      id: mode.elementId || null,
      ...(isStatic ? {} : { type: "button" }),
      "data-mode": id,
      "aria-pressed": isStatic ? null : isSelected ? "true" : "false",
      "aria-current": isStatic && isSelected ? "page" : null,
      title: mode.help || null,
      ...(mode.attrs || {}),
    },
    text: mode.label || MODE_LABELS[id] || id,
  });
  if (!isStatic) node.disabled = isDisabled;
  if (mode.disabledReason) node.dataset.disabledReason = mode.disabledReason;
  if (mode.currentMarker) node.dataset.currentMarker = "true";
  if (!isStatic && !isDisabled && typeof onSelect === "function") {
    node.addEventListener("click", () => onSelect(id, mode));
  }
  return node;
}

export function createCreationModeStrip({
  id = "",
  className = "",
  title = "",
  summary = "",
  summaryId = "",
  modes = CREATION_MODE_ORDER,
  selectedMode = "advanced",
  onSelect = null,
} = {}) {
  const normalized = (Array.isArray(modes) ? modes : [])
    .map(normalizeModeConfig)
    .filter((mode) => mode?.id);
  const byId = new Map(normalized.map((mode) => [mode.id, mode]));
  const ordered = CREATION_MODE_ORDER.filter((id) => byId.has(id)).map((id) => byId.get(id));

  const root = createElement("div", {
    className: ["workflow-mode-strip", className].filter(Boolean).join(" "),
    attrs: { id: id || null, "data-workflow-component": "creation-mode-strip" },
  });
  if (title || summary) {
    const copy = createElement("div", { className: "workflow-mode-strip__copy" });
    if (title)
      copy.appendChild(
        createElement("div", { className: "workflow-mode-strip__title", text: title }),
      );
    if (summary || summaryId)
      copy.appendChild(
        createElement("div", {
          className: "workflow-mode-strip__summary",
          attrs: { id: summaryId || null },
          text: summary,
        }),
      );
    root.appendChild(copy);
  }
  root.appendChild(
    createElement(
      "div",
      {
        className: "workflow-mode-strip__modes",
        attrs: { role: "group", "aria-label": "Creation mode" },
      },
      ordered.map((mode) => modeNode(mode, selectedMode, onSelect)),
    ),
  );
  return root;
}
