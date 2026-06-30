import { calcStar } from "./star.js";
import { calcSystem } from "./system.js";
import { calcPlanetExact } from "./planet.js";
import { calcGasGiant } from "./gasGiant.js";
import { buildSolvedMoonInfluenceSummary } from "./gasGiant/moonInfluenceSummary.js";
import { calcPlanetaryBody } from "./planetaryBody.js";
import {
  buildGasGiantMoonParentOverride,
  buildRockyMoonParentOverride,
  solveMoonSystem,
} from "./moon/system.js";
import { buildHomeSystemContext, resolveHostFrameContext } from "./homeSystem/context.js";
import { buildSmallBodyReservoirContextForWorld } from "./smallBodyReservoirRouting.js";
import { summarizeStellarLifecycleTrack } from "./stellarLifecycle.js";
import { resolveWorldStarConfig } from "./worldStarConfig.js";

function orderedItems(section) {
  if (!section || typeof section !== "object") return [];
  const byId = section.byId && typeof section.byId === "object" ? section.byId : {};
  const order = Array.isArray(section.order) ? section.order : Object.keys(byId);
  return order.map((id) => byId[id]).filter(Boolean);
}

function sanitizeMode(mode) {
  return mode === "summary" ? "summary" : "full";
}

function sanitizeDetailLevel(detailLevel) {
  return detailLevel === "summary" ? "summary" : "full";
}

function shallowCloneRaw(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    inputs:
      raw.inputs && typeof raw.inputs === "object"
        ? {
            ...raw.inputs,
          }
        : raw.inputs,
  };
}

function sortByOrbit(items) {
  return [...items].sort((left, right) => left.orbitAu - right.orbitAu);
}

function summarizeStellarLifecycleImpactsForHostFrame(
  homeSystemContext,
  fallbackSolveContext,
  hostFrameId,
  orbitEntries,
) {
  const entries = Array.isArray(orbitEntries) ? orbitEntries : [];
  const solveContext =
    resolveHostFrameContext(homeSystemContext, hostFrameId) || fallbackSolveContext || null;
  const track = solveContext?.starModel?.stellarLifecycle || null;
  if (!track?.samples?.length) return null;
  const summary = summarizeStellarLifecycleTrack({
    samples: track.samples,
    currentSample: track.currentSample,
    stageSequence: track.stageSequence,
    planetOrbitsAu: entries.map((entry) => entry.orbitAu),
  });
  return {
    hostFrameId: hostFrameId || null,
    starId: solveContext?.starId || solveContext?.dominantContributorId || null,
    currentStage: summary.currentStage,
    confidence: summary.confidence,
    mainSequenceLifetimeGyr: summary.mainSequenceLifetimeGyr,
    remnantFormationAgeGyr: summary.remnantFormationAgeGyr,
    remnant: summary.remnant,
    habitableZoneMovement: summary.habitableZoneMovement,
    planetHzImpacts: summary.planetHzImpacts.map((impact, index) => ({
      ...impact,
      bodyId: entries[index]?.id || null,
      bodyKind: entries[index]?.kind || null,
      bodyLabel: entries[index]?.name || entries[index]?.id || null,
    })),
    warnings: summary.warnings,
  };
}

function normalizeHostFrameId(value, fallbackId) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function buildFallbackHostFrameSolveContext(context, fallbackHostFrameId) {
  if (!context?.homeSystemContext) return null;
  const resolved =
    resolveHostFrameContext(context.homeSystemContext, fallbackHostFrameId) ||
    resolveHostFrameContext(
      context.homeSystemContext,
      context.homeSystemContext.defaultHostFrameId,
    );
  if (resolved) return resolved;
  return {
    hostFrameId: fallbackHostFrameId,
    hostFrame: null,
    starId: context.homeSystemContext.primaryStarId,
    starConfig: context.starConfig,
    starModel: context.star,
    companionFluxEarth: 0,
    companionXuvFluxEarth: 0,
    hostWindPressureEarthAt1Au:
      context.star?.stellarEnvironment?.wind?.ramPressureEarthRatioAt1Au ?? null,
    companionWindPressureEarth: 0,
    fluxVariabilityFraction: 0,
    dominantContributorId: context.homeSystemContext.primaryStarId,
  };
}

function groupMoonInputsByParentId(moonEntries) {
  const moonInputsByParentId = new Map();
  for (const raw of moonEntries) {
    if (!raw?.planetId) continue;
    if (!moonInputsByParentId.has(raw.planetId)) {
      moonInputsByParentId.set(raw.planetId, []);
    }
    moonInputsByParentId.get(raw.planetId).push({
      id: raw.id,
      ...(raw.inputs || {}),
    });
  }
  return moonInputsByParentId;
}

function groupMoonIdsByParentId(moonEntries) {
  const moonsByParentId = {};
  for (const raw of moonEntries) {
    if (!raw?.planetId) continue;
    if (!moonsByParentId[raw.planetId]) moonsByParentId[raw.planetId] = [];
    moonsByParentId[raw.planetId].push(raw.id);
  }
  return moonsByParentId;
}

function buildOtherGiantsById(gasGiantEntries) {
  const byId = new Map();
  for (const entry of gasGiantEntries) {
    byId.set(
      entry.id,
      gasGiantEntries.filter((other) => other.id !== entry.id),
    );
  }
  return byId;
}

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function optionalString(value) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function optionalFlag(value) {
  if (value === true || value === false) return value;
  return optionalString(value);
}

