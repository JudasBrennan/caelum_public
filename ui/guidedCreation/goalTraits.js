const GOAL_OBJECT_TYPES = Object.freeze(["moon", "rockyPlanet", "gasGiant", "star"]);
const GOAL_TRAIT_ROLES = Object.freeze(["required", "preferred", "avoid"]);
const GOAL_ALLOWED_EDITS = Object.freeze([
  "edit-object-only",
  "edit-object-plus-host",
  "edit-object-plus-local-system",
]);
const GOAL_SEARCH_BUDGETS = Object.freeze(["fast", "balanced", "deep"]);
const GOAL_PRIORITIES = Object.freeze([
  "maximize-realism",
  "maximize-habitability",
  "preserve-current-system",
  "preserve-current-orbit-context",
]);

const SCOPE_RANK = Object.freeze({
  "edit-object-only": 0,
  "edit-object-plus-host": 1,
  "edit-object-plus-local-system": 2,
});

function freezeRecord(record = {}) {
  return Object.freeze(
    Object.fromEntries(Object.entries(record).map(([key, value]) => [key, Object.freeze(value)])),
  );
}

function trait(id, config = {}) {
  return Object.freeze({
    id,
    label: config.label || id,
    description: config.description || "",
    objectTypes: Object.freeze([...(config.objectTypes || [])]),
    allowedRoles: Object.freeze([...(config.allowedRoles || GOAL_TRAIT_ROLES)]),
    evaluatorKey: String(config.evaluatorKey || id),
    incompatibleWith: Object.freeze([...(config.incompatibleWith || [])]),
    prerequisites: Object.freeze([...(config.prerequisites || [])]),
    minimumAllowedEdits: config.minimumAllowedEdits || "",
  });
}

function template(objectType, id, config = {}) {
  return Object.freeze({
    id,
    objectType,
    label: config.label || id,
    summary: config.summary || "",
    defaultPriority: config.defaultPriority || "maximize-realism",
    defaultAllowedEdits: config.defaultAllowedEdits || "edit-object-only",
    defaultSearchBudget: config.defaultSearchBudget || "balanced",
    minimumAllowedEdits: config.minimumAllowedEdits || "",
    requiredTraits: Object.freeze([...(config.requiredTraits || [])]),
    preferredTraits: Object.freeze([...(config.preferredTraits || [])]),
    avoidTraits: Object.freeze([...(config.avoidTraits || [])]),
  });
}

