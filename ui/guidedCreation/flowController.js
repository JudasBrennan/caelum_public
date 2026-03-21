import { sortDiagnostics, hasBlockingDiagnostics } from "./diagnostics.js";
import {
  createGuidedState,
  resetGuidedState,
  selectGuidedArchetype,
  selectGuidedGoalTemplate,
  setGuidedAnswer,
  setGuidedAnswers,
  setGuidedArchetypes,
  setGuidedQuestions,
  setGuidedRecommendation,
  setGuidedStep,
  setGuidedGoalDraft,
  setGuidedGoalDraftValue,
  setGuidedCompiledGoal,
  setGuidedCompileDiagnostics,
  setGuidedSearchState,
} from "./state.js";
import { validateGuidedAdapter } from "./registry.js";
import { createGuidedSolverJobRunner } from "./solverJob.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clonePlainObject(value, fallback = null) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : fallback;
}

function hasGuidedSelection(state) {
  return !!(state?.selectedGoalTemplateId || state?.selectedArchetypeId);
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
            systemInputs:
              recommendation.applyPayload.systemInputs &&
              typeof recommendation.applyPayload.systemInputs === "object"
                ? { ...recommendation.applyPayload.systemInputs }
                : null,
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
            systemInputs: null,
            parentPatch: null,
            siblingPatch: null,
          },
  };
}

function defaultCompiledGoal(state, adapter) {
  if (!hasGuidedSelection(state)) return null;
  return {
    objectType: String(state.objectType || adapter.objectType || "").trim(),
    goalTemplateId: state.selectedGoalTemplateId || null,
    archetypeId: state.selectedArchetypeId || null,
    goalDraft: clonePlainObject(state.goalDraft, {}) || {},
    answers: clonePlainObject(state.answers, {}) || {},
  };
}

function normalizeCompileResult(result, state, adapter) {
  const fallbackCompiledGoal = defaultCompiledGoal(state, adapter);
  if (!result || typeof result !== "object") {
    return {
      valid: !!fallbackCompiledGoal,
      compiledGoal: fallbackCompiledGoal,
      diagnostics: [],
      searchStatus: fallbackCompiledGoal ? "ready" : "idle",
    };
  }

  const diagnostics = sortDiagnostics(result.diagnostics || []);
  const explicitValid = result.valid;
  const compiledGoal = clonePlainObject(result.compiledGoal, fallbackCompiledGoal);
  const valid =
    explicitValid == null
      ? !!compiledGoal && !hasBlockingDiagnostics(diagnostics)
      : explicitValid !== false;
  return {
    valid,
    compiledGoal,
    diagnostics,
    searchStatus: valid
      ? "ready"
      : compiledGoal
        ? "error"
        : hasGuidedSelection(state)
          ? "needs-compile"
          : "idle",
  };
}

function normalizeSearchPayload(outcome, state, adapter, metadata = {}) {
  const envelope =
    outcome &&
    typeof outcome === "object" &&
    (Object.prototype.hasOwnProperty.call(outcome, "recommendation") ||
      Object.prototype.hasOwnProperty.call(outcome, "terminationReason"))
      ? outcome
      : { recommendation: outcome };
  const recommendation = normalizeRecommendation(envelope.recommendation, state, adapter);
  return {
    status: "complete",
    jobId: String(metadata.jobId || ""),
    generation: Number.isFinite(Number(metadata.generation)) ? Number(metadata.generation) : 0,
    compiledGoal: clonePlainObject(metadata.compiledGoal, null),
    recommendation,
    contextFingerprint: String(metadata.contextFingerprint || ""),
    engineFingerprint: String(metadata.engineFingerprint || ""),
    terminationReason: String(envelope.terminationReason || "complete"),
    error: "",
  };
}