function optionalNumberFields(source, keys) {
  const result = {};
  for (const key of keys) {
    const value = finiteOrNull(source?.[key]);
    if (value != null) result[key] = value;
  }
  return result;
}

function optionalStringFields(source, keys) {
  const result = {};
  for (const key of keys) {
    const value = optionalString(source?.[key]);
    if (value !== undefined) result[key] = value;
  }
  return result;
}

function optionalFlagFields(source, keys) {
  const result = {};
  for (const key of keys) {
    const value = optionalFlag(source?.[key]);
    if (value !== undefined) result[key] = value;
  }
  return result;
}

function planetaryBodyKey(legacyKind, id) {
  return `${legacyKind === "gasGiant" ? "gasGiant" : "planet"}:${id}`;
}

function toRockyUnifiedBody(raw, idx = 1) {
  const inputs = raw?.inputs && typeof raw.inputs === "object" ? raw.inputs : {};
  const massEarth = finiteOrNull(inputs.massEarth) ?? 1;
  return {
    id: String(raw?.id || `p${idx}`),
    name: String(raw?.name || inputs.name || raw?.id || `Planet ${idx}`),
    role: "planetaryBody",
    bodyType: "planetaryBody",
    legacyKind: "rocky",
    authoringIntent: raw?.authoringIntent || inputs.authoringIntent || "rocky",
    hostFrameId: normalizeHostFrameId(raw?.hostFrameId, null),
    slotIndex: finiteOrNull(raw?.slotIndex),
    locked: Boolean(raw?.locked),
    orbit: {
      semiMajorAxisAu: finiteOrNull(inputs.semiMajorAxisAu) ?? 0,
      eccentricity: finiteOrNull(inputs.eccentricity),
      inclinationDeg: finiteOrNull(inputs.inclinationDeg),
      longitudeOfPeriapsisDeg: finiteOrNull(inputs.longitudeOfPeriapsisDeg),
    },
    rotation: {
      axialTiltDeg: finiteOrNull(inputs.axialTiltDeg),
      rotationPeriodHours: finiteOrNull(inputs.rotationPeriodHours),
      subsolarLongitudeDeg: finiteOrNull(inputs.subsolarLongitudeDeg),
    },
    composition: {
      massEarth,
      radiusEarth: finiteOrNull(inputs.radiusEarth),
      cmfPct: finiteOrNull(inputs.cmfPct),
      wmfPct: finiteOrNull(inputs.wmfPct) ?? 0,
      hHeEnvelopeMassPct: finiteOrNull(inputs.hHeEnvelopeMassPct) ?? 0,
      ...optionalStringFields(inputs, ["carbonRichness"]),
      ...optionalNumberFields(inputs, ["bulkDensityGcm3"]),
    },
    thermal: {
      ...optionalNumberFields(inputs, ["internalHeatFluxWm2", "tidalHeatFluxWm2"]),
    },
    history: {
      ...optionalFlagFields(inputs, [
        "strippedEnvelopeCandidate",
        "migratedCloseIn",
        "rogueCandidate",
      ]),
    },
    selector: {
      type: "planet",
      value: `planet:${raw?.id || `p${idx}`}`,
      badge: massEarth < 0.01 ? "D" : "R",
    },
    classificationSeed: {
      source: "legacy-rocky",
      legacyKind: "rocky",
      massEarth,
      radiusEarth: finiteOrNull(inputs.radiusEarth),
      cmfPct: finiteOrNull(inputs.cmfPct),
      wmfPct: finiteOrNull(inputs.wmfPct) ?? 0,
      hHeEnvelopeMassPct: finiteOrNull(inputs.hHeEnvelopeMassPct) ?? 0,
      companionClass: null,
    },
    legacy: {
      kind: "rocky",
      collection: "world.planets",
      source: raw,
    },
  };
}

