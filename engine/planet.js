// Planet model (spreadsheet-faithful port)
//
// Derives physical, orbital, thermal, and atmospheric properties for a
// terrestrial planet from user inputs plus host-star parameters.  Implements
// the PLANET sheet and the temperature / atmosphere sections of the
// Calculations sheet as closely as possible.
//
// Methodology:
//   - Density from mass + core-mass fraction (CMF) via empirical power-law
//     with a floor for sub-Earth masses (< 0.6 M⊕).
//   - Radius, surface gravity, and escape velocity from density + mass.
//   - Surface temperature via a Stefan-Boltzmann effective-temperature chain
//     with greenhouse and surface-divisor corrections.
//   - Atmospheric partial pressures, mean molecular weight, and density from
//     an N₂/O₂/CO₂/Ar gas mix at a given surface pressure.
//   - Circulation cell count keyed to rotation period.
//   - Sky colours from a PanoptesV-inspired lookup table interpolated over
//     star temperature and effective surface pressure (adjusted for
//     gravity/temperature column-density), with CO₂ tint correction.
//     Interpolation uses OKLab colour space for perceptual uniformity.
//
// Inputs:  starMassMsol, starAgeGyr, and a planet object containing mass,
//          CMF, axial tilt, albedo, greenhouse effect, observer height,
//          rotation period, orbital elements, surface pressure, and gas
//          mix percentages.
// Outputs: { star, inputs, derived, display } — clamped inputs echoed back,
//          numeric derived values for downstream use, and pre-formatted
//          display strings for the UI.

import { clamp, fmt, toFinite } from "./utils.js";
import { deriveRockyRingScience } from "./planetaryRings.js";
import { calcStar } from "./star.js";
import { findNearestResonance } from "./debrisDisk.js";
import {
  DIFFERENTIATED_PLANET_K2_SCALE,
  calcRockyPlanetRigidityPa,
  calcRockyPlanetTidalQualityFactor,
} from "./physics/materials.js";
import { calcK2LoveNumber, selectSpinOrbitResonance } from "./physics/rotation.js";
import {
  buildVegetationGradient,
  skyColoursFromSpectralAndPressure,
  vegetationColours,
} from "./planet/appearance.js";
import { calcInsolationEarthRatio } from "./physics/radiative.js";
import {
  analyseVolatiles,
  bodyClass,
  classifyRockySurfaceState,
  classifyClimateState,
  compositionClass,
  suggestedCmfFromMetallicity,
  waterBoilingK,
  waterRadiusInflation,
  waterRegime,
} from "./planet/composition.js";
import {
  atmosphereTideRatio,
  calcRockyOblateness,
  orbitalPeriodEarthYears as calcOrbitalPeriodEarthYears,
  planetMassEarthToKg,
  semiMajorAxisAuToMeters,
  tidalLockTimeGyr,
  totalPlanetTidalHeating,
} from "./planet/orbit.js";
import {
  calcRvSemiAmplitudeMs,
  calcTransitDepthFraction,
  calcTransitProbabilityFraction,
  orbitalDirectionFromInclination,
} from "./physics/orbital.js";
import { magneticFieldModel } from "./planet/magnetism.js";
import {
  applyAtmosphericEscape,
  computeAtmosphereProfile,
  computeExobaseTemp,
  computeGreenhouseTau as calcGreenhouseTau,
  computeJeansEscape,
} from "./planet/atmosphere.js";
import { computePlanetPhotochemistry } from "./planet/photochemistry.js";
import {
  computeAbsorbedFluxWm2,
  computePeriapsisApoapsisTemperatures,
  computePlanetSurfaceTemperature,
  equilibriumTemperatureK,
} from "./planet/temperature.js";
import { computeLockedWorldAtmosphericCollapse } from "./planet/climate.js";
import { calcClimateZones } from "./climate.js";
import {
  tectonicAdvisory,
  tectonicProbabilities as calcTectonicProbabilities,
} from "./planet/tectonics.js";
import { buildPlanetHabitabilityContext } from "./habitability/context.js";
import { evaluateClimateLivability } from "./habitability/stability.js";
import {
  computeEarthSimilarityIndex,
  computePlanetHabitabilityIndex,
} from "./habitability/metrics.js";
import { hydrosphereStateFromPlanet } from "./habitability/hydrosphere.js";
import { formatOceanPhaseDiagnostics } from "./habitability/oceanPhaseDisplay.js";
import { EARTH_INTERNAL_HEAT_FLUX_WM2 } from "./habitability/constants.js";
import { buildPlanetaryEraTimelineForPlanet } from "./planetaryEraTimeline.js";
import {
  buildEnvironmentForcing,
  computeAtmosphereLedger,
  computeBiosignatureContext,
  computeCarbonCycleContext,
  computeClimateChemistryForcing,
  computeCloudCirculationContext,
  computeOceanChemistryContext,
  computeRockyMagnetosphereEnvironment,
  formatEnvironmentForcingSummary,
} from "./environment/index.js";

export { tectonicProbabilities } from "./planet/tectonics.js";
export { computeGreenhouseTau } from "./planet/atmosphere.js";

const PI = Math.PI;

// Constants used by the model (from the reference):
const STAR_MASS_TO_KG = 1.989e30;

const EARTH_RADIUS_KM = 6371;
const EARTH_DENSITY_GCM3 = 5.51; // Earth mean bulk density (g/cm³)
const DAYS_PER_YEAR = 365.256; // Julian year (IAU)

const VELOCITY_EARTH_KMS = 11.186;
const GRAVITY_EARTH_MS2 = 9.81;

// Earth's total internal heat output (~44 TW), used to normalise moon tidal
// heating on the planet.  Scales linearly with mass for other bodies.
const EARTH_INTERNAL_HEAT_W = 44e12;

// Present-day fractional contribution of each isotope to Earth's radiogenic heat.
export const ISOTOPE_HEAT_FRACTIONS = { u238: 0.39, u235: 0.04, th232: 0.4, k40: 0.17 };

// Spin-orbit resonance selection is imported from physics/rotation.js.

function formatOceanDepthKm(depthKm) {
  const depth = Number(depthKm);
  if (!Number.isFinite(depth) || depth <= 0) return null;
  if (depth < 1) return `${fmt(depth * 1000, depth * 1000 >= 100 ? 0 : 1)} m`;
  if (depth < 10) return `${fmt(depth, 2)} km`;
  if (depth < 100) return `${fmt(depth, 1)} km`;
  return `${fmt(depth, 0)} km`;
}

// --- Moon tidal heating on the planet ---

// --- Mantle outgassing model ---
// Ortenzi et al. (2020, Sci. Rep. 10, 10907): mantle redox state
// controls whether outgassing is CO₂+H₂O (oxidised) or H₂+CO (reduced).
const MANTLE_OXIDATION_MAP = {
  "highly-reduced": { deltaIW: -4, primarySpecies: "H\u2082 + CO", label: "Highly reduced" },
  reduced: {
    deltaIW: -2,
    primarySpecies: "H\u2082 + CO\u2082 (mixed)",
    label: "Moderately reduced",
  },
  earth: { deltaIW: 1, primarySpecies: "CO\u2082 + H\u2082O", label: "Earth-like" },
  oxidized: { deltaIW: 3, primarySpecies: "CO\u2082 + H\u2082O + SO\u2082", label: "Oxidized" },
};

function mantleOutgassing(oxidationState) {
  const entry = MANTLE_OXIDATION_MAP[oxidationState] || MANTLE_OXIDATION_MAP.earth;
  let hint;
  if (entry.deltaIW <= -3) {
    // ΔIW ≤ −3: strongly reducing (e.g. enstatite chondrite mantle)
    hint =
      "Reducing mantle produces H\u2082-rich atmospheres with low molecular weight and large scale height.";
  } else if (entry.deltaIW <= -1) {
    // ΔIW −3 to −1: moderately reducing
    hint = "Moderately reducing mantle produces a mix of H\u2082, CO, and CO\u2082.";
  } else if (entry.deltaIW <= 2) {
    // ΔIW −1 to +2: Earth-like oxidizing (IW+1 to IW+3 range)
    hint =
      "Oxidizing mantle produces CO\u2082 and H\u2082O, creating denser, opaque atmospheres typical of Earth/Venus.";
  } else {
    hint =
      "Highly oxidized mantle produces CO\u2082, H\u2082O, and volcanic SO\u2082 (e.g. early Venus).";
  }
  return {
    primarySpecies: entry.primarySpecies,
    oxidationLabel: entry.label,
    atmosphereHint: hint,
  };
}

const GREENHOUSE_SCALE = 0.5841; // calibrated to reproduce Earth T_surf (288 K) from T_eff (255 K)
// Surface divisor: accounts for the temperature difference between the
// atmospheric effective-emission level and the actual surface in the
// presence of convective transport.  Only physically meaningful when an
// atmosphere exists, so it ramps from 1.0 (vacuum) to 0.9 (Earth-like+).
const SURFACE_DIVISOR_MIN = 0.9;

function buildPlanetSummaryResult({
  star,
  hostFrameId,
  massEarth,
  cmfPct,
  wmfPct,
  rotationPeriodHours,
  semiMajorAxisAu,
  eccentricity,
  pressureAtm,
  radioisotopeAbundance,
  densityGcm3,
  radiusEarth,
  gravityG,
  surfaceTempK,
  orbitalPeriodEarthYears,
  orbitalPeriodEarthDays,
  localDaysPerYear,
  transitDepthFraction,
  transitDepthPpm,
  transitProbabilityFraction,
  rvSemiAmplitudeMs,
  oblateness,
  surfaceState,
  rocheLimitKm,
  ringScienceSupported,
  ringScienceReason,
  ringSourceMoonId,
}) {
  return {
    star,
    hostFrameId,
    inputs: {
      massEarth,
      cmfPct,
      wmfPct,
      rotationPeriodHours,
      semiMajorAxisAu,
      eccentricity,
      pressureAtm,
      radioisotopeAbundance,
    },
    derived: {
      densityGcm3,
      radiusEarth,
      gravityG,
      surfaceTempK,
      orbitalPeriodEarthYears,
      orbitalPeriodEarthDays,
      localDaysPerYear,
      transitDepthFraction,
      transitDepthPpm,
      transitProbabilityFraction,
      rvSemiAmplitudeMs,
      oblateness,
      surfaceState,
      rocheLimitKm,
      ringScienceSupported,
      ringScienceReason,
      ringSourceMoonId,
    },
  };
}

