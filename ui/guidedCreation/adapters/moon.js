import { normalizeMoonInputs } from "../../../engine/moon/config.js";
import { fmt } from "../../../engine/utils.js";
import { MOON_RECIPES } from "../../moonStyles.js";
import { compileGuidedGoal } from "../goalCompiler.js";
import { getGoalTemplate, getGoalTrait, listGoalTemplates } from "../goalTraits.js";
import { getGuidedAdapter, registerGuidedAdapter } from "../registry.js";

const MOON_GUIDED_ARCHETYPES = Object.freeze([
  {
    id: "airless-rocky-moon",
    objectType: "moon",
    label: "Airless Rocky",
    shortLabel: "Airless",
    summary: "Luna-like rocky moon with no meaningful atmosphere.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["rocky", "airless", "major moon"],
    recipeId: "luna",
    recommendedScienceModes: {
      hydrosphereMode: "core",
      atmosphereMode: "core",
      orbitalCouplingMode: "core",
    },
    rationale: [
      "Uses a simple rocky major-moon baseline.",
      "Best fit for dry, inert, atmosphere-poor moons.",
    ],
    nextActions: ["Check gravity, escape velocity, and orbital stability after apply."],
  },
  {
    id: "irregular-capture-moon",
    objectType: "moon",
    label: "Irregular Capture",
    shortLabel: "Capture",
    summary: "Dark small-body capture with a distant, eccentric, tilted orbit.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["captured", "eccentric", "retrograde"],
    recipeId: "irregular-capture",
    recommendedScienceModes: {
      hydrosphereMode: "core",
      atmosphereMode: "core",
      orbitalCouplingMode: "full",
    },
    rationale: [
      "Starts from a high-eccentricity, high-inclination capture-style orbit.",
      "Useful for irregular rubble bodies rather than regular major moons.",
    ],
    nextActions: ["Review orbital direction, inclination, and long-term stability."],
  },
  {
    id: "volcanic-moon",
    objectType: "moon",
    label: "Volcanic",
    shortLabel: "Volcanic",
    summary: "Io-like tidally heated moon with active resurfacing.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["tidal heating", "volcanic", "resurfacing"],
    recipeId: "io",
    recommendedScienceModes: {
      hydrosphereMode: "core",
      atmosphereMode: "full",
      orbitalCouplingMode: "full",
    },
    rationale: [
      "Uses an Io-like molten-resurfacing starting point.",
      "Best for strong tidal heating and active geology.",
    ],
    nextActions: ["Check tidal heating, volcanism, and resonance diagnostics after apply."],
  },
  {
    id: "subsurface-ocean-moon",
    objectType: "moon",
    label: "Subsurface Ocean",
    shortLabel: "Subsurface",
    summary: "Europa-like ice shell with a buried liquid ocean.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["icy", "buried ocean", "cryovolcanic"],
    recipeId: "europa",
    recommendedScienceModes: {
      hydrosphereMode: "full",
      atmosphereMode: "core",
      orbitalCouplingMode: "full",
    },
    rationale: [
      "Uses a buried-ocean ice-moon baseline.",
      "Best fit when you want internal water without an exposed sea.",
    ],
    nextActions: ["Check subsurface ocean support, ice-shell thickness, and cryovolcanism."],
  },
  {
    id: "hazy-atmosphere-moon",
    objectType: "moon",
    label: "Hazy Atmosphere",
    shortLabel: "Hazy",
    summary: "Titan-like volatile atmosphere with haze and muted surface detail.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["volatile atmosphere", "haze", "cold"],
    recipeId: "hazy-moon",
    recommendedScienceModes: {
      hydrosphereMode: "full",
      atmosphereMode: "full",
      orbitalCouplingMode: "full",
    },
    rationale: [
      "Uses a dense-atmosphere moon baseline rather than a bare icy moon.",
      "Best for Titan-like haze or volatile-rich outer-system cases.",
    ],
    nextActions: ["Check pressure, haze class, and atmosphere lifetime after apply."],
  },
  {
    id: "temperate-ocean-moon",
    objectType: "moon",
    label: "Temperate Ocean",
    shortLabel: "Ocean",
    summary: "Temperate surface-ocean moon using the engine-backed ocean-moon preset.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["temperate", "surface ocean", "habitable edge"],
    recipeId: "oceanic",
    recommendedScienceModes: {
      hydrosphereMode: "full",
      atmosphereMode: "manual",
      orbitalCouplingMode: "full",
    },
    rationale: [
      "Uses the current engine-backed ocean-moon preset as the starting point.",
      "Surface oceans on moons remain system-sensitive, so the current parent context matters.",
    ],
    nextActions: [
      "Check surface water, atmosphere stability, and tidal habitable-zone outputs after apply.",
    ],
  },
  {
    id: "biologically-active-moon",
    objectType: "moon",
    label: "Biologically Active",
    shortLabel: "Biology",
    summary: "Surface-biosphere-forward moon using the engine-backed verdant preset.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["biosphere", "temperate", "vegetation"],
    recipeId: "verdant",
    recommendedScienceModes: {
      hydrosphereMode: "full",
      atmosphereMode: "manual",
      orbitalCouplingMode: "full",
    },
    rationale: [
      "Uses the current engine-backed biologically active preset as a starting point.",
      "Complex surface biospheres on moons are more speculative than ocean-only cases.",
    ],
    nextActions: ["Check biosphere, vegetation, radiation, and climate outputs after apply."],
  },
]);

const GOAL_PRIORITY_OPTIONS = Object.freeze([
  {
    value: "maximize-realism",
    label: "Maximize realism",
    description:
      "Keeps the fit conservative and resists large host, orbit, or biosphere shifts that are only weakly supported.",
  },
  {
    value: "maximize-habitability",
    label: "Maximize habitability",
    description:
      "Accepts bigger retunes if they improve surface water, atmosphere retention, and life-facing moon outcomes.",
  },
  {
    value: "preserve-current-system",
    label: "Preserve current system",
    description:
      "Keeps the result closer to the current host and moon-system framing even if the goal fit is weaker.",
  },
  {
    value: "preserve-current-orbit-context",
    label: "Preserve current orbit",
    description:
      "Strongly resists orbit moves, so heating, radiation, or surface-water goals may only be partially reached.",
  },
]);

const GOAL_ALLOWED_EDIT_OPTIONS = Object.freeze([
  {
    value: "edit-object-only",
    label: "Moon only",
    description:
      "Only this moon's inputs move, so the result stays local but may miss goals blocked by the current host context.",
  },
  {
    value: "edit-object-plus-host",
    label: "Moon + host",
    description:
      "Allows host fixes when the parent is the main blocker, improving difficult atmosphere or radiation outcomes.",
  },
  {
    value: "edit-object-plus-local-system",
    label: "Moon + local system",
    description:
      "Allows host and sibling-moon edits, which is most useful for resonance-backed heating or coupled moon-system goals.",
  },
]);

const GOAL_SEARCH_BUDGET_OPTIONS = Object.freeze([
  {
    value: "fast",
    label: "Fast",
    description:
      "Tries only a few seeded candidates, so it returns quickly but can miss a better moon fit.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description:
      "Tries a moderate number of seeded candidates and is the default speed-versus-fit trade-off.",
  },
  {
    value: "deep",
    label: "Deep",
    description:
      "Tries the broadest seeded search, taking longer but increasing the chance of a closer match.",
  },
]);

const MOON_GOAL_TEMPLATE_META = Object.freeze({
  "temperate-ocean-moon": {
    confidenceClass: "plausible",
    seedArchetypeIds: ["temperate-ocean-moon", "biologically-active-moon", "subsurface-ocean-moon"],
    focusTraits: [
      "surface-liquid-water",
      "retained-atmosphere",
      "in-stellar-habitable-zone",
      "surface-biosphere-plausible",
      "vegetation-plausible",
      "visible-clouds",
      "low-radiation",
      "atmospheric-collapse",
      "runaway-greenhouse",
      "airless-surface",
    ],
  },
  "subsurface-ocean-moon": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["subsurface-ocean-moon", "temperate-ocean-moon"],
    focusTraits: [
      "subsurface-ocean",
      "resonance-supported-heating",
      "low-radiation",
      "retained-atmosphere",
      "airless-surface",
    ],
  },
  "volcanic-moon": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["volcanic-moon", "subsurface-ocean-moon", "airless-rocky-moon"],
    focusTraits: [
      "resonance-supported-heating",
      "subsurface-ocean",
      "low-radiation",
      "retained-atmosphere",
    ],
  },
  "titan-like-moon": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["hazy-atmosphere-moon", "subsurface-ocean-moon", "temperate-ocean-moon"],
    focusTraits: [
      "retained-atmosphere",
      "visible-clouds",
      "low-radiation",
      "airless-surface",
      "surface-liquid-water",
    ],
  },
  "captured-irregular-moon": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["irregular-capture-moon", "airless-rocky-moon"],
    focusTraits: [
      "surface-liquid-water",
      "retained-atmosphere",
      "low-radiation",
      "airless-surface",
    ],
  },
});

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function toFiniteNumber(value, fallback = NaN) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampUnitInterval(value) {
  return Math.max(0, Math.min(1, toFiniteNumber(value, 0)));
}

function goalTraitSelected(compiledGoal = {}, traitId = "") {
  return (
    (compiledGoal?.requiredTraits || []).includes(traitId) ||
    (compiledGoal?.preferredTraits || []).includes(traitId)
  );
}

function goalTraitRequired(compiledGoal = {}, traitId = "") {
  return (compiledGoal?.requiredTraits || []).includes(traitId);
}

function goalTraitAvoided(compiledGoal = {}, traitId = "") {
  return (compiledGoal?.avoidTraits || []).includes(traitId);
}

function traitRoleQuestionId(traitId) {
  return `traitRole:${String(traitId || "").trim()}`;
}

function getMoonGoalTemplateMeta(goalTemplateId) {
  return (
    MOON_GOAL_TEMPLATE_META[String(goalTemplateId || "").trim()] || {
      confidenceClass: "plausible",
      seedArchetypeIds: ["temperate-ocean-moon"],
      focusTraits: [],
    }
  );
}

function mapMoonGoalTemplateToCard(template) {
  const meta = getMoonGoalTemplateMeta(template?.id);
  return {
    id: template?.id || "",
    objectType: "moon",
    label: template?.label || "Moon goal",
    shortLabel: template?.label || "Moon goal",
    summary: template?.summary || "",
    confidenceClass: meta.confidenceClass,
    quickEnabled: false,
    guidedEnabled: true,
    tags: [...(template?.requiredTraits || []), ...(template?.preferredTraits || [])]
      .slice(0, 4)
      .map((traitId) => getGoalTrait(traitId)?.label || traitId),
  };
}

function listMoonGoalTemplateCards() {
  return listGoalTemplates("moon").map((template) => mapMoonGoalTemplateToCard(template));
}

function defaultMoonGoalDraft(goalTemplateId = "") {
  const template = getGoalTemplate("moon", goalTemplateId);
  const traitRoles = {};
  for (const traitId of template?.requiredTraits || []) traitRoles[traitId] = "required";
  for (const traitId of template?.preferredTraits || []) {
    if (!traitRoles[traitId]) traitRoles[traitId] = "preferred";
  }
  for (const traitId of template?.avoidTraits || []) {
    if (!traitRoles[traitId]) traitRoles[traitId] = "avoid";
  }
  return {
    priority: template?.defaultPriority || "maximize-realism",
    allowedEdits: template?.defaultAllowedEdits || "edit-object-only",
    searchBudget: template?.defaultSearchBudget || "balanced",
    traitRoles,
  };
}

function normalizeMoonGoalDraft(flowState = {}) {
  const base = defaultMoonGoalDraft(flowState?.selectedGoalTemplateId);
  const goalDraft =
    flowState?.goalDraft &&
    typeof flowState.goalDraft === "object" &&
    !Array.isArray(flowState.goalDraft)
      ? flowState.goalDraft
      : {};
  const nextTraitRoles =
    goalDraft.traitRoles &&
    typeof goalDraft.traitRoles === "object" &&
    !Array.isArray(goalDraft.traitRoles)
      ? { ...base.traitRoles, ...goalDraft.traitRoles }
      : { ...base.traitRoles };
  return {
    priority: goalDraft.priority || base.priority,
    allowedEdits: goalDraft.allowedEdits || base.allowedEdits,
    searchBudget: goalDraft.searchBudget || base.searchBudget,
    traitRoles: nextTraitRoles,
  };
}

function buildMoonGoalDraftQuestionOptions(traitId) {
  const trait = getGoalTrait(traitId);
  const allowedRoles = Array.isArray(trait?.allowedRoles) ? trait.allowedRoles : [];
  const options = [
    {
      value: "off",
      label: "Off",
      description:
        "Leaves this trait neutral, so it does not help or hurt a candidate unless other choices imply it.",
    },
  ];
  if (allowedRoles.includes("required")) {
    options.push({
      value: "required",
      label: "Must have",
      description:
        "Treats this as a hard requirement, so candidates missing it usually fall out of contention.",
    });
  }
  if (allowedRoles.includes("preferred")) {
    options.push({
      value: "preferred",
      label: "Prefer",
      description:
        "Raises the score when this trait is reached, but still allows trade-off results that miss it.",
    });
  }
  if (allowedRoles.includes("avoid")) {
    options.push({
      value: "avoid",
      label: "Avoid",
      description:
        "Pushes the search away from this trait without making it completely impossible.",
    });
  }
  return options;
}

function buildMoonGoalQuestions(flowState, context = {}) {
  const template = getGoalTemplate("moon", flowState?.selectedGoalTemplateId);
  if (!template) return [];
  const draft = normalizeMoonGoalDraft(flowState);
  const focusTraits = getMoonGoalTemplateMeta(template.id).focusTraits;
  return [
    {
      id: "priority",
      stepId: "parent-context",
      kind: "choice",
      label: "Priority",
      help:
        context.currentContextText ||
        "Sets the scoring bias for the search. Realism stays conservative, habitability accepts larger retunes, and preserve-current resists bigger moon-system changes.",
      defaultValue: draft.priority,
      options: GOAL_PRIORITY_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "allowedEdits",
      stepId: "parent-context",
      kind: "choice",
      label: "Allowed edits",
      help: "Sets how far the search may move. Broader scopes allow host or sibling fixes when those are the main blockers to the target moon outcome.",
      defaultValue: draft.allowedEdits,
      options: GOAL_ALLOWED_EDIT_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "searchBudget",
      stepId: "parent-context",
      kind: "choice",
      label: "Search budget",
      help: "Sets how many seeded candidate paths the search tries. Deeper searches take longer but are more likely to find a closer moon fit.",
      defaultValue: draft.searchBudget,
      options: GOAL_SEARCH_BUDGET_OPTIONS.map((entry) => ({ ...entry })),
    },
    ...focusTraits
      .map((traitId) => getGoalTrait(traitId))
      .filter(Boolean)
      .map((trait) => ({
        id: traitRoleQuestionId(trait.id),
        stepId: "goal-details",
        kind: "select",
        label: trait.label,
        help: trait.description,
        defaultValue: draft.traitRoles?.[trait.id] || "off",
        options: buildMoonGoalDraftQuestionOptions(trait.id),
      })),
  ];
}

