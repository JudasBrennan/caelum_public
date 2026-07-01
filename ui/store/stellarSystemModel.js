import { listFromCollection, makeCollection } from "./systemCollections.js";
import { BROWN_DWARF_MIN_MSOL } from "../../engine/substellarRegime.js";

export const STELLAR_SYSTEM_TOPOLOGY_KINDS = Object.freeze(["single", "binary", "triple", "quad"]);

const RESERVED_IDS = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sanitizeNodeId(value) {
  const id = String(value ?? "").trim();
  if (!id || RESERVED_IDS.has(id)) return null;
  return id;
}

function defaultStarIdForIndex(index) {
  const normalizedIndex = Math.max(1, Number(index) || 1);
  if (normalizedIndex <= 26) {
    return `star_${String.fromCharCode(96 + normalizedIndex)}`;
  }
  return `star_${normalizedIndex}`;
}

function defaultPairIdForIndex(index) {
  return `pair_${Math.max(1, Number(index) || 1)}`;
}

function normalizeName(value, fallback) {
  const trimmed = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return trimmed || fallback;
}

function toFiniteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function toNullableFiniteNumber(value, { min = -Infinity, max = Infinity } = {}) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeTopologyKind(value, fallbackCount = 1) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (STELLAR_SYSTEM_TOPOLOGY_KINDS.includes(raw)) return raw;
  if (fallbackCount <= 1) return "single";
  if (fallbackCount === 2) return "binary";
  if (fallbackCount === 3) return "triple";
  return "quad";
}

function normalizeShared(raw, fallback = {}) {
  return {
    ageGyr: toFiniteNumber(raw?.ageGyr, toFiniteNumber(fallback?.ageGyr, 4.6, { min: 0 }), {
      min: 0,
    }),
    metallicityFeH: toFiniteNumber(
      raw?.metallicityFeH,
      toFiniteNumber(fallback?.metallicityFeH, 0),
    ),
  };
}

function normalizeStarComponent(raw, index = 1, fallback = {}) {
  const id =
    sanitizeNodeId(raw?.id) || sanitizeNodeId(fallback?.id) || defaultStarIdForIndex(index);
  const defaultName = index === 1 ? "Primary" : `Star ${index}`;
  return {
    id,
    name: normalizeName(raw?.name, normalizeName(fallback?.name, defaultName)),
    massMsol: toFiniteNumber(
      raw?.massMsol,
      toFiniteNumber(fallback?.massMsol, 1, { min: BROWN_DWARF_MIN_MSOL }),
      {
        min: BROWN_DWARF_MIN_MSOL,
      },
    ),
    physicsMode: raw?.physicsMode === "advanced" ? "advanced" : "simple",
    advancedDerivationMode: ["rl", "rt", "lt"].includes(raw?.advancedDerivationMode)
      ? raw.advancedDerivationMode
      : ["rl", "rt", "lt"].includes(fallback?.advancedDerivationMode)
        ? fallback.advancedDerivationMode
        : "rl",
    radiusRsolOverride: toNullableFiniteNumber(raw?.radiusRsolOverride, { min: 0 }),
    luminosityLsolOverride: toNullableFiniteNumber(raw?.luminosityLsolOverride, { min: 0 }),
    tempKOverride: toNullableFiniteNumber(raw?.tempKOverride, { min: 0 }),
    evolutionMode:
      raw?.evolutionMode === "zams" || raw?.evolutionMode === "staticMainSequence"
        ? "zams"
        : fallback?.evolutionMode === "zams" || fallback?.evolutionMode === "staticMainSequence"
          ? "zams"
          : "evolved",
    activityModelVersion:
      String(raw?.activityModelVersion || fallback?.activityModelVersion || "v2").toLowerCase() ===
      "v1"
        ? "v1"
        : "v2",
    ageGyrOverride: toNullableFiniteNumber(raw?.ageGyrOverride, { min: 0 }),
    metallicityFeHOverride: toNullableFiniteNumber(raw?.metallicityFeHOverride),
  };
}

function normalizeChildRef(raw) {
  if (!isPlainObject(raw)) return null;
  const kind = raw.kind === "pair" ? "pair" : raw.kind === "star" ? "star" : null;
  const id = sanitizeNodeId(raw.id);
  if (!kind || !id) return null;
  return { kind, id };
}

