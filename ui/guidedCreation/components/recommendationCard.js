import { createElement } from "../../domHelpers.js";
import { createConfidenceBadge } from "./confidenceBadge.js";

function createStringList(items = [], className, emptyText = "") {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  if (!normalized.length) {
    return emptyText ? createElement("div", { className, text: emptyText }) : null;
  }
  return createElement(
    "ul",
    { className },
    normalized.map((item) => createElement("li", { text: item })),
  );
}

function createScienceModeList(scienceModes = {}) {
  const rows = Object.entries(scienceModes || {}).filter(
    ([, value]) => value != null && value !== "",
  );
  if (!rows.length) return null;
  return createElement(
    "div",
    { className: "guided-recommendation__modes" },
    rows.map(([key, value]) =>
      createElement("div", { className: "guided-recommendation__mode-row" }, [
        createElement("b", { text: `${key}:` }),
        " ",
        String(value),
      ]),
    ),
  );
}

export function createRecommendationCard({ recommendation = null, previewContent = null } = {}) {
  if (!recommendation) {
    return createElement("div", {
      className: "guided-recommendation guided-recommendation--empty",
      text: "No recommendation yet.",
    });
  }

  return createElement("div", { className: "guided-recommendation" }, [
    createElement("div", { className: "guided-recommendation__head" }, [
      createElement("div", { className: "guided-recommendation__title" }, [
        createElement("span", { text: recommendation.title || "Recommendation" }),
        " ",
        createConfidenceBadge(recommendation.confidenceClass),
      ]),
      recommendation.summary
        ? createElement("div", {
            className: "guided-recommendation__summary",
            text: recommendation.summary,
          })
        : null,
    ]),
    previewContent
      ? createElement("div", { className: "guided-recommendation__preview" }, [previewContent])
      : null,
    createScienceModeList(recommendation.scienceModeRecommendation),
    recommendation.contextAdjustments?.length
      ? createElement("div", { className: "guided-recommendation__section" }, [
          createElement("div", {
            className: "guided-recommendation__section-title",
            text: "Context Adjustments",
          }),
          createStringList(recommendation.contextAdjustments, "guided-recommendation__list"),
        ])
      : null,
    recommendation.rationale?.length
      ? createElement("div", { className: "guided-recommendation__section" }, [
          createElement("div", {
            className: "guided-recommendation__section-title",
            text: "Why This Works",
          }),
          createStringList(recommendation.rationale, "guided-recommendation__list"),
        ])
      : null,
    recommendation.nextActions?.length
      ? createElement("div", { className: "guided-recommendation__section" }, [
          createElement("div", {
            className: "guided-recommendation__section-title",
            text: "Suggested Next Actions",
          }),
          createStringList(recommendation.nextActions, "guided-recommendation__list"),
        ])
      : null,
  ]);
}
