import { fmt, toFinite } from "./utils.js";

const EARTH_MASS_PER_SOLAR_MASS = 332946.0487;
const MASS_EARTH_TO_SOLAR = 1 / EARTH_MASS_PER_SOLAR_MASS;

export const ORBITAL_ARCHITECTURE_SCIENCE_NOTES = Object.freeze({
  mutualHillSpacing: {
    formulaName: "Adjacent-pair mutual Hill separation",
    sourceSummary:
      "R_H,m = ((m1 + m2) / (3 M_host))^(1/3) * (a1 + a2) / 2; adjacent separations below 2*sqrt(3) mutual Hill radii are treated as a conservative two-planet instability boundary.",
    assumptions:
      "Best used for near-coplanar, low-to-moderate eccentricity two-body adjacent spacing diagnostics. It is not an N-body integration or secular stability proof.",
    inputUnits: "hostMassMsol in solar masses; body masses in Earth masses; semi-major axes in AU",
    outputUnits: "mutual Hill radius in AU; separation in mutual Hill radii",
    outputKind: "semiQuantitative",
  },
  eccentricityOverlap: {
    formulaName: "Apoapsis/periapsis crossing guard",
    sourceSummary:
      "Flags adjacent orbit crossing when inner apoapsis reaches or exceeds outer periapsis.",
    assumptions:
      "Uses osculating-style semi-major axis and eccentricity inputs only; no apsidal phase, inclination, or secular cycle modeling.",
    inputUnits: "semi-major axes in AU; eccentricity unitless",
    outputUnits: "boolean warning",
    outputKind: "qualitative",
  },
});

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function normalizeBody(body, hostFrameId) {
  const semiMajorAxisAu = toFinite(body?.semiMajorAxisAu ?? body?.au, NaN);
  const massEarth = toFinite(body?.massEarth, NaN);
  const eccentricity = Math.max(0, toFinite(body?.eccentricity, 0));
  return {
    id: String(body?.id ?? ""),
    name: String(body?.name || body?.id || "Unnamed body"),
    kind: String(body?.kind || "other"),
    semiMajorAxisAu,
    massEarth,
    eccentricity,
    hostFrameId: normalizeHostFrameId(body?.hostFrameId, hostFrameId),
  };
}

function unknownResult({ hostFrameId, bodyCount, note }) {
  return {
    modelVersion: "orbital-architecture-v1",
    hostFrameId,
    bodyCount,
    scienceNotes: ORBITAL_ARCHITECTURE_SCIENCE_NOTES,
    summary: {
      state: "unknown",
      minSeparationMutualHill: null,
      limitingPairIds: [],
      confidence: "unknown",
      note,
    },
    pairs: [],
  };
}

function stateRank(state) {
  return (
    {
      unknown: 0,
      stable: 1,
      packed: 2,
      crowded: 3,
      unstable: 4,
    }[state] ?? 0
  );
}

function classifySpacing(separationMutualHill) {
  if (!Number.isFinite(separationMutualHill)) return "unknown";
  if (separationMutualHill < 2 * Math.sqrt(3)) return "unstable";
  if (separationMutualHill < 6) return "crowded";
  if (separationMutualHill < 10) return "packed";
  return "stable";
}

function confidenceForPair({ state, inner, outer, eccentricityOverlapRisk }) {
  if (state === "unknown") return "unknown";
  const maxEccentricity = Math.max(inner.eccentricity, outer.eccentricity);
  if (eccentricityOverlapRisk) return "low";
  if (maxEccentricity >= 0.3) return "low";
  if (maxEccentricity >= 0.12) return "medium";
  return "high";
}

function noteForPair({ inner, outer, separationMutualHill, state, eccentricityOverlapRisk }) {
  if (state === "unknown") {
    return `${inner.name} and ${outer.name} are missing mass or orbit data, so spacing is unknown.`;
  }
  if (eccentricityOverlapRisk) {
    return `${inner.name} reaches or crosses ${outer.name}'s periapsis in this simplified orbit-crossing check.`;
  }
  const separationText = fmt(separationMutualHill, 2);
  if (state === "unstable") {
    return `${inner.name} and ${outer.name} are only ${separationText} mutual Hill radii apart, below the conservative two-body stability boundary.`;
  }
  if (state === "crowded") {
    return `${inner.name} and ${outer.name} are only ${separationText} mutual Hill radii apart; this is crowded for long-term stability.`;
  }
  if (state === "packed") {
    return `${inner.name} and ${outer.name} are ${separationText} mutual Hill radii apart; the pair is packed but not inside the conservative instability boundary.`;
  }
  return `${inner.name} and ${outer.name} are ${separationText} mutual Hill radii apart in this adjacent-pair diagnostic.`;
}

