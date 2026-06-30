import {
  calcHabitableZoneAu,
  evolvedLuminosity,
  evolvedRadius,
  feHtoZ,
  msLifetimeGyr,
  zamsLuminosity,
  zamsRadius,
} from "./star.js";
import { clamp, toFinite } from "./utils.js";

const MODEL_VERSION = "stellar-lifecycle-tracks-v1";
const SOLAR_TEFF_K = 5776;
const SOLAR_RADIUS_AU = 0.00465047;
const MIN_TRACK_MASS_MSOL = 0.075;
const MAX_TRACK_MASS_MSOL = 100;
const MAX_SAMPLE_COUNT = 720;
const GIANT_STAGE_IDS = new Set([
  "red_giant",
  "core_helium_burning",
  "asymptotic_giant_branch",
  "supergiant",
  "supernova_transition",
]);
const REMNANT_STAGE_IDS = new Set(["white_dwarf", "neutron_star", "black_hole", "no_remnant"]);

const STAGE_DEFINITIONS = Object.freeze({
  main_sequence: {
    id: "main_sequence",
    label: "Main sequence",
    family: "hydrogen burning",
    confidenceBase: "high",
  },
  terminal_main_sequence: {
    id: "terminal_main_sequence",
    label: "Terminal main sequence",
    family: "hydrogen exhaustion",
    confidenceBase: "high",
  },
  subgiant: {
    id: "subgiant",
    label: "Subgiant branch",
    family: "post-main-sequence expansion",
    confidenceBase: "medium",
  },
  red_giant: {
    id: "red_giant",
    label: "Red giant branch",
    family: "shell hydrogen burning",
    confidenceBase: "medium",
  },
  core_helium_burning: {
    id: "core_helium_burning",
    label: "Core helium burning",
    family: "helium burning",
    confidenceBase: "medium",
  },
  asymptotic_giant_branch: {
    id: "asymptotic_giant_branch",
    label: "Asymptotic giant branch",
    family: "shell burning and wind loss",
    confidenceBase: "low",
  },
  supergiant: {
    id: "supergiant",
    label: "Supergiant",
    family: "massive-star late stage",
    confidenceBase: "low",
  },
  supernova_transition: {
    id: "supernova_transition",
    label: "Supernova transition",
    family: "terminal massive-star event",
    confidenceBase: "low",
  },
  white_dwarf: {
    id: "white_dwarf",
    label: "White dwarf remnant",
    family: "compact remnant",
    confidenceBase: "medium",
  },
  neutron_star: {
    id: "neutron_star",
    label: "Neutron star remnant",
    family: "compact remnant",
    confidenceBase: "low",
  },
  black_hole: {
    id: "black_hole",
    label: "Black hole remnant",
    family: "compact remnant",
    confidenceBase: "low",
  },
  no_remnant: {
    id: "no_remnant",
    label: "Disrupted remnant",
    family: "terminal massive-star event",
    confidenceBase: "low",
  },
});

