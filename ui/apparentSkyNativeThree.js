import { loadThreeCore } from "./threeBridge2d.js";
import { renderCelestialRecipeSnapshot, renderStarSnapshot } from "./celestialVisualPreview.js";
import { computeMoonVisualProfile } from "./moonStyles.js";
import { computeRockyVisualProfile } from "./rockyPlanetStyles.js";
import {
  computeBinaryPairOrbitalState,
  findBestBinaryPairStartTimeDays,
} from "./visualizer/multistarOrbit.js";
import { solveKeplerEquation } from "./visualizer/projectionMath.js";
import { clamp } from "../engine/utils.js";

const RUNTIME = new WeakMap();
const PENDING = new WeakMap();
const SNAP_CACHE = new Map();
const TEXT_TEXTURES = new Map();
let warned = false;
let _drawGen = 0;

/* ── star snapshot fill fraction (matches system poster) ────── */
const STAR_FILL = 0.22;

function isBrownDwarfBodyEntry(entry) {
  return entry?.renderModel === "brownDwarfStar" && !!entry?.starVisual;
}

function isGasLikeBodyEntry(entry) {
  if (entry?.renderFamily === "volatile" || entry?.kind === "gas") return true;
  return String(entry?.classLabel || "")
    .toLowerCase()
    .includes("gas");
}

function clampDpr(dpr) {
  const n = Number(dpr);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.max(1, Math.min(3, n));
}

function hexToNumber(hex) {
  const h = String(hex || "")
    .replace("#", "")
    .trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return 0xffffff;
  return Number.parseInt(h, 16);
}

