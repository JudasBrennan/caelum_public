// SPDX-License-Identifier: MPL-2.0
import { latLonToXYZ } from "../plates.js";
import { clamp } from "../utils.js";

const TERRAIN_CACHE = new Map();
const MAX_CACHE = 16;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / Math.max(1e-9, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash2(x, y, seed) {
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return v - Math.floor(v);
}

function valueNoise2(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const v00 = hash2(x0, y0, seed);
  const v10 = hash2(x0 + 1, y0, seed);
  const v01 = hash2(x0, y0 + 1, seed);
  const v11 = hash2(x0 + 1, y0 + 1, seed);
  const sx = smoothstep(0, 1, tx);
  const sy = smoothstep(0, 1, ty);
  return lerp(lerp(v00, v10, sx), lerp(v01, v11, sx), sy);
}

function fractalNoise(lonDeg, latDeg, octaves = 3, seed = 1) {
  let amp = 1;
  let freq = 1 / 14;
  let sum = 0;
  let totalAmp = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    const value = valueNoise2((lonDeg + 180) * freq, (latDeg + 90) * freq, seed + octave * 17);
    sum += (value * 2 - 1) * amp;
    totalAmp += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return totalAmp > 0 ? sum / totalAmp : 0;
}

function colorRamp(stops, value) {
  if (!stops.length) return [0, 0, 0];
  if (value <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i += 1) {
    if (value > stops[i][0]) continue;
    const [prevValue, prevColor] = stops[i - 1];
    const [nextValue, nextColor] = stops[i];
    const t = smoothstep(prevValue, nextValue, value);
    return [
      Math.round(lerp(prevColor[0], nextColor[0], t)),
      Math.round(lerp(prevColor[1], nextColor[1], t)),
      Math.round(lerp(prevColor[2], nextColor[2], t)),
    ];
  }
  return stops[stops.length - 1][1];
}

function terrainColor(heightM) {
  if (heightM < 0) {
    return colorRamp(
      [
        [-11000, [7, 27, 67]],
        [-7000, [12, 47, 98]],
        [-4000, [25, 78, 140]],
        [-1200, [74, 124, 168]],
        [-250, [116, 151, 179]],
        [0, [160, 186, 191]],
      ],
      heightM,
    );
  }

  return colorRamp(
    [
      [0, [84, 106, 70]],
      [350, [102, 126, 79]],
      [1200, [126, 137, 92]],
      [2600, [140, 122, 89]],
      [4200, [165, 145, 117]],
      [6500, [186, 169, 152]],
      [9000, [232, 230, 228]],
      [12000, [250, 249, 248]],
    ],
    heightM,
  );
}

function topographyColor(heightM) {
  if (heightM < 0) {
    return colorRamp(
      [
        [-11000, [11, 22, 72]],
        [-8000, [18, 46, 122]],
        [-6000, [20, 73, 164]],
        [-3500, [31, 116, 196]],
        [-1800, [72, 175, 221]],
        [-600, [122, 214, 235]],
        [-80, [190, 240, 245]],
        [0, [220, 248, 247]],
      ],
      heightM,
    );
  }

  return colorRamp(
    [
      [0, [138, 210, 132]],
      [120, [118, 194, 108]],
      [450, [163, 210, 112]],
      [900, [211, 213, 134]],
      [1800, [202, 181, 115]],
      [3000, [175, 136, 86]],
      [4500, [146, 108, 79]],
      [6200, [176, 164, 160]],
      [8500, [242, 240, 237]],
      [12000, [255, 255, 255]],
    ],
    heightM,
  );
}

function grayscaleColor(value, min, max) {
  const t = smoothstep(min, max, value);
  const v = Math.round(lerp(20, 245, t));
  return [v, v, v];
}

function contourFactor(heightM) {
  const interval = heightM < 0 ? 500 : 250;
  const remainder = Math.abs(heightM % interval);
  const dist = Math.min(remainder, interval - remainder);
  return 1 - smoothstep(0, interval * 0.18, dist);
}

function buildRasterKey(model, width, height, mode) {
  return JSON.stringify({
    width,
    height,
    mode,
    timeMyr: model.snapshot?.timeMyr ?? model.state?.timeMyr ?? 0,
    grid: model.grid.id,
    plates: model.state?.plates?.map((plate) => [
      plate.id,
      plate.latDeg,
      plate.lonDeg,
      plate.eulerPoleLat,
      plate.eulerPoleLon,
      plate.angularVelDegMyr,
    ]),
    cellOwners: model.snapshot?.cellPlateIds ?? model.state?.cellPlateIds,
    cellCrust: model.snapshot?.cellCrustTypes ?? model.state?.cellCrustTypes,
    terrainStamp: model.cells?.map((cell) => [
      cell.id,
      Math.round(cell.terrainElevationM ?? cell.elevationM ?? 0),
      Number((cell.ridgeStrength ?? 0).toFixed(2)),
      Number((cell.trenchStrength ?? 0).toFixed(2)),
      Number((cell.hotspotInfluence ?? 0).toFixed(2)),
      Number((cell.superswellInfluence ?? 0).toFixed(2)),
      Number((cell.collisionStrength ?? 0).toFixed(2)),
      Number((cell.arcStrength ?? 0).toFixed(2)),
      Number((cell.coastalStrength ?? 0).toFixed(2)),
      Number((cell.erosionFactor ?? 0).toFixed(2)),
      Math.round(cell.coastDistance ?? 0),
      Math.round(cell.shelfDistance ?? 0),
      Math.round(cell.slopeDistance ?? 0),
    ]),
  });
}

function setCache(key, value) {
  TERRAIN_CACHE.set(key, value);
  if (TERRAIN_CACHE.size <= MAX_CACHE) return;
  const firstKey = TERRAIN_CACHE.keys().next().value;
  if (firstKey) TERRAIN_CACHE.delete(firstKey);
}

function buildBlendedSampler(model, neighborCount = 4) {
  const cellVectors = model.cells.map(
    (cell) => cell.centerVec || latLonToXYZ(cell.centerLatDeg, cell.centerLonDeg),
  );
  return (latDeg, lonDeg) => {
    const vec = latLonToXYZ(latDeg, lonDeg);
    const nearest = [];
    for (let i = 0; i < cellVectors.length; i += 1) {
      const candidate = cellVectors[i];
      const score = candidate.x * vec.x + candidate.y * vec.y + candidate.z * vec.z;
      if (nearest.length < neighborCount) {
        nearest.push({ index: i, score });
        nearest.sort((a, b) => b.score - a.score);
        continue;
      }
      if (score <= nearest[nearest.length - 1].score) continue;
      nearest[nearest.length - 1] = { index: i, score };
      nearest.sort((a, b) => b.score - a.score);
    }

    let totalWeight = 0;
    const weights = nearest.map((entry) => {
      const weight = 1 / Math.pow(Math.max(1e-4, 1 - entry.score), 1.35);
      totalWeight += weight;
      return weight;
    });

    const sample = {
      dominantCellIndex: nearest[0]?.index ?? 0,
      baseElevationM: 0,
      ridgeStrength: 0,
      trenchStrength: 0,
      arcStrength: 0,
      collisionStrength: 0,
      hotspotInfluence: 0,
      superswellInfluence: 0,
      coastalStrength: 0,
      erosionFactor: 0,
      coastDistance: 0,
      shelfDistance: 0,
      slopeDistance: 0,
      oceanFraction: 0,
    };

    for (let i = 0; i < nearest.length; i += 1) {
      const { index } = nearest[i];
      const weight = totalWeight > 0 ? weights[i] / totalWeight : 1 / nearest.length;
      const cell = model.cells[index];
      const elevation = cell.terrainElevationM ?? cell.elevationM ?? 0;
      sample.baseElevationM += elevation * weight;
      sample.ridgeStrength += (cell.ridgeStrength ?? 0) * weight;
      sample.trenchStrength += (cell.trenchStrength ?? 0) * weight;
      sample.arcStrength += (cell.arcStrength ?? 0) * weight;
      sample.collisionStrength += (cell.collisionStrength ?? 0) * weight;
      sample.hotspotInfluence += (cell.hotspotInfluence ?? 0) * weight;
      sample.superswellInfluence += (cell.superswellInfluence ?? 0) * weight;
      sample.coastalStrength += (cell.coastalStrength ?? 0) * weight;
      sample.erosionFactor += (cell.erosionFactor ?? 0) * weight;
      sample.coastDistance += (cell.coastDistance ?? 0) * weight;
      sample.shelfDistance += (cell.shelfDistance ?? 0) * weight;
      sample.slopeDistance += (cell.slopeDistance ?? 0) * weight;
      sample.oceanFraction += (elevation < 0 ? 1 : 0) * weight;
    }

    sample.landFraction = 1 - sample.oceanFraction;
    return sample;
  };
}

function buildHeightForSample(sample, lonDeg, latDeg) {
  const macro = fractalNoise(lonDeg, latDeg, 3, 11);
  const micro = fractalNoise(lonDeg * 1.8, latDeg * 1.8, 4, 29);
  const ridgeNoise = fractalNoise(
    lonDeg * (1 + sample.ridgeStrength * 0.8) + latDeg * 0.35,
    latDeg * (1.5 + sample.ridgeStrength * 1.2),
    3,
    47,
  );
  const trenchNoise = fractalNoise(
    lonDeg * (1.25 + sample.trenchStrength) - latDeg * 0.55,
    latDeg * (1.1 + sample.trenchStrength * 1.1),
    2,
    73,
  );
  const collisionNoise = fractalNoise(
    lonDeg * (1.4 + sample.collisionStrength * 0.9),
    latDeg * (2.1 + sample.collisionStrength * 0.7),
    3,
    101,
  );
  const baseNoise =
    macro * 0.42 +
    micro * 0.28 +
    ridgeNoise * sample.ridgeStrength * 0.18 +
    trenchNoise * sample.trenchStrength * 0.14 +
    collisionNoise * sample.collisionStrength * 0.22;

  const landAmp =
    95 +
    sample.collisionStrength * 900 +
    sample.arcStrength * 440 +
    sample.hotspotInfluence * 240 +
    sample.superswellInfluence * 190;
  const oceanAmp =
    35 +
    sample.ridgeStrength * 180 +
    sample.trenchStrength * 110 +
    sample.hotspotInfluence * 110 +
    sample.superswellInfluence * 140;
  const amp = sample.baseElevationM >= 0 ? landAmp : oceanAmp;
  let height = sample.baseElevationM + baseNoise * amp;

  if (sample.baseElevationM >= 0) {
    height += sample.collisionStrength * 620 + sample.arcStrength * 280;
    height -= sample.erosionFactor * Math.max(0, height) * 0.24;
    if (sample.coastDistance < 1.6) {
      const coastalCap = 110 + sample.coastDistance * 150;
      height = Math.min(height, height * 0.72 + coastalCap * 0.28);
    }
  } else {
    const shelfTarget = -90 - sample.shelfDistance * 160;
    const slopeTarget = -220 - Math.pow(Math.max(0, sample.slopeDistance), 1.35) * 280;
    if (sample.coastDistance < 1.75) {
      height = Math.max(height, shelfTarget);
    } else if (sample.coastDistance < 5) {
      height = lerp(height, slopeTarget, 0.38);
    }
    height += sample.ridgeStrength * 520 + sample.superswellInfluence * 240;
    height -= sample.trenchStrength * 880;
  }

  return clamp(height, -11000, 12000);
}

function smoothHeights(heights, featureMask, width, height, iterations = 2) {
  let current = heights;
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = new Float32Array(current.length);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        let sum = current[index] * 2;
        let weight = 2;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const nx = Math.max(0, Math.min(width - 1, x + dx));
            const ny = Math.max(0, Math.min(height - 1, y + dy));
            const nIndex = ny * width + nx;
            const sampleWeight = dx === 0 || dy === 0 ? 1 : 0.7;
            sum += current[nIndex] * sampleWeight;
            weight += sampleWeight;
          }
        }
        const blurred = sum / weight;
        const preserve = smoothstep(0.12, 0.7, featureMask[index]);
        const blend = 0.46 * (1 - preserve);
        next[index] = lerp(current[index], blurred, blend);
      }
    }
    current = next;
  }
  return current;
}

