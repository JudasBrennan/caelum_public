import { massToRadiusRj } from "../../../engine/gasGiant.js";
import { fmt } from "../../../engine/utils.js";
import { GAS_GIANT_RECIPES } from "../../gasGiantStyles.js";
import {
  normalizeRingMode,
  RING_MODE_AUTO,
  RING_MODE_FORCE_OFF,
  RING_MODE_FORCE_ON,
} from "../../../engine/planetaryRings.js";
import { normalizeRingStyleId, RING_STYLE_AUTO } from "../../ringAppearanceProfiles.js";
import { compileGuidedGoal } from "../goalCompiler.js";
import { getGoalTemplate, getGoalTrait, listGoalTemplates } from "../goalTraits.js";
import { getGuidedAdapter, registerGuidedAdapter } from "../registry.js";

const GAS_GIANT_GUIDED_ARCHETYPES = Object.freeze([
  {
    id: "jupiter-cold-giant",
    objectType: "gasGiant",
    label: "Jupiter-like",
    shortLabel: "Jupiter",
    summary: "Cold ammonia-cloud giant in the classic outer-system regime.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["cold giant", "class I", "outer system"],
    recipeId: "jupiter",
    orbitBand: { label: "cold giant band", recipeAu: 5.2, minTeqK: 90, maxTeqK: 180 },
    massBand: { min: 0.7, max: 1.8, label: "Jovian mass" },
    metallicityDefault: "solar",
    ringDefault: "auto",
    nextActions: ["Check Sudarsky class, ring visibility, and moon stability after apply."],
  },
  {
    id: "saturnian-ringed-giant",
    objectType: "gasGiant",
    label: "Saturnian Ringed",
    shortLabel: "Saturnian",
    summary: "Cool lower-density giant that leans toward a prominent ring system.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["ringed", "cold giant", "saturnian"],
    recipeId: "saturn",
    orbitBand: { label: "cold giant band", recipeAu: 9.5, minTeqK: 60, maxTeqK: 150 },
    massBand: { min: 0.18, max: 0.5, label: "Saturnian mass" },
    metallicityDefault: "solar",
    ringDefault: "ringed",
    nextActions: ["Check ring mode, ring family, and bulk density after apply."],
  },
  {
    id: "neptune-like-ice-giant",
    objectType: "gasGiant",
    label: "Neptune-like",
    shortLabel: "Neptune",
    summary: "Cold methane-rich ice giant with strong heavy-element enrichment.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["ice giant", "cold", "metal-rich"],
    recipeId: "neptune",
    orbitBand: { label: "ice-giant band", recipeAu: 30, minTeqK: 35, maxTeqK: 90 },
    massBand: { min: 0.03, max: 0.09, label: "ice-giant mass" },
    metallicityDefault: "enriched",
    ringDefault: "auto",
    nextActions: ["Check class, metallicity, and cloud family after apply."],
  },
  {
    id: "sub-neptune-giant",
    objectType: "gasGiant",
    label: "Sub-Neptune",
    shortLabel: "Sub-Neptune",
    summary: "Compact mini-giant near the boundary between ice giants and puffy worlds.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["compact", "mini giant", "metal-rich"],
    recipeId: "sub-neptune",
    orbitBand: { label: "cool compact giant band", recipeAu: 10, minTeqK: 60, maxTeqK: 160 },
    massBand: { min: 0.015, max: 0.05, label: "compact giant mass" },
    metallicityDefault: "enriched",
    ringDefault: "auto",
    nextActions: ["Check density, metallicity, and mass-loss resilience after apply."],
  },
  {
    id: "warm-water-cloud-giant",
    objectType: "gasGiant",
    label: "Warm Water-Cloud",
    shortLabel: "Warm",
    summary: "Temperate-to-warm giant in the water-cloud or sparse-cloud regime.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["warm giant", "water clouds", "temperate edge"],
    recipeId: "water-cloud",
    orbitBand: { label: "warm giant band", recipeAu: 2.2, minTeqK: 180, maxTeqK: 350 },
    massBand: { min: 0.2, max: 1.2, label: "warm giant mass" },
    metallicityDefault: "solar",
    ringDefault: "no-rings",
    nextActions: ["Check class, water-cloud regime, and ring visibility after apply."],
  },
  {
    id: "cloudless-warm-giant",
    objectType: "gasGiant",
    label: "Cloudless Warm",
    shortLabel: "Cloudless",
    summary: "Clear-atmosphere warm giant with sparse condensate clouds.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["warm giant", "clear atmosphere", "irradiated"],
    recipeId: "cloudless",
    orbitBand: { label: "clear warm-giant band", recipeAu: 0.2, minTeqK: 500, maxTeqK: 900 },
    massBand: { min: 0.4, max: 1.5, label: "warm giant mass" },
    metallicityDefault: "solar",
    ringDefault: "no-rings",
    nextActions: ["Check class, effective temperature, and escape rate after apply."],
  },
  {
    id: "hot-jupiter-giant",
    objectType: "gasGiant",
    label: "Hot Jupiter",
    shortLabel: "Hot Jupiter",
    summary: "Strongly irradiated close-in giant in the alkali / hot-Jupiter regime.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["hot giant", "irradiated", "close-in"],
    recipeId: "hot-jupiter",
    orbitBand: { label: "hot-Jupiter band", recipeAu: 0.045, minTeqK: 900, maxTeqK: 1800 },
    massBand: { min: 0.6, max: 2.0, label: "hot-Jovian mass" },
    metallicityDefault: "solar",
    ringDefault: "no-rings",
    nextActions: ["Check mass-loss rate, tidal state, and irradiation class after apply."],
  },
  {
    id: "puffy-hot-giant",
    objectType: "gasGiant",
    label: "Puffy Hot Giant",
    shortLabel: "Puffy",
    summary: "Low-density inflated hot giant with strong irradiation-driven radius inflation.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["inflated", "hot giant", "low density"],
    recipeId: "puffy",
    orbitBand: { label: "inflated hot-giant band", recipeAu: 0.04, minTeqK: 950, maxTeqK: 1900 },
    massBand: { min: 0.15, max: 0.6, label: "inflated giant mass" },
    metallicityDefault: "solar",
    ringDefault: "no-rings",
    nextActions: ["Check radius inflation, density, and evaporation timescale after apply."],
  },
]);

