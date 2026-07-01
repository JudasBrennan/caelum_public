const MODEL_VERSION = "system-fate-timeline-v1";

const CONFIDENCE_ORDER = Object.freeze({
  unsupported: 0,
  low: 1,
  medium: 2,
  high: 3,
});

const STATUS_LABELS = Object.freeze({
  "current-candidate": "Current Promising World",
  "future-candidate": "Future Window",
  "subsurface-candidate": "Subsurface Promising World",
  "too-hot": "Too hot",
  "cold-now": "Cold now",
  "volatile-giant": "Volatile / giant",
  substellar: "Substellar",
  "at-risk": "At risk",
  "not-evaluated": "Not evaluated",
  neutral: "Context",
});

const BAD_MARKER_KINDS = new Set([
  "engulfment",
  "supernova-transition",
  "giant-envelope-drag",
  "runaway-risk",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function round(value, decimals = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** decimals;
  return Math.round(number * factor) / factor;
}

function safeText(value, fallback = "") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function titleCase(value) {
  const text = safeText(value, "unknown").replace(/[-_]+/g, " ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function confidenceMin(...values) {
  const normalized = values.map((value) => safeText(value, "medium").toLowerCase()).filter(Boolean);
  if (!normalized.length) return "medium";
  return normalized.reduce((lowest, value) =>
    (CONFIDENCE_ORDER[value] ?? 2) < (CONFIDENCE_ORDER[lowest] ?? 2) ? value : lowest,
  );
}

function formatGyr(value, decimals = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unknown";
  if (number < 0.001) return `${round(number * 1_000_000, 0)} kyr`;
  if (number < 1) return `${round(number * 1000, number < 0.01 ? 1 : 0)} Myr`;
  return `${round(number, number < 10 ? decimals : 1)} Gyr`;
}

function formatAu(value, decimals = 3) {
  const number = Number(value);
  return Number.isFinite(number) ? `${round(number, decimals)} AU` : "n/a";
}

function formatNumber(value, decimals = 2, suffix = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  return `${round(number, decimals)}${suffix}`;
}

function stateForInterval(startGyr, endGyr, currentAgeGyr) {
  const start = finiteOrNull(startGyr);
  const end = finiteOrNull(endGyr);
  const current = finiteOrNull(currentAgeGyr);
  if (current == null) return "conditional";
  if (end != null && current > end) return "past";
  if (start != null && current < start) return "future";
  return "current";
}

function normalizeHz(input = {}) {
  const hz = isObject(input) ? input : {};
  const conservativeInner =
    finiteOrNull(hz.conservativeInner) ??
    finiteOrNull(hz.innerAu) ??
    finiteOrNull(hz.inner) ??
    finiteOrNull(hz.hzInnerAu);
  const conservativeOuter =
    finiteOrNull(hz.conservativeOuter) ??
    finiteOrNull(hz.outerAu) ??
    finiteOrNull(hz.outer) ??
    finiteOrNull(hz.hzOuterAu);
  const optimisticInner =
    finiteOrNull(hz.optimisticInner) ??
    finiteOrNull(hz.optimisticInnerAu) ??
    finiteOrNull(hz.hzOptimisticInnerAu) ??
    conservativeInner;
  const optimisticOuter =
    finiteOrNull(hz.optimisticOuter) ??
    finiteOrNull(hz.optimisticOuterAu) ??
    finiteOrNull(hz.hzOptimisticOuterAu) ??
    conservativeOuter;
  return {
    conservativeInner,
    conservativeOuter,
    optimisticInner,
    optimisticOuter,
  };
}

function findStageAtAge(stageSequence, ageGyr, fallbackStage = null) {
  const age = finiteOrNull(ageGyr);
  const segments = Array.isArray(stageSequence?.segments) ? stageSequence.segments : [];
  if (age == null || !segments.length) return fallbackStage;
  return (
    segments.find((segment) => {
      const start = finiteOrNull(segment.startsAtGyr) ?? 0;
      const end = finiteOrNull(segment.endsAtGyr);
      return age >= start && (end == null || age <= end);
    }) || fallbackStage
  );
}

function interpolateNumber(leftValue, rightValue, t) {
  const left = finiteOrNull(leftValue);
  const right = finiteOrNull(rightValue);
  if (left == null) return right;
  if (right == null) return left;
  return left + (right - left) * t;
}

function sampleAtAge(samples = [], ageGyr = null, stageSequence = null, fallbackSample = null) {
  const safeSamples = Array.isArray(samples)
    ? samples.filter((sample) => finiteOrNull(sample?.ageGyr) != null)
    : [];
  const age = finiteOrNull(ageGyr);
  if (!safeSamples.length) return fallbackSample || null;
  if (age == null) return fallbackSample || safeSamples[0];

  const sorted = [...safeSamples].sort((left, right) => left.ageGyr - right.ageGyr);
  if (age <= sorted[0].ageGyr) return sorted[0];
  if (age >= sorted[sorted.length - 1].ageGyr) return sorted[sorted.length - 1];

  for (let index = 1; index < sorted.length; index += 1) {
    const left = sorted[index - 1];
    const right = sorted[index];
    if (age > right.ageGyr) continue;
    const span = right.ageGyr - left.ageGyr;
    const t = span > 0 ? (age - left.ageGyr) / span : 0;
    const leftHz = normalizeHz(left.habitableZoneAu || left);
    const rightHz = normalizeHz(right.habitableZoneAu || right);
    const stage = findStageAtAge(stageSequence, age, left.stage || right.stage);
    return {
      ...left,
      ageGyr: age,
      stage,
      stageId: stage?.id || left.stageId || right.stageId,
      luminosityLsol: interpolateNumber(left.luminosityLsol, right.luminosityLsol, t),
      radiusRsol: interpolateNumber(left.radiusRsol, right.radiusRsol, t),
      tempK: interpolateNumber(left.tempK, right.tempK, t),
      habitableZoneAu: {
        innerAu: interpolateNumber(leftHz.conservativeInner, rightHz.conservativeInner, t),
        outerAu: interpolateNumber(leftHz.conservativeOuter, rightHz.conservativeOuter, t),
        optimisticInnerAu: interpolateNumber(leftHz.optimisticInner, rightHz.optimisticInner, t),
        optimisticOuterAu: interpolateNumber(leftHz.optimisticOuter, rightHz.optimisticOuter, t),
        confidence:
          left.habitableZoneAu?.confidence === right.habitableZoneAu?.confidence
            ? left.habitableZoneAu?.confidence
            : confidenceMin(left.habitableZoneAu?.confidence, right.habitableZoneAu?.confidence),
      },
    };
  }
  return fallbackSample || sorted[0];
}

function impactKeyCandidates(impact = {}) {
  return [
    safeText(impact.bodyId),
    safeText(impact.bodyLabel),
    finiteOrNull(impact.orbitAu) == null ? "" : `orbit:${round(impact.orbitAu, 5)}`,
  ].filter(Boolean);
}

function buildImpactMap(impacts = []) {
  const map = new Map();
  for (const impact of Array.isArray(impacts) ? impacts : []) {
    for (const key of impactKeyCandidates(impact)) {
      if (!map.has(key)) map.set(key, impact);
    }
  }
  return map;
}

function impactForSubject(subject, impactMap) {
  if (isObject(subject?.lifecycleImpact)) return subject.lifecycleImpact;
  const bodyId = safeText(subject?.bodyId || subject?.id);
  const label = safeText(subject?.name || subject?.label);
  const orbit = finiteOrNull(subject?.parentOrbitAu ?? subject?.orbitAu);
  return (
    impactMap.get(bodyId) ||
    impactMap.get(label) ||
    (orbit == null ? null : impactMap.get(`orbit:${round(orbit, 5)}`)) ||
    null
  );
}

function segmentFromInterval(interval, kind, currentAgeGyr, confidence = "medium") {
  const startGyr = finiteOrNull(interval?.startGyr);
  const endGyr = finiteOrNull(interval?.endGyr);
  if (startGyr == null || endGyr == null || !(endGyr > startGyr)) return null;
  return {
    id: `${kind}-${round(startGyr, 5)}-${round(endGyr, 5)}`,
    kind,
    label: kind === "conservative-hz" ? "Conservative HZ window" : "Optimistic HZ window",
    startGyr: round(startGyr, 5),
    endGyr: round(endGyr, 5),
    state: stateForInterval(startGyr, endGyr, currentAgeGyr),
    confidence,
    durationGyr: round(endGyr - startGyr, 5),
  };
}

function buildSegments(impact, currentAgeGyr) {
  const confidence = safeText(impact?.hzConfidence || impact?.confidence, "medium").toLowerCase();
  const conservative = (impact?.conservativeHz?.intervals || [])
    .map((interval) => segmentFromInterval(interval, "conservative-hz", currentAgeGyr, confidence))
    .filter(Boolean);
  const optimistic = (impact?.optimisticHz?.intervals || [])
    .map((interval) => segmentFromInterval(interval, "optimistic-hz", currentAgeGyr, confidence))
    .filter(Boolean);
  return [...optimistic, ...conservative].sort(
    (left, right) => left.startGyr - right.startGyr || left.endGyr - right.endGyr,
  );
}

function marker(id, kind, label, timeGyr, severity = "info", confidence = "medium", detail = "") {
  const time = finiteOrNull(timeGyr);
  if (time == null) return null;
  return {
    id,
    kind,
    label,
    timeGyr: round(time, 5),
    severity,
    confidence,
    detail,
  };
}

function buildHazardMarkers({ subject, impact, summary, currentAgeGyr }) {
  const confidence = confidenceMin(subject?.confidence, impact?.confidence, summary?.confidence);
  const hazards = impact?.hazards || {};
  const markers = [
    marker(
      `${subject.id}-engulfment`,
      "engulfment",
      "Engulfment",
      hazards.engulfmentAgeGyr,
      "bad",
      confidence,
      "Orbit intersects the sampled stellar envelope.",
    ),
    marker(
      `${subject.id}-giant-envelope-drag`,
      "giant-envelope-drag",
      "Envelope drag risk",
      hazards.giantEnvelopeDragAgeGyr,
      "warning",
      confidence,
      "Orbit enters the broad giant-envelope drag guardrail.",
    ),
  ].filter(Boolean);

  if (hazards.runawayGreenhouseRisk) {
    const time =
      finiteOrNull(impact?.conservativeHz?.lastExitAgeGyr) ??
      finiteOrNull(impact?.optimisticHz?.lastExitAgeGyr) ??
      finiteOrNull(currentAgeGyr);
    markers.push(
      marker(
        `${subject.id}-runaway-risk`,
        "runaway-risk",
        "Runaway / high-flux risk",
        time,
        "warning",
        confidence,
        "Lifecycle exposure places this orbit interior to the sampled HZ at some point.",
      ),
    );
  }

  if (hazards.redGiantExtremeIrradiation) {
    markers.push(
      marker(
        `${subject.id}-red-giant-irradiation`,
        "red-giant-irradiation",
        "Giant-phase irradiation",
        impact?.conservativeHz?.lastExitAgeGyr ?? summary?.mainSequenceLifetimeGyr,
        "warning",
        confidence,
        "Giant-branch luminosity drives extreme irradiation in the sampled track.",
      ),
    );
  }

  if (hazards.remnantEraOrbitCaveat) {
    markers.push(
      marker(
        `${subject.id}-remnant-caveat`,
        "remnant-caveat",
        "Remnant caveat",
        summary?.remnantFormationAgeGyr,
        "caution",
        confidence,
        "Remnant-era habitability is a diagnostic caveat, not a resolved climate state.",
      ),
    );
  }

  return markers;
}

function classifyCurrentStatus(subject, impact, currentHz, orbitAu) {
  const explicit = safeText(subject?.currentHabitability?.class);
  if (explicit) return explicit;
  if (orbitAu == null || orbitAu <= 0) return "not-evaluated";
  const family = safeText(subject?.family || subject?.kind).toLowerCase();
  const kind = safeText(subject?.kind).toLowerCase();
  if (family.includes("browndwarf") || family.includes("brown dwarf")) return "substellar";
  if (family.includes("gas") || family.includes("icegiant") || family.includes("giant")) {
    return "volatile-giant";
  }
  if (impact?.currentHzStatus === "conservative") return "current-candidate";
  if (kind === "moon") {
    const summary = `${subject?.currentHabitability?.label || ""} ${subject?.eraSummary || ""}`;
    if (/subsurface|ocean/i.test(summary)) return "subsurface-candidate";
  }
  if (currentHz.conservativeInner != null && orbitAu < currentHz.conservativeInner)
    return "too-hot";
  if (currentHz.conservativeOuter != null && orbitAu > currentHz.conservativeOuter)
    return "cold-now";
  if (impact?.currentHzStatus === "optimistic") return "future-candidate";
  return "neutral";
}

function currentPotentialScore(subject, impact, status) {
  let score = 0;
  if (status === "current-candidate") score += 0.55;
  if (status === "subsurface-candidate") score += 0.42;
  if (impact?.currentHzStatus === "conservative") score += 0.22;
  if (impact?.currentHzStatus === "optimistic") score += 0.1;
  const explicit = finiteOrNull(subject?.currentHabitability?.score);
  if (explicit != null) score += clamp(explicit, 0, 1) * 0.35;
  const label = `${subject?.currentHabitability?.label || ""} ${subject?.eraSummary || ""}`;
  if (/surface-water|surface water|temperate|habitable/i.test(label)) score += 0.12;
  if (/subsurface|ocean/i.test(label) && subject?.kind === "moon") score += 0.12;
  if (/gas|giant|substellar|brown/i.test(`${subject?.family || ""} ${subject?.kind || ""}`)) {
    score *= 0.35;
  }
  return round(clamp(score, 0, 1), 3);
}

function futurePotentialScore(subject, impact, markers) {
  const conservative = Number(impact?.conservativeHz?.totalDurationGyr || 0);
  const optimistic = Number(impact?.optimisticHz?.totalDurationGyr || 0);
  const currentInside = impact?.currentHzStatus === "conservative";
  let score = Math.min(0.55, conservative / 12) + Math.min(0.28, optimistic / 18);
  if (!currentInside && optimistic > 0) score += 0.16;
  if (impact?.lateHabitability) score += 0.08;
  const label = `${subject?.currentHabitability?.label || ""} ${subject?.eraSummary || ""}`;
  if (/water|ocean|volatile/i.test(label)) score += 0.08;
  if (markers.some((item) => item.kind === "engulfment")) score *= 0.4;
  if (/gas|giant|substellar|brown/i.test(`${subject?.family || ""} ${subject?.kind || ""}`)) {
    score *= subject?.kind === "moon" ? 0.75 : 0.35;
  }
  return round(clamp(score, 0, 1), 3);
}

function riskSeverityScore(impact, markers, summary) {
  let score = 0;
  for (const item of markers) {
    if (item.kind === "engulfment") score = Math.max(score, 0.95);
    else if (item.kind === "supernova-transition") score = Math.max(score, 1);
    else if (item.kind === "giant-envelope-drag") score = Math.max(score, 0.82);
    else if (item.kind === "runaway-risk") score = Math.max(score, 0.68);
    else if (item.kind === "red-giant-irradiation") score = Math.max(score, 0.62);
    else if (item.kind === "remnant-caveat") score = Math.max(score, 0.38);
  }
  if (impact?.hazards?.runawayGreenhouseRisk) score = Math.max(score, 0.6);
  if (summary?.remnant?.stageId === "neutron_star" || summary?.remnant?.stageId === "black_hole") {
    score = Math.max(score, 0.78);
  }
  return round(clamp(score, 0, 1), 3);
}

function laneDetails(subject, impact, markers) {
  const details = [];
  const lifecycle = lifecycleFieldsForSubject(subject, markers);
  if (lifecycle.originLabel)
    details.push({ label: "Lifecycle origin", value: lifecycle.originLabel });
  if (lifecycle.currentLifecycleLabel) {
    details.push({ label: "Current lifecycle", value: lifecycle.currentLifecycleLabel });
  }
  if (lifecycle.nextTransitionLabel) {
    details.push({ label: "Next lifecycle transition", value: lifecycle.nextTransitionLabel });
  }
  if (lifecycle.endpointLabel) {
    details.push({
      label: "Lifecycle endpoint",
      value: `${lifecycle.endpointLabel}${
        lifecycle.endpointTimingLabel ? ` (${lifecycle.endpointTimingLabel})` : ""
      }`,
    });
  }
  if (impact) {
    details.push({
      label: "HZ exposure",
      value:
        `${formatNumber(impact.conservativeHz?.totalDurationGyr, 2, " Gyr")} conservative total; ` +
        `${formatNumber(
          impact.conservativeHz?.longestContinuousDurationGyr,
          2,
          " Gyr",
        )} longest continuous.`,
    });
    details.push({
      label: "Current HZ status",
      value: titleCase(impact.currentHzStatus || "outside"),
    });
    if (impact.interpretation) {
      details.push({ label: "Lifecycle interpretation", value: impact.interpretation });
    }
  }
  if (subject?.parentName) {
    details.push({
      label: "Inherited orbit",
      value: `${subject.parentName} at ${formatAu(subject.parentOrbitAu ?? subject.orbitAu)}.`,
    });
  }
  if (subject?.currentHabitability?.label) {
    details.push({
      label: "Current model",
      value: subject.currentHabitability.label,
    });
  }
  if (subject?.eraSummary) details.push({ label: "Era evidence", value: subject.eraSummary });
  if (markers.length) {
    details.push({
      label: "Future/risk markers",
      value: markers.map((item) => `${item.label} near ${formatGyr(item.timeGyr)}`).join("; "),
    });
  }
  return details;
}

function lifecycleFieldsForSubject(subject, markers = []) {
  const timeline = subject?.eraTimeline || {};
  const eras = Array.isArray(timeline.eras) ? timeline.eras : [];
  const byId = new Map(eras.map((era) => [safeText(era.id), era]));
  const birth =
    byId.get(safeText(timeline.birthEraId)) ||
    eras.find((era) => era.lifecycleRole === "birth") ||
    eras.find((era) => era.category === "formation") ||
    null;
  const current =
    byId.get(safeText(timeline.currentEraId)) ||
    eras.find((era) => era.lifecycleRole === "current") ||
    eras.find((era) => era.state === "current") ||
    null;
  const next =
    eras.find((era) => era.lifecycleRole === "transition" && era.state === "future") ||
    eras.find((era) => era.state === "future" && era.lifecycleRole !== "endpoint") ||
    null;
  const endpoint =
    byId.get(safeText(timeline.endpointEraId)) ||
    eras.find((era) => era.lifecycleRole === "endpoint") ||
    null;
  const markerEndpoint =
    markers.find(
      (marker) => marker.kind === "engulfment" || marker.kind === "supernova-transition",
    ) || markers.find((marker) => marker.kind === "remnant");
  return {
    originLabel:
      birth?.label || (subject?.kind === "moon" ? subject?.model?.display?.originPathway : ""),
    currentLifecycleLabel:
      current?.label || subject?.eraSummary || subject?.currentHabitability?.label || "",
    nextTransitionLabel: next?.label || markerEndpoint?.label || "",
    endpointLabel:
      timeline.endpointLabel || endpoint?.label || markerEndpoint?.label || "Endpoint unresolved",
    endpointConfidence:
      timeline.endpointConfidence || endpoint?.confidence || markerEndpoint?.confidence || "low",
    endpointTimingLabel:
      timeline.endpointTimingLabel ||
      endpoint?.timingLabel ||
      (markerEndpoint?.timeGyr == null ? "" : `near ${formatGyr(markerEndpoint.timeGyr)}`),
    accuracyTier: timeline.accuracyTier || "evidence-summary",
    unsupportedPhysics: Array.isArray(timeline.unsupportedPhysics)
      ? timeline.unsupportedPhysics
      : [],
  };
}

function laneWarnings(subject, impact, summary) {
  const warnings = new Set();
  if (!impact) warnings.add("No finite lifecycle HZ exposure was available for this lane.");
  if (subject?.kind === "moon") {
    warnings.add("Moon lanes inherit parent stellar exposure but keep moon-specific limits.");
  }
  if (impact?.lateHabitability) {
    warnings.add("Late HZ access is temporary and carries strong history caveats.");
  }
  if (impact?.hazards?.remnantEraOrbitCaveat) {
    warnings.add("Remnant-era habitability is not a resolved climate state.");
  }
  for (const warning of subject?.warnings || []) warnings.add(String(warning));
  for (const warning of summary?.warnings || []) warnings.add(String(warning));
  return [...warnings].filter(Boolean);
}

function buildLane({ subject, impact, summary, currentAgeGyr, currentHz }) {
  const id = safeText(subject?.id || subject?.bodyId || subject?.name);
  const orbitAu = finiteOrNull(subject?.parentOrbitAu ?? subject?.orbitAu);
  const segments = impact ? buildSegments(impact, currentAgeGyr) : [];
  const markers = impact
    ? buildHazardMarkers({ subject: { ...subject, id }, impact, summary, currentAgeGyr })
    : [];
  const status = classifyCurrentStatus(subject, impact, currentHz, orbitAu);
  const confidence = confidenceMin(subject?.confidence, impact?.confidence, summary?.confidence);
  const currentPotential = currentPotentialScore(subject, impact, status);
  const futurePotential = futurePotentialScore(subject, impact, markers);
  const riskSeverity = riskSeverityScore(impact, markers, summary);
  const details = laneDetails(subject, impact, markers);
  const warnings = laneWarnings(subject, impact, summary);
  const lifecycle = lifecycleFieldsForSubject(subject, markers);

  return {
    id,
    bodyId: safeText(subject?.bodyId || id),
    label: safeText(subject?.name || subject?.label || id, "Unnamed body"),
    kind: safeText(subject?.kind, "body"),
    family: safeText(subject?.family, subject?.kind || "body"),
    subtypeIds: Array.isArray(subject?.subtypeIds) ? subject.subtypeIds : [],
    orbitAu: orbitAu == null ? null : round(orbitAu, 5),
    parentId: subject?.parentId || null,
    parentLabel: subject?.parentName || null,
    currentStatus: status,
    currentStatusLabel: STATUS_LABELS[status] || titleCase(status),
    confidence,
    score: currentPotential,
    currentPotential,
    futurePotential,
    riskSeverity,
    ...lifecycle,
    sort: {
      orbit: orbitAu == null ? Number.POSITIVE_INFINITY : orbitAu,
      currentPotential,
      futurePotential,
      riskSeverity,
    },
    segments,
    markers,
    details,
    warnings,
    sourceCodes: [
      impact ? "stellarLifecycle.planetHzImpacts" : null,
      subject?.eraTimeline ? "planetaryEraTimeline" : null,
      subject?.sourceCode || null,
    ].filter(Boolean),
    ariaLabel: `${safeText(subject?.name || id)}: ${STATUS_LABELS[status] || status}, ${
      confidence || "unknown"
    } confidence.`,
  };
}

function buildLifecycleMarkers(stageSequence, summary, currentAgeGyr) {
  const segments = Array.isArray(stageSequence?.segments) ? stageSequence.segments : [];
  const markers = [];
  for (const segment of segments) {
    const id = safeText(segment.id);
    const timeGyr = finiteOrNull(segment.startsAtGyr);
    if (!id || timeGyr == null) continue;
    const isEndpoint =
      id.includes("remnant") ||
      id.includes("white_dwarf") ||
      id.includes("neutron_star") ||
      id.includes("black_hole");
    markers.push({
      id: `stage-${id}`,
      kind:
        id === "supernova_transition" ? "supernova-transition" : isEndpoint ? "remnant" : "stage",
      label: isEndpoint
        ? summary?.remnant?.label || segment.label || titleCase(id)
        : segment.label || titleCase(id),
      timeGyr: round(timeGyr, 5),
      state: stateForInterval(timeGyr, segment.endsAtGyr, currentAgeGyr),
      severity: id === "supernova_transition" ? "bad" : isEndpoint ? "caution" : "info",
      confidence: summary?.confidence || "medium",
    });
  }
  const remnantAge = finiteOrNull(summary?.remnantFormationAgeGyr);
  if (remnantAge != null && !markers.some((item) => item.timeGyr === round(remnantAge, 5))) {
    markers.push({
      id: "remnant-formation",
      kind: "remnant",
      label: summary?.remnant?.label || "Compact remnant",
      timeGyr: round(remnantAge, 5),
      state: stateForInterval(remnantAge, null, currentAgeGyr),
      severity: "caution",
      confidence: summary?.remnant?.confidence || summary?.confidence || "medium",
    });
  }
  return markers.sort((left, right) => left.timeGyr - right.timeGyr);
}

function selectedAgeLaneStatus(lane, hz, selectedAgeGyr) {
  const orbit = finiteOrNull(lane?.orbitAu);
  if (orbit == null || orbit <= 0) return "not-evaluated";
  if (hz.conservativeInner != null && hz.conservativeOuter != null) {
    if (orbit >= hz.conservativeInner && orbit <= hz.conservativeOuter) return "conservative";
  }
  if (hz.optimisticInner != null && hz.optimisticOuter != null) {
    if (orbit >= hz.optimisticInner && orbit <= hz.optimisticOuter) return "optimistic";
  }
  if (hz.conservativeInner != null && orbit < hz.conservativeInner) return "too-hot";
  if (hz.conservativeOuter != null && orbit > hz.conservativeOuter) return "cold";
  const activeSegment = lane.segments?.find((segment) => segment.state === "current");
  if (activeSegment)
    return activeSegment.kind === "conservative-hz" ? "conservative" : "optimistic";
  return selectedAgeGyr == null ? "unknown" : "outside";
}

function buildSelectedAge({ selectedAgeGyr, samples, stageSequence, currentSample, lanes }) {
  const sample = sampleAtAge(samples, selectedAgeGyr, stageSequence, currentSample);
  const hz = normalizeHz(sample?.habitableZoneAu || sample);
  const age = finiteOrNull(selectedAgeGyr) ?? finiteOrNull(sample?.ageGyr);
  const activeLaneIds = [];
  const optimisticLaneIds = [];
  const hotLaneIds = [];
  const coldLaneIds = [];
  const warningLaneIds = [];
  const laneStatuses = {};

  for (const lane of lanes) {
    const status = selectedAgeLaneStatus(lane, hz, age);
    laneStatuses[lane.id] = status;
    if (status === "conservative") activeLaneIds.push(lane.id);
    if (status === "optimistic") optimisticLaneIds.push(lane.id);
    if (status === "too-hot") hotLaneIds.push(lane.id);
    if (status === "cold") coldLaneIds.push(lane.id);
    if (
      lane.markers?.some(
        (item) =>
          BAD_MARKER_KINDS.has(item.kind) &&
          finiteOrNull(item.timeGyr) != null &&
          age != null &&
          item.timeGyr <= age,
      )
    ) {
      warningLaneIds.push(lane.id);
    }
  }

  return {
    ageGyr: age == null ? null : round(age, 5),
    label: age == null ? "Current age" : formatGyr(age),
    hostStage: sample?.stage || findStageAtAge(stageSequence, age, currentSample?.stage) || null,
    luminosityLsol: round(sample?.luminosityLsol, 5),
    radiusRsol: round(sample?.radiusRsol, 5),
    tempK: round(sample?.tempK, 0),
    habitableZoneAu: {
      conservativeInner: round(hz.conservativeInner, 5),
      conservativeOuter: round(hz.conservativeOuter, 5),
      optimisticInner: round(hz.optimisticInner, 5),
      optimisticOuter: round(hz.optimisticOuter, 5),
    },
    activeLaneIds,
    optimisticLaneIds,
    hotLaneIds,
    coldLaneIds,
    warningLaneIds,
    laneStatuses,
    caveats: [
      "Exposure preview only; body climates are current-state models and are not integrated through time.",
    ],
  };
}

function sortedLaneIds(lanes, predicate, sortKey) {
  return lanes
    .filter(predicate)
    .sort(
      (left, right) =>
        (right.sort?.[sortKey] || 0) - (left.sort?.[sortKey] || 0) ||
        (left.sort?.orbit || 0) - (right.sort?.orbit || 0) ||
        left.label.localeCompare(right.label),
    )
    .map((lane) => lane.id);
}

function buildRankings(lanes) {
  return {
    currentCandidates: sortedLaneIds(
      lanes,
      (lane) =>
        ["current-candidate", "subsurface-candidate"].includes(lane.currentStatus) ||
        lane.currentPotential >= 0.45,
      "currentPotential",
    ),
    futureCandidates: sortedLaneIds(
      lanes,
      (lane) => lane.futurePotential >= 0.24 && lane.currentStatus !== "current-candidate",
      "futurePotential",
    ),
    longestStable: lanes
      .filter((lane) => lane.segments?.some((segment) => segment.kind === "conservative-hz"))
      .sort((left, right) => {
        const leftLongest = Math.max(
          0,
          ...left.segments
            .filter((segment) => segment.kind === "conservative-hz")
            .map((segment) => Number(segment.durationGyr) || 0),
        );
        const rightLongest = Math.max(
          0,
          ...right.segments
            .filter((segment) => segment.kind === "conservative-hz")
            .map((segment) => Number(segment.durationGyr) || 0),
        );
        return rightLongest - leftLongest || left.label.localeCompare(right.label);
      })
      .map((lane) => lane.id),
    moonCandidates: sortedLaneIds(
      lanes,
      (lane) =>
        lane.kind === "moon" && (lane.currentPotential >= 0.2 || lane.futurePotential >= 0.2),
      "currentPotential",
    ),
    highRisks: sortedLaneIds(lanes, (lane) => lane.riskSeverity >= 0.35, "riskSeverity"),
    notEvaluated: lanes
      .filter((lane) => lane.currentStatus === "not-evaluated")
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((lane) => lane.id),
  };
}

function laneById(lanes) {
  return new Map(lanes.map((lane) => [lane.id, lane]));
}

function firstLaneLabel(lanes, rankings, key, fallback = "None") {
  const byId = laneById(lanes);
  const lane = byId.get(rankings[key]?.[0]);
  return lane?.label || fallback;
}

function longestStableLabel(lanes, rankings) {
  const byId = laneById(lanes);
  const lane = byId.get(rankings.longestStable?.[0]);
  if (!lane) return "None";
  const longest = Math.max(
    0,
    ...lane.segments
      .filter((segment) => segment.kind === "conservative-hz")
      .map((segment) => Number(segment.durationGyr) || 0),
  );
  return `${lane.label}, ${formatGyr(longest)}`;
}

function buildReport({ lanes, rankings, summary }) {
  const byId = laneById(lanes);
  const lines = [];
  const current = byId.get(rankings.currentCandidates?.[0]);
  const future = byId.get(rankings.futureCandidates?.[0]);
  const risk = byId.get(rankings.highRisks?.[0]);
  if (current)
    lines.push(`${current.label} is the strongest current Promising World in this host frame.`);
  else lines.push("No current temperate Promising World is identified in this host frame.");
  if (future) lines.push(`${future.label} has the strongest future thaw or HZ exposure window.`);
  if (risk) {
    const marker = risk.markers?.[0];
    lines.push(
      `${risk.label} carries the largest long-term risk${
        marker ? `: ${marker.label.toLowerCase()} near ${formatGyr(marker.timeGyr)}` : ""
      }.`,
    );
  }
  const remnant = summary?.remnant?.label;
  if (remnant) {
    lines.push(`The host endpoint is ${remnant}; remnant-era habitability remains caveated.`);
  }
  const endpointLines = lanes
    .filter((lane) => lane.endpointLabel)
    .slice(0, 5)
    .map(
      (lane) =>
        `${lane.label}: ${lane.originLabel || "origin unresolved"} -> ${
          lane.endpointLabel
        } (${lane.endpointConfidence || "low"} confidence).`,
    );
  if (endpointLines.length) {
    lines.push(`Lifecycle endpoints: ${endpointLines.join(" ")}`);
  }
  lines.push("This is a stellar exposure summary, not a future climate or biology simulation.");
  return {
    compact: lines.slice(0, 2).join(" "),
    lines,
    markdown: lines.map((line) => `- ${line}`).join("\n"),
  };
}

function buildSpotlight(lanes, rankings, summary) {
  return {
    bestCurrentCandidateLaneId: rankings.currentCandidates?.[0] || null,
    bestCurrentCandidateLabel: firstLaneLabel(lanes, rankings, "currentCandidates"),
    bestFutureCandidateLaneId: rankings.futureCandidates?.[0] || null,
    bestFutureCandidateLabel: firstLaneLabel(lanes, rankings, "futureCandidates"),
    longestStableLaneId: rankings.longestStable?.[0] || null,
    longestStableLabel: longestStableLabel(lanes, rankings),
    largestRiskLaneId: rankings.highRisks?.[0] || null,
    largestRiskLabel: firstLaneLabel(lanes, rankings, "highRisks"),
    remnantSummary: summary?.remnant?.label
      ? `${summary.remnant.label}${
          finiteOrNull(summary.remnantFormationAgeGyr) != null
            ? ` near ${formatGyr(summary.remnantFormationAgeGyr)}`
            : ""
        }`
      : "Endpoint unavailable",
  };
}

function timelineMaxAge(samples, summary, stageSequence, currentAgeGyr) {
  const sampleMax = Math.max(
    0,
    ...(Array.isArray(samples) ? samples : []).map((sample) => Number(sample?.ageGyr) || 0),
  );
  const segmentMax = Math.max(
    0,
    ...(Array.isArray(stageSequence?.segments) ? stageSequence.segments : []).map(
      (segment) => Number(segment?.endsAtGyr ?? segment?.startsAtGyr) || 0,
    ),
  );
  return Math.max(
    0.1,
    sampleMax,
    segmentMax,
    Number(summary?.remnantFormationAgeGyr) || 0,
    Number(currentAgeGyr) || 0,
  );
}

function buildSummaryText(summary, rankings, lanes) {
  const currentCount = rankings.currentCandidates.length;
  const futureCount = rankings.futureCandidates.length;
  const riskCount = rankings.highRisks.length;
  const stage = summary?.currentStage?.label || "current lifecycle stage";
  const remnant = summary?.remnant?.label || "endpoint";
  const headline = `${currentCount} Promising World${currentCount === 1 ? "" : "s"}, ${futureCount} future window${futureCount === 1 ? "" : "s"}, ${riskCount} major risk${riskCount === 1 ? "" : "s"}.`;
  const summaryText = lanes.length
    ? `${stage} now; system fate is dominated by moving habitable-zone exposure before the ${remnant}.`
    : "No orbiting bodies are available for system-fate evaluation.";
  return { headline, summary: summaryText };
}

export function buildSystemFateTimeline({
  currentAgeGyr,
  selectedAgeGyr = null,
  hostFrameId = null,
  hostFrameLabel = "",
  hostFrameKind = "single",
  stellarLifecycle = null,
  stellarLifecycleSummary = null,
  subjects = [],
  options = {},
} = {}) {
  const samples = Array.isArray(stellarLifecycle?.samples) ? stellarLifecycle.samples : [];
  const currentSample =
    stellarLifecycle?.currentSample ||
    sampleAtAge(samples, currentAgeGyr, stellarLifecycle?.stageSequence, null);
  const summary = stellarLifecycleSummary || stellarLifecycle?.summary || {};
  const stageSequence = stellarLifecycle?.stageSequence || summary?.stageSequence || null;
  const resolvedCurrentAge =
    finiteOrNull(currentAgeGyr) ??
    finiteOrNull(currentSample?.ageGyr) ??
    finiteOrNull(summary?.currentStage?.startsAtGyr) ??
    0;
  const currentHz = normalizeHz(currentSample?.habitableZoneAu || currentSample);
  const impacts = Array.isArray(summary?.planetHzImpacts) ? summary.planetHzImpacts : [];
  const impactMap = buildImpactMap(impacts);
  const lanes = (Array.isArray(subjects) ? subjects : [])
    .filter((subject) => subject && subject.includeAsLane !== false)
    .map((subject) =>
      buildLane({
        subject,
        impact: impactForSubject(subject, impactMap),
        summary,
        currentAgeGyr: resolvedCurrentAge,
        currentHz,
      }),
    )
    .sort(
      (left, right) => left.sort.orbit - right.sort.orbit || left.label.localeCompare(right.label),
    );

  const lifecycleMarkers = buildLifecycleMarkers(stageSequence, summary, resolvedCurrentAge);
  if (lifecycleMarkers.some((item) => item.kind === "supernova-transition")) {
    for (const lane of lanes) {
      if (!lane.markers.some((item) => item.kind === "supernova-transition")) {
        lane.markers.push({
          id: `${lane.id}-supernova-transition`,
          kind: "supernova-transition",
          label: "Supernova transition",
          timeGyr:
            lifecycleMarkers.find((item) => item.kind === "supernova-transition")?.timeGyr ?? null,
          severity: "bad",
          confidence: confidenceMin(lane.confidence, summary?.confidence, "low"),
          detail:
            "Endpoint marker only; explosion energy, nucleosynthesis, fallback, and light curves are not simulated.",
        });
        lane.riskSeverity = Math.max(lane.riskSeverity || 0, 1);
        lane.sort.riskSeverity = lane.riskSeverity;
        lane.warnings.push(
          "Supernova transition is an endpoint marker only; explosion energy, nucleosynthesis, fallback, and light curves are not simulated.",
        );
      }
    }
  }

  const rankings = buildRankings(lanes);
  const spotlight = buildSpotlight(lanes, rankings, summary);
  const report = buildReport({ lanes, rankings, summary });
  const selectedAge = buildSelectedAge({
    selectedAgeGyr: selectedAgeGyr ?? resolvedCurrentAge,
    samples,
    stageSequence,
    currentSample,
    lanes,
  });
  const counts = {
    lanes: lanes.length,
    currentCandidates: rankings.currentCandidates.length,
    futureCandidates: rankings.futureCandidates.length,
    majorRisks: rankings.highRisks.length,
    notEvaluated: rankings.notEvaluated.length,
  };
  const text = buildSummaryText(summary, rankings, lanes);
  const warnings = [
    ...(Array.isArray(summary?.warnings) ? summary.warnings : []),
    "System Fate aggregates stellar lifecycle exposure and current body models; it does not integrate future climates, atmospheres, oceans, or biology.",
  ];

  return {
    modelVersion: MODEL_VERSION,
    subjectKind: "system",
    hostFrameId: hostFrameId || null,
    hostFrameLabel: safeText(hostFrameLabel, "Host frame"),
    hostFrameKind: safeText(hostFrameKind, "single"),
    currentAgeGyr: round(resolvedCurrentAge, 5),
    maxAgeGyr: round(timelineMaxAge(samples, summary, stageSequence, resolvedCurrentAge), 5),
    confidence: confidenceMin(summary?.confidence, ...lanes.map((lane) => lane.confidence)),
    summary: text.summary,
    headline: text.headline,
    counts,
    spotlight,
    selectedAge,
    rankings,
    report,
    lifecycleMarkers,
    lanes,
    warnings: [...new Set(warnings.filter(Boolean))],
    options: isObject(options) ? { ...options } : {},
  };
}

export function formatSystemFateTiming(value) {
  return formatGyr(value);
}

export function formatSystemFateAu(value) {
  return formatAu(value);
}
