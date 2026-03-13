import { oceanDepth, spreadingRate } from "../tectonics.js";
import { calcPlates, latLonToXYZ } from "../plates.js";
import { clamp } from "../utils.js";
import { getDefaultTopographyPeakColor } from "./terrainStyles.js";
import {
  computeBoundaryKinematics,
  computeLocalMotion,
  enrichGeologyFields,
  resolveBoundaryAsymmetry,
} from "./geology.js";
import { getTectonicsSimulatorGrid, TECTONICS_GRID_RESOLUTIONS } from "./grid.js";
import { computePlaybackSnapshot } from "./playback.js";

export const TECTONICS_SIMULATOR_VERSION = 5;

export const TECTONICS_SIMULATOR_TOOLS = [
  { id: "select", label: "Select" },
  { id: "brush", label: "Brush" },
  { id: "fill", label: "Fill" },
  { id: "erase", label: "Erase" },
];

export const TECTONICS_SIMULATOR_PAINT_TARGETS = [
  { id: "plate", label: "Plate Ownership" },
  { id: "crust", label: "Cell Crust" },
];

export const TECTONICS_SIMULATOR_BRUSH_RADII = [
  { id: 0, label: "1 cell" },
  { id: 1, label: "1 ring" },
  { id: 2, label: "2 rings" },
  { id: 3, label: "3 rings" },
];

export const TECTONICS_SIMULATOR_CRUST_TYPES = [
  { id: "continental", label: "Continental" },
  { id: "oceanic", label: "Oceanic" },
];

export const TECTONICS_SIMULATOR_LAYERS = [
  { id: "plates", label: "Plates" },
  { id: "crust", label: "Crust Type" },
  { id: "boundaries", label: "Boundaries" },
  { id: "motion", label: "Motion" },
  { id: "subduction", label: "Subduction" },
  { id: "hotspots", label: "Hotspots" },
  { id: "crustAge", label: "Crust Age" },
  { id: "elevation", label: "Elevation" },
  { id: "volcanism", label: "Volcanism" },
  { id: "seismicity", label: "Seismicity" },
];

const WORKSPACE_MODES = ["plate", "terrain"];
const WORKSPACE_PROJECTIONS = ["flat", "sphere"];
const WORKSPACE_PLATE_RAIL_TABS = ["plates", "tools", "layers", "selection"];
const WORKSPACE_TERRAIN_RAIL_TABS = ["view", "selection"];
const WORKSPACE_TERRAIN_MODES = [
  "shaded",
  "topography",
  "height",
  "bathymetry",
  "slope",
  "aspect",
  "slopeaspect",
  "heightmap",
];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DEFAULT_COUNT = 8;
const DEFAULT_COLORS = [
  "#f97316",
  "#22c55e",
  "#38bdf8",
  "#facc15",
  "#a78bfa",
  "#f472b6",
  "#fb7185",
  "#34d399",
  "#f59e0b",
  "#60a5fa",
  "#c084fc",
  "#4ade80",
];

function wrapLongitude(lonDeg) {
  let lon = Number(lonDeg) || 0;
  while (lon > 180) lon -= 360;
  while (lon <= -180) lon += 360;
  return lon;
}

