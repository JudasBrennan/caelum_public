import { buildWorldSnapshot } from "../../engine/worldSnapshot.js";
import { buildSystemFateTimeline } from "../../engine/systemFateTimeline.js";
import { resolveWorldHostFrameContext } from "../store.js";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeText(value, fallback = "") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeHostFrameId(value, fallback = null) {
  const id = safeText(value);
  return id || fallback || null;
}

function subtypeIdsFromClassification(classification) {
  return (Array.isArray(classification?.subtypes) ? classification.subtypes : [])
    .map((subtype) => safeText(subtype?.id || subtype))
    .filter(Boolean);
}

function displayBodyFamily({ entry, planetaryBodyEntry }) {
  return (
    planetaryBodyEntry?.classification?.family ||
    planetaryBodyEntry?.classification?.displayLabel ||
    entry?.companionClass ||
    entry?.regime ||
    entry?.kind ||
    "body"
  );
}

function habitabilityScoreFromModel(model) {
  return (
    finiteOrNull(model?.derived?.habitabilityIndex) ??
    finiteOrNull(model?.habitability?.habitabilityIndex) ??
    finiteOrNull(model?.display?.habitabilityIndex) ??
    0
  );
}

function textIncludes(value, pattern) {
  return pattern.test(String(value || ""));
}

function planetHabitability(entry, planetaryBodyEntry) {
  const model = entry?.model || {};
  const display = model.display || {};
  const derived = model.derived || {};
  const score = habitabilityScoreFromModel(model);
  const family = safeText(planetaryBodyEntry?.classification?.family || entry?.kind).toLowerCase();
  const summary = [
    display.eraTimelineSummary,
    display.climateState,
    display.waterRegime,
    display.surfaceState,
    display.hydrosphereState,
    display.surfaceHabitability,
  ]
    .filter(Boolean)
    .join(" | ");

  let status = "";
  if (family.includes("gas") || family.includes("icegiant") || family.includes("giant")) {
    status = "volatile-giant";
  } else if (family.includes("browndwarf") || family.includes("brown")) {
    status = "substellar";
  } else if (derived.inHabitableZone || score >= 0.55 || textIncludes(summary, /surface-water/i)) {
    status = "current-candidate";
  } else if (
    textIncludes(summary, /runaway|hot|steam/i) ||
    finiteOrNull(derived.surfaceTempK) > 330
  ) {
    status = "too-hot";
  } else if (finiteOrNull(derived.surfaceTempK) < 250) {
    status = "cold-now";
  }

  return {
    class: status,
    score,
    label: summary || display.bodyClass || display.eraTimelineSummary || "Current body model",
    drivers: [
      display.climateState ? `Climate: ${display.climateState}` : null,
      display.waterRegime ? `Water: ${display.waterRegime}` : null,
      display.eraTimelineSummary ? `Era: ${display.eraTimelineSummary}` : null,
    ].filter(Boolean),
  };
}

function moonHabitability(entry) {
  const model = entry?.model || {};
  const display = model.display || {};
  const score = habitabilityScoreFromModel(model);
  const summary = [
    display.eraTimelineSummary,
    display.surfaceHabitability,
    display.subsurfaceHabitability,
    display.hydrosphereState,
    display.tidalHabitableZone,
    display.surfaceRadiation,
  ]
    .filter(Boolean)
    .join(" | ");
  let status = "";
  if (textIncludes(summary, /subsurface|ocean/i)) status = "subsurface-candidate";
  if (score >= 0.45 || textIncludes(summary, /surface life plausible|surface-water/i)) {
    status = "current-candidate";
  }
  if (!status && textIncludes(summary, /runaway|overheated|sterile/i)) status = "at-risk";

  return {
    class: status,
    score,
    label: summary || "Moon habitability context",
    drivers: [
      display.hydrosphereState ? `Hydrosphere: ${display.hydrosphereState}` : null,
      display.tidalHabitableZone ? `Tides: ${display.tidalHabitableZone}` : null,
      display.surfaceRadiation ? `Radiation: ${display.surfaceRadiation}` : null,
    ].filter(Boolean),
  };
}

function impactByBodyId(hostSummary) {
  const map = new Map();
  for (const impact of Array.isArray(hostSummary?.planetHzImpacts)
    ? hostSummary.planetHzImpacts
    : []) {
    if (impact?.bodyId) map.set(impact.bodyId, impact);
  }
  return map;
}

function planetaryBodyEntryFor(snapshot, kind, id) {
  const key = `${kind === "gasGiant" ? "gasGiant" : "planet"}:${id}`;
  return snapshot?.planetaryBodiesById?.[key] || null;
}

