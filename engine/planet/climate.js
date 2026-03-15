import { clamp, round, toFinite } from "../utils.js";

const SPECIES_CONFIG = {
  n2: { label: "N2", refPressureAtm: 0.3, condensationRefK: 77, slopeKPerDex: 8 },
  o2: { label: "O2", refPressureAtm: 0.3, condensationRefK: 90, slopeKPerDex: 8 },
  ar: { label: "Ar", refPressureAtm: 0.3, condensationRefK: 87, slopeKPerDex: 7 },
  co2: { label: "CO2", refPressureAtm: 0.1, condensationRefK: 195, slopeKPerDex: 22 },
  ch4: { label: "CH4", refPressureAtm: 0.05, condensationRefK: 112, slopeKPerDex: 12 },
  nh3: { label: "NH3", refPressureAtm: 0.05, condensationRefK: 240, slopeKPerDex: 20 },
  h2o: { label: "H2O", refPressureAtm: 0.1, condensationRefK: 273, slopeKPerDex: 18 },
  so2: { label: "SO2", refPressureAtm: 0.1, condensationRefK: 263, slopeKPerDex: 18 },
  h2: { label: "H2", refPressureAtm: 0.01, condensationRefK: 20, slopeKPerDex: 4 },
  he: { label: "He", refPressureAtm: 0.01, condensationRefK: 5, slopeKPerDex: 2 },
};

const DEFAULT_SPECIES = {
  label: "bulk atmosphere",
  refPressureAtm: 0.1,
  condensationRefK: 110,
  slopeKPerDex: 10,
};

function getSpeciesConfig(speciesKey) {
  return SPECIES_CONFIG[String(speciesKey || "").toLowerCase()] || DEFAULT_SPECIES;
}

function dominantSpeciesFromPartialPressures(partialPressuresAtm = {}) {
  let dominantKey = "n2";
  let dominantPressureAtm = 0;
  for (const [key, value] of Object.entries(partialPressuresAtm || {})) {
    const partialPressureAtm = Math.max(toFinite(value, 0), 0);
    if (partialPressureAtm > dominantPressureAtm) {
      dominantKey = key;
      dominantPressureAtm = partialPressureAtm;
    }
  }
  const config = getSpeciesConfig(dominantKey);
  return {
    key: dominantKey,
    label: config.label,
    partialPressureAtm: dominantPressureAtm,
    config,
  };
}

function condensationThresholdK(speciesKey, partialPressureAtm) {
  const config = getSpeciesConfig(speciesKey);
  const pressureAtm = Math.max(toFinite(partialPressureAtm, 0), 1e-6);
  const thresholdK = config.condensationRefK + config.slopeKPerDex * Math.log10(pressureAtm);
  return round(Math.max(0, thresholdK), 1);
}

function lockedWorldHeatTransportFactor(pressureAtm, refPressureAtm, gravityG = 1) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 1e-6);
  const gravity = clamp(Math.max(toFinite(gravityG, 1), 0.05) ** 0.08, 0.85, 1.15);
  return clamp((pressure / refPressureAtm) ** 0.25 * gravity, 0.05, 1);
}

export function computeLockedWorldAtmosphericCollapse({
  tidallyLockedToStar = false,
  pressureAtm = 0,
  equilibriumTempK = 0,
  surfaceTempK = 0,
  gravityG = 1,
  atmospherePartialPressuresAtm = {},
} = {}) {
  const totalPressureAtm = Math.max(toFinite(pressureAtm, 0), 0);
  const equilibriumK = Math.max(toFinite(equilibriumTempK, 0), 0);
  const surfaceK = Math.max(toFinite(surfaceTempK, 0), equilibriumK);

  if (totalPressureAtm <= 1e-4) {
    return {
      modelVersion: "locked-collapse-v1",
      evaluated: false,
      collapseRisk: "None",
      collapsePenalty: 1,
      collapseState: "No substantial atmosphere",
      nightsideMinK: 0,
      condensationThresholdK: 0,
      dominantSpeciesKey: "none",
      dominantSpeciesLabel: "None",
      dominantPartialPressureAtm: 0,
      transportFactor: 0,
      note: "Atmospheric collapse is not evaluated for near-vacuum cases.",
    };
  }

  if (!tidallyLockedToStar) {
    return {
      modelVersion: "locked-collapse-v1",
      evaluated: false,
      collapseRisk: "None",
      collapsePenalty: 1,
      collapseState: "Not synchronously locked",
      nightsideMinK: round(surfaceK, 1),
      condensationThresholdK: 0,
      dominantSpeciesKey: "none",
      dominantSpeciesLabel: "Not evaluated",
      dominantPartialPressureAtm: 0,
      transportFactor: 1,
      note: "Atmospheric collapse is only evaluated for synchronously locked worlds.",
    };
  }

  const dominant = dominantSpeciesFromPartialPressures(atmospherePartialPressuresAtm);
  const transportFactor = lockedWorldHeatTransportFactor(
    totalPressureAtm,
    dominant.config.refPressureAtm,
    gravityG,
  );
  const greenhouseExcessK = Math.max(surfaceK - equilibriumK, 0);
  const greenhouseRedistribution = clamp(0.25 + 0.65 * transportFactor, 0.2, 0.95);
  const nightsideMinK = round(
    Math.min(
      surfaceK,
      equilibriumK * transportFactor + greenhouseExcessK * greenhouseRedistribution,
    ),
    1,
  );
  const thresholdK = condensationThresholdK(dominant.key, dominant.partialPressureAtm);
  const marginK = nightsideMinK - thresholdK;

  let collapseRisk = "None";
  let collapsePenalty = 1;
  let collapseState = "Stable against collapse";

  if (marginK < -15) {
    collapseRisk = "High";
    collapsePenalty = 0.35;
    collapseState = "Atmosphere at risk of collapse";
  } else if (marginK < 0) {
    collapseRisk = "Moderate";
    collapsePenalty = 0.72;
    collapseState = "Atmosphere marginal against collapse";
  } else if (marginK < 15) {
    collapseRisk = "Low";
    collapsePenalty = 0.92;
    collapseState = "Atmosphere near the collapse limit";
  }

  return {
    modelVersion: "locked-collapse-v1",
    evaluated: true,
    collapseRisk,
    collapsePenalty,
    collapseState,
    nightsideMinK,
    condensationThresholdK: thresholdK,
    dominantSpeciesKey: dominant.key,
    dominantSpeciesLabel: dominant.label,
    dominantPartialPressureAtm: round(dominant.partialPressureAtm, 4),
    transportFactor: round(transportFactor, 3),
    note:
      `${dominant.label} condenses near ${thresholdK} K at ` +
      `${round(dominant.partialPressureAtm, 3)} atm; modeled locked-world night side is ~${nightsideMinK} K.`,
  };
}
