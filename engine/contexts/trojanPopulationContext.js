import { clamp, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "trojan-population-context-v1";
const SOURCE_KEYS = ["trojanPopulation"];
const MU_CRIT = (1 - Math.sqrt(69) / 9) / 2;

function positive(value, fallback = NaN) {
  const number = toFinite(value, fallback);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function perturbationPenalty(className) {
  const text = String(className || "").toLowerCase();
  if (text.includes("strong")) return 0.55;
  if (text.includes("moderate")) return 0.3;
  if (text.includes("weak")) return 0.12;
  return 0;
}

function classifyRegion({ stable, eccentricity, inclinationDeg, perturberPenalty }) {
  if (!stable) return "unstable";
  const e = clamp(toFinite(eccentricity, 0), 0, 0.99);
  const inc = Math.abs(toFinite(inclinationDeg, 0));
  const stress = clamp(e / 0.25 + inc / 45 + perturberPenalty, 0, 2);
  if (stress >= 1.15) return "eroded";
  if (stress >= 0.65) return "narrow";
  return "broad";
}

function classifyLikelihood({ stable, region, secondaryMassEarth, supplyEvidence }) {
  if (!stable) return "unstable";
  if (region === "eroded") return "unlikely";
  const mass = positive(secondaryMassEarth);
  if (supplyEvidence && Number.isFinite(mass) && mass >= 50 && region === "broad") return "rich";
  if (Number.isFinite(mass) && mass >= 50 && region === "broad") return "possible";
  if (supplyEvidence && region !== "eroded") return "possible";
  return "sparse";
}

export function buildTrojanPopulationContext({
  primaryMass = null,
  secondaryMass = null,
  secondaryMassEarth = null,
  eccentricity = 0,
  inclinationDeg = 0,
  neighboringPerturbationClass = "none",
  debrisReservoirClass = "unknown",
  migrationCaptureEvidence = false,
  snowLineAu = null,
  semiMajorAxisAu = null,
} = {}) {
  const primary = positive(primaryMass);
  const secondary = positive(secondaryMass);
  const mu =
    Number.isFinite(primary) && Number.isFinite(secondary)
      ? secondary / (primary + secondary)
      : NaN;
  const stable = Number.isFinite(mu) ? mu < MU_CRIT : false;
  const perturberPenalty = perturbationPenalty(neighboringPerturbationClass);
  const stabilityRegionClass = classifyRegion({
    stable,
    eccentricity,
    inclinationDeg,
    perturberPenalty,
  });
  const supplyEvidence =
    migrationCaptureEvidence === true ||
    ["rich", "strong", "debris-rich", "outer-reservoir"].includes(
      String(debrisReservoirClass || "").toLowerCase(),
    );
  const likelihood = classifyLikelihood({
    stable,
    region: stabilityRegionClass,
    secondaryMassEarth,
    supplyEvidence,
  });
  const orbit = positive(semiMajorAxisAu);
  const snow = positive(snowLineAu);
  const trojanCompositionClass =
    Number.isFinite(orbit) && Number.isFinite(snow)
      ? orbit >= snow
        ? "volatile-rich-possible"
        : "rocky-dry-biased"
      : "unknown";
  const confidence =
    Number.isFinite(mu) && stabilityRegionClass !== "eroded"
      ? CONFIDENCE.MEDIUM
      : Number.isFinite(mu)
        ? CONFIDENCE.LOW
        : CONFIDENCE.UNKNOWN;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status: Number.isFinite(mu) ? CONTEXT_STATUS.SUPPORTED : CONTEXT_STATUS.UNKNOWN,
    confidence,
    inputs: {
      primaryMass: roundMaybe(primary, 8),
      secondaryMass: roundMaybe(secondary, 8),
      secondaryMassEarth: roundMaybe(secondaryMassEarth, 5),
      eccentricity: roundMaybe(eccentricity, 5),
      inclinationDeg: roundMaybe(inclinationDeg, 4),
      neighboringPerturbationClass,
      debrisReservoirClass,
      migrationCaptureEvidence: migrationCaptureEvidence === true,
      snowLineAu: roundMaybe(snowLineAu, 4),
      semiMajorAxisAu: roundMaybe(semiMajorAxisAu, 6),
      muCritical: roundMaybe(MU_CRIT, 8),
    },
    outputs: {
      massParameterMu: roundMaybe(mu, 8),
      l45LinearStabilityClass: stable ? "linearly-stable" : "linearly-unstable",
      stabilityRegionClass,
      trojanPopulationLikelihood: likelihood,
      trojanReservoirClass:
        likelihood === "rich"
          ? "rich"
          : likelihood === "possible"
            ? "possible"
            : likelihood === "sparse"
              ? "sparse"
              : likelihood === "unstable"
                ? "unstable"
                : "none",
      trojanPopulationMassClass:
        likelihood === "rich"
          ? "large-reservoir-possible"
          : likelihood === "possible"
            ? "modest"
            : "minor-or-none",
      trojanCompositionClass,
      l4L5AsymmetryReadiness: supplyEvidence ? "scenario-ready" : "not-solved",
      captureHistoryClass: migrationCaptureEvidence ? "capture-plausible" : "supply-unknown",
      limitingPerturbers:
        perturberPenalty > 0
          ? [`Neighboring perturbation class: ${neighboringPerturbationClass}.`]
          : [],
    },
    assumptions: [
      "Linear L4/L5 stability is necessary but not sufficient for a Trojan population.",
      "Inclination, eccentricity, perturbers, and supply history modify reservoir likelihood.",
    ],
    limitingFactors: [
      ...(stable ? [] : ["Mass ratio exceeds the triangular-point stability threshold."]),
      ...(stabilityRegionClass === "eroded"
        ? ["Eccentricity, inclination, or neighboring perturbers shrink the stable region."]
        : []),
      ...(supplyEvidence
        ? []
        : ["No source/capture evidence is available for a populated Trojan reservoir."]),
    ],
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}

export { MU_CRIT };
