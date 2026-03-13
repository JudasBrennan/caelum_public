import { fmt } from "../engine/utils.js";
import { escapeHtml } from "./uiHelpers.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function describeTerrainAspect(aspectDeg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const normalized = (((Number(aspectDeg) || 0) % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % directions.length;
  return directions[index];
}

export function classifyTerrainRelief(elevationM, slopeDeg) {
  const elevation = Number(elevationM) || 0;
  const slope = Math.max(0, Number(slopeDeg) || 0);
  if (elevation < 0) {
    if (slope >= 20) return "Trench wall";
    if (slope >= 8) return "Steep submarine slope";
    if (elevation > -250) return "Shallow shelf";
    if (elevation > -1800) return "Continental slope";
    return "Abyssal plain";
  }
  if (slope >= 28) return "Escarpment";
  if (slope >= 16) return "Mountain belt";
  if (slope >= 8) return "Hilly upland";
  if (slope >= 3) return "Rolling plain";
  return elevation > 1800 ? "High plateau" : "Low plain";
}

export function sampleTerrainRaster(raster, x, y) {
  if (!raster?.heights?.length || !raster.width || !raster.height) return null;
  const px = clamp(Math.round(Number(x) || 0), 0, raster.width - 1);
  const py = clamp(Math.round(Number(y) || 0), 0, raster.height - 1);
  const index = py * raster.width + px;
  const elevationM = Number(raster.heights[index] || 0);
  const slopeDeg = Number(raster.slopeDeg?.[index] || 0);
  const aspectDeg = Number(raster.aspectDeg?.[index] || 0);
  const hillshade = Number(raster.hillshade?.[index] || 0);
  const cellId = raster.cellIds?.[index] ?? null;
  return {
    x: px,
    y: py,
    elevationM,
    slopeDeg,
    aspectDeg,
    aspectLabel: describeTerrainAspect(aspectDeg),
    hillshade,
    cellId,
    reliefClass: classifyTerrainRelief(elevationM, slopeDeg),
    width: raster.width,
    height: raster.height,
  };
}

export function renderTerrainInspectorMarkup(sample) {
  if (!sample) return "";
  return `
    <div class="tec-sim__terrain-inspector-title">Terrain Inspector</div>
    <div class="tec-sim__terrain-inspector-grid">
      <div><span>Elevation</span><strong>${fmt(sample.elevationM, 0)} m</strong></div>
      <div><span>Slope</span><strong>${fmt(sample.slopeDeg, 1)} deg</strong></div>
      <div><span>Aspect</span><strong>${fmt(sample.aspectDeg, 0)} deg (${escapeHtml(sample.aspectLabel)})</strong></div>
      <div><span>Relief</span><strong>${escapeHtml(sample.reliefClass)}</strong></div>
      <div><span>Source Cell</span><strong>${sample.cellId == null ? "n/a" : escapeHtml(String(sample.cellId))}</strong></div>
      <div><span>Preview</span><strong>${sample.width} x ${sample.height}</strong></div>
    </div>
  `;
}
