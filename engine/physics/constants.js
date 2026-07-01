export const SIGMA_SB_W_M2_K4 = 5.670374419e-8;
export const BOLTZMANN_J_K = 1.380649e-23;
export const G_SI = 6.674e-11;

export const SOLAR_LUMINOSITY_W = 3.828e26;
export const SOLAR_LUMINOSITY_ERG_S = 3.828e33;
export const SOLAR_MASS_KG = 1.989e30;
export const SOLAR_RADIUS_M = 6.957e8;
export const SOLAR_RADIUS_KM = 695700;

export const EARTH_MASS_KG = 5.972e24;
export const EARTH_RADIUS_M = 6.371e6;
export const EARTH_RADIUS_KM = 6371;
export const EARTH_GRAVITY_MS2 = 9.80665;
export const EARTH_DENSITY_G_CM3 = 5.514;
export const SOLAR_CONSTANT_W_M2 = 1361;

export const AU_M = 1.495978707e11;
export const AU_KM = 1.495978707e8;
export const JULIAN_YEAR_S = 31557600;

export const JUPITER_MASS_EARTH = 317.83;
export const JUPITER_MASS_KG = 1.898e27;
export const JUPITER_RADIUS_EARTH = 10.97;
export const JUPITER_RADIUS_M = 6.9911e7;
export const JUPITER_RADIUS_KM = 69911;

export const AMU_KG = 1.66054e-27;
export const PROTON_MASS_KG = 1.6726e-27;
export const SOLAR_APPARENT_MAG_1AU = -26.74;

export function scienceDiagnostic(code, severity, message, details = {}) {
  return { code, severity, message, details };
}
