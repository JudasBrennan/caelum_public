import { buildChthonianOverlay } from "./planetarySubtypes/chthonian.js";
import { buildIcyDwarfOverlay } from "./planetarySubtypes/icyDwarf.js";
import { buildLavaWorldOverlay } from "./planetarySubtypes/lavaWorld.js";
import { buildOceanWorldOverlay } from "./planetarySubtypes/oceanWorld.js";
import { buildRoguePlanetOverlay } from "./planetarySubtypes/roguePlanet.js";

export const PLANETARY_SUBTYPES = Object.freeze({
  OCEAN_WORLD: "oceanWorld",
  WATER_WORLD: "waterWorld",
  ICY_DWARF: "icyDwarf",
  LAVA_WORLD: "lavaWorld",
  IRON_RICH: "ironRich",
  CARBON_RICH: "carbonRich",
  DESERT_WORLD: "desertWorld",
  STEAM_WORLD: "steamWorld",
  HYCEAN_CANDIDATE: "hyceanCandidate",
  SUPER_PUFF: "superPuff",
  CHTHONIAN_CANDIDATE: "chthonianCandidate",
  ROGUE_PLANET: "roguePlanet",
});

export const PLANETARY_SUBTYPE_LABELS = Object.freeze({
  oceanWorld: "Ocean world",
  waterWorld: "Water world",
  icyDwarf: "Icy dwarf",
  lavaWorld: "Lava world",
  ironRich: "Iron-rich world",
  carbonRich: "Carbon-rich world",
  desertWorld: "Desert world",
  steamWorld: "Steam world",
  hyceanCandidate: "Hycean candidate",
  superPuff: "Super-puff",
  chthonianCandidate: "Chthonian candidate",
  roguePlanet: "Rogue planet",
});

export const PLANETARY_SCALES = Object.freeze({
  DWARF: "dwarf",
  TERRESTRIAL: "terrestrial",
  SUPER_EARTH: "superEarth",
  NEPTUNE: "neptune",
  JUPITER: "jupiter",
});

export const PLANETARY_BOUNDARY_TRAITS = Object.freeze({
  RADIUS_VALLEY: "radiusValley",
  VOLATILE_CANDIDATE: "volatileCandidate",
});

const MODEL_VERSION = "planetary-subtypes-v1";
const EARTH_DENSITY_GCM3 = 5.51;
const HYCEAN_CANDIDATE_MAX_MASS_EARTH = 10;
const HYCEAN_CANDIDATE_MAX_RADIUS_EARTH = 2.6;
const ROCKY_LIKE_FAMILIES = new Set(["dwarfRocky", "rocky", "superEarth", "radiusValley"]);
const SURFACE_ROCKY_FAMILIES = new Set(["rocky", "superEarth", "radiusValley"]);
const WATER_WORLD_FAMILIES = new Set(["rocky", "superEarth", "radiusValley", "volatileCandidate"]);
const VOLATILE_LIKE_FAMILIES = new Set(["miniNeptune", "volatileCandidate"]);
const SUPER_PUFF_FAMILIES = new Set(["miniNeptune", "volatileCandidate", "gasGiant"]);
const PLANET_FAMILIES = new Set([
  "dwarfRocky",
  "rocky",
  "superEarth",
  "radiusValley",
  "volatileCandidate",
  "miniNeptune",
  "iceGiant",
  "gasGiant",
]);
const RADIUS_VALLEY_CONTEXT_FAMILIES = new Set([
  "superEarth",
  "radiusValley",
  "volatileCandidate",
  "miniNeptune",
]);

const PRIMARY_SUBTYPE_PRIORITY = Object.freeze({
  roguePlanet: 100,
  chthonianCandidate: 92,
  lavaWorld: 88,
  steamWorld: 84,
  superPuff: 80,
  hyceanCandidate: 76,
  waterWorld: 68,
  oceanWorld: 64,
  icyDwarf: 60,
  ironRich: 52,
  carbonRich: 48,
  desertWorld: 40,
});

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const number = finiteOrNull(value);
    if (number != null) return number;
  }
  return null;
}

function firstString(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value, key) {
  return isObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function reason(code, label, detail = "", severity = "info") {
  return { code, label, detail, severity };
}

function compactObject(source) {
  const out = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

function massRadiusDensityGcm3(massEarth, radiusEarth) {
  if (massEarth == null || radiusEarth == null || massEarth <= 0 || radiusEarth <= 0) return null;
  return EARTH_DENSITY_GCM3 * (massEarth / radiusEarth ** 3);
}

function truthyEvidence(value) {
  if (value === true) return true;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "yes", "y", "1", "high", "rich", "carbonrich", "stripped"].includes(
      normalized.replace(/[\s_-]/g, ""),
    );
  }
  return false;
}

function carbonEvidence(value) {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0.6;
  if (typeof value !== "string") return false;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  return ["carbonrich", "rich", "high", "enhanced", "c/o>1", "co>1"].includes(normalized);
}

function hostFrameValue(body, context) {
  if (hasOwn(context, "hostFrameId")) return context.hostFrameId;
  if (isObject(context?.hostFrame) && context.hostFrame.id != null) return context.hostFrame.id;
  if (hasOwn(body, "hostFrameId")) return body.hostFrameId;
  if (hasOwn(body?.orbit, "hostFrameId")) return body.orbit.hostFrameId;
  return undefined;
}

function solvedDerived(solvedModel) {
  return isObject(solvedModel?.derived) ? solvedModel.derived : {};
}

function solvedPhysical(solvedModel) {
  return isObject(solvedModel?.physical) ? solvedModel.physical : {};
}

function solvedThermal(solvedModel) {
  return isObject(solvedModel?.thermal) ? solvedModel.thermal : {};
}

function solvedInputs(solvedModel) {
  return isObject(solvedModel?.inputs) ? solvedModel.inputs : {};
}

