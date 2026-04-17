import { createGoalTextAssist } from "./components/goalTextAssist.js";
import { getGoalTextAliasHelp } from "./goalAliases.js";
import {
  applyGuidedGoalTextInterpretation,
  clearGuidedGoalTextInterpretation,
} from "./goalTextInterpretation.js";

const DEFAULT_GOAL_FIELD_MAP = Object.freeze({
  priority: "priority",
  allowedEdits: "allowedEdits",
  searchBudget: "searchBudget",
});

const DEFAULT_GOAL_STATUS_TITLES = Object.freeze({
  searching: "Goal search in progress",
  complete: "Goal search result ready",
  ready: "Goal compiled",
  error: "Goal compile or search blocked",
  canceled: "Goal search canceled",
  "needs-compile": "Goal needs compile",
});

const NEEDS_COMPILE_DETAIL =
  "Compile the goal or run the search again after changing setup or traits.";
const DEFAULT_COMPLETE_DETAIL = "Review the result and diagnostics before applying.";
const RESTORED_RESULT_DETAIL =
  "A previous search result is still visible below until you re-run the search.";

function getGoalDraft(flowState) {
  return flowState?.goalDraft &&
    typeof flowState.goalDraft === "object" &&
    !Array.isArray(flowState.goalDraft)
    ? flowState.goalDraft
    : {};
}

function getTraitRoles(goalDraft) {
  return goalDraft?.traitRoles &&
    typeof goalDraft.traitRoles === "object" &&
    !Array.isArray(goalDraft.traitRoles)
    ? goalDraft.traitRoles
    : {};
}

function resolveGoalFieldMap(options = {}) {
  return {
    ...DEFAULT_GOAL_FIELD_MAP,
    ...(options?.questionFieldMap || {}),
  };
}

export function buildGuidedGoalQuestionValues(flowState, questions = [], options = {}) {
  const goalDraft = getGoalDraft(flowState);
  const traitRoles = getTraitRoles(goalDraft);
  const fieldMap = resolveGoalFieldMap(options);
  const values = {};

  for (const question of Array.isArray(questions) ? questions : []) {
    const questionId = String(question?.id || "");
    const fieldKey = fieldMap[questionId];
    if (fieldKey) {
      values[questionId] = goalDraft[fieldKey] || question?.defaultValue;
      continue;
    }
    if (questionId.startsWith("traitRole:")) {
      const traitId = questionId.slice("traitRole:".length);
      values[questionId] = traitRoles[traitId] || "off";
    }
  }

  return values;
}

export function setGuidedGoalDraftValue(controllerRef, flowState, questionId, value, options = {}) {
  const normalizedId = String(questionId || "");
  if (!normalizedId) return;

  const fieldMap = resolveGoalFieldMap(options);
  const fieldKey = fieldMap[normalizedId];
  if (fieldKey) {
    controllerRef?.setGoalDraftValue(fieldKey, value);
    return;
  }

  if (normalizedId.startsWith("traitRole:")) {
    const traitId = normalizedId.slice("traitRole:".length);
    const currentGoalDraft = getGoalDraft(flowState);
    const nextTraitRoles = { ...getTraitRoles(currentGoalDraft) };
    if (!value || value === "off") delete nextTraitRoles[traitId];
    else nextTraitRoles[traitId] = value;
    controllerRef?.setGoalDraft({
      ...currentGoalDraft,
      traitRoles: nextTraitRoles,
    });
  }
}

export function buildGuidedGoalTextAssist(
  resolveController,
  flowState,
  { objectType = "", objectLabel = "world" } = {},
) {
  const goalDraft = getGoalDraft(flowState);
  const help = getGoalTextAliasHelp(objectType);
  return createGoalTextAssist({
    objectLabel,
    value: goalDraft.goalText || "",
    placeholder: help.placeholder,
    examples: help.examples,
    interpretation: goalDraft.goalTextInterpretation || null,
    onInterpret: (value) =>
      applyGuidedGoalTextInterpretation(resolveController?.(), flowState, objectType, value),
    onClear: () => clearGuidedGoalTextInterpretation(resolveController?.(), flowState),
  });
}

export function buildGuidedGoalStatus(flowState, options = {}) {
  const compileDiagnostics = Array.isArray(flowState?.compileDiagnostics)
    ? flowState.compileDiagnostics
    : [];
  const searchStatus = String(flowState?.searchStatus || "idle");
  const hasRestoredResult = !!flowState?.lastSearchResult?.recommendation;
  const resolvedTitles = {
    ...DEFAULT_GOAL_STATUS_TITLES,
    ...(options?.titles || {}),
  };
  const completeTitleWithoutResult = String(options?.completeTitleWithoutResult || "");

  const title =
    searchStatus === "complete" && !hasRestoredResult && completeTitleWithoutResult
      ? completeTitleWithoutResult
      : resolvedTitles[searchStatus] || "";

  const detailParts = [];
  if (searchStatus === "needs-compile") {
    detailParts.push(NEEDS_COMPILE_DETAIL);
  } else if (searchStatus === "ready" && options?.readyDetail) {
    detailParts.push(options.readyDetail);
  } else if (searchStatus === "searching" && options?.searchingDetail) {
    detailParts.push(options.searchingDetail);
  } else if (searchStatus === "complete") {
    detailParts.push(options?.completeDetail || DEFAULT_COMPLETE_DETAIL);
  } else if (searchStatus === "error" && flowState?.searchError) {
    detailParts.push(flowState.searchError);
  }

  if (searchStatus !== "complete" && hasRestoredResult) {
    detailParts.push(RESTORED_RESULT_DETAIL);
  }

  return {
    compileStatus: compileDiagnostics.length
      ? "error"
      : searchStatus === "ready" || searchStatus === "complete"
        ? "ready"
        : searchStatus,
    searchStatus,
    title,
    detail: detailParts.join(" "),
    diagnostics: compileDiagnostics,
  };
}
