import { ROCKY_RECIPES } from "../../rockyPlanetStyles.js";
import { getGuidedAdapter, registerGuidedAdapter } from "../registry.js";

const ROCKY_GUIDED_ARCHETYPES = Object.freeze([
  {
    id: "earthlike-rocky-planet",
    objectType: "rockyPlanet",
    label: "Earthlike",
    shortLabel: "Earthlike",
    summary:
      "Temperate rocky world with exposed oceans, breathable air, and a stable climate target.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["temperate", "biosphere", "surface water"],
    recipeId: "blue-marble",
    recommendedScienceModes: { greenhouseMode: "core" },
    nextActions: ["Check climate state, water regime, and habitability after apply."],
  },
  {
    id: "tropical-jungle-planet",
    objectType: "rockyPlanet",
    label: "Tropical Jungle",
    shortLabel: "Jungle",
    summary: "Warm, wet terrestrial world with dense vegetation and humid air.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["warm", "wet", "biosphere"],
    recipeId: "tropical-jungle",
    recommendedScienceModes: { greenhouseMode: "core" },
    nextActions: ["Check humidity, greenhouse load, and habitability after apply."],
  },
  {
    id: "arid-steppe-planet",
    objectType: "rockyPlanet",
    label: "Arid Steppe",
    shortLabel: "Steppe",
    summary: "Semi-arid rocky world with sparse surface water and a thinner atmosphere.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["arid", "semi-dry", "marginal biosphere"],
    recipeId: "arid-steppe",
    recommendedScienceModes: { greenhouseMode: "core" },
    nextActions: ["Check water regime, climate stability, and surface pressure after apply."],
  },
  {
    id: "tidally-locked-planet",
    objectType: "rockyPlanet",
    label: "Tidally Locked",
    shortLabel: "Locked",
    summary: "Rocky world aimed at the permanent-day permanent-night climate split regime.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["tidal lock", "temperate edge", "synchronous"],
    recipeId: "tidally-locked",
    recommendedScienceModes: { greenhouseMode: "core" },
    nextActions: ["Check the tidal-lock state, climate state, and day-night balance after apply."],
  },
  {
    id: "marslike-desert-planet",
    objectType: "rockyPlanet",
    label: "Marslike Desert",
    shortLabel: "Marslike",
    summary: "Cold, dry, thin-atmosphere desert planet with little surface water.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["dry", "thin atmosphere", "cold"],
    recipeId: "red-desert",
    recommendedScienceModes: { greenhouseMode: "manual" },
    nextActions: ["Check atmosphere retention, climate state, and water regime after apply."],
  },
  {
    id: "airless-rocky-planet",
    objectType: "rockyPlanet",
    label: "Airless Rocky",
    shortLabel: "Airless",
    summary: "Bare cratered rocky body with negligible atmosphere and no stable surface water.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["airless", "cratered", "sterile"],
    recipeId: "cratered-husk",
    recommendedScienceModes: { greenhouseMode: "manual" },
    nextActions: ["Check escape velocity, pressure, and climate state after apply."],
  },
  {
    id: "venuslike-greenhouse-planet",
    objectType: "rockyPlanet",
    label: "Venuslike Greenhouse",
    shortLabel: "Greenhouse",
    summary: "Dense-atmosphere rocky world with runaway or near-runaway greenhouse conditions.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["greenhouse", "dense atmosphere", "extreme"],
    recipeId: "venus-shroud",
    recommendedScienceModes: { greenhouseMode: "manual" },
    nextActions: ["Check pressure, greenhouse load, and climate state after apply."],
  },
  {
    id: "lava-planet",
    objectType: "rockyPlanet",
    label: "Lava World",
    shortLabel: "Lava",
    summary: "Very hot rocky world with molten or near-molten surface conditions.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["lava", "extreme heat", "sterile"],
    recipeId: "lava-world",
    recommendedScienceModes: { greenhouseMode: "manual" },
    nextActions: ["Check orbit, climate state, and surface temperature after apply."],
  },
  {
    id: "snowball-planet",
    objectType: "rockyPlanet",
    label: "Snowball",
    shortLabel: "Snowball",
    summary: "Globally glaciated rocky planet with persistent surface ice.",
    confidenceClass: "defensible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["snowball", "ice-covered", "cold"],
    recipeId: "snowball",
    recommendedScienceModes: { greenhouseMode: "core" },
    nextActions: ["Check climate state, ice coverage, and water regime after apply."],
  },
  {
    id: "ocean-world-planet",
    objectType: "rockyPlanet",
    label: "Ocean World",
    shortLabel: "Ocean",
    summary: "Water-rich rocky world with deep oceans and limited exposed land.",
    confidenceClass: "plausible",
    quickEnabled: true,
    guidedEnabled: true,
    tags: ["ocean", "water-rich", "temperate edge"],
    recipeId: "water-world",
    recommendedScienceModes: { greenhouseMode: "core" },
    nextActions: ["Check water regime, climate state, and habitability after apply."],
  },
]);

