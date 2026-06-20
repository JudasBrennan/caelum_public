import { createElement } from "../domHelpers.js";

function actionNode(action = {}) {
  const tagName = action.href ? "a" : "button";
  const attrs = {
    ...(action.attrs || {}),
    id: action.id || null,
    ...(action.href ? { href: action.href } : { type: action.type || "button" }),
  };
  const node = createElement(tagName, {
    className: ["next-step-strip__action", action.primary ? "next-step-strip__action--primary" : ""]
      .filter(Boolean)
      .join(" "),
    attrs,
    text: action.label || "",
  });
  if (action.disabled) node.disabled = true;
  if (typeof action.onClick === "function") node.addEventListener("click", action.onClick);
  return node;
}

export function createNextStepStrip({
  id = "",
  className = "",
  recommendation = "",
  recommendationId = "",
  actions = [],
} = {}) {
  const root = createElement("div", {
    className: ["next-step-strip", className].filter(Boolean).join(" "),
    attrs: { id: id || null, "data-workflow-component": "next-step-strip" },
  });
  if (recommendation) {
    root.appendChild(
      createElement("div", {
        className: "next-step-strip__recommendation",
        attrs: { id: recommendationId || null },
        text: recommendation,
      }),
    );
  }
  const actionNodes = (Array.isArray(actions) ? actions : []).slice(0, 3).map(actionNode);
  if (actionNodes.length) {
    root.appendChild(
      createElement(
        "div",
        {
          className: "next-step-strip__actions",
          attrs: { role: "group", "aria-label": "Next steps" },
        },
        actionNodes,
      ),
    );
  }
  return root;
}
