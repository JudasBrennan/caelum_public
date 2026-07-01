import { clamp, fmt, toFinite } from "./utils.js";
import { computeMoonAtmosphere } from "./moon/atmosphere.js";
import { compositionFromClass, compositionFromDensity } from "./moon/composition.js";
import { resolveTraceRadiogenicAbundance } from "./compositionCoupling.js";
import { inferMoonCoreMassFraction } from "./rockyBodyComposition.js";
import { computeMoonMagnetosphere } from "./moon/magnetosphere.js";
import { computeMoonOrbit } from "./moon/orbit.js";
import { computeMoonRadiationEnvironment } from "./moon/radiation.js";
import { computeIcyMoonExosphere } from "./moon/exosphere.js";
import { analyseMoonVolatiles, radiationLabel } from "./moon/retention.js";
import { computeSurfaceExomoonCalibration } from "./moon/surfaceHabitabilityCalibration.js";
import { computeMoonTemperature } from "./moon/temperature.js";
import { computeMoonTidalState, formatOrbitalFate, formatRecession } from "./moon/tides.js";
import { buildMoonHabitabilityContext } from "./habitability/context.js";
import { hydrosphereStateFromMoon } from "./habitability/hydrosphere.js";
import {
  formatHighPressureIceDisplay,
  formatOceanPhaseDiagnostics,
} from "./habitability/oceanPhaseDisplay.js";
import { computeMoonClimate } from "./moon/climate.js";
import {
  moonOriginPathwayLabel,
  normalizeMoonInputs,
  resolveMoonRadioisotopeAbundance,
} from "./moon/config.js";
import { computeMoonIllumination } from "./moon/illumination.js";
import { computeMoonGeology } from "./moon/geology.js";
import { computeMoonBiosphere } from "./moon/biosphere.js";
import { formatMigrationTrendDisplay } from "./moon/resonance.js";
import {
  computeEarthSimilarityIndex,
  computeMoonHabitabilityIndex,
} from "./habitability/metrics.js";
import {
  buildHabitabilityPersistenceBridge,
  buildSustainedTidalHeatingContext,
} from "./dynamics/habitabilityBridge.js";
import { buildEclipseTimingContext } from "./contexts/eclipseTimingContext.js";
import { buildImpactEnvironmentContext } from "./contexts/impactEnvironmentContext.js";
import { buildInteriorEvolutionContext } from "./contexts/interiorEvolutionContext.js";
import { buildMoonGeodynamicsContext } from "./contexts/moonGeodynamicsContext.js";
import { buildMoonOrientationContext } from "./contexts/moonOrientationContext.js";
import { buildTidalStressMorphologyContext } from "./contexts/secularStressContext.js";
import { buildStellarHistoryDoseContext } from "./contexts/stellarHistoryDoseContext.js";
import { calcPlanetExact } from "./planet.js";
import { EARTH_GRAVITY_MS2 } from "./physics/constants.js";
import { buildSolidBodyResponse } from "./physics/solidBodyResponse.js";
import { solveSolidBodyStructure } from "./physics/solidBodyStructure.js";
import { calcStar, massToLuminosity, massToRadius } from "./star.js";
import { buildPlanetaryEraTimelineForMoon } from "./planetaryEraTimeline.js";
import {
  buildEnvironmentForcing,
  buildAtmosphereEvolutionContext,
  buildCo2ClimateTendencyContext,
  computeAtmosphereLedger,
  computeBiosignatureContext,
  computeCarbonCycleContext,
  computeClimateChemistryForcing,
  computeCloudCirculationContext,
  buildNitrogenCycleContext,
  computeOceanChemistryContext,
  formatEnvironmentForcingSummary,
  resolveCoupledClimatePassForMoon,
} from "./environment/index.js";

export { compositionFromDensity } from "./moon/composition.js";

function buildMoonInterior(hydrosphere, inputs, totalInternalHeatFluxWm2) {
  return {
    modelVersion: "moon-interior-v1",
    differentiatedInterior:
      hydrosphere.differentiatedInterior != null
        ? hydrosphere.differentiatedInterior
        : inputs.differentiatedInterior,
    waterMassFractionPct: Math.max(0, Number(hydrosphere.waterMassFraction) || 0) * 100,
    salinityPct: Number(hydrosphere.salinityPct) || 0,
    ammoniaPct: Number(hydrosphere.ammoniaPct) || 0,
    freezingPointK: Number(hydrosphere.freezingPointK) || 273.15,
    iceShellThicknessKm: Number(hydrosphere.estimatedIceShellThicknessKm) || 0,
    oceanDepthKm:
      Number(hydrosphere.estimatedSurfaceOceanDepthKm) ||
      Number(hydrosphere.estimatedSubsurfaceOceanDepthKm) ||
      0,
    subsurfaceOceanDepthKm: Number(hydrosphere.estimatedSubsurfaceOceanDepthKm) || 0,
    seafloorPressureMPa: Number(hydrosphere.seafloorPressureMPa) || 0,
    highPressureIceLayers: !!hydrosphere.highPressureIceBarrier,
    convectionRegime: hydrosphere.convectionRegime || "None",
    totalInternalHeatFluxWm2: totalInternalHeatFluxWm2,
  };
}

function fallbackHabitableZoneAu(starLuminosityLsol) {
  const rootLuminosity = Math.sqrt(Math.max(toFinite(starLuminosityLsol, 1), 0.01));
  return {
    inner: 0.95 * rootLuminosity,
    outer: 1.67 * rootLuminosity,
  };
}

function deriveMoonStellarZoneGate({
  starHabitableZoneAu,
  starLuminosityLsol,
  starMassMsol,
  planetSemiMajorAxisAu,
  orbit,
  parentRadiusEarth,
}) {
  const hz = starHabitableZoneAu || fallbackHabitableZoneAu(starLuminosityLsol);
  const inStellarZone = planetSemiMajorAxisAu >= hz.inner && planetSemiMajorAxisAu <= hz.outer;
  const parentRadiusKm = Math.max(toFinite(parentRadiusEarth, 0.01), 0.01) * 6371;
  const stableOuterLimitKm = Math.max(
    toFinite(orbit?.stableOuterLimitKm, orbit?.moonZoneOuterKm ?? 0),
    0,
  );
  const stableOuterLimitRp = parentRadiusKm > 0 ? stableOuterLimitKm / parentRadiusKm : Infinity;
  const veryLowMassBlocked = inStellarZone && starMassMsol < 0.2;
  const compressedStableBand = inStellarZone && starMassMsol < 0.35 && stableOuterLimitRp < 12;
  const marginalLowMass =
    inStellarZone && !veryLowMassBlocked && !compressedStableBand && starMassMsol < 0.5;
  const marginalCompressedBand =
    inStellarZone && !veryLowMassBlocked && !compressedStableBand && stableOuterLimitRp < 20;
  const pass = inStellarZone && !veryLowMassBlocked && !compressedStableBand;

  let label = inStellarZone ? "Inside stellar HZ" : "Outside stellar HZ";
  if (veryLowMassBlocked) {
    label = "Very low-mass stellar HZ is unfavorable for stable habitable moons";
  } else if (compressedStableBand) {
    label = "Stellar HZ is dynamically compressed for habitable moons";
  } else if (marginalLowMass || marginalCompressedBand) {
    label = "Inside stellar HZ (low-mass-star caution)";
  }

  return {
    pass,
    marginal: marginalLowMass || marginalCompressedBand,
    label,
    habitableZoneAu: hz,
    stableOuterLimitRp,
  };
}

function deriveMoonTidalHabitableZone({ baseZone, orbit, tides, radiation, parentRadiusEarth }) {
  if (!baseZone) return null;
  const parentRadiusKm = Math.max(toFinite(parentRadiusEarth, 0.01), 0.01) * 6371;
  const stableOuterLimitKm = Math.max(
    toFinite(baseZone.stableOuterLimitKm, orbit?.stableOuterLimitKm ?? orbit?.moonZoneOuterKm ?? 0),
    0,
  );
  const rocheInnerKm = Math.max(toFinite(orbit?.zoneInnerKm, orbit?.moonZoneInnerKm ?? 0), 0);
  const currentAxisKm = Math.max(toFinite(orbit?.semiMajorAxisKm, 0), 0);
  const currentRp = parentRadiusKm > 0 ? currentAxisKm / parentRadiusKm : 0;
  const stableOuterRp = parentRadiusKm > 0 ? stableOuterLimitKm / parentRadiusKm : 0;
  const rocheInnerRp = parentRadiusKm > 0 ? rocheInnerKm / parentRadiusKm : 0;
  const eccentricity =
    currentAxisKm > 0 && Number.isFinite(orbit?.apoapsisKm)
      ? clamp(orbit.apoapsisKm / currentAxisKm - 1, 0, 0.99)
      : 0;
  const tidalHeatingEarth = Math.max(toFinite(tides?.tidalHeatingEarth, 0), 0);
  const surfaceExposure = Math.max(toFinite(radiation?.surfaceExposure, 0), 0);
  const parentBeltLevel = clamp(toFinite(radiation?.parentBeltLevel, 0), 0, 1);

  const radiationInnerRp =
    4 + parentBeltLevel * 6 + clamp(Math.log10(1 + surfaceExposure * 60), 0, 4);
  const heatingInnerRp =
    4 + clamp(Math.log10(1 + tidalHeatingEarth), 0, 4) * 1.5 + eccentricity * 120;
  let innerRp = Math.max(rocheInnerRp * 1.05, radiationInnerRp, heatingInnerRp);

  let preferredCenterRp = currentRp || Math.max(innerRp + 2, 6);
  if (tidalHeatingEarth < 0.05) {
    preferredCenterRp = Math.max(innerRp + 2, preferredCenterRp * 0.82);
  } else if (tidalHeatingEarth > 20) {
    preferredCenterRp = Math.min(stableOuterRp * 0.9, preferredCenterRp * 1.18);
  }

  const halfWidthRp =
    tidalHeatingEarth < 0.05
      ? Math.max(3, preferredCenterRp * 0.22)
      : tidalHeatingEarth > 20
        ? Math.max(2.5, preferredCenterRp * 0.18)
        : Math.max(4, preferredCenterRp * 0.28);
  innerRp = Math.max(innerRp, preferredCenterRp - halfWidthRp);
  let outerRp = Math.min(stableOuterRp * 0.95, preferredCenterRp + halfWidthRp);
  if (outerRp <= innerRp) outerRp = Math.min(stableOuterRp * 0.95, innerRp + 2);

  const innerKm = innerRp * parentRadiusKm;
  const outerKm = outerRp * parentRadiusKm;
  const notes = [...(Array.isArray(baseZone.notes) ? baseZone.notes : [])];
  if (parentBeltLevel >= 0.5 || surfaceExposure >= 0.5)
    notes.push("inner-edge-pushed-out-by-radiation");
  if (tidalHeatingEarth < 0.05) notes.push("low-tidal-support");
  else if (tidalHeatingEarth > 20) notes.push("high-tidal-heating");
  else notes.push("moderate-tidal-support");

  return {
    ...baseZone,
    modelVersion: "moon-tidal-hz-v2",
    innerKm,
    outerKm,
    preferredCenterKm: preferredCenterRp * parentRadiusKm,
    sourceRadiusKm: parentRadiusKm,
    derivedFrom: {
      tidalHeatingEarth,
      surfaceExposure,
      parentBeltLevel,
      eccentricity,
      stableOuterLimitKm,
    },
    notes,
    withinZone: baseZone.starHzEligible && currentAxisKm >= innerKm && currentAxisKm <= outerKm,
  };
}

function buildMoonHabitabilitySummary({
  starHabitableZoneAu,
  starLuminosityLsol,
  starMassMsol,
  parentMassEarth,
  parentDensityGcm3,
  planetSemiMajorAxisAu,
  parentRadiusEarth,
  moonMassMoon,
  moonDensityGcm3,
  compositionOverride,
  spinState,
  orbit,
  atmosphere,
  hydrosphere,
  climate,
  radiation,
  tides,
}) {
  const climateState = String(climate?.climateState || "");
  const surfaceClass = String(radiation?.surfaceClass || "");
  const subsurfaceClass = String(radiation?.subsurfaceClass || "");
  const tidalHeatingEarth = Number(tides?.tidalHeatingEarth) || 0;
  const tidalHeatingWm2 = Number(tides?.tidalHeatingWm2) || 0;
  const subsurfaceIceShellKm = Number(hydrosphere?.estimatedIceShellThicknessKm) || 0;
  const subsurfaceExposure = Number(radiation?.subsurfaceExposure) || 0;
  const subsurfaceExposureRemDayEquivalent =
    Number(radiation?.subsurfaceExposureRemDayEquivalent) || 0;
  const stellarZoneGate = deriveMoonStellarZoneGate({
    starHabitableZoneAu,
    starLuminosityLsol,
    starMassMsol,
    planetSemiMajorAxisAu,
    orbit,
    parentRadiusEarth,
  });
  const surfaceExomoonCalibration = computeSurfaceExomoonCalibration({
    starMassMsol,
    parentMassEarth,
    parentDensityGcm3,
    parentRadiusEarth,
    parentSemiMajorAxisAu: planetSemiMajorAxisAu,
    moonMassMoon,
    moonDensityGcm3,
    compositionOverride,
    spinState,
    stellarZonePass: stellarZoneGate.pass,
  });
  const surfaceCalibrationPass =
    !surfaceExomoonCalibration.applicable || surfaceExomoonCalibration.overallPass === true;
  const stellarZonePass = stellarZoneGate.pass;
  const orbitStabilityClass = String(orbit?.orbitStabilityClass || "");
  const stableOrbitPass =
    orbit?.longTermStable === true ||
    (orbit?.longTermStable == null &&
      !["outside-conservative-stable-region", "outside-hill-sphere", "inside-roche-limit"].includes(
        orbitStabilityClass,
      ) &&
      String(orbit?.semiMajorAxisGuard || "none") === "none");
  const stableOrbitLabel = stableOrbitPass
    ? String(
        orbit?.orbitStabilityLabel ||
          (orbit?.comfortablyStable === false
            ? "Near outer stability edge"
            : "Comfortably stable long-term orbit"),
      )
    : String(
        orbit?.orbitStabilityLabel || `Orbit guard: ${orbit?.semiMajorAxisGuard || "unknown"}`,
      );
  const surfaceWaterAvailable =
    hydrosphere?.surfaceLiquidPresent === true ||
    (Number(hydrosphere?.surfaceAccessibleLiquidFraction) || 0) > 0.05;
  const subsurfaceWaterAvailable =
    hydrosphere?.subsurfaceOceanPresent === true ||
    (Number(hydrosphere?.subsurfaceOceanScore) || 0) >= 0.35;
  const surfacePressurePa = Math.max(Number(atmosphere?.surfacePressurePa) || 0, 0);
  const surfaceAtmospherePass =
    surfacePressurePa >= 611 &&
    !["Airless", "Exosphere"].includes(String(atmosphere?.atmosphereClass || ""));
  const atmosphereStableEnough =
    surfaceAtmospherePass &&
    ["Stable", "Marginal"].includes(String(atmosphere?.stability?.balanceLabel || ""));
  const atmosphereMarginal =
    surfaceWaterAvailable && surfaceAtmospherePass && !atmosphereStableEnough;
  const radiationSurfacePass = ["Low", "Elevated"].includes(surfaceClass);
  const radiationSubsurfacePass =
    ["Low", "Elevated", "Harsh"].includes(subsurfaceClass) ||
    (subsurfaceWaterAvailable &&
      (subsurfaceIceShellKm >= 3 ||
        subsurfaceExposure <= 0.45 ||
        subsurfaceExposureRemDayEquivalent <= 10));
  const tidalOverheated =
    climateState === "Runaway greenhouse" ||
    hydrosphere?.steamPresent === true ||
    tidalHeatingEarth >= 5000 ||
    tidalHeatingWm2 >= 500;
  const frozenSurface =
    !surfaceWaterAvailable &&
    (hydrosphere?.frozenSurface === true || climate?.frozenSurfaceLikely === true);
  const surfaceOceanPlausible =
    stableOrbitPass &&
    stellarZonePass &&
    surfaceCalibrationPass &&
    surfaceWaterAvailable &&
    surfaceAtmospherePass &&
    !tidalOverheated &&
    !["Snowball", "Runaway greenhouse"].includes(climateState);
  const surfaceCalibrationLimited =
    stableOrbitPass &&
    stellarZonePass &&
    !surfaceCalibrationPass &&
    surfaceWaterAvailable &&
    surfaceAtmospherePass &&
    !tidalOverheated &&
    !["Snowball", "Runaway greenhouse"].includes(climateState);
  const surfaceRadiationLimited = surfaceOceanPlausible && !radiationSurfacePass;
  const surfaceBiospherePlausible =
    surfaceOceanPlausible &&
    atmosphereStableEnough &&
    radiationSurfacePass &&
    (Number(climate?.climateLivabilityFraction) || 0) >= 0.15 &&
    String(climate?.collapseRisk || "") !== "High";
  const subsurfaceOceanPlausible =
    stableOrbitPass && subsurfaceWaterAvailable && !tidalOverheated && radiationSubsurfacePass;
  const unstableOrbit = !stableOrbitPass;
  const surfaceGateCount = [
    stellarZonePass,
    stableOrbitPass,
    surfaceCalibrationPass,
    surfaceWaterAvailable,
    surfaceAtmospherePass,
    radiationSurfacePass && !tidalOverheated,
  ].filter(Boolean).length;
  const surfaceGateTotal = surfaceExomoonCalibration.applicable ? 6 : 5;
  const subsurfaceGateCount = [
    stableOrbitPass,
    subsurfaceWaterAvailable,
    radiationSubsurfacePass,
    !tidalOverheated,
  ].filter(Boolean).length;

  let primaryOutcome = "Marginal moon environment";
  if (unstableOrbit) primaryOutcome = "Unstable-orbit moon";
  else if (surfaceBiospherePlausible) primaryOutcome = "Surface life plausible";
  else if (surfaceRadiationLimited) primaryOutcome = "Radiation-limited ocean moon";
  else if (surfaceCalibrationLimited) primaryOutcome = "Cool-star mass-limited surface moon";
  else if (surfaceOceanPlausible && atmosphereMarginal)
    primaryOutcome = "Marginal surface-ocean moon";
  else if (surfaceOceanPlausible) primaryOutcome = "Surface ocean moon";
  else if (subsurfaceOceanPlausible) primaryOutcome = "Subsurface ocean moon";
  else if (tidalOverheated) primaryOutcome = "Tidal or overheated moon";
  else if (frozenSurface) primaryOutcome = "Frozen surface moon";

  const surfaceOutcome = surfaceBiospherePlausible
    ? "Surface life plausible"
    : surfaceRadiationLimited
      ? "Radiation-limited surface ocean"
      : surfaceCalibrationLimited
        ? "Surface ocean blocked by cool-star exomoon calibration"
        : surfaceOceanPlausible
          ? atmosphereMarginal
            ? "Marginal surface ocean"
            : "Surface ocean plausible"
          : frozenSurface
            ? "Frozen surface"
            : "Surface life unlikely";
  const subsurfaceOutcome = subsurfaceOceanPlausible
    ? "Subsurface ocean plausible"
    : "No strong subsurface-ocean signal";

  return {
    modelVersion: "moon-habitability-summary-v1",
    gates: {
      stellarZone: {
        pass: stellarZonePass,
        marginal: stellarZoneGate.marginal,
        label: stellarZoneGate.label,
      },
      stableOrbit: {
        pass: stableOrbitPass,
        label: stableOrbitLabel,
      },
      energyBudget: {
        surfacePass: surfaceWaterAvailable && !tidalOverheated && !frozenSurface,
        subsurfacePass: subsurfaceWaterAvailable && !tidalOverheated,
        label: tidalOverheated
          ? "Overheated by climate / tides"
          : surfaceWaterAvailable
            ? "Surface liquid supported"
            : subsurfaceWaterAvailable
              ? "Buried liquid supported"
              : frozenSurface
                ? "Frozen surface"
                : "No liquid-water support",
      },
      atmosphereRetention: {
        surfacePass: atmosphereStableEnough,
        marginal: atmosphereMarginal,
        label: atmosphereStableEnough
          ? "Stable surface atmosphere"
          : surfaceAtmospherePass
            ? "Marginal surface atmosphere"
            : "No stable surface atmosphere",
      },
      radiationShielding: {
        surfacePass: radiationSurfacePass,
        subsurfacePass: radiationSubsurfacePass,
        label: `${radiation?.surfaceClass || "Unknown"} surface / ${radiation?.subsurfaceClass || "Unknown"} subsurface`,
      },
      surfaceExomoonCalibration: {
        applicable: surfaceExomoonCalibration.applicable,
        pass: surfaceCalibrationPass,
        label: surfaceExomoonCalibration.label,
      },
    },
    classifications: {
      surfaceOceanPlausible,
      surfaceBiospherePlausible,
      surfaceRadiationLimited,
      surfaceCalibrationLimited,
      subsurfaceOceanPlausible,
      atmosphereMarginal,
      tidalOverheated,
      frozenSurface,
      unstableOrbit,
    },
    surfaceExomoonCalibration,
    primaryOutcome,
    surfaceOutcome,
    subsurfaceOutcome,
    gateSummary: `Surface ${surfaceGateCount}/${surfaceGateTotal} | Subsurface ${subsurfaceGateCount}/4`,
  };
}

