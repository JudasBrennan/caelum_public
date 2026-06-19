import { calcSystem } from "../../engine/system.js";
import { calcStar, starColourHexFromTempK } from "../../engine/star.js";
import { calcPlanetExact } from "../../engine/planet.js";
import { calcPlanetaryBody } from "../../engine/planetaryBody.js";
import { classifyPlanetaryBody } from "../../engine/planetaryClassification.js";
import {
  classifyPlanetarySubtypes,
  derivePlanetaryDescriptors,
  selectPrimaryPlanetarySubtype,
} from "../../engine/planetarySubtypes.js";
import { calcMoonExact } from "../../engine/moon.js";
import { calcComet } from "../../engine/comet.js";
import { calcGasGiant } from "../../engine/gasGiant.js";
import { buildBrownDwarfStarVisual } from "../../engine/brownDwarfVisual.js";
import {
  buildHierarchyPresentation,
  listCompanionStarsForHostFrame,
  listHostStarsForHostFrame,
} from "../../engine/homeSystem/companionPresentation.js";
import { resolveGasGiantRingState } from "../../engine/planetaryRings.js";
import { computeStellarActivityModel } from "../../engine/stellarActivity.js";
import {
  classifyCompanionRegimeByMass,
  normalizeGiantCompanionClass,
  regimeDisplayLabel,
} from "../../engine/substellarRegime.js";
import { buildSmallBodyReservoirContextForWorld } from "../../engine/smallBodyReservoirRouting.js";
import { clamp } from "../../engine/utils.js";
import {
  GAS_GIANT_RADIUS_MAX_RJ,
  GAS_GIANT_RADIUS_MIN_RJ,
  listMoons,
  listPlanetaryBodies,
  listSystemComets,
  listSystemDebrisDisks,
  listSystemGasGiants,
  buildWorldHomeSystemContext,
  getProjectedPrimaryStar,
  resolveWorldHostFrameContext,
} from "../store.js";
import { computeGasGiantVisualProfile, suggestStyles } from "../gasGiantStyles.js";
import { computeRockyVisualProfile } from "../rockyPlanetStyles.js";
import { resolveRingAppearance } from "../ringAppearanceProfiles.js";
import {
  applySubtypeVisualHintsToRockyProfile,
  buildSubtypeVisualDescriptor,
  resolveSubtypeEnvelopeStyle,
} from "../planet/subtypeVisualHints.js";
import { resolvePlanetaryVisualDescriptor } from "../planetaryVisual/descriptor.js";
import {
  MOON_RADIUS_KM,
  SOL_RADIUS_KM,
  representativeGasBaseRadiusPx,
  representativePlanetBaseRadiusPx,
} from "./scaleMath.js";
import { buildOffscaleZoneInfo } from "./projectionMath.js";

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function filterBodiesForHostFrame(entries, hostFrameId, fallbackHostFrameId) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  return (entries || []).filter(
    (entry) => normalizeHostFrameId(entry?.hostFrameId, fallbackHostFrameId) === targetHostFrameId,
  );
}

function formatHostFrameOptionLabel(hostFrame) {
  if (!hostFrame) return "Host frame";
  const scopeLabel =
    hostFrame.frameKind === "pair"
      ? "circumbinary"
      : hostFrame.orbitFamilyKind === "single"
        ? "single-star"
        : "circumstellar";
  return `${hostFrame.label} - ${scopeLabel}`;
}

function createEmptyOverviewBodyCounts() {
  return {
    rockyPlanets: 0,
    volatilePlanets: 0,
    gasGiants: 0,
    brownDwarfs: 0,
    debrisDisks: 0,
    total: 0,
  };
}

function isVolatilePlanetClassification(classification) {
  return (
    classification?.solverFamily === "volatile" &&
    ["miniNeptune", "volatileCandidate"].includes(classification?.family)
  );
}