const ORBIT_POLICY_OPTIONS = Object.freeze([
  {
    value: "keep-current",
    label: "Keep current orbit",
    description:
      "Keeps the current semi-major axis, so irradiation, class, and moon-zone context stay close to the existing giant.",
  },
  {
    value: "fit-thermal-band",
    label: "Fit thermal band",
    description:
      "Moves the giant into the archetype's preferred irradiation band, often changing class, clouds, and mass-loss behavior.",
  },
  {
    value: "use-archetype",
    label: "Use archetype orbit",
    description:
      "Uses the archetype's scaled reference orbit, which can move the giant furthest from its current thermal regime.",
  },
]);

const RING_TARGET_OPTIONS = Object.freeze([
  {
    value: "auto",
    label: "Auto rings",
    description:
      "Lets the current ring science decide, so visibility stays tied to the derived physical state.",
  },
  {
    value: "ringed",
    label: "Force ringed",
    description:
      "Biases toward a visible ring system, even when the underlying science would normally hide or downplay it.",
  },
  {
    value: "no-rings",
    label: "Force no rings",
    description:
      "Biases toward a cleaner giant with no visible rings, even when the science would normally show them.",
  },
]);

const MASS_TARGET_OPTIONS = Object.freeze([
  {
    value: "compact",
    label: "Compact",
    description:
      "Pushes toward sub-Neptune or ice-giant masses, usually making the giant denser and more metal-rich.",
  },
  {
    value: "saturnian",
    label: "Saturnian",
    description:
      "Pushes toward lower-density Saturn-class masses, which often pair well with visible rings and cooler giant profiles.",
  },
  {
    value: "jupiter",
    label: "Jovian",
    description:
      "Pushes toward Jupiter-class masses, giving a more classic giant-planet bulk regime.",
  },
  {
    value: "super",
    label: "Super-Jovian",
    description:
      "Pushes toward higher giant-planet masses, usually increasing gravity, compactness, and visual dominance.",
  },
]);

const METALLICITY_TARGET_OPTIONS = Object.freeze([
  {
    value: "low",
    label: "Low metallicity",
    description:
      "Keeps the atmosphere only mildly enriched, which usually preserves a cleaner Jupiter-like composition profile.",
  },
  {
    value: "solar",
    label: "Solar-ish",
    description:
      "Targets near-solar enrichment and keeps the result close to a standard giant-atmosphere baseline.",
  },
  {
    value: "enriched",
    label: "Enriched",
    description:
      "Pushes toward heavier-element-rich atmospheres, which often fits ice giants and compact giants better.",
  },
]);

const GOAL_PRIORITY_OPTIONS = Object.freeze([
  {
    value: "maximize-realism",
    label: "Maximize realism",
    description:
      "Keeps the fit conservative and resists dramatic orbit, ring, or class changes that are only weakly supported.",
  },
  {
    value: "maximize-habitability",
    label: "Maximize spectacle",
    description:
      "Accepts larger changes if they produce a more distinctive giant, stronger rings, or a cleaner class match.",
  },
  {
    value: "preserve-current-system",
    label: "Preserve current system",
    description:
      "Keeps the result closer to the current star and orbit context even if the requested giant is a weaker match.",
  },
  {
    value: "preserve-current-orbit-context",
    label: "Preserve current orbit",
    description:
      "Strongly resists orbit moves, so thermal-class and irradiation goals may only be partially reached.",
  },
]);

const GOAL_ALLOWED_EDIT_OPTIONS = Object.freeze([
  {
    value: "edit-object-only",
    label: "Giant only",
    description:
      "Only this giant's inputs move, so the result stays local but may miss thermal-band goals that need a new orbit.",
  },
  {
    value: "edit-object-plus-host",
    label: "Giant + host context",
    description:
      "Allows orbit refits around the current star, which is often the main lever for class and mass-loss goals.",
  },
  {
    value: "edit-object-plus-local-system",
    label: "Giant + local system",
    description:
      "Allows the broadest seeded search, increasing fit quality at the cost of larger context changes.",
  },
]);

const GOAL_SEARCH_BUDGET_OPTIONS = Object.freeze([
  {
    value: "fast",
    label: "Fast",
    description:
      "Tries only a few seeded candidates, so it returns quickly but can miss a better gas-giant fit.",
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

const GAS_GIANT_GOAL_TEMPLATE_META = Object.freeze({
  "ringed-gas-giant": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["saturnian-ringed-giant", "jupiter-cold-giant", "neptune-like-ice-giant"],
    focusTraits: [
      "rings-visible",
      "strong-ring-appearance",
      "class-ii-iii",
      "low-mass-loss",
      "ice-giant-mass-range",
      "enriched-metallicity",
      "rings-hidden",
      "strong-evaporation",
      "thermal-band-mismatch",
    ],
  },
  "hot-jupiter": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["hot-jupiter-giant", "puffy-hot-giant", "cloudless-warm-giant"],
    focusTraits: [
      "class-iv-v",
      "low-mass-loss",
      "rings-visible",
      "ice-giant-mass-range",
      "enriched-metallicity",
      "strong-evaporation",
      "thermal-band-mismatch",
    ],
  },
  "warm-cloud-giant": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["warm-water-cloud-giant", "cloudless-warm-giant", "jupiter-cold-giant"],
    focusTraits: [
      "class-ii-iii",
      "low-mass-loss",
      "rings-visible",
      "strong-ring-appearance",
      "ice-giant-mass-range",
      "enriched-metallicity",
      "strong-evaporation",
      "thermal-band-mismatch",
    ],
  },
  "ice-giant": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["neptune-like-ice-giant", "sub-neptune-giant", "saturnian-ringed-giant"],
    focusTraits: [
      "ice-giant-mass-range",
      "enriched-metallicity",
      "class-ii-iii",
      "low-mass-loss",
      "rings-visible",
      "strong-ring-appearance",
      "strong-evaporation",
      "thermal-band-mismatch",
    ],
  },
});

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(number, min), max);
}

function toFiniteNumber(value, fallback = NaN) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function includesAny(value, patterns = []) {
  const text = normalizeText(value);
  return patterns.some((pattern) => text.includes(pattern));
}

