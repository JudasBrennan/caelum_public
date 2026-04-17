import { loadThreeCore } from "./threeBridge2d.js";
import { buildHierarchyPresentation } from "../engine/homeSystem/companionPresentation.js";
import {
  renderCelestialRecipeSnapshot,
  renderStarSnapshot,
  preWarmTextures,
} from "./celestialVisualPreview.js";
import { getSystemPosterTuning, planSystemPosterLabels } from "./systemPosterLayout.js";

/* Pre-warm Three.js CDN import so it's ready before the first draw call */
loadThreeCore().catch(() => {});

const RUNTIME = new WeakMap();
const TEXT_TEXTURES = new Map();
const PENDING = new WeakMap();
const ACTIVE_POSTER_RUNS = new WeakMap();
const POSTER_CACHE = new Map();
const POSTER_TEXTURES = new Set();
let warned = false;
let _drawGeneration = 0;

const STAR_FILL = 0.22;

function clampDpr(dpr) {
  const n = Number(dpr);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.max(1, Math.min(3, n));
}

function seededRand(seed) {
  let s = seed | 0 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function arcAngles(r, centerY, canvasH, padding = 0.15) {
  // Orthographic runtime uses world-Y up:
  // bottom edge is y=0, top edge is y=canvasH.
  // Padding (radians) extends arcs past canvas edges so the viewport clips
  // them naturally instead of creating a hard visual cutoff.
  const aBottom = r > centerY ? -Math.asin(centerY / r) : -Math.PI / 2;
  const aTop = r > canvasH - centerY ? Math.asin((canvasH - centerY) / r) : Math.PI / 2;
  return [aBottom - padding, aTop + padding];
}

function getTextTexture(runtime, text, opts = {}) {
  const label = String(text ?? "");
  if (!label) return null;
  const font = String(opts.font || "11px system-ui, sans-serif");
  const color = String(opts.color || "rgba(220,225,240,0.9)");
  const key = `${font}|${color}|${label}`;
  if (TEXT_TEXTURES.has(key)) return TEXT_TEXTURES.get(key);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = font;
  const fontMatch = /([0-9]+(?:\.[0-9]+)?)px/.exec(font);
  const fontPx = fontMatch ? Number(fontMatch[1]) : 12;
  const metrics = ctx.measureText(label);
  const w = Math.max(1, Math.ceil(metrics.width + 8));
  const h = Math.max(1, Math.ceil(fontPx + 8));
  canvas.width = w;
  canvas.height = h;
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 3;
  ctx.fillText(label, w / 2, h / 2 + 0.5);

  const tex = new runtime.THREE.CanvasTexture(canvas);
  tex.minFilter = runtime.THREE.LinearFilter;
  tex.magFilter = runtime.THREE.LinearFilter;
  tex.generateMipmaps = false;
  if (runtime.THREE.SRGBColorSpace) tex.colorSpace = runtime.THREE.SRGBColorSpace;
  TEXT_TEXTURES.set(key, tex);
  return tex;
}

async function ensureRuntime(canvas) {
  const existing = RUNTIME.get(canvas);
  if (existing) return existing;
  const pending = PENDING.get(canvas);
  if (pending) return pending;

  const promise = loadThreeCore()
    .then((THREE) => {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(1);
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-100, 100, 100, -100, -2000, 2000);
      camera.position.set(0, 0, 40);
      camera.lookAt(0, 0, 0);
      const group = new THREE.Group();
      scene.add(group);
      scene.add(new THREE.AmbientLight(0x9fb4d8, 0.36));
      const key = new THREE.DirectionalLight(0xffffff, 0.75);
      key.position.set(-2.5, 1.6, 2.2);
      scene.add(key);
      const runtime = { THREE, renderer, scene, camera, group };
      renderer.render(scene, camera);
      RUNTIME.set(canvas, runtime);
      PENDING.delete(canvas);
      return runtime;
    })
    .catch((err) => {
      PENDING.delete(canvas);
      if (!warned) {
        warned = true;
        console.warn("[WorldSmith] Native system-poster renderer unavailable.", err);
      }
      return null;
    });

  PENDING.set(canvas, promise);
  return promise;
}

function clearGroup(group) {
  while (group.children.length) {
    const c = group.children.pop();
    try {
      group.remove(c);
    } catch {}
    try {
      c.geometry?.dispose?.();
    } catch {}
    try {
      c.material?.dispose?.();
    } catch {}
  }
}

function cleanupPosterTextures() {
  for (const tex of POSTER_TEXTURES) {
    try {
      tex.dispose();
    } catch {}
  }
  POSTER_TEXTURES.clear();
}

function addCanvasSprite(runtime, srcCanvas, x, y, size, z = 0, opacity = 1, opts = {}) {
  if (!srcCanvas) return null;
  const tex = new runtime.THREE.CanvasTexture(srcCanvas);
  tex.minFilter = runtime.THREE.LinearFilter;
  tex.magFilter = runtime.THREE.LinearFilter;
  tex.generateMipmaps = false;
  if (runtime.THREE.SRGBColorSpace) tex.colorSpace = runtime.THREE.SRGBColorSpace;
  POSTER_TEXTURES.add(tex);
  const mat = new runtime.THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: opts.depthWrite ?? false,
    depthTest: opts.depthTest ?? true,
  });
  const sprite = new runtime.THREE.Sprite(mat);
  sprite.position.set(x, y, z);
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
  runtime.group.add(sprite);
  return sprite;
}

function addTextSprite(runtime, text, x, y, z = 5, opts = {}) {
  const tex = getTextTexture(runtime, text, opts);
  if (!tex) return null;
  const img = tex.image;
  const mat = new runtime.THREE.SpriteMaterial({
    map: tex,
    color: 0xffffff,
    transparent: true,
    opacity: Number.isFinite(opts.opacity) ? opts.opacity : 1,
    depthWrite: opts.depthWrite ?? false,
    depthTest: opts.depthTest ?? true,
  });
  const sprite = new runtime.THREE.Sprite(mat);
  const w = Math.max(1, Number(img?.width) || 32);
  const h = Math.max(1, Number(img?.height) || 16);
  let posX = x;
  if (opts.align === "left") posX = x + w / 2;
  else if (opts.align === "right") posX = x - w / 2;
  sprite.position.set(posX, y, z);
  sprite.scale.set(w, h, 1);
  sprite.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
  runtime.group.add(sprite);
  return sprite;
}

function addRotatedText(runtime, text, x, y, z, rotation, opts = {}) {
  const tex = getTextTexture(runtime, text, opts);
  if (!tex) return null;
  const img = tex.image;
  const w = Math.max(1, Number(img?.width) || 32);
  const h = Math.max(1, Number(img?.height) || 16);
  const geom = new runtime.THREE.PlaneGeometry(w, h);
  const mat = new runtime.THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: Number.isFinite(opts.opacity) ? opts.opacity : 1,
    depthWrite: opts.depthWrite ?? false,
    depthTest: opts.depthTest ?? true,
    side: runtime.THREE.DoubleSide,
  });
  const mesh = new runtime.THREE.Mesh(geom, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotation;
  mesh.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
  runtime.group.add(mesh);
  return mesh;
}

function addLine(runtime, x1, y1, x2, y2, color, opacity = 1, z = 0, opts = {}) {
  const g = new runtime.THREE.BufferGeometry().setFromPoints([
    new runtime.THREE.Vector3(x1, y1, z),
    new runtime.THREE.Vector3(x2, y2, z),
  ]);
  const m = new runtime.THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: opts.depthWrite ?? false,
    depthTest: opts.depthTest ?? true,
  });
  const line = new runtime.THREE.Line(g, m);
  line.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
  runtime.group.add(line);
}

function addFilledCircle(runtime, x, y, radius, color, opacity = 1, z = 0, opts = {}) {
  const geometry = new runtime.THREE.CircleGeometry(Math.max(0.5, Number(radius) || 1), 20);
  const material = new runtime.THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: opts.depthWrite ?? false,
    depthTest: opts.depthTest ?? true,
  });
  const mesh = new runtime.THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
  runtime.group.add(mesh);
  return mesh;
}

