import { PLANETARY_SUBTYPE_LABELS, PLANETARY_SUBTYPES } from "../../engine/planetarySubtypes.js";
import { RING_STYLE_OPTIONS } from "../ringAppearanceProfiles.js";

export const VISUAL_CONTROL_MANIFEST_VERSION = 1;

const ROCKY_FAMILIES = new Set(["dwarfRocky", "rocky", "superEarth", "radiusValley"]);
const VOLATILE_FAMILIES = new Set(["volatileCandidate", "miniNeptune"]);
const GAS_FAMILIES = new Set(["iceGiant", "gasGiant"]);
const BROWN_DWARF_FAMILIES = new Set(["brownDwarf"]);

const SECTION_LABELS = Object.freeze({
  generation: "Generation",
  palette: "Palette",
  surface: "Surface",
  atmosphere: "Atmosphere",
  clouds: "Clouds",
  bands: "Bands",
  storms: "Storms",
  rings: "Rings",
  subtype: "Subtype",
  material: "Material",
});

const SUBTYPE_OPTIONS = Object.freeze(
  Object.values(PLANETARY_SUBTYPES).map((id) => ({
    value: id,
    label: PLANETARY_SUBTYPE_LABELS[id] || id,
  })),
);

const RING_STYLE_SELECT_OPTIONS = Object.freeze(
  RING_STYLE_OPTIONS.map((option) => ({ value: option.id, label: option.label })),
);

function control(id, label, type, options = {}) {
  return Object.freeze({
    id,
    path: id,
    label,
    type,
    ...options,
  });
}

