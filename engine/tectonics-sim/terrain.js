import { latLonToXYZ } from "../plates.js";
import { clamp } from "../utils.js";
import {
  buildContourMaskRaster,
  buildContourSourceRaster,
  buildHillshadeRaster,
  buildSlopeAspectRasters,
} from "./terrainDerivatives.js";
import {
  applyTerrainCoastlineColor,
  buildTerrainModeStyle,
  colorAspectAngle,
  colorSlopeAngle,
  colorSlopeAspectValue,
  colorTerrainHeight,
} from "./terrainStyles.js";

const TERRAIN_GEOMETRY_CACHE = new Map();
const TERRAIN_DERIVATIVE_CACHE = new Map();
const TERRAIN_CONTOUR_CACHE = new Map();
const TERRAIN_MODE_CACHE = new Map();
const TERRAIN_LOOKUP_CACHE = new Map();
const MAX_CACHE = 12;
const TERRAIN_LOOKUP_CANDIDATES = 16;
const EMPTY_CELL = 65535;

const TERRAIN_PREVIEW_SIZES = Object.freeze({
  interactive: Object.freeze({ width: 512, height: 256 }),
  settled: Object.freeze({ width: 1024, height: 512 }),
});

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

function setCache(map, key, value) {
  map.set(key, value);
  if (map.size <= MAX_CACHE) return;
  const firstKey = map.keys().next().value;
  if (firstKey) map.delete(firstKey);
}

function getTerrainTime(model) {
  return model.snapshot?.timeMyr ?? model.state?.timeMyr ?? model.timeMyr ?? 0;
}

function getTerrainGridId(model) {
  return model.grid?.id || model.gridId || `cells-${model.cells?.length || 0}`;
}

