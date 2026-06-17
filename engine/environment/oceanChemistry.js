import { clamp, round, toFinite } from "../utils.js";
import { freezingPointKFromOceanChemistry } from "../habitability/oceanThermalProfile.js";

const MODEL_VERSION = "ocean-chemistry-v1";
const PURE_WATER_FREEZING_K = 273.15;

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

function confidenceRank(value) {
  return { unsupported: 0, low: 1, medium: 2, high: 3 }[String(value || "").toLowerCase()] ?? 1;
}

function confidenceFromRank(rank) {
  if (rank >= 3) return "high";
  if (rank >= 2) return "medium";
  if (rank >= 1) return "low";
  return "unsupported";
}

function resolveOceanDepthKm(hydrosphere = {}) {
  const candidates = [
    hydrosphere.estimatedMeanOceanDepthKm,
    hydrosphere.estimatedSurfaceOceanDepthKm,
    hydrosphere.estimatedSubsurfaceOceanDepthKm,
    hydrosphere.subsurfaceOceanDepthKm,
    hydrosphere.oceanDepthKm,
  ];
  for (const candidate of candidates) {
    const depth = finiteNonNegative(candidate, NaN);
    if (Number.isFinite(depth) && depth > 0) return depth;
  }
  const equivalentDepthKm = finiteNonNegative(hydrosphere.equivalentWaterDepthM, 0) / 1000;
  return equivalentDepthKm > 0 ? equivalentDepthKm : 0;
}

function waterInventoryPresent(hydrosphere = {}) {
  return (
    fraction(hydrosphere.waterCoverageFraction, 0) > 0.001 ||
    fraction(hydrosphere.liquidOceanFraction, 0) > 0.001 ||
    fraction(hydrosphere.permanentIceFraction, 0) > 0.001 ||
    fraction(hydrosphere.steamFraction, 0) > 0.001 ||
    finiteNonNegative(hydrosphere.equivalentWaterDepthM, 0) > 0 ||
    hydrosphere.subsurfaceOceanPresent === true ||
    fraction(hydrosphere.subsurfaceOceanScore, 0) > 0.001
  );
}

function classifyWaterContext(hydrosphere = {}) {
  const liquid = fraction(hydrosphere.liquidOceanFraction, 0);
  const accessible = fraction(hydrosphere.surfaceAccessibleLiquidFraction, liquid);
  const ice = fraction(hydrosphere.permanentIceFraction, 0);
  const steam = fraction(hydrosphere.steamFraction, 0);
  const subsurfaceScore = fraction(hydrosphere.subsurfaceOceanScore, 0);
  const hasWater = waterInventoryPresent(hydrosphere);

  if (!hasWater) return { key: "none", label: "No water inventory", liquid: false };
  if (steam > 0.2 && liquid <= 0.01) {
    return { key: "steam", label: "Steam / no stable ocean", liquid: false };
  }
  if (accessible > 0.01 || liquid > 0.05) {
    return { key: "surface-ocean", label: "Surface ocean", liquid: true };
  }
  if (hydrosphere.subsurfaceOceanPresent === true || subsurfaceScore >= 0.35) {
    return { key: "subsurface-ocean", label: "Subsurface ocean", liquid: true };
  }
  if (ice > 0.01) return { key: "ice-brine", label: "Ice / possible brines", liquid: false };
  return { key: "water-inventory", label: "Water inventory", liquid: false };
}

function inferSalinityPct(hydrosphere = {}, waterContext) {
  if (!waterContext?.liquid) return 0;
  const liquid = fraction(hydrosphere.liquidOceanFraction, 0);
  const accessible = fraction(hydrosphere.surfaceAccessibleLiquidFraction, liquid);
  const land = fraction(hydrosphere.landFraction, 0);
  const depthKm = resolveOceanDepthKm(hydrosphere);
  const highPressureBarrier =
    hydrosphere.highPressureIceBarrier === true ||
    hydrosphere.highPressureIceLikely === true ||
    hydrosphere.rockOceanBarrier === true;

  if (waterContext.key === "subsurface-ocean") {
    return highPressureBarrier ? 4.5 : 6;
  }
  if (accessible > 0.15 && land >= 0.15 && land <= 0.8 && depthKm >= 1 && depthKm <= 8) {
    return 3.5;
  }
  if (depthKm > 50 || liquid > 0.9) return 2.2;
  if (depthKm > 15 || liquid > 0.75) return 2.8;
  if (land > 0.7 && depthKm > 0) return 4.5;
  return 3;
}

