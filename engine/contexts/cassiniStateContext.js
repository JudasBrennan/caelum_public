import { clamp, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "cassini-state-context-v1";
const SOURCE_KEYS = ["cassiniState"];

function optionalNumber(value) {
  if (value == null || value === "") return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function positive(value, fallback = NaN) {
  const number = toFinite(value, fallback);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function degToRad(value) {
  return (toFinite(value, 0) * Math.PI) / 180;
}

export function buildCassiniStateContext({
  spinAxisPrecessionRateRadPerYear = null,
  orbitPrecessionRateRadPerYear = null,
  obliquityDeg = null,
  inclinationToLaplacePlaneDeg = null,
  momentOfInertiaFactor = null,
  spinPeriodHours = null,
  spinOrbitResonance = null,
  tidalDissipationKnown = false,
  equilibriumTolerance = 0.05,
} = {}) {
  const missingInputs = [];
  const alpha = optionalNumber(spinAxisPrecessionRateRadPerYear);
  const g = optionalNumber(orbitPrecessionRateRadPerYear);
  const epsilon = optionalNumber(obliquityDeg);
  const inclination = optionalNumber(inclinationToLaplacePlaneDeg);
  const moment = positive(momentOfInertiaFactor);
  const spinHours = positive(spinPeriodHours);
  if (!Number.isFinite(alpha)) missingInputs.push("spin-axis precession rate");
  if (!Number.isFinite(g)) missingInputs.push("orbital-plane precession rate");
  if (!Number.isFinite(epsilon)) missingInputs.push("obliquity");
  if (!Number.isFinite(inclination)) missingInputs.push("inclination to Laplace plane");
  if (!Number.isFinite(moment)) missingInputs.push("moment of inertia factor");
  if (!Number.isFinite(spinHours)) missingInputs.push("spin period");

  const hasRates = Number.isFinite(alpha) && Number.isFinite(g);
  const hasAngles = Number.isFinite(epsilon) && Number.isFinite(inclination);
  const cassiniReadinessClass =
    hasRates && hasAngles && Number.isFinite(moment) && Number.isFinite(spinHours)
      ? "parameter-ready"
      : hasRates && hasAngles
        ? "scenario-ready"
        : "readiness-only";
  const residual =
    cassiniReadinessClass === "parameter-ready"
      ? alpha * Math.cos(degToRad(epsilon)) * Math.sin(degToRad(epsilon)) +
        g * Math.sin(degToRad(epsilon - inclination))
      : NaN;
  const normalizedResidual = Number.isFinite(residual)
    ? Math.abs(residual) / Math.max(Math.abs(alpha) + Math.abs(g), 1e-12)
    : NaN;
  let cassiniScenarioClass = "insufficient-inputs";
  if (cassiniReadinessClass === "parameter-ready") {
    cassiniScenarioClass =
      normalizedResidual <= clamp(equilibriumTolerance, 0.001, 1)
        ? "equilibrium-consistent"
        : "parameter-ready-off-equilibrium";
  } else if (cassiniReadinessClass === "scenario-ready") {
    cassiniScenarioClass = "qualitative-scenario";
  }

  const obliquityTideRelevanceClass =
    Number.isFinite(epsilon) && Math.abs(epsilon) >= 10
      ? "potentially-relevant"
      : Number.isFinite(epsilon)
        ? "weak"
        : "unknown";
  const status =
    cassiniReadinessClass === "readiness-only" ? CONTEXT_STATUS.LIMITED : CONTEXT_STATUS.SUPPORTED;
  const confidence =
    cassiniReadinessClass === "parameter-ready"
      ? CONFIDENCE.MEDIUM
      : cassiniReadinessClass === "scenario-ready"
        ? CONFIDENCE.LOW
        : CONFIDENCE.UNKNOWN;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      spinAxisPrecessionRateRadPerYear: roundMaybe(alpha, 12),
      orbitPrecessionRateRadPerYear: roundMaybe(g, 12),
      obliquityDeg: roundMaybe(epsilon, 5),
      inclinationToLaplacePlaneDeg: roundMaybe(inclination, 5),
      momentOfInertiaFactor: roundMaybe(momentOfInertiaFactor, 6),
      spinPeriodHours: roundMaybe(spinPeriodHours, 6),
      spinOrbitResonance: spinOrbitResonance || null,
      tidalDissipationKnown: tidalDissipationKnown === true,
    },
    outputs: {
      cassiniReadinessClass,
      cassiniScenarioClass,
      obliquityStabilityClass:
        cassiniReadinessClass === "parameter-ready"
          ? "bounded-qualitative"
          : "insufficient-for-stability-solve",
      obliquityTideRelevanceClass,
      normalizedEquilibriumResidual: roundMaybe(normalizedResidual, 6),
      captureConfidence:
        tidalDissipationKnown === true && cassiniScenarioClass === "equilibrium-consistent"
          ? "bounded"
          : "not-solved",
      missingInputs,
    },
    assumptions: [
      "Cassini-state output is readiness and equilibrium screening, not a spin-axis integration.",
      "No named Cassini state is assigned without a parameter-ready equilibrium solve.",
      "Obliquity-tide relevance does not change tidal heating outputs in this release.",
    ],
    limitingFactors: [
      ...missingInputs.map((input) => `Missing ${input}.`),
      ...(tidalDissipationKnown ? [] : ["Tidal dissipation/capture history is not solved."]),
    ],
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
