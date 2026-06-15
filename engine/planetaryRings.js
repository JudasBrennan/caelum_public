export const RING_MODE_AUTO = "auto";
export const RING_MODE_FORCE_ON = "force-on";
export const RING_MODE_FORCE_OFF = "force-off";
export const ROCKY_RING_REFERENCE_MOON_DENSITY_GCM3 = 3.0;

const KM_PER_RMOON = 1737.4;
const SMALL_COHESIVE_ROCHE_BYPASS_DIAMETER_KM = 20;
const DEFAULT_RING_SCIENCE_ON = "Current ring science supports visible rings.";
const DEFAULT_RING_SCIENCE_OFF = "Current ring science does not support visible rings.";
const GAS_GIANT_RING_SCIENCE_FALLBACK_ON =
  "Ring science could not be recalculated, so Auto uses the stored compatibility ring state (visible).";
const GAS_GIANT_RING_SCIENCE_FALLBACK_OFF =
  "Ring science could not be recalculated, so Auto uses the stored compatibility ring state (hidden).";

function normalizeReason(reason, fallback) {
  const text = String(reason || "").trim();
  return text || fallback;
}

function classifyDepthClass(depthClassRaw) {
  const key = String(depthClassRaw || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  if (key === "dense") return "Dense";
  if (key === "moderate") return "Moderate";
  if (key === "tenuous") return "Tenuous";
  if (key === "none" || key === "no" || key === "absent" || key === "n/a" || key === "na") {
    return "None";
  }
  return String(depthClassRaw || "").trim();
}

function formatDistanceKm(value) {
  const rounded = Math.round(Number(value) || 0);
  if (!Number.isFinite(rounded) || rounded <= 0) return "0 km";
  return `${rounded.toLocaleString("en-US")} km`;
}

function moonNumber(moon, key) {
  const direct = Number(moon?.[key]);
  if (Number.isFinite(direct)) return direct;
  const input = Number(moon?.inputs?.[key]);
  if (Number.isFinite(input)) return input;
  return null;
}

function moonEquivalentDiameterKm(moon) {
  const radiusKm = moonNumber(moon, "radiusKm");
  if (radiusKm > 0) return radiusKm * 2;
  const radiusMoon = moonNumber(moon, "radiusMoon");
  if (radiusMoon > 0) return radiusMoon * KM_PER_RMOON * 2;
  const massMoon = moonNumber(moon, "massMoon");
  const densityGcm3 = moonNumber(moon, "densityGcm3");
  if (!(massMoon > 0) || !(densityGcm3 > 0)) return null;
  return (massMoon / (densityGcm3 / 3.34)) ** (1 / 3) * KM_PER_RMOON * 2;
}

function isWeakMoonStructure(moon) {
  const composition = String(
    moon?.compositionOverride || moon?.inputs?.compositionOverride || moon?.compositionClass || "",
  )
    .trim()
    .toLowerCase();
  return composition === "subsurface ocean" || composition === "partially molten";
}

function isSmallCohesiveRocheBypassMoon(moon) {
  const diameterKm = moonEquivalentDiameterKm(moon);
  return (
    Number.isFinite(diameterKm) &&
    diameterKm > 0 &&
    diameterKm < SMALL_COHESIVE_ROCHE_BYPASS_DIAMETER_KM &&
    !isWeakMoonStructure(moon)
  );
}

export function normalizeRingMode(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (key === RING_MODE_FORCE_ON || key === "on" || key === "force_on") return RING_MODE_FORCE_ON;
  if (key === RING_MODE_FORCE_OFF || key === "off" || key === "force_off") {
    return RING_MODE_FORCE_OFF;
  }
  return RING_MODE_AUTO;
}

export function gasGiantRingScienceFromCalc(gasCalc) {
  const ringProps = gasCalc?.ringProperties;
  if (!ringProps || typeof ringProps !== "object") {
    return {
      scienceEnabled: false,
      scienceReason: DEFAULT_RING_SCIENCE_OFF,
    };
  }

  const depthClass = classifyDepthClass(ringProps.opticalDepthClass);
  if (depthClass === "Dense" || depthClass === "Moderate") {
    return {
      scienceEnabled: true,
      scienceReason: `Science supports visible rings (${depthClass} optical depth).`,
    };
  }
  if (depthClass === "Tenuous") {
    return {
      scienceEnabled: false,
      scienceReason: "Science predicts only tenuous rings, so visible rings stay off in Auto.",
    };
  }
  if (depthClass === "None") {
    return {
      scienceEnabled: false,
      scienceReason: DEFAULT_RING_SCIENCE_OFF,
    };
  }

  const opticalDepth = Number(ringProps.opticalDepth);
  if (Number.isFinite(opticalDepth) && opticalDepth > 0.02) {
    const roundedTau = Math.round(opticalDepth * 100) / 100;
    return {
      scienceEnabled: true,
      scienceReason: `Science supports visible rings (optical depth ${roundedTau}).`,
    };
  }

  const estimatedMassKg = Number(ringProps.estimatedMassKg);
  if (Number.isFinite(estimatedMassKg) && estimatedMassKg > 1e14) {
    return {
      scienceEnabled: true,
      scienceReason: "Science supports visible rings from non-negligible ring mass.",
    };
  }

  if (depthClass) {
    return {
      scienceEnabled: true,
      scienceReason: `Science supports visible rings (${depthClass}).`,
    };
  }

  return {
    scienceEnabled: false,
    scienceReason: DEFAULT_RING_SCIENCE_OFF,
  };
}

export function resolveGasGiantRingState({ ringMode, gasCalc, legacyRings } = {}) {
  if (gasCalc && typeof gasCalc === "object") {
    const science = gasGiantRingScienceFromCalc(gasCalc);
    return resolveRingMode({
      ringMode,
      scienceEnabled: science.scienceEnabled,
      scienceReason: science.scienceReason,
    });
  }

  // Phase 5: keep this fallback local because it only applies when ring
  // science cannot be recalculated from a gas giant solve.
  const fallbackEnabled = legacyRings === true;
  return resolveRingMode({
    ringMode,
    scienceEnabled: fallbackEnabled,
    scienceReason: fallbackEnabled
      ? GAS_GIANT_RING_SCIENCE_FALLBACK_ON
      : GAS_GIANT_RING_SCIENCE_FALLBACK_OFF,
  });
}

export function rockyRingScienceFromDerived(derived) {
  const scienceEnabled = derived?.ringScienceSupported === true;
  return {
    scienceEnabled,
    scienceReason: normalizeReason(
      derived?.ringScienceReason,
      scienceEnabled ? DEFAULT_RING_SCIENCE_ON : DEFAULT_RING_SCIENCE_OFF,
    ),
  };
}

export function computeRockyRocheLimitKm(
  hostRadiusKm,
  hostDensityGcm3,
  moonDensityGcm3 = ROCKY_RING_REFERENCE_MOON_DENSITY_GCM3,
) {
  const radiusKm = Number(hostRadiusKm);
  const hostDensity = Number(hostDensityGcm3);
  const moonDensity = Number(moonDensityGcm3);
  if (!(radiusKm > 0) || !(hostDensity > 0) || !(moonDensity > 0)) return null;
  return 2.44 * radiusKm * Math.cbrt(hostDensity / moonDensity);
}

export function deriveRockyRingScience({
  hostRadiusKm,
  hostDensityGcm3,
  moons,
  referenceMoonDensityGcm3 = ROCKY_RING_REFERENCE_MOON_DENSITY_GCM3,
} = {}) {
  const rocheLimitKm = computeRockyRocheLimitKm(
    hostRadiusKm,
    hostDensityGcm3,
    referenceMoonDensityGcm3,
  );
  if (!(rocheLimitKm > 0)) {
    return {
      rocheLimitKm: null,
      ringScienceSupported: false,
      ringScienceReason: DEFAULT_RING_SCIENCE_OFF,
      ringSourceMoonId: null,
    };
  }

  const moonList = Array.isArray(moons) ? moons : [];
  if (!moonList.length) {
    return {
      rocheLimitKm,
      ringScienceSupported: false,
      ringScienceReason: `Science does not support rocky rings: no assigned moon reaches the Roche limit (${formatDistanceKm(rocheLimitKm)}).`,
      ringSourceMoonId: null,
    };
  }

  let smallestPeriapsisKm = Infinity;
  let closestDisruptiveMoon = null;
  let smallestDisruptivePeriapsisKm = Infinity;
  let smallestBypassedPeriapsisKm = Infinity;
  for (const moon of moonList) {
    const semiMajorAxisKm = Number(moon?.semiMajorAxisKm);
    const eccentricity = Math.max(0, Math.min(0.99, Number(moon?.eccentricity) || 0));
    if (!(semiMajorAxisKm > 0)) continue;
    const periapsisKm = semiMajorAxisKm * (1 - eccentricity);
    if (!(periapsisKm > 0)) continue;
    if (periapsisKm < smallestPeriapsisKm) {
      smallestPeriapsisKm = periapsisKm;
    }
    if (periapsisKm <= rocheLimitKm) {
      if (isSmallCohesiveRocheBypassMoon(moon)) {
        if (periapsisKm < smallestBypassedPeriapsisKm) {
          smallestBypassedPeriapsisKm = periapsisKm;
        }
        continue;
      }
      if (periapsisKm < smallestDisruptivePeriapsisKm) {
        smallestDisruptivePeriapsisKm = periapsisKm;
        closestDisruptiveMoon = moon;
      }
    }
  }

  if (!(smallestPeriapsisKm > 0)) {
    return {
      rocheLimitKm,
      ringScienceSupported: false,
      ringScienceReason: `Science does not support rocky rings: assigned moons do not have a valid periapsis to compare against the Roche limit (${formatDistanceKm(rocheLimitKm)}).`,
      ringSourceMoonId: null,
    };
  }

  if (smallestDisruptivePeriapsisKm <= rocheLimitKm) {
    return {
      rocheLimitKm,
      ringScienceSupported: true,
      ringScienceReason: `Science supports rocky rings: an assigned moon reaches periapsis inside the Roche limit (${formatDistanceKm(smallestDisruptivePeriapsisKm)} <= ${formatDistanceKm(rocheLimitKm)}).`,
      ringSourceMoonId: String(closestDisruptiveMoon?.id || "").trim() || null,
    };
  }

  if (smallestBypassedPeriapsisKm <= rocheLimitKm) {
    return {
      rocheLimitKm,
      ringScienceSupported: false,
      ringScienceReason: `Science does not support rocky rings: the closest Roche-crossing moon is a sub-20 km cohesive body, so material strength can let it survive without disrupting (${formatDistanceKm(smallestBypassedPeriapsisKm)} <= ${formatDistanceKm(rocheLimitKm)}).`,
      ringSourceMoonId: null,
    };
  }

  return {
    rocheLimitKm,
    ringScienceSupported: false,
    ringScienceReason: `Science does not support rocky rings: the closest assigned moon periapsis stays outside the Roche limit (${formatDistanceKm(smallestPeriapsisKm)} > ${formatDistanceKm(rocheLimitKm)}).`,
    ringSourceMoonId: null,
  };
}

export function resolveRingMode({ ringMode, scienceEnabled, scienceReason } = {}) {
  const normalizedMode = normalizeRingMode(ringMode);
  const normalizedScienceEnabled = scienceEnabled === true;
  const effectiveEnabled =
    normalizedMode === RING_MODE_FORCE_ON
      ? true
      : normalizedMode === RING_MODE_FORCE_OFF
        ? false
        : normalizedScienceEnabled;

  return {
    ringMode: normalizedMode,
    scienceEnabled: normalizedScienceEnabled,
    scienceReason: normalizeReason(
      scienceReason,
      normalizedScienceEnabled ? DEFAULT_RING_SCIENCE_ON : DEFAULT_RING_SCIENCE_OFF,
    ),
    effectiveEnabled,
    overrideActive: normalizedMode !== RING_MODE_AUTO,
    againstScience:
      normalizedMode !== RING_MODE_AUTO && effectiveEnabled !== normalizedScienceEnabled,
  };
}