function buildMoonGoalCompileInput(flowState = {}) {
  const draft = normalizeMoonGoalDraft(flowState);
  const requiredTraits = [];
  const preferredTraits = [];
  const avoidTraits = [];
  for (const [traitId, role] of Object.entries(draft.traitRoles || {})) {
    if (role === "required") requiredTraits.push(traitId);
    else if (role === "preferred") preferredTraits.push(traitId);
    else if (role === "avoid") avoidTraits.push(traitId);
  }
  return {
    objectType: "moon",
    goalTemplateId: flowState?.selectedGoalTemplateId || "",
    priority: draft.priority,
    allowedEdits: draft.allowedEdits,
    searchBudget: draft.searchBudget,
    requiredTraits,
    preferredTraits,
    avoidTraits,
  };
}

function includesAny(value, patterns = []) {
  const text = normalizeText(value);
  return patterns.some((pattern) => text.includes(pattern));
}

function getMoonArchetype(archetypeId) {
  return MOON_GUIDED_ARCHETYPES.find((entry) => entry.id === String(archetypeId || "")) || null;
}

function getRecipeCatalog(context = {}) {
  return Array.isArray(context?.recipeCatalog) ? context.recipeCatalog : MOON_RECIPES;
}

function getRecipeForArchetype(archetypeId, context = {}) {
  const archetype = getMoonArchetype(archetypeId);
  if (!archetype?.recipeId) return null;
  return getRecipeCatalog(context).find((entry) => entry?.id === archetype.recipeId) || null;
}

export function buildMoonRecipeApplyInputs(recipeInputs = {}, appearanceRecipeId = null) {
  const source = recipeInputs && typeof recipeInputs === "object" ? recipeInputs : {};
  return normalizeMoonInputs({
    massMoon: source.massMoon,
    densityGcm3: source.densityGcm3,
    albedo: source.albedo,
    semiMajorAxisKm: source.semiMajorAxisKm,
    eccentricity: source.eccentricity,
    inclinationDeg: source.inclinationDeg,
    compositionOverride: source.compositionOverride ?? null,
    initialRotationPeriodHours: source.initialRotationPeriodHours ?? null,
    hydrosphereMode: source.hydrosphereMode ?? "core",
    atmosphereMode: source.atmosphereMode ?? "core",
    orbitalCouplingMode: source.orbitalCouplingMode ?? "core",
    waterMassFractionPct: source.waterMassFractionPct ?? null,
    salinityPct: source.salinityPct ?? null,
    ammoniaPct: source.ammoniaPct ?? null,
    differentiatedInterior: source.differentiatedInterior ?? null,
    radioisotopeMode: source.radioisotopeMode ?? "simple",
    radioisotopeAbundance: source.radioisotopeAbundance ?? null,
    u238Abundance: source.u238Abundance ?? null,
    u235Abundance: source.u235Abundance ?? null,
    th232Abundance: source.th232Abundance ?? null,
    k40Abundance: source.k40Abundance ?? null,
    manualSurfacePressureAtm: source.manualSurfacePressureAtm ?? null,
    n2Pct: source.n2Pct ?? 0,
    o2Pct: source.o2Pct ?? 0,
    co2Pct: source.co2Pct ?? 0,
    arPct: source.arPct ?? 0,
    h2oPct: source.h2oPct ?? 0,
    ch4Pct: source.ch4Pct ?? 0,
    coPct: source.coPct ?? 0,
    h2Pct: source.h2Pct ?? 0,
    hePct: source.hePct ?? 0,
    so2Pct: source.so2Pct ?? 0,
    nh3Pct: source.nh3Pct ?? 0,
    forcedEccentricity: source.forcedEccentricity ?? null,
    manualResonanceGroupId: source.manualResonanceGroupId ?? null,
    manualResonanceOrder: source.manualResonanceOrder ?? null,
    manualResonanceRatio: source.manualResonanceRatio ?? null,
    appearanceRecipeId: appearanceRecipeId ?? source.appearanceRecipeId ?? null,
  });
}

function pushDiagnostic(list, severity, code, title, detail, suggestedActions = []) {
  list.push({
    severity,
    code,
    title,
    detail,
    suggestedActions,
  });
}

const PARENT_CONTEXT_OPTIONS = [
  {
    value: "strict",
    label: "Fit current parent",
    description:
      "Requires the current host context to work as-is, so impossible parents block stronger moon outcomes outright.",
  },
  {
    value: "guided-patch",
    label: "Allow host fixes",
    description:
      "Allows guided host-context adjustments when the current parent is the main blocker to the target moon type.",
  },
  {
    value: "flexible",
    label: "Best-effort fit",
    description:
      "Keeps the best starting point even when the current host context is hostile, so the result may come with heavier warnings.",
  },
];

const WATER_STATE_OPTIONS = {
  dry: {
    value: "dry",
    label: "Dry",
    description:
      "Biases toward little or no accessible water, favoring airless, frozen, or inert moon outcomes.",
  },
  subsurface: {
    value: "subsurface",
    label: "Buried Ocean",
    description:
      "Pushes water below an ice shell, favoring Europa-like or Enceladus-like buried-ocean outcomes.",
  },
  surface: {
    value: "surface",
    label: "Surface Ocean",
    description:
      "Pushes toward exposed surface seas, which usually needs the strongest atmosphere, radiation, and heating support.",
  },
};

const ATMOSPHERE_TARGET_OPTIONS = {
  airless: {
    value: "airless",
    label: "Airless",
    description:
      "Favors an airless or exosphere-level result, which is the easiest state for small or strongly irradiated moons to defend.",
  },
  thin: {
    value: "thin",
    label: "Thin",
    description:
      "Allows only a tenuous atmosphere, which can support transient volatiles without demanding Titan-like retention.",
  },
  substantial: {
    value: "substantial",
    label: "Substantial",
    description:
      "Targets a persistent volatile atmosphere, which usually needs stronger gravity, colder conditions, or better shielding.",
  },
  dense: {
    value: "dense",
    label: "Dense / Hazy",
    description:
      "Targets a thicker atmosphere with haze or clouds, pushing the solve toward Titan-like or other strongly atmospheric cases.",
  },
};

const ACTIVITY_TARGET_OPTIONS = {
  quiet: {
    value: "quiet",
    label: "Quiet",
    description:
      "Minimizes tidal forcing and resurfacing, favoring quieter frozen or inert moons over strongly active ones.",
  },
  moderate: {
    value: "moderate",
    label: "Moderate",
    description:
      "Allows some internal activity without demanding an Io-like extreme, which often suits subsurface-ocean targets.",
  },
  active: {
    value: "active",
    label: "Active",
    description:
      "Pushes toward stronger volcanism, cryovolcanism, or tidal support, often at the cost of calmer surface conditions.",
  },
};

const RESONANCE_SUPPORT_OPTIONS = {
  "not-needed": {
    value: "not-needed",
    label: "Not needed",
    description:
      "Avoids depending on sibling resonances, so the recommendation tries to work without moon-system coupling.",
  },
  preferred: {
    value: "preferred",
    label: "Preferred",
    description:
      "Uses resonance support when helpful, making coupled heating more likely but not mandatory.",
  },
  required: {
    value: "required",
    label: "Required",
    description:
      "Treats sustained resonance support as part of the target, so the result may need sibling-moon fixes to succeed.",
  },
};

const LIFE_GOAL_OPTIONS = {
  sterile: {
    value: "sterile",
    label: "Sterile",
    description:
      "Does not spend search effort on exposed biology, allowing colder, harsher, or simpler moon states to win.",
  },
  microbial: {
    value: "microbial",
    label: "Microbial",
    description:
      "Aims for conservative surface or near-surface biology support without demanding a strong complex-biosphere case.",
  },
  "surface-biosphere": {
    value: "surface-biosphere",
    label: "Surface Biosphere",
    description:
      "Pushes for a stronger exposed biosphere, which usually needs the best atmosphere, water, radiation, and climate alignment.",
  },
};

const LAND_EXPOSURE_OPTIONS = {
  archipelago: {
    value: "archipelago",
    label: "Archipelago",
    description:
      "Biases toward more exposed land and island chains, reducing the chance of a fully ocean-covered surface.",
  },
  balanced: {
    value: "balanced",
    label: "Balanced",
    description:
      "Targets a mix of ocean and exposed land, which is usually the most flexible surface-ocean compromise.",
  },
  oceanic: {
    value: "oceanic",
    label: "Oceanic",
    description:
      "Allows global or near-global ocean coverage, usually reducing land exposure in exchange for stronger ocean-world behavior.",
  },
};

const GUIDED_DEFAULTS = {
  "airless-rocky-moon": {
    parent_context_policy: "strict",
    atmosphere_target: "airless",
    activity_target: "quiet",
    resonance_support: "not-needed",
    life_goal: "sterile",
  },
  "irregular-capture-moon": {
    parent_context_policy: "strict",
    atmosphere_target: "airless",
    activity_target: "quiet",
    resonance_support: "not-needed",
    life_goal: "sterile",
  },
  "volcanic-moon": {
    parent_context_policy: "strict",
    water_state: "dry",
    atmosphere_target: "thin",
    activity_target: "active",
    resonance_support: "required",
    life_goal: "sterile",
  },
  "subsurface-ocean-moon": {
    parent_context_policy: "strict",
    water_state: "subsurface",
    atmosphere_target: "thin",
    activity_target: "moderate",
    resonance_support: "preferred",
    life_goal: "microbial",
  },
  "hazy-atmosphere-moon": {
    parent_context_policy: "strict",
    water_state: "dry",
    atmosphere_target: "dense",
    activity_target: "quiet",
    resonance_support: "not-needed",
    life_goal: "sterile",
  },
  "temperate-ocean-moon": {
    parent_context_policy: "strict",
    water_state: "surface",
    atmosphere_target: "substantial",
    activity_target: "moderate",
    resonance_support: "preferred",
    life_goal: "microbial",
    land_exposure_pref: "balanced",
  },
  "biologically-active-moon": {
    parent_context_policy: "strict",
    water_state: "surface",
    atmosphere_target: "substantial",
    activity_target: "moderate",
    resonance_support: "preferred",
    life_goal: "surface-biosphere",
    land_exposure_pref: "balanced",
  },
};

const QUESTION_VARIANTS = {
  "airless-rocky-moon": {
    atmosphere: ["airless", "thin"],
    activity: ["quiet", "moderate"],
    resonance: ["not-needed", "preferred"],
    life: ["sterile", "microbial"],
  },
  "irregular-capture-moon": {
    atmosphere: ["airless", "thin"],
    activity: ["quiet", "moderate"],
    resonance: ["not-needed"],
    life: ["sterile"],
  },
  "volcanic-moon": {
    water: ["dry", "subsurface"],
    atmosphere: ["airless", "thin", "substantial"],
    activity: ["moderate", "active"],
    resonance: ["preferred", "required"],
    life: ["sterile", "microbial"],
  },
  "subsurface-ocean-moon": {
    water: ["subsurface", "surface"],
    atmosphere: ["airless", "thin", "substantial"],
    activity: ["quiet", "moderate", "active"],
    resonance: ["preferred", "required"],
    life: ["sterile", "microbial"],
  },
  "hazy-atmosphere-moon": {
    water: ["dry", "subsurface", "surface"],
    atmosphere: ["substantial", "dense"],
    activity: ["quiet", "moderate"],
    resonance: ["not-needed", "preferred"],
    life: ["sterile", "microbial"],
  },
  "temperate-ocean-moon": {
    water: ["surface", "subsurface"],
    atmosphere: ["thin", "substantial", "dense"],
    activity: ["quiet", "moderate", "active"],
    resonance: ["preferred", "required"],
    life: ["sterile", "microbial", "surface-biosphere"],
    land: ["archipelago", "balanced", "oceanic"],
  },
  "biologically-active-moon": {
    water: ["surface"],
    atmosphere: ["substantial", "dense"],
    activity: ["quiet", "moderate"],
    resonance: ["preferred", "required"],
    life: ["microbial", "surface-biosphere"],
    land: ["archipelago", "balanced", "oceanic"],
  },
};

function pickQuestionOptions(optionMap, keys = []) {
  return (Array.isArray(keys) ? keys : [])
    .map((key) => optionMap[key])
    .filter(Boolean)
    .map((entry) => ({ ...entry }));
}

function getMoonGuidedDefaults(archetypeId) {
  return { ...(GUIDED_DEFAULTS[archetypeId] || { parent_context_policy: "strict" }) };
}

function resolveMoonGuidedAnswers(archetype, flowState = {}) {
  return {
    ...getMoonGuidedDefaults(archetype?.id),
    ...(flowState?.answers || {}),
  };
}

function getQuestionVariant(archetypeId, key) {
  return QUESTION_VARIANTS[archetypeId]?.[key] || [];
}

function buildMoonQuestions(archetype, context = {}) {
  if (!archetype) return [];
  const defaults = getMoonGuidedDefaults(archetype.id);
  const questions = [
    {
      id: "parent_context_policy",
      stepId: "parent-context",
      label: "Parent Fit Policy",
      kind: "choice",
      help:
        context.currentContextText ||
        "Controls whether the current host is treated as fixed or adjustable. This mainly affects whether guided mode may propose host fixes to reach the target moon type.",
      defaultValue: defaults.parent_context_policy,
      options: PARENT_CONTEXT_OPTIONS.map((entry) => ({ ...entry })),
    },
  ];

  const waterOptions = pickQuestionOptions(
    WATER_STATE_OPTIONS,
    getQuestionVariant(archetype.id, "water"),
  );
  if (waterOptions.length) {
    questions.push({
      id: "water_state",
      stepId: "goal-details",
      label: "Water State",
      kind: "choice",
      help: "Sets the target water regime. Surface oceans are the hardest to defend; buried oceans are easier to support with the right heating and composition.",
      defaultValue: defaults.water_state,
      options: waterOptions,
    });
  }

  const atmosphereOptions = pickQuestionOptions(
    ATMOSPHERE_TARGET_OPTIONS,
    getQuestionVariant(archetype.id, "atmosphere"),
  );
  if (atmosphereOptions.length) {
    questions.push({
      id: "atmosphere_target",
      stepId: "goal-details",
      label: "Atmosphere Target",
      kind: "choice",
      help: "Sets the intended atmosphere strength. Heavier atmospheres usually need a better host context, stronger retention, or colder conditions.",
      defaultValue: defaults.atmosphere_target,
      options: atmosphereOptions,
    });
  }

  const activityOptions = pickQuestionOptions(
    ACTIVITY_TARGET_OPTIONS,
    getQuestionVariant(archetype.id, "activity"),
  );
  if (activityOptions.length) {
    questions.push({
      id: "activity_target",
      stepId: "goal-details",
      label: "Activity Level",
      kind: "choice",
      help: "Sets how strongly the result may lean on tidal or internal activity. Higher activity helps subsurface oceans and volcanism, but can work against quieter surface cases.",
      defaultValue: defaults.activity_target,
      options: activityOptions,
    });
  }

  const resonanceOptions = pickQuestionOptions(
    RESONANCE_SUPPORT_OPTIONS,
    getQuestionVariant(archetype.id, "resonance"),
  );
  if (resonanceOptions.length) {
    questions.push({
      id: "resonance_support",
      stepId: "goal-details",
      label: "Resonance Support",
      kind: "choice",
      help: "Controls whether sibling-moon resonance support is optional or required. This mainly affects whether the result may need moon-system fixes.",
      defaultValue: defaults.resonance_support,
      options: resonanceOptions,
    });
  }

  const lifeOptions = pickQuestionOptions(
    LIFE_GOAL_OPTIONS,
    getQuestionVariant(archetype.id, "life"),
  );
  if (lifeOptions.length) {
    questions.push({
      id: "life_goal",
      stepId: "goal-details",
      label: "Life Goal",
      kind: "choice",
      help: "Sets how hard guided mode should lean toward exposed biology. Higher life goals demand stronger atmosphere, water, radiation, and climate alignment.",
      defaultValue: defaults.life_goal,
      options: lifeOptions,
    });
  }

  const landOptions = pickQuestionOptions(
    LAND_EXPOSURE_OPTIONS,
    getQuestionVariant(archetype.id, "land"),
  );
  if (landOptions.length) {
    questions.push({
      id: "land_exposure_pref",
      stepId: "goal-details",
      label: "Land Exposure",
      kind: "choice",
      help: "Sets how much land the surface-ocean result should try to keep. This only matters once the moon is already aiming for exposed seas.",
      defaultValue: defaults.land_exposure_pref,
      options: landOptions,
      visibleWhen(nextFlowState) {
        return resolveMoonGuidedAnswers(archetype, nextFlowState).water_state === "surface";
      },
    });
  }

  return questions;
}