function buildMoonAtmosphereStability({
  ageGyr,
  atmosphere,
  climate,
  geology,
  hydrosphere,
  radiation,
  surfaceTempK,
  gravityG,
  escapeVelocityKmS,
}) {
  const pressureAtm = Math.max(Number(atmosphere.surfacePressureAtm) || 0, 0);
  if (pressureAtm <= 0) {
    return {
      modelVersion: "moon-atmosphere-stability-v1",
      sourceLossBalance: 0,
      balanceLabel: "None",
      dominantLossChannel: "No long-lived atmosphere",
      estimatedLifetimeGyr: 0,
      collapseRisk: "None",
      hazeClass: "None",
      cloudClass: "None",
    };
  }

  const volcanicSupply = Math.max(Number(geology?.volcanicActivityScore) || 0, 0);
  const cryoSupply = Math.max(Number(geology?.cryovolcanicActivityScore) || 0, 0);
  const hydrosphereSupport = Math.max(Number(hydrosphere?.subsurfaceOceanScore) || 0, 0);
  const supplyScore = clamp(
    volcanicSupply * 0.45 + cryoSupply * 0.4 + hydrosphereSupport * 0.15,
    0,
    1,
  );
  const thermalEscapeScore = clamp(
    ((Math.max(Number(surfaceTempK) || 0, 0) - 110) / 240) *
      (1.3 - Math.min(1.2, (escapeVelocityKmS || 0) / 4)),
    0,
    1,
  );
  const sputteringScore = clamp(
    Math.log10(1 + Math.max(Number(radiation?.magnetosphericRadRemDay) || 0, 0)) / 4.2,
    0,
    1,
  );
  const collapsePenalty =
    climate?.collapseRisk === "High" ? 0.35 : climate?.collapseRisk === "Moderate" ? 0.18 : 0;
  const retentionScore = clamp(
    0.4 +
      Math.min(0.3, Math.max(Number(gravityG) || 0, 0) * 0.18) +
      Math.min(0.25, Math.max(Number(escapeVelocityKmS) || 0, 0) * 0.04) -
      thermalEscapeScore * 0.35 -
      sputteringScore * 0.2 -
      collapsePenalty,
    0,
    1,
  );
  const sourceLossBalance = clamp(
    supplyScore * 0.55 + retentionScore * 0.45 - thermalEscapeScore * 0.2,
    0,
    1,
  );
  const estimatedLifetimeGyr = clamp(
    ageGyr * (0.08 + sourceLossBalance * 1.9 + retentionScore * 0.35),
    0.01,
    50,
  );
  const dominantLossChannel =
    sputteringScore >= thermalEscapeScore && sputteringScore >= 0.18
      ? "Sputtering / magnetospheric stripping"
      : thermalEscapeScore >= 0.2
        ? "Thermal escape"
        : climate?.collapseRisk === "High"
          ? "Cold-trap collapse"
          : "Minor escape losses";
  const balanceLabel =
    sourceLossBalance >= 0.72 ? "Stable" : sourceLossBalance >= 0.45 ? "Marginal" : "Transient";
  const dominantSpecies = String(atmosphere.dominantSpecies || "");
  const methaneShare = Math.max(Number(atmosphere.composition?.ch4) || 0, 0);
  const n2Share = Math.max(Number(atmosphere.composition?.n2) || 0, 0);
  const methaneNitrogenHaze = pressureAtm >= 0.03 && methaneShare >= 0.005 && n2Share >= 0.2;
  const hazeClass =
    dominantSpecies === "CH₄" || dominantSpecies === "CO"
      ? pressureAtm >= 0.5
        ? "Organic haze"
        : "Light photochemical haze"
      : dominantSpecies === "SO₂"
        ? "Sulfur haze"
        : "None";
  const effectiveHazeClass =
    methaneNitrogenHaze && hazeClass === "None"
      ? pressureAtm >= 0.5
        ? "Organic haze"
        : "Light photochemical haze"
      : hazeClass;
  const cloudClass =
    hydrosphere?.liquidOceanFraction > 0.15
      ? pressureAtm >= 0.3
        ? "Water cloud deck"
        : "Patchy water clouds"
      : hydrosphere?.steamFraction > 0.1
        ? "Steam cloud deck"
        : pressureAtm >= 1.2
          ? "High aerosol cloud"
          : "Sparse clouds";

  return {
    modelVersion: "moon-atmosphere-stability-v1",
    sourceLossBalance,
    balanceLabel,
    dominantLossChannel,
    estimatedLifetimeGyr,
    collapseRisk: climate?.collapseRisk || "Low",
    hazeClass: effectiveHazeClass,
    cloudClass,
  };
}

function moonPhotochemistryFromAtmosphereStability({ atmosphere, atmosphereStability } = {}) {
  const hazeClass = String(atmosphereStability?.hazeClass || "None");
  const pressureAtm = Math.max(Number(atmosphere?.surfacePressureAtm) || 0, 0);
  const methaneFraction = Math.max(Number(atmosphere?.composition?.ch4) || 0, 0);
  const pressureSupport = clamp(Math.log10(1 + pressureAtm) / Math.log10(2.5), 0, 1);
  const methaneSupport = clamp(methaneFraction / 0.02, 0, 1);
  const classSupport =
    hazeClass === "Organic haze" ? 0.85 : hazeClass === "Light photochemical haze" ? 0.45 : 0;
  const likelihoodScore = clamp(
    classSupport * pressureSupport * (0.55 + 0.45 * methaneSupport),
    0,
    1,
  );
  const surfaceLightReductionFraction = clamp(0.45 * likelihoodScore, 0, 0.45);
  const antiGreenhouseCoolingK = clamp(12 * likelihoodScore, 0, 12);

  return {
    modelVersion: "moon-photochemistry-v1",
    haze: {
      modelVersion: "moon-haze-bridge-v1",
      hazeClass,
      likelihoodScore,
      antiGreenhouseCoolingK,
      surfaceLightReductionFraction,
      notes:
        likelihoodScore > 0
          ? [
              "Moon haze is inferred from retained methane-rich atmosphere stability; bounded to Titan-order anti-greenhouse cooling.",
            ]
          : ["No methane-rich photochemical haze support from moon atmosphere stability."],
    },
  };
}

function buildMoonResonance({
  moonSystemContext,
  orbit,
  tides,
  climate,
  radiation,
  parentRadiusEarth,
}) {
  const tidalHabitableZone = deriveMoonTidalHabitableZone({
    baseZone: climate?.tidalHabitableZone || moonSystemContext?.tidalHabitableZone || null,
    orbit,
    tides,
    radiation,
    parentRadiusEarth,
  });
  return {
    modelVersion: "moon-resonance-v2",
    nearestResonance: moonSystemContext?.nearestResonance || null,
    chainMembership: moonSystemContext?.chainMembership || null,
    laplaceStatus: moonSystemContext?.laplaceChainId ? "Laplace chain member" : "None",
    laplaceChainId: moonSystemContext?.laplaceChainId || null,
    autoForcedEccentricity: Math.max(Number(moonSystemContext?.autoForcedEccentricity) || 0, 0),
    forcingPartnerMoonId: moonSystemContext?.forcingPartnerMoonId || null,
    forcingPartnerMoonName: moonSystemContext?.forcingPartnerMoonName || null,
    forcingOffsetPct:
      moonSystemContext?.forcingOffsetPct == null
        ? null
        : Math.max(Number(moonSystemContext.forcingOffsetPct) || 0, 0),
    migrationTrendState: moonSystemContext?.migrationTrendState || "neutral",
    migrationTrendStrength: moonSystemContext?.migrationTrendStrength || "none",
    ratioDriftPctPerGyr:
      moonSystemContext?.ratioDriftPctPerGyr == null
        ? null
        : toFinite(moonSystemContext.ratioDriftPctPerGyr, null),
    forcedEccentricity: Math.max(Number(moonSystemContext?.forcedEccentricity) || 0, 0),
    forcedEccentricitySource: moonSystemContext?.forcedEccentricitySource || "none",
    sustainedHeatingFlag:
      !!moonSystemContext?.sustainedHeatingLikely || (Number(tides?.tidalHeatingEarth) || 0) >= 1,
    tidalHabitableZone,
    withinTidalHabitableZone: !!tidalHabitableZone?.withinZone,
    orbitalPeriodSiderealDays: orbit?.orbitalPeriodSiderealDays ?? null,
  };
}

function formatSynchronousOrbitDistance(tides) {
  if (!tides?.synchronousOrbitValid || !(Number(tides.synchronousOrbitKm) > 0)) {
    return "Unknown";
  }
  const parentRadii =
    Number(tides.synchronousOrbitParentRadii) > 0
      ? ` (${fmt(tides.synchronousOrbitParentRadii, 2)} parent radii)`
      : "";
  return `${fmt(tides.synchronousOrbitKm, 0)} km${parentRadii}`;
}

function formatSynchronousOrbitContext(tides) {
  if (!tides?.synchronousOrbitValid || tides.insideSynchronousOrbit == null) return "Unknown";
  const side = tides.insideSynchronousOrbit ? "inside sync" : "outside sync";
  const direction =
    tides.migrationDirectionFromSync === "unknown"
      ? "direction uncertain"
      : `${tides.migrationDirectionFromSync} torque expected`;
  return `${side} - ${direction}`;
}

