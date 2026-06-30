import { calcStar } from "../../../engine/star.js";
import { buildTopologyGuardrailSummary } from "../../../engine/homeSystem/stability.js";
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
    description:
      "Keeps luminosity, radius, and spectral behavior close to the current stellar phase while retuning within that regime.",
  },
  {
    value: "main-sequence",
    label: "Main sequence",
    description:
      "Pushes toward steadier hydrogen-burning outputs, usually with a calmer long-lived habitable-zone baseline.",
  },
  {
    value: "evolving",
    label: "Evolving star",
    description:
      "Pushes toward brighter, larger, shorter-lived post-main-sequence behavior and a moving habitable zone.",
  },
]);

const ACTIVITY_TARGET_OPTIONS = Object.freeze([
  {
    value: "quiet",
    label: "Quiet",
    description:
      "Biases toward lower flare and CME activity, usually by favoring older or calmer stellar states.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description:
      "Keeps activity near the archetype baseline so the recommendation does not lean too hard toward either extreme.",
  },
  {
    value: "active",
    label: "Active",
    description:
      "Biases toward younger or flare-richer states, raising the chance of strong activity and harsher radiation outputs.",
  },
]);

const METALLICITY_TARGET_OPTIONS = Object.freeze([
  {
    value: "metal-poor",
    label: "Metal-poor",
    description:
      "Pushes the star toward a lower heavy-element content, usually reducing giant-planet bias and disk richness.",
  },
  {
    value: "solar",
    label: "Solar-ish",
    description:
      "Keeps composition near solar, which usually preserves a familiar disk-star baseline and giant-planet odds.",
  },
  {
    value: "metal-rich",
    label: "Metal-rich",
    description:
      "Pushes toward a heavier-element-rich disk-star profile, usually increasing giant-planet probability.",
  },
]);

const SYSTEM_GOAL_OPTIONS = Object.freeze([
  {
    value: "earthlike-window",
    label: "Earth-like window",
    description:
      "Favors stars with calmer, more temperate outputs that better support an Earth-like habitable-zone window.",
  },
  {
    value: "long-lived-stability",
    label: "Long-lived",
    description:
      "Favors lower-drift, longer-lived stellar states even if they are dimmer or less dramatic.",
  },
  {
    value: "bright-short-lived",
    label: "Bright and short-lived",
    description:
      "Accepts hotter, more luminous short-lived outputs even when they weaken long-term habitability.",
  },
]);

const SYSTEM_ARCHITECTURE_OPTIONS = Object.freeze([
  {
    value: "keep-current",
    label: "Keep current layout",
    description:
      "Preserves the current home-system topology, so the star retune happens inside the existing host-frame and canvas structure.",
  },
  {
    value: "single-star",
    label: "Single star",
    description:
      "Collapses to one host star, removing companion flux and extra host frames for the simplest downstream orbit and visualizer behavior.",
  },
  {
    value: "wide-binary",
    label: "Wide S-type binary",
    description:
      "Adds a wide companion and keeps new worlds around one star by default, which usually preserves readable host-frame views and mild companion forcing.",
  },
  {
    value: "close-circumbinary",
    label: "Close circumbinary",
    description:
      "Builds a tight binary with Pair A+B as the default host, so new planets orbit the barycenter and the sky/poster can show two primary suns.",
  },
  {
    value: "hierarchical-triple",
    label: "Hierarchical triple",
    description:
      "Builds the constrained ((A+B)+C) layout, adding an outer star, more host-frame choices, and tertiary flux/stability context.",
  },
  {
    value: "hierarchical-quad",
    label: "Hierarchical quad",
    description:
      "Builds the constrained (((A+B)+C)+D) layout, maximizing host-frame count and overview-canvas complexity while staying tree-shaped.",
  },
  {
    value: "paired-quad",
    label: "Paired quad",
    description:
      "Builds the constrained (A+B)+(C+D) layout, keeping two inner binaries under a shared outer barycentre so overview and host-frame choices stay explicit.",
  },
]);

