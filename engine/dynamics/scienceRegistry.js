export const DYNAMICAL_SCIENCE_REGISTRY_VERSION = "dynamical-science-registry-v1";

export const DYNAMICAL_CONTEXT_OUTPUT_KEYS = Object.freeze([
  "hostFrame.stability",
  "hostFrame.orbitalArchitecture",
  "orbitalArchitecture.mutualHillSpacing",
  "orbitalArchitecture.eccentricityOverlap",
  "moon.synchronousOrbit",
  "moon.migrationDirection",
  "moon.eccentricityPersistence",
  "moon.sustainedTidalHeating",
  "moonSystem.torqueBudget",
  "parent.ringContext",
  "parent.radiationContext",
  "generation.guidance",
  "habitability.persistenceBridge",
  "timeline.dynamicalEvents",
]);

const REGISTRY_ENTRIES = Object.freeze({
  "hostFrame.stability": {
    key: "hostFrame.stability",
    label: "Host-frame stability",
    formulaName: "Holman-Wiegert / hierarchical host-frame stability context",
    sourceSummary:
      "Uses the existing home-system host-frame stability outputs for S-type, P-type, and hierarchical companion constraints.",
    assumptions:
      "Host-frame stability is a bounded analytic context, not a full secular or N-body integration.",
    validInputRange:
      "Configured single, binary, triple, or quad host-frame topology with positive masses.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "Does not model Kozai-Lidov cycles, secular resonances, or migration history.",
  },
  "hostFrame.orbitalArchitecture": {
    key: "hostFrame.orbitalArchitecture",
    label: "Selected-frame orbital architecture",
    formulaName: "Adjacent-pair orbital architecture summary",
    sourceSummary:
      "Consumes the upstream mutual-Hill architecture diagnostic for planets, gas giants, and brown-dwarf companions in one host frame.",
    assumptions:
      "Adjacent-pair spacing is most meaningful for near-coplanar, low-to-moderate eccentricity systems.",
    validInputRange:
      "At least two orbiting bodies with positive mass and semi-major axis in the selected host frame.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "Not an N-body integration; eccentric or inclined systems downgrade confidence.",
  },
  "orbitalArchitecture.mutualHillSpacing": {
    key: "orbitalArchitecture.mutualHillSpacing",
    label: "Mutual Hill spacing",
    formulaName: "Adjacent-pair mutual Hill separation",
    sourceSummary: "R_H,m = ((m1 + m2) / (3 M_host))^(1/3) * (a1 + a2) / 2.",
    assumptions:
      "Circular coplanar two-body boundary is used as a conservative diagnostic threshold.",
    validInputRange: "Positive host mass, body masses, and adjacent semi-major axes.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "Does not prove long-term stability for eccentric, inclined, or resonant systems.",
  },
  "orbitalArchitecture.eccentricityOverlap": {
    key: "orbitalArchitecture.eccentricityOverlap",
    label: "Eccentricity overlap",
    formulaName: "Apoapsis/periapsis crossing guard",
    sourceSummary: "Flags adjacent pairs whose simplified orbital ranges overlap.",
    assumptions: "Uses semi-major axis and eccentricity only.",
    validInputRange: "Finite semi-major axes and eccentricities.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations: "No apsidal phase, inclination, resonance, or secular-cycle modeling.",
  },
  "moon.synchronousOrbit": {
    key: "moon.synchronousOrbit",
    label: "Parent synchronous orbit",
    formulaName: "Keplerian synchronous orbit radius",
    sourceSummary: "r_sync = (G M_parent / omega_parent^2)^(1/3).",
    assumptions: "Parent mass and rotation are treated as current bulk values.",
    validInputRange: "Positive parent mass and non-zero rotation period.",
    outputKind: "numeric",
    calibrationRequired: true,
    knownLimitations: "Does not evolve parent spin or include oblateness/back-reaction.",
  },
  "moon.migrationDirection": {
    key: "moon.migrationDirection",
    label: "Moon migration direction",
    formulaName: "Synchronous-orbit and tidal-fate migration context",
    sourceSummary:
      "Consumes upstream tidal da/dt and synchronous-orbit context to classify inward, outward, mixed, or unknown migration.",
    assumptions: "Direction is more robust than exact tidal timescale under uncertain Q/k2.",
    validInputRange: "Solved moon tidal state with parent context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "Exact migration times depend on uncertain dissipation and parent spin evolution.",
  },
  "moon.eccentricityPersistence": {
    key: "moon.eccentricityPersistence",
    label: "Eccentricity persistence",
    formulaName: "Qualitative resonance-pump versus tidal-damp classifier",
    sourceSummary:
      "Consumes upstream forced eccentricity, resonance, migration, heating, and damping context.",
    assumptions: "Maintained/damping/overdriven states are qualitative persistence classes.",
    validInputRange: "Solved moon-system context; missing forcing or damping returns uncertain.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations: "Not a resonant Hamiltonian or de/dt integrator.",
  },
  "moon.sustainedTidalHeating": {
    key: "moon.sustainedTidalHeating",
    label: "Sustained tidal heating",
    formulaName: "Current heat plus eccentricity persistence bridge",
    sourceSummary:
      "Separates current tidal heat from heat that is likely maintained by resonance or forced eccentricity.",
    assumptions:
      "Supports moon interiors and habitability persistence as a confidence context before score changes.",
    validInputRange: "Solved moon tides and pump/damp state.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations: "Does not solve thermal-orbital equilibrium or evolving Q.",
  },
  "moonSystem.torqueBudget": {
    key: "moonSystem.torqueBudget",
    label: "Moon-system torque budget",
    formulaName: "Mass-weighted migration proxy",
    sourceSummary:
      "Consumes the upstream moon-system torque proxy to classify net inward, outward, balanced, or unknown trend.",
    assumptions: "Proxy is useful for direction, not exact torque magnitude.",
    validInputRange: "Solved moon tides with moon masses.",
    outputKind: "semiQuantitative",
    calibrationRequired: false,
    knownLimitations: "Not an exact angular-momentum integral.",
  },
  "parent.ringContext": {
    key: "parent.ringContext",
    label: "Parent ring context",
    formulaName: "Shared Roche/ring-zone and assigned-moon context",
    sourceSummary:
      "Routes existing ring, Roche-limit, and solved moon-system constraints into a single parent-body context.",
    assumptions:
      "Ring interpretation uses existing Roche/ring models plus assigned moon context; no ring age or migration history is solved.",
    validInputRange: "Solved parent body with optional ring properties and assigned moons.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "Does not model collisional ring evolution, shepherding resonances, or detailed ring particle dynamics.",
  },
  "parent.radiationContext": {
    key: "parent.radiationContext",
    label: "Parent radiation and plasma context",
    formulaName: "Shared magnetosphere, plasma-source, and moon-system context",
    sourceSummary:
      "Routes existing giant magnetosphere, sputtering plasma, and moon-system torque/heating context into qualitative radiation notes.",
    assumptions:
      "Radiation and plasma context is qualitative unless a dedicated calibrated magnetodisk model is present.",
    validInputRange:
      "Solved parent body with optional magnetosphere environment, moons, and assigned moon-system context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "Does not produce detailed radiation-belt maps, magnetodisk transport, or time-variable plasma environments.",
  },
  "generation.guidance": {
    key: "generation.guidance",
    label: "Generation and repair guidance",
    formulaName: "Shared hard/soft dynamical constraint routing",
    sourceSummary:
      "Turns shared architecture and moon stability context into generation hard blocks, warnings, and repair suggestions.",
    assumptions:
      "Hard-blocks only established physical impossibilities or upstream unstable labels.",
    validInputRange: "Any generated or saved world; missing inputs produce unknown notes.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations: "Repair suggestions are advisory; uncertain cases remain warnings.",
  },
  "habitability.persistenceBridge": {
    key: "habitability.persistenceBridge",
    label: "Habitability persistence bridge",
    formulaName: "Dynamical persistence confidence bridge",
    sourceSummary:
      "Routes sustained heat, unstable dynamics, and unknown orbital context into persistence confidence and visible reasons.",
    assumptions:
      "First pass affects confidence and notes before direct habitability score penalties.",
    validInputRange: "Solved body context with optional hydrosphere/geology evidence.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations: "Does not assert life and does not prove ocean permanence.",
  },
  "timeline.dynamicalEvents": {
    key: "timeline.dynamicalEvents",
    label: "Dynamical timeline events",
    formulaName: "Qualitative current-state timeline coupling",
    sourceSummary:
      "Uses shared context to add qualitative timeline entries for migration, damping, sustained heating, and crowded architecture.",
    assumptions: "No precise event dates are added unless an upstream calibrated timescale exists.",
    validInputRange: "Solved body or system context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations: "Not an orbital-history integrator.",
  },
});