const ORBIT_POLICY_OPTIONS = Object.freeze([
  {
    value: "keep-current",
    label: "Keep current orbit",
    description: "Preserves the current semi-major axis and uses the archetype as a local refit.",
  },
  {
    value: "fit-habitable-zone",
    label: "Fit habitable zone",
    description:
      "Moves temperate targets toward the current star's habitable-zone midpoint when available.",
  },
  {
    value: "use-archetype",
    label: "Use archetype orbit",
    description:
      "Uses the recipe orbit when the archetype depends on a specific insolation regime.",
  },
]);

const WATER_TARGET_OPTIONS = Object.freeze([
  { value: "dry", label: "Dry", description: "Pushes the world toward minimal surface water." },
  {
    value: "mixed",
    label: "Mixed land and sea",
    description: "Targets exposed land plus stable surface water.",
  },
  {
    value: "ocean",
    label: "Ocean-forward",
    description: "Pushes the world toward extensive or global oceans.",
  },
]);

const ATMOSPHERE_TARGET_OPTIONS = Object.freeze([
  {
    value: "thin",
    label: "Thin",
    description: "Favors low-pressure or marginally retained atmospheres.",
  },
  {
    value: "breathable",
    label: "Breathable",
    description: "Targets moderate pressure and Earth-like oxygen-bearing air.",
  },
  {
    value: "dense",
    label: "Dense",
    description: "Favors a heavier atmosphere without necessarily forcing a runaway greenhouse.",
  },
  {
    value: "greenhouse",
    label: "Greenhouse-heavy",
    description: "Targets stronger greenhouse loading and hotter surface conditions.",
  },
]);

const LIFE_GOAL_OPTIONS = Object.freeze([
  { value: "sterile", label: "Sterile", description: "Do not optimize for a surface biosphere." },
  {
    value: "simple-biosphere",
    label: "Simple biosphere",
    description: "Aim for a broadly habitable but not strongly Earthlike surface state.",
  },
  {
    value: "rich-biosphere",
    label: "Rich biosphere",
    description: "Push toward the strongest temperate surface-life target this model can support.",
  },
]);

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function includesAny(value, patterns = []) {
  const text = normalizeText(value);
  return patterns.some((pattern) => text.includes(pattern));
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(number, min), max);
}

function getRockyArchetype(archetypeId) {
  return ROCKY_GUIDED_ARCHETYPES.find((entry) => entry.id === String(archetypeId || "")) || null;
}

function getRockyRecipeCatalog(context = {}) {
  return Array.isArray(context?.recipeCatalog) ? context.recipeCatalog : ROCKY_RECIPES;
}

function getRecipeForArchetype(archetypeId, context = {}) {
  const archetype = getRockyArchetype(archetypeId);
  if (!archetype?.recipeId) return null;
  return getRockyRecipeCatalog(context).find((entry) => entry?.id === archetype.recipeId) || null;
}

