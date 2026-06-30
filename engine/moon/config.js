import { ISOTOPE_HEAT_FRACTIONS } from "../planet.js";
import {
  ROCKY_BODY_COMPONENT_KEYS,
  ROCKY_BODY_ELEMENT_KEYS,
  ROCKY_BODY_TRACE_ELEMENT_KEYS,
} from "../rockyBodyComposition.js";

export const MOON_SCIENCE_MODES = ["core", "full", "manual"];
export const MOON_RADIOISOTOPE_MODES = ["simple", "advanced"];
export const MOON_ORIGIN_PATHWAYS = Object.freeze([
  { id: "auto", label: "Auto / inferred" },
  { id: "circumplanetaryDisk", label: "Circumplanetary disk" },
  { id: "giantImpactDebrisDisk", label: "Giant impact debris disk" },
  { id: "capturedIrregular", label: "Captured irregular" },
  { id: "binaryExchangeCapture", label: "Binary exchange capture" },
  { id: "coformedCompanion", label: "Co-formed companion" },
  { id: "tidalDisruptionReaccretion", label: "Tidal disruption reaccretion" },
  { id: "unknown", label: "Unknown / authored" },
]);

const MOON_ORIGIN_PATHWAY_IDS = new Set(MOON_ORIGIN_PATHWAYS.map((pathway) => pathway.id));
const MOON_ORIGIN_PATHWAY_ALIASES = new Map(
  MOON_ORIGIN_PATHWAYS.flatMap((pathway) => [
    [pathway.id.toLowerCase(), pathway.id],
    [pathway.label.toLowerCase(), pathway.id],
  ]),
);

function normalizeMode(mode, fallback = "core") {
  const value = String(mode || "").toLowerCase();
  return MOON_SCIENCE_MODES.includes(value) ? value : fallback;
}

function normalizeRadioisotopeMode(mode) {
  const value = String(mode || "").toLowerCase();
  return MOON_RADIOISOTOPE_MODES.includes(value) ? value : "simple";
}

export function normalizeMoonOriginPathway(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "auto";
  if (MOON_ORIGIN_PATHWAY_IDS.has(raw)) return raw;
  const compact = raw.replace(/[-_\s/]+/g, "").toLowerCase();
  const direct = MOON_ORIGIN_PATHWAY_ALIASES.get(raw.toLowerCase());
  if (direct) return direct;
  const compactMatch = MOON_ORIGIN_PATHWAYS.find(
    (pathway) =>
      pathway.id.replace(/[-_\s/]+/g, "").toLowerCase() === compact ||
      pathway.label.replace(/[-_\s/]+/g, "").toLowerCase() === compact,
  );
  return compactMatch?.id || "auto";
}

export function moonOriginPathwayLabel(value) {
  const id = normalizeMoonOriginPathway(value);
  return MOON_ORIGIN_PATHWAYS.find((pathway) => pathway.id === id)?.label || "Auto / inferred";
}

function normalizeFiniteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeStringOrNull(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function hasOwnField(source, key) {
  return !!source && Object.prototype.hasOwnProperty.call(source, key);
}

function normalizeCompositionMode(value) {
  const mode = String(value || "").trim();
  return ["inferred", "reservoir", "expert-elements"].includes(mode) ? mode : "inferred";
}

function normalizeCompositionNormalizeMode(value) {
  return String(value || "").trim() === "normalize" ? "normalize" : "warn";
}

function normalizeCompositionStructureSource(value) {
  return String(value || "").trim() === "components" ? "components" : "inferred";
}

function normalizeManualCompositionValue(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeManualCompositionGroup(value, keys) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const out = {};
  for (const key of keys) out[key] = normalizeManualCompositionValue(source[key]);
  return out;
}

function normalizeString(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeCompositionSuggestionMeta(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const modelVersion = normalizeString(value.modelVersion);
  const source = normalizeString(value.source);
  const confidence = normalizeString(value.confidence);
  const bodySignature = normalizeString(value.bodySignature);
  const caveats = Array.isArray(value.caveats)
    ? value.caveats
        .map((caveat) => normalizeString(caveat))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  if (!modelVersion && !source && !bodySignature && !caveats.length) return null;
  return {
    modelVersion,
    source,
    confidence: ["low", "medium", "high"].includes(confidence) ? confidence : "",
    bodySignature,
    caveats,
  };
}

function normalizeMoonCompositionInputs(source, { includeDefaults = true } = {}) {
  const out = {};
  if (includeDefaults || hasOwnField(source, "compositionMode")) {
    out.compositionMode = normalizeCompositionMode(source.compositionMode);
  }
  if (includeDefaults || hasOwnField(source, "compositionNormalizeMode")) {
    out.compositionNormalizeMode = normalizeCompositionNormalizeMode(
      source.compositionNormalizeMode,
    );
  }
  if (includeDefaults || hasOwnField(source, "compositionStructureSource")) {
    out.compositionStructureSource = normalizeCompositionStructureSource(
      source.compositionStructureSource,
    );
  }
  if (includeDefaults || hasOwnField(source, "manualComponentPct")) {
    out.manualComponentPct = normalizeManualCompositionGroup(
      source.manualComponentPct,
      ROCKY_BODY_COMPONENT_KEYS,
    );
  }
  if (includeDefaults || hasOwnField(source, "manualElementPct")) {
    out.manualElementPct = normalizeManualCompositionGroup(
      source.manualElementPct,
      ROCKY_BODY_ELEMENT_KEYS,
    );
  }
  if (includeDefaults || hasOwnField(source, "manualTraceElementAbundance")) {
    out.manualTraceElementAbundance = normalizeManualCompositionGroup(
      source.manualTraceElementAbundance,
      ROCKY_BODY_TRACE_ELEMENT_KEYS,
    );
  }
  if (includeDefaults || hasOwnField(source, "compositionSuggestionMeta")) {
    out.compositionSuggestionMeta = normalizeCompositionSuggestionMeta(
      source.compositionSuggestionMeta,
    );
  }
  return out;
}

export function normalizeMoonScienceMode(mode) {
  return normalizeMode(mode, "core");
}

export function normalizeMoonRadioisotopeMode(mode) {
  return normalizeRadioisotopeMode(mode);
}

export function normalizeMoonInputs(raw = {}, options = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const includeCompositionDefaults = options.includeCompositionDefaults !== false;
  return {
    ...source,
    originPathway: normalizeMoonOriginPathway(source.originPathway),
    ...normalizeMoonCompositionInputs(source, { includeDefaults: includeCompositionDefaults }),
    compositionOverride:
      source.compositionOverride === undefined
        ? null
        : normalizeStringOrNull(source.compositionOverride),
    initialRotationPeriodHours:
      source.initialRotationPeriodHours === undefined
        ? null
        : normalizeFiniteOrNull(source.initialRotationPeriodHours),
    hydrosphereMode: normalizeMode(source.hydrosphereMode, "core"),
    atmosphereMode: normalizeMode(source.atmosphereMode, "core"),
    orbitalCouplingMode: normalizeMode(source.orbitalCouplingMode, "core"),
    waterMassFractionPct: normalizeFiniteOrNull(source.waterMassFractionPct),
    salinityPct: normalizeFiniteOrNull(source.salinityPct),
    ammoniaPct: normalizeFiniteOrNull(source.ammoniaPct),
    differentiatedInterior:
      source.differentiatedInterior === undefined || source.differentiatedInterior === null
        ? null
        : !!source.differentiatedInterior,
    radioisotopeMode: normalizeRadioisotopeMode(source.radioisotopeMode),
    radioisotopeAbundance: normalizeFiniteOrNull(source.radioisotopeAbundance),
    u238Abundance: normalizeFiniteOrNull(source.u238Abundance),
    u235Abundance: normalizeFiniteOrNull(source.u235Abundance),
    th232Abundance: normalizeFiniteOrNull(source.th232Abundance),
    k40Abundance: normalizeFiniteOrNull(source.k40Abundance),
    manualSurfacePressureAtm: normalizeFiniteOrNull(source.manualSurfacePressureAtm),
    n2Pct: Number.isFinite(Number(source.n2Pct)) ? Number(source.n2Pct) : 0,
    o2Pct: Number.isFinite(Number(source.o2Pct)) ? Number(source.o2Pct) : 0,
    co2Pct: Number.isFinite(Number(source.co2Pct)) ? Number(source.co2Pct) : 0,
    arPct: Number.isFinite(Number(source.arPct)) ? Number(source.arPct) : 0,
    h2oPct: Number.isFinite(Number(source.h2oPct)) ? Number(source.h2oPct) : 0,
    ch4Pct: Number.isFinite(Number(source.ch4Pct)) ? Number(source.ch4Pct) : 0,
    coPct: Number.isFinite(Number(source.coPct)) ? Number(source.coPct) : 0,
    h2Pct: Number.isFinite(Number(source.h2Pct)) ? Number(source.h2Pct) : 0,
    hePct: Number.isFinite(Number(source.hePct)) ? Number(source.hePct) : 0,
    so2Pct: Number.isFinite(Number(source.so2Pct)) ? Number(source.so2Pct) : 0,
    nh3Pct: Number.isFinite(Number(source.nh3Pct)) ? Number(source.nh3Pct) : 0,
    forcedEccentricity: normalizeFiniteOrNull(source.forcedEccentricity),
    manualResonanceGroupId: normalizeStringOrNull(source.manualResonanceGroupId),
    manualResonanceOrder: normalizeFiniteOrNull(source.manualResonanceOrder),
    manualResonanceRatio: normalizeFiniteOrNull(source.manualResonanceRatio),
  };
}

export function resolveMoonRadioisotopeAbundance(inputs = {}, fallback = 1, options = {}) {
  const normalized = normalizeMoonInputs(inputs);
  const trace = options.traceElementAbundance || {};
  const traceRadiogenicAbundance = Number(options.traceRadiogenicAbundance);
  if (normalized.radioisotopeMode === "advanced") {
    const uraniumDefault = Number.isFinite(Number(trace.uranium)) ? Number(trace.uranium) : 1;
    const thoriumDefault = Number.isFinite(Number(trace.thorium)) ? Number(trace.thorium) : 1;
    const potassiumDefault = Number.isFinite(Number(trace.potassium)) ? Number(trace.potassium) : 1;
    const u238 = Math.max(0, Math.min(5, normalized.u238Abundance ?? uraniumDefault));
    const u235 = Math.max(0, Math.min(5, normalized.u235Abundance ?? uraniumDefault));
    const th232 = Math.max(0, Math.min(5, normalized.th232Abundance ?? thoriumDefault));
    const k40 = Math.max(0, Math.min(5, normalized.k40Abundance ?? potassiumDefault));
    return Math.max(
      0.01,
      u238 * ISOTOPE_HEAT_FRACTIONS.u238 +
        u235 * ISOTOPE_HEAT_FRACTIONS.u235 +
        th232 * ISOTOPE_HEAT_FRACTIONS.th232 +
        k40 * ISOTOPE_HEAT_FRACTIONS.k40,
    );
  }
  const source =
    normalized.radioisotopeAbundance ??
    (Number.isFinite(traceRadiogenicAbundance) ? traceRadiogenicAbundance : null) ??
    fallback ??
    1;
  return Math.max(0.1, Math.min(3, Number(source) || 1));
}
