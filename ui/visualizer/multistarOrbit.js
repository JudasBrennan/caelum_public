import { clamp } from "../../engine/utils.js";

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toRadians(deg) {
  return (toFiniteNumber(deg, 0) * Math.PI) / 180;
}

export function estimateBinaryPairPeriodDays(pair, hostStars = []) {
  const semiMajorAxisAu = toFiniteNumber(pair?.semiMajorAxisAu, 0);
  const totalMassMsol = (Array.isArray(hostStars) ? hostStars : []).reduce(
    (sum, entry) => sum + Math.max(0, toFiniteNumber(entry?.massMsol, 0)),
    0,
  );
  if (!(semiMajorAxisAu > 0) || !(totalMassMsol > 0)) return null;
  return Math.sqrt(semiMajorAxisAu ** 3 / totalMassMsol) * 365.256;
}

export function findBestBinaryPairStartTimeDays({
  periodDays = 0,
  sampleCount = 180,
  buildPositionsAtTime = null,
} = {}) {
  if (!(Number(periodDays) > 0) || typeof buildPositionsAtTime !== "function") return 0;
  const samples = Math.max(12, Math.round(toFiniteNumber(sampleCount, 180)));
  let bestTimeDays = 0;
  let bestSpread = -Infinity;
  let bestMeanYAbs = Infinity;

  for (let index = 0; index < samples; index += 1) {
    const timeDays = (Number(periodDays) * index) / samples;
    const positions = buildPositionsAtTime(timeDays);
    if (!Array.isArray(positions) || positions.length < 2) continue;
    const xs = positions.map((entry) => toFiniteNumber(entry?.x, 0));
    const ys = positions.map((entry) => toFiniteNumber(entry?.y, 0));
    const spread = Math.max(...xs) - Math.min(...xs);
    const meanYAbs = Math.abs(ys.reduce((sum, value) => sum + value, 0) / ys.length);

    if (
      spread > bestSpread + 1e-6 ||
      (Math.abs(spread - bestSpread) <= 1e-6 && meanYAbs < bestMeanYAbs)
    ) {
      bestTimeDays = timeDays;
      bestSpread = spread;
      bestMeanYAbs = meanYAbs;
    }
  }

  return bestTimeDays;
}

export function computeBinaryPairOrbitalState({
  hostStars = [],
  pair = null,
  simTime = 0,
  cx = 0,
  cy = 0,
  minAu = 0.1,
  maxAu = 1,
  maxR = 100,
  logScale = false,
  mapAuToPx,
  orbitOffsetToScreen,
  solveKeplerEquation,
} = {}) {
  if (
    !Array.isArray(hostStars) ||
    hostStars.length !== 2 ||
    typeof mapAuToPx !== "function" ||
    typeof orbitOffsetToScreen !== "function" ||
    typeof solveKeplerEquation !== "function"
  ) {
    return null;
  }

  const semiMajorAxisAu = toFiniteNumber(pair?.semiMajorAxisAu, 0);
  const eccentricity = clamp(toFiniteNumber(pair?.eccentricity, 0), 0, 0.99);
  const inclinationDeg = toFiniteNumber(pair?.inclinationDeg, 0);
  const argPeriapsisDeg = toFiniteNumber(pair?.argPeriapsisDeg, 0);
  const meanAnomalyDeg = toFiniteNumber(pair?.meanAnomalyDeg, 0);
  const periodDays = estimateBinaryPairPeriodDays(pair, hostStars);
  const meanMotion =
    Number.isFinite(periodDays) && periodDays > 0
      ? (2 * Math.PI) / periodDays
      : semiMajorAxisAu > 0
        ? (2 * Math.PI) / (40 * Math.pow(semiMajorAxisAu, 1.35))
        : 0;
  const meanAnomalyRad = toRadians(meanAnomalyDeg) + meanMotion * toFiniteNumber(simTime, 0);
  const eccentricAnomaly = solveKeplerEquation(meanAnomalyRad, eccentricity);
  const cosI = Math.cos(toRadians(inclinationDeg));
  const sinI = Math.sin(toRadians(inclinationDeg));

  const starNodes = hostStars.map((entry, index) => {
    const barycentricOrbitAu = Math.max(0, toFiniteNumber(entry?.barycentricOrbitAu, 0));
    const semiMajorPx = mapAuToPx(barycentricOrbitAu, minAu, maxAu, maxR, {
      logScale,
    });
    const semiMinorPx = semiMajorPx * Math.sqrt(1 - eccentricity * eccentricity);
    const focalOffsetPx = semiMajorPx * eccentricity;
    const xFocus = semiMajorPx * Math.cos(eccentricAnomaly) - focalOffsetPx;
    const zFocus = semiMinorPx * Math.sin(eccentricAnomaly);
    const orbitArgPeriapsisDeg = argPeriapsisDeg + (index === 0 ? 180 : 0);
    const omega = toRadians(orbitArgPeriapsisDeg);
    const cosW = Math.cos(omega);
    const sinW = Math.sin(omega);
    const orbitX = xFocus * cosW - zFocus * sinW;
    const orbitZ = xFocus * sinW + zFocus * cosW;
    const orbitalY = orbitZ * sinI;
    const orbitalZ = orbitZ * cosI;
    const projected = orbitOffsetToScreen(orbitX, orbitalZ, cx, cy, orbitalY);

    return {
      ...entry,
      screenX: projected.x,
      screenY: projected.y,
      depth: projected.depth,
      orbitalX: orbitX,
      orbitalY,
      orbitalZ,
      orbitSemiMajorPx: semiMajorPx,
      orbitEccentricity: eccentricity,
      orbitInclinationDeg: inclinationDeg,
      orbitArgPeriapsisDeg,
    };
  });

  return {
    periodDays,
    meanAnomalyRad,
    eccentricity,
    inclinationDeg,
    starNodes,
  };
}