function round(value, decimals = 4) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const scale = 10 ** decimals;
  return Math.round(number * scale) / scale;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function mix(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function smooth(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function safePow(base, exponent, fallback = 0) {
  const number = Number(base);
  if (!(number > 0)) return fallback;
  return number ** exponent;
}

function stellarTemperatureK(luminosityLsol, radiusRsol) {
  const luminosity = Number(luminosityLsol);
  const radius = Number(radiusRsol);
  if (!(luminosity > 0) || !(radius > 0)) return null;
  return (luminosity / radius ** 2) ** 0.25 * SOLAR_TEFF_K;
}

function stageDefinition(stageId) {
  return STAGE_DEFINITIONS[stageId] || STAGE_DEFINITIONS.main_sequence;
}

function confidenceRank(confidence) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  if (confidence === "low") return 1;
  return 0;
}

function lowerConfidence(left, right) {
  return confidenceRank(left) <= confidenceRank(right) ? left : right;
}

function normalizeInputs({ massMsol = 1, ageGyr = 4.6, metallicityFeH = 0 } = {}) {
  const mass = clamp(toFinite(massMsol, 1), MIN_TRACK_MASS_MSOL, MAX_TRACK_MASS_MSOL);
  const age = clamp(toFinite(ageGyr, 4.6), 0, 200);
  const feH = clamp(toFinite(metallicityFeH, 0), -3, 0.5);
  const Z = feHtoZ(feH);
  return { massMsol: mass, ageGyr: age, metallicityFeH: feH, Z };
}

export function estimateStellarRemnant({ initialMassMsol = 1, metallicityFeH = 0 } = {}) {
  const mass = clamp(toFinite(initialMassMsol, 1), MIN_TRACK_MASS_MSOL, MAX_TRACK_MASS_MSOL);
  const feH = clamp(toFinite(metallicityFeH, 0), -3, 0.5);
  const metallicityWindBoost = clamp(10 ** (0.25 * feH), 0.45, 1.35);

  if (mass < 0.8) {
    const remnantMass = clamp(0.32 + 0.22 * mass, 0.34, 0.52);
    return {
      type: "helium_white_dwarf",
      stageId: "white_dwarf",
      label: "Helium white dwarf",
      massMsol: round(remnantMass, 4),
      formationChannel: "extrapolated single-star endpoint",
      confidence: "low",
      caveats: [
        "Single stars below about 0.8 Msol do not reach this endpoint within the current age of the Universe.",
      ],
    };
  }

  if (mass < 7.8) {
    const remnantMass = clamp(0.109 * mass + 0.394, 0.52, 1.08);
    return {
      type: "carbon_oxygen_white_dwarf",
      stageId: "white_dwarf",
      label: "Carbon-oxygen white dwarf",
      massMsol: round(remnantMass, 4),
      formationChannel: "initial-final mass relation",
      confidence: "medium",
      caveats: [],
    };
  }

  if (mass < 10) {
    const remnantMass = clamp(1.05 + 0.12 * (mass - 7.8), 1.05, 1.32);
    return {
      type: "oxygen_neon_white_dwarf",
      stageId: "white_dwarf",
      label: "Oxygen-neon white dwarf",
      massMsol: round(remnantMass, 4),
      formationChannel: "super-AGB endpoint screen",
      confidence: "low",
      caveats: ["The 8-10 Msol transition is sensitive to overshoot, rotation, and metallicity."],
    };
  }

  if (mass < 25) {
    const remnantMass = clamp(1.32 + 0.035 * (mass - 10), 1.32, 2.05);
    return {
      type: "neutron_star",
      stageId: "neutron_star",
      label: "Neutron star",
      massMsol: round(remnantMass, 4),
      formationChannel: "core-collapse endpoint screen",
      confidence: "low",
      caveats: [
        "Explosion energy, nucleosynthesis, fallback, light curves, binarity, and rotation are not solved.",
      ],
    };
  }

  const fallbackFraction = mass < 45 ? 0.18 + 0.014 * (mass - 25) : 0.45;
  const remnantMass = clamp((mass * fallbackFraction) / metallicityWindBoost, 4.5, 45);
  return {
    type: "stellar_black_hole",
    stageId: "black_hole",
    label: mass >= 45 ? "Direct-collapse black hole" : "Fallback black hole",
    massMsol: round(remnantMass, 4),
    formationChannel: mass >= 45 ? "direct-collapse screen" : "fallback core-collapse screen",
    confidence: "low",
    caveats: [
      "Massive-star remnant masses are highly uncertain without winds, rotation, and binaries.",
    ],
  };
}

function makeSegment(id, startsAtGyr, endsAtGyr) {
  const start = Math.max(0, finiteNumber(startsAtGyr, 0));
  const rawEnd = Number(endsAtGyr);
  const end =
    rawEnd === Number.POSITIVE_INFINITY ? rawEnd : Math.max(start, finiteNumber(rawEnd, start));
  return {
    id,
    label: stageDefinition(id).label,
    family: stageDefinition(id).family,
    startsAtGyr: start,
    endsAtGyr: end,
    durationGyr: Math.max(0, end - start),
  };
}

export function buildStellarLifecycleStageSequence({ massMsol = 1, metallicityFeH = 0 } = {}) {
  const {
    massMsol: mass,
    metallicityFeH: feH,
    Z,
  } = normalizeInputs({
    massMsol,
    metallicityFeH,
    ageGyr: 0,
  });
  const tMs = Math.max(msLifetimeGyr(mass, Z), 0.000001);
  const terminalStart = Math.max(0, tMs * 0.92);
  const remnant = estimateStellarRemnant({ initialMassMsol: mass, metallicityFeH: feH });
  const segments = [
    makeSegment("main_sequence", 0, terminalStart),
    makeSegment("terminal_main_sequence", terminalStart, tMs),
  ];

  let cursor = tMs;
  if (mass >= 8) {
    const subgiant = clamp(0.08 * tMs, 0.0004, 0.08);
    const supergiant = clamp(0.12 * tMs, 0.0006, 0.16);
    const collapse = clamp(0.012 * tMs, 0.0001, 0.012);
    segments.push(makeSegment("subgiant", cursor, cursor + subgiant));
    cursor += subgiant;
    segments.push(makeSegment("supergiant", cursor, cursor + supergiant));
    cursor += supergiant;
    segments.push(makeSegment("supernova_transition", cursor, cursor + collapse));
    cursor += collapse;
  } else {
    const subgiant = mass < 2 ? clamp(0.1 * tMs, 0.04, 1.0) : clamp(0.08 * tMs, 0.004, 0.2);
    const redGiant = mass < 2 ? clamp(0.12 * tMs, 0.05, 1.2) : clamp(0.11 * tMs, 0.006, 0.45);
    const cheb = mass < 2 ? clamp(0.08 * tMs, 0.04, 0.6) : clamp(0.07 * tMs, 0.004, 0.18);
    const agb = mass < 2 ? clamp(0.025 * tMs, 0.01, 0.15) : clamp(0.02 * tMs, 0.001, 0.04);
    segments.push(makeSegment("subgiant", cursor, cursor + subgiant));
    cursor += subgiant;
    segments.push(makeSegment("red_giant", cursor, cursor + redGiant));
    cursor += redGiant;
    segments.push(makeSegment("core_helium_burning", cursor, cursor + cheb));
    cursor += cheb;
    segments.push(makeSegment("asymptotic_giant_branch", cursor, cursor + agb));
    cursor += agb;
  }

  const remnantStageId = remnant.stageId || "white_dwarf";
  segments.push(makeSegment(remnantStageId, cursor, Number.POSITIVE_INFINITY));

  return {
    modelVersion: MODEL_VERSION,
    initialMassMsol: mass,
    metallicityFeH: feH,
    metalMassFractionZ: Z,
    mainSequenceLifetimeGyr: tMs,
    remnantFormationAgeGyr: cursor,
    remnant,
    segments,
  };
}

function findSegment(stageSequence, ageGyr) {
  const age = Math.max(0, finiteNumber(ageGyr, 0));
  const segments = stageSequence.segments;
  return (
    segments.find((segment) => age >= segment.startsAtGyr && age < segment.endsAtGyr) ||
    segments[segments.length - 1]
  );
}

function stageProgress(segment, ageGyr) {
  if (!Number.isFinite(segment.endsAtGyr) || segment.durationGyr <= 0) return 0;
  return clamp((ageGyr - segment.startsAtGyr) / segment.durationGyr, 0, 1);
}

function postMainSequenceScale(mass) {
  if (mass < 1.1) {
    return {
      subgiantL: 2.6,
      subgiantR: 3.2,
      giantL: Math.max(550, 780 * safePow(mass, 1.7, 1)),
      giantR: Math.max(65, 105 * safePow(mass, 0.7, 1)),
      clumpL: Math.max(45, 65 * safePow(mass, 1.5, 1)),
      clumpR: Math.max(9, 12 * safePow(mass, 0.8, 1)),
      agbL: Math.max(1200, 1800 * safePow(mass, 1.45, 1)),
      agbR: Math.max(130, 190 * safePow(mass, 0.8, 1)),
    };
  }
  if (mass < 2.2) {
    return {
      subgiantL: 3.2,
      subgiantR: 3.8,
      giantL: Math.max(700, 900 * safePow(mass, 1.6, 1)),
      giantR: Math.max(70, 115 * safePow(mass, 0.75, 1)),
      clumpL: Math.max(55, 85 * safePow(mass, 1.45, 1)),
      clumpR: Math.max(10, 15 * safePow(mass, 0.8, 1)),
      agbL: Math.max(1500, 2100 * safePow(mass, 1.35, 1)),
      agbR: Math.max(150, 220 * safePow(mass, 0.75, 1)),
    };
  }
  if (mass < 8) {
    return {
      subgiantL: 2.2,
      subgiantR: 3.0,
      giantL: Math.max(950, 1150 * safePow(mass, 1.35, 1)),
      giantR: Math.max(55, 80 * safePow(mass, 0.65, 1)),
      clumpL: Math.max(120, 180 * safePow(mass, 1.25, 1)),
      clumpR: Math.max(12, 17 * safePow(mass, 0.65, 1)),
      agbL: Math.max(2200, 2500 * safePow(mass, 1.2, 1)),
      agbR: Math.max(180, 230 * safePow(mass, 0.65, 1)),
    };
  }
  return {
    subgiantL: 1.6,
    subgiantR: 2.0,
    giantL: Math.max(25000, 28000 * safePow(mass / 10, 1.7, 1)),
    giantR: Math.max(60, 90 * safePow(mass / 10, 0.9, 1)),
    clumpL: Math.max(30000, 32000 * safePow(mass / 10, 1.8, 1)),
    clumpR: Math.max(85, 120 * safePow(mass / 10, 0.95, 1)),
    agbL: Math.max(42000, 46000 * safePow(mass / 10, 1.9, 1)),
    agbR: Math.max(120, 180 * safePow(mass / 10, 0.9, 1)),
  };
}

function whiteDwarfCoolingProperties(remnantMassMsol, coolingAgeGyr) {
  const mass = clamp(toFinite(remnantMassMsol, 0.6), 0.34, 1.35);
  const age = Math.max(0, toFinite(coolingAgeGyr, 0));
  const radius = clamp(0.0127 * (0.6 / mass) ** (1 / 3), 0.006, 0.025);
  const luminosity = clamp(0.012 / (age + 0.12) ** 1.25, 0.00001, 1.0);
  return {
    luminosityLsol: luminosity,
    radiusRsol: radius,
    tempK: stellarTemperatureK(luminosity, radius),
  };
}

function compactRemnantProperties(remnant, coolingAgeGyr) {
  if (remnant.stageId === "white_dwarf") {
    return whiteDwarfCoolingProperties(remnant.massMsol, coolingAgeGyr);
  }
  if (remnant.stageId === "neutron_star") {
    return {
      luminosityLsol: null,
      radiusRsol: 0.000017,
      tempK: null,
    };
  }
  if (remnant.stageId === "black_hole") {
    return {
      luminosityLsol: null,
      radiusRsol: null,
      tempK: null,
    };
  }
  return {
    luminosityLsol: null,
    radiusRsol: null,
    tempK: null,
  };
}

function stageProperties({ stageId, progress, ageGyr, stageSequence }) {
  const mass = stageSequence.initialMassMsol;
  const Z = stageSequence.metalMassFractionZ;
  const tMs = stageSequence.mainSequenceLifetimeGyr;
  const remnant = stageSequence.remnant;
  const tmsLuminosity = Math.max(evolvedLuminosity(mass, Z, tMs), zamsLuminosity(mass, Z), 1e-8);
  const tmsRadius = Math.max(evolvedRadius(mass, Z, tMs), zamsRadius(mass, Z), 1e-8);
  const scale = postMainSequenceScale(mass);

  if (stageId === "main_sequence" || stageId === "terminal_main_sequence") {
    const sampleAge = Math.min(ageGyr, tMs);
    const luminosity = evolvedLuminosity(mass, Z, sampleAge);
    const radius = evolvedRadius(mass, Z, sampleAge);
    return {
      luminosityLsol: luminosity,
      radiusRsol: radius,
      tempK: stellarTemperatureK(luminosity, radius),
    };
  }

  if (stageId === "subgiant") {
    const x = smooth(progress);
    const luminosity = mix(tmsLuminosity, tmsLuminosity * scale.subgiantL, x);
    const radius = mix(tmsRadius, tmsRadius * scale.subgiantR, x);
    return {
      luminosityLsol: luminosity,
      radiusRsol: radius,
      tempK: stellarTemperatureK(luminosity, radius),
    };
  }

  if (stageId === "red_giant") {
    const x = smooth(progress);
    const luminosity = mix(tmsLuminosity * scale.subgiantL, scale.giantL, x);
    const radius = mix(tmsRadius * scale.subgiantR, scale.giantR, x);
    return {
      luminosityLsol: luminosity,
      radiusRsol: radius,
      tempK: stellarTemperatureK(luminosity, radius),
    };
  }

  if (stageId === "core_helium_burning") {
    const x = smooth(progress);
    const luminosity = mix(scale.clumpL * 0.85, scale.clumpL * 1.1, x);
    const radius = mix(scale.clumpR, scale.clumpR * 1.25, x);
    return {
      luminosityLsol: luminosity,
      radiusRsol: radius,
      tempK: stellarTemperatureK(luminosity, radius),
    };
  }

  if (stageId === "asymptotic_giant_branch") {
    const x = smooth(progress);
    const luminosity = mix(scale.clumpL * 1.3, scale.agbL, x);
    const radius = mix(scale.clumpR * 1.25, scale.agbR, x);
    return {
      luminosityLsol: luminosity,
      radiusRsol: radius,
      tempK: stellarTemperatureK(luminosity, radius),
    };
  }

  if (stageId === "supergiant" || stageId === "supernova_transition") {
    const x = smooth(progress);
    const luminosity = mix(scale.giantL, scale.agbL, stageId === "supernova_transition" ? 1 : x);
    const radius = mix(scale.giantR, scale.agbR, stageId === "supernova_transition" ? 1 : x);
    return {
      luminosityLsol: luminosity,
      radiusRsol: radius,
      tempK: stellarTemperatureK(luminosity, radius),
    };
  }

  return compactRemnantProperties(remnant, ageGyr - stageSequence.remnantFormationAgeGyr);
}

function massLossFractionByStage(stageId, progress, stageSequence) {
  const mass = stageSequence.initialMassMsol;
  if (stageId === "main_sequence") {
    return mass >= 15 ? 0.015 * progress : 0;
  }
  if (stageId === "terminal_main_sequence") {
    return mass >= 15 ? 0.015 + 0.015 * progress : 0;
  }
  if (mass >= 8) {
    if (stageId === "subgiant") return 0.03 + 0.04 * progress;
    if (stageId === "supergiant") return 0.07 + 0.18 * progress;
    if (stageId === "supernova_transition") return 0.25 + 0.1 * progress;
  } else {
    if (stageId === "subgiant") return 0.01 * progress;
    if (stageId === "red_giant") return 0.01 + 0.07 * progress;
    if (stageId === "core_helium_burning") return 0.08 + 0.12 * progress;
    if (stageId === "asymptotic_giant_branch") return 0.2 + 0.8 * progress;
  }
  return 1;
}

function currentMassForSample(stageId, progress, stageSequence) {
  const initialMass = stageSequence.initialMassMsol;
  const remnantMass = finiteNumber(stageSequence.remnant.massMsol, initialMass);
  const totalLoss = Math.max(0, initialMass - remnantMass);
  if (stageId === "white_dwarf" || stageId === "neutron_star" || stageId === "black_hole") {
    return remnantMass;
  }
  if (stageId === "no_remnant") return 0;
  const loss = totalLoss * clamp(massLossFractionByStage(stageId, progress, stageSequence), 0, 1);
  return Math.max(remnantMass, initialMass - loss);
}

function massLossRateForSample(segment, stageId, progress, stageSequence) {
  if (!Number.isFinite(segment.endsAtGyr) || segment.durationGyr <= 0) return 0;
  const totalLoss = Math.max(
    0,
    stageSequence.initialMassMsol - finiteNumber(stageSequence.remnant.massMsol, 0),
  );
  if (totalLoss <= 0) return 0;
  let fractionSpan = 0;
  if (stageId === "terminal_main_sequence" && stageSequence.initialMassMsol >= 15)
    fractionSpan = 0.015;
  if (stageId === "red_giant") fractionSpan = 0.07;
  if (stageId === "core_helium_burning") fractionSpan = 0.12;
  if (stageId === "asymptotic_giant_branch") fractionSpan = 0.8;
  if (stageId === "supergiant") fractionSpan = 0.18;
  if (stageId === "supernova_transition") fractionSpan = 0.1;
  if (stageId === "subgiant") fractionSpan = stageSequence.initialMassMsol >= 8 ? 0.04 : 0.01;
  const taper = 0.45 + 0.55 * smooth(progress);
  return (totalLoss * fractionSpan * taper) / (segment.durationGyr * 1e9);
}

function coreMassesForSample(stageId, progress, stageSequence) {
  const mass = stageSequence.initialMassMsol;
  const remnantMass = finiteNumber(stageSequence.remnant.massMsol, 0);
  if (stageId === "main_sequence") {
    return { heliumCoreMsol: round(0, 4), carbonOxygenCoreMsol: round(0, 4) };
  }
  if (stageId === "terminal_main_sequence") {
    return {
      heliumCoreMsol: round(clamp(0.08 * mass + 0.04 * mass * progress, 0, remnantMass), 4),
      carbonOxygenCoreMsol: round(0, 4),
    };
  }
  if (stageId === "subgiant" || stageId === "red_giant") {
    return {
      heliumCoreMsol: round(clamp(0.12 * mass + 0.35 * remnantMass * progress, 0, remnantMass), 4),
      carbonOxygenCoreMsol: round(0, 4),
    };
  }
  if (stageId === "core_helium_burning") {
    return {
      heliumCoreMsol: round(
        clamp(0.45 * remnantMass + 0.35 * remnantMass * progress, 0, remnantMass),
        4,
      ),
      carbonOxygenCoreMsol: round(
        clamp(0.1 * remnantMass + 0.55 * remnantMass * progress, 0, remnantMass),
        4,
      ),
    };
  }
  if (
    stageId === "asymptotic_giant_branch" ||
    stageId === "supergiant" ||
    stageId === "supernova_transition"
  ) {
    return {
      heliumCoreMsol: round(clamp(remnantMass, 0, mass), 4),
      carbonOxygenCoreMsol: round(clamp(remnantMass * (0.72 + 0.28 * progress), 0, mass), 4),
    };
  }
  return {
    heliumCoreMsol: round(remnantMass, 4),
    carbonOxygenCoreMsol: round(remnantMass, 4),
  };
}

function habitableZoneForProperties({ luminosityLsol, tempK, stageId }) {
  const luminosity = Number(luminosityLsol);
  const temp = Number(tempK);
  const caveats = [];
  if (!(luminosity > 0) || !(temp > 0)) {
    return {
      innerAu: null,
      outerAu: null,
      optimisticInnerAu: null,
      optimisticOuterAu: null,
      confidence: "unsupported",
      caveats: ["Compact remnants without stellar irradiation are not assigned a standard HZ."],
    };
  }

  const hz = calcHabitableZoneAu({ luminosityLsol: luminosity, teffK: temp });
  let confidence = temp >= 2600 && temp <= 7200 ? "medium" : "low";
  if (stageId === "main_sequence" || stageId === "terminal_main_sequence") confidence = "high";
  if (temp < 2600 || temp > 7200) {
    caveats.push("Temperature lies outside the calibrated Kopparapu-style HZ polynomial range.");
  }
  if (
    stageId === "red_giant" ||
    stageId === "core_helium_burning" ||
    stageId === "asymptotic_giant_branch" ||
    stageId === "supergiant"
  ) {
    confidence = lowerConfidence(confidence, "low");
    caveats.push(
      "Post-main-sequence HZ distances move rapidly and are climate-history diagnostics only.",
    );
  }
  return {
    innerAu: round(hz.innerAu, 5),
    outerAu: round(hz.outerAu, 5),
    optimisticInnerAu: round(hz.innerAu * 0.75, 5),
    optimisticOuterAu: round(hz.outerAu * 1.35, 5),
    sIn: round(hz.sIn, 5),
    sOut: round(hz.sOut, 5),
    dT: round(hz.dT, 2),
    confidence,
    caveats,
  };
}

function confidenceForSample({ stageId, massMsol, metallicityFeH }) {
  let confidence = stageDefinition(stageId).confidenceBase;
  if (massMsol < 0.1 || massMsol > 60) confidence = lowerConfidence(confidence, "low");
  if (metallicityFeH < -2 || metallicityFeH > 0.4)
    confidence = lowerConfidence(confidence, "medium");
  if (stageId === "black_hole" || stageId === "neutron_star") confidence = "low";
  return confidence;
}

function caveatsForSample({ stageId, stageSequence, ageGyr, metallicityFeH, hz }) {
  const caveats = [];
  const mass = stageSequence.initialMassMsol;
  if (stageId !== "main_sequence" && stageId !== "terminal_main_sequence") {
    caveats.push(
      "Late-stage luminosity, radius, and mass loss are analytic approximations, not a full stellar-structure solve.",
    );
  }
  if (mass < 0.8 && ageGyr >= stageSequence.mainSequenceLifetimeGyr) {
    caveats.push(
      "Very-low-mass post-main-sequence endpoints are extrapolated beyond present-universe calibration.",
    );
  }
  if (mass >= 8) {
    caveats.push(
      "Massive-star late stages depend strongly on winds, rotation, fallback, and binarity.",
    );
  }
  if (metallicityFeH <= -2 || metallicityFeH >= 0.4) {
    caveats.push("Metallicity is near the edge of the static evolution calibration range.");
  }
  if (Array.isArray(hz?.caveats)) caveats.push(...hz.caveats);
  if (Array.isArray(stageSequence.remnant?.caveats)) caveats.push(...stageSequence.remnant.caveats);
  return [...new Set(caveats)];
}

export function computeStellarLifecycleSample({
  massMsol = 1,
  ageGyr = 4.6,
  metallicityFeH = 0,
  stageSequence: providedStageSequence = null,
} = {}) {
  const inputs = normalizeInputs({ massMsol, ageGyr, metallicityFeH });
  const stageSequence =
    providedStageSequence ||
    buildStellarLifecycleStageSequence({
      massMsol: inputs.massMsol,
      metallicityFeH: inputs.metallicityFeH,
    });
  const segment = findSegment(stageSequence, inputs.ageGyr);
  const progress = stageProgress(segment, inputs.ageGyr);
  const props = stageProperties({
    stageId: segment.id,
    progress,
    ageGyr: inputs.ageGyr,
    stageSequence,
  });
  const currentMass = currentMassForSample(segment.id, progress, stageSequence);
  const massLossRate = massLossRateForSample(segment, segment.id, progress, stageSequence);
  const hz = habitableZoneForProperties({
    luminosityLsol: props.luminosityLsol,
    tempK: props.tempK,
    stageId: segment.id,
  });
  const confidence = confidenceForSample({
    stageId: segment.id,
    massMsol: inputs.massMsol,
    metallicityFeH: inputs.metallicityFeH,
  });
  const caveats = caveatsForSample({
    stageId: segment.id,
    stageSequence,
    ageGyr: inputs.ageGyr,
    metallicityFeH: inputs.metallicityFeH,
    hz,
  });

  return {
    modelVersion: MODEL_VERSION,
    provider: "static analytic lifecycle track",
    inputs,
    ageGyr: round(inputs.ageGyr, 5),
    initialMassMsol: round(inputs.massMsol, 5),
    currentMassMsol: round(currentMass, 5),
    massLostMsol: round(Math.max(0, inputs.massMsol - currentMass), 5),
    massLossRateMsolPerYr: round(massLossRate, 12),
    stage: {
      id: segment.id,
      label: segment.label,
      family: segment.family,
      startsAtGyr: round(segment.startsAtGyr, 5),
      endsAtGyr: Number.isFinite(segment.endsAtGyr) ? round(segment.endsAtGyr, 5) : null,
      durationGyr: Number.isFinite(segment.durationGyr) ? round(segment.durationGyr, 5) : null,
      progress: round(progress, 4),
    },
    luminosityLsol: positiveOrNull(props.luminosityLsol),
    radiusRsol: positiveOrNull(props.radiusRsol),
    tempK: positiveOrNull(props.tempK),
    coreMasses: coreMassesForSample(segment.id, progress, stageSequence),
    habitableZoneAu: hz,
    remnant: {
      ...stageSequence.remnant,
      formationAgeGyr: round(stageSequence.remnantFormationAgeGyr, 5),
    },
    mainSequenceLifetimeGyr: round(stageSequence.mainSequenceLifetimeGyr, 5),
    remnantFormationAgeGyr: round(stageSequence.remnantFormationAgeGyr, 5),
    confidence,
    caveats,
  };
}

function defaultTrackEndAge(stageSequence, currentAgeGyr) {
  const remnantAge = stageSequence.remnantFormationAgeGyr;
  if (Number.isFinite(remnantAge) && remnantAge <= 200) {
    return clamp(Math.max(currentAgeGyr, remnantAge + 10), 0.1, 200);
  }
  return clamp(
    Math.max(currentAgeGyr, Math.min(stageSequence.mainSequenceLifetimeGyr, 20)),
    0.1,
    200,
  );
}

function uniqueSortedTimes(times, maxAgeGyr) {
  const cleaned = times
    .map((time) => clamp(time, 0, maxAgeGyr))
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => a - b);
  const unique = [];
  for (const time of cleaned) {
    if (!unique.length || Math.abs(unique[unique.length - 1] - time) > 1e-5) unique.push(time);
  }
  return unique;
}

