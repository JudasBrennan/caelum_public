import { auToKilometers } from "../physics/orbital.js";
import { clamp, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "precession-context-v1";
const SOURCE_KEYS = ["precession"];
const G = 6.6743e-11;
const C = 299792458;
const SOLAR_MASS_KG = 1.98847e30;
const EARTH_MASS_KG = 5.9722e24;
const SECONDS_PER_YEAR = 365.25 * 86400;
const SECONDS_PER_CENTURY = 100 * SECONDS_PER_YEAR;
const ARCSEC_PER_RAD = 206264.80624709636;

function positive(value, fallback = NaN) {
  const number = toFinite(value, fallback);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function optionalNumber(value) {
  if (value == null || value === "") return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function degToRad(deg) {
  return (toFinite(deg, 0) * Math.PI) / 180;
}

function massKg({ centralMassMsol, centralMassEarth }) {
  const solar = positive(centralMassMsol);
  if (Number.isFinite(solar)) return solar * SOLAR_MASS_KG;
  const earth = positive(centralMassEarth);
  if (Number.isFinite(earth)) return earth * EARTH_MASS_KG;
  return NaN;
}

function axisMeters({ semiMajorAxisAu, semiMajorAxisKm }) {
  const km = positive(semiMajorAxisKm);
  if (Number.isFinite(km)) return km * 1000;
  const au = positive(semiMajorAxisAu);
  if (Number.isFinite(au)) return auToKilometers(au) * 1000;
  return NaN;
}

function periodYearsFromRate(rateRadPerSec) {
  const rate = Math.abs(toFinite(rateRadPerSec, NaN));
  if (!(rate > 0)) return NaN;
  return (2 * Math.PI) / rate / SECONDS_PER_YEAR;
}

function classifyPeriod(periodYears) {
  const years = positive(periodYears);
  if (!Number.isFinite(years)) return "unknown";
  if (years < 100) return "rapid";
  if (years < 10000) return "moderate";
  if (years < 1000000) return "slow";
  return "very-slow";
}

function classifyRelativisticPrecession(arcsecPerCentury) {
  const value = Math.abs(toFinite(arcsecPerCentury, NaN));
  if (!Number.isFinite(value)) return "unknown";
  if (value >= 10) return "strong";
  if (value >= 1) return "detectable";
  if (value >= 0.1) return "weak";
  return "negligible";
}

function calendarEraClass(periods) {
  const finite = periods.filter((value) => Number.isFinite(value) && value > 0);
  if (!finite.length) return "unknown";
  const shortest = Math.min(...finite);
  if (shortest < 1000) return "historical-era";
  if (shortest < 100000) return "calendar-era";
  if (shortest < 10000000) return "geologic-era";
  return "minimal";
}

export function buildPrecessionContext({
  centralMassMsol = null,
  centralMassEarth = null,
  centralRadiusKm = null,
  semiMajorAxisAu = null,
  semiMajorAxisKm = null,
  eccentricity = 0,
  inclinationDeg = 0,
  j2 = null,
  spinPeriodHours = null,
  obliquityDeg = null,
  momentOfInertiaFactor = null,
  includeRelativistic = true,
} = {}) {
  const missingInputs = [];
  const centralMassKg = massKg({ centralMassMsol, centralMassEarth });
  const aM = axisMeters({ semiMajorAxisAu, semiMajorAxisKm });
  if (!Number.isFinite(centralMassKg)) missingInputs.push("central mass");
  if (!Number.isFinite(aM)) missingInputs.push("semi-major axis");
  const e = clamp(toFinite(eccentricity, 0), 0, 0.95);
  const n =
    Number.isFinite(centralMassKg) && Number.isFinite(aM)
      ? Math.sqrt((G * centralMassKg) / aM ** 3)
      : NaN;

  const centralRadius = positive(centralRadiusKm);
  const j2Value = positive(j2);
  const inclination = degToRad(inclinationDeg);
  let nodalRateRadSec = NaN;
  let apsidalRateRadSec = NaN;
  if (Number.isFinite(n) && Number.isFinite(centralRadius) && Number.isFinite(j2Value)) {
    const aKm = aM / 1000;
    const scale = (j2Value * n * (centralRadius / aKm) ** 2) / Math.max((1 - e * e) ** 2, 1e-9);
    nodalRateRadSec = -1.5 * scale * Math.cos(inclination);
    apsidalRateRadSec = 0.75 * scale * (5 * Math.cos(inclination) ** 2 - 1);
  }

  const grRateRadSec =
    includeRelativistic && Number.isFinite(n) && Number.isFinite(centralMassKg)
      ? (3 * n * G * centralMassKg) / (C ** 2 * aM * Math.max(1 - e * e, 1e-9))
      : NaN;
  const grArcsecPerCentury = Number.isFinite(grRateRadSec)
    ? grRateRadSec * SECONDS_PER_CENTURY * ARCSEC_PER_RAD
    : NaN;

  const spinHours = positive(spinPeriodHours);
  const moment = positive(momentOfInertiaFactor);
  const hasObliquity = Number.isFinite(optionalNumber(obliquityDeg));
  const spinAxisPrecessionReadiness =
    Number.isFinite(spinHours) &&
    Number.isFinite(moment) &&
    hasObliquity &&
    Number.isFinite(j2Value)
      ? "parameter-ready"
      : Number.isFinite(spinHours) && Number.isFinite(j2Value)
        ? "scenario-ready"
        : "readiness-only";
  if (!Number.isFinite(j2Value)) missingInputs.push("J2");
  if (!Number.isFinite(centralRadius)) missingInputs.push("central radius");
  if (!Number.isFinite(spinHours)) missingInputs.push("spin period");
  if (!Number.isFinite(moment)) missingInputs.push("moment of inertia factor");
  if (!hasObliquity) missingInputs.push("obliquity");

  const nodalPeriodYears = periodYearsFromRate(nodalRateRadSec);
  const apsidalPeriodYears = periodYearsFromRate(apsidalRateRadSec);
  const status =
    missingInputs.includes("central mass") || missingInputs.includes("semi-major axis")
      ? CONTEXT_STATUS.UNKNOWN
      : missingInputs.length
        ? CONTEXT_STATUS.LIMITED
        : CONTEXT_STATUS.SUPPORTED;
  const confidence =
    status === CONTEXT_STATUS.UNKNOWN
      ? CONFIDENCE.UNKNOWN
      : missingInputs.length
        ? CONFIDENCE.LOW
        : CONFIDENCE.MEDIUM;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      centralMassMsol: roundMaybe(centralMassMsol, 6),
      centralMassEarth: roundMaybe(centralMassEarth, 6),
      centralRadiusKm: roundMaybe(centralRadiusKm, 3),
      semiMajorAxisAu: roundMaybe(semiMajorAxisAu, 8),
      semiMajorAxisKm: roundMaybe(semiMajorAxisKm, 3),
      eccentricity: roundMaybe(e, 6),
      inclinationDeg: roundMaybe(inclinationDeg, 5),
      j2: roundMaybe(j2, 9),
      spinPeriodHours: roundMaybe(spinPeriodHours, 6),
      obliquityDeg: roundMaybe(obliquityDeg, 5),
      momentOfInertiaFactor: roundMaybe(momentOfInertiaFactor, 6),
    },
    outputs: {
      nodalPrecessionClass: classifyPeriod(nodalPeriodYears),
      apsidalPrecessionClass: classifyPeriod(apsidalPeriodYears),
      nodalPrecessionPeriodYears: roundMaybe(nodalPeriodYears, 3),
      apsidalPrecessionPeriodYears: roundMaybe(apsidalPeriodYears, 3),
      nodalRateRadSec: roundMaybe(nodalRateRadSec, 16),
      apsidalRateRadSec: roundMaybe(apsidalRateRadSec, 16),
      relativisticPrecessionClass: classifyRelativisticPrecession(grArcsecPerCentury),
      relativisticPrecessionArcsecPerCentury: roundMaybe(grArcsecPerCentury, 4),
      spinAxisPrecessionReadiness,
      calendarEraDriftClass: calendarEraClass([nodalPeriodYears, apsidalPeriodYears]),
      climateCycleCaution:
        calendarEraClass([nodalPeriodYears, apsidalPeriodYears]) === "unknown"
          ? "insufficient-inputs"
          : "diagnostic-only",
      missingInputs,
    },
    assumptions: [
      "J2 precession is a first-order oblateness proxy, not a full secular solution.",
      "Relativistic periapsis precession is reported as a diagnostic term only.",
      "Calendar and climate outputs must not be changed by these long-cycle proxies.",
    ],
    limitingFactors: missingInputs.map((input) => `Missing ${input}.`),
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}

export { ARCSEC_PER_RAD, SECONDS_PER_CENTURY };
