function addSuggestion(list, suggestion) {
  if (!suggestion?.code) return;
  if (
    list.some((entry) => entry.code === suggestion.code && entry.targetId === suggestion.targetId)
  ) {
    return;
  }
  list.push(suggestion);
}

function architectureGuidance(hostFrameId, architecture) {
  const summary = architecture?.summary || {};
  const hardBlocks = [];
  const softWarnings = [];
  const repairSuggestions = [];
  const state = String(summary.state || "unknown");
  const pairIds = Array.isArray(summary.limitingPairIds) ? summary.limitingPairIds : [];
  const targetId = pairIds.join(":") || hostFrameId;

  if (state === "unstable") {
    hardBlocks.push({
      code: "mutual-hill-unstable",
      targetId,
      title: "Generated or authored orbital pair is below the mutual-Hill boundary",
      detail:
        summary.note ||
        "Adjacent bodies are below the conservative circular coplanar stability boundary.",
      hostFrameId,
    });
    addSuggestion(repairSuggestions, {
      code: "widen-mutual-hill-spacing",
      targetId,
      label: "Choose wider spacing",
      detail:
        "Move one adjacent body outward or inward until the pair clears the mutual-Hill guard.",
      hostFrameId,
    });
  } else if (state === "crowded" || state === "packed") {
    softWarnings.push({
      code: `mutual-hill-${state}`,
      targetId,
      title: state === "crowded" ? "Crowded orbital spacing" : "Packed orbital spacing",
      detail:
        summary.note || "Adjacent bodies are dynamically close in this simplified diagnostic.",
      hostFrameId,
    });
    addSuggestion(repairSuggestions, {
      code: "consider-wider-spacing",
      targetId,
      label: "Consider wider spacing",
      detail: "A wider orbit ladder would improve long-term architecture confidence.",
      hostFrameId,
    });
  }

  if (summary.confidence === "low" && state !== "unknown") {
    softWarnings.push({
      code: "orbital-architecture-low-confidence",
      targetId,
      title: "Architecture confidence reduced",
      detail: summary.note || "Eccentric or overlapping adjacent orbits reduce confidence.",
      hostFrameId,
    });
    addSuggestion(repairSuggestions, {
      code: "lower-eccentricity",
      targetId,
      label: "Lower eccentricity",
      detail: "Reducing eccentricity can move this pair back inside the model's stronger bounds.",
      hostFrameId,
    });
  }

  return { hardBlocks, softWarnings, repairSuggestions };
}

function moonGuidance(body) {
  const hardBlocks = [];
  const softWarnings = [];
  const repairSuggestions = [];
  const stability = body?.stabilityContext || {};
  const tidal = body?.tidalContext || {};
  const reasons = Array.isArray(stability.reasons) ? stability.reasons : [];
  const note = reasons.join(" ") || stability.limitingConstraint || "";

  if (stability.state === "unstable") {
    hardBlocks.push({
      code: "moon-orbit-hard-constraint",
      targetId: body.bodyId,
      title: "Moon violates a hard orbital constraint",
      detail: note || "Moon orbit crosses a Roche, collision, or formal Hill guard.",
    });
    addSuggestion(repairSuggestions, {
      code: "assign-valid-moon-orbit",
      targetId: body.bodyId,
      label: "Assign a valid parent",
      detail: "Move the moon inside the formal Hill region and outside the collision/Roche guard.",
    });
  } else if (stability.confidence === "low") {
    softWarnings.push({
      code: "moon-orbit-low-confidence",
      targetId: body.bodyId,
      title: "Moon orbital confidence reduced",
      detail: note || "Moon orbit is near the edge of the bounded stability model.",
    });
    addSuggestion(repairSuggestions, {
      code: "treat-moon-as-uncertain",
      targetId: body.bodyId,
      label: "Treat as uncertain",
      detail: "Keep the moon, but avoid treating its long-term environment as settled.",
    });
  }

  if (tidal.eccentricityPersistence === "uncertain" && tidal.sustainedHeatingClass !== "low") {
    softWarnings.push({
      code: "tidal-persistence-uncertain",
      targetId: body.bodyId,
      title: "Tidal persistence is uncertain",
      detail:
        "Current tidal heat may not be sustained without stronger resonance or damping context.",
    });
  }

  return { hardBlocks, softWarnings, repairSuggestions };
}

export function buildGenerationGuidanceForContext(context = {}) {
  const hardBlocks = [];
  const softWarnings = [];
  const repairSuggestions = [];

  for (const [hostFrameId, frame] of Object.entries(context.hostFrames || {})) {
    const guidance = architectureGuidance(hostFrameId, frame.orbitalArchitecture);
    hardBlocks.push(...guidance.hardBlocks);
    softWarnings.push(...guidance.softWarnings);
    repairSuggestions.push(...guidance.repairSuggestions);
  }

  for (const body of Object.values(context.bodies || {})) {
    if (body.bodyKind !== "moon") continue;
    const guidance = moonGuidance(body);
    hardBlocks.push(...guidance.hardBlocks);
    softWarnings.push(...guidance.softWarnings);
    repairSuggestions.push(...guidance.repairSuggestions);
  }

  return {
    modelVersion: "dynamical-generation-guidance-v1",
    hardBlocks,
    softWarnings,
    repairSuggestions,
    fitClass: hardBlocks.length ? "blocked" : softWarnings.length ? "near-miss" : "exact-match",
    displayNotes: [
      ...hardBlocks.map((entry) => entry.detail),
      ...softWarnings.map((entry) => entry.detail),
    ].filter(Boolean),
  };
}
