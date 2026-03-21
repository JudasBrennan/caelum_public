import { clamp } from "../utils.js";

export const TOPOLOGY_GUARDRAIL_STATUSES = Object.freeze([
  "good",
  "caution",
  "unstable",
  "blocked",
]);

const TOPOLOGY_GUARDRAIL_STATUS_RANK = Object.freeze({
  good: 0,
  caution: 1,
  unstable: 2,
  blocked: 3,
});

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function massRatio(hostMassMsol, companionMassMsol) {
  const hostMass = Math.max(toFiniteNumber(hostMassMsol, 0), 0);
  const companionMass = Math.max(toFiniteNumber(companionMassMsol, 0), 0);
  const totalMass = hostMass + companionMass;
  if (totalMass <= 0) return 0.5;
  return clamp(companionMass / totalMass, 0, 1);
}

function guardrailStatusRank(status = "good") {
  return TOPOLOGY_GUARDRAIL_STATUS_RANK[status] ?? TOPOLOGY_GUARDRAIL_STATUS_RANK.good;
}

function safePositiveNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatAu(value, fallback = "n/a") {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? `${num.toFixed(2)} AU` : fallback;
}

export function topologyGuardrailLabel(status = "good") {
  switch (status) {
    case "blocked":
      return "Blocked";
    case "unstable":
      return "Unstable";
    case "caution":
      return "Caution";
    case "good":
    default:
      return "Good";
  }
}

export function topologyGuardrailHeadline(status = "good") {
  switch (status) {
    case "blocked":
      return "Blocked: inverted hierarchy";
    case "unstable":
      return "Unstable hierarchy";
    case "caution":
      return "Tight hierarchy";
    case "good":
    default:
      return "Comfortably hierarchical";
  }
}

export function calcHierarchicalMinimumOuterSemiMajorAxisAu({
  innerSemiMajorAxisAu,
  outerEccentricity,
  innerMassMsol,
  companionMassMsol,
  mutualInclinationDeg = 0,
}) {
  const innerA = safePositiveNumber(innerSemiMajorAxisAu, 0);
  if (innerA <= 0) return null;
  const eOut = clamp(toFiniteNumber(outerEccentricity, 0), 0, 0.95);
  const outerMassRatio = Math.max(
    0,
    toFiniteNumber(companionMassMsol, 0) / Math.max(toFiniteNumber(innerMassMsol, 0), 0.000001),
  );
  const inclinationFactor = Math.max(
    0.7,
    1 - (0.3 * clamp(toFiniteNumber(mutualInclinationDeg, 0), 0, 180)) / 180,
  );
  const stabilityRatio =
    ((2.8 * (1 + outerMassRatio) ** (2 / 5) * (1 + eOut) ** (2 / 5)) /
      Math.max((1 - eOut) ** (6 / 5), 0.000001)) *
    inclinationFactor;
  return Math.max(innerA, innerA * stabilityRatio);
}

