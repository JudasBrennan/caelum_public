import { calcLocalCluster, LOCAL_CLUSTER_DEFAULTS } from "./localCluster.js";
import { calcOortCloud, resolveOortCloudModel } from "./oortCloud.js";
import { buildSmallBodyReservoirContextForWorld } from "./smallBodyReservoirRouting.js";
import { clamp, round, toFinite } from "./utils.js";
import { resolveWorldStarConfig } from "./worldStarConfig.js";

const MODEL_VERSION = "stellar-neighbourhood-hazards-v1";
const SOLAR_STELLAR_DENSITY_PER_LY3 = 0.004;
const SN_RATE_PER_STAR_PER_GYR = 0.0002;
const LETHAL_SN_DISTANCE_LY = 32.6;
const STRIPPING_SN_DISTANCE_LY = 9.8;
const AU_PER_LY = 63241.077;
const KM_S_TO_LY_PER_GYR = 3335.64;
const DEFAULT_ENCOUNTER_SPEED_KM_S = 40;
const OORT_STIRRING_DISTANCE_AU = 10000;
const VERY_CLOSE_FLYBY_DISTANCE_AU = 1000;

const GROUP_LABELS = Object.freeze({
  atmospheres: "Atmospheres",
  impacts: "Impacts",
  reservoirs: "Reservoirs",
  insulated: "Insulated",
});

function finiteNumber(value, fallback = 0) {
  return toFinite(value, fallback);
}

function finitePositive(value, fallback = 0) {
  return Math.max(0, finiteNumber(value, fallback));
}

