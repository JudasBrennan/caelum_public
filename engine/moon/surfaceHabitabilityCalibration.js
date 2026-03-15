import { clamp, round, toFinite } from "../utils.js";

const LUNAR_MASS_IN_EARTH = 0.0123000371;
const JUPITER_MASS_IN_EARTH = 317.83;

function inferHostKind({ parentMassEarth, parentDensityGcm3, parentRadiusEarth }) {
  const massEarth = Math.max(toFinite(parentMassEarth, 0), 0);
  const density = Math.max(toFinite(parentDensityGcm3, 0), 0);
  const radiusEarth = Math.max(toFinite(parentRadiusEarth, 0), 0);
  if (massEarth >= 50 || radiusEarth >= 4 || (density > 0 && density < 2.5)) return "giant-planet";
  return "terrestrial-planet";
}

function hostGiantFavorability(parentMassEarth) {
  const massMj = Math.max(toFinite(parentMassEarth, 0), 0) / JUPITER_MASS_IN_EARTH;
  if (massMj >= 10) return { score: 1, label: "Very massive giant host" };
  if (massMj >= 5) return { score: 0.82, label: "Massive giant host" };
  if (massMj >= 2) return { score: 0.62, label: "Moderately massive giant host" };
  if (massMj >= 0.5) return { score: 0.38, label: "Lower-mass giant host" };
  return {
    score: 0.18,
    label: "Host too low-mass to strongly support a cool-star surface exomoon",
  };
}

function compositionModifier({ densityGcm3, compositionOverride }) {
  const label = String(compositionOverride || "").toLowerCase();
  const rocky =
    label.includes("rocky") ||
    label.includes("iron") ||
    label.includes("molten") ||
    densityGcm3 >= 3.2;
  const icy =
    label.includes("icy") ||
    label.includes("subsurface ocean") ||
    label.includes("mixed rock/ice") ||
    densityGcm3 <= 2.4;
  if (rocky && !icy)
    return {
      floorDeltaEarth: -0.02,
      score: 1,
      label: "Rocky composition helps atmosphere retention",
    };
  if (icy && !rocky)
    return {
      floorDeltaEarth: 0.03,
      score: 0.72,
      label: "Icy composition raises the surface-habitability mass floor",
    };
  return { floorDeltaEarth: 0, score: 0.88, label: "Composition is neutral for the calibration" };
}

function starMassBaseFloorEarth(starMassMsol) {
  const starMass = Math.max(toFinite(starMassMsol, 0), 0);
  if (starMass <= 0.2) return 0.3;
  if (starMass <= 0.35) return 0.25;
  if (starMass <= 0.5) return 0.21;
  if (starMass <= 0.65) return 0.17;
  return 0.14;
}

function parentOrbitFloorAdjustment(parentSemiMajorAxisAu) {
  const orbitAu = Math.max(toFinite(parentSemiMajorAxisAu, 0), 0);
  if (orbitAu >= 1 && orbitAu <= 2) return -0.03;
  if (orbitAu < 0.5) return 0.06;
  if (orbitAu < 1) return 0.03;
  if (orbitAu > 2.5) return 0.015;
  return 0;
}

function hostMassFloorAdjustment(parentMassEarth) {
  const massMj = Math.max(toFinite(parentMassEarth, 0), 0) / JUPITER_MASS_IN_EARTH;
  if (massMj >= 10) return -0.05;
  if (massMj >= 5) return -0.035;
  if (massMj >= 2) return -0.015;
  if (massMj >= 0.5) return 0.02;
  return 0.05;
}

