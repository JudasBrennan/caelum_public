import { computeStarXuvFluxRatioEarth } from "../star.js";
import {
  EARTH_PREBIOTIC_UV_200_280_ERG_CM2_S,
  SOLAR_WIND_RAM_PRESSURE_1AU_NPA,
  computeStellarEnvironmentModel,
} from "../stellarEnvironment.js";
import { clamp, toFinite } from "../utils.js";

const MODEL_VERSION = "environment-forcing-v1";

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nonNegativeOrNull(value) {
  const number = finiteOrNull(value);
  return number != null && number >= 0 ? number : null;
}

function positiveOrNull(value) {
  const number = finiteOrNull(value);
  return number != null && number > 0 ? number : null;
}

function firstFiniteNonNegative(...values) {
  for (const value of values) {
    const number = nonNegativeOrNull(value);
    if (number != null) return number;
  }
  return null;
}

function firstFinitePositive(...values) {
  for (const value of values) {
    const number = positiveOrNull(value);
    if (number != null) return number;
  }
  return null;
}

function resolvedStarConfig({ starModel, starConfig, hostFrameContext }) {
  const config = hostFrameContext?.starConfig || starConfig || {};
  const model = hostFrameContext?.starModel || starModel || {};
  const inputs = model.inputs || {};
  return {
    massMsol: toFinite(config.massMsol, toFinite(inputs.massMsol, toFinite(model.massMsol, 1))),
    ageGyr: toFinite(config.ageGyr, toFinite(inputs.ageGyr, toFinite(model.ageGyr, 4.6))),
    radiusRsol: toFinite(
      config.radiusRsolOverride,
      toFinite(config.radiusRsol, toFinite(model.radiusRsol, 1)),
    ),
    luminosityLsol: toFinite(
      config.luminosityLsolOverride,
      toFinite(config.luminosityLsol, toFinite(model.luminosityLsol, 1)),
    ),
    tempK: toFinite(config.tempKOverride, toFinite(config.tempK, toFinite(model.tempK, 5776))),
    evolutionMode: config.evolutionMode || model.evolutionMode || "zams",
  };
}

function fallbackStellarEnvironment({ starModel, starConfig, hostFrameContext }) {
  const modelEnvironment = (hostFrameContext?.starModel || starModel)?.stellarEnvironment;
  if (modelEnvironment) return modelEnvironment;
  const config = resolvedStarConfig({ starModel, starConfig, hostFrameContext });
  return computeStellarEnvironmentModel({
    massMsol: config.massMsol,
    ageGyr: config.ageGyr,
    radiusRsol: config.radiusRsol,
    luminosityLsol: config.luminosityLsol,
    tempK: config.tempK,
    evolutionMode: config.evolutionMode,
    hostRegime: "star",
  });
}

function resolveHostFrameMetadata({ hostFrameContext, hostFrame, hostFrameId }) {
  const frame = hostFrameContext?.hostFrame || hostFrame || null;
  return {
    hostFrameId: hostFrameContext?.hostFrameId || hostFrameId || frame?.id || null,
    hostFrameKind: frame?.frameKind || null,
    orbitFamilyKind: frame?.orbitFamilyKind || "single",
    hostStarCount:
      Array.isArray(hostFrameContext?.starContext?.starIds) &&
      hostFrameContext.starContext.starIds.length > 0
        ? hostFrameContext.starContext.starIds.length
        : frame?.frameKind === "pair"
          ? 2
          : 1,
    dominantContributorId:
      hostFrameContext?.dominantContributorId ||
      frame?.fluxModel?.dominantContributorId ||
      hostFrameContext?.starId ||
      null,
  };
}

