// Shared climate-zone livability helpers for habitability and population.

import { clamp, round } from "../utils.js";

/**
 * Fraction of land area that is climatically habitable, derived from climate zones.
 *
 * Zones with master class E (polar) or X (special) are excluded.
 * For latitude-band zones, area is weighted by the spherical strip formula
 * |sin(lat2) - sin(lat1)|.
 *
 * @param {Array} zones - Climate zone array from calcClimateZones().zones
 * @returns {number} 0-1 fraction
 */
export function habitabilityFraction(zones) {
  if (!zones || !zones.length) return 0;

  // Tidally locked: equal-weight zones
  const isTidal = zones.some((z) =>
    ["substellar", "terminator", "antistellar"].includes(z.cellRole),
  );
  if (isTidal) {
    const hab = zones.filter((z) => z.master !== "E" && z.master !== "X");
    return round(hab.length / zones.length, 3);
  }

  // Global single zone
  const isGlobal = zones.length === 1 && zones[0].latMin === 0 && zones[0].latMax === 90;
  if (isGlobal) {
    return zones[0].master !== "E" && zones[0].master !== "X" ? 1 : 0;
  }

  // Normal latitude bands: spherical area weighting
  let totalWeight = 0;
  let habitableWeight = 0;
  const seen = new Set();

  for (const zone of zones) {
    const key = `${zone.latMin}-${zone.latMax}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const sinMin = Math.sin((zone.latMin * Math.PI) / 180);
    const sinMax = Math.sin((zone.latMax * Math.PI) / 180);
    const weight = Math.abs(sinMax - sinMin);
    totalWeight += weight;

    const bandsHere = zones.filter((candidate) => {
      return candidate.latMin === zone.latMin && candidate.latMax === zone.latMax;
    });
    if (bandsHere.some((candidate) => candidate.master !== "E" && candidate.master !== "X")) {
      habitableWeight += weight;
    }
  }

  return totalWeight > 0 ? round(habitableWeight / totalWeight, 3) : 0;
}

export function climateLivabilityScore(fraction) {
  return clamp(Math.sqrt(clamp(Number.isFinite(fraction) ? fraction : 0, 0, 1)), 0, 1);
}