function toFinite(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizePlateType(value) {
  return value === "continental" ? "continental" : "oceanic";
}

function normalizeCrustType(value, { allowNull = false } = {}) {
  if (value == null && allowNull) return null;
  return value === "continental" ? "continental" : "oceanic";
}

function byPlateId(a, b) {
  return String(a.id).localeCompare(String(b.id));
}

function normalizeGridResolution(value) {
  return (
    TECTONICS_GRID_RESOLUTIONS.find((entry) => entry.id === value)?.id ||
    TECTONICS_GRID_RESOLUTIONS[0].id
  );
}

function normalizeTool(value) {
  return TECTONICS_SIMULATOR_TOOLS.some((entry) => entry.id === value) ? value : "select";
}

function normalizePaintTarget(value) {
  return value === "crust" ? "crust" : "plate";
}

function normalizeBrushRadius(value) {
  return Math.max(0, Math.min(3, Math.round(toFinite(value, 1))));
}

function normalizeWorkspaceMode(value) {
  return WORKSPACE_MODES.includes(value) ? value : "plate";
}

function normalizeWorkspaceProjection(value) {
  return WORKSPACE_PROJECTIONS.includes(value) ? value : "flat";
}

function normalizeWorkspaceTab(value, valid, fallback) {
  return valid.includes(value) ? value : fallback;
}

function normalizeTerrainMode(value) {
  return WORKSPACE_TERRAIN_MODES.includes(value) ? value : "shaded";
}

function createDefaultWorkspaceState() {
  return {
    mode: "plate",
    projection: "flat",
    plateRailTab: "plates",
    terrainRailTab: "view",
    dockTab: "summary",
    leftRailCollapsed: false,
    inspectorCollapsed: false,
    dockCollapsed: false,
    controlsOpen: false,
    exportOpen: false,
    helpOpen: false,
    playbackExpanded: false,
    terrainMode: "shaded",
    topographyBandStepM: 250,
    topographyMajorEvery: 5,
    topographyShowMinorContours: true,
    topographyShowOceanContours: true,
    terrainStylePreset: "physical",
    terrainTopographyPeakColor: getDefaultTopographyPeakColor("physical"),
    terrainTopographyPeakCustomized: false,
    terrainReliefStrength: 1,
    terrainCoastlineEmphasis: 1,
    terrainExportPreset: "preview",
    terrainExportSize: "preview",
    inspectorFx: null,
    inspectorFy: null,
  };
}

function normalizeWorkspaceState(rawWorkspace) {
  const source =
    rawWorkspace && typeof rawWorkspace === "object" && !Array.isArray(rawWorkspace)
      ? rawWorkspace
      : {};
  const terrainStylePreset = String(source.terrainStylePreset || "physical");
  const terrainTopographyPeakCustomized = Boolean(source.terrainTopographyPeakCustomized);
  return {
    mode: normalizeWorkspaceMode(source.mode),
    projection: normalizeWorkspaceProjection(source.projection),
    plateRailTab: normalizeWorkspaceTab(source.plateRailTab, WORKSPACE_PLATE_RAIL_TABS, "plates"),
    terrainRailTab: normalizeWorkspaceTab(
      source.terrainRailTab,
      WORKSPACE_TERRAIN_RAIL_TABS,
      "view",
    ),
    inspectorCollapsed: Boolean(source.inspectorCollapsed),
    sidebarTab:
      typeof source.sidebarTab === "string" &&
      ["controls", "timeline", "style", "export"].includes(source.sidebarTab)
        ? source.sidebarTab
        : null,
    terrainMode: normalizeTerrainMode(source.terrainMode),
    topographyBandStepM: clamp(toFinite(source.topographyBandStepM, 250), 100, 1000),
    topographyMajorEvery: clamp(Math.round(toFinite(source.topographyMajorEvery, 5)), 2, 10),
    topographyShowMinorContours:
      source.topographyShowMinorContours == null
        ? true
        : Boolean(source.topographyShowMinorContours),
    topographyShowOceanContours:
      source.topographyShowOceanContours == null
        ? true
        : Boolean(source.topographyShowOceanContours),
    terrainStylePreset,
    terrainTopographyPeakColor:
      typeof source.terrainTopographyPeakColor === "string" &&
      /^#?[0-9a-f]{6}$/i.test(source.terrainTopographyPeakColor)
        ? source.terrainTopographyPeakColor.startsWith("#")
          ? source.terrainTopographyPeakColor
          : `#${source.terrainTopographyPeakColor}`
        : getDefaultTopographyPeakColor(terrainStylePreset),
    terrainTopographyPeakCustomized,
    terrainReliefStrength: clamp(toFinite(source.terrainReliefStrength, 1), 0, 2),
    terrainCoastlineEmphasis: clamp(toFinite(source.terrainCoastlineEmphasis, 1), 0, 2),
    terrainExportPreset: String(source.terrainExportPreset || "preview"),
    terrainExportSize: String(source.terrainExportSize || "preview"),
    inspectorFx:
      Number.isFinite(Number(source.inspectorFx)) && source.inspectorFx != null
        ? clamp(Number(source.inspectorFx), 0, 1)
        : null,
    inspectorFy:
      Number.isFinite(Number(source.inspectorFy)) && source.inspectorFy != null
        ? clamp(Number(source.inspectorFy), 0, 1)
        : null,
  };
}

function getGridForState(stateLike) {
  return getTectonicsSimulatorGrid(normalizeGridResolution(stateLike?.gridResolution));
}

function cloneNormalizedState(state) {
  return {
    ...state,
    plates: state.plates.map((plate) => ({ ...plate })),
    cellPlateIds: [...state.cellPlateIds],
    cellCrustTypes: [...state.cellCrustTypes],
    workspace: { ...state.workspace },
  };
}

function getPlateByIdMap(state) {
  return new Map(state.plates.map((plate) => [plate.id, plate]));
}

function getCellIndexById(grid, cellId) {
  return grid.cells.findIndex((cell) => cell.id === cellId);
}

function getEffectiveCrustTypeForIndex(state, index, plateById) {
  return state.cellCrustTypes[index] || plateById.get(state.cellPlateIds[index])?.type || "oceanic";
}

function getBrushIndexes(grid, cellId, radius) {
  const startIndex = getCellIndexById(grid, cellId);
  if (startIndex < 0) return [];
  if (radius <= 0) return [startIndex];

  const indexById = new Map(grid.cells.map((cell, index) => [cell.id, index]));
  const visited = new Set([grid.cells[startIndex].id]);
  const queue = [{ id: grid.cells[startIndex].id, depth: 0 }];
  const indexes = [];

  while (queue.length) {
    const entry = queue.shift();
    const index = indexById.get(entry.id);
    if (index == null) continue;
    indexes.push(index);
    if (entry.depth >= radius) continue;
    for (const neighborId of grid.cells[index].neighborIds) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      queue.push({ id: neighborId, depth: entry.depth + 1 });
    }
  }

  return indexes;
}

function getFillIndexes(state, grid, cellId, target) {
  const startIndex = getCellIndexById(grid, cellId);
  if (startIndex < 0) return [];

  const indexById = new Map(grid.cells.map((cell, index) => [cell.id, index]));
  const plateById = getPlateByIdMap(state);
  const visited = new Set([grid.cells[startIndex].id]);
  const queue = [grid.cells[startIndex].id];
  const indexes = [];
  const startPlateId = state.cellPlateIds[startIndex];
  const startCrustType = getEffectiveCrustTypeForIndex(state, startIndex, plateById);

  while (queue.length) {
    const id = queue.shift();
    const index = indexById.get(id);
    if (index == null) continue;
    const matches =
      target === "crust"
        ? getEffectiveCrustTypeForIndex(state, index, plateById) === startCrustType
        : state.cellPlateIds[index] === startPlateId;
    if (!matches) continue;
    indexes.push(index);
    for (const neighborId of grid.cells[index].neighborIds) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      queue.push(neighborId);
    }
  }

  return indexes;
}

