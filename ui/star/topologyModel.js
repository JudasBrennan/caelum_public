import { normalizeQuadLayoutKind } from "./draftState.js";

const TOPOLOGY_MAP_STATUS_RANK = Object.freeze({
  good: 0,
  caution: 1,
  unstable: 2,
  blocked: 3,
});

export function buildQuadLayoutCopy(quadLayoutKind = "chain") {
  if (quadLayoutKind === "paired") {
    return {
      topologyLabel: "Quad (Paired)",
      topologyHint:
        "Quad uses the paired (A+B)+(C+D) hierarchy. Two inner binaries orbit a shared outer barycentre while keeping the topology readable in later canvases.",
      layoutHint: "Paired: two inner binaries orbit a shared outer barycenter.",
      tertiaryPairTitle: "Second Inner Pair C+D",
      tertiaryPairAxisHint: "Average separation between Stars C and D.",
      tertiaryPairEccentricityHint: "Controls how circular or stretched the C+D orbit is.",
      quaternaryPairTitle: "Root Pair (A+B)+(C+D)",
      quaternaryPairAxisHint: "Average separation between the A+B and C+D inner binaries.",
      quaternaryPairEccentricityHint:
        "Controls how strongly the two inner binaries modulate the shared outer hierarchy.",
    };
  }
  return {
    topologyLabel: "Quad (Chain)",
    topologyHint:
      "Quad uses the constrained (((A+B)+C)+D) hierarchy. Each outer layer adds more light and tighter outer stability constraints while keeping the topology readable in later canvases.",
    layoutHint: "Chain: one outer companion is added at each layer.",
    tertiaryPairTitle: "Outer Pair (A+B)+C",
    tertiaryPairAxisHint: "Average separation between the inner pair and the tertiary star.",
    tertiaryPairEccentricityHint:
      "Controls how strongly the tertiary swings toward and away from the inner pair.",
    quaternaryPairTitle: "Outer Pair ((A+B)+C)+D",
    quaternaryPairAxisHint:
      "Average separation between the inner triple hierarchy and the fourth star.",
    quaternaryPairEccentricityHint:
      "Controls how strongly the fourth star modulates the outermost hierarchy.",
  };
}

export function buildTopologyCardDescriptors(draftState = {}) {
  const quadLayoutCopy = buildQuadLayoutCopy(draftState?.quadLayoutKind);
  return [
    {
      value: "single",
      id: "topologyCardSingle",
      title: "Single star",
      formula: "A",
      meaning: "One host star with the simplest orbit context.",
      summary: "Best when you want the classic one-star workflow.",
      detail:
        "Single star keeps the classic one-star flow. Switch to a hierarchical topology when you want manually authored multiple stars.",
    },
    {
      value: "binary",
      id: "topologyCardBinary",
      title: "Binary system",
      formula: "(A+B)",
      meaning: "Two stars with star-hosted and pair-hosted world options.",
      summary: "Adds one companion star and one pair host frame.",
      detail:
        "Binary system keeps a shared age and metallicity, adds one companion star, and saves Pair A+B for topology-aware host-frame views.",
    },
    {
      value: "triple",
      id: "topologyCardTriple",
      title: "Hierarchical triple",
      formula: "((A+B)+C)",
      meaning: "An inner binary plus one outer star in a stable hierarchy.",
      summary: "Adds tertiary light and outer stability context.",
      detail:
        "Hierarchical triple uses the constrained ((A+B)+C) hierarchy. The tertiary star adds outer light and stability limits without opening the door to non-hierarchical graphs.",
    },
    {
      value: "quad",
      id: "topologyCardQuad",
      title: "Hierarchical quad",
      formula: "(((A+B)+C)+D) or (A+B)+(C+D)",
      meaning: "Four stars in a constrained tree-shaped system.",
      summary: "Choose a chained or paired quad layout below.",
      detail: quadLayoutCopy.topologyHint,
    },
  ];
}

