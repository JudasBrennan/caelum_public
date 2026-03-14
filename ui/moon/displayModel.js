import { clamp } from "../../engine/utils.js";

function normalizeCompositionClass(rawValue) {
  const raw = String(rawValue || "").trim();
  return raw.replace(/\s*\(.*?\)\s*$/, "") || "Rocky";
}

function classifyVisualState({
  surfaceOceanFraction,
  permanentIceFraction,
  subsurfaceOceanPresent,
  atmosphereClass,
  dominantSpecies,
  vegetationCoverage,
  volcanicScore,
}) {
  const atmosphere = String(atmosphereClass || "");
  const dominant = String(dominantSpecies || "");
  const hasSurfaceOcean = surfaceOceanFraction >= 0.12;
  const hasSurfaceIce = permanentIceFraction >= 0.22;
  const hasHaze =
    atmosphere !== "Airless" &&
    atmosphere !== "Exosphere" &&
    (["CH₄", "CO", "NH₃"].includes(dominant) ||
      (dominant === "N₂" && atmosphere.includes("Dense")));

  if (vegetationCoverage >= 0.05 && hasSurfaceOcean) return "biological";
  if (hasSurfaceOcean) return "oceanic";
  if (hasSurfaceIce || subsurfaceOceanPresent) return "icy";
  if (hasHaze) return "hazy";
  if (volcanicScore >= 0.55) return "volcanic";
  return "rocky";
}

function paletteKeyForVisualState(visualState, compositionKey) {
  if (visualState === "biological") return "Biological moon";
  if (visualState === "oceanic") return "Ocean moon";
  if (visualState === "hazy") return "Hazy moon";
  return compositionKey;
}

function displayClassForVisualState(visualState, compositionKey) {
  if (visualState === "biological") return "Biologically active";
  if (visualState === "oceanic") return "Wet ocean moon";
  if (visualState === "hazy") return "Hazy atmosphere moon";
  if (visualState === "icy") return "Icy moon";
  if (visualState === "volcanic") return "Volcanic moon";
  return compositionKey;
}

function atmosphereColourForSpecies(dominantSpecies) {
  switch (String(dominantSpecies || "")) {
    case "CH₄":
    case "CO":
      return "#d4a36f";
    case "CO₂":
    case "SO₂":
      return "#c98f77";
    case "NH₃":
      return "#c3d59f";
    case "H₂O":
    case "N₂":
    default:
      return "#9dbfe6";
  }
}

function cloudColourForSpecies(dominantSpecies) {
  switch (String(dominantSpecies || "")) {
    case "CH₄":
    case "CO":
      return "#ead8bb";
    case "CO₂":
    case "SO₂":
      return "#edd5c0";
    case "NH₃":
      return "#eef3d8";
    default:
      return "#ffffff";
  }
}

function atmosphereThicknessFromPressure(pressureAtm) {
  const pressure = Math.max(0, Number(pressureAtm) || 0);
  if (pressure < 0.001) return 0;
  if (pressure < 0.01) return 0.014;
  if (pressure < 0.1) return 0.028;
  if (pressure < 0.5) return 0.05;
  if (pressure < 2) return 0.07;
  if (pressure < 10) return 0.085;
  return 0.1;
}

function artProfileIdForState({
  visualState,
  dominantSpecies,
  cryovolcanicScore,
  irregularCapture,
  subsurfaceOceanPresent,
  volcanicScore,
  permanentIceFraction,
}) {
  if (irregularCapture) return "irregular-capture";
  if (visualState === "biological") return "verdant";
  if (visualState === "oceanic") return "oceanic";
  if (visualState === "hazy") {
    return String(dominantSpecies || "") === "CH₄" ? "titan" : "hazy-moon";
  }
  if (volcanicScore >= 0.55) return "io";
  if (cryovolcanicScore >= 0.45) return "enceladus";
  if (subsurfaceOceanPresent || permanentIceFraction >= 0.6) return "europa";
  return null;
}

