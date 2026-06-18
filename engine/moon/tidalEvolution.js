import { fmt, toFinite } from "../utils.js";

const G = 6.6743e-11;
const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_KM = 6371;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_YEAR = 365.25 * 86400;

export const MOON_TIDAL_EVOLUTION_SCIENCE_NOTES = Object.freeze({
  synchronousOrbit: {
    formulaName: "Parent synchronous orbit radius",
    sourceSummary: "r_sync = (G M_parent / omega_parent^2)^(1/3).",
    assumptions:
      "Uses a point-mass Keplerian parent and a single bulk rotation period. It does not model evolving parent spin, oblateness, or satellite back-reaction.",
    inputUnits: "parent mass in Earth masses; rotation period in hours",
    outputUnits: "kilometres from parent center; optional parent radii",
    outputKind: "numeric",
  },
  eccentricityEquilibrium: {
    formulaName: "Qualitative resonance-pump versus tidal-damp classifier",
    sourceSummary:
      "Combines existing forced-eccentricity, resonance proximity, migration trend, tidal heating, and optional damping timescale context.",
    assumptions:
      "This is a bounded qualitative diagnostic, not a resonant Hamiltonian or de/dt integrator.",
    inputUnits:
      "eccentricity unitless; system age and damping timescale in Gyr; heating in Earth geothermal flux units",
    outputUnits: "qualitative state with confidence",
    outputKind: "qualitative",
  },
  moonTorqueBudget: {
    formulaName: "Mass-weighted migration proxy",
    sourceSummary:
      "Uses existing da/dt outputs and moon mass as a first-pass proxy for net moon-system torque direction.",
    assumptions:
      "This is a direction/significance diagnostic. It is not an exact angular momentum or tidal torque calculation.",
    inputUnits: "da/dt in m/s; moon mass in lunar masses",
    outputUnits: "net da/dt proxy in m/s and cm/yr mass-weighted proxy",
    outputKind: "semiQuantitative",
  },
});

function unknownSync(note) {
  return {
    modelVersion: "parent-synchronous-orbit-v1",
    radiusKm: null,
    radiusParentRadii: null,
    valid: false,
    note,
  };
}

export function estimateParentSynchronousOrbit({
  parentMassEarth,
  parentRotationHours,
  parentRadiusEarth = null,
} = {}) {
  const massEarth = toFinite(parentMassEarth, NaN);
  const rotationHours = Math.abs(toFinite(parentRotationHours, NaN));
  if (!(Number.isFinite(massEarth) && massEarth > 0)) {
    return unknownSync("Parent mass is missing, so synchronous orbit cannot be computed.");
  }
  if (!(Number.isFinite(rotationHours) && rotationHours > 0)) {
    return unknownSync("Parent rotation period is missing, so synchronous orbit is unknown.");
  }

  const omega = (2 * Math.PI) / (rotationHours * SECONDS_PER_HOUR);
  const radiusM = ((G * massEarth * EARTH_MASS_KG) / omega ** 2) ** (1 / 3);
  const radiusKm = radiusM / 1000;
  const parentRadiusKm = toFinite(parentRadiusEarth, NaN) * EARTH_RADIUS_KM;
  const radiusParentRadii =
    Number.isFinite(parentRadiusKm) && parentRadiusKm > 0 ? radiusKm / parentRadiusKm : null;

  return {
    modelVersion: "parent-synchronous-orbit-v1",
    radiusKm,
    radiusParentRadii,
    valid: true,
    note: "Diagnostic uses the Keplerian synchronous orbit for the current parent rotation.",
  };
}

export function buildMoonSynchronousOrbitContext({
  parentMassEarth,
  parentRotationHours,
  parentRadiusEarth = null,
  moonSemiMajorAxisKm,
  orbitalDirection = "Prograde",
} = {}) {
  const sync = estimateParentSynchronousOrbit({
    parentMassEarth,
    parentRotationHours,
    parentRadiusEarth,
  });
  const axisKm = toFinite(moonSemiMajorAxisKm, NaN);
  if (!sync.valid || !(Number.isFinite(axisKm) && axisKm > 0)) {
    return {
      ...sync,
      moonInsideSynchronousOrbit: null,
      migrationDirectionFromSync: "unknown",
      note: sync.valid
        ? "Moon orbit is missing, so migration direction from synchronous orbit is unknown."
        : sync.note,
    };
  }

  const retrograde = String(orbitalDirection || "").toLowerCase() === "retrograde";
  const moonInsideSynchronousOrbit = axisKm < sync.radiusKm;
  let migrationDirectionFromSync = moonInsideSynchronousOrbit ? "inward" : "outward";
  if (retrograde) migrationDirectionFromSync = "inward";
  return {
    ...sync,
    moonInsideSynchronousOrbit,
    migrationDirectionFromSync,
    note: retrograde
      ? "Retrograde moons are treated as inward-migrating in this bounded sync diagnostic."
      : moonInsideSynchronousOrbit
        ? "Moon orbits inside synchronous orbit, so inward torque is expected."
        : "Moon orbits outside synchronous orbit, so outward torque is expected.",
  };
}

