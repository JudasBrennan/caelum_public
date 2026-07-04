import { clamp } from "../../engine/utils.js";
import { getClusterObjectVisual, normalizeClusterObjectKey } from "../clusterObjectVisuals.js";

let starfieldCache = null;

export function drawStarDot(ctx, cx, cy, radius, color, alpha) {
  const hex = String(color || "#ffffff").replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const cr = Math.min(255, Math.round(r * 0.5 + 255 * 0.5));
  const cg = Math.min(255, Math.round(g * 0.5 + 255 * 0.5));
  const cb = Math.min(255, Math.round(b * 0.5 + 255 * 0.5));
  const outerR = Math.max(radius * 2.6, 2);
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.12, cx, cy, outerR);
  grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`);
  grad.addColorStop(0.42, `rgba(${r},${g},${b},${(alpha * 0.78).toFixed(2)})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
  ctx.fill();
}

export function drawClusterCompanions(ctx, px, py, primaryRadius, components, perspective) {
  const companionCount = components.length - 1;
  if (companionCount <= 0) return;
  const cRadius = clamp(primaryRadius * 0.55, 1.0, 5.5);
  const spacing = cRadius * 2.4;
  const startX = px + primaryRadius * 1.15;
  const startY = py - primaryRadius * 0.85;
  const p = clamp(perspective, 0.35, 2.3);
  const alpha = clamp(0.38 + p * 0.2, 0.28, 0.78);
  for (let i = 0; i < companionCount; i += 1) {
    const comp = components[i + 1];
    const compVisual = getClusterObjectVisual(comp.objectClassKey);
    drawStarDot(ctx, startX + i * spacing, startY, cRadius, compVisual.color, alpha);
  }
}

export function clusterClassLabel(system) {
  if (!Array.isArray(system.components) || system.components.length <= 1) {
    const key = system.objectClassKey;
    return key === "LTY" ? "L/T/Y" : key === "OTHER" ? "Other" : key;
  }
  return system.components
    .map((component) => {
      const key = normalizeClusterObjectKey(component.objectClassKey);
      return key === "LTY" ? "L/T/Y" : key === "OTHER" ? "Other" : key;
    })
    .join(" + ");
}

export function ensureStarfield(count = 400) {
  if (starfieldCache && starfieldCache.length === count) return starfieldCache;
  const stars = [];
  let seed = 48271;
  const rng = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i += 1) {
    stars.push({
      u: rng(),
      v: rng(),
      radius: 0.3 + rng() * 0.7,
      alpha: 0.15 + rng() * 0.35,
    });
  }
  starfieldCache = stars;
  return stars;
}

