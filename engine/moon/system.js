import { calcMoonExact } from "../moon.js";
import { clamp, toFinite } from "../utils.js";
import { normalizeMoonInputs } from "./config.js";

const EARTH_MASS_KG = 5.9722e24;
const EARTH_RADIUS_KM = 6371;
const LUNAR_MASS_IN_EARTH = 0.0123000371;
const G = 6.6743e-11;
const RESONANCE_CANDIDATES = [
  { numerator: 2, denominator: 1 },
  { numerator: 3, denominator: 2 },
  { numerator: 5, denominator: 3 },
  { numerator: 4, denominator: 3 },
  { numerator: 5, denominator: 2 },
  { numerator: 3, denominator: 1 },
];

function normalizeDetailLevel(detailLevel) {
  return detailLevel === "summary" ? "summary" : "full";
}

function orbitalPeriodSiderealDays(parentMassEarth, semiMajorAxisKm) {
  const planetMassKg = Math.max(toFinite(parentMassEarth, 0), 0) * EARTH_MASS_KG;
  const semiMajorAxisM = Math.max(toFinite(semiMajorAxisKm, 0), 0) * 1000;
  if (planetMassKg <= 0 || semiMajorAxisM <= 0) return Infinity;
  const periodSeconds = 2 * Math.PI * Math.sqrt(semiMajorAxisM ** 3 / (G * planetMassKg));
  return periodSeconds / 86400;
}

function findNearestResonance(periodRatio) {
  if (!Number.isFinite(periodRatio) || periodRatio <= 0) return null;
  let best = null;
  for (const candidate of RESONANCE_CANDIDATES) {
    const targetRatio = candidate.numerator / candidate.denominator;
    const offsetPct = (Math.abs(periodRatio - targetRatio) / targetRatio) * 100;
    if (!best || offsetPct < best.offsetPct) {
      best = {
        label: `${candidate.numerator}:${candidate.denominator}`,
        targetRatio,
        offsetPct,
      };
    }
  }
  return best;
}

function fallbackHabitableZone(starLuminosityLsol) {
  const rootLuminosity = Math.sqrt(Math.max(toFinite(starLuminosityLsol, 1), 0.01));
  return {
    inner: 0.95 * rootLuminosity,
    outer: 1.67 * rootLuminosity,
  };
}

function buildTidalHabitableZone({ parentKind, parentOverride, starHabitableZoneAu }) {
  const parentRadiusKm =
    Math.max(toFinite(parentOverride?.derived?.radiusEarth, 0), 0.01) * EARTH_RADIUS_KM;
  const parentOrbitAu = Math.max(toFinite(parentOverride?.inputs?.semiMajorAxisAu, 0), 0.001);
  const hz = starHabitableZoneAu || fallbackHabitableZone();
  const starHzEligible = parentOrbitAu >= hz.inner && parentOrbitAu <= hz.outer;
  const baseInnerRp = parentKind === "gasGiant" ? 6 : 4;
  const baseOuterRp = parentKind === "gasGiant" ? 45 : 18;
  return {
    starHzEligible,
    innerKm: parentRadiusKm * baseInnerRp,
    outerKm: parentRadiusKm * baseOuterRp,
    notes: starHzEligible
      ? ["parent-in-stellar-habitable-zone"]
      : ["parent-outside-stellar-habitable-zone"],
  };
}

