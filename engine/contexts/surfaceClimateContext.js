import { calcClimateZones } from "../climate.js";
import { climateLivabilityScore, habitabilityFraction } from "../habitability/climateLivability.js";
import { clamp, round, toFinite } from "../utils.js";
import { resolveSurfaceOceanFractions } from "./surfaceOceanCoverageAccessors.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

const MODEL_VERSION = "surface-climate-context-v1";
const SOURCE_KEYS = ["surfaceClimate"];

function usableNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function classifyWind({ pressureAtm, rotationPeriodHours, heatRedistributionEfficiency }) {
  const pressure = Math.max(0, toFinite(pressureAtm, 1));
  if (pressure <= 1e-5) return "none";
  if (pressure < 0.03) return "weak";
  const rotation = Math.max(0.1, toFinite(rotationPeriodHours, 24));
  const redistribution = clamp(toFinite(heatRedistributionEfficiency, 0.5), 0, 1);
  const score = clamp(0.35 * Math.log10(1 + 24 / rotation) + 0.65 * redistribution, 0, 1);
  return scoreToClass(score, {
    high: "strong",
    medium: "moderate",
    low: "weak",
    none: "weak",
    highAt: 0.72,
    mediumAt: 0.42,
    lowAt: 0,
  });
}

function inferHadleyExtentDeg({ circulationCellRanges, circulationCellCount, tidallyLocked }) {
  if (tidallyLocked) return null;
  const ranges = Array.isArray(circulationCellRanges) ? circulationCellRanges : [];
  const first = ranges[0]?.rangeDegNS || ranges[0]?.range || "";
  const match = String(first).match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (match) return round(Math.max(Number(match[1]), Number(match[2])), 1);
  const count = String(circulationCellCount || "3");
  if (count === "1") return 60;
  if (count === "3") return 30;
  if (count === "5") return 30;
  if (count === "7") return 23;
  return null;
}

function defaultCellRanges(cellCount) {
  const count = String(cellCount || "3");
  if (count === "1") return [{ name: "Cell 1", rangeDegNS: "0-90" }];
  if (count === "5")
    return [
      { name: "Cell 1", rangeDegNS: "0-23" },
      { name: "Cell 2", rangeDegNS: "23-30" },
      { name: "Cell 3", rangeDegNS: "30-47" },
      { name: "Cell 4", rangeDegNS: "47-56" },
      { name: "Cell 5", rangeDegNS: "56-90" },
    ];
  if (count === "7")
    return [
      { name: "Cell 1", rangeDegNS: "0-15" },
      { name: "Cell 2", rangeDegNS: "15-30" },
      { name: "Cell 3", rangeDegNS: "30-45" },
      { name: "Cell 4", rangeDegNS: "45-60" },
      { name: "Cell 5", rangeDegNS: "60-70" },
      { name: "Cell 6", rangeDegNS: "70-80" },
      { name: "Cell 7", rangeDegNS: "80-90" },
    ];
  return [
    { name: "Cell 1", rangeDegNS: "0-30" },
    { name: "Cell 2", rangeDegNS: "30-60" },
    { name: "Cell 3", rangeDegNS: "60-90" },
  ];
}

