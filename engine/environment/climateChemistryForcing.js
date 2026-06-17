import { clamp, round, toFinite } from "../utils.js";

const MODEL_VERSION = "climate-chemistry-forcing-v1";
const NET_DELTA_LIMIT_K = 35;

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

function partialPressuresAtm(composition = {}, pressureAtm = 0) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  const raw = composition && typeof composition === "object" ? composition : {};
  const keys = ["n2", "o2", "co2", "ar", "h2o", "ch4", "h2", "he", "so2", "nh3", "co"];
  const values = {};
  let total = 0;
  for (const key of keys) {
    values[key] = finiteNonNegative(raw[key], 0);
    total += values[key];
  }
  const looksFractional = total <= 1.5 && pressure > 1.5;
  const looksPercent = total > 1.5 && total <= 101 && pressure <= 2;
  for (const key of keys) {
    if (looksFractional) values[key] *= pressure;
    else if (looksPercent) values[key] = (values[key] / 100) * pressure;
  }
  return values;
}

function volcanicPersistenceFromLedger(atmosphereLedger = {}) {
  const terms = Array.isArray(atmosphereLedger?.sourceTerms) ? atmosphereLedger.sourceTerms : [];
  const volcanic = terms.find((entry) => entry?.id === "volcanic_outgassing");
  const cryovolcanic = terms.find((entry) => entry?.id === "cryovolcanic_outgassing");
  const dominantId = String(atmosphereLedger?.dominantSource?.id || "");
  return Math.max(
    finiteNonNegative(volcanic?.score, 0),
    dominantId === "volcanic_outgassing"
      ? finiteNonNegative(atmosphereLedger?.dominantSource?.score, 0)
      : 0,
    0.45 * finiteNonNegative(cryovolcanic?.score, 0),
  );
}

function methaneGreenhouseDeltaK({ ppCH4Atm, pressureAtm, hazeLightReduction, hazeLikelihood }) {
  const methaneScore = logRangeScore(ppCH4Atm, 1e-5, 0.03);
  const pressureSupport = clamp(0.35 + 0.65 * logRangeScore(pressureAtm, 0.03, 1), 0, 1);
  const hazeSuppression = clamp(1 - 0.75 * hazeLightReduction - 0.45 * hazeLikelihood, 0.08, 1);
  return clamp(10 * methaneScore * pressureSupport * hazeSuppression, 0, 10);
}

function waterVaporFeedbackDeltaK({
  preliminaryDeltaK,
  pressureAtm,
  baselineSurfaceTempK,
  hydrosphere,
  ppH2OAtm,
}) {
  if (preliminaryDeltaK <= 0.5) return 0;
  if (pressureAtm < 0.1) return 0;
  const tempK = finiteNonNegative(baselineSurfaceTempK, 0);
  if (tempK < 260 || tempK > 340) return 0;
  const surfaceWater = Math.max(
    fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0),
    fraction(hydrosphere?.liquidOceanFraction, 0),
  );
  if (surfaceWater <= 0.01 && ppH2OAtm <= 1e-4) return 0;
  const waterSupport = clamp(surfaceWater + logRangeScore(ppH2OAtm, 1e-4, 0.02) * 0.35, 0, 1);
  return clamp(preliminaryDeltaK * 0.22 * waterSupport, 0, 4);
}

function cloudAlbedoDeltaK(cloudContext = null) {
  if (!cloudContext || typeof cloudContext !== "object") return 0;
  if (Number.isFinite(Number(cloudContext.cloudAlbedoDeltaK))) {
    return clamp(Number(cloudContext.cloudAlbedoDeltaK), -12, 6);
  }
  const albedoEffect = Number(cloudContext.cloudAlbedoEffect);
  if (!Number.isFinite(albedoEffect)) return 0;
  return clamp(-8 * albedoEffect, -12, 6);
}

function tendencyFromDelta(deltaK) {
  if (deltaK <= -10) return "Photochemical cooling tendency";
  if (deltaK <= -3) return "Slight photochemical cooling";
  if (deltaK >= 10) return "Photochemical warming tendency";
  if (deltaK >= 3) return "Slight photochemical warming";
  return "Near baseline";
}

function optInClimateState({ coupledSurfaceTempK, hydrosphere, pressureAtm }) {
  const tempK = finiteNonNegative(coupledSurfaceTempK, 0);
  const hasSurfaceWater =
    fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0) > 0.01 ||
    fraction(hydrosphere?.liquidOceanFraction, 0) > 0.01 ||
    fraction(hydrosphere?.steamFraction, 0) > 0.01;
  if (!hasSurfaceWater) return "Baseline climate state retained";
  if (pressureAtm < 0.006) return "Surface solvent pressure-limited";
  if (tempK >= 373 || fraction(hydrosphere?.steamFraction, 0) > 0.5) return "Runaway tendency";
  if (tempK >= 340 && pressureAtm >= 0.1) return "Moist-greenhouse tendency";
  if (tempK <= 240) return "Snowball tendency";
  return "Stable tendency";
}

function confidence({ pressureAtm, photochemistry, atmosphereLedger }) {
  if (pressureAtm <= 1e-5) return "high";
  const hasPhotochemistry = photochemistry && typeof photochemistry === "object";
  const ledgerConfidence = String(atmosphereLedger?.confidence || "").toLowerCase();
  if (hasPhotochemistry && ledgerConfidence === "high") return "high";
  if (hasPhotochemistry || ledgerConfidence === "medium") return "medium";
  return "low";
}