export function buildMoonDisplayModel(moonCalc) {
  if (!moonCalc || typeof moonCalc !== "object") return null;
  const hydrosphere = moonCalc.habitability?.hydrosphere;
  if (!hydrosphere || typeof hydrosphere !== "object") return null;

  const atmosphere = moonCalc.atmosphere || {};
  const geology = moonCalc.geology || {};
  const biosphere = moonCalc.biosphere || {};
  const climate = moonCalc.climate || {};
  const tides = moonCalc.tides || {};
  const inputs = moonCalc.inputs || {};

  const compositionKey = normalizeCompositionClass(
    tides.compositionOverride || tides.compositionClass,
  );
  const atmosphereClass = atmosphere.atmosphereClass || "Airless";
  const dominantSpecies = atmosphere.dominantSpecies || "";
  const pressureAtm = Math.max(0, Number(atmosphere.surfacePressureAtm) || 0);
  const radiusMoon = Math.max(0, Number(moonCalc?.physical?.radiusMoon) || 0);
  const albedo = Math.max(0, Number(inputs.albedo) || 0);
  const surfaceOceanFraction = clamp(
    Number(hydrosphere.surfaceAccessibleLiquidFraction) ||
      Number(hydrosphere.liquidOceanFraction) ||
      0,
    0,
    1,
  );
  const liquidOceanFraction = clamp(Number(hydrosphere.liquidOceanFraction) || 0, 0, 1);
  const permanentIceFraction = clamp(Number(hydrosphere.permanentIceFraction) || 0, 0, 1);
  const steamFraction = clamp(Number(hydrosphere.steamFraction) || 0, 0, 1);
  const landFraction = clamp(Number(hydrosphere.landFraction) || 0, 0, 1);
  const volcanicScore = clamp(Number(geology.volcanicActivityScore) || 0, 0, 1);
  const cryovolcanicScore = clamp(Number(geology.cryovolcanicActivityScore) || 0, 0, 1);
  const resurfacingScore = clamp(Number(geology.resurfacingScore) || 0, 0, 1);
  const vegetationCoverage = biosphere.vegetationEligible
    ? clamp(
        landFraction *
          Math.max(0.08, Math.min(0.6, 0.15 + (Number(biosphere.plantLifeScore) || 0) * 0.45)),
        0,
        0.4,
      )
    : 0;
  const cloudCoverage =
    pressureAtm < 0.01
      ? 0
      : clamp(
          0.08 +
            (liquidOceanFraction > 0 ? liquidOceanFraction * 0.35 : 0) +
            Math.min(0.24, pressureAtm * 0.08) +
            (steamFraction > 0 ? steamFraction * 0.3 : 0),
          0,
          0.68,
        );
  const irregularCapture =
    radiusMoon > 0 &&
    radiusMoon < 0.08 &&
    albedo < 0.12 &&
    pressureAtm < 0.01 &&
    liquidOceanFraction <= 0.01 &&
    permanentIceFraction <= 0.2;
  const visualState = classifyVisualState({
    surfaceOceanFraction,
    permanentIceFraction,
    subsurfaceOceanPresent: !!hydrosphere.subsurfaceOceanPresent,
    atmosphereClass,
    dominantSpecies,
    vegetationCoverage,
    volcanicScore,
  });
  const terrainType =
    volcanicScore >= 0.55
      ? "volcanic"
      : cryovolcanicScore >= 0.4
        ? "cryovolcanic"
        : permanentIceFraction >= 0.55
          ? "icy-smooth"
          : liquidOceanFraction >= 0.12
            ? "oceanic"
            : atmosphereClass !== "Airless" && atmosphereClass !== "Exosphere"
              ? "weathered"
              : compositionKey === "Dark icy"
                ? "worn"
                : "cratered";
  const craterDensity = clamp(
    0.62 -
      volcanicScore * 0.42 -
      cryovolcanicScore * 0.28 -
      resurfacingScore * 0.18 -
      liquidOceanFraction * 0.14 -
      vegetationCoverage * 0.1 -
      atmosphereThicknessFromPressure(pressureAtm) * 1.1,
    0.04,
    0.72,
  );
  const atmosphereThickness = atmosphereThicknessFromPressure(pressureAtm);
  const artProfileId = artProfileIdForState({
    visualState,
    dominantSpecies,
    cryovolcanicScore,
    irregularCapture,
    subsurfaceOceanPresent: !!hydrosphere.subsurfaceOceanPresent,
    volcanicScore,
    permanentIceFraction,
  });

  return {
    compositionKey,
    paletteKey: paletteKeyForVisualState(visualState, compositionKey),
    displayClass: displayClassForVisualState(visualState, compositionKey),
    terrainType,
    craterDensity,
    iceCoverage: permanentIceFraction,
    iceColour:
      cryovolcanicScore >= 0.35 || hydrosphere.subsurfaceOceanPresent ? "#dff3ff" : "#edf7ff",
    oceanCoverage: liquidOceanFraction,
    oceanColour: biosphere.vegetationEligible ? "#2e77a7" : "#2b628e",
    vegetationCoverage,
    vegetationColour: biosphere.vegetation?.deepHex || null,
    landPalette:
      visualState === "biological"
        ? { c1: "#98a76f", c2: "#6f7f50", c3: "#49563a" }
        : visualState === "oceanic"
          ? { c1: "#b6a282", c2: "#8a7657", c3: "#5b4938" }
          : null,
    atmosphereThickness,
    atmosphereColour: atmosphereColourForSpecies(dominantSpecies),
    cloudCoverage,
    cloudColour: cloudColourForSpecies(dominantSpecies),
    hazeStrength: visualState === "hazy" ? clamp(0.2 + pressureAtm * 0.04, 0.18, 0.5) : 0,
    bodyScale: irregularCapture ? { x: 1.12, y: 0.82, z: 0.72 } : null,
    bodyShape: irregularCapture ? { kind: "lumpy-potato", profile: "irregular-capture" } : null,
    plumeCount: cryovolcanicScore >= 0.35 ? Math.round(4 + cryovolcanicScore * 8) : 0,
    plumeColour: cryovolcanicScore >= 0.35 ? "#c8f2ff" : null,
    fractureCount:
      hydrosphere.subsurfaceOceanPresent || cryovolcanicScore >= 0.3
        ? Math.round(6 + Math.max(cryovolcanicScore, 0.2) * 10)
        : 0,
    fractureColour: cryovolcanicScore >= 0.35 ? "#8fdcff" : "#9ccdf3",
    fractureAlpha:
      hydrosphere.subsurfaceOceanPresent || cryovolcanicScore >= 0.3
        ? clamp(0.16 + cryovolcanicScore * 0.3, 0.16, 0.42)
        : 0,
    tidalIntensity: clamp(Number(tides.tidalHeatingEarth) / 40 || 0, 0, 1),
    tidallyLocked: tides.moonLockedToPlanet === "Yes",
    special:
      visualState === "biological"
        ? "biosphere"
        : visualState === "oceanic"
          ? "ocean"
          : volcanicScore >= 0.55
            ? "volcanic"
            : cryovolcanicScore >= 0.35
              ? "cryovolcanic"
              : hydrosphere.subsurfaceOceanPresent
                ? "subsurface-ocean"
                : compositionKey === "Partially molten"
                  ? "molten"
                  : null,
    artProfileId,
    seed: String(inputs.name || moonCalc.id || "moon"),
    climateState: climate.climateState || "Stable",
  };
}