export function buildRockyRecipeApplyInputs(
  recipeInputs = {},
  appearanceRecipeId = null,
  currentInputs = {},
) {
  const source = recipeInputs && typeof recipeInputs === "object" ? recipeInputs : {};
  const current = currentInputs && typeof currentInputs === "object" ? currentInputs : {};
  return {
    massEarth: source.massEarth ?? current.massEarth ?? 1,
    cmfPct: source.cmfPct ?? current.cmfPct ?? 33,
    wmfPct: source.wmfPct ?? current.wmfPct ?? 0,
    axialTiltDeg: source.axialTiltDeg ?? current.axialTiltDeg ?? 23.5,
    albedoBond: source.albedoBond ?? current.albedoBond ?? 0.3,
    greenhouseEffect: source.greenhouseEffect ?? current.greenhouseEffect ?? 1,
    greenhouseMode: source.greenhouseMode ?? current.greenhouseMode ?? "manual",
    observerHeightM: source.observerHeightM ?? current.observerHeightM ?? 2,
    rotationPeriodHours: source.rotationPeriodHours ?? current.rotationPeriodHours ?? 24,
    semiMajorAxisAu: source.semiMajorAxisAu ?? current.semiMajorAxisAu ?? 1,
    eccentricity: source.eccentricity ?? current.eccentricity ?? 0.0167,
    inclinationDeg: source.inclinationDeg ?? current.inclinationDeg ?? 0,
    longitudeOfPeriapsisDeg: source.longitudeOfPeriapsisDeg ?? current.longitudeOfPeriapsisDeg ?? 0,
    subsolarLongitudeDeg: source.subsolarLongitudeDeg ?? current.subsolarLongitudeDeg ?? 0,
    pressureAtm: source.pressureAtm ?? current.pressureAtm ?? 1,
    o2Pct: source.o2Pct ?? current.o2Pct ?? 0,
    co2Pct: source.co2Pct ?? current.co2Pct ?? 0,
    arPct: source.arPct ?? current.arPct ?? 0,
    h2oPct: source.h2oPct ?? current.h2oPct ?? 0,
    ch4Pct: source.ch4Pct ?? current.ch4Pct ?? 0,
    h2Pct: source.h2Pct ?? current.h2Pct ?? 0,
    hePct: source.hePct ?? current.hePct ?? 0,
    so2Pct: source.so2Pct ?? current.so2Pct ?? 0,
    nh3Pct: source.nh3Pct ?? current.nh3Pct ?? 0,
    atmosphericEscape: source.atmosphericEscape ?? current.atmosphericEscape ?? false,
    mantleOxidation: source.mantleOxidation ?? current.mantleOxidation ?? "earth",
    tectonicRegime: source.tectonicRegime ?? current.tectonicRegime ?? "auto",
    vegOverride: source.vegOverride ?? current.vegOverride ?? false,
    vegPaleHexOverride: source.vegPaleHexOverride ?? current.vegPaleHexOverride ?? "",
    vegDeepHexOverride: source.vegDeepHexOverride ?? current.vegDeepHexOverride ?? "",
    radioisotopeMode: source.radioisotopeMode ?? current.radioisotopeMode ?? "simple",
    radioisotopeAbundance: source.radioisotopeAbundance ?? current.radioisotopeAbundance ?? 1,
    u238Abundance: source.u238Abundance ?? current.u238Abundance ?? 1,
    u235Abundance: source.u235Abundance ?? current.u235Abundance ?? 1,
    th232Abundance: source.th232Abundance ?? current.th232Abundance ?? 1,
    k40Abundance: source.k40Abundance ?? current.k40Abundance ?? 1,
    ringMode: source.ringMode ?? current.ringMode ?? "auto",
    ringStyleId: source.ringStyleId ?? current.ringStyleId ?? "auto",
    appearanceRecipeId:
      appearanceRecipeId ?? source.appearanceRecipeId ?? current.appearanceRecipeId ?? null,
  };
}

