import { calcStar } from "../../engine/star.js";
import { calcPlanetaryBody } from "../../engine/planetaryBody.js";
import { computeStellarActivityModel } from "../../engine/stellarActivity.js";
import {
  gasGiantRingScienceFromCalc,
  normalizeRingMode,
  rockyRingScienceFromDerived,
  resolveRingMode,
  RING_MODE_AUTO,
  RING_MODE_FORCE_OFF,
  RING_MODE_FORCE_ON,
} from "../../engine/planetaryRings.js";
import { fmt } from "../../engine/utils.js";
import { normalizeGiantCompanionClass, regimeDisplayLabel } from "../../engine/substellarRegime.js";
import { computeGasGiantVisualProfile, suggestStyles } from "../gasGiantStyles.js";
import { computeRockyVisualProfile } from "../rockyPlanetStyles.js";
import {
  normalizeRingStyleId,
  resolveRingAppearance,
  RING_STYLE_AUTO,
} from "../ringAppearanceProfiles.js";
import { applySubtypeVisualHintsToRockyProfile } from "./subtypeVisualHints.js";
import { buildPlanetaryVisualControlManifest } from "../planetaryVisual/controlManifest.js";
import { resolvePlanetaryVisualDescriptor } from "../planetaryVisual/descriptor.js";
import {
  BROWN_DWARF_MASS_MAX_MJUP,
  BROWN_DWARF_MASS_MIN_MJUP,
  GAS_GIANT_RADIUS_MAX_RJ,
  GAS_GIANT_RADIUS_MIN_RJ,
  GAS_GIANT_RADIUS_STEP_RJ,
  GIANT_COMPANION_CLASS_BROWN_DWARF,
  GIANT_COMPANION_CLASS_GAS_GIANT,
  getProjectedPrimaryStar,
  getStarOverrides,
  listPlanetaryBodies,
  listMoons,
  listSystemGasGiants,
  planetFromGasGiantEntry,
  planetFromRockyEntry,
} from "../store.js";
import {
  buildPlanetHomeSystemContext,
  filterBodiesForHostFrame,
  normalizeHostFrameId,
  resolvePlanetPageHostFrameContext,
} from "./hostFrame.js";

const BROWN_DWARF_SOLAR_RADIUS_KM = 696340;

export function clampGasGiantRadiusRj(value) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return GAS_GIANT_RADIUS_MIN_RJ;
  const clamped = Math.max(GAS_GIANT_RADIUS_MIN_RJ, Math.min(GAS_GIANT_RADIUS_MAX_RJ, raw));
  const inv = 1 / GAS_GIANT_RADIUS_STEP_RJ;
  return Math.round(clamped * inv) / inv;
}

export function getGiantCompanionClass(value) {
  return normalizeGiantCompanionClass(
    value?.companionClass || value?.inputs?.companionClass || value?.regime,
  );
}

export function isBrownDwarfCompanion(value) {
  return getGiantCompanionClass(value) === GIANT_COMPANION_CLASS_BROWN_DWARF;
}

export function getGiantCompanionDisplayLabel(value) {
  return regimeDisplayLabel(getGiantCompanionClass(value));
}

function readFirstFiniteNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function isBrownDwarfHostModel(model) {
  return model?.regime === "brownDwarf";
}

export function getHostZoneLabel(model) {
  return String(model?.zoneLabel || "Habitable Zone");
}

export function getHostClassValue(model) {
  return model?.spectralClass || regimeDisplayLabel(model?.regime);
}

export function formatHostZoneValue(model) {
  return model?.display?.hzAu || "n/a";
}

export function getHostLifetimeValue(model) {
  if (!isBrownDwarfHostModel(model)) return fmt(model?.maxAgeGyr, 3);
  if (model?.deuteriumBurningActive) return "Deuterium-burning";
  return `${model?.spectralFamily || "Cooling"}-type cooling`;
}

export function getHostLifetimeMeta(model) {
  if (!isBrownDwarfHostModel(model)) return "Gyr";
  return model?.deuteriumBurningPossible ? "Substellar cooling track" : "Cooling object";
}

