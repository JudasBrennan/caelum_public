import { classifyBrownDwarfSpectralFamily } from "./starClassification.js";
import { clamp, fmt, toFinite } from "./utils.js";
import {
  BROWN_DWARF_MAX_MSOL,
  BROWN_DWARF_MIN_MSOL,
  classifyHostRegimeByMass,
  getInsolationZoneKindForRegime,
  getInsolationZoneLabelForRegime,
  massMsolToMjup,
} from "./substellarRegime.js";

const HZ_SOLAR_TEFF_K = 5778;
const HZ_MIN_FLUX = 1e-6;
const SOLAR_TEMP_K = 5776;
const SOLAR_RADIUS_KM = 696340;
const SOLAR_LUMINOSITY_W = 3.828e26;
const SOLAR_DENSITY_G_CM3 = 1.408;
const JUPITER_RADIUS_RSOL = 69911 / SOLAR_RADIUS_KM;

function calcHabitableFluxLimitsFromTeffK(teffK) {
  const t = Number(teffK);
  const rawDT = (Number.isFinite(t) ? t : HZ_SOLAR_TEFF_K) - HZ_SOLAR_TEFF_K;
  const dT = clamp(rawDT, 2600 - HZ_SOLAR_TEFF_K, 7200 - HZ_SOLAR_TEFF_K);
  const sInRaw =
    1.107 + 1.332e-4 * dT + 1.58e-8 * dT ** 2 - 8.308e-12 * dT ** 3 - 5.073e-15 * dT ** 4;
  const sOutRaw =
    0.356 + 6.171e-5 * dT + 1.698e-9 * dT ** 2 - 3.198e-12 * dT ** 3 - 5.575e-16 * dT ** 4;
  return {
    sIn: Math.max(HZ_MIN_FLUX, sInRaw),
    sOut: Math.max(HZ_MIN_FLUX, sOutRaw),
    dT,
  };
}

function calcCurrentTemperateZoneAu({ luminosityLsol, teffK }) {
  const luminosity = Math.max(0, Number(luminosityLsol) || 0);
  const flux = calcHabitableFluxLimitsFromTeffK(teffK);
  return {
    innerAu: luminosity > 0 ? Math.sqrt(luminosity / flux.sIn) : 0,
    outerAu: luminosity > 0 ? Math.sqrt(luminosity / flux.sOut) : 0,
    ...flux,
  };
}

function brownDwarfRadiusRjFromMassAge(massMjup, ageGyr) {
  const mass = clamp(toFinite(massMjup, 30), 13, 75);
  const age = clamp(toFinite(ageGyr, 4.6), 0.01, 20);
  const radiusRj =
    1.08 - 0.05 * Math.log10(age + 0.05) - 0.12 * Math.log10(Math.max(mass / 25, 0.2));
  return clamp(radiusRj, 0.78, 1.15);
}

function brownDwarfTempKFromMassAge(massMjup, ageGyr) {
  const mass = clamp(toFinite(massMjup, 30), 13, 75);
  const age = clamp(toFinite(ageGyr, 4.6), 0.01, 20);
  return clamp(2100 * (mass / 30) ** 0.58 * (age + 0.08) ** -0.34, 250, 3200);
}

