import { resolveHostFrameContext } from "../../engine/homeSystem/context.js";
import { calcStar } from "../../engine/star.js";
import { calcSystem } from "../../engine/system.js";
import { fmt } from "../../engine/utils.js";
import {
  buildWorldHomeSystemContext,
  getProjectedPrimaryStar,
  getStarOverrides,
} from "../store.js";

export function findNearestSlot(targetAu, orbitsAu, occupiedSlots) {
  let bestSlot = null;
  let bestDist = Infinity;
  for (let i = 0; i < orbitsAu.length; i += 1) {
    const slot = i + 1;
    if (occupiedSlots.has(slot)) continue;
    const dist = Math.abs(orbitsAu[i] - targetAu);
    if (dist < bestDist) {
      bestDist = dist;
      bestSlot = slot;
    }
  }
  return bestSlot;
}

export function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

export function buildPlanetHomeSystemContext(world) {
  return buildWorldHomeSystemContext(world);
}

function buildFallbackHostFrameSolveContext(world, homeSystemContext, sysModel = null) {
  const primaryStar = getProjectedPrimaryStar(world);
  const starOverrides = getStarOverrides(primaryStar || {});
  const fallbackStarConfig = {
    massMsol: Number(primaryStar?.massMsol) || 1,
    ageGyr: Number(primaryStar?.ageGyr) || 4.6,
    metallicityFeH: Number(primaryStar?.metallicityFeH) || 0,
    radiusRsolOverride: starOverrides.r,
    luminosityLsolOverride: starOverrides.l,
    tempKOverride: starOverrides.t,
    evolutionMode: starOverrides.ev,
  };
  const fallbackStarModel = calcStar({
    massMsol: fallbackStarConfig.massMsol,
    ageGyr: fallbackStarConfig.ageGyr,
    metallicityFeH: fallbackStarConfig.metallicityFeH,
    radiusRsolOverride: fallbackStarConfig.radiusRsolOverride,
    luminosityLsolOverride: fallbackStarConfig.luminosityLsolOverride,
    tempKOverride: fallbackStarConfig.tempKOverride,
    evolutionMode: fallbackStarConfig.evolutionMode,
  });
  const fallbackSystem =
    sysModel ||
    calcSystem({
      starMassMsol: fallbackStarConfig.massMsol,
      spacingFactor: Number(world?.system?.spacingFactor),
      orbit1Au: Number(world?.system?.orbit1Au),
      luminosityLsolOverride: fallbackStarModel.luminosityLsol,
      radiusRsolOverride: fallbackStarModel.radiusRsol,
    });
  const defaultHostFrameId =
    homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || "star_a";
  return {
    hostFrameId: defaultHostFrameId,
    hostFrame: {
      id: defaultHostFrameId,
      label: primaryStar?.name || "Star",
      frameKind: "star",
      orbitFamilyKind: "single",
      system: fallbackSystem,
      zones: {
        habitableZoneAu: fallbackStarModel.habitableZoneAu,
        frostLineAu: fallbackSystem.frostLineAu,
        systemInnerLimitAu: fallbackSystem.systemInnerLimitAu,
        orbitsAu: [...fallbackSystem.orbitsAu],
      },
      fluxModel: {
        meanCompanionFluxEarth: 0,
        fluxVariabilityFraction: 0,
        meanCompanionXuvFluxEarth: 0,
      },
      stability: {
        criticalOuterAu: null,
        diskTruncationAu: null,
        warnings: [],
      },
    },
    starId: homeSystemContext?.primaryStarId || defaultHostFrameId,
    starConfig: fallbackStarConfig,
    starModel: fallbackStarModel,
    hostXuvFluxEarthAt1Au: null,
    companionFluxEarth: 0,
    companionXuvFluxEarth: 0,
    fluxVariabilityFraction: 0,
    dominantContributorId: homeSystemContext?.primaryStarId || defaultHostFrameId,
  };
}

export function resolvePlanetPageHostFrameContext(
  world,
  bodyLike,
  sysModel = null,
  homeSystemContext = null,
) {
  const resolvedHomeSystemContext = homeSystemContext || buildPlanetHomeSystemContext(world);
  const requestedHostFrameId = normalizeHostFrameId(
    bodyLike?.hostFrameId,
    resolvedHomeSystemContext?.defaultHostFrameId || resolvedHomeSystemContext?.primaryStarId,
  );
  return (
    resolveHostFrameContext(resolvedHomeSystemContext, requestedHostFrameId) ||
    buildFallbackHostFrameSolveContext(world, resolvedHomeSystemContext, sysModel)
  );
}

export function filterBodiesForHostFrame(entries, hostFrameId, fallbackHostFrameId) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  return (entries || []).filter(
    (entry) => normalizeHostFrameId(entry?.hostFrameId, fallbackHostFrameId) === targetHostFrameId,
  );
}

export function buildHostFrameOptions(homeSystemContext, selectedHostFrameId = null) {
  const hostFrames = Object.values(homeSystemContext?.hostFramesById || {});
  const fallbackHostFrameId =
    homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || null;
  const normalizedSelectedId = normalizeHostFrameId(selectedHostFrameId, fallbackHostFrameId);
  return hostFrames.map((hostFrame) => {
    const scopeLabel =
      hostFrame.frameKind === "pair"
        ? "circumbinary"
        : hostFrame.orbitFamilyKind === "single"
          ? "primary star"
          : "circumstellar";
    return {
      value: hostFrame.id,
      label: `${hostFrame.label} - ${scopeLabel}`,
      selected: hostFrame.id === normalizedSelectedId,
    };
  });
}

