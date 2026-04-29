import { clamp } from "../../engine/utils.js";
import { listFromCollection } from "./systemCollections.js";

export const COMET_SOURCE_RESERVOIRS = Object.freeze(["manual", "debrisDisk", "oortCloud"]);
export const COMET_VOLATILE_CLASSES = Object.freeze(["waterRich", "mixed", "co2Rich", "coRich"]);

const DEFAULT_COMET = Object.freeze({
  sourceReservoir: "manual",
  semiMajorAxisAu: 8,
  eccentricity: 0.65,
  inclinationDeg: 15,
  longitudeOfPeriapsisDeg: 0,
  meanAnomalyDeg: 0,
  nucleusRadiusKm: 4,
  densityGcm3: 0.6,
  albedo: 0.04,
  activeFraction: 0.08,
  dustToGasRatio: 1.2,
  volatileClass: "waterRich",
});

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function normalizeAngleDeg(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const wrapped = ((num % 360) + 360) % 360;
  return wrapped;
}

function normalizeReservoir(value) {
  const normalized = String(value || "").trim();
  return COMET_SOURCE_RESERVOIRS.includes(normalized) ? normalized : DEFAULT_COMET.sourceReservoir;
}

function normalizeVolatileClass(value) {
  const normalized = String(value || "").trim();
  return COMET_VOLATILE_CLASSES.includes(normalized) ? normalized : DEFAULT_COMET.volatileClass;
}

function clampOrDefault(value, fallback, min, max) {
  const num = Number(value);
  return Number.isFinite(num) ? clamp(num, min, max) : fallback;
}

export function normalizeComet(raw, idx = 1, { fallbackHostFrameId = null } = {}) {
  const rawName = String(raw?.name || "").trim();
  return {
    id: String(raw?.id || `c${idx}`),
    name: rawName || `Comet ${idx}`,
    hostFrameId: normalizeHostFrameId(raw?.hostFrameId, fallbackHostFrameId),
    sourceReservoir: normalizeReservoir(raw?.sourceReservoir),
    semiMajorAxisAu: clampOrDefault(
      raw?.semiMajorAxisAu ?? raw?.aAu,
      DEFAULT_COMET.semiMajorAxisAu,
      0.01,
      1000000,
    ),
    eccentricity: clampOrDefault(
      raw?.eccentricity ?? raw?.ecc,
      DEFAULT_COMET.eccentricity,
      0,
      0.9999,
    ),
    inclinationDeg: clampOrDefault(
      raw?.inclinationDeg ?? raw?.inclination,
      DEFAULT_COMET.inclinationDeg,
      0,
      180,
    ),
    longitudeOfPeriapsisDeg: normalizeAngleDeg(
      raw?.longitudeOfPeriapsisDeg ?? raw?.longitudeOfPeriapsis,
      DEFAULT_COMET.longitudeOfPeriapsisDeg,
    ),
    meanAnomalyDeg: normalizeAngleDeg(
      raw?.meanAnomalyDeg ?? raw?.meanAnomaly,
      DEFAULT_COMET.meanAnomalyDeg,
    ),
    nucleusRadiusKm: clampOrDefault(
      raw?.nucleusRadiusKm ?? raw?.radiusKm,
      DEFAULT_COMET.nucleusRadiusKm,
      0.5,
      50,
    ),
    densityGcm3: clampOrDefault(
      raw?.densityGcm3 ?? raw?.density,
      DEFAULT_COMET.densityGcm3,
      0.2,
      1.0,
    ),
    albedo: clampOrDefault(raw?.albedo, DEFAULT_COMET.albedo, 0.01, 0.12),
    activeFraction: clampOrDefault(raw?.activeFraction, DEFAULT_COMET.activeFraction, 0.005, 0.5),
    dustToGasRatio: clampOrDefault(raw?.dustToGasRatio, DEFAULT_COMET.dustToGasRatio, 0.5, 4),
    volatileClass: normalizeVolatileClass(raw?.volatileClass),
  };
}

export function getComets(world, { hostFrameId = null, fallbackHostFrameId = null } = {}) {
  const cs = world?.system?.comets;
  const resolvedFallbackHostFrameId =
    normalizeHostFrameId(
      fallbackHostFrameId,
      normalizeHostFrameId(world?.stellarSystem?.defaultHostFrameId, "star_a"),
    ) || "star_a";
  const normalized = Array.isArray(cs)
    ? cs.map((comet, index) =>
        normalizeComet(comet, index + 1, { fallbackHostFrameId: resolvedFallbackHostFrameId }),
      )
    : listFromCollection(cs).map((comet, index) =>
        normalizeComet(comet, index + 1, { fallbackHostFrameId: resolvedFallbackHostFrameId }),
      );
  const resolvedHostFrameId = normalizeHostFrameId(hostFrameId, null);
  if (!resolvedHostFrameId) return normalized;
  return normalized.filter(
    (comet) =>
      normalizeHostFrameId(comet.hostFrameId, resolvedFallbackHostFrameId) === resolvedHostFrameId,
  );
}
