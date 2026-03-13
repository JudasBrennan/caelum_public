import { clamp, fmt } from "../engine/utils.js";
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
import { buildTerrainRaster, getTerrainPreviewSize } from "../engine/tectonics-sim/terrain.js";
import {
  getDefaultTopographyPeakColor,
  TERRAIN_STYLE_PRESET_OPTIONS,
} from "../engine/tectonics-sim/terrainStyles.js";
import { tipIcon, attachTooltips } from "./tooltip.js";
import {
  requestTectonicsTerrainRaster,
  supportsTectonicsTerrainWorker,
} from "./tectonicsTerrainWorkerClient.js";
import { drawTopographyContours } from "./tectonicsTerrainContours.js";
import { renderTerrainInspectorMarkup, sampleTerrainRaster } from "./tectonicsTerrainInspector.js";
import {
  resolveTerrainExportProfile,
  TERRAIN_EXPORT_PRESET_OPTIONS,
  TERRAIN_EXPORT_SIZE_OPTIONS,
} from "./tectonicsTerrainExport.js";
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
  topographyStep:
    "Controls the contour interval used by Topography Map mode. Smaller steps create denser bands and contour lines; larger steps create broader elevation bands.",
  topographyMajor:
    "Controls how many contour steps appear between major contour lines. Larger values create fewer emphasized index contours.",
  topographyMinor:
    "Turns minor contour lines on or off. Major contours and the coastline contour remain available either way.",
  topographyOcean:
    "Controls whether ocean-depth contours are drawn in Topography Map mode. Turn this off for a cleaner land-first survey look.",
  topographyPeak:
    "Selects the land height tint used by Topography Map mode. Elevation bands are derived from this colour while preserving the contour overlay.",
  terrainStyle:
    "Selects the terrain palette and breakpoint style used by the terrain preview. Different presets change how land and ocean bands are colored without rebuilding the underlying terrain field.",
  terrainRelief:
    "Controls how strongly hillshade influences the terrain preview. Lower values flatten relief; higher values exaggerate landforms.",
  terrainCoast:
    "Controls how strongly coastlines are accented in the terrain renderer. In Topography Map mode it also strengthens the coastline contour overlay.",
  terrainInspector:
    "Click the terrain preview to inspect local elevation, slope, aspect, relief class, source cell, and preview resolution without rebuilding the terrain field.",
  terrainExportPreset:
    "Chooses how exported terrain maps should be styled. Preview Match uses the current on-page settings, while Atlas and Survey apply export-oriented cartographic tuning.",
  terrainExportSize:
    "Sets the terrain export resolution. Preview Match uses the current preview size; larger tiers render atlas-quality output asynchronously in the terrain worker.",
};

const PLATE_RAIL_TABS = [
  { id: "plates", label: "Plates" },
  { id: "tools", label: "Tools" },
  { id: "layers", label: "Layers" },
  { id: "selection", label: "Selection" },
];

const TERRAIN_RAIL_TABS = [
  { id: "view", label: "View" },
  { id: "selection", label: "Selection" },
];

const SIDEBAR_TABS = [
  { id: "controls", label: "Controls" },
  { id: "timeline", label: "Timeline" },
  { id: "style", label: "Style" },
  { id: "export", label: "Export" },
];