export function formatHostFrameScopeLabel(hostFrame) {
  if (!hostFrame) return "single-star host";
  if (hostFrame.frameKind === "pair") return "circumbinary";
  if (hostFrame.orbitFamilyKind === "single") return "single-star host";
  return "circumstellar";
}

export function formatHostFrameStabilityHint(hostFrame) {
  if (!hostFrame) return "";
  if (hostFrame.frameKind === "pair") {
    const criticalInnerAu = Number(hostFrame.stability?.criticalInnerAu);
    const criticalOuterAu = Number(hostFrame.stability?.criticalOuterAu);
    if (
      Number.isFinite(criticalInnerAu) &&
      criticalInnerAu > 0 &&
      Number.isFinite(criticalOuterAu) &&
      criticalOuterAu > 0
    ) {
      return `Pair-host stability runs roughly from ${fmt(criticalInnerAu, 3)} to ${fmt(criticalOuterAu, 3)} AU.`;
    }
    if (Number.isFinite(criticalInnerAu) && criticalInnerAu > 0) {
      return `Circumbinary stability begins around ${fmt(criticalInnerAu, 3)} AU.`;
    }
    if (Number.isFinite(criticalOuterAu) && criticalOuterAu > 0) {
      return `Outer hierarchical stability tapers off around ${fmt(criticalOuterAu, 3)} AU.`;
    }
    const innerEdgeAu = Number(hostFrame.stability?.circumbinaryInnerEdgeAu);
    if (Number.isFinite(innerEdgeAu) && innerEdgeAu > 0) {
      return `Likely cleared inner circumbinary disk inside ${fmt(innerEdgeAu, 3)} AU.`;
    }
    return "";
  }
  const criticalOuterAu = Number(hostFrame.stability?.criticalOuterAu);
  if (Number.isFinite(criticalOuterAu) && criticalOuterAu > 0) {
    return `Circumstellar stability out to roughly ${fmt(criticalOuterAu, 3)} AU.`;
  }
  return "";
}

export function getHostFrameZoneLabel(hostFrame) {
  return String(hostFrame?.zones?.zoneLabel || "Habitable Zone");
}

export function formatHabitableZoneText(habitableZoneAu, zoneLabel = "Habitable Zone") {
  if (
    !habitableZoneAu ||
    !Number.isFinite(Number(habitableZoneAu.inner)) ||
    !Number.isFinite(Number(habitableZoneAu.outer))
  ) {
    return `${zoneLabel} unavailable`;
  }
  return `${zoneLabel} ${fmt(habitableZoneAu.inner, 3)}-${fmt(habitableZoneAu.outer, 3)} AU`;
}

export function formatHostFrameHint(solveContext) {
  const hostFrame = solveContext?.hostFrame;
  if (!hostFrame) return "Choose which host frame this body orbits.";
  const parts = [
    `${hostFrame.label} (${formatHostFrameScopeLabel(hostFrame)}).`,
    formatHabitableZoneText(hostFrame.zones?.habitableZoneAu, getHostFrameZoneLabel(hostFrame)),
  ];
  const companionFluxEarth = Number(solveContext?.companionFluxEarth || 0);
  if (hostFrame.frameKind === "pair") {
    parts.push("Combined light from the pair sets the climate in this frame.");
  } else if (companionFluxEarth > 0.0005) {
    parts.push(`Companion adds about ${fmt(companionFluxEarth, 3)}x Earth flux on average.`);
  } else {
    parts.push("Companion heating is negligible here.");
  }
  const variability = Number(solveContext?.fluxVariabilityFraction || 0);
  if (variability > 0.001) {
    parts.push(`Flux swing about ${fmt(variability * 100, 1)}% across the binary orbit.`);
  }
  const stabilityText = formatHostFrameStabilityHint(hostFrame);
  if (stabilityText) parts.push(stabilityText);
  return parts.join(" ");
}

export function buildSelectedBodyContextReadout(solveContext) {
  if (!solveContext?.hostFrame) return "Host-frame context unavailable.";
  const hostFrame = solveContext.hostFrame;
  const lines = [
    `Host frame: ${hostFrame.label} (${formatHostFrameScopeLabel(hostFrame)})`,
    `${hostFrame.frameKind === "pair" ? "System mass" : "Primary star mass"}: ${fmt(Number(solveContext.starConfig?.massMsol) || 0, 4)} Msol`,
    `${hostFrame.frameKind === "pair" ? "System age" : "Primary star age"}: ${fmt(Number(solveContext.starConfig?.ageGyr) || 0, 3)} Gyr`,
    formatHabitableZoneText(hostFrame.zones?.habitableZoneAu, getHostFrameZoneLabel(hostFrame)),
  ];
  const companionFluxEarth = Number(solveContext.companionFluxEarth || 0);
  lines.push(
    hostFrame.frameKind === "pair"
      ? "Host flux: combined pair light"
      : companionFluxEarth > 0.0005
        ? `Companion flux: ${fmt(companionFluxEarth, 3)}x Earth`
        : "Companion flux: negligible",
  );
  const variability = Number(solveContext.fluxVariabilityFraction || 0);
  lines.push(
    variability > 0.001
      ? `Flux variability: ${fmt(variability * 100, 1)}%`
      : "Flux variability: low",
  );
  const stabilityText = formatHostFrameStabilityHint(hostFrame);
  if (stabilityText) lines.push(stabilityText);
  return lines.join("\n");
}