function solvedAtmosphere(solvedModel) {
  return isObject(solvedModel?.atmosphere) ? solvedModel.atmosphere : {};
}

function solvedHabitability(solvedModel) {
  return isObject(solvedModel?.habitability) ? solvedModel.habitability : {};
}

function solvedHydrosphere(solvedModel) {
  const habitability = solvedHabitability(solvedModel);
  const derived = solvedDerived(solvedModel);
  return isObject(habitability.hydrosphere)
    ? habitability.hydrosphere
    : isObject(derived.hydrosphere)
      ? derived.hydrosphere
      : null;
}

function solvedEnvelope(solvedModel) {
  return isObject(solvedModel?.envelope) ? solvedModel.envelope : null;
}

function inferDurableFamily(family) {
  switch (family) {
    case "brownDwarf":
      return "substellar";
    case "gasGiant":
    case "iceGiant":
      return "giant";
    case "miniNeptune":
    case "volatileCandidate":
      return "volatile";
    default:
      return "rocky";
  }
}

function inferScale(family, inputs) {
  if (family === "dwarfRocky" || (inputs.massEarth != null && inputs.massEarth < 0.01)) {
    return PLANETARY_SCALES.DWARF;
  }
  if (family === "gasGiant" || family === "brownDwarf") return PLANETARY_SCALES.JUPITER;
  if (family === "iceGiant" || family === "miniNeptune" || family === "volatileCandidate") {
    return PLANETARY_SCALES.NEPTUNE;
  }
  if (family === "superEarth" || (inputs.massEarth != null && inputs.massEarth >= 2)) {
    return PLANETARY_SCALES.SUPER_EARTH;
  }
  return PLANETARY_SCALES.TERRESTRIAL;
}

function boundaryTraitsForFamily(family) {
  const traits = [];
  if (family === "radiusValley") traits.push(PLANETARY_BOUNDARY_TRAITS.RADIUS_VALLEY);
  if (family === "volatileCandidate") traits.push(PLANETARY_BOUNDARY_TRAITS.VOLATILE_CANDIDATE);
  return traits;
}

function radiusValleyBoundaryContext(inputs, family) {
  if (!RADIUS_VALLEY_CONTEXT_FAMILIES.has(family)) return null;
  const radius = finiteOrNull(inputs.radiusEarth);
  const period = finiteOrNull(inputs.orbitalPeriodDays);
  const insolation = finiteOrNull(inputs.insolationEarth);
  const semiMajorAxis = finiteOrNull(inputs.semiMajorAxisAu);
  const assumptions = [
    "Radius-valley interpretation is population-level and does not determine one planet's origin.",
  ];
  const limitingFactors = [];
  if (radius == null) limitingFactors.push("planet radius is missing");
  if (period == null && insolation == null && semiMajorAxis == null) {
    limitingFactors.push("orbital period, irradiation, and semi-major axis are missing");
  }
  const closeInByPeriod = period != null && period <= 100;
  const highIrradiation = insolation != null && insolation >= 10;
  const closeInByOrbit = semiMajorAxis != null && semiMajorAxis <= 0.5;
  const boundarySized = radius != null && radius >= 1.3 && radius <= 2.6;
  const envelopeLossRelevant =
    boundarySized && (closeInByPeriod || highIrradiation || closeInByOrbit);
  const weaklyConstrained =
    boundarySized &&
    period != null &&
    period > 100 &&
    (insolation == null || insolation < 10) &&
    !closeInByOrbit;
  const regimeClass = limitingFactors.length
    ? "unknown"
    : envelopeLossRelevant
      ? "close-in-boundary-relevant"
      : weaklyConstrained
        ? "long-period-weakly-constrained"
        : boundarySized
          ? "boundary-sized-low-irradiation"
          : "outside-boundary-size";

  return compactObject({
    modelVersion: "radius-valley-boundary-context-v1",
    status: limitingFactors.length ? "unknown" : "supported",
    confidence: period != null && insolation != null ? "medium" : "low",
    inputs: compactObject({
      radiusEarth: radius,
      orbitalPeriodDays: period,
      insolationEarth: insolation,
      semiMajorAxisAu: semiMajorAxis,
      family,
    }),
    outputs: {
      regimeClass,
      boundarySized,
      closeInByPeriod,
      highIrradiation,
      envelopeLossRelevant,
      interpretation:
        regimeClass === "close-in-boundary-relevant"
          ? "Period/irradiation context makes radius-valley envelope-loss interpretation relevant."
          : regimeClass === "long-period-weakly-constrained"
            ? "Long-period, lower-irradiation context weakens radius-valley envelope-loss interpretation."
            : regimeClass === "boundary-sized-low-irradiation"
              ? "Radius is boundary-sized, but close-in irradiation evidence is not strong."
              : regimeClass === "outside-boundary-size"
                ? "Radius is outside the small-planet boundary range used by this diagnostic."
                : "Missing inputs prevent a bounded radius-valley interpretation.",
    },
    assumptions,
    limitingFactors,
    sourceKeys: ["radiusValleyBoundary"],
  });
}

function makeSubtype({
  id,
  confidence,
  applicability,
  solverOverlay,
  reasons,
  warnings = [],
  physical,
  science,
  visualHints,
  pageGuidance,
}) {
  return compactObject({
    id,
    label: PLANETARY_SUBTYPE_LABELS[id],
    confidence,
    applicability,
    solverOverlay,
    reasonCodes: reasons.map((entry) => entry.code),
    reasons,
    warningCodes: warnings.map((entry) => entry.code),
    warnings,
    physical: compactObject(physical || {}),
    science,
    visualHints,
    pageGuidance,
  });
}

function isRockyLike(inputs) {
  return ROCKY_LIKE_FAMILIES.has(inputs.family);
}

function isSurfaceRocky(inputs) {
  return SURFACE_ROCKY_FAMILIES.has(inputs.family);
}

