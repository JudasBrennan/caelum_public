// Moon atmosphere helpers.
//
// Turns retained volatile outputs into an explicit moon atmosphere model so
// moons can expose pressure, gas mix, greenhouse warming, and atmosphere
// class through the engine rather than ad-hoc UI formatting.

import { computeGreenhouseTau } from "../planet/atmosphere.js";
import { clamp, toFinite } from "../utils.js";
import {
  canonicalHabitabilitySpeciesLabel,
  normalizeHabitabilityInventory,
  normalizeHabitabilitySpecies,
} from "../habitability/species.js";

const ATM_TO_PA = 101325;
const R_GAS = 8.3145;

const SPECIES_PROFILES = {
  h2: { key: "h2", mwKgMol: 0.002, greenhouseKey: "h2" },
  he: { key: "he", mwKgMol: 0.004, greenhouseKey: null },
  n2: { key: "n2", mwKgMol: 0.028, greenhouseKey: null },
  co: { key: "co", mwKgMol: 0.028, greenhouseKey: "co" },
  ch4: { key: "ch4", mwKgMol: 0.016, greenhouseKey: "ch4" },
  co2: { key: "co2", mwKgMol: 0.044, greenhouseKey: "co2" },
  nh3: { key: "nh3", mwKgMol: 0.017, greenhouseKey: "nh3" },
  so2: { key: "so2", mwKgMol: 0.064, greenhouseKey: "so2" },
  h2o: { key: "h2o", mwKgMol: 0.018, greenhouseKey: "h2o" },
  o2: { key: "o2", mwKgMol: 0.032, greenhouseKey: null },
  ar: { key: "ar", mwKgMol: 0.04, greenhouseKey: null },
};

const ATMOSPHERIC_AVAILABILITY = {
  n2: { fraction: 1, capPa: 160000 },
  co: { fraction: 0.05, capPa: 5000 },
  ch4: { fraction: 0.15, capPa: 10000 },
  co2: { fraction: 0.02, capPa: 1500 },
  nh3: { fraction: 0.05, capPa: 1000 },
  so2: { fraction: 1, capPa: Infinity },
  h2o: { fraction: 1, capPa: 3000 },
  o2: { fraction: 1, capPa: 100000 },
  ar: { fraction: 1, capPa: 100000 },
};

