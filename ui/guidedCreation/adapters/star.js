import { calcStar } from "../../../engine/star.js";
import { computeStellarActivityModel } from "../../../engine/stellarActivity.js";
import { clamp, fmt } from "../../../engine/utils.js";
import { compileGuidedGoal } from "../goalCompiler.js";
import { getGoalTemplate, getGoalTrait, listGoalTemplates } from "../goalTraits.js";
import { getGuidedAdapter, registerGuidedAdapter } from "../registry.js";

const STAR_GUIDED_ARCHETYPES = Object.freeze([
  {
    id: "active-red-dwarf-star",
    objectType: "star",
    label: "Active Red Dwarf",
    shortLabel: "Active M",
    summary: "Low-mass flare-heavy M dwarf with a very close-in habitable zone.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["m dwarf", "active", "flare-rich"],
    apply: { massMsol: 0.15, ageGyr: 0.8, metallicityFeH: 0.0, evolutionMode: "zams" },
    nextActions: ["Check flare rate, CME rate, and habitable-zone distance after apply."],
  },
  {
    id: "quiet-red-dwarf-star",
    objectType: "star",
    label: "Quiet Red Dwarf",
    shortLabel: "Quiet M",
    summary: "Older low-mass M dwarf with lower activity and a long-lived main sequence.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["m dwarf", "quiet", "long-lived"],
    apply: { massMsol: 0.28, ageGyr: 7.5, metallicityFeH: 0.0, evolutionMode: "zams" },
    nextActions: ["Check activity regime and the very tight habitable-zone distance."],
  },
  {
    id: "orange-k-dwarf-star",
    objectType: "star",
    label: "Orange K Dwarf",
    shortLabel: "K Dwarf",
    summary: "Long-lived K dwarf in the classic conservative habitable-star regime.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["k dwarf", "habitable", "stable"],
    apply: { massMsol: 0.78, ageGyr: 6.0, metallicityFeH: 0.0, evolutionMode: "zams" },
    nextActions: ["Check habitable-zone span and giant-planet probability after apply."],
  },
  {
    id: "sunlike-g-star",
    objectType: "star",
    label: "Sun-like",
    shortLabel: "G Star",
    summary: "A Sun-like G dwarf tuned for familiar habitable-zone and activity outputs.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["g dwarf", "sun-like", "habitable"],
    apply: { massMsol: 1.0, ageGyr: 4.6, metallicityFeH: 0.0, evolutionMode: "zams" },
    nextActions: ["Check life assessment, habitable-zone range, and activity outputs after apply."],
  },
  {
    id: "warm-f-star",
    objectType: "star",
    label: "Warm F Star",
    shortLabel: "F Star",
    summary: "Hotter, brighter F star with a broader habitable zone but shorter stable lifetime.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["f star", "warm", "bright"],
    apply: { massMsol: 1.28, ageGyr: 2.2, metallicityFeH: 0.0, evolutionMode: "zams" },
    nextActions: ["Check max-age limits and whether the life assessment stays within your target."],
  },
  {
    id: "bright-a-star",
    objectType: "star",
    label: "Bright A Star",
    shortLabel: "A Star",
    summary: "Luminous short-lived A star for young, bright, hard-irradiation systems.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["a star", "bright", "short-lived"],
    apply: { massMsol: 1.85, ageGyr: 0.7, metallicityFeH: 0.0, evolutionMode: "zams" },
    nextActions: ["Check the maximum age and life assessment after apply."],
  },
  {
    id: "aging-subgiant-star",
    objectType: "star",
    label: "Aging Subgiant",
    shortLabel: "Subgiant",
    summary:
      "An evolved Sun-like star moving off the main sequence into a brighter subgiant phase.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["evolved", "subgiant", "brightening"],
    apply: { massMsol: 1.1, ageGyr: 7.4, metallicityFeH: 0.0, evolutionMode: "evolved" },
    nextActions: ["Check the evolved luminosity shift and habitable-zone migration after apply."],
  },
]);

const EVOLUTION_TARGET_OPTIONS = Object.freeze([
  {
    value: "keep-current",
    label: "Keep current phase",
    description: "Preserve the current evolution mode and only refit the star within it.",
  },
  {
    value: "main-sequence",
    label: "Main sequence",
    description: "Bias toward a stable hydrogen-burning star.",
  },
  {
    value: "evolving",
    label: "Evolving star",
    description: "Bias toward a brighter post-main-sequence state when plausible.",
  },
]);

const ACTIVITY_TARGET_OPTIONS = Object.freeze([
  {
    value: "quiet",
    label: "Quiet",
    description: "Prefer older, lower-activity stellar states where possible.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Stay near the archetype's default activity level.",
  },
  {
    value: "active",
    label: "Active",
    description: "Bias toward younger or more flare-rich stellar states.",
  },
]);

