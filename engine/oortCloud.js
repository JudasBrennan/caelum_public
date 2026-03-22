import { clamp, round, toFinite } from "./utils.js";

const EARTH_PER_MJUP = 317.8;
const SOLAR_GALACTOCENTRIC_DISTANCE_LY = 25800;
const SOLAR_STELLAR_DENSITY_PER_LY3 = 0.004;
const SOLAR_OORT_HILL_AU = 150000;
const SOLAR_OORT_INNER_AU = 3000;
const SOLAR_OORT_OUTER_AU = 100000;
const SOLAR_OORT_MASS_MEARTH = 5;
const SOLAR_LPC_RATE_PER_YEAR = 2.5;
const SOLAR_TOTAL_GIANT_MASS_EARTH = EARTH_PER_MJUP * (1 + 0.299 + 0.046 + 0.054);
const SOLAR_OUTER_GIANT_AU = 30.07;
const MATURE_OORT_AGE_GYR = 0.5;
const INSTABILITY_MASS_FACTORS = Object.freeze({
  quiet: 1.15,
  mild: 1.0,
  violent: 0.6,
});
const INSTABILITY_INNER_FACTORS = Object.freeze({
  quiet: 0.9,
  mild: 1.0,
  violent: 1.25,
});
const INSTABILITY_FLUX_FACTORS = Object.freeze({
  quiet: 0.9,
  mild: 1.0,
  violent: 1.2,
});
const PROFILE_RULES = Object.freeze({
  typicalLongPeriod: {
    name: "New long-period comet",
    aFactor: 8,
    aMin: 20000,
    aMaxFrac: 0.65,
    eccentricity: 0.999,
  },
  extremeLongPeriod: {
    name: "New extreme long-period comet",
    aFactor: 12,
    aMin: 40000,
    aMaxFrac: 0.85,
    eccentricity: 0.9995,
  },
  sunSkimmer: {
    name: "New sun-skimming comet",
    aFactor: 6,
    aMin: 12000,
    aMaxFrac: 0.45,
    perihelionAu: 0.15,
  },
  isotropicSample: {
    name: "New isotropic long-period comet",
    aFactor: 7,
    aMin: 15000,
    aMaxFrac: 0.7,
    eccentricity: 0.9985,
  },
});
const PROFILE_DEFAULT_VOLATILES = Object.freeze({
  typicalLongPeriod: "waterRich",
  extremeLongPeriod: "mixed",
  sunSkimmer: "waterRich",
  isotropicSample: "mixed",
});
const PROFILE_DEFAULT_INCLINATIONS = Object.freeze({
  typicalLongPeriod: 75,
  extremeLongPeriod: 85,
  sunSkimmer: 55,
  isotropicSample: 100,
});
const INCLINATION_PROFILE_OVERRIDES = Object.freeze({
  isotropic: 75,
  mildlyPrograde: 25,
  retrogradeHeavy: 135,
});
const NUCLEUS_SIZE_BY_BIAS = Object.freeze({
  small: 3,
  medium: 6,
  large: 12,
});
const ACTIVE_FRACTION_BY_VOLATILE = Object.freeze({
  waterRich: 0.08,
  mixed: 0.06,
  co2Rich: 0.05,
  coRich: 0.04,
});
const DUST_TO_GAS_BY_VOLATILE = Object.freeze({
  waterRich: 1.5,
  mixed: 1.3,
  co2Rich: 1.1,
  coRich: 0.9,
});

function normalizeGasGiants(gasGiants) {
  return Array.isArray(gasGiants) ? gasGiants.filter(Boolean) : [];
}

function sumGiantMassEarth(gasGiants) {
  return normalizeGasGiants(gasGiants).reduce(
    (sum, gasGiant) => sum + Math.max(0, toFinite(gasGiant?.massMjup, 1)) * EARTH_PER_MJUP,
    0,
  );
}

function maxGiantOrbitAu(gasGiants) {
  return normalizeGasGiants(gasGiants).reduce(
    (max, gasGiant) => Math.max(max, Math.max(0, toFinite(gasGiant?.au, 0))),
    0,
  );
}

function sumInnerEjectorMassEarth(gasGiants) {
  return normalizeGasGiants(gasGiants).reduce((sum, gasGiant) => {
    const orbitAu = Math.max(0, toFinite(gasGiant?.au, 0));
    const massMjup = Math.max(0, toFinite(gasGiant?.massMjup, 0));
    if (orbitAu > 10 || massMjup < 0.5) return sum;
    return sum + massMjup * EARTH_PER_MJUP;
  }, 0);
}