const GOAL_TRAITS = freezeRecord({
  "surface-liquid-water": trait("surface-liquid-water", {
    label: "Surface liquid water",
    description: "The solved body should support stable exposed liquid water at the surface.",
    objectTypes: ["moon", "rockyPlanet"],
    allowedRoles: ["required", "preferred", "avoid"],
    incompatibleWith: ["subsurface-ocean", "snowball-state", "runaway-greenhouse", "airless-surface"],
  }),
  "subsurface-ocean": trait("subsurface-ocean", {
    label: "Subsurface ocean",
    description: "The solved body should favor a buried internal ocean beneath ice or crust.",
    objectTypes: ["moon"],
    allowedRoles: ["required", "preferred", "avoid"],
    incompatibleWith: ["surface-liquid-water", "airless-surface"],
  }),
  "retained-atmosphere": trait("retained-atmosphere", {
    label: "Retained atmosphere",
    description: "The solved world should keep a non-negligible atmosphere.",
    objectTypes: ["moon", "rockyPlanet"],
    allowedRoles: ["required", "preferred", "avoid"],
    incompatibleWith: ["airless-surface"],
  }),
  "resonance-supported-heating": trait("resonance-supported-heating", {
    label: "Resonance-supported heating",
    description: "The moon should depend on sustained resonance forcing or analogous system support.",
    objectTypes: ["moon"],
    allowedRoles: ["required", "preferred"],
    minimumAllowedEdits: "edit-object-plus-local-system",
  }),
  "in-stellar-habitable-zone": trait("in-stellar-habitable-zone", {
    label: "In stellar habitable zone",
    description: "The target should remain within the star's broad surface-habitability insolation window.",
    objectTypes: ["moon"],
    allowedRoles: ["required", "preferred", "avoid"],
  }),
  "surface-biosphere-plausible": trait("surface-biosphere-plausible", {
    label: "Surface biosphere plausible",
    description: "The target should support a conservative surface-life plausibility state.",
    objectTypes: ["moon"],
    allowedRoles: ["preferred", "avoid"],
    prerequisites: ["surface-liquid-water", "retained-atmosphere"],
    incompatibleWith: ["runaway-greenhouse", "airless-surface", "extreme-radiation"],
  }),
  "vegetation-plausible": trait("vegetation-plausible", {
    label: "Vegetation plausible",
    description: "The target should push toward upper-end vegetation plausibility rather than mere habitability.",
    objectTypes: ["moon"],
    allowedRoles: ["preferred", "avoid"],
    prerequisites: ["surface-biosphere-plausible"],
    incompatibleWith: ["runaway-greenhouse", "airless-surface", "extreme-radiation"],
  }),
  "visible-clouds": trait("visible-clouds", {
    label: "Visible clouds",
    description: "The world should favor a visibly cloud-bearing atmosphere.",
    objectTypes: ["moon"],
    allowedRoles: ["preferred", "avoid"],
    prerequisites: ["retained-atmosphere"],
    incompatibleWith: ["airless-surface"],
  }),
  "low-radiation": trait("low-radiation", {
    label: "Low radiation",
    description: "The target should avoid hostile radiation environments when possible.",
    objectTypes: ["moon"],
    allowedRoles: ["preferred", "avoid"],
    incompatibleWith: ["extreme-radiation"],
  }),
  "atmospheric-collapse": trait("atmospheric-collapse", {
    label: "Atmospheric collapse",
    description: "The target should avoid or explicitly tolerate atmospheric collapse states.",
    objectTypes: ["moon"],
    allowedRoles: ["avoid"],
  }),
  "extreme-radiation": trait("extreme-radiation", {
    label: "Extreme radiation",
    description: "The target should avoid harsh radiation environments.",
    objectTypes: ["moon"],
    allowedRoles: ["avoid"],
  }),
  "runaway-greenhouse": trait("runaway-greenhouse", {
    label: "Runaway greenhouse",
    description: "The target should avoid runaway or near-runaway greenhouse states.",
    objectTypes: ["moon", "rockyPlanet"],
    allowedRoles: ["avoid"],
  }),
  "airless-surface": trait("airless-surface", {
    label: "Airless surface",
    description: "The target should avoid or explicitly permit a near-airless exposed surface.",
    objectTypes: ["moon", "rockyPlanet"],
    allowedRoles: ["avoid"],
  }),
  "in-habitable-zone": trait("in-habitable-zone", {
    label: "In habitable zone",
    description: "The rocky planet should lie within the host star's habitable-zone span.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["required", "preferred", "avoid"],
  }),
  "breathable-oxygen-window": trait("breathable-oxygen-window", {
    label: "Breathable oxygen window",
    description: "The rocky world should target an oxygen-bearing surface state in the Earth's broad window.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["required", "preferred", "avoid"],
    prerequisites: ["surface-liquid-water", "in-habitable-zone", "retained-atmosphere"],
    incompatibleWith: ["runaway-greenhouse", "airless-surface", "snowball-state"],
  }),
  "tectonically-active": trait("tectonically-active", {
    label: "Tectonically active",
    description: "The rocky world should favor active resurfacing or tectonic renewal.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["required", "preferred", "avoid"],
  }),
  "high-habitability": trait("high-habitability", {
    label: "High habitability",
    description: "Favor stronger modeled habitability scores rather than merely surviving constraints.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["preferred", "avoid"],
    prerequisites: ["surface-liquid-water", "in-habitable-zone"],
    incompatibleWith: ["runaway-greenhouse", "airless-surface", "snowball-state"],
  }),
  "high-esi": trait("high-esi", {
    label: "High ESI",
    description: "Favor stronger Earth Similarity Index outcomes.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["preferred", "avoid"],
    prerequisites: ["surface-liquid-water", "in-habitable-zone"],
  }),
  "magnetosphere-present": trait("magnetosphere-present", {
    label: "Magnetosphere present",
    description: "Favor a magnetosphere-bearing rocky-world solution.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["preferred", "avoid"],
  }),
  "mixed-land-ocean": trait("mixed-land-ocean", {
    label: "Mixed land and ocean",
    description: "Favor exposed land plus substantial surface water rather than a dry or globally oceanic state.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["preferred", "avoid"],
    prerequisites: ["surface-liquid-water"],
    incompatibleWith: ["snowball-state", "runaway-greenhouse"],
  }),
  "tidal-lock": trait("tidal-lock", {
    label: "Tidal lock",
    description: "Avoid synchronous-rotation targets when possible.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["avoid"],
  }),
  "snowball-state": trait("snowball-state", {
    label: "Snowball state",
    description: "Avoid globally glaciated rocky-planet targets.",
    objectTypes: ["rockyPlanet"],
    allowedRoles: ["avoid"],
  }),
  "rings-visible": trait("rings-visible", {
    label: "Rings visible",
    description: "Favor a visibly ring-bearing gas giant.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["required", "preferred", "avoid"],
    incompatibleWith: ["rings-hidden"],
  }),
  "class-iv-v": trait("class-iv-v", {
    label: "Class IV-V",
    description: "Target the hotter gas-giant atmospheric classes.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["required", "preferred", "avoid"],
    incompatibleWith: ["class-ii-iii"],
  }),
  "class-ii-iii": trait("class-ii-iii", {
    label: "Class II-III",
    description: "Target the cooler warm-to-temperate gas-giant atmospheric classes.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["required", "preferred", "avoid"],
    incompatibleWith: ["class-iv-v"],
  }),
  "ice-giant-mass-range": trait("ice-giant-mass-range", {
    label: "Ice giant mass range",
    description: "Target the compact lower-mass gas/ice giant regime.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["required", "preferred", "avoid"],
  }),
  "strong-ring-appearance": trait("strong-ring-appearance", {
    label: "Strong ring appearance",
    description: "Favor ring styles and ring states that read strongly in the visual outputs.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["preferred", "avoid"],
    prerequisites: ["rings-visible"],
  }),
  "low-mass-loss": trait("low-mass-loss", {
    label: "Low mass loss",
    description: "Favor atmospheres and orbits with lower escape or evaporation rates.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["preferred", "avoid"],
    incompatibleWith: ["strong-evaporation"],
  }),
  "enriched-metallicity": trait("enriched-metallicity", {
    label: "Enriched metallicity",
    description: "Favor heavier-element-rich giant-planet atmospheres.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["preferred", "avoid"],
  }),
  "rings-hidden": trait("rings-hidden", {
    label: "Rings hidden",
    description: "Avoid visibly ring-bearing gas-giant targets.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["avoid"],
  }),
  "strong-evaporation": trait("strong-evaporation", {
    label: "Strong evaporation",
    description: "Avoid strong irradiation-driven evaporation when possible.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["avoid"],
  }),
  "thermal-band-mismatch": trait("thermal-band-mismatch", {
    label: "Thermal-band mismatch",
    description: "Avoid solving outside the thermal/irradiation family implied by the goal.",
    objectTypes: ["gasGiant"],
    allowedRoles: ["avoid"],
  }),
  "earthlike-life-possible": trait("earthlike-life-possible", {
    label: "Earth-like life possible",
    description: "Favor stars whose outputs can support an Earth-like habitability window.",
    objectTypes: ["star"],
    allowedRoles: ["required", "preferred", "avoid"],
    prerequisites: ["main-sequence"],
    incompatibleWith: ["very-short-lifetime", "post-main-sequence"],
  }),
  "main-sequence": trait("main-sequence", {
    label: "Main sequence",
    description: "Target hydrogen-burning main-sequence stellar states.",
    objectTypes: ["star"],
    allowedRoles: ["required", "preferred", "avoid"],
    incompatibleWith: ["post-main-sequence"],
  }),
  "long-main-sequence-lifetime": trait("long-main-sequence-lifetime", {
    label: "Long main-sequence lifetime",
    description: "Favor long-lived stellar states over bright short-lived ones.",
    objectTypes: ["star"],
    allowedRoles: ["required", "preferred", "avoid"],
    incompatibleWith: ["very-short-lifetime"],
  }),
  "high-luminosity": trait("high-luminosity", {
    label: "High luminosity",
    description: "Favor brighter stellar outputs.",
    objectTypes: ["star"],
    allowedRoles: ["required", "preferred", "avoid"],
  }),
  "low-flare-rate": trait("low-flare-rate", {
    label: "Low flare rate",
    description: "Favor quieter stellar activity regimes.",
    objectTypes: ["star"],
    allowedRoles: ["preferred", "avoid"],
    incompatibleWith: ["high-flare-rate"],
  }),
  "high-giant-planet-probability": trait("high-giant-planet-probability", {
    label: "High giant-planet probability",
    description: "Favor stellar states consistent with giant-planet-friendly disks.",
    objectTypes: ["star"],
    allowedRoles: ["preferred", "avoid"],
  }),
  "solar-metallicity": trait("solar-metallicity", {
    label: "Solar metallicity",
    description: "Favor near-solar metallicity stellar states.",
    objectTypes: ["star"],
    allowedRoles: ["preferred", "avoid"],
  }),
  "high-flare-rate": trait("high-flare-rate", {
    label: "High flare rate",
    description: "Avoid flare-heavy stellar states when possible.",
    objectTypes: ["star"],
    allowedRoles: ["avoid"],
  }),
  "very-short-lifetime": trait("very-short-lifetime", {
    label: "Very short lifetime",
    description: "Avoid stellar states with extremely short stable lifetimes.",
    objectTypes: ["star"],
    allowedRoles: ["avoid"],
  }),
  "post-main-sequence": trait("post-main-sequence", {
    label: "Post-main-sequence",
    description: "Avoid evolved stellar states when the goal requires stable main-sequence support.",
    objectTypes: ["star"],
    allowedRoles: ["avoid"],
  }),
});

