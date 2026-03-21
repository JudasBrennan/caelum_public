import { buildWorldHomeSystemContext, buildWorldSnapshot } from "./worldSnapshot.js";
import {
  bondToGeometricAlbedo,
  calcStarAbsoluteMagnitude,
  calcStarApparentAtOrbit,
  classifyBodyType,
} from "./apparent.js";
import { buildHomeSystemContext, resolveHostFrameContext } from "./homeSystem/context.js";
import {
  listCompanionStarsForHostFrame,
  listHostStarsForHostFrame,
} from "./homeSystem/companionPresentation.js";
import { resolveGasGiantRingState } from "./planetaryRings.js";
import { computeRockyVisualProfile } from "../ui/rockyPlanetStyles.js";
import { resolveRingAppearance } from "../ui/ringAppearanceProfiles.js";

const MOON_PHASE_INTEGRAL = 0.9;
export const SNAPSHOT_MODE_BUDGETS = Object.freeze({
  importPreview: "summary",
  systemPoster: "full",
  apparentPage: "full",
  apparentSelectors: "summary",
});

function gasGiantAlbedo(style) {
  switch (String(style || "").toLowerCase()) {
    case "jupiter":
      return 0.538;
    case "saturn":
      return 0.499;
    case "ice":
      return 0.45;
    case "hot":
    case "hot-jupiter":
      return 0.4;
    default:
      return 0.45;
  }
}

function requireFullEntry(entry, label) {
  if (!entry?.model || !entry?.source) {
    throw new Error(`${label} requires a full world snapshot entry.`);
  }
  return entry;
}

function orderedCollectionValues(section) {
  if (!section || typeof section !== "object") return [];
  const byId = section.byId && typeof section.byId === "object" ? section.byId : {};
  const order = Array.isArray(section.order) ? section.order : Object.keys(byId);
  return order.map((id) => byId[id]).filter(Boolean);
}

function toFiniteOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function formatHostFrameLabel(hostFrameId = "", hostFramesById = null) {
  const resolvedHostFrameId = String(hostFrameId || "").trim();
  const explicitLabel = hostFramesById?.[resolvedHostFrameId]?.label;
  if (explicitLabel) return explicitLabel;
  switch (resolvedHostFrameId) {
    case "star_b":
      return "Star B";
    case "star_c":
      return "Star C";
    case "star_d":
      return "Star D";
    case "pair_ab":
      return "Pair A+B";
    case "pair_abc":
      return "Pair (A+B)+C";
    case "pair_abcd":
      return "Pair ((A+B)+C)+D";
    case "star_a":
    default:
      return "Star A";
  }
}

function filterEntriesForHostFrame(entries, hostFrameId, fallbackHostFrameId) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  return (entries || []).filter(
    (entry) =>
      normalizeHostFrameId(
        entry?.hostFrameId || entry?.source?.hostFrameId,
        fallbackHostFrameId,
      ) === targetHostFrameId,
  );
}

function buildGuidedPosterWorld(world, homeSystemContext) {
  const planets = world?.planets;
  const planetsById = planets?.byId && typeof planets.byId === "object" ? planets.byId : {};
  const defaultHostFrameId =
    homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || null;
  let nextPlanetsById = null;

  for (const planet of orderedCollectionValues(planets)) {
    if (planet?.slotIndex == null) continue;
    const hostFrameId = normalizeHostFrameId(planet?.hostFrameId, defaultHostFrameId);
    const orbitSlots = homeSystemContext?.hostFramesById?.[hostFrameId]?.system?.orbitsAu || [];
    const slotAu = Number(orbitSlots[planet.slotIndex - 1]);
    if (!(Number.isFinite(slotAu) && slotAu > 0)) continue;
    const current = planetsById[planet.id];
    if (!current) continue;
    if (Number(current.inputs?.semiMajorAxisAu) === slotAu) continue;
    if (!nextPlanetsById) nextPlanetsById = { ...planetsById };
    nextPlanetsById[planet.id] = {
      ...current,
      inputs: {
        ...(current.inputs || {}),
        semiMajorAxisAu: slotAu,
      },
    };
  }

  if (!nextPlanetsById) return world;

  return {
    ...world,
    planets: {
      ...(planets || {}),
      byId: nextPlanetsById,
    },
  };
}

