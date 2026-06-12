import { PLANETARY_SUBTYPE_LABELS, PLANETARY_SUBTYPES } from "../../engine/planetarySubtypes.js";

const RENDER_RELEVANT_SUBTYPES = new Set([
  PLANETARY_SUBTYPES.OCEAN_WORLD,
  PLANETARY_SUBTYPES.WATER_WORLD,
  PLANETARY_SUBTYPES.ICY_DWARF,
  PLANETARY_SUBTYPES.LAVA_WORLD,
  PLANETARY_SUBTYPES.IRON_RICH,
  PLANETARY_SUBTYPES.CARBON_RICH,
  PLANETARY_SUBTYPES.DESERT_WORLD,
  PLANETARY_SUBTYPES.STEAM_WORLD,
  PLANETARY_SUBTYPES.HYCEAN_CANDIDATE,
  PLANETARY_SUBTYPES.SUPER_PUFF,
  PLANETARY_SUBTYPES.CHTHONIAN_CANDIDATE,
  PLANETARY_SUBTYPES.ROGUE_PLANET,
]);

const SUBTYPE_VISUAL_PRIORITY = Object.freeze({
  roguePlanet: 100,
  steamWorld: 96,
  superPuff: 94,
  hyceanCandidate: 92,
  lavaWorld: 90,
  chthonianCandidate: 86,
  waterWorld: 80,
  oceanWorld: 76,
  icyDwarf: 72,
  ironRich: 64,
  carbonRich: 60,
  desertWorld: 48,
});

const ROCKY_RECIPE_BY_SUBTYPE = Object.freeze({
  oceanWorld: "archipelago",
  waterWorld: "water-world",
  icyDwarf: "frozen-wasteland",
  lavaWorld: "lava-world",
  ironRich: "iron-fortress",
  carbonRich: "cratered-husk",
  desertWorld: "red-desert",
  steamWorld: "venus-shroud",
  hyceanCandidate: "water-world",
  superPuff: "venus-shroud",
  chthonianCandidate: "cratered-husk",
  roguePlanet: "frozen-wasteland",
});

const ENVELOPE_STYLE_SUBTYPES = new Set([
  PLANETARY_SUBTYPES.STEAM_WORLD,
  PLANETARY_SUBTYPES.HYCEAN_CANDIDATE,
  PLANETARY_SUBTYPES.SUPER_PUFF,
]);

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function titleCase(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function classificationFrom(source) {
  return (
    source?.classification ||
    source?.unifiedModel?.classification ||
    source?.model?.classification ||
    source?.unifiedBodyCalc?.classification ||
    null
  );
}

function subtypeEntriesFrom(source) {
  const classification = classificationFrom(source);
  const rawSubtypes = Array.isArray(classification?.subtypes)
    ? classification.subtypes
    : Array.isArray(source?.subtypes)
      ? source.subtypes
      : Array.isArray(source?.subtypeSummary?.subtypes)
        ? source.subtypeSummary.subtypes
        : [];
  const primarySubtypeId = String(
    classification?.primarySubtypeId ||
      source?.primarySubtype?.id ||
      source?.subtypeSummary?.primarySubtypeId ||
      "",
  ).trim();
  const seen = new Set();
  return rawSubtypes
    .map((subtype) => {
      const id = String(subtype?.id || subtype || "").trim();
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        label: String(subtype?.label || PLANETARY_SUBTYPE_LABELS[id] || titleCase(id)).trim(),
        isPrimary: id === primarySubtypeId,
        visualHints: isObject(subtype?.visualHints) ? subtype.visualHints : null,
      };
    })
    .filter(Boolean);
}

function priorityForSubtype(entry) {
  const base = SUBTYPE_VISUAL_PRIORITY[entry?.id] || 0;
  return base + (entry?.isPrimary ? 0.5 : 0);
}

export function getRenderRelevantSubtypeEntries(source) {
  return subtypeEntriesFrom(source)
    .filter((entry) => RENDER_RELEVANT_SUBTYPES.has(entry.id))
    .sort((left, right) => priorityForSubtype(right) - priorityForSubtype(left));
}