function goalTraitSelected(compiledGoal = {}, traitId = "") {
  return (
    (compiledGoal?.requiredTraits || []).includes(traitId) ||
    (compiledGoal?.preferredTraits || []).includes(traitId)
  );
}

function goalTraitAvoided(compiledGoal = {}, traitId = "") {
  return (compiledGoal?.avoidTraits || []).includes(traitId);
}

function traitRoleQuestionId(traitId) {
  return `traitRole:${String(traitId || "").trim()}`;
}

function getGasGiantGoalTemplateMeta(goalTemplateId) {
  return (
    GAS_GIANT_GOAL_TEMPLATE_META[String(goalTemplateId || "").trim()] || {
      confidenceClass: "plausible",
      seedArchetypeIds: ["jupiter-cold-giant"],
      focusTraits: [],
    }
  );
}

function mapGasGiantGoalTemplateToCard(template) {
  const meta = getGasGiantGoalTemplateMeta(template?.id);
  return {
    id: template?.id || "",
    objectType: "gasGiant",
    label: template?.label || "Gas giant goal",
    shortLabel: template?.label || "Gas giant goal",
    summary: template?.summary || "",
    confidenceClass: meta.confidenceClass,
    quickEnabled: false,
    guidedEnabled: true,
    tags: [...(template?.requiredTraits || []), ...(template?.preferredTraits || [])]
      .slice(0, 4)
      .map((traitId) => getGoalTrait(traitId)?.label || traitId),
  };
}

function listGasGiantGoalTemplateCards() {
  return listGoalTemplates("gasGiant").map((template) => mapGasGiantGoalTemplateToCard(template));
}