const GOAL_TEMPLATES = freezeRecord({
  moon: [
    template("moon", "temperate-ocean-moon", {
      label: "Temperate ocean moon",
      summary: "Surface-ocean moon in the conservative temperate band.",
      defaultPriority: "maximize-habitability",
      defaultAllowedEdits: "edit-object-plus-host",
      requiredTraits: ["surface-liquid-water", "retained-atmosphere", "in-stellar-habitable-zone"],
      preferredTraits: ["visible-clouds", "low-radiation"],
      avoidTraits: ["atmospheric-collapse", "runaway-greenhouse", "airless-surface"],
    }),
    template("moon", "subsurface-ocean-moon", {
      label: "Subsurface-ocean moon",
      summary: "Buried-ocean moon with an ice shell or crustal lid.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["subsurface-ocean"],
      preferredTraits: ["low-radiation"],
      avoidTraits: ["airless-surface"],
    }),
    template("moon", "volcanic-moon", {
      label: "Volcanic moon",
      summary: "Io-like moon driven by strong tidal heating.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-plus-local-system",
      minimumAllowedEdits: "edit-object-plus-local-system",
      requiredTraits: ["resonance-supported-heating"],
      preferredTraits: [],
      avoidTraits: ["subsurface-ocean"],
    }),
    template("moon", "titan-like-moon", {
      label: "Titan-like moon",
      summary: "Cold volatile-rich moon with a dense haze-bearing atmosphere.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["retained-atmosphere"],
      preferredTraits: ["visible-clouds"],
      avoidTraits: ["airless-surface"],
    }),
    template("moon", "captured-irregular-moon", {
      label: "Captured irregular moon",
      summary: "Captured small-body or rubble-pile moon.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: [],
      preferredTraits: [],
      avoidTraits: ["surface-liquid-water", "retained-atmosphere"],
    }),
  ],
  rockyPlanet: [
    template("rockyPlanet", "habitable-rocky-world", {
      label: "Habitable rocky world",
      summary: "Temperate rocky planet biased toward surface habitability.",
      defaultPriority: "maximize-habitability",
      defaultAllowedEdits: "edit-object-plus-host",
      requiredTraits: ["surface-liquid-water", "in-habitable-zone"],
      preferredTraits: ["high-habitability", "high-esi", "mixed-land-ocean"],
      avoidTraits: ["runaway-greenhouse", "airless-surface", "snowball-state"],
    }),
    template("rockyPlanet", "desert-world", {
      label: "Desert world",
      summary: "Dry rocky planet with little stable surface water.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: [],
      preferredTraits: [],
      avoidTraits: ["surface-liquid-water"],
    }),
    template("rockyPlanet", "ocean-world", {
      label: "Ocean world",
      summary: "Water-rich rocky world with dominant oceans.",
      defaultPriority: "maximize-habitability",
      defaultAllowedEdits: "edit-object-plus-host",
      requiredTraits: ["surface-liquid-water", "in-habitable-zone"],
      preferredTraits: ["high-habitability"],
      avoidTraits: ["airless-surface", "snowball-state"],
    }),
    template("rockyPlanet", "venus-like-world", {
      label: "Venus-like greenhouse world",
      summary: "Hot dense-atmosphere rocky world in the greenhouse regime.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: [],
      preferredTraits: [],
      avoidTraits: ["surface-liquid-water"],
    }),
    template("rockyPlanet", "mars-like-world", {
      label: "Mars-like cold desert",
      summary: "Cold dry thin-atmosphere rocky planet.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: [],
      preferredTraits: [],
      avoidTraits: ["surface-liquid-water"],
    }),
  ],
  gasGiant: [
    template("gasGiant", "ringed-gas-giant", {
      label: "Ringed gas giant",
      summary: "Ring-forward gas giant or ice giant.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["rings-visible"],
      preferredTraits: ["strong-ring-appearance"],
      avoidTraits: ["rings-hidden"],
    }),
    template("gasGiant", "hot-jupiter", {
      label: "Hot Jupiter",
      summary: "Close-in irradiated gas giant.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["class-iv-v"],
      preferredTraits: [],
      avoidTraits: ["thermal-band-mismatch"],
    }),
    template("gasGiant", "warm-cloud-giant", {
      label: "Warm cloud giant",
      summary: "Temperate-to-warm giant in a cloud-bearing regime.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["class-ii-iii"],
      preferredTraits: ["low-mass-loss"],
      avoidTraits: ["thermal-band-mismatch"],
    }),
    template("gasGiant", "ice-giant", {
      label: "Ice giant",
      summary: "Compact lower-mass giant with higher heavy-element content.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["ice-giant-mass-range"],
      preferredTraits: ["enriched-metallicity"],
      avoidTraits: ["thermal-band-mismatch"],
    }),
  ],
  star: [
    template("star", "quiet-habitable-star", {
      label: "Quiet habitable star",
      summary: "Low-activity long-lived star in the conservative habitability regime.",
      defaultPriority: "maximize-habitability",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["earthlike-life-possible", "main-sequence"],
      preferredTraits: ["low-flare-rate", "long-main-sequence-lifetime"],
      avoidTraits: ["high-flare-rate", "very-short-lifetime", "post-main-sequence"],
    }),
    template("star", "sun-like-star", {
      label: "Sun-like star",
      summary: "G-type main-sequence star near the familiar solar regime.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["main-sequence"],
      preferredTraits: ["solar-metallicity"],
      avoidTraits: ["post-main-sequence"],
    }),
    template("star", "long-lived-orange-dwarf", {
      label: "Long-lived orange dwarf",
      summary: "Stable K-dwarf-like star with long lifetime.",
      defaultPriority: "maximize-habitability",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["main-sequence", "long-main-sequence-lifetime"],
      preferredTraits: ["low-flare-rate"],
      avoidTraits: ["very-short-lifetime", "post-main-sequence"],
    }),
    template("star", "bright-short-lived-star", {
      label: "Bright short-lived star",
      summary: "Brighter more massive star where luminosity matters more than longevity.",
      defaultPriority: "maximize-realism",
      defaultAllowedEdits: "edit-object-only",
      requiredTraits: ["high-luminosity"],
      preferredTraits: [],
      avoidTraits: ["long-main-sequence-lifetime"],
    }),
  ],
});