const METALLICITY_TARGET_OPTIONS = Object.freeze([
  {
    value: "metal-poor",
    label: "Metal-poor",
    description: "Bias the star toward lower heavy-element abundance.",
  },
  {
    value: "solar",
    label: "Solar-ish",
    description: "Keep the star near solar metallicity.",
  },
  {
    value: "metal-rich",
    label: "Metal-rich",
    description: "Bias the star toward a heavier-element-rich disk-star profile.",
  },
]);

const SYSTEM_GOAL_OPTIONS = Object.freeze([
  {
    value: "earthlike-window",
    label: "Earth-like window",
    description: "Prefer stars whose outputs better support an Earth-like habitability window.",
  },
  {
    value: "long-lived-stability",
    label: "Long-lived",
    description: "Prefer stars with long stable lifetimes and calmer evolution.",
  },
  {
    value: "bright-short-lived",
    label: "Bright and short-lived",
    description: "Prefer luminous young-star outputs over long-term stability.",
  },
]);

const GOAL_PRIORITY_OPTIONS = Object.freeze([
  {
    value: "maximize-realism",
    label: "Maximize realism",
    description: "Favor the most conservative stellar fit.",
  },
  {
    value: "maximize-habitability",
    label: "Maximize habitability",
    description: "Push harder toward calmer life-friendly stellar outputs.",
  },
  {
    value: "preserve-current-system",
    label: "Preserve current system",
    description: "Stay closer to the current stellar context where possible.",
  },
  {
    value: "preserve-current-orbit-context",
    label: "Preserve current phase",
    description: "Prefer smaller changes to the current stellar state.",
  },
]);

const GOAL_ALLOWED_EDIT_OPTIONS = Object.freeze([
  {
    value: "edit-object-only",
    label: "Star only",
    description: "Search only within the star inputs.",
  },
  {
    value: "edit-object-plus-host",
    label: "Star + host context",
    description: "Allow broader fit changes while keeping the current system framing.",
  },
  {
    value: "edit-object-plus-local-system",
    label: "Star + local system",
    description: "Allow the broadest seeded search in this pilot flow.",
  },
]);

const GOAL_SEARCH_BUDGET_OPTIONS = Object.freeze([
  {
    value: "fast",
    label: "Fast",
    description: "Try a small seeded search for a quick answer.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Try more seeded candidates before choosing the best fit.",
  },
  {
    value: "deep",
    label: "Deep",
    description: "Try the broadest seeded search available in this pilot flow.",
  },
]);

const STAR_GOAL_TEMPLATE_META = Object.freeze({
  "quiet-habitable-star": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["orange-k-dwarf-star", "sunlike-g-star", "quiet-red-dwarf-star"],
    focusTraits: [
      "earthlike-life-possible",
      "main-sequence",
      "long-main-sequence-lifetime",
      "low-flare-rate",
      "high-giant-planet-probability",
      "solar-metallicity",
      "high-flare-rate",
      "very-short-lifetime",
      "post-main-sequence",
    ],
  },
  "sun-like-star": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["sunlike-g-star", "orange-k-dwarf-star", "warm-f-star"],
    focusTraits: [
      "main-sequence",
      "solar-metallicity",
      "low-flare-rate",
      "earthlike-life-possible",
      "high-luminosity",
      "high-flare-rate",
      "very-short-lifetime",
      "post-main-sequence",
    ],
  },
  "long-lived-orange-dwarf": {
    confidenceClass: "defensible",
    seedArchetypeIds: ["orange-k-dwarf-star", "quiet-red-dwarf-star", "sunlike-g-star"],
    focusTraits: [
      "main-sequence",
      "long-main-sequence-lifetime",
      "low-flare-rate",
      "earthlike-life-possible",
      "high-giant-planet-probability",
      "solar-metallicity",
      "very-short-lifetime",
      "post-main-sequence",
    ],
  },
  "bright-short-lived-star": {
    confidenceClass: "plausible",
    seedArchetypeIds: ["bright-a-star", "warm-f-star", "aging-subgiant-star"],
    focusTraits: [
      "high-luminosity",
      "main-sequence",
      "low-flare-rate",
      "solar-metallicity",
      "earthlike-life-possible",
      "high-flare-rate",
      "very-short-lifetime",
      "post-main-sequence",
    ],
  },
});

