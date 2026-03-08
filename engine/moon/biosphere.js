// SPDX-License-Identifier: MPL-2.0
import { vegetationColours } from "../planet/appearance.js";
import { clamp, toFinite } from "../utils.js";

function pressureAdequacyScore(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0.01) return 0;
  if (pressure < 0.05) return 0.2 + ((pressure - 0.01) / 0.04) * 0.25;
  if (pressure < 0.2) return 0.45 + ((pressure - 0.05) / 0.15) * 0.35;
  if (pressure <= 2) return 0.8 + ((pressure - 0.2) / 1.8) * 0.2;
  if (pressure <= 5) return 1 - ((pressure - 2) / 3) * 0.15;
  if (pressure <= 20) return 0.85 - ((pressure - 5) / 15) * 0.45;
  return 0.4;
}

function atmosphereToxicityPenalty(composition = {}) {
  const co2 = Math.max(toFinite(composition.co2, 0), 0);
  const ch4 = Math.max(toFinite(composition.ch4, 0), 0);
  const nh3 = Math.max(toFinite(composition.nh3, 0), 0);
  const so2 = Math.max(toFinite(composition.so2, 0), 0);
  let penalty = 1;

  if (co2 > 0.2) penalty *= clamp(1 - (co2 - 0.2) / 0.9, 0.45, 1);
  if (ch4 > 0.1) penalty *= clamp(1 - (ch4 - 0.1) / 0.6, 0.55, 1);
  if (nh3 > 0.005) penalty *= clamp(1 - (nh3 - 0.005) / 0.05, 0.15, 1);
  if (so2 > 0.001) penalty *= clamp(1 - (so2 - 0.001) / 0.02, 0.05, 1);

  return clamp(penalty, 0, 1);
}

function oxygenBonus(composition = {}) {
  const o2 = Math.max(toFinite(composition.o2, 0), 0);
  if (o2 <= 0.01) return 0.9;
  if (o2 <= 0.35) return 1;
  if (o2 <= 0.6) return 0.85;
  return 0.6;
}

function spectralPhotosynthesisScore(starTempK) {
  const tempK = Math.max(toFinite(starTempK, 0), 0);
  if (tempK >= 2600 && tempK <= 8000) return 1;
  if ((tempK >= 2200 && tempK < 2600) || (tempK > 8000 && tempK <= 10000)) return 0.65;
  if ((tempK >= 1800 && tempK < 2200) || (tempK > 10000 && tempK <= 14000)) return 0.35;
  return 0.15;
}

function illuminationRegimeScore({ synodicDays, synchronousContrastK, seasonalitySummary }) {
  const cycleDays = Math.max(toFinite(synodicDays, 0), 0);
  let score = 0.8;

  if (cycleDays <= 0) score = 0.8;
  else if (cycleDays < 0.25) score = 0.75;
  else if (cycleDays <= 100) score = 1;
  else if (cycleDays <= 300) score = 0.8;
  else if (cycleDays <= 1000) score = 0.55;
  else score = 0.35;

  if (toFinite(synchronousContrastK, 0) >= 12) score -= 0.15;
  else if (toFinite(synchronousContrastK, 0) >= 6) score -= 0.08;

  const summary = String(seasonalitySummary || "");
  if (summary.startsWith("Extreme")) score -= 0.2;
  else if (summary.startsWith("Strong")) score -= 0.1;

  return clamp(score, 0, 1);
}

function surfaceBiosphereClass(score) {
  const value = clamp(toFinite(score, 0), 0, 1);
  if (value < 0.05) return "Surface sterile";
  if (value < 0.3) return "Marginal surface microbial niches";
  if (value < 0.6) return "Microbial surface biosphere possible";
  if (value < 0.8) return "Simple surface biosphere plausible";
  return "Complex surface biosphere plausible";
}

function plantLifePlausibility(score) {
  const value = clamp(toFinite(score, 0), 0, 1);
  if (value < 0.25) return "No";
  if (value < 0.5) return "Marginal";
  if (value < 0.75) return "Possible";
  return "Likely";
}