export function assessHierarchyLayer({
  layerId,
  layerLabel,
  innerLabel,
  innerSemiMajorAxisAu,
  innerEccentricity = 0,
  outerSemiMajorAxisAu,
  outerEccentricity = 0,
  innerMassMsol,
  companionMassMsol,
  mutualInclinationDeg = 0,
}) {
  const innerA = safePositiveNumber(innerSemiMajorAxisAu, 0);
  const outerA = safePositiveNumber(outerSemiMajorAxisAu, 0);
  const innerE = clamp(toFiniteNumber(innerEccentricity, 0), 0, 0.95);
  const outerE = clamp(toFiniteNumber(outerEccentricity, 0), 0, 0.95);
  const outerPericenterAu = outerA > 0 ? outerA * (1 - outerE) : null;
  const innerApocenterAu = innerA > 0 ? innerA * (1 + innerE) : null;
  const recommendedOuterAu = calcHierarchicalMinimumOuterSemiMajorAxisAu({
    innerSemiMajorAxisAu: innerA,
    outerEccentricity: outerE,
    innerMassMsol,
    companionMassMsol,
    mutualInclinationDeg,
  });
  const recommendationRatio =
    outerA > 0 && Number.isFinite(recommendedOuterAu) && recommendedOuterAu > 0
      ? outerA / recommendedOuterAu
      : null;

  let status = "good";
  let hardBlocked = false;
  let summary =
    "Comfortably hierarchical. Later host-frame views should stay readable and the outer branch has breathing room.";

  if (!(innerA > 0) || !(outerA > 0)) {
    status = "blocked";
    hardBlocked = true;
    summary =
      "Blocked. Both hierarchy layers need positive semi-major axes before the nested system can be saved.";
  } else if (outerA <= innerA || outerA - innerA <= 0.000001) {
    status = "blocked";
    hardBlocked = true;
    summary = `Blocked. ${layerLabel || "The outer layer"} must sit beyond ${innerLabel || "the inner layer"} before it can be saved.`;
  } else if (
    Number.isFinite(outerPericenterAu) &&
    Number.isFinite(innerApocenterAu) &&
    outerPericenterAu <= innerApocenterAu
  ) {
    status = "unstable";
    summary =
      "Unstable. The outer orbit dives inside the inner layer's span, so later flux and stability behavior will be strongly compromised.";
  } else if (Number.isFinite(recommendedOuterAu) && outerA < recommendedOuterAu) {
    status = "unstable";
    summary =
      "Unstable. The hierarchy is too tight for a comfortable nested solution at the current masses and eccentricity.";
  } else if (Number.isFinite(recommendedOuterAu) && outerA < recommendedOuterAu * 1.6) {
    status = "caution";
    summary =
      "Caution. The hierarchy is technically usable but still fairly tight, so expect stronger outer-star forcing and busier canvases.";
  }

  const detailParts = [];
  if (Number.isFinite(recommendedOuterAu) && recommendedOuterAu > 0) {
    detailParts.push(`Aim for at least ${formatAu(recommendedOuterAu)} with the current masses.`);
  }
  if (Number.isFinite(outerPericenterAu) && Number.isFinite(innerApocenterAu)) {
    detailParts.push(
      `Outer periapsis ${formatAu(outerPericenterAu)} vs inner span ${formatAu(innerApocenterAu)}.`,
    );
  }
  if (Number.isFinite(mutualInclinationDeg) && mutualInclinationDeg > 0.1) {
    detailParts.push(`Mutual tilt ${Number(mutualInclinationDeg).toFixed(1)} deg.`);
  }

  return {
    id: layerId || "layer",
    label: layerLabel || "Hierarchy layer",
    innerLabel: innerLabel || "Inner layer",
    status,
    statusLabel: topologyGuardrailLabel(status),
    headline: topologyGuardrailHeadline(status),
    summary,
    detail: detailParts.join(" "),
    hardBlocked,
    innerSemiMajorAxisAu: innerA,
    outerSemiMajorAxisAu: outerA,
    innerApocenterAu,
    outerPericenterAu,
    recommendedOuterAu,
    recommendationRatio,
    mutualInclinationDeg: clamp(toFiniteNumber(mutualInclinationDeg, 0), 0, 180),
  };
}