/**
 * Calculate comprehensive terrestrial-planet properties from host-star
 * parameters and user-editable planet inputs.  Mirrors the PLANET and
 * Calculations sheets of the WS8 spreadsheet.
 *
 * @param {object}  params
 * @param {number}  params.starMassMsol        Host star mass (M☉)
 * @param {number}  params.starAgeGyr          Host star age (Gyr)
 * @param {number} [params.starMetallicityFeH] Host-star metallicity [Fe/H]
 * @param {object}  params.planet              Planet input fields
 * @param {number}  params.planet.massEarth    Mass (M⊕)
 * @param {number}  params.planet.cmfPct       Core-mass fraction (%)
 * @param {number}  params.planet.axialTiltDeg Axial tilt (degrees, 0–180)
 * @param {number}  params.planet.albedoBond   Bond albedo (0–0.95)
 * @param {number}  params.planet.greenhouseEffect Dimensionless greenhouse factor
 * @param {number}  params.planet.observerHeightM  Observer height (metres)
 * @param {number}  params.planet.rotationPeriodHours Sidereal rotation period (hours)
 * @param {number}  params.planet.semiMajorAxisAu    Semi-major axis (AU)
 * @param {number}  params.planet.eccentricity       Orbital eccentricity (0–0.99)
 * @param {number}  params.planet.inclinationDeg     Orbital inclination (degrees)
 * @param {number}  params.planet.longitudeOfPeriapsisDeg Longitude of periapsis (degrees)
 * @param {number}  params.planet.subsolarLongitudeDeg    Sub-solar longitude (degrees)
 * @param {number}  params.planet.pressureAtm  Surface pressure (atm)
 * @param {number}  params.planet.o2Pct        Oxygen fraction (%)
 * @param {number}  params.planet.co2Pct       CO₂ fraction (%)
 * @param {number}  params.planet.arPct        Argon fraction (%)
 * @param {number} [params.planet.h2oPct=0]    Water vapor fraction (%)
 * @param {number} [params.planet.ch4Pct=0]    Methane fraction (%)
 * @param {number} [params.planet.h2Pct=0]     Hydrogen fraction (%)
 * @param {number} [params.planet.hePct=0]     Helium fraction (%)
 * @param {number} [params.planet.so2Pct=0]    Sulfur dioxide fraction (%)
 * @param {number} [params.planet.nh3Pct=0]    Ammonia fraction (%)
 * @param {string} [params.planet.greenhouseMode="manual"] "core"|"full"|"manual"
 * @returns {object} { star, inputs, derived, display }
 */