function positiveOrNull(value) {
  const number = toFinite(value, NaN);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function resonancePumpStrength({ forcedEccentricity, forcedEccentricitySource, nearestResonance }) {
  const source = String(forcedEccentricitySource || "none");
  const forced = Math.max(toFinite(forcedEccentricity, 0), 0);
  if (source === "manual") return forced >= 0.001 ? 0.75 : 0.45;
  if (source === "laplace-chain-floor") return 0.85;
  if (source === "resonant-mass-model") return forced >= 0.001 ? 0.72 : 0.52;
  if (nearestResonance?.offsetPct != null && nearestResonance.offsetPct <= 2.5) return 0.45;
  return 0;
}

export function estimateMoonEccentricityEquilibrium({
  currentEccentricity,
  forcedEccentricity,
  forcedEccentricitySource,
  nearestResonance,
  migrationTrendState,
  tidalHeatingEarth,
  circularisationTimescaleGyr,
  systemAgeGyr,
} = {}) {
  const current = Math.max(toFinite(currentEccentricity, 0), 0);
  const forced = Math.max(toFinite(forcedEccentricity, 0), 0);
  const effectiveFloor = Math.max(forced, 0);
  const heating = Math.max(toFinite(tidalHeatingEarth, 0), 0);
  const dampingTimescaleGyr = positiveOrNull(circularisationTimescaleGyr);
  const age = positiveOrNull(systemAgeGyr);
  const pumpStrength = resonancePumpStrength({
    forcedEccentricity: forced,
    forcedEccentricitySource,
    nearestResonance,
  });
  const currentAboveFloor = current > effectiveFloor * 1.25 && current > 0.0001;
  const trend = String(migrationTrendState || "unknown");
  const dampingKnown = dampingTimescaleGyr != null && age != null;
  const dampingFast = dampingKnown && dampingTimescaleGyr <= age * 1.5;
  const dampingSlow = dampingKnown && dampingTimescaleGyr > age * 10;
  const hasPump = pumpStrength >= 0.5 || effectiveFloor >= 0.001 || nearestResonance;

  let state = "uncertain";
  let confidence = "low";
  let heatingLikelySustained = false;
  let note =
    "Missing or weak damping and forcing context keeps eccentricity persistence uncertain.";

  if (hasPump && heating >= 25 && effectiveFloor >= 0.01) {
    state = "overdriven";
    confidence = pumpStrength >= 0.5 ? "medium" : "low";
    heatingLikelySustained = true;
    note =
      "Forced eccentricity and tidal heating are high enough that this bounded diagnostic flags an overdriven stress regime.";
  } else if (hasPump && (effectiveFloor >= 0.001 || trend === "converging")) {
    state = "maintained";
    confidence = pumpStrength >= 0.7 ? "high" : "medium";
    heatingLikelySustained = heating >= 0.05;
    note =
      "Resonance or authored forced eccentricity provides a floor, so tidal heating is likely sustained within this qualitative model.";
  } else if (!hasPump && (dampingFast || (age != null && heating >= 0.01 && current > 0))) {
    state = "damping";
    confidence = dampingKnown ? "medium" : "low";
    heatingLikelySustained = false;
    note =
      "No sustained forcing is identified, so eccentricity and tidal heat are expected to damp in this simplified diagnostic.";
  } else if (!hasPump && dampingSlow) {
    state = "uncertain";
    confidence = "medium";
    note =
      "No sustained forcing is identified, but damping appears slow enough that current eccentricity may persist for a long time.";
  }

  return {
    modelVersion: "moon-eccentricity-equilibrium-v1",
    state,
    effectiveFloor,
    dampingTimescaleGyr,
    pumpStrength,
    currentAboveFloor,
    heatingLikelySustained,
    confidence,
    note,
  };
}

function moonMassForBudget(result) {
  return Math.max(
    toFinite(
      result?.model?.inputs?.massMoon ??
        result?.inputs?.massMoon ??
        result?.raw?.inputs?.massMoon ??
        result?.raw?.massMoon,
      0,
    ),
    0,
  );
}

function moonNameForBudget(result) {
  return String(
    result?.model?.inputs?.name ||
      result?.model?.name ||
      result?.raw?.inputs?.name ||
      result?.raw?.name ||
      result?.raw?.id ||
      "Moon",
  );
}

function moonIdForBudget(result, index) {
  return String(result?.raw?.id || result?.model?.id || `moon-${index + 1}`);
}

function classifyNetTorque(netWeight, totalAbsWeight) {
  if (!(Number.isFinite(totalAbsWeight) && totalAbsWeight > 0)) return "unknown";
  const balance = Math.abs(netWeight) / totalAbsWeight;
  if (balance < 0.15) return "balanced";
  return netWeight > 0 ? "outward" : "inward";
}

function classifySpinDownSignificance(totalAbsWeight, moonCount) {
  if (!(Number.isFinite(totalAbsWeight) && totalAbsWeight > 0) || moonCount <= 0) return "unknown";
  if (totalAbsWeight < 1e-19) return "none";
  if (totalAbsWeight < 1e-16) return "low";
  if (totalAbsWeight < 1e-13) return "moderate";
  return "high";
}

export function buildMoonTorqueBudget({ parent, moonResults } = {}) {
  const results = Array.isArray(moonResults) ? moonResults : [];
  const moons = results
    .map((result, index) => {
      const dadtTotalMs = toFinite(
        result?.model?.tides?.dadtTotalMs ?? result?.tides?.dadtTotalMs,
        NaN,
      );
      const massMoon = moonMassForBudget(result);
      const contributionWeight =
        Number.isFinite(dadtTotalMs) && massMoon > 0 ? dadtTotalMs * massMoon : 0;
      const direction =
        !Number.isFinite(dadtTotalMs) || Math.abs(dadtTotalMs) < 1e-30
          ? "unknown"
          : dadtTotalMs > 0
            ? "outward"
            : "inward";
      return {
        moonId: moonIdForBudget(result, index),
        moonName: moonNameForBudget(result),
        dadtTotalMs: Number.isFinite(dadtTotalMs) ? dadtTotalMs : null,
        massMoon,
        contributionWeight,
        direction,
        insideSynchronousOrbit:
          result?.model?.tides?.insideSynchronousOrbit ??
          result?.tides?.insideSynchronousOrbit ??
          null,
      };
    })
    .filter((moon) => moon.massMoon > 0 || moon.dadtTotalMs != null);

  const totalAbsWeight = moons.reduce(
    (sum, moon) => sum + Math.abs(toFinite(moon.contributionWeight, 0)),
    0,
  );
  const netWeight = moons.reduce((sum, moon) => sum + toFinite(moon.contributionWeight, 0), 0);
  const netTorqueClass = classifyNetTorque(netWeight, totalAbsWeight);
  const dominantMoon =
    moons
      .slice()
      .sort(
        (left, right) =>
          Math.abs(toFinite(right.contributionWeight, 0)) -
          Math.abs(toFinite(left.contributionWeight, 0)),
      )[0] || null;
  const dominantAbsWeight = Math.abs(toFinite(dominantMoon?.contributionWeight, 0));
  const dominantContributionFraction =
    totalAbsWeight > 0 ? dominantAbsWeight / Math.max(totalAbsWeight, 1e-300) : null;
  const netDadtMs = moons.length > 0 ? netWeight : null;
  const netDadtCmYrMassWeighted = netDadtMs == null ? null : netDadtMs * 100 * SECONDS_PER_YEAR;

  let note = "No assigned moons with migration outputs are available for a parent budget.";
  if (netTorqueClass === "outward") {
    note = `Moon-system migration proxy is net outward, led by ${dominantMoon?.moonName || "the dominant moon"}.`;
  } else if (netTorqueClass === "inward") {
    note = `Moon-system migration proxy is net inward, led by ${dominantMoon?.moonName || "the dominant moon"}.`;
  } else if (netTorqueClass === "balanced") {
    note = "Moon-system migration proxy is mixed or balanced; no single direction dominates.";
  }

  return {
    modelVersion: "moon-torque-budget-v1",
    parentId: parent?.id ?? parent?.parentId ?? null,
    parentName: parent?.name ?? parent?.parentName ?? "Parent body",
    moonCount: moons.length,
    netDadtMs,
    netDadtCmYrMassWeighted,
    netTorqueClass,
    dominantMoonId: dominantMoon?.moonId ?? null,
    dominantMoonName: dominantMoon?.moonName ?? null,
    dominantContributionFraction,
    spinDownSignificance: classifySpinDownSignificance(totalAbsWeight, moons.length),
    notes: [
      note,
      "Uses existing da/dt and moon mass as a bounded torque-direction proxy, not an exact angular momentum integral.",
    ],
    display: {
      netTorque: netTorqueClass === "unknown" ? "Unknown" : netTorqueClass,
      netMigrationProxy:
        netDadtCmYrMassWeighted == null
          ? "Unknown"
          : `${netDadtCmYrMassWeighted >= 0 ? "+" : "-"}${fmt(Math.abs(netDadtCmYrMassWeighted), 3)} cm/yr lunar-mass proxy`,
      dominantMoon:
        dominantMoon && dominantContributionFraction != null
          ? `${dominantMoon.moonName} (${fmt(dominantContributionFraction * 100, 0)}%)`
          : "None",
    },
    moons,
  };
}