function shadeHeightField(heights, width, height, mode) {
  const shades = new Float32Array(width * height);
  const light = { x: -0.55, y: -0.35, z: 0.76 };
  const lightLen = Math.hypot(light.x, light.y, light.z) || 1;
  light.x /= lightLen;
  light.y /= lightLen;
  light.z /= lightLen;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (mode === "height" || mode === "heightmap" || mode === "bathymetry") {
        shades[index] = 0.92;
        continue;
      }
      const left = heights[y * width + Math.max(0, x - 1)];
      const right = heights[y * width + Math.min(width - 1, x + 1)];
      const up = heights[Math.max(0, y - 1) * width + x];
      const down = heights[Math.min(height - 1, y + 1) * width + x];
      const leftFar = heights[y * width + Math.max(0, x - 3)];
      const rightFar = heights[y * width + Math.min(width - 1, x + 3)];
      const upFar = heights[Math.max(0, y - 3) * width + x];
      const downFar = heights[Math.min(height - 1, y + 3) * width + x];
      const dx = (right - left) * 0.75 + (rightFar - leftFar) * 0.25;
      const dy = (down - up) * 0.75 + (downFar - upFar) * 0.25;
      const normal = {
        x: -dx / 900,
        y: -dy / 900,
        z: 1,
      };
      const normLen = Math.hypot(normal.x, normal.y, normal.z) || 1;
      normal.x /= normLen;
      normal.y /= normLen;
      normal.z /= normLen;
      const diffuse = clamp(normal.x * light.x + normal.y * light.y + normal.z * light.z, -1, 1);
      const base =
        mode === "topography"
          ? clamp(0.58 + diffuse * 0.42, 0.42, 1.22)
          : clamp(0.62 + diffuse * 0.34, 0.48, 1.18);
      shades[index] = base;
    }
  }
  return shades;
}

