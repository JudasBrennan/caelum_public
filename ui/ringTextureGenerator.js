import { clamp } from "../engine/utils.js";

const TAU = Math.PI * 2;

function hashUnit(str) {
  let h = 2166136261;
  const source = String(str || "ring");
  for (let i = 0; i < source.length; i += 1) {
    h ^= source.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function smoothstep(edge0, edge1, x) {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function normalizeHex(hex, fallback = "#d8c7a8") {
  const raw = String(hex || "")
    .trim()
    .replace(/^#/, "");
  const full = raw.length === 3 ? raw.replace(/(.)/g, "$1$1") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  return `#${full.toLowerCase()}`;
}

function hexToRgb(hex, fallback = "#d8c7a8") {
  const safe = normalizeHex(hex, fallback);
  return {
    r: parseInt(safe.slice(1, 3), 16),
    g: parseInt(safe.slice(3, 5), 16),
    b: parseInt(safe.slice(5, 7), 16),
  };
}

function sampleScalarStops(stops, t, fallback = 0) {
  const list = Array.isArray(stops) ? stops : [];
  if (!list.length) return fallback;
  const x = clamp(Number(t), 0, 1);
  if (x <= list[0].at) return Number(list[0].value) || fallback;
  for (let i = 1; i < list.length; i += 1) {
    const prev = list[i - 1];
    const next = list[i];
    if (x > next.at) continue;
    const denom = Math.max(1e-6, next.at - prev.at);
    const u = clamp((x - prev.at) / denom, 0, 1);
    return (Number(prev.value) || 0) + ((Number(next.value) || 0) - (Number(prev.value) || 0)) * u;
  }
  return Number(list[list.length - 1].value) || fallback;
}

function sampleColourStops(stops, t, fallback = "#d8c7a8") {
  const list = Array.isArray(stops) ? stops : [];
  if (!list.length) return hexToRgb(fallback, fallback);
  const x = clamp(Number(t), 0, 1);
  if (x <= list[0].at) return hexToRgb(list[0].color, fallback);
  for (let i = 1; i < list.length; i += 1) {
    const prev = list[i - 1];
    const next = list[i];
    if (x > next.at) continue;
    const denom = Math.max(1e-6, next.at - prev.at);
    const u = clamp((x - prev.at) / denom, 0, 1);
    const a = hexToRgb(prev.color, fallback);
    const b = hexToRgb(next.color, fallback);
    return {
      r: Math.round(a.r + (b.r - a.r) * u),
      g: Math.round(a.g + (b.g - a.g) * u),
      b: Math.round(a.b + (b.b - a.b) * u),
    };
  }
  return hexToRgb(list[list.length - 1].color, fallback);
}

function fract(x) {
  return x - Math.floor(x);
}

function noise1(x, seed = 0) {
  return fract(Math.sin(x * 127.1 + seed * 311.7) * 43758.5453123);
}

function createCanvas(width, height) {
  if (typeof document !== "undefined" && document?.createElement) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  throw new Error("Ring texture generation requires a canvas-capable environment.");
}

export function buildRingTextureProfile(appearance = {}) {
  const sampleCount = Math.max(64, Math.round(Number(appearance?.sampleCount) || 1024));
  const radii = new Float32Array(sampleCount);
  const colourR = new Uint8ClampedArray(sampleCount);
  const colourG = new Uint8ClampedArray(sampleCount);
  const colourB = new Uint8ClampedArray(sampleCount);
  const alpha = new Uint8ClampedArray(sampleCount);
  const seed = String(appearance?.seed || appearance?.styleId || "ring");
  const seedA = hashUnit(`${seed}:a`);
  const seedB = hashUnit(`${seed}:b`);
  const macroBandCount = Math.max(1, Math.round(Number(appearance?.macroBandCount) || 6));
  const macroBandContrast = clamp(Number(appearance?.macroBandContrast) || 0.22, 0, 1);
  const microBandStrength = clamp(Number(appearance?.microBandStrength) || 0.14, 0, 1);
  const dustStrength = clamp(Number(appearance?.dustStrength) || 0.08, 0, 1);
  const edgeFeatherInner = clamp(Number(appearance?.edgeFeatherInner) || 0.16, 0.01, 0.5);
  const edgeFeatherOuter = clamp(Number(appearance?.edgeFeatherOuter) || 0.2, 0.01, 0.5);
  const baseOpacity = clamp(Number(appearance?.opacity) || 0.35, 0.05, 0.8);
  const colourStops = Array.isArray(appearance?.colourStops) ? appearance.colourStops : [];
  const opacityStops = Array.isArray(appearance?.opacityStops) ? appearance.opacityStops : [];
  const gaps = Array.isArray(appearance?.gaps) ? appearance.gaps : [];

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / Math.max(1, sampleCount - 1);
    radii[i] = t;

    const macro =
      Math.sin((t * macroBandCount + seedA * 0.75) * TAU) * 0.7 +
      Math.sin((t * (macroBandCount * 0.5 + 1.5) + seedB) * TAU) * 0.3;
    let micro = 0;
    for (let octave = 0; octave < 4; octave += 1) {
      const freq = 24 * Math.pow(1.8, octave);
      const amp = Math.pow(0.55, octave + 1);
      micro += Math.sin((t * freq + seedA * (octave + 1) * 0.37) * TAU) * amp;
    }
    micro /= 1.6;
    const dust = (noise1(t * 512, seedA * 1000) - 0.5) * 2;
    const asymmetryBias = (t - 0.5) * (Number(appearance?.asymmetry) || 0) * 0.18;

    const colour = sampleColourStops(colourStops, t, "#d8c7a8");
    const baseAlpha = sampleScalarStops(opacityStops, t, baseOpacity);
    const bandGain =
      1 + macro * macroBandContrast * 0.6 + micro * microBandStrength * 0.4 + asymmetryBias;
    const alphaGain =
      1 +
      macro * macroBandContrast * 0.95 +
      micro * microBandStrength * 0.65 +
      dust * dustStrength * 0.35;
    let gapMask = 1;
    for (const gap of gaps) {
      const center = clamp(Number(gap?.center) || 0.5, 0, 1);
      const width = clamp(Number(gap?.width) || 0.05, 0.002, 1);
      const depth = clamp(Number(gap?.depth) || 0.6, 0, 1);
      const delta = Math.abs(t - center);
      const taper = 1 - smoothstep(width * 0.35, width, delta);
      gapMask *= 1 - taper * depth;
    }
    const innerFade = smoothstep(0, edgeFeatherInner, t);
    const outerFade = smoothstep(0, edgeFeatherOuter, 1 - t);
    const edgeMask = clamp(innerFade * outerFade, 0, 1);
    const finalAlpha = clamp(baseAlpha * alphaGain * gapMask * edgeMask, 0, 1);
    const lightness = clamp(0.88 + bandGain * 0.18 + dust * dustStrength * 0.08, 0.55, 1.2);

    colourR[i] = clamp(Math.round(colour.r * lightness), 0, 255);
    colourG[i] = clamp(Math.round(colour.g * lightness), 0, 255);
    colourB[i] = clamp(Math.round(colour.b * lightness), 0, 255);
    alpha[i] = clamp(Math.round(finalAlpha * 255), 0, 255);
  }

  return { radii, colourR, colourG, colourB, alpha };
}

export function renderRingStripTextures({ appearance, width = 1024, height = 32 } = {}) {
  const safeWidth = Math.max(64, Math.round(Number(width) || 1024));
  const safeHeight = Math.max(4, Math.round(Number(height) || 32));
  const colourCanvas = createCanvas(safeWidth, safeHeight);
  const alphaCanvas = createCanvas(safeWidth, safeHeight);
  const colourCtx = colourCanvas.getContext("2d");
  const alphaCtx = alphaCanvas.getContext("2d");
  if (!colourCtx || !alphaCtx) {
    return { colourCanvas, alphaCanvas };
  }

  const profile = buildRingTextureProfile({ ...(appearance || {}), sampleCount: safeWidth });
  const colourImage = colourCtx.createImageData(safeWidth, safeHeight);
  const alphaImage = alphaCtx.createImageData(safeWidth, safeHeight);
  const asymmetry = clamp(Number(appearance?.asymmetry) || 0, 0, 1);
  const phase = hashUnit(`${appearance?.seed || appearance?.styleId || "ring"}:angle`) * TAU;

  for (let y = 0; y < safeHeight; y += 1) {
    const angleNorm = safeHeight <= 1 ? 0 : y / (safeHeight - 1);
    const angleCos = Math.cos(angleNorm * TAU + phase);
    const arcAlpha = 1 - asymmetry * 0.4 + (0.6 + angleCos * 0.4) * asymmetry;
    const arcColour = 1 - asymmetry * 0.16 + (0.7 + angleCos * 0.3) * asymmetry * 0.28;

    for (let x = 0; x < safeWidth; x += 1) {
      const srcAlpha = clamp(Math.round(profile.alpha[x] * arcAlpha), 0, 255);
      const srcR = clamp(Math.round(profile.colourR[x] * arcColour), 0, 255);
      const srcG = clamp(Math.round(profile.colourG[x] * arcColour), 0, 255);
      const srcB = clamp(Math.round(profile.colourB[x] * arcColour), 0, 255);
      const idx = (y * safeWidth + x) * 4;

      colourImage.data[idx] = srcR;
      colourImage.data[idx + 1] = srcG;
      colourImage.data[idx + 2] = srcB;
      colourImage.data[idx + 3] = 255;

      alphaImage.data[idx] = srcAlpha;
      alphaImage.data[idx + 1] = srcAlpha;
      alphaImage.data[idx + 2] = srcAlpha;
      alphaImage.data[idx + 3] = 255;
    }
  }

  colourCtx.putImageData(colourImage, 0, 0);
  alphaCtx.putImageData(alphaImage, 0, 0);
  return { colourCanvas, alphaCanvas };
}