function pressureAllowsSurfaceWater(inputs) {
  if (inputs.pressureAtm == null) return true;
  return inputs.pressureAtm >= 0.006 && inputs.pressureAtm <= 100;
}

function hasAccessibleLiquid(inputs) {
  if (inputs.surfaceAccessibleLiquidFraction != null) {
    return inputs.surfaceAccessibleLiquidFraction > 0.02;
  }
  if (inputs.liquidOceanFraction != null) return inputs.liquidOceanFraction > 0.05;
  if (inputs.liquidWaterPossible === true) return true;
  if (inputs.surfaceTempK != null) {
    return (
      inputs.surfaceTempK >= 273 &&
      inputs.surfaceTempK <= 340 &&
      pressureAllowsSurfaceWater(inputs) &&
      inputs.climateState !== "Runaway greenhouse"
    );
  }
  if (inputs.insolationEarth != null) {
    return inputs.insolationEarth >= 0.35 && inputs.insolationEarth <= 1.8;
  }
  return false;
}

function highWaterWorldSignal(inputs) {
  if (inputs.wmfPct == null || inputs.wmfPct < 10) return false;
  if (inputs.wmfPct >= 20) return true;
  if (inputs.landFraction != null && inputs.landFraction <= 0.05) return true;
  return ["Deep ocean", "Ice world"].includes(inputs.waterRegime);
}

function highIrradiationSignal(inputs) {
  const explicitThermalEvidence =
    inputs.surfaceTempK != null ||
    inputs.equilibriumTempK != null ||
    inputs.insolationEarth != null;
  const thermalHigh =
    (inputs.surfaceTempK != null && inputs.surfaceTempK >= 1100) ||
    (inputs.equilibriumTempK != null && inputs.equilibriumTempK >= 1000) ||
    (inputs.insolationEarth != null && inputs.insolationEarth >= 400);
  if (thermalHigh || explicitThermalEvidence) return thermalHigh;
  return (
    inputs.semiMajorAxisAu != null && inputs.semiMajorAxisAu > 0 && inputs.semiMajorAxisAu <= 0.05
  );
}

function warmDrySignal(inputs) {
  return (
    (inputs.surfaceTempK != null && inputs.surfaceTempK >= 295) ||
    (inputs.equilibriumTempK != null && inputs.equilibriumTempK >= 285) ||
    (inputs.insolationEarth != null && inputs.insolationEarth >= 1.35)
  );
}

function coldDwarfSignal(inputs) {
  return (
    (inputs.surfaceTempK != null && inputs.surfaceTempK <= 240) ||
    (inputs.equilibriumTempK != null && inputs.equilibriumTempK <= 180) ||
    (inputs.insolationEarth != null && inputs.insolationEarth <= 0.1) ||
    (inputs.semiMajorAxisAu != null && inputs.semiMajorAxisAu >= 5)
  );
}

function steamSignal(inputs) {
  return (
    inputs.climateState === "Runaway greenhouse" ||
    inputs.climateState === "Moist greenhouse" ||
    (inputs.steamFraction != null && inputs.steamFraction >= 0.25) ||
    (inputs.surfaceTempK != null && inputs.surfaceTempK >= 340 && (inputs.pressureAtm ?? 0) >= 1) ||
    (inputs.insolationEarth != null &&
      inputs.insolationEarth >= 5 &&
      (inputs.pressureAtm ?? 0) >= 1)
  );
}

function temperateVolatileSignal(inputs) {
  if (inputs.equilibriumTempK != null)
    return inputs.equilibriumTempK >= 240 && inputs.equilibriumTempK <= 400;
  if (inputs.surfaceTempK != null) return inputs.surfaceTempK >= 240 && inputs.surfaceTempK <= 420;
  if (inputs.insolationEarth != null)
    return inputs.insolationEarth >= 0.2 && inputs.insolationEarth <= 2.5;
  return true;
}

function hyceanBulkSignal(inputs) {
  if (inputs.massEarth != null && inputs.massEarth > HYCEAN_CANDIDATE_MAX_MASS_EARTH) {
    return false;
  }
  if (inputs.radiusEarth != null && inputs.radiusEarth > HYCEAN_CANDIDATE_MAX_RADIUS_EARTH) {
    return false;
  }
  return true;
}

function denseRemnantSignal(inputs) {
  return (
    (inputs.cmfPct != null && inputs.cmfPct >= 55) ||
    (inputs.densityGcm3 != null && inputs.densityGcm3 >= 6.5)
  );
}

function explicitCarbonRich(inputs) {
  return (
    carbonEvidence(inputs.carbonRichness) ||
    carbonEvidence(inputs.carbonRichnessEvidence) ||
    carbonEvidence(inputs.compositionClassOverride) ||
    carbonEvidence(inputs.appearanceRecipeId)
  );
}

function explicitStrippedEnvelope(inputs) {
  return (
    truthyEvidence(inputs.strippedEnvelopeCandidate) ||
    truthyEvidence(inputs.migratedCloseIn) ||
    truthyEvidence(inputs.remnantCandidate)
  );
}

function explicitRogue(inputs) {
  return truthyEvidence(inputs.rogueCandidate) || truthyEvidence(inputs.contextRogueCandidate);
}

function hostlessRogueSignal(inputs) {
  const hostAbsent = inputs.hostFrameId === null || inputs.hostFrameId === "";
  const orbitAbsent = inputs.semiMajorAxisAu == null || inputs.semiMajorAxisAu <= 0;
  const fluxAbsent =
    (inputs.insolationEarth == null || inputs.insolationEarth <= 0) &&
    (inputs.irradiationEarth == null || inputs.irradiationEarth <= 0);
  return hostAbsent && orbitAbsent && fluxAbsent;
}

