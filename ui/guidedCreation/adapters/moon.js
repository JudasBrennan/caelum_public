import { normalizeMoonInputs } from "../../../engine/moon/config.js";
import { fmt } from "../../../engine/utils.js";
import { MOON_RECIPES } from "../../moonStyles.js";
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

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
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
    description: "Blocks recommendations that the current host context does not support.",
  },
  {
    value: "guided-patch",
    label: "Allow host fixes",
    description:
      "Applies recommended host-context adjustments when the current parent is a poor fit.",
  },
  {
    value: "flexible",
    label: "Best-effort fit",
    description: "Keeps a starting point even if the current host context is hostile.",
  },
];

const WATER_STATE_OPTIONS = {
  dry: {
    value: "dry",
    label: "Dry",
    description: "Bias toward little or no accessible water.",
  },
  subsurface: {
    value: "subsurface",
    label: "Buried Ocean",
    description: "Prefer water under an ice shell rather than exposed seas.",
  },
  surface: {
    value: "surface",
    label: "Surface Ocean",
    description: "Target exposed surface liquid water where the host context allows it.",
  },
};

const ATMOSPHERE_TARGET_OPTIONS = {
  airless: {
    value: "airless",
    label: "Airless",
    description: "Prefer an airless or exosphere-level result.",
  },
  thin: {
    value: "thin",
    label: "Thin",
    description: "Allow only a tenuous near-surface atmosphere.",
  },
  substantial: {
    value: "substantial",
    label: "Substantial",
    description: "Target a persistent volatile atmosphere.",
  },
  dense: {
    value: "dense",
    label: "Dense / Hazy",
    description: "Target a thicker volatile atmosphere with more haze or clouds.",
  },
};

const ACTIVITY_TARGET_OPTIONS = {
  quiet: {
    value: "quiet",
    label: "Quiet",
    description: "Minimize tidal forcing and resurfacing where possible.",
  },
  moderate: {
    value: "moderate",
    label: "Moderate",
    description: "Allow some internal activity without pushing to extremes.",
  },
  active: {
    value: "active",
    label: "Active",
    description: "Bias toward stronger volcanism, cryovolcanism, or tidal support.",
  },
};

const RESONANCE_SUPPORT_OPTIONS = {
  "not-needed": {
    value: "not-needed",
    label: "Not needed",
    description: "Do not depend on sibling-moon resonance support.",
  },
  preferred: {
    value: "preferred",
    label: "Preferred",
    description: "Use resonance support when it improves the target moon type.",
  },
  required: {
    value: "required",
    label: "Required",
    description: "Treat sustained resonance support as part of the target.",
  },
};

const LIFE_GOAL_OPTIONS = {
  sterile: {
    value: "sterile",
    label: "Sterile",
    description: "No surface biology target.",
  },
  microbial: {
    value: "microbial",
    label: "Microbial",
    description: "Bias toward conservative surface or near-surface biology support.",
  },
  "surface-biosphere": {
    value: "surface-biosphere",
    label: "Surface Biosphere",
    description: "Push for a stronger exposed biosphere where defensible.",
  },
};

const LAND_EXPOSURE_OPTIONS = {
  archipelago: {
    value: "archipelago",
    label: "Archipelago",
    description: "Bias toward more exposed land and island chains.",
  },
  balanced: {
    value: "balanced",
    label: "Balanced",
    description: "Target a mix of ocean and exposed land.",
  },
  oceanic: {
    value: "oceanic",
    label: "Oceanic",
    description: "Allow global or near-global surface ocean coverage.",
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
        "Use the current star and parent as a hard constraint or as a best-effort fit.",
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
      help: "Choose whether this moon should stay dry, hide water below ice, or expose surface seas.",
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
      help: "Bias the recommendation toward the kind of atmosphere you want to defend.",
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
      help: "Controls how strongly the guided result leans on tidal or internal activity.",
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
      help: "Use this when the target moon type depends on sibling-moon resonance forcing.",
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
      help: "Choose how conservative or ambitious the exposed-biology target should be.",
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
      help: "Tune how much exposed land you want on surface-ocean cases.",
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

function tuneMoonApplyInputs(archetype, recipe, answers) {
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
  const wantsSurfaceHabitability =
    answers.water_state === "surface" || (answers.life_goal && answers.life_goal !== "sterile");
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

export const moonGuidedAdapter = {
  objectType: "moon",

  listArchetypes() {
    return MOON_GUIDED_ARCHETYPES.map((entry) => ({ ...entry }));
  },

  buildQuestions(flowState, context = {}) {
    const archetype = getMoonArchetype(flowState?.selectedArchetypeId);
    if (!archetype || flowState?.uxMode !== "guided") return [];
    return buildMoonQuestions(archetype, context);
  },

  solveRecommendation(flowState, context = {}) {
    const archetype = getMoonArchetype(flowState?.selectedArchetypeId);
    if (!archetype) return null;

    const recipe = getRecipeForArchetype(archetype.id, context);
    if (!recipe) return null;

    const answers = resolveMoonGuidedAnswers(archetype, flowState);
    const applyInputs =
      flowState?.uxMode === "guided"
        ? tuneMoonApplyInputs(archetype, recipe, answers)
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
            error instanceof Error
              ? error.message
              : "Moon quick-type solve failed for this context.",
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
