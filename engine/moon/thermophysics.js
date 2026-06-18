import { calcEquilibriumFourthPowerFromFluxWm2, calcStellarFluxWm2 } from "../physics/radiative.js";
import { clamp, round, toFinite } from "../utils.js";

const STEFAN_BOLTZ_WM2K4 = 5.6704e-8;

function roundTemperature(value) {
  return Number.isFinite(value) ? round(value, 1) : 0;
}

function fourthRoot(value) {
  return value > 0 ? Math.sqrt(Math.sqrt(value)) : 0;
}

function fourthPowerFromSurfaceFlux(fluxWm2, emissivity) {
  return Math.max(toFinite(fluxWm2, 0), 0) / (STEFAN_BOLTZ_WM2K4 * emissivity);
}

function temperatureFromFourthPower(fourthPower) {
  return fourthRoot(Math.max(toFinite(fourthPower, 0), 0));
}

function normalizeAlbedoKind(kind) {
  const value = String(kind || "").toLowerCase();
  if (["bond", "bond-albedo", "bolometric"].includes(value)) return "bond";
  if (["geometric", "visual", "geometric-albedo", "visual-albedo"].includes(value)) {
    return "geometric";
  }
  return "unknown";
}

export function resolveMoonAlbedoContext(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const caveats = [];
  const explicitBond = toFinite(source.bondAlbedo, null);
  const explicitGeometric = toFinite(source.geometricAlbedo, null);
  const fallbackAlbedo = toFinite(source.albedo, null);
  const phaseIntegralInput = toFinite(source.phaseIntegral, null);
  const kind = normalizeAlbedoKind(source.albedoKind);
  const phaseIntegral =
    phaseIntegralInput != null
      ? clamp(phaseIntegralInput, 0.25, 1.5)
      : explicitGeometric > 0.95
        ? 0.6
        : 0.75;

  let bondAlbedo;
  let geometricAlbedo = explicitGeometric;
  let resolvedKind = kind;
  let confidence = "medium";

  if (explicitBond != null) {
    bondAlbedo = clamp(explicitBond, 0, 0.95);
    resolvedKind = "bond";
    confidence = "high";
  } else if (kind === "geometric" || explicitGeometric != null) {
    geometricAlbedo = explicitGeometric ?? fallbackAlbedo;
    bondAlbedo = clamp(Math.max(toFinite(geometricAlbedo, 0), 0) * phaseIntegral, 0, 0.95);
    resolvedKind = "geometric-inferred-bond";
    confidence = phaseIntegralInput != null ? "medium" : "low";
    caveats.push("Bond albedo inferred from geometric/visual albedo and phase integral.");
  } else if (fallbackAlbedo != null) {
    bondAlbedo = clamp(fallbackAlbedo, 0, 0.95);
    resolvedKind = kind === "bond" ? "bond" : "unspecified-albedo-as-bond";
    confidence = kind === "bond" ? "high" : "medium";
    if (kind !== "bond") {
      caveats.push(
        "Moon albedo treated as Bond albedo; specify albedoKind for tighter comparisons.",
      );
    }
  } else {
    bondAlbedo = 0.12;
    resolvedKind = "default-bond";
    confidence = "low";
    caveats.push("No moon albedo provided; using a generic dark-airless Bond albedo.");
  }

  if (bondAlbedo >= 0.9) {
    caveats.push(
      "Very high Bond albedo is bounded at 0.95; check whether the source is geometric.",
    );
  }

  return {
    bondAlbedo: round(bondAlbedo, 4),
    geometricAlbedo:
      geometricAlbedo == null || !Number.isFinite(Number(geometricAlbedo))
        ? null
        : round(Math.max(Number(geometricAlbedo), 0), 4),
    phaseIntegral: round(phaseIntegral, 3),
    albedoKind: resolvedKind,
    confidence,
    caveats,
  };
}

