import { createElement } from "../../domHelpers.js";
import { guidedConfidenceLabel, normalizeGuidedConfidenceClass } from "../types.js";

export function createConfidenceBadge(confidenceClass, { className = "" } = {}) {
  const normalized = normalizeGuidedConfidenceClass(confidenceClass);
  return createElement("span", {
    className: `guided-confidence-badge guided-confidence-badge--${normalized} ${className}`.trim(),
    dataset: { confidenceClass: normalized },
    text: guidedConfidenceLabel(normalized),
  });
}