export function getPlanetarySubtypeInputs(
  body = {},
  classification = {},
  solvedModel = {},
  context = {},
) {
  const derived = solvedDerived(solvedModel);
  const physical = solvedPhysical(solvedModel);
  const thermal = solvedThermal(solvedModel);
  const inputs = solvedInputs(solvedModel);
  const atmosphere = solvedAtmosphere(solvedModel);
  const habitability = solvedHabitability(solvedModel);
  const hydrosphere = solvedHydrosphere(solvedModel);
  const envelope = solvedEnvelope(solvedModel);
  const classificationPhysical = isObject(classification?.physical) ? classification.physical : {};
  const bodyComposition = isObject(body?.composition) ? body.composition : {};
  const bodyThermal = isObject(body?.thermal) ? body.thermal : {};
  const bodyAtmosphere = isObject(body?.atmosphere) ? body.atmosphere : {};
  const bodyHistory = isObject(body?.history) ? body.history : {};
  const bodyOrbit = isObject(body?.orbit) ? body.orbit : {};
  const bodyGiant = isObject(body?.giant) ? body.giant : {};

  const massEarth = firstFinite(
    bodyComposition.massEarth,
    classificationPhysical.massEarth,
    physical.massEarth,
    inputs.massEarth,
  );
  const radiusEarth = firstFinite(
    bodyComposition.radiusEarth,
    classificationPhysical.radiusEarth,
    physical.radiusEarth,
    physical.transitRadiusEarth,
    derived.radiusEarth,
    inputs.observedRadiusEarth,
    inputs.radiusEarth,
  );
  const densityGcm3 = firstFinite(
    bodyComposition.bulkDensityGcm3,
    body?.physical?.densityGcm3,
    classificationPhysical.densityGcm3,
    physical.densityGcm3,
    physical.bulkDensityGcm3,
    derived.densityGcm3,
    massRadiusDensityGcm3(massEarth, radiusEarth),
  );
  const hHeEnvelopeMassPct = firstFinite(
    bodyComposition.hHeEnvelopeMassPct,
    classificationPhysical.hHeEnvelopeMassPct,
    inputs.hHeEnvelopeMassPct,
    envelope?.massPct,
    envelope?.massFraction == null ? null : envelope.massFraction * 100,
  );
  const hydrosphereSource = isObject(hydrosphere) ? hydrosphere : {};
  const surfaceTempK = firstFinite(
    thermal.surfaceTempK,
    derived.surfaceTempK,
    habitability.surfaceTempK,
    bodyThermal.surfaceTempK,
  );
  const equilibriumTempK = firstFinite(
    thermal.equilibriumTempK,
    thermal.tEqK,
    derived.tEqNoGhK,
    bodyThermal.equilibriumTempK,
  );
  const insolationEarth = firstFinite(
    context.irradiationEarth,
    context.insolationEarth,
    thermal.insolationEarth,
    derived.insolationEarth,
    bodyThermal.insolationEarth,
    classificationPhysical.irradiationEarth,
  );
  const semiMajorAxisAu = firstFinite(
    bodyOrbit.semiMajorAxisAu,
    bodyOrbit.au,
    bodyGiant.orbitAu,
    inputs.semiMajorAxisAu,
    inputs.orbitAu,
    solvedModel?.orbit?.semiMajorAxisAu,
    solvedModel?.orbital?.semiMajorAxisAu,
  );

  return compactObject({
    modelVersion: MODEL_VERSION,
    family: classification?.family ?? null,
    solverFamily: classification?.solverFamily ?? null,
    confidence: classification?.confidence ?? null,
    surfaceApplicability: classification?.surfaceApplicability ?? null,
    hostFrameId: hostFrameValue(body, context),
    massEarth,
    massMjup: firstFinite(
      bodyGiant.massMjup,
      classificationPhysical.massMjup,
      physical.massMjup,
      inputs.massMjup,
    ),
    radiusEarth,
    radiusRj: firstFinite(bodyGiant.radiusRj, classificationPhysical.radiusRj, physical.radiusRj),
    densityGcm3,
    gravityG: firstFinite(physical.gravityG, derived.gravityG),
    cmfPct: firstFinite(bodyComposition.cmfPct, classificationPhysical.cmfPct, inputs.cmfPct),
    wmfPct: firstFinite(bodyComposition.wmfPct, classificationPhysical.wmfPct, inputs.wmfPct),
    hHeEnvelopeMassPct,
    envelopeMassPct: firstFinite(envelope?.massPct, hHeEnvelopeMassPct),
    envelopeState: firstString(envelope?.state, envelope?.stateLabel),
    carbonRichness: bodyComposition.carbonRichness,
    carbonRichnessEvidence: bodyComposition.carbonRichnessEvidence,
    compositionClassOverride: bodyComposition.compositionClassOverride,
    compositionClass: firstString(physical.compositionClass, derived.compositionClass),
    waterRegime: firstString(physical.waterRegime, derived.waterRegime),
    pressureAtm: firstFinite(
      bodyAtmosphere.pressureAtm,
      atmosphere.pressureAtm,
      inputs.pressureAtm,
    ),
    greenhouseMode: firstString(bodyAtmosphere.greenhouseMode, atmosphere.greenhouseMode),
    greenhouseEffect: firstFinite(bodyAtmosphere.greenhouseEffect, atmosphere.greenhouseEffect),
    surfaceTempK,
    equilibriumTempK,
    tEqPeriK: firstFinite(thermal.tEqPeriK, derived.tEqPeriK),
    tEqApoK: firstFinite(thermal.tEqApoK, derived.tEqApoK),
    insolationEarth,
    irradiationEarth: firstFinite(context.irradiationEarth, bodyThermal.insolationEarth),
    absorbedFluxWm2: firstFinite(thermal.absorbedFluxWm2, derived.absorbedFluxWm2),
    internalHeatFluxWm2: firstFinite(
      bodyThermal.internalHeatFluxWm2,
      thermal.internalHeatFluxWm2,
      derived.internalHeatFluxWm2,
    ),
    tidalHeatFluxWm2: firstFinite(
      bodyThermal.tidalHeatFluxWm2,
      thermal.tidalHeatFluxWm2,
      derived.tidalHeatFluxWm2,
    ),
    semiMajorAxisAu,
    orbitalPeriodDays: firstFinite(
      solvedModel?.orbit?.orbitalPeriodDays,
      solvedModel?.orbital?.orbitalPeriodDays,
      derived.orbitalPeriodEarthDays,
    ),
    rotationPeriodHours: firstFinite(
      body?.rotation?.rotationPeriodHours,
      inputs.rotationPeriodHours,
      derived.rotationPeriodHours,
    ),
    tidallyLockedToStar:
      derived.tidallyLockedToStar ??
      solvedModel?.orbit?.tidallyLocked ??
      body?.rotation?.tidallyLocked,
    climateState: firstString(habitability.climateState, derived.climateState),
    surfaceStateKey: firstString(derived.surfaceState?.key, habitability.surfaceState?.key),
    surfaceStateLabel: firstString(
      derived.surfaceState?.label,
      habitability.surfaceState?.label,
      habitability.surfaceState,
    ),
    liquidWaterPossible: habitability.liquidWaterPossible ?? derived.liquidWaterPossible,
    hydrosphere: hydrosphereSource,
    liquidOceanFraction: firstFinite(
      hydrosphereSource.liquidOceanFraction,
      derived.liquidOceanFraction,
    ),
    landFraction: firstFinite(hydrosphereSource.landFraction, derived.landFraction),
    permanentIceFraction: firstFinite(
      hydrosphereSource.permanentIceFraction,
      derived.permanentIceFraction,
    ),
    steamFraction: firstFinite(hydrosphereSource.steamFraction, derived.steamFraction),
    surfaceAccessibleLiquidFraction: firstFinite(
      hydrosphereSource.surfaceAccessibleLiquidFraction,
      derived.surfaceAccessibleLiquidFraction,
    ),
    volatileFlags: derived.volatileFlags,
    appearanceRecipeId: firstString(
      body?.appearance?.rockyRecipeId,
      body?.appearance?.styleId,
      body?.legacyInputs?.appearanceRecipeId,
    ),
    strippedEnvelopeCandidate: bodyHistory.strippedEnvelopeCandidate,
    migratedCloseIn: bodyHistory.migratedCloseIn,
    remnantCandidate: bodyHistory.remnantCandidate,
    rogueCandidate: bodyHistory.rogueCandidate,
    contextRogueCandidate: context.rogueCandidate,
  });
}

