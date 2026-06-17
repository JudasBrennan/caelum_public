import {
  calcEquilibriumTemperatureAtDistanceK,
  calcInsolationEarthRatio,
} from "../physics/radiative.js";
import { clamp, round, toFinite } from "../utils.js";

const SIGMA = 5.670374419e-8;
const ZERO_ALBEDO_EQ_COEFF = 279;
const ICE_GIANT_MASS_MJUP = 0.15;
const DEFAULT_AGE_GYR = 4.6;

const TRANSPORT_MODES = new Set(["auto", "efficient", "layered", "suppressed"]);

function logistic(x) {
  return 1 / (1 + Math.exp(-x));
}

function finitePositive(value, fallback) {
  return Math.max(1e-9, toFinite(value, fallback));
}

function estimateFallbackDensityGcm3(massMjup, radiusRj) {
  const mass = clamp(toFinite(massMjup, 1), 0.01, 13);
  const radius = Number(radiusRj);
  if (Number.isFinite(radius) && radius > 0) {
    return clamp(1.3262 * (mass / radius ** 3), 0.05, 80);
  }
  if (mass < ICE_GIANT_MASS_MJUP) {
    return clamp(1.1 + 0.65 * (mass / ICE_GIANT_MASS_MJUP) ** 0.35, 0.9, 1.8);
  }
  if (mass < 0.5) return clamp(0.62 + 0.7 * mass, 0.45, 1.2);
  return clamp(1.05 + 0.18 * Math.log10(Math.max(mass, 1)), 0.8, 2.2);
}

function estimateFallbackEnrichmentSolar(massMjup) {
  const mass = clamp(toFinite(massMjup, 1), 0.01, 13);
  const logZ = 0.66 - 0.68 * Math.log10(mass);
  return clamp(10 ** logZ, 1, 200);
}

function normalizeTransportMode(mode) {
  const parsed = String(mode || "auto");
  return TRANSPORT_MODES.has(parsed) ? parsed : "auto";
}

export function calcGiantEquilibriumTemperatureK({
  starLuminosityLsol,
  orbitalDistanceAu,
  distanceAu,
  albedoBond = 0,
  extraFluxEarth = 0,
}) {
  const orbitAu = finitePositive(orbitalDistanceAu ?? distanceAu, 5.2);
  const hostInsolationEarth = calcInsolationEarthRatio({
    starLuminosityLsol: finitePositive(starLuminosityLsol, 1),
    orbitalDistanceAu: orbitAu,
  });
  const combinedInsolationEarth = Math.max(
    hostInsolationEarth + Math.max(toFinite(extraFluxEarth, 0), 0),
    0,
  );
  const effectiveLuminosityAtDistance = Math.max(combinedInsolationEarth * orbitAu ** 2, 1e-9);
  return calcEquilibriumTemperatureAtDistanceK({
    starLuminosityLsol: effectiveLuminosityAtDistance,
    albedoBond: clamp(toFinite(albedoBond, 0), 0, 0.95),
    orbitalDistanceAu: orbitAu,
    coefficientK: ZERO_ALBEDO_EQ_COEFF,
    luminosityExponent: 0.25,
  });
}

export function estimateGiantInteriorClass({
  massMjup,
  radiusRj,
  densityGcm3,
  metallicitySolar,
  heavyElementEnrichmentSolar,
} = {}) {
  const mass = clamp(toFinite(massMjup, 1), 0.01, 13);
  const density = clamp(
    toFinite(densityGcm3, estimateFallbackDensityGcm3(mass, radiusRj)),
    0.05,
    80,
  );
  const enrichment = clamp(
    toFinite(
      heavyElementEnrichmentSolar ?? metallicitySolar,
      estimateFallbackEnrichmentSolar(mass),
    ),
    0.1,
    200,
  );
  const isIceGiant = mass < ICE_GIANT_MASS_MJUP;
  const layeredConvectionLikelihood = isIceGiant
    ? clamp(1 - logistic((density - 1.44) / 0.085), 0.03, 0.97)
    : clamp((enrichment - 1) / 80, 0, 0.45);

  let interiorHeatClass;
  let envelopeClass;
  if (isIceGiant) {
    envelopeClass = "ice-rich H/He envelope";
    if (layeredConvectionLikelihood > 0.65) {
      interiorHeatClass = "layered ice giant";
    } else if (density >= 1.5) {
      interiorHeatClass = "efficient ice giant";
    } else {
      interiorHeatClass = "mixed ice giant";
    }
  } else {
    envelopeClass = "H/He giant envelope";
    if (mass >= 2.5) {
      interiorHeatClass = "massive cooling giant";
    } else if (density < 0.8) {
      interiorHeatClass = "low-density gas giant";
    } else {
      interiorHeatClass = "metallic-H gas giant";
    }
  }

  return {
    isIceGiant,
    envelopeClass,
    interiorHeatClass,
    densityGcm3: density,
    heavyElementEnrichmentSolar: enrichment,
    layeredConvectionLikelihood,
  };
}

