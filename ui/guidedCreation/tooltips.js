import { structuredTip } from "../tooltipCopy.js";

export const GUIDED_ENTRY_MODE_TOOLTIPS = Object.freeze({
  quick: structuredTip({
    overview: "Apply a prepared archetype or recipe-backed starting point immediately.",
    changes: "Several linked inputs can change at once, but no guided goal search is run.",
    caveat: "Review the edited fields before saving if you need precise authored values.",
  }),
  guided: structuredTip({
    overview: "Walk through goals, scope, and trade-offs before building a recommendation.",
    feedsInto: "Goal compilation, search tolerance, diagnostics, and the final apply path.",
    caveat:
      "Broader scopes can produce stronger fits but may propose changes outside the current field.",
  }),
  recipes: structuredTip({
    overview: "Apply a preset template for a specific starting point.",
    changes: "The current object's inputs are replaced by recipe values.",
    caveat: "Recipes are curated starts, not searched optimisations.",
  }),
  advanced: structuredTip({
    overview: "Direct manual editing mode.",
    changes: "You change fields yourself without guided search or preset interpretation.",
    caveat: "Validation and derived outputs still come from the normal engine after edits commit.",
  }),
});

export const GUIDED_STEP_TOOLTIPS = Object.freeze({
  type: structuredTip({
    overview: "Choose the outcome or archetype you want.",
    feedsInto: "Available defaults, traits, diagnostics, and search paths.",
    caveat: "Changing type can invalidate later answers because the target changed.",
  }),
  "stellar-context": structuredTip({
    overview: "Set how far guided search may move stellar inputs.",
    feedsInto: "Search scope, tolerance, depth, and the strength of any host-level recommendation.",
    caveat:
      "Broader scope can find better fits but may move further from the current system state.",
  }),
  "orbit-context": structuredTip({
    overview: "Set how far guided search may move orbital or mass inputs.",
    feedsInto: "Candidate generation, diagnostics, and orbit/mass recommendation breadth.",
    caveat:
      "Broader scope can reach more outcomes but may depart more from the current authored orbit.",
  }),
  "parent-context": structuredTip({
    overview: "Set how far guided search may adjust the moon's parent context.",
    feedsInto: "Moon candidate scoring, parent fixes, and sibling-system recommendations.",
    caveat:
      "Broader scope can improve moon outcomes but may also modify the host or sibling context.",
  }),
  "goal-details": structuredTip({
    overview: "Refine which traits matter most for the guided target.",
    feedsInto: "Goal scoring, diagnostics, and recommendation ranking.",
    interpretAs:
      "Hard requirements narrow the search; preferences steer ranking without forcing an exact match.",
    caveat: "Conflicting hard requirements may produce no usable recommendation.",
  }),
  recommendation: structuredTip({
    overview: "Review the best current fit, diagnostics, and apply path.",
    drawnFrom: "The compiled target, allowed scope, candidate search, and engine diagnostics.",
    caveat: "Applying overwrites the affected inputs and any listed host or moon-system fixes.",
  }),
});

export const GUIDED_ACTION_TOOLTIPS = Object.freeze({
  back: structuredTip({
    overview: "Return to the previous guided step.",
    changes: "Keeps the current guided selections.",
  }),
  next: structuredTip({
    overview: "Move to the next guided step.",
    changes: "Keeps the current answers and reveals the next layer of guided controls.",
  }),
  compile: structuredTip({
    overview: "Turn the current goal, setup, and traits into a structured search target.",
    changes: "No world changes are applied; this only validates the request and surfaces blockers.",
    caveat: "A valid target can still fail later if no candidate satisfies the constraints.",
  }),
  "run-search": structuredTip({
    overview: "Try seeded candidates inside the allowed edit scope.",
    drawnFrom: "Current inputs, compiled goal, selected scope, and candidate diagnostics.",
    caveat: "The recommendation may change substantially if a broader search finds a better fit.",
  }),
  apply: structuredTip({
    overview: "Write the current recommendation into the editor inputs.",
    changes:
      "Affected object fields and any listed host or moon-system fixes are applied immediately.",
    caveat: "Review diagnostics first; this is the point where guided output becomes an edit.",
  }),
  "apply-advanced": structuredTip({
    overview: "Apply the recommendation, then return to the direct editor.",
    changes: "Affected inputs are overwritten first, then manual editing resumes.",
    caveat: "Useful when the guided result is close but still needs hand tuning.",
  }),
  reset: structuredTip({
    overview: "Clear the current guided session.",
    changes: "Restores guided answers, diagnostics, and recommendation state to defaults.",
    caveat: "Already-applied edits are not reverted by resetting the guided session.",
  }),
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
  return structuredTip({
    overview: `Describe the ${objectLabel} you want in plain language.`,
    feedsInto: "Supported goal templates, trait hints, and guided search target fields.",
    caveat: "Interpretation does not run a search or change saved inputs by itself.",
  });
}

export const GUIDED_GOAL_TEXT_BUTTON_TOOLTIPS = Object.freeze({
  interpret: structuredTip({
    overview: "Interpret the typed request into supported goal templates and trait hints.",
    changes: "Current guided goal selections may be replaced, but nothing is applied yet.",
    caveat: "Free text only maps onto supported goals; it is not an open-ended AI search.",
  }),
  clear: structuredTip({
    overview: "Clear the typed goal and its interpretation.",
    changes: "Any suggestion-only draft created from the text prompt is discarded.",
    caveat: "Already-applied edits are not reverted.",
  }),
});
