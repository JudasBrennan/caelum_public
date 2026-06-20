import { clamp, round, toFinite } from "../utils.js";
import {
  hasRockOceanExchangeBarrier,
  resolveSurfaceOceanFractions,
} from "../contexts/surfaceOceanCoverageAccessors.js";

const MODEL_VERSION = "carbon-cycle-v1";

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function optionalFraction(value) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, 0, 1) : NaN;
}

function logRangeScore(value, lower, upper) {
  const number = finiteNonNegative(value, 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const low = Math.log10(Math.max(lower, 1e-12));
  const high = Math.log10(Math.max(upper, lower * 1.0001));
  return clamp((Math.log10(Math.max(number, 1e-12)) - low) / (high - low), 0, 1);
}

function temperatureWeatheringScore(surfaceTempK) {
  const temp = finiteNonNegative(surfaceTempK, 0);
  if (temp <= 0) return 0;
  if (temp < 240) return clamp((temp - 180) / 60, 0, 0.25);
  if (temp < 273) return clamp(0.25 + ((temp - 240) / 33) * 0.45, 0.25, 0.7);
  if (temp <= 315) return 1;
  if (temp <= 350) return clamp(1 - ((temp - 315) / 35) * 0.35, 0.65, 1);
  if (temp <= 400) return clamp(0.65 - ((temp - 350) / 50) * 0.35, 0.3, 0.65);
  return 0.12;
}

function tectonicRecyclingScore(tectonicRegime, volcanicActivity = null) {
  const regime = String(tectonicRegime || "").toLowerCase();
  const regimeScore =
    {
      mobile: 0.85,
      episodic: 0.62,
      "plutonic-squishy": 0.45,
      stagnant: 0.2,
      stagnants: 0.2,
      none: 0,
    }[regime] ?? 0.35;
  const volcanic = Number(volcanicActivity);
  if (Number.isFinite(volcanic)) return clamp(0.65 * regimeScore + 0.35 * volcanic, 0, 1);
  return clamp(regimeScore, 0, 1);
}

function volcanicSupplyScore({ tectonicScore, outgassing, volcanicActivity }) {
  const volcanic = Number(volcanicActivity);
  const explicitVolcanic = Number.isFinite(volcanic) ? clamp(volcanic, 0, 1) : 0;
  const species = String(
    outgassing?.primarySpecies || outgassing?.dominantSpecies || outgassing?.sourceClass || "",
  ).toLowerCase();
  const co2Rich = species.includes("co") || species.includes("h₂o") || species.includes("h2o");
  const sourceClass = String(outgassing?.sourceClass || "").toLowerCase();
  const cryoOnly = sourceClass.includes("cryo") || species.includes("cryo");
  return clamp(
    Math.max(explicitVolcanic, 0.18 + 0.62 * tectonicScore) *
      (cryoOnly ? 0.45 : co2Rich ? 1 : 0.72),
    0,
    1,
  );
}

function landWaterExposure({ hydrosphere, landFraction, oceanFraction }) {
  const coverage = resolveSurfaceOceanFractions(hydrosphere);
  const land = fraction(
    coverage.landFraction,
    fraction(landFraction, fraction(hydrosphere?.landFraction, 0)),
  );
  const ocean = fraction(
    coverage.liquidOceanFraction,
    fraction(oceanFraction, fraction(hydrosphere?.liquidOceanFraction, 0)),
  );
  const surfaceLiquid = fraction(coverage.surfaceAccessibleLiquidFraction, ocean);
  const highPressureBarrier = hasRockOceanExchangeBarrier(hydrosphere);
  const subsurfaceScore = fraction(hydrosphere?.subsurfaceOceanScore, 0);
  const rockOceanAccess = highPressureBarrier ? 0.2 : clamp(0.35 + 0.65 * subsurfaceScore, 0, 1);
  const exposedLandWeathering = clamp(1 - Math.abs(land - 0.35) / 0.45, land > 0 ? 0.05 : 0, 1);
  const seafloorWeathering = ocean > 0.75 || subsurfaceScore > 0.35 ? 0.35 * rockOceanAccess : 0;
  return {
    land,
    ocean,
    surfaceLiquid,
    highPressureBarrier,
    subsurfaceScore,
    coverageModelVersion: coverage.modelVersion,
    exposedLandWeathering,
    seafloorWeathering,
    rockOceanAccess,
  };
}

function weatheringLimiter({
  pressureAtm,
  co2Score,
  waterScore,
  landScore,
  temperatureScore,
  highPressureBarrier,
}) {
  if (pressureAtm <= 0.001) return "atmosphere-limited";
  if (waterScore <= 0.05) return "water-limited";
  if (landScore <= 0.25 && highPressureBarrier) return "high-pressure-ice barrier";
  if (landScore <= 0.08) return "exposed-land limited";
  if (co2Score <= 0.05) return "CO2-limited";
  if (temperatureScore <= 0.2) return "temperature-limited";
  return "none";
}

function tendencyClass({
  pressureAtm,
  weatheringEfficiency,
  volcanicSupply,
  recyclingEfficiency,
  thermostat,
}) {
  if (pressureAtm <= 1e-5) return "Carbon cycle inactive";
  if (thermostat >= 0.62) return "Balanced carbonate-silicate tendency";
  if (weatheringEfficiency <= 0.08 && recyclingEfficiency <= 0.12) return "Carbon cycle inactive";
  if (weatheringEfficiency <= 0.08 && volcanicSupply <= 0.08) return "Carbon cycle inactive";
  if (weatheringEfficiency <= 0.12) return "Weathering-limited CO2 buildup tendency";
  if (recyclingEfficiency <= 0.16) return "Recycling-limited drawdown tendency";
  if (volcanicSupply > weatheringEfficiency + 0.25) return "Outgassing-dominated tendency";
  if (weatheringEfficiency > volcanicSupply + 0.25) return "Weathering-drawdown tendency";
  return "Weakly buffered tendency";
}

function confidence({ pressureAtm, surfaceLiquid, land, tectonicRegime, climateState }) {
  if (pressureAtm <= 1e-5) return "high";
  const climate = String(climateState || "").toLowerCase();
  const tectonicsKnown = String(tectonicRegime || "").length > 0;
  if (surfaceLiquid > 0.02 && land > 0.02 && tectonicsKnown && !climate.includes("runaway")) {
    return "high";
  }
  if (surfaceLiquid > 0.02 || tectonicsKnown) return "medium";
  return "low";
}

function stabilityModifier({ thermostatStrength, confidenceValue, tendency }) {
  if (confidenceValue !== "high") return 1;
  const tendencyText = String(tendency || "");
  if (tendencyText === "Carbon cycle inactive") return 0.96;
  if (thermostatStrength >= 0.62) return 1.07;
  if (thermostatStrength >= 0.35) return 1.04;
  if (thermostatStrength >= 0.25) return 1.02;
  if (thermostatStrength <= 0.08 && /limited|dominated/i.test(tendencyText)) return 0.93;
  return 1;
}

export function computeCarbonCycleContext({
  surfaceTempK = 0,
  pressureAtm = 0,
  ppCO2Atm = 0,
  hydrosphere = null,
  tectonicRegime = "",
  volcanicActivity = null,
  outgassing = null,
  landFraction = null,
  oceanFraction = null,
  stellarAgeGyr = 0,
  insolationEarth = 1,
  climateState = "",
  interiorEvolutionContext = null,
} = {}) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  const co2Partial = finiteNonNegative(ppCO2Atm, 0);
  const exposure = landWaterExposure({ hydrosphere, landFraction, oceanFraction });
  const tempScore = temperatureWeatheringScore(surfaceTempK);
  const co2Score = logRangeScore(co2Partial, 1e-5, 0.02);
  const waterScore = clamp(
    exposure.surfaceLiquid + 0.25 * fraction(hydrosphere?.steamFraction, 0),
    0,
    1,
  );
  const pressureScore = logRangeScore(pressure, 0.01, 1);
  const climate = String(climateState || "");
  const climatePenalty = /runaway|moist greenhouse/i.test(climate)
    ? 0.45
    : /snowball/i.test(climate)
      ? 0.55
      : 1;
  const landWeatheringScore = clamp(
    0.72 * exposure.exposedLandWeathering + exposure.seafloorWeathering,
    0,
    1,
  );
  const weatheringEfficiency = clamp(
    landWeatheringScore * waterScore * tempScore * pressureScore * (0.35 + 0.65 * co2Score),
    0,
    1,
  );
  const interiorOutputs =
    interiorEvolutionContext && typeof interiorEvolutionContext === "object"
      ? interiorEvolutionContext.outputs || interiorEvolutionContext
      : {};
  const interiorRecyclingScore = optionalFraction(interiorOutputs.mantleRecyclingSupportScore);
  const interiorVolcanicScore = optionalFraction(interiorOutputs.volcanicLongevityScore);
  const baseTectonicScore = tectonicRecyclingScore(tectonicRegime, volcanicActivity);
  const tectonicScore = Number.isFinite(interiorRecyclingScore)
    ? clamp(0.72 * baseTectonicScore + 0.28 * interiorRecyclingScore, 0, 1)
    : baseTectonicScore;
  const explicitVolcanic = optionalFraction(volcanicActivity);
  const volcanicActivityWithInterior = Number.isFinite(interiorVolcanicScore)
    ? Number.isFinite(explicitVolcanic)
      ? Math.max(explicitVolcanic, 0.75 * interiorVolcanicScore)
      : interiorVolcanicScore
    : volcanicActivity;
  const recyclingEfficiency = clamp(
    tectonicScore *
      (0.72 + 0.28 * logRangeScore(finiteNonNegative(stellarAgeGyr, 4.6), 0.2, 4.6)) *
      (exposure.highPressureBarrier ? 0.72 : 1),
    0,
    1,
  );
  const volcanicSupply = volcanicSupplyScore({
    tectonicScore,
    outgassing,
    volcanicActivity: volcanicActivityWithInterior,
  });
  const balance = 1 - Math.abs(weatheringEfficiency - volcanicSupply);
  const thermostatStrength = clamp(
    Math.min(weatheringEfficiency, recyclingEfficiency, volcanicSupply) *
      (0.55 + 0.45 * balance) *
      climatePenalty,
    0,
    1,
  );
  const limiter = weatheringLimiter({
    pressureAtm: pressure,
    co2Score,
    waterScore,
    landScore: landWeatheringScore,
    temperatureScore: tempScore,
    highPressureBarrier: exposure.highPressureBarrier,
  });
  const recyclingLimiter =
    recyclingEfficiency < 0.16
      ? "weak tectonic recycling"
      : exposure.highPressureBarrier
        ? "high-pressure-ice caveat"
        : "none";
  const tendency = tendencyClass({
    pressureAtm: pressure,
    weatheringEfficiency,
    volcanicSupply,
    recyclingEfficiency,
    thermostat: thermostatStrength,
  });
  const confidenceValue = confidence({
    pressureAtm: pressure,
    surfaceLiquid: exposure.surfaceLiquid,
    land: exposure.land,
    tectonicRegime,
    climateState,
  });
  const notes = ["Tendency diagnostic only: not a solved carbon reservoir or CO2 history."];
  if (exposure.ocean > 0.8) notes.push("Deep-ocean worlds have weak exposed-land weathering.");
  if (exposure.highPressureBarrier) {
    notes.push("High-pressure ice reduces direct rock-ocean carbon exchange.");
  }
  if (pressure <= 1e-5) notes.push("Airless bodies receive no cloud/weathering benefit.");
  if (climatePenalty < 1) notes.push("Extreme climate state suppresses thermostat confidence.");
  if (finiteNonNegative(insolationEarth, 1) > 1.7) {
    notes.push("High insolation can outpace this lightweight weathering proxy.");
  }
  if (interiorEvolutionContext) {
    notes.push("Interior evolution context informs volcanic supply and recycling support.");
  }

  return {
    modelVersion: MODEL_VERSION,
    weatheringEfficiency: round(weatheringEfficiency, 3),
    volcanicSupply: round(volcanicSupply, 3),
    recyclingEfficiency: round(recyclingEfficiency, 3),
    thermostatStrength: round(thermostatStrength, 3),
    co2SinkTendency: round(weatheringEfficiency, 3),
    co2SupplyTendency: round(volcanicSupply, 3),
    exposedLandFraction: round(exposure.land, 3),
    oceanFraction: round(exposure.ocean, 3),
    surfaceAccessibleLiquidFraction: round(exposure.surfaceLiquid, 3),
    seafloorWeatheringPotential: round(exposure.seafloorWeathering, 3),
    rockOceanAccess: round(exposure.rockOceanAccess, 3),
    surfaceOceanCoverageModelVersion: exposure.coverageModelVersion,
    interiorEvolutionModelVersion: interiorEvolutionContext?.modelVersion || null,
    interiorVolcanicSupportClass: interiorOutputs.volcanicLongevityClass || "not-evaluated",
    interiorRecyclingSupportClass: interiorOutputs.mantleRecyclingSupportClass || "not-evaluated",
    weatheringLimiter: limiter,
    recyclingLimiter,
    tendencyClass: tendency,
    stabilityModifier: round(
      stabilityModifier({ thermostatStrength, confidenceValue, tendency }),
      3,
    ),
    confidence: confidenceValue,
    notes,
  };
}
