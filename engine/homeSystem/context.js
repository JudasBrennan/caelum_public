import { calcStar, computeStarXuvFluxRatioEarth } from "../star.js";
import { resolveWorldStarConfig } from "../worldStarConfig.js";
import { buildHostFrames } from "./frames.js";
import { buildHomeSystemTopology } from "./topology.js";

function positiveNumberOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function buildStarConfigFromComponent(component, shared) {
  const physicsMode = component?.physicsMode === "advanced" ? "advanced" : "simple";
  const advancedDerivationMode = ["rl", "rt", "lt"].includes(component?.advancedDerivationMode)
    ? component.advancedDerivationMode
    : "rl";

  let radiusRsolOverride = null;
  let luminosityLsolOverride = null;
  let tempKOverride = null;

  if (physicsMode === "advanced") {
    const radiusOverride = positiveNumberOrNull(component?.radiusRsolOverride);
    const luminosityOverride = positiveNumberOrNull(component?.luminosityLsolOverride);
    const tempOverride = positiveNumberOrNull(component?.tempKOverride);

    if (advancedDerivationMode === "rt") {
      radiusRsolOverride = radiusOverride;
      tempKOverride = tempOverride;
    } else if (advancedDerivationMode === "lt") {
      luminosityLsolOverride = luminosityOverride;
      tempKOverride = tempOverride;
    } else {
      radiusRsolOverride = radiusOverride;
      luminosityLsolOverride = luminosityOverride;
    }
  }

  return {
    massMsol: Number(component?.massMsol ?? 1),
    ageGyr: Number(component?.ageGyrOverride ?? shared?.ageGyr ?? 4.6),
    metallicityFeH: Number(component?.metallicityFeHOverride ?? shared?.metallicityFeH ?? 0),
    radiusRsolOverride,
    luminosityLsolOverride,
    tempKOverride,
    evolutionMode: component?.evolutionMode === "evolved" ? "evolved" : "zams",
    physicsMode,
    advancedDerivationMode,
  };
}

function buildStarContexts(stellarSystem, topology) {
  const starsById = Object.create(null);

  for (const starId of topology.starIds) {
    const component = stellarSystem.stars.byId[starId];
    if (!component) continue;
    const config = buildStarConfigFromComponent(component, stellarSystem.shared);
    const model = calcStar({
      massMsol: config.massMsol,
      ageGyr: config.ageGyr,
      metallicityFeH: config.metallicityFeH,
      radiusRsolOverride: config.radiusRsolOverride,
      luminosityLsolOverride: config.luminosityLsolOverride,
      tempKOverride: config.tempKOverride,
      evolutionMode: config.evolutionMode,
    });
    starsById[starId] = {
      id: starId,
      kind: "star",
      regime: model?.regime || "star",
      component,
      config,
      model,
    };
  }

  return starsById;
}