function normalizePair(raw, index = 1) {
  const id = sanitizeNodeId(raw?.id) || defaultPairIdForIndex(index);
  return {
    id,
    childA: normalizeChildRef(raw?.childA),
    childB: normalizeChildRef(raw?.childB),
    semiMajorAxisAu: toFiniteNumber(raw?.semiMajorAxisAu, 1, { min: 0 }),
    eccentricity: toFiniteNumber(raw?.eccentricity, 0, { min: 0, max: 0.999 }),
    inclinationDeg: toFiniteNumber(raw?.inclinationDeg, 0),
    argPeriapsisDeg: toFiniteNumber(raw?.argPeriapsisDeg, 0),
    meanAnomalyDeg: toFiniteNumber(raw?.meanAnomalyDeg, 0),
  };
}

function listRawCollection(raw) {
  if (Array.isArray(raw)) return raw.filter(isPlainObject);
  if (isPlainObject(raw?.byId)) {
    return listFromCollection(raw).filter(isPlainObject);
  }
  if (isPlainObject(raw)) {
    return Object.values(raw).filter(isPlainObject);
  }
  return [];
}

function buildNodeIndex(stellarSystem) {
  const starsById =
    stellarSystem?.stars?.byId && isPlainObject(stellarSystem.stars.byId)
      ? stellarSystem.stars.byId
      : {};
  const pairsById =
    stellarSystem?.pairs?.byId && isPlainObject(stellarSystem.pairs.byId)
      ? stellarSystem.pairs.byId
      : {};
  const nodeKinds = new Map();
  for (const starId of Object.keys(starsById)) nodeKinds.set(starId, "star");
  for (const pairId of Object.keys(pairsById)) nodeKinds.set(pairId, "pair");
  return { starsById, pairsById, nodeKinds };
}

function collectReferencedChildIds(stellarSystem) {
  const childIds = new Set();
  for (const pair of listFromCollection(stellarSystem?.pairs)) {
    if (pair?.childA?.id) childIds.add(pair.childA.id);
    if (pair?.childB?.id) childIds.add(pair.childB.id);
  }
  return childIds;
}

function deriveRootNodeId(stellarSystem) {
  const { nodeKinds } = buildNodeIndex(stellarSystem);
  const explicitRoot = sanitizeNodeId(stellarSystem?.rootNodeId);
  if (explicitRoot && nodeKinds.has(explicitRoot)) return explicitRoot;

  const childIds = collectReferencedChildIds(stellarSystem);
  const candidatePairRoots = listFromCollection(stellarSystem?.pairs)
    .map((pair) => sanitizeNodeId(pair?.id))
    .filter((id) => !!id && !childIds.has(id));
  if (candidatePairRoots.length === 1) return candidatePairRoots[0];
  if (candidatePairRoots.length > 1) return candidatePairRoots[0];

  const candidateStarRoots = listFromCollection(stellarSystem?.stars)
    .map((star) => sanitizeNodeId(star?.id))
    .filter((id) => !!id && !childIds.has(id));
  if (candidateStarRoots.length >= 1) return candidateStarRoots[0];

  return sanitizeNodeId(stellarSystem?.stars?.order?.[0]) || null;
}

