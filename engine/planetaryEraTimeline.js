const MODEL_VERSION = "planetary-era-timeline-v1";

const CATEGORY_ORDER = Object.freeze({
  formation: 0,
  interior: 1,
  envelope: 2,
  atmosphere: 3,
  hydrosphere: 4,
  climate: 5,
  radiation: 6,
  habitability: 7,
  orbital: 8,
  substellar: 9,
  reference: 10,
});

const ROCKY_SOLVER_FAMILIES = new Set(["rocky", "dwarfRocky", "superEarth", "radiusValley"]);
const VOLATILE_SOLVER_FAMILIES = new Set(["volatileCandidate", "miniNeptune", "iceGiant"]);
const GIANT_FAMILIES = new Set(["gasGiant", "iceGiant"]);
const SURFACE_HABITABILITY_BLOCKED = new Set(["miniNeptune", "gasGiant", "iceGiant", "brownDwarf"]);

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

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
  return "";
}

function clamp(value, min, max = null) {
  const number = finiteOrNull(value);
  if (number == null) return null;
  const upper = max == null ? number : Math.min(number, max);
  return Math.max(min, upper);
}

function clampTimeGyr(value, currentAgeGyr = null) {
  if (value == null) return null;
  const max = currentAgeGyr == null ? null : Math.max(currentAgeGyr, 0);
  return clamp(value, 0, max);
}