function defaultGasGiantGoalDraft(goalTemplateId = "") {
  const template = getGoalTemplate("gasGiant", goalTemplateId);
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

function normalizeGasGiantGoalDraft(flowState = {}) {
  const base = defaultGasGiantGoalDraft(flowState?.selectedGoalTemplateId);
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

function buildGasGiantGoalDraftQuestionOptions(traitId) {
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

function buildGasGiantGoalQuestions(flowState, context = {}) {
  const template = getGoalTemplate("gasGiant", flowState?.selectedGoalTemplateId);
  if (!template) return [];
  const draft = normalizeGasGiantGoalDraft(flowState);
  const focusTraits = getGasGiantGoalTemplateMeta(template.id).focusTraits;
  return [
    {
      id: "priority",
      stepId: "orbit-context",
      kind: "choice",
      label: "Priority",
      help:
        context.currentContextText ||
        "Sets the scoring bias for the search. Realism stays conservative, spectacle accepts bolder changes, and preserve-current resists large orbit moves.",
      defaultValue: draft.priority,
      options: GOAL_PRIORITY_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "allowedEdits",
      stepId: "orbit-context",
      kind: "choice",
      label: "Allowed edits",
      help: "Sets how far the search may move. Narrow scope keeps changes on this giant; broader scope allows orbit refits that can reshape class and mass-loss outputs.",
      defaultValue: draft.allowedEdits,
      options: GOAL_ALLOWED_EDIT_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "searchBudget",
      stepId: "orbit-context",
      kind: "choice",
      label: "Search budget",
      help: "Sets how many seeded candidate paths the search tries. Deeper searches take longer but are more likely to find a closer gas-giant fit.",
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
        options: buildGasGiantGoalDraftQuestionOptions(trait.id),
      })),
  ];
}

function buildGasGiantGoalCompileInput(flowState = {}) {
  const draft = normalizeGasGiantGoalDraft(flowState);
  const requiredTraits = [];
  const preferredTraits = [];
  const avoidTraits = [];
  for (const [traitId, role] of Object.entries(draft.traitRoles || {}).sort(([left], [right]) =>
    String(left).localeCompare(String(right)),
  )) {
    if (role === "required") requiredTraits.push(traitId);
    else if (role === "preferred") preferredTraits.push(traitId);
    else if (role === "avoid") avoidTraits.push(traitId);
  }
  return {
    objectType: "gasGiant",
    goalTemplateId: flowState?.selectedGoalTemplateId || "",
    priority: draft.priority,
    allowedEdits: draft.allowedEdits,
    searchBudget: draft.searchBudget,
    requiredTraits,
    preferredTraits,
    avoidTraits,
  };
}

function getGasGiantArchetype(archetypeId) {
  return (
    GAS_GIANT_GUIDED_ARCHETYPES.find((entry) => entry.id === String(archetypeId || "")) || null
  );
}

function getGasGiantRecipeCatalog(context = {}) {
  return Array.isArray(context?.recipeCatalog) ? context.recipeCatalog : GAS_GIANT_RECIPES;
}

function getRecipeForGasGiantArchetype(archetypeId, context = {}) {
  const archetype = getGasGiantArchetype(archetypeId);
  if (!archetype?.recipeId) return null;
  return (
    getGasGiantRecipeCatalog(context).find((entry) => entry?.id === archetype.recipeId) || null
  );
}

function effectiveRadiusRj(massMjup, radiusRj, fallback = 1) {
  const explicit = Number(radiusRj);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const mass = Number(massMjup);
  if (Number.isFinite(mass) && mass > 0) return massToRadiusRj(mass);
  return fallback;
}

export function buildGasGiantRecipeApplyInputs(
  recipeApply = {},
  appearanceRecipeId = null,
  currentInputs = {},
) {
  const source = recipeApply && typeof recipeApply === "object" ? recipeApply : {};
  const current = currentInputs && typeof currentInputs === "object" ? currentInputs : {};
  const massMjup =
    source.massMjup != null
      ? Number(source.massMjup)
      : current.massMjup != null
        ? Number(current.massMjup)
        : 1;
  const radiusRj = effectiveRadiusRj(
    source.radiusRj != null ? source.radiusRj : current.radiusRj,
    source.radiusRj != null ? source.radiusRj : current.radiusRj,
    effectiveRadiusRj(massMjup, current.radiusRj, 1),
  );
  return {
    au:
      Number.isFinite(Number(source.au)) && Number(source.au) > 0
        ? Number(source.au)
        : Number.isFinite(Number(current.au)) && Number(current.au) > 0
          ? Number(current.au)
          : 5.2,
    slotIndex:
      Number.isFinite(Number(source.slotIndex)) && Number(source.slotIndex) >= 1
        ? Math.round(Number(source.slotIndex))
        : Number.isFinite(Number(current.slotIndex)) && Number(current.slotIndex) >= 1
          ? Math.round(Number(current.slotIndex))
          : null,
    style: String(source.style || current.style || "jupiter"),
    ringMode: normalizeRingMode(
      source.ringMode ??
        current.ringMode ??
        (source.rings === true ? RING_MODE_FORCE_ON : RING_MODE_AUTO),
    ),
    ringStyleId: normalizeRingStyleId(source.ringStyleId ?? current.ringStyleId ?? RING_STYLE_AUTO),
    rings: source.rings === true || current.rings === true,
    radiusRj,
    massMjup: Number.isFinite(massMjup) && massMjup > 0 ? massMjup : 1,
    rotationPeriodHours:
      Number.isFinite(Number(source.rotationPeriodHours)) && Number(source.rotationPeriodHours) > 0
        ? Number(source.rotationPeriodHours)
        : Number.isFinite(Number(current.rotationPeriodHours)) &&
            Number(current.rotationPeriodHours) > 0
          ? Number(current.rotationPeriodHours)
          : 10,
    metallicity:
      Number.isFinite(Number(source.metallicity)) && Number(source.metallicity) > 0
        ? Number(source.metallicity)
        : Number.isFinite(Number(current.metallicity)) && Number(current.metallicity) > 0
          ? Number(current.metallicity)
          : null,
    eccentricity:
      Number.isFinite(Number(source.eccentricity)) && Number(source.eccentricity) >= 0
        ? clamp(Number(source.eccentricity), 0, 0.99)
        : Number.isFinite(Number(current.eccentricity)) && Number(current.eccentricity) >= 0
          ? clamp(Number(current.eccentricity), 0, 0.99)
          : 0,
    inclinationDeg:
      Number.isFinite(Number(source.inclinationDeg)) && Number(source.inclinationDeg) >= 0
        ? clamp(Number(source.inclinationDeg), 0, 180)
        : Number.isFinite(Number(current.inclinationDeg)) && Number(current.inclinationDeg) >= 0
          ? clamp(Number(current.inclinationDeg), 0, 180)
          : 0,
    axialTiltDeg:
      Number.isFinite(Number(source.axialTiltDeg)) && Number(source.axialTiltDeg) >= 0
        ? clamp(Number(source.axialTiltDeg), 0, 180)
        : Number.isFinite(Number(current.axialTiltDeg)) && Number(current.axialTiltDeg) >= 0
          ? clamp(Number(current.axialTiltDeg), 0, 180)
          : 3,
    appearanceRecipeId:
      appearanceRecipeId ?? source.appearanceRecipeId ?? current.appearanceRecipeId ?? "",
  };
}

function pushDiagnostic(list, severity, code, title, detail, suggestedActions = []) {
  list.push({ severity, code, title, detail, suggestedActions });
}

function getGasGiantGuidedDefaults(archetypeId) {
  switch (String(archetypeId || "")) {
    case "saturnian-ringed-giant":
      return {
        orbit_policy: "fit-thermal-band",
        ring_target: "ringed",
        mass_target: "saturnian",
        metallicity_target: "solar",
      };
    case "neptune-like-ice-giant":
      return {
        orbit_policy: "fit-thermal-band",
        ring_target: "auto",
        mass_target: "compact",
        metallicity_target: "enriched",
      };
    case "sub-neptune-giant":
      return {
        orbit_policy: "fit-thermal-band",
        ring_target: "auto",
        mass_target: "compact",
        metallicity_target: "enriched",
      };
    case "warm-water-cloud-giant":
    case "cloudless-warm-giant":
      return {
        orbit_policy: "fit-thermal-band",
        ring_target: "no-rings",
        mass_target: "jupiter",
        metallicity_target: "solar",
      };
    case "hot-jupiter-giant":
      return {
        orbit_policy: "fit-thermal-band",
        ring_target: "no-rings",
        mass_target: "jupiter",
        metallicity_target: "solar",
      };
    case "puffy-hot-giant":
      return {
        orbit_policy: "fit-thermal-band",
        ring_target: "no-rings",
        mass_target: "compact",
        metallicity_target: "solar",
      };
    case "jupiter-cold-giant":
    default:
      return {
        orbit_policy: "fit-thermal-band",
        ring_target: "auto",
        mass_target: "jupiter",
        metallicity_target: "solar",
      };
  }
}

function resolveGasGiantGuidedAnswers(archetype, flowState = {}) {
  return {
    ...getGasGiantGuidedDefaults(archetype?.id),
    ...(flowState?.answers || {}),
  };
}

function buildGasGiantQuestions(archetype, context = {}) {
  const defaults = getGasGiantGuidedDefaults(archetype.id);
  return [
    {
      id: "orbit_policy",
      stepId: "orbit-context",
      kind: "choice",
      label: "Orbit Fit",
      help:
        context.currentContextText ||
        "Controls how aggressively guided mode can move the orbit. Orbit changes are the main driver of irradiation class, cloud regime, and mass loss.",
      options: ORBIT_POLICY_OPTIONS,
      defaultValue: defaults.orbit_policy,
    },
    {
      id: "ring_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Ring Target",
      help: "Sets whether ring appearance should follow the science or be pushed toward a specific visual outcome.",
      options: RING_TARGET_OPTIONS,
      defaultValue: defaults.ring_target,
    },
    {
      id: "mass_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Mass Target",
      help: "Sets the bulk mass band the result should aim for. This strongly affects density, classification, and overall giant character.",
      options: MASS_TARGET_OPTIONS,
      defaultValue: defaults.mass_target,
    },
    {
      id: "metallicity_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Metallicity Target",
      help: "Sets the atmospheric enrichment target, which changes how Jupiter-like, Saturn-like, or ice-giant-like the result tends to feel.",
      options: METALLICITY_TARGET_OPTIONS,
      defaultValue: defaults.metallicity_target,
    },
  ];
}

function scaleArchetypeOrbit(recipeAu, context = {}) {
  const starLuminosityLsol = Number(context?.starLuminosityLsol);
  const scaledLuminosity =
    Number.isFinite(starLuminosityLsol) && starLuminosityLsol > 0
      ? Math.sqrt(starLuminosityLsol)
      : 1;
  return recipeAu * scaledLuminosity;
}

function targetMassForBucket(bucket) {
  switch (String(bucket || "")) {
    case "compact":
      return 0.04;
    case "saturnian":
      return 0.3;
    case "super":
      return 3.0;
    case "jupiter":
    default:
      return 1.0;
  }
}

function targetMetallicityForBucket(bucket, currentValue = null) {
  switch (String(bucket || "")) {
    case "low":
      return 0.5;
    case "enriched":
      return Math.max(Number(currentValue) || 0, 15);
    case "solar":
    default:
      return 1.0;
  }
}

function tuneGasGiantApplyInputs(archetype, recipe, answers, context = {}) {
  const nextInputs = buildGasGiantRecipeApplyInputs(recipe.apply, recipe.id, context.currentInputs);

  if (answers.orbit_policy === "fit-thermal-band" || answers.orbit_policy === "use-archetype") {
    nextInputs.slotIndex = null;
    nextInputs.au = scaleArchetypeOrbit(archetype.orbitBand?.recipeAu || nextInputs.au, context);
    if (answers.orbit_policy === "fit-thermal-band") {
      nextInputs.eccentricity = clamp(Number(nextInputs.eccentricity) || 0, 0, 0.08);
    }
  }

  nextInputs.massMjup = targetMassForBucket(answers.mass_target);
  nextInputs.radiusRj = effectiveRadiusRj(
    nextInputs.massMjup,
    recipe.apply?.radiusRj,
    nextInputs.radiusRj,
  );

  if (archetype.id === "puffy-hot-giant") {
    nextInputs.radiusRj = Math.max(Number(nextInputs.radiusRj) || 1.4, 1.45);
    nextInputs.massMjup = clamp(Number(nextInputs.massMjup) || 0.3, 0.18, 0.55);
  } else if (archetype.id === "sub-neptune-giant") {
    nextInputs.radiusRj = clamp(Number(nextInputs.radiusRj) || 0.5, 0.35, 0.65);
  }

  nextInputs.metallicity = targetMetallicityForBucket(
    answers.metallicity_target,
    nextInputs.metallicity,
  );

  switch (answers.ring_target) {
    case "ringed":
      nextInputs.ringMode = RING_MODE_FORCE_ON;
      nextInputs.ringStyleId = normalizeRingStyleId(nextInputs.ringStyleId || RING_STYLE_AUTO);
      nextInputs.rings = true;
      break;
    case "no-rings":
      nextInputs.ringMode = RING_MODE_FORCE_OFF;
      nextInputs.rings = false;
      break;
    case "auto":
    default:
      nextInputs.ringMode = RING_MODE_AUTO;
      break;
  }

  return nextInputs;
}

function buildGasGiantSummary(archetype, recipe, solved, answers = {}, uxMode = "quick") {
  const model = solved?.model || {};
  const display = model.display || {};
  const targets = [];
  if (answers.orbit_policy === "fit-thermal-band") targets.push("thermal-band orbit fit");
  else if (answers.orbit_policy === "use-archetype") targets.push("scaled archetype orbit");
  else targets.push("current orbit");
  targets.push(
    answers.ring_target === "ringed"
      ? "forced ring system"
      : answers.ring_target === "no-rings"
        ? "forced ring suppression"
        : "science-driven rings",
  );
  targets.push(`${answers.mass_target || "jupiter"} mass target`);
  targets.push(`${answers.metallicity_target || "solar"} metallicity target`);

  const currentResult = [
    display.classification
      ? `Class ${model.classification?.sudarsky || "?"} ${display.classification}`
      : "",
    display.equilibriumTemp || "",
    display.ringType || "",
  ]
    .filter(Boolean)
    .join("; ");

  if (uxMode === "guided") {
    return `Uses ${recipe?.label || archetype.label} as a guided gas-giant starting point with ${targets.join(", ")}. Current result: ${currentResult}.`;
  }
  return `Applies ${recipe?.label || archetype.label} and re-solves it around the current star context. Current result: ${currentResult}.`;
}

function buildGasGiantRationale(archetype, answers = {}, context = {}) {
  const rationale = [];
  if (context.currentContextText) rationale.push(context.currentContextText);
  if (answers.orbit_policy === "fit-thermal-band") {
    rationale.push(
      "The orbit is scaled around the current star so the giant stays in the intended irradiation regime.",
    );
  } else if (answers.orbit_policy === "keep-current") {
    rationale.push(
      "The current orbit is preserved, so the solve stays close to the existing system architecture.",
    );
  }
  if (answers.ring_target === "ringed") {
    rationale.push(
      "Visible rings are treated as an explicit visual/science override rather than a guaranteed auto outcome.",
    );
  }
  if (archetype.id === "puffy-hot-giant") {
    rationale.push(
      "Inflated hot giants are more model-sensitive than colder or more compact gas-giant archetypes.",
    );
  }
  return rationale;
}

function buildGasGiantDiagnostics(archetype, recipe, solved, answers = {}, flowState = {}) {
  const diagnostics = [];
  const model = solved?.model || {};
  const classification = model.classification || {};
  const display = model.display || {};
  const ringState = solved?.ringState || {};
  const equilibriumTempK = Number(model?.thermal?.equilibriumTempK);
  const massMjup = Number(model?.physical?.massMjup);
  const metallicitySolar = Number(model?.inputs?.metallicitySolar);

  pushDiagnostic(
    diagnostics,
    "info",
    "recipe-source",
    "Recipe-backed starting point",
    `This ${flowState?.uxMode === "guided" ? "guided flow" : "quick type"} maps to the ${recipe?.label || archetype.label} gas-giant preset.`,
    [],
  );

  if (
    Number.isFinite(equilibriumTempK) &&
    archetype.orbitBand &&
    (equilibriumTempK < archetype.orbitBand.minTeqK ||
      equilibriumTempK > archetype.orbitBand.maxTeqK)
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "thermal-band-mismatch",
      "Thermal target is not reached",
      `The current solve lands at about ${fmt(equilibriumTempK, 0)} K, outside the ${archetype.orbitBand.label} expected for ${archetype.label}.`,
      ["Change the orbit policy or refine the semi-major axis after apply."],
    );
  }

  if (answers.ring_target === "ringed" && ringState.effectiveEnabled !== true) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "ring-target-mismatch",
      "Ringed target is not reached",
      "The current solve still hides rings instead of showing a visible ring system.",
      ["Force rings on, or refine the ring mode after apply."],
    );
  } else if (answers.ring_target === "no-rings" && ringState.effectiveEnabled === true) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "ring-target-mismatch",
      "No-rings target is not reached",
      "The current solve still shows rings instead of suppressing them.",
      ["Force rings off or review the current ring override state."],
    );
  }

  if (Number.isFinite(massMjup) && answers.mass_target === "compact" && massMjup > 0.12) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "mass-target-mismatch",
      "Compact-mass target is not reached",
      `The current solve is still about ${fmt(massMjup, 2)} Mj rather than in a compact ice-giant/sub-Neptune range.`,
      ["Lower the target mass or pick a more compact archetype."],
    );
  } else if (
    Number.isFinite(massMjup) &&
    answers.mass_target === "saturnian" &&
    (massMjup < 0.15 || massMjup > 0.55)
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "mass-target-mismatch",
      "Saturnian-mass target is not reached",
      `The current solve lands at about ${fmt(massMjup, 2)} Mj instead of a Saturn-class mass.`,
      ["Refine mass after apply or choose a different mass target."],
    );
  } else if (Number.isFinite(massMjup) && answers.mass_target === "super" && massMjup < 2) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "mass-target-mismatch",
      "Super-Jovian target is not reached",
      `The current solve is still only about ${fmt(massMjup, 2)} Mj.`,
      ["Increase mass or switch to a more massive archetype."],
    );
  }

  if (
    answers.metallicity_target === "enriched" &&
    Number.isFinite(metallicitySolar) &&
    metallicitySolar < 10
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "metallicity-target-mismatch",
      "Enriched-metallicity target is not reached",
      `The current solve still uses only about ${fmt(metallicitySolar, 1)}× solar atmospheric metallicity.`,
      ["Increase the metallicity input after apply if you want a more enriched giant."],
    );
  }

  if (
    includesAny(display.evaporationTimescale, ["hubble"]) === false &&
    archetype.id !== "jupiter-cold-giant" &&
    archetype.id !== "saturnian-ringed-giant"
  ) {
    const evaporationGyr = Number(
      String(display.evaporationTimescale || "").replace(/[^0-9.+-]/g, ""),
    );
    if (Number.isFinite(evaporationGyr) && evaporationGyr < 1) {
      pushDiagnostic(
        diagnostics,
        "warning",
        "strong-mass-loss",
        "Strong mass loss is expected",
        `The current solve reports an evaporation timescale of about ${display.evaporationTimescale}.`,
        ["Treat this as an irradiated starting point and review escape outputs after apply."],
      );
    }
  }

  if (archetype.id === "neptune-like-ice-giant" && classification.sudarsky > 2) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "class-target-mismatch",
      "Ice-giant thermal class is not reached",
      `The current solve lands in Class ${classification.sudarsky || "?"} rather than a colder outer-system regime.`,
      ["Move the orbit outward or keep the thermal-band fit."],
    );
  }

  const solveError = solved?.error;
  if (solveError) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "solve-preview-failed",
      "Preview solve unavailable",
      solveError,
      ["Apply the starting point, then review the Planet page outputs directly."],
    );
  }

  return diagnostics;
}

