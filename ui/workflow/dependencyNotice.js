import { createElement } from "../domHelpers.js";

const TONE_CLASS = Object.freeze({
  info: "dependency-notice--info",
  "info-only": "dependency-notice--info-only",
  warn: "dependency-notice--warn",
  bad: "dependency-notice--bad",
});

function actionNode(action = {}) {
  const tagName = action.href ? "a" : "button";
  const attrs = {
    ...(action.attrs || {}),
    ...(action.href ? { href: action.href } : { type: action.type || "button" }),
  };
  const node = createElement(tagName, {
    className: "dependency-notice__action",
    attrs,
    text: action.label || "",
  });
  if (action.disabled) node.disabled = true;
  if (typeof action.onClick === "function") node.addEventListener("click", action.onClick);
  return node;
}

export function createDependencyNotice({
  id = "",
  className = "",
  tone = "info",
  title = "",
  body = "",
  source = "",
  actions = [],
} = {}) {
  const role = tone === "bad" || tone === "warn" ? "alert" : "status";
  const root = createElement("aside", {
    className: ["dependency-notice", TONE_CLASS[tone] || TONE_CLASS.info, className]
      .filter(Boolean)
      .join(" "),
    attrs: {
      id: id || null,
      "data-workflow-component": "dependency-notice",
      role: tone === "info-only" ? null : role,
    },
  });
  const copy = createElement("div", { className: "dependency-notice__copy" });
  if (title)
    copy.appendChild(createElement("div", { className: "dependency-notice__title", text: title }));
  if (body)
    copy.appendChild(createElement("p", { className: "dependency-notice__body", text: body }));
  if (source)
    copy.appendChild(
      createElement("div", { className: "dependency-notice__source", text: source }),
    );
  root.appendChild(copy);
  const actionNodes = (Array.isArray(actions) ? actions : []).map(actionNode);
  if (actionNodes.length) {
    root.appendChild(
      createElement("div", { className: "dependency-notice__actions" }, actionNodes),
    );
  }
  return root;
}
