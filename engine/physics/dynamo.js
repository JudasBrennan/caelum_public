import { clamp, round, toFinite } from "../utils.js";

export function buildSolidBodyDynamoContext({
  bodyType = "moon",
  massEarth = 0,
  coreMassFraction = 0,
  metalFraction = 0,
  differentiatedInterior = null,
  internalHeatFluxWm2 = 0,
  tidalHeatingWm2 = 0,
  radiogenicHeatingWm2 = 0,
  rotationPeriodHours = null,
  solidBodyStructure = null,
} = {}) {
  const structure =
    solidBodyStructure && typeof solidBodyStructure === "object" ? solidBodyStructure : {};
  const mass = Math.max(toFinite(massEarth, structure.massEarth), 0);
  const core = clamp(
    Math.max(toFinite(coreMassFraction, 0), toFinite(structure.coreMassFraction, 0)),
    0,
    1,
  );
  const metal = clamp(Math.max(toFinite(metalFraction, 0), core), 0, 1);
  const heatFlux = Math.max(toFinite(internalHeatFluxWm2, 0), 0);
  const tidalHeat = Math.max(toFinite(tidalHeatingWm2, 0), 0);
  const radiogenicHeat = Math.max(toFinite(radiogenicHeatingWm2, 0), 0);
  const rotationHours = Math.max(toFinite(rotationPeriodHours, 0), 0);
  const differentiated =
    differentiatedInterior === true ||
    structure.differentiatedInterior === true ||
    String(structure.structureClass || "").includes("differentiated") ||
    String(structure.structureClass || "") === "iron-rich-body";

  const massScore = clamp((mass - 0.008) / 0.025, 0, 1);
  const coreScore = clamp((0.65 * core + 0.35 * metal - 0.04) / 0.28, 0, 1);
  const heatScore = clamp((heatFlux - 0.0015) / 0.035, 0, 1);
  const tidalBoost = clamp(tidalHeat * 18, 0, 0.25);
  const radiogenicBoost = clamp(radiogenicHeat * 8, 0, 0.2);
  const rotationScore =
    rotationHours > 0 ? clamp(Math.log10(1 + 400 / rotationHours) / 1.25, 0.18, 1) : 0.45;
  const differentiationScore = differentiated ? 1 : clamp((coreScore + massScore) / 2, 0, 0.55);

  const dynamoScore = clamp(
    0.28 * differentiationScore +
      0.24 * massScore +
      0.22 * coreScore +
      0.16 * heatScore +
      0.06 * rotationScore +
      tidalBoost +
      radiogenicBoost,
    0,
    1,
  );
  const dynamoPlausibilityClass =
    dynamoScore >= 0.72
      ? "plausible-current-dynamo"
      : dynamoScore >= 0.52
        ? "marginal-current-dynamo"
        : dynamoScore >= 0.28
          ? "relict-or-weak-dynamo"
          : "no-current-dynamo";
  const fieldStrengthRelEarth =
    dynamoScore >= 0.52 ? round(clamp(0.02 + dynamoScore * 0.24, 0, 0.32), 4) : 0;
  const caveats = [
    "Dynamo output is a bounded plausibility screen, not a core entropy or induction simulation.",
  ];
  if (!differentiated) caveats.push("Differentiation is weak or inferred.");
  if (String(bodyType || "").toLowerCase() === "moon" && tidalHeat > radiogenicHeat * 2) {
    caveats.push("Tidal heat can help maintain activity but does not guarantee a metallic dynamo.");
  }

  return {
    modelVersion: "solid-body-dynamo-v1",
    bodyType,
    dynamoScore: round(dynamoScore, 4),
    dynamoPlausibilityClass,
    fieldStrengthRelEarth,
    massScore: round(massScore, 3),
    coreScore: round(coreScore, 3),
    heatScore: round(heatScore, 3),
    rotationScore: round(rotationScore, 3),
    differentiationScore: round(differentiationScore, 3),
    confidence: structure.confidence || (differentiated ? "medium" : "low"),
    caveats,
  };
}
