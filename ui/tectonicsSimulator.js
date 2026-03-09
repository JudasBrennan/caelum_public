// SPDX-License-Identifier: MPL-2.0
import { fmt } from "../engine/utils.js";
import {
  getTectonicsSimulatorGrid,
  TECTONICS_GRID_RESOLUTIONS,
} from "../engine/tectonics-sim/grid.js";
import {
  applyTectonicsSimulatorImport,
  applyTectonicsSimulatorTool,
  buildTectonicsSimulatorModel,
  createDefaultCellAssignments,
  createSeededSimulatorPlates,
  hasEditedCellAssignments,
  TECTONICS_SIMULATOR_BRUSH_RADII,
  TECTONICS_SIMULATOR_CRUST_TYPES,
  normalizeTectonicsSimulatorState,
  TECTONICS_SIMULATOR_LAYERS,
  TECTONICS_SIMULATOR_PAINT_TARGETS,
  TECTONICS_SIMULATOR_TOOLS,
} from "../engine/tectonics-sim/model.js";
import { buildTerrainRaster } from "../engine/tectonics-sim/terrain.js";
import { tipIcon, attachTooltips } from "./tooltip.js";
import { escapeHtml } from "./uiHelpers.js";
import { loadWorld, updateWorld } from "./store.js";

const DEG = Math.PI / 180;

const TIP_TEXT = {
  layer:
    "Preview the current painted cell ownership as plate, crust type, boundaries, crust age, elevation, volcanism, or seismicity.",
  tool: "Select cells to inspect them, or use Brush, Fill, and Erase to edit either plate ownership or cell-level crust overrides.",
  target:
    "Choose whether editing tools modify plate ownership or a cell-level crust override. Plate defaults still exist; crust overrides only affect painted cells.",
  brush:
    "Brush radius in neighbor rings on the logical mostly-hex grid. Fill always uses the full contiguous region and ignores this radius.",
  crustPaint:
    "Crust type painted onto cells when the target is set to cell crust. Erase clears the override back to the owning plate default.",
  resolution:
    "Logical mostly-hex sphere grid used by the tectonics simulator. Higher resolutions add more editable cells but make the preview denser.",
  time: "Geological time offset in Myr. This now previews deterministic rigid-plate ownership remap from the painted baseline, with play, step, scrub, and reset controls.",
  plate:
    "Plate object used to seed and steer cell ownership. Drag the seed marker in either view, or edit the numeric fields to move the plate.",
  cell: "Logical grid cell. This stage stores per-cell ownership and per-cell crust overrides directly in world state, so edit actions survive save/load and import/export.",
  boundaryMix:
    "Boundary tally touching the selected plate. C = convergent, D = divergent, T = transform.",
  crustAge:
    "First-pass oceanic age estimate derived from local boundary context and ridge-distance heuristics. Continental cells do not use a crust-age layer in this phase.",
  elevation:
    "Static geology estimate from crust type, age, and boundary context. Convergent margins uplift; trenches deepen the subducting side; divergent margins keep oceanic crust young and shallow.",
  volcanism:
    "Relative volcanic potential from ridges, subduction arcs, and the current planet heat budget.",
  seismicity:
    "Relative seismic potential from convergent, transform, and divergent boundary exposure.",
  playback:
    "Preview the painted tectonic sketch through deterministic rigid-plate playback. Ownership is advected from the painted cell state and resolved back onto the fixed logical grid.",
  terrain:
    "High-resolution terrain preview generated from the simulator's geology fields. This is terrain synthesis on top of tectonic structure, not just enlarged cell colours.",
};

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function formatTimeLabel(timeMyr) {
  return `${fmt(timeMyr, 0)} Myr`;
}

function getSimulatorState() {
  return normalizeTectonicsSimulatorState(loadWorld()?.tectonics?.simulator);
}

function saveSimulatorState(nextState) {
  const normalized = normalizeTectonicsSimulatorState(nextState);
  updateWorld({
    tectonics: {
      simulator: normalized,
    },
  });
  return normalized;
}

function getCanvasSize(canvas, fallbackWidth, fallbackHeight) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Number(canvas.clientWidth) || fallbackWidth;
  const height = Number(canvas.clientHeight) || fallbackHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  return { width, height, dpr };
}

function normalizeLonAround(lonDeg, aroundDeg) {
  let lon = lonDeg;
  while (lon - aroundDeg > 180) lon -= 360;
  while (lon - aroundDeg < -180) lon += 360;
  return lon;
}

function projectFlat(latDeg, lonDeg, width, height) {
  return {
    x: ((lonDeg + 180) / 360) * width,
    y: ((90 - latDeg) / 180) * height,
  };
}

function projectOrtho(latDeg, lonDeg, centerLatDeg, centerLonDeg, radius) {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const lat0 = centerLatDeg * DEG;
  const lon0 = centerLonDeg * DEG;
  const dLon = lon - lon0;
  const cosc = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(dLon);
  if (cosc <= 0) return { visible: false, x: 0, y: 0 };
  return {
    visible: true,
    x: radius * Math.cos(lat) * Math.sin(dLon),
    y: -radius * (Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(dLon)),
  };
}

function invertOrtho(normX, normY, centerLatDeg, centerLonDeg) {
  const rho = Math.hypot(normX, normY);
  if (rho > 1) return null;
  const lat0 = centerLatDeg * DEG;
  const lon0 = centerLonDeg * DEG;
  if (rho < 1e-6) return { latDeg: centerLatDeg, lonDeg: centerLonDeg };
  const c = Math.asin(rho);
  const sinC = Math.sin(c);
  const cosC = Math.cos(c);
  const yUp = -normY;
  const lat = Math.asin(cosC * Math.sin(lat0) + (yUp * sinC * Math.cos(lat0)) / rho);
  const lon =
    lon0 + Math.atan2(normX * sinC, rho * Math.cos(lat0) * cosC - yUp * Math.sin(lat0) * sinC);
  return {
    latDeg: lat / DEG,
    lonDeg: ((lon / DEG + 540) % 360) - 180,
  };
}

function getBoundaryStroke(boundaryType) {
  if (boundaryType === "convergent") return "#ef4444";
  if (boundaryType === "divergent") return "#22c55e";
  return "#facc15";
}