function round(value, digits = 3) {
  const number = finiteOrNull(value);
  if (number == null) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function includesText(value, needle) {
  return String(value || "")
    .toLowerCase()
    .includes(String(needle || "").toLowerCase());
}

function normalizeConfidence(value, fallback = "medium") {
  const text = String(value || "").toLowerCase();
  if (text === "high" || text === "modelled" || text === "modeled") return "high";
  if (text === "medium") return "medium";
  if (text === "low") return "low";
  return fallback;
}

function modelClassification(model = {}) {
  const classification = isObject(model.classification) ? model.classification : {};
  const family = firstString(
    classification.family,
    classification.code,
    model.family,
    model.regime === "brownDwarf" ? "brownDwarf" : "",
    model.regime === "gasGiant" ? "gasGiant" : "",
    String(model.modelVersion || "").startsWith("volatile-radius") ? "miniNeptune" : "",
  );
  const solverFamily = firstString(
    classification.solverFamily,
    model.solverFamily,
    model.regime === "brownDwarf" ? "brownDwarf" : "",
    model.regime === "gasGiant" ? "gasGiant" : "",
    family && ROCKY_SOLVER_FAMILIES.has(family) ? "rocky" : "",
    family && VOLATILE_SOLVER_FAMILIES.has(family) ? "volatile" : "",
    family && family === "gasGiant" ? "gasGiant" : "",
  );
  return {
    classification,
    family: family || "rocky",
    solverFamily: solverFamily || "rocky",
    displayLabel: firstString(classification.displayLabel, model.display?.bodyClass, family),
  };
}

function subtypeList(model = {}) {
  const sources = [
    Array.isArray(model.subtypes) ? model.subtypes : [],
    Array.isArray(model.classification?.subtypes) ? model.classification.subtypes : [],
    model.primarySubtype ? [model.primarySubtype] : [],
  ];
  const byId = new Map();
  for (const source of sources) {
    for (const subtype of source) {
      const id = firstString(subtype?.id);
      if (!id || byId.has(id)) continue;
      byId.set(id, subtype);
    }
  }
  return [...byId.values()];
}

function subtypeIds(model = {}) {
  return subtypeList(model).map((subtype) => subtype.id);
}

function hasSubtype(model, id) {
  return subtypeIds(model).includes(id);
}

function sourceModels(model = {}) {
  return isObject(model.sourceModels) ? model.sourceModels : {};
}

function derivedModel(model = {}) {
  if (isObject(model.derived)) return model.derived;
  const rocky = sourceModels(model).rocky;
  if (isObject(rocky?.derived)) return rocky.derived;
  return {};
}

function directRockyModel(model = {}) {
  const rocky = sourceModels(model).rocky;
  return isObject(rocky) ? rocky : model;
}

function volatileModel(model = {}) {
  const volatile = sourceModels(model).volatile;
  return isObject(volatile) ? volatile : model;
}

function giantModel(model = {}) {
  const giant = sourceModels(model).gasGiant || sourceModels(model).giant;
  return isObject(giant) ? giant : model;
}

function valueFromPaths(source, paths = []) {
  for (const path of paths) {
    let cursor = source;
    let ok = true;
    for (const key of path.split(".")) {
      if (!isObject(cursor) && !Array.isArray(cursor)) {
        ok = false;
        break;
      }
      cursor = cursor[key];
    }
    if (ok && cursor !== undefined && cursor !== null && cursor !== "") return cursor;
  }
  return null;
}

function ageFromModel(model = {}, star = {}, systemContext = {}) {
  return firstFinite(
    valueFromPaths(model, [
      "currentAgeGyr",
      "ageGyr",
      "inputs.ageGyr",
      "star.ageGyr",
      "sourceModels.volatile.inputs.ageGyr",
      "sourceModels.gasGiant.inputs.ageGyr",
    ]),
    valueFromPaths(star, ["ageGyr", "derived.ageGyr", "inputs.ageGyr"]),
    valueFromPaths(systemContext, ["starAgeGyr", "starConfig.ageGyr", "star.ageGyr"]),
  );
}

function starLifetimeGyr(star = {}, systemContext = {}) {
  return firstFinite(
    valueFromPaths(star, ["maxAgeGyr", "mainSequenceLifetimeGyr", "lifetimeGyr"]),
    valueFromPaths(systemContext, [
      "star.maxAgeGyr",
      "star.mainSequenceLifetimeGyr",
      "starConfig.maxAgeGyr",
    ]),
  );
}

function timeState(startGyr, endGyr, currentAgeGyr) {
  if (currentAgeGyr == null) return "conditional";
  if (startGyr != null && currentAgeGyr < startGyr) return "future";
  if (endGyr != null && currentAgeGyr > endGyr) return "past";
  return "current";
}

function makeDriver(key, label, value, effect = "") {
  if (value == null || value === "") return null;
  return {
    key,
    label,
    value: String(value),
    effect,
  };
}

function compactDrivers(drivers = []) {
  return drivers.filter((driver) => driver && driver.value !== "null" && driver.value !== "");
}

function addEra(eras, timelineContext, era = {}) {
  if (!era.id || !era.label) return null;
  const currentAgeGyr = timelineContext.currentAgeGyr;
  const startGyr = clampTimeGyr(era.startGyr ?? null, null);
  const endGyr =
    era.endGyr == null ? null : Math.max(startGyr ?? 0, clampTimeGyr(era.endGyr, null) ?? 0);
  const normalized = {
    id: era.id,
    label: era.label,
    category: era.category || "formation",
    startGyr,
    endGyr,
    timingLabel: era.timingLabel || formatEraTiming({ startGyr, endGyr }),
    state: era.state || timeState(startGyr, endGyr, currentAgeGyr),
    confidence: normalizeConfidence(era.confidence, "medium"),
    severity: era.severity || "info",
    headline: era.headline || era.label,
    detail: era.detail || "",
    drivers: compactDrivers(era.drivers || []),
    evidenceCodes: Array.isArray(era.evidenceCodes) ? era.evidenceCodes : [],
    warningCodes: Array.isArray(era.warningCodes) ? era.warningCodes : [],
  };
  eras.push(normalized);
  return normalized;
}

function formatNumber(value, digits = 2) {
  const number = finiteOrNull(value);
  if (number == null) return "";
  if (Math.abs(number) >= 1000 || (Math.abs(number) > 0 && Math.abs(number) < 0.001)) {
    return number.toExponential(2);
  }
  return round(number, digits).toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function formatGyr(value) {
  const number = finiteOrNull(value);
  if (number == null) return "unknown";
  if (number < 0.001) return `${formatNumber(number * 1_000_000, 0)} kyr`;
  if (number < 1) return `${formatNumber(number * 1000, number < 0.01 ? 1 : 0)} Myr`;
  return `${formatNumber(number, number < 10 ? 2 : 1)} Gyr`;
}

export function formatEraTiming(era = {}) {
  const start = finiteOrNull(era.startGyr);
  const end = finiteOrNull(era.endGyr);
  if (start == null && end == null) return "Timing uncertain";
  if (start != null && end != null) {
    if (Math.abs(start - end) < 1e-6) return formatGyr(start);
    return `${formatGyr(start)}-${formatGyr(end)}`;
  }
  if (start != null) return `After ${formatGyr(start)}`;
  return `Before ${formatGyr(end)}`;
}

function formationEnd(currentAgeGyr, fallback = 0.05) {
  if (currentAgeGyr == null) return fallback;
  return Math.min(fallback, Math.max(currentAgeGyr, 0.001));
}

function remainingMainSequenceGyr(context = {}) {
  const currentAgeGyr = finiteOrNull(context.currentAgeGyr);
  const maxAgeGyr = finiteOrNull(context.maxAgeGyr);
  if (currentAgeGyr == null || maxAgeGyr == null || maxAgeGyr <= currentAgeGyr) return null;
  return maxAgeGyr - currentAgeGyr;
}

function futureStartGyr(context = {}, fallbackDeltaGyr = 1, remainingFraction = 0.25) {
  const currentAgeGyr = finiteOrNull(context.currentAgeGyr);
  if (currentAgeGyr == null) return null;
  const remaining = remainingMainSequenceGyr(context);
  const delta =
    remaining == null
      ? fallbackDeltaGyr
      : Math.max(0.05, Math.min(fallbackDeltaGyr, remaining * remainingFraction));
  return currentAgeGyr + delta;
}

function futureState(context = {}) {
  return finiteOrNull(context.currentAgeGyr) == null ? "conditional" : "future";
}

function displayMass(model = {}, kind = "planet") {
  const derived = derivedModel(model);
  const physical = model.physical || {};
  const massEarth = firstFinite(
    physical.massEarth,
    derived.massEarth,
    directRockyModel(model).inputs?.massEarth,
  );
  if (massEarth != null) return `${formatNumber(massEarth, 3)} Earth masses`;
  const massMoon = firstFinite(model.inputs?.massMoon);
  if (massMoon != null) return `${formatNumber(massMoon, 3)} Moon masses`;
  const massMjup = firstFinite(physical.massMjup, model.inputs?.massMjup);
  if (massMjup != null) return `${formatNumber(massMjup, 3)} Jupiter masses`;
  return kind === "moon" ? "Moon mass model" : "Planetary mass model";
}

function displayRadius(model = {}, kind = "planet") {
  const derived = derivedModel(model);
  const physical = model.physical || {};
  const radiusEarth = firstFinite(
    physical.radiusEarth,
    physical.transitRadiusEarth,
    derived.radiusEarth,
    directRockyModel(model).derived?.radiusEarth,
  );
  if (radiusEarth != null) return `${formatNumber(radiusEarth, 3)} Earth radii`;
  const radiusMoon = firstFinite(model.physical?.radiusMoon);
  if (radiusMoon != null) return `${formatNumber(radiusMoon, 3)} Moon radii`;
  const radiusRj = firstFinite(physical.radiusRj, model.inputs?.radiusRj);
  if (radiusRj != null) return `${formatNumber(radiusRj, 3)} Jupiter radii`;
  return kind === "moon" ? "Moon radius model" : "Planetary radius model";
}

function addRockyFormationEras(eras, context, model) {
  const family = context.family;
  addEra(eras, context, {
    id: "accretion-differentiation",
    label: "Accretion and differentiation",
    category: "formation",
    startGyr: 0,
    endGyr: formationEnd(context.currentAgeGyr, family === "dwarfRocky" ? 0.1 : 0.05),
    state: context.currentAgeGyr == null ? "conditional" : "past",
    confidence: family === "dwarfRocky" ? "low" : "medium",
    severity: "info",
    headline: "Rocky body formation and internal layering",
    detail:
      family === "dwarfRocky"
        ? "Small rocky bodies may be only partly differentiated, so early internal layering is uncertain."
        : "Rocky-scale mass and density support early heating and separation into interior layers.",
    drivers: [
      makeDriver("family", "Family", family, "Selects rocky timeline rules"),
      makeDriver("mass", "Mass", displayMass(model), "Constrains early differentiation"),
      makeDriver("radius", "Radius", displayRadius(model), "Constrains body scale"),
    ],
    evidenceCodes: ["ROCKY_BODY"],
  });

  if (family !== "dwarfRocky") {
    addEra(eras, context, {
      id: "magma-ocean-cooling",
      label: "Magma-ocean cooling",
      category: "interior",
      startGyr: 0.001,
      endGyr: formationEnd(context.currentAgeGyr, family === "superEarth" ? 0.2 : 0.1),
      state: context.currentAgeGyr == null ? "conditional" : "past",
      confidence: "low",
      severity: "info",
      headline: "Early molten surface and mantle cooling",
      detail:
        "A rocky planet this size likely passed through an early hot, partly molten stage, but the exact duration is not solved.",
      drivers: [
        makeDriver("family", "Family", family, "Rocky worlds usually cool from hot starts"),
        makeDriver("surfaceState", "Current surface state", currentSurfaceState(model), ""),
      ],
      evidenceCodes: ["ROCKY_BODY", "INFERRED_HOT_START"],
    });
  }
}

function currentSurfaceState(model = {}) {
  return firstString(
    derivedModel(model).surfaceState?.label,
    derivedModel(model).surfaceState,
    model.habitability?.surfaceState,
    model.display?.surfaceState,
  );
}

function hydrosphereOf(model = {}) {
  const derived = derivedModel(model);
  return (
    (isObject(derived.hydrosphere) && derived.hydrosphere) ||
    (isObject(model.habitability?.hydrosphere) && model.habitability.hydrosphere) ||
    null
  );
}

function environmentForcingOf(model = {}) {
  const derived = derivedModel(model);
  return (
    (isObject(derived.environmentForcing) && derived.environmentForcing) ||
    (isObject(model.environment?.forcing) && model.environment.forcing) ||
    (isObject(model.environmentForcing) && model.environmentForcing) ||
    null
  );
}

function magnetosphereEnvironmentOf(model = {}) {
  const derived = derivedModel(model);
  return (
    (isObject(derived.magnetosphereEnvironment) && derived.magnetosphereEnvironment) ||
    (isObject(model.magnetic?.magnetosphereEnvironment) &&
      model.magnetic.magnetosphereEnvironment) ||
    (isObject(model.magnetosphereEnvironment) && model.magnetosphereEnvironment) ||
    null
  );
}

function radiationOf(model = {}) {
  return isObject(model.radiation) ? model.radiation : null;
}

function tidalPersistenceContextOf(model = {}) {
  return (
    (isObject(model.dynamicalContext?.tidalPersistenceContext) &&
      model.dynamicalContext.tidalPersistenceContext) ||
    (isObject(model.habitability?.dynamicalPersistence) &&
      model.habitability.dynamicalPersistence) ||
    (isObject(model.hydrosphere?.dynamicalPersistenceContext) &&
      model.hydrosphere.dynamicalPersistenceContext) ||
    (isObject(model.geology?.dynamicalPersistenceContext) &&
      model.geology.dynamicalPersistenceContext) ||
    null
  );
}

function tidalPersistenceTimelineCopy(sustainedClass) {
  switch (String(sustainedClass || "").toLowerCase()) {
    case "likely-sustained":
      return {
        severity: "info",
        headline: "Tidal heating may be sustained by orbital forcing",
        detail:
          "Shared dynamical context links current tidal heat to resonance or forced-eccentricity support, without claiming a permanent ocean.",
      };
    case "damping":
      return {
        severity: "caution",
        headline: "Tidal heating persistence may be damping",
        detail:
          "Current tidal heat is separated from long-term support; without maintained eccentricity, heating may fade in the simplified model.",
      };
    case "overdriven":
      return {
        severity: "warning",
        headline: "Sustained tidal stress may be overdriven",
        detail:
          "Shared dynamical context treats strong tidal heating as stress context, not as a simple habitability benefit.",
      };
    case "uncertain":
      return {
        severity: "caution",
        headline: "Tidal heating persistence is uncertain",
        detail:
          "The current model lacks enough forcing, damping, or age context to claim sustained tidal heat.",
      };
    default:
      return {
        severity: "info",
        headline: "Tidal heating persistence is low",
        detail:
          "Shared dynamical context does not find strong sustained tidal heating support for this moon.",
      };
  }
}

function atmosphereLedgerOf(model = {}) {
  const derived = derivedModel(model);
  return (
    (isObject(derived.atmosphereLedger) && derived.atmosphereLedger) ||
    (isObject(model.atmosphere?.ledger) && model.atmosphere.ledger) ||
    null
  );
}

function climateChemistryForcingOf(model = {}) {
  const derived = derivedModel(model);
  return (
    (isObject(derived.climateChemistryForcing) && derived.climateChemistryForcing) ||
    (isObject(model.climate?.chemistryForcing) && model.climate.chemistryForcing) ||
    null
  );
}

function carbonCycleContextOf(model = {}) {
  const derived = derivedModel(model);
  return isObject(derived.carbonCycleContext) ? derived.carbonCycleContext : null;
}

function oceanChemistryContextOf(model = {}) {
  const derived = derivedModel(model);
  return isObject(derived.oceanChemistryContext) ? derived.oceanChemistryContext : null;
}

function biosignatureContextOf(model = {}) {
  const derived = derivedModel(model);
  return isObject(derived.biosignatureContext) ? derived.biosignatureContext : null;
}

function photochemistryOf(model = {}) {
  const derived = derivedModel(model);
  return (
    (isObject(derived.photochemistry) && derived.photochemistry) ||
    (isObject(model.photochemistry) && model.photochemistry) ||
    null
  );
}

function atmospherePressureFrom(model = {}, ledger = null) {
  const derived = derivedModel(model);
  return firstFinite(
    ledger?.pressureAtm,
    model.atmosphere?.pressureAtm,
    directRockyModel(model).inputs?.pressureAtm,
    derived.pressureKpa == null ? null : derived.pressureKpa / 101.325,
  );
}

function addCoupledEnvironmentContextEras(eras, context, model) {
  addEnvironmentForcingEras(eras, context, model);
  addMagnetosphereCompressionEra(eras, context, model);
  addAtmosphereLedgerEras(eras, context, model);
  addPhotochemicalHazeEra(eras, context, model);
  addClimateChemistryEra(eras, context, model);
  addCarbonCycleEra(eras, context, model);
  addOceanChemistryEra(eras, context, model);
  addBiosignatureContextEra(eras, context, model);
}

function addEnvironmentForcingEras(eras, context, model) {
  const forcing = environmentForcingOf(model);
  if (!forcing) return;
  const xuvRatio = firstFinite(forcing.flux?.xuvEarthAtOrbit, forcing.flux?.xuvEarthMean);
  const xuvHazard = firstFinite(forcing.hazards?.xuvHazardScore);
  const stellarAge = firstFinite(forcing.stellar?.starAgeGyr, context.currentAgeGyr);
  const youngHighEnergy = stellarAge != null && stellarAge < 1 && (xuvRatio ?? 0) >= 1.5;
  const highCurrentXuv = (xuvRatio ?? 0) >= 5 || (xuvHazard ?? 0) >= 0.35;
  if (!youngHighEnergy && !highCurrentXuv) return;

  const pastEnd =
    context.currentAgeGyr == null ? null : Math.min(0.5, Math.max(0.02, context.currentAgeGyr / 3));
  addEra(eras, context, {
    id: "early-high-xuv-atmosphere-erosion",
    label: "High-XUV atmosphere-erosion era",
    category: "atmosphere",
    startGyr: 0.001,
    endGyr: highCurrentXuv ? null : pastEnd,
    state: highCurrentXuv ? "current" : context.currentAgeGyr == null ? "conditional" : "past",
    confidence: normalizeConfidence(forcing.confidence, "medium"),
    severity: highCurrentXuv ? "warning" : "caution",
    headline: highCurrentXuv
      ? "Current high-energy irradiation can drive atmospheric erosion"
      : "Young-star high-energy irradiation likely shaped early volatile loss",
    detail:
      "This uses the shared stellar-environment forcing context. It is an erosion-pressure flag, not a solved atmospheric history.",
    drivers: [
      makeDriver(
        "xuv",
        "XUV flux",
        xuvRatio == null ? "" : `${formatNumber(xuvRatio, 2)}x Earth`,
        "",
      ),
      makeDriver(
        "hazard",
        "XUV hazard score",
        xuvHazard == null ? "" : formatNumber(xuvHazard, 2),
        "",
      ),
      makeDriver("stellarAge", "Stellar age", stellarAge == null ? "" : formatGyr(stellarAge), ""),
    ],
    evidenceCodes: ["ENVIRONMENT_FORCING", "HIGH_XUV_EROSION_CONTEXT"],
    warningCodes: ["NOT_SOLVED_ATMOSPHERE_HISTORY"],
  });
}

function addMagnetosphereCompressionEra(eras, context, model) {
  const magnetosphere = magnetosphereEnvironmentOf(model);
  const radiation = radiationOf(model);
  const compressionClass = firstString(
    magnetosphere?.compressionClass,
    radiation?.parentMagnetosphereCompressionClass,
  );
  const windRatio = firstFinite(
    magnetosphere?.windPressureEarthRatio,
    radiation?.parentWindCompressionFactor,
    environmentForcingOf(model)?.wind?.ramPressureEarthRatio,
  );
  const magnetopauseRp = firstFinite(magnetosphere?.magnetopauseRp, radiation?.magnetopauseLShell);
  const compressed =
    includesText(compressionClass, "compressed") ||
    includesText(compressionClass, "collapsed") ||
    (windRatio != null && windRatio >= 5);
  if (!compressed) return;

  addEra(eras, context, {
    id: "wind-compressed-magnetosphere-era",
    label: "Wind-compressed magnetosphere era",
    category: "radiation",
    startGyr: context.currentAgeGyr,
    endGyr: null,
    state: "current",
    confidence: normalizeConfidence(magnetosphere?.confidence, "medium"),
    severity: includesText(compressionClass, "collapsed") ? "warning" : "caution",
    headline: "Stellar wind pressure limits magnetic shielding",
    detail:
      "The timeline follows the magnetosphere environment or parent-radiation context; it does not calculate aurora or radiation-belt evolution here.",
    drivers: [
      makeDriver("compression", "Compression class", compressionClass, ""),
      makeDriver(
        "wind",
        "Wind pressure",
        windRatio == null ? "" : `${formatNumber(windRatio, 2)}x Earth`,
        "",
      ),
      makeDriver(
        "magnetopause",
        "Magnetopause",
        magnetopauseRp == null ? "" : `${formatNumber(magnetopauseRp, 2)} Rp/L-shell`,
        "",
      ),
    ],
    evidenceCodes: ["MAGNETOSPHERE_ENVIRONMENT"],
    warningCodes: ["MAGNETOSPHERE_COMPRESSION"],
  });
}

function atmosphereTrendLabel(ledger = {}) {
  const trend = firstString(ledger.trendLabel, ledger.trendClass);
  if (!trend) return "Atmosphere source-sink balance";
  if (includesText(trend, "declin")) return "Atmosphere decline era";
  if (includesText(trend, "replenish")) return "Atmosphere replenishment era";
  if (includesText(trend, "airless")) return "Airless exosphere era";
  return "Atmosphere source-sink balance";
}

function addAtmosphereLedgerEras(eras, context, model) {
  const ledger = atmosphereLedgerOf(model);
  if (!ledger) return;
  const trend = firstString(ledger.trendClass, ledger.trendLabel);
  const pressureAtm = atmospherePressureFrom(model, ledger);
  const declining = includesText(trend, "declin") || (ledger.netBalance ?? 0) < -0.1;
  const transient =
    includesText(trend, "transient") || includesText(ledger.timescaleClass, "transient");
  const airless = includesText(trend, "airless") || (pressureAtm != null && pressureAtm <= 1e-6);

  addEra(eras, context, {
    id: "atmosphere-ledger-era",
    label: atmosphereTrendLabel(ledger),
    category: "atmosphere",
    startGyr: context.currentAgeGyr,
    endGyr: null,
    state: "current",
    confidence: "medium",
    severity: declining || airless ? "caution" : transient ? "info" : "good",
    headline: "Atmospheric sources and sinks set the current stability context",
    detail:
      "This source-sink ledger is a qualitative trend and timescale diagnostic, not a precise atmospheric lifetime.",
    drivers: [
      makeDriver("trend", "Trend", firstString(ledger.trendLabel, ledger.trendClass), ""),
      makeDriver(
        "timescale",
        "Timescale",
        firstString(ledger.timescaleLabel, ledger.timescaleClass),
        "",
      ),
      makeDriver("source", "Dominant source", ledger.dominantSource?.label, ""),
      makeDriver("sink", "Dominant sink", ledger.dominantSink?.label, ""),
      makeDriver(
        "pressure",
        "Pressure",
        pressureAtm == null ? "" : `${formatNumber(pressureAtm, pressureAtm < 0.01 ? 6 : 3)} atm`,
        "",
      ),
    ],
    evidenceCodes: ["ATMOSPHERE_LEDGER"],
  });

  if (declining && pressureAtm != null && pressureAtm > 1e-5 && pressureAtm < 0.05) {
    addEra(eras, context, {
      id: "past-atmosphere-loss-water-candidate",
      label: "Past thicker-atmosphere/water candidate",
      category: "atmosphere",
      startGyr: context.currentAgeGyr == null ? null : Math.max(0.05, context.currentAgeGyr - 3),
      endGyr: context.currentAgeGyr == null ? null : Math.max(0.1, context.currentAgeGyr - 0.5),
      state: context.currentAgeGyr == null ? "conditional" : "past",
      confidence: "low",
      severity: "info",
      headline: "Current thin-air decline is consistent with earlier volatile loss",
      detail:
        "A declining thin atmosphere can indicate prior thicker-air or wetter conditions, but the app does not solve geomorphic evidence or exact timing.",
      drivers: [
        makeDriver("trend", "Ledger trend", firstString(ledger.trendLabel, ledger.trendClass), ""),
        makeDriver("sink", "Dominant sink", ledger.dominantSink?.label, ""),
        makeDriver(
          "pressure",
          "Current pressure",
          `${formatNumber(pressureAtm, pressureAtm < 0.01 ? 6 : 3)} atm`,
          "",
        ),
      ],
      evidenceCodes: ["ATMOSPHERE_LEDGER", "THIN_DECLINING_ATMOSPHERE"],
      warningCodes: ["LOW_CONFIDENCE_PAST_WATER_CONTEXT"],
    });
  }

  if ((declining || transient) && pressureAtm != null && pressureAtm > 1e-5) {
    addEra(eras, context, {
      id: "future-atmosphere-loss-collapse-risk",
      label: "Future atmosphere loss/collapse risk",
      category: "atmosphere",
      startGyr: futureStartGyr(context, 0.5, 0.15),
      endGyr: null,
      state: "conditional",
      confidence: "low",
      severity: declining ? "warning" : "caution",
      headline: "Current source-sink balance may not maintain the atmosphere long term",
      detail:
        "This is a risk flag from the current ledger only; changing volcanism, escape, cold traps, or impact supply could alter it.",
      drivers: [
        makeDriver("trend", "Ledger trend", firstString(ledger.trendLabel, ledger.trendClass), ""),
        makeDriver(
          "timescale",
          "Timescale",
          firstString(ledger.timescaleLabel, ledger.timescaleClass),
          "",
        ),
        makeDriver("net", "Net balance", formatNumber(ledger.netBalance, 3), ""),
      ],
      evidenceCodes: ["FUTURE_ATMOSPHERE_LEDGER_RISK"],
    });
  }
}

function addPhotochemicalHazeEra(eras, context, model) {
  const haze = photochemistryOf(model)?.haze;
  if (!isObject(haze)) return;
  const hazeClass = firstString(haze.hazeClass);
  const likelihood = firstFinite(haze.likelihoodScore);
  const visibleOpacity = firstFinite(haze.visibleOpticalDepthProxy);
  const active =
    (hazeClass && !includesText(hazeClass, "none")) ||
    (likelihood != null && likelihood >= 0.35) ||
    (visibleOpacity != null && visibleOpacity >= 0.05);
  if (!active) return;

  addEra(eras, context, {
    id: "haze-rich-anoxic-era",
    label: "Haze-rich anoxic photochemistry era",
    category: "atmosphere",
    startGyr: context.currentAgeGyr,
    endGyr: null,
    state: "current",
    confidence: normalizeConfidence(haze.confidence, "medium"),
    severity: includesText(hazeClass, "thick") ? "warning" : "caution",
    headline: "Organic haze can reshape surface light and climate interpretation",
    detail:
      "The haze context comes from methane/CO2 ratio, oxygen suppression, atmospheric pressure, and UV supply; it is chemistry context, not biology.",
    drivers: [
      makeDriver("hazeClass", "Haze class", hazeClass, ""),
      makeDriver(
        "methaneToCo2",
        "CH4/CO2",
        haze.methaneToCo2Ratio == null ? "" : formatNumber(haze.methaneToCo2Ratio, 3),
        "",
      ),
      makeDriver(
        "surfaceLight",
        "Surface-light reduction",
        haze.surfaceLightReductionFraction == null
          ? ""
          : `${formatNumber(haze.surfaceLightReductionFraction * 100, 1)}%`,
        "",
      ),
    ],
    evidenceCodes: ["PHOTOCHEMICAL_HAZE"],
  });
}

function addClimateChemistryEra(eras, context, model) {
  const forcing = climateChemistryForcingOf(model);
  if (!forcing) return;
  const netDeltaK = firstFinite(forcing.netDeltaK);
  if (netDeltaK == null || Math.abs(netDeltaK) < 1) return;
  const cooling = netDeltaK < 0;
  addEra(eras, context, {
    id: "coupled-climate-forcing-era",
    label: cooling ? "Coupled cooling tendency era" : "Coupled warming tendency era",
    category: "climate",
    startGyr: context.currentAgeGyr,
    endGyr: null,
    state: "current",
    confidence: "medium",
    severity: Math.abs(netDeltaK) >= 8 ? "warning" : "caution",
    headline: "Photochemistry, clouds, and greenhouse terms shift climate tendency",
    detail:
      "This is the bounded Phase 4/5 diagnostic. It remains separate from the existing surface-temperature solve.",
    drivers: [
      makeDriver("netDelta", "Net tendency", `${formatNumber(netDeltaK, 1)} K`, ""),
      makeDriver("haze", "Haze term", `${formatNumber(forcing.hazeDeltaK, 1)} K`, ""),
      makeDriver(
        "methane",
        "Methane term",
        `${formatNumber(forcing.methaneGreenhouseDeltaK, 1)} K`,
        "",
      ),
      makeDriver("clouds", "Cloud term", `${formatNumber(forcing.cloudAlbedoDeltaK, 1)} K`, ""),
    ],
    evidenceCodes: ["CLIMATE_CHEMISTRY_FORCING"],
  });
}

function addCarbonCycleEra(eras, context, model) {
  const carbon = carbonCycleContextOf(model);
  if (!carbon) return;
  const tendency = firstString(carbon.tendencyClass);
  if (!tendency || includesText(tendency, "inactive")) {
    if ((firstFinite(carbon.seafloorWeatheringPotential) ?? 0) < 0.2) return;
  }
  const thermostat = firstFinite(carbon.thermostatStrength) ?? 0;
  const limiter = firstString(carbon.weatheringLimiter, carbon.recyclingLimiter);
  const breakdown =
    includesText(limiter, "limited") ||
    includesText(limiter, "barrier") ||
    thermostat < 0.08 ||
    includesText(tendency, "limited");
  addEra(eras, context, {
    id:
      thermostat >= 0.35
        ? "carbonate-silicate-thermostat-era"
        : breakdown
          ? "carbon-cycle-breakdown-risk"
          : "carbon-cycle-tendency-era",
    label:
      thermostat >= 0.35
        ? "Carbonate-silicate thermostat era"
        : breakdown
          ? "Carbon-cycle breakdown risk"
          : "Carbonate-silicate tendency era",
    category: "climate",
    startGyr: context.currentAgeGyr,
    endGyr: null,
    state: "current",
    confidence: normalizeConfidence(carbon.confidence, "medium"),
    severity: thermostat >= 0.35 ? "good" : breakdown ? "caution" : "info",
    headline: "Weathering, outgassing, and recycling set the carbon-cycle context",
    detail:
      "The event records a carbonate-silicate tendency only; it is not an exact CO2 reservoir history.",
    drivers: [
      makeDriver("tendency", "Tendency", tendency, ""),
      makeDriver("limiter", "Limiter", limiter, ""),
      makeDriver("weathering", "Weathering", formatNumber(carbon.weatheringEfficiency, 3), ""),
      makeDriver("recycling", "Recycling", formatNumber(carbon.recyclingEfficiency, 3), ""),
      makeDriver("thermostat", "Thermostat strength", formatNumber(thermostat, 3), ""),
    ],
    evidenceCodes: ["CARBON_CYCLE_CONTEXT"],
  });
}

function addOceanChemistryEra(eras, context, model) {
  const ocean = oceanChemistryContextOf(model);
  if (!ocean?.applicable) return;
  const caveated =
    ocean.highPressureIceCaveat === true ||
    includesText(ocean.carbonateSaturationClass, "limited") ||
    includesText(ocean.carbonateSaturationClass, "risk") ||
    includesText(ocean.acidityClass, "acidic");
  addEra(eras, context, {
    id: "ocean-chemistry-context-era",
    label: "Ocean-chemistry context era",
    category: "hydrosphere",
    startGyr: context.currentAgeGyr,
    endGyr: null,
    state: "current",
    confidence: normalizeConfidence(ocean.confidence, "medium"),
    severity: caveated ? "caution" : "info",
    headline: "Ocean chemistry constrains solvent and nutrient interpretation",
    detail:
      "Salinity, brine/ammonia freezing effects, acidity, carbonate support, and rock-ocean access are context labels, not full geochemical reservoirs.",
    drivers: [
      makeDriver(
        "waterContext",
        "Water context",
        ocean.waterContextLabel || ocean.waterContext,
        "",
      ),
      makeDriver("salinity", "Salinity", ocean.salinityClass, ""),
      makeDriver("acidity", "Acidity", ocean.acidityClass, ""),
      makeDriver("carbonate", "Carbonate", ocean.carbonateSaturationClass, ""),
      makeDriver("nutrients", "Nutrients", ocean.nutrientSupportClass, ""),
    ],
    evidenceCodes: ["OCEAN_CHEMISTRY_CONTEXT"],
  });
}

function addBiosignatureContextEra(eras, context, model) {
  const bio = biosignatureContextOf(model);
  if (!bio?.applicable) return;
  const interpretation = firstString(bio.interpretationClass);
  if (!interpretation || includesText(interpretation, "No atmospheric")) return;
  const falsePositiveRisk = firstString(bio.o2O3FalsePositiveRisk, "Low");
  const disequilibrium = firstString(bio.disequilibriumStrength, "Low");
  const elevated =
    !includesText(falsePositiveRisk, "low") ||
    !includesText(disequilibrium, "low") ||
    !includesText(firstString(bio.methaneContext), "No methane") ||
    !includesText(firstString(bio.coBuildupRisk), "Low");
  addEra(eras, context, {
    id: "biosignature-context-caution-era",
    label: "Biosignature-context caution era",
    category: "habitability",
    startGyr: context.currentAgeGyr,
    endGyr: null,
    state: "current",
    confidence: normalizeConfidence(bio.confidence, "medium"),
    severity: elevated ? "caution" : "info",
    headline: "Atmospheric biosignature gases require environmental context",
    detail:
      "This event never asserts life. It records false-positive risk, disequilibrium strength, and replenishment demand from the biosignature context model.",
    drivers: [
      makeDriver("interpretation", "Interpretation", interpretation, ""),
      makeDriver("disequilibrium", "Disequilibrium", disequilibrium, ""),
      makeDriver("o2FalsePositive", "O2/O3 false-positive risk", falsePositiveRisk, ""),
      makeDriver("sourceDemand", "Source demand", bio.replenishmentDemandClass, ""),
      makeDriver("methane", "Methane", bio.methaneContext, ""),
    ],
    evidenceCodes: ["BIOSIGNATURE_CONTEXT"],
    warningCodes: ["NO_LIFE_DETECTION_CLAIM"],
  });
}

function addRockyAtmosphereAndHydrosphereEras(eras, context, model) {
  const derived = derivedModel(model);
  const hydrosphere = hydrosphereOf(model);
  const pressureAtm = firstFinite(
    model.atmosphere?.pressureAtm,
    directRockyModel(model).inputs?.pressureAtm,
    derived.pressureKpa == null ? null : derived.pressureKpa / 101.325,
  );
  const xuvRatio = firstFinite(
    derived.jeansEscape?.xuvFluxRatio,
    model.atmosphere?.jeansEscape?.xuvFluxRatio,
  );
  const stripped = derived.jeansEscape?.stripped === true;
  const climateState = firstString(derived.climateState, model.habitability?.climateState);

  if (pressureAtm != null && pressureAtm > 0.001) {
    addEra(eras, context, {
      id: "secondary-atmosphere-outgassing",
      label: "Secondary atmosphere and outgassing",
      category: "atmosphere",
      startGyr: Math.min(0.03, Math.max(context.currentAgeGyr ?? 4.6, 0.03)),
      endGyr: null,
      state: "current",
      confidence: "medium",
      severity: "info",
      headline: "Atmosphere supported by volatile retention or outgassing",
      detail:
        "The current model has a nonzero atmosphere, so the timeline treats atmospheric retention or replenishment as active evidence.",
      drivers: [
        makeDriver("pressureAtm", "Surface pressure", `${formatNumber(pressureAtm, 3)} atm`, ""),
        makeDriver("outgassing", "Outgassing hint", derived.outgassingHint, ""),
        makeDriver(
          "primarySpecies",
          "Primary outgassed species",
          derived.primaryOutgassedSpecies,
          "",
        ),
      ],
      evidenceCodes: ["ATMOSPHERE_PRESENT"],
    });
  }

  if (stripped || (xuvRatio != null && xuvRatio >= 20)) {
    addEra(eras, context, {
      id: "atmospheric-escape-era",
      label: "Atmospheric escape pressure",
      category: "atmosphere",
      startGyr: 0.001,
      endGyr: null,
      state: "current",
      confidence: stripped ? "high" : "medium",
      severity: stripped ? "warning" : "caution",
      headline: "Atmosphere is vulnerable to escape",
      detail:
        "Low retention, high XUV, or the existing escape model indicates that atmospheric loss is an important part of this world's timeline.",
      drivers: [
        makeDriver(
          "xuv",
          "XUV flux",
          xuvRatio == null ? "" : `${formatNumber(xuvRatio, 2)}x Earth`,
          "",
        ),
        makeDriver(
          "escape",
          "Escape filter",
          stripped ? "Stripped gases" : "Elevated loss risk",
          "",
        ),
      ],
      evidenceCodes: ["ATMOSPHERIC_ESCAPE"],
    });
  }

  if (hydrosphere) addHydrosphereEras(eras, context, model, hydrosphere, climateState);
}

function addHydrosphereEras(eras, context, model, hydrosphere = {}, climateState = "") {
  const liquidFraction = firstFinite(
    hydrosphere.surfaceAccessibleLiquidFraction,
    hydrosphere.liquidOceanFraction,
    derivedModel(model).surfaceAccessibleLiquidFraction,
    derivedModel(model).liquidOceanFraction,
  );
  const iceFraction = firstFinite(
    hydrosphere.permanentIceFraction,
    derivedModel(model).permanentIceFraction,
  );
  const steamFraction = firstFinite(hydrosphere.steamFraction, derivedModel(model).steamFraction);
  const meanDepthKm = firstFinite(
    hydrosphere.estimatedMeanOceanDepthKm,
    hydrosphere.estimatedSurfaceOceanDepthKm,
    hydrosphere.estimatedSubsurfaceOceanDepthKm,
  );

  if ((liquidFraction != null && liquidFraction > 0.02) || hydrosphere.surfaceLiquidPresent) {
    addEra(eras, context, {
      id: "surface-water-window",
      label: "Surface-water window",
      category: "hydrosphere",
      startGyr: context.currentAgeGyr == null ? null : Math.max(0.1, context.currentAgeGyr - 0.5),
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: "good",
      headline: "Liquid surface water is part of the current model",
      detail:
        "The hydrosphere output supports accessible surface liquid, so the current era includes a surface-water window.",
      drivers: [
        makeDriver(
          "liquidFraction",
          "Accessible liquid",
          `${formatNumber(liquidFraction * 100, 1)}%`,
          "",
        ),
        makeDriver(
          "meanDepth",
          "Ocean depth",
          meanDepthKm == null ? "" : `${formatNumber(meanDepthKm, 2)} km`,
          "",
        ),
        makeDriver("climateState", "Climate state", climateState, ""),
      ],
      evidenceCodes: ["SURFACE_LIQUID_WATER"],
    });
  }

  if ((steamFraction != null && steamFraction > 0.05) || includesText(climateState, "greenhouse")) {
    addEra(eras, context, {
      id: "steam-greenhouse-era",
      label: "Steam or greenhouse hydrosphere",
      category: "climate",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "medium",
      severity: "warning",
      headline: "Water is limited by high-temperature greenhouse conditions",
      detail:
        "The current climate or hydrosphere state points to steam, moist greenhouse, or runaway greenhouse behavior.",
      drivers: [
        makeDriver(
          "steamFraction",
          "Steam cover",
          steamFraction == null ? "" : `${formatNumber(steamFraction * 100, 1)}%`,
          "",
        ),
        makeDriver("climateState", "Climate state", climateState, ""),
      ],
      evidenceCodes: ["STEAM_OR_GREENHOUSE"],
    });
  }

  if ((iceFraction != null && iceFraction > 0.5) || includesText(climateState, "snowball")) {
    addEra(eras, context, {
      id: "snowball-icehouse-era",
      label: "Snowball or icehouse era",
      category: "climate",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "medium",
      severity: "caution",
      headline: "Surface water is mostly frozen",
      detail: "The current hydrosphere or climate state supports an ice-dominated surface era.",
      drivers: [
        makeDriver(
          "iceFraction",
          "Permanent ice",
          iceFraction == null ? "" : `${formatNumber(iceFraction * 100, 1)}%`,
          "",
        ),
        makeDriver("climateState", "Climate state", climateState, ""),
      ],
      evidenceCodes: ["ICE_DOMINATED_SURFACE"],
    });
  }

  if (
    hydrosphere.subsurfaceOceanPresent ||
    (firstFinite(hydrosphere.subsurfaceOceanScore) ?? 0) >= 0.35
  ) {
    addEra(eras, context, {
      id: "subsurface-ocean-era",
      label: "Subsurface-ocean era",
      category: "hydrosphere",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: hydrosphere.subsurfaceOceanPresent ? "high" : "medium",
      severity: "info",
      headline: "Liquid water may persist below an ice or pressure barrier",
      detail:
        "The hydrosphere model supports an interior ocean signal. This is not the same as surface habitability.",
      drivers: [
        makeDriver(
          "subsurfaceScore",
          "Subsurface-ocean score",
          firstFinite(hydrosphere.subsurfaceOceanScore),
          "",
        ),
        makeDriver(
          "iceShell",
          "Ice shell",
          firstFinite(hydrosphere.estimatedIceShellThicknessKm) == null
            ? ""
            : `${formatNumber(hydrosphere.estimatedIceShellThicknessKm, 2)} km`,
          "",
        ),
        makeDriver(
          "highPressureIce",
          "High-pressure ice",
          hydrosphere.highPressureIceBarrier ? "Present" : "",
          "",
        ),
      ],
      evidenceCodes: ["SUBSURFACE_OCEAN"],
    });
  }
}

function addRockyInteriorAndClimateEras(eras, context, model) {
  const derived = derivedModel(model);
  const climateState = firstString(derived.climateState, model.habitability?.climateState);
  const tectonicRegime = firstString(derived.tectonicRegime, model.display?.tectonicRegime);
  const dynamoActive = derived.dynamoActive === true;
  const habitabilityIndex = firstFinite(
    derived.habitabilityIndex,
    model.habitability?.habitabilityIndex,
  );

  if (tectonicRegime) {
    addEra(eras, context, {
      id: "tectonic-regime-era",
      label: `${titleCase(tectonicRegime.replace(/-/g, " "))} tectonic era`,
      category: "interior",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: tectonicRegime.includes("stagnant") ? "caution" : "info",
      headline: "Current tectonic regime",
      detail: "The timeline uses the existing tectonic model as the current interior state.",
      drivers: [
        makeDriver("tectonicRegime", "Tectonic regime", tectonicRegime, ""),
        makeDriver(
          "radiogenicHeating",
          "Radiogenic heating",
          derived.radiogenicHeatingEarth == null
            ? ""
            : `${formatNumber(derived.radiogenicHeatingEarth, 2)}x Earth`,
          "",
        ),
      ],
      evidenceCodes: ["TECTONIC_MODEL"],
    });
  }

  if (dynamoActive || derived.dynamoActive === false) {
    addEra(eras, context, {
      id: dynamoActive ? "active-dynamo-era" : "dynamo-decline-risk",
      label: dynamoActive ? "Active dynamo era" : "Weak or absent dynamo era",
      category: "interior",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: dynamoActive ? "good" : "caution",
      headline: dynamoActive ? "Magnetic field is active" : "Magnetic protection is weak or absent",
      detail: derived.dynamoReason || "",
      drivers: [
        makeDriver("dynamoReason", "Dynamo reason", derived.dynamoReason, ""),
        makeDriver("fieldLabel", "Field label", derived.fieldLabel, ""),
      ],
      evidenceCodes: ["DYNAMO_MODEL"],
    });
  }

  if (climateState) {
    const hot = includesText(climateState, "greenhouse") || includesText(climateState, "runaway");
    const frozen = includesText(climateState, "snowball") || includesText(climateState, "frozen");
    addEra(eras, context, {
      id: hot ? "runaway-greenhouse-era" : frozen ? "outer-freeze-era" : "temperate-climate-era",
      label: hot
        ? "Greenhouse climate era"
        : frozen
          ? "Frozen climate era"
          : "Temperate climate era",
      category: "climate",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: hot ? "warning" : frozen ? "caution" : "good",
      headline: "Current climate state",
      detail: `The climate model currently resolves this body as ${climateState}.`,
      drivers: [
        makeDriver("climateState", "Climate state", climateState, ""),
        makeDriver(
          "surfaceTemp",
          "Surface temperature",
          derived.surfaceTempK == null ? "" : `${formatNumber(derived.surfaceTempK, 0)} K`,
          "",
        ),
        makeDriver(
          "insolation",
          "Insolation",
          derived.insolationEarth == null
            ? ""
            : `${formatNumber(derived.insolationEarth, 2)}x Earth`,
          "",
        ),
      ],
      evidenceCodes: ["CLIMATE_MODEL"],
    });
  }

  if (
    !SURFACE_HABITABILITY_BLOCKED.has(context.family) &&
    habitabilityIndex != null &&
    habitabilityIndex > 0.35
  ) {
    addEra(eras, context, {
      id: "surface-habitability-window",
      label: "Surface habitability opportunity window",
      category: "habitability",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: habitabilityIndex >= 0.6 ? "medium" : "low",
      severity: "good",
      headline: "Model supports a surface habitability opportunity",
      detail:
        "This is an environmental opportunity window from the habitability score, not biological evidence.",
      drivers: [
        makeDriver(
          "habitabilityIndex",
          "Habitability score",
          formatNumber(habitabilityIndex, 3),
          "",
        ),
        makeDriver(
          "liquidWater",
          "Liquid water possible",
          derived.liquidWaterPossible ? "Yes" : "No",
          "",
        ),
      ],
      evidenceCodes: ["HABITABILITY_OPPORTUNITY"],
    });
  }
}

function addRockyFutureEras(eras, context, model) {
  if (hasSubtype(model, "roguePlanet")) return;
  const derived = derivedModel(model);
  const hydrosphere = hydrosphereOf(model) || {};
  const climateState = firstString(derived.climateState, model.habitability?.climateState);
  const insolationEarth = firstFinite(
    derived.insolationEarth,
    model.orbit?.insolationEarth,
    model.thermal?.insolationEarth,
  );
  const habitabilityIndex = firstFinite(
    derived.habitabilityIndex,
    model.habitability?.habitabilityIndex,
  );
  const surfaceWaterNow =
    hydrosphere.surfaceLiquidPresent ||
    (firstFinite(hydrosphere.surfaceAccessibleLiquidFraction) ?? 0) > 0.02 ||
    derived.liquidWaterPossible === true;
  const hotClimate =
    includesText(climateState, "greenhouse") ||
    includesText(climateState, "runaway") ||
    (insolationEarth != null && insolationEarth >= 1.1);
  const frozenClimate =
    includesText(climateState, "snowball") ||
    includesText(climateState, "frozen") ||
    (insolationEarth != null && insolationEarth <= 0.55);
  const remaining = remainingMainSequenceGyr(context);

  if (surfaceWaterNow || (habitabilityIndex != null && habitabilityIndex > 0.35)) {
    addEra(eras, context, {
      id: "future-surface-water-window-narrowing",
      label: "Future surface-water window narrowing",
      category: "climate",
      startGyr: futureStartGyr(context, 1, 0.25),
      endGyr: null,
      state: futureState(context),
      confidence: remaining == null ? "low" : "medium",
      severity: "caution",
      headline: "Long-term stellar brightening may narrow the surface-water window",
      detail:
        "This is a broad main-sequence forecast from the current star age/lifetime context and surface-water evidence. It is not a time-dependent climate simulation.",
      drivers: [
        makeDriver(
          "remainingMainSequence",
          "Remaining main-sequence context",
          remaining == null ? "Not resolved" : formatGyr(remaining),
          "",
        ),
        makeDriver(
          "insolation",
          "Current insolation",
          insolationEarth == null ? "" : `${formatNumber(insolationEarth, 2)}x Earth`,
          "",
        ),
        makeDriver("surfaceWater", "Surface-water evidence", surfaceWaterNow ? "Present" : "", ""),
      ],
      evidenceCodes: ["FUTURE_STELLAR_BRIGHTENING", "SURFACE_WATER_WINDOW"],
    });
  }

  if (hotClimate || hasSubtype(model, "steamWorld") || hasSubtype(model, "lavaWorld")) {
    addEra(eras, context, {
      id: "future-water-loss-or-greenhouse-risk",
      label: "Future water-loss or greenhouse risk",
      category: "climate",
      startGyr: hotClimate ? context.currentAgeGyr : futureStartGyr(context, 0.5, 0.15),
      endGyr: null,
      state: "conditional",
      confidence: "low",
      severity: "warning",
      headline: "High irradiation or greenhouse state may drive volatile loss",
      detail:
        "The current model can flag greenhouse or high-flux risk, but it does not integrate atmospheric chemistry or ocean loss through time.",
      drivers: [
        makeDriver("climateState", "Climate state", climateState, ""),
        makeDriver(
          "insolation",
          "Insolation",
          insolationEarth == null ? "" : `${formatNumber(insolationEarth, 2)}x Earth`,
          "",
        ),
      ],
      evidenceCodes: ["FUTURE_GREENHOUSE_RISK"],
    });
  } else if (frozenClimate) {
    addEra(eras, context, {
      id: "future-cold-trap-persistence",
      label: "Future cold-trap persistence",
      category: "climate",
      startGyr: futureStartGyr(context, 1, 0.25),
      endGyr: null,
      state: "conditional",
      confidence: "low",
      severity: "caution",
      headline: "Cold surface conditions may persist unless stellar brightening becomes important",
      detail:
        "This flags the present frozen/low-flux state as a long-term climate constraint, not a precise thaw forecast.",
      drivers: [
        makeDriver("climateState", "Climate state", climateState, ""),
        makeDriver(
          "insolation",
          "Insolation",
          insolationEarth == null ? "" : `${formatNumber(insolationEarth, 2)}x Earth`,
          "",
        ),
      ],
      evidenceCodes: ["FUTURE_COLD_TRAP"],
    });
  }

  if (context.family !== "dwarfRocky") {
    addEra(eras, context, {
      id: "future-interior-cooling-transition",
      label: "Future interior-cooling transition",
      category: "interior",
      startGyr: futureStartGyr(context, 2, 0.35),
      endGyr: null,
      state: futureState(context),
      confidence: "low",
      severity: "info",
      headline: "Radiogenic heat and tectonic activity should decline over geological time",
      detail:
        "The app models current radiogenic heating and tectonic regime, but this future row is only a conservative cooling trend.",
      drivers: [
        makeDriver(
          "radiogenicHeating",
          "Radiogenic heating",
          derived.radiogenicHeatingEarth == null
            ? ""
            : `${formatNumber(derived.radiogenicHeatingEarth, 2)}x Earth`,
          "",
        ),
        makeDriver("tectonicRegime", "Current tectonic regime", derived.tectonicRegime, ""),
      ],
      evidenceCodes: ["FUTURE_INTERIOR_COOLING"],
    });
  }
}

function addSubtypeEras(eras, context, model) {
  const subtypes = subtypeIds(model);
  for (const id of subtypes) {
    switch (id) {
      case "oceanWorld":
      case "waterWorld":
        addEra(eras, context, {
          id: `${id}-water-inventory`,
          label: id === "oceanWorld" ? "Ocean-world era" : "Water-world era",
          category: "hydrosphere",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "high",
          severity: "info",
          headline: "High water inventory shapes the current world",
          detail:
            "Subtype evidence supports a water-rich interpretation, with surface access depending on the solved hydrosphere and pressure state.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_WATER_WORLD"],
        });
        break;
      case "icyDwarf":
        addEra(eras, context, {
          id: "icy-dwarf-cold-volatiles",
          label: "Cold volatile-retention era",
          category: "hydrosphere",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "medium",
          severity: "info",
          headline: "Ices and cold volatiles dominate the small body",
          detail:
            "The icy-dwarf subtype supports cautious interpretation of surface ice and volatile retention on a small body.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_ICY_DWARF"],
        });
        break;
      case "lavaWorld":
        addEra(eras, context, {
          id: "lava-surface-era",
          label: "Lava-surface era",
          category: "climate",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "high",
          severity: "warning",
          headline: "Extreme irradiation supports molten surface conditions",
          detail:
            "Ordinary surface climate and habitability assumptions are not valid for this subtype.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_LAVA_WORLD"],
        });
        break;
      case "ironRich":
        addEra(eras, context, {
          id: "iron-rich-differentiation",
          label: "Iron-rich differentiation",
          category: "interior",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "high",
          severity: "info",
          headline: "Dense, core-dominated composition",
          detail:
            "Iron-rich evidence affects interior interpretation, but it does not guarantee a current dynamo.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_IRON_RICH"],
        });
        break;
      case "carbonRich":
        addEra(eras, context, {
          id: "carbon-rich-composition",
          label: "Carbon-rich composition state",
          category: "interior",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "low",
          severity: "info",
          headline: "Carbon-rich evidence is present",
          detail:
            "The timeline records the subtype as composition evidence only; detailed carbon geochemistry is not modeled.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_CARBON_RICH"],
        });
        break;
      case "desertWorld":
        addEra(eras, context, {
          id: "arid-surface-era",
          label: "Arid surface era",
          category: "hydrosphere",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "high",
          severity: "caution",
          headline: "Low water inventory dominates the surface state",
          detail: "Past water is not assumed unless separate model evidence supports it.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_DESERT_WORLD"],
        });
        break;
      case "steamWorld":
        addEra(eras, context, {
          id: "steam-world-era",
          label: "Steam-world era",
          category: "climate",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "high",
          severity: "warning",
          headline: "Water inventory is trapped in a hot steam/greenhouse state",
          detail: "This subtype does not support ordinary solid-surface climate assumptions.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_STEAM_WORLD"],
        });
        break;
      case "hyceanCandidate":
        addEra(eras, context, {
          id: "hycean-candidate-window",
          label: "Hycean candidate window",
          category: "habitability",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "conditional",
          confidence: "low",
          severity: "info",
          headline: "Candidate volatile-ocean interpretation",
          detail:
            "Hycean status is candidate-only here; the model does not confirm a habitable ocean-atmosphere interface or life.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_HYCEAN_CANDIDATE"],
        });
        break;
      case "superPuff":
        addEra(eras, context, {
          id: "super-puff-extended-envelope",
          label: "Extended-envelope era",
          category: "envelope",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "high",
          severity: "caution",
          headline: "Very low density implies an extended atmosphere",
          detail: "The timeline omits solid-surface climate eras for this subtype.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_SUPER_PUFF"],
        });
        break;
      case "chthonianCandidate":
        addEra(eras, context, {
          id: "chthonian-stripped-remnant",
          label: "Stripped-remnant candidate era",
          category: "envelope",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "conditional",
          confidence: "low",
          severity: "caution",
          headline: "Close-in dense remnant candidate",
          detail:
            "Chthonian ancestry remains candidate-only without a full envelope-loss history model.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_CHTHONIAN_CANDIDATE"],
        });
        break;
      case "roguePlanet":
        addEra(eras, context, {
          id: "rogue-isolation-era",
          label: "Hostless isolation era",
          category: "orbital",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "current",
          confidence: "low",
          severity: "caution",
          headline: "No normal stellar-flux context",
          detail:
            "The timeline omits stellar habitable-zone and stellar-brightening eras for rogue candidates.",
          drivers: subtypeDrivers(model, id),
          evidenceCodes: ["SUBTYPE_ROGUE_PLANET"],
        });
        break;
      default:
        break;
    }
  }
}

