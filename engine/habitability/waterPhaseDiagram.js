import { round, toFinite } from "../utils.js";

// IAPWS R14-08(2011) pure-water reference points used by the liquid/high-pressure-ice
// comparison. Salinity and mixed volatiles are handled as higher-level uncertainty, not by
// modifying these coefficients.
export const WATER_CRITICAL_POINT = Object.freeze({
  tempK: 647.096,
  pressurePa: 22.064e6,
});

export const WATER_PHASE_TRIPLE_POINTS = Object.freeze({
  iceIhIceIiiLiquid: Object.freeze({
    tempK: 251.165,
    pressurePa: 208.566e6,
    phases: Object.freeze(["ice-ih", "ice-iii", "liquid"]),
  }),
  iceIiiIceVLiquid: Object.freeze({
    tempK: 256.164,
    pressurePa: 350.1e6,
    phases: Object.freeze(["ice-iii", "ice-v", "liquid"]),
  }),
  iceVIceViLiquid: Object.freeze({
    tempK: 273.31,
    pressurePa: 632.4e6,
    phases: Object.freeze(["ice-v", "ice-vi", "liquid"]),
  }),
  iceViIceViiLiquid: Object.freeze({
    tempK: 355,
    pressurePa: 2216e6,
    phases: Object.freeze(["ice-vi", "ice-vii", "liquid"]),
  }),
});

// Melting-curve validity ranges and coefficients from IAPWS R14-08(2011). The classifier
// intentionally refuses to extrapolate outside these ranges, especially above the Ice VII
// fit where pressure rises steeply with temperature.
export const WATER_PHASE_BOUNDARIES = Object.freeze({
  "ice-ih": Object.freeze({
    phase: "ice-ih",
    label: "Ice Ih",
    tempMinK: 251.165,
    tempMaxK: 273.16,
    pressureStarPa: 611.657,
    tempStarK: 273.16,
    equation: "ice-ih",
    terms: Object.freeze([
      Object.freeze({ a: 0.119539337e7, b: 0.3e1 }),
      Object.freeze({ a: 0.808183159e5, b: 0.2575e2 }),
      Object.freeze({ a: 0.33382686e4, b: 0.10375e3 }),
    ]),
  }),
  "ice-iii": Object.freeze({
    phase: "ice-iii",
    label: "Ice III",
    tempMinK: 251.165,
    tempMaxK: 256.164,
    pressureStarPa: 208.566e6,
    tempStarK: 251.165,
    equation: "power",
    coefficient: 0.299948,
    exponent: 60,
  }),
  "ice-v": Object.freeze({
    phase: "ice-v",
    label: "Ice V",
    tempMinK: 256.164,
    tempMaxK: 273.31,
    pressureStarPa: 350.1e6,
    tempStarK: 256.164,
    equation: "power",
    coefficient: 1.18721,
    exponent: 8,
  }),
  "ice-vi": Object.freeze({
    phase: "ice-vi",
    label: "Ice VI",
    tempMinK: 273.31,
    tempMaxK: 355,
    pressureStarPa: 632.4e6,
    tempStarK: 273.31,
    equation: "power",
    coefficient: 1.07476,
    exponent: 4.6,
  }),
  "ice-vii": Object.freeze({
    phase: "ice-vii",
    label: "Ice VII",
    tempMinK: 355,
    tempMaxK: 715,
    pressureStarPa: 2216e6,
    tempStarK: 355,
    equation: "ice-vii",
  }),
});

const PHASE_ALIASES = Object.freeze({
  ih: "ice-ih",
  iceih: "ice-ih",
  "ice-ih": "ice-ih",
  iii: "ice-iii",
  iceiii: "ice-iii",
  "ice-iii": "ice-iii",
  v: "ice-v",
  icev: "ice-v",
  "ice-v": "ice-v",
  vi: "ice-vi",
  icevi: "ice-vi",
  "ice-vi": "ice-vi",
  vii: "ice-vii",
  icevii: "ice-vii",
  "ice-vii": "ice-vii",
});