function buildPosterStarData(solveContext, fallbackStar) {
  const starModel = solveContext?.starModel || fallbackStar || {};
  const starConfig = solveContext?.starConfig || fallbackStar?.inputs || fallbackStar || {};
  return {
    ...starModel,
    inputs: {
      massMsol: Number(starConfig?.massMsol ?? fallbackStar?.inputs?.massMsol ?? 1),
      ageGyr: Number(starConfig?.ageGyr ?? fallbackStar?.inputs?.ageGyr ?? 4.6),
      metallicityFeH: Number(
        starConfig?.metallicityFeH ?? fallbackStar?.inputs?.metallicityFeH ?? 0,
      ),
      name: solveContext?.starContext?.component?.name || fallbackStar?.inputs?.name || "Star",
    },
    name: solveContext?.starContext?.component?.name || fallbackStar?.inputs?.name || "Star",
  };
}

function buildApparentStarEntry(starEntry, orbitAu, extras = {}) {
  const starAbsoluteMagnitude = calcStarAbsoluteMagnitude(starEntry?.luminosityLsol);
  const apparent = calcStarApparentAtOrbit({
    starAbsoluteMagnitude,
    starRadiusRsol: starEntry?.radiusRsol,
    orbitAu: Math.max(0.000001, Number(orbitAu) || 1),
    starLuminosityLsol: starEntry?.luminosityLsol,
  });
  return {
    ...starEntry,
    apparentMagnitude: apparent.magnitude,
    angularDiameterArcsec: apparent.angularDiameterArcsec,
    angularDiameterLabel: apparent.angularDiameterLabel,
    brightnessRelativeToEarthSun: apparent.brightnessRelativeToEarthSun,
    ...extras,
  };
}

function buildDebrisRanges(world, rawWorld, { hostFramesById = null } = {}) {
  const fallbackHostFrameId = normalizeHostFrameId(
    world?.stellarSystem?.defaultHostFrameId,
    "star_a",
  );
  const normalizedRanges = orderedCollectionValues(world?.system?.debrisDisks)
    .map((disk) => ({
      name: disk?.name || "Debris disk",
      hostFrameId: normalizeHostFrameId(disk?.hostFrameId, fallbackHostFrameId),
      hostFrameLabel: formatHostFrameLabel(
        normalizeHostFrameId(disk?.hostFrameId, fallbackHostFrameId),
        hostFramesById,
      ),
      inner: Number(disk?.innerAu ?? disk?.inner),
      outer: Number(disk?.outerAu ?? disk?.outer),
    }))
    .filter((disk) => Number.isFinite(disk.inner) && Number.isFinite(disk.outer))
    .map((disk) => ({
      ...disk,
      inner: Math.min(disk.inner, disk.outer),
      outer: Math.max(disk.inner, disk.outer),
    }));

  if (normalizedRanges.length) return normalizedRanges;

  const legacyOuter = Number(
    rawWorld?.system?.debrisDiskOuterAu ?? rawWorld?.system?.debrisOuterAu,
  );
  if (!Number.isFinite(legacyOuter)) return [];

  const legacyInner = Number(
    rawWorld?.system?.debrisDiskInnerAu ?? rawWorld?.system?.debrisInnerAu ?? legacyOuter,
  );
  if (!Number.isFinite(legacyInner)) return [];

  return [
    {
      name: "Debris disk",
      inner: Math.min(legacyInner, legacyOuter),
      outer: Math.max(legacyInner, legacyOuter),
    },
  ];
}

/**
 * Build the Import/Export preview summary from a normalized world using the
 * engine snapshot layer. `rawWorld` can be provided to preserve legacy preview
 * fields that are display-only, such as old star class aliases or scalar debris
 * disk values accepted by import validation.
 *
 * @param {object} world
 * @param {{rawWorld?: object}} [options]
 * @returns {object}
 */
