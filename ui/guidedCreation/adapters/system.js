import { generateRandomSystemDraft } from "../../../engine/systemGeneration/generateRandomSystemDraft.js";
import {
  GOAL_TEMPLATE_OPTIONS,
  REROLL_MODE_OPTIONS,
  getSystemProfileConfig,
  normalizeRandomSystemRequest,
  RANDOM_SYSTEM_GENERATOR_VERSION,
  SYSTEM_PROFILE_OPTIONS,
  TOPOLOGY_SCOPE_OPTIONS,
  HOMEWORLD_POLICY_OPTIONS,
  MULTISTAR_BIAS_OPTIONS,
  NAMING_STYLE_OPTIONS,
} from "../../../engine/systemGeneration/contracts.js";
import { buildGenerationModeLabel } from "../../../engine/systemGeneration/ambitiousDrafts.js";
import { getGuidedAdapter, registerGuidedAdapter } from "../registry.js";

function buildSystemArchetypes() {
  return SYSTEM_PROFILE_OPTIONS.map((entry) => {
    const config = getSystemProfileConfig(entry.value);
    return {
      id: entry.value,
      objectType: "system",
      label: entry.label,
      shortLabel: entry.label,
      summary: entry.description,
      confidenceClass: config.confidenceClass,
      quickEnabled: true,
      guidedEnabled: true,
      tags: [
        "random-system",
        config.ladderBias,
        `${config.rockyRange[0]}-${config.rockyRange[1]} rocky`,
      ],
    };
  });
}

function buildSystemQuestions(flowState = {}, context = {}) {
  const selectedProfile = String(
    flowState?.selectedArchetypeId || flowState?.selectedGoalTemplateId || "balanced",
  );
  const rerollMode = String(flowState?.answers?.rerollMode || "fresh-draft");
  const goalTemplateId = String(flowState?.answers?.goalTemplateId || "none");
  const currentWorld =
    typeof context?.getCurrentWorld === "function"
      ? context.getCurrentWorld()
      : context?.currentWorld;
  const hasSelectedPlanet = !!String(currentWorld?.planets?.selectedId || "").trim();
  return [
    {
      id: "seed",
      stepId: "generator",
      kind: "number",
      label: "Seed",
      help: "Fixed seed for repeatable system drafts. The same seed and options should reproduce the same draft.",
      defaultValue: 104729,
      min: 1,
      max: 999999999,
      step: 1,
    },
    {
      id: "rerollMode",
      stepId: "generator",
      kind: "choice",
      label: "Draft Strategy",
      help: "Choose whether to build a full new draft or preserve parts of the current world while rerolling specific layers.",
      defaultValue: "fresh-draft",
      options: REROLL_MODE_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "goalTemplateId",
      stepId: "generator",
      kind: "select",
      label: "Goal Template",
      help: "Templates steer topology and homeworld emphasis. Explicit profile choices still control the broad body mix.",
      defaultValue: "none",
      options: GOAL_TEMPLATE_OPTIONS.map((entry) => ({ ...entry })),
      visibleWhen: (state) =>
        String(state?.answers?.rerollMode || "fresh-draft") !== "reroll-names-only",
    },
    {
      id: "topologyScope",
      stepId: "generator",
      kind: "choice",
      label: "Topology Scope",
      help: "Controls the allowed star-count range for the generated home system.",
      defaultValue: "any-hierarchical",
      options: TOPOLOGY_SCOPE_OPTIONS.map((entry) => ({ ...entry })),
      visibleWhen: (state) => {
        const mode = String(state?.answers?.rerollMode || rerollMode);
        return mode !== "reroll-names-only" && mode !== "keep-planets-reroll-moons";
      },
    },
    {
      id: "homeworldPolicy",
      stepId: "generator",
      kind: "choice",
      label: "Homeworld Policy",
      help: "Controls how hard the generator must defend a rocky homeworld candidate before it can apply.",
      defaultValue: "guarantee-temperate-rocky",
      options: HOMEWORLD_POLICY_OPTIONS.map((entry) => ({ ...entry })),
      visibleWhen: (state) => {
        const mode = String(state?.answers?.rerollMode || rerollMode);
        return mode !== "reroll-names-only" && mode !== "keep-planets-reroll-moons";
      },
    },
    {
      id: "multistarBias",
      stepId: "generator",
      kind: "choice",
      label: "Multistar Bias",
      help: "Biases the topology picker toward single-star simplicity or richer multistar outcomes within the selected scope.",
      defaultValue: "balanced",
      options: MULTISTAR_BIAS_OPTIONS.map((entry) => ({ ...entry })),
      visibleWhen: (state) => {
        const mode = String(state?.answers?.rerollMode || rerollMode);
        return mode !== "reroll-names-only" && mode !== "keep-planets-reroll-moons";
      },
    },
    {
      id: "namingStyle",
      stepId: "generator",
      kind: "choice",
      label: "Naming Style",
      help: "Controls which curated naming pool the seeded picker uses for the generated stars, planets, and moons.",
      defaultValue: "mixed",
      options: NAMING_STYLE_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "preserveSelectedHomeworldDetails",
      stepId: "generator",
      kind: "toggle",
      label: "Preserve Selected Homeworld",
      help: "When possible, retain the currently selected rocky world and keep downstream homeworld detail pages in sync during a planet reroll.",
      defaultValue: true,
      placeholder: hasSelectedPlanet
        ? "Keep selected rocky world if its slot remains workable"
        : "No selected rocky world is available to preserve",
      visibleWhen: (state) =>
        String(state?.answers?.rerollMode || rerollMode) === "keep-stars-reroll-planets" &&
        hasSelectedPlanet,
    },
    {
      id: "systemProfile",
      stepId: "generator",
      kind: "select",
      label: "System Profile",
      help: "Profile controls the broad body mix and orbit-ladder bias before seeded slot allocation starts.",
      defaultValue: selectedProfile || "balanced",
      options: SYSTEM_PROFILE_OPTIONS.map((entry) => ({
        value: entry.value,
        label: entry.label,
        description: entry.description,
      })),
      visibleWhen: (state) =>
        String(state?.answers?.rerollMode || rerollMode) !== "reroll-names-only",
    },
  ];
}

