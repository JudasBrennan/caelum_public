// ─── Moon visual rendering ──────────────────────────────────────────
//
// Physics-driven visual system for moons. Engine-computed properties
// (composition class, tidal heating, density, albedo, tidal lock)
// determine the moon's appearance from space.
//
// Architecture mirrors rockyPlanetStyles.js:
//   computeMoonVisualProfile()  → visual profile from engine data
//   drawMoonPreview()           → 180×180 px detailed preview (Three.js)

import { clamp } from "../engine/utils.js";
import { calcMoonExact } from "../engine/moon.js";
import { tintPalette } from "./renderUtils.js";
import { buildMoonDisplayModel } from "./moon/displayModel.js";

let moonPreviewModulePromise = null;

function loadMoonPreviewModule() {
  if (!moonPreviewModulePromise) {
    moonPreviewModulePromise = import("./threeNativePreview.js");
  }
  return moonPreviewModulePromise;
}

// ── Constants ─────────────────────────────────────────────────────

const MOON_PALETTES = {
  "Very icy": { c1: "#e8eef5", c2: "#c0d0e0", c3: "#7090a8" },
  Icy: { c1: "#d0dce8", c2: "#a0b8cc", c3: "#5a7a90" },
  "Subsurface ocean": { c1: "#c8d8e8", c2: "#90b0c8", c3: "#4a7090" },
  "Mixed rock/ice": { c1: "#c8c0b4", c2: "#989088", c3: "#5a5450" },
  "Dark icy": { c1: "#8a9098", c2: "#606870", c3: "#383e48" },
  "Dark carbonaceous": { c1: "#67635d", c2: "#45413f", c3: "#242224" },
  "Sulfur-rich": { c1: "#d7bd68", c2: "#9c7134", c3: "#5b3523" },
  "Salt-rich": { c1: "#f2f8fb", c2: "#c5e6ee", c3: "#6aa6b6" },
  Rocky: { c1: "#b8b0a8", c2: "#888078", c3: "#4a4540" },
  "Partially molten": { c1: "#b0a898", c2: "#807060", c3: "#504030" },
  "Iron-rich": { c1: "#8a8890", c2: "#585660", c3: "#2a2830" },
};

// ── Profile computation ──────────────────────────────────────────

/**
 * Compute a visual profile for a moon from engine-computed data.
 *
 * @param {object} moonCalc - Result of calcMoonExact()
 * @returns {object} MoonVisualProfile
 */