function toGasGiantUnifiedBody(raw, idx = 1) {
  const id = String(raw?.id || `gg${idx}`);
  const massMjup = finiteOrNull(raw?.massMjup ?? raw?.massJupiter ?? raw?.massMj);
  const radiusRj = finiteOrNull(
    raw?.radiusRj ?? raw?.radiusJupiter ?? raw?.sizeRj ?? raw?.radiusRadiiJupiter,
  );
  const companionClass = String(raw?.companionClass || "gasGiant");
  const isSubstellar = companionClass === "brownDwarf";
  return {
    id,
    name: String(raw?.name || id),
    role: isSubstellar ? "substellarCompanion" : "planetaryBody",
    bodyType: "planetaryBody",
    legacyKind: "gasGiant",
    authoringIntent: raw?.authoringIntent || (isSubstellar ? "substellar" : "gasGiant"),
    hostFrameId: normalizeHostFrameId(raw?.hostFrameId, null),
    slotIndex: finiteOrNull(raw?.slotIndex),
    locked: Boolean(raw?.locked),
    orbit: {
      semiMajorAxisAu: finiteOrNull(raw?.au ?? raw?.orbitAu ?? raw?.semiMajorAxisAu) ?? 0,
      eccentricity: finiteOrNull(raw?.eccentricity ?? raw?.ecc),
      inclinationDeg: finiteOrNull(raw?.inclinationDeg ?? raw?.inclination),
      longitudeOfPeriapsisDeg: finiteOrNull(
        raw?.longitudeOfPeriapsisDeg ?? raw?.longitudeOfPeriapsis ?? raw?.argPeriapsisDeg,
      ),
    },
    rotation: {
      axialTiltDeg: finiteOrNull(raw?.axialTiltDeg ?? raw?.axialTilt ?? raw?.obliquity),
      rotationPeriodHours: finiteOrNull(
        raw?.rotationPeriodHours ?? raw?.rotationHours ?? raw?.rotPeriodH,
      ),
      subsolarLongitudeDeg: null,
    },
    giant: {
      massMjup,
      radiusRj,
      metallicitySolar: finiteOrNull(raw?.metallicity ?? raw?.metallicitySolar),
      companionClass,
    },
    composition: {
      massEarth: massMjup == null ? null : massMjup * 317.83,
      radiusEarth: radiusRj == null ? null : radiusRj * (69911 / 6371),
      cmfPct: null,
      wmfPct: null,
      hHeEnvelopeMassPct: null,
      ...optionalStringFields(raw, ["carbonRichness"]),
      ...optionalNumberFields(raw, ["bulkDensityGcm3"]),
    },
    thermal: {
      ...optionalNumberFields(raw, ["internalHeatFluxWm2", "tidalHeatFluxWm2"]),
    },
    history: {
      ...optionalFlagFields(raw, [
        "strippedEnvelopeCandidate",
        "migratedCloseIn",
        "rogueCandidate",
      ]),
    },
    selector: {
      type: "gasGiant",
      value: `gasGiant:${id}`,
      badge: isSubstellar ? "B" : "G",
    },
    classificationSeed: {
      source: "legacy-gas-giant",
      legacyKind: "gasGiant",
      massEarth: massMjup == null ? null : massMjup * 317.83,
      radiusEarth: radiusRj == null ? null : radiusRj * (69911 / 6371),
      massMjup,
      radiusRj,
      companionClass,
      style: raw?.style || "",
    },
    legacy: {
      kind: "gasGiant",
      collection: "world.system.gasGiants",
      source: raw,
    },
  };
}

function toPlanetaryBodyEntry({ raw, body, model, moonIds, mode, hostFrameId }) {
  const orbitAu = Number(model?.orbit?.semiMajorAxisAu);
  const base = {
    id: body.id,
    key: planetaryBodyKey(body.legacyKind, body.id),
    kind: "planetaryBody",
    legacyKind: body.legacyKind,
    role: model?.role || body.role || "planetaryBody",
    name: body.name || body.id,
    orbitAu: Number.isFinite(orbitAu) ? orbitAu : 0,
    moonIds,
    hostFrameId,
    classification: model?.classification || null,
  };

  if (mode === "summary") {
    return {
      ...base,
      radiusEarth: model?.physical?.radiusEarth ?? null,
      radiusRj: model?.physical?.radiusRj ?? null,
      surfaceTempK: model?.thermal?.surfaceTempK ?? null,
      effectiveTempK: model?.thermal?.effectiveTempK ?? null,
      orbitalPeriodDays: model?.orbit?.orbitalPeriodDays ?? null,
      orbitalPeriodYears: model?.orbit?.orbitalPeriodYears ?? null,
      ringType: model?.rings?.ringType ?? null,
    };
  }

  return {
    ...base,
    source: shallowCloneRaw(raw),
    model,
  };
}

function toPlanetEntry(raw, model, moonIds, mode, hostFrameId) {
  const base = {
    id: raw.id,
    kind: "planet",
    name: raw.name || raw.inputs?.name || raw.id,
    orbitAu: model.inputs.semiMajorAxisAu,
    moonIds,
    hostFrameId,
  };

  if (mode === "summary") {
    return {
      ...base,
      radiusEarth: model.derived.radiusEarth,
      surfaceTempK: model.derived.surfaceTempK,
      orbitalPeriodEarthDays: model.derived.orbitalPeriodEarthDays,
      localDaysPerYear: model.derived.localDaysPerYear,
    };
  }

  return {
    ...base,
    source: shallowCloneRaw(raw),
    model,
  };
}

function toGasGiantEntry(raw, model, moonIds, mode, hostFrameId) {
  const companionClass = model?.companionClass || raw?.companionClass || "gasGiant";
  const base = {
    id: raw.id,
    kind: "gasGiant",
    regime: model?.regime || companionClass,
    companionClass,
    name: raw.name || raw.id,
    orbitAu: model.inputs.orbitAu,
    moonIds,
    hostFrameId,
  };

  if (mode === "summary") {
    return {
      ...base,
      radiusRj: model.physical.radiusRj,
      effectiveTempK: model.thermal.effectiveTempK,
      orbitalPeriodYears: model.orbital.orbitalPeriodYears,
      ringType: model.ringProperties.ringType,
      classification:
        model.classification?.substellarClass || model.classification?.sudarsky || null,
    };
  }

  return {
    ...base,
    source: shallowCloneRaw(raw),
    model,
  };
}

function toMoonEntry(raw, model, parentKind, mode, hostFrameId) {
  const base = {
    id: raw.id,
    kind: "moon",
    parentId: raw.planetId,
    parentKind,
    name: raw.name || raw.inputs?.name || raw.id,
    orbitKm: model.inputs.semiMajorAxisKm,
    hostFrameId,
  };

  if (mode === "summary") {
    return {
      ...base,
      radiusMoon: model.physical.radiusMoon,
      surfaceK: model.temperature.surfaceK,
      orbitalPeriodSiderealDays: model.orbit.orbitalPeriodSiderealDays,
      atmosphereClass:
        model.display?.atmosphereClass || model.atmosphere?.atmosphereClass || "Airless",
      hydrosphereState:
        model.display?.hydrosphereState ||
        model.habitability?.hydrosphere?.hydrosphereState ||
        "Dry surface",
      climateState: model.display?.climateState || model.climate?.climateState || "Unknown",
      biosphereClass:
        model.display?.surfaceBiosphere ||
        model.biosphere?.surfaceBiosphereClass ||
        "Surface sterile",
      subsurfaceOcean: !!model.habitability?.hydrosphere?.subsurfaceOceanPresent,
      habitabilityIndex: Number(model.habitability?.habitabilityIndex ?? 0),
    };
  }

  return {
    ...base,
    source: shallowCloneRaw(raw),
    model,
  };
}

