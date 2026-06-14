import { clamp, round, toFinite } from "../utils.js";
import { EARTH_INTERNAL_HEAT_FLUX_WM2 } from "./constants.js";

// First-pass thermal-profile parameters. These are deliberately conservative heuristics for
// choosing a phase-diagram comparison temperature, not a full ocean-circulation model.
export const OCEAN_THERMAL_PROFILE_CONSTANTS = Object.freeze({
  defaultAdiabaticKPerKm: 0.04,
  maxNominalAdiabaticWarmingK: 80,
  defaultBottomTempUncertaintyK: 25,
  tidalHeatingWarmingKPerEarthFlux: 10,
  maxModeledBottomTempK: 900,
});

const PURE_WATER_FREEZING_K = 273.15;
const MIN_LIQUID_PRESSURE_ATM = 0.006;

function finiteNonNegative(value, fallback = 0) {
  return Math.max(toFinite(value, fallback), 0);
}

function roundNullable(value, digits = 1) {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? round(number, digits) : null;
}

export function freezingPointKFromOceanChemistry({ salinityPct, ammoniaPct } = {}) {
  const salinity = clamp(toFinite(salinityPct, 0), 0, 35);
  const ammonia = clamp(toFinite(ammoniaPct, 0), 0, 30);
  return PURE_WATER_FREEZING_K - Math.min(45, salinity * 0.55 + ammonia * 1.35);
}

function resolveOceanDepthKm({ oceanDepthKm, hydrosphere } = {}) {
  const candidates = [
    oceanDepthKm,
    hydrosphere?.estimatedMeanOceanDepthKm,
    hydrosphere?.estimatedSurfaceOceanDepthKm,
    hydrosphere?.estimatedSubsurfaceOceanDepthKm,
    hydrosphere?.subsurfaceOceanDepthKm,
  ];
  for (const candidate of candidates) {
    const depth = finiteNonNegative(candidate, NaN);
    if (Number.isFinite(depth) && depth > 0) return depth;
  }
  return 0;
}

function heatFluxWarmingK({ geothermalFluxWm2, tidalHeatFluxWm2, subsurface = false } = {}) {
  const geothermalEarths = finiteNonNegative(geothermalFluxWm2) / EARTH_INTERNAL_HEAT_FLUX_WM2;
  const tidalEarths = finiteNonNegative(tidalHeatFluxWm2) / EARTH_INTERNAL_HEAT_FLUX_WM2;
  const geothermalWarming = clamp(geothermalEarths * (subsurface ? 1 : 2), 0, 20);
  const tidalScale = subsurface ? 0.25 : 1;
  const tidalWarming = clamp(
    tidalEarths * OCEAN_THERMAL_PROFILE_CONSTANTS.tidalHeatingWarmingKPerEarthFlux * tidalScale,
    0,
    subsurface ? 30 : 80,
  );
  return { geothermalWarming, tidalWarming, totalWarming: geothermalWarming + tidalWarming };
}

function clampTempK(tempK) {
  return clamp(toFinite(tempK, 0), 0, OCEAN_THERMAL_PROFILE_CONSTANTS.maxModeledBottomTempK);
}

function buildResult({
  bottomTempK,
  minBottomTempK,
  maxBottomTempK,
  method,
  confidence,
  assumptions,
  freezingPointK,
  oceanDepthKm,
} = {}) {
  return {
    bottomTempK: roundNullable(bottomTempK, 1),
    minBottomTempK: roundNullable(minBottomTempK, 1),
    maxBottomTempK: roundNullable(maxBottomTempK, 1),
    method,
    confidence,
    assumptions: Object.freeze([...assumptions]),
    freezingPointK: roundNullable(freezingPointK, 1),
    oceanDepthKm: roundNullable(oceanDepthKm, 2),
  };
}

function unknownResult({ freezingPointK, oceanDepthKm, assumptions } = {}) {
  return buildResult({
    bottomTempK: null,
    minBottomTempK: null,
    maxBottomTempK: null,
    method: "unknown",
    confidence: "low",
    assumptions,
    freezingPointK,
    oceanDepthKm,
  });
}

function hasSurfaceOceanContext({
  hydrosphere,
  surfaceTempK,
  freezingPointK,
  pressureAtm,
  oceanDepthKm,
}) {
  const surfaceLiquid = finiteNonNegative(
    hydrosphere?.surfaceAccessibleLiquidFraction ?? hydrosphere?.liquidOceanFraction,
  );
  const pressure = finiteNonNegative(pressureAtm, 1);
  if (surfaceLiquid > 0.01 && pressure >= MIN_LIQUID_PRESSURE_ATM) return true;
  return (
    oceanDepthKm > 0 &&
    pressure >= MIN_LIQUID_PRESSURE_ATM &&
    surfaceTempK >= freezingPointK &&
    !hydrosphere?.subsurfaceOceanPresent &&
    !hydrosphere?.frozenSurface
  );
}

function hasSubsurfaceOceanContext({ hydrosphere, iceShellThicknessKm, oceanDepthKm }) {
  const iceShell = finiteNonNegative(iceShellThicknessKm);
  return (
    hydrosphere?.subsurfaceOceanPresent === true ||
    hydrosphere?.frozenSurface === true ||
    iceShell > 0 ||
    (oceanDepthKm > 0 && finiteNonNegative(hydrosphere?.permanentIceFraction) >= 0.5)
  );
}