function solveGasGiantRecommendationFromArchetype(
  archetype,
  flowState,
  context = {},
  answersOverride = null,
) {
  if (!archetype) return null;

  const recipe = getRecipeForGasGiantArchetype(archetype.id, context);
  if (!recipe) return null;

  const answers = answersOverride || resolveGasGiantGuidedAnswers(archetype, flowState);
  const applyInputs =
    flowState?.uxMode === "guided"
      ? tuneGasGiantApplyInputs(archetype, recipe, answers, context)
      : tuneGasGiantApplyInputs(
          archetype,
          recipe,
          getGasGiantGuidedDefaults(archetype.id),
          context,
        );

  let solved = null;
  if (typeof context.solveGasGiantInputs === "function") {
    try {
      solved = context.solveGasGiantInputs(applyInputs) || null;
    } catch (error) {
      solved = {
        error:
          error instanceof Error
            ? error.message
            : "Gas giant quick-type solve failed for this context.",
      };
    }
  }

  return {
    objectType: "gasGiant",
    archetypeId: archetype.id,
    confidenceClass: archetype.confidenceClass,
    title: archetype.label,
    summary: buildGasGiantSummary(archetype, recipe, solved, answers, flowState?.uxMode),
    scienceModeRecommendation: {},
    applyPayload: {
      objectInputs: applyInputs,
      parentPatch: null,
      siblingPatch: null,
    },
    previewPayload:
      solved?.model && typeof solved.model === "object"
        ? {
            bodyType: "gasGiant",
            name: context.currentGasGiantName || recipe.label || archetype.label,
            recipeId: recipe.id,
            gasCalc: solved.model,
            styleId: solved.styleId || recipe.preview?.styleId || "jupiter",
            ringState: solved.ringState || null,
            ringAppearance: solved.ringAppearance || null,
            showRings: solved.ringState?.effectiveEnabled === true,
          }
        : null,
    diagnostics: buildGasGiantDiagnostics(archetype, recipe, solved, answers, flowState),
    rationale: buildGasGiantRationale(archetype, answers, context),
    nextActions: [...(archetype.nextActions || [])],
  };
}

