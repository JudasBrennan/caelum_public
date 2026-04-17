export function createVisibleWarmupController({
  beginPerfDuration,
  getYieldDelayMs = () => 8,
  warmBodyMeshes,
} = {}) {
  let visibleWarmupSignature = "";
  let visibleWarmupPromise = null;
  let visibleWarmupTimer = null;

  function cancel() {
    visibleWarmupTimer?.cancel?.();
    visibleWarmupTimer = null;
    visibleWarmupSignature = "";
    visibleWarmupPromise = null;
  }

  function schedule(snapshot, warmItems, warmBudgets = {}) {
    const items = Array.isArray(warmItems) ? warmItems.filter(Boolean) : [];
    if (!items.length) {
      cancel();
      return;
    }

    const warmSignature = items
      .map((item) => String(item?.key || ""))
      .filter(Boolean)
      .join("|");
    if (!warmSignature) {
      cancel();
      return;
    }
    if (visibleWarmupSignature === warmSignature && visibleWarmupPromise) return;

    if (visibleWarmupSignature !== warmSignature) {
      visibleWarmupTimer?.cancel?.();
      visibleWarmupTimer = beginPerfDuration?.("visibleWarmupCompletionMs", {
        count: items.length,
        scope: "visualizer-visible",
      });
      visibleWarmupSignature = warmSignature;
    }

    const warmPromise = Promise.resolve(
      warmBodyMeshes?.(snapshot, {
        items,
        maxBatchItems: Math.max(1, Number(warmBudgets.maxBatchItems) || 1),
        yieldBetweenBatches: true,
        yieldDelayMs: getYieldDelayMs(),
      }),
    );

    visibleWarmupPromise = warmPromise;
    warmPromise
      .then(() => {
        if (visibleWarmupSignature !== warmSignature || visibleWarmupPromise !== warmPromise)
          return;
        visibleWarmupTimer?.end?.({
          count: items.length,
          scope: "visualizer-visible",
        });
        visibleWarmupPromise = null;
        visibleWarmupTimer = null;
        visibleWarmupSignature = "";
      })
      .catch(() => {
        if (visibleWarmupSignature !== warmSignature || visibleWarmupPromise !== warmPromise)
          return;
        cancel();
      });
  }

  return {
    cancel,
    schedule,
  };
}

export function isWarmCandidateVisible(screenX, screenY, width, height, radiusPx = 0) {
  const margin = Math.max(12, Number(radiusPx) || 0);
  return (
    screenX >= -margin &&
    screenX <= width + margin &&
    screenY >= -margin &&
    screenY <= height + margin
  );
}

export function appendWarmCandidate(
  candidates,
  {
    bodyId,
    focusedBodyId = null,
    focusedBodyKind = null,
    height,
    key,
    kind,
    model,
    projectedRadiusPx,
    screenX,
    screenY,
    width,
  },
) {
  if (!Array.isArray(candidates) || !key || !model) return;
  candidates.push({
    key,
    model,
    kind,
    bodyId,
    focused: focusedBodyId === bodyId && focusedBodyKind === kind,
    visible: isWarmCandidateVisible(screenX, screenY, width, height, projectedRadiusPx),
    projectedRadiusPx,
  });
}