function pushDiagnostic(list, severity, code, title, detail, suggestedActions = []) {
  list.push({ severity, code, title, detail, suggestedActions });
}

function getRockyGuidedDefaults(archetypeId) {
  switch (String(archetypeId || "")) {
    case "earthlike-rocky-planet":
      return {
        orbit_policy: "fit-habitable-zone",
        water_target: "mixed",
        atmosphere_target: "breathable",
        life_goal: "rich-biosphere",
      };
    case "tropical-jungle-planet":
      return {
        orbit_policy: "fit-habitable-zone",
        water_target: "mixed",
        atmosphere_target: "dense",
        life_goal: "rich-biosphere",
      };
    case "arid-steppe-planet":
      return {
        orbit_policy: "keep-current",
        water_target: "dry",
        atmosphere_target: "breathable",
        life_goal: "simple-biosphere",
      };
    case "tidally-locked-planet":
      return {
        orbit_policy: "fit-habitable-zone",
        water_target: "mixed",
        atmosphere_target: "breathable",
        life_goal: "simple-biosphere",
      };
    case "ocean-world-planet":
      return {
        orbit_policy: "fit-habitable-zone",
        water_target: "ocean",
        atmosphere_target: "breathable",
        life_goal: "simple-biosphere",
      };
    case "snowball-planet":
      return {
        orbit_policy: "use-archetype",
        water_target: "mixed",
        atmosphere_target: "thin",
        life_goal: "sterile",
      };
    case "venuslike-greenhouse-planet":
    case "lava-planet":
      return {
        orbit_policy: "use-archetype",
        water_target: "dry",
        atmosphere_target: "greenhouse",
        life_goal: "sterile",
      };
    case "marslike-desert-planet":
    case "airless-rocky-planet":
    default:
      return {
        orbit_policy: "keep-current",
        water_target: "dry",
        atmosphere_target: "thin",
        life_goal: "sterile",
      };
  }
}

function resolveRockyGuidedAnswers(archetype, flowState = {}) {
  return {
    ...getRockyGuidedDefaults(archetype?.id),
    ...(flowState?.answers || {}),
  };
}

function buildRockyQuestions(archetype, context = {}) {
  const defaults = getRockyGuidedDefaults(archetype.id);
  return [
    {
      id: "orbit_policy",
      stepId: "orbit-context",
      kind: "choice",
      label: "Orbit Fit",
      help:
        context.currentContextText ||
        "Decide whether to keep the current orbit or let guided mode refit it.",
      options: ORBIT_POLICY_OPTIONS,
      defaultValue: defaults.orbit_policy,
    },
    {
      id: "water_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Water Target",
      help: "How much exposed surface water should this world aim for?",
      options: WATER_TARGET_OPTIONS,
      defaultValue: defaults.water_target,
    },
    {
      id: "atmosphere_target",
      stepId: "goal-details",
      kind: "choice",
      label: "Atmosphere Target",
      help: "Choose the general pressure and greenhouse profile you want to aim for.",
      options: ATMOSPHERE_TARGET_OPTIONS,
      defaultValue: defaults.atmosphere_target,
    },
    {
      id: "life_goal",
      stepId: "goal-details",
      kind: "choice",
      label: "Life Goal",
      help: "Use this as a target strength, not a guarantee of biology.",
      options: LIFE_GOAL_OPTIONS,
      defaultValue: defaults.life_goal,
    },
  ];
}

function pickHabitableZoneOrbit(context = {}) {
  const inner = Number(context?.starHabitableZoneAu?.inner);
  const outer = Number(context?.starHabitableZoneAu?.outer);
  if (!Number.isFinite(inner) || !Number.isFinite(outer) || inner <= 0 || outer <= inner) {
    return null;
  }
  return (inner + outer) / 2;
}