function classifyFormation({ parentKind, moonInputs, parentOverride, nearestResonance }) {
  const inclination = Math.max(toFinite(moonInputs?.inclinationDeg, 0), 0);
  const semiMajorAxisKm = Math.max(toFinite(moonInputs?.semiMajorAxisKm, 0), 0);
  const parentRadiusKm =
    Math.max(toFinite(parentOverride?.derived?.radiusEarth, 0), 0.01) * EARTH_RADIUS_KM;
  const semiMajorAxisRp = parentRadiusKm > 0 ? semiMajorAxisKm / parentRadiusKm : Infinity;
  const moonMassEarth = Math.max(toFinite(moonInputs?.massMoon, 0), 0) * LUNAR_MASS_IN_EARTH;
  const parentMassEarth = Math.max(toFinite(parentOverride?.inputs?.massEarth, 0), 0.001);
  const massRatio = moonMassEarth / parentMassEarth;

  if (inclination > 90 || semiMajorAxisRp > 65 || inclination > 35) {
    return {
      scenarioLabel: "Captured irregular",
      confidence: 0.82,
      rationale:
        "Large inclination, retrograde geometry, or a very distant orbit favors capture over in-situ formation.",
    };
  }
  if (parentKind === "planet" && massRatio >= 0.006) {
    return {
      scenarioLabel: "Impact-formed major moon",
      confidence: 0.74,
      rationale:
        "A relatively massive moon close to a rocky planet is most consistent with debris-disk / giant-impact formation.",
    };
  }
  if (parentKind === "gasGiant" && semiMajorAxisRp <= 30 && inclination <= 10) {
    return {
      scenarioLabel:
        nearestResonance?.offsetPct <= 2.5 ? "Resonant regular moon" : "Co-accreted regular moon",
      confidence: nearestResonance?.offsetPct <= 2.5 ? 0.78 : 0.7,
      rationale:
        nearestResonance?.offsetPct <= 2.5
          ? "A low-inclination regular moon in a near resonance fits migration and resonance locking in a circumplanetary disk."
          : "A close, prograde, low-inclination moon around a giant planet is consistent with formation in a circumplanetary disk.",
    };
  }
  return {
    scenarioLabel: "Disk-accreted moon",
    confidence: 0.55,
    rationale:
      "The orbit is regular enough to fit in-system accretion, but the formation pathway is not strongly constrained.",
  };
}

function buildManualResonanceState(entries) {
  const byId = new Map();
  const grouped = new Map();
  for (const entry of entries) {
    const groupId = entry.inputs.manualResonanceGroupId;
    if (!groupId) continue;
    if (!grouped.has(groupId)) grouped.set(groupId, []);
    grouped.get(groupId).push(entry);
  }
  for (const [groupId, groupEntries] of grouped.entries()) {
    groupEntries.sort(
      (left, right) =>
        (left.inputs.manualResonanceOrder ?? Number.POSITIVE_INFINITY) -
          (right.inputs.manualResonanceOrder ?? Number.POSITIVE_INFINITY) ||
        left.inputs.semiMajorAxisKm - right.inputs.semiMajorAxisKm,
    );
    for (let index = 0; index < groupEntries.length; index += 1) {
      const entry = groupEntries[index];
      const prev = index > 0 ? groupEntries[index - 1] : null;
      byId.set(entry.id, {
        nearestResonance: prev
          ? {
              label: `${entry.inputs.manualResonanceRatio || 2}:1`,
              offsetPct: 0,
            }
          : null,
        chainMembership: groupId,
        laplaceChainId: groupEntries.length >= 3 ? groupId : null,
        forcedEccentricity:
          entry.inputs.forcedEccentricity != null
            ? Math.max(0, entry.inputs.forcedEccentricity)
            : 0,
        forcedEccentricitySource:
          entry.inputs.forcedEccentricity != null ? "manual" : prev ? "manual-resonance" : "none",
        sustainedHeatingLikely:
          (entry.inputs.forcedEccentricity ?? 0) >= 0.003 || groupEntries.length >= 3,
      });
    }
  }
  return byId;
}

