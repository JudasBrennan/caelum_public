import { synthesizeGasGiant, synthesizeMoon, synthesizeRockyPlanet } from "./bodySynthesizer.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function compareByScoreThenDistance(scoreKey, direction = "desc") {
  const sign = direction === "asc" ? 1 : -1;
  return (left, right) => {
    const leftScore = Number(left?.[scoreKey] || 0);
    const rightScore = Number(right?.[scoreKey] || 0);
    if (leftScore !== rightScore) return sign * (leftScore - rightScore);
    return Number(left?.au || 0) - Number(right?.au || 0);
  };
}

function sortHostFramesForDebris(slotCatalogs) {
  return Object.values(slotCatalogs?.catalogsByHostFrameId || {}).sort((left, right) => {
    const leftOuter = Number(left?.stableOuterAu ?? Number.POSITIVE_INFINITY);
    const rightOuter = Number(right?.stableOuterAu ?? Number.POSITIVE_INFINITY);
    return rightOuter - leftOuter;
  });
}

function chooseAvailableSlot(slots, { usedKeys, blockedKeys }) {
  return (slots || []).find(
    (slot) => slot?.usable && !usedKeys.has(slot.key) && !blockedKeys.has(slot.key),
  );
}

function blockNeighborSlots(slot, blockedKeys) {
  if (!slot) return;
  const hostFrameId = String(slot.hostFrameId || "");
  const slotIndex = Number(slot.slotIndex || 0);
  for (const delta of [-1, 0, 1]) {
    blockedKeys.add(`${hostFrameId}:${slotIndex + delta}`);
  }
}

function countByHostFrame(entries = []) {
  const counts = Object.create(null);
  for (const entry of entries) {
    const hostFrameId = String(entry?.hostFrameId || "").trim() || "star_a";
    if (!counts[hostFrameId])
      counts[hostFrameId] = { rockyPlanets: 0, gasGiants: 0, debrisDisks: 0 };
    if (entry.kind === "gasGiant") counts[hostFrameId].gasGiants += 1;
    else if (entry.kind === "debris") counts[hostFrameId].debrisDisks += 1;
    else counts[hostFrameId].rockyPlanets += 1;
  }
  return counts;
}

function buildDebrisDisk({ id, name, hostFrameId, innerAu, outerAu }) {
  return {
    id,
    name,
    hostFrameId,
    innerAu: Number(innerAu.toFixed(3)),
    outerAu: Number(outerAu.toFixed(3)),
    suggested: true,
  };
}

function preservedOrbitToleranceAu(targetAu) {
  const distance = Math.max(0, Number(targetAu) || 0);
  return Math.max(0.08, distance * 0.16);
}

function findPreservedHomeworldSlot(candidate, slots, { usedKeys, blockedKeys } = {}) {
  const hostFrameId = String(candidate?.hostFrameId || "").trim();
  const preferredSlotIndex = Number(candidate?.slotIndex || 0);
  const targetAu = Number(candidate?.inputs?.semiMajorAxisAu || 0);
  if (!hostFrameId || !(targetAu > 0)) return null;

  const available = (slots || []).filter(
    (slot) =>
      slot?.usable &&
      slot.hostFrameId === hostFrameId &&
      !usedKeys?.has(slot.key) &&
      !blockedKeys?.has(slot.key),
  );
  if (!available.length) return null;

  if (preferredSlotIndex >= 1) {
    const slotMatch = available.find((slot) => Number(slot?.slotIndex || 0) === preferredSlotIndex);
    if (slotMatch) return slotMatch;
  }

  const toleranceAu = preservedOrbitToleranceAu(targetAu);
  const closest = [...available].sort(
    (left, right) =>
      Math.abs(Number(left?.au || 0) - targetAu) - Math.abs(Number(right?.au || 0) - targetAu),
  )[0];
  if (!closest) return null;
  return Math.abs(Number(closest.au || 0) - targetAu) <= toleranceAu ? closest : null;
}

function materializePreservedHomeworld(candidate, slot) {
  const next = clone(candidate || {});
  next.hostFrameId = String(slot?.hostFrameId || next?.hostFrameId || "").trim() || null;
  next.slotIndex = Number(slot?.slotIndex || next?.slotIndex || null);
  next.locked = false;
  next.inputs = {
    ...(next?.inputs && typeof next.inputs === "object" ? next.inputs : {}),
    semiMajorAxisAu: Number(slot?.au || next?.inputs?.semiMajorAxisAu || 0),
  };
  if (!next.name) next.name = "Homeworld";
  return next;
}