export function buildWorldStarSystemContext(world) {
  return buildWorldHomeSystemContext(world);
}

export function buildWorldHomeSystemContext(world) {
  const homeSystemContext = buildHomeSystemContext(world);
  const starConfig =
    homeSystemContext.primaryStarConfig && typeof homeSystemContext.primaryStarConfig === "object"
      ? homeSystemContext.primaryStarConfig
      : resolveWorldStarConfig(world);
  const star =
    homeSystemContext.primaryStar && typeof homeSystemContext.primaryStar === "object"
      ? homeSystemContext.primaryStar
      : calcStar({
          massMsol: starConfig.massMsol,
          ageGyr: starConfig.ageGyr,
          metallicityFeH: starConfig.metallicityFeH,
          radiusRsolOverride: starConfig.radiusRsolOverride,
          luminosityLsolOverride: starConfig.luminosityLsolOverride,
          tempKOverride: starConfig.tempKOverride,
          evolutionMode: starConfig.evolutionMode,
        });
  const system =
    homeSystemContext.primarySystem && typeof homeSystemContext.primarySystem === "object"
      ? homeSystemContext.primarySystem
      : calcSystem({
          starMassMsol: starConfig.massMsol,
          spacingFactor: Number(world?.system?.spacingFactor ?? 0.33),
          orbit1Au: Number(world?.system?.orbit1Au ?? 0.39),
          luminosityLsolOverride: star.luminosityLsol,
          radiusRsolOverride: star.radiusRsol,
        });

  return { homeSystemContext, starConfig, star, system };
}

/**
 * Build a normalized engine-level snapshot for a stored world.
 *
 * `summary` mode now derives lighter body-model projections directly rather
 * than computing full per-body outputs and trimming them afterward.
 *
 * @param {object} world
 * @param {{mode?: "summary"|"full"}} [options]
 * @returns {object}
 */
