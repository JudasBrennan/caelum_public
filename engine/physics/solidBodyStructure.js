import { clamp, round, toFinite } from "../utils.js";

const KG_PER_MEARTH = 5.972e24;
const KG_PER_MMOON = 7.342e22;
const MOON_MASS_EARTH = KG_PER_MMOON / KG_PER_MEARTH;
const KM_PER_REARTH = 6371;
const KM_PER_RMOON = 1737.4;
const EARTH_GRAVITY_MS2 = 9.80665;
const EARTH_ESCAPE_KMS = 11.186;
const MOON_DENSITY_GCM3 = 3.34;

const COMPONENT_DENSITY_GCM3 = Object.freeze({
  metal: 7.8,
  silicate: 3.3,
  waterIce: 0.93,
  volatileIce: 0.8,
  carbonaceous: 1.8,
  sulfur: 2.0,
  salts: 2.2,
});

const COMPONENT_KEYS = Object.freeze([
  "metal",
  "silicate",
  "waterIce",
  "volatileIce",
  "carbonaceous",
  "sulfur",
  "salts",
]);

function normalizeComponentFractions(componentMassFractions = {}) {
  const values = {};
  let total = 0;
  for (const key of COMPONENT_KEYS) {
    const value = Math.max(toFinite(componentMassFractions?.[key], 0), 0);
    values[key] = value;
    total += value;
  }
  if (total <= 0) return values;
  return Object.fromEntries(COMPONENT_KEYS.map((key) => [key, values[key] / total]));
}

function mixtureDensityGcm3(componentMassFractions = {}) {
  let inverseDensity = 0;
  let total = 0;
  for (const key of COMPONENT_KEYS) {
    const fraction = Math.max(toFinite(componentMassFractions?.[key], 0), 0);
    const density = COMPONENT_DENSITY_GCM3[key];
    if (fraction <= 0 || !density) continue;
    inverseDensity += fraction / density;
    total += fraction;
  }
  if (inverseDensity <= 0 || total <= 0) return null;
  return total / inverseDensity;
}

function resolveMassEarth({ massEarth = null, massMoon = null }) {
  const earth = toFinite(massEarth, NaN);
  if (Number.isFinite(earth) && earth > 0) return earth;
  return Math.max(toFinite(massMoon, 0), 0) * MOON_MASS_EARTH;
}

function resolveRadiusEarth({ radiusEarth = null, radiusMoon = null, radiusKm = null }) {
  const km = toFinite(radiusKm, NaN);
  if (Number.isFinite(km) && km > 0) return km / KM_PER_REARTH;
  const earth = toFinite(radiusEarth, NaN);
  if (Number.isFinite(earth) && earth > 0) return earth;
  const moon = toFinite(radiusMoon, NaN);
  if (Number.isFinite(moon) && moon > 0) return (moon * KM_PER_RMOON) / KM_PER_REARTH;
  return null;
}

function densityFromMassRadius(massEarth, radiusEarth) {
  if (!(massEarth > 0) || !(radiusEarth > 0)) return null;
  return 5.51 * (massEarth / radiusEarth ** 3);
}

function radiusEarthFromMassDensity(massEarth, densityGcm3) {
  if (!(massEarth > 0) || !(densityGcm3 > 0)) return null;
  return ((massEarth * 5.51) / densityGcm3) ** (1 / 3);
}

function moonRadiusFromMassDensity(massMoon, densityGcm3) {
  if (!(massMoon > 0) || !(densityGcm3 > 0)) return null;
  return (massMoon / (densityGcm3 / MOON_DENSITY_GCM3)) ** (1 / 3);
}

function classifyCompactness({ bodyType, massMoon, radiusKm, gravityG, densityGcm3, porosity }) {
  if (bodyType === "planet") return "planetary";
  if (radiusKm < 120 || massMoon < 1e-5 || gravityG < 0.005) return "rubble-pile";
  if (radiusKm < 350 || massMoon < 0.03 || gravityG < 0.035 || porosity >= 0.18) {
    return "small-porous";
  }
  if (densityGcm3 < 1.25) return "low-density-icy";
  return "compact";
}

