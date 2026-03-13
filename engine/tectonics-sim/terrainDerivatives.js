import { clamp } from "../utils.js";

const DEFAULT_PLANET_RADIUS_M = 6371000;

function rowLatDeg(y, height) {
  return 90 - ((y + 0.5) / Math.max(1, height)) * 180;
}

function sample(heights, width, height, x, y) {
  const sx = Math.max(0, Math.min(width - 1, x));
  const sy = Math.max(0, Math.min(height - 1, y));
  return heights[sy * width + sx];
}

function contourStrength(heightM, intervalM) {
  const interval = Math.max(25, Number(intervalM) || 250);
  const remainder = Math.abs(heightM % interval);
  const dist = Math.min(remainder, interval - remainder);
  return 1 - clamp(dist / Math.max(1e-6, interval * 0.16), 0, 1);
}

export function buildContourSourceRaster(heights, width, height, { passes = 2 } = {}) {
  let current = new Float32Array(heights);
  const iterations = Math.max(1, Number(passes) || 2);

  for (let pass = 0; pass < iterations; pass += 1) {
    const next = new Float32Array(current.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const center = current[index];
        const centerDomain = center >= 0;
        let sum = 0;
        let weightSum = 0;

        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            const sx = Math.max(0, Math.min(width - 1, x + ox));
            const sy = Math.max(0, Math.min(height - 1, y + oy));
            const sampleValue = current[sy * width + sx];
            if (sampleValue >= 0 !== centerDomain) continue;
            const weight = ox === 0 && oy === 0 ? 4 : ox === 0 || oy === 0 ? 2 : 1;
            sum += sampleValue * weight;
            weightSum += weight;
          }
        }

        next[index] = weightSum > 0 ? sum / weightSum : center;
      }
    }
    current = next;
  }

  return current;
}

export function buildSlopeAspectRasters(
  heights,
  width,
  height,
  { planetRadiusM = DEFAULT_PLANET_RADIUS_M } = {},
) {
  const slopeDeg = new Float32Array(width * height);
  const aspectDeg = new Float32Array(width * height);
  const radiusM = Math.max(1000, Number(planetRadiusM) || DEFAULT_PLANET_RADIUS_M);
  const latSpacingM = (Math.PI * radiusM) / Math.max(1, height);

  for (let y = 0; y < height; y += 1) {
    const latCos = Math.max(0.15, Math.cos((rowLatDeg(y, height) * Math.PI) / 180));
    const lonSpacingM = ((2 * Math.PI * radiusM) / Math.max(1, width)) * latCos;

    for (let x = 0; x < width; x += 1) {
      const z1 = sample(heights, width, height, x - 1, y - 1);
      const z2 = sample(heights, width, height, x, y - 1);
      const z3 = sample(heights, width, height, x + 1, y - 1);
      const z4 = sample(heights, width, height, x - 1, y);
      const z6 = sample(heights, width, height, x + 1, y);
      const z7 = sample(heights, width, height, x - 1, y + 1);
      const z8 = sample(heights, width, height, x, y + 1);
      const z9 = sample(heights, width, height, x + 1, y + 1);

      const dzdx = (z3 + 2 * z6 + z9 - (z1 + 2 * z4 + z7)) / Math.max(1e-6, 8 * lonSpacingM);
      const dzdy = (z7 + 2 * z8 + z9 - (z1 + 2 * z2 + z3)) / Math.max(1e-6, 8 * latSpacingM);
      const index = y * width + x;
      const slopeRad = Math.atan(Math.hypot(dzdx, dzdy));
      slopeDeg[index] = (slopeRad * 180) / Math.PI;

      if (Math.abs(dzdx) < 1e-12 && Math.abs(dzdy) < 1e-12) {
        aspectDeg[index] = 0;
        continue;
      }
      let aspect = (Math.atan2(dzdx, -dzdy) * 180) / Math.PI;
      if (aspect < 0) aspect += 360;
      aspectDeg[index] = aspect;
    }
  }

  return { slopeDeg, aspectDeg };
}

export function buildSlopeRaster(heights, width, height, options = {}) {
  return buildSlopeAspectRasters(heights, width, height, options).slopeDeg;
}

export function buildAspectRaster(heights, width, height, options = {}) {
  return buildSlopeAspectRasters(heights, width, height, options).aspectDeg;
}

export function buildHillshadeRaster(
  heights,
  width,
  height,
  {
    planetRadiusM = DEFAULT_PLANET_RADIUS_M,
    slopeDeg = null,
    aspectDeg = null,
    azimuthDeg = 315,
    altitudeDeg = 45,
  } = {},
) {
  const derived =
    slopeDeg && aspectDeg
      ? { slopeDeg, aspectDeg }
      : buildSlopeAspectRasters(heights, width, height, { planetRadiusM });
  const azimuthRad = (azimuthDeg * Math.PI) / 180;
  const altitudeRad = (altitudeDeg * Math.PI) / 180;
  const hillshade = new Float32Array(width * height);

  for (let index = 0; index < hillshade.length; index += 1) {
    const slopeRad = (derived.slopeDeg[index] * Math.PI) / 180;
    const aspectRad = (derived.aspectDeg[index] * Math.PI) / 180;
    const shaded =
      Math.sin(altitudeRad) * Math.cos(slopeRad) +
      Math.cos(altitudeRad) * Math.sin(slopeRad) * Math.cos(azimuthRad - aspectRad);
    hillshade[index] = clamp((shaded + 1) * 0.5, 0, 1);
  }

  return hillshade;
}

export function buildContourMaskRaster(
  heights,
  width,
  height,
  { minorStepM = 250, majorEvery = 5 } = {},
) {
  const minorStep = Math.max(25, Number(minorStepM) || 250);
  const majorStep = Math.max(minorStep, minorStep * Math.max(1, Number(majorEvery) || 5));
  const minorContourMask = new Float32Array(width * height);
  const majorContourMask = new Float32Array(width * height);
  const coastContourMask = new Float32Array(width * height);

  for (let index = 0; index < heights.length; index += 1) {
    const h = heights[index];
    minorContourMask[index] = contourStrength(h, minorStep);
    majorContourMask[index] = contourStrength(h, majorStep);
    coastContourMask[index] = contourStrength(h, minorStep);
  }

  return {
    minorContourMask,
    majorContourMask,
    coastContourMask,
  };
}
