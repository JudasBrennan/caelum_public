import { buildHomeSystemContext } from "../homeSystem/context.js";
import { buildHostFrameSlotCatalogs } from "./slotCatalog.js";

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function buildCandidateWorld(topologyDraft, worldSystemInputs) {
  return {
    star: topologyDraft?.star || {},
    stellarSystem: topologyDraft?.stellarSystem || null,
    system: {
      orbitMode: "guided",
      spacingFactor: worldSystemInputs.spacingFactor,
      orbit1Au: worldSystemInputs.orbit1Au,
      gasGiants: { selectedId: null, order: [], byId: {} },
      debrisDisks: { order: [], byId: {} },
    },
    planets: { selectedId: null, order: [], byId: {} },
    moons: { selectedId: null, order: [], byId: {} },
  };
}

function desiredSpacingFamilies(ladderBias = "balanced") {
  switch (String(ladderBias || "")) {
    case "compact":
      return [0.12, 0.18, 0.24, 0.3];
    case "spacious":
      return [0.3, 0.42, 0.58, 0.76];
    case "balanced":
    default:
      return [0.18, 0.26, 0.36, 0.48];
  }
}

function buildHostFramePreferences(seedContext, bodyTargets = {}) {
  const hostFrames = Object.values(seedContext?.hostFramesById || {});
  return hostFrames
    .map((hostFrame) => {
      const hz = hostFrame?.zones?.habitableZoneAu || null;
      const hzWidth =
        hz && Number.isFinite(Number(hz.outer)) && Number.isFinite(Number(hz.inner))
          ? Math.max(0, Number(hz.outer) - Number(hz.inner))
          : 0;
      const baseScore = hostFrame?.frameKind === "star" ? 8 : 5;
      const homeworldBias = bodyTargets?.requireTemperateHomeworld ? hzWidth * 12 : hzWidth * 6;
      const defaultBias =
        hostFrame?.id === seedContext?.defaultHostFrameId
          ? bodyTargets?.requireTemperateHomeworld
            ? 4
            : 2
          : 0;
      const preferredFrameKindBias =
        bodyTargets?.preferredHomeworldFrameKind === "pair"
          ? hostFrame?.frameKind === "pair"
            ? 16
            : -10
          : bodyTargets?.preferredHomeworldFrameKind === "star"
            ? hostFrame?.frameKind === "star"
              ? 12
              : -8
            : 0;
      return {
        id: hostFrame.id,
        hostFrame,
        score: baseScore + homeworldBias + defaultBias + preferredFrameKindBias,
      };
    })
    .sort((left, right) => right.score - left.score);
}

function buildLadderCandidates(seedContext, request, bodyTargets = {}) {
  const hostPreferences = buildHostFramePreferences(seedContext, bodyTargets);
  const spacingValues = desiredSpacingFamilies(bodyTargets.ladderBias);
  const targetSlotIndices =
    bodyTargets.requireTemperateHomeworld || bodyTargets.requireRockyHomeworld
      ? [2, 3, 4, 5]
      : [1, 2, 3, 4, 5];
  const seen = new Set();
  const candidates = [];

  for (const entry of hostPreferences.slice(0, 4)) {
    const hz = entry.hostFrame?.zones?.habitableZoneAu || null;
    const hzCenter =
      hz && Number.isFinite(Number(hz.inner)) && Number.isFinite(Number(hz.outer))
        ? (Number(hz.inner) + Number(hz.outer)) / 2
        : null;
    const stableInnerAu = Math.max(
      0.05,
      toFiniteNumber(entry.hostFrame?.zones?.systemInnerLimitAu, 0.05),
      entry.hostFrame?.frameKind === "pair"
        ? toFiniteNumber(entry.hostFrame?.stability?.criticalInnerAu, 0.05)
        : 0,
    );

    for (const spacingFactor of spacingValues) {
      for (const slotIndex of targetSlotIndices) {
        let orbit1Au = stableInnerAu * 1.2;
        if (hzCenter != null && slotIndex > 1) {
          orbit1Au = hzCenter - spacingFactor * 2 ** (slotIndex - 2);
        } else if (hzCenter != null && slotIndex === 1) {
          orbit1Au = hzCenter * 0.6;
        }
        orbit1Au = Math.max(stableInnerAu * 1.08, orbit1Au);
        const key = `${spacingFactor.toFixed(3)}:${orbit1Au.toFixed(3)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push({
          worldSystemInputs: {
            spacingFactor: Number(spacingFactor.toFixed(3)),
            orbit1Au: Number(orbit1Au.toFixed(3)),
          },
          seedHostFrameId: entry.id,
          seedHostFrameLabel: entry.hostFrame?.label || entry.id,
          preferredHomeworldSlotIndex: slotIndex,
        });
      }
    }
  }

  // Generic fallbacks in case the HZ-anchored candidates underfit a weird topology.
  for (const spacingFactor of spacingValues) {
    for (const orbit1Au of [0.12, 0.22, 0.38, 0.62, 0.96]) {
      const key = `${spacingFactor.toFixed(3)}:${orbit1Au.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        worldSystemInputs: {
          spacingFactor: Number(spacingFactor.toFixed(3)),
          orbit1Au: Number(orbit1Au.toFixed(3)),
        },
        seedHostFrameId: seedContext?.defaultHostFrameId || "star_a",
        seedHostFrameLabel:
          seedContext?.hostFramesById?.[seedContext?.defaultHostFrameId]?.label || "Default host",
        preferredHomeworldSlotIndex: 3,
      });
    }
  }

  return candidates;
}

