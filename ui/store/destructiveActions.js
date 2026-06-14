import { getComets as getCometsModel } from "./cometModel.js";
import {
  getDefaultHostFrameId,
  listStellarSystemHostFrames,
  listStellarSystemStars,
  normalizeStellarSystem,
} from "./stellarSystemModel.js";
import { listFromCollection } from "./systemCollections.js";

function quoteLabel(label, fallback) {
  const text = String(label || "").trim() || fallback;
  return `"${text}"`;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function listCollectionEntries(collection) {
  return listFromCollection(collection).filter(Boolean);
}

function listRemaining(collection, removedId) {
  return listCollectionEntries(collection).filter((entry) => entry.id !== removedId);
}

function listDependentMoons(world, parentId) {
  const moonsById =
    world?.moons?.byId && typeof world.moons.byId === "object" ? world.moons.byId : {};
  return Object.values(moonsById).filter((moon) => moon && moon.planetId === parentId);
}

function buildSlotConsequence(slotIndex) {
  if (slotIndex == null) return null;
  return `Orbital slot ${slotIndex} will become empty.`;
}

function joinLabels(labels = [], fallback = "the remaining items") {
  const quoted = labels
    .map((label) => String(label || "").trim())
    .filter(Boolean)
    .map((label) => quoteLabel(label, label));
  if (!quoted.length) return fallback;
  if (quoted.length === 1) return quoted[0];
  if (quoted.length === 2) return `${quoted[0]} and ${quoted[1]}`;
  return `${quoted.slice(0, -1).join(", ")}, and ${quoted[quoted.length - 1]}`;
}

function formatCountList(parts = []) {
  const phrases = parts
    .filter((part) => Number(part?.count) > 0)
    .map((part) => pluralize(part.count, part.singular, part.plural));
  if (!phrases.length) return "";
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
}

function buildHostFrameLabelIndex(stellarSystem) {
  const labels = new Map();
  for (const hostFrame of listStellarSystemHostFrames(stellarSystem)) {
    labels.set(hostFrame.id, hostFrame.label || hostFrame.id);
  }
  return labels;
}

function resolveMoonParentHostFrameId(world, moon, fallbackHostFrameId) {
  const parentPlanet = world?.planets?.byId?.[moon?.planetId];
  if (parentPlanet) {
    return normalizeHostFrameId(parentPlanet.hostFrameId, fallbackHostFrameId);
  }
  const parentGasGiant = world?.system?.gasGiants?.byId?.[moon?.planetId];
  if (parentGasGiant) {
    return normalizeHostFrameId(parentGasGiant.hostFrameId, fallbackHostFrameId);
  }
  return fallbackHostFrameId;
}

function resolveMoonHostFrameId(world, moon, fallbackHostFrameId) {
  return normalizeHostFrameId(
    moon?.hostFrameId,
    resolveMoonParentHostFrameId(world, moon, fallbackHostFrameId),
  );
}

function buildHostFrameReassignmentTargets(world, removedHostFrameIds, currentFallbackHostFrameId) {
  const removedHostFrameIdSet = new Set(removedHostFrameIds);
  const planets = Object.values(world?.planets?.byId || {}).filter(Boolean);
  const gasGiants = listCollectionEntries(world?.system?.gasGiants);
  const moons = Object.values(world?.moons?.byId || {}).filter(Boolean);
  const debrisDisks = listCollectionEntries(world?.system?.debrisDisks);
  const comets = getCometsModel(world, { fallbackHostFrameId: currentFallbackHostFrameId });

  const planetsToReassign = planets.filter((planet) =>
    removedHostFrameIdSet.has(normalizeHostFrameId(planet.hostFrameId, currentFallbackHostFrameId)),
  );
  const gasGiantsToReassign = gasGiants.filter((gasGiant) =>
    removedHostFrameIdSet.has(
      normalizeHostFrameId(gasGiant.hostFrameId, currentFallbackHostFrameId),
    ),
  );
  const moonsToReassign = moons.filter((moon) =>
    removedHostFrameIdSet.has(resolveMoonHostFrameId(world, moon, currentFallbackHostFrameId)),
  );
  const debrisDisksToReassign = debrisDisks.filter((disk) =>
    removedHostFrameIdSet.has(normalizeHostFrameId(disk.hostFrameId, currentFallbackHostFrameId)),
  );
  const cometsToReassign = comets.filter((comet) =>
    removedHostFrameIdSet.has(normalizeHostFrameId(comet.hostFrameId, currentFallbackHostFrameId)),
  );

  return {
    planets: planetsToReassign,
    gasGiants: gasGiantsToReassign,
    moons: moonsToReassign,
    debrisDisks: debrisDisksToReassign,
    comets: cometsToReassign,
  };
}

function resolveHostFrameLabel(world, hostFrameId, fallbackHostFrameId = null) {
  const labelIndex = buildHostFrameLabelIndex(world?.stellarSystem);
  const resolvedHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  return labelIndex.get(resolvedHostFrameId) || resolvedHostFrameId || "the current host frame";
}

function buildSelectionConsequence(kind, fallbackSelection) {
  if (!fallbackSelection) return null;
  return `${kind} selection will switch to ${quoteLabel(
    fallbackSelection.name,
    `the next ${kind.toLowerCase()}`,
  )}.`;
}

export function buildDeletePlanetPlan(world, planetId) {
  const planet = world?.planets?.byId?.[planetId];
  if (!planet) return null;

  const dependentMoons = listDependentMoons(world, planetId);
  const remainingPlanets = listRemaining(world?.planets, planetId);
  const fallbackPlanet = remainingPlanets[0] || null;
  const planetLabel = String(planet.name || "this planet").trim() || "this planet";

  const consequences = [];
  if (dependentMoons.length) {
    consequences.push(
      `${pluralize(dependentMoons.length, "moon")} will become unassigned and unlocked.`,
    );
  } else {
    consequences.push("No moons currently depend on this planet.");
  }
  const slotConsequence = buildSlotConsequence(planet.slotIndex);
  if (slotConsequence) consequences.push(slotConsequence);
  const selectionConsequence = buildSelectionConsequence("Planet", fallbackPlanet);
  if (selectionConsequence) consequences.push(selectionConsequence);

  return {
    actionKey: "delete-planet",
    title: `Delete ${planetLabel}?`,
    description: `This permanently removes ${quoteLabel(
      planetLabel,
      "this planet",
    )} from the current world.`,
    confirmLabel: "Delete planet",
    consequences,
    impact: {
      dependentMoonCount: dependentMoons.length,
      fallbackSelectionId: fallbackPlanet?.id || null,
      fallbackSelectionLabel: fallbackPlanet?.name || null,
      slotIndex: planet.slotIndex ?? null,
    },
  };
}

export function buildDeleteGasGiantPlan(world, gasGiantId) {
  const gasGiant = world?.system?.gasGiants?.byId?.[gasGiantId];
  if (!gasGiant) return null;

  const dependentMoons = listDependentMoons(world, gasGiantId);
  const remainingGasGiants = listRemaining(world?.system?.gasGiants, gasGiantId);
  const fallbackGasGiant = remainingGasGiants[0] || null;
  const gasGiantLabel =
    String(gasGiant.name || "this giant companion").trim() || "this giant companion";

  const consequences = [];
  if (dependentMoons.length) {
    consequences.push(
      `${pluralize(dependentMoons.length, "moon")} will become unassigned and unlocked.`,
    );
  } else {
    consequences.push("No moons currently depend on this giant companion.");
  }
  const slotConsequence = buildSlotConsequence(gasGiant.slotIndex);
  if (slotConsequence) consequences.push(slotConsequence);
  const selectionConsequence = buildSelectionConsequence("Gas-giant", fallbackGasGiant);
  if (selectionConsequence) consequences.push(selectionConsequence);
  else {
    consequences.push(
      "Gas-giant editing will switch back to planets because no giant companions will remain.",
    );
  }

  return {
    actionKey: "delete-gas-giant",
    title: `Delete ${gasGiantLabel}?`,
    description: `This permanently removes ${quoteLabel(
      gasGiantLabel,
      "this giant companion",
    )} from the current system.`,
    confirmLabel: "Delete giant companion",
    consequences,
    impact: {
      dependentMoonCount: dependentMoons.length,
      fallbackSelectionId: fallbackGasGiant?.id || null,
      fallbackSelectionLabel: fallbackGasGiant?.name || null,
      slotIndex: gasGiant.slotIndex ?? null,
      bodyTypeFallsBackToPlanet: !fallbackGasGiant,
    },
  };
}

export function buildDeleteMoonPlan(world, moonId) {
  const moon = world?.moons?.byId?.[moonId];
  if (!moon) return null;

  const remainingMoons = listRemaining(world?.moons, moonId);
  const fallbackMoon = remainingMoons[0] || null;
  const moonLabel = String(moon.name || "this moon").trim() || "this moon";

  const consequences = [
    `${quoteLabel(moonLabel, "this moon")} will be permanently removed from the moon list.`,
  ];
  const selectionConsequence = buildSelectionConsequence("Moon", fallbackMoon);
  if (selectionConsequence) consequences.push(selectionConsequence);
  if (moon.planetId == null) {
    consequences.push("It is already unassigned, so no parent body relationships will change.");
  }

  return {
    actionKey: "delete-moon",
    title: `Delete ${moonLabel}?`,
    description: `This permanently removes ${quoteLabel(
      moonLabel,
      "this moon",
    )} from the current world.`,
    confirmLabel: "Delete moon",
    consequences,
    impact: {
      fallbackSelectionId: fallbackMoon?.id || null,
      fallbackSelectionLabel: fallbackMoon?.name || null,
      parentBodyId: moon.planetId || null,
    },
  };
}

export function buildStellarSystemTransitionImpact(world, currentStellarSystem, nextStellarSystem) {
  const current = normalizeStellarSystem(currentStellarSystem, { fallbackStar: world?.star });
  const next = normalizeStellarSystem(nextStellarSystem, { fallbackStar: world?.star });
  const currentStars = listStellarSystemStars(current);
  const nextStarsById = new Set(listStellarSystemStars(next).map((star) => star.id));
  const currentHostFrames = listStellarSystemHostFrames(current);
  const nextHostFrames = listStellarSystemHostFrames(next);
  const nextHostFrameIds = new Set(nextHostFrames.map((hostFrame) => hostFrame.id));
  const currentDefaultHostFrameId = getDefaultHostFrameId(current);
  const nextDefaultHostFrameId = getDefaultHostFrameId(next);
  const nextHostFrameLabelIndex = buildHostFrameLabelIndex(next);

  const removedStars = currentStars.filter((star) => !nextStarsById.has(star.id));
  const removedHostFrames = currentHostFrames.filter(
    (hostFrame) => !nextHostFrameIds.has(hostFrame.id),
  );
  const removedPairFrames = removedHostFrames.filter((hostFrame) => hostFrame.frameKind === "pair");
  const reassignmentTargets = buildHostFrameReassignmentTargets(
    world,
    removedHostFrames.map((hostFrame) => hostFrame.id),
    currentDefaultHostFrameId,
  );
  const clearedOrbitSlotCount =
    reassignmentTargets.planets.filter((planet) => planet.slotIndex != null).length +
    reassignmentTargets.gasGiants.filter((gasGiant) => gasGiant.slotIndex != null).length;
  const totalReassignmentCount =
    reassignmentTargets.planets.length +
    reassignmentTargets.gasGiants.length +
    reassignmentTargets.moons.length +
    reassignmentTargets.debrisDisks.length +
    reassignmentTargets.comets.length;
  const defaultHostFrameChanged = currentDefaultHostFrameId !== nextDefaultHostFrameId;

  return {
    currentStellarSystem: current,
    nextStellarSystem: next,
    nextHostFrames,
    validNextHostFrameIds: nextHostFrameIds,
    fallbackHostFrameId: nextDefaultHostFrameId,
    fallbackHostFrameLabel:
      nextHostFrameLabelIndex.get(nextDefaultHostFrameId) ||
      nextDefaultHostFrameId ||
      "the surviving default host frame",
    currentDefaultHostFrameId,
    removedStars,
    removedHostFrames,
    removedPairFrames,
    reassignments: {
      planets: reassignmentTargets.planets.length,
      gasGiants: reassignmentTargets.gasGiants.length,
      moons: reassignmentTargets.moons.length,
      debrisDisks: reassignmentTargets.debrisDisks.length,
      comets: reassignmentTargets.comets.length,
    },
    reassignmentTargets,
    clearedOrbitSlotCount,
    totalReassignmentCount,
    defaultHostFrameChanged,
    requiresConfirmation:
      removedStars.length > 0 || totalReassignmentCount > 0 || defaultHostFrameChanged,
  };
}

export function buildStellarTopologyChangePlan(world, currentStellarSystem, nextStellarSystem) {
  const impact = buildStellarSystemTransitionImpact(world, currentStellarSystem, nextStellarSystem);
  if (!impact.requiresConfirmation) return null;

  const consequences = [];
  if (impact.removedStars.length) {
    consequences.push(
      `${pluralize(impact.removedStars.length, "star")} will be removed from the home-system layout: ${joinLabels(
        impact.removedStars.map((star) => star.name || star.id),
      )}.`,
    );
  }
  if (impact.removedPairFrames.length) {
    consequences.push(
      `${pluralize(
        impact.removedPairFrames.length,
        "barycentric orbit frame",
        "barycentric orbit frames",
      )} will disappear from the surviving hierarchy.`,
    );
  }
  if (impact.totalReassignmentCount) {
    consequences.push(
      `${formatCountList([
        { count: impact.reassignments.planets, singular: "planet" },
        { count: impact.reassignments.gasGiants, singular: "gas giant", plural: "gas giants" },
        { count: impact.reassignments.moons, singular: "moon" },
        { count: impact.reassignments.debrisDisks, singular: "debris disk" },
        { count: impact.reassignments.comets, singular: "comet" },
      ])} in removed orbit frames will be reassigned to ${quoteLabel(
        impact.fallbackHostFrameLabel,
        "the surviving default host frame",
      )}.`,
    );
  }
  if (impact.clearedOrbitSlotCount) {
    consequences.push(
      `${pluralize(
        impact.clearedOrbitSlotCount,
        "orbit slot",
      )} on reassigned planets and giant companions will be cleared.`,
    );
  }
  if (impact.defaultHostFrameChanged) {
    consequences.push(
      `The default orbit host will switch to ${quoteLabel(
        impact.fallbackHostFrameLabel,
        "the surviving default host frame",
      )}.`,
    );
  }

  const title =
    impact.removedStars.length === 1
      ? `Remove ${impact.removedStars[0]?.name || "this star"}?`
      : impact.removedStars.length > 1
        ? "Simplify the home-system layout?"
        : "Change the home-system layout?";

  const description =
    impact.removedStars.length > 0
      ? `This permanently removes ${pluralize(
          impact.removedStars.length,
          "star",
        )} from the current home-system layout and keeps surviving orbit ownership in sync.`
      : "This rebuilds the orbit-frame hierarchy and reassigns any bodies tied to frames that no longer exist.";

  return {
    actionKey: "change-stellar-topology",
    title,
    description,
    confirmLabel: impact.removedStars.length > 0 ? "Change topology" : "Change layout",
    consequences,
    impact,
  };
}

export function buildDeleteCometPlan(
  world,
  cometId,
  { hostFrameId = null, fallbackHostFrameId = null } = {},
) {
  const resolvedFallbackHostFrameId =
    normalizeHostFrameId(fallbackHostFrameId, getDefaultHostFrameId(world?.stellarSystem)) ||
    "star_a";
  const allComets = getCometsModel(world, { fallbackHostFrameId: resolvedFallbackHostFrameId });
  const visibleComets = getCometsModel(world, {
    hostFrameId,
    fallbackHostFrameId: resolvedFallbackHostFrameId,
  });
  const comet = allComets.find((entry) => entry.id === cometId);
  if (!comet) return null;
  const remainingVisibleComets = visibleComets.filter((entry) => entry.id !== cometId);
  const fallbackComet = remainingVisibleComets[0] || null;
  const hostFrameLabel = resolveHostFrameLabel(
    world,
    hostFrameId || comet.hostFrameId,
    resolvedFallbackHostFrameId,
  );
  const cometLabel = String(comet.name || "this comet").trim() || "this comet";

  const consequences = [
    `It will be permanently removed from the comet list for ${quoteLabel(
      hostFrameLabel,
      "the current host frame",
    )}.`,
  ];
  if (fallbackComet) {
    consequences.push(
      `Comet selection will switch to ${quoteLabel(fallbackComet.name, "the next comet")}.`,
    );
  } else {
    consequences.push(
      `No comet will remain selected in ${quoteLabel(hostFrameLabel, hostFrameLabel)}.`,
    );
  }

  return {
    actionKey: "delete-comet",
    title: `Delete ${cometLabel}?`,
    description: `This permanently removes ${quoteLabel(
      cometLabel,
      "this comet",
    )} from the current world.`,
    confirmLabel: "Delete comet",
    consequences,
    impact: {
      hostFrameId: hostFrameId || comet.hostFrameId || resolvedFallbackHostFrameId,
      hostFrameLabel,
      fallbackSelectionId: fallbackComet?.id || null,
      fallbackSelectionLabel: fallbackComet?.name || null,
    },
  };
}

export function buildDeleteDebrisDiskPlan(
  world,
  debrisDiskId,
  { hostFrameId = null, fallbackHostFrameId = null } = {},
) {
  const resolvedFallbackHostFrameId =
    normalizeHostFrameId(fallbackHostFrameId, getDefaultHostFrameId(world?.stellarSystem)) ||
    "star_a";
  const allDebrisDisks = listCollectionEntries(world?.system?.debrisDisks).map((disk) => ({
    ...disk,
    hostFrameId: normalizeHostFrameId(disk.hostFrameId, resolvedFallbackHostFrameId),
  }));
  const debrisDisk = allDebrisDisks.find((entry) => entry.id === debrisDiskId);
  if (!debrisDisk) return null;
  const resolvedHostFrameId = normalizeHostFrameId(
    hostFrameId || debrisDisk.hostFrameId,
    resolvedFallbackHostFrameId,
  );
  const remainingVisibleDebrisDisks = allDebrisDisks.filter(
    (entry) => entry.id !== debrisDiskId && entry.hostFrameId === resolvedHostFrameId,
  );
  const hostFrameLabel = resolveHostFrameLabel(
    world,
    resolvedHostFrameId,
    resolvedFallbackHostFrameId,
  );
  const debrisDiskLabel =
    String(debrisDisk.name || "this debris disk").trim() || "this debris disk";

  const consequences = [
    `It will be permanently removed from the debris list for ${quoteLabel(
      hostFrameLabel,
      "the current host frame",
    )}.`,
  ];
  if (remainingVisibleDebrisDisks.length) {
    consequences.push(
      `${quoteLabel(
        hostFrameLabel,
        hostFrameLabel,
      )} will still have ${pluralize(remainingVisibleDebrisDisks.length, "debris disk")} remaining.`,
    );
  } else {
    consequences.push(
      `${quoteLabel(hostFrameLabel, hostFrameLabel)} will have no debris disks left after deletion.`,
    );
  }

  return {
    actionKey: "delete-debris-disk",
    title: `Delete ${debrisDiskLabel}?`,
    description: `This permanently removes ${quoteLabel(
      debrisDiskLabel,
      "this debris disk",
    )} from the current world.`,
    confirmLabel: "Delete debris disk",
    consequences,
    impact: {
      hostFrameId: resolvedHostFrameId,
      hostFrameLabel,
      remainingVisibleCount: remainingVisibleDebrisDisks.length,
    },
  };
}

export function buildDeleteCalendarProfilePlan({
  profiles = [],
  profileId = null,
  profileName = "",
} = {}) {
  const remainingProfiles = (Array.isArray(profiles) ? profiles : []).filter(
    (profile) => String(profile?.id) !== String(profileId),
  );
  if (!remainingProfiles.length) return null;
  const fallbackProfile = remainingProfiles[0] || null;
  const label = String(profileName || "this profile").trim() || "this profile";

  return {
    actionKey: "delete-calendar-profile",
    title: `Delete ${label}?`,
    description: `This permanently removes ${quoteLabel(
      label,
      "this profile",
    )} from the calendar editor.`,
    confirmLabel: "Delete profile",
    consequences: [
      `Calendar profile selection will switch to ${quoteLabel(
        fallbackProfile?.name,
        "the next profile",
      )}.`,
      `${pluralize(remainingProfiles.length, "profile")} will remain after deletion.`,
    ],
    impact: {
      remainingProfileCount: remainingProfiles.length,
      fallbackProfileId: fallbackProfile?.id || null,
      fallbackProfileLabel: fallbackProfile?.name || null,
    },
  };
}

export function buildClearClusterAdjustmentsPlan({
  actionLabel = "Continue",
  addedSystemCount = 0,
  hiddenSystemCount = 0,
  modifiedSystemCount = 0,
  finalConsequence = "",
} = {}) {
  const totalAdjustmentCount = addedSystemCount + hiddenSystemCount + modifiedSystemCount;
  if (!totalAdjustmentCount) return null;

  const consequences = [];
  if (addedSystemCount) {
    consequences.push(`${pluralize(addedSystemCount, "manually added system")} will be removed.`);
  }
  if (hiddenSystemCount) {
    consequences.push(
      `${pluralize(
        hiddenSystemCount,
        "hidden generated system",
      )} will be restored from the seed model.`,
    );
  }
  if (modifiedSystemCount) {
    consequences.push(
      `${pluralize(
        modifiedSystemCount,
        "system companion override",
        "system companion overrides",
      )} will be cleared.`,
    );
  }
  if (finalConsequence) consequences.push(finalConsequence);

  return {
    actionKey: "clear-cluster-adjustments",
    title: `${actionLabel}?`,
    description: "This discards the current manual local-cluster adjustments.",
    confirmLabel: actionLabel,
    consequences,
    impact: {
      totalAdjustmentCount,
      addedSystemCount,
      hiddenSystemCount,
      modifiedSystemCount,
    },
  };
}

export function buildRemoveClusterSystemPlan({
  classLabel = "star system",
  sourceKind = "generated",
} = {}) {
  const normalizedClassLabel = String(classLabel || "star system").trim() || "star system";
  const isManual = sourceKind === "manual";
  return {
    actionKey: "remove-cluster-system",
    title: isManual
      ? `Remove added ${normalizedClassLabel} system?`
      : `Hide one ${normalizedClassLabel} system?`,
    description: isManual
      ? `This removes one manually added ${normalizedClassLabel} system from the current cluster adjustments.`
      : `This hides one generated ${normalizedClassLabel} system from the current cluster until adjustments are cleared.`,
    confirmLabel: isManual ? "Remove system" : "Hide system",
    consequences: [
      "Cluster counts and the 3D neighbourhood view will update immediately.",
      isManual
        ? "The system will be lost from the current adjustment layer."
        : "Clearing adjustments will restore the generated system from the current seed.",
    ],
    impact: {
      classLabel: normalizedClassLabel,
      sourceKind: isManual ? "manual" : "generated",
    },
  };
}

function multiplicityLabel(count) {
  if (count <= 1) return "single";
  if (count === 2) return "binary";
  if (count === 3) return "triple";
  return "quadruple";
}

export function buildRemoveClusterCompanionPlan({
  systemLabel = "this system",
  companionLabel = "selected",
  beforeComponentCount = 2,
} = {}) {
  const normalizedBeforeCount = Math.max(2, Number(beforeComponentCount) || 2);
  const afterComponentCount = Math.max(1, normalizedBeforeCount - 1);
  const normalizedSystemLabel = String(systemLabel || "this system").trim() || "this system";
  const normalizedCompanionLabel = String(companionLabel || "selected").trim() || "selected";
  return {
    actionKey: "remove-cluster-companion",
    title: `Remove the ${normalizedCompanionLabel} companion?`,
    description: `This removes the ${normalizedCompanionLabel} companion from ${quoteLabel(
      normalizedSystemLabel,
      "this system",
    )}.`,
    confirmLabel: "Remove companion",
    consequences: [
      `${quoteLabel(
        normalizedSystemLabel,
        normalizedSystemLabel,
      )} will change from ${multiplicityLabel(normalizedBeforeCount)} to ${multiplicityLabel(
        afterComponentCount,
      )}.`,
      "Cluster counts and the 3D neighbourhood view will update immediately.",
    ],
    impact: {
      beforeComponentCount: normalizedBeforeCount,
      afterComponentCount,
      systemLabel: normalizedSystemLabel,
      companionLabel: normalizedCompanionLabel,
    },
  };
}

export function buildClearSavedDataPlan({ hasBackups = true } = {}) {
  return {
    actionKey: "clear-saved-data",
    title: "Clear saved WorldSmith data?",
    description: "This removes the saved world state from this browser.",
    confirmLabel: "Clear saved data",
    consequences: [
      hasBackups
        ? "All saved worlds and browser backups will be deleted."
        : "The current saved world will be deleted from this browser.",
      "This cannot be undone.",
    ],
    impact: {
      hasBackups: !!hasBackups,
    },
  };
}

export function buildClearCurrentSavedWorldPlan({ hasBackups = true } = {}) {
  return {
    actionKey: "clear-current-saved-world",
    title: "Start fresh and keep backups?",
    description: "This removes only the current saved world from this browser.",
    confirmLabel: "Start fresh",
    consequences: [
      "The app will open with a blank default world next time this browser state is loaded.",
      hasBackups
        ? "Your backup library will remain available for restore."
        : "No backups were found, so there will be no restore point unless you export first.",
      "Browser settings and guided session state are not cleared.",
    ],
    impact: {
      hasBackups: !!hasBackups,
    },
  };
}

export function buildClearBackupsPlan({ backupCount = 0 } = {}) {
  const normalizedBackupCount = Math.max(0, Math.trunc(Number(backupCount) || 0));
  return {
    actionKey: "clear-backups",
    title: "Delete all backups?",
    description: "This clears the backup library while keeping the current saved world.",
    confirmLabel: "Delete backups",
    consequences: [
      normalizedBackupCount
        ? `${pluralize(normalizedBackupCount, "backup")} will be permanently deleted.`
        : "No backups are currently stored.",
      "The current saved world will not be deleted.",
      "This cannot be undone.",
    ],
    impact: {
      backupCount: normalizedBackupCount,
    },
  };
}

export function buildDeleteBackupPlan({ backupLabel = "this backup" } = {}) {
  const normalizedBackupLabel = String(backupLabel || "this backup").trim() || "this backup";
  return {
    actionKey: "delete-backup",
    title: `Delete ${normalizedBackupLabel}?`,
    description: `This permanently removes ${quoteLabel(
      normalizedBackupLabel,
      "this backup",
    )} from the backup library.`,
    confirmLabel: "Delete backup",
    consequences: [
      "The current saved world will not be changed.",
      "This backup cannot be restored after deletion.",
    ],
    impact: {
      backupLabel: normalizedBackupLabel,
    },
  };
}

export function buildRestoreBackupPlan({ backupLabel = "this backup" } = {}) {
  const normalizedBackupLabel = String(backupLabel || "this backup").trim() || "this backup";
  return {
    actionKey: "restore-backup",
    title: `Restore ${normalizedBackupLabel}?`,
    description: `This replaces the current saved world with ${quoteLabel(
      normalizedBackupLabel,
      "this backup",
    )}.`,
    confirmLabel: "Restore backup",
    consequences: [
      "A backup of the current world will be created automatically first.",
      "The current saved world, active selections, and derived outputs will be replaced.",
    ],
    impact: {
      backupLabel: normalizedBackupLabel,
    },
  };
}

export function buildReplaceCurrentWorldPlan({
  sourceLabel = "this import",
  confirmLabel = "Replace current world",
} = {}) {
  const normalizedSourceLabel = String(sourceLabel || "this import").trim() || "this import";
  return {
    actionKey: "replace-current-world",
    title: `Apply ${normalizedSourceLabel}?`,
    description: `This replaces the current world with ${quoteLabel(
      normalizedSourceLabel,
      "this import",
    )}.`,
    confirmLabel,
    consequences: [
      "A backup of the current world will be created automatically first.",
      "The current saved world, active selections, and derived outputs will be replaced.",
    ],
    impact: {
      sourceLabel: normalizedSourceLabel,
    },
  };
}

export function buildReplaceCurrentWorldWithoutBackupPlan({
  sourceLabel = "this import",
  confirmLabel = "Replace without backup",
} = {}) {
  const normalizedSourceLabel = String(sourceLabel || "this import").trim() || "this import";
  return {
    actionKey: "replace-current-world-without-backup",
    title: `Apply ${normalizedSourceLabel} without creating a backup?`,
    description: `This replaces the current world with ${quoteLabel(
      normalizedSourceLabel,
      "this import",
    )}.`,
    confirmLabel,
    consequences: [
      "No automatic backup will be created first.",
      "The current saved world, active selections, and derived outputs will be replaced.",
      "Use this only when you already have an export or backup you trust.",
    ],
    impact: {
      sourceLabel: normalizedSourceLabel,
    },
  };
}