function subtypeDrivers(model = {}, subtypeId) {
  const subtype = subtypeList(model).find((entry) => entry.id === subtypeId);
  const physical = subtype?.physical || {};
  return [
    makeDriver(
      "subtype",
      "Subtype",
      subtype?.label || subtypeId,
      "Adds subtype-specific timeline context",
    ),
    makeDriver("confidence", "Subtype confidence", subtype?.confidence, ""),
    makeDriver(
      "wmfPct",
      "Water mass fraction",
      physical.wmfPct == null ? "" : `${formatNumber(physical.wmfPct, 2)}%`,
      "",
    ),
    makeDriver(
      "density",
      "Density",
      physical.densityGcm3 == null ? "" : `${formatNumber(physical.densityGcm3, 3)} g/cm3`,
      "",
    ),
    makeDriver(
      "insolation",
      "Insolation",
      physical.insolationEarth == null ? "" : `${formatNumber(physical.insolationEarth, 2)}x Earth`,
      "",
    ),
  ];
}

function addVolatileEras(eras, context, model) {
  const source = volatileModel(model);
  const envelope = source.envelope || model.envelope || model.atmosphere?.envelope || {};
  const physical = source.physical || model.physical || {};
  const thermal = source.thermal || model.thermal || {};
  const envelopePct = firstFinite(
    envelope.massPct,
    source.inputs?.hHeEnvelopeMassPct,
    physical.hHeEnvelopeMassPct,
  );
  const survivalGyr = firstFinite(envelope.survivalTimescaleGyr);
  const envelopeState = firstString(envelope.state, envelope.stateLabel);

  addEra(eras, context, {
    id: "solid-core-formation",
    label: "Solid-core formation",
    category: "formation",
    startGyr: 0,
    endGyr: formationEnd(context.currentAgeGyr, 0.01),
    state: context.currentAgeGyr == null ? "conditional" : "past",
    confidence: "medium",
    severity: "info",
    headline: "Rocky or volatile-rich core assembled early",
    detail:
      "Volatile-envelope planets are interpreted as core plus envelope systems, not exposed solid-surface worlds.",
    drivers: [
      makeDriver("family", "Family", context.family, "Selects volatile-envelope rules"),
      makeDriver("mass", "Mass", displayMass(model), ""),
      makeDriver("radius", "Transit radius", displayRadius(model), ""),
    ],
    evidenceCodes: ["VOLATILE_CORE"],
  });

  if (envelopePct != null && envelopePct > 0.00001) {
    addEra(eras, context, {
      id: "nebular-envelope-capture",
      label: "Nebular H/He envelope capture",
      category: "envelope",
      startGyr: 0,
      endGyr: formationEnd(context.currentAgeGyr, 0.01),
      state: context.currentAgeGyr == null ? "conditional" : "past",
      confidence: "medium",
      severity: "info",
      headline: "A light-gas envelope is part of the modeled body",
      detail: "The broad timing is tied to the protoplanetary disk era rather than an exact date.",
      drivers: [
        makeDriver("envelopeMass", "Envelope mass", `${formatNumber(envelopePct, 4)}%`, ""),
        makeDriver("envelopeState", "Envelope state", envelopeState, ""),
      ],
      evidenceCodes: ["HHE_ENVELOPE"],
    });
  }

  addEra(eras, context, {
    id: "envelope-cooling-contraction",
    label: "Envelope cooling and contraction",
    category: "envelope",
    startGyr: 0.01,
    endGyr: null,
    state: "current",
    confidence: "medium",
    severity: "info",
    headline: "Current radius reflects envelope structure and thermal history",
    detail: "The volatile model exposes radius contribution and age-sensitive envelope state.",
    drivers: [
      makeDriver(
        "envelopeRadius",
        "Envelope radius contribution",
        physical.envelopeRadiusEarth == null
          ? ""
          : `${formatNumber(physical.envelopeRadiusEarth, 3)} Earth radii`,
        "",
      ),
      makeDriver(
        "equilibriumTemp",
        "Equilibrium temperature",
        thermal.equilibriumTempK == null ? "" : `${formatNumber(thermal.equilibriumTempK, 0)} K`,
        "",
      ),
    ],
    evidenceCodes: ["ENVELOPE_STRUCTURE"],
  });

  if (
    ["eroding", "stripping", "stripped"].includes(envelopeState) ||
    (survivalGyr != null && survivalGyr < (context.currentAgeGyr ?? 4.6) * 2)
  ) {
    addEra(eras, context, {
      id: "photoevaporation-or-core-powered-loss",
      label: "Envelope-loss pressure",
      category: "envelope",
      startGyr: 0.001,
      endGyr: null,
      state: envelopeState === "stripping" ? "current" : "conditional",
      confidence: "medium",
      severity: envelopeState === "stripping" ? "warning" : "caution",
      headline: "The envelope is vulnerable to loss",
      detail:
        "The volatile model indicates erosion, stripping, or an envelope survival timescale near the modeled age.",
      drivers: [
        makeDriver("envelopeState", "Envelope state", envelopeState, ""),
        makeDriver(
          "survival",
          "Survival timescale",
          survivalGyr == null ? "" : formatGyr(survivalGyr),
          "",
        ),
        makeDriver(
          "xuv",
          "XUV flux",
          envelope.xuvFluxRatioEarth == null
            ? ""
            : `${formatNumber(envelope.xuvFluxRatioEarth, 2)}x Earth`,
          "",
        ),
      ],
      evidenceCodes: ["ENVELOPE_LOSS"],
    });
  }

  if (context.family === "radiusValley" || context.family === "volatileCandidate") {
    addEra(eras, context, {
      id: "radius-valley-transition",
      label: "Rocky/volatile boundary era",
      category: "envelope",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "conditional",
      confidence: "low",
      severity: "caution",
      headline: "Ancestry is ambiguous near the radius valley",
      detail:
        "The timeline does not assume a fully exposed surface or a retained envelope without stronger model evidence.",
      drivers: [makeDriver("family", "Family", context.family, "Boundary classification")],
      evidenceCodes: ["RADIUS_VALLEY_BOUNDARY"],
    });
  }
}

