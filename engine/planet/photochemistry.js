import { clamp, toFinite } from "../utils.js";

const EARTH_OZONE_DU = 300;

function pressureWindowScore(pressureAtm) {
  return clamp(1 - Math.abs(Math.log10(Math.max(toFinite(pressureAtm, 0), 0.01))) / 2.2, 0, 1);
}

function xuvProtectionScore(xuvFluxRatio) {
  const xuvRatio = toFinite(xuvFluxRatio, 0);
  return xuvRatio <= 1 ? 1 : clamp(1 - Math.log10(Math.max(xuvRatio, 1)) / 2.5, 0, 1);
}

export function computePlanetPhotochemistry({
  pressureAtm,
  xuvFluxRatio,
  ppO2Atm,
  ppCH4Atm,
  ppH2Atm,
  ppNH3Atm,
}) {
  const resolvedPressureAtm = Math.max(toFinite(pressureAtm, 0), 0);
  const resolvedXuvFluxRatio = Math.max(toFinite(xuvFluxRatio, 0), 0);
  const resolvedPpO2Atm = Math.max(toFinite(ppO2Atm, 0), 0);
  const resolvedPpCH4Atm = Math.max(toFinite(ppCH4Atm, 0), 0);
  const resolvedPpH2Atm = Math.max(toFinite(ppH2Atm, 0), 0);
  const resolvedPpNH3Atm = Math.max(toFinite(ppNH3Atm, 0), 0);

  const o2Relative = clamp(resolvedPpO2Atm / 0.21, 0, 25);
  const xuvRelative = clamp(resolvedXuvFluxRatio, 0.01, 100);
  const pressureModifier = clamp(Math.max(resolvedPressureAtm, 0.01) ** 0.15, 0.5, 1.5);

  const ozoneEarthRatio = clamp(o2Relative ** 0.5 * xuvRelative ** 0.15 * pressureModifier, 0, 5);
  const ozoneColumnDobsonUnits = EARTH_OZONE_DU * ozoneEarthRatio;

  const warningCodes = [];
  const warningMessages = [];

  if (resolvedPpO2Atm >= 0.05 && resolvedPpCH4Atm >= 1e-4) {
    warningCodes.push("o2_ch4_disequilibrium");
    warningMessages.push(
      "O2 and CH4 coexist at chemically unstable levels without continuous replenishment.",
    );
  }
  if (resolvedPpO2Atm >= 0.05 && resolvedPpH2Atm >= 1e-3) {
    warningCodes.push("o2_h2_disequilibrium");
    warningMessages.push(
      "O2 and H2 coexist at chemically unstable levels without continuous replenishment.",
    );
  }
  if (resolvedPpO2Atm >= 0.05 && resolvedPpNH3Atm >= 1e-5) {
    warningCodes.push("o2_nh3_disequilibrium");
    warningMessages.push(
      "O2 and NH3 coexist at chemically unstable levels without continuous replenishment.",
    );
  }

  const ozoneScore = clamp(ozoneEarthRatio / 1.5, 0, 1);
  const uvShieldingScore = clamp(
    0.55 * ozoneScore +
      0.25 * pressureWindowScore(resolvedPressureAtm) +
      0.2 * xuvProtectionScore(resolvedXuvFluxRatio),
    0,
    1,
  );

  const uvShieldingClass =
    uvShieldingScore >= 0.67 ? "Shielded" : uvShieldingScore >= 0.34 ? "Partial" : "Unshielded";
  const warningCount = warningCodes.length;
  const stabilityClass =
    warningCount === 0 ? "Stable" : warningCount === 1 ? "1 warning" : `${warningCount} warnings`;

  return {
    modelVersion: "planet-photochemistry-v1",
    ozoneColumnDobsonUnits,
    ozoneEarthRatio,
    uvShieldingScore,
    uvShieldingClass,
    warningCodes,
    warningMessages,
    warningCount,
    stabilityClass,
  };
}