export function buildTopologyGuardrailSummary({
  topologyKind = "single",
  quadLayoutKind = "chain",
  primaryMassMsol = 1,
  companionMassMsol = 0.72,
  binarySemiMajorAxisAu = 24,
  binaryEccentricity = 0.2,
  binaryInclinationDeg = 0,
  tertiaryMassMsol = 0.45,
  tripleOuterSemiMajorAxisAu = 180,
  tripleOuterEccentricity = 0.15,
  tripleOuterInclinationDeg = 0,
  quaternaryMassMsol = 0.3,
  quadOuterSemiMajorAxisAu = 600,
  quadOuterEccentricity = 0.15,
  quadOuterInclinationDeg = 0,
  quadSecondarySemiMajorAxisAu = 160,
  quadSecondaryEccentricity = 0.15,
  quadSecondaryInclinationDeg = 0,
} = {}) {
  const normalizedTopologyKind = ["binary", "triple", "quad"].includes(topologyKind)
    ? topologyKind
    : "single";
  const normalizedQuadLayoutKind = quadLayoutKind === "paired" ? "paired" : "chain";
  const layers = [];

  if (normalizedTopologyKind === "triple" || normalizedTopologyKind === "quad") {
    layers.push(
      assessHierarchyLayer({
        layerId: "pair_abc",
        layerLabel: "Outer Pair (A+B)+C",
        innerLabel: "Inner Pair A+B",
        innerSemiMajorAxisAu: binarySemiMajorAxisAu,
        innerEccentricity: binaryEccentricity,
        outerSemiMajorAxisAu: tripleOuterSemiMajorAxisAu,
        outerEccentricity: tripleOuterEccentricity,
        innerMassMsol: toFiniteNumber(primaryMassMsol, 1) + toFiniteNumber(companionMassMsol, 0),
        companionMassMsol: tertiaryMassMsol,
        mutualInclinationDeg: Math.abs(
          toFiniteNumber(binaryInclinationDeg, 0) - toFiniteNumber(tripleOuterInclinationDeg, 0),
        ),
      }),
    );
  }

  if (normalizedTopologyKind === "quad") {
    if (normalizedQuadLayoutKind === "paired") {
      const pairAbMassMsol =
        toFiniteNumber(primaryMassMsol, 1) + toFiniteNumber(companionMassMsol, 0);
      const pairCdMassMsol =
        toFiniteNumber(tertiaryMassMsol, 0) + toFiniteNumber(quaternaryMassMsol, 0);
      layers.push(
        assessHierarchyLayer({
          layerId: "pair_root_ab",
          layerLabel: "Root Pair (A+B)+(C+D)",
          innerLabel: "Inner Pair A+B",
          innerSemiMajorAxisAu: binarySemiMajorAxisAu,
          innerEccentricity: binaryEccentricity,
          outerSemiMajorAxisAu: quadOuterSemiMajorAxisAu,
          outerEccentricity: quadOuterEccentricity,
          innerMassMsol: pairAbMassMsol,
          companionMassMsol: pairCdMassMsol,
          mutualInclinationDeg: Math.abs(
            toFiniteNumber(binaryInclinationDeg, 0) - toFiniteNumber(quadOuterInclinationDeg, 0),
          ),
        }),
      );
      layers.push(
        assessHierarchyLayer({
          layerId: "pair_root_cd",
          layerLabel: "Root Pair (A+B)+(C+D)",
          innerLabel: "Inner Pair C+D",
          innerSemiMajorAxisAu: quadSecondarySemiMajorAxisAu,
          innerEccentricity: quadSecondaryEccentricity,
          outerSemiMajorAxisAu: quadOuterSemiMajorAxisAu,
          outerEccentricity: quadOuterEccentricity,
          innerMassMsol: pairCdMassMsol,
          companionMassMsol: pairAbMassMsol,
          mutualInclinationDeg: Math.abs(
            toFiniteNumber(quadSecondaryInclinationDeg, 0) -
              toFiniteNumber(quadOuterInclinationDeg, 0),
          ),
        }),
      );
    } else {
      layers.push(
        assessHierarchyLayer({
          layerId: "pair_abcd",
          layerLabel: "Outer Pair ((A+B)+C)+D",
          innerLabel: "Outer Pair (A+B)+C",
          innerSemiMajorAxisAu: tripleOuterSemiMajorAxisAu,
          innerEccentricity: tripleOuterEccentricity,
          outerSemiMajorAxisAu: quadOuterSemiMajorAxisAu,
          outerEccentricity: quadOuterEccentricity,
          innerMassMsol:
            toFiniteNumber(primaryMassMsol, 1) +
            toFiniteNumber(companionMassMsol, 0) +
            toFiniteNumber(tertiaryMassMsol, 0),
          companionMassMsol: quaternaryMassMsol,
          mutualInclinationDeg: Math.abs(
            toFiniteNumber(tripleOuterInclinationDeg, 0) -
              toFiniteNumber(quadOuterInclinationDeg, 0),
          ),
        }),
      );
    }
  }

  if (!layers.length) {
    return {
      topologyKind: normalizedTopologyKind,
      status: "good",
      statusLabel: normalizedTopologyKind === "binary" ? "Binary-only" : "Single-star",
      headline: normalizedTopologyKind === "binary" ? "Binary-only layout" : "Single-star layout",
      summary:
        normalizedTopologyKind === "binary"
          ? "Binary-only layout. No outer hierarchy layer needs validation yet."
          : "Single-star layout. No hierarchy guardrails are needed.",
      blocked: false,
      layers: [],
    };
  }

  const worstLayer = [...layers].sort(
    (left, right) => guardrailStatusRank(right.status) - guardrailStatusRank(left.status),
  )[0];
  const status = worstLayer?.status || "good";
  let summary = "The hierarchy looks comfortably separated.";
  if (status === "blocked") {
    summary =
      "One outer layer is inverted relative to the layer below it. Widen the outer orbit before saving the topology.";
  } else if (status === "unstable") {
    summary =
      "At least one outer layer is too tight for a comfortable nested hierarchy. Later host-frame views will be much harder to keep stable and readable.";
  } else if (status === "caution") {
    summary =
      "The hierarchy is usable but still tight. Expect stronger outer-star forcing and less forgiving multistar layouts.";
  } else {
    summary =
      "The outer layers are comfortably separated, so later host-frame views should stay readable and the nested topology has healthier margins.";
  }

  return {
    topologyKind: normalizedTopologyKind,
    quadLayoutKind: normalizedQuadLayoutKind,
    status,
    statusLabel: topologyGuardrailLabel(status),
    headline: topologyGuardrailHeadline(status),
    summary,
    blocked: layers.some((layer) => layer.hardBlocked),
    layers,
  };
}

