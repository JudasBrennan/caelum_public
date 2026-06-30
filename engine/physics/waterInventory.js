import { clamp, round, toFinite } from "../utils.js";

const KG_PER_MEARTH = 5.972e24;
const KG_PER_MMOON = 7.342e22;
const KM_PER_REARTH = 6371;
const KM_PER_RMOON = 1737.4;
const WATER_DENSITY_KG_M3 = 1000;

function resolveMassKg({ massEarth = null, massMoon = null }) {
  const earth = toFinite(massEarth, NaN);
  if (Number.isFinite(earth) && earth > 0) return earth * KG_PER_MEARTH;
  return Math.max(toFinite(massMoon, 0), 0) * KG_PER_MMOON;
}

function resolveRadiusM({ radiusEarth = null, radiusMoon = null, radiusKm = null }) {
  const km = toFinite(radiusKm, NaN);
  if (Number.isFinite(km) && km > 0) return km * 1000;
  const earth = toFinite(radiusEarth, NaN);
  if (Number.isFinite(earth) && earth > 0) return earth * KM_PER_REARTH * 1000;
  return Math.max(toFinite(radiusMoon, 0), 0) * KM_PER_RMOON * 1000;
}

export function estimateEquivalentWaterInventory({
  massEarth = null,
  massMoon = null,
  radiusEarth = null,
  radiusMoon = null,
  radiusKm = null,
  waterMassFraction = 0,
  waterDensityKgM3 = WATER_DENSITY_KG_M3,
} = {}) {
  const bodyMassKg = resolveMassKg({ massEarth, massMoon });
  const radiusM = resolveRadiusM({ radiusEarth, radiusMoon, radiusKm });
  const fraction = clamp(toFinite(waterMassFraction, 0), 0, 1);
  const density = Math.max(toFinite(waterDensityKgM3, WATER_DENSITY_KG_M3), 1);
  const surfaceAreaM2 = radiusM > 0 ? 4 * Math.PI * radiusM ** 2 : 0;
  const waterMassKg = bodyMassKg * fraction;
  const equivalentWaterDepthM =
    surfaceAreaM2 > 0 && waterMassKg > 0 ? waterMassKg / (surfaceAreaM2 * density) : 0;

  return {
    modelVersion: "solid-body-water-inventory-v1",
    waterMassFraction: round(fraction, 6),
    waterMassKg: round(waterMassKg, 3),
    equivalentWaterDepthM: round(equivalentWaterDepthM, 3),
    equivalentWaterDepthKm: round(equivalentWaterDepthM / 1000, 6),
    surfaceAreaM2: round(surfaceAreaM2, 3),
    confidence: bodyMassKg > 0 && radiusM > 0 ? "medium" : "unknown",
    assumptions: [
      "Equivalent water depth spreads the supplied water mass evenly over the body's surface area.",
    ],
  };
}