function sampleAgesForTrack(stageSequence, currentAgeGyr, sampleCount, maxAgeGyr) {
  const count = clamp(Math.round(toFinite(sampleCount, 96)), 16, MAX_SAMPLE_COUNT);
  const uniform = Array.from({ length: count }, (_, index) =>
    count === 1 ? 0 : (maxAgeGyr * index) / (count - 1),
  );
  const boundaries = stageSequence.segments.flatMap((segment) => {
    const end = Number.isFinite(segment.endsAtGyr) ? segment.endsAtGyr : maxAgeGyr;
    const middle = Number.isFinite(end) ? (segment.startsAtGyr + end) / 2 : segment.startsAtGyr;
    return [segment.startsAtGyr, middle, end];
  });
  return uniqueSortedTimes([...uniform, ...boundaries, currentAgeGyr], maxAgeGyr);
}

function compactSample(sample) {
  return {
    ageGyr: sample.ageGyr,
    stageId: sample.stage.id,
    stageLabel: sample.stage.label,
    stageProgress: sample.stage.progress,
    currentMassMsol: sample.currentMassMsol,
    luminosityLsol: sample.luminosityLsol,
    radiusRsol: sample.radiusRsol,
    tempK: sample.tempK,
    hzInnerAu: sample.habitableZoneAu.innerAu,
    hzOuterAu: sample.habitableZoneAu.outerAu,
    hzOptimisticInnerAu: sample.habitableZoneAu.optimisticInnerAu,
    hzOptimisticOuterAu: sample.habitableZoneAu.optimisticOuterAu,
    hzConfidence: sample.habitableZoneAu.confidence,
    confidence: sample.confidence,
  };
}

