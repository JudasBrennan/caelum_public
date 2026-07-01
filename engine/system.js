// Planetary System layout engine
//
// Computes orbital architecture for a planetary system around a
// single star.  Given a star mass, a first-orbit distance, and a
// Titius-Bode-style spacing factor, the module derives:
//
//   - Fundamental star properties (luminosity, radius, density)
//     via Eker et al. 2018 relations (delegated to star.js)
//   - Habitable-zone inner/outer boundaries (Kopparapu et al. 2013,
//     via star.js)
//   - Snow/frost line distance (4.85 * sqrt(L))
//   - Roche-limit system inner boundary
//   - Twenty geometric orbit slots using the spacing formula:
//       orbit[1] = orbit1Au
//       orbit[n] = orbit1Au + spacingFactor * 2^(n-2)   (n >= 2)
//
// Inputs (user-editable):
//   starMassMsol  — host star mass in solar masses
//   spacingFactor — orbit spacing multiplier (dimensionless)
//   orbit1Au      — distance of the innermost orbit slot (AU)
//
// Outputs:
//   Star properties, habitable-zone bounds (AU & million km),
//   frost line, system inner limit, and 20 orbit slots (AU &
//   million km), plus pre-formatted display strings.
//
// This module is intentionally self-contained and pure (no DOM
// access).  Units: AU, solar units.

import { calcBrownDwarf } from "./brownDwarf.js";
import { clamp, fmt } from "./utils.js";
import { auToKilometers } from "./physics/orbital.js";
import { SOLAR_RADIUS_KM } from "./physics/constants.js";
import { calcHabitableZoneAu, massToLuminosity, massToRadius } from "./star.js";
import {
  BROWN_DWARF_MIN_MSOL,
  classifyHostRegimeByMass,
  getInsolationZoneKindForRegime,
  getInsolationZoneLabelForRegime,
} from "./substellarRegime.js";

const AU_TO_KM = Math.round(auToKilometers(1) / 100000) * 100000;
const AU_TO_MILLION_KM = AU_TO_KM / 1e6;

/**
 * Computes the full orbital layout for a planetary system.
 *
 * Star properties are derived from mass via Eker et al. 2018
 * relations (star.js).  Habitable-zone bounds follow
 * Kopparapu et al. 2013.  Orbit slots use a geometric
 * Titius-Bode spacing: orbit[n] = orbit1Au + spacingFactor * 2^(n-2).
 *
 * @param {object} params
 * @param {number} params.starMassMsol  - Host star mass (M_sol, 0.075–100)
 * @param {number} params.spacingFactor - Orbit spacing multiplier (dimensionless, 0–10)
 * @param {number} params.orbit1Au      - Innermost orbit distance (AU)
 * @returns {object} System model with star properties, habitable zone,
 *   frost line, inner limit, 20 orbit slots (AU & million km), and
 *   pre-formatted display strings
 */