export function derivePlanetaryDescriptors({
  body = {},
  classification = {},
  solvedModel = {},
  context = {},
} = {}) {
  const inputs = getPlanetarySubtypeInputs(body, classification, solvedModel, context);
  const family = classification?.family ?? inputs.family ?? null;
  const scale = inferScale(family, inputs);
  const boundaryTraits = boundaryTraitsForFamily(family);
  const durableFamily = inferDurableFamily(family);

  return {
    modelVersion: MODEL_VERSION,
    family,
    legacyFamily: family,
    durableFamily,
    solverFamily: classification?.solverFamily ?? inputs.solverFamily ?? null,
    scale,
    boundaryTraits,
    boundaryContext: compactObject({
      radiusValley: radiusValleyBoundaryContext(inputs, family),
    }),
    physical: compactObject({
      massEarth: inputs.massEarth,
      massMjup: inputs.massMjup,
      radiusEarth: inputs.radiusEarth,
      radiusRj: inputs.radiusRj,
      densityGcm3: inputs.densityGcm3,
      cmfPct: inputs.cmfPct,
      wmfPct: inputs.wmfPct,
      hHeEnvelopeMassPct: inputs.hHeEnvelopeMassPct,
    }),
  };
}

function classifyOceanWorld(inputs) {
  if (!isSurfaceRocky(inputs)) return null;
  if (inputs.wmfPct == null || inputs.wmfPct < 0.5) return null;
  if (!hasAccessibleLiquid(inputs)) return null;

  const warnings = [];
  const science = buildOceanWorldOverlay(inputs, { mode: PLANETARY_SUBTYPES.OCEAN_WORLD });
  if (inputs.climateState === "Moist greenhouse") {
    warnings.push(
      reason(
        "moistGreenhouseLimitsSurfaceWater",
        "Moist greenhouse conditions make surface-water interpretation cautious.",
        "",
        "warning",
      ),
    );
  }
  warnings.push(...(science.warnings || []));

  return makeSubtype({
    id: PLANETARY_SUBTYPES.OCEAN_WORLD,
    confidence: "modelled",
    applicability: "full",
    solverOverlay: "hydrosphere",
    reasons: [
      reason("waterInventoryHigh", "Water mass fraction supports persistent ocean coverage."),
      ...(science.reasons || []),
      reason(
        "surfaceLiquidWaterPlausible",
        "Hydrosphere or thermal evidence permits liquid water.",
      ),
    ],
    warnings,
    physical: {
      wmfPct: inputs.wmfPct,
      pressureAtm: inputs.pressureAtm,
      surfaceTempK: inputs.surfaceTempK,
      liquidOceanFraction: inputs.liquidOceanFraction,
      surfaceAccessibleLiquidFraction: inputs.surfaceAccessibleLiquidFraction,
      waterRegime: inputs.waterRegime,
    },
    science,
    visualHints: { surfaceFamily: "ocean", palette: "blue-water" },
  });
}

