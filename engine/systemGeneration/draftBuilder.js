import { buildWorldSnapshot } from "../worldSnapshot.js";
import { defaultWorld } from "../../ui/store/worldSchema.js";
import { makeCollection } from "../../ui/store/systemCollections.js";
import { projectPrimaryStarFromStellarSystem } from "../../ui/store/stellarSystemModel.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function countBodiesByHostFrame(planets = [], gasGiants = [], debrisDisks = []) {
  const counts = Object.create(null);
  function ensure(hostFrameId) {
    const key = String(hostFrameId || "").trim() || "star_a";
    if (!counts[key]) counts[key] = { rockyPlanets: 0, gasGiants: 0, debrisDisks: 0 };
    return counts[key];
  }
  for (const planet of planets) ensure(planet?.hostFrameId).rockyPlanets += 1;
  for (const gasGiant of gasGiants) ensure(gasGiant?.hostFrameId).gasGiants += 1;
  for (const disk of debrisDisks) ensure(disk?.hostFrameId).debrisDisks += 1;
  return counts;
}

function pickSelectedId(list, preferredId = null) {
  if (preferredId && list.some((entry) => entry?.id === preferredId)) return preferredId;
  return list[0]?.id || null;
}

function normalizeNamedTopology(topologyDraft, namePicker, { preserveStarNames = false } = {}) {
  const next = clone(topologyDraft?.stellarSystem || {});
  const starIds = next?.stars?.order || [];
  if (preserveStarNames || typeof namePicker?.buildStarNames !== "function") {
    return {
      stellarSystem: next,
      systemStem: String(next?.stars?.byId?.[starIds[0]]?.name || "").trim(),
      starNames: starIds.map((starId) => String(next?.stars?.byId?.[starId]?.name || "").trim()),
    };
  }

  const { systemStem, starNames } = namePicker.buildStarNames(starIds.length);
  for (let index = 0; index < starIds.length; index += 1) {
    const starId = starIds[index];
    if (!next.stars.byId?.[starId]) continue;
    next.stars.byId[starId].name = starNames[index] || next.stars.byId[starId].name;
  }
  return { stellarSystem: next, systemStem, starNames };
}

function buildSnapshotSections(
  planets,
  moons,
  { selectedPlanetId = null, selectedMoonId = null } = {},
) {
  const safePlanets = (planets || []).map((planet) => clone(planet));
  const safeMoons = (moons || []).map((moon) => clone(moon));
  const planetCollection = makeCollection(safePlanets, "p");
  planetCollection.selectedId = pickSelectedId(safePlanets, selectedPlanetId);
  const moonCollection = makeCollection(safeMoons, "m");
  moonCollection.selectedId = pickSelectedId(safeMoons, selectedMoonId);
  const selectedPlanet = planetCollection.selectedId
    ? planetCollection.byId[planetCollection.selectedId]
    : null;
  const selectedMoon = moonCollection.selectedId
    ? moonCollection.byId[moonCollection.selectedId]
    : null;
  return {
    planets: planetCollection,
    planet: selectedPlanet ? { ...selectedPlanet.inputs, name: selectedPlanet.name } : {},
    moons: moonCollection,
    moon: selectedMoon ? { ...selectedMoon.inputs, name: selectedMoon.name } : {},
  };
}

function buildSystemSection(
  gasGiants,
  debrisDisks,
  worldSystemInputs,
  { selectedGasGiantId = null } = {},
) {
  const safeGasGiants = (gasGiants || []).map((gasGiant) => clone(gasGiant));
  const safeDebrisDisks = (debrisDisks || []).map((disk) => clone(disk));
  const giantCollection = makeCollection(safeGasGiants, "gg");
  giantCollection.selectedId = pickSelectedId(safeGasGiants, selectedGasGiantId);
  return {
    orbitMode: "guided",
    spacingFactor: Number(worldSystemInputs?.spacingFactor || 0),
    orbit1Au: Number(worldSystemInputs?.orbit1Au || 0),
    gasGiants: giantCollection,
    debrisDisks: makeCollection(safeDebrisDisks, "dd"),
  };
}

