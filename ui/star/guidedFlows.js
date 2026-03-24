import { createGuidedFlowController } from "../guidedCreation/flowController.js";
import { createGuidedPanel } from "../guidedCreation/components/guidedPanel.js";
import { createGuidedCreationOverlay } from "../guidedCreation/components/overlay.js";
import {
  buildGuidedSessionSnapshot,
  clearGuidedSession,
  saveGuidedSession,
} from "../guidedCreation/sessionState.js";
import { ensureStarGuidedAdapterRegistered } from "../guidedCreation/adapters/star.js";

const STAR_GUIDED_STEPS = Object.freeze([
  { id: "type", label: "Goal" },
  { id: "stellar-context", label: "Setup" },
  { id: "goal-details", label: "Traits" },
  { id: "recommendation", label: "Recommendation" },
]);

function guidedStepIndex(steps, stepId) {
  const index = steps.findIndex((step) => step.id === String(stepId || ""));
  return index >= 0 ? index : 0;
}

function closeDedicatedHash(dedicatedBaseHash) {
  if (dedicatedBaseHash && location.hash !== dedicatedBaseHash) {
    location.hash = dedicatedBaseHash;
  }
}

function bindOverlayClose({ overlayEl, closeButtonEl, overlayClosers, preserveClose, onClose }) {
  overlayClosers.add(preserveClose);
  closeButtonEl.addEventListener("click", onClose);
  overlayEl.addEventListener("click", (event) => {
    if (event.target === overlayEl) onClose();
  });
}

function nextStarGuidedStepId(flowState, questions = []) {
  const currentId = String(flowState?.currentStepId || "type");
  if (currentId === "type") return "stellar-context";
  if (currentId === "stellar-context") {
    return questions.some((question) => question?.stepId === "goal-details")
      ? "goal-details"
      : "recommendation";
  }
  return "recommendation";
}

function previousStarGuidedStepId(flowState, questions = []) {
  const currentId = String(flowState?.currentStepId || "type");
  if (currentId === "recommendation") {
    return questions.some((question) => question?.stepId === "goal-details")
      ? "goal-details"
      : "stellar-context";
  }
  if (currentId === "goal-details") return "stellar-context";
  if (currentId === "stellar-context") return "type";
  return "type";
}

