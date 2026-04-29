import { calcStar } from "../engine/star.js";
import { BROWN_DWARF_MIN_MSOL, regimeDisplayLabel } from "../engine/substellarRegime.js";
import { computeStellarActivityModel } from "../engine/stellarActivity.js";
import { clamp, fmt } from "../engine/utils.js";
import { bindNumberAndSlider } from "./bind.js";
import { createElement } from "./domHelpers.js";
import { createCelestialVisualPreviewController } from "./lazyCelestialVisualPreview.js";
import { renderDerivedDetails } from "./derivedDetails.js";
import { renderKpiSections } from "./kpiSections.js";
import { listStellarSystemHostFrames } from "./store/stellarSystemModel.js";
import { loadGuidedSession } from "./guidedCreation/sessionState.js";
import { attachTooltips, tipIcon } from "./tooltip.js";
import { confirmDestructiveAction } from "./destructiveActionDialog.js";
import {
  getProjectedPrimaryStar,
  getStellarSystem,
  loadWorld,
  planStellarSystemChange,
  saveStellarSystem,
} from "./store.js";
import { createStarGuidedFlows } from "./star/guidedFlows.js";
import { renderStarCurrentStateSummary } from "./star/contextSummary.js";
import { TIP_LABEL } from "./star/constants.js";
import { createStarDraftHelpers, normalizeQuadLayoutKind } from "./star/draftState.js";
import { createStarInputController } from "./star/inputController.js";
import { buildStarPageMarkup } from "./star/markup.js";
import { createStarOutputModelHelpers } from "./star/outputModel.js";
import { createStarOutputStrip } from "./star/outputStrip.js";
import { createStarPresetActions } from "./star/presetActions.js";
import {
  buildDefaultOrbitHostSummary,
  buildHostFrameOptionText,
  createStarSystemDraftHelpers,
} from "./star/systemDraft.js";
import {
  buildQuadLayoutCopy,
  buildTopologyMapModel,
  buildTopologyMapStarMeta,
  createStarTopologyModelHelpers,
} from "./star/topologyModel.js";
import {
  createEditorTargetPill,
  createSvgElement,
  renderArchitectureCards,
  renderTopologyMap,
} from "./star/topologyPanel.js";
import {
  buildStarGoalQuestionValues,
  buildStarGoalStatus,
  buildStarGoalTextAssist,
  setStarGoalDraftValue,
} from "./star/guidedGoalState.js";
import { createTutorial } from "./tutorial.js";

const HOST_COMPONENT_MASS_MIN = BROWN_DWARF_MIN_MSOL;
const HOST_COMPONENT_MASS_MIN_TEXT = HOST_COMPONENT_MASS_MIN.toFixed(4);

function isBrownDwarfModel(model) {
  return model?.regime === "brownDwarf";
}

function getHostZoneLabel(model) {
  return String(model?.zoneLabel || "Habitable Zone");
}

function getHostClassLabel(model) {
  return isBrownDwarfModel(model) ? "Brown Dwarf Class" : "Class";
}

function getHostClassValue(model) {
  return model?.spectralClass || regimeDisplayLabel(model?.regime);
}

function formatHostZoneValue(model) {
  return model?.display?.hzAu || "n/a";
}

function formatHostZoneInline(model) {
  return `${getHostZoneLabel(model)} ${formatHostZoneValue(model)}`;
}

function getHostLifetimeLabel(model) {
  return isBrownDwarfModel(model) ? "Cooling State" : "Maximum Age";
}

function getHostLifetimeValue(model) {
  if (!isBrownDwarfModel(model)) return fmt(model?.maxAgeGyr, 3);
  if (model?.deuteriumBurningActive) return "Deuterium-burning";
  return `${model?.spectralFamily || "Cooling"}-type cooling`;
}

function getHostLifetimeMeta(model) {
  if (!isBrownDwarfModel(model)) return "Gyr";
  return model?.deuteriumBurningPossible ? "Substellar cooling track" : "Cooling object";
}

function formatLuminosityLsol(value, dp = 3) {
  const x = Number(value);
  if (!Number.isFinite(x)) return "NA";
  const abs = Math.abs(x);
  if (abs === 0) return "0";
  if (abs < 1e-4) return x.toExponential(2);
  if (abs < 0.01) return fmt(x, Math.max(dp, 6));
  return fmt(x, dp);
}

function formatScaledLuminosityLsol(value, dp = 3) {
  const x = Number(value);
  if (!Number.isFinite(x)) return "NA";
  const abs = Math.abs(x);
  if (abs === 0) return "0 Lsol";
  if (abs >= 0.01) return `${fmt(x, dp)} Lsol`;

  const scaledUnits = [
    { scale: 1e3, label: "mLsol" },
    { scale: 1e6, label: "\u03bcLsol" },
    { scale: 1e9, label: "nLsol" },
  ];
  for (const unit of scaledUnits) {
    const scaled = x * unit.scale;
    const scaledAbs = Math.abs(scaled);
    if (scaledAbs >= 0.1) {
      const scaledDp = scaledAbs >= 100 ? 0 : scaledAbs >= 10 ? 1 : 2;
      return `${fmt(scaled, scaledDp)} ${unit.label}`;
    }
  }
  return `${formatLuminosityLsol(x, Math.max(dp, 6))} Lsol`;
}

function buildLuminosityKpiMeta(model) {
  if (!model) return "";
  const exactLsol = formatLuminosityLsol(model.luminosityLsol, 6);
  const watts = fmt(model.metric?.luminosityW, 0);
  return `${exactLsol} Lsol | ${watts} W${model.luminosityOverridden ? " (Override)" : ""}`;
}

function buildLuminosityKpiTooltip(model) {
  if (!model) return TIP_LABEL["Luminosity"] || "";
  return (
    `${TIP_LABEL["Luminosity"] || ""}\n\n` +
    `Current solve:\n` +
    `${formatScaledLuminosityLsol(model.luminosityLsol, 3)}\n` +
    `${formatLuminosityLsol(model.luminosityLsol, 6)} Lsol\n` +
    `${fmt(model.metric?.luminosityW, 0)} W${model.luminosityOverridden ? " (Override)" : ""}`
  ).trim();
}

const TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "The Star page defines your system\u2019s central star. Inputs on the left set " +
      "mass, age, and composition; outputs on the right show derived properties " +
      "like luminosity, habitable zone, and spectral class.",
  },
  {
    title: "Mass and Age",
    body:
      "Mass is the most important input \u2014 it determines nearly everything about " +
      "your star. Age affects luminosity and activity levels. Use the Sol-ish " +
      "Preset for a Sun-like starting point.",
  },
  {
    title: "Stellar Evolution",
    body:
      "Toggle Stellar Evolution to model how your star changes over time. When " +
      "enabled, luminosity and temperature shift based on the star\u2019s age and " +
      "mass, following analytical evolution tracks.",
  },
  {
    title: "Physics Mode",
    body:
      "Simple mode derives all properties from mass alone. Switch to Advanced " +
      "to override any two of Radius, Luminosity, or Temperature \u2014 the third " +
      "is computed via the Stefan-Boltzmann law.",
  },
  {
    title: "Outputs and Life",
    body:
      "Review the outputs panel for habitable zone boundaries, flare activity, " +
      "spectral class, and the life assessment badge. These feed into planet " +
      "and moon calculations on other pages.",
  },
];