function buildPlanetSubject({ snapshot, entry, hostSummary }) {
  const planetaryBodyEntry = planetaryBodyEntryFor(snapshot, entry.kind, entry.id);
  const model = entry.model || planetaryBodyEntry?.model || null;
  const classification = planetaryBodyEntry?.classification || model?.classification || null;
  const family = displayBodyFamily({ entry, planetaryBodyEntry });
  const impacts = impactByBodyId(hostSummary);
  const habitability = planetHabitability(entry, planetaryBodyEntry);
  return {
    id: `${entry.kind}:${entry.id}`,
    bodyId: entry.id,
    name: entry.name || entry.id,
    kind: entry.kind === "gasGiant" ? "gasGiant" : "planet",
    family,
    subtypeIds: subtypeIdsFromClassification(classification),
    hostFrameId: entry.hostFrameId,
    orbitAu: finiteOrNull(entry.orbitAu),
    model,
    eraTimeline: model?.derived?.eraTimeline || planetaryBodyEntry?.model?.derived?.eraTimeline,
    eraSummary:
      model?.display?.eraTimelineSummary || planetaryBodyEntry?.model?.display?.eraTimelineSummary,
    currentHabitability: habitability,
    lifecycleImpact: impacts.get(entry.id) || null,
    confidence: classification?.confidence || "medium",
    warnings: [
      ...(Array.isArray(classification?.warnings) ? classification.warnings : []),
      ...(Array.isArray(model?.classification?.warnings) ? model.classification.warnings : []),
    ],
    includeAsLane: true,
    sourceCode:
      entry.kind === "gasGiant" ? "worldSnapshot.gasGiantsById" : "worldSnapshot.planetsById",
  };
}

function parentEntryFor(snapshot, parentId) {
  return snapshot?.planetsById?.[parentId] || snapshot?.gasGiantsById?.[parentId] || null;
}

function shouldIncludeMoon(entry) {
  const model = entry?.model || {};
  const display = model.display || {};
  if (entry?.name) return true;
  if (habitabilityScoreFromModel(model) > 0.05) return true;
  return [
    display.eraTimelineSummary,
    display.hydrosphereState,
    display.subsurfaceOcean,
    display.tidalHabitableZone,
    display.surfaceRadiation,
    display.orbitalFate,
  ].some(Boolean);
}

function buildMoonSubject({ snapshot, entry, hostSummary }) {
  const parent = parentEntryFor(snapshot, entry.parentId);
  const impacts = impactByBodyId(hostSummary);
  const parentImpact = parent?.id ? impacts.get(parent.id) : null;
  const model = entry.model || null;
  return {
    id: `moon:${entry.id}`,
    bodyId: entry.id,
    name: entry.name || entry.id,
    kind: "moon",
    family: "moon",
    hostFrameId: entry.hostFrameId || parent?.hostFrameId || null,
    orbitAu: finiteOrNull(parent?.orbitAu),
    parentOrbitAu: finiteOrNull(parent?.orbitAu),
    parentId: entry.parentId,
    parentName: parent?.name || entry.parentId || null,
    parentKind: entry.parentKind || parent?.kind || null,
    moonOrbitKm: finiteOrNull(entry.orbitKm),
    model,
    eraTimeline: model?.derived?.eraTimeline || null,
    eraSummary: model?.display?.eraTimelineSummary || null,
    currentHabitability: moonHabitability(entry),
    lifecycleImpact: parentImpact,
    confidence: model?.derived?.eraTimeline?.confidence || "medium",
    warnings: [
      "Moon fate inherits the parent body's stellar orbit; moon climate, radiation, tides, and orbital stability remain moon-specific.",
    ],
    includeAsLane: shouldIncludeMoon(entry),
    sourceCode: "worldSnapshot.moonsById",
  };
}

function hostFrameLabel(hostFrame, fallbackId) {
  return safeText(hostFrame?.label || hostFrame?.name || fallbackId, "Host frame");
}

function hostFrameKind(hostFrame) {
  if (hostFrame?.frameKind === "pair") return "pair";
  if (hostFrame?.orbitFamilyKind === "single") return "single";
  return hostFrame?.frameKind || hostFrame?.orbitFamilyKind || "stellar";
}

