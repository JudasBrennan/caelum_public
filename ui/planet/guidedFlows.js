import { fmt } from "../../engine/utils.js";
import { createElement } from "../domHelpers.js";
import { createGuidedFlowController } from "../guidedCreation/flowController.js";
import { createGuidedPanel } from "../guidedCreation/components/guidedPanel.js";
import { createGuidedCreationOverlay } from "../guidedCreation/components/overlay.js";
import {
  buildGuidedSessionSnapshot,
  clearGuidedSession,
  saveGuidedSession,
} from "../guidedCreation/sessionState.js";
import { ensureGasGiantGuidedAdapterRegistered } from "../guidedCreation/adapters/gasGiant.js";
import { ensureRockyPlanetGuidedAdapterRegistered } from "../guidedCreation/adapters/rockyPlanet.js";
import { GAS_GIANT_RECIPES } from "../gasGiantStyles.js";
import { ROCKY_RECIPES } from "../rockyPlanetStyles.js";
import { renderCelestialRecipeBatch } from "../lazyCelestialVisualPreview.js";
import { createRecipePickerOverlay } from "./domRender.js";

const GAS_GIANT_GUIDED_STEPS = Object.freeze([
  { id: "type", label: "Goal" },
  { id: "orbit-context", label: "Setup" },
  { id: "goal-details", label: "Traits" },
  { id: "recommendation", label: "Recommendation" },
]);

const ROCKY_GUIDED_STEPS = Object.freeze([
  { id: "type", label: "Goal" },
  { id: "orbit-context", label: "Setup" },
  { id: "goal-details", label: "Traits" },
  { id: "recommendation", label: "Recommendation" },
]);

function guidedStepIndex(steps, stepId) {
  const index = steps.findIndex((step) => step.id === String(stepId || ""));
  return index >= 0 ? index : 0;
}

function createGuidedPreviewMetric(label, value, meta = "") {
  const displayValue =
    value == null || value === ""
      ? "n/a"
      : typeof value === "number" && !Number.isFinite(value)
        ? "n/a"
        : String(value);
  return createElement("div", { className: "guided-preview__metric" }, [
    createElement("div", {
      className: "guided-preview__metric-label",
      text: label,
    }),
    createElement("div", {
      className: "guided-preview__metric-value",
      text: displayValue,
    }),
    meta
      ? createElement("div", {
          className: "guided-preview__metric-meta",
          text: meta,
        })
      : null,
  ]);
}

function createGasGiantGuidedPreviewContent(recommendation) {
  const model = recommendation?.previewPayload?.gasCalc;
  const ringState = recommendation?.previewPayload?.ringState;
  const ringAppearance = recommendation?.previewPayload?.ringAppearance;
  if (!model) return null;
  return createElement("div", { className: "guided-preview guided-preview--gas-giant" }, [
    createElement("div", {
      className: "guided-preview__title",
      text: "Solved preview in the current host-frame context",
    }),
    createElement("div", { className: "guided-preview__grid" }, [
      createGuidedPreviewMetric(
        "Class",
        `Class ${model.classification?.sudarsky || "?"}`,
        model.display?.classification,
      ),
      createGuidedPreviewMetric(
        "Orbit",
        model.inputs?.orbitAu != null ? `${fmt(model.inputs.orbitAu, 3)} AU` : "n/a",
        model.display?.equilibriumTemp,
      ),
      createGuidedPreviewMetric(
        "Rings",
        ringState?.effectiveEnabled ? "Visible" : "Hidden",
        ringAppearance?.label || model.display?.ringType || "",
      ),
      createGuidedPreviewMetric(
        "Mass Loss",
        model.display?.massLossRate,
        model.display?.evaporationTimescale,
      ),
    ]),
  ]);
}