export function computeStellarLifecycleTrack({
  massMsol = 1,
  ageGyr = 4.6,
  metallicityFeH = 0,
  sampleCount = 96,
  maxAgeGyr = null,
  planetOrbitsAu = [],
} = {}) {
  const inputs = normalizeInputs({ massMsol, ageGyr, metallicityFeH });
  const stageSequence = buildStellarLifecycleStageSequence({
    massMsol: inputs.massMsol,
    metallicityFeH: inputs.metallicityFeH,
  });
  const endAge =
    maxAgeGyr != null && Number.isFinite(Number(maxAgeGyr))
      ? clamp(Number(maxAgeGyr), Math.max(0.1, inputs.ageGyr), 200)
      : defaultTrackEndAge(stageSequence, inputs.ageGyr);
  const sampleAges = sampleAgesForTrack(stageSequence, inputs.ageGyr, sampleCount, endAge);
  const samples = sampleAges.map((age) =>
    compactSample(
      computeStellarLifecycleSample({
        massMsol: inputs.massMsol,
        ageGyr: age,
        metallicityFeH: inputs.metallicityFeH,
        stageSequence,
      }),
    ),
  );
  const currentSample = computeStellarLifecycleSample({
    massMsol: inputs.massMsol,
    ageGyr: inputs.ageGyr,
    metallicityFeH: inputs.metallicityFeH,
    stageSequence,
  });
  const summary = summarizeStellarLifecycleTrack({
    samples,
    currentSample,
    stageSequence,
    planetOrbitsAu,
  });

  return {
    modelVersion: MODEL_VERSION,
    provider: "static analytic lifecycle track",
    inputs,
    currentSample,
    samples,
    stageSequence: {
      ...stageSequence,
      segments: stageSequence.segments.map((segment) => ({
        ...segment,
        startsAtGyr: round(segment.startsAtGyr, 5),
        endsAtGyr: Number.isFinite(segment.endsAtGyr) ? round(segment.endsAtGyr, 5) : null,
        durationGyr: Number.isFinite(segment.durationGyr) ? round(segment.durationGyr, 5) : null,
      })),
      remnantFormationAgeGyr: round(stageSequence.remnantFormationAgeGyr, 5),
    },
    summary,
  };
}

