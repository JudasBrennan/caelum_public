import { clamp, round, toFinite } from "../utils.js";

const MODEL_VERSION = "atmosphere-ledger-v1";
const EARTH_ESCAPE_VELOCITY_KMS = 11.186;
const KNOWN_GASES = ["n2", "o2", "co2", "ar", "h2o", "ch4", "h2", "he", "so2", "nh3", "co"];

const LABELS = Object.freeze({
  volcanic_outgassing: "Volcanic outgassing",
  cryovolcanic_outgassing: "Cryovolcanic outgassing",
  impact_delivery: "Impact delivery",
  comet_delivery: "Comet delivery",
  retained_volatiles: "Retained volatiles",
  ocean_buffering: "Ocean buffering",
  jeans_escape: "Jeans escape",
  xuv_escape: "XUV escape",
  wind_sputtering: "Wind stripping / sputtering",
  photolysis_h_escape: "Photolysis H escape",
  condensation_collapse: "Condensation collapse",
  weathering_sequestration: "Weathering sequestration",
  surface_adsorption: "Surface adsorption / cold trapping",
});

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

function combineScores(terms = []) {
  let retained = 1;
  for (const term of terms) {
    retained *= 1 - fraction(term?.score, 0);
  }
  return round(clamp(1 - retained, 0, 1), 3);
}

function normalizeComposition(composition = {}) {
  const raw = composition && typeof composition === "object" ? composition : {};
  const values = {};
  let total = 0;
  for (const gas of KNOWN_GASES) {
    const value = finiteNonNegative(raw[gas], 0);
    values[gas] = value;
    total += value;
  }
  if (total > 1.5) {
    total = 0;
    for (const gas of KNOWN_GASES) {
      values[gas] /= 100;
      total += values[gas];
    }
  }
  if (total > 0) {
    for (const gas of KNOWN_GASES) {
      values[gas] /= total;
    }
  }
  return values;
}

function dominantCompositionGas(composition = {}) {
  let dominant = { gas: "", share: 0 };
  for (const [gas, share] of Object.entries(composition)) {
    if (share > dominant.share) dominant = { gas, share };
  }
  return dominant;
}

function term(id, score, confidence, reason) {
  return {
    id,
    label: LABELS[id] || id,
    score: round(clamp(score, 0, 1), 3),
    confidence,
    reason,
  };
}

function strongestTerm(terms = []) {
  const active = terms.filter((entry) => entry && entry.score > 0);
  if (!active.length) {
    return { id: "none", label: "None", score: 0, confidence: "medium", reason: "" };
  }
  return active.reduce((best, entry) => (entry.score > best.score ? entry : best), active[0]);
}

function tectonicActivityScore(tectonics = {}) {
  const regime = String(tectonics?.regime || tectonics?.tectonicRegime || "").toLowerCase();
  const probabilities = tectonics?.probabilities || tectonics?.tectonicProbabilities || {};
  const regimeScores = {
    mobile: 0.8,
    episodic: 0.58,
    "plutonic-squishy": 0.52,
    stagnants: 0.25,
    stagnant: 0.22,
  };
  const probabilityScore = Math.max(
    finiteNonNegative(probabilities.mobile, 0) * 0.8,
    finiteNonNegative(probabilities.episodic, 0) * 0.58,
    finiteNonNegative(probabilities.plutonicSquishy, 0) * 0.52,
    finiteNonNegative(probabilities.stagnant, 0) * 0.22,
  );
  const heatScore = clamp(
    0.35 * logRangeScore(tectonics?.radiogenicHeatingEarth, 0.03, 1.5) +
      0.25 * logRangeScore(tectonics?.tidalHeatingEarth, 0.01, 10),
    0,
    0.5,
  );
  return clamp(Math.max(regimeScores[regime] || 0, probabilityScore) + heatScore, 0, 1);
}

function pressureRetentionScore(pressureAtm) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  if (pressure <= 0) return 0;
  if (pressure < 1e-6) return 0.04;
  return clamp(
    0.1 + 0.75 * logRangeScore(pressure, 0.001, 1) + 0.15 * logRangeScore(pressure, 1, 50),
    0,
    1,
  );
}

function thinAtmosphereFactor(pressureAtm) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  if (pressure <= 0) return 1;
  return clamp(1 - logRangeScore(pressure, 0.001, 1), 0.05, 1);
}