function renderLegend(layerId) {
  switch (layerId) {
    case "crust":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#8a674f"></span>Continental</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#2563eb"></span>Oceanic</span>
      `;
    case "boundaries":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#ef4444"></span>Convergent</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#22c55e"></span>Divergent</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#facc15"></span>Transform</span>
      `;
    case "motion":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#ef4444"></span>Different hue = different drift bearing</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#94a3b8"></span>Brighter = faster local motion</span>
      `;
    case "subduction":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#7f1d1d"></span>Trench / subducting side</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#f97316"></span>Arc / overriding side</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#a855f7"></span>Collision belt</span>
      `;
    case "hotspots":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#1f2937"></span>Low hotspot / swell influence</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#facc15"></span>High hotspot / swell influence</span>
      `;
    case "crustAge":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#fb7185"></span>Young oceanic crust</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#1d4ed8"></span>Old oceanic crust</span>
      `;
    case "elevation":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#164e98"></span>Deep ocean</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#7e9a5d"></span>Low land</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#b89f8a"></span>High relief</span>
      `;
    case "volcanism":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#2b334d"></span>Low</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#ff5d00"></span>High</span>
      `;
    case "seismicity":
      return `
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#2b334d"></span>Low</span>
        <span class="tec-sim__legend-item"><span class="tec-sim__legend-swatch" style="background:#fbbf24"></span>High</span>
      `;
    default:
      return `<span class="hint">Selected layer colours each logical cell by its current owning plate.</span>`;
  }
}

function drawTerrainPreview(canvas, model, mode = "shaded") {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const preview = buildTerrainRaster(model, { width: 1024, height: 512, mode });
  canvas.width = preview.width;
  canvas.height = preview.height;
  const imageData = ctx.createImageData(preview.width, preview.height);
  imageData.data.set(preview.colors);
  ctx.putImageData(imageData, 0, 0);
}

function drawLayerRaster(canvas, model) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b1228";
  ctx.fillRect(0, 0, width, height);

  for (const cell of model.cells) {
    const aroundLon = cell.centerLonDeg;
    const points = cell.vertices.map((vertex) => ({
      latDeg: vertex.latDeg,
      lonDeg: normalizeLonAround(vertex.lonDeg, aroundLon),
    }));
    for (const offset of [-360, 0, 360]) {
      const shifted = points.map((point) =>
        projectFlat(point.latDeg, point.lonDeg + offset, width, height),
      );
      if (!shifted.some((point) => point.x >= -20 && point.x <= width + 20)) continue;
      ctx.beginPath();
      shifted.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fillStyle = cell.fill;
      ctx.fill();
    }
  }

  if (model.state.layer === "boundaries") {
    ctx.lineWidth = 2;
    for (const boundary of model.boundaries) {
      const aroundLon = normalizeLonAround((boundary.from.lonDeg + boundary.to.lonDeg) / 2, 0);
      const fromLon = normalizeLonAround(boundary.from.lonDeg, aroundLon);
      const toLon = normalizeLonAround(boundary.to.lonDeg, aroundLon);
      for (const offset of [-360, 0, 360]) {
        const from = projectFlat(boundary.from.latDeg, fromLon + offset, width, height);
        const to = projectFlat(boundary.to.latDeg, toLon + offset, width, height);
        if (
          Math.max(from.x, to.x) < -10 ||
          Math.min(from.x, to.x) > width + 10 ||
          Math.max(from.y, to.y) < -10 ||
          Math.min(from.y, to.y) > height + 10
        ) {
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = getBoundaryStroke(boundary.type);
        ctx.stroke();
      }
    }
  }
}

async function downloadTerrainPreview(model, mode, filename) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const raster = buildTerrainRaster(model, {
    width: mode === "shaded" ? 2048 : 1024,
    height: mode === "shaded" ? 1024 : 512,
    mode,
  });
  canvas.width = raster.width;
  canvas.height = raster.height;
  const imageData = ctx.createImageData(raster.width, raster.height);
  imageData.data.set(raster.colors);
  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function downloadCurrentLayer(model, filename) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  drawLayerRaster(canvas, model);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getSelectedPlate(state) {
  return (
    state.plates.find((plate) => plate.id === state.selectedPlateId) || state.plates[0] || null
  );
}