function addVolatileFutureEras(eras, context, model) {
  const source = volatileModel(model);
  const envelope = source.envelope || model.envelope || {};
  const physical = source.physical || model.physical || {};
  const thermal = source.thermal || model.thermal || {};
  const survivalGyr = firstFinite(envelope.survivalTimescaleGyr);
  const envelopeState = firstString(envelope.state, envelope.stateLabel);

  addEra(eras, context, {
    id: "future-envelope-cooling-transition",
    label: "Future envelope cooling and radius evolution",
    category: "envelope",
    startGyr: futureStartGyr(context, 1, 0.25),
    endGyr: null,
    state: futureState(context),
    confidence: "low",
    severity: "info",
    headline: "The envelope should keep cooling and contracting over time",
    detail:
      "This is a qualitative forecast from the current volatile-radius model, not a full thermal-evolution integration.",
    drivers: [
      makeDriver("envelopeState", "Current envelope state", envelopeState, ""),
      makeDriver(
        "envelopeRadius",
        "Envelope radius contribution",
        physical.envelopeRadiusEarth == null
          ? ""
          : `${formatNumber(physical.envelopeRadiusEarth, 3)} Earth radii`,
        "",
      ),
      makeDriver(
        "equilibriumTemp",
        "Equilibrium temperature",
        thermal.equilibriumTempK == null ? "" : `${formatNumber(thermal.equilibriumTempK, 0)} K`,
        "",
      ),
    ],
    evidenceCodes: ["FUTURE_ENVELOPE_COOLING"],
  });

  if (survivalGyr != null && survivalGyr < 1000) {
    addEra(eras, context, {
      id: "future-envelope-loss-transition",
      label: "Future envelope-loss transition",
      category: "envelope",
      startGyr:
        context.currentAgeGyr == null ? null : context.currentAgeGyr + Math.max(0.001, survivalGyr),
      endGyr: null,
      state: futureState(context),
      confidence: survivalGyr < 10 ? "medium" : "low",
      severity: survivalGyr < 10 ? "warning" : "caution",
      headline: "Current escape rate gives a possible future envelope-loss timescale",
      detail:
        "The survival timescale is based on the current escape estimate; changing XUV history or envelope structure could shift it substantially.",
      drivers: [
        makeDriver("survival", "Current survival timescale", formatGyr(survivalGyr), ""),
        makeDriver("envelopeState", "Envelope state", envelopeState, ""),
        makeDriver(
          "xuv",
          "XUV flux",
          envelope.xuvFluxRatioEarth == null
            ? ""
            : `${formatNumber(envelope.xuvFluxRatioEarth, 2)}x Earth`,
          "",
        ),
      ],
      evidenceCodes: ["FUTURE_ENVELOPE_LOSS"],
    });
  }
}

