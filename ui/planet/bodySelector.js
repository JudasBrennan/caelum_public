import { fmt } from "../../engine/utils.js";
import { escapeHtml } from "../uiHelpers.js";
import {
  getAuthoringIntentLabel,
  getPlanetaryBodyClassification,
  getPlanetaryBodyClassificationLabel,
} from "./bodyClassificationSummary.js";

function isUnifiedPlanetaryBodyList(value) {
  return (
    Array.isArray(value) &&
    value.some(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        (entry.bodyType === "planetaryBody" || entry.legacyKind || entry.selector),
    )
  );
}

function selectorEntryFromPlanetaryBody(body) {
  const legacyKind = body?.legacyKind === "gasGiant" ? "gasGiant" : "rocky";
  const id = body?.id;
  const name = body?.name || id;
  const au = Number(body?.orbit?.semiMajorAxisAu) || 0;
  const classification = getPlanetaryBodyClassification(body);
  const classificationLabel = getPlanetaryBodyClassificationLabel(classification);
  const authoringIntent = body?.authoringIntent || "auto";
  const hostFrameId = String(body?.hostFrameId || "").trim();
  const hostFrameLabel = hostFrameId ? `Host frame ${hostFrameId}` : "Primary host frame";
  const baseEntry = {
    id,
    name,
    au,
    hostFrameId,
    hostFrameLabel,
    classificationFamily: classification?.family || "",
    classificationLabel,
    authoringIntent,
    authoringIntentLabel: getAuthoringIntentLabel(authoringIntent),
  };
  if (legacyKind === "gasGiant") {
    return {
      ...baseEntry,
      type: "gasGiant",
      companionClass:
        body?.giant?.companionClass || body?.classificationSeed?.companionClass || "gasGiant",
      value: body?.selector?.value || `gasGiant:${id}`,
      isSubstellar: classification?.family === "brownDwarf",
    };
  }
  const massEarth = Number(body?.composition?.massEarth ?? body?.classificationSeed?.massEarth);
  return {
    ...baseEntry,
    type: "planet",
    isDwarf: Number.isFinite(massEarth) ? massEarth < 0.01 : false,
    value: body?.selector?.value || `planet:${id}`,
  };
}

export function buildBodySelectorEntries(planets, gasGiants) {
  if (gasGiants === undefined && isUnifiedPlanetaryBodyList(planets)) {
    return planets.map(selectorEntryFromPlanetaryBody).sort((a, b) => a.au - b.au);
  }

  const entries = [];
  for (const planet of planets || []) {
    const au = Number(planet?.inputs?.semiMajorAxisAu) || 0;
    const mass = Number(planet?.inputs?.massEarth) || 1;
    entries.push({
      type: "planet",
      id: planet.id,
      name: planet.name || planet.inputs?.name || planet.id,
      au,
      isDwarf: mass < 0.01,
      hostFrameId: planet.hostFrameId || "",
      hostFrameLabel: planet.hostFrameId
        ? `Host frame ${planet.hostFrameId}`
        : "Primary host frame",
      classificationFamily: mass < 0.01 ? "dwarfRocky" : "rocky",
      classificationLabel: mass < 0.01 ? "Dwarf rocky body" : "Rocky world",
      authoringIntent: planet.authoringIntent || planet.inputs?.authoringIntent || "rocky",
      authoringIntentLabel: getAuthoringIntentLabel(
        planet.authoringIntent || planet.inputs?.authoringIntent || "rocky",
      ),
      value: `planet:${planet.id}`,
    });
  }
  for (const giant of gasGiants || []) {
    entries.push({
      type: "gasGiant",
      id: giant.id,
      name: giant.name || giant.id,
      au: Number(giant.au) || 0,
      companionClass: giant.companionClass || "gasGiant",
      hostFrameId: giant.hostFrameId || "",
      hostFrameLabel: giant.hostFrameId ? `Host frame ${giant.hostFrameId}` : "Primary host frame",
      classificationFamily: giant.companionClass === "brownDwarf" ? "brownDwarf" : "gasGiant",
      classificationLabel:
        giant.companionClass === "brownDwarf" ? "Brown-dwarf companion" : "Gas giant",
      authoringIntent: giant.authoringIntent || "gasGiant",
      authoringIntentLabel: getAuthoringIntentLabel(giant.authoringIntent || "gasGiant"),
      isSubstellar: giant.companionClass === "brownDwarf",
      value: `gasGiant:${giant.id}`,
    });
  }
  return entries.sort((a, b) => a.au - b.au);
}

export function buildBodySelectorOptions(entries) {
  return (entries || []).map((entry) => {
    const classificationLabel =
      entry.classificationLabel ||
      (entry.type === "planet"
        ? entry.isDwarf
          ? "Dwarf rocky body"
          : "Rocky world"
        : entry.companionClass === "brownDwarf"
          ? "Brown-dwarf companion"
          : "Gas giant");
    const hostPrefix = entry.hostFrameId ? `${entry.hostFrameId} - ` : "";
    return {
      value: entry.value,
      label: `${hostPrefix}${classificationLabel} - ${entry.name} (${fmt(entry.au, 3)} AU)`,
      dataset: {
        classification: entry.classificationFamily || "",
        authoringIntent: entry.authoringIntent || "",
        hostFrameId: entry.hostFrameId || "",
        substellar: entry.isSubstellar ? "true" : "false",
      },
    };
  });
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function filterBodySelectorEntries(entries, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return entries || [];
  return (entries || []).filter((entry) =>
    [
      entry.name,
      entry.id,
      entry.value,
      entry.classificationLabel,
      entry.authoringIntentLabel,
      entry.hostFrameId,
      entry.hostFrameLabel,
      entry.au,
    ]
      .map((value) => normalizeSearchText(value))
      .some((value) => value.includes(normalizedQuery)),
  );
}

export function buildBodySelectorOptionGroups(entries) {
  const options = buildBodySelectorOptions(entries);
  const hostFrameCount = new Set((entries || []).map((entry) => entry.hostFrameId || "")).size;
  if (hostFrameCount <= 1) return [{ label: "", options }];

  const groupsByHost = new Map();
  for (let index = 0; index < (entries || []).length; index += 1) {
    const entry = entries[index];
    const option = options[index];
    const key = entry.hostFrameId || "__primary__";
    if (!groupsByHost.has(key)) {
      groupsByHost.set(key, {
        label: entry.hostFrameLabel || "Primary host frame",
        minAu: Number.isFinite(entry.au) ? entry.au : Number.POSITIVE_INFINITY,
        options: [],
      });
    }
    const group = groupsByHost.get(key);
    group.minAu = Math.min(group.minAu, Number.isFinite(entry.au) ? entry.au : group.minAu);
    group.options.push(option);
  }

  return [...groupsByHost.values()].sort((left, right) => left.minAu - right.minAu);
}

export function renderBodySelectorOptions(entries, selectedValue) {
  return buildBodySelectorOptions(entries)
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}"${
          option.value === selectedValue ? " selected" : ""
        }>${escapeHtml(option.label)}</option>`,
    )
    .join("");
}