function collectTopologyErrors(stellarSystem) {
  const errors = [];
  const { starsById, pairsById, nodeKinds } = buildNodeIndex(stellarSystem);
  const starIds = Object.keys(starsById);
  const pairIds = Object.keys(pairsById);

  if (!starIds.length) errors.push("stellarSystem must contain at least one star.");
  if (starIds.length > 4) errors.push("stellarSystem supports at most four stars.");

  const expectedTopology = normalizeTopologyKind(null, starIds.length);
  if (normalizeTopologyKind(stellarSystem?.topologyKind, starIds.length) !== expectedTopology) {
    errors.push(`stellarSystem.topologyKind does not match star count (${starIds.length}).`);
  }
  if (pairIds.length !== Math.max(0, starIds.length - 1)) {
    errors.push(
      `stellarSystem requires exactly ${Math.max(0, starIds.length - 1)} pair node(s) for ${starIds.length} star(s).`,
    );
  }

  const parentCountByNodeId = new Map();

  for (const pairId of pairIds) {
    const pair = pairsById[pairId];
    const children = [
      ["childA", pair?.childA],
      ["childB", pair?.childB],
    ];
    if (pair?.childA?.id && pair?.childA?.id === pair?.childB?.id) {
      errors.push(`stellarSystem pair "${pairId}" cannot use the same child twice.`);
    }
    for (const [label, child] of children) {
      if (!child?.kind || !child?.id) {
        errors.push(`stellarSystem pair "${pairId}" is missing ${label}.`);
        continue;
      }
      const childKind = nodeKinds.get(child.id);
      if (!childKind || childKind !== child.kind) {
        errors.push(`stellarSystem pair "${pairId}" has invalid ${label} reference "${child.id}".`);
      }
      if (child.id === pairId) {
        errors.push(`stellarSystem pair "${pairId}" cannot reference itself.`);
      }
      parentCountByNodeId.set(child.id, (parentCountByNodeId.get(child.id) || 0) + 1);
    }
  }

  const rootNodeId = sanitizeNodeId(stellarSystem?.rootNodeId);
  if (!rootNodeId || !nodeKinds.has(rootNodeId)) {
    errors.push("stellarSystem.rootNodeId must reference an existing star or pair.");
  } else {
    if (starIds.length > 1 && nodeKinds.get(rootNodeId) !== "pair") {
      errors.push("stellarSystem.rootNodeId must reference a pair for multi-star systems.");
    }
    if (nodeKinds.get(rootNodeId) === "star" && starIds.length !== 1) {
      errors.push("stellarSystem.rootNodeId may reference a star only in single-star systems.");
    }
  }

  const defaultHostFrameId = sanitizeNodeId(stellarSystem?.defaultHostFrameId);
  if (!defaultHostFrameId || !nodeKinds.has(defaultHostFrameId)) {
    errors.push("stellarSystem.defaultHostFrameId must reference an existing star or pair.");
  }

  for (const nodeId of nodeKinds.keys()) {
    const parentCount = parentCountByNodeId.get(nodeId) || 0;
    if (nodeId === rootNodeId) {
      if (parentCount > 0) {
        errors.push(`stellarSystem root node "${nodeId}" cannot also be a child node.`);
      }
      continue;
    }
    if (parentCount !== 1) {
      errors.push(`stellarSystem node "${nodeId}" must have exactly one parent pair.`);
    }
  }

  if (errors.length) return errors;

  const visited = new Set();
  const stack = new Set();

  function visitNode(nodeId) {
    if (stack.has(nodeId)) {
      errors.push("stellarSystem contains a cycle.");
      return;
    }
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    if (!pairsById[nodeId]) return;
    stack.add(nodeId);
    const pair = pairsById[nodeId];
    if (pair.childA?.id) visitNode(pair.childA.id);
    if (pair.childB?.id) visitNode(pair.childB.id);
    stack.delete(nodeId);
  }

  visitNode(rootNodeId);

  for (const nodeId of nodeKinds.keys()) {
    if (!visited.has(nodeId)) {
      errors.push(`stellarSystem node "${nodeId}" is not connected to the root.`);
    }
  }

  return errors;
}

export function createSingleStarStellarSystem(starLike = {}) {
  const shared = normalizeShared(starLike, starLike);
  const primary = normalizeStarComponent({ ...starLike, id: "star_a" }, 1, {
    id: "star_a",
    name: starLike?.name || "Star",
  });
  primary.name = normalizeName(primary.name, "Star");
  const stars = makeCollection([primary], "star_");
  return {
    topologyKind: "single",
    shared,
    stars,
    pairs: makeCollection([], "pair_"),
    rootNodeId: primary.id,
    defaultHostFrameId: primary.id,
  };
}

function buildCanonicalStellarSystem(raw, { fallbackStar = null } = {}) {
  const singleStarFallback = createSingleStarStellarSystem(fallbackStar || {});
  if (!isPlainObject(raw)) return singleStarFallback;

  const sharedFallback = {
    ageGyr: fallbackStar?.ageGyr ?? singleStarFallback.shared.ageGyr,
    metallicityFeH: fallbackStar?.metallicityFeH ?? singleStarFallback.shared.metallicityFeH,
  };
  const shared = normalizeShared(raw.shared, sharedFallback);

  const normalizedStars = listRawCollection(raw.stars).map((star, index) =>
    normalizeStarComponent(star, index + 1),
  );
  const stars = normalizedStars.length
    ? makeCollection(normalizedStars, "star_")
    : singleStarFallback.stars;

  const normalizedPairs = listRawCollection(raw.pairs).map((pair, index) =>
    normalizePair(pair, index + 1),
  );
  const pairs = makeCollection(normalizedPairs, "pair_");

  const candidate = {
    topologyKind: normalizeTopologyKind(raw.topologyKind, stars.order.length),
    shared,
    stars,
    pairs,
    rootNodeId: null,
    defaultHostFrameId: null,
  };

  candidate.rootNodeId = deriveRootNodeId({ ...candidate, rootNodeId: raw.rootNodeId });
  candidate.defaultHostFrameId =
    sanitizeNodeId(raw.defaultHostFrameId) || candidate.rootNodeId || stars.order[0] || null;

  return candidate;
}

