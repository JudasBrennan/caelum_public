import { createElement } from "../domHelpers.js";

function normalizeItems(items = []) {
  return (Array.isArray(items) ? items : []).filter(
    (item) => item && item.label && item.value != null && item.value !== "",
  );
}

export function createStarResultSummary(summary = {}) {
  const body = String(summary.body || "").trim();
  if (!body) return null;

  const items = normalizeItems(summary.items);
  return createElement(
    "section",
    {
      className: "star-result-summary result-summary",
      attrs: {
        id: "starResultSummary",
        "data-tone": summary.tone || "neutral",
        "aria-label": "Star result summary",
      },
    },
    [
      createElement("div", {
        className: "star-result-summary__eyebrow result-summary__eyebrow",
        text: "Result Summary",
      }),
      createElement("p", {
        className: "star-result-summary__body result-summary__body",
        text: body,
      }),
      items.length
        ? createElement(
            "div",
            { className: "star-result-summary__items result-summary__items" },
            items.map((item) =>
              createElement(
                "div",
                { className: "star-result-summary__item result-summary__item" },
                [
                  createElement("span", {
                    className: "star-result-summary__item-label result-summary__item-label",
                    text: item.label,
                  }),
                  createElement("span", {
                    className: "star-result-summary__item-value result-summary__item-value",
                    text: item.value,
                  }),
                ],
              ),
            ),
          )
        : null,
    ],
  );
}

export function renderStarResultSummary(container, summary = {}) {
  if (!container) return container;
  container.querySelector("#starResultSummary")?.remove();
  const node = createStarResultSummary(summary);
  if (node) container.insertBefore(node, container.firstChild);
  return container;
}
