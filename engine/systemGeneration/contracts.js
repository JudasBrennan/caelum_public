function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export const RANDOM_SYSTEM_GENERATOR_VERSION = "v2";

export const TOPOLOGY_SCOPE_OPTIONS = Object.freeze([
  {
    value: "single-only",
    label: "Single only",
    description: "Only generate a single-star home system.",
  },
  {
    value: "binary-allowed",
    label: "Binary allowed",
    description: "Allow either a single star or a binary system.",
  },
  {
    value: "triple-allowed",
    label: "Triple allowed",
    description: "Allow single, binary, or triple systems.",
  },
  {
    value: "quad-allowed",
    label: "Quad allowed",
    description: "Allow single through quad systems, including paired quads.",
  },
  {
    value: "any-hierarchical",
    label: "Any hierarchical",
    description: "Allow any supported hierarchical topology from single to quad.",
  },
]);

export const HOMEWORLD_POLICY_OPTIONS = Object.freeze([
  {
    value: "guarantee-temperate-rocky",
    label: "Guarantee temperate rocky",
    description: "Prefer a temperate rocky homeworld and block if one cannot be defended.",
  },
  {
    value: "allow-any-rocky",
    label: "Allow any rocky",
    description: "Require a rocky homeworld candidate, but not necessarily a temperate one.",
  },
  {
    value: "no-homeworld-guarantee",
    label: "No guarantee",
    description: "Do not require a homeworld candidate during generation.",
  },
]);

export const MULTISTAR_BIAS_OPTIONS = Object.freeze([
  {
    value: "prefer-single",
    label: "Prefer single",
    description: "Bias toward the simplest single-star systems when scope allows it.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Keep single and multistar outcomes reasonably mixed within the allowed scope.",
  },
  {
    value: "prefer-multistar",
    label: "Prefer multistar",
    description: "Bias toward binaries, triples, and quads when scope allows them.",
  },
]);

export const NAMING_STYLE_OPTIONS = Object.freeze([
  {
    value: "mixed",
    label: "Mixed curated",
    description: "Blend mythic and clean scientific-style names.",
  },
  {
    value: "mythic",
    label: "Mythic / classic",
    description: "Bias toward classical, poetic, and mythic-sounding names.",
  },
  {
    value: "scientific",
    label: "Scientific / clean",
    description: "Bias toward cleaner modern and survey-like names.",
  },
  {
    value: "regal",
    label: "Regal / courtly",
    description: "Bias toward stately, ceremonial, and courtly-sounding names.",
  },
  {
    value: "frontier",
    label: "Frontier / rugged",
    description: "Bias toward survey-era, frontier, and hard-edged names.",
  },
]);

export const REROLL_MODE_OPTIONS = Object.freeze([
  {
    value: "fresh-draft",
    label: "Fresh draft",
    description: "Generate a complete new home-system draft from scratch.",
  },
  {
    value: "reroll-names-only",
    label: "Reroll names only",
    description:
      "Keep the current system layout and bodies, but reseed star, planet, and moon names.",
  },
  {
    value: "keep-stars-reroll-planets",
    label: "Keep stars, reroll planets",
    description:
      "Preserve the current stellar topology and regenerate planets, giants, moons, and debris.",
  },
  {
    value: "keep-planets-reroll-moons",
    label: "Keep planets, reroll moons",
    description: "Preserve the current stars and primary worlds, but regenerate the moon systems.",
  },
]);

export const GOAL_TEMPLATE_CATALOG = Object.freeze({
  none: {
    id: "none",
    label: "Custom / none",
    description: "No forced generator goal. Use the profile and topology controls directly.",
    requestOverrides: {},
    forcedTopologyRecipeId: null,
    preferredHomeworldFrameKind: null,
  },
  "habitable-single": {
    id: "habitable-single",
    label: "Habitable single",
    description: "Prefer a stable, single-star system with a defended temperate rocky homeworld.",
    requestOverrides: {
      systemProfile: "balanced",
      topologyScope: "single-only",
      homeworldPolicy: "guarantee-temperate-rocky",
      multistarBias: "prefer-single",
    },
    forcedTopologyRecipeId: "single",
    preferredHomeworldFrameKind: "star",
  },
  "wide-binary-s-type-homeworld": {
    id: "wide-binary-s-type-homeworld",
    label: "Wide binary S-type homeworld",
    description:
      "Target a wide binary where the defended homeworld orbits one star rather than the pair barycentre.",
    requestOverrides: {
      systemProfile: "balanced",
      topologyScope: "binary-allowed",
      homeworldPolicy: "guarantee-temperate-rocky",
      multistarBias: "prefer-multistar",
    },
    forcedTopologyRecipeId: "wide-binary",
    preferredHomeworldFrameKind: "star",
  },
  "circumbinary-homeworld": {
    id: "circumbinary-homeworld",
    label: "Circumbinary homeworld",
    description: "Target a close binary with a defended homeworld orbiting the pair barycentre.",
    requestOverrides: {
      systemProfile: "balanced",
      topologyScope: "binary-allowed",
      homeworldPolicy: "guarantee-temperate-rocky",
      multistarBias: "prefer-multistar",
    },
    forcedTopologyRecipeId: "close-binary",
    preferredHomeworldFrameKind: "pair",
  },
  "gas-giant-rich-outer-system": {
    id: "gas-giant-rich-outer-system",
    label: "Gas-giant-rich outer system",
    description:
      "Bias toward wide outer architecture with multiple giants and defended outer spacing.",
    requestOverrides: {
      systemProfile: "gas-giant-rich",
      topologyScope: "any-hierarchical",
      homeworldPolicy: "allow-any-rocky",
      multistarBias: "balanced",
    },
    forcedTopologyRecipeId: null,
    preferredHomeworldFrameKind: null,
  },
  "moon-rich-giant-system": {
    id: "moon-rich-giant-system",
    label: "Moon-rich giant system",
    description: "Bias toward giant-planet parents and heavier moon budgets.",
    requestOverrides: {
      systemProfile: "moon-rich",
      topologyScope: "any-hierarchical",
      homeworldPolicy: "allow-any-rocky",
      multistarBias: "balanced",
    },
    forcedTopologyRecipeId: null,
    preferredHomeworldFrameKind: null,
  },
});

