import { clamp, toFinite } from "../utils.js";

const EARTH_OZONE_DU = 300;
export const PREBIOTIC_UV_MIN_ERG_CM2_S = 45;
export const PREBIOTIC_UV_MAX_ERG_CM2_S = 10400;

const PREBIOTIC_UV_LABELS = Object.freeze({
  no_surface_solvent: "No surface solvent window",
  uv_starved: "UV-starved",
  starter_window: "Starter window",
  uv_overexposed: "UV-overexposed",
});
const HAZE_COOLING_NOTE =
  "Cooling potential is not fed back into the main climate solve in this release.";

function pressureWindowScore(pressureAtm) {
  return clamp(1 - Math.abs(Math.log10(Math.max(toFinite(pressureAtm, 0), 0.01))) / 2.2, 0, 1);
}

function xuvProtectionScore(xuvFluxRatio) {
  const xuvRatio = toFinite(xuvFluxRatio, 0);
  return xuvRatio <= 1 ? 1 : clamp(1 - Math.log10(Math.max(xuvRatio, 1)) / 2.5, 0, 1);
}

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((toFinite(x, 0) - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hazeClassFromScore(score) {
  if (score < 0.15) return "None";
  if (score < 0.4) return "Light organic haze";
  if (score < 0.7) return "Organic haze";
  return "Thick organic haze";
}

function skyTintFromHazeClass(hazeClass) {
  if (hazeClass === "Thick organic haze") return "Deep orange-brown";
  if (hazeClass === "Organic haze") return "Orange-brown";
  if (hazeClass === "Light organic haze") return "Pale amber";
  return "None";
}

function tintHexFromSkyTint(skyTintClass) {
  if (skyTintClass === "Deep orange-brown") return "#b7652f";
  if (skyTintClass === "Orange-brown") return "#c9853d";
  if (skyTintClass === "Pale amber") return "#e1b86f";
  return null;
}

export function computePhotochemicalHaze({
  pressureAtm,
  ppO2Atm,
  ppCH4Atm,
  ppCO2Atm,
  ppN2Atm,
  prebioticUvTopOfAtmosphereErgCm2S,
} = {}) {
  const resolvedPressureAtm = finiteNonNegative(pressureAtm, 0);
  const resolvedPpO2Atm = finiteNonNegative(ppO2Atm, 0);
  const resolvedPpCH4Atm = finiteNonNegative(ppCH4Atm, 0);
  const resolvedPpCO2Atm = finiteNonNegative(ppCO2Atm, 0);
  const resolvedPpN2Atm = finiteNonNegative(ppN2Atm, 0);
  const prebioticUvTopOfAtmosphereFlux = finiteNonNegative(prebioticUvTopOfAtmosphereErgCm2S, 0);
  const methaneToCo2Ratio = resolvedPpCH4Atm / Math.max(resolvedPpCO2Atm, 1e-6);
  const ratioScore = smoothstep(0.03, 0.1, methaneToCo2Ratio);
  const thickRatioScore = smoothstep(0.1, 0.2, methaneToCo2Ratio);
  const anoxicScore = 1 - smoothstep(1e-5, 0.01, resolvedPpO2Atm);
  const pressureScore = smoothstep(0.03, 0.3, resolvedPressureAtm);
  const uvSupplyScore = smoothstep(5, 45, prebioticUvTopOfAtmosphereFlux);
  const uvOverdrivePenalty = 1 - 0.55 * smoothstep(10000, 30000, prebioticUvTopOfAtmosphereFlux);
  const likelihoodScore = clamp(
    ratioScore * anoxicScore * pressureScore * uvSupplyScore * uvOverdrivePenalty,
    0,
    1,
  );
  const hazeClass = hazeClassFromScore(likelihoodScore);
  const skyTintClass = skyTintFromHazeClass(hazeClass);
  const uvOpticalDepthProxy = clamp(4.0 * likelihoodScore, 0, 4);
  const visibleOpticalDepthProxy = clamp(1.6 * likelihoodScore, 0, 1.6);
  const antiGreenhouseCoolingK = clamp(
    18 * likelihoodScore + 12 * thickRatioScore * likelihoodScore,
    0,
    30,
  );
  const surfaceLightReductionFraction = clamp(1 - Math.exp(-visibleOpticalDepthProxy), 0, 0.8);
  const notes = [HAZE_COOLING_NOTE];

  if (hazeClass !== "None") {
    notes.unshift(
      "Organic haze is favoured by methane-rich, CO2-bearing, anoxic air with UV supply.",
    );
  } else if (resolvedPpO2Atm >= 0.01) {
    notes.unshift("Oxygen suppresses long-lived organic haze formation in this lightweight model.");
  } else if (prebioticUvTopOfAtmosphereFlux < 5) {
    notes.unshift("UV supply is too low for efficient organic haze production in this model.");
  } else if (resolvedPressureAtm < 0.03) {
    notes.unshift("Atmospheric pressure is too low for a substantial organic haze column.");
  } else {
    notes.unshift("Methane-to-CO2 ratio is below the organic haze threshold.");
  }

  return {
    modelVersion: "photochemical-haze-v1",
    methaneToCo2Ratio,
    likelihoodScore,
    ratioScore,
    thickRatioScore,
    anoxicScore,
    pressureScore,
    uvSupplyScore,
    uvOverdrivePenalty,
    hazeClass,
    uvOpticalDepthProxy,
    visibleOpticalDepthProxy,
    antiGreenhouseCoolingK,
    surfaceLightReductionFraction,
    skyTintClass,
    tintHex: tintHexFromSkyTint(skyTintClass),
    confidence:
      resolvedPressureAtm >= 0.03 && prebioticUvTopOfAtmosphereFlux >= 5 ? "medium" : "low",
    notes,
    inputs: {
      pressureAtm: resolvedPressureAtm,
      ppO2Atm: resolvedPpO2Atm,
      ppCH4Atm: resolvedPpCH4Atm,
      ppCO2Atm: resolvedPpCO2Atm,
      ppN2Atm: resolvedPpN2Atm,
      prebioticUvTopOfAtmosphereErgCm2S: prebioticUvTopOfAtmosphereFlux,
    },
  };
}

export function computePrebioticUvWindow({
  topOfAtmosphereFluxErgCm2S,
  uvShieldingScore,
  ozoneEarthRatio,
  hazeUvOpticalDepthProxy = 0,
  surfaceAccessibleLiquidFraction,
  surfaceTempK,
  pressureAtm,
  xuvFluxRatio,
} = {}) {
  const topOfAtmosphereFlux = finiteNonNegative(topOfAtmosphereFluxErgCm2S, 0);
  const shielding = clamp(toFinite(uvShieldingScore, 0), 0, 1);
  const hazeOpticalDepth = finiteNonNegative(hazeUvOpticalDepthProxy, 0);
  const shieldAttenuation = clamp(1 - 0.88 * shielding, 0.02, 1);
  const hazeAttenuation = Math.exp(-hazeOpticalDepth);
  const attenuationFactor = clamp(shieldAttenuation * hazeAttenuation, 0, 1);
  const surfaceFlux = topOfAtmosphereFlux * attenuationFactor;
  const liquidFraction = clamp(toFinite(surfaceAccessibleLiquidFraction, 0), 0, 1);
  const temperatureK = toFinite(surfaceTempK, NaN);
  const resolvedPressureAtm = finiteNonNegative(pressureAtm, 0);
  const resolvedXuvFluxRatio = finiteNonNegative(xuvFluxRatio, 0);
  const blockers = [];
  const notes = [];

  let classification;
  if (
    liquidFraction <= 0.001 ||
    !Number.isFinite(temperatureK) ||
    temperatureK < 250 ||
    temperatureK > 373
  ) {
    classification = "no_surface_solvent";
    blockers.push("no_surface_solvent");
    notes.push("The surface lacks a modelled temperate accessible-liquid setting.");
  } else if (surfaceFlux < PREBIOTIC_UV_MIN_ERG_CM2_S) {
    classification = "uv_starved";
    blockers.push("low_prebiotic_uv");
    notes.push("Surface 200-280 nm flux is below the lightweight starter-chemistry threshold.");
  } else if (surfaceFlux <= PREBIOTIC_UV_MAX_ERG_CM2_S) {
    classification = "starter_window";
    notes.push("Surface 200-280 nm flux falls inside the modelled prebiotic starter window.");
  } else {
    classification = "uv_overexposed";
    blockers.push("high_prebiotic_uv");
    notes.push("Surface 200-280 nm flux exceeds the modelled overexposure threshold.");
  }

  if (resolvedXuvFluxRatio > 100 && shielding < 0.25) {
    blockers.push("high_xuv_surface_hazard");
    notes.push("High XUV with weak shielding indicates a severe surface-radiation hazard.");
  }

  if (resolvedPressureAtm < 0.006 && classification !== "no_surface_solvent") {
    notes.push(
      "Surface pressure is below the water triple-point guardrail; solvent persistence is uncertain.",
    );
  }

  return {
    modelVersion: "prebiotic-uv-window-v1",
    topOfAtmosphereFluxErgCm2S: topOfAtmosphereFlux,
    surfaceFluxErgCm2S: surfaceFlux,
    attenuationFactor,
    shieldAttenuation,
    hazeAttenuation,
    uvShieldingScore: shielding,
    ozoneEarthRatio: finiteNonNegative(ozoneEarthRatio, 0),
    hazeUvOpticalDepthProxy: hazeOpticalDepth,
    surfaceAccessibleLiquidFraction: liquidFraction,
    surfaceTempK: Number.isFinite(temperatureK) ? temperatureK : null,
    pressureAtm: resolvedPressureAtm,
    xuvFluxRatio: resolvedXuvFluxRatio,
    class: classification,
    label: PREBIOTIC_UV_LABELS[classification],
    confidence: topOfAtmosphereFlux > 0 ? "medium" : "low",
    blockers,
    notes,
    thresholds: {
      minErgCm2S: PREBIOTIC_UV_MIN_ERG_CM2_S,
      maxErgCm2S: PREBIOTIC_UV_MAX_ERG_CM2_S,
    },
  };
}

export function computePlanetPhotochemistry({
  pressureAtm,
  xuvFluxRatio,
  ppO2Atm,
  ppCH4Atm,
  ppCO2Atm,
  ppN2Atm,
  ppH2Atm,
  ppNH3Atm,
  prebioticUvTopOfAtmosphereErgCm2S,
  surfaceAccessibleLiquidFraction,
  surfaceTempK,
  hazeUvOpticalDepthProxy = 0,
}) {
  const resolvedPressureAtm = Math.max(toFinite(pressureAtm, 0), 0);
  const resolvedXuvFluxRatio = Math.max(toFinite(xuvFluxRatio, 0), 0);
  const resolvedPpO2Atm = Math.max(toFinite(ppO2Atm, 0), 0);
  const resolvedPpCH4Atm = Math.max(toFinite(ppCH4Atm, 0), 0);
  const resolvedPpCO2Atm = Math.max(toFinite(ppCO2Atm, 0), 0);
  const resolvedPpN2Atm = Math.max(toFinite(ppN2Atm, 0), 0);
  const resolvedPpH2Atm = Math.max(toFinite(ppH2Atm, 0), 0);
  const resolvedPpNH3Atm = Math.max(toFinite(ppNH3Atm, 0), 0);

  const o2Relative = clamp(resolvedPpO2Atm / 0.21, 0, 25);
  const xuvRelative = clamp(resolvedXuvFluxRatio, 0.01, 100);
  const pressureModifier = clamp(Math.max(resolvedPressureAtm, 0.01) ** 0.15, 0.5, 1.5);

  const ozoneEarthRatio = clamp(o2Relative ** 0.5 * xuvRelative ** 0.15 * pressureModifier, 0, 5);
  const ozoneColumnDobsonUnits = EARTH_OZONE_DU * ozoneEarthRatio;

  const warningCodes = [];
  const warningMessages = [];

  if (resolvedPpO2Atm >= 0.05 && resolvedPpCH4Atm >= 1e-4) {
    warningCodes.push("o2_ch4_disequilibrium");
    warningMessages.push(
      "O2 and CH4 coexist at chemically unstable levels without continuous replenishment.",
    );
  }
  if (resolvedPpO2Atm >= 0.05 && resolvedPpH2Atm >= 1e-3) {
    warningCodes.push("o2_h2_disequilibrium");
    warningMessages.push(
      "O2 and H2 coexist at chemically unstable levels without continuous replenishment.",
    );
  }
  if (resolvedPpO2Atm >= 0.05 && resolvedPpNH3Atm >= 1e-5) {
    warningCodes.push("o2_nh3_disequilibrium");
    warningMessages.push(
      "O2 and NH3 coexist at chemically unstable levels without continuous replenishment.",
    );
  }

  const ozoneScore = clamp(ozoneEarthRatio / 1.5, 0, 1);
  const uvShieldingScore = clamp(
    0.55 * ozoneScore +
      0.25 * pressureWindowScore(resolvedPressureAtm) +
      0.2 * xuvProtectionScore(resolvedXuvFluxRatio),
    0,
    1,
  );

  const uvShieldingClass =
    uvShieldingScore >= 0.67 ? "Shielded" : uvShieldingScore >= 0.34 ? "Partial" : "Unshielded";
  const warningCount = warningCodes.length;
  const stabilityClass =
    warningCount === 0 ? "Stable" : warningCount === 1 ? "1 warning" : `${warningCount} warnings`;
  const haze = computePhotochemicalHaze({
    pressureAtm: resolvedPressureAtm,
    ppO2Atm: resolvedPpO2Atm,
    ppCH4Atm: resolvedPpCH4Atm,
    ppCO2Atm: resolvedPpCO2Atm,
    ppN2Atm: resolvedPpN2Atm,
    prebioticUvTopOfAtmosphereErgCm2S,
  });
  const effectiveHazeUvOpticalDepthProxy = Math.max(
    finiteNonNegative(hazeUvOpticalDepthProxy, 0),
    haze.uvOpticalDepthProxy,
  );
  const prebioticUv = computePrebioticUvWindow({
    topOfAtmosphereFluxErgCm2S: prebioticUvTopOfAtmosphereErgCm2S,
    uvShieldingScore,
    ozoneEarthRatio,
    hazeUvOpticalDepthProxy: effectiveHazeUvOpticalDepthProxy,
    surfaceAccessibleLiquidFraction,
    surfaceTempK,
    pressureAtm: resolvedPressureAtm,
    xuvFluxRatio: resolvedXuvFluxRatio,
  });

  return {
    modelVersion: "planet-photochemistry-v3",
    ozoneColumnDobsonUnits,
    ozoneEarthRatio,
    uvShieldingScore,
    uvShieldingClass,
    warningCodes,
    warningMessages,
    warningCount,
    stabilityClass,
    prebioticUv,
    haze,
  };
}
