import { selectMoonRenderSubset } from "./renderBudget.js";

export function createMoonRenderHelpers({
  addDraggableLabel,
  getLabelsEnabled = () => false,
  renderProfile,
} = {}) {
  const isFocusedMoonParent = (parentId, parentKind) =>
    renderProfile?.focusedParentId === parentId && renderProfile?.focusedParentKind === parentKind;

  function buildMoonRenderSet(moons, parentId, parentKind) {
    return selectMoonRenderSubset(
      moons,
      isFocusedMoonParent(parentId, parentKind)
        ? renderProfile?.focusedMoonBudgets
        : renderProfile?.defaultMoonBudgets,
    );
  }

  function allowMoonHelpers(parentId, parentKind) {
    return (
      renderProfile?.moonHelperMode === "all" ||
      (renderProfile?.moonHelperMode === "focused" && isFocusedMoonParent(parentId, parentKind))
    );
  }

  function addMoonSummaryLabel(parentKind, parentId, parentPos, parentRadius, renderSet) {
    if (
      !getLabelsEnabled() ||
      !renderProfile?.showMoonSummaries ||
      !renderSet ||
      renderSet.hiddenCount <= 0
    ) {
      return;
    }

    const shownCount = renderSet.visibleMoons.length;
    addDraggableLabel?.({
      key: `moon-summary:${parentKind}:${parentId}`,
      line1: `${renderSet.hiddenCount} moons`,
      line2: shownCount > 0 ? `${shownCount} shown` : "zoom in for detail",
      anchorX: parentPos.x,
      anchorY: parentPos.y,
      defaultX: parentPos.x + parentRadius + 4,
      defaultY: parentPos.y + parentRadius,
      z: 8.85,
      leaderRadius: Math.max(2, parentRadius),
      font1: "10px system-ui, sans-serif",
      color1: "rgba(194,204,226,0.76)",
      font2: "9px system-ui, sans-serif",
      color2: "rgba(166,178,201,0.62)",
      priority: 44,
      opacity: 0.92,
    });
  }

  return {
    addMoonSummaryLabel,
    allowMoonHelpers,
    buildMoonRenderSet,
  };
}
