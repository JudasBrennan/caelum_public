import { createElement } from "./domHelpers.js";
import { createGuidedFlowController } from "./guidedCreation/flowController.js";
import { createGuidedPanel } from "./guidedCreation/components/guidedPanel.js";
import { createGuidedCreationOverlay } from "./guidedCreation/components/overlay.js";
import { ensureSystemGuidedAdapterRegistered } from "./guidedCreation/adapters/system.js";
import { guidedSearchStatusLabel } from "./guidedCreation/types.js";
import { applyGeneratedSystemDraft, loadWorld } from "./store.js";

function createMetric(label, value, meta = "") {
  return createElement("div", { className: "guided-preview__metric" }, [
    createElement("div", { className: "guided-preview__metric-label", text: label }),
    createElement("div", { className: "guided-preview__metric-value", text: value }),
    meta ? createElement("div", { className: "guided-preview__metric-meta", text: meta }) : null,
  ]);
}

function createSystemDraftPreviewContent(recommendation) {
  const preview = recommendation?.previewPayload?.preview || null;
  if (!preview) return null;
  const request = recommendation?.previewPayload?.request || {};
  const stars = Array.isArray(preview.stars) ? preview.stars : [];
  const starList = createElement(
    "div",
    { className: "guided-preview__summary" },
    stars.map((star) =>
      createElement("div", {
        text: `${star.name} - ${Number(star.massMsol || 0).toFixed(2)} Msol`,
      }),
    ),
  );
  return createElement("div", { className: "guided-preview guided-preview--system" }, [
    createElement("div", {
      className: "guided-preview__title",
      text: "Seeded home-system draft",
    }),
    createElement("div", { className: "guided-preview__grid" }, [
      createMetric("Topology", preview.topologyLabel || "System"),
      createMetric("Default host", preview.defaultHostFrameId || "star_a"),
      createMetric("Strategy", preview.generationModeLabel || "Fresh draft"),
      createMetric(
        "Goal template",
        preview.goalTemplateLabel || "Custom / none",
        request?.goalTemplateId && request.goalTemplateId !== "none"
          ? "Template steering is active"
          : "Using direct profile controls",
      ),
      createMetric(
        "Body mix",
        `${preview?.counts?.rockyPlanets || 0} rocky / ${preview?.counts?.gasGiants || 0} giants`,
        `${preview?.counts?.moons || 0} moons / ${preview?.counts?.debrisDisks || 0} debris`,
      ),
      createMetric(
        "Orbit ladder",
        `Spacing ${Number(preview?.orbitLadder?.spacingFactor || 0).toFixed(3)}`,
        `Orbit 1 ${Number(preview?.orbitLadder?.orbit1Au || 0).toFixed(3)} AU`,
      ),
    ]),
    preview.homeworld
      ? createElement("div", { className: "guided-preview__summary" }, [
          createElement("div", {
            text:
              `Homeworld candidate: ${preview.homeworld.name} ` +
              `(${preview.homeworld.hostFrameId}, slot ${preview.homeworld.slotIndex}, ` +
              `${Number(preview.homeworld.semiMajorAxisAu || 0).toFixed(3)} AU)`,
          }),
          preview?.preservedHomeworldId && preview.preservedHomeworldId === preview.homeworld.id
            ? createElement("div", {
                text: "Selected homeworld details are being preserved for this draft.",
              })
            : null,
        ])
      : null,
    starList,
  ]);
}

function buildSystemDraftStatus(flowState, recommendation) {
  const searchStatus = String(flowState?.searchStatus || "idle");
  const fitClass = recommendation?.fitClass || "";
  const rerollMode = String(
    recommendation?.previewPayload?.request?.rerollMode ||
      flowState?.answers?.rerollMode ||
      "fresh-draft",
  );
  const searchingDetail =
    rerollMode === "reroll-names-only"
      ? "The seeded generator is reseeding star, planet, and moon names while preserving the current home-system layout."
      : rerollMode === "keep-planets-reroll-moons"
        ? "The seeded generator is preserving the current stars and primary worlds, then rebuilding the moon systems."
        : rerollMode === "keep-stars-reroll-planets"
          ? "The seeded generator is preserving the current stellar topology while tuning a new orbit ladder and rebuilding the body inventory."
          : "The seeded generator is tuning the orbit ladder, allocating slots, and validating the draft.";
  return {
    compileStatus:
      searchStatus === "error"
        ? "error"
        : searchStatus === "complete"
          ? "ready"
          : searchStatus === "needs-compile"
            ? "needs-compile"
            : searchStatus,
    searchStatus,
    title:
      searchStatus === "searching"
        ? "Generating system draft"
        : recommendation
          ? "Draft ready"
          : "Draft not generated yet",
    detail:
      searchStatus === "searching"
        ? searchingDetail
        : recommendation
          ? `Current fit: ${fitClass || "exact-match"}. Search status: ${guidedSearchStatusLabel(searchStatus)}.`
          : "Choose a profile, set the generator inputs, then generate a draft.",
    diagnostics:
      searchStatus === "complete"
        ? recommendation?.diagnostics || []
        : flowState?.compileDiagnostics || [],
  };
}

function nextStepId(currentStepId = "profile") {
  if (currentStepId === "profile") return "generator";
  return "draft";
}

function previousStepId(currentStepId = "profile") {
  if (currentStepId === "draft") return "generator";
  return "profile";
}

