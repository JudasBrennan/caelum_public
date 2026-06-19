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

function longTermGuidance(context = {}) {
  const softWarnings = [];
  const repairSuggestions = [];
  const outputs = context.longTermDynamicsContext?.outputs || {};
  const kozaiClass = String(outputs.kozaiLidovClass || "unknown");

  if (kozaiClass === "possible" || kozaiClass === "likely") {
    softWarnings.push({
      code: "long-term-kozai-lidov-susceptibility",
      targetId: context.longTermDynamicsContext?.inputs?.hostFrameId || "system",
      title: "Long-term Kozai-Lidov susceptibility",
      detail:
        "Hierarchical secular diagnostics indicate possible Kozai-Lidov cycling; this is a bounded warning, not an integrated orbital history.",
    });
    addSuggestion(repairSuggestions, {
      code: "review-mutual-inclination",
      targetId: context.longTermDynamicsContext?.inputs?.hostFrameId || "system",
      label: "Review mutual inclination",
      detail:
        "Lowering mutual inclination or widening the hierarchy can reduce Kozai-Lidov susceptibility.",
    });
  }

  for (const body of Object.values(context.bodies || {})) {
    const trojan = body.longTermDynamicsContext?.trojanPopulationContext?.outputs || null;
    if (!trojan) continue;
    const linearlyStable = String(trojan.l45LinearStabilityClass || "");
    const region = String(trojan.stabilityRegionClass || "");
    if (linearlyStable !== "linearly-unstable" && region !== "eroded") continue;
    softWarnings.push({
      code: "trojan-reservoir-unstable",
      targetId: body.bodyId,
      title: "Trojan reservoir is not well supported",
      detail:
        "L4/L5 reservoir diagnostics are unstable or eroded for this body; do not assume a populated Trojan swarm.",
      hostFrameId: body.hostFrameId,
    });
  }

  for (const body of Object.values(context.bodies || {})) {
    const variability = body.dynamicalVariabilityContext?.outputs || {};
    const messages = Array.isArray(variability.generationGuardrailMessages)
      ? variability.generationGuardrailMessages
      : [];
    const risk = String(variability.dynamicalVariabilityRiskClass || "unknown");
    if (!messages.length && !["moderate", "high"].includes(risk)) continue;
    softWarnings.push({
      code: "dynamical-variability-guardrail",
      targetId: body.bodyId,
      title: "Long-cycle variability needs review",
      detail:
        messages[0] ||
        "Long-term dynamical variability is a warning for guided generation, not an automatic orbit rewrite.",
      hostFrameId: body.hostFrameId,
    });
    addSuggestion(repairSuggestions, {
      code: "review-dynamical-variability",
      targetId: body.bodyId,
      label: "Review variability",
      detail:
        "Check eccentricity, inclination, and spin-orbit context before treating the orbit as climate-stable.",
      hostFrameId: body.hostFrameId,
    });
  }

  return { softWarnings, repairSuggestions };
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

  const longTerm = longTermGuidance(context);
  softWarnings.push(...longTerm.softWarnings);
  repairSuggestions.push(...longTerm.repairSuggestions);

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