export function calcSystem({
  starMassMsol,
  spacingFactor,
  orbit1Au,
  luminosityLsolOverride,
  radiusRsolOverride,
  tempKOverride,
}) {
  const m = clamp(starMassMsol, BROWN_DWARF_MIN_MSOL, 100);
  const s = clamp(spacingFactor, 0, 10); // spacing is a "knob"; allow wide but sane
  const o1 = clamp(orbit1Au, 0, 1e6);
  const hostRegime = classifyHostRegimeByMass({ massMsol: m });
  const zoneKind = getInsolationZoneKindForRegime(hostRegime);
  const zoneLabel = getInsolationZoneLabelForRegime(hostRegime);

  // --- Star properties (Eker et al. 2018 relations from star.js) ---
  const brownDwarfAuto =
    hostRegime === "brownDwarf"
      ? calcBrownDwarf({
          massMsol: m,
          ageGyr: 4.6,
          radiusRsolOverride,
          luminosityLsolOverride,
          tempKOverride,
        })
      : null;
  const luminosityAuto =
    hostRegime === "brownDwarf" ? brownDwarfAuto.luminosityLsolAuto : massToLuminosity(m);
  const radiusAuto = hostRegime === "brownDwarf" ? brownDwarfAuto.radiusRsolAuto : massToRadius(m);
  const rOv = Number(radiusRsolOverride);
  const lOv = Number(luminosityLsolOverride);
  const tOv = Number(tempKOverride);
  const hasR = Number.isFinite(rOv) && rOv > 0;
  const hasL = Number.isFinite(lOv) && lOv > 0;
  const hasT = Number.isFinite(tOv) && tOv > 0;

  let luminosityLsol;
  let radiusRsol;
  let tempK;

  if (hostRegime === "brownDwarf") {
    radiusRsol = brownDwarfAuto.radiusRsol;
    luminosityLsol = brownDwarfAuto.luminosityLsol;
    tempK = brownDwarfAuto.tempK;
  } else if (hasR && hasL) {
    radiusRsol = rOv;
    luminosityLsol = lOv;
    tempK = (luminosityLsol / radiusRsol ** 2) ** 0.25 * 5776;
  } else if (hasR && hasT) {
    radiusRsol = rOv;
    tempK = tOv;
    luminosityLsol = radiusRsol ** 2 * (tempK / 5776) ** 4;
  } else if (hasL && hasT) {
    luminosityLsol = lOv;
    tempK = tOv;
    radiusRsol = Math.sqrt(luminosityLsol) * (5776 / tempK) ** 2;
  } else if (hasT) {
    radiusRsol = radiusAuto;
    tempK = tOv;
    luminosityLsol = radiusRsol ** 2 * (tempK / 5776) ** 4;
  } else if (hasR) {
    radiusRsol = rOv;
    luminosityLsol = luminosityAuto;
    tempK = (luminosityLsol / radiusRsol ** 2) ** 0.25 * 5776;
  } else if (hasL) {
    radiusRsol = radiusAuto;
    luminosityLsol = lOv;
    tempK = (luminosityLsol / radiusRsol ** 2) ** 0.25 * 5776;
  } else {
    radiusRsol = radiusAuto;
    luminosityLsol = luminosityAuto;
    tempK = (luminosityLsol / radiusRsol ** 2) ** 0.25 * 5776;
  }

  const densityDsol = m / radiusRsol ** 3;
  const densityGcm3 = 1.408 * densityDsol;

  const hzTeffK = tempK;
  const hz =
    hostRegime === "brownDwarf"
      ? brownDwarfAuto.habitableZoneModel
      : calcHabitableZoneAu({ luminosityLsol, teffK: hzTeffK });
  const hzInnerAu = hz.innerAu;
  const hzOuterAu = hz.outerAu;

  // Frost line: 4.85 * sqrt(L)
  const frostLineAu = 4.85 * Math.sqrt(luminosityLsol);

  // System inner limit (AU):
  // =2.455*(Rsol*R_sun_km)*((Dsol*1408)/5400)^(1/3)/149600000
  const systemInnerLimitAu =
    (2.455 * (radiusRsol * SOLAR_RADIUS_KM) * ((densityDsol * 1408) / 5400) ** (1 / 3)) / AU_TO_KM;

  // Orbit slots:
  // Orbit2 = Orbit1 + spacingFactor * 2^0
  // Orbit3 = Orbit1 + spacingFactor * 2^1
  // ...
  // Orbit20 = Orbit1 + spacingFactor * 2^18
  const orbitsAu = [];
  for (let i = 1; i <= 20; i++) {
    if (i === 1) {
      orbitsAu.push(o1);
      continue;
    }
    const exponent = i - 2; // orbit2 -> 0
    orbitsAu.push(o1 + s * 2 ** exponent);
  }

  return {
    inputs: { starMassMsol: m, spacingFactor: s, orbit1Au: o1 },
    hostRegime,
    zoneKind,
    zoneLabel,

    star: {
      regime: hostRegime,
      luminosityLsol,
      radiusRsol,
      densityDsol,
      densityGcm3,
      tempK,
    },

    habitableZoneAu: { inner: hzInnerAu, outer: hzOuterAu },
    habitableZoneMillionKm: {
      inner: hzInnerAu * AU_TO_MILLION_KM,
      outer: hzOuterAu * AU_TO_MILLION_KM,
    },

    frostLineAu,
    frostLineMillionKm: frostLineAu * AU_TO_MILLION_KM,

    systemInnerLimitAu,
    systemInnerLimitMillionKm: systemInnerLimitAu * AU_TO_MILLION_KM,

    orbitsAu,
    orbitsMillionKm: orbitsAu.map((x) => x * AU_TO_MILLION_KM),

    display: {
      zoneLabel,
      hzAu: `${fmt(hzInnerAu, 3)} - ${fmt(hzOuterAu, 3)}`,
      frostAu: fmt(frostLineAu, 3),
      innerLimitAu: fmt(systemInnerLimitAu, 4),
    },
  };
}
