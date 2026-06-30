import { clamp } from "../../engine/utils.js";

export function getClippedCometOrbitConfig(comet) {
  const aAu = Math.max(Number(comet?.semiMajorAxisAu) || 0, 0.05);
  const e = clamp(Number(comet?.eccentricity) || 0, 0, 0.9999);
  const perihelionAu = aAu * (1 - e);
  const aphelionAu = aAu * (1 + e);
  const clipRadiusAu = Math.max(Number(comet?.visualOrbitOuterAu) || perihelionAu, perihelionAu);
  let maxTrueAnomaly = Math.PI;
  if (e > 0.0001 && clipRadiusAu < aphelionAu) {
    const cosF = clamp(((aAu * (1 - e * e)) / clipRadiusAu - 1) / e, -1, 1);
    maxTrueAnomaly = Math.acos(cosF);
  }
  return {
    aAu,
    e,
    perihelionAu,
    aphelionAu,
    clipRadiusAu,
    maxTrueAnomaly,
  };
}

export function trueAnomalyToEccentricAnomaly(trueAnomalyRad, eccentricity) {
  const e = clamp(Number(eccentricity) || 0, 0, 0.9999);
  if (e <= 0.0001) return trueAnomalyRad;
  const sinF = Math.sin(trueAnomalyRad);
  const cosF = Math.cos(trueAnomalyRad);
  const denom = 1 + e * cosF;
  const sinE = (Math.sqrt(1 - e * e) * sinF) / Math.max(1e-9, denom);
  const cosE = (e + cosF) / Math.max(1e-9, denom);
  return Math.atan2(sinE, cosE);
}

export function eccentricAnomalyToTrueAnomaly(eccentricAnomalyRad, eccentricity) {
  const e = clamp(Number(eccentricity) || 0, 0, 0.9999);
  if (e <= 0.0001) return eccentricAnomalyRad;
  return (
    2 *
    Math.atan2(
      Math.sqrt(1 + e) * Math.sin(eccentricAnomalyRad * 0.5),
      Math.sqrt(1 - e) * Math.cos(eccentricAnomalyRad * 0.5),
    )
  );
}

export function mappedCometOrbitOffset({
  comet,
  eccentricAnomalyRad,
  argPeriapsisRad,
  inclinationRad,
  minAu,
  maxAu,
  maxR,
  mapAuToPx,
}) {
  const orbit = getClippedCometOrbitConfig(comet);
  const radiusAu =
    orbit.e > 0.0001 ? orbit.aAu * (1 - orbit.e * Math.cos(eccentricAnomalyRad)) : orbit.aAu;
  const radiusPx = mapAuToPx(radiusAu, minAu, maxAu, maxR);
  const trueAnomalyRad = eccentricAnomalyToTrueAnomaly(eccentricAnomalyRad, orbit.e);
  const cosW = Math.cos(argPeriapsisRad);
  const sinW = Math.sin(argPeriapsisRad);
  const cosI = Math.cos(inclinationRad);
  const sinI = Math.sin(inclinationRad);
  const xOrb = radiusPx * Math.cos(trueAnomalyRad);
  const zOrb = radiusPx * Math.sin(trueAnomalyRad);
  const xr = xOrb * cosW - zOrb * sinW;
  const zr = xOrb * sinW + zOrb * cosW;
  return {
    radiusAu,
    radiusPx,
    trueAnomalyRad,
    ox: xr,
    oy: zr * cosI,
    oyVert: zr * sinI,
  };
}

function getCometOrbitSamplingConfig(orbit, sampleCount) {
  const count = Math.max(48, Math.round(Number.isFinite(sampleCount) ? sampleCount : 960));
  const closed = orbit.maxTrueAnomaly >= Math.PI - 1e-6;
  const maxEccentricAnomaly = closed
    ? Math.PI * 2
    : Math.abs(trueAnomalyToEccentricAnomaly(orbit.maxTrueAnomaly, orbit.e));
  return {
    closed,
    count,
    maxEccentricAnomaly,
  };
}

function sampleEccentricAnomalyAtFraction(orbit, sampling, fraction) {
  if (sampling.closed) {
    return fraction * sampling.maxEccentricAnomaly;
  }
  return -sampling.maxEccentricAnomaly + fraction * (2 * sampling.maxEccentricAnomaly);
}

export function projectCometPointAtEccentricAnomaly({
  comet,
  eccentricAnomalyRad,
  argPeriapsisRad,
  inclinationRad,
  cx,
  cy,
  z,
  minAu,
  maxAu,
  maxR,
  mapAuToPx,
  orbitOffsetToScreen,
  screenToThree,
}) {
  const offset = mappedCometOrbitOffset({
    comet,
    eccentricAnomalyRad,
    argPeriapsisRad,
    inclinationRad,
    minAu,
    maxAu,
    maxR,
    mapAuToPx,
  });
  const projected = orbitOffsetToScreen(offset.ox, offset.oy, cx, cy, offset.oyVert);
  return screenToThree(projected.x, projected.y, z);
}