function resolveGalactocentricDistanceLy(raw = {}) {
  const explicitDistance = [
    raw?.galactocentricDistanceLy,
    raw?.locationLy,
    raw?.galacticRadiusLy,
  ].map((value) => Number(value));
  const finiteDistance = explicitDistance.find(Number.isFinite);
  return Math.max(toFinite(finiteDistance, SOLAR_GALACTOCENTRIC_DISTANCE_LY), 1000);
}

function cloneSeedDefaults(seedCometDefaults) {
  return seedCometDefaults && typeof seedCometDefaults === "object" ? { ...seedCometDefaults } : {};
}

function cloneOortModel(model) {
  const source = model && typeof model === "object" ? model : {};
  return {
    present: !!source.present,
    formationClass: String(source.formationClass || "Negligible"),
    confidence: String(source.confidence || "Low"),
    hillRadiusAu: round(toFinite(source.hillRadiusAu, 0), 3),
    innerBoundaryAu: round(toFinite(source.innerBoundaryAu, 0), 3),
    outerBoundaryAu: round(toFinite(source.outerBoundaryAu, 0), 3),
    estimatedMassMearth: round(toFinite(source.estimatedMassMearth, 0), 3),
    injectionRatePerYear: round(toFinite(source.injectionRatePerYear, 0), 3),
    seedCometDefaults: cloneSeedDefaults(source.seedCometDefaults),
  };
}

function classifyFormationClass(estimatedMassMearth) {
  if (estimatedMassMearth >= 3) return "Robust";
  if (estimatedMassMearth >= 0.5) return "Sparse";
  return "Negligible";
}

function normalizeInstabilityHistory(value) {
  const normalized = String(value ?? "").trim();
  return Object.prototype.hasOwnProperty.call(INSTABILITY_MASS_FACTORS, normalized)
    ? normalized
    : "mild";
}

function normalizeMode(value) {
  const normalized = String(value ?? "").trim();
  return normalized === "guided" || normalized === "manual" ? normalized : "auto";
}

function normalizeSeedProfile(value) {
  const normalized = String(value ?? "").trim();
  return Object.prototype.hasOwnProperty.call(PROFILE_RULES, normalized)
    ? normalized
    : "typicalLongPeriod";
}

function normalizeSeedVolatileClass(value) {
  const normalized = String(value ?? "").trim();
  return normalized === "waterRich" ||
    normalized === "mixed" ||
    normalized === "co2Rich" ||
    normalized === "coRich"
    ? normalized
    : "auto";
}

function normalizeSeedInclinationMode(value) {
  const normalized = String(value ?? "").trim();
  return normalized === "isotropic" ||
    normalized === "mildlyPrograde" ||
    normalized === "retrogradeHeavy"
    ? normalized
    : "auto";
}

function normalizeSeedNucleusBias(value) {
  const normalized = String(value ?? "").trim();
  return normalized === "small" || normalized === "large" ? normalized : "medium";
}