function stopSkyAnimation(runtime) {
  if (!runtime) return;
  const frameId = Number(runtime.animationFrameId || 0);
  if (frameId > 0) {
    try {
      cancelAnimationFrame(frameId);
    } catch {}
  }
  runtime.animationFrameId = 0;
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
      const camera = new THREE.OrthographicCamera(0, 100, 100, 0, -2000, 2000);
      camera.position.set(0, 0, 40);
      camera.lookAt(0, 0, 0);
      const group = new THREE.Group();
      scene.add(group);
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 0.75);
      key.position.set(-3, 1.8, 2.5);
      scene.add(key);
      const rt = { THREE, renderer, scene, camera, group, animationFrameId: 0 };
      renderer.render(scene, camera);
      RUNTIME.set(canvas, rt);
      PENDING.delete(canvas);
      return rt;
    })
    .catch((err) => {
      PENDING.delete(canvas);
      if (!warned) {
        warned = true;
        console.warn("[WorldSmith] Native apparent-sky renderer unavailable.", err);
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

/* ── Snapshot canvas helpers (mirror systemPosterNativeThree.js) ── */

export function buildApparentMoonSnapKey(moonCalc, moonName = "") {
  const name = String(moonName || moonCalc?.inputs?.name || moonCalc?.id || "");
  if (!moonCalc) return `moon:${name}:default`;
  const profile = computeMoonVisualProfile(moonCalc);
  return `moon:${name}:${JSON.stringify(profile || {})}`;
}

function snapKey(obj) {
  if (obj.type === "moon") {
    const mc = obj.entry.moonCalc;
    return buildApparentMoonSnapKey(mc, obj.entry?.name || "");
  }
  const b = obj.entry;
  if (isBrownDwarfBodyEntry(b)) {
    return [
      "brown-dwarf",
      b.id || "",
      String(b.starVisual?.starColourHex || ""),
      Math.round(Number(b.starVisual?.starTempK) || 0),
      Math.round(Number(b.starVisual?.starMassMsol) * 1000 || 0),
      Math.round(Number(b.starVisual?.starAgeGyr) * 100 || 0),
    ].join(":");
  }
  if (isGasLikeBodyEntry(b)) {
    return `gas:${b._styleId || "jupiter"}:${b._visualOverrideSignature || ""}:${b._visualRenderSignature || ""}:${JSON.stringify(b._gasProfile || {})}`;
  }
  const vp = JSON.stringify(
    b._visualProfile ||
      (b._derived ? computeRockyVisualProfile(b._derived, b._planetInputs || {}) : null) ||
      {},
  );
  return `rocky:${b.id || ""}:${vp}`;
}

async function ensureBodySnap(obj) {
  const key = snapKey(obj);
  if (SNAP_CACHE.has(key)) return SNAP_CACHE.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const b = obj.entry;
  let model;
  if (obj.type === "moon") {
    model = { bodyType: "moon", moonCalc: b.moonCalc };
  } else if (isBrownDwarfBodyEntry(b)) {
    const starCanvas = ensureStarSnap(b.starVisual?.starColourHex, b.starVisual);
    SNAP_CACHE.set(key, starCanvas);
    return starCanvas;
  } else if (isGasLikeBodyEntry(b)) {
    model = {
      bodyType: "gasGiant",
      styleId: b._styleId || "jupiter",
      gasProfile: b._gasProfile || null,
      visualDescriptor: b._visualDescriptor || null,
      visualOverrideSignature: b._visualOverrideSignature || "",
      visualRenderSignature: b._visualRenderSignature || "",
    };
  } else {
    model = {
      bodyType: "rocky",
      visualProfile:
        b._visualProfile || computeRockyVisualProfile(b._derived || {}, b._planetInputs || {}),
      visualDescriptor: b._visualDescriptor || null,
      visualOverrideSignature: b._visualOverrideSignature || "",
      visualRenderSignature: b._visualRenderSignature || "",
    };
  }
  await renderCelestialRecipeSnapshot(canvas, model);
  SNAP_CACHE.set(key, canvas);
  return canvas;
}

function ensureStarSnap(starColourHex, starData) {
  const key = [
    "star",
    starColourHex || "",
    Math.round(Number(starData?.starTempK) || 5778),
    Math.round(Number(starData?.starMassMsol) * 1000 || 0),
    Math.round(Number(starData?.starAgeGyr) * 100 || 0),
  ].join(":");
  if (SNAP_CACHE.has(key)) return SNAP_CACHE.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 384;
  renderStarSnapshot(
    canvas,
    {
      starColourHex,
      starTempK: starData?.starTempK,
      starMassMsol: starData?.starMassMsol,
      starAgeGyr: starData?.starAgeGyr,
    },
    STAR_FILL,
  );
  SNAP_CACHE.set(key, canvas);
  return canvas;
}

/* ── Three.js sprite helpers ─────────────────────────────────── */

function addGlow(runtime, x, y, radius, z = 1, color = "#ffffff", opacity = 0.45) {
  const glowSize = 64;
  const c = document.createElement("canvas");
  c.width = glowSize;
  c.height = glowSize;
  const ctx = c.getContext("2d");
  const cx = glowSize / 2;
  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0, color);
  grad.addColorStop(0.12, color);
  grad.addColorStop(0.4, "rgba(255,255,255,0.08)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, glowSize, glowSize);
  const t = new runtime.THREE.CanvasTexture(c);
  t.minFilter = runtime.THREE.LinearFilter;
  t.magFilter = runtime.THREE.LinearFilter;
  t.generateMipmaps = false;
  const mat = new runtime.THREE.SpriteMaterial({
    map: t,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: runtime.THREE.AdditiveBlending,
  });
  const s = new runtime.THREE.Sprite(mat);
  s.position.set(x, y, z);
  const spread = Math.max(6, radius * 3);
  s.scale.set(spread, spread, 1);
  runtime.group.add(s);
  return s;
}

function makePhaseShadow(phaseDeg) {
  const sz = 128;
  const c = document.createElement("canvas");
  c.width = sz;
  c.height = sz;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  const r = sz / 2;
  const phase = ((phaseDeg % 360) + 360) % 360;
  const frac = phase / 180;
  const illum = phase <= 180 ? 1 - frac : frac - 1;
  const tScale = Math.abs(illum) * 2 - 1;
  const litOnRight = phase <= 180;
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.beginPath();
  if (litOnRight) {
    ctx.arc(r, r, r, Math.PI / 2, -Math.PI / 2, false);
    ctx.ellipse(r, r, Math.abs(tScale) * r, r, 0, -Math.PI / 2, Math.PI / 2, tScale > 0);
  } else {
    ctx.arc(r, r, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(r, r, Math.abs(tScale) * r, r, 0, Math.PI / 2, -Math.PI / 2, tScale > 0);
  }
  ctx.closePath();
  ctx.fill();
  return c;
}

function addCanvasSprite(runtime, srcCanvas, x, y, size, z = 0, opacity = 1) {
  if (!srcCanvas) return null;
  const t = new runtime.THREE.CanvasTexture(srcCanvas);
  t.minFilter = runtime.THREE.LinearFilter;
  t.magFilter = runtime.THREE.LinearFilter;
  t.generateMipmaps = false;
  if (runtime.THREE.SRGBColorSpace) t.colorSpace = runtime.THREE.SRGBColorSpace;
  const mat = new runtime.THREE.SpriteMaterial({
    map: t,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const s = new runtime.THREE.Sprite(mat);
  s.position.set(x, y, z);
  s.scale.set(size, size, 1);
  runtime.group.add(s);
  return s;
}

function getTextTexture(runtime, text, opts = {}) {
  const value = String(text ?? "");
  if (!value) return null;
  const font = String(opts.font || "11px system-ui, sans-serif");
  const color = String(opts.color || "#c8cbe8");
  const shadow = String(opts.shadow || "rgba(0,0,0,0.6)");
  const key = `${font}|${color}|${shadow}|${value}`;
  if (TEXT_TEXTURES.has(key)) return TEXT_TEXTURES.get(key);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.font = font;
  const fontMatch = /([0-9]+(?:\.[0-9]+)?)px/.exec(font);
  const fontPx = fontMatch ? Number(fontMatch[1]) : 12;
  const pad = 10;
  const w = Math.max(1, Math.ceil(ctx.measureText(value).width + pad));
  const h = Math.max(1, Math.ceil(fontPx + pad));
  c.width = w;
  c.height = h;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillText(value, w / 2, h / 2 + 0.5);
  const tex = new runtime.THREE.CanvasTexture(c);
  tex.minFilter = runtime.THREE.LinearFilter;
  tex.magFilter = runtime.THREE.LinearFilter;
  tex.generateMipmaps = false;
  if (runtime.THREE.SRGBColorSpace) tex.colorSpace = runtime.THREE.SRGBColorSpace;
  TEXT_TEXTURES.set(key, tex);
  return tex;
}

function addText(runtime, text, x, y, z = 6, opts = {}) {
  const tex = getTextTexture(runtime, text, opts);
  if (!tex) return null;
  const img = tex.image;
  const mat = new runtime.THREE.SpriteMaterial({
    map: tex,
    color: 0xffffff,
    transparent: true,
    opacity: Number.isFinite(opts.opacity) ? opts.opacity : 1,
    depthWrite: false,
  });
  const s = new runtime.THREE.Sprite(mat);
  s.position.set(x, y, z);
  s.scale.set(Math.max(1, Number(img?.width) || 16), Math.max(1, Number(img?.height) || 10), 1);
  runtime.group.add(s);
  return s;
}

/* ── Dotted reference ring (mimics old Canvas2D style) ──────── */

function addDottedRing(runtime, x, y, r, label, isNight, onBright = false, labelDy = 0) {
  // Draw dotted circle as a thin torus of small segments
  const segments = 80;
  const dashRatio = 0.5;
  const inner = Math.max(1, r - 0.6);
  const outer = r + 0.6;
  for (let i = 0; i < segments; i++) {
    if (i % 2 !== 0) continue; // skip every other = dashes
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + dashRatio) / segments) * Math.PI * 2;
    const geo = new runtime.THREE.RingGeometry(inner, outer, 4, 1, a0, a1 - a0);
    let ringColor, ringOpacity;
    if (onBright) {
      ringColor = 0x000000;
      ringOpacity = 0.45;
    } else {
      ringColor = isNight ? 0xa0b4dc : 0x283c64;
      ringOpacity = 0.4;
    }
    const mat = new runtime.THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: ringOpacity,
      side: runtime.THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new runtime.THREE.Mesh(geo, mat);
    mesh.position.set(x, y, -1.5);
    runtime.group.add(mesh);
  }
  // Italic label below the ring
  const lx = x + r + 4;
  const ly = y - r - 8 + labelDy;
  const labelColor = isNight ? "rgba(180,195,230,0.7)" : "rgba(255,255,255,0.85)";
  const shadow = "rgba(0,0,0,0.7)";
  addText(runtime, label, lx, ly, 5.2, {
    font: "italic 9px system-ui, sans-serif",
    color: labelColor,
    shadow,
  });
}

/* ── Log-scale sizing for small objects ──────────────────────── */

const _MIN_PX = 2;
const _BOOST_THRESH = 10;

function logScaleSize(arcsec, scale, maxArcsec) {
  const trueSize = arcsec * scale;
  if (trueSize >= _BOOST_THRESH) return trueSize;
  if (trueSize >= _MIN_PX) {
    const t = (trueSize - _MIN_PX) / (_BOOST_THRESH - _MIN_PX);
    const boosted =
      _MIN_PX + ((_BOOST_THRESH - _MIN_PX) * Math.log1p(trueSize)) / Math.log1p(_BOOST_THRESH);
    return boosted + t * (trueSize - boosted);
  }
  const ma = Math.max(maxArcsec, 1);
  return _MIN_PX + ((_BOOST_THRESH - _MIN_PX) * Math.log1p(arcsec)) / Math.log1p(ma);
}

function identityMapAuToPx(au) {
  return Number(au) || 0;
}

function orbitOffsetIdentity(ox, oz, cx, cy, oy = 0) {
  return {
    x: cx + Number(ox || 0),
    y: cy - Number(oy || 0),
    depth: Number(oz || 0),
  };
}

function canAnimatePrimaryPair(pairHostStars) {
  return (
    Array.isArray(pairHostStars) &&
    pairHostStars.length === 2 &&
    pairHostStars.every(
      (entry) =>
        Number.isFinite(Number(entry?.homeOrbitAu)) &&
        Number(entry.homeOrbitAu) > 0 &&
        Number.isFinite(Number(entry?.pairSemiMajorAxisAu)) &&
        Number(entry.pairSemiMajorAxisAu) > 0 &&
        Number.isFinite(Number(entry?.barycentricOrbitAu)),
    )
  );
}

/* ── Main draw ───────────────────────────────────────────────── */

export function disposeSkyCanvasNative(canvas) {
  const rt = RUNTIME.get(canvas);
  if (!rt) return;
  stopSkyAnimation(rt);
  clearGroup(rt.group);
  rt.renderer.dispose();
  RUNTIME.delete(canvas);
}

export async function drawSkyCanvasNative(
  canvas,
  model,
  starColourHex,
  skyMode,
  moonPhaseDeg,
  skyColours,
  starData = {},
  extraStars = [],
  options = {},
  onReady = null,
) {
  const gen = ++_drawGen;
  const runtime = await ensureRuntime(canvas);
  if (!runtime) return false;
  if (gen !== _drawGen) return false;
  stopSkyAnimation(runtime);
  const { animatePrimaryPair = false } = options || {};

  const parent = canvas.parentElement;
  const rect = parent?.getBoundingClientRect?.();
  if (!rect || rect.width < 10 || rect.height < 10) return false;
  const dpr = clampDpr(window.devicePixelRatio || 1);
  const W = rect.width;
  const H = rect.height;
  runtime.renderer.setSize(
    Math.max(1, Math.round(W * dpr)),
    Math.max(1, Math.round(H * dpr)),
    false,
  );
  runtime.renderer.setPixelRatio(1);
  runtime.camera.left = 0;
  runtime.camera.right = W;
  runtime.camera.top = H;
  runtime.camera.bottom = 0;
  runtime.camera.updateProjectionMatrix();
  clearGroup(runtime.group);

  const isNight = skyMode !== "day";
  runtime.renderer.setClearColor(0x000000, 1);

  // Sky gradient background (zenith at top → horizon at bottom)
  {
    const topHex = isNight ? 0x050816 : hexToNumber(skyColours?.dayHex || "#4a90d9");
    const botHex = isNight ? 0x0c1228 : hexToNumber(skyColours?.horizonHex || "#87ceeb");
    const geo = new runtime.THREE.PlaneGeometry(W, H, 1, 1);
    const topColor = new runtime.THREE.Color(topHex);
    const botColor = new runtime.THREE.Color(botHex);
    const colors = new Float32Array([
      // PlaneGeometry vertex order: top-left, top-right, bottom-left, bottom-right
      topColor.r,
      topColor.g,
      topColor.b,
      topColor.r,
      topColor.g,
      topColor.b,
      botColor.r,
      botColor.g,
      botColor.b,
      botColor.r,
      botColor.g,
      botColor.b,
    ]);
    geo.setAttribute("color", new runtime.THREE.BufferAttribute(colors, 3));
    const mat = new runtime.THREE.MeshBasicMaterial({
      vertexColors: true,
      depthWrite: false,
    });
    const mesh = new runtime.THREE.Mesh(geo, mat);
    mesh.position.set(W / 2, H / 2, -100);
    runtime.group.add(mesh);
  }

  // Star-field dots (night only)
  if (isNight) {
    const count = 52;
    const pos = new Float32Array(count * 3);
    let s = 42;
    for (let i = 0; i < count; i++) {
      s = (s * 1664525 + 1013904223) | 0;
      const rx = ((s >>> 0) % 10000) / 10000;
      s = (s * 1664525 + 1013904223) | 0;
      const ry = ((s >>> 0) % 10000) / 10000;
      pos[i * 3] = rx * W;
      pos[i * 3 + 1] = ry * H;
      pos[i * 3 + 2] = -12;
    }
    const geom = new runtime.THREE.BufferGeometry();
    geom.setAttribute("position", new runtime.THREE.BufferAttribute(pos, 3));
    const mat = new runtime.THREE.PointsMaterial({
      color: 0xd9e4ff,
      size: 1.1,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    runtime.group.add(new runtime.THREE.Points(geom, mat));
  }

  const homeStar = model.starByOrbit[0];
  const starArcsec = homeStar?.angularDiameterArcsec || 0;
  const visibleExtraStars = (extraStars || []).filter(
    (entry) => Number.isFinite(entry?.angularDiameterArcsec) && entry.angularDiameterArcsec > 0,
  );
  const pairHostStars = visibleExtraStars.filter((entry) => entry?.skyRole === "pair-host");
  const companionStars = visibleExtraStars.filter((entry) => entry?.skyRole !== "pair-host");
  const livePrimaryPair = canAnimatePrimaryPair(pairHostStars);
  const primaryStarArcsec = pairHostStars.length
    ? Math.max(...pairHostStars.map((entry) => Number(entry.angularDiameterArcsec) || 0), 0)
    : starArcsec;
  const moons = model.moons.filter(
    (m) => Number.isFinite(m.angularDiameterArcsec) && m.angularDiameterArcsec > 0,
  );
  const bodies = model.bodiesFromHome.filter(
    (b) => Number.isFinite(b.angularDiameterArcsec) && b.angularDiameterArcsec > 0,
  );
  const solSun = 1896;
  const solMoon = 1866;
  const solJupiter = 50;
  const maxMoon = moons.reduce((m, o) => Math.max(m, o.angularDiameterArcsec), 0);
  const maxBody = bodies.reduce((m, o) => Math.max(m, o.angularDiameterArcsec), 0);
  const maxNonStar = Math.max(maxMoon, maxBody);
  const split = primaryStarArcsec > 0 && maxNonStar > 0 && primaryStarArcsec > 10 * maxNonStar;
  const maxDiskR = H * 0.26;
  let starScale = 0;
  let rightScale = 0;
  let starX = W * 0.16;
  let rightStart = W * 0.35;
  if (split) {
    const starRegion = pairHostStars.length ? W * 0.38 : W * 0.3;
    starScale = Math.min(
      maxDiskR / Math.max(primaryStarArcsec / 2, 1),
      (starRegion * 0.8) / Math.max(primaryStarArcsec, 1),
    );
    const ref = Math.max(maxNonStar, solSun, solMoon);
    rightScale = maxDiskR / (ref / 2);
    if (pairHostStars.length) rightStart = W * 0.46;
  } else if (primaryStarArcsec > 0) {
    const maxAll = Math.max(primaryStarArcsec, maxNonStar, solSun, solMoon);
    const slots = Math.max(2 + (pairHostStars.length ? 1 : 0), 1 + moons.length + bodies.length);
    const slotSpacing = W / (slots + 1);
    starScale = Math.min(maxDiskR / (maxAll / 2), (slotSpacing * 0.8) / maxAll);
    rightScale = starScale;
    starX = slotSpacing;
    rightStart = slotSpacing * (pairHostStars.length ? 3 : 2);
  } else {
    const ref = Math.max(1, maxNonStar);
    rightScale = maxDiskR / (ref / 2);
    rightStart = W * 0.12;
  }

  // Layout: disks in upper half, labels at bottom
  const diskCy = H * 0.55;
  const labelY = 17; // object name (y=0 is bottom in ortho camera)
  const sizeY = 4; // arcsec value

  // Label colours: match old style
  const labelCol = isNight ? "#c8cbe8" : "#ffffff";
  const subCol = isNight ? "#8088aa" : "rgba(255,255,255,0.7)";
  const shadowCol = isNight ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.7)";
  let startLivePrimaryPairAnimation = null;

  /* ── Star ────────────────────────────────────────────────── */
  if (pairHostStars.length && starScale > 0) {
    const pairAreaLeft = split ? W * 0.08 : Math.max(32, starX - 16);
    const pairAreaRight = Math.max(pairAreaLeft + 90, rightStart - 20);
    const pairSpacing = (pairAreaRight - pairAreaLeft) / Math.max(1, pairHostStars.length);
    const pairScale = split ? starScale : Math.max(starScale * 0.85, rightScale * 0.9);
    const pairCenterX = (pairAreaLeft + pairAreaRight) * 0.5;
    const livePairLaneHalfWidth = Math.max(30, (pairAreaRight - pairAreaLeft) * 0.3);
    const livePairLaneHalfHeight = Math.max(20, Math.min(H * 0.12, livePairLaneHalfWidth * 0.72));
    const livePairHomeOrbitAu = Math.max(0.0001, Number(pairHostStars[0]?.homeOrbitAu) || 1);
    const livePairConfig = {
      semiMajorAxisAu: Math.max(
        0.0001,
        Number(pairHostStars[0]?.pairSemiMajorAxisAu || pairHostStars[0]?.pairSeparationAu) || 0.1,
      ),
      eccentricity: Number(pairHostStars[0]?.eccentricity) || 0,
      inclinationDeg: Number(pairHostStars[0]?.inclinationDeg) || 0,
      argPeriapsisDeg: Number(pairHostStars[0]?.argPeriapsisDeg) || 0,
      meanAnomalyDeg: Number(pairHostStars[0]?.meanAnomalyDeg) || 0,
    };
    addText(runtime, "Primary suns", (pairAreaLeft + pairAreaRight) * 0.5, H * 0.22 + 64, 7.2, {
      font: "11px system-ui, sans-serif",
      color: labelCol,
      shadow: shadowCol,
    });
    const buildLivePairState = (simTimeDays = 0) =>
      computeBinaryPairOrbitalState({
        hostStars: pairHostStars,
        pair: livePairConfig,
        simTime: simTimeDays,
        cx: 0,
        cy: 0,
        minAu: 0.0001,
        maxAu: Math.max(livePairConfig.semiMajorAxisAu * 1.2, livePairHomeOrbitAu, 1),
        maxR: Math.max(livePairConfig.semiMajorAxisAu * 1.2, livePairHomeOrbitAu, 1),
        logScale: false,
        mapAuToPx: identityMapAuToPx,
        orbitOffsetToScreen: orbitOffsetIdentity,
        solveKeplerEquation,
      });
    const buildLivePrimaryPairPositions = (simTimeDays = 0) => {
      if (!livePrimaryPair) return [];
      const pairState = buildLivePairState(simTimeDays);
      const maxAngularOffsetRad = Math.max(
        ...pairHostStars.map((entry) => {
          const barycentricOrbitAu = Math.max(0, Number(entry?.barycentricOrbitAu) || 0);
          return Math.atan2(
            barycentricOrbitAu,
            Math.max(0.0001, livePairHomeOrbitAu - barycentricOrbitAu),
          );
        }),
        0.015,
      );
      const pxPerRad = Math.min(
        livePairLaneHalfWidth / Math.max(maxAngularOffsetRad, 0.015),
        livePairLaneHalfHeight / Math.max(maxAngularOffsetRad, 0.015),
      );
      return (
        pairState?.starNodes?.map((entry) => {
          const distanceToObserverAu = Math.max(
            0.0001,
            livePairHomeOrbitAu - Number(entry?.orbitalX || 0),
          );
          const horizontalAngleRad = Math.atan2(Number(entry?.orbitalZ || 0), distanceToObserverAu);
          const verticalAngleRad = Math.atan2(Number(entry?.orbitalY || 0), distanceToObserverAu);
          const normalizedDepth = clamp(
            (livePairHomeOrbitAu - distanceToObserverAu) /
              Math.max(0.0001, livePairConfig.semiMajorAxisAu),
            -1,
            1,
          );
          return {
            x: pairCenterX + horizontalAngleRad * pxPerRad,
            y: diskCy - verticalAngleRad * pxPerRad,
            observerDistanceAu: distanceToObserverAu,
            renderZ: -2 + normalizedDepth * 0.42,
            glowZ: -2.2 + normalizedDepth * 0.42,
            scaleFactor: clamp(livePairHomeOrbitAu / distanceToObserverAu, 0.9, 1.12),
            renderOrder: 20 + normalizedDepth * 10,
          };
        }) || []
      );
    };
    const basePairState = livePrimaryPair ? buildLivePairState(0) : null;
    const orbitPeriodDays = Number(basePairState?.periodDays || 0);
    const livePairStartTimeDays = livePrimaryPair
      ? findBestBinaryPairStartTimeDays({
          periodDays: orbitPeriodDays,
          buildPositionsAtTime: buildLivePrimaryPairPositions,
        })
      : 0;
    const initialLivePositions = buildLivePrimaryPairPositions(livePairStartTimeDays);
    const livePrimaryPairNodes = [];
    for (let i = 0; i < pairHostStars.length; i += 1) {
      const pairStar = pairHostStars[i];
      const initialPosition =
        livePrimaryPair && initialLivePositions[i]
          ? initialLivePositions[i]
          : {
              x: pairAreaLeft + pairSpacing * (i + 0.5),
              y: diskCy,
              renderZ: -2,
              glowZ: -2.2,
              scaleFactor: 1,
              renderOrder: 20,
            };
      const radius = Math.max(
        2,
        logScaleSize(pairStar.angularDiameterArcsec, pairScale, primaryStarArcsec) * 0.5,
      );
      const scaleFactor = Number(initialPosition.scaleFactor || 1);
      const glowSize = Math.max(6, radius * 3) * scaleFactor;
      const spriteSize = (radius / STAR_FILL) * scaleFactor;
      const pairCanvas = ensureStarSnap(pairStar.starColourHex, {
        starTempK: pairStar.tempK,
        starMassMsol: pairStar.massMsol,
        starAgeGyr: pairStar.ageGyr,
      });
      const glow = addGlow(
        runtime,
        initialPosition.x,
        initialPosition.y,
        radius * scaleFactor,
        Number(initialPosition.glowZ ?? -2.2),
        pairStar.starColourHex || "#ffffff",
        0.24,
      );
      glow.renderOrder = Number(initialPosition.renderOrder ?? 20) - 1;
      glow.scale.set(glowSize, glowSize, 1);
      const sprite = addCanvasSprite(
        runtime,
        pairCanvas,
        initialPosition.x,
        initialPosition.y,
        spriteSize,
        Number(initialPosition.renderZ ?? -2),
      );
      sprite.renderOrder = Number(initialPosition.renderOrder ?? 20);
      const nameLabel = addText(
        runtime,
        pairStar.name || `Sun ${i + 1}`,
        initialPosition.x,
        labelY,
        6.7,
        {
          font: "11px system-ui, sans-serif",
          color: labelCol,
          shadow: shadowCol,
        },
      );
      const sizeLabel = addText(
        runtime,
        pairStar.angularDiameterArcsec >= 60
          ? `${(pairStar.angularDiameterArcsec / 60).toFixed(1)}′`
          : `${pairStar.angularDiameterArcsec.toFixed(1)}″`,
        initialPosition.x,
        sizeY,
        6.7,
        {
          font: "10px monospace",
          color: subCol,
          shadow: shadowCol,
        },
      );
      if (livePrimaryPair) {
        livePrimaryPairNodes.push({
          glow,
          sprite,
          nameLabel,
          sizeLabel,
          baseGlowSize: Math.max(6, radius * 3),
          baseSpriteSize: radius / STAR_FILL,
        });
      }
    }
    if (livePrimaryPair && livePrimaryPairNodes.length === pairHostStars.length) {
      const simulatedDaysPerMs = orbitPeriodDays > 0 ? orbitPeriodDays / 18000 : 0;
      const animationStartMs = performance.now();
      let lastDrawMs = -Infinity;
      const tick = (nowMs) => {
        if (gen !== _drawGen) {
          stopSkyAnimation(runtime);
          return;
        }
        if (nowMs - lastDrawMs >= 66) {
          const simTimeDays =
            simulatedDaysPerMs > 0
              ? livePairStartTimeDays + (nowMs - animationStartMs) * simulatedDaysPerMs
              : livePairStartTimeDays;
          const nextPositions = buildLivePrimaryPairPositions(simTimeDays);
          nextPositions.forEach((position, index) => {
            const node = livePrimaryPairNodes[index];
            if (!node || !position) return;
            node.sprite?.position?.set(position.x, position.y, Number(position.renderZ ?? -2));
            node.glow?.position?.set(position.x, position.y, Number(position.glowZ ?? -2.2));
            if (node.sprite) {
              const spriteSize =
                Number(node.baseSpriteSize || 1) * Number(position.scaleFactor || 1);
              node.sprite.scale.set(spriteSize, spriteSize, 1);
              node.sprite.renderOrder = Number(position.renderOrder ?? 20);
            }
            if (node.glow) {
              const glowSize = Number(node.baseGlowSize || 6) * Number(position.scaleFactor || 1);
              node.glow.scale.set(glowSize, glowSize, 1);
              node.glow.renderOrder = Number(position.renderOrder ?? 20) - 1;
            }
            if (node.nameLabel) node.nameLabel.position.set(position.x, labelY, 6.7);
            if (node.sizeLabel) node.sizeLabel.position.set(position.x, sizeY, 6.7);
          });
          runtime.renderer.render(runtime.scene, runtime.camera);
          lastDrawMs = nowMs;
        }
        runtime.animationFrameId = requestAnimationFrame(tick);
      };
      startLivePrimaryPairAnimation = () => {
        stopSkyAnimation(runtime);
        runtime.animationFrameId = requestAnimationFrame(tick);
      };
    }
  } else if (starArcsec > 0 && starScale > 0) {
    const r = Math.max(2, (starArcsec / 2) * starScale);
    const starCanvas = ensureStarSnap(starColourHex, starData);
    addCanvasSprite(runtime, starCanvas, starX, diskCy, r / STAR_FILL, -2);
    const scaleNote = split
      ? ` (\u00d7${Math.max(1, Math.round(rightScale / Math.max(0.001, starScale)))} inset)`
      : "";
    addText(runtime, `Star${scaleNote}`, starX, labelY, 6.5, {
      font: "11px system-ui, sans-serif",
      color: labelCol,
      shadow: shadowCol,
    });
    addText(
      runtime,
      starArcsec >= 60 ? `${(starArcsec / 60).toFixed(1)}\u2032` : `${starArcsec.toFixed(1)}\u2033`,
      starX,
      sizeY,
      6.5,
      {
        font: "10px monospace",
        color: subCol,
        shadow: shadowCol,
      },
    );
    const solR = (solSun / 2) * starScale;
    if (solR >= 2) addDottedRing(runtime, starX, diskCy, solR, "Sol", isNight, solR < r);
  }

  if (companionStars.length) {
    const companionMaxArcsec = Math.max(
      ...companionStars.map((entry) => Number(entry.angularDiameterArcsec) || 0),
      1,
    );
    const companionScale = split ? rightScale : Math.max(starScale * 0.7, rightScale * 0.8);
    const companionAreaLeft = split ? W * 0.42 : W * 0.58;
    const companionSpacing = Math.min(
      150,
      Math.max(90, (W - companionAreaLeft - 28) / companionStars.length),
    );
    const companionY = H * 0.22;
    addText(
      runtime,
      "Companion suns",
      companionAreaLeft + companionSpacing * 0.5,
      companionY + 64,
      7.2,
      {
        font: "11px system-ui, sans-serif",
        color: labelCol,
        shadow: shadowCol,
      },
    );
    for (let i = 0; i < companionStars.length; i += 1) {
      const companion = companionStars[i];
      const cx = companionAreaLeft + companionSpacing * i + companionSpacing * 0.5;
      const radius = Math.max(
        2,
        logScaleSize(companion.angularDiameterArcsec, companionScale, companionMaxArcsec) * 0.5,
      );
      const companionCanvas = ensureStarSnap(companion.starColourHex, {
        starTempK: companion.tempK,
        starMassMsol: companion.massMsol,
        starAgeGyr: companion.ageGyr,
      });
      addCanvasSprite(runtime, companionCanvas, cx, companionY, radius / STAR_FILL, -1.8);
      addText(runtime, companion.name || `Companion ${i + 1}`, cx, companionY - 34, 7.2, {
        font: "10px system-ui, sans-serif",
        color: labelCol,
        shadow: shadowCol,
      });
      addText(
        runtime,
        companion.angularDiameterArcsec >= 60
          ? `${(companion.angularDiameterArcsec / 60).toFixed(1)}′`
          : `${companion.angularDiameterArcsec.toFixed(1)}″`,
        cx,
        companionY - 48,
        7.2,
        {
          font: "9px monospace",
          color: subCol,
          shadow: shadowCol,
        },
      );
    }
  }

  /* ── Bodies & Moons ──────────────────────────────────────── */
  const objects = [
    ...moons.map((m) => ({ type: "moon", entry: m, a: m.angularDiameterArcsec })),
    ...bodies.map((b) => ({ type: "body", entry: b, a: b.angularDiameterArcsec })),
  ];
  const rightW = W - rightStart - 10;
  const spacing = rightW / Math.max(1, objects.length + 1);
  const maxA = Math.max(...objects.map((o) => o.a), 1);

  for (let i = 0; i < objects.length; i++) {
    if (gen !== _drawGen) return false;
    const obj = objects[i];
    const cx = rightStart + spacing * (i + 1);
    const displaySize = logScaleSize(obj.a, rightScale, maxA);
    const size =
      obj.type === "body" && isBrownDwarfBodyEntry(obj.entry)
        ? Math.max(8, displaySize / (STAR_FILL * 2))
        : displaySize;

    const bodyCanvas = await ensureBodySnap(obj);
    if (gen !== _drawGen) return false;
    addCanvasSprite(runtime, bodyCanvas, cx, diskCy, size, 2, 0.98);

    // Moon phase shadow
    if (obj.type === "moon" && moonPhaseDeg != null) {
      const phaseCanvas = makePhaseShadow(moonPhaseDeg);
      addCanvasSprite(runtime, phaseCanvas, cx, diskCy, size, 3, 1);
    }

    // Point-source glow for small objects (magnitude-driven, gas/rocky colors)
    if (size < 16) {
      const b = obj.entry;
      const isBrownDwarf = obj.type === "body" && isBrownDwarfBodyEntry(b);
      const isGas =
        obj.type === "body" &&
        String(b.classLabel || "")
          .toLowerCase()
          .includes("gas");
      const dotColor = isBrownDwarf
        ? b.starVisual?.starColourHex || "rgba(122,73,95,0.55)"
        : isGas
          ? "rgba(232,216,176,0.6)"
          : "rgba(208,216,232,0.6)";
      addGlow(runtime, cx, diskCy, size, 1, dotColor, 0.4);
    }

    const label = obj.type === "moon" ? obj.entry.name || "Moon" : obj.entry.name || "Body";
    addText(runtime, label, cx, labelY, 7, {
      font: "11px system-ui, sans-serif",
      color: labelCol,
      shadow: shadowCol,
    });
    addText(
      runtime,
      obj.a >= 60 ? `${(obj.a / 60).toFixed(1)}\u2032` : `${obj.a.toFixed(1)}\u2033`,
      cx,
      sizeY,
      7,
      {
        font: "10px monospace",
        color: subCol,
        shadow: shadowCol,
      },
    );
  }

  /* ── Reference rings (dotted outlines) ─────────────────── */
  if (objects.length > 0 && rightScale > 0) {
    const refCx = rightStart + spacing;
    // Sol + Luna rings on first object
    const solR = logScaleSize(solSun / 2, rightScale, maxA / 2);
    const moonR = logScaleSize(solMoon / 2, rightScale, maxA / 2);
    const firstSize = logScaleSize(objects[0].a, rightScale, maxA);
    if (solR >= 2)
      addDottedRing(runtime, refCx, diskCy, solR, "Sol", isNight, firstSize / 2 > solR, 0);
    if (moonR >= 2)
      addDottedRing(runtime, refCx, diskCy, moonR, "Luna", isNight, firstSize / 2 > moonR, 12);

    // Jupiter ring on last object
    const lastCx = rightStart + spacing * objects.length;
    const jupR = logScaleSize(solJupiter / 2, rightScale, maxA / 2);
    if (jupR >= 2) {
      const lastSize = logScaleSize(objects[objects.length - 1].a, rightScale, maxA);
      addDottedRing(runtime, lastCx, diskCy, jupR, "Jupiter", isNight, lastSize / 2 > jupR);
    }
  }

  if (starArcsec <= 0 && objects.length === 0) {
    addText(runtime, "No objects to display", W * 0.5, H * 0.5, 8, {
      font: "13px system-ui, sans-serif",
      color: subCol,
      shadow: shadowCol,
    });
  }

  runtime.renderer.render(runtime.scene, runtime.camera);
  if (animatePrimaryPair) {
    startLivePrimaryPairAnimation?.();
  }
  try {
    onReady?.();
  } catch {}
  return true;
}