export function formatLuminosityLsol(value, dp = 3) {
  const x = Number(value);
  if (!Number.isFinite(x)) return "NA";
  const abs = Math.abs(x);
  if (abs === 0) return "0";
  if (abs < 1e-4) return x.toExponential(2);
  if (abs < 0.01) return fmt(x, Math.max(dp, 6));
  return fmt(x, dp);
}

export function formatScaledLuminosityLsol(value, dp = 3) {
  const x = Number(value);
  if (!Number.isFinite(x)) return "NA";
  const abs = Math.abs(x);
  if (abs === 0) return "0 Lsol";
  if (abs >= 0.01) return `${fmt(x, dp)} Lsol`;

  const scaledUnits = [
    { scale: 1e3, label: "mLsol" },
    { scale: 1e6, label: "\u03bcLsol" },
    { scale: 1e9, label: "nLsol" },
  ];
  for (const unit of scaledUnits) {
    const scaled = x * unit.scale;
    const scaledAbs = Math.abs(scaled);
    if (scaledAbs >= 0.1) {
      const scaledDp = scaledAbs >= 100 ? 0 : scaledAbs >= 10 ? 1 : 2;
      return `${fmt(scaled, scaledDp)} ${unit.label}`;
    }
  }
  return `${formatLuminosityLsol(x, Math.max(dp, 6))} Lsol`;
}

export function buildLuminosityKpiMeta(model) {
  if (!model) return "";
  const exactLsol = formatLuminosityLsol(model.luminosityLsol, 6);
  const watts = fmt(model.metric?.luminosityW, 0);
  return `${exactLsol} Lsol | ${watts} W${model.luminosityOverridden ? " (Override)" : ""}`;
}

export function buildLuminosityKpiTooltip(model, baseTooltip = "") {
  if (!model) return baseTooltip || "";
  return (
    `${baseTooltip || ""}\n\n` +
    `Current solve:\n` +
    `${formatScaledLuminosityLsol(model.luminosityLsol, 3)}\n` +
    `${formatLuminosityLsol(model.luminosityLsol, 6)} Lsol\n` +
    `${fmt(model.metric?.luminosityW, 0)} W${model.luminosityOverridden ? " (Override)" : ""}`
  ).trim();
}

export function formatRecurrence(ratePerDay) {
  const rate = Number(ratePerDay);
  if (!(rate > 0)) return "Rare";
  const days = 1 / rate;
  if (days >= 365) return `~${fmt(days / 365, 2)} years`;
  if (days >= 1) return `~${fmt(days, 2)} days`;
  const hours = days * 24;
  if (hours >= 1) return `~${fmt(hours, 2)} hours`;
  return `~${fmt(hours * 60, 2)} minutes`;
}

export function shortPopulationLabel(label) {
  const txt = String(label || "").trim();
  if (txt === "Population I (solar neighbourhood)") return "Pop I";
  if (txt === "Intermediate (old thin disk)") return "Intermediate";
  if (txt === "Population II (metal-poor)") return "Pop II";
  if (txt === "Metal-rich (inner disk)") return "Metal-rich";
  return txt;
}

