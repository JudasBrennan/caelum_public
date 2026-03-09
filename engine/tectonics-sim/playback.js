// SPDX-License-Identifier: MPL-2.0
import { latLonToXYZ, rotateAroundPole } from "../plates.js";
import { clamp } from "../utils.js";

const PLAYBACK_CACHE = new Map();
const MAX_CACHE = 24;

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortObject(value[key])]),
  );
}

function buildCacheKey(state, timeMyr) {
  return JSON.stringify({
    timeMyr: Number(timeMyr.toFixed(3)),
    gridResolution: state.gridResolution,
    plates: state.plates.map((plate) => ({
      id: plate.id,
      latDeg: Number(plate.latDeg.toFixed(3)),
      lonDeg: Number(plate.lonDeg.toFixed(3)),
      eulerPoleLat: Number(plate.eulerPoleLat.toFixed(3)),
      eulerPoleLon: Number(plate.eulerPoleLon.toFixed(3)),
      angularVelDegMyr: Number(plate.angularVelDegMyr.toFixed(4)),
      type: plate.type,
    })),
    cellPlateIds: state.cellPlateIds,
    cellCrustTypes: state.cellCrustTypes,
  });
}

function setCachedSnapshot(key, value) {
  PLAYBACK_CACHE.set(key, value);
  if (PLAYBACK_CACHE.size <= MAX_CACHE) return;
  const firstKey = PLAYBACK_CACHE.keys().next().value;
  if (firstKey) PLAYBACK_CACHE.delete(firstKey);
}

function bestMatchIndex(targetVec, candidates) {
  let bestIndex = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const score = candidate.x * targetVec.x + candidate.y * targetVec.y + candidate.z * targetVec.z;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return { index: bestIndex, score: bestScore };
}

export function computePlaybackSnapshot({ state, grid, timeMyr }) {
  const safeTimeMyr = clamp(Number(timeMyr) || 0, 0, 250);
  if (safeTimeMyr <= 0) {
    return {
      timeMyr: 0,
      cellPlateIds: [...state.cellPlateIds],
      cellCrustTypes: [...state.cellCrustTypes],
      sourceCellIndices: grid.cells.map((_, index) => index),
      remappedCellCount: 0,
      usedCache: false,
    };
  }

  const cacheKey = buildCacheKey(state, safeTimeMyr);
  const cached = PLAYBACK_CACHE.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      cellPlateIds: [...cached.cellPlateIds],
      cellCrustTypes: [...cached.cellCrustTypes],
      sourceCellIndices: [...cached.sourceCellIndices],
      usedCache: true,
    };
  }

  const plateById = new Map(state.plates.map((plate) => [plate.id, plate]));
  const centerVectors = grid.cells.map(
    (cell) => cell.centerVec || latLonToXYZ(cell.centerLatDeg, cell.centerLonDeg),
  );

  const advectedSources = grid.cells.map((cell, index) => {
    const plate = plateById.get(state.cellPlateIds[index]) || state.plates[0];
    const pole = latLonToXYZ(plate.eulerPoleLat, plate.eulerPoleLon);
    const centerVec = centerVectors[index];
    const advectedVec =
      Math.abs(plate.angularVelDegMyr) > 1e-9
        ? rotateAroundPole(centerVec, pole, plate.angularVelDegMyr * safeTimeMyr)
        : centerVec;
    return {
      sourceIndex: index,
      plateId: plate.id,
      crustType: state.cellCrustTypes[index],
      advectedVec,
    };
  });

  const claims = Array.from({ length: grid.cells.length }, () => null);
  for (const source of advectedSources) {
    const match = bestMatchIndex(source.advectedVec, centerVectors);
    const current = claims[match.index];
    if (
      !current ||
      match.score > current.score ||
      (match.score === current.score && source.sourceIndex < current.sourceIndex)
    ) {
      claims[match.index] = {
        sourceIndex: source.sourceIndex,
        score: match.score,
      };
    }
  }

  for (let destIndex = 0; destIndex < claims.length; destIndex += 1) {
    if (claims[destIndex]) continue;
    const destVec = centerVectors[destIndex];
    const match = bestMatchIndex(
      destVec,
      advectedSources.map((source) => source.advectedVec),
    );
    claims[destIndex] = {
      sourceIndex: advectedSources[match.index].sourceIndex,
      score: match.score,
    };
  }

  const cellPlateIds = [];
  const cellCrustTypes = [];
  const sourceCellIndices = [];
  let remappedCellCount = 0;
  for (let destIndex = 0; destIndex < claims.length; destIndex += 1) {
    const sourceIndex = claims[destIndex]?.sourceIndex ?? destIndex;
    sourceCellIndices.push(sourceIndex);
    cellPlateIds.push(state.cellPlateIds[sourceIndex]);
    cellCrustTypes.push(state.cellCrustTypes[sourceIndex]);
    if (sourceIndex !== destIndex) remappedCellCount += 1;
  }

  const snapshot = {
    timeMyr: safeTimeMyr,
    cellPlateIds,
    cellCrustTypes,
    sourceCellIndices,
    remappedCellCount,
    usedCache: false,
  };
  setCachedSnapshot(cacheKey, snapshot);
  return {
    ...snapshot,
    cellPlateIds: [...snapshot.cellPlateIds],
    cellCrustTypes: [...snapshot.cellCrustTypes],
    sourceCellIndices: [...snapshot.sourceCellIndices],
  };
}

export function clearPlaybackSnapshotCache() {
  PLAYBACK_CACHE.clear();
}

export function debugPlaybackCache() {
  return sortObject({ size: PLAYBACK_CACHE.size });
}
