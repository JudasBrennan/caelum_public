import { computeStarXuvFluxRatioEarth } from "../star.js";
import { clamp } from "../utils.js";

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSampleCount(value) {
  const parsed = Math.round(toFiniteNumber(value, 24));
  return Math.max(8, Math.min(96, parsed));
}

function solveEccentricAnomaly(meanAnomalyRad, eccentricity) {
  const e = clamp(toFiniteNumber(eccentricity, 0), 0, 0.95);
  let eccentricAnomaly = e < 0.8 ? meanAnomalyRad : Math.PI;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const f = eccentricAnomaly - e * Math.sin(eccentricAnomaly) - meanAnomalyRad;
    const fp = 1 - e * Math.cos(eccentricAnomaly);
    if (Math.abs(fp) < 1e-9) break;
    eccentricAnomaly -= f / fp;
  }
  return eccentricAnomaly;
}

export function sampleBinarySeparationAu({
  semiMajorAxisAu,
  eccentricity = 0,
  meanAnomalyDeg = 0,
  sampleCount = 24,
}) {
  const aBinary = Math.max(toFiniteNumber(semiMajorAxisAu, 0), 0);
  if (aBinary <= 0) return [];
  const eBinary = clamp(toFiniteNumber(eccentricity, 0), 0, 0.95);
  const samples = [];
  const count = normalizeSampleCount(sampleCount);
  const meanAnomalyOffsetRad = (toFiniteNumber(meanAnomalyDeg, 0) * Math.PI) / 180;
  for (let index = 0; index < count; index += 1) {
    const meanAnomalyRad = meanAnomalyOffsetRad + (2 * Math.PI * index) / count;
    const eccentricAnomaly = solveEccentricAnomaly(meanAnomalyRad, eBinary);
    const separationAu = aBinary * (1 - eBinary * Math.cos(eccentricAnomaly));
    samples.push(Math.max(separationAu, 1e-6));
  }
  return samples;
}

function summariseSamples(samples) {
  if (!samples.length) return { mean: 0, min: 0, max: 0 };
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const sample of samples) {
    sum += sample;
    if (sample < min) min = sample;
    if (sample > max) max = sample;
  }
  return {
    mean: sum / samples.length,
    min,
    max,
  };
}

function sumCompanionVisibleFluxEarth(companionStarIds, starsById, distanceAu) {
  let fluxEarth = 0;
  for (const starId of companionStarIds) {
    const starContext = starsById[starId];
    if (!starContext) continue;
    fluxEarth += Number(starContext.model?.luminosityLsol || 0) / distanceAu ** 2;
  }
  return fluxEarth;
}

function sumCompanionXuvFluxEarth(companionStarIds, starsById, distanceAu) {
  let fluxRatioEarth = 0;
  for (const starId of companionStarIds) {
    const starContext = starsById[starId];
    if (!starContext) continue;
    fluxRatioEarth += computeStarXuvFluxRatioEarth({
      massMsol: starContext.config?.massMsol,
      ageGyr: starContext.config?.ageGyr,
      luminosityLsol: starContext.model?.luminosityLsol,
      orbitAu: distanceAu,
    });
  }
  return fluxRatioEarth;
}

function sumHostVisibleFluxEarth(starIds, starsById) {
  let fluxEarth = 0;
  for (const starId of starIds || []) {
    const starContext = starsById[starId];
    if (!starContext) continue;
    fluxEarth += Number(starContext.model?.luminosityLsol || 0);
  }
  return fluxEarth;
}

function sumHostXuvFluxEarthAt1Au(starIds, starsById) {
  let fluxRatioEarth = 0;
  for (const starId of starIds || []) {
    const starContext = starsById[starId];
    if (!starContext) continue;
    fluxRatioEarth += computeStarXuvFluxRatioEarth({
      massMsol: starContext.config?.massMsol,
      ageGyr: starContext.config?.ageGyr,
      luminosityLsol: starContext.model?.luminosityLsol,
      orbitAu: 1,
    });
  }
  return fluxRatioEarth;
}