export const GOAL_TEMPLATE_OPTIONS = Object.freeze(
  Object.values(GOAL_TEMPLATE_CATALOG).map((entry) => ({
    value: entry.id,
    label: entry.label,
    description: entry.description,
  })),
);

export const SYSTEM_PROFILE_CATALOG = Object.freeze({
  balanced: {
    id: "balanced",
    label: "Balanced",
    summary: "General-purpose system with a moderate mix of rocky worlds and giants.",
    confidenceClass: "defensible",
    ladderBias: "balanced",
    rockyRange: [3, 5],
    giantRange: [1, 2],
    moonRange: [1, 4],
    debrisRange: [1, 1],
  },
  "rocky-rich": {
    id: "rocky-rich",
    label: "Rocky Rich",
    summary: "Bias toward more rocky planets and a lighter outer giant presence.",
    confidenceClass: "defensible",
    ladderBias: "compact",
    rockyRange: [4, 6],
    giantRange: [0, 1],
    moonRange: [0, 2],
    debrisRange: [0, 1],
  },
  "gas-giant-rich": {
    id: "gas-giant-rich",
    label: "Gas-Giant Rich",
    summary: "Bias toward multiple giants, wider outer spacing, and more moon opportunities.",
    confidenceClass: "plausible",
    ladderBias: "spacious",
    rockyRange: [1, 3],
    giantRange: [2, 3],
    moonRange: [3, 7],
    debrisRange: [1, 2],
  },
  "moon-rich": {
    id: "moon-rich",
    label: "Moon Rich",
    summary: "Bias toward giant parents and more populated moon systems.",
    confidenceClass: "plausible",
    ladderBias: "balanced",
    rockyRange: [2, 4],
    giantRange: [1, 2],
    moonRange: [4, 8],
    debrisRange: [1, 1],
  },
  compact: {
    id: "compact",
    label: "Compact",
    summary: "Bias toward tighter inner spacing and a denser inner system.",
    confidenceClass: "plausible",
    ladderBias: "compact",
    rockyRange: [2, 4],
    giantRange: [0, 1],
    moonRange: [1, 3],
    debrisRange: [0, 1],
  },
  spacious: {
    id: "spacious",
    label: "Spacious",
    summary: "Bias toward a wider orbit ladder and a roomier outer system.",
    confidenceClass: "plausible",
    ladderBias: "spacious",
    rockyRange: [3, 5],
    giantRange: [1, 2],
    moonRange: [2, 5],
    debrisRange: [1, 2],
  },
});

export const SYSTEM_PROFILE_OPTIONS = Object.freeze(
  Object.values(SYSTEM_PROFILE_CATALOG).map((entry) => ({
    value: entry.id,
    label: entry.label,
    description: entry.summary,
  })),
);

export function getSystemProfileConfig(profileId = "balanced") {
  return SYSTEM_PROFILE_CATALOG[normalizeText(profileId)] || SYSTEM_PROFILE_CATALOG.balanced;
}

export function getRandomSystemGoalTemplate(goalTemplateId = "none") {
  return GOAL_TEMPLATE_CATALOG[normalizeText(goalTemplateId)] || GOAL_TEMPLATE_CATALOG.none;
}

export function normalizeRandomSystemSeed(seed) {
  if (seed == null || seed === "") return "104729";
  const trimmed = String(seed).trim();
  return trimmed || "104729";
}