function buildPairContexts(stellarSystem, topology, starsById) {
  const pairsById = Object.create(null);

  for (const pairId of topology.pairIds) {
    const component = stellarSystem.pairs.byId[pairId];
    if (!component) continue;
    const starIds = topology.leafStarIdsByNodeId[pairId] || [];
    const starContexts = starIds.map((starId) => starsById[starId]).filter(Boolean);
    const combinedMassMsol = starContexts.reduce(
      (sum, starContext) => sum + Number(starContext.config.massMsol || 0),
      0,
    );
    const combinedLuminosityLsol = starContexts.reduce(
      (sum, starContext) => sum + Number(starContext.model.luminosityLsol || 0),
      0,
    );
    const dominantStarContext = starContexts.reduce((best, starContext) => {
      if (!best) return starContext;
      const luminosity = Number(starContext.model.luminosityLsol || 0);
      const bestLuminosity = Number(best.model.luminosityLsol || 0);
      return luminosity > bestLuminosity ? starContext : best;
    }, null);
    const representativeTempK =
      combinedLuminosityLsol > 0
        ? starContexts.reduce(
            (sum, starContext) =>
              sum +
              Number(starContext.model.luminosityLsol || 0) * Number(starContext.model.tempK || 0),
            0,
          ) / combinedLuminosityLsol
        : Number(dominantStarContext?.model?.tempK || 5776);
    const representativeRadiusRsol =
      representativeTempK > 0 && combinedLuminosityLsol > 0
        ? Math.sqrt(combinedLuminosityLsol) * (5776 / representativeTempK) ** 2
        : starContexts.reduce(
            (maxRadius, starContext) =>
              Math.max(maxRadius, Number(starContext.model.radiusRsol || 0)),
            0,
          );
    const combinedXuvFluxRatioAt1Au = starContexts.reduce(
      (sum, starContext) =>
        sum +
        computeStarXuvFluxRatioEarth({
          massMsol: starContext.config?.massMsol,
          ageGyr: starContext.config?.ageGyr,
          luminosityLsol: starContext.model?.luminosityLsol,
          orbitAu: 1,
        }),
      0,
    );
    const combinedWindPressureEarthAt1Au = starContexts.reduce((sum, starContext) => {
      const ratio = Number(
        starContext?.model?.stellarEnvironment?.wind?.ramPressureEarthRatioAt1Au,
      );
      return sum + (Number.isFinite(ratio) && ratio > 0 ? ratio : 0);
    }, 0);

    pairsById[pairId] = {
      id: pairId,
      kind: "pair",
      regime:
        starContexts.length > 0 &&
        starContexts.every((entry) => entry?.model?.regime === "brownDwarf")
          ? "brownDwarf"
          : "star",
      ...component,
      starIds,
      combinedMassMsol,
      combinedLuminosityLsol,
      representativeTempK,
      representativeRadiusRsol,
      combinedXuvFluxRatioAt1Au,
      combinedWindPressureEarthAt1Au,
      dominantStarId: dominantStarContext?.id || starIds[0] || null,
      representativeAgeGyr:
        Number(dominantStarContext?.config?.ageGyr ?? stellarSystem.shared?.ageGyr ?? 4.6) || 4.6,
      representativeMetallicityFeH:
        Number(
          dominantStarContext?.config?.metallicityFeH ?? stellarSystem.shared?.metallicityFeH ?? 0,
        ) || 0,
      evolutionMode: dominantStarContext?.config?.evolutionMode === "evolved" ? "evolved" : "zams",
      activityModelVersion:
        dominantStarContext?.component?.activityModelVersion === "v1" ? "v1" : "v2",
      activitySeed:
        dominantStarContext?.component?.activitySeed ??
        dominantStarContext?.component?.seed ??
        null,
    };
  }

  return pairsById;
}

function buildTopologyGraph(topology, stellarSystem, hostFramesById, starsById) {
  const childNodeIdsByNodeId = Object.create(null);
  const parentNodeIdByNodeId = Object.create(null);
  const nodesById = Object.create(null);
  const edges = [];
  const nodeIdsInPreorder = [];
  const nodeIdsByDepth = [];
  const seen = new Set();
  const orderedNodeIds = [...(topology?.pairIds || []), ...(topology?.starIds || [])];

  for (const starId of topology?.starIds || []) {
    childNodeIdsByNodeId[starId] = [];
  }

  for (const pairId of topology?.pairIds || []) {
    const pair = stellarSystem?.pairs?.byId?.[pairId] || null;
    const childIds = [pair?.childA?.id, pair?.childB?.id].filter(Boolean);
    childNodeIdsByNodeId[pairId] = childIds;
    for (const childId of childIds) {
      parentNodeIdByNodeId[childId] = pairId;
      edges.push({ parentId: pairId, childId });
    }
  }

  function visitNode(nodeId) {
    if (!nodeId || seen.has(nodeId)) return;
    seen.add(nodeId);
    nodeIdsInPreorder.push(nodeId);
    const depth = Math.max(0, Number(topology?.nodeDepthById?.[nodeId] || 0));
    if (!Array.isArray(nodeIdsByDepth[depth])) nodeIdsByDepth[depth] = [];
    nodeIdsByDepth[depth].push(nodeId);
    for (const childId of childNodeIdsByNodeId[nodeId] || []) {
      visitNode(childId);
    }
  }

  visitNode(topology?.rootNodeId || null);
  for (const nodeId of orderedNodeIds) {
    visitNode(nodeId);
  }

  for (const nodeId of nodeIdsInPreorder) {
    const hostFrame = hostFramesById?.[nodeId] || null;
    const starContext = starsById?.[nodeId] || null;
    const kind = topology?.nodeKindsById?.get(nodeId) || (starContext ? "star" : "pair");
    const childIds = [...(childNodeIdsByNodeId[nodeId] || [])];
    const starIds =
      topology?.leafStarIdsByNodeId?.[nodeId]?.length > 0
        ? [...topology.leafStarIdsByNodeId[nodeId]]
        : kind === "star"
          ? [nodeId]
          : [];
    const label =
      String(hostFrame?.label || starContext?.component?.name || nodeId).trim() || nodeId;
    nodesById[nodeId] = {
      id: nodeId,
      kind,
      label,
      depth: Math.max(0, Number(topology?.nodeDepthById?.[nodeId] || 0)),
      parentId: parentNodeIdByNodeId[nodeId] || null,
      childIds,
      starIds,
      ancestorPairIds: [...(topology?.ancestorPairIdsByNodeId?.[nodeId] || [])],
      isLeaf: childIds.length === 0,
    };
  }

  return {
    rootNodeId: topology?.rootNodeId || null,
    primaryStarId: topology?.primaryStarId || null,
    defaultHostFrameId: topology?.defaultHostFrameId || null,
    nodeIdsInPreorder,
    nodeIdsByDepth: nodeIdsByDepth.map((entry) => [...(entry || [])]),
    nodesById,
    edges,
    parentNodeIdByNodeId,
    childNodeIdsByNodeId,
    maxDepth: Math.max(0, nodeIdsByDepth.length - 1),
  };
}

