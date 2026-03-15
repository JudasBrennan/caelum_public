import { evaluateVolatileRetention } from "../physics/escape.js";
import { clamp, jeansParameter, MOON_VOLATILE_TABLE, toFinite, vaporPressurePa } from "../utils.js";

const EARTH_SURFACE_FIELD_GAUSS = 0.31;
const KM_PER_REARTH = 6371;
const EUROPA_K = 3.97e9;

function normalizeSpeciesKey(species) {
  return String(species || "")
    .replace(/\u2082/g, "2")
    .replace(/\u2084/g, "4")
    .toLowerCase();
}

function compositionBiases(compositionOverride, densityGcm3) {
  const label = String(compositionOverride || "").toLowerCase();
  const icyComposition =
    label.includes("icy") || label.includes("subsurface ocean") || label.includes("mixed rock/ice");
  const rockyComposition =
    label.includes("rocky") || label.includes("iron") || label.includes("molten");
  const volatileInventoryScore = icyComposition
    ? clamp(0.55 + (2.5 - densityGcm3) * 0.12, 0.2, 1)
    : clamp((3.2 - densityGcm3) / 2.2, 0, 0.65);
  return {
    icyComposition,
    rockyComposition,
    volatileInventoryScore,
  };
}

function inferVolatilePresence({
  volatile,
  densityGcm3,
  compositionOverride,
  waterMassFractionPct,
  ammoniaPct,
  mode,
}) {
  if (mode === "core") return densityGcm3 < volatile.maxRho;
  const speciesKey = normalizeSpeciesKey(volatile.species);
  const explicitWaterFraction = Number.isFinite(Number(waterMassFractionPct))
    ? clamp(toFinite(waterMassFractionPct, 0) / 100, 0, 0.9)
    : null;
  const explicitAmmoniaFraction = Number.isFinite(Number(ammoniaPct))
    ? clamp(toFinite(ammoniaPct, 0) / 100, 0, 0.5)
    : 0;
  const biases = compositionBiases(compositionOverride, densityGcm3);
  const waterInventoryScore =
    explicitWaterFraction != null
      ? clamp(explicitWaterFraction / 0.08, 0, 1)
      : biases.icyComposition
        ? Math.max(0.45, biases.volatileInventoryScore)
        : biases.volatileInventoryScore;
  let carbonNitrogenScore = clamp(
    explicitWaterFraction != null
      ? explicitWaterFraction / 0.12 + (biases.icyComposition ? 0.15 : 0)
      : biases.volatileInventoryScore + (biases.icyComposition ? 0.2 : 0),
    0,
    1,
  );
  let adjustedWaterInventoryScore = waterInventoryScore;
  if (biases.rockyComposition && explicitWaterFraction != null && explicitWaterFraction < 0.03) {
    adjustedWaterInventoryScore *= 0.2;
    carbonNitrogenScore *= 0.25;
  }
  const ammoniaScore = clamp(
    explicitAmmoniaFraction / 0.03 + (biases.icyComposition ? 0.15 : 0),
    0,
    1,
  );

  switch (speciesKey) {
    case "h2o":
      return adjustedWaterInventoryScore >= 0.18;
    case "nh3":
      return ammoniaScore >= 0.18;
    case "co2":
      return Math.max(adjustedWaterInventoryScore, carbonNitrogenScore) >= 0.18;
    case "n2":
    case "co":
      return carbonNitrogenScore >= 0.24;
    case "ch4":
      return carbonNitrogenScore >= 0.3;
    default:
      return densityGcm3 < volatile.maxRho;
  }
}

function manualRequestedSpecies(manualCompositionPct = {}, manualSurfacePressureAtm = 0) {
  const requested = new Map();
  const normalizedPressureAtm = Math.max(toFinite(manualSurfacePressureAtm, 0), 0);
  for (const [key, value] of Object.entries(manualCompositionPct || {})) {
    const pct = Math.max(toFinite(value, 0), 0);
    if (!key.endsWith("Pct") || pct <= 0) continue;
    requested.set(key.replace(/Pct$/, "").toLowerCase(), pct);
  }
  if (!requested.size && normalizedPressureAtm > 0) requested.set("n2", 100);
  return requested;
}