function cleanText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function sentence(value) {
  const text = cleanText(value);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function orderedItems(section) {
  if (Array.isArray(section)) return section.filter(Boolean);
  if (!section || typeof section !== "object") return [];
  const byId = section.byId && typeof section.byId === "object" ? section.byId : {};
  const order = Array.isArray(section.order) ? section.order : Object.keys(byId);
  return order.map((id) => byId[id]).filter(Boolean);
}

function firstFinite(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function bodyName(entry, fallback) {
  return cleanText(entry?.name, cleanText(entry?.inputs?.name, fallback));
}

function riskTone(severity) {
  if (severity >= 0.72) return "bad";
  if (severity >= 0.45) return "warn";
  if (severity >= 0.22) return "caution";
  return "good";
}

function riskClass(severity, noun = "external risk") {
  if (severity >= 0.72) return `high ${noun}`;
  if (severity >= 0.45) return `moderate ${noun}`;
  if (severity >= 0.22) return `low ${noun}`;
  return `minimal ${noun}`;
}

function broadClass(score, labels) {
  if (score >= 0.72) return labels.high;
  if (score >= 0.45) return labels.medium;
  if (score >= 0.22) return labels.low;
  return labels.none;
}

function sphereVolume(radiusLy) {
  return (4 / 3) * Math.PI * Math.max(0, radiusLy) ** 3;
}

function intervalFromRate(ratePerGyr) {
  return ratePerGyr > 0 ? 1 / ratePerGyr : Number.POSITIVE_INFINITY;
}

export function formatHazardIntervalGyr(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "unavailable";
  if (number > 1000) return "over 1,000 Gyr";
  if (number >= 100) return `about ${round(number / 10, 0) * 10} Gyr`;
  if (number >= 10) return `about ${round(number, 0)} Gyr`;
  if (number >= 1) return `about ${round(number, 1)} Gyr`;
  const myr = number * 1000;
  if (myr >= 10) return `about ${round(myr, 0)} Myr`;
  return `about ${round(myr, 1)} Myr`;
}

export function formatHazardRate(ratePerGyr) {
  const rate = Number(ratePerGyr);
  if (!Number.isFinite(rate) || rate <= 0) return "unavailable";
  if (rate < 0.001) return `${round(rate, 5)} per Gyr`;
  if (rate < 1) return `${round(rate, 3)} per Gyr`;
  return `${round(rate, 2)} per Gyr`;
}

export function formatHazardDistanceLy(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unavailable";
  if (number >= 1) return `${round(number, 2)} ly`;
  return `${round(number * AU_PER_LY, 0)} AU`;
}

function driver(label, value, detail = "") {
  return { label, value: cleanText(value, "n/a"), detail: cleanText(detail) };
}

function makeHazard({
  id,
  label,
  severity,
  expectedIntervalGyr,
  annualRate = null,
  summary,
  affects = [],
  drivers = [],
  caveats = [],
  confidence = "Low",
  sourceKeys = [],
  riskNoun = "risk",
}) {
  const safeSeverity = clamp(severity, 0, 1);
  return {
    id,
    label,
    riskClass: riskClass(safeSeverity, riskNoun),
    tone: riskTone(safeSeverity),
    severity: round(safeSeverity, 3),
    expectedIntervalGyr:
      Number.isFinite(Number(expectedIntervalGyr)) && Number(expectedIntervalGyr) > 0
        ? round(Number(expectedIntervalGyr), 4)
        : null,
    intervalLabel: formatHazardIntervalGyr(expectedIntervalGyr),
    annualRate: annualRate == null ? null : round(annualRate, 8),
    rateLabel: formatHazardRate(annualRate == null ? null : annualRate * 1_000_000_000),
    summary: sentence(summary),
    affects: affects.filter(Boolean),
    drivers,
    caveats: caveats.filter(Boolean),
    confidence,
    sourceKeys,
  };
}

function normalizeClusterModel(inputs = {}) {
  const explicitModel = inputs.localClusterModel || inputs.clusterModel || null;
  const explicitClusterInputs =
    inputs.clusterInputs ||
    (inputs.galacticRadiusLy != null ||
    inputs.locationLy != null ||
    inputs.neighbourhoodRadiusLy != null ||
    inputs.stellarDensityPerLy3 != null ||
    inputs.randomSeed != null
      ? {
          galacticRadiusLy: inputs.galacticRadiusLy,
          locationLy: inputs.locationLy,
          neighbourhoodRadiusLy: inputs.neighbourhoodRadiusLy,
          stellarDensityPerLy3: inputs.stellarDensityPerLy3,
          randomSeed: inputs.randomSeed,
        }
      : null);

  if (explicitModel && typeof explicitModel === "object") {
    return {
      model: explicitModel,
      inputs: explicitModel.inputs || explicitClusterInputs || LOCAL_CLUSTER_DEFAULTS,
      hasLocalContext: true,
      fromDefaultOnly: false,
    };
  }

  if (explicitClusterInputs) {
    const model = calcLocalCluster(explicitClusterInputs);
    return {
      model,
      inputs: model.inputs,
      hasLocalContext: true,
      fromDefaultOnly: false,
    };
  }

  return {
    model: null,
    inputs: { ...LOCAL_CLUSTER_DEFAULTS },
    hasLocalContext: false,
    fromDefaultOnly: true,
  };
}

function classKeysForSystem(system) {
  const keys = [];
  if (system?.objectClassKey) keys.push(String(system.objectClassKey).toUpperCase());
  for (const component of Array.isArray(system?.components) ? system.components : []) {
    if (component?.objectClassKey) keys.push(String(component.objectClassKey).toUpperCase());
  }
  return keys;
}

function isMassiveCandidateSystem(system) {
  return classKeysForSystem(system).some((key) => key === "O" || key === "B");
}

function massiveSignal({ systems, stellarRows }) {
  const massiveSystems = (Array.isArray(systems) ? systems : []).filter((system) =>
    isMassiveCandidateSystem(system),
  );
  const rowMassiveCount = (Array.isArray(stellarRows) ? stellarRows : []).reduce((sum, row) => {
    const key = String(row?.objectClassKey ?? row?.spectralClass ?? "").toUpperCase();
    return key === "O" || key === "B" ? sum + finitePositive(row?.count, 0) : sum;
  }, 0);
  const nearestMassiveDistance = massiveSystems.reduce((min, system) => {
    const distance = finitePositive(system?.distanceLy, Number.POSITIVE_INFINITY);
    return system?.isHome ? min : Math.min(min, distance);
  }, Number.POSITIVE_INFINITY);

  if (massiveSystems.length > 0) {
    return {
      className: "nearby candidate",
      count: massiveSystems.length,
      nearestDistanceLy: nearestMassiveDistance,
      detail: `${massiveSystems.length} generated O/B candidate${massiveSystems.length === 1 ? "" : "s"}`,
    };
  }
  if (rowMassiveCount > 0) {
    return {
      className: "statistical only",
      count: rowMassiveCount,
      nearestDistanceLy: null,
      detail: `${round(rowMassiveCount, 0)} expected O/B object${rowMassiveCount === 1 ? "" : "s"} in the census`,
    };
  }
  return {
    className: "none seen",
    count: 0,
    nearestDistanceLy: null,
    detail: "No generated O/B systems in the current neighbourhood.",
  };
}

function findHazard(hazards, id) {
  return (Array.isArray(hazards) ? hazards : []).find((hazard) => hazard?.id === id) || null;
}

function buildHazardShell(id, label, radiusLy, hazardId, tone, clusterRadiusLy) {
  const renderedRadius = finitePositive(
    clusterRadiusLy,
    LOCAL_CLUSTER_DEFAULTS.neighbourhoodRadiusLy,
  );
  const shellRadius = finitePositive(radiusLy, 0);
  return {
    id,
    label,
    radiusLy: round(shellRadius, 3),
    hazardId,
    tone,
    visibleWithinCluster: renderedRadius >= shellRadius,
    extrapolated: renderedRadius < shellRadius,
  };
}

export function buildStellarNeighbourhoodHazardMap({
  systems = [],
  stellarRows = [],
  hazards = [],
  dominantHazard = null,
  confidence = "Low",
  neighbourhoodRadiusLy = LOCAL_CLUSTER_DEFAULTS.neighbourhoodRadiusLy,
} = {}) {
  const renderedRadiusLy = finitePositive(
    neighbourhoodRadiusLy,
    LOCAL_CLUSTER_DEFAULTS.neighbourhoodRadiusLy,
  );
  const safeSystems = Array.isArray(systems) ? systems : [];
  const supernova = findHazard(hazards, "nearby-supernovae");
  const flyby = findHazard(hazards, "stellar-flybys");
  const massive = massiveSignal({ systems: safeSystems, stellarRows });
  const nearestGeneratedSystemLy = nearestSystemDistance(safeSystems);
  const nearestGeneratedSystemValue = Number.isFinite(nearestGeneratedSystemLy)
    ? round(nearestGeneratedSystemLy, 3)
    : null;
  const highlightedSystems = safeSystems
    .filter((system) => !system?.isHome && isMassiveCandidateSystem(system))
    .map((system) => ({
      id: cleanText(system?.id, cleanText(system?.name, "massive-candidate")),
      name: cleanText(system?.name, "Generated massive-star candidate"),
      distanceLy: round(finitePositive(system?.distanceLy, 0), 3),
      reason: "Generated O/B massive-star candidate",
      hazardId: "nearby-supernovae",
      tone: supernova?.tone || "warn",
    }));
  const shells = [
    buildHazardShell(
      "sn-stripping",
      "Atmosphere-stripping proxy",
      STRIPPING_SN_DISTANCE_LY,
      "nearby-supernovae",
      "caution",
      renderedRadiusLy,
    ),
    buildHazardShell(
      "sn-lethal",
      "Lethal-distance proxy",
      LETHAL_SN_DISTANCE_LY,
      "nearby-supernovae",
      "bad",
      renderedRadiusLy,
    ),
  ];
  const notes = [
    "Generated systems are visible cluster samples.",
    "Rate screens are broad intervals, not scheduled events.",
  ];
  if (shells.some((shell) => shell.extrapolated)) {
    notes.push("Some proxy shells extend beyond the rendered cluster radius.");
  }
  if (massive.className === "statistical only") {
    notes.push(`Massive-star signal is statistical only: ${massive.detail}.`);
  } else if (!highlightedSystems.length) {
    notes.push("No generated O/B candidates are visible.");
  }

  return {
    shells,
    encounterInset: {
      veryCloseAu: VERY_CLOSE_FLYBY_DISTANCE_AU,
      veryCloseLy: round(VERY_CLOSE_FLYBY_DISTANCE_AU / AU_PER_LY, 4),
      oortStirringAu: OORT_STIRRING_DISTANCE_AU,
      oortStirringLy: round(OORT_STIRRING_DISTANCE_AU / AU_PER_LY, 4),
      nearestGeneratedSystemLy: nearestGeneratedSystemValue,
      nearestGeneratedSystemLabel: formatHazardDistanceLy(nearestGeneratedSystemLy),
      flybyIntervalLabel: flyby?.intervalLabel || "unavailable",
      riskClass: flyby?.riskClass || "unavailable",
      tone: flyby?.tone || "neutral",
    },
    highlightedSystems,
    legend: {
      dominantHazardLabel: cleanText(dominantHazard?.label, "No dominant hazard"),
      confidence: cleanText(confidence, "Low"),
      renderedRadiusLy: round(renderedRadiusLy, 3),
      notes,
    },
    facts: {
      renderedClusterRadiusLy: round(renderedRadiusLy, 3),
      lethalProxyFits: renderedRadiusLy >= LETHAL_SN_DISTANCE_LY,
      strippingProxyFits: renderedRadiusLy >= STRIPPING_SN_DISTANCE_LY,
      nearestGeneratedSystemLy: nearestGeneratedSystemValue,
      massiveCandidateCount: highlightedSystems.length,
      massiveSignalClass: massive.className,
    },
  };
}

function ghzHazardFactor(ghzProbability) {
  const ghz = clamp(finiteNumber(ghzProbability, 1), 0, 1);
  return clamp(0.85 + (1 - ghz) * 0.9, 0.85, 1.75);
}

export function estimateSupernovaExposure(inputs = {}) {
  const density = finitePositive(inputs.stellarDensityPerLy3, SOLAR_STELLAR_DENSITY_PER_LY3);
  const factor = ghzHazardFactor(inputs.ghzProbability);
  const lethalRatePerGyr =
    density * SN_RATE_PER_STAR_PER_GYR * sphereVolume(LETHAL_SN_DISTANCE_LY) * factor;
  const strippingRatePerGyr =
    density * SN_RATE_PER_STAR_PER_GYR * sphereVolume(STRIPPING_SN_DISTANCE_LY) * factor;
  const lethalInterval = intervalFromRate(lethalRatePerGyr);
  const strippingInterval = intervalFromRate(strippingRatePerGyr);
  const massive = massiveSignal(inputs);
  const sampledRadius = finitePositive(inputs.neighbourhoodRadiusLy, 0);
  const extrapolated = sampledRadius > 0 && sampledRadius < LETHAL_SN_DISTANCE_LY;

  let severity = 0.08;
  if (lethalInterval < 1) severity = 0.82;
  else if (lethalInterval < 5) severity = 0.55;
  else if (lethalInterval < 15) severity = 0.3;
  else if (lethalInterval < 60) severity = 0.18;
  if (massive.className === "nearby candidate") severity = Math.max(severity, 0.42);
  if (massive.nearestDistanceLy != null && massive.nearestDistanceLy <= STRIPPING_SN_DISTANCE_LY) {
    severity = Math.max(severity, 0.72);
  }

  return makeHazard({
    id: "nearby-supernovae",
    label: "Nearby Supernovae",
    riskNoun: "supernova exposure",
    severity,
    expectedIntervalGyr: lethalInterval,
    annualRate: lethalRatePerGyr / 1_000_000_000,
    summary:
      severity >= 0.45
        ? "Nearby supernova exposure is a meaningful external atmosphere and surface hazard on deep-time scales."
        : "Nearby supernova exposure is low on gigayear scales for the current neighbourhood.",
    affects: [
      "surface radiation",
      "ozone and atmospheric chemistry",
      "mass-extinction style events",
    ],
    drivers: [
      driver(
        "Lethal proxy interval",
        formatHazardIntervalGyr(lethalInterval),
        "10 pc / 32.6 ly screen",
      ),
      driver(
        "Atmosphere stripping proxy",
        formatHazardIntervalGyr(strippingInterval),
        "3 pc / 9.8 ly screen",
      ),
      driver("Massive-star signal", massive.className, massive.detail),
      driver("Stellar density", `${round(density, 5)} / ly^3`),
    ],
    caveats: [
      extrapolated
        ? "The lethal-distance screen extends beyond the rendered Local Cluster radius, so this result uses statistical extrapolation."
        : "",
      "This is a rate screen. It does not model explosion energy, light curves, cosmic-ray transport, isotope deposition, or biology.",
    ],
    confidence: inputs.confidence || "Low",
    sourceKeys: ["stellarNeighbourhoodHazards", "localCluster"],
  });
}

export function classifyNeighbourhoodDensity(stellarDensityPerLy3) {
  const density = finitePositive(stellarDensityPerLy3, SOLAR_STELLAR_DENSITY_PER_LY3);
  if (density < 0.001) {
    return {
      className: "sparse",
      severity: 0.08,
      description: "lower than the solar neighbourhood",
    };
  }
  if (density < 0.008) {
    return { className: "quiet", severity: 0.16, description: "solar-neighbourhood-like" };
  }
  if (density < 0.025) {
    return { className: "ordinary", severity: 0.28, description: "mildly crowded" };
  }
  if (density < 0.06) {
    return { className: "crowded", severity: 0.52, description: "crowded stellar field" };
  }
  return { className: "dense-cluster", severity: 0.78, description: "dense cluster-like field" };
}

function nearestNeighbourClass(distanceLy) {
  if (!Number.isFinite(distanceLy)) return { className: "unknown", severity: 0.12 };
  if (distanceLy < 1) return { className: "very close neighbour", severity: 0.62 };
  if (distanceLy < 4) return { className: "close neighbour", severity: 0.42 };
  if (distanceLy < 10) return { className: "ordinary spacing", severity: 0.2 };
  return { className: "wide spacing", severity: 0.1 };
}

function nearestSystemDistance(systems) {
  return (Array.isArray(systems) ? systems : []).reduce((min, system) => {
    if (system?.isHome) return min;
    const distance = finitePositive(system?.distanceLy, Number.POSITIVE_INFINITY);
    return Math.min(min, distance);
  }, Number.POSITIVE_INFINITY);
}

export function estimateCloseFlybyExposure(inputs = {}) {
  const density = finitePositive(inputs.stellarDensityPerLy3, SOLAR_STELLAR_DENSITY_PER_LY3);
  const velocityLyPerGyr =
    finitePositive(inputs.encounterSpeedKmS, DEFAULT_ENCOUNTER_SPEED_KM_S) * KM_S_TO_LY_PER_GYR;
  const oortDistanceLy = OORT_STIRRING_DISTANCE_AU / AU_PER_LY;
  const closeDistanceLy = VERY_CLOSE_FLYBY_DISTANCE_AU / AU_PER_LY;
  const oortRatePerGyr = density * velocityLyPerGyr * Math.PI * oortDistanceLy ** 2;
  const closeRatePerGyr = density * velocityLyPerGyr * Math.PI * closeDistanceLy ** 2;
  const oortInterval = intervalFromRate(oortRatePerGyr);
  const closeInterval = intervalFromRate(closeRatePerGyr);
  const nearestDistanceLy = nearestSystemDistance(inputs.systems);
  const nearest = nearestNeighbourClass(nearestDistanceLy);

  let oortSeverity = 0.12;
  if (oortInterval < 0.01) oortSeverity = 0.62;
  else if (oortInterval < 0.05) oortSeverity = 0.42;
  else if (oortInterval < 0.2) oortSeverity = 0.28;

  let closeSeverity = 0.08;
  if (closeInterval < 0.5) closeSeverity = 0.82;
  else if (closeInterval < 2) closeSeverity = 0.56;
  else if (closeInterval < 8) closeSeverity = 0.28;

  const severity = Math.max(oortSeverity, closeSeverity, nearest.severity * 0.7);

  return makeHazard({
    id: "stellar-flybys",
    label: "Stellar Flybys",
    riskNoun: "flyby exposure",
    severity,
    expectedIntervalGyr: oortInterval,
    annualRate: oortRatePerGyr / 1_000_000_000,
    summary:
      severity >= 0.45
        ? "Passing stars can repeatedly stir wide reservoirs and may become a notable long-term architecture pressure."
        : "Close stellar flybys are mainly an outer-reservoir concern; direct inner-system disruption is rare.",
    affects: [
      "Oort cloud stirring",
      "wide-orbit stripping",
      "extreme close-encounter architecture stress",
    ],
    drivers: [
      driver(
        "Oort-stirring interval",
        formatHazardIntervalGyr(oortInterval),
        "10,000 AU encounter screen",
      ),
      driver(
        "Very-close interval",
        formatHazardIntervalGyr(closeInterval),
        "1,000 AU encounter screen",
      ),
      driver(
        "Nearest generated system",
        formatHazardDistanceLy(nearestDistanceLy),
        nearest.className,
      ),
      driver("Encounter speed", `${round(velocityLyPerGyr / KM_S_TO_LY_PER_GYR, 1)} km/s`),
    ],
    caveats: [
      "Encounter rates are analytic cross-section estimates, not integrated flyby histories.",
      "Only exceptionally close encounters are treated as direct inner-planet architecture risks.",
    ],
    confidence: inputs.confidence || "Low",
    sourceKeys: ["stellarNeighbourhoodHazards", "localCluster"],
  });
}

function reservoirInjectionScore({ oortCloud, smallBodyReservoirContext }) {
  const contextScore = firstFinite(smallBodyReservoirContext?.outputs?.oortInjectionScore);
  if (contextScore != null) return clamp(contextScore, 0, 1);
  const rate = finitePositive(oortCloud?.injectionRatePerYear, 0);
  if (rate >= 10) return 0.9;
  if (rate >= 2) return 0.65;
  if (rate >= 0.2) return 0.35;
  if (rate > 0) return 0.16;
  return 0;
}

function reservoirMassScore(oortCloud) {
  const mass = finitePositive(oortCloud?.estimatedMassMearth, 0);
  if (mass >= 10) return 0.9;
  if (mass >= 3) return 0.65;
  if (mass >= 0.5) return 0.36;
  if (mass > 0) return 0.12;
  return 0;
}

export function estimateCometShowerExposure(inputs = {}) {
  const injectionScore = reservoirInjectionScore(inputs);
  const massScore = reservoirMassScore(inputs.oortCloud);
  const impactScore = clamp(
    firstFinite(inputs.smallBodyReservoirContext?.outputs?.impactFluxScore, 0) ?? 0,
    0,
    1,
  );
  const flybySeverity = finitePositive(inputs.flybyHazard?.severity, 0);
  const oortPresent = inputs.oortCloud?.present === true || injectionScore > 0.1 || massScore > 0.2;
  const severity = oortPresent
    ? clamp(
        0.36 * injectionScore + 0.3 * flybySeverity + 0.2 * massScore + 0.14 * impactScore,
        0,
        1,
      )
    : clamp(0.16 * flybySeverity + 0.1 * impactScore, 0, 0.22);
  const interval = inputs.flybyHazard?.expectedIntervalGyr || Number.POSITIVE_INFINITY;

  return makeHazard({
    id: "comet-showers",
    label: "Comet Showers",
    riskNoun: "comet-shower potential",
    severity,
    expectedIntervalGyr: interval,
    annualRate: inputs.flybyHazard?.annualRate || null,
    summary:
      severity >= 0.45
        ? "The system is comet-shower prone because flyby exposure is coupled to an active outer reservoir."
        : oortPresent
          ? "The Oort reservoir can supply background comet injection, but episodic shower risk is limited."
          : "No strong Oort reservoir is available, so comet-shower potential is weak.",
    affects: ["impact flux", "volatile delivery", "crater retention", "outer-reservoir depletion"],
    drivers: [
      driver(
        "Oort injection",
        broadClass(injectionScore, {
          high: "strong",
          medium: "present",
          low: "weak",
          none: "none",
        }),
      ),
      driver(
        "Oort reservoir",
        cleanText(inputs.oortCloud?.formationClass, oortPresent ? "present" : "not present"),
        `${round(finitePositive(inputs.oortCloud?.estimatedMassMearth, 0), 2)} Earth masses`,
      ),
      driver("Flyby coupling", inputs.flybyHazard?.riskClass || "unavailable"),
      driver(
        "Impact context",
        inputs.smallBodyReservoirContext?.outputs?.impactFluxClass || "not available",
      ),
    ],
    caveats: [
      "Comet showers are inferred from reservoir and encounter pressure; individual comet injections are not simulated.",
    ],
    confidence: inputs.confidence || "Low",
    sourceKeys: ["stellarNeighbourhoodHazards", "smallBodyReservoir"],
  });
}

export function estimateDenseClusterStress(inputs = {}) {
  const density = classifyNeighbourhoodDensity(inputs.stellarDensityPerLy3);
  const nearestDistanceLy = nearestSystemDistance(inputs.systems);
  const nearest = nearestNeighbourClass(nearestDistanceLy);
  const ghz = clamp(finiteNumber(inputs.ghzProbability, 1), 0, 1);
  const ghzPenalty = ghz < 0.35 ? 0.18 : ghz < 0.65 ? 0.08 : 0;
  const severity = clamp(Math.max(density.severity, nearest.severity) + ghzPenalty, 0, 1);

  return makeHazard({
    id: "dense-cluster-stress",
    label: "Dense-Cluster Stress",
    riskNoun: "cluster stress",
    severity,
    expectedIntervalGyr: null,
    annualRate: null,
    summary:
      severity >= 0.45
        ? "The local density makes external perturbation part of the system's deep-time identity."
        : "The local stellar field is not crowded enough to dominate the system's long-term story.",
    affects: [
      "encounter frequency",
      "outer-reservoir survival",
      "long-term habitability confidence",
    ],
    drivers: [
      driver("Density class", density.className, density.description),
      driver(
        "Stellar density",
        `${round(finitePositive(inputs.stellarDensityPerLy3, 0), 5)} / ly^3`,
      ),
      driver("Nearest neighbour", formatHazardDistanceLy(nearestDistanceLy), nearest.className),
      driver("GHZ probability", `${round(ghz * 100, 1)}%`),
    ],
    caveats: [
      "Dense-cluster stress is a qualitative pressure screen, not a cluster orbit or birth-environment reconstruction.",
    ],
    confidence: inputs.confidence || "Low",
    sourceKeys: ["stellarNeighbourhoodHazards", "localCluster"],
  });
}

function estimateSystemSurvival({ supernova, flyby, comet, dense, confidence }) {
  const strongest = [supernova, flyby, comet, dense].reduce((best, item) =>
    item.severity > best.severity ? item : best,
  );
  const severity = clamp(Math.max(strongest.severity * 0.95, dense.severity * 0.9), 0, 1);
  const survivalClass =
    severity >= 0.72
      ? "crowded/disruptive"
      : severity >= 0.45
        ? "externally stirred"
        : severity >= 0.22
          ? "reservoir stressed"
          : "calm";
  return makeHazard({
    id: "system-survival",
    label: "Long-Term System Survival",
    riskNoun: "survival pressure",
    severity,
    expectedIntervalGyr: strongest.expectedIntervalGyr,
    annualRate: strongest.annualRate,
    summary:
      survivalClass === "calm"
        ? "External neighbourhood hazards do not dominate the current long-term system story."
        : `The system is ${survivalClass}; ${strongest.label.toLowerCase()} is the strongest external driver.`,
    affects: ["worldbuilding timescale", "outer reservoirs", "System Fate caveats"],
    drivers: [
      driver("Survival class", survivalClass),
      driver("Dominant driver", strongest.label, strongest.riskClass),
      driver("Confidence", confidence),
    ],
    caveats: ["This is a synthesis of hazard screens, not a proof of system survival or loss."],
    confidence,
    sourceKeys: ["stellarNeighbourhoodHazards"],
  });
}

function confidenceFor({ hasLocalContext, systems, oortCloud, smallBodyReservoirContext, world }) {
  let evidence = 0;
  if (hasLocalContext) evidence += 1;
  if ((Array.isArray(systems) ? systems : []).length > 1) evidence += 1;
  if (oortCloud?.present || smallBodyReservoirContext) evidence += 1;
  if (orderedItems(world?.planets).length || orderedItems(world?.moons).length) evidence += 1;
  if (evidence >= 3) return "High";
  if (evidence >= 2) return "Medium";
  return "Low";
}

function bodyAtmospherePressure(entry) {
  return (
    firstFinite(
      entry?.inputs?.pressureAtm,
      entry?.pressureAtm,
      entry?.model?.inputs?.pressureAtm,
      0,
    ) ?? 0
  );
}

function bodyOrbitAu(entry) {
  return firstFinite(
    entry?.inputs?.semiMajorAxisAu,
    entry?.semiMajorAxisAu,
    entry?.au,
    entry?.orbitAu,
    entry?.model?.inputs?.semiMajorAxisAu,
  );
}

function consequenceForRocky({ entry, kind, supernova, comet }) {
  const pressure = bodyAtmospherePressure(entry);
  const hasAtmosphere = pressure > 0.01;
  const orbit = bodyOrbitAu(entry);
  if (hasAtmosphere && supernova.severity >= Math.max(comet.severity, 0.22)) {
    return {
      group: "atmospheres",
      consequenceClass:
        supernova.severity >= 0.45 ? "atmosphere and surface watch" : "low atmosphere exposure",
      summary:
        supernova.severity >= 0.45
          ? `${kind} atmosphere and surface chemistry are the main external-hazard touchpoints.`
          : `${kind} has atmosphere context, but external supernova exposure is low.`,
      hazardIds: ["nearby-supernovae"],
      drivers: [`pressure ${round(pressure, 3)} atm`, supernova.riskClass],
    };
  }
  if (comet.severity >= 0.22) {
    return {
      group: "impacts",
      consequenceClass: comet.severity >= 0.45 ? "comet-shower watch" : "impact background watch",
      summary: `${kind} is mainly affected through impact-flux and volatile-delivery context.`,
      hazardIds: ["comet-showers"],
      drivers: [
        comet.riskClass,
        orbit == null ? "orbit unavailable" : `orbit ${round(orbit, 3)} AU`,
      ],
    };
  }
  return {
    group: "insulated",
    consequenceClass: "low direct exposure",
    summary: `${kind} has no strong direct external-neighbourhood hazard in this model.`,
    hazardIds: [],
    drivers: ["external hazards are weak or indirect"],
  };
}

function addAffected(entries, item) {
  entries.push({
    id: cleanText(item.id, `${item.kind}:${entries.length + 1}`),
    name: cleanText(item.name, "Unnamed body"),
    kind: item.kind,
    group: item.group,
    groupLabel: GROUP_LABELS[item.group] || item.group,
    consequenceClass: item.consequenceClass,
    summary: sentence(item.summary),
    hazardIds: Array.isArray(item.hazardIds) ? item.hazardIds : [],
    drivers: Array.isArray(item.drivers) ? item.drivers.filter(Boolean) : [],
    confidence: item.confidence || "Low",
  });
}

export function buildAffectedWorlds({ world, hazards, oortCloud, smallBodyReservoirContext } = {}) {
  const affected = [];
  const byId = new Map((hazards || []).map((hazard) => [hazard.id, hazard]));
  const supernova = byId.get("nearby-supernovae") || { severity: 0, riskClass: "" };
  const comet = byId.get("comet-showers") || { severity: 0, riskClass: "" };

  for (const planet of orderedItems(world?.planets)) {
    const consequence = consequenceForRocky({ entry: planet, kind: "Planet", supernova, comet });
    addAffected(affected, {
      id: `planet:${planet?.id || bodyName(planet, "planet")}`,
      name: bodyName(planet, "Planet"),
      kind: "Planet",
      confidence: "Medium",
      ...consequence,
    });
  }

  for (const moon of orderedItems(world?.moons)) {
    const consequence = consequenceForRocky({ entry: moon, kind: "Moon", supernova, comet });
    addAffected(affected, {
      id: `moon:${moon?.id || bodyName(moon, "moon")}`,
      name: bodyName(moon, "Moon"),
      kind: "Moon",
      confidence: "Medium",
      ...consequence,
    });
  }

  for (const giant of orderedItems(world?.system?.gasGiants)) {
    addAffected(affected, {
      id: `gasGiant:${giant?.id || bodyName(giant, "giant")}`,
      name: bodyName(giant, "Gas giant"),
      kind: "Gas giant",
      group: comet.severity >= 0.45 ? "impacts" : "insulated",
      consequenceClass: comet.severity >= 0.45 ? "comet-scattering context" : "mostly indirect",
      summary:
        comet.severity >= 0.45
          ? "Giant-planet architecture can shape comet injection and scattering."
          : "External neighbourhood hazards mostly affect this giant indirectly through reservoirs.",
      hazardIds: comet.severity >= 0.45 ? ["comet-showers"] : [],
      drivers: [comet.riskClass || "low comet-shower potential"],
      confidence: "Medium",
    });
  }

  for (const disk of orderedItems(world?.system?.debrisDisks)) {
    addAffected(affected, {
      id: `debrisDisk:${disk?.id || bodyName(disk, "debris-disk")}`,
      name: bodyName(disk, "Debris disk"),
      kind: "Debris disk",
      group: "reservoirs",
      consequenceClass: "outer-reservoir context",
      summary:
        "Outer small-body material is sensitive to encounter and impact-flux interpretation.",
      hazardIds: ["stellar-flybys", "comet-showers"],
      drivers: [smallBodyReservoirContext?.outputs?.debrisFluxClass || "debris context available"],
      confidence: "Medium",
    });
  }

  if (oortCloud?.present || finitePositive(oortCloud?.estimatedMassMearth, 0) > 0) {
    addAffected(affected, {
      id: "oort:reservoir",
      name: "Oort cloud reservoir",
      kind: "Outer reservoir",
      group: "reservoirs",
      consequenceClass:
        comet.severity >= 0.45 ? "shower-prone reservoir" : "background injection reservoir",
      summary:
        comet.severity >= 0.45
          ? "The Oort reservoir is the main route from flyby exposure to comet showers."
          : "The Oort reservoir contributes long-period comet background context.",
      hazardIds: ["stellar-flybys", "comet-showers"],
      drivers: [
        cleanText(oortCloud?.formationClass, "Oort model"),
        `${round(finitePositive(oortCloud?.injectionRatePerYear, 0), 3)} LPC/year`,
      ],
      confidence: cleanText(oortCloud?.confidence, "Medium"),
    });
  }

  for (const cometEntry of orderedItems(world?.system?.comets)) {
    addAffected(affected, {
      id: `comet:${cometEntry?.id || bodyName(cometEntry, "comet")}`,
      name: bodyName(cometEntry, "Comet"),
      kind: "Comet",
      group: "reservoirs",
      consequenceClass: "authored comet context",
      summary: "Authored comets provide explicit small-body evidence for the hazard read.",
      hazardIds: ["comet-showers"],
      drivers: [cleanText(cometEntry?.sourceReservoir, "manual source")],
      confidence: "Medium",
    });
  }

  return affected;
}

function kpi(id, label, value, meta, tone = "neutral", tip = "") {
  return { id, label, value, meta, tone, tip };
}

function buildKpis({ survival, dominantHazard, supernova, flyby, comet, confidence }) {
  return [
    kpi("overall-risk", "Overall Risk", survival.riskClass, survival.summary, survival.tone),
    kpi(
      "dominant-hazard",
      "Dominant Hazard",
      dominantHazard.label,
      dominantHazard.reason,
      dominantHazard.tone,
    ),
    kpi(
      "supernova-interval",
      "Supernova Interval",
      supernova.intervalLabel,
      "lethal-distance proxy",
      supernova.tone,
    ),
    kpi("flyby-interval", "Flyby Interval", flyby.intervalLabel, "Oort-stirring proxy", flyby.tone),
    kpi(
      "comet-shower",
      "Comet-Shower Potential",
      comet.riskClass,
      "reservoir plus flyby synthesis",
      comet.tone,
    ),
    kpi(
      "confidence",
      "Confidence",
      confidence,
      "model readiness",
      confidence === "High" ? "good" : confidence === "Medium" ? "caution" : "warn",
    ),
  ];
}

function buildKeyReadings({ density, supernova, flyby, comet, survival }) {
  return [
    {
      id: "neighbourhood",
      label: "Neighbourhood",
      value: `${density.className}: ${density.description}.`,
      tone: riskTone(density.severity),
    },
    {
      id: "external-events",
      label: "External Events",
      value: `${supernova.label}: ${supernova.riskClass}; ${flyby.label}: ${flyby.riskClass}.`,
      tone: riskTone(Math.max(supernova.severity, flyby.severity)),
    },
    {
      id: "reservoirs",
      label: "Reservoirs",
      value: comet.summary,
      tone: comet.tone,
    },
    {
      id: "watch",
      label: "Watch",
      value: survival.summary,
      tone: survival.tone,
    },
  ];
}

function buildHazardSignals({ density, supernova, flyby, comet }) {
  const massiveDriver = supernova.drivers.find((item) => item.label === "Massive-star signal");
  return [
    {
      id: "neighbourhood",
      label: "Neighbourhood",
      value: density.className,
      meta: density.description,
      tone: riskTone(density.severity),
    },
    {
      id: "massive-star",
      label: "Massive-star signal",
      value: massiveDriver?.value || "unknown",
      meta: massiveDriver?.detail || "",
      tone: supernova.tone,
    },
    {
      id: "flyby",
      label: "Flyby exposure",
      value: broadClass(flyby.severity, {
        high: "frequent",
        medium: "occasional",
        low: "rare",
        none: "minimal",
      }),
      meta: flyby.intervalLabel,
      tone: flyby.tone,
    },
    {
      id: "oort",
      label: "Oort sensitivity",
      value: broadClass(comet.severity, {
        high: "shower-prone",
        medium: "present",
        low: "weak",
        none: "none",
      }),
      meta: comet.riskClass,
      tone: comet.tone,
    },
  ];
}

function buildReport({ headline, summary, hazards, affectedWorlds, confidence }) {
  const topHazards = hazards
    .filter((hazard) => hazard.id !== "system-survival")
    .sort((left, right) => right.severity - left.severity)
    .slice(0, 3);
  const affectedNames = affectedWorlds
    .slice(0, 4)
    .map((item) => item.name)
    .join(", ");
  const lines = [
    `# Stellar Neighbourhood Hazards`,
    "",
    `**Summary:** ${headline}`,
    "",
    summary,
    "",
    `**Confidence:** ${confidence}`,
    "",
    `**Top external hazards:**`,
    ...topHazards.map(
      (hazard) => `- ${hazard.label}: ${hazard.riskClass} (${hazard.intervalLabel})`,
    ),
    "",
    `**Affected worlds/reservoirs:** ${affectedNames || "No saved bodies or reservoirs were available."}`,
    "",
    `This is an analytic hazard screen, not a stochastic event simulation.`,
  ];
  return {
    compact: `${headline} Confidence: ${confidence}. Dominant external hazard: ${topHazards[0]?.label || "none"}.`,
    markdown: lines.join("\n"),
    lines,
  };
}

function dominantFrom(hazards) {
  const candidates = hazards.filter((hazard) => hazard.id !== "system-survival");
  const dominant = candidates.reduce(
    (best, item) => (item.severity > best.severity ? item : best),
    candidates[0],
  );
  if (!dominant) {
    return {
      id: "none",
      label: "No dominant hazard",
      className: "minimal",
      severity: 0,
      tone: "good",
      reason: "No hazard model outputs were available.",
    };
  }
  return {
    id: dominant.id,
    label: dominant.label,
    className: dominant.riskClass,
    severity: dominant.severity,
    tone: dominant.tone,
    reason: dominant.summary,
  };
}

export function buildStellarNeighbourhoodHazardModel(inputs = {}) {
  const cluster = normalizeClusterModel(inputs);
  const clusterModel = cluster.model;
  const clusterInputs = cluster.inputs || LOCAL_CLUSTER_DEFAULTS;
  const systems = Array.isArray(inputs.systems)
    ? inputs.systems
    : Array.isArray(clusterModel?.systems)
      ? clusterModel.systems
      : [];
  const stellarRows = Array.isArray(inputs.stellarRows)
    ? inputs.stellarRows
    : Array.isArray(clusterModel?.stellarRows)
      ? clusterModel.stellarRows
      : [];
  const stellarDensityPerLy3 = finitePositive(
    firstFinite(inputs.stellarDensityPerLy3, clusterInputs.stellarDensityPerLy3),
    SOLAR_STELLAR_DENSITY_PER_LY3,
  );
  const neighbourhoodRadiusLy = finitePositive(
    firstFinite(inputs.neighbourhoodRadiusLy, clusterInputs.neighbourhoodRadiusLy),
    LOCAL_CLUSTER_DEFAULTS.neighbourhoodRadiusLy,
  );
  const ghzProbability = clamp(
    firstFinite(inputs.ghzProbability, clusterModel?.ghzProbability, 1) ?? 1,
    0,
    1,
  );
  const world = inputs.world || {};
  const oortCloud = inputs.oortCloud || null;
  const smallBodyReservoirContext = inputs.smallBodyReservoirContext || null;
  const confidence =
    inputs.confidence ||
    confidenceFor({
      hasLocalContext: cluster.hasLocalContext,
      systems,
      oortCloud,
      smallBodyReservoirContext,
      world,
    });
  const shared = {
    stellarDensityPerLy3,
    neighbourhoodRadiusLy,
    ghzProbability,
    systems,
    stellarRows,
    confidence,
  };
  const supernova = estimateSupernovaExposure(shared);
  const flyby = estimateCloseFlybyExposure(shared);
  const comet = estimateCometShowerExposure({
    ...shared,
    flybyHazard: flyby,
    oortCloud,
    smallBodyReservoirContext,
  });
  const dense = estimateDenseClusterStress(shared);
  const survival = estimateSystemSurvival({ supernova, flyby, comet, dense, confidence });
  const hazards = [supernova, flyby, comet, dense, survival];
  const dominantHazard = dominantFrom(hazards);
  const density = classifyNeighbourhoodDensity(stellarDensityPerLy3);
  const affectedWorlds = buildAffectedWorlds({
    world,
    hazards,
    oortCloud,
    smallBodyReservoirContext,
  });
  const assumptions = [
    cluster.hasLocalContext
      ? "Local Cluster inputs provide the neighbourhood density and generated systems."
      : "No explicit Local Cluster context was supplied; default solar-neighbourhood density is used with low confidence.",
    "Supernova and flyby outputs are broad rate screens, not scheduled events.",
    "Comet-shower risk reuses Oort and small-body reservoir context where available.",
  ];
  const limitingFactors = [
    neighbourhoodRadiusLy < LETHAL_SN_DISTANCE_LY
      ? "The supernova lethal-distance proxy extends beyond the rendered Local Cluster radius."
      : "",
    !oortCloud && !smallBodyReservoirContext
      ? "No Oort or small-body reservoir context was available for comet-shower interpretation."
      : "",
    !affectedWorlds.length
      ? "No saved bodies or reservoirs were available for affected-world grouping."
      : "",
  ].filter(Boolean);
  const headline =
    survival.severity >= 0.45
      ? `${dominantHazard.label} dominates the external deep-time hazard read.`
      : `${density.className} neighbourhood exposure; ${dominantHazard.label.toLowerCase()} is the main watch item.`;
  const summary =
    survival.severity >= 0.45
      ? `${dominantHazard.reason} Use the hazard cards to separate direct atmosphere/surface risks from outer-reservoir effects.`
      : `The saved system sits in a ${density.description} environment. External hazards are mostly long-timescale context rather than immediate architecture changes.`;
  const report = buildReport({ headline, summary, hazards, affectedWorlds, confidence });
  const hazardMap = buildStellarNeighbourhoodHazardMap({
    systems,
    stellarRows,
    hazards,
    dominantHazard,
    confidence,
    neighbourhoodRadiusLy,
  });

  return {
    modelVersion: MODEL_VERSION,
    subjectKind: "system",
    status: "supported",
    confidence,
    headline,
    summary,
    dominantHazard,
    kpis: buildKpis({ survival, dominantHazard, supernova, flyby, comet, confidence }),
    keyReadings: buildKeyReadings({ density, supernova, flyby, comet, survival }),
    hazardSignals: buildHazardSignals({ density, supernova, flyby, comet }),
    hazardMap,
    hazards,
    affectedWorlds,
    affectedGroups: Object.entries(GROUP_LABELS).map(([id, label]) => ({
      id,
      label,
      count: affectedWorlds.filter((item) => item.group === id).length,
    })),
    assumptions,
    limitingFactors,
    inputs: {
      stellarDensityPerLy3: round(stellarDensityPerLy3, 6),
      neighbourhoodRadiusLy: round(neighbourhoodRadiusLy, 3),
      ghzProbability: round(ghzProbability, 3),
      systemCount: systems.length,
      hasLocalContext: cluster.hasLocalContext,
      oortPresent: oortCloud?.present === true,
      affectedWorldCount: affectedWorlds.length,
    },
    report,
  };
}

export function buildStellarNeighbourhoodHazardModelForWorld(world = {}, options = {}) {
  const starConfig = resolveWorldStarConfig(world);
  const clusterInputs = {
    ...LOCAL_CLUSTER_DEFAULTS,
    ...(world?.cluster || world?.galaxy || {}),
    ...(options.clusterInputs || {}),
  };
  const localClusterModel =
    options.localClusterModel ||
    calcLocalCluster({
      ...clusterInputs,
      homeMetallicityFeH: world?.star?.metallicityFeH ?? starConfig.metallicityFeH,
    });
  const gasGiants = orderedItems(world?.system?.gasGiants);
  const autoOortModel = calcOortCloud({
    starMassMsol: starConfig.massMsol,
    starAgeGyr: starConfig.ageGyr,
    locationLy: clusterInputs.locationLy,
    galactocentricDistanceLy: clusterInputs.galactocentricDistanceLy,
    stellarDensityPerLy3: clusterInputs.stellarDensityPerLy3,
    gasGiants,
  });
  const oortCloud =
    options.oortCloud ||
    resolveOortCloudModel({
      autoModel: autoOortModel,
      config: world?.system?.oortCloud,
    }).resolved;
  const fallbackHostFrameId = cleanText(world?.star?.id, "star_a");
  const smallBodyReservoirContext =
    options.smallBodyReservoirContext ||
    buildSmallBodyReservoirContextForWorld(world, {
      fallbackHostFrameId,
      gasGiants,
      hostFrameId: options.hostFrameId || fallbackHostFrameId,
      primaryStar: world?.star || null,
      starConfig,
    });

  return buildStellarNeighbourhoodHazardModel({
    ...options,
    world,
    clusterInputs,
    localClusterModel,
    systems: options.systems || localClusterModel.systems,
    oortCloud,
    smallBodyReservoirContext,
  });
}

export { GROUP_LABELS as STELLAR_NEIGHBOURHOOD_HAZARD_GROUP_LABELS };