export function buildVisualSubtypeKey(source) {
  return getRenderRelevantSubtypeEntries(source)
    .map((entry) => entry.id)
    .join("+");
}

export function buildSubtypeVisualDescriptor(source) {
  const entries = getRenderRelevantSubtypeEntries(source);
  if (!entries.length) {
    return {
      entries: [],
      visualSubtypeKey: "",
      primarySubtypeId: "",
      primarySubtypeLabel: "",
      rockyRecipeId: "",
      envelopeStyleId: "",
    };
  }
  const primary = entries[0];
  return {
    entries,
    visualSubtypeKey: entries.map((entry) => entry.id).join("+"),
    primarySubtypeId: primary.id,
    primarySubtypeLabel: primary.label,
    rockyRecipeId: ROCKY_RECIPE_BY_SUBTYPE[primary.id] || "",
    envelopeStyleId: entries.some((entry) => ENVELOPE_STYLE_SUBTYPES.has(entry.id)) ? "hazy" : "",
  };
}

function mergeRockyProfile(profile, patch) {
  return {
    ...profile,
    ...patch,
    palette: patch.palette || profile.palette,
    landPalette: patch.landPalette || profile.landPalette || patch.palette || profile.palette,
    ocean: {
      ...(profile.ocean || {}),
      ...(patch.ocean || {}),
    },
    iceCaps: {
      ...(profile.iceCaps || {}),
      ...(patch.iceCaps || {}),
    },
    clouds: {
      ...(profile.clouds || {}),
      ...(patch.clouds || {}),
    },
    atmosphere: {
      ...(profile.atmosphere || {}),
      ...(patch.atmosphere || {}),
    },
    terrain: {
      ...(profile.terrain || {}),
      ...(patch.terrain || {}),
    },
    vegetation: {
      ...(profile.vegetation || {}),
      ...(patch.vegetation || {}),
    },
    ring: profile.ring,
  };
}

