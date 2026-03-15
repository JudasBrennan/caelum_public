import { calcClimateZones } from "../climate.js";
import { climateLivabilityScore, habitabilityFraction } from "../habitability/climateLivability.js";
import { resolveClimateStability } from "../habitability/stability.js";
import { waterBoilingK } from "../planet/composition.js";
import { clamp, round, toFinite } from "../utils.js";

function moonWaterRegimeFromHydrosphere(hydrosphere = {}) {
  if (toFinite(hydrosphere.steamFraction, 0) > 0.5) return "Dry";
  if (toFinite(hydrosphere.liquidOceanFraction, 0) >= 0.8) return "Global ocean";
  if (toFinite(hydrosphere.liquidOceanFraction, 0) >= 0.35) return "Extensive oceans";
  if (toFinite(hydrosphere.liquidOceanFraction, 0) > 0) return "Shallow oceans";
  if (toFinite(hydrosphere.permanentIceFraction, 0) >= 0.8) return "Ice world";
  return "Dry";
}

function seasonalitySummary({
  totalAmplitudeK,
  eclipseCoolingPenalty,
  planetshineFluxWm2,
  synchronousGeometryFactor,
  spinStateLabel,
}) {
  let label = "Low";
  if (totalAmplitudeK >= 18) label = "Extreme";
  else if (totalAmplitudeK >= 10) label = "Strong";
  else if (totalAmplitudeK >= 5) label = "Moderate";

  const tags = [];
  if (eclipseCoolingPenalty >= 0.03) tags.push("eclipse-heavy");
  else if (eclipseCoolingPenalty > 0.005) tags.push("eclipse-light");
  if (planetshineFluxWm2 >= 0.5) tags.push("parentshine");
  if (synchronousGeometryFactor >= 0.03) tags.push("synchronous contrast");
  if (String(spinStateLabel || "").includes("3:2")) tags.push("3:2 moderation");
  return tags.length > 0 ? `${label} (${tags.join(", ")})` : label;
}

function deriveClimateState({ meanTempK, maxTempK, hydrosphere, pressureAtm }) {
  const boilingK = waterBoilingK(Math.max(pressureAtm, 0.006));
  if (toFinite(hydrosphere?.steamFraction, 0) > 0.5 || (maxTempK > 0 && maxTempK > boilingK)) {
    return "Runaway greenhouse";
  }
  if (
    maxTempK >= 330 &&
    pressureAtm >= 0.1 &&
    (toFinite(hydrosphere?.surfaceAccessibleLiquidFraction, 0) > 0 ||
      toFinite(hydrosphere?.steamFraction, 0) > 0)
  ) {
    return "Moist greenhouse";
  }
  if (
    toFinite(hydrosphere?.surfaceAccessibleLiquidFraction, 0) <= 0 &&
    toFinite(hydrosphere?.permanentIceFraction, 0) >= 0.5 &&
    meanTempK < 273
  ) {
    return "Snowball";
  }
  return "Stable";
}

function classifyCollapseRisk({
  pressureAtm,
  persistentContrastScale,
  nightsideMinK,
  dominantSpecies,
}) {
  if (pressureAtm <= 0.0001) return { risk: "None", penalty: 1 };
  if (persistentContrastScale <= 0.12) return { risk: "Low", penalty: 0.98 };
  const dominant = String(dominantSpecies || "").toLowerCase();
  const volatileThresholdK =
    dominant === "n2"
      ? 58
      : dominant === "co"
        ? 70
        : dominant === "ch4"
          ? 90
          : dominant === "co2"
            ? 150
            : dominant === "nh3"
              ? 170
              : 110;
  if (pressureAtm < 0.01 && nightsideMinK < volatileThresholdK + 5) {
    if (persistentContrastScale < 0.75) return { risk: "Moderate", penalty: 0.84 };
    return { risk: "High", penalty: 0.72 };
  }
  if (pressureAtm < 0.1 && nightsideMinK < volatileThresholdK + 15) {
    if (persistentContrastScale < 0.45) return { risk: "Low", penalty: 0.95 };
    return { risk: "Moderate", penalty: 0.85 };
  }
  if (
    pressureAtm < 0.3 &&
    persistentContrastScale >= 0.75 &&
    nightsideMinK < volatileThresholdK + 10
  ) {
    return { risk: "Moderate", penalty: 0.9 };
  }
  return { risk: "Low", penalty: 0.97 };
}

