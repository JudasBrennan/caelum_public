import { appendChildren, createElement } from "../domHelpers.js";

function statusItemNode(item = {}) {
  const className = [
    "workflow-cockpit__status-item",
    item.className || "",
    item.tone ? `workflow-cockpit__status-item--${item.tone}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const node = createElement("div", { className, attrs: { id: item.id || null } });
  if (item.hidden) node.hidden = true;
  node.appendChild(
    createElement("div", {
      className: "workflow-cockpit__status-label",
      attrs: { id: item.labelId || null },
      text: item.label || "",
    }),
  );
  node.appendChild(
    createElement("div", {
      className: "workflow-cockpit__status-value",
      attrs: { id: item.valueId || null },
      text: item.value ?? "",
    }),
  );
  if (item.meta || item.metaId)
    node.appendChild(
      createElement("div", {
        className: "workflow-cockpit__status-meta",
        attrs: { id: item.metaId || null },
        text: item.meta || "",
      }),
    );
  return node;
}

function sourceNode(source = null) {
  if (!source) return null;
  const node = createElement("div", {
    className: ["workflow-cockpit__source", source.className || ""].filter(Boolean).join(" "),
    attrs: { id: source.id || null },
  });
  if (source.label)
    node.appendChild(
      createElement("div", {
        className: "workflow-cockpit__source-label",
        attrs: { id: source.labelId || null },
        text: source.label,
      }),
    );
  node.appendChild(
    createElement("div", {
      className: "workflow-cockpit__source-value",
      attrs: { id: source.valueId || null },
      text: source.value || "",
    }),
  );
  if (source.meta || source.metaId)
    node.appendChild(
      createElement("div", {
        className: "workflow-cockpit__source-meta",
        attrs: { id: source.metaId || null },
        text: source.meta,
      }),
    );
  return node;
}

function detailsNode(details = null) {
  if (!details) return null;
  const detailsEl = createElement("details", {
    className: ["workflow-cockpit__details", details.className || ""].filter(Boolean).join(" "),
    attrs: { id: details.id || null },
  });
  if (details.open) detailsEl.open = true;
  const summary = createElement("summary", {}, [
    createElement("span", { text: details.title || "Details" }),
    createElement("span", {
      attrs: { id: details.summaryId || null },
      text: details.summary || "",
    }),
  ]);
  detailsEl.appendChild(summary);
  const body = createElement("div", {
    className: ["workflow-cockpit__details-body", details.bodyClassName || ""]
      .filter(Boolean)
      .join(" "),
    attrs: { id: details.bodyId || null },
  });
  if (details.content) {
    appendChildren(body, details.content);
  }
  const items = Array.isArray(details.items) ? details.items : [];
  if (items.length) {
    const list = createElement("div", { className: "workflow-cockpit__details-list" });
    for (const item of items) {
      list.appendChild(
        createElement("div", { className: "workflow-cockpit__detail-item", text: item }),
      );
    }
    body.appendChild(list);
  }
  detailsEl.appendChild(body);
  return detailsEl;
}

export function createContextCockpit({
  id = "",
  className = "",
  ariaLabel = "",
  eyebrow = "",
  title = "",
  summary = "",
  summaryId = "",
  statusItems = [],
  source = null,
  details = null,
  footer = null,
} = {}) {
  const root = createElement("section", {
    className: ["workflow-cockpit", className].filter(Boolean).join(" "),
    attrs: {
      id: id || null,
      "aria-label": ariaLabel || null,
      "data-workflow-component": "context-cockpit",
    },
  });

  const overview = createElement("div", { className: "workflow-cockpit__overview" });
  const copy = createElement("div", { className: "workflow-cockpit__copy" });
  if (eyebrow)
    copy.appendChild(
      createElement("div", { className: "workflow-cockpit__eyebrow", text: eyebrow }),
    );
  if (title)
    copy.appendChild(createElement("h2", { className: "workflow-cockpit__title", text: title }));
  if (summary || summaryId)
    copy.appendChild(
      createElement("p", {
        className: "workflow-cockpit__summary",
        attrs: { id: summaryId || null },
        text: summary,
      }),
    );
  overview.appendChild(copy);

  const visibleStatusItems = (Array.isArray(statusItems) ? statusItems : []).map(statusItemNode);
  if (visibleStatusItems.length) {
    overview.appendChild(
      createElement(
        "div",
        {
          className: "workflow-cockpit__status-grid",
          attrs: { "aria-label": "Current workflow status" },
        },
        visibleStatusItems,
      ),
    );
  }
  root.appendChild(overview);

  const sourceSummary = sourceNode(source);
  if (sourceSummary) root.appendChild(sourceSummary);
  const detailsSummary = detailsNode(details);
  if (detailsSummary) root.appendChild(detailsSummary);
  if (footer) root.appendChild(footer);
  return root;
}