export function calcHolmanWiegertSTypeCriticalOuterAu({
  binarySemiMajorAxisAu,
  eccentricity,
  hostMassMsol,
  companionMassMsol,
}) {
  const aBinary = Math.max(toFiniteNumber(binarySemiMajorAxisAu, 0), 0);
  if (aBinary <= 0) return null;
  const eBinary = clamp(toFiniteNumber(eccentricity, 0), 0, 0.95);
  const mu = massRatio(hostMassMsol, companionMassMsol);
  const coefficient =
    0.464 -
    0.38 * mu -
    0.631 * eBinary +
    0.586 * mu * eBinary +
    0.15 * eBinary ** 2 -
    0.198 * mu * eBinary ** 2;
  return Math.max(0, coefficient * aBinary);
}

export function calcHolmanWiegertPTypeCriticalInnerAu({
  binarySemiMajorAxisAu,
  eccentricity,
  primaryMassMsol,
  secondaryMassMsol,
}) {
  const aBinary = Math.max(toFiniteNumber(binarySemiMajorAxisAu, 0), 0);
  if (aBinary <= 0) return null;
  const eBinary = clamp(toFiniteNumber(eccentricity, 0), 0, 0.95);
  const mu = massRatio(primaryMassMsol, secondaryMassMsol);
  const coefficient =
    1.6 +
    5.1 * eBinary -
    2.22 * eBinary ** 2 +
    4.12 * mu -
    4.27 * mu * eBinary -
    5.09 * mu ** 2 +
    4.61 * mu ** 2 * eBinary ** 2;
  return Math.max(0, coefficient * aBinary);
}

export function calcCircumstellarDiskTruncationAu({ binarySemiMajorAxisAu, eccentricity }) {
  const aBinary = Math.max(toFiniteNumber(binarySemiMajorAxisAu, 0), 0);
  if (aBinary <= 0) return null;
  const eBinary = clamp(toFiniteNumber(eccentricity, 0), 0, 0.95);
  return Math.max(0, 0.3 * aBinary * (1 - eBinary));
}

export function calcCircumbinaryDiskInnerEdgeAu({ binarySemiMajorAxisAu, eccentricity }) {
  const aBinary = Math.max(toFiniteNumber(binarySemiMajorAxisAu, 0), 0);
  if (aBinary <= 0) return null;
  const eBinary = clamp(toFiniteNumber(eccentricity, 0), 0, 0.95);
  return Math.max(0, 2 * aBinary * (1 + eBinary));
}

export function buildStarFrameStability({
  systemModel,
  binarySemiMajorAxisAu,
  eccentricity,
  hostMassMsol,
  companionMassMsol,
}) {
  const criticalOuterAu = calcHolmanWiegertSTypeCriticalOuterAu({
    binarySemiMajorAxisAu,
    eccentricity,
    hostMassMsol,
    companionMassMsol,
  });
  const diskTruncationAu = calcCircumstellarDiskTruncationAu({
    binarySemiMajorAxisAu,
    eccentricity,
  });
  const warnings = [];
  if (Number.isFinite(criticalOuterAu) && criticalOuterAu > 0) {
    warnings.push(`Circumstellar stability limit near ${criticalOuterAu.toFixed(2)} AU.`);
  }
  if (Number.isFinite(diskTruncationAu) && diskTruncationAu > 0) {
    warnings.push(`Circumstellar disk truncation near ${diskTruncationAu.toFixed(2)} AU.`);
  }
  return {
    modelVersion: "binary-stability-v1",
    criticalInnerAu: systemModel.systemInnerLimitAu,
    criticalOuterAu,
    diskTruncationAu,
    stable: true,
    warnings,
  };
}

