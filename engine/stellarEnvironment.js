import { blackbodyBandFraction } from "./physics/radiative.js";
import { SOLAR_CONSTANT_W_M2, SOLAR_RADIUS_KM } from "./physics/constants.js";
import { clamp, toFinite } from "./utils.js";

const SOLAR_TEFF_K = 5772;
const SOLAR_UV_REFERENCE_TEFF_K = 5778;
const SOLAR_CONSTANT_WM2 = SOLAR_CONSTANT_W_M2;
const W_M2_TO_ERG_CM2_S = 1000;
const SOLAR_BV = 0.65;
const SOLAR_ROTATION_DAYS = 25.38;
export const SOLAR_WIND_MASS_LOSS_MSOL_PER_YR = 2e-14;
export const SOLAR_WIND_SPEED_KMS = 400;
export const SOLAR_WIND_RAM_PRESSURE_1AU_NPA = 2.0;
export const EARTH_PREBIOTIC_UV_200_280_ERG_CM2_S =
  SOLAR_CONSTANT_WM2 *
  blackbodyBandFraction({
    teffK: SOLAR_UV_REFERENCE_TEFF_K,
    wavelengthMinNm: 200,
    wavelengthMaxNm: 280,
  }) *
  W_M2_TO_ERG_CM2_S;
const GYRO_COLOR_C = 0.4;
const GYRO_COLOR_B = 0.31;
const GYRO_AGE_N = 0.55;
const B_V_MIN = 0.3;
const B_V_MAX = 1.9;
const TURNOVER_BV_MIN = 0.4;
const TURNOVER_BV_MAX = 1.6;
const HYDROGEN_BURNING_MIN_MSOL = 0.075;
const ACTIVE_LATITUDE_DEG = 30;
const DIFFERENTIAL_ROTATION_COEFFS = Object.freeze([
  { weight: 0.1819, bias: -3.573, tempWeight: 5.075e-4, periodWeight: -3.118e-2 },
  { weight: 0.1063, bias: 2.532, tempWeight: -3.968e-4, periodWeight: 0.1139 },
  { weight: 0.6062, bias: -32.78, tempWeight: 5.139e-3, periodWeight: -0.231 },
  { weight: 0.1858, bias: -18.55, tempWeight: 2.993e-3, periodWeight: -5.674e-2 },
  { weight: 0.4596, bias: 17.9, tempWeight: -2.831e-3, periodWeight: 0.4013 },
  { weight: -0.1293, bias: 0.6043, tempWeight: -1.25e-4, periodWeight: 1.206e-3 },
]);

const SOLAR_GYRO_A =
  SOLAR_ROTATION_DAYS / ((SOLAR_BV - GYRO_COLOR_C) ** GYRO_COLOR_B * 4570 ** GYRO_AGE_N);

function ballesterosTempFromBv(bv) {
  return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
}

function confidenceLabel(confidence) {
  if (!confidence) return "unsupported";
  return String(confidence).toLowerCase();
}

function unsupportedRotation(reason) {
  return {
    periodDays: null,
    equatorPeriodDays: null,
    polePeriodDays: null,
    periodRangeDays: null,
    differentialRotation: {
      supported: false,
      law: "unsupported",
      referenceLatitudeDeg: null,
      deltaOmegaRadPerDay: null,
      relativeShear: null,
      equatorPeriodDays: null,
      polePeriodDays: null,
      periodRangeDays: null,
      notes: [reason],
    },
    equatorialVelocityKms: null,
    rossbyNumber: null,
    convectiveTurnoverDays: null,
    gyroAgeGyr: null,
    gyroAgeErrorFraction: null,
    confidence: "unsupported",
    regime: "unsupported",
    bv: null,
    bvClamped: false,
    notes: [reason],
  };
}

function unsupportedWind(reason) {
  return {
    supported: false,
    confidence: "unsupported",
    massLossSolar: null,
    massLossMsolPerYr: null,
    windSpeedKms: null,
    ramPressureAt1AuNPa: null,
    ramPressureEarthRatioAt1Au: null,
    rotationOmegaRatio: null,
    regime: "unsupported",
    notes: [reason],
  };
}