export function computeMoonVisualProfile(moonCalc) {
  if (!moonCalc) return fallbackProfile("unknown");

  const displayModel = buildMoonDisplayModel(moonCalc);
  if (displayModel) {
    const paletteKey = MOON_PALETTES[displayModel.paletteKey] ? displayModel.paletteKey : "Rocky";
    const landPalette = displayModel.landPalette
      ? tintPalette(displayModel.landPalette, Number(moonCalc?.inputs?.albedo) || 0.11)
      : null;
    return {
      bodyType: "moon",
      displayClass: displayModel.displayClass,
      palette: tintPalette(MOON_PALETTES[paletteKey], Number(moonCalc?.inputs?.albedo) || 0.11),
      landPalette,
      terrain: {
        type: displayModel.terrainType,
        craterDensity: displayModel.craterDensity,
      },
      iceCoverage: displayModel.iceCoverage,
      iceColour: displayModel.iceColour,
      ocean:
        displayModel.oceanCoverage > 0
          ? {
              coverage: displayModel.oceanCoverage,
              colour: displayModel.oceanColour,
              frozen: false,
            }
          : null,
      vegetation:
        displayModel.vegetationCoverage > 0 && displayModel.vegetationColour
          ? {
              coverage: displayModel.vegetationCoverage,
              colour: displayModel.vegetationColour,
            }
          : null,
      clouds:
        displayModel.cloudCoverage > 0
          ? {
              coverage: displayModel.cloudCoverage,
              colour: displayModel.cloudColour,
            }
          : null,
      atmosphere: {
        thickness: displayModel.atmosphereThickness,
        colour: displayModel.atmosphereColour,
        hazeStrength: displayModel.hazeStrength,
      },
      bodyScale: displayModel.bodyScale || null,
      bodyShape: displayModel.bodyShape || null,
      fractures:
        displayModel.fractureCount > 0
          ? {
              count: displayModel.fractureCount,
              colour: displayModel.fractureColour,
              alpha: displayModel.fractureAlpha,
            }
          : null,
      plumes:
        displayModel.plumeCount > 0
          ? {
              count: displayModel.plumeCount,
              colour: displayModel.plumeColour,
              alpha: clamp(0.1 + displayModel.plumeCount * 0.01, 0.12, 0.28),
            }
          : null,
      tidalHeating: {
        active: displayModel.tidalIntensity > 0.12,
        intensity: displayModel.tidalIntensity,
      },
      special: displayModel.special,
      compositionVisualDiagnostics: displayModel.compositionVisualDiagnostics || null,
      tidallyLocked: displayModel.tidallyLocked,
      artProfileId: displayModel.artProfileId,
      climateState: displayModel.climateState,
      seed: displayModel.seed,
    };
  }

  const tides = moonCalc.tides || {};
  const inputs = moonCalc.inputs || {};
  const physical = moonCalc.physical || {};

  const compClass = tides.compositionOverride || tides.compositionClass || "Rocky";
  const density = Number(inputs.densityGcm3) || 3.34;
  const albedo = Number(inputs.albedo) || 0.11;
  const radiusMoon = Number(physical.radiusMoon) || 1;
  const heatingEarth = Number(tides.tidalHeatingEarth) || 0;
  const locked = tides.moonLockedToPlanet === "Yes";
  const name = moonCalc.inputs?.name || moonCalc.id || "moon";

  // 1. Visual class — multi-signal decision tree.
  //    Uses albedo, density, radius, and tidal heating to disambiguate
  //    captured asteroids, dark icy bodies, and bright icy moons.
  let visualClass;
  if (tides.compositionOverride) {
    // User-set override — honour directly
    visualClass = compClass;
  } else if (albedo >= 0.5 && density < 3.5) {
    // Step 1: Bright surface — reflective ice confirmed
    visualClass = compClass;
  } else if (heatingEarth > 5) {
    // Step 2: High tidal heating — volcanic dominates
    visualClass = compClass;
  } else if (radiusMoon < 0.01 && albedo < 0.15) {
    // Step 3: Captured asteroid (tiny + dark)
    visualClass = "Rocky";
  } else if (density < 2.5 && albedo < 0.25 && radiusMoon >= 0.01) {
    // Step 4: Dark icy body (large + dark + low density)
    visualClass = "Dark icy";
  } else {
    // Step 5: Default — engine composition class
    visualClass = compClass;
  }

  // Fall back to Rocky if visual class has no palette
  if (!MOON_PALETTES[visualClass]) visualClass = "Rocky";
  const palette = tintPalette(MOON_PALETTES[visualClass], albedo);

  // 2. Terrain type and crater density
  const isCaptured = visualClass === "Rocky" && radiusMoon < 0.01;
  const isDarkIcy = visualClass === "Dark icy";
  const isIrregularCapture = radiusMoon < 0.08 && albedo < 0.12 && heatingEarth <= 0.1;

  let terrainType, craterDensity;
  if (heatingEarth > 10) {
    terrainType = "volcanic";
    craterDensity = 0.02;
  } else if (heatingEarth > 1) {
    terrainType = "active";
    craterDensity = 0.1;
  } else if (isCaptured) {
    terrainType = "worn";
    craterDensity = 0.5;
  } else if (isDarkIcy) {
    terrainType = "worn";
    craterDensity = 0.35;
  } else if (density < 2.0) {
    terrainType = "icy-smooth";
    craterDensity = 0.15;
  } else if (density < 3.2) {
    terrainType = "worn";
    craterDensity = 0.4;
  } else {
    terrainType = "cratered";
    craterDensity = 0.7;
  }

  // 3. Ice coverage
  let iceCoverage = 0;
  if (isCaptured) {
    iceCoverage = 0;
  } else if (isDarkIcy) {
    iceCoverage = 0.2;
  } else if (compClass === "Very icy" || compClass === "Icy") {
    iceCoverage = 0.9 + (compClass === "Very icy" ? 0.1 : 0);
  } else if (compClass === "Subsurface ocean") {
    iceCoverage = 0.95;
  } else if (compClass === "Mixed rock/ice") {
    iceCoverage = 0.4;
  }

  // 4. Tidal heating visual
  const tidalActive = heatingEarth > 0.5;
  const tidalIntensity = clamp(heatingEarth / 40, 0, 1);

  // 5. Atmosphere (most moons have none; only very large icy/mixed bodies)
  let atmThickness = 0;
  let atmColour = "#e0a840";
  if (
    radiusMoon > 1.0 &&
    density >= 1.5 &&
    density <= 2.5 &&
    (compClass === "Icy" || compClass === "Subsurface ocean" || compClass === "Mixed rock/ice")
  ) {
    atmThickness = 0.06;
  }

  // 6. Special effects
  let special = null;
  if (heatingEarth > 10) {
    special = "volcanic";
  } else if (compClass === "Subsurface ocean") {
    special = "subsurface-ocean";
  } else if (compClass === "Partially molten") {
    special = "molten";
  } else if (density < 1.0 && albedo > 0.6) {
    special = "frozen";
  } else if (isIrregularCapture) {
    special = "irregular-capture";
  }

  return {
    bodyType: "moon",
    displayClass: visualClass,
    palette,
    terrain: { type: terrainType, craterDensity },
    iceCoverage,
    iceColour: "#e8f0ff",
    tidalHeating: { active: tidalActive, intensity: tidalIntensity },
    atmosphere: { thickness: atmThickness, colour: atmColour },
    bodyScale: isIrregularCapture
      ? { x: 1.12, y: 0.82, z: 0.72 }
      : isCaptured
        ? { x: 1.04, y: 0.93, z: 0.86 }
        : null,
    bodyShape: isIrregularCapture
      ? { kind: "lumpy-potato", profile: "irregular-capture" }
      : isCaptured
        ? { kind: "lumpy-potato", profile: "captured-moonlet" }
        : null,
    special,
    tidallyLocked: locked,
    seed: String(name),
  };
}