export function buildGasGiantCalc(
  world,
  giant,
  sysModel,
  gasGiants = listSystemGasGiants(world),
  homeSystemContext = null,
) {
  const resolvedHomeSystemContext = homeSystemContext || buildPlanetHomeSystemContext(world);
  const primaryStar = getProjectedPrimaryStar(world);
  const solveContext = resolvePlanetPageHostFrameContext(
    world,
    giant,
    sysModel,
    resolvedHomeSystemContext,
  );
  const hostFrameId = normalizeHostFrameId(
    solveContext?.hostFrameId,
    resolvedHomeSystemContext?.defaultHostFrameId,
  );
  const hostSystem = solveContext?.hostFrame?.system || sysModel;
  const orbitAu = Number(giant.au) || hostSystem?.frostLineAu || sysModel.frostLineAu;
  const otherGiants = gasGiants
    .filter(
      (candidate) =>
        candidate.id !== giant.id &&
        normalizeHostFrameId(
          candidate?.hostFrameId,
          resolvedHomeSystemContext?.defaultHostFrameId,
        ) === hostFrameId,
    )
    .map((candidate) => ({ name: candidate.name, au: candidate.au }));
  const moons = listMoons(world)
    .filter((moon) => moon.planetId === giant.id)
    .map((moon) => moon.inputs);
  const unified = calcPlanetaryBody(
    planetFromGasGiantEntry({
      ...giant,
      au: orbitAu,
    }),
    {
      starMassMsol: Number(solveContext?.starConfig?.massMsol) || Number(primaryStar.massMsol) || 1,
      starLuminosityLsol:
        Number(solveContext?.starModel?.luminosityLsol) || sysModel.star.luminosityLsol,
      starAgeGyr: Number(solveContext?.starConfig?.ageGyr) || Number(primaryStar.ageGyr) || 4.6,
      starRadiusRsol: Number(solveContext?.starModel?.radiusRsol) || sysModel.star.radiusRsol,
      hostFrameId: solveContext?.hostFrameId || hostFrameId,
      hostFrame: solveContext?.hostFrame || null,
      hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
      hostWindPressureEarthAt1Au: solveContext?.hostWindPressureEarthAt1Au ?? null,
      companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
      companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
      companionWindPressureEarth: solveContext?.companionWindPressureEarth ?? 0,
      fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
      stellarMetallicityFeH:
        Number(solveContext?.starConfig?.metallicityFeH) || Number(primaryStar.metallicityFeH) || 0,
      otherGiants,
      moons,
    },
  );
  return unified.legacy.gasGiantModel;
}

function findAppearanceBody(world, selectorType, entry) {
  const id = String(entry?.id || "").trim();
  if (!id) return entry || null;
  return (
    listPlanetaryBodies(world).find(
      (body) =>
        body?.selector?.type === selectorType &&
        (String(body?.id || "") === id ||
          String(body?.selector?.value || "") === id ||
          String(body?.selector?.value || "").endsWith(`:${id}`)),
    ) ||
    entry ||
    null
  );
}

function visualAppearanceFrom(body, fallback) {
  if (body?.appearance && typeof body.appearance === "object") return body.appearance;
  if (fallback?.appearance && typeof fallback.appearance === "object") return fallback.appearance;
  return null;
}

function ringStateWithVisualDescriptor(ringState, descriptor) {
  if (typeof descriptor?.ringAppearance?.enabled !== "boolean") return ringState;
  return {
    ...(ringState || {}),
    effectiveEnabled: descriptor.ringAppearance.enabled,
  };
}