function setManualAtmosphere(inputs, { pressureAtm = 0, mix = {} } = {}) {
  inputs.atmosphereMode = pressureAtm > 0 ? "manual" : "core";
  inputs.manualSurfacePressureAtm = pressureAtm > 0 ? pressureAtm : null;
  inputs.n2Pct = mix.n2Pct ?? 0;
  inputs.o2Pct = mix.o2Pct ?? 0;
  inputs.co2Pct = mix.co2Pct ?? 0;
  inputs.arPct = mix.arPct ?? 0;
  inputs.h2oPct = mix.h2oPct ?? 0;
  inputs.ch4Pct = mix.ch4Pct ?? 0;
  inputs.coPct = mix.coPct ?? 0;
  inputs.h2Pct = mix.h2Pct ?? 0;
  inputs.hePct = mix.hePct ?? 0;
  inputs.so2Pct = mix.so2Pct ?? 0;
  inputs.nh3Pct = mix.nh3Pct ?? 0;
}

function landExposureThreshold(pref) {
  switch (String(pref || "")) {
    case "archipelago":
      return 0.4;
    case "balanced":
      return 0.22;
    case "oceanic":
      return 0.05;
    default:
      return 0;
  }
}

function requiredPressureAtm(target) {
  switch (String(target || "")) {
    case "thin":
      return 0.02;
    case "substantial":
      return 0.35;
    case "dense":
      return 1;
    default:
      return 0;
  }
}

function recommendedForcedEccentricity(archetypeId, activityTarget, resonanceSupport) {
  const base = activityTarget === "active" ? 0.006 : activityTarget === "moderate" ? 0.003 : 0.0008;
  const archetypeBoost =
    archetypeId === "volcanic-moon"
      ? 0.002
      : archetypeId === "subsurface-ocean-moon"
        ? 0.0015
        : archetypeId === "temperate-ocean-moon" || archetypeId === "biologically-active-moon"
          ? 0.001
          : 0;
  const resonanceBoost =
    resonanceSupport === "required" ? 0.0015 : resonanceSupport === "preferred" ? 0.0005 : 0;
  return Math.max(0, Number((base + archetypeBoost + resonanceBoost).toFixed(4)));
}

function surfaceWaterMassFraction(pref, lifeGoal) {
  if (pref === "archipelago") return lifeGoal === "surface-biosphere" ? 2.8 : 3.6;
  if (pref === "oceanic") return lifeGoal === "surface-biosphere" ? 6.2 : 9;
  return lifeGoal === "surface-biosphere" ? 3.5 : 6;
}

function applyWaterTarget(inputs, archetype, answers) {
  const waterState = answers.water_state;
  if (!waterState) return;

  if (waterState === "dry") {
    inputs.hydrosphereMode = "core";
    inputs.waterMassFractionPct = 0.1;
    inputs.salinityPct = null;
    inputs.ammoniaPct = null;
    if (archetype.id === "subsurface-ocean-moon") inputs.compositionOverride = null;
    return;
  }

  inputs.hydrosphereMode = "full";
  if (waterState === "subsurface") {
    if (archetype.id !== "volcanic-moon") inputs.compositionOverride = "Subsurface ocean";
    inputs.waterMassFractionPct = archetype.id === "hazy-atmosphere-moon" ? 3.2 : 4.8;
    inputs.salinityPct = 2.2;
    inputs.ammoniaPct = archetype.id === "subsurface-ocean-moon" ? 0.8 : 0.2;
    return;
  }

  if (archetype.id === "subsurface-ocean-moon") inputs.compositionOverride = null;
  inputs.waterMassFractionPct = surfaceWaterMassFraction(
    answers.land_exposure_pref,
    answers.life_goal,
  );
  inputs.salinityPct = 2.2;
  inputs.ammoniaPct = 0.2;
}

function applyAtmosphereTarget(inputs, archetype, answers) {
  const target = answers.atmosphere_target;
  if (!target) return;

  if (target === "airless") {
    setManualAtmosphere(inputs, { pressureAtm: 0, mix: {} });
    return;
  }

  const biosphereMix =
    answers.life_goal === "surface-biosphere"
      ? {
          n2Pct: 74,
          o2Pct: 20,
          co2Pct: 1.2,
          arPct: 1,
          h2oPct: 3.2,
          ch4Pct: 0.5,
        }
      : answers.life_goal === "microbial"
        ? {
            n2Pct: 86,
            o2Pct: 2,
            co2Pct: 4,
            arPct: 2,
            h2oPct: 4,
            ch4Pct: 2,
          }
        : {
            n2Pct: 88,
            o2Pct: 0,
            co2Pct: 5,
            arPct: 3,
            h2oPct: 2,
            ch4Pct: archetype.id === "hazy-atmosphere-moon" ? 6 : 2,
            coPct: archetype.id === "hazy-atmosphere-moon" ? 2 : 0,
          };

  const hazyMix =
    target === "dense" && archetype.id === "hazy-atmosphere-moon"
      ? {
          n2Pct: 82,
          o2Pct: 0,
          co2Pct: 1,
          arPct: 1,
          h2oPct: 2,
          ch4Pct: 10,
          coPct: 3,
          h2Pct: 1,
        }
      : {};

  const pressureAtm =
    target === "dense"
      ? archetype.id === "hazy-atmosphere-moon"
        ? 1.6
        : answers.life_goal === "surface-biosphere"
          ? 1.2
          : 1
      : target === "substantial"
        ? answers.life_goal === "surface-biosphere"
          ? 1.05
          : 0.75
        : 0.08;

  setManualAtmosphere(inputs, {
    pressureAtm,
    mix: {
      ...biosphereMix,
      ...hazyMix,
    },
  });
}

function applyActivityAndResonanceTargets(inputs, archetype, answers) {
  const resonanceSupport = answers.resonance_support;
  const activityTarget = answers.activity_target;

  if (resonanceSupport === "not-needed") {
    inputs.orbitalCouplingMode = archetype.id === "irregular-capture-moon" ? "full" : "core";
    inputs.forcedEccentricity = activityTarget === "active" ? 0.0015 : null;
  } else {
    inputs.orbitalCouplingMode = "full";
    inputs.forcedEccentricity = recommendedForcedEccentricity(
      archetype.id,
      activityTarget,
      resonanceSupport,
    );
  }

  if (archetype.id === "volcanic-moon" && activityTarget === "active") {
    inputs.compositionOverride = "Partially molten";
  }
}

function targetSurfaceCalibrationVariant(compiledGoal = {}, context = {}, variantIndex = 0) {
  if (!moonGoalTargetsSurfaceWarmth(compiledGoal)) return "baseline";
  if (String(context?.parentContext?.parentKind || "") !== "gasGiant") return "baseline";
  if (variantIndex >= 2) return "surface-resonant";
  if (variantIndex >= 1) return "surface-robust";
  return "baseline";
}

function applySurfaceCalibrationBias(inputs, answers = {}, context = {}) {
  const variant = String(answers.surface_calibration_variant || "baseline");
  if (variant === "baseline") return;

  const parentMassEarth = Math.max(toFiniteNumber(context?.parentContext?.massEarth, 0), 0);
  const robustMassMoon =
    parentMassEarth >= 3000
      ? 8.5
      : parentMassEarth >= 1500
        ? 9.5
        : parentMassEarth >= 700
          ? 10.5
          : 12;
  const resonantMassMoon = robustMassMoon + 3;

  inputs.massMoon = Math.max(
    toFiniteNumber(inputs.massMoon, 0),
    variant === "surface-resonant" ? resonantMassMoon : robustMassMoon,
  );
  inputs.densityGcm3 = Math.max(toFiniteNumber(inputs.densityGcm3, 0), 3.3);

  const compositionLabel = normalizeText(inputs.compositionOverride);
  if (
    !compositionLabel ||
    ["mixed rock/ice", "icy", "very icy", "subsurface ocean"].includes(compositionLabel)
  ) {
    inputs.compositionOverride = "Rocky";
  }

  if (variant === "surface-resonant") {
    inputs.orbitalCouplingMode = "full";
    inputs.eccentricity = Math.max(toFiniteNumber(inputs.eccentricity, 0), 0.075);
    inputs.forcedEccentricity = Math.max(toFiniteNumber(inputs.forcedEccentricity, 0), 0.075);
  }
}

function moonGoalTargetsSurfaceWarmth(compiledGoal = {}) {
  return (
    goalTraitSelected(compiledGoal, "surface-liquid-water") ||
    goalTraitSelected(compiledGoal, "surface-biosphere-plausible") ||
    goalTraitSelected(compiledGoal, "vegetation-plausible")
  );
}

function moonGoalNeedsInternalHeating(compiledGoal = {}, archetypeId = "") {
  return (
    goalTraitSelected(compiledGoal, "subsurface-ocean") ||
    goalTraitSelected(compiledGoal, "resonance-supported-heating") ||
    String(archetypeId || "") === "volcanic-moon"
  );
}

function uniqueOrderedStrings(values = []) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map((entry) => String(entry || "").trim())
        .filter(Boolean),
    ),
  ];
}

function buildMoonGoalOrbitVariants(compiledGoal = {}, context = {}, archetypeId = "") {
  const priority = String(compiledGoal?.priority || "").trim();
  const parentKind = String(context?.parentContext?.parentKind || "").trim();
  const wantsSurfaceWarmth = moonGoalTargetsSurfaceWarmth(compiledGoal);
  const wantsInternalHeating = moonGoalNeedsInternalHeating(compiledGoal, archetypeId);

  let variants = ["recipe-default"];
  if (wantsSurfaceWarmth) {
    variants =
      parentKind === "gasGiant"
        ? ["compact-habitable", "inner-habitable", "mid-habitable", "recipe-default"]
        : ["inner-habitable", "mid-habitable", "recipe-default"];
  } else if (wantsInternalHeating) {
    variants =
      String(archetypeId || "") === "volcanic-moon"
        ? ["inner-hot", "inner-resonant", "mid-resonant", "recipe-default"]
        : ["inner-resonant", "mid-resonant", "recipe-default"];
  }

  if (priority === "preserve-current-orbit-context") {
    variants = ["recipe-default", ...variants.filter((entry) => entry !== "recipe-default")];
  }

  return uniqueOrderedStrings(variants);
}

function resolveMoonOrbitVariantAxis(baseAxisKm, context = {}, variantId = "") {
  const referenceAxisKm =
    toFiniteNumber(baseAxisKm, NaN) > 0
      ? toFiniteNumber(baseAxisKm, NaN)
      : Math.max(toFiniteNumber(context?.currentInputs?.semiMajorAxisKm, 360000), 120000);
  const zoneInnerKm = Math.max(toFiniteNumber(context?.currentOrbitWindowKm?.inner, 0), 0);
  const zoneOuterKm = Math.max(toFiniteNumber(context?.currentOrbitWindowKm?.outer, 0), 0);
  const minAxisKm = zoneInnerKm > 0 ? Math.max(zoneInnerKm * 1.22, zoneInnerKm + 10000) : 100000;
  const maxAxisKm =
    zoneOuterKm > minAxisKm
      ? Math.max(minAxisKm + 60000, zoneOuterKm * 0.82)
      : Number.POSITIVE_INFINITY;

  let targetAxisKm = referenceAxisKm;
  switch (String(variantId || "")) {
    case "compact-habitable":
      targetAxisKm = zoneInnerKm > 0 ? zoneInnerKm * 1.75 : referenceAxisKm * 0.28;
      break;
    case "inner-habitable":
      targetAxisKm = zoneInnerKm > 0 ? zoneInnerKm * 2.3 : referenceAxisKm * 0.4;
      break;
    case "mid-habitable":
      targetAxisKm = zoneInnerKm > 0 ? zoneInnerKm * 3.1 : referenceAxisKm * 0.58;
      break;
    case "inner-hot":
      targetAxisKm = zoneInnerKm > 0 ? zoneInnerKm * 1.45 : referenceAxisKm * 0.22;
      break;
    case "inner-resonant":
      targetAxisKm = zoneInnerKm > 0 ? zoneInnerKm * 1.9 : referenceAxisKm * 0.34;
      break;
    case "mid-resonant":
      targetAxisKm = zoneInnerKm > 0 ? zoneInnerKm * 2.6 : referenceAxisKm * 0.5;
      break;
    case "recipe-default":
    default:
      targetAxisKm = referenceAxisKm;
      break;
  }

  const clampedAxisKm = Math.max(minAxisKm, Math.min(targetAxisKm, maxAxisKm));
  return clampMoonAxisToInteger(clampedAxisKm) ?? clampMoonAxisToInteger(referenceAxisKm);
}

function applyMoonOrbitVariant(inputs, context = {}, variantId = "") {
  const nextAxisKm = resolveMoonOrbitVariantAxis(inputs.semiMajorAxisKm, context, variantId);
  if (nextAxisKm != null) inputs.semiMajorAxisKm = nextAxisKm;
}

function tuneMoonApplyInputs(archetype, recipe, answers, context = {}) {
  const baseInputs = buildMoonRecipeApplyInputs(
    {
      ...recipe.apply,
      ...archetype.recommendedScienceModes,
    },
    recipe.id,
  );
  const nextInputs = { ...baseInputs };

  applyWaterTarget(nextInputs, archetype, answers);
  applyAtmosphereTarget(nextInputs, archetype, answers);
  applyActivityAndResonanceTargets(nextInputs, archetype, answers);
  applySurfaceCalibrationBias(nextInputs, answers, context);
  applyMoonOrbitVariant(nextInputs, context, answers.orbit_variant);

  if (answers.life_goal === "surface-biosphere") {
    nextInputs.hydrosphereMode = "full";
    if (nextInputs.atmosphereMode === "core") nextInputs.atmosphereMode = "manual";
  }

  return buildMoonRecipeApplyInputs(nextInputs, recipe.id);
}

function collectScienceModes(inputs = {}) {
  return {
    hydrosphereMode: inputs.hydrosphereMode || "core",
    atmosphereMode: inputs.atmosphereMode || "core",
    orbitalCouplingMode: inputs.orbitalCouplingMode || "core",
  };
}

