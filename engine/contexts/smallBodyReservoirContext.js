import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

export const SMALL_BODY_RESERVOIR_MODEL_VERSION = "small-body-reservoir-context-v1";

const SOURCE_KEYS = ["smallBodyReservoir"];

function finiteNonNegative(value, fallback = 0) {
  return Math.max(0, toFinite(value, fallback));
}

function firstFinite(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function logRangeScore(value, lower, upper) {
  const number = finiteNonNegative(value, 0);
  if (number <= lower) return 0;
  if (number >= upper) return 1;
  const low = Math.log10(Math.max(lower, 1e-30));
  const high = Math.log10(Math.max(upper, lower * 1.0001));
  return clamp((Math.log10(Math.max(number, 1e-30)) - low) / (high - low), 0, 1);
}

function fluxClass(score) {
  return scoreToClass(score, {
    high: "high",
    medium: "moderate",
    low: "low",
    none: "background",
    highAt: 0.65,
    mediumAt: 0.35,
    lowAt: 0.1,
  });
}

function reservoirClass(score, labels = {}) {
  return scoreToClass(score, {
    high: labels.high || "strong",
    medium: labels.medium || "present",
    low: labels.low || "weak",
    none: labels.none || "absent",
    highAt: 0.65,
    mediumAt: 0.35,
    lowAt: 0.08,
  });
}

function normalizeDisk(disk = {}) {
  const massMearth = firstFinite(
    disk?.mass?.estimatedMassEarth,
    disk?.estimatedMassMearth,
    disk?.totalMassMearth,
    disk?.massMearth,
    0,
  );
  const dustProductionKgPerYr = firstFinite(
    disk?.timescales?.dustProductionKgPerYr,
    disk?.dustProductionKgPerYr,
    disk?.dustProductionKgPerYear,
    0,
  );
  const fractionalLuminosity = firstFinite(
    disk?.luminosity?.fractionalLuminosity,
    disk?.fractionalLuminosity,
    0,
  );
  const prInflowKgPerYr = firstFinite(disk?.zodiacal?.prInflowKgPerYr, disk?.prInflowKgPerYr, 0);
  const classText = [
    disk?.classification?.label,
    disk?.composition?.className,
    disk?.display?.classification,
    disk?.label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const volatileRich =
    classText.includes("ice") ||
    classText.includes("kuiper") ||
    classText.includes("volatile") ||
    classText.includes("cold");

  const dustScore = logRangeScore(dustProductionKgPerYr, 1e4, 1e14);
  const massScore = logRangeScore(massMearth, 1e-8, 1);
  const luminosityScore = logRangeScore(fractionalLuminosity, 1e-9, 1e-3);
  const inflowScore = logRangeScore(prInflowKgPerYr, 10, 1e9);
  const fluxScore = clamp(
    0.38 * dustScore + 0.27 * massScore + 0.25 * luminosityScore + 0.1 * inflowScore,
    0,
    1,
  );

  return {
    id: disk?.id || null,
    name: disk?.name || null,
    hostFrameId: disk?.hostFrameId || null,
    massMearth: round(massMearth || 0, 6),
    dustProductionKgPerYr: round(dustProductionKgPerYr || 0, 3),
    fractionalLuminosity: round(fractionalLuminosity || 0, 12),
    prInflowKgPerYr: round(prInflowKgPerYr || 0, 3),
    volatileRich,
    fluxScore: round(fluxScore, 3),
  };
}

function normalizeOort(oortCloud = null) {
  const source =
    oortCloud?.resolved && typeof oortCloud.resolved === "object" ? oortCloud.resolved : oortCloud;
  const model = source && typeof source === "object" ? source : {};
  const injectionRatePerYear = finiteNonNegative(model.injectionRatePerYear, 0);
  const injectionRatePerMyr = finiteNonNegative(
    firstFinite(model.injectionRatePerMyr, injectionRatePerYear * 1_000_000),
    0,
  );
  const estimatedMassMearth = finiteNonNegative(model.estimatedMassMearth, 0);
  const formationClass = String(model.formationClass || "");
  const present = model.present === true || estimatedMassMearth >= 0.5 || injectionRatePerMyr > 0;
  const injectionScore = clamp(
    0.78 * logRangeScore(injectionRatePerMyr, 1e4, 1e8) +
      0.22 * logRangeScore(estimatedMassMearth, 0.05, 20),
    0,
    1,
  );

  return {
    present,
    formationClass,
    confidence: String(model.confidence || ""),
    estimatedMassMearth: round(estimatedMassMearth, 6),
    injectionRatePerYear: round(injectionRatePerYear, 6),
    injectionRatePerMyr: round(injectionRatePerMyr, 3),
    injectionScore: round(injectionScore, 3),
  };
}

function normalizeComet(comet = {}) {
  const sourceReservoir = String(
    comet?.classification?.sourceReservoir ||
      comet?.inputs?.sourceReservoir ||
      comet?.sourceReservoir ||
      "manual",
  );
  const volatileClass = String(
    comet?.inputs?.volatileClass ||
      comet?.classification?.volatileClass ||
      comet?.volatileClass ||
      "",
  );
  const volatileLabel = String(
    comet?.classification?.volatileLabel || comet?.display?.volatileClass || "",
  );
  const activeNow = comet?.activity?.activeNow === true || comet?.activeNow === true;
  const massLossKgPerS = finiteNonNegative(comet?.activity?.massLossKgPerS, 0);
  const radiusKm = finiteNonNegative(comet?.inputs?.nucleusRadiusKm ?? comet?.nucleusRadiusKm, 0);
  const dynamicalClass = String(comet?.classification?.dynamicalClass || "");
  const sourceScore =
    sourceReservoir === "oortCloud" ? 0.55 : sourceReservoir === "debrisDisk" ? 0.42 : 0.16;
  const volatileScore =
    volatileClass === "waterRich" || volatileClass === "mixed" || /h2o|water/i.test(volatileLabel)
      ? 0.38
      : volatileClass === "co2Rich" || volatileClass === "coRich"
        ? 0.25
        : 0.14;
  const activityScore = activeNow ? 0.22 : massLossKgPerS > 0 ? 0.16 : 0.04;
  const sizeScore = 0.12 * logRangeScore(radiusKm, 0.5, 20);
  const periodScore = dynamicalClass === "Long-period" ? 0.08 : 0.03;
  const deliveryScore = clamp(
    sourceScore + volatileScore + activityScore + sizeScore + periodScore,
    0,
    1,
  );

  return {
    id: comet?.inputs?.id || comet?.id || null,
    name: comet?.inputs?.name || comet?.name || null,
    sourceReservoir,
    volatileClass,
    activeNow,
    dynamicalClass,
    massLossKgPerS: round(massLossKgPerS, 6),
    deliveryScore: round(deliveryScore, 3),
  };
}

function combineMaxAverage(items, key) {
  const values = items
    .map((item) => Number(item?.[key]))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return 0;
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return clamp(0.65 * max + 0.35 * average, 0, 1);
}

function gasGiantArchitectureModifier(gasGiantArchitecture = null) {
  const source =
    gasGiantArchitecture && typeof gasGiantArchitecture === "object" ? gasGiantArchitecture : {};
  const shielding = clamp(toFinite(source.shieldingScore, 0.25), 0, 1);
  const scattering = clamp(toFinite(source.scatteringScore, 0.15), 0, 1);
  return clamp(1 - 0.28 * shielding + 0.22 * scattering, 0.55, 1.35);
}

function bombardmentEpochClass({ ageGyr, impactFluxScore }) {
  if (ageGyr < 0.1) return "formation-accretion";
  if (ageGyr < 0.7 || impactFluxScore >= 0.65) return "early-heavy-or-debris-rich";
  if (ageGyr < 1.5 || impactFluxScore >= 0.38) return "declining-bombardment";
  if (impactFluxScore >= 0.18) return "mature-with-reservoir-supply";
  return "mature-background";
}

export function buildSmallBodyReservoirContext({
  debrisDisks = [],
  oortCloud = null,
  comets = [],
  gasGiantArchitecture = null,
  ageGyr = 4.6,
} = {}) {
  const assumptions = [
    "Small-body routing is qualitative and does not solve stochastic impacts or crater-count dating.",
  ];
  const limitingFactors = [];
  const age = finiteNonNegative(ageGyr, 4.6);
  const diskSummaries = (Array.isArray(debrisDisks) ? debrisDisks : [])
    .filter(Boolean)
    .map(normalizeDisk);
  const cometSummaries = (Array.isArray(comets) ? comets : []).filter(Boolean).map(normalizeComet);
  const oort = normalizeOort(oortCloud);

  const debrisFluxScore = combineMaxAverage(diskSummaries, "fluxScore");
  const volatileDebrisScore = clamp(
    combineMaxAverage(
      diskSummaries.map((disk) => ({
        volatileScore: disk.volatileRich ? Math.max(disk.fluxScore, 0.18) : disk.fluxScore * 0.35,
      })),
      "volatileScore",
    ),
    0,
    1,
  );
  const explicitCometScore = combineMaxAverage(cometSummaries, "deliveryScore");
  const cometDeliveryScore = clamp(
    Math.max(explicitCometScore, oort.injectionScore * (oort.present ? 0.45 : 0)),
    0,
    1,
  );
  const youngFluxScore =
    age < 0.1 ? 0.85 : age < 0.7 ? 0.62 : age < 1.5 ? 0.38 : age < 3 ? 0.2 : 0.08;
  const architectureModifier = gasGiantArchitectureModifier(gasGiantArchitecture);
  const impactFluxScore = clamp(
    (0.24 * youngFluxScore +
      0.32 * debrisFluxScore +
      0.24 * oort.injectionScore +
      0.2 * cometDeliveryScore) *
      architectureModifier,
    0,
    1,
  );
  const volatileDeliveryScore = clamp(
    0.34 * volatileDebrisScore + 0.34 * oort.injectionScore + 0.32 * cometDeliveryScore,
    0,
    1,
  );

  if (!diskSummaries.length)
    assumptions.push("No debris disk context was available for this host frame.");
  if (!oort.present && oort.injectionRatePerMyr <= 0)
    assumptions.push("No active Oort-cloud injection context was available.");
  if (!cometSummaries.length) assumptions.push("No authored comet context was available.");
  if (debrisFluxScore > 0.6 && age > 5) {
    limitingFactors.push(
      "High debris flux in an old system should be interpreted as author-supplied or recently stirred.",
    );
  }

  const evidenceCount = [diskSummaries.length > 0, oort.present, cometSummaries.length > 0].filter(
    Boolean,
  ).length;
  const confidence =
    evidenceCount >= 2 ? CONFIDENCE.HIGH : evidenceCount === 1 ? CONFIDENCE.MEDIUM : CONFIDENCE.LOW;

  return makeContext({
    modelVersion: SMALL_BODY_RESERVOIR_MODEL_VERSION,
    status: CONTEXT_STATUS.SUPPORTED,
    confidence,
    inputs: {
      ageGyr: roundMaybe(age, 3),
      debrisDiskCount: diskSummaries.length,
      cometCount: cometSummaries.length,
      oortPresent: oort.present,
      oortInjectionRatePerYear: oort.injectionRatePerYear,
      oortInjectionRatePerMyr: oort.injectionRatePerMyr,
    },
    outputs: {
      debrisFluxScore: round(debrisFluxScore, 3),
      debrisFluxClass: reservoirClass(debrisFluxScore, {
        high: "debris-rich",
        medium: "debris-supported",
        low: "faint-debris",
        none: "debris-poor",
      }),
      oortInjectionScore: oort.injectionScore,
      oortInjectionClass: reservoirClass(oort.injectionScore, {
        high: "strong-injection",
        medium: "present-injection",
        low: "weak-injection",
        none: "no-injection",
      }),
      cometDeliveryScore: round(cometDeliveryScore, 3),
      cometDeliveryClass: reservoirClass(cometDeliveryScore, {
        high: "comet-rich",
        medium: "comet-supported",
        low: "sparse-comet-supply",
        none: "no-comet-supply",
      }),
      impactFluxScore: round(impactFluxScore, 3),
      impactFluxClass: fluxClass(impactFluxScore),
      volatileDeliveryScore: round(volatileDeliveryScore, 3),
      volatileDeliveryClass: fluxClass(volatileDeliveryScore),
      bombardmentEpochClass: bombardmentEpochClass({ ageGyr: age, impactFluxScore }),
      oortInjectionRatePerMyr: oort.injectionRatePerMyr,
      oortInjectionRatePerYear: oort.injectionRatePerYear,
      debrisDisks: diskSummaries,
      comets: cometSummaries,
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