function addPanelPlane(runtime, x, y, width, height, color, opacity = 1, z = 0, opts = {}) {
  if (!(Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0)) return null;
  const geometry = new runtime.THREE.PlaneGeometry(width, height);
  const alpha = Number.isFinite(opacity) ? opacity : 1;
  const transparent = opts.transparent === true || alpha < 1;
  const material = new runtime.THREE.MeshBasicMaterial({
    color,
    transparent,
    opacity: alpha,
    depthWrite: opts.depthWrite ?? !transparent,
    depthTest: opts.depthTest ?? true,
  });
  const mesh = new runtime.THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
  runtime.group.add(mesh);
  return mesh;
}

function truncatePosterText(text, maxChars = 28) {
  const value = String(text ?? "").trim();
  if (!value) return "";
  const limit = Math.max(4, Number(maxChars) || 28);
  return value.length <= limit ? value : `${value.slice(0, limit - 1).trimEnd()}…`;
}

function addTextLines(runtime, lines, x, startY, lineHeight, z = 5, opts = {}) {
  const entries = Array.isArray(lines)
    ? lines.map((line) => String(line ?? "").trim()).filter(Boolean)
    : [];
  for (let index = 0; index < entries.length; index += 1) {
    addTextSprite(runtime, entries[index], x, startY - index * lineHeight, z, opts);
  }
  return entries.length ? startY - entries.length * lineHeight : startY;
}

function addArcBand(
  runtime,
  cx,
  cy,
  innerR,
  outerR,
  aStart,
  aEnd,
  color,
  opacity = 1,
  z = 0,
  segments = 180,
  opts = {},
) {
  if (!(Number.isFinite(innerR) && Number.isFinite(outerR) && outerR > innerR)) return;
  const vCount = (segments + 1) * 2;
  const positions = new Float32Array(vCount * 3);
  const indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const a = aStart + (aEnd - aStart) * t;
    const ox = cx + Math.cos(a) * outerR;
    const oy = cy + Math.sin(a) * outerR;
    const ix = cx + Math.cos(a) * innerR;
    const iy = cy + Math.sin(a) * innerR;
    const base = i * 2;
    positions[(base + 0) * 3 + 0] = ox;
    positions[(base + 0) * 3 + 1] = oy;
    positions[(base + 0) * 3 + 2] = z;
    positions[(base + 1) * 3 + 0] = ix;
    positions[(base + 1) * 3 + 1] = iy;
    positions[(base + 1) * 3 + 2] = z;
    if (i < segments) {
      const next = base + 2;
      indices.push(base, base + 1, next);
      indices.push(base + 1, next + 1, next);
    }
  }
  const g = new runtime.THREE.BufferGeometry();
  g.setAttribute("position", new runtime.THREE.BufferAttribute(positions, 3));
  g.setIndex(indices);
  const m = new runtime.THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    side: runtime.THREE.DoubleSide,
    depthWrite: false,
    depthTest: opts.depthTest ?? true,
  });
  const mesh = new runtime.THREE.Mesh(g, m);
  mesh.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
  runtime.group.add(mesh);
}

function addArcStroke(
  runtime,
  cx,
  cy,
  radius,
  aStart,
  aEnd,
  color,
  opacity = 1,
  z = 0,
  dashed = false,
  dashSteps = 5,
  gapSteps = 5,
  segments = 260,
  opts = {},
) {
  if (!(Number.isFinite(radius) && radius > 0)) return;
  const THREE = runtime.THREE;
  if (!dashed) {
    const pts = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const a = aStart + (aEnd - aStart) * t;
      pts.push(new THREE.Vector3(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, z));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: false,
      depthTest: opts.depthTest ?? true,
    });
    const line = new THREE.Line(g, m);
    line.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
    runtime.group.add(line);
    return;
  }
  const pts = [];
  const cycle = Math.max(1, dashSteps + gapSteps);
  for (let i = 0; i < segments; i += 1) {
    if (i % cycle >= dashSteps) continue;
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const a0 = aStart + (aEnd - aStart) * t0;
    const a1 = aStart + (aEnd - aStart) * t1;
    pts.push(
      new THREE.Vector3(cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, z),
      new THREE.Vector3(cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius, z),
    );
  }
  if (!pts.length) return;
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
    depthTest: opts.depthTest ?? true,
  });
  const lineSegments = new THREE.LineSegments(g, m);
  lineSegments.renderOrder = Number.isFinite(opts.renderOrder) ? opts.renderOrder : 0;
  runtime.group.add(lineSegments);
}