function scoreSlotCatalogs(slotCatalogs, request, bodyTargets = {}) {
  const allSlots = slotCatalogs?.allSlots || [];
  const usableSlots = allSlots.filter((slot) => slot.usable);
  const rockySlots = usableSlots.filter(
    (slot) => slot.interiorToFrostLine || slot.nearHabitableZone || slot.withinHabitableZone,
  );
  const giantSlots = usableSlots.filter((slot) => slot.beyondFrostLine);
  const temperateSlots = usableSlots.filter((slot) => slot.withinHabitableZone);
  let score = usableSlots.length * 2 + rockySlots.length * 4 + giantSlots.length * 4;

  if (bodyTargets.requireTemperateHomeworld) {
    score += temperateSlots.length ? 30 + temperateSlots[0].homeworldScore : -200;
  } else if (bodyTargets.requireRockyHomeworld) {
    score += rockySlots.length ? 20 + rockySlots[0].rockyScore : -140;
  }

  if (rockySlots.length < Math.max(0, Number(bodyTargets.rockyCount || 0))) {
    score -= 40 * (Math.max(0, Number(bodyTargets.rockyCount || 0)) - rockySlots.length);
  }
  if (giantSlots.length < Math.max(0, Number(bodyTargets.gasGiantCount || 0))) {
    score -= 30 * (Math.max(0, Number(bodyTargets.gasGiantCount || 0)) - giantSlots.length);
  }

  const preferredMultistar =
    request?.multistarBias === "prefer-multistar"
      ? 1
      : request?.multistarBias === "prefer-single"
        ? -1
        : 0;
  const pairSlotCount = usableSlots.filter((slot) => slot.frameKind === "pair").length;
  score += preferredMultistar * pairSlotCount;

  const bestHomeworldSlot = [...temperateSlots, ...rockySlots].sort(
    (left, right) => right.homeworldScore - left.homeworldScore,
  )[0];

  return {
    score,
    usableSlots,
    rockySlots,
    giantSlots,
    temperateSlots,
    bestHomeworldSlot: bestHomeworldSlot || null,
  };
}

export function tuneOrbitLadder({ topologyDraft, request, bodyTargets, attemptIndex = 0 } = {}) {
  const seedContext = buildHomeSystemContext(
    buildCandidateWorld(topologyDraft, {
      spacingFactor: 0.33,
      orbit1Au: 0.62,
    }),
  );
  const resolvedBodyTargets =
    bodyTargets && typeof bodyTargets === "object"
      ? {
          ...bodyTargets,
          preferredHomeworldFrameKind:
            bodyTargets.preferredHomeworldFrameKind || request?.preferredHomeworldFrameKind || null,
        }
      : bodyTargets;
  const candidates = buildLadderCandidates(seedContext, request, resolvedBodyTargets);

  const evaluations = [];
  for (const candidate of candidates) {
    const world = buildCandidateWorld(topologyDraft, candidate.worldSystemInputs);
    const homeSystemContext = buildHomeSystemContext(world);
    const slotCatalogs = buildHostFrameSlotCatalogs(homeSystemContext);
    const scoring = scoreSlotCatalogs(slotCatalogs, request, resolvedBodyTargets);

    const evaluation = {
      ...candidate,
      homeSystemContext,
      slotCatalogs,
      scoring,
    };
    evaluations.push(evaluation);
  }

  evaluations.sort((left, right) => right.scoring.score - left.scoring.score);
  const best =
    evaluations[Math.max(0, Math.min(evaluations.length - 1, Number(attemptIndex) || 0))];

  if (!best) {
    return {
      ok: false,
      diagnostics: [
        {
          severity: "blocked",
          code: "no-ladder-candidates",
          title: "No viable orbit ladder candidate",
          detail: "The current topology could not produce any candidate orbit ladder to evaluate.",
        },
      ],
    };
  }

  return {
    ok: true,
    worldSystemInputs: best.worldSystemInputs,
    homeSystemContext: best.homeSystemContext,
    slotCatalogs: best.slotCatalogs,
    seedHostFrameId: best.seedHostFrameId,
    seedHostFrameLabel: best.seedHostFrameLabel,
    preferredHomeworldSlotIndex: best.preferredHomeworldSlotIndex,
    scoring: best.scoring,
    diagnostics: [],
  };
}
