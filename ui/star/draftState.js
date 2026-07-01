export function normalizeQuadLayoutKind(value, fallback = "chain") {
  if (value === "paired" || value === "chain") return value;
  return fallback === "paired" ? "paired" : "chain";
}

export function inferQuadLayoutKind(stellarSystem) {
  if (stellarSystem?.topologyKind !== "quad") return "chain";
  const pairsById = stellarSystem?.pairs?.byId || {};
  const rootPair = pairsById?.[stellarSystem?.rootNodeId] || null;
  if (pairsById.pair_ab && pairsById.pair_cd && pairsById.pair_root) return "paired";
  if (rootPair?.childA?.kind === "pair" && rootPair?.childB?.kind === "pair") return "paired";
  return "chain";
}

function finitePositiveNumber(value, fallback = null) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function buildFallbackStars(stellarSystem) {
  return {
    companionStar:
      stellarSystem?.stars?.byId?.star_b ||
      stellarSystem?.stars?.byId?.[stellarSystem?.stars?.order?.[1] || ""] ||
      null,
    tertiaryStar:
      stellarSystem?.stars?.byId?.star_c ||
      stellarSystem?.stars?.byId?.[stellarSystem?.stars?.order?.[2] || ""] ||
      null,
    quaternaryStar:
      stellarSystem?.stars?.byId?.star_d ||
      stellarSystem?.stars?.byId?.[stellarSystem?.stars?.order?.[3] || ""] ||
      null,
  };
}

function buildFallbackPairs(stellarSystem, quadLayoutKind) {
  return {
    binaryPair:
      stellarSystem?.pairs?.byId?.pair_ab ||
      stellarSystem?.pairs?.byId?.[stellarSystem?.pairs?.order?.[0] || ""] ||
      null,
    tertiaryPair:
      (quadLayoutKind === "paired"
        ? stellarSystem?.pairs?.byId?.pair_cd
        : stellarSystem?.pairs?.byId?.pair_abc) ||
      stellarSystem?.pairs?.byId?.[stellarSystem?.pairs?.order?.[1] || ""] ||
      null,
    quaternaryPair:
      (quadLayoutKind === "paired"
        ? stellarSystem?.pairs?.byId?.pair_root
        : stellarSystem?.pairs?.byId?.pair_abcd) ||
      stellarSystem?.pairs?.byId?.[stellarSystem?.pairs?.order?.[2] || ""] ||
      null,
  };
}

export function buildStarEditorFieldMap(defaults = {}) {
  return {
    star_a: {
      title: "Primary Star A",
      role: "Primary star",
      nameField: "name",
      massField: "massMsol",
      radiusField: "radiusRsolOverride",
      luminosityField: "luminosityLsolOverride",
      tempField: "tempKOverride",
      physicsModeField: "physicsMode",
      derivationField: "advancedDerivationMode",
      defaultName: defaults.name || "Star",
      defaultMass: finitePositiveNumber(defaults.massMsol, 1),
    },
    star_b: {
      title: "Star B",
      role: "Companion star",
      nameField: "companionName",
      massField: "companionMassMsol",
      radiusField: "companionRadiusRsolOverride",
      luminosityField: "companionLuminosityLsolOverride",
      tempField: "companionTempKOverride",
      physicsModeField: "companionPhysicsMode",
      derivationField: "companionAdvancedDerivationMode",
      defaultName: "Companion",
      defaultMass: 0.72,
    },
    star_c: {
      title: "Star C",
      role: "Tertiary star",
      nameField: "tertiaryName",
      massField: "tertiaryMassMsol",
      radiusField: "tertiaryRadiusRsolOverride",
      luminosityField: "tertiaryLuminosityLsolOverride",
      tempField: "tertiaryTempKOverride",
      physicsModeField: "tertiaryPhysicsMode",
      derivationField: "tertiaryAdvancedDerivationMode",
      defaultName: "Tertiary",
      defaultMass: 0.54,
    },
    star_d: {
      title: "Star D",
      role: "Quaternary star",
      nameField: "quaternaryName",
      massField: "quaternaryMassMsol",
      radiusField: "quaternaryRadiusRsolOverride",
      luminosityField: "quaternaryLuminosityLsolOverride",
      tempField: "quaternaryTempKOverride",
      physicsModeField: "quaternaryPhysicsMode",
      derivationField: "quaternaryAdvancedDerivationMode",
      defaultName: "Quaternary",
      defaultMass: 0.33,
    },
  };
}

