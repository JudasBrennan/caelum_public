import { createElement } from "./domHelpers.js";

function normalizeSummaryItems(items = []) {
  return (Array.isArray(items) ? items : []).filter(
    (item) => item && item.label && item.value != null && item.value !== "",
  );
}

export function createResultSummary(summary = {}, options = {}) {
  const body = String(summary.body || "").trim();
  if (!body) return null;

  const items = normalizeSummaryItems(summary.items);
  const subject = options.subject || "Result";
  return createElement(
    "section",
    {
      className: `${options.className || ""} result-summary`.trim(),
      attrs: {
        id: options.id || "resultSummary",
        "data-tone": summary.tone || "neutral",
        "aria-label": options.ariaLabel || `${subject} result summary`,
      },
    },
    [
      createElement("div", { className: "result-summary__eyebrow", text: "Result Summary" }),
      createElement("p", { className: "result-summary__body", text: body }),
      items.length
        ? createElement(
            "div",
            { className: "result-summary__items" },
            items.map((item) =>
              createElement("div", { className: "result-summary__item" }, [
                createElement("span", {
                  className: "result-summary__item-label",
                  text: item.label,
                }),
                createElement("span", {
                  className: "result-summary__item-value",
                  text: item.value,
                }),
              ]),
            ),
          )
        : null,
    ],
  );
}

export function renderResultSummary(container, summary = {}, options = {}) {
  if (!container) return container;
  const id = options.id || "resultSummary";
  Array.from(container.children)
    .find((node) => node.id === id)
    ?.remove();
  const node = createResultSummary(summary, options);
  if (node) container.insertBefore(node, container.firstChild);
  return container;
}