export function buildImportPreviewSummary(world, { rawWorld = world } = {}) {
  const snapshot = buildWorldSnapshot(world, { mode: SNAPSHOT_MODE_BUDGETS.importPreview });
  const planets = orderedCollectionValues(world?.planets);
  const gasGiants = Object.values(snapshot.gasGiantsById || {});
  const debrisRanges = buildDebrisRanges(world, rawWorld, {
    hostFramesById: snapshot.hostFramesById,
  });
  const tectonics =
    world?.tectonics && typeof world.tectonics === "object" ? world.tectonics : null;
  const population =
    world?.population && typeof world.population === "object" ? world.population : null;
  const climate = world?.climate && typeof world.climate === "object" ? world.climate : null;
  const calendar = world?.calendar && typeof world.calendar === "object" ? world.calendar : null;
  const assigned = planets.filter((planet) => planet?.slotIndex != null).length;
  const gasAuList = gasGiants
    .map((entry) => Number(entry?.orbitAu))
    .filter((orbitAu) => Number.isFinite(orbitAu) && orbitAu > 0);
  const moonSummaries = Object.values(snapshot.moonsById || {});
  const moonWorlds = moonSummaries.reduce(
    (counts, moon) => {
      const atmosphereClass = String(moon?.atmosphereClass || "");
      const hydrosphereState = String(moon?.hydrosphereState || "");
      const biosphereClass = String(moon?.biosphereClass || "");

      if (atmosphereClass && atmosphereClass !== "Airless" && atmosphereClass !== "Exosphere") {
        counts.withAtmosphere += 1;
      }
      if (
        hydrosphereState &&
        hydrosphereState !== "Dry surface" &&
        hydrosphereState !== "Surface ice" &&
        hydrosphereState !== "Ice shell" &&
        hydrosphereState !== "Frozen surface"
      ) {
        counts.withLiquidOrVapour += 1;
      }
      if (moon?.subsurfaceOcean) counts.withSubsurfaceOcean += 1;
      if (biosphereClass && biosphereClass !== "Surface sterile") {
        counts.withSurfaceBiosphere += 1;
      }
      return counts;
    },
    {
      withAtmosphere: 0,
      withLiquidOrVapour: 0,
      withSubsurfaceOcean: 0,
      withSurfaceBiosphere: 0,
    },
  );

  return {
    spec: String(
      snapshot.star?.spectralClass || rawWorld?.star?.spectralClass || rawWorld?.star?.class || "",
    ).trim(),
    starMass: toFiniteOrNull(
      snapshot.star?.inputs?.massMsol ?? rawWorld?.star?.massMsol ?? rawWorld?.star?.mass,
    ),
    starAge: toFiniteOrNull(
      snapshot.star?.inputs?.ageGyr ?? rawWorld?.star?.ageGyr ?? rawWorld?.star?.age,
    ),
    topologyKind: snapshot.meta?.topologyKind || snapshot.stellarSystem?.topologyKind || "single",
    starCount: snapshot.stellarSystem?.stars?.order?.length || 1,
    defaultHostFrameId: snapshot.meta?.defaultHostFrameId || null,
    planets: snapshot.meta?.counts?.planets ?? planets.length,
    moons: snapshot.meta?.counts?.moons ?? Object.keys(snapshot.moonsById || {}).length,
    assigned,
    unassigned: (snapshot.meta?.counts?.planets ?? planets.length) - assigned,
    gasCount: snapshot.meta?.counts?.gasGiants ?? gasGiants.length,
    gas: gasAuList.length ? Math.max(...gasAuList) : null,
    debrisCount: debrisRanges.length,
    debrisRanges,
    hasTectonics: !!tectonics,
    tecRanges: Array.isArray(tectonics?.mountainRanges) ? tectonics.mountainRanges.length : 0,
    tecVolcanoes: Array.isArray(tectonics?.shieldVolcanoes) ? tectonics.shieldVolcanoes.length : 0,
    tecRifts: Array.isArray(tectonics?.riftValleys) ? tectonics.riftValleys.length : 0,
    tecInactive: Array.isArray(tectonics?.inactiveRanges) ? tectonics.inactiveRanges.length : 0,
    hasPopulation: !!population,
    popTechEra: population?.techEra || null,
    moonWorlds,
    hasClimate: !!climate,
    climAltitude: climate ? Number(climate.altitudeM) || 0 : 0,
    hasCalendar: !!calendar,
  };
}

/**
 * Build System-page poster inputs from the engine snapshot layer.
 *
 * Guided mode projects assigned rocky planets onto their active slot AU values
 * before deriving the full snapshot so rocky-body and moon models stay aligned
 * with the poster layout.
 *
 * @param {object} world
 * @param {{orbitMode?: "guided"|"manual", hostFrameId?: string|null}} [options]
 * @returns {{snapshot: object, effectiveWorld: object, posterData: object}}
 */
