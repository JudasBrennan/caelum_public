import { clamp } from "../utils.js";
import {
  buildStarPresetApplyInputs,
  getStarArchetype,
} from "../../ui/guidedCreation/adapters/star.js";
import { projectPrimaryStarFromStellarSystem } from "../../ui/store/stellarSystemModel.js";

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

const STAR_ARCHETYPE_WEIGHTS = Object.freeze({
  guaranteed: [
    { value: "orange-k-dwarf-star", weight: 5 },
    { value: "sunlike-g-star", weight: 5 },
    { value: "quiet-red-dwarf-star", weight: 2 },
    { value: "warm-f-star", weight: 1 },
  ],
  permissive: [
    { value: "quiet-red-dwarf-star", weight: 3 },
    { value: "orange-k-dwarf-star", weight: 4 },
    { value: "sunlike-g-star", weight: 4 },
    { value: "warm-f-star", weight: 2 },
    { value: "active-red-dwarf-star", weight: 1 },
    { value: "bright-a-star", weight: 1 },
    { value: "aging-subgiant-star", weight: 1 },
  ],
});

export const TOPOLOGY_RECIPES = Object.freeze({
  single: { id: "single", topologyKind: "single", quadLayoutKind: null, label: "Single star" },
  "wide-binary": {
    id: "wide-binary",
    topologyKind: "binary",
    quadLayoutKind: null,
    label: "Wide binary",
  },
  "close-binary": {
    id: "close-binary",
    topologyKind: "binary",
    quadLayoutKind: null,
    label: "Close circumbinary",
  },
  triple: { id: "triple", topologyKind: "triple", quadLayoutKind: null, label: "Triple" },
  "quad-chain": {
    id: "quad-chain",
    topologyKind: "quad",
    quadLayoutKind: "chain",
    label: "Chained quad",
  },
  "quad-paired": {
    id: "quad-paired",
    topologyKind: "quad",
    quadLayoutKind: "paired",
    label: "Paired quad",
  },
});

function buildWeightedTopologyList(request = {}, primary = null) {
  const scope = normalizeText(request.topologyScope);
  const bias = normalizeText(request.multistarBias);
  const requireTemperate = request.homeworldPolicy === "guarantee-temperate-rocky";
  const weights = [];
  const primaryMass = Number(primary?.inputs?.massMsol ?? primary?.massMsol ?? 1);
  const goalTemplateId = normalizeText(request.goalTemplateId);

  function push(id, weight) {
    if (!(weight > 0)) return;
    weights.push({ value: TOPOLOGY_RECIPES[id], weight });
  }

  if (request?.forcedTopologyRecipeId && TOPOLOGY_RECIPES[request.forcedTopologyRecipeId]) {
    return [{ value: TOPOLOGY_RECIPES[request.forcedTopologyRecipeId], weight: 1 }];
  }

  const singleWeight = bias === "prefer-multistar" ? 1 : bias === "prefer-single" ? 8 : 4;
  const multistarWeight = bias === "prefer-multistar" ? 6 : bias === "prefer-single" ? 1.5 : 3;
  let closeBinaryWeight = requireTemperate ? multistarWeight * 0.7 : multistarWeight;
  let wideBinaryWeight = multistarWeight * 1.2;
  let tripleWeight = multistarWeight;
  let quadWeight = requireTemperate ? multistarWeight * 0.7 : multistarWeight * 0.9;
  let adjustedSingleWeight = singleWeight;

  // Low-mass primaries skew toward simpler, quieter hierarchies.
  if (primaryMass <= 0.62) {
    adjustedSingleWeight *= 1.2;
    wideBinaryWeight *= 1.08;
    closeBinaryWeight *= 0.88;
    tripleWeight *= 0.82;
    quadWeight *= 0.76;
  }

  // Higher-mass primaries tolerate roomier, more stratified outcomes.
  if (primaryMass >= 1.22) {
    adjustedSingleWeight *= 0.88;
    wideBinaryWeight *= 1.1;
    closeBinaryWeight *= request?.homeworldPolicy === "guarantee-temperate-rocky" ? 0.9 : 1.05;
    tripleWeight *= 1.1;
    quadWeight *= 1.16;
  }

  if (goalTemplateId === "gas-giant-rich-outer-system") {
    wideBinaryWeight *= 1.12;
    tripleWeight *= 1.08;
    quadWeight *= 1.1;
  } else if (goalTemplateId === "moon-rich-giant-system") {
    closeBinaryWeight *= 1.06;
    tripleWeight *= 1.06;
  }

  push("single", adjustedSingleWeight);
  if (scope !== "single-only") {
    push("wide-binary", wideBinaryWeight);
    push("close-binary", closeBinaryWeight);
  }
  if (scope === "triple-allowed" || scope === "quad-allowed" || scope === "any-hierarchical") {
    push("triple", tripleWeight);
  }
  if (scope === "quad-allowed" || scope === "any-hierarchical") {
    push("quad-chain", quadWeight);
    push("quad-paired", quadWeight);
  }

  return weights;
}

