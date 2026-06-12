export const OVERLAY_MODEL_VERSION = "planetary-subtype-overlays-v1";

export const EARTH_MASS_KG = 5.9722e24;
export const EARTH_RADIUS_KM = 6371;
export const EARTH_GRAVITY_MS2 = 9.80665;
export const STEFAN_BOLTZMANN = 5.670374419e-8;

export function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function firstFinite(...values) {
  for (const value of values) {
    const number = finiteOrNull(value);
    if (number != null) return number;
  }
  return null;
}

export function clamp(value, min, max) {
  const number = finiteOrNull(value);
  if (number == null) return min;
  return Math.max(min, Math.min(max, number));
}

export function roundTo(value, digits = 2) {
  const number = finiteOrNull(value);
  if (number == null) return null;
  const scale = 10 ** digits;
  return Math.round(number * scale) / scale;
}

export function compactObject(source = {}) {
  const out = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

export function overlayReason(code, label, detail = "", severity = "info") {
  return compactObject({ code, label, detail, severity });
}

export function gravityMs2FromMassRadius(massEarth, radiusEarth, fallbackGravityG = null) {
  const gravityG = firstFinite(fallbackGravityG);
  if (gravityG != null && gravityG > 0) return gravityG * EARTH_GRAVITY_MS2;
  const mass = finiteOrNull(massEarth);
  const radius = finiteOrNull(radiusEarth);
  if (mass == null || radius == null || mass <= 0 || radius <= 0) return null;
  return (mass / radius ** 2) * EARTH_GRAVITY_MS2;
}

export function qualitativeScore(score, bands) {
  const normalized = clamp(score, 0, 1);
  for (const band of bands || []) {
    if (normalized >= band.min) return band.label;
  }
  return bands?.[bands.length - 1]?.label || "unknown";
}
