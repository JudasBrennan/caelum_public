import { auToKilometers } from "../physics/orbital.js";
import { clamp, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "moon-orientation-context-v1";
const SOURCE_KEYS = ["moonOrientation"];
const AU_KM = auToKilometers(1);
const G = 6.6743e-11;
const EARTH_MASS_KG = 5.9722e24;
const SOLAR_MASS_KG = 1.98847e30;
const SECONDS_PER_YEAR = 365.25 * 86400;

function positive(value, fallback = NaN) {
  const number = toFinite(value, fallback);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function hasFiniteInput(value) {
  if (value == null || value === "") return false;
  return Number.isFinite(Number(value));
}

function degToRad(deg) {
  return (toFinite(deg, 0) * Math.PI) / 180;
}

function periodYearsFromRate(rateRadPerSec) {
  const rate = Math.abs(toFinite(rateRadPerSec, NaN));
  if (!(rate > 0)) return NaN;
  return (2 * Math.PI) / rate / SECONDS_PER_YEAR;
}

function classifyPrecession(periodYears) {
  const years = positive(periodYears);
  if (!Number.isFinite(years)) return "unknown";
  if (years < 100) return "rapid";
  if (years < 10000) return "moderate";
  if (years < 1000000) return "slow";
  return "very-slow";
}

function classifyLaplaceRatio(ratio) {
  const value = positive(ratio);
  if (!Number.isFinite(value)) return "unknown";
  if (value < 0.5) return "parent-oblate-dominated";
  if (value <= 2) return "transition-zone";
  return "stellar-tide-influenced";
}

function laplaceRadiusKm({
  parentJ2,
  parentRadiusKm,
  parentSemiMajorAxisAu,
  parentMassEarth,
  hostStarMassMsol,
  parentEccentricity = 0,
}) {
  const j2 = positive(parentJ2);
  const radius = positive(parentRadiusKm);
  const parentOrbitKm = positive(parentSemiMajorAxisAu) * AU_KM;
  const parentMassKg = positive(parentMassEarth) * EARTH_MASS_KG;
  const starMassKg = positive(hostStarMassMsol, 1) * SOLAR_MASS_KG;
  if (
    !Number.isFinite(j2) ||
    !Number.isFinite(radius) ||
    !Number.isFinite(parentOrbitKm) ||
    !Number.isFinite(parentMassKg) ||
    !Number.isFinite(starMassKg)
  ) {
    return NaN;
  }
  const eccentricityFactor =
    Math.max(0.01, 1 - clamp(toFinite(parentEccentricity, 0), 0, 0.95) ** 2) ** 1.5;
  const radiusPower =
    2 * j2 * radius ** 2 * parentOrbitKm ** 3 * (parentMassKg / starMassKg) * eccentricityFactor;
  return radiusPower > 0 ? radiusPower ** (1 / 5) : NaN;
}

function j2PrecessionRates({
  parentJ2,
  parentRadiusKm,
  parentMassEarth,
  moonSemiMajorAxisKm,
  moonEccentricity = 0,
  moonInclinationDeg = 0,
}) {
  const j2 = positive(parentJ2);
  const radius = positive(parentRadiusKm);
  const parentMassKg = positive(parentMassEarth) * EARTH_MASS_KG;
  const aM = positive(moonSemiMajorAxisKm) * 1000;
  if (
    !Number.isFinite(j2) ||
    !Number.isFinite(radius) ||
    !Number.isFinite(parentMassKg) ||
    !Number.isFinite(aM)
  ) {
    return null;
  }
  const aKm = aM / 1000;
  const e = clamp(toFinite(moonEccentricity, 0), 0, 0.95);
  const inclination = degToRad(moonInclinationDeg);
  const n = Math.sqrt((G * parentMassKg) / aM ** 3);
  const scale = (j2 * n * (radius / aKm) ** 2) / Math.max((1 - e * e) ** 2, 1e-9);
  const nodalRateRadSec = -1.5 * scale * Math.cos(inclination);
  const apsidalRateRadSec = 0.75 * scale * (5 * Math.cos(inclination) ** 2 - 1);
  return {
    nodalRateRadSec,
    apsidalRateRadSec,
    nodalPeriodYears: periodYearsFromRate(nodalRateRadSec),
    apsidalPeriodYears: periodYearsFromRate(apsidalRateRadSec),
  };
}

export function buildMoonOrientationContext({
  parentMassEarth,
  parentRadiusKm,
  parentJ2,
  hostStarMassMsol = 1,
  parentSemiMajorAxisAu,
  parentEccentricity = 0,
  moonSemiMajorAxisKm,
  moonEccentricity = 0,
  moonInclinationDeg = 0,
  moonSpinState = null,
  moonObliquityDeg = null,
  momentOfInertiaFactor = null,
} = {}) {
  const missingInputs = [];
  if (!Number.isFinite(positive(parentMassEarth))) missingInputs.push("parent mass");
  if (!Number.isFinite(positive(parentRadiusKm))) missingInputs.push("parent radius");
  if (!Number.isFinite(positive(parentJ2))) missingInputs.push("parent J2");
  if (!Number.isFinite(positive(hostStarMassMsol))) missingInputs.push("host star mass");
  if (!Number.isFinite(positive(parentSemiMajorAxisAu)))
    missingInputs.push("parent host-star orbit");
  if (!Number.isFinite(positive(moonSemiMajorAxisKm))) missingInputs.push("moon semi-major axis");

  const laplaceKm = laplaceRadiusKm({
    parentJ2,
    parentRadiusKm,
    parentSemiMajorAxisAu,
    parentMassEarth,
    hostStarMassMsol,
    parentEccentricity,
  });
  const moonAxisKm = positive(moonSemiMajorAxisKm);
  const laplaceRatio =
    Number.isFinite(laplaceKm) && Number.isFinite(moonAxisKm) ? moonAxisKm / laplaceKm : NaN;
  const rates = j2PrecessionRates({
    parentJ2,
    parentRadiusKm,
    parentMassEarth,
    moonSemiMajorAxisKm,
    moonEccentricity,
    moonInclinationDeg,
  });
  const hasSpinState = !!moonSpinState && typeof moonSpinState === "object";
  const hasMoment = hasFiniteInput(momentOfInertiaFactor);
  const hasObliquity = hasFiniteInput(moonObliquityDeg);
  const cassiniReadinessClass =
    hasSpinState && hasMoment && hasObliquity && rates
      ? "parameter-ready"
      : hasSpinState && rates
        ? "scenario-ready"
        : "readiness-only";
  const confidence =
    missingInputs.length === 0 && hasMoment
      ? CONFIDENCE.MEDIUM
      : missingInputs.length <= 2
        ? CONFIDENCE.LOW
        : CONFIDENCE.UNKNOWN;
  const status =
    missingInputs.length >= 5
      ? CONTEXT_STATUS.UNKNOWN
      : missingInputs.length
        ? CONTEXT_STATUS.LIMITED
        : CONTEXT_STATUS.SUPPORTED;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      parentMassEarth: roundMaybe(parentMassEarth, 5),
      parentRadiusKm: roundMaybe(parentRadiusKm, 3),
      parentJ2: roundMaybe(parentJ2, 8),
      hostStarMassMsol: roundMaybe(hostStarMassMsol, 5),
      parentSemiMajorAxisAu: roundMaybe(parentSemiMajorAxisAu, 6),
      parentEccentricity: roundMaybe(parentEccentricity, 5),
      moonSemiMajorAxisKm: roundMaybe(moonSemiMajorAxisKm, 3),
      moonEccentricity: roundMaybe(moonEccentricity, 5),
      moonInclinationDeg: roundMaybe(moonInclinationDeg, 4),
      moonSpinState: moonSpinState?.state || moonSpinState?.ratio || null,
      moonObliquityDeg: roundMaybe(moonObliquityDeg, 4),
      momentOfInertiaFactor: roundMaybe(momentOfInertiaFactor, 5),
    },
    outputs: {
      laplaceRadiusKm: roundMaybe(laplaceKm, 3),
      moonDistanceToLaplaceRatio: roundMaybe(laplaceRatio, 5),
      laplaceRegimeClass: classifyLaplaceRatio(laplaceRatio),
      nodalPrecessionClass: classifyPrecession(rates?.nodalPeriodYears),
      apsidalPrecessionClass: classifyPrecession(rates?.apsidalPeriodYears),
      nodalPrecessionPeriodYears: roundMaybe(rates?.nodalPeriodYears, 3),
      apsidalPrecessionPeriodYears: roundMaybe(rates?.apsidalPeriodYears, 3),
      cassiniReadinessClass,
      obliquityStabilityClass:
        cassiniReadinessClass === "parameter-ready"
          ? "bounded-qualitative"
          : "insufficient-for-stability-solve",
    },
    assumptions: [
      "Laplace radius is a first-order low-eccentricity regime proxy.",
      "J2 precession rates are qualitative diagnostics unless stellar and spin-orbit coupling terms are also solved.",
      "Cassini-state output is readiness guidance without a full spin-axis integration.",
    ],
    limitingFactors: [
      ...missingInputs.map((input) => `Missing ${input}.`),
      ...(hasMoment ? [] : ["Missing moment of inertia factor for Cassini-state solving."]),
      ...(hasObliquity ? [] : ["Missing moon obliquity for Cassini-state solving."]),
    ],
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
