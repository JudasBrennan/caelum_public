function moonRadiusKm(moon) {
  const direct = Number(moon?.radiusKm);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const derivedMoonRadius = Number(moon?.moonCalc?.physical?.radiusMoon);
  if (Number.isFinite(derivedMoonRadius) && derivedMoonRadius > 0)
    return derivedMoonRadius * 1737.4;
  return 0;
}

function moonAxisKm(moon) {
  const value = Number(moon?.semiMajorAxisKm);
  return Number.isFinite(value) && value > 0 ? value : Number.POSITIVE_INFINITY;
}

function warmCandidateRadius(candidate) {
  const value = Number(candidate?.projectedRadiusPx);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function warmCandidateKindRank(kind) {
  if (kind === "planet" || kind === "gasGiant") return 0;
  if (kind === "moon") return 1;
  return 2;
}

export function compareMoonVisualPriority(left, right) {
  const radiusDelta = moonRadiusKm(right) - moonRadiusKm(left);
  if (Math.abs(radiusDelta) > 0.001) return radiusDelta;

  const axisDelta = moonAxisKm(left) - moonAxisKm(right);
  if (Math.abs(axisDelta) > 0.001) return axisDelta;

  const leftName = String(left?.name || left?.id || "");
  const rightName = String(right?.name || right?.id || "");
  return leftName.localeCompare(rightName);
}

function compareMoonOrbitOrder(left, right) {
  const axisDelta = moonAxisKm(left) - moonAxisKm(right);
  if (Math.abs(axisDelta) > 0.001) return axisDelta;
  return compareMoonVisualPriority(left, right);
}

export function selectMoonRenderSubset(
  moons,
  { bodyLimit = Infinity, orbitLimit = Infinity, labelLimit = Infinity } = {},
) {
  const list = Array.isArray(moons) ? moons.filter(Boolean) : [];
  if (!list.length) {
    return {
      hiddenCount: 0,
      labelIds: new Set(),
      leadMoon: null,
      orbitIds: new Set(),
      priorityMoons: [],
      visibleMoons: [],
    };
  }

  const priorityMoons = [...list].sort(compareMoonVisualPriority);
  const bodyIds = new Set(priorityMoons.slice(0, bodyLimit).map((moon) => moon.id));
  const orbitIds = new Set(priorityMoons.slice(0, orbitLimit).map((moon) => moon.id));
  const labelIds = new Set(priorityMoons.slice(0, labelLimit).map((moon) => moon.id));
  const visibleMoons = priorityMoons
    .filter((moon) => bodyIds.has(moon.id))
    .sort(compareMoonOrbitOrder);

  return {
    hiddenCount: Math.max(0, list.length - visibleMoons.length),
    labelIds,
    leadMoon: priorityMoons[0] || null,
    orbitIds,
    priorityMoons,
    visibleMoons,
  };
}

export function compareBodyMeshWarmPriority(left, right) {
  const focusDelta = Number(right?.focused === true) - Number(left?.focused === true);
  if (focusDelta !== 0) return focusDelta;

  const visibleDelta = Number(right?.visible === true) - Number(left?.visible === true);
  if (visibleDelta !== 0) return visibleDelta;

  const radiusDelta = warmCandidateRadius(right) - warmCandidateRadius(left);
  if (Math.abs(radiusDelta) > 0.001) return radiusDelta;

  const kindDelta = warmCandidateKindRank(left?.kind) - warmCandidateKindRank(right?.kind);
  if (kindDelta !== 0) return kindDelta;

  const leftKey = String(left?.key || left?.bodyId || "");
  const rightKey = String(right?.key || right?.bodyId || "");
  return leftKey.localeCompare(rightKey);
}

export function selectBodyMeshWarmSubset(
  candidates,
  { maxItems = 8, maxMoonItems = 2, minProjectedRadiusPx = 4 } = {},
) {
  const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
  if (!list.length || !(maxItems > 0)) return [];

  const sorted = [...list].sort(compareBodyMeshWarmPriority);
  const selected = [];
  const seen = new Set();
  let moonCount = 0;

  for (const candidate of sorted) {
    const key = String(candidate?.key || "");
    if (!key || seen.has(key) || !candidate?.model) continue;

    const focused = candidate?.focused === true;
    const visible = candidate?.visible === true;
    const radiusPx = warmCandidateRadius(candidate);
    if (!focused && !visible) continue;
    if (!focused && radiusPx < minProjectedRadiusPx) continue;
    if (candidate?.kind === "moon" && !focused && moonCount >= maxMoonItems) continue;

    selected.push(candidate);
    seen.add(key);
    if (candidate?.kind === "moon" && !focused) moonCount += 1;
    if (selected.length >= maxItems) break;
  }

  return selected;
}

export function buildSystemRenderProfile({
  focusedBodyId = null,
  focusedBodyKind = null,
  isPlaying = false,
  totalComets = 0,
  totalDebrisDisks = 0,
  totalMoons = 0,
  zoom = 1,
} = {}) {
  const focusedParentKind =
    focusedBodyKind === "planet" || focusedBodyKind === "gasGiant" ? focusedBodyKind : null;
  const focusedParentId = focusedParentKind ? focusedBodyId : null;

  let moonMode = "summary";
  if (zoom >= 6.0 || (focusedParentId && zoom >= 3.8)) moonMode = "full";
  else if (zoom >= 2.2 || focusedParentId) moonMode = "major";

  if (!focusedParentId && totalMoons > 120 && moonMode === "full") moonMode = "major";
  if (!focusedParentId && isPlaying && totalMoons > 40 && zoom < 3.2) moonMode = "summary";

  let defaultMoonBudgets;
  let focusedMoonBudgets;
  let labelMaxCount;
  let labelMinPriority;
  let debrisParticleScale;
  let cometDetailLevel;
  let cometLabelLimit;
  let moonHelperMode = "off";
  let showMoonSummaries = true;
  let warmBodyBudgets;

  if (moonMode === "full") {
    defaultMoonBudgets = focusedParentId
      ? { bodyLimit: 4, orbitLimit: 4, labelLimit: isPlaying ? 2 : 4 }
      : { bodyLimit: Infinity, orbitLimit: Infinity, labelLimit: isPlaying ? 6 : 12 };
    focusedMoonBudgets = {
      bodyLimit: Infinity,
      orbitLimit: Infinity,
      labelLimit: isPlaying ? 10 : 16,
    };
    labelMaxCount = focusedParentId ? (isPlaying ? 34 : 52) : isPlaying ? 56 : 80;
    labelMinPriority = 0;
    debrisParticleScale = isPlaying ? 0.42 : 0.7;
    cometDetailLevel = "full";
    cometLabelLimit = Math.max(6, 10 - Math.max(0, totalComets - 8));
    moonHelperMode = focusedParentId ? "focused" : zoom >= 4.4 ? "all" : "focused";
    showMoonSummaries = !!focusedParentId;
    warmBodyBudgets = {
      maxItems: focusedParentId ? (isPlaying ? 10 : 14) : isPlaying ? 8 : 12,
      maxMoonItems: focusedParentId ? (isPlaying ? 4 : 6) : isPlaying ? 2 : 4,
      maxBatchItems: focusedParentId ? (isPlaying ? 2 : 3) : isPlaying ? 2 : 3,
      minProjectedRadiusPx: 4,
    };
  } else if (moonMode === "major") {
    defaultMoonBudgets = { bodyLimit: 2, orbitLimit: 2, labelLimit: 1 };
    focusedMoonBudgets = { bodyLimit: 10, orbitLimit: 10, labelLimit: 4 };
    labelMaxCount = isPlaying ? 24 : 34;
    labelMinPriority = 18;
    debrisParticleScale = isPlaying ? 0.2 : 0.34;
    cometDetailLevel = "reduced";
    cometLabelLimit = Math.max(4, 7 - Math.max(0, totalComets - 10));
    moonHelperMode = focusedParentId && zoom >= 4.0 ? "focused" : "off";
    warmBodyBudgets = {
      maxItems: focusedParentId ? (isPlaying ? 7 : 10) : isPlaying ? 6 : 8,
      maxMoonItems: focusedParentId ? (isPlaying ? 3 : 4) : 2,
      maxBatchItems: focusedParentId ? 2 : 2,
      minProjectedRadiusPx: 5,
    };
  } else {
    defaultMoonBudgets = { bodyLimit: 0, orbitLimit: 0, labelLimit: 0 };
    focusedMoonBudgets = { bodyLimit: 6, orbitLimit: 6, labelLimit: 3 };
    labelMaxCount = isPlaying ? 14 : 18;
    labelMinPriority = 34;
    debrisParticleScale = totalDebrisDisks > 1 ? 0.08 : 0.12;
    cometDetailLevel = focusedBodyKind === "comet" ? "reduced" : "minimal";
    cometLabelLimit = Math.max(2, 4 - Math.max(0, totalComets - 8));
    moonHelperMode = "off";
    warmBodyBudgets = {
      maxItems: focusedParentId ? (isPlaying ? 4 : 6) : isPlaying ? 3 : 4,
      maxMoonItems: focusedParentId ? 2 : 0,
      maxBatchItems: 1,
      minProjectedRadiusPx: 6,
    };
  }

  return {
    cometDetailLevel,
    cometLabelLimit,
    debrisParticleScale,
    defaultMoonBudgets,
    focusedMoonBudgets,
    focusedParentId,
    focusedParentKind,
    labelMaxCount,
    labelMinPriority,
    moonHelperMode,
    moonMode,
    showMoonSummaries,
    warmBodyBudgets,
  };
}