function tuneRockyApplyInputs(archetype, recipe, answers, context = {}) {
  const nextInputs = buildRockyRecipeApplyInputs(
    {
      ...recipe.apply,
      ...archetype.recommendedScienceModes,
    },
    recipe.id,
    context.currentInputs,
  );

  if (answers.orbit_policy === "fit-habitable-zone") {
    const hzOrbit = pickHabitableZoneOrbit(context);
    if (hzOrbit != null) {
      nextInputs.semiMajorAxisAu = hzOrbit;
      nextInputs.eccentricity = clamp(nextInputs.eccentricity ?? 0.0167, 0, 0.1);
    }
  } else if (
    answers.orbit_policy === "use-archetype" &&
    Number.isFinite(Number(recipe?.apply?.semiMajorAxisAu))
  ) {
    nextInputs.semiMajorAxisAu = Number(recipe.apply.semiMajorAxisAu);
  }

  switch (answers.water_target) {
    case "dry":
      nextInputs.wmfPct = Math.min(Number(nextInputs.wmfPct) || 0, 0.001);
      nextInputs.h2oPct = Math.min(Number(nextInputs.h2oPct) || 0, 0.1);
      break;
    case "ocean":
      nextInputs.wmfPct = Math.max(Number(nextInputs.wmfPct) || 0, 1.5);
      nextInputs.h2oPct = Math.max(Number(nextInputs.h2oPct) || 0, 1);
      break;
    case "mixed":
    default:
      nextInputs.wmfPct = clamp(Number(nextInputs.wmfPct) || 0.05, 0.02, 0.7);
      nextInputs.h2oPct = Math.max(Number(nextInputs.h2oPct) || 0, 0.2);
      break;
  }

  switch (answers.atmosphere_target) {
    case "thin":
      nextInputs.pressureAtm = clamp(Number(nextInputs.pressureAtm) || 0.05, 0.001, 0.3);
      nextInputs.o2Pct = 0;
      nextInputs.greenhouseMode = archetype.id === "airless-rocky-planet" ? "manual" : "core";
      break;
    case "dense":
      nextInputs.pressureAtm = Math.max(Number(nextInputs.pressureAtm) || 1, 2.5);
      nextInputs.greenhouseMode =
        nextInputs.h2Pct > 0 || nextInputs.so2Pct > 0 || nextInputs.nh3Pct > 0 ? "full" : "core";
      break;
    case "greenhouse":
      nextInputs.pressureAtm = Math.max(Number(nextInputs.pressureAtm) || 1, 10);
      nextInputs.co2Pct = Math.max(Number(nextInputs.co2Pct) || 0, 15);
      nextInputs.greenhouseMode = "manual";
      nextInputs.greenhouseEffect = Math.max(Number(nextInputs.greenhouseEffect) || 0, 15);
      nextInputs.o2Pct = 0;
      break;
    case "breathable":
    default:
      nextInputs.pressureAtm = clamp(Number(nextInputs.pressureAtm) || 1, 0.7, 2.2);
      nextInputs.o2Pct = clamp(Number(nextInputs.o2Pct) || 21, 18, 24);
      nextInputs.co2Pct = clamp(Number(nextInputs.co2Pct) || 0.08, 0.01, 1);
      nextInputs.greenhouseMode = "core";
      break;
  }

  switch (answers.life_goal) {
    case "rich-biosphere":
      nextInputs.pressureAtm = Math.max(Number(nextInputs.pressureAtm) || 1, 0.8);
      nextInputs.o2Pct = Math.max(Number(nextInputs.o2Pct) || 0, 19);
      if (answers.water_target === "dry")
        nextInputs.wmfPct = Math.max(Number(nextInputs.wmfPct) || 0, 0.05);
      if (answers.atmosphere_target !== "greenhouse") nextInputs.greenhouseMode = "core";
      break;
    case "simple-biosphere":
      nextInputs.pressureAtm = Math.max(Number(nextInputs.pressureAtm) || 1, 0.4);
      if (answers.atmosphere_target === "thin")
        nextInputs.pressureAtm = Math.max(nextInputs.pressureAtm, 0.25);
      break;
    case "sterile":
    default:
      if (answers.atmosphere_target !== "breathable") nextInputs.o2Pct = 0;
      nextInputs.vegOverride = false;
      break;
  }

  return nextInputs;
}