function analyseSystemCoupling({ moonEntries, parentKind, parentOverride, starHabitableZoneAu }) {
  const entries = moonEntries
    .map((entry) => ({ ...entry, inputs: normalizeMoonInputs(entry.inputs || entry) }))
    .sort((left, right) => left.inputs.semiMajorAxisKm - right.inputs.semiMajorAxisKm);
  const parentMassEarth = Math.max(toFinite(parentOverride?.inputs?.massEarth, 0), 0.001);
  const states = new Map();
  const manualStates = buildManualResonanceState(entries);
  const tidalHabitableZone = buildTidalHabitableZone({
    parentKind,
    parentOverride,
    starHabitableZoneAu,
  });

  for (const entry of entries) {
    if (manualStates.has(entry.id)) {
      const manualState = manualStates.get(entry.id);
      states.set(entry.id, {
        ...manualState,
        tidalHabitableZone,
      });
    }
  }

  for (let index = 0; index < entries.length; index += 1) {
    const current = entries[index];
    if (states.has(current.id)) continue;

    const inner = index > 0 ? entries[index - 1] : null;
    const outer = index + 1 < entries.length ? entries[index + 1] : null;
    const currentPeriod = orbitalPeriodSiderealDays(
      parentMassEarth,
      current.inputs.semiMajorAxisKm,
    );
    const comparisons = [];
    if (inner) {
      comparisons.push({
        partnerId: inner.id,
        partnerName: inner.inputs.name || inner.id,
        ratio:
          currentPeriod / orbitalPeriodSiderealDays(parentMassEarth, inner.inputs.semiMajorAxisKm),
      });
    }
    if (outer) {
      comparisons.push({
        partnerId: outer.id,
        partnerName: outer.inputs.name || outer.id,
        ratio:
          orbitalPeriodSiderealDays(parentMassEarth, outer.inputs.semiMajorAxisKm) / currentPeriod,
      });
    }

    const nearest = comparisons
      .map((comparison) => ({
        ...comparison,
        resonance: findNearestResonance(comparison.ratio),
      }))
      .filter((comparison) => comparison.resonance)
      .sort((left, right) => left.resonance.offsetPct - right.resonance.offsetPct)[0];

    const hasResonance = nearest && nearest.resonance.offsetPct <= 2.5;
    const forcedFloor = hasResonance
      ? clamp(0.0015 + (2.5 - nearest.resonance.offsetPct) * 0.0012, 0, 0.007)
      : 0;
    states.set(current.id, {
      nearestResonance: hasResonance
        ? {
            label: nearest.resonance.label,
            offsetPct: nearest.resonance.offsetPct,
            withMoonId: nearest.partnerId,
            withMoonName: nearest.partnerName,
          }
        : null,
      chainMembership: null,
      laplaceChainId: null,
      forcedEccentricity:
        current.inputs.forcedEccentricity != null
          ? Math.max(current.inputs.forcedEccentricity, forcedFloor)
          : forcedFloor,
      forcedEccentricitySource:
        current.inputs.forcedEccentricity != null
          ? "manual"
          : hasResonance
            ? "resonant-floor"
            : "none",
      sustainedHeatingLikely: forcedFloor >= 0.003,
      tidalHabitableZone,
    });
  }

  for (let index = 0; index + 2 < entries.length; index += 1) {
    const first = states.get(entries[index].id);
    const second = states.get(entries[index + 1].id);
    const third = states.get(entries[index + 2].id);
    const firstNearTwoToOne = first?.nearestResonance?.label === "2:1";
    const secondNearTwoToOne = second?.nearestResonance?.label === "2:1";
    if (!firstNearTwoToOne || !secondNearTwoToOne) continue;
    const chainId = `laplace:${entries[index].id}:${entries[index + 1].id}:${entries[index + 2].id}`;
    for (const entry of [entries[index], entries[index + 1], entries[index + 2]]) {
      const state = states.get(entry.id);
      state.chainMembership = chainId;
      state.laplaceChainId = chainId;
      state.forcedEccentricity = Math.max(state.forcedEccentricity, 0.0035);
      if (state.forcedEccentricitySource === "none") {
        state.forcedEccentricitySource = "laplace-chain";
      }
      state.sustainedHeatingLikely = true;
    }
  }

  return states;
}

