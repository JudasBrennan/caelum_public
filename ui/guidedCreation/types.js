export const GUIDED_CONFIDENCE_CLASSES = ["defensible", "plausible", "speculative"];
export const GUIDED_DIAGNOSTIC_SEVERITIES = ["blocked", "warning", "info"];
export const GUIDED_QUESTION_KINDS = ["choice", "number", "toggle", "select"];
export const GUIDED_UX_MODES = ["quick", "guided", "advanced"];

/**
 * @typedef {"defensible" | "plausible" | "speculative"} GuidedConfidenceClass
 * @typedef {"blocked" | "warning" | "info"} GuidedDiagnosticSeverity
 * @typedef {"choice" | "number" | "toggle" | "select"} GuidedQuestionKind
 * @typedef {"quick" | "guided" | "advanced"} GuidedUxMode
 *
 * @typedef {object} GuidedDiagnostic
 * @property {GuidedDiagnosticSeverity} [severity]
 * @property {string} [code]
 * @property {string} [title]
 * @property {string} [detail]
 * @property {string[]} [suggestedActions]
 *
 * @typedef {object} GuidedQuestionOption
 * @property {string | number | boolean} value
 * @property {string} label
 * @property {string} [description]
 *
 * @typedef {object} GuidedQuestionDescriptor
 * @property {string} id
 * @property {string} [stepId]
 * @property {string} label
 * @property {GuidedQuestionKind} [kind]
 * @property {string} [help]
 * @property {string} [placeholder]
 * @property {string | number | boolean | null} [defaultValue]
 * @property {GuidedQuestionOption[]} [options]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {(flowState: object) => boolean} [visibleWhen]
 *
 * @typedef {object} GuidedApplyPayload
 * @property {object} [objectInputs]
 * @property {object | null} [parentPatch]
 * @property {object | null} [siblingPatch]
 *
 * @typedef {object} GuidedRecommendation
 * @property {string} [objectType]
 * @property {string} [archetypeId]
 * @property {GuidedConfidenceClass} [confidenceClass]
 * @property {string} [title]
 * @property {string} [summary]
 * @property {object} [scienceModeRecommendation]
 * @property {GuidedApplyPayload} [applyPayload]
 * @property {object} [previewPayload]
 * @property {GuidedDiagnostic[]} [diagnostics]
 * @property {string[]} [rationale]
 * @property {string[]} [nextActions]
 *
 * @typedef {object} GuidedArchetypeDescriptor
 * @property {string} id
 * @property {string} objectType
 * @property {string} label
 * @property {string} [shortLabel]
 * @property {string} [summary]
 * @property {GuidedConfidenceClass} [confidenceClass]
 * @property {boolean} [quickEnabled]
 * @property {boolean} [guidedEnabled]
 * @property {string[]} [tags]
 * @property {boolean} [requiresParentContext]
 * @property {boolean} [requiresSiblingContext]
 * @property {object} [recommendedScienceModes]
 * @property {(context: object) => object} [buildSeed]
 * @property {(context: object) => GuidedQuestionDescriptor[]} [buildQuestions]
 * @property {(flowState: object, context: object) => GuidedRecommendation | null} [solveRecommendation]
 *
 * @typedef {object} GuidedAdapter
 * @property {string} objectType
 * @property {(context: object, flowState?: object) => GuidedArchetypeDescriptor[]} listArchetypes
 * @property {(flowState: object, context: object) => GuidedQuestionDescriptor[]} buildQuestions
 * @property {(flowState: object, context: object) => GuidedRecommendation | null} solveRecommendation
 * @property {(recommendation: GuidedRecommendation | null, storeContext?: object, context?: object, flowState?: object) => unknown} applyRecommendation
 */

function normalizeValue(value, allowed, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

export function normalizeGuidedConfidenceClass(value) {
  return normalizeValue(value, GUIDED_CONFIDENCE_CLASSES, "plausible");
}

export function normalizeGuidedDiagnosticSeverity(value) {
  return normalizeValue(value, GUIDED_DIAGNOSTIC_SEVERITIES, "info");
}

export function normalizeGuidedQuestionKind(value) {
  return normalizeValue(value, GUIDED_QUESTION_KINDS, "choice");
}

export function normalizeGuidedUxMode(value) {
  return normalizeValue(value, GUIDED_UX_MODES, "guided");
}

export function guidedConfidenceLabel(confidenceClass) {
  switch (normalizeGuidedConfidenceClass(confidenceClass)) {
    case "defensible":
      return "Defensible";
    case "speculative":
      return "Speculative";
    case "plausible":
    default:
      return "Plausible";
  }
}

export function guidedDiagnosticSeverityLabel(severity) {
  switch (normalizeGuidedDiagnosticSeverity(severity)) {
    case "blocked":
      return "Blocked";
    case "warning":
      return "Warning";
    case "info":
    default:
      return "Info";
  }
}