export function computeMoonClimate({
  surfaceTempK,
  pressurePa,
  gravityG,
  hydrosphere,
  atmosphereComposition,
  dominantAtmosphereSpecies,
  illumination,
  spinState = null,
  moonLockedToPlanet,
  moonSemiMajorAxisKm,
  tidalHabitableZone = null,
} = {}) {
  const meanTempK = Math.max(toFinite(surfaceTempK, 0), 0);
  const pressureAtm = Math.max(toFinite(pressurePa, 0), 0) / 101325;
  const effectiveTilt = Math.max(toFinite(illumination?.effectiveAxialTiltDeg, 0), 0);
  const eclipseCoolingPenalty = clamp(toFinite(illumination?.eclipseCoolingPenalty, 0), 0, 0.25);
  const planetshineFluxWm2 = Math.max(toFinite(illumination?.planetshineFluxWm2, 0), 0);
  const baselineGeometryFactor = clamp(
    Math.max(
      toFinite(illumination?.synchronousGeometryFactor, 0),
      planetshineFluxWm2 /
        Math.max(toFinite(illumination?.stellarFluxWm2, 0) + planetshineFluxWm2, 1e-9),
    ),
    0,
    1,
  );
  const spinStateLabel = String(spinState?.state || "");
  const persistentContrastScale = clamp(
    toFinite(spinState?.contrastScale, moonLockedToPlanet ? 1 : 0),
    0,
    1,
  );
  const synchronousGeometryFactor = round(baselineGeometryFactor * persistentContrastScale, 3);

  const atmosphereBuffer = clamp(Math.log10(1 + pressureAtm * 10) / 2.2, 0, 1);
  const hydrosphereBuffer = clamp(
    toFinite(hydrosphere?.liquidOceanFraction, 0) +
      0.5 * toFinite(hydrosphere?.permanentIceFraction, 0),
    0,
    1,
  );
  const seasonalAmplitudeK = clamp(
    2 +
      14 *
        Math.sin((effectiveTilt * Math.PI) / 180) *
        (1 - 0.55 * atmosphereBuffer) *
        (1 - 0.2 * hydrosphereBuffer),
    0,
    24,
  );
  const synchronousContrastK = clamp(
    22 * synchronousGeometryFactor * (1 - 0.65 * atmosphereBuffer) * (1 - 0.25 * hydrosphereBuffer),
    0,
    18,
  );
  const eclipseCoolingK = clamp(40 * eclipseCoolingPenalty * (1 - 0.45 * atmosphereBuffer), 0, 12);
  const totalAmplitudeK = seasonalAmplitudeK + synchronousContrastK * 0.5 + eclipseCoolingK;
  const maxTempK = Math.max(meanTempK + seasonalAmplitudeK + synchronousContrastK * 0.5, 0);
  const minTempK = Math.max(
    meanTempK - seasonalAmplitudeK - synchronousContrastK * 0.5 - eclipseCoolingK,
    0,
  );
  const dayNightContrastK = clamp(synchronousContrastK + eclipseCoolingK * 0.6, 0, 40);
  const nightsideMinK = Math.max(meanTempK - synchronousContrastK - eclipseCoolingK, 0);

  const waterRegime = moonWaterRegimeFromHydrosphere(hydrosphere);
  const surfaceLiquidWaterPlausible =
    toFinite(hydrosphere?.surfaceAccessibleLiquidFraction, 0) > 0 ||
    hydrosphere?.surfaceLiquidPresent === true;
  const climateState = deriveClimateState({
    meanTempK,
    maxTempK,
    hydrosphere,
    pressureAtm,
  });
  const climateZones = calcClimateZones({
    surfaceTempK: meanTempK,
    axialTiltDeg: effectiveTilt,
    circulationCellCount: pressureAtm < 0.001 ? "NA" : "3",
    circulationCellRanges: [
      { name: "Cell 1", rangeDegNS: "0-30" },
      { name: "Cell 2", rangeDegNS: "30-60" },
      { name: "Cell 3", rangeDegNS: "60-90" },
    ],
    h2oPct: Math.max(toFinite(atmosphereComposition?.h2o, 0), 0) * 100,
    waterRegime,
    pressureAtm,
    tidallyLockedToStar: false,
    compositionClass:
      toFinite(hydrosphere?.permanentIceFraction, 0) >= 0.95 &&
      toFinite(hydrosphere?.surfaceAccessibleLiquidFraction, 0) <= 0
        ? "Ice world"
        : "Earth-like",
    liquidWaterPossible: surfaceLiquidWaterPlausible,
    climateState,
    gravityG: Math.max(toFinite(gravityG, 0), 0.01),
  });
  const climateLivabilityFraction = habitabilityFraction(climateZones.zones);
  const climateLivability = climateLivabilityScore(climateLivabilityFraction);
  const collapse = classifyCollapseRisk({
    pressureAtm,
    persistentContrastScale,
    nightsideMinK,
    dominantSpecies: dominantAtmosphereSpecies,
  });
  const stability = resolveClimateStability({
    climateState,
    climateLivabilityFraction,
    collapsePenalty: collapse.penalty,
  });

  return {
    modelVersion: "moon-climate-v1",
    climateState,
    climateZones,
    climateLivabilityFraction,
    climateLivabilityScore: climateLivability,
    climateStatePenalty: stability.climateStatePenalty,
    collapsePenalty: stability.collapsePenalty,
    stabilityMultiplier: stability.stabilityMultiplier,
    surfaceLiquidWaterPlausible,
    frozenSurfaceLikely:
      hydrosphere?.frozenSurface === true ||
      (toFinite(hydrosphere?.permanentIceFraction, 0) >= 0.5 &&
        toFinite(hydrosphere?.surfaceAccessibleLiquidFraction, 0) <= 0),
    dayNightContrastK: round(dayNightContrastK, 1),
    nightsideMinK: round(nightsideMinK, 1),
    collapseRisk: collapse.risk,
    collapseState:
      collapse.risk === "High"
        ? "Atmospheric collapse likely"
        : collapse.risk === "Moderate"
          ? "Atmospheric collapse possible"
          : "Stable against collapse",
    tidalHabitableZone: tidalHabitableZone
      ? {
          ...tidalHabitableZone,
          withinZone:
            tidalHabitableZone.starHzEligible &&
            tidalHabitableZone.innerKm != null &&
            tidalHabitableZone.outerKm != null &&
            toFinite(moonSemiMajorAxisKm, NaN) >= tidalHabitableZone.innerKm &&
            toFinite(moonSemiMajorAxisKm, NaN) <= tidalHabitableZone.outerKm,
        }
      : null,
    surfaceTempMeanK: round(meanTempK, 1),
    surfaceTempMinK: round(minTempK, 1),
    surfaceTempMaxK: round(maxTempK, 1),
    seasonalAmplitudeK: round(seasonalAmplitudeK, 1),
    synchronousContrastK: round(synchronousContrastK, 1),
    eclipseCoolingK: round(eclipseCoolingK, 1),
    eclipseCoolingPenalty: round(eclipseCoolingPenalty, 3),
    planetshineFluxWm2: round(planetshineFluxWm2, 4),
    seasonalitySummary: seasonalitySummary({
      totalAmplitudeK,
      eclipseCoolingPenalty,
      planetshineFluxWm2,
      synchronousGeometryFactor,
      spinStateLabel,
    }),
    spinState: spinStateLabel || (moonLockedToPlanet ? "1:1 synchronous" : "Non-resonant"),
    persistentContrastScale: round(persistentContrastScale, 3),
  };
}