export function calcPlanetExact({
  starMassMsol,
  starAgeGyr,
  starMetallicityFeH,
  starRadiusRsolOverride,
  starLuminosityLsolOverride,
  starTempKOverride,
  starEvolutionMode,
  hostFrameId = null,
  hostFrame = null,
  hostXuvFluxEarthAt1Au = null,
  hostPrebioticUvEarthAt1Au = null,
  hostWindPressureEarthAt1Au = null,
  companionFluxEarth = 0,
  companionXuvFluxEarth = 0,
  companionPrebioticUvEarth = 0,
  companionWindPressureEarth = 0,
  fluxVariabilityFraction = 0,
  planet,
  moons,
  gasGiants,
  habitabilityPolicy,
  detailLevel = "full",
}) {
  const star = calcStar({
    massMsol: starMassMsol,
    ageGyr: starAgeGyr,
    metallicityFeH: starMetallicityFeH,
    radiusRsolOverride: starRadiusRsolOverride,
    luminosityLsolOverride: starLuminosityLsolOverride,
    tempKOverride: starTempKOverride,
    evolutionMode: starEvolutionMode,
  });

  // Suggested CMF from stellar metallicity (needed before input resolution)
  const resolvedStarMetallicityFeH = star.inputs?.metallicityFeH ?? toFinite(starMetallicityFeH, 0);
  const suggestedCmf = suggestedCmfFromMetallicity(resolvedStarMetallicityFeH);
  const suggestedCmfPct = suggestedCmf * 100;

  // Inputs (clamped to sensible bounds)
  const massEarth = clamp(planet.massEarth, 0.0001, 1000);
  const cmfIsAuto = planet.cmfPct < 0 || planet.cmfPct == null;
  const cmfPct = cmfIsAuto ? suggestedCmfPct : clamp(planet.cmfPct, 0, 100); // percent
  const wmfPct = clamp(planet.wmfPct ?? 0, 0, 50); // water mass fraction %
  const axialTiltDeg = clamp(planet.axialTiltDeg, 0, 180);

  const albedoBond = clamp(planet.albedoBond, 0, 0.95); // ≤0.95: prevents runaway cooling
  const greenhouseMode = planet.greenhouseMode || "manual";
  const greenhouseEffectManual = clamp(planet.greenhouseEffect, 0, 500); // 500 K max — Venus-like upper bound

  const observerHeightM = clamp(planet.observerHeightM, 0, 10000); // 10 km — above tropopause

  const rotationPeriodHours = clamp(planet.rotationPeriodHours, 0.1, 1e6); // 0.1 h = breakup speed for rocky body
  const semiMajorAxisAu = clamp(planet.semiMajorAxisAu, 0.01, 1e6);
  const eccentricity = clamp(planet.eccentricity, 0, 0.99);
  const inclinationDeg = clamp(planet.inclinationDeg, 0, 180);
  const longitudeOfPeriapsisDeg = clamp(planet.longitudeOfPeriapsisDeg, 0, 360);
  const subsolarLongitudeDeg = clamp(planet.subsolarLongitudeDeg, 0, 360);

  const pressureAtm = clamp(planet.pressureAtm, 0, 100);

  let o2Pct = clamp(planet.o2Pct, 0, 100);
  let co2Pct = clamp(planet.co2Pct, 0, 100);
  let arPct = clamp(planet.arPct, 0, 100);
  let h2oPct = clamp(planet.h2oPct ?? 0, 0, 100);
  let ch4Pct = clamp(planet.ch4Pct ?? 0, 0, 100);
  let h2Pct = clamp(planet.h2Pct ?? 0, 0, 100);
  let hePct = clamp(planet.hePct ?? 0, 0, 100);
  let so2Pct = clamp(planet.so2Pct ?? 0, 0, 100);
  let nh3Pct = clamp(planet.nh3Pct ?? 0, 0, 100);
  const radioisotopeMode = planet.radioisotopeMode || "simple";
  let radioisotopeAbundance;
  if (radioisotopeMode === "advanced") {
    const u238 = clamp(planet.u238Abundance ?? 1, 0, 5);
    const u235 = clamp(planet.u235Abundance ?? 1, 0, 5);
    const th232 = clamp(planet.th232Abundance ?? 1, 0, 5);
    const k40 = clamp(planet.k40Abundance ?? 1, 0, 5);
    radioisotopeAbundance = Math.max(
      u238 * ISOTOPE_HEAT_FRACTIONS.u238 +
        u235 * ISOTOPE_HEAT_FRACTIONS.u235 +
        th232 * ISOTOPE_HEAT_FRACTIONS.th232 +
        k40 * ISOTOPE_HEAT_FRACTIONS.k40,
      0.01,
    );
  } else {
    radioisotopeAbundance = clamp(planet.radioisotopeAbundance ?? 1, 0.1, 3.0);
  }
  // User-friendly guardrail: do not allow derived N2 to go negative.
  // These are from the raw user inputs; if Jeans escape auto-strip is active,
  // they are recomputed below from the effective (post-strip) gas percentages.
  const rawGasInputTotalPct =
    o2Pct + co2Pct + arPct + h2oPct + ch4Pct + h2Pct + hePct + so2Pct + nh3Pct;
  const rawN2PctRaw = 100 - rawGasInputTotalPct;
  const rawGasMixOverflowPct = Math.max(0, rawGasInputTotalPct - 100);
  const rawGasMixClamped = rawGasMixOverflowPct > 0;
  let n2Pct = Math.max(0, rawN2PctRaw);
  const meanCompanionFluxEarth = Math.max(toFinite(companionFluxEarth, 0), 0);
  const meanCompanionXuvFluxEarth = Math.max(toFinite(companionXuvFluxEarth, 0), 0);
  const meanCompanionPrebioticUvEarth = Math.max(toFinite(companionPrebioticUvEarth, 0), 0);
  const meanCompanionWindPressureEarth = Math.max(toFinite(companionWindPressureEarth, 0), 0);
  const hostFrameFluxVariabilityFraction = Math.max(toFinite(fluxVariabilityFraction, 0), 0);

  function effectiveLuminosityAtDistanceAu(distanceAu) {
    const orbitalDistanceAu = Math.max(toFinite(distanceAu, semiMajorAxisAu), 0.01);
    const hostFluxEarth = calcInsolationEarthRatio({
      starLuminosityLsol: star.luminosityLsol,
      orbitalDistanceAu,
    });
    return Math.max((hostFluxEarth + meanCompanionFluxEarth) * orbitalDistanceAu ** 2, 1e-9);
  }

  // Star derived (also present on PLANET sheet)
  const starMassKg = STAR_MASS_TO_KG * starMassMsol;
  const hzInnerAuRaw = Number(
    hostFrame?.zones?.habitableZoneAu?.inner ?? star.habitableZoneAu?.inner,
  );
  const hzOuterAuRaw = Number(
    hostFrame?.zones?.habitableZoneAu?.outer ?? star.habitableZoneAu?.outer,
  );
  const hzInnerAu = Number.isFinite(hzInnerAuRaw) ? hzInnerAuRaw : 0;
  const hzOuterAu = Number.isFinite(hzOuterAuRaw) ? hzOuterAuRaw : 0;

  // Physical characteristics (PLANET C13..C16)
  const cmf = cmfPct / 100;
  const wmf = wmfPct / 100;

  // Radius-first mass–radius relation (Zeng+2016 CMF scaling with
  // mass-dependent compression exponent calibrated to Solar System):
  //   R(M, CMF) = (1.07 − 0.21 × CMF) × M^α
  //   α(M) = min(1/3, 0.257 − 0.0161 × ln M)
  // At low mass α → 1/3 (uncompressed spheres); at M = 1 M⊕ α = 0.257
  // (self-compression). Validated: Mercury 0.3%, Venus 0.8%, Earth 0.2%,
  // Mars 0.5%. Replaces the WS8 density-floor formula (16-21% off for
  // sub-Earth iron-rich bodies).
  const lnM = Math.log(Math.max(massEarth, 1e-6));
  const alpha = Math.min(1 / 3, 0.257 - 0.0161 * lnM); // Zeng+2016 compression exponent fit
  const radiusDry = (1.07 - 0.21 * cmf) * massEarth ** alpha; // Zeng+2016 CMF-scaled radius
  const densityDryGcm3 = (massEarth * EARTH_DENSITY_GCM3) / radiusDry ** 3;

  // Water-layer radius inflation (Zeng+Sasselov 2016 interpolation)
  const waterInflation = waterRadiusInflation(massEarth, wmf);
  const radiusEarth = radiusDry * waterInflation;
  const radiusKm = radiusEarth * EARTH_RADIUS_KM;

  // Effective bulk density (recomputed from inflated radius)
  const densityGcm3 =
    wmf > 0 ? (massEarth * EARTH_DENSITY_GCM3) / radiusEarth ** 3 : densityDryGcm3;

  const gravityG = massEarth / radiusEarth ** 2;
  const gravityMs2 = gravityG * GRAVITY_EARTH_MS2;

  const escapeVelocityVEarth = Math.sqrt(massEarth / radiusEarth);
  const escapeVelocityKms = escapeVelocityVEarth * VELOCITY_EARTH_KMS;

  // ── Jeans escape ──────────────────────────────────────────────────
  // Equilibrium temperature (no greenhouse) — same formula as tEqK below.
  const tEqNoGh = equilibriumTemperatureK(
    effectiveLuminosityAtDistanceAu(semiMajorAxisAu),
    albedoBond,
    semiMajorAxisAu,
  );

  // XUV flux ratio relative to present-day Earth at 1 AU (Ribas et al. 2005)
  const environmentForcing = buildEnvironmentForcing({
    bodyType: "planet",
    solverFamily: "rocky",
    starModel: star,
    starConfig: {
      massMsol: starMassMsol,
      ageGyr: starAgeGyr,
      metallicityFeH: starMetallicityFeH,
      radiusRsolOverride: starRadiusRsolOverride,
      luminosityLsolOverride: starLuminosityLsolOverride,
      tempKOverride: starTempKOverride,
      evolutionMode: starEvolutionMode,
    },
    orbitAu: semiMajorAxisAu,
    eccentricity,
    hostFrame,
    hostFrameId,
    hostXuvFluxEarthAt1Au,
    hostPrebioticUvEarthAt1Au,
    hostWindPressureEarthAt1Au,
    companionFluxEarth: meanCompanionFluxEarth,
    companionXuvFluxEarth: meanCompanionXuvFluxEarth,
    companionPrebioticUvEarth: meanCompanionPrebioticUvEarth,
    companionWindPressureEarth: meanCompanionWindPressureEarth,
    fluxVariabilityFraction: hostFrameFluxVariabilityFraction,
  });
  const fXuvRatio = Math.max(toFinite(environmentForcing.flux?.xuvEarthAtOrbit, 0), 0);
  const prebioticUvTopOfAtmosphereEarth = Math.max(
    toFinite(environmentForcing.flux?.prebioticUvEarthAtOrbit, 0),
    0,
  );
  const prebioticUvTopOfAtmosphereErgCm2S = Math.max(
    toFinite(environmentForcing.flux?.prebioticUvToaAtOrbitErgCm2S, 0),
    0,
  );
  const stellarWind = {
    ramPressureNPa: environmentForcing.wind?.ramPressureNPa ?? null,
    ramPressureEarthRatio: environmentForcing.wind?.ramPressureEarthRatio ?? null,
    hostWindPressureEarthAt1Au: environmentForcing.wind?.hostRamPressureEarthAt1Au ?? null,
    companionWindPressureEarth: environmentForcing.wind?.companionRamPressureEarth ?? 0,
    massLossSolar: environmentForcing.wind?.massLossSolar ?? null,
    windSpeedKms: environmentForcing.wind?.windSpeedKms ?? null,
    confidence: environmentForcing.wind?.confidence || "unsupported",
  };

  // Exobase temperature: XUV-heated thermosphere countered by CO₂ cooling.
  const co2Frac = clamp(planet.co2Pct ?? 0, 0, 100) / 100;
  const exobaseTempK = computeExobaseTemp(tEqNoGh, fXuvRatio, pressureAtm, co2Frac);

  // Per-species Jeans escape analysis
  const jeansSpecies = computeJeansEscape(escapeVelocityKms, exobaseTempK);

  // Auto-strip: when enabled, zero out gases with "Lost" status and recompute
  // N₂ and gas-mix totals.  The original user inputs are preserved in the
  // `inputs` return object; only the physics uses the effective values.
  const atmosphericEscape = !!planet.atmosphericEscape;
  const escapeResult = applyAtmosphericEscape({
    atmosphericEscape,
    jeansSpecies,
    gasPercentages: { o2Pct, co2Pct, arPct, h2oPct, ch4Pct, h2Pct, hePct, so2Pct, nh3Pct },
  });
  const stripped = escapeResult.stripped;
  n2Pct = escapeResult.n2Pct;
  ({ o2Pct, co2Pct, arPct, h2oPct, ch4Pct, h2Pct, hePct, so2Pct, nh3Pct } =
    escapeResult.gasPercentages);

  // Greenhouse mode: compute τ from gases (core/full) or use manual input.
  const isFull = greenhouseMode === "full";
  const computedTau = calcGreenhouseTau({
    pressureAtm,
    co2Pct,
    h2oPct,
    ch4Pct,
    h2Pct,
    n2Pct,
    so2Pct,
    nh3Pct,
    full: isFull,
  });
  const computedGreenhouseEffect = computedTau / GREENHOUSE_SCALE;
  const greenhouseEffect =
    greenhouseMode === "manual" ? greenhouseEffectManual : computedGreenhouseEffect;

  // Temperature chain (Calculations C128..C135)
  const { surfaceTempK: tKel, surfaceTempC: tC } = computePlanetSurfaceTemperature({
    starLuminosityLsol: effectiveLuminosityAtDistanceAu(semiMajorAxisAu),
    albedoBond,
    semiMajorAxisAu,
    greenhouseEffect,
    greenhouseScale: GREENHOUSE_SCALE,
    surfaceDivisorMin: SURFACE_DIVISOR_MIN,
  });

  const orbitalPeriodEarthYears = calcOrbitalPeriodEarthYears(semiMajorAxisAu, starMassMsol); // F36
  const orbitalPeriodEarthDays = orbitalPeriodEarthYears * DAYS_PER_YEAR; // F37
  const localDaysPerYear = (orbitalPeriodEarthDays * 24) / rotationPeriodHours; // C37
  const transitDepthFraction = calcTransitDepthFraction({
    bodyRadiusKm: radiusKm,
    starRadiusKm: star.metric.radiusKm,
  });
  const transitDepthPpm = transitDepthFraction * 1e6;
  const transitProbabilityFraction = calcTransitProbabilityFraction({
    bodyRadiusKm: radiusKm,
    starRadiusKm: star.metric.radiusKm,
    semiMajorAxisAu,
  });
  const rvSemiAmplitudeMs = calcRvSemiAmplitudeMs({
    orbitalPeriodDays: orbitalPeriodEarthDays,
    primaryMassMsol: star.inputs.massMsol,
    secondaryMassKg: planetMassEarthToKg(massEarth),
    eccentricity,
    sinI: 1,
  });
  const oblateness = calcRockyOblateness({
    massEarth,
    radiusKm,
    rotationPeriodHours,
    cmfPct,
    wmfPct,
  });
  const rockyRingScience = deriveRockyRingScience({
    hostRadiusKm: radiusKm,
    hostDensityGcm3: densityGcm3,
    moons,
  });

  // Composition labels
  const compClass = compositionClass(cmf, wmf);
  const bClass = bodyClass(massEarth);
  const watRegime = waterRegime(wmf);

  // Core radius fraction (Zeng & Jacobsen 2017): CRF ≈ CMF^0.5
  const coreRadiusFraction = cmf > 0 ? Math.sqrt(cmf) : 0;
  const coreRadiusKm = coreRadiusFraction * radiusKm;

  // Insolation relative to Earth (L/d²)
  const hostInsolationEarth = calcInsolationEarthRatio({
    starLuminosityLsol: star.luminosityLsol,
    orbitalDistanceAu: semiMajorAxisAu,
  });
  const insolationEarth = hostInsolationEarth + meanCompanionFluxEarth;

  // Habitable zone membership
  const inHabitableZone =
    hzInnerAu > 0 && semiMajorAxisAu >= hzInnerAu && semiMajorAxisAu <= hzOuterAu;

  // Tidal lock to star (composition-dependent rigidity and Q)
  const rigidity = calcRockyPlanetRigidityPa({
    coreMassFraction: cmf,
    waterMassFraction: wmf,
  });
  const qualityFactor = calcRockyPlanetTidalQualityFactor({
    coreMassFraction: cmf,
    waterMassFraction: wmf,
  });
  const radiusM = radiusKm * 1000;
  const densityKgM3 = densityGcm3 * 1000;
  const mPlanetKg = planetMassEarthToKg(massEarth);
  const orbitM = semiMajorAxisAuToMeters(semiMajorAxisAu);
  const omegaPlanet = (2 * PI) / (rotationPeriodHours * 3600);
  const I_planet = oblateness.momentOfInertiaFactor * mPlanetKg * radiusM ** 2;
  const elasticK2Planet = calcK2LoveNumber({
    densityKgM3,
    gravityMs2,
    radiusM,
    rigidityPa: rigidity,
  });
  const k2Planet = elasticK2Planet * DIFFERENTIATED_PLANET_K2_SCALE;
  const tidalLockBodyGyr = tidalLockTimeGyr(
    omegaPlanet,
    orbitM,
    I_planet,
    qualityFactor,
    starMassKg,
    k2Planet,
    radiusM,
  );

  // Atmospheric thermal-tide resistance (Leconte+ 2015).
  // Thick atmospheres generate a pressure-asymmetry torque opposing synchronisation.
  const tEqK = equilibriumTemperatureK(
    effectiveLuminosityAtDistanceAu(semiMajorAxisAu),
    albedoBond,
    semiMajorAxisAu,
  );
  const bAtm = atmosphereTideRatio(pressureAtm, insolationEarth, gravityMs2, tEqK);
  const atmospherePreventsLocking = bAtm >= 1;

  // Effective lock timescale: atmospheric torque slows or prevents despinning.
  const tidalLockStarGyr = atmospherePreventsLocking
    ? Infinity
    : Number.isFinite(tidalLockBodyGyr)
      ? tidalLockBodyGyr / (1 - bAtm)
      : tidalLockBodyGyr;

  // Spin-orbit resonance selection (Goldreich & Peale 1966).
  // When tidally evolved, eccentricity determines which resonance the planet
  // was captured into during despinning (3:2 for Mercury, 1:1 for most).
  const tidallyEvolved =
    !atmospherePreventsLocking &&
    Number.isFinite(tidalLockStarGyr) &&
    tidalLockStarGyr <= starAgeGyr;
  const resonance = tidallyEvolved ? selectSpinOrbitResonance({ eccentricity }) : null;

  // Orbital period in hours (for resonance rotation period)
  // Kepler's third law: P² = a³/M → P = √(a³/M) years
  const orbPeriodYears = calcOrbitalPeriodEarthYears(semiMajorAxisAu, starMassMsol);
  const resonanceRotationHours = resonance
    ? (orbPeriodYears * DAYS_PER_YEAR * 24) / resonance.p
    : null;

  // Only true for 1:1 synchronous lock — higher resonances still illuminate all sides
  const tidallyLockedToStar = tidallyEvolved && resonance.ratio === "1:1";
  const surfaceState = classifyRockySurfaceState({
    surfaceTempK: tKel,
    tidallyLockedToStar,
    bodyClass: bClass,
  });

  if (detailLevel === "summary") {
    return buildPlanetSummaryResult({
      star,
      hostFrameId,
      massEarth,
      cmfPct,
      wmfPct,
      rotationPeriodHours,
      semiMajorAxisAu,
      eccentricity,
      pressureAtm,
      radioisotopeAbundance,
      densityGcm3,
      radiusEarth,
      gravityG,
      surfaceTempK: tKel,
      orbitalPeriodEarthYears,
      orbitalPeriodEarthDays,
      localDaysPerYear,
      transitDepthFraction,
      transitDepthPpm,
      transitProbabilityFraction,
      rvSemiAmplitudeMs,
      oblateness,
      surfaceState,
      rocheLimitKm: rockyRingScience.rocheLimitKm,
      ringScienceSupported: rockyRingScience.ringScienceSupported,
      ringScienceReason: rockyRingScience.ringScienceReason,
      ringSourceMoonId: rockyRingScience.ringSourceMoonId,
    });
  }

  // Moon tidal heating on the planet (Peale et al. 1979, reciprocal formula).
  // Tidal dissipation from orbiting moons heats the planet's interior,
  // potentially extending core liquid lifetime and sustaining the dynamo.
  const planetTidalHeatingW = totalPlanetTidalHeating(
    moons,
    k2Planet,
    qualityFactor,
    mPlanetKg,
    radiusM,
  );
  const surfaceAreaM2 = 4 * PI * radiusM ** 2;
  const planetTidalHeatingWm2 = surfaceAreaM2 > 0 ? planetTidalHeatingW / surfaceAreaM2 : 0;
  const internalHeatW = EARTH_INTERNAL_HEAT_W * massEarth * radioisotopeAbundance;
  const radiogenicHeatingWm2 = surfaceAreaM2 > 0 ? internalHeatW / surfaceAreaM2 : 0;
  const radiogenicHeatingEarth = radiogenicHeatingWm2 / EARTH_INTERNAL_HEAT_FLUX_WM2;
  const planetTidalFraction = internalHeatW > 0 ? planetTidalHeatingW / internalHeatW : 0;

  // Magnetic field model
  const magField = magneticFieldModel({
    cmf,
    massEarth,
    radiusEarth,
    densityGcm3,
    rotationPeriodHours,
    ageGyr: starAgeGyr,
    tidalFraction: planetTidalFraction,
    radioisotopeAbundance,
  });
  const magnetosphereEnvironment = computeRockyMagnetosphereEnvironment({
    surfaceFieldEarths: magField.surfaceFieldEarths,
    fieldMorphology: magField.fieldMorphology,
    windPressureEarthRatio: stellarWind.ramPressureEarthRatio,
    radiusKm,
  });

  // Mantle outgassing and tectonic advisory
  const outgassing = mantleOutgassing(planet.mantleOxidation || "earth");
  const tecProbs = calcTectonicProbabilities(massEarth, starAgeGyr, wmf, cmf, planetTidalFraction);
  const tecRegimeInput = planet.tectonicRegime || "auto";
  const tecRegime = tecRegimeInput === "auto" ? tecProbs.suggested : tecRegimeInput;
  const tecAdvisory = tectonicAdvisory(massEarth, starAgeGyr, wmf, planetTidalFraction);

  // Axial tilt derived text outputs
  const rotationDirection =
    axialTiltDeg === 90
      ? "Undefined"
      : axialTiltDeg >= 0 && axialTiltDeg < 90
        ? "Prograde"
        : "Retrograde";

  const tropics =
    axialTiltDeg < 90 ? `0 - ${fmt(axialTiltDeg, 2)}` : `0 - ${fmt(180 - axialTiltDeg, 2)}`;

  const polarCircles =
    axialTiltDeg < 90
      ? `${fmt(90 - axialTiltDeg, 2)} - 90`
      : `${fmt(90 - (180 - axialTiltDeg), 2)} - 90`;

  // Liquid water check (Clausius-Clapeyron boiling point model)
  const liquidWaterPossible =
    pressureAtm >= 0.006 && tKel >= 273 && tKel <= waterBoilingK(pressureAtm);

  // Absorbed stellar flux (W/m²) — globally averaged after albedo
  const absorbedFluxWm2 = computeAbsorbedFluxWm2(insolationEarth, albedoBond);

  // Climate state classification (snowball / greenhouse flags)
  const climateState = classifyClimateState(tKel, absorbedFluxWm2, watRegime !== "Dry");
  const hydrosphere = hydrosphereStateFromPlanet({
    waterRegime: watRegime,
    wmfPct,
    massEarth,
    radiusKm,
    gravityG,
    surfaceTempK: tKel,
    pressureAtm,
    climateState,
    geothermalFluxWm2: radiogenicHeatingWm2,
    tidalHeatFluxWm2: planetTidalHeatingWm2,
  });
  const oceanPhaseDiagnostics = formatOceanPhaseDiagnostics(hydrosphere);

  // Sky colours (after gravity + temperature are known for column-density correction)
  const sky = skyColoursFromSpectralAndPressure({
    starTempK: star.tempK,
    pressureAtm,
    gravityMs2,
    surfaceTempK: tKel,
    co2Fraction: co2Pct / 100,
  });

  // Vegetation colours (manual override or auto-calculated)
  let veg;
  if (planet.vegOverride && planet.vegPaleHexOverride && planet.vegDeepHexOverride) {
    const pale = planet.vegPaleHexOverride;
    const deep = planet.vegDeepHexOverride;
    veg = {
      paleHex: pale,
      deepHex: deep,
      stops: buildVegetationGradient(pale, deep),
      twilightPaleHex: null,
      twilightDeepHex: null,
      twilightStops: null,
      note: "Manual override",
    };
  } else {
    veg = vegetationColours({
      starTempK: star.tempK,
      pressureAtm,
      insolationEarth,
      tidallyLocked: tidallyLockedToStar,
    });
  }

  // Horizon distance (PLANET C27)
  const horizonKm =
    Math.sqrt(2 * radiusEarth * (EARTH_RADIUS_KM * 1000) * observerHeightM + observerHeightM ** 2) /
    1000;

  // Orbit characteristics (PLANET C34..C37, F36..F37)
  const periapsisAu = semiMajorAxisAu * (1 - eccentricity);
  const apoapsisAu = semiMajorAxisAu * (1 + eccentricity);

  // Equilibrium temperature at periapsis and apoapsis (blackbody + albedo,
  // no greenhouse).  Same formula as tEqK (line above) but substituting
  // the actual distance at orbital extremes.
  const { periapsisK: tEqPeriK } = computePeriapsisApoapsisTemperatures({
    starLuminosityLsol: effectiveLuminosityAtDistanceAu(periapsisAu),
    albedoBond,
    periapsisAu,
    apoapsisAu,
    fallbackK: tEqK,
  });
  const tEqApoResolvedK =
    apoapsisAu > 0
      ? equilibriumTemperatureK(effectiveLuminosityAtDistanceAu(apoapsisAu), albedoBond, apoapsisAu)
      : tEqK;

  // Volatile sublimation analysis (dwarf planets only)
  const isDwarfPlanet = massEarth < 0.01;
  const volatileFlags = isDwarfPlanet ? analyseVolatiles(tEqPeriK, tEqApoResolvedK) : null;

  // Nearest gas giant mean-motion resonance
  const nearestResonance = findNearestResonance(
    semiMajorAxisAu,
    Array.isArray(gasGiants) ? gasGiants : [],
  );

  // "Undefined" is only reached when inclinationDeg === 90 exactly (clamped
  // to [0,180] above), matching the spreadsheet's boundary behaviour.
  const orbitalDirection = orbitalDirectionFromInclination(inclinationDeg);

  // Atmosphere
  const {
    pressureKpa,
    ppO2Atm,
    ppCO2Atm,
    ppArAtm,
    ppN2Atm,
    ppH2OAtm,
    ppCH4Atm,
    ppH2Atm,
    ppHeAtm,
    ppSO2Atm,
    ppNH3Atm,
    ppO2Kpa,
    ppCO2Kpa,
    ppArKpa,
    ppN2Kpa,
    ppH2OKpa,
    ppCH4Kpa,
    ppH2Kpa,
    ppHeKpa,
    ppSO2Kpa,
    ppNH3Kpa,
    atmWeightKgMol,
    atmDensityKgM3,
  } = computeAtmosphereProfile({
    pressureAtm,
    temperatureK: tKel,
    gasPercentages: { o2Pct, co2Pct, arPct, n2Pct, h2oPct, ch4Pct, h2Pct, hePct, so2Pct, nh3Pct },
  });
  const atmosphericCollapse = computeLockedWorldAtmosphericCollapse({
    tidallyLockedToStar,
    pressureAtm,
    equilibriumTempK: tEqK,
    surfaceTempK: tKel,
    gravityG,
    atmospherePartialPressuresAtm: {
      n2: ppN2Atm,
      o2: ppO2Atm,
      co2: ppCO2Atm,
      ar: ppArAtm,
      h2o: ppH2OAtm,
      ch4: ppCH4Atm,
      h2: ppH2Atm,
      he: ppHeAtm,
      so2: ppSO2Atm,
      nh3: ppNH3Atm,
    },
  });
  const photochemistry = computePlanetPhotochemistry({
    pressureAtm,
    xuvFluxRatio: fXuvRatio,
    ppO2Atm,
    ppCH4Atm,
    ppCO2Atm,
    ppN2Atm,
    ppH2Atm,
    ppNH3Atm,
    prebioticUvTopOfAtmosphereErgCm2S,
    surfaceAccessibleLiquidFraction: hydrosphere.surfaceAccessibleLiquidFraction,
    surfaceTempK: tKel,
  });

  // Atmospheric circulation cells (PLANET C60..C67)
  let cellCount = "NA";
  if (rotationPeriodHours >= 48) cellCount = "1";
  else if (rotationPeriodHours >= 6 && rotationPeriodHours < 48) cellCount = "3";
  else if (rotationPeriodHours >= 3 && rotationPeriodHours < 6) cellCount = "7";
  else if (rotationPeriodHours > 0 && rotationPeriodHours < 3) cellCount = "5";

  const cellRanges = [];
  function addCell(n, range) {
    cellRanges.push({ name: `Cell ${n}`, rangeDegNS: range });
  }
  if (cellCount === "1") {
    addCell(1, "0-90");
  } else if (cellCount === "3") {
    addCell(1, "0-30");
    addCell(2, "30-60");
    addCell(3, "60-90");
  } else if (cellCount === "7") {
    addCell(1, "0-24");
    addCell(2, "24-27");
    addCell(3, "27-31");
    addCell(4, "31-41");
    addCell(5, "41-58");
    addCell(6, "58-71");
    addCell(7, "71-90");
  } else if (cellCount === "5") {
    addCell(1, "0-23");
    addCell(2, "23-30");
    addCell(3, "30-47");
    addCell(4, "47-56");
    addCell(5, "56-90°");
  }

  const climateModel = calcClimateZones({
    surfaceTempK: tKel,
    axialTiltDeg,
    circulationCellCount: cellCount,
    circulationCellRanges: cellRanges,
    h2oPct,
    waterRegime: watRegime,
    pressureAtm,
    tidallyLockedToStar,
    compositionClass: compClass,
    liquidWaterPossible,
    climateState,
    insolationEarth,
    gravityG,
  });
  const climateLivability = evaluateClimateLivability({
    zones: climateModel.zones,
    climateState,
    tidallyLockedToStar,
    pressureAtm,
    collapsePenalty: atmosphericCollapse.collapsePenalty,
  });
  const atmosphereLedger = computeAtmosphereLedger({
    bodyType: "planet",
    pressureAtm,
    composition: {
      o2: ppO2Atm,
      co2: ppCO2Atm,
      ar: ppArAtm,
      n2: ppN2Atm,
      h2o: ppH2OAtm,
      ch4: ppCH4Atm,
      h2: ppH2Atm,
      he: ppHeAtm,
      so2: ppSO2Atm,
      nh3: ppNH3Atm,
    },
    environmentForcing,
    magnetosphereEnvironment,
    jeansEscape: {
      species: jeansSpecies,
      xuvFluxRatio: fXuvRatio,
      escapeVelocityVEarth,
      escapeVelocityKmS: escapeVelocityKms,
    },
    atmosphericEscapeEnabled: atmosphericEscape,
    photochemistry,
    hydrosphere,
    climateState,
    climate: {
      climateState,
      collapseState: atmosphericCollapse.collapseState,
      surfaceTempK: tKel,
      climateLivabilityFraction: climateLivability.climateLivabilityFraction,
    },
    outgassing: {
      ...outgassing,
      mantleOxidationKey: planet.mantleOxidation || "earth",
    },
    tectonics: {
      regime: tecRegime,
      probabilities: tecProbs,
      radiogenicHeatingEarth,
      tidalHeatingEarth: planetTidalHeatingWm2 / EARTH_INTERNAL_HEAT_FLUX_WM2,
    },
    surfaceTempK: tKel,
    gravityG,
    escapeVelocityKms,
    escapeVelocityVEarth,
    ageGyr: starAgeGyr,
  });
  const cloudCirculation = computeCloudCirculationContext({
    pressureAtm,
    surfaceWaterFraction: hydrosphere.surfaceAccessibleLiquidFraction,
    surfaceTempK: tKel,
    rotationPeriodHours,
    tidallyLocked: tidallyLockedToStar,
    stellarFluxEarth: insolationEarth,
    hazeSurfaceLightReduction: photochemistry.haze?.surfaceLightReductionFraction,
    atmosphericCollapseState: atmosphericCollapse.collapseState,
    hydrosphere,
    ppH2OAtm,
  });
  const carbonCycleContext = computeCarbonCycleContext({
    surfaceTempK: tKel,
    pressureAtm,
    ppCO2Atm,
    hydrosphere,
    tectonicRegime: tecRegime,
    outgassing: {
      ...outgassing,
      mantleOxidationKey: planet.mantleOxidation || "earth",
    },
    landFraction: hydrosphere.landFraction,
    oceanFraction: hydrosphere.liquidOceanFraction,
    stellarAgeGyr: starAgeGyr,
    insolationEarth,
    climateState,
  });
  const oceanChemistryContext = computeOceanChemistryContext({
    hydrosphere,
    pressureAtm,
    ppCO2Atm,
    carbonCycleContext,
    geology: {
      volcanicActivityScore: tecProbs.mobile * 0.45 + tecProbs.episodic * 0.3,
      tidalHeatingEarth: planetTidalHeatingWm2 / EARTH_INTERNAL_HEAT_FLUX_WM2,
    },
    climateState,
  });
  const biosignatureContext = computeBiosignatureContext({
    pressureAtm,
    composition: {
      o2: ppO2Atm,
      co2: ppCO2Atm,
      ar: ppArAtm,
      n2: ppN2Atm,
      h2o: ppH2OAtm,
      ch4: ppCH4Atm,
      h2: ppH2Atm,
      he: ppHeAtm,
      so2: ppSO2Atm,
      nh3: ppNH3Atm,
      co: 0,
    },
    photochemistry,
    atmosphereLedger,
    carbonCycleContext,
    oceanChemistryContext,
    environmentForcing,
    hydrosphere,
  });
  const climateChemistryForcing = computeClimateChemistryForcing({
    baselineSurfaceTempK: tKel,
    pressureAtm,
    composition: {
      o2: ppO2Atm,
      co2: ppCO2Atm,
      ar: ppArAtm,
      n2: ppN2Atm,
      h2o: ppH2OAtm,
      ch4: ppCH4Atm,
      h2: ppH2Atm,
      he: ppHeAtm,
      so2: ppSO2Atm,
      nh3: ppNH3Atm,
    },
    photochemistry,
    atmosphereLedger,
    hydrosphere,
    cloudContext: cloudCirculation,
    greenhouseTau: computedTau,
  });
  const coupledSurfaceTempK = climateChemistryForcing.coupledSurfaceTempK;

  // Apparent size of star (Calculations C146)
  const apparentStarDeg = (star.radiusRsol / semiMajorAxisAu) * 0.5332;
  const hostFrameCriticalOuterAu = Number(hostFrame?.stability?.criticalOuterAu);
  const hostFrameCriticalInnerAu = Number(hostFrame?.stability?.criticalInnerAu);
  const hostFrameDiskTruncationAu = Number(
    hostFrame?.stability?.diskTruncationAu ?? hostFrame?.zones?.diskTruncationAu,
  );
  const hostFrameCircumbinaryInnerEdgeAu = Number(hostFrame?.stability?.circumbinaryInnerEdgeAu);
  let dynamicalStabilityState = "Stable";
  const dynamicalStabilityNotes = [];
  if (hostFrame?.frameKind === "pair") {
    if (Number.isFinite(hostFrameCriticalInnerAu) && hostFrameCriticalInnerAu > 0) {
      if (semiMajorAxisAu < hostFrameCriticalInnerAu) {
        dynamicalStabilityState = "Likely unstable";
        dynamicalStabilityNotes.push(
          `Orbit lies inside the circumbinary stability floor (${fmt(hostFrameCriticalInnerAu, 3)} AU).`,
        );
      } else if (semiMajorAxisAu < hostFrameCriticalInnerAu * 1.15) {
        dynamicalStabilityState = "Marginal";
        dynamicalStabilityNotes.push(
          `Orbit sits close to the circumbinary stability floor (${fmt(hostFrameCriticalInnerAu, 3)} AU).`,
        );
      }
    }
    if (
      Number.isFinite(hostFrameCircumbinaryInnerEdgeAu) &&
      hostFrameCircumbinaryInnerEdgeAu > 0 &&
      semiMajorAxisAu < hostFrameCircumbinaryInnerEdgeAu
    ) {
      if (dynamicalStabilityState === "Stable") dynamicalStabilityState = "Disk-cleared";
      dynamicalStabilityNotes.push(
        `Orbit lies inside the likely cleared inner circumbinary disk (${fmt(hostFrameCircumbinaryInnerEdgeAu, 3)} AU).`,
      );
    }
    if (Number.isFinite(hostFrameCriticalOuterAu) && hostFrameCriticalOuterAu > 0) {
      if (semiMajorAxisAu > hostFrameCriticalOuterAu) {
        dynamicalStabilityState = "Likely unstable";
        dynamicalStabilityNotes.push(
          `Orbit extends beyond the outer hierarchical stability limit (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
        );
      } else if (semiMajorAxisAu > hostFrameCriticalOuterAu * 0.85) {
        if (dynamicalStabilityState === "Stable") dynamicalStabilityState = "Marginal";
        dynamicalStabilityNotes.push(
          `Orbit sits close to the outer hierarchical stability edge (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
        );
      }
    }
    if (Number.isFinite(hostFrameDiskTruncationAu) && hostFrameDiskTruncationAu > 0) {
      if (semiMajorAxisAu > hostFrameDiskTruncationAu) {
        if (dynamicalStabilityState === "Stable") dynamicalStabilityState = "Disk-truncated";
        dynamicalStabilityNotes.push(
          `Orbit lies beyond the likely truncated outer circumbinary disk (${fmt(hostFrameDiskTruncationAu, 3)} AU).`,
        );
      }
    }
  } else {
    if (Number.isFinite(hostFrameCriticalOuterAu) && hostFrameCriticalOuterAu > 0) {
      if (semiMajorAxisAu > hostFrameCriticalOuterAu) {
        dynamicalStabilityState = "Likely unstable";
        dynamicalStabilityNotes.push(
          `Orbit extends beyond the circumstellar stability limit (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
        );
      } else if (semiMajorAxisAu > hostFrameCriticalOuterAu * 0.85) {
        dynamicalStabilityState = "Marginal";
        dynamicalStabilityNotes.push(
          `Orbit sits close to the circumstellar stability edge (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
        );
      }
    }
    if (Number.isFinite(hostFrameDiskTruncationAu) && hostFrameDiskTruncationAu > 0) {
      if (semiMajorAxisAu > hostFrameDiskTruncationAu) {
        if (dynamicalStabilityState === "Stable") dynamicalStabilityState = "Disk-truncated";
        dynamicalStabilityNotes.push(
          `Orbit lies beyond the likely truncated circumstellar disk (${fmt(hostFrameDiskTruncationAu, 3)} AU).`,
        );
      }
    }
  }
  for (const warning of hostFrame?.stability?.warnings || []) {
    dynamicalStabilityNotes.push(String(warning));
  }

  const habitabilityContext = buildPlanetHabitabilityContext({
    star,
    inputs: {
      massEarth,
      pressureAtm,
      wmfPct,
      mantleOxidation: planet.mantleOxidation || "earth",
    },
    derived: {
      radiusEarth,
      densityGcm3,
      escapeVelocityVEarth,
      surfaceTempK: tKel,
      insolationEarth,
      liquidWaterPossible,
      climateState,
      climateLivabilityFraction: climateLivability.climateLivabilityFraction,
      climateLivabilityScore: climateLivability.climateLivabilityScore,
      climateStatePenalty: climateLivability.climateStatePenalty,
      collapsePenalty: climateLivability.collapsePenalty,
      stabilityMultiplier: climateLivability.stabilityMultiplier,
      atmosphereCollapseRisk: atmosphericCollapse.collapseRisk,
      atmosphereCollapseState: atmosphericCollapse.collapseState,
      atmosphereCollapseThresholdK: atmosphericCollapse.condensationThresholdK,
      nightsideMinK: atmosphericCollapse.nightsideMinK,
      dominantAtmosphereSpecies: atmosphericCollapse.dominantSpeciesLabel,
      waterRegime: watRegime,
      hydrosphere,
      liquidOceanFraction: hydrosphere.liquidOceanFraction,
      landFraction: hydrosphere.landFraction,
      permanentIceFraction: hydrosphere.permanentIceFraction,
      steamFraction: hydrosphere.steamFraction,
      surfaceAccessibleLiquidFraction: hydrosphere.surfaceAccessibleLiquidFraction,
      planetTidalHeatingEarth: planetTidalHeatingWm2 / EARTH_INTERNAL_HEAT_FLUX_WM2,
      radiogenicHeatingWm2,
      radiogenicHeatingEarth,
      surfaceFieldEarths: magField.surfaceFieldEarths,
      magnetosphereEnvironment,
      mantleOxidationKey: planet.mantleOxidation || "earth",
      primaryOutgassedSpecies: outgassing.primarySpecies,
      ppO2Atm,
      ppCO2Atm,
      ppArAtm,
      ppN2Atm,
      ppH2OAtm,
      ppCH4Atm,
      ppH2Atm,
      ppHeAtm,
      ppSO2Atm,
      ppNH3Atm,
      photochemistry,
      jeansEscape: { species: jeansSpecies, xuvFluxRatio: fXuvRatio },
      atmosphereLedger,
      cloudCirculation,
      carbonCycleContext,
      oceanChemistryContext,
      biosignatureContext,
      climateChemistryForcing,
      coupledSurfaceTempK,
    },
  });
  const earthSimilarity = computeEarthSimilarityIndex(habitabilityContext);
  const planetaryHabitability = computePlanetHabitabilityIndex(habitabilityContext, {
    solventPolicy: habitabilityPolicy,
  });

  const result = {
    star,
    hostFrame: hostFrame
      ? {
          id: hostFrame.id,
          label: hostFrame.label,
          frameKind: hostFrame.frameKind,
          orbitFamilyKind: hostFrame.orbitFamilyKind,
        }
      : null,
    inputs: {
      massEarth,
      cmfPct,
      wmfPct,
      axialTiltDeg,
      albedoBond,
      greenhouseEffect: greenhouseEffectManual,
      observerHeightM,
      rotationPeriodHours,
      semiMajorAxisAu,
      eccentricity,
      inclinationDeg,
      longitudeOfPeriapsisDeg,
      subsolarLongitudeDeg,
      pressureAtm,
      o2Pct,
      co2Pct,
      arPct,
      h2oPct,
      ch4Pct,
      h2Pct,
      hePct,
      so2Pct,
      nh3Pct,
      greenhouseMode,
      tectonicRegime: tecRegime,
      mantleOxidation: planet.mantleOxidation || "earth",
      radioisotopeAbundance,
      radioisotopeMode,
      u238Abundance:
        radioisotopeMode === "advanced" ? clamp(planet.u238Abundance ?? 1, 0, 5) : undefined,
      u235Abundance:
        radioisotopeMode === "advanced" ? clamp(planet.u235Abundance ?? 1, 0, 5) : undefined,
      th232Abundance:
        radioisotopeMode === "advanced" ? clamp(planet.th232Abundance ?? 1, 0, 5) : undefined,
      k40Abundance:
        radioisotopeMode === "advanced" ? clamp(planet.k40Abundance ?? 1, 0, 5) : undefined,
    },
    derived: {
      starMassKg,
      starRadiusRsol: star.radiusRsol,
      starLuminosityLsol: star.luminosityLsol,
      hostFrameId,
      hostFrameLabel: hostFrame?.label || null,
      hostFrameKind: hostFrame?.frameKind || null,
      orbitFamilyKind: hostFrame?.orbitFamilyKind || "single",
      hzInnerAu,
      hzOuterAu,
      inHabitableZone,
      hostInsolationEarth,
      companionFluxEarth: meanCompanionFluxEarth,
      companionFluxFraction: insolationEarth > 0 ? meanCompanionFluxEarth / insolationEarth : 0,
      companionXuvFluxEarth: meanCompanionXuvFluxEarth,
      companionPrebioticUvEarth: meanCompanionPrebioticUvEarth,
      prebioticUvTopOfAtmosphereEarth,
      prebioticUvTopOfAtmosphereErgCm2S,
      stellarWind,
      environmentForcing,
      fluxVariabilityFraction: hostFrameFluxVariabilityFraction,
      dynamicalStabilityState,
      dynamicalStabilityNotes,
      criticalOuterAu:
        Number.isFinite(hostFrameCriticalOuterAu) && hostFrameCriticalOuterAu > 0
          ? hostFrameCriticalOuterAu
          : null,
      diskTruncationAu:
        Number.isFinite(hostFrameDiskTruncationAu) && hostFrameDiskTruncationAu > 0
          ? hostFrameDiskTruncationAu
          : null,
      insolationEarth,
      tidalLockStarGyr,
      tidallyLockedToStar,
      tidallyEvolved,
      atmospherePreventsLocking,
      spinOrbitResonance: resonance ? resonance.ratio : null,
      resonanceRotationHours,
      liquidWaterPossible,

      skyColourDayHex: sky.dayHex,
      skyColourDayEdgeHex: sky.dayEdgeHex,
      skyColourHorizonHex: sky.horizonHex,
      skyColourHorizonEdgeHex: sky.horizonEdgeHex,
      skySpectralKey: sky.spectralKey,

      densityGcm3,
      radiusEarth,
      radiusKm,
      gravityG,
      gravityMs2,
      escapeVelocityVEarth,
      escapeVelocityKms,
      rotationDirection,
      tropics,
      polarCircles,

      surfaceTempK: tKel,
      surfaceTempC: tC,
      absorbedFluxWm2,
      climateState,
      climateLivabilityFraction: climateLivability.climateLivabilityFraction,
      climateLivabilityScore: climateLivability.climateLivabilityScore,
      climateStatePenalty: climateLivability.climateStatePenalty,
      collapsePenalty: climateLivability.collapsePenalty,
      stabilityMultiplier: climateLivability.stabilityMultiplier,
      climateStabilityNotes: atmosphericCollapse.evaluated
        ? [...climateLivability.notes, atmosphericCollapse.note]
        : climateLivability.notes,
      atmosphereCollapseRisk: atmosphericCollapse.collapseRisk,
      atmosphereCollapseState: atmosphericCollapse.collapseState,
      atmosphereCollapseThresholdK: atmosphericCollapse.condensationThresholdK,
      nightsideMinK: atmosphericCollapse.nightsideMinK,
      dominantAtmosphereSpecies: atmosphericCollapse.dominantSpeciesLabel,
      hydrosphere,
      liquidOceanFraction: hydrosphere.liquidOceanFraction,
      landFraction: hydrosphere.landFraction,
      permanentIceFraction: hydrosphere.permanentIceFraction,
      steamFraction: hydrosphere.steamFraction,
      surfaceAccessibleLiquidFraction: hydrosphere.surfaceAccessibleLiquidFraction,

      horizonKm,

      periapsisAu,
      apoapsisAu,
      tEqPeriK: Math.round(tEqPeriK),
      tEqApoK: Math.round(tEqApoResolvedK),
      volatileFlags,
      nearestResonance,
      orbitalPeriodEarthYears,
      orbitalPeriodEarthDays,
      localDaysPerYear,
      orbitalDirection,
      rocheLimitKm: rockyRingScience.rocheLimitKm,
      ringScienceSupported: rockyRingScience.ringScienceSupported,
      ringScienceReason: rockyRingScience.ringScienceReason,
      ringSourceMoonId: rockyRingScience.ringSourceMoonId,

      pressureKpa,
      n2Pct,
      n2PctRaw: rawN2PctRaw,
      gasInputTotalPct: rawGasInputTotalPct,
      gasMixOverflowPct: rawGasMixOverflowPct,
      gasMixClamped: rawGasMixClamped,
      greenhouseMode,
      greenhouseEffect,
      computedGreenhouseEffect,
      computedGreenhouseTau: computedTau,

      ppO2Atm,
      ppCO2Atm,
      ppArAtm,
      ppN2Atm,
      ppH2OAtm,
      ppCH4Atm,
      ppH2Atm,
      ppHeAtm,
      ppSO2Atm,
      ppNH3Atm,
      photochemistry,
      atmosphereLedger,
      cloudCirculation,
      carbonCycleContext,
      oceanChemistryContext,
      biosignatureContext,
      climateChemistryForcing,
      coupledSurfaceTempK,
      ppO2Kpa,
      ppCO2Kpa,
      ppArKpa,
      ppN2Kpa,
      ppH2OKpa,
      ppCH4Kpa,
      ppH2Kpa,
      ppHeKpa,
      ppSO2Kpa,
      ppNH3Kpa,
      atmWeightKgMol,
      atmDensityKgM3,

      // Jeans escape
      jeansEscape: {
        exobaseTempK: Math.round(exobaseTempK),
        xuvFluxRatio: fXuvRatio,
        tEqNoGhK: Math.round(tEqNoGh),
        species: jeansSpecies,
        stripped,
        atmosphericEscape,
      },

      circulationCellCount: cellCount,
      circulationCellRanges: cellRanges,

      apparentStarDeg,
      transitDepthFraction,
      transitDepthPpm,
      transitProbabilityFraction,
      rvSemiAmplitudeMs,
      oblateness,

      earthSimilarityIndex: earthSimilarity.score,
      earthSimilarityBreakdown: earthSimilarity.components,
      habitabilityIndex: planetaryHabitability.score,
      habitabilityModelVersion: planetaryHabitability.version,
      habitabilityPolicyVersion: planetaryHabitability.breakdown.solventPolicyVersion,
      habitabilityBreakdown: planetaryHabitability.breakdown,

      // Classification & composition (Phase A)
      bodyClass: bClass,
      surfaceState,
      compositionClass: compClass,
      waterRegime: watRegime,
      coreRadiusFraction,
      coreRadiusKm,
      suggestedCmfPct,
      cmfIsAuto,

      // Magnetic field (Phase B)
      dynamoActive: magField.dynamoActive,
      dynamoReason: magField.dynamoReason,
      coreState: magField.coreState,
      fieldMorphology: magField.fieldMorphology,
      surfaceFieldEarths: magField.surfaceFieldEarths,
      fieldLabel: magField.fieldLabel,
      magnetosphereEnvironment,
      magnetopauseRp: magnetosphereEnvironment.magnetopauseRp,
      magnetopauseKm: magnetosphereEnvironment.magnetopauseKm,
      magnetopauseCompressionClass: magnetosphereEnvironment.compressionClass,
      magnetosphereRadiationShieldingFactor: magnetosphereEnvironment.radiationShieldingFactor,
      planetTidalHeatingW,
      planetTidalHeatingWm2,
      planetTidalFraction,
      planetTidalHeatingEarth: planetTidalHeatingWm2 / EARTH_INTERNAL_HEAT_FLUX_WM2,
      radiogenicHeatingWm2,
      radiogenicHeatingEarth,

      // Mantle & tectonics (Phase C)
      tectonicRegime: tecRegime,
      tectonicSuggested: tecProbs.suggested,
      tectonicProbabilities: tecProbs,
      tectonicAdvisory: tecAdvisory,
      mantleOxidation: outgassing.oxidationLabel,
      primaryOutgassedSpecies: outgassing.primarySpecies,
      outgassingHint: outgassing.atmosphereHint,
      radioisotopeAbundance,

      vegetationPaleHex: veg.paleHex,
      vegetationDeepHex: veg.deepHex,
      vegetationStops: veg.stops,
      vegetationTwilightPaleHex: veg.twilightPaleHex,
      vegetationTwilightDeepHex: veg.twilightDeepHex,
      vegetationTwilightStops: veg.twilightStops,
      vegetationNote: veg.note,
    },
    display: {
      hz: `${fmt(hzInnerAu, 3)} – ${fmt(hzOuterAu, 3)} AU`,
      starRadiusKm: fmt(star.radiusRsol * 696340, 0) + " km",
      starLuminosity: fmt(star.luminosityLsol, 6) + " L☉",
      density: fmt(densityGcm3, 3) + " g/cm³",
      radius: fmt(radiusEarth, 3) + " R⊕",
      gravity: fmt(gravityG, 3) + " g",
      escape: fmt(escapeVelocityKms, 2) + " km/s",
      oblateness: `f = ${fmt(oblateness.flattening, 5)} (J2 = ${fmt(oblateness.j2, 5)})`,
      equatorialPolarRadii: `${fmt(oblateness.equatorialRadiusKm, 0)} km eq / ${fmt(oblateness.polarRadiusKm, 0)} km pol`,
      tempK: fmt(tKel, 0) + " K",
      tempC: fmt(tC, 0) + " °C",
      horizon: fmt(horizonKm, 2) + " km",
      peri: fmt(periapsisAu, 4) + " AU",
      apo: fmt(apoapsisAu, 4) + " AU",
      tempPeri:
        eccentricity > 0.005
          ? fmt(Math.round(tEqPeriK), 0) + " K (" + fmt(Math.round(tEqPeriK) - 273, 0) + " \u00b0C)"
          : null,
      tempApo:
        eccentricity > 0.005
          ? fmt(Math.round(tEqApoResolvedK), 0) +
            " K (" +
            fmt(Math.round(tEqApoResolvedK) - 273, 0) +
            " \u00b0C)"
          : null,
      volatileSummary: volatileFlags
        ? volatileFlags
            .filter((v) => v.canSublimate)
            .map((v) => v.note)
            .join("; ") || "All surface ices stable"
        : null,
      resonance: nearestResonance
        ? `${nearestResonance.label} (${fmt(nearestResonance.resonanceAu, 3)} AU, ${fmt(nearestResonance.deltaPct * 100, 1)}% off)`
        : "No nearby resonance",
      rocheLimit:
        rockyRingScience.rocheLimitKm > 0
          ? `${fmt(rockyRingScience.rocheLimitKm, 0)} km`
          : "\u2014",
      yearDays: fmt(orbitalPeriodEarthDays, 2) + " days",
      localDays: fmt(localDaysPerYear, 2) + " local days",
      transitDepth:
        `${fmt(transitDepthFraction * 100, transitDepthFraction * 100 >= 0.1 ? 2 : 4)}%` +
        ` (${fmt(transitDepthPpm, 0)} ppm)`,
      transitProbability: `${fmt(transitProbabilityFraction * 100, 2)}% geometric probability`,
      rvSemiAmplitude:
        rvSemiAmplitudeMs >= 1000
          ? `${fmt(rvSemiAmplitudeMs / 1000, 3)} km/s`
          : `${fmt(rvSemiAmplitudeMs, rvSemiAmplitudeMs >= 10 ? 2 : 3)} m/s`,
      pressureKpa: fmt(pressureKpa, 2) + " kPa",
      atmWeight: fmt(atmWeightKgMol, 5) + " kg/mol",
      atmDensity: fmt(atmDensityKgM3, 4) + " kg/m³",
      apparentStar: fmt(apparentStarDeg, 3) + "°",
      earthSimilarityIndex: earthSimilarity.score.toFixed(3),
      habitabilityIndex: planetaryHabitability.score.toFixed(3),
      uvShielding: photochemistry.uvShieldingClass,
      ozoneColumn: `${fmt(photochemistry.ozoneColumnDobsonUnits, 0)} DU (${fmt(photochemistry.ozoneEarthRatio, 2)}x Earth)`,
      photochemicalStability: photochemistry.stabilityClass,
      prebioticUvWindow: photochemistry.prebioticUv?.label || "Not evaluated",
      prebioticUvFlux: photochemistry.prebioticUv
        ? `${fmt(photochemistry.prebioticUv.surfaceFluxErgCm2S, photochemistry.prebioticUv.surfaceFluxErgCm2S >= 100 ? 0 : 2)} erg/cm^2/s surface (${fmt(photochemistry.prebioticUv.topOfAtmosphereFluxErgCm2S, photochemistry.prebioticUv.topOfAtmosphereFluxErgCm2S >= 100 ? 0 : 2)} TOA)`
        : "Not evaluated",
      photochemicalHaze: photochemistry.haze?.hazeClass || "None",
      hazeCooling: photochemistry.haze
        ? `${fmt(photochemistry.haze.antiGreenhouseCoolingK, 1)} K potential`
        : "0.0 K potential",
      surfaceLightReduction: photochemistry.haze
        ? `${fmt(photochemistry.haze.surfaceLightReductionFraction * 100, 1)}% reduction`
        : "0.0% reduction",
      coupledClimateTendency: climateChemistryForcing.labelOnlyClimateState,
      photochemicalForcing:
        climateChemistryForcing.netDeltaK === 0
          ? "0 K diagnostic"
          : `${climateChemistryForcing.netDeltaK > 0 ? "+" : ""}${fmt(climateChemistryForcing.netDeltaK, 1)} K diagnostic`,
      coupledSurfaceTemp: `${fmt(coupledSurfaceTempK, 0)} K (${fmt(coupledSurfaceTempK - 273.15, 0)} °C)`,
      cloudRegime: cloudCirculation.circulationRegime,
      heatRedistribution: `${fmt(cloudCirculation.heatRedistributionEfficiency * 100, 0)}% efficiency`,
      cloudAlbedoEffect: `${fmt(cloudCirculation.cloudAlbedoEffect * 100, 1)}% diagnostic`,
      carbonCycle: carbonCycleContext.tendencyClass,
      weatheringEfficiency: fmt(carbonCycleContext.weatheringEfficiency, 2),
      volcanicSupply: fmt(carbonCycleContext.volcanicSupply, 2),
      carbonRecycling: fmt(carbonCycleContext.recyclingEfficiency, 2),
      carbonThermostat: fmt(carbonCycleContext.thermostatStrength, 2),
      oceanChemistry: oceanChemistryContext.summaryLabel,
      oceanAcidity: oceanChemistryContext.acidityClass,
      carbonateSaturation: oceanChemistryContext.carbonateSaturationClass,
      nutrientSupport: oceanChemistryContext.nutrientSupportClass,
      biosignatureContext: biosignatureContext.interpretationClass,
      disequilibriumStrength: biosignatureContext.disequilibriumStrength,
      oxygenFalsePositiveRisk: biosignatureContext.o2O3FalsePositiveRisk,
      methaneContext: biosignatureContext.methaneContext,
      coBuildupRisk: biosignatureContext.coBuildupRisk,
      atmosphereTrend: atmosphereLedger.trendLabel,
      atmosphereDominantSource: atmosphereLedger.dominantSource?.label || "None",
      atmosphereDominantSink: atmosphereLedger.dominantSink?.label || "None",
      atmosphereStabilityTimescale: atmosphereLedger.timescaleLabel,
      insolation: fmt(insolationEarth, 3) + "× Earth",
      companionFlux:
        hostFrame?.frameKind === "pair"
          ? "Included in host pair"
          : meanCompanionFluxEarth > 0
            ? `${fmt(meanCompanionFluxEarth, 3)}× Earth (${fmt((meanCompanionFluxEarth / Math.max(insolationEarth, 1e-9)) * 100, 1)}%)`
            : "Negligible",
      environmentForcing: formatEnvironmentForcingSummary(environmentForcing),
      stellarWindPressure:
        stellarWind.ramPressureNPa != null
          ? `${fmt(stellarWind.ramPressureNPa, stellarWind.ramPressureNPa >= 10 ? 1 : 2)} nPa (${fmt(stellarWind.ramPressureEarthRatio, 2)}× Earth)`
          : "Unsupported",
      fluxVariability:
        hostFrameFluxVariabilityFraction > 0
          ? `${fmt(hostFrameFluxVariabilityFraction * 100, 1)}%`
          : "Low",
      dynamicalStability: dynamicalStabilityState,
      tidalLock: atmospherePreventsLocking
        ? "Atmosphere-stabilised"
        : tidallyLockedToStar
          ? "Synchronous (1:1)"
          : tidallyEvolved
            ? `Spin-orbit resonance (${resonance.ratio})`
            : fmt(tidalLockStarGyr, 2) + " Gyr to despinning",
      atmosphericCollapse: atmosphericCollapse.collapseState,
      nightsideMin: atmosphericCollapse.evaluated
        ? `${fmt(atmosphericCollapse.nightsideMinK, 0)} K`
        : "Not evaluated",
      collapseThreshold: atmosphericCollapse.evaluated
        ? `${fmt(atmosphericCollapse.condensationThresholdK, 0)} K (${atmosphericCollapse.dominantSpeciesLabel})`
        : "Not evaluated",
      bodyClass: bClass,
      surfaceState: surfaceState.label,
      compositionClass: compClass,
      waterRegime: watRegime,
      meanOceanDepth: formatOceanDepthKm(hydrosphere.estimatedMeanOceanDepthKm),
      oceanPhaseDiagnostics: oceanPhaseDiagnostics?.text ?? null,
      oceanPhaseDiagnosticLines: oceanPhaseDiagnostics?.lines ?? [],
      climateState,
      absorbedFlux: fmt(absorbedFluxWm2, 1) + " W/m\u00b2",
      coreRadius: `${fmt(coreRadiusFraction, 2)} R (${fmt(coreRadiusKm, 0)} km)`,
      suggestedCmf: `~${fmt(suggestedCmfPct, 0)}%`,
      suggestedCmfNote:
        resolvedStarMetallicityFeH === 0
          ? "solar metallicity"
          : `[Fe/H] ${resolvedStarMetallicityFeH > 0 ? "+" : ""}${fmt(resolvedStarMetallicityFeH, 2)}, ${resolvedStarMetallicityFeH > 0 ? "iron-rich" : "iron-poor"}`,
      cmfIsAuto,
      magneticField: magField.dynamoActive
        ? `${magField.fieldLabel} (${fmt(magField.surfaceFieldEarths, 2)}\u00d7 Earth)`
        : "None",
      fieldMorphology:
        magField.fieldMorphology === "none"
          ? "\u2014"
          : magField.fieldMorphology.charAt(0).toUpperCase() + magField.fieldMorphology.slice(1),
      magnetopause: magnetosphereEnvironment.supported
        ? `${fmt(magnetosphereEnvironment.magnetopauseRp, 2)} Rp (${fmt(magnetosphereEnvironment.magnetopauseKm, 0)} km)`
        : "Unsupported / collapsed",
      windCompression: magnetosphereEnvironment.supported
        ? `${magnetosphereEnvironment.compressionClass} (${fmt(magnetosphereEnvironment.windPressureEarthRatio, 2)}\u00d7 Earth wind)`
        : magnetosphereEnvironment.compressionClass,
      outgassing: outgassing.primarySpecies,
      moonTidalHeating:
        planetTidalHeatingWm2 / EARTH_INTERNAL_HEAT_FLUX_WM2 >= 0.01
          ? `${fmt(planetTidalHeatingWm2 / EARTH_INTERNAL_HEAT_FLUX_WM2, 2)}\u00d7 Earth geothermal`
          : null,
      radiogenicHeating:
        radiogenicHeatingEarth >= 0.01
          ? `${fmt(radiogenicHeatingEarth, 2)}\u00d7 Earth radiogenic`
          : null,
      tectonicRegime:
        tecRegime === "plutonic-squishy"
          ? "Plutonic-Squishy"
          : tecRegime.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      tectonicIsAuto: tecRegimeInput === "auto",
      radioisotopeAbundance:
        radioisotopeAbundance === 1
          ? "Earth (1.0\u00d7)"
          : fmt(radioisotopeAbundance, 2) + "\u00d7 Earth",
    },
  };

  const eraTimeline = buildPlanetaryEraTimelineForPlanet({
    model: result,
    star,
    systemContext: { starAgeGyr, starMassMsol },
  });
  result.derived.eraTimeline = eraTimeline;
  result.display.eraTimelineSummary = eraTimeline.summary;

  return result;
}