export function createInitialStarDraftState({
  defaults = {},
  primaryStar = null,
  stellarSystem = null,
} = {}) {
  const quadLayoutKind = inferQuadLayoutKind(stellarSystem);
  const { companionStar, tertiaryStar, quaternaryStar } = buildFallbackStars(stellarSystem);
  const { binaryPair, tertiaryPair, quaternaryPair } = buildFallbackPairs(
    stellarSystem,
    quadLayoutKind,
  );

  return {
    name:
      typeof primaryStar?.name === "string" && primaryStar.name.trim()
        ? primaryStar.name.trim()
        : defaults.name || "Star",
    massMsol: finiteNumber(primaryStar?.massMsol, finiteNumber(defaults.massMsol, 1)),
    ageGyr: finiteNumber(primaryStar?.ageGyr, finiteNumber(defaults.ageGyr, 0)),
    metallicityFeH: finiteNumber(primaryStar?.metallicityFeH, 0),
    radiusRsolOverride: finitePositiveNumber(primaryStar?.radiusRsolOverride),
    luminosityLsolOverride: finitePositiveNumber(primaryStar?.luminosityLsolOverride),
    tempKOverride: finitePositiveNumber(primaryStar?.tempKOverride),
    physicsMode:
      primaryStar?.physicsMode === "advanced" || primaryStar?.physicsMode === "simple"
        ? primaryStar.physicsMode
        : "simple",
    advancedDerivationMode: ["rl", "rt", "lt"].includes(primaryStar?.advancedDerivationMode)
      ? primaryStar.advancedDerivationMode
      : "rl",
    evolutionMode:
      primaryStar?.evolutionMode === "zams" || primaryStar?.evolutionMode === "staticMainSequence"
        ? "zams"
        : "evolved",
    activityModelVersion: primaryStar?.activityModelVersion === "v1" ? "v1" : "v2",
    topologyKind: ["binary", "triple", "quad"].includes(stellarSystem?.topologyKind)
      ? stellarSystem.topologyKind
      : "single",
    quadLayoutKind,
    defaultHostFrameId:
      typeof stellarSystem?.defaultHostFrameId === "string" && stellarSystem.defaultHostFrameId
        ? stellarSystem.defaultHostFrameId
        : "star_a",
    companionName:
      typeof companionStar?.name === "string" && companionStar.name.trim()
        ? companionStar.name.trim()
        : "Companion",
    companionMassMsol: finitePositiveNumber(companionStar?.massMsol, 0.72),
    companionRadiusRsolOverride: finitePositiveNumber(companionStar?.radiusRsolOverride),
    companionLuminosityLsolOverride: finitePositiveNumber(companionStar?.luminosityLsolOverride),
    companionTempKOverride: finitePositiveNumber(companionStar?.tempKOverride),
    companionPhysicsMode:
      companionStar?.physicsMode === "advanced" || companionStar?.physicsMode === "simple"
        ? companionStar.physicsMode
        : "simple",
    companionAdvancedDerivationMode: ["rl", "rt", "lt"].includes(
      companionStar?.advancedDerivationMode,
    )
      ? companionStar.advancedDerivationMode
      : "rl",
    binarySemiMajorAxisAu: finitePositiveNumber(binaryPair?.semiMajorAxisAu, 24),
    binaryEccentricity: finiteNumber(binaryPair?.eccentricity, 0.2),
    binaryInclinationDeg: finiteNumber(binaryPair?.inclinationDeg, 0),
    binaryArgPeriapsisDeg: finiteNumber(binaryPair?.argPeriapsisDeg, 0),
    binaryMeanAnomalyDeg: finiteNumber(binaryPair?.meanAnomalyDeg, 0),
    tertiaryName:
      typeof tertiaryStar?.name === "string" && tertiaryStar.name.trim()
        ? tertiaryStar.name.trim()
        : "Tertiary",
    tertiaryMassMsol: finitePositiveNumber(tertiaryStar?.massMsol, 0.54),
    tertiaryRadiusRsolOverride: finitePositiveNumber(tertiaryStar?.radiusRsolOverride),
    tertiaryLuminosityLsolOverride: finitePositiveNumber(tertiaryStar?.luminosityLsolOverride),
    tertiaryTempKOverride: finitePositiveNumber(tertiaryStar?.tempKOverride),
    tertiaryPhysicsMode:
      tertiaryStar?.physicsMode === "advanced" || tertiaryStar?.physicsMode === "simple"
        ? tertiaryStar.physicsMode
        : "simple",
    tertiaryAdvancedDerivationMode: ["rl", "rt", "lt"].includes(
      tertiaryStar?.advancedDerivationMode,
    )
      ? tertiaryStar.advancedDerivationMode
      : "rl",
    tripleOuterSemiMajorAxisAu: finitePositiveNumber(tertiaryPair?.semiMajorAxisAu, 180),
    tripleOuterEccentricity: finiteNumber(tertiaryPair?.eccentricity, 0.18),
    tripleOuterInclinationDeg: finiteNumber(tertiaryPair?.inclinationDeg, 0),
    tripleOuterArgPeriapsisDeg: finiteNumber(tertiaryPair?.argPeriapsisDeg, 0),
    tripleOuterMeanAnomalyDeg: finiteNumber(tertiaryPair?.meanAnomalyDeg, 0),
    quaternaryName:
      typeof quaternaryStar?.name === "string" && quaternaryStar.name.trim()
        ? quaternaryStar.name.trim()
        : "Quaternary",
    quaternaryMassMsol: finitePositiveNumber(quaternaryStar?.massMsol, 0.33),
    quaternaryRadiusRsolOverride: finitePositiveNumber(quaternaryStar?.radiusRsolOverride),
    quaternaryLuminosityLsolOverride: finitePositiveNumber(quaternaryStar?.luminosityLsolOverride),
    quaternaryTempKOverride: finitePositiveNumber(quaternaryStar?.tempKOverride),
    quaternaryPhysicsMode:
      quaternaryStar?.physicsMode === "advanced" || quaternaryStar?.physicsMode === "simple"
        ? quaternaryStar.physicsMode
        : "simple",
    quaternaryAdvancedDerivationMode: ["rl", "rt", "lt"].includes(
      quaternaryStar?.advancedDerivationMode,
    )
      ? quaternaryStar.advancedDerivationMode
      : "rl",
    quadOuterSemiMajorAxisAu: finitePositiveNumber(quaternaryPair?.semiMajorAxisAu, 640),
    quadOuterEccentricity: finiteNumber(quaternaryPair?.eccentricity, 0.24),
    quadOuterInclinationDeg: finiteNumber(quaternaryPair?.inclinationDeg, 0),
    quadOuterArgPeriapsisDeg: finiteNumber(quaternaryPair?.argPeriapsisDeg, 0),
    quadOuterMeanAnomalyDeg: finiteNumber(quaternaryPair?.meanAnomalyDeg, 0),
  };
}