function lowGravityFactor({ gravityG, escapeVelocityKms, escapeVelocityVEarth, jeansEscape }) {
  const explicitEscape = finiteNonNegative(
    escapeVelocityVEarth,
    finiteNonNegative(jeansEscape?.escapeVelocityVEarth, NaN),
  );
  if (Number.isFinite(explicitEscape) && explicitEscape > 0) {
    return clamp((1 / explicitEscape - 0.65) / 1.8, 0, 1);
  }
  const kms = finiteNonNegative(
    escapeVelocityKms,
    finiteNonNegative(jeansEscape?.escapeVelocityKmS, NaN),
  );
  if (Number.isFinite(kms) && kms > 0) {
    return clamp((EARTH_ESCAPE_VELOCITY_KMS / kms - 0.65) / 1.8, 0, 1);
  }
  const gravity = finiteNonNegative(gravityG, NaN);
  if (Number.isFinite(gravity) && gravity > 0) return clamp((1 / gravity - 0.7) / 2.2, 0, 1);
  return 0.35;
}

function jeansLossScore({ jeansEscape, composition, xuvHazard, atmosphericEscapeEnabled }) {
  const species =
    jeansEscape?.species && typeof jeansEscape.species === "object" ? jeansEscape.species : {};
  let weighted = 0;
  let weightTotal = 0;
  for (const gas of KNOWN_GASES) {
    const status = String(species[gas]?.status || "").toLowerCase();
    if (!status) continue;
    const share = composition[gas] > 0 ? composition[gas] : 0.04;
    const statusScore = status === "lost" ? 1 : status === "marginal" ? 0.45 : 0.06;
    weighted += share * statusScore;
    weightTotal += share;
  }
  const base = weightTotal > 0 ? weighted / weightTotal : 0;
  const enabledBoost = atmosphericEscapeEnabled === false ? 0.75 : 1;
  return clamp(base * enabledBoost + 0.15 * xuvHazard * base, 0, 1);
}

function retainedVolatileInventoryScore(volatileInventory = []) {
  if (!Array.isArray(volatileInventory)) return 0;
  let score = 0;
  for (const entry of volatileInventory) {
    const pressurePa = finiteNonNegative(entry?.pressurePa, 0);
    if (pressurePa > 0) score = Math.max(score, logRangeScore(pressurePa / 101325, 1e-6, 1));
    if (entry?.retained === true) score = Math.max(score, 0.35);
    if (
      String(entry?.status || "")
        .toLowerCase()
        .includes("atmosphere")
    )
      score = Math.max(score, 0.25);
  }
  return clamp(score, 0, 1);
}

function climateCollapseScore({ climateState, climate, pressureAtm, composition, surfaceTempK }) {
  const state = String(
    climate?.collapseState || climateState || climate?.climateState || "",
  ).toLowerCase();
  if (state.includes("collapse")) return 0.8;
  if (state.includes("snowball")) return 0.35;
  if (state.includes("runaway")) return 0.1;
  const tempK = finiteNonNegative(surfaceTempK, finiteNonNegative(climate?.surfaceTempK, 0));
  const dominant = dominantCompositionGas(composition);
  if (pressureAtm < 0.05 && dominant.gas === "co2" && tempK > 0 && tempK < 160) return 0.35;
  if (pressureAtm < 0.01 && tempK > 0 && tempK < 180) return 0.25;
  return 0;
}