/** Minimal safe profile when no engine data is available. */
function fallbackProfile(seed) {
  return {
    bodyType: "moon",
    displayClass: "Rocky",
    palette: MOON_PALETTES.Rocky,
    terrain: { type: "cratered", craterDensity: 0.5 },
    iceCoverage: 0,
    iceColour: "#e8f0ff",
    tidalHeating: { active: false, intensity: 0 },
    atmosphere: { thickness: 0, colour: "#e0a840" },
    bodyScale: null,
    bodyShape: null,
    special: null,
    tidallyLocked: true,
    seed: String(seed),
  };
}

// ── 180×180 px detailed preview ──────────────────────────────────

/**
 * Draw a detailed moon preview onto a <canvas> element.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} profile - MoonVisualProfile from computeMoonVisualProfile()
 * @param {object} [opts]
 */
export function drawMoonPreview(canvas, profile, opts = {}) {
  if (!canvas || !profile) return;
  void loadMoonPreviewModule()
    .then((mod) => {
      mod.renderMoonPreviewNative(canvas, profile, opts);
    })
    .catch((error) => {
      console.error("[WorldSmith] Failed to load moon preview runtime:", error);
    });
}
/* ── Moon Recipes ─────────────────────────────────────────────────── */

function makeMoonRecipePreviewCalc({
  name,
  radiusMoon,
  densityGcm3,
  albedo,
  compositionClass = "Rocky",
  tidalHeatingEarth = 0,
  moonLockedToPlanet = "Yes",
  atmosphereClass = "Airless",
  dominantSpecies = "",
  surfacePressureAtm = 0,
  surfaceAccessibleLiquidFraction = 0,
  liquidOceanFraction = 0,
  permanentIceFraction = 0,
  steamFraction = 0,
  landFraction = 1,
  subsurfaceOceanPresent = false,
  volcanicActivityScore = 0,
  cryovolcanicActivityScore = 0,
  resurfacingScore = 0,
  vegetationEligible = false,
  plantLifeScore = 0,
  vegetationDeepHex = null,
  climateState = "Stable",
} = {}) {
  return {
    id: String(name || "moon-recipe-preview"),
    inputs: {
      name: String(name || "Moon Recipe"),
      densityGcm3: Number(densityGcm3) || 3.34,
      albedo: Number(albedo) || 0.11,
    },
    physical: {
      radiusMoon: Number(radiusMoon) || 1,
    },
    tides: {
      compositionClass,
      tidalHeatingEarth: Number(tidalHeatingEarth) || 0,
      moonLockedToPlanet,
    },
    atmosphere: {
      atmosphereClass,
      dominantSpecies,
      surfacePressureAtm: Number(surfacePressureAtm) || 0,
    },
    geology: {
      volcanicActivityScore: Number(volcanicActivityScore) || 0,
      cryovolcanicActivityScore: Number(cryovolcanicActivityScore) || 0,
      resurfacingScore: Number(resurfacingScore) || 0,
    },
    biosphere: {
      vegetationEligible: Boolean(vegetationEligible),
      plantLifeScore: Number(plantLifeScore) || 0,
      vegetation: vegetationDeepHex ? { deepHex: vegetationDeepHex } : null,
    },
    climate: {
      climateState,
    },
    habitability: {
      hydrosphere: {
        surfaceAccessibleLiquidFraction: Number(surfaceAccessibleLiquidFraction) || 0,
        liquidOceanFraction: Number(liquidOceanFraction) || 0,
        permanentIceFraction: Number(permanentIceFraction) || 0,
        steamFraction: Number(steamFraction) || 0,
        landFraction: Number(landFraction) || 0,
        subsurfaceOceanPresent: Boolean(subsurfaceOceanPresent),
      },
    },
  };
}

