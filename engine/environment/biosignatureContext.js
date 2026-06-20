import { clamp, round, toFinite } from "../utils.js";

const MODEL_VERSION = "biosignature-context-v1";
const KNOWN_GASES = ["o2", "o3", "co2", "ch4", "co", "h2", "nh3", "h2o", "n2", "so2"];

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function logRangeScore(value, lower, upper) {
  const number = finiteNonNegative(value, 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const low = Math.log10(Math.max(lower, 1e-12));
  const high = Math.log10(Math.max(upper, lower * 1.0001));
  return clamp((Math.log10(Math.max(number, 1e-12)) - low) / (high - low), 0, 1);
}

function classFromScore(score, labels = ["Low", "Moderate", "High"]) {
  if (score >= 0.66) return labels[2];
  if (score >= 0.33) return labels[1];
  return labels[0];
}

function confidenceRank(value) {
  return { unsupported: 0, low: 1, medium: 2, high: 3 }[String(value || "").toLowerCase()] ?? 1;
}

function confidenceFromInputs({
  photochemistry,
  atmosphereLedger,
  carbonCycleContext,
  oceanChemistryContext,
  nitrogenCycleContext,
}) {
  const rank = Math.max(
    photochemistry ? 2 : 1,
    confidenceRank(atmosphereLedger?.confidence),
    confidenceRank(carbonCycleContext?.confidence),
    confidenceRank(oceanChemistryContext?.confidence),
    confidenceRank(nitrogenCycleContext?.confidence),
  );
  if (rank >= 3 && photochemistry && atmosphereLedger) return "high";
  if (rank >= 2 || atmosphereLedger || oceanChemistryContext || nitrogenCycleContext)
    return "medium";
  return "low";
}

function exosphereAbioticOxygenScore(surfaceBoundaryExosphere = null) {
  const exosphere =
    surfaceBoundaryExosphere && typeof surfaceBoundaryExosphere === "object"
      ? surfaceBoundaryExosphere
      : null;
  if (!exosphere?.abioticOxygenSource) return 0;
  if (String(exosphere.retainedAtmosphereCoupling || "") !== "exosphere-only") return 0;
  const confidenceBoost =
    confidenceRank(exosphere.oxygenProductionConfidence || exosphere.confidence) / 3;
  const supportScore = fraction(exosphere.supportScore, 0);
  const productionScore = logRangeScore(exosphere.oxygenProductionKgS, 0.1, 12);
  return round(
    clamp(0.32 + 0.18 * supportScore + 0.14 * productionScore + 0.12 * confidenceBoost, 0, 0.64),
    3,
  );
}

function normalizeComposition({ composition = {}, pressureAtm = 0 } = {}) {
  const raw = composition && typeof composition === "object" ? composition : {};
  const pressure = finiteNonNegative(pressureAtm, 0);
  const values = {};
  let sum = 0;
  for (const gas of KNOWN_GASES) {
    const value = finiteNonNegative(raw[gas], 0);
    values[gas] = value;
    sum += value;
  }

  if (sum <= 0 || pressure <= 0) {
    return Object.fromEntries(KNOWN_GASES.map((gas) => [gas, 0]));
  }

  const looksLikePercent = sum > 1.5 && sum <= 150;
  const looksLikeFraction = sum <= 1.25 && (pressure > 1.25 || sum > pressure * 1.5);
  const looksLikePartial =
    pressure > 0 && Math.abs(sum - pressure) <= Math.max(0.05, pressure * 0.45);

  const partialPressures = {};
  for (const gas of KNOWN_GASES) {
    if (looksLikePartial) {
      partialPressures[gas] = values[gas];
    } else if (looksLikePercent) {
      partialPressures[gas] = (values[gas] / 100) * pressure;
    } else if (looksLikeFraction && !looksLikePartial) {
      partialPressures[gas] = values[gas] * pressure;
    } else {
      partialPressures[gas] = values[gas];
    }
  }
  return partialPressures;
}

function warningCodes(photochemistry = {}) {
  return Array.isArray(photochemistry?.warningCodes) ? photochemistry.warningCodes : [];
}

function disequilibriumScore({ partials, photochemistry }) {
  const warnings = new Set(warningCodes(photochemistry));
  let score = 0;
  if (warnings.has("o2_ch4_disequilibrium")) score = Math.max(score, 0.92);
  if (warnings.has("o2_h2_disequilibrium")) score = Math.max(score, 0.78);
  if (warnings.has("o2_nh3_disequilibrium")) score = Math.max(score, 0.82);
  if (partials.o2 >= 0.05 && partials.ch4 >= 1e-4) score = Math.max(score, 0.9);
  if (partials.o2 >= 0.05 && partials.h2 >= 1e-3) score = Math.max(score, 0.72);
  if (partials.o2 >= 0.05 && partials.nh3 >= 1e-5) score = Math.max(score, 0.78);
  if (partials.o2 >= 0.01 && partials.ch4 >= 1e-5) score = Math.max(score, 0.48);
  if (partials.ch4 >= 1e-3 && partials.co2 >= 0.01 && partials.o2 < 0.01) {
    score = Math.max(score, 0.36);
  }
  return round(clamp(score, 0, 1), 3);
}

function replenishmentDemandScore({ partials, disequilibrium, atmosphereLedger, photochemistry }) {
  const sinkIndex = fraction(atmosphereLedger?.sinkIndex, 0);
  const sourceIndex = fraction(atmosphereLedger?.sourceIndex, 0);
  const ledgerDemand = clamp(sinkIndex - sourceIndex + 0.25, 0, 1);
  const haze =
    photochemistry?.haze && typeof photochemistry.haze === "object" ? photochemistry.haze : {};
  const reactiveGasDemand = clamp(
    0.45 * logRangeScore(partials.ch4, 1e-5, 1e-2) +
      0.25 * logRangeScore(partials.h2, 1e-4, 1e-1) +
      0.2 * logRangeScore(partials.nh3, 1e-6, 1e-3) +
      0.1 * fraction(haze.likelihoodScore, 0),
    0,
    1,
  );
  return round(clamp(Math.max(disequilibrium, ledgerDemand, reactiveGasDemand), 0, 1), 3);
}

function o2FalsePositiveScore({
  partials,
  hydrosphere,
  environmentForcing,
  stellarHistoryDoseContext,
  planetRadiationEnvironmentContext,
  atmosphereLedger,
  atmosphereEvolutionContext,
  oceanChemistryContext,
  photochemistry,
}) {
  const o2Score = Math.max(
    logRangeScore(partials.o2, 0.01, 0.2),
    logRangeScore(photochemistry?.ozoneEarthRatio, 0.1, 1),
  );
  if (o2Score <= 0) return 0;

  const surfaceLiquid = Math.max(
    fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0),
    fraction(hydrosphere?.liquidOceanFraction, 0),
  );
  const dryScore = clamp(
    1 - surfaceLiquid - 0.35 * fraction(hydrosphere?.permanentIceFraction, 0),
    0,
    1,
  );
  const xuvRatio = finiteNonNegative(
    environmentForcing?.flux?.xuvEarthAtOrbit,
    finiteNonNegative(photochemistry?.xuvFluxRatio, 1),
  );
  const xuvScore = logRangeScore(xuvRatio, 1, 30);
  const lossIds = new Set([
    String(atmosphereLedger?.dominantSink?.id || ""),
    ...(Array.isArray(atmosphereLedger?.sinkTerms)
      ? atmosphereLedger.sinkTerms.filter((term) => term?.score >= 0.35).map((term) => term.id)
      : []),
  ]);
  const waterLossScore = lossIds.has("photolysis_h_escape") || lossIds.has("xuv_escape") ? 0.55 : 0;
  const atmosphereEvolutionText = [
    atmosphereEvolutionContext?.volatileLossRiskClass,
    atmosphereEvolutionContext?.compositionStabilityClass,
    atmosphereEvolutionContext?.dominantGasTendency,
  ]
    .join(" ")
    .toLowerCase();
  const evolutionLossScore =
    atmosphereEvolutionText.includes("high volatile") ||
    atmosphereEvolutionText.includes("photolysis") ||
    atmosphereEvolutionText.includes("loss tendency")
      ? 0.3
      : atmosphereEvolutionText.includes("moderate volatile")
        ? 0.14
        : 0;
  const historyOutputs =
    stellarHistoryDoseContext && typeof stellarHistoryDoseContext === "object"
      ? stellarHistoryDoseContext.outputs || stellarHistoryDoseContext
      : {};
  const historyAbioticOxygenScore = fraction(historyOutputs.abioticOxygenRiskScore, 0);
  const historyWaterLossScore = fraction(historyOutputs.waterLossRiskScore, 0);
  const planetRadiationOutputs =
    planetRadiationEnvironmentContext && typeof planetRadiationEnvironmentContext === "object"
      ? planetRadiationEnvironmentContext.outputs || {}
      : {};
  const uvRadiationScore = fraction(planetRadiationOutputs.uvSurfaceHazardScore, 0);
  const oceanBuffer = oceanChemistryContext?.liquidContext ? 0.28 : 0;
  const carbonBuffer =
    String(oceanChemistryContext?.carbonateSaturationClass || "").includes("supported") ||
    String(oceanChemistryContext?.acidityClass || "").includes("Buffered")
      ? 0.18
      : 0;
  return round(
    clamp(
      o2Score * (0.25 + 0.35 * dryScore + 0.25 * xuvScore + waterLossScore) -
        oceanBuffer -
        carbonBuffer +
        evolutionLossScore +
        0.35 * historyAbioticOxygenScore +
        0.15 * historyWaterLossScore +
        0.15 * uvRadiationScore,
      0,
      1,
    ),
    3,
  );
}