function buildSummary(archetype, recipe, solved, answers = {}, uxMode = "quick") {
  const display = solved?.model?.display || {};
  const targets = [];
  if (answers.orbit_policy === "fit-habitable-zone") targets.push("habitable-zone orbit fit");
  else if (answers.orbit_policy === "use-archetype") targets.push("archetype orbit");
  else targets.push("current orbit");
  if (answers.water_target === "dry") targets.push("dry surface");
  else if (answers.water_target === "ocean") targets.push("ocean-forward water");
  else targets.push("mixed land and sea");
  if (answers.atmosphere_target === "greenhouse") targets.push("greenhouse-heavy air");
  else if (answers.atmosphere_target === "dense") targets.push("dense atmosphere");
  else if (answers.atmosphere_target === "thin") targets.push("thin atmosphere");
  else targets.push("breathable atmosphere");
  if (answers.life_goal === "rich-biosphere") targets.push("rich biosphere target");
  else if (answers.life_goal === "simple-biosphere") targets.push("simple biosphere target");
  else targets.push("sterile surface target");

  const currentResult = [
    display.waterRegime || "unknown water state",
    display.climateState || "unknown climate",
    display.tempK || "",
  ]
    .filter(Boolean)
    .join("; ");

  if (uxMode === "guided") {
    return `Uses ${recipe?.label || archetype.label} as a guided rocky-world starting point with ${targets.join(", ")}. Current result: ${currentResult}.`;
  }
  return `Applies ${recipe?.label || archetype.label} and re-solves it around the current star context. Current result: ${currentResult}.`;
}

function buildRationale(archetype, answers = {}, context = {}) {
  const rationale = [];
  if (context.currentContextText) rationale.push(context.currentContextText);
  if (answers.orbit_policy === "fit-habitable-zone") {
    rationale.push(
      "Orbit fitting can move temperate targets toward the current star's habitable zone.",
    );
  } else if (answers.orbit_policy === "use-archetype") {
    rationale.push(
      "The archetype orbit is kept when the preset depends on a specific insolation regime.",
    );
  } else {
    rationale.push(
      "The current orbit is preserved, so the solve stays close to the existing system setup.",
    );
  }
  if (answers.life_goal === "rich-biosphere") {
    rationale.push(
      "A rich biosphere target is treated as an upper-end plausibility goal, not a guaranteed outcome.",
    );
  }
  return rationale;
}