const CONTROL_DEFS = Object.freeze({
  seed: control("seed", "Generation seed", "text", {
    help: "Controls the procedural texture layout. Leave blank to use the automatic body seed.",
  }),
  "palette.primary": control("palette.primary", "Primary color", "color"),
  "palette.secondary": control("palette.secondary", "Secondary color", "color"),
  "palette.accent": control("palette.accent", "Accent color", "color"),
  "surface.ocean.colour": control("surface.ocean.colour", "Ocean color", "color"),
  "surface.ice.colour": control("surface.ice.colour", "Ice color", "color"),
  "surface.landCoverage": control("surface.landCoverage", "Land coverage", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "surface.oceanCoverage": control("surface.oceanCoverage", "Ocean coverage", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "surface.iceCoverage": control("surface.iceCoverage", "Ice coverage", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "surface.craterDensity": control("surface.craterDensity", "Crater density", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "surface.roughness": control("surface.roughness", "Roughness", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "surface.terrainContrast": control("surface.terrainContrast", "Terrain contrast", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "surface.vegetationCoverage": control(
    "surface.vegetationCoverage",
    "Vegetation coverage",
    "range",
    {
      min: 0,
      max: 1,
      step: 0.01,
    },
  ),
  "surface.desertCoverage": control("surface.desertCoverage", "Desert coverage", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "surface.lavaCoverage": control("surface.lavaCoverage", "Lava coverage", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "atmosphere.thickness": control("atmosphere.thickness", "Thickness", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "atmosphere.colour": control("atmosphere.colour", "Atmosphere color", "color"),
  "atmosphere.haze": control("atmosphere.haze", "Haze", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "atmosphere.limbGlow": control("atmosphere.limbGlow", "Limb glow", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "atmosphere.envelopeTint": control("atmosphere.envelopeTint", "Envelope tint", "color"),
  "clouds.coverage": control("clouds.coverage", "Coverage", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "clouds.opacity": control("clouds.opacity", "Opacity", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "clouds.colour": control("clouds.colour", "Cloud color", "color"),
  "clouds.softness": control("clouds.softness", "Softness", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "clouds.cloudDeck": control("clouds.cloudDeck", "Cloud deck", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "bands.count": control("bands.count", "Band count", "number", {
    min: 1,
    max: 16,
    step: 1,
  }),
  "bands.contrast": control("bands.contrast", "Band contrast", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "bands.turbulence": control("bands.turbulence", "Turbulence", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "bands.shear": control("bands.shear", "Shear", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "bands.polarTint": control("bands.polarTint", "Polar tint", "color"),
  "storms.count": control("storms.count", "Storm count", "number", {
    min: 0,
    max: 8,
    step: 1,
  }),
  "storms.intensity": control("storms.intensity", "Storm intensity", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "storms.greatSpot": control("storms.greatSpot", "Persistent oval", "boolean"),
  "rings.enabled": control("rings.enabled", "Enabled", "boolean"),
  "rings.opacity": control("rings.opacity", "Opacity", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "rings.inner": control("rings.inner", "Inner radius", "range", {
    min: 1.05,
    max: 2.4,
    step: 0.01,
  }),
  "rings.outer": control("rings.outer", "Outer radius", "range", {
    min: 1.2,
    max: 3,
    step: 0.01,
  }),
  "rings.tiltDeg": control("rings.tiltDeg", "Tilt", "number", {
    min: 0,
    max: 180,
    step: 1,
  }),
  "rings.yawDeg": control("rings.yawDeg", "Yaw", "number", {
    min: 0,
    max: 360,
    step: 1,
  }),
  "rings.styleId": control("rings.styleId", "Ring style", "select", {
    options: RING_STYLE_SELECT_OPTIONS,
  }),
  "rings.banding": control("rings.banding", "Banding", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "rings.gaps": control("rings.gaps", "Gaps", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "subtype.recipeId": control("subtype.recipeId", "Subtype recipe", "select", {
    options: SUBTYPE_OPTIONS,
  }),
  "subtype.envelopeStyleId": control("subtype.envelopeStyleId", "Envelope style", "select", {
    options: Object.freeze([
      { value: "auto", label: "Auto" },
      { value: "thin", label: "Thin" },
      { value: "hazy", label: "Hazy" },
      { value: "deep", label: "Deep" },
    ]),
  }),
  "material.roughness": control("material.roughness", "Roughness", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "material.metalness": control("material.metalness", "Metalness", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "material.emissive": control("material.emissive", "Emissive strength", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "material.glow": control("material.glow", "Glow", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
  "material.warmth": control("material.warmth", "Warmth", "range", {
    min: 0,
    max: 1,
    step: 0.01,
  }),
});

const BASE_SECTION_CONTROLS = Object.freeze({
  generation: Object.freeze(["seed"]),
  palette: Object.freeze(["palette.primary", "palette.secondary", "palette.accent"]),
  surface: Object.freeze([
    "surface.landCoverage",
    "surface.oceanCoverage",
    "surface.iceCoverage",
    "surface.craterDensity",
    "surface.roughness",
    "surface.terrainContrast",
    "surface.vegetationCoverage",
  ]),
  atmosphere: Object.freeze([
    "atmosphere.thickness",
    "atmosphere.colour",
    "atmosphere.haze",
    "atmosphere.limbGlow",
  ]),
  clouds: Object.freeze(["clouds.coverage", "clouds.opacity", "clouds.colour", "clouds.softness"]),
  bands: Object.freeze([
    "bands.count",
    "bands.contrast",
    "bands.turbulence",
    "bands.shear",
    "bands.polarTint",
  ]),
  storms: Object.freeze(["storms.count", "storms.intensity", "storms.greatSpot"]),
  rings: Object.freeze([
    "rings.enabled",
    "rings.opacity",
    "rings.inner",
    "rings.outer",
    "rings.tiltDeg",
    "rings.yawDeg",
    "rings.styleId",
    "rings.banding",
    "rings.gaps",
  ]),
  subtype: Object.freeze(["subtype.recipeId", "subtype.envelopeStyleId"]),
  material: Object.freeze(["material.roughness", "material.metalness", "material.emissive"]),
});

function hasVisibleSurfaceColourLayer(context) {
  return (
    context.familyGroup === "rocky" ||
    (context.familyGroup === "volatile" &&
      (context.family === "volatileCandidate" ||
        context.surfaceApplicability === "full" ||
        context.surfaceApplicability === "limited"))
  );
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function firstString(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value];
}

function uniqueStrings(values) {
  const out = [];
  const seen = new Set();
  for (const value of toArray(values)) {
    const id = firstString(isPlainObject(value) ? value.id || value.subtypeId || value.key : value);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function bodyFrom(source) {
  if (!isPlainObject(source)) return {};
  if (isPlainObject(source.body)) return source.body;
  if (isPlainObject(source.model)) return source.model;
  return {};
}

function classificationFrom(source) {
  if (!isPlainObject(source)) return {};
  if (isPlainObject(source.classification)) return source.classification;
  if (isPlainObject(source.planetaryClassification)) return source.planetaryClassification;
  return {};
}

function resolveSubtypeIds(source, classification) {
  const candidates = [
    source?.subtypeIds,
    source?.subtypes,
    source?.subtype,
    source?.primarySubtypeId,
    source?.futureSubtypeId,
    classification?.subtypeIds,
    classification?.subtypes,
    classification?.subtype,
    classification?.primarySubtypeId,
    classification?.futureSubtypeId,
    classification?.subtypeSummary?.subtypes,
    classification?.subtypeSummary?.primarySubtypeId,
    source?.subtypeVisualDescriptor?.entries,
  ];
  const ids = [];
  for (const candidate of candidates) ids.push(...uniqueStrings(candidate));
  return uniqueStrings(ids);
}

function normalizeBoolean(value) {
  if (value === true || value === false) return value;
  if (value == null || value === "") return undefined;
  const text = String(value).trim().toLowerCase();
  if (["true", "yes", "1", "on"].includes(text)) return true;
  if (["false", "no", "0", "off"].includes(text)) return false;
  return undefined;
}

function deriveRenderFamily(family, solverFamily, renderFamily) {
  const explicit = firstString(renderFamily);
  if (explicit) return explicit;
  if (BROWN_DWARF_FAMILIES.has(family) || solverFamily === "brownDwarf") return "brownDwarf";
  if (GAS_FAMILIES.has(family) || solverFamily === "gasGiant") return "gasGiant";
  if (VOLATILE_FAMILIES.has(family) || solverFamily === "volatile") return "volatile";
  if (ROCKY_FAMILIES.has(family) || solverFamily === "rocky") return "rocky";
  return family || solverFamily || "planet";
}

function deriveFamilyGroup({ family, renderFamily }) {
  if (BROWN_DWARF_FAMILIES.has(family) || renderFamily === "brownDwarf") return "brownDwarf";
  if (GAS_FAMILIES.has(family) || renderFamily === "gasGiant" || renderFamily === "gas") {
    return "gas";
  }
  if (VOLATILE_FAMILIES.has(family) || renderFamily === "volatile") return "volatile";
  if (ROCKY_FAMILIES.has(family) || renderFamily === "rocky") return "rocky";
  return "planet";
}

function resolveRingCapable(source, body, context) {
  const explicit = normalizeBoolean(
    source?.ringCapable ??
      source?.canHaveRings ??
      source?.hasRings ??
      body?.ringCapable ??
      body?.canHaveRings ??
      body?.hasRings,
  );
  if (explicit !== undefined) return explicit;
  if (source?.ringAppearance || source?.rings || body?.ringAppearance || body?.rings) return true;
  if (context.familyGroup === "brownDwarf") return false;
  return (
    context.familyGroup === "rocky" ||
    context.familyGroup === "volatile" ||
    context.familyGroup === "gas"
  );
}

export function getPlanetaryVisualManifestContext(source = {}) {
  const body = bodyFrom(source);
  const classification = classificationFrom(source);
  const family = firstString(
    source.family,
    body.family,
    classification.family,
    classification.legacyFamily,
    classification.durableFamily,
  );
  const solverFamily = firstString(
    source.solverFamily,
    body.solverFamily,
    classification.solverFamily,
  );
  const renderFamily = deriveRenderFamily(
    family,
    solverFamily,
    firstString(source.renderFamily, body.renderFamily, classification.renderFamily),
  );
  const familyGroup = deriveFamilyGroup({ family, renderFamily });
  const surfaceApplicability = firstString(
    source.surfaceApplicability,
    body.surfaceApplicability,
    classification.surfaceApplicability,
  );
  const scale = firstString(source.scale, body.scale, classification.scale);
  const boundaryTraits = uniqueStrings(
    source.boundaryTraits ?? body.boundaryTraits ?? classification.boundaryTraits,
  );
  const subtypeIds = resolveSubtypeIds(source, classification);
  const context = {
    family,
    solverFamily,
    renderFamily,
    familyGroup,
    scale,
    surfaceApplicability,
    boundaryTraits,
    subtypeIds,
  };
  return {
    ...context,
    ringCapable: resolveRingCapable(source, body, context),
  };
}

function hasAnySubtype(context, subtypeIds) {
  return subtypeIds.some((id) => context.subtypeIds.includes(id));
}

function addSection(sectionIds, sectionId) {
  if (!sectionIds.includes(sectionId)) sectionIds.push(sectionId);
}

function sectionLabelFor(sectionId, context) {
  if (sectionId !== "palette") return SECTION_LABELS[sectionId] || sectionId;
  if (context.familyGroup === "brownDwarf") return "Glow colors";
  if (context.familyGroup === "gas") return "Cloud band colors";
  if (context.familyGroup === "volatile" && !hasVisibleSurfaceColourLayer(context)) {
    return "Envelope colors";
  }
  if (hasVisibleSurfaceColourLayer(context)) return "Surface colors";
  return SECTION_LABELS[sectionId] || sectionId;
}

function controlHelp(path, context) {
  if (path === "palette.primary" && hasVisibleSurfaceColourLayer(context)) {
    return "Affects exposed land and terrain. Low impact on ocean-covered or cloud-covered worlds.";
  }
  if (path === "palette.secondary" && hasVisibleSurfaceColourLayer(context)) {
    return "Affects bright terrain variation on exposed land.";
  }
  if (path === "palette.accent" && hasVisibleSurfaceColourLayer(context)) {
    return "Affects darker terrain variation and rocky shadow tones.";
  }
  if (path === "surface.ocean.colour") {
    return "Affects oceans and other visible surface water. Hidden when ocean coverage is near zero.";
  }
  if (path === "surface.ice.colour") {
    return "Affects ice caps and ice-covered terrain. Hidden when ice coverage is near zero.";
  }
  if (path === "clouds.colour") {
    return "Affects visible cloud layers. Hidden when cloud coverage is near zero.";
  }
  if (path === "palette.primary" && context.familyGroup === "gas") {
    return "Affects the lightest cloud bands and haze-tinted highlights.";
  }
  if (path === "palette.secondary" && context.familyGroup === "gas") {
    return "Affects the main cloud band tone.";
  }
  if (path === "palette.accent" && context.familyGroup === "gas") {
    return "Affects darker bands, storms, and contrast features.";
  }
  if (path === "palette.primary" && context.familyGroup === "brownDwarf") {
    return "Affects the warm photosphere glow.";
  }
  if (path === "palette.secondary" && context.familyGroup === "brownDwarf") {
    return "Affects broad cloud-deck and band tones.";
  }
  if (path === "palette.accent" && context.familyGroup === "brownDwarf") {
    return "Affects cooler thermal accents and contrast features.";
  }
  return "";
}

function controlLabel(path, context) {
  if (hasVisibleSurfaceColourLayer(context)) {
    switch (path) {
      case "palette.primary":
        return "Land base color";
      case "palette.secondary":
        return "Land highlight color";
      case "palette.accent":
        return "Land shadow color";
      default:
        break;
    }
  }
  if (context.familyGroup === "gas") {
    switch (path) {
      case "palette.primary":
        return "Light band color";
      case "palette.secondary":
        return "Main cloud color";
      case "palette.accent":
        return "Dark band color";
      default:
        break;
    }
  }
  if (context.familyGroup === "brownDwarf") {
    switch (path) {
      case "palette.primary":
        return "Photosphere glow";
      case "palette.secondary":
        return "Cloud deck color";
      case "palette.accent":
        return "Thermal accent";
      default:
        break;
    }
  }
  if (context.familyGroup === "volatile") {
    switch (path) {
      case "palette.primary":
        return "Envelope base color";
      case "palette.secondary":
        return "Cloud layer color";
      case "palette.accent":
        return "Deep haze color";
      default:
        break;
    }
  }
  return "";
}

function controlForContext(id, context) {
  const base = CONTROL_DEFS[id];
  if (!base) return null;
  const label = controlLabel(id, context);
  const help = controlHelp(id, context);
  if (!label && !help) return base;
  return {
    ...base,
    ...(label ? { label } : {}),
    ...(help ? { help } : {}),
  };
}

function buildSection(sectionId, controlIds = BASE_SECTION_CONTROLS[sectionId], context = {}) {
  const controls = (controlIds || []).map((id) => controlForContext(id, context)).filter(Boolean);
  if (!controls.length) return null;
  return {
    id: sectionId,
    label: sectionLabelFor(sectionId, context),
    controls,
  };
}

function surfaceControlsFor(context) {
  const controls = new Set(BASE_SECTION_CONTROLS.surface);
  if (context.family === "dwarfRocky") {
    controls.delete("surface.oceanCoverage");
  }
  if (hasAnySubtype(context, [PLANETARY_SUBTYPES.LAVA_WORLD])) {
    controls.delete("surface.iceCoverage");
    controls.add("surface.lavaCoverage");
  }
  if (hasAnySubtype(context, [PLANETARY_SUBTYPES.DESERT_WORLD])) {
    controls.add("surface.desertCoverage");
  }
  return [...controls];
}

function paletteControlsFor(context) {
  const controls = new Set(BASE_SECTION_CONTROLS.palette);
  if (hasVisibleSurfaceColourLayer(context)) {
    controls.add("surface.ocean.colour");
    controls.add("surface.ice.colour");
    controls.add("clouds.colour");
  }
  return [...controls];
}

function materialControlsFor(context) {
  const controls = new Set(["material.roughness"]);
  if (
    context.familyGroup === "brownDwarf" ||
    hasAnySubtype(context, [PLANETARY_SUBTYPES.IRON_RICH, PLANETARY_SUBTYPES.LAVA_WORLD])
  ) {
    controls.add("material.metalness");
  }
  if (hasAnySubtype(context, [PLANETARY_SUBTYPES.LAVA_WORLD])) controls.add("material.emissive");
  if (context.familyGroup === "brownDwarf") {
    controls.add("material.glow");
    controls.add("material.warmth");
  }
  return [...controls];
}

function atmosphereControlsFor(context) {
  const controls = new Set(BASE_SECTION_CONTROLS.atmosphere);
  if (context.familyGroup === "volatile") controls.add("atmosphere.envelopeTint");
  if (context.familyGroup === "brownDwarf") {
    controls.add("atmosphere.envelopeTint");
    controls.add("atmosphere.limbGlow");
  }
  return [...controls];
}

function cloudControlsFor(context) {
  const controls = new Set(BASE_SECTION_CONTROLS.clouds);
  if (hasVisibleSurfaceColourLayer(context)) controls.delete("clouds.colour");
  if (context.familyGroup === "brownDwarf") controls.add("clouds.cloudDeck");
  return [...controls];
}

function subtypeControlsFor(context) {
  const controls = new Set(["subtype.recipeId"]);
  if (
    context.familyGroup === "volatile" ||
    hasAnySubtype(context, [
      PLANETARY_SUBTYPES.HYCEAN_CANDIDATE,
      PLANETARY_SUBTYPES.STEAM_WORLD,
      PLANETARY_SUBTYPES.SUPER_PUFF,
    ])
  ) {
    controls.add("subtype.envelopeStyleId");
  }
  return [...controls];
}

function sectionControlIds(sectionId, context) {
  if (sectionId === "palette") return paletteControlsFor(context);
  if (sectionId === "surface") return surfaceControlsFor(context);
  if (sectionId === "material") return materialControlsFor(context);
  if (sectionId === "atmosphere") return atmosphereControlsFor(context);
  if (sectionId === "clouds") return cloudControlsFor(context);
  if (sectionId === "subtype") return subtypeControlsFor(context);
  return BASE_SECTION_CONTROLS[sectionId];
}

export function buildPlanetaryVisualControlManifest(source = {}) {
  const context = getPlanetaryVisualManifestContext(source);
  const sections = [];

  addSection(sections, "generation");
  addSection(sections, "palette");

  if (context.familyGroup === "rocky") {
    addSection(sections, "surface");
    addSection(sections, "atmosphere");
    addSection(sections, "clouds");
    addSection(sections, "material");
  } else if (context.familyGroup === "volatile") {
    if (
      context.family === "volatileCandidate" ||
      context.surfaceApplicability === "full" ||
      context.surfaceApplicability === "limited"
    ) {
      addSection(sections, "surface");
    }
    addSection(sections, "atmosphere");
    addSection(sections, "clouds");
    addSection(sections, "bands");
    addSection(sections, "storms");
    addSection(sections, "material");
  } else if (context.familyGroup === "gas") {
    addSection(sections, "atmosphere");
    addSection(sections, "clouds");
    addSection(sections, "bands");
    addSection(sections, "storms");
    addSection(sections, "material");
  } else if (context.familyGroup === "brownDwarf") {
    addSection(sections, "atmosphere");
    addSection(sections, "clouds");
    addSection(sections, "bands");
    addSection(sections, "material");
  } else {
    addSection(sections, "atmosphere");
    addSection(sections, "material");
  }

  if (context.ringCapable) addSection(sections, "rings");
  if (context.subtypeIds.length) addSection(sections, "subtype");

  const manifestSections = sections
    .map((sectionId) => buildSection(sectionId, sectionControlIds(sectionId, context), context))
    .filter(Boolean);

  return {
    version: VISUAL_CONTROL_MANIFEST_VERSION,
    context,
    sections: manifestSections,
    controls: manifestSections.flatMap((section) => section.controls),
  };
}

export function listAvailableVisualControlPaths(manifest) {
  if (!isPlainObject(manifest)) return [];
  const controls = Array.isArray(manifest.controls)
    ? manifest.controls
    : Array.isArray(manifest.sections)
      ? manifest.sections.flatMap((section) => section?.controls || [])
      : [];
  const out = [];
  const seen = new Set();
  for (const controlDef of controls) {
    const path = firstString(controlDef?.path, controlDef?.id, controlDef?.key);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    out.push(path);
  }
  return out;
}

export function getVisualControl(manifest, path) {
  const target = firstString(path);
  if (!target || !isPlainObject(manifest)) return null;
  const sections = Array.isArray(manifest.sections) ? manifest.sections : [];
  for (const section of sections) {
    const controls = Array.isArray(section?.controls) ? section.controls : [];
    const match = controls.find(
      (controlDef) => firstString(controlDef?.path, controlDef?.id) === target,
    );
    if (match) return match;
  }
  return null;
}

export function hasVisualControl(manifest, path) {
  return !!getVisualControl(manifest, path);
}