function canonicalIcePhase(phase) {
  const key = String(phase || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  return PHASE_ALIASES[key] || null;
}

function isValidTempForBoundary(boundary, tempK) {
  return tempK >= boundary.tempMinK && tempK <= boundary.tempMaxK;
}

function roundNullable(value, digits = 3) {
  const number = Number(value);
  return Number.isFinite(number) ? round(number, digits) : null;
}

function pressureGPa(pressurePa) {
  return roundNullable(Number(pressurePa) / 1e9, 4);
}

function calculateBoundaryPressurePa(boundary, tempK) {
  const theta = tempK / boundary.tempStarK;
  if (boundary.equation === "ice-ih") {
    const pi = 1 + boundary.terms.reduce((sum, term) => sum + term.a * (1 - theta ** term.b), 0);
    return pi * boundary.pressureStarPa;
  }

  if (boundary.equation === "power") {
    const pi = 1 - boundary.coefficient * (1 - theta ** boundary.exponent);
    return pi * boundary.pressureStarPa;
  }

  if (boundary.equation === "ice-vii") {
    const lnPi =
      1.73683 * (1 - theta ** -1) - 0.0544606 * (1 - theta ** 5) + 8.06106e-8 * (1 - theta ** 22);
    return Math.exp(lnPi) * boundary.pressureStarPa;
  }

  return null;
}

function liquidusPhaseForTempK(tempK) {
  if (tempK < WATER_PHASE_TRIPLE_POINTS.iceIhIceIiiLiquid.tempK) return null;
  if (tempK < WATER_PHASE_TRIPLE_POINTS.iceIiiIceVLiquid.tempK) return "ice-iii";
  if (tempK < WATER_PHASE_TRIPLE_POINTS.iceVIceViLiquid.tempK) return "ice-v";
  if (tempK < WATER_PHASE_TRIPLE_POINTS.iceViIceViiLiquid.tempK) return "ice-vi";
  if (tempK <= WATER_PHASE_BOUNDARIES["ice-vii"].tempMaxK) return "ice-vii";
  return null;
}

function unknownClassification({
  pressurePa = null,
  bottomTempK = null,
  reasonCode = "phaseDiagramUnknown",
  explanation = "Pressure/temperature phase state is not constrained by the supported water phase diagram.",
} = {}) {
  return {
    seafloorPhase: "unknown",
    phaseBoundary: null,
    pressurePa: roundNullable(pressurePa, 0),
    bottomTempK: roundNullable(bottomTempK, 3),
    pressureMarginPa: null,
    pressureMarginGPa: null,
    pressureRatio: null,
    highPressureIceStable: false,
    highPressureIcePhase: null,
    confidence: "low",
    reasonCode,
    explanation,
  };
}

function confidenceFromMargin({ pressurePa, boundaryPressurePa, nearBoundary }) {
  if (nearBoundary) return "medium";
  return pressurePa > boundaryPressurePa ? "high" : "high";
}

function boundaryPressureRangeForTemperatureUncertainty(bottomTempK, uncertaintyTempK) {
  const tempDelta = Math.max(toFinite(uncertaintyTempK, 0), 0);
  if (tempDelta <= 0) return null;
  const pressures = [bottomTempK - tempDelta, bottomTempK + tempDelta]
    .map((tempK) => liquidusPressurePaAtTempK(tempK))
    .filter((boundary) => boundary.validRange && Number.isFinite(boundary.pressurePa))
    .map((boundary) => boundary.pressurePa);
  if (!pressures.length) return null;
  return {
    minPa: Math.min(...pressures),
    maxPa: Math.max(...pressures),
  };
}

export function meltingPressurePaForIcePhase(phase, tempK) {
  const canonicalPhase = canonicalIcePhase(phase);
  const boundary = WATER_PHASE_BOUNDARIES[canonicalPhase];
  const temp = toFinite(tempK, NaN);
  if (!boundary || !Number.isFinite(temp) || !isValidTempForBoundary(boundary, temp)) {
    return null;
  }
  return calculateBoundaryPressurePa(boundary, temp);
}

export function liquidusPressurePaAtTempK(tempK) {
  const temp = toFinite(tempK, NaN);
  if (!Number.isFinite(temp)) {
    return {
      phase: null,
      pressurePa: null,
      pressureGPa: null,
      tempK: null,
      validRange: false,
      rangeNote: "Temperature is not finite.",
    };
  }

  const phase = liquidusPhaseForTempK(temp);
  const boundary = WATER_PHASE_BOUNDARIES[phase];
  if (!boundary) {
    // Outside the supported liquidus intervals we report an unknown phase state rather than
    // stretching the nearest curve into unvalidated pressure/temperature space.
    return {
      phase: null,
      pressurePa: null,
      pressureGPa: null,
      tempK: roundNullable(temp, 3),
      validRange: false,
      rangeNote:
        temp > WATER_PHASE_BOUNDARIES["ice-vii"].tempMaxK
          ? "Temperature is above the supported Ice VII melting-curve range; no extrapolation is applied."
          : "Temperature is below the supported high-pressure liquidus range.",
    };
  }

  const pressurePa = meltingPressurePaForIcePhase(phase, temp);
  return {
    phase,
    pressurePa,
    pressureGPa: pressureGPa(pressurePa),
    tempK: roundNullable(temp, 3),
    validRange: pressurePa != null,
    rangeNote: "",
  };
}

export function classifyWaterPhaseAtSeafloor({
  pressurePa,
  bottomTempK,
  salinityPct,
  uncertaintyPressureFraction = 0.1,
  uncertaintyTempK = 5,
} = {}) {
  const pressure = toFinite(pressurePa, NaN);
  const temp = toFinite(bottomTempK, NaN);
  if (!Number.isFinite(pressure) || pressure < 0 || !Number.isFinite(temp)) {
    return unknownClassification({
      pressurePa: Number.isFinite(pressure) ? pressure : null,
      bottomTempK: Number.isFinite(temp) ? temp : null,
      reasonCode: "invalidPhaseInputs",
      explanation:
        "Seafloor pressure and bottom-ocean temperature are required for phase classification.",
    });
  }

  const salinity = Math.max(toFinite(salinityPct, 0), 0);
  if (temp >= WATER_CRITICAL_POINT.tempK && pressure >= WATER_CRITICAL_POINT.pressurePa) {
    return {
      seafloorPhase: "supercritical-fluid",
      phaseBoundary: null,
      pressurePa: roundNullable(pressure, 0),
      bottomTempK: roundNullable(temp, 3),
      pressureMarginPa: null,
      pressureMarginGPa: null,
      pressureRatio: null,
      highPressureIceStable: false,
      highPressureIcePhase: null,
      confidence: "medium",
      reasonCode: "supercriticalFluid",
      explanation:
        "The pressure/temperature point lies above water's critical point; dense ice stability is not inferred from the melting curves.",
    };
  }

  const boundary = liquidusPressurePaAtTempK(temp);
  if (!boundary.validRange || !Number.isFinite(boundary.pressurePa)) {
    return unknownClassification({
      pressurePa: pressure,
      bottomTempK: temp,
      reasonCode: "temperatureOutOfRange",
      explanation: boundary.rangeNote,
    });
  }

  const uncertaintyFraction = Math.max(toFinite(uncertaintyPressureFraction, 0.1), 0);
  const marginPa = pressure - boundary.pressurePa;
  const uncertaintyPa = boundary.pressurePa * uncertaintyFraction;
  const tempUncertaintyRange = boundaryPressureRangeForTemperatureUncertainty(
    temp,
    uncertaintyTempK,
  );
  const nearByPressure = Math.abs(marginPa) <= uncertaintyPa;
  const nearByTemp =
    tempUncertaintyRange != null &&
    pressure >= tempUncertaintyRange.minPa &&
    pressure <= tempUncertaintyRange.maxPa;
  const nearBoundary = nearByPressure || nearByTemp;
  const highPressureIceStable = pressure > boundary.pressurePa;
  const seafloorPhase = highPressureIceStable ? boundary.phase : "liquid";
  const confidence = confidenceFromMargin({
    pressurePa: pressure,
    boundaryPressurePa: boundary.pressurePa,
    nearBoundary,
  });
  const pressureRatio = boundary.pressurePa > 0 ? pressure / boundary.pressurePa : null;
  const salinityNote =
    salinity > 0 ? " Salinity effects are not yet applied to the pure-water phase boundary." : "";

  return {
    seafloorPhase,
    phaseBoundary: boundary,
    pressurePa: roundNullable(pressure, 0),
    bottomTempK: roundNullable(temp, 3),
    pressureMarginPa: roundNullable(marginPa, 0),
    pressureMarginGPa: roundNullable(marginPa / 1e9, 4),
    pressureRatio: roundNullable(pressureRatio, 4),
    highPressureIceStable,
    highPressureIcePhase: highPressureIceStable ? boundary.phase : null,
    confidence,
    reasonCode: highPressureIceStable
      ? boundary.phase === "ice-vii"
        ? "iceViiStable"
        : "highPressureIceStable"
      : nearBoundary
        ? "nearLiquidusBoundary"
        : "liquidBelowLiquidus",
    explanation: highPressureIceStable
      ? `Seafloor pressure is above the ${boundary.phase} liquidus boundary for the estimated bottom-ocean temperature.${salinityNote}`
      : `Seafloor pressure is below the ${boundary.phase} liquidus boundary for the estimated bottom-ocean temperature.${salinityNote}`,
  };
}