export function listDynamicalScienceRegistryEntries() {
  return DYNAMICAL_CONTEXT_OUTPUT_KEYS.map((key) => REGISTRY_ENTRIES[key]).filter(Boolean);
}

export function getDynamicalScienceRegistryEntry(key) {
  return REGISTRY_ENTRIES[String(key || "")] || null;
}

export function assertDynamicalScienceRegistryComplete() {
  const missing = DYNAMICAL_CONTEXT_OUTPUT_KEYS.filter((key) => !REGISTRY_ENTRIES[key]);
  if (missing.length) {
    throw new Error(`Missing dynamical science registry entries: ${missing.join(", ")}`);
  }
  for (const entry of listDynamicalScienceRegistryEntries()) {
    for (const field of [
      "key",
      "label",
      "formulaName",
      "sourceSummary",
      "assumptions",
      "validInputRange",
      "outputKind",
      "knownLimitations",
    ]) {
      if (String(entry[field] ?? "").trim() === "") {
        throw new Error(`Dynamical science registry entry ${entry.key} is missing ${field}`);
      }
    }
    if (!["numeric", "semiQuantitative", "qualitative"].includes(entry.outputKind)) {
      throw new Error(`Dynamical science registry entry ${entry.key} has invalid outputKind`);
    }
    if (typeof entry.calibrationRequired !== "boolean") {
      throw new Error(
        `Dynamical science registry entry ${entry.key} must declare calibrationRequired`,
      );
    }
  }
  return true;
}