function summarizeAridity(zones = []) {
  const values = zones
    .map((zone) => Number(zone?.aridity))
    .filter((value) => Number.isFinite(value));
  if (!values.length) {
    return {
      meanAridity: null,
      dryZoneFraction: 0,
      class: "unknown",
    };
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const dry = zones.filter((zone) => zone?.master === "B" || Number(zone?.aridity) < 0.25).length;
  return {
    meanAridity: round(mean, 3),
    dryZoneFraction: round(dry / Math.max(1, zones.length), 3),
    class: mean >= 0.68 ? "humid" : mean >= 0.42 ? "mixed" : mean >= 0.18 ? "arid" : "desiccated",
  };
}

export function buildSurfaceClimateContext({
  surfaceTempK = 288,
  coupledSurfaceTempK = null,
  axialTiltDeg = 23.44,
  circulationCellCount = "3",
  circulationCellRanges = [],
  h2oPct = 0,
  waterRegime = "Extensive oceans",
  pressureAtm = 1,
  tidallyLockedToStar = false,
  compositionClass = "Earth-like",
  liquidWaterPossible = true,
  climateState = "Stable",
  insolationEarth = 1,
  gravityG = 1,
  hydrosphere = null,
  cloudCirculation = null,
  climateChemistryForcing = null,
  nitrogenCycleContext = null,
  photochemistry = null,
  atmosphericCollapse = null,
  rotationPeriodHours = 24,
  altitudeM = 0,
  initialClimateModel = null,
} = {}) {
  const assumptions = [];
  const limitingFactors = [];
  const notes = [];
  const coverage = resolveSurfaceOceanFractions(hydrosphere);
  const coupled = usableNumber(coupledSurfaceTempK);
  const baseline = toFinite(surfaceTempK, 288);
  const chemistryDelta = Number(climateChemistryForcing?.netDeltaK);
  const cloudDelta = Number(cloudCirculation?.cloudAlbedoDeltaK);
  const tempBasis = coupled != null ? coupled : baseline;
  const resolvedCellRanges =
    Array.isArray(circulationCellRanges) && circulationCellRanges.length
      ? circulationCellRanges
      : defaultCellRanges(circulationCellCount);
  const status =
    toFinite(pressureAtm, 1) <= 1e-5 || liquidWaterPossible === false
      ? CONTEXT_STATUS.LIMITED
      : CONTEXT_STATUS.SUPPORTED;

  if (coupled == null && climateChemistryForcing) {
    assumptions.push("Climate chemistry context did not expose a finite coupled temperature.");
  }
  if (toFinite(pressureAtm, 1) <= 1e-5) {
    limitingFactors.push("No durable atmosphere, so climate bands are surface-regime diagnostics.");
  }
  if (liquidWaterPossible === false) {
    limitingFactors.push("Stable surface liquid water is not currently supported.");
  }
  if (cloudCirculation?.confidence === "low") {
    assumptions.push("Cloud and heat-redistribution context has low confidence.");
  }
  if (photochemistry?.haze?.surfaceLightReductionFraction > 0.1) {
    notes.push("Photochemical haze reduces surface light and visible cloud leverage.");
  }
  const nitrogenOutputs =
    nitrogenCycleContext && typeof nitrogenCycleContext === "object"
      ? nitrogenCycleContext.outputs || nitrogenCycleContext
      : {};
  if (nitrogenOutputs.climatePressureSupportNote) {
    notes.push(nitrogenOutputs.climatePressureSupportNote);
  }
  if (/weak|minimal/i.test(String(nitrogenOutputs.pressureBufferSupportClass || ""))) {
    limitingFactors.push("Weak N2 pressure buffering limits climate pressure support.");
  }
  if (
    atmosphericCollapse?.collapseRisk === "high" ||
    atmosphericCollapse?.collapseState === "collapse-risk"
  ) {
    limitingFactors.push("Atmospheric collapse risk limits climate-zone confidence.");
  }

  const climateModel =
    initialClimateModel && Array.isArray(initialClimateModel.zones)
      ? calcClimateZones({
          ...(initialClimateModel.inputs || {}),
          surfaceTempK: tempBasis,
          axialTiltDeg,
          circulationCellCount,
          circulationCellRanges: resolvedCellRanges,
          h2oPct,
          waterRegime,
          pressureAtm,
          tidallyLockedToStar,
          compositionClass,
          liquidWaterPossible,
          climateState,
          insolationEarth,
          gravityG,
          altitudeM,
        })
      : calcClimateZones({
          surfaceTempK: tempBasis,
          axialTiltDeg,
          circulationCellCount,
          circulationCellRanges: resolvedCellRanges,
          h2oPct,
          waterRegime,
          pressureAtm,
          tidallyLockedToStar,
          compositionClass,
          liquidWaterPossible,
          climateState,
          insolationEarth,
          gravityG,
          altitudeM,
        });

  const zones = Array.isArray(climateModel.zones) ? climateModel.zones : [];
  const habitableFraction = habitabilityFraction(zones);
  const heatRedistributionEfficiency = clamp(
    toFinite(cloudCirculation?.heatRedistributionEfficiency, pressureAtm > 0 ? 0.45 : 0),
    0,
    1,
  );
  const confidence =
    status === CONTEXT_STATUS.LIMITED
      ? CONFIDENCE.LOW
      : cloudCirculation?.confidence === "high" && climateChemistryForcing?.confidence !== "low"
        ? CONFIDENCE.HIGH
        : CONFIDENCE.MEDIUM;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status,
    confidence,
    inputs: {
      surfaceTempK: roundMaybe(baseline, 2),
      coupledSurfaceTempK: roundMaybe(coupled, 2),
      surfaceTempBasisK: roundMaybe(tempBasis, 2),
      axialTiltDeg: roundMaybe(axialTiltDeg, 2),
      pressureAtm: roundMaybe(pressureAtm, 6),
      gravityG: roundMaybe(gravityG, 3),
      waterRegime,
      liquidWaterPossible: !!liquidWaterPossible,
      tidallyLockedToStar: !!tidallyLockedToStar,
      nitrogenCycleModelVersion: nitrogenCycleContext?.modelVersion || null,
      surfaceOceanCoverageModelVersion: coverage.modelVersion,
    },
    outputs: {
      zones,
      display: climateModel.display || {},
      advisory: climateModel.advisory || null,
      climateLivabilityFraction: habitableFraction,
      climateLivabilityScore: climateLivabilityScore(habitableFraction),
      ariditySummary: summarizeAridity(zones),
      surfaceTempBasisK: roundMaybe(tempBasis, 2),
      temperatureAdjustmentK: roundMaybe(tempBasis - baseline, 2),
      chemistryDeltaK: Number.isFinite(chemistryDelta) ? round(chemistryDelta, 2) : null,
      cloudAlbedoDeltaK: Number.isFinite(cloudDelta) ? round(cloudDelta, 2) : null,
      heatRedistributionEfficiency: round(heatRedistributionEfficiency, 3),
      hadleyExtentDeg: inferHadleyExtentDeg({
        circulationCellRanges: resolvedCellRanges,
        circulationCellCount,
        tidallyLocked: !!tidallyLockedToStar,
      }),
      windSpeedClass: classifyWind({
        pressureAtm,
        rotationPeriodHours,
        heatRedistributionEfficiency,
      }),
      hydrosphereSurfaceLiquidFraction: roundMaybe(coverage.surfaceAccessibleLiquidFraction, 3),
      hydrosphereOceanFraction: roundMaybe(coverage.liquidOceanFraction, 3),
      hydrosphereExposedLandFraction: roundMaybe(coverage.landFraction, 3),
    },
    assumptions,
    limitingFactors,
    notes,
    sourceKeys: SOURCE_KEYS,
  });
}