function addGiantEras(eras, context, model) {
  const source = giantModel(model);
  const classification = source.classification || model.classification || {};
  const physical = source.physical || model.physical || {};
  const thermal = source.thermal || model.thermal || {};
  const magnetic = source.magnetic || {};
  const ringProperties = source.ringProperties || model.rings || {};
  const massLoss = source.massLoss || {};
  const jeansEscape = source.jeansEscape || {};

  addEra(eras, context, {
    id:
      context.family === "iceGiant"
        ? "volatile-rich-ice-giant-formation"
        : "core-and-envelope-assembly",
    label:
      context.family === "iceGiant"
        ? "Volatile-rich giant formation"
        : "Core and envelope assembly",
    category: "formation",
    startGyr: 0,
    endGyr: formationEnd(context.currentAgeGyr, 0.01),
    state: context.currentAgeGyr == null ? "conditional" : "past",
    confidence: "medium",
    severity: "info",
    headline: "Giant-planet formation is tied to early disk conditions",
    detail:
      context.family === "iceGiant"
        ? "The model treats this as a volatile-rich giant rather than a solid-surface world."
        : "The model supports giant-envelope formation, but the exact accretion history is not solved.",
    drivers: [
      makeDriver("family", "Family", context.family, "Selects giant rules"),
      makeDriver("mass", "Mass", displayMass(model), ""),
      makeDriver(
        "metallicity",
        "Metallicity",
        source.inputs?.metallicitySolar == null
          ? ""
          : `${formatNumber(source.inputs.metallicitySolar, 2)}x solar`,
        "",
      ),
    ],
    evidenceCodes: ["GIANT_FORMATION"],
  });

  if (context.family === "gasGiant") {
    addEra(eras, context, {
      id: "runaway-gas-accretion",
      label: "Runaway gas-accretion era",
      category: "envelope",
      startGyr: 0,
      endGyr: formationEnd(context.currentAgeGyr, 0.01),
      state: context.currentAgeGyr == null ? "conditional" : "past",
      confidence: "medium",
      severity: "info",
      headline: "Mass is in the gas-giant envelope regime",
      detail: "This era is broad because the app does not simulate protoplanetary disk accretion.",
      drivers: [
        makeDriver(
          "massMjup",
          "Mass",
          physical.massMjup == null ? "" : `${formatNumber(physical.massMjup, 3)} Mjup`,
          "",
        ),
      ],
      evidenceCodes: ["RUNAWAY_GAS_ACCRETION"],
    });
  }

  addEra(eras, context, {
    id: "giant-cooling-contraction",
    label: "Cooling and contraction era",
    category: "interior",
    startGyr: 0.01,
    endGyr: null,
    state: "current",
    confidence: "high",
    severity: "info",
    headline: "Internal heat and radius evolution shape the current giant",
    detail:
      "The giant model exposes internal heat, effective temperature, and radius-age diagnostics.",
    drivers: [
      makeDriver(
        "effectiveTemp",
        "Effective temperature",
        thermal.effectiveTempK == null ? "" : `${formatNumber(thermal.effectiveTempK, 0)} K`,
        "",
      ),
      makeDriver(
        "internalHeat",
        "Internal heat ratio",
        thermal.internalHeatRatio == null ? "" : `${formatNumber(thermal.internalHeatRatio, 2)}x`,
        "",
      ),
      makeDriver("radiusAgeNote", "Radius note", physical.radiusAgeNote, ""),
    ],
    evidenceCodes: ["GIANT_COOLING"],
  });

  if (physical.hotJupiterInflationActive || (thermal.incidentFluxWm2 ?? 0) > 2e5) {
    addEra(eras, context, {
      id: "hot-giant-inflation-era",
      label: "Hot-giant inflation era",
      category: "envelope",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: "caution",
      headline: "Strong irradiation inflates the observed radius",
      detail: "The gas-giant radius model flags current irradiation-driven inflation.",
      drivers: [
        makeDriver(
          "incidentFlux",
          "Incident flux",
          thermal.incidentFluxWm2 == null ? "" : `${formatNumber(thermal.incidentFluxWm2, 0)} W/m2`,
          "",
        ),
        makeDriver(
          "radiusInflation",
          "Radius inflation",
          physical.radiusInflationFactor == null
            ? ""
            : `${formatNumber(physical.radiusInflationFactor, 3)}x`,
          "",
        ),
      ],
      evidenceCodes: ["HOT_GIANT_INFLATION"],
    });
  }

  addEra(eras, context, {
    id: "giant-atmosphere-cloud-era",
    label: "Atmosphere and cloud-class era",
    category: "atmosphere",
    startGyr: context.currentAgeGyr,
    endGyr: null,
    state: "current",
    confidence: "high",
    severity: "info",
    headline: "Cloud chemistry follows the current thermal state",
    detail: "This describes atmospheric layers and clouds, not a solid surface.",
    drivers: [
      makeDriver(
        "classification",
        "Class",
        firstString(classification.label, classification.subtype),
        "",
      ),
      makeDriver("cloudType", "Cloud type", classification.cloudType, ""),
    ],
    evidenceCodes: ["GIANT_ATMOSPHERE"],
  });

  if (magnetic.fieldLabel || magnetic.surfaceFieldGauss != null) {
    addEra(eras, context, {
      id: "giant-magnetosphere-era",
      label: "Magnetosphere era",
      category: "radiation",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: "info",
      headline: "Magnetic field and magnetosphere shape the local radiation environment",
      detail: "This is especially important for rings and moons orbiting the giant.",
      drivers: [
        makeDriver("field", "Field", magnetic.fieldLabel, ""),
        makeDriver(
          "magnetopause",
          "Magnetopause",
          magnetic.magnetopauseRp == null ? "" : `${formatNumber(magnetic.magnetopauseRp, 1)} Rp`,
          "",
        ),
      ],
      evidenceCodes: ["GIANT_MAGNETOSPHERE"],
    });
  }

  if (
    ringProperties.ringType ||
    source.gravity?.rocheLimit_iceKm != null ||
    thermal.moonTidalHeatingW > 0
  ) {
    addEra(eras, context, {
      id: "ring-and-moon-system-era",
      label: "Ring and moon-system era",
      category: "orbital",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "medium",
      severity: "info",
      headline: "Roche zone, rings, and moons are part of the current system state",
      detail: "Ring origin is not assumed unless a source is explicitly modeled.",
      drivers: [
        makeDriver("ringType", "Ring type", ringProperties.ringType, ""),
        makeDriver(
          "rocheIce",
          "Ice Roche limit",
          source.gravity?.rocheLimit_iceKm == null
            ? ""
            : `${formatNumber(source.gravity.rocheLimit_iceKm, 0)} km`,
          "",
        ),
        makeDriver(
          "moonTidalHeating",
          "Moon tidal heating",
          thermal.moonTidalHeatingW == null
            ? ""
            : `${formatNumber(thermal.moonTidalHeatingW, 1)} W`,
          "",
        ),
      ],
      evidenceCodes: ["GIANT_RING_MOON_SYSTEM"],
    });
  }

  if (
    (massLoss.xuvFluxRatioEarth ?? jeansEscape.xuvFluxRatio ?? 0) > 100 ||
    (massLoss.massLossRateKgS ?? 0) > 0
  ) {
    addEra(eras, context, {
      id: "giant-mass-loss-risk",
      label: "Atmospheric mass-loss risk",
      category: "atmosphere",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "conditional",
      confidence: "medium",
      severity: "caution",
      headline: "High-energy flux may erode the upper atmosphere",
      detail:
        "Mass loss is only emphasized when the existing giant model exposes elevated escape conditions.",
      drivers: [
        makeDriver(
          "xuv",
          "XUV flux",
          (massLoss.xuvFluxRatioEarth ?? jeansEscape.xuvFluxRatio) == null
            ? ""
            : `${formatNumber(massLoss.xuvFluxRatioEarth ?? jeansEscape.xuvFluxRatio, 2)}x Earth`,
          "",
        ),
        makeDriver(
          "massLoss",
          "Mass-loss rate",
          massLoss.massLossRateKgS == null
            ? ""
            : `${formatNumber(massLoss.massLossRateKgS, 2)} kg/s`,
          "",
        ),
      ],
      evidenceCodes: ["GIANT_MASS_LOSS"],
    });
  }
}