function buildStarComponent(id, name, massMsol, primaryInputs) {
  return {
    id,
    name,
    massMsol: clamp(Number(massMsol), 0.08, 100),
    physicsMode: "simple",
    advancedDerivationMode: "rl",
    radiusRsolOverride: null,
    luminosityLsolOverride: null,
    tempKOverride: null,
    evolutionMode:
      primaryInputs?.evolutionMode === "zams" ||
      primaryInputs?.evolutionMode === "staticMainSequence"
        ? "zams"
        : "evolved",
    activityModelVersion: primaryInputs?.activityModelVersion === "v1" ? "v1" : "v2",
  };
}

function buildPair(id, childA, childB, values) {
  return {
    id,
    childA,
    childB,
    semiMajorAxisAu: values.semiMajorAxisAu,
    eccentricity: values.eccentricity,
    inclinationDeg: 0,
    argPeriapsisDeg: values.argPeriapsisDeg,
    meanAnomalyDeg: values.meanAnomalyDeg,
  };
}

function companionMass(primaryMass, baseFactor, spread, rng) {
  const factor = baseFactor + rng.range(-spread, spread);
  return clamp(primaryMass * factor, 0.08, Math.max(0.12, primaryMass * 1.25));
}

function pickPrimaryArchetypeId(request, rng) {
  const bucket =
    request?.homeworldPolicy === "guarantee-temperate-rocky" ? "guaranteed" : "permissive";
  return rng.pickWeighted(STAR_ARCHETYPE_WEIGHTS[bucket], "sunlike-g-star");
}

function buildPrimaryInputs(request, rng) {
  const archetypeId = pickPrimaryArchetypeId(request, rng);
  const archetype = getStarArchetype(archetypeId) || getStarArchetype("sunlike-g-star");
  const inputs = buildStarPresetApplyInputs(archetype?.apply || {}, {});
  const metallicityBias =
    request?.systemProfile === "gas-giant-rich"
      ? rng.range(0.05, 0.25)
      : request?.systemProfile === "rocky-rich"
        ? rng.range(-0.1, 0.15)
        : rng.range(-0.08, 0.18);
  inputs.ageGyr = Math.max(0.3, Number(inputs.ageGyr || 4.6) * rng.range(0.8, 1.2));
  inputs.metallicityFeH = clamp(Number(inputs.metallicityFeH || 0) + metallicityBias, -0.6, 0.5);
  return {
    archetypeId,
    archetypeLabel: archetype?.label || "Sun-like",
    inputs,
  };
}

function buildSingleSystem(primaryInputs) {
  const stellarSystem = {
    topologyKind: "single",
    shared: {
      ageGyr: primaryInputs.ageGyr,
      metallicityFeH: primaryInputs.metallicityFeH,
    },
    stars: {
      order: ["star_a"],
      byId: {
        star_a: buildStarComponent("star_a", "Primary", primaryInputs.massMsol, primaryInputs),
      },
    },
    pairs: { order: [], byId: {} },
    rootNodeId: "star_a",
    defaultHostFrameId: "star_a",
  };
  return { stellarSystem, recipeId: "single", quadLayoutKind: null };
}

function buildBinarySystem(primaryInputs, rng, { close = false } = {}) {
  const primaryMass = Number(primaryInputs.massMsol || 1);
  const stellarSystem = {
    topologyKind: "binary",
    shared: {
      ageGyr: primaryInputs.ageGyr,
      metallicityFeH: primaryInputs.metallicityFeH,
    },
    stars: {
      order: ["star_a", "star_b"],
      byId: {
        star_a: buildStarComponent("star_a", "Primary A", primaryMass, primaryInputs),
        star_b: buildStarComponent(
          "star_b",
          "Companion B",
          companionMass(primaryMass, close ? 0.88 : 0.72, close ? 0.08 : 0.18, rng),
          primaryInputs,
        ),
      },
    },
    pairs: {
      order: ["pair_ab"],
      byId: {
        pair_ab: buildPair(
          "pair_ab",
          { kind: "star", id: "star_a" },
          { kind: "star", id: "star_b" },
          {
            semiMajorAxisAu: close ? rng.range(0.18, 0.42) : rng.range(18, 36),
            eccentricity: close ? rng.range(0.02, 0.1) : rng.range(0.06, 0.22),
            argPeriapsisDeg: rng.range(0, 360),
            meanAnomalyDeg: rng.range(0, 360),
          },
        ),
      },
    },
    rootNodeId: "pair_ab",
    defaultHostFrameId: close ? "pair_ab" : "star_a",
  };
  return {
    stellarSystem,
    recipeId: close ? "close-binary" : "wide-binary",
    quadLayoutKind: null,
  };
}

