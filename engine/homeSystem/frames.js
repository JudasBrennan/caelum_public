import { calcSystem } from "../system.js";
import { buildHierarchicalFluxModel, shiftHabitableZoneForCompanionFlux } from "./flux.js";
import { buildHierarchicalOuterStability, buildPairFrameStability } from "./stability.js";

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildZones(systemModel, overrides = {}) {
  return {
    zoneKind: overrides.zoneKind || systemModel.zoneKind || "habitableZone",
    zoneLabel: overrides.zoneLabel || systemModel.zoneLabel || "Habitable Zone",
    habitableZoneAu: overrides.habitableZoneAu
      ? { ...overrides.habitableZoneAu }
      : { ...systemModel.habitableZoneAu },
    frostLineAu: overrides.frostLineAu != null ? overrides.frostLineAu : systemModel.frostLineAu,
    systemInnerLimitAu:
      overrides.systemInnerLimitAu != null
        ? overrides.systemInnerLimitAu
        : systemModel.systemInnerLimitAu,
    orbitsAu: [...systemModel.orbitsAu],
    diskTruncationAu: overrides.diskTruncationAu ?? null,
  };
}

function buildHostFrameSystem({
  starMassMsol,
  luminosityLsol,
  radiusRsol,
  tempK,
  worldSystemInputs,
}) {
  return calcSystem({
    starMassMsol,
    spacingFactor: worldSystemInputs.spacingFactor,
    orbit1Au: worldSystemInputs.orbit1Au,
    luminosityLsolOverride: luminosityLsol,
    radiusRsolOverride: radiusRsol,
    tempKOverride: tempK,
  });
}

function buildNodeMassesById(topology, starsById) {
  const nodeMassesById = Object.create(null);
  for (const starId of topology?.starIds || []) {
    nodeMassesById[starId] = Number(starsById?.[starId]?.config?.massMsol || 0);
  }
  for (const pairId of topology?.pairIds || []) {
    nodeMassesById[pairId] = (topology?.leafStarIdsByNodeId?.[pairId] || []).reduce(
      (sum, starId) => sum + Number(starsById?.[starId]?.config?.massMsol || 0),
      0,
    );
  }
  return nodeMassesById;
}

function buildNodeLabelsById(topology, starsById, pairsById) {
  const nodeLabelsById = Object.create(null);
  for (const starId of topology?.starIds || []) {
    nodeLabelsById[starId] = starsById?.[starId]?.component?.name || starId;
  }
  for (const pairId of topology?.pairIds || []) {
    const pairContext = pairsById?.[pairId];
    const label =
      pairContext?.starIds
        ?.map((starId) => starsById?.[starId]?.component?.name || starId)
        .join(" + ") || pairId;
    nodeLabelsById[pairId] = label;
  }
  return nodeLabelsById;
}

function buildCompanionBranches(fluxModel) {
  return Array.isArray(fluxModel?.companionLayers)
    ? fluxModel.companionLayers.map((layer) => ({
        pairId: layer.pairId,
        companionNodeId: layer.companionNodeId,
        companionStarIds: [...(layer.companionStarIds || [])],
        label: layer.label,
        hierarchyLevel: layer.hierarchyLevel,
        separationSummaryAu: layer.separationSummaryAu ? { ...layer.separationSummaryAu } : null,
        eccentricity: Number(layer.eccentricity || 0),
        meanVisibleFluxEarth: Number(layer.meanVisibleFluxEarth || 0),
        meanXuvFluxEarth: Number(layer.meanXuvFluxEarth || 0),
      }))
    : [];
}

function buildCircumstellarZones({ system, starContext, fluxModel, stability }) {
  const companionFluxEarth = Number(fluxModel?.meanCompanionFluxEarth || 0);
  const effectiveHabitableZoneAu = shiftHabitableZoneForCompanionFlux({
    hostLuminosityLsol: starContext.model.luminosityLsol,
    habitableZoneAu: system.habitableZoneAu,
    meanCompanionFluxEarth: companionFluxEarth,
  });
  const effectiveLuminosity = Math.max(
    Number(starContext.model.luminosityLsol || 0) + companionFluxEarth,
    0,
  );
  return buildZones(system, {
    habitableZoneAu: effectiveHabitableZoneAu,
    frostLineAu: 4.85 * Math.sqrt(Math.max(effectiveLuminosity, 0)),
    diskTruncationAu: stability?.diskTruncationAu ?? null,
  });
}

function buildCircumbinaryZones({ system, pairContext, fluxModel, stability }) {
  const companionFluxEarth = Number(fluxModel?.meanCompanionFluxEarth || 0);
  const effectiveHabitableZoneAu = shiftHabitableZoneForCompanionFlux({
    hostLuminosityLsol: pairContext.combinedLuminosityLsol,
    habitableZoneAu: system.habitableZoneAu,
    meanCompanionFluxEarth: companionFluxEarth,
  });
  const effectiveLuminosity = Math.max(
    Number(pairContext.combinedLuminosityLsol || 0) + companionFluxEarth,
    0,
  );
  return buildZones(system, {
    habitableZoneAu: effectiveHabitableZoneAu,
    frostLineAu: 4.85 * Math.sqrt(Math.max(effectiveLuminosity, 0)),
    systemInnerLimitAu: stability?.criticalInnerAu,
    diskTruncationAu: stability?.diskTruncationAu ?? null,
  });
}