function addGiantFutureEras(eras, context, model) {
  const source = giantModel(model);
  const classification = source.classification || model.classification || {};
  const thermal = source.thermal || model.thermal || {};
  const massLoss = source.massLoss || {};
  const jeansEscape = source.jeansEscape || {};

  addEra(eras, context, {
    id: "future-giant-cooling-cloud-shift",
    label: "Future cooling and cloud-class shift",
    category: "atmosphere",
    startGyr: futureStartGyr(context, 1, 0.25),
    endGyr: null,
    state: futureState(context),
    confidence: "low",
    severity: "info",
    headline: "Long-term cooling may shift cloud chemistry and emitted heat",
    detail:
      "The giant model gives the present thermal/cloud class; this forecast is qualitative and avoids exact colour or chemistry dates.",
    drivers: [
      makeDriver(
        "effectiveTemp",
        "Effective temperature",
        thermal.effectiveTempK == null ? "" : `${formatNumber(thermal.effectiveTempK, 0)} K`,
        "",
      ),
      makeDriver("cloudType", "Current cloud type", classification.cloudType, ""),
      makeDriver(
        "internalHeat",
        "Internal heat ratio",
        thermal.internalHeatRatio == null ? "" : `${formatNumber(thermal.internalHeatRatio, 2)}x`,
        "",
      ),
    ],
    evidenceCodes: ["FUTURE_GIANT_COOLING"],
  });

  if (
    (massLoss.xuvFluxRatioEarth ?? jeansEscape.xuvFluxRatio ?? 0) > 100 ||
    (massLoss.massLossRateKgS ?? 0) > 0
  ) {
    addEra(eras, context, {
      id: "future-giant-upper-atmosphere-loss",
      label: "Future upper-atmosphere loss risk",
      category: "atmosphere",
      startGyr: futureStartGyr(context, 0.5, 0.1),
      endGyr: null,
      state: "conditional",
      confidence: "low",
      severity: "caution",
      headline: "Elevated high-energy flux could keep eroding the upper atmosphere",
      detail:
        "This is a risk flag from current escape diagnostics, not an integrated mass-loss history.",
      drivers: [
        makeDriver(
          "xuv",
          "XUV flux",
          (massLoss.xuvFluxRatioEarth ?? jeansEscape.xuvFluxRatio) == null
            ? ""
            : `${formatNumber(massLoss.xuvFluxRatioEarth ?? jeansEscape.xuvFluxRatio, 2)}x Earth`,
          "",
        ),
        makeDriver(
          "massLoss",
          "Mass-loss rate",
          massLoss.massLossRateKgS == null
            ? ""
            : `${formatNumber(massLoss.massLossRateKgS, 2)} kg/s`,
          "",
        ),
      ],
      evidenceCodes: ["FUTURE_GIANT_ESCAPE"],
    });
  }
}

