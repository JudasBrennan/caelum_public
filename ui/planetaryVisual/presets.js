import {
  buildPlanetaryVisualControlManifest,
  getPlanetaryVisualManifestContext,
  hasVisualControl,
} from "./controlManifest.js";
import { normalizeVisualOverrides, stripEmptyVisualOverrides } from "./overrides.js";

export const VISUAL_PRESET_CATALOG_VERSION = 1;

const PRESET_GROUPS = Object.freeze({
  ROCKY: "rocky",
  VOLATILE: "volatile",
  GAS: "gas",
  BROWN_DWARF: "brownDwarf",
});

function preset(definition) {
  return Object.freeze({
    visualMode: "custom",
    requiredGroups: Object.freeze([]),
    requiredControls: Object.freeze([]),
    overrides: Object.freeze({}),
    ...definition,
  });
}

export const VISUAL_PRESETS = Object.freeze([
  preset({
    id: "auto-recommended",
    label: "Auto recommended",
    visualMode: "auto",
    description: "Use the generated science-driven appearance.",
  }),
  preset({
    id: "rocky-terrestrial",
    label: "Rocky terrestrial",
    requiredGroups: Object.freeze([PRESET_GROUPS.ROCKY]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#7d7061", secondary: "#b6aa94", accent: "#d3c19c" }),
      surface: Object.freeze({
        landCoverage: 0.82,
        oceanCoverage: 0.08,
        craterDensity: 0.22,
        roughness: 0.5,
      }),
      atmosphere: Object.freeze({ thickness: 0.16, haze: 0.1, colour: "#b9c7df" }),
      clouds: Object.freeze({ coverage: 0.2, opacity: 0.25, colour: "#f1eee2" }),
      material: Object.freeze({ roughness: 0.72 }),
    }),
  }),
  preset({
    id: "ocean-world",
    label: "Ocean world",
    requiredGroups: Object.freeze([PRESET_GROUPS.ROCKY, PRESET_GROUPS.VOLATILE]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#1f5f8f", secondary: "#2b8fc4", accent: "#8dd1dd" }),
      surface: Object.freeze({
        oceanCoverage: 0.88,
        landCoverage: 0.08,
        iceCoverage: 0.06,
        roughness: 0.22,
      }),
      atmosphere: Object.freeze({ thickness: 0.34, haze: 0.18, colour: "#8eb6d3" }),
      clouds: Object.freeze({ coverage: 0.56, opacity: 0.46, colour: "#eef7f9" }),
      material: Object.freeze({ roughness: 0.38 }),
    }),
  }),
  preset({
    id: "arid-desert-world",
    label: "Arid/desert world",
    requiredGroups: Object.freeze([PRESET_GROUPS.ROCKY]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#b7844a", secondary: "#d8b16e", accent: "#73533a" }),
      surface: Object.freeze({
        landCoverage: 0.96,
        oceanCoverage: 0.01,
        craterDensity: 0.16,
        roughness: 0.74,
      }),
      atmosphere: Object.freeze({ thickness: 0.12, haze: 0.28, colour: "#e2b889" }),
      clouds: Object.freeze({ coverage: 0.08, opacity: 0.14, colour: "#f0d6aa" }),
      material: Object.freeze({ roughness: 0.86 }),
    }),
  }),
  preset({
    id: "icy-dwarf",
    label: "Icy dwarf",
    requiredGroups: Object.freeze([PRESET_GROUPS.ROCKY]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#dce9ed", secondary: "#9fb8c4", accent: "#657987" }),
      surface: Object.freeze({
        iceCoverage: 0.84,
        landCoverage: 0.16,
        craterDensity: 0.42,
        roughness: 0.46,
      }),
      atmosphere: Object.freeze({ thickness: 0.04, haze: 0.08, colour: "#b7d9ef" }),
      clouds: Object.freeze({ coverage: 0.04, opacity: 0.08, colour: "#f3fbff" }),
      material: Object.freeze({ roughness: 0.58 }),
    }),
  }),
  preset({
    id: "lava-world",
    label: "Lava world",
    requiredGroups: Object.freeze([PRESET_GROUPS.ROCKY]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#26211e", secondary: "#5f3123", accent: "#ff6b21" }),
      surface: Object.freeze({ landCoverage: 1, craterDensity: 0.08, roughness: 0.82 }),
      atmosphere: Object.freeze({ thickness: 0.22, haze: 0.52, colour: "#d96a3f" }),
      clouds: Object.freeze({ coverage: 0.2, opacity: 0.3, colour: "#5f5750" }),
      material: Object.freeze({ roughness: 0.88, emissive: 0.74 }),
    }),
  }),
  preset({
    id: "iron-rich",
    label: "Iron-rich",
    requiredGroups: Object.freeze([PRESET_GROUPS.ROCKY]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#5e4b42", secondary: "#8f695a", accent: "#c79065" }),
      surface: Object.freeze({ landCoverage: 0.98, craterDensity: 0.28, roughness: 0.68 }),
      atmosphere: Object.freeze({ thickness: 0.08, haze: 0.12, colour: "#b58a74" }),
      material: Object.freeze({ roughness: 0.54, metalness: 0.34 }),
    }),
  }),
  preset({
    id: "carbon-rich",
    label: "Carbon-rich",
    requiredGroups: Object.freeze([PRESET_GROUPS.ROCKY]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#282523", secondary: "#4b4741", accent: "#b2a46c" }),
      surface: Object.freeze({ landCoverage: 0.94, craterDensity: 0.34, roughness: 0.78 }),
      atmosphere: Object.freeze({ thickness: 0.1, haze: 0.18, colour: "#9d927f" }),
      material: Object.freeze({ roughness: 0.7 }),
    }),
  }),
  preset({
    id: "steam-world",
    label: "Steam world",
    requiredGroups: Object.freeze([PRESET_GROUPS.ROCKY, PRESET_GROUPS.VOLATILE]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#6fa9b4", secondary: "#c7d8dd", accent: "#f5f0dc" }),
      surface: Object.freeze({ oceanCoverage: 0.72, landCoverage: 0.06, roughness: 0.2 }),
      atmosphere: Object.freeze({ thickness: 0.76, haze: 0.64, colour: "#d8edf2" }),
      clouds: Object.freeze({ coverage: 0.9, opacity: 0.78, colour: "#f3f7f6" }),
    }),
  }),
  preset({
    id: "hycean-candidate",
    label: "Hycean candidate",
    requiredGroups: Object.freeze([PRESET_GROUPS.VOLATILE]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#103e61", secondary: "#1f7e9a", accent: "#77dfd8" }),
      atmosphere: Object.freeze({ thickness: 0.82, haze: 0.5, colour: "#79b6c7" }),
      clouds: Object.freeze({ coverage: 0.64, opacity: 0.62, colour: "#e6fbf7" }),
    }),
  }),
  preset({
    id: "mini-neptune-haze",
    label: "Mini-Neptune haze",
    requiredGroups: Object.freeze([PRESET_GROUPS.VOLATILE]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#6c8d9c", secondary: "#b7b798", accent: "#e8d39b" }),
      atmosphere: Object.freeze({ thickness: 0.86, haze: 0.72, colour: "#c7c49d" }),
      clouds: Object.freeze({ coverage: 0.74, opacity: 0.58, colour: "#efe0ad" }),
      bands: Object.freeze({ count: 5, contrast: 0.18, turbulence: 0.32, shear: 0.28 }),
      storms: Object.freeze({ count: 1, intensity: 0.18, greatSpot: false }),
    }),
  }),
  preset({
    id: "super-puff",
    label: "Super-puff",
    requiredGroups: Object.freeze([PRESET_GROUPS.VOLATILE, PRESET_GROUPS.GAS]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#e5d6bc", secondary: "#f6eedf", accent: "#b9cbd5" }),
      atmosphere: Object.freeze({ thickness: 0.96, haze: 0.86, colour: "#e7ddc6" }),
      clouds: Object.freeze({ coverage: 0.82, opacity: 0.52, colour: "#fff6e7" }),
      bands: Object.freeze({ count: 4, contrast: 0.1, turbulence: 0.18, shear: 0.14 }),
      storms: Object.freeze({ count: 0, intensity: 0.06, greatSpot: false }),
    }),
  }),
  preset({
    id: "jupiter-like",
    label: "Jupiter-like",
    requiredGroups: Object.freeze([PRESET_GROUPS.GAS, PRESET_GROUPS.VOLATILE]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#c79b6d", secondary: "#ead5b0", accent: "#8f4f3e" }),
      atmosphere: Object.freeze({ thickness: 0.84, haze: 0.18, colour: "#d8c29e" }),
      bands: Object.freeze({ count: 10, contrast: 0.58, turbulence: 0.42, shear: 0.5 }),
      storms: Object.freeze({ count: 3, intensity: 0.62, greatSpot: true }),
      material: Object.freeze({ roughness: 0.42 }),
    }),
  }),
  preset({
    id: "saturnian",
    label: "Saturnian",
    requiredGroups: Object.freeze([PRESET_GROUPS.GAS, PRESET_GROUPS.VOLATILE]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#d9c993", secondary: "#f0e4bd", accent: "#a78d5a" }),
      atmosphere: Object.freeze({ thickness: 0.82, haze: 0.32, colour: "#e5d49f" }),
      bands: Object.freeze({ count: 8, contrast: 0.24, turbulence: 0.22, shear: 0.3 }),
      storms: Object.freeze({ count: 1, intensity: 0.2, greatSpot: false }),
      rings: Object.freeze({
        enabled: true,
        styleId: "saturnian-bright",
        opacity: 0.54,
        inner: 1.23,
        outer: 2.18,
      }),
      material: Object.freeze({ roughness: 0.48 }),
    }),
  }),
  preset({
    id: "neptune-like",
    label: "Neptune-like",
    requiredGroups: Object.freeze([PRESET_GROUPS.GAS, PRESET_GROUPS.VOLATILE]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#2757a8", secondary: "#3c8ccc", accent: "#b9ecf2" }),
      atmosphere: Object.freeze({ thickness: 0.88, haze: 0.24, colour: "#578fd2" }),
      bands: Object.freeze({ count: 5, contrast: 0.28, turbulence: 0.38, shear: 0.34 }),
      storms: Object.freeze({ count: 2, intensity: 0.42, greatSpot: false }),
      material: Object.freeze({ roughness: 0.36 }),
    }),
  }),
  preset({
    id: "brown-dwarf-l",
    label: "Brown dwarf L",
    requiredGroups: Object.freeze([PRESET_GROUPS.BROWN_DWARF]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#8f4730", secondary: "#d28b56", accent: "#f1bd72" }),
      atmosphere: Object.freeze({ thickness: 0.92, haze: 0.38, colour: "#c76c45" }),
      bands: Object.freeze({ count: 7, contrast: 0.34, turbulence: 0.48, shear: 0.26 }),
      material: Object.freeze({ roughness: 0.5, metalness: 0.04 }),
    }),
  }),
  preset({
    id: "brown-dwarf-t",
    label: "Brown dwarf T",
    requiredGroups: Object.freeze([PRESET_GROUPS.BROWN_DWARF]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#9b6551", secondary: "#c59a7c", accent: "#7c8eb0" }),
      atmosphere: Object.freeze({ thickness: 0.9, haze: 0.32, colour: "#a88070" }),
      bands: Object.freeze({ count: 6, contrast: 0.26, turbulence: 0.38, shear: 0.22 }),
      material: Object.freeze({ roughness: 0.54, metalness: 0.03 }),
    }),
  }),
  preset({
    id: "brown-dwarf-y",
    label: "Brown dwarf Y",
    requiredGroups: Object.freeze([PRESET_GROUPS.BROWN_DWARF]),
    overrides: Object.freeze({
      palette: Object.freeze({ primary: "#6b5e5a", secondary: "#8a8077", accent: "#b3c1cb" }),
      atmosphere: Object.freeze({ thickness: 0.88, haze: 0.42, colour: "#8f8881" }),
      bands: Object.freeze({ count: 4, contrast: 0.18, turbulence: 0.26, shear: 0.18 }),
      material: Object.freeze({ roughness: 0.62, metalness: 0.02 }),
    }),
  }),
]);

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepClone(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value;
  return JSON.parse(JSON.stringify(value));
}