function resolveDominantContributorId(starIds, starsById) {
  let bestStarId = starIds?.[0] || null;
  let bestLuminosity = -1;
  for (const starId of starIds || []) {
    const luminosity = Number(starsById?.[starId]?.model?.luminosityLsol || 0);
    if (luminosity > bestLuminosity) {
      bestLuminosity = luminosity;
      bestStarId = starId;
    }
  }
  return bestStarId;
}

function buildFluxLayerFromPair({ pairId, pair, companionNodeId, companionStarIds, starsById }) {
  const distancesAu = sampleBinarySeparationAu({
    semiMajorAxisAu: pair?.semiMajorAxisAu,
    eccentricity: pair?.eccentricity,
    meanAnomalyDeg: pair?.meanAnomalyDeg,
  });
  const visibleSamples = distancesAu.map((distanceAu) =>
    sumCompanionVisibleFluxEarth(companionStarIds, starsById, distanceAu),
  );
  const xuvSamples = distancesAu.map((distanceAu) =>
    sumCompanionXuvFluxEarth(companionStarIds, starsById, distanceAu),
  );
  return {
    pairId,
    companionNodeId,
    companionStarIds: [...companionStarIds],
    visibleSamples,
    xuvSamples,
    separationSummaryAu: summariseSamples(distancesAu),
    visibleSummary: summariseSamples(visibleSamples),
    xuvSummary: summariseSamples(xuvSamples),
    eccentricity: toFiniteNumber(pair?.eccentricity, 0),
  };
}

function combineSampleLayers(layers, key) {
  if (!Array.isArray(layers) || !layers.length) return [];
  const sampleCount = Math.max(...layers.map((layer) => layer?.[key]?.length || 0), 0);
  if (sampleCount <= 0) return [];
  const samples = new Array(sampleCount).fill(0);
  for (const layer of layers) {
    const layerSamples = Array.isArray(layer?.[key]) ? layer[key] : [];
    for (let index = 0; index < sampleCount; index += 1) {
      samples[index] += Number(layerSamples[index] || 0);
    }
  }
  return samples;
}