function addBrownDwarfEras(eras, context, model) {
  const source = giantModel(model);
  const classification = source.classification || model.classification || {};
  const thermal = source.thermal || model.thermal || {};
  const magnetic = source.magnetic || {};
  const display = source.display || model.display || model.visuals?.display || {};

  addEra(eras, context, {
    id: "substellar-formation",
    label: "Substellar companion formation",
    category: "formation",
    startGyr: 0,
    endGyr: formationEnd(context.currentAgeGyr, 0.01),
    state: context.currentAgeGyr == null ? "conditional" : "past",
    confidence: "medium",
    severity: "info",
    headline: "Object is above the brown-dwarf mass threshold",
    detail:
      "The timeline treats this as a substellar companion, not a planet with a solid surface.",
    drivers: [
      makeDriver("mass", "Mass", displayMass(model), ""),
      makeDriver(
        "class",
        "Class",
        firstString(classification.substellarClass, classification.spectralFamily),
        "",
      ),
    ],
    evidenceCodes: ["BROWN_DWARF"],
  });

  if (
    includesText(display.coolingState, "Deuterium") ||
    source.brownDwarf?.deuteriumBurningActive
  ) {
    addEra(eras, context, {
      id: "deuterium-burning-window",
      label: "Deuterium-burning window",
      category: "substellar",
      startGyr: 0,
      endGyr:
        firstFinite(source.brownDwarf?.deuteriumBurningWindowGyr) ??
        formationEnd(context.currentAgeGyr, 0.1),
      state: includesText(display.coolingState, "Deuterium-burning") ? "current" : "past",
      confidence: "medium",
      severity: "info",
      headline: "Short-lived deuterium burning is supported by the solved model",
      detail:
        "This era is included only because the brown-dwarf output exposes a deuterium-burning state or window.",
      drivers: [makeDriver("coolingState", "Cooling state", display.coolingState, "")],
      evidenceCodes: ["DEUTERIUM_BURNING"],
    });
  }

  addEra(eras, context, {
    id: "brown-dwarf-cooling-era",
    label: "Brown-dwarf cooling era",
    category: "substellar",
    startGyr: 0.01,
    endGyr: null,
    state: "current",
    confidence: "high",
    severity: "info",
    headline: "Substellar luminosity declines with age",
    detail:
      "The current spectral class, effective temperature, and luminosity describe a cooling brown dwarf.",
    drivers: [
      makeDriver(
        "effectiveTemp",
        "Effective temperature",
        thermal.effectiveTempK == null ? "" : `${formatNumber(thermal.effectiveTempK, 0)} K`,
        "",
      ),
      makeDriver(
        "luminosity",
        "Luminosity",
        thermal.luminosityLsol == null ? "" : `${formatNumber(thermal.luminosityLsol, 8)} Lsol`,
        "",
      ),
      makeDriver(
        "spectral",
        "Spectral family",
        firstString(classification.spectralFamily, display.classification),
        "",
      ),
    ],
    evidenceCodes: ["BROWN_DWARF_COOLING"],
  });

  if (classification.cloudType || classification.spectralFamily) {
    addEra(eras, context, {
      id: "brown-dwarf-cloud-transition",
      label: "Substellar cloud chemistry era",
      category: "atmosphere",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "medium",
      severity: "info",
      headline: "Cloud chemistry follows the current substellar class",
      detail:
        "The timeline uses the solved spectral/cloud class and avoids detailed chemistry beyond it.",
      drivers: [
        makeDriver("cloudType", "Cloud type", classification.cloudType, ""),
        makeDriver("spectralFamily", "Spectral family", classification.spectralFamily, ""),
      ],
      evidenceCodes: ["BROWN_DWARF_CLOUDS"],
    });
  }

  if (magnetic.fieldLabel || magnetic.surfaceFieldGauss != null) {
    addEra(eras, context, {
      id: "substellar-magnetic-era",
      label: "Substellar magnetic era",
      category: "radiation",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: "caution",
      headline: "Strong substellar magnetic activity shapes nearby environments",
      detail: "This is radiation and magnetosphere context, not surface habitability.",
      drivers: [
        makeDriver("field", "Field", magnetic.fieldLabel, ""),
        makeDriver(
          "surfaceField",
          "Surface field",
          magnetic.surfaceFieldGauss == null
            ? ""
            : `${formatNumber(magnetic.surfaceFieldGauss, 1)} G`,
          "",
        ),
      ],
      evidenceCodes: ["SUBSTELLAR_MAGNETISM"],
    });
  }
}

function addBrownDwarfFutureEras(eras, context, model) {
  const source = giantModel(model);
  const classification = source.classification || model.classification || {};
  const thermal = source.thermal || model.thermal || {};

  addEra(eras, context, {
    id: "future-brown-dwarf-cooling-transition",
    label: "Future substellar cooling transition",
    category: "substellar",
    startGyr: futureStartGyr(context, 1, 0.25),
    endGyr: null,
    state: futureState(context),
    confidence: "low",
    severity: "info",
    headline: "Brown dwarfs continue fading and cooling with age",
    detail:
      "The timeline records the qualitative direction of cooling, not a precise future spectral-class boundary.",
    drivers: [
      makeDriver(
        "effectiveTemp",
        "Effective temperature",
        thermal.effectiveTempK == null ? "" : `${formatNumber(thermal.effectiveTempK, 0)} K`,
        "",
      ),
      makeDriver("spectralFamily", "Current spectral family", classification.spectralFamily, ""),
    ],
    evidenceCodes: ["FUTURE_BROWN_DWARF_COOLING"],
  });
}

function addMoonEras(eras, context, model) {
  const compositionClass = firstString(
    model.tides?.compositionClass,
    model.display?.compositionClass,
    model.inputs?.compositionOverride,
  );
  const hydrosphere = model.habitability?.hydrosphere || model.hydrosphere || {};
  const climate = model.climate || {};
  const radiation = model.radiation || {};
  const tides = model.tides || {};
  const geology = model.geology || {};
  const resonance = model.resonance || {};
  const habitabilitySummary = model.habitability?.summary || {};

  addEra(eras, context, {
    id: "moon-accretion-or-capture",
    label: "Moon formation or capture",
    category: "formation",
    startGyr: 0,
    endGyr: formationEnd(context.currentAgeGyr, 0.1),
    state: context.currentAgeGyr == null ? "conditional" : "past",
    confidence: "low",
    severity: "info",
    headline: "Formation pathway is broad unless the model exposes a specific scenario",
    detail: firstString(model.formation?.scenarioLabel)
      ? `Current formation context: ${model.formation.scenarioLabel}.`
      : "The current moon model does not solve a unique formation history.",
    drivers: [
      makeDriver("composition", "Composition", compositionClass, ""),
      makeDriver("formation", "Formation", model.formation?.scenarioLabel, ""),
    ],
    evidenceCodes: ["MOON_FORMATION"],
  });

  if (compositionClass) {
    addEra(eras, context, {
      id: "moon-material-era",
      label: `${compositionClass} material era`,
      category: "interior",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: includesText(compositionClass, "molten") ? "warning" : "info",
      headline: "Current material class controls thermal and tidal response",
      detail: "The moon timeline keys composition from the existing tidal/material model.",
      drivers: [
        makeDriver("composition", "Composition", compositionClass, ""),
        makeDriver(
          "rigidity",
          "Rigidity",
          tides.rigidityMoonGPa == null ? "" : `${formatNumber(tides.rigidityMoonGPa, 2)} GPa`,
          "",
        ),
        makeDriver("q", "Tidal Q", tides.qMoon, ""),
      ],
      evidenceCodes: ["MOON_MATERIAL_CLASS"],
    });
  }

  addHydrosphereEras(eras, context, model, hydrosphere, firstString(climate.climateState));

  if (
    (tides.tidalHeatingEarth ?? 0) > 0.05 ||
    (geology.volcanicActivityScore ?? 0) > 0.2 ||
    (geology.cryovolcanicActivityScore ?? 0) > 0.2
  ) {
    addEra(eras, context, {
      id: "tidal-heating-era",
      label: "Tidal-heating era",
      category: "interior",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: (tides.tidalHeatingEarth ?? 0) > 10 ? "warning" : "info",
      headline: "Tides are important to the moon's interior state",
      detail:
        "Tidal heat can support volcanism, cryovolcanism, or interior oceans, but excessive heat can be hostile.",
      drivers: [
        makeDriver(
          "tidalHeating",
          "Tidal heating",
          tides.tidalHeatingEarth == null
            ? ""
            : `${formatNumber(tides.tidalHeatingEarth, 2)}x Earth`,
          "",
        ),
        makeDriver("volcanism", "Volcanic activity", geology.volcanicActivity, ""),
        makeDriver("cryovolcanism", "Cryovolcanic activity", geology.cryovolcanicActivity, ""),
      ],
      evidenceCodes: ["MOON_TIDAL_HEATING"],
    });
  }

  const tidalPersistence = tidalPersistenceContextOf(model);
  const sustainedTidalHeatingClass = firstString(
    tidalPersistence?.sustainedTidalHeatingClass,
    tidalPersistence?.sustainedHeatingClass,
  );
  if (sustainedTidalHeatingClass && sustainedTidalHeatingClass !== "unknown") {
    const copy = tidalPersistenceTimelineCopy(sustainedTidalHeatingClass);
    addEra(eras, context, {
      id: "tidal-heating-persistence-context",
      label: "Tidal-heating persistence context",
      category: "orbital",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: tidalPersistence?.confidence || "low",
      severity: copy.severity,
      headline: copy.headline,
      detail: copy.detail,
      drivers: [
        makeDriver(
          "currentTidalHeating",
          "Current heating",
          tidalPersistence?.currentTidalHeatingClass || "",
          "",
        ),
        makeDriver("sustainedTidalHeating", "Sustained context", sustainedTidalHeatingClass, ""),
        makeDriver(
          "supportingMechanism",
          "Supporting mechanism",
          tidalPersistence?.supportingMechanism || "",
          "",
        ),
        makeDriver("limitingFactor", "Limiting factor", tidalPersistence?.limitingFactor || "", ""),
      ],
      evidenceCodes: ["MOON_TIDAL_PERSISTENCE"],
    });
  }

  if (firstString(climate.climateState)) {
    addEra(eras, context, {
      id: "moon-climate-era",
      label: `${climate.climateState} moon climate era`,
      category: "climate",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: includesText(climate.climateState, "runaway")
        ? "warning"
        : includesText(climate.climateState, "snowball")
          ? "caution"
          : "info",
      headline: "Current moon climate state",
      detail:
        "The moon climate model includes day-night contrast, atmosphere collapse, planetshine, and eclipse effects when available.",
      drivers: [
        makeDriver("climate", "Climate state", climate.climateState, ""),
        makeDriver("collapse", "Atmospheric collapse", climate.collapseState, ""),
        makeDriver(
          "planetshine",
          "Planetshine",
          climate.planetshineFluxWm2 == null
            ? ""
            : `${formatNumber(climate.planetshineFluxWm2, 2)} W/m2`,
          "",
        ),
      ],
      evidenceCodes: ["MOON_CLIMATE"],
    });
  }

  if (radiation.surfaceClass || radiation.subsurfaceClass) {
    addEra(eras, context, {
      id: "moon-radiation-era",
      label: "Radiation-environment era",
      category: "radiation",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: ["Harsh", "Extreme"].includes(radiation.surfaceClass) ? "warning" : "info",
      headline: "Parent magnetosphere and shielding shape surface exposure",
      detail: "Surface and subsurface radiation classes are treated separately.",
      drivers: [
        makeDriver("surfaceRadiation", "Surface radiation", radiation.surfaceClass, ""),
        makeDriver("subsurfaceRadiation", "Subsurface radiation", radiation.subsurfaceClass, ""),
        makeDriver(
          "shielding",
          "Combined shielding",
          radiation.combinedShielding == null ? "" : formatNumber(radiation.combinedShielding, 2),
          "",
        ),
      ],
      evidenceCodes: ["MOON_RADIATION"],
    });
  }

  if (model.spinState?.state || tides.spinState?.state) {
    const spin = model.spinState || tides.spinState;
    addEra(eras, context, {
      id: "tidal-locking-era",
      label: "Tidal-locking or spin-resonance era",
      category: "orbital",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "high",
      severity: "info",
      headline: "Spin state is controlled by tidal evolution",
      detail: "The timeline records the current spin state without claiming exact locking history.",
      drivers: [
        makeDriver("spinState", "Spin state", spin.state, ""),
        makeDriver("ratio", "Resonance ratio", spin.ratio, ""),
      ],
      evidenceCodes: ["MOON_SPIN_STATE"],
    });
  }

  if (
    resonance.nearestResonance ||
    resonance.laplaceStatus ||
    firstFinite(resonance.forcedEccentricity) > 0
  ) {
    addEra(eras, context, {
      id: "orbital-resonance-era",
      label: "Orbital-resonance era",
      category: "orbital",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "medium",
      severity: "info",
      headline: "Resonance may maintain eccentricity and tidal heating",
      detail:
        "The resonance model provides current dynamical context, not a full migration history.",
      drivers: [
        makeDriver("nearestResonance", "Nearest resonance", resonance.nearestResonance?.label, ""),
        makeDriver("laplace", "Laplace status", resonance.laplaceStatus, ""),
        makeDriver("forcedEccentricity", "Forced eccentricity", resonance.forcedEccentricity, ""),
      ],
      evidenceCodes: ["MOON_RESONANCE"],
    });
  }

  if (
    firstFinite(tides.timeToRocheGyr) != null ||
    firstFinite(tides.timeToEscapeGyr) != null ||
    !includesText(model.display?.orbitalFate, "stable")
  ) {
    const timeToRoche = firstFinite(tides.timeToRocheGyr);
    const timeToEscape = firstFinite(tides.timeToEscapeGyr);
    if (
      (timeToRoche != null && timeToRoche < 1000) ||
      (timeToEscape != null && timeToEscape < 1000)
    ) {
      addEra(eras, context, {
        id: "orbital-decay-or-escape-risk",
        label: "Orbital decay or escape risk",
        category: "orbital",
        startGyr:
          context.currentAgeGyr == null
            ? null
            : context.currentAgeGyr + Math.min(timeToRoche ?? Infinity, timeToEscape ?? Infinity),
        endGyr: null,
        state: "future",
        confidence: "medium",
        severity: "warning",
        headline: "Orbital fate model indicates long-term migration risk",
        detail:
          "This follows the current orbital-fate model. Small cohesive moon Roche-limit exceptions should be respected by that model.",
        drivers: [
          makeDriver(
            "timeToRoche",
            "Time to Roche",
            timeToRoche == null ? "" : formatGyr(timeToRoche),
            "",
          ),
          makeDriver(
            "timeToEscape",
            "Time to escape",
            timeToEscape == null ? "" : formatGyr(timeToEscape),
            "",
          ),
          makeDriver("displayFate", "Orbital fate", model.display?.orbitalFate, ""),
        ],
        evidenceCodes: ["MOON_ORBITAL_FATE"],
      });
    }
  }

  if (
    firstString(habitabilitySummary.primaryOutcome) &&
    !includesText(habitabilitySummary.primaryOutcome, "No")
  ) {
    addEra(eras, context, {
      id: includesText(habitabilitySummary.primaryOutcome, "Subsurface")
        ? "subsurface-habitability-window"
        : "moon-habitability-opportunity-window",
      label: includesText(habitabilitySummary.primaryOutcome, "Subsurface")
        ? "Subsurface habitability opportunity window"
        : "Moon habitability opportunity window",
      category: "habitability",
      startGyr: context.currentAgeGyr,
      endGyr: null,
      state: "current",
      confidence: "low",
      severity: "good",
      headline: "Environmental conditions create a habitability opportunity",
      detail:
        "This uses the moon habitability output as an opportunity label only, not biological evidence.",
      drivers: [
        makeDriver("primaryOutcome", "Primary outcome", habitabilitySummary.primaryOutcome, ""),
        makeDriver("surfaceOutcome", "Surface outcome", habitabilitySummary.surfaceOutcome, ""),
        makeDriver(
          "subsurfaceOutcome",
          "Subsurface outcome",
          habitabilitySummary.subsurfaceOutcome,
          "",
        ),
      ],
      evidenceCodes: ["MOON_HABITABILITY_OPPORTUNITY"],
    });
  }
}