function buildSourceTerms({
  bodyType,
  pressureAtm,
  outgassing,
  tectonics,
  volatileInventory,
  hydrosphere,
  smallBodyReservoirContext,
  ageGyr,
}) {
  const sources = [];
  const pressureSource = pressureRetentionScore(pressureAtm);
  const volatileInventoryScore = retainedVolatileInventoryScore(volatileInventory);
  const retainedScore = Math.max(pressureSource, volatileInventoryScore);
  if (retainedScore > 0) {
    sources.push(
      term(
        "retained_volatiles",
        retainedScore,
        "medium",
        "Uses current surface pressure and retained volatile inventory as a reservoir proxy.",
      ),
    );
  }

  if (bodyType === "moon") {
    const cryoScore = clamp(
      0.55 * fraction(tectonics?.cryovolcanicActivityScore, 0) +
        0.35 * fraction(hydrosphere?.subsurfaceOceanScore, 0) +
        0.15 *
          logRangeScore(tectonics?.tidalHeatingEarth ?? outgassing?.tidalHeatingEarth, 0.05, 10),
      0,
      1,
    );
    if (cryoScore > 0.02) {
      sources.push(
        term(
          "cryovolcanic_outgassing",
          cryoScore,
          "medium",
          "Cryovolcanism and subsurface-ocean access can replenish thin volatile envelopes.",
        ),
      );
    }
  } else {
    const activity = tectonicActivityScore(tectonics);
    const hasOutgassing =
      !!outgassing?.primarySpecies ||
      !!outgassing?.mantleOxidationKey ||
      !!outgassing?.oxidationLabel ||
      !!tectonics?.regime;
    if (hasOutgassing) {
      sources.push(
        term(
          "volcanic_outgassing",
          0.15 + 0.55 * activity,
          activity >= 0.45 ? "medium" : "low",
          "Mantle redox and tectonic regime are used as a first-order volcanic supply proxy.",
        ),
      );
    }
  }

  const oceanFraction = Math.max(
    fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0),
    fraction(hydrosphere?.liquidOceanFraction, 0),
    fraction(hydrosphere?.subsurfaceOceanScore, 0) * 0.6,
  );
  if (oceanFraction > 0.02) {
    sources.push(
      term(
        "ocean_buffering",
        clamp(oceanFraction * (pressureAtm >= 0.006 ? 0.7 : 0.35), 0, 0.7),
        "low",
        "Liquid reservoirs buffer volatiles; carbonate weathering is handled by the carbon-cycle context when available.",
      ),
    );
  }

  const reservoirOutputs =
    smallBodyReservoirContext && typeof smallBodyReservoirContext === "object"
      ? smallBodyReservoirContext.outputs || {}
      : {};
  const reservoirImpactScore = fraction(reservoirOutputs.impactFluxScore, 0);
  const reservoirVolatileScore = fraction(reservoirOutputs.volatileDeliveryScore, 0);
  const reservoirCometScore = fraction(reservoirOutputs.cometDeliveryScore, 0);
  const hasReservoirContext = !!smallBodyReservoirContext;
  const age = finiteNonNegative(ageGyr, 4.6);
  const impactScore = Math.max(
    age < 0.7 ? 0.16 : age < 1.5 ? 0.08 : 0.025,
    hasReservoirContext
      ? clamp(0.05 + 0.28 * reservoirImpactScore + 0.18 * reservoirVolatileScore, 0, 0.45)
      : 0,
  );
  sources.push(
    term(
      "impact_delivery",
      impactScore,
      hasReservoirContext ? "medium" : "low",
      hasReservoirContext
        ? "Small-body reservoir context raises impact volatile delivery when debris, Oort, or comet supply is present."
        : "Late impact delivery is retained only as a weak background volatile source.",
    ),
  );
  const cometDeliveryScore = Math.max(
    bodyType === "moon" ? impactScore * 0.7 : impactScore * 0.8,
    hasReservoirContext
      ? clamp(0.04 + 0.34 * reservoirCometScore + 0.26 * reservoirVolatileScore, 0, 0.5)
      : 0,
  );
  sources.push(
    term(
      "comet_delivery",
      cometDeliveryScore,
      hasReservoirContext ? "medium" : "low",
      hasReservoirContext
        ? "Cometary delivery follows the scoped reservoir context and remains stochastic."
        : "Cometary delivery is stochastic and treated as a minor source.",
    ),
  );

  return sources;
}