function gasGiantSearchCandidateCap(searchBudget = "balanced") {
  switch (String(searchBudget || "")) {
    case "fast":
      return 2;
    case "deep":
      return 6;
    case "balanced":
    default:
      return 4;
  }
}

function deriveGasGiantGoalSeedAnswers(compiledGoal = {}, archetypeId = "") {
  const answers = { ...getGasGiantGuidedDefaults(archetypeId) };

  if (
    String(compiledGoal?.priority || "") === "preserve-current-orbit-context" ||
    String(compiledGoal?.priority || "") === "preserve-current-system"
  ) {
    answers.orbit_policy = "keep-current";
  } else if (
    goalTraitSelected(compiledGoal, "class-iv-v") ||
    goalTraitSelected(compiledGoal, "class-ii-iii") ||
    goalTraitAvoided(compiledGoal, "thermal-band-mismatch")
  ) {
    answers.orbit_policy = "fit-thermal-band";
  }

  if (
    goalTraitSelected(compiledGoal, "rings-visible") ||
    goalTraitSelected(compiledGoal, "strong-ring-appearance") ||
    goalTraitAvoided(compiledGoal, "rings-hidden")
  ) {
    answers.ring_target = "ringed";
  } else if (goalTraitAvoided(compiledGoal, "rings-visible")) {
    answers.ring_target = "no-rings";
  }

  if (goalTraitSelected(compiledGoal, "ice-giant-mass-range")) {
    answers.mass_target = "compact";
  } else if (
    goalTraitSelected(compiledGoal, "rings-visible") ||
    goalTraitSelected(compiledGoal, "strong-ring-appearance")
  ) {
    answers.mass_target = "saturnian";
  } else if (goalTraitSelected(compiledGoal, "class-iv-v")) {
    answers.mass_target = archetypeId === "puffy-hot-giant" ? "compact" : "jupiter";
  }

  if (goalTraitSelected(compiledGoal, "enriched-metallicity")) {
    answers.metallicity_target = "enriched";
  } else if (String(compiledGoal?.priority || "") === "preserve-current-system") {
    answers.metallicity_target = "solar";
  }

  return answers;
}

