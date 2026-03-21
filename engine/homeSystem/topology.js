import {
  getDefaultHostFrameId,
  getPrimaryStarId,
  normalizeStellarSystem,
} from "../../ui/store/stellarSystemModel.js";

function buildNodeKindsMap(stellarSystem) {
  const nodeKindsById = new Map();
  for (const starId of stellarSystem?.stars?.order || []) {
    if (stellarSystem.stars.byId?.[starId]) nodeKindsById.set(starId, "star");
  }
  for (const pairId of stellarSystem?.pairs?.order || []) {
    if (stellarSystem.pairs.byId?.[pairId]) nodeKindsById.set(pairId, "pair");
  }
  return nodeKindsById;
}

function buildParentPairByChildId(stellarSystem) {
  const parentPairByChildId = new Map();
  for (const pairId of stellarSystem?.pairs?.order || []) {
    const pair = stellarSystem?.pairs?.byId?.[pairId];
    if (!pair) continue;
    if (pair.childA?.id) parentPairByChildId.set(pair.childA.id, pairId);
    if (pair.childB?.id) parentPairByChildId.set(pair.childB.id, pairId);
  }
  return parentPairByChildId;
}

function buildAncestorPairIdsByNodeId(stellarSystem, parentPairByChildId) {
  const ancestorPairIdsByNodeId = Object.create(null);
  const nodeIds = [...(stellarSystem?.stars?.order || []), ...(stellarSystem?.pairs?.order || [])];

  for (const nodeId of nodeIds) {
    const ancestors = [];
    const seen = new Set();
    let currentNodeId = nodeId;
    while (currentNodeId && parentPairByChildId.has(currentNodeId) && !seen.has(currentNodeId)) {
      seen.add(currentNodeId);
      const parentPairId = parentPairByChildId.get(currentNodeId);
      if (!parentPairId) break;
      ancestors.push(parentPairId);
      currentNodeId = parentPairId;
    }
    ancestorPairIdsByNodeId[nodeId] = ancestors;
  }

  return ancestorPairIdsByNodeId;
}

export function collectLeafStarIds(stellarSystem, nodeId, seen = new Set()) {
  if (!nodeId || seen.has(nodeId)) return [];
  seen.add(nodeId);

  const star = stellarSystem?.stars?.byId?.[nodeId];
  if (star) return [nodeId];

  const pair = stellarSystem?.pairs?.byId?.[nodeId];
  if (!pair) return [];

  return [
    ...collectLeafStarIds(stellarSystem, pair.childA?.id, seen),
    ...collectLeafStarIds(stellarSystem, pair.childB?.id, seen),
  ];
}

export function buildHomeSystemTopology(stellarSystemLike, { fallbackStar = null } = {}) {
  const stellarSystem = normalizeStellarSystem(stellarSystemLike, { fallbackStar });
  const nodeKindsById = buildNodeKindsMap(stellarSystem);
  const parentPairByChildId = buildParentPairByChildId(stellarSystem);
  const leafStarIdsByNodeId = Object.create(null);

  for (const starId of stellarSystem.stars.order) {
    leafStarIdsByNodeId[starId] = [starId];
  }
  for (const pairId of stellarSystem.pairs.order) {
    leafStarIdsByNodeId[pairId] = collectLeafStarIds(stellarSystem, pairId);
  }
  const ancestorPairIdsByNodeId = buildAncestorPairIdsByNodeId(stellarSystem, parentPairByChildId);
  const nodeDepthById = Object.create(null);
  for (const nodeId of [...stellarSystem.stars.order, ...stellarSystem.pairs.order]) {
    nodeDepthById[nodeId] = ancestorPairIdsByNodeId[nodeId]?.length || 0;
  }

  return {
    stellarSystem,
    topologyKind: stellarSystem.topologyKind,
    rootNodeId: stellarSystem.rootNodeId,
    defaultHostFrameId: getDefaultHostFrameId(stellarSystem),
    primaryStarId: getPrimaryStarId(stellarSystem),
    starIds: [...stellarSystem.stars.order],
    pairIds: [...stellarSystem.pairs.order],
    nodeKindsById,
    parentPairByChildId,
    ancestorPairIdsByNodeId,
    nodeDepthById,
    leafStarIdsByNodeId,
  };
}