function classifyStructure({
  bodyType,
  componentMassFractions,
  compositionClass,
  differentiatedInterior,
  densityGcm3,
  compactnessClass,
  porosityFraction,
}) {
  if (bodyType === "planet") return "planetary-rocky-body";
  if (compactnessClass === "rubble-pile" || compactnessClass === "small-porous") {
    return "small-porous-body";
  }

  const metal = componentMassFractions.metal || 0;
  const silicate = componentMassFractions.silicate || 0;
  const ice = (componentMassFractions.waterIce || 0) + (componentMassFractions.volatileIce || 0);
  const volatileRich =
    (componentMassFractions.volatileIce || 0) + (componentMassFractions.carbonaceous || 0) >= 0.14;
  const classText = String(compositionClass || "").toLowerCase();

  if (metal >= 0.45 || densityGcm3 >= 5.1) return "iron-rich-body";
  if (volatileRich && densityGcm3 < 2.2) return "volatile-rich-icy-body";
  if (ice >= 0.2 || classText.includes("icy") || classText.includes("ocean")) {
    return "ice-rock-ocean-world";
  }
  if (differentiatedInterior === true || (metal >= 0.08 && silicate >= 0.45 && densityGcm3 > 2.8)) {
    return "differentiated-rocky-moon";
  }
  if (porosityFraction >= 0.12) return "small-porous-body";
  return "compact-rocky-moon";
}

function confidenceClass({
  hasExplicitDensity,
  hasExplicitRadius,
  hasComponents,
  compactnessClass,
}) {
  if (hasExplicitDensity && hasExplicitRadius && hasComponents) return "high";
  if (hasExplicitDensity && hasComponents && compactnessClass !== "rubble-pile") return "medium";
  if (hasExplicitDensity || hasExplicitRadius) return "medium";
  return "low";
}

function roundFractions(fractions = {}) {
  return Object.fromEntries(
    Object.entries(fractions).map(([key, value]) => [key, round(value, 5)]),
  );
}

