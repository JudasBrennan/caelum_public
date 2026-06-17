import { clamp, round, toFinite } from "../utils.js";
import { SOLAR_WIND_RAM_PRESSURE_1AU_NPA } from "../stellarEnvironment.js";

const MODEL_VERSION = "magnetosphere-environment-v1";
const EARTH_STANDOFF_RP = 10;
const EARTH_RADIUS_KM = 6371;
const MU_0 = 4 * Math.PI * 1e-7;
const GAUSS_TO_TESLA = 1e-4;
const NPA_TO_PA = 1e-9;
const PLASMA_H_REF = 4e5;
const PLASMA_GAMMA = 0.047;
const PLASMA_H_THRESHOLD = 1e8;

function positiveOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function morphologyDipoleScale(fieldMorphology) {
  const key = String(fieldMorphology || "").toLowerCase();
  if (key === "dipolar") return 1;
  if (key === "multipolar") return 0.35;
  return 0;
}

function rockyCompressionClass(standoffRp, supported) {
  if (!supported || standoffRp <= 1.5) return "Collapsed";
  if (standoffRp < 4) return "Severely compressed";
  if (standoffRp < 8) return "Compressed";
  if (standoffRp <= 12) return "Earth-like";
  return "Expanded";
}

function giantCompressionClass(standoffRp) {
  if (standoffRp <= 0) return "Collapsed";
  if (standoffRp < 8) return "Severely compressed";
  if (standoffRp < 20) return "Compressed";
  if (standoffRp < 60) return "Broad";
  return "Extended";
}

export function computeRockyMagnetosphereEnvironment({
  surfaceFieldEarths = 0,
  fieldMorphology = "none",
  windPressureEarthRatio = null,
  radiusKm = EARTH_RADIUS_KM,
} = {}) {
  const field = Math.max(toFinite(surfaceFieldEarths, 0), 0);
  const windRatio = Math.max(toFinite(windPressureEarthRatio, 1), 1e-6);
  const morphologyScale = morphologyDipoleScale(fieldMorphology);
  const effectiveDipoleFieldEarths = field * morphologyScale;
  const supported = effectiveDipoleFieldEarths >= 0.005 && windRatio > 0;
  const caveats = [];

  if (morphologyScale === 0 || field <= 0) {
    caveats.push("No resolved global dynamo; pressure-balance standoff is unsupported.");
  } else if (String(fieldMorphology).toLowerCase() === "multipolar") {
    caveats.push("Multipolar fields are downweighted because they decay faster with distance.");
  }
  if (windRatio > 4) {
    caveats.push("High stellar-wind pressure compresses the dayside magnetopause.");
  }
  if (windRatio < 0.25) {
    caveats.push("Low stellar-wind pressure allows an expanded dayside magnetosphere.");
  }

  const magnetopauseRp = supported
    ? EARTH_STANDOFF_RP * Math.cbrt(effectiveDipoleFieldEarths) * windRatio ** (-1 / 6)
    : 0;
  const compressionFactor = supported ? magnetopauseRp / EARTH_STANDOFF_RP : 0;
  const windCompressionFactor = windRatio ** (-1 / 6);
  const compressionClass = rockyCompressionClass(magnetopauseRp, supported);
  const radiationShieldingFactor = supported
    ? clamp(0.55 * clamp((magnetopauseRp - 1) / 9, 0, 1) * Math.sqrt(morphologyScale), 0, 0.55)
    : 0;
  const windPressureNPa = windRatio * SOLAR_WIND_RAM_PRESSURE_1AU_NPA;

  return {
    modelVersion: MODEL_VERSION,
    supported,
    fieldMorphology,
    surfaceFieldEarths: round(field, 4),
    effectiveDipoleFieldEarths: round(effectiveDipoleFieldEarths, 4),
    windPressureEarthRatio: round(windRatio, 4),
    windPressureNPa: round(windPressureNPa, 4),
    magnetopauseRp: round(magnetopauseRp, 2),
    magnetopauseKm: round(magnetopauseRp * Math.max(toFinite(radiusKm, EARTH_RADIUS_KM), 0), 0),
    compressionFactor: round(compressionFactor, 3),
    windCompressionFactor: round(windCompressionFactor, 3),
    compressionClass,
    radiationShieldingFactor: round(radiationShieldingFactor, 4),
    caveats,
    scienceBasis: "dipole-pressure-balance",
  };
}

export function computeGiantMagnetosphereEnvironment({
  surfaceFieldGauss = 0,
  radiusKm = 0,
  windPressureNPa = null,
  fallbackWindPressureNPa = null,
  plasmaSourcePowerW = 0,
  forcePlasmaSource = false,
  isIceGiant = false,
} = {}) {
  const surfaceGauss = Math.max(toFinite(surfaceFieldGauss, 0), 0);
  const windNPa =
    positiveOrNull(windPressureNPa) ??
    positiveOrNull(fallbackWindPressureNPa) ??
    SOLAR_WIND_RAM_PRESSURE_1AU_NPA;
  const windPa = windNPa * NPA_TO_PA;
  const surfaceTesla = surfaceGauss * GAUSS_TO_TESLA;
  const chapmanFerraroRp =
    surfaceTesla > 0 && windPa > 0
      ? ((surfaceTesla * surfaceTesla) / (2 * MU_0 * windPa)) ** (1 / 6)
      : 0;
  const plasmaPower = Math.max(toFinite(plasmaSourcePowerW, 0), 0);
  const hasPlasmaSource = forcePlasmaSource === true || plasmaPower >= PLASMA_H_THRESHOLD;
  const plasmaFactor = hasPlasmaSource ? (1 + plasmaPower / PLASMA_H_REF) ** PLASMA_GAMMA : 1;
  const magnetopauseRp = chapmanFerraroRp * plasmaFactor;
  const compressionClass = giantCompressionClass(magnetopauseRp);
  const compressionFactor = chapmanFerraroRp > 0 ? magnetopauseRp / chapmanFerraroRp : 0;
  const windCompressionFactor =
    windNPa > 0 ? (windNPa / SOLAR_WIND_RAM_PRESSURE_1AU_NPA) ** (-1 / 6) : 0;

  return {
    modelVersion: MODEL_VERSION,
    supported: surfaceGauss > 0 && windPa > 0,
    surfaceFieldGauss: round(surfaceGauss, 4),
    windPressureNPa: round(windNPa, 4),
    windPressureEarthRatio: round(windNPa / SOLAR_WIND_RAM_PRESSURE_1AU_NPA, 4),
    chapmanFerraroRp: round(chapmanFerraroRp, 2),
    magnetopauseRp: round(magnetopauseRp, 1),
    magnetopauseKm: round(magnetopauseRp * Math.max(toFinite(radiusKm, 0), 0), 0),
    plasmaFactor: round(plasmaFactor, 3),
    compressionFactor: round(compressionFactor, 3),
    windCompressionFactor: round(windCompressionFactor, 3),
    compressionClass,
    scienceBasis: "chapman-ferraro-dipole-pressure-balance",
    caveats: isIceGiant
      ? ["Ice-giant fields are morphology-adjusted because their observed fields are multipolar."]
      : [],
  };
}
