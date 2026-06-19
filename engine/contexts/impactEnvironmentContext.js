import { clamp, round, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe, scoreToClass } from "./validation.js";

const MODEL_VERSION = "impact-environment-context-v1";
const SOURCE_KEYS = ["impactEnvironment"];

function sourceClass(score) {
  return scoreToClass(score, {
    high: "high",
    medium: "moderate",
    low: "low",
    none: "background",
    highAt: 0.72,
    mediumAt: 0.36,
    lowAt: 0.05,
  });
}

function dominantSource(scores) {
  let best = ["background", 0];
  for (const entry of Object.entries(scores)) {
    if (entry[1] > best[1]) best = entry;
  }
  return best[0];
}

export function buildImpactEnvironmentContext({
  ageGyr = 4.6,
  atmospherePressureAtm = 1,
  gravityG = 1,
  escapeVelocityKms = 11.2,
  debrisDisks = [],
  oortCloudContext = null,
  cometContext = null,
  smallBodyReservoirContext = null,
  gasGiantArchitecture = null,
  geodynamicsContext = null,
  hydrosphere = null,
  surfaceClimateContext = null,
} = {}) {
  const assumptions = ["Impact flux is qualitative and not crater-count dating."];
  const limitingFactors = [];
  const age = Math.max(0, toFinite(ageGyr, 4.6));
  const pressure = Math.max(0, toFinite(atmospherePressureAtm, 1));
  const gravity = Math.max(0.01, toFinite(gravityG, 1));
  const escape = Math.max(0.1, toFinite(escapeVelocityKms, 11.2));
  const youngFlux = age < 0.7 ? 0.8 : age < 1.5 ? 0.45 : age < 3 ? 0.22 : 0.12;
  const diskList = Array.isArray(debrisDisks) ? debrisDisks : [];
  const reservoirOutputs =
    smallBodyReservoirContext && typeof smallBodyReservoirContext === "object"
      ? smallBodyReservoirContext.outputs || {}
      : {};
  const directDebrisScore = clamp(
    diskList.reduce((sum, disk) => {
      const dust = Math.log10(1 + Math.max(0, toFinite(disk?.dustProductionKgPerYr, 0))) / 10;
      const mass = Math.log10(1 + Math.max(0, toFinite(disk?.estimatedMassMearth, 0))) / 2;
      return sum + clamp(0.55 * dust + 0.45 * mass, 0, 1);
    }, 0) / Math.max(1, diskList.length),
    0,
    1,
  );
  const debrisScore = Math.max(
    directDebrisScore,
    clamp(toFinite(reservoirOutputs.debrisFluxScore, 0), 0, 1),
  );
  const directOortScore = clamp(
    Math.log10(1 + Math.max(0, toFinite(oortCloudContext?.injectionRatePerMyr, 0))) / 2,
    0,
    1,
  );
  const oortScore = Math.max(
    directOortScore,
    clamp(toFinite(reservoirOutputs.oortInjectionScore, 0), 0, 1),
  );
  const directCometScore = cometContext ? 0.35 : 0;
  const cometScore = Math.max(
    directCometScore,
    clamp(toFinite(reservoirOutputs.cometDeliveryScore, 0), 0, 1),
  );
  const giantShield = clamp(toFinite(gasGiantArchitecture?.shieldingScore, 0.25), 0, 1);
  const sourceScores = {
    "inner-debris": debrisScore,
    oort: oortScore,
    comet: cometScore,
    background: youngFlux,
  };
  const rawFlux = clamp(
    0.35 * youngFlux + 0.35 * debrisScore + 0.2 * oortScore + 0.1 * cometScore,
    0,
    1,
  );
  const architectureModifier = clamp(
    1 - 0.35 * giantShield + 0.2 * (gasGiantArchitecture?.scatteringScore || 0),
    0.35,
    1.4,
  );
  const impactFluxScore = clamp(rawFlux * architectureModifier, 0, 1);
  const atmosphereFilterScore = clamp(Math.log10(1 + pressure * 20) / 1.7, 0, 1);
  const gravityRetentionScore = clamp(Math.log10(1 + gravity * escape) / 1.4, 0, 1);
  const resurfacingScore =
    geodynamicsContext?.outputs?.resurfacingPotentialClass === "active"
      ? 0.9
      : geodynamicsContext?.outputs?.resurfacingPotentialClass === "moderate"
        ? 0.55
        : geodynamicsContext?.outputs?.resurfacingPotentialClass === "limited"
          ? 0.25
          : 0.08;
  const erosionScore =
    geodynamicsContext?.outputs?.erosionPotentialClass === "strong"
      ? 0.8
      : geodynamicsContext?.outputs?.erosionPotentialClass === "moderate"
        ? 0.45
        : geodynamicsContext?.outputs?.erosionPotentialClass === "weak"
          ? 0.2
          : 0.05;
  const liquid = clamp(
    toFinite(hydrosphere?.surfaceAccessibleLiquidFraction ?? hydrosphere?.liquidOceanFraction, 0),
    0,
    1,
  );
  const preservationCapacity = clamp(
    (0.45 + 0.55 * gravityRetentionScore) *
      (1 - 0.55 * atmosphereFilterScore) *
      (1 - 0.55 * resurfacingScore) *
      (1 - 0.3 * erosionScore) *
      (1 - 0.12 * liquid),
    0,
    1,
  );
  const visibleRetentionScore = clamp(preservationCapacity * (0.35 + 0.65 * impactFluxScore), 0, 1);
  const sterilizationScore = clamp(
    impactFluxScore * (1 - 0.45 * atmosphereFilterScore) * (1 - 0.25 * liquid),
    0,
    1,
  );
  const volatileDeliveryScore = Math.max(
    clamp(0.4 * debrisScore + 0.35 * oortScore + 0.25 * cometScore, 0, 1),
    clamp(toFinite(reservoirOutputs.volatileDeliveryScore, 0), 0, 1),
  );

  if (diskList.length === 0 && !reservoirOutputs.debrisFluxClass)
    assumptions.push("No debris disk context was available.");
  if (!oortCloudContext && !reservoirOutputs.oortInjectionClass)
    assumptions.push("No Oort cloud injection context was available.");
  if (surfaceClimateContext?.status === "unknown") {
    limitingFactors.push(
      "Surface climate is unknown, so erosion and sterilization caveats are limited.",
    );
  }

  return makeContext({
    modelVersion: MODEL_VERSION,
    status: CONTEXT_STATUS.SUPPORTED,
    confidence:
      diskList.length || oortCloudContext || smallBodyReservoirContext
        ? CONFIDENCE.MEDIUM
        : CONFIDENCE.LOW,
    inputs: {
      ageGyr: roundMaybe(age, 3),
      atmospherePressureAtm: roundMaybe(pressure, 6),
      gravityG: roundMaybe(gravity, 3),
      escapeVelocityKms: roundMaybe(escape, 3),
      debrisDiskCount: diskList.length,
      smallBodyReservoirModelVersion: smallBodyReservoirContext?.modelVersion || null,
    },
    outputs: {
      impactFluxScore: round(impactFluxScore, 3),
      impactFluxClass: sourceClass(impactFluxScore),
      dominantSource: dominantSource(sourceScores),
      atmosphericFilteringClass: scoreToClass(atmosphereFilterScore, {
        high: "strong",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      resurfacingErasureClass: scoreToClass(resurfacingScore, {
        high: "strong",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      erosionErasureClass: scoreToClass(erosionScore, {
        high: "strong",
        medium: "moderate",
        low: "weak",
        none: "minimal",
      }),
      craterRetentionClass: sourceClass(visibleRetentionScore),
      surfaceAgeClass:
        visibleRetentionScore >= 0.65
          ? "ancient-cratered"
          : resurfacingScore >= 0.55
            ? "young-resurfaced"
            : "mixed-age",
      impactSterilizationRiskClass: sourceClass(sterilizationScore),
      volatileDeliveryClass: sourceClass(volatileDeliveryScore),
    },
    assumptions,
    limitingFactors,
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
