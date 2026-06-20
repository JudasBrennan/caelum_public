import { createEmptyState } from "../workflow/emptyState.js";

export function buildVisualizerEmptyStateMarkup() {
  return createEmptyState({
    id: "vizEmptyState",
    className: "viz-empty-state",
    eyebrow: "Visualiser",
    title: "No modeled bodies yet",
    body: "The visualiser can render stars immediately, but planets, giant companions, disks, and comets appear after you add them upstream.",
    dependencyNote: "Create bodies on Planet or arrange slots on Planetary System.",
    actions: [
      { label: "Create planet", href: "#/planet", primary: true },
      { label: "Arrange system", href: "#/system" },
      { label: "Add debris or comets", href: "#/outer" },
    ],
  }).outerHTML;
}

function snapshotHasModeledBodies(snapshot) {
  return (
    (snapshot?.planetNodes?.length || 0) +
      (snapshot?.gasGiants?.length || 0) +
      (snapshot?.debrisDisks?.length || 0) +
      (snapshot?.comets?.length || 0) >
    0
  );
}

export function syncVisualizerEmptyState(emptyStateEl, { mode = "system", snapshot = null } = {}) {
  if (!emptyStateEl) return;
  emptyStateEl.hidden = !(mode === "system" && !snapshotHasModeledBodies(snapshot));
}
