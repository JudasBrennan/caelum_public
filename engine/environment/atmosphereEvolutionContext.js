import { clamp, round, toFinite } from "../utils.js";

const MODEL_VERSION = "atmosphere-evolution-context-v1";
const SOURCE_KEYS = ["atmosphereEvolution"];

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function strongestTerm(terms = [], fallback = null) {
  const active = terms.filter((entry) => entry && Number(entry.score) > 0);
  if (!active.length) return fallback;
  return active.reduce((best, entry) => (entry.score > best.score ? entry : best), active[0]);
}

function pressureTrendClass(ledger = {}) {
  const trend = String(ledger?.trendClass || "").toLowerCase();
  if (trend.includes("rapid")) return "rapid loss tendency";
  if (trend.includes("declining")) return "declining pressure tendency";
  if (trend.includes("airless")) return "no durable atmosphere";
  if (trend.includes("stable")) return "stable retained pressure";
  if (trend.includes("replenished")) return "replenished pressure tendency";
  if (trend.includes("balanced")) return "balanced pressure tendency";
  return "unknown pressure tendency";
}

function volatileLossRiskClass({ ledger, environmentForcing, stellarHistoryDoseContext }) {
  const sink = strongestTerm(ledger?.sinkTerms || [], ledger?.dominantSink || null);
  const historyOutputs =
    stellarHistoryDoseContext && typeof stellarHistoryDoseContext === "object"
      ? stellarHistoryDoseContext.outputs || stellarHistoryDoseContext
      : {};
  const xuvRatio = finiteNonNegative(
    environmentForcing?.flux?.xuvEarthAtOrbit,
    finiteNonNegative(historyOutputs.integratedXuvDoseEarth, 1),
  );
  const historyWaterLossScore = fraction(historyOutputs.waterLossRiskScore, 0);
  const score = clamp(
    fraction(sink?.score, 0) * 0.75 +
      (["jeans_escape", "xuv_escape", "wind_sputtering", "photolysis_h_escape"].includes(sink?.id)
        ? 0.2
        : 0) +
      0.1 * clamp(Math.log10(Math.max(xuvRatio, 1)) / 2, 0, 1) +
      0.3 * historyWaterLossScore,
    0,
    1,
  );
  if (score >= 0.72) return "high volatile loss risk";
  if (score >= 0.4) return "moderate volatile loss risk";
  if (score >= 0.12) return "low volatile loss risk";
  return "minimal volatile loss risk";
}

function dominantGasTendency({ ledger, composition, carbonCycleContext }) {
  const gas = ledger?.dominantAtmosphereGas?.gas || dominantGas(composition).gas;
  const carbon =
    carbonCycleContext && typeof carbonCycleContext === "object" ? carbonCycleContext : {};
  if (gas === "co2") {
    if (fraction(carbon.weatheringEfficiency, 0) > fraction(carbon.volcanicSupply, 0) + 0.18) {
      return "CO2 drawdown tendency";
    }
    if (fraction(carbon.volcanicSupply, 0) > fraction(carbon.weatheringEfficiency, 0) + 0.18) {
      return "CO2 buildup tendency";
    }
  }
  const sink = String(ledger?.dominantSink?.id || "");
  if (["jeans_escape", "xuv_escape", "wind_sputtering"].includes(sink)) {
    return `${gas || "volatile"} loss tendency`;
  }
  return `${gas || "bulk gas"} retained tendency`;
}

function dominantGas(composition = {}) {
  const raw = composition && typeof composition === "object" ? composition : {};
  let best = { gas: "", share: 0 };
  for (const [gas, share] of Object.entries(raw)) {
    const value = finiteNonNegative(share, 0);
    if (value > best.share) best = { gas, share: value };
  }
  return best;
}

function compositionStabilityClass({
  ledger,
  carbonCycleContext,
  hydrosphere,
  stellarHistoryDoseContext,
  nitrogenCycleContext,
}) {
  const nitrogenOutputs =
    nitrogenCycleContext && typeof nitrogenCycleContext === "object"
      ? nitrogenCycleContext.outputs || nitrogenCycleContext
      : {};
  const historyOutputs =
    stellarHistoryDoseContext && typeof stellarHistoryDoseContext === "object"
      ? stellarHistoryDoseContext.outputs || stellarHistoryDoseContext
      : {};
  if (fraction(historyOutputs.abioticOxygenRiskScore, 0) >= 0.66) {
    return "photolysis-sensitive composition";
  }
  if (fraction(historyOutputs.waterLossRiskScore, 0) >= 0.66) {
    return "escape-sensitive composition";
  }
  const sinkId = String(ledger?.dominantSink?.id || "");
  if (["jeans_escape", "xuv_escape", "wind_sputtering"].includes(sinkId)) {
    return "escape-sensitive composition";
  }
  if (sinkId === "photolysis_h_escape") return "photolysis-sensitive composition";
  if (/limited|barrier/i.test(String(carbonCycleContext?.weatheringLimiter || ""))) {
    return "carbon-buffer limited composition";
  }
  if (/strong|moderate/i.test(String(nitrogenOutputs.pressureBufferSupportClass || ""))) {
    if (fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0) > 0.1) {
      return "surface and pressure-buffered composition";
    }
    return "pressure-buffered composition";
  }
  if (fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0) > 0.1) {
    return "surface-buffered composition";
  }
  return "weakly buffered composition";
}