export function estimateHeatTransportEfficiency({
  massMjup,
  radiusRj,
  densityGcm3,
  ageGyr,
  metallicitySolar,
  heavyElementEnrichmentSolar,
  insolationEarth = 0,
  interiorHeatTransportMode = "auto",
  interiorClass = null,
} = {}) {
  const mass = clamp(toFinite(massMjup, 1), 0.01, 13);
  const age = clamp(toFinite(ageGyr, DEFAULT_AGE_GYR), 0.03, 20);
  const insolation = Math.max(toFinite(insolationEarth, 0), 0);
  const mode = normalizeTransportMode(interiorHeatTransportMode);
  const interior =
    interiorClass ||
    estimateGiantInteriorClass({
      massMjup: mass,
      radiusRj,
      densityGcm3,
      metallicitySolar,
      heavyElementEnrichmentSolar,
    });
  const density = interior.densityGcm3;
  const enrichment = interior.heavyElementEnrichmentSolar;
  const irradiationSuppression = clamp((1 + insolation / 200) ** -0.15, 0.6, 1);
  const ageMixingTerm = clamp((DEFAULT_AGE_GYR / age) ** 0.03, 0.92, 1.08);

  if (mode !== "auto") {
    const modeEfficiency = {
      efficient: 1.12,
      layered: 0.42,
      suppressed: 0.15,
    }[mode];
    return {
      heatTransportEfficiency: round(
        clamp(modeEfficiency * irradiationSuppression * ageMixingTerm, 0.05, 1.35),
        3,
      ),
      transportMode: mode,
      transportClass: mode,
      layeredConvectionLikelihood: interior.layeredConvectionLikelihood,
      irradiationSuppression: round(irradiationSuppression, 3),
      caveats: ["Manual heat-transport mode overrides auto inference."],
    };
  }

  let efficiency;
  let transportClass;
  if (interior.isIceGiant) {
    const densityGate = logistic((density - 1.44) / 0.085);
    const massGate = clamp((mass / 0.054) ** 0.18, 0.85, 1.12);
    const enrichmentDrag = clamp((30 / enrichment) ** 0.05, 0.82, 1.08);
    efficiency =
      (0.12 + 0.95 * densityGate) *
      massGate *
      enrichmentDrag *
      irradiationSuppression *
      ageMixingTerm;
    transportClass = densityGate > 0.72 ? "efficient" : densityGate < 0.28 ? "layered" : "mixed";
  } else {
    const densityTerm = clamp((density / 1.326) ** 0.16, 0.78, 1.18);
    const massTerm = clamp(mass ** 0.04, 0.85, 1.2);
    const enrichmentDrag = clamp((1 / enrichment) ** 0.03, 0.88, 1.08);
    efficiency =
      0.98 * densityTerm * massTerm * enrichmentDrag * irradiationSuppression * ageMixingTerm;
    transportClass = density < 0.8 ? "diffuse-envelope" : "convective";
  }

  const caveats = [];
  if (interior.isIceGiant) {
    caveats.push("Ice-giant intrinsic heat is sensitive to compositional layering.");
  }
  if (insolation > 100) {
    caveats.push("Strong irradiation makes effective temperature dominated by absorbed starlight.");
  }
  if (interior.layeredConvectionLikelihood > 0.65) {
    caveats.push("Layered convection likely suppresses long-term heat loss.");
  }

  return {
    heatTransportEfficiency: round(clamp(efficiency, 0.05, 1.35), 3),
    transportMode: "auto",
    transportClass,
    layeredConvectionLikelihood: interior.layeredConvectionLikelihood,
    irradiationSuppression: round(irradiationSuppression, 3),
    caveats,
  };
}