function buildGasGiantGoalSearchCandidates(compiledGoal = {}) {
  const templateMeta = getGasGiantGoalTemplateMeta(compiledGoal.goalTemplateId);
  return [...new Set(templateMeta.seedArchetypeIds || [])]
    .map((archetypeId) => ({
      archetypeId,
      answers: deriveGasGiantGoalSeedAnswers(compiledGoal, archetypeId),
    }))
    .slice(0, gasGiantSearchCandidateCap(compiledGoal.searchBudget));
}

function parseEvaporationTimescaleGyr(value) {
  if (includesAny(value, ["hubble"])) return Number.POSITIVE_INFINITY;
  const numeric = Number(String(value || "").replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(numeric) ? numeric : NaN;
}

function evaluateGasGiantGoalTrait(traitId, recommendation = {}) {
  const model = recommendation?.previewPayload?.gasCalc || {};
  const classification = model.classification || {};
  const display = model.display || {};
  const inputs = model.inputs || {};
  const physical = model.physical || {};
  const ringState = recommendation?.previewPayload?.ringState || {};
  const ringAppearance = recommendation?.previewPayload?.ringAppearance || {};
  const sudarsky = toFiniteNumber(classification.sudarsky, NaN);
  const massMjup = toFiniteNumber(
    physical.massMjup ?? recommendation?.applyPayload?.objectInputs?.massMjup,
    NaN,
  );
  const metallicitySolar = toFiniteNumber(
    inputs.metallicitySolar ?? recommendation?.applyPayload?.objectInputs?.metallicity,
    NaN,
  );
  const evaporationGyr = parseEvaporationTimescaleGyr(display.evaporationTimescale);

  switch (traitId) {
    case "rings-visible":
      return ringState.effectiveEnabled === true;
    case "strong-ring-appearance":
      return ringState.effectiveEnabled === true && !includesAny(ringAppearance.label, ["auto"]);
    case "class-iv-v":
      return Number.isFinite(sudarsky) && sudarsky >= 4;
    case "class-ii-iii":
      return Number.isFinite(sudarsky) && sudarsky >= 2 && sudarsky <= 3;
    case "ice-giant-mass-range":
      return Number.isFinite(massMjup) && massMjup > 0 && massMjup <= 0.12;
    case "low-mass-loss":
      return Number.isFinite(evaporationGyr)
        ? evaporationGyr >= 1
        : includesAny(display.massLossRate, ["low", "negligible"]);
    case "enriched-metallicity":
      return Number.isFinite(metallicitySolar) && metallicitySolar >= 10;
    case "rings-hidden":
      return ringState.effectiveEnabled !== true;
    case "strong-evaporation":
      return Number.isFinite(evaporationGyr)
        ? evaporationGyr < 1
        : includesAny(display.massLossRate, ["high", "strong", "rapid"]);
    case "thermal-band-mismatch":
      return (recommendation?.diagnostics || []).some(
        (entry) => entry?.code === "thermal-band-mismatch",
      );
    default:
      return false;
  }
}

function scoreGasGiantGoalRecommendation(compiledGoal = {}, recommendation = {}, context = {}) {
  const evaluationPlan = compiledGoal?.evaluationPlan || {};
  const matchedRequired = [];
  const missingRequired = [];
  const matchedPreferred = [];
  const triggeredAvoid = [];
  let score = 0;

  for (const entry of evaluationPlan.hardConstraints || []) {
    if (evaluateGasGiantGoalTrait(entry.traitId, recommendation)) {
      matchedRequired.push(entry.traitId);
      score += 6;
    } else {
      missingRequired.push(entry.traitId);
      score -= 10;
    }
  }

  for (const entry of evaluationPlan.preferredTraits || []) {
    if (evaluateGasGiantGoalTrait(entry.traitId, recommendation)) {
      matchedPreferred.push(entry.traitId);
      score += Number(entry.weight) || 1;
    }
  }

  for (const entry of evaluationPlan.avoidTraits || []) {
    if (evaluateGasGiantGoalTrait(entry.traitId, recommendation)) {
      triggeredAvoid.push(entry.traitId);
      score -= Number(entry.penalty) || 1;
    }
  }

  const currentOrbitAu = toFiniteNumber(context?.currentInputs?.au, NaN);
  const nextOrbitAu = toFiniteNumber(recommendation?.applyPayload?.objectInputs?.au, NaN);
  const orbitPenalty =
    Number.isFinite(currentOrbitAu) && currentOrbitAu > 0 && Number.isFinite(nextOrbitAu)
      ? Math.min(Math.abs(nextOrbitAu - currentOrbitAu) / currentOrbitAu, 2)
      : 0;
  score -= (Number(evaluationPlan.orbitDeviationWeight) || 1) * orbitPenalty;

  const currentMassMjup = toFiniteNumber(context?.currentInputs?.massMjup, NaN);
  const nextMassMjup = toFiniteNumber(recommendation?.applyPayload?.objectInputs?.massMjup, NaN);
  const massPenalty =
    Number.isFinite(currentMassMjup) && currentMassMjup > 0 && Number.isFinite(nextMassMjup)
      ? Math.min(Math.abs(nextMassMjup - currentMassMjup) / currentMassMjup, 2)
      : 0;
  score -= (Number(evaluationPlan.contextDeviationWeight) || 1) * massPenalty;

  return {
    score,
    matchedRequired,
    missingRequired,
    matchedPreferred,
    triggeredAvoid,
    fitClass:
      missingRequired.length === 0 && triggeredAvoid.length === 0
        ? "exact-match"
        : missingRequired.length
          ? "near-miss"
          : "tradeoff",
  };
}

function buildGasGiantGoalSearchDiagnostics(compiledGoal = {}, scoring = {}, searchMeta = {}) {
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

  pushDiagnostic(
    diagnostics,
    "info",
    "goal-search-seed",
    "Goal search seed",
    `Best seeded fit came from ${searchMeta.seedLabel || "a gas-giant archetype"} after trying ${searchMeta.candidatesTried || 0} candidate paths.`,
    [],
  );

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
      "Treat this as a strong starting point, then refine the Planet page inputs if you need a tighter fit.",
    ],
  );
  return diagnostics;
}

