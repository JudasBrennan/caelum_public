export function renderVisualizerFocusSummary({
  focusSummaryEl,
  summary,
  onAction = null,
  createElement,
  replaceChildren,
}) {
  if (!focusSummaryEl) return;
  if (!summary) {
    focusSummaryEl.style.display = "none";
    replaceChildren(focusSummaryEl);
    return;
  }

  const rows = createElement(
    "div",
    { className: "viz-focus-summary__rows" },
    (summary.lines || []).map((line) =>
      createElement("div", { className: "viz-focus-summary__row" }, [
        createElement("div", {
          className: "viz-focus-summary__label",
          text: line.label || "",
        }),
        createElement("div", {
          className: "viz-focus-summary__value",
          text: line.value || "-",
        }),
      ]),
    ),
  );

  const children = [
    createElement("div", {
      className: "viz-focus-summary__title",
      text: summary.title || "Focused body",
    }),
    createElement("div", {
      className: "viz-focus-summary__subtitle",
      text: summary.subtitle || "",
    }),
    rows,
  ];

  if (summary.note) {
    children.push(
      createElement("div", {
        className: "viz-focus-summary__note",
        text: summary.note,
      }),
    );
  }

  if (Array.isArray(summary.actions) && summary.actions.length > 0) {
    const actionsWrap = createElement("div", { className: "viz-focus-summary__actions" });
    for (const action of summary.actions) {
      const button = createElement("button", {
        className: "small",
        attrs: {
          type: "button",
          "data-summary-action": action.id,
        },
        text: action.label || action.id || "Action",
      });
      if (typeof onAction === "function") {
        button.addEventListener("click", () => onAction(action.id, summary));
      }
      actionsWrap.appendChild(button);
    }
    children.push(actionsWrap);
  }

  focusSummaryEl.style.display = "";
  replaceChildren(focusSummaryEl, children);
}