const GOAL_PRIORITY_OPTIONS = Object.freeze([
  {
    value: "maximize-realism",
    label: "Maximize realism",
    description:
      "Keeps the fit conservative and penalizes aggressive shifts away from the current stellar context.",
  },
  {
    value: "maximize-habitability",
    label: "Maximize habitability",
    description:
      "Accepts bigger retunes if they produce calmer activity and a friendlier habitable-zone window.",
  },
  {
    value: "preserve-current-system",
    label: "Preserve current system",
    description:
      "Keeps mass, age, and metallicity closer to the current star even if the goal match is weaker.",
  },
  {
    value: "preserve-current-orbit-context",
    label: "Preserve current phase",
    description:
      "Strongly resists changes that would move the star into a different evolution regime.",
  },
]);

const GOAL_ALLOWED_EDIT_OPTIONS = Object.freeze([
  {
    value: "edit-object-only",
    label: "Star only",
    description:
      "Only star inputs move, so results stay local but may miss goals that need broader retuning.",
  },
  {
    value: "edit-object-plus-host",
    label: "Star + host context",
    description:
      "Allows wider stellar retunes while still treating the current system framing as the baseline.",
  },
  {
    value: "edit-object-plus-local-system",
    label: "Star + local system",
    description:
      "Allows the broadest seeded search, increasing the chance of a closer fit at the cost of larger changes.",
  },
]);

