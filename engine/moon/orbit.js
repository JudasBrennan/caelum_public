import { clamp } from "../utils.js";
import {
  auToKilometers,
  calcOrbitalPeriodDaysKepler,
  calcTwoBodyOrbitalPeriodSeconds,
  earthMassToKg,
  moonMassToKg,
  orbitalDirectionFromInclination,
  solarMassToKg,
} from "../physics/orbital.js";

const KM_PER_REARTH = 6371;
const KM_PER_RMOON = 1737.4;
const SEC_PER_DAY = 86400;
const RIGID_ROCHE_FACTOR = 1.26;
const SMALL_COHESIVE_ROCHE_BYPASS_DIAMETER_KM = 20;
const COLLISION_CLEARANCE_FACTOR = 1.01;
const MIN_COHESIVE_RIGIDITY_PA = 1e9;
const PROGRADE_STABLE_HILL_FRACTION = 0.33;
const RETROGRADE_STABLE_HILL_FRACTION = 0.5;
const COMFORTABLE_STABLE_FRACTION = 0.85;

function classifyOrbitStability({
  periapsisKm,
  apoapsisKm,
  collisionInnerLimitKm,
  classicalRocheLimitKm,
  smallCohesiveRocheBypass,
  hillRadiusKm,
  stableOuterLimitKm,
  comfortOuterLimitKm,
}) {
  if (periapsisKm < collisionInnerLimitKm) {
    return {
      stabilityClass: "inside-parent-collision-limit",
      stabilityLabel: "Intersects parent body",
      longTermStable: false,
      comfortablyStable: false,
    };
  }
  if (!smallCohesiveRocheBypass && periapsisKm < classicalRocheLimitKm) {
    return {
      stabilityClass: "inside-roche-limit",
      stabilityLabel: "Inside Roche limit",
      longTermStable: false,
      comfortablyStable: false,
    };
  }
  if (apoapsisKm > hillRadiusKm) {
    return {
      stabilityClass: "outside-hill-sphere",
      stabilityLabel: "Outside formal Hill sphere",
      longTermStable: false,
      comfortablyStable: false,
    };
  }
  if (apoapsisKm > stableOuterLimitKm) {
    return {
      stabilityClass: "outside-conservative-stable-region",
      stabilityLabel: "Inside Hill sphere but outside conservative stable region",
      longTermStable: false,
      comfortablyStable: false,
    };
  }
  if (apoapsisKm > comfortOuterLimitKm) {
    return {
      stabilityClass: "near-outer-stability-edge",
      stabilityLabel: "Near outer stability edge",
      longTermStable: true,
      comfortablyStable: false,
    };
  }
  return {
    stabilityClass: "comfortably-stable",
    stabilityLabel: "Comfortably stable long-term orbit",
    longTermStable: true,
    comfortablyStable: true,
  };
}

function resolveMoonRadiusKm({ moonMassMoon, moonDensityGcm3, moonRadiusMoon, moonRadiusKm }) {
  const explicitKm = Number(moonRadiusKm);
  if (Number.isFinite(explicitKm) && explicitKm > 0) return explicitKm;
  const explicitMoonRadii = Number(moonRadiusMoon);
  if (Number.isFinite(explicitMoonRadii) && explicitMoonRadii > 0) {
    return explicitMoonRadii * KM_PER_RMOON;
  }
  const density = Number(moonDensityGcm3);
  const mass = Number(moonMassMoon);
  if (!(density > 0) || !(mass > 0)) return 0;
  return (mass / (density / 3.34)) ** (1 / 3) * KM_PER_RMOON;
}

function resolveSmallCohesiveRocheBypass({
  moonEquivalentDiameterKm,
  moonRigidityPa,
  moonCompositionClass,
  cohesiveRocheBypassMode,
}) {
  if (cohesiveRocheBypassMode === "off") {
    return {
      active: false,
      reason: "Small-body Roche bypass disabled.",
    };
  }
  if (
    !Number.isFinite(moonEquivalentDiameterKm) ||
    moonEquivalentDiameterKm <= 0 ||
    moonEquivalentDiameterKm >= SMALL_COHESIVE_ROCHE_BYPASS_DIAMETER_KM
  ) {
    return {
      active: false,
      reason: "Moon is not below the small cohesive-body diameter threshold.",
    };
  }
  const rigidity = Number(moonRigidityPa);
  if (Number.isFinite(rigidity) && rigidity < MIN_COHESIVE_RIGIDITY_PA) {
    return {
      active: false,
      reason: "Modeled moon material is too weak for the small-body strength bypass.",
    };
  }
  const compositionClass = String(moonCompositionClass || "")
    .trim()
    .toLowerCase();
  if (compositionClass === "subsurface ocean" || compositionClass === "partially molten") {
    return {
      active: false,
      reason: "Modeled weak or partially molten structure remains Roche-limited.",
    };
  }
  return {
    active: true,
    reason: "Material strength dominates self-gravity for this sub-20 km cohesive body.",
  };
}

