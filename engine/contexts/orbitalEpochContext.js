import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "orbital-epoch-context-v1";
const SOURCE_KEYS = ["orbitalEpoch"];

function degToRad(deg) {
  return (Number(deg) || 0) * (Math.PI / 180);
}

function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

function normalizeDeg(deg) {
  const value = Number(deg) || 0;
  return ((value % 360) + 360) % 360;
}

function angleFromCos(value) {
  return radToDeg(Math.acos(clamp(value, -1, 1)));
}

export function estimateKeplerianPhase({
  epochDay = 0,
  periodDays = 365.25,
  eccentricity = 0,
  phaseOffsetDeg = 0,
} = {}) {
  const period = Math.max(0.0001, toFinite(periodDays, 365.25));
  const e = clamp(toFinite(eccentricity, 0), 0, 0.95);
  const meanAnomalyDeg = normalizeDeg(
    (toFinite(epochDay, 0) / period) * 360 + toFinite(phaseOffsetDeg, 0),
  );
  const meanAnomalyRad = degToRad(meanAnomalyDeg);
  const trueAnomalyRad = meanAnomalyRad + 2 * e * Math.sin(meanAnomalyRad);
  return {
    meanAnomalyDeg: round(meanAnomalyDeg, 3),
    approxTrueAnomalyDeg: round(normalizeDeg(radToDeg(trueAnomalyRad)), 3),
  };
}

function distanceAtPhase(orbitAu, eccentricity, trueAnomalyDeg) {
  const a = Math.max(0.000001, toFinite(orbitAu, 1));
  const e = clamp(toFinite(eccentricity, 0), 0, 0.95);
  const nu = degToRad(trueAnomalyDeg);
  return (a * (1 - e * e)) / Math.max(0.000001, 1 + e * Math.cos(nu));
}

function geometryFromHome({ bodyOrbitAu, homeOrbitAu, bodyPhaseDeg, homePhaseDeg }) {
  const bodyR = Math.max(0.000001, toFinite(bodyOrbitAu, 1));
  const homeR = Math.max(0.000001, toFinite(homeOrbitAu, 1));
  const delta = degToRad(bodyPhaseDeg - homePhaseDeg);
  const distanceAu = Math.sqrt(bodyR * bodyR + homeR * homeR - 2 * bodyR * homeR * Math.cos(delta));
  const phaseCos =
    (bodyR * bodyR + distanceAu * distanceAu - homeR * homeR) / (2 * bodyR * distanceAu);
  const elongationCos =
    (homeR * homeR + distanceAu * distanceAu - bodyR * bodyR) / (2 * homeR * distanceAu);
  const phaseAngleDeg = angleFromCos(phaseCos);
  const elongationDeg = angleFromCos(elongationCos);
  return {
    currentDistanceAu: round(distanceAu, 6),
    phaseAngleDeg: round(phaseAngleDeg, 3),
    elongationDeg: round(elongationDeg, 3),
    illuminationFraction: round((1 + Math.cos(degToRad(phaseAngleDeg))) / 2, 3),
  };
}

function moonPhase({ epochDay, synodicDays, phaseOffsetDeg = 0 }) {
  const synodic = Math.max(0.0001, toFinite(synodicDays, 29.5306));
  const phaseAngleDeg = normalizeDeg(
    (toFinite(epochDay, 0) / synodic) * 360 + toFinite(phaseOffsetDeg, 0),
  );
  const illuminationFraction = (1 - Math.cos(degToRad(phaseAngleDeg))) / 2;
  const label =
    phaseAngleDeg < 22.5 || phaseAngleDeg >= 337.5
      ? "new"
      : phaseAngleDeg < 157.5
        ? "waxing"
        : phaseAngleDeg < 202.5
          ? "full"
          : "waning";
  return {
    phaseAngleDeg: round(phaseAngleDeg, 3),
    illuminationFraction: round(illuminationFraction, 3),
    newFullQuarterLabel: label,
  };
}