export function buildHostFrames({
  stellarSystem: _stellarSystem,
  topology,
  starsById,
  pairsById,
  worldSystemInputs,
}) {
  const hostFramesById = Object.create(null);
  const nodeMassesById = buildNodeMassesById(topology, starsById);
  const nodeLabelsById = buildNodeLabelsById(topology, starsById, pairsById);

  for (const starId of topology.starIds) {
    const starContext = starsById[starId];
    if (!starContext) continue;
    const system = buildHostFrameSystem({
      starMassMsol: starContext.config.massMsol,
      luminosityLsol: starContext.model.luminosityLsol,
      radiusRsol: starContext.model.radiusRsol,
      tempK: starContext.model?.regime === "brownDwarf" ? starContext.model.tempK : null,
      worldSystemInputs,
    });
    const fluxModel = buildHierarchicalFluxModel({
      hostNodeId: starId,
      dominantStarIds: [starId],
      topology,
      pairsById,
      starsById,
      nodeLabelsById,
    });
    const outerStability = buildHierarchicalOuterStability({
      hostNodeId: starId,
      topology,
      pairsById,
      nodeMassesById,
      nodeLabelsById,
    });
    const companionBranches = buildCompanionBranches(fluxModel);
    const parentPairId = topology?.parentPairByChildId?.get(starId) || null;
    const stability = {
      modelVersion: "hierarchical-stability-v1",
      criticalInnerAu: system.systemInnerLimitAu,
      criticalOuterAu: outerStability.criticalOuterAu,
      diskTruncationAu: outerStability.diskTruncationAu,
      stable: true,
      warnings: [...outerStability.warnings],
      ancestorConstraints: [...outerStability.constraints],
    };

    hostFramesById[starId] = {
      id: starId,
      frameKind: "star",
      hostNodeId: starId,
      orbitFamilyKind:
        topology.topologyKind === "single" && !topology.pairIds.length ? "single" : "s-type",
      dominantStars: [starId],
      starIds: [starId],
      label: starContext.component.name,
      system,
      zones: buildCircumstellarZones({
        system,
        starContext,
        fluxModel,
        stability,
      }),
      fluxModel,
      stability,
      parentPairId,
      ancestorPairIds: [...(topology?.ancestorPairIdsByNodeId?.[starId] || [])],
      companionBranches,
      companionNodeId: companionBranches[0]?.companionNodeId || null,
      companionLabel: companionBranches.map((branch) => branch.label).join(" | "),
    };
  }

  for (const pairId of topology.pairIds) {
    const pairContext = pairsById[pairId];
    if (!pairContext) continue;
    const system = buildHostFrameSystem({
      starMassMsol: toFiniteNumber(pairContext.combinedMassMsol, 1),
      luminosityLsol: toFiniteNumber(pairContext.combinedLuminosityLsol, 1),
      radiusRsol: toFiniteNumber(pairContext.representativeRadiusRsol, 1),
      tempK: toFiniteNumber(pairContext.representativeTempK, null),
      worldSystemInputs,
    });
    const childAStarIds = topology.leafStarIdsByNodeId[pairContext.childA?.id] || [];
    const childBStarIds = topology.leafStarIdsByNodeId[pairContext.childB?.id] || [];
    const childAMassMsol = childAStarIds.reduce(
      (sum, starId) => sum + Number(starsById[starId]?.config?.massMsol || 0),
      0,
    );
    const childBMassMsol = childBStarIds.reduce(
      (sum, starId) => sum + Number(starsById[starId]?.config?.massMsol || 0),
      0,
    );
    const innerStability = buildPairFrameStability({
      systemModel: system,
      binarySemiMajorAxisAu: pairContext.semiMajorAxisAu,
      eccentricity: pairContext.eccentricity,
      primaryMassMsol: childAMassMsol,
      secondaryMassMsol: childBMassMsol,
    });
    const outerStability = buildHierarchicalOuterStability({
      hostNodeId: pairId,
      topology,
      pairsById,
      nodeMassesById,
      nodeLabelsById,
    });
    const fluxModel = buildHierarchicalFluxModel({
      hostNodeId: pairId,
      dominantStarIds: pairContext.starIds,
      topology,
      pairsById,
      starsById,
      nodeLabelsById,
    });
    const companionBranches = buildCompanionBranches(fluxModel);
    const label = pairContext.starIds
      .map((starId) => starsById[starId]?.component?.name || starId)
      .join(" + ");
    const stability = {
      ...innerStability,
      modelVersion: "hierarchical-stability-v1",
      criticalOuterAu: outerStability.criticalOuterAu,
      diskTruncationAu: outerStability.diskTruncationAu,
      warnings: [...innerStability.warnings, ...outerStability.warnings],
      ancestorConstraints: [...outerStability.constraints],
    };

    hostFramesById[pairId] = {
      id: pairId,
      frameKind: "pair",
      hostNodeId: pairId,
      orbitFamilyKind: "p-type",
      dominantStars: [...pairContext.starIds],
      starIds: [...pairContext.starIds],
      label,
      system,
      zones: buildCircumbinaryZones({
        system,
        pairContext,
        fluxModel,
        stability,
      }),
      fluxModel,
      stability,
      parentPairId: topology?.parentPairByChildId?.get(pairId) || null,
      ancestorPairIds: [...(topology?.ancestorPairIdsByNodeId?.[pairId] || [])],
      companionBranches,
      companionNodeId: companionBranches[0]?.companionNodeId || null,
      companionLabel: companionBranches.map((branch) => branch.label).join(" | "),
      pair: {
        childA: pairContext.childA,
        childB: pairContext.childB,
        semiMajorAxisAu: pairContext.semiMajorAxisAu,
        eccentricity: pairContext.eccentricity,
        inclinationDeg: pairContext.inclinationDeg,
        argPeriapsisDeg: pairContext.argPeriapsisDeg,
        meanAnomalyDeg: pairContext.meanAnomalyDeg,
      },
    };
  }

  return hostFramesById;
}
