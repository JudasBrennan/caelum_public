// SPDX-License-Identifier: MPL-2.0
// Moon atmosphere helpers.
//
// Stage M1 turns retained volatile outputs into an explicit moon
// atmosphere model so moons can expose pressure, gas mix, greenhouse
// warming, and atmosphere class through the engine rather than ad-hoc UI
// formatting.

import { computeGreenhouseTau } from "../planet/atmosphere.js";
import { clamp, toFinite } from "../utils.js";

const ATM_TO_PA = 101325;
const R_GAS = 8.3145;

const SPECIES_PROFILES = {
  "N₂": { key: "n2", mwKgMol: 0.028, greenhouseKey: null },
  CO: { key: "co", mwKgMol: 0.028, greenhouseKey: "co" },
  "CH₄": { key: "ch4", mwKgMol: 0.016, greenhouseKey: "ch4" },
  "CO₂": { key: "co2", mwKgMol: 0.044, greenhouseKey: "co2" },
  "NH₃": { key: "nh3", mwKgMol: 0.017, greenhouseKey: "nh3" },
  "SO₂": { key: "so2", mwKgMol: 0.064, greenhouseKey: "so2" },
  "H₂O": { key: "h2o", mwKgMol: 0.018, greenhouseKey: "h2o" },
};

const ATMOSPHERIC_AVAILABILITY = {
  "N₂": 1,
  CO: 0.05,
  "CH₄": 0.15,
  "CO₂": 0.02,
  "NH₃": 0.05,
  "SO₂": 1,
  "H₂O": 1,
};

function emptyComposition() {
  return {
    n2: 0,
    co: 0,
    ch4: 0,
    co2: 0,
    nh3: 0,
    so2: 0,
    h2o: 0,
  };
}

function classifyAtmosphere(totalPressurePa) {
  if (totalPressurePa <= 1e-6) return "Airless";
  if (totalPressurePa < 0.1) return "Exosphere";
  if (totalPressurePa < 10) return "Extremely tenuous atmosphere";
  if (totalPressurePa < 1000) return "Tenuous volatile atmosphere";
  if (totalPressurePa < 30000) return "Thin volatile atmosphere";
  if (totalPressurePa < 200000) return "Substantial volatile atmosphere";
  return "Dense volatile atmosphere";
}

function deriveSourceClass({
  retainedSpecies,
  dominantSpecies,
  totalPressurePa,
  tidalFeedbackActive,
}) {
  if (!retainedSpecies.length || totalPressurePa <= 0) return "None";
  if (tidalFeedbackActive && retainedSpecies.some((entry) => entry.species === "SO₂")) {
    return "Volcanic / outgassed";
  }
  if (totalPressurePa >= 5000 && ["N₂", "CH₄", "CO"].includes(String(dominantSpecies || ""))) {
    return "Retained volatile atmosphere";
  }
  return "Sublimation-driven atmosphere";
}

function scaledAtmospherePressurePa(entry) {
  const species = String(entry?.species || "");
  const availability = ATMOSPHERIC_AVAILABILITY[species] ?? 1;
  return Math.max(toFinite(entry?.pressurePa, 0), 0) * availability;
}

function computeComposition(retainedSpecies, totalPressurePa) {
  const composition = emptyComposition();
  if (totalPressurePa <= 0) return composition;
  for (const entry of retainedSpecies) {
    const profile = SPECIES_PROFILES[String(entry?.species || "")];
    if (!profile) continue;
    composition[profile.key] += scaledAtmospherePressurePa(entry) / totalPressurePa;
  }
  return composition;
}

function normalizeCompositionPct(composition) {
  return {
    n2Pct: composition.n2 * 100,
    coPct: composition.co * 100,
    ch4Pct: composition.ch4 * 100,
    co2Pct: composition.co2 * 100,
    nh3Pct: composition.nh3 * 100,
    so2Pct: composition.so2 * 100,
    h2oPct: composition.h2o * 100,
  };
}

function compositionSummary(compositionPct) {
  const entries = [
    ["N₂", compositionPct.n2Pct],
    ["CO", compositionPct.coPct],
    ["CH₄", compositionPct.ch4Pct],
    ["CO₂", compositionPct.co2Pct],
    ["NH₃", compositionPct.nh3Pct],
    ["SO₂", compositionPct.so2Pct],
    ["H₂O", compositionPct.h2oPct],
  ]
    .filter(([, pct]) => pct >= 0.01)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  if (!entries.length) return "None";
  return entries
    .map(([label, pct]) => `${label} ${pct >= 1 ? pct.toFixed(0) : pct.toFixed(1)}%`)
    .join(" | ");
}