function finiteSamplesWithHz(samples) {
  return samples.filter(
    (sample) => Number.isFinite(sample.hzInnerAu) && Number.isFinite(sample.hzOuterAu),
  );
}

function hzMovementSummary(samples) {
  const hzSamples = finiteSamplesWithHz(samples);
  if (!hzSamples.length) {
    return {
      innerMinAu: null,
      innerMaxAu: null,
      outerMinAu: null,
      outerMaxAu: null,
      movementFactor: null,
    };
  }
  const innerValues = hzSamples.map((sample) => sample.hzInnerAu);
  const outerValues = hzSamples.map((sample) => sample.hzOuterAu);
  const innerMin = Math.min(...innerValues);
  const innerMax = Math.max(...innerValues);
  const outerMin = Math.min(...outerValues);
  const outerMax = Math.max(...outerValues);
  return {
    innerMinAu: round(innerMin, 5),
    innerMaxAu: round(innerMax, 5),
    outerMinAu: round(outerMin, 5),
    outerMaxAu: round(outerMax, 5),
    movementFactor: innerMin > 0 ? round(innerMax / innerMin, 3) : null,
  };
}

function stageIdForSample(sample) {
  return sample?.stageId || sample?.stage?.id || "unknown";
}

function hzEdgeForSample(sample, edge, mode = "conservative") {
  const hz = sample?.habitableZoneAu || null;
  const conservativeInner = sample?.hzInnerAu ?? hz?.innerAu ?? null;
  const conservativeOuter = sample?.hzOuterAu ?? hz?.outerAu ?? null;
  if (mode === "optimistic") {
    if (edge === "inner") {
      return sample?.hzOptimisticInnerAu ?? hz?.optimisticInnerAu ?? conservativeInner * 0.75;
    }
    return sample?.hzOptimisticOuterAu ?? hz?.optimisticOuterAu ?? conservativeOuter * 1.35;
  }
  return edge === "inner" ? conservativeInner : conservativeOuter;
}

function hzBoundsForSample(sample, mode = "conservative") {
  const inner = Number(hzEdgeForSample(sample, "inner", mode));
  const outer = Number(hzEdgeForSample(sample, "outer", mode));
  if (!(inner > 0) || !(outer > inner)) return null;
  return { inner, outer };
}

function isOrbitInsideHzSample(sample, orbitAu, mode = "conservative") {
  const orbit = Number(orbitAu);
  const bounds = hzBoundsForSample(sample, mode);
  return !!bounds && orbit >= bounds.inner && orbit <= bounds.outer;
}

function interpolateSampleValue(previous, current, key, t) {
  const left = Number(previous?.[key]);
  const right = Number(current?.[key]);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
  return mix(left, right, t);
}

function interpolatedHzBounds(previous, current, t, mode = "conservative") {
  const innerLeft = Number(hzEdgeForSample(previous, "inner", mode));
  const innerRight = Number(hzEdgeForSample(current, "inner", mode));
  const outerLeft = Number(hzEdgeForSample(previous, "outer", mode));
  const outerRight = Number(hzEdgeForSample(current, "outer", mode));
  if (
    !(innerLeft > 0) ||
    !(innerRight > 0) ||
    !(outerLeft > innerLeft) ||
    !(outerRight > innerRight)
  ) {
    return null;
  }
  return {
    inner: mix(innerLeft, innerRight, t),
    outer: mix(outerLeft, outerRight, t),
  };
}

function estimateHzCrossingAge(previous, current, orbitAu, mode, previousInside) {
  const startAge = Number(previous?.ageGyr);
  const endAge = Number(current?.ageGyr);
  if (!(endAge > startAge)) return startAge;
  let lo = 0;
  let hi = 1;
  const orbit = Number(orbitAu);
  for (let i = 0; i < 20; i += 1) {
    const mid = (lo + hi) / 2;
    const bounds = interpolatedHzBounds(previous, current, mid, mode);
    const inside = !!bounds && orbit >= bounds.inner && orbit <= bounds.outer;
    if (inside === previousInside) lo = mid;
    else hi = mid;
  }
  return mix(startAge, endAge, (lo + hi) / 2);
}

function mergeIntervals(intervals) {
  const sorted = intervals
    .filter((interval) => interval && interval.endGyr > interval.startGyr)
    .sort((left, right) => left.startGyr - right.startGyr);
  const merged = [];
  for (const interval of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && interval.startGyr <= previous.endGyr + 1e-5) {
      previous.endGyr = Math.max(previous.endGyr, interval.endGyr);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

function buildHzIntervals(samples, orbitAu, mode = "conservative") {
  const intervals = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const startAge = Number(previous?.ageGyr);
    const endAge = Number(current?.ageGyr);
    if (!(endAge > startAge)) continue;

    const previousInside = isOrbitInsideHzSample(previous, orbitAu, mode);
    const currentInside = isOrbitInsideHzSample(current, orbitAu, mode);
    if (!previousInside && !currentInside) continue;

    let intervalStart = startAge;
    let intervalEnd = endAge;
    if (!previousInside && currentInside) {
      intervalStart = estimateHzCrossingAge(previous, current, orbitAu, mode, previousInside);
    } else if (previousInside && !currentInside) {
      intervalEnd = estimateHzCrossingAge(previous, current, orbitAu, mode, previousInside);
    }
    if (intervalEnd > intervalStart) {
      intervals.push({
        startGyr: intervalStart,
        endGyr: intervalEnd,
        startStageId: stageIdForSample(previous),
        endStageId: stageIdForSample(current),
      });
    }
  }
  return mergeIntervals(intervals);
}

function summarizeHzIntervals(intervals, currentInside) {
  const totalDuration = intervals.reduce(
    (sum, interval) => sum + Math.max(0, interval.endGyr - interval.startGyr),
    0,
  );
  const longest = intervals.reduce(
    (maxDuration, interval) => Math.max(maxDuration, interval.endGyr - interval.startGyr),
    0,
  );
  return {
    totalDurationGyr: round(totalDuration, 5),
    longestContinuousDurationGyr: round(longest, 5),
    firstEntryAgeGyr: intervals.length ? round(intervals[0].startGyr, 5) : null,
    lastExitAgeGyr: intervals.length ? round(intervals[intervals.length - 1].endGyr, 5) : null,
    currentlyInside: !!currentInside,
    intervals: intervals.map((interval) => ({
      startGyr: round(interval.startGyr, 5),
      endGyr: round(interval.endGyr, 5),
      startStageId: interval.startStageId,
      endStageId: interval.endStageId,
      durationGyr: round(interval.endGyr - interval.startGyr, 5),
    })),
  };
}

function estimateRadiusCrossingAge(previous, current, orbitAu, scale = 1) {
  const startAge = Number(previous?.ageGyr);
  const endAge = Number(current?.ageGyr);
  if (!(endAge > startAge)) return startAge;
  const orbit = Number(orbitAu);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const mid = (lo + hi) / 2;
    const radiusRsol = interpolateSampleValue(previous, current, "radiusRsol", mid);
    const inside = Number(radiusRsol) * SOLAR_RADIUS_AU * scale >= orbit;
    const previousInside = Number(previous?.radiusRsol) * SOLAR_RADIUS_AU * scale >= orbit;
    if (inside === previousInside) lo = mid;
    else hi = mid;
  }
  return mix(startAge, endAge, (lo + hi) / 2);
}

