export const ROCKY_SUMMARY_LABELS = new Set([
  "Appearance",
  "Body Class",
  "Radius",
  "Gravity",
  "Avg Surface Temp",
  "Water Regime",
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

export function formatRockyTectonicProbabilities(probabilities = {}) {
  return TECTONIC_PROBABILITY_KEYS.map((regime) => {
    const label =
      regime === "plutonicSquishy"
        ? "Plut.-squishy"
        : regime.charAt(0).toUpperCase() + regime.slice(1);
    return `${label}: ${Math.round((probabilities[regime] || 0) * 100)}%`;
  }).join(" | ");
}