export function normalizeRandomSystemRequest(raw = {}) {
  const profileId = normalizeText(raw.systemProfile || raw.profile || raw.selectedArchetypeId);
  const topologyScope = normalizeText(raw.topologyScope);
  const homeworldPolicy = normalizeText(raw.homeworldPolicy);
  const multistarBias = normalizeText(raw.multistarBias);
  const namingStyle = normalizeText(raw.namingStyle);
  const rerollMode = normalizeText(raw.rerollMode || raw.generationMode || raw.strategy);
  const goalTemplateId = normalizeText(raw.goalTemplateId || raw.goalTemplate || raw.goal);
  const goalTemplate = getRandomSystemGoalTemplate(goalTemplateId);
  const normalizedProfileId = SYSTEM_PROFILE_CATALOG[profileId] ? profileId : "balanced";
  const normalizedTopologyScope = TOPOLOGY_SCOPE_OPTIONS.some(
    (entry) => entry.value === topologyScope,
  )
    ? topologyScope
    : "any-hierarchical";
  const normalizedHomeworldPolicy = HOMEWORLD_POLICY_OPTIONS.some(
    (entry) => entry.value === homeworldPolicy,
  )
    ? homeworldPolicy
    : "guarantee-temperate-rocky";
  const normalizedMultistarBias = MULTISTAR_BIAS_OPTIONS.some(
    (entry) => entry.value === multistarBias,
  )
    ? multistarBias
    : "balanced";
  const normalizedNamingStyle = NAMING_STYLE_OPTIONS.some((entry) => entry.value === namingStyle)
    ? namingStyle
    : "mixed";
  const normalizedRerollMode = REROLL_MODE_OPTIONS.some((entry) => entry.value === rerollMode)
    ? rerollMode
    : "fresh-draft";
  const templateOverrides =
    goalTemplate?.requestOverrides && typeof goalTemplate.requestOverrides === "object"
      ? goalTemplate.requestOverrides
      : {};
  const preserveSelectedHomeworldDetails =
    raw?.preserveSelectedHomeworldDetails != null
      ? Boolean(raw.preserveSelectedHomeworldDetails)
      : raw?.preserveHomeworldDetails != null
        ? Boolean(raw.preserveHomeworldDetails)
        : true;
  const resolvedSystemProfile =
    raw?.systemProfile != null || raw?.profile != null
      ? normalizedProfileId
      : templateOverrides.systemProfile || normalizedProfileId;
  const resolvedTopologyScope =
    raw?.topologyScope != null
      ? normalizedTopologyScope
      : templateOverrides.topologyScope || normalizedTopologyScope;
  const resolvedHomeworldPolicy =
    raw?.homeworldPolicy != null
      ? normalizedHomeworldPolicy
      : templateOverrides.homeworldPolicy || normalizedHomeworldPolicy;
  const resolvedMultistarBias =
    raw?.multistarBias != null
      ? normalizedMultistarBias
      : templateOverrides.multistarBias || normalizedMultistarBias;

  return {
    seed: normalizeRandomSystemSeed(raw.seed),
    systemProfile: resolvedSystemProfile,
    topologyScope: resolvedTopologyScope,
    homeworldPolicy: resolvedHomeworldPolicy,
    multistarBias: resolvedMultistarBias,
    namingStyle: normalizedNamingStyle,
    rerollMode: normalizedRerollMode,
    goalTemplateId: goalTemplate.id,
    goalTemplateLabel: goalTemplate.label,
    forcedTopologyRecipeId: goalTemplate.forcedTopologyRecipeId || null,
    preferredHomeworldFrameKind: goalTemplate.preferredHomeworldFrameKind || null,
    preserveSelectedHomeworldDetails,
  };
}

export function buildSystemBodyTargets(request, rng) {
  const profile = getSystemProfileConfig(request?.systemProfile);
  const pickCount = (range) => {
    const lo = Number(range?.[0] || 0);
    const hi = Number(range?.[1] || lo);
    return typeof rng?.int === "function" ? rng.int(lo, hi) : lo;
  };

  const rockyCount = pickCount(profile.rockyRange);
  const gasGiantCount = pickCount(profile.giantRange);
  const moonBudget = pickCount(profile.moonRange);
  const debrisCount = pickCount(profile.debrisRange);
  const requireTemperateHomeworld = request?.homeworldPolicy === "guarantee-temperate-rocky";
  const requireRockyHomeworld =
    requireTemperateHomeworld || request?.homeworldPolicy === "allow-any-rocky";

  return {
    systemProfile: profile.id,
    ladderBias: profile.ladderBias,
    rockyCount: Math.max(0, rockyCount),
    gasGiantCount: Math.max(0, gasGiantCount),
    moonBudget: Math.max(0, moonBudget),
    debrisCount: Math.max(0, debrisCount),
    requireTemperateHomeworld,
    requireRockyHomeworld,
  };
}

export function buildRandomSystemDraftEnvelope({
  request,
  generationMeta,
  draftWorld,
  preview,
  diagnostics = [],
  fitClass = "exact-match",
} = {}) {
  return {
    request: normalizeRandomSystemRequest(request),
    generationMeta: {
      generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
      ...(generationMeta || {}),
    },
    draftWorld: draftWorld && typeof draftWorld === "object" ? draftWorld : null,
    preview: preview && typeof preview === "object" ? preview : {},
    diagnostics: Array.isArray(diagnostics) ? diagnostics : [],
    fitClass:
      fitClass === "blocked" ? "blocked" : fitClass === "near-miss" ? "near-miss" : "exact-match",
  };
}
