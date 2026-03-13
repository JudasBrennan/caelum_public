import { clamp } from "../utils.js";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(1e-9, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function mixColor(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function colorRamp(stops, value) {
  if (!stops.length) return [0, 0, 0];
  if (value <= stops[0][0]) return stops[0][1];
  for (let index = 1; index < stops.length; index += 1) {
    if (value > stops[index][0]) continue;
    const [prevValue, prevColor] = stops[index - 1];
    const [nextValue, nextColor] = stops[index];
    const t = smoothstep(prevValue, nextValue, value);
    return mixColor(prevColor, nextColor, t);
  }
  return stops[stops.length - 1][1];
}

function steppedColor(stops, value) {
  if (!stops.length) return [0, 0, 0];
  if (value <= stops[0][0]) return stops[0][1];
  for (let index = 1; index < stops.length; index += 1) {
    if (value < stops[index][0]) return stops[index - 1][1];
  }
  return stops[stops.length - 1][1];
}

function rgbToHex(rgb) {
  return `#${rgb
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function parseHexColor(value) {
  const normalized = String(value || "").trim();
  const match = /^#?([0-9a-f]{6})$/i.exec(normalized);
  if (!match) return null;
  const hex = match[1];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function quantizeHeightBand(heightM, stepM) {
  const step = Math.max(25, Number(stepM) || 250);
  if (Math.abs(heightM) < step * 0.35) return 0;
  return Math.round(heightM / step) * step;
}

function grayscaleColor(value, min, max) {
  const t = smoothstep(min, max, value);
  const channel = Math.round(lerp(20, 245, t));
  return [channel, channel, channel];
}

const PRESETS = Object.freeze({
  physical: {
    label: "Physical",
    reliefStrength: 1,
    coastlineEmphasis: 1,
    coastlineLandColor: [245, 247, 225],
    coastlineOceanColor: [228, 246, 248],
    terrain: {
      continuous: true,
      oceanBreakpoints: [
        [-11000, [7, 27, 67]],
        [-7000, [12, 47, 98]],
        [-4000, [25, 78, 140]],
        [-1200, [74, 124, 168]],
        [-250, [116, 151, 179]],
        [0, [160, 186, 191]],
      ],
      landBreakpoints: [
        [0, [84, 106, 70]],
        [350, [102, 126, 79]],
        [1200, [126, 137, 92]],
        [2600, [140, 122, 89]],
        [4200, [165, 145, 117]],
        [6500, [186, 169, 152]],
        [9000, [232, 230, 228]],
        [12000, [250, 249, 248]],
      ],
    },
    topography: {
      continuous: false,
      oceanBreakpoints: [
        [-11000, [11, 22, 72]],
        [-8000, [18, 46, 122]],
        [-6000, [20, 73, 164]],
        [-3500, [31, 116, 196]],
        [-1800, [72, 175, 221]],
        [-600, [122, 214, 235]],
        [-80, [190, 240, 245]],
        [0, [220, 248, 247]],
      ],
      landBreakpoints: [
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
    },
    bathymetry: {
      continuous: true,
      oceanBreakpoints: [
        [-11000, [5, 18, 58]],
        [-8000, [10, 34, 95]],
        [-6000, [14, 58, 131]],
        [-3200, [25, 92, 166]],
        [-1400, [54, 144, 205]],
        [-450, [121, 197, 227]],
        [0, [188, 228, 239]],
      ],
      landBreakpoints: [
        [0, [180, 210, 176]],
        [1200, [190, 198, 170]],
        [3200, [201, 194, 171]],
        [7000, [225, 224, 219]],
        [12000, [247, 247, 245]],
      ],
    },
  },
  atlas: {
    label: "Atlas",
    reliefStrength: 1.1,
    coastlineEmphasis: 1.15,
    coastlineLandColor: [250, 249, 233],
    coastlineOceanColor: [240, 249, 252],
    terrain: {
      continuous: true,
      oceanBreakpoints: [
        [-11000, [7, 24, 77]],
        [-8000, [12, 44, 121]],
        [-5000, [22, 86, 173]],
        [-2200, [48, 139, 213]],
        [-700, [103, 192, 226]],
        [0, [179, 227, 237]],
      ],
      landBreakpoints: [
        [0, [96, 164, 97]],
        [250, [116, 182, 102]],
        [900, [164, 207, 114]],
        [1800, [214, 211, 130]],
        [3200, [197, 160, 94]],
        [5000, [164, 120, 84]],
        [7600, [202, 194, 183]],
        [12000, [252, 252, 251]],
      ],
    },
    topography: {
      continuous: false,
      oceanBreakpoints: [
        [-11000, [10, 26, 92]],
        [-8000, [15, 52, 141]],
        [-5200, [25, 93, 189]],
        [-2600, [53, 148, 216]],
        [-900, [114, 208, 235]],
        [-120, [196, 241, 245]],
        [0, [230, 248, 247]],
      ],
      landBreakpoints: [
        [0, [112, 199, 117]],
        [200, [132, 208, 106]],
        [700, [186, 213, 109]],
        [1400, [223, 215, 136]],
        [2400, [211, 180, 112]],
        [3600, [189, 141, 88]],
        [5200, [158, 108, 78]],
        [7000, [198, 190, 182]],
        [12000, [255, 255, 255]],
      ],
    },
    bathymetry: {
      continuous: true,
      oceanBreakpoints: [
        [-11000, [7, 18, 74]],
        [-8500, [11, 36, 118]],
        [-6000, [17, 67, 160]],
        [-3200, [34, 117, 199]],
        [-1200, [80, 183, 223]],
        [0, [176, 229, 241]],
      ],
      landBreakpoints: [
        [0, [198, 218, 180]],
        [1200, [206, 204, 165]],
        [4000, [206, 192, 169]],
        [12000, [246, 245, 242]],
      ],
    },
  },
  survey: {
    label: "Survey",
    reliefStrength: 0.95,
    coastlineEmphasis: 1.35,
    coastlineLandColor: [253, 251, 236],
    coastlineOceanColor: [246, 252, 255],
    terrain: {
      continuous: false,
      oceanBreakpoints: [
        [-11000, [18, 34, 94]],
        [-8000, [24, 62, 138]],
        [-5000, [40, 104, 181]],
        [-2500, [88, 161, 213]],
        [-900, [160, 214, 236]],
        [0, [215, 239, 246]],
      ],
      landBreakpoints: [
        [0, [148, 205, 126]],
        [180, [161, 209, 118]],
        [450, [191, 212, 128]],
        [900, [217, 210, 138]],
        [1800, [206, 188, 128]],
        [3000, [184, 154, 107]],
        [4500, [156, 120, 92]],
        [7000, [206, 198, 190]],
        [12000, [248, 247, 245]],
      ],
    },
    topography: {
      continuous: false,
      oceanBreakpoints: [
        [-11000, [24, 40, 104]],
        [-8000, [32, 72, 152]],
        [-5500, [45, 112, 188]],
        [-2800, [86, 170, 217]],
        [-1000, [158, 216, 236]],
        [-100, [218, 242, 247]],
        [0, [240, 249, 250]],
      ],
      landBreakpoints: [
        [0, [154, 211, 125]],
        [250, [171, 213, 120]],
        [600, [196, 214, 126]],
        [1200, [222, 214, 139]],
        [2200, [210, 188, 128]],
        [3400, [183, 151, 107]],
        [4800, [153, 115, 93]],
        [7000, [194, 186, 180]],
        [12000, [250, 250, 248]],
      ],
    },
    bathymetry: {
      continuous: false,
      oceanBreakpoints: [
        [-11000, [16, 28, 84]],
        [-8000, [20, 53, 126]],
        [-5200, [30, 92, 171]],
        [-2600, [68, 146, 207]],
        [-800, [146, 207, 233]],
        [0, [225, 242, 246]],
      ],
      landBreakpoints: [
        [0, [220, 225, 204]],
        [1400, [215, 212, 186]],
        [4200, [202, 188, 166]],
        [12000, [248, 248, 246]],
      ],
    },
  },
  bathymetry: {
    label: "Bathymetry",
    reliefStrength: 1,
    coastlineEmphasis: 1.05,
    coastlineLandColor: [242, 239, 223],
    coastlineOceanColor: [233, 247, 252],
    terrain: {
      continuous: true,
      oceanBreakpoints: [
        [-11000, [6, 18, 72]],
        [-8000, [10, 32, 118]],
        [-5500, [18, 64, 162]],
        [-2600, [41, 122, 207]],
        [-850, [111, 198, 232]],
        [0, [202, 236, 243]],
      ],
      landBreakpoints: [
        [0, [136, 181, 128]],
        [800, [170, 192, 149]],
        [2200, [190, 186, 158]],
        [5000, [205, 194, 177]],
        [12000, [244, 243, 239]],
      ],
    },
    topography: {
      continuous: false,
      oceanBreakpoints: [
        [-11000, [7, 18, 78]],
        [-8500, [12, 38, 132]],
        [-6000, [20, 76, 177]],
        [-3000, [45, 138, 213]],
        [-900, [120, 207, 236]],
        [-100, [213, 241, 247]],
        [0, [238, 247, 248]],
      ],
      landBreakpoints: [
        [0, [184, 204, 168]],
        [600, [190, 196, 154]],
        [1600, [199, 191, 151]],
        [3200, [185, 163, 129]],
        [5200, [170, 147, 129]],
        [8000, [221, 218, 215]],
        [12000, [251, 251, 249]],
      ],
    },
    bathymetry: {
      continuous: true,
      oceanBreakpoints: [
        [-11000, [5, 14, 64]],
        [-8500, [8, 28, 101]],
        [-6500, [12, 54, 142]],
        [-4200, [18, 88, 183]],
        [-2200, [40, 135, 215]],
        [-700, [108, 199, 234]],
        [0, [208, 239, 246]],
      ],
      landBreakpoints: [
        [0, [227, 227, 214]],
        [2200, [214, 205, 190]],
        [12000, [245, 244, 240]],
      ],
    },
  },
});

export const TERRAIN_STYLE_PRESET_OPTIONS = Object.freeze(
  Object.entries(PRESETS).map(([id, preset]) =>
    Object.freeze({
      id,
      label: preset.label,
    }),
  ),
);

function hueToRgb(p, q, t) {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

function hslToRgb(h, s, l) {
  const hue = (((h % 360) + 360) % 360) / 360;
  const sat = clamp(s, 0, 1);
  const light = clamp(l, 0, 1);
  if (sat <= 1e-6) {
    const channel = Math.round(light * 255);
    return [channel, channel, channel];
  }
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  return [
    Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, hue) * 255),
    Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  ];
}

function resolvePreset(id) {
  return PRESETS[id] || PRESETS.physical;
}

function buildTopographyPeakLandBreakpoints(landBreakpoints, peakColor) {
  const parsedPeak = parseHexColor(peakColor);
  if (!parsedPeak || !Array.isArray(landBreakpoints) || !landBreakpoints.length) {
    return landBreakpoints;
  }
  const minValue = landBreakpoints[0][0];
  const maxValue = landBreakpoints[landBreakpoints.length - 1][0];
  return landBreakpoints.map(([value, color]) => {
    const t = smoothstep(minValue, maxValue, value);
    const tintMix = Math.pow(t, 1.08) * 0.88;
    const highlightedPeak = mixColor(parsedPeak, [255, 255, 255], 0.08 * t);
    return [value, mixColor(color, highlightedPeak, tintMix)];
  });
}

export function getDefaultTopographyPeakColor(presetId = "physical") {
  const preset = resolvePreset(presetId);
  const landBreakpoints =
    preset.topography?.landBreakpoints || preset.terrain?.landBreakpoints || [];
  if (!landBreakpoints.length) return "#8f6f5b";
  const source =
    landBreakpoints[Math.max(0, landBreakpoints.length - 3)]?.[1] ||
    landBreakpoints[landBreakpoints.length - 1][1];
  return rgbToHex(source);
}

export function buildTerrainModeStyle(mode, options = {}) {
  if (mode === "heightmap") {
    return {
      mode,
      presetId: "raw-height",
      kind: "grayscale",
      min: -11000,
      max: 12000,
      reliefStrength: 1,
      coastlineEmphasis: 0,
      breakAtSeaLevel: false,
    };
  }

  const presetId = String(options.terrainStylePreset || "physical");
  const preset = resolvePreset(presetId);
  const styleMode = mode === "shaded" || mode === "height" ? "terrain" : mode;
  const base = preset[styleMode] || preset.terrain;
  const topographyPeakColor =
    styleMode === "topography"
      ? String(options.topographyPeakColor || getDefaultTopographyPeakColor(presetId))
      : null;
  return {
    mode,
    presetId: PRESETS[presetId] ? presetId : "physical",
    kind: "hypsometric",
    breakAtSeaLevel: true,
    continuous: Boolean(base.continuous),
    oceanBreakpoints: base.oceanBreakpoints,
    landBreakpoints:
      styleMode === "topography"
        ? buildTopographyPeakLandBreakpoints(base.landBreakpoints, topographyPeakColor)
        : base.landBreakpoints,
    reliefStrength: clamp(
      Number(options.reliefStrength ?? preset.reliefStrength ?? 1) || 0,
      0,
      2.5,
    ),
    coastlineEmphasis: clamp(
      Number(options.coastlineEmphasis ?? preset.coastlineEmphasis ?? 1) || 0,
      0,
      2.5,
    ),
    coastlineLandColor: preset.coastlineLandColor,
    coastlineOceanColor: preset.coastlineOceanColor,
    topographyPeakColor,
  };
}

export function colorTerrainHeight(
  style,
  heightM,
  { topographyBandStepM = 250, applyBands = false } = {},
) {
  if (!style || style.kind === "grayscale") {
    return grayscaleColor(heightM, style?.min ?? -11000, style?.max ?? 12000);
  }

  const breakpoints =
    heightM < 0 && style.breakAtSeaLevel ? style.oceanBreakpoints : style.landBreakpoints;
  const sampleHeight = applyBands ? quantizeHeightBand(heightM, topographyBandStepM) : heightM;
  return style.continuous
    ? colorRamp(breakpoints, sampleHeight)
    : steppedColor(breakpoints, sampleHeight);
}

export function applyTerrainCoastlineColor(style, rgb, heightM) {
  if (!style || style.kind !== "hypsometric") return rgb;
  const emphasis = clamp(Number(style.coastlineEmphasis) || 0, 0, 2.5);
  if (emphasis <= 0.01) return rgb;
  const coastBandM = 60 + emphasis * 320;
  const proximity = clamp(1 - Math.abs(heightM) / Math.max(80, coastBandM), 0, 1);
  if (proximity <= 0) return rgb;
  const target = heightM < 0 ? style.coastlineOceanColor : style.coastlineLandColor;
  const mix = proximity * 0.22 * emphasis;
  return mixColor(rgb, target, mix);
}

export function colorSlopeAngle(slopeDeg) {
  return colorRamp(
    [
      [0, [243, 241, 235]],
      [2, [224, 218, 196]],
      [6, [208, 194, 149]],
      [12, [190, 163, 101]],
      [20, [170, 127, 67]],
      [32, [130, 86, 38]],
      [50, [90, 48, 23]],
      [90, [34, 18, 12]],
    ],
    clamp(Number(slopeDeg) || 0, 0, 90),
  );
}

export function colorAspectAngle(aspectDeg) {
  const hue = (((Number(aspectDeg) || 0) % 360) + 360) % 360;
  return hslToRgb(hue, 0.72, 0.54);
}

export function colorSlopeAspectValue(slopeDeg, aspectDeg) {
  const base = colorAspectAngle(aspectDeg);
  const slope = clamp((Number(slopeDeg) || 0) / 35, 0, 1);
  const gray = colorRamp(
    [
      [0, [224, 226, 228]],
      [1, [245, 246, 247]],
    ],
    1 - slope,
  );
  return mixColor(gray, base, slope);
}