export function buildRockyMoonParentOverride(model, { includeRadiation = true } = {}) {
  return {
    inputs: {
      massEarth: model.inputs.massEarth,
      semiMajorAxisAu: model.inputs.semiMajorAxisAu,
      eccentricity: model.inputs.eccentricity,
      rotationPeriodHours: model.inputs.rotationPeriodHours,
      cmfPct: model.inputs.cmfPct,
    },
    derived: {
      densityGcm3: model.derived.densityGcm3,
      radiusEarth: model.derived.radiusEarth,
      gravityG: model.derived.gravityG,
      radioisotopeAbundance: model.inputs.radioisotopeAbundance ?? 1,
      ...(includeRadiation
        ? {
            surfaceFieldEarths: model.derived?.surfaceFieldEarths ?? 0,
            magnetopauseRp: model.derived?.magnetopauseRp ?? null,
          }
        : {}),
    },
  };
}

export function buildGasGiantMoonParentOverride(model, { includeRadiation = true } = {}) {
  return {
    inputs: {
      massEarth: model.physical.massEarth,
      semiMajorAxisAu: model.inputs.orbitAu,
      eccentricity: model.inputs.eccentricity,
      rotationPeriodHours: model.inputs.rotationPeriodHours,
      cmfPct: 0,
    },
    derived: {
      densityGcm3: model.physical.densityGcm3,
      radiusEarth: model.physical.radiusEarth,
      gravityG: model.physical.gravityG,
      radioisotopeAbundance: 1,
      ...(includeRadiation
        ? {
            surfaceFieldEarths: model.magnetic?.surfaceFieldEarths ?? 0,
            magnetopauseRp: model.magnetic?.magnetopauseRp ?? null,
          }
        : {}),
    },
  };
}

export function solveMoonSystem({
  starMassMsol,
  starAgeGyr,
  starMetallicityFeH,
  starRadiusRsolOverride,
  starLuminosityLsolOverride,
  starTempKOverride,
  starEvolutionMode,
  starHabitableZoneAu,
  parentKind,
  parentOverride,
  moonEntries,
  habitabilityPolicy,
  detailLevel = "full",
}) {
  const detail = normalizeDetailLevel(detailLevel);
  const couplingStates = analyseSystemCoupling({
    moonEntries,
    parentKind,
    parentOverride,
    starHabitableZoneAu,
  });

  return moonEntries.map((entry) => {
    const normalizedInputs = normalizeMoonInputs(entry.inputs || entry);
    const couplingState = couplingStates.get(entry.id) || {
      nearestResonance: null,
      chainMembership: null,
      laplaceChainId: null,
      forcedEccentricity: normalizedInputs.forcedEccentricity ?? 0,
      forcedEccentricitySource: normalizedInputs.forcedEccentricity != null ? "manual" : "none",
      sustainedHeatingLikely: false,
      tidalHabitableZone: buildTidalHabitableZone({
        parentKind,
        parentOverride,
        starHabitableZoneAu,
      }),
    };
    const model = calcMoonExact({
      starMassMsol,
      starAgeGyr,
      starMetallicityFeH,
      starRadiusRsolOverride,
      starLuminosityLsolOverride,
      starTempKOverride,
      starEvolutionMode,
      moon: normalizedInputs,
      parentOverride,
      habitabilityPolicy,
      detailLevel: detail,
      moonSystemContext: {
        siblingCount: moonEntries.length,
        nearestResonance: couplingState.nearestResonance,
        chainMembership: couplingState.chainMembership,
        laplaceChainId: couplingState.laplaceChainId,
        forcedEccentricity: couplingState.forcedEccentricity,
        forcedEccentricitySource: couplingState.forcedEccentricitySource,
        sustainedHeatingLikely: couplingState.sustainedHeatingLikely,
        tidalHabitableZone: couplingState.tidalHabitableZone,
        formation: classifyFormation({
          parentKind,
          moonInputs: normalizedInputs,
          parentOverride,
          nearestResonance: couplingState.nearestResonance,
        }),
      },
    });
    return {
      raw: entry,
      model,
      coupling: model.resonance,
      formation: model.formation,
    };
  });
}