export function deriveGasGiantAppearanceState(
  world,
  giant,
  sysModel,
  gasGiants = listSystemGasGiants(world),
) {
  const gasCalc = buildGasGiantCalc(world, giant, sysModel, gasGiants);
  let derivedStyle = suggestStyles(gasCalc).primary;
  const science = gasGiantRingScienceFromCalc(gasCalc);
  let ringState = resolveRingMode({
    ringMode: giant?.ringMode,
    scienceEnabled: science.scienceEnabled,
    scienceReason: science.scienceReason,
  });
  let ringAppearance = resolveRingAppearance({
    bodyType: "gasGiant",
    ringState,
    ringStyleId: giant?.ringStyleId,
    gasCalc,
    bodyStyleId: derivedStyle,
    seed: giant?.id || giant?.name || derivedStyle,
  });
  let gasProfile = {
    ...computeGasGiantVisualProfile(gasCalc),
    styleId: derivedStyle,
  };
  const generatedStyle = derivedStyle;
  const generatedRingState = ringState;
  const appearanceBody = findAppearanceBody(world, "gasGiant", giant);
  const visualAppearance = visualAppearanceFrom(appearanceBody, giant);
  const manifest = buildPlanetaryVisualControlManifest({
    body: {
      ...(appearanceBody || giant || {}),
      renderFamily: "gas",
      ringAppearance,
    },
    classification: gasCalc?.classification || appearanceBody?.classification || null,
    renderFamily: "gas",
  });
  const visualDescriptor = resolvePlanetaryVisualDescriptor({
    body: appearanceBody || giant,
    solvedBody: gasCalc,
    visualMode: visualAppearance?.visualMode,
    visualOverrides: visualAppearance?.visualOverrides,
    renderFamily: "gas",
    renderModel: isBrownDwarfCompanion(gasCalc) ? "brownDwarfStar" : "gasGiant",
    gasProfile,
    ringAppearance,
    styleId: derivedStyle,
    manifest,
  });
  if (visualDescriptor.overrideSignature) {
    ringAppearance = visualDescriptor.ringAppearance;
    gasProfile = visualDescriptor.gasProfile || gasProfile;
    derivedStyle = visualDescriptor.styleId || derivedStyle;
    ringState = ringStateWithVisualDescriptor(ringState, visualDescriptor);
  }
  return {
    gasCalc,
    derivedStyle,
    generatedStyle,
    ringState,
    generatedRingState,
    ringAppearance,
    gasProfile,
    visualDescriptor,
    visualOverrideSignature: visualDescriptor.overrideSignature || "",
    visualOverrideCount: visualDescriptor.visualOverrideCount || 0,
    visualRenderSignature: visualDescriptor.renderSignature || "",
  };
}

export function buildBrownDwarfCompanionPresentation(world, giant, sysModel, gasCalc) {
  const homeSystemContext = buildPlanetHomeSystemContext(world);
  const solveContext = resolvePlanetPageHostFrameContext(world, giant, sysModel, homeSystemContext);
  const primaryStar = getProjectedPrimaryStar(world);
  const ageGyr = readFirstFiniteNumber(solveContext?.starConfig?.ageGyr, primaryStar?.ageGyr, 4.6);
  const metallicityFeH = readFirstFiniteNumber(
    solveContext?.starConfig?.metallicityFeH,
    primaryStar?.metallicityFeH,
    0,
  );
  const radiusKm = readFirstFiniteNumber(gasCalc?.physical?.radiusKm);
  const radiusRsolOverride =
    radiusKm && radiusKm > 0 ? radiusKm / BROWN_DWARF_SOLAR_RADIUS_KM : null;
  const model = calcStar({
    massMsol: readFirstFiniteNumber(gasCalc?.inputs?.massMsol, primaryStar?.massMsol, 0.02),
    ageGyr,
    metallicityFeH,
    radiusRsolOverride,
    evolutionMode: "zams",
  });
  const activityModel = computeStellarActivityModel(
    {
      massMsun: readFirstFiniteNumber(model?.inputs?.massMsol, gasCalc?.inputs?.massMsol, 0.02),
      ageGyr,
      teffK: model?.tempK,
      luminosityLsun: model?.luminosityLsol,
      rotationPeriodDays: model?.stellarEnvironment?.rotation?.periodDays,
      rossbyNumber: model?.stellarEnvironment?.rotation?.rossbyNumber,
    },
    { activityCycle: 0.5 },
  );
  return {
    model,
    solveContext,
    ageGyr,
    metallicityFeH,
    activity: activityModel.activity,
  };
}

export function buildGiantCompanionClassOptions(selectedClass) {
  const normalizedClass = normalizeGiantCompanionClass(selectedClass);
  return [
    {
      value: GIANT_COMPANION_CLASS_GAS_GIANT,
      label: "Gas giant",
      selected: normalizedClass === GIANT_COMPANION_CLASS_GAS_GIANT,
    },
    {
      value: GIANT_COMPANION_CLASS_BROWN_DWARF,
      label: "Brown dwarf",
      selected: normalizedClass === GIANT_COMPANION_CLASS_BROWN_DWARF,
    },
  ];
}