export function analyseMoonVolatiles(
  densityGcm3,
  surfaceTempK,
  escapeVelocityKmS,
  gravityMs2,
  ageGyr,
  tidalFeedbackActive,
  options = {},
) {
  const vEscMs = escapeVelocityKmS * 1000;
  const mode = String(options?.mode || "core").toLowerCase();
  const manualRequests = manualRequestedSpecies(
    options?.manualCompositionPct,
    options?.manualSurfacePressureAtm,
  );

  return MOON_VOLATILE_TABLE.map((volatile) => {
    const speciesKey = normalizeSpeciesKey(volatile.species);
    const manualRequested = manualRequests.has(speciesKey);
    const present =
      volatile.species === "SO\u2082"
        ? tidalFeedbackActive || manualRequested
        : manualRequested ||
          inferVolatilePresence({
            volatile,
            densityGcm3,
            compositionOverride: options?.compositionOverride,
            waterMassFractionPct: options?.waterMassFractionPct,
            ammoniaPct: options?.ammoniaPct,
            mode,
          });
    const sublimating =
      present &&
      (volatile.species === "SO\u2082" ? tidalFeedbackActive : surfaceTempK >= volatile.subK);
    const lambda = sublimating ? jeansParameter(volatile.massAmu, vEscMs, surfaceTempK) : 0;
    const pressurePa = manualRequested
      ? Math.max(toFinite(options?.manualSurfacePressureAtm, 0), 0) *
        101325 *
        (manualRequests.get(speciesKey) / 100)
      : sublimating
        ? vaporPressurePa(volatile, surfaceTempK)
        : 0;

    let retained = manualRequested ? pressurePa > 0 : lambda > 6;
    if (retained && !manualRequested && volatile.species !== "SO\u2082") {
      retained = evaluateVolatileRetention({
        pressurePa,
        gravityMs2,
        massAmu: volatile.massAmu,
        tempK: surfaceTempK,
        lambda,
        ageGyr,
      }).retained;
    }

    let status;
    if (!present) status = "Absent";
    else if (manualRequested && pressurePa > 0) status = "Thin atmosphere";
    else if (!sublimating) status = "Stable ice";
    else if (retained) status = "Thin atmosphere";
    else status = "Exosphere";

    return {
      species: volatile.species,
      label: volatile.label,
      massAmu: volatile.massAmu,
      present,
      sublimating,
      retained,
      lambda,
      pressurePa,
      status,
    };
  });
}

export function computeMagnetosphericRadiation({
  surfaceFieldEarths,
  magnetopauseRp,
  planetSemiMajorAxisAu,
  planetRadiusEarth,
  moonSemiMajorAxisKm,
}) {
  const planetRadiusKm = planetRadiusEarth * KM_PER_REARTH;
  const lShell = planetRadiusKm > 0 ? moonSemiMajorAxisKm / planetRadiusKm : Infinity;
  const surfaceFieldGauss = surfaceFieldEarths * EARTH_SURFACE_FIELD_GAUSS;
  const bAtMoonGauss = lShell > 0 ? surfaceFieldGauss / lShell ** 3 : 0;
  const magnetopauseLShell =
    magnetopauseRp ??
    (surfaceFieldEarths > 0
      ? 10 * Math.cbrt(surfaceFieldEarths) * Math.cbrt(planetSemiMajorAxisAu)
      : 0);

  let magnetosphericRadRemDay = 0;
  if (surfaceFieldEarths > 0 && lShell < magnetopauseLShell && bAtMoonGauss > 0) {
    magnetosphericRadRemDay = EUROPA_K * bAtMoonGauss ** 3;
    const lFrac = lShell / magnetopauseLShell;
    magnetosphericRadRemDay /= 1 + Math.exp(25 * (lFrac - 0.3));
    const beltConfinementFactor = clamp(
      0.45 + Math.log10(1 + Math.max(magnetopauseLShell, 0)) / 2.4,
      0.45,
      1.15,
    );
    magnetosphericRadRemDay *= beltConfinementFactor;
  }

  return {
    modelVersion: "moon-parent-radiation-v2",
    magnetosphericRadRemDay,
    magnetopauseLShell,
    bAtMoonGauss,
    lShell,
    insideMagnetosphere: lShell < magnetopauseLShell && surfaceFieldEarths > 0,
    calibrationAnchor: "europa-relative-parent-belt",
  };
}

export function radiationLabel(remDay) {
  if (remDay < 0.001) return "Negligible";
  if (remDay < 0.01) return "Low";
  if (remDay < 0.1) return "Moderate";
  if (remDay < 1) return "High";
  if (remDay < 100) return "Very High";
  return "Extreme";
}