function buildImportPlateIdSet(plates) {
  return new Set(plates.map((plate) => plate.id));
}

function normalizeImportedPlates(rawPlates) {
  if (!Array.isArray(rawPlates)) return null;
  if (rawPlates.length < 4) {
    throw new Error("Plate imports must define at least four plates.");
  }
  return rawPlates.map(normalizePlate).sort(byPlateId);
}

function normalizeImportedPlateAssignments(payload, grid, plates, fallbackAssignments) {
  const validIds = buildImportPlateIdSet(plates);
  const base =
    Array.isArray(fallbackAssignments) && fallbackAssignments.length === grid.cells.length
      ? [...fallbackAssignments]
      : createDefaultCellAssignments(grid, plates);

  if (Array.isArray(payload.cellPlateIds)) {
    if (payload.cellPlateIds.length !== grid.cells.length) {
      throw new Error("Imported plate map length does not match the selected grid resolution.");
    }
    return payload.cellPlateIds.map((plateId) => {
      if (!validIds.has(plateId)) throw new Error(`Unknown imported plate id: ${plateId}`);
      return plateId;
    });
  }

  if (payload.cells && typeof payload.cells === "object" && !Array.isArray(payload.cells)) {
    const cellIdSet = new Set(grid.cells.map((cell) => cell.id));
    for (const [cellId, plateId] of Object.entries(payload.cells)) {
      if (!cellIdSet.has(cellId)) throw new Error(`Unknown cell id in plate import: ${cellId}`);
      if (!validIds.has(plateId)) throw new Error(`Unknown imported plate id: ${plateId}`);
      const index = getCellIndexById(grid, cellId);
      if (index >= 0) base[index] = plateId;
    }
    return base;
  }

  throw new Error("Plate import JSON must include cellPlateIds or a cells map.");
}

function normalizeImportedCrustAssignments(payload, grid, fallbackAssignments) {
  const base =
    Array.isArray(fallbackAssignments) && fallbackAssignments.length === grid.cells.length
      ? [...fallbackAssignments]
      : Array.from({ length: grid.cells.length }, () => null);

  if (Array.isArray(payload.cellCrustTypes)) {
    if (payload.cellCrustTypes.length !== grid.cells.length) {
      throw new Error("Imported crust map length does not match the selected grid resolution.");
    }
    return payload.cellCrustTypes.map((value) => normalizeCrustType(value, { allowNull: true }));
  }

  if (payload.cells && typeof payload.cells === "object" && !Array.isArray(payload.cells)) {
    const cellIdSet = new Set(grid.cells.map((cell) => cell.id));
    for (const [cellId, crustType] of Object.entries(payload.cells)) {
      if (!cellIdSet.has(cellId)) throw new Error(`Unknown cell id in crust import: ${cellId}`);
      const index = getCellIndexById(grid, cellId);
      if (index >= 0) {
        base[index] = normalizeCrustType(crustType, { allowNull: true });
      }
    }
    return base;
  }

  throw new Error("Crust import JSON must include cellCrustTypes or a cells map.");
}

export function createSeededSimulatorPlates(count = DEFAULT_COUNT) {
  const safeCount = Math.max(4, Math.min(24, Math.round(toFinite(count, DEFAULT_COUNT))));
  const continentalCount = Math.max(1, Math.round(safeCount * 0.35));
  const plates = [];

  for (let i = 0; i < safeCount; i += 1) {
    const z = 1 - (2 * (i + 0.5)) / safeCount;
    const radius = Math.sqrt(Math.max(0, 1 - z * z));
    const theta = GOLDEN_ANGLE * i;
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    const latDeg = Math.asin(z) * (180 / Math.PI);
    const lonDeg = Math.atan2(y, x) * (180 / Math.PI);
    const type = i < continentalCount ? "continental" : "oceanic";
    const spin = 0.09 + ((i * 17) % 21) / 100;

    plates.push({
      id: `plate-${i + 1}`,
      label: `Plate ${i + 1}`,
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      type,
      latDeg: Number(latDeg.toFixed(2)),
      lonDeg: Number(lonDeg.toFixed(2)),
      eulerPoleLat: Number(clamp(-latDeg * 0.4 + ((i % 3) - 1) * 18, -85, 85).toFixed(2)),
      eulerPoleLon: Number(wrapLongitude(lonDeg + 110 + i * 27).toFixed(2)),
      angularVelDegMyr: Number((i % 2 === 0 ? spin : -spin).toFixed(3)),
    });
  }

  return plates;
}

export function findNearestPlateIndex(seeds, latDeg, lonDeg) {
  if (!Array.isArray(seeds) || !seeds.length) return -1;
  const target = latLonToXYZ(latDeg, lonDeg);
  let best = 0;
  let bestDot = -Infinity;
  for (let i = 0; i < seeds.length; i += 1) {
    const seed = latLonToXYZ(seeds[i].latDeg, seeds[i].lonDeg);
    const dp = seed.x * target.x + seed.y * target.y + seed.z * target.z;
    if (dp > bestDot) {
      bestDot = dp;
      best = i;
    }
  }
  return best;
}