export function openSystemRandomGenerationOverlay({ onApplied = null } = {}) {
  const adapter = ensureSystemGuidedAdapterRegistered();
  const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
    overlayClassName: "guided-overlay--system",
    dialogClassName: "guided-dialog--system",
    closeLabel: "Close system random generation",
  });

  const steps = [
    { id: "profile", label: "Profile" },
    { id: "generator", label: "Generator" },
    { id: "draft", label: "Draft" },
  ];
  let controller = null;

  function close() {
    controller?.cancelSearch?.("overlay-closed");
    overlayEl.remove();
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") close();
  }

  controller = createGuidedFlowController({
    adapter,
    searchMode: "manual",
    context: {
      getCurrentWorld: () => loadWorld(),
    },
    initialState: {
      objectType: "system",
      uxMode: "guided",
      currentStepId: "profile",
    },
    onUpdate: ({ state: flowState, questions, recommendation, archetypes }) => {
      const currentStepId = String(flowState?.currentStepId || "profile");
      const filteredQuestions = (questions || []).filter(
        (question) => String(question?.stepId || "generator") === currentStepId,
      );
      const panel = createGuidedPanel({
        title: "Generate Random System",
        subtitle:
          "Build a seeded home-system draft, or preserve parts of the current world while rerolling names, planets, or moons under the same guardrails.",
        steps: steps.map((step, index) => ({
          ...step,
          disabled:
            (step.id !== "profile" && !flowState.selectedArchetypeId) ||
            (step.id === "draft" &&
              (!flowState.selectedArchetypeId ||
                index > steps.findIndex((entry) => entry.id === currentStepId) + 1)),
        })),
        currentStepId,
        archetypes: (archetypes || []).filter((entry) => entry?.guidedEnabled !== false),
        selectedArchetypeId: flowState.selectedArchetypeId || "",
        questions: filteredQuestions,
        answers: flowState.answers,
        recommendation,
        status:
          currentStepId === "draft" ? buildSystemDraftStatus(flowState, recommendation) : null,
        previewContent:
          currentStepId === "draft" ? createSystemDraftPreviewContent(recommendation) : null,
        visibleSections: {
          type: currentStepId === "profile",
          questions: currentStepId === "generator",
          status: currentStepId === "draft",
          recommendation: currentStepId === "draft",
          diagnostics: currentStepId === "draft",
        },
        typeSectionTitle: "System Profile",
        questionSectionTitle: "Generator Inputs",
        recommendationSectionTitle: "Draft Preview",
        diagnosticSectionTitle: "Draft Diagnostics",
        actions: [
          ...(currentStepId !== "profile" ? [{ id: "back", label: "Back" }] : []),
          ...(currentStepId !== "draft"
            ? [
                {
                  id: "next",
                  label: "Next",
                  disabled: currentStepId === "profile" && !flowState.selectedArchetypeId,
                },
              ]
            : [
                {
                  id: "generate",
                  label:
                    flowState.searchStatus === "searching" ? "Generating..." : "Generate Draft",
                  disabled:
                    !flowState.selectedArchetypeId || flowState.searchStatus === "searching",
                },
                {
                  id: "regenerate",
                  label: "Regenerate",
                  disabled:
                    !flowState.selectedArchetypeId || flowState.searchStatus === "searching",
                  className: "is-secondary",
                },
                {
                  id: "apply",
                  label: "Apply",
                  disabled:
                    !recommendation ||
                    recommendation.hasBlockingDiagnostics ||
                    flowState.searchStatus !== "complete",
                },
              ]),
          { id: "reset", label: "Reset", className: "is-secondary" },
        ],
        onArchetypeSelect: (archetypeId) =>
          controller?.reset({
            objectType: "system",
            uxMode: "guided",
            currentStepId: "profile",
            selectedArchetypeId: archetypeId,
          }),
        onQuestionChange: (questionId, value) => controller?.setAnswer(questionId, value),
        onStepSelect: (stepId, step) => {
          if (step?.disabled) return;
          controller?.setStep(stepId);
        },
        onAction: (actionId) => {
          if (actionId === "reset") {
            controller?.reset({
              objectType: "system",
              uxMode: "guided",
              currentStepId: "profile",
            });
            return;
          }
          if (actionId === "back") {
            controller?.setStep(previousStepId(currentStepId));
            return;
          }
          if (actionId === "next") {
            controller?.setStep(nextStepId(currentStepId));
            return;
          }
          if (actionId === "generate") {
            void controller?.startSearch();
            return;
          }
          if (actionId === "regenerate") {
            const currentSeed = Number(flowState?.answers?.seed || 104729);
            controller?.setAnswer("seed", currentSeed + 1);
            void Promise.resolve().then(() => controller?.startSearch());
            return;
          }
          if (actionId === "apply" && recommendation) {
            const applied = controller?.apply({
              applyGeneratedSystemDraft: (draftEnvelope) =>
                applyGeneratedSystemDraft(draftEnvelope),
            });
            if (typeof onApplied === "function") onApplied(applied);
            close();
          }
        },
      });
      contentEl.replaceChildren(panel);
    },
  });

  closeButtonEl.addEventListener("click", close);
  overlayEl.addEventListener("click", (event) => {
    if (event.target === overlayEl) close();
  });
  document.addEventListener("keydown", onKeyDown);
  document.body.appendChild(overlayEl);
}