function classLabel(value, fallback = "Unknown") {
  const text = String(value || "")
    .trim()
    .replace(/[-_]+/g, " ");
  if (!text) return fallback;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function parentJ2FromModel(parent) {
  return (
    parent?.derived?.oblateness?.j2 ??
    parent?.oblateness?.j2 ??
    parent?.model?.oblateness?.j2 ??
    parent?.derived?.j2 ??
    parent?.inputs?.j2 ??
    null
  );
}

function buildInitialMoonTidalPersistenceContext({ tides, moonSystemContext }) {
  const hasSystemContext = moonSystemContext && typeof moonSystemContext === "object";
  const eccentricityPersistence =
    moonSystemContext?.eccentricityEquilibrium?.state ||
    (moonSystemContext?.sustainedHeatingLikely ? "maintained" : "uncertain");
  const supportingMechanism =
    moonSystemContext?.forcedEccentricitySource ||
    (moonSystemContext?.nearestResonance ? "near-resonance" : "none");
  const limitingFactor =
    eccentricityPersistence === "uncertain" &&
    Math.max(toFinite(tides?.tidalHeatingEarth, 0), 0) > 0.01
      ? hasSystemContext
        ? "pending-eccentricity-equilibrium"
        : "no-moon-system-context"
      : "";
  return buildSustainedTidalHeatingContext({
    tidalHeatingEarth: tides?.tidalHeatingEarth,
    eccentricityPersistence,
    heatingLikelySustained: moonSystemContext?.sustainedHeatingLikely,
    supportingMechanism,
    limitingFactor,
    reasons: [
      moonSystemContext?.nearestResonance
        ? `Nearest resonance: ${moonSystemContext.nearestResonance.label}.`
        : "",
      tides?.synchronousOrbitNote,
    ].filter(Boolean),
  });
}

function buildMoonStabilityContextForHabitabilityBridge(orbit = {}) {
  const stabilityClass = String(orbit.orbitStabilityClass || "unknown");
  const requestedStabilityClass = String(orbit.requestedOrbitStabilityClass || "");
  const hardClasses = new Set([
    "inside-parent-collision-limit",
    "inside-roche-limit",
    "outside-hill-sphere",
    "outside-conservative-stable-region",
  ]);
  const requestedHard = hardClasses.has(requestedStabilityClass);
  if (hardClasses.has(stabilityClass) || requestedHard) {
    return {
      state: "unstable",
      confidence: "high",
      reasons: [
        requestedHard ? orbit.requestedOrbitStabilityLabel : orbit.orbitStabilityLabel,
      ].filter(Boolean),
    };
  }
  if (stabilityClass === "near-outer-stability-edge" || orbit.longTermStable === false) {
    return {
      state: "crowded",
      confidence: "low",
      reasons: [orbit.orbitStabilityLabel || "Moon orbit is near the stability edge."],
    };
  }
  if (!stabilityClass || stabilityClass === "unknown") {
    return {
      state: "unknown",
      confidence: "unknown",
      reasons: ["Moon orbital stability context is incomplete."],
    };
  }
  return {
    state: "stable",
    confidence: "high",
    reasons: [orbit.orbitStabilityLabel].filter(Boolean),
  };
}

function buildMoonSummaryResult({
  hostFrame,
  mStarMsol,
  rStarRsol,
  lStarLsol,
  ageGyr,
  mPlanetME,
  rhoPlanetGcm3,
  rPlanetRE,
  aPlanetAU,
  ePlanet,
  rotPlanetHours,
  mMoonMM,
  rhoMoonGcm3,
  albedo,
  aMoonKmInput,
  eMoon,
  inc,
  initialRotHours,
  compositionOverride,
  rMoonRM,
  gMoonG,
  vEscKmS,
  orbit,
  temperature,
  atmosphere,
  hydrosphere,
  climate,
  cloudCirculation,
  impactEnvironmentContext,
  atmosphereEvolutionContext,
  stellarHistoryDoseContext,
  co2ClimateTendencyContext,
  smallBodyReservoirContext,
  interiorEvolutionContext,
  carbonCycleContext,
  oceanChemistryContext,
  nitrogenCycleContext,
  biosignatureContext,
  climateChemistryForcing,
  coupledClimatePass,
  biosphere,
  interior,
  magnetosphere,
  radiation,
  surfaceBoundaryExosphere,
  spinState,
  tides,
  compositionClass,
  rockyBodyComposition,
  solidBodyStructure,
  solidBodyResponse,
  moonGeodynamicsContext,
  resonance,
  formation,
  surfaceExomoonCalibration,
  habitabilitySummary,
  unifiedMoonHabitability,
  tidalPersistenceContext,
  dynamicalHabitabilityBridge,
  eclipseTimingContext,
  moonOrientationContext,
}) {
  return {
    hostFrame: hostFrame
      ? {
          id: hostFrame.id,
          label: hostFrame.label,
          frameKind: hostFrame.frameKind,
          orbitFamilyKind: hostFrame.orbitFamilyKind,
        }
      : null,
    star: { massMsol: mStarMsol, radiusRsol: rStarRsol, luminosityLsol: lStarLsol, ageGyr },
    planet: {
      massEarth: mPlanetME,
      densityGcm3: rhoPlanetGcm3,
      radiusEarth: rPlanetRE,
      semiMajorAxisAu: aPlanetAU,
      eccentricity: ePlanet,
      rotationPeriodHours: rotPlanetHours,
    },
    inputs: {
      massMoon: mMoonMM,
      densityGcm3: rhoMoonGcm3,
      albedo,
      semiMajorAxisKmInput: aMoonKmInput,
      semiMajorAxisKm: orbit.semiMajorAxisKm,
      eccentricity: eMoon,
      inclinationDeg: inc,
      initialRotationPeriodHours: initialRotHours,
      compositionOverride: compositionOverride || null,
      compositionMode: rockyBodyComposition?.compositionMode || "inferred",
      originPathway: formation?.pathwayId || "auto",
    },
    physical: {
      radiusMoon: rMoonRM,
      gravityG: gMoonG,
      escapeVelocityKmS: vEscKmS,
      solidBodyStructure,
      solidBodyResponse,
      surfaceFieldEarths: magnetosphere?.intrinsicFieldStrengthRelEarth || 0,
      effectiveCoreMassFraction: rockyBodyComposition?.effectiveCoreMassFraction,
      effectiveCoreMassFractionPct: rockyBodyComposition?.effectiveCoreMassFractionPct,
      effectiveWaterMassFraction: rockyBodyComposition?.effectiveWaterMassFraction,
      effectiveWaterMassFractionPct: rockyBodyComposition?.effectiveWaterMassFractionPct,
    },
    composition: rockyBodyComposition,
    orbit: {
      moonZoneInnerKm: orbit.zoneInnerKm,
      classicalRocheLimitKm: orbit.classicalRocheLimitKm,
      effectiveInnerLimitKm: orbit.effectiveInnerLimitKm,
      effectiveInnerLimitKind: orbit.effectiveInnerLimitKind,
      collisionInnerLimitKm: orbit.collisionInnerLimitKm,
      smallCohesiveRocheBypass: orbit.smallCohesiveRocheBypass,
      smallCohesiveRocheBypassReason: orbit.smallCohesiveRocheBypassReason,
      moonEquivalentDiameterKm: orbit.moonEquivalentDiameterKm,
      rocheLimitModel: orbit.rocheLimitModel,
      moonZoneOuterKm: orbit.zoneOuterKm,
      hillRadiusKm: orbit.hillRadiusKm,
      stableOuterLimitKm: orbit.stableOuterLimitKm,
      progradeStableOuterLimitKm: orbit.progradeStableOuterLimitKm,
      retrogradeStableOuterLimitKm: orbit.retrogradeStableOuterLimitKm,
      comfortOuterLimitKm: orbit.comfortOuterLimitKm,
      semiMajorAxisGuard: orbit.semiMajorAxisGuard,
      semiMajorAxisHillMaxKm: orbit.maxAHillKm,
      requestedOrbitStabilityClass: orbit.requestedOrbitStabilityClass,
      requestedOrbitStabilityLabel: orbit.requestedOrbitStabilityLabel,
      orbitStabilityClass: orbit.orbitStabilityClass,
      orbitStabilityLabel: orbit.orbitStabilityLabel,
      longTermStable: orbit.longTermStable,
      comfortablyStable: orbit.comfortablyStable,
      stabilityMarginFraction: orbit.stabilityMarginFraction,
      orbitalDirection: orbit.orbitalDirection,
      orbitalPeriodSiderealDays: orbit.orbitalPeriodSiderealDays,
      orbitalPeriodSynodicDays: orbit.orbitalPeriodSynodicDays,
    },
    temperature: {
      equilibriumK: Math.round(temperature.equilibriumK),
      baselineSurfaceK: temperature.surfaceK,
      baselineSurfaceC: temperature.surfaceC,
      surfaceK: coupledClimatePass?.effectiveSurfaceTempK ?? temperature.surfaceK,
      surfaceC: (coupledClimatePass?.effectiveSurfaceTempK ?? temperature.surfaceK) - 273.15,
      radiogenicWm2: temperature.radiogenicWm2,
      thermalEnvelope: temperature.thermalEnvelope,
    },
    atmosphere: {
      atmosphereClass: atmosphere.atmosphereClass,
      atmosphereRegime: atmosphere.atmosphereRegime,
      atmosphereRegimeLabel: classLabel(atmosphere.atmosphereRegime, "Unknown"),
      sourceClass: atmosphere.sourceClass,
      surfacePressurePa: atmosphere.surfacePressurePa,
      compositionSummary: atmosphere.compositionSummary,
      surfaceBoundaryExosphere,
      ledger: atmosphere.ledger,
    },
    exosphere: surfaceBoundaryExosphere,
    hydrosphere: {
      regime: hydrosphere.regime,
      hydrosphereState: hydrosphere.hydrosphereState,
      subsurfaceOceanPresent: hydrosphere.subsurfaceOceanPresent,
      surfaceAccessibleLiquidFraction: hydrosphere.surfaceAccessibleLiquidFraction,
    },
    climate: {
      climateState: climate.climateState,
      seasonalitySummary: climate.seasonalitySummary,
      cloudCirculation,
      impactEnvironmentContext,
      atmosphereEvolutionContext,
      stellarHistoryDoseContext,
      co2ClimateTendencyContext,
      smallBodyReservoirContext,
      interiorEvolutionContext,
      moonGeodynamicsContext,
      carbonCycleContext,
      oceanChemistryContext,
      nitrogenCycleContext,
      biosignatureContext,
      climateChemistryForcing,
      coupledClimatePass,
    },
    biosphere: {
      surfaceBiosphereClass: biosphere.surfaceBiosphereClass,
      plantLifePlausibility: biosphere.plantLifePlausibility,
    },
    interior,
    magnetosphere,
    radiation,
    spinState,
    tides: {
      compositionClass: compositionClass || null,
      tidalRegime: tides.tidalRegime,
      smallBodyRegime: tides.smallBodyRegime,
      baseQMoon: tides.baseQMoon,
      baseRigidityMoonGPa: tides.baseRigidityMoonGPa,
      moonMomentOfInertiaFactor: tides.moonMomentOfInertiaFactor,
      solidBodyResponse: tides.solidBodyResponse,
      solidBodyStructureClass: tides.solidBodyStructureClass,
      k2Model: tides.k2Model,
      qModel: tides.qModel,
      qPlanet: tides.qPlanet,
      qPlanetModel: tides.qPlanetModel,
      tidalUncertaintyCaveats: tides.tidalUncertaintyCaveats,
      synchronousOrbitKm: tides.synchronousOrbitKm,
      synchronousOrbitParentRadii: tides.synchronousOrbitParentRadii,
      insideSynchronousOrbit: tides.insideSynchronousOrbit,
      migrationDirectionFromSync: tides.migrationDirectionFromSync,
      synchronousOrbitNote: tides.synchronousOrbitNote,
      synchronousOrbitValid: tides.synchronousOrbitValid,
    },
    dynamicalContext: {
      tidalPersistenceContext,
      eclipseTimingContext,
      moonOrientationContext,
    },
    resonance,
    formation,
    surfaceExomoonCalibration,
    derived: {
      exosphere: surfaceBoundaryExosphere,
      rockyBodyComposition,
      solidBodyStructure,
      solidBodyResponse,
      moonGeodynamicsContext,
      componentMassFractions: rockyBodyComposition?.componentMassFractions,
      elementMassFractions: rockyBodyComposition?.elementMassFractions,
      compositionMode: rockyBodyComposition?.compositionMode,
      compositionValidation: rockyBodyComposition?.validation,
      effectiveCoreMassFraction: rockyBodyComposition?.effectiveCoreMassFraction,
      effectiveCoreMassFractionPct: rockyBodyComposition?.effectiveCoreMassFractionPct,
      effectiveWaterMassFraction: rockyBodyComposition?.effectiveWaterMassFraction,
      effectiveWaterMassFractionPct: rockyBodyComposition?.effectiveWaterMassFractionPct,
    },
    habitability: {
      habitabilityIndex: unifiedMoonHabitability.score,
      habitabilityModelVersion: unifiedMoonHabitability.version,
      breakdown: {
        solventPathway: unifiedMoonHabitability.breakdown.solventPathway,
      },
      hydrosphere,
      moonGeodynamicsContext,
      dynamicalPersistence: dynamicalHabitabilityBridge,
      coupledClimatePass,
      impactEnvironmentContext,
      summary: habitabilitySummary,
    },
    display: {
      atmosphereClass: atmosphere.atmosphereClass,
      atmosphereTrend: atmosphere.ledger?.trendLabel || "Not evaluated",
      atmosphereEvolution: atmosphereEvolutionContext?.pressureTrendClass || "Not evaluated",
      atmosphereVolatileLoss: atmosphereEvolutionContext?.volatileLossRiskClass || "Not evaluated",
      exosphere: surfaceBoundaryExosphere?.present
        ? surfaceBoundaryExosphere.exosphereClass
        : "No icy sputtered O2 exosphere",
      exosphereSource: surfaceBoundaryExosphere?.sourceMechanism || "none",
      exosphereO2Production:
        surfaceBoundaryExosphere?.oxygenProductionKgS == null
          ? "Not quantified"
          : `${fmt(surfaceBoundaryExosphere.oxygenProductionKgS, 1)} kg/s`,
      exosphereIonPickup: surfaceBoundaryExosphere?.ionPickupClass || "none",
      exosphereAbioticO2:
        surfaceBoundaryExosphere?.abioticOxygenSource === true
          ? "Abiotic exosphere-only O2"
          : "No exosphere O2 source",
      exospherePressureEffect:
        surfaceBoundaryExosphere?.pressureContributionAtm === 0
          ? "0 atm retained pressure"
          : "No retained-pressure contribution",
      stellarHistoryWaterLoss:
        stellarHistoryDoseContext?.outputs?.waterLossRiskClass || "Not evaluated",
      stellarHistoryAbioticOxygen:
        stellarHistoryDoseContext?.outputs?.abioticOxygenRiskClass || "Not evaluated",
      atmosphereDominantSource: atmosphere.ledger?.dominantSource?.label || "None",
      atmosphereDominantSink: atmosphere.ledger?.dominantSink?.label || "None",
      atmosphereStabilityTimescale: atmosphere.ledger?.timescaleLabel || "Not evaluated",
      impactEnvironment: impactEnvironmentContext?.outputs?.impactFluxClass || "Not evaluated",
      craterRetention: impactEnvironmentContext?.outputs?.craterRetentionClass || "Not evaluated",
      co2ClimateTendency: co2ClimateTendencyContext?.co2DrawdownTendency || "Not evaluated",
      co2BuildupTendency: co2ClimateTendencyContext?.co2BuildupTendency || "Not evaluated",
      co2ThermostatAdjustment:
        co2ClimateTendencyContext?.thermostatAdjustmentK == null
          ? "0.0 K"
          : `${co2ClimateTendencyContext.thermostatAdjustmentK > 0 ? "+" : ""}${fmt(
              co2ClimateTendencyContext.thermostatAdjustmentK,
              1,
            )} K`,
      smallBodyReservoir: smallBodyReservoirContext?.outputs?.impactFluxClass || "Not evaluated",
      smallBodyVolatileDelivery:
        smallBodyReservoirContext?.outputs?.volatileDeliveryClass || "Not evaluated",
      coupledClimateTendency: climateChemistryForcing?.labelOnlyClimateState || "Not evaluated",
      photochemicalForcing:
        climateChemistryForcing?.netDeltaK === 0
          ? "0 K diagnostic"
          : `${climateChemistryForcing?.netDeltaK > 0 ? "+" : ""}${fmt(
              climateChemistryForcing?.netDeltaK,
              1,
            )} K diagnostic`,
      coupledSurfaceTemp: climateChemistryForcing?.coupledSurfaceTempK
        ? `${fmt(climateChemistryForcing.coupledSurfaceTempK, 0)} K`
        : "Not evaluated",
      cloudRegime: cloudCirculation?.circulationRegime || "Not evaluated",
      heatRedistribution:
        cloudCirculation?.heatRedistributionEfficiency != null
          ? `${fmt(cloudCirculation.heatRedistributionEfficiency * 100, 0)}% efficiency`
          : "Not evaluated",
      carbonCycle: carbonCycleContext?.tendencyClass || "Not evaluated",
      oceanChemistry: oceanChemistryContext?.summaryLabel || "Not evaluated",
      nitrogenCycle: nitrogenCycleContext?.outputs?.n2ReservoirClass || "Not evaluated",
      nitrogenPressureBuffer:
        nitrogenCycleContext?.outputs?.pressureBufferSupportClass || "Not evaluated",
      nitrogenNutrientLimitation:
        nitrogenCycleContext?.outputs?.nutrientLimitationClass || "Not evaluated",
      biosignatureContext: biosignatureContext?.interpretationClass || "Not evaluated",
      disequilibriumStrength: biosignatureContext?.disequilibriumStrength || "Low",
      oxygenFalsePositiveRisk: biosignatureContext?.o2O3FalsePositiveRisk || "Low",
      hydrosphereState: hydrosphere.hydrosphereState,
      climateState: climate.climateState,
      globalEquilibriumTemp: temperature.thermalEnvelope?.globalEquilibriumK
        ? `${fmt(temperature.thermalEnvelope.globalEquilibriumK, 0)} K`
        : `${fmt(temperature.equilibriumK, 0)} K`,
      observableSurfaceRange: temperature.thermalEnvelope?.observableTemperatureRangeK
        ? `${fmt(temperature.thermalEnvelope.observableTemperatureRangeK.min, 0)}-${fmt(
            temperature.thermalEnvelope.observableTemperatureRangeK.max,
            0,
          )} K`
        : "Not evaluated",
      thermalEnvelopeConfidence: temperature.thermalEnvelope?.thermalModelConfidence || "medium",
      thermalEnvelopeCaveats: Array.isArray(temperature.thermalEnvelope?.thermalModelCaveats)
        ? temperature.thermalEnvelope.thermalModelCaveats.join(" | ")
        : "",
      surfaceBiosphere: biosphere.surfaceBiosphereClass,
      subsurfaceOcean: hydrosphere.subsurfaceOceanPresent ? "Yes" : "No",
      spinState: spinState?.state || "Not evaluated",
      synchronousOrbit: formatSynchronousOrbitDistance(tides),
      synchronousOrbitContext: formatSynchronousOrbitContext(tides),
      tidalHeatingPersistence: tidalPersistenceContext?.sustainedTidalHeatingClass || "unknown",
      eclipseTimingReadiness: classLabel(
        eclipseTimingContext?.outputs?.scheduleReadinessClass,
        "Unknown",
      ),
      eclipseFrequency: classLabel(eclipseTimingContext?.outputs?.eclipseFrequencyClass, "Unknown"),
      laplaceRegime: classLabel(moonOrientationContext?.outputs?.laplaceRegimeClass, "Unknown"),
      nodalPrecession: classLabel(moonOrientationContext?.outputs?.nodalPrecessionClass, "Unknown"),
      cassiniReadiness: classLabel(
        moonOrientationContext?.outputs?.cassiniReadinessClass,
        "Unknown",
      ),
      dynamicalPersistenceConfidence: dynamicalHabitabilityBridge?.confidence || "unknown",
      tidalRegime: tides.tidalRegime || "regular moon",
      tidalResponseModel: tides.k2Model || "homogeneous-elastic-moon-v1",
      solidBodyStructure: classLabel(solidBodyStructure?.structureClass, "Not evaluated"),
      compactnessClass: classLabel(solidBodyStructure?.compactnessClass, "Not evaluated"),
      moonGeodynamics: classLabel(
        moonGeodynamicsContext?.outputs?.dominantProcess,
        "Not evaluated",
      ),
      dynamoSummary: classLabel(
        magnetosphere?.dynamoContext?.dynamoPlausibilityClass,
        "Not evaluated",
      ),
      tidalUncertaintyCaveats: Array.isArray(tides.tidalUncertaintyCaveats)
        ? tides.tidalUncertaintyCaveats.join(" | ")
        : "",
      compositionClass: compositionClass || compositionOverride || "Not evaluated",
      habitabilityIndex: unifiedMoonHabitability.score.toFixed(3),
      lifeClass: habitabilitySummary.primaryOutcome,
      surfaceHabitability: habitabilitySummary.surfaceOutcome,
      subsurfaceHabitability: habitabilitySummary.subsurfaceOutcome,
      habitabilityGates: habitabilitySummary.gateSummary,
      surfaceRadiation: radiation.surfaceClass,
      surfaceExomoonCalibration:
        surfaceExomoonCalibration?.applicable === true
          ? surfaceExomoonCalibration.label
          : "Not targeted",
    },
  };
}

function attachMoonEraTimeline(result, { planetModel = null, systemContext = {} } = {}) {
  const eraTimeline = buildPlanetaryEraTimelineForMoon({
    model: result,
    planetModel,
    star: result?.star || null,
    systemContext,
  });
  result.derived = {
    ...(result.derived && typeof result.derived === "object" ? result.derived : {}),
    eraTimeline,
  };
  result.display = {
    ...(result.display && typeof result.display === "object" ? result.display : {}),
    eraTimelineSummary: eraTimeline.summary,
  };
  return result;
}

export function calcMoonExact({
  starMassMsol,
  starAgeGyr,
  starMetallicityFeH,
  starRadiusRsolOverride,
  starLuminosityLsolOverride,
  starTempKOverride,
  starEvolutionMode,
  starHabitableZoneAu = null,
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
  moon,
  parentOverride,
  habitabilityPolicy,
  detailLevel = "full",
  moonSystemContext = null,
  smallBodyReservoirContext = null,
}) {
  const moonInputs = normalizeMoonInputs(moon || {});
  const parent =
    parentOverride ||
    calcPlanetExact({
      starMassMsol,
      starAgeGyr,
      starMetallicityFeH,
      starRadiusRsolOverride,
      starLuminosityLsolOverride,
      starTempKOverride,
      starEvolutionMode,
      hostFrameId,
      hostFrame,
      hostXuvFluxEarthAt1Au,
      hostPrebioticUvEarthAt1Au,
      hostWindPressureEarthAt1Au,
      companionFluxEarth,
      companionXuvFluxEarth,
      companionPrebioticUvEarth,
      companionWindPressureEarth,
      fluxVariabilityFraction,
      planet,
      smallBodyReservoirContext,
      detailLevel: detailLevel === "summary" ? "summary" : "full",
    });

  const mStarMsol = clamp(starMassMsol, 0.01, 100);
  const ageGyr = clamp(starAgeGyr, 0, 20);

  const mPlanetME = clamp(parent.inputs.massEarth, 0.001, 10000);
  const rhoPlanetGcm3 = clamp(parent.derived.densityGcm3, 0.1, 100);
  const rPlanetRE = clamp(parent.derived.radiusEarth, 0.01, 1000);
  const aPlanetAU = clamp(parent.inputs.semiMajorAxisAu, 0.001, 1e6);
  const ePlanet = clamp(parent.inputs.eccentricity, 0, 0.99);
  const rotPlanetHours = clamp(parent.inputs.rotationPeriodHours, 0.1, 1e6);
  const surfaceFieldEarths = clamp(parent.derived?.surfaceFieldEarths ?? 0, 0, 1000);
  const parentMagnetosphereEnvironment =
    parent.derived?.magnetosphereEnvironment || parent.magnetic?.magnetosphereEnvironment || null;
  const parentMagnetopauseRp =
    parent.derived?.magnetopauseRp ?? parentMagnetosphereEnvironment?.magnetopauseRp ?? null;
  const hydrosphereMode = moonInputs.hydrosphereMode;
  const atmosphereMode = moonInputs.atmosphereMode;
  const orbitalCouplingMode = moonInputs.orbitalCouplingMode;
  const meanCompanionFluxEarth = clamp(toFinite(companionFluxEarth, 0), 0, 1000);
  const meanCompanionXuvFluxEarth = clamp(toFinite(companionXuvFluxEarth, 0), 0, 1000);
  const meanCompanionPrebioticUvEarth = clamp(toFinite(companionPrebioticUvEarth, 0), 0, 1000);
  const meanCompanionWindPressureEarth = clamp(toFinite(companionWindPressureEarth, 0), 0, 1000);
  const hostFrameFluxVariabilityFraction = clamp(toFinite(fluxVariabilityFraction, 0), 0, 10);

  const mMoonMM = clamp(moonInputs.massMoon ?? 1.0, 1e-8, 10000);
  const rhoMoonGcm3 = clamp(moonInputs.densityGcm3 ?? 3.34, 0.1, 100);
  const albedo = clamp(moonInputs.albedo ?? 0.11, 0, 0.95);
  const aMoonKmInput = clamp(moonInputs.semiMajorAxisKm ?? 384748, 10, 1e9);
  const eccentricityInput = clamp(moonInputs.eccentricity ?? 0.055, 0, 0.99);
  const manualForcedEccentricity = moonInputs.forcedEccentricity;
  const forcedEccentricity =
    orbitalCouplingMode === "core"
      ? 0
      : clamp(
          manualForcedEccentricity != null
            ? manualForcedEccentricity
            : (moonSystemContext?.forcedEccentricity ?? 0),
          0,
          0.2,
        );
  const eMoon = clamp(Math.max(eccentricityInput, forcedEccentricity), 0, 0.99);
  const inc = clamp(moonInputs.inclinationDeg ?? 5.15, 0, 180);
  const initialRotHours = moonInputs.initialRotationPeriodHours
    ? toFinite(moonInputs.initialRotationPeriodHours, 12)
    : 12;

  const resolvedStar = calcStar({
    massMsol: mStarMsol,
    ageGyr,
    metallicityFeH: starMetallicityFeH,
    radiusRsolOverride: starRadiusRsolOverride,
    luminosityLsolOverride: starLuminosityLsolOverride,
    tempKOverride: starTempKOverride,
    evolutionMode: starEvolutionMode,
  });
  const rStarRsol = resolvedStar.radiusRsol ?? massToRadius(mStarMsol);
  const lStarLsol = resolvedStar.luminosityLsol ?? massToLuminosity(mStarMsol);
  const starTempK =
    resolvedStar.tempK ?? (rStarRsol > 0 ? (lStarLsol / rStarRsol ** 2) ** 0.25 * 5776 : 0);
  const effectiveStarHabitableZoneAu =
    hostFrame?.zones?.habitableZoneAu || starHabitableZoneAu || resolvedStar.habitableZoneAu;
  const environmentForcing = buildEnvironmentForcing({
    bodyType: "moon",
    solverFamily: "moon",
    starModel: resolvedStar,
    starConfig: {
      massMsol: mStarMsol,
      ageGyr,
      metallicityFeH: starMetallicityFeH,
      radiusRsolOverride: starRadiusRsolOverride,
      luminosityLsolOverride: starLuminosityLsolOverride,
      tempKOverride: starTempKOverride,
      evolutionMode: starEvolutionMode,
    },
    orbitAu: aPlanetAU,
    eccentricity: ePlanet,
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

  const rMoonRM = (mMoonMM / (rhoMoonGcm3 / 3.34)) ** (1 / 3);
  const gMoonG = (mMoonMM / rMoonRM ** 2) * 0.1654;
  const vEscKmS = Math.sqrt(mMoonMM / rMoonRM) * 2.38;
  const compositionMode = moonInputs.compositionMode || "inferred";
  const compositionNormalizeMode = moonInputs.compositionNormalizeMode || "warn";
  const compositionStructureSource = moonInputs.compositionStructureSource || "inferred";
  const moonCompositionOptions = {
    densityGcm3: rhoMoonGcm3,
    radiusMoon: rMoonRM,
    differentiatedInterior: moonInputs.differentiatedInterior,
    waterMassFraction: clamp(toFinite(moonInputs.waterMassFractionPct, 0) / 100, 0, 0.9),
    ammoniaMassFraction: clamp(toFinite(moonInputs.ammoniaPct, 0) / 100, 0, 0.5),
    compositionMode,
    compositionNormalizeMode,
    manualComponentMassFractions: moonInputs.manualComponentMassFractions,
    manualComponentPct: moonInputs.manualComponentPct,
    manualElementMassFractions: moonInputs.manualElementMassFractions,
    manualElementPct: moonInputs.manualElementPct,
    manualTraceElementAbundance: moonInputs.manualTraceElementAbundance,
    compositionStructureSource,
  };
  const moonComposition =
    (moonInputs.compositionOverride &&
      compositionFromClass(moonInputs.compositionOverride, moonCompositionOptions)) ||
    compositionFromDensity(rhoMoonGcm3, moonCompositionOptions);
  const compositionDrivenMoonInventory =
    moonComposition != null && moonComposition.compositionMode !== "inferred";
  const moonComponentMassFractions = moonComposition?.componentMassFractions || {};
  const moonEffectiveWaterMassFraction = clamp(
    toFinite(moonComponentMassFractions.waterIce, toFinite(moonComposition?.waterMassFraction, 0)) +
      toFinite(moonComponentMassFractions.volatileIce, 0) * 0.35,
    0,
    0.9,
  );
  const preliminaryMoonCoreMassFraction = inferMoonCoreMassFraction({
    densityGcm3: rhoMoonGcm3,
    compositionClass: moonComposition?.compositionClass || moonInputs.compositionOverride,
    differentiatedInterior: moonInputs.differentiatedInterior,
  });
  const solidBodyStructure = solveSolidBodyStructure({
    bodyType: "moon",
    massMoon: mMoonMM,
    radiusMoon: rMoonRM,
    densityGcm3: rhoMoonGcm3,
    componentMassFractions: moonComposition?.componentMassFractions,
    elementMassFractions: moonComposition?.elementMassFractions,
    differentiatedInterior: moonInputs.differentiatedInterior,
    compositionClass: moonComposition?.compositionClass,
    compositionOverride: moonInputs.compositionOverride,
    coreMassFraction: toFinite(moonComposition?.coreMassFraction, preliminaryMoonCoreMassFraction),
  });
  const initialSolidBodyResponse = buildSolidBodyResponse({
    densityKgM3: rhoMoonGcm3 * 1000,
    gravityMs2: gMoonG * EARTH_GRAVITY_MS2,
    radiusM: rMoonRM * 1737.4e3,
    composition: moonComposition,
    solidBodyStructure,
  });
  const effectiveMoonWaterMassFractionPct = compositionDrivenMoonInventory
    ? moonEffectiveWaterMassFraction * 100
    : moonInputs.waterMassFractionPct;
  const moonVolatileInventoryMode =
    compositionDrivenMoonInventory && (!atmosphereMode || atmosphereMode === "core")
      ? "full"
      : atmosphereMode;
  const moonHydrosphereInventoryMode =
    compositionDrivenMoonInventory && (!hydrosphereMode || hydrosphereMode === "core")
      ? "full"
      : hydrosphereMode;
  const moonTraceRadiogenicContext = resolveTraceRadiogenicAbundance(moonComposition);
  const radioisotopeAbundance = clamp(
    resolveMoonRadioisotopeAbundance(moonInputs, parent.derived?.radioisotopeAbundance ?? 1, {
      traceRadiogenicAbundance: moonTraceRadiogenicContext?.abundance,
      traceElementAbundance: moonTraceRadiogenicContext?.traceElementAbundance,
    }),
    0.01,
    5,
  );
  const moonRadioisotopeAbundanceSource =
    moonInputs.radioisotopeMode === "advanced"
      ? moonTraceRadiogenicContext
        ? "advanced-isotopes-with-composition-trace-defaults"
        : "advanced-isotopes"
      : moonInputs.radioisotopeAbundance == null && moonTraceRadiogenicContext
        ? "composition-trace-elements"
        : "simple-input";
  const moonCompositionRadiogenicContext = moonTraceRadiogenicContext
    ? {
        ...moonTraceRadiogenicContext,
        appliedRadioisotopeAbundance: radioisotopeAbundance,
        radioisotopeAbundanceSource: moonRadioisotopeAbundanceSource,
      }
    : null;

  const orbit = computeMoonOrbit({
    starMassMsol: mStarMsol,
    planetMassEarth: mPlanetME,
    planetDensityGcm3: rhoPlanetGcm3,
    planetRadiusEarth: rPlanetRE,
    planetSemiMajorAxisAu: aPlanetAU,
    planetEccentricity: ePlanet,
    moonMassMoon: mMoonMM,
    moonDensityGcm3: rhoMoonGcm3,
    moonRadiusMoon: rMoonRM,
    moonRigidityPa: initialSolidBodyResponse.rigidityPa || moonComposition?.mu,
    moonCompositionClass: moonComposition?.compositionClass || moonInputs.compositionOverride,
    moonSemiMajorAxisKmInput: aMoonKmInput,
    moonEccentricity: eMoon,
    moonInclinationDeg: inc,
  });

  const tides = computeMoonTidalState({
    systemAgeGyr: ageGyr,
    starMassMsol: mStarMsol,
    planetMassEarth: mPlanetME,
    planetDensityGcm3: rhoPlanetGcm3,
    planetRadiusEarth: rPlanetRE,
    planetSemiMajorAxisAu: aPlanetAU,
    planetRotationHours: rotPlanetHours,
    moonMassMoon: mMoonMM,
    moonDensityGcm3: rhoMoonGcm3,
    moonRadiusMoon: rMoonRM,
    moonGravityG: gMoonG,
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    moonEccentricity: eMoon,
    initialRotationPeriodHours: initialRotHours,
    zoneInnerKm: orbit.zoneInnerKm,
    zoneOuterKm: orbit.zoneOuterKm,
    orbitalPeriodSiderealDays: orbit.orbitalPeriodSiderealDays,
    orbitalPeriodSynodicDays: orbit.orbitalPeriodSynodicDays,
    orbitalDirection: orbit.orbitalDirection,
    composition: moonComposition,
    hasCompositionOverride: Boolean(moonInputs.compositionOverride),
    solidBodyStructure,
    solidBodyResponse: initialSolidBodyResponse,
    innerFateTargetLabel:
      orbit.effectiveInnerLimitKind === "collision" ? "parent collision boundary" : "Roche limit",
  });
  const tidalPersistenceContext = buildInitialMoonTidalPersistenceContext({
    tides,
    moonSystemContext,
  });

  const baselineTemperature = computeMoonTemperature({
    albedo,
    planetSemiMajorAxisAu: aPlanetAU,
    starLuminosityLsol: lStarLsol,
    extraFluxEarth: meanCompanionFluxEarth,
    surfaceAreaM2: tides.surfaceAreaM2,
    moonMassKg: tides.moonMassKg,
    radioisotopeAbundance,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    tidalPersistenceContext,
  });
  const illumination = computeMoonIllumination({
    starLuminosityLsol: lStarLsol,
    extraFluxEarth: meanCompanionFluxEarth,
    planetSemiMajorAxisAu: aPlanetAU,
    planetRadiusEarth: rPlanetRE,
    planetDensityGcm3: rhoPlanetGcm3,
    planetAlbedoBond: parent.inputs?.albedoBond,
    parentSurfaceTempK: parent.derived?.surfaceTempK,
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    moonInclinationDeg: inc,
    parentAxialTiltDeg: parent.inputs?.axialTiltDeg,
    moonLockedToPlanet: tides.moonLockedToPlanet === "Yes",
  });

  let temperature = computeMoonTemperature({
    albedo,
    planetSemiMajorAxisAu: aPlanetAU,
    starLuminosityLsol: lStarLsol,
    extraFluxEarth: meanCompanionFluxEarth,
    surfaceAreaM2: tides.surfaceAreaM2,
    moonMassKg: tides.moonMassKg,
    radioisotopeAbundance,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    parentReflectedFluxWm2: illumination.parentReflectedFluxWm2,
    parentThermalFluxWm2: illumination.parentThermalFluxWm2,
    eclipseCoolingPenalty: illumination.eclipseCoolingPenalty,
    tidalPersistenceContext,
  });

  const allowAtmosphereTemperatureFeedback = baselineTemperature.equilibriumK <= 180;
  let volatileResults = [];
  let atmosphere = computeMoonAtmosphere();
  for (let pass = 0; pass < 3; pass += 1) {
    volatileResults = analyseMoonVolatiles(
      rhoMoonGcm3,
      temperature.surfaceK,
      vEscKmS,
      tides.moonGravityMs2,
      ageGyr,
      tides.tidalFeedbackActive,
      {
        mode: moonVolatileInventoryMode,
        compositionOverride: moonComposition?.compositionClass || moonInputs.compositionOverride,
        waterMassFractionPct: effectiveMoonWaterMassFractionPct,
        ammoniaPct: moonInputs.ammoniaPct,
        tidalPersistenceContext,
        manualSurfacePressureAtm: moonInputs.manualSurfacePressureAtm,
        manualCompositionPct: {
          h2Pct: moonInputs.h2Pct,
          hePct: moonInputs.hePct,
          n2Pct: moonInputs.n2Pct,
          o2Pct: moonInputs.o2Pct,
          co2Pct: moonInputs.co2Pct,
          arPct: moonInputs.arPct,
          h2oPct: moonInputs.h2oPct,
          ch4Pct: moonInputs.ch4Pct,
          coPct: moonInputs.coPct,
          so2Pct: moonInputs.so2Pct,
          nh3Pct: moonInputs.nh3Pct,
        },
      },
    );
    atmosphere = computeMoonAtmosphere({
      volatileInventory: volatileResults,
      surfaceTempK: temperature.surfaceK,
      gravityMs2: tides.moonGravityMs2,
      tidalFeedbackActive: tides.tidalFeedbackActive,
      mode: atmosphereMode,
      manualSurfacePressureAtm: moonInputs.manualSurfacePressureAtm,
      manualCompositionPct: {
        h2Pct: moonInputs.h2Pct,
        hePct: moonInputs.hePct,
        n2Pct: moonInputs.n2Pct,
        o2Pct: moonInputs.o2Pct,
        co2Pct: moonInputs.co2Pct,
        arPct: moonInputs.arPct,
        h2oPct: moonInputs.h2oPct,
        ch4Pct: moonInputs.ch4Pct,
        coPct: moonInputs.coPct,
        so2Pct: moonInputs.so2Pct,
        nh3Pct: moonInputs.nh3Pct,
      },
    });
    const nextTemperature = computeMoonTemperature({
      albedo,
      planetSemiMajorAxisAu: aPlanetAU,
      starLuminosityLsol: lStarLsol,
      extraFluxEarth: meanCompanionFluxEarth,
      surfaceAreaM2: tides.surfaceAreaM2,
      moonMassKg: tides.moonMassKg,
      radioisotopeAbundance,
      tidalHeatingWm2: tides.tidalHeatingWm2,
      parentReflectedFluxWm2: illumination.parentReflectedFluxWm2,
      parentThermalFluxWm2: illumination.parentThermalFluxWm2,
      eclipseCoolingPenalty: illumination.eclipseCoolingPenalty,
      greenhouseTauEquivalent: allowAtmosphereTemperatureFeedback
        ? atmosphere.greenhouseTauEquivalent
        : 0,
      antiGreenhouseFraction: allowAtmosphereTemperatureFeedback
        ? atmosphere.antiGreenhouseFraction
        : 0,
      tidalPersistenceContext,
    });
    if (Math.abs(nextTemperature.surfaceK - temperature.surfaceK) <= 1) {
      temperature = nextTemperature;
      break;
    }
    temperature = nextTemperature;
  }

  volatileResults = analyseMoonVolatiles(
    rhoMoonGcm3,
    temperature.surfaceK,
    vEscKmS,
    tides.moonGravityMs2,
    ageGyr,
    tides.tidalFeedbackActive,
    {
      mode: atmosphereMode,
      compositionOverride: moonInputs.compositionOverride,
      waterMassFractionPct: moonInputs.waterMassFractionPct,
      ammoniaPct: moonInputs.ammoniaPct,
      tidalPersistenceContext,
      manualSurfacePressureAtm: moonInputs.manualSurfacePressureAtm,
      manualCompositionPct: {
        h2Pct: moonInputs.h2Pct,
        hePct: moonInputs.hePct,
        n2Pct: moonInputs.n2Pct,
        o2Pct: moonInputs.o2Pct,
        co2Pct: moonInputs.co2Pct,
        arPct: moonInputs.arPct,
        h2oPct: moonInputs.h2oPct,
        ch4Pct: moonInputs.ch4Pct,
        coPct: moonInputs.coPct,
        so2Pct: moonInputs.so2Pct,
        nh3Pct: moonInputs.nh3Pct,
      },
    },
  );
  atmosphere = computeMoonAtmosphere({
    volatileInventory: volatileResults,
    surfaceTempK: temperature.surfaceK,
    gravityMs2: tides.moonGravityMs2,
    tidalFeedbackActive: tides.tidalFeedbackActive,
    mode: atmosphereMode,
    manualSurfacePressureAtm: moonInputs.manualSurfacePressureAtm,
    manualCompositionPct: {
      h2Pct: moonInputs.h2Pct,
      hePct: moonInputs.hePct,
      n2Pct: moonInputs.n2Pct,
      o2Pct: moonInputs.o2Pct,
      co2Pct: moonInputs.co2Pct,
      arPct: moonInputs.arPct,
      h2oPct: moonInputs.h2oPct,
      ch4Pct: moonInputs.ch4Pct,
      coPct: moonInputs.coPct,
      so2Pct: moonInputs.so2Pct,
      nh3Pct: moonInputs.nh3Pct,
    },
  });
  temperature = computeMoonTemperature({
    albedo,
    bondAlbedo: moonInputs.bondAlbedo,
    geometricAlbedo: moonInputs.geometricAlbedo,
    phaseIntegral: moonInputs.phaseIntegral,
    albedoKind: moonInputs.albedoKind,
    emissivity: moonInputs.emissivity,
    planetSemiMajorAxisAu: aPlanetAU,
    starLuminosityLsol: lStarLsol,
    extraFluxEarth: meanCompanionFluxEarth,
    surfaceAreaM2: tides.surfaceAreaM2,
    moonMassKg: tides.moonMassKg,
    radioisotopeAbundance,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    parentReflectedFluxWm2: illumination.parentReflectedFluxWm2,
    parentThermalFluxWm2: illumination.parentThermalFluxWm2,
    eclipseCoolingPenalty: illumination.eclipseCoolingPenalty,
    greenhouseTauEquivalent: allowAtmosphereTemperatureFeedback
      ? atmosphere.greenhouseTauEquivalent
      : 0,
    antiGreenhouseFraction: allowAtmosphereTemperatureFeedback
      ? atmosphere.antiGreenhouseFraction
      : 0,
    rotationPeriodDays: tides.rotationPeriodDays ?? initialRotHours / 24,
    moonLockedToPlanet: tides.moonLockedToPlanet === "Yes",
    spinState: tides.spinState,
    surfaceClass:
      moonInputs.surfaceClass || moonInputs.compositionOverride || tides.compositionClass,
    thermalInertiaClass: moonInputs.thermalInertiaClass,
    surfacePressurePa: atmosphere.surfacePressurePa,
    hasVolatileAtmosphere: Number(atmosphere.surfacePressurePa) > 0,
    tidalPersistenceContext,
  });
  atmosphere = {
    ...atmosphere,
    greenhouseWarmingK: Math.max(0, temperature.surfaceK - baselineTemperature.surfaceK),
  };
  const retainedVolatiles = volatileResults.filter(
    (volatile) => volatile.status === "Thin atmosphere",
  );
  const surfacePressurePa = atmosphere.surfacePressurePa;
  const primaryAtmosphere =
    retainedVolatiles.length > 0
      ? retainedVolatiles.reduce((left, right) =>
          left.pressurePa > right.pressurePa ? left : right,
        )
      : null;
  const stableIces = volatileResults.filter((volatile) => volatile.status === "Stable ice");

  const hydrosphere = hydrosphereStateFromMoon({
    volatileInventory: volatileResults,
    surfaceTempK: temperature.surfaceK,
    surfacePressurePa,
    tidalHeatingEarth: tides.tidalHeatingEarth,
    tidalHeatFluxWm2: tides.tidalHeatingWm2,
    internalHeatFluxWm2: temperature.radiogenicWm2 + tides.tidalHeatingWm2,
    gravityG: gMoonG,
    densityGcm3: rhoMoonGcm3,
    massMoon: mMoonMM,
    radiusMoon: rMoonRM,
    compositionClass: tides.compositionClass,
    compositionOverride: moonInputs.compositionOverride || null,
    mode: moonHydrosphereInventoryMode,
    waterMassFractionPct: effectiveMoonWaterMassFractionPct,
    salinityPct: moonInputs.salinityPct,
    ammoniaPct: moonInputs.ammoniaPct,
    differentiatedInterior: moonInputs.differentiatedInterior,
    tidalPersistenceContext,
    rockyBodyComposition: moonComposition,
    solidBodyStructure,
  });
  const solidBodyResponse = buildSolidBodyResponse({
    densityKgM3: rhoMoonGcm3 * 1000,
    gravityMs2: gMoonG * EARTH_GRAVITY_MS2,
    radiusM: rMoonRM * 1737.4e3,
    composition: moonComposition,
    solidBodyStructure,
    hydrosphere,
  });
  const climate = computeMoonClimate({
    surfaceTempK: temperature.surfaceK,
    pressurePa: surfacePressurePa,
    gravityG: gMoonG,
    hydrosphere,
    atmosphereComposition: atmosphere.composition,
    dominantAtmosphereSpecies: atmosphere.dominantSpecies,
    illumination,
    spinState: tides.spinState,
    moonLockedToPlanet: tides.moonLockedToPlanet === "Yes",
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    tidalHabitableZone:
      orbitalCouplingMode === "core" ? null : moonSystemContext?.tidalHabitableZone,
  });
  const geology = computeMoonGeology({
    tidalHeatingEarth: tides.tidalHeatingEarth,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    radiogenicHeatingWm2: temperature.radiogenicWm2,
    massMoon: mMoonMM,
    gravityG: gMoonG,
    densityGcm3: rhoMoonGcm3,
    compositionClass: tides.compositionClass,
    compositionOverride: moonInputs.compositionOverride || null,
    hydrosphere,
    tidalPersistenceContext,
    rockyBodyComposition: moonComposition,
    solidBodyStructure,
    solidBodyResponse,
  });
  const dynamicalHabitabilityBridge = buildHabitabilityPersistenceBridge({
    bodyKind: "moon",
    stabilityContext: buildMoonStabilityContextForHabitabilityBridge(orbit),
    tidalContext: {
      tidalHeatingEarth: tides.tidalHeatingEarth,
      eccentricityPersistence: tidalPersistenceContext.eccentricityPersistence,
      heatingLikelySustained: tidalPersistenceContext.heatingLikelySustained,
    },
    hydrosphere,
    geology,
  });
  const magnetosphere = computeMoonMagnetosphere({
    massMoon: mMoonMM,
    densityGcm3: rhoMoonGcm3,
    differentiatedInterior:
      hydrosphere.differentiatedInterior != null
        ? hydrosphere.differentiatedInterior
        : moonInputs.differentiatedInterior,
    internalHeatFluxWm2: temperature.radiogenicWm2 + tides.tidalHeatingWm2,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    radiogenicHeatingWm2: temperature.radiogenicWm2,
    subsurfaceOceanPresent: hydrosphere.subsurfaceOceanPresent,
    salinityPct: hydrosphere.salinityPct,
    ammoniaPct: hydrosphere.ammoniaPct,
    parentSurfaceFieldEarths: surfaceFieldEarths,
    insideParentMagnetosphere:
      surfaceFieldEarths > 0 &&
      orbit.semiMajorAxisKm / Math.max(rPlanetRE * 6371, 1) <
        (parentMagnetopauseRp ?? Number.POSITIVE_INFINITY),
    lShell: orbit.semiMajorAxisKm / Math.max(rPlanetRE * 6371, 1),
    rockyBodyComposition: moonComposition,
    solidBodyStructure,
    solidBodyResponse,
    rotationPeriodHours: (tides.rotationPeriodDays ?? initialRotHours / 24) * 24,
    ageGyr,
  });
  const radiation = computeMoonRadiationEnvironment({
    starMassMsol: mStarMsol,
    surfaceFieldEarths,
    magnetopauseRp: parentMagnetopauseRp,
    planetSemiMajorAxisAu: aPlanetAU,
    planetRadiusEarth: rPlanetRE,
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    starLuminosityLsol: lStarLsol,
    starAgeGyr: ageGyr,
    hostXuvFluxRatioAt1Au: environmentForcing.flux.hostXuvEarthAt1Au,
    extraStellarXuvFluxRatio: meanCompanionXuvFluxEarth,
    surfacePressurePa,
    iceShellThicknessKm: hydrosphere.estimatedIceShellThicknessKm,
    magnetosphere,
    parentMagnetosphereEnvironment,
  });
  const surfaceBoundaryExosphere = computeIcyMoonExosphere({
    hydrosphere,
    atmosphere,
    radiation,
    volatiles: volatileResults,
    temperature,
    orbit,
    tides,
    parent,
    radiusMoon: rMoonRM,
    massMoon: mMoonMM,
    gravityMs2: tides.moonGravityMs2,
    escapeVelocityKms: vEscKmS,
  });
  const moonMassEarth = mMoonMM * 0.012300037;
  const moonRadiusEarth = (rMoonRM * 1738.1) / 6371;
  const inferredMoonCoreMassFraction = preliminaryMoonCoreMassFraction;
  const solvedMoonCoreMassFraction = toFinite(moonComposition?.coreMassFraction, NaN);
  const moonCoreMassFraction = Number.isFinite(solvedMoonCoreMassFraction)
    ? clamp(solvedMoonCoreMassFraction, 0, 1)
    : inferredMoonCoreMassFraction;
  const moonRockyBodyComposition = {
    ...(moonComposition || {}),
    coreMassFraction: moonCoreMassFraction,
    coreMassFractionPct: moonCoreMassFraction * 100,
    inferredCoreMassFraction: inferredMoonCoreMassFraction,
    inferredCoreMassFractionPct: inferredMoonCoreMassFraction * 100,
    effectiveCoreMassFraction: moonCoreMassFraction,
    effectiveCoreMassFractionPct: moonCoreMassFraction * 100,
    effectiveWaterMassFraction: moonEffectiveWaterMassFraction,
    effectiveWaterMassFractionPct: moonEffectiveWaterMassFraction * 100,
    solidBodyStructure,
    solidBodyResponse,
  };
  const baselineInteriorEvolutionContext = buildInteriorEvolutionContext({
    bodyType: "moon",
    massEarth: moonMassEarth,
    radiusEarth: moonRadiusEarth,
    densityGcm3: rhoMoonGcm3,
    ageGyr,
    radiogenicHeatingWm2: temperature.radiogenicWm2,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    coreMassFraction: moonCoreMassFraction,
    hydrosphere,
    tectonicRegime: geology.dominantProcess || geology.resurfacingClass,
    surfaceTempK: temperature.surfaceK,
    magneticFieldContext: {
      dynamoActive: magnetosphere.intrinsicFieldPlausible,
      fieldLabel: magnetosphere.shieldingClass,
    },
    geology,
    rockyBodyComposition: moonRockyBodyComposition,
  });
  const atmosphereStability = buildMoonAtmosphereStability({
    ageGyr,
    atmosphere,
    climate,
    geology,
    hydrosphere,
    radiation,
    surfaceTempK: temperature.surfaceK,
    gravityG: gMoonG,
    escapeVelocityKmS: vEscKmS,
  });
  const moonPressureAtm = surfacePressurePa / 101325;
  const baselineMoonPpCO2Atm = atmosphere.composition?.co2
    ? atmosphere.composition.co2 * moonPressureAtm
    : 0;
  const baselineCarbonCycleContext = computeCarbonCycleContext({
    surfaceTempK: temperature.surfaceK,
    pressureAtm: moonPressureAtm,
    ppCO2Atm: baselineMoonPpCO2Atm,
    hydrosphere,
    tectonicRegime: geology.dominantProcess || geology.resurfacingClass,
    volcanicActivity: Math.max(
      toFinite(geology.volcanicActivityScore, 0),
      0.45 * toFinite(geology.cryovolcanicActivityScore, 0),
    ),
    outgassing: {
      sourceClass: atmosphere.sourceClass,
      dominantSpecies: atmosphere.dominantSpecies,
      primarySpecies: atmosphere.dominantSpecies,
    },
    landFraction: hydrosphere.landFraction,
    oceanFraction: hydrosphere.liquidOceanFraction,
    stellarAgeGyr: ageGyr,
    insolationEarth: aPlanetAU > 0 ? lStarLsol / aPlanetAU ** 2 + meanCompanionFluxEarth : 0,
    climateState: climate.climateState,
    interiorEvolutionContext: baselineInteriorEvolutionContext,
  });
  const co2ClimateTendencyContext = buildCo2ClimateTendencyContext({
    carbonCycleContext: baselineCarbonCycleContext,
    pressureAtm: moonPressureAtm,
    ppCO2Atm: baselineMoonPpCO2Atm,
    hydrosphere,
    geology,
    surfaceTempK: temperature.surfaceK,
    climateState: climate.climateState,
  });
  const atmosphereLedger = computeAtmosphereLedger({
    bodyType: "moon",
    pressureAtm: moonPressureAtm,
    composition: atmosphere.composition,
    environmentForcing,
    magnetosphereEnvironment: parentMagnetosphereEnvironment,
    atmosphericEscapeEnabled: atmosphereMode !== "manual",
    hydrosphere,
    carbonCycleContext: baselineCarbonCycleContext,
    smallBodyReservoirContext,
    climateState: climate.climateState,
    climate,
    outgassing: {
      sourceClass: atmosphere.sourceClass,
      dominantSpecies: atmosphere.dominantSpecies,
      tidalHeatingEarth: tides.tidalHeatingEarth,
    },
    tectonics: {
      ...geology,
      tidalHeatingEarth: tides.tidalHeatingEarth,
    },
    volatileInventory: volatileResults,
    surfaceBoundaryExosphere,
    radiation,
    surfaceTempK: temperature.surfaceK,
    gravityG: gMoonG,
    escapeVelocityKms: vEscKmS,
    escapeVelocityVEarth: vEscKmS / 11.186,
    ageGyr,
    rockyBodyComposition: moonRockyBodyComposition,
  });
  const moonPhotochemistry = moonPhotochemistryFromAtmosphereStability({
    atmosphere,
    atmosphereStability,
  });
  const cloudCirculation = computeCloudCirculationContext({
    pressureAtm: moonPressureAtm,
    surfaceWaterFraction: hydrosphere.surfaceAccessibleLiquidFraction,
    surfaceTempK: temperature.surfaceK,
    rotationPeriodHours: tides.rotationPeriodDays ? tides.rotationPeriodDays * 24 : 24,
    tidallyLocked: tides.planetLockedToStar === "Yes" && tides.moonLockedToPlanet === "Yes",
    stellarFluxEarth: aPlanetAU > 0 ? lStarLsol / aPlanetAU ** 2 + meanCompanionFluxEarth : 0,
    hazeSurfaceLightReduction: moonPhotochemistry.haze?.surfaceLightReductionFraction ?? 0,
    atmosphericCollapseState: climate.collapseState,
    hydrosphere,
    ppH2OAtm: atmosphere.composition?.h2o
      ? atmosphere.composition.h2o * (surfacePressurePa / 101325)
      : 0,
  });
  const climateChemistryForcing = computeClimateChemistryForcing({
    baselineSurfaceTempK: temperature.surfaceK,
    pressureAtm: moonPressureAtm,
    composition: atmosphere.composition,
    photochemistry: moonPhotochemistry,
    atmosphereLedger,
    hydrosphere,
    cloudContext: cloudCirculation,
    greenhouseTau: atmosphere.greenhouseTauEquivalent,
    co2ClimateTendencyContext,
  });
  const coupledClimatePass = resolveCoupledClimatePassForMoon({
    baselineSurfaceTempK: temperature.surfaceK,
    baselineClimate: climate,
    baselineHydrosphere: hydrosphere,
    climateChemistryForcing,
    surfacePressurePa,
    volatileInventory: volatileResults,
    tidalHeatingEarth: tides.tidalHeatingEarth,
    tidalHeatFluxWm2: tides.tidalHeatingWm2,
    internalHeatFluxWm2: temperature.radiogenicWm2 + tides.tidalHeatingWm2,
    gravityG: gMoonG,
    densityGcm3: rhoMoonGcm3,
    massMoon: mMoonMM,
    radiusMoon: rMoonRM,
    compositionClass: tides.compositionClass,
    compositionOverride: moonInputs.compositionOverride || null,
    hydrosphereMode: moonHydrosphereInventoryMode,
    waterMassFractionPct: effectiveMoonWaterMassFractionPct,
    salinityPct: moonInputs.salinityPct,
    ammoniaPct: moonInputs.ammoniaPct,
    differentiatedInterior: moonInputs.differentiatedInterior,
    tidalPersistenceContext,
    atmosphereComposition: atmosphere.composition,
    dominantAtmosphereSpecies: atmosphere.dominantSpecies,
    illumination,
    spinState: tides.spinState,
    moonLockedToPlanet: tides.moonLockedToPlanet === "Yes",
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    tidalHabitableZone:
      orbitalCouplingMode === "core" ? null : moonSystemContext?.tidalHabitableZone,
    manualOverride:
      atmosphereMode === "manual" || hydrosphereMode === "manual"
        ? ["atmosphere-or-hydrosphere"]
        : false,
    userMode: atmosphereMode === "manual" || hydrosphereMode === "manual" ? "manual" : "auto",
  });
  const effectiveSurfaceTempK = coupledClimatePass.effectiveSurfaceTempK;
  const effectiveHydrosphere = coupledClimatePass.effectiveHydrosphere || hydrosphere;
  const effectiveClimate = coupledClimatePass.effectiveClimate || climate;
  const effectiveOceanPhaseDiagnostics = formatOceanPhaseDiagnostics(effectiveHydrosphere);
  const interiorEvolutionContext = buildInteriorEvolutionContext({
    bodyType: "moon",
    massEarth: moonMassEarth,
    radiusEarth: moonRadiusEarth,
    densityGcm3: rhoMoonGcm3,
    ageGyr,
    radiogenicHeatingWm2: temperature.radiogenicWm2,
    tidalHeatingWm2: tides.tidalHeatingWm2,
    coreMassFraction: moonCoreMassFraction,
    hydrosphere: effectiveHydrosphere,
    tectonicRegime: geology.dominantProcess || geology.resurfacingClass,
    surfaceTempK: effectiveSurfaceTempK,
    magneticFieldContext: {
      dynamoActive: magnetosphere.intrinsicFieldPlausible,
      fieldLabel: magnetosphere.shieldingClass,
    },
    geology,
    rockyBodyComposition: moonRockyBodyComposition,
  });
  const moonGeodynamicsContext = buildMoonGeodynamicsContext({
    geology,
    hydrosphere: effectiveHydrosphere,
    solidBodyStructure,
    solidBodyResponse,
    interiorEvolutionContext,
    atmosphere,
  });
  const carbonCycleContext = computeCarbonCycleContext({
    surfaceTempK: effectiveSurfaceTempK,
    pressureAtm: moonPressureAtm,
    ppCO2Atm: atmosphere.composition?.co2 ? atmosphere.composition.co2 * moonPressureAtm : 0,
    hydrosphere: effectiveHydrosphere,
    tectonicRegime: geology.dominantProcess || geology.resurfacingClass,
    volcanicActivity: Math.max(
      toFinite(geology.volcanicActivityScore, 0),
      0.45 * toFinite(geology.cryovolcanicActivityScore, 0),
    ),
    outgassing: {
      sourceClass: atmosphere.sourceClass,
      dominantSpecies: atmosphere.dominantSpecies,
      primarySpecies: atmosphere.dominantSpecies,
    },
    landFraction: effectiveHydrosphere.landFraction,
    oceanFraction: effectiveHydrosphere.liquidOceanFraction,
    stellarAgeGyr: ageGyr,
    insolationEarth: aPlanetAU > 0 ? lStarLsol / aPlanetAU ** 2 + meanCompanionFluxEarth : 0,
    climateState: effectiveClimate.climateState,
    interiorEvolutionContext,
  });
  const stellarHistoryDoseContext = buildStellarHistoryDoseContext({
    starMassMsol: mStarMsol,
    starAgeGyr: ageGyr,
    starLuminosityLsol: lStarLsol,
    starEvolutionMode: starEvolutionMode || resolvedStar.evolutionMode || "evolved",
    presentXuvEarthAtOrbit: environmentForcing.flux?.xuvEarthAtOrbit,
    windPressureEarthAtOrbit: environmentForcing.wind?.ramPressureEarthRatio,
    orbitAu: aPlanetAU,
    eccentricity: ePlanet,
    massEarth: mMoonMM * 0.012300037,
    gravityG: gMoonG,
    escapeVelocityKms: vEscKmS,
    atmospherePressureAtm: moonPressureAtm,
    hydrosphere: effectiveHydrosphere,
  });
  const preliminaryNitrogenCycleContext = buildNitrogenCycleContext({
    pressureAtm: moonPressureAtm,
    composition: atmosphere.composition,
    n2Fraction: atmosphere.composition?.n2,
    ppN2Atm: atmosphere.composition?.n2 ? atmosphere.composition.n2 * moonPressureAtm : 0,
    surfaceTempK: effectiveSurfaceTempK,
    hydrosphere: effectiveHydrosphere,
    geology,
    outgassing: {
      sourceClass: atmosphere.sourceClass,
      dominantSpecies: atmosphere.dominantSpecies,
      primarySpecies: atmosphere.dominantSpecies,
    },
    interiorEvolutionContext,
    lightningUvProxy: environmentForcing?.flux?.prebioticUvEarthAtOrbit,
    environmentForcing,
    photochemistry: moonPhotochemistry,
    manualMode: atmosphereMode === "manual",
  });
  const atmosphereEvolutionContext = buildAtmosphereEvolutionContext({
    atmosphereLedger,
    pressureAtm: moonPressureAtm,
    composition: atmosphere.composition,
    environmentForcing,
    stellarHistoryDoseContext,
    carbonCycleContext,
    hydrosphere: effectiveHydrosphere,
    interiorEvolutionContext,
    nitrogenCycleContext: preliminaryNitrogenCycleContext,
    manualMode: atmosphereMode === "manual",
  });
  const moonPpCO2Atm = atmosphere.composition?.co2
    ? atmosphere.composition.co2 * moonPressureAtm
    : 0;
  const oceanChemistryContext = computeOceanChemistryContext({
    hydrosphere: effectiveHydrosphere,
    salinityPct: effectiveHydrosphere.salinityPct,
    ammoniaPct: effectiveHydrosphere.ammoniaPct,
    salinityInputProvided: Number(moonInputs.salinityPct) > 0,
    ammoniaInputProvided: Number(moonInputs.ammoniaPct) > 0,
    pressureAtm: moonPressureAtm,
    ppCO2Atm: moonPpCO2Atm,
    carbonCycleContext,
    geology: {
      ...geology,
      tidalHeatingEarth: tides.tidalHeatingEarth,
    },
    climateState: effectiveClimate.climateState,
    dynamicalPersistenceContext: tidalPersistenceContext,
    rockyBodyComposition: moonRockyBodyComposition,
  });
  const nitrogenCycleContext = buildNitrogenCycleContext({
    pressureAtm: moonPressureAtm,
    composition: atmosphere.composition,
    n2Fraction: atmosphere.composition?.n2,
    ppN2Atm: atmosphere.composition?.n2 ? atmosphere.composition.n2 * moonPressureAtm : 0,
    surfaceTempK: effectiveSurfaceTempK,
    hydrosphere: effectiveHydrosphere,
    geology,
    outgassing: {
      sourceClass: atmosphere.sourceClass,
      dominantSpecies: atmosphere.dominantSpecies,
      primarySpecies: atmosphere.dominantSpecies,
    },
    interiorEvolutionContext,
    oceanChemistryContext,
    lightningUvProxy: environmentForcing?.flux?.prebioticUvEarthAtOrbit,
    environmentForcing,
    photochemistry: moonPhotochemistry,
    atmosphereEvolutionContext,
    manualMode: atmosphereMode === "manual",
  });
  const biosignatureContext = computeBiosignatureContext({
    pressureAtm: surfacePressurePa / 101325,
    composition: atmosphere.composition,
    photochemistry: moonPhotochemistry,
    atmosphereLedger,
    atmosphereEvolutionContext,
    stellarHistoryDoseContext,
    carbonCycleContext,
    oceanChemistryContext,
    nitrogenCycleContext,
    environmentForcing,
    hydrosphere: effectiveHydrosphere,
    surfaceBoundaryExosphere,
  });
  const impactEnvironmentContext = buildImpactEnvironmentContext({
    ageGyr,
    atmospherePressureAtm: moonPressureAtm,
    gravityG: gMoonG,
    escapeVelocityKms: vEscKmS,
    smallBodyReservoirContext,
    geodynamicsContext: moonGeodynamicsContext,
    hydrosphere: effectiveHydrosphere,
  });
  atmosphere = {
    ...atmosphere,
    surfaceBoundaryExosphere,
    stability: atmosphereStability,
    ledger: atmosphereLedger,
  };
  const biosphere = computeMoonBiosphere({
    starTempK,
    insolationEarth: aPlanetAU > 0 ? lStarLsol / aPlanetAU ** 2 + meanCompanionFluxEarth : 0,
    surfacePressurePa,
    atmosphereComposition: atmosphere.composition,
    hydrosphere: effectiveHydrosphere,
    climate: effectiveClimate,
    radiation,
    orbitalPeriodSynodicDays: orbit.orbitalPeriodSynodicDays,
    moonLockedToPlanet: tides.moonLockedToPlanet === "Yes",
  });
  const interior = buildMoonInterior(
    effectiveHydrosphere,
    moonInputs,
    temperature.radiogenicWm2 + tides.tidalHeatingWm2,
  );
  const resonance = buildMoonResonance({
    moonSystemContext,
    orbit,
    tides,
    effectiveClimate,
    radiation,
    parentRadiusEarth: rPlanetRE,
  });
  const tidalStressMorphologyContext = buildTidalStressMorphologyContext({
    tidalHeatingEarth: tides.tidalHeatingEarth,
    eccentricity: eMoon,
    resonanceContext: resonance.nearestResonance || resonance.chainMembership || null,
    hydrosphere: effectiveHydrosphere,
    geodynamicsContext: {
      outputs: {
        resurfacingPotentialClass:
          geology.resurfacingDominantProcess === "none"
            ? "limited"
            : geology.resurfacingScore >= 0.65
              ? "active"
              : "moderate",
      },
    },
    compositionClass: tides.compositionClass,
    iceShellState:
      effectiveHydrosphere.subsurfaceOceanPresent ||
      effectiveHydrosphere.estimatedIceShellThicknessKm > 0
        ? "ice shell"
        : "",
  });
  const eclipseTimingContext = buildEclipseTimingContext({
    observerRef: { kind: "moon", id: moon?.id || moonInputs.id || null },
    hostStarRadiusRsol: rStarRsol,
    hostStarDistanceAu: aPlanetAU,
    parentRadiusKm: rPlanetRE * 6371,
    moonRadiusKm: rMoonRM * 1738.1,
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    moonOrbitalPeriodDays: orbit.orbitalPeriodSiderealDays,
    moonInclinationDeg: inc,
    longitudeOfAscendingNodeDeg:
      moonInputs.longitudeOfAscendingNodeDeg ?? moonInputs.longitudeOfNodeDeg ?? null,
    referenceEpochDay: moonInputs.referenceEpochDay ?? moonInputs.epochDay ?? null,
  });
  const moonOrientationContext = buildMoonOrientationContext({
    parentMassEarth: mPlanetME,
    parentRadiusKm: rPlanetRE * 6371,
    parentJ2: parentJ2FromModel(parent),
    hostStarMassMsol: mStarMsol,
    parentSemiMajorAxisAu: aPlanetAU,
    parentEccentricity: ePlanet,
    moonSemiMajorAxisKm: orbit.semiMajorAxisKm,
    moonEccentricity: eMoon,
    moonInclinationDeg: inc,
    moonSpinState: tides.spinState,
    moonObliquityDeg: moonInputs.obliquityDeg ?? moonInputs.axialTiltDeg ?? null,
    momentOfInertiaFactor:
      moonInputs.momentOfInertiaFactor ??
      moonInputs.normalizedMomentOfInertia ??
      solidBodyResponse.momentOfInertiaFactor ??
      null,
  });
  const formation = moonSystemContext?.formation || {
    pathwayId: moonInputs?.originPathway || "auto",
    pathwayLabel: moonOriginPathwayLabel(moonInputs?.originPathway),
    scenarioLabel: "Single-body solve",
    confidence: 0.3,
    source: moonInputs?.originPathway && moonInputs.originPathway !== "auto" ? "user" : "inferred",
    rationale:
      "No parent moon-system context was provided, so formation is only weakly constrained.",
    consistencyWarnings: [],
    warningMessages: [],
    timelineEffects: {
      earlyTidalHeatingPulse: "possible",
      initialEccentricityBias: "medium",
      inclinationExpectation: "irregular",
      volatileRetentionBias: "neutral",
      resonanceLikelihood: "medium",
    },
  };
  const habitabilitySummary = buildMoonHabitabilitySummary({
    starHabitableZoneAu: effectiveStarHabitableZoneAu,
    starLuminosityLsol: lStarLsol,
    starMassMsol: mStarMsol,
    parentMassEarth: mPlanetME,
    parentDensityGcm3: rhoPlanetGcm3,
    planetSemiMajorAxisAu: aPlanetAU,
    parentRadiusEarth: rPlanetRE,
    moonMassMoon: mMoonMM,
    moonDensityGcm3: rhoMoonGcm3,
    compositionOverride: moonInputs.compositionOverride || null,
    spinState: tides.spinState,
    orbit,
    atmosphere,
    hydrosphere: effectiveHydrosphere,
    climate: effectiveClimate,
    radiation,
    tides,
  });
  const exosphereO2ProductionDisplay =
    surfaceBoundaryExosphere?.oxygenProductionKgS == null
      ? "Not quantified"
      : `${fmt(surfaceBoundaryExosphere.oxygenProductionKgS, 1)} kg/s`;
  const exospherePressureEffect =
    surfaceBoundaryExosphere?.pressureContributionAtm === 0
      ? "0 atm retained pressure"
      : surfaceBoundaryExosphere?.pressureContributionAtm == null
        ? "No retained-pressure contribution"
        : `${fmt(surfaceBoundaryExosphere.pressureContributionAtm, 8)} atm`;
  const exosphereAbioticO2 =
    surfaceBoundaryExosphere?.abioticOxygenSource === true
      ? "Abiotic exosphere-only O2"
      : "No exosphere O2 source";
  const habitabilityContext = buildMoonHabitabilityContext({
    star: { massMsol: mStarMsol, radiusRsol: rStarRsol, luminosityLsol: lStarLsol, ageGyr },
    planet: {
      massEarth: mPlanetME,
      cmfPct: parent.inputs.cmfPct,
      densityGcm3: rhoPlanetGcm3,
      radiusEarth: rPlanetRE,
      gravityG: parent.derived.gravityG,
      semiMajorAxisAu: aPlanetAU,
      eccentricity: ePlanet,
      periapsisAu: orbit.periPlanetAu,
      orbitalPeriodDays: orbit.periodPlanetDays,
      rotationPeriodHours: rotPlanetHours,
    },
    inputs: {
      massMoon: mMoonMM,
      densityGcm3: rhoMoonGcm3,
      albedo,
      semiMajorAxisKmInput: aMoonKmInput,
      semiMajorAxisKm: orbit.semiMajorAxisKm,
      eccentricity: eMoon,
      eccentricityInput,
      inclinationDeg: inc,
      initialRotationPeriodHours: initialRotHours,
      compositionOverride: moonInputs.compositionOverride || null,
      hydrosphereMode,
      atmosphereMode,
      orbitalCouplingMode,
    },
    physical: {
      radiusMoon: rMoonRM,
      gravityG: gMoonG,
      escapeVelocityKmS: vEscKmS,
      solidBodyStructure,
      solidBodyResponse,
      surfaceFieldEarths: magnetosphere.intrinsicFieldStrengthRelEarth,
    },
    temperature: {
      equilibriumK: Math.round(temperature.equilibriumK),
      surfaceK: temperature.surfaceK,
      surfaceC: temperature.surfaceC,
      radiogenicWm2: temperature.radiogenicWm2,
    },
    volatiles: {
      inventory: volatileResults,
      primaryAtmosphere: primaryAtmosphere ? primaryAtmosphere.species : null,
      surfacePressurePa,
      hasVolatileAtmosphere: retainedVolatiles.length > 0,
    },
    atmosphere,
    radiation: {
      modelVersion: radiation.modelVersion,
      magnetosphericRadRemDay: radiation.magnetosphericRadRemDay,
      magnetosphericLabel: radiationLabel(radiation.magnetosphericRadRemDay),
      magnetopauseLShell: radiation.magnetopauseLShell,
      bAtMoonGauss: radiation.bAtMoonGauss,
      lShell: radiation.lShell,
      insideMagnetosphere: radiation.insideMagnetosphere,
      parentBeltLevel: radiation.parentBeltLevel,
      stellarXuvFluxRatio: radiation.stellarXuvFluxRatio,
      stellarXuvLevel: radiation.stellarXuvLevel,
      atmosphereShielding: radiation.atmosphereShielding,
      intrinsicFieldShielding: radiation.intrinsicFieldShielding,
      inducedFieldShielding: radiation.inducedFieldShielding,
      magneticShielding: radiation.magneticShielding,
      combinedShielding: radiation.combinedShielding,
      parentMagnetosphereCompressionClass: radiation.parentMagnetosphereCompressionClass,
      parentWindCompressionFactor: radiation.parentWindCompressionFactor,
      compressionExposureMultiplier: radiation.compressionExposureMultiplier,
      surfaceExposureRemDayEquivalent: radiation.surfaceExposureRemDayEquivalent,
      surfaceExposure: radiation.surfaceExposure,
      subsurfaceExposureRemDayEquivalent: radiation.subsurfaceExposureRemDayEquivalent,
      subsurfaceExposure: radiation.subsurfaceExposure,
      surfaceClass: radiation.surfaceClass,
      subsurfaceClass: radiation.subsurfaceClass,
      calibrationNotes: radiation.calibrationNotes || [],
      calibrationAnchor: radiation.calibrationAnchor || null,
    },
    tides: {
      totalEarthTides: tides.totalEarthTides,
      moonContributionPct: tides.moonContributionPct,
      starContributionPct: tides.starContributionPct,
      tidalHeatingW: tides.tidalHeatingW,
      tidalHeatingWm2: tides.tidalHeatingWm2,
      tidalHeatingEarth: tides.tidalHeatingEarth,
      compositionClass: tides.compositionClass,
      k2Moon: tides.k2Moon,
      qMoon: tides.qMoon,
      rigidityMoonGPa: tides.rigidityMoonGPa,
      baseQMoon: tides.baseQMoon,
      baseRigidityMoonGPa: tides.baseRigidityMoonGPa,
      moonMomentOfInertiaFactor: tides.moonMomentOfInertiaFactor,
      solidBodyResponse: tides.solidBodyResponse,
      solidBodyStructureClass: tides.solidBodyStructureClass,
      tidalRegime: tides.tidalRegime,
      smallBodyRegime: tides.smallBodyRegime,
      k2Model: tides.k2Model,
      qModel: tides.qModel,
      qPlanet: tides.qPlanet,
      qPlanetModel: tides.qPlanetModel,
      k2Planet: tides.k2Planet,
      k2PlanetEffective: tides.k2PlanetEffective,
      tidalUncertaintyCaveats: tides.tidalUncertaintyCaveats,
      massModel: tides.massModel,
      compositionOverride: moonInputs.compositionOverride || null,
      effectiveEccentricity: eMoon,
      tidalFeedbackActive: tides.tidalFeedbackActive,
      meltFraction: tides.meltFraction,
      qEffective: tides.qEffective,
      rigidityEffectiveGPa: tides.rigidityEffectiveGPa,
      recessionCmYr: tides.recessionCmYr,
      dadtTotalMs: tides.dadtTotalMs,
      dadtPlanetMs: tides.dadtPlanetMs,
      dadtMoonMs: tides.dadtMoonMs,
      fateTimescaleMethod: tides.fateTimescaleMethod,
      innerFateTargetLabel: tides.innerFateTargetLabel,
      timeToRocheGyr: tides.timeToRocheGyr,
      timeToEscapeGyr: tides.timeToEscapeGyr,
      moonLockedToPlanet: tides.moonLockedToPlanet,
      planetLockedToMoon: tides.planetLockedToMoon,
      planetLockedToStar: tides.planetLockedToStar,
      synchronousOrbitKm: tides.synchronousOrbitKm,
      synchronousOrbitParentRadii: tides.synchronousOrbitParentRadii,
      insideSynchronousOrbit: tides.insideSynchronousOrbit,
      migrationDirectionFromSync: tides.migrationDirectionFromSync,
      synchronousOrbitNote: tides.synchronousOrbitNote,
      synchronousOrbitValid: tides.synchronousOrbitValid,
      lockingTimesGyr: tides.lockingTimesGyr,
    },
    habitability: {
      baselineHydrosphere: hydrosphere,
      hydrosphere: effectiveHydrosphere,
      radiation,
      summary: habitabilitySummary,
    },
    baselineClimate: climate,
    climate: effectiveClimate,
    cloudCirculation,
    moonPhotochemistry,
    co2ClimateTendencyContext,
    smallBodyReservoirContext,
    atmosphereEvolutionContext,
    stellarHistoryDoseContext,
    carbonCycleContext,
    oceanChemistryContext,
    nitrogenCycleContext,
    biosignatureContext,
    climateChemistryForcing,
    coupledClimatePass,
    impactEnvironmentContext,
    geology,
    biosphere,
    interior,
    resonance,
    formation,
    dynamical: dynamicalHabitabilityBridge,
  });
  const earthSimilarity = computeEarthSimilarityIndex(habitabilityContext);
  const unifiedMoonHabitability = computeMoonHabitabilityIndex(habitabilityContext, {
    solventPolicy: habitabilityPolicy,
  });

  if (detailLevel === "summary") {
    const result = buildMoonSummaryResult({
      hostFrame,
      mStarMsol,
      rStarRsol,
      lStarLsol,
      ageGyr,
      mPlanetME,
      rhoPlanetGcm3,
      rPlanetRE,
      aPlanetAU,
      ePlanet,
      rotPlanetHours,
      mMoonMM,
      rhoMoonGcm3,
      albedo,
      aMoonKmInput,
      eMoon,
      inc,
      initialRotHours,
      compositionOverride: moonInputs.compositionOverride,
      rMoonRM,
      gMoonG,
      vEscKmS,
      orbit,
      temperature,
      atmosphere,
      hydrosphere: effectiveHydrosphere,
      climate: effectiveClimate,
      cloudCirculation,
      impactEnvironmentContext,
      atmosphereEvolutionContext,
      stellarHistoryDoseContext,
      co2ClimateTendencyContext,
      smallBodyReservoirContext,
      interiorEvolutionContext,
      carbonCycleContext,
      oceanChemistryContext,
      nitrogenCycleContext,
      biosignatureContext,
      climateChemistryForcing,
      coupledClimatePass,
      biosphere,
      interior,
      magnetosphere,
      radiation,
      surfaceBoundaryExosphere,
      spinState: tides.spinState,
      tides,
      compositionClass: tides.compositionClass,
      rockyBodyComposition: moonRockyBodyComposition,
      solidBodyStructure,
      solidBodyResponse,
      moonGeodynamicsContext,
      resonance,
      formation,
      surfaceExomoonCalibration: habitabilitySummary.surfaceExomoonCalibration,
      habitabilitySummary,
      unifiedMoonHabitability,
      tidalPersistenceContext,
      dynamicalHabitabilityBridge,
      eclipseTimingContext,
      moonOrientationContext,
    });
    return attachMoonEraTimeline(result, {
      planetModel: result.planet,
      systemContext: { starAgeGyr: ageGyr, starMassMsol: mStarMsol },
    });
  }

  const result = {
    hostFrame: hostFrame
      ? {
          id: hostFrame.id,
          label: hostFrame.label,
          frameKind: hostFrame.frameKind,
          orbitFamilyKind: hostFrame.orbitFamilyKind,
        }
      : null,
    star: { massMsol: mStarMsol, radiusRsol: rStarRsol, luminosityLsol: lStarLsol, ageGyr },
    planet: {
      massEarth: mPlanetME,
      cmfPct: parent.inputs.cmfPct,
      densityGcm3: rhoPlanetGcm3,
      radiusEarth: rPlanetRE,
      gravityG: parent.derived.gravityG,
      semiMajorAxisAu: aPlanetAU,
      eccentricity: ePlanet,
      periapsisAu: orbit.periPlanetAu,
      orbitalPeriodDays: orbit.periodPlanetDays,
      rotationPeriodHours: rotPlanetHours,
    },

    inputs: {
      massMoon: mMoonMM,
      densityGcm3: rhoMoonGcm3,
      albedo,
      semiMajorAxisKmInput: aMoonKmInput,
      semiMajorAxisKm: orbit.semiMajorAxisKm,
      eccentricityInput,
      eccentricity: eMoon,
      inclinationDeg: inc,
      initialRotationPeriodHours: initialRotHours,
      compositionOverride: moonInputs.compositionOverride || null,
      compositionMode,
      compositionNormalizeMode,
      compositionStructureSource,
      manualComponentMassFractions: moonInputs.manualComponentMassFractions ?? null,
      manualComponentPct: moonInputs.manualComponentPct ?? null,
      manualElementMassFractions: moonInputs.manualElementMassFractions ?? null,
      manualElementPct: moonInputs.manualElementPct ?? null,
      manualTraceElementAbundance: moonInputs.manualTraceElementAbundance ?? null,
      hydrosphereMode,
      atmosphereMode,
      orbitalCouplingMode,
      waterMassFractionPct: moonInputs.waterMassFractionPct,
      effectiveWaterMassFractionPct: effectiveMoonWaterMassFractionPct,
      salinityPct: moonInputs.salinityPct,
      ammoniaPct: moonInputs.ammoniaPct,
      differentiatedInterior: moonInputs.differentiatedInterior,
      radioisotopeMode: moonInputs.radioisotopeMode,
      radioisotopeAbundance,
      radioisotopeAbundanceSource: moonRadioisotopeAbundanceSource,
      u238Abundance: moonInputs.u238Abundance,
      u235Abundance: moonInputs.u235Abundance,
      th232Abundance: moonInputs.th232Abundance,
      k40Abundance: moonInputs.k40Abundance,
      manualSurfacePressureAtm: moonInputs.manualSurfacePressureAtm,
      n2Pct: moonInputs.n2Pct,
      o2Pct: moonInputs.o2Pct,
      co2Pct: moonInputs.co2Pct,
      arPct: moonInputs.arPct,
      h2oPct: moonInputs.h2oPct,
      ch4Pct: moonInputs.ch4Pct,
      coPct: moonInputs.coPct,
      h2Pct: moonInputs.h2Pct,
      hePct: moonInputs.hePct,
      so2Pct: moonInputs.so2Pct,
      nh3Pct: moonInputs.nh3Pct,
      forcedEccentricity,
      manualResonanceGroupId: moonInputs.manualResonanceGroupId,
      manualResonanceOrder: moonInputs.manualResonanceOrder,
      manualResonanceRatio: moonInputs.manualResonanceRatio,
    },

    physical: {
      radiusMoon: rMoonRM,
      gravityG: gMoonG,
      escapeVelocityKmS: vEscKmS,
      surfaceFieldEarths: magnetosphere.intrinsicFieldStrengthRelEarth,
      inferredCoreMassFraction: inferredMoonCoreMassFraction,
      effectiveCoreMassFraction: moonCoreMassFraction,
      effectiveCoreMassFractionPct: moonCoreMassFraction * 100,
      effectiveWaterMassFraction: moonEffectiveWaterMassFraction,
      effectiveWaterMassFractionPct: moonEffectiveWaterMassFraction * 100,
      solidBodyStructure,
      solidBodyResponse,
    },

    composition: moonRockyBodyComposition,

    orbit: {
      moonZoneInnerKm: orbit.zoneInnerKm,
      classicalRocheLimitKm: orbit.classicalRocheLimitKm,
      effectiveInnerLimitKm: orbit.effectiveInnerLimitKm,
      effectiveInnerLimitKind: orbit.effectiveInnerLimitKind,
      collisionInnerLimitKm: orbit.collisionInnerLimitKm,
      smallCohesiveRocheBypass: orbit.smallCohesiveRocheBypass,
      smallCohesiveRocheBypassReason: orbit.smallCohesiveRocheBypassReason,
      moonEquivalentDiameterKm: orbit.moonEquivalentDiameterKm,
      rocheLimitModel: orbit.rocheLimitModel,
      moonZoneOuterKm: orbit.zoneOuterKm,
      hillRadiusKm: orbit.hillRadiusKm,
      stableOuterLimitKm: orbit.stableOuterLimitKm,
      progradeStableOuterLimitKm: orbit.progradeStableOuterLimitKm,
      retrogradeStableOuterLimitKm: orbit.retrogradeStableOuterLimitKm,
      comfortOuterLimitKm: orbit.comfortOuterLimitKm,
      semiMajorAxisAllowedMinKm: orbit.minAMoonKm,
      semiMajorAxisAllowedMaxKm: orbit.maxAMoonKm,
      semiMajorAxisHillMaxKm: orbit.maxAHillKm,
      semiMajorAxisGuard: orbit.semiMajorAxisGuard,
      periapsisKm: orbit.periapsisKm,
      apoapsisKm: orbit.apoapsisKm,
      orbitalDirection: orbit.orbitalDirection,
      requestedOrbitStabilityClass: orbit.requestedOrbitStabilityClass,
      requestedOrbitStabilityLabel: orbit.requestedOrbitStabilityLabel,
      orbitStabilityClass: orbit.orbitStabilityClass,
      orbitStabilityLabel: orbit.orbitStabilityLabel,
      longTermStable: orbit.longTermStable,
      comfortablyStable: orbit.comfortablyStable,
      stabilityMarginFraction: orbit.stabilityMarginFraction,
      orbitalPeriodSiderealDays: orbit.orbitalPeriodSiderealDays,
      orbitalPeriodSynodicDays: orbit.orbitalPeriodSynodicDays,
      rotationPeriodDays: tides.rotationPeriodDays,
    },

    temperature: {
      equilibriumK: Math.round(temperature.equilibriumK),
      baselineSurfaceK: temperature.surfaceK,
      baselineSurfaceC: temperature.surfaceC,
      surfaceK: effectiveSurfaceTempK,
      surfaceC: effectiveSurfaceTempK - 273.15,
      effectiveSurfaceK: effectiveSurfaceTempK,
      effectiveSurfaceC: effectiveSurfaceTempK - 273.15,
      radiogenicWm2: temperature.radiogenicWm2,
      thermalEnvelope: temperature.thermalEnvelope,
      companionFluxEarth: meanCompanionFluxEarth,
      fluxVariabilityFraction: hostFrameFluxVariabilityFraction,
    },

    volatiles: {
      inventory: volatileResults,
      primaryAtmosphere: primaryAtmosphere ? primaryAtmosphere.species : null,
      surfacePressurePa,
      hasVolatileAtmosphere: retainedVolatiles.length > 0,
    },

    atmosphere,
    exosphere: surfaceBoundaryExosphere,

    magnetosphere,

    radiation: {
      modelVersion: radiation.modelVersion,
      magnetosphericRadRemDay: radiation.magnetosphericRadRemDay,
      magnetosphericLabel: radiationLabel(radiation.magnetosphericRadRemDay),
      magnetopauseLShell: radiation.magnetopauseLShell,
      bAtMoonGauss: radiation.bAtMoonGauss,
      lShell: radiation.lShell,
      insideMagnetosphere: radiation.insideMagnetosphere,
      parentBeltLevel: radiation.parentBeltLevel,
      stellarXuvFluxRatio: radiation.stellarXuvFluxRatio,
      stellarXuvLevel: radiation.stellarXuvLevel,
      atmosphereShielding: radiation.atmosphereShielding,
      intrinsicFieldShielding: radiation.intrinsicFieldShielding,
      inducedFieldShielding: radiation.inducedFieldShielding,
      magneticShielding: radiation.magneticShielding,
      combinedShielding: radiation.combinedShielding,
      parentMagnetosphereCompressionClass: radiation.parentMagnetosphereCompressionClass,
      parentWindCompressionFactor: radiation.parentWindCompressionFactor,
      compressionExposureMultiplier: radiation.compressionExposureMultiplier,
      surfaceExposureRemDayEquivalent: radiation.surfaceExposureRemDayEquivalent,
      surfaceExposure: radiation.surfaceExposure,
      subsurfaceExposureRemDayEquivalent: radiation.subsurfaceExposureRemDayEquivalent,
      subsurfaceExposure: radiation.subsurfaceExposure,
      surfaceClass: radiation.surfaceClass,
      subsurfaceClass: radiation.subsurfaceClass,
      calibrationNotes: radiation.calibrationNotes || [],
      calibrationAnchor: radiation.calibrationAnchor || null,
    },
    environment: {
      forcing: environmentForcing,
      atmosphereLedger,
      atmosphereEvolutionContext,
      stellarHistoryDoseContext,
      cloudCirculation,
      moonPhotochemistry,
      co2ClimateTendencyContext,
      smallBodyReservoirContext,
      interiorEvolutionContext,
      moonGeodynamicsContext,
      carbonCycleContext,
      oceanChemistryContext,
      nitrogenCycleContext,
      biosignatureContext,
      climateChemistryForcing,
      coupledClimatePass,
      impactEnvironmentContext,
    },
    derived: {
      exosphere: surfaceBoundaryExosphere,
      rockyBodyComposition: moonRockyBodyComposition,
      solidBodyStructure,
      solidBodyResponse,
      componentMassFractions: moonRockyBodyComposition.componentMassFractions,
      elementMassFractions: moonRockyBodyComposition.elementMassFractions,
      compositionMode: moonRockyBodyComposition.compositionMode,
      compositionValidation: moonRockyBodyComposition.validation,
      compositionRadiogenicContext: moonCompositionRadiogenicContext,
      radioisotopeAbundanceSource: moonRadioisotopeAbundanceSource,
      inferredCoreMassFraction: inferredMoonCoreMassFraction,
      effectiveCoreMassFraction: moonCoreMassFraction,
      effectiveCoreMassFractionPct: moonCoreMassFraction * 100,
      effectiveWaterMassFraction: moonEffectiveWaterMassFraction,
      effectiveWaterMassFractionPct: moonEffectiveWaterMassFraction * 100,
      environmentForcing,
      atmosphereLedger,
      atmosphereEvolutionContext,
      stellarHistoryDoseContext,
      cloudCirculation,
      moonPhotochemistry,
      co2ClimateTendencyContext,
      smallBodyReservoirContext,
      interiorEvolutionContext,
      moonGeodynamicsContext,
      carbonCycleContext,
      oceanChemistryContext,
      nitrogenCycleContext,
      biosignatureContext,
      climateChemistryForcing,
      coupledClimatePass,
      impactEnvironmentContext,
      tidalStressMorphologyContext,
      coupledSurfaceTempK: climateChemistryForcing.coupledSurfaceTempK,
      baselineSurfaceTempK: temperature.surfaceK,
      effectiveSurfaceTempK,
      baselineHydrosphere: hydrosphere,
      hydrosphere: effectiveHydrosphere,
      effectiveHydrosphere,
      baselineClimate: climate,
      climate: effectiveClimate,
      effectiveClimate,
    },

    habitability: {
      earthSimilarityIndex: earthSimilarity.score,
      earthSimilarityBreakdown: earthSimilarity.components,
      habitabilityIndex: unifiedMoonHabitability.score,
      habitabilityModelVersion: unifiedMoonHabitability.version,
      habitabilityPolicyVersion: unifiedMoonHabitability.breakdown.solventPolicyVersion,
      breakdown: unifiedMoonHabitability.breakdown,
      baselineHydrosphere: hydrosphere,
      hydrosphere: effectiveHydrosphere,
      radiation,
      atmosphereLedger,
      exosphere: surfaceBoundaryExosphere,
      stellarHistoryDoseContext,
      cloudCirculation,
      smallBodyReservoirContext,
      interiorEvolutionContext,
      carbonCycleContext,
      oceanChemistryContext,
      nitrogenCycleContext,
      biosignatureContext,
      climateChemistryForcing,
      coupledClimatePass,
      impactEnvironmentContext,
      dynamicalPersistence: dynamicalHabitabilityBridge,
      tidalStressMorphologyContext,
      summary: habitabilitySummary,
    },

    surfaceExomoonCalibration: habitabilitySummary.surfaceExomoonCalibration,

    baselineClimate: climate,
    climate: effectiveClimate,
    cloudCirculation,
    carbonCycleContext,
    oceanChemistryContext,
    nitrogenCycleContext,
    biosignatureContext,
    climateChemistryForcing,
    coupledClimatePass,
    impactEnvironmentContext,

    spinState: tides.spinState,

    geology,
    tidalStressMorphologyContext,

    biosphere,

    interior,
    interiorEvolutionContext,
    moonGeodynamicsContext,

    resonance,

    formation,

    tides: {
      totalEarthTides: tides.totalEarthTides,
      moonContributionPct: tides.moonContributionPct,
      starContributionPct: tides.starContributionPct,
      tidalHeatingW: tides.tidalHeatingW,
      tidalHeatingWm2: tides.tidalHeatingWm2,
      tidalHeatingEarth: tides.tidalHeatingEarth,
      compositionClass: tides.compositionClass,
      k2Moon: tides.k2Moon,
      qMoon: tides.qMoon,
      rigidityMoonGPa: tides.rigidityMoonGPa,
      baseQMoon: tides.baseQMoon,
      baseRigidityMoonGPa: tides.baseRigidityMoonGPa,
      moonMomentOfInertiaFactor: tides.moonMomentOfInertiaFactor,
      solidBodyResponse: tides.solidBodyResponse,
      solidBodyStructureClass: tides.solidBodyStructureClass,
      tidalRegime: tides.tidalRegime,
      smallBodyRegime: tides.smallBodyRegime,
      k2Model: tides.k2Model,
      qModel: tides.qModel,
      qPlanet: tides.qPlanet,
      qPlanetModel: tides.qPlanetModel,
      k2Planet: tides.k2Planet,
      k2PlanetEffective: tides.k2PlanetEffective,
      tidalUncertaintyCaveats: tides.tidalUncertaintyCaveats,
      massModel: tides.massModel,
      compositionOverride: moonInputs.compositionOverride || null,
      effectiveEccentricity: eMoon,
      tidalFeedbackActive: tides.tidalFeedbackActive,
      meltFraction: tides.meltFraction,
      qEffective: tides.qEffective,
      rigidityEffectiveGPa: tides.rigidityEffectiveGPa,
      recessionCmYr: tides.recessionCmYr,
      dadtTotalMs: tides.dadtTotalMs,
      dadtPlanetMs: tides.dadtPlanetMs,
      dadtMoonMs: tides.dadtMoonMs,
      fateTimescaleMethod: tides.fateTimescaleMethod,
      innerFateTargetLabel: tides.innerFateTargetLabel,
      timeToRocheGyr: tides.timeToRocheGyr,
      timeToEscapeGyr: tides.timeToEscapeGyr,
      tidallyEvolvedMoon: tides.tidallyEvolvedMoon,
      spinOrbitResonance: tides.spinOrbitResonance,
      spinState: tides.spinState,
      moonLockedToPlanet: tides.moonLockedToPlanet,
      planetLockedToMoon: tides.planetLockedToMoon,
      planetLockedToStar: tides.planetLockedToStar,
      synchronousOrbitKm: tides.synchronousOrbitKm,
      synchronousOrbitParentRadii: tides.synchronousOrbitParentRadii,
      insideSynchronousOrbit: tides.insideSynchronousOrbit,
      migrationDirectionFromSync: tides.migrationDirectionFromSync,
      synchronousOrbitNote: tides.synchronousOrbitNote,
      synchronousOrbitValid: tides.synchronousOrbitValid,
      lockingTimesGyr: tides.lockingTimesGyr,
    },

    dynamicalContext: {
      tidalPersistenceContext,
      habitabilityBridge: dynamicalHabitabilityBridge,
      tidalStressMorphologyContext,
      eclipseTimingContext,
      moonOrientationContext,
    },

    display: {
      radius: `${fmt(rMoonRM, 3)} R☾`,
      gravity: `${fmt(gMoonG, 3)} g`,
      esc: `${fmt(vEscKmS, 2)} km/s`,
      solidBodyStructure: classLabel(solidBodyStructure.structureClass, "Not evaluated"),
      compactnessClass: classLabel(solidBodyStructure.compactnessClass, "Not evaluated"),
      porosity:
        solidBodyStructure.porosityFraction > 0
          ? `${fmt(solidBodyStructure.porosityFraction * 100, 1)}%`
          : "0%",
      layerSummary: [
        `Core ${fmt((solidBodyStructure.layerMassFractions?.core || 0) * 100, 1)}%`,
        `Rock ${fmt((solidBodyStructure.layerMassFractions?.silicateMantle || 0) * 100, 1)}%`,
        `Ice ${fmt((solidBodyStructure.iceMassFraction || 0) * 100, 1)}%`,
        `Ocean ${fmt((solidBodyStructure.oceanMassFraction || 0) * 100, 1)}%`,
      ].join(" | "),
      materialResponseConfidence: classLabel(solidBodyResponse.confidence, "Unknown"),
      equilibriumTemp: `${Math.round(temperature.equilibriumK)} K`,
      globalEquilibriumTemp: temperature.thermalEnvelope?.globalEquilibriumK
        ? `${fmt(temperature.thermalEnvelope.globalEquilibriumK, 0)} K`
        : `${Math.round(temperature.equilibriumK)} K`,
      observableSurfaceRange: temperature.thermalEnvelope?.observableTemperatureRangeK
        ? `${fmt(temperature.thermalEnvelope.observableTemperatureRangeK.min, 0)}-${fmt(
            temperature.thermalEnvelope.observableTemperatureRangeK.max,
            0,
          )} K`
        : "Not evaluated",
      thermalEnvelopeConfidence: temperature.thermalEnvelope?.thermalModelConfidence || "medium",
      thermalEnvelopeCaveats: Array.isArray(temperature.thermalEnvelope?.thermalModelCaveats)
        ? temperature.thermalEnvelope.thermalModelCaveats.join(" | ")
        : "",
      environmentForcing: formatEnvironmentForcingSummary(environmentForcing),
      earthSimilarityIndex: fmt(earthSimilarity.score, 3),
      habitabilityIndex: unifiedMoonHabitability.score.toFixed(3),
      lifeClass: habitabilitySummary.primaryOutcome,
      surfaceHabitability: habitabilitySummary.surfaceOutcome,
      subsurfaceHabitability: habitabilitySummary.subsurfaceOutcome,
      habitabilityGates: habitabilitySummary.gateSummary,
      surfaceExomoonCalibration:
        habitabilitySummary.surfaceExomoonCalibration?.applicable === true
          ? habitabilitySummary.surfaceExomoonCalibration.label
          : "Not targeted",
      surfaceTemp: `${fmt(effectiveSurfaceTempK, 0)} K (${fmt(effectiveSurfaceTempK - 273.15, 0)} °C)`,
      zoneInner: `${fmt(orbit.zoneInnerKm, 0)} km`,
      classicalRocheLimit: `${fmt(orbit.classicalRocheLimitKm, 0)} km`,
      effectiveInnerLimit: `${fmt(orbit.effectiveInnerLimitKm, 0)} km`,
      innerLimitNote: orbit.smallCohesiveRocheBypass
        ? "Small-body strength bypass active: assumes a cohesive/monolithic body below 20 km diameter; rubble-pile or very weak material would still be Roche-limited."
        : orbit.effectiveInnerLimitKind === "collision"
          ? "Effective inner limit is set by parent collision clearance."
          : "Effective inner limit follows the rigid-body Roche guardrail.",
      zoneOuter: `${fmt(orbit.zoneOuterKm, 0)} km`,
      peri: `${fmt(orbit.periapsisKm, 0)} km`,
      apo: `${fmt(orbit.apoapsisKm, 0)} km`,
      sidereal: `${fmt(orbit.orbitalPeriodSiderealDays, 3)} days`,
      synodic: `${fmt(orbit.orbitalPeriodSynodicDays, 3)} days`,
      rot:
        tides.rotationPeriodDays === null
          ? "Not tidally locked"
          : tides.spinState?.ratio && tides.spinState.ratio !== "1:1"
            ? `${fmt(tides.rotationPeriodDays, 3)} days (${tides.spinState.ratio} resonance)`
            : tides.moonLockedToPlanet === "Yes"
              ? `${fmt(tides.rotationPeriodDays, 3)} days (locked)`
              : `${fmt(tides.rotationPeriodDays, 3)} days (est.)`,
      spinState: tides.spinState?.state || "Not evaluated",
      tidalHeatingPersistence: tidalPersistenceContext.sustainedTidalHeatingClass || "unknown",
      eclipseTimingReadiness: classLabel(
        eclipseTimingContext.outputs?.scheduleReadinessClass,
        "Unknown",
      ),
      eclipseFrequency: classLabel(eclipseTimingContext.outputs?.eclipseFrequencyClass, "Unknown"),
      eclipseDuration: classLabel(
        eclipseTimingContext.outputs?.solarEclipseDurationClass,
        "Unknown",
      ),
      laplaceRegime: classLabel(moonOrientationContext.outputs?.laplaceRegimeClass, "Unknown"),
      nodalPrecession: classLabel(moonOrientationContext.outputs?.nodalPrecessionClass, "Unknown"),
      apsidalPrecession: classLabel(
        moonOrientationContext.outputs?.apsidalPrecessionClass,
        "Unknown",
      ),
      cassiniReadiness: classLabel(
        moonOrientationContext.outputs?.cassiniReadinessClass,
        "Unknown",
      ),
      dynamicalPersistenceConfidence: dynamicalHabitabilityBridge.confidence || "unknown",
      tidalRegime: tides.tidalRegime || "regular moon",
      tidalResponseModel: tides.k2Model || "homogeneous-elastic-moon-v1",
      tidalUncertaintyCaveats: Array.isArray(tides.tidalUncertaintyCaveats)
        ? tides.tidalUncertaintyCaveats.join(" | ")
        : "",
      tidalHostQ:
        tides.qPlanet > 0
          ? `${fmt(tides.qPlanet, 0)} (${tides.qPlanetModel || "host-q-model"})`
          : "Not evaluated",
      initialRot: `${fmt(initialRotHours, 2)} hours`,
      tides: `${fmt(tides.totalEarthTides, 3)} Earth tides`,
      moonPct: `${fmt(tides.moonContributionPct, 1)} %`,
      starPct: `${fmt(tides.starContributionPct, 1)} %`,
      compositionClass: tides.tidalFeedbackActive
        ? `${tides.compositionClass} (partially molten)`
        : tides.compositionClass,
      tidalHeating:
        tides.tidalHeatingWm2 < 1e-6
          ? "Negligible"
          : tides.tidalHeatingWm2 < 0.001
            ? `${tides.tidalHeatingWm2.toExponential(2)} W/m²`
            : `${fmt(tides.tidalHeatingWm2, 4)} W/m²`,
      tidalHeatingTotal:
        tides.tidalHeatingW < 1
          ? "Negligible"
          : tides.tidalHeatingW < 1e6
            ? `${fmt(tides.tidalHeatingW, 0)} W`
            : `${tides.tidalHeatingW.toExponential(2)} W`,
      tidalHeatingXEarth:
        tides.tidalHeatingEarth < 1e-4 ? "Negligible" : `${fmt(tides.tidalHeatingEarth, 2)}× Earth`,
      stressMorphology: tidalStressMorphologyContext.outputs.stressMorphologyClass,
      stressConfidence: tidalStressMorphologyContext.outputs.stressConfidence,
      stressTerrainNotes: tidalStressMorphologyContext.outputs.surfaceTerrainNotes.join(" | "),
      interiorEvolution: interiorEvolutionContext.outputs.secularCoolingClass,
      interiorDynamoSupport: interiorEvolutionContext.outputs.dynamoLifetimeSupportClass,
      volcanicLongevity: interiorEvolutionContext.outputs.volcanicLongevityClass,
      mantleRecyclingSupport: interiorEvolutionContext.outputs.mantleRecyclingSupportClass,
      radiogenicHeating:
        temperature.radiogenicWm2 < 1e-6
          ? "Negligible"
          : temperature.radiogenicWm2 < 0.001
            ? `${temperature.radiogenicWm2.toExponential(2)} W/m²`
            : `${fmt(temperature.radiogenicWm2, 4)} W/m²`,
      atmosphereClass: atmosphere.atmosphereClass,
      atmosphereRegime: classLabel(atmosphere.atmosphereRegime, "Unknown"),
      surfacePressure:
        surfacePressurePa <= 0
          ? "0 Pa"
          : surfacePressurePa < 1
            ? `${surfacePressurePa.toExponential(2)} Pa`
            : surfacePressurePa < 1000
              ? `${fmt(surfacePressurePa, 2)} Pa`
              : surfacePressurePa < 100000
                ? `${fmt(surfacePressurePa / 1000, 2)} kPa`
                : `${fmt(surfacePressurePa / 101325, 2)} atm`,
      atmosphereComposition: atmosphere.compositionSummary,
      atmosphereSource: atmosphere.sourceClass,
      atmosphereStability: atmosphere.stability?.balanceLabel || "None",
      atmosphereLoss: atmosphere.stability?.dominantLossChannel || "No long-lived atmosphere",
      atmosphereLifetime:
        atmosphere.stability?.estimatedLifetimeGyr > 0
          ? `${fmt(atmosphere.stability.estimatedLifetimeGyr, 2)} Gyr`
          : "0 Gyr",
      atmosphereTrend: atmosphereLedger.trendLabel,
      atmosphereEvolution: atmosphereEvolutionContext.pressureTrendClass,
      atmosphereVolatileLoss: atmosphereEvolutionContext.volatileLossRiskClass,
      atmosphereCompositionStability: atmosphereEvolutionContext.compositionStabilityClass,
      stellarHistoryWaterLoss:
        stellarHistoryDoseContext.outputs?.waterLossRiskClass || "Not evaluated",
      stellarHistoryAbioticOxygen:
        stellarHistoryDoseContext.outputs?.abioticOxygenRiskClass || "Not evaluated",
      atmosphereDominantSource: atmosphereLedger.dominantSource?.label || "None",
      atmosphereDominantSink: atmosphereLedger.dominantSink?.label || "None",
      atmosphereStabilityTimescale: atmosphereLedger.timescaleLabel,
      impactEnvironment: impactEnvironmentContext.outputs.impactFluxClass,
      craterRetention: impactEnvironmentContext.outputs.craterRetentionClass,
      co2ClimateTendency: co2ClimateTendencyContext.co2DrawdownTendency,
      co2BuildupTendency: co2ClimateTendencyContext.co2BuildupTendency,
      co2ThermostatAdjustment: `${co2ClimateTendencyContext.thermostatAdjustmentK > 0 ? "+" : ""}${fmt(
        co2ClimateTendencyContext.thermostatAdjustmentK,
        1,
      )} K`,
      smallBodyReservoir: smallBodyReservoirContext?.outputs?.impactFluxClass || "Not evaluated",
      smallBodyVolatileDelivery:
        smallBodyReservoirContext?.outputs?.volatileDeliveryClass || "Not evaluated",
      coupledClimateTendency: climateChemistryForcing.labelOnlyClimateState,
      photochemicalForcing:
        climateChemistryForcing.netDeltaK === 0
          ? "0 K diagnostic"
          : `${climateChemistryForcing.netDeltaK > 0 ? "+" : ""}${fmt(climateChemistryForcing.netDeltaK, 1)} K diagnostic`,
      coupledSurfaceTemp: `${fmt(climateChemistryForcing.coupledSurfaceTempK, 0)} K`,
      cloudRegime: cloudCirculation.circulationRegime,
      heatRedistribution: `${fmt(cloudCirculation.heatRedistributionEfficiency * 100, 0)}% efficiency`,
      cloudAlbedoEffect: `${fmt(cloudCirculation.cloudAlbedoEffect * 100, 1)}% diagnostic`,
      carbonCycle: carbonCycleContext.tendencyClass,
      weatheringEfficiency: fmt(carbonCycleContext.weatheringEfficiency, 2),
      volcanicSupply: fmt(carbonCycleContext.volcanicSupply, 2),
      carbonRecycling: fmt(carbonCycleContext.recyclingEfficiency, 2),
      carbonThermostat: fmt(carbonCycleContext.thermostatStrength, 2),
      atmosphereHaze: atmosphere.stability?.hazeClass || "None",
      atmosphereClouds: atmosphere.stability?.cloudClass || "None",
      exosphere: surfaceBoundaryExosphere?.present
        ? surfaceBoundaryExosphere.exosphereClass
        : "No icy sputtered O2 exosphere",
      exosphereSource: surfaceBoundaryExosphere?.sourceMechanism || "none",
      exosphereO2Production: exosphereO2ProductionDisplay,
      exosphereIonPickup: surfaceBoundaryExosphere?.ionPickupClass || "none",
      exosphereAbioticO2,
      exospherePressureEffect,
      greenhouseWarming:
        atmosphere.greenhouseWarmingK <= 0 ? "+0 K" : `+${fmt(atmosphere.greenhouseWarmingK, 1)} K`,
      volcanicActivity: geology.volcanicActivity,
      cryovolcanicActivity: geology.cryovolcanicActivity,
      moonGeodynamics: classLabel(moonGeodynamicsContext.outputs?.dominantProcess, "Not evaluated"),
      hydrothermalPotential: classLabel(
        moonGeodynamicsContext.outputs?.hydrothermalPotentialClass,
        "Not evaluated",
      ),
      rockOceanExchange: classLabel(
        moonGeodynamicsContext.outputs?.rockOceanExchangeClass,
        "Not evaluated",
      ),
      resurfacing: geology.resurfacingClass,
      volatileReplenishment: geology.volatileReplenishmentTendency,
      oceanPersistence: geology.oceanPersistenceTendency,
      surfaceBiosphere: biosphere.surfaceBiosphereClass,
      plantLife: biosphere.plantLifePlausibility,
      vegetation:
        biosphere.vegetationEligible && biosphere.vegetation ? "Supported" : "Not supported",
      vegetationColours:
        biosphere.vegetationEligible && biosphere.vegetation
          ? `${biosphere.vegetation.paleHex} → ${biosphere.vegetation.deepHex}`
          : "N/A",
      vegetationNote:
        biosphere.vegetationEligible && biosphere.vegetation
          ? biosphere.vegetation.note
          : "No surface vegetation under the current biosphere gate",
      biosphereLimits: biosphere.limitingFactorsDisplay,
      climateState: effectiveClimate.climateState,
      climateZones: effectiveClimate.climateZones?.display?.dominantClass
        ? `${effectiveClimate.climateZones.display.dominantClass} (${effectiveClimate.climateZones.display.zoneCount} zones)`
        : "N/A",
      climateZoneSummary: effectiveClimate.climateZones?.display?.summary || "N/A",
      seasonality: effectiveClimate.seasonalitySummary,
      dayNightContrast: `${fmt(effectiveClimate.dayNightContrastK, 1)} K`,
      nightsideMin: `${fmt(effectiveClimate.nightsideMinK, 0)} K`,
      collapseState: effectiveClimate.collapseState,
      surfaceTempRange: `${fmt(effectiveClimate.surfaceTempMinK, 0)}–${fmt(effectiveClimate.surfaceTempMaxK, 0)} K`,
      planetshine:
        effectiveClimate.planetshineFluxWm2 <= 0
          ? "Negligible"
          : effectiveClimate.planetshineFluxWm2 < 1
            ? `${fmt(effectiveClimate.planetshineFluxWm2, 3)} W/m²`
            : `${fmt(effectiveClimate.planetshineFluxWm2, 2)} W/m²`,
      eclipseCooling:
        effectiveClimate.eclipseCoolingPenalty <= 0
          ? "Negligible"
          : `${fmt(effectiveClimate.eclipseCoolingPenalty * 100, 1)}% stellar loss`,
      hydrosphereState: effectiveHydrosphere.hydrosphereState,
      surfaceWater:
        effectiveHydrosphere.surfaceAccessibleLiquidFraction > 0
          ? `${fmt(effectiveHydrosphere.surfaceAccessibleLiquidFraction * 100, 0)}% accessible liquid`
          : effectiveHydrosphere.liquidOceanFraction > 0
            ? `${fmt(effectiveHydrosphere.liquidOceanFraction * 100, 0)}% liquid cover`
            : effectiveHydrosphere.permanentIceFraction > 0
              ? `${fmt(effectiveHydrosphere.permanentIceFraction * 100, 0)}% surface ice`
              : effectiveHydrosphere.steamFraction > 0
                ? `${fmt(effectiveHydrosphere.steamFraction * 100, 0)}% vapour cover`
                : "None",
      subsurfaceOcean: effectiveHydrosphere.subsurfaceOceanPresent
        ? `Yes (${fmt(effectiveHydrosphere.subsurfaceOceanScore, 2)})`
        : effectiveHydrosphere.subsurfaceOceanScore >= 0.25
          ? `Possible (${fmt(effectiveHydrosphere.subsurfaceOceanScore, 2)})`
          : "No",
      oceanDepth:
        effectiveHydrosphere.estimatedSurfaceOceanDepthKm > 0
          ? `${fmt(effectiveHydrosphere.estimatedSurfaceOceanDepthKm, 1)} km surface ocean`
          : effectiveHydrosphere.estimatedSubsurfaceOceanDepthKm > 0
            ? `${fmt(effectiveHydrosphere.estimatedSubsurfaceOceanDepthKm, 1)} km subsurface ocean`
            : "None",
      iceShell:
        effectiveHydrosphere.estimatedIceShellThicknessKm > 0
          ? `${fmt(effectiveHydrosphere.estimatedIceShellThicknessKm, 1)} km`
          : "None",
      highPressureIce: formatHighPressureIceDisplay(effectiveHydrosphere),
      oceanPhaseDiagnostics: effectiveOceanPhaseDiagnostics?.text ?? null,
      oceanPhaseDiagnosticLines: effectiveOceanPhaseDiagnostics?.lines ?? [],
      interiorStructure:
        interior.oceanDepthKm > 0
          ? `${fmt(interior.oceanDepthKm, 1)} km ocean | ${interior.convectionRegime}`
          : interior.convectionRegime,
      oceanChemistry: oceanChemistryContext.summaryLabel,
      oceanAcidity: oceanChemistryContext.acidityClass,
      carbonateSaturation: oceanChemistryContext.carbonateSaturationClass,
      nutrientSupport: oceanChemistryContext.nutrientSupportClass,
      nitrogenCycle: nitrogenCycleContext.outputs.n2ReservoirClass,
      nitrogenPressureBuffer: nitrogenCycleContext.outputs.pressureBufferSupportClass,
      nitrogenNutrientLimitation: nitrogenCycleContext.outputs.nutrientLimitationClass,
      biosignatureContext: biosignatureContext.interpretationClass,
      disequilibriumStrength: biosignatureContext.disequilibriumStrength,
      oxygenFalsePositiveRisk: biosignatureContext.o2O3FalsePositiveRisk,
      methaneContext: biosignatureContext.methaneContext,
      coBuildupRisk: biosignatureContext.coBuildupRisk,
      magnetosphericRad:
        radiation.magnetosphericRadRemDay < 0.001
          ? "Negligible"
          : radiation.magnetosphericRadRemDay < 1
            ? `${fmt(radiation.magnetosphericRadRemDay, 3)} rem/day`
            : radiation.magnetosphericRadRemDay < 1000
              ? `${fmt(radiation.magnetosphericRadRemDay, 1)} rem/day`
              : `${radiation.magnetosphericRadRemDay.toExponential(2)} rem/day`,
      magnetosphericLabel: radiationLabel(radiation.magnetosphericRadRemDay),
      parentMagnetosphereCompression:
        radiation.compressionExposureMultiplier > 1
          ? `${radiation.parentMagnetosphereCompressionClass} parent boundary (${fmt(radiation.compressionExposureMultiplier, 2)}x exposure context)`
          : radiation.parentMagnetosphereCompressionClass &&
              radiation.parentMagnetosphereCompressionClass !== "Not evaluated"
            ? radiation.parentMagnetosphereCompressionClass
            : "Not evaluated",
      magneticShielding: magnetosphere.shieldingClass,
      dynamoSummary: classLabel(
        magnetosphere.dynamoContext?.dynamoPlausibilityClass,
        "Not evaluated",
      ),
      surfaceRadiation: radiation.surfaceClass,
      subsurfaceRadiation: radiation.subsurfaceClass,
      recession: formatRecession(tides.recessionCmYr),
      synchronousOrbit: formatSynchronousOrbitDistance(tides),
      synchronousOrbitContext: formatSynchronousOrbitContext(tides),
      orbitalFate: formatOrbitalFate(
        tides.dadtTotalMs,
        tides.timeToRocheGyr,
        tides.timeToEscapeGyr,
        tides.innerFateTargetLabel,
      ),
      moonLocked: tides.moonLockedToPlanet,
      planetLockedMoon: tides.planetLockedToMoon || "—",
      planetLockedStar: tides.planetLockedToStar,
      surfaceIces: stableIces.map((volatile) => volatile.species).join(", ") || "None",
      volatileAtmosphere: primaryAtmosphere
        ? primaryAtmosphere.pressurePa >= 1
          ? `${primaryAtmosphere.species} (~${fmt(primaryAtmosphere.pressurePa, 0)} Pa)`
          : `${primaryAtmosphere.species} (~${primaryAtmosphere.pressurePa.toExponential(1)} Pa)`
        : "None",
      nearestResonance: resonance.nearestResonance
        ? `${resonance.nearestResonance.label} with ${resonance.nearestResonance.withMoonName || resonance.nearestResonance.withMoonId || "sibling moon"} (${fmt(resonance.nearestResonance.offsetPct, 2)}% off)`
        : "None",
      laplaceStatus: resonance.laplaceStatus,
      forcedEccentricity:
        resonance.forcedEccentricity > 0
          ? `${fmt(resonance.forcedEccentricity, 4)} (${resonance.forcedEccentricitySource})`
          : "None",
      migrationTrend: formatMigrationTrendDisplay(resonance),
      tidalHabitableZone: resonance.tidalHabitableZone?.starHzEligible
        ? resonance.withinTidalHabitableZone
          ? "Inside tidal HZ"
          : `${fmt(resonance.tidalHabitableZone.innerKm, 0)}-${fmt(resonance.tidalHabitableZone.outerKm, 0)} km`
        : "Parent outside stellar HZ",
      formation: `${formation.scenarioLabel} (${fmt(formation.confidence, 2)})`,
      originPathway: formation.pathwayLabel || formation.scenarioLabel || "Auto / inferred",
      originConfidence: `${fmt(formation.confidence, 2)}`,
      originSource: formation.source === "user" ? "User selected" : "Auto / inferred",
      originWarnings: Array.isArray(formation.warningMessages)
        ? formation.warningMessages.join(" | ")
        : "",
      tMoonLock: `${fmt(tides.lockingTimesGyr.moonToPlanet, 6)} Gyr`,
      tPlanetMoon: `${fmt(tides.lockingTimesGyr.planetToMoon, 6)} Gyr`,
      tPlanetStar: `${fmt(tides.lockingTimesGyr.planetToStar, 6)} Gyr`,
    },
  };

  return attachMoonEraTimeline(result, {
    planetModel: result.planet,
    systemContext: { starAgeGyr: ageGyr, starMassMsol: mStarMsol },
  });
}

export const calcMoon = calcMoonExact;