function buildSinkTerms({
  bodyType,
  pressureAtm,
  composition,
  environmentForcing,
  magnetosphereEnvironment,
  jeansEscape,
  atmosphericEscapeEnabled,
  photochemistry,
  hydrosphere,
  carbonCycleContext,
  climateState,
  climate,
  radiation,
  surfaceTempK,
  gravityG,
  escapeVelocityKms,
  escapeVelocityVEarth,
}) {
  const sinks = [];
  const xuvRatio = finiteNonNegative(
    environmentForcing?.flux?.xuvEarthAtOrbit,
    finiteNonNegative(
      jeansEscape?.xuvFluxRatio,
      finiteNonNegative(radiation?.stellarXuvFluxRatio, 1),
    ),
  );
  const xuvHazard = logRangeScore(xuvRatio, 1, 100);
  const lowGravity = lowGravityFactor({
    gravityG,
    escapeVelocityKms,
    escapeVelocityVEarth,
    jeansEscape,
  });
  const thinFactor = thinAtmosphereFactor(pressureAtm);
  const jeansScore = jeansLossScore({
    jeansEscape,
    composition,
    xuvHazard,
    atmosphericEscapeEnabled,
  });
  if (jeansScore > 0) {
    sinks.push(
      term(
        "jeans_escape",
        jeansScore,
        jeansEscape?.species ? "medium" : "low",
        "Thermal escape is based on Jeans retention state and composition weighting.",
      ),
    );
  }

  const xuvScore = clamp((0.2 + 0.8 * lowGravity) * xuvHazard * (0.45 + 0.55 * thinFactor), 0, 1);
  if (xuvScore > 0.01) {
    sinks.push(
      term(
        "xuv_escape",
        xuvScore,
        "low",
        "Energy-limited escape is only order-of-magnitude and is damped by gravity and atmospheric column.",
      ),
    );
  }

  const windRatio = finiteNonNegative(
    environmentForcing?.wind?.ramPressureEarthRatio,
    finiteNonNegative(magnetosphereEnvironment?.windPressureEarthRatio, 1),
  );
  const magnetosphereSupported =
    magnetosphereEnvironment?.supported === true ||
    String(magnetosphereEnvironment?.compressionClass || "")
      .toLowerCase()
      .includes("earth-like") ||
    String(magnetosphereEnvironment?.compressionClass || "")
      .toLowerCase()
      .includes("expanded");
  const magnetosphereWeakness = magnetosphereSupported
    ? clamp(
        1 - finiteNonNegative(magnetosphereEnvironment?.radiationShieldingFactor, 0) / 0.55,
        0.15,
        0.65,
      )
    : 1;
  const parentRadiation = logRangeScore(
    radiation?.surfaceExposureRemDayEquivalent ?? radiation?.magnetosphericRadRemDay,
    0.1,
    1000,
  );
  const windScore = clamp(
    (0.12 + 0.52 * logRangeScore(windRatio, 0.3, 30) + 0.22 * xuvHazard + 0.55 * parentRadiation) *
      magnetosphereWeakness *
      thinFactor,
    0,
    1,
  );
  if (windScore > 0.01) {
    sinks.push(
      term(
        "wind_sputtering",
        windScore,
        bodyType === "moon" && radiation ? "medium" : "low",
        "Wind and particle stripping are mediated by magnetosphere compression and atmospheric shielding.",
      ),
    );
  }

  const waterShare = Math.max(
    fraction(composition.h2o, 0),
    fraction(hydrosphere?.steamFraction, 0),
  );
  const photolysisScore = clamp(
    (0.35 * waterShare +
      0.55 * fraction(hydrosphere?.steamFraction, 0) +
      0.2 * fraction(photochemistry?.prebioticUv?.surfaceFluxScore, 0)) *
      (0.35 + 0.65 * xuvHazard),
    0,
    1,
  );
  if (photolysisScore > 0.01) {
    sinks.push(
      term(
        "photolysis_h_escape",
        photolysisScore,
        "low",
        "Moist or steam-rich atmospheres under high UV/XUV can lose hydrogen after photolysis.",
      ),
    );
  }

  const condensationScore = climateCollapseScore({
    climateState,
    climate,
    pressureAtm,
    composition,
    surfaceTempK,
  });
  if (condensationScore > 0) {
    sinks.push(
      term(
        "condensation_collapse",
        condensationScore,
        "medium",
        "Cold traps or modeled collapse states can remove gases from the active atmosphere.",
      ),
    );
  }

  const hasCarbonContext = carbonCycleContext && typeof carbonCycleContext === "object";
  const weatheringScore = hasCarbonContext
    ? clamp(fraction(carbonCycleContext.weatheringEfficiency, 0) * 0.45, 0, 0.55)
    : clamp(
        fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0) *
          (composition.co2 > 0.001 ? 0.28 : 0.14) *
          (pressureAtm > 0.05 ? 1 : 0.5),
        0,
        0.35,
      );
  if (weatheringScore > 0.01) {
    sinks.push(
      term(
        "weathering_sequestration",
        weatheringScore,
        hasCarbonContext ? carbonCycleContext.confidence || "medium" : "low",
        hasCarbonContext
          ? "Carbonate weathering follows the bounded carbon-cycle context."
          : "Carbonate weathering is a placeholder sink until the dedicated carbon-cycle phase.",
      ),
    );
  }

  const adsorptionScore = clamp(
    thinFactor *
      (pressureAtm < 0.01 ? 0.2 : 0.04) *
      (surfaceTempK > 0 && surfaceTempK < 220 ? 1.6 : 1),
    0,
    0.5,
  );
  if (adsorptionScore > 0.01) {
    sinks.push(
      term(
        "surface_adsorption",
        adsorptionScore,
        "low",
        "Thin, cold atmospheres are vulnerable to surface adsorption and cold trapping.",
      ),
    );
  }

  return sinks;
}