export function buildQuadLayoutCardDescriptors() {
  const chainCopy = buildQuadLayoutCopy("chain");
  const pairedCopy = buildQuadLayoutCopy("paired");
  return [
    {
      value: "chain",
      id: "quadLayoutCardChain",
      title: "Chained quad",
      formula: "(((A+B)+C)+D)",
      meaning: "One outer companion is added at each layer.",
      summary: "Keeps one expanding hierarchy from the inner pair outward.",
      hint: chainCopy.layoutHint,
      detail: chainCopy.topologyHint,
    },
    {
      value: "paired",
      id: "quadLayoutCardPaired",
      title: "Paired quad",
      formula: "(A+B)+(C+D)",
      meaning: "Two inner binaries orbit a shared outer barycentre.",
      summary: "Keeps both inner pairs explicit and symmetric.",
      hint: pairedCopy.layoutHint,
      detail: pairedCopy.topologyHint,
    },
  ];
}

export function buildTopologyMapLayoutKey(draftState = {}) {
  const topologyKind = ["binary", "triple", "quad"].includes(draftState?.topologyKind)
    ? draftState.topologyKind
    : "single";
  if (topologyKind !== "quad") return topologyKind;
  return normalizeQuadLayoutKind(draftState?.quadLayoutKind) === "paired"
    ? "quad-paired"
    : "quad-chain";
}

export function buildTopologyMapStarMeta(starId, draftState = {}) {
  const shortLabelById = {
    star_a: "A",
    star_b: "B",
    star_c: "C",
    star_d: "D",
  };
  const nameById = {
    star_a: String(draftState?.name || "Star").trim() || "Star",
    star_b: String(draftState?.companionName || "Companion").trim() || "Companion",
    star_c: String(draftState?.tertiaryName || "Tertiary").trim() || "Tertiary",
    star_d: String(draftState?.quaternaryName || "Quaternary").trim() || "Quaternary",
  };
  return {
    title: shortLabelById[starId] || String(starId || "Star"),
    subtitle: nameById[starId] || "Star",
    accessibleLabel: `Star ${shortLabelById[starId] || starId} (${nameById[starId] || "Star"})`,
  };
}

export function buildTopologyMapPairMeta(pairId, draftState = {}) {
  if (pairId === "pair_ab") {
    return {
      title: "A+B",
      subtitle: "Inner pair",
      accessibleLabel: "Pair A+B",
    };
  }
  if (pairId === "pair_abc") {
    return {
      title: "(A+B)+C",
      subtitle: "Outer pair",
      accessibleLabel: "Pair (A+B)+C",
    };
  }
  if (pairId === "pair_abcd") {
    return {
      title: "((A+B)+C)+D",
      subtitle: "Root pair",
      accessibleLabel: "Pair ((A+B)+C)+D",
    };
  }
  if (pairId === "pair_cd") {
    return {
      title: "C+D",
      subtitle: "Second inner pair",
      accessibleLabel: "Pair C+D",
    };
  }
  if (pairId === "pair_root") {
    return normalizeQuadLayoutKind(draftState?.quadLayoutKind) === "paired"
      ? {
          title: "Root",
          subtitle: "(A+B)+(C+D)",
          accessibleLabel: "Root pair (A+B)+(C+D)",
        }
      : {
          title: "Root",
          subtitle: "Outer hierarchy",
          accessibleLabel: "Root pair",
        };
  }
  return {
    title: String(pairId || "Pair"),
    subtitle: "Pair host",
    accessibleLabel: String(pairId || "Pair"),
  };
}