function compileRequest(flowState = {}, context = {}) {
  const systemProfile = String(
    flowState?.answers?.systemProfile || flowState?.selectedArchetypeId || "balanced",
  );
  const currentWorld =
    typeof context?.getCurrentWorld === "function"
      ? context.getCurrentWorld()
      : context?.currentWorld;
  const rerollMode = String(flowState?.answers?.rerollMode || "fresh-draft");
  const request = normalizeRandomSystemRequest({
    seed: flowState?.answers?.seed,
    systemProfile,
    rerollMode,
    goalTemplateId: flowState?.answers?.goalTemplateId,
    topologyScope: flowState?.answers?.topologyScope,
    homeworldPolicy: flowState?.answers?.homeworldPolicy,
    multistarBias: flowState?.answers?.multistarBias,
    namingStyle: flowState?.answers?.namingStyle,
    preserveSelectedHomeworldDetails: flowState?.answers?.preserveSelectedHomeworldDetails,
  });
  const diagnostics = [];
  if (rerollMode === "keep-planets-reroll-moons") {
    const hasParentBodies =
      (Array.isArray(currentWorld?.system?.gasGiants?.order) &&
        currentWorld.system.gasGiants.order.length > 0) ||
      (Array.isArray(currentWorld?.planets?.order) && currentWorld.planets.order.length > 0);
    if (!hasParentBodies) {
      diagnostics.push({
        severity: "warning",
        code: "moon-reroll-without-preserved-parents",
        title: "Moon reroll has no preserved parent worlds",
        detail:
          "The current world has no preserved planets or gas giants, so the regenerated moon pass may stay empty.",
      });
    }
  }
  return {
    valid: true,
    compiledGoal: {
      objectType: "system",
      archetypeId: systemProfile,
      goalDraft: request,
      answers: { ...(flowState?.answers || {}) },
    },
    diagnostics,
    searchStatus: "ready",
  };
}