export function buildHomeSystemContext(world) {
  const fallbackStar = world?.star && typeof world.star === "object" ? world.star : {};
  const topology = buildHomeSystemTopology(world?.stellarSystem, { fallbackStar });
  const stellarSystem = topology.stellarSystem;
  const starsById = buildStarContexts(stellarSystem, topology);
  const pairsById = buildPairContexts(stellarSystem, topology, starsById);
  const worldSystemInputs = {
    spacingFactor: Number(world?.system?.spacingFactor ?? 0.33),
    orbit1Au: Number(world?.system?.orbit1Au ?? 0.39),
  };
  const hostFramesById = buildHostFrames({
    stellarSystem,
    topology,
    starsById,
    pairsById,
    worldSystemInputs,
  });

  const primaryStarId = topology.primaryStarId;
  const primaryStarContext = starsById[primaryStarId];
  const fallbackPrimary = resolveWorldStarConfig(world);
  const primaryStarConfig = primaryStarContext?.config || fallbackPrimary;
  const primaryStar =
    primaryStarContext?.model ||
    calcStar({
      massMsol: fallbackPrimary.massMsol,
      ageGyr: fallbackPrimary.ageGyr,
      metallicityFeH: fallbackPrimary.metallicityFeH,
      radiusRsolOverride: fallbackPrimary.radiusRsolOverride,
      luminosityLsolOverride: fallbackPrimary.luminosityLsolOverride,
      tempKOverride: fallbackPrimary.tempKOverride,
      evolutionMode: fallbackPrimary.evolutionMode,
    });
  const primarySystem =
    hostFramesById[primaryStarId]?.system || hostFramesById[topology.defaultHostFrameId]?.system;
  const topologyGraph = buildTopologyGraph(topology, stellarSystem, hostFramesById, starsById);

  return {
    topology: {
      kind: topology.topologyKind,
      starCount: topology.starIds.length,
      pairCount: topology.pairIds.length,
      rootNodeId: topology.rootNodeId,
      primaryStarId,
      defaultHostFrameId: topology.defaultHostFrameId,
    },
    stellarSystem,
    starsById,
    pairsById,
    hostFramesById,
    topologyGraph,
    defaultHostFrameId: topology.defaultHostFrameId,
    rootNodeId: topology.rootNodeId,
    primaryStarId,
    primaryStarConfig,
    primaryStar,
    primarySystem,
    worldSystemInputs,
  };
}