export function buildPairFrameStability({
  systemModel,
  binarySemiMajorAxisAu,
  eccentricity,
  primaryMassMsol,
  secondaryMassMsol,
}) {
  const circumbinaryCriticalInnerAu = calcHolmanWiegertPTypeCriticalInnerAu({
    binarySemiMajorAxisAu,
    eccentricity,
    primaryMassMsol,
    secondaryMassMsol,
  });
  const diskInnerEdgeAu = calcCircumbinaryDiskInnerEdgeAu({
    binarySemiMajorAxisAu,
    eccentricity,
  });
  const criticalInnerAu = Math.max(
    systemModel.systemInnerLimitAu,
    circumbinaryCriticalInnerAu || 0,
    diskInnerEdgeAu || 0,
  );
  const warnings = [];
  if (Number.isFinite(circumbinaryCriticalInnerAu) && circumbinaryCriticalInnerAu > 0) {
    warnings.push(
      `Circumbinary stability starts near ${circumbinaryCriticalInnerAu.toFixed(2)} AU.`,
    );
  }
  if (Number.isFinite(diskInnerEdgeAu) && diskInnerEdgeAu > 0) {
    warnings.push(`Circumbinary inner disk edge near ${diskInnerEdgeAu.toFixed(2)} AU.`);
  }
  return {
    modelVersion: "binary-stability-v1",
    criticalInnerAu,
    criticalOuterAu: null,
    diskTruncationAu: null,
    circumbinaryInnerEdgeAu: diskInnerEdgeAu,
    stable: true,
    warnings,
  };
}

export function buildHierarchicalOuterStability({
  hostNodeId,
  topology,
  pairsById,
  nodeMassesById,
  nodeLabelsById = {},
}) {
  const ancestorPairIds = Array.isArray(topology?.ancestorPairIdsByNodeId?.[hostNodeId])
    ? topology.ancestorPairIdsByNodeId[hostNodeId]
    : [];
  const constraints = [];
  let currentNodeId = hostNodeId;

  for (const pairId of ancestorPairIds) {
    const pair = pairsById?.[pairId];
    if (!pair) {
      currentNodeId = pairId;
      continue;
    }
    const companionNode =
      pair.childA?.id === currentNodeId
        ? pair.childB
        : pair.childB?.id === currentNodeId
          ? pair.childA
          : null;
    const hostMassMsol = Number(nodeMassesById?.[currentNodeId] || 0);
    const companionMassMsol = Number(nodeMassesById?.[companionNode?.id] || 0);
    const criticalOuterAu = calcHolmanWiegertSTypeCriticalOuterAu({
      binarySemiMajorAxisAu: pair.semiMajorAxisAu,
      eccentricity: pair.eccentricity,
      hostMassMsol,
      companionMassMsol,
    });
    const diskTruncationAu = calcCircumstellarDiskTruncationAu({
      binarySemiMajorAxisAu: pair.semiMajorAxisAu,
      eccentricity: pair.eccentricity,
    });
    constraints.push({
      pairId,
      companionNodeId: companionNode?.id || null,
      companionLabel:
        nodeLabelsById?.[companionNode?.id] || String(companionNode?.id || "companion branch"),
      criticalOuterAu,
      diskTruncationAu,
      eccentricity: toFiniteNumber(pair.eccentricity, 0),
    });
    currentNodeId = pairId;
  }

  const criticalOuterValues = constraints
    .map((constraint) => Number(constraint.criticalOuterAu))
    .filter((value) => Number.isFinite(value) && value > 0);
  const diskTruncationValues = constraints
    .map((constraint) => Number(constraint.diskTruncationAu))
    .filter((value) => Number.isFinite(value) && value > 0);
  const warnings = [];

  for (const constraint of constraints) {
    if (Number.isFinite(constraint.criticalOuterAu) && constraint.criticalOuterAu > 0) {
      warnings.push(
        `Outer stability vs ${constraint.companionLabel} near ${constraint.criticalOuterAu.toFixed(2)} AU.`,
      );
    }
    if (Number.isFinite(constraint.diskTruncationAu) && constraint.diskTruncationAu > 0) {
      warnings.push(
        `Outer disk truncation vs ${constraint.companionLabel} near ${constraint.diskTruncationAu.toFixed(2)} AU.`,
      );
    }
  }

  return {
    criticalOuterAu: criticalOuterValues.length ? Math.min(...criticalOuterValues) : null,
    diskTruncationAu: diskTruncationValues.length ? Math.min(...diskTruncationValues) : null,
    warnings,
    constraints,
  };
}