function getHabitableOrbitMidpointAu(habitableZoneAu = null) {
  const inner = Number(habitableZoneAu?.inner);
  const outer = Number(habitableZoneAu?.outer);
  if (!Number.isFinite(inner) || !Number.isFinite(outer) || outer <= inner) return 1.15;
  return inner + (outer - inner) * 0.58;
}

function getColdVolatileOrbitAu(habitableZoneAu = null) {
  const outer = Number(habitableZoneAu?.outer);
  if (!Number.isFinite(outer) || outer <= 0) return 4.8;
  return Math.max(4.8, outer * 1.9);
}

function orbitFallsInsideRange(value, range = null) {
  const nextValue = Number(value);
  const inner = Number(range?.inner);
  const outer = Number(range?.outer);
  return (
    Number.isFinite(nextValue) &&
    Number.isFinite(inner) &&
    Number.isFinite(outer) &&
    outer > inner &&
    nextValue >= inner &&
    nextValue <= outer
  );
}

function buildMoonParentPatch(archetype, answers = {}, currentSolved = null, context = {}) {
  const parentContext = context.parentContext || null;
  if (!parentContext?.parentId || !parentContext?.parentKind || parentContext.assigned === false) {
    return null;
  }

  const model = currentSolved?.model || {};
  const temperature = model.temperature || {};
  const radiation = model.radiation || {};
  const highRadiation =
    answers.life_goal === "surface-biosphere"
      ? (Number(radiation.magnetosphericRadRemDay) || 0) >= 1
      : false;
  const habitableZoneAu = parentContext.starHabitableZoneAu || context.starHabitableZoneAu || null;
  const inputPatch = {};
  const notes = [];
  const orbitField = parentContext.parentKind === "gasGiant" ? "au" : "semiMajorAxisAu";
  const currentOrbitAu = Number(parentContext.orbitAu);
  const currentMassEarth = Number(parentContext.massEarth);
  const currentMassMjup = Number(parentContext.massMjup);
  const currentEccentricity = Number(parentContext.eccentricity);
  const surfaceTempK = Number(temperature.surfaceK);

  if (archetype.id === "temperate-ocean-moon" || archetype.id === "biologically-active-moon") {
    const targetOrbitAu = getHabitableOrbitMidpointAu(habitableZoneAu);
    if (
      !orbitFallsInsideRange(currentOrbitAu, habitableZoneAu) ||
      !Number.isFinite(surfaceTempK) ||
      surfaceTempK < 250 ||
      surfaceTempK > 330
    ) {
      inputPatch[orbitField] = targetOrbitAu;
      notes.push(`move ${parentContext.parentName || "the host"} to ${fmt(targetOrbitAu, 2)} AU`);
    }
    if (parentContext.parentKind === "gasGiant") {
      if (!Number.isFinite(currentMassMjup) || currentMassMjup < 0.35) {
        inputPatch.massMjup = 0.85;
        notes.push("raise the host to a Saturn/Jupiter-class mass");
      } else if (highRadiation && currentMassMjup > 1.2) {
        inputPatch.massMjup = 0.75;
        notes.push("soften the host magnetic environment with a slightly lower giant mass");
      }
    } else if (!Number.isFinite(currentMassEarth) || currentMassEarth < 1) {
      inputPatch.massEarth = 1.5;
      notes.push("raise the host mass modestly to widen the stable moon zone");
    }
    if (Number.isFinite(currentEccentricity) && currentEccentricity > 0.08) {
      inputPatch.eccentricity = 0.03;
      notes.push("reduce host eccentricity for a steadier climate");
    }
  } else if (archetype.id === "hazy-atmosphere-moon") {
    const targetOrbitAu = getColdVolatileOrbitAu(habitableZoneAu);
    if (!Number.isFinite(currentOrbitAu) || currentOrbitAu < targetOrbitAu * 0.85) {
      inputPatch[orbitField] = targetOrbitAu;
      notes.push(
        `move ${parentContext.parentName || "the host"} out to ${fmt(targetOrbitAu, 2)} AU`,
      );
    }
    if (
      parentContext.parentKind === "gasGiant" &&
      (!Number.isFinite(currentMassMjup) || currentMassMjup < 0.2)
    ) {
      inputPatch.massMjup = 0.55;
      notes.push("raise the giant host mass to keep a broad stable moon zone");
    }
    if (Number.isFinite(currentEccentricity) && currentEccentricity > 0.12) {
      inputPatch.eccentricity = 0.04;
      notes.push("reduce host eccentricity to stabilize the volatile atmosphere");
    }
  } else if (archetype.id === "subsurface-ocean-moon") {
    if (
      parentContext.parentKind === "gasGiant" &&
      (!Number.isFinite(currentMassMjup) || currentMassMjup < 0.18)
    ) {
      inputPatch.massMjup = 0.45;
      notes.push("raise the giant host mass to widen the stable inner moon system");
    }
  } else if (archetype.id === "volcanic-moon") {
    if (
      parentContext.parentKind === "gasGiant" &&
      (!Number.isFinite(currentMassMjup) || currentMassMjup < 0.3)
    ) {
      inputPatch.massMjup = 0.7;
      notes.push("raise the giant host mass to support a tighter volcanic moon architecture");
    } else if (
      parentContext.parentKind === "planet" &&
      (!Number.isFinite(currentMassEarth) || currentMassEarth < 1.2)
    ) {
      inputPatch.massEarth = 2;
      notes.push("raise the host planet mass to improve tidal forcing leverage");
    }
  }

  if (!Object.keys(inputPatch).length) return null;

  return {
    parentId: parentContext.parentId,
    parentKind: parentContext.parentKind,
    inputPatch,
    summary: notes.join("; "),
    notes,
  };
}

function ratioToAxisFactor(numerator, denominator) {
  return Math.pow(numerator / denominator, 2 / 3);
}

function clampMoonAxisToInteger(value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue) || nextValue <= 0) return null;
  return Math.max(10, Math.round(nextValue));
}

function buildSiblingName(context = {}, existingSiblings = []) {
  const baseName = context.currentMoonName
    ? `${context.currentMoonName} Resonant Companion`
    : "Resonant Companion";
  const existingNames = new Set(
    (Array.isArray(existingSiblings) ? existingSiblings : [])
      .map((entry) => String(entry?.name || entry?.inputs?.name || "").trim())
      .filter(Boolean),
  );
  if (!existingNames.has(baseName)) return baseName;
  for (let index = 2; index <= 8; index += 1) {
    const candidate = `${baseName} ${index}`;
    if (!existingNames.has(candidate)) return candidate;
  }
  return `${baseName} ${Date.now().toString().slice(-3)}`;
}

function buildResonanceAxisCandidates(currentOrbitKm, zoneInnerKm, zoneOuterKm) {
  const currentAxis = Number(currentOrbitKm);
  const inner = Number(zoneInnerKm);
  const outer = Number(zoneOuterKm);
  if (!Number.isFinite(currentAxis) || currentAxis <= 0) return [];
  const lowerBound = Number.isFinite(inner) && inner > 0 ? inner : 0;
  const upperBound =
    Number.isFinite(outer) && outer > lowerBound ? outer : Number.POSITIVE_INFINITY;
  const marginKm = Math.max(2500, currentAxis * 0.015);
  const candidates = [
    {
      resonanceLabel: "2:1",
      placement: "outer",
      semiMajorAxisKm: currentAxis * ratioToAxisFactor(2, 1),
      priority: 0,
    },
    {
      resonanceLabel: "3:2",
      placement: "outer",
      semiMajorAxisKm: currentAxis * ratioToAxisFactor(3, 2),
      priority: 1,
    },
    {
      resonanceLabel: "3:2",
      placement: "inner",
      semiMajorAxisKm: currentAxis / ratioToAxisFactor(3, 2),
      priority: 2,
    },
    {
      resonanceLabel: "2:1",
      placement: "inner",
      semiMajorAxisKm: currentAxis / ratioToAxisFactor(2, 1),
      priority: 3,
    },
  ];

  return candidates
    .map((candidate) => {
      const semiMajorAxisKm = clampMoonAxisToInteger(candidate.semiMajorAxisKm);
      return semiMajorAxisKm == null
        ? null
        : {
            ...candidate,
            semiMajorAxisKm,
          };
    })
    .filter(Boolean)
    .filter(
      (candidate) =>
        candidate.semiMajorAxisKm > lowerBound + marginKm &&
        candidate.semiMajorAxisKm < upperBound - marginKm,
    )
    .sort((left, right) => left.priority - right.priority);
}

function buildSiblingCreateInputs(currentModel = {}, candidate) {
  const currentInputs = currentModel?.inputs || {};
  return buildMoonRecipeApplyInputs({
    massMoon: Math.max(Math.min((Number(currentInputs.massMoon) || 1) * 0.7, 2.5), 0.08),
    densityGcm3: Math.max(Math.min(Number(currentInputs.densityGcm3) || 2.8, 6), 1.1),
    albedo: Number.isFinite(Number(currentInputs.albedo)) ? Number(currentInputs.albedo) : 0.18,
    semiMajorAxisKm: candidate.semiMajorAxisKm,
    eccentricity: Math.min(Math.max(Number(currentInputs.eccentricity) || 0.003, 0.001), 0.02),
    inclinationDeg: Math.min(Math.max(Math.abs(Number(currentInputs.inclinationDeg) || 0.2), 0), 2),
    compositionOverride: currentInputs.compositionOverride ?? null,
    initialRotationPeriodHours: currentInputs.initialRotationPeriodHours ?? 12,
    hydrosphereMode: "core",
    atmosphereMode: "core",
    orbitalCouplingMode: "full",
    forcedEccentricity: null,
    manualResonanceGroupId: null,
    manualResonanceOrder: null,
    manualResonanceRatio: null,
  });
}

function chooseSiblingRetune(siblingEntries = [], candidates = []) {
  const normalizedSiblings = Array.isArray(siblingEntries) ? siblingEntries : [];
  const normalizedCandidates = Array.isArray(candidates) ? candidates : [];
  let best = null;

  for (const sibling of normalizedSiblings) {
    const siblingAxisKm = Number(sibling?.inputs?.semiMajorAxisKm);
    if (!Number.isFinite(siblingAxisKm) || siblingAxisKm <= 0) continue;
    for (const candidate of normalizedCandidates) {
      const shiftPct = Math.abs(candidate.semiMajorAxisKm - siblingAxisKm) / siblingAxisKm;
      const score = shiftPct + candidate.priority * 0.03;
      if (!best || score < best.score) {
        best = {
          sibling,
          candidate,
          shiftPct,
          score,
        };
      }
    }
  }

  return best;
}

function buildMoonSiblingPatch(archetype, answers = {}, currentSolved = null, context = {}) {
  if (!answers.resonance_support || answers.resonance_support === "not-needed") return null;
  const resonance = currentSolved?.model?.resonance || {};
  if (resonance.sustainedHeatingFlag) return null;
  const parentContext = context.parentContext || null;
  const currentModel = currentSolved?.model || {};
  const orbit = currentModel.orbit || {};
  const siblingEntries = (
    Array.isArray(context.siblingEntries) ? context.siblingEntries : []
  ).filter((entry) => entry?.id && entry.id !== context.currentMoonId);
  const currentOrbitKm =
    Number(orbit.semiMajorAxisKm) || Number(currentModel?.inputs?.semiMajorAxisKm) || 0;
  const zoneInnerKm = Number(orbit.zoneInnerKm ?? orbit.moonZoneInnerKm);
  const zoneOuterKm = Number(orbit.zoneOuterKm ?? orbit.moonZoneOuterKm);
  const candidates = buildResonanceAxisCandidates(currentOrbitKm, zoneInnerKm, zoneOuterKm);
  if (!candidates.length || !parentContext?.parentId || parentContext.assigned === false) {
    return null;
  }

  const bestRetune = chooseSiblingRetune(siblingEntries, candidates);
  const shouldRetuneExisting = bestRetune && bestRetune.shiftPct <= 0.35;

  if (shouldRetuneExisting) {
    const sibling = bestRetune.sibling;
    const candidate = bestRetune.candidate;
    const siblingName = sibling?.name || sibling?.inputs?.name || sibling?.id || "Existing sibling";
    return {
      kind: "retune",
      summary: `retune ${siblingName} to ${fmt(candidate.semiMajorAxisKm, 0)} km for a ${candidate.resonanceLabel} ${candidate.placement} resonance`,
      reviewItems: [
        `Retune ${siblingName} to ${fmt(candidate.semiMajorAxisKm, 0)} km so it sits in a ${candidate.resonanceLabel} ${candidate.placement} resonance with ${context.currentMoonName || "the current moon"}.`,
        "This keeps the current moon selected and does not delete any existing moons.",
      ],
      operations: [
        {
          type: "update",
          moonId: sibling.id,
          inputPatch: {
            semiMajorAxisKm: candidate.semiMajorAxisKm,
            eccentricity: Math.min(
              Math.max(Number(sibling?.inputs?.eccentricity) || 0.003, 0.001),
              0.02,
            ),
            inclinationDeg: Math.min(
              Math.max(Math.abs(Number(sibling?.inputs?.inclinationDeg) || 0.2), 0),
              2,
            ),
            orbitalCouplingMode: "full",
          },
          reviewLabel: `Retune ${siblingName} to ${fmt(candidate.semiMajorAxisKm, 0)} km (${candidate.resonanceLabel} ${candidate.placement}).`,
        },
      ],
      siblingCount: Math.max(Number(parentContext?.siblingCount) || siblingEntries.length || 0, 0),
    };
  }

  const candidate = candidates[0];
  const siblingName = buildSiblingName(context, siblingEntries);
  return {
    kind: "create",
    summary: `add ${siblingName} at ${fmt(candidate.semiMajorAxisKm, 0)} km for a ${candidate.resonanceLabel} ${candidate.placement} resonance`,
    reviewItems: [
      `Create ${siblingName} as a new ${candidate.placement} sibling at ${fmt(candidate.semiMajorAxisKm, 0)} km.`,
      "This adds one supporting resonance partner without deleting or reassigning any existing moons.",
    ],
    operations: [
      {
        type: "create",
        name: siblingName,
        planetId: parentContext.parentId,
        inputs: buildSiblingCreateInputs(currentModel, candidate),
        reviewLabel: `Create ${siblingName} at ${fmt(candidate.semiMajorAxisKm, 0)} km (${candidate.resonanceLabel} ${candidate.placement}).`,
      },
    ],
    siblingCount: Math.max(Number(parentContext?.siblingCount) || siblingEntries.length || 0, 0),
  };
}

function buildContextAdjustments(parentPatch = null, siblingPatch = null) {
  const adjustments = [];
  if (parentPatch?.summary) adjustments.push(`Host fixes: ${parentPatch.summary}.`);
  if (siblingPatch?.summary) adjustments.push(`Moon-system fixes: ${siblingPatch.summary}.`);
  for (const item of siblingPatch?.reviewItems || []) {
    adjustments.push(item);
  }
  return adjustments;
}

function summarizeTargets(answers = {}) {
  const parts = [];
  if (answers.water_state) parts.push(`${answers.water_state.replace("-", " ")} water target`);
  if (answers.atmosphere_target)
    parts.push(`${answers.atmosphere_target.replace("-", " ")} atmosphere`);
  if (answers.life_goal) parts.push(`${answers.life_goal.replace("-", " ")} goal`);
  return parts;
}

