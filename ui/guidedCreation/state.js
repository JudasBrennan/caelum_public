import { normalizeGuidedSearchStatus, normalizeGuidedUxMode } from "./types.js";

function buildGuidedState(initial = {}) {
  const lastSearchResult =
    initial.lastSearchResult && typeof initial.lastSearchResult === "object"
      ? { ...initial.lastSearchResult }
      : null;
  return {
    objectType: String(initial.objectType || "").trim(),
    uxMode: normalizeGuidedUxMode(initial.uxMode),
    currentStepId: String(initial.currentStepId || "type").trim() || "type",
    selectedArchetypeId:
      initial.selectedArchetypeId == null ? null : String(initial.selectedArchetypeId),
    selectedGoalTemplateId:
      initial.selectedGoalTemplateId == null ? null : String(initial.selectedGoalTemplateId),
    answers: { ...(initial.answers || {}) },
    goalDraft:
      initial.goalDraft && typeof initial.goalDraft === "object" && !Array.isArray(initial.goalDraft)
        ? { ...initial.goalDraft }
        : {},
    archetypes: Array.isArray(initial.archetypes) ? [...initial.archetypes] : [],
    questions: Array.isArray(initial.questions) ? [...initial.questions] : [],
    compileDiagnostics: Array.isArray(initial.compileDiagnostics)
      ? [...initial.compileDiagnostics]
      : [],
    compiledGoal:
      initial.compiledGoal && typeof initial.compiledGoal === "object"
        ? { ...initial.compiledGoal }
        : null,
    searchStatus: normalizeGuidedSearchStatus(initial.searchStatus),
    searchGeneration: Number.isFinite(Number(initial.searchGeneration))
      ? Number(initial.searchGeneration)
      : 0,
    activeSearchJobId: String(initial.activeSearchJobId || ""),
    lastSearchResult,
    lastSearchContextFingerprint: String(initial.lastSearchContextFingerprint || ""),
    lastSearchEngineFingerprint: String(initial.lastSearchEngineFingerprint || ""),
    searchError: String(initial.searchError || ""),
    recommendation: initial.recommendation || lastSearchResult?.recommendation || null,
  };
}

export function createGuidedState(initial = {}) {
  return buildGuidedState(initial);
}

export function setGuidedStep(state, stepId) {
  state.currentStepId = String(stepId || "type").trim() || "type";
  return state;
}

export function selectGuidedArchetype(state, archetypeId) {
  state.selectedArchetypeId = archetypeId == null ? null : String(archetypeId);
  return state;
}

export function selectGuidedGoalTemplate(state, goalTemplateId) {
  state.selectedGoalTemplateId = goalTemplateId == null ? null : String(goalTemplateId);
  return state;
}

export function setGuidedAnswer(state, key, value) {
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) return state;
  state.answers[normalizedKey] = value;
  return state;
}

export function setGuidedAnswers(state, answers = {}) {
  Object.assign(state.answers, answers || {});
  return state;
}

export function setGuidedGoalDraftValue(state, key, value) {
  const normalizedKey = String(key || "").trim();
  if (!normalizedKey) return state;
  state.goalDraft[normalizedKey] = value;
  return state;
}

export function setGuidedGoalDraft(state, goalDraft = {}) {
  state.goalDraft =
    goalDraft && typeof goalDraft === "object" && !Array.isArray(goalDraft) ? { ...goalDraft } : {};
  return state;
}

export function setGuidedArchetypes(state, archetypes = []) {
  state.archetypes = Array.isArray(archetypes) ? [...archetypes] : [];
  return state;
}

export function setGuidedQuestions(state, questions = []) {
  state.questions = Array.isArray(questions) ? [...questions] : [];
  return state;
}

export function setGuidedCompileDiagnostics(state, diagnostics = []) {
  state.compileDiagnostics = Array.isArray(diagnostics) ? [...diagnostics] : [];
  return state;
}

export function setGuidedCompiledGoal(state, compiledGoal = null) {
  state.compiledGoal =
    compiledGoal && typeof compiledGoal === "object" ? { ...compiledGoal } : null;
  return state;
}

export function setGuidedSearchState(state, patch = {}) {
  if (Object.prototype.hasOwnProperty.call(patch, "searchStatus")) {
    state.searchStatus = normalizeGuidedSearchStatus(patch.searchStatus);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "searchGeneration")) {
    state.searchGeneration = Number.isFinite(Number(patch.searchGeneration))
      ? Number(patch.searchGeneration)
      : 0;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "activeSearchJobId")) {
    state.activeSearchJobId = String(patch.activeSearchJobId || "");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "lastSearchResult")) {
    state.lastSearchResult =
      patch.lastSearchResult && typeof patch.lastSearchResult === "object"
        ? { ...patch.lastSearchResult }
        : null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "lastSearchContextFingerprint")) {
    state.lastSearchContextFingerprint = String(patch.lastSearchContextFingerprint || "");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "lastSearchEngineFingerprint")) {
    state.lastSearchEngineFingerprint = String(patch.lastSearchEngineFingerprint || "");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "searchError")) {
    state.searchError = String(patch.searchError || "");
  }
  return state;
}

export function setGuidedRecommendation(state, recommendation = null) {
  state.recommendation = recommendation || null;
  return state;
}

export function resetGuidedState(state, initial = {}) {
  const next = buildGuidedState(initial);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, next);
  return state;
}
