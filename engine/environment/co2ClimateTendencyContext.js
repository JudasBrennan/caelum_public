import { clamp, round, toFinite } from "../utils.js";

const MODEL_VERSION = "co2-climate-tendency-v1";
const SOURCE_KEYS = ["co2ClimateTendency"];

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

function classFromScore(score, labels) {
  const value = fraction(score, 0);
  if (value >= 0.67) return labels.high;
  if (value >= 0.34) return labels.medium;
  if (value >= 0.08) return labels.low;
  return labels.none;
}

function confidenceFromCarbon(carbonCycleContext = {}) {
  const confidence = String(carbonCycleContext?.confidence || "").toLowerCase();
  if (confidence === "high" || confidence === "medium" || confidence === "low") {
    return confidence;
  }
  return "unknown";
}

export function buildCo2ClimateTendencyContext({
  carbonCycleContext = null,
  pressureAtm = 0,
  ppCO2Atm = 0,
  hydrosphere = null,
  geology = null,
  surfaceTempK = 0,
  climateState = "",
} = {}) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  const co2Partial = finiteNonNegative(ppCO2Atm, 0);
  const tempK = finiteNonNegative(surfaceTempK, 0);
  const carbon =
    carbonCycleContext && typeof carbonCycleContext === "object" ? carbonCycleContext : {};
  const weathering = fraction(carbon.weatheringEfficiency, 0);
  const volcanic = fraction(carbon.volcanicSupply, 0);
  const recycling = fraction(carbon.recyclingEfficiency, 0);
  const thermostat = fraction(carbon.thermostatStrength, 0);
  const surfaceLiquid = Math.max(
    fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0),
    fraction(hydrosphere?.liquidOceanFraction, 0),
  );
  const co2Score = logRangeScore(co2Partial, 1e-5, 0.03);
  const hotStress = clamp((tempK - 300) / 80, 0, 1);
  const coldStress = clamp((275 - tempK) / 75, 0, 1);
  const runawayOrHot = /runaway|moist greenhouse/i.test(String(climateState || ""));
  const snowball = /snowball/i.test(String(climateState || ""));
  const highPressureIceLimited =
    hydrosphere?.highPressureIceBarrier === true ||
    /high-pressure-ice/i.test(String(carbon.weatheringLimiter || ""));
  const drawdownScore = clamp(
    weathering *
      surfaceLiquid *
      co2Score *
      (0.45 + 0.55 * hotStress) *
      (runawayOrHot ? 0.55 : 1) *
      (highPressureIceLimited ? 0.45 : 1),
    0,
    1,
  );
  const buildupScore = clamp(
    volcanic *
      (1 - weathering * 0.75) *
      (0.35 + 0.65 * Math.max(coldStress, snowball ? 0.65 : 0)) *
      (0.7 + 0.3 * (1 - recycling)),
    0,
    1,
  );
  const thermostatAdjustmentK =
    pressure <= 1e-5
      ? 0
      : clamp(4.5 * buildupScore - 4.5 * drawdownScore, -5, 5) * (0.65 + 0.35 * thermostat);
  const weatheringSinkConfidence =
    pressure <= 1e-5 || surfaceLiquid <= 0.01 ? "low" : confidenceFromCarbon(carbon);
  const recyclingLimitReason =
    carbon.recyclingLimiter ||
    (recycling <= 0.16
      ? "weak tectonic recycling"
      : highPressureIceLimited
        ? "high-pressure-ice caveat"
        : "none");
  const notes = [
    "CO2 tendency is a bounded climate tendency, not an atmospheric composition mutation.",
  ];
  if (highPressureIceLimited) notes.push("Rock-ocean carbon exchange is caveated by dense ice.");
  if (runawayOrHot) notes.push("Hot or runaway climates suppress reliable CO2 drawdown claims.");
  if (snowball)
    notes.push("Snowball conditions allow CO2 buildup tendency when outgassing persists.");
  if (geology?.volcanicActivityScore != null) {
    notes.push("Volcanic support comes from the supplied geology context.");
  }

  return {
    modelVersion: MODEL_VERSION,
    co2DrawdownTendency: classFromScore(drawdownScore, {
      high: "strong drawdown tendency",
      medium: "moderate drawdown tendency",
      low: "weak drawdown tendency",
      none: "no drawdown tendency",
    }),
    co2BuildupTendency: classFromScore(buildupScore, {
      high: "strong buildup tendency",
      medium: "moderate buildup tendency",
      low: "weak buildup tendency",
      none: "no buildup tendency",
    }),
    drawdownScore: round(drawdownScore, 3),
    buildupScore: round(buildupScore, 3),
    thermostatAdjustmentK: round(thermostatAdjustmentK, 2),
    weatheringSinkConfidence,
    recyclingLimitReason,
    confidence: confidenceFromCarbon(carbon),
    sourceKeys: SOURCE_KEYS,
    notes,
  };
}

export const CO2_CLIMATE_TENDENCY_MODEL_VERSION = MODEL_VERSION;
