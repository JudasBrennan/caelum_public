import { buildRingStripTexturePayload } from "./ringTextureGenerator.js";
import { recordCelestialPerfCacheLookup, recordCelestialPerfReuse } from "./celestialPerfDebug.js";

const RING_TEXTURE_CACHE_MAX = 32;
const ringPayloadCache = new Map();
const ringRendererCaches = new WeakMap();
const ringRendererCacheRegistry = new Set();

function normalizeDimension(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : fallback;
}

function buildRingPayloadCacheKey(signature, width, height) {
  return `${String(signature || "")}:${normalizeDimension(width)}x${normalizeDimension(height)}`;
}

function normalizeArrayBuffer(source, cloneBuffer = false) {
  if (source instanceof ArrayBuffer) return cloneBuffer ? source.slice(0) : source;
  if (!ArrayBuffer.isView(source)) return null;
  const view = source;
  if (cloneBuffer) {
    const copy = new Uint8ClampedArray(view.byteLength);
    copy.set(new Uint8ClampedArray(view.buffer, view.byteOffset, view.byteLength));
    return copy.buffer;
  }
  if (view.byteOffset === 0 && view.byteLength === view.buffer.byteLength) return view.buffer;
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function createCanvas(width, height) {
  const w = Math.max(1, normalizeDimension(width, 1));
  const h = Math.max(1, normalizeDimension(height, 1));
  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(w, h);
  }
  return null;
}

function canvasToBuffer(canvas, cloneBuffer = true) {
  if (!canvas?.getContext) return null;
  const width = normalizeDimension(canvas.width);
  const height = normalizeDimension(canvas.height);
  if (!(width > 0) || !(height > 0)) return null;
  const ctx =
    canvas.getContext("2d", { willReadFrequently: true }) || canvas.getContext("2d") || null;
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, 0, width, height);
  return cloneBuffer ? imageData.data.buffer.slice(0) : imageData.data.buffer;
}

function createImageData(ctx, data, width, height) {
  if (typeof ImageData !== "undefined") {
    return new ImageData(data, width, height);
  }
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(data);
  return imageData;
}

function disposeTexture(texture) {
  try {
    texture?.dispose?.();
  } catch {}
}

function disposeRingBundleEntry(entry) {
  if (!entry) return;
  disposeTexture(entry.bundle?.colorTex);
  disposeTexture(entry.bundle?.alphaTex);
  entry.refCount = 0;
}

function getRingRendererCache(renderer, { create = false } = {}) {
  if (!renderer || (typeof renderer !== "object" && typeof renderer !== "function")) return null;
  const existing = ringRendererCaches.get(renderer);
  if (existing && !existing.disposed) return existing;
  if (!create) return null;
  const cache = {
    bundleEntries: new Map(),
    disposed: false,
  };
  ringRendererCaches.set(renderer, cache);
  ringRendererCacheRegistry.add(cache);
  return cache;
}

function disposeRingRendererCache(renderer) {
  const cache = getRingRendererCache(renderer);
  if (!cache) return;
  for (const entry of cache.bundleEntries.values()) disposeRingBundleEntry(entry);
  cache.bundleEntries.clear();
  cache.disposed = true;
  ringRendererCacheRegistry.delete(cache);
}