export function solveSolidBodyStructure({
  bodyType = "moon",
  massEarth = null,
  massMoon = null,
  radiusEarth = null,
  radiusMoon = null,
  radiusKm = null,
  densityGcm3 = null,
  componentMassFractions = {},
  elementMassFractions = {},
  differentiatedInterior = null,
  compositionClass = "",
  compositionOverride = "",
  coreMassFraction = null,
  porosityHint = null,
} = {}) {
  const resolvedBodyType = String(bodyType || "").toLowerCase() === "planet" ? "planet" : "moon";
  const normalizedComponents = normalizeComponentFractions(componentMassFractions);
  const hasComponents = Object.values(normalizedComponents).some((value) => value > 0);
  const inputMassEarth = resolveMassEarth({ massEarth, massMoon });
  const inputMassMoon = inputMassEarth / MOON_MASS_EARTH;
  const explicitDensity = toFinite(densityGcm3, NaN);
  const hasExplicitDensity = Number.isFinite(explicitDensity) && explicitDensity > 0;
  const explicitRadiusEarth = resolveRadiusEarth({ radiusEarth, radiusMoon, radiusKm });
  const hasExplicitRadius = explicitRadiusEarth != null && explicitRadiusEarth > 0;

  let resolvedRadiusEarth = explicitRadiusEarth;
  if (!(resolvedRadiusEarth > 0) && hasExplicitDensity) {
    resolvedRadiusEarth =
      resolvedBodyType === "moon"
        ? (moonRadiusFromMassDensity(inputMassMoon, explicitDensity) * KM_PER_RMOON) / KM_PER_REARTH
        : radiusEarthFromMassDensity(inputMassEarth, explicitDensity);
  }
  if (!(resolvedRadiusEarth > 0)) {
    const mixtureDensity = mixtureDensityGcm3(normalizedComponents) || explicitDensity || 3.34;
    resolvedRadiusEarth =
      resolvedBodyType === "moon"
        ? (moonRadiusFromMassDensity(inputMassMoon, mixtureDensity) * KM_PER_RMOON) / KM_PER_REARTH
        : radiusEarthFromMassDensity(inputMassEarth, mixtureDensity);
  }

  const resolvedDensityGcm3 =
    hasExplicitDensity || !(resolvedRadiusEarth > 0)
      ? Math.max(explicitDensity || 0, 0)
      : densityFromMassRadius(inputMassEarth, resolvedRadiusEarth);
  const radiusKmResolved = Math.max(resolvedRadiusEarth || 0, 0) * KM_PER_REARTH;
  const radiusMoonResolved = radiusKmResolved / KM_PER_RMOON;
  const gravityG =
    inputMassEarth > 0 && resolvedRadiusEarth > 0 ? inputMassEarth / resolvedRadiusEarth ** 2 : 0;
  const escapeVelocityKms =
    inputMassEarth > 0 && resolvedRadiusEarth > 0
      ? EARTH_ESCAPE_KMS * Math.sqrt(inputMassEarth / resolvedRadiusEarth)
      : 0;
  const surfaceAreaM2 = radiusKmResolved > 0 ? 4 * Math.PI * (radiusKmResolved * 1000) ** 2 : 0;
  const mixtureDensity = mixtureDensityGcm3(normalizedComponents);
  const densityPorosity =
    mixtureDensity && resolvedDensityGcm3 > 0
      ? clamp(1 - resolvedDensityGcm3 / mixtureDensity, 0, 0.7)
      : 0;
  const hintedPorosity = toFinite(porosityHint, NaN);
  const porosityFraction = Number.isFinite(hintedPorosity)
    ? clamp(hintedPorosity, 0, 0.8)
    : densityPorosity;
  const compactnessClass = classifyCompactness({
    bodyType: resolvedBodyType,
    massMoon: inputMassMoon,
    radiusKm: radiusKmResolved,
    gravityG,
    densityGcm3: resolvedDensityGcm3,
    porosity: porosityFraction,
  });

  const metal = normalizedComponents.metal || 0;
  const silicate = normalizedComponents.silicate || 0;
  const waterIce = normalizedComponents.waterIce || 0;
  const volatileIce = normalizedComponents.volatileIce || 0;
  const salts = normalizedComponents.salts || 0;
  const classText = String(compositionOverride || compositionClass || "").toLowerCase();
  const oceanMassFraction =
    classText.includes("ocean") || classText.includes("subsurface")
      ? clamp(waterIce * 0.18 + salts * 0.12, 0, waterIce)
      : 0;
  const resolvedCoreMassFraction = clamp(toFinite(coreMassFraction, metal), 0, 1);
  const layerMassFractions = {
    core: resolvedCoreMassFraction,
    silicateMantle: clamp(silicate + Math.max(0, metal - resolvedCoreMassFraction) * 0.25, 0, 1),
    iceShell: clamp(waterIce - oceanMassFraction, 0, 1),
    liquidOcean: oceanMassFraction,
    volatileIce,
    porousVoid:
      compactnessClass === "small-porous" || compactnessClass === "rubble-pile"
        ? porosityFraction
        : 0,
  };
  const structureClass = classifyStructure({
    bodyType: resolvedBodyType,
    componentMassFractions: normalizedComponents,
    compositionClass: compositionOverride || compositionClass,
    differentiatedInterior,
    densityGcm3: resolvedDensityGcm3,
    compactnessClass,
    porosityFraction,
  });
  const assumptions = [
    "Layer fractions are mass-fraction proxies derived from bulk reservoirs, not a 1-D interior solve.",
  ];
  const limitingFactors = [];
  if (!hasExplicitDensity) limitingFactors.push("Density was inferred rather than supplied.");
  if (!hasComponents) limitingFactors.push("Component inventory is inferred from class/density.");
  if (structureClass === "small-porous-body") {
    limitingFactors.push("Small/porous body is outside differentiated-planet assumptions.");
  }

  return {
    bodyType: resolvedBodyType,
    structureModelVersion: "solid-body-structure-v1",
    massEarth: round(inputMassEarth, 8),
    massMoon: round(inputMassMoon, 8),
    radiusEarth: round(resolvedRadiusEarth || 0, 8),
    radiusMoon: round(radiusMoonResolved, 8),
    radiusKm: round(radiusKmResolved, 4),
    densityGcm3: round(resolvedDensityGcm3, 5),
    gravityG: round(gravityG, 6),
    gravityMs2: round(gravityG * EARTH_GRAVITY_MS2, 6),
    escapeVelocityKms: round(escapeVelocityKms, 5),
    surfaceAreaM2: round(surfaceAreaM2, 3),
    componentMassFractions: roundFractions(normalizedComponents),
    elementMassFractions: { ...(elementMassFractions || {}) },
    layerMassFractions: roundFractions(layerMassFractions),
    porosityFraction: round(porosityFraction, 5),
    compactnessClass,
    structureClass,
    differentiatedInterior:
      differentiatedInterior == null
        ? structureClass.includes("differentiated") || structureClass === "iron-rich-body"
        : differentiatedInterior === true,
    coreMassFraction: round(resolvedCoreMassFraction, 5),
    silicateMassFraction: round(layerMassFractions.silicateMantle, 5),
    iceMassFraction: round(layerMassFractions.iceShell + layerMassFractions.volatileIce, 5),
    oceanMassFraction: round(layerMassFractions.liquidOcean, 5),
    mixtureDensityGcm3: mixtureDensity == null ? null : round(mixtureDensity, 5),
    confidence: confidenceClass({
      hasExplicitDensity,
      hasExplicitRadius,
      hasComponents,
      compactnessClass,
    }),
    assumptions,
    limitingFactors,
  };
}
