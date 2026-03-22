import { clamp, fmt, round, toFinite } from "./utils.js";
import { calcBrownDwarf } from "./brownDwarf.js";
import { findNearestResonance } from "./debrisDisk.js";
import { calcDynamics, calcOblateness } from "./gasGiant/dynamics.js";
import {
  calcMassLoss,
  computeGasGiantExobaseTemp,
  computeGasGiantJeansEscape,
} from "./gasGiant/escape.js";
import { calcMagnetic } from "./gasGiant/magnetism.js";
import { gasGiantK2, gasGiantTidalQ, totalGasGiantTidalHeating } from "./gasGiant/moonEffects.js";
import { calcRingProperties } from "./gasGiant/rings.js";
import {
  calcAgeRadiusCorrection,
  calcInterior,
  estimateMetallicity,
  getAtmosphere,
  massToRadiusRj,
  radiusToMassMjup,
  stellarMetallicityScaleFromFeH,
} from "./gasGiant/structure.js";
import { computeThermalProfile, getClouds } from "./gasGiant/temperature.js";
import { calcTidalEffects } from "./gasGiant/tides.js";
import {
  auToKilometers,
  calcRvSemiAmplitudeMs,
  calcOrbitalPeriodDaysKepler,
  calcOrbitalPeriodYearsKepler,
  calcTransitDepthFraction,
  calcTransitProbabilityFraction,
  orbitalDirectionFromInclination,
} from "./physics/orbital.js";
import { calcStellarFluxWm2 } from "./physics/radiative.js";
import { selectSpinOrbitResonance } from "./physics/rotation.js";
import {
  BROWN_DWARF_MAX_MJUP,
  BROWN_DWARF_MIN_MJUP,
  classifyCompanionRegimeByMass,
  getInsolationZoneLabelForRegime,
  massMjupToMsol,
  normalizeGiantCompanionClass,
} from "./substellarRegime.js";

export { estimateMetallicity, massToRadiusRj, radiusToMassMjup } from "./gasGiant/structure.js";

const G = 6.674e-11;
const JUPITER_MASS_KG = 1.8982e27;
const JUPITER_RADIUS_KM = 69911;
const EARTH_RADIUS_KM = 6371;
const EARTH_MASS_PER_MJUP = 317.83;
const MSOL_PER_MJUP = 1047.35;
const EARTH_GRAVITY_MS2 = 9.80665;
const ICE_GIANT_MASS_MJUP = 0.15;
const SIGMA_SB = 5.670374419e-8;
const BROWN_DWARF_DEFAULT_MASS_MJUP = 20;
const BROWN_DWARF_RADIUS_MIN_RJ = 0.78;
const BROWN_DWARF_RADIUS_MAX_RJ = 1.15;

function buildGasGiantSummaryResult({
  regime = "gasGiant",
  companionClass = "gasGiant",
  hostFrameId,
  hostFrame,
  massMjup,
  radiusRj,
  orbitAu,
  eccentricity,
  inclinationDeg,
  axialTiltDeg,
  rotationPeriodHours,
  massSource,
  radiusSource,
  metallicitySource,
  massEarth,
  massKg,
  radiusKm,
  radiusEarth,
  densityGcm3,
  gravityMs2,
  gravityG,
  escapeVelocityKms,
  effectiveTempK,
  equilibriumTempK,
  ringType,
  orbitalPeriodYears,
  orbitalPeriodDays,
  transitDepthFraction,
  transitDepthPpm,
  transitProbabilityFraction,
  rvSemiAmplitudeMs,
}) {
  return {
    regime,
    companionClass,
    hostFrame: hostFrame
      ? {
          id: hostFrame.id,
          label: hostFrame.label,
          frameKind: hostFrame.frameKind,
          orbitFamilyKind: hostFrame.orbitFamilyKind,
        }
      : null,
    inputs: {
      hostFrameId,
      massMjup,
      radiusRj,
      orbitAu,
      eccentricity,
      inclinationDeg,
      axialTiltDeg,
      rotationPeriodHours,
      massSource,
      radiusSource,
      metallicitySource,
    },
    physical: {
      massEarth: round(massEarth, 2),
      massMjup: round(massMjup, 4),
      massKg,
      radiusKm: round(radiusKm, 0),
      radiusEarth: round(radiusEarth, 3),
      radiusRj: round(radiusRj, 3),
      densityGcm3: round(densityGcm3, 4),
      gravityMs2: round(gravityMs2, 2),
      gravityG: round(gravityG, 3),
      escapeVelocityKms: round(escapeVelocityKms, 2),
    },
    thermal: {
      equilibriumTempK: round(equilibriumTempK, 1),
      effectiveTempK: round(effectiveTempK, 1),
    },
    ringProperties: {
      ringType,
    },
    orbital: {
      orbitalPeriodYears: round(orbitalPeriodYears, 4),
      orbitalPeriodDays: round(orbitalPeriodDays, 2),
    },
    detection: {
      transitDepthFraction: round(transitDepthFraction, 8),
      transitDepthPpm: round(transitDepthPpm, 2),
      transitProbabilityFraction: round(transitProbabilityFraction, 6),
      rvSemiAmplitudeMs: round(rvSemiAmplitudeMs, 4),
    },
  };
}

function resolveGiantCompanionClass(companionClass, rawMass) {
  const explicit = normalizeGiantCompanionClass(companionClass);
  const mass = Number(rawMass);
  if (Number.isFinite(mass) && mass > 0) {
    return classifyCompanionRegimeByMass({
      massMjup: clamp(mass, 0.01, BROWN_DWARF_MAX_MJUP),
    }) === "gasGiant"
      ? "gasGiant"
      : "brownDwarf";
  }
  return explicit;
}

function buildBrownDwarfClouds(spectralFamily) {
  if (spectralFamily === "L") {
    return [{ name: "Silicate / iron condensates" }, { name: "Patchy mineral clouds" }];
  }
  if (spectralFamily === "T") {
    return [{ name: "Methane haze" }, { name: "Sulfide condensates" }];
  }
  return [{ name: "Water / ammonia ice haze" }];
}

function buildBrownDwarfAtmosphere(spectralFamily) {
  if (spectralFamily === "L") {
    return {
      h2Pct: 74,
      hePct: 25,
      ch4Pct: 0,
      nh3Pct: 0,
      h2oPct: 0.2,
      coPct: 0.8,
      dominantTrace: "Silicate / iron condensates",
      metallicitySolar: 1,
    };
  }
  if (spectralFamily === "T") {
    return {
      h2Pct: 73,
      hePct: 25,
      ch4Pct: 1.4,
      nh3Pct: 0.05,
      h2oPct: 0.2,
      coPct: 0.1,
      dominantTrace: "Methane",
      metallicitySolar: 1,
    };
  }
  return {
    h2Pct: 71,
    hePct: 26,
    ch4Pct: 1.2,
    nh3Pct: 0.6,
    h2oPct: 0.4,
    coPct: 0,
    dominantTrace: "Ammonia / water ice",
    metallicitySolar: 1,
  };
}

function buildBrownDwarfRingProperties() {
  return {
    ringType: "None",
    ringComposition: "None",
    opticalDepth: 0,
    opticalDepthClass: "None",
    estimatedMassKg: 0,
  };
}

function fieldLabelFromEarths(surfaceFieldEarths) {
  if (surfaceFieldEarths > 50) return "Extremely strong";
  if (surfaceFieldEarths > 10) return "Very strong";
  if (surfaceFieldEarths > 2) return "Strong";
  if (surfaceFieldEarths > 0.3) return "Moderate";
  if (surfaceFieldEarths > 0.05) return "Weak";
  return "Very weak";
}

function calcBrownDwarfMagnetic({ massMjup, radiusKm, orbitAu, ageGyr }) {
  const surfaceFieldGauss = clamp(
    700 * (Math.max(massMjup, BROWN_DWARF_MIN_MJUP) / 30) ** 0.45 * (5 / (ageGyr + 0.5)) ** 0.1,
    180,
    4200,
  );
  const surfaceFieldEarths = surfaceFieldGauss / 0.31;
  const magnetopauseRp = clamp(
    24 * (surfaceFieldGauss / 1000) ** (1 / 3) * Math.max(orbitAu, 0.05) ** (1 / 3),
    18,
    140,
  );
  return {
    dynamoActive: true,
    dynamoReason: "Active substellar dynamo",
    fieldMorphology: "dipolar auroral",
    fieldLabel: fieldLabelFromEarths(surfaceFieldEarths),
    surfaceFieldGauss: round(surfaceFieldGauss, 3),
    surfaceFieldEarths: round(surfaceFieldEarths, 2),
    shellRatio: 0.95,
    conductivityRegime: "degenerate / metallic interior",
    effectiveFluxWm2: null,
    dipoleMomentAm2: null,
    magnetopauseRp: round(magnetopauseRp, 1),
    magnetopauseKm: round(magnetopauseRp * radiusKm, 0),
    sputteringPlasmaW: 0,
  };
}

