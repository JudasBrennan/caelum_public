import {
  detectSolidTextureMapColor,
  resolveTextureMapCanvas,
  resolveTextureMapUploadSource,
} from "./celestialTexturePayloads.js";
import { recordCelestialPerfCacheLookup, recordCelestialPerfReuse } from "./celestialPerfDebug.js";

const rendererCaches = new WeakMap();
const rendererCacheRegistry = new Set();

function normalizeAnisotropy(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : 1;
}

function flatTextureKey(rgba, srgb) {
  return `${srgb ? "srgb" : "linear"}:${rgba.join(",")}`;
}

function applyTextureSampling(texture, THREE, { srgb = false, anisotropy = 1 } = {}) {
  if (!texture) return null;
  texture.minFilter = THREE.LinearMipmapLinearFilter || THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  if (srgb && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = normalizeAnisotropy(anisotropy);
  texture.premultiplyAlpha = false;
  return texture;
}

function createTextureFromCanvas(THREE, canvas, options = {}) {
  if (typeof THREE?.CanvasTexture !== "function" || !canvas) return null;
  const tex = new THREE.CanvasTexture(canvas);
  return applyTextureSampling(tex, THREE, options);
}

function createTextureFromData(THREE, source, options = {}) {
  if (typeof THREE?.DataTexture !== "function" || !source?.data) return null;
  const tex = new THREE.DataTexture(
    source.data,
    source.width,
    source.height,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  tex.flipY = true;
  tex.needsUpdate = true;
  return applyTextureSampling(tex, THREE, options);
}

function createCanvasFromDataSource(source) {
  if (
    !source?.data ||
    !(Number(source.width) > 0) ||
    !(Number(source.height) > 0) ||
    typeof document === "undefined" ||
    typeof document.createElement !== "function"
  ) {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Number(source.width) || 1);
  canvas.height = Math.max(1, Number(source.height) || 1);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const bytes = new Uint8ClampedArray(
    source.data.buffer,
    source.data.byteOffset,
    source.data.byteLength,
  );
  if (typeof ImageData !== "undefined") {
    ctx.putImageData(new ImageData(bytes, canvas.width, canvas.height), 0, 0);
  } else {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    imageData.data.set(bytes);
    ctx.putImageData(imageData, 0, 0);
  }
  return canvas;
}

function createTextureFromSource(THREE, source, options = {}) {
  if (!source) return null;
  if (source.kind === "data") {
    const dataTexture = createTextureFromData(THREE, source, options);
    if (dataTexture) return dataTexture;
    const canvas = createCanvasFromDataSource(source);
    if (!canvas) return null;
    return createTextureFromCanvas(THREE, canvas, options);
  }
  if (source.kind === "canvas") return createTextureFromCanvas(THREE, source.image, options);
  return null;
}

function createTextureFromEntry(THREE, entry, mapKey, options = {}) {
  const source = resolveTextureMapUploadSource(entry, mapKey);
  if (source) {
    const texture = createTextureFromSource(THREE, source, options);
    if (texture) {
      return {
        texture,
        owned: true,
        backend: source.kind === "data" && texture.isDataTexture ? "data" : "canvas",
      };
    }
  }
  const canvas = resolveTextureMapCanvas(entry, mapKey);
  if (!canvas) return { texture: null, owned: false, backend: "missing" };
  return {
    texture: createTextureFromCanvas(THREE, canvas, options),
    owned: true,
    backend: "canvas",
  };
}

function createSolidTexture(THREE, rgba, options = {}) {
  const source = {
    kind: "data",
    width: 1,
    height: 1,
    data: new Uint8Array(rgba || [0, 0, 0, 255]),
  };
  const texture = createTextureFromSource(THREE, source, options);
  if (texture) return texture;
  const canvas = createSolidCanvas(rgba);
  if (!canvas) return null;
  return createTextureFromCanvas(THREE, canvas, options);
}

function createSolidCanvas(rgba) {
  const [r = 0, g = 0, b = 0, a = 255] = rgba || [];
  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      ctx.fillRect(0, 0, 1, 1);
    }
    return canvas;
  }
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      ctx.fillRect(0, 0, 1, 1);
    }
    return canvas;
  }
  return null;
}

function disposeTexture(texture) {
  try {
    texture?.dispose?.();
  } catch {}
}

function disposeBundleEntry(entry) {
  if (!entry) return;
  for (const texture of entry.ownedTextures || []) disposeTexture(texture);
  entry.ownedTextures = [];
  entry.refCount = 0;
}

function disposeRendererCache(cache) {
  if (!cache) return;
  for (const entry of cache.bundleEntries.values()) disposeBundleEntry(entry);
  cache.bundleEntries.clear();
  for (const texture of cache.flatTextures.values()) disposeTexture(texture);
  cache.flatTextures.clear();
  cache.disposed = true;
  rendererCacheRegistry.delete(cache);
}

function getRendererCache(renderer, { create = false } = {}) {
  if (!renderer || (typeof renderer !== "object" && typeof renderer !== "function")) return null;
  const existing = rendererCaches.get(renderer);
  if (existing && !existing.disposed) return existing;
  if (!create) return null;
  const cache = {
    renderer,
    bundleEntries: new Map(),
    flatTextures: new Map(),
    disposed: false,
  };
  rendererCaches.set(renderer, cache);
  rendererCacheRegistry.add(cache);
  return cache;
}