export function projectCometPointAtTrueAnomaly({
  comet,
  trueAnomalyRad,
  argPeriapsisRad,
  inclinationRad,
  cx,
  cy,
  z,
  minAu,
  maxAu,
  maxR,
  mapAuToPx,
  orbitOffsetToScreen,
  screenToThree,
}) {
  const orbit = getClippedCometOrbitConfig(comet);
  const eccentricAnomalyRad = trueAnomalyToEccentricAnomaly(trueAnomalyRad, orbit.e);
  return projectCometPointAtEccentricAnomaly({
    comet,
    eccentricAnomalyRad,
    argPeriapsisRad,
    inclinationRad,
    cx,
    cy,
    z,
    minAu,
    maxAu,
    maxR,
    mapAuToPx,
    orbitOffsetToScreen,
    screenToThree,
  });
}

export function buildProjectedCometOrbitPoints({
  comet,
  cx,
  cy,
  z = 0,
  minAu,
  maxAu,
  maxR,
  mapAuToPx,
  orbitOffsetToScreen,
  screenToThree,
  sampleCount,
}) {
  const orbit = getClippedCometOrbitConfig(comet);
  const sampling = getCometOrbitSamplingConfig(orbit, sampleCount);
  const argPeriapsisRad = ((Number(comet?.longitudeOfPeriapsisDeg) || 0) * Math.PI) / 180;
  const inclinationRad = ((Number(comet?.inclinationDeg) || 0) * Math.PI) / 180;
  const points = [];
  const pointCount = sampling.count + 1;

  for (let i = 0; i < pointCount; i += 1) {
    const fraction = i / sampling.count;
    const eccentricAnomalyRad = sampleEccentricAnomalyAtFraction(orbit, sampling, fraction);
    points.push(
      projectCometPointAtEccentricAnomaly({
        comet,
        eccentricAnomalyRad,
        argPeriapsisRad,
        inclinationRad,
        cx,
        cy,
        z,
        minAu,
        maxAu,
        maxR,
        mapAuToPx,
        orbitOffsetToScreen,
        screenToThree,
      }),
    );
  }

  return {
    ...orbit,
    closed: sampling.closed,
    sampleCount: sampling.count,
    points,
  };
}

export function buildProjectedCometOrbitDashRuns({
  comet,
  cx,
  cy,
  z = 0,
  minAu,
  maxAu,
  maxR,
  mapAuToPx,
  orbitOffsetToScreen,
  screenToThree,
  sampleCount,
  dashSteps = 14,
  gapSteps = 10,
  substepsPerSample = 6,
}) {
  const orbit = getClippedCometOrbitConfig(comet);
  const sampling = getCometOrbitSamplingConfig(orbit, sampleCount);
  const argPeriapsisRad = ((Number(comet?.longitudeOfPeriapsisDeg) || 0) * Math.PI) / 180;
  const inclinationRad = ((Number(comet?.inclinationDeg) || 0) * Math.PI) / 180;
  const cycle = Math.max(1, Math.round(dashSteps) + Math.round(gapSteps));
  const segmentSubsteps = Math.max(1, Math.round(Number(substepsPerSample) || 1));
  const pointRuns = [];
  let currentRun = [];

  for (let i = 0; i < sampling.count; i += 1) {
    const dashVisible = i % cycle < dashSteps;
    if (!dashVisible) {
      if (currentRun.length > 1) pointRuns.push(currentRun);
      currentRun = [];
      continue;
    }
    const eccentricAnomaly0 = sampleEccentricAnomalyAtFraction(orbit, sampling, i / sampling.count);
    const eccentricAnomaly1 = sampleEccentricAnomalyAtFraction(
      orbit,
      sampling,
      (i + 1) / sampling.count,
    );
    if (!currentRun.length) {
      currentRun.push(
        projectCometPointAtEccentricAnomaly({
          comet,
          eccentricAnomalyRad: eccentricAnomaly0,
          argPeriapsisRad,
          inclinationRad,
          cx,
          cy,
          z,
          minAu,
          maxAu,
          maxR,
          mapAuToPx,
          orbitOffsetToScreen,
          screenToThree,
        }),
      );
    }
    for (let substep = 1; substep <= segmentSubsteps; substep += 1) {
      const t = substep / segmentSubsteps;
      currentRun.push(
        projectCometPointAtEccentricAnomaly({
          comet,
          eccentricAnomalyRad: eccentricAnomaly0 + (eccentricAnomaly1 - eccentricAnomaly0) * t,
          argPeriapsisRad,
          inclinationRad,
          cx,
          cy,
          z,
          minAu,
          maxAu,
          maxR,
          mapAuToPx,
          orbitOffsetToScreen,
          screenToThree,
        }),
      );
    }
  }
  if (currentRun.length > 1) pointRuns.push(currentRun);

  return {
    ...orbit,
    closed: sampling.closed,
    sampleCount: sampling.count,
    dashSteps,
    gapSteps,
    pointRuns,
  };
}
