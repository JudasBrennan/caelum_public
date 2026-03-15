import { clamp, fmt, round, toFinite } from "../utils.js";

const JUPITER_RADIUS_KM = 69911;
const EARTH_RADIUS_KM = 6371;
const EARTH_MASS_PER_MJUP = 317.83;
const RJ_PER_RE = JUPITER_RADIUS_KM / EARTH_RADIUS_KM;
const ICE_GIANT_MASS_MJUP = 0.15;

const C_N = 0.861;
const EXP_N = 0.53;
const BOUNDARY_ME = 131.6;
const EXP_J = -0.044;
const C_J_RAW = C_N * BOUNDARY_ME ** EXP_N * BOUNDARY_ME ** -EXP_J;

const SOLAR_CH4_PCT = 0.075;
const SOLAR_NH3_PCT = 0.008;
const SOLAR_H2O_PCT = 0.025;
const SOLAR_CO_PCT = 0.05;
const HOT_JUPITER_INFLATION_THRESHOLD_ERG_S_CM2 = 2e8;
const W_M2_TO_ERG_S_CM2 = 1e3;
const MAX_HOT_JUPITER_FRACTIONAL_INFLATION = 0.5;
const MAX_INFLATED_RADIUS_RJ = 2.2;

function massToRadiusEarth(massEarth) {
  const mass = Math.max(1, massEarth);
  if (mass < BOUNDARY_ME) return C_N * mass ** EXP_N;
  return C_J_RAW * mass ** EXP_J;
}

function radiusToMassEarth(radiusEarth) {
  const radius = Math.max(0.5, radiusEarth);
  const mNept = (radius / C_N) ** (1 / EXP_N);
  if (mNept < BOUNDARY_ME) return mNept;
  return EARTH_MASS_PER_MJUP;
}

export function massToRadiusRj(massMjup) {
  const massEarth = toFinite(massMjup, 1) * EARTH_MASS_PER_MJUP;
  const radiusEarth = massToRadiusEarth(massEarth);
  return radiusEarth / RJ_PER_RE;
}

export function radiusToMassMjup(radiusRj) {
  const radiusEarth = toFinite(radiusRj, 1) * RJ_PER_RE;
  const massEarth = radiusToMassEarth(radiusEarth);
  return massEarth / EARTH_MASS_PER_MJUP;
}

export function estimateMetallicity(massMjup) {
  const mass = clamp(toFinite(massMjup, 1), 0.01, 13);
  const logZ = 0.66 - 0.68 * Math.log10(mass);
  return clamp(round(10 ** logZ, 1), 1, 200);
}

export function stellarMetallicityScaleFromFeH(feH) {
  const dex = clamp(toFinite(feH, 0), -3, 1);
  return 10 ** dex;
}

export function getAtmosphere(massMjup, teqK, metallicity) {
  const z = clamp(metallicity, 0.1, 200);
  const isIceGiant = massMjup < ICE_GIANT_MASS_MJUP;
  const isHot = teqK > 1000;

  const baseH2 = isIceGiant ? 80 : isHot ? 85 : 86;
  const baseHe = isIceGiant ? 18 : 14;

  const ch4 = isHot ? 0 : Math.min(SOLAR_CH4_PCT * z, 8);
  const nh3 = Math.min(SOLAR_NH3_PCT * z, 2);
  const h2o = isHot ? Math.min(SOLAR_H2O_PCT * z * 0.3, 1) : Math.min(SOLAR_H2O_PCT * z, 3);
  const co = isHot ? Math.min(SOLAR_CO_PCT * z, 5) : 0;

  const totalMetals = ch4 + nh3 + h2o + co;
  const scaleFactor = (100 - totalMetals) / (baseH2 + baseHe);
  const h2 = baseH2 * scaleFactor;
  const he = baseHe * scaleFactor;

  const traces = [
    { name: "CH\u2084", pct: ch4 },
    { name: "CO", pct: co },
    { name: "H\u2082O", pct: h2o },
    { name: "NH\u2083", pct: nh3 },
  ];
  const best = traces.reduce((left, right) => (left.pct >= right.pct ? left : right));
  const dominantTrace = best.pct > 0 ? best.name : "CH\u2084";

  return {
    h2Pct: round(h2, 1),
    hePct: round(he, 1),
    ch4Pct: round(ch4, 2),
    nh3Pct: round(nh3, 3),
    h2oPct: round(h2o, 3),
    coPct: round(co, 2),
    dominantTrace,
    metallicitySolar: round(z, 1),
  };
}