const GOAL_SEARCH_BUDGET_OPTIONS = Object.freeze([
  {
    value: "fast",
    label: "Fast",
    description:
      "Tries only a few seeded candidates, so it returns quickly but can miss a better stellar fit.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description:
      "Tries a moderate number of seeded candidates and is the default trade-off between speed and fit quality.",
  },
  {
    value: "deep",
    label: "Deep",
    description:
      "Tries the broadest seeded search, which takes longer but is more likely to find a closer match.",
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

function normalizeSystemArchitecture(value) {
  switch (normalizeText(value)) {
    case "single-star":
      return "single-star";
    case "wide-binary":
      return "wide-binary";
    case "close-circumbinary":
      return "close-circumbinary";
    case "hierarchical-triple":
      return "hierarchical-triple";
    case "hierarchical-quad":
      return "hierarchical-quad";
    case "paired-hierarchical-quad":
    case "paired-quad":
      return "paired-quad";
    case "keep-current":
    default:
      return "keep-current";
  }
}

function currentTopologyLabel(topologyKind = "") {
  switch (String(topologyKind || "").trim()) {
    case "binary":
      return "Binary";
    case "triple":
      return "Triple";
    case "quad":
      return "Quad";
    case "single":
    default:
      return "Single";
  }
}

function hostFrameLabel(hostFrameId = "") {
  switch (String(hostFrameId || "").trim()) {
    case "star_b":
      return "Star B";
    case "star_c":
      return "Star C";
    case "star_d":
      return "Star D";
    case "pair_ab":
      return "Pair A+B";
    case "pair_cd":
      return "Pair C+D";
    case "pair_abc":
      return "Pair (A+B)+C";
    case "pair_abcd":
      return "Pair ((A+B)+C)+D";
    case "pair_root":
      return "Pair (A+B)+(C+D)";
    case "star_a":
    default:
      return "Star A";
  }
}

function systemArchitectureLabel(selection = "", context = {}) {
  switch (normalizeSystemArchitecture(selection)) {
    case "single-star":
      return "Single star";
    case "wide-binary":
      return "Wide S-type binary";
    case "close-circumbinary":
      return "Close circumbinary pair";
    case "hierarchical-triple":
      return "Hierarchical triple";
    case "hierarchical-quad":
      return "Hierarchical quad";
    case "paired-quad":
      return "Paired quad";
    case "keep-current":
    default:
      return context?.currentTopologyKind
        ? `Keep current (${currentTopologyLabel(context.currentTopologyKind)})`
        : "Keep current layout";
  }
}

function systemArchitectureImpact(selection = "") {
  switch (normalizeSystemArchitecture(selection)) {
    case "single-star":
      return "Likely impact: removes companion forcing, collapses back to one host frame, and keeps the visualizer in the simplest single-star layout.";
    case "wide-binary":
      return "Likely impact: new planets default to one star, companion light is usually secondary, and the large canvases stay in readable host-frame mode.";
    case "close-circumbinary":
      return "Likely impact: new planets default to Pair A+B, the circumbinary stability floor moves outward, and sky/poster views show two primary suns.";
    case "hierarchical-triple":
      return "Likely impact: adds a tertiary star, extra host frames, and outer-star flux/stability context without leaving the constrained hierarchy.";
    case "hierarchical-quad":
      return "Likely impact: adds the full constrained four-star hierarchy, which gives the richest overview views but also the busiest topology.";
    case "paired-quad":
      return "Likely impact: builds two inner binaries under a shared root pair, adding peer circumbinary frames and a clearer whole-system overview for four-star layouts.";
    case "keep-current":
    default:
      return "Likely impact: preserves the current topology and host-frame structure while retuning the primary star.";
  }
}

function normalizeBaseStarStem(name = "") {
  const raw = String(name || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "Star";
  return raw.replace(/\s+[ABCD]$/i, "").trim() || raw;
}

function namedCompanion(baseName = "", suffix = "B") {
  const stem = normalizeBaseStarStem(baseName);
  return `${stem} ${suffix}`.trim();
}

function resolveSystemArchitectureSelection(flowState = {}, answers = {}) {
  const directAnswer = normalizeText(answers?.system_architecture);
  if (directAnswer) return normalizeSystemArchitecture(directAnswer);
  const goalDraftAnswer = normalizeText(flowState?.goalDraft?.systemArchitecture);
  if (goalDraftAnswer) return normalizeSystemArchitecture(goalDraftAnswer);
  return "keep-current";
}

function buildStarSystemPreset(selection = "", context = {}, applyInputs = {}) {
  const normalized = normalizeSystemArchitecture(selection);
  const primaryMass = clamp(
    Number(applyInputs?.massMsol ?? context?.currentInputs?.massMsol ?? 1),
    0.08,
    100,
  );
  const baseName = String(applyInputs?.name || context?.currentStarName || "Star");
  const previewFor = (label, defaultHostFrameId, companionSummary, impact, systemInputs = null) => {
    const hierarchyHealth =
      systemInputs && typeof systemInputs === "object"
        ? buildTopologyGuardrailSummary({
            topologyKind: systemInputs.topologyKind,
            quadLayoutKind: systemInputs.quadLayoutKind,
            primaryMassMsol: primaryMass,
            companionMassMsol: systemInputs.companionMassMsol,
            binarySemiMajorAxisAu: systemInputs.binarySemiMajorAxisAu,
            binaryEccentricity: systemInputs.binaryEccentricity,
            binaryInclinationDeg: systemInputs.binaryInclinationDeg,
            tertiaryMassMsol: systemInputs.tertiaryMassMsol,
            tripleOuterSemiMajorAxisAu: systemInputs.tripleOuterSemiMajorAxisAu,
            tripleOuterEccentricity: systemInputs.tripleOuterEccentricity,
            tripleOuterInclinationDeg: systemInputs.tripleOuterInclinationDeg,
            quaternaryMassMsol: systemInputs.quaternaryMassMsol,
            quadOuterSemiMajorAxisAu: systemInputs.quadOuterSemiMajorAxisAu,
            quadOuterEccentricity: systemInputs.quadOuterEccentricity,
            quadOuterInclinationDeg: systemInputs.quadOuterInclinationDeg,
            quadSecondarySemiMajorAxisAu: systemInputs.tripleOuterSemiMajorAxisAu,
            quadSecondaryEccentricity: systemInputs.tripleOuterEccentricity,
            quadSecondaryInclinationDeg: systemInputs.tripleOuterInclinationDeg,
          })
        : null;
    const impactText =
      hierarchyHealth?.layers?.length > 0
        ? `${impact} ${hierarchyHealth.headline}: ${hierarchyHealth.summary}`
        : impact;
    return {
      systemInputs,
      systemPreview: {
        label,
        defaultHostFrameLabel: hostFrameLabel(defaultHostFrameId),
        companionSummary,
        impact: impactText,
        hierarchyHealthLabel: hierarchyHealth?.headline || "",
        hierarchyHealthSummary: hierarchyHealth?.summary || "",
      },
    };
  };

  if (normalized === "keep-current") {
    const currentHostFrameId = String(context?.currentDefaultHostFrameId || "star_a");
    const currentTopology = currentTopologyLabel(context?.currentTopologyKind);
    const companionSummary =
      String(context?.currentTopologyKind || "single") === "single"
        ? "No new companions added."
        : "Existing companion and hierarchy settings are preserved.";
    return previewFor(
      `Keep current (${currentTopology})`,
      currentHostFrameId,
      companionSummary,
      "Likely impact: the current host-frame layout stays intact while only the stellar solve is retuned.",
      null,
    );
  }

  if (normalized === "single-star") {
    return previewFor(
      "Single star",
      "star_a",
      "No companion stars.",
      systemArchitectureImpact(normalized),
      {
        topologyKind: "single",
        defaultHostFrameId: "star_a",
      },
    );
  }

  if (normalized === "wide-binary") {
    const companionMassMsol = clamp(primaryMass * 0.74, 0.08, Math.max(primaryMass * 0.96, 0.12));
    const binarySemiMajorAxisAu = 28;
    const systemInputs = {
      topologyKind: "binary",
      defaultHostFrameId: "star_a",
      companionName: namedCompanion(baseName, "B"),
      companionMassMsol,
      binarySemiMajorAxisAu,
      binaryEccentricity: 0.16,
      binaryInclinationDeg: 0,
      binaryArgPeriapsisDeg: 38,
      binaryMeanAnomalyDeg: 112,
    };
    return previewFor(
      "Wide S-type binary",
      systemInputs.defaultHostFrameId,
      `${systemInputs.companionName} at ${fmt(binarySemiMajorAxisAu, 1)} AU | ${fmt(companionMassMsol, 2)} Msol`,
      systemArchitectureImpact(normalized),
      systemInputs,
    );
  }

  if (normalized === "close-circumbinary") {
    const companionMassMsol = clamp(primaryMass * 0.86, 0.08, Math.max(primaryMass * 1.08, 0.12));
    const binarySemiMajorAxisAu = 0.28;
    const systemInputs = {
      topologyKind: "binary",
      defaultHostFrameId: "pair_ab",
      companionName: namedCompanion(baseName, "B"),
      companionMassMsol,
      binarySemiMajorAxisAu,
      binaryEccentricity: 0.07,
      binaryInclinationDeg: 0,
      binaryArgPeriapsisDeg: 24,
      binaryMeanAnomalyDeg: 86,
    };
    return previewFor(
      "Close circumbinary pair",
      systemInputs.defaultHostFrameId,
      `${systemInputs.companionName} at ${fmt(binarySemiMajorAxisAu, 2)} AU | ${fmt(companionMassMsol, 2)} Msol`,
      systemArchitectureImpact(normalized),
      systemInputs,
    );
  }

  if (normalized === "hierarchical-triple") {
    const companionMassMsol = clamp(primaryMass * 0.72, 0.08, Math.max(primaryMass * 0.94, 0.12));
    const tertiaryMassMsol = clamp(primaryMass * 0.46, 0.08, Math.max(primaryMass * 0.68, 0.12));
    const systemInputs = {
      topologyKind: "triple",
      defaultHostFrameId: "star_a",
      companionName: namedCompanion(baseName, "B"),
      companionMassMsol,
      binarySemiMajorAxisAu: 24,
      binaryEccentricity: 0.15,
      binaryInclinationDeg: 0,
      binaryArgPeriapsisDeg: 34,
      binaryMeanAnomalyDeg: 104,
      tertiaryName: namedCompanion(baseName, "C"),
      tertiaryMassMsol,
      tripleOuterSemiMajorAxisAu: 210,
      tripleOuterEccentricity: 0.19,
      tripleOuterInclinationDeg: 0,
      tripleOuterArgPeriapsisDeg: 58,
      tripleOuterMeanAnomalyDeg: 188,
    };
    return previewFor(
      "Hierarchical triple",
      systemInputs.defaultHostFrameId,
      `${systemInputs.companionName} at ${fmt(systemInputs.binarySemiMajorAxisAu, 0)} AU | ${systemInputs.tertiaryName} at ${fmt(systemInputs.tripleOuterSemiMajorAxisAu, 0)} AU`,
      systemArchitectureImpact(normalized),
      systemInputs,
    );
  }

  if (normalized === "paired-quad") {
    const companionMassMsol = clamp(primaryMass * 0.72, 0.08, Math.max(primaryMass * 0.94, 0.12));
    const tertiaryMassMsol = clamp(primaryMass * 0.64, 0.08, Math.max(primaryMass * 0.86, 0.12));
    const quaternaryMassMsol = clamp(primaryMass * 0.48, 0.08, Math.max(primaryMass * 0.72, 0.12));
    const systemInputs = {
      topologyKind: "quad",
      quadLayoutKind: "paired",
      defaultHostFrameId: "pair_root",
      companionName: namedCompanion(baseName, "B"),
      companionMassMsol,
      binarySemiMajorAxisAu: 16,
      binaryEccentricity: 0.08,
      binaryInclinationDeg: 0,
      binaryArgPeriapsisDeg: 22,
      binaryMeanAnomalyDeg: 90,
      tertiaryName: namedCompanion(baseName, "C"),
      tertiaryMassMsol,
      tripleOuterSemiMajorAxisAu: 140,
      tripleOuterEccentricity: 0.06,
      tripleOuterInclinationDeg: 0,
      tripleOuterArgPeriapsisDeg: 44,
      tripleOuterMeanAnomalyDeg: 156,
      quaternaryName: namedCompanion(baseName, "D"),
      quaternaryMassMsol,
      quadOuterSemiMajorAxisAu: 960,
      quadOuterEccentricity: 0.14,
      quadOuterInclinationDeg: 0,
      quadOuterArgPeriapsisDeg: 74,
      quadOuterMeanAnomalyDeg: 238,
    };
    return previewFor(
      "Paired quad",
      systemInputs.defaultHostFrameId,
      `Pair A+B at ${fmt(systemInputs.binarySemiMajorAxisAu, 0)} AU | Pair C+D at ${fmt(systemInputs.tripleOuterSemiMajorAxisAu, 0)} AU | root pair at ${fmt(systemInputs.quadOuterSemiMajorAxisAu, 0)} AU`,
      systemArchitectureImpact(normalized),
      systemInputs,
    );
  }

  const companionMassMsol = clamp(primaryMass * 0.7, 0.08, Math.max(primaryMass * 0.92, 0.12));
  const tertiaryMassMsol = clamp(primaryMass * 0.42, 0.08, Math.max(primaryMass * 0.62, 0.12));
  const quaternaryMassMsol = clamp(primaryMass * 0.28, 0.08, Math.max(primaryMass * 0.48, 0.12));
  const systemInputs = {
    topologyKind: "quad",
    defaultHostFrameId: "star_a",
    companionName: namedCompanion(baseName, "B"),
    companionMassMsol,
    binarySemiMajorAxisAu: 18,
    binaryEccentricity: 0.12,
    binaryInclinationDeg: 0,
    binaryArgPeriapsisDeg: 28,
    binaryMeanAnomalyDeg: 98,
    tertiaryName: namedCompanion(baseName, "C"),
    tertiaryMassMsol,
    tripleOuterSemiMajorAxisAu: 160,
    tripleOuterEccentricity: 0.18,
    tripleOuterInclinationDeg: 0,
    tripleOuterArgPeriapsisDeg: 54,
    tripleOuterMeanAnomalyDeg: 176,
    quaternaryName: namedCompanion(baseName, "D"),
    quaternaryMassMsol,
    quadOuterSemiMajorAxisAu: 780,
    quadOuterEccentricity: 0.22,
    quadOuterInclinationDeg: 0,
    quadOuterArgPeriapsisDeg: 72,
    quadOuterMeanAnomalyDeg: 244,
  };
  return previewFor(
    "Hierarchical quad",
    systemInputs.defaultHostFrameId,
    `${systemInputs.companionName}, ${systemInputs.tertiaryName}, and ${systemInputs.quaternaryName} extend the hierarchy outward.`,
    systemArchitectureImpact(normalized),
    systemInputs,
  );
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
    systemArchitecture: "keep-current",
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
    systemArchitecture: normalizeSystemArchitecture(
      goalDraft.systemArchitecture || base.systemArchitecture,
    ),
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
        "Sets the scoring bias for the search. Realism stays conservative, habitability accepts bigger retunes for calmer star outputs, and preserve-current stays nearer the current star.",
      defaultValue: draft.priority,
      options: GOAL_PRIORITY_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "allowedEdits",
      stepId: "stellar-context",
      kind: "choice",
      label: "Allowed edits",
      help: "Sets how far the search may move. Narrow scope mostly retunes this star; broader scope allows larger local-system shifts to hit the goal.",
      defaultValue: draft.allowedEdits,
      options: GOAL_ALLOWED_EDIT_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "searchBudget",
      stepId: "stellar-context",
      kind: "choice",
      label: "Search budget",
      help: "Sets how many seeded candidate paths the search tries. Deeper searches take longer but are more likely to find a closer fit.",
      defaultValue: draft.searchBudget,
      options: GOAL_SEARCH_BUDGET_OPTIONS.map((entry) => ({ ...entry })),
    },
    {
      id: "system_architecture",
      stepId: "stellar-context",
      kind: "choice",
      label: "System architecture",
      help: "Sets the target home-system layout. Keeping the current layout preserves the existing host-frame tree; switching layouts can also change which host frame new worlds default to and how the major canvases read.",
      defaultValue: draft.systemArchitecture,
      options: SYSTEM_ARCHITECTURE_OPTIONS.map((entry) => ({ ...entry })),
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
    systemArchitecture: draft.systemArchitecture,
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
        system_architecture: "keep-current",
      };
    case "quiet-red-dwarf-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "quiet",
        metallicity_target: "solar",
        system_goal: "long-lived-stability",
        system_architecture: "keep-current",
      };
    case "orange-k-dwarf-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "quiet",
        metallicity_target: "solar",
        system_goal: "earthlike-window",
        system_architecture: "keep-current",
      };
    case "sunlike-g-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "balanced",
        metallicity_target: "solar",
        system_goal: "earthlike-window",
        system_architecture: "keep-current",
      };
    case "warm-f-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "balanced",
        metallicity_target: "solar",
        system_goal: "earthlike-window",
        system_architecture: "keep-current",
      };
    case "bright-a-star":
      return {
        evolution_target: "main-sequence",
        activity_target: "active",
        metallicity_target: "solar",
        system_goal: "bright-short-lived",
        system_architecture: "keep-current",
      };
    case "aging-subgiant-star":
      return {
        evolution_target: "evolving",
        activity_target: "quiet",
        metallicity_target: "solar",
        system_goal: "bright-short-lived",
        system_architecture: "keep-current",
      };
    default:
      return {
        evolution_target: "main-sequence",
        activity_target: "balanced",
        metallicity_target: "solar",
        system_goal: "earthlike-window",
        system_architecture: "keep-current",
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
        "Controls the broad stellar phase. Keeping the current phase preserves the present regime; evolving pushes toward brighter, shorter-lived outputs.",
      options: EVOLUTION_TARGET_OPTIONS,
      defaultValue: defaults.evolution_target,
    },
    {
      id: "activity_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Activity Target",
      help: "Steers flare and CME activity. Quiet usually favors older calmer stars, while Active pushes toward harsher radiation behavior.",
      options: ACTIVITY_TARGET_OPTIONS,
      defaultValue: defaults.activity_target,
    },
    {
      id: "system_architecture",
      stepId: "stellar-context",
      kind: "choice",
      label: "System Architecture",
      help: "Sets the broader home-system layout. Keeping the current layout preserves the existing topology; the binary and hierarchical options preconfigure host frames and change how later canvases are likely to read.",
      options: SYSTEM_ARCHITECTURE_OPTIONS,
      defaultValue: defaults.system_architecture,
    },
    {
      id: "metallicity_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Metallicity Target",
      help: "Steers heavy-element abundance, which changes how disk-like the star feels and how strongly giant-planet probability is boosted.",
      options: METALLICITY_TARGET_OPTIONS,
      defaultValue: defaults.metallicity_target,
    },
    {
      id: "system_goal",
      stepId: "goal-details",
      kind: "choice",
      label: "System Goal",
      help: "Tells guided mode which system-level trade-off matters most: calmer habitable windows, long stable lifetimes, or brighter younger-star outputs.",
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
  targets.push(systemArchitectureLabel(answers.system_architecture));

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
  if (normalizeSystemArchitecture(answers.system_architecture) !== "keep-current") {
    rationale.push(systemArchitectureImpact(answers.system_architecture));
  } else if (String(context?.currentTopologyKind || "single") !== "single") {
    rationale.push(
      `The current ${currentTopologyLabel(context.currentTopologyKind).toLowerCase()} topology is preserved instead of collapsing back to a single-star layout.`,
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
  const lifecycle = model?.stellarLifecycle || null;
  const lifecycleStage =
    lifecycle?.currentSample?.stage || lifecycle?.summary?.currentStage || null;
  const lifecycleStageId = String(lifecycleStage?.id || "");
  const architectureLabel = systemArchitectureLabel(
    answers.system_architecture,
    flowState?.context,
  );

  pushDiagnostic(
    diagnostics,
    "info",
    "archetype-source",
    "Archetype-backed starting point",
    `This ${flowState?.uxMode === "guided" ? "guided flow" : "quick type"} maps to the ${archetype.label} stellar archetype.`,
    [],
  );

  pushDiagnostic(
    diagnostics,
    "info",
    "system-architecture",
    "System architecture target",
    `${flowState?.uxMode === "guided" ? "Guided search" : "Quick apply"} will use the ${architectureLabel} layout.`,
    [],
  );

  if (lifecycleStageId === "terminal_main_sequence" || Number(lifecycleStage?.progress) >= 0.92) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "near-terminal-main-sequence",
      "Star is near the end of core-hydrogen burning",
      `Lifecycle preview places the star in ${lifecycleStage?.label || "a late main-sequence stage"}.`,
      ["Review the lifecycle timeline after apply if long-term habitability matters."],
    );
  }

  if (
    lifecycleStageId &&
    lifecycleStageId !== "main_sequence" &&
    lifecycleStageId !== "terminal_main_sequence" &&
    !["white_dwarf", "neutron_star", "black_hole", "no_remnant"].includes(lifecycleStageId)
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "post-main-sequence-host",
      "Post-main-sequence host",
      `Lifecycle preview places the star in ${lifecycleStage?.label || "a post-main-sequence stage"}.`,
      ["Treat HZ results as temporary history context, not a stable Earth-like target."],
    );
  }

  if (["white_dwarf", "neutron_star", "black_hole", "no_remnant"].includes(lifecycleStageId)) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "compact-remnant-host",
      "Compact-remnant host",
      `Lifecycle preview reaches ${lifecycleStage?.label || "a compact-remnant stage"}.`,
      [
        "Caelum does not model accretion disks, relativistic effects, or remnant habitability in detail.",
      ],
    );
  }

  if (Number(model.maxAgeGyr) > 0 && Number(model.maxAgeGyr) < 1) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "short-lived-high-mass-host",
      "Short-lived high-mass star",
      `The main-sequence lifetime is only about ${fmt(model.maxAgeGyr, 2)} Gyr.`,
      ["Use this for dramatic young systems, not long-lived biosphere targets."],
    );
  }

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

  const seedAnswers = answersOverride || resolveStarGuidedAnswers(archetype, flowState);
  const answers = {
    ...seedAnswers,
    system_architecture: resolveSystemArchitectureSelection(flowState, seedAnswers),
  };
  const applyInputs =
    flowState?.uxMode === "guided"
      ? tuneStarApplyInputs(archetype, answers, context)
      : tuneStarApplyInputs(archetype, getStarGuidedDefaults(archetype.id), context);
  const systemPreset = buildStarSystemPreset(answers.system_architecture, context, applyInputs);

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
      systemInputs: systemPreset.systemInputs,
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
            systemPreview: systemPreset.systemPreview,
          }
        : {
            systemPreview: systemPreset.systemPreview,
          },
    diagnostics: buildStarDiagnostics(archetype, solved, answers, {
      ...flowState,
      context,
    }),
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
    if (!archetype) return [];
    if (flowState?.uxMode === "quick") {
      return [
        {
          id: "system_architecture",
          stepId: "stellar-context",
          kind: "choice",
          label: "System Architecture",
          help: "Optional quick layout target. This changes the home-system topology and default host frame without turning quick mode into a full guided search.",
          options: SYSTEM_ARCHITECTURE_OPTIONS.map((entry) => ({ ...entry })),
          defaultValue: resolveSystemArchitectureSelection(flowState, flowState?.answers),
        },
      ];
    }
    if (flowState?.uxMode !== "guided") return [];
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