function resolveSalinity({ salinityPct, salinityInputProvided, hydrosphere, waterContext }) {
  const explicitNumber = toFinite(salinityPct, NaN);
  if (salinityInputProvided === true && Number.isFinite(explicitNumber)) {
    return {
      value: clamp(explicitNumber, 0, 35),
      source: "input",
      confidenceRank: 3,
    };
  }
  const hydrosphereSalinity = toFinite(hydrosphere?.salinityPct, NaN);
  if (Number.isFinite(hydrosphereSalinity) && hydrosphereSalinity > 0) {
    return {
      value: clamp(hydrosphereSalinity, 0, 35),
      source: "input",
      confidenceRank: 3,
    };
  }
  if (!waterContext?.liquid) {
    return { value: 0, source: "none", confidenceRank: waterContext?.key === "none" ? 3 : 1 };
  }
  return {
    value: inferSalinityPct(hydrosphere, waterContext),
    source: "inferred",
    confidenceRank: 1,
  };
}

function resolveAmmonia({ ammoniaPct, ammoniaInputProvided, hydrosphere }) {
  const explicitNumber = toFinite(ammoniaPct, NaN);
  if (ammoniaInputProvided === true && Number.isFinite(explicitNumber)) {
    return { value: clamp(explicitNumber, 0, 30), source: "input", confidenceRank: 3 };
  }
  const hydrosphereAmmonia = toFinite(hydrosphere?.ammoniaPct, NaN);
  if (Number.isFinite(hydrosphereAmmonia) && hydrosphereAmmonia > 0) {
    return { value: clamp(hydrosphereAmmonia, 0, 30), source: "input", confidenceRank: 3 };
  }
  return { value: 0, source: "none", confidenceRank: 2 };
}

function classifySalinity(salinityPct) {
  if (salinityPct <= 0.05) return "Fresh";
  if (salinityPct < 0.5) return "Very low salinity";
  if (salinityPct < 2) return "Low salinity";
  if (salinityPct <= 5) return "Moderate salinity";
  if (salinityPct <= 15) return "Briny";
  return "Hypersaline";
}

function classifyBrineModifier(freezingPointDepressionK, ammoniaPct) {
  if (freezingPointDepressionK >= 15 || ammoniaPct >= 8) return "Strong brine antifreeze";
  if (freezingPointDepressionK >= 5 || ammoniaPct >= 2) return "Moderate brine antifreeze";
  if (freezingPointDepressionK >= 1) return "Weak brine antifreeze";
  return "Fresh-water freezing point";
}

function rockOceanAccessScore({ hydrosphere, carbonCycleContext }) {
  const carbonAccess = toFinite(carbonCycleContext?.rockOceanAccess, NaN);
  let access = Number.isFinite(carbonAccess) ? clamp(carbonAccess, 0, 1) : 0.35;
  const surfaceLiquid = fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0);
  const land = fraction(hydrosphere?.landFraction, 0);
  if (hydrosphere?.subsurfaceOceanPresent === true && !hydrosphere?.highPressureIceBarrier) {
    access = Math.max(access, 0.55);
  }
  if (surfaceLiquid > 0.05) {
    access = Math.max(access, land > 0.05 ? 0.65 : 0.55);
  }
  if (hydrosphere?.highPressureIceBarrier === true || hydrosphere?.rockOceanBarrier === true) {
    access = Math.min(access, 0.22);
  }
  return round(clamp(access, 0, 1), 3);
}

function carbonateSupportScore({ hydrosphere, carbonCycleContext, ppCO2Atm }) {
  const weathering = fraction(carbonCycleContext?.weatheringEfficiency, 0);
  const thermostat = fraction(carbonCycleContext?.thermostatStrength, 0);
  const seafloor = fraction(carbonCycleContext?.seafloorWeatheringPotential, 0);
  const recycling = fraction(carbonCycleContext?.recyclingEfficiency, 0);
  const land = fraction(hydrosphere?.landFraction, 0);
  const liquid = Math.max(
    fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0),
    fraction(hydrosphere?.liquidOceanFraction, 0),
    fraction(hydrosphere?.subsurfaceOceanScore, 0) * 0.55,
  );
  const co2Availability = logRangeScore(ppCO2Atm, 1e-5, 0.01);
  const highPressurePenalty =
    hydrosphere?.highPressureIceBarrier === true || hydrosphere?.rockOceanBarrier === true
      ? 0.42
      : 1;
  const exposedSurfaceExchange =
    highPressurePenalty < 1 ? 0 : Math.sqrt(liquid * clamp(land / 0.25, 0, 1));
  const surfaceBufferScore =
    exposedSurfaceExchange *
    (0.32 + 0.28 * recycling + 0.18 * co2Availability + 0.12 * weathering + 0.1 * thermostat);
  const reservoirScore =
    (0.45 * weathering + 0.25 * thermostat + 0.2 * seafloor + 0.1 * co2Availability) *
    (0.45 + 0.55 * liquid);
  return round(clamp(Math.max(reservoirScore, surfaceBufferScore) * highPressurePenalty, 0, 1), 3);
}

