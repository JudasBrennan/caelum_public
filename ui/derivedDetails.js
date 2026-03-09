// SPDX-License-Identifier: MPL-2.0
import { createElement, replaceChildren } from "./domHelpers.js";
import { createTipIconNode } from "./planet/outputRender.js";
import { createStatRows } from "./statRows.js";

function normalizeSections(sections = []) {
  return (Array.isArray(sections) ? sections : [])
    .map((section) => ({
      ...section,
      items: Array.isArray(section?.items)
        ? section.items.filter((item) => item && item.value != null && item.value !== "")
        : [],
    }))
    .filter((section) => section.items.length);
}

function createDerivedDetailsSection(section = {}) {
  return createElement(
    "section",
    {
      className: "derived-details__section",
      attrs: section.id ? { id: section.id } : {},
    },
    [
      createElement("div", { className: "derived-details__section-header" }, [
        createElement("h4", { className: "derived-details__section-title" }, [
          section.title || "",
          " ",
          createTipIconNode(section.tip || ""),
        ]),
      ]),
      createStatRows(section.items || []),
    ],
  );
}

export function createDerivedDetails(sections = [], options = {}) {
  const normalizedSections = normalizeSections(sections);
  if (!normalizedSections.length) return null;

  return createElement(
    "details",
    {
      className: "derived-details",
      attrs: options.open === true ? { open: "" } : {},
    },
    [
      createElement("summary", { className: "derived-details__summary" }, [
        createElement("h3", { className: "derived-details__title" }, [
          options.title || "Derived Details",
          " ",
          createTipIconNode(options.tip || ""),
        ]),
      ]),
      createElement(
        "div",
        { className: "derived-details__body" },
        normalizedSections.map((section) => createDerivedDetailsSection(section)),
      ),
    ],
  );
}

export function renderDerivedDetails(container, sections = [], options = {}) {
  const block = createDerivedDetails(sections, options);
  replaceChildren(container, block ? [block] : []);
  return container;
}