export function calcInterior(massMjup) {
  const totalHeavy = 49.3 * massMjup ** 0.61;
  const coreMass = Math.min(totalHeavy * 0.5, 25);
  const totalMassEarth = massMjup * EARTH_MASS_PER_MJUP;
  const bulkZ = clamp(totalHeavy / totalMassEarth, 0, 1);
  return {
    totalHeavyElementsMearth: round(totalHeavy, 1),
    estimatedCoreMassMearth: round(coreMass, 1),
    bulkMetallicityFraction: round(bulkZ, 4),
  };
}

export function calcHotJupiterInflation(incidentFluxWm2) {
  const incidentFluxErgCm2S = Math.max(0, toFinite(incidentFluxWm2, 0)) * W_M2_TO_ERG_S_CM2;
  if (incidentFluxErgCm2S <= HOT_JUPITER_INFLATION_THRESHOLD_ERG_S_CM2) {
    return {
      active: false,
      incidentFluxErgCm2S: round(incidentFluxErgCm2S, 0),
      fractionalInflation: 0,
      capped: false,
    };
  }
  const rawFractionalInflation =
    0.3 * Math.log10(incidentFluxErgCm2S / HOT_JUPITER_INFLATION_THRESHOLD_ERG_S_CM2);
  const fractionalInflation = clamp(
    rawFractionalInflation,
    0,
    MAX_HOT_JUPITER_FRACTIONAL_INFLATION,
  );
  return {
    active: fractionalInflation > 0,
    incidentFluxErgCm2S: round(incidentFluxErgCm2S, 0),
    fractionalInflation: round(fractionalInflation, 4),
    capped: rawFractionalInflation > MAX_HOT_JUPITER_FRACTIONAL_INFLATION,
  };
}

export function calcAgeRadiusCorrection(massMjup, radiusRj, starAgeGyr, teqK, incidentFluxWm2 = 0) {
  const age = Math.max(0.1, starAgeGyr);
  const inflationFactor = 1 + 0.1 * (5 / age) ** 0.35;
  const baseRj = massToRadiusRj(massMjup);
  const ageAdjustedRadiusRj = baseRj * inflationFactor;
  const hotJupiterInflation = calcHotJupiterInflation(incidentFluxWm2);
  const irradiationAdjustedRadiusRj =
    ageAdjustedRadiusRj * (1 + hotJupiterInflation.fractionalInflation);
  const suggestedRj = round(Math.min(irradiationAdjustedRadiusRj, MAX_INFLATED_RADIUS_RJ), 3);
  const proximityBonus = Math.max(0, suggestedRj - ageAdjustedRadiusRj);
  const deviation = radiusRj - suggestedRj;
  const fluxNote = hotJupiterInflation.active
    ? ` with hot-Jupiter irradiation (+${fmt(hotJupiterInflation.fractionalInflation * 100, 0)}%)`
    : "";
  let note;
  if (Math.abs(deviation) < 0.05) {
    note = `Radius consistent with ${fmt(age, 1)} Gyr cooling${fluxNote}`;
  } else if (deviation > 0) {
    note = `Radius ${fmt(deviation, 2)} Rj larger than expected at ${fmt(age, 1)} Gyr` + fluxNote;
  } else {
    note =
      `Radius ${fmt(Math.abs(deviation), 2)} Rj smaller than expected at ${fmt(age, 1)} Gyr` +
      fluxNote;
  }
  if (hotJupiterInflation.capped) {
    note += `; capped at ${fmt(MAX_INFLATED_RADIUS_RJ, 1)} Rj`;
  }
  return {
    suggestedRadiusRj: suggestedRj,
    radiusInflationFactor: round(inflationFactor, 3),
    proximityInflationRj: round(proximityBonus, 3),
    irradiationInflationFraction: hotJupiterInflation.fractionalInflation,
    hotJupiterInflationActive: hotJupiterInflation.active,
    hotJupiterInflationCapped: hotJupiterInflation.capped,
    incidentFluxWm2: round(Math.max(0, toFinite(incidentFluxWm2, 0)), 1),
    incidentFluxErgCm2S: hotJupiterInflation.incidentFluxErgCm2S,
    radiusAgeNote: note,
  };
}