function buildSummary(
  archetype,
  recipe,
  solved,
  answers,
  uxMode,
  parentPatch = null,
  siblingPatch = null,
) {
  const model = solved?.model;
  const targetSummary = summarizeTargets(answers).join(", ");
  if (!model?.display) {
    return uxMode === "guided" && targetSummary
      ? `Uses ${recipe?.label || archetype.label} as a guided starting point with ${targetSummary}.`
      : `Uses ${recipe?.label || archetype.label} as a quick physical starting point for the current moon.`;
  }
  const hydrosphere = model.display.hydrosphereState || "Unknown hydrosphere";
  const atmosphere = model.display.atmosphereClass || "Unknown atmosphere";
  const climate = model.display.climateState || "Unknown climate";
  return uxMode === "guided" && targetSummary
    ? parentPatch?.summary
      ? siblingPatch?.summary
        ? `Targets ${targetSummary}. After the recommended host and moon-system fixes, the result is ${hydrosphere}; ${atmosphere}; ${climate}.`
        : `Targets ${targetSummary}. After the recommended host fixes, the result is ${hydrosphere}; ${atmosphere}; ${climate}.`
      : siblingPatch?.summary
        ? `Targets ${targetSummary}. After the recommended moon-system fixes, the result is ${hydrosphere}; ${atmosphere}; ${climate}.`
        : `Targets ${targetSummary}. Current result in the active parent context: ${hydrosphere}; ${atmosphere}; ${climate}.`
    : `Applies ${recipe?.label || archetype.label} and re-solves it in the current parent context. Current result: ${hydrosphere}; ${atmosphere}; ${climate}.`;
}

function buildRationale(archetype, answers = {}, parentPatch = null, siblingPatch = null) {
  const rationale = [...(archetype.rationale || [])];
  const targetSummary = summarizeTargets(answers);
  if (targetSummary.length) rationale.push(`Guided target: ${targetSummary.join(", ")}.`);
  if (answers.parent_context_policy === "strict") {
    rationale.push("Treats the current star and parent context as a hard constraint.");
  } else if (answers.parent_context_policy === "guided-patch") {
    rationale.push("Allows guided host-context fixes when the current parent is a poor fit.");
  } else if (answers.parent_context_policy) {
    rationale.push(
      "Allows the current host context to degrade the result into a warning-only best effort.",
    );
  }
  if (parentPatch?.summary) rationale.push(`Recommended host fixes: ${parentPatch.summary}.`);
  if (siblingPatch?.summary)
    rationale.push(`Recommended moon-system fixes: ${siblingPatch.summary}.`);
  return rationale;
}

function maybePushDiagnostic(
  condition,
  list,
  severity,
  code,
  title,
  detail,
  suggestedActions = [],
) {
  if (!condition) return;
  pushDiagnostic(list, severity, code, title, detail, suggestedActions);
}

function buildMoonDiagnostics(
  archetype,
  recipe,
  solved,
  answers = {},
  flowState = {},
  context = {},
  { recommendedSolved = null, parentPatch = null, siblingPatch = null } = {},
) {
  const diagnostics = [];
  const currentModel = solved?.model || {};
  const model = recommendedSolved?.model || currentModel;
  const usingHostFixPreview = !!parentPatch?.summary;
  const display = model.display || {};
  const atmosphere = model.atmosphere || {};
  const hydrosphere = model.hydrosphere || {};
  const biosphere = model.biosphere || {};
  const orbit = model.orbit || {};
  const resonance = model.resonance || {};
  const radiation = model.radiation || {};
  const temperature = model.temperature || {};
  const currentHydrosphere = currentModel.hydrosphere || {};
  const currentAtmosphere = currentModel.atmosphere || {};
  const currentResonance = currentModel.resonance || {};
  const currentRadiation = currentModel.radiation || {};
  const currentTemperature = currentModel.temperature || {};
  const parentBlockers = [];
  const solvedResultLabel = usingHostFixPreview
    ? "The host-adjusted recommendation"
    : "The current result";
  const solvedPathLabel = usingHostFixPreview
    ? "after the recommended host fixes"
    : "in the current host context";

  pushDiagnostic(
    diagnostics,
    "info",
    "recipe-source",
    "Engine-backed starting point",
    `This ${flowState?.uxMode === "guided" ? "guided flow" : "quick type"} maps to the ${recipe?.label || archetype.label} moon preset.`,
    ["Apply it, then refine on the Moon page if you need tighter control."],
  );

  const wantsSurfaceWater = answers.water_state === "surface";
  const wantsSubsurfaceWater = answers.water_state === "subsurface";
  const wantsSurfaceBiology = answers.life_goal && answers.life_goal !== "sterile";
  const requestedLand = landExposureThreshold(answers.land_exposure_pref);
  const hasLandFraction = Number.isFinite(Number(hydrosphere.landFraction));
  const currentLand = hasLandFraction ? Math.max(Number(hydrosphere.landFraction) || 0, 0) : 0;
  const currentHostLand = Number.isFinite(Number(currentHydrosphere.landFraction))
    ? Math.max(Number(currentHydrosphere.landFraction) || 0, 0)
    : 0;
  const pressureAtm = Math.max(Number(atmosphere.surfacePressureAtm) || 0, 0);
  const currentPressureAtm = Math.max(Number(currentAtmosphere.surfacePressureAtm) || 0, 0);
  const requiredPressure = requiredPressureAtm(answers.atmosphere_target);
  const surfaceTempK = Math.max(Number(temperature.surfaceK) || 0, 0);
  const currentSurfaceTempK = Math.max(Number(currentTemperature.surfaceK) || 0, 0);
  const hasSurfaceTemp = surfaceTempK > 0;
  const currentHasSurfaceTemp = currentSurfaceTempK > 0;
  const hasRadiationSignal = Number.isFinite(Number(radiation.magnetosphericRadRemDay));
  const currentHasRadiationSignal = Number.isFinite(
    Number(currentRadiation.magnetosphericRadRemDay),
  );
  const hasResonanceSignal =
    typeof resonance.sustainedHeatingFlag === "boolean" || resonance.nearestResonance != null;
  const currentHasResonanceSignal =
    typeof currentResonance.sustainedHeatingFlag === "boolean" ||
    currentResonance.nearestResonance != null;
  const surfaceTempRangeOk =
    !hasSurfaceTemp || (!wantsSurfaceWater && !wantsSurfaceBiology)
      ? true
      : answers.life_goal === "surface-biosphere"
        ? surfaceTempK >= 260 && surfaceTempK <= 320
        : surfaceTempK >= 250 && surfaceTempK <= 330;
  const currentSurfaceTempRangeOk =
    !currentHasSurfaceTemp || (!wantsSurfaceWater && !wantsSurfaceBiology)
      ? true
      : answers.life_goal === "surface-biosphere"
        ? currentSurfaceTempK >= 260 && currentSurfaceTempK <= 320
        : currentSurfaceTempK >= 250 && currentSurfaceTempK <= 330;
  const tidalHzEligible =
    resonance.tidalHabitableZone == null
      ? null
      : resonance.tidalHabitableZone.starHzEligible !== false;
  const withinTidalHz =
    resonance.tidalHabitableZone == null ? null : resonance.withinTidalHabitableZone !== false;
  const currentTidalHzEligible =
    currentResonance.tidalHabitableZone == null
      ? null
      : currentResonance.tidalHabitableZone.starHzEligible !== false;
  const currentWithinTidalHz =
    currentResonance.tidalHabitableZone == null
      ? null
      : currentResonance.withinTidalHabitableZone !== false;
  const atmosphereTransient =
    atmosphere.stability &&
    (String(atmosphere.stability?.balanceLabel || "").toLowerCase() === "transient" ||
      (Number(atmosphere.stability?.estimatedLifetimeGyr) || 0) < 0.5);
  const currentAtmosphereTransient =
    currentAtmosphere.stability &&
    (String(currentAtmosphere.stability?.balanceLabel || "").toLowerCase() === "transient" ||
      (Number(currentAtmosphere.stability?.estimatedLifetimeGyr) || 0) < 0.5);
  const magnetoDose = Math.max(Number(radiation.magnetosphericRadRemDay) || 0, 0);
  const currentMagnetoDose = Math.max(Number(currentRadiation.magnetosphericRadRemDay) || 0, 0);
  const highRadiation = !hasRadiationSignal
    ? false
    : answers.life_goal === "surface-biosphere"
      ? magnetoDose >= 1
      : wantsSurfaceBiology
        ? magnetoDose >= 10
        : false;
  const currentHighRadiation = !currentHasRadiationSignal
    ? false
    : answers.life_goal === "surface-biosphere"
      ? currentMagnetoDose >= 1
      : wantsSurfaceBiology
        ? currentMagnetoDose >= 10
        : false;

  if (context.parentContext?.assigned === false) {
    parentBlockers.push("no parent body is currently assigned to this moon");
  }

  maybePushDiagnostic(
    String(orbit.semiMajorAxisGuard || "none") !== "none",
    diagnostics,
    "warning",
    "outside-moon-zone",
    "Orbit needed Moon Zone clamping",
    "The seeded orbit had to be clamped to stay inside the current moon zone.",
    ["Move the moon farther from the Roche edge or pick a different host context."],
  );
  if (String(orbit.semiMajorAxisGuard || "none") !== "none")
    parentBlockers.push("the seed orbit sits outside the current moon zone");

  maybePushDiagnostic(
    wantsSurfaceWater && hydrosphere.surfaceLiquidPresent !== true,
    diagnostics,
    "warning",
    "too-little-water",
    "Surface water target not met",
    `${solvedResultLabel} does not sustain exposed surface liquid water ${solvedPathLabel}.`,
    ["Increase water inventory, pressure, or parent insolation compatibility."],
  );
  if (wantsSurfaceWater && currentHydrosphere.surfaceLiquidPresent !== true) {
    parentBlockers.push("surface water is not sustained");
  }

  maybePushDiagnostic(
    wantsSubsurfaceWater && hydrosphere.subsurfaceOceanPresent !== true,
    diagnostics,
    "warning",
    "too-little-water",
    "Subsurface ocean target not met",
    `${solvedResultLabel} does not clearly sustain a buried ocean ${solvedPathLabel}.`,
    ["Increase internal heating or water inventory support."],
  );
  if (wantsSubsurfaceWater && currentHydrosphere.subsurfaceOceanPresent !== true) {
    parentBlockers.push("subsurface water support is weak");
  }

  maybePushDiagnostic(
    wantsSurfaceWater &&
      answers.land_exposure_pref &&
      hasLandFraction &&
      currentLand < requestedLand,
    diagnostics,
    "warning",
    "insufficient-land-exposure",
    "Land exposure is below the requested target",
    `${solvedResultLabel} stays more ocean-covered than the requested land exposure preference.`,
    ["Lower surface water inventory or switch to a more oceanic land target."],
  );
  if (
    wantsSurfaceWater &&
    answers.land_exposure_pref &&
    Number.isFinite(currentHostLand) &&
    currentHostLand < requestedLand
  ) {
    parentBlockers.push("land exposure stays below the requested target");
  }

  maybePushDiagnostic(
    wantsSurfaceWater &&
      answers.land_exposure_pref !== "oceanic" &&
      hasLandFraction &&
      currentLand < 0.08,
    diagnostics,
    "warning",
    "too-much-water",
    "Water inventory washes out exposed land",
    `${solvedResultLabel} trends toward a global ocean rather than a mixed land-ocean surface.`,
    ["Reduce water inventory or relax the land exposure target."],
  );

  maybePushDiagnostic(
    answers.atmosphere_target &&
      answers.atmosphere_target !== "airless" &&
      pressureAtm < requiredPressure,
    diagnostics,
    "warning",
    "insufficient-pressure",
    "Atmospheric pressure is below the requested target",
    `${solvedResultLabel} does not retain enough surface pressure for the chosen atmosphere target.`,
    ["Increase volatile support or relax the atmosphere target."],
  );
  if (
    answers.atmosphere_target &&
    answers.atmosphere_target !== "airless" &&
    currentPressureAtm < requiredPressure
  ) {
    parentBlockers.push("surface pressure is below the requested atmosphere target");
  }

  maybePushDiagnostic(
    answers.atmosphere_target && answers.atmosphere_target !== "airless" && atmosphereTransient,
    diagnostics,
    "warning",
    "transient-atmosphere",
    "Atmosphere looks transient in the current context",
    `The solved atmosphere looks transient ${solvedPathLabel} and likely needs ongoing replenishment.`,
    ["Review escape diagnostics, volatile inventory, and cryovolcanic support."],
  );
  if (
    answers.atmosphere_target &&
    answers.atmosphere_target !== "airless" &&
    currentAtmosphereTransient
  ) {
    parentBlockers.push("the atmosphere is transient under the current host context");
  }

  maybePushDiagnostic(
    wantsSurfaceBiology && highRadiation,
    diagnostics,
    "warning",
    "high-radiation-surface-risk",
    "Surface radiation risk is high",
    `The modeled magnetospheric radiation dose is harsh for exposed surface biology goals ${solvedPathLabel}.`,
    ["Move outward, reduce parent radiation, or lower the biology target."],
  );
  if (wantsSurfaceBiology && currentHighRadiation) {
    parentBlockers.push("surface radiation is too high for the chosen biology goal");
  }

  maybePushDiagnostic(
    hasResonanceSignal &&
      answers.resonance_support &&
      answers.resonance_support !== "not-needed" &&
      !resonance.sustainedHeatingFlag,
    diagnostics,
    "warning",
    "no-resonance-support",
    "Resonance support is weak",
    `The current moon system does not clearly sustain the requested resonance-supported heating path ${solvedPathLabel}.`,
    siblingPatch?.summary
      ? [
          siblingPatch.summary,
          "Relax the resonance target if you do not want to edit the moon system.",
        ]
      : ["Use a more supportive sibling-moon architecture or relax the resonance target."],
  );
  if (
    currentHasResonanceSignal &&
    answers.resonance_support === "required" &&
    !currentResonance.sustainedHeatingFlag &&
    !resonance.sustainedHeatingFlag
  ) {
    parentBlockers.push(
      siblingPatch?.summary
        ? "the reviewed moon-system fixes still do not produce sustained resonance support"
        : "sustained resonance support is not present",
    );
  }

  maybePushDiagnostic(
    (wantsSurfaceWater || wantsSurfaceBiology) &&
      tidalHzEligible === true &&
      withinTidalHz !== true,
    diagnostics,
    "warning",
    "outside-tidal-hz",
    "Moon sits outside the current tidal habitable zone",
    `The current orbit is outside the moon's tidal habitable zone ${solvedPathLabel}.`,
    ["Adjust the moon orbit or parent context, or relax the surface-habitability target."],
  );
  if (
    (wantsSurfaceWater || wantsSurfaceBiology) &&
    currentTidalHzEligible === true &&
    currentWithinTidalHz !== true
  ) {
    parentBlockers.push("the current orbit sits outside the tidal habitable zone");
  }

  maybePushDiagnostic(
    hasSurfaceTemp && (wantsSurfaceWater || wantsSurfaceBiology) && !surfaceTempRangeOk,
    diagnostics,
    "warning",
    "surface-temperature-out-of-range",
    "Surface temperature is outside the requested range",
    `The solved surface temperature falls outside the range implied by the chosen water or biology goal ${solvedPathLabel}.`,
    ["Review albedo, pressure, orbit, and parent insolation."],
  );
  if (
    currentHasSurfaceTemp &&
    (wantsSurfaceWater || wantsSurfaceBiology) &&
    !currentSurfaceTempRangeOk
  ) {
    parentBlockers.push("surface temperature falls outside the requested range");
  }

  maybePushDiagnostic(
    archetype.id === "airless-rocky-moon" &&
      !includesAny(display.atmosphereClass, ["airless", "exosphere"]),
    diagnostics,
    "warning",
    "unexpected-atmosphere",
    "Atmosphere retained in the current context",
    `This solve does not land in an airless or exosphere state ${solvedPathLabel}.`,
    ["Check escape velocity, volatile inventory, and parent irradiation."],
  );

  maybePushDiagnostic(
    archetype.id === "irregular-capture-moon" &&
      !includesAny(display.orbitalDirection, ["retrograde"]),
    diagnostics,
    "warning",
    "orbit-too-regular",
    "Orbit looks more regular than captured",
    `The current solve does not preserve a strongly irregular captured-looking orbit ${solvedPathLabel}.`,
    ["Increase inclination/eccentricity or relax the archetype choice."],
  );

  maybePushDiagnostic(
    wantsSurfaceBiology && includesAny(display.surfaceBiosphere, ["sterile", "marginal"]),
    diagnostics,
    "warning",
    "biosphere-weak",
    "Surface biosphere target is not reached",
    `The current solve does not strongly support the requested exposed biosphere target ${solvedPathLabel}.`,
    ["Switch to a lower life goal or improve atmosphere, water, and radiation conditions."],
  );

  maybePushDiagnostic(
    wantsSurfaceBiology &&
      biosphere.vegetationEligible !== true &&
      answers.life_goal === "surface-biosphere",
    diagnostics,
    "warning",
    "vegetation-unsupported",
    "Vegetation is not supported in the current solve",
    `The solve does not reach the stronger vegetation gate for this moon ${solvedPathLabel}.`,
    ["Treat this as a starting point and refine the system context."],
  );

  if (
    answers.parent_context_policy === "strict" &&
    flowState?.uxMode === "guided" &&
    parentBlockers.length
  ) {
    pushDiagnostic(
      diagnostics,
      "blocked",
      "blocked-by-parent-context",
      "Current host context blocks this guided target",
      `${context.currentContextLabel || "Current host context"} cannot satisfy this guided target because ${parentBlockers.slice(0, 2).join(" and ")}.`,
      ["Switch Parent Fit Policy to Best-effort fit or adjust the current host context."],
    );
  } else if (answers.parent_context_policy === "guided-patch" && parentBlockers.length) {
    pushDiagnostic(
      diagnostics,
      parentPatch?.summary ? "info" : "blocked",
      "blocked-by-parent-context",
      parentPatch?.summary
        ? "Recommended host fixes prepared"
        : "Current host context still blocks this guided target",
      parentPatch?.summary
        ? `${context.currentContextLabel || "Current host context"} currently misses this target because ${parentBlockers.slice(0, 2).join(" and ")}. Guided host fixes will ${parentPatch.summary}.`
        : `${context.currentContextLabel || "Current host context"} cannot satisfy this guided target because ${parentBlockers.slice(0, 2).join(" and ")}.`,
      parentPatch?.summary
        ? [
            "Apply with Host Fixes to patch the current parent and then apply the moon recommendation.",
          ]
        : [
            "No supported host fix is available on this page. Try Best-effort fit or edit the parent body directly.",
          ],
    );
  } else if (answers.parent_context_policy === "flexible" && parentBlockers.length) {
    pushDiagnostic(
      diagnostics,
      "info",
      "blocked-by-parent-context",
      "Current host context is a weak fit",
      `${context.currentContextLabel || "Current host context"} does not fully support this guided target, but Best-effort fit keeps it as a starting point.`,
      ["Apply it as a starting point, or adjust the host context before applying."],
    );
  }

  const solveError = recommendedSolved?.error || solved?.error;
  if (solveError) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "solve-preview-failed",
      "Preview solve unavailable",
      solveError,
      ["Apply the starting point, then review the Moon page outputs directly."],
    );
  }

  return diagnostics;
}

