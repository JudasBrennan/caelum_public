import { clamp, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "dynamical-variability-context-v1";
const SOURCE_KEYS = [
  "dynamicalVariability",
  "longTermDynamics",
  "secularDynamics",
  "precession",
  "cassiniState",
  "migrationHistory",
];

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function optionalNumber(value, fallback = NaN) {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function directOutputsOf(context) {
  const source = objectOrEmpty(context);
  return Object.keys(objectOrEmpty(source.outputs)).length ? source.outputs : source;
}

function rankClass(value, order) {
  return order.indexOf(String(value || "unknown"));
}

function maxByRank(values, order, fallback = "unknown") {
  let best = fallback;
  let bestRank = rankClass(best, order);
  for (const value of values) {
    const rank = rankClass(value, order);
    if (rank > bestRank) {
      best = value;
      bestRank = rank;
    }
  }
  return best;
}

function titleCase(value) {
  const text = String(value || "unknown").replace(/[-_]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function riskClassFromScore(score) {
  const value = clamp(toFinite(score, 0), 0, 1);
  if (value >= 0.7) return "high";
  if (value >= 0.38) return "moderate";
  if (value >= 0.2) return "low";
  return "minimal";
}

function scoreFromRank(value, map, fallback = 0) {
  return map[String(value || "").toLowerCase()] ?? fallback;
}

function confidenceRank(value) {
  return { high: 3, medium: 2, low: 1, unknown: 0 }[String(value || "unknown")] ?? 0;
}

function confidenceFromRank(rank) {
  if (rank >= 3) return CONFIDENCE.HIGH;
  if (rank >= 2) return CONFIDENCE.MEDIUM;
  if (rank >= 1) return CONFIDENCE.LOW;
  return CONFIDENCE.UNKNOWN;
}

function lowestConfidence(contexts = []) {
  const ranks = contexts
    .map((context) => String(context?.confidence || ""))
    .filter(Boolean)
    .map(confidenceRank);
  if (!ranks.length) return CONFIDENCE.UNKNOWN;
  return confidenceFromRank(Math.min(...ranks));
}

function eccentricitySeasonalScore(eccentricity) {
  const e = clamp(toFinite(eccentricity, 0), 0, 0.99);
  if (e >= 0.35) return 0.85;
  if (e >= 0.2) return 0.62;
  if (e >= 0.08) return 0.32;
  if (e >= 0.03) return 0.14;
  return 0.04;
}

function classifySeasonalStability({ eccentricity, eccentricityCycleRisk, obliquityRisk }) {
  const e = clamp(toFinite(eccentricity, 0), 0, 0.99);
  if (eccentricityCycleRisk === "high" || e >= 0.35) return "highly-variable";
  if (obliquityRisk === "high") return "obliquity-sensitive";
  if (eccentricityCycleRisk === "moderate" || e >= 0.12 || obliquityRisk === "moderate") {
    return "seasonally-variable";
  }
  return "stable";
}

function climateSensitivityScore(climateContext, habitabilityContext) {
  const climate = objectOrEmpty(climateContext);
  const habitability = objectOrEmpty(habitabilityContext);
  const climateState = String(
    climate.climateState || climate.outputs?.climateState || habitability.climateState || "",
  ).toLowerCase();
  const stability = optionalNumber(
    climate.stabilityMultiplier ?? climate.outputs?.stabilityMultiplier,
    NaN,
  );
  if (climateState.includes("runaway") || climateState.includes("collapse")) return 0.85;
  if (climateState.includes("snowball")) return 0.58;
  if (Number.isFinite(stability) && stability < 0.5) return 0.55;
  if (Number.isFinite(stability) && stability < 0.8) return 0.32;
  return 0.12;
}

function buildGuardrailMessages({
  bodyKind,
  eccentricity,
  eccentricityCycleRisk,
  obliquityRisk,
  seasonalStabilityClass,
  manualOverride,
}) {
  const messages = [];
  if (eccentricityCycleRisk === "high") {
    messages.push(
      "High eccentricity or secular forcing can produce large long-cycle insolation changes; review the orbit before accepting guided placement.",
    );
  } else if (eccentricityCycleRisk === "moderate") {
    messages.push(
      "Moderate eccentricity or secular forcing should be treated as a climate-variability caution in guided generation.",
    );
  }
  if (obliquityRisk === "high") {
    messages.push(
      "Obliquity stability is not bounded enough for a strong seasonal claim; keep this as a warning unless spin-axis inputs are supplied.",
    );
  }
  if (bodyKind === "moon" && seasonalStabilityClass !== "stable") {
    messages.push(
      "Moon tidal and eccentricity persistence should be interpreted with the orbital-variability caveat visible.",
    );
  }
  if (manualOverride) {
    messages.push(
      "Manual authored orbital values are protected; this context can warn but must not rewrite the orbit.",
    );
  }
  const e = clamp(toFinite(eccentricity, 0), 0, 0.99);
  if (e >= 0.5) {
    messages.push(
      "Very high eccentricity is outside the comfortable climate-cycle calibration range and should be reviewed manually.",
    );
  }
  return [...new Set(messages)];
}

export function buildDynamicalVariabilityContext({
  bodyId = "",
  bodyRef = "",
  bodyKind = "planet",
  longTermDynamicsContext = null,
  secularDynamicsContext = null,
  secularContext = null,
  precessionContext = null,
  cassiniStateContext = null,
  moonOrientationContext = null,
  migrationHistoryContext = null,
  eccentricity = null,
  orbitalEccentricity = null,
  inclinationDeg = null,
  orbitalInclinationDeg = null,
  climateContext = null,
  habitabilityContext = null,
  manualOverride = false,
  manualOrbitMode = false,
} = {}) {
  const longTerm = objectOrEmpty(longTermDynamicsContext);
  const secular = objectOrEmpty(
    secularDynamicsContext || secularContext || longTerm.secularContext,
  );
  const precession = objectOrEmpty(precessionContext || longTerm.precessionContext);
  const cassini = objectOrEmpty(cassiniStateContext || longTerm.cassiniStateContext);
  const moonOrientation = objectOrEmpty(moonOrientationContext || longTerm.moonOrientationContext);
  const migration = objectOrEmpty(migrationHistoryContext || longTerm.migrationHistoryContext);
  const secularOutputs = directOutputsOf(secular);
  const precessionOutputs = directOutputsOf(precession);
  const cassiniOutputs = directOutputsOf(cassini);
  const moonOutputs = directOutputsOf(moonOrientation);
  const migrationOutputs = directOutputsOf(migration);
  const e = clamp(toFinite(orbitalEccentricity ?? eccentricity, 0), 0, 0.99);
  const inclination = optionalNumber(orbitalInclinationDeg ?? inclinationDeg, NaN);
  const limitingFactors = [];
  const contextsForConfidence = [secular, precession, cassini, moonOrientation].filter(
    (context) => Object.keys(context).length && confidenceRank(context.confidence) > 0,
  );
  const fallbackConfidenceContexts = contextsForConfidence.length
    ? contextsForConfidence
    : [migration].filter(
        (context) => Object.keys(context).length && confidenceRank(context.confidence) > 0,
      );

  if (!Number.isFinite(inclination)) {
    limitingFactors.push("Inclination is missing, so obliquity and Kozai-Lidov confidence is low.");
  }
  if (!Object.keys(secularOutputs).length && String(bodyKind) !== "moon") {
    limitingFactors.push("Secular forcing context is unavailable for this body.");
  }
  if (!Object.keys(precessionOutputs).length && !Object.keys(moonOutputs).length) {
    limitingFactors.push("Precession or moon-orientation context is unavailable.");
  }

  const kozaiScore = scoreFromRank(
    secularOutputs.kozaiLidovClass,
    { likely: 0.82, possible: 0.55, "not-indicated": 0, unknown: 0.12 },
    0.12,
  );
  const secularScore = scoreFromRank(
    secularOutputs.secularForcingClass || longTerm.summary?.secularClass,
    { strong: 0.76, moderate: 0.46, weak: 0.18, minimal: 0.04, unknown: 0.12 },
    0.12,
  );
  const precessionScore = scoreFromRank(
    precessionOutputs.calendarEraDriftClass ||
      precessionOutputs.nodalPrecessionClass ||
      moonOutputs.nodalPrecessionClass,
    {
      "historical-era": 0.62,
      "calendar-era": 0.42,
      "geologic-era": 0.2,
      rapid: 0.42,
      moderate: 0.28,
      slow: 0.14,
      minimal: 0.04,
      "very-slow": 0.04,
      unknown: 0.12,
    },
    0.12,
  );
  const cassiniRiskScore = scoreFromRank(
    cassiniOutputs.obliquityStabilityClass || moonOutputs.obliquityStabilityClass,
    {
      "insufficient-for-stability-solve": 0.42,
      "bounded-qualitative": 0.08,
      unknown: 0.2,
    },
    0.18,
  );
  const obliquityDeg = optionalNumber(
    cassini.inputs?.obliquityDeg ??
      cassiniOutputs.obliquityDeg ??
      moonOrientation.inputs?.moonObliquityDeg,
    NaN,
  );
  const highObliquityScore = Number.isFinite(obliquityDeg)
    ? clamp(Math.max(Math.abs(obliquityDeg) - 25, 0) / 45, 0, 0.55)
    : 0.08;
  const climateScore = climateSensitivityScore(climateContext, habitabilityContext);
  const eccentricityScore = eccentricitySeasonalScore(e);

  const eccentricityCycleFloor =
    secularOutputs.kozaiLidovClass === "likely"
      ? 0.5
      : secularOutputs.kozaiLidovClass === "possible"
        ? 0.38
        : 0;
  const eccentricityCycleScore = Math.max(
    e >= 0.35 ? 0.72 : 0,
    eccentricityCycleFloor,
    clamp(
      0.44 * eccentricityScore + 0.34 * secularScore + 0.18 * kozaiScore + 0.04 * climateScore,
      0,
      1,
    ),
  );
  const obliquityScore = clamp(
    0.5 * cassiniRiskScore +
      0.24 * precessionScore +
      0.18 * highObliquityScore +
      0.08 * climateScore,
    0,
    1,
  );
  const eccentricityCycleRisk = riskClassFromScore(eccentricityCycleScore);
  const obliquityVariabilityRisk = riskClassFromScore(obliquityScore);
  const seasonalStabilityClass = classifySeasonalStability({
    eccentricity: e,
    eccentricityCycleRisk,
    obliquityRisk: obliquityVariabilityRisk,
  });
  const migrationEvidenceClass =
    migrationOutputs.migrationEvidenceClass || longTerm.migrationEvidenceClass || "unknown";
  const orbitHistoryConfidence =
    migrationEvidenceClass === "none"
      ? "low"
      : migration.confidence || longTerm.confidence || CONFIDENCE.UNKNOWN;
  const variabilityRisk = maxByRank(
    [eccentricityCycleRisk, obliquityVariabilityRisk],
    ["unknown", "minimal", "low", "moderate", "high"],
    "unknown",
  );
  const confidence =
    fallbackConfidenceContexts.length === 0
      ? CONFIDENCE.UNKNOWN
      : limitingFactors.length
        ? CONFIDENCE.LOW
        : lowestConfidence(fallbackConfidenceContexts);
  const status =
    confidence === CONFIDENCE.UNKNOWN
      ? CONTEXT_STATUS.UNKNOWN
      : confidence === CONFIDENCE.LOW
        ? CONTEXT_STATUS.LIMITED
        : CONTEXT_STATUS.SUPPORTED;
  let habitabilityVariabilityWarning = "none";
  if (variabilityRisk === "high") habitabilityVariabilityWarning = "high-orbital-variability";
  else if (variabilityRisk === "moderate") {
    habitabilityVariabilityWarning = "seasonal-variability-caution";
  } else if (confidence === CONFIDENCE.LOW || confidence === CONFIDENCE.UNKNOWN) {
    habitabilityVariabilityWarning = "low-confidence-diagnostic";
  }
  const persistenceModifier =
    confidenceRank(confidence) < confidenceRank(CONFIDENCE.MEDIUM)
      ? 1
      : variabilityRisk === "high"
        ? 0.82
        : variabilityRisk === "moderate"
          ? 0.9
          : variabilityRisk === "low"
            ? 0.96
            : 1;
  const generationGuardrailMessages = buildGuardrailMessages({
    bodyKind,
    eccentricity: e,
    eccentricityCycleRisk,
    obliquityRisk: obliquityVariabilityRisk,
    seasonalStabilityClass,
    manualOverride: manualOverride || manualOrbitMode,
  });
  const climateWarningMessages =
    habitabilityVariabilityWarning === "high-orbital-variability" ||
    habitabilityVariabilityWarning === "seasonal-variability-caution"
      ? [
          `${titleCase(seasonalStabilityClass)} orbit variability is diagnostic only; climate bands are not rewritten.`,
        ]
      : [];
  const tidalPersistenceCaveats =
    String(bodyKind || "") === "moon" &&
    (habitabilityVariabilityWarning === "high-orbital-variability" ||
      habitabilityVariabilityWarning === "seasonal-variability-caution")
      ? [
          "Long-cycle variability can change eccentricity forcing, so current tidal heating is not automatically permanent.",
        ]
      : [];

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      bodyId: String(bodyId || ""),
      bodyRef: String(bodyRef || ""),
      bodyKind: String(bodyKind || "planet"),
      eccentricity: roundMaybe(e, 5),
      inclinationDeg: roundMaybe(inclination, 4),
      manualOverrideProtected: manualOverride === true || manualOrbitMode === true,
      secularForcingClass:
        secularOutputs.secularForcingClass || longTerm.summary?.secularClass || "",
      kozaiLidovClass: secularOutputs.kozaiLidovClass || "",
      precessionClass:
        precessionOutputs.calendarEraDriftClass ||
        moonOutputs.nodalPrecessionClass ||
        longTerm.summary?.precessionClass ||
        "",
      cassiniReadinessClass:
        cassiniOutputs.cassiniReadinessClass ||
        moonOutputs.cassiniReadinessClass ||
        longTerm.summary?.cassiniReadinessClass ||
        "",
      migrationEvidenceClass,
    },
    outputs: {
      seasonalStabilityClass,
      obliquityVariabilityRisk,
      eccentricityCycleRisk,
      orbitHistoryConfidence,
      habitabilityVariabilityWarning,
      dynamicalVariabilityRiskClass: variabilityRisk,
      eccentricityCycleScore: roundMaybe(eccentricityCycleScore, 4),
      obliquityVariabilityScore: roundMaybe(obliquityScore, 4),
      persistenceModifier: roundMaybe(persistenceModifier, 4),
      generationGuardrailMessages,
      climateWarningMessages,
      tidalPersistenceCaveats,
    },
    assumptions: [
      "Long-cycle variability is diagnostic only and does not rewrite orbital elements.",
      "Kozai-Lidov, precession, and Cassini-state signals are treated as bounded warnings without N-body or spin-axis integration.",
      "Habitability persistence may use the modifier only when confidence is medium or high.",
    ],
    limitingFactors,
    notes: generationGuardrailMessages,
    sourceKeys: SOURCE_KEYS,
  });
}

export { MODEL_VERSION as DYNAMICAL_VARIABILITY_CONTEXT_MODEL_VERSION };
