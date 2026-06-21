import { clamp, round, toFinite } from "../utils.js";
import { buildRockyBodyCompositionCoupling } from "../compositionCoupling.js";

function classifyShieldingClass(shieldingFraction) {
  const shielding = clamp(toFinite(shieldingFraction, 0), 0, 1);
  if (shielding <= 0.02) return "None";
  if (shielding <= 0.12) return "Weak";
  if (shielding <= 0.25) return "Moderate";
  return "Strong";
}

function differentiationScore({ differentiatedInterior, densityGcm3 }) {
  if (differentiatedInterior === true) return 1;
  if (differentiatedInterior === false) return 0;
  return clamp((Math.max(toFinite(densityGcm3, 0), 0) - 2.5) / 2.5, 0, 0.55);
}

function buildRationale(parts) {
  return parts.filter(Boolean).join(" ");
}

export function computeMoonMagnetosphere({
  massMoon = 0,
  densityGcm3 = 0,
  differentiatedInterior = null,
  internalHeatFluxWm2 = 0,
  tidalHeatingWm2 = 0,
  radiogenicHeatingWm2 = 0,
  subsurfaceOceanPresent = false,
  salinityPct = 0,
  ammoniaPct = 0,
  parentSurfaceFieldEarths = 0,
  insideParentMagnetosphere = false,
  lShell = Infinity,
  rockyBodyComposition = null,
} = {}) {
  const compositionCoupling = buildRockyBodyCompositionCoupling(rockyBodyComposition);
  const diffScore = differentiationScore({ differentiatedInterior, densityGcm3 });
  const massScore = clamp((Math.max(toFinite(massMoon, 0), 0) - 0.75) / 1.75, 0, 1);
  const heatScore = clamp((Math.max(toFinite(internalHeatFluxWm2, 0), 0) - 0.0015) / 0.03, 0, 1);
  const compositionCoreScore = clamp(
    toFinite(compositionCoupling.interior?.coreMetalScore, 0),
    0,
    1,
  );
  const baseCoreProxyScore = diffScore * clamp(0.35 + massScore * 0.65, 0, 1);
  const compositionCoreProxyScore = compositionCoupling.available
    ? compositionCoreScore * clamp(0.32 + diffScore * 0.46 + massScore * 0.22, 0, 1)
    : 0;
  const coreProxyScore = Math.max(baseCoreProxyScore, compositionCoreProxyScore);
  const activityBoost = clamp(
    Math.max(toFinite(tidalHeatingWm2, 0), 0) * 18 +
      Math.max(toFinite(radiogenicHeatingWm2, 0), 0) * 8,
    0,
    1,
  );
  const intrinsicFieldScore = clamp(
    diffScore * 0.4 +
      massScore * 0.22 +
      coreProxyScore * 0.2 +
      heatScore * 0.12 +
      activityBoost * 0.06 +
      (compositionCoupling.available ? compositionCoreScore * 0.04 : 0),
    0,
    1,
  );
  const intrinsicFieldPlausible = intrinsicFieldScore >= 0.58;
  const intrinsicFieldStrengthRelEarth = intrinsicFieldPlausible
    ? round(clamp(0.03 + intrinsicFieldScore * 0.22, 0, 0.3), 4)
    : 0;

  const compositionConductivityBoost = compositionCoupling.available
    ? 0.22 * clamp(toFinite(compositionCoupling.reservoirScores?.salt, 0), 0, 1) +
      0.08 * clamp(toFinite(compositionCoupling.reservoirScores?.sulfur, 0), 0, 1)
    : 0;
  const oceanConductivityScore = subsurfaceOceanPresent
    ? clamp(
        0.45 +
          Math.max(toFinite(salinityPct, 0), 0) / 45 +
          Math.max(toFinite(ammoniaPct, 0), 0) / 90 +
          compositionConductivityBoost,
        0,
        1,
      )
    : 0;
  const parentFieldScore = insideParentMagnetosphere
    ? clamp(Math.max(toFinite(parentSurfaceFieldEarths, 0), 0) / 1.5, 0, 1)
    : clamp(Math.max(toFinite(parentSurfaceFieldEarths, 0), 0) / 8, 0, 0.25);
  const orbitalCouplingScore = insideParentMagnetosphere
    ? clamp(1 - (Math.max(toFinite(lShell, Infinity), 0) - 6) / 36, 0, 1)
    : 0;
  const inducedFieldScore = subsurfaceOceanPresent
    ? clamp(
        oceanConductivityScore * 0.55 + parentFieldScore * 0.3 + orbitalCouplingScore * 0.15,
        0,
        1,
      )
    : 0;
  const inducedFieldPlausible = inducedFieldScore >= 0.48;
  const inducedFieldStrengthRelEarth = inducedFieldPlausible
    ? round(clamp(0.02 + inducedFieldScore * 0.12, 0, 0.18), 4)
    : 0;

  const intrinsicFieldShielding = round(clamp(intrinsicFieldStrengthRelEarth * 1.35, 0, 0.38), 4);
  const inducedFieldShielding = round(clamp(inducedFieldStrengthRelEarth * 1.25, 0, 0.24), 4);
  const combinedShieldingFraction = round(
    clamp(1 - (1 - intrinsicFieldShielding) * (1 - inducedFieldShielding), 0, 0.55),
    4,
  );

  const rationale = buildRationale([
    intrinsicFieldPlausible
      ? "The moon is massive and differentiated enough to support an intrinsic dynamo."
      : diffScore > 0.4
        ? "Interior differentiation is plausible, but the current mass and heat budget are weak for a sustained intrinsic dynamo."
        : "No strong intrinsic dynamo signal is available from the current bulk and interior state.",
    inducedFieldPlausible
      ? "A conductive subsurface ocean can plausibly drive an induced magnetic response inside the parent field."
      : subsurfaceOceanPresent
        ? "A subsurface ocean may exist, but the current parent field or conductivity signal is too weak for strong induced shielding."
        : "No conductive subsurface ocean is available for induced magnetic shielding.",
    compositionCoupling.available && compositionCoreScore >= 0.5
      ? "Metal and Fe/Ni inventory increase the bounded core proxy without replacing differentiation constraints."
      : "",
    compositionCoupling.available && compositionConductivityBoost > 0.04
      ? "Salt and sulfur inventory increase the induced-ocean conductivity proxy."
      : "",
  ]);

  return {
    modelVersion: "moon-magnetosphere-v1",
    intrinsicFieldPlausible,
    intrinsicFieldScore: round(intrinsicFieldScore, 4),
    intrinsicFieldStrengthRelEarth,
    compositionCoreScore: round(compositionCoreScore, 3),
    inducedFieldPlausible,
    inducedFieldScore: round(inducedFieldScore, 4),
    inducedFieldStrengthRelEarth,
    oceanConductivityCompositionBoost: round(compositionConductivityBoost, 4),
    intrinsicFieldShielding,
    inducedFieldShielding,
    combinedShieldingFraction,
    shieldingClass: classifyShieldingClass(combinedShieldingFraction),
    compositionMagneticContext: compositionCoupling.available
      ? {
          modelVersion: compositionCoupling.modelVersion,
          coreMetalScore: round(compositionCoreScore, 3),
          ironNickelFraction: compositionCoupling.interior.ironNickelFraction,
          saltScore: compositionCoupling.reservoirScores.salt,
          sulfurScore: compositionCoupling.reservoirScores.sulfur,
          conductivityBoost: round(compositionConductivityBoost, 4),
          caveats: compositionCoupling.caveats,
        }
      : null,
    rationale,
  };
}