function classifyLedger({ bodyType, pressureAtm, sourceIndex, sinkIndex, sourceTerms, sinkTerms }) {
  const netBalance = round(sourceIndex - sinkIndex, 3);
  const dominantSource = strongestTerm(sourceTerms);
  const dominantSink = strongestTerm(sinkTerms);
  const cryoActive =
    dominantSource.id === "cryovolcanic_outgassing" && dominantSource.score >= 0.25;

  let trendClass = "stable-retained";
  let trendLabel = "Stable / retained";
  let timescaleClass = "geologic";
  let timescaleLabel = "Geologic";

  const escapeDominantSink = ["jeans_escape", "xuv_escape", "wind_sputtering"].includes(
    dominantSink.id,
  );

  if (pressureAtm < 1e-8) {
    if (bodyType === "moon" && cryoActive) {
      trendClass = "replenished-transient";
      trendLabel = "Replenished / transient";
      timescaleClass = "transient";
      timescaleLabel = "Transient to short-lived";
    } else {
      trendClass = "airless-exosphere";
      trendLabel = "Airless / exosphere";
      timescaleClass = "airless";
      timescaleLabel = "No durable surface atmosphere";
    }
  } else if (
    sinkIndex >= 0.72 &&
    (sinkIndex - sourceIndex >= 0.25 ||
      (sinkIndex >= 0.9 && escapeDominantSink && dominantSink.score >= 0.55))
  ) {
    trendClass = "rapid-loss";
    trendLabel = "Escape-dominated";
    timescaleClass = "rapid";
    timescaleLabel = "Short compared with geologic time";
  } else if (netBalance <= -0.2 || pressureAtm < 0.02) {
    trendClass =
      bodyType === "moon" && sourceIndex >= 0.35 ? "replenished-transient" : "declining-transient";
    trendLabel =
      bodyType === "moon" && sourceIndex >= 0.35
        ? "Replenished / transient"
        : "Declining / transient";
    timescaleClass = netBalance <= -0.35 ? "short" : "transient";
    timescaleLabel = netBalance <= -0.35 ? "Short to transient" : "Transient";
  } else if (pressureAtm >= 10 && dominantSource.id === "retained_volatiles") {
    trendClass = "stable-retained";
    trendLabel = "Stable / retained";
    timescaleClass = "geologic";
    timescaleLabel = "Geologic";
  } else if (sourceIndex >= sinkIndex + 0.15) {
    trendClass = "stable-replenished";
    trendLabel = "Stable / replenished";
    timescaleClass = "geologic";
    timescaleLabel = "Geologic";
  } else if (Math.abs(netBalance) < 0.15) {
    trendClass = "balanced-marginal";
    trendLabel = "Balanced / marginal";
    timescaleClass = "long";
    timescaleLabel = "Long but sensitive";
  }

  return {
    trendClass,
    trendLabel,
    timescaleClass,
    timescaleLabel,
    netBalance,
    dominantSource,
    dominantSink,
  };
}

function confidenceFromTerms(sourceTerms, sinkTerms, explicitInputs) {
  const terms = [...sourceTerms, ...sinkTerms].filter((entry) => entry && entry.score > 0.05);
  const lowCount = terms.filter((entry) => entry.confidence === "low").length;
  const mediumCount = terms.filter((entry) => entry.confidence === "medium").length;
  if (explicitInputs >= 5 && lowCount <= 2) return "high";
  if (explicitInputs >= 3 || mediumCount >= 2) return "medium";
  return "low";
}

function buildSummary(classification) {
  return `${classification.trendLabel}; source ${classification.dominantSource.label.toLowerCase()}, sink ${classification.dominantSink.label.toLowerCase()}.`;
}

