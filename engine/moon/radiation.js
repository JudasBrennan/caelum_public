import { computeXuvFluxRatio } from "../planet/atmosphere.js";
import { clamp, round, toFinite } from "../utils.js";
import { computeMagnetosphericRadiation } from "./retention.js";

function atmosphereShieldingFraction(surfacePressurePa) {
  const pressureAtm = Math.max(toFinite(surfacePressurePa, 0), 0) / 101325;
  return round(clamp(Math.log10(1 + pressureAtm * 60) / 2.2, 0, 0.9), 4);
}

function remainingSubsurfaceFactor(iceShellThicknessKm) {
  const thicknessKm = Math.max(toFinite(iceShellThicknessKm, 0), 0);
  if (thicknessKm <= 0) return 1;
  if (thicknessKm <= 1) return 0.4;
  if (thicknessKm <= 5) return 0.08;
  if (thicknessKm <= 20) return 0.03;
  return 0.01;
}

function exposureLevelFromRemDay(remDay) {
  return round(clamp(Math.log10(1 + Math.max(toFinite(remDay, 0), 0)) / 3, 0, 1), 4);
}

function classifySurfaceExposure(remDay) {
  const dose = Math.max(toFinite(remDay, 0), 0);
  if (dose <= 0.01) return "Low";
  if (dose <= 0.1) return "Elevated";
  if (dose <= 1) return "Harsh";
  return "Surface-sterilizing";
}

export function computeMoonRadiationEnvironment({
  starMassMsol = 1,
  surfaceFieldEarths = 0,
  magnetopauseRp = null,
  planetSemiMajorAxisAu = 1,
  planetRadiusEarth = 1,
  moonSemiMajorAxisKm = 0,
  starLuminosityLsol = 1,
  starAgeGyr = 4.6,
  hostXuvFluxRatioAt1Au = null,
  extraStellarXuvFluxRatio = 0,
  surfacePressurePa = 0,
  iceShellThicknessKm = 0,
  magnetosphere = null,
  parentMagnetosphereEnvironment = null,
} = {}) {
  const parent = computeMagnetosphericRadiation({
    surfaceFieldEarths,
    magnetopauseRp,
    planetSemiMajorAxisAu,
    planetRadiusEarth,
    moonSemiMajorAxisKm,
  });
  const parentBeltLevel = exposureLevelFromRemDay(parent.magnetosphericRadRemDay);
  const resolvedHostXuvFluxRatioAt1Au = toFinite(hostXuvFluxRatioAt1Au, null);
  const hostStellarXuvFluxRatio =
    Number.isFinite(resolvedHostXuvFluxRatioAt1Au) && resolvedHostXuvFluxRatioAt1Au > 0
      ? resolvedHostXuvFluxRatioAt1Au / Math.max(toFinite(planetSemiMajorAxisAu, 0), 0.01) ** 2
      : computeXuvFluxRatio(starMassMsol, starLuminosityLsol, starAgeGyr, planetSemiMajorAxisAu);
  const stellarXuvFluxRatio = Math.max(
    hostStellarXuvFluxRatio + Math.max(toFinite(extraStellarXuvFluxRatio, 0), 0),
    0,
  );
  const stellarXuvLevel = round(
    clamp(Math.log10(1 + Math.max(stellarXuvFluxRatio, 0)) / 3.2, 0, 1),
    4,
  );
  const stellarXuvRemDayEquivalent = clamp(0.018 * Math.sqrt(stellarXuvFluxRatio), 0, 2.5);
  const atmosphereShielding = atmosphereShieldingFraction(surfacePressurePa);
  const intrinsicFieldShielding = clamp(
    Number(magnetosphere?.intrinsicFieldShielding) || 0,
    0,
    0.5,
  );
  const inducedFieldShielding = clamp(Number(magnetosphere?.inducedFieldShielding) || 0, 0, 0.4);
  const magneticShielding = round(
    clamp(1 - (1 - intrinsicFieldShielding) * (1 - inducedFieldShielding), 0, 0.6),
    4,
  );
  const windCompressionFactor = clamp(
    toFinite(parentMagnetosphereEnvironment?.windCompressionFactor, 1),
    0.2,
    4,
  );
  const magnetopauseBoundaryFraction =
    parent.magnetopauseLShell > 0
      ? parent.lShell / Math.max(parent.magnetopauseLShell, 1e-9)
      : Infinity;
  const compressionExposureMultiplier =
    windCompressionFactor < 0.95
      ? round(
          clamp(
            1 +
              (1 - windCompressionFactor) *
                clamp(magnetopauseBoundaryFraction / 0.3, 0.25, 2) *
                0.35,
            1,
            1.6,
          ),
          4,
        )
      : 1;
  const combinedShielding = round(
    clamp(1 - (1 - atmosphereShielding) * (1 - magneticShielding), 0, 0.96),
    4,
  );
  const parentSurfaceExposureRemDayEquivalent =
    parent.magnetosphericRadRemDay *
    compressionExposureMultiplier *
    (1 - magneticShielding) *
    (1 - atmosphereShielding * 0.85);
  const stellarSurfaceExposureRemDayEquivalent =
    stellarXuvRemDayEquivalent * compressionExposureMultiplier * (1 - atmosphereShielding);
  const surfaceExposureRemDayEquivalent =
    parentSurfaceExposureRemDayEquivalent + stellarSurfaceExposureRemDayEquivalent;
  const subsurfaceExposureRemDayEquivalent =
    surfaceExposureRemDayEquivalent * remainingSubsurfaceFactor(iceShellThicknessKm);

  return {
    ...parent,
    modelVersion: "moon-radiation-v2",
    parentBeltLevel,
    stellarXuvFluxRatio: round(stellarXuvFluxRatio, 4),
    stellarXuvLevel,
    atmosphereShielding,
    intrinsicFieldShielding: round(intrinsicFieldShielding, 4),
    inducedFieldShielding: round(inducedFieldShielding, 4),
    magneticShielding,
    combinedShielding,
    parentMagnetosphereCompressionClass:
      parentMagnetosphereEnvironment?.compressionClass || "Not evaluated",
    parentWindCompressionFactor: round(windCompressionFactor, 4),
    compressionExposureMultiplier,
    surfaceExposureRemDayEquivalent: round(surfaceExposureRemDayEquivalent, 4),
    surfaceExposure: exposureLevelFromRemDay(surfaceExposureRemDayEquivalent),
    subsurfaceExposureRemDayEquivalent: round(subsurfaceExposureRemDayEquivalent, 4),
    subsurfaceExposure: exposureLevelFromRemDay(subsurfaceExposureRemDayEquivalent),
    surfaceClass: classifySurfaceExposure(surfaceExposureRemDayEquivalent),
    subsurfaceClass: classifySurfaceExposure(subsurfaceExposureRemDayEquivalent),
    calibrationNotes: [
      "relative-dose-model",
      "europa-anchored-parent-belt",
      "xuv-relative-scaling",
      ...(compressionExposureMultiplier > 1 ? ["parent-magnetosphere-compression"] : []),
    ],
  };
}