function buildRecommendationFromDraft(draftEnvelope) {
  const request = normalizeRandomSystemRequest(draftEnvelope?.request || {});
  const profile = getSystemProfileConfig(request.systemProfile);
  const preview = draftEnvelope?.preview || {};
  const diagnostics = Array.isArray(draftEnvelope?.diagnostics) ? draftEnvelope.diagnostics : [];
  const generationModeLabel =
    draftEnvelope?.generationMeta?.generationModeLabel ||
    buildGenerationModeLabel(request.rerollMode);
  const title =
    request?.rerollMode === "fresh-draft"
      ? `${profile.label} Random System`
      : `${generationModeLabel} Draft`;
  const countSummary = preview?.counts
    ? `${preview.counts.rockyPlanets || 0} rocky, ${preview.counts.gasGiants || 0} giants, ${preview.counts.moons || 0} moons`
    : "Seeded draft ready";
  const topologyLabel =
    preview?.topologyLabel || draftEnvelope?.generationMeta?.topologyKind || "system";

  const rationale = [
    `Generator version ${RANDOM_SYSTEM_GENERATOR_VERSION} used the ${profile.label} profile.`,
    `Topology scope was ${request.topologyScope} with ${request.multistarBias} multistar bias.`,
    request.goalTemplateId !== "none"
      ? `Goal template: ${request.goalTemplateLabel || request.goalTemplateId}.`
      : "",
  ].filter(Boolean);

  return {
    objectType: "system",
    archetypeId: request.systemProfile,
    confidenceClass: profile.confidenceClass,
    title,
    summary:
      `Seed ${request.seed} produced a ${String(topologyLabel).toLowerCase()} draft with ${countSummary}. ` +
      `${generationModeLabel}.`,
    scienceModeRecommendation: {},
    applyPayload: {
      objectInputs: {},
      systemInputs: null,
      parentPatch: null,
      siblingPatch: null,
    },
    previewPayload: {
      draftEnvelope,
      preview,
      request,
    },
    diagnostics,
    rationale,
    nextActions: [
      "Apply the draft atomically to replace the current home system.",
      "Review the Star, System, Planet, and Visualizer pages after apply.",
    ],
    fitClass: draftEnvelope?.fitClass || "exact-match",
  };
}

export const systemGuidedAdapter = {
  objectType: "system",
  searchMode: "manual",

  listArchetypes() {
    return buildSystemArchetypes();
  },

  buildQuestions(flowState, context) {
    if (!(flowState?.selectedArchetypeId || flowState?.selectedGoalTemplateId)) return [];
    return buildSystemQuestions(flowState, context || {});
  },

  compileGoal(flowState, context) {
    return compileRequest(flowState, context);
  },

  solveRecommendation() {
    return null;
  },

  startSearch(compiledGoal, _state, context) {
    const request = normalizeRandomSystemRequest(compiledGoal?.goalDraft || {});
    const currentWorld =
      typeof context?.getCurrentWorld === "function"
        ? context.getCurrentWorld()
        : context?.currentWorld;
    const draftEnvelope = generateRandomSystemDraft(request, { currentWorld });
    return {
      recommendation: buildRecommendationFromDraft(draftEnvelope),
      terminationReason:
        draftEnvelope.fitClass === "exact-match" ? "draft-ready" : "draft-near-miss",
    };
  },

  applyRecommendation(recommendation, storeContext = {}) {
    const draftEnvelope = recommendation?.previewPayload?.draftEnvelope || null;
    if (!draftEnvelope) return null;
    if (typeof storeContext.applyGeneratedSystemDraft === "function") {
      return storeContext.applyGeneratedSystemDraft(draftEnvelope);
    }
    return draftEnvelope;
  },
};

export function registerSystemGuidedAdapter(options = {}) {
  return registerGuidedAdapter(systemGuidedAdapter, options);
}

export function ensureSystemGuidedAdapterRegistered() {
  return getGuidedAdapter("system") || registerSystemGuidedAdapter();
}