export function resolveHostFrameContext(homeSystemContext, hostFrameId) {
  if (!homeSystemContext || typeof homeSystemContext !== "object") return null;
  const fallbackHostFrameId =
    homeSystemContext.defaultHostFrameId || homeSystemContext.primaryStarId || null;
  const resolvedHostFrameId = homeSystemContext.hostFramesById?.[hostFrameId]
    ? hostFrameId
    : fallbackHostFrameId;
  const hostFrame = resolvedHostFrameId
    ? homeSystemContext.hostFramesById?.[resolvedHostFrameId] || null
    : null;
  if (!hostFrame) return null;

  let dominantStarId = hostFrame.dominantStars?.[0] || homeSystemContext.primaryStarId || null;
  let starContext =
    (dominantStarId && homeSystemContext.starsById?.[dominantStarId]) ||
    homeSystemContext.starsById?.[homeSystemContext.primaryStarId] ||
    null;
  let starConfig = starContext?.config || null;
  let starModel = starContext?.model || null;
  let hostXuvFluxEarthAt1Au = 0;
  let hostPrebioticUvEarthAt1Au = 0;
  let hostWindPressureEarthAt1Au = 0;

  if (hostFrame.frameKind === "pair") {
    const pairContext = homeSystemContext.pairsById?.[hostFrame.id] || null;
    dominantStarId = pairContext?.dominantStarId || dominantStarId;
    if (!pairContext) return null;
    starConfig = {
      massMsol: Number(pairContext.combinedMassMsol || 1),
      ageGyr: Number(pairContext.representativeAgeGyr || 4.6),
      metallicityFeH: Number(pairContext.representativeMetallicityFeH || 0),
      radiusRsolOverride: null,
      luminosityLsolOverride: Number(pairContext.combinedLuminosityLsol || 1),
      tempKOverride: Number(pairContext.representativeTempK || 5776),
      evolutionMode: pairContext.evolutionMode === "evolved" ? "evolved" : "zams",
    };
    starModel = calcStar(starConfig);
    starContext = {
      id: pairContext.id,
      kind: "pair",
      component: {
        id: pairContext.id,
        name: hostFrame.label,
        activityModelVersion: pairContext.activityModelVersion || "v2",
        activitySeed: pairContext.activitySeed ?? null,
        seed: pairContext.activitySeed ?? null,
      },
      config: starConfig,
      model: starModel,
      dominantStarId,
      starIds: [...(pairContext.starIds || [])],
    };
    hostXuvFluxEarthAt1Au = Number(
      pairContext.combinedXuvFluxRatioAt1Au || hostFrame.fluxModel?.meanXuvFluxEarth || 0,
    );
    hostWindPressureEarthAt1Au = Number(
      pairContext.combinedWindPressureEarthAt1Au ||
        hostFrame.fluxModel?.hostWindPressureEarthAt1Au ||
        0,
    );
    hostPrebioticUvEarthAt1Au = Number(hostFrame.fluxModel?.hostPrebioticUvEarthAt1Au || 0);
  } else {
    if (!starContext) return null;
    hostXuvFluxEarthAt1Au = computeStarXuvFluxRatioEarth({
      massMsol: starContext.config?.massMsol,
      ageGyr: starContext.config?.ageGyr,
      luminosityLsol: starContext.model?.luminosityLsol,
      orbitAu: 1,
    });
    hostWindPressureEarthAt1Au = Number(
      hostFrame.fluxModel?.hostWindPressureEarthAt1Au ??
        starContext.model?.stellarEnvironment?.wind?.ramPressureEarthRatioAt1Au ??
        0,
    );
    hostPrebioticUvEarthAt1Au = Number(
      hostFrame.fluxModel?.hostPrebioticUvEarthAt1Au ??
        starContext.model?.stellarEnvironment?.uv?.bandsAt1Au?.prebiotic200280?.earthRatio ??
        0,
    );
  }

  return {
    hostFrameId: hostFrame.id,
    hostFrame,
    starId: starContext.id,
    starContext,
    starConfig,
    starModel,
    hostXuvFluxEarthAt1Au,
    hostPrebioticUvEarthAt1Au,
    hostWindPressureEarthAt1Au,
    companionFluxEarth: Number(hostFrame.fluxModel?.meanCompanionFluxEarth || 0),
    peakCompanionFluxEarth: Number(hostFrame.fluxModel?.peakCompanionFluxEarth || 0),
    minCompanionFluxEarth: Number(hostFrame.fluxModel?.minCompanionFluxEarth || 0),
    companionXuvFluxEarth: Number(hostFrame.fluxModel?.meanCompanionXuvFluxEarth || 0),
    companionPrebioticUvEarth: Number(hostFrame.fluxModel?.meanCompanionPrebioticUvEarth || 0),
    companionWindPressureEarth: Number(hostFrame.fluxModel?.meanCompanionWindPressureEarth || 0),
    fluxVariabilityFraction: Number(hostFrame.fluxModel?.fluxVariabilityFraction || 0),
    dominantContributorId: hostFrame.fluxModel?.dominantContributorId || starContext.id,
  };
}
