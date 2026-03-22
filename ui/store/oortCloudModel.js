import { clamp } from "../../engine/utils.js";

export const OORT_CLOUD_MODES = Object.freeze(["auto", "guided", "manual"]);
export const OORT_CLOUD_INSTABILITY_HISTORY = Object.freeze(["quiet", "mild", "violent"]);
export const OORT_CLOUD_SEED_PROFILES = Object.freeze([
  "typicalLongPeriod",
  "extremeLongPeriod",
  "sunSkimmer",
  "isotropicSample",
]);
export const OORT_CLOUD_SEED_VOLATILES = Object.freeze([
  "auto",
  "waterRich",
  "mixed",
  "co2Rich",
  "coRich",
]);
export const OORT_CLOUD_SEED_INCLINATIONS = Object.freeze([
  "auto",
  "isotropic",
  "mildlyPrograde",
  "retrogradeHeavy",
]);
export const OORT_CLOUD_SEED_NUCLEUS_BIASES = Object.freeze(["small", "medium", "large"]);

export const DEFAULT_OORT_CLOUD_CONFIG = Object.freeze({
  mode: "auto",
  guided: {
    formationEfficiency: 1,
    retention: 1,
    innerCompactness: 1,
    instabilityHistory: "mild",
  },
  manual: {
    present: null,
    innerBoundaryAu: null,
    outerBoundaryAu: null,
    estimatedMassMearth: null,
    injectionRatePerYear: null,
  },
  seeding: {
    profile: "typicalLongPeriod",
    volatileClass: "auto",
    inclinationMode: "auto",
    nucleusSizeBias: "medium",
  },
});

function cloneDefaultOortCloudConfig() {
  return {
    mode: DEFAULT_OORT_CLOUD_CONFIG.mode,
    guided: { ...DEFAULT_OORT_CLOUD_CONFIG.guided },
    manual: { ...DEFAULT_OORT_CLOUD_CONFIG.manual },
    seeding: { ...DEFAULT_OORT_CLOUD_CONFIG.seeding },
  };
}

function normalizeChoice(value, allowed, fallback) {
  const normalized = String(value ?? "").trim();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeFinite(value, fallback, min, max) {
  if (value == null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? clamp(num, min, max) : fallback;
}

function normalizeOptionalFinite(value, min, max) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? clamp(num, min, max) : null;
}

function normalizeManualPresent(value) {
  return value === true ? true : value === false ? false : null;
}

export function normalizeOortCloudConfig(raw) {
  const next = cloneDefaultOortCloudConfig();
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const guided = source.guided && typeof source.guided === "object" ? source.guided : {};
  const manual = source.manual && typeof source.manual === "object" ? source.manual : {};
  const seeding = source.seeding && typeof source.seeding === "object" ? source.seeding : {};

  next.mode = normalizeChoice(source.mode, OORT_CLOUD_MODES, DEFAULT_OORT_CLOUD_CONFIG.mode);
  next.guided.formationEfficiency = normalizeFinite(
    guided.formationEfficiency,
    DEFAULT_OORT_CLOUD_CONFIG.guided.formationEfficiency,
    0.25,
    2.5,
  );
  next.guided.retention = normalizeFinite(
    guided.retention,
    DEFAULT_OORT_CLOUD_CONFIG.guided.retention,
    0.25,
    2.0,
  );
  next.guided.innerCompactness = normalizeFinite(
    guided.innerCompactness,
    DEFAULT_OORT_CLOUD_CONFIG.guided.innerCompactness,
    0.6,
    1.8,
  );
  next.guided.instabilityHistory = normalizeChoice(
    guided.instabilityHistory,
    OORT_CLOUD_INSTABILITY_HISTORY,
    DEFAULT_OORT_CLOUD_CONFIG.guided.instabilityHistory,
  );

  next.manual.present = normalizeManualPresent(manual.present);
  next.manual.innerBoundaryAu = normalizeOptionalFinite(manual.innerBoundaryAu, 1000, 300000);
  next.manual.outerBoundaryAu = normalizeOptionalFinite(manual.outerBoundaryAu, 2500, 500000);
  next.manual.estimatedMassMearth = normalizeOptionalFinite(manual.estimatedMassMearth, 0, 200);
  next.manual.injectionRatePerYear = normalizeOptionalFinite(manual.injectionRatePerYear, 0, 100);

  next.seeding.profile = normalizeChoice(
    seeding.profile,
    OORT_CLOUD_SEED_PROFILES,
    DEFAULT_OORT_CLOUD_CONFIG.seeding.profile,
  );
  next.seeding.volatileClass = normalizeChoice(
    seeding.volatileClass,
    OORT_CLOUD_SEED_VOLATILES,
    DEFAULT_OORT_CLOUD_CONFIG.seeding.volatileClass,
  );
  next.seeding.inclinationMode = normalizeChoice(
    seeding.inclinationMode,
    OORT_CLOUD_SEED_INCLINATIONS,
    DEFAULT_OORT_CLOUD_CONFIG.seeding.inclinationMode,
  );
  next.seeding.nucleusSizeBias = normalizeChoice(
    seeding.nucleusSizeBias,
    OORT_CLOUD_SEED_NUCLEUS_BIASES,
    DEFAULT_OORT_CLOUD_CONFIG.seeding.nucleusSizeBias,
  );

  return next;
}

export function getOortCloudConfig(world) {
  return normalizeOortCloudConfig(world?.system?.oortCloud);
}