function classifyWaterWorld(inputs) {
  if (!WATER_WORLD_FAMILIES.has(inputs.family)) return null;
  if (!highWaterWorldSignal(inputs)) return null;

  const warnings = [];
  const science = buildOceanWorldOverlay(inputs, { mode: PLANETARY_SUBTYPES.WATER_WORLD });
  if (inputs.landFraction == null) {
    warnings.push(
      reason(
        "landFractionUnknown",
        "Land fraction is not modelled for this body, so surface access is uncertain.",
        "",
        "warning",
      ),
    );
  } else if (inputs.landFraction <= 0.05) {
    warnings.push(
      reason(
        "veryLowLandFraction",
        "Modelled land fraction is very low.",
        `${inputs.landFraction}`,
        "warning",
      ),
    );
  }
  if ((inputs.pressureAtm ?? 0) >= 5) {
    warnings.push(
      reason(
        "highPressureSurfaceUncertain",
        "High pressure makes ordinary land/surface assumptions cautious.",
        `${inputs.pressureAtm} atm`,
        "warning",
      ),
    );
  }
  warnings.push(...(science.warnings || []));

  return makeSubtype({
    id: PLANETARY_SUBTYPES.WATER_WORLD,
    confidence: "modelled",
    applicability: "limited",
    solverOverlay: "hydrosphere",
    reasons: [
      reason(
        "veryHighWaterInventory",
        "Water mass fraction is high enough for water-world treatment.",
      ),
      ...(science.reasons || []),
    ],
    warnings,
    physical: {
      wmfPct: inputs.wmfPct,
      waterRegime: inputs.waterRegime,
      landFraction: inputs.landFraction,
      pressureAtm: inputs.pressureAtm,
    },
    science,
    visualHints: { surfaceFamily: "global-ocean", palette: "deep-water" },
    pageGuidance: { climate: "limited", population: "limited" },
  });
}

function classifyIcyDwarf(inputs, descriptors) {
  const volatileEvidence =
    (inputs.wmfPct != null && inputs.wmfPct > 0) ||
    (Array.isArray(inputs.volatileFlags) && inputs.volatileFlags.length > 0);
  if (
    descriptors.scale !== PLANETARY_SCALES.DWARF ||
    !volatileEvidence ||
    !coldDwarfSignal(inputs)
  ) {
    return null;
  }

  const science = buildIcyDwarfOverlay(inputs);
  return makeSubtype({
    id: PLANETARY_SUBTYPES.ICY_DWARF,
    confidence: "modelled",
    applicability: "limited",
    solverOverlay: "surfaceState",
    reasons: [
      reason("dwarfScaleRockyBody", "The body is in the dwarf rocky scale."),
      ...(science.reasons || []),
      reason(
        "coldVolatileRichSurface",
        "Cold conditions and volatile evidence support icy-dwarf treatment.",
      ),
    ],
    warnings: [
      reason(
        "surfaceClimateCautious",
        "Climate and population outputs should be interpreted cautiously for icy dwarf bodies.",
        "",
        "warning",
      ),
      ...(science.warnings || []),
    ],
    physical: {
      massEarth: inputs.massEarth,
      wmfPct: inputs.wmfPct,
      insolationEarth: inputs.insolationEarth,
      semiMajorAxisAu: inputs.semiMajorAxisAu,
      surfaceTempK: inputs.surfaceTempK,
    },
    science,
    visualHints: { surfaceFamily: "ice", palette: "icy-dwarf" },
    pageGuidance: { climate: "limited", population: "none" },
  });
}

function classifyLavaWorld(inputs) {
  if (!isSurfaceRocky(inputs) || !highIrradiationSignal(inputs)) return null;

  const surfaceStateReason = inputs.surfaceStateLabel
    ? reason("surfaceStateHot", "Solved surface state is lava-like.", inputs.surfaceStateLabel)
    : reason("irradiationSilicateMelt", "Close-in irradiation supports silicate melt conditions.");
  const science = buildLavaWorldOverlay(inputs);

  return makeSubtype({
    id: PLANETARY_SUBTYPES.LAVA_WORLD,
    confidence: "modelled",
    applicability: "limited",
    solverOverlay: "surfaceState",
    reasons: [surfaceStateReason, ...(science.reasons || [])],
    warnings: [
      reason(
        "habitabilityPagesUnsupported",
        "Climate and population outputs are not meaningful for lava-dominated surfaces.",
        "",
        "warning",
      ),
      ...(science.warnings || []),
    ],
    physical: {
      surfaceTempK: inputs.surfaceTempK,
      equilibriumTempK: inputs.equilibriumTempK,
      insolationEarth: inputs.insolationEarth,
      semiMajorAxisAu: inputs.semiMajorAxisAu,
      surfaceStateLabel: inputs.surfaceStateLabel,
    },
    science,
    visualHints: { surfaceFamily: "lava", palette: "molten" },
    pageGuidance: { climate: "limited", population: "none", tectonics: "limited" },
  });
}

function classifyIronRich(inputs) {
  if (!isRockyLike(inputs)) return null;
  const cmfSignal = inputs.cmfPct != null && inputs.cmfPct >= 55;
  const densitySignal = inputs.densityGcm3 != null && inputs.densityGcm3 >= 7.5;
  if (!cmfSignal && !densitySignal) return null;

  return makeSubtype({
    id: PLANETARY_SUBTYPES.IRON_RICH,
    confidence: "modelled",
    applicability: "full",
    solverOverlay: "composition",
    reasons: [
      cmfSignal
        ? reason(
            "coreMassFractionHigh",
            "Core mass fraction is high enough for iron-rich treatment.",
          )
        : reason("bulkDensityHigh", "Bulk density is high for a rocky-scale body."),
    ],
    physical: {
      cmfPct: inputs.cmfPct,
      densityGcm3: inputs.densityGcm3,
      massEarth: inputs.massEarth,
      radiusEarth: inputs.radiusEarth,
    },
    visualHints: { surfaceFamily: "rocky", palette: "iron-rich" },
  });
}