function methaneContext({ partials, photochemistry, carbonCycleContext, oceanChemistryContext }) {
  if (partials.ch4 < 1e-6) {
    return {
      label: "No methane signal",
      score: 0,
      notes: [],
    };
  }
  const haze =
    photochemistry?.haze && typeof photochemistry.haze === "object" ? photochemistry.haze : {};
  const anoxic = partials.o2 < 0.01;
  const methaneRich = partials.ch4 >= 1e-4;
  const reducedMantle =
    /reduced|h2|co/i.test(String(carbonCycleContext?.redoxContext || "")) ||
    /outgassing|volcanic|cryo/i.test(String(carbonCycleContext?.tendencyClass || ""));
  const hydrothermal = fraction(oceanChemistryContext?.hydrothermalSupportScore, 0) >= 0.35;
  const notes = [];
  if (fraction(haze.likelihoodScore, 0) > 0.2 || /haze/i.test(String(haze.hazeClass || ""))) {
    notes.push("Methane-rich anoxic air can generate organic haze.");
  }
  if (reducedMantle || hydrothermal) {
    notes.push("Geologic or hydrothermal methane sources are plausible in this context.");
  }
  if (partials.o2 >= 0.05 && methaneRich) {
    return {
      label: "O2-CH4 source-demand context",
      score: 0.9,
      notes: [...notes, "Oxygen and methane together require continuous replenishment."],
    };
  }
  if (
    anoxic &&
    methaneRich &&
    (fraction(haze.likelihoodScore, 0) > 0.2 || /haze/i.test(String(haze.hazeClass || "")))
  ) {
    return {
      label: "Methane-rich anoxic haze context",
      score: 0.72,
      notes,
    };
  }
  if (methaneRich) {
    return {
      label: "Methane source ambiguity",
      score: 0.55,
      notes: notes.length
        ? notes
        : ["Methane is context-dependent and not life-positive by itself."],
    };
  }
  return {
    label: "Trace methane context",
    score: 0.25,
    notes,
  };
}