function buildTripleSystem(primaryInputs, rng) {
  const primaryMass = Number(primaryInputs.massMsol || 1);
  return {
    stellarSystem: {
      topologyKind: "triple",
      shared: {
        ageGyr: primaryInputs.ageGyr,
        metallicityFeH: primaryInputs.metallicityFeH,
      },
      stars: {
        order: ["star_a", "star_b", "star_c"],
        byId: {
          star_a: buildStarComponent("star_a", "Primary A", primaryMass, primaryInputs),
          star_b: buildStarComponent(
            "star_b",
            "Companion B",
            companionMass(primaryMass, 0.7, 0.16, rng),
            primaryInputs,
          ),
          star_c: buildStarComponent(
            "star_c",
            "Companion C",
            companionMass(primaryMass, 0.44, 0.18, rng),
            primaryInputs,
          ),
        },
      },
      pairs: {
        order: ["pair_ab", "pair_abc"],
        byId: {
          pair_ab: buildPair(
            "pair_ab",
            { kind: "star", id: "star_a" },
            { kind: "star", id: "star_b" },
            {
              semiMajorAxisAu: rng.range(10, 24),
              eccentricity: rng.range(0.04, 0.18),
              argPeriapsisDeg: rng.range(0, 360),
              meanAnomalyDeg: rng.range(0, 360),
            },
          ),
          pair_abc: buildPair(
            "pair_abc",
            { kind: "pair", id: "pair_ab" },
            { kind: "star", id: "star_c" },
            {
              semiMajorAxisAu: rng.range(150, 320),
              eccentricity: rng.range(0.03, 0.16),
              argPeriapsisDeg: rng.range(0, 360),
              meanAnomalyDeg: rng.range(0, 360),
            },
          ),
        },
      },
      rootNodeId: "pair_abc",
      defaultHostFrameId: rng.bool(0.25) ? "pair_ab" : "star_a",
    },
    recipeId: "triple",
    quadLayoutKind: null,
  };
}

function buildQuadChainSystem(primaryInputs, rng) {
  const primaryMass = Number(primaryInputs.massMsol || 1);
  return {
    stellarSystem: {
      topologyKind: "quad",
      shared: {
        ageGyr: primaryInputs.ageGyr,
        metallicityFeH: primaryInputs.metallicityFeH,
      },
      stars: {
        order: ["star_a", "star_b", "star_c", "star_d"],
        byId: {
          star_a: buildStarComponent("star_a", "Primary A", primaryMass, primaryInputs),
          star_b: buildStarComponent(
            "star_b",
            "Companion B",
            companionMass(primaryMass, 0.68, 0.14, rng),
            primaryInputs,
          ),
          star_c: buildStarComponent(
            "star_c",
            "Companion C",
            companionMass(primaryMass, 0.46, 0.16, rng),
            primaryInputs,
          ),
          star_d: buildStarComponent(
            "star_d",
            "Companion D",
            companionMass(primaryMass, 0.3, 0.16, rng),
            primaryInputs,
          ),
        },
      },
      pairs: {
        order: ["pair_ab", "pair_abc", "pair_abcd"],
        byId: {
          pair_ab: buildPair(
            "pair_ab",
            { kind: "star", id: "star_a" },
            { kind: "star", id: "star_b" },
            {
              semiMajorAxisAu: rng.range(10, 20),
              eccentricity: rng.range(0.03, 0.15),
              argPeriapsisDeg: rng.range(0, 360),
              meanAnomalyDeg: rng.range(0, 360),
            },
          ),
          pair_abc: buildPair(
            "pair_abc",
            { kind: "pair", id: "pair_ab" },
            { kind: "star", id: "star_c" },
            {
              semiMajorAxisAu: rng.range(140, 260),
              eccentricity: rng.range(0.04, 0.16),
              argPeriapsisDeg: rng.range(0, 360),
              meanAnomalyDeg: rng.range(0, 360),
            },
          ),
          pair_abcd: buildPair(
            "pair_abcd",
            { kind: "pair", id: "pair_abc" },
            { kind: "star", id: "star_d" },
            {
              semiMajorAxisAu: rng.range(760, 1200),
              eccentricity: rng.range(0.04, 0.18),
              argPeriapsisDeg: rng.range(0, 360),
              meanAnomalyDeg: rng.range(0, 360),
            },
          ),
        },
      },
      rootNodeId: "pair_abcd",
      defaultHostFrameId: rng.bool(0.2) ? "pair_ab" : "star_a",
    },
    recipeId: "quad-chain",
    quadLayoutKind: "chain",
  };
}