export function buildGiantCompanionFormDescriptors(giant) {
  const companionClass = getGiantCompanionClass(giant);
  const bodyLabel = getGiantCompanionDisplayLabel(giant);
  if (companionClass === GIANT_COMPANION_CLASS_BROWN_DWARF) {
    return {
      bodyLabel,
      defaultName: "Brown dwarf",
      companionClassHint:
        "Brown dwarfs stay in the same workflow, but switch to a cooling-track solver and brown-dwarf class outputs.",
      radiusHint: "Brown dwarfs usually stay near 0.8-1.1 Rj. Blank = cooling-track radius.",
      massHint: `Brown dwarfs span ${BROWN_DWARF_MASS_MIN_MJUP}-${BROWN_DWARF_MASS_MAX_MJUP} Mj. Switching into this class requires an explicit mass.`,
      metallicityHint:
        "Optional placeholder only. Brown dwarfs do not currently use the gas-giant metallicity solver.",
    };
  }
  return {
    bodyLabel,
    defaultName: "Gas giant",
    companionClassHint:
      "Gas giants and brown dwarfs share this editor. Change the class only when the object crosses into the brown-dwarf mass regime.",
    radiusHint: "1.00 Rj = Jupiter-size.",
    massHint: "Blank = derived from radius.",
    metallicityHint: "Blank = derived from mass.",
  };
}

export function buildGiantCompanionContextClassText(model) {
  if (isBrownDwarfCompanion(model)) {
    return `${model?.classification?.substellarClass || "Brown dwarf"} ${model?.classification?.label || "brown dwarf"}`.trim();
  }
  return model?.classification?.sudarsky
    ? `Class ${model.classification.sudarsky} ${model.classification.label || ""}`.trim()
    : model?.display?.classification || "unknown class";
}

export function getGasGiantRingModeLabel(ringMode) {
  switch (normalizeRingMode(ringMode)) {
    case RING_MODE_FORCE_ON:
      return "Force on";
    case RING_MODE_FORCE_OFF:
      return "Force off";
    case RING_MODE_AUTO:
    default:
      return "Auto";
  }
}

export function formatGasGiantRingHint(ringState) {
  const visibility = ringState.effectiveEnabled ? "Visible" : "Hidden";
  if (!ringState.overrideActive) {
    return `Auto: ${visibility}. ${ringState.scienceReason}`;
  }
  const overrideNote = ringState.againstScience
    ? "Manual override goes against the science."
    : "Manual override matches the science.";
  return `${getGasGiantRingModeLabel(ringState.ringMode)}: ${visibility}. ${overrideNote} ${ringState.scienceReason}`;
}

export function buildGasGiantRingDisplay(ringState, gasCalc) {
  const value = ringState.overrideActive
    ? `${ringState.effectiveEnabled ? "Visible" : "Hidden"} by override`
    : ringState.effectiveEnabled
      ? "Visible"
      : "Hidden";
  const metaParts = [];
  const ringType = String(gasCalc?.display?.ringType || "").trim();
  const ringDetails = String(gasCalc?.display?.ringDetails || "").trim();
  if (ringType && ringType.toLowerCase() !== "none") metaParts.push(ringType);
  if (ringDetails && ringDetails.toLowerCase() !== "none") metaParts.push(ringDetails);
  metaParts.push(ringState.scienceReason);
  if (ringState.overrideActive) {
    metaParts.push(
      ringState.againstScience
        ? "Manual override goes against the science."
        : "Manual override matches the science.",
    );
  }
  return {
    value,
    meta: metaParts.filter(Boolean).join(" - "),
  };
}

export function getRingStyleSourceLabel(styleSource) {
  return styleSource === "manual" ? "Manual" : "Auto";
}

export function buildRingStyleDisplay(ringAppearance) {
  return {
    value: ringAppearance?.label || "Auto (recommended)",
    meta: getRingStyleSourceLabel(ringAppearance?.styleSource),
  };
}

