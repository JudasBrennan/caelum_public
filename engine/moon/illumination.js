import { calcEquilibriumTemperatureFromFluxK, calcStellarFluxWm2 } from "../physics/radiative.js";
import { clamp, round, toFinite } from "../utils.js";

const KM_PER_REARTH = 6371;
const STEFAN_BOLTZ = 5.6704e-8;

function defaultParentAlbedo({ radiusEarth, densityGcm3 }) {
  const radius = Math.max(toFinite(radiusEarth, 0), 0);
  const density = Math.max(toFinite(densityGcm3, 0), 0);
  if (radius >= 3 || density < 2) return 0.34;
  return 0.3;
}

export function computeMoonIllumination({
  starLuminosityLsol,
  planetSemiMajorAxisAu,
  planetRadiusEarth,
  planetDensityGcm3,
  planetAlbedoBond,
  parentSurfaceTempK,
  moonSemiMajorAxisKm,
  moonInclinationDeg,
  parentAxialTiltDeg,
  moonLockedToPlanet = true,
} = {}) {
  const stellarFluxWm2 = calcStellarFluxWm2({
    starLuminosityLsol: Math.max(toFinite(starLuminosityLsol, 0), 0),
    orbitalDistanceAu: Math.max(toFinite(planetSemiMajorAxisAu, 0), 0),
  });
  const radiusKm = Math.max(toFinite(planetRadiusEarth, 0), 0) * KM_PER_REARTH;
  const semiMajorAxisKm = Math.max(toFinite(moonSemiMajorAxisKm, 0), 0);
  const distanceRatio = radiusKm > 0 && semiMajorAxisKm > 0 ? (radiusKm / semiMajorAxisKm) ** 2 : 0;
  const albedoBond = clamp(
    toFinite(
      planetAlbedoBond,
      defaultParentAlbedo({ radiusEarth: planetRadiusEarth, densityGcm3: planetDensityGcm3 }),
    ),
    0,
    0.95,
  );
  const parentEffectiveTempK = Math.max(
    toFinite(
      parentSurfaceTempK,
      calcEquilibriumTemperatureFromFluxK({
        stellarFluxAtDistanceWm2: stellarFluxWm2,
        albedoBond,
        redistributionFactor: 4,
      }),
    ),
    0,
  );

  // Global-mean climate forcing from reflected and thermal planetshine.
  const parentReflectedFluxWm2 = (stellarFluxWm2 * albedoBond * distanceRatio) / 8;
  const parentThermalFluxWm2 = (STEFAN_BOLTZ * parentEffectiveTempK ** 4 * distanceRatio) / 8;
  const planetshineFluxWm2 = parentReflectedFluxWm2 + parentThermalFluxWm2;

  const criticalInclinationRad =
    semiMajorAxisKm > radiusKm && semiMajorAxisKm > 0
      ? Math.asin(Math.min(1, radiusKm / semiMajorAxisKm))
      : 0;
  const criticalInclinationDeg = (criticalInclinationRad * 180) / Math.PI;
  const alignmentFactor =
    criticalInclinationDeg > 0
      ? clamp(1 - Math.abs(toFinite(moonInclinationDeg, 0)) / criticalInclinationDeg, 0, 1)
      : 0;
  const edgeOnDutyCycle = criticalInclinationRad > 0 ? criticalInclinationRad / Math.PI : 0;
  const eclipseDutyCycle = clamp(edgeOnDutyCycle * alignmentFactor, 0, 0.25);
  const eclipseCoolingPenalty = round(eclipseDutyCycle, 3);

  const parentTilt = clamp(Math.abs(toFinite(parentAxialTiltDeg, 0)), 0, 180);
  const foldedTilt = parentTilt <= 90 ? parentTilt : 180 - parentTilt;
  const effectiveAxialTiltDeg = round(
    clamp(foldedTilt + 0.35 * Math.abs(toFinite(moonInclinationDeg, 0)), 0, 90),
    1,
  );

  const synchronousGeometryFactor = moonLockedToPlanet
    ? clamp(planetshineFluxWm2 / Math.max(stellarFluxWm2 + planetshineFluxWm2, 1e-9), 0, 1)
    : 0;

  return {
    modelVersion: "moon-illumination-v1",
    stellarFluxWm2: round(stellarFluxWm2, 3),
    parentAlbedoBond: round(albedoBond, 3),
    parentEffectiveTempK: round(parentEffectiveTempK, 1),
    parentReflectedFluxWm2: round(parentReflectedFluxWm2, 4),
    parentThermalFluxWm2: round(parentThermalFluxWm2, 4),
    planetshineFluxWm2: round(planetshineFluxWm2, 4),
    eclipseDutyCycle: round(eclipseDutyCycle, 4),
    eclipseCoolingPenalty,
    criticalInclinationDeg: round(criticalInclinationDeg, 2),
    effectiveAxialTiltDeg,
    synchronousGeometryFactor: round(synchronousGeometryFactor, 3),
  };
}
