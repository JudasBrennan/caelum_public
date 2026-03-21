function toPresentationStar(starContext, extras = {}) {
  if (!starContext) return null;
  const radiusRsol = Number(starContext.model?.radiusRsol || 0);
  return {
    id: starContext.id,
    name: starContext.component?.name || starContext.id,
    massMsol: Number(starContext.config?.massMsol || 0),
    ageGyr: Number(starContext.config?.ageGyr || 0),
    metallicityFeH: Number(starContext.config?.metallicityFeH || 0),
    tempK: Number(starContext.model?.tempK || 0),
    luminosityLsol: Number(starContext.model?.luminosityLsol || 0),
    radiusRsol,
    radiusKm: radiusRsol * 696340,
    starColourHex: String(starContext.model?.starColourHex || "").trim() || "#fff0d0",
    ...extras,
  };
}

export function listCompanionStarsForHostFrame(homeSystemContext, hostFrameId) {
  const hostFrame = homeSystemContext?.hostFramesById?.[hostFrameId] || null;
  const branches = Array.isArray(hostFrame?.companionBranches) ? hostFrame.companionBranches : [];
  if (!branches.length) return [];

  return branches
    .flatMap((branch) =>
      (branch.companionStarIds || []).map((starId) => {
        const starContext = homeSystemContext?.starsById?.[starId] || null;
        const separationAu = Number(branch?.separationSummaryAu?.mean);
        const eccentricity = Number(branch?.eccentricity);
        return toPresentationStar(starContext, {
          parentPairId: branch.pairId || null,
          companionNodeId: branch.companionNodeId || null,
          companionLabel: branch.label || null,
          hierarchyLevel: Number(branch.hierarchyLevel || 1),
          separationAu: Number.isFinite(separationAu) && separationAu > 0 ? separationAu : null,
          eccentricity: Number.isFinite(eccentricity) ? eccentricity : 0,
          skyRole: "companion",
        });
      }),
    )
    .filter(Boolean);
}

function compareHierarchyBranches(left, right) {
  const leftLevel = Number(left?.hierarchyLevel || 0);
  const rightLevel = Number(right?.hierarchyLevel || 0);
  if (leftLevel !== rightLevel) return leftLevel - rightLevel;
  const leftSeparation = Number(left?.separationAu);
  const rightSeparation = Number(right?.separationAu);
  if (Number.isFinite(leftSeparation) && Number.isFinite(rightSeparation)) {
    if (leftSeparation !== rightSeparation) return leftSeparation - rightSeparation;
  } else if (Number.isFinite(leftSeparation)) {
    return -1;
  } else if (Number.isFinite(rightSeparation)) {
    return 1;
  }
  return String(left?.label || "").localeCompare(String(right?.label || ""));
}

