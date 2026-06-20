import { createElement } from "../domHelpers.js";

function actionNode(action = {}) {
  const tagName = action.href ? "a" : "button";
  const attrs = {
    ...(action.attrs || {}),
    ...(action.href ? { href: action.href } : { type: action.type || "button" }),
  };
  const className = [
    "empty-state__action",
    action.primary ? "empty-state__action--primary" : "",
    action.className || "",
  ]
    .filter(Boolean)
    .join(" ");
  const node = createElement(tagName, {
    className,
    attrs,
    dataset: action.dataset || {},
    text: action.label || "",
  });
  if (action.disabled) node.disabled = true;
  if (typeof action.onClick === "function") node.addEventListener("click", action.onClick);
  return node;
}

export function createEmptyState({
  id = "",
  className = "",
  ariaLabel = "",
  eyebrow = "",
  title = "",
  body = "",
  dependencyNote = "",
  actions = [],
} = {}) {
  return createElement(
    "section",
    {
      className: ["empty-state", className].filter(Boolean).join(" "),
      attrs: {
        id: id || null,
        "aria-label": ariaLabel || title || null,
        "data-workflow-component": "empty-state",
      },
    },
    [
      eyebrow ? createElement("div", { className: "empty-state__eyebrow", text: eyebrow }) : null,
      title ? createElement("h3", { className: "empty-state__title", text: title }) : null,
      body ? createElement("p", { className: "empty-state__body", text: body }) : null,
      dependencyNote
        ? createElement("div", { className: "empty-state__dependency", text: dependencyNote })
        : null,
      actions.length
        ? createElement("div", { className: "empty-state__actions" }, actions.map(actionNode))
        : null,
    ],
  );
}