function buildBrownDwarfJeansDisplay(escapeVelocityKms, exobaseTempK, xuvFluxRatioEarth) {
  const species = computeGasGiantJeansEscape(escapeVelocityKms, exobaseTempK);
  let text =
    `Retention check (T_exo ${fmt(round(exobaseTempK, 0), 0)} K, XUV ${fmt(round(xuvFluxRatioEarth, 2), 2)}x Earth):`;
  for (const speciesEntry of Object.values(species)) {
    const nonThermalTag = speciesEntry.nonThermal ? " (non-thermal)" : "";
    text += `\n  ${speciesEntry.label}: lambda=${fmt(speciesEntry.lambda, 1)} - ${speciesEntry.status}${nonThermalTag}`;
  }
  return { text, species };
}

function calcBrownDwarfCompanion({
  companionClass = "brownDwarf",
  massMjup: rawMass,
  radiusRj: rawRadius,
  orbitAu,
  eccentricity: rawEcc,
  inclinationDeg: rawIncl,
  axialTiltDeg: rawTilt,
  rotationPeriodHours,
  starMassMsol,
  starLuminosityLsol,
  starAgeGyr,
  starRadiusRsol,
  hostFrameId = null,
  hostFrame = null,
  hostXuvFluxEarthAt1Au = null,
  companionFluxEarth = 0,
  companionXuvFluxEarth = 0,
  fluxVariabilityFraction = 0,
  otherGiants,
  moons,
  detailLevel = "full",
}) {
  const orbit = clamp(toFinite(orbitAu, 5.2), 0.01, 1e6);
  const eccentricity = clamp(toFinite(rawEcc, 0), 0, 0.99);
  const inclinationDeg = clamp(toFinite(rawIncl, 0), 0, 180);
  const axialTiltDeg = clamp(toFinite(rawTilt, 0), 0, 180);
  const rot = clamp(toFinite(rotationPeriodHours, 10), 1, 500);
  const sMass = clamp(toFinite(starMassMsol, 1), 0.012, 100);
  const sLum = Math.max(1e-9, toFinite(starLuminosityLsol, 1));
  const sRadius = Math.max(0.01, toFinite(starRadiusRsol, 1));
  const sAge = clamp(toFinite(starAgeGyr, 4.6), 0.01, 20);
  const meanCompanionFluxEarth = Math.max(toFinite(companionFluxEarth, 0), 0);
  const meanCompanionXuvFluxEarth = Math.max(toFinite(companionXuvFluxEarth, 0), 0);
  const resolvedHostXuvFluxEarthAt1Au = toFinite(hostXuvFluxEarthAt1Au, null);
  const hostFrameFluxVariabilityFraction = Math.max(toFinite(fluxVariabilityFraction, 0), 0);
  const companionKind = resolveGiantCompanionClass(companionClass, rawMass);
  const giantMoons = Array.isArray(moons) ? moons : [];

  const hasMass = rawMass != null && Number.isFinite(Number(rawMass)) && Number(rawMass) > 0;
  const hasRadius =
    rawRadius != null && Number.isFinite(Number(rawRadius)) && Number(rawRadius) > 0;
  const massMjup = hasMass
    ? clamp(Number(rawMass), BROWN_DWARF_MIN_MJUP, BROWN_DWARF_MAX_MJUP)
    : BROWN_DWARF_DEFAULT_MASS_MJUP;
  const radiusOverrideRsol = hasRadius
    ? (clamp(Number(rawRadius), BROWN_DWARF_RADIUS_MIN_RJ, BROWN_DWARF_RADIUS_MAX_RJ) *
        JUPITER_RADIUS_KM) /
      696340
    : null;
  const brownDwarf = calcBrownDwarf({
    massMsol: massMjupToMsol(massMjup),
    ageGyr: sAge,
    radiusRsolOverride: radiusOverrideRsol,
  });
  const radiusRj = clamp(brownDwarf.radiusRj, BROWN_DWARF_RADIUS_MIN_RJ, BROWN_DWARF_RADIUS_MAX_RJ);
  const radiusKm = brownDwarf.metric.radiusKm;
  const radiusEarth = brownDwarf.radiusRj * (JUPITER_RADIUS_KM / EARTH_RADIUS_KM);
  const massEarth = massMjup * EARTH_MASS_PER_MJUP;
  const massKg = massMjup * JUPITER_MASS_KG;
  const radiusM = radiusKm * 1000;
  const gravityMs2 = (G * massKg) / radiusM ** 2;
  const gravityG = gravityMs2 / EARTH_GRAVITY_MS2;
  const escapeVelocityMs = Math.sqrt((2 * G * massKg) / radiusM);
  const escapeVelocityKms = escapeVelocityMs / 1000;
  const densityGcm3 = brownDwarf.densityGcm3;
  const intrinsicTempK = brownDwarf.tempK;
  const bondAlbedo = brownDwarf.spectralFamily === "L" ? 0.08 : brownDwarf.spectralFamily === "T" ? 0.06 : 0.03;

  function totalLuminosityAtDistanceAu(distanceAu) {
    const orbitalDistanceAu = Math.max(toFinite(distanceAu, orbit), 0.01);
    return Math.max(
      (sLum / orbitalDistanceAu ** 2 + meanCompanionFluxEarth) * orbitalDistanceAu ** 2,
      1e-9,
    );
  }

  function equilibriumTempAtDistanceAu(distanceAu) {
    const incidentFlux = calcStellarFluxWm2({
      starLuminosityLsol: totalLuminosityAtDistanceAu(distanceAu),
      orbitalDistanceAu: Math.max(toFinite(distanceAu, orbit), 0.01),
    });
    return ((Math.max(incidentFlux, 0) * (1 - bondAlbedo)) / (4 * SIGMA_SB)) ** 0.25;
  }

  const incidentFluxWm2 = calcStellarFluxWm2({
    starLuminosityLsol: totalLuminosityAtDistanceAu(orbit),
    orbitalDistanceAu: orbit,
  });
  const equilibriumTempK = equilibriumTempAtDistanceAu(orbit);
  const internalFluxWm2 = SIGMA_SB * intrinsicTempK ** 4;
  const ihRatio = incidentFluxWm2 > 0 ? internalFluxWm2 / incidentFluxWm2 : internalFluxWm2;
  const surfaceAreaM2 = 4 * Math.PI * radiusM ** 2;
  const bdK2 = 0.45;
  const bdQ = 3e5;
  const moonTidalHeatingW = totalGasGiantTidalHeating(giantMoons, bdK2, bdQ, massKg, radiusM);
  const moonTidalHeatingWm2 = surfaceAreaM2 > 0 ? moonTidalHeatingW / surfaceAreaM2 : 0;
  const moonTidalFraction = internalFluxWm2 > 0 ? moonTidalHeatingWm2 / internalFluxWm2 : 0;

  const periapsisAu = orbit * (1 - eccentricity);
  const apoapsisAu = orbit * (1 + eccentricity);
  const teqPeriK = eccentricity > 0 ? equilibriumTempAtDistanceAu(periapsisAu) : equilibriumTempK;
  const teqApoK = eccentricity > 0 ? equilibriumTempAtDistanceAu(apoapsisAu) : equilibriumTempK;
  const insolationEarth = round(sLum / orbit ** 2 + meanCompanionFluxEarth, 4);

  const massRatio = massMjup / (sMass * MSOL_PER_MJUP);
  const hillSphereAu = orbit * (massRatio / 3) ** (1 / 3);
  const hillSphereKm = auToKilometers(hillSphereAu);
  const rocheLimitIceKm = 2.44 * radiusKm * (densityGcm3 / 0.9) ** (1 / 3);
  const rocheLimitRockKm = 2.44 * radiusKm * (densityGcm3 / 3.0) ** (1 / 3);
  const chaoticZoneHalfAu = orbit * 1.3 * massRatio ** (2 / 7);
  const ringProperties = buildBrownDwarfRingProperties();
  const orbitalPeriodYears = calcOrbitalPeriodYearsKepler({
    semiMajorAxisAu: orbit,
    centralMassMsol: sMass,
  });
  const orbitalPeriodDays = calcOrbitalPeriodDaysKepler({
    semiMajorAxisAu: orbit,
    centralMassMsol: sMass,
    daysPerYear: 365.25,
  });
  const transitDepthFraction = calcTransitDepthFraction({
    bodyRadiusKm: radiusKm,
    starRadiusKm: sRadius * 696340,
  });
  const transitDepthPpm = transitDepthFraction * 1e6;
  const transitProbabilityFraction = calcTransitProbabilityFraction({
    bodyRadiusKm: radiusKm,
    starRadiusKm: sRadius * 696340,
    semiMajorAxisAu: orbit,
  });
  const rvSemiAmplitudeMs = calcRvSemiAmplitudeMs({
    orbitalPeriodDays,
    primaryMassMsol: sMass,
    secondaryMassKg: massKg,
    eccentricity,
    sinI: 1,
  });

  if (detailLevel === "summary") {
    return buildGasGiantSummaryResult({
      regime: "brownDwarf",
      companionClass: companionKind,
      hostFrameId,
      hostFrame,
      massMjup,
      radiusRj,
      orbitAu: orbit,
      eccentricity,
      inclinationDeg,
      axialTiltDeg,
      rotationPeriodHours: rot,
      massSource: hasMass ? "user" : "default",
      radiusSource: hasRadius ? "user" : "derived",
      metallicitySource: "derived",
      massEarth,
      massKg,
      radiusKm,
      radiusEarth,
      densityGcm3,
      gravityMs2,
      gravityG,
      escapeVelocityKms,
      effectiveTempK: intrinsicTempK,
      equilibriumTempK,
      ringType: ringProperties.ringType,
      orbitalPeriodYears,
      orbitalPeriodDays,
      transitDepthFraction,
      transitDepthPpm,
      transitProbabilityFraction,
      rvSemiAmplitudeMs,
    });
  }

  const atmosphere = buildBrownDwarfAtmosphere(brownDwarf.spectralFamily);
  const clouds = buildBrownDwarfClouds(brownDwarf.spectralFamily);
  const magnetic = calcBrownDwarfMagnetic({
    massMjup,
    radiusKm,
    orbitAu: orbit,
    ageGyr: sAge,
  });
  const dynamics = {
    bandCount: brownDwarf.spectralFamily === "L" ? 4 : brownDwarf.spectralFamily === "T" ? 3 : 2,
    equatorialWindMs: brownDwarf.spectralFamily === "L" ? 220 : brownDwarf.spectralFamily === "T" ? 150 : 90,
    windDirection: brownDwarf.spectralFamily === "L" ? "Patchy eastward" : "Patchy variable",
  };
  const oblateness = calcOblateness(Math.min(massMjup, 13), radiusKm, Math.min(rot, 100), densityGcm3);
  const massLoss = {
    massLossRateKgS: 0,
    evaporationTimescaleGyr: 1e12,
    rocheLobeRadiusKm: round(hillSphereKm * 0.49, 0),
    rocheLobeOverflow: false,
    xuvFluxRatioEarth:
      resolvedHostXuvFluxEarthAt1Au != null && orbit > 0
        ? Math.max(0, resolvedHostXuvFluxEarthAt1Au) / orbit ** 2 + meanCompanionXuvFluxEarth
        : meanCompanionXuvFluxEarth,
  };
  const bdExobaseTempK = Math.max(300, 600 + 80 * Math.log10(massLoss.xuvFluxRatioEarth + 1));
  const jeansEscape = buildBrownDwarfJeansDisplay(
    escapeVelocityKms,
    bdExobaseTempK,
    massLoss.xuvFluxRatioEarth,
  );
  const tidal = calcTidalEffects(massMjup, radiusKm, orbit, eccentricity, sMass, sAge);
  const orbitalVelocityKms = (2 * Math.PI * auToKilometers(orbit)) / (orbitalPeriodDays * 86400);
  const orbitalDirection = orbitalDirectionFromInclination(inclinationDeg);
  const localDaysPerYear = (orbitalPeriodDays * 24) / rot;
  const tidallyEvolved = tidal.isTidallyLocked;
  const resonance = tidallyEvolved ? selectSpinOrbitResonance({ eccentricity }) : null;
  const resonanceRotationHours = resonance ? (orbitalPeriodDays * 24) / resonance.p : null;
  const nearestResonance = findNearestResonance(orbit, Array.isArray(otherGiants) ? otherGiants : []);

  const hostFrameCriticalOuterAu = Number(hostFrame?.stability?.criticalOuterAu);
  const hostFrameCriticalInnerAu = Number(hostFrame?.stability?.criticalInnerAu);
  const hostFrameDiskTruncationAu = Number(
    hostFrame?.stability?.diskTruncationAu ?? hostFrame?.zones?.diskTruncationAu,
  );
  const hostFrameCircumbinaryInnerEdgeAu = Number(hostFrame?.stability?.circumbinaryInnerEdgeAu);
  let dynamicalStability = "Stable";
  const dynamicalStabilityNotes = [];
  if (hostFrame?.frameKind === "pair") {
    if (Number.isFinite(hostFrameCriticalInnerAu) && hostFrameCriticalInnerAu > 0) {
      if (orbit < hostFrameCriticalInnerAu) {
        dynamicalStability = "Likely unstable";
        dynamicalStabilityNotes.push(
          `Orbit lies inside the circumbinary stability floor (${fmt(hostFrameCriticalInnerAu, 3)} AU).`,
        );
      } else if (orbit < hostFrameCriticalInnerAu * 1.15) {
        dynamicalStability = "Marginal";
        dynamicalStabilityNotes.push(
          `Orbit sits close to the circumbinary stability floor (${fmt(hostFrameCriticalInnerAu, 3)} AU).`,
        );
      }
    }
    if (
      Number.isFinite(hostFrameCircumbinaryInnerEdgeAu) &&
      hostFrameCircumbinaryInnerEdgeAu > 0 &&
      orbit < hostFrameCircumbinaryInnerEdgeAu
    ) {
      if (dynamicalStability === "Stable") dynamicalStability = "Disk-cleared";
      dynamicalStabilityNotes.push(
        `Orbit lies inside the likely cleared inner circumbinary disk (${fmt(hostFrameCircumbinaryInnerEdgeAu, 3)} AU).`,
      );
    }
    if (Number.isFinite(hostFrameCriticalOuterAu) && hostFrameCriticalOuterAu > 0) {
      if (orbit > hostFrameCriticalOuterAu) {
        dynamicalStability = "Likely unstable";
        dynamicalStabilityNotes.push(
          `Orbit extends beyond the outer hierarchical stability limit (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
        );
      } else if (orbit > hostFrameCriticalOuterAu * 0.85) {
        if (dynamicalStability === "Stable") dynamicalStability = "Marginal";
        dynamicalStabilityNotes.push(
          `Orbit sits close to the outer hierarchical stability edge (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
        );
      }
    }
    if (Number.isFinite(hostFrameDiskTruncationAu) && hostFrameDiskTruncationAu > 0 && orbit > hostFrameDiskTruncationAu) {
      if (dynamicalStability === "Stable") dynamicalStability = "Disk-truncated";
      dynamicalStabilityNotes.push(
        `Orbit lies beyond the likely truncated outer circumbinary disk (${fmt(hostFrameDiskTruncationAu, 3)} AU).`,
      );
    }
  } else if (Number.isFinite(hostFrameCriticalOuterAu) && hostFrameCriticalOuterAu > 0) {
    if (orbit > hostFrameCriticalOuterAu) {
      dynamicalStability = "Likely unstable";
      dynamicalStabilityNotes.push(
        `Orbit extends beyond the circumstellar stability limit (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
      );
    } else if (orbit > hostFrameCriticalOuterAu * 0.85) {
      dynamicalStability = "Marginal";
      dynamicalStabilityNotes.push(
        `Orbit sits close to the circumstellar stability edge (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
      );
    }
  }
  if (
    hostFrame?.frameKind !== "pair" &&
    Number.isFinite(hostFrameDiskTruncationAu) &&
    hostFrameDiskTruncationAu > 0 &&
    orbit > hostFrameDiskTruncationAu
  ) {
    if (dynamicalStability === "Stable") dynamicalStability = "Disk-truncated";
    dynamicalStabilityNotes.push(
      `Orbit lies beyond the likely truncated circumstellar disk (${fmt(hostFrameDiskTruncationAu, 3)} AU).`,
    );
  }
  for (const warning of hostFrame?.stability?.warnings || []) {
    dynamicalStabilityNotes.push(String(warning));
  }

  return {
    regime: "brownDwarf",
    companionClass: companionKind,
    hostFrame,
    zoneKind: brownDwarf.zoneKind,
    zoneLabel: brownDwarf.zoneLabel,
    inputs: {
      companionClass: companionKind,
      massMjup,
      massMsol: brownDwarf.inputs.massMsol,
      radiusRj,
      orbitAu: orbit,
      eccentricity,
      inclinationDeg,
      axialTiltDeg,
      rotationPeriodHours: rot,
      metallicitySolar: atmosphere.metallicitySolar,
      massSource: hasMass ? "user" : "default",
      radiusSource: hasRadius ? "user" : "derived",
      metallicitySource: "derived",
    },
    classification: {
      sudarsky: null,
      label: "Brown dwarf",
      subtype: brownDwarf.spectralFamily,
      cloudType: atmosphere.dominantTrace,
      substellarClass: brownDwarf.substellarClass,
      spectralFamily: brownDwarf.spectralFamily,
      spectralSubtype: brownDwarf.spectralSubtype,
    },
    physical: {
      massEarth: round(massEarth, 2),
      massMjup: round(massMjup, 4),
      massKg,
      radiusKm: round(radiusKm, 0),
      radiusEarth: round(radiusEarth, 3),
      radiusRj: round(radiusRj, 3),
      densityGcm3: round(densityGcm3, 4),
      gravityMs2: round(gravityMs2, 2),
      gravityG: round(gravityG, 3),
      equatorialGravityMs2: round(gravityMs2, 2),
      equatorialGravityG: round(gravityG, 3),
      escapeVelocityKms: round(escapeVelocityKms, 2),
      suggestedRadiusRj: brownDwarf.radiusRjAuto,
      radiusInflationFactor: round(radiusRj / Math.max(brownDwarf.radiusRjAuto, 1e-6), 3),
      proximityInflationRj: 0,
      irradiationInflationFraction: 0,
      hotJupiterInflationActive: false,
      hotJupiterInflationCapped: false,
      radiusAgeNote:
        brownDwarf.resolutionMode === "mass-age-derived"
          ? `Radius follows the ${fmt(sAge, 1)} Gyr cooling track.`
          : `Radius override applied against the ${fmt(sAge, 1)} Gyr cooling track.`,
    },
    thermal: {
      equilibriumTempK: round(equilibriumTempK, 1),
      effectiveTempK: round(intrinsicTempK, 1),
      teqPeriK: round(teqPeriK, 1),
      teqApoK: round(teqApoK, 1),
      tEffPeriK: round(intrinsicTempK, 1),
      tEffApoK: round(intrinsicTempK, 1),
      internalHeatRatio: round(ihRatio, 2),
      internalFluxWm2: round(internalFluxWm2, 3),
      incidentFluxWm2: round(incidentFluxWm2, 1),
      incidentFluxErgCm2S: round(incidentFluxWm2 * 1e3, 0),
      bondAlbedo: round(bondAlbedo, 3),
      companionFluxEarth: round(meanCompanionFluxEarth, 4),
      fluxVariabilityFraction: round(hostFrameFluxVariabilityFraction, 4),
      insolationEarth: round(insolationEarth, 4),
      moonTidalHeatingW: round(moonTidalHeatingW, 0),
      moonTidalHeatingWm2: round(moonTidalHeatingWm2, 6),
      moonTidalFraction: round(moonTidalFraction, 4),
      k2: bdK2,
      tidalQ: Math.round(bdQ),
      luminosityLsol: round(brownDwarf.luminosityLsol, 8),
    },
    atmosphere,
    clouds,
    magnetic,
    gravity: {
      hillSphereAu: round(hillSphereAu, 4),
      hillSphereKm: round(hillSphereKm, 0),
      rocheLimit_iceKm: round(rocheLimitIceKm, 0),
      rocheLimit_rockKm: round(rocheLimitRockKm, 0),
      chaoticZoneAu: round(chaoticZoneHalfAu, 4),
      ringZoneInnerKm: round(rocheLimitRockKm, 0),
      ringZoneOuterKm: round(rocheLimitIceKm, 0),
    },
    dynamics,
    oblateness,
    interior: {
      totalHeavyElementsMearth: null,
      estimatedCoreMassMearth: null,
      bulkMetallicityFraction: null,
    },
    massLoss,
    jeansEscape: {
      exobaseTempK: round(bdExobaseTempK, 0),
      xuvFluxRatio: round(massLoss.xuvFluxRatioEarth, 4),
      species: jeansEscape.species,
    },
    tidal: {
      ...tidal,
      spinOrbitResonance: resonance ? resonance.ratio : null,
      resonanceRotationHours: resonanceRotationHours ? round(resonanceRotationHours, 2) : null,
    },
    ringProperties,
    orbital: {
      periapsisAu: round(periapsisAu, 4),
      apoapsisAu: round(apoapsisAu, 4),
      orbitalPeriodYears: round(orbitalPeriodYears, 4),
      orbitalPeriodDays: round(orbitalPeriodDays, 2),
      orbitalVelocityKms: round(orbitalVelocityKms, 2),
      orbitalDirection,
      localDaysPerYear: round(localDaysPerYear, 2),
      insolationEarth: round(insolationEarth, 4),
      dynamicalStability,
      dynamicalStabilityNotes,
      nearestResonance,
    },
    detection: {
      transitDepthFraction: round(transitDepthFraction, 8),
      transitDepthPpm: round(transitDepthPpm, 2),
      transitProbabilityFraction: round(transitProbabilityFraction, 6),
      rvSemiAmplitudeMs: round(rvSemiAmplitudeMs, 4),
    },
    appearance: {
      colourHex: brownDwarf.starColourHex,
      colourLabel: `${brownDwarf.substellarClass} brown dwarf`,
    },
    display: {
      bodyClass: `Brown dwarf (${brownDwarf.substellarClass})`,
      classification: brownDwarf.substellarClass,
      mass: `${fmt(massMjup, 3)} Mj (${fmt(massEarth, 1)} Mearth)`,
      radius: `${fmt(radiusRj, 3)} Rj (${fmt(radiusKm, 0)} km)`,
      density: `${fmt(densityGcm3, 3)} g/cm3`,
      gravity: `${fmt(gravityG, 2)} g (${fmt(gravityMs2, 1)} m/s2)`,
      escapeVelocity: `${fmt(escapeVelocityKms, 1)} km/s`,
      equilibriumTemp: `${fmt(equilibriumTempK, 0)} K`,
      effectiveTemp: `${fmt(intrinsicTempK, 0)} K`,
      luminosity: `${fmt(brownDwarf.luminosityLsol, brownDwarf.luminosityLsol < 0.001 ? 6 : 4)} Lsol`,
      zone: `${fmt(brownDwarf.habitableZoneAu.inner, 4)}-${fmt(brownDwarf.habitableZoneAu.outer, 4)} AU`,
      zoneLabel: getInsolationZoneLabelForRegime("brownDwarf"),
      coolingState: brownDwarf.deuteriumBurningActive
        ? `Deuterium-burning (${fmt(brownDwarf.deuteriumBurningWindowGyr, 2)} Gyr window)`
        : `${brownDwarf.substellarClass} cooling dwarf`,
      hillSphere: `${fmt(hillSphereAu, 3)} AU (${fmt(hillSphereKm, 0)} km)`,
      rocheLimit: `${fmt(rocheLimitIceKm, 0)} km (ice) / ${fmt(rocheLimitRockKm, 0)} km (rock)`,
      magneticField: `${fmt(magnetic.surfaceFieldGauss, 0)} G (${magnetic.fieldLabel})`,
      magneticMorphology:
        magnetic.fieldMorphology.charAt(0).toUpperCase() + magnetic.fieldMorphology.slice(1),
      magnetosphere: `${fmt(magnetic.magnetopauseRp, 0)} Rp (${fmt(magnetic.magnetopauseKm, 0)} km)`,
      moonTidalHeating:
        moonTidalHeatingW > 0
          ? `${moonTidalHeatingW.toExponential(2)} W (${fmt(moonTidalFraction * 100, 2)}% of intrinsic heat)`
          : "No moons assigned",
      sputteringPlasma: "Negligible",
      bands: `${dynamics.bandCount} visible cloud bands`,
      windSpeed: `${fmt(dynamics.equatorialWindMs, 0)} m/s`,
      orbitalPeriod: `${fmt(orbitalPeriodYears, 2)} yr (${fmt(orbitalPeriodDays, 1)} days)`,
      orbitalVelocity: `${fmt(orbitalVelocityKms, 1)} km/s`,
      insolation: `${fmt(insolationEarth, 3)}x Earth`,
      companionFlux:
        hostFrame?.frameKind === "pair"
          ? "Included in host pair"
          : meanCompanionFluxEarth > 0
            ? `${fmt(meanCompanionFluxEarth, 3)}x Earth`
            : "Negligible",
      fluxVariability:
        hostFrameFluxVariabilityFraction > 0
          ? `${fmt(hostFrameFluxVariabilityFraction * 100, 1)}%`
          : "Low",
      dynamicalStability,
      transitDepth:
        `${fmt(transitDepthFraction * 100, transitDepthFraction * 100 >= 0.1 ? 2 : 4)}%` +
        ` (${fmt(transitDepthPpm, 0)} ppm)`,
      transitProbability: `${fmt(transitProbabilityFraction * 100, 2)}% geometric probability`,
      rvSemiAmplitude:
        rvSemiAmplitudeMs >= 1000
          ? `${fmt(rvSemiAmplitudeMs / 1000, 3)} km/s`
          : `${fmt(rvSemiAmplitudeMs, rvSemiAmplitudeMs >= 10 ? 2 : 3)} m/s`,
      peri: eccentricity > 0.005 ? `${fmt(periapsisAu, 4)} AU` : null,
      apo: eccentricity > 0.005 ? `${fmt(apoapsisAu, 4)} AU` : null,
      tempPeri:
        eccentricity > 0.005
          ? `T_eq ${fmt(Math.round(teqPeriK), 0)} K, intrinsic ${fmt(Math.round(intrinsicTempK), 0)} K`
          : null,
      tempApo:
        eccentricity > 0.005
          ? `T_eq ${fmt(Math.round(teqApoK), 0)} K, intrinsic ${fmt(Math.round(intrinsicTempK), 0)} K`
          : null,
      orbitalDirection,
      localDaysPerYear: `${fmt(localDaysPerYear, 2)} local days`,
      resonance: nearestResonance
        ? `${nearestResonance.label} (${fmt(nearestResonance.resonanceAu, 3)} AU, ${fmt(nearestResonance.deltaPct * 100, 1)}% off)`
        : "No nearby resonance",
      chaoticZone: `+/-${fmt(chaoticZoneHalfAu, 3)} AU`,
      metallicity: "Not modelled",
      oblateness: `f = ${fmt(oblateness.flattening, 4)} (J2 = ${fmt(oblateness.j2, 5)})`,
      equatorialRadius: `${fmt(oblateness.equatorialRadiusKm, 0)} km eq / ${fmt(oblateness.polarRadiusKm, 0)} km pol`,
      heavyElements: "Not modelled",
      bulkMetallicity: "Not modelled",
      massLossRate: "~0 kg/s",
      evaporationTimescale: "Effectively stable",
      rocheLobeRadius: `${fmt(massLoss.rocheLobeRadiusKm, 0)} km`,
      jeansEscape: jeansEscape.text,
      suggestedRadius: `${fmt(brownDwarf.radiusRjAuto, 3)} Rj at ${fmt(sAge, 1)} Gyr`,
      radiusInflation: "Cooling-track radius",
      radiusAgeNote:
        brownDwarf.resolutionMode === "mass-age-derived"
          ? `Cooling track at ${fmt(sAge, 1)} Gyr`
          : `Cooling track with user radius override at ${fmt(sAge, 1)} Gyr`,
      ringType: "None",
      ringDetails: "Brown dwarfs do not use the giant-planet ring model.",
      tidalLocking: `tau_lock = ${
        tidal.lockingTimescaleGyr >= 1e6 ? ">> age" : `${fmt(tidal.lockingTimescaleGyr, 2)} Gyr`
      }${
        tidal.isTidallyLocked
          ? resonance && resonance.ratio !== "1:1"
            ? ` - Spin-orbit resonance (${resonance.ratio})`
            : " - Synchronous (1:1)"
          : ""
      }`,
      circularisation: `tau_circ = ${
        tidal.circularisationTimescaleGyr >= 1e6
          ? ">> age"
          : `${fmt(tidal.circularisationTimescaleGyr, 2)} Gyr`
      }${tidal.isCircularised ? " - Circularised" : ""}`,
    },
  };
}

export function calcGasGiant({
  companionClass,
  massMjup: rawMass,
  radiusRj: rawRadius,
  orbitAu,
  eccentricity: rawEcc,
  inclinationDeg: rawIncl,
  axialTiltDeg: rawTilt,
  rotationPeriodHours,
  metallicity: rawMetallicity,
  starMassMsol,
  starLuminosityLsol,
  starAgeGyr,
  starRadiusRsol,
  hostFrameId = null,
  hostFrame = null,
  hostXuvFluxEarthAt1Au = null,
  companionFluxEarth = 0,
  companionXuvFluxEarth = 0,
  fluxVariabilityFraction = 0,
  stellarMetallicityFeH,
  otherGiants,
  moons,
  detailLevel = "full",
}) {
  if (resolveGiantCompanionClass(companionClass, rawMass) === "brownDwarf") {
    return calcBrownDwarfCompanion({
      companionClass,
      massMjup: rawMass,
      radiusRj: rawRadius,
      orbitAu,
      eccentricity: rawEcc,
      inclinationDeg: rawIncl,
      axialTiltDeg: rawTilt,
      rotationPeriodHours,
      starMassMsol,
      starLuminosityLsol,
      starAgeGyr,
      starRadiusRsol,
      hostFrameId,
      hostFrame,
      hostXuvFluxEarthAt1Au,
      companionFluxEarth,
      companionXuvFluxEarth,
      fluxVariabilityFraction,
      otherGiants,
      moons,
      detailLevel,
    });
  }
  const orbit = clamp(toFinite(orbitAu, 5.2), 0.01, 1e6);
  const eccentricity = clamp(toFinite(rawEcc, 0), 0, 0.99);
  const inclinationDeg = clamp(toFinite(rawIncl, 0), 0, 180);
  const axialTiltDeg = clamp(toFinite(rawTilt, 0), 0, 180);
  const rot = clamp(toFinite(rotationPeriodHours, 10), 1, 100);
  const sMass = clamp(toFinite(starMassMsol, 1), 0.075, 100);
  const sLum = Math.max(0.0001, toFinite(starLuminosityLsol, 1));
  const sAge = clamp(toFinite(starAgeGyr, 4.6), 0.01, 15);
  const meanCompanionFluxEarth = Math.max(toFinite(companionFluxEarth, 0), 0);
  const meanCompanionXuvFluxEarth = Math.max(toFinite(companionXuvFluxEarth, 0), 0);
  const resolvedHostXuvFluxEarthAt1Au = toFinite(hostXuvFluxEarthAt1Au, null);
  const hostFrameFluxVariabilityFraction = Math.max(toFinite(fluxVariabilityFraction, 0), 0);
  const giantMoons = Array.isArray(moons) ? moons : [];
  void starRadiusRsol;

  function effectiveLuminosityAtDistanceAu(distanceAu) {
    const orbitalDistanceAu = Math.max(toFinite(distanceAu, orbit), 0.01);
    return Math.max(
      (sLum / orbitalDistanceAu ** 2 + meanCompanionFluxEarth) * orbitalDistanceAu ** 2,
      1e-9,
    );
  }

  let massMjup;
  let radiusRj;
  let massSource;
  let radiusSource;

  const hasMass = rawMass != null && Number.isFinite(Number(rawMass)) && Number(rawMass) > 0;
  const hasRadius =
    rawRadius != null && Number.isFinite(Number(rawRadius)) && Number(rawRadius) > 0;

  if (hasMass && hasRadius) {
    massMjup = clamp(Number(rawMass), 0.01, 13);
    radiusRj = clamp(Number(rawRadius), 0.15, 2.5);
    massSource = "user";
    radiusSource = "user";
  } else if (hasMass) {
    massMjup = clamp(Number(rawMass), 0.01, 13);
    radiusRj = clamp(massToRadiusRj(massMjup), 0.15, 2.5);
    massSource = "user";
    radiusSource = "derived";
  } else if (hasRadius) {
    radiusRj = clamp(Number(rawRadius), 0.15, 2.5);
    massMjup = clamp(radiusToMassMjup(radiusRj), 0.01, 13);
    massSource = "derived";
    radiusSource = "user";
  } else {
    massMjup = 1;
    radiusRj = 1;
    massSource = "default";
    radiusSource = "default";
  }

  const thermal = computeThermalProfile({
    massMjup,
    orbitAu: orbit,
    starLuminosityLsol: sLum,
    eccentricity,
    extraFluxEarth: meanCompanionFluxEarth,
  });
  const sudarsky = thermal.sudarsky;
  const teqK = thermal.equilibriumTempK;
  const ihRatio = thermal.internalHeatRatio;
  const tEffK = thermal.effectiveTempK;
  const internalFlux = thermal.internalFluxWm2;
  const incidentFluxWm2 = calcStellarFluxWm2({
    starLuminosityLsol: effectiveLuminosityAtDistanceAu(orbit),
    orbitalDistanceAu: orbit,
  });

  if (radiusSource !== "user") {
    const derivedAgeRadius = calcAgeRadiusCorrection(
      massMjup,
      radiusRj,
      sAge,
      teqK,
      incidentFluxWm2,
    );
    radiusRj = clamp(derivedAgeRadius.suggestedRadiusRj, 0.15, 2.5);
  }

  const massEarth = massMjup * EARTH_MASS_PER_MJUP;
  const massKg = massMjup * JUPITER_MASS_KG;
  const radiusKm = radiusRj * JUPITER_RADIUS_KM;
  const radiusEarth = radiusKm / EARTH_RADIUS_KM;
  const radiusM = radiusKm * 1000;
  const volumeM3 = (4 / 3) * Math.PI * radiusM ** 3;
  const densityKgM3 = massKg / volumeM3;
  const densityGcm3 = densityKgM3 / 1000;
  const gravityMs2 = (G * massKg) / radiusM ** 2;
  const gravityG = gravityMs2 / EARTH_GRAVITY_MS2;
  const escapeVelocityMs = Math.sqrt((2 * G * massKg) / radiusM);
  const escapeVelocityKms = escapeVelocityMs / 1000;

  const surfaceAreaM2 = 4 * Math.PI * radiusM ** 2;
  const ggK2 = gasGiantK2(massMjup);
  const ggQ = gasGiantTidalQ(massMjup);
  const moonTidalHeatingW = totalGasGiantTidalHeating(giantMoons, ggK2, ggQ, massKg, radiusM);
  const moonTidalHeatingWm2 = surfaceAreaM2 > 0 ? moonTidalHeatingW / surfaceAreaM2 : 0;
  const moonTidalFraction = internalFlux > 0 ? moonTidalHeatingWm2 / internalFlux : 0;

  const periapsisAu = thermal.periapsisAu;
  const apoapsisAu = thermal.apoapsisAu;
  const teqPeriK = thermal.equilibriumTempPeriK;
  const teqApoK = thermal.equilibriumTempApoK;
  const tEffPeriK = thermal.effectiveTempPeriK;
  const tEffApoK = thermal.effectiveTempApoK;
  const insolationEarth = thermal.insolationEarth;
  const isIceGiant = massMjup < ICE_GIANT_MASS_MJUP;

  const hasMetallicity =
    rawMetallicity != null && Number.isFinite(Number(rawMetallicity)) && Number(rawMetallicity) > 0;
  const metallicitySource = hasMetallicity ? "user" : "derived";
  const stellarFeH = clamp(toFinite(stellarMetallicityFeH, 0), -3, 1);
  const stellarMetallicityScale = stellarMetallicityScaleFromFeH(stellarFeH);
  const resolvedMetallicity = hasMetallicity
    ? clamp(Number(rawMetallicity), 0.1, 200)
    : clamp(estimateMetallicity(massMjup) * stellarMetallicityScale, 0.1, 200);

  const massRatio = massMjup / (sMass * MSOL_PER_MJUP);
  const hillSphereAu = orbit * (massRatio / 3) ** (1 / 3);
  const hillSphereKm = auToKilometers(hillSphereAu);
  const rocheLimitIceKm = 2.44 * radiusKm * (densityGcm3 / 0.9) ** (1 / 3);
  const rocheLimitRockKm = 2.44 * radiusKm * (densityGcm3 / 3.0) ** (1 / 3);
  const chaoticZoneHalfAu = orbit * 1.3 * massRatio ** (2 / 7);
  const ringProperties = calcRingProperties(massMjup, teqK, rocheLimitRockKm, rocheLimitIceKm);
  const orbitalPeriodYears = calcOrbitalPeriodYearsKepler({
    semiMajorAxisAu: orbit,
    centralMassMsol: sMass,
  });
  const orbitalPeriodDays = calcOrbitalPeriodDaysKepler({
    semiMajorAxisAu: orbit,
    centralMassMsol: sMass,
    daysPerYear: 365.25,
  });
  const transitDepthFraction = calcTransitDepthFraction({
    bodyRadiusKm: radiusKm,
    starRadiusKm: starRadiusRsol * 696340,
  });
  const transitDepthPpm = transitDepthFraction * 1e6;
  const transitProbabilityFraction = calcTransitProbabilityFraction({
    bodyRadiusKm: radiusKm,
    starRadiusKm: starRadiusRsol * 696340,
    semiMajorAxisAu: orbit,
  });
  const rvSemiAmplitudeMs = calcRvSemiAmplitudeMs({
    orbitalPeriodDays,
    primaryMassMsol: sMass,
    secondaryMassKg: massKg,
    eccentricity,
    sinI: 1,
  });

  if (detailLevel === "summary") {
    return buildGasGiantSummaryResult({
      hostFrameId,
      hostFrame,
      massMjup,
      radiusRj,
      orbitAu: orbit,
      eccentricity,
      inclinationDeg,
      axialTiltDeg,
      rotationPeriodHours: rot,
      massSource,
      radiusSource,
      metallicitySource,
      massEarth,
      massKg,
      radiusKm,
      radiusEarth,
      densityGcm3,
      gravityMs2,
      gravityG,
      escapeVelocityKms,
      effectiveTempK: tEffK,
      equilibriumTempK: teqK,
      ringType: ringProperties.ringType,
      orbitalPeriodYears,
      orbitalPeriodDays,
      transitDepthFraction,
      transitDepthPpm,
      transitProbabilityFraction,
      rvSemiAmplitudeMs,
    });
  }

  const atmosphere = getAtmosphere(massMjup, tEffK, resolvedMetallicity);
  const clouds = getClouds(tEffK, isIceGiant);
  const magnetic = calcMagnetic({
    massMjup,
    radiusKm,
    densityGcm3,
    internalFluxWm2: internalFlux,
    moonTidalFluxWm2: moonTidalHeatingWm2,
    isIceGiant,
    orbitAu: orbit,
    moons: giantMoons,
    starLuminosityLsol: sLum,
    ageGyr: sAge,
  });

  const dynamics = calcDynamics(massMjup, radiusKm, rot, tEffK);
  const oblateness = calcOblateness(massMjup, radiusKm, rot, densityGcm3);
  const interior = calcInterior(massMjup);
  const massLoss = calcMassLoss(
    massMjup,
    radiusKm,
    orbit,
    sMass,
    sLum,
    sAge,
    meanCompanionXuvFluxEarth,
    resolvedHostXuvFluxEarthAt1Au,
  );
  const ggExobaseTempK = computeGasGiantExobaseTemp(tEffK, massLoss.xuvFluxRatioEarth);
  const ggJeansSpecies = computeGasGiantJeansEscape(escapeVelocityKms, ggExobaseTempK);
  const tidal = calcTidalEffects(massMjup, radiusKm, orbit, eccentricity, sMass, sAge);
  const ageRadius = calcAgeRadiusCorrection(massMjup, radiusRj, sAge, teqK, incidentFluxWm2);

  const eqRadiusM = oblateness.equatorialRadiusKm * 1000;
  const equatorialGravityMs2 = (G * massKg) / eqRadiusM ** 2;
  const equatorialGravityG = equatorialGravityMs2 / EARTH_GRAVITY_MS2;

  const orbitalVelocityKms = (2 * Math.PI * auToKilometers(orbit)) / (orbitalPeriodDays * 86400);
  const orbitalDirection = orbitalDirectionFromInclination(inclinationDeg);
  const localDaysPerYear = (orbitalPeriodDays * 24) / rot;
  const tidallyEvolved = tidal.isTidallyLocked;
  const resonance = tidallyEvolved ? selectSpinOrbitResonance({ eccentricity }) : null;
  const resonanceRotationHours = resonance ? (orbitalPeriodDays * 24) / resonance.p : null;
  const nearestResonance = findNearestResonance(
    orbit,
    Array.isArray(otherGiants) ? otherGiants : [],
  );

  let jeansDisplay = `Atmospheric escape (T_exo ${fmt(round(ggExobaseTempK, 0), 0)} K, XUV ${fmt(round(massLoss.xuvFluxRatioEarth, 2), 2)}× Earth):`;
  const hostFrameCriticalOuterAu = Number(hostFrame?.stability?.criticalOuterAu);
  const hostFrameCriticalInnerAu = Number(hostFrame?.stability?.criticalInnerAu);
  const hostFrameDiskTruncationAu = Number(
    hostFrame?.stability?.diskTruncationAu ?? hostFrame?.zones?.diskTruncationAu,
  );
  const hostFrameCircumbinaryInnerEdgeAu = Number(hostFrame?.stability?.circumbinaryInnerEdgeAu);
  let dynamicalStability = "Stable";
  const dynamicalStabilityNotes = [];
  if (hostFrame?.frameKind === "pair") {
    if (Number.isFinite(hostFrameCriticalInnerAu) && hostFrameCriticalInnerAu > 0) {
      if (orbit < hostFrameCriticalInnerAu) {
        dynamicalStability = "Likely unstable";
        dynamicalStabilityNotes.push(
          `Orbit lies inside the circumbinary stability floor (${fmt(hostFrameCriticalInnerAu, 3)} AU).`,
        );
      } else if (orbit < hostFrameCriticalInnerAu * 1.15) {
        dynamicalStability = "Marginal";
        dynamicalStabilityNotes.push(
          `Orbit sits close to the circumbinary stability floor (${fmt(hostFrameCriticalInnerAu, 3)} AU).`,
        );
      }
    }
    if (
      Number.isFinite(hostFrameCircumbinaryInnerEdgeAu) &&
      hostFrameCircumbinaryInnerEdgeAu > 0 &&
      orbit < hostFrameCircumbinaryInnerEdgeAu
    ) {
      if (dynamicalStability === "Stable") dynamicalStability = "Disk-cleared";
      dynamicalStabilityNotes.push(
        `Orbit lies inside the likely cleared inner circumbinary disk (${fmt(hostFrameCircumbinaryInnerEdgeAu, 3)} AU).`,
      );
    }
    if (Number.isFinite(hostFrameCriticalOuterAu) && hostFrameCriticalOuterAu > 0) {
      if (orbit > hostFrameCriticalOuterAu) {
        dynamicalStability = "Likely unstable";
        dynamicalStabilityNotes.push(
          `Orbit extends beyond the outer hierarchical stability limit (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
        );
      } else if (orbit > hostFrameCriticalOuterAu * 0.85) {
        if (dynamicalStability === "Stable") dynamicalStability = "Marginal";
        dynamicalStabilityNotes.push(
          `Orbit sits close to the outer hierarchical stability edge (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
        );
      }
    }
    if (Number.isFinite(hostFrameDiskTruncationAu) && hostFrameDiskTruncationAu > 0) {
      if (orbit > hostFrameDiskTruncationAu) {
        if (dynamicalStability === "Stable") dynamicalStability = "Disk-truncated";
        dynamicalStabilityNotes.push(
          `Orbit lies beyond the likely truncated outer circumbinary disk (${fmt(hostFrameDiskTruncationAu, 3)} AU).`,
        );
      }
    }
  } else if (Number.isFinite(hostFrameCriticalOuterAu) && hostFrameCriticalOuterAu > 0) {
    if (orbit > hostFrameCriticalOuterAu) {
      dynamicalStability = "Likely unstable";
      dynamicalStabilityNotes.push(
        `Orbit extends beyond the circumstellar stability limit (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
      );
    } else if (orbit > hostFrameCriticalOuterAu * 0.85) {
      dynamicalStability = "Marginal";
      dynamicalStabilityNotes.push(
        `Orbit sits close to the circumstellar stability edge (${fmt(hostFrameCriticalOuterAu, 3)} AU).`,
      );
    }
  }
  if (
    hostFrame?.frameKind !== "pair" &&
    Number.isFinite(hostFrameDiskTruncationAu) &&
    hostFrameDiskTruncationAu > 0 &&
    orbit > hostFrameDiskTruncationAu
  ) {
    if (dynamicalStability === "Stable") dynamicalStability = "Disk-truncated";
    dynamicalStabilityNotes.push(
      `Orbit lies beyond the likely truncated circumstellar disk (${fmt(hostFrameDiskTruncationAu, 3)} AU).`,
    );
  }
  for (const warning of hostFrame?.stability?.warnings || []) {
    dynamicalStabilityNotes.push(String(warning));
  }
  for (const species of Object.values(ggJeansSpecies)) {
    const nonThermalTag = species.nonThermal ? " (non-thermal)" : "";
    jeansDisplay += `\n  ${species.label}: λ=${fmt(species.lambda, 1)} — ${species.status}${nonThermalTag}`;
  }

  return {
    regime: "gasGiant",
    companionClass: "gasGiant",
    hostFrame,
    inputs: {
      companionClass: "gasGiant",
      massMjup,
      radiusRj,
      orbitAu: orbit,
      eccentricity,
      inclinationDeg,
      axialTiltDeg,
      rotationPeriodHours: rot,
      metallicitySolar: atmosphere.metallicitySolar,
      stellarMetallicityFeH: round(stellarFeH, 2),
      massSource,
      radiusSource,
      metallicitySource,
    },

    classification: {
      sudarsky: sudarsky.cls,
      label: sudarsky.label,
      subtype: sudarsky.subtype,
      cloudType: sudarsky.cloud,
    },

    physical: {
      massEarth: round(massEarth, 2),
      massMjup: round(massMjup, 4),
      massKg,
      radiusKm: round(radiusKm, 0),
      radiusEarth: round(radiusEarth, 3),
      radiusRj: round(radiusRj, 3),
      densityGcm3: round(densityGcm3, 4),
      gravityMs2: round(gravityMs2, 2),
      gravityG: round(gravityG, 3),
      equatorialGravityMs2: round(equatorialGravityMs2, 2),
      equatorialGravityG: round(equatorialGravityG, 3),
      escapeVelocityKms: round(escapeVelocityKms, 2),
      suggestedRadiusRj: ageRadius.suggestedRadiusRj,
      radiusInflationFactor: ageRadius.radiusInflationFactor,
      proximityInflationRj: ageRadius.proximityInflationRj,
      irradiationInflationFraction: ageRadius.irradiationInflationFraction,
      hotJupiterInflationActive: ageRadius.hotJupiterInflationActive,
      hotJupiterInflationCapped: ageRadius.hotJupiterInflationCapped,
      radiusAgeNote: ageRadius.radiusAgeNote,
    },

    thermal: {
      equilibriumTempK: round(teqK, 1),
      effectiveTempK: round(tEffK, 1),
      teqPeriK: round(teqPeriK, 1),
      teqApoK: round(teqApoK, 1),
      tEffPeriK: round(tEffPeriK, 1),
      tEffApoK: round(tEffApoK, 1),
      internalHeatRatio: round(ihRatio, 2),
      internalFluxWm2: round(internalFlux, 3),
      incidentFluxWm2: ageRadius.incidentFluxWm2,
      incidentFluxErgCm2S: ageRadius.incidentFluxErgCm2S,
      bondAlbedo: round(sudarsky.bondAlbedo, 3),
      companionFluxEarth: round(meanCompanionFluxEarth, 4),
      fluxVariabilityFraction: round(hostFrameFluxVariabilityFraction, 4),
      insolationEarth: round(insolationEarth, 4),
      moonTidalHeatingW: round(moonTidalHeatingW, 0),
      moonTidalHeatingWm2: round(moonTidalHeatingWm2, 6),
      moonTidalFraction: round(moonTidalFraction, 4),
      k2: round(ggK2, 3),
      tidalQ: Math.round(ggQ),
    },

    atmosphere,
    clouds,
    magnetic,

    gravity: {
      hillSphereAu: round(hillSphereAu, 4),
      hillSphereKm: round(hillSphereKm, 0),
      rocheLimit_iceKm: round(rocheLimitIceKm, 0),
      rocheLimit_rockKm: round(rocheLimitRockKm, 0),
      chaoticZoneAu: round(chaoticZoneHalfAu, 4),
      ringZoneInnerKm: round(rocheLimitRockKm, 0),
      ringZoneOuterKm: round(rocheLimitIceKm, 0),
    },

    dynamics,
    oblateness,
    interior,
    massLoss,
    jeansEscape: {
      exobaseTempK: round(ggExobaseTempK, 0),
      xuvFluxRatio: round(massLoss.xuvFluxRatioEarth, 4),
      species: ggJeansSpecies,
    },
    tidal: {
      ...tidal,
      spinOrbitResonance: resonance ? resonance.ratio : null,
      resonanceRotationHours: resonanceRotationHours ? round(resonanceRotationHours, 2) : null,
    },
    ringProperties,

    orbital: {
      periapsisAu: round(periapsisAu, 4),
      apoapsisAu: round(apoapsisAu, 4),
      orbitalPeriodYears: round(orbitalPeriodYears, 4),
      orbitalPeriodDays: round(orbitalPeriodDays, 2),
      orbitalVelocityKms: round(orbitalVelocityKms, 2),
      orbitalDirection,
      localDaysPerYear: round(localDaysPerYear, 2),
      insolationEarth: round(insolationEarth, 4),
      dynamicalStability,
      dynamicalStabilityNotes,
      nearestResonance,
    },

    detection: {
      transitDepthFraction: round(transitDepthFraction, 8),
      transitDepthPpm: round(transitDepthPpm, 2),
      transitProbabilityFraction: round(transitProbabilityFraction, 6),
      rvSemiAmplitudeMs: round(rvSemiAmplitudeMs, 4),
    },

    appearance: {
      colourHex: sudarsky.hex,
      colourLabel: sudarsky.label,
    },

    display: {
      mass: `${fmt(massMjup, 3)} Mj (${fmt(massEarth, 1)} M⊕)`,
      radius: `${fmt(radiusRj, 3)} Rj (${fmt(radiusKm, 0)} km)`,
      density: `${fmt(densityGcm3, 3)} g/cm³`,
      gravity: `${fmt(equatorialGravityG, 2)} g (${fmt(equatorialGravityMs2, 1)} m/s²)`,
      escapeVelocity: `${fmt(escapeVelocityKms, 1)} km/s`,
      equilibriumTemp: `${fmt(teqK, 0)} K`,
      effectiveTemp: `${fmt(tEffK, 0)} K`,
      classification: sudarsky.label,
      hillSphere: `${fmt(hillSphereAu, 3)} AU (${fmt(hillSphereKm, 0)} km)`,
      rocheLimit: `${fmt(rocheLimitIceKm, 0)} km (ice) / ${fmt(rocheLimitRockKm, 0)} km (rock)`,
      magneticField: `${fmt(magnetic.surfaceFieldGauss, 2)} G (${magnetic.fieldLabel})`,
      magneticMorphology:
        magnetic.fieldMorphology.charAt(0).toUpperCase() + magnetic.fieldMorphology.slice(1),
      magnetosphere: `${fmt(magnetic.magnetopauseRp, 0)} Rp (${fmt(magnetic.magnetopauseKm, 0)} km)`,
      moonTidalHeating:
        moonTidalHeatingW > 0
          ? `${moonTidalHeatingW.toExponential(2)} W (${fmt(moonTidalFraction * 100, 2)}% of internal heat)`
          : "No moons assigned",
      sputteringPlasma:
        magnetic.sputteringPlasmaW > 0
          ? `${magnetic.sputteringPlasmaW.toExponential(2)} W equiv. (atmospheric sputtering)`
          : "None",
      bands: `${dynamics.bandCount} bands, ${dynamics.windDirection} winds`,
      windSpeed: `${fmt(dynamics.equatorialWindMs, 0)} m/s`,
      orbitalPeriod: `${fmt(orbitalPeriodYears, 2)} yr (${fmt(orbitalPeriodDays, 1)} days)`,
      orbitalVelocity: `${fmt(orbitalVelocityKms, 1)} km/s`,
      insolation: `${fmt(insolationEarth, 3)}× Earth`,
      companionFlux:
        hostFrame?.frameKind === "pair"
          ? "Included in host pair"
          : meanCompanionFluxEarth > 0
            ? `${fmt(meanCompanionFluxEarth, 3)}× Earth`
            : "Negligible",
      fluxVariability:
        hostFrameFluxVariabilityFraction > 0
          ? `${fmt(hostFrameFluxVariabilityFraction * 100, 1)}%`
          : "Low",
      dynamicalStability,
      transitDepth:
        `${fmt(transitDepthFraction * 100, transitDepthFraction * 100 >= 0.1 ? 2 : 4)}%` +
        ` (${fmt(transitDepthPpm, 0)} ppm)`,
      transitProbability: `${fmt(transitProbabilityFraction * 100, 2)}% geometric probability`,
      rvSemiAmplitude:
        rvSemiAmplitudeMs >= 1000
          ? `${fmt(rvSemiAmplitudeMs / 1000, 3)} km/s`
          : `${fmt(rvSemiAmplitudeMs, rvSemiAmplitudeMs >= 10 ? 2 : 3)} m/s`,
      peri: eccentricity > 0.005 ? `${fmt(periapsisAu, 4)} AU` : null,
      apo: eccentricity > 0.005 ? `${fmt(apoapsisAu, 4)} AU` : null,
      tempPeri:
        eccentricity > 0.005
          ? `T_eq ${fmt(Math.round(teqPeriK), 0)} K, T_eff ${fmt(Math.round(tEffPeriK), 0)} K`
          : null,
      tempApo:
        eccentricity > 0.005
          ? `T_eq ${fmt(Math.round(teqApoK), 0)} K, T_eff ${fmt(Math.round(tEffApoK), 0)} K`
          : null,
      orbitalDirection,
      localDaysPerYear: `${fmt(localDaysPerYear, 2)} local days`,
      resonance: nearestResonance
        ? `${nearestResonance.label} (${fmt(nearestResonance.resonanceAu, 3)} AU, ${fmt(nearestResonance.deltaPct * 100, 1)}% off)`
        : "No nearby resonance",
      chaoticZone: `±${fmt(chaoticZoneHalfAu, 3)} AU`,
      metallicity: `${fmt(atmosphere.metallicitySolar, 1)}× solar`,
      oblateness: `f = ${fmt(oblateness.flattening, 4)} (J₂ = ${fmt(oblateness.j2, 5)})`,
      equatorialRadius: `${fmt(oblateness.equatorialRadiusKm, 0)} km eq / ${fmt(oblateness.polarRadiusKm, 0)} km pol`,
      heavyElements: `${fmt(interior.totalHeavyElementsMearth, 1)} M⊕ total (core ≈ ${fmt(interior.estimatedCoreMassMearth, 1)} M⊕)`,
      bulkMetallicity: `Z = ${fmt(interior.bulkMetallicityFraction, 3)}`,
      massLossRate: `${massLoss.massLossRateKgS.toExponential(2)} kg/s`,
      evaporationTimescale:
        massLoss.evaporationTimescaleGyr >= 1e10
          ? "≫ Hubble time"
          : `${fmt(massLoss.evaporationTimescaleGyr, 2)} Gyr`,
      rocheLobeRadius: `${fmt(massLoss.rocheLobeRadiusKm, 0)} km${massLoss.rocheLobeOverflow ? " (OVERFLOW)" : ""}`,
      jeansEscape: jeansDisplay,
      suggestedRadius: `${fmt(ageRadius.suggestedRadiusRj, 3)} Rj at ${fmt(sAge, 1)} Gyr`,
      radiusInflation: ageRadius.hotJupiterInflationActive
        ? `Age ×${fmt(ageRadius.radiusInflationFactor, 3)}; irradiation +${fmt(ageRadius.irradiationInflationFraction * 100, 0)}%`
        : `Age ×${fmt(ageRadius.radiusInflationFactor, 3)}; irradiation inactive`,
      radiusAgeNote: ageRadius.radiusAgeNote,
      ringType: `${ringProperties.ringType} — ${ringProperties.ringComposition}`,
      ringDetails: `τ ≈ ${fmt(ringProperties.opticalDepth, 2)} (${ringProperties.opticalDepthClass}), ${ringProperties.estimatedMassKg.toExponential(2)} kg`,
      tidalLocking: `τ_lock = ${
        tidal.lockingTimescaleGyr >= 1e6 ? "≫ age" : `${fmt(tidal.lockingTimescaleGyr, 2)} Gyr`
      }${
        tidal.isTidallyLocked
          ? resonance && resonance.ratio !== "1:1"
            ? ` — Spin-orbit resonance (${resonance.ratio})`
            : " — Synchronous (1:1)"
          : ""
      }`,
      circularisation: `τ_circ = ${
        tidal.circularisationTimescaleGyr >= 1e6
          ? "≫ age"
          : `${fmt(tidal.circularisationTimescaleGyr, 2)} Gyr`
      }${tidal.isCircularised ? " — Circularised" : ""}`,
    },
  };
}
