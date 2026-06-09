import { createElement, replaceChildren } from "./domHelpers.js";
import { createKpiGrid, createTipIconNode, enableKpiInteractions } from "./planet/outputRender.js";

function createSectionHeading(section = {}) {
  return createElement("div", { className: "kpi-section__header" }, [
    createElement("h3", { className: "kpi-section__title" }, [
      section.title || "",
      " ",
      createTipIconNode(section.tip || ""),
    ]),
  ]);
}

export function createKpiSection(section = {}) {
  const items = Array.isArray(section.items) ? section.items.filter(Boolean) : [];
  if (!items.length) return null;

  const grid = createKpiGrid(items);
  if (section.density === "compact") {
    grid.classList.add("kpi-grid--compact");
  }

  if (section.collapsible) {
    return createElement(
      "details",
      {
        className:
          `kpi-section ${section.density === "compact" ? "kpi-section--compact" : ""}`.trim(),
        attrs: {
          ...(section.id ? { id: section.id } : {}),
          ...(section.open === false ? {} : { open: "" }),
        },
      },
      [
        createElement("summary", { className: "kpi-section__header" }, [
          createElement("h3", { className: "kpi-section__title" }, [
            section.title || "",
            " ",
            createTipIconNode(section.tip || ""),
          ]),
        ]),
        grid,
      ],
    );
  }

  return createElement(
    "section",
    {
      className:
        `kpi-section ${section.density === "compact" ? "kpi-section--compact" : ""}`.trim(),
      attrs: section.id ? { id: section.id } : {},
    },
    [createSectionHeading(section), grid],
  );
}

export function renderKpiSections(container, sections = []) {
  const nodes = (sections || []).map((section) => createKpiSection(section)).filter(Boolean);
  replaceChildren(container, nodes);
  enableKpiInteractions(container);
  return container;
}
