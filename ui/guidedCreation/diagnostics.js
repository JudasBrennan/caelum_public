import { normalizeGuidedDiagnosticSeverity } from "./types.js";

const SEVERITY_RANK = {
  blocked: 0,
  warning: 1,
  info: 2,
};

function diagnosticSignature(diagnostic = {}) {
  return [
    normalizeGuidedDiagnosticSeverity(diagnostic.severity),
    String(diagnostic.code || "").trim(),
    String(diagnostic.title || "").trim(),
    String(diagnostic.detail || "").trim(),
  ].join("|");
}

export function normalizeGuidedDiagnostic(diagnostic = {}) {
  const suggestedActions = Array.isArray(diagnostic.suggestedActions)
    ? diagnostic.suggestedActions.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  return {
    severity: normalizeGuidedDiagnosticSeverity(diagnostic.severity),
    code: String(diagnostic.code || "").trim(),
    title: String(diagnostic.title || "").trim(),
    detail: String(diagnostic.detail || "").trim(),
    suggestedActions,
  };
}

export function dedupeGuidedDiagnostics(diagnostics = []) {
  const seen = new Set();
  const unique = [];
  for (const entry of Array.isArray(diagnostics) ? diagnostics : []) {
    const normalized = normalizeGuidedDiagnostic(entry);
    const signature = diagnosticSignature(normalized);
    if (seen.has(signature)) continue;
    seen.add(signature);
    unique.push(normalized);
  }
  return unique;
}

export function sortDiagnostics(diagnostics = []) {
  return dedupeGuidedDiagnostics(diagnostics).sort((left, right) => {
    const severityDelta =
      (SEVERITY_RANK[left.severity] ?? 99) - (SEVERITY_RANK[right.severity] ?? 99);
    if (severityDelta !== 0) return severityDelta;
    const codeDelta = left.code.localeCompare(right.code);
    if (codeDelta !== 0) return codeDelta;
    const titleDelta = left.title.localeCompare(right.title);
    if (titleDelta !== 0) return titleDelta;
    return left.detail.localeCompare(right.detail);
  });
}

export function hasBlockingDiagnostics(diagnostics = []) {
  return sortDiagnostics(diagnostics).some((diagnostic) => diagnostic.severity === "blocked");
}

export function groupDiagnosticsBySeverity(diagnostics = []) {
  const grouped = {
    blocked: [],
    warning: [],
    info: [],
  };
  for (const diagnostic of sortDiagnostics(diagnostics)) {
    grouped[diagnostic.severity].push(diagnostic);
  }
  return grouped;
}
