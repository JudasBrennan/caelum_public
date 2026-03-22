import { clamp, fmt, round, toFinite } from "./utils.js";

const SOLAR_CONSTANT_WM2 = 1361;
const WATER_EQ_MOLECULAR_MASS_KG = 2.99e-26;
const N_CRIT_M3 = 1e10;
const V_GAS_MS = 500;

const DEFAULT_COMET = Object.freeze({
  sourceReservoir: "manual",
  semiMajorAxisAu: 8,
  eccentricity: 0.65,
  inclinationDeg: 15,
  longitudeOfPeriapsisDeg: 0,
  meanAnomalyDeg: 0,
  nucleusRadiusKm: 4,
  densityGcm3: 0.6,
  albedo: 0.04,
  activeFraction: 0.08,
  dustToGasRatio: 1.2,
  volatileClass: "waterRich",
});

const VOLATILE_PRESETS = Object.freeze({
  waterRich: Object.freeze({
    onsetAuAt1Lsol: 3.0,
    latentHeatJkg: 2.6e6,
    label: "H2O-dominated",
  }),
  mixed: Object.freeze({
    onsetAuAt1Lsol: 6.0,
    latentHeatJkg: 1.4e6,
    label: "Mixed H2O/CO2",
  }),
  co2Rich: Object.freeze({
    onsetAuAt1Lsol: 12.0,
    latentHeatJkg: 6.0e5,
    label: "CO2-rich",
  }),
  coRich: Object.freeze({
    onsetAuAt1Lsol: 25.0,
    latentHeatJkg: 2.7e5,
    label: "CO-rich",
  }),
});

const SOURCE_LABELS = Object.freeze({
  manual: "Manual",
  debrisDisk: "Debris Disk",
  oortCloud: "Oort Cloud",
});

function normalizeAngleDeg(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return ((num % 360) + 360) % 360;
}

function normalizeReservoir(value) {
  const normalized = String(value || "").trim();
  return Object.hasOwn(SOURCE_LABELS, normalized) ? normalized : DEFAULT_COMET.sourceReservoir;
}

function normalizeVolatileClass(value) {
  const normalized = String(value || "").trim();
  return Object.hasOwn(VOLATILE_PRESETS, normalized) ? normalized : DEFAULT_COMET.volatileClass;
}

function normalizeCometInputs(raw = {}) {
  return {
    id: String(raw?.id || "c1"),
    name: String(raw?.name || "").trim() || "Comet",
    hostFrameId: String(raw?.hostFrameId || "").trim() || null,
    sourceReservoir: normalizeReservoir(raw?.sourceReservoir),
    semiMajorAxisAu: clamp(
      toFinite(raw?.semiMajorAxisAu ?? raw?.aAu, DEFAULT_COMET.semiMajorAxisAu),
      0.05,
      100000,
    ),
    eccentricity: clamp(
      toFinite(raw?.eccentricity ?? raw?.ecc, DEFAULT_COMET.eccentricity),
      0,
      0.9999,
    ),
    inclinationDeg: clamp(
      toFinite(raw?.inclinationDeg ?? raw?.inclination, DEFAULT_COMET.inclinationDeg),
      0,
      180,
    ),
    longitudeOfPeriapsisDeg: normalizeAngleDeg(
      raw?.longitudeOfPeriapsisDeg ?? raw?.longitudeOfPeriapsis,
      DEFAULT_COMET.longitudeOfPeriapsisDeg,
    ),
    meanAnomalyDeg: normalizeAngleDeg(
      raw?.meanAnomalyDeg ?? raw?.meanAnomaly,
      DEFAULT_COMET.meanAnomalyDeg,
    ),
    nucleusRadiusKm: clamp(
      toFinite(raw?.nucleusRadiusKm ?? raw?.radiusKm, DEFAULT_COMET.nucleusRadiusKm),
      0.5,
      50,
    ),
    densityGcm3: clamp(
      toFinite(raw?.densityGcm3 ?? raw?.density, DEFAULT_COMET.densityGcm3),
      0.2,
      1.0,
    ),
    albedo: clamp(toFinite(raw?.albedo, DEFAULT_COMET.albedo), 0.01, 0.12),
    activeFraction: clamp(toFinite(raw?.activeFraction, DEFAULT_COMET.activeFraction), 0.005, 0.5),
    dustToGasRatio: clamp(toFinite(raw?.dustToGasRatio, DEFAULT_COMET.dustToGasRatio), 0.5, 4),
    volatileClass: normalizeVolatileClass(raw?.volatileClass),
  };
}

function solveEccentricAnomaly(meanAnomalyRad, eccentricity) {
  let E = eccentricity < 0.8 ? meanAnomalyRad : Math.PI;
  for (let i = 0; i < 18; i += 1) {
    const f = E - eccentricity * Math.sin(E) - meanAnomalyRad;
    const fp = 1 - eccentricity * Math.cos(E);
    const delta = fp !== 0 ? f / fp : 0;
    E -= delta;
    if (Math.abs(delta) < 1e-10) break;
  }
  return E;
}