export function groupCompanionStarsByBranch(companionStars = []) {
  const groups = new Map();

  for (let index = 0; index < companionStars.length; index += 1) {
    const entry = companionStars[index];
    if (!entry) continue;
    const key =
      entry.companionNodeId ||
      entry.parentPairId ||
      `${Number(entry.hierarchyLevel || 1)}:${entry.companionLabel || entry.name || index}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        label: entry.companionLabel || entry.name || `Branch ${groups.size + 1}`,
        hierarchyLevel: Number(entry.hierarchyLevel || 1),
        separationAu:
          Number.isFinite(Number(entry.separationAu)) && Number(entry.separationAu) > 0
            ? Number(entry.separationAu)
            : null,
        eccentricity: Number.isFinite(Number(entry.eccentricity)) ? Number(entry.eccentricity) : 0,
        stars: [],
      });
    }
    const group = groups.get(key);
    group.stars.push(entry);
    if (!group.label && entry.name) group.label = entry.name;
    if (
      !Number.isFinite(Number(group.separationAu)) &&
      Number.isFinite(Number(entry.separationAu))
    ) {
      group.separationAu = Number(entry.separationAu);
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      starNames: group.stars.map((entry) => entry?.name).filter(Boolean),
      representativeStar: group.stars[0] || null,
    }))
    .sort(compareHierarchyBranches);
}

export function buildHierarchyPresentation({
  topologyKind = "single",
  hostFrame = null,
  hostStars = [],
  companionStars = [],
  fallbackLocalLabel = "Host frame",
} = {}) {
  const localStars = (Array.isArray(hostStars) ? hostStars : []).filter(Boolean);
  const outerBranches = groupCompanionStarsByBranch(companionStars);
  const localFrameLabel = String(hostFrame?.label || fallbackLocalLabel || "Host frame").trim();
  const isHierarchical = topologyKind === "triple" || topologyKind === "quad";
  const isPairHost = hostFrame?.frameKind === "pair" || localStars.length > 1;
  const localClimateDrivers = localStars.map((entry) => entry?.name).filter(Boolean);
  const outerContextLabels = outerBranches.map((branch) => branch.label).filter(Boolean);
  const hierarchyNodes = [
    {
      kind: "local",
      id: hostFrame?.id || "local",
      label: localFrameLabel || "Local host frame",
      hierarchyLevel: 0,
      stars: localStars,
    },
    ...outerBranches.map((branch) => ({
      kind: "outer",
      id: branch.id,
      label: branch.label,
      hierarchyLevel: branch.hierarchyLevel,
      stars: branch.stars,
    })),
  ];

  return {
    isHierarchical,
    isPairHost,
    localFrameId: hostFrame?.id || null,
    localFrameLabel: localFrameLabel || "Local host frame",
    localFrameKind: hostFrame?.frameKind || (isPairHost ? "pair" : "star"),
    localStars,
    localClimateDrivers,
    outerBranches,
    outerContextLabels,
    hierarchyNodes,
    breadcrumb:
      hierarchyNodes
        .map((entry) => String(entry?.label || "").trim())
        .filter(Boolean)
        .join(" -> ") ||
      localFrameLabel ||
      "Host frame",
    notToScale: isHierarchical && outerBranches.length > 0,
  };
}

export function listHostStarsForHostFrame(homeSystemContext, hostFrameId) {
  const hostFrame = homeSystemContext?.hostFramesById?.[hostFrameId] || null;
  if (!hostFrame) return [];

  if (hostFrame.frameKind === "star") {
    const starContext = homeSystemContext?.starsById?.[hostFrame.id] || null;
    return starContext
      ? [
          toPresentationStar(starContext, {
            barycentricOrbitAu: 0,
            pairSeparationAu: null,
            skyRole: "host",
          }),
        ]
      : [];
  }

  if (hostFrame.frameKind !== "pair") return [];
  const pairContext = homeSystemContext?.pairsById?.[hostFrame.id] || null;
  const separationAu = Number(pairContext?.semiMajorAxisAu);
  const eccentricity = Number(pairContext?.eccentricity);
  const starIds = Array.isArray(pairContext?.starIds) ? pairContext.starIds : [];
  const totalMassMsol = starIds.reduce(
    (sum, starId) => sum + Number(homeSystemContext?.starsById?.[starId]?.config?.massMsol || 0),
    0,
  );

  return starIds
    .map((starId) => {
      const starContext = homeSystemContext?.starsById?.[starId] || null;
      if (!starContext) return null;
      const selfMassMsol = Number(starContext.config?.massMsol || 0);
      const companionMassMsol = Math.max(totalMassMsol - selfMassMsol, 0);
      const barycentricOrbitAu =
        Number.isFinite(separationAu) && separationAu > 0 && totalMassMsol > 0
          ? (separationAu * companionMassMsol) / totalMassMsol
          : 0;
      return toPresentationStar(starContext, {
        pairId: pairContext?.id || hostFrame.id,
        pairSemiMajorAxisAu:
          Number.isFinite(separationAu) && separationAu > 0 ? separationAu : null,
        barycentricOrbitAu,
        pairSeparationAu: Number.isFinite(separationAu) && separationAu > 0 ? separationAu : null,
        eccentricity: Number.isFinite(eccentricity) ? eccentricity : 0,
        inclinationDeg: Number.isFinite(Number(pairContext?.inclinationDeg))
          ? Number(pairContext.inclinationDeg)
          : 0,
        argPeriapsisDeg: Number.isFinite(Number(pairContext?.argPeriapsisDeg))
          ? Number(pairContext.argPeriapsisDeg)
          : 0,
        meanAnomalyDeg: Number.isFinite(Number(pairContext?.meanAnomalyDeg))
          ? Number(pairContext.meanAnomalyDeg)
          : 0,
        skyRole: "pair-host",
      });
    })
    .filter(Boolean);
}
