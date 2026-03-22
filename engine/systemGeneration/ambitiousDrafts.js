import {
  buildRandomSystemDraftEnvelope,
  buildSystemBodyTargets,
  normalizeRandomSystemRequest,
  RANDOM_SYSTEM_GENERATOR_VERSION,
} from "./contracts.js";
import { buildDraftWorldFromSections } from "./draftBuilder.js";
import { createNamePicker } from "./namePicker.js";
import { createSeededRng } from "./seededRng.js";
import { synthesizeMoon } from "./bodySynthesizer.js";
import {
  buildTopologyDraftFromWorld,
  getSelectedPlanetEntry,
  listExistingDebrisDisks,
  listExistingGasGiants,
  listExistingPlanets,
  renameExistingWorldBodies,
  reservePrimaryBodyNames,
  reserveStarNames,
} from "./currentWorldHelpers.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function buildGenerationModeLabel(rerollMode = "fresh-draft") {
  switch (String(rerollMode || "").trim()) {
    case "reroll-names-only":
      return "Reroll names only";
    case "keep-stars-reroll-planets":
      return "Keep stars, reroll planets";
    case "keep-planets-reroll-moons":
      return "Keep planets, reroll moons";
    case "fresh-draft":
    default:
      return "Fresh draft";
  }
}

export function buildPreserveWorldSections(request = {}, { preservedHomeworld = false } = {}) {
  switch (String(request?.rerollMode || "").trim()) {
    case "reroll-names-only":
    case "keep-planets-reroll-moons":
      return ["tectonics", "population", "climate"];
    case "keep-stars-reroll-planets":
      return preservedHomeworld ? ["tectonics", "population", "climate"] : [];
    default:
      return [];
  }
}

export function buildPreservedHomeworldCandidate(currentWorld, request = {}) {
  if (!request?.preserveSelectedHomeworldDetails) return null;
  const selectedPlanet = getSelectedPlanetEntry(currentWorld);
  const hostFrameId = String(selectedPlanet?.hostFrameId || "").trim();
  const semiMajorAxisAu = Number(selectedPlanet?.inputs?.semiMajorAxisAu || 0);
  if (!selectedPlanet || !hostFrameId || !(semiMajorAxisAu > 0)) return null;
  return clone(selectedPlanet);
}

function currentWorldSystemInputs(currentWorld = {}) {
  return {
    spacingFactor: Number(currentWorld?.system?.spacingFactor || 0.33),
    orbit1Au: Number(currentWorld?.system?.orbit1Au || 0.62),
  };
}

function currentSelectionState(currentWorld = {}, nextMoons = []) {
  const selectedBodyType = currentWorld?.selectedBodyType === "gasGiant" ? "gasGiant" : "planet";
  return {
    selectedPlanetId: String(currentWorld?.planets?.selectedId || "").trim() || null,
    selectedMoonId: nextMoons.some((moon) => moon?.id === currentWorld?.moons?.selectedId)
      ? String(currentWorld?.moons?.selectedId || "").trim()
      : nextMoons[0]?.id || null,
    selectedGasGiantId: String(currentWorld?.system?.gasGiants?.selectedId || "").trim() || null,
    selectedBodyType,
  };
}

function buildPrimaryMoonParents(currentWorld = {}) {
  const gasGiants = listExistingGasGiants(currentWorld).map((entry) => ({
    id: entry.id,
    kind: "gasGiant",
  }));
  const selectedPlanet = getSelectedPlanetEntry(currentWorld);
  const planets = listExistingPlanets(currentWorld);
  const preservedPlanetParent =
    selectedPlanet && selectedPlanet?.id ? [{ id: selectedPlanet.id, kind: "planet" }] : [];
  const fallbackPlanetParent =
    !preservedPlanetParent.length && planets[0]?.id ? [{ id: planets[0].id, kind: "planet" }] : [];
  return [...gasGiants, ...preservedPlanetParent, ...fallbackPlanetParent];
}

export function buildNamesOnlyDraft(rawRequest = {}, { currentWorld } = {}) {
  const request = normalizeRandomSystemRequest(rawRequest);
  const namePicker = createNamePicker({ seed: request.seed, namingStyle: request.namingStyle });
  const renamed = renameExistingWorldBodies(currentWorld, namePicker);
  const selection = currentSelectionState(currentWorld, renamed.moons);
  const built = buildDraftWorldFromSections({
    topologyDraft: renamed.topologyDraft,
    planets: renamed.planets,
    gasGiants: renamed.gasGiants,
    moons: renamed.moons,
    debrisDisks: renamed.debrisDisks,
    worldSystemInputs: currentWorldSystemInputs(currentWorld),
    request,
    generationMeta: {
      generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
      topologyKind: renamed.topologyDraft?.stellarSystem?.topologyKind || "single",
      quadLayoutKind: renamed.topologyDraft?.quadLayoutKind || null,
      rerollMode: request.rerollMode,
      generationModeLabel: buildGenerationModeLabel(request.rerollMode),
      goalTemplateId: request.goalTemplateId,
      goalTemplateLabel: request.goalTemplateLabel,
      preserveWorldSections: buildPreserveWorldSections(request, { preservedHomeworld: true }),
      preservedHomeworldId: selection.selectedPlanetId,
      nameCatalogVersion: namePicker.catalogVersion,
    },
    preserveStarNames: true,
    selectedPlanetId: selection.selectedPlanetId,
    selectedMoonId: selection.selectedMoonId,
    selectedGasGiantId: selection.selectedGasGiantId,
    selectedBodyType: selection.selectedBodyType,
    homeworldId: selection.selectedPlanetId,
  });

  return buildRandomSystemDraftEnvelope({
    request,
    generationMeta: {
      generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
      topologyKind: renamed.topologyDraft?.stellarSystem?.topologyKind || "single",
      quadLayoutKind: renamed.topologyDraft?.quadLayoutKind || null,
      rerollMode: request.rerollMode,
      generationModeLabel: buildGenerationModeLabel(request.rerollMode),
      goalTemplateId: request.goalTemplateId,
      goalTemplateLabel: request.goalTemplateLabel,
      nameCatalogVersion: namePicker.catalogVersion,
      preserveWorldSections: buildPreserveWorldSections(request, { preservedHomeworld: true }),
      preservedHomeworldId: selection.selectedPlanetId,
    },
    draftWorld: built.draftWorld,
    preview: built.preview,
    diagnostics: [],
    fitClass: "exact-match",
  });
}