function getStarArchetype(archetypeId) {
  return STAR_GUIDED_ARCHETYPES.find((entry) => entry.id === String(archetypeId || "")) || null;
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

function getStarGoalTemplateMeta(goalTemplateId) {
  return (
    STAR_GOAL_TEMPLATE_META[String(goalTemplateId || "").trim()] || {
      confidenceClass: "plausible",
      seedArchetypeIds: ["sunlike-g-star"],
      focusTraits: [],
    }
  );
}

function mapStarGoalTemplateToCard(template) {
  const meta = getStarGoalTemplateMeta(template?.id);
  return {
    id: template?.id || "",
    objectType: "star",
    label: template?.label || "Star goal",
    shortLabel: template?.label || "Star goal",
    summary: template?.summary || "",
    confidenceClass: meta.confidenceClass,
    quickEnabled: false,
    guidedEnabled: true,
    tags: [...(template?.requiredTraits || []), ...(template?.preferredTraits || [])]
      .slice(0, 4)
      .map((traitId) => getGoalTrait(traitId)?.label || traitId),
  };
}

function listStarGoalTemplateCards() {
  return listGoalTemplates("star").map((template) => mapStarGoalTemplateToCard(template));
}

function defaultStarGoalDraft(goalTemplateId = "") {
  const template = getGoalTemplate("star", goalTemplateId);
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

function normalizeStarGoalDraft(flowState = {}) {
  const base = defaultStarGoalDraft(flowState?.selectedGoalTemplateId);
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

function buildStarGoalDraftQuestionOptions(traitId) {
  const trait = getGoalTrait(traitId);
  const allowedRoles = Array.isArray(trait?.allowedRoles) ? trait.allowedRoles : [];
  const options = [
    {
      value: "off",
      label: "Off",
      description: "Do not explicitly optimize for or avoid this trait.",
    },
  ];
  if (allowedRoles.includes("required")) {
    options.push({
      value: "required",
      label: "Must have",
      description: "Treat this as a hard constraint in the search.",
    });
  }
  if (allowedRoles.includes("preferred")) {
    options.push({
      value: "preferred",
      label: "Prefer",
      description: "Improve the score when this trait is reached.",
    });
  }
  if (allowedRoles.includes("avoid")) {
    options.push({
      value: "avoid",
      label: "Avoid",
      description: "Penalize results that trigger this trait.",
    });
  }
  return options;
}

function buildStarGoalQuestions(flowState, context = {}) {
  const template = getGoalTemplate("star", flowState?.selectedGoalTemplateId);
  if (!template) return [];
  const draft = normalizeStarGoalDraft(flowState);
  const focusTraits = getStarGoalTemplateMeta(template.id).focusTraits;
  return [
    {
      id: "priority",
      stepId: "stellar-context",
      kind: "choice",
      label: "Priority",
      help:
        context.currentContextText ||
        "Choose whether this search should favor realism, habitability, or staying closer to the current stellar state.",
      defaultValue: draft.priority,
      options: GOAL_PRIORITY_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "allowedEdits",
      stepId: "stellar-context",
      kind: "choice",
      label: "Allowed edits",
      help: "Decide whether the search may only retune this star or make broader local changes.",
      defaultValue: draft.allowedEdits,
      options: GOAL_ALLOWED_EDIT_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "searchBudget",
      stepId: "stellar-context",
      kind: "choice",
      label: "Search budget",
      help: "Controls how many seeded candidate paths this pilot goal search will try.",
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
        options: buildStarGoalDraftQuestionOptions(trait.id),
      })),
  ];
}

function buildStarGoalCompileInput(flowState = {}) {
  const draft = normalizeStarGoalDraft(flowState);
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
    objectType: "star",
    goalTemplateId: flowState?.selectedGoalTemplateId || "",
    priority: draft.priority,
    allowedEdits: draft.allowedEdits,
    searchBudget: draft.searchBudget,
    requiredTraits,
    preferredTraits,
    avoidTraits,
  };
}

export function buildStarPresetApplyInputs(source = {}, currentInputs = {}) {
  const sourceInputs = source && typeof source === "object" ? source : {};
  const current = currentInputs && typeof currentInputs === "object" ? currentInputs : {};
  const massMsol = clamp(Number(sourceInputs.massMsol ?? current.massMsol ?? 1), 0.075, 100);
  const ageGyr = Math.max(Number(sourceInputs.ageGyr ?? current.ageGyr ?? 4.6), 0.001);
  return {
    name: String(current.name || sourceInputs.name || "Star"),
    massMsol,
    ageGyr,
    metallicityFeH: clamp(
      Number(sourceInputs.metallicityFeH ?? current.metallicityFeH ?? 0),
      -3,
      1,
    ),
    physicsMode: "simple",
    advancedDerivationMode: "rl",
    radiusRsolOverride: null,
    luminosityLsolOverride: null,
    tempKOverride: null,
    evolutionMode: sourceInputs.evolutionMode === "evolved" ? "evolved" : "zams",
    activityModelVersion: "v2",
  };
}

