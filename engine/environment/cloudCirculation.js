import { clamp, round, toFinite } from "../utils.js";

const MODEL_VERSION = "cloud-circulation-v1";

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function fraction(value, fallback = 0) {
  return clamp(toFinite(value, fallback), 0, 1);
}

function logRangeScore(value, lower, upper) {
  const number = finiteNonNegative(value, 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const low = Math.log10(Math.max(lower, 1e-12));
  const high = Math.log10(Math.max(upper, lower * 1.0001));
  return clamp((Math.log10(Math.max(number, 1e-12)) - low) / (high - low), 0, 1);
}

function temperatureCloudSupport(surfaceTempK) {
  const temp = finiteNonNegative(surfaceTempK, 0);
  if (temp <= 0) return 0;
  if (temp < 180) return 0.08;
  if (temp < 240) return clamp((temp - 180) / 60, 0.08, 0.65);
  if (temp <= 315) return 1;
  if (temp <= 373) return clamp(1 - ((temp - 315) / 58) * 0.4, 0.45, 1);
  if (temp <= 650) return clamp(0.45 + ((temp - 373) / 277) * 0.35, 0.45, 0.8);
  return 0.28;
}

function classifyCirculation({ pressureAtm, tidallyLocked, rotationPeriodHours, cloudDeckScore }) {
  if (pressureAtm <= 1e-4) return "Airless / ballistic";
  if (pressureAtm < 0.03) return "Thin weak transport";
  if (tidallyLocked && cloudDeckScore >= 0.5) return "Substellar cloud deck";
  if (tidallyLocked) return "Day-night overturning";
  if (rotationPeriodHours >= 96) return "Slow-rotator broad cells";
  if (rotationPeriodHours <= 8) return "Fast-rotator banded cells";
  return "Earth-like overturning cells";
}

function confidence({ pressureAtm, waterSupport, stellarFluxEarth, hasCollapseContext }) {
  if (pressureAtm <= 1e-5) return "high";
  if (pressureAtm < 0.01) return "medium";
  if (waterSupport > 0.02 && stellarFluxEarth > 0 && hasCollapseContext) return "high";
  if (waterSupport > 0.02 || stellarFluxEarth > 0) return "medium";
  return "low";
}

export function computeCloudCirculationContext({
  pressureAtm = 0,
  surfaceWaterFraction = null,
  surfaceTempK = 0,
  rotationPeriodHours = 24,
  tidallyLocked = false,
  stellarFluxEarth = 1,
  hazeSurfaceLightReduction = 0,
  atmosphericCollapseState = "",
  hydrosphere = null,
  ppH2OAtm = 0,
} = {}) {
  const pressure = finiteNonNegative(pressureAtm, 0);
  const temp = finiteNonNegative(surfaceTempK, 0);
  const rotationHours = finiteNonNegative(rotationPeriodHours, 24);
  const flux = finiteNonNegative(stellarFluxEarth, 0);
  const hazeReduction = fraction(hazeSurfaceLightReduction, 0);
  const collapseState = String(atmosphericCollapseState || "");
  const collapseRisky = /collapse likely|collapse possible|high|moderate/i.test(collapseState);

  const liquidSupport = Math.max(
    fraction(surfaceWaterFraction, NaN),
    fraction(hydrosphere?.surfaceAccessibleLiquidFraction, 0),
    fraction(hydrosphere?.liquidOceanFraction, 0),
  );
  const steamSupport = fraction(hydrosphere?.steamFraction, 0);
  const iceSupport = fraction(hydrosphere?.permanentIceFraction, 0);
  const subsurfaceOnly =
    liquidSupport <= 0.01 && fraction(hydrosphere?.subsurfaceOceanScore, 0) > 0.2;
  const waterSupport = clamp(
    Math.max(liquidSupport, 0.45 * steamSupport, 0.25 * iceSupport) +
      0.2 * logRangeScore(ppH2OAtm, 1e-4, 0.03),
    0,
    1,
  );
  const pressureSupport = pressure <= 0 ? 0 : logRangeScore(pressure, 0.01, 0.8);
  const thickAirSupport = logRangeScore(pressure, 0.1, 4);
  const tempSupport = temperatureCloudSupport(temp);
  const insolationSupport = clamp(1 - Math.abs(Math.log2(Math.max(flux, 0.05))) / 3.2, 0, 1);
  const highInsolation = clamp((flux - 0.8) / 0.9, 0, 1);
  const slowRotation =
    rotationHours >= 0 ? clamp(Math.log10(1 + rotationHours / 24) / 1.2, 0, 1) : 0;

  const cloudFraction =
    pressure <= 1e-5 || waterSupport <= 0.005
      ? 0
      : clamp(
          0.08 +
            0.34 * waterSupport +
            0.18 * pressureSupport +
            0.16 * tempSupport +
            0.08 * insolationSupport +
            0.12 * steamSupport -
            0.14 * hazeReduction,
          0,
          0.95,
        );
  const substellarCloudDeckLikelihood =
    pressure <= 1e-5 || !tidallyLocked
      ? 0
      : clamp(
          waterSupport *
            pressureSupport *
            highInsolation *
            (0.35 + 0.65 * slowRotation) *
            tempSupport *
            (1 - 0.45 * hazeReduction),
          0,
          1,
        );
  const cloudAlbedoEffect = clamp(
    cloudFraction * (0.16 + 0.42 * substellarCloudDeckLikelihood) * (1 - 0.35 * hazeReduction),
    0,
    0.75,
  );
  const cloudAlbedoDeltaK = round(
    -clamp(4.2 * cloudAlbedoEffect + 3.2 * substellarCloudDeckLikelihood, 0, 8),
    2,
  );
  const heatRedistributionEfficiency =
    pressure <= 1e-5
      ? 0
      : clamp(
          0.12 +
            0.46 * thickAirSupport +
            0.18 * waterSupport +
            0.1 * (tidallyLocked ? substellarCloudDeckLikelihood : slowRotation) -
            (collapseRisky ? 0.12 : 0),
          0,
          1,
        );
  const collapseRiskModifier = clamp(
    1 - 0.35 * heatRedistributionEfficiency - 0.15 * substellarCloudDeckLikelihood,
    0.45,
    1.15,
  );
  const circulationRegime = classifyCirculation({
    pressureAtm: pressure,
    tidallyLocked,
    rotationPeriodHours: rotationHours,
    cloudDeckScore: substellarCloudDeckLikelihood,
  });
  const notes = [];
  if (pressure <= 1e-5)
    notes.push("No durable atmosphere, so clouds and heat transport are inactive.");
  else if (waterSupport <= 0.005) notes.push("Cloud support is water-limited.");
  if (subsurfaceOnly) notes.push("Subsurface water is not treated as exposed cloud source.");
  if (substellarCloudDeckLikelihood >= 0.5) {
    notes.push(
      "Wet, slow/synchronous high-flux context supports a possible substellar cloud deck.",
    );
  }
  if (collapseRisky && heatRedistributionEfficiency < 0.35) {
    notes.push("Weak heat redistribution preserves atmospheric-collapse risk.");
  }
  if (hazeReduction > 0.1) notes.push("Photochemical haze reduces visible cloud-albedo leverage.");

  return {
    modelVersion: MODEL_VERSION,
    cloudFraction: round(cloudFraction, 3),
    cloudAlbedoEffect: round(cloudAlbedoEffect, 3),
    cloudAlbedoDeltaK,
    substellarCloudDeckLikelihood: round(substellarCloudDeckLikelihood, 3),
    heatRedistributionEfficiency: round(heatRedistributionEfficiency, 3),
    circulationRegime,
    collapseRiskModifier: round(collapseRiskModifier, 3),
    confidence: confidence({
      pressureAtm: pressure,
      waterSupport,
      stellarFluxEarth: flux,
      hasCollapseContext: collapseState.length > 0,
    }),
    notes,
  };
}
