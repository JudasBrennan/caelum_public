function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function orbitSlotToleranceAu(slotAu) {
  const distance = Math.max(0, Number(slotAu) || 0);
  return Math.max(0.05, distance * 0.02);
}

function normalizeFrameWeight(hostFrame) {
  if (!hostFrame) return 0;
  if (hostFrame.frameKind === "star") return hostFrame.orbitFamilyKind === "single" ? 4 : 3;
  return 2;
}

function scoreSlot(slot, hostFrame) {
  if (!slot.usable) return -100;
  let score = 10;
  score += normalizeFrameWeight(hostFrame);
  score += slot.withinHabitableZone ? 6 : 0;
  score += slot.nearHabitableZone ? 2 : 0;
  score += slot.beyondFrostLine ? 3 : 0;
  score -= slot.tooCloseToNeighbor ? 6 : 0;
  score -= slot.nearInnerEdge ? 2 : 0;
  score -= slot.nearOuterEdge ? 2 : 0;
  return score;
}

export function buildHostFrameSlotCatalog(homeSystemContext, hostFrameId) {
  const hostFrame = homeSystemContext?.hostFramesById?.[hostFrameId] || null;
  if (!hostFrame) return null;

  const hzInner = toFiniteNumber(hostFrame?.zones?.habitableZoneAu?.inner, null);
  const hzOuter = toFiniteNumber(hostFrame?.zones?.habitableZoneAu?.outer, null);
  const frostLineAu = toFiniteNumber(hostFrame?.zones?.frostLineAu, null);
  const stableInnerAu = Math.max(
    0,
    toFiniteNumber(hostFrame?.zones?.systemInnerLimitAu, 0),
    hostFrame?.frameKind === "pair" ? toFiniteNumber(hostFrame?.stability?.criticalInnerAu, 0) : 0,
  );
  const outerCandidates = [
    toFiniteNumber(hostFrame?.stability?.criticalOuterAu, null),
    toFiniteNumber(hostFrame?.zones?.diskTruncationAu, null),
  ].filter((value) => value != null && value > 0);
  const stableOuterAu = outerCandidates.length ? Math.min(...outerCandidates) : null;
  const orbitSlots = Array.isArray(hostFrame?.system?.orbitsAu) ? hostFrame.system.orbitsAu : [];
  const spanAu =
    stableOuterAu != null && stableOuterAu > stableInnerAu ? stableOuterAu - stableInnerAu : null;
  const habitableCenterAu =
    hzInner != null && hzOuter != null && hzOuter > hzInner ? (hzInner + hzOuter) / 2 : null;

  const slots = orbitSlots.map((au, index) => {
    const slotIndex = index + 1;
    const distanceAu = Number(au);
    const previousAu = index > 0 ? Number(orbitSlots[index - 1]) : null;
    const nextAu = index + 1 < orbitSlots.length ? Number(orbitSlots[index + 1]) : null;
    const innerGapAu =
      previousAu != null ? Math.abs(distanceAu - previousAu) : Number.POSITIVE_INFINITY;
    const outerGapAu = nextAu != null ? Math.abs(nextAu - distanceAu) : Number.POSITIVE_INFINITY;
    const tooCloseToNeighbor =
      innerGapAu < Math.max(orbitSlotToleranceAu(previousAu), orbitSlotToleranceAu(distanceAu)) ||
      outerGapAu < Math.max(orbitSlotToleranceAu(nextAu), orbitSlotToleranceAu(distanceAu));
    const withinHabitableZone =
      hzInner != null && hzOuter != null && distanceAu >= hzInner && distanceAu <= hzOuter;
    const nearHabitableZone =
      hzInner != null &&
      hzOuter != null &&
      distanceAu >= hzInner * 0.82 &&
      distanceAu <= hzOuter * 1.18;
    const beyondFrostLine = frostLineAu != null && distanceAu >= frostLineAu;
    const aboveInnerLimit = distanceAu >= stableInnerAu;
    const belowOuterLimit = stableOuterAu == null || distanceAu <= stableOuterAu;
    const usable = aboveInnerLimit && belowOuterLimit && !tooCloseToNeighbor;
    const distanceFromHabitableCenterAu =
      habitableCenterAu != null
        ? Math.abs(distanceAu - habitableCenterAu)
        : Number.POSITIVE_INFINITY;
    const edgeRatio = spanAu != null && spanAu > 0 ? (distanceAu - stableInnerAu) / spanAu : null;
    const nearInnerEdge = edgeRatio != null && edgeRatio < 0.08;
    const nearOuterEdge = edgeRatio != null && edgeRatio > 0.92;

    const slot = {
      key: `${hostFrameId}:${slotIndex}`,
      hostFrameId,
      hostFrameLabel: hostFrame.label,
      frameKind: hostFrame.frameKind,
      orbitFamilyKind: hostFrame.orbitFamilyKind,
      slotIndex,
      au: distanceAu,
      stableInnerAu,
      stableOuterAu,
      habitableZoneAu:
        hzInner != null && hzOuter != null ? { inner: hzInner, outer: hzOuter } : null,
      frostLineAu,
      aboveInnerLimit,
      belowOuterLimit,
      withinHabitableZone,
      nearHabitableZone,
      beyondFrostLine,
      interiorToFrostLine: frostLineAu != null ? distanceAu < frostLineAu : true,
      tooCloseToNeighbor,
      nearInnerEdge,
      nearOuterEdge,
      usable,
      distanceFromHabitableCenterAu,
      hostFrameWeight: normalizeFrameWeight(hostFrame),
    };
    slot.score = scoreSlot(slot, hostFrame);
    slot.homeworldScore =
      slot.score +
      (slot.withinHabitableZone ? 6 : 0) +
      (slot.frameKind === "star" ? 2 : 0) -
      (slot.beyondFrostLine ? 4 : 0);
    slot.rockyScore =
      slot.score + (slot.interiorToFrostLine ? 2 : -3) + (slot.withinHabitableZone ? 2 : 0);
    slot.giantScore = slot.score + (slot.beyondFrostLine ? 8 : -8) - (slot.nearOuterEdge ? 2 : 0);
    return slot;
  });

  return {
    hostFrameId,
    hostFrame,
    stableInnerAu,
    stableOuterAu,
    habitableZoneAu: hzInner != null && hzOuter != null ? { inner: hzInner, outer: hzOuter } : null,
    frostLineAu,
    usableSlots: slots.filter((slot) => slot.usable),
    allSlots: slots,
  };
}

export function buildHostFrameSlotCatalogs(homeSystemContext) {
  const catalogsByHostFrameId = Object.create(null);
  const allSlots = [];
  for (const hostFrameId of Object.keys(homeSystemContext?.hostFramesById || {})) {
    const catalog = buildHostFrameSlotCatalog(homeSystemContext, hostFrameId);
    if (!catalog) continue;
    catalogsByHostFrameId[hostFrameId] = catalog;
    allSlots.push(...catalog.allSlots);
  }
  return {
    catalogsByHostFrameId,
    allSlots,
    usableSlots: allSlots.filter((slot) => slot.usable),
  };
}