function normalizeThermalInertiaClass({ thermalInertiaClass, surfaceClass, surfacePressurePa }) {
  const explicit = String(thermalInertiaClass || "").toLowerCase();
  if (["very-low", "low", "moderate", "high", "very-high"].includes(explicit)) return explicit;

  if (surfacePressurePa >= 1000) return "high";

  const surface = String(surfaceClass || "").toLowerCase();
  if (surface.includes("ocean") || surface.includes("atmosphere")) return "high";
  if (surface.includes("compact ice") || surface.includes("subsurface")) return "moderate";
  if (surface.includes("icy") || surface.includes("ice") || surface.includes("porous"))
    return "low";
  if (surface.includes("regolith")) return "low";
  if (surface.includes("rock") || surface.includes("iron")) return "moderate";
  return "low";
}

function inertiaProperties(inertiaClass) {
  switch (inertiaClass) {
    case "very-high":
      return { spread: 0.28, floorCarry: 0.68, highCarry: 0.5, localBoost: 0.01 };
    case "high":
      return { spread: 0.42, floorCarry: 0.58, highCarry: 0.62, localBoost: 0.02 };
    case "moderate":
      return { spread: 0.68, floorCarry: 0.42, highCarry: 0.78, localBoost: 0.04 };
    case "very-low":
      return { spread: 1.12, floorCarry: 0.16, highCarry: 1.02, localBoost: 0.08 };
    case "low":
    default:
      return { spread: 0.92, floorCarry: 0.25, highCarry: 0.92, localBoost: 0.06 };
  }
}

function rotationSpreadFactor({ rotationPeriodDays, moonLockedToPlanet, spinState }) {
  if (
    moonLockedToPlanet === true ||
    String(spinState?.state || "")
      .toLowerCase()
      .includes("locked")
  ) {
    return 1.08;
  }
  const rotationDays = Math.max(toFinite(rotationPeriodDays, 1), 0.01);
  if (rotationDays >= 20) return 1;
  if (rotationDays >= 5) return 0.88;
  if (rotationDays >= 1) return 0.72;
  return 0.55;
}

function confidenceFloor(...values) {
  const ranks = { low: 0, medium: 1, high: 2 };
  const labels = ["low", "medium", "high"];
  return labels[Math.min(...values.map((value) => ranks[value] ?? 1))];
}

function normalizeTidalPersistenceContext(context) {
  if (!context || typeof context !== "object") return null;
  return {
    modelVersion: context.modelVersion || "sustained-tidal-heating-context-v1",
    currentTidalHeatingClass: String(context.currentTidalHeatingClass || "unknown"),
    sustainedTidalHeatingClass: String(context.sustainedTidalHeatingClass || "unknown"),
    eccentricityPersistence: String(context.eccentricityPersistence || "uncertain"),
    persistenceConfidence: String(context.persistenceConfidence || context.confidence || "unknown"),
    note: String(context.note || ""),
  };
}