function solveMoonRecommendationFromArchetype(
  archetype,
  flowState,
  context = {},
  answersOverride = null,
) {
  if (!archetype) return null;

  const recipe = getRecipeForArchetype(archetype.id, context);
  if (!recipe) return null;

  const answers = answersOverride || resolveMoonGuidedAnswers(archetype, flowState);
  const applyInputs =
    flowState?.uxMode === "guided"
      ? tuneMoonApplyInputs(archetype, recipe, answers, context)
      : buildMoonRecipeApplyInputs(
          {
            ...recipe.apply,
            ...archetype.recommendedScienceModes,
          },
          recipe.id,
        );

  const runSolve = (options = {}) => {
    if (typeof context.solveMoonInputs !== "function") return null;
    try {
      return context.solveMoonInputs(applyInputs, options) || null;
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Moon quick-type solve failed for this context.",
      };
    }
  };

  const currentSolved = runSolve();
  const parentPatch =
    flowState?.uxMode === "guided" && answers.parent_context_policy === "guided-patch"
      ? buildMoonParentPatch(archetype, answers, currentSolved, context)
      : null;
  const hostAdjustedSolved =
    parentPatch && flowState?.uxMode === "guided" ? runSolve({ parentPatch }) : currentSolved;
  const siblingPatch =
    flowState?.uxMode === "guided"
      ? buildMoonSiblingPatch(archetype, answers, hostAdjustedSolved, context)
      : null;
  const solved =
    parentPatch || siblingPatch ? runSolve({ parentPatch, siblingPatch }) : currentSolved;
  const contextAdjustments = buildContextAdjustments(parentPatch, siblingPatch);
  const diagnostics = buildMoonDiagnostics(
    archetype,
    recipe,
    currentSolved,
    answers,
    flowState,
    context,
    {
      recommendedSolved: solved,
      parentPatch,
      siblingPatch,
    },
  );

  return {
    objectType: "moon",
    archetypeId: archetype.id,
    confidenceClass: archetype.confidenceClass,
    title: archetype.label,
    summary: buildSummary(
      archetype,
      recipe,
      solved,
      answers,
      flowState?.uxMode,
      parentPatch,
      siblingPatch,
    ),
    scienceModeRecommendation: collectScienceModes(applyInputs),
    applyPayload: {
      objectInputs: applyInputs,
      parentPatch,
      siblingPatch,
    },
    previewPayload:
      solved?.model && typeof solved.model === "object"
        ? {
            bodyType: "moon",
            name: context.currentMoonName || recipe.label || archetype.label,
            recipeId: recipe.id,
            moonCalc: solved.model,
          }
        : null,
    contextAdjustments,
    diagnostics,
    rationale: buildRationale(archetype, answers, parentPatch, siblingPatch),
    nextActions: [...(archetype.nextActions || [])],
  };
}

function moonSearchCandidateCap(searchBudget = "balanced") {
  switch (String(searchBudget || "")) {
    case "fast":
      return 4;
    case "deep":
      return 12;
    case "balanced":
    default:
      return 9;
  }
}

function deriveMoonGoalSeedAnswers(compiledGoal = {}, archetypeId = "", variantIndex = 0) {
  const answers = { ...getMoonGuidedDefaults(archetypeId) };
  const prefersSystemEdits =
    String(compiledGoal?.allowedEdits || "") === "edit-object-plus-local-system";
  const prefersHostEdits = String(compiledGoal?.allowedEdits || "") === "edit-object-plus-host";
  answers.parent_context_policy =
    prefersSystemEdits || prefersHostEdits ? "guided-patch" : "flexible";

  if (goalTraitSelected(compiledGoal, "surface-liquid-water")) answers.water_state = "surface";
  else if (goalTraitSelected(compiledGoal, "subsurface-ocean")) answers.water_state = "subsurface";
  else if (goalTraitAvoided(compiledGoal, "surface-liquid-water")) answers.water_state = "dry";

  if (goalTraitSelected(compiledGoal, "retained-atmosphere")) {
    answers.atmosphere_target = goalTraitSelected(compiledGoal, "visible-clouds")
      ? "dense"
      : "substantial";
  } else if (goalTraitAvoided(compiledGoal, "airless-surface")) {
    answers.atmosphere_target = "thin";
  } else {
    answers.atmosphere_target = "airless";
  }

  if (goalTraitSelected(compiledGoal, "resonance-supported-heating")) {
    answers.activity_target = archetypeId === "volcanic-moon" ? "active" : "moderate";
    answers.resonance_support = goalTraitRequired(compiledGoal, "resonance-supported-heating")
      ? "required"
      : "preferred";
  } else {
    answers.resonance_support = "not-needed";
    answers.activity_target =
      archetypeId === "subsurface-ocean-moon" ? "moderate" : answers.activity_target || "quiet";
  }

  if (goalTraitSelected(compiledGoal, "vegetation-plausible")) {
    answers.life_goal = "surface-biosphere";
  } else if (goalTraitSelected(compiledGoal, "surface-biosphere-plausible")) {
    answers.life_goal = variantIndex > 0 ? "surface-biosphere" : "microbial";
  } else {
    answers.life_goal = "sterile";
  }

  if (answers.water_state === "surface") {
    answers.land_exposure_pref =
      variantIndex > 1
        ? "oceanic"
        : goalTraitSelected(compiledGoal, "vegetation-plausible")
          ? "balanced"
          : "balanced";
  }

  return answers;
}

function buildMoonGoalSearchCandidates(compiledGoal = {}, context = {}) {
  const templateMeta = getMoonGoalTemplateMeta(compiledGoal.goalTemplateId);
  const seedIds = [...new Set(templateMeta.seedArchetypeIds || [])];
  const candidates = [];

  for (const archetypeId of seedIds) {
    const orbitVariants = buildMoonGoalOrbitVariants(compiledGoal, context, archetypeId);
    let variantBudget = 1;
    if (String(compiledGoal?.searchBudget || "") === "deep") variantBudget = 2;
    if (
      goalTraitSelected(compiledGoal, "surface-biosphere-plausible") ||
      goalTraitSelected(compiledGoal, "vegetation-plausible") ||
      orbitVariants.length > 3
    ) {
      variantBudget += 1;
    }
    if (
      moonGoalTargetsSurfaceWarmth(compiledGoal) &&
      String(context?.parentContext?.parentKind || "") === "gasGiant"
    ) {
      variantBudget = Math.max(
        variantBudget,
        String(compiledGoal?.searchBudget || "") === "fast" ? 2 : 3,
      );
    }

    const variantOrder = Array.from({ length: variantBudget }, (_, index) => index);
    if (
      moonGoalTargetsSurfaceWarmth(compiledGoal) &&
      String(context?.parentContext?.parentKind || "") === "gasGiant" &&
      variantBudget >= 3
    ) {
      variantOrder.splice(0, variantOrder.length, 1, 2, 0);
    }

    for (const variantIndex of variantOrder) {
      for (const orbitVariant of orbitVariants) {
        candidates.push({
          archetypeId,
          variantIndex,
          orbitVariant,
          answers: {
            ...deriveMoonGoalSeedAnswers(compiledGoal, archetypeId, variantIndex),
            surface_calibration_variant: targetSurfaceCalibrationVariant(
              compiledGoal,
              context,
              variantIndex,
            ),
            orbit_variant: orbitVariant,
          },
        });
      }
    }
  }
  return candidates.slice(0, moonSearchCandidateCap(compiledGoal.searchBudget));
}

function evaluateMoonGoalTrait(traitId, recommendation = {}) {
  const model = recommendation?.previewPayload?.moonCalc || {};
  const display = model.display || {};
  const hydrosphere = model.hydrosphere || {};
  const atmosphere = model.atmosphere || {};
  const resonance = model.resonance || {};
  const radiation = model.radiation || {};
  const biosphere = model.biosphere || {};
  const habitabilitySummary = model.habitability?.summary || {};
  const classifications = habitabilitySummary.classifications || {};
  const pressureAtm = Math.max(toFiniteNumber(atmosphere.surfacePressureAtm, 0), 0);
  const magnetoDose = Math.max(toFiniteNumber(radiation.magnetosphericRadRemDay, 0), 0);
  const climateText = normalizeText(display.climateState);
  const atmosphereText = normalizeText(display.atmosphereClass);
  const biosphereText = normalizeText(display.surfaceBiosphere);
  const surfaceClass = String(radiation.surfaceClass || "").trim();
  const subsurfaceClass = String(radiation.subsurfaceClass || "").trim();

  switch (traitId) {
    case "surface-liquid-water":
      return (
        classifications.surfaceOceanPlausible === true ||
        classifications.surfaceRadiationLimited === true ||
        hydrosphere.surfaceLiquidPresent === true
      );
    case "subsurface-ocean":
      return (
        classifications.subsurfaceOceanPlausible === true ||
        hydrosphere.subsurfaceOceanPresent === true
      );
    case "retained-atmosphere":
      return (
        habitabilitySummary.gates?.atmosphereRetention?.surfacePass === true ||
        pressureAtm >= 0.05 ||
        !includesAny(atmosphereText, ["airless", "exosphere"])
      );
    case "resonance-supported-heating":
      return resonance.sustainedHeatingFlag === true;
    case "in-stellar-habitable-zone":
      return (
        habitabilitySummary.gates?.stellarZone?.pass === true ||
        resonance.tidalHabitableZone?.starHzEligible !== false
      );
    case "surface-biosphere-plausible":
      return (
        classifications.surfaceBiospherePlausible === true ||
        (toFiniteNumber(biosphere.surfaceBiologyScore, 0) >= 0.35 &&
          hydrosphere.surfaceLiquidPresent === true &&
          pressureAtm >= 0.1) ||
        !includesAny(biosphereText, ["sterile"])
      );
    case "vegetation-plausible":
      return biosphere.vegetationEligible === true;
    case "visible-clouds":
      return pressureAtm >= 0.2 && !includesAny(atmosphereText, ["airless", "thin"]);
    case "low-radiation":
      return (
        ["Low", "Elevated"].includes(surfaceClass) ||
        ["Low", "Elevated"].includes(subsurfaceClass) ||
        magnetoDose < 1
      );
    case "atmospheric-collapse":
      return includesAny(display.collapseState, ["collapse", "collapsed"]);
    case "extreme-radiation":
      return (
        classifications.surfaceRadiationLimited === true ||
        surfaceClass === "Surface-sterilizing" ||
        magnetoDose >= 10
      );
    case "runaway-greenhouse":
      return (
        classifications.tidalOverheated === true ||
        includesAny(climateText, ["runaway", "greenhouse"])
      );
    case "airless-surface":
      return pressureAtm < 0.02 || includesAny(atmosphereText, ["airless", "exosphere"]);
    default:
      return false;
  }
}

function proximityToRange(value, min, max, shoulder = 0) {
  const nextValue = toFiniteNumber(value, NaN);
  const nextMin = toFiniteNumber(min, NaN);
  const nextMax = toFiniteNumber(max, NaN);
  const nextShoulder = Math.max(toFiniteNumber(shoulder, 0), 0);
  if (
    !Number.isFinite(nextValue) ||
    !Number.isFinite(nextMin) ||
    !Number.isFinite(nextMax) ||
    nextMax <= nextMin
  ) {
    return 0;
  }
  if (nextValue >= nextMin && nextValue <= nextMax) return 1;
  if (!nextShoulder) return 0;
  if (nextValue < nextMin) return clampUnitInterval(1 - (nextMin - nextValue) / nextShoulder);
  return clampUnitInterval(1 - (nextValue - nextMax) / nextShoulder);
}

