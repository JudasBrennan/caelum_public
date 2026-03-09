// SPDX-License-Identifier: MPL-2.0
import { appendChildren, createElement, replaceChildren } from "../domHelpers.js";

export function createTipIconNode(text) {
  if (!text) return null;
  return createElement("span", {
    className: "tip-icon",
    attrs: { tabindex: "0", role: "note", "aria-label": "Info" },
    dataset: { tip: text },
    text: "i",
  });
}

function setInlineStyles(node, styles = {}) {
  for (const [key, value] of Object.entries(styles || {})) {
    if (value == null || value === "") continue;
    if (key.startsWith("--")) {
      node.style.setProperty(key, String(value));
      continue;
    }
    node.style[key] = String(value);
  }
  return node;
}

function normalizeContent(content) {
  if (content == null || content === false) return [];
  if (Array.isArray(content)) return content.flatMap((entry) => normalizeContent(entry));
  return [content];
}

function hasKpiMetaContent(item = {}) {
  const children =
    item.metaChildren != null ? normalizeContent(item.metaChildren) : normalizeContent(item.meta);
  return children.some((child) => child != null && child !== false && String(child).trim() !== "");
}

function createKpiToggleButton(item, tipText = "") {
  if (!hasKpiMetaContent(item)) return null;
  return createElement("button", {
    className: "kpi__toggle",
    attrs: {
      type: "button",
      "aria-expanded": "false",
      "aria-label": `Show details for ${item.label || "KPI"}`,
      title: tipText ? `${item.label || "KPI"} details` : "Show details",
    },
    text: "\u25be",
  });
}

function createKpiMeta(item) {
  const children =
    item.metaChildren != null ? normalizeContent(item.metaChildren) : normalizeContent(item.meta);
  if (!children.length) return null;
  return createElement("div", { className: "kpi__meta" }, children);
}

function createPreviewCard(item, wrapClass, expandable, tipText) {
  const labelChildren = [item.label, " ", createTipIconNode(tipText)];
  for (const action of item.actions || []) {
    labelChildren.push(" ");
    labelChildren.push(
      createElement("button", {
        className: action.className || "small",
        attrs: { type: "button", id: action.id || null },
        text: action.text || "",
      }),
    );
  }
  const canvas = createElement("canvas", {
    className: item.canvasClass || "",
    attrs: {
      width: item.canvasWidth || 180,
      height: item.canvasHeight || 180,
    },
    dataset: item.canvasDataset || {},
  });
  return createElement(
    "div",
    { className: wrapClass, dataset: { expandable: expandable ? "1" : null } },
    [
      createElement("div", { className: "kpi kpi--preview" }, [
        createElement("div", { className: "kpi__label" }, labelChildren),
        createKpiToggleButton(item, tipText),
        canvas,
        createKpiMeta(item),
      ]),
    ],
  );
}

function createSunPreviewCard(item, wrapClass, expandable, tipText) {
  return createElement(
    "div",
    {
      className: `${wrapClass} kpi-wrap--sun-preview`.trim(),
      dataset: { expandable: expandable ? "1" : null },
    },
    [
      createElement("div", { className: "kpi kpi--sun-preview" }, [
        createElement("div", { className: "kpi__label" }, [
          item.label,
          tipText ? " " : "",
          createTipIconNode(tipText),
        ]),
        createKpiToggleButton(item, tipText),
        createElement("canvas", {
          className: "sun-preview-canvas",
          attrs: { width: "180", height: "180", "aria-label": "Star visual preview" },
        }),
        createElement(
          "div",
          { className: "kpi__value sun-preview-value" },
          normalizeContent(item.value),
        ),
        createElement("div", { className: "sun-preview-caption" }, normalizeContent(item.meta)),
        createKpiMeta(item),
      ]),
    ],
  );
}

function createStandardCard(item, wrapClass, expandable, tipText) {
  const kpiNode = createElement(
    "div",
    {
      className: `kpi ${item.kpiClass || ""}`.trim(),
      dataset: item.kpiDataset || {},
    },
    [
      createElement("div", { className: "kpi__label" }, [
        item.label,
        " ",
        createTipIconNode(tipText),
      ]),
      createKpiToggleButton(item, tipText),
      createElement("div", { className: "kpi__value" }, normalizeContent(item.value)),
      createKpiMeta(item),
    ],
  );
  setInlineStyles(kpiNode, item.kpiStyle || {});
  return createElement(
    "div",
    { className: wrapClass, dataset: { expandable: expandable ? "1" : null } },
    [kpiNode],
  );
}

function createKpiCard(item) {
  const tipText = item.tip || "";
  const expandable = hasKpiMetaContent(item);
  const wrapClass =
    `kpi-wrap ${expandable ? "kpi-wrap--expandable" : ""} ${item.wrapClass || ""}`.trim();
  if (item.kind === "preview") {
    return createPreviewCard(item, wrapClass, expandable, tipText);
  }
  if (item.kind === "sunVisual") {
    return createSunPreviewCard(item, wrapClass, expandable, tipText);
  }
  return createStandardCard(item, wrapClass, expandable, tipText);
}

export function createKpiGrid(items = []) {
  return createElement(
    "div",
    { className: "kpi-grid" },
    (items || []).filter(Boolean).map((item) => createKpiCard(item)),
  );
}

function closestKpiWrap(target) {
  return target?.closest?.(".kpi-wrap--expandable") || null;
}