export function initStarPage(mountEl, options = {}) {
  const defaults = { name: "Star", massMsol: 0.8653, ageGyr: 6.254 }; // workbook defaults
  const guidedRoute = options?.routeContext?.guided || null;
  const world = loadWorld();
  const primaryStar = getProjectedPrimaryStar(world);
  const stellarSystem = getStellarSystem(world);
  let state = null;
  const {
    assignStarDraftState,
    buildEditorTopologySignature,
    buildPairEditorLabel,
    buildStarEditorLabel,
    createInitialStarDraftState,
    getEditorTargetKind,
    getPairOrbitDraftSummary,
    getStarDraftState,
    getStarEditorFieldConfig,
    listAvailablePairEditorIds,
    listAvailableStarEditorIds,
    normalizeInspectorMode,
    normalizeSelectedEditorTargetId,
    normalizeSelectedPairEditorId,
    normalizeSelectedStarEditorId,
    normalizeTopologyHostFrameId,
    suggestPairEditorId,
    suggestStarEditorId,
  } = createStarDraftHelpers({
    defaults,
    getDraftState: () => state,
  });
  state = createInitialStarDraftState({
    primaryStar,
    stellarSystem,
  });
  const { buildPreviewWorldFromDraft, buildStellarSystemFromDraft, buildTopologyHealthAssessment } =
    createStarSystemDraftHelpers({
      getDraftState: () => state,
      getStarDraftState,
      normalizeTopologyHostFrameId,
    });
  const { buildEditorTargetDescriptors, buildSelectedStarEditorHint } =
    createStarTopologyModelHelpers({
      buildPairEditorLabel,
      buildStarEditorLabel,
      formatNumber: fmt,
      getHostClassValue,
      getPairOrbitDraftSummary,
      getStarDraftState,
      listAvailablePairEditorIds,
      listAvailableStarEditorIds,
      solveStarSummaryModel: (starId, draftState) => solveStarSummaryModel(starId, draftState),
    });
  const { buildStarOutputViewModel } = createStarOutputModelHelpers({
    buildDefaultOrbitHostSummary,
    buildHostFrameOptionText,
    buildLuminosityKpiMeta,
    buildLuminosityKpiTooltip,
    formatHostZoneValue,
    formatLuminosityLsol,
    formatScaledLuminosityLsol,
    formatNumber: fmt,
    getHostClassLabel,
    getHostClassValue,
    getHostLifetimeLabel,
    getHostLifetimeMeta,
    getHostLifetimeValue,
    getHostZoneLabel,
    isBrownDwarfModel,
    regimeDisplayLabel,
  });
  const { renderOutputStarStrip } = createStarOutputStrip({
    buildPairEditorLabel,
    buildStarEditorLabel,
    buildTopologyMapStarMeta,
    formatNumber: fmt,
    getEditorTargetKind,
    getEditorUiState: () => editorUiState,
    getHostClassValue,
    getStarDraftState,
    listAvailableStarEditorIds,
    normalizeSelectedEditorTargetId,
    setSelectedEditorTarget: (targetId) => setSelectedEditorTarget(targetId),
    solveStarSummaryModel: (starId, draftState) => solveStarSummaryModel(starId, draftState),
    render: () => render(),
  });

  function getFocusedStarEditorId(draftState = state) {
    return normalizeSelectedStarEditorId(editorUiState?.rememberedStarEditorId, draftState);
  }

  function getEffectiveOverridesForStar(starDraft = {}) {
    if (starDraft?.physicsMode === "advanced") {
      const derivationMode = starDraft?.advancedDerivationMode;
      const r = starDraft?.radiusRsolOverride ?? null;
      const l = starDraft?.luminosityLsolOverride ?? null;
      const t = starDraft?.tempKOverride ?? null;
      if (derivationMode === "rt") return { r, l: null, t };
      if (derivationMode === "lt") return { r: null, l, t };
      return { r, l, t: null };
    }
    return { r: null, l: null, t: null };
  }

  function solveStarSummaryModel(starId = "star_a", draftState = state) {
    const starDraft = getStarDraftState(starId, draftState);
    const overrides = getEffectiveOverridesForStar(starDraft);
    try {
      return calcStar({
        massMsol: Number(starDraft.massMsol),
        ageGyr: Number(starDraft.ageGyr),
        metallicityFeH: Number(starDraft.metallicityFeH) || 0,
        radiusRsolOverride: overrides.r,
        luminosityLsolOverride: overrides.l,
        tempKOverride: overrides.t,
        evolutionMode: starDraft.evolutionMode === "evolved" ? "evolved" : "zams",
      });
    } catch {
      return null;
    }
  }

  const editorUiState = {
    selectedEditorMode: "star",
    selectedEditorTargetId: suggestStarEditorId(state),
    rememberedStarEditorId: suggestStarEditorId(state),
    rememberedPairEditorId: suggestPairEditorId(state),
    topologySignature: buildEditorTopologySignature(state),
    pendingTopologyMapFocusId: null,
  };

  const wrap = document.createElement("div");
  wrap.className = "page";
  wrap.innerHTML = buildStarPageMarkup({
    hostComponentMassMinText: HOST_COMPONENT_MASS_MIN_TEXT,
  });
  mountEl.appendChild(wrap);
  attachTooltips(wrap);
  createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.star.tutorial",
    container: wrap,
    triggerBtn: wrap.querySelector("#starTutorials"),
  });
  const nameEl = wrap.querySelector("#starName");
  const massEl = wrap.querySelector("#mass");
  const ageEl = wrap.querySelector("#age");
  const metallicityEl = wrap.querySelector("#metallicity");
  const kpisEl = wrap.querySelector("#kpis");
  const detailsEl = wrap.querySelector("#details");
  const starCurrentStateCopyEl = wrap.querySelector("#starCurrentStateCopy");
  const starCurrentStateGridEl = wrap.querySelector("#starCurrentStateGrid");
  const starCurrentStateNotesEl = wrap.querySelector("#starCurrentStateNotes");
  const starTopologyGuidanceEl = wrap.querySelector("#starTopologyGuidance");
  const topologyKindEl = wrap.querySelector("#topologyKind");
  const topologyHintEl = wrap.querySelector("#topologyHint");
  const quadLayoutRowEl = wrap.querySelector("#quadLayoutRow");
  const quadLayoutHintEl = wrap.querySelector("#quadLayoutHint");
  const quadLayoutRadios = wrap.querySelectorAll('[name="quadLayoutKind"]');
  const activeHostFrameRowEl = wrap.querySelector("#activeHostFrameRow");
  const activeHostFrameEl = wrap.querySelector("#activeHostFrame");
  const activeHostFrameSummaryEl = wrap.querySelector("#activeHostFrameSummary");
  const topologyHealthPanelEl = wrap.querySelector("#topologyHealthPanel");
  const topologyHealthSummaryEl = wrap.querySelector("#topologyHealthSummary");
  const topologyHealthMetaEl = wrap.querySelector("#topologyHealthMeta");
  const topologyHealthLayersEl = wrap.querySelector("#topologyHealthLayers");
  const binaryAuthoringSectionEl = wrap.querySelector("#binaryAuthoringSection");
  const companionNameEl = wrap.querySelector("#companionName");
  const companionMassEl = wrap.querySelector("#companionMass");
  const companionSummaryHintEl = wrap.querySelector("#companionSummaryHint");
  const binarySemiMajorAxisEl = wrap.querySelector("#binarySemiMajorAxis");
  const binaryEccentricityEl = wrap.querySelector("#binaryEccentricity");
  const binaryInclinationEl = wrap.querySelector("#binaryInclination");
  const binaryArgPeriapsisEl = wrap.querySelector("#binaryArgPeriapsis");
  const binaryMeanAnomalyEl = wrap.querySelector("#binaryMeanAnomaly");
  const binaryPairGuardrailHintEl = wrap.querySelector("#binaryPairGuardrailHint");
  const tertiaryAuthoringSectionEl = wrap.querySelector("#tertiaryAuthoringSection");
  const tertiaryNameEl = wrap.querySelector("#tertiaryName");
  const tertiaryMassEl = wrap.querySelector("#tertiaryMass");
  const tertiarySummaryHintEl = wrap.querySelector("#tertiarySummaryHint");
  const tertiaryPairTitleEl = wrap.querySelector("#tertiaryPairTitle");
  const tertiaryPairAxisHintEl = wrap.querySelector("#tertiaryPairAxisHint");
  const tertiaryPairEccentricityHintEl = wrap.querySelector("#tertiaryPairEccentricityHint");
  const tripleOuterSemiMajorAxisEl = wrap.querySelector("#tripleOuterSemiMajorAxis");
  const tripleOuterEccentricityEl = wrap.querySelector("#tripleOuterEccentricity");
  const tripleOuterInclinationEl = wrap.querySelector("#tripleOuterInclination");
  const tripleOuterArgPeriapsisEl = wrap.querySelector("#tripleOuterArgPeriapsis");
  const tripleOuterMeanAnomalyEl = wrap.querySelector("#tripleOuterMeanAnomaly");
  const triplePairGuardrailHintEl = wrap.querySelector("#triplePairGuardrailHint");
  const quaternaryAuthoringSectionEl = wrap.querySelector("#quaternaryAuthoringSection");
  const quaternaryNameEl = wrap.querySelector("#quaternaryName");
  const quaternaryMassEl = wrap.querySelector("#quaternaryMass");
  const quaternarySummaryHintEl = wrap.querySelector("#quaternarySummaryHint");
  const quaternaryPairTitleEl = wrap.querySelector("#quaternaryPairTitle");
  const quaternaryPairAxisHintEl = wrap.querySelector("#quaternaryPairAxisHint");
  const quaternaryPairEccentricityHintEl = wrap.querySelector("#quaternaryPairEccentricityHint");
  const quadOuterSemiMajorAxisEl = wrap.querySelector("#quadOuterSemiMajorAxis");
  const quadOuterEccentricityEl = wrap.querySelector("#quadOuterEccentricity");
  const quadOuterInclinationEl = wrap.querySelector("#quadOuterInclination");
  const quadOuterArgPeriapsisEl = wrap.querySelector("#quadOuterArgPeriapsis");
  const quadOuterMeanAnomalyEl = wrap.querySelector("#quadOuterMeanAnomaly");
  const quadPairGuardrailHintEl = wrap.querySelector("#quadPairGuardrailHint");
  const physicsModeRadios = wrap.querySelectorAll('[name="physicsMode"]');
  const advancedDerivRowEl = wrap.querySelector("#advancedDerivRow");
  const physicsDerivRadios = wrap.querySelectorAll('[name="physicsDerivMode"]');
  const radiusOverrideRowEl = wrap.querySelector("#radiusOverrideRow");
  const luminosityOverrideRowEl = wrap.querySelector("#luminosityOverrideRow");
  const tempOverrideRowEl = wrap.querySelector("#tempOverrideRow");
  const radiusOverrideEl = wrap.querySelector("#radiusOverride");
  const luminosityOverrideEl = wrap.querySelector("#luminosityOverride");
  const tempOverrideEl = wrap.querySelector("#tempOverride");
  const radiusHintEl = wrap.querySelector("#radiusHint");
  const luminosityHintEl = wrap.querySelector("#luminosityHint");
  const tempHintEl = wrap.querySelector("#tempHint");
  const resolutionStatusEl = wrap.querySelector("#resolutionStatus");
  const physicsModeHintEl = wrap.querySelector("#physicsModeHint");
  const evolutionModeRadios = wrap.querySelectorAll('[name="evolutionMode"]');
  const evolutionHintEl = wrap.querySelector("#evolutionHint");
  const starCreateEntryEl = wrap.querySelector("#starCreateEntry");
  const starCreateQuickBtn = wrap.querySelector("#starCreateQuickBtn");
  const starCreateGuidedBtn = wrap.querySelector("#starCreateGuidedBtn");
  const inputPanelBodyEl = starCreateEntryEl?.parentElement || null;
  const architectureSectionEl = topologyKindEl?.closest(".subsection") || null;
  const topologyKindRowEl = topologyKindEl?.closest(".form-row") || null;
  const primaryStarNameRowEl = wrap.querySelector("#primaryStarNameRow");
  const primaryStarMassRowEl = wrap.querySelector("#primaryStarMassRow");
  const stellarClassInputRowEl = wrap.querySelector("#stellarClassInputRow");
  const stellarClassInputEl = wrap.querySelector("#stellarClassInput");
  const stellarClassApplyBtn = wrap.querySelector("#stellarClassApply");
  const stellarClassStatusEl = wrap.querySelector("#stellarClassStatus");
  const sharedAgeRowEl = wrap.querySelector("#sharedAgeRow");
  const sharedEvolutionBlockEl = wrap.querySelector("#sharedEvolutionBlock");
  const sharedMetallicityRowEl = wrap.querySelector("#sharedMetallicityRow");
  const primaryPhysicsBlockEl = wrap.querySelector("#primaryPhysicsBlock");
  const primaryStarActionsRowEl = wrap.querySelector("#primaryStarActionsRow");
  const inputAutosaveHintEl = wrap.querySelector("#inputAutosaveHint");
  const binaryPairTitleEl = wrap.querySelector("#binaryPairTitle");
  const companionNameRowEl = companionNameEl?.closest(".form-row") || null;
  const companionMassRowEl = companionMassEl?.closest(".form-row") || null;
  const binarySemiMajorAxisRowEl = binarySemiMajorAxisEl?.closest(".form-row") || null;
  const binaryEccentricityRowEl = binaryEccentricityEl?.closest(".form-row") || null;
  const binaryInclinationRowEl = binaryInclinationEl?.closest(".form-row") || null;
  const binaryArgPeriapsisRowEl = binaryArgPeriapsisEl?.closest(".form-row") || null;
  const binaryMeanAnomalyRowEl = binaryMeanAnomalyEl?.closest(".form-row") || null;
  const tertiaryNameRowEl = tertiaryNameEl?.closest(".form-row") || null;
  const tertiaryMassRowEl = tertiaryMassEl?.closest(".form-row") || null;
  const tripleOuterSemiMajorAxisRowEl = tripleOuterSemiMajorAxisEl?.closest(".form-row") || null;
  const tripleOuterEccentricityRowEl = tripleOuterEccentricityEl?.closest(".form-row") || null;
  const tripleOuterInclinationRowEl = tripleOuterInclinationEl?.closest(".form-row") || null;
  const tripleOuterArgPeriapsisRowEl = tripleOuterArgPeriapsisEl?.closest(".form-row") || null;
  const tripleOuterMeanAnomalyRowEl = tripleOuterMeanAnomalyEl?.closest(".form-row") || null;
  const quaternaryNameRowEl = quaternaryNameEl?.closest(".form-row") || null;
  const quaternaryMassRowEl = quaternaryMassEl?.closest(".form-row") || null;
  const quadOuterSemiMajorAxisRowEl = quadOuterSemiMajorAxisEl?.closest(".form-row") || null;
  const quadOuterEccentricityRowEl = quadOuterEccentricityEl?.closest(".form-row") || null;
  const quadOuterInclinationRowEl = quadOuterInclinationEl?.closest(".form-row") || null;
  const quadOuterArgPeriapsisRowEl = quadOuterArgPeriapsisEl?.closest(".form-row") || null;
  const quadOuterMeanAnomalyRowEl = quadOuterMeanAnomalyEl?.closest(".form-row") || null;

  function createSectionTitle(text) {
    return createElement("div", { className: "subsection__title", text });
  }

  function createHintText(text) {
    return createElement("div", { className: "hint", text });
  }

  function createEditorTargetRow(id, label, hint, selectId, ariaLabel) {
    const rowEl = createElement("div", { attrs: { id }, className: "form-row" });
    const textColEl = document.createElement("div");
    const labelEl = createElement("div", { className: "label", text: label });
    const hintEl = createHintText(hint);
    textColEl.append(labelEl, hintEl);
    const controlColEl = document.createElement("div");
    const selectEl = createElement("select", {
      attrs: { id: selectId, "aria-label": ariaLabel },
    });
    controlColEl.append(selectEl);
    rowEl.append(textColEl, controlColEl);
    return { rowEl, selectEl };
  }

  const topologyCardsSectionEl = createElement("div", {
    attrs: { id: "topologyCardsSection" },
    className: "star-architecture-group",
  });
  const topologyCardGridEl = createElement("div", {
    attrs: { id: "topologyCardGrid" },
    className: "star-architecture-grid",
  });
  topologyHintEl?.classList.add("star-architecture-selection-copy");
  topologyCardsSectionEl.append(
    createElement("div", { className: "label", text: "Choose a layout" }),
    createHintText(
      "Pick the home-system shape first. The rest of the editor follows this topology.",
    ),
    topologyCardGridEl,
    topologyHintEl,
  );

  const quadLayoutCardsSectionEl = createElement("div", {
    attrs: { id: "quadLayoutCardsSection" },
    className: "star-architecture-group",
  });
  const quadLayoutCardGridEl = createElement("div", {
    attrs: { id: "quadLayoutCardGrid" },
    className: "star-architecture-grid star-architecture-grid--compact",
  });
  quadLayoutCardsSectionEl.style.display = "none";
  quadLayoutHintEl?.classList.add("star-architecture-selection-copy");
  quadLayoutCardsSectionEl.append(
    createElement("div", { className: "label", text: "Choose a quad arrangement" }),
    createHintText("Quad systems need one more choice so the hierarchy stays readable and stable."),
    quadLayoutCardGridEl,
    quadLayoutHintEl,
  );

  if (topologyKindRowEl) topologyKindRowEl.style.display = "none";
  if (quadLayoutRowEl) quadLayoutRowEl.style.display = "none";
  architectureSectionEl?.insertBefore(topologyCardsSectionEl, topologyKindRowEl);
  architectureSectionEl?.insertBefore(quadLayoutCardsSectionEl, topologyKindRowEl);

  const topologyMapSectionEl = createElement("div", {
    attrs: { id: "topologyMapSection" },
    className: "star-topology-map-section",
  });
  const topologyMapCanvasEl = createElement("div", {
    attrs: { id: "topologyMapCanvas", "aria-describedby": "topologyMapSummary" },
    className: "star-topology-map",
  });
  const topologyMapSvgEl = createSvgElement("svg", {
    id: "topologyMapSvg",
    class: "star-topology-map__svg",
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
  });
  const topologyMapNodesEl = createElement("div", {
    attrs: { id: "topologyMapNodes" },
    className: "star-topology-map__nodes",
  });
  const topologyMapHealthChipsEl = createElement("div", {
    attrs: { id: "topologyMapHealthChips" },
    className: "star-topology-map__chips",
  });
  const topologyMapLegendEl = createElement("div", {
    attrs: { id: "topologyMapLegend" },
    className: "star-topology-map__legend",
  });
  const topologyMapSummaryEl = createElement("div", {
    attrs: { id: "topologyMapSummary", "aria-live": "polite" },
    className: "star-topology-map__sr-only",
  });
  topologyMapCanvasEl.append(topologyMapSvgEl, topologyMapNodesEl);
  topologyMapSectionEl.append(
    createElement("div", { className: "label", text: "Hierarchy map" }),
    createHintText(
      "Click a star or pair to focus its editor below. Outlined nodes mark the default orbit host.",
    ),
    topologyMapCanvasEl,
    topologyMapHealthChipsEl,
    topologyMapLegendEl,
    topologyMapSummaryEl,
  );
  architectureSectionEl?.insertBefore(topologyMapSectionEl, activeHostFrameRowEl);

  const sharedSystemContextSectionEl = createElement("div", {
    attrs: { id: "sharedSystemContextSection" },
    className: "subsection",
  });
  sharedSystemContextSectionEl.append(
    createSectionTitle("Shared System Context"),
    createHintText("Age, metallicity, and stellar evolution apply across the home stellar system."),
    sharedAgeRowEl,
    sharedEvolutionBlockEl,
    sharedMetallicityRowEl,
  );

  const primaryStarAuthoringSectionEl = createElement("div", {
    attrs: { id: "primaryStarAuthoringSection" },
    className: "subsection",
  });
  const starEditorTitleEl = createSectionTitle("Selected Star");
  const starEditorHintEl = createHintText(
    "These inputs apply only to the selected star. Shared system context lives above.",
  );
  primaryStarAuthoringSectionEl.append(
    starEditorTitleEl,
    starEditorHintEl,
    primaryStarNameRowEl,
    primaryStarMassRowEl,
    stellarClassInputRowEl,
    primaryPhysicsBlockEl,
    advancedDerivRowEl,
    radiusOverrideRowEl,
    luminosityOverrideRowEl,
    tempOverrideRowEl,
    resolutionStatusEl,
    primaryStarActionsRowEl,
    inputAutosaveHintEl,
  );

  const companionSharedContextHintEl = createHintText(
    "Uses shared age, metallicity, and stellar evolution from Shared System Context.",
  );
  const tertiarySharedContextHintEl = createHintText(
    "Uses shared age, metallicity, and stellar evolution from Shared System Context.",
  );
  const quaternarySharedContextHintEl = createHintText(
    "Uses shared age, metallicity, and stellar evolution from Shared System Context.",
  );

  const binaryStarTitleEl = binaryAuthoringSectionEl?.querySelector(".subsection__title") || null;
  const tertiaryStarTitleEl =
    tertiaryAuthoringSectionEl?.querySelector(".subsection__title") || null;
  const quaternaryStarTitleEl =
    quaternaryAuthoringSectionEl?.querySelector(".subsection__title") || null;

  binaryAuthoringSectionEl?.replaceChildren(
    binaryStarTitleEl,
    companionSharedContextHintEl,
    companionNameRowEl,
    companionMassRowEl,
    companionSummaryHintEl,
  );
  tertiaryAuthoringSectionEl?.replaceChildren(
    tertiaryStarTitleEl,
    tertiarySharedContextHintEl,
    tertiaryNameRowEl,
    tertiaryMassRowEl,
    tertiarySummaryHintEl,
  );
  quaternaryAuthoringSectionEl?.replaceChildren(
    quaternaryStarTitleEl,
    quaternarySharedContextHintEl,
    quaternaryNameRowEl,
    quaternaryMassRowEl,
    quaternarySummaryHintEl,
  );

  const pairAbAuthoringSectionEl = createElement("div", {
    attrs: { id: "pairAbAuthoringSection" },
    className: "subsection",
  });
  pairAbAuthoringSectionEl.append(
    binaryPairTitleEl,
    binarySemiMajorAxisRowEl,
    binaryEccentricityRowEl,
    binaryInclinationRowEl,
    binaryArgPeriapsisRowEl,
    binaryMeanAnomalyRowEl,
    binaryPairGuardrailHintEl,
  );

  const triplePairAuthoringSectionEl = createElement("div", {
    attrs: { id: "triplePairAuthoringSection" },
    className: "subsection",
  });
  triplePairAuthoringSectionEl.append(
    tertiaryPairTitleEl,
    tripleOuterSemiMajorAxisRowEl,
    tripleOuterEccentricityRowEl,
    tripleOuterInclinationRowEl,
    tripleOuterArgPeriapsisRowEl,
    tripleOuterMeanAnomalyRowEl,
    triplePairGuardrailHintEl,
  );

  const quadPairAuthoringSectionEl = createElement("div", {
    attrs: { id: "quadPairAuthoringSection" },
    className: "subsection",
  });
  quadPairAuthoringSectionEl.append(
    quaternaryPairTitleEl,
    quadOuterSemiMajorAxisRowEl,
    quadOuterEccentricityRowEl,
    quadOuterInclinationRowEl,
    quadOuterArgPeriapsisRowEl,
    quadOuterMeanAnomalyRowEl,
    quadPairGuardrailHintEl,
  );

  const { rowEl: starEditorTargetRowEl, selectEl: starEditorTargetEl } = createEditorTargetRow(
    "starEditorTargetRow",
    "Star Focus",
    "Choose which star editor is visible below.",
    "starEditorTarget",
    "Star editor focus",
  );
  const { rowEl: pairEditorTargetRowEl, selectEl: pairEditorTargetEl } = createEditorTargetRow(
    "pairEditorTargetRow",
    "Pair Focus",
    "Choose which hierarchical pair editor is visible below.",
    "pairEditorTarget",
    "Pair editor focus",
  );
  const editorInspectorSectionEl = createElement("div", {
    attrs: { id: "editorInspectorSection" },
    className: "subsection star-editor-inspector",
  });
  const editorInspectorModeEl = createElement("div", {
    attrs: { id: "editorInspectorMode" },
    className: "star-editor-inspector__mode",
  });
  const editorModeStarBtn = createElement("button", {
    attrs: {
      id: "editorModeStar",
      type: "button",
      "data-editor-mode": "star",
      "aria-pressed": "true",
    },
    className: "star-editor-inspector__mode-btn",
    text: "Stars",
  });
  const editorModePairBtn = createElement("button", {
    attrs: {
      id: "editorModePair",
      type: "button",
      "data-editor-mode": "pair",
      "aria-pressed": "false",
    },
    className: "star-editor-inspector__mode-btn",
    text: "Pairs",
  });
  editorInspectorModeEl.append(editorModeStarBtn, editorModePairBtn);
  const editorTargetPillsEl = createElement("div", {
    attrs: { id: "editorTargetPills" },
    className: "star-editor-inspector__pills",
  });
  const editorTargetSummaryEl = createElement("div", {
    attrs: {
      id: "editorTargetSummary",
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
    className: "star-editor-inspector__summary",
  });
  const editorTargetSummaryEyebrowEl = createElement("div", {
    attrs: { id: "editorTargetSummaryEyebrow" },
    className: "star-editor-inspector__summary-eyebrow",
    text: "Editing target",
  });
  const editorTargetSummaryTitleEl = createElement("div", {
    attrs: { id: "editorTargetSummaryTitle" },
    className: "star-editor-inspector__summary-title",
  });
  const editorTargetSummaryMetaEl = createElement("div", {
    attrs: { id: "editorTargetSummaryMeta" },
    className: "star-editor-inspector__summary-meta",
  });
  const editorTargetSummaryHintEl = createElement("div", {
    attrs: { id: "editorTargetSummaryHint" },
    className: "star-editor-inspector__summary-hint",
  });
  editorTargetSummaryEl.append(
    editorTargetSummaryEyebrowEl,
    editorTargetSummaryTitleEl,
    editorTargetSummaryMetaEl,
    editorTargetSummaryHintEl,
  );
  const editorInspectorCompatEl = createElement("div", {
    attrs: { id: "editorInspectorCompat", hidden: "hidden", "aria-hidden": "true" },
    className: "star-editor-inspector__compat",
  });
  editorInspectorCompatEl.append(starEditorTargetRowEl, pairEditorTargetRowEl);
  editorInspectorSectionEl.append(
    createSectionTitle("Focused Editor"),
    createHintText(
      "Choose Stars or Pairs, then focus one target at a time. The topology map, pills, and focused outputs stay in sync.",
    ),
    editorInspectorModeEl,
    editorTargetPillsEl,
    editorTargetSummaryEl,
    editorInspectorCompatEl,
    primaryStarAuthoringSectionEl,
    binaryAuthoringSectionEl,
    tertiaryAuthoringSectionEl,
    quaternaryAuthoringSectionEl,
    pairAbAuthoringSectionEl,
    triplePairAuthoringSectionEl,
    quadPairAuthoringSectionEl,
  );

  if (inputPanelBodyEl && architectureSectionEl) {
    architectureSectionEl.insertAdjacentElement("afterend", sharedSystemContextSectionEl);
    sharedSystemContextSectionEl.insertAdjacentElement("afterend", editorInspectorSectionEl);
  }
  const sunPreviewController = createCelestialVisualPreviewController({ speedDaysPerSec: 0.5 });
  const overlayClosers = new Set();
  let inputController = null;

  // Dispose preview controller when page unmounts
  const _starPageObserver = new MutationObserver(() => {
    if (!wrap.isConnected) {
      sunPreviewController.dispose();
      _starPageObserver.disconnect();
    }
  });
  _starPageObserver.observe(document.body, { childList: true, subtree: true });

  // Bind number inputs to sliders
  const massSlider = wrap.querySelector("#mass_slider");
  const massMin = wrap.querySelector("#mass_min");
  const massMax = wrap.querySelector("#mass_max");
  massMin.textContent = HOST_COMPONENT_MASS_MIN_TEXT;
  massMax.textContent = "100";
  const massBinding = bindNumberAndSlider({
    numberEl: massEl,
    sliderEl: massSlider,
    min: HOST_COMPONENT_MASS_MIN,
    max: 100,
    step: 0.0001,
    mode: "auto",
    commitOnInput: false,
    onChange: () => inputController?.applyFromInputs({ commit: true }),
  });

  const ageSlider = wrap.querySelector("#age_slider");
  const ageMin = wrap.querySelector("#age_min");
  const ageMax = wrap.querySelector("#age_max");
  ageMin.textContent = "0";
  ageMax.textContent = "20";
  const ageBinding = bindNumberAndSlider({
    numberEl: ageEl,
    sliderEl: ageSlider,
    min: 0,
    max: 20,
    step: 0.001,
    mode: "auto",
    commitOnInput: false,
    onChange: () => inputController?.applyFromInputs({ commit: true }),
  });

  const metallicitySlider = wrap.querySelector("#metallicity_slider");
  const metallicityMin = wrap.querySelector("#metallicity_min");
  const metallicityMax = wrap.querySelector("#metallicity_max");
  metallicityMin.textContent = "-3";
  metallicityMax.textContent = "1";
  const metallicityBinding = bindNumberAndSlider({
    numberEl: metallicityEl,
    sliderEl: metallicitySlider,
    min: -3,
    max: 1,
    step: 0.01,
    mode: "linear",
    commitOnInput: false,
    onChange: () => inputController?.applyFromInputs({ commit: true }),
  });

  function sanitiseName(raw) {
    const txt = String(raw ?? "").trim();
    return txt || defaults.name;
  }

  function sanitiseCompanionName(raw) {
    const txt = String(raw ?? "").trim();
    return txt || "Companion";
  }

  function sanitiseTertiaryName(raw) {
    const txt = String(raw ?? "").trim();
    return txt || "Tertiary";
  }

  function sanitiseQuaternaryName(raw) {
    const txt = String(raw ?? "").trim();
    return txt || "Quaternary";
  }

  function buildStellarSystemFromState() {
    return buildStellarSystemFromDraft(state);
  }

  function buildDraftStateFromGuidedPreview(objectInputs = {}, systemInputs = null) {
    const targetStarId = getFocusedStarEditorId();
    const draftState = {
      ...state,
      ageGyr: Number(objectInputs?.ageGyr ?? state.ageGyr),
      metallicityFeH: Number(objectInputs?.metallicityFeH ?? state.metallicityFeH) || 0,
      evolutionMode: objectInputs?.evolutionMode === "evolved" ? "evolved" : "zams",
      activityModelVersion: "v2",
    };
    assignStarDraftState(
      targetStarId,
      {
        name: String(
          objectInputs?.name || getStarDraftState(targetStarId, state).name || defaults.name,
        ),
        massMsol: Number(objectInputs?.massMsol ?? getStarDraftState(targetStarId, state).massMsol),
        physicsMode: "simple",
        advancedDerivationMode: "rl",
        radiusRsolOverride: null,
        luminosityLsolOverride: null,
        tempKOverride: null,
      },
      draftState,
    );

    if (!systemInputs || typeof systemInputs !== "object") return draftState;

    draftState.topologyKind = ["binary", "triple", "quad"].includes(systemInputs.topologyKind)
      ? systemInputs.topologyKind
      : "single";
    if (draftState.topologyKind === "quad") {
      draftState.quadLayoutKind = normalizeQuadLayoutKind(
        systemInputs.quadLayoutKind,
        draftState.quadLayoutKind,
      );
    }
    if (typeof systemInputs.companionName === "string") {
      draftState.companionName = sanitiseCompanionName(systemInputs.companionName);
    }
    if (systemInputs.companionMassMsol != null) {
      draftState.companionMassMsol = clamp(
        Number(systemInputs.companionMassMsol),
        HOST_COMPONENT_MASS_MIN,
        100,
      );
    }
    if (systemInputs.binarySemiMajorAxisAu != null) {
      draftState.binarySemiMajorAxisAu = Math.max(
        Number(systemInputs.binarySemiMajorAxisAu),
        0.001,
      );
    }
    if (systemInputs.binaryEccentricity != null) {
      draftState.binaryEccentricity = clamp(Number(systemInputs.binaryEccentricity), 0, 0.95);
    }
    if (systemInputs.binaryInclinationDeg != null) {
      draftState.binaryInclinationDeg = clamp(Number(systemInputs.binaryInclinationDeg), 0, 180);
    }
    if (typeof systemInputs.tertiaryName === "string") {
      draftState.tertiaryName = sanitiseTertiaryName(systemInputs.tertiaryName);
    }
    if (systemInputs.tertiaryMassMsol != null) {
      draftState.tertiaryMassMsol = clamp(
        Number(systemInputs.tertiaryMassMsol),
        HOST_COMPONENT_MASS_MIN,
        100,
      );
    }
    if (systemInputs.tripleOuterSemiMajorAxisAu != null) {
      draftState.tripleOuterSemiMajorAxisAu = Math.max(
        Number(systemInputs.tripleOuterSemiMajorAxisAu),
        0.001,
      );
    }
    if (systemInputs.tripleOuterEccentricity != null) {
      draftState.tripleOuterEccentricity = clamp(
        Number(systemInputs.tripleOuterEccentricity),
        0,
        0.95,
      );
    }
    if (systemInputs.tripleOuterInclinationDeg != null) {
      draftState.tripleOuterInclinationDeg = clamp(
        Number(systemInputs.tripleOuterInclinationDeg),
        0,
        180,
      );
    }
    if (typeof systemInputs.quaternaryName === "string") {
      draftState.quaternaryName = sanitiseQuaternaryName(systemInputs.quaternaryName);
    }
    if (systemInputs.quaternaryMassMsol != null) {
      draftState.quaternaryMassMsol = clamp(
        Number(systemInputs.quaternaryMassMsol),
        HOST_COMPONENT_MASS_MIN,
        100,
      );
    }
    if (systemInputs.quadOuterSemiMajorAxisAu != null) {
      draftState.quadOuterSemiMajorAxisAu = Math.max(
        Number(systemInputs.quadOuterSemiMajorAxisAu),
        0.001,
      );
    }
    if (systemInputs.quadOuterEccentricity != null) {
      draftState.quadOuterEccentricity = clamp(Number(systemInputs.quadOuterEccentricity), 0, 0.95);
    }
    if (systemInputs.quadOuterInclinationDeg != null) {
      draftState.quadOuterInclinationDeg = clamp(
        Number(systemInputs.quadOuterInclinationDeg),
        0,
        180,
      );
    }
    draftState.defaultHostFrameId = normalizeTopologyHostFrameId(
      systemInputs.defaultHostFrameId || draftState.defaultHostFrameId,
      draftState.topologyKind,
      draftState.quadLayoutKind,
    );

    return draftState;
  }

  function persistState() {
    const topologyHealth = buildTopologyHealthAssessment();
    if (topologyHealth.blocked) return false;
    saveStellarSystem(buildStellarSystemFromState());
    return true;
  }

  function solveAdditionalStarInputs(starId = "star_b", draftState = state) {
    return solveStarSummaryModel(starId, draftState);
  }

  function setSelectedEditorTarget(targetId) {
    const targetKind = getEditorTargetKind(targetId);
    if (targetKind === "pair") {
      editorUiState.rememberedPairEditorId = normalizeSelectedPairEditorId(targetId, state);
      editorUiState.selectedEditorMode = normalizeInspectorMode("pair", state);
      editorUiState.selectedEditorTargetId = normalizeSelectedEditorTargetId(
        editorUiState.rememberedPairEditorId,
        state,
        {
          preferredMode: "pair",
          rememberedStarEditorId: editorUiState.rememberedStarEditorId,
          rememberedPairEditorId: editorUiState.rememberedPairEditorId,
        },
      );
      return;
    }
    editorUiState.rememberedStarEditorId = normalizeSelectedStarEditorId(targetId, state);
    editorUiState.selectedEditorMode = "star";
    editorUiState.selectedEditorTargetId = normalizeSelectedEditorTargetId(
      editorUiState.rememberedStarEditorId,
      state,
      {
        preferredMode: "star",
        rememberedStarEditorId: editorUiState.rememberedStarEditorId,
        rememberedPairEditorId: editorUiState.rememberedPairEditorId,
      },
    );
  }

  function setEditorMode(nextMode) {
    editorUiState.selectedEditorMode = normalizeInspectorMode(nextMode, state);
    editorUiState.selectedEditorTargetId = normalizeSelectedEditorTargetId(
      editorUiState.selectedEditorTargetId,
      state,
      {
        preferredMode: editorUiState.selectedEditorMode,
        rememberedStarEditorId: editorUiState.rememberedStarEditorId,
        rememberedPairEditorId: editorUiState.rememberedPairEditorId,
      },
    );
  }

  function syncEditorSelectionState() {
    const nextSignature = buildEditorTopologySignature(state);
    const topologyChanged = editorUiState.topologySignature !== nextSignature;
    editorUiState.rememberedStarEditorId = normalizeSelectedStarEditorId(
      editorUiState.rememberedStarEditorId,
      state,
      { preferSuggested: topologyChanged },
    );
    editorUiState.rememberedPairEditorId = normalizeSelectedPairEditorId(
      editorUiState.rememberedPairEditorId,
      state,
      { preferSuggested: topologyChanged },
    );
    editorUiState.selectedEditorMode = normalizeInspectorMode(
      editorUiState.selectedEditorMode,
      state,
    );
    editorUiState.selectedEditorTargetId = normalizeSelectedEditorTargetId(
      editorUiState.selectedEditorTargetId,
      state,
      {
        preferredMode: editorUiState.selectedEditorMode,
        rememberedStarEditorId: editorUiState.rememberedStarEditorId,
        rememberedPairEditorId: editorUiState.rememberedPairEditorId,
        preferSuggested: topologyChanged,
      },
    );
    if (getEditorTargetKind(editorUiState.selectedEditorTargetId) === "pair") {
      editorUiState.selectedEditorMode = normalizeInspectorMode("pair", state);
      editorUiState.rememberedPairEditorId = normalizeSelectedPairEditorId(
        editorUiState.selectedEditorTargetId,
        state,
      );
    } else {
      editorUiState.selectedEditorMode = "star";
      editorUiState.rememberedStarEditorId = normalizeSelectedStarEditorId(
        editorUiState.selectedEditorTargetId,
        state,
      );
    }
    editorUiState.topologySignature = nextSignature;
  }

  function syncFocusedStarEditorInputs({ syncVisibleInputs = true } = {}) {
    const focusedStarId = getFocusedStarEditorId();
    const starDraft = getStarDraftState(focusedStarId, state);
    if (starEditorTitleEl) {
      starEditorTitleEl.textContent = buildStarEditorLabel(focusedStarId, state);
    }
    if (starEditorHintEl) {
      starEditorHintEl.textContent = buildSelectedStarEditorHint(focusedStarId, state);
    }
    if (syncVisibleInputs) {
      nameEl.value = starDraft.name;
      massEl.value = starDraft.massMsol;
      ageEl.value = state.ageGyr;
      metallicityEl.value = state.metallicityFeH;
      radiusOverrideEl.value = starDraft.radiusRsolOverride ?? "";
      luminosityOverrideEl.value = starDraft.luminosityLsolOverride ?? "";
      tempOverrideEl.value = starDraft.tempKOverride ?? "";
      const physicsModeEl = wrap.querySelector(
        `#${starDraft.physicsMode === "advanced" ? "physicsAdvanced" : "physicsSimple"}`,
      );
      if (physicsModeEl) physicsModeEl.checked = true;
      const evolutionEl = wrap.querySelector(
        `#${state.evolutionMode === "evolved" ? "evolutionOn" : "evolutionOff"}`,
      );
      if (evolutionEl) evolutionEl.checked = true;
      setDerivMode(starDraft.advancedDerivationMode);
    }
    companionNameEl.value = state.companionName;
    companionMassEl.value = state.companionMassMsol;
    tertiaryNameEl.value = state.tertiaryName;
    tertiaryMassEl.value = state.tertiaryMassMsol;
    quaternaryNameEl.value = state.quaternaryName;
    quaternaryMassEl.value = state.quaternaryMassMsol;
    if (syncVisibleInputs) syncBoundInputs();
  }

  function updateTopologyUI({ syncVisibleStarInputs = true } = {}) {
    const isMulti = state.topologyKind !== "single";
    const isTripleLike = state.topologyKind === "triple" || state.topologyKind === "quad";
    const isQuad = state.topologyKind === "quad";
    const quadLayoutCopy = buildQuadLayoutCopy(state.quadLayoutKind);
    const topologyHealth = buildTopologyHealthAssessment();
    syncEditorSelectionState();
    renderArchitectureCards({
      draftState: state,
      topologyCardGridEl,
      quadLayoutCardGridEl,
      topologyHintEl,
      quadLayoutHintEl,
    });
    quadLayoutCardsSectionEl.style.display = isQuad ? "" : "none";
    activeHostFrameRowEl.style.display = isMulti ? "" : "none";
    topologyHealthPanelEl.style.display = isMulti ? "" : "none";
    if (tertiaryPairTitleEl) {
      tertiaryPairTitleEl.innerHTML = `${quadLayoutCopy.tertiaryPairTitle} ${tipIcon(TIP_LABEL["Hierarchy Pair"] || "")}`;
    }
    if (tertiaryPairAxisHintEl)
      tertiaryPairAxisHintEl.textContent = quadLayoutCopy.tertiaryPairAxisHint;
    if (tertiaryPairEccentricityHintEl) {
      tertiaryPairEccentricityHintEl.textContent = quadLayoutCopy.tertiaryPairEccentricityHint;
    }
    if (quaternaryPairTitleEl) {
      quaternaryPairTitleEl.innerHTML = `${quadLayoutCopy.quaternaryPairTitle} ${tipIcon(TIP_LABEL["Hierarchy Pair"] || "")}`;
    }
    if (quaternaryPairAxisHintEl) {
      quaternaryPairAxisHintEl.textContent = quadLayoutCopy.quaternaryPairAxisHint;
    }
    if (quaternaryPairEccentricityHintEl) {
      quaternaryPairEccentricityHintEl.textContent = quadLayoutCopy.quaternaryPairEccentricityHint;
    }

    const availableStarEditorIds = listAvailableStarEditorIds(state);
    const availablePairEditorIds = listAvailablePairEditorIds(state);
    const editorTargetDescriptors = buildEditorTargetDescriptors(state, topologyHealth);
    const hasPairTargets = editorTargetDescriptors.pairTargets.length > 0;
    const visibleTargetDescriptors =
      editorUiState.selectedEditorMode === "pair"
        ? editorTargetDescriptors.pairTargets
        : editorTargetDescriptors.starTargets;
    const selectedTargetDescriptor =
      editorTargetDescriptors.byId.get(editorUiState.selectedEditorTargetId) ||
      visibleTargetDescriptors[0] ||
      editorTargetDescriptors.starTargets[0] ||
      null;

    starEditorTargetEl.replaceChildren(
      ...availableStarEditorIds.map((starId) =>
        createElement("option", {
          attrs: { value: starId },
          text: buildStarEditorLabel(starId, state),
        }),
      ),
    );
    starEditorTargetRowEl.style.display = "none";
    starEditorTargetEl.value = editorUiState.rememberedStarEditorId;
    pairEditorTargetEl.replaceChildren(
      ...availablePairEditorIds.map((pairId) =>
        createElement("option", {
          attrs: { value: pairId },
          text: buildPairEditorLabel(pairId, state),
        }),
      ),
    );
    pairEditorTargetRowEl.style.display = "none";
    if (availablePairEditorIds.length) {
      pairEditorTargetEl.value = editorUiState.rememberedPairEditorId;
    }
    editorInspectorModeEl.style.display = hasPairTargets ? "" : "none";
    editorModeStarBtn.setAttribute(
      "aria-pressed",
      editorUiState.selectedEditorMode === "star" ? "true" : "false",
    );
    editorModePairBtn.setAttribute(
      "aria-pressed",
      editorUiState.selectedEditorMode === "pair" ? "true" : "false",
    );
    editorModePairBtn.disabled = !hasPairTargets;
    editorTargetPillsEl.replaceChildren(
      ...visibleTargetDescriptors.map((targetDescriptor) =>
        createEditorTargetPill(
          targetDescriptor,
          targetDescriptor.id === editorUiState.selectedEditorTargetId,
        ),
      ),
    );
    editorTargetSummaryEl.style.display = selectedTargetDescriptor ? "" : "none";
    if (selectedTargetDescriptor) {
      editorTargetSummaryEyebrowEl.textContent =
        selectedTargetDescriptor.kind === "pair" ? "Pair target" : "Star target";
      editorTargetSummaryTitleEl.textContent = selectedTargetDescriptor.summaryTitle;
      editorTargetSummaryMetaEl.textContent = selectedTargetDescriptor.summaryMeta;
      editorTargetSummaryHintEl.textContent = selectedTargetDescriptor.summaryHint;
    } else {
      editorTargetSummaryEyebrowEl.textContent = "Editing target";
      editorTargetSummaryTitleEl.textContent = "";
      editorTargetSummaryMetaEl.textContent = "";
      editorTargetSummaryHintEl.textContent = "";
    }

    const selectedEditorTargetId =
      selectedTargetDescriptor?.id || editorUiState.selectedEditorTargetId;
    const selectedTargetKind = getEditorTargetKind(selectedEditorTargetId);
    primaryStarAuthoringSectionEl.style.display = selectedTargetKind === "star" ? "" : "none";
    binaryAuthoringSectionEl.style.display = "none";
    tertiaryAuthoringSectionEl.style.display = "none";
    quaternaryAuthoringSectionEl.style.display = "none";
    if (selectedTargetKind === "star") {
      syncFocusedStarEditorInputs({ syncVisibleInputs: syncVisibleStarInputs });
    }
    pairAbAuthoringSectionEl.style.display =
      availablePairEditorIds.includes("pair_ab") && selectedEditorTargetId === "pair_ab"
        ? ""
        : "none";
    triplePairAuthoringSectionEl.style.display =
      availablePairEditorIds.includes("pair_abc") || availablePairEditorIds.includes("pair_cd")
        ? selectedEditorTargetId ===
          (isQuad && state.quadLayoutKind === "paired" ? "pair_cd" : "pair_abc")
          ? ""
          : "none"
        : "none";
    quadPairAuthoringSectionEl.style.display =
      availablePairEditorIds.includes("pair_abcd") || availablePairEditorIds.includes("pair_root")
        ? selectedEditorTargetId ===
          (isQuad && state.quadLayoutKind === "paired" ? "pair_root" : "pair_abcd")
          ? ""
          : "none"
        : "none";

    const hostFrameOptions = listStellarSystemHostFrames(buildStellarSystemFromState());
    const starHostFrames = hostFrameOptions.filter((frame) => frame.frameKind === "star");
    const pairHostFrames = hostFrameOptions.filter((frame) => frame.frameKind === "pair");
    activeHostFrameEl.replaceChildren(
      ...(starHostFrames.length
        ? [
            createElement(
              "optgroup",
              { attrs: { label: "Around a Star (S-type)" } },
              starHostFrames.map((frame) =>
                createElement("option", {
                  attrs: { value: frame.id },
                  text: buildHostFrameOptionText(frame),
                }),
              ),
            ),
          ]
        : []),
      ...(pairHostFrames.length
        ? [
            createElement(
              "optgroup",
              { attrs: { label: "Around a Pair / Barycentre (P-type)" } },
              pairHostFrames.map((frame) =>
                createElement("option", {
                  attrs: { value: frame.id },
                  text: buildHostFrameOptionText(frame),
                }),
              ),
            ),
          ]
        : []),
    );
    const normalizedHostFrameId = normalizeTopologyHostFrameId(
      state.defaultHostFrameId,
      state.topologyKind,
      state.quadLayoutKind,
    );
    const topologyMapModel = buildTopologyMapModel({
      draftState: state,
      topologyHealth,
      selectedEditorTargetId: editorUiState.selectedEditorTargetId,
      defaultHostFrameId: normalizedHostFrameId,
    });
    renderTopologyMap({
      topologyMapCanvasEl,
      topologyMapSvgEl,
      topologyMapNodesEl,
      topologyMapHealthChipsEl,
      topologyMapLegendEl,
      topologyMapSummaryEl,
      topologyMapModel,
      pendingFocusId: editorUiState.pendingTopologyMapFocusId,
    });
    editorUiState.pendingTopologyMapFocusId = null;
    activeHostFrameEl.value = normalizedHostFrameId;
    const selectedHostFrame =
      hostFrameOptions.find((frame) => frame.id === normalizedHostFrameId) ||
      hostFrameOptions[0] ||
      null;
    activeHostFrameSummaryEl.style.display = isMulti ? "" : "none";
    activeHostFrameSummaryEl.textContent = isMulti
      ? buildDefaultOrbitHostSummary(selectedHostFrame)
      : "";

    if (!isMulti) {
      companionSummaryHintEl.textContent = "";
      tertiarySummaryHintEl.textContent = "";
      quaternarySummaryHintEl.textContent = "";
      activeHostFrameSummaryEl.style.display = "none";
      activeHostFrameSummaryEl.textContent = "";
      binaryPairGuardrailHintEl.textContent = "";
      triplePairGuardrailHintEl.textContent = "";
      quadPairGuardrailHintEl.textContent = "";
      tripleOuterSemiMajorAxisEl.toggleAttribute("aria-invalid", false);
      quadOuterSemiMajorAxisEl.toggleAttribute("aria-invalid", false);
      tripleOuterSemiMajorAxisEl.setCustomValidity("");
      quadOuterSemiMajorAxisEl.setCustomValidity("");
      topologyHealthSummaryEl.textContent = "";
      topologyHealthMetaEl.textContent = "";
      topologyHealthLayersEl.replaceChildren();
      return;
    }

    const companionModel = solveAdditionalStarInputs("star_b", state);
    companionSummaryHintEl.textContent =
      `${getHostClassValue(companionModel)} | ` +
      `${formatLuminosityLsol(companionModel.luminosityLsol, 3)} Lsol | ` +
      `${formatHostZoneInline(companionModel)}`;
    if (isTripleLike) {
      const tertiaryModel = solveAdditionalStarInputs("star_c", state);
      tertiarySummaryHintEl.textContent =
        `${getHostClassValue(tertiaryModel)} | ` +
        `${formatLuminosityLsol(tertiaryModel.luminosityLsol, 3)} Lsol | ` +
        `${formatHostZoneInline(tertiaryModel)}`;
    } else {
      tertiarySummaryHintEl.textContent = "";
    }
    if (isQuad) {
      const quaternaryModel = solveAdditionalStarInputs("star_d", state);
      quaternarySummaryHintEl.textContent =
        `${getHostClassValue(quaternaryModel)} | ` +
        `${formatLuminosityLsol(quaternaryModel.luminosityLsol, 3)} Lsol | ` +
        `${formatHostZoneInline(quaternaryModel)}`;
    } else {
      quaternarySummaryHintEl.textContent = "";
    }

    binaryPairGuardrailHintEl.textContent =
      state.topologyKind === "binary"
        ? "Binary-only layout. This pair becomes the inner reference if you later add C or D."
        : state.topologyKind === "quad" && state.quadLayoutKind === "paired"
          ? "First inner binary. The shared root pair below is checked against both A+B and C+D."
          : "Inner reference layer for the outer hierarchy checks below.";

    const tripleLayer = topologyHealth.layers.find((layer) =>
      state.topologyKind === "quad" && state.quadLayoutKind === "paired"
        ? layer.id === "pair_root_cd"
        : layer.id === "pair_abc",
    );
    triplePairGuardrailHintEl.textContent = tripleLayer
      ? `${tripleLayer.statusLabel}: ${tripleLayer.summary} ${tripleLayer.detail}`.trim()
      : "";
    tripleOuterSemiMajorAxisEl.toggleAttribute("aria-invalid", tripleLayer?.hardBlocked === true);
    tripleOuterSemiMajorAxisEl.setCustomValidity(
      tripleLayer?.hardBlocked ? tripleLayer.summary : "",
    );
    if (!tripleLayer) {
      tripleOuterSemiMajorAxisEl.toggleAttribute("aria-invalid", false);
      tripleOuterSemiMajorAxisEl.setCustomValidity("");
    }

    const quadLayer = topologyHealth.layers.find((layer) =>
      state.topologyKind === "quad" && state.quadLayoutKind === "paired"
        ? layer.id === "pair_root_ab"
        : layer.id === "pair_abcd",
    );
    quadPairGuardrailHintEl.textContent = quadLayer
      ? `${quadLayer.statusLabel}: ${quadLayer.summary} ${quadLayer.detail}`.trim()
      : "";
    quadOuterSemiMajorAxisEl.toggleAttribute("aria-invalid", quadLayer?.hardBlocked === true);
    quadOuterSemiMajorAxisEl.setCustomValidity(quadLayer?.hardBlocked ? quadLayer.summary : "");
    if (!quadLayer) {
      quadOuterSemiMajorAxisEl.toggleAttribute("aria-invalid", false);
      quadOuterSemiMajorAxisEl.setCustomValidity("");
    }

    topologyHealthSummaryEl.textContent = `${topologyHealth.headline}. ${topologyHealth.summary}`;
    topologyHealthMetaEl.textContent = `Topology ${state.topologyKind}${isQuad ? ` (${state.quadLayoutKind})` : ""}. Default orbit host ${topologyHealth.hostFrameLabel}. ${topologyHealth.fluxSummary}`;
    topologyHealthLayersEl.replaceChildren(
      ...topologyHealth.layers.map((layer) =>
        createElement("div", {
          className: "hint",
          text: `${layer.label}: ${layer.statusLabel}. ${layer.summary} ${layer.detail}`.trim(),
        }),
      ),
    );
  }

  function solveStarGuidedInputs(starInputs = {}) {
    const targetStarId = getFocusedStarEditorId();
    const currentStar = getStarDraftState(targetStarId, state);
    const nextState = {
      ...state,
    };
    assignStarDraftState(
      targetStarId,
      {
        name: String(starInputs?.name || currentStar.name),
        massMsol: Number(starInputs?.massMsol ?? currentStar.massMsol),
        physicsMode: "simple",
        advancedDerivationMode: "rl",
        radiusRsolOverride: null,
        luminosityLsolOverride: null,
        tempKOverride: null,
      },
      nextState,
    );
    nextState.ageGyr = Number(starInputs?.ageGyr ?? state.ageGyr);
    nextState.metallicityFeH = Number(starInputs?.metallicityFeH ?? state.metallicityFeH) || 0;
    nextState.evolutionMode = starInputs?.evolutionMode === "evolved" ? "evolved" : "zams";
    const solvedStar = getStarDraftState(targetStarId, nextState);
    const model = calcStar({
      massMsol: Number(solvedStar.massMsol),
      ageGyr: Number(nextState.ageGyr),
      metallicityFeH: Number(nextState.metallicityFeH) || 0,
      radiusRsolOverride: null,
      luminosityLsolOverride: null,
      tempKOverride: null,
      evolutionMode: nextState.evolutionMode === "evolved" ? "evolved" : "zams",
    });
    const activityModel = computeStellarActivityModel(
      {
        massMsun: Number(solvedStar.massMsol),
        ageGyr: Number(nextState.ageGyr),
        teffK: model.tempK,
        luminosityLsun: model.luminosityLsol,
      },
      { activityCycle: 0.5 },
    );
    return { model, activityModel };
  }

  function buildStarGuidedContext() {
    const targetStarId = getFocusedStarEditorId();
    const activeStar = getStarDraftState(targetStarId, state);
    const solvedContext = solveStarGuidedInputs(activeStar);
    const activity = solvedContext.activityModel?.activity || {};
    return {
      currentStarName: activeStar.name || "Star",
      currentTopologyKind: state.topologyKind,
      currentDefaultHostFrameId: state.defaultHostFrameId,
      currentInputs: {
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
      },
      currentContextLabel: "Current star context",
      currentContextText:
        `${getHostClassValue(solvedContext.model)}. ` +
        `${formatHostZoneInline(solvedContext.model)}. ` +
        `Activity ${activity.teffBin || "?"}/${activity.ageBand || "?"}.`,
      solveStarInputs: (starInputs) => solveStarGuidedInputs(starInputs),
    };
  }

  function createStarGuidedPreviewMetric(label, value, meta = "") {
    const displayValue =
      value == null || value === ""
        ? "n/a"
        : typeof value === "number" && !Number.isFinite(value)
          ? "n/a"
          : String(value);
    return createElement("div", { className: "guided-preview__metric" }, [
      createElement("div", {
        className: "guided-preview__metric-label",
        text: label,
      }),
      createElement("div", {
        className: "guided-preview__metric-value",
        text: displayValue,
      }),
      meta
        ? createElement("div", {
            className: "guided-preview__metric-meta",
            text: meta,
          })
        : null,
    ]);
  }

  function createStarGuidedPreviewContent(recommendation) {
    const model = recommendation?.previewPayload?.starCalc;
    const activity = recommendation?.previewPayload?.activityModel?.activity || null;
    const systemPreview = recommendation?.previewPayload?.systemPreview || null;
    const previewDraftState = buildDraftStateFromGuidedPreview(
      recommendation?.applyPayload?.objectInputs || {},
      recommendation?.applyPayload?.systemInputs || null,
    );
    const hierarchyHealth =
      previewDraftState.topologyKind !== "single"
        ? buildTopologyHealthAssessment(previewDraftState)
        : null;
    if (!model && !systemPreview) return null;
    return createElement("div", { className: "guided-preview guided-preview--star" }, [
      createElement("div", {
        className: "guided-preview__title",
        text: "Solved preview in the current star-editor context",
      }),
      createElement("div", { className: "guided-preview__grid" }, [
        createStarGuidedPreviewMetric(getHostClassLabel(model), getHostClassValue(model)),
        createStarGuidedPreviewMetric(getHostZoneLabel(model), formatHostZoneValue(model)),
        createStarGuidedPreviewMetric(
          "Activity",
          activity ? `${activity.teffBin}/${activity.ageBand}` : "n/a",
          activity ? `${fmt(activity.energeticFlareRatePerDay, 2)} flares/day` : "",
        ),
        createStarGuidedPreviewMetric(
          isBrownDwarfModel(model) ? "Direct Earth-like Life" : "Earth-like Life",
          isBrownDwarfModel(model) ? "No (substellar host)" : model?.earthLikeLifePossible,
        ),
        createStarGuidedPreviewMetric("System", systemPreview?.label),
        createStarGuidedPreviewMetric("Default Host", systemPreview?.defaultHostFrameLabel),
        hierarchyHealth
          ? createStarGuidedPreviewMetric(
              "Hierarchy Health",
              systemPreview?.hierarchyHealthLabel || hierarchyHealth.headline,
              systemPreview?.hierarchyHealthSummary ||
                `${hierarchyHealth.summary} ${hierarchyHealth.fluxSummary}`.trim(),
            )
          : null,
        createStarGuidedPreviewMetric(
          "Companion Context",
          systemPreview?.companionSummary,
          systemPreview?.impact || "",
        ),
      ]),
    ]);
  }

  function getDerivMode() {
    for (const r of physicsDerivRadios) {
      if (r.checked) return r.value;
    }
    return "rl";
  }

  function setDerivMode(mode) {
    for (const r of physicsDerivRadios) {
      r.checked = r.value === mode;
    }
  }

  // Returns the override values to pass to calcStar based on current mode/state.
  // In advanced mode, the derivation dropdown controls which pair is active.
  function getEffectiveOverrides() {
    return getEffectiveOverridesForStar(getStarDraftState(getFocusedStarEditorId(), state));
  }

  function render({ preserveFocusedDraft = false } = {}) {
    syncEditorSelectionState();
    const focusedStarId = getFocusedStarEditorId();
    const focusedStar = getStarDraftState(focusedStarId, state);
    const ov = getEffectiveOverrides();
    const model = calcStar({
      ...focusedStar,
      ageGyr: state.ageGyr,
      metallicityFeH: state.metallicityFeH,
      evolutionMode: state.evolutionMode,
      radiusRsolOverride: ov.r,
      luminosityLsolOverride: ov.l,
      tempKOverride: ov.t,
    });
    const activityModel = computeStellarActivityModel(
      {
        massMsun: focusedStar.massMsol,
        ageGyr: state.ageGyr,
        teffK: model.tempK,
        luminosityLsun: model.luminosityLsol,
      },
      { activityCycle: 0.5 },
    );
    const activity = activityModel.activity;
    const isMulti = state.topologyKind !== "single";
    const isTripleLike = state.topologyKind === "triple" || state.topologyKind === "quad";
    const isQuad = state.topologyKind === "quad";
    const companionModel = isMulti ? solveAdditionalStarInputs("star_b", state) : null;
    const tertiaryModel = isTripleLike ? solveAdditionalStarInputs("star_c", state) : null;
    const quaternaryModel = isQuad ? solveAdditionalStarInputs("star_d", state) : null;
    const hostFrameRecords = listStellarSystemHostFrames(buildStellarSystemFromState());
    const topologyHealth = buildTopologyHealthAssessment();
    const activeHostFrameRecord =
      hostFrameRecords.find(
        (frame) =>
          frame.id ===
          normalizeTopologyHostFrameId(
            state.defaultHostFrameId,
            state.topologyKind,
            state.quadLayoutKind,
          ),
      ) || null;
    const outputViewModel = buildStarOutputViewModel({
      state,
      focusedStar,
      model,
      activity,
      companionModel,
      tertiaryModel,
      quaternaryModel,
      hostFrameRecords,
      topologyHealth,
      activeHostFrameRecord,
    });

    renderStarCurrentStateSummary({
      copyEl: starCurrentStateCopyEl,
      gridEl: starCurrentStateGridEl,
      notesEl: starCurrentStateNotesEl,
      guidanceEl: starTopologyGuidanceEl,
      ...outputViewModel.currentStateSummary,
    });

    syncFocusedStarEditorInputs({ syncVisibleInputs: !preserveFocusedDraft });
    renderKpiSections(kpisEl, outputViewModel.kpiSections);
    renderOutputStarStrip(kpisEl.querySelector("#star-summary"), focusedStarId, state);

    renderDerivedDetails(detailsEl, outputViewModel.detailSections, { title: "Derived Details" });

    sunPreviewController.attach(kpisEl.querySelector(".sun-preview-canvas"), {
      starName: focusedStar.name,
      starMassMsol: focusedStar.massMsol,
      starAgeGyr: state.ageGyr,
      starTempK: model.tempK,
      starColourHex: model.starColourHex,
      activity,
    });

    updateTopologyUI({ syncVisibleStarInputs: !preserveFocusedDraft });

    if (isBrownDwarfModel(model)) {
      radiusHintEl.textContent = `Auto (cooling track): ${fmt(model.radiusRsolAuto, 3)} Rsol`;
      luminosityHintEl.textContent = `Auto (cooling track): ${formatLuminosityLsol(model.luminosityLsolAuto, 4)} Lsol`;
    } else if (model.evolutionMode === "evolved") {
      const rz = model.radiusRsolZams;
      const lz = model.luminosityLsolZams;
      radiusHintEl.textContent = `Auto (evolved): ${fmt(model.radiusRsolAuto, 3)} Rsol  (ZAMS: ${fmt(rz, 3)})`;
      luminosityHintEl.textContent = `Auto (evolved): ${formatLuminosityLsol(model.luminosityLsolAuto, 4)} Lsol  (ZAMS: ${formatLuminosityLsol(lz, 4)})`;
    } else {
      radiusHintEl.textContent = `Auto (mass-derived): ${fmt(model.radiusRsolAuto, 3)} Rsol`;
      luminosityHintEl.textContent = `Auto (mass-derived): ${formatLuminosityLsol(model.luminosityLsolAuto, 4)} Lsol`;
    }
    tempHintEl.textContent = `Auto (from R and L): ${fmt(model.tempK, 0)} K`;

    evolutionHintEl.textContent = isBrownDwarfModel(model)
      ? "Brown dwarfs use the shared substellar cooling solver. Their current temperate zone and luminosity shift over time as they cool."
      : state.evolutionMode === "evolved"
        ? "Luminosity and radius evolve with age and metallicity (Hurley, Pols & Tout 2000)."
        : "Properties derived from mass only (static scaling laws).  Enable to model stellar ageing.";

    updatePhysicsUI(model, focusedStar);
  }

  // Show/hide input rows and update status based on mode and derivation choice.
  function updatePhysicsUI(model, starDraft = getStarDraftState(getFocusedStarEditorId(), state)) {
    const isAdvanced = starDraft.physicsMode === "advanced";
    advancedDerivRowEl.style.display = isAdvanced ? "" : "none";
    physicsModeHintEl.textContent = isAdvanced
      ? "Specify any two of Radius, Luminosity, and Temperature; the third is computed via Stefan-Boltzmann (L = R² × (T/5776)⁴)."
      : isBrownDwarfModel(model)
        ? "Brown-dwarf properties are derived from the shared substellar cooling solver. Toggle Advanced to override specific values."
        : "All physical properties are derived from mass and age using stellar scaling laws. Toggle Advanced to override specific values.";

    if (isAdvanced) {
      const dm = starDraft.advancedDerivationMode;
      // Show exactly the two input rows for the selected pair
      radiusOverrideRowEl.style.display = dm === "rl" || dm === "rt" ? "" : "none";
      luminosityOverrideRowEl.style.display = dm === "rl" || dm === "lt" ? "" : "none";
      tempOverrideRowEl.style.display = dm === "rt" || dm === "lt" ? "" : "none";
      resolutionStatusEl.style.display = "";

      if (dm === "rl") {
        resolutionStatusEl.textContent = `Computed: Temperature = ${fmt(model.tempK, 0)} K`;
      } else if (dm === "rt") {
        resolutionStatusEl.textContent = `Computed: Luminosity = ${formatLuminosityLsol(model.luminosityLsol, 4)} Lsol`;
      } else if (dm === "lt") {
        resolutionStatusEl.textContent = `Computed: Radius = ${fmt(model.radiusRsol, 3)} Rsol`;
      }
    } else {
      // Simple mode: hide all override inputs
      radiusOverrideRowEl.style.display = "none";
      luminosityOverrideRowEl.style.display = "none";
      tempOverrideRowEl.style.display = "none";
      resolutionStatusEl.style.display = "none";
    }
  }

  function syncBoundInputs() {
    massBinding.syncFromNumber({ commit: false, normalize: true });
    ageBinding.syncFromNumber({ commit: false, normalize: true });
    metallicityBinding.syncFromNumber({ commit: false, normalize: true });
  }

  inputController = createStarInputController({
    defaults,
    getState: () => state,
    wrap,
    elements: {
      activeHostFrameEl,
      ageEl,
      binaryArgPeriapsisEl,
      binaryEccentricityEl,
      binaryInclinationEl,
      binaryMeanAnomalyEl,
      binarySemiMajorAxisEl,
      companionMassEl,
      companionNameEl,
      editorInspectorModeEl,
      editorTargetPillsEl,
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
      radiusOverrideRowEl,
      luminosityOverrideRowEl,
      tempOverrideRowEl,
      stellarClassApplyBtn,
      stellarClassInputEl,
      stellarClassStatusEl,
      starEditorTargetEl,
      tempOverrideEl,
      tertiaryMassEl,
      tertiaryNameEl,
      topologyCardGridEl,
      topologyKindEl,
      topologyMapNodesEl,
      tripleOuterArgPeriapsisEl,
      tripleOuterEccentricityEl,
      tripleOuterInclinationEl,
      tripleOuterMeanAnomalyEl,
      tripleOuterSemiMajorAxisEl,
      quadLayoutCardGridEl,
    },
    radioGroups: {
      evolutionModeRadios,
      physicsDerivRadios,
      physicsModeRadios,
      quadLayoutRadios,
    },
    buttons: {
      btnReset: wrap.querySelector("#btn-reset"),
      btnSol: wrap.querySelector("#btn-sol"),
      luminosityClearBtn: wrap.querySelector("#luminosityClear"),
      radiusClearBtn: wrap.querySelector("#radiusClear"),
      starCreateGuidedBtn,
      starCreateQuickBtn,
      tempClearBtn: wrap.querySelector("#tempClear"),
    },
    helpers: {
      HOST_COMPONENT_MASS_MIN,
      assignStarDraftState,
      buildPreviewWorldFromDraft,
      buildStellarSystemFromDraft,
      confirmDestructiveAction,
      editorUiState,
      getDerivMode,
      getFocusedStarEditorId,
      getStarDraftState,
      getStarEditorFieldConfig,
      normalizeQuadLayoutKind,
      normalizeTopologyHostFrameId,
      openStarGuidedFlow: (...args) => openStarGuidedFlow(...args),
      openStarGuidedQuickPicker: (...args) => openStarGuidedQuickPicker(...args),
      persistState,
      planStellarSystemChange,
      render: (options) => render(options),
      sanitiseCompanionName,
      sanitiseName,
      sanitiseQuaternaryName,
      sanitiseTertiaryName,
      setDerivMode,
      setEditorMode,
      setSelectedEditorTarget,
      syncBoundInputs,
      syncFocusedStarEditorInputs,
      updateTopologyUI,
    },
  });

  const { applyStarGuidedRecommendation, getStarGuidedSessionTarget } = createStarPresetActions({
    defaults,
    state,
    getFocusedStarEditorId,
    getStarDraftState,
    assignStarDraftState,
    applyStarSystemInputs: (...args) => inputController?.applyStarSystemInputs(...args),
    syncFocusedStarEditorInputs,
    setDerivMode,
    persistState,
    render,
  });

  const extractedStarGuidedFlows = createStarGuidedFlows({
    overlayClosers,
    buildStarGuidedContext,
    getStarGuidedSessionTarget,
    buildStarGoalTextAssist,
    buildStarGoalQuestionValues,
    buildStarGoalStatus,
    setStarGoalDraftValue,
    createStarGuidedPreviewContent,
    applyStarGuidedRecommendation,
  });

  function openStarGuidedQuickPicker(restoredSession = null, dedicatedBaseHash = "") {
    extractedStarGuidedFlows.openStarGuidedQuickPicker(restoredSession, dedicatedBaseHash);
  }

  function openStarGuidedFlow(restoredSession = null, dedicatedBaseHash = "") {
    extractedStarGuidedFlows.openStarGuidedFlow(restoredSession, dedicatedBaseHash);
  }

  inputController.hydrateInputs();
  render();
  inputController.bindListeners();

  const restoredGuidedSession = loadGuidedSession("star", getStarGuidedSessionTarget());
  if (guidedRoute?.dedicated && guidedRoute.objectType === "star") {
    if (guidedRoute.uxMode === "quick") {
      openStarGuidedQuickPicker(
        restoredGuidedSession?.uxMode === "quick" ? restoredGuidedSession : null,
        guidedRoute.baseHash || "",
      );
    } else {
      openStarGuidedFlow(
        restoredGuidedSession?.uxMode === "guided" ? restoredGuidedSession : null,
        guidedRoute.baseHash || "",
      );
    }
  } else if (restoredGuidedSession?.uxMode === "quick") {
    openStarGuidedQuickPicker(restoredGuidedSession);
  } else if (restoredGuidedSession) {
    openStarGuidedFlow(restoredGuidedSession);
  }

  return () => {
    overlayClosers.forEach((closeOverlay) => {
      try {
        closeOverlay();
      } catch {
        // Ignore close failures during page teardown.
      }
    });
    _starPageObserver.disconnect();
    sunPreviewController.dispose();
  };
}
