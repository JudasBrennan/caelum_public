function finite(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getSystemPosterTuning({
  width = 0,
  height = 0,
  pairHostView = false,
  localStarsCount = 0,
  outerBranchesCount = 0,
} = {}) {
  const W = Math.max(320, finite(width, 0));
  const H = Math.max(240, finite(height, 0));
  const compactInfoPanel =
    pairHostView || finite(localStarsCount, 0) + finite(outerBranchesCount, 0) > 0;

  return {
    compactInfoPanel,
    starSize: pairHostView ? Math.max(36, Math.min(H * 0.28, W * 0.11)) : Math.max(46, H * 0.55),
    bodyLeftRatio: pairHostView ? 0.1 : 0.13,
    bodyLeftStarScale: pairHostView ? 0.72 : 0.9,
    pairClusterBaseScale: pairHostView ? 0.56 : 0.78,
    pairVisualMinScale: pairHostView ? 0.36 : 0.48,
    pairVisualBaseScale: pairHostView ? 0.44 : 0.56,
    pairVisualVarianceScale: pairHostView ? 0.18 : 0.24,
    pairGapPaddingPx: pairHostView ? 14 : 24,
    infoPanelWidth: compactInfoPanel ? Math.min(252, W * 0.22) : Math.min(296, W * 0.26),
    infoPanelXRatio: pairHostView ? 0.79 : 0.74,
    infoPanelBaseHeight: compactInfoPanel ? 72 : 96,
    infoPanelLocalRowHeight: compactInfoPanel ? 30 : 34,
    infoPanelOuterRowHeight: compactInfoPanel ? 32 : 38,
    infoPanelStarVisualSize: compactInfoPanel ? 14 : 16,
    infoPanelOpacity: 1,
    infoPanelShadowOpacity: compactInfoPanel ? 0.52 : 0.44,
    infoPanelHeaderOpacity: 1,
    infoPanelSectionOpacity: compactInfoPanel ? 0.98 : 0.96,
    infoPanelBorderOpacity: compactInfoPanel ? 0.94 : 0.9,
    denseLabelThresholdPx: pairHostView ? 60 : 48,
    compactLabelClusterSize: pairHostView ? 3 : 4,
    staggerStepPx: pairHostView ? 16 : 14,
    compactLabelFont: pairHostView ? "8px system-ui, sans-serif" : "9px system-ui, sans-serif",
  };
}

export function planSystemPosterLabels(
  entries,
  { denseLabelThresholdPx = 48, compactLabelClusterSize = 4, staggerStepPx = 14 } = {},
) {
  const planned = Array.isArray(entries)
    ? entries.map((entry) => ({
        ...entry,
        yOffset: 0,
        clusterSize: 1,
        labelMode: "full",
      }))
    : [];
  if (planned.length <= 1) return planned;

  let groupStart = 0;
  const threshold = Math.max(24, finite(denseLabelThresholdPx, 48));
  const compactSize = Math.max(2, Math.round(finite(compactLabelClusterSize, 4)));
  const step = Math.max(8, finite(staggerStepPx, 14));

  const applyGroup = (startIndex, endIndexExclusive) => {
    const size = endIndexExclusive - startIndex;
    if (size <= 0) return;
    const centerOffset = (size - 1) / 2;
    for (let index = startIndex; index < endIndexExclusive; index += 1) {
      const localIndex = index - startIndex;
      planned[index].clusterSize = size;
      planned[index].yOffset = size > 1 ? (localIndex - centerOffset) * step : 0;
      planned[index].labelMode = size >= compactSize ? "compact" : size > 1 ? "rotated" : "full";
    }
  };

  for (let index = 1; index <= planned.length; index += 1) {
    const atEnd = index === planned.length;
    const previous = planned[index - 1];
    const current = planned[index];
    const spacing = atEnd
      ? Number.POSITIVE_INFINITY
      : finite(current?.x, 0) - finite(previous?.x, 0);
    if (spacing >= threshold) {
      applyGroup(groupStart, index);
      groupStart = index;
    }
  }

  return planned;
}