function nearestMarker(markers, x, y, radius = 10) {
  let best = null;
  let bestDist = radius;
  for (const marker of markers) {
    const dist = Math.hypot(marker.x - x, marker.y - y);
    if (dist <= bestDist) {
      best = marker;
      bestDist = dist;
    }
  }
  return best;
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pickCell(polygons, x, y) {
  for (let i = polygons.length - 1; i >= 0; i -= 1) {
    const polygon = polygons[i];
    if (pointInPolygon(x, y, polygon.points)) return polygon;
  }
  return null;
}

function drawFlatMap(canvas, model, hitState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height, dpr } = getCanvasSize(canvas, 460, 240);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "rgba(7, 13, 32, 0.92)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;

  for (let lon = -180; lon <= 180; lon += 45) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  hitState.flatSeeds = [];
  hitState.flatCells = [];

  for (const cell of model.cells) {
    const aroundLon = cell.centerLonDeg;
    const points = cell.vertices.map((vertex) => ({
      latDeg: vertex.latDeg,
      lonDeg: normalizeLonAround(vertex.lonDeg, aroundLon),
    }));
    for (const offset of [-360, 0, 360]) {
      const shifted = points.map((point) =>
        projectFlat(point.latDeg, point.lonDeg + offset, width, height),
      );
      if (!shifted.some((point) => point.x >= -20 && point.x <= width + 20)) continue;
      ctx.beginPath();
      shifted.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fillStyle = cell.fill;
      ctx.fill();
      ctx.strokeStyle =
        cell.id === model.state.selectedCellId ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.10)";
      ctx.lineWidth = cell.id === model.state.selectedCellId ? 1.8 : 0.8;
      ctx.stroke();
      hitState.flatCells.push({ cellId: cell.id, points: shifted });
    }
  }

  ctx.lineWidth = 2;
  for (const boundary of model.boundaries) {
    const aroundLon = normalizeLonAround((boundary.from.lonDeg + boundary.to.lonDeg) / 2, 0);
    const fromLon = normalizeLonAround(boundary.from.lonDeg, aroundLon);
    const toLon = normalizeLonAround(boundary.to.lonDeg, aroundLon);
    for (const offset of [-360, 0, 360]) {
      const from = projectFlat(boundary.from.latDeg, fromLon + offset, width, height);
      const to = projectFlat(boundary.to.latDeg, toLon + offset, width, height);
      if (
        Math.max(from.x, to.x) < -10 ||
        Math.min(from.x, to.x) > width + 10 ||
        Math.max(from.y, to.y) < -10 ||
        Math.min(from.y, to.y) > height + 10
      ) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = getBoundaryStroke(boundary.type);
      ctx.stroke();
    }
  }

  for (const seed of model.seeds) {
    const point = projectFlat(seed.latDeg, seed.lonDeg, width, height);
    hitState.flatSeeds.push({ plateId: seed.id, x: point.x, y: point.y });
    const selected = seed.id === model.state.selectedPlateId;
    ctx.beginPath();
    ctx.arc(point.x, point.y, selected ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = seed.color;
    ctx.fill();
    ctx.strokeStyle = selected ? "#ffffff" : "rgba(255,255,255,0.55)";
    ctx.lineWidth = selected ? 2 : 1;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.fillText(`Plate Carree | ${model.grid.count} cells`, 10, 18);
}

function drawGlobe(canvas, model, viewState, hitState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height, dpr } = getCanvasSize(canvas, 360, 360);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.42;

  ctx.fillStyle = "rgba(7, 13, 32, 0.92)";
  ctx.fillRect(0, 0, width, height);
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(12, 20, 46, 1)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  hitState.globeSeeds = [];
  hitState.globeCells = [];

  for (const cell of model.cells) {
    const projected = cell.vertices
      .map((vertex) =>
        projectOrtho(
          vertex.latDeg,
          vertex.lonDeg,
          viewState.centerLat,
          viewState.centerLon,
          radius,
        ),
      )
      .filter((point) => point.visible)
      .map((point) => ({ x: cx + point.x, y: cy + point.y }));
    if (projected.length < 3) continue;

    ctx.beginPath();
    projected.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = cell.fill;
    ctx.fill();
    ctx.strokeStyle =
      cell.id === model.state.selectedCellId ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = cell.id === model.state.selectedCellId ? 1.8 : 0.8;
    ctx.stroke();
    hitState.globeCells.push({ cellId: cell.id, points: projected });
  }

  ctx.lineWidth = 2;
  for (const boundary of model.boundaries) {
    const from = projectOrtho(
      boundary.from.latDeg,
      boundary.from.lonDeg,
      viewState.centerLat,
      viewState.centerLon,
      radius,
    );
    const to = projectOrtho(
      boundary.to.latDeg,
      boundary.to.lonDeg,
      viewState.centerLat,
      viewState.centerLon,
      radius,
    );
    if (!from.visible || !to.visible) continue;
    ctx.beginPath();
    ctx.moveTo(cx + from.x, cy + from.y);
    ctx.lineTo(cx + to.x, cy + to.y);
    ctx.strokeStyle = getBoundaryStroke(boundary.type);
    ctx.stroke();
  }

  for (const seed of model.seeds) {
    const projected = projectOrtho(
      seed.latDeg,
      seed.lonDeg,
      viewState.centerLat,
      viewState.centerLon,
      radius,
    );
    if (!projected.visible) continue;
    const x = cx + projected.x;
    const y = cy + projected.y;
    hitState.globeSeeds.push({ plateId: seed.id, x, y });
    const selected = seed.id === model.state.selectedPlateId;
    ctx.beginPath();
    ctx.arc(x, y, selected ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = seed.color;
    ctx.fill();
    ctx.strokeStyle = selected ? "#ffffff" : "rgba(255,255,255,0.55)";
    ctx.lineWidth = selected ? 2 : 1;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.fillText(`Orthographic globe | ${model.grid.count} cells`, 12, 18);
}

export function initTectonicsSimulator(root, options = {}) {
  if (!root) return () => {};
  if (typeof root.__tectonicsSimCleanup === "function") root.__tectonicsSimCleanup();

  let state = getSimulatorState();
  const viewState = { centerLat: 18, centerLon: -30 };
  const hitState = { flatSeeds: [], globeSeeds: [], flatCells: [], globeCells: [] };
  let dragState = null;
  let importStatus = null;
  let isPlaying = false;
  let playbackTimer = null;
  let terrainMode = "shaded";
  let cleanupFns = [];

  function cleanup({ keepPlayback = false } = {}) {
    if (!keepPlayback && playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
      isPlaying = false;
    }
    for (const fn of cleanupFns) fn();
    cleanupFns = [];
  }

  function buildModel() {
    return buildTectonicsSimulatorModel({
      simulator: state,
      tectonicRegime: options.tectonicRegime || "mobile",
      ridgeHeightM: options.ridgeHeightM ?? 2600,
      spreadingRateFraction: options.spreadingRateFraction ?? 0.5,
      planetContext: options.planetContext || {},
    });
  }

  function commit(nextState, { preserveStatus = false } = {}) {
    state = saveSimulatorState(nextState);
    if (!preserveStatus) importStatus = null;
    render();
  }

  function getCurrentGrid(nextState = state) {
    return getTectonicsSimulatorGrid(nextState.gridResolution);
  }

  function stopPlaybackLoop() {
    if (!playbackTimer) return;
    clearInterval(playbackTimer);
    playbackTimer = null;
    isPlaying = false;
  }

  function startPlaybackLoop() {
    stopPlaybackLoop();
    isPlaying = true;
    playbackTimer = window.setInterval(() => {
      const current = getSimulatorState();
      const next = cloneState(current);
      next.timeMyr = Math.min(
        250,
        (Number(next.timeMyr) || 0) + (Number(next.playbackStepMyr) || 5),
      );
      if (next.timeMyr >= 250) {
        stopPlaybackLoop();
      }
      commit(next, { preserveStatus: true });
    }, 450);
  }

  function maybeRegenerateAssignments(nextState, force = false) {
    const shouldAuto = force || !hasEditedCellAssignments(state);
    if (!shouldAuto) return nextState;
    const grid = getCurrentGrid(nextState);
    nextState.cellPlateIds = createDefaultCellAssignments(grid, nextState.plates);
    nextState.selectedCellId = grid.cells[0]?.id || nextState.selectedCellId || null;
    return nextState;
  }

  function syncSelectedFields() {
    const plate = getSelectedPlate(state);
    if (!plate) return;
    const mapping = {
      "#tecSimPlateLabel": plate.label,
      "#tecSimPlateType": plate.type,
      "#tecSimPlateLat": fmt(plate.latDeg, 2),
      "#tecSimPlateLon": fmt(plate.lonDeg, 2),
      "#tecSimPoleLat": fmt(plate.eulerPoleLat, 2),
      "#tecSimPoleLon": fmt(plate.eulerPoleLon, 2),
      "#tecSimAngularVel": fmt(plate.angularVelDegMyr, 3),
    };
    Object.entries(mapping).forEach(([selector, value]) => {
      const el = root.querySelector(selector);
      if (el) el.value = String(value);
    });
  }

  function syncSelectedReadouts(model) {
    const plate = model.selectedPlate;
    const cell = model.selectedCell;
    const plateValues = {
      "#tecSimBoundaryMix": plate?.boundaryMix || "interior",
      "#tecSimOwnedCells": plate ? String(plate.ownedCells) : "0",
      "#tecSimPlateElevation": plate ? `${fmt(plate.averageElevationM, 0)} m` : "n/a",
      "#tecSimPlateTerrain": plate ? `${fmt(plate.averageTerrainM, 0)} m` : "n/a",
      "#tecSimPlateMotion": plate ? `${fmt(plate.averageMotionSpeedMmYr, 1)} mm/yr` : "0.0 mm/yr",
      "#tecSimVolcanism": plate ? fmt(plate.averageVolcanism, 2) : "0.00",
      "#tecSimSeismicity": plate ? fmt(plate.averageSeismicity, 2) : "0.00",
    };
    Object.entries(plateValues).forEach(([selector, value]) => {
      const el = root.querySelector(selector);
      if (el) el.textContent = value;
    });

    const cellValues = {
      "#tecSimCellId": cell?.id || "n/a",
      "#tecSimCellPlate": cell?.label || "n/a",
      "#tecSimCellCoords": cell
        ? `${fmt(cell.centerLatDeg, 1)} deg, ${fmt(cell.centerLonDeg, 1)} deg`
        : "n/a",
      "#tecSimCellType": cell?.type === "continental" ? "Continental" : "Oceanic",
      "#tecSimCellOverride":
        cell?.crustOverrideType == null
          ? "Plate default"
          : cell.crustOverrideType === "continental"
            ? "Continental"
            : "Oceanic",
      "#tecSimCellRole": cell?.boundaryRole || "interior",
      "#tecSimCellMotion": cell
        ? `${fmt(cell.motionSpeedMmYr, 1)} mm/yr @ ${fmt(cell.motionBearingDeg, 0)} deg`
        : "n/a",
      "#tecSimCellBoundaryMix": cell?.localBoundaryMix || "interior",
      "#tecSimCrustAge":
        cell?.crustAgeMyr == null ? "Continental" : `${fmt(cell.crustAgeMyr, 0)} Myr`,
      "#tecSimElevation": cell ? `${fmt(cell.elevationM, 0)} m` : "n/a",
      "#tecSimCellTerrain": cell ? `${fmt(cell.terrainElevationM, 0)} m` : "n/a",
      "#tecSimHotspot": cell
        ? fmt((cell.hotspotInfluence || 0) + (cell.superswellInfluence || 0) * 0.5, 2)
        : "0.00",
      "#tecSimCellVolcanism": cell ? fmt(cell.volcanism, 2) : "0.00",
      "#tecSimCellSeismicity": cell ? fmt(cell.seismicity, 2) : "0.00",
    };
    Object.entries(cellValues).forEach(([selector, value]) => {
      const el = root.querySelector(selector);
      if (el) el.textContent = value;
    });
  }

  function drawOnly() {
    const model = buildModel();
    const globe = root.querySelector("#tecSimGlobe");
    const map = root.querySelector("#tecSimMap");
    const terrain = root.querySelector("#tecSimTerrain");
    if (globe) drawGlobe(globe, model, viewState, hitState);
    if (map) drawFlatMap(map, model, hitState);
    if (terrain) drawTerrainPreview(terrain, model, terrainMode);
    syncSelectedReadouts(model);
  }

  function updateSelectedPlate(patch, { draft = false } = {}) {
    const next = cloneState(state);
    const plate = next.plates.find((entry) => entry.id === next.selectedPlateId);
    if (!plate) return;
    Object.assign(plate, patch);
    maybeRegenerateAssignments(next);
    if (draft) {
      state = normalizeTectonicsSimulatorState(next);
      drawOnly();
      syncSelectedFields();
    } else {
      commit(next);
    }
  }

  function readImportFile(file, kind) {
    if (!file) return;
    const readText =
      typeof file.text === "function"
        ? file.text()
        : new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
            reader.onload = () => resolve(String(reader.result || ""));
            reader.readAsText(file);
          });

    readText
      .then((text) => {
        const payload = JSON.parse(String(text || ""));
        const next = applyTectonicsSimulatorImport(state, payload, kind);
        importStatus = {
          type: "ok",
          message:
            kind === "crust"
              ? "Imported crust JSON into the current simulator grid."
              : "Imported plate JSON into the current simulator grid.",
        };
        commit(next, { preserveStatus: true });
      })
      .catch((error) => {
        importStatus = {
          type: "error",
          message:
            kind === "crust"
              ? `Crust import failed: ${error.message}`
              : `Plate import failed: ${error.message}`,
        };
        render();
      });
  }

  function applyCellTool(cellId) {
    if (!cellId) return;
    const next = applyTectonicsSimulatorTool(state, {
      cellId,
      tool: state.tool,
      target: state.paintTarget,
      selectedPlateId: state.selectedPlateId,
      brushRadius: state.brushRadius,
      crustType: state.cellCrustPaintType,
    });
    commit(next);
  }

  function render() {
    cleanup({ keepPlayback: true });
    state = getSimulatorState();
    const model = buildModel();
    const selectedPlate = model.selectedPlate;
    const selectedCell = model.selectedCell;
    const editingPlate = getSelectedPlate(state);
    const plateButtons = state.plates
      .map(
        (plate) => `
          <button type="button" class="tec-sim__plate-btn ${plate.id === state.selectedPlateId ? "is-selected" : ""}" data-plate-id="${escapeHtml(plate.id)}">
            <span class="tec-sim__plate-swatch" style="background:${escapeHtml(plate.color)}"></span>
            <span>${escapeHtml(plate.label)}</span>
          </button>
        `,
      )
      .join("");

    root.innerHTML = `
      <div class="tec-sim">
        <div class="hint tec-sim__hint">
          Static tectonic reconstruction on the persistent mostly-hex grid. The simulator now previews rigid-plate playback, boundary asymmetry, continuous geology fields, and terrain output before climate logic begins.
        </div>
        <div class="tec-sim__toolbar">
          <label class="tec-sim__control">
            <span>Layer ${tipIcon(TIP_TEXT.layer)}</span>
            <select id="tecSimLayer">
              ${TECTONICS_SIMULATOR_LAYERS.map(
                (layer) =>
                  `<option value="${layer.id}" ${layer.id === state.layer ? "selected" : ""}>${escapeHtml(layer.label)}</option>`,
              ).join("")}
            </select>
          </label>
          <label class="tec-sim__control">
            <span>Tool ${tipIcon(TIP_TEXT.tool)}</span>
            <select id="tecSimTool">
              ${TECTONICS_SIMULATOR_TOOLS.map(
                (tool) =>
                  `<option value="${tool.id}" ${tool.id === state.tool ? "selected" : ""}>${escapeHtml(tool.label)}</option>`,
              ).join("")}
            </select>
          </label>
          <label class="tec-sim__control">
            <span>Target ${tipIcon(TIP_TEXT.target)}</span>
            <select id="tecSimTarget">
              ${TECTONICS_SIMULATOR_PAINT_TARGETS.map(
                (entry) =>
                  `<option value="${entry.id}" ${entry.id === state.paintTarget ? "selected" : ""}>${escapeHtml(entry.label)}</option>`,
              ).join("")}
            </select>
          </label>
          <label class="tec-sim__control">
            <span>Brush ${tipIcon(TIP_TEXT.brush)}</span>
            <select id="tecSimBrushRadius">
              ${TECTONICS_SIMULATOR_BRUSH_RADII.map(
                (entry) =>
                  `<option value="${entry.id}" ${entry.id === state.brushRadius ? "selected" : ""}>${escapeHtml(entry.label)}</option>`,
              ).join("")}
            </select>
          </label>
          <label class="tec-sim__control">
            <span>Crust Paint ${tipIcon(TIP_TEXT.crustPaint)}</span>
            <select id="tecSimCrustPaintType">
              ${TECTONICS_SIMULATOR_CRUST_TYPES.map(
                (entry) =>
                  `<option value="${entry.id}" ${entry.id === state.cellCrustPaintType ? "selected" : ""}>${escapeHtml(entry.label)}</option>`,
              ).join("")}
            </select>
          </label>
          <label class="tec-sim__control">
            <span>Grid ${tipIcon(TIP_TEXT.resolution)}</span>
            <select id="tecSimResolution">
              ${TECTONICS_GRID_RESOLUTIONS.map(
                (entry) =>
                  `<option value="${entry.id}" ${entry.id === state.gridResolution ? "selected" : ""}>${escapeHtml(entry.label)} (~${entry.count})</option>`,
              ).join("")}
            </select>
          </label>
          <label class="tec-sim__control">
            <span>Time ${tipIcon(TIP_TEXT.time)}</span>
            <input id="tecSimTime" type="number" min="0" max="250" step="1" value="${fmt(state.timeMyr, 0)}" />
          </label>
          <label class="tec-sim__control">
            <span>Playback Step ${tipIcon(TIP_TEXT.playback)}</span>
            <input id="tecSimPlaybackStep" type="number" min="1" max="50" step="1" value="${fmt(state.playbackStepMyr, 0)}" />
          </label>
          <div class="tec-sim__toolbar-buttons">
            <button type="button" id="tecSimAutoSeed">Auto-seed 8</button>
            <button type="button" id="tecSimAddPlate">Add Plate</button>
            <button type="button" id="tecSimDeletePlate" ${state.plates.length <= 4 ? "disabled" : ""}>Delete Selected</button>
            <button type="button" id="tecSimImportPlateBtn">Import Plate JSON</button>
            <button type="button" id="tecSimImportCrustBtn">Import Crust JSON</button>
          </div>
          <input id="tecSimImportPlateInput" type="file" accept=".json,application/json" hidden />
          <input id="tecSimImportCrustInput" type="file" accept=".json,application/json" hidden />
        </div>
        <div class="tec-sim__playback">
          <div class="tec-sim__playback-main">
            <div class="tec-sim__section-title">Playback ${tipIcon(TIP_TEXT.playback)}</div>
            <div class="tec-sim__playback-buttons">
              <button type="button" id="tecSimPlay">${isPlaying ? "Pause" : "Play"}</button>
              <button type="button" id="tecSimStep">Step</button>
              <button type="button" id="tecSimReset">Reset</button>
            </div>
          </div>
          <label class="tec-sim__playback-slider">
            <span>Snapshot ${formatTimeLabel(state.timeMyr)}</span>
            <input id="tecSimTimeSlider" type="range" min="0" max="250" step="1" value="${fmt(state.timeMyr, 0)}" />
          </label>
        </div>
        ${
          importStatus
            ? `<div class="hint tec-sim__import-status tec-sim__import-status--${escapeHtml(importStatus.type)}">${escapeHtml(importStatus.message)}</div>`
            : ""
        }
        <div class="kpi-grid tec-sim__summary">
          <div class="kpi-wrap"><div class="kpi">
            <div class="kpi__label">Plates</div>
            <div class="kpi__value">${model.summary.plateCount}</div>
            <div class="kpi__meta">${model.summary.continentalCount} continental / ${model.summary.oceanicCount} oceanic cells</div>
          </div></div>
          <div class="kpi-wrap"><div class="kpi">
            <div class="kpi__label">Grid Cells</div>
            <div class="kpi__value">${model.summary.cellCount}</div>
            <div class="kpi__meta">${escapeHtml(model.grid.label)} grid</div>
          </div></div>
          <div class="kpi-wrap"><div class="kpi">
            <div class="kpi__label">Boundaries</div>
            <div class="kpi__value">${model.summary.boundaryCount}</div>
            <div class="kpi__meta">${model.summary.subductionBoundaryCount} subduction / ${model.summary.collisionBoundaryCount} collision</div>
          </div></div>
          <div class="kpi-wrap"><div class="kpi">
            <div class="kpi__label">Playback</div>
            <div class="kpi__value">${formatTimeLabel(state.timeMyr)}</div>
            <div class="kpi__meta">${model.summary.remappedCellCount} remapped cells</div>
          </div></div>
          <div class="kpi-wrap"><div class="kpi">
            <div class="kpi__label">Terrain Range</div>
            <div class="kpi__value">${fmt(model.summary.terrainMinM, 0)} to ${fmt(model.summary.terrainMaxM, 0)} m</div>
            <div class="kpi__meta">${escapeHtml(model.spreadInfo.label)}</div>
          </div></div>
          <div class="kpi-wrap"><div class="kpi">
            <div class="kpi__label">Edited Cells</div>
            <div class="kpi__value">${model.summary.editedCellCount}</div>
            <div class="kpi__meta">${model.summary.crustOverrideCount} crust overrides</div>
          </div></div>
        </div>
        <div class="tec-sim__views">
          <div class="tec-sim__view">
            <div class="tec-sim__view-title">Globe</div>
            <canvas id="tecSimGlobe" class="tec-sim__canvas tec-sim__canvas--globe"></canvas>
          </div>
          <div class="tec-sim__view">
            <div class="tec-sim__view-title">Map</div>
            <canvas id="tecSimMap" class="tec-sim__canvas tec-sim__canvas--map"></canvas>
          </div>
        </div>
        <div class="tec-sim__legend">${renderLegend(state.layer)}</div>
        <div class="tec-sim__terrain-panel">
          <div class="tec-sim__terrain-header">
            <div class="tec-sim__section-title">Terrain Preview ${tipIcon(TIP_TEXT.terrain)}</div>
            <div class="tec-sim__terrain-controls">
              <label class="tec-sim__control tec-sim__control--compact">
                <span>Mode</span>
                <select id="tecSimTerrainMode">
                  <option value="shaded" ${terrainMode === "shaded" ? "selected" : ""}>Shaded Relief</option>
                  <option value="topography" ${terrainMode === "topography" ? "selected" : ""}>Topography Map</option>
                  <option value="height" ${terrainMode === "height" ? "selected" : ""}>Terrain Colour</option>
                  <option value="bathymetry" ${terrainMode === "bathymetry" ? "selected" : ""}>Bathymetry</option>
                  <option value="heightmap" ${terrainMode === "heightmap" ? "selected" : ""}>Raw Height</option>
                </select>
              </label>
              <div class="tec-sim__toolbar-buttons">
                <button type="button" id="tecSimExportLayer">Export Current Layer</button>
                <button type="button" id="tecSimExportRelief">Export Relief</button>
                <button type="button" id="tecSimExportTopography">Export Topography</button>
                <button type="button" id="tecSimExportTerrain">Export Terrain</button>
                <button type="button" id="tecSimExportBathymetry">Export Bathymetry</button>
                <button type="button" id="tecSimExportHeight">Export Height</button>
              </div>
            </div>
          </div>
          <canvas id="tecSimTerrain" class="tec-sim__canvas tec-sim__canvas--terrain"></canvas>
        </div>
        <div class="tec-sim__bottom">
          <div class="tec-sim__plates">
            <div class="tec-sim__section-title">Plates ${tipIcon(TIP_TEXT.plate)}</div>
            <div class="tec-sim__plate-list">${plateButtons}</div>
          </div>
          <div class="tec-sim__editor">
            <div class="tec-sim__section-title">Selected Plate</div>
            ${
              selectedPlate
                ? `
                  <div class="form-row">
                    <div><div class="label">Label</div></div>
                    <input id="tecSimPlateLabel" type="text" value="${escapeHtml(selectedPlate.label)}" />
                  </div>
                  <div class="form-row">
                    <div><div class="label">Crust Type</div></div>
                    <select id="tecSimPlateType">
                      <option value="continental" ${selectedPlate.type === "continental" ? "selected" : ""}>Continental</option>
                      <option value="oceanic" ${selectedPlate.type === "oceanic" ? "selected" : ""}>Oceanic</option>
                    </select>
                  </div>
                  <div class="grid-2 tec-sim__numeric-grid">
                    <label class="tec-sim__numeric"><span>Lat</span><input id="tecSimPlateLat" type="number" min="-89.5" max="89.5" step="0.5" value="${fmt(editingPlate.latDeg, 2)}" /></label>
                    <label class="tec-sim__numeric"><span>Lon</span><input id="tecSimPlateLon" type="number" min="-180" max="180" step="0.5" value="${fmt(editingPlate.lonDeg, 2)}" /></label>
                    <label class="tec-sim__numeric"><span>Pole Lat</span><input id="tecSimPoleLat" type="number" min="-89.5" max="89.5" step="0.5" value="${fmt(editingPlate.eulerPoleLat, 2)}" /></label>
                    <label class="tec-sim__numeric"><span>Pole Lon</span><input id="tecSimPoleLon" type="number" min="-180" max="180" step="0.5" value="${fmt(editingPlate.eulerPoleLon, 2)}" /></label>
                  </div>
                  <div class="form-row">
                    <div><div class="label">Angular Velocity <span class="unit">deg/Myr</span></div></div>
                    <input id="tecSimAngularVel" type="number" min="-0.75" max="0.75" step="0.01" value="${fmt(editingPlate.angularVelDegMyr, 3)}" />
                  </div>
                  <div class="tec-sim__derived">
                    <div class="tec-sim__derived-row"><span>Owned cells</span><strong id="tecSimOwnedCells">${selectedPlate.ownedCells}</strong></div>
                    <div class="tec-sim__derived-row"><span>Boundary Mix ${tipIcon(TIP_TEXT.boundaryMix)}</span><strong id="tecSimBoundaryMix">${escapeHtml(selectedPlate.boundaryMix)}</strong></div>
                    <div class="tec-sim__derived-row"><span>Avg Motion</span><strong id="tecSimPlateMotion">${fmt(selectedPlate.averageMotionSpeedMmYr, 1)} mm/yr</strong></div>
                    <div class="tec-sim__derived-row"><span>Avg Elevation ${tipIcon(TIP_TEXT.elevation)}</span><strong id="tecSimPlateElevation">${fmt(selectedPlate.averageElevationM, 0)} m</strong></div>
                    <div class="tec-sim__derived-row"><span>Avg Terrain</span><strong id="tecSimPlateTerrain">${fmt(selectedPlate.averageTerrainM, 0)} m</strong></div>
                    <div class="tec-sim__derived-row"><span>Avg Volcanism ${tipIcon(TIP_TEXT.volcanism)}</span><strong id="tecSimVolcanism">${fmt(selectedPlate.averageVolcanism, 2)}</strong></div>
                    <div class="tec-sim__derived-row"><span>Avg Seismicity ${tipIcon(TIP_TEXT.seismicity)}</span><strong id="tecSimSeismicity">${fmt(selectedPlate.averageSeismicity, 2)}</strong></div>
                  </div>
                `
                : `<div class="hint">No plate selected.</div>`
            }
          </div>
          <div class="tec-sim__editor">
            <div class="tec-sim__section-title">Selected Cell ${tipIcon(TIP_TEXT.cell)}</div>
            ${
              selectedCell
                ? `
                  <div class="tec-sim__derived">
                    <div class="tec-sim__derived-row"><span>Cell ID</span><strong id="tecSimCellId">${escapeHtml(selectedCell.id)}</strong></div>
                    <div class="tec-sim__derived-row"><span>Assigned Plate</span><strong id="tecSimCellPlate">${escapeHtml(selectedCell.label)}</strong></div>
                    <div class="tec-sim__derived-row"><span>Centre</span><strong id="tecSimCellCoords">${fmt(selectedCell.centerLatDeg, 1)} deg, ${fmt(selectedCell.centerLonDeg, 1)} deg</strong></div>
                    <div class="tec-sim__derived-row"><span>Crust Type</span><strong id="tecSimCellType">${selectedCell.type === "continental" ? "Continental" : "Oceanic"}</strong></div>
                    <div class="tec-sim__derived-row"><span>Crust Override</span><strong id="tecSimCellOverride">${selectedCell.crustOverrideType == null ? "Plate default" : selectedCell.crustOverrideType === "continental" ? "Continental" : "Oceanic"}</strong></div>
                    <div class="tec-sim__derived-row"><span>Boundary Role</span><strong id="tecSimCellRole">${escapeHtml(selectedCell.boundaryRole)}</strong></div>
                    <div class="tec-sim__derived-row"><span>Motion</span><strong id="tecSimCellMotion">${fmt(selectedCell.motionSpeedMmYr, 1)} mm/yr @ ${fmt(selectedCell.motionBearingDeg, 0)} deg</strong></div>
                    <div class="tec-sim__derived-row"><span>Boundary Mix ${tipIcon(TIP_TEXT.boundaryMix)}</span><strong id="tecSimCellBoundaryMix">${escapeHtml(selectedCell.localBoundaryMix)}</strong></div>
                    <div class="tec-sim__derived-row"><span>Crust Age ${tipIcon(TIP_TEXT.crustAge)}</span><strong id="tecSimCrustAge">${selectedCell.crustAgeMyr == null ? "Continental" : `${fmt(selectedCell.crustAgeMyr, 0)} Myr`}</strong></div>
                    <div class="tec-sim__derived-row"><span>Elevation ${tipIcon(TIP_TEXT.elevation)}</span><strong id="tecSimElevation">${fmt(selectedCell.elevationM, 0)} m</strong></div>
                    <div class="tec-sim__derived-row"><span>Terrain</span><strong id="tecSimCellTerrain">${fmt(selectedCell.terrainElevationM, 0)} m</strong></div>
                    <div class="tec-sim__derived-row"><span>Hotspot / Swell</span><strong id="tecSimHotspot">${fmt((selectedCell.hotspotInfluence || 0) + (selectedCell.superswellInfluence || 0) * 0.5, 2)}</strong></div>
                    <div class="tec-sim__derived-row"><span>Volcanism ${tipIcon(TIP_TEXT.volcanism)}</span><strong id="tecSimCellVolcanism">${fmt(selectedCell.volcanism, 2)}</strong></div>
                    <div class="tec-sim__derived-row"><span>Seismicity ${tipIcon(TIP_TEXT.seismicity)}</span><strong id="tecSimCellSeismicity">${fmt(selectedCell.seismicity, 2)}</strong></div>
                  </div>
                `
                : `<div class="hint">No cell selected.</div>`
            }
          </div>
        </div>
      </div>
    `;

    attachTooltips(root);
    const globe = root.querySelector("#tecSimGlobe");
    const map = root.querySelector("#tecSimMap");
    if (globe) drawGlobe(globe, model, viewState, hitState);
    if (map) drawFlatMap(map, model, hitState);

    const bindChange = (selector, handler) => {
      const el = root.querySelector(selector);
      if (!el) return;
      el.addEventListener("change", handler);
      cleanupFns.push(() => el.removeEventListener("change", handler));
    };
    const bindClick = (selector, handler) => {
      const el = root.querySelector(selector);
      if (!el) return;
      el.addEventListener("click", handler);
      cleanupFns.push(() => el.removeEventListener("click", handler));
    };
    const bindInput = (selector, handler) => {
      const el = root.querySelector(selector);
      if (!el) return;
      el.addEventListener("input", handler);
      cleanupFns.push(() => el.removeEventListener("input", handler));
    };

    bindChange("#tecSimLayer", (event) => {
      const next = cloneState(state);
      next.layer = event.target.value;
      commit(next);
    });
    bindChange("#tecSimTool", (event) => {
      const next = cloneState(state);
      next.tool = event.target.value;
      commit(next);
    });
    bindChange("#tecSimTarget", (event) => {
      const next = cloneState(state);
      next.paintTarget = event.target.value;
      commit(next);
    });
    bindChange("#tecSimBrushRadius", (event) => {
      const next = cloneState(state);
      next.brushRadius = Number(event.target.value) || 0;
      commit(next);
    });
    bindChange("#tecSimCrustPaintType", (event) => {
      const next = cloneState(state);
      next.cellCrustPaintType = event.target.value === "oceanic" ? "oceanic" : "continental";
      commit(next);
    });
    bindChange("#tecSimResolution", (event) => {
      const next = cloneState(state);
      next.gridResolution = event.target.value;
      const grid = getTectonicsSimulatorGrid(next.gridResolution);
      next.selectedCellId = grid.cells[0]?.id || null;
      next.cellPlateIds = createDefaultCellAssignments(grid, next.plates);
      next.cellCrustTypes = Array.from({ length: grid.cells.length }, () => null);
      commit(next);
    });
    bindChange("#tecSimTime", (event) => {
      const next = cloneState(state);
      next.timeMyr = Number(event.target.value) || 0;
      commit(next);
    });
    bindInput("#tecSimTimeSlider", (event) => {
      const next = cloneState(state);
      next.timeMyr = Number(event.target.value) || 0;
      commit(next, { preserveStatus: true });
    });
    bindChange("#tecSimPlaybackStep", (event) => {
      const next = cloneState(state);
      next.playbackStepMyr = Number(event.target.value) || 5;
      commit(next, { preserveStatus: true });
    });
    bindClick("#tecSimPlay", () => {
      if (isPlaying) {
        stopPlaybackLoop();
        render();
      } else {
        startPlaybackLoop();
        render();
      }
    });
    bindClick("#tecSimStep", () => {
      const next = cloneState(state);
      next.timeMyr = Math.min(
        250,
        (Number(next.timeMyr) || 0) + (Number(next.playbackStepMyr) || 5),
      );
      commit(next, { preserveStatus: true });
    });
    bindClick("#tecSimReset", () => {
      stopPlaybackLoop();
      const next = cloneState(state);
      next.timeMyr = 0;
      commit(next, { preserveStatus: true });
    });
    bindClick("#tecSimAutoSeed", () => {
      stopPlaybackLoop();
      const next = cloneState(state);
      next.plates = createSeededSimulatorPlates(8);
      next.selectedPlateId = next.plates[0]?.id || null;
      next.timeMyr = 0;
      maybeRegenerateAssignments(next, true);
      commit(next);
    });
    bindClick("#tecSimAddPlate", () => {
      stopPlaybackLoop();
      const next = cloneState(state);
      const count = next.plates.length + 1;
      const seed = createSeededSimulatorPlates(count)[count - 1];
      seed.id = `plate-${count}`;
      seed.label = `Plate ${count}`;
      seed.latDeg = viewState.centerLat;
      seed.lonDeg = viewState.centerLon;
      next.plates.push(seed);
      next.selectedPlateId = seed.id;
      maybeRegenerateAssignments(next, true);
      commit(next);
    });
    bindClick("#tecSimDeletePlate", () => {
      if (state.plates.length <= 4) return;
      stopPlaybackLoop();
      const next = cloneState(state);
      next.plates = next.plates.filter((plate) => plate.id !== next.selectedPlateId);
      next.selectedPlateId = next.plates[0]?.id || null;
      maybeRegenerateAssignments(next, true);
      commit(next);
    });
    bindChange("#tecSimTerrainMode", (event) => {
      terrainMode = event.target.value || "shaded";
      drawOnly();
    });
    bindClick("#tecSimExportLayer", () =>
      downloadCurrentLayer(
        buildModel(),
        `tectonics-${(state.layer || "plates").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}.png`,
      ),
    );
    bindClick("#tecSimExportRelief", () =>
      downloadTerrainPreview(buildModel(), "shaded", "tectonics-terrain-relief.png"),
    );
    bindClick("#tecSimExportTopography", () =>
      downloadTerrainPreview(buildModel(), "topography", "tectonics-topography-map.png"),
    );
    bindClick("#tecSimExportTerrain", () =>
      downloadTerrainPreview(buildModel(), "height", "tectonics-terrain-colour.png"),
    );
    bindClick("#tecSimExportBathymetry", () =>
      downloadTerrainPreview(buildModel(), "bathymetry", "tectonics-bathymetry.png"),
    );
    bindClick("#tecSimExportHeight", () =>
      downloadTerrainPreview(buildModel(), "heightmap", "tectonics-heightmap.png"),
    );
    bindClick("#tecSimImportPlateBtn", () =>
      root.querySelector("#tecSimImportPlateInput")?.click(),
    );
    bindClick("#tecSimImportCrustBtn", () =>
      root.querySelector("#tecSimImportCrustInput")?.click(),
    );
    bindChange("#tecSimImportPlateInput", (event) => {
      readImportFile(event.target.files?.[0], "plate");
      event.target.value = "";
    });
    bindChange("#tecSimImportCrustInput", (event) => {
      readImportFile(event.target.files?.[0], "crust");
      event.target.value = "";
    });

    root.querySelectorAll(".tec-sim__plate-btn[data-plate-id]").forEach((button) => {
      const handler = () => {
        const next = cloneState(state);
        next.selectedPlateId = button.dataset.plateId;
        commit(next);
      };
      button.addEventListener("click", handler);
      cleanupFns.push(() => button.removeEventListener("click", handler));
    });

    bindChange("#tecSimPlateLabel", (event) =>
      updateSelectedPlate({ label: String(event.target.value || "").slice(0, 40) || "Plate" }),
    );
    bindChange("#tecSimPlateType", (event) =>
      updateSelectedPlate({
        type: event.target.value === "continental" ? "continental" : "oceanic",
      }),
    );
    bindChange("#tecSimPlateLat", (event) =>
      updateSelectedPlate({ latDeg: Number(event.target.value) || 0 }),
    );
    bindChange("#tecSimPlateLon", (event) =>
      updateSelectedPlate({ lonDeg: Number(event.target.value) || 0 }),
    );
    bindChange("#tecSimPoleLat", (event) =>
      updateSelectedPlate({ eulerPoleLat: Number(event.target.value) || 0 }),
    );
    bindChange("#tecSimPoleLon", (event) =>
      updateSelectedPlate({ eulerPoleLon: Number(event.target.value) || 0 }),
    );
    bindChange("#tecSimAngularVel", (event) =>
      updateSelectedPlate({ angularVelDegMyr: Number(event.target.value) || 0 }),
    );

    function pointerToLatLon(view, event) {
      if (view === "map") {
        const rect = map.getBoundingClientRect();
        return {
          latDeg: Math.max(
            -89.5,
            Math.min(89.5, 90 - ((event.clientY - rect.top) / Math.max(1, rect.height)) * 180),
          ),
          lonDeg: ((event.clientX - rect.left) / Math.max(1, rect.width)) * 360 - 180,
        };
      }
      const rect = globe.getBoundingClientRect();
      const nx =
        (event.clientX - rect.left - rect.width / 2) / (Math.min(rect.width, rect.height) * 0.42);
      const ny =
        (event.clientY - rect.top - rect.height / 2) / (Math.min(rect.width, rect.height) * 0.42);
      return invertOrtho(nx, ny, viewState.centerLat, viewState.centerLon);
    }

    function onPointerMove(event) {
      if (!dragState) return;
      const nextPoint = pointerToLatLon(dragState.view, event);
      if (!nextPoint) return;
      dragState.moved = true;
      updateSelectedPlate({ latDeg: nextPoint.latDeg, lonDeg: nextPoint.lonDeg }, { draft: true });
    }

    function onPointerUp() {
      if (!dragState) return;
      const moved = dragState.moved;
      dragState = null;
      if (moved) commit(state);
    }

    function handleCellInteraction(cellId) {
      if (!cellId) return;
      applyCellTool(cellId);
    }

    const mapDown = (event) => {
      const rect = map.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const marker = nearestMarker(hitState.flatSeeds, x, y);
      if (marker) {
        const next = cloneState(state);
        next.selectedPlateId = marker.plateId;
        state = normalizeTectonicsSimulatorState(next);
        dragState = { view: "map", moved: false };
        drawOnly();
        return;
      }
      const cell = pickCell(hitState.flatCells, x, y);
      handleCellInteraction(cell?.cellId);
    };

    const globeDown = (event) => {
      const rect = globe.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const marker = nearestMarker(hitState.globeSeeds, x, y);
      if (marker) {
        const next = cloneState(state);
        next.selectedPlateId = marker.plateId;
        state = normalizeTectonicsSimulatorState(next);
        dragState = { view: "globe", moved: false };
        drawOnly();
        return;
      }
      const cell = pickCell(hitState.globeCells, x, y);
      handleCellInteraction(cell?.cellId);
    };

    const globeWheel = (event) => {
      event.preventDefault();
      viewState.centerLon =
        ((((viewState.centerLon + event.deltaY * 0.08) % 360) + 540) % 360) - 180;
      drawOnly();
    };

    if (map) {
      map.addEventListener("mousedown", mapDown);
      cleanupFns.push(() => map.removeEventListener("mousedown", mapDown));
    }
    if (globe) {
      globe.addEventListener("mousedown", globeDown);
      globe.addEventListener("wheel", globeWheel, { passive: false });
      cleanupFns.push(() => globe.removeEventListener("mousedown", globeDown));
      cleanupFns.push(() => globe.removeEventListener("wheel", globeWheel));
    }
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", onPointerUp);
    cleanupFns.push(() => document.removeEventListener("mousemove", onPointerMove));
    cleanupFns.push(() => document.removeEventListener("mouseup", onPointerUp));
  }

  render();
  root.__tectonicsSimCleanup = cleanup;
  return cleanup;
}
