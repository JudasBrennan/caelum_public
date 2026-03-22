import { clamp, toFinite } from "../utils.js";

const LUNAR_MASS_IN_EARTH = 0.0123000371;
const RESONANCE_OFFSET_PCT_LIMIT = 2.5;
const RATIO_DRIFT_SECONDS_PER_GYR = 3.15576e16;

export const RESONANCE_CANDIDATES = [
  { numerator: 2, denominator: 1 },
  { numerator: 3, denominator: 2 },
  { numerator: 5, denominator: 3 },
  { numerator: 4, denominator: 3 },
  { numerator: 5, denominator: 2 },
  { numerator: 3, denominator: 1 },
];

export const RESONANCE_FORCING_GAIN = {
  "2:1": 200,
  "3:2": 180,
  "4:3": 160,
  "5:3": 120,
  "5:2": 100,
  "3:1": 90,
};

export function findNearestResonance(periodRatio) {
  if (!Number.isFinite(periodRatio) || periodRatio <= 0) return null;
  let best = null;
  for (const candidate of RESONANCE_CANDIDATES) {
    const targetRatio = candidate.numerator / candidate.denominator;
    const offsetPct = (Math.abs(periodRatio - targetRatio) / targetRatio) * 100;
    if (!best || offsetPct < best.offsetPct) {
      best = {
        label: `${candidate.numerator}:${candidate.denominator}`,
        targetRatio,
        offsetPct,
      };
    }
  }
  return best;
}

export function computeForcedEccentricity({
  resonanceLabel,
  offsetPct,
  perturberMassMoon,
  parentMassEarth,
  semiMajorAxisKm,
  perturberSemiMajorAxisKm,
}) {
  const gain = RESONANCE_FORCING_GAIN[String(resonanceLabel || "")];
  if (!gain) return 0;

  const resolvedOffsetPct = Math.max(toFinite(offsetPct, Infinity), 0);
  if (resolvedOffsetPct > RESONANCE_OFFSET_PCT_LIMIT) return 0;

  const resolvedParentMassEarth = Math.max(toFinite(parentMassEarth, 0), 0);
  const resolvedPerturberMassMoon = Math.max(toFinite(perturberMassMoon, 0), 0);
  const resolvedSemiMajorAxisKm = Math.max(toFinite(semiMajorAxisKm, 0), 0);
  const resolvedPerturberSemiMajorAxisKm = Math.max(toFinite(perturberSemiMajorAxisKm, 0), 0);
  if (
    resolvedParentMassEarth <= 0 ||
    resolvedPerturberMassMoon <= 0 ||
    resolvedSemiMajorAxisKm <= 0 ||
    resolvedPerturberSemiMajorAxisKm <= 0
  ) {
    return 0;
  }

  const perturberMassEarth = resolvedPerturberMassMoon * LUNAR_MASS_IN_EARTH;
  const massRatio = perturberMassEarth / resolvedParentMassEarth;
  const alpha =
    Math.min(resolvedSemiMajorAxisKm, resolvedPerturberSemiMajorAxisKm) /
    Math.max(resolvedSemiMajorAxisKm, resolvedPerturberSemiMajorAxisKm);
  const offsetTaper = clamp(1 - resolvedOffsetPct / RESONANCE_OFFSET_PCT_LIMIT, 0, 1) ** 2;

  return clamp(massRatio * alpha * gain * offsetTaper, 0, 0.02);
}

export function computePeriodRatioDriftPctPerGyr({
  semiMajorAxisInnerKm,
  semiMajorAxisOuterKm,
  dadtInnerMs,
  dadtOuterMs,
}) {
  const aInnerM = Math.max(toFinite(semiMajorAxisInnerKm, 0), 0) * 1000;
  const aOuterM = Math.max(toFinite(semiMajorAxisOuterKm, 0), 0) * 1000;
  const resolvedDadtInnerMs = toFinite(dadtInnerMs, 0);
  const resolvedDadtOuterMs = toFinite(dadtOuterMs, 0);
  if (aInnerM <= 0 || aOuterM <= 0) return 0;

  const dlnPInnerDt = 1.5 * resolvedDadtInnerMs / aInnerM;
  const dlnPOuterDt = 1.5 * resolvedDadtOuterMs / aOuterM;
  const dlnRatioDt = dlnPOuterDt - dlnPInnerDt;
  return dlnRatioDt * RATIO_DRIFT_SECONDS_PER_GYR * 100;
}

export function classifyMigrationTrendState(ratioDriftPctPerGyr) {
  const resolvedRate = toFinite(ratioDriftPctPerGyr, 0);
  if (resolvedRate < -0.01) return "converging";
  if (resolvedRate > 0.01) return "diverging";
  return "neutral";
}

export function classifyMigrationTrendStrength(ratioDriftPctPerGyr) {
  const magnitude = Math.abs(toFinite(ratioDriftPctPerGyr, 0));
  if (magnitude >= 10) return "strong";
  if (magnitude >= 1) return "moderate";
  if (magnitude >= 0.01) return "weak";
  return "none";
}

export function formatMigrationTrendDisplay({
  nearestResonance,
  migrationTrendState,
  migrationTrendStrength,
}) {
  const label = nearestResonance?.label;
  if (!label || migrationTrendState === "neutral") return "No strong convergent trend";
  if (migrationTrendState === "converging") {
    return `Converging on ${label} (${migrationTrendStrength})`;
  }
  if (migrationTrendState === "diverging") {
    return `Diverging from ${label} (${migrationTrendStrength})`;
  }
  return "No strong convergent trend";
}
