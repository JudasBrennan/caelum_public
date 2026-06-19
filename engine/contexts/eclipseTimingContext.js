import { auToKilometers } from "../physics/orbital.js";
import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "eclipse-timing-context-v1";
const SOURCE_KEYS = ["eclipseTiming"];
const AU_KM = auToKilometers(1);
const SUN_RADIUS_KM = 695700;

function positive(value, fallback = NaN) {
  const number = toFinite(value, fallback);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function hasFinite(value) {
  if (value == null || value === "") return false;
  return Number.isFinite(Number(value));
}

function angularRadiusDeg(radiusKm, distanceKm) {
  const radius = positive(radiusKm);
  const distance = positive(distanceKm);
  if (!Number.isFinite(radius) || !Number.isFinite(distance)) return NaN;
  return (Math.atan(radius / distance) * 180) / Math.PI;
}

function classifyFrequency(inclinationDeg, angularToleranceDeg, nodeKnown) {
  const inclination = Math.abs(toFinite(inclinationDeg, 0));
  const tolerance = Math.max(0.01, toFinite(angularToleranceDeg, 0.25));
  if (inclination <= tolerance) return "frequent";
  if (inclination <= tolerance * 4) return nodeKnown ? "seasonal" : "possible-seasons";
  if (inclination <= tolerance * 12) return nodeKnown ? "rare-seasonal" : "low-confidence";
  return "unlikely";
}

function classifyDuration(parentAngularRadiusDeg, starAngularRadiusDeg, periodDays) {
  if (!Number.isFinite(parentAngularRadiusDeg) || !Number.isFinite(starAngularRadiusDeg)) {
    return "unknown";
  }
  const period = positive(periodDays);
  const sizeRatio = parentAngularRadiusDeg / Math.max(starAngularRadiusDeg, 1e-9);
  if (!Number.isFinite(period)) return sizeRatio >= 1 ? "possible" : "brief-or-partial";
  if (sizeRatio >= 3 && period >= 5) return "long";
  if (sizeRatio >= 1) return "moderate";
  return "brief-or-partial";
}

export function buildEclipseTimingContext({
  observerRef = null,
  hostStarRadiusRsol = 1,
  hostStarDistanceAu = 1,
  parentRadiusKm,
  moonRadiusKm,
  moonSemiMajorAxisKm,
  moonOrbitalPeriodDays,
  moonInclinationDeg,
  longitudeOfAscendingNodeDeg = null,
  referenceEpochDay = null,
} = {}) {
  const missingInputs = [];
  const assumptions = [
    "Eclipse timing readiness is geometric; no N-body integration or precession is solved.",
  ];
  const starRadiusKm = positive(hostStarRadiusRsol, 1) * SUN_RADIUS_KM;
  const starDistanceKm = positive(hostStarDistanceAu, 1) * AU_KM;
  const parentRadius = positive(parentRadiusKm);
  const moonRadius = positive(moonRadiusKm);
  const moonDistance = positive(moonSemiMajorAxisKm);
  const moonPeriod = positive(moonOrbitalPeriodDays);
  const inclination = toFinite(moonInclinationDeg, NaN);
  const nodeKnown = hasFinite(longitudeOfAscendingNodeDeg);
  const epochKnown = hasFinite(referenceEpochDay);

  if (!Number.isFinite(starRadiusKm)) missingInputs.push("host star radius");
  if (!Number.isFinite(starDistanceKm)) missingInputs.push("host star distance");
  if (!Number.isFinite(parentRadius)) missingInputs.push("parent radius");
  if (!Number.isFinite(moonRadius)) missingInputs.push("moon radius");
  if (!Number.isFinite(moonDistance)) missingInputs.push("moon semi-major axis");
  if (!Number.isFinite(moonPeriod)) missingInputs.push("moon orbital period");
  if (!Number.isFinite(inclination)) missingInputs.push("moon inclination");
  if (!nodeKnown) missingInputs.push("longitude of ascending node");
  if (!epochKnown) missingInputs.push("reference epoch");

  const starAngularRadiusDeg = angularRadiusDeg(starRadiusKm, starDistanceKm);
  const parentAngularRadiusDeg = angularRadiusDeg(parentRadius, moonDistance);
  const moonAngularRadiusDeg = angularRadiusDeg(moonRadius, moonDistance);
  const angularToleranceDeg =
    Number.isFinite(starAngularRadiusDeg) && Number.isFinite(parentAngularRadiusDeg)
      ? starAngularRadiusDeg + parentAngularRadiusDeg
      : NaN;
  const eclipsePhysicallyPossible =
    Number.isFinite(angularToleranceDeg) && Number.isFinite(inclination)
      ? Math.abs(inclination) <= Math.max(angularToleranceDeg * 12, 0.05)
      : false;
  const frequencyClass = Number.isFinite(inclination)
    ? classifyFrequency(inclination, angularToleranceDeg, nodeKnown)
    : "unknown";
  const scheduleReadinessClass =
    missingInputs.length === 0
      ? "schedule-ready"
      : nodeKnown && epochKnown
        ? "geometry-limited"
        : "not-schedule-ready";

  const status =
    missingInputs.length >= 7
      ? CONTEXT_STATUS.UNKNOWN
      : scheduleReadinessClass === "schedule-ready"
        ? CONTEXT_STATUS.SUPPORTED
        : CONTEXT_STATUS.LIMITED;
  const confidence =
    scheduleReadinessClass === "schedule-ready"
      ? CONFIDENCE.MEDIUM
      : nodeKnown || missingInputs.length <= 3
        ? CONFIDENCE.LOW
        : CONFIDENCE.UNKNOWN;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      observerKind: observerRef?.kind || null,
      observerId: observerRef?.id || null,
      hostStarRadiusRsol: roundMaybe(hostStarRadiusRsol, 4),
      hostStarDistanceAu: roundMaybe(hostStarDistanceAu, 6),
      parentRadiusKm: roundMaybe(parentRadius, 3),
      moonRadiusKm: roundMaybe(moonRadius, 3),
      moonSemiMajorAxisKm: roundMaybe(moonDistance, 3),
      moonOrbitalPeriodDays: roundMaybe(moonPeriod, 6),
      moonInclinationDeg: roundMaybe(inclination, 4),
      longitudeOfAscendingNodeDeg: hasFinite(longitudeOfAscendingNodeDeg)
        ? round(toFinite(longitudeOfAscendingNodeDeg, 0), 4)
        : null,
      referenceEpochDay: hasFinite(referenceEpochDay)
        ? round(toFinite(referenceEpochDay, 0), 4)
        : null,
    },
    outputs: {
      eclipsePhysicallyPossible,
      eclipseFrequencyClass: frequencyClass,
      solarEclipseDurationClass: classifyDuration(
        parentAngularRadiusDeg,
        starAngularRadiusDeg,
        moonPeriod,
      ),
      parentTransitLikelihood: eclipsePhysicallyPossible ? frequencyClass : "unlikely",
      nodeConfidence: nodeKnown ? "node-provided" : "node-missing",
      scheduleReadinessClass,
      starAngularRadiusDeg: roundMaybe(starAngularRadiusDeg, 5),
      parentAngularRadiusDeg: roundMaybe(parentAngularRadiusDeg, 5),
      moonAngularRadiusDeg: roundMaybe(moonAngularRadiusDeg, 5),
      alignmentToleranceDeg: roundMaybe(clamp(angularToleranceDeg, 0, 90), 5),
    },
    assumptions,
    limitingFactors: missingInputs.map((input) => `Missing ${input}.`),
    notes:
      scheduleReadinessClass === "schedule-ready"
        ? ["Node and epoch are present, so exact scheduling can be layered on this context."]
        : ["Correct phase alone is insufficient for eclipse dates; node and epoch are required."],
    sourceKeys: SOURCE_KEYS,
  });
}