export function buildOrbitalEpochContext({
  epochDay = 0,
  homeBody = null,
  bodies = [],
  moons = [],
  manualDistanceByBodyId = {},
  manualMoonPhaseDeg = null,
} = {}) {
  const assumptions = [
    "Keplerian two-body geometry is used; nodal longitude and precession are not solved.",
  ];
  const limitingFactors = [];
  const homeOrbitAu = Math.max(0.000001, toFinite(homeBody?.orbitAu, 1));
  const homePeriodDays = Math.max(0.0001, toFinite(homeBody?.orbitalPeriodDays, 365.25));
  const homeE = clamp(toFinite(homeBody?.eccentricity, 0), 0, 0.95);
  const homePhase = estimateKeplerianPhase({
    epochDay,
    periodDays: homePeriodDays,
    eccentricity: homeE,
    phaseOffsetDeg: homeBody?.phaseOffsetDeg,
  });
  const homeDistanceAu = distanceAtPhase(homeOrbitAu, homeE, homePhase.approxTrueAnomalyDeg);
  const bodyOutputs = {};

  for (const body of bodies || []) {
    const id = String(body?.id || "");
    if (!id) continue;
    const orbitAu = Math.max(0.000001, toFinite(body?.orbitAu, NaN));
    if (!Number.isFinite(orbitAu)) continue;
    const periodDays = Math.max(
      0.0001,
      toFinite(
        body?.orbitalPeriodDays,
        Math.sqrt(orbitAu ** 3 / Math.max(0.0001, toFinite(body?.hostMassMsol, 1))) * 365.25,
      ),
    );
    const eccentricity = clamp(toFinite(body?.eccentricity, 0), 0, 0.95);
    const phase = estimateKeplerianPhase({
      epochDay,
      periodDays,
      eccentricity,
      phaseOffsetDeg: body?.phaseOffsetDeg,
    });
    const radialAu = distanceAtPhase(orbitAu, eccentricity, phase.approxTrueAnomalyDeg);
    const geometry = geometryFromHome({
      bodyOrbitAu: radialAu,
      homeOrbitAu: homeDistanceAu,
      bodyPhaseDeg: phase.approxTrueAnomalyDeg,
      homePhaseDeg: homePhase.approxTrueAnomalyDeg,
    });
    const manualDistance = Number(manualDistanceByBodyId?.[id]);
    const inclinationDeg = Math.abs(toFinite(body?.inclinationDeg, 0));
    bodyOutputs[id] = {
      ...phase,
      ...geometry,
      currentDistanceAu: Number.isFinite(manualDistance)
        ? round(manualDistance, 6)
        : geometry.currentDistanceAu,
      manualDistanceOverride: Number.isFinite(manualDistance),
      transitPossible: inclinationDeg <= 2 || inclinationDeg >= 178,
      eclipsePossible: inclinationDeg <= 2 || inclinationDeg >= 178,
      geometryConfidence:
        eccentricity > 0.35 || inclinationDeg > 10 ? CONFIDENCE.LOW : CONFIDENCE.MEDIUM,
      assumptions:
        inclinationDeg > 2
          ? ["Inclination reduces transit/eclipse likelihood without node data."]
          : [],
    };
  }

  const moonOutputs = {};
  for (const moon of moons || []) {
    const id = String(moon?.id || moon?.name || "");
    if (!id) continue;
    const synodicDays = Math.max(
      0.0001,
      toFinite(moon?.synodicDays, moon?.orbitalPeriodDays || 29.5306),
    );
    const manual = Number(manualMoonPhaseDeg);
    const phase = Number.isFinite(manual)
      ? {
          phaseAngleDeg: clamp(manual, 0, 180),
          illuminationFraction: round((1 - Math.cos(degToRad(clamp(manual, 0, 180)))) / 2, 3),
          newFullQuarterLabel: manual < 22.5 ? "new" : manual > 157.5 ? "full" : "manual",
        }
      : moonPhase({ epochDay, synodicDays, phaseOffsetDeg: moon?.phaseOffsetDeg });
    const inclinationDeg = Math.abs(toFinite(moon?.inclinationDeg, 5.145));
    const nodeKnown = Number.isFinite(Number(moon?.longitudeOfNodeDeg));
    const nearNode = nodeKnown
      ? Math.abs(((phase.phaseAngleDeg - Number(moon.longitudeOfNodeDeg) + 540) % 360) - 180) < 18
      : false;
    const seasonLikelihood =
      inclinationDeg <= 1.5
        ? "frequent"
        : nodeKnown && nearNode
          ? "possible"
          : "low-confidence-window";
    moonOutputs[id] = {
      synodicPeriodDays: round(synodicDays, 6),
      ...phase,
      eclipseSeasonLikelihood: seasonLikelihood,
      solarEclipseWindow:
        phase.newFullQuarterLabel === "new" && (inclinationDeg <= 1.5 || nodeKnown)
          ? seasonLikelihood
          : "unlikely",
      lunarEclipseWindow:
        phase.newFullQuarterLabel === "full" && (inclinationDeg <= 1.5 || nodeKnown)
          ? seasonLikelihood
          : "unlikely",
      durationClass: inclinationDeg <= 1.5 ? "geometry-favorable" : "geometry-limited",
      missingNodeCaveat: !nodeKnown,
      manualPhaseOverride: Number.isFinite(manual),
    };
    if (!nodeKnown)
      limitingFactors.push(`${id}: moon node is unknown, so eclipse windows are approximate`);
  }

  return makeContext({
    modelVersion: MODEL_VERSION,
    status: CONTEXT_STATUS.SUPPORTED,
    confidence: limitingFactors.length ? CONFIDENCE.LOW : CONFIDENCE.MEDIUM,
    inputs: {
      epochDay: roundMaybe(epochDay, 3),
      homeOrbitAu: roundMaybe(homeOrbitAu, 6),
      homePeriodDays: roundMaybe(homePeriodDays, 6),
    },
    outputs: {
      home: {
        ...homePhase,
        radialDistanceAu: round(homeDistanceAu, 6),
      },
      bodies: bodyOutputs,
      moons: moonOutputs,
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