function formatUvBand({ teffK, luminosityLsol, wavelengthMinNm, wavelengthMaxNm }) {
  const fraction = blackbodyBandFraction({
    teffK,
    wavelengthMinNm,
    wavelengthMaxNm,
  });
  const referenceFraction = blackbodyBandFraction({
    teffK: SOLAR_UV_REFERENCE_TEFF_K,
    wavelengthMinNm,
    wavelengthMaxNm,
  });
  const fluxWm2 = SOLAR_CONSTANT_WM2 * luminosityLsol * fraction;
  const referenceFluxWm2 = SOLAR_CONSTANT_WM2 * referenceFraction;
  return {
    wavelengthMinNm,
    wavelengthMaxNm,
    fluxWm2,
    fluxErgCm2S: fluxWm2 * W_M2_TO_ERG_CM2_S,
    bolometricFraction: fraction,
    earthRatio: referenceFluxWm2 > 0 ? fluxWm2 / referenceFluxWm2 : null,
  };
}

function classifyUvConfidence({ tempK, hostRegime }) {
  if (hostRegime === "brownDwarf") return "low";
  if (tempK >= 5000 && tempK <= 6500) return "high";
  if (tempK >= 3900 && tempK <= 7500) return "medium";
  return "low";
}

function isMainSequenceLike(evolutionMode) {
  return !evolutionMode || evolutionMode === "mainSequence" || evolutionMode === "zams";
}

function classifyRotationConfidence({ massMsol, ageGyr, bv, evolutionMode }) {
  if (!isMainSequenceLike(evolutionMode)) {
    return "low";
  }

  if (
    massMsol >= 0.55 &&
    massMsol <= 1.3 &&
    ageGyr >= 0.1 &&
    ageGyr <= 10 &&
    bv >= 0.5 &&
    bv <= 0.9
  ) {
    return "high";
  }

  if (massMsol >= 0.2 && massMsol < 0.55 && ageGyr >= 0.5 && bv > 0.9 && bv <= 1.6) {
    return "medium";
  }

  return "low";
}

function classifyRotationRegime({ confidence, massMsol, bv }) {
  if (confidence === "high") return "calibrated-fgk";
  if (massMsol < 0.55 || bv > 0.9) return "cool-dwarf-extrapolated";
  if (massMsol > 1.3 || bv < 0.5) return "hot-star-extrapolated";
  return "extrapolated";
}

function rotationNotes({ confidence, massMsol, bvClamped, hostRegime, evolutionMode }) {
  const notes = [];

  if (!isMainSequenceLike(evolutionMode)) {
    notes.push(
      "Evolved-star rotation is extrapolated; gyrochronology is calibrated for main-sequence spin-down.",
    );
  } else if (confidence === "high") {
    notes.push("Gyrochronology is calibrated for a solar-like main-sequence star.");
  } else if (massMsol < 0.55) {
    notes.push(
      "M-dwarf spin-down is uncertain; magnetic braking can remain slow or saturated for long intervals.",
    );
  } else {
    notes.push("Rotation is extrapolated outside the strongest gyrochronology calibration range.");
  }

  if (bvClamped) {
    notes.push("Temperature-to-colour estimate was clamped to the model range.");
  }

  if (hostRegime && hostRegime !== "star") {
    notes.push(`Host regime '${hostRegime}' is outside normal stellar calibration.`);
  }

  return notes;
}

export function estimateBvFromTeffK(teffK) {
  const tempK = toFinite(teffK, SOLAR_TEFF_K);
  const hotEdgeK = ballesterosTempFromBv(B_V_MIN);
  const coolEdgeK = ballesterosTempFromBv(B_V_MAX);

  if (tempK >= hotEdgeK) {
    return { bv: B_V_MIN, bvClamped: true, tempK };
  }

  if (tempK <= coolEdgeK) {
    return { bv: B_V_MAX, bvClamped: true, tempK };
  }

  let lowerBv = B_V_MIN;
  let upperBv = B_V_MAX;

  for (let index = 0; index < 40; index += 1) {
    const midBv = (lowerBv + upperBv) / 2;
    if (ballesterosTempFromBv(midBv) > tempK) {
      lowerBv = midBv;
    } else {
      upperBv = midBv;
    }
  }

  return {
    bv: (lowerBv + upperBv) / 2,
    bvClamped: false,
    tempK,
  };
}

export function computeConvectiveTurnoverDays({ bv } = {}) {
  const resolvedBv = clamp(toFinite(bv, SOLAR_BV), TURNOVER_BV_MIN, TURNOVER_BV_MAX);
  const x = 1 - resolvedBv;
  const logTurnoverDays = 1.362 - 0.166 * x + 0.025 * x * x - 5.323 * x * x * x;

  return 10 ** logTurnoverDays;
}