export function computeSurfaceExomoonCalibration({
  starMassMsol,
  parentMassEarth,
  parentDensityGcm3,
  parentRadiusEarth,
  parentSemiMajorAxisAu,
  moonMassMoon,
  moonDensityGcm3,
  compositionOverride,
  spinState = null,
  stellarZonePass = false,
} = {}) {
  const hostKind = inferHostKind({ parentMassEarth, parentDensityGcm3, parentRadiusEarth });
  const applicable = starMassMsol <= 0.65 && hostKind === "giant-planet";
  const moonMassEarth = Math.max(toFinite(moonMassMoon, 0), 0) * LUNAR_MASS_IN_EARTH;
  const giantFavorability = hostGiantFavorability(parentMassEarth);
  const composition = compositionModifier({ densityGcm3: moonDensityGcm3, compositionOverride });
  const spinStateValue = String(spinState?.state || "");
  const normalizedSpinState = spinStateValue.toLowerCase();
  const spinStateBenefit = normalizedSpinState.includes("3:2")
    ? {
        score: 1,
        floorDeltaEarth: -0.015,
        label: "3:2 spin state modestly helps day-night moderation",
      }
    : normalizedSpinState.includes("1:1")
      ? {
          score: 0.88,
          floorDeltaEarth: 0.01,
          label: "1:1 synchronous lock is less favorable for exposed-surface climates",
        }
      : { score: 0.94, floorDeltaEarth: 0, label: "Spin-state effect is neutral or unknown" };

  let moonMassFloorEarth = clamp(
    starMassBaseFloorEarth(starMassMsol) +
      parentOrbitFloorAdjustment(parentSemiMajorAxisAu) +
      hostMassFloorAdjustment(parentMassEarth) +
      composition.floorDeltaEarth +
      spinStateBenefit.floorDeltaEarth,
    0.1,
    0.35,
  );

  const massRatio = moonMassFloorEarth > 0 ? moonMassEarth / moonMassFloorEarth : 0;
  const moonMassPass = !applicable || moonMassEarth >= moonMassFloorEarth;
  const overallPass = !applicable || (stellarZonePass !== false && moonMassPass);
  const penalty = !applicable ? 1 : clamp(massRatio ** 0.8, 0.15, 1);

  let label = "Calibration not applicable";
  if (!applicable) {
    label = "Calibration not targeted for this star-host regime";
  } else if (stellarZonePass === false) {
    label = "Surface exomoon calibration blocked by the stellar-zone gate";
  } else if (moonMassPass) {
    label = "Paper-informed cool-star surface exomoon calibration passes";
  } else {
    label = "Surface exomoon lies below the paper-informed mass floor";
  }

  const notes = [];
  if (applicable) {
    notes.push(giantFavorability.label);
    notes.push(composition.label);
    notes.push(spinStateBenefit.label);
    if (parentSemiMajorAxisAu >= 1 && parentSemiMajorAxisAu <= 2) {
      notes.push("Parent orbit sits in the paper-favored ~1-2 AU regime");
    } else if (parentSemiMajorAxisAu < 1) {
      notes.push("Closer-in giant orbits raise the minimum surface-habitable moon mass");
    } else {
      notes.push("Farther giant orbits are less strongly favored for exposed-surface habitability");
    }
  }

  return {
    modelVersion: "surface-exomoon-calibration-v1",
    applicable,
    hostKind,
    starClassBand:
      starMassMsol <= 0.2
        ? "very-low-mass cool star"
        : starMassMsol <= 0.5
          ? "cool star"
          : starMassMsol <= 0.65
            ? "warm cool star"
            : "not targeted",
    hostGiantFavorability: {
      score: round(giantFavorability.score, 3),
      label: giantFavorability.label,
    },
    moonMassEarth: round(moonMassEarth, 4),
    moonMassFloorEarth: round(moonMassFloorEarth, 3),
    moonMassPass,
    compositionModifier: {
      score: round(composition.score, 3),
      label: composition.label,
    },
    spinStateBenefit: {
      score: round(spinStateBenefit.score, 3),
      label: spinStateBenefit.label,
      state: spinStateValue || "unknown",
    },
    overallPass,
    penalty: round(penalty, 4),
    label,
    notes,
  };
}