export function normalizeStellarSystem(raw, { fallbackStar = null } = {}) {
  const fallback = createSingleStarStellarSystem(fallbackStar || {});
  const candidate = buildCanonicalStellarSystem(raw, { fallbackStar });
  return collectTopologyErrors(candidate).length ? fallback : candidate;
}

export function validateStellarSystemDefinition(raw, { fallbackStar = null } = {}) {
  const errors = [];
  if (raw == null) return errors;
  if (!isPlainObject(raw)) return ["'stellarSystem' must be an object."];
  if (raw.shared != null && !isPlainObject(raw.shared)) {
    errors.push("'stellarSystem.shared' must be an object.");
  }
  if (
    raw.topologyKind != null &&
    !STELLAR_SYSTEM_TOPOLOGY_KINDS.includes(String(raw.topologyKind).trim().toLowerCase())
  ) {
    errors.push("'stellarSystem.topologyKind' must be single, binary, triple, or quad.");
  }
  if (
    raw.stars != null &&
    !Array.isArray(raw.stars) &&
    !isPlainObject(raw.stars) &&
    !isPlainObject(raw.stars?.byId)
  ) {
    errors.push("'stellarSystem.stars' must be a collection, array, or object.");
  }
  if (
    raw.pairs != null &&
    !Array.isArray(raw.pairs) &&
    !isPlainObject(raw.pairs) &&
    !isPlainObject(raw.pairs?.byId)
  ) {
    errors.push("'stellarSystem.pairs' must be a collection, array, or object.");
  }

  const starIds = new Set();
  for (const star of listRawCollection(raw.stars)) {
    const id = sanitizeNodeId(star?.id);
    if (!id) {
      errors.push("stellarSystem stars must have valid ids.");
      continue;
    }
    if (starIds.has(id)) errors.push(`stellarSystem star id "${id}" is duplicated.`);
    starIds.add(id);
  }

  const pairIds = new Set();
  for (const pair of listRawCollection(raw.pairs)) {
    const id = sanitizeNodeId(pair?.id);
    if (!id) {
      errors.push("stellarSystem pairs must have valid ids.");
      continue;
    }
    if (pairIds.has(id)) errors.push(`stellarSystem pair id "${id}" is duplicated.`);
    pairIds.add(id);
  }

  errors.push(...collectTopologyErrors(buildCanonicalStellarSystem(raw, { fallbackStar })));
  return Array.from(new Set(errors));
}

function collectLeafStarIds(stellarSystem, nodeId, seen = new Set()) {
  if (!nodeId || seen.has(nodeId)) return [];
  seen.add(nodeId);
  const { starsById, pairsById } = buildNodeIndex(stellarSystem);
  if (starsById[nodeId]) return [nodeId];
  const pair = pairsById[nodeId];
  if (!pair) return [];
  return [
    ...collectLeafStarIds(stellarSystem, pair.childA?.id, seen),
    ...collectLeafStarIds(stellarSystem, pair.childB?.id, seen),
  ];
}

export function getPrimaryStarId(stellarSystem) {
  const normalized = normalizeStellarSystem(stellarSystem);
  const rootId = normalized.rootNodeId;
  const leafIds = collectLeafStarIds(normalized, rootId);
  return leafIds[0] || normalized.stars.order[0] || "star_a";
}

export function projectPrimaryStarFromStellarSystem(stellarSystem, fallbackStar = {}) {
  const normalized = normalizeStellarSystem(stellarSystem, { fallbackStar });
  const primaryStarId = getPrimaryStarId(normalized);
  const primary =
    normalized.stars.byId[primaryStarId] || normalized.stars.byId[normalized.stars.order[0]];
  const ageGyr =
    primary?.ageGyrOverride != null ? primary.ageGyrOverride : normalized.shared.ageGyr;
  const metallicityFeH =
    primary?.metallicityFeHOverride != null
      ? primary.metallicityFeHOverride
      : normalized.shared.metallicityFeH;
  return {
    name: normalizeName(primary?.name, normalizeName(fallbackStar?.name, "Star")),
    massMsol: toFiniteNumber(
      primary?.massMsol,
      toFiniteNumber(fallbackStar?.massMsol, 1, { min: BROWN_DWARF_MIN_MSOL }),
      {
        min: BROWN_DWARF_MIN_MSOL,
      },
    ),
    ageGyr: toFiniteNumber(ageGyr, toFiniteNumber(fallbackStar?.ageGyr, 4.6, { min: 0 }), {
      min: 0,
    }),
    radiusRsolOverride: toNullableFiniteNumber(primary?.radiusRsolOverride, { min: 0 }),
    luminosityLsolOverride: toNullableFiniteNumber(primary?.luminosityLsolOverride, { min: 0 }),
    tempKOverride: toNullableFiniteNumber(primary?.tempKOverride, { min: 0 }),
    metallicityFeH: toFiniteNumber(metallicityFeH, toFiniteNumber(fallbackStar?.metallicityFeH, 0)),
    physicsMode: primary?.physicsMode === "advanced" ? "advanced" : "simple",
    advancedDerivationMode: ["rl", "rt", "lt"].includes(primary?.advancedDerivationMode)
      ? primary.advancedDerivationMode
      : "rl",
    evolutionMode:
      primary?.evolutionMode === "zams" || primary?.evolutionMode === "staticMainSequence"
        ? "zams"
        : "evolved",
    activityModelVersion: primary?.activityModelVersion === "v1" ? "v1" : "v2",
  };
}

