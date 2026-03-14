import { sortDiagnostics, hasBlockingDiagnostics } from "./diagnostics.js";
import {
  createGuidedState,
  resetGuidedState,
  selectGuidedArchetype,
  setGuidedAnswer,
  setGuidedAnswers,
  setGuidedArchetypes,
  setGuidedQuestions,
  setGuidedRecommendation,
  setGuidedStep,
} from "./state.js";
import { validateGuidedAdapter } from "./registry.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRecommendation(recommendation, state, adapter) {
  if (!recommendation || typeof recommendation !== "object") return null;
  const diagnostics = sortDiagnostics(recommendation.diagnostics || []);
  return {
    ...recommendation,
    objectType: String(recommendation.objectType || adapter.objectType || "").trim(),
    archetypeId:
      recommendation.archetypeId == null
        ? state.selectedArchetypeId
        : String(recommendation.archetypeId),
    diagnostics,
    hasBlockingDiagnostics: hasBlockingDiagnostics(diagnostics),
    rationale: asArray(recommendation.rationale),
    nextActions: asArray(recommendation.nextActions),
    scienceModeRecommendation:
      recommendation.scienceModeRecommendation &&
      typeof recommendation.scienceModeRecommendation === "object"
        ? { ...recommendation.scienceModeRecommendation }
        : {},
    applyPayload:
      recommendation.applyPayload && typeof recommendation.applyPayload === "object"
        ? {
            objectInputs:
              recommendation.applyPayload.objectInputs &&
              typeof recommendation.applyPayload.objectInputs === "object"
                ? { ...recommendation.applyPayload.objectInputs }
                : {},
            parentPatch:
              recommendation.applyPayload.parentPatch &&
              typeof recommendation.applyPayload.parentPatch === "object"
                ? { ...recommendation.applyPayload.parentPatch }
                : null,
            siblingPatch:
              recommendation.applyPayload.siblingPatch &&
              typeof recommendation.applyPayload.siblingPatch === "object"
                ? { ...recommendation.applyPayload.siblingPatch }
                : null,
          }
        : {
            objectInputs: {},
            parentPatch: null,
            siblingPatch: null,
          },
  };
}

export function createGuidedFlowController({
  adapter,
  context = {},
  initialState = {},
  onUpdate,
} = {}) {
  const validation = validateGuidedAdapter(adapter);
  if (!validation.valid) {
    throw new TypeError(validation.errors.join(" "));
  }

  const state = createGuidedState({
    objectType: adapter.objectType,
    ...initialState,
  });

  function buildArchetypes() {
    const archetypes = asArray(adapter.listArchetypes(context, state));
    setGuidedArchetypes(state, archetypes);
    return archetypes;
  }

  function buildQuestions() {
    if (!state.selectedArchetypeId) {
      setGuidedQuestions(state, []);
      return [];
    }
    const questions = asArray(adapter.buildQuestions(state, context)).filter((question) => {
      if (typeof question?.visibleWhen !== "function") return true;
      return question.visibleWhen(state) !== false;
    });
    setGuidedQuestions(state, questions);
    return questions;
  }

  function buildRecommendation() {
    if (!state.selectedArchetypeId) {
      setGuidedRecommendation(state, null);
      return null;
    }
    const recommendation = normalizeRecommendation(
      adapter.solveRecommendation(state, context),
      state,
      adapter,
    );
    setGuidedRecommendation(state, recommendation);
    return recommendation;
  }

  function snapshot() {
    return {
      state,
      archetypes: state.archetypes,
      questions: state.questions,
      recommendation: state.recommendation,
    };
  }

  function notify() {
    const value = snapshot();
    if (typeof onUpdate === "function") onUpdate(value);
    return value;
  }

  function sync() {
    buildArchetypes();
    buildQuestions();
    buildRecommendation();
    return notify();
  }

  const controller = {
    getState() {
      return state;
    },

    getSnapshot() {
      return snapshot();
    },

    refresh() {
      return sync();
    },

    selectArchetype(archetypeId) {
      selectGuidedArchetype(state, archetypeId);
      return sync();
    },

    setAnswer(key, value) {
      setGuidedAnswer(state, key, value);
      return sync();
    },

    setAnswers(answers) {
      setGuidedAnswers(state, answers);
      return sync();
    },

    setStep(stepId) {
      setGuidedStep(state, stepId);
      return notify();
    },

    reset(nextInitialState = {}) {
      resetGuidedState(state, {
        objectType: adapter.objectType,
        ...nextInitialState,
      });
      return sync();
    },

    apply(storeContext = {}) {
      return adapter.applyRecommendation(state.recommendation, storeContext, context, state);
    },
  };

  sync();
  return controller;
}