export function createStarDraftHelpers({ defaults = {}, getDraftState = () => ({}) } = {}) {
  const fieldMap = buildStarEditorFieldMap(defaults);

  function getStarEditorFieldConfig(starId = "star_a") {
    return fieldMap[starId] || fieldMap.star_a;
  }

  function getStarDraftState(starId = "star_a", draftState = getDraftState()) {
    const config = getStarEditorFieldConfig(starId);
    return {
      id: starId,
      title: config.title,
      role: config.role,
      name:
        String(draftState?.[config.nameField] || config.defaultName).trim() || config.defaultName,
      massMsol: Number(draftState?.[config.massField] ?? config.defaultMass),
      physicsMode: draftState?.[config.physicsModeField] === "advanced" ? "advanced" : "simple",
      advancedDerivationMode: ["rl", "rt", "lt"].includes(draftState?.[config.derivationField])
        ? draftState[config.derivationField]
        : "rl",
      radiusRsolOverride: finitePositiveNumber(draftState?.[config.radiusField]),
      luminosityLsolOverride: finitePositiveNumber(draftState?.[config.luminosityField]),
      tempKOverride: finitePositiveNumber(draftState?.[config.tempField]),
      ageGyr: finiteNumber(draftState?.ageGyr, finiteNumber(defaults.ageGyr, 0)),
      metallicityFeH: finiteNumber(draftState?.metallicityFeH, 0),
      evolutionMode:
        draftState?.evolutionMode === "zams" || draftState?.evolutionMode === "staticMainSequence"
          ? "zams"
          : "evolved",
      activityModelVersion: draftState?.activityModelVersion === "v1" ? "v1" : "v2",
    };
  }

  function assignStarDraftState(starId = "star_a", patch = {}, draftState = getDraftState()) {
    const config = getStarEditorFieldConfig(starId);
    if (Object.hasOwn(patch, "name")) draftState[config.nameField] = patch.name;
    if (Object.hasOwn(patch, "massMsol")) draftState[config.massField] = patch.massMsol;
    if (Object.hasOwn(patch, "physicsMode"))
      draftState[config.physicsModeField] = patch.physicsMode;
    if (Object.hasOwn(patch, "advancedDerivationMode"))
      draftState[config.derivationField] = patch.advancedDerivationMode;
    if (Object.hasOwn(patch, "radiusRsolOverride"))
      draftState[config.radiusField] = patch.radiusRsolOverride;
    if (Object.hasOwn(patch, "luminosityLsolOverride"))
      draftState[config.luminosityField] = patch.luminosityLsolOverride;
    if (Object.hasOwn(patch, "tempKOverride")) draftState[config.tempField] = patch.tempKOverride;
    return draftState;
  }

  function normalizeTopologyHostFrameId(value, topologyKind = "single", quadLayoutKind = "chain") {
    const normalizedQuadLayoutKind = normalizeQuadLayoutKind(quadLayoutKind);
    const validHostFrameIds =
      topologyKind === "quad"
        ? normalizedQuadLayoutKind === "paired"
          ? ["star_a", "star_b", "star_c", "star_d", "pair_ab", "pair_cd", "pair_root"]
          : ["star_a", "star_b", "star_c", "star_d", "pair_ab", "pair_abc", "pair_abcd"]
        : topologyKind === "triple"
          ? ["star_a", "star_b", "star_c", "pair_ab", "pair_abc"]
          : topologyKind === "binary"
            ? ["star_a", "star_b", "pair_ab"]
            : ["star_a"];
    let normalizedValue = String(value || "");
    if (topologyKind === "quad" && !validHostFrameIds.includes(normalizedValue)) {
      if (normalizedQuadLayoutKind === "paired") {
        if (normalizedValue === "pair_abcd" || normalizedValue === "pair_abc") {
          normalizedValue = "pair_root";
        }
      } else if (normalizedValue === "pair_root" || normalizedValue === "pair_cd") {
        normalizedValue = "pair_abcd";
      }
    }
    return validHostFrameIds.includes(normalizedValue) ? normalizedValue : validHostFrameIds[0];
  }

  function listAvailableStarEditorIds(draftState = getDraftState()) {
    const ids = ["star_a"];
    if (draftState.topologyKind !== "single") ids.push("star_b");
    if (draftState.topologyKind === "triple" || draftState.topologyKind === "quad")
      ids.push("star_c");
    if (draftState.topologyKind === "quad") ids.push("star_d");
    return ids;
  }

  function listAvailablePairEditorIds(draftState = getDraftState()) {
    if (draftState.topologyKind === "quad") {
      return normalizeQuadLayoutKind(draftState.quadLayoutKind) === "paired"
        ? ["pair_ab", "pair_cd", "pair_root"]
        : ["pair_ab", "pair_abc", "pair_abcd"];
    }
    if (draftState.topologyKind === "triple") return ["pair_ab", "pair_abc"];
    if (draftState.topologyKind === "binary") return ["pair_ab"];
    return [];
  }

  function getEditorTargetKind(targetId) {
    return String(targetId || "").startsWith("pair_") ? "pair" : "star";
  }

  function suggestStarEditorId(draftState = getDraftState()) {
    const available = listAvailableStarEditorIds(draftState);
    return available[available.length - 1] || "star_a";
  }

  function suggestPairEditorId(draftState = getDraftState()) {
    const available = listAvailablePairEditorIds(draftState);
    return available.length ? available[available.length - 1] : null;
  }

  function normalizeSelectedStarEditorId(
    value,
    draftState = getDraftState(),
    { preferSuggested = false } = {},
  ) {
    const available = listAvailableStarEditorIds(draftState);
    if (!available.length) return "star_a";
    const normalizedValue = String(value || "");
    if (!preferSuggested && available.includes(normalizedValue)) return normalizedValue;
    const suggested = suggestStarEditorId(draftState);
    return available.includes(suggested) ? suggested : available[0];
  }

  function normalizeSelectedPairEditorId(
    value,
    draftState = getDraftState(),
    { preferSuggested = false } = {},
  ) {
    const available = listAvailablePairEditorIds(draftState);
    if (!available.length) return null;
    const normalizedValue = String(value || "");
    if (!preferSuggested && available.includes(normalizedValue)) return normalizedValue;
    const suggested = suggestPairEditorId(draftState);
    return available.includes(suggested) ? suggested : available[0];
  }

  function buildEditorTopologySignature(draftState = getDraftState()) {
    return `${draftState.topologyKind}:${normalizeQuadLayoutKind(draftState.quadLayoutKind)}`;
  }

  function normalizeInspectorMode(value, draftState = getDraftState()) {
    return value === "pair" && listAvailablePairEditorIds(draftState).length ? "pair" : "star";
  }

  function pickEditorTargetForMode(
    mode,
    draftState = getDraftState(),
    { rememberedStarEditorId = null, rememberedPairEditorId = null, preferSuggested = false } = {},
  ) {
    const normalizedMode = normalizeInspectorMode(mode, draftState);
    if (normalizedMode === "pair") {
      return normalizeSelectedPairEditorId(rememberedPairEditorId, draftState, {
        preferSuggested,
      });
    }
    return normalizeSelectedStarEditorId(rememberedStarEditorId, draftState, { preferSuggested });
  }

  function normalizeSelectedEditorTargetId(
    value,
    draftState = getDraftState(),
    {
      preferredMode = "star",
      rememberedStarEditorId = null,
      rememberedPairEditorId = null,
      preferSuggested = false,
    } = {},
  ) {
    const normalizedValue = String(value || "");
    const targetKind = getEditorTargetKind(normalizedValue);
    const normalizedPreferredMode = normalizeInspectorMode(preferredMode, draftState);
    const availableTargets =
      targetKind === "pair"
        ? listAvailablePairEditorIds(draftState)
        : listAvailableStarEditorIds(draftState);
    if (!preferSuggested && availableTargets.includes(normalizedValue)) {
      if (
        targetKind === normalizedPreferredMode ||
        (normalizedPreferredMode === "pair" && !listAvailablePairEditorIds(draftState).length)
      ) {
        return normalizedValue;
      }
    }

    const preferredTarget = pickEditorTargetForMode(normalizedPreferredMode, draftState, {
      rememberedStarEditorId,
      rememberedPairEditorId,
      preferSuggested,
    });
    if (preferredTarget) return preferredTarget;

    return (
      normalizeSelectedStarEditorId(rememberedStarEditorId, draftState, { preferSuggested }) ||
      normalizeSelectedPairEditorId(rememberedPairEditorId, draftState, { preferSuggested }) ||
      "star_a"
    );
  }

  function buildStarEditorLabel(starId, draftState = getDraftState()) {
    if (starId === "star_a") return `Star A (${draftState.name})`;
    if (starId === "star_b") return `Star B (${draftState.companionName})`;
    if (starId === "star_c") return `Star C (${draftState.tertiaryName})`;
    if (starId === "star_d") return `Star D (${draftState.quaternaryName})`;
    return String(starId || "Star");
  }

  function buildPairEditorLabel(pairId, draftState = getDraftState()) {
    if (pairId === "pair_ab") return "Pair A+B";
    if (pairId === "pair_abc") return "Pair (A+B)+C";
    if (pairId === "pair_abcd") return "Pair ((A+B)+C)+D";
    if (pairId === "pair_cd") return "Pair C+D";
    if (pairId === "pair_root") {
      return normalizeQuadLayoutKind(draftState.quadLayoutKind) === "paired"
        ? "Root Pair (A+B)+(C+D)"
        : "Root Pair";
    }
    return String(pairId || "Pair");
  }

  function getPairOrbitDraftSummary(pairId, draftState = getDraftState()) {
    if (pairId === "pair_ab") {
      return {
        semiMajorAxisAu: Number(draftState.binarySemiMajorAxisAu),
        eccentricity: Number(draftState.binaryEccentricity),
      };
    }
    if (pairId === "pair_abc" || pairId === "pair_cd") {
      return {
        semiMajorAxisAu: Number(draftState.tripleOuterSemiMajorAxisAu),
        eccentricity: Number(draftState.tripleOuterEccentricity),
      };
    }
    if (pairId === "pair_abcd" || pairId === "pair_root") {
      return {
        semiMajorAxisAu: Number(draftState.quadOuterSemiMajorAxisAu),
        eccentricity: Number(draftState.quadOuterEccentricity),
      };
    }
    return { semiMajorAxisAu: 0, eccentricity: 0 };
  }

  return {
    assignStarDraftState,
    buildEditorTopologySignature,
    buildPairEditorLabel,
    buildStarEditorLabel,
    createInitialStarDraftState(args = {}) {
      return createInitialStarDraftState({ defaults, ...args });
    },
    getEditorTargetKind,
    getPairOrbitDraftSummary,
    getStarDraftState,
    getStarEditorFieldConfig,
    listAvailablePairEditorIds,
    listAvailableStarEditorIds,
    normalizeInspectorMode,
    normalizeSelectedEditorTargetId,
    normalizeSelectedPairEditorId,
    normalizeSelectedStarEditorId,
    normalizeTopologyHostFrameId,
    suggestPairEditorId,
    suggestStarEditorId,
  };
}