function coBuildupScore({ partials, photochemistry }) {
  const prebioticClass = String(photochemistry?.prebioticUv?.class || "").toLowerCase();
  const uvStarved =
    prebioticClass.includes("starved") ||
    finiteNonNegative(photochemistry?.prebioticUv?.topOfAtmosphereFluxErgCm2S, 1) < 0.2;
  const explicitCoScore = logRangeScore(partials.co, 1e-5, 1e-2);
  const lowUvHighCo2Score = uvStarved ? logRangeScore(partials.co2, 0.005, 0.5) * 0.75 : 0;
  return round(clamp(Math.max(explicitCoScore, lowUvHighCo2Score), 0, 1), 3);
}

function interpretation({ disequilibrium, falsePositive, methane, coRisk, partials }) {
  if (falsePositive >= 0.66) return "Abiotic oxygen false-positive caution";
  if (disequilibrium >= 0.66) return "Strong disequilibrium; source required";
  if (methane.score >= 0.66) return "Methane/haze context";
  if (coRisk >= 0.66) return "CO buildup false-positive caution";
  if (partials.o2 + partials.ch4 + partials.co <= 0 && coRisk < 0.33) {
    return "No atmospheric biosignature context";
  }
  if (disequilibrium >= 0.33 || falsePositive >= 0.33 || coRisk >= 0.33) {
    return "Ambiguous biosignature context";
  }
  if (partials.o2 >= 0.05 || partials.ch4 >= 1e-6) return "Context-dependent biosignature gases";
  return "Weak atmospheric biosignature context";
}