function closeSiblingKpis(activeWrap) {
  const grid = activeWrap?.closest?.(".kpi-grid");
  if (!grid) return;
  grid.querySelectorAll(".kpi-wrap--expandable.is-expanded").forEach((wrap) => {
    if (wrap === activeWrap) return;
    wrap.classList.remove("is-expanded");
    const toggle = wrap.querySelector(".kpi__toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });
}

function toggleKpiWrap(wrap) {
  if (!wrap) return;
  const nextExpanded = !wrap.classList.contains("is-expanded");
  closeSiblingKpis(wrap);
  wrap.classList.toggle("is-expanded", nextExpanded);
  const toggle = wrap.querySelector(".kpi__toggle");
  if (toggle) toggle.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
}

function prepareKpiInteractions(root) {
  if (!root) return;
  root.querySelectorAll(".kpi-wrap").forEach((wrap) => {
    const meta = wrap.querySelector(".kpi__meta");
    const metaText = meta?.textContent?.trim?.() || "";
    if (!meta || !metaText) return;
    wrap.classList.add("kpi-wrap--expandable");
    wrap.dataset.expandable = "1";
    const kpi = wrap.querySelector(".kpi");
    if (!kpi || kpi.querySelector(".kpi__toggle")) return;
    const label = kpi.querySelector(".kpi__label");
    const labelText = label?.textContent?.trim?.() || "KPI";
    const toggle = createElement("button", {
      className: "kpi__toggle",
      attrs: {
        type: "button",
        "aria-expanded": "false",
        "aria-label": `Show details for ${labelText}`,
        title: `Show details for ${labelText}`,
      },
      text: "\u25be",
    });
    kpi.appendChild(toggle);
  });
}

export function enableKpiInteractions(root) {
  if (!root) return root;
  prepareKpiInteractions(root);
  if (root.dataset.kpiInteractionBound === "1") return root;
  root.dataset.kpiInteractionBound = "1";

  root.addEventListener("click", (event) => {
    const toggleButton = event.target.closest(".kpi__toggle");
    if (toggleButton) {
      event.preventDefault();
      event.stopPropagation();
      toggleKpiWrap(toggleButton.closest(".kpi-wrap--expandable"));
      return;
    }

    const wrap = closestKpiWrap(event.target);
    if (!wrap) return;
    const interactiveAncestor = event.target.closest(
      'button, a, input, select, textarea, summary, [role="button"]',
    );
    if (interactiveAncestor && !interactiveAncestor.classList.contains("kpi__toggle")) return;
    toggleKpiWrap(wrap);
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const wrap = closestKpiWrap(event.target);
    if (!wrap) return;
    const interactiveAncestor = event.target.closest(
      'button, a, input, select, textarea, summary, [role="button"]',
    );
    if (interactiveAncestor && !interactiveAncestor.classList.contains("kpi__toggle")) return;
    event.preventDefault();
    toggleKpiWrap(wrap);
  });

  return root;
}

function expandLines(lines = []) {
  const expanded = [];
  for (const line of lines) {
    if (line == null || line === false) continue;
    if (typeof line === "string") {
      for (const part of String(line).split("\n")) {
        if (!part) continue;
        expanded.push(part);
      }
      continue;
    }
    expanded.push(line);
  }
  return expanded;
}

function createReadoutBlock(lines = []) {
  return createElement(
    "div",
    { className: "derived-readout" },
    expandLines(lines).map((line) => {
      const row = createElement("div");
      appendChildren(row, normalizeContent(line));
      return row;
    }),
  );
}

export function createReadoutSections(sections = []) {
  return (sections || []).map((section) =>
    createElement("div", { attrs: { style: section.style || "margin-top:14px" } }, [
      createElement("div", { className: "label" }, [
        section.title || "",
        " ",
        createTipIconNode(section.tip || ""),
      ]),
      createReadoutBlock(section.lines || []),
    ]),
  );
}

export function renderTectonicProbabilityBar(node, probabilities = null) {
  if (!node) return node;
  if (!probabilities) {
    replaceChildren(node, []);
    return node;
  }
  const colors = {
    stagnant: "#ff7c97",
    mobile: "#7cffb2",
    episodic: "#ffd37c",
    plutonicSquishy: "#a6abcc",
  };
  const labels = {
    stagnant: "Stagnant",
    mobile: "Mobile",
    episodic: "Episodic",
    plutonicSquishy: "Plut.-squishy",
  };
  const keys = ["stagnant", "mobile", "episodic", "plutonicSquishy"];
  const trackKeys = keys.filter((key) => Number(probabilities?.[key]) >= 0.01);
  const legendKeys = keys.filter((key) => Number(probabilities?.[key]) >= 0.05);
  replaceChildren(node, [
    createElement(
      "div",
      { className: "tec-prob-bar__track" },
      trackKeys.map((key) =>
        createElement("div", {
          className: "tec-prob-bar__seg",
          attrs: {
            title: `${labels[key]}: ${Math.round(Number(probabilities[key]) * 100)}%`,
          },
        }),
      ),
    ),
    createElement(
      "div",
      { className: "tec-prob-bar__legend" },
      legendKeys.map((key) =>
        createElement("span", { className: "tec-prob-bar__label" }, [
          createElement("span", { className: "tec-prob-bar__dot" }),
          `${labels[key]} ${Math.round(Number(probabilities[key]) * 100)}%`,
        ]),
      ),
    ),
  ]);
  node.querySelectorAll(".tec-prob-bar__seg").forEach((segment, index) => {
    const key = trackKeys[index];
    segment.style.width = `${Number(probabilities[key]) * 100}%`;
    segment.style.background = colors[key];
  });
  node.querySelectorAll(".tec-prob-bar__dot").forEach((dot, index) => {
    const key = legendKeys[index];
    dot.style.background = colors[key];
  });
  return node;
}