export function allocateSystemBodies({ request, bodyTargets, tunedLadder, namePicker, rng } = {}) {
  const allSlots = [...(tunedLadder?.slotCatalogs?.usableSlots || [])];
  const usedKeys = new Set();
  const blockedKeys = new Set();
  const diagnostics = [];
  const planets = [];
  const gasGiants = [];
  const moons = [];
  const debrisDisks = [];

  const giantSlots = [...allSlots]
    .filter((slot) => slot.beyondFrostLine)
    .sort(compareByScoreThenDistance("giantScore"));
  const homeworldSlots = [...allSlots]
    .filter((slot) =>
      bodyTargets?.requireTemperateHomeworld ? slot.withinHabitableZone : slot.rockyScore > -100,
    )
    .sort(compareByScoreThenDistance("homeworldScore"));
  const rockySlots = [...allSlots]
    .filter((slot) => slot.rockyScore > -100)
    .sort(compareByScoreThenDistance("rockyScore"));

  for (let giantIndex = 0; giantIndex < Number(bodyTargets?.gasGiantCount || 0); giantIndex += 1) {
    const slot = chooseAvailableSlot(giantSlots, { usedKeys, blockedKeys });
    if (!slot) break;
    usedKeys.add(slot.key);
    blockNeighborSlots(slot, blockedKeys);
    gasGiants.push({
      kind: "gasGiant",
      ...synthesizeGasGiant({
        id: `gg${gasGiants.length + 1}`,
        name: namePicker.pickPlanetName(),
        slot,
        rng: rng.fork(`gas-giant:${giantIndex}`),
      }),
    });
  }

  let homeworld = null;
  let preservedHomeworld = null;
  const preservedHomeworldCandidate =
    bodyTargets?.preservedHomeworldCandidate &&
    typeof bodyTargets.preservedHomeworldCandidate === "object"
      ? bodyTargets.preservedHomeworldCandidate
      : null;
  if (preservedHomeworldCandidate) {
    const preservedSlot = findPreservedHomeworldSlot(
      preservedHomeworldCandidate,
      [...homeworldSlots, ...rockySlots],
      { usedKeys, blockedKeys },
    );
    if (preservedSlot) {
      usedKeys.add(preservedSlot.key);
      blockNeighborSlots(preservedSlot, blockedKeys);
      preservedHomeworld = materializePreservedHomeworld(
        preservedHomeworldCandidate,
        preservedSlot,
      );
      homeworld = preservedHomeworld;
      planets.push(preservedHomeworld);
    } else {
      diagnostics.push({
        severity: "warning",
        code: "preserved-homeworld-unavailable",
        title: "Selected homeworld could not be preserved",
        detail:
          "The tuned orbit ladder no longer contained a compatible slot for the selected homeworld, so the generator fell back to a fresh rocky candidate.",
      });
    }
  }

  if (bodyTargets?.requireRockyHomeworld || bodyTargets?.requireTemperateHomeworld) {
    if (!homeworld) {
      const slot = chooseAvailableSlot(homeworldSlots, { usedKeys, blockedKeys });
      if (!slot) {
        diagnostics.push({
          severity: bodyTargets.requireTemperateHomeworld ? "blocked" : "warning",
          code: "missing-homeworld-slot",
          title: "No defended homeworld slot",
          detail: bodyTargets.requireTemperateHomeworld
            ? "The tuned orbit ladder did not leave a stable habitable slot for the requested rocky homeworld."
            : "The tuned orbit ladder did not leave a defended rocky slot for the requested homeworld.",
        });
      } else {
        usedKeys.add(slot.key);
        homeworld = {
          kind: "planet",
          ...synthesizeRockyPlanet({
            id: `p${planets.length + 1}`,
            name: namePicker.pickPlanetName(),
            slot,
            request,
            rng: rng.fork("homeworld"),
            isHomeworld: true,
          }),
        };
        planets.push(homeworld);
      }
    }
  }

  const remainingRockyCount = Math.max(
    0,
    Number(bodyTargets?.rockyCount || 0) - (homeworld ? 1 : 0),
  );
  for (let rockyIndex = 0; rockyIndex < remainingRockyCount; rockyIndex += 1) {
    const slot = chooseAvailableSlot(rockySlots, { usedKeys, blockedKeys });
    if (!slot) break;
    usedKeys.add(slot.key);
    planets.push({
      kind: "planet",
      ...synthesizeRockyPlanet({
        id: `p${planets.length + 1}`,
        name: namePicker.pickPlanetName(),
        slot,
        request,
        rng: rng.fork(`rocky:${rockyIndex}`),
        isHomeworld: false,
      }),
    });
  }

  const moonParents = [
    ...gasGiants.map((parent) => ({ id: parent.id, kind: "gasGiant" })),
    ...(homeworld
      ? [{ id: homeworld.id, kind: "planet" }]
      : planets.slice(0, 1).map((parent) => ({ id: parent.id, kind: "planet" }))),
  ];
  let moonIndex = 0;
  while (moonIndex < Number(bodyTargets?.moonBudget || 0) && moonParents.length) {
    const parent = moonParents[moonIndex % moonParents.length];
    moons.push(
      synthesizeMoon({
        id: `m${moons.length + 1}`,
        name: namePicker.pickMoonName(),
        request,
        parentId: parent.id,
        parentKind: parent.kind,
        index: Math.floor(moonIndex / moonParents.length),
        rng: rng.fork(`moon:${moonIndex}`),
      }),
    );
    moonIndex += 1;
  }

  const occupiedByHostFrame = [...planets, ...gasGiants].reduce((map, body) => {
    const hostFrameId = String(body?.hostFrameId || "").trim() || "star_a";
    const orbitAu = Number(body?.inputs?.semiMajorAxisAu ?? body?.au ?? 0);
    if (!map.has(hostFrameId)) map.set(hostFrameId, []);
    if (Number.isFinite(orbitAu) && orbitAu > 0) map.get(hostFrameId).push(orbitAu);
    return map;
  }, new Map());

  for (const catalog of sortHostFramesForDebris(tunedLadder?.slotCatalogs)) {
    if (debrisDisks.length >= Number(bodyTargets?.debrisCount || 0)) break;
    const occupied = occupiedByHostFrame.get(catalog.hostFrameId) || [];
    const outermostOccupiedAu = occupied.length ? Math.max(...occupied) : 0;
    const stableOuterAu = Number(catalog?.stableOuterAu ?? 0);
    if (!(stableOuterAu > 0)) continue;
    const innerAu = Math.max(
      outermostOccupiedAu * 1.15,
      catalog.frostLineAu ? catalog.frostLineAu * 1.05 : 0.5,
    );
    const outerAu = Math.min(stableOuterAu * 0.94, Math.max(innerAu * 1.35, innerAu + 0.4));
    if (!(outerAu > innerAu + 0.08)) continue;
    debrisDisks.push(
      buildDebrisDisk({
        id: `dd${debrisDisks.length + 1}`,
        name: `${catalog.hostFrame?.label || catalog.hostFrameId} Debris`,
        hostFrameId: catalog.hostFrameId,
        innerAu,
        outerAu,
      }),
    );
  }

  const requestedRockyCount = Number(bodyTargets?.rockyCount || 0);
  const requestedGiantCount = Number(bodyTargets?.gasGiantCount || 0);
  const rockyShortfall = Math.max(0, requestedRockyCount - planets.length);
  const giantShortfall = Math.max(0, requestedGiantCount - gasGiants.length);
  if (rockyShortfall > 0 || giantShortfall > 0) {
    diagnostics.push({
      severity: "warning",
      code: "body-count-shortfall",
      title: "Draft underfilled the requested body mix",
      detail: [
        rockyShortfall > 0 ? `${rockyShortfall} rocky slot(s) could not be filled.` : "",
        giantShortfall > 0 ? `${giantShortfall} gas-giant slot(s) could not be filled.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  return {
    ok: diagnostics.every((entry) => entry.severity !== "blocked"),
    planets,
    gasGiants,
    moons,
    debrisDisks,
    homeworld,
    preservedHomeworld,
    fitClass: diagnostics.some((entry) => entry.severity === "blocked")
      ? "blocked"
      : diagnostics.length
        ? "near-miss"
        : "exact-match",
    countsByHostFrame: countByHostFrame([
      ...planets,
      ...gasGiants,
      ...debrisDisks.map((disk) => ({ kind: "debris", hostFrameId: disk.hostFrameId })),
    ]),
    diagnostics,
  };
}
