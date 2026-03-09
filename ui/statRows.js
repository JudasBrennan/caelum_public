// SPDX-License-Identifier: MPL-2.0
import { createElement } from "./domHelpers.js";
import { createTipIconNode } from "./planet/outputRender.js";
import { escapeHtml } from "./uiHelpers.js";

function normalizeItems(items = []) {
  return (Array.isArray(items) ? items : []).filter(
    (item) => item && item.value != null && item.value !== "",
  );
}

export function createStatRows(items = []) {
  return createElement(
    "div",
    { className: "stat-rows" },
    normalizeItems(items).map((item) =>
      createElement("div", { className: "stat-row" }, [
        createElement("div", { className: "stat-row__label" }, [
          item.label || "",
          " ",
          createTipIconNode(item.tip || ""),
        ]),
        createElement("div", { className: "stat-row__value" }, [item.value]),
        item.meta ? createElement("div", { className: "stat-row__meta" }, [item.meta]) : null,
      ]),
    ),
  );
}

export function statRowsHTML(items = []) {
  return `<div class="stat-rows">${normalizeItems(items)
    .map(
      (item) => `
      <div class="stat-row">
        <div class="stat-row__label">${item.labelHtml || `${escapeHtml(item.label || "")}${item.tip ? ` ${item.tip}` : ""}`}</div>
        <div class="stat-row__value">${item.valueHtml || escapeHtml(item.value)}</div>
        ${item.meta ? `<div class="stat-row__meta">${escapeHtml(item.meta)}</div>` : item.metaHtml ? `<div class="stat-row__meta">${item.metaHtml}</div>` : ""}
      </div>`,
    )
    .join("")}</div>`;
}
