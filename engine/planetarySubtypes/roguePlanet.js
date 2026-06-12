import {
  OVERLAY_MODEL_VERSION,
  STEFAN_BOLTZMANN,
  compactObject,
  finiteOrNull,
  firstFinite,
  overlayReason,
  roundTo,
} from "./common.js";

function heatSupportLabel(heatFluxWm2) {
  if (heatFluxWm2 == null || heatFluxWm2 <= 0) return "no internal-heat support supplied";
  if (heatFluxWm2 >= 0.1) return "strong geothermal support";
  if (heatFluxWm2 >= 0.02) return "modest geothermal support";
  return "weak geothermal support";
}

function internalEquilibriumTempK(heatFluxWm2) {
  if (heatFluxWm2 == null || heatFluxWm2 <= 0) return null;
  return (heatFluxWm2 / STEFAN_BOLTZMANN) ** 0.25;
}

export function buildRoguePlanetOverlay(inputs = {}) {
  const internalHeatFluxWm2 = finiteOrNull(inputs.internalHeatFluxWm2);
  const tidalHeatFluxWm2 = finiteOrNull(inputs.tidalHeatFluxWm2);
  const totalHeatFluxWm2 = (internalHeatFluxWm2 || 0) + (tidalHeatFluxWm2 || 0) || null;
  const geothermalTempK = internalEquilibriumTempK(totalHeatFluxWm2);
  const support = heatSupportLabel(totalHeatFluxWm2);
  const insolationEarth = firstFinite(inputs.insolationEarth, inputs.irradiationEarth);
  const noStarContext =
    (inputs.hostFrameId == null || inputs.hostFrameId === "") &&
    (inputs.semiMajorAxisAu == null || inputs.semiMajorAxisAu <= 0) &&
    (insolationEarth == null || insolationEarth <= 0);

  const reasons = [
    overlayReason(
      "noStarThermalContext",
      "Rogue-world thermal interpretation is based on absent stellar flux.",
      noStarContext
        ? "No host orbit or stellar flux is active."
        : "Explicit rogue evidence is active.",
    ),
    overlayReason(
      "internalHeatSupport",
      "Internal and tidal heat set the available non-stellar energy floor.",
      support,
    ),
  ];
  const warnings = [];
  if (totalHeatFluxWm2 == null || totalHeatFluxWm2 < 0.02) {
    warnings.push(
      overlayReason(
        "lowInternalHeatSupport",
        "No-star surface conditions are highly limited without internal-heat support.",
        support,
        "warning",
      ),
    );
  }

  return {
    modelVersion: OVERLAY_MODEL_VERSION,
    overlayId: "roguePlanet",
    summary: `${support}; stellar-flux pages remain limited.`,
    metrics: compactObject({
      internalHeatFluxWm2: roundTo(internalHeatFluxWm2, 4),
      tidalHeatFluxWm2: roundTo(tidalHeatFluxWm2, 4),
      totalHeatFluxWm2: roundTo(totalHeatFluxWm2, 4),
      internalEquilibriumTempK: roundTo(geothermalTempK, 1),
      insolationEarth: roundTo(insolationEarth, 4),
    }),
    interpretation: compactObject({
      noStarContext,
      internalHeatSupport: support,
      thermalFloorSource: totalHeatFluxWm2 == null ? "unspecified" : "internal-plus-tidal heat",
    }),
    reasons,
    warnings,
  };
}