function evaluateMoonGoalTraitProgress(traitId, recommendation = {}) {
  if (evaluateMoonGoalTrait(traitId, recommendation)) return 1;

  const model = recommendation?.previewPayload?.moonCalc || {};
  const display = model.display || {};
  const hydrosphere = model.hydrosphere || {};
  const atmosphere = model.atmosphere || {};
  const temperature = model.temperature || {};
  const radiation = model.radiation || {};
  const biosphere = model.biosphere || {};
  const habitabilitySummary = model.habitability?.summary || {};
  const classifications = habitabilitySummary.classifications || {};
  const pressureAtm = Math.max(toFiniteNumber(atmosphere.surfacePressureAtm, 0), 0);
  const surfaceK = Math.max(toFiniteNumber(temperature.surfaceK, 0), 0);
  const magnetoDose = Math.max(toFiniteNumber(radiation.magnetosphericRadRemDay, 0), 0);
  const biologyScore = clampUnitInterval(toFiniteNumber(biosphere.surfaceBiologyScore, 0));
  const surfaceClass = String(radiation.surfaceClass || "").trim();
  const subsurfaceClass = String(radiation.subsurfaceClass || "").trim();

  switch (traitId) {
    case "surface-liquid-water": {
      const tempScore = proximityToRange(surfaceK, 273, 320, 85);
      const pressureScore = clampUnitInterval(pressureAtm / 0.15);
      const hydrosphereScore =
        classifications.surfaceRadiationLimited === true
          ? 1
          : classifications.subsurfaceOceanPlausible === true || hydrosphere.subsurfaceOceanPresent
            ? 0.45
            : includesAny(display.hydrosphereState, ["ocean"])
              ? 0.6
              : includesAny(display.hydrosphereState, ["ice", "snowball", "frozen"])
                ? 0.08
                : 0.2;
      return clampUnitInterval(tempScore * 0.5 + pressureScore * 0.25 + hydrosphereScore * 0.25);
    }
    case "retained-atmosphere": {
      const pressureScore = clampUnitInterval(pressureAtm / 0.25);
      const atmosphereScore = habitabilitySummary.classifications?.atmosphereMarginal
        ? 0.7
        : includesAny(display.atmosphereClass, ["thin"])
          ? 0.45
          : 0;
      return clampUnitInterval(pressureScore * 0.75 + atmosphereScore * 0.25);
    }
    case "surface-biosphere-plausible": {
      const waterScore = evaluateMoonGoalTraitProgress("surface-liquid-water", recommendation);
      const atmosphereScore = evaluateMoonGoalTraitProgress("retained-atmosphere", recommendation);
      const tempScore = proximityToRange(surfaceK, 260, 320, 65);
      const radiationScore =
        surfaceClass === "Low"
          ? 1
          : surfaceClass === "Elevated"
            ? 0.8
            : surfaceClass === "Harsh"
              ? 0.2
              : clampUnitInterval(1 - magnetoDose / 10);
      return clampUnitInterval(
        waterScore * 0.35 +
          atmosphereScore * 0.25 +
          tempScore * 0.2 +
          radiationScore * 0.1 +
          biologyScore * 0.1,
      );
    }
    case "vegetation-plausible": {
      const biosphereScore = evaluateMoonGoalTraitProgress(
        "surface-biosphere-plausible",
        recommendation,
      );
      const vegetationScore = biosphere.vegetationEligible === true ? 1 : 0;
      return clampUnitInterval(vegetationScore * 0.55 + biosphereScore * 0.45);
    }
    case "low-radiation":
      if (surfaceClass === "Low" || subsurfaceClass === "Low") return 1;
      if (surfaceClass === "Elevated" || subsurfaceClass === "Elevated") return 0.78;
      if (surfaceClass === "Harsh" || subsurfaceClass === "Harsh") return 0.3;
      return clampUnitInterval(1 - magnetoDose / 10);
    default:
      return 0;
  }
}

function moonRadiationClassScore(classLabel = "", exposureLevel = NaN) {
  switch (String(classLabel || "").trim()) {
    case "Low":
      return 1;
    case "Elevated":
      return 0.8;
    case "Harsh":
      return 0.3;
    case "Surface-sterilizing":
      return 0;
    default:
      return clampUnitInterval(1 - toFiniteNumber(exposureLevel, 1));
  }
}

function moonSurfaceAtmosphereScore(model = {}) {
  const summary = model.habitability?.summary || {};
  const atmosphere = model.atmosphere || {};
  const display = model.display || {};
  const pressureAtm = Math.max(toFiniteNumber(atmosphere.surfacePressureAtm, 0), 0);
  if (summary.gates?.atmosphereRetention?.surfacePass === true) return 1;
  if (summary.classifications?.atmosphereMarginal === true) return 0.68;
  if (pressureAtm >= 0.25) return 0.82;
  if (pressureAtm >= 0.08) return 0.55;
  if (!includesAny(display.atmosphereClass, ["airless", "exosphere"])) return 0.3;
  return 0;
}

function moonSurfaceWaterScore(model = {}) {
  const summary = model.habitability?.summary || {};
  const hydrosphere = model.hydrosphere || {};
  const climate = model.climate || {};
  const display = model.display || {};
  if (
    summary.classifications?.surfaceOceanPlausible === true ||
    summary.classifications?.surfaceRadiationLimited === true ||
    summary.classifications?.surfaceBiospherePlausible === true
  ) {
    return 1;
  }
  if (hydrosphere.surfaceLiquidPresent === true) return 0.88;
  if (climate.surfaceLiquidWaterPlausible === true) return 0.72;
  if (
    summary.classifications?.frozenSurface === true ||
    includesAny(display.hydrosphereState, ["ice", "snowball", "frozen"])
  ) {
    return 0.08;
  }
  if (
    hydrosphere.subsurfaceOceanPresent === true ||
    hydrosphere.subsurfaceOceanCandidate === true
  ) {
    return 0.35;
  }
  return 0.15;
}

function moonSubsurfaceWaterScore(model = {}) {
  const summary = model.habitability?.summary || {};
  const hydrosphere = model.hydrosphere || {};
  if (summary.classifications?.subsurfaceOceanPlausible === true) return 1;
  if (hydrosphere.subsurfaceOceanPresent === true) return 0.88;
  if (hydrosphere.subsurfaceOceanCandidate === true) return 0.55;
  return 0;
}

function moonStableOrbitScore(model = {}) {
  const summary = model.habitability?.summary || {};
  const orbit = model.orbit || {};
  if (summary.classifications?.unstableOrbit === true || orbit.longTermStable === false) return 0;
  const stabilityClass = String(orbit.orbitStabilityClass || "");
  const stabilityMargin = Math.max(toFiniteNumber(orbit.stabilityMarginFraction, 0), 0);
  if (stabilityClass === "near-outer-stability-edge") return 0.62;
  if (summary.gates?.stableOrbit?.pass === true) {
    if (stabilityMargin >= 0.18) return 1;
    if (stabilityMargin >= 0.08) return 0.85;
    if (stabilityMargin > 0) return 0.72;
    return 0.6;
  }
  if (String(orbit.semiMajorAxisGuard || "none") === "lowered_to_remain_long_term_stable") {
    return 0.28;
  }
  return String(orbit.semiMajorAxisGuard || "none") === "none" ? 0.7 : 0.15;
}

function moonSurfaceLongTermScore(model = {}, compiledGoal = {}) {
  const summary = model.habitability?.summary || {};
  const climate = model.climate || {};
  const atmosphere = model.atmosphere || {};
  const resonance = model.resonance || {};
  const stellarZoneScore =
    goalTraitSelected(compiledGoal, "in-stellar-habitable-zone") ||
    moonGoalTargetsSurfaceWarmth(compiledGoal)
      ? summary.gates?.stellarZone?.pass === true
        ? 1
        : resonance.tidalHabitableZone?.starHzEligible !== false
          ? 0.75
          : 0
      : 1;
  const climateScore =
    String(climate.climateState || "") === "Runaway greenhouse"
      ? 0
      : String(climate.climateState || "") === "Snowball"
        ? 0.2
        : summary.classifications?.frozenSurface === true
          ? 0.25
          : 1;
  const atmosphereScore =
    String(atmosphere.stability?.balanceLabel || "") === "Stable"
      ? 1
      : String(atmosphere.stability?.balanceLabel || "") === "Marginal"
        ? 0.7
        : summary.classifications?.atmosphereMarginal === true
          ? 0.55
          : 0.2;
  return clampUnitInterval(stellarZoneScore * 0.4 + climateScore * 0.35 + atmosphereScore * 0.25);
}

function moonSurfaceExomoonCalibrationScore(model = {}, compiledGoal = {}) {
  if (!moonGoalTargetsSurfaceWarmth(compiledGoal)) return 0;

  const summary = model.habitability?.summary || {};
  const calibration = model.surfaceExomoonCalibration || summary.surfaceExomoonCalibration || {};
  if (calibration.applicable !== true) return 1;

  const gatePass = summary.gates?.surfaceExomoonCalibration?.pass !== false;
  const stellarZonePass = summary.gates?.stellarZone?.pass !== false;
  const penaltyScore = clampUnitInterval(toFiniteNumber(calibration.penalty, gatePass ? 1 : 0.35));
  const hostScore = clampUnitInterval(
    toFiniteNumber(calibration.hostGiantFavorability?.score, 0.5),
  );
  const compositionScore = clampUnitInterval(
    toFiniteNumber(calibration.compositionModifier?.score, 0.88),
  );
  const spinScore = clampUnitInterval(toFiniteNumber(calibration.spinStateBenefit?.score, 0.9));

  let total =
    penaltyScore * 0.45 +
    hostScore * 0.18 +
    compositionScore * 0.12 +
    spinScore * 0.15 +
    (stellarZonePass ? 0.1 : 0) +
    (gatePass ? 0.1 : 0);

  if (!gatePass) total = Math.min(total, 0.42);
  if (!stellarZonePass) total = Math.min(total, 0.35);
  return clampUnitInterval(total);
}

function moonTidalModerationScore(model = {}, compiledGoal = {}) {
  const summary = model.habitability?.summary || {};
  const tides = model.tides || {};
  const resonance = model.resonance || {};
  const heatingEarth = Math.max(toFiniteNumber(tides.tidalHeatingEarth, 0), 0);
  if (String(compiledGoal?.goalTemplateId || "") === "volcanic-moon") {
    const heatingScore = clampUnitInterval(Math.log10(1 + heatingEarth) / 2.4);
    return resonance.sustainedHeatingFlag === true ? Math.max(0.82, heatingScore) : heatingScore;
  }
  if (goalTraitSelected(compiledGoal, "subsurface-ocean")) {
    if (summary.classifications?.tidalOverheated === true) return 0.15;
    if (resonance.sustainedHeatingFlag === true) return 0.9;
    return clampUnitInterval(0.35 + Math.log10(1 + heatingEarth) / 5);
  }
  if (summary.classifications?.tidalOverheated === true) return 0;
  if (heatingEarth <= 5) return 1;
  if (heatingEarth <= 25) return 0.75;
  if (heatingEarth <= 100) return 0.45;
  return 0.15;
}

function inferMoonGuidedOutcomeLabel(compiledGoal = {}, recommendation = {}) {
  const model = recommendation?.previewPayload?.moonCalc || {};
  const summary = model.habitability?.summary || {};
  const classifications = summary.classifications || {};
  const atmosphere = model.atmosphere || {};
  const display = model.display || {};
  const pressureAtm = Math.max(toFiniteNumber(atmosphere.surfacePressureAtm, 0), 0);

  if (classifications.surfaceBiospherePlausible === true) return "Surface Life Plausible";
  if (classifications.surfaceCalibrationLimited === true)
    return "Cool-Star Mass-Limited Surface Moon";
  if (classifications.surfaceRadiationLimited === true) return "Radiation-Limited Ocean Moon";
  if (classifications.surfaceOceanPlausible === true) return "Temperate Ocean Moon";
  if (classifications.subsurfaceOceanPlausible === true) return "Subsurface Ocean Moon";
  if (
    classifications.frozenSurface === true &&
    pressureAtm >= 0.05 &&
    !includesAny(display.atmosphereClass, ["airless", "exosphere"])
  ) {
    return "Frozen Atmosphere-Bearing Moon";
  }
  if (
    classifications.tidalOverheated === true ||
    String(compiledGoal?.goalTemplateId || "") === "volcanic-moon"
  ) {
    return "Volcanic / Tidal Moon";
  }
  return summary.primaryOutcome || "Marginal Moon Environment";
}

function scoreMoonEnvironmentFit(compiledGoal = {}, recommendation = {}) {
  const model = recommendation?.previewPayload?.moonCalc || {};
  const summary = model.habitability?.summary || {};
  const classifications = summary.classifications || {};
  const radiation = model.radiation || {};
  const subsurfaceGoal =
    goalTraitSelected(compiledGoal, "subsurface-ocean") &&
    !goalTraitSelected(compiledGoal, "surface-liquid-water") &&
    !goalTraitSelected(compiledGoal, "surface-biosphere-plausible") &&
    !goalTraitSelected(compiledGoal, "vegetation-plausible");
  const volcanicGoal = String(compiledGoal?.goalTemplateId || "") === "volcanic-moon";
  const stableOrbitScore = moonStableOrbitScore(model);
  const atmosphereScore = moonSurfaceAtmosphereScore(model);
  const surfaceWaterScore = moonSurfaceWaterScore(model);
  const subsurfaceWaterScore = moonSubsurfaceWaterScore(model);
  const surfaceRadiationScore =
    classifications.surfaceRadiationLimited === true
      ? 0
      : moonRadiationClassScore(radiation.surfaceClass, radiation.surfaceExposure);
  const subsurfaceRadiationScore = moonRadiationClassScore(
    radiation.subsurfaceClass,
    radiation.subsurfaceExposure,
  );
  const longTermScore = moonSurfaceLongTermScore(model, compiledGoal);
  const tidalModerationScore = moonTidalModerationScore(model, compiledGoal);
  const surfaceExomoonCalibrationScore = moonSurfaceExomoonCalibrationScore(model, compiledGoal);

  let total = 0;
  let components = {};

  if (volcanicGoal) {
    components = {
      stableOrbit: stableOrbitScore,
      resonanceHeating: tidalModerationScore,
      radiation: Math.max(surfaceRadiationScore, subsurfaceRadiationScore * 0.8),
      atmosphere: atmosphereScore,
      longTerm: longTermScore,
    };
    total =
      components.stableOrbit * 0.2 +
      components.resonanceHeating * 0.45 +
      components.radiation * 0.05 +
      components.atmosphere * 0.1 +
      components.longTerm * 0.2;
  } else if (subsurfaceGoal) {
    components = {
      stableOrbit: stableOrbitScore,
      water: subsurfaceWaterScore,
      radiation: subsurfaceRadiationScore,
      atmosphere: atmosphereScore,
      internalHeating: tidalModerationScore,
    };
    total =
      components.stableOrbit * 0.2 +
      components.water * 0.35 +
      components.radiation * 0.2 +
      components.atmosphere * 0.1 +
      components.internalHeating * 0.15;
  } else {
    components = {
      stableOrbit: stableOrbitScore,
      water: surfaceWaterScore,
      atmosphere: atmosphereScore,
      radiation: surfaceRadiationScore,
      tidalModeration: tidalModerationScore,
      longTerm: longTermScore,
      surfaceExomoonCalibration: surfaceExomoonCalibrationScore,
    };
    total =
      components.stableOrbit * 0.14 +
      components.water * 0.24 +
      components.atmosphere * 0.18 +
      components.radiation * 0.2 +
      components.tidalModeration * 0.08 +
      components.longTerm * 0.08 +
      components.surfaceExomoonCalibration * 0.08;
  }

  return {
    total: clampUnitInterval(total),
    score: clampUnitInterval(total) * 14,
    components,
    outcomeLabel: inferMoonGuidedOutcomeLabel(compiledGoal, recommendation),
  };
}