function classifyCarbonRich(inputs) {
  if (!isRockyLike(inputs) || !explicitCarbonRich(inputs)) return null;

  return makeSubtype({
    id: PLANETARY_SUBTYPES.CARBON_RICH,
    confidence: "medium",
    applicability: "limited",
    solverOverlay: "composition",
    reasons: [
      reason("explicitCarbonRichEvidence", "Explicit carbon-rich composition evidence is present."),
    ],
    warnings: [
      reason(
        "geochemistryNotModelled",
        "Carbon-rich geochemistry is not modelled in detail yet.",
        "",
        "warning",
      ),
    ],
    physical: {
      carbonRichness: inputs.carbonRichness,
      carbonRichnessEvidence: inputs.carbonRichnessEvidence,
      appearanceRecipeId: inputs.appearanceRecipeId,
    },
    visualHints: { surfaceFamily: "rocky", palette: "carbon-rich" },
  });
}

function classifyDesertWorld(inputs) {
  if (!isSurfaceRocky(inputs)) return null;
  if (inputs.wmfPct == null || inputs.wmfPct > 0.01) return null;
  if (!warmDrySignal(inputs)) return null;
  if (highIrradiationSignal(inputs)) return null;
  if (inputs.surfaceTempK != null && inputs.surfaceTempK > 380) return null;
  if (inputs.insolationEarth != null && inputs.insolationEarth > 10) return null;
  if (inputs.climateState === "Runaway greenhouse") return null;

  return makeSubtype({
    id: PLANETARY_SUBTYPES.DESERT_WORLD,
    confidence: "modelled",
    applicability: "full",
    solverOverlay: "climate",
    reasons: [
      reason("lowWaterInventory", "Water inventory is low."),
      reason("warmDryClimateSignal", "Thermal evidence supports arid surface conditions."),
    ],
    physical: {
      wmfPct: inputs.wmfPct,
      surfaceTempK: inputs.surfaceTempK,
      insolationEarth: inputs.insolationEarth,
      liquidOceanFraction: inputs.liquidOceanFraction,
      climateState: inputs.climateState,
    },
    visualHints: { surfaceFamily: "arid", palette: "desert" },
  });
}

function classifySteamWorld(inputs) {
  if (!WATER_WORLD_FAMILIES.has(inputs.family)) return null;
  if (inputs.wmfPct == null || inputs.wmfPct < 0.5) return null;
  if (!steamSignal(inputs)) return null;

  return makeSubtype({
    id: PLANETARY_SUBTYPES.STEAM_WORLD,
    confidence: "modelled",
    applicability: "limited",
    solverOverlay: "climate",
    reasons: [
      reason("waterInventoryHigh", "Water inventory is high."),
      reason(
        "steamGreenhouseSignal",
        "Thermal or hydrosphere evidence supports steam-dominated water.",
      ),
    ],
    warnings: [
      reason(
        "surfaceAccessLimited",
        "A steam world does not support ordinary solid-surface climate assumptions.",
        "",
        "warning",
      ),
    ],
    physical: {
      wmfPct: inputs.wmfPct,
      pressureAtm: inputs.pressureAtm,
      surfaceTempK: inputs.surfaceTempK,
      insolationEarth: inputs.insolationEarth,
      steamFraction: inputs.steamFraction,
      climateState: inputs.climateState,
    },
    visualHints: { atmosphere: "steam", surfaceFamily: "shrouded-water" },
    pageGuidance: { climate: "limited", population: "none" },
  });
}

function classifyHyceanCandidate(inputs) {
  if (!VOLATILE_LIKE_FAMILIES.has(inputs.family)) return null;
  if ((inputs.hHeEnvelopeMassPct ?? 0) < 0.1) return null;
  if ((inputs.wmfPct ?? 0) < 10) return null;
  if (!hyceanBulkSignal(inputs)) return null;
  if (!temperateVolatileSignal(inputs)) return null;

  return makeSubtype({
    id: PLANETARY_SUBTYPES.HYCEAN_CANDIDATE,
    confidence: "low",
    applicability: "limited",
    solverOverlay: "volatileEnvelope",
    reasons: [
      reason("hHeEnvelopePresent", "A meaningful H/He envelope is present."),
      reason(
        "waterRichVolatileInterior",
        "Water inventory supports a hycean-candidate interpretation.",
      ),
    ],
    warnings: [
      reason(
        "candidateNotConfirmedHabitable",
        "Hycean status is candidate-only until an ocean-atmosphere interface is modelled.",
        "",
        "warning",
      ),
    ],
    physical: {
      wmfPct: inputs.wmfPct,
      hHeEnvelopeMassPct: inputs.hHeEnvelopeMassPct,
      massEarth: inputs.massEarth,
      radiusEarth: inputs.radiusEarth,
      equilibriumTempK: inputs.equilibriumTempK,
      insolationEarth: inputs.insolationEarth,
      densityGcm3: inputs.densityGcm3,
    },
    visualHints: { atmosphere: "hazy-hhe", surfaceFamily: "volatile-ocean-candidate" },
    pageGuidance: { climate: "limited", population: "none" },
  });
}

function classifySuperPuff(inputs) {
  if (!SUPER_PUFF_FAMILIES.has(inputs.family)) return null;
  if ((inputs.radiusEarth ?? 0) < 4) return null;
  if ((inputs.densityGcm3 ?? Number.POSITIVE_INFINITY) > 0.3) return null;

  return makeSubtype({
    id: PLANETARY_SUBTYPES.SUPER_PUFF,
    confidence: "modelled",
    applicability: "none",
    solverOverlay: "density",
    reasons: [
      reason(
        "largeRadiusLowDensity",
        "Large radius and low bulk density support super-puff treatment.",
      ),
    ],
    warnings: [
      reason(
        "noSolidSurfaceAssumption",
        "No solid-surface assumptions should be made for super-puff bodies.",
        "",
        "warning",
      ),
    ],
    physical: {
      massEarth: inputs.massEarth,
      radiusEarth: inputs.radiusEarth,
      densityGcm3: inputs.densityGcm3,
      hHeEnvelopeMassPct: inputs.hHeEnvelopeMassPct,
    },
    visualHints: { atmosphere: "extended-haze", surfaceFamily: "volatile-envelope" },
    pageGuidance: { climate: "none", population: "none", tectonics: "none" },
  });
}