function normalizeValue(value, allowed, fallback) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  const match = allowed.find((entry) => String(entry || "").trim().toLowerCase() === normalized);
  return match || fallback;
}

export function normalizeGoalObjectType(value) {
  return normalizeValue(value, GOAL_OBJECT_TYPES, "");
}

export function normalizeGoalTraitRole(value) {
  return normalizeValue(value, GOAL_TRAIT_ROLES, "");
}

export function normalizeGoalAllowedEdits(value) {
  return normalizeValue(value, GOAL_ALLOWED_EDITS, "edit-object-only");
}

export function normalizeGoalSearchBudget(value) {
  return normalizeValue(value, GOAL_SEARCH_BUDGETS, "balanced");
}

export function normalizeGoalPriority(value) {
  return normalizeValue(value, GOAL_PRIORITIES, "maximize-realism");
}

export function compareGoalEditScope(left, right) {
  return (SCOPE_RANK[normalizeGoalAllowedEdits(left)] ?? -1) - (SCOPE_RANK[normalizeGoalAllowedEdits(right)] ?? -1);
}

export function goalEditScopeSatisfies(allowedEdits, requiredEdits) {
  if (!requiredEdits) return true;
  return compareGoalEditScope(allowedEdits, requiredEdits) >= 0;
}

export function listGoalObjectTypes() {
  return [...GOAL_OBJECT_TYPES];
}