export function buildTerrainRaster(model, { width = 1024, height = 512, mode = "shaded" } = {}) {
  const key = buildRasterKey(model, width, height, mode);
  const cached = TERRAIN_CACHE.get(key);
  if (cached) {
    return {
      ...cached,
      colors: new Uint8ClampedArray(cached.colors),
      heights: new Float32Array(cached.heights),
      cellIds: new Uint16Array(cached.cellIds),
    };
  }

  const sampleFields = buildBlendedSampler(model);
  const colors = new Uint8ClampedArray(width * height * 4);
  const heights = new Float32Array(width * height);
  const cellIds = new Uint16Array(width * height);
  const featureMask = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const latDeg = 90 - ((y + 0.5) / height) * 180;
    for (let x = 0; x < width; x += 1) {
      const lonDeg = ((x + 0.5) / width) * 360 - 180;
      const sample = sampleFields(latDeg, lonDeg);
      const heightValue = buildHeightForSample(sample, lonDeg, latDeg);
      const pixelIndex = y * width + x;
      heights[pixelIndex] = heightValue;
      cellIds[pixelIndex] = sample.dominantCellIndex;
      featureMask[pixelIndex] = Math.max(
        sample.ridgeStrength,
        sample.trenchStrength,
        sample.arcStrength,
        sample.collisionStrength,
      );
    }
  }

  const smoothedHeights = smoothHeights(heights, featureMask, width, height, 2);
  const shades = shadeHeightField(smoothedHeights, width, height, mode);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const center = smoothedHeights[index];
      const shade = shades[index];
      let rgb;
      if (mode === "heightmap") {
        rgb = grayscaleColor(center, -11000, 12000);
      } else if (mode === "bathymetry") {
        rgb = grayscaleColor(Math.min(0, center), -11000, 0);
      } else if (mode === "topography") {
        rgb = topographyColor(center);
      } else {
        rgb = terrainColor(center);
      }
      const [r, g, b] = rgb;
      const contour =
        mode === "topography" ? 1 - contourFactor(center) * (center < 0 ? 0.16 : 0.12) : 1;
      const pixel = index * 4;
      colors[pixel] = clamp(r * shade * contour, 0, 255);
      colors[pixel + 1] = clamp(g * shade * contour, 0, 255);
      colors[pixel + 2] = clamp(b * shade * contour, 0, 255);
      colors[pixel + 3] = 255;
    }
  }

  const result = { width, height, mode, colors, heights: smoothedHeights, cellIds };
  setCache(key, result);
  return {
    ...result,
    colors: new Uint8ClampedArray(colors),
    heights: new Float32Array(smoothedHeights),
    cellIds: new Uint16Array(cellIds),
  };
}

export function clearTerrainRasterCache() {
  TERRAIN_CACHE.clear();
}