export function computeSurfaceDifferentialRotationModel({
  massMsol,
  periodDays,
  tempK,
  bv,
  evolutionMode = "mainSequence",
  referenceLatitudeDeg = ACTIVE_LATITUDE_DEG,
} = {}) {
  const mass = toFinite(massMsol, NaN);
  const referencePeriodDays = toFinite(periodDays, NaN);
  const temperature = toFinite(tempK, SOLAR_TEFF_K);
  const color = toFinite(bv, SOLAR_BV);

  if (
    !Number.isFinite(referencePeriodDays) ||
    referencePeriodDays <= 0 ||
    !Number.isFinite(temperature) ||
    temperature <= 0
  ) {
    return {
      supported: false,
      law: "unsupported",
      referenceLatitudeDeg: null,
      deltaOmegaRadPerDay: null,
      relativeShear: null,
      equatorPeriodDays: null,
      polePeriodDays: null,
      periodRangeDays: null,
      notes: ["Differential rotation requires finite positive period and temperature inputs."],
    };
  }

  const referenceLatitudeRad = (clamp(referenceLatitudeDeg, 0, 75) * Math.PI) / 180;
  const sin2ReferenceLatitude = Math.sin(referenceLatitudeRad) ** 2;
  const rawDeltaOmegaRadPerDay =
    0.4521 +
    DIFFERENTIAL_ROTATION_COEFFS.reduce(
      (sum, coefficient) =>
        sum +
        coefficient.weight *
          Math.tanh(
            coefficient.bias +
              coefficient.tempWeight * temperature +
              coefficient.periodWeight * referencePeriodDays,
          ),
      0,
    );
  const omegaReferenceRadPerDay = (2 * Math.PI) / referencePeriodDays;
  const maxDeltaOmegaRadPerDay =
    (0.85 * omegaReferenceRadPerDay) / Math.max(0.1, 1 - sin2ReferenceLatitude);
  const deltaOmegaRadPerDay = clamp(rawDeltaOmegaRadPerDay, 0, maxDeltaOmegaRadPerDay);
  const omegaEquatorRadPerDay =
    omegaReferenceRadPerDay + deltaOmegaRadPerDay * sin2ReferenceLatitude;
  const omegaPoleRadPerDay = omegaEquatorRadPerDay - deltaOmegaRadPerDay;
  const equatorPeriodDays = (2 * Math.PI) / omegaEquatorRadPerDay;
  const polePeriodDays = (2 * Math.PI) / omegaPoleRadPerDay;
  const relativeShear = deltaOmegaRadPerDay / omegaEquatorRadPerDay;
  const maxCalibratedPeriodDays = Math.max(1, 109 * color - 43);
  const calibrated =
    isMainSequenceLike(evolutionMode) &&
    mass >= 0.5 &&
    mass <= 1.3 &&
    referencePeriodDays <= maxCalibratedPeriodDays * 1.05;
  const notes = [
    "Representative period is interpreted near the active-latitude spot band, not as solid-body rotation.",
  ];

  if (!calibrated) {
    notes.push(
      "Surface shear is extrapolated outside the main-sequence-dwarf differential-rotation calibration.",
    );
  }

  if (deltaOmegaRadPerDay !== rawDeltaOmegaRadPerDay) {
    notes.push("Surface shear was clamped to keep polar rotation finite.");
  }

  return {
    supported: calibrated,
    law: calibrated
      ? "solar-like sin2 latitude differential rotation"
      : "extrapolated solar-like sin2 latitude differential rotation",
    referenceLatitudeDeg: (referenceLatitudeRad * 180) / Math.PI,
    deltaOmegaRadPerDay,
    rawDeltaOmegaRadPerDay,
    relativeShear,
    equatorPeriodDays,
    polePeriodDays,
    periodRangeDays: {
      min: Math.min(equatorPeriodDays, polePeriodDays),
      max: Math.max(equatorPeriodDays, polePeriodDays),
    },
    maxCalibratedPeriodDays,
    notes,
  };
}