function buildGeometryKey(model, width, height) {
  return JSON.stringify({
    width,
    height,
    timeMyr: getTerrainTime(model),
    grid: getTerrainGridId(model),
    terrainStamp: (model.cells || []).map((cell) => [
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

function buildModeKey(geometryKey, mode, options = {}) {
  if (mode === "slope" || mode === "aspect" || mode === "slopeaspect") {
    return `${mode}::${geometryKey}`;
  }
  const presetId =
    mode === "heightmap" ? "raw-height" : String(options.terrainStylePreset || "physical");
  const reliefStrength =
    mode === "heightmap" ? "1.00" : (Number(options.reliefStrength) || 1).toFixed(2);
  const coastlineEmphasis =
    mode === "heightmap" ? "0.00" : (Number(options.coastlineEmphasis) || 1).toFixed(2);
  const prefix = `${mode}:${presetId}:${reliefStrength}:${coastlineEmphasis}`;
  if (mode === "topography") {
    return `${prefix}:${Math.max(25, Number(options.topographyBandStepM) || 250)}:${String(
      options.topographyPeakColor || "",
    ).toLowerCase()}::${geometryKey}`;
  }
  return `${prefix}::${geometryKey}`;
}

function buildDerivativeKey(geometryKey, planetRadiusM) {
  return `${geometryKey}::${Math.round(Number(planetRadiusM) || 6371000)}`;
}

function buildContourKey(geometryKey, topographyBandStepM, majorEvery = 5) {
  return `${geometryKey}::${Math.max(25, Number(topographyBandStepM) || 250)}::${Math.max(
    1,
    Number(majorEvery) || 5,
  )}`;
}

function extractCenterVec(cell) {
  if (cell?.centerVec) {
    return {
      x: Number(cell.centerVec.x) || 0,
      y: Number(cell.centerVec.y) || 0,
      z: Number(cell.centerVec.z) || 0,
    };
  }
  return latLonToXYZ(cell.centerLatDeg, cell.centerLonDeg);
}

function getLookupDimensions(cellCount) {
  const lonBins = Math.max(96, Math.min(256, Math.round(Math.sqrt(Math.max(24, cellCount)) * 10)));
  return {
    lonBins,
    latBins: Math.max(48, Math.round(lonBins / 2)),
  };
}

function buildLookupKey(gridId, cellCount, lonBins, latBins, candidateCount) {
  return `${gridId}:${cellCount}:${lonBins}x${latBins}:${candidateCount}`;
}

function insertNearest(nearest, entry, limit) {
  if (nearest.length < limit) {
    nearest.push(entry);
    nearest.sort((left, right) => right.score - left.score);
    return;
  }
  if (entry.score <= nearest[nearest.length - 1].score) return;
  nearest[nearest.length - 1] = entry;
  nearest.sort((left, right) => right.score - left.score);
}

function getSpatialLookup(model, candidateCount = TERRAIN_LOOKUP_CANDIDATES) {
  const cells = model.cells || [];
  const gridId = getTerrainGridId(model);
  const { lonBins, latBins } = getLookupDimensions(cells.length);
  const key = buildLookupKey(gridId, cells.length, lonBins, latBins, candidateCount);
  const cached = TERRAIN_LOOKUP_CACHE.get(key);
  if (cached) return cached;

  const cellVectors = cells.map(extractCenterVec);
  const candidates = new Uint16Array(lonBins * latBins * candidateCount);
  candidates.fill(EMPTY_CELL);

  for (let by = 0; by < latBins; by += 1) {
    const latDeg = 90 - ((by + 0.5) / latBins) * 180;
    for (let bx = 0; bx < lonBins; bx += 1) {
      const lonDeg = ((bx + 0.5) / lonBins) * 360 - 180;
      const vec = latLonToXYZ(latDeg, lonDeg);
      const nearest = [];
      for (let i = 0; i < cellVectors.length; i += 1) {
        const candidate = cellVectors[i];
        const score = candidate.x * vec.x + candidate.y * vec.y + candidate.z * vec.z;
        insertNearest(nearest, { index: i, score }, candidateCount);
      }
      const start = (by * lonBins + bx) * candidateCount;
      for (let i = 0; i < nearest.length; i += 1) {
        candidates[start + i] = nearest[i].index;
      }
    }
  }

  const lookup = { lonBins, latBins, candidateCount, candidates };
  TERRAIN_LOOKUP_CACHE.set(key, lookup);
  return lookup;
}

function buildBlendedSampler(model, neighborCount = 4) {
  const cells = model.cells || [];
  const cellVectors = cells.map(extractCenterVec);
  const lookup = getSpatialLookup(model);
  const count = cells.length;

  const baseElevations = new Float32Array(count);
  const ridgeStrengths = new Float32Array(count);
  const trenchStrengths = new Float32Array(count);
  const arcStrengths = new Float32Array(count);
  const collisionStrengths = new Float32Array(count);
  const hotspotInfluences = new Float32Array(count);
  const superswellInfluences = new Float32Array(count);
  const coastalStrengths = new Float32Array(count);
  const erosionFactors = new Float32Array(count);
  const coastDistances = new Float32Array(count);
  const shelfDistances = new Float32Array(count);
  const slopeDistances = new Float32Array(count);
  const oceanMask = new Uint8Array(count);

  for (let i = 0; i < count; i += 1) {
    const cell = cells[i];
    const elevation = cell.terrainElevationM ?? cell.elevationM ?? 0;
    baseElevations[i] = elevation;
    ridgeStrengths[i] = cell.ridgeStrength ?? 0;
    trenchStrengths[i] = cell.trenchStrength ?? 0;
    arcStrengths[i] = cell.arcStrength ?? 0;
    collisionStrengths[i] = cell.collisionStrength ?? 0;
    hotspotInfluences[i] = cell.hotspotInfluence ?? 0;
    superswellInfluences[i] = cell.superswellInfluence ?? 0;
    coastalStrengths[i] = cell.coastalStrength ?? 0;
    erosionFactors[i] = cell.erosionFactor ?? 0;
    coastDistances[i] = cell.coastDistance ?? 0;
    shelfDistances[i] = cell.shelfDistance ?? 0;
    slopeDistances[i] = cell.slopeDistance ?? 0;
    oceanMask[i] = elevation < 0 ? 1 : 0;
  }

  return (latDeg, lonDeg) => {
    const vec = latLonToXYZ(latDeg, lonDeg);
    const bx = Math.max(
      0,
      Math.min(lookup.lonBins - 1, Math.floor(((lonDeg + 180) / 360) * lookup.lonBins)),
    );
    const by = Math.max(
      0,
      Math.min(lookup.latBins - 1, Math.floor(((90 - latDeg) / 180) * lookup.latBins)),
    );
    const start = (by * lookup.lonBins + bx) * lookup.candidateCount;
    const nearest = [];

    for (let i = 0; i < lookup.candidateCount; i += 1) {
      const index = lookup.candidates[start + i];
      if (index === EMPTY_CELL || index >= count) continue;
      const candidate = cellVectors[index];
      const score = candidate.x * vec.x + candidate.y * vec.y + candidate.z * vec.z;
      insertNearest(nearest, { index, score }, neighborCount);
    }

    if (!nearest.length) {
      for (let i = 0; i < cellVectors.length; i += 1) {
        const candidate = cellVectors[i];
        const score = candidate.x * vec.x + candidate.y * vec.y + candidate.z * vec.z;
        insertNearest(nearest, { index: i, score }, neighborCount);
      }
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
      const index = nearest[i].index;
      const weight = totalWeight > 0 ? weights[i] / totalWeight : 1 / nearest.length;
      sample.baseElevationM += baseElevations[index] * weight;
      sample.ridgeStrength += ridgeStrengths[index] * weight;
      sample.trenchStrength += trenchStrengths[index] * weight;
      sample.arcStrength += arcStrengths[index] * weight;
      sample.collisionStrength += collisionStrengths[index] * weight;
      sample.hotspotInfluence += hotspotInfluences[index] * weight;
      sample.superswellInfluence += superswellInfluences[index] * weight;
      sample.coastalStrength += coastalStrengths[index] * weight;
      sample.erosionFactor += erosionFactors[index] * weight;
      sample.coastDistance += coastDistances[index] * weight;
      sample.shelfDistance += shelfDistances[index] * weight;
      sample.slopeDistance += slopeDistances[index] * weight;
      sample.oceanFraction += oceanMask[index] * weight;
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

function shadeForMode(hillshadeValue, mode, reliefStrength = 1) {
  let shade = 1;
  if (mode === "height" || mode === "heightmap") {
    shade = 1;
  } else if (mode === "bathymetry") {
    shade = 0.86 + hillshadeValue * 0.12;
  } else if (mode === "topography") {
    shade = 0.74 + hillshadeValue * 0.22;
  } else {
    shade = 0.52 + hillshadeValue * 0.56;
  }
  const strength = clamp(Number(reliefStrength) || 1, 0, 2.5);
  return clamp(1 + (shade - 1) * strength, 0, 2);
}

function buildTerrainGeometry(model, { width = 1024, height = 512 } = {}) {
  const geometryKey = buildGeometryKey(model, width, height);
  const cached = TERRAIN_GEOMETRY_CACHE.get(geometryKey);
  if (cached) return cached;

  const sampleFields = buildBlendedSampler(model);
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

  const geometry = {
    width,
    height,
    geometryKey,
    heights: smoothHeights(heights, featureMask, width, height, 2),
    cellIds,
  };
  setCache(TERRAIN_GEOMETRY_CACHE, geometryKey, geometry);
  return geometry;
}

function buildTerrainDerivativesFromGeometry(geometry, { planetRadiusM = 6371000 } = {}) {
  const derivativeKey = buildDerivativeKey(geometry.geometryKey, planetRadiusM);
  const cached = TERRAIN_DERIVATIVE_CACHE.get(derivativeKey);
  if (cached) return cached;

  const { slopeDeg, aspectDeg } = buildSlopeAspectRasters(
    geometry.heights,
    geometry.width,
    geometry.height,
    {
      planetRadiusM,
    },
  );
  const hillshade = buildHillshadeRaster(geometry.heights, geometry.width, geometry.height, {
    planetRadiusM,
    slopeDeg,
    aspectDeg,
  });

  const derivatives = {
    width: geometry.width,
    height: geometry.height,
    derivativeKey,
    slopeDeg,
    aspectDeg,
    hillshade,
  };
  setCache(TERRAIN_DERIVATIVE_CACHE, derivativeKey, derivatives);
  return derivatives;
}

function buildTerrainContourMasksFromGeometry(
  geometry,
  { topographyBandStepM = 250, majorEvery = 5 } = {},
) {
  const contourKey = buildContourKey(geometry.geometryKey, topographyBandStepM, majorEvery);
  const cached = TERRAIN_CONTOUR_CACHE.get(contourKey);
  if (cached) return cached;

  const contourHeights = buildContourSourceRaster(
    geometry.heights,
    geometry.width,
    geometry.height,
    {
      passes: 2,
    },
  );
  const contourMasks = buildContourMaskRaster(contourHeights, geometry.width, geometry.height, {
    minorStepM: topographyBandStepM,
    majorEvery,
  });
  const result = {
    width: geometry.width,
    height: geometry.height,
    contourKey,
    contourHeights,
    ...contourMasks,
  };
  setCache(TERRAIN_CONTOUR_CACHE, contourKey, result);
  return result;
}

function buildModeRaster(geometry, derivatives, contourMasks, mode, options = {}) {
  const modeKey = buildModeKey(geometry.geometryKey, mode, options);
  const cached = TERRAIN_MODE_CACHE.get(modeKey);
  if (cached) return cached;

  const colors = new Uint8ClampedArray(geometry.width * geometry.height * 4);
  const topographyBandStepM = Math.max(25, Number(options.topographyBandStepM) || 250);
  const style = buildTerrainModeStyle(mode, {
    terrainStylePreset: options.terrainStylePreset,
    reliefStrength: options.reliefStrength,
    coastlineEmphasis: options.coastlineEmphasis,
    topographyBandStepM,
    topographyPeakColor: options.topographyPeakColor,
  });

  for (let y = 0; y < geometry.height; y += 1) {
    for (let x = 0; x < geometry.width; x += 1) {
      const index = y * geometry.width + x;
      const center = geometry.heights[index];
      let rgb;
      if (mode === "slope") {
        rgb = colorSlopeAngle(derivatives.slopeDeg[index]);
      } else if (mode === "aspect") {
        rgb = colorAspectAngle(derivatives.aspectDeg[index]);
      } else if (mode === "slopeaspect") {
        rgb = colorSlopeAspectValue(derivatives.slopeDeg[index], derivatives.aspectDeg[index]);
      } else {
        const shade = shadeForMode(derivatives.hillshade[index], mode, style.reliefStrength);
        rgb = colorTerrainHeight(style, center, {
          topographyBandStepM,
          applyBands: mode === "topography",
        });
        if (mode !== "heightmap") {
          rgb = applyTerrainCoastlineColor(style, rgb, center);
        }
        rgb = rgb.map((channel) => clamp(channel * shade, 0, 255));
      }
      const [r, g, b] = rgb;
      const pixel = index * 4;
      colors[pixel] = r;
      colors[pixel + 1] = g;
      colors[pixel + 2] = b;
      colors[pixel + 3] = 255;
    }
  }

  const result = {
    width: geometry.width,
    height: geometry.height,
    mode,
    colors,
    heights: geometry.heights,
    cellIds: geometry.cellIds,
    slopeDeg: derivatives.slopeDeg,
    aspectDeg: derivatives.aspectDeg,
    hillshade: derivatives.hillshade,
    contourHeights: contourMasks.contourHeights,
    minorContourMask: contourMasks.minorContourMask,
    majorContourMask: contourMasks.majorContourMask,
    coastContourMask: contourMasks.coastContourMask,
    terrainStylePreset: style.presetId,
    reliefStrength: style.reliefStrength,
    coastlineEmphasis: style.coastlineEmphasis,
    topographyPeakColor: style.topographyPeakColor,
  };
  setCache(TERRAIN_MODE_CACHE, modeKey, result);
  return result;
}

export function buildTerrainDerivativeRaster(
  model,
  { width = 1024, height = 512, topographyBandStepM = 250 } = {},
) {
  const geometry = buildTerrainGeometry(model, { width, height });
  const derivatives = buildTerrainDerivativesFromGeometry(geometry, {
    planetRadiusM: Number(model.planetRadiusM) || 6371000,
  });
  const contourMasks = buildTerrainContourMasksFromGeometry(geometry, { topographyBandStepM });
  return {
    width: geometry.width,
    height: geometry.height,
    heights: geometry.heights,
    cellIds: geometry.cellIds,
    slopeDeg: derivatives.slopeDeg,
    aspectDeg: derivatives.aspectDeg,
    hillshade: derivatives.hillshade,
    contourHeights: contourMasks.contourHeights,
    minorContourMask: contourMasks.minorContourMask,
    majorContourMask: contourMasks.majorContourMask,
    coastContourMask: contourMasks.coastContourMask,
  };
}

export function buildTerrainRaster(
  model,
  {
    width = 1024,
    height = 512,
    mode = "shaded",
    topographyBandStepM = 250,
    terrainStylePreset = "physical",
    reliefStrength = 1,
    coastlineEmphasis = 1,
    topographyPeakColor = null,
  } = {},
) {
  const geometry = buildTerrainGeometry(model, { width, height });
  const derivatives = buildTerrainDerivativesFromGeometry(geometry, {
    planetRadiusM: Number(model.planetRadiusM) || 6371000,
  });
  const contourMasks = buildTerrainContourMasksFromGeometry(geometry, { topographyBandStepM });
  return buildModeRaster(geometry, derivatives, contourMasks, mode, {
    topographyBandStepM,
    terrainStylePreset,
    reliefStrength,
    coastlineEmphasis,
    topographyPeakColor,
  });
}

export function serializeTerrainModel(model) {
  return {
    grid: {
      id: getTerrainGridId(model),
      count: Number(model.grid?.count) || Number(model.cells?.length) || 0,
    },
    timeMyr: getTerrainTime(model),
    cells: (model.cells || []).map((cell) => {
      const centerVec = extractCenterVec(cell);
      return {
        id: cell.id,
        centerLatDeg: cell.centerLatDeg,
        centerLonDeg: cell.centerLonDeg,
        centerVec,
        terrainElevationM: cell.terrainElevationM ?? cell.elevationM ?? 0,
        elevationM: cell.elevationM ?? 0,
        ridgeStrength: cell.ridgeStrength ?? 0,
        trenchStrength: cell.trenchStrength ?? 0,
        arcStrength: cell.arcStrength ?? 0,
        collisionStrength: cell.collisionStrength ?? 0,
        hotspotInfluence: cell.hotspotInfluence ?? 0,
        superswellInfluence: cell.superswellInfluence ?? 0,
        coastalStrength: cell.coastalStrength ?? 0,
        erosionFactor: cell.erosionFactor ?? 0,
        coastDistance: cell.coastDistance ?? 0,
        shelfDistance: cell.shelfDistance ?? 0,
        slopeDistance: cell.slopeDistance ?? 0,
      };
    }),
  };
}

export function getTerrainPreviewSize(quality = "settled") {
  return TERRAIN_PREVIEW_SIZES[quality] || TERRAIN_PREVIEW_SIZES.settled;
}

export function clearTerrainRasterCache() {
  TERRAIN_GEOMETRY_CACHE.clear();
  TERRAIN_DERIVATIVE_CACHE.clear();
  TERRAIN_CONTOUR_CACHE.clear();
  TERRAIN_MODE_CACHE.clear();
  TERRAIN_LOOKUP_CACHE.clear();
}
