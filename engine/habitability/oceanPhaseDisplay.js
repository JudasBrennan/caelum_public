import { fmt } from "../utils.js";

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstPresent(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return null;
}

function phaseLabel(phase) {
  switch (String(phase || "").toLowerCase()) {
    case "ice-vi":
      return "ice VI";
    case "ice-vii":
      return "ice VII";
    case "liquid":
      return "liquid";
    case "supercritical-fluid":
      return "supercritical fluid";
    case "unknown":
      return "unknown";
    default:
      return String(phase || "").replace(/-/g, " ");
  }
}

function formatGPa(value) {
  const pressure = finiteOrNull(value);
  if (pressure == null) return null;
  if (pressure >= 10) return fmt(pressure, 1);
  if (pressure >= 1) return fmt(pressure, 2);
  return fmt(pressure, 3);
}

function normalizeBottomTempRangeK(value) {
  if (Array.isArray(value) && value.length >= 2) {
    const min = finiteOrNull(value[0]);
    const max = finiteOrNull(value[1]);
    return min == null || max == null ? null : [min, max];
  }
  if (value && typeof value === "object") {
    const min = finiteOrNull(value.minBottomTempK ?? value.min);
    const max = finiteOrNull(value.maxBottomTempK ?? value.max);
    return min == null || max == null ? null : [min, max];
  }
  return null;
}

function interpretationForOceanPhase({
  classificationMode,
  pressureGPa,
  liquidusPressureGPa,
  seafloorPhase,
  highPressureIceRisk,
  highPressureIceLikely,
  highPressureIceStable,
  highPressureIcePhase,
  rockOceanBarrier,
  phaseDiagramConfidence,
}) {
  if (classificationMode !== "phase-diagram") {
    return highPressureIceRisk
      ? "Pressure-only caution: bottom-ocean temperature is not constrained"
      : "Interpretation: pressure-only estimate; bottom-ocean temperature is not constrained";
  }

  if (phaseDiagramConfidence === "low" || seafloorPhase === "unknown") {
    return "Interpretation: phase state uncertain at this pressure-temperature estimate";
  }

  if (seafloorPhase === "liquid" && !highPressureIceRisk) {
    const deepWarmLiquid =
      finiteOrNull(pressureGPa) != null &&
      finiteOrNull(liquidusPressureGPa) != null &&
      pressureGPa >= 1;
    return deepWarmLiquid
      ? "Interpretation: liquid remains possible at the ocean floor for the current warm estimate"
      : "Interpretation: below high-pressure ice stability for the current estimate";
  }

  if (highPressureIceStable) {
    const phase = phaseLabel(highPressureIcePhase || seafloorPhase);
    if (highPressureIcePhase === "ice-vii") {
      return "Interpretation: ice VII stable at the ocean floor in the current estimate";
    }
    if (highPressureIceLikely || rockOceanBarrier === "likely") {
      return `Interpretation: dense ice barrier likely at the ocean floor (${phase})`;
    }
    return `Interpretation: dense ice barrier plausible at the ocean floor (${phase})`;
  }

  if (rockOceanBarrier === "possible" || highPressureIceRisk) {
    return "Interpretation: near high-pressure ice stability; treat as a possible dense-ice barrier";
  }

  return "Interpretation: below high-pressure ice stability for the current estimate";
}

export function formatOceanPhaseDiagnostics(source = {}) {
  const pressureGPa = finiteOrNull(firstPresent(source.seafloorPressureGPa, source.pressureGPa));
  const bottomTempK = finiteOrNull(source.bottomOceanTempK);
  const bottomTempRangeK = normalizeBottomTempRangeK(source.bottomOceanTempRangeK);
  const liquidusPressureGPa = finiteOrNull(source.liquidusPressureGPa);
  const liquidusBoundaryPhase = firstString(source.liquidusBoundaryPhase);
  const classificationMode = firstString(
    source.highPressureIceClassificationMode,
    source.classificationMode,
  );
  const seafloorPhase = firstString(source.seafloorPhase);
  const highPressureIceRisk = source.highPressureIceRisk === true;
  const highPressureIceLikely = source.highPressureIceLikely === true;
  const highPressureIceStable = source.highPressureIceStable === true;
  const highPressureIcePhase = firstString(source.highPressureIcePhase);
  const rockOceanBarrier = firstString(source.rockOceanBarrier);
  const phaseDiagramConfidence = firstString(source.phaseDiagramConfidence);

  const lines = [];
  const pressureText = formatGPa(pressureGPa);
  if (pressureText) lines.push(`Seafloor pressure: ${pressureText} GPa`);

  if (bottomTempK != null) {
    const tempLine = `Estimated bottom temperature: ${fmt(bottomTempK, 0)} K`;
    lines.push(
      bottomTempRangeK
        ? `${tempLine} (range ${fmt(bottomTempRangeK[0], 0)}-${fmt(bottomTempRangeK[1], 0)} K)`
        : tempLine,
    );
  }

  const boundaryText = formatGPa(liquidusPressureGPa);
  if (boundaryText) {
    const phase = liquidusBoundaryPhase ? phaseLabel(liquidusBoundaryPhase) : "water liquidus";
    lines.push(`Liquidus boundary: ${phase} near ${boundaryText} GPa`);
  }

  const shouldExplain =
    pressureGPa != null ||
    bottomTempK != null ||
    liquidusPressureGPa != null ||
    classificationMode != null;
  const interpretation = shouldExplain
    ? interpretationForOceanPhase({
        classificationMode,
        pressureGPa,
        liquidusPressureGPa,
        seafloorPhase,
        highPressureIceRisk,
        highPressureIceLikely,
        highPressureIceStable,
        highPressureIcePhase,
        rockOceanBarrier,
        phaseDiagramConfidence,
      })
    : null;
  if (interpretation) lines.push(interpretation);

  if (!lines.length) return null;
  return {
    lines,
    text: lines.join("\n"),
    interpretation,
  };
}

export function formatHighPressureIceDisplay(hydrosphere = {}) {
  const classificationMode = firstString(hydrosphere.highPressureIceClassificationMode);
  const risk =
    hydrosphere.highPressureIceRisk === true || hydrosphere.highPressureIceBarrier === true;
  if (!risk) return "No";

  const thresholdKm = finiteOrNull(hydrosphere.highPressureIceThresholdKm);
  const thresholdText = thresholdKm != null ? ` (>${fmt(thresholdKm, 0)} km)` : "";

  if (classificationMode !== "phase-diagram") return `Pressure-only caution${thresholdText}`;

  if (hydrosphere.highPressureIceStable === true) {
    const phase = firstString(hydrosphere.highPressureIcePhase, hydrosphere.seafloorPhase);
    if (phase === "ice-vii") return `Ice VII stable${thresholdText}`;
    if (phase === "ice-vi") return `Ice VI stable${thresholdText}`;
  }

  switch (hydrosphere.rockOceanBarrier || hydrosphere.highPressureIceBand) {
    case "likely":
      return `Dense ice likely${thresholdText}`;
    case "plausible":
      return `Dense ice plausible${thresholdText}`;
    case "possible":
    case "caution":
      return `Dense ice possible${thresholdText}`;
    default:
      return `Dense ice caution${thresholdText}`;
  }
}