function classifyAcidity({ waterContext, ppCO2Atm, carbonateScore, ammoniaPct }) {
  if (!waterContext?.liquid) return "Not evaluated";
  if (ammoniaPct >= 5 && ppCO2Atm < 0.05) return "Ammonia-buffered alkaline";
  if (ppCO2Atm >= 1) return "Strongly acidic";
  if (ppCO2Atm >= 0.05) return carbonateScore >= 0.45 ? "CO2-rich but buffered" : "Acidic";
  if (ppCO2Atm >= 0.005)
    return carbonateScore >= 0.35 ? "Mildly acidic / buffered" : "Mildly acidic";
  if (carbonateScore >= 0.42) return "Buffered / mildly alkaline";
  if (carbonateScore >= 0.2) return "Weakly buffered";
  return "Poorly buffered";
}

function classifyCarbonateSaturation({ waterContext, hydrosphere, carbonateScore, ppCO2Atm }) {
  if (!waterContext?.liquid) return "Not evaluated";
  if (hydrosphere?.highPressureIceBarrier === true || hydrosphere?.rockOceanBarrier === true) {
    return "Rock-ocean limited";
  }
  if (carbonateScore >= 0.42) return "Carbonate-supported";
  if (carbonateScore >= 0.22) return "Weak carbonate support";
  if (ppCO2Atm >= 0.05) return "Undersaturation risk";
  return "Uncertain carbonate support";
}

function hydrothermalScore({ hydrosphere, geology, carbonCycleContext }) {
  const carbonSeafloor = fraction(carbonCycleContext?.seafloorWeatheringPotential, 0);
  const carbonAccess = fraction(carbonCycleContext?.rockOceanAccess, 0);
  const volcanic = Math.max(
    fraction(geology?.volcanicActivityScore, 0),
    fraction(geology?.cryovolcanicActivityScore, 0) * 0.8,
  );
  const oceanPersistence = fraction(geology?.oceanPersistenceScore, 0);
  const subsurface = fraction(hydrosphere?.subsurfaceOceanScore, 0);
  const tidalHeat = logRangeScore(geology?.tidalHeatingEarth, 0.03, 10);
  let score = Math.max(
    carbonSeafloor,
    0.45 * carbonAccess + 0.25 * volcanic + 0.2 * subsurface + 0.1 * tidalHeat,
    oceanPersistence * 0.7,
  );
  if (hydrosphere?.highPressureIceBarrier === true || hydrosphere?.rockOceanBarrier === true) {
    score *= 0.45;
  }
  return round(clamp(score, 0, 1), 3);
}

function classifySupport(score, labels) {
  if (score >= 0.65) return labels.high;
  if (score >= 0.35) return labels.medium;
  if (score >= 0.12) return labels.low;
  return labels.none;
}

function buildNotes({ salinitySource, waterContext, hydrosphere, ppCO2Atm }) {
  const notes = [
    "Ocean chemistry is a qualitative context model, not a solved geochemical reservoir.",
  ];
  if (salinitySource === "inferred") {
    notes.push("Salinity is inferred from water inventory and ocean depth with low confidence.");
  }
  if (waterContext.key === "ice-brine") {
    notes.push("Ice-dominated bodies are treated as possible brine contexts, not open oceans.");
  }
  if (hydrosphere?.highPressureIceBarrier === true || hydrosphere?.rockOceanBarrier === true) {
    notes.push("High-pressure ice can isolate ocean water from direct rock exchange.");
  }
  if (finiteNonNegative(ppCO2Atm, 0) >= 0.05) {
    notes.push(
      "High CO2 pressure is treated as an acidification driver unless buffering is strong.",
    );
  }
  return notes;
}

