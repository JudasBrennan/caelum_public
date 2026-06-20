import { createContextCockpit } from "./contextCockpit.js";
import { createDependencyNotice } from "./dependencyNotice.js";
import { createEmptyState } from "./emptyState.js";
import { createNextStepStrip } from "./nextStepStrip.js";
import { createObjectSelectorPanel } from "./objectSelectorPanel.js";

export function workflowHtml(node) {
  return node?.outerHTML || "";
}

export function createDiagnosticCockpit({
  id = "",
  className = "",
  title = "",
  summary = "",
  current = null,
  source = null,
  statusItems = [],
  details = null,
  nextStep = null,
} = {}) {
  const items = [];
  if (current) items.push(current);
  items.push(...(Array.isArray(statusItems) ? statusItems : []));
  return createContextCockpit({
    id,
    className,
    ariaLabel: title ? `${title} diagnostic context` : "Diagnostic context",
    eyebrow: "Diagnostic only",
    title,
    summary,
    statusItems: items,
    source,
    details,
    footer: nextStep ? createNextStepStrip(nextStep) : null,
  });
}

export function createDiagnosticDependencyNotice({
  id = "",
  title = "Reads from upstream model data",
  body = "",
  source = "",
  actions = [],
  tone = "info",
} = {}) {
  return createDependencyNotice({
    id,
    tone,
    title,
    body,
    source,
    actions,
  });
}

export function createDiagnosticObjectSelector({
  id = "",
  title = "",
  summary = "",
  selectedLabel = "Selected",
  selectedValue = "",
  selectedMeta = "",
  selectedValueId = "",
  selectedMetaId = "",
  selectId = "",
  selectLabel = "",
  selectOptions = [],
} = {}) {
  return createObjectSelectorPanel({
    id,
    title,
    summary,
    selected: {
      label: selectedLabel,
      value: selectedValue,
      meta: selectedMeta,
      valueId: selectedValueId,
      metaId: selectedMetaId,
    },
    select: {
      id: selectId,
      label: selectLabel || selectedLabel,
      options: selectOptions,
    },
  });
}

export function createDiagnosticEmptyState({ id = "", title = "", body = "", actions = [] } = {}) {
  return createEmptyState({
    id,
    className: "diagnostic-empty-state",
    eyebrow: "Empty state",
    title,
    body,
    actions,
  });
}
