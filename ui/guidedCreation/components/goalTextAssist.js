import { createElement } from "../../domHelpers.js";
import { createDiagnosticList } from "./diagnosticList.js";

function createExamples(examples = []) {
  const normalized = (Array.isArray(examples) ? examples : []).filter(Boolean);
  if (!normalized.length) return null;
  return createElement("div", { className: "guided-goal-text__examples" }, [
    createElement("span", { className: "guided-goal-text__examples-label", text: "Try:" }),
    " ",
    normalized.join(", "),
  ]);
}

function createInterpretationSummary(interpretation = null) {
  if (!interpretation || typeof interpretation !== "object") return null;
  const summary = String(interpretation.summary || "").trim();
  const confidence = String(interpretation.confidence || "").trim();
  const diagnostics = Array.isArray(interpretation.diagnostics) ? interpretation.diagnostics : [];
  const hasContent = summary || confidence || diagnostics.length;
  if (!hasContent) return null;

  return createElement("div", { className: "guided-goal-text__interpretation" }, [
    createElement("div", {
      className: "guided-goal-text__interpretation-title",
      text: "Interpreted Goal",
    }),
    confidence
      ? createElement("div", {
          className: "guided-goal-text__interpretation-confidence",
          text: `Confidence: ${confidence}`,
        })
      : null,
    summary
      ? createElement("div", {
          className: "guided-goal-text__interpretation-summary",
          text: summary,
        })
      : null,
    diagnostics.length ? createDiagnosticList({ diagnostics }) : null,
  ]);
}

export function createGoalTextAssist({
  objectLabel = "goal",
  value = "",
  placeholder = "",
  examples = [],
  interpretation = null,
  onInput = null,
  onInterpret = null,
  onClear = null,
} = {}) {
  const inputEl = createElement("input", {
    className: "guided-goal-text__input",
    attrs: {
      type: "text",
      value: String(value || ""),
      placeholder: String(placeholder || ""),
      autocomplete: "off",
      spellcheck: "false",
    },
  });
  function syncButtonState() {
    const hasValue = !!String(inputEl.value || "").trim();
    interpretButton.disabled = !hasValue;
    clearButton.disabled = !hasValue;
  }
  if (typeof onInput === "function") {
    inputEl.addEventListener("input", () => onInput(inputEl.value));
  }

  const interpretButton = createElement("button", {
    className: "guided-goal-text__button",
    attrs: { type: "button" },
    dataset: { actionId: "interpret-goal-text" },
    text: "Interpret",
  });
  if (typeof onInterpret === "function") {
    interpretButton.addEventListener("click", () => onInterpret(inputEl.value));
  }

  const clearButton = createElement("button", {
    className: "guided-goal-text__button guided-goal-text__button--secondary",
    attrs: { type: "button" },
    dataset: { actionId: "clear-goal-text" },
    text: "Clear",
  });
  if (typeof onClear === "function") {
    clearButton.addEventListener("click", () => onClear());
  }
  inputEl.addEventListener("input", syncButtonState);
  inputEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (interpretButton.disabled) return;
    interpretButton.click();
  });
  syncButtonState();

  return createElement("div", { className: "guided-goal-text" }, [
    createElement("div", {
      className: "guided-goal-text__label",
      text: `Describe the ${objectLabel} you want`,
    }),
    createElement("div", {
      className: "guided-goal-text__help",
      text: "Use short phrases. Interpretation only maps onto supported goals, traits, and modifiers.",
    }),
    createElement("div", { className: "guided-goal-text__controls" }, [
      inputEl,
      interpretButton,
      clearButton,
    ]),
    createExamples(examples),
    createInterpretationSummary(interpretation),
  ]);
}