export function computeOceanChemistryContext({
  hydrosphere = null,
  salinityPct = null,
  ammoniaPct = null,
  salinityInputProvided = false,
  ammoniaInputProvided = false,
  pressureAtm = 0,
  ppCO2Atm = 0,
  carbonCycleContext = null,
  geology = null,
  climateState = "",
} = {}) {
  const resolvedHydrosphere = hydrosphere && typeof hydrosphere === "object" ? hydrosphere : {};
  const waterContext = classifyWaterContext(resolvedHydrosphere);
  const pressure = finiteNonNegative(pressureAtm, 0);
  const co2Partial = finiteNonNegative(ppCO2Atm, 0);
  const salinity = resolveSalinity({
    salinityPct,
    salinityInputProvided,
    hydrosphere: resolvedHydrosphere,
    waterContext,
  });
  const ammonia = resolveAmmonia({
    ammoniaPct,
    ammoniaInputProvided,
    hydrosphere: resolvedHydrosphere,
  });
  const freezingPointK = freezingPointKFromOceanChemistry({
    salinityPct: salinity.value,
    ammoniaPct: ammonia.value,
  });
  const freezingPointDepressionK = Math.max(0, PURE_WATER_FREEZING_K - freezingPointK);
  const rockAccess = rockOceanAccessScore({
    hydrosphere: resolvedHydrosphere,
    carbonCycleContext,
  });
  const carbonateScore = carbonateSupportScore({
    hydrosphere: resolvedHydrosphere,
    carbonCycleContext,
    ppCO2Atm: co2Partial,
  });
  const hydrothermal = hydrothermalScore({
    hydrosphere: resolvedHydrosphere,
    geology,
    carbonCycleContext,
  });
  const nutrientScore = round(
    clamp(
      0.45 * rockAccess +
        0.3 * carbonateScore +
        0.25 * hydrothermal +
        (String(climateState).toLowerCase().includes("runaway") ? -0.2 : 0),
      0,
      1,
    ),
    3,
  );
  const confidence = confidenceFromRank(
    Math.min(
      salinity.confidenceRank,
      waterContext.key === "none" ? 3 : Math.max(1, confidenceRank(carbonCycleContext?.confidence)),
    ) + (waterContext.liquid && salinity.source === "inferred" && carbonCycleContext ? 1 : 0),
  );

  const acidityClass = classifyAcidity({
    waterContext,
    ppCO2Atm: co2Partial,
    carbonateScore,
    ammoniaPct: ammonia.value,
  });
  const carbonateSaturationClass = classifyCarbonateSaturation({
    waterContext,
    hydrosphere: resolvedHydrosphere,
    carbonateScore,
    ppCO2Atm: co2Partial,
  });
  const hydrothermalSupportClass = classifySupport(hydrothermal, {
    high: "Strong hydrothermal support",
    medium: "Moderate hydrothermal support",
    low: "Weak hydrothermal support",
    none: "No clear hydrothermal support",
  });
  const nutrientSupportClass = classifySupport(nutrientScore, {
    high: "Strong nutrient access",
    medium: "Moderate nutrient access",
    low: "Reduced nutrient access",
    none: "Nutrient access poor",
  });
  const salinityClass = classifySalinity(salinity.value);
  const brineModifierClass = classifyBrineModifier(freezingPointDepressionK, ammonia.value);
  const notes = buildNotes({
    salinitySource: salinity.source,
    waterContext,
    hydrosphere: resolvedHydrosphere,
    ppCO2Atm: co2Partial,
  });

  return {
    modelVersion: MODEL_VERSION,
    applicable: waterContext.key !== "none",
    liquidContext: waterContext.liquid,
    waterContext: waterContext.key,
    waterContextLabel: waterContext.label,
    pressureAtm: round(pressure, pressure < 0.01 ? 8 : 4),
    ppCO2Atm: round(co2Partial, co2Partial < 0.01 ? 8 : 4),
    salinityPct: round(salinity.value, 2),
    salinityClass,
    salinitySource: salinity.source,
    ammoniaPct: round(ammonia.value, 2),
    ammoniaSource: ammonia.source,
    freezingPointK: round(freezingPointK, 1),
    freezingPointDepressionK: round(freezingPointDepressionK, 1),
    brineModifierClass,
    acidityClass,
    carbonateSaturationClass,
    carbonateSupportScore: carbonateScore,
    rockOceanAccess: rockAccess,
    hydrothermalSupportScore: hydrothermal,
    hydrothermalSupportClass,
    nutrientSupportScore: nutrientScore,
    nutrientSupportClass,
    highPressureIceCaveat:
      resolvedHydrosphere.highPressureIceBarrier === true ||
      resolvedHydrosphere.rockOceanBarrier === true,
    confidence,
    summaryLabel:
      waterContext.key === "none"
        ? "No water chemistry context"
        : `${salinityClass} | ${acidityClass}`,
    notes,
  };
}