function collectOverridePaths(value, prefix = "", out = []) {
  if (!isPlainObject(value)) {
    if (prefix) out.push(prefix);
    return out;
  }
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    collectOverridePaths(child, path, out);
  }
  return out;
}

function groupsForContext(context) {
  const group = context?.familyGroup || getPlanetaryVisualManifestContext(context).familyGroup;
  if (group === PRESET_GROUPS.VOLATILE) return new Set([PRESET_GROUPS.VOLATILE]);
  if (group === PRESET_GROUPS.GAS) return new Set([PRESET_GROUPS.GAS]);
  if (group === PRESET_GROUPS.BROWN_DWARF) return new Set([PRESET_GROUPS.BROWN_DWARF]);
  if (group === PRESET_GROUPS.ROCKY) return new Set([PRESET_GROUPS.ROCKY]);
  return new Set();
}

function presetGroupsMatch(visualPreset, context) {
  if (!visualPreset.requiredGroups?.length) return true;
  const availableGroups = groupsForContext(context);
  return visualPreset.requiredGroups.some((group) => availableGroups.has(group));
}

function presetControlsAvailable(visualPreset, manifest) {
  const paths = [
    ...(visualPreset.requiredControls || []),
    ...collectOverridePaths(visualPreset.overrides || {}),
  ];
  return paths.every((path) => hasVisualControl(manifest, path));
}