export function formatRingStyleHint(ringAppearance, ringState) {
  const label = ringAppearance?.label || "Auto (recommended)";
  const sourceLabel = getRingStyleSourceLabel(ringAppearance?.styleSource).toLowerCase();
  if (normalizeRingMode(ringState?.ringMode) === RING_MODE_FORCE_ON) {
    return ringAppearance?.styleSource === "manual"
      ? `Explicit ring styles are visual overrides. Current style: ${label}.`
      : `Auto uses the recommended ring family for this body. Current recommendation: ${label}.`;
  }
  if (normalizeRingMode(ringState?.ringMode) === RING_MODE_FORCE_OFF) {
    return `Rings are hidden. Stored ${sourceLabel} style: ${label}. Explicit ring styles are visual overrides.`;
  }
  return `Auto uses the recommended ring family for this body. Current recommendation: ${label}. Explicit ring styles are visual overrides.`;
}

export function syncRingStyleControl(selectEl, ringState, ringAppearance) {
  if (!selectEl) return;
  const normalizedMode = normalizeRingMode(ringState?.ringMode);
  selectEl.disabled = normalizedMode !== RING_MODE_FORCE_ON;
  if (normalizedMode === RING_MODE_AUTO) {
    selectEl.value = RING_STYLE_AUTO;
    return;
  }
  selectEl.value = normalizeRingStyleId(ringAppearance?.ringStyleId);
}

export function buildRockyPlanetModel(world, planet, options = {}) {
  const resolvedHomeSystemContext =
    options.homeSystemContext || buildPlanetHomeSystemContext(world);
  const primaryStar = getProjectedPrimaryStar(world);
  const primaryStarOverrides = getStarOverrides(primaryStar);
  const solveContext = resolvePlanetPageHostFrameContext(
    world,
    planet,
    options.sysModel || null,
    resolvedHomeSystemContext,
  );
  const hostFrameId = normalizeHostFrameId(
    solveContext?.hostFrameId,
    resolvedHomeSystemContext?.defaultHostFrameId,
  );
  const assignedMoons = listMoons(world)
    .filter((moon) => moon.planetId === planet.id)
    .map((moon) => ({
      id: moon.id,
      ...(moon.inputs || {}),
    }));
  const sysGiants = filterBodiesForHostFrame(
    listSystemGasGiants(world),
    hostFrameId,
    resolvedHomeSystemContext?.defaultHostFrameId,
  ).map((gasGiant) => ({
    name: gasGiant.name,
    au: gasGiant.au,
  }));
  const unified = calcPlanetaryBody(planetFromRockyEntry(planet), {
    starMassMsol: Number(solveContext?.starConfig?.massMsol) || Number(primaryStar.massMsol),
    starAgeGyr: Number(solveContext?.starConfig?.ageGyr) || Number(primaryStar.ageGyr),
    starMetallicityFeH:
      Number(solveContext?.starConfig?.metallicityFeH) || Number(primaryStar.metallicityFeH) || 0,
    starRadiusRsolOverride:
      solveContext?.starConfig?.radiusRsolOverride !== undefined
        ? solveContext?.starConfig?.radiusRsolOverride
        : primaryStarOverrides.r,
    starLuminosityLsolOverride:
      solveContext?.starConfig?.luminosityLsolOverride !== undefined
        ? solveContext?.starConfig?.luminosityLsolOverride
        : primaryStarOverrides.l,
    starTempKOverride:
      solveContext?.starConfig?.tempKOverride !== undefined
        ? solveContext?.starConfig?.tempKOverride
        : primaryStarOverrides.t,
    starEvolutionMode: solveContext?.starConfig?.evolutionMode || primaryStarOverrides.ev,
    hostFrameId: solveContext?.hostFrameId || hostFrameId,
    hostFrame: solveContext?.hostFrame || null,
    hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
    hostWindPressureEarthAt1Au: solveContext?.hostWindPressureEarthAt1Au ?? null,
    companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
    companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
    companionWindPressureEarth: solveContext?.companionWindPressureEarth ?? 0,
    fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
    moons: assignedMoons,
    gasGiants: sysGiants,
  });
  const rockyModel = unified.legacy.rockyModel;
  if (rockyModel && typeof rockyModel === "object") {
    Object.defineProperty(rockyModel, "unifiedModel", {
      value: unified,
      configurable: true,
    });
  }
  return rockyModel;
}