function acquireFlatTexture(cache, THREE, rgba, { srgb = false, anisotropy = 1 } = {}) {
  const key = flatTextureKey(rgba, srgb);
  let texture = cache.flatTextures.get(key);
  if (!texture) {
    texture = createSolidTexture(THREE, rgba, { srgb, anisotropy });
    if (!texture) return null;
    cache.flatTextures.set(key, texture);
  } else {
    texture.anisotropy = Math.max(texture.anisotropy || 1, normalizeAnisotropy(anisotropy));
  }
  return texture;
}

function buildTextureForMap(cache, THREE, maps, mapKey, options = {}) {
  const flatColor = detectSolidTextureMapColor(maps, mapKey);
  if (flatColor) {
    const texture = acquireFlatTexture(cache, THREE, flatColor, options);
    return { texture, owned: false };
  }

  const entryTexture = createTextureFromEntry(THREE, maps, mapKey, options);
  if (!entryTexture.texture) {
    if (!Array.isArray(options.fallbackColor)) return { texture: null, owned: false };
    const texture = acquireFlatTexture(cache, THREE, options.fallbackColor, options);
    return { texture, owned: false };
  }
  return entryTexture;
}

function updateBundleSampling(bundle, anisotropy) {
  const target = normalizeAnisotropy(anisotropy);
  for (const texture of bundle.textures || []) {
    if (!texture) continue;
    texture.anisotropy = Math.max(texture.anisotropy || 1, target);
  }
}

export function acquireRendererTextureBundle(options = {}) {
  const { renderer, THREE, textureSignature, maps } = options;
  if (!renderer || !THREE || !textureSignature || !maps?.surface || !maps?.cloud) {
    return null;
  }
  const cache = getRendererCache(renderer, { create: true });
  if (!cache) return null;

  const existing = cache.bundleEntries.get(textureSignature);
  recordCelestialPerfCacheLookup("rendererTextureBundle", !!existing);
  if (existing) {
    existing.refCount += 1;
    updateBundleSampling(existing.bundle, options.anisotropy);
    recordCelestialPerfReuse("gpuTextureBundle");
    return existing.bundle;
  }

  const anisotropy = normalizeAnisotropy(options.anisotropy);
  const surfaceInfo = buildTextureForMap(cache, THREE, maps, "surface", { srgb: true, anisotropy });
  const cloudInfo = buildTextureForMap(cache, THREE, maps, "cloud", { srgb: true, anisotropy });
  const normalInfo = buildTextureForMap(cache, THREE, maps, "normal", {
    anisotropy,
    fallbackColor: [128, 128, 255, 255],
  });
  const roughnessInfo = buildTextureForMap(cache, THREE, maps, "roughness", {
    anisotropy,
    fallbackColor: [180, 180, 180, 255],
  });
  const emissiveInfo = buildTextureForMap(cache, THREE, maps, "emissive", {
    srgb: true,
    anisotropy,
    fallbackColor: [0, 0, 0, 255],
  });
  if (
    !surfaceInfo.texture ||
    !cloudInfo.texture ||
    !normalInfo.texture ||
    !roughnessInfo.texture ||
    !emissiveInfo.texture
  ) {
    if (surfaceInfo.owned) disposeTexture(surfaceInfo.texture);
    if (cloudInfo.owned) disposeTexture(cloudInfo.texture);
    if (normalInfo.owned) disposeTexture(normalInfo.texture);
    if (roughnessInfo.owned) disposeTexture(roughnessInfo.texture);
    if (emissiveInfo.owned) disposeTexture(emissiveInfo.texture);
    return null;
  }

  const bundle = {
    signature: textureSignature,
    surface: surfaceInfo.texture,
    cloud: cloudInfo.texture,
    normal: normalInfo.texture,
    roughness: roughnessInfo.texture,
    emissive: emissiveInfo.texture,
  };
  bundle.textures = [
    bundle.surface,
    bundle.cloud,
    bundle.normal,
    bundle.roughness,
    bundle.emissive,
  ];

  cache.bundleEntries.set(textureSignature, {
    bundle,
    refCount: 1,
    ownedTextures: [
      ...(surfaceInfo.owned ? [surfaceInfo.texture] : []),
      ...(cloudInfo.owned ? [cloudInfo.texture] : []),
      ...(normalInfo.owned ? [normalInfo.texture] : []),
      ...(roughnessInfo.owned ? [roughnessInfo.texture] : []),
      ...(emissiveInfo.owned ? [emissiveInfo.texture] : []),
    ],
  });
  return bundle;
}

export function releaseRendererTextureBundle(options = {}) {
  const { renderer } = options;
  const textureSignature = options.textureSignature || options.bundle?.signature || "";
  if (!renderer || !textureSignature) return;
  const cache = getRendererCache(renderer);
  if (!cache) return;
  const entry = cache.bundleEntries.get(textureSignature);
  if (!entry) return;
  entry.refCount = Math.max(0, Number(entry.refCount) - 1);
  if (entry.refCount > 0) return;
  cache.bundleEntries.delete(textureSignature);
  disposeBundleEntry(entry);
}

export function disposeRendererTextureBundleCache(renderer) {
  const cache = getRendererCache(renderer);
  if (!cache) return;
  disposeRendererCache(cache);
}

export function inspectRendererTextureBundleCache(renderer) {
  const cache = getRendererCache(renderer);
  return {
    bundleCount: cache?.bundleEntries.size || 0,
    flatTextureCount: cache?.flatTextures.size || 0,
    bundles: cache
      ? Array.from(cache.bundleEntries.entries()).map(([signature, entry]) => ({
          signature,
          refCount: entry.refCount,
        }))
      : [],
  };
}

export function clearRendererTextureBundleCachesForTests() {
  for (const cache of Array.from(rendererCacheRegistry)) {
    disposeRendererCache(cache);
  }
}
