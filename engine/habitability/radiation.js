// Habitability-facing radiation helpers.

import { clamp, toFinite } from "../utils.js";
import { normalizeHabitabilityContext } from "./schema.js";

export function radiationPenaltyFromMagnetosphericDose(remDay) {
  const dose = Math.max(toFinite(remDay, 0), 0);
  if (dose <= 0.01) return 1;
  if (dose <= 0.1) return 0.9;
  if (dose <= 1) return 0.7;
  if (dose <= 10) return 0.35;
  return 0.05;
}

function classifyMoonDose(remDay) {
  const dose = Math.max(toFinite(remDay, 0), 0);
  if (dose <= 0.01) return "Low";
  if (dose <= 0.1) return "Elevated";
  if (dose <= 1) return "Harsh";
  return "Surface-sterilizing";
}

function radiationPenaltyFromMoonClass(exposureClass, fallbackDose) {
  const label = String(exposureClass || "").trim();
  if (label === "Low") return 1;
  if (label === "Elevated") return 0.9;
  if (label === "Harsh") return 0.7;
  if (label === "Surface-sterilizing") return 0.05;
  return radiationPenaltyFromMagnetosphericDose(fallbackDose);
}

export function moonRadiationProfile({
  magnetosphericRadRemDay,
  surfaceExposureRemDayEquivalent,
  subsurfaceExposureRemDayEquivalent,
  surfaceClass,
  subsurfaceClass,
  atmosphereShielding,
  intrinsicFieldShielding,
  inducedFieldShielding,
  magneticShielding,
  combinedShielding,
} = {}) {
  const parentDose = Math.max(toFinite(magnetosphericRadRemDay, 0), 0);
  const surfaceDose = Number.isFinite(Number(surfaceExposureRemDayEquivalent))
    ? Math.max(toFinite(surfaceExposureRemDayEquivalent, 0), 0)
    : parentDose;
  const subsurfaceDose = Number.isFinite(Number(subsurfaceExposureRemDayEquivalent))
    ? Math.max(toFinite(subsurfaceExposureRemDayEquivalent, 0), 0)
    : surfaceDose;
  const resolvedSurfaceClass = String(surfaceClass || classifyMoonDose(surfaceDose));
  const resolvedSubsurfaceClass = String(subsurfaceClass || classifyMoonDose(subsurfaceDose));
  const surfaceRadiationPenalty = clamp(
    radiationPenaltyFromMoonClass(resolvedSurfaceClass, surfaceDose),
    0,
    1,
  );
  const subsurfaceRadiationPenalty = clamp(
    radiationPenaltyFromMoonClass(resolvedSubsurfaceClass, subsurfaceDose),
    0,
    1,
  );

  return {
    modelVersion: "moon-radiation-profile-v2",
    magnetosphericRadRemDay: parentDose,
    surfaceExposureRemDayEquivalent: surfaceDose,
    subsurfaceExposureRemDayEquivalent: subsurfaceDose,
    surfaceClass: resolvedSurfaceClass,
    subsurfaceClass: resolvedSubsurfaceClass,
    atmosphereShielding: clamp(toFinite(atmosphereShielding, 0), 0, 1),
    intrinsicFieldShielding: clamp(toFinite(intrinsicFieldShielding, 0), 0, 1),
    inducedFieldShielding: clamp(toFinite(inducedFieldShielding, 0), 0, 1),
    magneticShielding: clamp(toFinite(magneticShielding, 0), 0, 1),
    combinedShielding: clamp(toFinite(combinedShielding, 0), 0, 1),
    surfaceRadiationPenalty,
    subsurfaceRadiationPenalty,
    radiationPenalty: surfaceRadiationPenalty,
  };
}

function pressureWindowScore(pressureAtm) {
  const pressure = Math.max(toFinite(pressureAtm, 0), 0);
  if (pressure <= 0) return 0;
  return clamp(1 - Math.abs(Math.log10(Math.max(pressure, 0.01))) / 2.2, 0, 1);
}