export function buildSystemPosterSnapshotInputs(
  world,
  { orbitMode = "guided", hostFrameId = null } = {},
) {
  const baseContext = buildWorldHomeSystemContext(world);
  const manualMode = orbitMode === "manual";
  const activeHostFrameId = normalizeHostFrameId(
    hostFrameId,
    world?.stellarSystem?.defaultHostFrameId,
    baseContext.homeSystemContext?.defaultHostFrameId ||
      baseContext.homeSystemContext?.primaryStarId,
  );
  const activeSolveContext =
    resolveHostFrameContext(baseContext.homeSystemContext, activeHostFrameId) ||
    resolveHostFrameContext(
      baseContext.homeSystemContext,
      baseContext.homeSystemContext?.defaultHostFrameId ||
        baseContext.homeSystemContext?.primaryStarId,
    );
  const effectiveWorld = manualMode
    ? world
    : buildGuidedPosterWorld(world, baseContext.homeSystemContext);
  const snapshot = buildWorldSnapshot(effectiveWorld, {
    mode: SNAPSHOT_MODE_BUDGETS.systemPoster,
    context: baseContext,
  });
  const fallbackHostFrameId =
    snapshot.meta?.defaultHostFrameId || baseContext.homeSystemContext?.defaultHostFrameId || null;
  const resolvedHostFrameId = normalizeHostFrameId(
    activeSolveContext?.hostFrameId,
    activeHostFrameId || fallbackHostFrameId,
  );

  const includedPlanetIds = new Set(
    orderedCollectionValues(effectiveWorld?.planets)
      .filter(
        (planet) =>
          (manualMode || planet?.slotIndex != null) &&
          normalizeHostFrameId(planet?.hostFrameId, fallbackHostFrameId) === resolvedHostFrameId,
      )
      .map((planet) => planet.id),
  );

  const planets = filterEntriesForHostFrame(
    Object.values(snapshot.planetsById || {}),
    resolvedHostFrameId,
    fallbackHostFrameId,
  )
    .filter((entry) => includedPlanetIds.has(entry.id))
    .map((entry) => {
      const visualProfile = computeRockyVisualProfile(entry.model?.derived, entry.source?.inputs);
      const ringAppearance = resolveRingAppearance({
        bodyType: "rocky",
        ringState: {
          ringMode: visualProfile?.ring?.ringMode || entry.source?.inputs?.ringMode || "auto",
          effectiveEnabled: !!visualProfile?.ring?.enabled,
        },
        ringStyleId: entry.source?.inputs?.ringStyleId,
        derived: entry.model?.derived,
        seed: entry.id || entry.name,
      });
      return {
        id: entry.id,
        name: entry.name,
        au: Number(entry.model?.inputs?.semiMajorAxisAu),
        radiusKm: Number(entry.model?.derived?.radiusKm),
        dayHex: entry.model?.derived?.skyColourDayHex || "#9bbbe0",
        horizonHex: entry.model?.derived?.skyColourHorizonHex || "#6a6a6a",
        visualProfile,
        ringAppearance,
        source: entry.source,
        model: entry.model,
      };
    })
    .filter((entry) => Number.isFinite(entry.au) && entry.au > 0);

  const gasGiants = filterEntriesForHostFrame(
    Object.values(snapshot.gasGiantsById || {}),
    resolvedHostFrameId,
    fallbackHostFrameId,
  )
    .map((entry) => {
      const ringState = resolveGasGiantRingState({
        ringMode: entry.source?.ringMode,
        gasCalc: entry.model,
        legacyRings: entry.source?.rings,
      });
      const ringAppearance = resolveRingAppearance({
        bodyType: "gasGiant",
        ringState,
        ringStyleId: entry.source?.ringStyleId,
        gasCalc: entry.model,
        bodyStyleId: entry.source?.style,
        seed: entry.id || entry.name,
      });
      return {
        id: entry.id,
        name: entry.name,
        au: Number(entry.model?.inputs?.orbitAu),
        radiusKm: Number(entry.model?.physical?.radiusKm),
        style: entry.source?.style,
        ringMode: ringState.ringMode,
        rings: ringState.effectiveEnabled,
        ringAppearance,
        gasCalc: entry.model,
        source: entry.source,
      };
    })
    .filter((entry) => Number.isFinite(entry.au) && entry.au > 0);

  const visibleParentIds = new Set([
    ...planets.map((entry) => entry.id),
    ...gasGiants.map((entry) => entry.id),
  ]);
  const moons = filterEntriesForHostFrame(
    Object.values(snapshot.moonsById || {}),
    resolvedHostFrameId,
    fallbackHostFrameId,
  )
    .filter((entry) => entry.parentId != null && visibleParentIds.has(entry.parentId))
    .map((entry) => ({
      parentId: entry.parentId,
      name: entry.name || entry.source?.name || entry.source?.inputs?.name || "",
      radiusMoon: Number(entry.model?.physical?.radiusMoon),
      moonCalc: entry.model,
      source: entry.source,
    }));

  const debrisDisks = orderedCollectionValues(effectiveWorld?.system?.debrisDisks)
    .filter(
      (disk) =>
        normalizeHostFrameId(disk?.hostFrameId, fallbackHostFrameId) === resolvedHostFrameId,
    )
    .map((disk) => ({
      innerAu: Math.min(
        Number(disk?.innerAu ?? disk?.inner ?? 0),
        Number(disk?.outerAu ?? disk?.outer ?? 0),
      ),
      outerAu: Math.max(
        Number(disk?.innerAu ?? disk?.inner ?? 0),
        Number(disk?.outerAu ?? disk?.outer ?? 0),
      ),
      name: disk?.name || "Debris disk",
      hostFrameId: normalizeHostFrameId(disk?.hostFrameId, fallbackHostFrameId),
    }));
  const hostStars = listHostStarsForHostFrame(baseContext.homeSystemContext, resolvedHostFrameId);
  const companionStars = listCompanionStarsForHostFrame(
    baseContext.homeSystemContext,
    resolvedHostFrameId,
  );
  const canvasMode =
    activeSolveContext?.hostFrame?.frameKind === "pair" && hostStars.length > 1
      ? "binary-p-type"
      : companionStars.length > 0
        ? "binary-s-type"
        : "single";

  return {
    snapshot,
    effectiveWorld,
    meta: {
      snapshotMode: SNAPSHOT_MODE_BUDGETS.systemPoster,
      orbitMode: manualMode ? "manual" : "guided",
      topologyKind: snapshot.meta?.topologyKind || "single",
      activeHostFrameId: resolvedHostFrameId,
      activeHostFrameLabel:
        activeSolveContext?.hostFrame?.label || snapshot.star?.inputs?.name || "Star",
      canvasMode,
      defaultHostFrameId: snapshot.meta?.defaultHostFrameId || null,
      reusedStarSystemContext: true,
      guidedOrbitProjection: !manualMode,
      effectiveWorldReused: effectiveWorld === world,
    },
    homeSystem: {
      stellarSystem: snapshot.stellarSystem,
      hostFramesById: snapshot.hostFramesById,
      activeHostFrameId: resolvedHostFrameId,
      defaultHostFrameId: snapshot.meta?.defaultHostFrameId || null,
    },
    posterData: {
      star: buildPosterStarData(activeSolveContext, snapshot.star),
      system: activeSolveContext?.hostFrame?.system || snapshot.system,
      topologyKind: snapshot.meta?.topologyKind || "single",
      activeHostFrameId: resolvedHostFrameId,
      activeHostFrameLabel:
        activeSolveContext?.hostFrame?.label || snapshot.star?.inputs?.name || "Star",
      canvasMode,
      hostStars,
      companionStars,
      planets,
      gasGiants,
      moons,
      debrisDisks,
    },
  };
}