export function listGoalPriorities() {
  return [...GOAL_PRIORITIES];
}

export function listGoalAllowedEdits() {
  return [...GOAL_ALLOWED_EDITS];
}

export function listGoalSearchBudgets() {
  return [...GOAL_SEARCH_BUDGETS];
}

export function getGoalTrait(traitId) {
  return GOAL_TRAITS[String(traitId || "").trim()] || null;
}

export function listGoalTraits({ objectType = "", role = "" } = {}) {
  const normalizedObjectType = normalizeGoalObjectType(objectType);
  const normalizedRole = normalizeGoalTraitRole(role);
  return Object.values(GOAL_TRAITS)
    .filter((entry) => {
      if (normalizedObjectType && !entry.objectTypes.includes(normalizedObjectType)) return false;
      if (normalizedRole && !entry.allowedRoles.includes(normalizedRole)) return false;
      return true;
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function isGoalTraitSupported(traitId, objectType, role = "") {
  const traitEntry = getGoalTrait(traitId);
  if (!traitEntry) return false;
  const normalizedObjectType = normalizeGoalObjectType(objectType);
  const normalizedRole = normalizeGoalTraitRole(role);
  if (normalizedObjectType && !traitEntry.objectTypes.includes(normalizedObjectType)) return false;
  if (normalizedRole && !traitEntry.allowedRoles.includes(normalizedRole)) return false;
  return true;
}

export function getGoalTemplate(objectType, goalTemplateId) {
  const normalizedObjectType = normalizeGoalObjectType(objectType);
  if (!normalizedObjectType) return null;
  return (
    (GOAL_TEMPLATES[normalizedObjectType] || []).find(
      (entry) => entry.id === String(goalTemplateId || "").trim(),
    ) || null
  );
}

export function findGoalTemplate(goalTemplateId) {
  const normalizedId = String(goalTemplateId || "").trim();
  if (!normalizedId) return null;
  for (const objectType of GOAL_OBJECT_TYPES) {
    const found = getGoalTemplate(objectType, normalizedId);
    if (found) return found;
  }
  return null;
}

export function listGoalTemplates(objectType = "") {
  const normalizedObjectType = normalizeGoalObjectType(objectType);
  if (!normalizedObjectType) {
    return GOAL_OBJECT_TYPES.flatMap((entry) => listGoalTemplates(entry));
  }
  return [...(GOAL_TEMPLATES[normalizedObjectType] || [])];
}