function getStarGuidedDefaults(archetypeId) {
  switch (String(archetypeId || "")) {
    case "active-red-dwarf-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "active",
        metallicity_target: "solar",
        system_goal: "long-lived-stability",
      };
    case "quiet-red-dwarf-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "quiet",
        metallicity_target: "solar",
        system_goal: "long-lived-stability",
      };
    case "orange-k-dwarf-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "quiet",
        metallicity_target: "solar",
        system_goal: "earthlike-window",
      };
    case "sunlike-g-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "balanced",
        metallicity_target: "solar",
        system_goal: "earthlike-window",
      };
    case "warm-f-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "balanced",
        metallicity_target: "solar",
        system_goal: "earthlike-window",
      };
    case "bright-a-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "active",
        metallicity_target: "solar",
        system_goal: "bright-short-lived",
      };
    case "aging-subgiant-star":
      return {
        evolution_target: "evolving",
        activity_target: "quiet",
        metallicity_target: "solar",
        system_goal: "bright-short-lived",
      };
    default:
      return {
        evolution_target: "main-sequence",
        activity_target: "balanced",
        metallicity_target: "solar",
        system_goal: "earthlike-window",
      };
  }
}

function resolveStarGuidedAnswers(archetype, flowState = {}) {
  return {
    ...getStarGuidedDefaults(archetype?.id),
    ...(flowState?.answers || {}),
  };
}

function buildStarQuestions(archetype, context = {}) {
  const defaults = getStarGuidedDefaults(archetype.id);
  return [
    {
      id: "evolution_target",
      stepId: "stellar-context",
      kind: "choice",
      label: "Evolution Target",
      help:
        context.currentContextText ||
        "Decide whether to preserve the current phase or bias the star toward a main-sequence or evolving state.",
      options: EVOLUTION_TARGET_OPTIONS,
      defaultValue: defaults.evolution_target,
    },
    {
      id: "activity_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Activity Target",
      help: "Decide whether you want a quieter, balanced, or more flare-active star.",
      options: ACTIVITY_TARGET_OPTIONS,
      defaultValue: defaults.activity_target,
    },
    {
      id: "metallicity_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Metallicity Target",
      help: "Bias the star toward metal-poor, solar-ish, or metal-rich composition.",
      options: METALLICITY_TARGET_OPTIONS,
      defaultValue: defaults.metallicity_target,
    },
    {
      id: "system_goal",
      stepId: "goal-details",
      kind: "choice",
      label: "System Goal",
      help: "State whether you care most about Earth-like, long-lived, or bright young-star conditions.",
      options: SYSTEM_GOAL_OPTIONS,
      defaultValue: defaults.system_goal,
    },
  ];
}

function targetMetallicityForBucket(bucket) {
  switch (String(bucket || "")) {
    case "metal-poor":
      return -0.5;
    case "metal-rich":
      return 0.3;
    case "solar":
    default:
      return 0;
  }
}

function clampStarAge(massMsol, ageGyr, metallicityFeH, evolutionMode) {
  const probe = calcStar({
    massMsol,
    ageGyr: Math.max(Number(ageGyr) || 0.001, 0.001),
    metallicityFeH: Number(metallicityFeH) || 0,
    radiusRsolOverride: null,
    luminosityLsolOverride: null,
    tempKOverride: null,
    evolutionMode: evolutionMode === "evolved" ? "evolved" : "zams",
  });
  const maxAgeGyr = Number(probe?.maxAgeGyr);
  if (!(maxAgeGyr > 0)) return Math.max(Number(ageGyr) || 0.001, 0.001);
  return clamp(Number(ageGyr) || 0.001, 0.001, Math.max(maxAgeGyr * 0.97, 0.01));
}

function activityTargetAge(archetype, bucket, baseAgeGyr) {
  const massMsol = Number(archetype?.apply?.massMsol) || 1;
  if (bucket === "active") {
    if (massMsol < 0.45) return 0.8;
    if (massMsol < 1.2) return 1.4;
    return 0.5;
  }
  if (bucket === "quiet") {
    if (massMsol < 0.45) return Math.max(baseAgeGyr, 6.5);
    if (massMsol < 1.2) return Math.max(baseAgeGyr, 5.5);
    return Math.max(baseAgeGyr, 2.5);
  }
  return baseAgeGyr;
}

function tuneStarApplyInputs(archetype, answers, context = {}) {
  const currentInputs = context.currentInputs || {};
  const nextInputs = buildStarPresetApplyInputs(archetype.apply, currentInputs);

  if (answers.evolution_target === "keep-current") {
    nextInputs.evolutionMode = currentInputs.evolutionMode === "evolved" ? "evolved" : "zams";
  } else if (answers.evolution_target === "evolving") {
    nextInputs.evolutionMode = "evolved";
  } else {
    nextInputs.evolutionMode = "zams";
  }

  nextInputs.metallicityFeH = targetMetallicityForBucket(answers.metallicity_target);
  nextInputs.ageGyr = activityTargetAge(archetype, answers.activity_target, nextInputs.ageGyr);

  if (answers.system_goal === "long-lived-stability" && nextInputs.massMsol > 1.15) {
    nextInputs.ageGyr = Math.max(nextInputs.ageGyr, 1.2);
  } else if (answers.system_goal === "bright-short-lived" && nextInputs.massMsol < 1.0) {
    nextInputs.ageGyr = Math.min(nextInputs.ageGyr, 3.5);
  }

  nextInputs.ageGyr = clampStarAge(
    nextInputs.massMsol,
    nextInputs.ageGyr,
    nextInputs.metallicityFeH,
    nextInputs.evolutionMode,
  );
  return nextInputs;
}