function makeEngineMoonRecipePreviewCalc({
  parentOrbitAu = 1,
  parentMassEarth = 180,
  parentRadiusEarth = 10.3,
  parentDensityGcm3 = 1.1,
  parentGravityG = 1.7,
  surfaceFieldEarths = 4.5,
  magnetopauseRp = 28,
  moon = {},
}) {
  const tidalHabitableZone = {
    starHzEligible: true,
    innerKm: Math.max(parentRadiusEarth * 6371 * 6, 260000),
    outerKm: parentRadiusEarth * 6371 * 45,
  };
  const moonSemiMajorAxisKm = Number(moon.semiMajorAxisKm) || 650000;
  return calcMoonExact({
    starMassMsol: 1,
    starAgeGyr: 5.2,
    starMetallicityFeH: 0,
    moon,
    parentOverride: {
      inputs: {
        massEarth: parentMassEarth,
        semiMajorAxisAu: parentOrbitAu,
        eccentricity: 0.02,
        rotationPeriodHours: 10.5,
        cmfPct: 0,
      },
      derived: {
        densityGcm3: parentDensityGcm3,
        radiusEarth: parentRadiusEarth,
        gravityG: parentGravityG,
        surfaceFieldEarths,
        magnetopauseRp,
        radioisotopeAbundance: 1,
      },
    },
    moonSystemContext: {
      forcedEccentricity: Number(moon.forcedEccentricity) || 0,
      forcedEccentricitySource: Number(moon.forcedEccentricity) > 0 ? "manual" : "none",
      tidalHabitableZone: {
        ...tidalHabitableZone,
        withinZone:
          moonSemiMajorAxisKm >= tidalHabitableZone.innerKm &&
          moonSemiMajorAxisKm <= tidalHabitableZone.outerKm,
      },
      formation: {
        scenarioLabel: "Co-accreted regular moon",
        confidence: 0.71,
        rationale:
          "This preview uses a habitable-zone giant-planet parent with a regular prograde major moon.",
      },
    },
  });
}

