import {
  buildPlanetaryVisualControlManifest,
  getVisualControl,
  listAvailableVisualControlPaths,
} from "./controlManifest.js";
import { normalizeVisualOverrides, stripEmptyVisualOverrides } from "./overrides.js";

const COLOR_SWATCHES = Object.freeze([
  "#2b3440",
  "#4a5968",
  "#6b7f8f",
  "#8aa9b8",
  "#c7d8dd",
  "#e8e2cf",
  "#c79b6d",
  "#9e6a4b",
  "#6f4b3e",
  "#3e5f8f",
  "#1f7e9a",
  "#77dfd8",
  "#dce9ed",
  "#8f4730",
  "#d28b56",
  "#73533a",
]);

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hashSeed(seed) {
  const text = String(seed ?? "planetary-visual-random");
  let hash = 2166136261;
  for (let idx = 0; idx < text.length; idx += 1) {
    hash ^= text.charCodeAt(idx);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createPlanetaryVisualRandom(seed = "planetary-visual-random") {
  let state = hashSeed(seed);
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function setPath(target, path, value) {
  const parts = String(path || "")
    .split(".")
    .filter(Boolean);
  if (!parts.length || value === undefined) return target;
  let cursor = target;
  for (let idx = 0; idx < parts.length - 1; idx += 1) {
    const key = parts[idx];
    if (!isPlainObject(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
  return target;
}

function pathInSection(path, sectionId) {
  if (path === "seed" && sectionId === "generation") return true;
  return String(path || "").split(".")[0] === sectionId;
}

function choose(random, values) {
  if (!values.length) return undefined;
  const idx = Math.min(values.length - 1, Math.floor(random() * values.length));
  return values[idx];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value, step) {
  if (!step) return Number(value.toFixed(4));
  const decimals = Math.max(0, String(step).split(".")[1]?.length || 0);
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

function numericValueFor(control, random) {
  const min = Number.isFinite(control?.min) ? control.min : 0;
  const max = Number.isFinite(control?.max) ? control.max : 1;
  const step = Number.isFinite(control?.step) ? control.step : 0.01;
  return clamp(roundToStep(min + random() * (max - min), step), min, max);
}

function valueForControl(control, random) {
  if (!control) return undefined;
  if (control.type === "color") return choose(random, COLOR_SWATCHES);
  if (control.type === "boolean") return random() >= 0.5;
  if (control.type === "range" || control.type === "number")
    return numericValueFor(control, random);
  if (control.type === "select") {
    const options = Array.isArray(control.options) ? control.options : [];
    const selected = choose(random, options);
    return selected?.value ?? selected?.id;
  }
  return undefined;
}

function normalizeLockedFields(values) {
  const out = new Set();
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const path = String(entry ?? "").trim();
        if (path) out.add(path);
      }
      continue;
    }
    if (isPlainObject(value)) {
      for (const [path, locked] of Object.entries(value)) {
        if (locked) out.add(path);
      }
      continue;
    }
    const path = String(value ?? "").trim();
    if (path) out.add(path);
  }
  return out;
}

function collectLockedFields(source = {}, options = {}) {
  return normalizeLockedFields([
    options.lockedFields,
    source.lockedFields,
    source.visualOverrides?.lockedFields,
    source.appearance?.visualOverrides?.lockedFields,
    source.appearance?.lockedFields,
  ]);
}

function defaultSeedFor(source, sectionId) {
  return [
    source?.id,
    source?.key,
    source?.name,
    source?.body?.id,
    source?.body?.name,
    source?.classification?.family,
    sectionId || "all",
  ]
    .filter((value) => value != null && value !== "")
    .join(":");
}

function existingSeedFor(source = {}) {
  return String(
    source?.visualOverrides?.seed ||
      source?.appearance?.visualOverrides?.seed ||
      source?.appearance?.seed ||
      "",
  ).trim();
}

function randomizeControls(source = {}, options = {}) {
  const manifest = options.manifest || buildPlanetaryVisualControlManifest(source);
  const sectionId = options.sectionId || "";
  const seed = String(
    options.seed ?? (defaultSeedFor(source, sectionId) || "planetary-visual-random"),
  );
  const random = createPlanetaryVisualRandom(seed);
  const lockedFields = collectLockedFields(source, options);
  const existingSeed = existingSeedFor(source);
  const overrides = lockedFields.has("seed")
    ? existingSeed
      ? { seed: existingSeed }
      : {}
    : { seed };

  for (const path of listAvailableVisualControlPaths(manifest)) {
    if (sectionId && !pathInSection(path, sectionId)) continue;
    if (lockedFields.has(path)) continue;
    const control = getVisualControl(manifest, path);
    const value = valueForControl(control, random);
    setPath(overrides, path, value);
  }

  return stripEmptyVisualOverrides(normalizeVisualOverrides(overrides, manifest));
}

export function randomizePlanetaryVisualOverrides(source = {}, options = {}) {
  return randomizeControls(source, options);
}

export function randomizePlanetaryVisualSection(source = {}, sectionId, options = {}) {
  return randomizeControls(source, {
    ...options,
    sectionId,
  });
}