const TERRAIN_MODE_LABELS = {
  shaded: "Shaded Relief",
  topography: "Topography Map",
  height: "Terrain Colour",
  bathymetry: "Bathymetry",
  slope: "Slope",
  aspect: "Aspect",
  slopeaspect: "Slope + Aspect",
  heightmap: "Raw Height",
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
  const dpr = Math.max(1, canvas?.ownerDocument?.defaultView?.devicePixelRatio || 1);
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

function renderWorkspaceSummaryPanel(model) {
  return `
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
        <div class="kpi__value">${formatTimeLabel(model.state.timeMyr)}</div>
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
  `;
}

function renderWorkspaceStylePanel({
  isTerrainMode,
  styledTerrainMode,
  terrainMode,
  stylePresetOptions,
  terrainStylePreset,
  terrainReliefStrength,
  terrainCoastlineEmphasis,
  terrainTopographyPeakColor,
  topographyBandStepM,
  topographyMajorEvery,
  topographyShowMinorContours,
  topographyShowOceanContours,
}) {
  if (!isTerrainMode) {
    return `
      <div class="hint">
        Terrain style controls activate when the workspace is in <b>Terrain</b> mode.
      </div>
    `;
  }
  return `
    <div class="tec-sim__drawer-grid">
      <label class="tec-sim__terrain-overlay-row ${styledTerrainMode ? "" : "is-hidden"}">
        <span>Style Preset ${tipIcon(TIP_TEXT.terrainStyle)}</span>
        <select id="tecSimTerrainStylePreset">${stylePresetOptions}</select>
      </label>
      <label class="tec-sim__terrain-overlay-row ${styledTerrainMode ? "" : "is-hidden"}">
        <span>Relief Strength ${tipIcon(TIP_TEXT.terrainRelief)}</span>
        <input id="tecSimTerrainRelief" type="range" min="0" max="200" step="5" value="${fmt(terrainReliefStrength * 100, 0)}" />
        <strong id="tecSimTerrainReliefValue">${fmt(terrainReliefStrength * 100, 0)}%</strong>
      </label>
      <label class="tec-sim__terrain-overlay-row ${styledTerrainMode ? "" : "is-hidden"}">
        <span>Coastline Emphasis ${tipIcon(TIP_TEXT.terrainCoast)}</span>
        <input id="tecSimTerrainCoast" type="range" min="0" max="200" step="5" value="${fmt(terrainCoastlineEmphasis * 100, 0)}" />
        <strong id="tecSimTerrainCoastValue">${fmt(terrainCoastlineEmphasis * 100, 0)}%</strong>
      </label>
      <label class="tec-sim__terrain-overlay-row ${terrainMode === "topography" ? "" : "is-hidden"}">
        <span>Height Colour ${tipIcon(TIP_TEXT.topographyPeak)}</span>
        <div class="tec-sim__terrain-colour-field">
          <input id="tecSimTopographyPeakColor" type="color" value="${escapeHtml(terrainTopographyPeakColor)}" />
          <strong id="tecSimTopographyPeakColorValue">${escapeHtml(terrainTopographyPeakColor.toUpperCase())}</strong>
        </div>
      </label>
      <label class="tec-sim__terrain-overlay-row ${terrainMode === "topography" ? "" : "is-hidden"}">
        <span>Contour Step ${tipIcon(TIP_TEXT.topographyStep)}</span>
        <input id="tecSimTopographyStep" type="range" min="100" max="1000" step="50" value="${fmt(topographyBandStepM, 0)}" />
        <strong id="tecSimTopographyStepValue">${fmt(topographyBandStepM, 0)} m</strong>
      </label>
      <label class="tec-sim__terrain-overlay-row ${terrainMode === "topography" ? "" : "is-hidden"}">
        <span>Major Interval ${tipIcon(TIP_TEXT.topographyMajor)}</span>
        <input id="tecSimTopographyMajorEvery" type="range" min="2" max="10" step="1" value="${fmt(topographyMajorEvery, 0)}" />
        <strong id="tecSimTopographyMajorEveryValue">Every ${fmt(topographyMajorEvery, 0)}th</strong>
      </label>
      <label class="tec-sim__terrain-overlay-row ${terrainMode === "topography" ? "" : "is-hidden"}">
        <span>Minor Contours ${tipIcon(TIP_TEXT.topographyMinor)}</span>
        <select id="tecSimTopographyMinorContours">
          <option value="on" ${topographyShowMinorContours ? "selected" : ""}>On</option>
          <option value="off" ${topographyShowMinorContours ? "" : "selected"}>Off</option>
        </select>
      </label>
      <label class="tec-sim__terrain-overlay-row ${terrainMode === "topography" ? "" : "is-hidden"}">
        <span>Ocean Contours ${tipIcon(TIP_TEXT.topographyOcean)}</span>
        <select id="tecSimTopographyOceanContours">
          <option value="on" ${topographyShowOceanContours ? "selected" : ""}>On</option>
          <option value="off" ${topographyShowOceanContours ? "" : "selected"}>Off</option>
        </select>
      </label>
    </div>
  `;
}

function renderWorkspaceExportPanel({
  isTerrainMode,
  terrainMode,
  exportPresetOptions,
  exportSizeOptions,
}) {
  return `
    <div class="tec-sim__toolbar-buttons">
      <button type="button" id="tecSimExportActiveMode" ${isTerrainMode ? "" : "disabled"}>Export Active Mode</button>
      <button type="button" id="tecSimExportLayer">Export Current Layer</button>
      <button type="button" id="tecSimExportRelief" ${isTerrainMode ? "" : "disabled"}>Export Relief</button>
      <button type="button" id="tecSimExportTopography" ${isTerrainMode ? "" : "disabled"}>Export Topography</button>
      <button type="button" id="tecSimExportTerrain" ${isTerrainMode ? "" : "disabled"}>Export Terrain</button>
      <button type="button" id="tecSimExportBathymetry" ${isTerrainMode ? "" : "disabled"}>Export Bathymetry</button>
      <button type="button" id="tecSimExportHeight" ${isTerrainMode ? "" : "disabled"}>Export Height</button>
    </div>
    <div class="tec-sim__drawer-grid">
      <label class="tec-sim__terrain-overlay-row ${isTerrainMode && terrainMode !== "heightmap" ? "" : "is-hidden"}">
        <span>Export Preset ${tipIcon(TIP_TEXT.terrainExportPreset)}</span>
        <select id="tecSimTerrainExportPreset">${exportPresetOptions}</select>
      </label>
      <label class="tec-sim__terrain-overlay-row">
        <span>Export Size ${tipIcon(TIP_TEXT.terrainExportSize)}</span>
        <select id="tecSimTerrainExportSize">${exportSizeOptions}</select>
      </label>
    </div>
  `;
}

function renderTerrainModeOptions(activeMode) {
  return Object.entries(TERRAIN_MODE_LABELS)
    .map(
      ([id, label]) =>
        `<option value="${id}" ${activeMode === id ? "selected" : ""}>${escapeHtml(label)}</option>`,
    )
    .join("");
}

function renderControlsTrayContent({
  state,
  model,
  isPlateMode,
  activeRailTab,
  railTabsMarkup,
  plateButtons,
  editingPlate,
  terrainMode,
  terrainSampleSummary,
  stylePanelMarkup,
}) {
  if (isPlateMode) {
    return `
      <div class="tec-sim__sheet-tabs">${railTabsMarkup}</div>
      <div class="tec-sim__sheet-panel ${activeRailTab === "plates" ? "" : "is-hidden"}">
        <div class="section-title">Plates ${tipIcon(TIP_TEXT.plate)}</div>
        <div class="tec-sim__plate-list">${plateButtons}</div>
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
      <div class="tec-sim__sheet-panel ${activeRailTab === "tools" ? "" : "is-hidden"}">
        <div class="tec-sim__drawer-grid">
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
        </div>
      </div>
      <div class="tec-sim__sheet-panel ${activeRailTab === "layers" ? "" : "is-hidden"}">
        <div class="tec-sim__drawer-grid">
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
            <span>Grid ${tipIcon(TIP_TEXT.resolution)}</span>
            <select id="tecSimResolution">
              ${TECTONICS_GRID_RESOLUTIONS.map(
                (entry) =>
                  `<option value="${entry.id}" ${entry.id === state.gridResolution ? "selected" : ""}>${escapeHtml(entry.label)} (~${entry.count})</option>`,
              ).join("")}
            </select>
          </label>
        </div>
        <div class="tec-sim__legend">${renderLegend(state.layer)}</div>
      </div>
      <div class="tec-sim__sheet-panel ${activeRailTab === "selection" ? "" : "is-hidden"}">
        ${
          model.selectedPlate
            ? `
              <div class="form-row">
                <div><div class="label">Label</div></div>
                <input id="tecSimPlateLabel" type="text" value="${escapeHtml(model.selectedPlate.label)}" />
              </div>
              <div class="form-row">
                <div><div class="label">Crust Type</div></div>
                <select id="tecSimPlateType">
                  <option value="continental" ${model.selectedPlate.type === "continental" ? "selected" : ""}>Continental</option>
                  <option value="oceanic" ${model.selectedPlate.type === "oceanic" ? "selected" : ""}>Oceanic</option>
                </select>
              </div>
              <div class="grid-2 tec-sim__numeric-grid">
                <label class="tec-sim__numeric"><span>Lat</span><input id="tecSimPlateLat" type="number" min="-89.5" max="89.5" step="0.5" value="${fmt(editingPlate?.latDeg || 0, 2)}" /></label>
                <label class="tec-sim__numeric"><span>Lon</span><input id="tecSimPlateLon" type="number" min="-180" max="180" step="0.5" value="${fmt(editingPlate?.lonDeg || 0, 2)}" /></label>
                <label class="tec-sim__numeric"><span>Pole Lat</span><input id="tecSimPoleLat" type="number" min="-89.5" max="89.5" step="0.5" value="${fmt(editingPlate?.eulerPoleLat || 0, 2)}" /></label>
                <label class="tec-sim__numeric"><span>Pole Lon</span><input id="tecSimPoleLon" type="number" min="-180" max="180" step="0.5" value="${fmt(editingPlate?.eulerPoleLon || 0, 2)}" /></label>
              </div>
              <div class="form-row">
                <div><div class="label">Angular Velocity <span class="unit">deg/Myr</span></div></div>
                <input id="tecSimAngularVel" type="number" min="-0.75" max="0.75" step="0.01" value="${fmt(editingPlate?.angularVelDegMyr || 0, 3)}" />
              </div>
            `
            : `<div class="hint">No plate selected.</div>`
        }
      </div>
      <div class="tec-sim__sheet-subsection">
        <div class="section-title">Keyboard &amp; Mouse</div>
        ${renderHelpSheet({ isPlateMode })}
      </div>
    `;
  }

  return `
    <div class="tec-sim__sheet-tabs">${railTabsMarkup}</div>
    <div class="tec-sim__sheet-panel ${activeRailTab === "view" ? "" : "is-hidden"}">
      <div class="tec-sim__drawer-grid">
        <label class="tec-sim__control">
          <span>Mode ${tipIcon(TIP_TEXT.terrain)}</span>
          <select id="tecSimTerrainMode">${renderTerrainModeOptions(terrainMode)}</select>
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
      </div>
      <div class="tec-sim__sheet-subsection">
        <div class="section-title">Terrain Style</div>
        ${stylePanelMarkup}
      </div>
    </div>
    <div class="tec-sim__sheet-panel ${activeRailTab === "selection" ? "" : "is-hidden"}">
      <div class="stat-rows">
        <div class="stat-row"><div class="stat-row__label">Saved sample</div><div class="stat-row__value">${escapeHtml(terrainSampleSummary)}</div></div>
        <div class="stat-row"><div class="stat-row__label">Active mode</div><div class="stat-row__value">${escapeHtml(TERRAIN_MODE_LABELS[terrainMode] || terrainMode)}</div></div>
        <div class="stat-row"><div class="stat-row__label">Selection source</div><div class="stat-row__value">${terrainSampleSummary === "No saved sample" ? "Viewport click" : "Persisted workspace state"}</div></div>
      </div>
      <div class="tec-sim__toolbar-buttons">
        <button type="button" id="tecSimClearTerrainSample" ${terrainSampleSummary === "No saved sample" ? "disabled" : ""}>Clear Sample</button>
      </div>
    </div>
    <div class="tec-sim__sheet-subsection">
      <div class="section-title">Keyboard &amp; Mouse</div>
      ${renderHelpSheet({ isPlateMode })}
    </div>
  `;
}

function renderInspectorCard({ model, isPlateMode }) {
  const selectedPlate = model.selectedPlate;
  const selectedCell = model.selectedCell;
  return `
    <div class="tec-sim__inspector-section">
      <div class="section-title">${isPlateMode ? "Selection Inspector" : "Terrain Inspector"}</div>
      ${
        isPlateMode
          ? `
            <div class="tec-sim__editor">
              <div class="section-title">Selected Plate</div>
              ${
                selectedPlate
                  ? `
                    <div class="stat-rows">
                      <div class="stat-row"><div class="stat-row__label">Plate</div><div class="stat-row__value">${escapeHtml(selectedPlate.label)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Owned cells</div><div class="stat-row__value" id="tecSimOwnedCells">${selectedPlate.ownedCells}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Boundary Mix ${tipIcon(TIP_TEXT.boundaryMix)}</div><div class="stat-row__value" id="tecSimBoundaryMix">${escapeHtml(selectedPlate.boundaryMix)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Avg Motion</div><div class="stat-row__value" id="tecSimPlateMotion">${fmt(selectedPlate.averageMotionSpeedMmYr, 1)} mm/yr</div></div>
                      <div class="stat-row"><div class="stat-row__label">Avg Elevation ${tipIcon(TIP_TEXT.elevation)}</div><div class="stat-row__value" id="tecSimPlateElevation">${fmt(selectedPlate.averageElevationM, 0)} m</div></div>
                      <div class="stat-row"><div class="stat-row__label">Avg Terrain</div><div class="stat-row__value" id="tecSimPlateTerrain">${fmt(selectedPlate.averageTerrainM, 0)} m</div></div>
                      <div class="stat-row"><div class="stat-row__label">Avg Volcanism ${tipIcon(TIP_TEXT.volcanism)}</div><div class="stat-row__value" id="tecSimVolcanism">${fmt(selectedPlate.averageVolcanism, 2)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Avg Seismicity ${tipIcon(TIP_TEXT.seismicity)}</div><div class="stat-row__value" id="tecSimSeismicity">${fmt(selectedPlate.averageSeismicity, 2)}</div></div>
                    </div>
                  `
                  : `<div class="hint">No plate selected.</div>`
              }
            </div>
            <div class="tec-sim__editor">
              <div class="section-title">Selected Cell ${tipIcon(TIP_TEXT.cell)}</div>
              ${
                selectedCell
                  ? `
                    <div class="stat-rows">
                      <div class="stat-row"><div class="stat-row__label">Cell ID</div><div class="stat-row__value" id="tecSimCellId">${escapeHtml(selectedCell.id)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Assigned Plate</div><div class="stat-row__value" id="tecSimCellPlate">${escapeHtml(selectedCell.label)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Centre</div><div class="stat-row__value" id="tecSimCellCoords">${fmt(selectedCell.centerLatDeg, 1)} deg, ${fmt(selectedCell.centerLonDeg, 1)} deg</div></div>
                      <div class="stat-row"><div class="stat-row__label">Crust Type</div><div class="stat-row__value" id="tecSimCellType">${selectedCell.type === "continental" ? "Continental" : "Oceanic"}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Crust Override</div><div class="stat-row__value" id="tecSimCellOverride">${selectedCell.crustOverrideType == null ? "Plate default" : selectedCell.crustOverrideType === "continental" ? "Continental" : "Oceanic"}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Boundary Role</div><div class="stat-row__value" id="tecSimCellRole">${escapeHtml(selectedCell.boundaryRole)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Motion</div><div class="stat-row__value" id="tecSimCellMotion">${fmt(selectedCell.motionSpeedMmYr, 1)} mm/yr @ ${fmt(selectedCell.motionBearingDeg, 0)} deg</div></div>
                      <div class="stat-row"><div class="stat-row__label">Boundary Mix ${tipIcon(TIP_TEXT.boundaryMix)}</div><div class="stat-row__value" id="tecSimCellBoundaryMix">${escapeHtml(selectedCell.localBoundaryMix)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Crust Age ${tipIcon(TIP_TEXT.crustAge)}</div><div class="stat-row__value" id="tecSimCrustAge">${selectedCell.crustAgeMyr == null ? "Continental" : `${fmt(selectedCell.crustAgeMyr, 0)} Myr`}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Elevation ${tipIcon(TIP_TEXT.elevation)}</div><div class="stat-row__value" id="tecSimElevation">${fmt(selectedCell.elevationM, 0)} m</div></div>
                      <div class="stat-row"><div class="stat-row__label">Terrain</div><div class="stat-row__value" id="tecSimCellTerrain">${fmt(selectedCell.terrainElevationM, 0)} m</div></div>
                      <div class="stat-row"><div class="stat-row__label">Hotspot / Swell</div><div class="stat-row__value" id="tecSimHotspot">${fmt((selectedCell.hotspotInfluence || 0) + (selectedCell.superswellInfluence || 0) * 0.5, 2)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Volcanism ${tipIcon(TIP_TEXT.volcanism)}</div><div class="stat-row__value" id="tecSimCellVolcanism">${fmt(selectedCell.volcanism, 2)}</div></div>
                      <div class="stat-row"><div class="stat-row__label">Seismicity ${tipIcon(TIP_TEXT.seismicity)}</div><div class="stat-row__value" id="tecSimCellSeismicity">${fmt(selectedCell.seismicity, 2)}</div></div>
                    </div>
                  `
                  : `<div class="hint">No cell selected.</div>`
              }
            </div>
          `
          : `
            <div class="tec-sim__editor">
              <div class="section-title">Terrain Sample ${tipIcon(TIP_TEXT.terrainInspector)}</div>
              <div id="tecSimTerrainInspector" class="tec-sim__terrain-inspector-panel"></div>
            </div>
          `
      }
      <div class="tec-sim__editor">
        <div class="section-title">Diagnostics</div>
        <div class="stat-rows">
          <div class="stat-row"><div class="stat-row__label">Boundaries</div><div class="stat-row__value">${model.summary.boundaryCount}</div></div>
          <div class="stat-row"><div class="stat-row__label">Terrain Range</div><div class="stat-row__value">${fmt(model.summary.terrainMinM, 0)} to ${fmt(model.summary.terrainMaxM, 0)} m</div></div>
          <div class="stat-row"><div class="stat-row__label">Spread Model</div><div class="stat-row__value">${escapeHtml(model.spreadInfo.label)}</div></div>
          <div class="stat-row"><div class="stat-row__label">Edited Cells</div><div class="stat-row__value">${model.summary.editedCellCount}</div></div>
          <div class="stat-row"><div class="stat-row__label">Crust Overrides</div><div class="stat-row__value">${model.summary.crustOverrideCount}</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderHelpSheet({ isPlateMode }) {
  return `
    <div class="tec-sim__help-grid">
      <div class="tec-sim__help-item"><kbd>Click</kbd><span>${isPlateMode ? "Select a cell or seed marker" : "Inspect terrain at the clicked location"}</span></div>
      <div class="tec-sim__help-item"><kbd>Drag</kbd><span>${isPlateMode ? "Move the selected plate seed" : "Keep using the same projection while sampling terrain"}</span></div>
      <div class="tec-sim__help-item"><kbd>Scroll</kbd><span>Rotate the spherical view longitudinally</span></div>
      <div class="tec-sim__help-item"><kbd>Mode</kbd><span>Switch the renderer between plate editing and terrain inspection without leaving the stage</span></div>
      <div class="tec-sim__help-item"><kbd>Controls</kbd><span>Open the contextual tray only when you need deeper options</span></div>
      <div class="tec-sim__help-item"><kbd>Export</kbd><span>Open export actions as a focused sheet instead of persistent chrome</span></div>
    </div>
  `;
}

function buildStageWorkspaceMarkup({
  state,
  model,
  isPlaying,
  isPlateMode,
  isTerrainMode,
  isFlatProjection,
  workspaceMode,
  terrainMode,
  inspectorCollapsed,
  sidebarTab,
  activeRailTab,
  railTabsMarkup,
  plateButtons,
  editingPlate,
  terrainSampleSummary,
  importStatus,
  stylePanelMarkup,
  exportPanelMarkup,
}) {
  const layerLabel =
    TECTONICS_SIMULATOR_LAYERS.find((layer) => layer.id === state.layer)?.label || "Plates";
  const terrainModeLabel = TERRAIN_MODE_LABELS[terrainMode] || "Shaded Relief";
  const sidebarOpen = sidebarTab !== null;
  const quickToolMarkup = TECTONICS_SIMULATOR_TOOLS.map(
    (tool) => `
      <button type="button" class="tec-sim__pill ${state.tool === tool.id ? "is-active" : ""}" data-tool-id="${escapeHtml(tool.id)}" aria-pressed="${state.tool === tool.id ? "true" : "false"}">${escapeHtml(tool.label)}</button>
    `,
  ).join("");
  const quickTargetMarkup = TECTONICS_SIMULATOR_PAINT_TARGETS.map(
    (entry) => `
      <button type="button" class="tec-sim__pill ${state.paintTarget === entry.id ? "is-active" : ""}" data-target-id="${escapeHtml(entry.id)}" aria-pressed="${state.paintTarget === entry.id ? "true" : "false"}">${escapeHtml(entry.label)}</button>
    `,
  ).join("");

  return `
    <div class="tec-sim tec-sim--stage">
      <div class="tec-sim__commandbar">
        <div class="tec-sim__toggle-group" aria-label="Workspace mode">
          <button type="button" id="tecSimModePlate" class="tec-sim__toggle-btn ${isPlateMode ? "is-active" : ""}" aria-pressed="${isPlateMode ? "true" : "false"}">Plate</button>
          <button type="button" id="tecSimModeTerrain" class="tec-sim__toggle-btn ${isTerrainMode ? "is-active" : ""}" aria-pressed="${isTerrainMode ? "true" : "false"}">Terrain</button>
        </div>
        <div class="tec-sim__toggle-group" aria-label="Projection">
          <button type="button" id="tecSimProjectionFlat" class="tec-sim__toggle-btn ${isFlatProjection ? "is-active" : ""}" aria-pressed="${isFlatProjection ? "true" : "false"}">Flat</button>
          <button type="button" id="tecSimProjectionSphere" class="tec-sim__toggle-btn ${!isFlatProjection ? "is-active" : ""}" aria-pressed="${!isFlatProjection ? "true" : "false"}">Sphere</button>
        </div>
        <span class="tec-sim__status-chip">${formatTimeLabel(state.timeMyr)}</span>
        <div class="tec-sim__action-cluster">
          <button type="button" data-sidebar-tab="controls" class="tec-sim__action-btn ${sidebarTab === "controls" ? "is-active" : ""}" aria-pressed="${sidebarTab === "controls" ? "true" : "false"}">Controls</button>
          <button type="button" data-sidebar-tab="timeline" class="tec-sim__action-btn ${sidebarTab === "timeline" ? "is-active" : ""}" aria-pressed="${sidebarTab === "timeline" ? "true" : "false"}">Timeline</button>
          <button type="button" data-sidebar-tab="style" class="tec-sim__action-btn ${sidebarTab === "style" ? "is-active" : ""}" aria-pressed="${sidebarTab === "style" ? "true" : "false"}">Style</button>
          <button type="button" data-sidebar-tab="export" class="tec-sim__action-btn ${sidebarTab === "export" ? "is-active" : ""}" aria-pressed="${sidebarTab === "export" ? "true" : "false"}">Export</button>
          <button type="button" id="tecSimInspectorToggle" class="tec-sim__action-btn ${inspectorCollapsed ? "" : "is-active"}" aria-pressed="${inspectorCollapsed ? "false" : "true"}">Inspector</button>
        </div>
      </div>
      <div class="tec-sim__stage-layout">
        <div class="tec-sim__stage-shell tec-sim__stage-shell--${workspaceMode}">
          <div class="tec-sim__quickbar">
            ${
              isPlateMode
                ? `
                  <div class="tec-sim__quick-tools">${quickToolMarkup}</div>
                  <div class="tec-sim__quick-tools">${quickTargetMarkup}</div>
                  <label class="tec-sim__quick-select">
                    <span>Layer</span>
                    <select id="tecSimQuickLayer">
                      ${TECTONICS_SIMULATOR_LAYERS.map(
                        (layer) =>
                          `<option value="${layer.id}" ${layer.id === state.layer ? "selected" : ""}>${escapeHtml(layer.label)}</option>`,
                      ).join("")}
                    </select>
                  </label>
                `
                : `
                  <label class="tec-sim__quick-select">
                    <span>Terrain Mode</span>
                    <select id="tecSimQuickTerrainMode">${renderTerrainModeOptions(terrainMode)}</select>
                  </label>
                  <label class="tec-sim__quick-select">
                    <span>Grid</span>
                    <select id="tecSimQuickResolution">
                      ${TECTONICS_GRID_RESOLUTIONS.map(
                        (entry) =>
                          `<option value="${entry.id}" ${entry.id === state.gridResolution ? "selected" : ""}>${escapeHtml(entry.label)} (~${entry.count})</option>`,
                      ).join("")}
                    </select>
                  </label>
                  <div class="tec-sim__quick-tools">
                    <button type="button" id="tecSimQuickClearTerrainSample" ${terrainSampleSummary === "No saved sample" ? "disabled" : ""}>Clear Sample</button>
                  </div>
                `
            }
          </div>
          <div class="tec-sim__stage-chrome">
            <canvas id="tecSimStage" class="tec-sim__canvas tec-sim__stage-canvas tec-sim__stage-canvas--${isFlatProjection ? "flat" : "sphere"}"></canvas>
            <div class="tec-sim__loading-overlay" aria-label="Building terrain"><div class="tec-sim__loading-spinner"></div><span>Building terrain\u2026</span></div>
            <div class="tec-sim__stage-note">
              ${isPlateMode ? "Click cells to inspect them, or drag a plate seed marker to reposition the plate." : "Click the stage to inspect terrain. The raster cache stays loaded while you switch renderer or projection."}
            </div>
            <aside id="tecSimInspectorCard" class="tec-sim__inspector-card" ${inspectorCollapsed ? "hidden" : ""}>
              ${renderInspectorCard({ model, isPlateMode })}
            </aside>
          </div>
        </div>
        <aside class="tec-sim__sidebar ${sidebarOpen ? "" : "is-collapsed"}">
          <div class="tec-sim__sidebar-header">
            <div class="tec-sim__sidebar-tabs">
              ${SIDEBAR_TABS.map(
                (tab) =>
                  `<button type="button" data-sidebar-tab="${escapeHtml(tab.id)}" class="tec-sim__rail-tab ${sidebarTab === tab.id ? "is-active" : ""}">${escapeHtml(tab.label)}</button>`,
              ).join("")}
            </div>
            <button type="button" id="tecSimSidebarClose" class="tec-sim__sheet-close" aria-label="Close sidebar">&times;</button>
          </div>
          <div class="tec-sim__sidebar-body">
            <div class="tec-sim__sidebar-panel ${sidebarTab === "controls" ? "" : "is-hidden"}">
              ${renderControlsTrayContent({ state, model, isPlateMode, activeRailTab, railTabsMarkup, plateButtons, editingPlate, terrainMode, terrainSampleSummary, stylePanelMarkup })}
            </div>
            <div class="tec-sim__sidebar-panel ${sidebarTab === "timeline" ? "" : "is-hidden"}">
              <div class="tec-sim__playback-buttons">
                <button type="button" id="tecSimPlay">${isPlaying ? "Pause" : "Play"}</button>
                <button type="button" id="tecSimStep">Step</button>
                <button type="button" id="tecSimReset">Reset</button>
              </div>
              <div class="tec-sim__drawer-grid">
                <label class="tec-sim__control">
                  <span>Time ${tipIcon(TIP_TEXT.time)}</span>
                  <input id="tecSimTime" type="number" min="0" max="250" step="1" value="${fmt(state.timeMyr, 0)}" />
                </label>
                <label class="tec-sim__control">
                  <span>Playback Step ${tipIcon(TIP_TEXT.playback)}</span>
                  <input id="tecSimPlaybackStep" type="number" min="1" max="50" step="1" value="${fmt(state.playbackStepMyr, 0)}" />
                </label>
              </div>
              <label class="tec-sim__playback-slider">
                <span>Snapshot ${formatTimeLabel(state.timeMyr)}</span>
                <input id="tecSimTimeSlider" type="range" min="0" max="250" step="1" value="${fmt(state.timeMyr, 0)}" />
              </label>
            </div>
            <div class="tec-sim__sidebar-panel ${sidebarTab === "style" ? "" : "is-hidden"}">
              ${stylePanelMarkup}
            </div>
            <div class="tec-sim__sidebar-panel ${sidebarTab === "export" ? "" : "is-hidden"}">
              ${exportPanelMarkup}
            </div>
          </div>
        </aside>
      </div>
      <div class="tec-sim__summary-strip">
        ${renderWorkspaceSummaryPanel(model)}
        <div class="tec-sim__summary-note">
          <div class="section-title">Current Focus</div>
          <div class="stat-rows">
            <div class="stat-row"><div class="stat-row__label">Workspace</div><div class="stat-row__value">${escapeHtml(isPlateMode ? "Plate / Geology" : "Terrain")}</div></div>
            <div class="stat-row"><div class="stat-row__label">Renderer</div><div class="stat-row__value">${escapeHtml(isPlateMode ? layerLabel : terrainModeLabel)}</div></div>
            <div class="stat-row"><div class="stat-row__label">Selection</div><div class="stat-row__value">${escapeHtml(terrainSampleSummary)}</div></div>
            <div class="stat-row"><div class="stat-row__label">Inspector</div><div class="stat-row__value">${inspectorCollapsed ? "Hidden" : "Visible"}</div></div>
          </div>
          ${
            importStatus
              ? `<div class="hint tec-sim__import-status tec-sim__import-status--${escapeHtml(importStatus.type)}">${escapeHtml(importStatus.message)}</div>`
              : `<div class="hint">Climate overlays can slot into this stage later without another shell rewrite.</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function paintTerrainRaster(
  canvas,
  raster,
  {
    topographyBandStepM = 250,
    coastlineEmphasis = 1,
    contourMajorEvery = 5,
    showMinorContours = true,
    showOceanContours = true,
  } = {},
) {
  const ctx = canvas.getContext("2d");
  if (!ctx || !raster) return;
  canvas.width = raster.width;
  canvas.height = raster.height;
  const imageData = ctx.createImageData(raster.width, raster.height);
  imageData.data.set(raster.colors);
  ctx.putImageData(imageData, 0, 0);
  if (raster.mode === "topography") {
    drawTopographyContours(ctx, raster, {
      stepM: topographyBandStepM,
      majorEvery: contourMajorEvery,
      coastlineEmphasis,
      showMinorContours,
      showOceanContours,
    });
  }
}

function sampleTerrainColor(raster, fx, fy) {
  if (!raster?.colors?.length) return [0, 0, 0, 255];
  const clampedX = clamp(fx, 0, 1) * Math.max(0, raster.width - 1);
  const clampedY = clamp(fy, 0, 1) * Math.max(0, raster.height - 1);
  const x0 = Math.floor(clampedX);
  const y0 = Math.floor(clampedY);
  const x1 = Math.min(raster.width - 1, x0 + 1);
  const y1 = Math.min(raster.height - 1, y0 + 1);
  const tx = clampedX - x0;
  const ty = clampedY - y0;
  const sample = (x, y, channel) => raster.colors[(y * raster.width + x) * 4 + channel] || 0;
  const mix = (channel) => {
    const top = sample(x0, y0, channel) * (1 - tx) + sample(x1, y0, channel) * tx;
    const bottom = sample(x0, y1, channel) * (1 - tx) + sample(x1, y1, channel) * tx;
    return Math.round(top * (1 - ty) + bottom * ty);
  };
  return [mix(0), mix(1), mix(2), mix(3)];
}

function drawTerrainGlobe(canvas, raster, viewState) {
  const ctx = canvas.getContext("2d");
  if (!ctx || !raster) return;
  const { width, height, dpr } = getCanvasSize(canvas, 520, 520);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.42;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = (x + 0.5 - cx) / radius;
      const ny = (y + 0.5 - cy) / radius;
      const pixel = (y * width + x) * 4;
      const point = invertOrtho(nx, ny, viewState.centerLat, viewState.centerLon);
      if (!point) {
        data[pixel] = 7;
        data[pixel + 1] = 13;
        data[pixel + 2] = 32;
        data[pixel + 3] = 255;
        continue;
      }
      const fx = (point.lonDeg + 180) / 360;
      const fy = (90 - point.latDeg) / 180;
      const [r, g, b, a] = sampleTerrainColor(raster, fx, fy);
      data[pixel] = r;
      data[pixel + 1] = g;
      data[pixel + 2] = b;
      data[pixel + 3] = a;
    }
  }

  ctx.fillStyle = "rgba(7, 13, 32, 0.92)";
  ctx.fillRect(0, 0, width, height);
  ctx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.fillText(`Terrain globe | ${raster.width} x ${raster.height}`, 12, 18);
}

function drawTerrainPlaceholder(canvas, label = "Rendering terrain preview...") {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = getTerrainPreviewSize("interactive");
  canvas.width = size.width;
  canvas.height = size.height;
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = "#0b1228";
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "18px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, size.width / 2, size.height / 2);
}

async function requestTerrainRaster(
  model,
  {
    width,
    height,
    mode,
    topographyBandStepM = 250,
    topographyPeakColor = null,
    terrainStylePreset = "physical",
    reliefStrength = 1,
    coastlineEmphasis = 1,
  },
) {
  if (supportsTectonicsTerrainWorker()) {
    try {
      return await requestTectonicsTerrainRaster({
        model,
        width,
        height,
        mode,
        topographyBandStepM,
        topographyPeakColor,
        terrainStylePreset,
        reliefStrength,
        coastlineEmphasis,
      });
    } catch {}
  }
  return buildTerrainRaster(model, {
    width,
    height,
    mode,
    topographyBandStepM,
    topographyPeakColor,
    terrainStylePreset,
    reliefStrength,
    coastlineEmphasis,
  });
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

async function downloadTerrainPreview(
  model,
  mode,
  filename,
  {
    previewWidth = 1024,
    previewHeight = 512,
    exportPreset = "preview",
    exportSize = "preview",
    topographyBandStepM = 250,
    topographyPeakColor = null,
    terrainStylePreset = "physical",
    reliefStrength = 1,
    coastlineEmphasis = 1,
    contourMajorEvery = 5,
    showMinorContours = true,
    showOceanContours = true,
  } = {},
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const exportProfile = resolveTerrainExportProfile({
    mode,
    previewWidth,
    previewHeight,
    exportPreset,
    exportSize,
    topographyBandStepM,
    topographyPeakColor,
    terrainStylePreset,
    reliefStrength,
    coastlineEmphasis,
    contourMajorEvery,
    showMinorContours,
    showOceanContours,
  });
  const raster = await requestTerrainRaster(model, exportProfile);
  paintTerrainRaster(canvas, raster, exportProfile);
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
  let workspaceMode = "plate";
  let workspaceProjection = "flat";
  let plateRailTab = "plates";
  let terrainRailTab = "view";
  let inspectorCollapsed = false;
  let terrainMode = "shaded";
  let topographyBandStepM = 250;
  let topographyMajorEvery = 5;
  let topographyShowMinorContours = true;
  let topographyShowOceanContours = true;
  let terrainStylePreset = "physical";
  let terrainTopographyPeakColor = getDefaultTopographyPeakColor(terrainStylePreset);
  let terrainTopographyPeakCustomized = false;
  let terrainReliefStrength = 1;
  let terrainCoastlineEmphasis = 1;
  let terrainExportPreset = "preview";
  let terrainExportSize = "preview";
  let terrainRenderToken = 0;
  let terrainUpgradeTimer = null;
  let lastTerrainRaster = null;
  let terrainStale = true;
  let terrainInspector = null;
  let cleanupFns = [];
  let sidebarTab = null;
  syncWorkspaceUiState(state);

  function cleanup({ keepPlayback = false } = {}) {
    if (!keepPlayback && playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
      isPlaying = false;
    }
    if (terrainUpgradeTimer) {
      clearTimeout(terrainUpgradeTimer);
      terrainUpgradeTimer = null;
    }
    terrainRenderToken += 1;
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

  function syncWorkspaceUiState(nextState = state) {
    const workspace = nextState?.workspace || {};
    workspaceMode = workspace.mode || "plate";
    workspaceProjection = workspace.projection || "flat";
    plateRailTab = workspace.plateRailTab || "plates";
    terrainRailTab = workspace.terrainRailTab || "view";
    inspectorCollapsed = Boolean(workspace.inspectorCollapsed);
    sidebarTab = workspace.sidebarTab || null;
    terrainMode = workspace.terrainMode || "shaded";
    topographyBandStepM = Number(workspace.topographyBandStepM) || 250;
    topographyMajorEvery = Number(workspace.topographyMajorEvery) || 5;
    topographyShowMinorContours = workspace.topographyShowMinorContours !== false;
    topographyShowOceanContours = workspace.topographyShowOceanContours !== false;
    terrainStylePreset = workspace.terrainStylePreset || "physical";
    terrainTopographyPeakColor =
      workspace.terrainTopographyPeakColor || getDefaultTopographyPeakColor(terrainStylePreset);
    terrainTopographyPeakCustomized = Boolean(workspace.terrainTopographyPeakCustomized);
    terrainReliefStrength = Number.isFinite(Number(workspace.terrainReliefStrength))
      ? Number(workspace.terrainReliefStrength)
      : 1;
    terrainCoastlineEmphasis = Number.isFinite(Number(workspace.terrainCoastlineEmphasis))
      ? Number(workspace.terrainCoastlineEmphasis)
      : 1;
    terrainExportPreset = workspace.terrainExportPreset || "preview";
    terrainExportSize = workspace.terrainExportSize || "preview";
    terrainInspector =
      Number.isFinite(Number(workspace.inspectorFx)) &&
      Number.isFinite(Number(workspace.inspectorFy))
        ? {
            fx: clamp(Number(workspace.inspectorFx), 0, 1),
            fy: clamp(Number(workspace.inspectorFy), 0, 1),
          }
        : null;
  }

  function applyWorkspaceUiState(nextState) {
    const target = nextState && typeof nextState === "object" ? nextState : {};
    target.workspace = {
      ...(target.workspace && typeof target.workspace === "object" ? target.workspace : {}),
      mode: workspaceMode,
      projection: workspaceProjection,
      plateRailTab,
      terrainRailTab,
      inspectorCollapsed,
      sidebarTab,
      terrainMode,
      topographyBandStepM,
      topographyMajorEvery,
      topographyShowMinorContours,
      topographyShowOceanContours,
      terrainStylePreset,
      terrainTopographyPeakColor,
      terrainTopographyPeakCustomized,
      terrainReliefStrength,
      terrainCoastlineEmphasis,
      terrainExportPreset,
      terrainExportSize,
      inspectorFx: terrainInspector?.fx ?? null,
      inspectorFy: terrainInspector?.fy ?? null,
    };
    return target;
  }

  function commit(nextState, { preserveStatus = false, terrainDirty = true } = {}) {
    applyWorkspaceUiState(nextState);
    state = saveSimulatorState(nextState);
    syncWorkspaceUiState(state);
    if (terrainDirty) terrainStale = true;
    if (!preserveStatus) importStatus = null;
    render({ terrainDirty });
  }

  function persistWorkspaceUi({ preserveStatus = true, terrainDirty = false } = {}) {
    const next = cloneState(state);
    applyWorkspaceUiState(next);
    state = saveSimulatorState(next);
    syncWorkspaceUiState(state);
    if (terrainDirty) terrainStale = true;
    if (!preserveStatus) importStatus = null;
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
    playbackTimer = globalThis.setInterval(() => {
      const current = getSimulatorState();
      const next = cloneState(current);
      next.timeMyr = Math.min(
        250,
        (Number(next.timeMyr) || 0) + (Number(next.playbackStepMyr) || 5),
      );
      if (next.timeMyr >= 250) {
        stopPlaybackLoop();
      }
      commit(next, { preserveStatus: true, terrainDirty: true });
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

  function drawViewsOnly(model = buildModel()) {
    const stage = root.querySelector("#tecSimStage");
    if (!stage) return;
    if (workspaceProjection === "sphere") {
      drawGlobe(stage, model, viewState, hitState);
    } else {
      drawFlatMap(stage, model, hitState);
    }
    syncSelectedReadouts(model);
  }

  function paintCurrentTerrainViewport() {
    if (!lastTerrainRaster || workspaceMode !== "terrain") return;
    const terrainOptions = {
      topographyBandStepM,
      coastlineEmphasis: terrainCoastlineEmphasis,
      contourMajorEvery: topographyMajorEvery,
      showMinorContours: topographyShowMinorContours,
      showOceanContours: topographyShowOceanContours,
    };
    const stage = root.querySelector("#tecSimStage");
    if (workspaceProjection === "sphere") {
      if (stage) drawTerrainGlobe(stage, lastTerrainRaster, viewState);
    } else if (stage) {
      paintTerrainRaster(stage, lastTerrainRaster, terrainOptions);
    }
    refreshTerrainInspector();
  }

  async function scheduleTerrainPreview(model, { progressive = true } = {}) {
    const canvas = root.querySelector("#tecSimStage");
    if (!canvas) return;

    const token = ++terrainRenderToken;
    if (terrainUpgradeTimer) {
      clearTimeout(terrainUpgradeTimer);
      terrainUpgradeTimer = null;
    }

    const paintRequest = async (quality) => {
      const liveCanvas = root.querySelector("#tecSimStage");
      if (!liveCanvas || token !== terrainRenderToken) return;
      const size = getTerrainPreviewSize(quality);
      let raster;
      try {
        raster = await requestTerrainRaster(model, {
          width: size.width,
          height: size.height,
          mode: terrainMode,
          topographyBandStepM,
          topographyPeakColor: terrainTopographyPeakColor,
          terrainStylePreset,
          reliefStrength: terrainReliefStrength,
          coastlineEmphasis: terrainCoastlineEmphasis,
        });
      } catch {
        if (token === terrainRenderToken) {
          const chromeEl = root.querySelector(".tec-sim__stage-chrome");
          if (chromeEl) chromeEl.classList.remove("is-loading");
          if (liveCanvas) drawTerrainPlaceholder(liveCanvas, "Terrain preview unavailable");
        }
        return;
      }
      if (token !== terrainRenderToken) return;
      lastTerrainRaster = raster;
      terrainStale = false;
      const chromeEl = root.querySelector(".tec-sim__stage-chrome");
      if (chromeEl) chromeEl.classList.remove("is-loading");
      paintCurrentTerrainViewport();
    };

    const chrome = canvas.closest(".tec-sim__stage-chrome");
    if (chrome) chrome.classList.add("is-loading");
    drawTerrainPlaceholder(canvas);
    if (!progressive || !supportsTectonicsTerrainWorker()) {
      await paintRequest(isPlaying ? "interactive" : "settled");
      return;
    }

    await paintRequest("interactive");
    if (token !== terrainRenderToken || isPlaying) return;
    terrainUpgradeTimer = globalThis.setTimeout(() => {
      void paintRequest("settled");
    }, 90);
  }

  function updateSelectedPlate(patch, { draft = false, terrainDirty = true } = {}) {
    const next = cloneState(state);
    const plate = next.plates.find((entry) => entry.id === next.selectedPlateId);
    if (!plate) return;
    Object.assign(plate, patch);
    maybeRegenerateAssignments(next);
    if (draft) {
      state = normalizeTectonicsSimulatorState(next);
      drawViewsOnly();
      syncSelectedFields();
    } else {
      commit(next, { terrainDirty });
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
        render({ terrainDirty: false });
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
    commit(next, { terrainDirty: state.tool !== "select" });
  }

  function refreshTerrainInspector() {
    const host = root.querySelector("#tecSimTerrainInspector");
    if (!host) return;
    if (!terrainInspector || !lastTerrainRaster) {
      host.hidden = false;
      host.innerHTML = `<div class="hint">Click the active terrain viewport to inspect elevation, slope, aspect, relief class, and source cell.</div>`;
      return;
    }
    const x = Math.round(
      clamp(terrainInspector.fx, 0, 1) * Math.max(0, lastTerrainRaster.width - 1),
    );
    const y = Math.round(
      clamp(terrainInspector.fy, 0, 1) * Math.max(0, lastTerrainRaster.height - 1),
    );
    const sample = sampleTerrainRaster(lastTerrainRaster, x, y);
    if (!sample) {
      host.hidden = false;
      host.innerHTML = `<div class="hint">No terrain sample is available for that point.</div>`;
      return;
    }
    host.hidden = false;
    host.innerHTML = renderTerrainInspectorMarkup(sample);
  }

  function render({ terrainDirty = true } = {}) {
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
    const stylePresetOptions = TERRAIN_STYLE_PRESET_OPTIONS.map(
      (entry) =>
        `<option value="${entry.id}" ${terrainStylePreset === entry.id ? "selected" : ""}>${escapeHtml(entry.label)}</option>`,
    ).join("");
    const exportPresetOptions = TERRAIN_EXPORT_PRESET_OPTIONS.map(
      (entry) =>
        `<option value="${entry.id}" ${terrainExportPreset === entry.id ? "selected" : ""}>${escapeHtml(entry.label)}</option>`,
    ).join("");
    const exportSizeOptions = TERRAIN_EXPORT_SIZE_OPTIONS.map(
      (entry) =>
        `<option value="${entry.id}" ${terrainExportSize === entry.id ? "selected" : ""}>${escapeHtml(entry.label)}</option>`,
    ).join("");
    const styledTerrainMode = !["slope", "aspect", "slopeaspect", "heightmap"].includes(
      terrainMode,
    );
    const isPlateMode = workspaceMode === "plate";
    const isTerrainMode = workspaceMode === "terrain";
    const isFlatProjection = workspaceProjection === "flat";
    const activeRailTabs = isPlateMode ? PLATE_RAIL_TABS : TERRAIN_RAIL_TABS;
    const activeRailTab = isPlateMode ? plateRailTab : terrainRailTab;
    const railTabsMarkup = activeRailTabs
      .map(
        (tab) => `
          <button
            type="button"
            class="tec-sim__rail-tab ${activeRailTab === tab.id ? "is-active" : ""}"
            data-rail-tab="${escapeHtml(tab.id)}"
            aria-pressed="${activeRailTab === tab.id ? "true" : "false"}"
          >
            ${escapeHtml(tab.label)}
          </button>
        `,
      )
      .join("");
    const terrainSampleSummary = terrainInspector
      ? `${fmt(terrainInspector.fx * 100, 0)}% x / ${fmt(terrainInspector.fy * 100, 0)}% y`
      : "No saved sample";
    const stylePanelMarkup = renderWorkspaceStylePanel({
      isTerrainMode,
      styledTerrainMode,
      terrainMode,
      stylePresetOptions,
      terrainStylePreset,
      terrainReliefStrength,
      terrainCoastlineEmphasis,
      terrainTopographyPeakColor,
      topographyBandStepM,
      topographyMajorEvery,
      topographyShowMinorContours,
      topographyShowOceanContours,
    });
    const exportPanelMarkup = renderWorkspaceExportPanel({
      isTerrainMode,
      terrainMode,
      exportPresetOptions,
      exportSizeOptions,
    });

    root.innerHTML = buildStageWorkspaceMarkup({
      state,
      model,
      isPlaying,
      isPlateMode,
      isTerrainMode,
      isFlatProjection,
      workspaceMode,
      terrainMode,
      inspectorCollapsed,
      sidebarTab,
      activeRailTab,
      railTabsMarkup,
      plateButtons,
      editingPlate,
      terrainSampleSummary,
      importStatus,
      stylePanelMarkup,
      exportPanelMarkup,
    });

    attachTooltips(root);
    const stage = root.querySelector("#tecSimStage");
    if (isTerrainMode && stage) {
      if (!terrainStale && lastTerrainRaster) {
        paintCurrentTerrainViewport();
      } else {
        void scheduleTerrainPreview(model, { progressive: terrainDirty });
      }
    } else if (stage) {
      drawViewsOnly(model);
    }
    syncSelectedReadouts(model);
    if (isTerrainMode) refreshTerrainInspector();

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

    bindClick("#tecSimModePlate", () => {
      workspaceMode = "plate";
      commit(cloneState(state), { preserveStatus: true, terrainDirty: false });
    });
    bindClick("#tecSimModeTerrain", () => {
      workspaceMode = "terrain";
      commit(cloneState(state), { preserveStatus: true, terrainDirty: false });
    });
    bindClick("#tecSimProjectionFlat", () => {
      workspaceProjection = "flat";
      commit(cloneState(state), { preserveStatus: true, terrainDirty: false });
    });
    bindClick("#tecSimProjectionSphere", () => {
      workspaceProjection = "sphere";
      commit(cloneState(state), { preserveStatus: true, terrainDirty: false });
    });
    root.querySelectorAll("[data-sidebar-tab]").forEach((button) => {
      if (button.dataset.railTab) return;
      const handler = () => {
        const tabId = button.dataset.sidebarTab;
        sidebarTab = sidebarTab === tabId ? null : tabId;
        commit(cloneState(state), { preserveStatus: true, terrainDirty: false });
      };
      button.addEventListener("click", handler);
      cleanupFns.push(() => button.removeEventListener("click", handler));
    });
    bindClick("#tecSimSidebarClose", () => {
      sidebarTab = null;
      commit(cloneState(state), { preserveStatus: true, terrainDirty: false });
    });
    bindClick("#tecSimInspectorToggle", () => {
      inspectorCollapsed = !inspectorCollapsed;
      commit(cloneState(state), { preserveStatus: true, terrainDirty: false });
    });
    root.querySelectorAll("[data-rail-tab]").forEach((button) => {
      const handler = () => {
        if (workspaceMode === "plate") {
          plateRailTab = button.dataset.railTab || "plates";
        } else {
          terrainRailTab = button.dataset.railTab || "view";
        }
        commit(cloneState(state), { preserveStatus: true, terrainDirty: false });
      };
      button.addEventListener("click", handler);
      cleanupFns.push(() => button.removeEventListener("click", handler));
    });
    root.querySelectorAll("[data-tool-id]").forEach((button) => {
      const handler = () => {
        const next = cloneState(state);
        next.tool = button.dataset.toolId || "select";
        commit(next, { terrainDirty: false });
      };
      button.addEventListener("click", handler);
      cleanupFns.push(() => button.removeEventListener("click", handler));
    });
    root.querySelectorAll("[data-target-id]").forEach((button) => {
      const handler = () => {
        const next = cloneState(state);
        next.paintTarget = button.dataset.targetId === "crust" ? "crust" : "plate";
        commit(next, { terrainDirty: false });
      };
      button.addEventListener("click", handler);
      cleanupFns.push(() => button.removeEventListener("click", handler));
    });

    bindChange("#tecSimLayer", (event) => {
      const next = cloneState(state);
      next.layer = event.target.value;
      commit(next, { terrainDirty: false });
    });
    bindChange("#tecSimQuickLayer", (event) => {
      const next = cloneState(state);
      next.layer = event.target.value;
      commit(next, { terrainDirty: false });
    });
    bindChange("#tecSimTool", (event) => {
      const next = cloneState(state);
      next.tool = event.target.value;
      commit(next, { terrainDirty: false });
    });
    bindChange("#tecSimTarget", (event) => {
      const next = cloneState(state);
      next.paintTarget = event.target.value;
      commit(next, { terrainDirty: false });
    });
    bindChange("#tecSimBrushRadius", (event) => {
      const next = cloneState(state);
      next.brushRadius = Number(event.target.value) || 0;
      commit(next, { terrainDirty: false });
    });
    bindChange("#tecSimCrustPaintType", (event) => {
      const next = cloneState(state);
      next.cellCrustPaintType = event.target.value === "oceanic" ? "oceanic" : "continental";
      commit(next, { terrainDirty: false });
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
    bindChange("#tecSimQuickResolution", (event) => {
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
      commit(next, { preserveStatus: true, terrainDirty: false });
    });
    bindClick("#tecSimPlay", () => {
      if (isPlaying) {
        stopPlaybackLoop();
        render({ terrainDirty: false });
      } else {
        startPlaybackLoop();
        render({ terrainDirty: false });
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
      commit(cloneState(state), { preserveStatus: true, terrainDirty: true });
    });
    bindChange("#tecSimQuickTerrainMode", (event) => {
      terrainMode = event.target.value || "shaded";
      commit(cloneState(state), { preserveStatus: true, terrainDirty: true });
    });
    bindInput("#tecSimTopographyStep", (event) => {
      topographyBandStepM = Number(event.target.value) || 250;
      const valueEl = root.querySelector("#tecSimTopographyStepValue");
      if (valueEl) valueEl.textContent = `${fmt(topographyBandStepM, 0)} m`;
      if (terrainMode === "topography") {
        commit(cloneState(state), { preserveStatus: true, terrainDirty: true });
      } else {
        persistWorkspaceUi();
      }
    });
    bindInput("#tecSimTopographyPeakColor", (event) => {
      terrainTopographyPeakColor = String(
        event.target.value || getDefaultTopographyPeakColor(terrainStylePreset),
      );
      terrainTopographyPeakCustomized = true;
      const valueEl = root.querySelector("#tecSimTopographyPeakColorValue");
      if (valueEl) valueEl.textContent = terrainTopographyPeakColor.toUpperCase();
      if (terrainMode === "topography") {
        commit(cloneState(state), { preserveStatus: true, terrainDirty: true });
      } else {
        persistWorkspaceUi();
      }
    });
    bindInput("#tecSimTopographyMajorEvery", (event) => {
      topographyMajorEvery = Math.max(2, Number(event.target.value) || 5);
      const valueEl = root.querySelector("#tecSimTopographyMajorEveryValue");
      if (valueEl) valueEl.textContent = `Every ${fmt(topographyMajorEvery, 0)}th`;
      persistWorkspaceUi();
      if (lastTerrainRaster && terrainMode === "topography") {
        paintCurrentTerrainViewport();
      }
    });
    bindChange("#tecSimTopographyMinorContours", (event) => {
      topographyShowMinorContours = event.target.value !== "off";
      persistWorkspaceUi();
      if (lastTerrainRaster && terrainMode === "topography") {
        paintCurrentTerrainViewport();
      }
    });
    bindChange("#tecSimTopographyOceanContours", (event) => {
      topographyShowOceanContours = event.target.value !== "off";
      persistWorkspaceUi();
      if (lastTerrainRaster && terrainMode === "topography") {
        paintCurrentTerrainViewport();
      }
    });
    bindChange("#tecSimTerrainStylePreset", (event) => {
      terrainStylePreset = String(event.target.value || "physical");
      if (!terrainTopographyPeakCustomized) {
        terrainTopographyPeakColor = getDefaultTopographyPeakColor(terrainStylePreset);
        const colorEl = root.querySelector("#tecSimTopographyPeakColor");
        if (colorEl) colorEl.value = terrainTopographyPeakColor;
        const valueEl = root.querySelector("#tecSimTopographyPeakColorValue");
        if (valueEl) valueEl.textContent = terrainTopographyPeakColor.toUpperCase();
      }
      commit(cloneState(state), { preserveStatus: true, terrainDirty: true });
    });
    bindInput("#tecSimTerrainRelief", (event) => {
      terrainReliefStrength = Math.max(0, Number(event.target.value) || 0) / 100;
      const valueEl = root.querySelector("#tecSimTerrainReliefValue");
      if (valueEl) valueEl.textContent = `${fmt(terrainReliefStrength * 100, 0)}%`;
      commit(cloneState(state), { preserveStatus: true, terrainDirty: true });
    });
    bindInput("#tecSimTerrainCoast", (event) => {
      terrainCoastlineEmphasis = Math.max(0, Number(event.target.value) || 0) / 100;
      const valueEl = root.querySelector("#tecSimTerrainCoastValue");
      if (valueEl) valueEl.textContent = `${fmt(terrainCoastlineEmphasis * 100, 0)}%`;
      commit(cloneState(state), { preserveStatus: true, terrainDirty: true });
    });
    bindChange("#tecSimTerrainExportPreset", (event) => {
      terrainExportPreset = String(event.target.value || "preview");
      persistWorkspaceUi();
    });
    bindChange("#tecSimTerrainExportSize", (event) => {
      terrainExportSize = String(event.target.value || "preview");
      persistWorkspaceUi();
    });
    bindClick("#tecSimExportLayer", () =>
      downloadCurrentLayer(
        buildModel(),
        `tectonics-${(state.layer || "plates").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}.png`,
      ),
    );
    bindClick("#tecSimExportActiveMode", () =>
      downloadTerrainPreview(
        buildModel(),
        terrainMode,
        `tectonics-${terrainMode.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}.png`,
        {
          previewWidth: lastTerrainRaster?.width || getTerrainPreviewSize("settled").width,
          previewHeight: lastTerrainRaster?.height || getTerrainPreviewSize("settled").height,
          exportPreset: terrainExportPreset,
          exportSize: terrainExportSize,
          topographyBandStepM,
          topographyPeakColor: terrainTopographyPeakColor,
          terrainStylePreset,
          reliefStrength: terrainReliefStrength,
          coastlineEmphasis: terrainCoastlineEmphasis,
          contourMajorEvery: topographyMajorEvery,
          showMinorContours: topographyShowMinorContours,
          showOceanContours: topographyShowOceanContours,
        },
      ),
    );
    bindClick("#tecSimExportRelief", () =>
      downloadTerrainPreview(buildModel(), "shaded", "tectonics-terrain-relief.png", {
        previewWidth: lastTerrainRaster?.width || getTerrainPreviewSize("settled").width,
        previewHeight: lastTerrainRaster?.height || getTerrainPreviewSize("settled").height,
        exportPreset: terrainExportPreset,
        exportSize: terrainExportSize,
        topographyBandStepM,
        topographyPeakColor: terrainTopographyPeakColor,
        terrainStylePreset,
        reliefStrength: terrainReliefStrength,
        coastlineEmphasis: terrainCoastlineEmphasis,
      }),
    );
    bindClick("#tecSimExportTopography", () =>
      downloadTerrainPreview(buildModel(), "topography", "tectonics-topography-map.png", {
        previewWidth: lastTerrainRaster?.width || getTerrainPreviewSize("settled").width,
        previewHeight: lastTerrainRaster?.height || getTerrainPreviewSize("settled").height,
        exportPreset: terrainExportPreset,
        exportSize: terrainExportSize,
        topographyBandStepM,
        topographyPeakColor: terrainTopographyPeakColor,
        terrainStylePreset,
        reliefStrength: terrainReliefStrength,
        coastlineEmphasis: terrainCoastlineEmphasis,
        contourMajorEvery: topographyMajorEvery,
        showMinorContours: topographyShowMinorContours,
        showOceanContours: topographyShowOceanContours,
      }),
    );
    bindClick("#tecSimExportTerrain", () =>
      downloadTerrainPreview(buildModel(), "height", "tectonics-terrain-colour.png", {
        previewWidth: lastTerrainRaster?.width || getTerrainPreviewSize("settled").width,
        previewHeight: lastTerrainRaster?.height || getTerrainPreviewSize("settled").height,
        exportPreset: terrainExportPreset,
        exportSize: terrainExportSize,
        topographyBandStepM,
        topographyPeakColor: terrainTopographyPeakColor,
        terrainStylePreset,
        reliefStrength: terrainReliefStrength,
        coastlineEmphasis: terrainCoastlineEmphasis,
      }),
    );
    bindClick("#tecSimExportBathymetry", () =>
      downloadTerrainPreview(buildModel(), "bathymetry", "tectonics-bathymetry.png", {
        previewWidth: lastTerrainRaster?.width || getTerrainPreviewSize("settled").width,
        previewHeight: lastTerrainRaster?.height || getTerrainPreviewSize("settled").height,
        exportPreset: terrainExportPreset,
        exportSize: terrainExportSize,
        topographyBandStepM,
        topographyPeakColor: terrainTopographyPeakColor,
        terrainStylePreset,
        reliefStrength: terrainReliefStrength,
        coastlineEmphasis: terrainCoastlineEmphasis,
      }),
    );
    bindClick("#tecSimExportHeight", () =>
      downloadTerrainPreview(buildModel(), "heightmap", "tectonics-heightmap.png", {
        previewWidth: lastTerrainRaster?.width || getTerrainPreviewSize("settled").width,
        previewHeight: lastTerrainRaster?.height || getTerrainPreviewSize("settled").height,
        exportPreset: terrainExportPreset,
        exportSize: terrainExportSize,
        topographyBandStepM,
        topographyPeakColor: terrainTopographyPeakColor,
        terrainStylePreset,
        reliefStrength: terrainReliefStrength,
        coastlineEmphasis: terrainCoastlineEmphasis,
      }),
    );
    bindClick("#tecSimClearTerrainSample", () => {
      terrainInspector = null;
      persistWorkspaceUi();
      refreshTerrainInspector();
    });
    bindClick("#tecSimQuickClearTerrainSample", () => {
      terrainInspector = null;
      persistWorkspaceUi();
      refreshTerrainInspector();
    });
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
        commit(next, { terrainDirty: false });
      };
      button.addEventListener("click", handler);
      cleanupFns.push(() => button.removeEventListener("click", handler));
    });

    bindChange("#tecSimPlateLabel", (event) =>
      updateSelectedPlate(
        { label: String(event.target.value || "").slice(0, 40) || "Plate" },
        { terrainDirty: false },
      ),
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
      const stageEl = root.querySelector("#tecSimStage");
      if (!stageEl) return null;
      if (view === "map") {
        const rect = stageEl.getBoundingClientRect();
        return {
          latDeg: Math.max(
            -89.5,
            Math.min(89.5, 90 - ((event.clientY - rect.top) / Math.max(1, rect.height)) * 180),
          ),
          lonDeg: ((event.clientX - rect.left) / Math.max(1, rect.width)) * 360 - 180,
        };
      }
      const rect = stageEl.getBoundingClientRect();
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

    function sampleTerrainAtPointer(event) {
      if (!lastTerrainRaster) return;
      const stageEl = root.querySelector("#tecSimStage");
      if (!stageEl) return;
      const rect = stageEl.getBoundingClientRect();
      if (workspaceProjection === "sphere") {
        const radius = Math.min(rect.width, rect.height) * 0.42;
        const nx = (event.clientX - rect.left - rect.width / 2) / radius;
        const ny = (event.clientY - rect.top - rect.height / 2) / radius;
        const point = invertOrtho(nx, ny, viewState.centerLat, viewState.centerLon);
        if (!point) return;
        terrainInspector = {
          fx: clamp((point.lonDeg + 180) / 360, 0, 1),
          fy: clamp((90 - point.latDeg) / 180, 0, 1),
        };
      } else {
        terrainInspector = {
          fx: clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1),
          fy: clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1),
        };
      }
      persistWorkspaceUi();
      refreshTerrainInspector();
    }

    const stageDown = (event) => {
      if (workspaceMode !== "plate") return;
      const stageEl = root.querySelector("#tecSimStage");
      if (!stageEl) return;
      const rect = stageEl.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const isSphereView = workspaceProjection === "sphere";
      const marker = nearestMarker(isSphereView ? hitState.globeSeeds : hitState.flatSeeds, x, y);
      if (marker) {
        const next = cloneState(state);
        next.selectedPlateId = marker.plateId;
        state = normalizeTectonicsSimulatorState(next);
        dragState = { view: isSphereView ? "globe" : "map", moved: false };
        drawViewsOnly();
        return;
      }
      const cell = pickCell(isSphereView ? hitState.globeCells : hitState.flatCells, x, y);
      handleCellInteraction(cell?.cellId);
    };

    const stageClick = (event) => {
      if (workspaceMode !== "terrain") return;
      sampleTerrainAtPointer(event);
    };

    const stageWheel = (event) => {
      if (workspaceProjection !== "sphere") return;
      event.preventDefault();
      viewState.centerLon =
        ((((viewState.centerLon + event.deltaY * 0.08) % 360) + 540) % 360) - 180;
      if (workspaceMode === "terrain" && workspaceProjection === "sphere" && lastTerrainRaster) {
        paintCurrentTerrainViewport();
      } else {
        drawViewsOnly();
      }
    };

    if (stage) {
      stage.addEventListener("mousedown", stageDown);
      stage.addEventListener("click", stageClick);
      stage.addEventListener("wheel", stageWheel, { passive: false });
      cleanupFns.push(() => stage.removeEventListener("mousedown", stageDown));
      cleanupFns.push(() => stage.removeEventListener("click", stageClick));
      cleanupFns.push(() => stage.removeEventListener("wheel", stageWheel));
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
