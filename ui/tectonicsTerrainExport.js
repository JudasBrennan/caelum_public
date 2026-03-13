export const TERRAIN_EXPORT_PRESET_OPTIONS = Object.freeze([
  Object.freeze({ id: "preview", label: "Preview Match" }),
  Object.freeze({ id: "atlas", label: "Atlas" }),
  Object.freeze({ id: "survey", label: "Survey" }),
]);

export const TERRAIN_EXPORT_SIZE_OPTIONS = Object.freeze([
  Object.freeze({ id: "preview", label: "Preview Match" }),
  Object.freeze({ id: "standard", label: "Standard (2048 x 1024)" }),
  Object.freeze({ id: "high", label: "High (4096 x 2048)" }),
]);

const SIZE_PRESETS = Object.freeze({
  standard: Object.freeze({ width: 2048, height: 1024 }),
  high: Object.freeze({ width: 4096, height: 2048 }),
});

export function resolveTerrainExportProfile({
  mode = "shaded",
  previewWidth = 1024,
  previewHeight = 512,
  exportPreset = "preview",
  exportSize = "preview",
  terrainStylePreset = "physical",
  reliefStrength = 1,
  coastlineEmphasis = 1,
  topographyBandStepM = 250,
  topographyPeakColor = null,
  contourMajorEvery = 5,
  showMinorContours = true,
  showOceanContours = true,
} = {}) {
  const size = SIZE_PRESETS[exportSize] || {
    width: Math.max(256, Number(previewWidth) || 1024),
    height: Math.max(128, Number(previewHeight) || 512),
  };

  const resolved = {
    mode,
    width: size.width,
    height: size.height,
    terrainStylePreset,
    reliefStrength,
    coastlineEmphasis,
    topographyBandStepM,
    topographyPeakColor,
    contourMajorEvery,
    showMinorContours,
    showOceanContours,
  };

  if (exportPreset === "atlas") {
    resolved.terrainStylePreset = "atlas";
    resolved.reliefStrength = Math.max(1.1, Number(reliefStrength) || 0);
    resolved.coastlineEmphasis = Math.max(1.15, Number(coastlineEmphasis) || 0);
    if (mode === "topography") {
      resolved.topographyBandStepM = 250;
      resolved.contourMajorEvery = 5;
      resolved.showMinorContours = true;
      resolved.showOceanContours = true;
    }
  } else if (exportPreset === "survey") {
    resolved.terrainStylePreset = "survey";
    resolved.reliefStrength = Math.max(0.95, Number(reliefStrength) || 0);
    resolved.coastlineEmphasis = Math.max(1.35, Number(coastlineEmphasis) || 0);
    if (mode === "topography") {
      resolved.topographyBandStepM = 150;
      resolved.contourMajorEvery = 5;
      resolved.showMinorContours = true;
      resolved.showOceanContours = false;
    }
  }

  return resolved;
}
