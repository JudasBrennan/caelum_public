import { calcMoon } from "../engine/moon.js";
import { calcPlanetExact } from "../engine/planet.js";
import {
  buildWorldHomeSystemContext,
  getProjectedPrimaryStar,
  getStarOverrides,
  listMoons,
  listSystemGasGiants,
  loadWorld,
  resolveWorldHostFrameContext,
} from "./store.js";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function toFiniteNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeBodyHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function buildResolvedStarConfig(primaryStar, solveContext) {
  const starConfig =
    solveContext?.starConfig && typeof solveContext.starConfig === "object"
      ? solveContext.starConfig
      : {};
  const primaryStarOverrides = getStarOverrides(primaryStar || {});

  return {
    massMsol: toFiniteNumber(starConfig.massMsol, toFiniteNumber(primaryStar?.massMsol, 1)),
    ageGyr: toFiniteNumber(starConfig.ageGyr, toFiniteNumber(primaryStar?.ageGyr, 4.6)),
    metallicityFeH: toFiniteNumber(
      starConfig.metallicityFeH,
      toFiniteNumber(primaryStar?.metallicityFeH, 0),
    ),
    radiusRsolOverride: hasOwn(starConfig, "radiusRsolOverride")
      ? starConfig.radiusRsolOverride
      : primaryStarOverrides.r,
    luminosityLsolOverride: hasOwn(starConfig, "luminosityLsolOverride")
      ? starConfig.luminosityLsolOverride
      : primaryStarOverrides.l,
    tempKOverride: hasOwn(starConfig, "tempKOverride")
      ? starConfig.tempKOverride
      : primaryStarOverrides.t,
    evolutionMode: starConfig.evolutionMode || primaryStarOverrides.ev,
  };
}

export function resolvePlanetWorldHostFrameContext(
  world = loadWorld(),
  planetLike = null,
  { homeSystemContext = null, hostFrameId = null } = {},
) {
  const resolvedHomeSystemContext = homeSystemContext || buildWorldHomeSystemContext(world);
  const fallbackHostFrameId =
    resolvedHomeSystemContext?.defaultHostFrameId ||
    resolvedHomeSystemContext?.primaryStarId ||
    null;
  const requestedHostFrameId = normalizeBodyHostFrameId(
    hostFrameId ?? planetLike?.hostFrameId,
    fallbackHostFrameId,
  );
  const solveContext = resolveWorldHostFrameContext(
    world,
    requestedHostFrameId,
    resolvedHomeSystemContext,
  );
  return {
    homeSystemContext: resolvedHomeSystemContext,
    hostFrameId: normalizeBodyHostFrameId(
      solveContext?.hostFrameId,
      requestedHostFrameId || fallbackHostFrameId,
    ),
    solveContext,
  };
}

export function buildPlanetSolveArgsForWorld(
  world = loadWorld(),
  planetLike = null,
  {
    detailLevel,
    gasGiants = null,
    homeSystemContext = null,
    hostFrameId = null,
    includeGasGiants = true,
    includeMoons = true,
    moons = null,
    primaryStar = null,
  } = {},
) {
  const resolvedPrimaryStar = primaryStar || getProjectedPrimaryStar(world);
  const {
    homeSystemContext: resolvedHomeSystemContext,
    hostFrameId: resolvedHostFrameId,
    solveContext,
  } = resolvePlanetWorldHostFrameContext(world, planetLike, {
    homeSystemContext,
    hostFrameId,
  });
  const starConfig = buildResolvedStarConfig(resolvedPrimaryStar, solveContext);
  const planetInputs = planetLike?.inputs || planetLike || {};
  const planetId = String(planetLike?.id || "").trim();
  const fallbackHostFrameId =
    resolvedHomeSystemContext?.defaultHostFrameId ||
    resolvedHomeSystemContext?.primaryStarId ||
    null;
  const siblingMoons = includeMoons
    ? (moons || listMoons(world))
        .filter((moon) => String(moon?.planetId || "") === planetId)
        .map((moon) => ({
          id: moon.id,
          ...(moon.inputs || {}),
        }))
    : [];
  const scopedGasGiants = includeGasGiants
    ? (gasGiants || listSystemGasGiants(world))
        .filter(
          (gasGiant) =>
            normalizeBodyHostFrameId(gasGiant?.hostFrameId, fallbackHostFrameId) ===
            resolvedHostFrameId,
        )
        .map((gasGiant) => ({
          name: gasGiant.name,
          au: gasGiant.au,
        }))
    : [];
  const args = {
    starMassMsol: starConfig.massMsol,
    starAgeGyr: starConfig.ageGyr,
    starMetallicityFeH: starConfig.metallicityFeH,
    starRadiusRsolOverride: starConfig.radiusRsolOverride,
    starLuminosityLsolOverride: starConfig.luminosityLsolOverride,
    starTempKOverride: starConfig.tempKOverride,
    starEvolutionMode: starConfig.evolutionMode,
    hostFrameId: resolvedHostFrameId,
    hostFrame: solveContext?.hostFrame || null,
    hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
    companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
    companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
    fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
    planet: planetInputs,
    moons: siblingMoons,
    gasGiants: scopedGasGiants,
  };
  if (typeof detailLevel === "string" && detailLevel) args.detailLevel = detailLevel;
  return {
    args,
    homeSystemContext: resolvedHomeSystemContext,
    hostFrameId: resolvedHostFrameId,
    primaryStar: resolvedPrimaryStar,
    solveContext,
    starConfig,
  };
}