export function computeAtmosphereLedger({
  bodyType = "planet",
  pressureAtm = 0,
  composition = {},
  environmentForcing = null,
  magnetosphereEnvironment = null,
  jeansEscape = null,
  atmosphericEscapeEnabled = true,
  photochemistry = null,
  hydrosphere = null,
  carbonCycleContext = null,
  smallBodyReservoirContext = null,
  climateState = "",
  climate = null,
  outgassing = null,
  tectonics = null,
  volatileInventory = [],
  radiation = null,
  surfaceTempK = null,
  gravityG = null,
  escapeVelocityKms = null,
  escapeVelocityVEarth = null,
  ageGyr = 4.6,
} = {}) {
  const resolvedBodyType = String(bodyType || "").toLowerCase() === "moon" ? "moon" : "planet";
  const resolvedPressureAtm = finiteNonNegative(pressureAtm, 0);
  const normalizedComposition = normalizeComposition(composition);
  const sourceTerms = buildSourceTerms({
    bodyType: resolvedBodyType,
    pressureAtm: resolvedPressureAtm,
    outgassing,
    tectonics,
    volatileInventory,
    hydrosphere,
    smallBodyReservoirContext,
    ageGyr,
  });
  const sinkTerms = buildSinkTerms({
    bodyType: resolvedBodyType,
    pressureAtm: resolvedPressureAtm,
    composition: normalizedComposition,
    environmentForcing,
    magnetosphereEnvironment,
    jeansEscape,
    atmosphericEscapeEnabled,
    photochemistry,
    hydrosphere,
    carbonCycleContext,
    climateState,
    climate,
    radiation,
    surfaceTempK,
    gravityG,
    escapeVelocityKms,
    escapeVelocityVEarth,
  });
  const sourceIndex = combineScores(sourceTerms);
  const sinkIndex = combineScores(sinkTerms);
  const classification = classifyLedger({
    bodyType: resolvedBodyType,
    pressureAtm: resolvedPressureAtm,
    sourceIndex,
    sinkIndex,
    sourceTerms,
    sinkTerms,
  });
  const explicitInputs = [
    environmentForcing,
    magnetosphereEnvironment,
    jeansEscape,
    photochemistry,
    hydrosphere,
    climate || climateState,
    outgassing,
    tectonics,
    radiation,
    smallBodyReservoirContext,
  ].filter(Boolean).length;
  const confidence = confidenceFromTerms(sourceTerms, sinkTerms, explicitInputs);
  const caveats = [
    "Atmosphere ledger is an order-of-magnitude source-sink diagnostic, not a mass-balance solver.",
    "Energy-limited escape and wind loss are reported as confidence-bounded tendencies.",
  ];
  if (
    sourceTerms.some((entry) => entry.id === "weathering_sequestration") ||
    sinkTerms.some((entry) => entry.id === "weathering_sequestration")
  ) {
    caveats.push("Weathering is a placeholder until the dedicated carbon-cycle coupling phase.");
  }
  if (
    carbonCycleContext &&
    typeof carbonCycleContext === "object" &&
    sinkTerms.some((entry) => entry.id === "weathering_sequestration")
  ) {
    caveats[caveats.length - 1] =
      "Weathering sequestration is sourced from the bounded carbon-cycle context.";
  }

  return {
    modelVersion: MODEL_VERSION,
    bodyType: resolvedBodyType,
    pressureAtm: round(resolvedPressureAtm, resolvedPressureAtm < 0.01 ? 8 : 4),
    sourceIndex,
    sinkIndex,
    netBalance: classification.netBalance,
    trendClass: classification.trendClass,
    trendLabel: classification.trendLabel,
    timescaleClass: classification.timescaleClass,
    timescaleLabel: classification.timescaleLabel,
    dominantSource: classification.dominantSource,
    dominantSink: classification.dominantSink,
    sourceTerms,
    sinkTerms,
    confidence,
    dominantAtmosphereGas: dominantCompositionGas(normalizedComposition),
    summary: buildSummary(classification),
    caveats,
  };
}

export function atmosphereLedgerTimelineInputs(ledger = {}) {
  const trendClass = String(ledger?.trendClass || "");
  const sinkId = String(ledger?.dominantSink?.id || "");
  const sourceId = String(ledger?.dominantSource?.id || "");
  return {
    modelVersion: `${MODEL_VERSION}-timeline-inputs`,
    atmosphereTrendClass: trendClass,
    atmosphereTimescaleClass: String(ledger?.timescaleClass || ""),
    atmosphereNetBalance: Number.isFinite(Number(ledger?.netBalance))
      ? Number(ledger.netBalance)
      : null,
    atmosphereDeclining:
      trendClass.includes("declining") ||
      trendClass.includes("rapid-loss") ||
      sinkId === "xuv_escape" ||
      sinkId === "wind_sputtering",
    atmosphereReplenished:
      trendClass.includes("replenished") ||
      sourceId === "volcanic_outgassing" ||
      sourceId === "cryovolcanic_outgassing",
    atmosphereAirlessOrExosphere: trendClass.includes("airless"),
  };
}