function buildRockyDiagnostics(
  archetype,
  recipe,
  solved,
  answers = {},
  flowState = {},
  context = {},
) {
  const diagnostics = [];
  const model = solved?.model || {};
  const display = model.display || {};
  const derived = model.derived || {};
  const inputs = model.inputs || {};

  pushDiagnostic(
    diagnostics,
    "info",
    "recipe-source",
    "Recipe-backed starting point",
    `This ${flowState?.uxMode === "guided" ? "guided flow" : "quick type"} maps to the ${recipe?.label || archetype.label} rocky-world preset.`,
    [],
  );

  if (
    answers.orbit_policy === "fit-habitable-zone" &&
    (answers.life_goal !== "sterile" || answers.water_target !== "dry") &&
    derived.inHabitableZone === false
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "outside-habitable-zone",
      "Result remains outside the habitable zone",
      "Even with habitable-zone fitting enabled, the current solve does not land inside the star's habitable zone.",
      ["Check the star context, current orbit, and greenhouse settings."],
    );
  }

  if (answers.water_target === "dry" && !includesAny(display.waterRegime, ["dry"])) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "water-target-mismatch",
      "Dry-world target is not reached",
      `The current solve still reports ${display.waterRegime || "surface water"} instead of a dry regime.`,
      ["Lower the water target further or pick a drier archetype."],
    );
  } else if (
    answers.water_target === "mixed" &&
    includesAny(display.waterRegime, ["dry", "global ocean", "deep ocean", "ice world"])
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "water-target-mismatch",
      "Mixed land-and-sea target is not reached",
      `The current solve lands in ${display.waterRegime || "an unexpected water regime"} rather than a balanced surface-water state.`,
      ["Adjust orbit, water inventory, or atmosphere target."],
    );
  } else if (
    answers.water_target === "ocean" &&
    !includesAny(display.waterRegime, ["ocean", "extensive", "global", "deep"])
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "water-target-mismatch",
      "Ocean target is not reached",
      `The current solve lands in ${display.waterRegime || "an unexpectedly dry regime"} instead of an ocean-forward state.`,
      ["Increase water inventory or improve climate support for surface liquid water."],
    );
  }

  const pressureAtm = Number(inputs.pressureAtm);
  const ppO2Atm = Number(derived.ppO2Atm);
  if (answers.atmosphere_target === "thin" && Number.isFinite(pressureAtm) && pressureAtm > 0.4) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "atmosphere-target-mismatch",
      "Thin-atmosphere target is not reached",
      `The current solve still retains about ${pressureAtm.toFixed(2)} atm.`,
      ["Use a thinner-atmosphere archetype or reduce volatile support."],
    );
  } else if (
    answers.atmosphere_target === "breathable" &&
    (!Number.isFinite(pressureAtm) ||
      pressureAtm < 0.5 ||
      pressureAtm > 5 ||
      !Number.isFinite(ppO2Atm) ||
      ppO2Atm < 0.12 ||
      ppO2Atm > 0.5)
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "atmosphere-target-mismatch",
      "Breathable-atmosphere target is not reached",
      "The current solve does not land in a comfortable pressure and oxygen window.",
      ["Adjust greenhouse mode, pressure, and orbit fit."],
    );
  } else if (
    answers.atmosphere_target === "dense" &&
    (!Number.isFinite(pressureAtm) || pressureAtm < 2)
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "atmosphere-target-mismatch",
      "Dense-atmosphere target is not reached",
      "The current solve does not build a clearly dense atmosphere.",
      ["Increase pressure or switch to a denser archetype."],
    );
  } else if (
    answers.atmosphere_target === "greenhouse" &&
    (!Number.isFinite(pressureAtm) ||
      pressureAtm < 5 ||
      (!includesAny(display.climateState, ["greenhouse", "runaway"]) &&
        Number(inputs.greenhouseEffect) < 10))
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "atmosphere-target-mismatch",
      "Greenhouse-heavy target is not reached",
      "The current solve does not sustain the stronger greenhouse outcome implied by this target.",
      ["Increase greenhouse loading or use the archetype orbit."],
    );
  }

  const habitabilityScore = Number(display.habitabilityIndex);
  if (
    answers.life_goal === "simple-biosphere" &&
    (!Number.isFinite(habitabilityScore) ||
      habitabilityScore < 0.3 ||
      includesAny(display.climateState, ["runaway", "snowball"]))
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "life-target-not-met",
      "Simple-biosphere target is not reached",
      "The current solve stays outside the looser surface-habitability range implied by the chosen life goal.",
      ["Adjust orbit fit, water target, or atmosphere target."],
    );
  } else if (
    answers.life_goal === "rich-biosphere" &&
    (!Number.isFinite(habitabilityScore) ||
      habitabilityScore < 0.6 ||
      !derived.inHabitableZone ||
      !includesAny(display.climateState, ["stable"]))
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "life-target-not-met",
      "Rich-biosphere target is not reached",
      "The current solve does not reach the stronger stable temperate conditions implied by a rich biosphere target.",
      ["Treat this as a starting point and refine climate, water, and atmosphere inputs."],
    );
  }

  if (
    archetype.id === "tidally-locked-planet" &&
    !includesAny(display.tidalLock, ["synchronous"])
  ) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "tidal-lock-target-not-met",
      "Tidal-lock target is not reached",
      "The current solve does not land in a clearly synchronous rocky-planet state.",
      ["Move the orbit inward or use a lower-mass star context."],
    );
  }

  const solveError = solved?.error;
  if (solveError) {
    pushDiagnostic(
      diagnostics,
      "warning",
      "solve-preview-failed",
      "Preview solve unavailable",
      solveError,
      ["Apply the starting point, then review the Planet page outputs directly."],
    );
  }

  return diagnostics;
}