export function buildHierarchicalFluxModel({
  hostNodeId,
  dominantStarIds,
  topology,
  pairsById,
  starsById,
  nodeLabelsById = {},
}) {
  const hostVisibleFluxEarth = sumHostVisibleFluxEarth(dominantStarIds, starsById);
  const hostXuvFluxEarth = sumHostXuvFluxEarthAt1Au(dominantStarIds, starsById);
  const companionLayers = [];
  const companionStarIds = [];
  const ancestorPairIds = Array.isArray(topology?.ancestorPairIdsByNodeId?.[hostNodeId])
    ? topology.ancestorPairIdsByNodeId[hostNodeId]
    : [];
  let currentNodeId = hostNodeId;

  for (const pairId of ancestorPairIds) {
    const pair = pairsById?.[pairId];
    if (!pair) {
      currentNodeId = pairId;
      continue;
    }
    const companionNode =
      pair.childA?.id === currentNodeId
        ? pair.childB
        : pair.childB?.id === currentNodeId
          ? pair.childA
          : null;
    const nextNodeId = pairId;
    if (!companionNode?.id) {
      currentNodeId = nextNodeId;
      continue;
    }
    const branchStarIds = topology?.leafStarIdsByNodeId?.[companionNode.id] || [];
    if (!branchStarIds.length) {
      currentNodeId = nextNodeId;
      continue;
    }
    const layer = buildFluxLayerFromPair({
      pairId,
      pair,
      companionNodeId: companionNode.id,
      companionStarIds: branchStarIds,
      starsById,
    });
    companionLayers.push({
      ...layer,
      label: nodeLabelsById?.[companionNode.id] || companionNode.id,
      hierarchyLevel: companionLayers.length + 1,
    });
    companionStarIds.push(...branchStarIds);
    currentNodeId = nextNodeId;
  }

  if (!companionLayers.length) {
    return {
      meanVisibleFluxEarth: hostVisibleFluxEarth,
      peakVisibleFluxEarth: hostVisibleFluxEarth,
      minVisibleFluxEarth: hostVisibleFluxEarth,
      meanCompanionFluxEarth: 0,
      peakCompanionFluxEarth: 0,
      minCompanionFluxEarth: 0,
      fluxVariabilityFraction: 0,
      meanXuvFluxEarth: hostXuvFluxEarth,
      meanCompanionXuvFluxEarth: 0,
      dominantContributorId: resolveDominantContributorId(dominantStarIds, starsById),
      companionLayers: [],
      companionStarIds: [],
    };
  }

  const visibleSamples = combineSampleLayers(companionLayers, "visibleSamples");
  const xuvSamples = combineSampleLayers(companionLayers, "xuvSamples");
  const visible = summariseSamples(visibleSamples);
  const xuv = summariseSamples(xuvSamples);
  const meanVisibleFluxEarth = hostVisibleFluxEarth + visible.mean;
  const peakVisibleFluxEarth = hostVisibleFluxEarth + visible.max;
  const minVisibleFluxEarth = hostVisibleFluxEarth + visible.min;
  const dominantContributorId =
    hostVisibleFluxEarth >= visible.mean
      ? resolveDominantContributorId(dominantStarIds, starsById)
      : resolveDominantContributorId(companionStarIds, starsById);

  return {
    meanVisibleFluxEarth,
    peakVisibleFluxEarth,
    minVisibleFluxEarth,
    meanCompanionFluxEarth: visible.mean,
    peakCompanionFluxEarth: visible.max,
    minCompanionFluxEarth: visible.min,
    fluxVariabilityFraction:
      meanVisibleFluxEarth > 0
        ? (peakVisibleFluxEarth - minVisibleFluxEarth) / meanVisibleFluxEarth
        : 0,
    meanXuvFluxEarth: hostXuvFluxEarth + xuv.mean,
    meanCompanionXuvFluxEarth: xuv.mean,
    dominantContributorId,
    companionLayers: companionLayers.map((layer) => ({
      pairId: layer.pairId,
      companionNodeId: layer.companionNodeId,
      companionStarIds: [...layer.companionStarIds],
      label: layer.label,
      hierarchyLevel: layer.hierarchyLevel,
      separationSummaryAu: { ...layer.separationSummaryAu },
      eccentricity: layer.eccentricity,
      meanVisibleFluxEarth: layer.visibleSummary.mean,
      peakVisibleFluxEarth: layer.visibleSummary.max,
      minVisibleFluxEarth: layer.visibleSummary.min,
      meanXuvFluxEarth: layer.xuvSummary.mean,
    })),
    companionStarIds,
  };
}

export function buildSingleStarFluxModel({ dominantStars, hostStarId, starsById }) {
  const hostStar = starsById[hostStarId];
  const hostLuminosityLsol = Number(hostStar?.model?.luminosityLsol || 0);
  const hostXuvAt1AuEarth = computeStarXuvFluxRatioEarth({
    massMsol: hostStar?.config?.massMsol,
    ageGyr: hostStar?.config?.ageGyr,
    luminosityLsol: hostLuminosityLsol,
    orbitAu: 1,
  });
  return {
    meanVisibleFluxEarth: hostLuminosityLsol,
    peakVisibleFluxEarth: hostLuminosityLsol,
    minVisibleFluxEarth: hostLuminosityLsol,
    meanCompanionFluxEarth: 0,
    peakCompanionFluxEarth: 0,
    minCompanionFluxEarth: 0,
    fluxVariabilityFraction: 0,
    meanXuvFluxEarth: hostXuvAt1AuEarth,
    meanCompanionXuvFluxEarth: 0,
    dominantContributorId: resolveDominantContributorId(dominantStars, starsById),
  };
}