function normalizeTrueAnomalyDeg(eccentricAnomalyRad, eccentricity) {
  const numerator = Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomalyRad / 2);
  const denominator = Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomalyRad / 2);
  return normalizeAngleDeg((2 * Math.atan2(numerator, denominator) * 180) / Math.PI, 0);
}

export function calcComet({ comet, starMassMsol, starLuminosityLsol }) {
  const inputs = normalizeCometInputs(comet);
  const sMass = Math.max(toFinite(starMassMsol, 1), 0.08);
  const sLum = Math.max(toFinite(starLuminosityLsol, 1), 1e-4);
  const preset = VOLATILE_PRESETS[inputs.volatileClass] || VOLATILE_PRESETS.waterRich;

  const semiMajorAxisAu = inputs.semiMajorAxisAu;
  const eccentricity = inputs.eccentricity;
  const perihelionAu = semiMajorAxisAu * (1 - eccentricity);
  const aphelionAu = semiMajorAxisAu * (1 + eccentricity);
  const orbitalPeriodYears = Math.sqrt(semiMajorAxisAu ** 3 / sMass);
  const onsetDistanceAu = preset.onsetAuAt1Lsol * Math.sqrt(sLum);

  const meanAnomalyRad = (inputs.meanAnomalyDeg * Math.PI) / 180;
  const eccentricAnomalyRad = solveEccentricAnomaly(meanAnomalyRad, eccentricity);
  const currentRadiusAu = semiMajorAxisAu * (1 - eccentricity * Math.cos(eccentricAnomalyRad));
  const trueAnomalyDeg = normalizeTrueAnomalyDeg(eccentricAnomalyRad, eccentricity);
  const visVivaTerm = Math.max(0, 2 / currentRadiusAu - 1 / semiMajorAxisAu);
  const currentSpeedKms = 29.78 * Math.sqrt(sMass * visVivaTerm);

  let state = "Dormant";
  let activityTaper = 0;
  if (currentRadiusAu <= onsetDistanceAu) {
    state = "Active";
    activityTaper = 1;
  } else if (currentRadiusAu <= 1.25 * onsetDistanceAu) {
    state = "Weakly active";
    activityTaper = 1 - (currentRadiusAu - onsetDistanceAu) / (0.25 * onsetDistanceAu);
  }

  const nucleusRadiusM = inputs.nucleusRadiusKm * 1000;
  const activeAreaM2 = 4 * Math.PI * nucleusRadiusM ** 2 * inputs.activeFraction;
  const absorbedFluxWm2 = ((1 - inputs.albedo) * SOLAR_CONSTANT_WM2 * sLum) / currentRadiusAu ** 2;
  const massLossKgPerS =
    (activeAreaM2 * absorbedFluxWm2 * activityTaper) / (4 * preset.latentHeatJkg);
  const moleculeRate = massLossKgPerS / WATER_EQ_MOLECULAR_MASS_KG;
  const comaRadiusKm =
    activityTaper > 0 ? Math.sqrt(moleculeRate / (4 * Math.PI * N_CRIT_M3 * V_GAS_MS)) / 1000 : 0;
  const tailNorm = Math.sqrt(Math.max(massLossKgPerS, 0));
  const dustTailLengthAu =
    activityTaper > 0
      ? clamp((0.0018 * tailNorm) / Math.max(currentRadiusAu, 0.15), 0.002, 0.6)
      : 0;
  const ionTailLengthAu =
    activityTaper > 0
      ? clamp((0.0028 * tailNorm) / Math.max(currentRadiusAu, 0.15), dustTailLengthAu, 1.2)
      : 0;
  const dynamicalClass = orbitalPeriodYears < 200 ? "Short-period" : "Long-period";
  const sourceLabel = SOURCE_LABELS[inputs.sourceReservoir] || SOURCE_LABELS.manual;
  const visualOrbitOuterAu = Math.min(aphelionAu, Math.max(20, perihelionAu * 12));

  return {
    inputs,
    classification: {
      dynamicalClass,
      sourceReservoir: inputs.sourceReservoir,
      sourceLabel,
      volatileLabel: preset.label,
    },
    orbit: {
      perihelionAu: round(perihelionAu, 4),
      aphelionAu: round(aphelionAu, 4),
      orbitalPeriodYears: round(orbitalPeriodYears, 4),
      currentRadiusAu: round(currentRadiusAu, 4),
      currentSpeedKms: round(currentSpeedKms, 4),
      trueAnomalyDeg: round(trueAnomalyDeg, 4),
      visualOrbitOuterAu: round(visualOrbitOuterAu, 4),
    },
    activity: {
      onsetDistanceAu: round(onsetDistanceAu, 4),
      state,
      activeNow: activityTaper > 0,
      massLossKgPerS: round(massLossKgPerS, 6),
      comaRadiusKm: round(comaRadiusKm, 4),
      dustTailLengthAu: round(dustTailLengthAu, 4),
      ionTailLengthAu: round(ionTailLengthAu, 4),
    },
    display: {
      activityState: state,
      orbitSummary: `q ${fmt(perihelionAu, 2)} AU | Q ${fmt(aphelionAu, 2)} AU | P ${fmt(orbitalPeriodYears, 1)} yr`,
      sourceReservoir: sourceLabel,
      volatileClass: preset.label,
    },
  };
}
