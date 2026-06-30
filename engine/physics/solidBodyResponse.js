import { clamp, round, toFinite } from "../utils.js";
import { calcK2LoveNumber } from "./rotation.js";

const DEFAULT_RIGIDITY_PA = 30e9;
const DEFAULT_TIDAL_Q = 30;

function layerFraction(structure, key) {
  return clamp(toFinite(structure?.layerMassFractions?.[key], 0), 0, 1);
}

export function estimateMomentOfInertiaFactor({ solidBodyStructure = null } = {}) {
  const structure =
    solidBodyStructure && typeof solidBodyStructure === "object" ? solidBodyStructure : {};
  const structureClass = String(structure.structureClass || "");
  const compactnessClass = String(structure.compactnessClass || "");
  const core = clamp(toFinite(structure.coreMassFraction, layerFraction(structure, "core")), 0, 1);
  const ice = clamp(toFinite(structure.iceMassFraction, 0), 0, 1);
  const ocean = clamp(toFinite(structure.oceanMassFraction, 0), 0, 1);
  const porosity = clamp(toFinite(structure.porosityFraction, 0), 0, 0.8);
  const differentiated =
    structure.differentiatedInterior === true || structureClass.includes("differentiated");

  let factor = 0.4 - 0.11 * core + 0.025 * ice + 0.015 * ocean + 0.035 * porosity;
  if (differentiated) factor -= 0.018;
  if (structureClass === "iron-rich-body") factor -= 0.025;
  if (structureClass === "ice-rock-ocean-world") factor += 0.008;
  if (compactnessClass === "rubble-pile" || compactnessClass === "small-porous") {
    factor = Math.max(factor, 0.39);
  }

  return {
    modelVersion: "solid-body-inertia-v1",
    momentOfInertiaFactor: round(clamp(factor, 0.28, 0.42), 5),
    confidence: structure.confidence || "low",
    assumptions: ["Moment factor is layer-aware but not a solved radial density profile."],
  };
}

export function estimateEffectiveRigidityAndQ({
  composition = null,
  solidBodyStructure = null,
  hydrosphere = null,
  meltFraction = 0,
} = {}) {
  const structure =
    solidBodyStructure && typeof solidBodyStructure === "object" ? solidBodyStructure : {};
  const baseRigidityPa = Math.max(
    toFinite(composition?.mu ?? composition?.rigidityPa, DEFAULT_RIGIDITY_PA),
    1e6,
  );
  const baseQ = Math.max(
    toFinite(composition?.Q ?? composition?.tidalQualityFactor, DEFAULT_TIDAL_Q),
    1,
  );
  const ice = clamp(toFinite(structure.iceMassFraction, 0), 0, 1);
  const ocean = clamp(
    Math.max(
      toFinite(structure.oceanMassFraction, 0),
      hydrosphere?.subsurfaceOceanPresent ? 0.12 : 0,
      toFinite(hydrosphere?.liquidOceanFraction, 0) * 0.08,
    ),
    0,
    1,
  );
  const porosity = clamp(toFinite(structure.porosityFraction, 0), 0, 0.8);
  const metal = clamp(
    toFinite(structure.layerMassFractions?.core, structure.coreMassFraction),
    0,
    1,
  );
  const melt = clamp(toFinite(meltFraction, 0), 0, 1);
  const structureClass = String(structure.structureClass || "");

  let rigidityScale = 1 + 0.55 * metal - 0.72 * ice - 0.86 * ocean - 0.5 * porosity - 0.72 * melt;
  if (structureClass === "ice-rock-ocean-world") rigidityScale -= 0.12;
  if (structureClass === "small-porous-body") rigidityScale -= 0.24;
  if (structureClass === "iron-rich-body") rigidityScale += 0.35;
  const rigidityPa = clamp(baseRigidityPa * rigidityScale, 0.12e9, 120e9);

  let qScale = 1 + 0.65 * metal - 0.45 * ice - 0.72 * ocean + 0.35 * porosity - 0.55 * melt;
  if (structureClass === "ice-rock-ocean-world") qScale -= 0.12;
  if (structureClass === "small-porous-body") qScale += 0.8;
  const tidalQualityFactor = clamp(baseQ * qScale, 2, 160);

  const caveats = [
    "Effective rigidity and Q are layer-aware heuristics; k2 remains an elastic-gravity approximation.",
  ];
  if (ocean > 0.05)
    caveats.push("Liquid layers lower effective rigidity and increase tidal response.");
  if (porosity > 0.12) caveats.push("Porosity makes the tidal response especially uncertain.");

  return {
    modelVersion: "solid-body-response-v1",
    rigidityPa: round(rigidityPa, 3),
    tidalQualityFactor: round(tidalQualityFactor, 3),
    baseRigidityPa: round(baseRigidityPa, 3),
    baseTidalQualityFactor: round(baseQ, 3),
    rigidityScale: round(rigidityScale, 4),
    tidalQualityScale: round(qScale, 4),
    confidence: structure.confidence || "low",
    caveats,
  };
}