export const MOON_RECIPES = [
  // ── Major Rocky ───────────────────────────────────────────────────
  {
    id: "luna",
    label: "Luna",
    category: "Major Rocky",
    preview: {
      tides: { compositionClass: "Rocky", tidalHeatingEarth: 0, moonLockedToPlanet: "Yes" },
      inputs: { densityGcm3: 3.34, albedo: 0.11, name: "Luna" },
      physical: { radiusMoon: 1.0 },
    },
    apply: {
      massMoon: 1.0,
      densityGcm3: 3.34,
      albedo: 0.11,
      semiMajorAxisKm: 384400,
      eccentricity: 0.0549,
      inclinationDeg: 5.145,
      compositionOverride: null,
      originPathway: "giantImpactDebrisDisk",
    },
  },
  {
    id: "callisto",
    label: "Callisto",
    category: "Major Rocky",
    preview: {
      tides: {
        compositionClass: "Mixed rock/ice",
        tidalHeatingEarth: 0,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 1.834, albedo: 0.17, name: "Callisto" },
      physical: { radiusMoon: 1.39 },
    },
    apply: {
      massMoon: 1.466,
      densityGcm3: 1.834,
      albedo: 0.17,
      semiMajorAxisKm: 1882700,
      eccentricity: 0.0074,
      inclinationDeg: 0.192,
      compositionOverride: null,
      originPathway: "circumplanetaryDisk",
    },
  },
  {
    id: "ganymede",
    label: "Ganymede",
    category: "Major Rocky",
    preview: {
      tides: {
        compositionClass: "Mixed rock/ice",
        tidalHeatingEarth: 0.1,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 1.942, albedo: 0.43, name: "Ganymede" },
      physical: { radiusMoon: 1.52 },
    },
    apply: {
      massMoon: 2.017,
      densityGcm3: 1.942,
      albedo: 0.43,
      semiMajorAxisKm: 1070400,
      eccentricity: 0.0011,
      inclinationDeg: 0.177,
      compositionOverride: null,
      originPathway: "circumplanetaryDisk",
    },
  },

  // ── Icy & Ocean ───────────────────────────────────────────────────
  {
    id: "europa",
    label: "Europa",
    category: "Icy & Ocean",
    hint: "Fractured ice shell over a buried ocean",
    preview: {
      tides: {
        compositionClass: "Subsurface ocean",
        tidalHeatingEarth: 1.5,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 3.013, albedo: 0.67, name: "Europa" },
      physical: { radiusMoon: 0.9 },
    },
    previewCalc: makeMoonRecipePreviewCalc({
      name: "Europa",
      radiusMoon: 0.9,
      densityGcm3: 3.013,
      albedo: 0.67,
      compositionClass: "Subsurface ocean",
      tidalHeatingEarth: 1.5,
      atmosphereClass: "Exosphere",
      surfacePressureAtm: 0.000001,
      permanentIceFraction: 0.9,
      landFraction: 0.1,
      subsurfaceOceanPresent: true,
      cryovolcanicActivityScore: 0.36,
      resurfacingScore: 0.34,
      climateState: "Snowball",
    }),
    apply: {
      massMoon: 0.654,
      densityGcm3: 3.013,
      albedo: 0.67,
      semiMajorAxisKm: 671100,
      eccentricity: 0.0094,
      inclinationDeg: 0.466,
      compositionOverride: "Subsurface ocean",
      originPathway: "circumplanetaryDisk",
    },
  },
  {
    id: "enceladus",
    label: "Enceladus",
    category: "Icy & Ocean",
    hint: "Bright cryovolcanic plume moon",
    preview: {
      tides: {
        compositionClass: "Subsurface ocean",
        tidalHeatingEarth: 3.0,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 1.61, albedo: 0.81, name: "Enceladus" },
      physical: { radiusMoon: 0.145 },
    },
    previewCalc: makeMoonRecipePreviewCalc({
      name: "Enceladus",
      radiusMoon: 0.145,
      densityGcm3: 1.61,
      albedo: 0.81,
      compositionClass: "Subsurface ocean",
      tidalHeatingEarth: 3.0,
      atmosphereClass: "Exosphere",
      dominantSpecies: "H\u2082O",
      surfacePressureAtm: 0.0005,
      permanentIceFraction: 0.94,
      landFraction: 0.06,
      subsurfaceOceanPresent: true,
      cryovolcanicActivityScore: 0.76,
      resurfacingScore: 0.58,
      climateState: "Snowball",
    }),
    apply: {
      massMoon: 0.001471,
      densityGcm3: 1.61,
      albedo: 0.81,
      semiMajorAxisKm: 238400,
      eccentricity: 0.0047,
      inclinationDeg: 0.009,
      compositionOverride: "Subsurface ocean",
      originPathway: "circumplanetaryDisk",
    },
  },
  {
    id: "titan",
    label: "Titan",
    category: "Icy & Ocean",
    hint: "Dense methane haze atmosphere",
    preview: {
      tides: {
        compositionClass: "Mixed rock/ice",
        tidalHeatingEarth: 0.02,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 1.882, albedo: 0.21, name: "Titan" },
      physical: { radiusMoon: 1.48 },
    },
    previewCalc: makeMoonRecipePreviewCalc({
      name: "Titan",
      radiusMoon: 1.48,
      densityGcm3: 1.882,
      albedo: 0.21,
      compositionClass: "Mixed rock/ice",
      tidalHeatingEarth: 0.02,
      atmosphereClass: "Dense volatile atmosphere",
      dominantSpecies: "CH\u2084",
      surfacePressureAtm: 1.45,
      permanentIceFraction: 0.28,
      landFraction: 0.72,
      climateState: "Snowball",
    }),
    apply: {
      massMoon: 1.8324,
      densityGcm3: 1.882,
      albedo: 0.21,
      semiMajorAxisKm: 1221870,
      eccentricity: 0.0288,
      inclinationDeg: 0.306,
      compositionOverride: null,
      originPathway: "circumplanetaryDisk",
    },
  },
  {
    id: "triton",
    label: "Triton",
    category: "Icy & Ocean",
    hint: "Bright retrograde frozen moon",
    preview: {
      tides: { compositionClass: "Icy", tidalHeatingEarth: 0.3, moonLockedToPlanet: "Yes" },
      inputs: { densityGcm3: 2.065, albedo: 0.7, name: "Triton" },
      physical: { radiusMoon: 0.78 },
    },
    apply: {
      massMoon: 0.2913,
      densityGcm3: 2.065,
      albedo: 0.7,
      semiMajorAxisKm: 354800,
      eccentricity: 0.000016,
      inclinationDeg: 157.345,
      compositionOverride: null,
      originPathway: "binaryExchangeCapture",
    },
  },

  // ── Volcanic ──────────────────────────────────────────────────────
  {
    id: "io",
    label: "Io",
    category: "Volcanic",
    hint: "Sulfurous volcanic resurfacing moon",
    preview: {
      tides: {
        compositionClass: "Partially molten",
        tidalHeatingEarth: 20.0,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 3.528, albedo: 0.63, name: "Io" },
      physical: { radiusMoon: 1.05 },
    },
    previewCalc: makeMoonRecipePreviewCalc({
      name: "Io",
      radiusMoon: 1.05,
      densityGcm3: 3.528,
      albedo: 0.63,
      compositionClass: "Partially molten",
      tidalHeatingEarth: 20,
      volcanicActivityScore: 0.92,
      resurfacingScore: 0.88,
      climateState: "Runaway greenhouse",
    }),
    apply: {
      massMoon: 1.215,
      densityGcm3: 3.528,
      albedo: 0.63,
      semiMajorAxisKm: 421800,
      eccentricity: 0.0041,
      inclinationDeg: 0.036,
      compositionOverride: "Partially molten",
      originPathway: "circumplanetaryDisk",
    },
  },
  {
    id: "molten-companion",
    label: "Molten Companion",
    category: "Volcanic",
    hint: "Extreme tidally heated lava moon",
    preview: {
      tides: {
        compositionClass: "Partially molten",
        tidalHeatingEarth: 35.0,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 4.0, albedo: 0.15, name: "Molten" },
      physical: { radiusMoon: 0.6 },
    },
    apply: {
      massMoon: 0.5,
      densityGcm3: 4.0,
      albedo: 0.15,
      semiMajorAxisKm: 200000,
      eccentricity: 0.08,
      inclinationDeg: 1.0,
      compositionOverride: "Partially molten",
      originPathway: "circumplanetaryDisk",
    },
  },

  // ── Small & Captured ──────────────────────────────────────────────
  {
    id: "oceanic",
    label: "Temperate Ocean",
    category: "Temperate & Living",
    hint: "Ocean moon with exposed seas and cloud bands",
    preview: {
      tides: {
        compositionClass: "Mixed rock/ice",
        tidalHeatingEarth: 0.18,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 2.65, albedo: 0.28, name: "Oceanic" },
      physical: { radiusMoon: 1.08 },
    },
    previewCalc: makeEngineMoonRecipePreviewCalc({
      parentOrbitAu: 1,
      moon: {
        name: "Oceanic",
        massMoon: 1.08,
        densityGcm3: 2.7,
        albedo: 0.18,
        semiMajorAxisKm: 720000,
        eccentricity: 0.014,
        inclinationDeg: 0.3,
        hydrosphereMode: "full",
        atmosphereMode: "manual",
        orbitalCouplingMode: "full",
        waterMassFractionPct: 9,
        salinityPct: 2.2,
        ammoniaPct: 0.2,
        manualSurfacePressureAtm: 1.2,
        n2Pct: 74,
        o2Pct: 20,
        co2Pct: 1.2,
        arPct: 1,
        h2oPct: 3.2,
        ch4Pct: 0.5,
        forcedEccentricity: 0.0045,
      },
    }),
    apply: {
      massMoon: 1.08,
      densityGcm3: 2.7,
      albedo: 0.18,
      semiMajorAxisKm: 720000,
      eccentricity: 0.014,
      inclinationDeg: 0.3,
      compositionOverride: null,
      originPathway: "circumplanetaryDisk",
      hydrosphereMode: "full",
      atmosphereMode: "manual",
      orbitalCouplingMode: "full",
      waterMassFractionPct: 9,
      salinityPct: 2.2,
      ammoniaPct: 0.2,
      manualSurfacePressureAtm: 1.2,
      n2Pct: 74,
      o2Pct: 20,
      co2Pct: 1.2,
      arPct: 1,
      h2oPct: 3.2,
      ch4Pct: 0.5,
      forcedEccentricity: 0.0045,
    },
  },
  {
    id: "verdant",
    label: "Biologically Active",
    category: "Temperate & Living",
    hint: "Temperate moon with oceans and surface vegetation",
    preview: {
      tides: {
        compositionClass: "Rocky",
        tidalHeatingEarth: 0.12,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 3.08, albedo: 0.31, name: "Verdant" },
      physical: { radiusMoon: 1.02 },
    },
    previewCalc: makeEngineMoonRecipePreviewCalc({
      parentOrbitAu: 0.84,
      moon: {
        name: "Verdant",
        massMoon: 1.08,
        densityGcm3: 2.7,
        albedo: 0.18,
        semiMajorAxisKm: 720000,
        eccentricity: 0.014,
        inclinationDeg: 0.3,
        hydrosphereMode: "full",
        atmosphereMode: "manual",
        orbitalCouplingMode: "full",
        waterMassFractionPct: 3.5,
        salinityPct: 2.2,
        ammoniaPct: 0.2,
        manualSurfacePressureAtm: 1.2,
        n2Pct: 74,
        o2Pct: 20,
        co2Pct: 1.2,
        arPct: 1,
        h2oPct: 3.2,
        ch4Pct: 0.5,
        forcedEccentricity: 0.0045,
      },
    }),
    apply: {
      massMoon: 1.08,
      densityGcm3: 2.7,
      albedo: 0.18,
      semiMajorAxisKm: 720000,
      eccentricity: 0.014,
      inclinationDeg: 0.3,
      compositionOverride: null,
      originPathway: "circumplanetaryDisk",
      hydrosphereMode: "full",
      atmosphereMode: "manual",
      orbitalCouplingMode: "full",
      waterMassFractionPct: 3.5,
      salinityPct: 2.2,
      ammoniaPct: 0.2,
      manualSurfacePressureAtm: 1.2,
      n2Pct: 74,
      o2Pct: 20,
      co2Pct: 1.2,
      arPct: 1,
      h2oPct: 3.2,
      ch4Pct: 0.5,
      forcedEccentricity: 0.0045,
    },
  },
  {
    id: "hazy-moon",
    label: "Hazy Atmosphere",
    category: "Temperate & Living",
    hint: "Dense haze-shrouded atmosphere with muted surface detail",
    preview: {
      tides: {
        compositionClass: "Mixed rock/ice",
        tidalHeatingEarth: 0.05,
        moonLockedToPlanet: "Yes",
      },
      inputs: { densityGcm3: 1.95, albedo: 0.24, name: "Hazy" },
      physical: { radiusMoon: 1.22 },
    },
    previewCalc: makeMoonRecipePreviewCalc({
      name: "Hazy",
      radiusMoon: 1.22,
      densityGcm3: 1.95,
      albedo: 0.24,
      compositionClass: "Mixed rock/ice",
      tidalHeatingEarth: 0.05,
      atmosphereClass: "Dense volatile atmosphere",
      dominantSpecies: "N\u2082",
      surfacePressureAtm: 1.65,
      permanentIceFraction: 0.08,
      landFraction: 0.92,
      climateState: "Stable",
    }),
    apply: {
      massMoon: 1.46,
      densityGcm3: 1.95,
      albedo: 0.24,
      semiMajorAxisKm: 980000,
      eccentricity: 0.02,
      inclinationDeg: 0.45,
      compositionOverride: null,
      originPathway: "circumplanetaryDisk",
    },
  },
  {
    id: "phobos",
    label: "Phobos",
    category: "Small & Captured",
    preview: {
      tides: { compositionClass: "Rocky", tidalHeatingEarth: 0, moonLockedToPlanet: "Yes" },
      inputs: { densityGcm3: 1.876, albedo: 0.071, name: "Phobos" },
      physical: { radiusMoon: 0.0064 },
    },
    apply: {
      massMoon: 0.000000145,
      densityGcm3: 1.876,
      albedo: 0.071,
      semiMajorAxisKm: 9375,
      eccentricity: 0.015,
      inclinationDeg: 1.09,
      compositionOverride: null,
      originPathway: "capturedIrregular",
    },
  },
  {
    id: "deimos",
    label: "Deimos",
    category: "Small & Captured",
    preview: {
      tides: { compositionClass: "Rocky", tidalHeatingEarth: 0, moonLockedToPlanet: "Yes" },
      inputs: { densityGcm3: 1.47, albedo: 0.068, name: "Deimos" },
      physical: { radiusMoon: 0.0036 },
    },
    apply: {
      massMoon: 0.00000002,
      densityGcm3: 1.47,
      albedo: 0.068,
      semiMajorAxisKm: 23457,
      eccentricity: 0.0002,
      inclinationDeg: 0.93,
      compositionOverride: null,
      originPathway: "capturedIrregular",
    },
  },
  {
    id: "irregular-capture",
    label: "Irregular Capture",
    category: "Small & Captured",
    preview: {
      tides: { compositionClass: "Rocky", tidalHeatingEarth: 0, moonLockedToPlanet: "No" },
      inputs: { densityGcm3: 1.5, albedo: 0.05, name: "Captured" },
      physical: { radiusMoon: 0.04 },
    },
    apply: {
      massMoon: 0.0001,
      densityGcm3: 1.5,
      albedo: 0.05,
      semiMajorAxisKm: 12000000,
      eccentricity: 0.4,
      inclinationDeg: 145.0,
      compositionOverride: null,
      originPathway: "capturedIrregular",
    },
  },
];

export { MOON_PALETTES };
