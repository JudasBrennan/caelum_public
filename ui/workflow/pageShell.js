import { appendChildren, createElement } from "../domHelpers.js";

function appendOptional(parent, child) {
  if (child == null || child === false) return parent;
  appendChildren(parent, child);
  return parent;
}

function createHeaderAction(action = {}) {
  const tagName = action.href ? "a" : "button";
  const attrs = {
    ...(action.attrs || {}),
    ...(action.href ? { href: action.href } : { type: action.type || "button" }),
  };
  const node = createElement(tagName, {
    className: action.className || "workflow-page-shell__action",
    attrs,
    text: action.label || "",
  });
  if (action.disabled) node.disabled = true;
  if (typeof action.onClick === "function") node.addEventListener("click", action.onClick);
  return node;
}

export function createPageHeader({
  iconClass = "",
  title = "",
  task = "",
  primaryAction = null,
  helpAction = null,
  statusBadge = "",
} = {}) {
  const header = createElement("div", { className: "workflow-page-shell__header" });
  const titleWrap = createElement("div", { className: "workflow-page-shell__title-wrap" });
  const heading = createElement("h1", { className: "panel__title workflow-page-shell__title" });
  if (iconClass) {
    heading.appendChild(
      createElement("span", {
        className: `ws-icon ${iconClass}`,
        attrs: { "aria-hidden": "true" },
      }),
    );
  }
  heading.appendChild(createElement("span", { text: title }));
  titleWrap.appendChild(heading);
  if (task)
    titleWrap.appendChild(
      createElement("p", { className: "workflow-page-shell__task", text: task }),
    );
  header.appendChild(titleWrap);

  const actions = createElement("div", { className: "workflow-page-shell__actions" });
  appendOptional(actions, primaryAction ? createHeaderAction(primaryAction) : null);
  appendOptional(actions, helpAction ? createHeaderAction(helpAction) : null);
  if (statusBadge)
    actions.appendChild(createElement("div", { className: "badge", text: statusBadge }));
  if (actions.childNodes.length) header.appendChild(actions);
  return header;
}

export function createPageShell({
  iconClass = "",
  title = "",
  task = "",
  primaryAction = null,
  helpAction = null,
  statusBadge = "",
  children = [],
} = {}) {
  const page = createElement("div", { className: "page workflow-page-shell" });
  const panel = createElement("div", { className: "panel" });
  panel.appendChild(
    createPageHeader({ iconClass, title, task, primaryAction, helpAction, statusBadge }),
  );
  panel.appendChild(
    createElement("div", { className: "panel__body workflow-page-shell__body" }, children),
  );
  page.appendChild(panel);
  return page;
}