function summarizeOrbitHazards(samples, orbitAu) {
  const orbit = Number(orbitAu);
  let engulfmentAgeGyr = null;
  let giantEnvelopeDragAgeGyr = null;
  let redGiantExtremeIrradiation = false;
  let remnantEraOrbitCaveat = false;
  let runawayGreenhouseRisk = false;
  let snowlineEverInside = false;
  let snowlineEverOutside = false;

  for (const sample of samples) {
    const stageId = stageIdForSample(sample);
    const radiusAu = Number(sample?.radiusRsol) * SOLAR_RADIUS_AU;
    const bounds = hzBoundsForSample(sample, "conservative");
    if (Number.isFinite(radiusAu) && radiusAu > 0 && radiusAu >= orbit) {
      engulfmentAgeGyr = engulfmentAgeGyr ?? Number(sample.ageGyr);
    }
    if (GIANT_STAGE_IDS.has(stageId)) {
      if (Number.isFinite(radiusAu) && radiusAu > 0 && radiusAu * 1.25 >= orbit) {
        giantEnvelopeDragAgeGyr = giantEnvelopeDragAgeGyr ?? Number(sample.ageGyr);
      }
      if (bounds && orbit < bounds.inner) redGiantExtremeIrradiation = true;
    }
    if (bounds && orbit < bounds.inner) runawayGreenhouseRisk = true;
    if (REMNANT_STAGE_IDS.has(stageId)) remnantEraOrbitCaveat = true;
    const snowlineAu = Math.sqrt(Math.max(0, Number(sample?.luminosityLsol) || 0)) * 2.7;
    if (snowlineAu > 0) {
      if (orbit <= snowlineAu) snowlineEverInside = true;
      else snowlineEverOutside = true;
    }
  }

  if (engulfmentAgeGyr == null || giantEnvelopeDragAgeGyr == null) {
    for (let index = 1; index < samples.length; index += 1) {
      const previous = samples[index - 1];
      const current = samples[index];
      const previousRadiusAu = Number(previous?.radiusRsol) * SOLAR_RADIUS_AU;
      const currentRadiusAu = Number(current?.radiusRsol) * SOLAR_RADIUS_AU;
      if (
        engulfmentAgeGyr == null &&
        Number.isFinite(previousRadiusAu) &&
        Number.isFinite(currentRadiusAu) &&
        previousRadiusAu < orbit &&
        currentRadiusAu >= orbit
      ) {
        engulfmentAgeGyr = estimateRadiusCrossingAge(previous, current, orbit, 1);
      }
      if (
        giantEnvelopeDragAgeGyr == null &&
        Number.isFinite(previousRadiusAu) &&
        Number.isFinite(currentRadiusAu) &&
        previousRadiusAu * 1.25 < orbit &&
        currentRadiusAu * 1.25 >= orbit
      ) {
        giantEnvelopeDragAgeGyr = estimateRadiusCrossingAge(previous, current, orbit, 1.25);
      }
    }
  }

  return {
    engulfed: engulfmentAgeGyr != null,
    engulfmentAgeGyr: engulfmentAgeGyr == null ? null : round(engulfmentAgeGyr, 5),
    giantEnvelopeDragRisk: giantEnvelopeDragAgeGyr != null,
    giantEnvelopeDragAgeGyr:
      giantEnvelopeDragAgeGyr == null ? null : round(giantEnvelopeDragAgeGyr, 5),
    redGiantExtremeIrradiation,
    runawayGreenhouseRisk,
    remnantEraOrbitCaveat,
    snowlineCrossing:
      snowlineEverInside && snowlineEverOutside
        ? "crosses sampled snowline"
        : snowlineEverInside
          ? "inside sampled snowline"
          : snowlineEverOutside
            ? "outside sampled snowline"
            : "not evaluated",
  };
}

function hasLateHabitability(intervals) {
  return intervals.some(
    (interval) =>
      GIANT_STAGE_IDS.has(interval.startStageId) ||
      GIANT_STAGE_IDS.has(interval.endStageId) ||
      REMNANT_STAGE_IDS.has(interval.startStageId) ||
      REMNANT_STAGE_IDS.has(interval.endStageId),
  );
}

function interpretOrbitHzExposure({ conservativeHz, optimisticHz, hazards, lateHabitability }) {
  if (hazards.engulfed) {
    return "Orbit intersects the expanding stellar envelope in the sampled track.";
  }
  if (conservativeHz.currentlyInside) {
    return "Currently inside the conservative HZ in the sampled lifecycle track.";
  }
  if (lateHabitability) {
    return "HZ access is mainly a temporary late-stage passage with strong history caveats.";
  }
  if (conservativeHz.longestContinuousDurationGyr >= 2) {
    return "Long continuous conservative HZ interval in the sampled lifecycle track.";
  }
  if (optimisticHz.totalDurationGyr >= 1) {
    return "Only optimistic or intermittent HZ access in the sampled lifecycle track.";
  }
  return "Outside the sampled HZ for most or all of the lifecycle track.";
}

function summarizeOrbitHzExposure(samples, orbitAu, currentSample = null) {
  const orbit = Number(orbitAu);
  if (!(orbit > 0)) return null;
  const conservativeIntervals = buildHzIntervals(samples, orbit, "conservative");
  const optimisticIntervals = buildHzIntervals(samples, orbit, "optimistic");
  const current = currentSample || samples[samples.length - 1] || null;
  const conservativeHz = summarizeHzIntervals(
    conservativeIntervals,
    isOrbitInsideHzSample(current, orbit, "conservative"),
  );
  const optimisticHz = summarizeHzIntervals(
    optimisticIntervals,
    isOrbitInsideHzSample(current, orbit, "optimistic"),
  );
  const conservativeDurationGyr = conservativeHz.totalDurationGyr || 0;
  const optimisticDurationGyr = optimisticHz.totalDurationGyr || 0;
  const lateHabitability = hasLateHabitability(conservativeIntervals);
  const hazards = summarizeOrbitHazards(samples, orbit);
  const classification =
    conservativeDurationGyr >= 2
      ? "long-lived conservative HZ"
      : optimisticDurationGyr >= 1
        ? "intermittent or optimistic HZ"
        : "outside sampled HZ";
  return {
    orbitAu: round(orbit, 5),
    conservativeDurationGyr,
    optimisticDurationGyr,
    conservativeHz,
    optimisticHz,
    currentHzStatus: conservativeHz.currentlyInside
      ? "conservative"
      : optimisticHz.currentlyInside
        ? "optimistic"
        : "outside",
    lateHabitability,
    hazards,
    classification,
    interpretation: interpretOrbitHzExposure({
      conservativeHz,
      optimisticHz,
      hazards,
      lateHabitability,
    }),
  };
}

export function summarizeStellarLifecycleTrack({
  samples = [],
  currentSample = null,
  stageSequence = null,
  planetOrbitsAu = [],
} = {}) {
  const safeSamples = Array.isArray(samples) ? samples : [];
  const current =
    currentSample ||
    (safeSamples.length
      ? computeStellarLifecycleSample({
          massMsol: safeSamples[0].initialMassMsol || 1,
          ageGyr: safeSamples[0].ageGyr || 0,
        })
      : null);
  const stagesVisited = [...new Set(safeSamples.map((sample) => sample.stageId))].map(
    (stageId) => ({
      id: stageId,
      label: stageDefinition(stageId).label,
    }),
  );
  const warnings = [];
  if (current?.caveats?.length) warnings.push(...current.caveats);
  if (stageSequence?.initialMassMsol >= 8) {
    warnings.push("Massive-star endpoint is a remnant screen, not a supernova simulation.");
  }
  if (stageSequence?.remnantFormationAgeGyr > 200) {
    warnings.push("Post-main-sequence endpoint is beyond the default 200 Gyr static track window.");
  }

  return {
    currentStage: current?.stage || null,
    confidence: current?.confidence || "unsupported",
    mainSequenceLifetimeGyr: current?.mainSequenceLifetimeGyr || null,
    remnantFormationAgeGyr: current?.remnantFormationAgeGyr || null,
    remnant: current?.remnant || stageSequence?.remnant || null,
    stagesVisited,
    habitableZoneMovement: hzMovementSummary(safeSamples),
    planetHzImpacts: (Array.isArray(planetOrbitsAu) ? planetOrbitsAu : [])
      .map((orbit) => summarizeOrbitHzExposure(safeSamples, orbit, current))
      .filter(Boolean),
    warnings: [...new Set(warnings)],
  };
}

function timelineState(startGyr, endGyr, currentAgeGyr) {
  const start = startGyr == null ? null : Number(startGyr);
  const end = endGyr == null ? null : Number(endGyr);
  const current = Number(currentAgeGyr);
  if (!Number.isFinite(current)) return "conditional";
  if (Number.isFinite(end) && current > end) return "past";
  if (Number.isFinite(start) && current < start) return "future";
  return "current";
}

function timelineDriver(key, label, value, effect = "") {
  return { key, label, value: value == null ? "" : String(value), effect };
}

function timelineEra({
  id,
  label,
  category = "stellar",
  startGyr = null,
  endGyr = null,
  currentAgeGyr,
  state = null,
  confidence = "medium",
  headline = "",
  detail = "",
  warnings = [],
  drivers = [],
  lifecycleRole = null,
  timeBasis = "computed",
  endpointCandidate = false,
}) {
  return {
    id,
    label,
    category,
    startGyr,
    endGyr,
    state: state || timelineState(startGyr, endGyr, currentAgeGyr),
    confidence,
    severity: "info",
    headline: headline || label,
    detail,
    warnings,
    drivers,
    evidenceCodes: [],
    warningCodes: [],
    lifecycleRole,
    timeBasis,
    endpointCandidate,
  };
}

