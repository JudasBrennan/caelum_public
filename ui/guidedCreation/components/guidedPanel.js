import { createElement, replaceChildren } from "../../domHelpers.js";
import { guidedSearchStatusLabel } from "../types.js";
import { getGuidedActionTooltip, getGuidedStepTooltip } from "../tooltips.js";
import { createArchetypeGrid } from "./archetypeGrid.js";
import { createDiagnosticList } from "./diagnosticList.js";
import { createGuidedQuestionStep } from "./questionStep.js";
import { createRecommendationCard } from "./recommendationCard.js";

function createSection(title, child) {
  return createElement("section", { className: "guided-panel__section" }, [
    createElement("div", { className: "guided-panel__section-title", text: title }),
    child,
  ]);
}

function createStepRail({ steps = [], currentStepId = "", onStepSelect = null } = {}) {
  const normalizedSteps = Array.isArray(steps) ? steps : [];
  if (!normalizedSteps.length) return null;
  const currentIndex = normalizedSteps.findIndex(
    (step) => String(step?.id || "") === String(currentStepId || ""),
  );

  return createElement(
    "div",
    { className: "guided-panel__steps" },
    normalizedSteps.map((step, index) => {
      const stepId = String(step?.id || "");
      const isCurrent = stepId === String(currentStepId || "");
      const isCompleted = currentIndex >= 0 && index < currentIndex;
      const button = createElement(
        "button",
        {
          className:
            `guided-panel__step ${isCurrent ? "is-current" : ""} ${isCompleted ? "is-completed" : ""}`.trim(),
          attrs: {
            type: "button",
            "data-tip": step?.tooltip || getGuidedStepTooltip(stepId),
          },
          dataset: { stepId },
        },
        [
          createElement("span", {
            className: "guided-panel__step-index",
            text: String(index + 1),
          }),
          createElement("span", {
            className: "guided-panel__step-label",
            text: step?.label || stepId || "Step",
          }),
        ],
      );
      if (step?.disabled) button.disabled = true;
      if (typeof onStepSelect === "function") {
        button.addEventListener("click", () => onStepSelect(stepId, step));
      }
      return button;
    }),
  );
}

function createStatusSummary(status = null) {
  const compileStatus = String(status?.compileStatus || "").trim();
  const searchStatus = String(status?.searchStatus || "").trim();
  const title = String(status?.title || "").trim();
  const detail = String(status?.detail || "").trim();
  const diagnostics = Array.isArray(status?.diagnostics) ? status.diagnostics : [];
  const show =
    !!title ||
    !!detail ||
    !!compileStatus ||
    (!!searchStatus && searchStatus !== "complete" && searchStatus !== "idle") ||
    diagnostics.length > 0;
  if (!show) return null;

  const rows = [];
  if (compileStatus) {
    rows.push(
      createElement("div", { className: "guided-panel__status-row" }, [
        createElement("b", { text: "Compile:" }),
        " ",
        guidedSearchStatusLabel(compileStatus),
      ]),
    );
  }
  if (searchStatus) {
    rows.push(
      createElement("div", { className: "guided-panel__status-row" }, [
        createElement("b", { text: "Search:" }),
        " ",
        guidedSearchStatusLabel(searchStatus),
      ]),
    );
  }

  return createElement("div", { className: "guided-panel__status" }, [
    title ? createElement("div", { className: "guided-panel__status-title", text: title }) : null,
    rows.length ? createElement("div", { className: "guided-panel__status-rows" }, rows) : null,
    detail
      ? createElement("div", { className: "guided-panel__status-detail", text: detail })
      : null,
    diagnostics.length ? createDiagnosticList({ diagnostics }) : null,
  ]);
}

export function createGuidedPanel({
  title = "Guided Creation",
  subtitle = "",
  steps = [],
  currentStepId = "",
  archetypes = [],
  selectedArchetypeId = "",
  questions = [],
  answers = {},
  recommendation = null,
  previewContent = null,
  status = null,
  visibleSections = null,
  typeSupplement = null,
  statusSectionTitle = "Status",
  typeSectionTitle = "Type",
  questionSectionTitle = "Questions",
  recommendationSectionTitle = "Recommendation",
  diagnosticSectionTitle = "Diagnostics",
  actions = [],
  onArchetypeSelect = null,
  onQuestionChange = null,
  onStepSelect = null,
  onAction = null,
} = {}) {
  const statusSummary = createStatusSummary(status);
  const sectionVisibility = {
    type: visibleSections?.type !== false,
    questions: visibleSections?.questions !== false,
    status: visibleSections?.status !== false && !!statusSummary,
    recommendation: visibleSections?.recommendation !== false,
    diagnostics: visibleSections?.diagnostics !== false,
  };
  const actionButtons = createElement(
    "div",
    { className: "guided-panel__actions" },
    (Array.isArray(actions) ? actions : []).map((action) => {
      const button = createElement("button", {
        className: `guided-panel__action ${action?.className || ""}`.trim(),
        attrs: {
          type: "button",
          "data-tip": action?.tooltip || getGuidedActionTooltip(action?.id),
        },
        dataset: { actionId: action?.id || "" },
        text: action?.label || action?.id || "Action",
      });
      if (action?.disabled) button.disabled = true;
      if (typeof onAction === "function") {
        button.addEventListener("click", () => onAction(action?.id || "", action));
      }
      return button;
    }),
  );

  return createElement("div", { className: "guided-panel panel" }, [
    createElement("div", { className: "panel__header" }, [
      createElement("div", { className: "guided-panel__heading" }, [
        createElement("h2", { text: title }),
        subtitle
          ? createElement("div", { className: "guided-panel__subtitle", text: subtitle })
          : null,
      ]),
    ]),
    createElement("div", { className: "panel__body guided-panel__body" }, [
      createStepRail({ steps, currentStepId, onStepSelect }),
      sectionVisibility.status ? createSection(statusSectionTitle, statusSummary) : null,
      sectionVisibility.type
        ? createSection(
            typeSectionTitle,
            createElement("div", { className: "guided-panel__type-content" }, [
              typeSupplement,
              createArchetypeGrid({
                archetypes,
                selectedId: selectedArchetypeId,
                onSelect: onArchetypeSelect,
              }),
            ]),
          )
        : null,
      sectionVisibility.questions && Array.isArray(questions) && questions.length
        ? createSection(
            questionSectionTitle,
            createElement(
              "div",
              { className: "guided-panel__questions" },
              questions.map((question) =>
                createGuidedQuestionStep({
                  question,
                  value: answers?.[question.id],
                  onChange: onQuestionChange
                    ? (value) => onQuestionChange(question.id, value, question)
                    : null,
                }),
              ),
            ),
          )
        : null,
      sectionVisibility.recommendation
        ? createSection(
            recommendationSectionTitle,
            createRecommendationCard({
              recommendation,
              previewContent,
            }),
          )
        : null,
      sectionVisibility.diagnostics
        ? createSection(
            diagnosticSectionTitle,
            createDiagnosticList({
              diagnostics: recommendation?.diagnostics || [],
            }),
          )
        : null,
      actionButtons,
    ]),
  ]);
}

export function renderGuidedPanel(container, props = {}) {
  replaceChildren(container, [createGuidedPanel(props)]);
  return container;
}