function buildNotes({
  falsePositive,
  methane,
  coRisk,
  disequilibrium,
  atmosphereEvolutionContext,
  stellarHistoryDoseContext,
  planetRadiationEnvironmentContext,
  nitrogenCycleContext,
  surfaceBoundaryExosphere,
}) {
  const notes = [
    "Biosignature context never asserts life; it reports source demand and false-positive risk.",
  ];
  if (disequilibrium >= 0.66) {
    notes.push("Strong disequilibrium means a source is required, not that biology is identified.");
  }
  if (falsePositive >= 0.33) {
    notes.push("O2/O3 interpretation is caveated by water loss, UV/XUV, and redox context.");
  }
  if (coRisk >= 0.33) {
    notes.push("Low-UV, high-CO2 atmospheres can accumulate CO without biology.");
  }
  if (
    /loss|photolysis|escape/i.test(String(atmosphereEvolutionContext?.dominantGasTendency || ""))
  ) {
    notes.push("Atmosphere-evolution tendency adds an escape/loss caveat to gas interpretation.");
  }
  const historyOutputs =
    stellarHistoryDoseContext && typeof stellarHistoryDoseContext === "object"
      ? stellarHistoryDoseContext.outputs || stellarHistoryDoseContext
      : {};
  if (fraction(historyOutputs.abioticOxygenRiskScore, 0) >= 0.42) {
    notes.push("Stellar-history dose adds an abiotic oxygen false-positive caveat.");
  }
  const planetRadiationOutputs =
    planetRadiationEnvironmentContext && typeof planetRadiationEnvironmentContext === "object"
      ? planetRadiationEnvironmentContext.outputs || {}
      : {};
  if (fraction(planetRadiationOutputs.uvSurfaceHazardScore, 0) >= 0.42) {
    notes.push("Planet radiation context adds a UV-driven interpretation caveat.");
  }
  const nitrogenOutputs =
    nitrogenCycleContext && typeof nitrogenCycleContext === "object"
      ? nitrogenCycleContext.outputs || nitrogenCycleContext
      : {};
  if (/severe|strong/i.test(String(nitrogenOutputs.nutrientLimitationClass || ""))) {
    notes.push(
      "Nitrogen context adds a nutrient-limitation caveat to biosignature interpretation.",
    );
  }
  if (/massive|strong/i.test(String(nitrogenOutputs.n2ReservoirClass || ""))) {
    if (/poor|limited|severe/i.test(String(nitrogenOutputs.fixedNitrogenAvailabilityClass || ""))) {
      notes.push("A large N2 reservoir is not treated as Earth-like fixed nitrogen availability.");
    }
  }
  if (exosphereAbioticOxygenScore(surfaceBoundaryExosphere) > 0) {
    notes.push(
      "Icy-moon exosphere O2 is abiotic and exosphere-only; it is not breathable air or life evidence.",
    );
  }
  notes.push(...methane.notes);
  return [...new Set(notes)];
}

