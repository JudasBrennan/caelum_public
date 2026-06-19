import { auToKilometers } from "../physics/orbital.js";
import { toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "observer-frame-context-v1";
const SOURCE_KEYS = ["observerFrame"];
const KM_PER_R_EARTH = 6371;
const KM_PER_R_MOON = 1738.1;
const AU_KM = auToKilometers(1);

function text(value, fallback = "") {
  const resolved = String(value ?? "").trim();
  return resolved || fallback;
}

function positive(value, fallback = NaN) {
  const number = toFinite(value, fallback);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function normalizeHostFrameId(value, fallback = null) {
  const id = text(value);
  return id || fallback || null;
}

function stripRefPrefix(id, kind = "") {
  const raw = text(id);
  if (!raw) return "";
  const normalizedKind = text(kind).toLowerCase();
  if (normalizedKind === "planet" && raw.startsWith("planet:")) return raw.slice(7);
  if (normalizedKind === "moon" && raw.startsWith("moon:")) return raw.slice(5);
  if (raw.startsWith("planet:") || raw.startsWith("moon:"))
    return raw.split(":").slice(1).join(":");
  return raw;
}

function orderedEntries(section) {
  if (!section || typeof section !== "object") return [];
  return Object.values(section).filter(Boolean);
}

function snapshotDefaultHostFrameId(snapshot) {
  return (
    snapshot?.meta?.defaultHostFrameId ||
    snapshot?.stellarSystem?.defaultHostFrameId ||
    Object.keys(snapshot?.hostFramesById || {})[0] ||
    null
  );
}

function getPlanetEntries(snapshot) {
  return orderedEntries(snapshot?.planetsById);
}

function getMoonEntries(snapshot) {
  return orderedEntries(snapshot?.moonsById);
}

function getParentEntry(snapshot, parentId) {
  const id = text(parentId);
  if (!id) return null;
  const planet = snapshot?.planetsById?.[id];
  if (planet) return { kind: "planet", entry: planet };
  const gasGiant = snapshot?.gasGiantsById?.[id];
  if (gasGiant) return { kind: "gasGiant", entry: gasGiant };
  return null;
}

function planetRadiusKm(entry) {
  return positive(
    entry?.model?.derived?.radiusKm ??
      entry?.model?.physical?.radiusKm ??
      entry?.radiusKm ??
      positive(entry?.model?.derived?.radiusEarth ?? entry?.radiusEarth, NaN) * KM_PER_R_EARTH,
  );
}

function parentRadiusKm(parent) {
  const entry = parent?.entry || parent;
  if (!entry) return NaN;
  if (parent?.kind === "gasGiant" || entry?.kind === "gasGiant") {
    return positive(entry?.model?.physical?.radiusKm ?? entry?.radiusKm);
  }
  return planetRadiusKm(entry);
}

function planetOrbitAu(entry) {
  return positive(
    entry?.orbitAu ??
      entry?.model?.inputs?.semiMajorAxisAu ??
      entry?.model?.orbit?.semiMajorAxisAu ??
      entry?.source?.inputs?.semiMajorAxisAu,
  );
}

function planetOrbitalPeriodDays(entry) {
  return positive(
    entry?.model?.derived?.orbitalPeriodEarthDays ??
      entry?.model?.orbit?.orbitalPeriodDays ??
      entry?.orbitalPeriodEarthDays ??
      entry?.orbitalPeriodDays,
  );
}

function parentOrbitalPeriodDays(parent) {
  const entry = parent?.entry || parent;
  if (!entry) return NaN;
  if (parent?.kind === "gasGiant" || entry?.kind === "gasGiant") {
    return positive(
      entry?.model?.orbital?.orbitalPeriodDays ??
        entry?.model?.orbit?.orbitalPeriodDays ??
        positive(entry?.model?.orbital?.orbitalPeriodYears, NaN) * 365.25,
    );
  }
  return planetOrbitalPeriodDays(entry);
}

function planetRotationHours(entry) {
  return positive(
    entry?.model?.inputs?.rotationPeriodHours ??
      entry?.source?.inputs?.rotationPeriodHours ??
      entry?.inputs?.rotationPeriodHours,
  );
}

function moonRadiusKm(entry) {
  return positive(
    entry?.model?.physical?.radiusKm ??
      positive(entry?.model?.physical?.radiusMoon ?? entry?.radiusMoon, NaN) * KM_PER_R_MOON,
  );
}

function moonSemiMajorAxisKm(entry) {
  return positive(
    entry?.model?.inputs?.semiMajorAxisKm ??
      entry?.model?.orbit?.semiMajorAxisKm ??
      entry?.orbitKm ??
      entry?.source?.inputs?.semiMajorAxisKm,
  );
}

function moonSynodicPeriodDays(entry) {
  return positive(
    entry?.model?.orbit?.orbitalPeriodSynodicDays ??
      entry?.model?.inputs?.orbitalPeriodSynodicDays ??
      entry?.orbitalPeriodSynodicDays,
  );
}

function moonRotationPeriodHours(entry) {
  const rotationDays = positive(
    entry?.model?.orbit?.rotationPeriodDays ?? entry?.model?.tides?.rotationPeriodDays,
  );
  if (Number.isFinite(rotationDays)) return rotationDays * 24;
  return positive(entry?.model?.inputs?.initialRotationPeriodHours);
}

function solarDayHoursFromSidereal(siderealHours, orbitalPeriodDays) {
  const sidereal = positive(siderealHours);
  if (!Number.isFinite(sidereal)) return NaN;
  const orbitalHours = positive(orbitalPeriodDays) * 24;
  if (!Number.isFinite(orbitalHours)) return sidereal;
  const reciprocalDiff = 1 / sidereal - 1 / orbitalHours;
  return reciprocalDiff > 1e-9 ? 1 / reciprocalDiff : sidereal;
}

function moonLocalSolarDayHours(entry, parentYearDays, assumptions) {
  const rotationHours = moonRotationPeriodHours(entry);
  const synodicDays = moonSynodicPeriodDays(entry);
  const spinRatio = text(entry?.model?.spinState?.ratio ?? entry?.model?.tides?.spinOrbitResonance);
  if (spinRatio === "1:1" && Number.isFinite(synodicDays)) {
    assumptions.push(
      "A 1:1 moon observer uses the moon-parent synodic period as the local solar day.",
    );
    return synodicDays * 24;
  }
  if (Number.isFinite(rotationHours)) {
    assumptions.push(
      "Non-synchronous moon solar days are approximated from spin and parent year; local moon-orbit longitude is not phase-resolved.",
    );
    return solarDayHoursFromSidereal(rotationHours, parentYearDays);
  }
  return NaN;
}

function firstMoonForParent(snapshot, parentId) {
  const moonIds = Array.isArray(snapshot?.moonsByParentId?.[parentId])
    ? snapshot.moonsByParentId[parentId]
    : [];
  for (const moonId of moonIds) {
    const entry = snapshot?.moonsById?.[moonId];
    if (entry) return entry;
  }
  return getMoonEntries(snapshot).find((entry) => text(entry?.parentId) === text(parentId)) || null;
}

function candidateEligibility(missing, invalid = false) {
  if (invalid) return "invalid";
  if (!missing.length) return "strong";
  if (missing.length <= 2) return "usable";
  return "partial";
}

function planetCandidate(snapshot, entry) {
  const missing = [];
  if (!Number.isFinite(planetRadiusKm(entry))) missing.push("radius");
  if (!Number.isFinite(planetOrbitAu(entry))) missing.push("host-star orbit");
  if (!Number.isFinite(planetOrbitalPeriodDays(entry))) missing.push("host-star year");
  if (!Number.isFinite(planetRotationHours(entry))) missing.push("rotation period");
  const fallbackHostFrameId = snapshotDefaultHostFrameId(snapshot);
  const id = text(entry?.id);
  return {
    kind: "planet",
    id,
    selectValue: `planet:${id}`,
    label: text(entry?.name ?? entry?.source?.inputs?.name, id || "Planet"),
    parentId: null,
    parentKind: null,
    parentName: "",
    hostFrameId: normalizeHostFrameId(entry?.hostFrameId, fallbackHostFrameId),
    eligibilityClass: candidateEligibility(missing),
    missingInputs: missing,
    observerRef: { kind: "planet", id },
  };
}

function moonCandidate(snapshot, entry) {
  const parent = getParentEntry(snapshot, entry?.parentId);
  const missing = [];
  if (!parent) missing.push("parent body");
  if (!Number.isFinite(moonRadiusKm(entry))) missing.push("moon radius");
  if (!Number.isFinite(moonSemiMajorAxisKm(entry))) missing.push("moon orbit");
  if (!Number.isFinite(moonSynodicPeriodDays(entry))) missing.push("phase cycle");
  if (!Number.isFinite(moonRotationPeriodHours(entry))) missing.push("rotation period");
  const id = text(entry?.id);
  const parentId = text(entry?.parentId);
  const parentName = text(parent?.entry?.name ?? parent?.entry?.source?.name, parentId);
  return {
    kind: "moon",
    id,
    selectValue: `moon:${id}`,
    label: text(entry?.name ?? entry?.source?.inputs?.name, id || "Moon"),
    parentId,
    parentKind: parent?.kind || null,
    parentName,
    hostFrameId: normalizeHostFrameId(entry?.hostFrameId, parent?.entry?.hostFrameId),
    eligibilityClass: candidateEligibility(missing, !parent),
    missingInputs: missing,
    observerRef: { kind: "moon", id, parentId },
  };
}

export function listObserverFrameCandidates(snapshot) {
  const fullSnapshot = snapshot && typeof snapshot === "object" ? snapshot : {};
  return [
    ...getPlanetEntries(fullSnapshot).map((entry) => planetCandidate(fullSnapshot, entry)),
    ...getMoonEntries(fullSnapshot).map((entry) => moonCandidate(fullSnapshot, entry)),
  ];
}

export function isPlanetObserverRef(ref) {
  return text(ref?.kind).toLowerCase() === "planet" && !!text(ref?.id);
}

export function isMoonObserverRef(ref) {
  return text(ref?.kind).toLowerCase() === "moon" && !!text(ref?.id);
}

export function normalizeObserverRef(snapshot, requestedRef = null) {
  if (typeof requestedRef === "string") {
    const [rawKind, ...rest] = requestedRef.includes(":")
      ? requestedRef.split(":")
      : ["planet", requestedRef];
    const kind = rawKind === "moon" ? "moon" : "planet";
    const id = stripRefPrefix(rest.join(":") || requestedRef, kind);
    const moon = kind === "moon" ? snapshot?.moonsById?.[id] : null;
    return kind === "moon"
      ? { kind, id, parentId: text(moon?.parentId) || undefined }
      : { kind, id };
  }
  const raw = requestedRef && typeof requestedRef === "object" ? requestedRef : {};
  const kind = text(raw.kind).toLowerCase() === "moon" ? "moon" : "planet";
  const id = stripRefPrefix(raw.id ?? raw.value ?? raw.homePlanetId ?? "", kind);
  if (!id) return null;
  const moon = kind === "moon" ? snapshot?.moonsById?.[id] : null;
  return kind === "moon"
    ? { kind, id, parentId: text(raw.parentId ?? moon?.parentId) || undefined }
    : { kind, id };
}

export function resolveWorldObserverRef(snapshot, requestedRef = null, options = {}) {
  const candidates = listObserverFrameCandidates(snapshot);
  const normalized = normalizeObserverRef(snapshot, requestedRef);
  const warnings = [];
  if (normalized) {
    const matched = candidates.find(
      (candidate) => candidate.kind === normalized.kind && candidate.id === normalized.id,
    );
    if (matched && matched.eligibilityClass !== "invalid") {
      return { observerRef: matched.observerRef, candidate: matched, warnings };
    }
    warnings.push(`Requested ${normalized.kind} observer "${normalized.id}" is not usable.`);
  }

  const fallback =
    candidates.find(
      (candidate) => candidate.kind === "planet" && candidate.eligibilityClass !== "invalid",
    ) ||
    candidates.find(
      (candidate) => candidate.kind === "moon" && candidate.eligibilityClass !== "invalid",
    ) ||
    null;
  if (fallback && options.warnOnFallback !== false) {
    warnings.push(`Observer frame fell back to ${fallback.label}.`);
  }
  return {
    observerRef: fallback?.observerRef || null,
    candidate: fallback,
    warnings,
  };
}

function parentSkyBehavior(entry) {
  const ratio = text(entry?.model?.spinState?.ratio ?? entry?.model?.tides?.spinOrbitResonance);
  if (ratio === "1:1") return "fixed";
  if (ratio) return "rises-and-sets";
  return "unknown";
}

function statusFromMissing(missing, invalid = false) {
  if (invalid) return CONTEXT_STATUS.UNKNOWN;
  return missing.length ? CONTEXT_STATUS.LIMITED : CONTEXT_STATUS.SUPPORTED;
}

function confidenceFromMissing(missing, invalid = false) {
  if (invalid) return CONFIDENCE.UNKNOWN;
  if (!missing.length) return CONFIDENCE.HIGH;
  if (missing.length <= 2) return CONFIDENCE.MEDIUM;
  return CONFIDENCE.LOW;
}

function buildPlanetFrame(snapshot, candidate) {
  const entry = snapshot?.planetsById?.[candidate.id];
  const missing = [...(candidate.missingInputs || [])];
  const yearDays = planetOrbitalPeriodDays(entry);
  const siderealHours = planetRotationHours(entry);
  const primaryMoon = firstMoonForParent(snapshot, candidate.id);
  const primaryCycleDays = primaryMoon ? moonSynodicPeriodDays(primaryMoon) : NaN;
  if (!primaryMoon) missing.push("primary moon phase cycle");
  const outputs = {
    hostStarYearDays: roundMaybe(yearDays, 6),
    localSiderealDayHours: roundMaybe(siderealHours, 6),
    localSolarDayHours: roundMaybe(solarDayHoursFromSidereal(siderealHours, yearDays), 6),
    primaryPhaseCycleDays: roundMaybe(primaryCycleDays, 6),
    primaryPhaseCycleKind: primaryMoon ? "moon-phase" : "none",
    parentApparentDiameterDeg: 0,
    parentSkyBehaviorClass: "not-applicable",
    calendarFrameClass: missing.length ? "partial" : "planet-local",
    apparentFrameClass: missing.length ? "partial" : "planet-local",
  };
  return makeContext({
    modelVersion: MODEL_VERSION,
    status: statusFromMissing(missing),
    confidence: confidenceFromMissing(missing),
    inputs: {
      observerKind: "planet",
      observerId: candidate.id,
      parentId: null,
      hostFrameId: candidate.hostFrameId,
    },
    outputs,
    assumptions: [],
    limitingFactors: missing.map((item) => `Missing ${item}.`),
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}

function buildMoonFrame(snapshot, candidate) {
  const entry = snapshot?.moonsById?.[candidate.id];
  const parent = getParentEntry(snapshot, candidate.parentId);
  const missing = [...(candidate.missingInputs || [])];
  const assumptions = [
    "Moon observer frames use the parent body's host-star orbit as the stellar year.",
  ];
  const parentYearDays = parentOrbitalPeriodDays(parent);
  const rotationHours = moonRotationPeriodHours(entry);
  const solarHours = moonLocalSolarDayHours(entry, parentYearDays, assumptions);
  const phaseCycleDays = moonSynodicPeriodDays(entry);
  const semiMajorAxisKm = moonSemiMajorAxisKm(entry);
  const parentRadius = parentRadiusKm(parent);
  const parentDiameterDeg =
    Number.isFinite(parentRadius) && Number.isFinite(semiMajorAxisKm)
      ? (2 * Math.atan(parentRadius / semiMajorAxisKm) * 180) / Math.PI
      : NaN;
  if (!Number.isFinite(parentYearDays)) missing.push("parent host-star year");
  if (!Number.isFinite(parentDiameterDeg)) missing.push("parent apparent diameter");

  const outputs = {
    hostStarYearDays: roundMaybe(parentYearDays, 6),
    localSiderealDayHours: roundMaybe(rotationHours, 6),
    localSolarDayHours: roundMaybe(solarHours, 6),
    primaryPhaseCycleDays: roundMaybe(phaseCycleDays, 6),
    primaryPhaseCycleKind: Number.isFinite(phaseCycleDays) ? "parent-phase" : "none",
    parentApparentDiameterDeg: roundMaybe(parentDiameterDeg, 4),
    parentSkyBehaviorClass: parentSkyBehavior(entry),
    calendarFrameClass: missing.length ? "partial" : "moon-local",
    apparentFrameClass: missing.length ? "partial" : "moon-local",
  };
  return makeContext({
    modelVersion: MODEL_VERSION,
    status: statusFromMissing(missing, !parent),
    confidence: confidenceFromMissing(missing, !parent),
    inputs: {
      observerKind: "moon",
      observerId: candidate.id,
      parentId: candidate.parentId,
      parentKind: candidate.parentKind,
      hostFrameId: candidate.hostFrameId,
      moonSemiMajorAxisKm: roundMaybe(semiMajorAxisKm, 3),
      parentRadiusKm: roundMaybe(parentRadius, 3),
      moonOrbitAuOffset: roundMaybe(
        Number.isFinite(semiMajorAxisKm) ? semiMajorAxisKm / AU_KM : NaN,
        9,
      ),
    },
    outputs,
    assumptions,
    limitingFactors: missing.map((item) => `Missing ${item}.`),
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}

export function buildObserverFrameContext(snapshot, observerRef = null, options = {}) {
  const resolved = resolveWorldObserverRef(snapshot, observerRef, options);
  if (!resolved.candidate || !resolved.observerRef) {
    return makeContext({
      modelVersion: MODEL_VERSION,
      status: CONTEXT_STATUS.UNKNOWN,
      confidence: CONFIDENCE.UNKNOWN,
      inputs: { observerKind: null, observerId: null },
      outputs: {},
      assumptions: [],
      limitingFactors: ["No planet or moon observer candidates are available."],
      notes: [],
      sourceKeys: SOURCE_KEYS,
    });
  }

  const context =
    resolved.candidate.kind === "moon"
      ? buildMoonFrame(snapshot, resolved.candidate)
      : buildPlanetFrame(snapshot, resolved.candidate);
  return {
    ...context,
    observerRef: resolved.observerRef,
    candidate: resolved.candidate,
    warnings: resolved.warnings,
  };
}

export function observerRefToSelectValue(ref) {
  if (isMoonObserverRef(ref)) return `moon:${stripRefPrefix(ref.id, "moon")}`;
  if (isPlanetObserverRef(ref)) return `planet:${stripRefPrefix(ref.id, "planet")}`;
  return "";
}