function isHotFluidContext({ hydrosphere, surfaceTempK, climateState }) {
  const climate = String(climateState || "").trim();
  return (
    climate === "Runaway greenhouse" ||
    finiteNonNegative(hydrosphere?.steamFraction) >= 0.5 ||
    surfaceTempK >= 373
  );
}

export function estimateBottomOceanTemperature({
  surfaceTempK,
  climateState,
  pressureAtm,
  oceanDepthKm,
  geothermalFluxWm2,
  tidalHeatFluxWm2,
  iceShellThicknessKm,
  salinityPct,
  ammoniaPct,
  hydrosphere,
} = {}) {
  const surfaceTemp = clampTempK(surfaceTempK);
  const freezingPointK = freezingPointKFromOceanChemistry({ salinityPct, ammoniaPct });
  const resolvedOceanDepthKm = resolveOceanDepthKm({ oceanDepthKm, hydrosphere });
  const adiabaticWarming = clamp(
    resolvedOceanDepthKm * OCEAN_THERMAL_PROFILE_CONSTANTS.defaultAdiabaticKPerKm,
    0,
    OCEAN_THERMAL_PROFILE_CONSTANTS.maxNominalAdiabaticWarmingK,
  );

  if (isHotFluidContext({ hydrosphere, surfaceTempK: surfaceTemp, climateState })) {
    const depthWarming = Math.min(adiabaticWarming, 60);
    const bottomTempK = clampTempK(Math.max(surfaceTemp, freezingPointK) + depthWarming * 0.25);
    const uncertainty =
      OCEAN_THERMAL_PROFILE_CONSTANTS.defaultBottomTempUncertaintyK + Math.min(depthWarming, 50);
    return buildResult({
      bottomTempK,
      minBottomTempK: Math.max(freezingPointK, bottomTempK - uncertainty),
      maxBottomTempK: clampTempK(bottomTempK + uncertainty + 25),
      method: "hot-fluid-unknown",
      confidence: "low",
      assumptions: [
        "Runaway, steam-rich, or very hot surface state; no cold seafloor ice layer is assumed.",
        "Temperature is treated as a hot-fluid estimate until a full thermal profile is available.",
      ],
      freezingPointK,
      oceanDepthKm: resolvedOceanDepthKm,
    });
  }

  if (
    hasSubsurfaceOceanContext({
      hydrosphere,
      iceShellThicknessKm,
      oceanDepthKm: resolvedOceanDepthKm,
    })
  ) {
    const iceShell = finiteNonNegative(iceShellThicknessKm);
    const heating = heatFluxWarmingK({
      geothermalFluxWm2,
      tidalHeatFluxWm2,
      subsurface: true,
    });
    const shellInsulationK = clamp(iceShell * 0.12, 0, 8);
    const nominalWarming = clamp(
      1.5 + adiabaticWarming * 0.15 + heating.totalWarming * 0.35 + shellInsulationK,
      0,
      18,
    );
    const bottomTempK = clampTempK(freezingPointK + nominalWarming);
    const uncertainty =
      OCEAN_THERMAL_PROFILE_CONSTANTS.defaultBottomTempUncertaintyK +
      Math.min(heating.totalWarming * 0.5 + shellInsulationK, 20);
    return buildResult({
      bottomTempK,
      minBottomTempK: Math.max(0, freezingPointK - 2),
      maxBottomTempK: clampTempK(bottomTempK + uncertainty),
      method: "subsurface-ocean",
      confidence: "medium",
      assumptions: [
        "Frozen-surface or ice-shell context; liquid ocean is anchored near the local freezing point.",
        "Geothermal, tidal, and ice-shell terms widen the warm side of the estimate.",
      ],
      freezingPointK,
      oceanDepthKm: resolvedOceanDepthKm,
    });
  }

  if (
    !hasSurfaceOceanContext({
      hydrosphere,
      surfaceTempK: surfaceTemp,
      freezingPointK,
      pressureAtm,
      oceanDepthKm: resolvedOceanDepthKm,
    })
  ) {
    return unknownResult({
      freezingPointK,
      oceanDepthKm: resolvedOceanDepthKm,
      assumptions: [
        "No substantial surface or subsurface liquid-ocean context was supplied.",
        "Bottom-ocean temperature is left unknown rather than inferred from surface temperature alone.",
      ],
    });
  }

  const heating = heatFluxWarmingK({ geothermalFluxWm2, tidalHeatFluxWm2 });
  const bottomTempK = clampTempK(
    Math.max(surfaceTemp, freezingPointK + 1) + adiabaticWarming + heating.totalWarming,
  );
  const uncertainty =
    OCEAN_THERMAL_PROFILE_CONSTANTS.defaultBottomTempUncertaintyK +
    Math.min(adiabaticWarming * 0.25 + heating.totalWarming * 0.2, 35);

  return buildResult({
    bottomTempK,
    minBottomTempK: Math.max(freezingPointK, bottomTempK - uncertainty),
    maxBottomTempK: clampTempK(bottomTempK + uncertainty),
    method: "surface-ocean",
    confidence: "medium",
    assumptions: [
      "Surface liquid ocean context; nominal bottom temperature is at least near local freezing.",
      "A small adiabatic/depth term and optional heat-flux terms are included as first-pass heuristics.",
    ],
    freezingPointK,
    oceanDepthKm: resolvedOceanDepthKm,
  });
}