export function createGuidedFlowController({
  adapter,
  context = {},
  initialState = {},
  searchMode = "",
  getContextFingerprint = null,
  getEngineFingerprint = null,
  onUpdate,
} = {}) {
  const validation = validateGuidedAdapter(adapter);
  if (!validation.valid) {
    throw new TypeError(validation.errors.join(" "));
  }

  const resolvedSearchMode =
    searchMode === "manual" || adapter.searchMode === "manual" ? "manual" : "eager";

  const state = createGuidedState({
    objectType: adapter.objectType,
    ...initialState,
  });

  const searchRunner = createGuidedSolverJobRunner();

  function currentContextFingerprint() {
    if (typeof getContextFingerprint === "function")
      return String(getContextFingerprint(state, context) || "");
    return String(context?.contextFingerprint || "");
  }

  function currentEngineFingerprint() {
    if (typeof getEngineFingerprint === "function")
      return String(getEngineFingerprint(state, context) || "");
    return String(context?.engineFingerprint || "");
  }

  function buildArchetypes() {
    const archetypes = asArray(adapter.listArchetypes(context, state));
    setGuidedArchetypes(state, archetypes);
    return archetypes;
  }

  function buildQuestions() {
    if (!hasGuidedSelection(state)) {
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
    if (resolvedSearchMode === "manual") return state.recommendation;
    if (!hasGuidedSelection(state)) {
      setGuidedRecommendation(state, null);
      setGuidedSearchState(state, {
        searchStatus: "idle",
        activeSearchJobId: "",
        searchError: "",
      });
      return null;
    }
    const recommendation = normalizeRecommendation(
      adapter.solveRecommendation(state, context),
      state,
      adapter,
    );
    setGuidedRecommendation(state, recommendation);
    setGuidedCompileDiagnostics(state, []);
    setGuidedCompiledGoal(state, defaultCompiledGoal(state, adapter));
    setGuidedSearchState(state, {
      searchStatus: recommendation ? "complete" : "ready",
      activeSearchJobId: "",
      searchError: "",
      lastSearchResult: recommendation
        ? {
            status: "complete",
            jobId: "",
            generation: state.searchGeneration || 0,
            compiledGoal: defaultCompiledGoal(state, adapter),
            recommendation,
            contextFingerprint: currentContextFingerprint(),
            engineFingerprint: currentEngineFingerprint(),
            terminationReason: "eager",
            error: "",
          }
        : state.lastSearchResult,
      lastSearchContextFingerprint: currentContextFingerprint(),
      lastSearchEngineFingerprint: currentEngineFingerprint(),
    });
    return recommendation;
  }

  function snapshot() {
    return {
      state,
      archetypes: state.archetypes,
      questions: state.questions,
      recommendation: state.recommendation,
      compileDiagnostics: state.compileDiagnostics,
      compiledGoal: state.compiledGoal,
      searchStatus: state.searchStatus,
      lastSearchResult: state.lastSearchResult,
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

  function invalidateManualSearch(nextStatus = "") {
    if (resolvedSearchMode !== "manual") return;
    searchRunner.cancel("state-changed");
    setGuidedCompiledGoal(state, null);
    setGuidedCompileDiagnostics(state, []);
    setGuidedSearchState(state, {
      searchStatus: nextStatus || (hasGuidedSelection(state) ? "needs-compile" : "idle"),
      activeSearchJobId: "",
      searchError: "",
    });
  }

  function compileGoal({ shouldNotify = true } = {}) {
    if (resolvedSearchMode !== "manual") {
      return {
        valid: !!state.compiledGoal,
        compiledGoal: state.compiledGoal,
        diagnostics: state.compileDiagnostics,
      };
    }

    const normalized = normalizeCompileResult(
      typeof adapter.compileGoal === "function" ? adapter.compileGoal(state, context) : null,
      state,
      adapter,
    );

    setGuidedCompiledGoal(state, normalized.compiledGoal);
    setGuidedCompileDiagnostics(state, normalized.diagnostics);
    setGuidedSearchState(state, {
      searchStatus: normalized.searchStatus,
      searchError: "",
    });
    if (shouldNotify) notify();
    return normalized;
  }

  async function startSearch({ forceCompile = true } = {}) {
    if (resolvedSearchMode !== "manual") {
      return {
        status: "complete",
        recommendation: state.recommendation,
      };
    }

    const compiled =
      forceCompile || !state.compiledGoal
        ? compileGoal({ shouldNotify: false })
        : {
            valid: !!state.compiledGoal,
            compiledGoal: state.compiledGoal,
            diagnostics: state.compileDiagnostics,
          };

    if (!compiled.valid || !compiled.compiledGoal) {
      setGuidedSearchState(state, {
        searchStatus: hasGuidedSelection(state) ? "error" : "idle",
        searchError: compiled.diagnostics?.length ? "Compile blocked" : "",
      });
      notify();
      return {
        status: "error",
        recommendation: null,
      };
    }

    const started = searchRunner.start(
      (jobControls) =>
        typeof adapter.startSearch === "function"
          ? adapter.startSearch(compiled.compiledGoal, state, context, jobControls)
          : adapter.solveRecommendation(state, context),
      { cancelReason: "superseded" },
    );

    setGuidedSearchState(state, {
      searchStatus: "searching",
      searchGeneration: started.generation,
      activeSearchJobId: started.jobId,
      searchError: "",
    });
    notify();

    const result = await started.promise;
    if (result.status === "complete") {
      const payload = normalizeSearchPayload(result.result, state, adapter, {
        jobId: result.jobId,
        generation: result.generation,
        compiledGoal: compiled.compiledGoal,
        contextFingerprint: currentContextFingerprint(),
        engineFingerprint: currentEngineFingerprint(),
      });
      setGuidedRecommendation(state, payload.recommendation);
      setGuidedSearchState(state, {
        searchStatus: "complete",
        searchGeneration: result.generation,
        activeSearchJobId: "",
        lastSearchResult: payload,
        lastSearchContextFingerprint: payload.contextFingerprint,
        lastSearchEngineFingerprint: payload.engineFingerprint,
        searchError: "",
      });
      notify();
      return payload;
    }

    if (result.status === "error") {
      setGuidedSearchState(state, {
        searchStatus: "error",
        searchGeneration: result.generation,
        activeSearchJobId: "",
        searchError: result.reason || "Search failed",
      });
      notify();
      return {
        status: "error",
        recommendation: null,
        error: result.error,
      };
    }

    if (result.status === "canceled") {
      setGuidedSearchState(state, {
        searchStatus: "canceled",
        searchGeneration: result.generation,
        activeSearchJobId: "",
      });
      notify();
    }

    return result;
  }

  function cancelSearch(reason = "canceled") {
    if (resolvedSearchMode !== "manual") return null;
    const canceled = searchRunner.cancel(reason);
    if (!canceled) return null;
    setGuidedSearchState(state, {
      searchStatus: "canceled",
      searchGeneration: canceled.generation,
      activeSearchJobId: "",
    });
    notify();
    return canceled;
  }

  const controller = {
    getState() {
      return state;
    },

    getSnapshot() {
      return snapshot();
    },

    getSearchStatus() {
      return state.searchStatus;
    },

    getLastSearchResult() {
      return state.lastSearchResult;
    },

    refresh() {
      return sync();
    },

    compileGoal,

    startSearch,

    cancelSearch,

    selectArchetype(archetypeId) {
      selectGuidedArchetype(state, archetypeId);
      invalidateManualSearch();
      return sync();
    },

    selectGoalTemplate(goalTemplateId) {
      selectGuidedGoalTemplate(state, goalTemplateId);
      invalidateManualSearch();
      return sync();
    },

    setAnswer(key, value) {
      setGuidedAnswer(state, key, value);
      invalidateManualSearch();
      return sync();
    },

    setAnswers(answers) {
      setGuidedAnswers(state, answers);
      invalidateManualSearch();
      return sync();
    },

    setGoalDraft(goalDraft) {
      setGuidedGoalDraft(state, goalDraft);
      invalidateManualSearch();
      return sync();
    },

    setGoalDraftValue(key, value) {
      setGuidedGoalDraftValue(state, key, value);
      invalidateManualSearch();
      return sync();
    },

    setStep(stepId) {
      setGuidedStep(state, stepId);
      return notify();
    },

    reset(nextInitialState = {}) {
      searchRunner.cancel("reset");
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