function emptyComposition() {
  return {
    h2: 0,
    he: 0,
    n2: 0,
    co: 0,
    ch4: 0,
    co2: 0,
    nh3: 0,
    so2: 0,
    h2o: 0,
    o2: 0,
    ar: 0,
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

function classifyAtmosphereRegime(totalPressurePa) {
  if (totalPressurePa <= 1e-6) return "exosphere";
  if (totalPressurePa < 10) return "exosphere";
  if (totalPressurePa < 1200) return "seasonal-volatile-atmosphere";
  if (totalPressurePa < 10000) return "thin-collisional-atmosphere";
  return "thick-pressure-bearing-atmosphere";
}

function deriveSourceClass({
  retainedSpecies,
  dominantSpecies,
  totalPressurePa,
  tidalFeedbackActive,
  mode,
}) {
  if (mode === "manual" && totalPressurePa > 0) return "User-specified atmosphere";
  if (!retainedSpecies.length || totalPressurePa <= 0) return "None";
  if (
    tidalFeedbackActive &&
    retainedSpecies.some((entry) => normalizeHabitabilitySpecies(entry.species) === "so2")
  ) {
    return "Volcanic / outgassed";
  }
  if (
    totalPressurePa >= 5000 &&
    ["n2", "ch4", "co"].includes(normalizeHabitabilitySpecies(dominantSpecies))
  ) {
    return "Retained volatile atmosphere";
  }
  return "Sublimation-driven atmosphere";
}

function scaledAtmospherePressurePa(entry) {
  const species = normalizeHabitabilitySpecies(entry?.species);
  const availability = ATMOSPHERIC_AVAILABILITY[species] ?? { fraction: 1, capPa: Infinity };
  const rawPressurePa = Math.max(toFinite(entry?.pressurePa, 0), 0) * availability.fraction;
  return Math.min(rawPressurePa, availability.capPa);
}

function computeComposition(retainedSpecies, totalPressurePa) {
  const composition = emptyComposition();
  if (totalPressurePa <= 0) return composition;
  for (const entry of retainedSpecies) {
    const profile = SPECIES_PROFILES[normalizeHabitabilitySpecies(entry?.species)];
    if (!profile) continue;
    composition[profile.key] += scaledAtmospherePressurePa(entry) / totalPressurePa;
  }
  return composition;
}

function normalizeCompositionPct(composition) {
  return {
    h2Pct: composition.h2 * 100,
    hePct: composition.he * 100,
    n2Pct: composition.n2 * 100,
    coPct: composition.co * 100,
    ch4Pct: composition.ch4 * 100,
    co2Pct: composition.co2 * 100,
    nh3Pct: composition.nh3 * 100,
    so2Pct: composition.so2 * 100,
    h2oPct: composition.h2o * 100,
    o2Pct: composition.o2 * 100,
    arPct: composition.ar * 100,
  };
}

function compositionSummary(compositionPct) {
  const entries = [
    ["H\u2082", compositionPct.h2Pct],
    ["He", compositionPct.hePct],
    ["N\u2082", compositionPct.n2Pct],
    ["CO", compositionPct.coPct],
    ["CH\u2084", compositionPct.ch4Pct],
    ["CO\u2082", compositionPct.co2Pct],
    ["NH\u2083", compositionPct.nh3Pct],
    ["SO\u2082", compositionPct.so2Pct],
    ["H\u2082O", compositionPct.h2oPct],
    ["O\u2082", compositionPct.o2Pct],
    ["Ar", compositionPct.arPct],
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
    h2Pct: compositionPct.h2Pct,
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

function normalizeManualCompositionPct(manualCompositionPct = {}) {
  const compositionPct = {
    h2Pct: Math.max(0, toFinite(manualCompositionPct.h2Pct, 0)),
    hePct: Math.max(0, toFinite(manualCompositionPct.hePct, 0)),
    n2Pct: Math.max(0, toFinite(manualCompositionPct.n2Pct, 0)),
    coPct: Math.max(0, toFinite(manualCompositionPct.coPct, 0)),
    ch4Pct: Math.max(0, toFinite(manualCompositionPct.ch4Pct, 0)),
    co2Pct: Math.max(0, toFinite(manualCompositionPct.co2Pct, 0)),
    nh3Pct: Math.max(0, toFinite(manualCompositionPct.nh3Pct, 0)),
    so2Pct: Math.max(0, toFinite(manualCompositionPct.so2Pct, 0)),
    h2oPct: Math.max(0, toFinite(manualCompositionPct.h2oPct, 0)),
    o2Pct: Math.max(0, toFinite(manualCompositionPct.o2Pct, 0)),
    arPct: Math.max(0, toFinite(manualCompositionPct.arPct, 0)),
  };
  const explicitWithoutN2 =
    compositionPct.h2Pct +
    compositionPct.hePct +
    compositionPct.coPct +
    compositionPct.ch4Pct +
    compositionPct.co2Pct +
    compositionPct.nh3Pct +
    compositionPct.so2Pct +
    compositionPct.h2oPct +
    compositionPct.o2Pct +
    compositionPct.arPct;
  if (explicitWithoutN2 <= 0 && compositionPct.n2Pct <= 0) {
    compositionPct.n2Pct = 100;
  }
  if (!Number.isFinite(toFinite(manualCompositionPct.n2Pct, NaN))) {
    compositionPct.n2Pct = Math.max(0, 100 - explicitWithoutN2);
  }
  const totalPct =
    compositionPct.h2Pct +
    compositionPct.hePct +
    compositionPct.n2Pct +
    compositionPct.coPct +
    compositionPct.ch4Pct +
    compositionPct.co2Pct +
    compositionPct.nh3Pct +
    compositionPct.so2Pct +
    compositionPct.h2oPct +
    compositionPct.o2Pct +
    compositionPct.arPct;
  if (totalPct <= 0) return compositionPct;
  for (const key of Object.keys(compositionPct)) {
    compositionPct[key] = (compositionPct[key] / totalPct) * 100;
  }
  return compositionPct;
}

function compositionFromPct(compositionPct = {}) {
  return {
    h2: Math.max(0, toFinite(compositionPct.h2Pct, 0)) / 100,
    he: Math.max(0, toFinite(compositionPct.hePct, 0)) / 100,
    n2: Math.max(0, toFinite(compositionPct.n2Pct, 0)) / 100,
    co: Math.max(0, toFinite(compositionPct.coPct, 0)) / 100,
    ch4: Math.max(0, toFinite(compositionPct.ch4Pct, 0)) / 100,
    co2: Math.max(0, toFinite(compositionPct.co2Pct, 0)) / 100,
    nh3: Math.max(0, toFinite(compositionPct.nh3Pct, 0)) / 100,
    so2: Math.max(0, toFinite(compositionPct.so2Pct, 0)) / 100,
    h2o: Math.max(0, toFinite(compositionPct.h2oPct, 0)) / 100,
    o2: Math.max(0, toFinite(compositionPct.o2Pct, 0)) / 100,
    ar: Math.max(0, toFinite(compositionPct.arPct, 0)) / 100,
  };
}

export function computeMoonAtmosphere({
  volatileInventory = [],
  surfaceTempK = 0,
  gravityMs2 = 0,
  tidalFeedbackActive = false,
  mode = "core",
  manualSurfacePressureAtm = null,
  manualCompositionPct = null,
} = {}) {
  const manualMode = mode === "manual";
  const retainedSpecies = normalizeHabitabilityInventory(volatileInventory).filter(
    (entry) => entry?.status === "Thin atmosphere" && scaledAtmospherePressurePa(entry) > 0,
  );
  const manualPressureAtm = Math.max(0, toFinite(manualSurfacePressureAtm, 0));
  const totalPressurePa = manualMode
    ? manualPressureAtm * ATM_TO_PA
    : retainedSpecies.reduce((sum, entry) => sum + scaledAtmospherePressurePa(entry), 0);
  const pressureAtm = totalPressurePa / ATM_TO_PA;
  const compositionPct = manualMode
    ? normalizeManualCompositionPct(manualCompositionPct || {})
    : normalizeCompositionPct(computeComposition(retainedSpecies, totalPressurePa));
  const composition = compositionFromPct(compositionPct);
  const dominantSpecies = (() => {
    const entries = Object.entries(compositionPct)
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1]);
    if (!entries.length) return null;
    return entries[0][0].replace(/Pct$/, "");
  })();
  const greenhouse = computeGreenhouseModel({ pressureAtm, compositionPct });

  const meanMolecularWeightKgMol = Object.entries(composition).reduce((sum, [key, share]) => {
    const profile = SPECIES_PROFILES[key];
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
    atmosphereRegime: classifyAtmosphereRegime(totalPressurePa),
    atmosphereRegimeModelVersion: "moon-atmosphere-regime-v1",
    sourceClass: deriveSourceClass({
      retainedSpecies,
      dominantSpecies,
      totalPressurePa,
      tidalFeedbackActive,
      mode,
    }),
    dominantSpecies: canonicalHabitabilitySpeciesLabel(
      normalizeHabitabilitySpecies(dominantSpecies),
    ),
    mode,
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