function buildPair(inner, outer, hostMassMsol) {
  const deltaAu = outer.semiMajorAxisAu - inner.semiMajorAxisAu;
  const massSolar = (inner.massEarth + outer.massEarth) * MASS_EARTH_TO_SOLAR;
  const averageAxisAu = (inner.semiMajorAxisAu + outer.semiMajorAxisAu) / 2;
  const mutualHillAu =
    hostMassMsol > 0 && massSolar > 0 && averageAxisAu > 0
      ? (massSolar / (3 * hostMassMsol)) ** (1 / 3) * averageAxisAu
      : NaN;
  const separationMutualHill = mutualHillAu > 0 ? deltaAu / mutualHillAu : NaN;
  const innerApoapsisAu = inner.semiMajorAxisAu * (1 + inner.eccentricity);
  const outerPeriapsisAu = outer.semiMajorAxisAu * (1 - outer.eccentricity);
  const eccentricityOverlapRisk = innerApoapsisAu >= outerPeriapsisAu;
  const state = classifySpacing(separationMutualHill);
  const confidence = confidenceForPair({ state, inner, outer, eccentricityOverlapRisk });

  return {
    innerId: inner.id,
    outerId: outer.id,
    innerName: inner.name,
    outerName: outer.name,
    deltaAu,
    mutualHillAu: Number.isFinite(mutualHillAu) ? mutualHillAu : null,
    separationMutualHill: Number.isFinite(separationMutualHill) ? separationMutualHill : null,
    eccentricityOverlapRisk,
    state,
    confidence,
    note: noteForPair({
      inner,
      outer,
      separationMutualHill,
      state,
      eccentricityOverlapRisk,
    }),
  };
}

export function analyseOrbitalArchitecture({ hostMassMsol, hostFrameId = null, bodies } = {}) {
  const normalizedHostFrameId = normalizeHostFrameId(hostFrameId);
  const allBodies = Array.isArray(bodies) ? bodies : [];
  const normalizedBodies = allBodies
    .map((body) => normalizeBody(body, normalizedHostFrameId))
    .filter(
      (body) =>
        body.id &&
        normalizeHostFrameId(body.hostFrameId, normalizedHostFrameId) === normalizedHostFrameId,
    );
  const bodyCount = normalizedBodies.length;
  const hostMass = toFinite(hostMassMsol, NaN);

  if (bodyCount < 2) {
    return unknownResult({
      hostFrameId: normalizedHostFrameId,
      bodyCount,
      note: "At least two orbiting bodies in the selected host frame are needed for spacing diagnostics.",
    });
  }
  if (!(Number.isFinite(hostMass) && hostMass > 0)) {
    return unknownResult({
      hostFrameId: normalizedHostFrameId,
      bodyCount,
      note: "Host mass is missing, so mutual Hill spacing cannot be computed.",
    });
  }

  const validBodies = normalizedBodies
    .filter(
      (body) =>
        Number.isFinite(body.semiMajorAxisAu) &&
        body.semiMajorAxisAu > 0 &&
        Number.isFinite(body.massEarth) &&
        body.massEarth > 0,
    )
    .sort((left, right) => left.semiMajorAxisAu - right.semiMajorAxisAu);

  if (validBodies.length < 2) {
    return unknownResult({
      hostFrameId: normalizedHostFrameId,
      bodyCount,
      note: "Body masses or orbital distances are missing, so spacing is unknown.",
    });
  }

  const pairs = [];
  for (let index = 0; index + 1 < validBodies.length; index += 1) {
    pairs.push(buildPair(validBodies[index], validBodies[index + 1], hostMass));
  }

  const limitingPair = pairs.reduce((worst, pair) => {
    const stateDelta = stateRank(pair.state) - stateRank(worst.state);
    if (stateDelta > 0) return pair;
    if (stateDelta < 0) return worst;
    const pairSep = pair.separationMutualHill ?? Number.POSITIVE_INFINITY;
    const worstSep = worst.separationMutualHill ?? Number.POSITIVE_INFINITY;
    return pairSep < worstSep ? pair : worst;
  }, pairs[0]);

  const lowConfidence = pairs.some((pair) => pair.confidence === "low");
  const mediumConfidence = pairs.some((pair) => pair.confidence === "medium");

  return {
    modelVersion: "orbital-architecture-v1",
    hostFrameId: normalizedHostFrameId,
    bodyCount,
    scienceNotes: ORBITAL_ARCHITECTURE_SCIENCE_NOTES,
    summary: {
      state: limitingPair.state,
      minSeparationMutualHill: limitingPair.separationMutualHill,
      limitingPairIds: [limitingPair.innerId, limitingPair.outerId],
      confidence: lowConfidence ? "low" : mediumConfidence ? "medium" : limitingPair.confidence,
      note: limitingPair.note,
    },
    pairs,
  };
}