export function buildSolidBodyResponse({
  densityKgM3 = null,
  gravityMs2 = null,
  radiusM = null,
  composition = null,
  solidBodyStructure = null,
  hydrosphere = null,
} = {}) {
  const inertia = estimateMomentOfInertiaFactor({ solidBodyStructure });
  const material = estimateEffectiveRigidityAndQ({
    composition,
    solidBodyStructure,
    hydrosphere,
  });
  const k2 =
    toFinite(densityKgM3, 0) > 0 && toFinite(gravityMs2, 0) > 0 && toFinite(radiusM, 0) > 0
      ? calcK2LoveNumber({
          densityKgM3,
          gravityMs2,
          radiusM,
          rigidityPa: material.rigidityPa,
        })
      : null;

  return {
    modelVersion: "solid-body-response-v1",
    materialResponseModelVersion: material.modelVersion,
    momentOfInertiaFactor: inertia.momentOfInertiaFactor,
    rigidityPa: material.rigidityPa,
    tidalQualityFactor: material.tidalQualityFactor,
    k2LoveNumber: k2 == null ? null : round(k2, 6),
    confidence: material.confidence,
    caveats: material.caveats,
    assumptions: inertia.assumptions,
  };
}

export function calcSolidBodyFigure({
  massEarth = 0,
  radiusEarth = 0,
  rotationPeriodHours = 0,
  momentOfInertiaFactor = 0.4,
  compactnessClass = "compact",
} = {}) {
  const mass = Math.max(toFinite(massEarth, 0), 0);
  const radius = Math.max(toFinite(radiusEarth, 0), 0);
  const rotationHours = Math.max(toFinite(rotationPeriodHours, 0), 0);
  const compactness = String(compactnessClass || "");
  if (mass <= 0 || radius <= 0 || rotationHours <= 0) {
    return {
      modelVersion: "solid-body-figure-v1",
      supported: false,
      confidence: "unknown",
      caveat: "Mass, radius, or rotation period is missing.",
    };
  }
  if (compactness === "rubble-pile" || compactness === "small-porous") {
    return {
      modelVersion: "solid-body-figure-v1",
      supported: false,
      confidence: "low",
      caveat: "Small irregular bodies are not assigned a confident hydrostatic figure.",
    };
  }

  const omega = (2 * Math.PI) / (rotationHours * 3600);
  const q = (omega ** 2 * (radius * 6371e3) ** 3) / (6.674e-11 * mass * 5.972e24);
  const moi = clamp(toFinite(momentOfInertiaFactor, 0.4), 0.25, 0.42);
  const j2 = clamp((q / 3) * (0.9 - 0.7 * (moi - 0.25)), 0, 0.2);
  return {
    modelVersion: "solid-body-figure-v1",
    supported: true,
    q: round(q, 8),
    j2: round(j2, 8),
    momentOfInertiaFactor: moi,
    confidence: "low",
    caveat: "Hydrostatic figure is a first-order rotational proxy.",
  };
}
