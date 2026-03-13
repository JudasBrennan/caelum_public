import { clamp } from "../utils.js";
import { latLonToXYZ, sphericalVoronoi, xyzToLatLon } from "../plates.js";

export const TECTONICS_GRID_RESOLUTIONS = [
  { id: "coarse", label: "Coarse", count: 92 },
  { id: "medium", label: "Medium", count: 162 },
  { id: "fine", label: "Fine", count: 252 },
  { id: "veryFine", label: "Very Fine", count: 512 },
  { id: "ultra", label: "Ultra (Experimental)", count: 1024 },
];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const gridCache = new Map();

function toResolutionEntry(resolutionId) {
  return (
    TECTONICS_GRID_RESOLUTIONS.find((entry) => entry.id === resolutionId) ||
    TECTONICS_GRID_RESOLUTIONS[0]
  );
}

function createFibonacciSeeds(count) {
  const total = Math.max(24, Math.min(1024, Math.round(Number(count) || 92)));
  const seeds = [];

  for (let i = 0; i < total; i += 1) {
    const z = 1 - (2 * (i + 0.5)) / total;
    const radius = Math.sqrt(Math.max(0, 1 - z * z));
    const theta = GOLDEN_ANGLE * i;
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    const latDeg = Math.asin(clamp(z, -1, 1)) * (180 / Math.PI);
    const lonDeg = Math.atan2(y, x) * (180 / Math.PI);
    seeds.push({
      id: `cell-${i + 1}`,
      latDeg: Number(latDeg.toFixed(4)),
      lonDeg: Number(lonDeg.toFixed(4)),
    });
  }

  return seeds;
}

function buildGrid(entry) {
  const seedPoints = createFibonacciSeeds(entry.count);
  const voronoi = sphericalVoronoi(seedPoints.map((seed) => latLonToXYZ(seed.latDeg, seed.lonDeg)));

  const cells = seedPoints.map((seed, index) => ({
    id: seed.id,
    seedIdx: index,
    centerLatDeg: seed.latDeg,
    centerLonDeg: seed.lonDeg,
    centerVec: latLonToXYZ(seed.latDeg, seed.lonDeg),
    vertices: [],
    neighborIds: [],
  }));

  for (const cell of voronoi.cells) {
    cells[cell.seedIdx].vertices = cell.vertices.map((vertex) =>
      xyzToLatLon(vertex.x, vertex.y, vertex.z),
    );
  }

  const edges = [];
  for (const edge of voronoi.edges) {
    const from = xyzToLatLon(edge.from.x, edge.from.y, edge.from.z);
    const to = xyzToLatLon(edge.to.x, edge.to.y, edge.to.z);
    const fromCell = cells[edge.seedA];
    const toCell = cells[edge.seedB];
    if (!fromCell || !toCell) continue;
    fromCell.neighborIds.push(toCell.id);
    toCell.neighborIds.push(fromCell.id);
    edges.push({
      id: `${fromCell.id}::${toCell.id}`,
      cellAId: fromCell.id,
      cellBId: toCell.id,
      cellAIdx: edge.seedA,
      cellBIdx: edge.seedB,
      from,
      to,
    });
  }

  for (const cell of cells) {
    cell.neighborIds = [...new Set(cell.neighborIds)].sort();
  }

  return {
    id: entry.id,
    label: entry.label,
    count: entry.count,
    seeds: seedPoints,
    cells,
    edges,
  };
}

export function getTectonicsSimulatorGrid(resolutionId = "coarse") {
  const entry = toResolutionEntry(resolutionId);
  if (!gridCache.has(entry.id)) {
    gridCache.set(entry.id, buildGrid(entry));
  }
  return gridCache.get(entry.id);
}