function formatTimelineNumber(value, decimals = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unknown";
  if (Math.abs(number) >= 1000 || (Math.abs(number) > 0 && Math.abs(number) < 0.001)) {
    return number.toExponential(2);
  }
  return `${round(number, decimals)}`;
}

function formatTimelineGyr(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unknown";
  if (number < 0.001) return `${formatTimelineNumber(number * 1_000_000, 0)} kyr`;
  if (number < 1) return `${formatTimelineNumber(number * 1000, number < 0.01 ? 1 : 0)} Myr`;
  return `${formatTimelineNumber(number, number < 10 ? 2 : 1)} Gyr`;
}

function timelineStageDetail(stageId, stageSequence) {
  const remnant = stageSequence?.remnant?.label || "compact remnant";
  const details = {
    main_sequence:
      "Core hydrogen burning supplies the stable luminous phase that anchors current HZ, rotation, wind, and activity context.",
    terminal_main_sequence:
      "Hydrogen burning is approaching turnoff; luminosity and radius accelerate toward the post-main-sequence branch.",
    subgiant:
      "The envelope expands and the star brightens after core hydrogen exhaustion, pushing the HZ outward.",
    red_giant:
      "Shell burning produces a large, cool, bright giant envelope. Inner-system orbits can experience strong irradiation changes.",
    core_helium_burning:
      "Helium burning produces a shorter-lived post-giant phase with a different luminosity and radius balance.",
    asymptotic_giant_branch:
      "Late shell burning and wind loss dominate this short phase before the envelope is shed.",
    supergiant:
      "Massive-star late evolution is rapid and wind-sensitive; endpoint timing is only a bounded diagnostic.",
    supernova_transition: `The model marks the terminal transition toward a ${remnant}; see model limits for what the transition does not simulate.`,
    white_dwarf:
      "The star has shed its envelope and entered compact-remnant cooling. Standard stellar HZ language is low confidence here.",
    neutron_star:
      "The endpoint is a compact neutron-star remnant; stellar irradiation and surface habitability context are unsupported.",
    black_hole:
      "The endpoint is a black-hole remnant screen. Accretion, jets, or binary effects are not modeled.",
    no_remnant:
      "The terminal endpoint is a disruption screen rather than a surviving luminous stellar surface.",
  };
  return details[stageId] || "Static lifecycle stage from the analytic single-star track.";
}

function timelineStageWarnings(stageId) {
  const limits = {
    main_sequence:
      "Model limit: static analytic single-star track; does not solve radial stellar structure, nuclear reaction networks, convection, rotation, magnetic cycles, or detailed composition profiles.",
    terminal_main_sequence:
      "Model limit: static analytic single-star track; does not solve shell-by-shell core growth, overshoot, internal mixing, or metallicity-dependent turnoff morphology.",
    subgiant:
      "Model limit: static analytic single-star track; does not solve detailed envelope readjustment, dredge-up, pulsation, or interior composition gradients.",
    red_giant:
      "Model limit: static analytic single-star track; does not solve thermal pulses, detailed wind prescriptions, dredge-up chemistry, pulsation, or dust formation.",
    core_helium_burning:
      "Model limit: static analytic single-star track; does not solve helium-burning networks, blue-loop morphology, convection, rotation, or mass-loss histories.",
    asymptotic_giant_branch:
      "Model limit: static analytic single-star track; does not simulate thermal pulses, third dredge-up chemistry, dust-driven winds, planetary-nebula shaping, or detailed nucleosynthesis.",
    supergiant:
      "Model limit: static analytic single-star track; does not solve late burning shells, wind clumping, rotation, binary stripping, pre-supernova structure, or eruptive mass loss.",
    supernova_transition:
      "Model limit: terminal-event screen; does not simulate explosion energy, nucleosynthesis, fallback, remnant kicks, or light curves.",
    white_dwarf:
      "Model limit: compact-remnant screen; does not solve white-dwarf cooling curves, crystallization, atmospheres, accretion, novae, or tidal disruption.",
    neutron_star:
      "Model limit: compact-remnant screen; does not model pulsar magnetospheres, cooling, natal kicks, accretion, jets, gravitational waves, or relativistic binary effects.",
    black_hole:
      "Model limit: compact-remnant screen; does not model accretion disks, jets, gravitational waves, natal kicks, relativistic binary effects, or mass transfer.",
    no_remnant:
      "Model limit: disruption screen; does not simulate pair-instability hydrodynamics, explosion energy, nucleosynthesis, ejecta structure, or light curves.",
  };
  return [
    limits[stageId] ||
      "Model limit: static analytic single-star track; does not solve full stellar structure, rotation, binaries, or time-dependent composition evolution.",
  ];
}

function currentStageIdFromSample(currentSample) {
  return currentSample?.stage?.id || "main_sequence";
}

function timelineEraIdForStage(stageId) {
  return `stellar-${stageId.replaceAll("_", "-")}`;
}

function stageTimelineEras(track, currentAgeGyr) {
  const segments = track?.stageSequence?.segments || [];
  return segments
    .filter((segment) => segment.id && Number.isFinite(segment.startsAtGyr))
    .map((segment) => {
      const currentStageId = currentStageIdFromSample(track.currentSample);
      const isCurrent = segment.id === currentStageId;
      const remnantStage =
        segment.id === "white_dwarf" ||
        segment.id === "neutron_star" ||
        segment.id === "black_hole" ||
        segment.id === "no_remnant";
      const category =
        segment.id === "supernova_transition"
          ? "radiation"
          : remnantStage
            ? "remnant"
            : segment.id === "main_sequence" || segment.id === "terminal_main_sequence"
              ? "stellar"
              : "interior";
      const endGyr = Number.isFinite(segment.endsAtGyr) ? segment.endsAtGyr : null;
      return timelineEra({
        id: timelineEraIdForStage(segment.id),
        label: segment.label,
        category,
        startGyr: segment.startsAtGyr,
        endGyr,
        currentAgeGyr,
        state: isCurrent ? "current" : null,
        confidence: stageDefinition(segment.id).confidenceBase || "medium",
        headline: isCurrent ? `Current stage: ${segment.label}` : segment.label,
        detail: timelineStageDetail(segment.id, track.stageSequence),
        warnings: timelineStageWarnings(segment.id),
        lifecycleRole: remnantStage
          ? "endpoint"
          : isCurrent
            ? "current"
            : segment.id === "supernova_transition"
              ? "risk"
              : segment.startsAtGyr > currentAgeGyr
                ? "transition"
                : "early",
        timeBasis: "computed",
        endpointCandidate: remnantStage,
        drivers: [
          timelineDriver(
            "duration",
            "Stage window",
            endGyr == null
              ? `after ${formatTimelineGyr(segment.startsAtGyr)}`
              : `${formatTimelineGyr(segment.startsAtGyr)} to ${formatTimelineGyr(endGyr)}`,
            "Positions this stage in the analytic lifecycle track",
          ),
          timelineDriver(
            "mass",
            "Initial mass",
            `${formatTimelineNumber(track?.inputs?.massMsol, 3)} Msol`,
            "Controls lifetime and endpoint class",
          ),
        ],
      });
    });
}

function timelineSummary(track) {
  const current = track?.currentSample;
  const hz = track?.summary?.habitableZoneMovement || {};
  const remnant = track?.summary?.remnant;
  const stage = current?.stage?.label || "Lifecycle track";
  const currentHz = current?.habitableZoneAu || {};
  const hzCopy =
    Number.isFinite(currentHz.innerAu) && Number.isFinite(hz.innerMaxAu)
      ? `HZ inner edge runs from ${formatTimelineNumber(
          currentHz.innerAu,
          2,
        )} AU now to ${formatTimelineNumber(hz.innerMaxAu, 2)} AU at peak`
      : Number.isFinite(hz.innerMinAu) && Number.isFinite(hz.innerMaxAu)
        ? `HZ inner edge samples ${formatTimelineNumber(hz.innerMinAu, 2)}-${formatTimelineNumber(
            hz.innerMaxAu,
            2,
          )} AU`
        : "HZ movement unavailable";
  const remnantCopy = remnant?.label ? `endpoint ${remnant.label}` : "endpoint unavailable";
  return `${stage}; ${hzCopy}; ${remnantCopy}.`;
}