function parseOptionalManualNumber(value) {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildSeedCometDefaults({ resolved, seedingInputs } = {}) {
  const sourceResolved = cloneOortModel(resolved);
  const profile = normalizeSeedProfile(seedingInputs?.profile);
  const profileRule = PROFILE_RULES[profile];
  const volatileClass =
    normalizeSeedVolatileClass(seedingInputs?.volatileClass) !== "auto"
      ? normalizeSeedVolatileClass(seedingInputs?.volatileClass)
      : PROFILE_DEFAULT_VOLATILES[profile];
  const inclinationMode = normalizeSeedInclinationMode(seedingInputs?.inclinationMode);
  const nucleusSizeBias = normalizeSeedNucleusBias(seedingInputs?.nucleusSizeBias);
  const semiMajorAxisAu = clamp(
    Math.max(profileRule.aMin, sourceResolved.innerBoundaryAu * profileRule.aFactor),
    5000,
    Math.max(6000, sourceResolved.outerBoundaryAu * profileRule.aMaxFrac),
  );
  const eccentricity =
    profileRule.perihelionAu == null
      ? profileRule.eccentricity
      : clamp(1 - profileRule.perihelionAu / Math.max(semiMajorAxisAu, 1), 0.97, 0.9999);
  const inclinationDeg =
    inclinationMode === "auto"
      ? PROFILE_DEFAULT_INCLINATIONS[profile]
      : INCLINATION_PROFILE_OVERRIDES[inclinationMode];
  const nucleusRadiusKm = NUCLEUS_SIZE_BY_BIAS[nucleusSizeBias];

  return {
    name: profileRule.name,
    sourceReservoir: "oortCloud",
    semiMajorAxisAu: round(semiMajorAxisAu, 3),
    eccentricity: round(eccentricity, 4),
    inclinationDeg: round(inclinationDeg, 3),
    longitudeOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0,
    nucleusRadiusKm,
    densityGcm3: 0.55,
    albedo: 0.04,
    activeFraction: ACTIVE_FRACTION_BY_VOLATILE[volatileClass],
    dustToGasRatio: DUST_TO_GAS_BY_VOLATILE[volatileClass],
    volatileClass,
  };
}

export function calcOortCloud({
  starMassMsol,
  starAgeGyr,
  galactocentricDistanceLy,
  locationLy,
  galacticRadiusLy,
  stellarDensityPerLy3,
  gasGiants,
} = {}) {
  const safeStarMassMsol = Math.max(toFinite(starMassMsol, 1), 0.08);
  const safeStarAgeGyr = Math.max(toFinite(starAgeGyr, 4.6), 0);
  const safeGalactocentricDistanceLy = resolveGalactocentricDistanceLy({
    galactocentricDistanceLy,
    locationLy,
    galacticRadiusLy,
  });
  const safeStellarDensityPerLy3 = clamp(toFinite(stellarDensityPerLy3, 0.004), 0.000001, 0.1);

  const totalGiantMassEarth = sumGiantMassEarth(gasGiants);
  const maxGiantAu = maxGiantOrbitAu(gasGiants);
  const innerEjectorMassEarth = sumInnerEjectorMassEarth(gasGiants);

  const hillRadiusAu =
    SOLAR_OORT_HILL_AU *
    Math.cbrt(safeStarMassMsol) *
    Math.pow(safeGalactocentricDistanceLy / SOLAR_GALACTOCENTRIC_DISTANCE_LY, 2 / 3);

  const hillScale = hillRadiusAu / SOLAR_OORT_HILL_AU;
  const outerBoundaryBaseAu = SOLAR_OORT_OUTER_AU * hillScale;
  const innerBoundaryBaseAu = SOLAR_OORT_INNER_AU * hillScale;
  const giantArchitectureFloorAu = maxGiantAu > 0 ? maxGiantAu * 80 : 0;
  const outerBoundaryAu = Math.max(outerBoundaryBaseAu, innerBoundaryBaseAu * 2.5);
  const innerBoundaryAu = Math.min(
    Math.max(innerBoundaryBaseAu, giantArchitectureFloorAu),
    outerBoundaryAu * 0.45,
  );

  const giantMassFactor = clamp(totalGiantMassEarth / SOLAR_TOTAL_GIANT_MASS_EARTH, 0, 2.5);
  const outerArchitectureFactor = clamp(maxGiantAu / SOLAR_OUTER_GIANT_AU, 0, 1.5);
  const ejectorPenalty = 1 / Math.sqrt(1 + innerEjectorMassEarth / EARTH_PER_MJUP);
  const ageFactor = clamp(safeStarAgeGyr / MATURE_OORT_AGE_GYR, 0, 1);
  const galacticRetentionFactor = clamp(
    Math.pow(safeGalactocentricDistanceLy / SOLAR_GALACTOCENTRIC_DISTANCE_LY, 0.25),
    0.55,
    1.6,
  );
  const encounterRetentionFactor = clamp(
    Math.pow(SOLAR_STELLAR_DENSITY_PER_LY3 / safeStellarDensityPerLy3, 0.2),
    0.6,
    1.6,
  );
  const retentionFactor = clamp(galacticRetentionFactor * encounterRetentionFactor, 0.35, 1.8);

  const estimatedMassMearth = clamp(
    7 *
      safeStarMassMsol *
      giantMassFactor *
      outerArchitectureFactor *
      ejectorPenalty *
      ageFactor *
      retentionFactor,
    0,
    100,
  );

  const injectionRatePerYear =
    estimatedMassMearth > 0.1
      ? clamp(
          SOLAR_LPC_RATE_PER_YEAR *
            (estimatedMassMearth / SOLAR_OORT_MASS_MEARTH) *
            Math.sqrt(safeStellarDensityPerLy3 / SOLAR_STELLAR_DENSITY_PER_LY3) *
            Math.pow(SOLAR_OORT_INNER_AU / Math.max(innerBoundaryAu, 500), 0.35),
          0.01,
          50,
        )
      : 0;

  let formationClass = "Negligible";
  if (estimatedMassMearth >= 3) formationClass = "Robust";
  else if (estimatedMassMearth >= 0.5) formationClass = "Sparse";

  let confidence = "Low";
  if (estimatedMassMearth >= 3 && maxGiantAu >= 10 && safeStarAgeGyr >= 0.5) confidence = "High";
  else if (estimatedMassMearth >= 0.5 && maxGiantAu >= 5 && safeStarAgeGyr >= 0.1)
    confidence = "Medium";

  const present = estimatedMassMearth >= 0.5;
  const seedUpperAu = Math.max(5000, Math.min(100000, outerBoundaryAu * 0.65));
  const seedSemiMajorAxisAu = clamp(Math.max(20000, innerBoundaryAu * 8), 5000, seedUpperAu);

  return {
    present,
    formationClass,
    confidence,
    hillRadiusAu: round(hillRadiusAu, 3),
    innerBoundaryAu: round(innerBoundaryAu, 3),
    outerBoundaryAu: round(outerBoundaryAu, 3),
    estimatedMassMearth: round(estimatedMassMearth, 3),
    injectionRatePerYear: round(injectionRatePerYear, 3),
    seedCometDefaults: {
      name: "New long-period comet",
      sourceReservoir: "oortCloud",
      semiMajorAxisAu: round(seedSemiMajorAxisAu, 3),
      eccentricity: 0.999,
      inclinationDeg: 75,
      longitudeOfPeriapsisDeg: 0,
      meanAnomalyDeg: 0,
      nucleusRadiusKm: 6,
      densityGcm3: 0.55,
      albedo: 0.04,
      activeFraction: 0.08,
      dustToGasRatio: 1.5,
      volatileClass: "waterRich",
    },
  };
}

export function resolveOortCloudModel({ autoModel, config } = {}) {
  const baseline = cloneOortModel(autoModel);
  const sourceConfig = config && typeof config === "object" ? config : {};
  const guided =
    sourceConfig.guided && typeof sourceConfig.guided === "object" ? sourceConfig.guided : {};
  const manual =
    sourceConfig.manual && typeof sourceConfig.manual === "object" ? sourceConfig.manual : {};
  const seeding =
    sourceConfig.seeding && typeof sourceConfig.seeding === "object" ? sourceConfig.seeding : {};
  const mode = normalizeMode(sourceConfig.mode);
  const formationEfficiency = clamp(toFinite(guided.formationEfficiency, 1), 0.25, 2.5);
  const retention = clamp(toFinite(guided.retention, 1), 0.25, 2.0);
  const innerCompactness = clamp(toFinite(guided.innerCompactness, 1), 0.6, 1.8);
  const instabilityHistory = normalizeInstabilityHistory(guided.instabilityHistory);
  const manualOverridesApplied = [];

  let resolved = cloneOortModel(baseline);

  if (mode === "guided") {
    const estimatedMassMearth = clamp(
      baseline.estimatedMassMearth *
        formationEfficiency *
        retention *
        INSTABILITY_MASS_FACTORS[instabilityHistory],
      0,
      200,
    );
    const innerBoundaryAu = clamp(
      baseline.innerBoundaryAu * innerCompactness * INSTABILITY_INNER_FACTORS[instabilityHistory],
      1000,
      baseline.outerBoundaryAu * 0.75,
    );
    const outerBoundaryAu = clamp(
      baseline.outerBoundaryAu * clamp(0.75 + 0.25 * retention, 0.6, 1.4),
      innerBoundaryAu * 2.2,
      baseline.hillRadiusAu * 0.95,
    );
    const injectionRatePerYear =
      estimatedMassMearth > 0.1
        ? clamp(
            baseline.injectionRatePerYear *
              clamp(estimatedMassMearth / Math.max(baseline.estimatedMassMearth, 0.1), 0.2, 4) *
              Math.pow(baseline.innerBoundaryAu / Math.max(innerBoundaryAu, 500), 0.35) *
              INSTABILITY_FLUX_FACTORS[instabilityHistory],
            0.01,
            100,
          )
        : 0;

    resolved = {
      ...resolved,
      present: estimatedMassMearth >= 0.5,
      formationClass: classifyFormationClass(estimatedMassMearth),
      confidence: baseline.confidence,
      innerBoundaryAu: round(innerBoundaryAu, 3),
      outerBoundaryAu: round(outerBoundaryAu, 3),
      estimatedMassMearth: round(estimatedMassMearth, 3),
      injectionRatePerYear: round(injectionRatePerYear, 3),
    };
  } else if (mode === "manual") {
    const innerBoundaryRaw = parseOptionalManualNumber(manual.innerBoundaryAu);
    const outerBoundaryRaw = parseOptionalManualNumber(manual.outerBoundaryAu);
    const estimatedMassRaw = parseOptionalManualNumber(manual.estimatedMassMearth);
    const injectionRateRaw = parseOptionalManualNumber(manual.injectionRatePerYear);
    if (innerBoundaryRaw != null) manualOverridesApplied.push("innerBoundaryAu");
    if (outerBoundaryRaw != null) manualOverridesApplied.push("outerBoundaryAu");
    if (estimatedMassRaw != null) manualOverridesApplied.push("estimatedMassMearth");
    if (injectionRateRaw != null) manualOverridesApplied.push("injectionRatePerYear");
    if (manual.present === true || manual.present === false) manualOverridesApplied.push("present");

    const maxOuterBoundaryAu = baseline.hillRadiusAu * 0.95;
    const desiredOuterBoundaryAu =
      outerBoundaryRaw == null ? baseline.outerBoundaryAu : outerBoundaryRaw;
    const unclampedOuterBoundaryAu = clamp(desiredOuterBoundaryAu, 2500, maxOuterBoundaryAu);
    const maxInnerBoundaryAu = Math.max(1000, unclampedOuterBoundaryAu / 2.2);
    const innerBoundaryAu =
      innerBoundaryRaw == null
        ? clamp(baseline.innerBoundaryAu, 1000, maxInnerBoundaryAu)
        : clamp(innerBoundaryRaw, 1000, maxInnerBoundaryAu);
    const outerBoundaryAu = clamp(
      unclampedOuterBoundaryAu,
      innerBoundaryAu * 2.2,
      maxOuterBoundaryAu,
    );
    const estimatedMassMearth =
      estimatedMassRaw == null ? baseline.estimatedMassMearth : clamp(estimatedMassRaw, 0, 200);
    const injectionRatePerYear =
      injectionRateRaw == null ? baseline.injectionRatePerYear : clamp(injectionRateRaw, 0, 100);
    const present = manual.present == null ? estimatedMassMearth >= 0.5 : !!manual.present;

    resolved = {
      ...resolved,
      present,
      formationClass: classifyFormationClass(estimatedMassMearth),
      confidence: "User-authored",
      innerBoundaryAu: round(innerBoundaryAu, 3),
      outerBoundaryAu: round(outerBoundaryAu, 3),
      estimatedMassMearth: round(estimatedMassMearth, 3),
      injectionRatePerYear: round(injectionRatePerYear, 3),
    };
  }

  const hasGuidedAdjustments =
    mode === "guided" &&
    (Math.abs(formationEfficiency - 1) > 1e-9 ||
      Math.abs(retention - 1) > 1e-9 ||
      Math.abs(innerCompactness - 1) > 1e-9 ||
      instabilityHistory !== "mild");

  const seedingInputs = {
    profile: normalizeSeedProfile(seeding.profile),
    volatileClass: normalizeSeedVolatileClass(seeding.volatileClass),
    inclinationMode: normalizeSeedInclinationMode(seeding.inclinationMode),
    nucleusSizeBias: normalizeSeedNucleusBias(seeding.nucleusSizeBias),
  };
  const seedCometDefaults = buildSeedCometDefaults({
    resolved,
    seedingInputs,
  });

  return {
    mode,
    baseline,
    resolved: {
      ...resolved,
      seedCometDefaults,
    },
    adjustmentSummary: {
      hasGuidedAdjustments,
      hasManualOverrides: manualOverridesApplied.length > 0,
      formationEfficiency,
      retention,
      innerCompactness,
      instabilityHistory,
      manualOverridesApplied,
    },
    seedingInputs,
  };
}