function resolveHomeworld(planets = [], explicitHomeworldId = null, selectedPlanetId = null) {
  if (explicitHomeworldId) {
    const match = planets.find((planet) => planet?.id === explicitHomeworldId);
    if (match) return match;
  }
  if (selectedPlanetId) {
    const match = planets.find((planet) => planet?.id === selectedPlanetId);
    if (match) return match;
  }
  return planets[0] || null;
}

function buildPreview({
  topologyDraft,
  bodySet,
  worldSystemInputs,
  systemStem,
  starNames,
  snapshot,
  generationMeta = {},
  selectedPlanetId = null,
} = {}) {
  const stars = (topologyDraft?.stellarSystem?.stars?.order || []).map((starId, index) => {
    const star = topologyDraft?.stellarSystem?.stars?.byId?.[starId] || {};
    return {
      id: starId,
      name: star.name || starNames?.[index] || systemStem,
      massMsol: Number(star.massMsol || 0),
    };
  });
  const homeworld = resolveHomeworld(
    bodySet?.planets || [],
    bodySet?.homeworldId,
    selectedPlanetId,
  );
  const goalTemplateLabel =
    generationMeta?.goalTemplateLabel && generationMeta.goalTemplateId !== "none"
      ? generationMeta.goalTemplateLabel
      : "";
  return {
    topologyLabel:
      topologyDraft?.recipeId === "quad-paired"
        ? "Paired quad"
        : topologyDraft?.recipeId === "quad-chain"
          ? "Chained quad"
          : topologyDraft?.recipeId === "close-binary"
            ? "Close circumbinary"
            : topologyDraft?.recipeId === "wide-binary"
              ? "Wide binary"
              : topologyDraft?.recipeId === "triple"
                ? "Hierarchical triple"
                : "Single star",
    defaultHostFrameId: topologyDraft?.stellarSystem?.defaultHostFrameId || "star_a",
    stars,
    bodyCountsByHostFrame:
      bodySet?.countsByHostFrame ||
      countBodiesByHostFrame(bodySet?.planets, bodySet?.gasGiants, bodySet?.debrisDisks),
    homeworld: homeworld
      ? {
          id: homeworld.id,
          name: homeworld.name,
          hostFrameId: homeworld.hostFrameId,
          slotIndex: homeworld.slotIndex,
          semiMajorAxisAu: Number(homeworld?.inputs?.semiMajorAxisAu || 0),
        }
      : null,
    orbitLadder: {
      spacingFactor: Number(worldSystemInputs?.spacingFactor || 0),
      orbit1Au: Number(worldSystemInputs?.orbit1Au || 0),
      activeHostFrameId:
        snapshot?.meta?.defaultHostFrameId ||
        topologyDraft?.stellarSystem?.defaultHostFrameId ||
        "star_a",
    },
    counts: {
      rockyPlanets: bodySet?.planets?.length || 0,
      gasGiants: bodySet?.gasGiants?.length || 0,
      moons: bodySet?.moons?.length || 0,
      debrisDisks: bodySet?.debrisDisks?.length || 0,
    },
    generationModeLabel: generationMeta?.generationModeLabel || "",
    goalTemplateLabel,
    preservedHomeworldId: generationMeta?.preservedHomeworldId || null,
    keyWarnings: bodySet?.diagnostics || [],
  };
}