async function startGasGiantGoalSearch(
  compiledGoal = null,
  flowState = {},
  context = {},
  job = {},
) {
  if (!compiledGoal?.goalTemplateId) {
    return {
      recommendation: null,
      terminationReason: "missing-goal-template",
    };
  }

  const template = getGoalTemplate("gasGiant", compiledGoal.goalTemplateId);
  const candidates = buildGasGiantGoalSearchCandidates(compiledGoal);
  let bestResult = null;
  let tried = 0;

  for (const candidate of candidates) {
    job?.throwIfCanceled?.();
    await Promise.resolve();

    const archetype = getGasGiantArchetype(candidate.archetypeId);
    const recommendation = solveGasGiantRecommendationFromArchetype(
      archetype,
      { ...flowState, uxMode: "guided" },
      context,
      candidate.answers,
    );
    if (!recommendation) continue;
    tried += 1;

    const scoring = scoreGasGiantGoalRecommendation(compiledGoal, recommendation, context);
    if (!bestResult || scoring.score > bestResult.scoring.score) {
      bestResult = {
        recommendation,
        scoring,
        seedLabel: archetype?.label || candidate.archetypeId,
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

  return {
    recommendation: {
      ...bestResult.recommendation,
      title: template?.label || bestResult.recommendation.title,
      confidenceClass: getGasGiantGoalTemplateMeta(compiledGoal.goalTemplateId).confidenceClass,
      summary:
        `${template?.summary || bestResult.recommendation.summary} ` +
        `Seeded from ${bestResult.seedLabel}.`,
      diagnostics: [
        ...buildGasGiantGoalSearchDiagnostics(compiledGoal, bestResult.scoring, {
          seedLabel: bestResult.seedLabel,
          candidatesTried: tried,
        }),
        ...(bestResult.recommendation.diagnostics || []),
      ],
      rationale: [
        `Goal search tried ${tried} seeded gas-giant paths and selected ${bestResult.seedLabel}.`,
        ...(bestResult.recommendation.rationale || []),
      ],
      nextActions: [
        ...(bestResult.recommendation.nextActions || []),
        "Re-run the search after changing traits or allowed edits if you want a different trade-off.",
      ],
      goalTemplateId: compiledGoal.goalTemplateId,
      fitClass: bestResult.scoring.fitClass,
    },
    terminationReason:
      bestResult.scoring.fitClass === "exact-match" ? "goal-fit-exact" : "goal-fit-near-miss",
  };
}

export const gasGiantGuidedAdapter = {
  objectType: "gasGiant",

  listArchetypes(_context = {}, flowState = {}) {
    if (flowState?.uxMode === "guided") return listGasGiantGoalTemplateCards();
    return GAS_GIANT_GUIDED_ARCHETYPES.map((entry) => ({ ...entry }));
  },

  buildQuestions(flowState, context = {}) {
    if (flowState?.uxMode === "guided" && flowState?.selectedGoalTemplateId) {
      return buildGasGiantGoalQuestions(flowState, context);
    }
    const archetype = getGasGiantArchetype(flowState?.selectedArchetypeId);
    if (!archetype || flowState?.uxMode !== "guided") return [];
    return buildGasGiantQuestions(archetype, context);
  },

  compileGoal(flowState) {
    if (!flowState?.selectedGoalTemplateId) {
      return {
        valid: false,
        diagnostics: [
          {
            severity: "blocked",
            code: "missing-goal-template",
            title: "Choose a gas-giant goal",
            detail: "Pick a gas-giant goal template before compiling the search target.",
          },
        ],
      };
    }
    return compileGuidedGoal(buildGasGiantGoalCompileInput(flowState));
  },

  solveRecommendation(flowState, context = {}) {
    const archetype = getGasGiantArchetype(flowState?.selectedArchetypeId);
    return solveGasGiantRecommendationFromArchetype(archetype, flowState, context);
  },

  startSearch(compiledGoal, flowState, context, job) {
    return startGasGiantGoalSearch(compiledGoal, flowState, context, job);
  },

  applyRecommendation(recommendation, storeContext = {}) {
    if (!recommendation?.applyPayload?.objectInputs) return null;
    if (typeof storeContext.applyGasGiantRecommendation === "function") {
      return storeContext.applyGasGiantRecommendation(recommendation);
    }
    if (typeof storeContext.applyGasGiantInputs === "function") {
      return storeContext.applyGasGiantInputs(
        recommendation.applyPayload.objectInputs,
        recommendation,
      );
    }
    return recommendation.applyPayload;
  },
};

export function registerGasGiantGuidedAdapter(options = {}) {
  return registerGuidedAdapter(gasGiantGuidedAdapter, options);
}

export function ensureGasGiantGuidedAdapterRegistered() {
  return getGuidedAdapter("gasGiant") || registerGasGiantGuidedAdapter();
}

export { GAS_GIANT_GUIDED_ARCHETYPES, getGasGiantArchetype, getRecipeForGasGiantArchetype };