function createRockyGuidedPreviewContent(recommendation) {
  const model = recommendation?.previewPayload?.planetCalc;
  if (!model) return null;
  return createElement("div", { className: "guided-preview guided-preview--rocky" }, [
    createElement("div", {
      className: "guided-preview__title",
      text: "Solved preview in the current host-frame context",
    }),
    createElement("div", { className: "guided-preview__grid" }, [
      createGuidedPreviewMetric("Water", model.display?.waterRegime),
      createGuidedPreviewMetric(
        "Atmosphere",
        `${fmt(model.inputs?.pressureAtm ?? 0, 2)} atm`,
        model.inputs?.greenhouseMode || "manual",
      ),
      createGuidedPreviewMetric("Climate", model.display?.climateState, model.display?.tempK),
      createGuidedPreviewMetric(
        "Habitability",
        model.display?.habitabilityIndex,
        model.display?.earthSimilarityIndex ? `ESI ${model.display.earthSimilarityIndex}` : "",
      ),
    ]),
  ]);
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

export function createPlanetGuidedFlows({
  overlayClosers,
  buildGasGiantGuidedContext,
  buildRockyGuidedContext,
  getGasGiantGuidedSessionTarget,
  getRockyGuidedSessionTarget,
  buildPlanetGoalTextAssist,
  buildGasGiantGoalQuestionValues,
  buildRockyGoalQuestionValues,
  buildGasGiantGoalStatus,
  buildRockyGoalStatus,
  setGasGiantGoalDraftValue,
  setRockyGoalDraftValue,
  applyGasGiantGuidedRecommendation,
  applyRockyGuidedRecommendation,
  showPlanetNotice,
}) {
  function openGasGiantGuidedQuickPicker(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureGasGiantGuidedAdapterRegistered();
    const context = buildGasGiantGuidedContext();
    const sessionTarget = getGasGiantGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "guided-overlay--gas-giant",
      dialogClassName: "guided-dialog--gas-giant",
      closeLabel: "Close gas giant quick types",
    });
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("gasGiant");
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
        objectType: "gasGiant",
        uxMode: "quick",
        selectedArchetypeId: restoredSession?.selectedArchetypeId || "",
        answers: restoredSession?.answers || {},
      },
      onUpdate: ({ state: flowState, questions, recommendation, archetypes }) => {
        const panel = createGuidedPanel({
          title: "Gas Giant Quick Types",
          subtitle:
            "Pick a gas-giant starting point. Each option maps to an existing gas-giant recipe and is re-solved inside the current host frame.",
          archetypes: (archetypes || []).filter((entry) => entry?.quickEnabled !== false),
          selectedArchetypeId: flowState.selectedArchetypeId || "",
          questions,
          answers: flowState.answers,
          recommendation,
          previewContent: createGasGiantGuidedPreviewContent(recommendation),
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
              applyGasGiantRecommendation: (nextRecommendation) =>
                applyGasGiantGuidedRecommendation(nextRecommendation, {
                  noticeLabel: recommendation.title || "Gas giant quick type",
                }),
            });
            close();
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("gasGiant", {
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

  function openGasGiantGuidedFlow(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureGasGiantGuidedAdapterRegistered();
    const context = buildGasGiantGuidedContext();
    const sessionTarget = getGasGiantGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "guided-overlay--gas-giant",
      dialogClassName: "guided-dialog--gas-giant",
      closeLabel: "Close gas giant guided creation",
    });
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("gasGiant");
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

    function nextGasGiantGuidedStepId(flowState, questions = []) {
      const currentId = String(flowState?.currentStepId || "type");
      if (currentId === "type") return "orbit-context";
      if (currentId === "orbit-context") {
        return questions.some((question) => question?.stepId === "goal-details")
          ? "goal-details"
          : "recommendation";
      }
      return "recommendation";
    }

    function previousGasGiantGuidedStepId(flowState) {
      const currentId = String(flowState?.currentStepId || "type");
      if (currentId === "recommendation") return "goal-details";
      if (currentId === "goal-details") return "orbit-context";
      if (currentId === "orbit-context") return "type";
      return "type";
    }

    controller = createGuidedFlowController({
      adapter,
      context,
      searchMode: "manual",
      initialState: {
        objectType: "gasGiant",
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
        const currentStepIndex = guidedStepIndex(GAS_GIANT_GUIDED_STEPS, currentStepId);
        const filteredQuestions = (questions || []).filter(
          (question) => String(question?.stepId || "goal-details") === currentStepId,
        );
        const questionValues = buildGasGiantGoalQuestionValues(flowState, filteredQuestions);
        const hasGoalStep = (questions || []).some(
          (question) => question?.stepId === "goal-details",
        );
        const steps = GAS_GIANT_GUIDED_STEPS.map((step, index) => ({
          ...step,
          disabled:
            (step.id !== "type" && !flowState.selectedGoalTemplateId) ||
            (step.id === "goal-details" && !hasGoalStep) ||
            (step.id === "recommendation" &&
              (!flowState.selectedGoalTemplateId || index > currentStepIndex + 1)),
        }));

        const panel = createGuidedPanel({
          title: "Gas Giant Goal Builder",
          subtitle:
            "Choose the gas-giant outcome you want, set scope and search budget, then compile and run a seeded goal search before applying the recommendation.",
          steps,
          currentStepId,
          archetypes: (archetypes || []).filter((entry) => entry?.guidedEnabled !== false),
          selectedArchetypeId: flowState.selectedGoalTemplateId || "",
          typeSupplement:
            currentStepId === "type"
              ? buildPlanetGoalTextAssist(() => controller, flowState, {
                  objectType: "gasGiant",
                  objectLabel: "gas giant",
                })
              : null,
          questions: filteredQuestions,
          answers: questionValues,
          recommendation,
          status: currentStepId === "recommendation" ? buildGasGiantGoalStatus(flowState) : null,
          previewContent:
            currentStepId === "recommendation"
              ? createGasGiantGuidedPreviewContent(recommendation)
              : null,
          visibleSections: {
            type: currentStepId === "type",
            questions: currentStepId === "orbit-context" || currentStepId === "goal-details",
            status: currentStepId === "recommendation",
            recommendation: currentStepId === "recommendation",
            diagnostics: currentStepId === "recommendation",
          },
          typeSectionTitle: "Gas-Giant Goal",
          questionSectionTitle: currentStepId === "orbit-context" ? "Search Setup" : "Goal Traits",
          recommendationSectionTitle: "Best Gas-Giant Fit",
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
              objectType: "gasGiant",
              uxMode: "guided",
              currentStepId: "type",
              selectedArchetypeId: goalTemplateId,
              selectedGoalTemplateId: goalTemplateId,
            }),
          onQuestionChange: (questionId, value) =>
            setGasGiantGoalDraftValue(controller, flowState, questionId, value),
          onStepSelect: (stepId, step) => {
            if (step?.disabled) return;
            controller?.setStep(stepId);
          },
          onAction: (actionId) => {
            if (actionId === "reset") {
              controller?.reset({
                objectType: "gasGiant",
                uxMode: "guided",
                currentStepId: "type",
              });
              return;
            }
            if (actionId === "back") {
              controller?.setStep(previousGasGiantGuidedStepId(flowState));
              return;
            }
            if (actionId === "next") {
              controller?.setStep(nextGasGiantGuidedStepId(flowState, questions));
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
                applyGasGiantRecommendation: (nextRecommendation) =>
                  applyGasGiantGuidedRecommendation(nextRecommendation, {
                    noticeLabel: recommendation.title || "Guided gas giant",
                  }),
              });
              close();
              if (actionId === "apply-advanced") {
                showPlanetNotice?.("Continue refining with the Planet page controls.");
              }
            }
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("gasGiant", {
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

  function openRockyGuidedQuickPicker(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureRockyPlanetGuidedAdapterRegistered();
    const context = buildRockyGuidedContext();
    const sessionTarget = getRockyGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "guided-overlay--rocky",
      dialogClassName: "guided-dialog--rocky",
      closeLabel: "Close rocky quick types",
    });
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("rockyPlanet");
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
        objectType: "rockyPlanet",
        uxMode: "quick",
        selectedArchetypeId: restoredSession?.selectedArchetypeId || "",
        answers: restoredSession?.answers || {},
      },
      onUpdate: ({ state: flowState, questions, recommendation, archetypes }) => {
        const panel = createGuidedPanel({
          title: "Rocky Quick Types",
          subtitle:
            "Pick a rocky-world starting point. Each option maps to an existing rocky recipe and is re-solved inside the current host frame.",
          archetypes: (archetypes || []).filter((entry) => entry?.quickEnabled !== false),
          selectedArchetypeId: flowState.selectedArchetypeId || "",
          questions,
          answers: flowState.answers,
          recommendation,
          previewContent: createRockyGuidedPreviewContent(recommendation),
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
              applyRockyPlanetRecommendation: (nextRecommendation) =>
                applyRockyGuidedRecommendation(nextRecommendation, {
                  noticeLabel: recommendation.title || "Rocky quick type",
                }),
            });
            close();
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("rockyPlanet", {
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

  function openRockyGuidedFlow(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureRockyPlanetGuidedAdapterRegistered();
    const context = buildRockyGuidedContext();
    const sessionTarget = getRockyGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "guided-overlay--rocky",
      dialogClassName: "guided-dialog--rocky",
      closeLabel: "Close rocky guided creation",
    });
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("rockyPlanet");
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

    function nextRockyGuidedStepId(flowState, questions = []) {
      const currentId = String(flowState?.currentStepId || "type");
      if (currentId === "type") return "orbit-context";
      if (currentId === "orbit-context") {
        return questions.some((question) => question?.stepId === "goal-details")
          ? "goal-details"
          : "recommendation";
      }
      return "recommendation";
    }

    function previousRockyGuidedStepId(flowState) {
      const currentId = String(flowState?.currentStepId || "type");
      if (currentId === "recommendation") {
        return (flowState?.questions || []).some((question) => question?.stepId === "goal-details")
          ? "goal-details"
          : "orbit-context";
      }
      if (currentId === "goal-details") return "orbit-context";
      if (currentId === "orbit-context") return "type";
      return "type";
    }

    controller = createGuidedFlowController({
      adapter,
      context,
      searchMode: "manual",
      initialState: {
        objectType: "rockyPlanet",
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
        const currentStepIndex = guidedStepIndex(ROCKY_GUIDED_STEPS, currentStepId);
        const filteredQuestions = (questions || []).filter(
          (question) => String(question?.stepId || "goal-details") === currentStepId,
        );
        const questionValues = buildRockyGoalQuestionValues(flowState, filteredQuestions);
        const hasGoalStep = (questions || []).some(
          (question) => question?.stepId === "goal-details",
        );
        const steps = ROCKY_GUIDED_STEPS.map((step, index) => ({
          ...step,
          disabled:
            (step.id !== "type" && !flowState.selectedGoalTemplateId) ||
            (step.id === "goal-details" && !hasGoalStep) ||
            (step.id === "recommendation" &&
              (!flowState.selectedGoalTemplateId || index > currentStepIndex + 1)),
        }));

        const panel = createGuidedPanel({
          title: "Rocky Goal Builder",
          subtitle:
            "Choose the rocky-world outcome you want, set scope and search budget, then compile and run a seeded goal search before applying the recommendation.",
          steps,
          currentStepId,
          archetypes: (archetypes || []).filter((entry) => entry?.guidedEnabled !== false),
          selectedArchetypeId: flowState.selectedGoalTemplateId || "",
          typeSupplement:
            currentStepId === "type"
              ? buildPlanetGoalTextAssist(() => controller, flowState, {
                  objectType: "rockyPlanet",
                  objectLabel: "rocky world",
                })
              : null,
          questions: filteredQuestions,
          answers: questionValues,
          recommendation,
          status: currentStepId === "recommendation" ? buildRockyGoalStatus(flowState) : null,
          previewContent:
            currentStepId === "recommendation"
              ? createRockyGuidedPreviewContent(recommendation)
              : null,
          visibleSections: {
            type: currentStepId === "type",
            questions: currentStepId === "orbit-context" || currentStepId === "goal-details",
            status: currentStepId === "recommendation",
            recommendation: currentStepId === "recommendation",
            diagnostics: currentStepId === "recommendation",
          },
          typeSectionTitle: "Rocky Goal",
          questionSectionTitle: currentStepId === "orbit-context" ? "Search Setup" : "Goal Traits",
          recommendationSectionTitle: "Best Rocky Fit",
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
              objectType: "rockyPlanet",
              uxMode: "guided",
              currentStepId: "type",
              selectedArchetypeId: goalTemplateId,
              selectedGoalTemplateId: goalTemplateId,
            }),
          onQuestionChange: (questionId, value) =>
            setRockyGoalDraftValue(controller, flowState, questionId, value),
          onStepSelect: (stepId, step) => {
            if (step?.disabled) return;
            controller?.setStep(stepId);
          },
          onAction: (actionId) => {
            if (actionId === "reset") {
              controller?.reset({
                objectType: "rockyPlanet",
                uxMode: "guided",
                currentStepId: "type",
              });
              return;
            }
            if (actionId === "back") {
              controller?.setStep(previousRockyGuidedStepId(flowState));
              return;
            }
            if (actionId === "next") {
              controller?.setStep(nextRockyGuidedStepId(flowState, questions));
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
                applyRockyPlanetRecommendation: (nextRecommendation) =>
                  applyRockyGuidedRecommendation(nextRecommendation, {
                    noticeLabel: recommendation.title || "Guided rocky world",
                  }),
              });
              close();
              if (actionId === "apply-advanced") {
                showPlanetNotice?.("Continue refining with the Planet page controls.");
              }
            }
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("rockyPlanet", {
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

  function openGasGiantRecipePicker(onSelect) {
    const categories = [...new Set(GAS_GIANT_RECIPES.map((recipe) => recipe.category))];
    const overlay = createRecipePickerOverlay({
      title: "Gas Giant Recipes",
      categories,
      recipes: GAS_GIANT_RECIPES,
      showHints: true,
    });
    document.body.appendChild(overlay);

    const progressBar = overlay.querySelector(".rp-picker-progress > span");
    const progressTrack = overlay.querySelector(".rp-picker-progress");
    const items = [];
    for (const card of overlay.querySelectorAll(".rp-picker-card")) {
      const recipe = GAS_GIANT_RECIPES.find((entry) => entry.id === card.dataset.recipe);
      if (!recipe) continue;
      items.push({
        canvas: card.querySelector("canvas"),
        model: {
          bodyType: "gasGiant",
          name: recipe.label || "Gas giant",
          styleId: recipe.preview?.styleId || "jupiter",
          showRings: !!recipe.preview?.rings,
          rotationPeriodHours: recipe.apply?.rotationPeriodHours || 10,
        },
      });
    }
    renderCelestialRecipeBatch(items, (done, total) => {
      const pct = total ? (done / total) * 100 : 100;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (pct >= 100 && progressTrack) progressTrack.classList.add("is-done");
    });

    function close() {
      overlayClosers.delete(close);
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }

    for (const card of overlay.querySelectorAll(".rp-picker-card")) {
      card.addEventListener("click", () => {
        const recipe = GAS_GIANT_RECIPES.find((entry) => entry.id === card.dataset.recipe);
        if (recipe) onSelect(recipe);
        close();
      });
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    overlay.querySelector(".rp-picker-close").addEventListener("click", close);

    function onKey(event) {
      if (event.key === "Escape") close();
    }

    overlayClosers.add(close);
    document.addEventListener("keydown", onKey);
  }

  function openRockyRecipePicker(onSelect) {
    const overlay = createRecipePickerOverlay({
      title: "Rocky Planet Recipes",
      categories: ["Terrestrial", "Barren", "Extreme", "Ocean"],
      recipes: ROCKY_RECIPES,
    });
    document.body.appendChild(overlay);

    const progressBar = overlay.querySelector(".rp-picker-progress > span");
    const progressTrack = overlay.querySelector(".rp-picker-progress");
    const items = [];
    for (const card of overlay.querySelectorAll(".rp-picker-card")) {
      const recipe = ROCKY_RECIPES.find((entry) => entry.id === card.dataset.recipe);
      if (!recipe) continue;
      items.push({
        canvas: card.querySelector("canvas"),
        model: {
          bodyType: "rocky",
          name: recipe.label || "Rocky world",
          recipeId: recipe.id,
          inputs: recipe.preview?.inputs || {},
          derived: recipe.preview?.derived || {},
        },
      });
    }
    renderCelestialRecipeBatch(items, (done, total) => {
      const pct = total ? (done / total) * 100 : 100;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (pct >= 100 && progressTrack) progressTrack.classList.add("is-done");
    });

    function close() {
      overlayClosers.delete(close);
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }

    for (const card of overlay.querySelectorAll(".rp-picker-card")) {
      card.addEventListener("click", () => {
        const recipe = ROCKY_RECIPES.find((entry) => entry.id === card.dataset.recipe);
        if (recipe) onSelect(recipe);
        close();
      });
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });
    overlay.querySelector(".rp-picker-close").addEventListener("click", close);

    function onKey(event) {
      if (event.key === "Escape") close();
    }

    overlayClosers.add(close);
    document.addEventListener("keydown", onKey);
  }

  return {
    openGasGiantGuidedQuickPicker,
    openGasGiantGuidedFlow,
    openRockyGuidedQuickPicker,
    openRockyGuidedFlow,
    openGasGiantRecipePicker,
    openRockyRecipePicker,
  };
}