export function buildWorldSnapshot(world, options = {}) {
  const mode = sanitizeMode(options.mode);
  const detailLevel = sanitizeDetailLevel(mode);
  const includeMoonRadiation = detailLevel === "full";
  const context =
    options.context &&
    typeof options.context === "object" &&
    options.context.starConfig &&
    options.context.star &&
    options.context.system
      ? options.context.homeSystemContext
        ? options.context
        : {
            ...options.context,
            homeSystemContext: buildHomeSystemContext(world),
          }
      : buildWorldHomeSystemContext(world);
  const { starConfig, star, system, homeSystemContext } = context;
  const defaultHostFrameId =
    homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || null;

  const planetEntries = orderedItems(world?.planets);
  const gasGiantEntries = orderedItems(world?.system?.gasGiants);
  const moonEntries = orderedItems(world?.moons);
  const moonInputsByParentId = groupMoonInputsByParentId(moonEntries);
  const moonsByParentId = groupMoonIdsByParentId(moonEntries);
  const otherGiantsById = buildOtherGiantsById(gasGiantEntries);
  const rockyMoonParentOverridesById = new Map();
  const gasGiantMoonParentOverridesById = new Map();
  const planetSolveContextById = new Map();
  const gasGiantSolveContextById = new Map();
  const smallBodyReservoirContextByHostFrameId = new Map();
  const fallbackHostFrameSolveContext = buildFallbackHostFrameSolveContext(
    context,
    defaultHostFrameId,
  );

  function smallBodyReservoirContextForSolve(solveContext, hostFrameId) {
    const resolvedHostFrameId = solveContext?.hostFrameId || hostFrameId || defaultHostFrameId;
    const cacheKey = resolvedHostFrameId || "__default__";
    if (smallBodyReservoirContextByHostFrameId.has(cacheKey)) {
      return smallBodyReservoirContextByHostFrameId.get(cacheKey);
    }
    const reservoirContext = buildSmallBodyReservoirContextForWorld(world, {
      fallbackHostFrameId: defaultHostFrameId,
      gasGiants: gasGiantEntries,
      hostFrameId: resolvedHostFrameId,
      primaryStar: world?.star || null,
      starConfig: solveContext?.starConfig ?? starConfig,
      starModel: solveContext?.starModel ?? star,
    });
    smallBodyReservoirContextByHostFrameId.set(cacheKey, reservoirContext);
    return reservoirContext;
  }

  const gasGiantModels = gasGiantEntries.map((raw) => {
    const hostFrameId = normalizeHostFrameId(raw?.hostFrameId, defaultHostFrameId);
    const solveContext =
      resolveHostFrameContext(homeSystemContext, hostFrameId) || fallbackHostFrameSolveContext;
    gasGiantSolveContextById.set(raw.id, solveContext);
    const args = {
      ...raw,
      orbitAu: Number(raw.au ?? 5.2),
      starMassMsol: solveContext?.starConfig?.massMsol ?? starConfig.massMsol,
      starLuminosityLsol: solveContext?.starModel?.luminosityLsol ?? star.luminosityLsol,
      starAgeGyr: solveContext?.starConfig?.ageGyr ?? starConfig.ageGyr,
      starRadiusRsol: solveContext?.starModel?.radiusRsol ?? star.radiusRsol,
      hostFrameId: solveContext?.hostFrameId || hostFrameId,
      hostFrame: solveContext?.hostFrame || null,
      hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
      hostPrebioticUvEarthAt1Au: solveContext?.hostPrebioticUvEarthAt1Au ?? null,
      hostWindPressureEarthAt1Au: solveContext?.hostWindPressureEarthAt1Au ?? null,
      companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
      companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
      companionPrebioticUvEarth: solveContext?.companionPrebioticUvEarth ?? 0,
      companionWindPressureEarth: solveContext?.companionWindPressureEarth ?? 0,
      fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
      stellarMetallicityFeH: solveContext?.starConfig?.metallicityFeH ?? starConfig.metallicityFeH,
      otherGiants: (otherGiantsById.get(raw.id) || []).filter(
        (other) =>
          normalizeHostFrameId(other?.hostFrameId, defaultHostFrameId) ===
          (solveContext?.hostFrameId || hostFrameId),
      ),
      moons: moonInputsByParentId.get(raw.id) || [],
      detailLevel,
    };
    return {
      raw,
      args,
      model: calcGasGiant(args),
    };
  });
  let gasGiantModelsById = new Map(gasGiantModels.map((entry) => [entry.raw.id, entry.model]));

  const planetModels = planetEntries.map((raw) => {
    const hostFrameId = normalizeHostFrameId(raw?.hostFrameId, defaultHostFrameId);
    const solveContext =
      resolveHostFrameContext(homeSystemContext, hostFrameId) || fallbackHostFrameSolveContext;
    const smallBodyReservoirContext = smallBodyReservoirContextForSolve(solveContext, hostFrameId);
    planetSolveContextById.set(raw.id, solveContext);
    return {
      raw,
      model: calcPlanetExact({
        starMassMsol: solveContext?.starConfig?.massMsol ?? starConfig.massMsol,
        starAgeGyr: solveContext?.starConfig?.ageGyr ?? starConfig.ageGyr,
        starMetallicityFeH: solveContext?.starConfig?.metallicityFeH ?? starConfig.metallicityFeH,
        starRadiusRsolOverride:
          solveContext?.starConfig?.radiusRsolOverride ?? starConfig.radiusRsolOverride,
        starLuminosityLsolOverride:
          solveContext?.starConfig?.luminosityLsolOverride ?? starConfig.luminosityLsolOverride,
        starTempKOverride: solveContext?.starConfig?.tempKOverride ?? starConfig.tempKOverride,
        starEvolutionMode: solveContext?.starConfig?.evolutionMode ?? starConfig.evolutionMode,
        hostFrameId: solveContext?.hostFrameId || hostFrameId,
        hostFrame: solveContext?.hostFrame || null,
        hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
        hostPrebioticUvEarthAt1Au: solveContext?.hostPrebioticUvEarthAt1Au ?? null,
        hostWindPressureEarthAt1Au: solveContext?.hostWindPressureEarthAt1Au ?? null,
        companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
        companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
        companionPrebioticUvEarth: solveContext?.companionPrebioticUvEarth ?? 0,
        companionWindPressureEarth: solveContext?.companionWindPressureEarth ?? 0,
        fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
        planet: raw.inputs || {},
        moons: moonInputsByParentId.get(raw.id) || [],
        gasGiants: gasGiantEntries.filter(
          (entry) =>
            normalizeHostFrameId(entry?.hostFrameId, defaultHostFrameId) ===
            (solveContext?.hostFrameId || hostFrameId),
        ),
        smallBodyReservoirContext,
        detailLevel,
      }),
    };
  });
  const planetModelsById = new Map(planetModels.map((entry) => [entry.raw.id, entry.model]));

  const planetaryBodyModels = [
    ...planetEntries.map((raw, index) => {
      const hostFrameId = normalizeHostFrameId(raw?.hostFrameId, defaultHostFrameId);
      const solveContext = planetSolveContextById.get(raw.id) || fallbackHostFrameSolveContext;
      const smallBodyReservoirContext = smallBodyReservoirContextForSolve(
        solveContext,
        hostFrameId,
      );
      const body = toRockyUnifiedBody(raw, index + 1);
      return {
        raw,
        body,
        model: calcPlanetaryBody(body, {
          starMassMsol: solveContext?.starConfig?.massMsol ?? starConfig.massMsol,
          starAgeGyr: solveContext?.starConfig?.ageGyr ?? starConfig.ageGyr,
          starMetallicityFeH: solveContext?.starConfig?.metallicityFeH ?? starConfig.metallicityFeH,
          starRadiusRsolOverride:
            solveContext?.starConfig?.radiusRsolOverride ?? starConfig.radiusRsolOverride,
          starLuminosityLsolOverride:
            solveContext?.starConfig?.luminosityLsolOverride ?? starConfig.luminosityLsolOverride,
          starTempKOverride: solveContext?.starConfig?.tempKOverride ?? starConfig.tempKOverride,
          starEvolutionMode: solveContext?.starConfig?.evolutionMode ?? starConfig.evolutionMode,
          hostFrameId: solveContext?.hostFrameId || hostFrameId,
          hostFrame: solveContext?.hostFrame || null,
          hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
          hostPrebioticUvEarthAt1Au: solveContext?.hostPrebioticUvEarthAt1Au ?? null,
          hostWindPressureEarthAt1Au: solveContext?.hostWindPressureEarthAt1Au ?? null,
          companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
          companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
          companionPrebioticUvEarth: solveContext?.companionPrebioticUvEarth ?? 0,
          companionWindPressureEarth: solveContext?.companionWindPressureEarth ?? 0,
          fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
          moons: moonInputsByParentId.get(raw.id) || [],
          gasGiants: gasGiantEntries.filter(
            (entry) =>
              normalizeHostFrameId(entry?.hostFrameId, defaultHostFrameId) ===
              (solveContext?.hostFrameId || hostFrameId),
          ),
          smallBodyReservoirContext,
          detailLevel,
        }),
      };
    }),
    ...gasGiantEntries.map((raw, index) => {
      const hostFrameId = normalizeHostFrameId(raw?.hostFrameId, defaultHostFrameId);
      const solveContext = gasGiantSolveContextById.get(raw.id) || fallbackHostFrameSolveContext;
      const smallBodyReservoirContext = smallBodyReservoirContextForSolve(
        solveContext,
        hostFrameId,
      );
      const body = toGasGiantUnifiedBody(raw, index + 1);
      return {
        raw,
        body,
        model: calcPlanetaryBody(body, {
          starMassMsol: solveContext?.starConfig?.massMsol ?? starConfig.massMsol,
          starLuminosityLsol: solveContext?.starModel?.luminosityLsol ?? star.luminosityLsol,
          starAgeGyr: solveContext?.starConfig?.ageGyr ?? starConfig.ageGyr,
          starRadiusRsol: solveContext?.starModel?.radiusRsol ?? star.radiusRsol,
          starMetallicityFeH: solveContext?.starConfig?.metallicityFeH ?? starConfig.metallicityFeH,
          hostFrameId: solveContext?.hostFrameId || hostFrameId,
          hostFrame: solveContext?.hostFrame || null,
          hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
          hostPrebioticUvEarthAt1Au: solveContext?.hostPrebioticUvEarthAt1Au ?? null,
          hostWindPressureEarthAt1Au: solveContext?.hostWindPressureEarthAt1Au ?? null,
          companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
          companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
          companionPrebioticUvEarth: solveContext?.companionPrebioticUvEarth ?? 0,
          companionWindPressureEarth: solveContext?.companionWindPressureEarth ?? 0,
          fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
          otherGiants: (otherGiantsById.get(raw.id) || []).filter(
            (other) =>
              normalizeHostFrameId(other?.hostFrameId, defaultHostFrameId) ===
              (solveContext?.hostFrameId || hostFrameId),
          ),
          moons: moonInputsByParentId.get(raw.id) || [],
          smallBodyReservoirContext,
          detailLevel,
        }),
      };
    }),
  ];

  const moonModels = [];
  for (const parentId of moonInputsByParentId.keys()) {
    const fullMoonEntries = moonEntries.filter((entry) => entry.planetId === parentId);
    const rockyParentModel = planetModelsById.get(parentId);
    if (rockyParentModel) {
      const solveContext = planetSolveContextById.get(parentId);
      const smallBodyReservoirContext = smallBodyReservoirContextForSolve(
        solveContext,
        solveContext?.hostFrameId || defaultHostFrameId,
      );
      if (!rockyMoonParentOverridesById.has(parentId)) {
        rockyMoonParentOverridesById.set(
          parentId,
          buildRockyMoonParentOverride(rockyParentModel, {
            includeRadiation: includeMoonRadiation,
          }),
        );
      }
      moonModels.push(
        ...solveMoonSystem({
          starMassMsol:
            planetSolveContextById.get(parentId)?.starConfig?.massMsol ?? starConfig.massMsol,
          starAgeGyr: planetSolveContextById.get(parentId)?.starConfig?.ageGyr ?? starConfig.ageGyr,
          starMetallicityFeH:
            planetSolveContextById.get(parentId)?.starConfig?.metallicityFeH ??
            starConfig.metallicityFeH,
          starRadiusRsolOverride:
            planetSolveContextById.get(parentId)?.starConfig?.radiusRsolOverride ??
            starConfig.radiusRsolOverride,
          starLuminosityLsolOverride:
            planetSolveContextById.get(parentId)?.starConfig?.luminosityLsolOverride ??
            starConfig.luminosityLsolOverride,
          starTempKOverride:
            planetSolveContextById.get(parentId)?.starConfig?.tempKOverride ??
            starConfig.tempKOverride,
          starEvolutionMode:
            planetSolveContextById.get(parentId)?.starConfig?.evolutionMode ??
            starConfig.evolutionMode,
          starHabitableZoneAu:
            planetSolveContextById.get(parentId)?.hostFrame?.zones?.habitableZoneAu ||
            planetSolveContextById.get(parentId)?.starModel?.habitableZoneAu ||
            star.habitableZoneAu,
          hostFrameId: planetSolveContextById.get(parentId)?.hostFrameId || defaultHostFrameId,
          hostFrame: planetSolveContextById.get(parentId)?.hostFrame || null,
          hostXuvFluxEarthAt1Au:
            planetSolveContextById.get(parentId)?.hostXuvFluxEarthAt1Au ?? null,
          hostPrebioticUvEarthAt1Au:
            planetSolveContextById.get(parentId)?.hostPrebioticUvEarthAt1Au ?? null,
          hostWindPressureEarthAt1Au:
            planetSolveContextById.get(parentId)?.hostWindPressureEarthAt1Au ?? null,
          companionFluxEarth: planetSolveContextById.get(parentId)?.companionFluxEarth ?? 0,
          companionXuvFluxEarth: planetSolveContextById.get(parentId)?.companionXuvFluxEarth ?? 0,
          companionPrebioticUvEarth:
            planetSolveContextById.get(parentId)?.companionPrebioticUvEarth ?? 0,
          companionWindPressureEarth:
            planetSolveContextById.get(parentId)?.companionWindPressureEarth ?? 0,
          fluxVariabilityFraction:
            planetSolveContextById.get(parentId)?.fluxVariabilityFraction ?? 0,
          parentKind: "planet",
          parentOverride: rockyMoonParentOverridesById.get(parentId),
          moonEntries: fullMoonEntries,
          smallBodyReservoirContext,
          detailLevel,
        }).map((entry) => ({
          raw: entry.raw,
          parentKind: "planet",
          model: entry.model,
        })),
      );
      continue;
    }

    const gasParentModel = gasGiantModelsById.get(parentId);
    if (gasParentModel) {
      const solveContext = gasGiantSolveContextById.get(parentId);
      const smallBodyReservoirContext = smallBodyReservoirContextForSolve(
        solveContext,
        solveContext?.hostFrameId || defaultHostFrameId,
      );
      if (!gasGiantMoonParentOverridesById.has(parentId)) {
        gasGiantMoonParentOverridesById.set(
          parentId,
          buildGasGiantMoonParentOverride(gasParentModel, {
            includeRadiation: includeMoonRadiation,
          }),
        );
      }
      moonModels.push(
        ...solveMoonSystem({
          starMassMsol:
            gasGiantSolveContextById.get(parentId)?.starConfig?.massMsol ?? starConfig.massMsol,
          starAgeGyr:
            gasGiantSolveContextById.get(parentId)?.starConfig?.ageGyr ?? starConfig.ageGyr,
          starMetallicityFeH:
            gasGiantSolveContextById.get(parentId)?.starConfig?.metallicityFeH ??
            starConfig.metallicityFeH,
          starRadiusRsolOverride:
            gasGiantSolveContextById.get(parentId)?.starConfig?.radiusRsolOverride ??
            starConfig.radiusRsolOverride,
          starLuminosityLsolOverride:
            gasGiantSolveContextById.get(parentId)?.starConfig?.luminosityLsolOverride ??
            starConfig.luminosityLsolOverride,
          starTempKOverride:
            gasGiantSolveContextById.get(parentId)?.starConfig?.tempKOverride ??
            starConfig.tempKOverride,
          starEvolutionMode:
            gasGiantSolveContextById.get(parentId)?.starConfig?.evolutionMode ??
            starConfig.evolutionMode,
          starHabitableZoneAu:
            gasGiantSolveContextById.get(parentId)?.hostFrame?.zones?.habitableZoneAu ||
            gasGiantSolveContextById.get(parentId)?.starModel?.habitableZoneAu ||
            star.habitableZoneAu,
          hostFrameId: gasGiantSolveContextById.get(parentId)?.hostFrameId || defaultHostFrameId,
          hostFrame: gasGiantSolveContextById.get(parentId)?.hostFrame || null,
          hostXuvFluxEarthAt1Au:
            gasGiantSolveContextById.get(parentId)?.hostXuvFluxEarthAt1Au ?? null,
          hostPrebioticUvEarthAt1Au:
            gasGiantSolveContextById.get(parentId)?.hostPrebioticUvEarthAt1Au ?? null,
          hostWindPressureEarthAt1Au:
            gasGiantSolveContextById.get(parentId)?.hostWindPressureEarthAt1Au ?? null,
          companionFluxEarth: gasGiantSolveContextById.get(parentId)?.companionFluxEarth ?? 0,
          companionXuvFluxEarth: gasGiantSolveContextById.get(parentId)?.companionXuvFluxEarth ?? 0,
          companionPrebioticUvEarth:
            gasGiantSolveContextById.get(parentId)?.companionPrebioticUvEarth ?? 0,
          companionWindPressureEarth:
            gasGiantSolveContextById.get(parentId)?.companionWindPressureEarth ?? 0,
          fluxVariabilityFraction:
            gasGiantSolveContextById.get(parentId)?.fluxVariabilityFraction ?? 0,
          parentKind: "gasGiant",
          parentOverride: gasGiantMoonParentOverridesById.get(parentId),
          moonEntries: fullMoonEntries,
          smallBodyReservoirContext,
          detailLevel,
        }).map((entry) => ({
          raw: entry.raw,
          parentKind: "gasGiant",
          model: entry.model,
        })),
      );
      continue;
    }

    throw new Error(`Moon system references unknown parent "${parentId}".`);
  }

  const moonInfluenceSummariesByParentId = new Map();
  for (const entry of moonModels) {
    if (entry.parentKind !== "gasGiant") continue;
    const parentId = entry.raw?.planetId;
    if (!parentId) continue;
    if (!moonInfluenceSummariesByParentId.has(parentId)) {
      moonInfluenceSummariesByParentId.set(parentId, []);
    }
    moonInfluenceSummariesByParentId
      .get(parentId)
      .push(buildSolvedMoonInfluenceSummary(entry.model));
  }
  for (const entry of gasGiantModels) {
    const moonInfluenceSummaries = moonInfluenceSummariesByParentId.get(entry.raw.id) || [];
    if (!moonInfluenceSummaries.length) continue;
    entry.args = {
      ...entry.args,
      moonInfluenceSummaries,
    };
    entry.model = calcGasGiant(entry.args);
  }
  gasGiantModelsById = new Map(gasGiantModels.map((entry) => [entry.raw.id, entry.model]));

  const planetsById = Object.fromEntries(
    planetModels.map((entry) => [
      entry.raw.id,
      toPlanetEntry(
        entry.raw,
        entry.model,
        moonsByParentId[entry.raw.id] || [],
        mode,
        normalizeHostFrameId(entry.raw?.hostFrameId, defaultHostFrameId),
      ),
    ]),
  );

  const gasGiantsById = Object.fromEntries(
    gasGiantModels.map((entry) => [
      entry.raw.id,
      toGasGiantEntry(
        entry.raw,
        entry.model,
        moonsByParentId[entry.raw.id] || [],
        mode,
        normalizeHostFrameId(entry.raw?.hostFrameId, defaultHostFrameId),
      ),
    ]),
  );

  const moonsById = Object.fromEntries(
    moonModels.map((entry) => [
      entry.raw.id,
      toMoonEntry(
        entry.raw,
        entry.model,
        entry.parentKind,
        mode,
        normalizeHostFrameId(
          entry.raw?.hostFrameId,
          planetsById[entry.raw?.planetId]?.hostFrameId ||
            gasGiantsById[entry.raw?.planetId]?.hostFrameId ||
            defaultHostFrameId,
        ),
      ),
    ]),
  );

  const planetaryBodyEntries = planetaryBodyModels.map((entry) =>
    toPlanetaryBodyEntry({
      raw: entry.raw,
      body: entry.body,
      model: entry.model,
      moonIds: moonsByParentId[entry.raw.id] || [],
      mode,
      hostFrameId: normalizeHostFrameId(entry.raw?.hostFrameId, defaultHostFrameId),
    }),
  );
  const planetaryBodiesInOrbitOrder = sortByOrbit(planetaryBodyEntries);
  const planetaryBodiesById = Object.fromEntries(
    planetaryBodyEntries.map((entry) => [entry.key, entry]),
  );
  const planetaryBodyOrder = planetaryBodiesInOrbitOrder.map((entry) => entry.key);

  const orbitEntries = [
    ...Object.values(planetsById).map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      name: entry.name,
      orbitAu: entry.orbitAu,
      hostFrameId: entry.hostFrameId,
    })),
    ...Object.values(gasGiantsById).map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      name: entry.name,
      orbitAu: entry.orbitAu,
      hostFrameId: entry.hostFrameId,
    })),
  ];
  const bodiesInOrbitOrderByHostFrame = Object.create(null);
  for (const orbitEntry of orbitEntries) {
    const hostFrameId = normalizeHostFrameId(orbitEntry.hostFrameId, defaultHostFrameId);
    if (!hostFrameId) continue;
    if (!bodiesInOrbitOrderByHostFrame[hostFrameId])
      bodiesInOrbitOrderByHostFrame[hostFrameId] = [];
    bodiesInOrbitOrderByHostFrame[hostFrameId].push(orbitEntry);
  }
  for (const hostFrameId of Object.keys(bodiesInOrbitOrderByHostFrame)) {
    bodiesInOrbitOrderByHostFrame[hostFrameId] = sortByOrbit(
      bodiesInOrbitOrderByHostFrame[hostFrameId],
    );
  }
  const bodiesInOrbitOrder = defaultHostFrameId
    ? bodiesInOrbitOrderByHostFrame[defaultHostFrameId] || []
    : sortByOrbit(orbitEntries);
  const stellarLifecycleImpactsByHostFrame = Object.create(null);
  for (const [hostFrameId, hostFrameOrbitEntries] of Object.entries(
    bodiesInOrbitOrderByHostFrame,
  )) {
    const lifecycleSummary = summarizeStellarLifecycleImpactsForHostFrame(
      homeSystemContext,
      fallbackHostFrameSolveContext,
      hostFrameId,
      hostFrameOrbitEntries,
    );
    if (lifecycleSummary) stellarLifecycleImpactsByHostFrame[hostFrameId] = lifecycleSummary;
  }

  return {
    star,
    system,
    stellarSystem: homeSystemContext?.stellarSystem || null,
    hostFramesById: homeSystemContext?.hostFramesById || {},
    planetsById,
    gasGiantsById,
    planetaryBodiesById,
    planetaryBodyOrder,
    planetaryBodiesInOrbitOrder,
    moonsById,
    bodiesInOrbitOrder,
    bodiesInOrbitOrderByHostFrame,
    stellarLifecycleImpactsByHostFrame,
    moonsByParentId,
    meta: {
      mode,
      topologyKind: homeSystemContext?.topology?.kind || "single",
      defaultHostFrameId,
      worldVersion: Number.isFinite(Number(world?.version)) ? Number(world.version) : null,
      selectedBodyType: world?.selectedBodyType || null,
      counts: {
        planets: planetModels.length,
        gasGiants: gasGiantModels.length,
        planetaryBodies: planetaryBodyModels.length,
        moons: moonModels.length,
      },
      evaluation: {
        detailLevel,
        groupedMoonInputs: true,
        reusedParentModels: true,
        reusedParentOverrides: true,
        reusedStarSystemContext: context === options.context,
        reusedHomeSystemContext:
          !!options.context &&
          typeof options.context === "object" &&
          options.context.homeSystemContext === homeSystemContext,
      },
    },
  };
}