function iceShieldFactor(iceShellThicknessKm) {
  const thicknessKm = Math.max(toFinite(iceShellThicknessKm, 0), 0);
  if (thicknessKm <= 0) return 0;
  if (thicknessKm <= 1) return 0.5;
  if (thicknessKm <= 5) return 0.85;
  return 0.98;
}

export function computeHabitabilityRadiationModel(
  context = {},
  { selectedPathway = "none", photochemicalShieldingScore = 0 } = {},
) {
  const normalized = normalizeHabitabilityContext(context);
  const surface = normalized.surface;
  const chemistry = normalized.chemistry;
  const environment = normalized.environment;
  const energy = normalized.energy;
  const explicitMoonDoseAvailable =
    normalized.bodyType === "moon" &&
    (Number.isFinite(environment.surfaceExposureRemDayEquivalent) ||
      Number.isFinite(environment.subsurfaceExposureRemDayEquivalent));

  if (explicitMoonDoseAvailable) {
    const useSubsurface = selectedPathway === "subsurface-water";
    const effectiveDose = useSubsurface
      ? Number.isFinite(environment.subsurfaceExposureRemDayEquivalent)
        ? environment.subsurfaceExposureRemDayEquivalent
        : environment.surfaceExposureRemDayEquivalent
      : Number.isFinite(environment.surfaceExposureRemDayEquivalent)
        ? environment.surfaceExposureRemDayEquivalent
        : environment.magnetosphericRadRemDay;
    const pathwayPenalty = clamp(
      useSubsurface
        ? Number.isFinite(environment.subsurfaceRadiationPenalty)
          ? environment.subsurfaceRadiationPenalty
          : radiationPenaltyFromMagnetosphericDose(effectiveDose)
        : Number.isFinite(environment.surfaceRadiationPenalty)
          ? environment.surfaceRadiationPenalty
          : radiationPenaltyFromMagnetosphericDose(effectiveDose),
      0,
      1,
    );
    const photochemicalLiftEligible =
      !useSubsurface &&
      photochemicalShieldingScore > 0 &&
      Number.isFinite(environment.atmosphereShielding) &&
      environment.atmosphereShielding > 0.05;
    const photochemicalAssist = photochemicalLiftEligible
      ? clamp(
          pathwayPenalty +
            (1 - pathwayPenalty) *
              clamp(toFinite(photochemicalShieldingScore, 0), 0, 1) *
              clamp(toFinite(environment.atmosphereShielding, 0), 0, 1) *
              0.08,
          0,
          1,
        )
      : pathwayPenalty;

    return {
      multiplier: photochemicalAssist,
      modelVersion: "radiation-v3",
      breakdown: {
        effectiveDoseRemDay: effectiveDose,
        pathwayPenalty,
        surfaceRadiationPenalty: Number.isFinite(environment.surfaceRadiationPenalty)
          ? environment.surfaceRadiationPenalty
          : radiationPenaltyFromMagnetosphericDose(environment.surfaceExposureRemDayEquivalent),
        subsurfaceRadiationPenalty: Number.isFinite(environment.subsurfaceRadiationPenalty)
          ? environment.subsurfaceRadiationPenalty
          : radiationPenaltyFromMagnetosphericDose(environment.subsurfaceExposureRemDayEquivalent),
        atmosphereShielding: Number.isFinite(environment.atmosphereShielding)
          ? environment.atmosphereShielding
          : 0,
        intrinsicFieldShielding: Number.isFinite(environment.intrinsicFieldShielding)
          ? environment.intrinsicFieldShielding
          : 0,
        inducedFieldShielding: Number.isFinite(environment.inducedFieldShielding)
          ? environment.inducedFieldShielding
          : 0,
        combinedShielding: Number.isFinite(environment.combinedShielding)
          ? environment.combinedShielding
          : 0,
        directMoonRadiation: true,
        photochemicalShieldingScore: clamp(toFinite(photochemicalShieldingScore, 0), 0, 1),
      },
    };
  }

  const explicitPlanetRadiationAvailable =
    normalized.bodyType === "planet" && Number.isFinite(environment.surfaceRadiationPenalty);
  if (explicitPlanetRadiationAvailable) {
    const useSubsurface = selectedPathway === "subsurface-water";
    const iceShield = useSubsurface ? iceShieldFactor(surface.iceShellThicknessKm) : 0;
    const basePenalty = clamp(environment.surfaceRadiationPenalty, 0, 1);
    const pathwayPenalty = useSubsurface
      ? clamp(basePenalty + (1 - basePenalty) * iceShield, 0, 1)
      : basePenalty;
    const multiplier = clamp(pathwayPenalty, 0, 1);
    return {
      multiplier,
      modelVersion: "radiation-v3",
      breakdown: {
        pathwayPenalty,
        surfaceRadiationPenalty: environment.surfaceRadiationPenalty,
        surfaceRadiationClass: environment.surfaceRadiationClass,
        planetRadiationSurfaceClass: environment.planetRadiationSurfaceClass,
        planetRadiationSurfaceHazardScore: environment.planetRadiationSurfaceHazardScore,
        planetRadiationSurfaceProtectionScore: environment.planetRadiationSurfaceProtectionScore,
        atmosphereShielding: Number.isFinite(environment.atmosphereShielding)
          ? environment.atmosphereShielding
          : 0,
        magneticShielding: Number.isFinite(environment.magneticShielding)
          ? environment.magneticShielding
          : 0,
        combinedShielding: Number.isFinite(environment.combinedShielding)
          ? environment.combinedShielding
          : 0,
        iceShieldFactor: iceShield,
        directPlanetRadiation: true,
        photochemicalShieldingScore: clamp(toFinite(photochemicalShieldingScore, 0), 0, 1),
      },
    };
  }

  const effectiveIceShield =
    selectedPathway === "subsurface-water" ? iceShieldFactor(surface.iceShellThicknessKm) : 0;
  const effectiveMagnetosphericDose =
    selectedPathway === "subsurface-water"
      ? environment.magnetosphericRadRemDay * (1 - effectiveIceShield)
      : environment.magnetosphericRadRemDay;
  const magnetosphereMultiplier = clamp(
    radiationPenaltyFromMagnetosphericDose(effectiveMagnetosphericDose),
    0,
    1,
  );
  const xuvFluxRatio = Math.max(toFinite(energy.xuvFluxRatio, 0), 0);
  const stellarExposureMultiplier =
    xuvFluxRatio <= 1 ? 1 : clamp(1 - Math.log10(Math.max(xuvFluxRatio, 1)) / 3, 0.25, 1);
  const physicalSurfaceShielding = Number.isFinite(environment.surfaceRadiationShieldingFactor)
    ? clamp(environment.surfaceRadiationShieldingFactor, 0, 1)
    : clamp(
        0.65 * pressureWindowScore(surface.pressureAtm) +
          0.35 *
            (chemistry.intrinsicFieldKnown === false
              ? 0
              : clamp(toFinite(chemistry.surfaceFieldEarths, 0) / 0.3, 0, 1)),
        0,
        1,
      );
  const surfaceShieldingScore = clamp(
    0.7 * physicalSurfaceShielding + 0.3 * clamp(toFinite(photochemicalShieldingScore, 0), 0, 1),
    0,
    1,
  );
  const pathwayShielding =
    selectedPathway === "subsurface-water"
      ? Math.max(surfaceShieldingScore, effectiveIceShield)
      : surfaceShieldingScore;
  const stellarRadiationMultiplier = clamp(
    stellarExposureMultiplier + (1 - stellarExposureMultiplier) * pathwayShielding,
    0,
    1,
  );
  const multiplier = clamp(Math.min(magnetosphereMultiplier, stellarRadiationMultiplier), 0, 1);

  return {
    multiplier,
    modelVersion: "radiation-v2",
    breakdown: {
      effectiveMagnetosphericDose,
      magnetosphereMultiplier,
      stellarExposureMultiplier,
      surfaceShieldingScore,
      physicalSurfaceShielding,
      stellarRadiationMultiplier,
      iceShieldFactor: effectiveIceShield,
    },
  };
}