export function buildTopologyMapLayoutDefinition(draftState = {}) {
  const layoutKey = buildTopologyMapLayoutKey(draftState);
  switch (layoutKey) {
    case "binary":
      return {
        layoutKey,
        minHeightPx: 230,
        nodes: [
          { id: "pair_ab", kind: "pair", x: 50, y: 28 },
          { id: "star_a", kind: "star", x: 32, y: 74 },
          { id: "star_b", kind: "star", x: 68, y: 74 },
        ],
        edges: [
          { id: "pair_ab:star_a", from: "pair_ab", to: "star_a" },
          { id: "pair_ab:star_b", from: "pair_ab", to: "star_b" },
        ],
      };
    case "triple":
      return {
        layoutKey,
        minHeightPx: 270,
        nodes: [
          { id: "pair_abc", kind: "pair", x: 52, y: 18 },
          { id: "pair_ab", kind: "pair", x: 34, y: 50 },
          { id: "star_c", kind: "star", x: 74, y: 50 },
          { id: "star_a", kind: "star", x: 22, y: 82 },
          { id: "star_b", kind: "star", x: 46, y: 82 },
        ],
        edges: [
          { id: "pair_abc:pair_ab", from: "pair_abc", to: "pair_ab" },
          { id: "pair_abc:star_c", from: "pair_abc", to: "star_c" },
          { id: "pair_ab:star_a", from: "pair_ab", to: "star_a" },
          { id: "pair_ab:star_b", from: "pair_ab", to: "star_b" },
        ],
      };
    case "quad-chain":
      return {
        layoutKey,
        minHeightPx: 300,
        nodes: [
          { id: "pair_abcd", kind: "pair", x: 52, y: 16 },
          { id: "pair_abc", kind: "pair", x: 34, y: 42 },
          { id: "star_d", kind: "star", x: 78, y: 42 },
          { id: "pair_ab", kind: "pair", x: 24, y: 70 },
          { id: "star_c", kind: "star", x: 48, y: 70 },
          { id: "star_a", kind: "star", x: 16, y: 92 },
          { id: "star_b", kind: "star", x: 32, y: 92 },
        ],
        edges: [
          { id: "pair_abcd:pair_abc", from: "pair_abcd", to: "pair_abc" },
          { id: "pair_abcd:star_d", from: "pair_abcd", to: "star_d" },
          { id: "pair_abc:pair_ab", from: "pair_abc", to: "pair_ab" },
          { id: "pair_abc:star_c", from: "pair_abc", to: "star_c" },
          { id: "pair_ab:star_a", from: "pair_ab", to: "star_a" },
          { id: "pair_ab:star_b", from: "pair_ab", to: "star_b" },
        ],
      };
    case "quad-paired":
      return {
        layoutKey,
        minHeightPx: 300,
        nodes: [
          { id: "pair_root", kind: "pair", x: 50, y: 18 },
          { id: "pair_ab", kind: "pair", x: 30, y: 56 },
          { id: "pair_cd", kind: "pair", x: 70, y: 56 },
          { id: "star_a", kind: "star", x: 18, y: 90 },
          { id: "star_b", kind: "star", x: 42, y: 90 },
          { id: "star_c", kind: "star", x: 58, y: 90 },
          { id: "star_d", kind: "star", x: 82, y: 90 },
        ],
        edges: [
          { id: "pair_root:pair_ab", from: "pair_root", to: "pair_ab" },
          { id: "pair_root:pair_cd", from: "pair_root", to: "pair_cd" },
          { id: "pair_ab:star_a", from: "pair_ab", to: "star_a" },
          { id: "pair_ab:star_b", from: "pair_ab", to: "star_b" },
          { id: "pair_cd:star_c", from: "pair_cd", to: "star_c" },
          { id: "pair_cd:star_d", from: "pair_cd", to: "star_d" },
        ],
      };
    case "single":
    default:
      return {
        layoutKey: "single",
        minHeightPx: 190,
        nodes: [{ id: "star_a", kind: "star", x: 50, y: 52 }],
        edges: [],
      };
  }
}

export function buildTopologyMapPairStatusLookup(draftState = {}, topologyHealth = {}) {
  const layers = Array.isArray(topologyHealth?.layers) ? topologyHealth.layers : [];
  const layerById = new Map(layers.map((layer) => [layer.id, layer]));
  const pairStatusLookup = new Map();
  const edgeStatusLookup = new Map();
  const setPairStatus = (pairId, layer) => {
    if (pairId && layer) pairStatusLookup.set(pairId, layer);
  };
  const setEdgeStatus = (edgeId, layer) => {
    if (edgeId && layer) edgeStatusLookup.set(edgeId, layer);
  };

  if (draftState?.topologyKind === "triple") {
    const layer = layerById.get("pair_abc");
    setPairStatus("pair_abc", layer);
    setEdgeStatus("pair_abc:pair_ab", layer);
    setEdgeStatus("pair_abc:star_c", layer);
  } else if (draftState?.topologyKind === "quad") {
    if (normalizeQuadLayoutKind(draftState?.quadLayoutKind) === "paired") {
      const layerAb = layerById.get("pair_root_ab");
      const layerCd = layerById.get("pair_root_cd");
      setPairStatus("pair_ab", layerAb);
      setPairStatus("pair_cd", layerCd);
      setEdgeStatus("pair_root:pair_ab", layerAb);
      setEdgeStatus("pair_root:pair_cd", layerCd);
      const rootLayer =
        [layerAb, layerCd]
          .filter(Boolean)
          .sort(
            (left, right) =>
              (TOPOLOGY_MAP_STATUS_RANK[right?.status] ?? 0) -
              (TOPOLOGY_MAP_STATUS_RANK[left?.status] ?? 0),
          )[0] || null;
      setPairStatus("pair_root", rootLayer);
    } else {
      const layerAbc = layerById.get("pair_abc");
      const layerAbcd = layerById.get("pair_abcd");
      setPairStatus("pair_abc", layerAbc);
      setPairStatus("pair_abcd", layerAbcd);
      setEdgeStatus("pair_abc:pair_ab", layerAbc);
      setEdgeStatus("pair_abc:star_c", layerAbc);
      setEdgeStatus("pair_abcd:pair_abc", layerAbcd);
      setEdgeStatus("pair_abcd:star_d", layerAbcd);
    }
  }

  return { pairStatusLookup, edgeStatusLookup };
}