export function createDefaultCellAssignments(grid, plates) {
  if (!grid?.cells?.length || !Array.isArray(plates) || !plates.length) return [];
  return grid.cells.map((cell) => {
    const plateIndex = findNearestPlateIndex(plates, cell.centerLatDeg, cell.centerLonDeg);
    return plates[plateIndex]?.id || plates[0]?.id || null;
  });
}

export function createDefaultTectonicsSimulatorState() {
  const plates = createSeededSimulatorPlates(DEFAULT_COUNT);
  const gridResolution = TECTONICS_GRID_RESOLUTIONS[0].id;
  const grid = getTectonicsSimulatorGrid(gridResolution);
  return {
    version: TECTONICS_SIMULATOR_VERSION,
    layer: "plates",
    tool: "select",
    paintTarget: "plate",
    brushRadius: 1,
    cellCrustPaintType: "continental",
    gridResolution,
    timeMyr: 0,
    playbackStepMyr: 5,
    plates,
    selectedPlateId: plates[0]?.id || null,
    selectedCellId: grid.cells[0]?.id || null,
    cellPlateIds: createDefaultCellAssignments(grid, plates),
    cellCrustTypes: Array.from({ length: grid.cells.length }, () => null),
    workspace: createDefaultWorkspaceState(),
  };
}

function normalizePlate(plate, index) {
  return {
    id: plate?.id || `plate-${index + 1}`,
    label: String(plate?.label || `Plate ${index + 1}`),
    color: String(plate?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]),
    type: normalizePlateType(plate?.type),
    latDeg: clamp(toFinite(plate?.latDeg, 0), -89.5, 89.5),
    lonDeg: wrapLongitude(toFinite(plate?.lonDeg, 0)),
    eulerPoleLat: clamp(toFinite(plate?.eulerPoleLat, 0), -89.5, 89.5),
    eulerPoleLon: wrapLongitude(toFinite(plate?.eulerPoleLon, 0)),
    angularVelDegMyr: clamp(toFinite(plate?.angularVelDegMyr, 0.1), -0.75, 0.75),
  };
}

export function normalizeTectonicsSimulatorState(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  let plates = Array.isArray(source.plates) ? source.plates : [];
  if (plates.length < 4) plates = createSeededSimulatorPlates(DEFAULT_COUNT);

  plates = plates.map(normalizePlate).sort(byPlateId);

  const selectedPlateId =
    plates.find((plate) => plate.id === source.selectedPlateId)?.id || plates[0]?.id || null;
  const layer = TECTONICS_SIMULATOR_LAYERS.some((entry) => entry.id === source.layer)
    ? source.layer
    : "plates";
  const gridResolution = normalizeGridResolution(source.gridResolution);
  const grid = getTectonicsSimulatorGrid(gridResolution);
  const defaultAssignments = createDefaultCellAssignments(grid, plates);
  const validPlateIds = new Set(plates.map((plate) => plate.id));
  const sourceAssignments = Array.isArray(source.cellPlateIds) ? source.cellPlateIds : [];
  const cellPlateIds =
    sourceAssignments.length === grid.cells.length &&
    sourceAssignments.every((plateId) => plateId == null || validPlateIds.has(plateId))
      ? sourceAssignments.map((plateId, index) => plateId || defaultAssignments[index])
      : defaultAssignments;
  const sourceCrustTypes = Array.isArray(source.cellCrustTypes) ? source.cellCrustTypes : [];
  const cellCrustTypes =
    sourceCrustTypes.length === grid.cells.length
      ? sourceCrustTypes.map((value) => normalizeCrustType(value, { allowNull: true }))
      : Array.from({ length: grid.cells.length }, () => null);
  const selectedCellId =
    grid.cells.find((cell) => cell.id === source.selectedCellId)?.id || grid.cells[0]?.id || null;
  const workspace = normalizeWorkspaceState(source.workspace);

  return {
    version: TECTONICS_SIMULATOR_VERSION,
    layer,
    tool: normalizeTool(source.tool),
    paintTarget: normalizePaintTarget(source.paintTarget),
    brushRadius: normalizeBrushRadius(source.brushRadius),
    cellCrustPaintType: normalizeCrustType(source.cellCrustPaintType || "continental"),
    gridResolution,
    timeMyr: clamp(toFinite(source.timeMyr, 0), 0, 250),
    playbackStepMyr: clamp(toFinite(source.playbackStepMyr, 5), 1, 50),
    plates,
    selectedPlateId,
    selectedCellId,
    cellPlateIds,
    cellCrustTypes,
    workspace,
  };
}

function colorToRgb(color) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(color).trim());
  if (!match) return { r: 160, g: 160, b: 160 };
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (value) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColors(a, b, weight) {
  const wa = clamp(1 - weight, 0, 1);
  const wb = clamp(weight, 0, 1);
  return rgbToHex({
    r: a.r * wa + b.r * wb,
    g: a.g * wa + b.g * wb,
    b: a.b * wa + b.b * wb,
  });
}

function sequentialColor(value, low, high) {
  const t = clamp(value, 0, 1);
  return mixColors(colorToRgb(low), colorToRgb(high), t);
}