export function deriveRockyPlanetAppearanceState(world, planet) {
  const model = buildRockyPlanetModel(world, planet);
  const ringScience = rockyRingScienceFromDerived(model?.derived);
  let ringState = resolveRingMode({
    ringMode: planet?.inputs?.ringMode,
    scienceEnabled: ringScience.scienceEnabled,
    scienceReason: ringScience.scienceReason,
  });
  let visualProfile = applySubtypeVisualHintsToRockyProfile(
    computeRockyVisualProfile(model?.derived || {}, planet?.inputs || {}),
    model?.unifiedModel,
  );
  let ringAppearance = resolveRingAppearance({
    bodyType: "rocky",
    ringState,
    ringStyleId: planet?.inputs?.ringStyleId,
    derived: model?.derived,
    seed: planet?.id || planet?.name || model?.inputs?.name || "rocky-ring",
  });
  const appearanceBody = findAppearanceBody(world, "planet", planet);
  const visualAppearance = visualAppearanceFrom(appearanceBody, planet);
  const manifest = buildPlanetaryVisualControlManifest({
    body: {
      ...(appearanceBody || planet || {}),
      renderFamily: "rocky",
      ringAppearance,
    },
    classification: model?.unifiedModel?.classification || appearanceBody?.classification || null,
    renderFamily: "rocky",
  });
  const visualDescriptor = resolvePlanetaryVisualDescriptor({
    body: appearanceBody || planet,
    solvedBody: model?.unifiedModel,
    visualMode: visualAppearance?.visualMode,
    visualOverrides: visualAppearance?.visualOverrides,
    renderFamily: "rocky",
    renderModel: "",
    visualProfile,
    ringAppearance,
    baseRecipeId: visualProfile?.recipeId || String(planet?.inputs?.appearanceRecipeId || ""),
    manifest,
  });
  if (visualDescriptor.overrideSignature) {
    visualProfile = visualDescriptor.visualProfile || visualProfile;
    ringAppearance = visualDescriptor.ringAppearance || ringAppearance;
    ringState = ringStateWithVisualDescriptor(ringState, visualDescriptor);
  }
  return {
    model,
    visualProfile,
    ringState,
    ringAppearance,
    visualDescriptor,
    visualOverrideSignature: visualDescriptor.overrideSignature || "",
    visualOverrideCount: visualDescriptor.visualOverrideCount || 0,
    visualRenderSignature: visualDescriptor.renderSignature || "",
  };
}

export function formatRockyRingHint(ringState) {
  const visibility = ringState.effectiveEnabled ? "Visible" : "Hidden";
  if (!ringState.overrideActive) {
    return `Auto: ${visibility}. ${ringState.scienceReason}`;
  }
  const overrideNote = ringState.againstScience
    ? "Manual override goes against the science."
    : "Manual override matches the science.";
  return `${getGasGiantRingModeLabel(ringState.ringMode)}: ${visibility}. ${overrideNote} ${ringState.scienceReason}`;
}

export function buildRockyRingDisplay(ringState, derived) {
  const value = ringState.overrideActive
    ? `${ringState.effectiveEnabled ? "Visible" : "Hidden"} by override`
    : ringState.effectiveEnabled
      ? "Visible"
      : "Hidden";
  const metaParts = [];
  if (Number.isFinite(Number(derived?.rocheLimitKm)) && Number(derived.rocheLimitKm) > 0) {
    metaParts.push(`Roche limit ${fmt(derived.rocheLimitKm, 0)} km`);
  }
  if (derived?.ringSourceMoonId) metaParts.push(`Source moon ${derived.ringSourceMoonId}`);
  metaParts.push(ringState.scienceReason);
  if (ringState.overrideActive) {
    metaParts.push(
      ringState.againstScience
        ? "Manual override goes against the science."
        : "Manual override matches the science.",
    );
  }
  return {
    value,
    meta: metaParts.filter(Boolean).join(" - "),
  };
}
