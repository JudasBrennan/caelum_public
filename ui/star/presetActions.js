import { createGuidedContextFingerprint } from "../guidedCreation/sessionState.js";

export function createStarPresetActions({
  defaults,
  state,
  getFocusedStarEditorId,
  getStarDraftState,
  assignStarDraftState,
  applyStarSystemInputs,
  syncFocusedStarEditorInputs,
  setDerivMode,
  persistState,
  render,
}) {
  function getStarGuidedSessionTarget() {
    const targetStarId = getFocusedStarEditorId();
    const activeStar = getStarDraftState(targetStarId, state);
    return {
      objectKey: targetStarId,
      contextFingerprint: createGuidedContextFingerprint({
        name: activeStar.name,
        massMsol: activeStar.massMsol,
        ageGyr: state.ageGyr,
        metallicityFeH: state.metallicityFeH,
        physicsMode: activeStar.physicsMode,
        advancedDerivationMode: activeStar.advancedDerivationMode,
        radiusRsolOverride: activeStar.radiusRsolOverride,
        luminosityLsolOverride: activeStar.luminosityLsolOverride,
        tempKOverride: activeStar.tempKOverride,
        evolutionMode: state.evolutionMode,
        activityModelVersion: state.activityModelVersion,
        topologyKind: state.topologyKind,
        defaultHostFrameId: state.defaultHostFrameId,
      }),
    };
  }

  function applyStarPresetInputs(
    nextInputs,
    { noticeLabel = "Star preset", systemInputs = null } = {},
  ) {
    const targetStarId = getFocusedStarEditorId();
    const fallbackStar = getStarDraftState(targetStarId, state);
    assignStarDraftState(targetStarId, {
      name: String(nextInputs?.name || fallbackStar.name || defaults.name),
      massMsol: Number(nextInputs?.massMsol ?? fallbackStar.massMsol),
      radiusRsolOverride: null,
      luminosityLsolOverride: null,
      tempKOverride: null,
      physicsMode: "simple",
      advancedDerivationMode: "rl",
    });
    state.ageGyr = Number(nextInputs?.ageGyr ?? state.ageGyr);
    state.metallicityFeH = Number(nextInputs?.metallicityFeH ?? state.metallicityFeH) || 0;
    state.evolutionMode =
      nextInputs?.evolutionMode === "zams" || nextInputs?.evolutionMode === "staticMainSequence"
        ? "zams"
        : "evolved";
    state.activityModelVersion = "v2";
    applyStarSystemInputs(systemInputs);
    syncFocusedStarEditorInputs();
    setDerivMode("rl");
    persistState();
    render();
    const appliedStar = getStarDraftState(targetStarId, state);
    return {
      appliedInputs: {
        name: appliedStar.name,
        massMsol: appliedStar.massMsol,
        ageGyr: state.ageGyr,
        metallicityFeH: state.metallicityFeH,
        physicsMode: appliedStar.physicsMode,
        advancedDerivationMode: appliedStar.advancedDerivationMode,
        radiusRsolOverride: appliedStar.radiusRsolOverride,
        luminosityLsolOverride: appliedStar.luminosityLsolOverride,
        tempKOverride: appliedStar.tempKOverride,
        evolutionMode: state.evolutionMode,
        activityModelVersion: state.activityModelVersion,
      },
      noticeLabel,
    };
  }

  function applyStarGuidedRecommendation(recommendation, { noticeLabel = "Guided star" } = {}) {
    const applied = applyStarPresetInputs(recommendation?.applyPayload?.objectInputs || {}, {
      noticeLabel,
      systemInputs: recommendation?.applyPayload?.systemInputs || null,
    });
    return {
      appliedInputs: applied?.appliedInputs || null,
    };
  }

  return {
    applyStarGuidedRecommendation,
    applyStarPresetInputs,
    getStarGuidedSessionTarget,
  };
}
