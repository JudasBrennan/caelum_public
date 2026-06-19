import { clamp, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "secular-dynamics-context-v1";
const SOURCE_KEYS = ["secularDynamics"];
const KOZAI_CRITICAL_INCLINATION_DEG = 39.23152048359225;

function positive(value, fallback = NaN) {
  const number = toFinite(value, fallback);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function optionalNumber(value) {
  if (value == null || value === "") return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function hasInclination(value) {
  return Number.isFinite(optionalNumber(value));
}

function hostFrameLooksHierarchical(hostFrameKind) {
  const text = String(hostFrameKind || "").toLowerCase();
  return (
    text.includes("binary") ||
    text.includes("pair") ||
    text.includes("s-type") ||
    text.includes("p-type") ||
    text.includes("hierarchical")
  );
}

function classifyHierarchy({ hierarchyRatio, innerSemiMajorAxisAu, outerSemiMajorAxisAu }) {
  const ratio = positive(hierarchyRatio);
  const inferredRatio =
    Number.isFinite(ratio) && ratio > 0
      ? ratio
      : positive(outerSemiMajorAxisAu) / positive(innerSemiMajorAxisAu);
  if (!Number.isFinite(inferredRatio)) return "unknown";
  if (inferredRatio < 3) return "not-hierarchical";
  if (inferredRatio < 5) return "weak-hierarchy";
  return "hierarchical";
}

function classifyKozaiTimescale(years, systemAgeGyr) {
  const timescale = positive(years);
  if (!Number.isFinite(timescale)) return "unknown";
  if (timescale < 1e5) return "short";
  if (timescale < 1e8) return "system-relevant";
  const ageYears = positive(systemAgeGyr) * 1e9;
  if (Number.isFinite(ageYears) && timescale > ageYears) return "longer-than-age";
  return "geologic-long";
}

function classifyOctupole(epsilonOct) {
  const value = Math.abs(toFinite(epsilonOct, NaN));
  if (!Number.isFinite(value)) return "unknown";
  if (value >= 0.05) return "strong";
  if (value >= 0.01) return "moderate";
  if (value >= 0.001) return "weak";
  return "minimal";
}

function classifySecularForcing({ kozaiClass, spacingStress, eccentricity }) {
  const e = clamp(toFinite(eccentricity, 0), 0, 0.99);
  const spacing = clamp(toFinite(spacingStress, 0), 0, 1);
  const kozaiScore =
    kozaiClass === "likely"
      ? 0.55
      : kozaiClass === "possible"
        ? 0.35
        : kozaiClass === "unknown"
          ? 0.1
          : 0;
  const score = clamp(0.45 * spacing + 0.25 * e + kozaiScore, 0, 1);
  if (score >= 0.72) return "strong";
  if (score >= 0.38) return "moderate";
  if (score >= 0.12) return "weak";
  return "minimal";
}

export function buildSecularDynamicsContext({
  hostFrameKind = "single",
  companionSeparationAu = null,
  innerSemiMajorAxisAu = null,
  outerSemiMajorAxisAu = null,
  innerOrbitalPeriodDays = null,
  outerOrbitalPeriodDays = null,
  innerMass = null,
  outerMass = null,
  perturberMass = null,
  totalMass = null,
  eccentricity = 0,
  outerEccentricity = 0,
  mutualInclinationDeg = null,
  inclinationDeg = null,
  adjacentSpacingMutualHill = null,
  hierarchyRatio = null,
  systemAgeGyr = null,
} = {}) {
  const limitingFactors = [];
  const assumptions = ["Secular outputs are susceptibility diagnostics, not orbital integrations."];
  const inclinationInput = hasInclination(mutualInclinationDeg)
    ? mutualInclinationDeg
    : hasInclination(inclinationDeg)
      ? inclinationDeg
      : null;
  const inclination = Math.abs(optionalNumber(inclinationInput));
  const inclinationProvided = Number.isFinite(inclination);
  const hierarchicalByKind = hostFrameLooksHierarchical(hostFrameKind);
  const outerAxis = positive(outerSemiMajorAxisAu, positive(companionSeparationAu));
  const hierarchyClass = classifyHierarchy({
    hierarchyRatio,
    innerSemiMajorAxisAu,
    outerSemiMajorAxisAu: outerAxis,
  });
  const hierarchyEligible =
    hierarchicalByKind || hierarchyClass === "hierarchical" || hierarchyClass === "weak-hierarchy";
  const hierarchySafe =
    hierarchyClass === "hierarchical" || (hierarchicalByKind && hierarchyClass === "unknown");
  const eOuter = clamp(toFinite(outerEccentricity, 0), 0, 0.95);
  const innerPeriodYears = positive(innerOrbitalPeriodDays) / 365.25;
  const outerPeriodYears = positive(outerOrbitalPeriodDays) / 365.25;
  const mPerturber = positive(perturberMass, positive(outerMass));
  const mTotal = positive(totalMass, positive(innerMass) + positive(outerMass));

  if (!inclinationProvided) {
    limitingFactors.push("Mutual inclination is missing, so Kozai-Lidov confidence is low.");
  }
  if (!hierarchyEligible) {
    limitingFactors.push(
      "No hierarchical perturber is indicated, so Kozai-Lidov formulas are not applied.",
    );
  }
  if (hierarchyClass === "weak-hierarchy") {
    limitingFactors.push("Hierarchy is weak, so secular diagnostics are lower confidence.");
  }
  if (
    hierarchicalByKind &&
    !Number.isFinite(positive(companionSeparationAu)) &&
    !Number.isFinite(outerAxis)
  ) {
    limitingFactors.push(
      "Companion separation is missing, so secular timescale confidence is low.",
    );
  }

  let kozaiTimescaleYears = NaN;
  if (
    hierarchySafe &&
    Number.isFinite(innerPeriodYears) &&
    Number.isFinite(outerPeriodYears) &&
    Number.isFinite(mPerturber) &&
    Number.isFinite(mTotal)
  ) {
    kozaiTimescaleYears =
      (8 / (15 * Math.PI)) *
      (mTotal / mPerturber) *
      ((outerPeriodYears * outerPeriodYears) / innerPeriodYears) *
      Math.max(0.001, 1 - eOuter * eOuter) ** 1.5;
  }

  const kozaiGatePassed = inclinationProvided && inclination >= KOZAI_CRITICAL_INCLINATION_DEG;
  let kozaiLidovClass = "unknown";
  if (!inclinationProvided) kozaiLidovClass = "unknown";
  else if (!hierarchyEligible || !hierarchySafe) kozaiLidovClass = "not-indicated";
  else if (kozaiGatePassed && hierarchyClass !== "weak-hierarchy") kozaiLidovClass = "likely";
  else if (kozaiGatePassed) kozaiLidovClass = "possible";
  else kozaiLidovClass = "not-indicated";

  const aIn = positive(innerSemiMajorAxisAu);
  const aOut = positive(outerAxis);
  const epsilonOct =
    Number.isFinite(aIn) &&
    Number.isFinite(aOut) &&
    Number.isFinite(positive(innerMass)) &&
    Number.isFinite(positive(outerMass))
      ? (aIn / aOut) *
        (eOuter / Math.max(1e-6, 1 - eOuter * eOuter)) *
        (Math.abs(positive(innerMass) - positive(outerMass)) /
          Math.max(positive(innerMass) + positive(outerMass), 1e-9))
      : NaN;
  const spacing = Number(adjacentSpacingMutualHill);
  const spacingStress = Number.isFinite(spacing) ? clamp((8 - spacing) / 8, 0, 1) : 0;
  const secularForcingClass = classifySecularForcing({
    kozaiClass: kozaiLidovClass,
    spacingStress,
    eccentricity,
  });
  const confidence =
    !inclinationProvided || limitingFactors.length
      ? CONFIDENCE.LOW
      : kozaiLidovClass === "likely" || secularForcingClass !== "minimal"
        ? CONFIDENCE.MEDIUM
        : CONFIDENCE.HIGH;
  const status =
    !hierarchyEligible && !Number.isFinite(spacing)
      ? CONTEXT_STATUS.LIMITED
      : limitingFactors.length
        ? CONTEXT_STATUS.LIMITED
        : CONTEXT_STATUS.SUPPORTED;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      hostFrameKind,
      companionSeparationAu: roundMaybe(companionSeparationAu, 6),
      innerSemiMajorAxisAu: roundMaybe(innerSemiMajorAxisAu, 6),
      outerSemiMajorAxisAu: roundMaybe(outerAxis, 6),
      innerOrbitalPeriodDays: roundMaybe(innerOrbitalPeriodDays, 6),
      outerOrbitalPeriodDays: roundMaybe(outerOrbitalPeriodDays, 6),
      eccentricity: roundMaybe(eccentricity, 5),
      outerEccentricity: roundMaybe(eOuter, 5),
      mutualInclinationDeg: roundMaybe(inclination, 4),
      adjacentSpacingMutualHill: roundMaybe(adjacentSpacingMutualHill, 4),
      hierarchyRatio: roundMaybe(hierarchyRatio, 4),
      kozaiCriticalInclinationDeg: roundMaybe(KOZAI_CRITICAL_INCLINATION_DEG, 4),
    },
    outputs: {
      hierarchyClass,
      kozaiLidovClass,
      kozaiSusceptibilityClass:
        kozaiLidovClass === "likely"
          ? "high-susceptibility"
          : kozaiLidovClass === "possible"
            ? "possible"
            : kozaiLidovClass === "not-indicated"
              ? "not-indicated"
              : "unknown",
      kozaiTimescaleYears: roundMaybe(kozaiTimescaleYears, 3),
      kozaiTimescaleClass: classifyKozaiTimescale(kozaiTimescaleYears, systemAgeGyr),
      octupoleParameter: roundMaybe(epsilonOct, 6),
      octupoleRelevanceClass: classifyOctupole(epsilonOct),
      secularForcingClass,
      mutualInclinationConfidence: inclinationProvided ? "provided" : "missing",
      laplacePlaneGuidanceClass:
        inclinationProvided && inclination > 20 && hierarchyEligible
          ? "needs-explicit-guidance"
          : inclinationProvided
            ? "coplanar-default-acceptable"
            : "unknown",
      repairSuggestions:
        secularForcingClass === "strong"
          ? [
              "Reduce mutual inclination/eccentricity or move the body farther from perturbing companions.",
            ]
          : [],
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}

export { KOZAI_CRITICAL_INCLINATION_DEG };
