import { createElement } from "../../domHelpers.js";
import { tipIconNode } from "../../tooltip.js";
import { normalizeGuidedQuestionKind } from "../types.js";

function normalizeNumberValue(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function createChoiceQuestion(question, value, onChange) {
  const effectiveValue = value == null ? question?.defaultValue : value;
  return createElement(
    "div",
    { className: "guided-question__choices" },
    (Array.isArray(question?.options) ? question.options : []).map((option) => {
      const optionValue = option?.value;
      const button = createElement(
        "button",
        {
          className:
            `guided-question__choice ${String(optionValue) === String(effectiveValue) ? "is-selected" : ""}`.trim(),
          attrs: { type: "button" },
          dataset: { value: optionValue },
        },
        [
          createElement("div", {
            className: "guided-question__choice-label",
            text: option?.label || String(optionValue ?? ""),
          }),
          option?.description
            ? createElement("div", {
                className: "guided-question__choice-desc",
                text: option.description,
              })
            : null,
        ],
      );
      if (typeof onChange === "function") {
        button.addEventListener("click", () => onChange(optionValue, question));
      }
      return button;
    }),
  );
}

function createSelectQuestion(question, value, onChange) {
  const select = createElement("select", {
    className: "guided-question__select",
    attrs: { "aria-label": question?.label || "Guided question" },
  });
  for (const option of Array.isArray(question?.options) ? question.options : []) {
    select.appendChild(
      createElement("option", {
        attrs: { value: option?.value },
        text: option?.label || String(option?.value ?? ""),
      }),
    );
  }
  select.value = value == null ? String(question?.defaultValue ?? "") : String(value);
  if (typeof onChange === "function") {
    select.addEventListener("change", () => onChange(select.value, question));
  }
  return select;
}

function createNumberQuestion(question, value, onChange) {
  const input = createElement("input", {
    className: "guided-question__number",
    attrs: {
      type: "number",
      min: question?.min,
      max: question?.max,
      step: question?.step,
      placeholder: question?.placeholder || null,
      "aria-label": question?.label || "Guided number question",
    },
  });
  input.value = value == null ? String(question?.defaultValue ?? "") : String(value);
  if (typeof onChange === "function") {
    input.addEventListener("change", () => onChange(normalizeNumberValue(input.value), question));
  }
  return input;
}

function createToggleQuestion(question, value, onChange) {
  const input = createElement("input", {
    className: "guided-question__toggle-input",
    attrs: {
      type: "checkbox",
      "aria-label": question?.label || "Guided toggle question",
    },
    checked: Boolean(value ?? question?.defaultValue),
  });
  if (typeof onChange === "function") {
    input.addEventListener("change", () => onChange(Boolean(input.checked), question));
  }
  return createElement("label", { className: "guided-question__toggle" }, [
    input,
    createElement("span", {
      className: "guided-question__toggle-label",
      text: question?.placeholder || "Enabled",
    }),
  ]);
}

function createQuestionControl(question, value, onChange) {
  switch (normalizeGuidedQuestionKind(question?.kind)) {
    case "number":
      return createNumberQuestion(question, value, onChange);
    case "toggle":
      return createToggleQuestion(question, value, onChange);
    case "select":
      return createSelectQuestion(question, value, onChange);
    case "choice":
    default:
      return createChoiceQuestion(question, value, onChange);
  }
}

export function createGuidedQuestionStep({ question, value, onChange = null } = {}) {
  const tooltipText = String(question?.tooltip || question?.help || "").trim();
  return createElement(
    "div",
    {
      className: "guided-question-step",
      dataset: {
        questionId: question?.id || "",
        questionKind: normalizeGuidedQuestionKind(question?.kind),
      },
    },
    [
      createElement("div", { className: "guided-question-step__head" }, [
        createElement("div", { className: "guided-question-step__label-row" }, [
          createElement("div", {
            className: "guided-question-step__label",
            text: question?.label || "Question",
          }),
          tipIconNode(tooltipText),
        ]),
        question?.help
          ? createElement("div", {
              className: "guided-question-step__help",
              text: question.help,
            })
          : null,
      ]),
      createQuestionControl(question, value, onChange),
    ],
  );
}