export function calcIntrinsicTemperatureK({
  massMjup,
  radiusRj,
  densityGcm3,
  ageGyr,
  metallicitySolar,
  heavyElementEnrichmentSolar,
  insolationEarth = 0,
  interiorHeatTransportMode = "auto",
  interiorClass = null,
  heatTransport = null,
} = {}) {
  const mass = clamp(toFinite(massMjup, 1), 0.01, 13);
  const age = clamp(toFinite(ageGyr, DEFAULT_AGE_GYR), 0.03, 20);
  const interior =
    interiorClass ||
    estimateGiantInteriorClass({
      massMjup: mass,
      radiusRj,
      densityGcm3,
      metallicitySolar,
      heavyElementEnrichmentSolar,
    });
  const transport =
    heatTransport ||
    estimateHeatTransportEfficiency({
      massMjup: mass,
      radiusRj,
      densityGcm3: interior.densityGcm3,
      ageGyr: age,
      metallicitySolar,
      heavyElementEnrichmentSolar,
      insolationEarth,
      interiorHeatTransportMode,
      interiorClass: interior,
    });
  const efficiency = Math.max(transport.heatTransportEfficiency, 0.01);

  if (interior.isIceGiant) {
    const baseTintK =
      69 *
      (mass / 0.054) ** 0.16 *
      (interior.densityGcm3 / 1.638) ** 1.4 *
      (DEFAULT_AGE_GYR / age) ** 0.1;
    return clamp(baseTintK * efficiency ** 0.25, 2, 180);
  }

  const densityTerm = clamp((interior.densityGcm3 / 1.326) ** 0.16, 0.78, 1.18);
  const massTerm = clamp(mass ** 0.04, 0.85, 1.2);
  const ageTerm = clamp((DEFAULT_AGE_GYR / age) ** 0.18, 0.65, 1.85);
  const baseTintK = 98 * massTerm * densityTerm * ageTerm;
  return clamp(baseTintK * efficiency ** 0.25, 5, 650);
}

export function calcEffectiveTemperatureFromIntrinsicHeat({
  equilibriumTempK,
  intrinsicTempK,
} = {}) {
  const teq = Math.max(toFinite(equilibriumTempK, 0), 0);
  const tint = Math.max(toFinite(intrinsicTempK, 0), 0);
  return (teq ** 4 + tint ** 4) ** 0.25;
}

export function calcGiantIntrinsicHeatDiagnostics({
  massMjup,
  radiusRj,
  densityGcm3,
  ageGyr,
  metallicitySolar,
  heavyElementEnrichmentSolar,
  equilibriumTempK,
  insolationEarth = 0,
  interiorHeatTransportMode = "auto",
} = {}) {
  const interiorClass = estimateGiantInteriorClass({
    massMjup,
    radiusRj,
    densityGcm3,
    metallicitySolar,
    heavyElementEnrichmentSolar,
  });
  const heatTransport = estimateHeatTransportEfficiency({
    massMjup,
    radiusRj,
    densityGcm3: interiorClass.densityGcm3,
    ageGyr,
    metallicitySolar,
    heavyElementEnrichmentSolar,
    insolationEarth,
    interiorHeatTransportMode,
    interiorClass,
  });
  const intrinsicTempK = calcIntrinsicTemperatureK({
    massMjup,
    radiusRj,
    densityGcm3: interiorClass.densityGcm3,
    ageGyr,
    metallicitySolar,
    heavyElementEnrichmentSolar,
    insolationEarth,
    interiorHeatTransportMode,
    interiorClass,
    heatTransport,
  });
  const effectiveTempK = calcEffectiveTemperatureFromIntrinsicHeat({
    equilibriumTempK,
    intrinsicTempK,
  });
  const internalFluxWm2 = SIGMA * intrinsicTempK ** 4;
  const equilibriumFluxWm2 = SIGMA * Math.max(toFinite(equilibriumTempK, 0), 0) ** 4;
  const fluxRatio =
    equilibriumFluxWm2 > 0 ? internalFluxWm2 / equilibriumFluxWm2 : Number.POSITIVE_INFINITY;
  const caveats = [...heatTransport.caveats];
  const confidence =
    heatTransport.transportMode !== "auto"
      ? "manual"
      : interiorClass.isIceGiant
        ? interiorClass.layeredConvectionLikelihood > 0.65
          ? "low"
          : "medium"
        : "medium-high";

  return {
    modelVersion: "giant-intrinsic-heat-v1",
    equilibriumTempK: round(equilibriumTempK, 2),
    intrinsicTempK: round(intrinsicTempK, 2),
    effectiveTempK: round(effectiveTempK, 2),
    internalFluxWm2: round(internalFluxWm2, 5),
    equilibriumFluxWm2: round(equilibriumFluxWm2, 5),
    internalToEquilibriumFluxRatio: round(fluxRatio, 5),
    heatTransportEfficiency: heatTransport.heatTransportEfficiency,
    transportMode: heatTransport.transportMode,
    transportClass: heatTransport.transportClass,
    irradiationSuppression: heatTransport.irradiationSuppression,
    interiorHeatClass: interiorClass.interiorHeatClass,
    envelopeClass: interiorClass.envelopeClass,
    densityGcm3: round(interiorClass.densityGcm3, 4),
    heavyElementEnrichmentSolar: round(interiorClass.heavyElementEnrichmentSolar, 2),
    layeredConvectionLikelihood: round(interiorClass.layeredConvectionLikelihood, 3),
    confidence,
    caveats,
  };
}