export function calcAirlessMoonThermalEnvelope(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const persistenceContext = normalizeTidalPersistenceContext(source.tidalPersistenceContext);
  const albedoContext = resolveMoonAlbedoContext(source);
  const bondAlbedo = albedoContext.bondAlbedo;
  const emissivity = clamp(toFinite(source.emissivity, 0.95), 0.7, 1);
  const orbitalDistanceAu = Math.max(toFinite(source.planetSemiMajorAxisAu, 1), 0.001);
  const stellarFluxAtOrbitWm2 =
    calcStellarFluxWm2({
      starLuminosityLsol: Math.max(toFinite(source.starLuminosityLsol, 1), 0),
      orbitalDistanceAu,
    }) +
    calcStellarFluxWm2({
      starLuminosityLsol:
        Math.max(toFinite(source.extraFluxEarth, 0), 0) * Math.max(orbitalDistanceAu, 0.01) ** 2,
      orbitalDistanceAu,
    });
  const eclipseCoolingPenalty = clamp(toFinite(source.eclipseCoolingPenalty, 0), 0, 0.5);
  const effectiveStellarFluxWm2 = stellarFluxAtOrbitWm2 * (1 - eclipseCoolingPenalty);
  const parentReflectedFluxWm2 = Math.max(toFinite(source.parentReflectedFluxWm2, 0), 0);
  const parentThermalFluxWm2 = Math.max(toFinite(source.parentThermalFluxWm2, 0), 0);
  const parentFourthPower =
    fourthPowerFromSurfaceFlux(parentReflectedFluxWm2 * (1 - bondAlbedo), emissivity) +
    fourthPowerFromSurfaceFlux(parentThermalFluxWm2, emissivity);

  const globalRadiativeFourthPower =
    calcEquilibriumFourthPowerFromFluxWm2({
      stellarFluxAtDistanceWm2: effectiveStellarFluxWm2,
      albedoBond: bondAlbedo,
      redistributionFactor: 4,
    }) /
      emissivity +
    parentFourthPower;
  const daysideFourthPower =
    calcEquilibriumFourthPowerFromFluxWm2({
      stellarFluxAtDistanceWm2: effectiveStellarFluxWm2,
      albedoBond: bondAlbedo,
      redistributionFactor: 2,
    }) /
      emissivity +
    parentFourthPower;
  const subsolarFourthPower =
    calcEquilibriumFourthPowerFromFluxWm2({
      stellarFluxAtDistanceWm2: effectiveStellarFluxWm2,
      albedoBond: bondAlbedo,
      redistributionFactor: 1,
    }) /
      emissivity +
    parentFourthPower;

  const tidalHeatFluxWm2 = Math.max(toFinite(source.tidalHeatFluxWm2, 0), 0);
  const radiogenicHeatFluxWm2 = Math.max(toFinite(source.radiogenicHeatFluxWm2, 0), 0);
  const internalHeatFluxWm2 = tidalHeatFluxWm2 + radiogenicHeatFluxWm2;
  const internalFourthPower = fourthPowerFromSurfaceFlux(internalHeatFluxWm2, emissivity);
  const effectiveEmissionFourthPower = globalRadiativeFourthPower + internalFourthPower;

  const globalEquilibriumK = temperatureFromFourthPower(globalRadiativeFourthPower);
  const effectiveEmissionK = temperatureFromFourthPower(effectiveEmissionFourthPower);
  const subsolarK = temperatureFromFourthPower(subsolarFourthPower);
  const daysideMeanK = temperatureFromFourthPower(daysideFourthPower);
  const surfacePressurePa = Math.max(toFinite(source.surfacePressurePa, 0), 0);
  const thermalInertiaClass = normalizeThermalInertiaClass({
    thermalInertiaClass: source.thermalInertiaClass,
    surfaceClass: source.surfaceClass,
    surfacePressurePa,
  });
  const inertia = inertiaProperties(thermalInertiaClass);
  const rotationFactor = rotationSpreadFactor({
    rotationPeriodDays: source.rotationPeriodDays,
    moonLockedToPlanet: source.moonLockedToPlanet,
    spinState: source.spinState,
  });
  const spreadFactor = clamp(inertia.spread * rotationFactor, 0.2, 1.2);
  const internalFloorK = temperatureFromFourthPower(internalFourthPower);
  const carriedFloorK = globalEquilibriumK * inertia.floorCarry * (1 - 0.18 * (spreadFactor - 1));
  const nightsideFloorK = Math.max(12, internalFloorK, carriedFloorK);
  const localHighK = subsolarK * (1 + inertia.localBoost * spreadFactor);
  const bufferedHighK =
    globalEquilibriumK +
    (localHighK - globalEquilibriumK) * clamp(inertia.highCarry * rotationFactor, 0.35, 1.12);
  const observableMinK = Math.min(nightsideFloorK, globalEquilibriumK);
  const observableMaxK = Math.max(daysideMeanK, bufferedHighK, effectiveEmissionK);
  const thermalInertiaAdjustedMeanK = Math.max(
    effectiveEmissionK,
    globalEquilibriumK + (daysideMeanK - globalEquilibriumK) * 0.18 * spreadFactor,
  );
  const recommendedComparisonK = clamp(
    daysideMeanK + (observableMaxK - daysideMeanK) * 0.5,
    observableMinK,
    observableMaxK,
  );

  const caveats = [...albedoContext.caveats];
  if (surfacePressurePa >= 1000 || source.hasVolatileAtmosphere === true) {
    caveats.push("Non-airless surface pressure detected; atmospheric heat transport may dominate.");
  }
  if (eclipseCoolingPenalty > 0.02) {
    caveats.push("Eclipse cooling reduces the stellar energy budget before range estimation.");
  }
  if (thermalInertiaClass === "low" || thermalInertiaClass === "very-low") {
    caveats.push("Low thermal inertia allows strong local-time surface temperature variation.");
  }
  if (
    persistenceContext?.sustainedTidalHeatingClass === "damping" ||
    persistenceContext?.sustainedTidalHeatingClass === "uncertain"
  ) {
    caveats.push("Tidal heat is treated as current heat; persistence is dynamically uncertain.");
  } else if (persistenceContext?.sustainedTidalHeatingClass === "overdriven") {
    caveats.push("Sustained tidal heat may be overdriven and stressful for stable environments.");
  }

  const pressureConfidence =
    surfacePressurePa >= 1000 || source.hasVolatileAtmosphere === true ? "low" : "high";
  const thermalModelConfidence = confidenceFloor(albedoContext.confidence, pressureConfidence);

  return {
    modelVersion: "airless-moon-thermal-envelope-v1",
    albedoContext,
    emissivity: round(emissivity, 3),
    stellarFluxAtOrbitWm2: round(stellarFluxAtOrbitWm2, 3),
    effectiveStellarFluxWm2: round(effectiveStellarFluxWm2, 3),
    parentReflectedFluxWm2: round(parentReflectedFluxWm2, 4),
    parentThermalFluxWm2: round(parentThermalFluxWm2, 4),
    eclipseCoolingPenalty: round(eclipseCoolingPenalty, 4),
    tidalHeatFluxWm2: round(tidalHeatFluxWm2, 6),
    radiogenicHeatFluxWm2: round(radiogenicHeatFluxWm2, 6),
    internalHeatFluxWm2: round(internalHeatFluxWm2, 6),
    surfaceClass: source.surfaceClass || "unspecified airless surface",
    thermalInertiaClass,
    rotationSpreadFactor: round(rotationFactor, 3),
    globalEquilibriumK: roundTemperature(globalEquilibriumK),
    effectiveEmissionK: roundTemperature(effectiveEmissionK),
    subsolarK: roundTemperature(subsolarK),
    daysideMeanK: roundTemperature(daysideMeanK),
    nightsideFloorK: roundTemperature(nightsideFloorK),
    thermalInertiaAdjustedMeanK: roundTemperature(thermalInertiaAdjustedMeanK),
    observableTemperatureRangeK: {
      min: roundTemperature(observableMinK),
      max: roundTemperature(observableMaxK),
    },
    recommendedComparisonK: roundTemperature(recommendedComparisonK),
    recommendedComparisonKind:
      surfacePressurePa >= 1000 || source.hasVolatileAtmosphere === true
        ? "atmosphere-caveated observable range"
        : "airless observable surface range",
    dynamicalPersistenceContext: persistenceContext,
    currentTidalHeatingClass: persistenceContext?.currentTidalHeatingClass || "unknown",
    sustainedTidalHeatingClass: persistenceContext?.sustainedTidalHeatingClass || "unknown",
    tidalPersistenceConfidence: persistenceContext?.persistenceConfidence || "unknown",
    thermalModelConfidence,
    thermalModelCaveats: caveats,
  };
}