export function computeClimateChemistryForcing({
  baselineSurfaceTempK = 0,
  pressureAtm = 0,
  composition = {},
  photochemistry = null,
  atmosphereLedger = null,
  hydrosphere = null,
  cloudContext = null,
  greenhouseTau = null,
} = {}) {
  const baseline = finiteNonNegative(baselineSurfaceTempK, 0);
  const pressure = finiteNonNegative(pressureAtm, 0);
  const partials = partialPressuresAtm(composition, pressure);
  const haze =
    photochemistry?.haze && typeof photochemistry.haze === "object" ? photochemistry.haze : {};
  const hazeCoolingPotential = finiteNonNegative(haze.antiGreenhouseCoolingK, 0);
  const hazeLightReduction = fraction(haze.surfaceLightReductionFraction, 0);
  const hazeLikelihood = fraction(haze.likelihoodScore, 0);
  const hazeDeltaK = -clamp(hazeCoolingPotential * (0.65 + 0.35 * hazeLightReduction), 0, 32);
  const methaneGreenhouseDeltaKValue = methaneGreenhouseDeltaK({
    ppCH4Atm: partials.ch4,
    pressureAtm: pressure,
    hazeLightReduction,
    hazeLikelihood,
  });
  const volcanicPersistence = volcanicPersistenceFromLedger(atmosphereLedger);
  const sulfurCandidateK = clamp(12 * logRangeScore(partials.so2, 1e-5, 0.01), 0, 12);
  const sulfurAerosolDeltaK =
    volcanicPersistence >= 0.15 ? -sulfurCandidateK * clamp(volcanicPersistence, 0, 1) : 0;
  const cloudAlbedoDeltaKValue = cloudAlbedoDeltaK(cloudContext);
  const preliminaryDeltaK =
    hazeDeltaK + methaneGreenhouseDeltaKValue + sulfurAerosolDeltaK + cloudAlbedoDeltaKValue;
  const waterVaporFeedbackDeltaKValue = waterVaporFeedbackDeltaK({
    preliminaryDeltaK,
    pressureAtm: pressure,
    baselineSurfaceTempK: baseline,
    hydrosphere,
    ppH2OAtm: partials.h2o,
  });
  const netDeltaK = clamp(
    preliminaryDeltaK + waterVaporFeedbackDeltaKValue,
    -NET_DELTA_LIMIT_K,
    NET_DELTA_LIMIT_K,
  );
  const coupledSurfaceTempK = baseline > 0 ? baseline + netDeltaK : 0;
  const labelOnlyClimateState = tendencyFromDelta(netDeltaK);
  const optInClimateStateValue = optInClimateState({
    coupledSurfaceTempK,
    hydrosphere,
    pressureAtm: pressure,
  });
  const notes = [
    "Diagnostic only: baseline surface temperature remains unchanged.",
    "Ozone is treated as UV shielding, not a large direct temperature forcing.",
  ];
  if (hazeDeltaK < 0) {
    notes.push("Organic haze anti-greenhouse cooling is bounded to avoid runaway cooling.");
  }
  if (methaneGreenhouseDeltaKValue > 0 && hazeLightReduction > 0.1) {
    notes.push("Methane greenhouse warming is reduced because haze opacity competes with it.");
  }
  if (sulfurCandidateK > 0 && sulfurAerosolDeltaK === 0) {
    notes.push("SO2 aerosol cooling is suppressed without persistent volcanic source context.");
  }
  if (cloudContext == null) {
    notes.push("Cloud albedo term is reserved for the Phase 5 cloud/circulation context.");
  } else if (cloudAlbedoDeltaKValue < 0) {
    notes.push("Cloud/circulation context contributes bounded albedo cooling.");
  }

  return {
    modelVersion: MODEL_VERSION,
    baselineSurfaceTempK: round(baseline, 2),
    hazeDeltaK: round(hazeDeltaK, 2),
    hazeVisibleOpacity: round(hazeLightReduction, 3),
    methaneGreenhouseDeltaK: round(methaneGreenhouseDeltaKValue, 2),
    sulfurAerosolDeltaK: round(sulfurAerosolDeltaK, 2),
    volcanicPersistence: round(volcanicPersistence, 3),
    cloudAlbedoDeltaK: round(cloudAlbedoDeltaKValue, 2),
    waterVaporFeedbackDeltaK: round(waterVaporFeedbackDeltaKValue, 2),
    netDeltaK: round(netDeltaK, 2),
    coupledSurfaceTempK: round(coupledSurfaceTempK, 2),
    labelOnlyClimateState,
    optInClimateState: optInClimateStateValue,
    confidence: confidence({ pressureAtm: pressure, photochemistry, atmosphereLedger }),
    diagnosticMode: "derived-only",
    greenhouseTau: Number.isFinite(Number(greenhouseTau)) ? round(Number(greenhouseTau), 4) : null,
    partialPressuresAtm: {
      ch4: round(partials.ch4, 6),
      co2: round(partials.co2, 6),
      h2o: round(partials.h2o, 6),
      so2: round(partials.so2, 8),
    },
    notes,
  };
}