export function buildCircumstellarFluxModel({ hostStarId, companionStarIds, pair, starsById }) {
  const hostStar = starsById[hostStarId];
  const hostLuminosityLsol = Number(hostStar?.model?.luminosityLsol || 0);
  const hostXuvAt1AuEarth = computeStarXuvFluxRatioEarth({
    massMsol: hostStar?.config?.massMsol,
    ageGyr: hostStar?.config?.ageGyr,
    luminosityLsol: hostLuminosityLsol,
    orbitAu: 1,
  });
  if (!pair || !companionStarIds.length) {
    return buildSingleStarFluxModel({
      dominantStars: [hostStarId],
      hostStarId,
      starsById,
    });
  }

  const distancesAu = sampleBinarySeparationAu({
    semiMajorAxisAu: pair.semiMajorAxisAu,
    eccentricity: pair.eccentricity,
    meanAnomalyDeg: pair.meanAnomalyDeg,
  });
  const visibleSamples = distancesAu.map((distanceAu) =>
    sumCompanionVisibleFluxEarth(companionStarIds, starsById, distanceAu),
  );
  const xuvSamples = distancesAu.map((distanceAu) =>
    sumCompanionXuvFluxEarth(companionStarIds, starsById, distanceAu),
  );
  const visible = summariseSamples(visibleSamples);
  const xuv = summariseSamples(xuvSamples);
  const meanVisibleFluxEarth = hostLuminosityLsol + visible.mean;
  const peakVisibleFluxEarth = hostLuminosityLsol + visible.max;
  const minVisibleFluxEarth = hostLuminosityLsol + visible.min;
  return {
    meanVisibleFluxEarth,
    peakVisibleFluxEarth,
    minVisibleFluxEarth,
    meanCompanionFluxEarth: visible.mean,
    peakCompanionFluxEarth: visible.max,
    minCompanionFluxEarth: visible.min,
    fluxVariabilityFraction:
      meanVisibleFluxEarth > 0
        ? (peakVisibleFluxEarth - minVisibleFluxEarth) / meanVisibleFluxEarth
        : 0,
    meanXuvFluxEarth: hostXuvAt1AuEarth + xuv.mean,
    meanCompanionXuvFluxEarth: xuv.mean,
    dominantContributorId:
      hostLuminosityLsol >= visible.mean ? hostStarId : companionStarIds[0] || hostStarId,
  };
}

export function buildPairFluxModel({ dominantStarIds, starsById }) {
  const meanVisibleFluxEarth = sumHostVisibleFluxEarth(dominantStarIds, starsById);
  return {
    meanVisibleFluxEarth,
    peakVisibleFluxEarth: meanVisibleFluxEarth,
    minVisibleFluxEarth: meanVisibleFluxEarth,
    meanCompanionFluxEarth: 0,
    peakCompanionFluxEarth: 0,
    minCompanionFluxEarth: 0,
    fluxVariabilityFraction: 0,
    meanXuvFluxEarth: sumHostXuvFluxEarthAt1Au(dominantStarIds, starsById),
    meanCompanionXuvFluxEarth: 0,
    dominantContributorId: resolveDominantContributorId(dominantStarIds, starsById),
  };
}

export function shiftHabitableZoneForCompanionFlux({
  hostLuminosityLsol,
  habitableZoneAu,
  meanCompanionFluxEarth = 0,
}) {
  const hostLuminosity = Math.max(toFiniteNumber(hostLuminosityLsol, 0), 0);
  const hzInner = Number(habitableZoneAu?.inner);
  const hzOuter = Number(habitableZoneAu?.outer);
  if (
    hostLuminosity <= 0 ||
    !Number.isFinite(hzInner) ||
    !Number.isFinite(hzOuter) ||
    hzInner <= 0 ||
    hzOuter <= 0
  ) {
    return habitableZoneAu || { inner: 0, outer: 0 };
  }
  const companionFluxEarth = Math.max(toFiniteNumber(meanCompanionFluxEarth, 0), 0);
  const innerSeff = hostLuminosity / hzInner ** 2;
  const outerSeff = hostLuminosity / hzOuter ** 2;
  const nextInner =
    innerSeff > companionFluxEarth
      ? Math.sqrt(hostLuminosity / Math.max(innerSeff - companionFluxEarth, 1e-9))
      : hzInner;
  const nextOuter =
    outerSeff > companionFluxEarth
      ? Math.sqrt(hostLuminosity / Math.max(outerSeff - companionFluxEarth, 1e-9))
      : hzOuter;
  return {
    inner: nextInner,
    outer: nextOuter,
  };
}