function logHazardScore(value, lower, upper) {
  const number = Math.max(toFinite(value, 0), 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const lo = Math.log10(Math.max(lower, 1e-9));
  const hi = Math.log10(Math.max(upper, lower + 1e-9));
  return clamp((Math.log10(Math.max(number, 1e-9)) - lo) / Math.max(hi - lo, 1e-9), 0, 1);
}

function forcingConfidence({
  hasExplicitXuv,
  hasExplicitUv,
  hasWindEstimate,
  hasHostFrameContext,
}) {
  if (hasExplicitXuv && hasExplicitUv && hasWindEstimate && hasHostFrameContext) return "high";
  if ((hasExplicitXuv || hasExplicitUv) && hasWindEstimate) return "medium";
  if (hasExplicitXuv || hasExplicitUv || hasWindEstimate) return "medium";
  return "low";
}

function numberForDisplay(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unsupported";
  if (number === 0) return "0";
  if (Math.abs(number) < 0.01) return number.toExponential(2);
  return number.toFixed(digits).replace(/\.?0+$/, "");
}

export function formatEnvironmentForcingSummary(environmentForcing) {
  const forcing = environmentForcing || {};
  const flux = forcing.flux || {};
  const wind = forcing.wind || {};
  const parts = [
    `Bolometric ${numberForDisplay(flux.bolometricEarthAtOrbit, 3)}x Earth`,
    `XUV ${numberForDisplay(flux.xuvEarthAtOrbit, 2)}x`,
    `UV ${numberForDisplay(flux.prebioticUvEarthAtOrbit, 2)}x`,
  ];
  if (wind.ramPressureEarthRatio != null) {
    parts.push(`Wind ${numberForDisplay(wind.ramPressureEarthRatio, 2)}x`);
  } else {
    parts.push("Wind unsupported");
  }
  return parts.join(" | ");
}

export function buildEnvironmentForcing({
  bodyType = "planet",
  solverFamily = null,
  hostFrameContext = null,
  starModel = null,
  starConfig = null,
  orbitAu = 1,
  eccentricity = 0,
  activity = null,
  hostFrame = null,
  hostFrameId = null,
  hostXuvFluxEarthAt1Au = null,
  hostPrebioticUvEarthAt1Au = null,
  hostWindPressureEarthAt1Au = null,
  companionFluxEarth = 0,
  peakCompanionFluxEarth = null,
  minCompanionFluxEarth = null,
  companionXuvFluxEarth = 0,
  companionPrebioticUvEarth = 0,
  companionWindPressureEarth = 0,
  fluxVariabilityFraction = 0,
} = {}) {
  const config = resolvedStarConfig({ starModel, starConfig, hostFrameContext });
  const stellarEnvironment = fallbackStellarEnvironment({
    starModel,
    starConfig,
    hostFrameContext,
  });
  const frame = resolveHostFrameMetadata({ hostFrameContext, hostFrame, hostFrameId });
  const hasHostFrameContext = !!hostFrameContext;
  const orbit = Math.max(toFinite(orbitAu, 1), 0.01);
  const ecc = clamp(toFinite(eccentricity, 0), 0, 0.99);
  const semiMajorFactor = 1 / orbit ** 2;
  const meanInverseSquareFactor = semiMajorFactor / Math.sqrt(1 - ecc ** 2);
  const periapsisAu = orbit * (1 - ecc);
  const apoapsisAu = orbit * (1 + ecc);
  const periapsisFactor = 1 / Math.max(periapsisAu, 1e-9) ** 2;
  const apoapsisFactor = 1 / Math.max(apoapsisAu, 1e-9) ** 2;

  const ctx = hostFrameContext || {};
  const companionBolometricMean = Math.max(
    toFinite(ctx.companionFluxEarth, toFinite(companionFluxEarth, 0)),
    0,
  );
  const companionBolometricPeak = Math.max(
    toFinite(ctx.peakCompanionFluxEarth, toFinite(peakCompanionFluxEarth, companionBolometricMean)),
    0,
  );
  const companionBolometricMin = Math.max(
    toFinite(ctx.minCompanionFluxEarth, toFinite(minCompanionFluxEarth, companionBolometricMean)),
    0,
  );
  const companionXuvMean = Math.max(
    toFinite(ctx.companionXuvFluxEarth, toFinite(companionXuvFluxEarth, 0)),
    0,
  );
  const companionPrebioticUvMean = Math.max(
    toFinite(ctx.companionPrebioticUvEarth, toFinite(companionPrebioticUvEarth, 0)),
    0,
  );
  const companionWindMean = Math.max(
    toFinite(ctx.companionWindPressureEarth, toFinite(companionWindPressureEarth, 0)),
    0,
  );
  const variabilityFraction = Math.max(
    toFinite(ctx.fluxVariabilityFraction, toFinite(fluxVariabilityFraction, 0)),
    0,
  );

  const hostXuvAt1AuFallback = computeStarXuvFluxRatioEarth({
    massMsol: config.massMsol,
    ageGyr: config.ageGyr,
    luminosityLsol: config.luminosityLsol,
    orbitAu: 1,
  });
  const hostXuvAt1Au = firstFiniteNonNegative(
    ctx.hostXuvFluxEarthAt1Au,
    hostXuvFluxEarthAt1Au,
    hostFrameContext || hostXuvFluxEarthAt1Au != null ? null : hostXuvAt1AuFallback,
  );
  const hostPrebioticUvAt1Au = firstFiniteNonNegative(
    ctx.hostPrebioticUvEarthAt1Au,
    hostPrebioticUvEarthAt1Au,
    hostFrameContext || hostPrebioticUvEarthAt1Au != null
      ? null
      : stellarEnvironment?.uv?.bandsAt1Au?.prebiotic200280?.earthRatio,
  );
  const hostWindAt1Au = firstFinitePositive(
    ctx.hostWindPressureEarthAt1Au,
    hostWindPressureEarthAt1Au,
    hostFrameContext || hostWindPressureEarthAt1Au != null
      ? null
      : stellarEnvironment?.wind?.ramPressureEarthRatioAt1Au,
  );

  const resolvedHostXuvAt1Au = Math.max(toFinite(hostXuvAt1Au, 0), 0);
  const resolvedHostPrebioticUvAt1Au = Math.max(toFinite(hostPrebioticUvAt1Au, 0), 0);
  const hasWindEstimate = hostWindAt1Au != null || companionWindMean > 0;
  const resolvedHostWindAt1Au = Math.max(toFinite(hostWindAt1Au, 0), 0);

  const hostBolometricAtOrbit = Math.max(config.luminosityLsol, 0) * semiMajorFactor;
  const hostBolometricMean = Math.max(config.luminosityLsol, 0) * meanInverseSquareFactor;
  const hostBolometricPeriapsis = Math.max(config.luminosityLsol, 0) * periapsisFactor;
  const hostBolometricApoapsis = Math.max(config.luminosityLsol, 0) * apoapsisFactor;
  const hostXuvAtOrbit = resolvedHostXuvAt1Au * semiMajorFactor;
  const hostXuvMean = resolvedHostXuvAt1Au * meanInverseSquareFactor;
  const hostPrebioticUvAtOrbit = resolvedHostPrebioticUvAt1Au * semiMajorFactor;
  const hostPrebioticUvMean = resolvedHostPrebioticUvAt1Au * meanInverseSquareFactor;
  const hostWindAtOrbit = resolvedHostWindAt1Au * semiMajorFactor;
  const hostWindMean = resolvedHostWindAt1Au * meanInverseSquareFactor;

  const xuvAtOrbit = Math.max(hostXuvAtOrbit + companionXuvMean, 0);
  const xuvMean = Math.max(hostXuvMean + companionXuvMean, 0);
  const prebioticUvAtOrbit = Math.max(hostPrebioticUvAtOrbit + companionPrebioticUvMean, 0);
  const prebioticUvMean = Math.max(hostPrebioticUvMean + companionPrebioticUvMean, 0);
  const windAtOrbit = Math.max(hostWindAtOrbit + companionWindMean, 0);
  const windMean = Math.max(hostWindMean + companionWindMean, 0);
  const ramPressureNPa = hasWindEstimate ? windAtOrbit * SOLAR_WIND_RAM_PRESSURE_1AU_NPA : null;
  const hasExplicitXuv =
    nonNegativeOrNull(ctx.hostXuvFluxEarthAt1Au) != null ||
    nonNegativeOrNull(hostXuvFluxEarthAt1Au) != null;
  const hasExplicitUv =
    nonNegativeOrNull(ctx.hostPrebioticUvEarthAt1Au) != null ||
    nonNegativeOrNull(hostPrebioticUvEarthAt1Au) != null;

  const caveats = [];
  if (!hasWindEstimate) {
    caveats.push("Stellar wind is unsupported for this host and remains unavailable, not zero.");
  }
  if (companionBolometricMean > 0) {
    caveats.push("Companion flux is a host-frame mean contribution, not binary phase weather.");
  }
  if (ecc > 0) {
    caveats.push("Mean flux uses the inverse-square eccentric-orbit average.");
  }

  return {
    modelVersion: MODEL_VERSION,
    target: {
      bodyType,
      hostFrameId: frame.hostFrameId,
      orbitAu: orbit,
      eccentricity: ecc,
      solverFamily,
    },
    stellar: {
      dominantContributorId: frame.dominantContributorId,
      hostFrameKind: frame.hostFrameKind,
      orbitFamilyKind: frame.orbitFamilyKind,
      hostStarCount: frame.hostStarCount,
      starAgeGyr: config.ageGyr,
      starMassMsol: config.massMsol,
      starLuminosityLsol: config.luminosityLsol,
      starTeffK: config.tempK,
      rotationPeriodDays: stellarEnvironment?.rotation?.periodDays ?? null,
      rotationEquatorPeriodDays: stellarEnvironment?.rotation?.equatorPeriodDays ?? null,
      rotationPolePeriodDays: stellarEnvironment?.rotation?.polePeriodDays ?? null,
      rossbyNumber: stellarEnvironment?.rotation?.rossbyNumber ?? null,
      rotationConfidence: stellarEnvironment?.rotation?.confidence || "unsupported",
    },
    flux: {
      bolometricEarthAtOrbit: Math.max(hostBolometricAtOrbit + companionBolometricMean, 0),
      bolometricEarthMean: Math.max(hostBolometricMean + companionBolometricMean, 0),
      bolometricEarthPeriapsis: Math.max(hostBolometricPeriapsis + companionBolometricMean, 0),
      bolometricEarthApoapsis: Math.max(hostBolometricApoapsis + companionBolometricMean, 0),
      hostBolometricEarthAtOrbit: hostBolometricAtOrbit,
      hostBolometricEarthMean: hostBolometricMean,
      xuvEarthAtOrbit: xuvAtOrbit,
      xuvEarthMean: xuvMean,
      hostXuvEarthAt1Au: resolvedHostXuvAt1Au,
      hostXuvEarthAtOrbit: hostXuvAtOrbit,
      prebioticUvEarthAtOrbit: prebioticUvAtOrbit,
      prebioticUvEarthMean: prebioticUvMean,
      prebioticUvToaAtOrbitErgCm2S: prebioticUvAtOrbit * EARTH_PREBIOTIC_UV_200_280_ERG_CM2_S,
      prebioticUvToaErgCm2S: prebioticUvMean * EARTH_PREBIOTIC_UV_200_280_ERG_CM2_S,
      hostPrebioticUvEarthAt1Au: resolvedHostPrebioticUvAt1Au,
      hostPrebioticUvEarthAtOrbit: hostPrebioticUvAtOrbit,
      companionBolometricEarthMean: companionBolometricMean,
      companionBolometricEarthPeak: companionBolometricPeak,
      companionBolometricEarthMin: companionBolometricMin,
      companionXuvEarthMean: companionXuvMean,
      companionPrebioticUvEarthMean: companionPrebioticUvMean,
      variabilityFraction,
    },
    activity: {
      flareClass: activity?.flareClass || activity?.classification?.flareClass || "not-modeled",
      flareFrequencyRelative: toFinite(activity?.flareFrequencyRelative, null),
      cmeClass: activity?.cmeClass || "not-modeled",
      activityFactor: toFinite(activity?.activityFactor, null),
      confidence: activity?.confidence || "unsupported",
    },
    wind: {
      ramPressureNPa,
      ramPressureEarthRatio: hasWindEstimate ? windAtOrbit : null,
      ramPressureEarthMean: hasWindEstimate ? windMean : null,
      hostRamPressureEarthAt1Au: hostWindAt1Au,
      hostRamPressureEarthAtOrbit: hasWindEstimate ? hostWindAtOrbit : null,
      companionRamPressureEarth: companionWindMean,
      massLossSolar: finiteOrNull(stellarEnvironment?.wind?.massLossSolar),
      windSpeedKms: finiteOrNull(stellarEnvironment?.wind?.windSpeedKms),
      confidence: hasWindEstimate
        ? stellarEnvironment?.wind?.confidence || "medium"
        : "unsupported",
    },
    hazards: {
      xuvHazardScore: logHazardScore(xuvAtOrbit, 1, 100),
      uvOverexposureScore: logHazardScore(prebioticUvAtOrbit, 10, 1000),
      windCompressionScore: hasWindEstimate ? logHazardScore(windAtOrbit, 1, 100) : null,
      flareVariabilityScore: clamp(variabilityFraction * 2, 0, 1),
    },
    confidence: forcingConfidence({
      hasExplicitXuv,
      hasExplicitUv,
      hasWindEstimate,
      hasHostFrameContext,
    }),
    caveats,
    provenance: {
      hostFrameContextVersion:
        hostFrameContext?.modelVersion ||
        hostFrameContext?.hostFrame?.fluxModel?.modelVersion ||
        hostFrame?.fluxModel?.modelVersion ||
        null,
      stellarEnvironmentVersion: stellarEnvironment?.modelVersion || null,
      xuvModelVersion: (hostFrameContext?.starModel || starModel)?.xuvModel?.modelVersion || null,
      activityVersion: activity?.modelVersion || null,
    },
  };
}
