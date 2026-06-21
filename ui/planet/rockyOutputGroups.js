export const ROCKY_SUMMARY_LABELS = new Set([
  "Appearance",
  "Body Class",
  "Radius",
  "Gravity",
  "Avg Surface Temp",
  "Water Regime",
  "Inferred Ocean Coverage",
  "Climate State",
  "Habitability Index",
]);

export const ROCKY_IDENTITY_LABELS = new Set([
  "Body Class",
  "Composition",
  "Core Radius",
  "Suggested CMF",
]);

export const ROCKY_PHYSICAL_LABELS = new Set([
  "Radius",
  "Density",
  "Gravity",
  "Escape Velocity",
  "Oblateness",
  "Magnetic Field",
  "Magnetopause",
  "Wind Compression",
]);

export const ROCKY_ENVIRONMENT_LABELS = new Set([
  "Avg Surface Temp",
  "Climate State",
  "Atmospheric Collapse",
  "Atmosphere Trend",
  "Dominant Source",
  "Dominant Sink",
  "Stability Timescale",
  "Surface State",
  "Water Regime",
  "Inferred Ocean Coverage",
  "Exposed Land",
  "Coverage Confidence",
  "Mean Ocean Depth",
  "Rings",
  "Sky Colour (Sun High)",
  "Sky Colour (Low Sun)",
  "Vegetation Colour",
  "Vegetation (Twilight)",
  "Environment Forcing",
  "Stellar Wind Pressure",
  "Coupled Climate Tendency",
  "Photochemical Forcing",
  "Cloud Regime",
  "Heat Redistribution",
  "Prebiotic UV Flux",
  "Photochemical Haze",
]);

export const ROCKY_SYSTEM_LABELS = new Set([
  "Host frame",
  "Insolation",
  "Companion Flux",
  "Flux Variability",
  "Dynamical Stability",
  "Year Length",
  "Horizon Distance",
  "Star Apparent Size",
  "Transit Depth",
  "RV Semi-Amplitude",
]);

export const ROCKY_ACTIVITY_LABELS = new Set([
  "Moon Tidal Heating",
  "Tectonic Regime",
  "Outgassing",
  "Carbon Cycle",
]);

export const ROCKY_HABITABILITY_LABELS = new Set([
  "Earth Similarity Index",
  "Habitability Index",
  "Ocean Chemistry",
  "Biosignature Context",
  "Disequilibrium",
  "O2/O3 False Positive",
  "Methane Context",
  "CO Buildup Risk",
  "UV Shielding",
  "Prebiotic UV Window",
]);

const TECTONIC_PROBABILITY_KEYS = ["stagnant", "mobile", "episodic", "plutonicSquishy"];

export function buildRockyInteriorActivityItems(display = {}) {
  return [
    {
      label: "Interior Evolution",
      value: display.interiorEvolution,
      meta: display.interiorDynamoSupport,
    },
    {
      label: "Volcanic Longevity",
      value: display.volcanicLongevity,
      meta: display.mantleRecyclingSupport,
    },
  ];
}

export function normalizeRockyKpiItem(item, tipLabels = {}) {
  return {
    ...item,
    tip: item.tip || tipLabels[item.tipLabel] || tipLabels[item.label] || "",
    kpiClass: item.kpiClass ? `kpi--compact ${item.kpiClass}`.trim() : "kpi--compact",
  };
}

export function buildRockyOutputGroupItems(allRockyItems, labelSet, normalizeItem) {
  return allRockyItems.filter((item) => item && labelSet.has(item.label)).map(normalizeItem);
}

export function buildRockyOutputItemGroups(allRockyItems, normalizeItem) {
  return {
    summaryItems: buildRockyOutputGroupItems(allRockyItems, ROCKY_SUMMARY_LABELS, normalizeItem),
    identityItems: buildRockyOutputGroupItems(allRockyItems, ROCKY_IDENTITY_LABELS, normalizeItem),
    physicalItems: buildRockyOutputGroupItems(allRockyItems, ROCKY_PHYSICAL_LABELS, normalizeItem),
    environmentItems: buildRockyOutputGroupItems(
      allRockyItems,
      ROCKY_ENVIRONMENT_LABELS,
      normalizeItem,
    ),
    systemItems: buildRockyOutputGroupItems(allRockyItems, ROCKY_SYSTEM_LABELS, normalizeItem),
    activityItems: buildRockyOutputGroupItems(allRockyItems, ROCKY_ACTIVITY_LABELS, normalizeItem),
    habitabilityItems: buildRockyOutputGroupItems(
      allRockyItems,
      ROCKY_HABITABILITY_LABELS,
      normalizeItem,
    ),
  };
}

export function formatRockyTectonicProbabilities(probabilities = {}) {
  return TECTONIC_PROBABILITY_KEYS.map((regime) => {
    const label =
      regime === "plutonicSquishy"
        ? "Plut.-squishy"
        : regime.charAt(0).toUpperCase() + regime.slice(1);
    return `${label}: ${Math.round((probabilities[regime] || 0) * 100)}%`;
  }).join(" | ");
}