function classifyChthonianCandidate(inputs) {
  if (!WATER_WORLD_FAMILIES.has(inputs.family)) return null;
  const closeIn = highIrradiationSignal(inputs);
  const dense = denseRemnantSignal(inputs);
  const lowEnvelope = (inputs.hHeEnvelopeMassPct ?? 0) < 0.1;
  if (!closeIn || !dense || !lowEnvelope) return null;

  const explicit = explicitStrippedEnvelope(inputs);
  const science = buildChthonianOverlay(inputs);
  return makeSubtype({
    id: PLANETARY_SUBTYPES.CHTHONIAN_CANDIDATE,
    confidence: explicit ? "medium" : "low",
    applicability: "limited",
    solverOverlay: "density",
    reasons: [
      reason(
        "closeInRemnantOrbit",
        "Close-in irradiation supports stripped-remnant interpretation.",
      ),
      ...(science.reasons || []),
      reason(
        "denseRockyRemnant",
        "High density or core fraction supports rocky remnant properties.",
      ),
      ...(explicit
        ? [
            reason(
              "explicitStrippedEnvelopeEvidence",
              "Explicit stripped-envelope or migration evidence is present.",
            ),
          ]
        : []),
    ],
    warnings: [
      reason(
        "candidateAncestryUncertain",
        "Chthonian ancestry remains candidate-only without a full evolution model.",
        "",
        "warning",
      ),
      ...(science.warnings || []),
    ],
    physical: {
      semiMajorAxisAu: inputs.semiMajorAxisAu,
      insolationEarth: inputs.insolationEarth,
      cmfPct: inputs.cmfPct,
      densityGcm3: inputs.densityGcm3,
      hHeEnvelopeMassPct: inputs.hHeEnvelopeMassPct,
      strippedEnvelopeCandidate: inputs.strippedEnvelopeCandidate,
      migratedCloseIn: inputs.migratedCloseIn,
    },
    science,
    visualHints: { surfaceFamily: "stripped-rocky", palette: "dark-metallic" },
    pageGuidance: { climate: "limited", population: "none" },
  });
}

function classifyRoguePlanet(inputs) {
  if (!PLANET_FAMILIES.has(inputs.family)) return null;
  const explicit = explicitRogue(inputs);
  if (!explicit && !hostlessRogueSignal(inputs)) return null;

  const science = buildRoguePlanetOverlay(inputs);
  return makeSubtype({
    id: PLANETARY_SUBTYPES.ROGUE_PLANET,
    confidence: explicit ? "medium" : "low",
    applicability: "limited",
    solverOverlay: "hostContext",
    reasons: [
      explicit
        ? reason("explicitRogueEvidence", "Explicit rogue-planet evidence is present.")
        : reason("hostlessZeroFluxContext", "No host orbit or stellar flux context is present."),
      ...(science.reasons || []).filter((entry) => entry.code !== "noStarThermalContext"),
    ],
    warnings: [
      reason(
        "noStarContextLimitsPages",
        "Downstream pages that assume stellar flux should be treated as limited.",
        "",
        "warning",
      ),
      ...(science.warnings || []),
    ],
    physical: {
      hostFrameId: inputs.hostFrameId,
      semiMajorAxisAu: inputs.semiMajorAxisAu,
      insolationEarth: inputs.insolationEarth,
      rogueCandidate: inputs.rogueCandidate,
    },
    science,
    visualHints: { illumination: "ambient", surfaceFamily: "cold-rogue" },
    pageGuidance: { climate: "limited", apparent: "none", population: "none" },
  });
}

export function classifyPlanetarySubtypes({
  body = {},
  classification = {},
  solvedModel = {},
  context = {},
} = {}) {
  const inputs = getPlanetarySubtypeInputs(body, classification, solvedModel, context);
  const descriptors = derivePlanetaryDescriptors({ body, classification, solvedModel, context });
  const subtypes = [
    classifyOceanWorld(inputs, descriptors),
    classifyWaterWorld(inputs, descriptors),
    classifyIcyDwarf(inputs, descriptors),
    classifyLavaWorld(inputs, descriptors),
    classifyIronRich(inputs, descriptors),
    classifyCarbonRich(inputs, descriptors),
    classifyDesertWorld(inputs, descriptors),
    classifySteamWorld(inputs, descriptors),
    classifyHyceanCandidate(inputs, descriptors),
    classifySuperPuff(inputs, descriptors),
    classifyChthonianCandidate(inputs, descriptors),
    classifyRoguePlanet(inputs, descriptors),
  ].filter(Boolean);

  return subtypes.sort((left, right) => {
    const leftPriority = PRIMARY_SUBTYPE_PRIORITY[left.id] ?? 0;
    const rightPriority = PRIMARY_SUBTYPE_PRIORITY[right.id] ?? 0;
    if (leftPriority !== rightPriority) return rightPriority - leftPriority;
    return left.id.localeCompare(right.id);
  });
}

export function selectPrimaryPlanetarySubtype(subtypes = [], classification = {}) {
  if (!Array.isArray(subtypes) || subtypes.length === 0) return null;
  const sorted = [...subtypes].sort((left, right) => {
    const leftPriority = PRIMARY_SUBTYPE_PRIORITY[left?.id] ?? 0;
    const rightPriority = PRIMARY_SUBTYPE_PRIORITY[right?.id] ?? 0;
    if (leftPriority !== rightPriority) return rightPriority - leftPriority;
    const leftApplicability = left?.applicability === classification?.surfaceApplicability ? 1 : 0;
    const rightApplicability =
      right?.applicability === classification?.surfaceApplicability ? 1 : 0;
    if (leftApplicability !== rightApplicability) return rightApplicability - leftApplicability;
    return String(left?.id || "").localeCompare(String(right?.id || ""));
  });
  return sorted[0] || null;
}