function titleCaseSubtype(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildSubtypeSummaryFromClassification(classification, primarySubtype = null) {
  const rawSubtypes = Array.isArray(classification?.subtypes) ? classification.subtypes : [];
  const subtypes = rawSubtypes
    .map((subtype) => {
      const id = String(subtype?.id || "").trim();
      if (!id) return null;
      return {
        id,
        label: String(subtype?.label || "").trim() || titleCaseSubtype(id),
        confidence: subtype?.confidence || "unknown",
        applicability: subtype?.applicability || "",
      };
    })
    .filter(Boolean);
  if (!subtypes.length) return null;
  const primarySubtypeId =
    String(classification?.primarySubtypeId || primarySubtype?.id || "").trim() || subtypes[0].id;
  const selectedSubtype =
    subtypes.find((subtype) => subtype.id === primarySubtypeId) || subtypes[0];
  return {
    primarySubtypeId: selectedSubtype.id,
    primarySubtypeLabel: selectedSubtype.label,
    subtypes,
  };
}

function buildSolvedSubtypeModel(body, broadClassification, solvedModel, context) {
  const descriptors = derivePlanetaryDescriptors({
    body,
    classification: broadClassification,
    solvedModel,
    context,
  });
  const subtypes = classifyPlanetarySubtypes({
    body,
    classification: broadClassification,
    solvedModel,
    context,
  });
  const primarySubtype = selectPrimaryPlanetarySubtype(subtypes, broadClassification);
  const classification = {
    ...broadClassification,
    scale: descriptors.scale,
    boundaryTraits: descriptors.boundaryTraits,
    durableFamily: descriptors.durableFamily,
    legacyFamily: descriptors.legacyFamily,
    descriptorModelVersion: descriptors.modelVersion,
    subtypes,
    primarySubtypeId: primarySubtype?.id || null,
  };
  return {
    id: body?.id ?? null,
    name: body?.name || body?.id || "Planetary body",
    classification,
    descriptors,
    subtypes,
    primarySubtype,
    legacy: {
      rockyModel: solvedModel,
      gasGiantModel: null,
      volatileModel: null,
    },
  };
}

function normalizeHexColour(value) {
  let hex = String(value ?? "").trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return null;
  if (!hex.startsWith("#")) hex = `#${hex}`;
  return hex;
}

function ensureOverviewBodyCounts(countsByHostFrameId, hostFrameId) {
  if (!hostFrameId) return createEmptyOverviewBodyCounts();
  if (!countsByHostFrameId[hostFrameId]) {
    countsByHostFrameId[hostFrameId] = createEmptyOverviewBodyCounts();
  }
  return countsByHostFrameId[hostFrameId];
}

function classifyGiantCompanionValue(entry) {
  const explicitClass = String(entry?.companionClass || "").trim();
  if (explicitClass) return normalizeGiantCompanionClass(explicitClass);
  const regime = classifyCompanionRegimeByMass({ massMjup: entry?.massMjup });
  return regime === "brownDwarf" ? "brownDwarf" : "gasGiant";
}

function defaultGiantCompanionName(entry, idx) {
  const classLabel = regimeDisplayLabel(classifyGiantCompanionValue(entry));
  return `${classLabel} ${idx + 1}`;
}

function resolveGiantCompanionStyle(rawStyle, gasCalc, companionClass) {
  const explicitStyle = String(rawStyle || "").trim();
  const brownDwarfStyleFamily = /^(brown-dwarf-|cloudless$|helium$|silicate$|alkali$)/i;
  if (explicitStyle) {
    if (!(companionClass === "brownDwarf" && !brownDwarfStyleFamily.test(explicitStyle))) {
      return explicitStyle;
    }
  }
  const suggestedStyle =
    gasCalc && (gasCalc.classification || gasCalc.regime || gasCalc.companionClass)
      ? suggestStyles(gasCalc)?.primary
      : null;
  if (suggestedStyle) return suggestedStyle;
  return companionClass === "brownDwarf" ? "brown-dwarf-l" : "jupiter";
}

function buildOverviewBodyCounts(world, fallbackHostFrameId) {
  const countsByHostFrameId = Object.create(null);

  for (const body of listPlanetaryBodies(world)) {
    const hostFrameId = normalizeHostFrameId(body?.hostFrameId, fallbackHostFrameId);
    if (!hostFrameId) continue;
    const counts = ensureOverviewBodyCounts(countsByHostFrameId, hostFrameId);
    const classification = body?.classification || classifyPlanetaryBody(body);
    if (classification?.family === "brownDwarf") {
      counts.brownDwarfs += 1;
    } else if (["gasGiant", "iceGiant"].includes(classification?.family)) {
      counts.gasGiants += 1;
    } else if (isVolatilePlanetClassification(classification)) {
      counts.volatilePlanets += 1;
    } else {
      counts.rockyPlanets += 1;
    }
    counts.total += 1;
  }

  for (const disk of listSystemDebrisDisks(world, { fallbackHostFrameId })) {
    const hostFrameId = normalizeHostFrameId(disk?.hostFrameId, fallbackHostFrameId);
    if (!hostFrameId) continue;
    const counts = ensureOverviewBodyCounts(countsByHostFrameId, hostFrameId);
    counts.debrisDisks += 1;
    counts.total += 1;
  }

  return countsByHostFrameId;
}

function buildOverviewActivePathNodeIds(graph, activeHostFrameId) {
  const rootNodeId = normalizeHostFrameId(graph?.rootNodeId, null);
  const resolvedActiveHostFrameId = normalizeHostFrameId(activeHostFrameId, rootNodeId);
  if (!rootNodeId) return resolvedActiveHostFrameId ? [resolvedActiveHostFrameId] : [];
  if (!resolvedActiveHostFrameId || !graph?.nodesById?.[resolvedActiveHostFrameId])
    return [rootNodeId];

  const path = [];
  const seen = new Set();
  let currentNodeId = resolvedActiveHostFrameId;
  while (currentNodeId && !seen.has(currentNodeId)) {
    path.unshift(currentNodeId);
    if (currentNodeId === rootNodeId) break;
    seen.add(currentNodeId);
    currentNodeId = graph?.parentNodeIdByNodeId?.[currentNodeId] || null;
  }
  if (path[0] !== rootNodeId) path.unshift(rootNodeId);
  return path;
}

function resolveOverviewNodeColor(nodeId, graphNode, homeSystemContext) {
  if (graphNode?.kind === "star") {
    return (
      String(homeSystemContext?.starsById?.[nodeId]?.model?.starColourHex || "").trim() || "#ffe9c0"
    );
  }

  const pairContext = homeSystemContext?.pairsById?.[nodeId] || null;
  const dominantStarId = pairContext?.dominantStarId || graphNode?.starIds?.[0] || null;
  return (
    String(homeSystemContext?.starsById?.[dominantStarId]?.model?.starColourHex || "").trim() ||
    "#dbe7ff"
  );
}

function buildOverviewShortLabel(graphNode, homeSystemContext) {
  if (!graphNode) return "Host frame";
  if (graphNode.kind === "star") return graphNode.label;
  const childLabels = (graphNode.childIds || [])
    .map((childId) => homeSystemContext?.hostFramesById?.[childId]?.label || childId)
    .filter(Boolean);
  if (childLabels.length === 2) return `${childLabels[0]} + ${childLabels[1]}`;
  return graphNode.label;
}

function buildOverviewModel(
  world,
  homeSystemContext,
  { activeHostFrameId, topologyKind, fallbackHostFrameId },
) {
  const graph = homeSystemContext?.topologyGraph || null;
  if (!graph?.rootNodeId || !graph?.nodesById) return null;

  const activePathNodeIds = buildOverviewActivePathNodeIds(graph, activeHostFrameId);
  const activePathNodeIdSet = new Set(activePathNodeIds);
  const bodyCountsByHostFrameId = buildOverviewBodyCounts(world, fallbackHostFrameId);
  const nodes = (graph.nodeIdsInPreorder || [])
    .map((nodeId) => {
      const graphNode = graph.nodesById?.[nodeId] || null;
      if (!graphNode) return null;
      const bodyCounts = bodyCountsByHostFrameId[nodeId]
        ? { ...bodyCountsByHostFrameId[nodeId] }
        : createEmptyOverviewBodyCounts();
      const pairContext = homeSystemContext?.pairsById?.[nodeId] || null;
      return {
        id: nodeId,
        kind: graphNode.kind,
        label: graphNode.label,
        shortLabel: buildOverviewShortLabel(graphNode, homeSystemContext),
        depth: graphNode.depth,
        parentId: graphNode.parentId,
        childIds: [...(graphNode.childIds || [])],
        starIds: [...(graphNode.starIds || [])],
        selectable: !!homeSystemContext?.hostFramesById?.[nodeId],
        isActive: nodeId === activeHostFrameId,
        isOnActivePath: activePathNodeIdSet.has(nodeId),
        displayColorHex: resolveOverviewNodeColor(nodeId, graphNode, homeSystemContext),
        separationAu:
          Number.isFinite(Number(pairContext?.semiMajorAxisAu)) &&
          Number(pairContext?.semiMajorAxisAu) > 0
            ? Number(pairContext.semiMajorAxisAu)
            : null,
        bodyCounts,
      };
    })
    .filter(Boolean);
  const nodesById = Object.create(null);
  for (const node of nodes) nodesById[node.id] = node;
  const edges = (graph.edges || []).map((edge) => ({
    parentId: edge.parentId,
    childId: edge.childId,
    isOnActivePath: activePathNodeIdSet.has(edge.parentId) && activePathNodeIdSet.has(edge.childId),
  }));
  const totalBodies = nodes.reduce((sum, node) => sum + Number(node?.bodyCounts?.total || 0), 0);

  return {
    topologyKind,
    rootNodeId: graph.rootNodeId,
    activeHostFrameId,
    activePathNodeIds,
    notToScale: true,
    nodeIdsInPreorder: [...(graph.nodeIdsInPreorder || [])],
    nodeIdsByDepth: (graph.nodeIdsByDepth || []).map((lane) => [...(lane || [])]),
    nodes,
    nodesById,
    edges,
    legend: {
      selectedLabel:
        String(homeSystemContext?.hostFramesById?.[activeHostFrameId]?.label || "").trim() ||
        String(nodesById?.[activeHostFrameId]?.label || "").trim() ||
        "Host frame",
      totalBodies,
      hasBodies: totalBodies > 0,
    },
  };
}

export function buildVisualizerSnapshot(world, options = {}) {
  const { debug = {}, hashUnit = () => 0, hostFrameId: requestedHostFrameId = null } = options;
  const { enabled = false, log = () => {}, logThrottled = () => {} } = debug;
  const primaryStar = getProjectedPrimaryStar(world);
  const homeSystemContext = buildWorldHomeSystemContext(world);
  const primaryStarContext =
    homeSystemContext?.starsById?.[homeSystemContext?.primaryStarId] || null;
  const fallbackHostFrameId =
    homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || "star_a";
  const solveContext = resolveWorldHostFrameContext(
    world,
    normalizeHostFrameId(requestedHostFrameId, fallbackHostFrameId),
    homeSystemContext,
  );
  const activeHostFrameId = normalizeHostFrameId(solveContext?.hostFrameId, fallbackHostFrameId);
  const activeHostFrame =
    solveContext?.hostFrame || homeSystemContext?.hostFramesById?.[activeHostFrameId];
  const starConfig = solveContext?.starConfig || {};
  const starCalc =
    solveContext?.starModel ||
    calcStar({
      massMsol: Number(starConfig?.massMsol) || Number(primaryStar?.massMsol) || 1,
      ageGyr: Number(starConfig?.ageGyr) || Number(primaryStar?.ageGyr) || 4.6,
      radiusRsolOverride: starConfig?.radiusRsolOverride ?? null,
      luminosityLsolOverride: starConfig?.luminosityLsolOverride ?? null,
      tempKOverride: starConfig?.tempKOverride ?? null,
      metallicityFeH:
        Number(starConfig?.metallicityFeH) || Number(primaryStar?.metallicityFeH) || 0,
      evolutionMode: starConfig?.evolutionMode || primaryStar?.evolutionMode || "zams",
    });
  const starName =
    String(
      solveContext?.starContext?.component?.name ||
        activeHostFrame?.label ||
        primaryStarContext?.component?.name ||
        primaryStar?.name ||
        "",
    ).trim() || "Star";
  const starMassMsol =
    Number.isFinite(Number(starConfig?.massMsol)) && Number(starConfig?.massMsol) > 0
      ? Number(starConfig.massMsol)
      : Number(primaryStar?.massMsol) || 0.8653;
  const starAgeGyr =
    Number.isFinite(Number(starConfig?.ageGyr)) && Number(starConfig?.ageGyr) >= 0
      ? Number(starConfig.ageGyr)
      : Number(primaryStar?.ageGyr) || 6.254;
  const starMetallicityFeH = Number.isFinite(Number(starConfig?.metallicityFeH))
    ? Number(starConfig.metallicityFeH)
    : Number(primaryStar?.metallicityFeH) || 0;
  const starTempK = Number(starCalc?.tempK);
  const starLuminosityLsun = Number(starCalc?.luminosityLsol);
  const starRadiusRsol = Math.max(0.01, Number(starCalc?.radiusRsol) || 1);
  const starRadiusKmRaw = Number(starCalc?.metric?.radiusKm);
  const starRadiusKm =
    Number.isFinite(starRadiusKmRaw) && starRadiusKmRaw > 0
      ? starRadiusKmRaw
      : starRadiusRsol * SOL_RADIUS_KM;
  const starColourHex = String(starCalc?.starColourHex || starColourHexFromTempK(starTempK));
  const activityModelVersion =
    solveContext?.starContext?.component?.activityModelVersion === "v1" ? "v1" : "v2";
  const activityModel = computeStellarActivityModel(
    {
      teffK: starTempK,
      ageGyr: starAgeGyr,
      massMsun: starMassMsol,
      luminosityLsun: starLuminosityLsun,
      rotationPeriodDays: starCalc?.stellarEnvironment?.rotation?.periodDays,
      rossbyNumber: starCalc?.stellarEnvironment?.rotation?.rossbyNumber,
    },
    { activityCycle: 0.5 },
  );
  const flareParams = activityModel.activity;
  const n32 = Math.max(0, Number(flareParams?.N32) || 0);
  const starActivityLevel = clamp(Math.log10(1 + n32) / Math.log10(31), 0, 1);
  const system =
    activeHostFrame?.system ||
    calcSystem({
      starMassMsol,
      spacingFactor: Number(world.system?.spacingFactor),
      orbit1Au: Number(world.system?.orbit1Au),
      luminosityLsolOverride: starLuminosityLsun,
      radiusRsolOverride: starRadiusRsol,
    });
  const primaryStarOverrides = {
    r: primaryStar?.radiusRsolOverride ?? null,
    l: primaryStar?.luminosityLsolOverride ?? null,
    t: primaryStar?.tempKOverride ?? null,
    ev: primaryStar?.evolutionMode || "zams",
  };
  const starOverrides = {
    r:
      starConfig?.radiusRsolOverride !== undefined
        ? starConfig.radiusRsolOverride
        : primaryStarOverrides.r,
    l:
      starConfig?.luminosityLsolOverride !== undefined
        ? starConfig.luminosityLsolOverride
        : primaryStarOverrides.l,
    t: starConfig?.tempKOverride !== undefined ? starConfig.tempKOverride : primaryStarOverrides.t,
    ev: starConfig?.evolutionMode || primaryStarOverrides.ev,
  };
  const starSeedRaw =
    solveContext?.starContext?.component?.activitySeed ??
    solveContext?.starContext?.component?.seed ??
    primaryStarContext?.component?.activitySeed ??
    primaryStarContext?.component?.seed ??
    null;
  const companionFluxEarth = Number(solveContext?.companionFluxEarth || 0);
  const companionXuvFluxEarth = Number(solveContext?.companionXuvFluxEarth || 0);
  const hostXuvFluxEarthAt1Au = solveContext?.hostXuvFluxEarthAt1Au ?? null;
  const hostPrebioticUvEarthAt1Au = solveContext?.hostPrebioticUvEarthAt1Au ?? null;
  const companionPrebioticUvEarth = Number(solveContext?.companionPrebioticUvEarth || 0);
  const hostWindPressureEarthAt1Au = solveContext?.hostWindPressureEarthAt1Au ?? null;
  const companionWindPressureEarth = Number(solveContext?.companionWindPressureEarth || 0);
  const fluxVariabilityFraction = Number(solveContext?.fluxVariabilityFraction || 0);
  const hostStars = listHostStarsForHostFrame(homeSystemContext, activeHostFrameId);
  const companionStars = listCompanionStarsForHostFrame(homeSystemContext, activeHostFrameId);
  const hostFrameOptions = Object.values(homeSystemContext?.hostFramesById || {}).map((frame) => ({
    id: frame.id,
    label: formatHostFrameOptionLabel(frame),
    selected: frame.id === activeHostFrameId,
  }));
  const topologyKind = homeSystemContext?.topology?.kind || "single";
  const canvasMode =
    activeHostFrame?.frameKind === "pair" && hostStars.length > 1
      ? "binary-p-type"
      : companionStars.length > 0
        ? "binary-s-type"
        : "single";
  const hierarchySummary = buildHierarchyPresentation({
    topologyKind,
    hostFrame: activeHostFrame || null,
    hostStars,
    companionStars,
    fallbackLocalLabel: activeHostFrame?.label || starName,
  });
  const overviewModel = buildOverviewModel(world, homeSystemContext, {
    activeHostFrameId,
    topologyKind,
    fallbackHostFrameId,
  });
  logThrottled(enabled, "flare:snapshot:model", 1000, "flare:snapshot:model", {
    activityModelVersion,
    canvasMode,
    activeHostFrameId,
    activeHostFrameLabel: activeHostFrame?.label || starName,
    hierarchyBreadcrumb: hierarchySummary.breadcrumb,
    starMassMsol,
    starAgeGyr,
    starTempK,
    starLuminosityLsun,
    starMetallicityFeH,
    starEvolutionMode: starOverrides?.ev || primaryStar?.evolutionMode || "zams",
    teffBin: flareParams?.teffBin,
    ageBand: flareParams?.ageBand,
    N32: Number(flareParams?.N32) || 0,
    energeticFlareRatePerDay: Number(flareParams?.energeticFlareRatePerDay) || 0,
    cmeAssociatedRatePerDay: Number(flareParams?.cmeAssociatedRatePerDay) || 0,
    cmeBackgroundRatePerDay: Number(flareParams?.cmeBackgroundRatePerDay) || 0,
    cmeTotalRatePerDay: Number(flareParams?.cmeTotalRatePerDay) || 0,
  });
  log(enabled, "system inputs", world.system);
  log(enabled, "calcSystem (inputs echoed)", system.inputs);
  log(enabled, "calcSystem.orbitsAu[0..5]", (system.orbitsAu || []).slice(0, 6));

  const planets = filterBodiesForHostFrame(
    listPlanetaryBodies(world).filter((body) => body?.legacyKind !== "gasGiant"),
    activeHostFrameId,
    fallbackHostFrameId,
  );
  const moons = listMoons(world);
  const systemGasGiants = filterBodiesForHostFrame(
    listSystemGasGiants(world),
    activeHostFrameId,
    fallbackHostFrameId,
  );
  const smallBodyReservoirContext = buildSmallBodyReservoirContextForWorld(world, {
    fallbackHostFrameId,
    gasGiants: listSystemGasGiants(world),
    hostFrameId: activeHostFrameId,
    primaryStar,
    starConfig,
    starModel: starCalc,
  });
  const orbitAuBySlot = system.orbitsAu || [];
  const planetNodes = planets
    .filter((planet) => {
      const inputAu = Number(
        planet.inputs?.semiMajorAxisAu ??
          planet.orbit?.semiMajorAxisAu ??
          planet.legacy?.source?.inputs?.semiMajorAxisAu,
      );
      return planet.slotIndex != null || (Number.isFinite(inputAu) && inputAu > 0);
    })
    .map((planet) => {
      const slot = Number(planet.slotIndex);
      const slotAuRaw = orbitAuBySlot[slot - 1];
      const slotAu = Number(slotAuRaw);
      const legacySource =
        planet.legacy?.source && typeof planet.legacy.source === "object"
          ? planet.legacy.source
          : planet;
      const legacyInputs =
        legacySource?.inputs && typeof legacySource.inputs === "object"
          ? legacySource.inputs
          : planet.inputs && typeof planet.inputs === "object"
            ? planet.inputs
            : {};
      const inputAu = Number(legacyInputs.semiMajorAxisAu ?? planet.orbit?.semiMajorAxisAu);
      const au =
        Number.isFinite(slotAu) && slotAu > 0
          ? slotAu
          : Number.isFinite(inputAu) && inputAu > 0
            ? inputAu
            : 1;
      let periodDays = null;
      let radiusEarth = null;
      let radiusKm = null;
      let skyHighHex = null;
      let skyHorizonHex = null;
      let visualProfile = null;
      let ringAppearance = null;
      let planetCalc = null;
      let unifiedBodyCalc = null;
      let renderFamily = "rocky";
      let classLabel = null;
      let style = null;
      let gasCalc = null;
      let gasProfile = null;
      let envelopeState = null;
      let surfaceTempK = null;
      let visualSubtypeKey = "";
      let subtypeSummary = null;
      let primarySubtypeLabel = "";
      let subtypeLabels = [];
      let recipeId = "";
      const planetInputs = { ...legacyInputs, semiMajorAxisAu: au };
      const planetMoonInputs = moons
        .filter((moon) => moon.planetId === planet.id)
        .map((moon) => ({
          id: moon.id,
          ...(moon.inputs || {}),
        }));
      const bodyForSolve = {
        ...planet,
        hostFrameId: activeHostFrameId,
        orbit: {
          ...(planet.orbit || {}),
          semiMajorAxisAu: au,
          eccentricity: planet.orbit?.eccentricity ?? planetInputs.eccentricity,
          inclinationDeg: planet.orbit?.inclinationDeg ?? planetInputs.inclinationDeg,
          longitudeOfPeriapsisDeg:
            planet.orbit?.longitudeOfPeriapsisDeg ?? planetInputs.longitudeOfPeriapsisDeg,
        },
        legacy: {
          ...(planet.legacy || {}),
          source: {
            ...(legacySource || {}),
            inputs: planetInputs,
          },
        },
      };
      let classification = planet.classification || classifyPlanetaryBody(bodyForSolve);
      classLabel = classification?.displayLabel || null;
      const solveContext = {
        starMassMsol,
        starAgeGyr,
        starMetallicityFeH,
        starRadiusRsolOverride: starOverrides.r,
        starLuminosityLsolOverride: starOverrides.l,
        starTempKOverride: starOverrides.t,
        starEvolutionMode: starOverrides.ev,
        starLuminosityLsol: starLuminosityLsun,
        starRadiusRsol,
        starModel: starCalc,
        hostFrameId: activeHostFrameId,
        hostFrame: activeHostFrame || null,
        hostXuvFluxEarthAt1Au,
        hostPrebioticUvEarthAt1Au,
        hostWindPressureEarthAt1Au,
        companionFluxEarth,
        companionXuvFluxEarth,
        companionPrebioticUvEarth,
        companionWindPressureEarth,
        fluxVariabilityFraction,
        moons: planetMoonInputs,
        gasGiants: systemGasGiants
          .filter((gasGiant) => gasGiant?.id !== planet.id)
          .map((gasGiant) => ({ id: gasGiant.id, name: gasGiant.name, au: gasGiant.au })),
        smallBodyReservoirContext,
      };
      try {
        if (isVolatilePlanetClassification(classification)) {
          unifiedBodyCalc = calcPlanetaryBody(bodyForSolve, solveContext);
          planetCalc = unifiedBodyCalc.legacy?.volatileModel || unifiedBodyCalc;
          renderFamily = "volatile";
          classification = unifiedBodyCalc.classification || classification;
          classLabel = classification?.displayLabel || classLabel;
          subtypeSummary = buildSubtypeSummaryFromClassification(
            classification,
            unifiedBodyCalc.primarySubtype,
          );
          const subtypeVisual = buildSubtypeVisualDescriptor(unifiedBodyCalc);
          visualSubtypeKey = subtypeVisual.visualSubtypeKey;
          primarySubtypeLabel = subtypeSummary?.primarySubtypeLabel || "";
          subtypeLabels = (subtypeSummary?.subtypes || []).map((entry) => entry.label);
          style = resolveSubtypeEnvelopeStyle(unifiedBodyCalc, "sub-neptune");
          gasCalc = planetCalc;
          gasProfile = {
            ...computeGasGiantVisualProfile(planetCalc),
            styleId: style,
          };
          const physical = unifiedBodyCalc.physical || planetCalc?.physical || {};
          const orbit = unifiedBodyCalc.orbit || planetCalc?.orbit || {};
          periodDays = Number(orbit.orbitalPeriodDays);
          if (!Number.isFinite(periodDays) || periodDays <= 0) periodDays = null;
          radiusEarth = Number(physical.transitRadiusEarth ?? physical.radiusEarth);
          if (!Number.isFinite(radiusEarth) || radiusEarth <= 0) radiusEarth = null;
          radiusKm = Number(physical.transitRadiusKm ?? physical.radiusKm);
          if (!Number.isFinite(radiusKm) || radiusKm <= 0) radiusKm = null;
          surfaceTempK = Number(
            unifiedBodyCalc.thermal?.equilibriumTempK ??
              planetCalc?.thermal?.equilibriumTempK ??
              planetCalc?.thermal?.eqTempK,
          );
          if (!Number.isFinite(surfaceTempK) || surfaceTempK <= 0) surfaceTempK = null;
          envelopeState =
            unifiedBodyCalc.envelope?.stateLabel ||
            planetCalc?.display?.envelopeState ||
            planetCalc?.envelope?.stateLabel ||
            null;
          skyHighHex = "#8bb9ff";
          skyHorizonHex = "#cbe7ff";
        } else {
          planetCalc = calcPlanetExact({
            starMassMsol,
            starAgeGyr,
            starMetallicityFeH,
            starRadiusRsolOverride: starOverrides.r,
            starLuminosityLsolOverride: starOverrides.l,
            starTempKOverride: starOverrides.t,
            starEvolutionMode: starOverrides.ev,
            hostFrameId: activeHostFrameId,
            hostFrame: activeHostFrame || null,
            hostXuvFluxEarthAt1Au,
            hostPrebioticUvEarthAt1Au,
            hostWindPressureEarthAt1Au,
            companionFluxEarth,
            companionXuvFluxEarth,
            companionPrebioticUvEarth,
            companionWindPressureEarth,
            fluxVariabilityFraction,
            planet: planetInputs,
            moons: planetMoonInputs,
            gasGiants: systemGasGiants
              .filter((gasGiant) => gasGiant?.id !== planet.id)
              .map((gasGiant) => ({ name: gasGiant.name, au: gasGiant.au })),
            smallBodyReservoirContext,
          });
          periodDays = Number(planetCalc?.derived?.orbitalPeriodEarthDays);
          if (!Number.isFinite(periodDays) || periodDays <= 0) periodDays = null;
          radiusEarth = Number(planetCalc?.derived?.radiusEarth);
          if (!Number.isFinite(radiusEarth) || radiusEarth <= 0) radiusEarth = null;
          radiusKm = Number(planetCalc?.derived?.radiusKm);
          if (!Number.isFinite(radiusKm) || radiusKm <= 0) radiusKm = null;
          surfaceTempK = Number(planetCalc?.derived?.surfaceTempK);
          if (!Number.isFinite(surfaceTempK) || surfaceTempK <= 0) surfaceTempK = null;
          skyHighHex = normalizeHexColour(planetCalc?.derived?.skyColourDayHex);
          skyHorizonHex = normalizeHexColour(planetCalc?.derived?.skyColourHorizonHex);
          if (planetCalc?.derived) {
            unifiedBodyCalc = buildSolvedSubtypeModel(
              bodyForSolve,
              classification,
              planetCalc,
              solveContext,
            );
            classification = unifiedBodyCalc.classification || classification;
            subtypeSummary = buildSubtypeSummaryFromClassification(
              classification,
              unifiedBodyCalc.primarySubtype,
            );
            const subtypeVisual = buildSubtypeVisualDescriptor(unifiedBodyCalc);
            visualSubtypeKey = subtypeVisual.visualSubtypeKey;
            primarySubtypeLabel = subtypeSummary?.primarySubtypeLabel || "";
            subtypeLabels = (subtypeSummary?.subtypes || []).map((entry) => entry.label);
            visualProfile = applySubtypeVisualHintsToRockyProfile(
              computeRockyVisualProfile(planetCalc.derived, planetInputs),
              unifiedBodyCalc,
            );
            recipeId = visualProfile?.recipeId || subtypeVisual.rockyRecipeId || "";
            ringAppearance = resolveRingAppearance({
              bodyType: "rocky",
              ringState: {
                ringMode: visualProfile?.ring?.ringMode || planetInputs.ringMode || "auto",
                effectiveEnabled: !!visualProfile?.ring?.enabled,
              },
              ringStyleId: planetInputs.ringStyleId,
              derived: planetCalc.derived,
              seed: planet.id || planet.name,
            });
          }
        }
      } catch {
        periodDays = null;
        radiusEarth = null;
        radiusKm = null;
        surfaceTempK = null;
        skyHighHex = null;
        skyHorizonHex = null;
        visualProfile = null;
        ringAppearance = null;
        gasCalc = null;
        gasProfile = null;
        visualSubtypeKey = "";
        subtypeSummary = null;
        primarySubtypeLabel = "";
        subtypeLabels = [];
        recipeId = "";
      }

      const visualAppearance =
        planet.appearance && typeof planet.appearance === "object" ? planet.appearance : null;
      const planetaryVisualDescriptor = resolvePlanetaryVisualDescriptor({
        body: {
          ...bodyForSolve,
          visualSubtypeKey,
        },
        solvedBody: unifiedBodyCalc,
        visualMode: visualAppearance?.visualMode,
        visualOverrides: visualAppearance?.visualOverrides,
        renderFamily,
        renderModel: "",
        visualProfile,
        gasProfile,
        ringAppearance,
        styleId: style,
        baseRecipeId: recipeId,
      });
      if (planetaryVisualDescriptor.overrideSignature) {
        visualProfile = planetaryVisualDescriptor.visualProfile;
        gasProfile = planetaryVisualDescriptor.gasProfile || gasProfile;
        ringAppearance = planetaryVisualDescriptor.ringAppearance;
        recipeId = planetaryVisualDescriptor.baseRecipeId || recipeId;
        style = planetaryVisualDescriptor.styleId || style;
      }

      return {
        id: planet.id,
        name: planet.name || planetInputs.name || planet.id,
        slot,
        au,
        periodDays,
        radiusEarth,
        massEarth: Number(planetInputs.massEarth ?? planet.composition?.massEarth) || null,
        radiusKm,
        rotationPeriodHours:
          Number(planetInputs.rotationPeriodHours ?? planet.rotation?.rotationPeriodHours) || null,
        axialTiltDeg: clamp(
          Number(planetInputs.axialTiltDeg ?? planet.rotation?.axialTiltDeg ?? 0),
          0,
          180,
        ),
        surfaceTempK,
        skyHighHex,
        skyHorizonHex,
        visualProfile,
        ringAppearance,
        visualSubtypeKey,
        subtypeSummary,
        primarySubtypeLabel,
        subtypeLabels,
        recipeId,
        classification,
        classLabel: classLabel || "Planet",
        renderFamily,
        style,
        gasCalc,
        gasProfile,
        envelopeState,
        unifiedBodyCalc,
        planetCalc,
        visualDescriptor: planetaryVisualDescriptor,
        ...(planetaryVisualDescriptor.overrideSignature
          ? {
              visualOverrideSignature: planetaryVisualDescriptor.overrideSignature,
              visualOverrideCount: planetaryVisualDescriptor.visualOverrideCount,
              visualRenderSignature: planetaryVisualDescriptor.renderSignature,
            }
          : {}),
        eccentricity: clamp(
          Number(planetInputs.eccentricity ?? planet.orbit?.eccentricity ?? 0),
          0,
          0.99,
        ),
        longitudeOfPeriapsisDeg: Number(
          planetInputs.longitudeOfPeriapsisDeg ?? planet.orbit?.longitudeOfPeriapsisDeg ?? 0,
        ),
        inclinationDeg: clamp(
          Number(planetInputs.inclinationDeg ?? planet.orbit?.inclinationDeg ?? 0),
          0,
          180,
        ),
        locked: !!planet.locked,
        hostFrameId: activeHostFrameId,
        moons: buildMoonNodes({
          moons,
          starMassMsol,
          starAgeGyr,
          starMetallicityFeH,
          starOverrides,
          hostFrameId: activeHostFrameId,
          hostFrame: activeHostFrame || null,
          hostXuvFluxEarthAt1Au,
          hostPrebioticUvEarthAt1Au,
          hostWindPressureEarthAt1Au,
          companionFluxEarth,
          companionXuvFluxEarth,
          companionPrebioticUvEarth,
          companionWindPressureEarth,
          fluxVariabilityFraction,
          smallBodyReservoirContext,
          parentId: planet.id,
          parentInputs: planetCalc?.inputs || planetInputs,
          hashUnit,
        }),
      };
    })
    .sort((left, right) => left.au - right.au);

  const gasGiants = systemGasGiants
    .map((gasGiant, idx) =>
      buildGasGiantNode(gasGiant, idx, {
        gasGiants: systemGasGiants,
        moons,
        starAgeGyr,
        starMassMsol,
        starMetallicityFeH,
        starLuminosityLsun,
        starRadiusRsol,
        hostFrameId: activeHostFrameId,
        hostFrame: activeHostFrame || null,
        hostXuvFluxEarthAt1Au,
        hostPrebioticUvEarthAt1Au,
        hostWindPressureEarthAt1Au,
        companionFluxEarth,
        companionXuvFluxEarth,
        companionPrebioticUvEarth,
        companionWindPressureEarth,
        fluxVariabilityFraction,
        smallBodyReservoirContext,
        starOverrides,
        hashUnit,
      }),
    )
    .filter((gasGiant) => Number.isFinite(gasGiant.au) && gasGiant.au > 0)
    .sort((left, right) => left.au - right.au);

  const debrisDisks = [];
  for (const disk of listSystemDebrisDisks(world, {
    hostFrameId: activeHostFrameId,
    fallbackHostFrameId,
  })) {
    const inner = Number(disk.innerAu);
    const outer = Number(disk.outerAu);
    if (Number.isFinite(inner) && Number.isFinite(outer) && inner > 0 && outer > 0) {
      debrisDisks.push({
        id: disk.id || `dd${debrisDisks.length + 1}`,
        name: disk.name || `Debris disk ${debrisDisks.length + 1}`,
        hostFrameId: activeHostFrameId,
        inner: Math.min(inner, outer),
        outer: Math.max(inner, outer),
      });
    }
  }

  const comets = [];
  for (const comet of listSystemComets(world, {
    hostFrameId: activeHostFrameId,
    fallbackHostFrameId,
  })) {
    try {
      const cometCalc = calcComet({
        comet,
        starMassMsol,
        starLuminosityLsol: starLuminosityLsun,
      });
      comets.push({
        id: comet.id || `c${comets.length + 1}`,
        name: comet.name || `Comet ${comets.length + 1}`,
        hostFrameId: activeHostFrameId,
        sourceReservoir: cometCalc.classification.sourceReservoir,
        semiMajorAxisAu: Number(cometCalc.inputs.semiMajorAxisAu) || 0,
        eccentricity: Number(cometCalc.inputs.eccentricity) || 0,
        inclinationDeg: Number(cometCalc.inputs.inclinationDeg) || 0,
        longitudeOfPeriapsisDeg: Number(cometCalc.inputs.longitudeOfPeriapsisDeg) || 0,
        volatileClass: String(cometCalc.inputs.volatileClass || "waterRich"),
        volatileLabel: String(cometCalc.classification.volatileLabel || ""),
        dustToGasRatio: Number(cometCalc.inputs.dustToGasRatio) || 0,
        trueAnomalyDeg: Number(cometCalc.orbit.trueAnomalyDeg) || 0,
        currentRadiusAu: Number(cometCalc.orbit.currentRadiusAu) || 0,
        visualOrbitOuterAu: Number(cometCalc.orbit.visualOrbitOuterAu) || 0,
        activeNow: !!cometCalc.activity.activeNow,
        activityState: cometCalc.display.activityState,
        comaRadiusKm: Number(cometCalc.activity.comaRadiusKm) || 0,
        dustTailLengthAu: Number(cometCalc.activity.dustTailLengthAu) || 0,
        ionTailLengthAu: Number(cometCalc.activity.ionTailLengthAu) || 0,
        nucleusRadiusKm: Number(cometCalc.inputs.nucleusRadiusKm) || 0,
        dynamicalClass: cometCalc.classification.dynamicalClass,
        sourceLabel: cometCalc.display.sourceReservoir,
      });
    } catch {
      // Skip invalid comet solves rather than breaking the Local Frame snapshot.
    }
  }

  log(enabled, "debrisDisks", debrisDisks);
  log(enabled, "comets", comets);
  log(enabled, "gasGiants", gasGiants);
  log(
    enabled,
    "planets (assigned)",
    planetNodes.map((planet) => ({ name: planet.name, slot: planet.slot, au: planet.au })),
  );

  return {
    sys: system,
    planetNodes,
    debrisDisks,
    comets,
    gasGiants,
    topologyKind,
    canvasMode,
    activeHostFrameId,
    activeHostFrameLabel: activeHostFrame?.label || starName,
    activeHostFrame,
    hostFrameOptions,
    hostStars,
    companionStars,
    hierarchySummary,
    overviewModel,
    companionFluxEarth,
    fluxVariabilityFraction,
    starName,
    starMassMsol,
    starAgeGyr,
    starTempK,
    starLuminosityLsun,
    starRadiusRsol,
    starRadiusKm,
    starColourHex,
    starRegime: String(starCalc?.regime || "star"),
    starRotationPeriodDays: starCalc?.stellarEnvironment?.rotation?.periodDays ?? null,
    starRossbyNumber: starCalc?.stellarEnvironment?.rotation?.rossbyNumber ?? null,
    starActivityLevel,
    starSeed: starSeedRaw,
    activityModelVersion,
    starActivityModel: activityModel,
  };
}

function buildMoonNodes({
  moons,
  starMassMsol,
  starAgeGyr,
  starMetallicityFeH,
  starOverrides,
  hostFrameId,
  hostFrame,
  hostXuvFluxEarthAt1Au,
  hostPrebioticUvEarthAt1Au,
  hostWindPressureEarthAt1Au,
  companionFluxEarth,
  companionXuvFluxEarth,
  companionPrebioticUvEarth,
  companionWindPressureEarth,
  fluxVariabilityFraction,
  parentId,
  parentInputs,
  hashUnit,
}) {
  return moons
    .filter((moon) => moon.planetId === parentId)
    .map((moon) =>
      buildMoonNode(moon, {
        starMassMsol,
        starAgeGyr,
        starMetallicityFeH,
        starOverrides,
        hostFrameId,
        hostFrame,
        hostXuvFluxEarthAt1Au,
        hostPrebioticUvEarthAt1Au,
        hostWindPressureEarthAt1Au,
        companionFluxEarth,
        companionXuvFluxEarth,
        companionPrebioticUvEarth,
        companionWindPressureEarth,
        fluxVariabilityFraction,
        parentInputs,
        hashUnit,
      }),
    )
    .sort((left, right) => {
      const a = Number.isFinite(left.semiMajorAxisKm) ? left.semiMajorAxisKm : Infinity;
      const b = Number.isFinite(right.semiMajorAxisKm) ? right.semiMajorAxisKm : Infinity;
      return a - b;
    });
}

function buildMoonNode(moon, context) {
  const {
    hashUnit,
    parentInputs,
    starAgeGyr,
    starMassMsol,
    starMetallicityFeH,
    starOverrides,
    hostFrameId,
    hostFrame,
    hostXuvFluxEarthAt1Au,
    hostPrebioticUvEarthAt1Au,
    hostWindPressureEarthAt1Au,
    companionFluxEarth,
    companionXuvFluxEarth,
    companionPrebioticUvEarth,
    companionWindPressureEarth,
    fluxVariabilityFraction,
    smallBodyReservoirContext,
  } = context;
  const semiMajorAxisKm = Number(moon.inputs?.semiMajorAxisKm);
  let periodDays = null;
  let radiusKm = null;
  let rotationPeriodDays = null;
  let moonCalc = null;
  try {
    moonCalc = calcMoonExact({
      starMassMsol,
      starAgeGyr,
      starMetallicityFeH,
      starRadiusRsolOverride: starOverrides.r,
      starLuminosityLsolOverride: starOverrides.l,
      starTempKOverride: starOverrides.t,
      starEvolutionMode: starOverrides.ev,
      hostFrameId,
      hostFrame,
      hostXuvFluxEarthAt1Au,
      hostPrebioticUvEarthAt1Au,
      hostWindPressureEarthAt1Au,
      companionFluxEarth,
      companionXuvFluxEarth,
      companionPrebioticUvEarth,
      companionWindPressureEarth,
      fluxVariabilityFraction,
      smallBodyReservoirContext,
      planet: parentInputs,
      moon: { ...moon.inputs },
    });
    periodDays = Number(moonCalc?.orbit?.orbitalPeriodSiderealDays);
    if (!Number.isFinite(periodDays) || periodDays <= 0) periodDays = null;
    rotationPeriodDays = Number(moonCalc?.orbit?.rotationPeriodDays);
    if (!Number.isFinite(rotationPeriodDays) || rotationPeriodDays <= 0) rotationPeriodDays = null;
    const moonRadiusMoon = Number(moonCalc?.physical?.radiusMoon);
    if (Number.isFinite(moonRadiusMoon) && moonRadiusMoon > 0) {
      radiusKm = moonRadiusMoon * MOON_RADIUS_KM;
    }
  } catch {
    periodDays = null;
    radiusKm = null;
    rotationPeriodDays = null;
    moonCalc = null;
  }
  const rotationPeriodHours = Number(moon.inputs?.rotationPeriodHours);
  const rotationDaysInput =
    Number.isFinite(rotationPeriodHours) && rotationPeriodHours > 0
      ? rotationPeriodHours / 24
      : null;
  const axialTiltInput = Number(moon.inputs?.axialTiltDeg);
  const axialTiltProxy = Number(moon.inputs?.inclinationDeg);
  return {
    id: moon.id,
    name: moon.name || moon.inputs?.name || moon.id,
    semiMajorAxisKm:
      Number.isFinite(semiMajorAxisKm) && semiMajorAxisKm > 0 ? semiMajorAxisKm : null,
    periodDays,
    rotationPeriodDays: rotationPeriodDays ?? rotationDaysInput ?? periodDays,
    axialTiltDeg: Number.isFinite(axialTiltInput)
      ? clamp(axialTiltInput, 0, 180)
      : Number.isFinite(axialTiltProxy)
        ? clamp(axialTiltProxy, 0, 180)
        : 0,
    radiusKm,
    moonCalc,
    hostFrameId,
    eccentricity: clamp(Number(moon.inputs?.eccentricity ?? 0), 0, 0.99),
    inclinationDeg: clamp(Number(moon.inputs?.inclinationDeg ?? 0), 0, 180),
    longitudeOfPeriapsisDeg: hashUnit(moon.id) * 360,
  };
}

function buildGasGiantNode(gasGiant, idx, context) {
  const {
    gasGiants,
    hashUnit,
    hostFrame,
    hostFrameId,
    moons,
    starAgeGyr,
    starMassMsol,
    starMetallicityFeH,
    starLuminosityLsun,
    hostXuvFluxEarthAt1Au,
    hostPrebioticUvEarthAt1Au,
    hostWindPressureEarthAt1Au,
    companionFluxEarth,
    companionXuvFluxEarth,
    companionPrebioticUvEarth,
    companionWindPressureEarth,
    fluxVariabilityFraction,
    smallBodyReservoirContext,
    starOverrides,
    starRadiusRsol,
  } = context;
  const rawCompanionClass = classifyGiantCompanionValue(gasGiant);
  const node = {
    id: gasGiant.id || `gg${idx + 1}`,
    name: gasGiant.name || defaultGiantCompanionName(gasGiant, idx),
    au: Number(gasGiant.au),
    periodDays: null,
    radiusRj: Number.isFinite(Number(gasGiant.radiusRj))
      ? clamp(Number(gasGiant.radiusRj), GAS_GIANT_RADIUS_MIN_RJ, GAS_GIANT_RADIUS_MAX_RJ)
      : 1,
    radiusKm: null,
    style: gasGiant.style || "jupiter",
    ringMode: gasGiant.ringMode,
    rings: !!gasGiant.rings,
    massMjup: gasGiant.massMjup,
    rotationPeriodHours: gasGiant.rotationPeriodHours,
    metallicity: gasGiant.metallicity,
    eccentricity: clamp(Number(gasGiant.eccentricity ?? 0), 0, 0.99),
    inclinationDeg: clamp(Number(gasGiant.inclinationDeg ?? 0), 0, 180),
    longitudeOfPeriapsisDeg: Number.isFinite(Number(gasGiant.longitudeOfPeriapsisDeg))
      ? Number(gasGiant.longitudeOfPeriapsisDeg)
      : hashUnit(gasGiant.id || `gg${idx + 1}`) * 360,
    axialTiltDeg: clamp(Number(gasGiant.axialTiltDeg ?? 0), 0, 180),
    ringAppearance: null,
    hostFrameId,
    companionClass: rawCompanionClass,
    regime: rawCompanionClass,
    classLabel: regimeDisplayLabel(rawCompanionClass),
    renderModel: "gasGiant",
    starVisual: null,
    subtypeSummary: null,
    visualSubtypeKey: "",
  };
  let parentOverride = null;
  let subtypeModel = null;
  try {
    const gasCalc = calcGasGiant({
      companionClass: rawCompanionClass,
      massMjup: gasGiant.massMjup,
      radiusRj: gasGiant.radiusRj,
      orbitAu: node.au || 5,
      eccentricity: node.eccentricity,
      inclinationDeg: node.inclinationDeg,
      axialTiltDeg: node.axialTiltDeg,
      rotationPeriodHours: gasGiant.rotationPeriodHours,
      metallicity: gasGiant.metallicity,
      starMassMsol,
      starLuminosityLsol: Number(starLuminosityLsun) || 1,
      starAgeGyr,
      starRadiusRsol: Number(starRadiusRsol) || 1,
      hostFrameId,
      hostFrame,
      hostXuvFluxEarthAt1Au,
      hostPrebioticUvEarthAt1Au,
      hostWindPressureEarthAt1Au,
      companionFluxEarth,
      companionXuvFluxEarth,
      companionPrebioticUvEarth,
      companionWindPressureEarth,
      fluxVariabilityFraction,
      stellarMetallicityFeH: starMetallicityFeH,
      otherGiants: Array.isArray(gasGiants)
        ? gasGiants.filter((other) => other?.id !== gasGiant.id)
        : [],
      moons: moons.filter((moon) => moon.planetId === node.id).map((moon) => moon.inputs || {}),
    });
    node.gasCalc = gasCalc;
    node.companionClass = normalizeGiantCompanionClass(
      gasCalc?.companionClass,
      gasCalc?.regime === "brownDwarf" ? "brownDwarf" : rawCompanionClass,
    );
    node.regime = String(gasCalc?.regime || node.companionClass);
    node.classLabel = regimeDisplayLabel(node.regime);
    node.name =
      gasGiant.name || defaultGiantCompanionName({ companionClass: node.companionClass }, idx);
    node.style = resolveGiantCompanionStyle(gasGiant.style, gasCalc, node.companionClass);
    const subtypeContext = {
      starMassMsol,
      starAgeGyr,
      starMetallicityFeH,
      starLuminosityLsol: Number(starLuminosityLsun) || 1,
      starRadiusRsol: Number(starRadiusRsol) || 1,
      hostFrameId,
      hostFrame,
      hostXuvFluxEarthAt1Au,
      hostPrebioticUvEarthAt1Au,
      hostWindPressureEarthAt1Au,
      companionFluxEarth,
      companionXuvFluxEarth,
      companionPrebioticUvEarth,
      companionWindPressureEarth,
      fluxVariabilityFraction,
      smallBodyReservoirContext,
    };
    const subtypeBody = {
      id: node.id,
      name: node.name,
      legacyKind: "gasGiant",
      legacy: { kind: "gasGiant", source: gasGiant },
      giant: {
        companionClass: node.companionClass,
        massMjup: gasCalc?.inputs?.massMjup ?? gasGiant.massMjup,
        radiusRj: gasCalc?.inputs?.radiusRj ?? gasGiant.radiusRj,
      },
      orbit: {
        semiMajorAxisAu: node.au,
        eccentricity: node.eccentricity,
        inclinationDeg: node.inclinationDeg,
      },
      classificationSeed: {
        companionClass: node.companionClass,
        massMjup: gasCalc?.inputs?.massMjup ?? gasGiant.massMjup,
        radiusRj: gasCalc?.inputs?.radiusRj ?? gasGiant.radiusRj,
        densityGcm3: gasCalc?.physical?.densityGcm3,
      },
    };
    const subtypeBroadClassification = classifyPlanetaryBody(subtypeBody, subtypeContext);
    subtypeModel = buildSolvedSubtypeModel(
      subtypeBody,
      subtypeBroadClassification,
      gasCalc,
      subtypeContext,
    );
    const subtypeVisual = buildSubtypeVisualDescriptor(subtypeModel);
    node.subtypeSummary = buildSubtypeSummaryFromClassification(
      subtypeModel.classification,
      subtypeModel.primarySubtype,
    );
    node.visualSubtypeKey = subtypeVisual.visualSubtypeKey;
    if (node.companionClass !== "brownDwarf" && subtypeVisual.envelopeStyleId) {
      node.style = subtypeVisual.envelopeStyleId;
    }
    node.gasProfile = {
      ...computeGasGiantVisualProfile(gasCalc),
      styleId: node.style,
    };
    node.radiusRj =
      Number(gasCalc?.physical?.radiusRj) ||
      Number(gasCalc?.physical?.radiusRjAuto) ||
      node.radiusRj;
    node.radiusKm = Number(gasCalc?.physical?.radiusKm) || null;
    node.periodDays = Number(gasCalc?.orbital?.orbitalPeriodDays) || null;
    const ringState = resolveGasGiantRingState({
      ringMode: gasGiant.ringMode,
      gasCalc,
      legacyRings: gasGiant.rings,
    });
    node.ringMode = ringState.ringMode;
    node.rings = ringState.effectiveEnabled;
    node.ringState = ringState;
    node.ringAppearance = resolveRingAppearance({
      bodyType: "gasGiant",
      ringState,
      ringStyleId: gasGiant.ringStyleId,
      gasCalc,
      bodyStyleId: node.style,
      seed: node.id || node.name,
    });
    node.starVisual = buildBrownDwarfStarVisual(
      {
        name: node.name,
        style: node.style,
        companionClass: node.companionClass,
        regime: node.regime,
        gasCalc,
        massMjup: node.massMjup,
      },
      { ageGyr: starAgeGyr },
    );
    node.renderModel = node.starVisual ? "brownDwarfStar" : "gasGiant";
    parentOverride = {
      inputs: {
        massEarth: gasCalc.physical.massEarth,
        semiMajorAxisAu: gasCalc.inputs.orbitAu,
        eccentricity: gasCalc.inputs.eccentricity,
        rotationPeriodHours: gasCalc.inputs.rotationPeriodHours,
        cmfPct: 0,
      },
      derived: {
        densityGcm3: gasCalc.physical.densityGcm3,
        radiusEarth: gasCalc.physical.radiusEarth,
        gravityG: gasCalc.physical.gravityG,
        surfaceFieldEarths: gasCalc.magnetic?.surfaceFieldEarths ?? 0,
        magnetopauseRp: gasCalc.magnetic?.magnetopauseRp ?? null,
        magnetosphereEnvironment: gasCalc.magnetic?.magnetosphereEnvironment ?? null,
      },
    };
  } catch {
    node.radiusKm = node.radiusRj * 69911;
    node.periodDays = null;
    node.style = resolveGiantCompanionStyle(gasGiant.style, null, rawCompanionClass);
    const ringState = resolveGasGiantRingState({
      ringMode: gasGiant.ringMode,
      legacyRings: gasGiant.rings,
    });
    node.ringMode = ringState.ringMode;
    node.rings = ringState.effectiveEnabled;
    node.ringState = ringState;
    node.ringAppearance = resolveRingAppearance({
      bodyType: "gasGiant",
      ringState,
      ringStyleId: gasGiant.ringStyleId,
      gasCalc: null,
      bodyStyleId: node.style,
      seed: node.id || node.name,
    });
    node.starVisual = buildBrownDwarfStarVisual(
      {
        name: node.name,
        style: node.style,
        companionClass: rawCompanionClass,
        regime: rawCompanionClass,
        massMjup: node.massMjup,
      },
      { ageGyr: starAgeGyr },
    );
    node.renderModel = node.starVisual ? "brownDwarfStar" : "gasGiant";
    node.gasProfile = null;
    parentOverride = null;
  }
  const visualAppearance =
    gasGiant.appearance && typeof gasGiant.appearance === "object" ? gasGiant.appearance : null;
  const planetaryVisualDescriptor = resolvePlanetaryVisualDescriptor({
    body: {
      ...gasGiant,
      id: node.id,
      visualSubtypeKey: node.visualSubtypeKey,
    },
    solvedBody: subtypeModel,
    visualMode: visualAppearance?.visualMode,
    visualOverrides: visualAppearance?.visualOverrides,
    renderFamily: "gas",
    renderModel: node.renderModel,
    gasProfile: node.gasProfile,
    ringAppearance: node.ringAppearance,
    styleId: node.style,
  });
  node.visualDescriptor = planetaryVisualDescriptor;
  if (planetaryVisualDescriptor.overrideSignature) {
    node.gasProfile = planetaryVisualDescriptor.gasProfile || node.gasProfile;
    node.ringAppearance = planetaryVisualDescriptor.ringAppearance;
    node.style = planetaryVisualDescriptor.styleId || node.style;
    if (typeof node.ringAppearance?.enabled === "boolean") {
      node.rings = node.ringAppearance.enabled;
    }
    node.visualOverrideSignature = planetaryVisualDescriptor.overrideSignature;
    node.visualOverrideCount = planetaryVisualDescriptor.visualOverrideCount;
    node.visualRenderSignature = planetaryVisualDescriptor.renderSignature;
  }
  node.moons = moons
    .filter((moon) => moon.planetId === node.id)
    .map((moon) => {
      const semiMajorAxisKm = Number(moon.inputs?.semiMajorAxisKm);
      let periodDays = null;
      let radiusKm = null;
      let rotationPeriodDays = null;
      let moonCalc = null;
      if (parentOverride) {
        try {
          moonCalc = calcMoonExact({
            starMassMsol,
            starAgeGyr,
            starMetallicityFeH,
            starRadiusRsolOverride: starOverrides.r,
            starLuminosityLsolOverride: starOverrides.l,
            starTempKOverride: starOverrides.t,
            starEvolutionMode: starOverrides.ev,
            hostFrameId,
            hostFrame,
            hostXuvFluxEarthAt1Au,
            hostPrebioticUvEarthAt1Au,
            hostWindPressureEarthAt1Au,
            companionFluxEarth,
            companionXuvFluxEarth,
            companionPrebioticUvEarth,
            companionWindPressureEarth,
            fluxVariabilityFraction,
            smallBodyReservoirContext,
            moon: { ...moon.inputs },
            parentOverride,
          });
          periodDays = Number(moonCalc?.orbit?.orbitalPeriodSiderealDays);
          if (!Number.isFinite(periodDays) || periodDays <= 0) periodDays = null;
          rotationPeriodDays = Number(moonCalc?.orbit?.rotationPeriodDays);
          if (!Number.isFinite(rotationPeriodDays) || rotationPeriodDays <= 0)
            rotationPeriodDays = null;
          const moonRadiusMoon = Number(moonCalc?.physical?.radiusMoon);
          if (Number.isFinite(moonRadiusMoon) && moonRadiusMoon > 0) {
            radiusKm = moonRadiusMoon * MOON_RADIUS_KM;
          }
        } catch {
          periodDays = null;
          radiusKm = null;
          rotationPeriodDays = null;
          moonCalc = null;
        }
      }
      const rotationPeriodHours = Number(moon.inputs?.rotationPeriodHours);
      const rotationDaysInput =
        Number.isFinite(rotationPeriodHours) && rotationPeriodHours > 0
          ? rotationPeriodHours / 24
          : null;
      const axialTiltInput = Number(moon.inputs?.axialTiltDeg);
      const axialTiltProxy = Number(moon.inputs?.inclinationDeg);
      return {
        id: moon.id,
        name: moon.name || moon.inputs?.name || moon.id,
        semiMajorAxisKm:
          Number.isFinite(semiMajorAxisKm) && semiMajorAxisKm > 0 ? semiMajorAxisKm : null,
        periodDays,
        rotationPeriodDays: rotationPeriodDays ?? rotationDaysInput ?? periodDays,
        axialTiltDeg: Number.isFinite(axialTiltInput)
          ? clamp(axialTiltInput, 0, 180)
          : Number.isFinite(axialTiltProxy)
            ? clamp(axialTiltProxy, 0, 180)
            : 0,
        radiusKm,
        moonCalc,
        hostFrameId,
        eccentricity: clamp(Number(moon.inputs?.eccentricity ?? 0), 0, 0.99),
        inclinationDeg: clamp(Number(moon.inputs?.inclinationDeg ?? 0), 0, 180),
        longitudeOfPeriapsisDeg: hashUnit(moon.id) * 360,
      };
    })
    .sort((left, right) => {
      const a = Number.isFinite(left.semiMajorAxisKm) ? left.semiMajorAxisKm : Infinity;
      const b = Number.isFinite(right.semiMajorAxisKm) ? right.semiMajorAxisKm : Infinity;
      return a - b;
    });
  return node;
}

export function mapAuToPx(au, minAu, maxAu, maxR, { logScale = false } = {}) {
  const maxSafe = Number.isFinite(maxAu) && maxAu > 0 ? maxAu : 1;
  const auNum = Number(au);
  const a = Number.isFinite(auNum) && auNum > 0 ? auNum : 0;
  if (!maxR) return 0;
  let t = 0;
  if (logScale) {
    const minSafe = Number.isFinite(minAu) && minAu > 0 ? minAu : maxSafe * 0.001;
    const denom = Math.log10(maxSafe) - Math.log10(minSafe);
    t = denom > 0 ? (Math.log10(Math.max(a, minSafe)) - Math.log10(minSafe)) / denom : 0;
  } else {
    t = maxSafe > 0 ? a / maxSafe : 0;
  }
  return clamp(t, 0, 1) * maxR;
}

export function getFrameMetrics(snapshot, options) {
  const {
    bodyScale,
    canvasHeight,
    canvasWidth,
    dpr = 1,
    logScale = false,
    offscaleZoneMinAu,
    offscaleZoneRangeRatio,
    offscaleZoneRatio,
    physicalScale = false,
    showDebris = true,
    showFrost = true,
    showHz = true,
    zoom,
  } = options;
  const W = canvasWidth / dpr;
  const H = canvasHeight / dpr;
  const baseCx = W * 0.5;
  const baseCy = H * 0.5;
  const minAuCandidates = [];
  const maxAuCandidates = [];

  if (snapshot.planetNodes?.length) {
    const planetAus = snapshot.planetNodes
      .map((planet) => Number(planet.au))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (planetAus.length) {
      minAuCandidates.push(Math.min(...planetAus));
      maxAuCandidates.push(Math.max(...planetAus));
    }
  }
  if (showDebris && snapshot.debrisDisks?.length) {
    snapshot.debrisDisks.forEach((disk) => {
      minAuCandidates.push(Number(disk.inner), Number(disk.outer));
      maxAuCandidates.push(Number(disk.inner), Number(disk.outer));
    });
  }
  if (snapshot.gasGiants?.length) {
    snapshot.gasGiants.forEach((gasGiant) => {
      minAuCandidates.push(Number(gasGiant.au));
      maxAuCandidates.push(Number(gasGiant.au));
    });
  }
  if (snapshot.canvasMode === "binary-p-type" && Array.isArray(snapshot.hostStars)) {
    snapshot.hostStars.forEach((hostStar) => {
      const barycentricOrbitAu = Number(hostStar?.barycentricOrbitAu);
      if (Number.isFinite(barycentricOrbitAu) && barycentricOrbitAu > 0) {
        minAuCandidates.push(barycentricOrbitAu);
        maxAuCandidates.push(barycentricOrbitAu);
      }
    });
  }

  const coreScaleCandidates = maxAuCandidates.filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  const hasCoreScaleFeatures = coreScaleCandidates.length > 0;
  const coreMaxAu = hasCoreScaleFeatures ? Math.max(...coreScaleCandidates) : null;
  if (!hasCoreScaleFeatures) {
    if (showFrost) {
      minAuCandidates.push(Number(snapshot.sys?.frostLineAu));
      maxAuCandidates.push(Number(snapshot.sys?.frostLineAu));
    }
    if (showHz) {
      minAuCandidates.push(
        Number(snapshot.sys?.habitableZoneAu?.inner),
        Number(snapshot.sys?.habitableZoneAu?.outer),
      );
      maxAuCandidates.push(
        Number(snapshot.sys?.habitableZoneAu?.inner),
        Number(snapshot.sys?.habitableZoneAu?.outer),
      );
    }
  }

  const minFiniteCandidates = minAuCandidates.filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  const maxFiniteCandidates = maxAuCandidates.filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  const minSourceAu = minFiniteCandidates.length ? Math.min(...minFiniteCandidates) : 0.1;
  const minAu = minSourceAu * 0.85;
  const maxSourceAu = maxFiniteCandidates.length ? Math.max(...maxFiniteCandidates) : 1;
  const maxAu = Math.max(maxSourceAu * 1.05, minAu * 5);
  const maxR = Math.min(W, H) * 0.45 * zoom;
  const starRadiusRsol = Math.max(0.01, Number(snapshot?.starRadiusRsol) || 1);
  const innermostOrbitPx = mapAuToPx(minSourceAu, minAu, maxAu, maxR, { logScale });
  let starR;
  if (physicalScale) {
    const starRadiusAu = starRadiusRsol * 0.00465047;
    const pixelsPerAu = logScale
      ? (() => {
          const logDenom = Math.log10(maxAu) - Math.log10(Math.max(minAu, 1e-9));
          return logDenom > 0 ? maxR / (Math.LN10 * logDenom * Math.max(minAu, 1e-9)) : maxR;
        })()
      : maxR / Math.max(maxAu, 1e-6);
    starR = Math.max(0.5, starRadiusAu * pixelsPerAu);
  } else {
    const baseStarR = Math.max(5, maxR * 0.03);
    const scaledRadiusFactor = Math.pow(starRadiusRsol, 0.45);
    const maxStarR = innermostOrbitPx > 0 ? innermostOrbitPx * 0.48 : maxR * 0.12;
    starR = clamp(baseStarR * scaledRadiusFactor, 4, Math.max(4, maxStarR));
  }
  const starRadiusKm = Number(snapshot?.starRadiusKm);
  const bodyZoom = physicalScale ? 1 : clamp(Math.pow(zoom, 0.5) * bodyScale, 0.06, 20);
  let repBodyScale = 1;
  let repBodyMinPx = 1.2;
  if (!physicalScale) {
    const bodyRadiusCandidates = [];
    for (const planet of snapshot.planetNodes || []) {
      bodyRadiusCandidates.push(representativePlanetBaseRadiusPx(planet, bodyZoom));
    }
    for (const gasGiant of snapshot.gasGiants || []) {
      bodyRadiusCandidates.push(representativeGasBaseRadiusPx(gasGiant, bodyZoom));
    }
    const maxBodyRadiusPx = bodyRadiusCandidates.length ? Math.max(...bodyRadiusCandidates) : 0;
    if (maxBodyRadiusPx > 0 && Number.isFinite(starR) && starR > 0) {
      repBodyScale = Math.min(1, starR / maxBodyRadiusPx);
    }
    repBodyMinPx = clamp(starR * 0.12, 1.05, 1.8);
  }
  const offscaleZones = buildOffscaleZoneInfo(snapshot, coreMaxAu, {
    enabledFrost: !!showFrost,
    enabledHz: !!showHz,
    minZoneAu: offscaleZoneMinAu,
    rangeRatio: offscaleZoneRangeRatio,
    suppressAll: !!logScale,
    zoneRatio: offscaleZoneRatio,
  });
  return {
    W,
    H,
    baseCx,
    baseCy,
    minAu,
    maxAu,
    maxR,
    starR,
    starRadiusKm: Number.isFinite(starRadiusKm) && starRadiusKm > 0 ? starRadiusKm : SOL_RADIUS_KM,
    isPhysical: physicalScale,
    bodyZoom,
    repBodyScale,
    repBodyMinPx,
    offscaleZones,
  };
}