export function buildKeepPlanetsRerollMoonsDraft(rawRequest = {}, { currentWorld } = {}) {
  const request = normalizeRandomSystemRequest(rawRequest);
  const topologyDraft = buildTopologyDraftFromWorld(currentWorld);
  const planets = listExistingPlanets(currentWorld);
  const gasGiants = listExistingGasGiants(currentWorld);
  const debrisDisks = listExistingDebrisDisks(currentWorld);
  const baseRng = createSeededRng(`${request.seed}:moon-reroll`);
  const bodyTargets = buildSystemBodyTargets(request, baseRng.fork("body-targets"));
  const namePicker = createNamePicker({ seed: request.seed, namingStyle: request.namingStyle });
  reserveStarNames(namePicker, topologyDraft.stellarSystem);
  reservePrimaryBodyNames(namePicker, currentWorld);

  const diagnostics = [];
  const moonParents = buildPrimaryMoonParents(currentWorld);
  const moons = [];
  if (!moonParents.length && Number(bodyTargets.moonBudget || 0) > 0) {
    diagnostics.push({
      severity: "warning",
      code: "moon-reroll-without-parents",
      title: "No viable parent worlds for moon reroll",
      detail:
        "The current system has no preserved gas giant or rocky parent suitable for regenerated moons.",
    });
  } else {
    let moonIndex = 0;
    while (moonIndex < Number(bodyTargets?.moonBudget || 0) && moonParents.length) {
      const parent = moonParents[moonIndex % moonParents.length];
      moons.push(
        synthesizeMoon({
          id: `m${moonIndex + 1}`,
          name: namePicker.pickMoonName(),
          request,
          parentId: parent.id,
          parentKind: parent.kind,
          index: Math.floor(moonIndex / moonParents.length),
          rng: baseRng.fork(`moon:${moonIndex}`),
        }),
      );
      moonIndex += 1;
    }
  }

  const selection = currentSelectionState(currentWorld, moons);
  const built = buildDraftWorldFromSections({
    topologyDraft,
    planets,
    gasGiants,
    moons,
    debrisDisks,
    worldSystemInputs: currentWorldSystemInputs(currentWorld),
    request,
    generationMeta: {
      generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
      topologyKind: topologyDraft?.stellarSystem?.topologyKind || "single",
      quadLayoutKind: topologyDraft?.quadLayoutKind || null,
      rerollMode: request.rerollMode,
      generationModeLabel: buildGenerationModeLabel(request.rerollMode),
      goalTemplateId: request.goalTemplateId,
      goalTemplateLabel: request.goalTemplateLabel,
      preserveWorldSections: buildPreserveWorldSections(request, { preservedHomeworld: true }),
      preservedHomeworldId: selection.selectedPlanetId,
      nameCatalogVersion: namePicker.catalogVersion,
    },
    preserveStarNames: true,
    selectedPlanetId: selection.selectedPlanetId,
    selectedMoonId: selection.selectedMoonId,
    selectedGasGiantId: selection.selectedGasGiantId,
    selectedBodyType: selection.selectedBodyType,
    homeworldId: selection.selectedPlanetId,
    diagnostics,
  });

  return buildRandomSystemDraftEnvelope({
    request,
    generationMeta: {
      generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
      topologyKind: topologyDraft?.stellarSystem?.topologyKind || "single",
      quadLayoutKind: topologyDraft?.quadLayoutKind || null,
      rerollMode: request.rerollMode,
      generationModeLabel: buildGenerationModeLabel(request.rerollMode),
      goalTemplateId: request.goalTemplateId,
      goalTemplateLabel: request.goalTemplateLabel,
      nameCatalogVersion: namePicker.catalogVersion,
      preserveWorldSections: buildPreserveWorldSections(request, { preservedHomeworld: true }),
      preservedHomeworldId: selection.selectedPlanetId,
    },
    draftWorld: built.draftWorld,
    preview: built.preview,
    diagnostics,
    fitClass: diagnostics.length ? "near-miss" : "exact-match",
  });
}
