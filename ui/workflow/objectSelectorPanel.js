import { createElement, replaceSelectOptions } from "../domHelpers.js";

function selectNode(config = {}, fallbackLabel = "Select object") {
  const select = createElement("select", {
    className: config.className || "",
    attrs: {
      id: config.id || null,
      "aria-label": config.ariaLabel || config.label || fallbackLabel,
      ...(config.attrs || {}),
    },
  });
  replaceSelectOptions(select, config.options || []);
  if (config.value != null) select.value = String(config.value);
  if (typeof config.onChange === "function") select.addEventListener("change", config.onChange);
  return select;
}

function actionNode(action = {}) {
  const node = createElement("button", {
    className: [
      "object-selector-panel__action",
      action.className || "",
      action.danger ? "object-selector-panel__action--danger" : "",
    ]
      .filter(Boolean)
      .join(" "),
    attrs: { type: action.type || "button", id: action.id || null, ...(action.attrs || {}) },
    text: action.label || "",
  });
  if (action.disabled) node.disabled = true;
  if (typeof action.onClick === "function") node.addEventListener("click", action.onClick);
  return node;
}

export function createObjectSelectorPanel({
  id = "",
  className = "",
  title = "",
  summary = "",
  selected = null,
  search = null,
  select = null,
  typeSelect = null,
  parentSelect = null,
  actions = [],
} = {}) {
  const root = createElement("section", {
    className: ["object-selector-panel", className].filter(Boolean).join(" "),
    attrs: { id: id || null, "data-workflow-component": "object-selector-panel" },
  });

  if (title || summary) {
    const header = createElement("div", { className: "object-selector-panel__header" });
    if (title)
      header.appendChild(
        createElement("div", { className: "object-selector-panel__title", text: title }),
      );
    if (summary)
      header.appendChild(
        createElement("div", { className: "object-selector-panel__summary", text: summary }),
      );
    root.appendChild(header);
  }

  if (selected) {
    const selectedNode = createElement("div", { className: "object-selector-panel__selected" });
    selectedNode.appendChild(
      createElement("div", {
        className: "object-selector-panel__selected-label",
        attrs: { id: selected.labelId || null },
        text: selected.label || "Selected",
      }),
    );
    selectedNode.appendChild(
      createElement("div", {
        className: "object-selector-panel__selected-value",
        attrs: { id: selected.valueId || null },
        text: selected.value || "",
      }),
    );
    if (selected.meta || selected.metaId)
      selectedNode.appendChild(
        createElement("div", {
          className: "object-selector-panel__selected-meta",
          attrs: { id: selected.metaId || null },
          text: selected.meta,
        }),
      );
    root.appendChild(selectedNode);
  }

  const controls = createElement("div", { className: "object-selector-panel__controls" });
  if (search) {
    const input = createElement("input", {
      className: "object-selector-panel__search",
      attrs: {
        id: search.id || null,
        type: "search",
        placeholder: search.placeholder || "Search",
        "aria-label": search.ariaLabel || search.label || "Search objects",
        ...(search.attrs || {}),
      },
    });
    if (search.value != null) input.value = String(search.value);
    if (typeof search.onInput === "function") input.addEventListener("input", search.onInput);
    controls.appendChild(input);
  }
  if (select) controls.appendChild(selectNode(select, "Select object"));
  if (typeSelect) controls.appendChild(selectNode(typeSelect, "Select type"));
  if (parentSelect) controls.appendChild(selectNode(parentSelect, "Select parent"));
  if (controls.childNodes.length) root.appendChild(controls);

  const actionNodes = (Array.isArray(actions) ? actions : []).map(actionNode);
  if (actionNodes.length) {
    root.appendChild(
      createElement("div", { className: "object-selector-panel__actions" }, actionNodes),
    );
  }
  return root;
}