export function applyCompatibilityStarToStellarSystem(stellarSystem, starLike = {}) {
  const normalized = normalizeStellarSystem(stellarSystem, { fallbackStar: starLike });
  const primaryStarId = getPrimaryStarId(normalized);
  const primary =
    normalized.stars.byId[primaryStarId] || normalized.stars.byId[normalized.stars.order[0]];
  const nextPrimary = normalizeStarComponent(
    {
      ...primary,
      id: primaryStarId,
      name: starLike?.name ?? primary?.name,
      massMsol: starLike?.massMsol ?? primary?.massMsol,
      physicsMode: starLike?.physicsMode ?? primary?.physicsMode,
      advancedDerivationMode: starLike?.advancedDerivationMode ?? primary?.advancedDerivationMode,
      radiusRsolOverride: starLike?.radiusRsolOverride ?? primary?.radiusRsolOverride,
      luminosityLsolOverride: starLike?.luminosityLsolOverride ?? primary?.luminosityLsolOverride,
      tempKOverride: starLike?.tempKOverride ?? primary?.tempKOverride,
      evolutionMode: starLike?.evolutionMode ?? primary?.evolutionMode,
      activityModelVersion: starLike?.activityModelVersion ?? primary?.activityModelVersion,
      ageGyrOverride: primary?.ageGyrOverride,
      metallicityFeHOverride: primary?.metallicityFeHOverride,
    },
    1,
    { id: primaryStarId, name: primary?.name || starLike?.name || "Star" },
  );

  const next = {
    ...normalized,
    shared: normalizeShared(
      {
        ageGyr: starLike?.ageGyr ?? normalized.shared.ageGyr,
        metallicityFeH: starLike?.metallicityFeH ?? normalized.shared.metallicityFeH,
      },
      normalized.shared,
    ),
    stars: {
      ...normalized.stars,
      byId: {
        ...normalized.stars.byId,
        [primaryStarId]: nextPrimary,
      },
    },
  };

  return normalizeStellarSystem(next, { fallbackStar: starLike });
}

export function listStellarSystemStars(stellarSystem) {
  return listFromCollection(normalizeStellarSystem(stellarSystem).stars);
}

export function listStellarSystemPairs(stellarSystem) {
  return listFromCollection(normalizeStellarSystem(stellarSystem).pairs);
}

export function listStellarSystemHostFrames(stellarSystem) {
  const normalized = normalizeStellarSystem(stellarSystem);
  const stars = listFromCollection(normalized.stars).map((star) => ({
    id: star.id,
    frameKind: "star",
    hostNodeId: star.id,
    orbitFamilyKind:
      normalized.topologyKind === "single" && !normalized.pairs.order.length ? "single" : "s-type",
    dominantStars: [star.id],
    label: star.name,
  }));
  const pairs = listFromCollection(normalized.pairs).map((pair) => {
    const dominantStars = collectLeafStarIds(normalized, pair.id);
    const label = dominantStars
      .map((starId) => normalized.stars.byId[starId]?.name || starId)
      .join(" + ");
    return {
      id: pair.id,
      frameKind: "pair",
      hostNodeId: pair.id,
      orbitFamilyKind: "p-type",
      dominantStars,
      label,
    };
  });
  return [...stars, ...pairs];
}

export function getDefaultHostFrameId(stellarSystem) {
  const normalized = normalizeStellarSystem(stellarSystem);
  return (
    normalized.defaultHostFrameId || normalized.rootNodeId || normalized.stars.order[0] || "star_a"
  );
}
