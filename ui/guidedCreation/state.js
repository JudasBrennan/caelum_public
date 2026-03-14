import { normalizeGuidedUxMode } from "./types.js";

function buildGuidedState(initial = {}) {
  return {
    objectType: String(initial.objectType || "").trim(),
    uxMode: normalizeGuidedUxMode(initial.uxMode),
    currentStepId: String(initial.currentStepId || "type").trim() || "type",
    selectedArchetypeId:
      initial.selectedArchetypeId == null ? null : String(initial.selectedArchetypeId),
    answers: { ...(initial.answers || {}) },
    archetypes: Array.isArray(initial.archetypes) ? [...initial.archetypes] : [],
    questions: Array.isArray(initial.questions) ? [...initial.questions] : [],
    recommendation: initial.recommendation || null,
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

export function setGuidedArchetypes(state, archetypes = []) {
  state.archetypes = Array.isArray(archetypes) ? [...archetypes] : [];
  return state;
}

export function setGuidedQuestions(state, questions = []) {
  state.questions = Array.isArray(questions) ? [...questions] : [];
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