function computeGreenhouseModel({ pressureAtm, compositionPct }) {
  if (pressureAtm <= 0) {
    return {
      greenhouseTauEquivalent: 0,
      antiGreenhouseFraction: 0,
      modelVersion: "moon-atmosphere-v1",
    };
  }

  const tauCore = computeGreenhouseTau({
    pressureAtm,
    n2Pct: compositionPct.n2Pct,
    co2Pct: compositionPct.co2Pct,
    h2oPct: compositionPct.h2oPct,
    ch4Pct: compositionPct.ch4Pct,
    so2Pct: compositionPct.so2Pct,
    nh3Pct: compositionPct.nh3Pct,
    full: true,
  });
  const tauCo =
    compositionPct.coPct > 0
      ? 0.08 *
        Math.sqrt(Math.max(0, (pressureAtm * compositionPct.coPct) / 100 / 0.001)) *
        pressureAtm ** 0.684
      : 0;
  const antiGreenhouseFraction =
    compositionPct.ch4Pct > 0 && compositionPct.n2Pct > 0
      ? clamp(0.15 * Math.sqrt((pressureAtm * compositionPct.ch4Pct) / 100), 0, 0.35)
      : 0;

  return {
    greenhouseTauEquivalent: Math.max(0, (tauCore + tauCo) * 0.85),
    antiGreenhouseFraction,
    modelVersion: "moon-atmosphere-v1",
  };
}

export function computeMoonAtmosphere({
  volatileInventory = [],
  surfaceTempK = 0,
  gravityMs2 = 0,
  tidalFeedbackActive = false,
} = {}) {
  const retainedSpecies = (Array.isArray(volatileInventory) ? volatileInventory : []).filter(
    (entry) => entry?.status === "Thin atmosphere" && scaledAtmospherePressurePa(entry) > 0,
  );
  const totalPressurePa = retainedSpecies.reduce(
    (sum, entry) => sum + scaledAtmospherePressurePa(entry),
    0,
  );
  const pressureAtm = totalPressurePa / ATM_TO_PA;
  const dominantSpecies =
    retainedSpecies.length > 0
      ? retainedSpecies.reduce((left, right) =>
          scaledAtmospherePressurePa(left) >= scaledAtmospherePressurePa(right) ? left : right,
        ).species
      : null;

  const composition = computeComposition(retainedSpecies, totalPressurePa);
  const compositionPct = normalizeCompositionPct(composition);
  const greenhouse = computeGreenhouseModel({ pressureAtm, compositionPct });

  const meanMolecularWeightKgMol = Object.entries(composition).reduce((sum, [key, share]) => {
    const profile = Object.values(SPECIES_PROFILES).find((entry) => entry.key === key);
    return sum + share * (profile?.mwKgMol || 0);
  }, 0);
  const densityKgM3 =
    totalPressurePa > 0 && surfaceTempK > 0 && meanMolecularWeightKgMol > 0
      ? (totalPressurePa * meanMolecularWeightKgMol) / (R_GAS * surfaceTempK)
      : 0;
  const scaleHeightKm =
    gravityMs2 > 0 && surfaceTempK > 0 && meanMolecularWeightKgMol > 0
      ? (R_GAS * surfaceTempK) / (meanMolecularWeightKgMol * gravityMs2) / 1000
      : 0;

  return {
    hasAtmosphere: totalPressurePa > 0.01,
    atmosphereClass: classifyAtmosphere(totalPressurePa),
    sourceClass: deriveSourceClass({
      retainedSpecies,
      dominantSpecies,
      totalPressurePa,
      tidalFeedbackActive,
    }),
    dominantSpecies,
    surfacePressurePa: totalPressurePa,
    surfacePressureAtm: pressureAtm,
    meanMolecularWeightKgMol,
    densityKgM3,
    scaleHeightKm,
    greenhouseTauEquivalent: greenhouse.greenhouseTauEquivalent,
    antiGreenhouseFraction: greenhouse.antiGreenhouseFraction,
    greenhouseModelVersion: greenhouse.modelVersion,
    composition,
    compositionPct,
    compositionSummary: compositionSummary(compositionPct),
  };
}