export function drawClusterStarfield(ctx, width, height, count = 400) {
  const stars = ensureStarfield(count);
  for (const star of stars) {
    const x = star.u * width;
    const y = star.v * height;
    ctx.beginPath();
    ctx.arc(x, y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,210,240,${star.alpha.toFixed(2)})`;
    ctx.fill();
  }
}

export function drawClusterRangeBearingGrid(
  ctx,
  { radiusLy = 1, project3D, useMils = false } = {},
) {
  if (!ctx || typeof project3D !== "function") return 0;
  const ringCount = 4;
  const ringSegments = 96;
  for (let i = 1; i <= ringCount; i += 1) {
    const ringLy = radiusLy * (i / ringCount);
    const alpha = i === ringCount ? 0.2 : 0.12;
    ctx.strokeStyle = `rgba(196,216,255,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let s = 0; s <= ringSegments; s += 1) {
      const angle = (s / ringSegments) * Math.PI * 2;
      const sp = project3D(Math.sin(angle) * ringLy, 0, Math.cos(angle) * ringLy);
      if (s === 0) ctx.moveTo(sp.x, sp.y);
      else ctx.lineTo(sp.x, sp.y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (let i = 1; i <= ringCount; i += 1) {
    const ring = radiusLy * (i / ringCount);
    const sp = project3D(ring, 0, 0);
    ctx.fillStyle = "rgba(186,208,248,0.82)";
    const lyStr = ring >= 100 ? ring.toFixed(0) : ring >= 10 ? ring.toFixed(1) : ring.toFixed(2);
    ctx.fillText(`${lyStr} ly`, sp.x + 8, sp.y);
  }

  const degreeMarks = [0, 45, 90, 135, 180, 225, 270, 315];
  for (const deg of degreeMarks) {
    const angle = (deg * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const innerSp = project3D(sin * radiusLy * 0.985, 0, cos * radiusLy * 0.985);
    const outerSp = project3D(sin * radiusLy * 1.03, 0, cos * radiusLy * 1.03);
    ctx.strokeStyle = "rgba(210,226,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(innerSp.x, innerSp.y);
    ctx.lineTo(outerSp.x, outerSp.y);
    ctx.stroke();
    const labelSp = project3D(sin * radiusLy * 1.09, 0, cos * radiusLy * 1.09);
    ctx.fillStyle = "rgba(205,220,248,0.8)";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const bearingLabel = useMils ? `${Math.round((deg / 360) * 6400)} mil` : `${deg}\u00b0`;
    ctx.fillText(bearingLabel, labelSp.x, labelSp.y);
  }
  ctx.textAlign = "left";
  return ringCount + degreeMarks.length;
}

function hazardColor(tone, alpha = 1) {
  const tones = {
    bad: [255, 106, 106],
    danger: [255, 106, 106],
    warn: [255, 181, 92],
    caution: [255, 213, 122],
    good: [118, 224, 163],
    neutral: [166, 194, 238],
  };
  const [r, g, b] = tones[tone] || tones.neutral;
  return `rgba(${r},${g},${b},${alpha})`;
}

function safeShellRadius(shell, clusterRadiusLy) {
  const radius = Number(shell?.radiusLy);
  const clusterRadius = Number(clusterRadiusLy);
  if (!Number.isFinite(radius) || radius <= 0) return null;
  if (!Number.isFinite(clusterRadius) || clusterRadius <= 0) return radius;
  return Math.min(radius, clusterRadius);
}

export function drawProjectedHazardShells(
  ctx,
  shells = [],
  { projectRingPoint, clusterRadiusLy, segments = 128 } = {},
) {
  if (!ctx || typeof projectRingPoint !== "function") return 0;
  let drawn = 0;
  for (const shell of Array.isArray(shells) ? shells : []) {
    const radiusLy = safeShellRadius(shell, clusterRadiusLy);
    if (radiusLy == null) continue;
    const tone = shell.tone || "neutral";
    ctx.save?.();
    ctx.strokeStyle = hazardColor(tone, shell.extrapolated ? 0.72 : 0.52);
    ctx.lineWidth = shell.extrapolated ? 2 : 1.4;
    ctx.setLineDash?.(shell.extrapolated ? [7, 6] : []);
    ctx.beginPath();
    for (let s = 0; s <= segments; s += 1) {
      const angle = (s / segments) * Math.PI * 2;
      const point = projectRingPoint(radiusLy, angle);
      if (!point) continue;
      if (s === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.closePath?.();
    ctx.stroke();
    ctx.setLineDash?.([]);
    ctx.restore?.();
    drawn += 1;
  }
  return drawn;
}

export function drawHazardSystemHighlights(ctx, plotted = [], hazardMap = {}, options = {}) {
  if (!ctx) return 0;
  const highlights = new Map(
    (Array.isArray(hazardMap?.highlightedSystems) ? hazardMap.highlightedSystems : []).map(
      (item) => [item.id, item],
    ),
  );
  let drawn = 0;
  for (const item of plotted || []) {
    const highlight = highlights.get(item?.sys?.id);
    if (!highlight) continue;
    const x = item.screen?.x;
    const y = item.screen?.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const radius = Math.max(Number(item.pointRadius) || 3, 3);
    const color = hazardColor(highlight.tone || "warn", 1);
    ctx.save?.();
    ctx.beginPath();
    ctx.arc(x, y, radius * 4.2, 0, Math.PI * 2);
    ctx.fillStyle = hazardColor(highlight.tone || "warn", 0.14);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.6, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    if (options.labels !== false) {
      ctx.fillStyle = hazardColor(highlight.tone || "warn", 0.92);
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("massive candidate", x + radius * 2.8 + 4, y);
    }
    ctx.restore?.();
    drawn += 1;
  }
  return drawn;
}

function drawPanel(ctx, x, y, width, height) {
  ctx.fillStyle = "rgba(5, 10, 24, 0.82)";
  ctx.strokeStyle = "rgba(142, 168, 214, 0.34)";
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
}

export function drawHazardEncounterInset(ctx, encounterInset = {}, { width = 0, height = 0 } = {}) {
  if (!ctx || !encounterInset) return false;
  const panelW = Math.min(280, Math.max(218, width * 0.32));
  const panelH = 116;
  const x = 14;
  const y = Math.max(14, height - panelH - 16);
  drawPanel(ctx, x, y, panelW, panelH);
  ctx.save?.();
  ctx.fillStyle = "rgba(241, 246, 255, 0.94)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Flyby / Oort inset", x + 12, y + 10);

  const cx = x + 54;
  const cy = y + 66;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.strokeStyle = hazardColor("caution", 0.76);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.strokeStyle = hazardColor("warn", 0.86);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 244, 190, 0.95)";
  ctx.fill();

  ctx.fillStyle = "rgba(205, 220, 248, 0.86)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText(`${encounterInset.veryCloseAu || 1000} AU close screen`, x + 96, y + 42);
  ctx.fillText(`${encounterInset.oortStirringAu || 10000} AU Oort screen`, x + 96, y + 58);
  ctx.fillText(
    `Nearest: ${encounterInset.nearestGeneratedSystemLabel || "unavailable"}`,
    x + 96,
    y + 74,
  );
  ctx.fillText(`Flyby: ${encounterInset.flybyIntervalLabel || "unavailable"}`, x + 96, y + 90);
  ctx.restore?.();
  return true;
}

export function drawHazardLegend(ctx, hazardMap = {}, { width = 0 } = {}) {
  if (!ctx || !hazardMap?.legend) return false;
  const panelW = Math.min(320, Math.max(236, width * 0.34));
  const panelH = 110;
  const x = Math.max(14, width - panelW - 14);
  const y = 14;
  drawPanel(ctx, x, y, panelW, panelH);
  ctx.save?.();
  ctx.fillStyle = "rgba(241, 246, 255, 0.96)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Hazard Lens", x + 12, y + 10);
  ctx.fillStyle = "rgba(203, 219, 248, 0.88)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText(`Dominant: ${hazardMap.legend.dominantHazardLabel || "n/a"}`, x + 12, y + 32);
  ctx.fillText(`Confidence: ${hazardMap.legend.confidence || "Low"}`, x + 12, y + 48);
  const notes = Array.isArray(hazardMap.legend.notes) ? hazardMap.legend.notes.slice(0, 2) : [];
  let cursorY = y + 68;
  for (const note of notes) {
    ctx.fillStyle = "rgba(176, 194, 226, 0.82)";
    ctx.fillText(String(note).slice(0, 44), x + 12, cursorY);
    cursorY += 14;
  }
  ctx.restore?.();
  return true;
}

export function drawHazardLensPanels(
  ctx,
  hazardMap = {},
  width = 0,
  height = 0,
  showInset = true,
  showLegend = true,
) {
  let drawn = 0;
  if (showInset && drawHazardEncounterInset(ctx, hazardMap.encounterInset, { width, height }))
    drawn += 1;
  if (showLegend && drawHazardLegend(ctx, hazardMap, { width, height })) drawn += 1;
  return drawn;
}