function collectScienceModes(applyInputs = {}) {
  return { greenhouseMode: applyInputs.greenhouseMode || "manual" };
}

export const rockyPlanetGuidedAdapter = {
  objectType: "rockyPlanet",

  listArchetypes() {
    return ROCKY_GUIDED_ARCHETYPES.map((entry) => ({ ...entry }));
  },

  buildQuestions(flowState, context = {}) {
    const archetype = getRockyArchetype(flowState?.selectedArchetypeId);
    if (!archetype || flowState?.uxMode !== "guided") return [];
    return buildRockyQuestions(archetype, context);
  },

  solveRecommendation(flowState, context = {}) {
    const archetype = getRockyArchetype(flowState?.selectedArchetypeId);
    if (!archetype) return null;

    const recipe = getRecipeForArchetype(archetype.id, context);
    if (!recipe) return null;

    const answers = resolveRockyGuidedAnswers(archetype, flowState);
    const applyInputs =
      flowState?.uxMode === "guided"
        ? tuneRockyApplyInputs(archetype, recipe, answers, context)
        : buildRockyRecipeApplyInputs(
            {
              ...recipe.apply,
              ...archetype.recommendedScienceModes,
            },
            recipe.id,
            context.currentInputs,
          );

    let solved = null;
    if (typeof context.solvePlanetInputs === "function") {
      try {
        solved = context.solvePlanetInputs(applyInputs) || null;
      } catch (error) {
        solved = {
          error:
            error instanceof Error
              ? error.message
              : "Rocky quick-type solve failed for this context.",
        };
      }
    }

    return {
      objectType: "rockyPlanet",
      archetypeId: archetype.id,
      confidenceClass: archetype.confidenceClass,
      title: archetype.label,
      summary: buildSummary(archetype, recipe, solved, answers, flowState?.uxMode),
      scienceModeRecommendation: collectScienceModes(applyInputs),
      applyPayload: {
        objectInputs: applyInputs,
        parentPatch: null,
        siblingPatch: null,
      },
      previewPayload:
        solved?.model && typeof solved.model === "object"
          ? {
              bodyType: "rockyPlanet",
              name: context.currentPlanetName || recipe.label || archetype.label,
              recipeId: recipe.id,
              planetCalc: solved.model,
            }
          : null,
      diagnostics: buildRockyDiagnostics(archetype, recipe, solved, answers, flowState, context),
      rationale: buildRationale(archetype, answers, context),
      nextActions: [...(archetype.nextActions || [])],
    };
  },

  applyRecommendation(recommendation, storeContext = {}) {
    if (!recommendation?.applyPayload?.objectInputs) return null;
    if (typeof storeContext.applyRockyPlanetRecommendation === "function") {
      return storeContext.applyRockyPlanetRecommendation(recommendation);
    }
    if (typeof storeContext.applyPlanetInputs === "function") {
      return storeContext.applyPlanetInputs(
        recommendation.applyPayload.objectInputs,
        recommendation,
      );
    }
    return recommendation.applyPayload;
  },
};

export function registerRockyPlanetGuidedAdapter(options = {}) {
  return registerGuidedAdapter(rockyPlanetGuidedAdapter, options);
}

export function ensureRockyPlanetGuidedAdapterRegistered() {
  return getGuidedAdapter("rockyPlanet") || registerRockyPlanetGuidedAdapter();
}

export { ROCKY_GUIDED_ARCHETYPES, getRockyArchetype, getRecipeForArchetype };