function profilePatchForSubtype(id, profile) {
  switch (id) {
    case PLANETARY_SUBTYPES.OCEAN_WORLD:
      return {
        palette: { c1: "#72b7d8", c2: "#2e6f9f", c3: "#163a5c" },
        landPalette: { c1: "#b49b76", c2: "#7b6548", c3: "#3e2d1e" },
        ocean: {
          coverage: Math.max(0.78, Number(profile?.ocean?.coverage) || 0),
          colour: "#267fd0",
          frozen: false,
        },
        clouds: {
          coverage: Math.max(0.34, Number(profile?.clouds?.coverage) || 0),
          colour: "#f4fbff",
        },
        atmosphere: {
          thickness: Math.max(0.08, Number(profile?.atmosphere?.thickness) || 0),
          colour: "#82b9f0",
        },
      };
    case PLANETARY_SUBTYPES.WATER_WORLD:
      return {
        palette: { c1: "#4ca6d8", c2: "#1f639f", c3: "#0b2748" },
        landPalette: { c1: "#9a8b74", c2: "#655744", c3: "#2d2923" },
        ocean: {
          coverage: Math.max(0.96, Number(profile?.ocean?.coverage) || 0),
          colour: "#155fa8",
          frozen: false,
        },
        clouds: {
          coverage: Math.max(0.52, Number(profile?.clouds?.coverage) || 0),
          colour: "#eef8ff",
        },
        atmosphere: {
          thickness: Math.max(0.1, Number(profile?.atmosphere?.thickness) || 0),
          colour: "#78b3ee",
        },
      };
    case PLANETARY_SUBTYPES.ICY_DWARF:
      return {
        palette: { c1: "#edf6ff", c2: "#bcd2e3", c3: "#6d879a" },
        landPalette: { c1: "#f4fbff", c2: "#c5d8e8", c3: "#7893a5" },
        ocean: {
          coverage: Math.max(0.45, Number(profile?.ocean?.coverage) || 0),
          colour: "#9bc7e5",
          frozen: true,
        },
        iceCaps: { north: 1, south: 1, colour: "#f3fbff" },
        clouds: {
          coverage: Math.min(Number(profile?.clouds?.coverage) || 0, 0.18),
          colour: "#f4fbff",
        },
        atmosphere: { thickness: 0.03, colour: "#b9d7f4" },
        terrain: {
          type: "cratered",
          craterDensity: Math.max(0.62, Number(profile?.terrain?.craterDensity) || 0),
        },
        special: "frozen",
      };
    case PLANETARY_SUBTYPES.LAVA_WORLD:
      return {
        palette: { c1: "#3a2924", c2: "#171315", c3: "#070607" },
        landPalette: { c1: "#4a3028", c2: "#1c1718", c3: "#080707" },
        ocean: { coverage: 0, colour: "#1b1110", frozen: false },
        clouds: {
          coverage: Math.max(0.2, Number(profile?.clouds?.coverage) || 0),
          colour: "#ffb07a",
        },
        atmosphere: {
          thickness: Math.max(0.08, Number(profile?.atmosphere?.thickness) || 0),
          colour: "#ff8b4f",
        },
        terrain: {
          type: "volcanic",
          craterDensity: Math.max(0.18, Number(profile?.terrain?.craterDensity) || 0),
        },
        vegetation: { coverage: 0, colour: null },
        special: "lava",
      };
    case PLANETARY_SUBTYPES.IRON_RICH:
      return {
        palette: { c1: "#7a6f6a", c2: "#473f40", c3: "#1c1b20" },
        landPalette: { c1: "#806b5e", c2: "#4a3c38", c3: "#1e1a1a" },
        ocean: {
          coverage: Math.min(Number(profile?.ocean?.coverage) || 0, 0.18),
          colour: "#263f50",
        },
        atmosphere: {
          thickness: Math.min(Math.max(Number(profile?.atmosphere?.thickness) || 0, 0.03), 0.08),
          colour: "#8d9aab",
        },
        terrain: {
          type: "cratered",
          craterDensity: Math.max(0.36, Number(profile?.terrain?.craterDensity) || 0),
        },
      };
    case PLANETARY_SUBTYPES.CARBON_RICH:
      return {
        palette: { c1: "#4b4b47", c2: "#242522", c3: "#080909" },
        landPalette: { c1: "#56534c", c2: "#292927", c3: "#0a0b0b" },
        ocean: {
          coverage: Math.min(Number(profile?.ocean?.coverage) || 0, 0.12),
          colour: "#182c38",
        },
        clouds: {
          coverage: Math.min(Number(profile?.clouds?.coverage) || 0, 0.18),
          colour: "#d6d2c6",
        },
        atmosphere: {
          thickness: Math.min(Math.max(Number(profile?.atmosphere?.thickness) || 0, 0.02), 0.07),
          colour: "#8f8d82",
        },
        terrain: {
          type: "cratered",
          craterDensity: Math.max(0.52, Number(profile?.terrain?.craterDensity) || 0),
        },
      };
    case PLANETARY_SUBTYPES.DESERT_WORLD:
      return {
        palette: { c1: "#d39a5c", c2: "#8e5d35", c3: "#432817" },
        landPalette: { c1: "#d8a567", c2: "#95623a", c3: "#4a2a17" },
        ocean: {
          coverage: Math.min(Number(profile?.ocean?.coverage) || 0, 0.04),
          colour: "#31576a",
        },
        clouds: {
          coverage: Math.min(Number(profile?.clouds?.coverage) || 0, 0.2),
          colour: "#e7d7b8",
        },
        atmosphere: {
          thickness: Math.max(0.04, Number(profile?.atmosphere?.thickness) || 0),
          colour: "#c99a6f",
        },
        terrain: {
          type: "worn",
          craterDensity: Math.max(0.24, Number(profile?.terrain?.craterDensity) || 0),
        },
      };
    case PLANETARY_SUBTYPES.STEAM_WORLD:
      return {
        palette: { c1: "#8aa9b6", c2: "#4e788c", c3: "#244556" },
        ocean: {
          coverage: Math.max(0.72, Number(profile?.ocean?.coverage) || 0),
          colour: "#2e7ea7",
          frozen: false,
        },
        clouds: { coverage: 0.95, colour: "#efe0c8" },
        atmosphere: {
          thickness: Math.max(0.14, Number(profile?.atmosphere?.thickness) || 0),
          colour: "#d7baa0",
        },
        vegetation: { coverage: 0, colour: null },
      };
    case PLANETARY_SUBTYPES.HYCEAN_CANDIDATE:
      return {
        palette: { c1: "#518cb0", c2: "#255d84", c3: "#102a45" },
        ocean: {
          coverage: Math.max(0.88, Number(profile?.ocean?.coverage) || 0),
          colour: "#1c6fae",
          frozen: false,
        },
        clouds: {
          coverage: Math.max(0.72, Number(profile?.clouds?.coverage) || 0),
          colour: "#e8f0f2",
        },
        atmosphere: {
          thickness: Math.max(0.16, Number(profile?.atmosphere?.thickness) || 0),
          colour: "#9ebed4",
        },
      };
    case PLANETARY_SUBTYPES.SUPER_PUFF:
      return {
        palette: { c1: "#ddd1bd", c2: "#b8a58c", c3: "#6f665d" },
        ocean: {
          coverage: Math.min(Number(profile?.ocean?.coverage) || 0, 0.08),
          colour: "#607b91",
        },
        clouds: { coverage: 0.98, colour: "#eee5d7" },
        atmosphere: {
          thickness: Math.max(0.18, Number(profile?.atmosphere?.thickness) || 0),
          colour: "#dac4a8",
        },
        vegetation: { coverage: 0, colour: null },
      };
    case PLANETARY_SUBTYPES.CHTHONIAN_CANDIDATE:
      return {
        palette: { c1: "#55515a", c2: "#26232a", c3: "#0a090c" },
        landPalette: { c1: "#5e575c", c2: "#2a2528", c3: "#0b090a" },
        ocean: { coverage: 0, colour: "#17151a", frozen: false },
        clouds: {
          coverage: Math.min(Number(profile?.clouds?.coverage) || 0, 0.12),
          colour: "#d0c1b1",
        },
        atmosphere: {
          thickness: Math.min(Math.max(Number(profile?.atmosphere?.thickness) || 0, 0.02), 0.07),
          colour: "#9a8c86",
        },
        terrain: {
          type: "cratered",
          craterDensity: Math.max(0.64, Number(profile?.terrain?.craterDensity) || 0),
        },
      };
    case PLANETARY_SUBTYPES.ROGUE_PLANET:
      return {
        palette: { c1: "#4f6270", c2: "#23313b", c3: "#070b10" },
        landPalette: { c1: "#5b6873", c2: "#2a343d", c3: "#090c11" },
        ocean: {
          coverage: clamp(Math.max(0.3, Number(profile?.ocean?.coverage) || 0), 0, 0.85),
          colour: "#182b3a",
          frozen: true,
        },
        iceCaps: { north: 1, south: 1, colour: "#dbe8f3" },
        clouds: {
          coverage: Math.min(Number(profile?.clouds?.coverage) || 0, 0.1),
          colour: "#c9d8e6",
        },
        atmosphere: { thickness: 0.025, colour: "#6f8da8" },
        terrain: {
          type: "cratered",
          craterDensity: Math.max(0.58, Number(profile?.terrain?.craterDensity) || 0),
        },
        special: "frozen",
      };
    default:
      return null;
  }
}

export function applySubtypeVisualHintsToRockyProfile(profile, source) {
  if (!profile) return profile;
  const descriptor = buildSubtypeVisualDescriptor(source);
  if (!descriptor.visualSubtypeKey) return profile;
  const patch = profilePatchForSubtype(descriptor.primarySubtypeId, profile);
  if (!patch) return profile;
  return mergeRockyProfile(profile, {
    ...patch,
    recipeId: descriptor.rockyRecipeId,
    visualSubtypeKey: descriptor.visualSubtypeKey,
    visualSubtypeIds: descriptor.entries.map((entry) => entry.id),
    primarySubtypeId: descriptor.primarySubtypeId,
    primarySubtypeLabel: descriptor.primarySubtypeLabel,
  });
}

export function resolveSubtypeEnvelopeStyle(source, fallbackStyle = "sub-neptune") {
  const descriptor = buildSubtypeVisualDescriptor(source);
  return descriptor.envelopeStyleId || fallbackStyle;
}