export function computeStellarWindModel({
  massMsol,
  radiusRsol,
  rotationPeriodDays,
  rossbyNumber,
  ageGyr,
  hostRegime = "star",
} = {}) {
  const mass = toFinite(massMsol, NaN);
  const radius = toFinite(radiusRsol, NaN);
  const period = toFinite(rotationPeriodDays, NaN);
  const rossby = toFinite(rossbyNumber, NaN);
  const age = toFinite(ageGyr, NaN);

  if (hostRegime === "brownDwarf" || mass < HYDROGEN_BURNING_MIN_MSOL) {
    return unsupportedWind("Brown dwarfs are outside the stellar wind scaling used here.");
  }

  if (!Number.isFinite(mass) || mass <= 0 || !Number.isFinite(radius) || radius <= 0) {
    return unsupportedWind("Wind requires finite positive stellar mass and radius inputs.");
  }

  if (!Number.isFinite(period) || period <= 0) {
    return unsupportedWind("Wind requires a finite positive rotation period.");
  }

  const omegaRatio = SOLAR_ROTATION_DAYS / period;
  let massLossSolar =
    radius ** 2 * clamp(omegaRatio, 0.05, 20) ** 1.33 * clamp(mass, 0.2, 1.5) ** -3.36;
  massLossSolar = clamp(massLossSolar, 0.02, 100);
  const escapeSpeedRatio = Math.sqrt(mass / radius);
  const windSpeedKms = clamp(SOLAR_WIND_SPEED_KMS * escapeSpeedRatio ** 0.5, 250, 1200);
  const ramPressureAt1AuNPa =
    SOLAR_WIND_RAM_PRESSURE_1AU_NPA * massLossSolar * (windSpeedKms / SOLAR_WIND_SPEED_KMS);
  const ramPressureEarthRatioAt1Au = ramPressureAt1AuNPa / SOLAR_WIND_RAM_PRESSURE_1AU_NPA;
  const saturated = Number.isFinite(rossby) && rossby > 0 && rossby <= 0.13;
  const confidence =
    mass >= 0.4 && mass <= 1.1 && !saturated
      ? "high"
      : (mass >= 0.2 && mass < 0.4) || (mass > 1.1 && mass <= 1.5)
        ? "medium"
        : "low";
  const notes = [];

  if (confidence === "high") {
    notes.push("Cool-star wind scaling is within the strongest calibrated mass range.");
  } else {
    notes.push("Wind scaling is extrapolated outside the strongest cool-star calibration range.");
  }

  if (saturated) {
    notes.push("Low Rossby number indicates saturated activity; wind output is capped.");
  }

  if (Number.isFinite(age) && age < 0.1) {
    notes.push("Very young stellar winds are highly uncertain in this lightweight model.");
  }

  return {
    supported: true,
    confidence,
    massLossSolar,
    massLossMsolPerYr: massLossSolar * SOLAR_WIND_MASS_LOSS_MSOL_PER_YR,
    windSpeedKms,
    ramPressureAt1AuNPa,
    ramPressureEarthRatioAt1Au,
    rotationOmegaRatio: omegaRatio,
    regime: saturated
      ? "saturated-active-wind"
      : massLossSolar < 0.3
        ? "quiet-wind"
        : "cool-star-wind",
    notes,
  };
}

export function computeStellarUvBandModel({ tempK, luminosityLsol, hostRegime = "star" } = {}) {
  const temperature = toFinite(tempK, NaN);
  const luminosity = Math.max(toFinite(luminosityLsol, 0), 0);
  const notes = [
    "UV bands are photospheric blackbody estimates integrated over wavelength; chromospheric emission and flare spectra are not explicitly solved.",
  ];

  if (!Number.isFinite(temperature) || temperature <= 0 || luminosity <= 0) {
    return {
      supported: false,
      bandsAt1Au: {
        prebiotic200280: formatUvBand({
          teffK: SOLAR_UV_REFERENCE_TEFF_K,
          luminosityLsol: 0,
          wavelengthMinNm: 200,
          wavelengthMaxNm: 280,
        }),
        uvc100280: formatUvBand({
          teffK: SOLAR_UV_REFERENCE_TEFF_K,
          luminosityLsol: 0,
          wavelengthMinNm: 100,
          wavelengthMaxNm: 280,
        }),
      },
      method: "photospheric-blackbody-band-integration",
      confidence: "unsupported",
      notes: ["UV band model requires finite positive temperature and luminosity inputs."],
    };
  }

  const confidence = classifyUvConfidence({ tempK: temperature, hostRegime });
  if (hostRegime === "brownDwarf") {
    notes.push(
      "Brown-dwarf photospheric UV is expected to be negligible; magnetic or auroral UV is outside this model.",
    );
  } else if (temperature < 3900) {
    notes.push(
      "Cool-star prebiotic UV can be dominated by chromospheres and flares; this quiescent photospheric estimate may understate episodic UV.",
    );
  } else if (temperature > 7500) {
    notes.push(
      "Hot-star UV is strong, but short lifetimes and non-blackbody line blanketing make the surface context lower confidence.",
    );
  }

  return {
    supported: true,
    bandsAt1Au: {
      prebiotic200280: formatUvBand({
        teffK: temperature,
        luminosityLsol: luminosity,
        wavelengthMinNm: 200,
        wavelengthMaxNm: 280,
      }),
      uvc100280: formatUvBand({
        teffK: temperature,
        luminosityLsol: luminosity,
        wavelengthMinNm: 100,
        wavelengthMaxNm: 280,
      }),
    },
    method: "photospheric-blackbody-band-integration",
    confidence,
    notes,
  };
}

