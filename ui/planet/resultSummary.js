import { renderResultSummary } from "../resultSummary.js";
import {
  getGiantCompanionDisplayLabel,
  getHostClassValue,
  getHostLifetimeValue,
  getHostZoneLabel,
  formatHostZoneValue,
} from "./bodyAppearance.js";
import { hasLimitedSurfaceApplicability } from "./bodyClassificationSummary.js";

function cleanSummaryText(value, fallback = "unresolved") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function lowerSummaryPhrase(value, fallback = "unresolved") {
  const text = cleanSummaryText(value, fallback);
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function parseFirstSummaryNumber(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function formatSummaryTemperature(primary, secondary, fallback = "temperature unresolved") {
  const main = String(primary ?? "").trim();
  const detail = String(secondary ?? "").trim();
  if (main && detail) return `${main} (${detail})`;
  return main || detail || fallback;
}

export function renderPlanetResultSummary(container, summary = {}) {
  return renderResultSummary(container, summary, {
    id: "planetResultSummary",
    className: "planet-result-summary",
    subject: "Planet",
    ariaLabel: "Planet result summary",
  });
}

function inferRockyPlanetSummaryTone({ model, classificationSummary } = {}) {
  if (hasLimitedSurfaceApplicability(classificationSummary)) return "warning";
  const d = model?.derived || {};
  const habitabilityScore = parseFirstSummaryNumber(model?.display?.habitabilityIndex);
  if (d.liquidWaterPossible && Number.isFinite(habitabilityScore) && habitabilityScore >= 0.45) {
    return "good";
  }
  const climateText = `${model?.display?.climateState || ""} ${model?.display?.surfaceState || ""}`;
  if (/runaway|moist greenhouse|collapse|sterile|uninhabitable/i.test(climateText)) {
    return "warning";
  }
  return "neutral";
}

export function buildRockyPlanetResultSummary({ planet, model, classificationSummary } = {}) {
  const d = model?.derived || {};
  const name = cleanSummaryText(
    planet?.name || planet?.inputs?.name || model?.inputs?.name,
    "Planet",
  );
  const bodyClass = cleanSummaryText(model?.display?.bodyClass, "rocky body");
  const composition = cleanSummaryText(model?.display?.compositionClass, "composition unresolved");
  const waterRegime = cleanSummaryText(model?.display?.waterRegime, "water regime unresolved");
  const climateState = cleanSummaryText(model?.display?.climateState, "climate unresolved");
  const surfaceState = cleanSummaryText(model?.display?.surfaceState, waterRegime);
  const temperature = formatSummaryTemperature(model?.display?.tempK, model?.display?.tempC);
  const habitability = cleanSummaryText(model?.display?.habitabilityIndex, "unresolved");
  let finalCopy = d.liquidWaterPossible
    ? "Liquid surface water is currently possible under the solved climate and hydrosphere inputs."
    : "Liquid surface water is not favoured by the current climate and hydrosphere inputs.";
  if (hasLimitedSurfaceApplicability(classificationSummary)) {
    finalCopy =
      classificationSummary?.surfaceApplicability === "none"
        ? "Surface outputs are a solver projection because no accessible surface is indicated."
        : "Surface outputs should be treated as limited-confidence estimates for this body class.";
  }

  return {
    tone: inferRockyPlanetSummaryTone({ model, classificationSummary }),
    body: `${name} reads as ${lowerSummaryPhrase(bodyClass)} with ${lowerSummaryPhrase(
      composition,
    )}, ${lowerSummaryPhrase(waterRegime)}, and ${lowerSummaryPhrase(
      climateState,
    )} climate. Surface temperature is ${temperature}. Habitability Index is ${habitability}. ${finalCopy}`,
    items: [
      { label: "Focus", value: name },
      { label: "Surface", value: surfaceState },
      { label: "Habitability", value: habitability },
    ],
  };
}

export function buildVolatilePlanetResultSummary({
  body,
  model,
  classificationLabel,
  display = {},
  physical = {},
} = {}) {
  const name = cleanSummaryText(body?.name || model?.inputs?.name, "Volatile body");
  const classification = cleanSummaryText(classificationLabel, "volatile body");
  const envelopeState = cleanSummaryText(display.envelopeState, "envelope state unresolved");
  const temperature = cleanSummaryText(display.equilibriumTemp, "temperature unresolved");
  const radiusSource =
    physical.radiusSource === "observed"
      ? "the observed transit/photosphere radius"
      : "the modelled radius";

  return {
    tone: "neutral",
    body: `${name} reads as ${lowerSummaryPhrase(
      classification,
    )} with no accessible solid surface and ${lowerSummaryPhrase(
      envelopeState,
    )} envelope. Equilibrium temperature is ${temperature}. Transit/photosphere outputs use ${radiusSource}. Rocky surface habitability is not applicable; inspect moons or envelope survival for environmental constraints.`,
    items: [
      { label: "Focus", value: name },
      { label: "Surface", value: "No accessible solid surface" },
      { label: "Habitability", value: "Not surface-applicable" },
    ],
  };
}

export function buildBrownDwarfPlanetResultSummary({ giant, model, gasCalc } = {}) {
  const name = cleanSummaryText(giant?.name || gasCalc?.inputs?.name, "Brown dwarf");
  const classValue = cleanSummaryText(getHostClassValue(model), "brown dwarf");
  const coolingState = cleanSummaryText(getHostLifetimeValue(model), "cooling state unresolved");
  const zoneLabel = cleanSummaryText(getHostZoneLabel(model), "Current temperate zone");
  const zoneValue = cleanSummaryText(formatHostZoneValue(model), "zone unresolved");

  return {
    tone: "neutral",
    body: `${name} reads as a substellar companion (${classValue}) with ${lowerSummaryPhrase(
      coolingState,
    )}. ${zoneLabel} is ${zoneValue}. Direct Earth-like surface life is not applicable; inspect moons and orbital context for potential habitats.`,
    items: [
      { label: "Focus", value: name },
      { label: "Surface", value: "Substellar companion" },
      { label: "Habitability", value: "Moon/orbit-facing" },
    ],
  };
}

export function buildGasGiantPlanetResultSummary({ giant, model, classValue } = {}) {
  const name = cleanSummaryText(giant?.name || model?.inputs?.name, "Gas giant");
  const companion = cleanSummaryText(getGiantCompanionDisplayLabel(model), "gas giant");
  const cloudRegime = cleanSummaryText(classValue, "giant-planet cloud regime");
  const temperature = cleanSummaryText(model?.display?.equilibriumTemp, "temperature unresolved");
  const magneticField = cleanSummaryText(
    model?.display?.magneticField,
    "magnetic field unresolved",
  );

  return {
    tone: "neutral",
    body: `${name} reads as ${lowerSummaryPhrase(companion)} with ${lowerSummaryPhrase(
      cloudRegime,
    )} cloud regime. Equilibrium temperature is ${temperature}. Magnetic field is ${magneticField}. Direct surface habitability is not applicable; inspect moons for potential habitats.`,
    items: [
      { label: "Focus", value: name },
      { label: "Surface", value: "No solid surface" },
      { label: "Habitability", value: "Moon-facing" },
    ],
  };
}
