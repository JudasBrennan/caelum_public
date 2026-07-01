import { clamp } from "../../engine/utils.js";
import { solveStellarClassInput } from "../../engine/starClassSolver.js";

export function createStarInputController({
  defaults = {},
  getState,
  wrap,
  elements = {},
  radioGroups = {},
  buttons = {},
  helpers = {},
} = {}) {
  const {
    activeHostFrameEl,
    ageEl,
    binaryArgPeriapsisEl,
    binaryEccentricityEl,
    binaryInclinationEl,
    binaryMeanAnomalyEl,
    binarySemiMajorAxisEl,
    companionMassEl,
    companionNameEl,
    luminosityOverrideEl,
    massEl,
    metallicityEl,
    nameEl,
    pairEditorTargetEl,
    quadOuterArgPeriapsisEl,
    quadOuterEccentricityEl,
    quadOuterInclinationEl,
    quadOuterMeanAnomalyEl,
    quadOuterSemiMajorAxisEl,
    quaternaryMassEl,
    quaternaryNameEl,
    radiusOverrideEl,
    starEditorTargetEl,
    stellarClassApplyBtn,
    stellarClassInputEl,
    stellarClassStatusEl,
    tempOverrideEl,
    tertiaryMassEl,
    tertiaryNameEl,
    topologyKindEl,
    topologyCardGridEl,
    quadLayoutCardGridEl,
    editorInspectorModeEl,
    editorTargetPillsEl,
    topologyMapNodesEl,
    tripleOuterArgPeriapsisEl,
    tripleOuterEccentricityEl,
    tripleOuterInclinationEl,
    tripleOuterMeanAnomalyEl,
    tripleOuterSemiMajorAxisEl,
  } = elements;
  const {
    evolutionModeRadios = [],
    physicsDerivRadios = [],
    physicsModeRadios = [],
    quadLayoutRadios = [],
  } = radioGroups;
  const {
    btnReset,
    btnSol,
    starCreateGuidedBtn,
    starCreateQuickBtn,
    tempClearBtn,
    luminosityClearBtn,
    radiusClearBtn,
  } = buttons;
  const {
    HOST_COMPONENT_MASS_MIN = 0,
    assignStarDraftState,
    buildPreviewWorldFromDraft,
    buildStellarSystemFromDraft,
    confirmDestructiveAction,
    getDerivMode,
    getFocusedStarEditorId,
    getStarDraftState,
    getStarEditorFieldConfig,
    normalizeQuadLayoutKind,
    normalizeTopologyHostFrameId,
    openStarGuidedFlow,
    openStarGuidedQuickPicker,
    persistState,
    planStellarSystemChange,
    render,
    sanitiseCompanionName,
    sanitiseName,
    sanitiseQuaternaryName,
    sanitiseTertiaryName,
    setEditorMode,
    setSelectedEditorTarget,
    setDerivMode,
    syncBoundInputs,
    syncFocusedStarEditorInputs,
    updateTopologyUI,
  } = helpers;

  let hydrating = false;

  function readOptionalNumberInput(inputEl) {
    const raw = String(inputEl?.value ?? "");
    if (!raw.trim()) return null;
    const asNumber = inputEl?.valueAsNumber;
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function readClampedNumberInput(inputEl, min, max, fallback, { commit = false } = {}) {
    const parsed = readOptionalNumberInput(inputEl);
    if (!Number.isFinite(parsed)) {
      if (commit && Number.isFinite(fallback) && inputEl) inputEl.value = String(fallback);
      return fallback;
    }
    const clamped = clamp(parsed, min, max);
    if (commit && inputEl) inputEl.value = String(clamped);
    return clamped;
  }

  function readPositiveOverride(inputEl, { commit = false } = {}) {
    const parsed = readOptionalNumberInput(inputEl);
    if (!(parsed > 0)) {
      if (commit && inputEl) inputEl.value = "";
      return null;
    }
    return parsed;
  }

  function sanitizeFocusedStarName(starId, value, commit = false) {
    if (starId === "star_a") {
      return commit ? sanitiseName(value) : sanitiseName(String(value ?? ""));
    }
    if (starId === "star_b") {
      return commit ? sanitiseCompanionName(value) : sanitiseCompanionName(String(value ?? ""));
    }
    if (starId === "star_c") {
      return commit ? sanitiseTertiaryName(value) : sanitiseTertiaryName(String(value ?? ""));
    }
    return commit ? sanitiseQuaternaryName(value) : sanitiseQuaternaryName(String(value ?? ""));
  }

  function setClassStatus(message, kind = "info") {
    if (!stellarClassStatusEl) return;
    stellarClassStatusEl.textContent = message;
    stellarClassStatusEl.dataset.kind = kind;
  }

  function formatResolvedMass(massMsol) {
    const mass = Number(massMsol);
    if (!Number.isFinite(mass)) return "";
    return mass < 0.1 ? mass.toFixed(5) : mass.toFixed(4);
  }

  function applyClassInput({ commit = true } = {}) {
    const state = getState();
    const focusedStarId = getFocusedStarEditorId();
    const result = solveStellarClassInput(stellarClassInputEl?.value || "", {
      ageGyr: state.ageGyr,
      metallicityFeH: state.metallicityFeH,
    });

    if (!result.ok) {
      setClassStatus(result.message || "Could not apply that stellar class.", "error");
      return result;
    }

    assignStarDraftState(focusedStarId, {
      massMsol: result.resolvedMassMsol,
      radiusRsolOverride: null,
      luminosityLsolOverride: null,
      tempKOverride: null,
      physicsMode: "simple",
      advancedDerivationMode: "rl",
    });
    if (result.regime === "star") {
      state.evolutionMode = "evolved";
    }

    setDerivMode?.("rl");
    syncFocusedStarEditorInputs();
    if (commit) {
      persistState();
    }
    render();

    const noticeText = result.notices?.length ? ` ${result.notices.join(" ")}` : "";
    setClassStatus(
      `Applied ${result.requestedLabel} as ${formatResolvedMass(result.resolvedMassMsol)} Msol (${result.resolvedClass}).${noticeText}`,
      "ok",
    );
    return result;
  }

  function applyFromInputs({ commit = false } = {}) {
    if (hydrating) return;
    hydrating = true;
    const state = getState();
    const focusedStarId = getFocusedStarEditorId();
    const focusedStar = getStarDraftState(focusedStarId, state);
    state.topologyKind = ["binary", "triple", "quad"].includes(topologyKindEl?.value)
      ? topologyKindEl.value
      : "single";
    state.quadLayoutKind = normalizeQuadLayoutKind(
      wrap.querySelector('input[name="quadLayoutKind"]:checked')?.value,
      state.quadLayoutKind,
    );
    state.defaultHostFrameId = normalizeTopologyHostFrameId(
      activeHostFrameEl?.value,
      state.topologyKind,
      state.quadLayoutKind,
    );

    const nextFocusedStarName = sanitizeFocusedStarName(focusedStarId, nameEl?.value, commit);
    assignStarDraftState(focusedStarId, { name: nextFocusedStarName });
    if (commit && nameEl) nameEl.value = nextFocusedStarName;

    assignStarDraftState(focusedStarId, {
      massMsol: readClampedNumberInput(massEl, HOST_COMPONENT_MASS_MIN, 100, focusedStar.massMsol, {
        commit,
      }),
    });
    state.ageGyr = readClampedNumberInput(ageEl, 0, 20, state.ageGyr, { commit });
    state.metallicityFeH = readClampedNumberInput(metallicityEl, -3, 1, state.metallicityFeH, {
      commit,
    });
    state.binarySemiMajorAxisAu = readClampedNumberInput(
      binarySemiMajorAxisEl,
      0.001,
      100000,
      state.binarySemiMajorAxisAu,
      { commit },
    );
    state.binaryEccentricity = readClampedNumberInput(
      binaryEccentricityEl,
      0,
      0.95,
      state.binaryEccentricity,
      { commit },
    );
    state.binaryInclinationDeg = readClampedNumberInput(
      binaryInclinationEl,
      0,
      180,
      state.binaryInclinationDeg,
      { commit },
    );
    state.binaryArgPeriapsisDeg = readClampedNumberInput(
      binaryArgPeriapsisEl,
      0,
      360,
      state.binaryArgPeriapsisDeg,
      { commit },
    );
    state.binaryMeanAnomalyDeg = readClampedNumberInput(
      binaryMeanAnomalyEl,
      0,
      360,
      state.binaryMeanAnomalyDeg,
      { commit },
    );
    state.tripleOuterSemiMajorAxisAu = readClampedNumberInput(
      tripleOuterSemiMajorAxisEl,
      0.001,
      100000,
      state.tripleOuterSemiMajorAxisAu,
      { commit },
    );
    state.tripleOuterEccentricity = readClampedNumberInput(
      tripleOuterEccentricityEl,
      0,
      0.95,
      state.tripleOuterEccentricity,
      { commit },
    );
    state.tripleOuterInclinationDeg = readClampedNumberInput(
      tripleOuterInclinationEl,
      0,
      180,
      state.tripleOuterInclinationDeg,
      { commit },
    );
    state.tripleOuterArgPeriapsisDeg = readClampedNumberInput(
      tripleOuterArgPeriapsisEl,
      0,
      360,
      state.tripleOuterArgPeriapsisDeg,
      { commit },
    );
    state.tripleOuterMeanAnomalyDeg = readClampedNumberInput(
      tripleOuterMeanAnomalyEl,
      0,
      360,
      state.tripleOuterMeanAnomalyDeg,
      { commit },
    );
    state.quadOuterSemiMajorAxisAu = readClampedNumberInput(
      quadOuterSemiMajorAxisEl,
      0.001,
      100000,
      state.quadOuterSemiMajorAxisAu,
      { commit },
    );
    state.quadOuterEccentricity = readClampedNumberInput(
      quadOuterEccentricityEl,
      0,
      0.95,
      state.quadOuterEccentricity,
      { commit },
    );
    state.quadOuterInclinationDeg = readClampedNumberInput(
      quadOuterInclinationEl,
      0,
      180,
      state.quadOuterInclinationDeg,
      { commit },
    );
    state.quadOuterArgPeriapsisDeg = readClampedNumberInput(
      quadOuterArgPeriapsisEl,
      0,
      360,
      state.quadOuterArgPeriapsisDeg,
      { commit },
    );
    state.quadOuterMeanAnomalyDeg = readClampedNumberInput(
      quadOuterMeanAnomalyEl,
      0,
      360,
      state.quadOuterMeanAnomalyDeg,
      { commit },
    );

    const nextPhysicsMode =
      wrap.querySelector('input[name="physicsMode"]:checked')?.value || "simple";
    const nextDerivationMode = getDerivMode();
    assignStarDraftState(focusedStarId, {
      physicsMode: nextPhysicsMode,
      advancedDerivationMode: nextDerivationMode,
    });
    state.evolutionMode =
      wrap.querySelector('input[name="evolutionMode"]:checked')?.value || "evolved";
    state.defaultHostFrameId = normalizeTopologyHostFrameId(
      state.defaultHostFrameId,
      state.topologyKind,
      state.quadLayoutKind,
    );

    if (nextPhysicsMode === "advanced") {
      assignStarDraftState(focusedStarId, {
        radiusRsolOverride:
          elements.radiusOverrideRowEl?.style.display !== "none"
            ? readPositiveOverride(radiusOverrideEl, { commit })
            : null,
        luminosityLsolOverride:
          elements.luminosityOverrideRowEl?.style.display !== "none"
            ? readPositiveOverride(luminosityOverrideEl, { commit })
            : null,
        tempKOverride:
          elements.tempOverrideRowEl?.style.display !== "none"
            ? readPositiveOverride(tempOverrideEl, { commit })
            : null,
      });
    }

    if (commit) {
      syncBoundInputs();
      persistState();
    }
    render({ preserveFocusedDraft: !commit });
    hydrating = false;
  }

  function buildDraftStateForTopologyChange({
    topologyKind = getState().topologyKind,
    quadLayoutKind = getState().quadLayoutKind,
  } = {}) {
    const state = getState();
    const nextTopologyKind = ["binary", "triple", "quad"].includes(topologyKind)
      ? topologyKind
      : "single";
    const nextQuadLayoutKind = normalizeQuadLayoutKind(quadLayoutKind, state.quadLayoutKind);
    return {
      ...state,
      topologyKind: nextTopologyKind,
      quadLayoutKind: nextQuadLayoutKind,
      defaultHostFrameId: normalizeTopologyHostFrameId(
        activeHostFrameEl?.value || state.defaultHostFrameId,
        nextTopologyKind,
        nextQuadLayoutKind,
      ),
    };
  }

  async function commitTopologyChangeIfConfirmed({
    topologyKind = getState().topologyKind,
    quadLayoutKind = getState().quadLayoutKind,
  } = {}) {
    const state = getState();
    const nextDraftState = buildDraftStateForTopologyChange({
      topologyKind,
      quadLayoutKind,
    });
    const previewWorld = buildPreviewWorldFromDraft(state);
    const changePlan = planStellarSystemChange(buildStellarSystemFromDraft(nextDraftState), {
      world: previewWorld,
      currentStellarSystem: previewWorld.stellarSystem,
    });
    if (changePlan) {
      const confirmed = await confirmDestructiveAction(changePlan);
      if (!confirmed) {
        render({ preserveFocusedDraft: true });
        return false;
      }
    }
    applyFromInputs({ commit: true });
    return true;
  }

  function applyCompatStarInputs(starId, { commit = false } = {}) {
    const state = getState();
    const config = {
      star_b: {
        nameEl: companionNameEl,
        massEl: companionMassEl,
        sanitiseName: sanitiseCompanionName,
      },
      star_c: {
        nameEl: tertiaryNameEl,
        massEl: tertiaryMassEl,
        sanitiseName: sanitiseTertiaryName,
      },
      star_d: {
        nameEl: quaternaryNameEl,
        massEl: quaternaryMassEl,
        sanitiseName: sanitiseQuaternaryName,
      },
    }[starId];
    if (!config) return;
    assignStarDraftState(starId, {
      name: commit
        ? config.sanitiseName(config.nameEl?.value)
        : config.sanitiseName(String(config.nameEl?.value ?? "")),
      massMsol: readClampedNumberInput(
        config.massEl,
        HOST_COMPONENT_MASS_MIN,
        100,
        getStarDraftState(starId, state).massMsol,
        { commit },
      ),
    });
    if (commit) {
      config.nameEl.value = getStarDraftState(starId, state).name;
      config.massEl.value = getStarDraftState(starId, state).massMsol;
      persistState();
    }
    render();
  }

  function applyStarSystemInputs(systemInputs = null) {
    if (!systemInputs || typeof systemInputs !== "object") return null;

    const state = getState();
    const nextTopologyKind = ["binary", "triple", "quad"].includes(systemInputs.topologyKind)
      ? systemInputs.topologyKind
      : "single";

    state.topologyKind = nextTopologyKind;
    if (nextTopologyKind === "quad") {
      state.quadLayoutKind = normalizeQuadLayoutKind(
        systemInputs.quadLayoutKind,
        state.quadLayoutKind,
      );
    } else {
      state.quadLayoutKind = normalizeQuadLayoutKind(state.quadLayoutKind);
    }
    if (typeof systemInputs.companionName === "string") {
      state.companionName = sanitiseCompanionName(systemInputs.companionName);
    }
    if (systemInputs.companionMassMsol != null) {
      state.companionMassMsol = clamp(
        Number(systemInputs.companionMassMsol),
        HOST_COMPONENT_MASS_MIN,
        100,
      );
    }
    if (systemInputs.binarySemiMajorAxisAu != null) {
      state.binarySemiMajorAxisAu = Math.max(Number(systemInputs.binarySemiMajorAxisAu), 0.001);
    }
    if (systemInputs.binaryEccentricity != null) {
      state.binaryEccentricity = clamp(Number(systemInputs.binaryEccentricity), 0, 0.95);
    }
    if (systemInputs.binaryInclinationDeg != null) {
      state.binaryInclinationDeg = clamp(Number(systemInputs.binaryInclinationDeg), 0, 180);
    }
    if (systemInputs.binaryArgPeriapsisDeg != null) {
      state.binaryArgPeriapsisDeg = clamp(Number(systemInputs.binaryArgPeriapsisDeg), 0, 360);
    }
    if (systemInputs.binaryMeanAnomalyDeg != null) {
      state.binaryMeanAnomalyDeg = clamp(Number(systemInputs.binaryMeanAnomalyDeg), 0, 360);
    }
    if (typeof systemInputs.tertiaryName === "string") {
      state.tertiaryName = sanitiseTertiaryName(systemInputs.tertiaryName);
    }
    if (systemInputs.tertiaryMassMsol != null) {
      state.tertiaryMassMsol = clamp(
        Number(systemInputs.tertiaryMassMsol),
        HOST_COMPONENT_MASS_MIN,
        100,
      );
    }
    if (systemInputs.tripleOuterSemiMajorAxisAu != null) {
      state.tripleOuterSemiMajorAxisAu = Math.max(
        Number(systemInputs.tripleOuterSemiMajorAxisAu),
        0.001,
      );
    }
    if (systemInputs.tripleOuterEccentricity != null) {
      state.tripleOuterEccentricity = clamp(Number(systemInputs.tripleOuterEccentricity), 0, 0.95);
    }
    if (systemInputs.tripleOuterInclinationDeg != null) {
      state.tripleOuterInclinationDeg = clamp(
        Number(systemInputs.tripleOuterInclinationDeg),
        0,
        180,
      );
    }
    if (systemInputs.tripleOuterArgPeriapsisDeg != null) {
      state.tripleOuterArgPeriapsisDeg = clamp(
        Number(systemInputs.tripleOuterArgPeriapsisDeg),
        0,
        360,
      );
    }
    if (systemInputs.tripleOuterMeanAnomalyDeg != null) {
      state.tripleOuterMeanAnomalyDeg = clamp(
        Number(systemInputs.tripleOuterMeanAnomalyDeg),
        0,
        360,
      );
    }
    if (typeof systemInputs.quaternaryName === "string") {
      state.quaternaryName = sanitiseQuaternaryName(systemInputs.quaternaryName);
    }
    if (systemInputs.quaternaryMassMsol != null) {
      state.quaternaryMassMsol = clamp(
        Number(systemInputs.quaternaryMassMsol),
        HOST_COMPONENT_MASS_MIN,
        100,
      );
    }
    if (systemInputs.quadOuterSemiMajorAxisAu != null) {
      state.quadOuterSemiMajorAxisAu = Math.max(
        Number(systemInputs.quadOuterSemiMajorAxisAu),
        0.001,
      );
    }
    if (systemInputs.quadOuterEccentricity != null) {
      state.quadOuterEccentricity = clamp(Number(systemInputs.quadOuterEccentricity), 0, 0.95);
    }
    if (systemInputs.quadOuterInclinationDeg != null) {
      state.quadOuterInclinationDeg = clamp(Number(systemInputs.quadOuterInclinationDeg), 0, 180);
    }
    if (systemInputs.quadOuterArgPeriapsisDeg != null) {
      state.quadOuterArgPeriapsisDeg = clamp(Number(systemInputs.quadOuterArgPeriapsisDeg), 0, 360);
    }
    if (systemInputs.quadOuterMeanAnomalyDeg != null) {
      state.quadOuterMeanAnomalyDeg = clamp(Number(systemInputs.quadOuterMeanAnomalyDeg), 0, 360);
    }

    state.defaultHostFrameId = normalizeTopologyHostFrameId(
      systemInputs.defaultHostFrameId,
      nextTopologyKind,
      state.quadLayoutKind,
    );

    hydrateInputs({ syncFocusedStarInputs: false });
    updateTopologyUI();
    if (activeHostFrameEl) activeHostFrameEl.value = state.defaultHostFrameId;

    return {
      topologyKind: state.topologyKind,
      defaultHostFrameId: state.defaultHostFrameId,
    };
  }

  function hydrateInputs({ syncFocusedStarInputs = true } = {}) {
    const state = getState();
    if (topologyKindEl) topologyKindEl.value = state.topologyKind;
    const quadLayoutRadio = wrap.querySelector(
      `#${state.quadLayoutKind === "paired" ? "quadLayoutPaired" : "quadLayoutChain"}`,
    );
    if (quadLayoutRadio) quadLayoutRadio.checked = true;
    if (companionNameEl) companionNameEl.value = state.companionName;
    if (companionMassEl) companionMassEl.value = state.companionMassMsol;
    if (binarySemiMajorAxisEl) binarySemiMajorAxisEl.value = state.binarySemiMajorAxisAu;
    if (binaryEccentricityEl) binaryEccentricityEl.value = state.binaryEccentricity;
    if (binaryInclinationEl) binaryInclinationEl.value = state.binaryInclinationDeg;
    if (binaryArgPeriapsisEl) binaryArgPeriapsisEl.value = state.binaryArgPeriapsisDeg;
    if (binaryMeanAnomalyEl) binaryMeanAnomalyEl.value = state.binaryMeanAnomalyDeg;
    if (tertiaryNameEl) tertiaryNameEl.value = state.tertiaryName;
    if (tertiaryMassEl) tertiaryMassEl.value = state.tertiaryMassMsol;
    if (tripleOuterSemiMajorAxisEl)
      tripleOuterSemiMajorAxisEl.value = state.tripleOuterSemiMajorAxisAu;
    if (tripleOuterEccentricityEl) tripleOuterEccentricityEl.value = state.tripleOuterEccentricity;
    if (tripleOuterInclinationEl) tripleOuterInclinationEl.value = state.tripleOuterInclinationDeg;
    if (tripleOuterArgPeriapsisEl)
      tripleOuterArgPeriapsisEl.value = state.tripleOuterArgPeriapsisDeg;
    if (tripleOuterMeanAnomalyEl) tripleOuterMeanAnomalyEl.value = state.tripleOuterMeanAnomalyDeg;
    if (quaternaryNameEl) quaternaryNameEl.value = state.quaternaryName;
    if (quaternaryMassEl) quaternaryMassEl.value = state.quaternaryMassMsol;
    if (quadOuterSemiMajorAxisEl) quadOuterSemiMajorAxisEl.value = state.quadOuterSemiMajorAxisAu;
    if (quadOuterEccentricityEl) quadOuterEccentricityEl.value = state.quadOuterEccentricity;
    if (quadOuterInclinationEl) quadOuterInclinationEl.value = state.quadOuterInclinationDeg;
    if (quadOuterArgPeriapsisEl) quadOuterArgPeriapsisEl.value = state.quadOuterArgPeriapsisDeg;
    if (quadOuterMeanAnomalyEl) quadOuterMeanAnomalyEl.value = state.quadOuterMeanAnomalyDeg;
    const evolutionRadio = wrap.querySelector(
      `#${state.evolutionMode === "evolved" ? "evolutionOn" : "evolutionOff"}`,
    );
    if (evolutionRadio) evolutionRadio.checked = true;
    if (syncFocusedStarInputs) syncFocusedStarEditorInputs();
  }

  function bindListeners() {
    [
      nameEl,
      massEl,
      ageEl,
      metallicityEl,
      binarySemiMajorAxisEl,
      binaryEccentricityEl,
      binaryInclinationEl,
      binaryArgPeriapsisEl,
      binaryMeanAnomalyEl,
      tripleOuterSemiMajorAxisEl,
      tripleOuterEccentricityEl,
      tripleOuterInclinationEl,
      tripleOuterArgPeriapsisEl,
      tripleOuterMeanAnomalyEl,
      quadOuterSemiMajorAxisEl,
      quadOuterEccentricityEl,
      quadOuterInclinationEl,
      quadOuterArgPeriapsisEl,
      quadOuterMeanAnomalyEl,
      radiusOverrideEl,
      luminosityOverrideEl,
      tempOverrideEl,
    ]
      .filter(Boolean)
      .forEach((el) => el.addEventListener("input", () => applyFromInputs()));

    [
      nameEl,
      massEl,
      ageEl,
      metallicityEl,
      binarySemiMajorAxisEl,
      binaryEccentricityEl,
      binaryInclinationEl,
      binaryArgPeriapsisEl,
      binaryMeanAnomalyEl,
      tripleOuterSemiMajorAxisEl,
      tripleOuterEccentricityEl,
      tripleOuterInclinationEl,
      tripleOuterArgPeriapsisEl,
      tripleOuterMeanAnomalyEl,
      quadOuterSemiMajorAxisEl,
      quadOuterEccentricityEl,
      quadOuterInclinationEl,
      quadOuterArgPeriapsisEl,
      quadOuterMeanAnomalyEl,
      radiusOverrideEl,
      luminosityOverrideEl,
      tempOverrideEl,
    ]
      .filter(Boolean)
      .forEach((el) => el.addEventListener("change", () => applyFromInputs({ commit: true })));

    radiusClearBtn?.addEventListener("click", () => {
      radiusOverrideEl.value = "";
      applyFromInputs({ commit: true });
    });
    luminosityClearBtn?.addEventListener("click", () => {
      luminosityOverrideEl.value = "";
      applyFromInputs({ commit: true });
    });
    tempClearBtn?.addEventListener("click", () => {
      tempOverrideEl.value = "";
      applyFromInputs({ commit: true });
    });

    physicsModeRadios.forEach((radio) =>
      radio.addEventListener("change", () => applyFromInputs({ commit: true })),
    );
    evolutionModeRadios.forEach((radio) =>
      radio.addEventListener("change", () => {
        getState().evolutionMode = radio.value;
        applyFromInputs({ commit: true });
      }),
    );
    physicsDerivRadios.forEach((radio) =>
      radio.addEventListener("change", () => applyFromInputs({ commit: true })),
    );

    [companionNameEl, companionMassEl]
      .filter(Boolean)
      .forEach((el) =>
        el.addEventListener("change", () => applyCompatStarInputs("star_b", { commit: true })),
      );
    [tertiaryNameEl, tertiaryMassEl]
      .filter(Boolean)
      .forEach((el) =>
        el.addEventListener("change", () => applyCompatStarInputs("star_c", { commit: true })),
      );
    [quaternaryNameEl, quaternaryMassEl]
      .filter(Boolean)
      .forEach((el) =>
        el.addEventListener("change", () => applyCompatStarInputs("star_d", { commit: true })),
      );

    topologyKindEl?.addEventListener("change", async () => {
      await commitTopologyChangeIfConfirmed({
        topologyKind: topologyKindEl.value,
        quadLayoutKind: getState().quadLayoutKind,
      });
    });
    topologyCardGridEl?.addEventListener("click", async (event) => {
      const buttonEl = event.target?.closest?.('button[data-architecture-kind="topology"]');
      const nextTopologyKind = String(buttonEl?.dataset?.value || "");
      if (!["single", "binary", "triple", "quad"].includes(nextTopologyKind)) return;
      topologyKindEl.value = nextTopologyKind;
      await commitTopologyChangeIfConfirmed({
        topologyKind: nextTopologyKind,
        quadLayoutKind: getState().quadLayoutKind,
      });
    });
    quadLayoutRadios.forEach((radio) =>
      radio.addEventListener("change", async () => {
        await commitTopologyChangeIfConfirmed({
          topologyKind: getState().topologyKind,
          quadLayoutKind: radio.value,
        });
      }),
    );
    quadLayoutCardGridEl?.addEventListener("click", async (event) => {
      const buttonEl = event.target?.closest?.('button[data-architecture-kind="quad-layout"]');
      const nextLayoutKind = normalizeQuadLayoutKind(
        buttonEl?.dataset?.value,
        getState().quadLayoutKind,
      );
      const nextQuadLayoutRadio = wrap.querySelector(
        `#${nextLayoutKind === "paired" ? "quadLayoutPaired" : "quadLayoutChain"}`,
      );
      if (nextQuadLayoutRadio) nextQuadLayoutRadio.checked = true;
      await commitTopologyChangeIfConfirmed({
        topologyKind: getState().topologyKind,
        quadLayoutKind: nextLayoutKind,
      });
    });
    editorInspectorModeEl?.addEventListener("click", (event) => {
      const buttonEl = event.target?.closest?.("button[data-editor-mode]");
      const nextMode = String(buttonEl?.dataset?.editorMode || "");
      if (!nextMode) return;
      setEditorMode(nextMode);
      render();
    });
    editorTargetPillsEl?.addEventListener("click", (event) => {
      const buttonEl = event.target?.closest?.("button[data-editor-target-id]");
      const nextTargetId = String(buttonEl?.dataset?.editorTargetId || "");
      if (!nextTargetId) return;
      setSelectedEditorTarget(nextTargetId);
      render();
    });
    topologyMapNodesEl?.addEventListener("click", (event) => {
      const buttonEl = event.target?.closest?.("button[data-topology-node-id]");
      const nodeId = String(buttonEl?.dataset?.topologyNodeId || "");
      if (!nodeId) return;
      helpers.editorUiState.pendingTopologyMapFocusId = nodeId;
      setSelectedEditorTarget(nodeId);
      render();
    });
    starEditorTargetEl?.addEventListener("change", () => {
      setSelectedEditorTarget(starEditorTargetEl.value);
      render();
    });
    pairEditorTargetEl?.addEventListener("change", () => {
      setSelectedEditorTarget(pairEditorTargetEl.value);
      render();
    });
    activeHostFrameEl?.addEventListener("change", () => {
      applyFromInputs({ commit: true });
    });

    stellarClassApplyBtn?.addEventListener("click", () => {
      applyClassInput({ commit: true });
    });
    stellarClassInputEl?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applyClassInput({ commit: true });
    });

    starCreateQuickBtn?.addEventListener("click", () => {
      openStarGuidedQuickPicker();
    });
    starCreateGuidedBtn?.addEventListener("click", () => {
      openStarGuidedFlow();
    });

    btnSol?.addEventListener("click", () => {
      const state = getState();
      const focusedStarId = getFocusedStarEditorId();
      const nextName = sanitizeFocusedStarName(focusedStarId, nameEl?.value, true);
      assignStarDraftState(focusedStarId, {
        name: nextName,
        massMsol: 1.0,
        radiusRsolOverride: null,
        luminosityLsolOverride: null,
        tempKOverride: null,
        physicsMode: "simple",
        advancedDerivationMode: "rl",
      });
      state.ageGyr = 4.6;
      state.metallicityFeH = 0.0;
      state.evolutionMode = "evolved";
      syncFocusedStarEditorInputs();
      persistState();
      render();
    });

    btnReset?.addEventListener("click", () => {
      const state = getState();
      const focusedStarId = getFocusedStarEditorId();
      const config = getStarEditorFieldConfig(focusedStarId);
      assignStarDraftState(focusedStarId, {
        name: config.defaultName,
        massMsol: config.defaultMass,
        radiusRsolOverride: null,
        luminosityLsolOverride: null,
        tempKOverride: null,
        physicsMode: "simple",
        advancedDerivationMode: "rl",
      });
      state.ageGyr = defaults.ageGyr;
      state.metallicityFeH = 0.0;
      state.evolutionMode = "evolved";
      syncFocusedStarEditorInputs();
      persistState();
      render();
    });
  }

  return {
    applyClassInput,
    applyCompatStarInputs,
    applyFromInputs,
    applyStarSystemInputs,
    bindListeners,
    buildDraftStateForTopologyChange,
    commitTopologyChangeIfConfirmed,
    hydrateInputs,
  };
}