function hexToRgb(hex) {
  const raw = String(hex || "")
    .trim()
    .replace(/^#/, "");
  const expanded = raw.length === 3 ? raw.replace(/(.)/g, "$1$1") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return { r: 255, g: 244, b: 220 };
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

function mixHex(hexA, hexB, t = 0.5) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const u = clamp(Number(t), 0, 1);
  const r = Math.round(a.r + (b.r - a.r) * u);
  const g = Math.round(a.g + (b.g - a.g) * u);
  const bCh = Math.round(a.b + (b.b - a.b) * u);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bCh.toString(16).padStart(2, "0")}`;
}

function brownDwarfColourHex(tempK) {
  const { family, subtype } = classifyBrownDwarfSpectralFamily(tempK);
  const subtypeT = clamp(subtype / 9, 0, 1);

  // Visible-light stylisation: L dwarfs read as dim red/orange, T dwarfs as
  // darker red-magenta, and Y dwarfs as extremely dim plum/near-black objects.
  if (family === "L") return mixHex("#cc6a36", "#a3382f", subtypeT);
  if (family === "T") return mixHex("#8b3150", "#5f233d", subtypeT);
  return mixHex("#452742", "#241625", subtypeT);
}

export function computeBrownDwarfXuvModel() {
  return {
    modelVersion: "brown-dwarf-xuv-v1",
    regime: "cool-atmosphere",
    saturationAgeGyr: 0,
    saturatedLuminosityRatioLbol: 0,
    luminosityRatioLbol: 0,
    xuvLuminosityW: 0,
    xuvLuminosityErgS: 0,
    fluxAt1AuWm2: 0,
    fluxAt1AuErgCm2S: 0,
    fluxRatioEarth: 0,
  };
}

export function calcBrownDwarf({
  massMsol,
  ageGyr,
  radiusRsolOverride,
  luminosityLsolOverride,
  tempKOverride,
  metallicityFeH,
} = {}) {
  const resolvedMassMsol = clamp(
    toFinite(massMsol, BROWN_DWARF_MIN_MSOL),
    BROWN_DWARF_MIN_MSOL,
    BROWN_DWARF_MAX_MSOL,
  );
  const age = clamp(toFinite(ageGyr, 4.6), 0, 20);
  const massMjup = massMsolToMjup(resolvedMassMsol);
  const radiusRsolAuto = brownDwarfRadiusRjFromMassAge(massMjup, age) * JUPITER_RADIUS_RSOL;
  const tempKAuto = brownDwarfTempKFromMassAge(massMjup, age);
  const luminosityLsolAuto = radiusRsolAuto ** 2 * (tempKAuto / SOLAR_TEMP_K) ** 4;

  const rOv = Number(radiusRsolOverride);
  const lOv = Number(luminosityLsolOverride);
  const tOv = Number(tempKOverride);
  const hasR = Number.isFinite(rOv) && rOv > 0;
  const hasL = Number.isFinite(lOv) && lOv > 0;
  const hasT = Number.isFinite(tOv) && tOv > 0;

  let radiusRsol;
  let luminosityLsol;
  let tempK;
  let resolutionMode;

  if (hasR && hasL) {
    radiusRsol = rOv;
    luminosityLsol = lOv;
    tempK = (luminosityLsol / radiusRsol ** 2) ** 0.25 * SOLAR_TEMP_K;
    resolutionMode = "R+L→T";
  } else if (hasR && hasT) {
    radiusRsol = rOv;
    tempK = tOv;
    luminosityLsol = radiusRsol ** 2 * (tempK / SOLAR_TEMP_K) ** 4;
    resolutionMode = "R+T→L";
  } else if (hasL && hasT) {
    luminosityLsol = lOv;
    tempK = tOv;
    radiusRsol = Math.sqrt(luminosityLsol) * (SOLAR_TEMP_K / tempK) ** 2;
    resolutionMode = "L+T→R";
  } else if (hasT) {
    radiusRsol = radiusRsolAuto;
    tempK = tOv;
    luminosityLsol = radiusRsol ** 2 * (tempK / SOLAR_TEMP_K) ** 4;
    resolutionMode = "T→L (mass R)";
  } else if (hasR) {
    radiusRsol = rOv;
    luminosityLsol = luminosityLsolAuto;
    tempK = (luminosityLsol / radiusRsol ** 2) ** 0.25 * SOLAR_TEMP_K;
    resolutionMode = "R override";
  } else if (hasL) {
    radiusRsol = radiusRsolAuto;
    luminosityLsol = lOv;
    tempK = (luminosityLsol / radiusRsol ** 2) ** 0.25 * SOLAR_TEMP_K;
    resolutionMode = "L override";
  } else {
    radiusRsol = radiusRsolAuto;
    luminosityLsol = luminosityLsolAuto;
    tempK = tempKAuto;
    resolutionMode = "mass-age-derived";
  }

  const densityDsol = resolvedMassMsol / radiusRsol ** 3;
  const densityGcm3 = SOLAR_DENSITY_G_CM3 * densityDsol;
  const zone = calcCurrentTemperateZoneAu({ luminosityLsol, teffK: tempK });
  const { family, subtype } = classifyBrownDwarfSpectralFamily(tempK);
  const spectralClass = `${family}${subtype} BD`;
  const zoneKind = getInsolationZoneKindForRegime("brownDwarf");
  const zoneLabel = getInsolationZoneLabelForRegime("brownDwarf");
  const xuvModel = computeBrownDwarfXuvModel();
  const deuteriumBurningWindowGyr =
    massMjup >= 13 ? clamp(0.08 + ((massMjup - 13) / 62) * 0.35, 0.08, 0.43) : 0;
  const deuteriumBurningActive = age > 0 && age <= deuteriumBurningWindowGyr;
  const massKg = 1.989e30 * resolvedMassMsol;
  const radiusKm = SOLAR_RADIUS_KM * radiusRsol;
  const luminosityW = SOLAR_LUMINOSITY_W * luminosityLsol;

  return {
    regime: classifyHostRegimeByMass({ massMsol: resolvedMassMsol }),
    inputs: {
      massMsol: resolvedMassMsol,
      massMjup,
      ageGyr: age,
      metallicityFeH: toFinite(metallicityFeH, 0),
    },
    evolutionMode: "cooling",
    radiusRsolAuto,
    radiusRjAuto: radiusRsolAuto / JUPITER_RADIUS_RSOL,
    luminosityLsolAuto,
    tempKAuto,
    radiusOverridden: hasR,
    luminosityOverridden: hasL,
    tempKOverridden: hasT,
    resolutionMode,
    spectralClass,
    spectralFamily: family,
    spectralSubtype: subtype,
    substellarClass: `${family}${subtype}`,
    maxAgeGyr: 1000,
    radiusRsol,
    radiusRj: radiusRsol / JUPITER_RADIUS_RSOL,
    luminosityLsol,
    densityDsol,
    densityGcm3,
    tempK,
    habitableZoneAu: { inner: zone.innerAu, outer: zone.outerAu },
    habitableZoneMillionKm: { inner: zone.innerAu * 149.6, outer: zone.outerAu * 149.6 },
    habitableZoneModel: {
      innerAu: zone.innerAu,
      outerAu: zone.outerAu,
      teffK: tempK,
      sIn: zone.sIn,
      sOut: zone.sOut,
      dT: zone.dT,
      source:
        "Current temperate-zone estimate from brown-dwarf luminosity and effective temperature",
    },
    zoneKind,
    zoneLabel,
    earthLikeLifePossible: "No",
    giantPlanetProbability: 0,
    populationLabel: "Substellar object",
    deuteriumBurningPossible: massMjup >= 13,
    deuteriumBurningActive,
    deuteriumBurningWindowGyr,
    metric: {
      massKg,
      radiusKm,
      luminosityW,
      xuvLuminosityW: 0,
      xuvLuminosityErgS: 0,
    },
    xuvModel,
    display: {
      hzAu: `${fmt(zone.innerAu, 3)} - ${fmt(zone.outerAu, 3)}`,
      hzMkm: `${fmt(zone.innerAu * 149.6, 2)} - ${fmt(zone.outerAu * 149.6, 2)}`,
      zoneLabel,
      xuvLuminosityW: "0 W",
      xuvLuminosityErgS: "0.00e+0",
      xuvFluxAt1Au: "0 erg/cm²/s",
      xuvFluxRatioEarth: "0× Earth",
      xuvRegime: "Negligible",
      xuvSaturationAge: "0 Gyr",
    },
    starColourHex: brownDwarfColourHex(tempK),
  };
}