export function buildTopologyHealthChipLabel(layer, draftState = {}) {
  if (!layer) return "Hierarchy";
  if (
    draftState?.topologyKind === "quad" &&
    normalizeQuadLayoutKind(draftState?.quadLayoutKind) === "paired"
  ) {
    if (layer.id === "pair_root_ab") return "Root vs A+B";
    if (layer.id === "pair_root_cd") return "Root vs C+D";
  }
  return layer.label || "Hierarchy layer";
}

export function buildTopologyMapModel({
  draftState = {},
  topologyHealth = {},
  selectedEditorTargetId = "star_a",
  defaultHostFrameId = "star_a",
} = {}) {
  const layoutDefinition = buildTopologyMapLayoutDefinition(draftState);
  const selectedNodeId = String(selectedEditorTargetId || "");
  const { pairStatusLookup, edgeStatusLookup } = buildTopologyMapPairStatusLookup(
    draftState,
    topologyHealth,
  );
  const nodes = layoutDefinition.nodes.map((node) => {
    const meta =
      node.kind === "star"
        ? buildTopologyMapStarMeta(node.id, draftState)
        : buildTopologyMapPairMeta(node.id, draftState);
    const pairLayer = node.kind === "pair" ? pairStatusLookup.get(node.id) || null : null;
    const selected = selectedNodeId === node.id;
    const defaultHost = defaultHostFrameId === node.id;
    const extraBits = [
      selected ? "currently selected for editing" : "",
      defaultHost ? "current default orbit host" : "",
      pairLayer?.statusLabel ? `guardrail ${pairLayer.statusLabel}` : "",
    ].filter(Boolean);
    return {
      ...node,
      ...meta,
      selected,
      defaultHost,
      status: pairLayer?.status || "",
      statusLabel: pairLayer?.statusLabel || "",
      ariaLabel: `${meta.accessibleLabel}${extraBits.length ? `. ${extraBits.join(". ")}.` : ""}`,
    };
  });
  const nodeIndex = new Map(nodes.map((node) => [node.id, node]));
  const edges = layoutDefinition.edges.map((edge) => ({
    ...edge,
    fromNode: nodeIndex.get(edge.from),
    toNode: nodeIndex.get(edge.to),
    status: edgeStatusLookup.get(edge.id)?.status || "",
  }));
  const chips = [
    {
      id: "overall",
      label: "Hierarchy",
      value: topologyHealth?.statusLabel || "Good",
      status: topologyHealth?.status || "good",
      title: topologyHealth?.headline || "Hierarchy health",
    },
    ...(Array.isArray(topologyHealth?.layers) ? topologyHealth.layers : []).map((layer) => ({
      id: layer.id,
      label: buildTopologyHealthChipLabel(layer, draftState),
      value: layer.statusLabel,
      status: layer.status,
      title: `${layer.headline}. ${layer.summary}`.trim(),
    })),
  ];
  const currentTargetMeta = selectedNodeId
    ? String(selectedNodeId).startsWith("pair_")
      ? buildTopologyMapPairMeta(selectedNodeId, draftState)
      : buildTopologyMapStarMeta(selectedNodeId, draftState)
    : null;
  const defaultHostMeta =
    nodeIndex.get(defaultHostFrameId) ||
    nodes.find((node) => node.id === defaultHostFrameId) ||
    null;
  const summaryText = [
    `Topology map for ${buildTopologyMapLayoutKey(draftState).replace("-", " ")} layout.`,
    currentTargetMeta ? `Current editor focus ${currentTargetMeta.accessibleLabel}.` : "",
    defaultHostMeta ? `Default orbit host ${defaultHostMeta.accessibleLabel}.` : "",
    "Only one node is marked as the current editing focus at a time.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    layoutKey: layoutDefinition.layoutKey,
    minHeightPx: layoutDefinition.minHeightPx,
    nodes,
    edges,
    chips,
    summaryText,
  };
}