export function buildDraftWorldFromSections({
  topologyDraft,
  planets = [],
  gasGiants = [],
  moons = [],
  debrisDisks = [],
  worldSystemInputs,
  request,
  generationMeta = {},
  namePicker,
  preserveStarNames = false,
  selectedPlanetId = null,
  selectedMoonId = null,
  selectedGasGiantId = null,
  selectedBodyType = "planet",
  homeworldId = null,
  diagnostics = [],
  countsByHostFrame = null,
} = {}) {
  const baseWorld = defaultWorld();
  const namedTopology = normalizeNamedTopology(topologyDraft, namePicker, { preserveStarNames });
  const star = projectPrimaryStarFromStellarSystem(
    namedTopology.stellarSystem,
    topologyDraft?.star,
  );
  const snapshotSections = buildSnapshotSections(planets, moons, {
    selectedPlanetId,
    selectedMoonId,
  });
  const system = buildSystemSection(gasGiants, debrisDisks, worldSystemInputs, {
    selectedGasGiantId,
  });
  const bodySet = {
    planets: (planets || []).map((planet) => clone(planet)),
    gasGiants: (gasGiants || []).map((gasGiant) => clone(gasGiant)),
    moons: (moons || []).map((moon) => clone(moon)),
    debrisDisks: (debrisDisks || []).map((disk) => clone(disk)),
    homeworldId,
    diagnostics: Array.isArray(diagnostics) ? diagnostics : [],
    countsByHostFrame:
      countsByHostFrame ||
      countBodiesByHostFrame(planets || [], gasGiants || [], debrisDisks || []),
  };

  const draftWorld = {
    ...baseWorld,
    star,
    stellarSystem: namedTopology.stellarSystem,
    system,
    planets: snapshotSections.planets,
    planet: snapshotSections.planet,
    moons: snapshotSections.moons,
    moon: snapshotSections.moon,
    selectedBodyType: selectedBodyType === "gasGiant" ? "gasGiant" : "planet",
    generationMeta: {
      source: "guided-random-system-v2",
      seed: request?.seed || "104729",
      generatorVersion: generationMeta?.generatorVersion || "v2",
      topologyKind: namedTopology.stellarSystem.topologyKind,
      quadLayoutKind: generationMeta?.quadLayoutKind || null,
      rerollMode: generationMeta?.rerollMode || request?.rerollMode || "fresh-draft",
      goalTemplateId: generationMeta?.goalTemplateId || request?.goalTemplateId || "none",
      goalTemplateLabel: generationMeta?.goalTemplateLabel || request?.goalTemplateLabel || "",
      generationModeLabel: generationMeta?.generationModeLabel || "",
      preserveWorldSections: Array.isArray(generationMeta?.preserveWorldSections)
        ? [...generationMeta.preserveWorldSections]
        : [],
      preservedHomeworldId: generationMeta?.preservedHomeworldId || null,
    },
  };

  const snapshot = buildWorldSnapshot(draftWorld, { mode: "summary" });
  return {
    draftWorld,
    preview: buildPreview({
      topologyDraft: { ...topologyDraft, stellarSystem: namedTopology.stellarSystem },
      bodySet,
      worldSystemInputs,
      systemStem: namedTopology.systemStem,
      starNames: namedTopology.starNames,
      snapshot,
      generationMeta: draftWorld.generationMeta,
      selectedPlanetId: snapshotSections.planets.selectedId,
    }),
    namedTopology,
    snapshot,
  };
}

export function buildDraftWorld({
  topologyDraft,
  allocation,
  worldSystemInputs,
  request,
  generationMeta,
  namePicker,
  preserveStarNames = false,
  selectedPlanetId = null,
  selectedMoonId = null,
  selectedGasGiantId = null,
  selectedBodyType = null,
} = {}) {
  return buildDraftWorldFromSections({
    topologyDraft,
    planets: allocation?.planets || [],
    gasGiants: allocation?.gasGiants || [],
    moons: allocation?.moons || [],
    debrisDisks: allocation?.debrisDisks || [],
    worldSystemInputs,
    request,
    generationMeta,
    namePicker,
    preserveStarNames,
    selectedPlanetId:
      selectedPlanetId || allocation?.preservedHomeworld?.id || allocation?.homeworld?.id,
    selectedMoonId,
    selectedGasGiantId,
    selectedBodyType:
      selectedBodyType ||
      (allocation?.gasGiants?.length && !(allocation?.planets?.length || 0)
        ? "gasGiant"
        : "planet"),
    homeworldId: allocation?.preservedHomeworld?.id || allocation?.homeworld?.id || null,
    diagnostics: allocation?.diagnostics || [],
    countsByHostFrame: allocation?.countsByHostFrame || null,
  });
}
