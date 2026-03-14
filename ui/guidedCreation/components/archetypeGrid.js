import { createElement } from "../../domHelpers.js";
import { createConfidenceBadge } from "./confidenceBadge.js";

export function createArchetypeGrid({ archetypes = [], selectedId = "", onSelect = null } = {}) {
  return createElement(
    "div",
    { className: "guided-archetype-grid" },
    (Array.isArray(archetypes) ? archetypes : []).map((archetype) => {
      const archetypeId = String(archetype?.id || "");
      const button = createElement(
        "button",
        {
          className:
            `guided-archetype-card ${archetypeId === String(selectedId || "") ? "is-selected" : ""}`.trim(),
          attrs: { type: "button" },
          dataset: { archetype: archetypeId },
        },
        [
          createElement("div", { className: "guided-archetype-card__head" }, [
            createElement("div", {
              className: "guided-archetype-card__title",
              text: archetype?.label || archetypeId || "Archetype",
            }),
            createConfidenceBadge(archetype?.confidenceClass),
          ]),
          createElement("div", {
            className: "guided-archetype-card__summary",
            text: archetype?.summary || "",
          }),
          createElement("div", {
            className: "guided-archetype-card__meta",
            text: Array.isArray(archetype?.tags) ? archetype.tags.join(" | ") : "",
          }),
        ],
      );
      if (typeof onSelect === "function") {
        button.addEventListener("click", () => onSelect(archetypeId, archetype));
      }
      return button;
    }),
  );
}