function confidence({ ledger, carbonCycleContext, manualOverrideProtected }) {
  if (manualOverrideProtected) return "medium";
  const ledgerConfidence = String(ledger?.confidence || "").toLowerCase();
  const carbonConfidence = String(carbonCycleContext?.confidence || "").toLowerCase();
  if (ledgerConfidence === "high" && ["high", "medium"].includes(carbonConfidence)) return "high";
  if (["high", "medium"].includes(ledgerConfidence)) return "medium";
  if (ledgerConfidence === "low" || carbonConfidence === "low") return "low";
  return "unknown";
}

function interiorOutgassingLongevityClass(interiorEvolutionContext = null) {
  const outputs =
    interiorEvolutionContext && typeof interiorEvolutionContext === "object"
      ? interiorEvolutionContext.outputs || interiorEvolutionContext
      : {};
  return String(outputs.volcanicLongevityClass || "");
}

export function buildAtmosphereEvolutionContext({
  atmosphereLedger = null,
  pressureAtm = 0,
  composition = {},
  environmentForcing = null,
  stellarHistoryDoseContext = null,
  carbonCycleContext = null,
  hydrosphere = null,
  interiorEvolutionContext = null,
  nitrogenCycleContext = null,
  manualMode = false,
} = {}) {
  const ledger = atmosphereLedger && typeof atmosphereLedger === "object" ? atmosphereLedger : {};
  const pressure = finiteNonNegative(pressureAtm, 0);
  const manualOverrideProtected =
    manualMode === true || String(manualMode).toLowerCase() === "manual";
  const pressureClass = pressureTrendClass(ledger);
  const volatileRisk = volatileLossRiskClass({
    ledger,
    environmentForcing,
    stellarHistoryDoseContext,
  });
  const source = ledger.dominantSource || strongestTerm(ledger.sourceTerms || []);
  const sink = ledger.dominantSink || strongestTerm(ledger.sinkTerms || []);
  const interiorLongevity = interiorOutgassingLongevityClass(interiorEvolutionContext);
  const sourceLooksVolcanic =
    String(source?.id || "").includes("volcanic") ||
    String(source?.label || "")
      .toLowerCase()
      .includes("outgassing");
  const baseLifetimeClass =
    pressure <= 1e-8
      ? "none"
      : ledger.timescaleClass || (pressure < 0.02 ? "transient" : "geologic");
  const lifetimeClass =
    sourceLooksVolcanic &&
    /minimal|waning/i.test(interiorLongevity) &&
    baseLifetimeClass === "geologic"
      ? "waning geologic"
      : baseLifetimeClass;
  const notes = [
    "Atmosphere evolution is a bounded tendency context, not a reservoir time integration.",
  ];
  if (manualOverrideProtected)
    notes.push("Manual atmosphere settings are reported but not overwritten.");
  if (source?.id === "weathering_sequestration" || sink?.id === "weathering_sequestration") {
    notes.push("Carbon-cycle weathering is supplied by the carbon context when available.");
  }
  const historyOutputs =
    stellarHistoryDoseContext && typeof stellarHistoryDoseContext === "object"
      ? stellarHistoryDoseContext.outputs || stellarHistoryDoseContext
      : {};
  if (fraction(historyOutputs.waterLossRiskScore, 0) >= 0.42) {
    notes.push("Stellar-history dose adds a long-term water-loss caveat.");
  }
  if (interiorEvolutionContext) {
    notes.push("Interior evolution context informs outgassing-longevity interpretation.");
  }
  const nitrogenOutputs =
    nitrogenCycleContext && typeof nitrogenCycleContext === "object"
      ? nitrogenCycleContext.outputs || nitrogenCycleContext
      : {};
  if (nitrogenCycleContext) {
    notes.push(
      "Nitrogen context informs pressure-buffer interpretation without changing composition.",
    );
  }
  if (/weak|minimal/i.test(String(nitrogenOutputs.pressureBufferSupportClass || ""))) {
    notes.push("Weak N2 pressure support limits background-gas buffering.");
  }

  return {
    modelVersion: MODEL_VERSION,
    pressureTrendClass: pressureClass,
    volatileLossRiskClass: volatileRisk,
    dominantGasTendency: dominantGasTendency({
      ledger,
      composition,
      carbonCycleContext,
    }),
    atmosphereLifetimeClass: lifetimeClass,
    interiorOutgassingLongevityClass: interiorLongevity || "not-evaluated",
    compositionStabilityClass: compositionStabilityClass({
      ledger,
      carbonCycleContext,
      hydrosphere,
      stellarHistoryDoseContext,
      nitrogenCycleContext,
    }),
    manualOverrideProtected,
    pressureAtm: round(pressure, pressure < 0.01 ? 8 : 4),
    sourceIndex: ledger.sourceIndex ?? null,
    sinkIndex: ledger.sinkIndex ?? null,
    netBalance: ledger.netBalance ?? null,
    confidence: confidence({ ledger, carbonCycleContext, manualOverrideProtected }),
    sourceKeys: SOURCE_KEYS,
    notes,
  };
}

export const ATMOSPHERE_EVOLUTION_CONTEXT_MODEL_VERSION = MODEL_VERSION;
