import {
  applySelectedGasGiantPatch,
  applySelectedPlanetInputs,
  getSelectedGasGiant,
  getSelectedPlanet,
  loadWorld,
} from "../store.js";
import { createGuidedContextFingerprint } from "../guidedCreation/sessionState.js";

export function getRockyGuidedSessionTarget() {
  const world = loadWorld();
  const selectedPlanet = getSelectedPlanet(world);
  return {
    objectKey: selectedPlanet?.id || "",
    contextFingerprint: createGuidedContextFingerprint({
      bodyType: "planet",
      planetId: selectedPlanet?.id || "",
      inputs: selectedPlanet?.inputs || world.planet || null,
    }),
  };
}

export function getGasGiantGuidedSessionTarget() {
  const world = loadWorld();
  const selectedGasGiant = getSelectedGasGiant(world);
  return {
    objectKey: selectedGasGiant?.id || "",
    contextFingerprint: createGuidedContextFingerprint({
      bodyType: "gasGiant",
      gasGiantId: selectedGasGiant?.id || "",
      inputs: selectedGasGiant || null,
    }),
  };
}

export function applyRockyPresetInputs(nextInputs, { noticeLabel = "Rocky preset", render } = {}) {
  const appliedWorld = applySelectedPlanetInputs(nextInputs);
  if (!appliedWorld) return null;
  render?.();
  return {
    appliedInputs: nextInputs,
    noticeLabel,
  };
}

export function applyRockyGuidedRecommendation(
  recommendation,
  { noticeLabel = "Guided rocky world", render } = {},
) {
  const applied = applyRockyPresetInputs(recommendation?.applyPayload?.objectInputs || {}, {
    noticeLabel,
    render,
  });
  return {
    appliedInputs: applied?.appliedInputs || null,
  };
}

export function applyGasGiantPresetInputs(
  nextInputs,
  { noticeLabel = "Gas giant preset", render } = {},
) {
  const appliedWorld = applySelectedGasGiantPatch(nextInputs);
  if (!appliedWorld) return null;
  render?.();
  return {
    appliedInputs: nextInputs,
    noticeLabel,
  };
}

export function applyGasGiantGuidedRecommendation(
  recommendation,
  { noticeLabel = "Guided gas giant", render } = {},
) {
  const applied = applyGasGiantPresetInputs(recommendation?.applyPayload?.objectInputs || {}, {
    noticeLabel,
    render,
  });
  return {
    appliedInputs: applied?.appliedInputs || null,
  };
}