function buildQuadPairedSystem(primaryInputs, rng) {
  const primaryMass = Number(primaryInputs.massMsol || 1);
  return {
    stellarSystem: {
      topologyKind: "quad",
      shared: {
        ageGyr: primaryInputs.ageGyr,
        metallicityFeH: primaryInputs.metallicityFeH,
      },
      stars: {
        order: ["star_a", "star_b", "star_c", "star_d"],
        byId: {
          star_a: buildStarComponent("star_a", "Primary A", primaryMass, primaryInputs),
          star_b: buildStarComponent(
            "star_b",
            "Companion B",
            companionMass(primaryMass, 0.7, 0.12, rng),
            primaryInputs,
          ),
          star_c: buildStarComponent(
            "star_c",
            "Companion C",
            companionMass(primaryMass, 0.62, 0.12, rng),
            primaryInputs,
          ),
          star_d: buildStarComponent(
            "star_d",
            "Companion D",
            companionMass(primaryMass, 0.46, 0.12, rng),
            primaryInputs,
          ),
        },
      },
      pairs: {
        order: ["pair_ab", "pair_cd", "pair_root"],
        byId: {
          pair_ab: buildPair(
            "pair_ab",
            { kind: "star", id: "star_a" },
            { kind: "star", id: "star_b" },
            {
              semiMajorAxisAu: rng.range(12, 22),
              eccentricity: rng.range(0.03, 0.12),
              argPeriapsisDeg: rng.range(0, 360),
              meanAnomalyDeg: rng.range(0, 360),
            },
          ),
          pair_cd: buildPair(
            "pair_cd",
            { kind: "star", id: "star_c" },
            { kind: "star", id: "star_d" },
            {
              semiMajorAxisAu: rng.range(120, 180),
              eccentricity: rng.range(0.02, 0.1),
              argPeriapsisDeg: rng.range(0, 360),
              meanAnomalyDeg: rng.range(0, 360),
            },
          ),
          pair_root: buildPair(
            "pair_root",
            { kind: "pair", id: "pair_ab" },
            { kind: "pair", id: "pair_cd" },
            {
              semiMajorAxisAu: rng.range(820, 1200),
              eccentricity: rng.range(0.04, 0.16),
              argPeriapsisDeg: rng.range(0, 360),
              meanAnomalyDeg: rng.range(0, 360),
            },
          ),
        },
      },
      rootNodeId: "pair_root",
      defaultHostFrameId: rng.bool(0.45) ? "pair_root" : "pair_ab",
    },
    recipeId: "quad-paired",
    quadLayoutKind: "paired",
  };
}

export function pickTopologyRecipe(request, rng, primary = null) {
  const weighted = buildWeightedTopologyList(request, primary);
  return rng.pickWeighted(weighted, TOPOLOGY_RECIPES.single);
}

export function buildTopologyDraft(request, rng) {
  const primary = buildPrimaryInputs(request, rng.fork("primary"));
  const recipe = pickTopologyRecipe(request, rng.fork("topology"), primary);

  let topologyResult = null;
  switch (recipe?.id) {
    case "wide-binary":
      topologyResult = buildBinarySystem(primary.inputs, rng.fork("wide-binary"), {
        close: false,
      });
      break;
    case "close-binary":
      topologyResult = buildBinarySystem(primary.inputs, rng.fork("close-binary"), {
        close: true,
      });
      break;
    case "triple":
      topologyResult = buildTripleSystem(primary.inputs, rng.fork("triple"));
      break;
    case "quad-chain":
      topologyResult = buildQuadChainSystem(primary.inputs, rng.fork("quad-chain"));
      break;
    case "quad-paired":
      topologyResult = buildQuadPairedSystem(primary.inputs, rng.fork("quad-paired"));
      break;
    case "single":
    default:
      topologyResult = buildSingleSystem(primary.inputs);
      break;
  }

  return {
    ...topologyResult,
    primaryArchetypeId: primary.archetypeId,
    primaryArchetypeLabel: primary.archetypeLabel,
    primaryInputs: primary.inputs,
    star: projectPrimaryStarFromStellarSystem(topologyResult.stellarSystem, primary.inputs),
  };
}