function timelineFutureSummary(track, currentAgeGyr) {
  const currentStageId = currentStageIdFromSample(track?.currentSample);
  const segments = track?.stageSequence?.segments || [];
  const next = segments.find(
    (segment) => Number.isFinite(segment.startsAtGyr) && segment.startsAtGyr > currentAgeGyr,
  );
  const remnantAge = track?.summary?.remnantFormationAgeGyr;
  const remnant = track?.summary?.remnant;
  if (next) {
    return `Next major phase: ${next.label} near ${formatTimelineGyr(next.startsAtGyr)}; endpoint ${remnant?.label || "remnant"} near ${formatTimelineGyr(remnantAge)}.`;
  }
  if (
    currentStageId === "white_dwarf" ||
    currentStageId === "neutron_star" ||
    currentStageId === "black_hole"
  ) {
    return "Current model is already in a compact-remnant phase; future output is cooling or unsupported remnant context.";
  }
  return `Endpoint ${remnant?.label || "remnant"} near ${formatTimelineGyr(remnantAge)}.`;
}

function hzMigrationEra(track, currentAgeGyr) {
  const hz = track?.summary?.habitableZoneMovement || {};
  const currentHz = track?.currentSample?.habitableZoneAu || {};
  const remnantAge = track?.summary?.remnantFormationAgeGyr;
  if (!Number.isFinite(hz.innerMinAu) || !Number.isFinite(hz.innerMaxAu)) return null;
  if (!(hz.innerMaxAu > hz.innerMinAu * 1.15)) return null;
  const msLifetime = track?.summary?.mainSequenceLifetimeGyr;
  const startGyr = Number.isFinite(msLifetime)
    ? Math.min(msLifetime, currentAgeGyr)
    : currentAgeGyr;
  const endGyr = Number.isFinite(remnantAge) ? remnantAge : null;
  const currentStageId = currentStageIdFromSample(track?.currentSample);
  const current = currentStageId !== "main_sequence" && currentStageId !== "terminal_main_sequence";
  return timelineEra({
    id: "stellar-hz-migration",
    label: "Habitable-zone migration",
    category: "habitability",
    startGyr,
    endGyr,
    currentAgeGyr,
    state: current ? "current" : "future",
    confidence: "medium",
    headline: "The stellar HZ moves as luminosity changes",
    detail:
      "The sampled lifecycle track reports HZ movement as an irradiation context for future planet and moon interpretation, not as a climate-history solve.",
    lifecycleRole: current ? "current" : "transition",
    timeBasis: "computed",
    drivers: [
      timelineDriver(
        "inner",
        "Inner edge range",
        Number.isFinite(currentHz.innerAu)
          ? `${formatTimelineNumber(currentHz.innerAu, 3)} to ${formatTimelineNumber(
              hz.innerMaxAu,
              3,
            )} AU`
          : `${formatTimelineNumber(hz.innerMinAu, 3)}-${formatTimelineNumber(hz.innerMaxAu, 3)} AU`,
        "Shows conservative inner-HZ movement across the sampled track",
      ),
      timelineDriver(
        "outer",
        "Outer edge range",
        Number.isFinite(currentHz.outerAu)
          ? `${formatTimelineNumber(currentHz.outerAu, 3)} to ${formatTimelineNumber(
              hz.outerMaxAu,
              3,
            )} AU`
          : `${formatTimelineNumber(hz.outerMinAu, 3)}-${formatTimelineNumber(hz.outerMaxAu, 3)} AU`,
        "Shows conservative outer-HZ movement across the sampled track",
      ),
    ],
  });
}

function saturatedActivityEra({ xuvSaturationAgeGyr, currentAgeGyr, massMsol }) {
  const saturationAge = Number(xuvSaturationAgeGyr);
  if (!(saturationAge > 0)) return null;
  return timelineEra({
    id: "stellar-saturated-high-energy-era",
    label: "Saturated high-energy phase",
    category: "radiation",
    startGyr: 0,
    endGyr: saturationAge,
    currentAgeGyr,
    confidence: massMsol < 0.6 ? "medium" : "high",
    headline: "Early XUV and activity are elevated",
    detail:
      "The stellar XUV model marks an early saturated phase that can matter for atmosphere loss, water loss, and radiation context downstream.",
    lifecycleRole: "early",
    timeBasis: "computed",
    drivers: [
      timelineDriver(
        "saturationAge",
        "Saturation age",
        formatTimelineGyr(saturationAge),
        "Sets the high-energy exposure window",
      ),
      timelineDriver(
        "mass",
        "Mass",
        `${formatTimelineNumber(massMsol, 3)} Msol`,
        "Lower-mass stars stay active longer",
      ),
    ],
  });
}

export function buildStellarEraTimeline({
  lifecycleTrack = null,
  currentAgeGyr = null,
  xuvSaturationAgeGyr = null,
} = {}) {
  if (!lifecycleTrack?.currentSample || !lifecycleTrack?.stageSequence) return null;
  const age = Number.isFinite(Number(currentAgeGyr))
    ? Number(currentAgeGyr)
    : Number(lifecycleTrack.currentSample.ageGyr);
  const mass = Number(lifecycleTrack.inputs?.massMsol);
  const formationEnd = Math.min(0.05, Math.max(0.001, age || 0.05));
  const currentStageId = currentStageIdFromSample(lifecycleTrack.currentSample);
  const eras = [
    timelineEra({
      id: "stellar-formation-ignition",
      label: "Formation and ignition",
      category: "formation",
      startGyr: 0,
      endGyr: formationEnd,
      currentAgeGyr: age,
      confidence: "medium",
      headline: "Protostellar collapse and hydrogen ignition",
      detail:
        "The app records this as a context row only; it does not simulate protostellar accretion, disks, or pre-main-sequence tracks.",
      lifecycleRole: "birth",
      timeBasis: "heuristic",
      drivers: [
        timelineDriver(
          "mass",
          "Initial mass",
          `${formatTimelineNumber(mass, 3)} Msol`,
          "Sets the later stellar lifetime scale",
        ),
      ],
    }),
    saturatedActivityEra({
      xuvSaturationAgeGyr,
      currentAgeGyr: age,
      massMsol: mass,
    }),
    ...stageTimelineEras(lifecycleTrack, age),
    hzMigrationEra(lifecycleTrack, age),
  ].filter(Boolean);

  const currentEraId = timelineEraIdForStage(currentStageId);
  const birthEra = eras.find((era) => era.lifecycleRole === "birth") || eras[0] || null;
  const endpointEra =
    eras.find((era) => era.lifecycleRole === "endpoint") ||
    eras.find((era) => era.endpointCandidate) ||
    null;
  const remnant = lifecycleTrack.summary?.remnant || null;
  const remnantAge = lifecycleTrack.summary?.remnantFormationAgeGyr;
  const maxAgeGyr = Math.max(
    age || 0,
    Number(lifecycleTrack.samples?.at?.(-1)?.ageGyr) || 0,
    Number(remnantAge) || 0,
    0.1,
  );

  return {
    modelVersion: "object-lifecycle-timeline-v2",
    timelineKind: "lifecycle",
    subjectKind: "star",
    solverFamily: "stellarLifecycle",
    family: "star",
    currentAgeGyr: Number.isFinite(age) ? round(age, 5) : null,
    maxAgeGyr: round(maxAgeGyr, 5),
    birthEraId: birthEra?.id || null,
    currentEraId,
    endpointEraId: endpointEra?.id || null,
    endpointLabel: endpointEra?.label || remnant?.label || "Endpoint unresolved",
    endpointConfidence: endpointEra?.confidence || remnant?.confidence || "medium",
    endpointTimingLabel:
      endpointEra?.startGyr != null
        ? `After ${formatTimelineGyr(endpointEra.startGyr)}`
        : Number.isFinite(remnantAge)
          ? `After ${formatTimelineGyr(remnantAge)}`
          : "Endpoint timing unresolved",
    accuracyTier: "analytic",
    unsupportedPhysics: [
      "No full stellar-structure simulation.",
      "No rotation, binarity, detailed wind, or pulsation evolution.",
      "No explosion energy, nucleosynthesis, fallback, remnant kicks, or light curves.",
    ],
    summary: timelineSummary(lifecycleTrack),
    futureSummary: timelineFutureSummary(lifecycleTrack, age),
    confidence: lifecycleTrack.currentSample.confidence || lifecycleTrack.summary?.confidence,
    eras,
    eraIds: eras.map((era) => era.id),
    eraCounts: eras.reduce(
      (counts, era) => ({
        ...counts,
        [era.state]: (counts[era.state] || 0) + 1,
      }),
      {},
    ),
  };
}

export function listStellarLifecycleStages() {
  return Object.values(STAGE_DEFINITIONS).map((stage) => ({ ...stage }));
}