function addStarfield(runtime, W, H, count = 70, z = -40) {
  if (count <= 0) return;
  const rand = seededRand(42);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = rand() * W;
    pos[i * 3 + 1] = rand() * H;
    pos[i * 3 + 2] = z;
  }
  const geom = new runtime.THREE.BufferGeometry();
  geom.setAttribute("position", new runtime.THREE.BufferAttribute(pos, 3));
  const mat = new runtime.THREE.PointsMaterial({
    color: 0xc8d2ef,
    size: 1.2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  runtime.group.add(new runtime.THREE.Points(geom, mat));
}

function bodyPxR(radiusKm) {
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return 6;
  return Math.max(4, Math.min(26, 8 * Math.pow(radiusKm / 6371, 0.42)));
}

function isBrownDwarfRenderBody(body) {
  return body?.renderModel === "brownDwarfStar" && !!body?.starVisual;
}

function getSystemZoneLabel(system) {
  return String(system?.zoneLabel || "Habitable Zone").trim() || "Habitable Zone";
}

function ringAppearanceKey(ringAppearance) {
  if (!ringAppearance) return "";
  return JSON.stringify({
    enabled: ringAppearance.enabled === true,
    ringStyleId: ringAppearance.ringStyleId || "",
    effectiveStyleId: ringAppearance.effectiveStyleId || "",
    styleSource: ringAppearance.styleSource || "",
    appearance: ringAppearance.appearance || null,
  });
}

function arcLabelPos(cx, cy, radius, targetY) {
  const dy = targetY - cy;
  const cdy = Math.max(-radius * 0.99, Math.min(radius * 0.99, dy));
  const a = Math.asin(cdy / radius);
  const maxTilt = 0.12;
  return {
    x: cx + Math.cos(a) * radius,
    y: cy + Math.sin(a) * radius,
    rotation: Math.max(-maxTilt, Math.min(maxTilt, a)),
  };
}

/* ── Poster body pre-rendering (procedural celestial textures) ── */

function bodyKey(body) {
  if (isBrownDwarfRenderBody(body)) {
    return `brown-dwarf:${body.id || ""}:${starKey(body.starVisual)}`;
  }
  if (body.type === "gas") {
    return `gas:${body.id || ""}:${body.style || "jupiter"}:${body.rings ? 1 : 0}:${ringAppearanceKey(body.ringAppearance)}`;
  }
  return `rocky:${JSON.stringify(body.visualProfile || {})}:${ringAppearanceKey(body.ringAppearance)}`;
}

function moonKey(m) {
  const mc = m.moonCalc;
  const name = m.name || "";
  if (!mc) return `moon:${name}:default`;
  return `moon:${name}:${mc.display?.displayClass || ""}:${mc.display?.surfaceClass || ""}`;
}

function starKey(star) {
  return [
    "star",
    String(star?.starColourHex || ""),
    Math.round(Number(star?.tempK ?? star?.starTempK) || 5778),
    Math.round(Number(star?.massMsol ?? star?.starMassMsol) * 1000 || 0),
    Math.round(Number(star?.ageGyr ?? star?.starAgeGyr) * 100 || 0),
  ].join(":");
}

async function ensureBodyCanvas(body, shouldContinue = null) {
  if (typeof shouldContinue === "function" && !shouldContinue()) return null;
  const key = bodyKey(body);
  if (POSTER_CACHE.has(key)) return POSTER_CACHE.get(key);
  if (isBrownDwarfRenderBody(body)) {
    const canvas = ensureStarCanvas(body.starVisual);
    POSTER_CACHE.set(key, canvas);
    return canvas;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const model =
    body.type === "gas"
      ? {
          bodyType: "gasGiant",
          styleId: body.style || "jupiter",
          showRings: !!body.rings,
          ringMode: body.ringMode,
          ringStyleId: body.ringAppearance?.ringStyleId,
          ringAppearance: body.ringAppearance,
          gasCalc: body.gasCalc,
        }
      : {
          bodyType: "rocky",
          visualProfile: body.visualProfile,
          ringAppearance: body.ringAppearance,
        };
  const ok = await renderCelestialRecipeSnapshot(canvas, model, { shouldContinue });
  if (!ok || (typeof shouldContinue === "function" && !shouldContinue())) return null;
  POSTER_CACHE.set(key, canvas);
  return canvas;
}

async function ensureMoonCanvas(m, shouldContinue = null) {
  if (typeof shouldContinue === "function" && !shouldContinue()) return null;
  const key = moonKey(m);
  if (POSTER_CACHE.has(key)) return POSTER_CACHE.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ok = await renderCelestialRecipeSnapshot(
    canvas,
    {
      bodyType: "moon",
      name: m.name || "",
      moonCalc: m.moonCalc,
    },
    { shouldContinue },
  );
  if (!ok || (typeof shouldContinue === "function" && !shouldContinue())) return null;
  POSTER_CACHE.set(key, canvas);
  return canvas;
}

function ensureStarCanvas(star) {
  const key = starKey(star);
  if (POSTER_CACHE.has(key)) return POSTER_CACHE.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 384;
  renderStarSnapshot(
    canvas,
    {
      regime: star?.regime,
      starName: star?.starName || star?.name,
      starColourHex: star?.starColourHex,
      starTempK: star?.tempK ?? star?.starTempK,
      starMassMsol: star?.massMsol ?? star?.starMassMsol,
      starAgeGyr: star?.ageGyr ?? star?.starAgeGyr,
    },
    STAR_FILL,
  );
  POSTER_CACHE.set(key, canvas);
  return canvas;
}

export async function drawSystemPosterNative(canvas, data, opts = {}, onReady = null) {
  if (!canvas) return false;
  const run = { cancelled: false };
  ACTIVE_POSTER_RUNS.set(canvas, run);

  /* HTML progress bar - appears instantly, before Three.js loads */
  const wrap = canvas.parentElement;
  let barEl = wrap?.querySelector(".poster-progress");
  if (!barEl && wrap) {
    wrap.style.position = "relative";
    barEl = document.createElement("div");
    barEl.className = "poster-progress";
    barEl.style.cssText =
      "position:absolute;bottom:0;left:0;width:100%;height:2px;z-index:10;pointer-events:none";
    const track = document.createElement("div");
    track.style.cssText =
      "width:0%;height:100%;background:rgba(74,122,175,0.7);transition:width 0.15s ease-out";
    barEl.appendChild(track);
    wrap.appendChild(barEl);
  }
  const barTrack = barEl?.firstChild;
  function setBar(pct) {
    if (barTrack) barTrack.style.width = `${Math.min(100, pct)}%`;
  }
  function removeBar() {
    if (barEl?.parentNode) barEl.parentNode.removeChild(barEl);
  }
  setBar(0);

  const runtime = await ensureRuntime(canvas);
  if (ACTIVE_POSTER_RUNS.get(canvas) !== run || run.cancelled || !canvas.isConnected) {
    removeBar();
    return false;
  }
  if (!runtime) {
    removeBar();
    return false;
  }
  const gen = ++_drawGeneration;
  const isCurrentRun = () =>
    ACTIVE_POSTER_RUNS.get(canvas) === run &&
    !run.cancelled &&
    canvas.isConnected &&
    gen === _drawGeneration;

  const {
    star,
    system,
    planets,
    gasGiants,
    moons,
    debrisDisks,
    topologyKind = "single",
    activeHostFrameLabel = star?.inputs?.name || "Star",
    canvasMode = "single",
    hostStars = [],
    companionStars = [],
  } = data;
  const showLabels = opts.labels !== false;
  const showMoons = opts.moons !== false;
  const showHz = opts.hz !== false;
  const showFrost = opts.frost !== false;
  const showDebris = opts.debris !== false;
  const showGuides = opts.guides !== false;
  const showStarfield = opts.starfield !== false;
  const showMultistarInfo = opts.multistarInfo !== false;
  const scaleMode = opts.scale || "log";
  const pairHostView = canvasMode === "binary-p-type" && hostStars.length > 1;
  const hierarchySummary = buildHierarchyPresentation({
    topologyKind,
    hostFrame: {
      id: null,
      label: activeHostFrameLabel,
      frameKind: pairHostView ? "pair" : "star",
    },
    hostStars,
    companionStars,
    fallbackLocalLabel: activeHostFrameLabel,
  });
  const localStars = hierarchySummary.localStars;
  const outerBranches = hierarchySummary.outerBranches;

  const rect = canvas.parentElement?.getBoundingClientRect?.();
  if (!rect || rect.width < 10 || rect.height < 10) return false;
  const dpr = clampDpr(window.devicePixelRatio || 1);
  const W = rect.width;
  const H = rect.height;
  const posterTuning = getSystemPosterTuning({
    width: W,
    height: H,
    pairHostView,
    localStarsCount: localStars.length,
    outerBranchesCount: outerBranches.length,
  });
  runtime.renderer.setSize(
    Math.max(1, Math.round(W * dpr)),
    Math.max(1, Math.round(H * dpr)),
    false,
  );
  runtime.renderer.setPixelRatio(1);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;

  runtime.camera.left = 0;
  runtime.camera.right = W;
  runtime.camera.top = H;
  runtime.camera.bottom = 0;
  runtime.camera.updateProjectionMatrix();

  cleanupPosterTextures();
  clearGroup(runtime.group);
  if (showStarfield) addStarfield(runtime, W, H, 70, -40);

  const allBodies = [
    ...planets.filter((p) => p.au > 0).map((p) => ({ ...p, type: "planet" })),
    ...gasGiants.filter((g) => g.au > 0).map((g) => ({ ...g, type: "gas" })),
  ].sort((a, b) => a.au - b.au);

  /* Pre-warm body + moon textures via worker (runs parallel with layout) */
  const warmModels = [];
  for (const body of allBodies) {
    if (POSTER_CACHE.has(bodyKey(body))) continue;
    if (isBrownDwarfRenderBody(body)) continue;
    warmModels.push(
      body.type === "gas"
        ? {
            bodyType: "gasGiant",
            styleId: body.style || "jupiter",
            showRings: !!body.rings,
            ringMode: body.ringMode,
            ringStyleId: body.ringAppearance?.ringStyleId,
            ringAppearance: body.ringAppearance,
            gasCalc: body.gasCalc,
          }
        : {
            bodyType: "rocky",
            visualProfile: body.visualProfile,
            ringAppearance: body.ringAppearance,
          },
    );
  }
  for (const m of moons || []) {
    if (!m.parentId || !m.moonCalc || POSTER_CACHE.has(moonKey(m))) continue;
    warmModels.push({ bodyType: "moon", name: m.name || "", moonCalc: m.moonCalc });
  }
  const posterWarmLimit = warmModels.length > 18 ? 18 : warmModels.length;
  const warmPromise = preWarmTextures(warmModels, {
    lod: "low",
    maxItems: posterWarmLimit,
    shouldContinue: isCurrentRun,
  });

  const allAu = [];
  for (const b of allBodies) allAu.push(b.au);
  if (system?.habitableZoneAu)
    allAu.push(system.habitableZoneAu.inner, system.habitableZoneAu.outer);
  if (Number.isFinite(system?.frostLineAu)) allAu.push(system.frostLineAu);
  for (const d of debrisDisks || []) allAu.push(d.innerAu, d.outerAu);
  if (pairHostView) {
    for (const starEntry of hostStars || []) {
      const barycentricOrbitAu = Number(starEntry?.barycentricOrbitAu);
      if (Number.isFinite(barycentricOrbitAu) && barycentricOrbitAu > 0) {
        allAu.push(barycentricOrbitAu);
      }
    }
  }
  const validAu = allAu.filter((n) => Number.isFinite(n) && n > 0);
  if (!validAu.length) {
    const starSize = posterTuning.starSize;
    const starCoreR = starSize * 0.5;
    const starCanvas = ensureStarCanvas(star);
    addCanvasSprite(runtime, starCanvas, 0, H * 0.44, starCoreR / STAR_FILL, -2);
    addTextSprite(
      runtime,
      "Assign planets to orbital slots to populate the poster",
      W * 0.5,
      H * 0.5,
      6,
      {
        font: "italic 12px system-ui, sans-serif",
        color: "rgba(160,170,200,0.5)",
      },
    );
    runtime.renderer.setClearColor(0x050818, 1);
    runtime.renderer.render(runtime.scene, runtime.camera);
    removeBar();
    if (ACTIVE_POSTER_RUNS.get(canvas) === run) ACTIVE_POSTER_RUNS.delete(canvas);
    try {
      onReady?.();
    } catch {}
    return true;
  }

  const orbitY = H * 0.44;
  const starSize = posterTuning.starSize;
  const starCoreR = starSize * 0.5;
  const starSpriteR = (starCoreR / STAR_FILL) * 0.5;
  const bodyLeft = Math.max(
    W * posterTuning.bodyLeftRatio,
    starSpriteR * posterTuning.bodyLeftStarScale,
  );
  const bodyRight = W * 0.96;
  const rangeW = bodyRight - bodyLeft;
  const starEdgeX = starCoreR + 4;
  // Shift orbit-center left of the canvas so distance bands appear as curved arcs.
  const orbitCenterX = -starCoreR * 1.3;
  const bottomLabelY = 14;
  const minAu = Math.min(...validAu);
  const maxAu = Math.max(...validAu);
  const minLog = Math.log10(minAu * 0.7);
  const maxLog = Math.log10(maxAu * 1.3);
  const logRange = maxLog - minLog || 1;
  const linMin = minAu * 0.85;
  const linMax = maxAu * 1.15;
  const sqrtMin = Math.sqrt(linMin);
  const sqrtRange = Math.sqrt(linMax) - sqrtMin || 1;
  const auToX = (au) => {
    if (!(au > 0)) return bodyLeft;
    if (scaleMode === "linear") {
      const t = (Math.sqrt(au) - sqrtMin) / sqrtRange;
      return bodyLeft + t * rangeW;
    }
    const t = (Math.log10(au) - minLog) / logRange;
    return bodyLeft + t * rangeW;
  };

  const starCanvas = ensureStarCanvas(star);
  const zoneLabels = [];
  const renderPairHostCluster = ({
    barycenterX,
    centerY,
    baseRadius,
    zBase = -2,
    title = "",
  } = {}) => {
    if (!pairHostView) return { guideStartX: barycenterX, envelopeRadius: baseRadius };
    const hostRadiusScales = hostStars.map((entry) =>
      Math.max(0.18, Number(entry.radiusRsol) || Number(entry.massMsol) || 1),
    );
    const maxHostRadiusScale = Math.max(...hostRadiusScales, 1);
    const pairStarNodes = hostStars.map((entry, index) => {
      const radiusScale = Math.sqrt(hostRadiusScales[index] / maxHostRadiusScale);
      const visualRadius = Math.max(
        baseRadius * posterTuning.pairVisualMinScale,
        Math.min(
          baseRadius * 0.72,
          baseRadius *
            (posterTuning.pairVisualBaseScale + posterTuning.pairVisualVarianceScale * radiusScale),
        ),
      );
      const mappedOrbitPx = Math.max(
        0,
        auToX(Math.max(0, Number(entry.barycentricOrbitAu) || 0)) - barycenterX,
      );
      let offsetPx = mappedOrbitPx;
      if (!(offsetPx > 0)) offsetPx = 0;
      const direction = index % 2 === 0 ? -1 : 1;
      return {
        ...entry,
        mappedOrbitPx,
        visualRadius,
        x: barycenterX + direction * offsetPx,
      };
    });
    if (pairStarNodes.length >= 2) {
      const left = pairStarNodes[0];
      const right = pairStarNodes[1];
      const gap = Math.abs(right.x - left.x);
      const minGap = left.visualRadius + right.visualRadius + posterTuning.pairGapPaddingPx;
      if (gap < minGap) {
        const extra = (minGap - gap) * 0.5;
        left.x -= extra;
        right.x += extra;
      }
    }
    const envelopeRadius = pairStarNodes.reduce(
      (maxRadius, entry) =>
        Math.max(maxRadius, Math.abs(entry.x - barycenterX) + entry.visualRadius),
      baseRadius,
    );
    const pairOrbitRadiiPx = [
      ...new Set(
        pairStarNodes
          .map((entry) => Number(entry.mappedOrbitPx))
          .filter((radius) => Number.isFinite(radius) && radius > 3)
          .map((radius) => Number(radius.toFixed(3))),
      ),
    ];
    for (const radiusPx of pairOrbitRadiiPx) {
      addArcStroke(
        runtime,
        barycenterX,
        centerY,
        radiusPx,
        -Math.PI * 0.82,
        Math.PI * 0.82,
        0x7284a2,
        0.15,
        zBase + 0.2,
        true,
        5,
        5,
        180,
      );
    }
    addLine(
      runtime,
      barycenterX - Math.max(4, envelopeRadius * 0.12),
      centerY,
      barycenterX + Math.max(4, envelopeRadius * 0.12),
      centerY,
      0x627593,
      0.16,
      zBase + 0.5,
    );
    const barycenterDot = new runtime.THREE.Mesh(
      new runtime.THREE.CircleGeometry(Math.max(0.9, baseRadius * 0.08), 18),
      new runtime.THREE.MeshBasicMaterial({
        color: 0xdbe8ff,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    barycenterDot.position.set(barycenterX, centerY, zBase + 0.8);
    runtime.group.add(barycenterDot);
    if (title) {
      addTextSprite(runtime, title, barycenterX, centerY + baseRadius + 18, 5.4, {
        font: "italic 10px system-ui, sans-serif",
        color: "rgba(192,205,232,0.74)",
      });
    }
    for (const entry of pairStarNodes) {
      const companionCanvas = ensureStarCanvas({
        starColourHex: entry.starColourHex,
        tempK: entry.tempK,
        massMsol: entry.massMsol,
        ageGyr: entry.ageGyr,
      });
      addCanvasSprite(
        runtime,
        companionCanvas,
        entry.x,
        centerY,
        (entry.visualRadius * 2) / STAR_FILL,
        zBase,
        0.98,
      );
    }
    return {
      guideStartX: barycenterX + envelopeRadius,
      envelopeRadius,
    };
  };

  if (showHz && system?.habitableZoneAu) {
    const zoneLabel = getSystemZoneLabel(system);
    const x1 = auToX(system.habitableZoneAu.inner);
    const x2 = auToX(system.habitableZoneAu.outer);
    const r1 = Math.max(1, x1 - orbitCenterX);
    const r2 = Math.max(r1 + 1, x2 - orbitCenterX);
    const [a1Bottom, a1Top] = arcAngles(r1, orbitY, H);
    const [a2Bottom, a2Top] = arcAngles(r2, orbitY, H);
    const aStart = Math.max(a1Bottom, a2Bottom);
    const aEnd = Math.min(a1Top, a2Top);
    if (aEnd > aStart) {
      addArcBand(runtime, orbitCenterX, orbitY, r1, r2, aStart, aEnd, 0x32b450, 0.11, -20, 180);
      addArcStroke(runtime, orbitCenterX, orbitY, r1, aStart, aEnd, 0x64e682, 0.36, -19.8);
      addArcStroke(runtime, orbitCenterX, orbitY, r2, aStart, aEnd, 0x64e682, 0.36, -19.8);
      if (showLabels) {
        const hzMidR = (r1 + r2) / 2;
        const hzLbl = arcLabelPos(orbitCenterX, orbitY, hzMidR, bottomLabelY);
        zoneLabels.push({
          x: hzLbl.x,
          y: hzLbl.y,
          rotation: hzLbl.rotation,
          yOffset: 0,
          text:
            topologyKind !== "single" && activeHostFrameLabel
              ? `${activeHostFrameLabel} ${zoneLabel}`
              : zoneLabel,
          color: "rgba(80,200,100,0.35)",
        });
      }
    }
  }
  if (showFrost && Number.isFinite(system?.frostLineAu) && system.frostLineAu > 0) {
    const fx = auToX(system.frostLineAu);
    const frostR = Math.max(1, fx - orbitCenterX);
    const [fAStart, fAEnd] = arcAngles(frostR, orbitY, H);
    if (fAEnd > fAStart) {
      addArcStroke(
        runtime,
        orbitCenterX,
        orbitY,
        frostR,
        fAStart,
        fAEnd,
        0x78aad8,
        0.34,
        -12,
        true,
        5,
        5,
        260,
      );
    }
    if (showLabels) {
      const fLbl = arcLabelPos(orbitCenterX, orbitY, frostR, bottomLabelY);
      zoneLabels.push({
        x: fLbl.x,
        y: fLbl.y,
        rotation: fLbl.rotation,
        yOffset: 0,
        text:
          topologyKind !== "single" && activeHostFrameLabel
            ? `${activeHostFrameLabel} Frost line`
            : "Frost line",
        color: "rgba(120,170,220,0.35)",
      });
    }
  }

  if (showDebris) {
    const debrisBandRenderOrder = 24;
    const debrisParticleRenderOrder = 26;
    for (const d of debrisDisks || []) {
      const x1 = auToX(d.innerAu);
      const x2 = auToX(d.outerAu);
      if (!(x2 > x1)) continue;
      const r1 = Math.max(1, x1 - orbitCenterX);
      const r2 = Math.max(r1 + 1, x2 - orbitCenterX);
      const [a1Bottom, a1Top] = arcAngles(r1, orbitY, H);
      const [a2Bottom, a2Top] = arcAngles(r2, orbitY, H);
      const aStart = Math.max(a1Bottom, a2Bottom);
      const aEnd = Math.min(a1Top, a2Top);
      if (!(aEnd > aStart)) continue;

      addArcBand(runtime, orbitCenterX, orbitY, r1, r2, aStart, aEnd, 0xa0825a, 0.1, -10, 180, {
        depthTest: false,
        renderOrder: debrisBandRenderOrder,
      });

      // Wobbled asteroid point texture (matches visualizer).
      const texSize = 64;
      const texCanvas = document.createElement("canvas");
      texCanvas.width = texSize;
      texCanvas.height = texSize;
      const tctx = texCanvas.getContext("2d");
      tctx.clearRect(0, 0, texSize, texSize);
      const dc = texSize * 0.5;
      const dr = texSize * 0.42;
      const grad = tctx.createRadialGradient(dc, dc, dr * 0.1, dc, dc, dr);
      grad.addColorStop(0.0, "rgba(255,255,255,1.0)");
      grad.addColorStop(0.35, "rgba(220,210,190,0.85)");
      grad.addColorStop(0.7, "rgba(180,170,150,0.4)");
      grad.addColorStop(1.0, "rgba(120,110,100,0.0)");
      tctx.fillStyle = grad;
      tctx.beginPath();
      for (let vi = 0; vi <= 12; vi++) {
        const va = (vi / 12) * Math.PI * 2;
        const wobble = 0.85 + 0.15 * Math.sin(va * 3.7 + 1.2) * Math.cos(va * 2.3 + 0.8);
        const px = dc + Math.cos(va) * dr * wobble;
        const py = dc + Math.sin(va) * dr * wobble;
        vi === 0 ? tctx.moveTo(px, py) : tctx.lineTo(px, py);
      }
      tctx.closePath();
      tctx.fill();
      const debrisTex = new runtime.THREE.CanvasTexture(texCanvas);
      debrisTex.minFilter = runtime.THREE.LinearFilter;
      debrisTex.magFilter = runtime.THREE.LinearFilter;
      debrisTex.generateMipmaps = false;
      POSTER_TEXTURES.add(debrisTex);

      const dRng = seededRand(Math.round(Number(d.innerAu || 0) * 1000));
      const bandW = r2 - r1;
      const astCount = Math.max(25, Math.round(bandW * 1.2));
      const bucketPositions = [[], [], []];
      const bucketColors = [[], [], []];
      for (let i = 0; i < astCount; i += 1) {
        const t = dRng();
        const t2 = 0.5 + (t - 0.5) * 0.85;
        const rAst = r1 + t2 * (r2 - r1);
        const angle = aStart + dRng() * (aEnd - aStart);
        const ax = orbitCenterX + Math.cos(angle) * rAst;
        const ay = orbitY + Math.sin(angle) * rAst;
        const sizeRoll = dRng();
        const bi = sizeRoll > 0.94 ? 2 : sizeRoll > 0.72 ? 1 : 0;
        const tone = 148 + Math.floor(dRng() * 72);
        const warmth = dRng();
        const cr = Math.min(255, Math.max(0, tone + 8 + warmth * 12)) / 255;
        const cg = Math.min(255, Math.max(0, tone - 10 + warmth * 7)) / 255;
        const cb = Math.min(255, Math.max(0, tone - 30 - warmth * 5)) / 255;
        bucketPositions[bi].push(ax, ay, -9.2 + bi * 0.02);
        bucketColors[bi].push(cr, cg, cb);
      }
      const sizes = [2.0, 3.2, 4.8];
      const opacities = [0.3, 0.42, 0.56];
      for (let bi = 0; bi < 3; bi += 1) {
        if (!bucketPositions[bi].length) continue;
        const geom = new runtime.THREE.BufferGeometry();
        geom.setAttribute(
          "position",
          new runtime.THREE.Float32BufferAttribute(bucketPositions[bi], 3),
        );
        geom.setAttribute("color", new runtime.THREE.Float32BufferAttribute(bucketColors[bi], 3));
        const mat = new runtime.THREE.PointsMaterial({
          size: sizes[bi],
          sizeAttenuation: false,
          vertexColors: true,
          transparent: true,
          opacity: opacities[bi],
          depthWrite: false,
          depthTest: false,
          map: debrisTex,
          alphaTest: 0.01,
        });
        const points = new runtime.THREE.Points(geom, mat);
        points.renderOrder = debrisParticleRenderOrder;
        runtime.group.add(points);
      }

      if (showLabels && d?.name) {
        const dMidR = (r1 + r2) / 2;
        const dLbl = arcLabelPos(orbitCenterX, orbitY, dMidR, bottomLabelY);
        zoneLabels.push({
          x: dLbl.x,
          y: dLbl.y,
          rotation: dLbl.rotation,
          yOffset: 0,
          text: d.name,
          color: "rgba(180,160,120,0.6)",
        });
      }
    }
  }

  /* De-collide zone labels (HZ, frost, debris) and render */
  if (showLabels && zoneLabels.length) {
    zoneLabels.sort((a, b) => a.x - b.x);
    let zDepth = 0;
    for (let i = 1; i < zoneLabels.length; i++) {
      if (zoneLabels[i].x - zoneLabels[i - 1].x < 80) {
        zDepth++;
        zoneLabels[i].yOffset = zDepth * 16;
      } else {
        zDepth = 0;
      }
    }
    for (const zl of zoneLabels) {
      addTextSprite(runtime, zl.text, zl.x, zl.y + zl.yOffset, 6, {
        font: "italic 9px system-ui, sans-serif",
        color: zl.color,
      });
    }
  }

  const pairCluster = pairHostView
    ? renderPairHostCluster({
        barycenterX: Math.max(starCoreR * 0.36, W * 0.09),
        centerY: orbitY,
        baseRadius: starCoreR * posterTuning.pairClusterBaseScale,
        title: `${activeHostFrameLabel} barycenter host`,
      })
    : null;
  const guideStartX = pairHostView
    ? Math.max(starEdgeX, (pairCluster?.guideStartX || starEdgeX) + 6)
    : starEdgeX;
  if (!pairHostView) {
    addCanvasSprite(runtime, starCanvas, 0, orbitY, starCoreR / STAR_FILL, -2);
  }

  if (showMultistarInfo && (localStars.length || outerBranches.length)) {
    const panelW = posterTuning.infoPanelWidth;
    const panelMargin = 14;
    const panelX = Math.min(
      Math.max(panelMargin, W * posterTuning.infoPanelXRatio),
      Math.max(panelMargin, W - panelW - panelMargin),
    );
    const panelLeft = panelX + 14;
    const hasHierarchyInset =
      hierarchySummary.isHierarchical && hierarchySummary.hierarchyNodes.length > 1;
    const hierarchyInsetH = hasHierarchyInset ? 44 : 0;
    const localSectionH = localStars.length
      ? 20 + localStars.length * posterTuning.infoPanelLocalRowHeight
      : 0;
    const outerSectionH = outerBranches.length
      ? 20 + outerBranches.length * posterTuning.infoPanelOuterRowHeight
      : 0;
    const desiredPanelH = Math.max(
      104,
      posterTuning.infoPanelBaseHeight +
        hierarchyInsetH +
        localSectionH +
        outerSectionH +
        (hierarchySummary.notToScale ? 18 : 0),
    );
    const panelTop = H - 14;
    const panelBottom = 14;
    const panelH = Math.min(desiredPanelH, Math.max(1, panelTop - panelBottom));
    const panelY = panelTop - panelH * 0.5;
    const panelCenterX = panelX + panelW * 0.5;
    const headerH = hierarchySummary.isHierarchical ? 62 : 54;
    const borderColor = 0x758db2;
    const panelBaseZ = 20.2;
    const panelSectionZ = 20.24;
    const panelBorderZ = 20.28;
    const panelContentZ = 21.2;
    const panelAccentZ = 21.05;
    const panelContentRenderOrder = 260;
    const panelAccentRenderOrder = 255;
    const titleLines =
      canvasMode === "binary-p-type"
        ? topologyKind === "binary"
          ? ["Binary P-type"]
          : ["Hierarchical pair-host"]
        : topologyKind === "binary"
          ? ["Binary S-type"]
          : ["Hierarchical S-type"];
    const hostFrameLine = truncatePosterText(
      pairHostView ? `${activeHostFrameLabel} barycenter` : `${activeHostFrameLabel} local frame`,
      28,
    );
    const summaryLines = pairHostView
      ? outerBranches.length
        ? ["Local pair climate view.", "Outer branch shown for context."]
        : ["Combined pair light", "drives the local climate."]
      : outerBranches.length
        ? ["Outer branch shown", "for hierarchy context."]
        : ["Companion context", "negligible in this frame."];
    addPanelPlane(
      runtime,
      panelCenterX + 3,
      panelY - 3,
      panelW + 10,
      panelH + 10,
      0x01040b,
      posterTuning.infoPanelShadowOpacity,
      panelBaseZ - 0.15,
      { transparent: true, depthWrite: false, depthTest: false, renderOrder: 180 },
    );
    addPanelPlane(
      runtime,
      panelCenterX,
      panelY,
      panelW,
      panelH,
      0x091321,
      posterTuning.infoPanelOpacity,
      panelBaseZ,
      { depthWrite: true, depthTest: true, renderOrder: 200 },
    );
    addPanelPlane(
      runtime,
      panelCenterX,
      panelTop - headerH * 0.5,
      panelW,
      headerH,
      0x0f1b30,
      posterTuning.infoPanelHeaderOpacity,
      panelSectionZ,
      { depthWrite: true, depthTest: true, renderOrder: 201 },
    );
    addPanelPlane(
      runtime,
      panelCenterX,
      panelTop - headerH,
      panelW,
      1.5,
      borderColor,
      posterTuning.infoPanelBorderOpacity,
      panelBorderZ,
      { transparent: true, depthWrite: false, depthTest: false, renderOrder: 220 },
    );
    addPanelPlane(
      runtime,
      panelCenterX,
      panelY + panelH * 0.5 - 0.75,
      panelW,
      1.5,
      borderColor,
      posterTuning.infoPanelBorderOpacity,
      panelBorderZ,
      { transparent: true, depthWrite: false, depthTest: false, renderOrder: 220 },
    );
    addPanelPlane(
      runtime,
      panelCenterX,
      panelY - panelH * 0.5 + 0.75,
      panelW,
      1.5,
      borderColor,
      posterTuning.infoPanelBorderOpacity,
      panelBorderZ,
      { transparent: true, depthWrite: false, depthTest: false, renderOrder: 220 },
    );
    addPanelPlane(
      runtime,
      panelX + 0.75,
      panelY,
      1.5,
      panelH,
      borderColor,
      posterTuning.infoPanelBorderOpacity,
      panelBorderZ,
      { transparent: true, depthWrite: false, depthTest: false, renderOrder: 220 },
    );
    addPanelPlane(
      runtime,
      panelX + panelW - 0.75,
      panelY,
      1.5,
      panelH,
      borderColor,
      posterTuning.infoPanelBorderOpacity,
      panelBorderZ,
      { transparent: true, depthWrite: false, depthTest: false, renderOrder: 220 },
    );
    let cursorY = panelTop - 16;
    cursorY = addTextLines(runtime, titleLines, panelLeft, cursorY, 12, panelContentZ, {
      font: "11px system-ui, sans-serif",
      color: "rgba(240,246,255,0.95)",
      align: "left",
      depthTest: false,
      renderOrder: panelContentRenderOrder,
    });
    cursorY = addTextLines(runtime, [hostFrameLine], panelLeft, cursorY - 1, 11, panelContentZ, {
      font: "10px system-ui, sans-serif",
      color: "rgba(188,204,228,0.82)",
      align: "left",
      depthTest: false,
      renderOrder: panelContentRenderOrder,
    });
    cursorY = addTextLines(runtime, summaryLines, panelLeft, cursorY - 2, 10, panelContentZ, {
      font: "8px system-ui, sans-serif",
      color: "rgba(176,190,214,0.8)",
      align: "left",
      depthTest: false,
      renderOrder: panelContentRenderOrder,
    });
    cursorY -= 4;

    if (hasHierarchyInset) {
      const insetLeft = panelX + 18;
      const insetRight = panelX + panelW - 18;
      const centerY = cursorY - 8;
      const nodes = hierarchySummary.hierarchyNodes;
      addPanelPlane(
        runtime,
        panelCenterX,
        cursorY - 2,
        panelW - 18,
        38,
        0x0d182b,
        posterTuning.infoPanelSectionOpacity,
        panelSectionZ,
        { depthWrite: true, depthTest: true, renderOrder: 202 },
      );
      addTextSprite(runtime, "Hierarchy inset", insetLeft, cursorY + 8, panelContentZ, {
        font: "9px system-ui, sans-serif",
        color: "rgba(176,190,214,0.76)",
        align: "left",
        depthTest: false,
        renderOrder: panelContentRenderOrder,
      });
      const step = nodes.length > 1 ? (insetRight - insetLeft) / (nodes.length - 1) : 0;
      for (let index = 0; index < nodes.length - 1; index += 1) {
        addLine(
          runtime,
          insetLeft + step * index,
          centerY,
          insetLeft + step * (index + 1),
          centerY,
          0x6b7da0,
          0.34,
          panelAccentZ,
          { depthTest: false, renderOrder: panelAccentRenderOrder },
        );
      }
      nodes.forEach((node, index) => {
        const x =
          nodes.length > 1 ? insetLeft + step * index : insetLeft + (insetRight - insetLeft) * 0.5;
        const tint = node.kind === "local" ? 0x91d6ff : 0xffd69a;
        addFilledCircle(
          runtime,
          x,
          centerY,
          node.kind === "local" ? 5.4 : 4.6,
          tint,
          0.95,
          panelContentZ,
          { depthTest: false, renderOrder: panelContentRenderOrder },
        );
        addTextSprite(
          runtime,
          truncatePosterText(String(node.label || ""), 14),
          x,
          centerY - 14,
          panelContentZ,
          {
            font: "8px system-ui, sans-serif",
            color: "rgba(220,228,244,0.8)",
            depthTest: false,
            renderOrder: panelContentRenderOrder,
          },
        );
      });
      cursorY -= 44;
    }

    if (localStars.length) {
      const localSectionH = 22 + localStars.length * posterTuning.infoPanelLocalRowHeight;
      addPanelPlane(
        runtime,
        panelCenterX,
        cursorY - localSectionH * 0.5 + 4,
        panelW - 16,
        localSectionH,
        0x0d1a2d,
        posterTuning.infoPanelSectionOpacity,
        panelSectionZ,
        { depthWrite: true, depthTest: true, renderOrder: 202 },
      );
      addTextSprite(
        runtime,
        localStars.length > 1 ? "Local host frame" : "Local host star",
        panelLeft,
        cursorY,
        panelContentZ,
        {
          font: "9px system-ui, sans-serif",
          color: "rgba(180,211,255,0.92)",
          align: "left",
          depthTest: false,
          renderOrder: panelContentRenderOrder,
        },
      );
      cursorY -= 16;
      for (let i = 0; i < localStars.length; i += 1) {
        const localStar = localStars[i];
        const rowY = cursorY - i * posterTuning.infoPanelLocalRowHeight;
        const localCanvas = ensureStarCanvas({
          starColourHex: localStar.starColourHex,
          tempK: localStar.tempK,
          massMsol: localStar.massMsol,
          ageGyr: localStar.ageGyr,
        });
        addCanvasSprite(
          runtime,
          localCanvas,
          panelX + 22,
          rowY,
          posterTuning.infoPanelStarVisualSize / STAR_FILL,
          panelAccentZ,
          0.98,
          { depthTest: false, renderOrder: panelAccentRenderOrder },
        );
        addTextSprite(
          runtime,
          truncatePosterText(localStar.name || `Host star ${i + 1}`, 18),
          panelX + 38,
          rowY + 6,
          panelContentZ,
          {
            font: "10px system-ui, sans-serif",
            color: "rgba(232,238,248,0.92)",
            align: "left",
            depthTest: false,
            renderOrder: panelContentRenderOrder,
          },
        );
        addTextSprite(
          runtime,
          Number.isFinite(localStar.barycentricOrbitAu) && localStar.barycentricOrbitAu > 0
            ? `${Number(localStar.barycentricOrbitAu).toFixed(2)} AU from barycenter`
            : "local climate driver",
          panelX + 38,
          rowY - 8,
          panelContentZ,
          {
            font: "8px monospace",
            color: "rgba(176,190,214,0.72)",
            align: "left",
            depthTest: false,
            renderOrder: panelContentRenderOrder,
          },
        );
      }
      cursorY -= localStars.length * posterTuning.infoPanelLocalRowHeight + 4;
    }

    if (outerBranches.length) {
      const outerSectionH = 22 + outerBranches.length * posterTuning.infoPanelOuterRowHeight;
      addPanelPlane(
        runtime,
        panelCenterX,
        cursorY - outerSectionH * 0.5 + 4,
        panelW - 16,
        outerSectionH,
        0x141821,
        posterTuning.infoPanelSectionOpacity,
        panelSectionZ,
        { depthWrite: true, depthTest: true, renderOrder: 202 },
      );
      addTextSprite(
        runtime,
        outerBranches.length > 1 ? "Outer companion branches" : "Outer companion branch",
        panelLeft,
        cursorY,
        panelContentZ,
        {
          font: "9px system-ui, sans-serif",
          color: "rgba(255,214,162,0.92)",
          align: "left",
          depthTest: false,
          renderOrder: panelContentRenderOrder,
        },
      );
      cursorY -= 16;
      for (let i = 0; i < outerBranches.length; i += 1) {
        const branch = outerBranches[i];
        const companion = branch.representativeStar || branch.stars?.[0] || {};
        const rowY = cursorY - i * posterTuning.infoPanelOuterRowHeight;
        const companionCanvas = ensureStarCanvas({
          starColourHex: companion.starColourHex,
          tempK: companion.tempK,
          massMsol: companion.massMsol,
          ageGyr: companion.ageGyr,
        });
        addCanvasSprite(
          runtime,
          companionCanvas,
          panelX + 22,
          rowY,
          posterTuning.infoPanelStarVisualSize / STAR_FILL,
          panelAccentZ,
          0.98,
          { depthTest: false, renderOrder: panelAccentRenderOrder },
        );
        addTextSprite(
          runtime,
          truncatePosterText(branch.label || `Companion ${i + 1}`, 18),
          panelX + 38,
          rowY + 6,
          panelContentZ,
          {
            font: "10px system-ui, sans-serif",
            color: "rgba(232,238,248,0.92)",
            align: "left",
            depthTest: false,
            renderOrder: panelContentRenderOrder,
          },
        );
        const detailText = Number.isFinite(Number(branch.separationAu))
          ? `${Number(branch.separationAu).toFixed(1)} AU${branch.hierarchyLevel > 1 ? " outer" : ""} sep.`
          : "outer branch";
        addTextSprite(runtime, detailText, panelX + 38, rowY - 8, panelContentZ, {
          font: "8px monospace",
          color: "rgba(176,190,214,0.72)",
          align: "left",
          depthTest: false,
          renderOrder: panelContentRenderOrder,
        });
      }
      cursorY -= outerBranches.length * 38 + 2;
    }

    if (hierarchySummary.notToScale) {
      addTextSprite(runtime, "Not to scale", panelLeft, panelBottom + 10, panelContentZ, {
        font: "italic 8px system-ui, sans-serif",
        color: "rgba(150,166,190,0.78)",
        align: "left",
        depthTest: false,
        renderOrder: panelContentRenderOrder,
      });
    }
  }

  if (showGuides) {
    for (const body of allBodies) {
      const x = auToX(body.au);
      addLine(runtime, guideStartX, orbitY, x, orbitY, 0x8695b3, 0.11, -3);
    }
  }

  /* AU distance ruler + "not to scale" dashed line — sqrt/linear mode */
  if (scaleMode === "linear" && showLabels) {
    const rulerY = orbitY - 18;
    const span = linMax - linMin;
    const raw = span / 6;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const nice =
      raw / mag < 1.5 ? mag : raw / mag < 3.5 ? mag * 2 : raw / mag < 7.5 ? mag * 5 : mag * 10;
    const first = Math.ceil(linMin / nice) * nice;
    for (let au = first; au <= linMax; au += nice) {
      const x = auToX(au);
      if (x < bodyLeft + 10 || x > bodyRight - 10) continue;
      addLine(runtime, x, rulerY + 4, x, rulerY - 4, 0x8695b3, 0.25, 4);
      addTextSprite(runtime, `${+au.toFixed(2)} AU`, x, rulerY - 10, 5, {
        font: "7px monospace",
        color: "rgba(130,145,180,0.4)",
      });
    }

    /* Dashed "not to scale" bracket under the compressed inner section */
    const sortedAu = allBodies.map((b) => b.au).sort((a, b) => a - b);
    let biggestGap = 0;
    let clusterEndAu = sortedAu[sortedAu.length - 1];
    for (let i = 1; i < sortedAu.length; i++) {
      const gap = sortedAu[i] / sortedAu[i - 1];
      if (gap > biggestGap) {
        biggestGap = gap;
        clusterEndAu = (sortedAu[i - 1] + sortedAu[i]) / 2;
      }
    }
    if (biggestGap > 2) {
      const dashX1 = bodyLeft;
      const dashX2 = auToX(clusterEndAu);
      const dashY = bottomLabelY + 40;
      const dashLen = 6;
      const gapLen = 4;
      let dx = dashX1;
      while (dx + dashLen <= dashX2) {
        addLine(runtime, dx, dashY, dx + dashLen, dashY, 0x8695b3, 0.22, 4);
        dx += dashLen + gapLen;
      }
      addTextSprite(runtime, "Not to scale", (dashX1 + dashX2) / 2, dashY + 8, 5, {
        font: "italic 7px system-ui, sans-serif",
        color: "rgba(130,145,180,0.4)",
      });
    }
  }

  /* Compute label offsets — also drives body stagger in crowded layouts */
  const labelEntries = [];
  for (const body of allBodies) {
    labelEntries.push({
      x: auToX(body.au),
      name: body.name || "Body",
      auLabel: `${Number(body.au).toFixed(2)} AU`,
      pxR: bodyPxR(body.radiusKm),
    });
  }
  const plannedLabelEntries = planSystemPosterLabels(labelEntries, {
    denseLabelThresholdPx: posterTuning.denseLabelThresholdPx,
    compactLabelClusterSize: posterTuning.compactLabelClusterSize,
    staggerStepPx: posterTuning.staggerStepPx,
  });
  if (showLabels) {
    for (const lbl of plannedLabelEntries) {
      if (lbl.labelMode === "rotated" || lbl.labelMode === "compact") {
        const labelStr = lbl.labelMode === "compact" ? lbl.name : `${lbl.name}  ${lbl.auLabel}`;
        const rot = Math.PI / 4;
        const labelOpts = {
          font:
            lbl.labelMode === "compact"
              ? posterTuning.compactLabelFont
              : "9px system-ui, sans-serif",
          color: lbl.labelMode === "compact" ? "rgba(208,214,232,0.82)" : "rgba(220,225,240,0.9)",
        };
        const ltex = getTextTexture(runtime, labelStr, labelOpts);
        const lw = Math.max(1, Number(ltex?.image?.width) || 32);
        const c = Math.cos(rot);
        const s = Math.sin(rot);
        addRotatedText(
          runtime,
          labelStr,
          lbl.x - (c * lw) / 2,
          H - 6 - (s * lw) / 2,
          6,
          rot,
          labelOpts,
        );
      } else {
        addTextSprite(runtime, lbl.auLabel, lbl.x, H - 6, 6, {
          font: "9px monospace",
          color: "rgba(160,170,200,0.78)",
        });
        addTextSprite(runtime, lbl.name, lbl.x, H - 18, 6, {
          font: "11px system-ui, sans-serif",
          color: "rgba(220,225,240,0.9)",
        });
      }
    }
  }

  const totalItems =
    allBodies.length + (showMoons ? (moons || []).filter((m) => m.parentId).length : 0);
  let doneItems = 0;

  /* Initial render — structural elements visible immediately */
  runtime.renderer.setClearColor(0x050818, 1);

  if (!allBodies.length) {
    addTextSprite(
      runtime,
      "Assign planets to orbital slots to populate the poster",
      W * 0.5,
      H * 0.5,
      6,
      {
        font: "italic 12px system-ui, sans-serif",
        color: "rgba(160,170,200,0.5)",
      },
    );
  }

  runtime.renderer.render(runtime.scene, runtime.camera);

  /* Ensure pre-warmed textures are cached before the sequential loop */
  await warmPromise;
  if (!isCurrentRun()) {
    removeBar();
    if (ACTIVE_POSTER_RUNS.get(canvas) === run) ACTIVE_POSTER_RUNS.delete(canvas);
    return false;
  }

  /* Progressive body + moon rendering */
  const moonsByParent = new Map();
  for (const m of moons || []) {
    if (!m.parentId) continue;
    if (!moonsByParent.has(m.parentId)) moonsByParent.set(m.parentId, []);
    moonsByParent.get(m.parentId).push(m);
  }

  for (let i = 0; i < allBodies.length; i++) {
    const body = allBodies[i];
    if (gen !== _drawGeneration) return true;
    const x = auToX(body.au);
    const bodyStagger = (plannedLabelEntries[i]?.yOffset || 0) * 1.8;
    const y = orbitY + bodyStagger;
    const bodyCanvas = await ensureBodyCanvas(body, isCurrentRun);
    if (!bodyCanvas || !isCurrentRun()) {
      removeBar();
      if (ACTIVE_POSTER_RUNS.get(canvas) === run) ACTIVE_POSTER_RUNS.delete(canvas);
      return false;
    }
    // Scale sprite up for ringed planets so the full ring system is visible.
    // doRecipeSnapshot stores cameraScale = cameraZ / 3.5 on the canvas.
    const cameraScale = parseFloat(bodyCanvas.dataset.cameraScale || "1");
    const size = isBrownDwarfRenderBody(body)
      ? Math.max(10, bodyPxR(body.radiusKm) / STAR_FILL)
      : bodyPxR(body.radiusKm) * 2.1 * cameraScale;
    addCanvasSprite(runtime, bodyCanvas, x, y, size, 1, 1);
    doneItems++;
    setBar((doneItems / totalItems) * 100);
    if (showMoons) {
      const set = moonsByParent.get(body.id) || [];
      const baseSize = bodyPxR(body.radiusKm) * 2.1;
      const mSize = Math.max(4, Math.min(14, baseSize * 0.22));
      const rowH = Math.max(mSize + 6, 14);
      // Start moons just above the planet body (rings extend horizontally,
      // so vertical clearance only needs the body radius).
      let moonY = y + baseSize * 0.52 + 8;
      for (const m of set) {
        if (gen !== _drawGeneration) return true;
        const mCanvas = await ensureMoonCanvas(m, isCurrentRun);
        if (!mCanvas || !isCurrentRun()) {
          removeBar();
          if (ACTIVE_POSTER_RUNS.get(canvas) === run) ACTIVE_POSTER_RUNS.delete(canvas);
          return false;
        }
        addCanvasSprite(runtime, mCanvas, x + 6, moonY, mSize, 2.5, 0.95, {
          depthTest: false,
          renderOrder: 40,
        });
        if (showLabels && m?.name) {
          addTextSprite(runtime, m.name, x + 6 + mSize * 0.5 + 4, moonY, 3.5, {
            font: "8px system-ui, sans-serif",
            color: "rgba(180,185,210,0.72)",
            align: "left",
            depthTest: false,
            renderOrder: 41,
          });
        }
        moonY += rowH;
        doneItems++;
        setBar((doneItems / totalItems) * 100);
      }
    }
    runtime.renderer.render(runtime.scene, runtime.camera);
  }

  removeBar();
  if (ACTIVE_POSTER_RUNS.get(canvas) === run) ACTIVE_POSTER_RUNS.delete(canvas);

  try {
    onReady?.();
  } catch {}
  return true;
}

export function disposeSystemPosterNative(canvas) {
  if (!canvas) return;
  const run = ACTIVE_POSTER_RUNS.get(canvas);
  if (run) {
    run.cancelled = true;
    ACTIVE_POSTER_RUNS.delete(canvas);
  }
  _drawGeneration += 1;
  const runtime = RUNTIME.get(canvas);
  if (!runtime) return;
  try {
    clearGroup(runtime.group);
  } catch {}
  cleanupPosterTextures();
  try {
    runtime.renderer?.dispose?.();
  } catch {}
  RUNTIME.delete(canvas);
  PENDING.delete(canvas);
}