function limitingFactors({
  surfaceAccessibleLiquidFraction,
  pressureAtm,
  atmosphereAdequacy,
  climateScore,
  climateState,
  radiationScore,
  spectralScore,
  illuminationScore,
}) {
  const factors = [];
  if (toFinite(surfaceAccessibleLiquidFraction, 0) <= 0.05) {
    factors.push("No accessible surface liquid water");
  }
  if (pressureAtm <= 0.05) {
    factors.push("Atmosphere too thin for exposed surface biology");
  } else if (atmosphereAdequacy < 0.45) {
    factors.push("Atmosphere composition is harsh for surface ecosystems");
  }
  if (String(climateState || "") !== "Stable") {
    factors.push(`Climate state is ${String(climateState || "unstable").toLowerCase()}`);
  } else if (climateScore < 0.35) {
    factors.push("Habitable climate coverage is too limited");
  }
  if (radiationScore < 0.5) {
    factors.push("Radiation environment is severe");
  }
  if (spectralScore < 0.5) {
    factors.push("Star spectrum is poor for surface photosynthesis");
  }
  if (illuminationScore < 0.5) {
    factors.push("Illumination cycle is unfavorable for vegetation");
  }
  return factors;
}

export function computeMoonBiosphere({
  starTempK = 0,
  insolationEarth = 0,
  surfacePressurePa = 0,
  atmosphereComposition = {},
  hydrosphere = null,
  climate = null,
  radiation = null,
  orbitalPeriodSynodicDays = 0,
  moonLockedToPlanet = false,
} = {}) {
  const hydrology = hydrosphere && typeof hydrosphere === "object" ? hydrosphere : {};
  const climateState = climate && typeof climate === "object" ? climate : {};
  const radiationState = radiation && typeof radiation === "object" ? radiation : {};
  const pressureAtm = Math.max(toFinite(surfacePressurePa, 0), 0) / 101325;
  const atmosphereAdequacy =
    pressureAdequacyScore(pressureAtm) *
    atmosphereToxicityPenalty(atmosphereComposition) *
    oxygenBonus(atmosphereComposition);
  const surfaceWaterScore = clamp(
    Math.max(toFinite(hydrology.surfaceAccessibleLiquidFraction, 0), 0) / 0.75,
    0,
    1,
  );
  const climateScore = clamp(
    0.65 * toFinite(climateState.climateLivabilityScore, 0) +
      0.35 * toFinite(climateState.stabilityMultiplier, 0),
    0,
    1,
  );
  const radiationScore = clamp(toFinite(radiationState.radiationPenalty, 1), 0, 1);
  const spectralScore = spectralPhotosynthesisScore(starTempK);
  const illuminationScore = illuminationRegimeScore({
    synodicDays: orbitalPeriodSynodicDays,
    synchronousContrastK: climateState.synchronousContrastK,
    seasonalitySummary: climateState.seasonalitySummary,
  });

  const supportsSurfaceEnvironment =
    pressureAtm > 0.01 && toFinite(hydrology.surfaceAccessibleLiquidFraction, 0) > 0.05;
  const surfaceBiologyScore = supportsSurfaceEnvironment
    ? clamp(
        0.28 * atmosphereAdequacy +
          0.32 * surfaceWaterScore +
          0.25 * climateScore +
          0.15 * radiationScore,
        0,
        1,
      )
    : 0;
  const plantLifeScore =
    surfaceBiologyScore <= 0
      ? 0
      : clamp(surfaceBiologyScore * (0.45 + 0.35 * spectralScore + 0.2 * illuminationScore), 0, 1);
  const vegetationEligible =
    plantLifeScore >= 0.5 &&
    atmosphereAdequacy >= 0.45 &&
    climateScore >= 0.35 &&
    radiationScore >= 0.5 &&
    surfaceWaterScore >= 0.2;
  const factors = limitingFactors({
    surfaceAccessibleLiquidFraction: hydrology.surfaceAccessibleLiquidFraction,
    pressureAtm,
    atmosphereAdequacy,
    climateScore,
    climateState: climateState.climateState,
    radiationScore,
    spectralScore,
    illuminationScore,
  });
  const vegetation = vegetationEligible
    ? vegetationColours({
        starTempK,
        pressureAtm,
        insolationEarth,
        tidallyLocked: false,
      })
    : null;

  if (moonLockedToPlanet && vegetation && toFinite(climateState.synchronousContrastK, 0) >= 6) {
    vegetation.note += " - moon biosphere gate kept a parent-facing light-regime penalty";
  }

  return {
    modelVersion: "moon-biosphere-v1",
    surfaceBiologyScore,
    surfaceBiosphereClass: surfaceBiosphereClass(surfaceBiologyScore),
    plantLifeScore,
    plantLifePlausibility: plantLifePlausibility(plantLifeScore),
    vegetationEligible,
    vegetation,
    atmosphereAdequacyScore: atmosphereAdequacy,
    surfaceWaterScore,
    climateScore,
    radiationScore,
    spectralScore,
    illuminationScore,
    limitingFactors: factors,
    limitingFactorsDisplay: factors.length ? factors.join(" | ") : "No major blockers",
  };
}
