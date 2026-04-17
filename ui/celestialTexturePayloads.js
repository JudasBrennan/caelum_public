const CELESTIAL_TEXTURE_MAP_KEYS = Object.freeze([
  "surface",
  "cloud",
  "normal",
  "roughness",
  "emissive",
]);

function normalizeDimension(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : 0;
}

function hasContextFactory(value) {
  return !!value && typeof value.getContext === "function";
}

function hasImageDataShape(value) {
  return (
    !!value &&
    normalizeDimension(value.width) > 0 &&
    normalizeDimension(value.height) > 0 &&
    value.data
  );
}

function hasLegacyMapPayloadShape(value) {
  return (
    !!value &&
    normalizeDimension(value.width) > 0 &&
    normalizeDimension(value.height) > 0 &&
    (value.buffer instanceof ArrayBuffer || ArrayBuffer.isView(value.buffer))
  );
}

function exactArrayBufferFromView(view, cloneBuffer) {
  if (!ArrayBuffer.isView(view)) return null;
  if (cloneBuffer) {
    const copy = new Uint8ClampedArray(view.byteLength);
    copy.set(new Uint8ClampedArray(view.buffer, view.byteOffset, view.byteLength));
    return copy.buffer;
  }
  if (view.byteOffset === 0 && view.byteLength === view.buffer.byteLength) return view.buffer;
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function normalizeRawBuffer(source, cloneBuffer) {
  if (!source) return null;
  if (source instanceof ArrayBuffer) return cloneBuffer ? source.slice(0) : source;
  if (ArrayBuffer.isView(source)) return exactArrayBufferFromView(source, cloneBuffer);
  return null;
}

function createCanvas(width, height) {
  const w = Math.max(1, normalizeDimension(width) || 1);
  const h = Math.max(1, normalizeDimension(height) || 1);
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

function imageDataFromSource(source, width, height) {
  const w = normalizeDimension(width);
  const h = normalizeDimension(height);
  if (!(w > 0) || !(h > 0)) return null;
  if (hasContextFactory(source)) {
    const ctx =
      source.getContext("2d", { willReadFrequently: true }) || source.getContext("2d") || null;
    if (!ctx) return null;
    return ctx.getImageData(0, 0, w, h);
  }
  if (hasImageDataShape(source)) return source;
  return null;
}

function inferDimensions(entry) {
  const width =
    normalizeDimension(entry?.width) ||
    normalizeDimension(entry?.surface?.width) ||
    normalizeDimension(entry?.cloud?.width) ||
    normalizeDimension(entry?.normal?.width) ||
    normalizeDimension(entry?.roughness?.width) ||
    normalizeDimension(entry?.emissive?.width);
  const height =
    normalizeDimension(entry?.height) ||
    normalizeDimension(entry?.surface?.height) ||
    normalizeDimension(entry?.cloud?.height) ||
    normalizeDimension(entry?.normal?.height) ||
    normalizeDimension(entry?.roughness?.height) ||
    normalizeDimension(entry?.emissive?.height);
  return { width, height };
}

function normalizeMapBuffer(source, width, height, cloneBuffer) {
  if (!source) return null;
  if (hasLegacyMapPayloadShape(source)) {
    return normalizeRawBuffer(source.buffer, cloneBuffer);
  }
  const rawBuffer = normalizeRawBuffer(source, cloneBuffer);
  if (rawBuffer) return rawBuffer;
  const imageData = imageDataFromSource(source, width, height);
  if (!imageData) return null;
  return imageData.data.buffer.slice(0);
}

function createImageDataForCanvas(ctx, data, width, height) {
  if (typeof ImageData !== "undefined") {
    return new ImageData(data, width, height);
  }
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(data);
  return imageData;
}

function detectSolidColorFromBuffer(buffer, width, height) {
  const w = normalizeDimension(width);
  const h = normalizeDimension(height);
  const rawBuffer = normalizeRawBuffer(buffer, false);
  if (!rawBuffer || !(w > 0) || !(h > 0)) return null;
  const requiredLength = w * h * 4;
  const data = new Uint8ClampedArray(rawBuffer);
  if (data.byteLength < requiredLength || requiredLength < 4) return null;
  const color = [data[0], data[1], data[2], data[3]];
  for (let i = 4; i < requiredLength; i += 4) {
    if (
      data[i] !== color[0] ||
      data[i + 1] !== color[1] ||
      data[i + 2] !== color[2] ||
      data[i + 3] !== color[3]
    ) {
      return null;
    }
  }
  return color;
}

export function isCelestialTexturePayload(entry) {
  return (
    !!entry &&
    normalizeDimension(entry.width) > 0 &&
    normalizeDimension(entry.height) > 0 &&
    CELESTIAL_TEXTURE_MAP_KEYS.some((key) => !!normalizeRawBuffer(entry[key], false))
  );
}

export function normalizeCelestialTexturePayload(entry, options = {}) {
  if (!entry) return null;
  const cloneBuffers = options.cloneBuffers === true;
  const { width, height } = inferDimensions(entry);
  if (!(width > 0) || !(height > 0)) return null;

  const payload = {
    width,
    height,
    surface: normalizeMapBuffer(entry.surface, width, height, cloneBuffers),
    cloud: normalizeMapBuffer(entry.cloud, width, height, cloneBuffers),
    normal: normalizeMapBuffer(entry.normal, width, height, cloneBuffers),
    roughness: normalizeMapBuffer(entry.roughness, width, height, cloneBuffers),
    emissive: normalizeMapBuffer(entry.emissive, width, height, cloneBuffers),
  };

  if (!payload.surface || !payload.cloud || !payload.normal) return null;
  return Object.freeze(payload);
}

export function resolveCelestialTextureSize(entry) {
  if (!entry) return { width: 0, height: 0 };
  if (isCelestialTexturePayload(entry)) {
    return {
      width: normalizeDimension(entry.width),
      height: normalizeDimension(entry.height),
    };
  }
  return inferDimensions(entry);
}

export function texturePayloadToCanvas(payload, mapKey) {
  if (!payload || !mapKey) return null;
  const width = normalizeDimension(payload.width);
  const height = normalizeDimension(payload.height);
  const buffer = normalizeRawBuffer(payload[mapKey], false);
  if (!buffer || !(width > 0) || !(height > 0)) return null;
  const canvas = createCanvas(width, height);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const data = new Uint8ClampedArray(buffer);
  if (data.byteLength < width * height * 4) return null;
  ctx.putImageData(createImageDataForCanvas(ctx, data, width, height), 0, 0);
  return canvas;
}

export async function texturePayloadToImageBitmap(payload, mapKey) {
  if (typeof createImageBitmap !== "function") return null;
  const canvas = texturePayloadToCanvas(payload, mapKey);
  if (!canvas) return null;
  try {
    return await createImageBitmap(canvas);
  } catch {
    return null;
  }
}

export function texturePayloadToDataTextureSource(payload, mapKey) {
  if (!payload || !mapKey) return null;
  const width = normalizeDimension(payload.width);
  const height = normalizeDimension(payload.height);
  const buffer = normalizeRawBuffer(payload[mapKey], false);
  if (!buffer || !(width > 0) || !(height > 0)) return null;
  const requiredLength = width * height * 4;
  const data = new Uint8Array(buffer, 0, Math.min(requiredLength, buffer.byteLength));
  if (data.byteLength < requiredLength) return null;
  return { width, height, data };
}

export function resolveTextureMapUploadSource(entry, mapKey) {
  if (!entry || !mapKey) return null;
  const direct = entry[mapKey];
  if (hasContextFactory(direct)) {
    return {
      kind: "canvas",
      image: direct,
      width: normalizeDimension(direct.width),
      height: normalizeDimension(direct.height),
    };
  }
  if (hasLegacyMapPayloadShape(direct)) {
    const source = texturePayloadToDataTextureSource(
      {
        width: direct.width,
        height: direct.height,
        [mapKey]: direct.buffer,
      },
      mapKey,
    );
    return source ? { kind: "data", ...source } : null;
  }
  if (isCelestialTexturePayload(entry)) {
    const source = texturePayloadToDataTextureSource(entry, mapKey);
    return source ? { kind: "data", ...source } : null;
  }
  const { width, height } = inferDimensions(entry);
  const rawBuffer = normalizeRawBuffer(direct, false);
  if (rawBuffer && width > 0 && height > 0) {
    const source = texturePayloadToDataTextureSource(
      {
        width,
        height,
        [mapKey]: rawBuffer,
      },
      mapKey,
    );
    return source ? { kind: "data", ...source } : null;
  }
  const canvas = resolveTextureMapCanvas(entry, mapKey);
  if (!canvas) return null;
  return {
    kind: "canvas",
    image: canvas,
    width: normalizeDimension(canvas.width),
    height: normalizeDimension(canvas.height),
  };
}

export function resolveTextureMapCanvas(entry, mapKey) {
  if (!entry || !mapKey) return null;
  const direct = entry[mapKey];
  if (hasContextFactory(direct)) return direct;
  if (hasLegacyMapPayloadShape(direct)) {
    return texturePayloadToCanvas(
      {
        width: direct.width,
        height: direct.height,
        [mapKey]: direct.buffer,
      },
      mapKey,
    );
  }
  if (isCelestialTexturePayload(entry)) return texturePayloadToCanvas(entry, mapKey);
  const { width, height } = inferDimensions(entry);
  if (normalizeRawBuffer(direct, false) && width > 0 && height > 0) {
    return texturePayloadToCanvas(
      {
        width,
        height,
        [mapKey]: direct,
      },
      mapKey,
    );
  }
  return null;
}

export function detectSolidTextureMapColor(entry, mapKey) {
  if (!entry || !mapKey) return null;
  const direct = entry[mapKey];
  if (!direct) return null;
  if (hasLegacyMapPayloadShape(direct)) {
    return detectSolidColorFromBuffer(direct.buffer, direct.width, direct.height);
  }
  if (hasContextFactory(direct)) {
    const width = normalizeDimension(direct.width);
    const height = normalizeDimension(direct.height);
    const imageData = imageDataFromSource(direct, width, height);
    if (!imageData) return null;
    return detectSolidColorFromBuffer(imageData.data.buffer, width, height);
  }
  if (isCelestialTexturePayload(entry)) {
    return detectSolidColorFromBuffer(entry[mapKey], entry.width, entry.height);
  }
  const { width, height } = inferDimensions(entry);
  const rawBuffer = normalizeRawBuffer(direct, false);
  if (!rawBuffer || !(width > 0) || !(height > 0)) return null;
  return detectSolidColorFromBuffer(rawBuffer, width, height);
}

export { CELESTIAL_TEXTURE_MAP_KEYS };
