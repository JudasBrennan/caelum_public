import { ISOTOPE_HEAT_FRACTIONS } from "../planet.js";

export const MOON_SCIENCE_MODES = ["core", "full", "manual"];
export const MOON_RADIOISOTOPE_MODES = ["simple", "advanced"];

function normalizeMode(mode, fallback = "core") {
  const value = String(mode || "").toLowerCase();
  return MOON_SCIENCE_MODES.includes(value) ? value : fallback;
}

function normalizeRadioisotopeMode(mode) {
  const value = String(mode || "").toLowerCase();
  return MOON_RADIOISOTOPE_MODES.includes(value) ? value : "simple";
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

export function normalizeMoonScienceMode(mode) {
  return normalizeMode(mode, "core");
}

export function normalizeMoonRadioisotopeMode(mode) {
  return normalizeRadioisotopeMode(mode);
}

export function normalizeMoonInputs(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    ...source,
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

export function resolveMoonRadioisotopeAbundance(inputs = {}, fallback = 1) {
  const normalized = normalizeMoonInputs(inputs);
  if (normalized.radioisotopeMode === "advanced") {
    const u238 = Math.max(0, Math.min(5, normalized.u238Abundance ?? 1));
    const u235 = Math.max(0, Math.min(5, normalized.u235Abundance ?? 1));
    const th232 = Math.max(0, Math.min(5, normalized.th232Abundance ?? 1));
    const k40 = Math.max(0, Math.min(5, normalized.k40Abundance ?? 1));
    return Math.max(
      0.01,
      u238 * ISOTOPE_HEAT_FRACTIONS.u238 +
        u235 * ISOTOPE_HEAT_FRACTIONS.u235 +
        th232 * ISOTOPE_HEAT_FRACTIONS.th232 +
        k40 * ISOTOPE_HEAT_FRACTIONS.k40,
    );
  }
  const source = normalized.radioisotopeAbundance ?? fallback ?? 1;
  return Math.max(0.1, Math.min(3, Number(source) || 1));
}
