import { calcComet } from "./comet.js";
import { buildSmallBodyReservoirContext } from "./contexts/smallBodyReservoirContext.js";
import { calcDebrisDisk } from "./debrisDisk.js";
import { calcOortCloud, resolveOortCloudModel } from "./oortCloud.js";
import { resolveWorldStarConfig } from "./worldStarConfig.js";

function orderedItems(section) {
  if (Array.isArray(section)) return section.filter(Boolean);
  if (!section || typeof section !== "object") return [];
  const byId = section.byId && typeof section.byId === "object" ? section.byId : {};
  const order = Array.isArray(section.order) ? section.order : Object.keys(byId);
  return order.map((id) => byId[id]).filter(Boolean);
}

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function resolvedStarLuminosityLsol(primaryStar, starConfig, starModel) {
  return toFiniteNumber(
    starModel?.luminosityLsol,
    toFiniteNumber(
      starConfig?.luminosityLsolOverride,
      toFiniteNumber(
        primaryStar?.luminosityLsol,
        toFiniteNumber(primaryStar?.luminosityLsolOverride, toFiniteNumber(primaryStar?.l, 1)),
      ),
    ),
  );
}

function resolvedStarTempK(primaryStar, starConfig, starModel) {
  return toFiniteNumber(
    starModel?.tempK,
    toFiniteNumber(
      starConfig?.tempKOverride,
      toFiniteNumber(primaryStar?.tempK, toFiniteNumber(primaryStar?.temperatureK, 5772)),
    ),
  );
}

export function buildScopedGasGiantInputs(
  gasGiants = [],
  fallbackHostFrameId = null,
  resolvedHostFrameId = null,
) {
  return (Array.isArray(gasGiants) ? gasGiants : [])
    .filter(
      (gasGiant) =>
        normalizeHostFrameId(gasGiant?.hostFrameId, fallbackHostFrameId) === resolvedHostFrameId,
    )
    .map((gasGiant) => ({
      id: gasGiant.id,
      name: gasGiant.name,
      au: gasGiant.au ?? gasGiant.orbitAu ?? gasGiant.semiMajorAxisAu,
      massMjup: gasGiant.massMjup ?? gasGiant.massJupiter ?? gasGiant.massMj,
    }));
}

export function buildSmallBodyReservoirContextForWorld(
  world = {},
  {
    fallbackHostFrameId = null,
    gasGiants = null,
    hostFrameId = null,
    primaryStar = null,
    starConfig = null,
    starModel = null,
  } = {},
) {
  const resolvedStarConfig =
    starConfig && typeof starConfig === "object" ? starConfig : resolveWorldStarConfig(world);
  const resolvedPrimaryStar =
    primaryStar && typeof primaryStar === "object" ? primaryStar : world?.star || {};
  const resolvedHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  const resolvedFallbackHostFrameId = normalizeHostFrameId(
    fallbackHostFrameId,
    resolvedHostFrameId,
  );
  const scopedGasGiants = buildScopedGasGiantInputs(
    gasGiants || orderedItems(world?.system?.gasGiants),
    resolvedFallbackHostFrameId,
    resolvedHostFrameId,
  );
  const starLuminosityLsol = resolvedStarLuminosityLsol(
    resolvedPrimaryStar,
    resolvedStarConfig,
    starModel,
  );
  const starTempK = resolvedStarTempK(resolvedPrimaryStar, resolvedStarConfig, starModel);
  const debrisDisks = orderedItems(world?.system?.debrisDisks)
    .filter(
      (disk) =>
        normalizeHostFrameId(disk?.hostFrameId, resolvedFallbackHostFrameId) ===
        resolvedHostFrameId,
    )
    .map((disk) => ({
      ...calcDebrisDisk({
        innerAu: disk.innerAu,
        outerAu: disk.outerAu,
        eccentricity: disk.eccentricity,
        inclination: disk.inclination,
        totalMassMearth:
          disk.totalMassMearth ?? disk.estimatedMassMearth ?? disk.massMearth ?? null,
        starMassMsol: resolvedStarConfig.massMsol,
        starLuminosityLsol,
        starAgeGyr: resolvedStarConfig.ageGyr,
        starTeffK: starTempK,
        starMetallicityFeH: resolvedStarConfig.metallicityFeH,
        gasGiants: scopedGasGiants,
      }),
      id: disk.id,
      name: disk.name,
      hostFrameId: normalizeHostFrameId(disk.hostFrameId, resolvedFallbackHostFrameId),
    }));
  const autoOortModel = calcOortCloud({
    starMassMsol: resolvedStarConfig.massMsol,
    starAgeGyr: resolvedStarConfig.ageGyr,
    locationLy: world?.cluster?.locationLy ?? world?.galaxy?.locationLy,
    galactocentricDistanceLy:
      world?.cluster?.galactocentricDistanceLy ?? world?.galaxy?.galactocentricDistanceLy,
    stellarDensityPerLy3:
      world?.cluster?.stellarDensityPerLy3 ?? world?.galaxy?.stellarDensityPerLy3,
    gasGiants: scopedGasGiants,
  });
  const oortCloud = resolveOortCloudModel({
    autoModel: autoOortModel,
    config: world?.system?.oortCloud,
  }).resolved;
  const comets = orderedItems(world?.system?.comets)
    .filter(
      (comet) =>
        normalizeHostFrameId(comet?.hostFrameId, resolvedFallbackHostFrameId) ===
        resolvedHostFrameId,
    )
    .map((comet) =>
      calcComet({
        comet,
        starMassMsol: resolvedStarConfig.massMsol,
        starLuminosityLsol,
      }),
    );

  const hasReservoirEvidence =
    debrisDisks.length > 0 ||
    comets.length > 0 ||
    oortCloud.present === true ||
    Number(oortCloud.injectionRatePerMyr) > 0;
  if (!hasReservoirEvidence) return null;

  return buildSmallBodyReservoirContext({
    debrisDisks,
    oortCloud,
    comets,
    gasGiantArchitecture: {
      shieldingScore: scopedGasGiants.length ? 0.45 : 0.15,
      scatteringScore: scopedGasGiants.length > 1 ? 0.35 : 0.12,
    },
    ageGyr: resolvedStarConfig.ageGyr,
  });
}