export function createStarGuidedFlows({
  overlayClosers,
  buildStarGuidedContext,
  getStarGuidedSessionTarget,
  buildStarGoalTextAssist,
  buildStarGoalQuestionValues,
  buildStarGoalStatus,
  setStarGoalDraftValue,
  createStarGuidedPreviewContent,
  applyStarGuidedRecommendation,
}) {
  function openStarGuidedQuickPicker(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureStarGuidedAdapterRegistered();
    const context = buildStarGuidedContext();
    const sessionTarget = getStarGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "guided-overlay--star",
      dialogClassName: "guided-dialog--star",
      closeLabel: "Close star quick types",
    });
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("star");
      overlayEl.remove();
      document.removeEventListener("keydown", onKey);
    }

    function close() {
      teardownOverlay(false);
      closeDedicatedHash(dedicatedBaseHash);
    }

    const preserveClose = () => teardownOverlay(true);

    function onKey(event) {
      if (event.key === "Escape") close();
    }

    controller = createGuidedFlowController({
      adapter,
      context,
      initialState: {
        objectType: "star",
        uxMode: "quick",
        selectedArchetypeId: restoredSession?.selectedArchetypeId || "",
        answers: restoredSession?.answers || {},
      },
      onUpdate: ({ state: flowState, questions, recommendation, archetypes }) => {
        const panel = createGuidedPanel({
          title: "Star Quick Types",
          subtitle:
            "Pick a stellar starting point. Each option re-solves the star and its activity outputs in the current editor context.",
          archetypes: (archetypes || []).filter((entry) => entry?.quickEnabled !== false),
          selectedArchetypeId: flowState.selectedArchetypeId || "",
          questions,
          answers: flowState.answers,
          recommendation,
          previewContent: createStarGuidedPreviewContent(recommendation),
          actions: [
            {
              id: "apply",
              label: recommendation?.diagnostics?.some((entry) => entry?.severity === "warning")
                ? "Apply Starting Point"
                : "Apply Quick Type",
              disabled: !recommendation,
            },
          ],
          onArchetypeSelect: (archetypeId) => controller?.selectArchetype(archetypeId),
          onQuestionChange: (questionId, value) => controller?.setAnswer(questionId, value),
          onAction: (actionId) => {
            if (actionId !== "apply" || !recommendation) return;
            controller?.apply({
              applyStarRecommendation: (nextRecommendation) =>
                applyStarGuidedRecommendation(nextRecommendation, {
                  noticeLabel: recommendation.title || "Star quick type",
                }),
            });
            close();
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("star", {
          ...sessionTarget,
          uxMode: "quick",
          ...buildGuidedSessionSnapshot(flowState),
        });
      },
    });

    bindOverlayClose({ overlayEl, closeButtonEl, overlayClosers, preserveClose, onClose: close });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlayEl);
  }

  function openStarGuidedFlow(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureStarGuidedAdapterRegistered();
    const context = buildStarGuidedContext();
    const sessionTarget = getStarGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "guided-overlay--star",
      dialogClassName: "guided-dialog--star",
      closeLabel: "Close star guided creation",
    });
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("star");
      overlayEl.remove();
      document.removeEventListener("keydown", onKey);
    }

    function close() {
      teardownOverlay(false);
      closeDedicatedHash(dedicatedBaseHash);
    }

    const preserveClose = () => teardownOverlay(true);

    function onKey(event) {
      if (event.key === "Escape") close();
    }

    controller = createGuidedFlowController({
      adapter,
      context,
      searchMode: "manual",
      initialState: {
        objectType: "star",
        uxMode: "guided",
        currentStepId: restoredSession?.currentStepId || "type",
        selectedArchetypeId: restoredSession?.selectedGoalTemplateId || "",
        selectedGoalTemplateId: restoredSession?.selectedGoalTemplateId || "",
        goalDraft: restoredSession?.goalDraft || {},
        compiledGoal: restoredSession?.compiledGoal || null,
        searchStatus: restoredSession?.searchStatus || "idle",
        lastSearchResult: restoredSession?.lastSearchResult || null,
        lastSearchContextFingerprint: restoredSession?.lastSearchContextFingerprint || "",
        lastSearchEngineFingerprint: restoredSession?.lastSearchEngineFingerprint || "",
      },
      onUpdate: ({ state: flowState, questions, recommendation, archetypes }) => {
        const currentStepId = String(flowState.currentStepId || "type");
        const currentStepIndex = guidedStepIndex(STAR_GUIDED_STEPS, currentStepId);
        const filteredQuestions = (questions || []).filter(
          (question) => String(question?.stepId || "goal-details") === currentStepId,
        );
        const questionValues = buildStarGoalQuestionValues(flowState, filteredQuestions);
        const hasGoalStep = (questions || []).some(
          (question) => question?.stepId === "goal-details",
        );
        const steps = STAR_GUIDED_STEPS.map((step, index) => ({
          ...step,
          disabled:
            (step.id !== "type" && !flowState.selectedGoalTemplateId) ||
            (step.id === "goal-details" && !hasGoalStep) ||
            (step.id === "recommendation" &&
              (!flowState.selectedGoalTemplateId || index > currentStepIndex + 1)),
        }));

        const panel = createGuidedPanel({
          title: "Star Goal Builder",
          subtitle:
            "Choose the stellar outcome you want, set scope and search budget, then compile and run a seeded goal search before applying the recommendation.",
          steps,
          currentStepId,
          archetypes: (archetypes || []).filter((entry) => entry?.guidedEnabled !== false),
          selectedArchetypeId: flowState.selectedGoalTemplateId || "",
          typeSupplement:
            currentStepId === "type" ? buildStarGoalTextAssist(() => controller, flowState) : null,
          questions: filteredQuestions,
          answers: questionValues,
          recommendation,
          status: currentStepId === "recommendation" ? buildStarGoalStatus(flowState) : null,
          previewContent:
            currentStepId === "recommendation"
              ? createStarGuidedPreviewContent(recommendation)
              : null,
          visibleSections: {
            type: currentStepId === "type",
            questions: currentStepId === "stellar-context" || currentStepId === "goal-details",
            status: currentStepId === "recommendation",
            recommendation: currentStepId === "recommendation",
            diagnostics: currentStepId === "recommendation",
          },
          typeSectionTitle: "Star Goal",
          questionSectionTitle:
            currentStepId === "stellar-context" ? "Search Setup" : "Goal Traits",
          recommendationSectionTitle: "Best Stellar Fit",
          diagnosticSectionTitle: "Search Diagnostics",
          actions: [
            ...(currentStepId !== "type" ? [{ id: "back", label: "Back" }] : []),
            ...(currentStepId !== "recommendation"
              ? [
                  {
                    id: "next",
                    label: currentStepId === "goal-details" ? "Review Goal Search" : "Next",
                    disabled: currentStepId === "type" && !flowState.selectedGoalTemplateId,
                  },
                ]
              : [
                  {
                    id: "compile",
                    label: "Compile Goal",
                    disabled:
                      !flowState.selectedGoalTemplateId || flowState.searchStatus === "searching",
                  },
                  {
                    id: "run-search",
                    label: flowState.searchStatus === "searching" ? "Searching..." : "Run Search",
                    disabled:
                      !flowState.selectedGoalTemplateId || flowState.searchStatus === "searching",
                  },
                  {
                    id: "apply",
                    label: "Apply",
                    disabled:
                      !recommendation ||
                      recommendation.hasBlockingDiagnostics ||
                      flowState.searchStatus !== "complete",
                  },
                  {
                    id: "apply-advanced",
                    label: "Apply and open Advanced",
                    disabled:
                      !recommendation ||
                      recommendation.hasBlockingDiagnostics ||
                      flowState.searchStatus !== "complete",
                  },
                ]),
            { id: "reset", label: "Reset", className: "is-secondary" },
          ],
          onArchetypeSelect: (goalTemplateId) =>
            controller?.reset({
              objectType: "star",
              uxMode: "guided",
              currentStepId: "type",
              selectedArchetypeId: goalTemplateId,
              selectedGoalTemplateId: goalTemplateId,
            }),
          onQuestionChange: (questionId, value) =>
            setStarGoalDraftValue(controller, flowState, questionId, value),
          onStepSelect: (stepId, step) => {
            if (step?.disabled) return;
            controller?.setStep(stepId);
          },
          onAction: (actionId) => {
            if (actionId === "reset") {
              controller?.reset({
                objectType: "star",
                uxMode: "guided",
                currentStepId: "type",
              });
              return;
            }
            if (actionId === "back") {
              controller?.setStep(previousStarGuidedStepId(flowState, questions));
              return;
            }
            if (actionId === "next") {
              controller?.setStep(nextStarGuidedStepId(flowState, questions));
              return;
            }
            if (actionId === "compile") {
              controller?.compileGoal();
              return;
            }
            if (actionId === "run-search") {
              void controller?.startSearch();
              return;
            }
            if ((actionId === "apply" || actionId === "apply-advanced") && recommendation) {
              controller?.apply({
                applyStarRecommendation: (nextRecommendation) =>
                  applyStarGuidedRecommendation(nextRecommendation, {
                    noticeLabel: recommendation.title || "Guided star",
                  }),
              });
              close();
            }
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("star", {
          ...sessionTarget,
          uxMode: "guided",
          ...buildGuidedSessionSnapshot(flowState, {
            currentStepId: flowState.currentStepId || "type",
          }),
        });
      },
    });

    bindOverlayClose({ overlayEl, closeButtonEl, overlayClosers, preserveClose, onClose: close });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlayEl);
  }

  return {
    openStarGuidedFlow,
    openStarGuidedQuickPicker,
  };
}
