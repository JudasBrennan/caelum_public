export const GUIDED_ENTRY_MODE_TOOLTIPS = Object.freeze({
  quick:
    "Applies a prepared archetype or recipe-backed starting point immediately. Likely impact: several linked inputs change at once, but no goal search is run.",
  guided:
    "Walks through goals, scope, and trade-offs before building a recommendation. Likely impact: the result is usually more context-aware and may propose broader edits if you allow them.",
  recipes:
    "Applies a preset template for a specific starting point. Likely impact: the current object's inputs are replaced by the recipe values.",
  advanced:
    "Direct manual editing mode. Likely impact: you change fields yourself without guided search or preset interpretation.",
});

export const GUIDED_STEP_TOOLTIPS = Object.freeze({
  type: "Choose the outcome or archetype you want. Likely impact: this determines which defaults, traits, and search paths are available.",
  "stellar-context":
    "Choose search scope, tolerance for edits, and search depth. Likely impact: broader scope can produce a stronger fit but may move further from the current system state.",
  "orbit-context":
    "Choose search scope, tolerance for edits, and search depth. Likely impact: broader scope can move the orbit or mass further to reach the requested outcome.",
  "parent-context":
    "Choose search scope, tolerance for parent fixes, and search depth. Likely impact: broader scope can improve moon outcomes but may also modify the host or sibling context.",
  "goal-details":
    "Refine which traits matter most. Likely impact: hard requirements narrow the search, while preferences steer the ranking without forcing an exact match.",
  recommendation:
    "Review the best current fit, diagnostics, and apply path. Likely impact: applying here overwrites the affected inputs and any listed host or moon-system fixes.",
});

export const GUIDED_ACTION_TOOLTIPS = Object.freeze({
  back: "Return to the previous step without discarding the current guided selections.",
  next: "Move to the next step. Likely impact: keeps the current answers and reveals the next layer of guided controls.",
  compile:
    "Turn the current goal, setup, and traits into a structured search target. Likely impact: no world changes yet; this only validates the request and surfaces blockers.",
  "run-search":
    "Try seeded candidates inside the allowed edit scope. Likely impact: the recommendation may change substantially if the broader search finds a better fit.",
  apply:
    "Write the current recommendation into the editor inputs. Likely impact: the affected object fields, and any listed host or moon-system fixes, are applied immediately.",
  "apply-advanced":
    "Apply the recommendation, then return to the direct editor. Likely impact: affected inputs are overwritten first, and you can continue refining manually afterward.",
  reset: "Clear the current guided session and restore the flow to its defaults.",
});

export function getGuidedEntryModeTooltip(mode = "") {
  return GUIDED_ENTRY_MODE_TOOLTIPS[String(mode || "").trim()] || "";
}

export function getGuidedStepTooltip(stepId = "") {
  return GUIDED_STEP_TOOLTIPS[String(stepId || "").trim()] || "";
}

export function getGuidedActionTooltip(actionId = "") {
  return GUIDED_ACTION_TOOLTIPS[String(actionId || "").trim()] || "";
}

export function buildGuidedGoalTextTooltip(objectLabel = "object") {
  return `Describe the ${objectLabel} you want in plain language. Likely impact: interpretation only pre-fills supported goals and traits; it does not run a search or change inputs yet.`;
}

export const GUIDED_GOAL_TEXT_BUTTON_TOOLTIPS = Object.freeze({
  interpret:
    "Interpret the typed request into supported goal templates and trait hints. Likely impact: current guided goal selections may be replaced, but nothing is applied yet.",
  clear:
    "Clear the typed goal and its interpretation. Likely impact: any suggestion-only draft created from the text prompt is discarded.",
});