export function getPlanetaryVisualPreset(id) {
  const found = VISUAL_PRESETS.find((visualPreset) => visualPreset.id === id);
  return found ? deepClone(found) : null;
}

export function isPlanetaryVisualPresetAvailable(id, source = {}) {
  const visualPreset = VISUAL_PRESETS.find((candidate) => candidate.id === id);
  if (!visualPreset) return false;
  if (visualPreset.visualMode === "auto") return true;
  const manifest = buildPlanetaryVisualControlManifest(source);
  return (
    presetGroupsMatch(visualPreset, manifest.context) &&
    presetControlsAvailable(visualPreset, manifest)
  );
}

export function listPlanetaryVisualPresets(source = {}) {
  const manifest = buildPlanetaryVisualControlManifest(source);
  return VISUAL_PRESETS.filter(
    (visualPreset) =>
      visualPreset.visualMode === "auto" ||
      (presetGroupsMatch(visualPreset, manifest.context) &&
        presetControlsAvailable(visualPreset, manifest)),
  ).map((visualPreset) => ({
    id: visualPreset.id,
    label: visualPreset.label,
    description: visualPreset.description || "",
    visualMode: visualPreset.visualMode,
  }));
}

export function buildPlanetaryVisualPresetPatch(id, source = {}) {
  const visualPreset = VISUAL_PRESETS.find((candidate) => candidate.id === id);
  if (!visualPreset) return null;
  if (visualPreset.visualMode === "auto") {
    return {
      presetId: visualPreset.id,
      visualMode: "auto",
      visualOverrides: null,
    };
  }
  if (!isPlanetaryVisualPresetAvailable(id, source)) return null;
  const manifest = buildPlanetaryVisualControlManifest(source);
  const visualOverrides = stripEmptyVisualOverrides(
    normalizeVisualOverrides(
      {
        presetId: visualPreset.id,
        ...deepClone(visualPreset.overrides),
      },
      manifest,
    ),
  );
  return {
    presetId: visualPreset.id,
    visualMode: visualPreset.visualMode,
    visualOverrides,
  };
}
