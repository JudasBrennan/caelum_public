import { queueGuidedCreationLaunch } from "./guidedCreation/launchState.js";
import { createMoonFromInputs } from "./store.js";

function buildMoonDraftDefaults(bodyType = "planet") {
  const isGasGiant = String(bodyType || "") === "gasGiant";
  return {
    name: "Luna",
    originPathway: "auto",
    semiMajorAxisKm: isGasGiant ? 500000 : 384748,
    eccentricity: isGasGiant ? 0.01 : 0.055,
    inclinationDeg: isGasGiant ? 1 : 5.15,
    massMoon: 1.0,
    densityGcm3: isGasGiant ? 3.0 : 3.34,
    albedo: isGasGiant ? 0.2 : 0.136,
  };
}

export function createMoonDraftForParent(bodyType, bodyId) {
  const parentId = bodyId == null || bodyId === "" ? null : String(bodyId);
  return createMoonFromInputs(buildMoonDraftDefaults(bodyType), {
    name: "New Moon",
    planetId: parentId,
  });
}

export function launchGuidedMoonForParent(bodyType, bodyId, { sourcePage = "" } = {}) {
  const world = createMoonDraftForParent(bodyType, bodyId);
  queueGuidedCreationLaunch({
    objectType: "moon",
    uxMode: "guided",
    sourcePage,
  });
  location.hash = "#/moon";
  return world;
}