/**
 * Adapt a full world snapshot into the apparent-engine inputs used by the
 * Apparent Size page.
 *
 * @param {object} snapshot
 * @param {{homePlanetId?: string, distanceByBodyId?: Record<string, number>, moonPhaseDeg?: number}} [options]
 * @returns {object}
 */
export function buildApparentSnapshotInputs(
  snapshot,
  { homePlanetId = "", distanceByBodyId = {}, moonPhaseDeg = 0 } = {},
) {
  const fullSnapshot = snapshot && typeof snapshot === "object" ? snapshot : {};
  const planetEntries = Object.values(fullSnapshot.planetsById || {}).map((entry) =>
    requireFullEntry(entry, "Planet adapter"),
  );
  const gasGiantEntries = Object.values(fullSnapshot.gasGiantsById || {}).map((entry) =>
    requireFullEntry(entry, "Gas giant adapter"),
  );

  const planets = planetEntries
    .map((entry) => {
      const raw = entry.source?.inputs || {};
      const derived = entry.model?.derived || {};
      const radiusKm = Number(derived.radiusKm);
      const orbitAu = Number(entry.model?.inputs?.semiMajorAxisAu);
      const hasAtmosphere = Number(raw.pressureAtm ?? 0) > 0.01;
      const bodyType = classifyBodyType(radiusKm, hasAtmosphere);
      const bondAlbedo = Number(raw.albedoBond ?? 0.3);

      return {
        id: `planet:${entry.id}`,
        kind: "planet",
        name: entry.name,
        classLabel: "Planet",
        hostFrameId: entry.hostFrameId,
        orbitAu,
        radiusKm,
        geometricAlbedo: bondToGeometricAlbedo(bondAlbedo, bodyType),
        hasAtmosphere,
        skyDayHex: derived.skyColourDayHex || null,
        skyDayEdgeHex: derived.skyColourDayEdgeHex || null,
        skyHorizonHex: derived.skyColourHorizonHex || null,
        _derived: derived,
        _planetInputs: raw,
      };
    })
    .filter((entry) => Number.isFinite(entry.orbitAu) && entry.orbitAu > 0);

  const gasGiants = gasGiantEntries
    .map((entry) => {
      const raw = entry.source || {};
      return {
        id: `gas:${entry.id}`,
        kind: "gas",
        name: entry.name,
        classLabel: "Gas giant",
        hostFrameId: entry.hostFrameId,
        orbitAu: Number(entry.model?.inputs?.orbitAu),
        radiusKm: Number(entry.model?.physical?.radiusKm),
        geometricAlbedo: gasGiantAlbedo(raw.style),
        hasAtmosphere: true,
        _styleId: raw.style || "jupiter",
      };
    })
    .filter((entry) => Number.isFinite(entry.orbitAu) && entry.orbitAu > 0);

  const allBodiesRaw = [...planets, ...gasGiants].sort(
    (left, right) => left.orbitAu - right.orbitAu,
  );
  const selectedHomePlanet = planets.find((entry) => entry.id === `planet:${homePlanetId}`) || null;
  const homeOrbitAu = selectedHomePlanet?.orbitAu || 1;
  const fallbackHostFrameId =
    fullSnapshot.meta?.defaultHostFrameId || fullSnapshot.stellarSystem?.defaultHostFrameId || null;
  const homeHostFrameId = normalizeHostFrameId(
    fullSnapshot.planetsById?.[homePlanetId]?.hostFrameId,
    fallbackHostFrameId,
  );
  const homeSystemContext =
    fullSnapshot.stellarSystem && typeof fullSnapshot.stellarSystem === "object"
      ? buildHomeSystemContext({
          star: fullSnapshot.star?.inputs || {},
          system: fullSnapshot.system?.inputs || {},
          stellarSystem: fullSnapshot.stellarSystem,
        })
      : null;
  const homeSolveContext = homeSystemContext
    ? resolveHostFrameContext(homeSystemContext, homeHostFrameId)
    : null;
  const companionStars = listCompanionStarsForHostFrame(homeSystemContext, homeHostFrameId).map(
    (entry) =>
      buildApparentStarEntry(entry, Number(entry.separationAu) || 1, { skyRole: "companion" }),
  );
  const pairHostStars =
    homeSolveContext?.hostFrame?.frameKind === "pair"
      ? listHostStarsForHostFrame(homeSystemContext, homeHostFrameId).map((entry) =>
          buildApparentStarEntry(entry, homeOrbitAu, {
            skyRole: "pair-host",
            homeOrbitAu,
          }),
        )
      : [];
  const hasLivePrimaryPair =
    pairHostStars.length === 2 &&
    pairHostStars.every(
      (entry) =>
        Number.isFinite(Number(entry?.homeOrbitAu)) &&
        Number(entry.homeOrbitAu) > 0 &&
        Number.isFinite(Number(entry?.pairSemiMajorAxisAu)) &&
        Number(entry.pairSemiMajorAxisAu) > 0 &&
        Number.isFinite(Number(entry?.barycentricOrbitAu)) &&
        Number(entry.barycentricOrbitAu) >= 0,
    );
  const hasApproximatePrimarySuns =
    pairHostStars.length > 2 || (pairHostStars.length > 1 && !hasLivePrimaryPair);
  const primarySuns = pairHostStars.length
    ? pairHostStars
    : [
        buildApparentStarEntry(
          homeSolveContext?.starModel
            ? buildPosterStarData(homeSolveContext, fullSnapshot.star)
            : fullSnapshot.star || {},
          homeOrbitAu,
          { skyRole: "primary-host" },
        ),
      ].filter(
        (entry) => Number.isFinite(entry?.angularDiameterArcsec) && entry.angularDiameterArcsec > 0,
      );
  const skyStars = [...pairHostStars, ...companionStars];
  const visibleSuns = [...primarySuns, ...companionStars];
  const visibleSunsCount = visibleSuns.length || 1;
  const visibleSunNames = visibleSuns.map((entry) => entry.name).filter(Boolean);

  const allBodies = selectedHomePlanet
    ? allBodiesRaw.filter(
        (entry) => normalizeHostFrameId(entry.hostFrameId, fallbackHostFrameId) === homeHostFrameId,
      )
    : allBodiesRaw;

  const orbitSamples = allBodies
    .filter((entry) => entry.id !== selectedHomePlanet?.id)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      orbitAu: entry.orbitAu,
    }));

  const bodySamples = allBodies
    .filter((entry) => entry.id !== selectedHomePlanet?.id)
    .map((entry) => {
      const currentDistanceAu = Number(distanceByBodyId?.[entry.id]);
      return {
        ...entry,
        currentDistanceAu: Number.isFinite(currentDistanceAu) ? currentDistanceAu : undefined,
      };
    });

  const moonIds = Array.isArray(fullSnapshot.moonsByParentId?.[homePlanetId])
    ? fullSnapshot.moonsByParentId[homePlanetId]
    : [];

  const moonSamples = moonIds
    .map((moonId) => requireFullEntry(fullSnapshot.moonsById?.[moonId], "Moon adapter"))
    .map((entry) => {
      const raw = entry.source?.inputs || {};
      return {
        name: entry.name,
        semiMajorAxisKm: Number(entry.model?.inputs?.semiMajorAxisKm) || 384748,
        radiusMoon: Number(entry.model?.physical?.radiusMoon) || 1,
        geometricAlbedo: (Number(raw.albedo) || 0.11) / MOON_PHASE_INTEGRAL,
        phaseDeg: moonPhaseDeg,
        moonCalc: entry.model,
      };
    });

  return {
    starMassMsol: Number(
      homeSolveContext?.starConfig?.massMsol ?? fullSnapshot.star?.inputs?.massMsol ?? 1,
    ),
    starAgeGyr: Number(
      homeSolveContext?.starConfig?.ageGyr ?? fullSnapshot.star?.inputs?.ageGyr ?? 4.6,
    ),
    starModel: homeSolveContext?.starModel
      ? buildPosterStarData(homeSolveContext, fullSnapshot.star)
      : fullSnapshot.star || null,
    topologyKind:
      fullSnapshot.meta?.topologyKind || fullSnapshot.stellarSystem?.topologyKind || "single",
    defaultHostFrameId: fullSnapshot.meta?.defaultHostFrameId || null,
    homeHostFrameId,
    homeHostFrameLabel: homeSolveContext?.hostFrame?.label || null,
    primarySuns,
    companionStars,
    skyStars,
    hasLivePrimaryPair,
    hasApproximatePrimarySuns,
    hasApproximateCompanionSuns: companionStars.length > 0,
    visibleSunsCount,
    visibleSunNames,
    stellarSystem: fullSnapshot.stellarSystem || null,
    hostFramesById: fullSnapshot.hostFramesById || {},
    homeOrbitAu,
    selectedHomePlanet,
    planets,
    allBodies,
    orbitSamples,
    bodySamples,
    moonSamples,
    homeSkyDayHex: selectedHomePlanet?.skyDayHex || null,
    homeSkyDayEdgeHex: selectedHomePlanet?.skyDayEdgeHex || null,
    homeSkyHorizonHex: selectedHomePlanet?.skyHorizonHex || null,
  };
}
