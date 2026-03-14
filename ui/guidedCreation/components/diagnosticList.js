import { createElement } from "../../domHelpers.js";
import { groupDiagnosticsBySeverity } from "../diagnostics.js";
import { guidedDiagnosticSeverityLabel } from "../types.js";

const SEVERITY_ORDER = ["blocked", "warning", "info"];

function createDiagnosticNode(diagnostic) {
  return createElement(
    "div",
    {
      className: `guided-diagnostic guided-diagnostic--${diagnostic.severity}`.trim(),
      dataset: { severity: diagnostic.severity, code: diagnostic.code || "" },
    },
    [
      createElement("div", { className: "guided-diagnostic__title" }, [
        createElement("b", { text: diagnostic.title || diagnostic.code || "Diagnostic" }),
      ]),
      diagnostic.detail
        ? createElement("div", { className: "guided-diagnostic__detail", text: diagnostic.detail })
        : null,
      Array.isArray(diagnostic.suggestedActions) && diagnostic.suggestedActions.length
        ? createElement(
            "ul",
            { className: "guided-diagnostic__actions" },
            diagnostic.suggestedActions.map((action) => createElement("li", { text: action })),
          )
        : null,
    ],
  );
}

export function createDiagnosticList({ diagnostics = [] } = {}) {
  const grouped = groupDiagnosticsBySeverity(diagnostics);
  const sections = SEVERITY_ORDER.flatMap((severity) => {
    const entries = grouped[severity] || [];
    if (!entries.length) return [];
    return [
      createElement("div", { className: "guided-diagnostic-list__group" }, [
        createElement("div", {
          className:
            `guided-diagnostic-list__heading guided-diagnostic-list__heading--${severity}`.trim(),
          text: guidedDiagnosticSeverityLabel(severity),
        }),
        createElement(
          "div",
          { className: "guided-diagnostic-list__items" },
          entries.map((diagnostic) => createDiagnosticNode(diagnostic)),
        ),
      ]),
    ];
  });

  if (!sections.length) {
    return createElement("div", {
      className: "guided-diagnostic-list guided-diagnostic-list--empty",
      text: "No diagnostics.",
    });
  }

  return createElement("div", { className: "guided-diagnostic-list" }, sections);
}