export function computeMoonStabilityLimits({
  starMassMsol,
  planetMassEarth,
  planetSemiMajorAxisAu,
  moonInclinationDeg,
}) {
  const hillRadiusKm =
    auToKilometers(planetSemiMajorAxisAu) *
    (earthMassToKg(planetMassEarth) / (3 * solarMassToKg(starMassMsol))) ** (1 / 3);
  const progradeStableOuterLimitKm = hillRadiusKm * PROGRADE_STABLE_HILL_FRACTION;
  const retrogradeStableOuterLimitKm = hillRadiusKm * RETROGRADE_STABLE_HILL_FRACTION;
  const orbitalDirection = orbitalDirectionFromInclination(moonInclinationDeg);
  const stableOuterLimitKm =
    orbitalDirection === "Retrograde" ? retrogradeStableOuterLimitKm : progradeStableOuterLimitKm;
  const comfortOuterLimitKm = stableOuterLimitKm * COMFORTABLE_STABLE_FRACTION;

  return {
    hillRadiusKm,
    progradeStableOuterLimitKm,
    retrogradeStableOuterLimitKm,
    stableOuterLimitKm,
    comfortOuterLimitKm,
    orbitalDirection,
  };
}

export function computeMoonOrbit({
  starMassMsol,
  planetMassEarth,
  planetDensityGcm3,
  planetRadiusEarth,
  planetSemiMajorAxisAu,
  planetEccentricity,
  moonMassMoon,
  moonDensityGcm3,
  moonRadiusMoon,
  moonRadiusKm,
  moonRigidityPa,
  moonCompositionClass,
  cohesiveRocheBypassMode = "auto",
  moonSemiMajorAxisKmInput,
  moonEccentricity,
  moonInclinationDeg,
}) {
  const periPlanetAu = planetSemiMajorAxisAu * (1 - planetEccentricity);
  const periodPlanetDays = calcOrbitalPeriodDaysKepler({
    semiMajorAxisAu: planetSemiMajorAxisAu,
    centralMassMsol: starMassMsol,
    daysPerYear: 365.256,
  });

  // Natural moons are solid bodies, not strengthless fluids, so use the
  // rigid-body Roche limit here. This keeps small cohesive moons like Phobos
  // outside the guardrail instead of incorrectly forcing them outward to the
  // fluid disruption boundary.
  const planetRadiusKm = planetRadiusEarth * KM_PER_REARTH;
  const resolvedMoonRadiusKm = resolveMoonRadiusKm({
    moonMassMoon,
    moonDensityGcm3,
    moonRadiusMoon,
    moonRadiusKm,
  });
  const moonEquivalentDiameterKm = resolvedMoonRadiusKm * 2;
  const classicalRocheLimitKm =
    RIGID_ROCHE_FACTOR * planetRadiusKm * (planetDensityGcm3 / moonDensityGcm3) ** (1 / 3);
  const collisionInnerLimitKm =
    (planetRadiusKm + Math.max(resolvedMoonRadiusKm, 0)) * COLLISION_CLEARANCE_FACTOR;
  const bypass = resolveSmallCohesiveRocheBypass({
    moonEquivalentDiameterKm,
    moonRigidityPa,
    moonCompositionClass,
    cohesiveRocheBypassMode,
  });
  const smallCohesiveRocheBypass = bypass.active;
  const zoneInnerKm = smallCohesiveRocheBypass
    ? collisionInnerLimitKm
    : Math.max(classicalRocheLimitKm, collisionInnerLimitKm);
  const effectiveInnerLimitKind =
    smallCohesiveRocheBypass || collisionInnerLimitKm > classicalRocheLimitKm
      ? "collision"
      : "roche";
  const stabilityLimits = computeMoonStabilityLimits({
    starMassMsol,
    planetMassEarth,
    planetSemiMajorAxisAu,
    moonInclinationDeg,
  });
  const hillRadiusKm = stabilityLimits.hillRadiusKm;
  const zoneOuterKm = stabilityLimits.stableOuterLimitKm;

  const periFactor = Math.max(1e-6, 1 - moonEccentricity);
  const apoFactor = 1 + moonEccentricity;
  const minAMoonKm = zoneInnerKm / periFactor;
  const maxAMoonKm = zoneOuterKm / apoFactor;
  const maxAHillKm = hillRadiusKm / apoFactor;

  let semiMajorAxisKm = moonSemiMajorAxisKmInput;
  let semiMajorAxisGuard = "none";
  if (Number.isFinite(minAMoonKm) && Number.isFinite(maxAMoonKm) && maxAMoonKm >= minAMoonKm) {
    if (moonSemiMajorAxisKmInput < minAMoonKm) {
      semiMajorAxisKm = minAMoonKm;
      semiMajorAxisGuard = "raised_to_avoid_collision";
    } else if (moonSemiMajorAxisKmInput > maxAMoonKm) {
      semiMajorAxisKm = maxAMoonKm;
      semiMajorAxisGuard =
        moonSemiMajorAxisKmInput > maxAHillKm
          ? "lowered_to_remain_bound"
          : "lowered_to_remain_long_term_stable";
    }
  } else {
    const zMin = Math.min(zoneInnerKm, zoneOuterKm);
    const zMax = Math.max(zoneInnerKm, zoneOuterKm);
    const clampedFallback = clamp(moonSemiMajorAxisKmInput, zMin, zMax);
    if (clampedFallback !== moonSemiMajorAxisKmInput) semiMajorAxisGuard = "clamped_to_moon_zone";
    semiMajorAxisKm = clampedFallback;
  }

  const periapsisKm = semiMajorAxisKm * (1 - moonEccentricity);
  const apoapsisKm = semiMajorAxisKm * (1 + moonEccentricity);
  const orbitalDirection = stabilityLimits.orbitalDirection;
  const requestedPeriapsisKm = moonSemiMajorAxisKmInput * (1 - moonEccentricity);
  const requestedApoapsisKm = moonSemiMajorAxisKmInput * (1 + moonEccentricity);
  const requestedStability = classifyOrbitStability({
    periapsisKm: requestedPeriapsisKm,
    apoapsisKm: requestedApoapsisKm,
    collisionInnerLimitKm,
    classicalRocheLimitKm,
    smallCohesiveRocheBypass,
    hillRadiusKm,
    stableOuterLimitKm: stabilityLimits.stableOuterLimitKm,
    comfortOuterLimitKm: stabilityLimits.comfortOuterLimitKm,
  });
  const resolvedStability = classifyOrbitStability({
    periapsisKm,
    apoapsisKm,
    collisionInnerLimitKm,
    classicalRocheLimitKm,
    smallCohesiveRocheBypass,
    hillRadiusKm,
    stableOuterLimitKm: stabilityLimits.stableOuterLimitKm,
    comfortOuterLimitKm: stabilityLimits.comfortOuterLimitKm,
  });
  const stabilityMarginFraction =
    stabilityLimits.stableOuterLimitKm > 0
      ? clamp(
          (stabilityLimits.stableOuterLimitKm - apoapsisKm) / stabilityLimits.stableOuterLimitKm,
          0,
          1,
        )
      : 0;

  const orbitalPeriodSiderealDays =
    calcTwoBodyOrbitalPeriodSeconds({
      semiMajorAxisM: semiMajorAxisKm * 1000,
      primaryMassKg: earthMassToKg(planetMassEarth),
      secondaryMassKg: moonMassToKg(moonMassMoon),
    }) / SEC_PER_DAY;
  const synodicDenom = Math.abs(1 / orbitalPeriodSiderealDays - 1 / periodPlanetDays);
  const orbitalPeriodSynodicDays = synodicDenom > 0 ? 1 / synodicDenom : Infinity;

  return {
    periPlanetAu,
    periodPlanetDays,
    zoneInnerKm,
    classicalRocheLimitKm,
    effectiveInnerLimitKm: zoneInnerKm,
    effectiveInnerLimitKind,
    collisionInnerLimitKm,
    smallCohesiveRocheBypass,
    smallCohesiveRocheBypassReason: bypass.reason,
    moonEquivalentDiameterKm,
    rocheLimitModel: smallCohesiveRocheBypass ? "strength-bypassed-rigid-body" : "rigid-body",
    zoneOuterKm,
    hillRadiusKm,
    stableOuterLimitKm: stabilityLimits.stableOuterLimitKm,
    progradeStableOuterLimitKm: stabilityLimits.progradeStableOuterLimitKm,
    retrogradeStableOuterLimitKm: stabilityLimits.retrogradeStableOuterLimitKm,
    comfortOuterLimitKm: stabilityLimits.comfortOuterLimitKm,
    minAMoonKm,
    maxAMoonKm,
    maxAHillKm,
    semiMajorAxisKm,
    semiMajorAxisGuard,
    periapsisKm,
    apoapsisKm,
    orbitalDirection,
    requestedOrbitStabilityClass: requestedStability.stabilityClass,
    requestedOrbitStabilityLabel: requestedStability.stabilityLabel,
    orbitStabilityClass: resolvedStability.stabilityClass,
    orbitStabilityLabel: resolvedStability.stabilityLabel,
    longTermStable: resolvedStability.longTermStable,
    comfortablyStable: resolvedStability.comfortablyStable,
    stabilityMarginFraction,
    orbitalPeriodSiderealDays,
    orbitalPeriodSynodicDays,
  };
}