export function computeBiosignatureContext({
  pressureAtm = 0,
  composition = {},
  photochemistry = null,
  atmosphereLedger = null,
  atmosphereEvolutionContext = null,
  stellarHistoryDoseContext = null,
  planetRadiationEnvironmentContext = null,
  carbonCycleContext = null,
  oceanChemistryContext = null,
  nitrogenCycleContext = null,
  environmentForcing = null,
  hydrosphere = null,
  surfaceBoundaryExosphere = null,
} = {}) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  const partials = normalizeComposition({ composition, pressureAtm: pressure });
  const disequilibrium = disequilibriumScore({ partials, photochemistry });
  const replenishmentDemand = replenishmentDemandScore({
    partials,
    disequilibrium,
    atmosphereLedger,
    photochemistry,
  });
  const exosphereAbioticScore = exosphereAbioticOxygenScore(surfaceBoundaryExosphere);
  const falsePositive = Math.max(
    o2FalsePositiveScore({
      partials,
      hydrosphere,
      environmentForcing,
      stellarHistoryDoseContext,
      planetRadiationEnvironmentContext,
      atmosphereLedger,
      atmosphereEvolutionContext,
      oceanChemistryContext,
      photochemistry,
    }),
    exosphereAbioticScore,
  );
  const methane = methaneContext({
    partials,
    photochemistry,
    carbonCycleContext,
    oceanChemistryContext,
  });
  const coRisk = coBuildupScore({ partials, photochemistry });
  const interpretationClass = interpretation({
    disequilibrium,
    falsePositive,
    methane,
    coRisk,
    partials,
  });

  return {
    modelVersion: MODEL_VERSION,
    applicable: pressure > 0 && Object.values(partials).some((value) => value > 0),
    pressureAtm: round(pressure, pressure < 0.01 ? 8 : 4),
    partialPressuresAtm: Object.fromEntries(
      Object.entries(partials).map(([gas, value]) => [gas, round(value, value < 0.01 ? 8 : 4)]),
    ),
    interpretationClass,
    disequilibriumScore: disequilibrium,
    disequilibriumStrength: classFromScore(disequilibrium, ["Low", "Moderate", "High"]),
    replenishmentDemandScore: replenishmentDemand,
    replenishmentDemandClass: classFromScore(replenishmentDemand, ["Low", "Moderate", "High"]),
    o2O3FalsePositiveRiskScore: falsePositive,
    o2O3FalsePositiveRisk: classFromScore(falsePositive, ["Low", "Moderate", "High"]),
    methaneContext: methane.label,
    methaneContextScore: round(methane.score, 3),
    coBuildupRiskScore: coRisk,
    coBuildupRisk: classFromScore(coRisk, ["Low", "Moderate", "High"]),
    stellarHistoryAbioticOxygenRisk:
      stellarHistoryDoseContext?.outputs?.abioticOxygenRiskClass || "Not evaluated",
    stellarHistoryWaterLossRisk:
      stellarHistoryDoseContext?.outputs?.waterLossRiskClass || "Not evaluated",
    planetRadiationUvHazard:
      planetRadiationEnvironmentContext?.outputs?.uvSurfaceHazardClass || "Not evaluated",
    nitrogenNutrientLimitation:
      nitrogenCycleContext?.outputs?.nutrientLimitationClass || "Not evaluated",
    nitrogenPressureBuffer:
      nitrogenCycleContext?.outputs?.pressureBufferSupportClass || "Not evaluated",
    nitrogenBiosignatureCaveat:
      nitrogenCycleContext?.outputs?.biosignatureNitrogenCaveatClass || "not-evaluated",
    exosphereAbioticOxygenRiskScore: exosphereAbioticScore,
    exosphereAbioticOxygenRisk: classFromScore(exosphereAbioticScore, [
      "Not indicated",
      "Abiotic exosphere caution",
      "Strong abiotic exosphere caution",
    ]),
    surfaceBoundaryExosphereClass:
      surfaceBoundaryExosphere?.exosphereClass || "No icy sputtered O2 exosphere",
    exosphereOxygenProductionKgS: surfaceBoundaryExosphere?.oxygenProductionKgS ?? null,
    confidence: confidenceFromInputs({
      photochemistry,
      atmosphereLedger,
      carbonCycleContext,
      oceanChemistryContext,
      nitrogenCycleContext,
    }),
    summaryLabel: `${interpretationClass} (${classFromScore(disequilibrium, ["low", "moderate", "high"])} disequilibrium)`,
    notes: buildNotes({
      falsePositive,
      methane,
      coRisk,
      disequilibrium,
      atmosphereEvolutionContext,
      stellarHistoryDoseContext,
      planetRadiationEnvironmentContext,
      nitrogenCycleContext,
      surfaceBoundaryExosphere,
    }),
  };
}