function buildHostFrameOptions(snapshot) {
  const frames = Object.values(snapshot?.hostFramesById || {});
  if (frames.length) {
    return frames.map((frame) => ({
      id: frame.id,
      label: hostFrameLabel(frame, frame.id),
      kind: hostFrameKind(frame),
    }));
  }
  const fallbackId = snapshot?.meta?.defaultHostFrameId || "star_a";
  return [{ id: fallbackId, label: "Primary host", kind: "single" }];
}

function subjectsForHostFrame(snapshot, hostFrameId, hostSummary) {
  const fallbackHostFrameId = snapshot?.meta?.defaultHostFrameId || hostFrameId;
  const resolvedHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  const bodyEntries = snapshot?.bodiesInOrbitOrderByHostFrame?.[resolvedHostFrameId] || [];
  const subjects = [];
  for (const entry of bodyEntries) {
    const fullEntry =
      entry.kind === "gasGiant"
        ? snapshot.gasGiantsById?.[entry.id]
        : snapshot.planetsById?.[entry.id];
    if (!fullEntry) continue;
    subjects.push(buildPlanetSubject({ snapshot, entry: fullEntry, hostSummary }));
    for (const moonId of fullEntry.moonIds || []) {
      const moonEntry = snapshot.moonsById?.[moonId];
      if (!moonEntry) continue;
      subjects.push(buildMoonSubject({ snapshot, entry: moonEntry, hostSummary }));
    }
  }
  return subjects;
}

function resolveLifecycleForHostFrame(world, hostFrameId, snapshot) {
  const solveContext = resolveWorldHostFrameContext(world, hostFrameId);
  return (
    solveContext?.starModel?.stellarLifecycle ||
    snapshot?.star?.stellarLifecycle ||
    snapshot?.stellarLifecycle ||
    null
  );
}

function currentAgeForHostFrame(world, hostFrameId, lifecycle) {
  if (!world) {
    return finiteOrNull(lifecycle?.currentSample?.ageGyr) ?? 0;
  }
  const solveContext = resolveWorldHostFrameContext(world, hostFrameId);
  return (
    finiteOrNull(solveContext?.starConfig?.ageGyr) ??
    finiteOrNull(lifecycle?.currentSample?.ageGyr) ??
    finiteOrNull(world?.star?.ageGyr) ??
    0
  );
}

export function buildSystemFatePageModelFromSnapshot(snapshot, options = {}) {
  const world = options.world || null;
  const hostFrameOptions = buildHostFrameOptions(snapshot);
  const defaultHostFrameId =
    normalizeHostFrameId(options.hostFrameId, snapshot?.meta?.defaultHostFrameId) ||
    hostFrameOptions[0]?.id ||
    "star_a";
  const selectedHostFrameId = hostFrameOptions.some((option) => option.id === defaultHostFrameId)
    ? defaultHostFrameId
    : hostFrameOptions[0]?.id || defaultHostFrameId;
  const timelinesByHostFrameId = {};

  for (const option of hostFrameOptions) {
    const hostFrame = snapshot?.hostFramesById?.[option.id] || null;
    const lifecycle = world ? resolveLifecycleForHostFrame(world, option.id, snapshot) : null;
    const hostSummary =
      snapshot?.stellarLifecycleImpactsByHostFrame?.[option.id] || lifecycle?.summary || {};
    const subjects = subjectsForHostFrame(snapshot, option.id, hostSummary);
    timelinesByHostFrameId[option.id] = buildSystemFateTimeline({
      currentAgeGyr: currentAgeForHostFrame(world, option.id, lifecycle),
      selectedAgeGyr: options.selectedAgeGyr,
      hostFrameId: option.id,
      hostFrameLabel: option.label,
      hostFrameKind: option.kind || hostFrameKind(hostFrame),
      stellarLifecycle: lifecycle,
      stellarLifecycleSummary: hostSummary,
      subjects,
    });
  }

  const selectedTimeline =
    timelinesByHostFrameId[selectedHostFrameId] ||
    timelinesByHostFrameId[hostFrameOptions[0]?.id] ||
    buildSystemFateTimeline({
      hostFrameId: selectedHostFrameId,
      hostFrameLabel: "Host frame",
      subjects: [],
    });

  return {
    modelVersion: "system-fate-page-model-v1",
    snapshot,
    hostFrameOptions,
    selectedHostFrameId,
    timelinesByHostFrameId,
    selectedTimeline,
  };
}

export function buildSystemFatePageModel(world, options = {}) {
  const snapshot = isObject(options.snapshot)
    ? options.snapshot
    : buildWorldSnapshot(world, { mode: "full" });
  return buildSystemFatePageModelFromSnapshot(snapshot, { ...options, world });
}