function hsvToHex(hDeg, s, v) {
  const h = ((hDeg % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rgb = [0, 0, 0];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgbToHex({
    r: (rgb[0] + m) * 255,
    g: (rgb[1] + m) * 255,
    b: (rgb[2] + m) * 255,
  });
}

function elevationColor(elevationM) {
  if (elevationM < -6000) return "#0b2f74";
  if (elevationM < -4000) return "#164e98";
  if (elevationM < -2000) return "#2d77b3";
  if (elevationM < 0) return "#5ba5c6";
  if (elevationM < 600) return "#6d8d5b";
  if (elevationM < 1800) return "#7e9a5d";
  if (elevationM < 3600) return "#97714f";
  if (elevationM < 5200) return "#b89f8a";
  return "#f5f5f5";
}

function estimateOceanicAge(boundaryCounts, ridgeDistanceNorm = 0.5) {
  const divergent = boundaryCounts.divergent || 0;
  const transform = boundaryCounts.transform || 0;
  const convergent = boundaryCounts.convergent || 0;
  const distanceBias = clamp(ridgeDistanceNorm, 0, 1) * 90;
  return clamp(10 + distanceBias - divergent * 36 + transform * 10 + convergent * 18, 4, 180);
}

function buildBoundaryMix(entry) {
  const total = entry.convergent + entry.divergent + entry.transform;
  if (total <= 0) return "interior";
  const parts = [];
  if (entry.convergent) parts.push(`C ${entry.convergent}`);
  if (entry.divergent) parts.push(`D ${entry.divergent}`);
  if (entry.transform) parts.push(`T ${entry.transform}`);
  return parts.join(" | ");
}

const BOUNDARY_ROLE_PRIORITY = {
  interior: 0,
  transform: 1,
  ridge: 2,
  arc: 3,
  collision: 4,
  trench: 5,
};

function updateBoundaryRole(cell, nextRole) {
  if (!nextRole) return;
  const currentPriority = BOUNDARY_ROLE_PRIORITY[cell.boundaryRole || "interior"] || 0;
  const nextPriority = BOUNDARY_ROLE_PRIORITY[nextRole] || 0;
  if (nextPriority >= currentPriority) {
    cell.boundaryRole = nextRole;
  }
}

function deriveCellFill(cell, layer) {
  switch (layer) {
    case "crust":
      return cell.type === "continental" ? "#8a674f" : "#2563eb";
    case "boundaries":
      if (cell.boundaryCounts.convergent >= cell.boundaryCounts.divergent) {
        if (cell.boundaryCounts.convergent >= cell.boundaryCounts.transform) return "#ef4444";
      }
      if (cell.boundaryCounts.divergent >= cell.boundaryCounts.transform) return "#22c55e";
      if (cell.boundaryCounts.transform) return "#facc15";
      return "#334155";
    case "motion":
      return cell.motionSpeedMmYr > 0.5
        ? hsvToHex(cell.motionBearingDeg, 0.55, clamp(0.4 + cell.motionSpeedMmYr / 120, 0.45, 0.95))
        : "#334155";
    case "subduction":
      if (cell.boundaryRole === "trench") return "#7f1d1d";
      if (cell.boundaryRole === "arc") return "#f97316";
      if (cell.boundaryRole === "collision") return "#a855f7";
      if (cell.boundaryRole === "ridge") return "#22c55e";
      return "#334155";
    case "hotspots":
      return sequentialColor(
        clamp(cell.hotspotInfluence * 0.75 + cell.superswellInfluence * 0.5, 0, 1),
        "#1f2937",
        "#facc15",
      );
    case "crustAge":
      if (cell.type === "continental") return "#8b7355";
      return sequentialColor((cell.crustAgeMyr || 0) / 180, "#fb7185", "#1d4ed8");
    case "elevation":
      return elevationColor(cell.elevationM);
    case "volcanism":
      return sequentialColor(cell.volcanism, "#2b334d", "#ff5d00");
    case "seismicity":
      return sequentialColor(cell.seismicity, "#2b334d", "#fbbf24");
    default:
      return cell.color;
  }
}

function computeEditedCellCount(state, grid) {
  const defaults = createDefaultCellAssignments(grid, state.plates);
  let count = 0;
  for (let i = 0; i < defaults.length; i += 1) {
    if (state.cellPlateIds[i] !== defaults[i]) count += 1;
  }
  return count;
}

export function hasEditedCellAssignments(stateLike) {
  const state = normalizeTectonicsSimulatorState(stateLike);
  const grid = getGridForState(state);
  return computeEditedCellCount(state, grid) > 0;
}

export function hasEditedCellCrustTypes(stateLike) {
  const state = normalizeTectonicsSimulatorState(stateLike);
  return state.cellCrustTypes.some((value) => value != null);
}

export function applyTectonicsSimulatorTool(stateLike, action = {}) {
  const state = normalizeTectonicsSimulatorState(stateLike);
  const next = cloneNormalizedState(state);
  const grid = getGridForState(next);
  const tool = normalizeTool(action.tool ?? next.tool);
  const target = normalizePaintTarget(action.target ?? next.paintTarget);
  const cellId = action.cellId ?? next.selectedCellId;
  const cellIndex = getCellIndexById(grid, cellId);
  if (cellIndex < 0) return next;

  next.selectedCellId = grid.cells[cellIndex].id;
  if (tool === "select") return next;

  const indexes =
    tool === "fill"
      ? getFillIndexes(next, grid, cellId, target)
      : getBrushIndexes(grid, cellId, normalizeBrushRadius(action.brushRadius ?? next.brushRadius));

  if (!indexes.length) return next;

  if (target === "crust") {
    const crustType = normalizeCrustType(action.crustType ?? next.cellCrustPaintType);
    for (const index of indexes) {
      next.cellCrustTypes[index] = tool === "erase" ? null : crustType;
    }
    return normalizeTectonicsSimulatorState(next);
  }

  const selectedPlateId = action.selectedPlateId ?? next.selectedPlateId;
  if (!next.plates.some((plate) => plate.id === selectedPlateId)) {
    return next;
  }
  const defaults = tool === "erase" ? createDefaultCellAssignments(grid, next.plates) : null;
  for (const index of indexes) {
    next.cellPlateIds[index] = defaults ? defaults[index] : selectedPlateId;
  }
  return normalizeTectonicsSimulatorState(next);
}

export function applyTectonicsSimulatorImport(stateLike, rawPayload, kind = "plate") {
  const state = normalizeTectonicsSimulatorState(stateLike);
  const payload =
    rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload) ? rawPayload : null;
  if (!payload) throw new Error("Imported simulator map must be a JSON object.");

  const next = cloneNormalizedState(state);
  if (payload.gridResolution != null) {
    next.gridResolution = normalizeGridResolution(payload.gridResolution);
  }
  if (payload.plates != null) {
    next.plates = normalizeImportedPlates(payload.plates);
    next.selectedPlateId = next.plates[0]?.id || null;
  }

  const grid = getGridForState(next);
  next.selectedCellId =
    grid.cells.find((cell) => cell.id === next.selectedCellId)?.id || grid.cells[0]?.id || null;

  if (kind === "crust") {
    next.cellCrustTypes = normalizeImportedCrustAssignments(payload, grid, next.cellCrustTypes);
    return normalizeTectonicsSimulatorState(next);
  }

  next.cellPlateIds = normalizeImportedPlateAssignments(
    payload,
    grid,
    next.plates,
    next.cellPlateIds,
  );
  if (
    payload.selectedPlateId &&
    next.plates.some((plate) => plate.id === payload.selectedPlateId)
  ) {
    next.selectedPlateId = payload.selectedPlateId;
  }
  return normalizeTectonicsSimulatorState(next);
}

export function buildTectonicsSimulatorModel({
  simulator,
  tectonicRegime = "mobile",
  ridgeHeightM = 2600,
  spreadingRateFraction = 0.5,
  planetContext = {},
} = {}) {
  const state = normalizeTectonicsSimulatorState(simulator);
  const grid = getGridForState(state);
  const snapshot = computePlaybackSnapshot({ state, grid, timeMyr: state.timeMyr });
  const spreadInfo = spreadingRate(tectonicRegime, spreadingRateFraction);
  const plateGeom = calcPlates({ plates: state.plates, timeMyr: state.timeMyr });
  const seedByPlateId = new Map();
  const plateById = new Map(state.plates.map((plate) => [plate.id, plate]));
  for (let i = 0; i < state.plates.length; i += 1) {
    const plate = state.plates[i];
    const movedSeed = plateGeom.seeds[i] || plate;
    seedByPlateId.set(plate.id, {
      ...movedSeed,
      xyz: latLonToXYZ(movedSeed.latDeg, movedSeed.lonDeg),
    });
  }

  const heatFactor = clamp(
    0.65 +
      toFinite(spreadInfo.rateMmYr, 50) / 240 +
      toFinite(planetContext.tidalHeatingWm2, 0) * 0.75 +
      (toFinite(planetContext.radioisotopeAbundance, 1) - 1) * 0.2,
    0.4,
    1.6,
  );

  const plateSummaries = new Map(
    state.plates.map((plate) => [
      plate.id,
      {
        id: plate.id,
        label: plate.label,
        color: plate.color,
        type: plate.type,
        ownedCells: 0,
        convergent: 0,
        divergent: 0,
        transform: 0,
        ridges: 0,
        trenches: 0,
        arcs: 0,
        collisions: 0,
        volcanism: 0,
        seismicity: 0,
        elevationM: 0,
        terrainM: 0,
        motionSpeedMmYr: 0,
        hotspotCells: 0,
      },
    ]),
  );

  const cells = grid.cells.map((gridCell, index) => {
    const plate = plateById.get(snapshot.cellPlateIds[index]) || state.plates[0];
    const crustOverrideType = snapshot.cellCrustTypes[index];
    const effectiveType = crustOverrideType || plate.type;
    const summary = plateSummaries.get(plate.id);
    summary.ownedCells += 1;
    const motion = computeLocalMotion(plate, gridCell.centerLatDeg, gridCell.centerLonDeg);
    summary.motionSpeedMmYr += motion.speedMmYr;
    return {
      id: gridCell.id,
      seedIdx: gridCell.seedIdx,
      centerLatDeg: gridCell.centerLatDeg,
      centerLonDeg: gridCell.centerLonDeg,
      centerVec: gridCell.centerVec,
      vertices: gridCell.vertices,
      neighborIds: gridCell.neighborIds,
      plateId: plate.id,
      label: plate.label,
      color: plate.color,
      plateDefaultType: plate.type,
      crustOverrideType,
      type: effectiveType,
      boundaryCounts: { convergent: 0, divergent: 0, transform: 0 },
      crustAgeMyr: null,
      elevationM: 0,
      volcanism: 0,
      seismicity: 0,
      motionBearingDeg: motion.bearingDeg,
      motionSpeedMmYr: motion.speedMmYr,
      motionEastMmYr: motion.eastMmYr,
      motionNorthMmYr: motion.northMmYr,
      localBoundarySegments: 0,
      localBoundaryMix: "interior",
      boundaryRole: "interior",
      neighborTypes: [],
    };
  });

  const cellById = new Map(cells.map((cell) => [cell.id, cell]));
  for (const cell of cells) {
    cell.neighborTypes = cell.neighborIds
      .map((neighborId) => cellById.get(neighborId)?.type)
      .filter(Boolean);
  }
  const boundaryDetails = [];

  for (const edge of grid.edges) {
    const fromCell = cellById.get(edge.cellAId);
    const toCell = cellById.get(edge.cellBId);
    if (!fromCell || !toCell || fromCell.plateId === toCell.plateId) continue;

    const plateA = plateById.get(fromCell.plateId);
    const plateB = plateById.get(toCell.plateId);
    if (!plateA || !plateB) continue;

    const seedA = seedByPlateId.get(plateA.id);
    const seedB = seedByPlateId.get(plateB.id);
    const midpoint = {
      latDeg: (edge.from.latDeg + edge.to.latDeg) / 2,
      lonDeg: (edge.from.lonDeg + edge.to.lonDeg) / 2,
    };
    const kinematics = computeBoundaryKinematics(
      midpoint,
      seedA || plateA,
      seedB || plateB,
      plateA,
      plateB,
    );
    const type = kinematics.type;
    const asymmetry = resolveBoundaryAsymmetry(fromCell, toCell, kinematics);
    const speedNorm = clamp(kinematics.relSpeedMmYr / 120, 0.15, 1.4);
    const midpointVec = {
      x: clamp(
        (latLonToXYZ(edge.from.latDeg, edge.from.lonDeg).x +
          latLonToXYZ(edge.to.latDeg, edge.to.lonDeg).x) /
          2,
        -1,
        1,
      ),
      y: clamp(
        (latLonToXYZ(edge.from.latDeg, edge.from.lonDeg).y +
          latLonToXYZ(edge.to.latDeg, edge.to.lonDeg).y) /
          2,
        -1,
        1,
      ),
      z: clamp(
        (latLonToXYZ(edge.from.latDeg, edge.from.lonDeg).z +
          latLonToXYZ(edge.to.latDeg, edge.to.lonDeg).z) /
          2,
        -1,
        1,
      ),
    };

    fromCell.boundaryCounts[type] += 1;
    toCell.boundaryCounts[type] += 1;
    fromCell.localBoundarySegments += 1;
    toCell.localBoundarySegments += 1;

    const summaryA = plateSummaries.get(plateA.id);
    const summaryB = plateSummaries.get(plateB.id);
    summaryA[type] += 1;
    summaryB[type] += 1;
    if (asymmetry.mode === "ridge") {
      summaryA.ridges += 1;
      summaryB.ridges += 1;
      updateBoundaryRole(fromCell, "ridge");
      updateBoundaryRole(toCell, "ridge");
    }
    if (asymmetry.mode === "subduction") {
      if (asymmetry.trenchPlateId === fromCell.plateId) {
        summaryA.trenches += 1;
        updateBoundaryRole(fromCell, "trench");
      }
      if (asymmetry.trenchPlateId === toCell.plateId) {
        summaryB.trenches += 1;
        updateBoundaryRole(toCell, "trench");
      }
      if (asymmetry.arcPlateId === fromCell.plateId) {
        summaryA.arcs += 1;
        updateBoundaryRole(fromCell, "arc");
      }
      if (asymmetry.arcPlateId === toCell.plateId) {
        summaryB.arcs += 1;
        updateBoundaryRole(toCell, "arc");
      }
    }
    if (asymmetry.mode === "collision") {
      summaryA.collisions += 1;
      summaryB.collisions += 1;
      updateBoundaryRole(fromCell, "collision");
      updateBoundaryRole(toCell, "collision");
    }
    if (asymmetry.mode === "transform") {
      updateBoundaryRole(fromCell, "transform");
      updateBoundaryRole(toCell, "transform");
    }

    boundaryDetails.push({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      type,
      mode: asymmetry.mode,
      plateAId: plateA.id,
      plateBId: plateB.id,
      speedNorm,
      relSpeedMmYr: kinematics.relSpeedMmYr,
      convergenceMmYr: kinematics.convergenceMmYr,
      divergenceMmYr: kinematics.divergenceMmYr,
      strikeSlipMmYr: kinematics.strikeSlipMmYr,
      subductingPlateId: asymmetry.subductingPlateId,
      overridingPlateId: asymmetry.overridingPlateId,
      trenchPlateId: asymmetry.trenchPlateId,
      arcPlateId: asymmetry.arcPlateId,
      orogenType: asymmetry.orogenType,
      midpointVec,
    });
  }

  for (const cell of cells) {
    const plateSummary = plateSummaries.get(cell.plateId);
    const boundarySegments = Math.max(1, cell.localBoundarySegments);
    const cellSeed = seedByPlateId.get(cell.plateId);
    const distNorm = cellSeed
      ? clamp(
          Math.acos(
            clamp(
              cell.centerVec.x * cellSeed.xyz.x +
                cell.centerVec.y * cellSeed.xyz.y +
                cell.centerVec.z * cellSeed.xyz.z,
              -1,
              1,
            ),
          ) / Math.PI,
          0,
          1,
        )
      : 0.5;

    cell.crustAgeMyr =
      cell.type === "oceanic" ? estimateOceanicAge(cell.boundaryCounts, distNorm) : null;

    let elevationM;
    if (cell.type === "continental") {
      elevationM = clamp(
        280 +
          cell.boundaryCounts.convergent * 620 -
          cell.boundaryCounts.divergent * 260 +
          cell.boundaryCounts.transform * 40,
        -900,
        toFinite(planetContext.maxPeakHeightM, 9000),
      );
      if (cell.boundaryRole === "collision") elevationM += 1500;
      if (cell.boundaryRole === "arc") elevationM += 820;
    } else {
      const depthM = oceanDepth(cell.crustAgeMyr || 80, ridgeHeightM);
      elevationM = clamp(
        -depthM -
          cell.boundaryCounts.convergent * 620 +
          cell.boundaryCounts.divergent * 460 +
          cell.boundaryCounts.transform * 45,
        -11000,
        1800,
      );
      if (cell.boundaryRole === "ridge") elevationM += 700;
      if (cell.boundaryRole === "trench") elevationM -= 1100;
    }

    cell.elevationM = elevationM;
    cell.volcanism = clamp(
      ((cell.boundaryCounts.divergent * 0.5 +
        cell.boundaryCounts.convergent * 0.74 +
        cell.boundaryCounts.transform * 0.12) *
        heatFactor) /
        boundarySegments,
      0,
      1,
    );
    if (cell.boundaryRole === "arc") cell.volcanism = clamp(cell.volcanism + 0.2, 0, 1);
    if (cell.boundaryRole === "ridge") cell.volcanism = clamp(cell.volcanism + 0.12, 0, 1);
    cell.seismicity = clamp(
      (cell.boundaryCounts.convergent * 1.0 +
        cell.boundaryCounts.transform * 0.82 +
        cell.boundaryCounts.divergent * 0.42) /
        boundarySegments,
      0,
      1,
    );
    cell.localBoundaryMix = buildBoundaryMix(cell.boundaryCounts);

    plateSummary.volcanism += cell.volcanism;
    plateSummary.seismicity += cell.seismicity;
    plateSummary.elevationM += cell.elevationM;
  }

  enrichGeologyFields(cells, boundaryDetails);

  for (const cell of cells) {
    const plateSummary = plateSummaries.get(cell.plateId);
    plateSummary.terrainM += cell.terrainElevationM;
    if (cell.hotspotInfluence > 0.45 || cell.superswellInfluence > 0.45) {
      plateSummary.hotspotCells += 1;
    }
    cell.fill = deriveCellFill(cell, state.layer);
  }

  for (const plateSummary of plateSummaries.values()) {
    const ownedCells = Math.max(1, plateSummary.ownedCells);
    plateSummary.averageVolcanism = plateSummary.volcanism / ownedCells;
    plateSummary.averageSeismicity = plateSummary.seismicity / ownedCells;
    plateSummary.averageElevationM = plateSummary.elevationM / ownedCells;
    plateSummary.averageTerrainM = plateSummary.terrainM / ownedCells;
    plateSummary.averageMotionSpeedMmYr = plateSummary.motionSpeedMmYr / ownedCells;
    plateSummary.boundaryMix = buildBoundaryMix(plateSummary);
  }

  const selectedPlate =
    plateSummaries.get(state.selectedPlateId) || plateSummaries.get(state.plates[0]?.id) || null;
  const selectedCell = cellById.get(state.selectedCellId) || cells[0] || null;
  const editedCellCount = computeEditedCellCount(state, grid);

  const summary = {
    plateCount: state.plates.length,
    cellCount: cells.length,
    boundaryCount: boundaryDetails.length,
    subductionBoundaryCount: boundaryDetails.filter((boundary) => boundary.mode === "subduction")
      .length,
    collisionBoundaryCount: boundaryDetails.filter((boundary) => boundary.mode === "collision")
      .length,
    continentalCount: cells.filter((cell) => cell.type === "continental").length,
    oceanicCount: cells.filter((cell) => cell.type === "oceanic").length,
    editedCellCount,
    crustOverrideCount: state.cellCrustTypes.filter((value) => value != null).length,
    remappedCellCount: snapshot.remappedCellCount,
    averageVolcanism:
      cells.reduce((sum, cell) => sum + cell.volcanism, 0) / Math.max(1, cells.length),
    averageSeismicity:
      cells.reduce((sum, cell) => sum + cell.seismicity, 0) / Math.max(1, cells.length),
    terrainMinM: Math.min(...cells.map((cell) => cell.terrainElevationM)),
    terrainMaxM: Math.max(...cells.map((cell) => cell.terrainElevationM)),
  };

  return {
    state,
    snapshot,
    grid,
    spreadInfo,
    heatFactor,
    cells,
    boundaries: boundaryDetails,
    seeds: plateGeom.seeds.map((seed, index) => ({
      ...seed,
      color: state.plates[index]?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      label: state.plates[index]?.label || `Plate ${index + 1}`,
      type: state.plates[index]?.type || "oceanic",
      id: state.plates[index]?.id || `plate-${index + 1}`,
    })),
    selectedPlate,
    selectedCell,
    summary,
  };
}
