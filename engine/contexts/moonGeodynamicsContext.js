import { clamp, round, toFinite } from "../utils.js";

function classFromScore(score, labels = ["none", "weak", "moderate", "strong", "extreme"]) {
  const value = clamp(toFinite(score, 0), 0, 1);
  if (value < 0.08) return labels[0];
  if (value < 0.28) return labels[1];
  if (value < 0.55) return labels[2];
  if (value < 0.82) return labels[3];
  return labels[4];
}

function craterRetentionClass({ resurfacingScore, atmospherePressureAtm, surfaceLiquidFraction }) {
  const erasure = clamp(
    toFinite(resurfacingScore, 0) * 0.62 +
      Math.log10(1 + Math.max(toFinite(atmospherePressureAtm, 0), 0)) * 0.16 +
      toFinite(surfaceLiquidFraction, 0) * 0.22,
    0,
    1,
  );
  if (erasure >= 0.72) return "low-crater-retention";
  if (erasure >= 0.42) return "moderate-crater-retention";
  return "high-crater-retention";
}

function rockOceanExchangeScore({ hydrosphere, geology, solidBodyStructure }) {
  const ocean = hydrosphere?.subsurfaceOceanPresent
    ? 1
    : Math.max(
        toFinite(hydrosphere?.subsurfaceOceanScore, 0),
        toFinite(hydrosphere?.liquidOceanFraction, 0),
      );
  const barrierPenalty = hydrosphere?.highPressureIceBarrier ? 0.45 : 1;
  const rock = clamp(toFinite(solidBodyStructure?.silicateMassFraction, 0.5), 0, 1);
  const activity = Math.max(
    toFinite(geology?.cryovolcanicActivityScore, 0),
    toFinite(geology?.volcanicActivityScore, 0) * 0.45,
  );
  return clamp(ocean * (0.45 + 0.35 * rock + 0.2 * activity) * barrierPenalty, 0, 1);
}

function resurfacingPotentialClass(score) {
  const value = clamp(toFinite(score, 0), 0, 1);
  if (value >= 0.68) return "active";
  if (value >= 0.34) return "moderate";
  if (value >= 0.12) return "limited";
  return "ancient";
}

function erosionPotentialClass({ atmospherePressureAtm, surfaceLiquidFraction }) {
  const erosionScore = clamp(
    Math.log10(1 + Math.max(toFinite(atmospherePressureAtm, 0), 0)) * 0.42 +
      toFinite(surfaceLiquidFraction, 0) * 0.58,
    0,
    1,
  );
  if (erosionScore >= 0.64) return "strong";
  if (erosionScore >= 0.32) return "moderate";
  if (erosionScore >= 0.08) return "weak";
  return "minimal";
}

export function buildMoonGeodynamicsContext({
  geology = null,
  hydrosphere = null,
  solidBodyStructure = null,
  solidBodyResponse = null,
  interiorEvolutionContext = null,
  atmosphere = null,
} = {}) {
  const geo = geology && typeof geology === "object" ? geology : {};
  const hydro = hydrosphere && typeof hydrosphere === "object" ? hydrosphere : {};
  const structure =
    solidBodyStructure && typeof solidBodyStructure === "object" ? solidBodyStructure : {};
  const response =
    solidBodyResponse && typeof solidBodyResponse === "object" ? solidBodyResponse : {};
  const volcanicScore = clamp(toFinite(geo.volcanicActivityScore, 0), 0, 1);
  const cryovolcanicScore = clamp(toFinite(geo.cryovolcanicActivityScore, 0), 0, 1);
  const resurfacingScore = clamp(
    toFinite(geo.resurfacingScore, Math.max(volcanicScore, cryovolcanicScore)),
    0,
    1,
  );
  const oceanPersistence = clamp(toFinite(geo.oceanPersistenceScore, 0), 0, 1);
  const hydrothermalPotential = clamp(
    0.36 * cryovolcanicScore +
      0.28 * oceanPersistence +
      0.2 * toFinite(hydro.subsurfaceOceanScore, 0) +
      0.16 * clamp(toFinite(interiorEvolutionContext?.outputs?.heatRetentionScore, 0.35), 0, 1),
    0,
    1,
  );
  const exchangeScore = rockOceanExchangeScore({
    hydrosphere: hydro,
    geology: geo,
    solidBodyStructure: structure,
  });
  const craterClass = craterRetentionClass({
    resurfacingScore,
    atmospherePressureAtm: atmosphere?.surfacePressureAtm,
    surfaceLiquidFraction: hydro.surfaceAccessibleLiquidFraction,
  });
  const resurfacingPotential = resurfacingPotentialClass(resurfacingScore);
  const erosionPotential = erosionPotentialClass({
    atmospherePressureAtm: atmosphere?.surfacePressureAtm,
    surfaceLiquidFraction: hydro.surfaceAccessibleLiquidFraction,
  });
  const dominantProcess =
    volcanicScore > cryovolcanicScore + 0.08
      ? "silicate-volcanism"
      : cryovolcanicScore > volcanicScore + 0.08
        ? "cryovolcanism"
        : resurfacingScore > 0.08
          ? "mixed-resurfacing"
          : "crater-retention";
  const caveats = [
    "Moon geodynamics suppresses Earth-style mobile-lid tectonics by default.",
    "Scores are context classes, not a finite-element tidal or mantle-convection solve.",
  ];
  if (structure.structureClass === "small-porous-body") {
    caveats.push("Small porous bodies are not treated as differentiated silicate planets.");
  }
  if (response.confidence === "low" || structure.confidence === "low") {
    caveats.push("Bulk structure is weakly constrained, so geodynamics confidence is limited.");
  }

  return {
    modelVersion: "moon-geodynamics-context-v1",
    status: "supported",
    confidence:
      structure.confidence === "high" || structure.confidence === "medium" ? "medium" : "low",
    outputs: {
      silicateVolcanismClass: classFromScore(volcanicScore),
      silicateVolcanismScore: round(volcanicScore, 3),
      cryovolcanismClass: classFromScore(cryovolcanicScore),
      cryovolcanismScore: round(cryovolcanicScore, 3),
      hydrothermalPotentialClass: classFromScore(hydrothermalPotential, [
        "none",
        "weak",
        "possible",
        "strong",
        "robust",
      ]),
      hydrothermalPotentialScore: round(hydrothermalPotential, 3),
      rockOceanExchangeClass: classFromScore(exchangeScore, [
        "none",
        "limited",
        "possible",
        "likely",
        "strong",
      ]),
      rockOceanExchangeScore: round(exchangeScore, 3),
      craterRetentionClass: craterClass,
      resurfacingClass: geo.resurfacingClass || "Unknown",
      resurfacingPotentialClass: resurfacingPotential,
      erosionPotentialClass: erosionPotential,
      resurfacingScore: round(resurfacingScore, 3),
      dominantProcess,
    },
    inputs: {
      structureClass: structure.structureClass || "unknown",
      compactnessClass: structure.compactnessClass || "unknown",
      materialResponseModelVersion: response.modelVersion || null,
      geologyModelVersion: geo.modelVersion || null,
      hydrosphereModelVersion: hydro.modelVersion || null,
    },
    caveats,
  };
}