function pushDiagnostic(list, severity, code, title, detail, suggestedActions = []) {
  list.push({ severity, code, title, detail, suggestedActions });
}

function buildStarSummary(archetype, solved, answers = {}, uxMode = "quick") {
  const model = solved?.model || {};
  const activity = solved?.activityModel?.activity || {};
  const targets = [];
  targets.push(
    answers.evolution_target === "evolving"
      ? "evolving phase"
      : answers.evolution_target === "keep-current"
        ? "current phase"
        : "main-sequence phase",
  );
  targets.push(`${answers.activity_target || "balanced"} activity target`);
  targets.push(`${answers.metallicity_target || "solar"} metallicity target`);
  targets.push(`${answers.system_goal || "earthlike-window"} system goal`);

  const currentResult = [
    model.spectralClass || "",
    model.display?.hzAu ? `HZ ${model.display.hzAu}` : "",
    activity.teffBin && activity.ageBand ? `Activity ${activity.teffBin}/${activity.ageBand}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  if (uxMode === "guided") {
    return `Uses ${archetype.label} as a guided stellar starting point with ${targets.join(", ")}. Current result: ${currentResult}.`;
  }
  return `Applies ${archetype.label} and re-solves the star in the current editor context. Current result: ${currentResult}.`;
}

function buildStarRationale(archetype, answers = {}, context = {}) {
  const rationale = [];
  if (context.currentContextText) rationale.push(context.currentContextText);
  if (answers.evolution_target === "evolving") {
    rationale.push(
      "The solve is biased toward a brighter post-main-sequence state instead of a purely static main-sequence star.",
    );
  } else if (answers.evolution_target === "keep-current") {
    rationale.push(
      "The current evolution mode is preserved so the recommendation stays close to the current star state.",
    );
  }
  if (answers.system_goal === "earthlike-window") {
    rationale.push(
      "The diagnostics check whether the resulting star still supports an Earth-like habitability window.",
    );
  }
  if (archetype.id === "bright-a-star" || archetype.id === "aging-subgiant-star") {
    rationale.push(
      "This is a more specialised stellar target than the quieter K/G-dwarf archetypes.",
    );
  }
  return rationale;
}

function buildStarDiagnostics(archetype, solved, answers = {}, flowState = {}) {
  const diagnostics = [];
  const model = solved?.model || {};
  const activity = solved?.activityModel?.activity || {};
  const energeticFlareRatePerDay = Number(activity.energeticFlareRatePerDay);
  const giantPlanetProbability = Number(model.giantPlanetProbability);

  pushDiagnostic(
    diagnostics,
    "info",
    "archetype-source",
    "Archetype-backed starting point",
    `This ${flowState?.uxMode === "guided" ? "guided flow" : "quick type"} maps to the ${archetype.label} stellar archetype.`,
    [],
  );

  if (
    answers.activity_target === "quiet" &&
    Number.isFinite(energeticFlareRatePerDay) &&
    energeticFlareRatePerDay > 1
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "activity-target-not-met",
      "Quiet-activity target is not reached",
      `The current solve still predicts about ${fmt(energeticFlareRatePerDay, 2)} energetic flares/day.`,
      ["Increase age, reduce mass, or switch to a calmer stellar archetype."],
    );
  } else if (
    answers.activity_target === "active" &&
    Number.isFinite(energeticFlareRatePerDay) &&
    energeticFlareRatePerDay < 0.5
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "activity-target-not-met",
      "Active-target is not reached",
      `The current solve only predicts about ${fmt(energeticFlareRatePerDay, 2)} energetic flares/day.`,
      ["Choose a younger or lower-mass active stellar archetype."],
    );
  }

  if (
    answers.system_goal === "earthlike-window" &&
    String(model.earthLikeLifePossible || "").toLowerCase() !== "yes"
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "earthlike-goal-not-met",
      "Earth-like target is not reached",
      `The current solve reports Earth-like life as "${model.earthLikeLifePossible || "Unknown"}".`,
      ["Choose a calmer K/G-dwarf archetype or refine age and mass after apply."],
    );
  }

  if (answers.system_goal === "long-lived-stability" && Number(model.maxAgeGyr) < 8) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "lifetime-target-not-met",
      "Long-lived target is not reached",
      `The current solve only sustains a maximum main-sequence age of about ${fmt(model.maxAgeGyr || 0, 2)} Gyr.`,
      ["Choose a lower-mass K or M dwarf if you want a longer-lived stable star."],
    );
  }

  if (answers.system_goal === "bright-short-lived" && Number(model.luminosityLsol) < 3) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "brightness-target-not-met",
      "Bright-star target is not reached",
      `The current solve is only about ${fmt(model.luminosityLsol || 0, 2)} Lsol.`,
      ["Choose a hotter F/A star or an evolved subgiant target."],
    );
  }

  if (
    answers.metallicity_target === "metal-rich" &&
    Number.isFinite(giantPlanetProbability) &&
    giantPlanetProbability < 0.1
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "metallicity-target-soft-mismatch",
      "Metal-rich giant-planet bias is still weak",
      `Even with the selected metallicity target, the current giant-planet probability is only about ${fmt(giantPlanetProbability * 100, 1)}%.`,
      ["Increase metallicity further after apply if you need a stronger giant-planet bias."],
    );
  }

  if (solved?.error) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "solve-preview-failed",
      "Preview solve unavailable",
      solved.error,
      ["Apply the starting point, then review the Star page outputs directly."],
    );
  }

  return diagnostics;
}

function solveStarRecommendationFromArchetype(
  archetype,
  flowState,
  context = {},
  answersOverride = null,
) {
  if (!archetype) return null;

  const answers = answersOverride || resolveStarGuidedAnswers(archetype, flowState);
  const applyInputs =
    flowState?.uxMode === "guided"
      ? tuneStarApplyInputs(archetype, answers, context)
      : tuneStarApplyInputs(archetype, getStarGuidedDefaults(archetype.id), context);

  let solved = null;
  if (typeof context.solveStarInputs === "function") {
    try {
      solved = context.solveStarInputs(applyInputs) || null;
    } catch (error) {
      solved = {
        error: error instanceof Error ? error.message : "Star guided preview solve failed.",
      };
    }
  }

  return {
    objectType: "star",
    archetypeId: archetype.id,
    confidenceClass: archetype.confidenceClass,
    title: archetype.label,
    summary: buildStarSummary(archetype, solved, answers, flowState?.uxMode),
    scienceModeRecommendation: {},
    applyPayload: {
      objectInputs: applyInputs,
      parentPatch: null,
      siblingPatch: null,
    },
    previewPayload:
      solved?.model && typeof solved.model === "object"
        ? {
            bodyType: "star",
            name: context.currentStarName || applyInputs.name || archetype.label,
            starCalc: solved.model,
            activityModel: solved.activityModel || null,
          }
        : null,
    diagnostics: buildStarDiagnostics(archetype, solved, answers, flowState),
    rationale: buildStarRationale(archetype, answers, context),
    nextActions: [...(archetype.nextActions || [])],
  };
}

function starSearchCandidateCap(searchBudget = "balanced") {
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

function deriveStarGoalSeedAnswers(compiledGoal = {}, archetypeId = "") {
  const answers = { ...getStarGuidedDefaults(archetypeId) };

  if (
    goalTraitSelected(compiledGoal, "main-sequence") ||
    goalTraitAvoided(compiledGoal, "post-main-sequence")
  ) {
    answers.evolution_target = "main-sequence";
  } else if (
    goalTraitAvoided(compiledGoal, "main-sequence") ||
    goalTraitSelected(compiledGoal, "high-luminosity")
  ) {
    answers.evolution_target =
      archetypeId === "aging-subgiant-star"
        ? "evolving"
        : getStarGuidedDefaults(archetypeId).evolution_target;
  }

  if (
    goalTraitSelected(compiledGoal, "low-flare-rate") ||
    goalTraitAvoided(compiledGoal, "high-flare-rate") ||
    goalTraitSelected(compiledGoal, "earthlike-life-possible")
  ) {
    answers.activity_target = "quiet";
  } else if (goalTraitAvoided(compiledGoal, "low-flare-rate")) {
    answers.activity_target = "active";
  }

  if (goalTraitSelected(compiledGoal, "high-giant-planet-probability")) {
    answers.metallicity_target = "metal-rich";
  } else if (goalTraitSelected(compiledGoal, "solar-metallicity")) {
    answers.metallicity_target = "solar";
  }

  if (goalTraitSelected(compiledGoal, "earthlike-life-possible")) {
    answers.system_goal = "earthlike-window";
  } else if (goalTraitSelected(compiledGoal, "long-main-sequence-lifetime")) {
    answers.system_goal = "long-lived-stability";
  } else if (goalTraitSelected(compiledGoal, "high-luminosity")) {
    answers.system_goal = "bright-short-lived";
  }

  return answers;
}

function buildStarGoalSearchCandidates(compiledGoal = {}) {
  const templateMeta = getStarGoalTemplateMeta(compiledGoal.goalTemplateId);
  return [...new Set(templateMeta.seedArchetypeIds || [])]
    .map((archetypeId) => ({
      archetypeId,
      answers: deriveStarGoalSeedAnswers(compiledGoal, archetypeId),
    }))
    .slice(0, starSearchCandidateCap(compiledGoal.searchBudget));
}

function evaluateStarGoalTrait(traitId, recommendation = {}) {
  const model = recommendation?.previewPayload?.starCalc || {};
  const activity = recommendation?.previewPayload?.activityModel?.activity || {};
  const metallicityFeH = toFiniteNumber(
    model.inputs?.metallicityFeH ?? recommendation?.applyPayload?.objectInputs?.metallicityFeH,
    NaN,
  );
  const maxAgeGyr = toFiniteNumber(model.maxAgeGyr, NaN);
  const luminosityLsol = toFiniteNumber(model.luminosityLsol, NaN);
  const energeticFlareRatePerDay = toFiniteNumber(activity.energeticFlareRatePerDay, NaN);
  const giantPlanetProbability = toFiniteNumber(model.giantPlanetProbability, NaN);
  const evolutionMode = String(
    recommendation?.applyPayload?.objectInputs?.evolutionMode ||
      model.inputs?.evolutionMode ||
      "zams",
  );

  switch (traitId) {
    case "earthlike-life-possible":
      return normalizeText(model.earthLikeLifePossible) === "yes";
    case "main-sequence":
      return evolutionMode !== "evolved";
    case "long-main-sequence-lifetime":
      return Number.isFinite(maxAgeGyr) && maxAgeGyr >= 8;
    case "high-luminosity":
      return Number.isFinite(luminosityLsol) && luminosityLsol >= 3;
    case "low-flare-rate":
      return Number.isFinite(energeticFlareRatePerDay) && energeticFlareRatePerDay <= 0.5;
    case "high-giant-planet-probability":
      return Number.isFinite(giantPlanetProbability) && giantPlanetProbability >= 0.1;
    case "solar-metallicity":
      return Number.isFinite(metallicityFeH) && Math.abs(metallicityFeH) <= 0.15;
    case "high-flare-rate":
      return Number.isFinite(energeticFlareRatePerDay) && energeticFlareRatePerDay > 1;
    case "very-short-lifetime":
      return Number.isFinite(maxAgeGyr) && maxAgeGyr < 3;
    case "post-main-sequence":
      return evolutionMode === "evolved";
    default:
      return false;
  }
}

function scoreStarGoalRecommendation(compiledGoal = {}, recommendation = {}, context = {}) {
  const evaluationPlan = compiledGoal?.evaluationPlan || {};
  const matchedRequired = [];
  const missingRequired = [];
  const matchedPreferred = [];
  const triggeredAvoid = [];
  let score = 0;

  for (const entry of evaluationPlan.hardConstraints || []) {
    if (evaluateStarGoalTrait(entry.traitId, recommendation)) {
      matchedRequired.push(entry.traitId);
      score += 6;
    } else {
      missingRequired.push(entry.traitId);
      score -= 10;
    }
  }

  for (const entry of evaluationPlan.preferredTraits || []) {
    if (evaluateStarGoalTrait(entry.traitId, recommendation)) {
      matchedPreferred.push(entry.traitId);
      score += Number(entry.weight) || 1;
    }
  }

  for (const entry of evaluationPlan.avoidTraits || []) {
    if (evaluateStarGoalTrait(entry.traitId, recommendation)) {
      triggeredAvoid.push(entry.traitId);
      score -= Number(entry.penalty) || 1;
    }
  }

  const currentMass = toFiniteNumber(context?.currentInputs?.massMsol, NaN);
  const nextMass = toFiniteNumber(recommendation?.applyPayload?.objectInputs?.massMsol, NaN);
  const massPenalty =
    Number.isFinite(currentMass) && currentMass > 0 && Number.isFinite(nextMass)
      ? Math.min(Math.abs(nextMass - currentMass) / currentMass, 2)
      : 0;
  score -= (Number(evaluationPlan.contextDeviationWeight) || 1) * massPenalty;

  const currentAge = toFiniteNumber(context?.currentInputs?.ageGyr, NaN);
  const nextAge = toFiniteNumber(recommendation?.applyPayload?.objectInputs?.ageGyr, NaN);
  const agePenalty =
    Number.isFinite(currentAge) && currentAge > 0 && Number.isFinite(nextAge)
      ? Math.min(Math.abs(nextAge - currentAge) / currentAge, 2)
      : 0;
  score -= (Number(evaluationPlan.orbitDeviationWeight) || 1) * agePenalty;

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

function buildStarGoalSearchDiagnostics(compiledGoal = {}, scoring = {}, searchMeta = {}) {
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
    `Best seeded fit came from ${searchMeta.seedLabel || "a stellar archetype"} after trying ${searchMeta.candidatesTried || 0} candidate paths.`,
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
      "Treat this as a strong starting point, then refine the Star page inputs if you need a tighter fit.",
    ],
  );
  return diagnostics;
}

async function startStarGoalSearch(compiledGoal = null, flowState = {}, context = {}, job = {}) {
  if (!compiledGoal?.goalTemplateId) {
    return {
      recommendation: null,
      terminationReason: "missing-goal-template",
    };
  }

  const template = getGoalTemplate("star", compiledGoal.goalTemplateId);
  const candidates = buildStarGoalSearchCandidates(compiledGoal);
  let bestResult = null;
  let tried = 0;

  for (const candidate of candidates) {
    job?.throwIfCanceled?.();
    await Promise.resolve();

    const archetype = getStarArchetype(candidate.archetypeId);
    const recommendation = solveStarRecommendationFromArchetype(
      archetype,
      { ...flowState, uxMode: "guided" },
      context,
      candidate.answers,
    );
    if (!recommendation) continue;
    tried += 1;

    const scoring = scoreStarGoalRecommendation(compiledGoal, recommendation, context);
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
      confidenceClass: getStarGoalTemplateMeta(compiledGoal.goalTemplateId).confidenceClass,
      summary:
        `${template?.summary || bestResult.recommendation.summary} ` +
        `Seeded from ${bestResult.seedLabel}.`,
      diagnostics: [
        ...buildStarGoalSearchDiagnostics(compiledGoal, bestResult.scoring, {
          seedLabel: bestResult.seedLabel,
          candidatesTried: tried,
        }),
        ...(bestResult.recommendation.diagnostics || []),
      ],
      rationale: [
        `Goal search tried ${tried} seeded stellar paths and selected ${bestResult.seedLabel}.`,
        ...(bestResult.recommendation.rationale || []),
      ],
      nextActions: [
        ...(bestResult.recommendation.nextActions || []),
        "Re-run the search after changing traits or search scope if you want a different trade-off.",
      ],
      goalTemplateId: compiledGoal.goalTemplateId,
      fitClass: bestResult.scoring.fitClass,
    },
    terminationReason:
      bestResult.scoring.fitClass === "exact-match" ? "goal-fit-exact" : "goal-fit-near-miss",
  };
}

export const starGuidedAdapter = {
  objectType: "star",

  listArchetypes(_context = {}, flowState = {}) {
    if (flowState?.uxMode === "guided") return listStarGoalTemplateCards();
    return STAR_GUIDED_ARCHETYPES.map((entry) => ({ ...entry }));
  },

  buildQuestions(flowState, context = {}) {
    if (flowState?.uxMode === "guided" && flowState?.selectedGoalTemplateId) {
      return buildStarGoalQuestions(flowState, context);
    }
    const archetype = getStarArchetype(flowState?.selectedArchetypeId);
    if (!archetype || flowState?.uxMode !== "guided") return [];
    return buildStarQuestions(archetype, context);
  },

  compileGoal(flowState) {
    if (!flowState?.selectedGoalTemplateId) {
      return {
        valid: false,
        diagnostics: [
          {
            severity: "blocked",
            code: "missing-goal-template",
            title: "Choose a stellar goal",
            detail: "Pick a stellar goal template before compiling the search target.",
          },
        ],
      };
    }
    return compileGuidedGoal(buildStarGoalCompileInput(flowState));
  },

  solveRecommendation(flowState, context = {}) {
    const archetype = getStarArchetype(flowState?.selectedArchetypeId);
    return solveStarRecommendationFromArchetype(archetype, flowState, context);
  },

  startSearch(compiledGoal, flowState, context, job) {
    return startStarGoalSearch(compiledGoal, flowState, context, job);
  },

  applyRecommendation(recommendation, storeContext = {}) {
    if (!recommendation?.applyPayload?.objectInputs) return null;
    if (typeof storeContext.applyStarRecommendation === "function") {
      return storeContext.applyStarRecommendation(recommendation);
    }
    if (typeof storeContext.applyStarInputs === "function") {
      return storeContext.applyStarInputs(recommendation.applyPayload.objectInputs, recommendation);
    }
    return recommendation.applyPayload;
  },
};

export function registerStarGuidedAdapter(options = {}) {
  return registerGuidedAdapter(starGuidedAdapter, options);
}

export function ensureStarGuidedAdapterRegistered() {
  return getGuidedAdapter("star") || registerStarGuidedAdapter();
}

export { STAR_GUIDED_ARCHETYPES, getStarArchetype };