export function computeStellarRotationModel({
  massMsol,
  ageGyr,
  radiusRsol,
  tempK,
  evolutionMode = "mainSequence",
  hostRegime = "star",
} = {}) {
  const mass = toFinite(massMsol, NaN);
  const age = toFinite(ageGyr, NaN);
  const radius = toFinite(radiusRsol, NaN);
  const temperature = toFinite(tempK, SOLAR_TEFF_K);

  if (hostRegime === "brownDwarf" || mass < HYDROGEN_BURNING_MIN_MSOL) {
    return unsupportedRotation(
      "Brown dwarfs are not assigned gyrochronology rotation periods in this stellar model.",
    );
  }

  if (!Number.isFinite(mass) || mass <= 0 || !Number.isFinite(age) || age <= 0) {
    return unsupportedRotation("Rotation requires finite positive stellar mass and age inputs.");
  }

  if (!Number.isFinite(radius) || radius <= 0) {
    return unsupportedRotation("Rotation requires a finite positive stellar radius.");
  }

  const { bv, bvClamped } = estimateBvFromTeffK(temperature);
  const colorTerm = Math.max(0.02, bv - GYRO_COLOR_C);
  const ageMyr = clamp(age * 1000, 30, 14000);
  const basePeriodDays = SOLAR_GYRO_A * colorTerm ** GYRO_COLOR_B * ageMyr ** GYRO_AGE_N;
  const coolDwarfDelay = 1 + 0.85 * clamp((0.6 - mass) / 0.525, 0, 1);
  const giantSlowdown =
    evolutionMode && evolutionMode !== "mainSequence" ? clamp(radius ** 0.35, 1, 3) : 1;
  const periodDays = basePeriodDays * coolDwarfDelay * giantSlowdown;
  const differentialRotation = computeSurfaceDifferentialRotationModel({
    massMsol: mass,
    periodDays,
    tempK: temperature,
    bv,
    evolutionMode,
    referenceLatitudeDeg: ACTIVE_LATITUDE_DEG,
  });
  const equatorialVelocityKms =
    (2 * Math.PI * radius * SOLAR_RADIUS_KM) / (differentialRotation.equatorPeriodDays * 86400);
  const convectiveTurnoverDays = computeConvectiveTurnoverDays({ bv });
  const rossbyNumber = periodDays / convectiveTurnoverDays;
  const confidence = classifyRotationConfidence({
    massMsol: mass,
    ageGyr: age,
    bv,
    evolutionMode,
  });
  const regime = classifyRotationRegime({ confidence, massMsol: mass, bv });
  const gyroAgeGyr = ageMyr / 1000;
  const gyroAgeErrorFraction = confidence === "high" ? 0.2 : confidence === "medium" ? 0.5 : 1;

  return {
    periodDays,
    equatorPeriodDays: differentialRotation.equatorPeriodDays,
    polePeriodDays: differentialRotation.polePeriodDays,
    periodRangeDays: differentialRotation.periodRangeDays,
    differentialRotation,
    equatorialVelocityKms,
    rossbyNumber,
    convectiveTurnoverDays,
    gyroAgeGyr,
    gyroAgeErrorFraction,
    confidence: confidenceLabel(confidence),
    regime,
    bv,
    bvClamped,
    notes: rotationNotes({
      confidence,
      massMsol: mass,
      bvClamped,
      hostRegime,
      evolutionMode,
    }),
  };
}

export function computeStellarEnvironmentModel(params = {}) {
  const rotation = computeStellarRotationModel(params);
  const wind = computeStellarWindModel({
    massMsol: params.massMsol,
    radiusRsol: params.radiusRsol,
    rotationPeriodDays: rotation.periodDays,
    rossbyNumber: rotation.rossbyNumber,
    ageGyr: params.ageGyr,
    hostRegime: params.hostRegime,
  });
  const uv = computeStellarUvBandModel({
    tempK: params.tempK,
    luminosityLsol: params.luminosityLsol,
    hostRegime: params.hostRegime,
  });

  return {
    modelVersion: "stellar-environment-v1",
    rotation,
    wind,
    uv,
  };
}