function addMoonFutureEras(eras, context, model) {
  const tides = model.tides || {};
  const resonance = model.resonance || {};
  const radiation = model.radiation || {};
  const tidalHeatingEarth = firstFinite(tides.tidalHeatingEarth);
  const recessionCmYr = firstFinite(tides.recessionCmYr);
  const migrationTrend = firstString(
    resonance.migrationTrendState,
    resonance.migrationTrend,
    model.display?.migrationTrend,
  );
  const orbitalFate = firstString(model.display?.orbitalFate);

  if (
    tidalHeatingEarth != null &&
    tidalHeatingEarth > 0.05 &&
    !eras.some((era) => era.id === "future-tidal-heating-variability")
  ) {
    addEra(eras, context, {
      id: "future-tidal-heating-variability",
      label: "Future tidal-heating variability",
      category: "interior",
      startGyr: futureStartGyr(context, 0.5, 0.15),
      endGyr: null,
      state: "conditional",
      confidence: "low",
      severity: tidalHeatingEarth > 10 ? "warning" : "caution",
      headline: "Resonance and migration may change tidal heat over time",
      detail:
        "The current moon model solves present tidal heating, but long-term eccentricity pumping and damping are only flagged qualitatively.",
      drivers: [
        makeDriver(
          "tidalHeating",
          "Tidal heating",
          `${formatNumber(tidalHeatingEarth, 2)}x Earth`,
          "",
        ),
        makeDriver("migrationTrend", "Migration trend", migrationTrend, ""),
        makeDriver("nearestResonance", "Nearest resonance", resonance.nearestResonance?.label, ""),
      ],
      evidenceCodes: ["FUTURE_TIDAL_HEATING_VARIABILITY"],
    });
  }

  if (
    (recessionCmYr != null && Math.abs(recessionCmYr) > 0.001) ||
    (migrationTrend && !includesText(migrationTrend, "neutral")) ||
    (orbitalFate && !includesText(orbitalFate, "stable"))
  ) {
    addEra(eras, context, {
      id: "future-orbital-migration-watch",
      label: "Future orbital migration watch",
      category: "orbital",
      startGyr: futureStartGyr(context, 1, 0.25),
      endGyr: null,
      state: "conditional",
      confidence: "low",
      severity: "caution",
      headline: "Current tidal migration may alter the moon's long-term orbit",
      detail:
        "This row flags direction and risk from the current orbital model; it is not a full multi-moon angular-momentum integration.",
      drivers: [
        makeDriver(
          "recession",
          "Recession",
          recessionCmYr == null ? "" : `${formatNumber(recessionCmYr, 3)} cm/yr`,
          "",
        ),
        makeDriver("migrationTrend", "Migration trend", migrationTrend, ""),
        makeDriver("orbitalFate", "Orbital fate", orbitalFate, ""),
      ],
      evidenceCodes: ["FUTURE_MOON_MIGRATION"],
    });
  }

  if (["Harsh", "Extreme"].includes(radiation.surfaceClass)) {
    addEra(eras, context, {
      id: "future-radiation-weathering-risk",
      label: "Future radiation weathering risk",
      category: "radiation",
      startGyr: futureStartGyr(context, 0.5, 0.15),
      endGyr: null,
      state: "conditional",
      confidence: "low",
      severity: "caution",
      headline: "Persistent radiation exposure can keep modifying the surface environment",
      detail:
        "The model exposes current radiation classes only, so this is a qualitative persistence risk.",
      drivers: [
        makeDriver("surfaceRadiation", "Surface radiation", radiation.surfaceClass, ""),
        makeDriver("subsurfaceRadiation", "Subsurface radiation", radiation.subsurfaceClass, ""),
      ],
      evidenceCodes: ["FUTURE_RADIATION_WEATHERING"],
    });
  }
}

function titleCase(text) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sortEras(eras = []) {
  return eras.sort((left, right) => {
    const leftStart = left.startGyr == null ? Number.MAX_SAFE_INTEGER : left.startGyr;
    const rightStart = right.startGyr == null ? Number.MAX_SAFE_INTEGER : right.startGyr;
    if (leftStart !== rightStart) return leftStart - rightStart;
    const leftEnd = left.endGyr == null ? Number.MAX_SAFE_INTEGER : left.endGyr;
    const rightEnd = right.endGyr == null ? Number.MAX_SAFE_INTEGER : right.endGyr;
    if (leftEnd !== rightEnd) return leftEnd - rightEnd;
    return (CATEGORY_ORDER[left.category] ?? 99) - (CATEGORY_ORDER[right.category] ?? 99);
  });
}

function pickCurrentEra(eras = []) {
  const current = eras.find((era) => era.state === "current" && era.severity === "good");
  if (current) return current;
  return eras.find((era) => era.state === "current") || eras[0] || null;
}

function summarizeTimeline(eras = [], fallback = "Era timeline") {
  const current = pickCurrentEra(eras);
  return current?.label || fallback;
}

function futureSummary(eras = []) {
  const future = eras.find((era) => era.state === "future");
  if (future) return future.headline;
  const conditional = eras.find((era) => era.state === "conditional");
  return conditional ? conditional.headline : "";
}

function timelineConfidence(eras = []) {
  if (!eras.length) return "low";
  const current = eras.filter((era) => era.state === "current");
  if (current.some((era) => era.confidence === "high")) return "high";
  if (eras.some((era) => era.confidence === "medium")) return "medium";
  return "low";
}

function eraCounts(eras = []) {
  return eras.reduce(
    (counts, era) => {
      counts[era.state] = (counts[era.state] || 0) + 1;
      return counts;
    },
    { past: 0, current: 0, future: 0, conditional: 0 },
  );
}

function makeTimeline({ subjectKind, model = {}, star = {}, systemContext = {}, builder }) {
  const { family, solverFamily } = modelClassification(model);
  const currentAgeGyr = ageFromModel(model, star, systemContext);
  const maxAgeGyr = starLifetimeGyr(star, systemContext);
  const context = {
    subjectKind,
    family,
    solverFamily,
    currentAgeGyr,
    maxAgeGyr,
  };
  const eras = [];
  builder(eras, context);
  addSubtypeEras(eras, context, model);
  sortEras(eras);
  const currentEra = pickCurrentEra(eras);
  return {
    modelVersion: MODEL_VERSION,
    subjectKind,
    family,
    solverFamily,
    subtypeIds: subtypeIds(model),
    currentAgeGyr: currentAgeGyr == null ? null : round(currentAgeGyr, 4),
    maxAgeGyr: maxAgeGyr == null ? null : round(maxAgeGyr, 4),
    currentEraId: currentEra?.id || null,
    confidence: timelineConfidence(eras),
    summary: summarizeTimeline(
      eras,
      subjectKind === "moon" ? "Moon era timeline" : "Planetary era timeline",
    ),
    futureSummary: futureSummary(eras),
    eraCounts: eraCounts(eras),
    eras,
    markers: [
      {
        id: "current-age",
        label: "Current model age",
        timeGyr: currentAgeGyr == null ? null : round(currentAgeGyr, 4),
        state: "current",
        category: "reference",
        confidence: currentAgeGyr == null ? "low" : "high",
        detail:
          currentAgeGyr == null
            ? "No explicit age was available to the timeline builder."
            : "Current star or system age used by the model.",
      },
    ],
  };
}

export function buildPlanetaryEraTimelineForPlanetaryBody({
  body = null,
  model = {},
  star = {},
  systemContext = {},
} = {}) {
  const source = isObject(model) ? model : {};
  return makeTimeline({
    subjectKind: "planet",
    model: source,
    star,
    systemContext,
    builder(eras, context) {
      const classification = modelClassification(source);
      const family = classification.family;
      const solverFamily = classification.solverFamily;
      context.family = family;
      context.solverFamily = solverFamily;
      if (solverFamily === "brownDwarf" || family === "brownDwarf") {
        addBrownDwarfEras(eras, context, source);
        addBrownDwarfFutureEras(eras, context, source);
      } else if (
        solverFamily === "gasGiant" ||
        family === "gasGiant" ||
        (GIANT_FAMILIES.has(family) && solverFamily !== "volatile")
      ) {
        addGiantEras(eras, context, source);
        addGiantFutureEras(eras, context, source);
      } else if (solverFamily === "volatile" || VOLATILE_SOLVER_FAMILIES.has(family)) {
        addVolatileEras(eras, context, source);
        addVolatileFutureEras(eras, context, source);
      } else {
        addRockyFormationEras(eras, context, source);
        addRockyAtmosphereAndHydrosphereEras(eras, context, source);
        addRockyInteriorAndClimateEras(eras, context, source);
      }
      addCoupledEnvironmentContextEras(eras, context, source);
      if (
        !(
          solverFamily === "brownDwarf" ||
          family === "brownDwarf" ||
          solverFamily === "gasGiant" ||
          family === "gasGiant" ||
          (GIANT_FAMILIES.has(family) && solverFamily !== "volatile") ||
          solverFamily === "volatile" ||
          VOLATILE_SOLVER_FAMILIES.has(family)
        )
      ) {
        addRockyFutureEras(eras, context, source);
      }
      if (body?.authoringIntent === "volatile" && !hasSubtype(source, "superPuff")) {
        addEra(eras, context, {
          id: "authoring-volatile-context",
          label: "Volatile authoring context",
          category: "envelope",
          startGyr: context.currentAgeGyr,
          endGyr: null,
          state: "conditional",
          confidence: "low",
          severity: "info",
          headline: "User intent flags a volatile-body interpretation",
          detail:
            "This is authoring context only; physical eras still come from solved model evidence.",
          drivers: [makeDriver("authoringIntent", "Authoring intent", body.authoringIntent, "")],
          evidenceCodes: ["AUTHORING_INTENT"],
        });
      }
    },
  });
}

export function buildPlanetaryEraTimelineForPlanet({
  model = {},
  star = {},
  systemContext = {},
} = {}) {
  return makeTimeline({
    subjectKind: "planet",
    model,
    star,
    systemContext,
    builder(eras, context) {
      context.family = modelClassification(model).family;
      context.solverFamily = modelClassification(model).solverFamily;
      addRockyFormationEras(eras, context, model);
      addRockyAtmosphereAndHydrosphereEras(eras, context, model);
      addRockyInteriorAndClimateEras(eras, context, model);
      addCoupledEnvironmentContextEras(eras, context, model);
      addRockyFutureEras(eras, context, model);
    },
  });
}

export function buildPlanetaryEraTimelineForMoon({
  model = {},
  planetModel = {},
  star = {},
  systemContext = {},
} = {}) {
  return makeTimeline({
    subjectKind: "moon",
    model: {
      ...model,
      classification: {
        family: "moon",
        solverFamily: "moon",
      },
    },
    star,
    systemContext: {
      ...systemContext,
      starAgeGyr: firstFinite(
        systemContext.starAgeGyr,
        model.star?.ageGyr,
        planetModel.star?.ageGyr,
      ),
    },
    builder(eras, context) {
      context.family = "moon";
      context.solverFamily = "moon";
      addMoonEras(eras, context, model);
      addCoupledEnvironmentContextEras(eras, context, model);
      addMoonFutureEras(eras, context, model);
    },
  });
}