export function solvePlanetExactForWorld(world = loadWorld(), planetLike = null, options = {}) {
  const bundle = buildPlanetSolveArgsForWorld(world, planetLike, options);
  return {
    ...bundle,
    model: calcPlanetExact(bundle.args),
  };
}

export function buildMoonSolveArgsForWorld(
  world = loadWorld(),
  planetLike = null,
  moonLike = null,
  {
    detailLevel,
    homeSystemContext = null,
    hostFrameId = null,
    moonSystemContext = null,
    parentOverride = null,
    primaryStar = null,
  } = {},
) {
  const planetBundle = buildPlanetSolveArgsForWorld(world, planetLike, {
    detailLevel,
    homeSystemContext,
    hostFrameId,
    includeGasGiants: false,
    includeMoons: false,
    primaryStar,
  });
  const args = {
    starMassMsol: planetBundle.starConfig.massMsol,
    starAgeGyr: planetBundle.starConfig.ageGyr,
    starMetallicityFeH: planetBundle.starConfig.metallicityFeH,
    starRadiusRsolOverride: planetBundle.starConfig.radiusRsolOverride,
    starLuminosityLsolOverride: planetBundle.starConfig.luminosityLsolOverride,
    starTempKOverride: planetBundle.starConfig.tempKOverride,
    starEvolutionMode: planetBundle.starConfig.evolutionMode,
    starHabitableZoneAu: planetBundle.solveContext?.hostFrame?.zones?.habitableZoneAu || null,
    hostFrameId: planetBundle.hostFrameId,
    hostFrame: planetBundle.solveContext?.hostFrame || null,
    hostXuvFluxEarthAt1Au: planetBundle.solveContext?.hostXuvFluxEarthAt1Au ?? null,
    companionFluxEarth: planetBundle.solveContext?.companionFluxEarth ?? 0,
    companionXuvFluxEarth: planetBundle.solveContext?.companionXuvFluxEarth ?? 0,
    fluxVariabilityFraction: planetBundle.solveContext?.fluxVariabilityFraction ?? 0,
    planet: planetLike?.inputs || planetLike || {},
    moon: moonLike?.inputs || moonLike || {},
  };
  if (parentOverride) args.parentOverride = parentOverride;
  if (moonSystemContext) args.moonSystemContext = moonSystemContext;
  if (typeof detailLevel === "string" && detailLevel) args.detailLevel = detailLevel;
  return {
    ...planetBundle,
    args,
    moon: moonLike || null,
  };
}

export function solveMoonForWorld(
  world = loadWorld(),
  planetLike = null,
  moonLike = null,
  options = {},
) {
  const bundle = buildMoonSolveArgsForWorld(world, planetLike, moonLike, options);
  return {
    ...bundle,
    model: calcMoon(bundle.args),
  };
}