export function createStarTopologyModelHelpers({
  buildPairEditorLabel,
  buildStarEditorLabel,
  formatNumber,
  getHostClassValue,
  getPairOrbitDraftSummary,
  getStarDraftState,
  listAvailablePairEditorIds,
  listAvailableStarEditorIds,
  solveStarSummaryModel,
} = {}) {
  function buildEditorTargetDescriptors(draftState = {}, topologyHealth = {}) {
    const { pairStatusLookup } = buildTopologyMapPairStatusLookup(draftState, topologyHealth);
    const starTargets = listAvailableStarEditorIds(draftState).map((starId) => {
      const meta = buildTopologyMapStarMeta(starId, draftState);
      const starDraft = getStarDraftState(starId, draftState);
      const model = solveStarSummaryModel(starId, draftState);
      const roleById = {
        star_a: "Primary star",
        star_b: "Companion star",
        star_c: "Tertiary star",
        star_d: "Quaternary star",
      };
      const hintById = {
        star_a: "Edit the primary star. Shared age, metallicity, and stellar evolution stay above.",
        star_b:
          "Edit the companion star. Shared age, metallicity, and stellar evolution stay above.",
        star_c:
          "Edit the tertiary star. Shared age, metallicity, and stellar evolution stay above.",
        star_d:
          "Edit the quaternary star. Shared age, metallicity, and stellar evolution stay above.",
      };
      return {
        id: starId,
        kind: "star",
        pillLabel: meta.title,
        pillSummary: `${getHostClassValue(model)} · ${formatNumber(starDraft.massMsol, 4)} Msol`,
        summaryTitle: buildStarEditorLabel(starId, draftState),
        summaryMeta: `${roleById[starId] || "Star"} · ${getHostClassValue(model)} · ${formatNumber(starDraft.massMsol, 4)} Msol`,
        summaryHint: hintById[starId] || "Edit this star. Shared system context stays above.",
      };
    });
    const pairTargets = listAvailablePairEditorIds(draftState).map((pairId) => {
      const meta = buildTopologyMapPairMeta(pairId, draftState);
      const orbit = getPairOrbitDraftSummary(pairId, draftState);
      const layer = pairStatusLookup.get(pairId) || null;
      return {
        id: pairId,
        kind: "pair",
        pillLabel: meta.title,
        pillSummary: `${formatNumber(orbit.semiMajorAxisAu, 3)} AU · e ${formatNumber(orbit.eccentricity, 3)}`,
        summaryTitle: buildPairEditorLabel(pairId, draftState),
        summaryMeta: `${formatNumber(orbit.semiMajorAxisAu, 3)} AU · e ${formatNumber(orbit.eccentricity, 3)}${layer?.statusLabel ? ` · ${layer.statusLabel}` : ""}`,
        summaryHint: `Edit the shared orbit for ${meta.accessibleLabel}. Shared age, metallicity, and stellar evolution stay above.`,
        status: layer?.status || "",
        statusLabel: layer?.statusLabel || "",
      };
    });
    return {
      starTargets,
      pairTargets,
      byId: new Map([...starTargets, ...pairTargets].map((target) => [target.id, target])),
    };
  }

  function buildSelectedStarEditorHint(starId = "star_a", draftState = {}) {
    if (starId === "star_a") {
      return "These inputs apply only to the selected primary star. Shared system context lives above.";
    }
    return `These inputs apply only to ${buildStarEditorLabel(starId, draftState)}. Shared age, metallicity, and stellar evolution live above and apply across the home stellar system.`;
  }

  return {
    buildEditorTargetDescriptors,
    buildSelectedStarEditorHint,
  };
}