function createRingCanvasTexture(THREE, canvas, { srgb = false } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearMipmapLinearFilter || THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  if (srgb && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function buildRingAppearanceSignature(ring) {
  if (!ring) return "";
  return JSON.stringify({
    styleId: ring.styleId || "",
    family: ring.family || "",
    colourStops: ring.colourStops || [],
    opacityStops: ring.opacityStops || [],
    gaps: ring.gaps || [],
    opacity: ring.opacity,
    macroBandCount: ring.macroBandCount,
    macroBandContrast: ring.macroBandContrast,
    microBandStrength: ring.microBandStrength,
    dustStrength: ring.dustStrength,
    edgeFeatherInner: ring.edgeFeatherInner,
    edgeFeatherOuter: ring.edgeFeatherOuter,
    asymmetry: ring.asymmetry,
    seed: ring.seed || "",
  });
}

export function buildRingGeometrySignature(ring) {
  if (!ring?.enabled) return "";
  return JSON.stringify({
    inner: ring.inner,
    outer: ring.outer,
  });
}

export function normalizeRingTexturePayload(entry, options = {}) {
  if (!entry) return null;
  const cloneBuffers = options.cloneBuffers === true;
  const width =
    normalizeDimension(entry.width) ||
    normalizeDimension(entry.colourCanvas?.width) ||
    normalizeDimension(entry.alphaCanvas?.width);
  const height =
    normalizeDimension(entry.height) ||
    normalizeDimension(entry.colourCanvas?.height) ||
    normalizeDimension(entry.alphaCanvas?.height);
  if (!(width > 0) || !(height > 0)) return null;

  const colour =
    normalizeArrayBuffer(entry.colour, cloneBuffers) ||
    normalizeArrayBuffer(entry.color, cloneBuffers) ||
    canvasToBuffer(entry.colourCanvas, true) ||
    canvasToBuffer(entry.colorCanvas, true);
  const alpha =
    normalizeArrayBuffer(entry.alpha, cloneBuffers) || canvasToBuffer(entry.alphaCanvas, true);
  if (!colour || !alpha) return null;
  return Object.freeze({
    width,
    height,
    colour,
    alpha,
  });
}

export function ringTexturePayloadToCanvas(payload, mapKey) {
  if (!payload || !mapKey) return null;
  const width = normalizeDimension(payload.width);
  const height = normalizeDimension(payload.height);
  const buffer =
    mapKey === "colour" || mapKey === "color"
      ? normalizeArrayBuffer(payload.colour || payload.color, false)
      : mapKey === "alpha"
        ? normalizeArrayBuffer(payload.alpha, false)
        : null;
  if (!buffer || !(width > 0) || !(height > 0)) return null;
  const canvas = createCanvas(width, height);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const data = new Uint8ClampedArray(buffer);
  ctx.putImageData(createImageData(ctx, data, width, height), 0, 0);
  return canvas;
}

export function getCachedRingTexturePayload(signature, options = {}) {
  const width = normalizeDimension(options.width, 1024);
  const height = normalizeDimension(options.height, 32);
  const key = buildRingPayloadCacheKey(signature, width, height);
  const hit = !!signature && ringPayloadCache.has(key);
  recordCelestialPerfCacheLookup("ringAppearancePayload", hit);
  if (!hit) return null;
  const payload = ringPayloadCache.get(key);
  ringPayloadCache.delete(key);
  ringPayloadCache.set(key, payload);
  recordCelestialPerfReuse("ringStrip");
  return payload;
}

export function cacheRingTexturePayload(signature, entry, options = {}) {
  if (!signature) return null;
  const payload = normalizeRingTexturePayload(
    {
      ...(entry || {}),
      width: normalizeDimension(options.width) || entry?.width,
      height: normalizeDimension(options.height) || entry?.height,
    },
    { cloneBuffers: false },
  );
  if (!payload) return null;
  const key = buildRingPayloadCacheKey(signature, payload.width, payload.height);
  if (ringPayloadCache.has(key)) {
    const cached = ringPayloadCache.get(key);
    ringPayloadCache.delete(key);
    ringPayloadCache.set(key, cached);
    return cached;
  }
  ringPayloadCache.set(key, payload);
  if (ringPayloadCache.size > RING_TEXTURE_CACHE_MAX) {
    const oldestKey = ringPayloadCache.keys().next().value;
    if (oldestKey) ringPayloadCache.delete(oldestKey);
  }
  return payload;
}

export function getOrCreateRingTexturePayload(ringDescriptor, options = {}) {
  const signature = buildRingAppearanceSignature(ringDescriptor);
  if (!signature) return null;
  const width = normalizeDimension(options.width, 1024);
  const height = normalizeDimension(options.height, 32);
  const cached = getCachedRingTexturePayload(signature, { width, height });
  if (cached) return { signature, payload: cached };
  const payload = normalizeRingTexturePayload(
    buildRingStripTexturePayload({
      appearance: ringDescriptor,
      width,
      height,
    }),
    { cloneBuffers: false },
  );
  if (!payload) return null;
  const stored = cacheRingTexturePayload(signature, payload);
  return { signature, payload: stored || payload };
}

export function acquireRingTextureBundle(options = {}) {
  const { renderer, THREE, ringTextureSignature, payload } = options;
  if (!renderer || !THREE || !ringTextureSignature || !payload?.colour || !payload?.alpha)
    return null;
  const cache = getRingRendererCache(renderer, { create: true });
  if (!cache) return null;
  const cacheKey = buildRingPayloadCacheKey(ringTextureSignature, payload.width, payload.height);
  const existing = cache.bundleEntries.get(cacheKey);
  recordCelestialPerfCacheLookup("ringTextureBundle", !!existing);
  if (existing) {
    existing.refCount += 1;
    recordCelestialPerfReuse("ringTextureBundle");
    return existing.bundle;
  }

  const colourCanvas = ringTexturePayloadToCanvas(payload, "colour");
  const alphaCanvas = ringTexturePayloadToCanvas(payload, "alpha");
  if (!colourCanvas || !alphaCanvas) return null;

  const bundle = {
    signature: ringTextureSignature,
    cacheKey,
    colorTex: createRingCanvasTexture(THREE, colourCanvas, { srgb: true }),
    alphaTex: createRingCanvasTexture(THREE, alphaCanvas),
  };
  cache.bundleEntries.set(cacheKey, {
    bundle,
    refCount: 1,
  });
  return bundle;
}

export function releaseRingTextureBundle(options = {}) {
  const renderer = options.renderer || null;
  const bundle = options.bundle || null;
  const cacheKey =
    options.cacheKey ||
    bundle?.cacheKey ||
    buildRingPayloadCacheKey(options.ringTextureSignature, options.width, options.height);
  if (!renderer || !cacheKey) return;
  const cache = getRingRendererCache(renderer);
  if (!cache) return;
  const entry = cache.bundleEntries.get(cacheKey);
  if (!entry) return;
  entry.refCount = Math.max(0, Number(entry.refCount) - 1);
  if (entry.refCount > 0) return;
  cache.bundleEntries.delete(cacheKey);
  disposeRingBundleEntry(entry);
}

export function disposeRendererRingTextureBundleCache(renderer) {
  disposeRingRendererCache(renderer);
}

export function inspectRendererRingTextureBundleCache(renderer) {
  const cache = getRingRendererCache(renderer);
  return {
    bundleCount: cache?.bundleEntries.size || 0,
    bundles: cache
      ? Array.from(cache.bundleEntries.values()).map((entry) => ({
          signature: entry.bundle.signature,
          cacheKey: entry.bundle.cacheKey,
          refCount: entry.refCount,
        }))
      : [],
  };
}

export function clearRingTextureCachesForTests() {
  ringPayloadCache.clear();
  for (const cache of Array.from(ringRendererCacheRegistry)) {
    for (const entry of cache.bundleEntries.values()) disposeRingBundleEntry(entry);
    cache.bundleEntries.clear();
    cache.disposed = true;
    ringRendererCacheRegistry.delete(cache);
  }
}