function moonSurfaceCalibrationBiasAdjustment(compiledGoal = {}, recommendation = {}) {
  if (!moonGoalTargetsSurfaceWarmth(compiledGoal)) return 0;

  const model = recommendation?.previewPayload?.moonCalc || {};
  const summary = model.habitability?.summary || {};
  const calibration = model.surfaceExomoonCalibration || summary.surfaceExomoonCalibration || {};
  if (calibration.applicable !== true) return 0;

  const spinRatio = String(model.spinState?.ratio || "").trim();
  const hostScore = clampUnitInterval(
    toFiniteNumber(calibration.hostGiantFavorability?.score, 0.5),
  );
  let adjustment = 0;

  if (summary.gates?.surfaceExomoonCalibration?.pass === false) {
    adjustment -= 2.5;
  } else if (summary.gates?.surfaceExomoonCalibration?.pass === true) {
    adjustment += 0.4;
  }

  if (spinRatio === "3:2") adjustment += 1.1;
  else if (spinRatio === "1:1") adjustment -= 0.2;

  adjustment += (hostScore - 0.5) * 1.2;
  return adjustment;
}

function moonOrbitPenaltyMultiplier(compiledGoal = {}, context = {}, currentOrbitKm, nextOrbitKm) {
  if (
    !Number.isFinite(currentOrbitKm) ||
    !Number.isFinite(nextOrbitKm) ||
    currentOrbitKm <= 0 ||
    String(compiledGoal?.priority || "") === "preserve-current-orbit-context"
  ) {
    return 1;
  }

  const parentKind = String(context?.parentContext?.parentKind || "").trim();
  if (
    nextOrbitKm < currentOrbitKm &&
    parentKind === "gasGiant" &&
    moonGoalTargetsSurfaceWarmth(compiledGoal)
  ) {
    return 0.35;
  }
  if (nextOrbitKm < currentOrbitKm && moonGoalNeedsInternalHeating(compiledGoal)) {
    return 0.55;
  }
  return 1;
}

function scoreMoonGoalRecommendation(compiledGoal = {}, recommendation = {}, context = {}) {
  const evaluationPlan = compiledGoal?.evaluationPlan || {};
  const matchedRequired = [];
  const missingRequired = [];
  const matchedPreferred = [];
  const triggeredAvoid = [];
  let score = 0;

  for (const entry of evaluationPlan.hardConstraints || []) {
    const matched = evaluateMoonGoalTrait(entry.traitId, recommendation);
    if (matched) {
      matchedRequired.push(entry.traitId);
      score += 6;
    } else {
      missingRequired.push(entry.traitId);
      score -= 10;
      score += evaluateMoonGoalTraitProgress(entry.traitId, recommendation) * 6;
    }
  }

  for (const entry of evaluationPlan.preferredTraits || []) {
    const matched = evaluateMoonGoalTrait(entry.traitId, recommendation);
    if (matched) {
      matchedPreferred.push(entry.traitId);
      score += Number(entry.weight) || 1;
    } else {
      score +=
        evaluateMoonGoalTraitProgress(entry.traitId, recommendation) *
        ((Number(entry.weight) || 1) * 0.6);
    }
  }

  for (const entry of evaluationPlan.avoidTraits || []) {
    if (evaluateMoonGoalTrait(entry.traitId, recommendation)) {
      triggeredAvoid.push(entry.traitId);
      score -= Number(entry.penalty) || 1;
    }
  }

  const parentPatch = recommendation?.applyPayload?.parentPatch;
  const siblingPatch = recommendation?.applyPayload?.siblingPatch;
  const currentOrbitKm = toFiniteNumber(context?.currentInputs?.semiMajorAxisKm, NaN);
  const nextOrbitKm = toFiniteNumber(
    recommendation?.applyPayload?.objectInputs?.semiMajorAxisKm,
    NaN,
  );
  const orbitPenalty =
    Number.isFinite(currentOrbitKm) && currentOrbitKm > 0 && Number.isFinite(nextOrbitKm)
      ? Math.min(Math.abs(nextOrbitKm - currentOrbitKm) / currentOrbitKm, 2)
      : 0;
  const adjustedOrbitPenalty =
    orbitPenalty * moonOrbitPenaltyMultiplier(compiledGoal, context, currentOrbitKm, nextOrbitKm);
  const contextPenalty = (parentPatch ? 1 : 0) + (siblingPatch ? 1.25 : 0);
  const environmentFit = scoreMoonEnvironmentFit(compiledGoal, recommendation);
  const surfaceCalibrationBias = moonSurfaceCalibrationBiasAdjustment(compiledGoal, recommendation);
  score += environmentFit.score;
  score += surfaceCalibrationBias;
  score -= (Number(evaluationPlan.contextDeviationWeight) || 1) * contextPenalty;
  score -= (Number(evaluationPlan.orbitDeviationWeight) || 1) * adjustedOrbitPenalty;

  const exactMatch = missingRequired.length === 0 && triggeredAvoid.length === 0;
  return {
    score,
    matchedRequired,
    missingRequired,
    matchedPreferred,
    triggeredAvoid,
    environmentFit,
    fitClass: exactMatch ? "exact-match" : missingRequired.length ? "near-miss" : "tradeoff",
  };
}

function buildMoonGoalSearchDiagnostics(compiledGoal = {}, scoring = {}, searchMeta = {}) {
  const diagnostics = [];
  const matchedRequired = (scoring?.matchedRequired || []).map(
    (traitId) => getGoalTrait(traitId)?.label || traitId,
  );
  const missingRequired = (scoring?.missingRequired || []).map(
    (traitId) => getGoalTrait(traitId)?.label || traitId,
  );
  const triggeredAvoid = (scoring?.triggeredAvoid || []).map(
    (traitId) => getGoalTrait(traitId)?.label || traitId,
  );
  const environmentFit = scoring?.environmentFit || {};

  pushDiagnostic(
    diagnostics,
    "info",
    "goal-search-seed",
    "Goal search seed",
    `Best seeded fit came from ${searchMeta.seedLabel || "a moon archetype"} after trying ${searchMeta.candidatesTried || 0} candidate paths.`,
    [],
  );

  if (environmentFit?.outcomeLabel) {
    pushDiagnostic(
      diagnostics,
      missingRequired.length || triggeredAvoid.length ? "warning" : "info",
      "goal-search-outcome",
      "Best-fit outcome",
      `Best-fit outcome: ${environmentFit.outcomeLabel}.`,
      [],
    );
  }

  if (!missingRequired.length && !triggeredAvoid.length) {
    pushDiagnostic(
      diagnostics,
      "info",
      "goal-fit-exact",
      "Goal fit reached",
      `${compiledGoal.templateLabel || "This goal"} reached all required traits${matchedRequired.length ? ` (${matchedRequired.join(", ")})` : ""}.`,
      [],
    );
    return diagnostics;
  }

  pushDiagnostic(
    diagnostics,
    missingRequired.length ? "warning" : "info",
    "goal-fit-near-miss",
    "Goal search found the closest fit",
    [
      missingRequired.length ? `Still missing: ${missingRequired.join(", ")}.` : "",
      triggeredAvoid.length ? `Still triggers: ${triggeredAvoid.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    [
      "Treat this as a strong starting point, then refine the Moon page inputs if you need a tighter fit.",
    ],
  );
  return diagnostics;
}

function buildMoonSurfaceCalibrationDiagnostic(compiledGoal = {}, recommendation = {}) {
  if (!moonGoalTargetsSurfaceWarmth(compiledGoal)) return null;

  const model = recommendation?.previewPayload?.moonCalc || {};
  const summary = model.habitability?.summary || {};
  const calibration = model.surfaceExomoonCalibration || summary.surfaceExomoonCalibration || null;
  if (!calibration || calibration.applicable !== true) return null;

  return {
    severity: summary.gates?.surfaceExomoonCalibration?.pass === false ? "warning" : "info",
    code: "surface-exomoon-calibration",
    title:
      summary.gates?.surfaceExomoonCalibration?.pass === false
        ? "Cool-star surface calibration is still limiting"
        : "Cool-star surface calibration is favorable",
    detail: [calibration.label, ...(Array.isArray(calibration.notes) ? calibration.notes : [])]
      .filter(Boolean)
      .join(". "),
    suggestedActions:
      summary.gates?.surfaceExomoonCalibration?.pass === false
        ? [
            "Try a heavier rocky moon, a more massive giant host, or a resonance-backed spin state for a stronger surface-habitability fit.",
          ]
        : ["This candidate fits the paper-informed cool-star surface-moon calibration."],
  };
}

async function startMoonGoalSearch(compiledGoal = null, flowState = {}, context = {}, job = {}) {
  if (!compiledGoal?.goalTemplateId) {
    return {
      recommendation: null,
      terminationReason: "missing-goal-template",
    };
  }

  const template = getGoalTemplate("moon", compiledGoal.goalTemplateId);
  const candidates = buildMoonGoalSearchCandidates(compiledGoal, context);
  let bestResult = null;
  let tried = 0;

  for (const candidate of candidates) {
    job?.throwIfCanceled?.();
    await Promise.resolve();

    const archetype = getMoonArchetype(candidate.archetypeId);
    const recommendation = solveMoonRecommendationFromArchetype(
      archetype,
      { ...flowState, uxMode: "guided" },
      context,
      candidate.answers,
    );
    if (!recommendation) continue;
    tried += 1;

    const scoring = scoreMoonGoalRecommendation(compiledGoal, recommendation, context);
    if (!bestResult || scoring.score > bestResult.scoring.score) {
      bestResult = {
        recommendation,
        scoring,
        seedLabel: `${archetype?.label || candidate.archetypeId}${
          candidate.orbitVariant && candidate.orbitVariant !== "recipe-default"
            ? ` / ${candidate.orbitVariant.replaceAll("-", " ")}`
            : ""
        }`,
      };
      if (
        scoring.fitClass === "exact-match" &&
        String(compiledGoal.searchBudget || "") === "fast"
      ) {
        break;
      }
    }
  }

  if (!bestResult) {
    return {
      recommendation: null,
      terminationReason: "no-candidates",
    };
  }

  const diagnostics = [
    ...buildMoonGoalSearchDiagnostics(compiledGoal, bestResult.scoring, {
      seedLabel: bestResult.seedLabel,
      candidatesTried: tried,
    }),
    ...[buildMoonSurfaceCalibrationDiagnostic(compiledGoal, bestResult.recommendation)].filter(
      Boolean,
    ),
    ...(bestResult.recommendation.diagnostics || []),
  ];

  return {
    recommendation: {
      ...bestResult.recommendation,
      title: template?.label || bestResult.recommendation.title,
      confidenceClass: getMoonGoalTemplateMeta(compiledGoal.goalTemplateId).confidenceClass,
      summary:
        `${template?.summary || bestResult.recommendation.summary} ` +
        `Best-fit outcome: ${bestResult.scoring.environmentFit?.outcomeLabel || inferMoonGuidedOutcomeLabel(compiledGoal, bestResult.recommendation)}. ` +
        `Seeded from ${bestResult.seedLabel}.`,
      diagnostics,
      rationale: [
        `Goal search tried ${tried} seeded moon paths and selected ${bestResult.seedLabel}.`,
        `Best-fit outcome: ${bestResult.scoring.environmentFit?.outcomeLabel || inferMoonGuidedOutcomeLabel(compiledGoal, bestResult.recommendation)}.`,
        ...(bestResult.recommendation.rationale || []),
      ],
      nextActions: [
        ...(bestResult.recommendation.nextActions || []),
        "Re-run the search after changing traits or allowed edits if you want a different trade-off.",
      ],
      goalTemplateId: compiledGoal.goalTemplateId,
      fitClass: bestResult.scoring.fitClass,
      outcomeLabel:
        bestResult.scoring.environmentFit?.outcomeLabel ||
        inferMoonGuidedOutcomeLabel(compiledGoal, bestResult.recommendation),
    },
    terminationReason:
      bestResult.scoring.fitClass === "exact-match" ? "goal-fit-exact" : "goal-fit-near-miss",
  };
}

export const moonGuidedAdapter = {
  objectType: "moon",

  listArchetypes(_context = {}, flowState = {}) {
    if (flowState?.uxMode === "guided") return listMoonGoalTemplateCards();
    return MOON_GUIDED_ARCHETYPES.map((entry) => ({ ...entry }));
  },

  buildQuestions(flowState, context = {}) {
    if (flowState?.uxMode === "guided" && flowState?.selectedGoalTemplateId) {
      return buildMoonGoalQuestions(flowState, context);
    }
    const archetype = getMoonArchetype(flowState?.selectedArchetypeId);
    if (!archetype || flowState?.uxMode !== "guided") return [];
    return buildMoonQuestions(archetype, context);
  },

  compileGoal(flowState) {
    if (!flowState?.selectedGoalTemplateId) {
      return {
        valid: false,
        diagnostics: [
          {
            severity: "blocked",
            code: "missing-goal-template",
            title: "Choose a moon goal",
            detail: "Pick a moon goal template before compiling the search target.",
          },
        ],
      };
    }
    return compileGuidedGoal(buildMoonGoalCompileInput(flowState));
  },

  solveRecommendation(flowState, context = {}) {
    const archetype = getMoonArchetype(flowState?.selectedArchetypeId);
    return solveMoonRecommendationFromArchetype(archetype, flowState, context);
  },

  startSearch(compiledGoal, flowState, context, job) {
    return startMoonGoalSearch(compiledGoal, flowState, context, job);
  },

  applyRecommendation(recommendation, storeContext = {}) {
    if (!recommendation?.applyPayload?.objectInputs) return null;
    if (typeof storeContext.applyMoonRecommendation === "function") {
      return storeContext.applyMoonRecommendation(recommendation);
    }
    if (typeof storeContext.applyMoonInputs === "function") {
      return storeContext.applyMoonInputs(recommendation.applyPayload.objectInputs, recommendation);
    }
    return recommendation.applyPayload;
  },
};

export function registerMoonGuidedAdapter(options = {}) {
  return registerGuidedAdapter(moonGuidedAdapter, options);
}

export function ensureMoonGuidedAdapterRegistered() {
  return getGuidedAdapter("moon") || registerMoonGuidedAdapter();
}

export { MOON_GUIDED_ARCHETYPES, getMoonArchetype, getRecipeForArchetype };
