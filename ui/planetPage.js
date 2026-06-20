import { calcPlanetExact, ISOTOPE_HEAT_FRACTIONS } from "../engine/planet.js";
import { calcPlanetaryBody } from "../engine/planetaryBody.js";
import { calcStar } from "../engine/star.js";
import { calcSystem } from "../engine/system.js";
import { normalizeRingMode, RING_MODE_AUTO, RING_MODE_FORCE_ON } from "../engine/planetaryRings.js";
import { fmt, relativeLuminance } from "../engine/utils.js";
import { bindNumberAndSlider } from "./bind.js";
import { confirmDestructiveAction } from "./destructiveActionDialog.js";
import { bindOrbitRangeControl, ORBIT_AU_MAX, ORBIT_AU_MIN } from "./orbitRangeControl.js";
import {
  buildGuidedGoalQuestionValues,
  buildGuidedGoalStatus,
  buildGuidedGoalTextAssist,
  setGuidedGoalDraftValue,
} from "./guidedCreation/goalState.js";
import { loadGuidedSession } from "./guidedCreation/sessionState.js";
import { buildGasGiantRecipeApplyInputs } from "./guidedCreation/adapters/gasGiant.js";
import { getGuidedEntryModeTooltip } from "./guidedCreation/tooltips.js";
import { attachTooltips, tipAttr, tipIcon } from "./tooltip.js";
import { computeGasGiantVisualProfile, styleLabel, GAS_GIANT_RECIPES } from "./gasGiantStyles.js";
import { ROCKY_RECIPES } from "./rockyPlanetStyles.js";
import {
  getInsolationZoneLabelForRegime,
  normalizeGiantCompanionClass,
  regimeDisplayLabel,
} from "../engine/substellarRegime.js";
import { createCelestialVisualPreviewController } from "./lazyCelestialVisualPreview.js";
import { createTutorial } from "./tutorial.js";
import { launchGuidedMoonForParent } from "./moonGuidedLaunch.js";
import { buildPlanetaryVisualControlManifest } from "./planetaryVisual/controlManifest.js";
import { resolvePlanetaryVisualDescriptor } from "./planetaryVisual/descriptor.js";
import { openPlanetaryVisualEditor } from "./planetaryVisual/editorDom.js";
import { buildPageIntroHtml } from "./pageIntro.js";
import { buildBodySelectorEntries, filterBodySelectorEntries } from "./planet/bodySelector.js";
import {
  buildPlanetaryBodyClassificationSummary,
  hasLimitedSurfaceApplicability,
} from "./planet/bodyClassificationSummary.js";
import { buildPhotochemicalHazeOutputItems } from "./planet/photochemicalHazeOutputs.js";
import { buildSurfaceOceanOutputContext } from "./planet/surfaceOceanCoverageOutputs.js";
import { buildLongTermDynamicsSection } from "./planet/longTermDynamicsOutput.js";
import {
  buildGasGiantCoupledContextItems,
  buildGasGiantTemperatureItems as buildGasGiantTemps,
  buildGasGiantThermalDetailItems,
} from "./planet/gasGiantOutputItems.js";
import {
  ROCKY_ACTIVITY_LABELS,
  ROCKY_ENVIRONMENT_LABELS,
  ROCKY_HABITABILITY_LABELS,
  ROCKY_IDENTITY_LABELS,
  ROCKY_PHYSICAL_LABELS,
  ROCKY_SUMMARY_LABELS,
  ROCKY_SYSTEM_LABELS,
  formatRockyTectonicProbabilities,
} from "./planet/rockyOutputGroups.js";
import {
  applyGasGiantGuidedRecommendation,
  applyGasGiantPresetInputs,
  applyRockyGuidedRecommendation,
  applyRockyPresetInputs,
  getGasGiantGuidedSessionTarget,
  getRockyGuidedSessionTarget,
} from "./planet/presetActions.js";
import { createPlanetGuidedFlows } from "./planet/guidedFlows.js";
import {
  normalizeRingStyleId,
  resolveRingAppearance,
  RING_STYLE_AUTO,
} from "./ringAppearanceProfiles.js";
import {
  clampGasGiantRadiusRj,
  getGiantCompanionClass,
  isBrownDwarfCompanion,
  getGiantCompanionDisplayLabel,
  getHostZoneLabel,
  getHostClassValue,
  formatHostZoneValue,
  getHostLifetimeValue,
  getHostLifetimeMeta,
  buildLuminosityKpiMeta,
  buildLuminosityKpiTooltip,
  formatLuminosityLsol,
  formatScaledLuminosityLsol,
  formatRecurrence,
  shortPopulationLabel,
  deriveGasGiantAppearanceState,
  buildBrownDwarfCompanionPresentation,
  buildGiantCompanionClassOptions,
  buildGiantCompanionFormDescriptors,
  buildGiantCompanionContextClassText,
  getGasGiantRingModeLabel,
  formatGasGiantRingHint,
  buildGasGiantRingDisplay,
  getRingStyleSourceLabel,
  buildRingStyleDisplay,
  formatRingStyleHint,
  syncRingStyleControl,
  buildRockyPlanetModel,
  deriveRockyPlanetAppearanceState,
  formatRockyRingHint,
  buildRockyRingDisplay,
} from "./planet/bodyAppearance.js";
import {
  findNearestSlot,
  normalizeHostFrameId,
  buildPlanetHomeSystemContext,
  buildCurrentSystemModel,
  resolvePlanetPageHostFrameContext,
  filterBodiesForHostFrame,
  buildHostFrameOptions,
  formatHostFrameHint,
  formatHostFrameStabilityHint,
  buildSelectedBodyContextReadout,
} from "./planet/hostFrame.js";
import * as formHelpers from "./planet/formHelpers.js";
import {
  createVegetationInfoOverlay,
  renderBodyActionButtons,
  renderBodySelector,
  renderPlanetaryBodyClassificationSummary,
  renderMoonSection,
  renderHint,
  renderPlanetEmptyState,
  renderPlanetSlotSelector,
  renderVegetationGrid,
} from "./planet/domRender.js";
import { createKpiGrid, renderTectonicProbabilityBar } from "./planet/outputRender.js";
import { createDerivedDetails } from "./derivedDetails.js";
import { createEraTimelineSection } from "./eraTimelinePanel.js";
import { renderKpiSections } from "./kpiSections.js";
import { enableOutputSectionTabs } from "./outputSectionTabs.js";
import {
  buildBrownDwarfPlanetResultSummary,
  buildGasGiantPlanetResultSummary,
  buildRockyPlanetResultSummary,
  buildVolatilePlanetResultSummary,
  renderPlanetResultSummary,
} from "./planet/resultSummary.js";
import { renderGasGiantInputForm, renderRockyInputForm } from "./planet/inputRender.js";
import { vegGridOrbit, vegGridTwilightOrbit } from "./planet/vegetationGridModel.js";
import { PLANET_TUTORIAL_STEPS as TUTORIAL_STEPS } from "./planet/tutorials.js";
import { TIP_LABEL } from "./planet/tooltips.js";
import {
  GAS_GIANT_RADIUS_MAX_RJ,
  GAS_GIANT_RADIUS_MIN_RJ,
  GAS_GIANT_RADIUS_STEP_RJ,
  BROWN_DWARF_MASS_MAX_MJUP,
  BROWN_DWARF_MASS_MIN_MJUP,
  GAS_GIANT_MASS_MAX_MJUP,
  GAS_GIANT_METALLICITY_MIN,
  GAS_GIANT_METALLICITY_MAX,
  GAS_GIANT_METALLICITY_STEP,
  GIANT_COMPANION_CLASS_BROWN_DWARF,
  GIANT_COMPANION_CLASS_GAS_GIANT,
  getGiantCompanionMassBounds,
  loadWorld,
  updateWorld,
  listPlanetaryBodies,
  listPlanets,
  getSelectedPlanet,
  selectPlanet,
  createPlanetFromInputs,
  deleteGasGiant,
  deletePlanet,
  updatePlanet,
  assignPlanetToSlot,
  applyPlanetaryBodyVisualPatch,
  listMoons,
  createMoonFromInputs,
  selectMoon,
  listSystemGasGiants,
  listSystemDebrisDisks,
  getSelectedGasGiant,
  selectGasGiant,
  selectBodyType,
  randomGasGiantRadiusRj,
  saveSystemGasGiants,
  getStarOverrides,
  getProjectedPrimaryStar,
  planDeleteGasGiant,
  planDeletePlanet,
} from "./store.js";

/* ── Page ────────────────────────────────────────────────────────── */

export function initPlanetPage(mountEl, options = {}) {
  const guidedRoute = options?.routeContext?.guided || null;
  // CMF auto-mode state (shared between selection handler and renderRockyOutputs)
  let cmfAutoBtn = null;
  let cmfEl = null;
  let cmfSliderEl = null;
  let cmfIsAuto = true;
  function updateCmfAutoState() {
    if (cmfAutoBtn) cmfAutoBtn.classList.toggle("active", cmfIsAuto);
    if (cmfEl) cmfEl.classList.toggle("auto-value", cmfIsAuto);
  }

  // Tectonic regime state (shared between selection handler and renderRockyOutputs)
  let tecPillsEl = null;
  function getTecPillValue() {
    if (!tecPillsEl) return null;
    const checked = tecPillsEl.querySelector('input[name="tecRegime"]:checked');
    return checked ? checked.value : null;
  }
  function setTecPillValue(val) {
    if (!tecPillsEl) return;
    const radio = tecPillsEl.querySelector(`input[name="tecRegime"][value="${val}"]`);
    if (radio) radio.checked = true;
  }
  function updateTecRecommended(recVal) {
    if (!tecPillsEl) return;
    tecPillsEl.querySelectorAll('input[name="tecRegime"]').forEach((r) => {
      r.toggleAttribute("data-recommended", r.value === recVal);
    });
    tecPillsEl.classList.toggle("tec-recommended-active", getTecPillValue() === recVal);
  }

  const celestialPreviewController = createCelestialVisualPreviewController({
    speedDaysPerSec: 0.5,
  });

  const wrap = document.createElement("div");
  wrap.className = "page";
  wrap.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--inner-planets" aria-hidden="true"></span><span>Planets</span></h1>
        <button id="planetTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        ${buildPageIntroHtml({
          summary:
            "Create rocky planets and gas giants, then place them into the current stellar architecture.",
          controls:
            "The selected body, its host frame and orbital slot, plus its rocky or gas-giant physics inputs.",
          affects:
            "Moon parents, visualizer placement, climate assumptions, and later apparent or biology-facing pages.",
          primaryAction:
            "Select or create a body, assign its host frame and slot, then tune the physical inputs.",
          compact: true,
          detailsTitle: "Planet workflow context",
          detailsSummary: "Body selection, host frame, and slot choices drive downstream pages.",
        })}
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">
          <div class="label">Derived Data ${tipIcon(TIP_LABEL["Star (read-only)"])}</div>
          <div class="derived-readout" id="starInfo"></div>
          <div style="height:12px"></div>

          <div class="label">Body selection ${tipIcon(TIP_LABEL["Body selection"])}</div>
          <div class="form-row">
            <div>
              <div class="hint">Select, search, or create a body in the current system.</div>
            </div>
            <div class="select-stack body-switcher">
              <input id="bodySearch" class="body-switcher__search" type="search" placeholder="Search bodies" aria-label="Search bodies" />
              <select id="bodySelect"></select>
              <div class="new-body-control">
                <select id="newBodyIntent" aria-label="New body starting intent">
                  <option value="rocky">Rocky world</option>
                  <option value="volatile">Volatile / mini-Neptune</option>
                  <option value="iceGiant">Ice giant</option>
                  <option value="gasGiant">Gas giant</option>
                  <option value="substellar">Substellar companion</option>
                </select>
                <button id="newBody" class="small" type="button">New body</button>
              </div>
              <div class="select-actions">
                <button id="newRockyPlanet" class="small" type="button">Rocky quick start</button>
                <button id="newGasGiant" class="small" type="button">Gas giant quick start</button>
                <button id="deleteBody" class="small danger" type="button">Delete</button>
              </div>
            </div>
          </div>
          <div id="bodyClassificationSummary" class="body-classification-summary" hidden></div>

          <div id="rockyCreateEntry" class="guided-entry-strip" hidden>
            <div class="guided-entry-strip__title">Create This Rocky World</div>
            <div id="rockyCreateEntryHint" class="guided-entry-strip__copy">
              Quick applies a rocky archetype, Guided walks you to a recommendation, and Advanced
              is the direct editor below. Use Recipes alongside Advanced when you want a preset
              starting point: Recipes will override the current rocky-world inputs.
            </div>
            <div class="guided-entry-strip__modes">
              <button id="rockyCreateQuickBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("quick"))}>
                Quick
              </button>
              <button id="rockyCreateGuidedBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("guided"))}>
                Guided
              </button>
              <button id="rockyCreateRecipesBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("recipes"))}>
                Recipes
              </button>
              <span class="guided-entry-strip__mode guided-entry-strip__mode--current" aria-current="page" ${tipAttr(getGuidedEntryModeTooltip("advanced"))}>
                Advanced
              </span>
            </div>
          </div>

          <div id="gasGiantCreateEntry" class="guided-entry-strip" hidden>
            <div class="guided-entry-strip__title">Create This Gas Giant</div>
            <div id="gasGiantCreateEntryHint" class="guided-entry-strip__copy">
              Quick applies a gas-giant archetype, Guided walks you to a recommendation, and
              Advanced is the direct editor below. Use Recipes alongside Advanced when you want a
              preset starting point: Recipes will override the current gas-giant inputs.
            </div>
            <div class="guided-entry-strip__modes">
              <button id="gasGiantCreateQuickBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("quick"))}>
                Quick
              </button>
              <button id="gasGiantCreateGuidedBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("guided"))}>
                Guided
              </button>
              <button id="gasGiantCreateRecipesBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("recipes"))}>
                Recipes
              </button>
              <span class="guided-entry-strip__mode guided-entry-strip__mode--current" aria-current="page" ${tipAttr(getGuidedEntryModeTooltip("advanced"))}>
                Advanced
              </span>
            </div>
          </div>

          <div id="bodyInputs"></div>
          <div id="bodyMoons" style="margin-top:14px"></div>
          <div id="bodyActions" style="margin-top:10px"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Outputs</h2></div>
        <div class="panel__body" id="bodyOutputs"></div>
      </div>
    </div>
  `;
  mountEl.appendChild(wrap);
  createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.planet.tutorial",
    container: wrap,
    triggerBtn: wrap.querySelector("#planetTutorials"),
  });

  const overlayClosers = new Set();
  const previewCleanupObserver = new MutationObserver(() => {
    if (wrap.isConnected) return;
    celestialPreviewController.dispose();
    previewCleanupObserver.disconnect();
  });
  previewCleanupObserver.observe(document.body, { childList: true, subtree: true });

  const starInfoEl = wrap.querySelector("#starInfo");
  const bodySel = wrap.querySelector("#bodySelect");
  const bodySearchEl = wrap.querySelector("#bodySearch");
  const newBodyIntentEl = wrap.querySelector("#newBodyIntent");
  const newBodyBtn = wrap.querySelector("#newBody");
  const bodyClassificationSummaryEl = wrap.querySelector("#bodyClassificationSummary");
  const rockyCreateEntryEl = wrap.querySelector("#rockyCreateEntry");
  const rockyCreateEntryHintEl = wrap.querySelector("#rockyCreateEntryHint");
  const rockyCreateQuickBtn = wrap.querySelector("#rockyCreateQuickBtn");
  const rockyCreateGuidedBtn = wrap.querySelector("#rockyCreateGuidedBtn");
  const rockyCreateRecipesBtn = wrap.querySelector("#rockyCreateRecipesBtn");
  const gasGiantCreateEntryEl = wrap.querySelector("#gasGiantCreateEntry");
  const gasGiantCreateEntryHintEl = wrap.querySelector("#gasGiantCreateEntryHint");
  const gasGiantCreateQuickBtn = wrap.querySelector("#gasGiantCreateQuickBtn");
  const gasGiantCreateGuidedBtn = wrap.querySelector("#gasGiantCreateGuidedBtn");
  const gasGiantCreateRecipesBtn = wrap.querySelector("#gasGiantCreateRecipesBtn");
  const bodyInputsEl = wrap.querySelector("#bodyInputs");
  const bodyMoonsEl = wrap.querySelector("#bodyMoons");
  const bodyActionsEl = wrap.querySelector("#bodyActions");
  const bodyOutputsEl = wrap.querySelector("#bodyOutputs");

  bodyMoonsEl.addEventListener("click", (event) => {
    const guidedMoonBtn = event.target.closest?.("button[data-action='guided-moon']");
    if (guidedMoonBtn) {
      const bodyType = guidedMoonBtn.dataset.bodyType || "planet";
      const bodyId = guidedMoonBtn.dataset.bodyId || "";
      launchGuidedMoonForParent(bodyType, bodyId, { sourcePage: "planet" });
      return;
    }

    const addMoonBtn = event.target.closest?.("#addMoonToBody");
    if (addMoonBtn) {
      const bodyType = addMoonBtn.dataset.bodyType || "planet";
      const bodyId = addMoonBtn.dataset.bodyId || "";
      const defaults = {
        name: "Luna",
        semiMajorAxisKm: bodyType === "gasGiant" ? 500000 : 384748,
        eccentricity: bodyType === "gasGiant" ? 0.01 : 0.055,
        inclinationDeg: bodyType === "gasGiant" ? 1 : 5.15,
        massMoon: 1.0,
        densityGcm3: bodyType === "gasGiant" ? 3.0 : 3.34,
        albedo: bodyType === "gasGiant" ? 0.2 : 0.136,
      };
      createMoonFromInputs(defaults, { name: "New Moon", planetId: bodyId });
      location.hash = "#/moon";
      return;
    }

    const editMoonBtn = event.target.closest?.("button[data-action='edit-moon']");
    if (!editMoonBtn) return;
    const moonId = editMoonBtn.dataset.moonId || editMoonBtn.getAttribute("data-moon-id");
    if (!moonId) return;
    selectMoon(moonId);
    location.hash = "#/moon";
  });

  bodyOutputsEl.addEventListener("click", (event) => {
    const visualEditorBtn = event.target.closest?.("#editPlanetaryVisual");
    if (visualEditorBtn) {
      openSelectedPlanetaryVisualEditor();
      return;
    }

    const emptyActionBtn = event.target.closest?.("button[data-planet-empty-action]");
    if (!emptyActionBtn) return;
    const action = emptyActionBtn.dataset.planetEmptyAction || "";
    if (action === "new-gas-giant") {
      createNewGasGiant();
      return;
    }
    if (action === "guided-rocky") {
      createNewRockyPlanet({ openGuided: true });
      return;
    }
    createNewRockyPlanet();
  });

  let isRendering = false;
  let renderQueued = false;
  let pendingOutputsOnly = true;
  let noticeTimer = null;

  function scheduleRender(outputsOnly = false) {
    if (!outputsOnly) pendingOutputsOnly = false;
    if (renderQueued) return;
    renderQueued = true;
    setTimeout(() => {
      renderQueued = false;
      const oo = pendingOutputsOnly;
      pendingOutputsOnly = true;
      render(oo);
    }, 0);
  }

  function solveRockyModelForWorld(world, { planetId, planetInputs }) {
    const activePlanetId = planetId || world.planets?.selectedId || null;
    const currentPlanet = activePlanetId ? world.planets?.byId?.[activePlanetId] || null : null;
    const draftPlanet = {
      ...(currentPlanet || {}),
      hostFrameId: planetInputs?.hostFrameId ?? currentPlanet?.hostFrameId ?? null,
      inputs: {
        ...(currentPlanet?.inputs || {}),
        ...(planetInputs || {}),
      },
    };
    const homeSystemContext = buildPlanetHomeSystemContext(world);
    const primaryStar = getProjectedPrimaryStar(world);
    const solveContext = resolvePlanetPageHostFrameContext(
      world,
      draftPlanet,
      null,
      homeSystemContext,
    );
    const hostFrameId = normalizeHostFrameId(
      solveContext?.hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const assignedMoons = listMoons(world)
      .filter((moon) => moon?.planetId === activePlanetId)
      .map((moon) => moon?.inputs || {});
    const gasGiants = filterBodiesForHostFrame(
      listSystemGasGiants(world),
      hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    ).map((gasGiant) => ({ name: gasGiant.name, au: gasGiant.au }));
    const model = calcPlanetExact({
      starMassMsol:
        Number(solveContext?.starConfig?.massMsol) || Number(primaryStar?.massMsol) || 1,
      starAgeGyr: Number(solveContext?.starConfig?.ageGyr) || Number(primaryStar?.ageGyr) || 4.6,
      starMetallicityFeH:
        Number(solveContext?.starConfig?.metallicityFeH) ||
        Number(primaryStar?.metallicityFeH) ||
        0,
      starRadiusRsolOverride: solveContext?.starConfig?.radiusRsolOverride ?? null,
      starLuminosityLsolOverride: solveContext?.starConfig?.luminosityLsolOverride ?? null,
      starTempKOverride: solveContext?.starConfig?.tempKOverride ?? null,
      starEvolutionMode: solveContext?.starConfig?.evolutionMode || "zams",
      hostFrameId: solveContext?.hostFrameId || hostFrameId,
      hostFrame: solveContext?.hostFrame || null,
      hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
      hostPrebioticUvEarthAt1Au: solveContext?.hostPrebioticUvEarthAt1Au ?? null,
      hostWindPressureEarthAt1Au: solveContext?.hostWindPressureEarthAt1Au ?? null,
      companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
      companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
      companionPrebioticUvEarth: solveContext?.companionPrebioticUvEarth ?? 0,
      companionWindPressureEarth: solveContext?.companionWindPressureEarth ?? 0,
      fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
      planet: draftPlanet.inputs,
      moons: assignedMoons,
      gasGiants,
    });
    const hzInner = Number(
      solveContext?.hostFrame?.zones?.habitableZoneAu?.inner ?? model?.derived?.hzInnerAu,
    );
    const hzOuter = Number(
      solveContext?.hostFrame?.zones?.habitableZoneAu?.outer ?? model?.derived?.hzOuterAu,
    );
    const currentOrbitAu = Number(draftPlanet.inputs?.semiMajorAxisAu);
    const orbitText = Number.isFinite(currentOrbitAu)
      ? `${fmt(currentOrbitAu, 3)} AU`
      : "unknown orbit";
    const hzText =
      Number.isFinite(hzInner) && Number.isFinite(hzOuter)
        ? `${fmt(hzInner, 3)} - ${fmt(hzOuter, 3)} AU`
        : "unknown";
    const hostFrameClimateText =
      solveContext?.hostFrame?.frameKind === "pair"
        ? "Combined pair light sets the climate in this frame."
        : Number(solveContext?.companionFluxEarth || 0) > 0.0005
          ? `Companion flux adds about ${fmt(solveContext.companionFluxEarth, 3)}x Earth.`
          : "";
    const stabilityText = formatHostFrameStabilityHint(solveContext?.hostFrame);

    return {
      model,
      starHabitableZoneAu:
        Number.isFinite(hzInner) && Number.isFinite(hzOuter)
          ? { inner: hzInner, outer: hzOuter }
          : null,
      contextText:
        `Host frame ${solveContext?.hostFrame?.label || "unknown"}. Current orbit ${orbitText}. ` +
        `Habitable zone ${hzText}. ` +
        `${model?.derived?.inHabitableZone ? "The current orbit is inside it." : "The current orbit is outside it."} ` +
        `${hostFrameClimateText ? `${hostFrameClimateText} ` : ""}` +
        `${stabilityText || ""}`,
    };
  }

  function buildRockyGuidedContext() {
    const world = loadWorld();
    const selectedPlanet = getSelectedPlanet(world);
    const activePlanetInputs = selectedPlanet?.inputs || world.planet || {};
    const solvedContext = selectedPlanet
      ? solveRockyModelForWorld(world, {
          planetId: selectedPlanet.id,
          planetInputs: activePlanetInputs,
        })
      : { model: null, starHabitableZoneAu: null, contextText: "No rocky planet selected." };

    return {
      currentPlanetId: selectedPlanet?.id || null,
      currentPlanetName: selectedPlanet?.name || activePlanetInputs?.name || "Rocky world",
      currentInputs: { ...(activePlanetInputs || {}) },
      currentContextLabel: "Current host-frame context",
      currentContextText: solvedContext.contextText,
      starHabitableZoneAu: solvedContext.starHabitableZoneAu,
      recipeCatalog: ROCKY_RECIPES,
      solvePlanetInputs: (planetInputs) => {
        const latestWorld = loadWorld();
        const latestPlanet = getSelectedPlanet(latestWorld);
        if (!latestPlanet) {
          return { error: "No rocky planet is currently selected." };
        }
        return solveRockyModelForWorld(latestWorld, {
          planetId: latestPlanet.id,
          planetInputs,
        });
      },
    };
  }

  function buildRockyGoalQuestionValues(flowState, questions = []) {
    return buildGuidedGoalQuestionValues(flowState, questions);
  }

  function setRockyGoalDraftValue(controllerRef, flowState, questionId, value) {
    return setGuidedGoalDraftValue(controllerRef, flowState, questionId, value);
  }

  function buildPlanetGoalTextAssist(
    resolveController,
    flowState,
    { objectType = "", objectLabel = "world" } = {},
  ) {
    return buildGuidedGoalTextAssist(resolveController, flowState, {
      objectType,
      objectLabel,
    });
  }

  function buildRockyGoalStatus(flowState) {
    return buildGuidedGoalStatus(flowState, {
      readyDetail: "The structured goal is valid. Run Search to try seeded rocky-world candidates.",
      searchingDetail:
        "Trying seeded rocky-world candidates against the current host-frame context.",
    });
  }

  function buildGasGiantGoalQuestionValues(flowState, questions = []) {
    return buildGuidedGoalQuestionValues(flowState, questions);
  }

  function setGasGiantGoalDraftValue(controllerRef, flowState, questionId, value) {
    return setGuidedGoalDraftValue(controllerRef, flowState, questionId, value);
  }

  function buildGasGiantGoalStatus(flowState) {
    return buildGuidedGoalStatus(flowState, {
      readyDetail: "The structured goal is valid. Run Search to try seeded gas-giant candidates.",
      searchingDetail: "Trying seeded gas-giant candidates against the current host-frame context.",
    });
  }

  function solveGasGiantModelForWorld(world, { giantId, gasGiantInputs }) {
    const latestWorld = world || loadWorld();
    const currentGiant = listSystemGasGiants(latestWorld).find((entry) => entry.id === giantId);
    if (!currentGiant) {
      return { error: "No gas giant is currently selected." };
    }
    const homeSystemContext = buildPlanetHomeSystemContext(latestWorld);
    const giant = {
      ...currentGiant,
      ...(gasGiantInputs || {}),
    };
    const solveContext = resolvePlanetPageHostFrameContext(
      latestWorld,
      giant,
      null,
      homeSystemContext,
    );
    const hostSystem = solveContext?.hostFrame?.system || homeSystemContext?.primarySystem || null;
    if (
      Number.isFinite(Number(giant.slotIndex)) &&
      Number(giant.slotIndex) >= 1 &&
      Number(giant.slotIndex) <= (hostSystem?.orbitsAu?.length || 0)
    ) {
      giant.slotIndex = Math.round(Number(giant.slotIndex));
      giant.au = hostSystem.orbitsAu[giant.slotIndex - 1];
    } else {
      giant.slotIndex = null;
      giant.au =
        Number.isFinite(Number(giant.au)) && Number(giant.au) > 0
          ? Number(giant.au)
          : currentGiant.au;
    }

    const { gasCalc, derivedStyle, ringState, ringAppearance } = deriveGasGiantAppearanceState(
      latestWorld,
      giant,
      hostSystem,
      listSystemGasGiants(latestWorld).map((entry) => (entry.id === giantId ? giant : entry)),
    );
    const orbitText = Number.isFinite(Number(giant.au))
      ? `${fmt(Number(giant.au), 3)} AU`
      : "unknown orbit";
    const classText = buildGiantCompanionContextClassText(gasCalc);
    const ringText = ringState?.effectiveEnabled
      ? "Rings currently visible."
      : "Rings currently hidden.";

    return {
      model: gasCalc,
      styleId: derivedStyle,
      ringState,
      ringAppearance,
      contextText:
        `Host frame ${solveContext?.hostFrame?.label || "unknown"}. Current orbit ${orbitText}. ` +
        `${classText}. ${gasCalc?.display?.equilibriumTemp || "Unknown equilibrium temperature"}. ` +
        `${ringText} ` +
        `${solveContext?.hostFrame?.frameKind === "pair" ? "Combined pair light sets the climate in this frame. " : Number(solveContext?.companionFluxEarth || 0) > 0.0005 ? `Companion flux adds about ${fmt(solveContext.companionFluxEarth, 3)}x Earth. ` : ""}` +
        `${formatHostFrameStabilityHint(solveContext?.hostFrame) || ""}`,
      starLuminosityLsol: solveContext?.starModel?.luminosityLsol || null,
    };
  }

  function buildGasGiantGuidedContext() {
    const world = loadWorld();
    const selectedGasGiant = getSelectedGasGiant(world);
    const activeInputs = selectedGasGiant || {};
    const solvedContext = selectedGasGiant
      ? solveGasGiantModelForWorld(world, {
          giantId: selectedGasGiant.id,
          gasGiantInputs: activeInputs,
        })
      : { model: null, contextText: "No gas giant selected." };

    return {
      currentGasGiantId: selectedGasGiant?.id || null,
      currentGasGiantName: selectedGasGiant?.name || "Gas giant",
      currentInputs: { ...(activeInputs || {}) },
      currentContextLabel: "Current host-frame context",
      currentContextText: solvedContext.contextText,
      recipeCatalog: GAS_GIANT_RECIPES,
      starLuminosityLsol: solvedContext.starLuminosityLsol || null,
      solveGasGiantInputs: (gasGiantInputs) => {
        const latestWorld = loadWorld();
        const latestGasGiant = getSelectedGasGiant(latestWorld);
        if (!latestGasGiant) {
          return { error: "No gas giant is currently selected." };
        }
        return solveGasGiantModelForWorld(latestWorld, {
          giantId: latestGasGiant.id,
          gasGiantInputs,
        });
      },
    };
  }

  function showPlanetNotice(message) {
    let noteEl = wrap.querySelector(".planet-float-note");
    if (!noteEl) {
      noteEl = document.createElement("div");
      noteEl.className = "planet-float-note";
      wrap.appendChild(noteEl);
    }
    noteEl.textContent = message;
    noteEl.classList.add("is-visible");
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      noteEl.classList.remove("is-visible");
    }, 3200);
  }

  function syncRockyCreationEntry(world, bodyType) {
    if (!rockyCreateEntryEl) return;
    const isRocky = bodyType !== "gasGiant";
    rockyCreateEntryEl.hidden = !isRocky;
    if (!isRocky) return;
    const selectedPlanet = getSelectedPlanet(world);
    const hasSelection = !!selectedPlanet;
    if (rockyCreateQuickBtn) rockyCreateQuickBtn.disabled = !hasSelection;
    if (rockyCreateGuidedBtn) rockyCreateGuidedBtn.disabled = !hasSelection;
    if (rockyCreateRecipesBtn) rockyCreateRecipesBtn.disabled = !hasSelection;
    if (rockyCreateEntryHintEl) {
      rockyCreateEntryHintEl.textContent = hasSelection
        ? "Quick applies a rocky archetype, Guided walks you to a recommendation, and Advanced is the direct editor below. Use Recipes alongside Advanced when you want a preset starting point: Recipes will override the current rocky-world inputs."
        : "Create or select a rocky planet first. Quick, Guided, and Recipes are currently available for rocky planets, not gas giants.";
    }
  }

  function syncGasGiantCreationEntry(world, bodyType) {
    if (!gasGiantCreateEntryEl) return;
    const isGasGiant = bodyType === "gasGiant";
    gasGiantCreateEntryEl.hidden = !isGasGiant;
    if (!isGasGiant) return;
    const selectedGasGiant = getSelectedGasGiant(world);
    const hasSelection = !!selectedGasGiant;
    if (gasGiantCreateQuickBtn) gasGiantCreateQuickBtn.disabled = !hasSelection;
    if (gasGiantCreateGuidedBtn) gasGiantCreateGuidedBtn.disabled = !hasSelection;
    if (gasGiantCreateRecipesBtn) gasGiantCreateRecipesBtn.disabled = !hasSelection;
    if (gasGiantCreateEntryHintEl) {
      gasGiantCreateEntryHintEl.textContent = hasSelection
        ? "Quick applies a gas-giant archetype, Guided walks you to a recommendation, and Advanced is the direct editor below. Use Recipes alongside Advanced when you want a preset starting point: Recipes will override the current gas-giant inputs."
        : "Create or select a gas giant first. Quick, Guided, and Recipes are currently available for gas giants on this page.";
    }
  }

  /* ── Body selector ──────────────────────────────────────────────── */

  function getSelectedBodySelectorValue(world) {
    const bodyType = world.selectedBodyType || "planet";
    const selectedId =
      bodyType === "gasGiant" ? world.system?.gasGiants?.selectedId : world.planets?.selectedId;
    return selectedId ? `${bodyType === "gasGiant" ? "gasGiant" : "planet"}:${selectedId}` : "";
  }

  function getSelectedPlanetaryBodyModel(world) {
    const selectedValue = getSelectedBodySelectorValue(world);
    if (!selectedValue) return null;
    return (
      listPlanetaryBodies(world).find((body) => {
        const selectorType =
          body?.selector?.type || (body?.legacyKind === "gasGiant" ? "gasGiant" : "planet");
        const selectorId = body?.legacyId || body?.id;
        return (
          body?.selector?.value === selectedValue ||
          `${selectorType}:${selectorId}` === selectedValue
        );
      }) || null
    );
  }

  function buildSolvedSelectedBodyForSummary(world, sysModel, homeSystemContext) {
    const body = getSelectedPlanetaryBodyModel(world);
    if (!body) return null;
    try {
      return calcPlanetaryBody({
        body,
        context: buildUnifiedBodyCalcContext(
          world,
          body,
          sysModel,
          homeSystemContext || buildPlanetHomeSystemContext(world),
        ),
      });
    } catch {
      return body;
    }
  }

  function renderSelectedBodyClassification(world, sysModel, homeSystemContext) {
    const summary = buildPlanetaryBodyClassificationSummary(
      buildSolvedSelectedBodyForSummary(world, sysModel, homeSystemContext),
    );
    renderPlanetaryBodyClassificationSummary(bodyClassificationSummaryEl, summary);
    return summary;
  }

  function buildUnifiedBodyCalcContext(world, body, sysModel, homeSystemContext) {
    const primaryStar = getProjectedPrimaryStar(world);
    const solveContext = resolvePlanetPageHostFrameContext(
      world,
      body,
      sysModel,
      homeSystemContext,
    );
    const hostFrameId = normalizeHostFrameId(
      solveContext?.hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const legacyParentId = body?.legacyId || body?.id;
    const parentKind = body?.legacyKind === "gasGiant" ? "gasGiant" : "planet";
    const moons = listMoons(world)
      .filter(
        (moon) =>
          moon?.parentBodyId === body?.id ||
          (moon?.parentKind === parentKind && moon?.planetId === legacyParentId) ||
          moon?.planetId === legacyParentId,
      )
      .map((moon) => moon?.inputs || {});
    const gasGiants = filterBodiesForHostFrame(
      listSystemGasGiants(world),
      hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    return {
      starMassMsol:
        Number(solveContext?.starConfig?.massMsol) || Number(primaryStar?.massMsol) || 1,
      starAgeGyr: Number(solveContext?.starConfig?.ageGyr) || Number(primaryStar?.ageGyr) || 4.6,
      starMetallicityFeH:
        Number(solveContext?.starConfig?.metallicityFeH) ||
        Number(primaryStar?.metallicityFeH) ||
        0,
      starRadiusRsol:
        Number(solveContext?.starModel?.radiusRsol) ||
        Number(solveContext?.starConfig?.radiusRsolOverride) ||
        1,
      starLuminosityLsol:
        Number(solveContext?.starModel?.luminosityLsol) ||
        Number(solveContext?.starConfig?.luminosityLsolOverride) ||
        1,
      starRadiusRsolOverride: solveContext?.starConfig?.radiusRsolOverride ?? null,
      starLuminosityLsolOverride: solveContext?.starConfig?.luminosityLsolOverride ?? null,
      starTempKOverride: solveContext?.starConfig?.tempKOverride ?? null,
      starEvolutionMode: solveContext?.starConfig?.evolutionMode || "zams",
      hostFrameId,
      hostFrame: solveContext?.hostFrame || null,
      hostXuvFluxEarthAt1Au: solveContext?.hostXuvFluxEarthAt1Au ?? null,
      hostPrebioticUvEarthAt1Au: solveContext?.hostPrebioticUvEarthAt1Au ?? null,
      hostWindPressureEarthAt1Au: solveContext?.hostWindPressureEarthAt1Au ?? null,
      companionFluxEarth: solveContext?.companionFluxEarth ?? 0,
      companionXuvFluxEarth: solveContext?.companionXuvFluxEarth ?? 0,
      companionPrebioticUvEarth: solveContext?.companionPrebioticUvEarth ?? 0,
      companionWindPressureEarth: solveContext?.companionWindPressureEarth ?? 0,
      fluxVariabilityFraction: solveContext?.fluxVariabilityFraction ?? 0,
      moons,
      gasGiants,
    };
  }

  function volatilePreviewStyleId(model) {
    const family = model?.classification?.family;
    if (family === "iceGiant") return "neptune";
    if (family === "miniNeptune") return "sub-neptune";
    return "hazy";
  }

  function buildSelectedPlanetaryVisualEditorContext(world, sysModel) {
    const selectedBody = getSelectedPlanetaryBodyModel(world);
    if (!selectedBody) return null;
    const homeSystemContext = buildPlanetHomeSystemContext(world);
    const bodyType = world.selectedBodyType || "planet";

    if (bodyType === "gasGiant") {
      const giant = getSelectedGasGiant(world);
      if (!giant) return null;
      const solveContext = resolvePlanetPageHostFrameContext(
        world,
        giant,
        sysModel,
        homeSystemContext,
      );
      const hostSystem = solveContext?.hostFrame?.system || sysModel;
      const allGiants = listSystemGasGiants(world);
      const {
        gasCalc,
        derivedStyle,
        ringState,
        ringAppearance,
        gasProfile,
        visualDescriptor,
        visualOverrideSignature,
        visualRenderSignature,
      } = deriveGasGiantAppearanceState(world, giant, hostSystem, allGiants);
      const classification = selectedBody.classification || { family: "gasGiant" };
      const manifest = buildPlanetaryVisualControlManifest({
        body: selectedBody,
        classification,
        renderFamily: "gas",
        ringCapable: classification.family !== "brownDwarf",
      });
      return {
        body: selectedBody,
        bodyId: selectedBody.id,
        bodyName: selectedBody.name || giant.name || selectedBody.id,
        classification,
        classificationLabel:
          classification.displayLabel ||
          (classification.family === "brownDwarf" ? "Brown dwarf" : "Gas giant"),
        manifest,
        ringState,
        ringWarning: formatGasGiantRingHint(ringState),
        previewContext: {
          body: selectedBody,
          manifest,
          previewModel: {
            bodyType: "gasGiant",
            name: giant.name || selectedBody.name || "Gas giant",
            recipeId: String(giant.appearanceRecipeId || ""),
            gasCalc,
            gasProfile,
            styleId: derivedStyle,
            ringAppearance,
            ringStyleId: ringAppearance?.ringStyleId,
            ringMode: ringState.ringMode,
            showRings: ringState.effectiveEnabled,
            rotationPeriodHours: Number(gasCalc?.inputs?.rotationPeriodHours) || 10,
            visualDescriptor,
            visualOverrideSignature,
            visualRenderSignature,
          },
          baseDescriptorInput: {
            body: selectedBody,
            solvedBody: gasCalc,
            renderFamily: "gas",
            renderModel: classification.family === "brownDwarf" ? "brownDwarfStar" : "gasGiant",
            gasProfile,
            ringAppearance,
            styleId: derivedStyle,
            manifest,
          },
        },
      };
    }

    const classification = selectedBody.classification || {};
    const isVolatile =
      classification.solverFamily === "volatile" &&
      ["miniNeptune", "volatileCandidate", "iceGiant"].includes(classification.family);

    if (isVolatile) {
      const solvedBody = calcPlanetaryBody({
        body: selectedBody,
        context: buildUnifiedBodyCalcContext(world, selectedBody, sysModel, homeSystemContext),
      });
      const styleId = volatilePreviewStyleId(solvedBody);
      const gasProfile = {
        ...computeGasGiantVisualProfile(solvedBody),
        styleId,
      };
      const ringState = { ringMode: "auto", effectiveEnabled: false };
      const ringAppearance = resolveRingAppearance({
        bodyType: "gasGiant",
        ringState,
        ringStyleId: "auto",
        gasCalc: solvedBody,
        bodyStyleId: styleId,
        seed: selectedBody.id || selectedBody.name || styleId,
      });
      const manifest = buildPlanetaryVisualControlManifest({
        body: selectedBody,
        classification: solvedBody.classification || classification,
        renderFamily: "volatile",
      });
      const visualAppearance =
        selectedBody.appearance && typeof selectedBody.appearance === "object"
          ? selectedBody.appearance
          : null;
      const visualDescriptor = resolvePlanetaryVisualDescriptor({
        body: selectedBody,
        solvedBody,
        visualMode: visualAppearance?.visualMode,
        visualOverrides: visualAppearance?.visualOverrides,
        renderFamily: "volatile",
        renderModel: "",
        gasProfile,
        ringAppearance,
        styleId,
        manifest,
      });
      const previewRingAppearance = visualDescriptor.ringAppearance || ringAppearance;
      const previewShowRings =
        typeof previewRingAppearance?.enabled === "boolean" ? previewRingAppearance.enabled : false;
      return {
        body: selectedBody,
        bodyId: selectedBody.id,
        bodyName: selectedBody.name || selectedBody.id,
        classification: solvedBody.classification || classification,
        classificationLabel: solvedBody.classification?.displayLabel || "Volatile body",
        manifest,
        ringWarning: "Ring controls are visual overrides; auto science remains the baseline.",
        previewContext: {
          body: selectedBody,
          solvedBody,
          manifest,
          previewModel: {
            bodyType: "gasGiant",
            name: selectedBody.name || "Volatile body",
            styleId: visualDescriptor.styleId || styleId,
            gasCalc: solvedBody,
            gasProfile: visualDescriptor.gasProfile || gasProfile,
            ringAppearance: previewRingAppearance,
            ringStyleId: previewRingAppearance?.ringStyleId,
            ringMode: "auto",
            showRings: previewShowRings,
            rotationPeriodHours: Number(selectedBody.rotation?.rotationPeriodHours) || 12,
            visualDescriptor,
            visualOverrideSignature: visualDescriptor.overrideSignature || "",
            visualRenderSignature: visualDescriptor.renderSignature || "",
          },
          baseDescriptorInput: {
            body: selectedBody,
            solvedBody,
            renderFamily: "volatile",
            renderModel: "",
            gasProfile,
            ringAppearance,
            styleId,
            manifest,
          },
        },
      };
    }

    const planet = getSelectedPlanet(world);
    if (!planet) return null;
    const {
      model,
      visualProfile,
      ringState,
      ringAppearance,
      visualDescriptor,
      visualOverrideSignature,
      visualRenderSignature,
    } = deriveRockyPlanetAppearanceState(world, planet);
    const solvedBody = model?.unifiedModel || selectedBody;
    const manifest = buildPlanetaryVisualControlManifest({
      body: selectedBody,
      classification: solvedBody?.classification || classification,
      renderFamily: "rocky",
    });
    return {
      body: selectedBody,
      bodyId: selectedBody.id,
      bodyName: selectedBody.name || planet.name || selectedBody.id,
      classification: solvedBody?.classification || classification,
      classificationLabel: solvedBody?.classification?.displayLabel || "Rocky planet",
      subtypeSummary: model?.unifiedModel
        ? buildPlanetaryBodyClassificationSummary(model.unifiedModel)
        : null,
      manifest,
      ringState,
      ringWarning: formatRockyRingHint(ringState),
      previewContext: {
        body: selectedBody,
        solvedBody,
        manifest,
        previewModel: {
          bodyType: "rocky",
          name: planet.inputs?.name || planet.name || "Rocky world",
          recipeId: visualProfile?.recipeId || String(planet.inputs?.appearanceRecipeId || ""),
          inputs: planet.inputs || {},
          derived: model?.derived || {},
          visualProfile,
          ringAppearance,
          rotationPeriodHours: Number(planet.inputs?.rotationPeriodHours) || 24,
          axialTiltDeg: Number(planet.inputs?.axialTiltDeg) || 0,
          visualDescriptor,
          visualOverrideSignature,
          visualRenderSignature,
        },
        baseDescriptorInput: {
          body: selectedBody,
          solvedBody,
          renderFamily: "rocky",
          renderModel: "",
          visualProfile,
          ringAppearance,
          baseRecipeId: visualProfile?.recipeId || String(planet.inputs?.appearanceRecipeId || ""),
          manifest,
        },
      },
    };
  }

  function openSelectedPlanetaryVisualEditor() {
    const world = loadWorld();
    const context = buildSelectedPlanetaryVisualEditorContext(
      world,
      buildCurrentSystemModel(world),
    );
    if (!context) {
      showPlanetNotice("Select a planetary body before opening the visual editor.");
      return;
    }
    openPlanetaryVisualEditor({
      ...context,
      onSave(patch) {
        applyPlanetaryBodyVisualPatch(context.bodyId, patch);
        showPlanetNotice("Visual appearance saved.");
        scheduleRender(true);
      },
    });
  }

  function populateBodySelector(world) {
    const homeSystemContext = buildPlanetHomeSystemContext(world);
    const entries = buildBodySelectorEntries(listPlanetaryBodies(world), undefined, {
      homeSystemContext,
    });
    const selectedValue = getSelectedBodySelectorValue(world);
    const filteredEntries = filterBodySelectorEntries(entries, bodySearchEl?.value || "");
    const selectedEntry = entries.find((entry) => entry.value === selectedValue);
    const visibleEntries =
      selectedEntry && !filteredEntries.some((entry) => entry.value === selectedValue)
        ? [selectedEntry, ...filteredEntries]
        : filteredEntries;

    renderBodySelector(bodySel, visibleEntries, selectedValue);
  }

  /* ── Rocky planet rendering ─────────────────────────────────────── */

  function renderRockyInputs(world, planet, sysModel) {
    if (!planet) {
      renderHint(bodyInputsEl, "No planet selected. Add a planet to get started.");
      return;
    }
    const homeSystemContext = buildPlanetHomeSystemContext(world);
    const solveContext = resolvePlanetPageHostFrameContext(
      world,
      planet,
      sysModel,
      homeSystemContext,
    );
    const hostFrameId = normalizeHostFrameId(
      solveContext?.hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const hostSystem = solveContext?.hostFrame?.system || sysModel;
    const guidedOrbitMode = formHelpers.isGuidedOrbitMode(world);
    const p = planet.inputs || {};
    renderRockyInputForm(bodyInputsEl, {
      planet,
      tipLabels: TIP_LABEL,
      hostFrameOptions: buildHostFrameOptions(homeSystemContext, hostFrameId),
      hostFrameHint: formatHostFrameHint(solveContext),
    });
    const ringModePillsEl = bodyInputsEl.querySelector("#ringModePills");
    const ringModeHintEl = bodyInputsEl.querySelector("#ringModeHint");
    const ringStyleSelectEl = bodyInputsEl.querySelector("#ringStyleSelect");
    const ringStyleHintEl = bodyInputsEl.querySelector("#ringStyleHint");
    const syncRockyRingUi = ({ ringState, ringAppearance }) => {
      if (ringModeHintEl) ringModeHintEl.textContent = formatRockyRingHint(ringState);
      syncRingStyleControl(ringStyleSelectEl, ringState, ringAppearance);
      if (ringStyleHintEl) {
        ringStyleHintEl.textContent = formatRingStyleHint(ringAppearance, ringState);
      }
    };
    syncRockyRingUi(deriveRockyPlanetAppearanceState(world, planet));

    // Populate slot selector
    const hostFrameSelectEl = bodyInputsEl.querySelector("#hostFrameSelect");
    const slotSelectEl = bodyInputsEl.querySelector("#slotSelect");
    const fallbackHostFrameId =
      homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || "star_a";
    renderPlanetSlotSelector(slotSelectEl, {
      orbitsAu: hostSystem.orbitsAu,
      planets: filterBodiesForHostFrame(
        listPlanets(world),
        hostFrameId,
        homeSystemContext?.defaultHostFrameId,
      ),
      gasGiants: filterBodiesForHostFrame(
        listSystemGasGiants(world),
        hostFrameId,
        homeSystemContext?.defaultHostFrameId,
      ),
      debrisDisks: listSystemDebrisDisks(world, {
        hostFrameId,
        fallbackHostFrameId,
      }),
      planet,
    });

    // Set input values
    let hydrating = true;
    cmfAutoBtn = bodyInputsEl.querySelector("#cmfAutoBtn");
    cmfEl = bodyInputsEl.querySelector("#cmf");
    cmfSliderEl = bodyInputsEl.querySelector("#cmf_slider");
    cmfIsAuto = p.cmfPct < 0 || p.cmfPct == null;

    const fieldMap = {
      mass: p.massEarth,
      wmf: p.wmfPct,
      hhe: p.hHeEnvelopeMassPct,
      tilt: p.axialTiltDeg,
      albedo: p.albedoBond,
      gh: p.greenhouseEffect,
      observer: p.observerHeightM,
      rot: p.rotationPeriodHours,
      a: p.semiMajorAxisAu,
      e: p.eccentricity,
      inc: p.inclinationDeg,
      lop: p.longitudeOfPeriapsisDeg,
      ssl: p.subsolarLongitudeDeg,
      patm: p.pressureAtm,
      o2: p.o2Pct,
      co2: p.co2Pct,
      ar: p.arPct,
      h2o: p.h2oPct,
      ch4: p.ch4Pct,
      h2: p.h2Pct,
      he: p.hePct,
      so2: p.so2Pct,
      nh3: p.nh3Pct,
      isoAbundance: p.radioisotopeAbundance ?? 1,
      isoU238: p.u238Abundance ?? 1,
      isoU235: p.u235Abundance ?? 1,
      isoTh232: p.th232Abundance ?? 1,
      isoK40: p.k40Abundance ?? 1,
    };
    const sliderBindings = {
      mass: [0.0001, 1000, 0.0001],
      wmf: [0, 50, 0.1],
      hhe: [0, 20, 0.01],
      tilt: [0, 180, 0.1],
      albedo: [0, 0.95, 0.01],
      gh: [0, 500, 0.1],
      observer: [0, 10000, 0.05],
      rot: [0.1, 1000000, 0.1],
      a: [0.01, 1000000, 0.01],
      e: [0, 0.99, 0.001],
      inc: [0, 180, 0.1],
      lop: [0, 360, 1],
      ssl: [0, 360, 1],
      patm: [0, 100, 0.01],
      o2: [0, 100, 0.01],
      co2: [0, 100, 0.01],
      ar: [0, 100, 0.01],
      h2o: [0, 5, 0.01],
      ch4: [0, 10, 0.001],
      h2: [0, 50, 0.1],
      he: [0, 50, 0.1],
      so2: [0, 1, 0.001],
      nh3: [0, 1, 0.001],
      isoAbundance: [0.1, 3, 0.01],
      isoU238: [0, 5, 0.01],
      isoU235: [0, 5, 0.01],
      isoTh232: [0, 5, 0.01],
      isoK40: [0, 5, 0.01],
    };
    const inputKeyMap = {
      mass: "massEarth",
      wmf: "wmfPct",
      hhe: "hHeEnvelopeMassPct",
      tilt: "axialTiltDeg",
      albedo: "albedoBond",
      gh: "greenhouseEffect",
      observer: "observerHeightM",
      rot: "rotationPeriodHours",
      a: "semiMajorAxisAu",
      e: "eccentricity",
      inc: "inclinationDeg",
      lop: "longitudeOfPeriapsisDeg",
      ssl: "subsolarLongitudeDeg",
      patm: "pressureAtm",
      o2: "o2Pct",
      co2: "co2Pct",
      ar: "arPct",
      h2o: "h2oPct",
      ch4: "ch4Pct",
      h2: "h2Pct",
      he: "hePct",
      so2: "so2Pct",
      nh3: "nh3Pct",
      isoAbundance: "radioisotopeAbundance",
      isoU238: "u238Abundance",
      isoU235: "u235Abundance",
      isoTh232: "th232Abundance",
      isoK40: "k40Abundance",
    };

    const commitRockyInputPatch = (patch) => {
      const w = loadWorld();
      const pid = w.planets.selectedId;
      updatePlanet(pid, { inputs: patch });
      scheduleRender(true);
    };

    const commitRockyField = (id, value) => {
      const inputKey = inputKeyMap[id];
      commitRockyInputPatch({ [inputKey]: value });
    };

    for (const [id, val] of Object.entries(fieldMap)) {
      if (id === "a") continue;
      const el = bodyInputsEl.querySelector(`#${id}`);
      if (el) el.value = val ?? "";
      const [min, max, step] = sliderBindings[id];
      const sliderEl = bodyInputsEl.querySelector(`#${id}_slider`);
      if (el && sliderEl) {
        bindNumberAndSlider({
          numberEl: el,
          sliderEl,
          min,
          max,
          step,
          mode: "auto",
          commitOnInput: false,
          onChange: (value) => {
            if (hydrating) return;
            commitRockyField(id, value);
          },
        });
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    const observedRadiusEl = bodyInputsEl.querySelector("#observedRadius");
    observedRadiusEl?.addEventListener("change", () => {
      if (hydrating) return;
      const raw = String(observedRadiusEl.value || "").trim();
      const radiusEarth = raw ? Number(raw) : null;
      if (raw && (!Number.isFinite(radiusEarth) || radiusEarth <= 0)) {
        observedRadiusEl.value = p.radiusEarth ?? "";
        return;
      }
      const w = loadWorld();
      updatePlanet(w.planets.selectedId, { inputs: { radiusEarth } });
      updateWorld({ planet: { radiusEarth } });
      scheduleRender(true);
    });

    bodyInputsEl.querySelector("#carbonRichness")?.addEventListener("change", (event) => {
      if (hydrating) return;
      commitRockyInputPatch({
        carbonRichness: formHelpers.readOptionalSelectValue(event.currentTarget),
      });
    });

    for (const fieldName of ["bulkDensityGcm3", "internalHeatFluxWm2", "tidalHeatFluxWm2"]) {
      bodyInputsEl.querySelector(`#${fieldName}`)?.addEventListener("change", (event) => {
        if (hydrating) return;
        const result = formHelpers.readOptionalNonNegativeNumber(event.currentTarget, p[fieldName]);
        if (result.ok) commitRockyInputPatch({ [fieldName]: result.value });
      });
    }

    for (const fieldName of ["strippedEnvelopeCandidate", "migratedCloseIn", "rogueCandidate"]) {
      bodyInputsEl.querySelector(`#${fieldName}`)?.addEventListener("change", (event) => {
        if (hydrating) return;
        commitRockyInputPatch({ [fieldName]: !!event.currentTarget.checked });
      });
    }

    const orbitEl = bodyInputsEl.querySelector("#a");
    const orbitSliderEl = bodyInputsEl.querySelector("#a_slider");
    if (orbitEl && orbitSliderEl) {
      orbitEl.value = fieldMap.a ?? "";
      bindOrbitRangeControl({
        numberEl: orbitEl,
        sliderEl: orbitSliderEl,
        root: orbitEl.closest(".orbit-range-control"),
        min: ORBIT_AU_MIN,
        max: ORBIT_AU_MAX,
        step: 0.01,
        commitOnInput: false,
        statusSubject: "orbit",
        onChange: (value) => {
          if (hydrating || guidedOrbitMode) return;
          commitRockyField("a", value);
        },
      });
      if (guidedOrbitMode)
        formHelpers.applyGuidedOrbitDistanceGuard(
          bodyInputsEl,
          "a",
          formHelpers.guidedOrbitDistanceMessage("planet"),
        );
    }

    // CMF input (special: supports auto mode via cmfPct = -1)
    if (cmfEl && cmfIsAuto) {
      cmfEl.value = 32;
    } else if (cmfEl) {
      cmfEl.value = p.cmfPct ?? 32;
    }
    const cmfBinding = bindNumberAndSlider({
      numberEl: cmfEl,
      sliderEl: cmfSliderEl,
      min: 0,
      max: 100,
      step: 0.1,
      mode: "auto",
      commitOnInput: false,
      onChange: () => {
        if (hydrating) return;
        cmfIsAuto = false;
        updateCmfAutoState();
        const w = loadWorld();
        const pid = w.planets.selectedId;
        updatePlanet(pid, { inputs: { cmfPct: Number(cmfEl.value) } });
        updateWorld({ planet: { cmfPct: Number(cmfEl.value) } });
        scheduleRender(true);
      },
    });
    if (cmfEl && cmfBinding.ready) {
      cmfEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
    updateCmfAutoState();

    if (cmfAutoBtn) {
      cmfAutoBtn.addEventListener("click", () => {
        cmfIsAuto = true;
        updateCmfAutoState();
        const w = loadWorld();
        const pid = w.planets.selectedId;
        updatePlanet(pid, { inputs: { cmfPct: -1 } });
        updateWorld({ planet: { cmfPct: -1 } });
        scheduleRender(true);
      });
    }

    // Name change
    bodyInputsEl.querySelector("#planetName").addEventListener("change", () => {
      if (hydrating) return;
      const w = loadWorld();
      const name = bodyInputsEl.querySelector("#planetName").value || "New Planet";
      updatePlanet(w.planets.selectedId, { name, inputs: { name } });
      updateWorld({ planet: { name } });
      scheduleRender();
    });

    ringModePillsEl?.addEventListener("change", () => {
      if (hydrating) return;
      const checked = ringModePillsEl.querySelector('input[name="ringMode"]:checked');
      const ringMode = normalizeRingMode(checked?.value);
      const w = loadWorld();
      updatePlanet(w.planets.selectedId, { inputs: { ringMode } });
      const refreshedWorld = updateWorld({ planet: { ringMode } });
      const refreshed = getSelectedPlanet(refreshedWorld);
      if (refreshed) {
        syncRockyRingUi(deriveRockyPlanetAppearanceState(refreshedWorld, refreshed));
      }
      scheduleRender(true);
    });
    ringStyleSelectEl?.addEventListener("change", () => {
      if (hydrating) return;
      const checked = ringModePillsEl?.querySelector('input[name="ringMode"]:checked');
      if (normalizeRingMode(checked?.value) !== RING_MODE_FORCE_ON) return;
      const ringStyleId = normalizeRingStyleId(ringStyleSelectEl.value);
      const w = loadWorld();
      updatePlanet(w.planets.selectedId, { inputs: { ringStyleId } });
      const refreshedWorld = updateWorld({ planet: { ringStyleId } });
      const refreshed = getSelectedPlanet(refreshedWorld);
      if (refreshed) {
        syncRockyRingUi(deriveRockyPlanetAppearanceState(refreshedWorld, refreshed));
      }
      scheduleRender(true);
    });

    hostFrameSelectEl?.addEventListener("change", () => {
      if (hydrating) return;
      const w = loadWorld();
      const nextHostFrameId = normalizeHostFrameId(
        hostFrameSelectEl.value,
        homeSystemContext?.defaultHostFrameId,
      );
      updatePlanet(w.planets.selectedId, {
        hostFrameId: nextHostFrameId,
        slotIndex: null,
      });
      scheduleRender();
    });

    // Slot change
    slotSelectEl.addEventListener("change", () => {
      if (hydrating) return;
      const w = loadWorld();
      const selectedSlot = slotSelectEl.value ? Number(slotSelectEl.value) : null;
      assignPlanetToSlot(w.planets.selectedId, selectedSlot, { orbitsAu: hostSystem.orbitsAu });
      scheduleRender();
    });

    // Atmospheric escape pill toggle
    const atmEscapePillsEl = bodyInputsEl.querySelector("#atmEscapePills");
    if (atmEscapePillsEl) {
      atmEscapePillsEl.addEventListener("change", () => {
        if (hydrating) return;
        const checked = atmEscapePillsEl.querySelector('input[name="atmEscape"]:checked');
        const on = checked?.value === "on";
        const w = loadWorld();
        updatePlanet(w.planets.selectedId, { inputs: { atmosphericEscape: on } });
        updateWorld({ planet: { atmosphericEscape: on } });
        scheduleRender();
      });
    }

    // Vegetation pill toggle + colour pickers
    const vegPillsEl = bodyInputsEl.querySelector("#vegModePills");
    const vegManual = bodyInputsEl.querySelector("#vegManualInputs");
    const vegPaleEl = bodyInputsEl.querySelector("#vegPaleColour");
    const vegDeepEl = bodyInputsEl.querySelector("#vegDeepColour");
    const vegPreview = bodyInputsEl.querySelector("#vegOverridePreview");

    const updateVegPreview = () => {
      if (vegPreview) {
        vegPreview.style.background = `linear-gradient(to right, ${vegPaleEl.value}, ${vegDeepEl.value})`;
      }
    };

    if (vegPillsEl) {
      vegPillsEl.addEventListener("change", () => {
        if (hydrating) return;
        const checked = vegPillsEl.querySelector('input[name="vegMode"]:checked');
        const on = checked?.value === "manual";
        if (vegManual) vegManual.style.display = on ? "" : "none";
        const w = loadWorld();
        const pid = w.planets.selectedId;
        if (on) {
          // Default override colours to current auto-calculated values
          const selPlanet = getSelectedPlanet(w);
          const m = buildRockyPlanetModel(w, {
            ...selPlanet,
            inputs: { ...selPlanet.inputs, vegOverride: false },
          });
          const pale = m.derived.vegetationPaleHex || "#4a7c32";
          const deep = m.derived.vegetationDeepHex || "#1a3d0c";
          vegPaleEl.value = pale;
          vegDeepEl.value = deep;
          updatePlanet(pid, {
            inputs: { vegOverride: true, vegPaleHexOverride: pale, vegDeepHexOverride: deep },
          });
          updateWorld({
            planet: { vegOverride: true, vegPaleHexOverride: pale, vegDeepHexOverride: deep },
          });
        } else {
          updatePlanet(pid, {
            inputs: { vegOverride: false, vegPaleHexOverride: null, vegDeepHexOverride: null },
          });
          updateWorld({
            planet: { vegOverride: false, vegPaleHexOverride: null, vegDeepHexOverride: null },
          });
        }
        updateVegPreview();
        scheduleRender(true);
      });
    }

    vegPaleEl.addEventListener("input", () => {
      if (hydrating) return;
      const w = loadWorld();
      updatePlanet(w.planets.selectedId, { inputs: { vegPaleHexOverride: vegPaleEl.value } });
      updateWorld({ planet: { vegPaleHexOverride: vegPaleEl.value } });
      updateVegPreview();
      scheduleRender(true);
    });

    vegDeepEl.addEventListener("input", () => {
      if (hydrating) return;
      const w = loadWorld();
      updatePlanet(w.planets.selectedId, { inputs: { vegDeepHexOverride: vegDeepEl.value } });
      updateWorld({ planet: { vegDeepHexOverride: vegDeepEl.value } });
      updateVegPreview();
      scheduleRender(true);
    });

    // Greenhouse mode toggle
    const ghHintTexts = {
      core: "Greenhouse computed from CO\u2082, H\u2082O, and CH\u2084.",
      full: "Greenhouse computed from all atmospheric gases.",
      manual: "Greenhouse set manually via the slider below.",
    };
    const ghHintEl = bodyInputsEl.querySelector("#ghModeHint");
    const ghManualRow = bodyInputsEl.querySelector("#ghManualRow");
    const ghComputedRow = bodyInputsEl.querySelector("#ghComputedRow");
    const expertGasRow = bodyInputsEl.querySelector("#expertGasRow");
    const curMode = p.greenhouseMode || "manual";
    if (ghHintEl) ghHintEl.textContent = ghHintTexts[curMode] || "";

    bodyInputsEl.querySelectorAll('input[name="ghMode"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (hydrating) return;
        const mode = radio.value;
        const w = loadWorld();
        const pid = w.planets.selectedId;
        updatePlanet(pid, { inputs: { greenhouseMode: mode } });
        updateWorld({ planet: { greenhouseMode: mode } });
        if (ghHintEl) ghHintEl.textContent = ghHintTexts[mode] || "";
        if (ghManualRow) ghManualRow.style.display = mode === "manual" ? "" : "none";
        if (ghComputedRow) ghComputedRow.style.display = mode === "manual" ? "none" : "";
        if (expertGasRow) expertGasRow.style.display = mode === "full" ? "" : "none";
        scheduleRender(true);
      });
    });

    // Interior & Surface pill toggles
    tecPillsEl = bodyInputsEl.querySelector("#tectonicRegimePills");
    if (tecPillsEl) {
      tecPillsEl.addEventListener("change", () => {
        if (hydrating) return;
        const val = getTecPillValue();
        const w = loadWorld();
        const pid = w.planets.selectedId;
        updatePlanet(pid, { inputs: { tectonicRegime: val } });
        updateWorld({ planet: { tectonicRegime: val } });
        // Update recommended-active class for slider colour
        const rec = tecPillsEl.querySelector("input[data-recommended]");
        tecPillsEl.classList.toggle("tec-recommended-active", rec && rec.value === val);
        scheduleRender(true);
      });
    }

    const mantleOxEl = bodyInputsEl.querySelector("#mantleOxidation");
    if (mantleOxEl) {
      mantleOxEl.addEventListener("change", () => {
        if (hydrating) return;
        const w = loadWorld();
        const pid = w.planets.selectedId;
        updatePlanet(pid, { inputs: { mantleOxidation: mantleOxEl.value } });
        updateWorld({ planet: { mantleOxidation: mantleOxEl.value } });
        scheduleRender(true);
      });
    }

    // Internal Heat mode toggle
    const isoModePillsEl = bodyInputsEl.querySelector("#isoModePills");
    const isoSimpleEl = bodyInputsEl.querySelector("#isoSimpleInputs");
    const isoAdvancedEl = bodyInputsEl.querySelector("#isoAdvancedInputs");
    if (isoModePillsEl) {
      isoModePillsEl.addEventListener("change", () => {
        if (hydrating) return;
        const checked = isoModePillsEl.querySelector('input[name="isoMode"]:checked');
        const mode = checked ? checked.value : "simple";
        if (isoSimpleEl) isoSimpleEl.style.display = mode === "advanced" ? "none" : "";
        if (isoAdvancedEl) isoAdvancedEl.style.display = mode === "advanced" ? "" : "none";
        const w = loadWorld();
        const pid = w.planets.selectedId;
        updatePlanet(pid, { inputs: { radioisotopeMode: mode } });
        updateWorld({ planet: { radioisotopeMode: mode } });
        scheduleRender(true);
      });
    }

    // Effective abundance readout for per-isotope mode
    function updateIsoEffective() {
      const el = bodyInputsEl.querySelector("#isoEffective");
      if (!el) return;
      const u238El = bodyInputsEl.querySelector("#isoU238");
      const u235El = bodyInputsEl.querySelector("#isoU235");
      const th232El = bodyInputsEl.querySelector("#isoTh232");
      const k40El = bodyInputsEl.querySelector("#isoK40");
      const a =
        (Number(u238El?.value) || 1) * ISOTOPE_HEAT_FRACTIONS.u238 +
        (Number(u235El?.value) || 1) * ISOTOPE_HEAT_FRACTIONS.u235 +
        (Number(th232El?.value) || 1) * ISOTOPE_HEAT_FRACTIONS.th232 +
        (Number(k40El?.value) || 1) * ISOTOPE_HEAT_FRACTIONS.k40;
      el.textContent = `Effective abundance: ${fmt(Math.max(a, 0.01), 2)}\u00d7 Earth`;
    }
    // Update on any isotope slider input
    for (const id of ["isoU238", "isoU235", "isoTh232", "isoK40"]) {
      const el = bodyInputsEl.querySelector(`#${id}`);
      const slEl = bodyInputsEl.querySelector(`#${id}_slider`);
      if (el) el.addEventListener("input", updateIsoEffective);
      if (slEl) slEl.addEventListener("input", updateIsoEffective);
    }
    updateIsoEffective();

    hydrating = false;
  }

  function renderRockyOutputs(world, classificationSummary = null) {
    const planet = getSelectedPlanet(world);
    if (!planet) {
      renderPlanetEmptyState(bodyOutputsEl, {
        title: "No planet selected",
        body: "Create a rocky planet or gas giant to see climate, orbit, visual, and habitability outputs here.",
      });
      return;
    }
    const {
      model,
      visualProfile,
      ringState,
      ringAppearance,
      visualDescriptor,
      visualOverrideSignature,
      visualRenderSignature,
    } = deriveRockyPlanetAppearanceState(world, planet);
    const d = model.derived;
    const p = planet.inputs || {};
    const ringDisplay = buildRockyRingDisplay(ringState, d);
    const ringStyleDisplay = buildRingStyleDisplay(ringAppearance);
    const ringOverrideMeta = ringState.overrideActive
      ? ringState.againstScience
        ? "Manual override goes against the science."
        : "Manual override matches the science."
      : "Auto mode follows the science.";
    const vegDetailsBtn = document.createElement("button");
    vegDetailsBtn.type = "button";
    vegDetailsBtn.className = "veg-details-btn";
    vegDetailsBtn.id = "btn-veg-details";
    vegDetailsBtn.textContent = "Details";

    // Update CMF input when in auto mode
    if (d.cmfIsAuto) {
      cmfIsAuto = true;
      const resolved = model.inputs.cmfPct;
      if (cmfEl) cmfEl.value = Math.round(resolved * 10) / 10;
      if (cmfSliderEl) cmfSliderEl.value = resolved;
      updateCmfAutoState();
    }

    // Update effective abundance readout
    const isoEffEl = bodyInputsEl.querySelector("#isoEffective");
    if (isoEffEl) {
      const a = d.radioisotopeAbundance;
      isoEffEl.textContent = `Effective abundance: ${fmt(Math.max(a, 0.01), 2)}\u00d7 Earth`;
    }
    const ringHintEl = bodyInputsEl.querySelector("#ringModeHint");
    if (ringHintEl) ringHintEl.textContent = formatRockyRingHint(ringState);
    const ringStyleSelectEl = bodyInputsEl.querySelector("#ringStyleSelect");
    const ringStyleHintEl = bodyInputsEl.querySelector("#ringStyleHint");
    syncRingStyleControl(ringStyleSelectEl, ringState, ringAppearance);
    if (ringStyleHintEl)
      ringStyleHintEl.textContent = formatRingStyleHint(ringAppearance, ringState);

    const habitabilityPolicyVersion =
      d.habitabilityBreakdown?.solventPolicyVersion || "surface-plus-subsurface-water-v1";
    const habitabilityPolicyLabel =
      habitabilityPolicyVersion === "surface-subsurface-plus-alt-solvents-v1"
        ? "surface + subsurface + alt solvents"
        : habitabilityPolicyVersion === "surface-plus-subsurface-water-v1"
          ? "surface + subsurface water"
          : "surface water only";
    const surfaceLiquidCoverage = Number(d.surfaceAccessibleLiquidFraction);
    const prebioticUv = d.photochemistry?.prebioticUv || null;
    const prebioticUvClass = String(prebioticUv?.class || "");
    const showPrebioticUvKpi =
      !!prebioticUv &&
      (prebioticUvClass !== "uv_starved" ||
        (Number.isFinite(surfaceLiquidCoverage) && surfaceLiquidCoverage > 0.001));
    const hazeOutputs = buildPhotochemicalHazeOutputItems({ derived: d, display: model.display });
    const { showMeanOceanDepth, waterRegimeMeta, meanOceanDepthMeta, surfaceOceanCoverageItems } =
      buildSurfaceOceanOutputContext({
        derived: d,
        display: model.display,
        inputs: model.inputs,
        surfaceLiquidCoverage,
      });
    const stellarWindRatio = Number(d.stellarWind?.ramPressureEarthRatio);
    const stellarWindConfidence = String(d.stellarWind?.confidence || "unsupported");
    const stellarWindMeta =
      stellarWindConfidence === "unsupported"
        ? "No calibrated host stellar-wind estimate"
        : [
            Number.isFinite(Number(d.stellarWind?.massLossSolar))
              ? `Host mass loss ${fmt(d.stellarWind.massLossSolar, d.stellarWind.massLossSolar >= 10 ? 1 : 2)}x solar`
              : "",
            Number.isFinite(Number(d.stellarWind?.windSpeedKms))
              ? `Wind speed ${fmt(d.stellarWind.windSpeedKms, 0)} km/s`
              : "",
            Number(d.stellarWind?.companionWindPressureEarth) > 0
              ? `Companion wind ${fmt(d.stellarWind.companionWindPressureEarth, 2)}x Earth`
              : "",
            `${stellarWindConfidence} confidence`,
          ]
            .filter(Boolean)
            .join(" | ");
    const showStellarWindKpi =
      Number.isFinite(stellarWindRatio) &&
      stellarWindRatio > 0 &&
      (stellarWindRatio > 3 || stellarWindRatio < 0.3);
    const interiorActivityItems = [
      {
        label: "Interior Evolution",
        value: model.display.interiorEvolution,
        meta: model.display.interiorDynamoSupport,
      },
      {
        label: "Volcanic Longevity",
        value: model.display.volcanicLongevity,
        meta: model.display.mantleRecyclingSupport,
      },
    ];

    const allRockyItems = [
      {
        kind: "preview",
        label: "Appearance",
        tip: TIP_LABEL.Appearance || "",
        canvasClass: "rocky-preview-canvas",
        meta: `${d.compositionClass} - ${d.waterRegime}`,
        actions: [
          {
            id: "editPlanetaryVisual",
            className: "small planetary-visual-edit-trigger",
            text: "Edit visual",
          },
        ],
      },
      {
        label: "Body Class",
        value: model.display.bodyClass,
        meta:
          model.display.bodyClass === "Dwarf planet"
            ? `Mass below 0.1 M\u2295 (${fmt(model.inputs.massEarth, 4)} M\u2295)`
            : "",
      },
      {
        label: "Composition",
        value: model.display.compositionClass,
        meta: `CMF ${fmt(model.inputs.cmfPct, 1)}%${d.cmfIsAuto ? " (auto)" : ""}, WMF ${fmt(model.inputs.wmfPct, 2)}%`,
      },
      {
        label: "Radius",
        value: model.display.radius,
        meta: `${fmt(d.radiusKm * 1000, 0)} m`,
      },
      { label: "Density", value: model.display.density },
      {
        label: "Gravity",
        value: model.display.gravity,
        meta: `${fmt(d.gravityMs2, 2)} m/s²`,
      },
      { label: "Escape Velocity", value: model.display.escape },
      {
        label: "Oblateness",
        tipLabel: "Oblateness",
        value: model.display.oblateness,
        meta: model.display.equatorialPolarRadii,
      },
      {
        label: "Magnetic Field",
        value: model.display.magneticField,
        meta: d.dynamoActive
          ? `${model.display.fieldMorphology}, ${d.coreState}` +
            (d.planetTidalFraction > 0.1 ? " (tidally sustained)" : "")
          : d.dynamoReason,
      },
      {
        label: "Magnetopause",
        tipLabel: "Magnetopause",
        value: model.display.magnetopause,
        meta: d.magnetosphereEnvironment?.scienceBasis || "",
      },
      {
        label: "Wind Compression",
        tipLabel: "Wind Compression",
        value: model.display.windCompression,
        meta:
          Array.isArray(d.magnetosphereEnvironment?.caveats) &&
          d.magnetosphereEnvironment.caveats.length
            ? d.magnetosphereEnvironment.caveats.join(" ")
            : "",
      },
      model.display.planetRadiation && {
        label: "Surface Radiation",
        value: model.display.planetRadiation,
        meta: d.planetRadiationEnvironmentContext?.confidence
          ? `${String(d.planetRadiationEnvironmentContext.confidence).toUpperCase()} confidence`
          : "",
      },
      model.display.planetRadiationShielding && {
        label: "Radiation Shielding",
        value: model.display.planetRadiationShielding,
        meta: model.display.planetRadiationAurora
          ? `Aurora readiness ${model.display.planetRadiationAurora}`
          : "",
      },
      {
        label: "Avg Surface Temp",
        tipLabel: "Surface Temperature (Avg.)",
        value: model.display.tempK,
        meta: model.display.tempC,
      },
      {
        label: "Climate State",
        value: model.display.climateState,
        meta: `Absorbed flux: ${model.display.absorbedFlux}`,
      },
      {
        label: "Coupled Climate Tendency",
        value: model.display.coupledClimateTendency,
        meta: `${model.display.photochemicalForcing} | ${
          d.coupledClimatePass?.applied ? "effective state applied" : "baseline retained"
        }`,
      },
      {
        label: "Photochemical Forcing",
        value: model.display.photochemicalForcing,
        meta: d.climateChemistryForcing?.confidence
          ? `${String(d.climateChemistryForcing.confidence).toUpperCase()} confidence`
          : "",
      },
      {
        label: "Cloud Regime",
        value: model.display.cloudRegime,
        meta: d.cloudCirculation?.confidence
          ? `${String(d.cloudCirculation.confidence).toUpperCase()} confidence`
          : "",
      },
      {
        label: "Heat Redistribution",
        value: model.display.heatRedistribution,
        meta:
          d.cloudCirculation?.substellarCloudDeckLikelihood != null
            ? `Substellar deck ${fmt(d.cloudCirculation.substellarCloudDeckLikelihood * 100, 0)}%`
            : "",
      },
      {
        label: "Atmospheric Collapse",
        tipLabel: "Atmospheric Collapse",
        value: model.display.atmosphericCollapse,
        meta:
          d.nightsideMinK != null && d.atmosphereCollapseThresholdK != null
            ? `Night side ${fmt(d.nightsideMinK, 0)} K | ${d.dominantAtmosphereSpecies || "Atmosphere"} condenses near ${fmt(d.atmosphereCollapseThresholdK, 0)} K`
            : "",
      },
      {
        label: "Atmosphere Trend",
        value: model.display.atmosphereTrend,
        meta: d.atmosphereLedger?.confidence
          ? `${String(d.atmosphereLedger.confidence).toUpperCase()} confidence`
          : "",
      },
      {
        label: "Atmosphere Evolution",
        value: model.display.atmosphereEvolution,
        meta: d.atmosphereEvolutionContext?.manualOverrideProtected
          ? "Manual values protected"
          : model.display.atmosphereVolatileLoss || "",
      },
      {
        label: "Dominant Source",
        value: model.display.atmosphereDominantSource,
        meta:
          d.atmosphereLedger?.dominantSource?.score != null
            ? `score ${fmt(d.atmosphereLedger.dominantSource.score, 2)}`
            : "",
      },
      {
        label: "Dominant Sink",
        value: model.display.atmosphereDominantSink,
        meta:
          d.atmosphereLedger?.dominantSink?.score != null
            ? `score ${fmt(d.atmosphereLedger.dominantSink.score, 2)}`
            : "",
      },
      {
        label: "Stability Timescale",
        value: model.display.atmosphereStabilityTimescale,
        meta:
          d.atmosphereLedger?.netBalance != null
            ? `net ${fmt(d.atmosphereLedger.netBalance, 2)}`
            : "",
      },
      {
        label: "CO2 Tendency",
        value: model.display.co2ClimateTendency,
        meta: `${model.display.co2BuildupTendency || "no buildup tendency"} | ${model.display.co2ThermostatAdjustment || "0.0 K"}`,
      },
      {
        label: "Surface State",
        tipLabel: "Surface State",
        value: model.display.surfaceState,
        meta: d.surfaceState?.reason || "",
      },
      {
        label: "Earth Similarity Index",
        value: model.display.earthSimilarityIndex,
        meta:
          `Radius ${fmt(d.earthSimilarityBreakdown?.radius ?? 0, 2)} | ` +
          `Density ${fmt(d.earthSimilarityBreakdown?.density ?? 0, 2)} | ` +
          `Escape ${fmt(d.earthSimilarityBreakdown?.escapeVelocity ?? 0, 2)} | ` +
          `Temp ${fmt(d.earthSimilarityBreakdown?.surfaceTemp ?? 0, 2)}`,
      },
      {
        label: "Year Length",
        tipLabel: "Year length",
        value: model.display.yearDays,
        meta: model.display.localDays,
      },
      {
        label: "Host frame",
        tipLabel: "Host frame",
        value: model.hostFrame?.label || d.hostFrameLabel || "Primary star",
        meta:
          model.hostFrame?.frameKind === "pair"
            ? "Circumbinary host"
            : d.hostFrameKind === "star"
              ? d.orbitFamilyKind === "single"
                ? "Single-star host"
                : "Circumstellar host"
              : "",
      },
      {
        label: "Insolation",
        tipLabel: "Insolation",
        value: model.display.insolation,
      },
      {
        label: "Companion Flux",
        tipLabel: "Companion Flux",
        value: model.display.companionFlux,
        meta:
          Number(d.companionFluxEarth) > 0
            ? `${fmt((d.companionFluxFraction || 0) * 100, 1)}% of total insolation`
            : "",
      },
      {
        label: "Flux Variability",
        tipLabel: "Flux Variability",
        value: model.display.fluxVariability,
      },
      model.display.environmentForcing && {
        label: "Environment Forcing",
        tipLabel: "Environment Forcing",
        value: model.display.environmentForcing,
        meta: d.environmentForcing?.confidence
          ? `${String(d.environmentForcing.confidence).toUpperCase()} confidence`
          : "",
      },
      showStellarWindKpi && {
        label: "Stellar Wind Pressure",
        tipLabel: "Stellar Wind Pressure",
        value: model.display.stellarWindPressure,
        meta: stellarWindMeta,
      },
      {
        label: "Dynamical Stability",
        tipLabel: "Dynamical Stability",
        value: model.display.dynamicalStability,
        meta:
          Array.isArray(d.dynamicalStabilityNotes) && d.dynamicalStabilityNotes.length
            ? d.dynamicalStabilityNotes.join(" ")
            : "",
      },
      {
        label: "Core Radius",
        value: model.display.coreRadius,
      },
      {
        label: "Water Regime",
        value: model.display.waterRegime,
        meta: waterRegimeMeta,
      },
      ...surfaceOceanCoverageItems,
      showMeanOceanDepth && {
        label: "Mean Ocean Depth",
        value: model.display.meanOceanDepth,
        meta: meanOceanDepthMeta,
      },
      {
        label: "Rings",
        tipLabel: "Rings",
        value: ringDisplay.value,
        meta: ringDisplay.meta,
      },
      {
        label: "Habitability Index",
        value: model.display.habitabilityIndex,
        meta:
          `Substrate ${fmt(d.habitabilityBreakdown?.substrate ?? 0, 2)} | ` +
          `Solvent ${fmt(d.habitabilityBreakdown?.solvent ?? 0, 2)} | ` +
          `Energy ${fmt(d.habitabilityBreakdown?.energy ?? 0, 2)} | ` +
          `Chemistry ${fmt(d.habitabilityBreakdown?.chemistry ?? 0, 2)}\n` +
          `Stability ${fmt(d.habitabilityBreakdown?.stabilityMultiplier ?? 0, 2)} | ` +
          `Radiation ${fmt(d.habitabilityBreakdown?.radiationMultiplier ?? 0, 2)} | ` +
          `Persistence ${fmt(d.habitabilityBreakdown?.persistenceMultiplier ?? 0, 2)}\n` +
          `Pathway ${d.habitabilityBreakdown?.solventPathway || "none"} | ` +
          `${habitabilityPolicyLabel}\n` +
          `${d.habitabilityModelVersion || "phi-unified-v2"} | ${habitabilityPolicyVersion}`,
      },
      d.oceanChemistryContext?.applicable && {
        label: "Ocean Chemistry",
        value: model.display.oceanChemistry,
        meta: [
          model.display.carbonateSaturation,
          model.display.nutrientSupport,
          d.oceanChemistryContext?.confidence
            ? `${String(d.oceanChemistryContext.confidence).toUpperCase()} confidence`
            : "",
        ]
          .filter(Boolean)
          .join(" | "),
      },
      {
        label: "Biosignature Context",
        value: model.display.biosignatureContext,
        meta: d.biosignatureContext?.confidence
          ? `${String(d.biosignatureContext.confidence).toUpperCase()} confidence`
          : "Context only; not a life detection",
      },
      {
        label: "Disequilibrium",
        value: model.display.disequilibriumStrength,
        meta:
          d.biosignatureContext?.replenishmentDemandClass != null
            ? `Source demand ${d.biosignatureContext.replenishmentDemandClass}`
            : "",
      },
      {
        label: "O2/O3 False Positive",
        value: model.display.oxygenFalsePositiveRisk,
        meta: "Abiotic oxygen/ozone caution from water loss, UV/XUV, and redox context",
      },
      {
        label: "Methane Context",
        value: model.display.methaneContext,
        meta: "Methane is interpreted with oxygen, haze, outgassing, and ocean context",
      },
      {
        label: "CO Buildup Risk",
        value: model.display.coBuildupRisk,
        meta: "Low-UV, high-CO2 contexts can retain CO abiotically",
      },
      {
        label: "UV Shielding",
        value: model.display.uvShielding,
        meta: `${model.display.ozoneColumn} | ${model.display.photochemicalStability}`,
      },
      showPrebioticUvKpi && {
        label: "Prebiotic UV Window",
        value: model.display.prebioticUvWindow,
        meta: [
          model.display.prebioticUvFlux,
          prebioticUv?.confidence ? `${prebioticUv.confidence} confidence` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      },
      hazeOutputs.compactItem,
      model.display.moonTidalHeating && {
        label: "Moon Tidal Heating",
        value: model.display.moonTidalHeating,
        meta: d.planetTidalFraction >= 0.1 ? "Significant for core/dynamo" : "Negligible for core",
      },
      ...interiorActivityItems,
      {
        label: "Tectonic Regime",
        value: model.display.tectonicRegime + (model.display.tectonicIsAuto ? " (auto)" : ""),
        meta:
          d.tectonicAdvisory + "\n\n" + formatRockyTectonicProbabilities(d.tectonicProbabilities),
      },
      {
        label: "Outgassing",
        value: model.display.outgassing,
        meta: d.mantleOxidation + " oxidation state",
      },
      {
        label: "Carbon Cycle",
        value: model.display.carbonCycle,
        meta: d.carbonCycleContext?.confidence
          ? `${String(d.carbonCycleContext.confidence).toUpperCase()} confidence`
          : "",
      },
      {
        label: "Suggested CMF",
        value: model.display.suggestedCmf + (d.cmfIsAuto ? " (active)" : ""),
        meta: model.display.suggestedCmfNote,
      },
      { label: "Horizon Distance", value: model.display.horizon },
      {
        label: "Star Apparent Size",
        tipLabel: "Star apparent size",
        value: model.display.apparentStar,
      },
      {
        label: "Transit Depth",
        value: model.display.transitDepth,
        meta: model.display.transitProbability,
      },
      {
        label: "RV Semi-Amplitude",
        value: model.display.rvSemiAmplitude,
        meta: "Edge-on / transiting reference",
      },
      {
        label: "Sky Colour (Sun High)",
        tipLabel: "Sky colour (sun high)",
        value: d.skyColourDayHex || "-",
        meta: "Hex (spectrum + pressure + gravity + CO₂)",
        kpiClass: "kpi--colour",
        kpiDataset: {
          gradient: "radial",
          light: relativeLuminance(d.skyColourDayHex) > 0.18 ? "1" : "0",
        },
        kpiStyle: {
          "--kpi-colour": d.skyColourDayHex || "#93B6FF",
          "--kpi-colour-center": d.skyColourDayHex || "#93B6FF",
          "--kpi-colour-edge": d.skyColourDayEdgeHex || d.skyColourDayHex || "#CFE8FF",
        },
      },
      {
        label: "Sky Colour (Low Sun)",
        tipLabel: "Sky colour (low sun)",
        value: d.skyColourHorizonHex || "-",
        meta: "Hex (spectrum + pressure + gravity + CO₂)",
        kpiClass: "kpi--colour",
        kpiDataset: {
          gradient: "radial",
          horizon: "1",
          light: relativeLuminance(d.skyColourHorizonHex) > 0.18 ? "1" : "0",
        },
        kpiStyle: {
          "--kpi-colour": d.skyColourHorizonHex || "#0B1020",
          "--kpi-colour-center": d.skyColourHorizonHex || "#0B1020",
          "--kpi-colour-edge": d.skyColourHorizonEdgeHex || d.skyColourHorizonHex || "#D6B06B",
        },
      },
      {
        label: "Vegetation Colour",
        tipLabel: "Vegetation colour",
        value: `${d.vegetationPaleHex} → ${d.vegetationDeepHex}`,
        metaChildren: [d.vegetationNote, " ", vegDetailsBtn],
        kpiClass: "kpi--colour",
        kpiDataset: {
          gradient: "linear",
          light: relativeLuminance(d.vegetationPaleHex) > 0.18 ? "1" : "0",
        },
        kpiStyle: {
          background: `linear-gradient(to right, ${(d.vegetationStops || [d.vegetationPaleHex, d.vegetationDeepHex]).join(", ")})`,
        },
      },
    ];

    // Twilight vegetation KPI (only for tidally locked K/M worlds)
    if (d.vegetationTwilightPaleHex) {
      allRockyItems.push({
        label: "Vegetation (Twilight)",
        tipLabel: "Vegetation colour (twilight)",
        value: `${d.vegetationTwilightPaleHex} → ${d.vegetationTwilightDeepHex}`,
        meta: "Terminator-zone adapted",
        kpiClass: "kpi--colour",
        kpiDataset: {
          gradient: "linear",
          light: relativeLuminance(d.vegetationTwilightPaleHex) > 0.18 ? "1" : "0",
        },
        kpiStyle: {
          background: `linear-gradient(to right, ${(d.vegetationTwilightStops || [d.vegetationTwilightPaleHex, d.vegetationTwilightDeepHex]).join(", ")})`,
        },
      });
    }

    const normalizeRockyItem = (item) => ({
      ...item,
      tip: item.tip || TIP_LABEL[item.tipLabel] || TIP_LABEL[item.label] || "",
      kpiClass: item.kpiClass ? `kpi--compact ${item.kpiClass}`.trim() : "kpi--compact",
    });
    const summaryItems = allRockyItems
      .filter((item) => item && ROCKY_SUMMARY_LABELS.has(item.label))
      .map((item) => normalizeRockyItem(item));
    if (hasLimitedSurfaceApplicability(classificationSummary)) {
      summaryItems.unshift(
        normalizeRockyItem({
          label: "Solver Scope",
          value: "Compatibility projection",
          meta:
            classificationSummary.surfaceApplicability === "none"
              ? "No accessible surface; surface and climate values are core/body estimates."
              : "Surface confidence is limited; surface and climate values are estimates.",
        }),
      );
    }
    const identityItems = allRockyItems
      .filter((item) => item && ROCKY_IDENTITY_LABELS.has(item.label))
      .map((item) => normalizeRockyItem(item));
    const physicalItems = allRockyItems
      .filter((item) => item && ROCKY_PHYSICAL_LABELS.has(item.label))
      .map((item) => normalizeRockyItem(item));
    const environmentItems = allRockyItems
      .filter((item) => item && ROCKY_ENVIRONMENT_LABELS.has(item.label))
      .map((item) => normalizeRockyItem(item));
    const systemItems = allRockyItems
      .filter((item) => item && ROCKY_SYSTEM_LABELS.has(item.label))
      .map((item) => normalizeRockyItem(item));
    const activityItems = allRockyItems
      .filter((item) => item && ROCKY_ACTIVITY_LABELS.has(item.label))
      .map((item) => normalizeRockyItem(item));
    const habitabilityItems = allRockyItems
      .filter((item) => item && ROCKY_HABITABILITY_LABELS.has(item.label))
      .map((item) => normalizeRockyItem(item));
    const items = allRockyItems;
    const n2Pct = fmt(d.n2Pct, 2);
    const gasMixNote = d.gasMixClamped
      ? `\nAtmosphere note: gas inputs total ${fmt(d.gasInputTotalPct, 2)}%. N2 is clamped to 0% for derived outputs.`
      : "";

    // Update computed GHE readout in inputs panel
    const ghCompEl = bodyInputsEl.querySelector("#ghComputedValue");
    if (ghCompEl) ghCompEl.textContent = fmt(d.computedGreenhouseEffect, 3);

    // Build gas mix lines including all tracked gases
    const h2o = Number(p.h2oPct) || 0;
    const ch4 = Number(p.ch4Pct) || 0;
    const h2 = Number(p.h2Pct) || 0;
    const he = Number(p.hePct) || 0;
    const so2 = Number(p.so2Pct) || 0;
    const nh3 = Number(p.nh3Pct) || 0;
    const hasExpert = h2 > 0 || he > 0 || so2 > 0 || nh3 > 0;
    let gasMixLine = `Gas mix (%): O2 ${fmt(p.o2Pct, 2)} / CO2 ${fmt(p.co2Pct, 2)} / Ar ${fmt(p.arPct, 2)} / H2O ${fmt(h2o, 2)} / CH4 ${fmt(ch4, 3)} / N2 ${n2Pct}`;
    let ppLine = `Partial pressures (atm): O2 ${fmt(d.ppO2Atm, 4)} / CO2 ${fmt(d.ppCO2Atm, 6)} / Ar ${fmt(d.ppArAtm, 4)} / H2O ${fmt(d.ppH2OAtm, 4)} / CH4 ${fmt(d.ppCH4Atm, 6)} / N2 ${fmt(d.ppN2Atm, 4)}`;
    if (hasExpert) {
      gasMixLine += `\nExpert gases (%): H2 ${fmt(h2, 1)} / He ${fmt(he, 1)} / SO2 ${fmt(so2, 3)} / NH3 ${fmt(nh3, 3)}`;
      ppLine += `\nExpert pp (atm): H2 ${fmt(d.ppH2Atm, 4)} / He ${fmt(d.ppHeAtm, 4)} / SO2 ${fmt(d.ppSO2Atm, 6)} / NH3 ${fmt(d.ppNH3Atm, 6)}`;
    }

    const ghModeLine =
      d.greenhouseMode === "manual"
        ? `Greenhouse: manual (${fmt(d.greenhouseEffect, 3)})`
        : `Greenhouse: ${d.greenhouseMode} (computed ${fmt(d.computedGreenhouseEffect, 3)}, \u03C4 = ${fmt(d.computedGreenhouseTau, 3)})`;

    // Jeans escape retention lines
    const je = d.jeansEscape;
    let jeansLines = "";
    if (je) {
      jeansLines = `\n\nAtmospheric escape (T_exo ${fmt(je.exobaseTempK, 0)} K, XUV ${fmt(je.xuvFluxRatio, 2)}\u00d7 Earth):`;
      const gasKeys = ["n2", "o2", "co2", "ar", "h2o", "ch4", "h2", "he", "so2", "nh3"];
      const gasLabels = {
        n2: "N\u2082",
        o2: "O\u2082",
        co2: "CO\u2082",
        ar: "Ar",
        h2o: "H\u2082O",
        ch4: "CH\u2084",
        h2: "H\u2082",
        he: "He",
        so2: "SO\u2082",
        nh3: "NH\u2083",
      };
      for (const key of gasKeys) {
        const sp = je.species[key];
        const pct = key === "n2" ? d.n2Pct : Number(p[key + "Pct"]) || 0;
        if (pct > 0 || (je.atmosphericEscape && je.stripped.includes(key))) {
          const ntTag = sp.nonThermal ? " (non-thermal)" : "";
          const tag =
            je.atmosphericEscape && sp.status === "Lost"
              ? " [STRIPPED]"
              : sp.status === "Marginal"
                ? " [!]"
                : "";
          jeansLines += `\n  ${gasLabels[key]}: \u03BB=${fmt(sp.lambda, 1)} \u2014 ${sp.status}${ntTag}${tag}`;
        }
      }
      if (je.stripped.length > 0) {
        jeansLines += `\nStripped gases: ${je.stripped.map((k) => gasLabels[k] || k).join(", ")}`;
      }
    }

    // Capture the existing canvas before replacing children to preserve WebGL context
    const prevRockyCanvas = bodyOutputsEl.querySelector(".rocky-preview-canvas");
    createKpiGrid(
      items.filter(Boolean).map((item) => {
        if (item.isRockyPreview) {
          return {
            kind: "preview",
            label: item.label,
            tip: TIP_LABEL[item.label] || "",
            canvasClass: "rocky-preview-canvas",
            meta: `${item.value} — ${item.meta || ""}`,
          };
        }
        return {
          label: item.label,
          tip: TIP_LABEL[item.tipLabel] || TIP_LABEL[item.label] || "",
          value: item.value,
          meta: item.meta,
          metaChildren: item.metaChildren,
          kpiClass: item.kpiClass,
          kpiDataset: item.kpiDataset,
          kpiStyle: item.kpiStyle,
        };
      }),
    );
    const eraTimelineSection = createEraTimelineSection(d.eraTimeline, {
      id: "planet-era-timeline",
    });
    const derivedDetails = createDerivedDetails(
      [
        {
          id: "planet-details-identity",
          title: "Identity & Class",
          items: [
            { label: "Body Class", value: model.display.bodyClass },
            {
              label: "Composition",
              value: model.display.compositionClass,
              meta: `CMF ${fmt(model.inputs.cmfPct, 1)}%${d.cmfIsAuto ? " (auto)" : ""}, WMF ${fmt(model.inputs.wmfPct, 2)}%`,
            },
            { label: "Core Radius", value: model.display.coreRadius },
            {
              label: "Suggested CMF",
              value: model.display.suggestedCmf,
              meta: model.display.suggestedCmfNote,
            },
          ],
        },
        {
          id: "planet-details-physical",
          title: "Physical State",
          items: [
            {
              label: "Radius",
              value: model.display.radius,
              meta: `${fmt(d.radiusKm * 1000, 0)} m`,
            },
            { label: "Density", value: model.display.density },
            {
              label: "Gravity",
              value: model.display.gravity,
              meta: `${fmt(d.gravityMs2, 2)} m/s²`,
            },
            { label: "Escape Velocity", value: model.display.escape },
            {
              label: "Oblateness",
              value: model.display.oblateness,
              meta: model.display.equatorialPolarRadii,
            },
            {
              label: "Magnetic Field",
              value: model.display.magneticField,
              meta: d.dynamoActive
                ? `${model.display.fieldMorphology}, ${d.coreState}${d.planetTidalFraction > 0.1 ? " (tidally sustained)" : ""}`
                : d.dynamoReason,
            },
            {
              label: "Magnetopause",
              value: model.display.magnetopause,
              meta: d.magnetosphereEnvironment?.scienceBasis || "",
            },
            {
              label: "Wind Compression",
              value: model.display.windCompression,
              meta:
                Array.isArray(d.magnetosphereEnvironment?.caveats) &&
                d.magnetosphereEnvironment.caveats.length
                  ? d.magnetosphereEnvironment.caveats.join(" | ")
                  : "",
            },
          ],
        },
        {
          id: "planet-details-environment",
          title: "Environment",
          items: [
            { label: "Greenhouse", value: ghModeLine },
            { label: "Atmospheric pressure", value: model.display.pressureKpa },
            { label: "Gas mix", value: gasMixLine },
            { label: "Partial pressures", value: ppLine },
            { label: "Atmospheric weight", value: model.display.atmWeight },
            { label: "Atmospheric density", value: `${model.display.atmDensity}${gasMixNote}` },
            ...(je
              ? [
                  {
                    label: "Atmospheric escape",
                    value: `T_exo ${fmt(je.exobaseTempK, 0)} K`,
                    meta: `XUV ${fmt(je.xuvFluxRatio, 2)}× Earth`,
                  },
                ]
              : []),
            ...(jeansLines
              ? [
                  {
                    label: "Atmospheric escape detail",
                    value: jeansLines.replace(/\n+/g, " | ").trim(),
                  },
                ]
              : []),
            {
              label: "Environment Forcing",
              value: model.display.environmentForcing,
              meta:
                Array.isArray(d.environmentForcing?.caveats) && d.environmentForcing.caveats.length
                  ? d.environmentForcing.caveats.join(" | ")
                  : "Canonical host-frame UV, XUV, wind, and light context",
            },
            {
              label: "Stellar Wind Pressure",
              value: model.display.stellarWindPressure,
              meta: stellarWindMeta,
            },
            {
              label: "Photochemical Stability",
              value: model.display.photochemicalStability,
              meta:
                Array.isArray(d.photochemistry?.warningMessages) &&
                d.photochemistry.warningMessages.length
                  ? d.photochemistry.warningMessages.join(" | ")
                  : "No incompatible gas pairs detected",
            },
            {
              label: "Coupled Climate Tendency",
              value: model.display.coupledClimateTendency,
              meta:
                d.climateChemistryForcing?.optInClimateState ||
                (d.coupledClimatePass?.applied
                  ? "Bounded effective state applied"
                  : "Baseline climate state retained"),
            },
            {
              label: "Photochemical Forcing",
              value: model.display.photochemicalForcing,
              meta: d.climateChemistryForcing
                ? [
                    `Haze ${fmt(d.climateChemistryForcing.hazeDeltaK || 0, 1)} K`,
                    `CH4 ${fmt(d.climateChemistryForcing.methaneGreenhouseDeltaK || 0, 1)} K`,
                    `SO2 ${fmt(d.climateChemistryForcing.sulfurAerosolDeltaK || 0, 1)} K`,
                    `Cloud ${fmt(d.climateChemistryForcing.cloudAlbedoDeltaK || 0, 1)} K`,
                    `H2O feedback ${fmt(d.climateChemistryForcing.waterVaporFeedbackDeltaK || 0, 1)} K`,
                  ].join(" | ")
                : "",
            },
            {
              label: "Cloud Regime",
              value: model.display.cloudRegime,
              meta:
                Array.isArray(d.cloudCirculation?.notes) && d.cloudCirculation.notes.length
                  ? d.cloudCirculation.notes.join(" | ")
                  : d.cloudCirculation?.confidence
                    ? `${String(d.cloudCirculation.confidence).toUpperCase()} confidence`
                    : "",
            },
            {
              label: "Heat Redistribution",
              value: model.display.heatRedistribution,
              meta:
                d.cloudCirculation?.collapseRiskModifier != null
                  ? `Collapse risk modifier ${fmt(d.cloudCirculation.collapseRiskModifier, 2)}`
                  : "",
            },
            {
              label: "Cloud Albedo Effect",
              value: model.display.cloudAlbedoEffect,
              meta:
                d.cloudCirculation?.cloudFraction != null
                  ? `Cloud fraction ${fmt(d.cloudCirculation.cloudFraction * 100, 0)}% | deck likelihood ${fmt((d.cloudCirculation.substellarCloudDeckLikelihood || 0) * 100, 0)}%`
                  : "",
            },
            { label: "Ozone Column", value: model.display.ozoneColumn },
            {
              label: "Prebiotic UV Flux",
              value: model.display.prebioticUvFlux,
              meta:
                Array.isArray(prebioticUv?.notes) && prebioticUv.notes.length
                  ? prebioticUv.notes.join(" | ")
                  : "Surface 200-280 nm flux after atmospheric attenuation",
            },
            ...hazeOutputs.environmentDetailItems,
            { label: "Avg Surface Temp", value: `${model.display.tempK} | ${model.display.tempC}` },
            {
              label: "Climate State",
              value: model.display.climateState,
              meta: `Absorbed flux: ${model.display.absorbedFlux}`,
            },
            {
              label: "Surface State",
              value: model.display.surfaceState,
              meta: d.surfaceState?.reason || "",
            },
            {
              label: "Water Regime",
              value: model.display.waterRegime,
              meta: `~${fmt(model.inputs.wmfPct, 2)}% water by mass`,
            },
            ...surfaceOceanCoverageItems,
            showMeanOceanDepth
              ? {
                  label: "Mean Ocean Depth",
                  value: model.display.meanOceanDepth,
                  meta: meanOceanDepthMeta,
                }
              : null,
            { label: "Rings", value: ringDisplay.value, meta: ringDisplay.meta },
            { label: "Ring science", value: ringState.scienceReason, meta: ringOverrideMeta },
            { label: "Ring style", value: ringStyleDisplay.value, meta: ringStyleDisplay.meta },
            {
              label: "Ring style source",
              value: getRingStyleSourceLabel(ringAppearance.styleSource),
            },
            { label: "Cell count", value: String(d.circulationCellCount) },
            {
              label: "Circulation bands",
              value: d.circulationCellRanges.length
                ? d.circulationCellRanges
                    .map((cell) => `${cell.name}: ${cell.rangeDegNS}° N/S`)
                    .join(" | ")
                : "-",
            },
          ],
        },
        {
          id: "planet-details-system",
          title: "System Context",
          items: [
            {
              label: "Host frame",
              value: model.hostFrame?.label || d.hostFrameLabel || "Primary star",
              meta:
                model.hostFrame?.frameKind === "pair"
                  ? "Circumbinary host"
                  : d.hostFrameKind === "star"
                    ? d.orbitFamilyKind === "single"
                      ? "Single-star host"
                      : "Circumstellar host"
                    : "",
            },
            { label: "Habitable zone", value: model.display.hz },
            { label: "In habitable zone", value: d.inHabitableZone ? "Yes" : "No" },
            { label: "Insolation", value: model.display.insolation },
            { label: "Companion Flux", value: model.display.companionFlux },
            { label: "Flux Variability", value: model.display.fluxVariability },
            {
              label: "Dynamical Stability",
              value: model.display.dynamicalStability,
              meta:
                Array.isArray(d.dynamicalStabilityNotes) && d.dynamicalStabilityNotes.length
                  ? d.dynamicalStabilityNotes.join(" ")
                  : "",
            },
            { label: "Tidal lock", value: model.display.tidalLock },
            {
              label: "Atmospheric collapse",
              value: model.display.atmosphericCollapse,
              meta:
                d.nightsideMinK != null && d.atmosphereCollapseThresholdK != null
                  ? `Night side ${fmt(d.nightsideMinK, 0)} K | ${d.dominantAtmosphereSpecies || "Atmosphere"} condenses near ${fmt(d.atmosphereCollapseThresholdK, 0)} K`
                  : "",
            },
            ...(d.planetTidalHeatingW > 0 && !model.display.moonTidalHeating
              ? [
                  {
                    label: "Moon tidal heating",
                    value: `negligible (${fmt(d.planetTidalHeatingEarth, 4)}× Earth geothermal)`,
                  },
                ]
              : []),
            { label: "Liquid water", value: d.liquidWaterPossible ? "Possible" : "Unlikely" },
            { label: "Rotation direction", value: d.rotationDirection },
            {
              label: "Year Length",
              value: `${model.display.yearDays} | ${model.display.localDays}`,
            },
            { label: "Horizon Distance", value: model.display.horizon },
            { label: "Star Apparent Size", value: model.display.apparentStar },
            {
              label: "Transit Depth",
              value: model.display.transitDepth,
              meta: model.display.transitProbability,
            },
            {
              label: "RV Semi-Amplitude",
              value: model.display.rvSemiAmplitude,
              meta: "Edge-on / transiting reference",
            },
            { label: "Roche limit", value: model.display.rocheLimit },
            {
              label: "Ring source moon",
              value: d.ringSourceMoonId || "None",
              meta: d.ringScienceSupported ? "Current source moon for Auto rings" : "",
            },
            { label: "Tropics", value: `${d.tropics}° N/S` },
            { label: "Polar circles", value: `${d.polarCircles}° N/S` },
            {
              label: "Periapsis",
              value: `${model.display.peri}${model.display.tempPeri ? ` (${model.display.tempPeri})` : ""}`,
            },
            {
              label: "Apoapsis",
              value: `${model.display.apo}${model.display.tempApo ? ` (${model.display.tempApo})` : ""}`,
            },
            { label: "Nearest resonance", value: model.display.resonance },
            ...(model.display.volatileSummary
              ? [{ label: "Volatile ices", value: model.display.volatileSummary }]
              : []),
          ],
        },
        {
          id: "planet-details-activity",
          title: "Activity & Radiation",
          items: [
            ...(model.display.moonTidalHeating
              ? [
                  {
                    label: "Moon Tidal Heating",
                    value: model.display.moonTidalHeating,
                    meta:
                      d.planetTidalFraction >= 0.1
                        ? "Significant for core/dynamo"
                        : "Negligible for core",
                  },
                ]
              : []),
            ...interiorActivityItems,
            {
              label: "Tectonic Regime",
              value: model.display.tectonicRegime + (model.display.tectonicIsAuto ? " (auto)" : ""),
              meta:
                d.tectonicAdvisory +
                " | " +
                formatRockyTectonicProbabilities(d.tectonicProbabilities),
            },
            {
              label: "Outgassing",
              value: model.display.outgassing,
              meta: `${d.mantleOxidation} oxidation state`,
            },
            {
              label: "Carbon Cycle",
              value: model.display.carbonCycle,
              meta:
                Array.isArray(d.carbonCycleContext?.notes) && d.carbonCycleContext.notes.length
                  ? d.carbonCycleContext.notes.join(" | ")
                  : d.carbonCycleContext?.confidence
                    ? `${String(d.carbonCycleContext.confidence).toUpperCase()} confidence`
                    : "",
            },
            {
              label: "Weathering Efficiency",
              value: model.display.weatheringEfficiency,
              meta: `Limiter: ${d.carbonCycleContext?.weatheringLimiter || "not evaluated"}`,
            },
            {
              label: "Volcanic Supply",
              value: model.display.volcanicSupply,
              meta: `Recycling limiter: ${d.carbonCycleContext?.recyclingLimiter || "not evaluated"}`,
            },
            {
              label: "Carbon Recycling",
              value: model.display.carbonRecycling,
              meta: `Thermostat strength ${model.display.carbonThermostat}`,
            },
            ...(je?.stripped?.length
              ? [{ label: "Stripped gases", value: je.stripped.join(", ") }]
              : []),
          ],
        },
        {
          id: "planet-details-habitability",
          title: "Habitability",
          items: [
            {
              label: "Earth Similarity Index",
              value: model.display.earthSimilarityIndex,
              meta:
                `Radius ${fmt(d.earthSimilarityBreakdown?.radius ?? 0, 2)} | ` +
                `Density ${fmt(d.earthSimilarityBreakdown?.density ?? 0, 2)} | ` +
                `Escape ${fmt(d.earthSimilarityBreakdown?.escapeVelocity ?? 0, 2)} | ` +
                `Temp ${fmt(d.earthSimilarityBreakdown?.surfaceTemp ?? 0, 2)}`,
            },
            {
              label: "Habitability Index",
              value: model.display.habitabilityIndex,
              meta:
                `Substrate ${fmt(d.habitabilityBreakdown?.substrate ?? 0, 2)} | ` +
                `Solvent ${fmt(d.habitabilityBreakdown?.solvent ?? 0, 2)} | ` +
                `Energy ${fmt(d.habitabilityBreakdown?.energy ?? 0, 2)} | ` +
                `Chemistry ${fmt(d.habitabilityBreakdown?.chemistry ?? 0, 2)} | ` +
                `Stability ${fmt(d.habitabilityBreakdown?.stabilityMultiplier ?? 0, 2)} | ` +
                `Radiation ${fmt(d.habitabilityBreakdown?.radiationMultiplier ?? 0, 2)} | ` +
                `Persistence ${fmt(d.habitabilityBreakdown?.persistenceMultiplier ?? 0, 2)} | ` +
                `Pathway ${d.habitabilityBreakdown?.solventPathway || "none"} | ${habitabilityPolicyLabel} | ` +
                `${d.habitabilityModelVersion || "phi-unified-v2"} | ${habitabilityPolicyVersion}`,
            },
            d.oceanChemistryContext?.applicable
              ? {
                  label: "Ocean Chemistry",
                  value: model.display.oceanChemistry,
                  meta:
                    Array.isArray(d.oceanChemistryContext?.notes) &&
                    d.oceanChemistryContext.notes.length
                      ? d.oceanChemistryContext.notes.join(" | ")
                      : "",
                }
              : null,
            d.oceanChemistryContext?.applicable
              ? {
                  label: "Carbonate Saturation",
                  value: model.display.carbonateSaturation,
                  meta: `Acidity: ${model.display.oceanAcidity} | Freezing point ${fmt(d.oceanChemistryContext.freezingPointK, 1)} K`,
                }
              : null,
            d.oceanChemistryContext?.applicable
              ? {
                  label: "Nutrient Support",
                  value: model.display.nutrientSupport,
                  meta: `Rock-ocean access ${fmt(d.oceanChemistryContext.rockOceanAccess ?? 0, 2)} | Hydrothermal: ${d.oceanChemistryContext.hydrothermalSupportClass || "not evaluated"}`,
                }
              : null,
            {
              label: "Biosignature Context",
              value: model.display.biosignatureContext,
              meta:
                Array.isArray(d.biosignatureContext?.notes) && d.biosignatureContext.notes.length
                  ? d.biosignatureContext.notes.join(" | ")
                  : "Context only; not a life detection",
            },
            {
              label: "Disequilibrium",
              value: model.display.disequilibriumStrength,
              meta: `Source demand ${d.biosignatureContext?.replenishmentDemandClass || "Low"}`,
            },
            {
              label: "O2/O3 False Positive",
              value: model.display.oxygenFalsePositiveRisk,
              meta: `CO buildup risk ${model.display.coBuildupRisk} | Methane: ${model.display.methaneContext}`,
            },
            {
              label: "UV Shielding",
              value: model.display.uvShielding,
              meta: `${model.display.ozoneColumn} | ${model.display.photochemicalStability}`,
            },
            {
              label: "Prebiotic UV Window",
              value: model.display.prebioticUvWindow,
              meta: model.display.prebioticUvFlux,
            },
            ...hazeOutputs.habitabilityDetailItems,
          ],
        },
      ],
      { title: "Derived Details" },
    );
    const longTermDynamicsSection = buildLongTermDynamicsSection(world, planet.id);
    bodyOutputsEl.replaceChildren();
    renderKpiSections(bodyOutputsEl, [
      { id: "planet-summary", title: "Key Numbers", items: summaryItems },
      {
        id: "planet-identity",
        title: "Identity & Class",
        density: "compact",
        items: identityItems,
      },
      { id: "planet-physical", title: "Physical State", density: "compact", items: physicalItems },
      {
        id: "planet-environment",
        title: "Environment",
        density: "compact",
        items: environmentItems,
      },
      { id: "planet-system", title: "System Context", density: "compact", items: systemItems },
      longTermDynamicsSection,
      {
        id: "planet-activity",
        title: "Activity & Radiation",
        density: "compact",
        items: activityItems,
      },
      {
        id: "planet-habitability",
        title: "Habitability",
        density: "compact",
        items: habitabilityItems,
      },
    ]);
    renderPlanetResultSummary(
      bodyOutputsEl,
      buildRockyPlanetResultSummary({ planet, model, classificationSummary }),
    );
    if (eraTimelineSection) {
      bodyOutputsEl.insertBefore(eraTimelineSection, bodyOutputsEl.children[2] || null);
    }
    if (derivedDetails) bodyOutputsEl.append(derivedDetails);
    enableOutputSectionTabs(bodyOutputsEl, { label: "Planet output sections", includeAll: true });

    // Render rocky planet preview canvas (animated native celestial controller)
    let rockyCvs = bodyOutputsEl.querySelector(".rocky-preview-canvas");
    if (prevRockyCanvas && rockyCvs && prevRockyCanvas !== rockyCvs) {
      rockyCvs.replaceWith(prevRockyCanvas);
      rockyCvs = prevRockyCanvas;
    }
    if (rockyCvs && visualProfile) {
      celestialPreviewController.attach(rockyCvs, {
        bodyType: "rocky",
        name: p.name || "Rocky world",
        recipeId: String(p.appearanceRecipeId || ""),
        inputs: p,
        derived: d,
        visualProfile,
        ringAppearance,
        rotationPeriodHours: Number(p.rotationPeriodHours) || 24,
        axialTiltDeg: Number(p.axialTiltDeg) || 0,
        visualDescriptor,
        visualOverrideSignature,
        visualRenderSignature,
      });
    } else {
      celestialPreviewController.detach();
    }

    // Update tectonic pills: mark recommended + auto-select if in auto mode
    if (tecPillsEl && d.tectonicSuggested) {
      const recVal =
        d.tectonicSuggested === "plutonicSquishy" ? "plutonic-squishy" : d.tectonicSuggested;
      if (d.tectonicIsAuto) setTecPillValue(recVal);
      updateTecRecommended(recVal);
    }

    // Populate tectonic probability bar in the inputs panel
    const tecBar = bodyInputsEl.querySelector("#tecProbBar");
    if (tecBar) renderTectonicProbabilityBar(tecBar, d.tectonicProbabilities);

    const vegBtn = bodyOutputsEl.querySelector("#btn-veg-details");
    if (vegBtn) {
      vegBtn.addEventListener("click", () => {
        openVegInfoDialog({
          pressureAtm: p.pressureAtm,
          spectralKey: d.skySpectralKey,
          paleHex: d.vegetationPaleHex,
          deepHex: d.vegetationDeepHex,
          stops: d.vegetationStops,
          note: d.vegetationNote,
          insolation: d.insolationEarth,
          tidallyLocked: d.tidallyLockedToStar,
          twilightPaleHex: d.vegetationTwilightPaleHex,
          twilightDeepHex: d.vegetationTwilightDeepHex,
          twilightStops: d.vegetationTwilightStops,
        });
      });
    }
  }

  function renderVolatileOutputs(world, body, sysModel) {
    if (!body) {
      renderPlanetEmptyState(bodyOutputsEl, {
        title: "No volatile body selected",
        body: "Select or create a volatile body to see envelope radius, escape, and detection outputs here.",
      });
      return;
    }
    const homeSystemContext = buildPlanetHomeSystemContext(world);
    const model = calcPlanetaryBody({
      body,
      context: buildUnifiedBodyCalcContext(world, body, sysModel, homeSystemContext),
    });
    const prevVolatileCanvas = bodyOutputsEl.querySelector(".volatile-preview-canvas");
    let volatileStyleId = volatilePreviewStyleId(model);
    let gasProfile = {
      ...computeGasGiantVisualProfile(model),
      styleId: volatileStyleId,
    };
    const ringState = { ringMode: "auto", effectiveEnabled: false };
    let ringAppearance = resolveRingAppearance({
      bodyType: "gasGiant",
      ringState,
      ringStyleId: "auto",
      gasCalc: model,
      bodyStyleId: volatileStyleId,
      seed: body.id || body.name || volatileStyleId,
    });
    const volatileManifest = buildPlanetaryVisualControlManifest({
      body,
      classification: model.classification,
      renderFamily: "volatile",
    });
    const visualAppearance =
      body.appearance && typeof body.appearance === "object" ? body.appearance : null;
    const visualDescriptor = resolvePlanetaryVisualDescriptor({
      body,
      solvedBody: model,
      visualMode: visualAppearance?.visualMode,
      visualOverrides: visualAppearance?.visualOverrides,
      renderFamily: "volatile",
      renderModel: "",
      gasProfile,
      ringAppearance,
      styleId: volatileStyleId,
      manifest: volatileManifest,
    });
    if (visualDescriptor.overrideSignature) {
      volatileStyleId = visualDescriptor.styleId || volatileStyleId;
      gasProfile = visualDescriptor.gasProfile || gasProfile;
      ringAppearance = visualDescriptor.ringAppearance || ringAppearance;
    }
    const showRings = typeof ringAppearance?.enabled === "boolean" ? ringAppearance.enabled : false;
    const display = model.legacy?.volatileModel?.display || model.visuals?.display || {};
    const physical = model.physical || {};
    const envelope = model.envelope || model.atmosphere?.envelope || {};
    const thermal = model.thermal || {};
    const orbit = model.orbit || {};
    const classificationLabel = model.classification?.displayLabel || "Volatile body";
    const radiusSourceMeta =
      physical.radiusSource === "observed"
        ? `Modelled radius: ${display.modelRadius}; observed value is used for transit/photosphere outputs.`
        : "No observed radius supplied; modelled radius is used for transit/photosphere outputs.";
    const normalizeVolatileItem = (item) => ({
      ...item,
      tip: item.tip || TIP_LABEL[item.tipLabel] || TIP_LABEL[item.label] || "",
      kpiClass: item.kpiClass ? `kpi--compact ${item.kpiClass}`.trim() : "kpi--compact",
    });

    const summaryItems = [
      {
        kind: "preview",
        label: "Appearance",
        tip: TIP_LABEL.Appearance || "",
        canvasClass: "volatile-preview-canvas",
        canvasDataset: { style: volatileStyleId },
        meta: `${classificationLabel} - ${styleLabel(volatileStyleId)}`,
        actions: [
          {
            id: "editPlanetaryVisual",
            className: "small planetary-visual-edit-trigger",
            text: "Edit visual",
          },
        ],
      },
      {
        label: "Classification",
        value: classificationLabel,
        meta: `${String(model.classification?.confidence || "modelled")} confidence | ${
          model.classification?.modelVersion || "planetary-classification-v1"
        }`,
      },
      { label: "Transit Radius", value: display.transitRadius, meta: radiusSourceMeta },
      {
        label: "Solid/Core Radius",
        value: display.solidRadius,
        meta: "Estimated solid plus water-rich interior below the H/He envelope.",
      },
      { label: "Envelope State", value: display.envelopeState, meta: envelope.stateReason || "" },
      {
        label: "Surface Applicability",
        value: "No accessible solid surface",
        meta: "Rocky climate, terrain, and habitability outputs are hidden for this solver.",
      },
    ].map(normalizeVolatileItem);

    const physicalItems = [
      { label: "Mass", value: `${fmt(physical.massEarth, 3)} M\u2295` },
      { label: "Modelled Radius", value: display.modelRadius, meta: display.radiusSource },
      { label: "Envelope Thickness", value: display.envelopeThickness },
      { label: "Bulk Density", value: display.density },
      {
        label: "Gravity",
        value: display.gravity,
        meta: `${fmt(physical.gravityMs2, 2)} m/s\u00b2`,
      },
      { label: "Escape Velocity", value: display.escape },
      {
        label: "Water Regime",
        value: physical.waterRegime || "Unknown",
        meta: physical.compositionClass || "",
      },
    ].map(normalizeVolatileItem);

    const envelopeItems = [
      { label: "Envelope Mass", value: display.envelopeMass },
      { label: "Mass Loss Rate", value: display.massLossRate },
      {
        label: "Survival Timescale",
        value: display.envelopeTimescale,
        meta: envelope.stateReason || "",
      },
      {
        label: "XUV Flux",
        value: `${fmt(envelope.xuvFluxRatioEarth, 2)}x Earth`,
        meta: `${fmt(envelope.xuvFluxErgCm2S, 3)} erg cm^-2 s^-1`,
      },
      {
        label: "Exobase Temp",
        value: `${fmt(envelope.exobaseTempK, 0)} K`,
        meta: `H2 ${envelope.jeansEscape?.h2?.status || "unknown"} | He ${
          envelope.jeansEscape?.he?.status || "unknown"
        }`,
      },
      {
        label: "Model Version",
        value: model.legacy?.volatileModel?.modelVersion || "volatile-radius-lopez-fortney-v1",
      },
    ].map(normalizeVolatileItem);

    const environmentItems = [
      { label: "Equilibrium Temp", value: display.equilibriumTemp },
      { label: "Insolation", value: display.insolation },
      { label: "Absorbed Flux", value: `${fmt(thermal.absorbedFluxWm2, 1)} W/m\u00b2` },
      {
        label: "Orbital Period",
        value: `${fmt(orbit.orbitalPeriodDays, 2)} days`,
        meta: `${fmt(orbit.orbitalPeriodYears, 4)} years`,
      },
    ].map(normalizeVolatileItem);

    const detectionItems = [
      { label: "Transit Depth", value: display.transitDepth, meta: display.transitProbability },
      {
        label: "RV Semi-Amplitude",
        value: display.rvSemiAmplitude,
        meta: "Edge-on / transiting reference",
      },
      {
        label: "Transit Radius Source",
        value: physical.radiusSource === "observed" ? "Observed" : "Modelled",
      },
    ].map(normalizeVolatileItem);

    const eraTimelineSection = createEraTimelineSection(model.derived?.eraTimeline, {
      id: "planet-era-timeline",
    });

    const longTermDynamicsSection = buildLongTermDynamicsSection(world, body?.id);
    bodyOutputsEl.replaceChildren();
    renderKpiSections(bodyOutputsEl, [
      { id: "volatile-summary", title: "Key Numbers", items: summaryItems },
      {
        id: "volatile-physical",
        title: "Physical State",
        density: "compact",
        items: physicalItems,
      },
      {
        id: "volatile-envelope",
        title: "Activity & Radiation",
        density: "compact",
        items: envelopeItems,
      },
      {
        id: "volatile-environment",
        title: "Environment",
        density: "compact",
        items: environmentItems,
      },
      longTermDynamicsSection,
      { id: "volatile-detection", title: "Detection", density: "compact", items: detectionItems },
    ]);
    renderPlanetResultSummary(
      bodyOutputsEl,
      buildVolatilePlanetResultSummary({ body, model, classificationLabel, display, physical }),
    );
    if (eraTimelineSection) {
      bodyOutputsEl.insertBefore(eraTimelineSection, bodyOutputsEl.children[2] || null);
    }
    enableOutputSectionTabs(bodyOutputsEl, { label: "Planet output sections", includeAll: true });
    let volatileCanvas = bodyOutputsEl.querySelector(".volatile-preview-canvas");
    if (prevVolatileCanvas && volatileCanvas && prevVolatileCanvas !== volatileCanvas) {
      prevVolatileCanvas.dataset.style = volatileStyleId;
      volatileCanvas.replaceWith(prevVolatileCanvas);
      volatileCanvas = prevVolatileCanvas;
    }
    if (volatileCanvas) {
      celestialPreviewController.attach(volatileCanvas, {
        bodyType: "gasGiant",
        name: body.name || "Volatile body",
        styleId: volatileStyleId,
        gasCalc: model,
        gasProfile,
        ringAppearance,
        ringStyleId: ringAppearance?.ringStyleId,
        ringMode: "auto",
        showRings,
        rotationPeriodHours: Number(body.rotation?.rotationPeriodHours) || 12,
        visualDescriptor,
        visualOverrideSignature: visualDescriptor.overrideSignature || "",
        visualRenderSignature: visualDescriptor.renderSignature || "",
      });
    } else {
      celestialPreviewController.detach();
    }
  }

  /* ── Vegetation info dialog ─────────────────────────────────────── */

  const VEG_GRID_STARS = [
    { label: "A0", mass: 2.5, age: 0.5 },
    { label: "F0", mass: 1.6, age: 2.0 },
    { label: "F5", mass: 1.3, age: 3.0 },
    { label: "G0", mass: 1.05, age: 4.0 },
    { label: "G2", mass: 1.0, age: 4.6 },
    { label: "G5", mass: 0.92, age: 5.0 },
    { label: "K0", mass: 0.79, age: 6.0 },
    { label: "K5", mass: 0.67, age: 7.0 },
    { label: "M0", mass: 0.51, age: 8.0 },
    { label: "M2", mass: 0.4, age: 8.0 },
    { label: "M5", mass: 0.18, age: 8.0 },
    { label: "M8", mass: 0.1, age: 8.0 },
  ];
  const VEG_GRID_PRESSURES = [0.01, 0.1, 0.5, 1, 3, 10, 30, 100];
  const VEG_GRID_PLANET = {
    massEarth: 1,
    cmfPct: 33,
    axialTiltDeg: 23.4,
    albedoBond: 0.3,
    greenhouseEffect: 1,
    observerHeightM: 2,
    rotationPeriodHours: 24,
    semiMajorAxisAu: 1,
    eccentricity: 0.017,
    inclinationDeg: 0,
    longitudeOfPeriapsisDeg: 0,
    subsolarLongitudeDeg: 0,
    pressureAtm: 1,
    o2Pct: 21,
    co2Pct: 0.04,
    arPct: 1,
  };

  function buildVegGridModel() {
    const headers = VEG_GRID_PRESSURES.map((pressureAtm) => ({
      label: `${pressureAtm} atm`,
      extrapolated: pressureAtm < 1 || pressureAtm > 10,
    }));

    const rows = VEG_GRID_STARS.map((star) => ({
      starLabel: star.label,
      cells: VEG_GRID_PRESSURES.map((pressureAtm) => {
        const result = calcPlanetExact({
          starMassMsol: star.mass,
          starAgeGyr: star.age,
          starMetallicityFeH: 0,
          planet: {
            ...VEG_GRID_PLANET,
            pressureAtm,
            semiMajorAxisAu: vegGridOrbit(star.mass),
          },
        });
        const derived = result.derived;
        return {
          stops: derived.vegetationStops || [derived.vegetationPaleHex, derived.vegetationDeepHex],
          label: `${derived.vegetationPaleHex} → ${derived.vegetationDeepHex}`,
        };
      }),
    }));

    const twilightRows = [];
    for (const star of VEG_GRID_STARS.filter((entry) => entry.mass <= 0.79)) {
      const orbit = vegGridTwilightOrbit(star.mass);
      const probe = calcPlanetExact({
        starMassMsol: star.mass,
        starAgeGyr: star.age,
        starMetallicityFeH: 0,
        planet: { ...VEG_GRID_PLANET, pressureAtm: 1, semiMajorAxisAu: orbit },
      });
      if (!probe.derived.vegetationTwilightPaleHex) continue;

      twilightRows.push({
        starLabel: star.label,
        cells: VEG_GRID_PRESSURES.map((pressureAtm) => {
          const result = calcPlanetExact({
            starMassMsol: star.mass,
            starAgeGyr: star.age,
            starMetallicityFeH: 0,
            planet: { ...VEG_GRID_PLANET, pressureAtm, semiMajorAxisAu: orbit },
          });
          const derived = result.derived;
          if (!derived.vegetationTwilightPaleHex) {
            return { label: "-" };
          }
          return {
            stops: derived.vegetationTwilightStops || [
              derived.vegetationTwilightPaleHex,
              derived.vegetationTwilightDeepHex,
            ],
            label: `${derived.vegetationTwilightPaleHex} → ${derived.vegetationTwilightDeepHex}`,
          };
        }),
      });
    }

    return { headers, rows, twilightRows };
  }

  function openVegInfoDialog(v) {
    const pAtm = Number(v.pressureAtm) || 1;
    const isExtrapolated = pAtm > 10 || pAtm < 1;
    const overlay = createVegetationInfoOverlay({
      paleHex: v.paleHex,
      deepHex: v.deepHex,
      note: v.note,
      pressureAtm: pAtm,
      isExtrapolated,
      stops: v.stops,
      twilight: v.twilightPaleHex
        ? {
            paleHex: v.twilightPaleHex,
            deepHex: v.twilightDeepHex,
            stops: v.twilightStops,
          }
        : null,
    });
    document.body.appendChild(overlay);

    // Lazy-build the reference grid on first toggle
    const gridToggle = overlay.querySelector("#btn-veg-grid-toggle");
    const gridContainer = overlay.querySelector("#veg-grid-container");
    const dialog = overlay.querySelector(".veg-info-dialog");
    let gridBuilt = false;

    gridToggle?.addEventListener("click", () => {
      const showing = !gridContainer.hidden;
      if (showing) {
        gridContainer.hidden = true;
        gridToggle.textContent = "Show grid";
        if (dialog) dialog.style.width = "";
      } else {
        if (!gridBuilt) {
          renderVegetationGrid(gridContainer, buildVegGridModel());
          gridBuilt = true;
        }
        gridContainer.hidden = false;
        gridToggle.textContent = "Hide grid";
        if (dialog) dialog.style.width = "min(960px, calc(100vw - 36px))";
      }
    });

    function close() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector(".veg-info-close").addEventListener("click", close);

    function onKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
  }

  /* ── Gas giant rendering ────────────────────────────────────────── */

  function renderGasGiantInputs(world, giant, sysModel) {
    if (!giant) {
      renderHint(bodyInputsEl, "No gas giant selected.");
      return;
    }
    const homeSystemContext = buildPlanetHomeSystemContext(world);
    const solveContext = resolvePlanetPageHostFrameContext(
      world,
      giant,
      sysModel,
      homeSystemContext,
    );
    const hostFrameId = normalizeHostFrameId(
      solveContext?.hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const hostSystem = solveContext?.hostFrame?.system || sysModel;
    const orbitsAu = hostSystem.orbitsAu;
    const guidedOrbitMode = formHelpers.isGuidedOrbitMode(world);
    const planets = filterBodiesForHostFrame(
      listPlanets(world),
      hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const gasGiants = filterBodiesForHostFrame(
      listSystemGasGiants(world),
      hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const giantCompanionClass = getGiantCompanionClass(giant);
    const giantMassBounds = getGiantCompanionMassBounds(giantCompanionClass);
    const giantFormDescriptors = buildGiantCompanionFormDescriptors(giant);
    const planetSlots = new Set();
    for (const pp of planets) {
      if (pp.slotIndex != null && pp.slotIndex >= 1 && pp.slotIndex <= 20) {
        planetSlots.add(pp.slotIndex);
      }
    }
    const ggSlotMap = new Map();
    for (const g of gasGiants) {
      if (g.slotIndex != null) ggSlotMap.set(g.slotIndex, g.id);
    }

    const slotOptions = [
      {
        value: "",
        label: guidedOrbitMode ? "No slot selected" : "Custom orbit",
        selected: !giant.slotIndex,
      },
    ];
    for (let i = 0; i < 20; i++) {
      const slot = i + 1;
      const au = orbitsAu[i];
      const occupiedByPlanet = planetSlots.has(slot);
      const occupiedByGG = ggSlotMap.has(slot) && ggSlotMap.get(slot) !== giant.id;
      const disabled = occupiedByPlanet || occupiedByGG;
      const tag = occupiedByPlanet ? " (planet)" : occupiedByGG ? " (giant)" : "";
      slotOptions.push({
        value: String(slot),
        disabled,
        selected: giant.slotIndex === slot,
        label: `Slot ${slot} \u2014 ${fmt(au, 2)} AU${tag}`,
      });
    }
    renderGasGiantInputForm(bodyInputsEl, {
      giant: {
        ...giant,
        radiusRj: clampGasGiantRadiusRj(giant.radiusRj),
      },
      hostFrameOptions: buildHostFrameOptions(homeSystemContext, hostFrameId),
      hostFrameHint: formatHostFrameHint(solveContext),
      slotHint: giant.slotIndex
        ? `Slot ${giant.slotIndex} \u2014 ${fmt(orbitsAu[giant.slotIndex - 1], 3)} AU`
        : `${fmt(Number(giant.au) || 0, 3)} AU (custom)`,
      slotOptions,
      tipLabels: TIP_LABEL,
      companionClassOptions: buildGiantCompanionClassOptions(giantCompanionClass),
      descriptors: giantFormDescriptors,
      ranges: {
        radius: {
          min: GAS_GIANT_RADIUS_MIN_RJ,
          max: GAS_GIANT_RADIUS_MAX_RJ,
          step: GAS_GIANT_RADIUS_STEP_RJ,
        },
        mass: giantMassBounds,
        metallicity: {
          min: GAS_GIANT_METALLICITY_MIN,
          max: GAS_GIANT_METALLICITY_MAX,
          step: GAS_GIANT_METALLICITY_STEP,
        },
      },
    });
    const ggCustomAuRow = bodyInputsEl.querySelector("#ggAu")?.closest(".form-row");
    if (ggCustomAuRow) ggCustomAuRow.id = "ggCustomAuRow";
    if (ggCustomAuRow && guidedOrbitMode) ggCustomAuRow.style.display = "";
    const ggRingModePillsEl = bodyInputsEl.querySelector("#ggRingModePills");
    const ggRingModeHintEl = bodyInputsEl.querySelector("#ggRingModeHint");
    const ggRingStyleSelectEl = bodyInputsEl.querySelector("#ggRingStyleSelect");
    const ggRingStyleHintEl = bodyInputsEl.querySelector("#ggRingStyleHint");
    const syncGasGiantRingUi = ({ ringState, ringAppearance }) => {
      if (ggRingModeHintEl) ggRingModeHintEl.textContent = formatGasGiantRingHint(ringState);
      syncRingStyleControl(ggRingStyleSelectEl, ringState, ringAppearance);
      if (ggRingStyleHintEl) {
        ggRingStyleHintEl.textContent = formatRingStyleHint(ringAppearance, ringState);
      }
    };
    const getSelectedRingMode = () =>
      normalizeRingMode(
        bodyInputsEl.querySelector('input[name="ggRingMode"]:checked')?.value || giant.ringMode,
      );
    syncGasGiantRingUi(deriveGasGiantAppearanceState(world, giant, hostSystem, gasGiants));

    // Bind sliders and attach events
    let hydrating = true;

    function saveGiant() {
      if (isRendering || hydrating) return;
      const w = loadWorld();
      const currentHomeSystemContext = buildPlanetHomeSystemContext(w);
      const now = listSystemGasGiants(w);
      const g = now.find((x) => x.id === giant.id);
      if (!g) return;

      g.name = bodyInputsEl.querySelector("#ggName").value;
      g.hostFrameId = normalizeHostFrameId(
        bodyInputsEl.querySelector("#ggHostFrame")?.value,
        currentHomeSystemContext?.defaultHostFrameId,
      );
      const currentSolveContext = resolvePlanetPageHostFrameContext(
        w,
        g,
        sysModel,
        currentHomeSystemContext,
      );
      const currentHostSystem = currentSolveContext?.hostFrame?.system || sysModel;
      const guidedNow = formHelpers.isGuidedOrbitMode(w);
      const slotVal = bodyInputsEl.querySelector("#ggSlot").value;
      if (slotVal) {
        g.slotIndex = Number(slotVal);
        g.au = currentHostSystem.orbitsAu[g.slotIndex - 1];
      } else {
        g.slotIndex = null;
        if (!guidedNow) {
          const au = Number(bodyInputsEl.querySelector("#ggAu").value);
          g.au = Number.isFinite(au) && au > 0 ? au : 0.01;
        }
      }
      g.radiusRj = clampGasGiantRadiusRj(bodyInputsEl.querySelector("#ggRadius").value);
      const selectedCompanionClass = normalizeGiantCompanionClass(
        bodyInputsEl.querySelector("#ggCompanionClass")?.value || g.companionClass,
      );
      g.companionClass = selectedCompanionClass;
      const massVal = bodyInputsEl.querySelector("#ggMass").value;
      if (selectedCompanionClass === GIANT_COMPANION_CLASS_BROWN_DWARF) {
        const storedMass = Number(g.massMjup);
        const fallbackMass =
          Number.isFinite(storedMass) && storedMass >= BROWN_DWARF_MASS_MIN_MJUP ? storedMass : 20;
        const resolvedMass =
          massVal !== "" && Number.isFinite(Number(massVal)) ? Number(massVal) : fallbackMass;
        g.massMjup = Math.min(
          BROWN_DWARF_MASS_MAX_MJUP,
          Math.max(BROWN_DWARF_MASS_MIN_MJUP, resolvedMass),
        );
      } else {
        g.massMjup = massVal !== "" ? Number(massVal) || null : null;
        if (Number.isFinite(g.massMjup) && g.massMjup > GAS_GIANT_MASS_MAX_MJUP) {
          g.massMjup = GAS_GIANT_MASS_MAX_MJUP;
        }
      }
      const rotVal = bodyInputsEl.querySelector("#ggRotation").value;
      g.rotationPeriodHours = rotVal !== "" ? Number(rotVal) || null : null;
      const metVal = bodyInputsEl.querySelector("#ggMetallicity").value;
      g.metallicity = metVal !== "" ? Number(metVal) || null : null;
      g.carbonRichness = formHelpers.readOptionalSelectValue(
        bodyInputsEl.querySelector("#ggCarbonRichness"),
      );
      for (const fieldName of ["bulkDensityGcm3", "internalHeatFluxWm2", "tidalHeatFluxWm2"]) {
        const result = formHelpers.readOptionalNonNegativeNumber(
          bodyInputsEl.querySelector(
            `#gg${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`,
          ),
          g[fieldName],
        );
        if (!result.ok) return;
        g[fieldName] = result.value;
      }
      g.strippedEnvelopeCandidate = !!bodyInputsEl.querySelector("#ggStrippedEnvelopeCandidate")
        ?.checked;
      g.migratedCloseIn = !!bodyInputsEl.querySelector("#ggMigratedCloseIn")?.checked;
      g.rogueCandidate = !!bodyInputsEl.querySelector("#ggRogueCandidate")?.checked;
      const eccVal = bodyInputsEl.querySelector("#ggEcc").value;
      g.eccentricity = eccVal !== "" ? Number(eccVal) || null : null;
      const incVal = bodyInputsEl.querySelector("#ggInc").value;
      g.inclinationDeg = incVal !== "" ? Number(incVal) || null : null;
      const tiltVal = bodyInputsEl.querySelector("#ggTilt").value;
      g.axialTiltDeg = tiltVal !== "" ? Number(tiltVal) || null : null;
      g.ringMode = getSelectedRingMode();
      if (g.ringMode === RING_MODE_FORCE_ON && ggRingStyleSelectEl) {
        g.ringStyleId = normalizeRingStyleId(ggRingStyleSelectEl.value);
      } else {
        g.ringStyleId = normalizeRingStyleId(g.ringStyleId);
      }
      const { derivedStyle, generatedStyle, ringState, generatedRingState, ringAppearance } =
        deriveGasGiantAppearanceState(w, g, currentHostSystem, now);
      g.style = generatedStyle || derivedStyle;
      g.rings = generatedRingState?.effectiveEnabled ?? ringState.effectiveEnabled;
      syncGasGiantRingUi({ ringState, ringAppearance });

      saveSystemGasGiants(now);
      scheduleRender(true);
    }

    const auEl = bodyInputsEl.querySelector("#ggAu");
    const auSlider = bodyInputsEl.querySelector("#ggAu_slider");
    bindOrbitRangeControl({
      numberEl: auEl,
      sliderEl: auSlider,
      root: auEl?.closest(".orbit-range-control"),
      min: ORBIT_AU_MIN,
      max: ORBIT_AU_MAX,
      step: 0.01,
      commitOnInput: false,
      statusSubject: "orbit",
      onChange: () => {
        if (!hydrating && !guidedOrbitMode) saveGiant();
      },
    });

    const radiusEl = bodyInputsEl.querySelector("#ggRadius");
    const radiusSlider = bodyInputsEl.querySelector("#ggRadius_slider");
    bindNumberAndSlider({
      numberEl: radiusEl,
      sliderEl: radiusSlider,
      min: GAS_GIANT_RADIUS_MIN_RJ,
      max: GAS_GIANT_RADIUS_MAX_RJ,
      step: GAS_GIANT_RADIUS_STEP_RJ,
      mode: "auto",
      commitOnInput: false,
      onChange: () => {
        if (!hydrating) saveGiant();
      },
    });

    const massEl = bodyInputsEl.querySelector("#ggMass");
    const massSlider = bodyInputsEl.querySelector("#ggMass_slider");
    bindNumberAndSlider({
      numberEl: massEl,
      sliderEl: massSlider,
      min: giantMassBounds.min,
      max: giantMassBounds.max,
      step: giantMassBounds.step,
      mode: "auto",
      commitOnInput: false,
      onChange: () => {
        if (!hydrating) saveGiant();
      },
    });

    const rotEl = bodyInputsEl.querySelector("#ggRotation");
    const rotSlider = bodyInputsEl.querySelector("#ggRotation_slider");
    bindNumberAndSlider({
      numberEl: rotEl,
      sliderEl: rotSlider,
      min: 1,
      max: 100,
      step: 0.1,
      mode: "auto",
      commitOnInput: false,
      onChange: () => {
        if (!hydrating) saveGiant();
      },
    });

    const metEl = bodyInputsEl.querySelector("#ggMetallicity");
    const metSlider = bodyInputsEl.querySelector("#ggMetallicity_slider");
    bindNumberAndSlider({
      numberEl: metEl,
      sliderEl: metSlider,
      min: GAS_GIANT_METALLICITY_MIN,
      max: GAS_GIANT_METALLICITY_MAX,
      step: GAS_GIANT_METALLICITY_STEP,
      mode: "auto",
      commitOnInput: false,
      onChange: () => {
        if (!hydrating) saveGiant();
      },
    });

    const eccEl = bodyInputsEl.querySelector("#ggEcc");
    const eccSlider = bodyInputsEl.querySelector("#ggEcc_slider");
    bindNumberAndSlider({
      numberEl: eccEl,
      sliderEl: eccSlider,
      min: 0,
      max: 0.99,
      step: 0.001,
      mode: "auto",
      commitOnInput: false,
      onChange: () => {
        if (!hydrating) saveGiant();
      },
    });

    const incEl = bodyInputsEl.querySelector("#ggInc");
    const incSlider = bodyInputsEl.querySelector("#ggInc_slider");
    bindNumberAndSlider({
      numberEl: incEl,
      sliderEl: incSlider,
      min: 0,
      max: 180,
      step: 0.1,
      mode: "auto",
      commitOnInput: false,
      onChange: () => {
        if (!hydrating) saveGiant();
      },
    });

    const tiltEl = bodyInputsEl.querySelector("#ggTilt");
    const tiltSlider = bodyInputsEl.querySelector("#ggTilt_slider");
    bindNumberAndSlider({
      numberEl: tiltEl,
      sliderEl: tiltSlider,
      min: 0,
      max: 180,
      step: 0.1,
      mode: "auto",
      commitOnInput: false,
      onChange: () => {
        if (!hydrating) saveGiant();
      },
    });

    bodyInputsEl.querySelector("#ggHostFrame")?.addEventListener("change", () => {
      if (hydrating) return;
      bodyInputsEl.querySelector("#ggSlot").value = "";
      bodyInputsEl.querySelector("#ggCustomAuRow").style.display = "";
      saveGiant();
      scheduleRender();
    });

    bodyInputsEl.querySelector("#ggSlot").addEventListener("change", () => {
      if (hydrating) return;
      bodyInputsEl.querySelector("#ggCustomAuRow").style.display = guidedOrbitMode
        ? ""
        : bodyInputsEl.querySelector("#ggSlot").value
          ? "none"
          : "";
      saveGiant();
    });

    bodyInputsEl.querySelector("#ggName").addEventListener("change", () => {
      if (!hydrating) saveGiant();
    });
    bodyInputsEl.querySelector("#ggCompanionClass")?.addEventListener("change", () => {
      if (!hydrating) saveGiant();
    });
    ggRingModePillsEl?.addEventListener("change", () => {
      if (!hydrating) saveGiant();
    });
    ggRingStyleSelectEl?.addEventListener("change", () => {
      if (!hydrating) saveGiant();
    });
    [
      "#ggCarbonRichness",
      "#ggBulkDensityGcm3",
      "#ggInternalHeatFluxWm2",
      "#ggTidalHeatFluxWm2",
      "#ggStrippedEnvelopeCandidate",
      "#ggMigratedCloseIn",
      "#ggRogueCandidate",
    ].forEach((selector) => {
      bodyInputsEl.querySelector(selector)?.addEventListener("change", () => {
        if (!hydrating) saveGiant();
      });
    });

    // Fire initial slider sync
    [auEl, radiusEl, massEl, rotEl, metEl, eccEl, incEl, tiltEl].forEach((el) => {
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    if (guidedOrbitMode)
      formHelpers.applyGuidedOrbitDistanceGuard(
        bodyInputsEl,
        "ggAu",
        formHelpers.guidedOrbitDistanceMessage("gas giant"),
      );

    hydrating = false;
  }

  function renderBrownDwarfCompanionOutputs(world, giant, sysModel, gasCalc) {
    const presentation = buildBrownDwarfCompanionPresentation(world, giant, sysModel, gasCalc);
    const model = presentation.model;
    const activity = presentation.activity || {};
    const ageGyr = presentation.ageGyr ?? 4.6;
    const metallicityFeH = presentation.metallicityFeH ?? 0;
    const brownDwarfKpi = (label, value, meta = "", overrides = {}) => ({
      label,
      tip: TIP_LABEL[overrides.tipLabel || label] || "",
      value,
      meta,
      ...overrides,
    });
    const previewModel = {
      bodyType: "star",
      regime: model?.regime,
      starName: giant.name || "Brown dwarf",
      starMassMsol: model?.inputs?.massMsol,
      starAgeGyr: ageGyr,
      starTempK: model?.tempK,
      starColourHex: model?.starColourHex,
      activity,
    };
    const massNote =
      gasCalc.inputs.massSource === "derived"
        ? "Derived from radius"
        : gasCalc.inputs.massSource === "default"
          ? "Default"
          : "";
    const zoneLabel = getHostZoneLabel(model);
    const zoneValue = formatHostZoneValue(model);
    const zoneMeta = `AU | ${model?.display?.hzMkm || "n/a"} million km`;
    const xuvFluxMeta = `${model?.display?.xuvFluxRatioEarth || "0\u00d7 Earth"} | negligible`;
    const energeticRecurrenceText = formatRecurrence(activity.energeticFlareRatePerDay);
    const totalRecurrenceText = formatRecurrence(activity.totalFlareRatePerDay);
    const cmeTotalMeta =
      activity.teffBin === "FGK"
        ? "Solar-cycle envelope split into associated + background"
        : "Empirical split model outside FGK solar envelope";
    const atmosphereMixText =
      `H2 ${gasCalc.atmosphere.h2Pct}%, He ${gasCalc.atmosphere.hePct}%` +
      `${gasCalc.atmosphere.ch4Pct > 0 ? `, CH4 ${gasCalc.atmosphere.ch4Pct}%` : ""}` +
      `${gasCalc.atmosphere.coPct > 0 ? `, CO ${gasCalc.atmosphere.coPct}%` : ""}` +
      `${gasCalc.atmosphere.nh3Pct > 0 ? `, NH3 ${gasCalc.atmosphere.nh3Pct}%` : ""}`;

    const summaryItems = [
      brownDwarfKpi(
        "Focused Star Preview",
        `${model?.starColourHex || "#000000"}`,
        "Hex (derived from temperature) - Animated at 0.5 d/s with flares + CMEs",
        { kind: "sunVisual", tipLabel: "Star Colour" },
      ),
      brownDwarfKpi(
        "Brown Dwarf Class",
        getHostClassValue(model),
        regimeDisplayLabel(model?.regime),
      ),
      brownDwarfKpi(
        "Radius",
        fmt(model?.radiusRsol, 3),
        `Rsol | ${fmt(model?.metric?.radiusKm, 0)} km`,
        {
          tipLabel: "BD Radius",
        },
      ),
      brownDwarfKpi(
        "Luminosity",
        formatScaledLuminosityLsol(model?.luminosityLsol, 3),
        buildLuminosityKpiMeta(model),
        { tip: buildLuminosityKpiTooltip(model, TIP_LABEL["Luminosity"]) },
      ),
      brownDwarfKpi("Temperature", fmt(model?.tempK, 0), "K", { tipLabel: "BD Temperature" }),
      brownDwarfKpi(zoneLabel, zoneValue, zoneMeta, { tipLabel: "Habitable Zone" }),
      brownDwarfKpi(
        "Activity Regime",
        `${activity.teffBin || "lateM"}/${activity.ageBand || "old"}`,
        "Teff + age bins",
      ),
      brownDwarfKpi(
        "Direct Earth-like Life",
        "No (substellar host)",
        "Use the current temperate zone and moon outputs instead",
      ),
    ];
    const identityItems = [
      brownDwarfKpi("Current Age", fmt(ageGyr, 3), "Gyr"),
      brownDwarfKpi("Metallicity [Fe/H]", fmt(metallicityFeH, 2), "dex"),
      brownDwarfKpi(
        "Population",
        shortPopulationLabel(model?.populationLabel),
        `${model?.populationLabel || "Substellar object"} | [Fe/H] = ${fmt(model?.inputs?.metallicityFeH, 2)}`,
        { tipLabel: "Stellar Population" },
      ),
    ];
    const physicalItems = [
      brownDwarfKpi("Cooling State", getHostLifetimeValue(model), getHostLifetimeMeta(model)),
      brownDwarfKpi(
        "Radius",
        fmt(model?.radiusRsol, 3),
        `Rsol | ${fmt(model?.metric?.radiusKm, 0)} km`,
        {
          tipLabel: "BD Radius",
        },
      ),
      brownDwarfKpi(
        "Luminosity",
        formatScaledLuminosityLsol(model?.luminosityLsol, 3),
        buildLuminosityKpiMeta(model),
        { tip: buildLuminosityKpiTooltip(model, TIP_LABEL["Luminosity"]) },
      ),
      brownDwarfKpi("Density", `${fmt(model?.densityGcm3, 3)} g/cm\u00b3`),
      brownDwarfKpi("Temperature", fmt(model?.tempK, 0), "K", { tipLabel: "BD Temperature" }),
    ];
    const environmentItems = [
      brownDwarfKpi(zoneLabel, zoneValue, zoneMeta, { tipLabel: "Habitable Zone" }),
    ];
    const systemItems = [
      brownDwarfKpi(
        "Companion Type",
        getGiantCompanionDisplayLabel(gasCalc),
        "Cooling-track regime",
        {
          tipLabel: "GG Companion Class",
        },
      ),
      brownDwarfKpi(
        "Host frame",
        gasCalc.hostFrame?.label || "Primary star",
        gasCalc.hostFrame?.frameKind === "pair"
          ? "Circumbinary host"
          : gasCalc.hostFrame?.orbitFamilyKind === "single"
            ? "Single-star host"
            : "Circumstellar host",
      ),
      brownDwarfKpi(
        "Orbital Period",
        gasCalc.display.orbitalPeriod,
        gasCalc.display.orbitalVelocity,
      ),
      brownDwarfKpi("Insolation", gasCalc.display.insolation),
      brownDwarfKpi("Companion Flux", gasCalc.display.companionFlux),
      brownDwarfKpi("Flux Variability", gasCalc.display.fluxVariability),
      brownDwarfKpi(
        "Dynamical Stability",
        gasCalc.display.dynamicalStability,
        Array.isArray(gasCalc.orbital?.dynamicalStabilityNotes)
          ? gasCalc.orbital.dynamicalStabilityNotes.join(" ")
          : "",
      ),
      brownDwarfKpi(
        "Transit Depth",
        gasCalc.display.transitDepth,
        gasCalc.display.transitProbability,
      ),
      brownDwarfKpi(
        "RV Semi-Amplitude",
        gasCalc.display.rvSemiAmplitude,
        "Edge-on / transiting reference",
      ),
    ];
    const activityItems = [
      brownDwarfKpi(
        "Activity Regime",
        `${activity.teffBin || "lateM"}/${activity.ageBand || "old"}`,
        "Teff + age bins",
      ),
      brownDwarfKpi(
        "XUV Regime",
        model?.display?.xuvRegime || "Negligible",
        model?.display?.xuvSaturationAge || "0 Gyr",
      ),
      brownDwarfKpi(
        "XUV Flux at 1 AU",
        model?.display?.xuvFluxAt1Au || "0 erg/cm\u00b2/s",
        xuvFluxMeta,
      ),
      brownDwarfKpi(
        "XUV Luminosity",
        model?.display?.xuvLuminosityW || "0 W",
        model?.display?.xuvLuminosityErgS || "0.00e+0",
      ),
      brownDwarfKpi(
        "N32 Rate",
        fmt(activity.energeticFlareRatePerDay, 3),
        "flares/day (>1e32 erg)",
        {
          tipLabel: "Energetic Flare Rate (>1e32 erg)",
        },
      ),
      brownDwarfKpi("Energetic Flare Recurrence", energeticRecurrenceText, "for >1e32 erg flares"),
      brownDwarfKpi(
        "Total Flare Rate (>1e30 erg)",
        fmt(activity.totalFlareRatePerDay, 3),
        "flares/day",
      ),
      brownDwarfKpi("Total Flare Recurrence", totalRecurrenceText, "for >1e30 erg flares"),
      brownDwarfKpi("Associated CME Rate", fmt(activity.cmeAssociatedRatePerDay, 3), "CME/day"),
      brownDwarfKpi("Background CME Rate", fmt(activity.cmeBackgroundRatePerDay, 3), "CME/day"),
      brownDwarfKpi("Total CME Rate", fmt(activity.cmeTotalRatePerDay, 3), cmeTotalMeta),
      brownDwarfKpi(
        "Solar CME Envelope (FGK)",
        activity.teffBin === "FGK" ? "0.5 to 6.0/day" : "n/a",
        activity.teffBin === "FGK" ? "Solar-cycle observed range" : "FGK stars only",
      ),
    ];
    const habitabilityItems = [
      brownDwarfKpi(
        "Direct Earth-like Life",
        "No (substellar host)",
        "Use the current temperate zone and moon outputs instead",
      ),
    ];

    const derivedDetails = createDerivedDetails(
      [
        {
          id: "gas-giant-details-identity",
          title: "Identity & Class",
          items: [
            { label: "Name", value: giant.name || "Brown dwarf" },
            { label: "Companion Type", value: getGiantCompanionDisplayLabel(gasCalc) },
            { label: "Brown Dwarf Class", value: getHostClassValue(model) },
            { label: "Current Age", value: `${fmt(ageGyr, 3)} Gyr` },
            { label: "Metallicity [Fe/H]", value: `${fmt(metallicityFeH, 2)} dex` },
            { label: "Population", value: model?.populationLabel || "Substellar object" },
          ],
        },
        {
          id: "gas-giant-details-physical",
          title: "Physical State",
          items: [
            {
              label: "Cooling State",
              value: getHostLifetimeValue(model),
              meta: getHostLifetimeMeta(model),
            },
            { label: "Mass", value: gasCalc.display.mass, meta: massNote },
            {
              label: "Radius",
              value: `${fmt(model?.radiusRsol, 3)} Rsol`,
              meta: `${fmt(model?.radiusRj, 3)} Rj | ${fmt(model?.metric?.radiusKm, 0)} km`,
            },
            {
              label: "Luminosity",
              value: `${formatLuminosityLsol(model?.luminosityLsol, 3)} Lsol`,
              meta: `${fmt(model?.metric?.luminosityW, 0)} W`,
            },
            { label: "Density", value: `${fmt(model?.densityGcm3, 3)} g/cm\u00b3` },
            { label: "Gravity", value: gasCalc.display.gravity },
            { label: "Escape Velocity", value: gasCalc.display.escapeVelocity },
            { label: "Temperature", value: `${fmt(model?.tempK, 0)} K` },
          ],
        },
        {
          id: "gas-giant-details-environment",
          title: "Environment",
          items: [
            {
              label: zoneLabel,
              value: zoneValue,
              meta: `${model?.display?.hzMkm || "n/a"} million km`,
            },
            { label: "Star Colour", value: model?.starColourHex || "n/a" },
            { label: "Equilibrium Temp", value: gasCalc.display.equilibriumTemp },
            { label: "Bond albedo", value: fmt(gasCalc.thermal.bondAlbedo, 2) },
            { label: "Internal heat ratio", value: fmt(gasCalc.thermal.internalHeatRatio, 2) },
            { label: "Atmosphere mix", value: atmosphereMixText },
            { label: "Dominant trace", value: gasCalc.atmosphere.dominantTrace },
            {
              label: "Cloud layers",
              value: gasCalc.clouds.map((cloud) => cloud.name).join(", ") || "None",
            },
          ],
        },
        {
          id: "gas-giant-details-system",
          title: "System Context",
          items: [
            { label: "Companion Type", value: getGiantCompanionDisplayLabel(gasCalc) },
            {
              label: "Host frame",
              value: gasCalc.hostFrame?.label || "Primary star",
              meta:
                gasCalc.hostFrame?.frameKind === "pair"
                  ? "Circumbinary host"
                  : gasCalc.hostFrame?.orbitFamilyKind === "single"
                    ? "Single-star host"
                    : "Circumstellar host",
            },
            {
              label: "Orbital Period",
              value: gasCalc.display.orbitalPeriod,
              meta: gasCalc.display.orbitalVelocity,
            },
            { label: "Insolation", value: gasCalc.display.insolation },
            { label: "Companion Flux", value: gasCalc.display.companionFlux },
            { label: "Flux Variability", value: gasCalc.display.fluxVariability },
            {
              label: "Dynamical Stability",
              value: gasCalc.display.dynamicalStability,
              meta: Array.isArray(gasCalc.orbital?.dynamicalStabilityNotes)
                ? gasCalc.orbital.dynamicalStabilityNotes.join(" ")
                : "",
            },
            {
              label: "Transit Depth",
              value: gasCalc.display.transitDepth,
              meta: gasCalc.display.transitProbability,
            },
            {
              label: "RV Semi-Amplitude",
              value: gasCalc.display.rvSemiAmplitude,
              meta: "Edge-on / transiting reference",
            },
            ...(gasCalc.display.peri
              ? [
                  {
                    label: "Periapsis",
                    value: `${gasCalc.display.peri} (${gasCalc.display.tempPeri})`,
                  },
                ]
              : []),
            ...(gasCalc.display.apo
              ? [
                  {
                    label: "Apoapsis",
                    value: `${gasCalc.display.apo} (${gasCalc.display.tempApo})`,
                  },
                ]
              : []),
            { label: "Orbital direction", value: gasCalc.display.orbitalDirection },
            { label: "Local days per year", value: gasCalc.display.localDaysPerYear },
            { label: "Nearest resonance", value: gasCalc.display.resonance },
            { label: "Hill sphere", value: gasCalc.display.hillSphere },
            { label: "Roche limit", value: gasCalc.display.rocheLimit },
            { label: "Chaotic zone", value: gasCalc.display.chaoticZone },
          ],
        },
        {
          id: "gas-giant-details-activity",
          title: "Activity & Radiation",
          items: [
            {
              label: "Activity Regime",
              value: `${activity.teffBin || "lateM"}/${activity.ageBand || "old"}`,
            },
            {
              label: "XUV Regime",
              value: model?.display?.xuvRegime || "Negligible",
              meta: model?.display?.xuvSaturationAge || "0 Gyr",
            },
            {
              label: "XUV Flux at 1 AU",
              value: model?.display?.xuvFluxAt1Au || "0 erg/cm\u00b2/s",
              meta: xuvFluxMeta,
            },
            {
              label: "XUV Luminosity",
              value: model?.display?.xuvLuminosityW || "0 W",
              meta: model?.display?.xuvLuminosityErgS || "0.00e+0",
            },
            { label: "N32 Rate", value: `${fmt(activity.energeticFlareRatePerDay, 3)} flares/day` },
            { label: "Energetic Flare Recurrence", value: energeticRecurrenceText },
            {
              label: "Total Flare Rate (>1e30 erg)",
              value: `${fmt(activity.totalFlareRatePerDay, 3)} flares/day`,
            },
            { label: "Total Flare Recurrence", value: totalRecurrenceText },
            {
              label: "Associated CME Rate",
              value: `${fmt(activity.cmeAssociatedRatePerDay, 3)} CME/day`,
            },
            {
              label: "Background CME Rate",
              value: `${fmt(activity.cmeBackgroundRatePerDay, 3)} CME/day`,
            },
            {
              label: "Total CME Rate",
              value: `${fmt(activity.cmeTotalRatePerDay, 3)} CME/day`,
              meta: cmeTotalMeta,
            },
            {
              label: "Solar CME Envelope (FGK)",
              value: activity.teffBin === "FGK" ? "0.5 to 6.0/day" : "n/a",
              meta: activity.teffBin === "FGK" ? "Solar-cycle observed range" : "FGK stars only",
            },
            {
              label: "Magnetic Field",
              value: gasCalc.display.magneticField,
              meta: gasCalc.display.magneticMorphology,
            },
            { label: "Magnetosphere", value: gasCalc.display.magnetosphere },
            { label: "Moon tidal heating", value: gasCalc.display.moonTidalHeating },
            { label: "Atmospheric sputtering", value: gasCalc.display.sputteringPlasma },
            { label: "Mass loss", value: gasCalc.display.massLossRate },
            { label: "Evaporation", value: gasCalc.display.evaporationTimescale },
            { label: "Roche lobe", value: gasCalc.display.rocheLobeRadius },
            { label: "Jeans escape", value: gasCalc.display.jeansEscape },
            { label: "Tidal locking", value: gasCalc.display.tidalLocking },
            { label: "Circularisation", value: gasCalc.display.circularisation },
          ],
        },
        {
          id: "gas-giant-details-habitability",
          title: "Habitability",
          items: [
            {
              label: "Direct Earth-like Life",
              value: "No (substellar host)",
              meta: "Use the current temperate zone and moon outputs instead",
            },
          ],
        },
      ],
      { title: "Derived Details" },
    );

    const longTermDynamicsSection = buildLongTermDynamicsSection(world, giant.id);
    bodyOutputsEl.replaceChildren();
    renderKpiSections(bodyOutputsEl, [
      { id: "gas-giant-summary", title: "Key Numbers", items: summaryItems },
      {
        id: "gas-giant-identity",
        title: "Identity & Class",
        density: "compact",
        items: identityItems,
      },
      {
        id: "gas-giant-physical",
        title: "Physical State",
        density: "compact",
        items: physicalItems,
      },
      {
        id: "gas-giant-environment",
        title: "Environment",
        density: "compact",
        items: environmentItems,
      },
      { id: "gas-giant-system", title: "System Context", density: "compact", items: systemItems },
      longTermDynamicsSection,
      {
        id: "gas-giant-activity",
        title: "Activity & Radiation",
        density: "compact",
        items: activityItems,
      },
      {
        id: "gas-giant-habitability",
        title: "Habitability",
        density: "compact",
        items: habitabilityItems,
      },
    ]);
    renderPlanetResultSummary(
      bodyOutputsEl,
      buildBrownDwarfPlanetResultSummary({ giant, model, gasCalc }),
    );
    if (derivedDetails) bodyOutputsEl.append(derivedDetails);
    enableOutputSectionTabs(bodyOutputsEl, { label: "Planet output sections", includeAll: true });

    const sunCanvas = bodyOutputsEl.querySelector(".sun-preview-canvas");
    if (sunCanvas) {
      celestialPreviewController.attach(sunCanvas, previewModel);
    } else {
      celestialPreviewController.detach();
    }
  }

  function renderGasGiantOutputs(world, giant, sysModel) {
    if (!giant) {
      renderPlanetEmptyState(bodyOutputsEl, {
        title: "No gas giant selected",
        body: "Create or select a gas giant to see companion, ring, atmosphere, and moon-parent outputs here.",
      });
      return;
    }
    const allGiants = listSystemGasGiants(world);
    const {
      gasCalc: m,
      derivedStyle,
      generatedStyle,
      ringState,
      generatedRingState,
      ringAppearance,
      gasProfile,
      visualDescriptor,
      visualOverrideSignature,
      visualRenderSignature,
    } = deriveGasGiantAppearanceState(world, giant, sysModel, allGiants);
    const clouds = m.clouds.map((c) => c.name).join(", ") || "None";
    const massNote =
      m.inputs.massSource === "derived"
        ? "Derived from radius"
        : m.inputs.massSource === "default"
          ? "Default"
          : "";
    const radiusNote =
      m.inputs.radiusSource === "derived"
        ? "Derived from mass"
        : m.inputs.radiusSource === "default"
          ? "Default"
          : "";
    const metNote = m.inputs.metallicitySource === "derived" ? "Derived from mass" : "";
    const showRings = ringState.effectiveEnabled;
    const generatedShowRings = generatedRingState?.effectiveEnabled ?? showRings;
    const generatedRingMode = generatedRingState?.ringMode || ringState.ringMode;
    const persistedStyle = generatedStyle || derivedStyle;
    if (
      giant.rings !== generatedShowRings ||
      giant.style !== persistedStyle ||
      normalizeRingMode(giant.ringMode) !== generatedRingMode
    ) {
      giant.rings = generatedShowRings;
      giant.style = persistedStyle;
      giant.ringMode = generatedRingMode;
      const w = loadWorld();
      const all = listSystemGasGiants(w);
      const g = all.find((x) => x.id === giant.id);
      if (g) {
        g.rings = generatedShowRings;
        g.style = persistedStyle;
        g.ringMode = generatedRingMode;
        saveSystemGasGiants(all);
      }
    }
    const ringDisplay = buildGasGiantRingDisplay(ringState, m);
    const ringStyleDisplay = buildRingStyleDisplay(ringAppearance);
    const ringOverrideMeta = ringState.overrideActive
      ? ringState.againstScience
        ? "Manual override goes against the science."
        : "Manual override matches the science."
      : "Auto mode follows the science.";
    const ggRingModeHintEl = bodyInputsEl.querySelector("#ggRingModeHint");
    const ggRingStyleSelectEl = bodyInputsEl.querySelector("#ggRingStyleSelect");
    const ggRingStyleHintEl = bodyInputsEl.querySelector("#ggRingStyleHint");
    if (ggRingModeHintEl) ggRingModeHintEl.textContent = formatGasGiantRingHint(ringState);
    syncRingStyleControl(ggRingStyleSelectEl, ringState, ringAppearance);
    if (ggRingStyleHintEl) {
      ggRingStyleHintEl.textContent = formatRingStyleHint(ringAppearance, ringState);
    }

    if (isBrownDwarfCompanion(m)) {
      renderBrownDwarfCompanionOutputs(world, giant, sysModel, m);
      return;
    }

    const prevGasCanvas = bodyOutputsEl.querySelector(".gg-preview-canvas");
    const isBrownDwarf = isBrownDwarfCompanion(m);
    const classTip = isBrownDwarf
      ? TIP_LABEL["GG Companion Class"] || ""
      : TIP_LABEL["Sudarsky"] || "";
    const classValue = isBrownDwarf
      ? m.classification?.substellarClass || m.display?.classification || "Brown dwarf"
      : `Class ${m.classification.sudarsky}`;
    const appearanceItem = {
      kind: "preview",
      label: "Appearance",
      tip: classTip,
      canvasClass: "gg-preview-canvas",
      canvasDataset: {
        style: derivedStyle,
        rings: String(showRings),
      },
      meta: isBrownDwarf
        ? `${styleLabel(derivedStyle)} - ${classValue}`
        : `${styleLabel(derivedStyle)} - Class ${m.classification.sudarsky}`,
      actions: [
        {
          id: "editPlanetaryVisual",
          className: "small planetary-visual-edit-trigger",
          text: "Edit visual",
        },
      ],
    };
    const classItem = {
      label: isBrownDwarf ? "Brown Dwarf Class" : "Class",
      tip: classTip,
      value: classValue,
      meta: styleLabel(derivedStyle),
    };
    const companionTypeItem = {
      label: "Companion Type",
      tip: TIP_LABEL["GG Companion Class"] || "",
      value: getGiantCompanionDisplayLabel(m),
      meta: isBrownDwarf ? "Cooling-track regime" : "Planetary giant regime",
    };
    const massItem = {
      label: "Mass",
      tip: TIP_LABEL["GG Mass"] || "",
      value: m.display.mass,
      meta: massNote,
    };
    const metallicityItem = {
      label: "Metallicity",
      tip: TIP_LABEL["GG Metallicity"] || "",
      value: m.display.metallicity,
      meta: metNote,
    };
    const radiusItem = {
      label: "Radius",
      tip: TIP_LABEL["GG Output Radius"] || "",
      value: m.display.radius,
      meta: radiusNote,
    };
    const densityItem = {
      label: "Density",
      tip: TIP_LABEL["GG Density"] || "",
      value: m.display.density,
    };
    const gravityItem = {
      label: "Gravity",
      tip: TIP_LABEL["GG Gravity"] || "",
      value: m.display.gravity,
    };
    const escapeVelocityItem = {
      label: "Escape Velocity",
      tip: TIP_LABEL["GG Escape Velocity"] || "",
      value: m.display.escapeVelocity,
    };
    const magneticFieldItem = {
      label: "Magnetic Field",
      tip: TIP_LABEL["GG Magnetic Field"] || "",
      value: m.display.magneticField,
      meta: `${m.display.magneticMorphology} - ${m.magnetic.dynamoReason}`,
    };
    const gasTemps = buildGasGiantTemps(m, isBrownDwarf, TIP_LABEL["GG Equilibrium Temp"] || "");
    const { temperatureItem, equilibriumTemperatureItem } = gasTemps;
    const gasGiantIntrinsicHeatItems = gasTemps.intrinsicHeatItems;
    const orbitalPeriodItem = {
      label: "Orbital Period",
      tip: TIP_LABEL["GG Orbital Period"] || "",
      value: m.display.orbitalPeriod,
      meta: m.display.orbitalVelocity,
    };
    const ringsItem = {
      label: "Rings",
      tip: TIP_LABEL["GG Rings"] || TIP_LABEL["GG Ring Properties"] || "",
      value: ringDisplay.value,
      meta: ringDisplay.meta,
    };
    const coupledContextItems = buildGasGiantCoupledContextItems(m);
    const atmosphereItem = {
      label: "Atmosphere",
      tip: TIP_LABEL["GG Derived"] || "",
      value: m.atmosphere.dominantTrace,
      meta: `Clouds ${clouds}`,
    };
    const luminosityItem = {
      label: "Luminosity",
      tip: TIP_LABEL["GG Derived"] || "",
      value: m.display.luminosity || "n/a",
    };
    const coolingItem = {
      label: "Cooling State",
      tip: TIP_LABEL["GG Companion Class"] || "",
      value: m.display.coolingState || "n/a",
    };
    const zoneItem = {
      label: m.display.zoneLabel || getInsolationZoneLabelForRegime("brownDwarf"),
      tip: TIP_LABEL["Habitable Zone"] || "",
      value: m.display.zone || "n/a",
    };
    const insolationItem = {
      label: "Insolation",
      tip: TIP_LABEL["Insolation"] || "",
      value: m.display.insolation,
    };
    const hostFrameItem = {
      label: "Host frame",
      tip: TIP_LABEL["Host frame"] || "",
      value: m.hostFrame?.label || "Primary star",
      meta:
        m.hostFrame?.frameKind === "pair"
          ? "Circumbinary host"
          : m.hostFrame?.orbitFamilyKind === "single"
            ? "Single-star host"
            : "Circumstellar host",
    };
    const companionFluxItem = {
      label: "Companion Flux",
      tip: TIP_LABEL["Companion Flux"] || "",
      value: m.display.companionFlux,
    };
    const fluxVariabilityItem = {
      label: "Flux Variability",
      tip: TIP_LABEL["Flux Variability"] || "",
      value: m.display.fluxVariability,
    };
    const environmentForcingItem = {
      label: "Environment Forcing",
      tip: TIP_LABEL["Environment Forcing"] || "",
      value: m.display.environmentForcing || "n/a",
      meta: m.environmentForcing?.confidence
        ? `${String(m.environmentForcing.confidence).toUpperCase()} confidence`
        : "",
    };
    const dynamicalStabilityItem = {
      label: "Dynamical Stability",
      tip: TIP_LABEL["Dynamical Stability"] || "",
      value: m.display.dynamicalStability,
      meta:
        Array.isArray(m.orbital?.dynamicalStabilityNotes) &&
        m.orbital.dynamicalStabilityNotes.length
          ? m.orbital.dynamicalStabilityNotes.join(" ")
          : "",
    };
    const transitDepthItem = {
      label: "Transit Depth",
      tip: TIP_LABEL["Transit Depth"] || "",
      value: m.display.transitDepth,
      meta: m.display.transitProbability,
    };
    const rvSemiAmplitudeItem = {
      label: "RV Semi-Amplitude",
      tip: TIP_LABEL["RV Semi-Amplitude"] || "",
      value: m.display.rvSemiAmplitude,
      meta: "Edge-on / transiting reference",
    };
    const magnetosphereItem = {
      label: "Magnetosphere",
      tip: TIP_LABEL["GG Magnetosphere"] || "",
      value: m.display.magnetosphere,
      meta: m.display.windCompression || "",
    };
    const windCompressionItem = {
      label: "Wind Compression",
      tip: TIP_LABEL["Wind Compression"] || "",
      value: m.display.windCompression || "Not evaluated",
      meta: m.magnetic?.magnetosphereEnvironment?.scienceBasis || "",
    };
    const moonTidalHeatingItem = {
      label: "Moon Tidal Heating",
      value: m.display.moonTidalHeating,
    };
    const massLossItem = {
      label: "Mass Loss",
      tip: TIP_LABEL["GG Mass Loss"] || "",
      value: m.display.massLossRate,
      meta: m.display.evaporationTimescale,
    };
    const surfaceApplicabilityItem = {
      label: "Surface Applicability",
      value: isBrownDwarf ? "Substellar companion" : "No accessible solid surface",
      meta: isBrownDwarf
        ? "Use host-zone and moon outputs instead of rocky surface tools."
        : "Rocky climate, terrain, and habitability outputs are hidden for this body.",
    };
    const summaryItems = isBrownDwarf
      ? [
          appearanceItem,
          classItem,
          massItem,
          radiusItem,
          temperatureItem,
          zoneItem,
          coolingItem,
          magneticFieldItem,
        ]
      : [
          appearanceItem,
          classItem,
          massItem,
          radiusItem,
          temperatureItem,
          orbitalPeriodItem,
          magneticFieldItem,
          ringsItem,
        ];
    const identityItems = isBrownDwarf
      ? [companionTypeItem, classItem, luminosityItem, coolingItem]
      : [classItem, metallicityItem];
    const physicalItems = [massItem, radiusItem, densityItem, gravityItem, escapeVelocityItem];
    const environmentItems = isBrownDwarf
      ? [temperatureItem, luminosityItem, zoneItem, environmentForcingItem, atmosphereItem]
      : [
          equilibriumTemperatureItem,
          temperatureItem,
          ...gasGiantIntrinsicHeatItems,
          environmentForcingItem,
          atmosphereItem,
          ringsItem,
          coupledContextItems.ringArchitecture,
          surfaceApplicabilityItem,
        ];
    const systemItems = [
      hostFrameItem,
      orbitalPeriodItem,
      insolationItem,
      companionFluxItem,
      fluxVariabilityItem,
      dynamicalStabilityItem,
      transitDepthItem,
      coupledContextItems.observability,
      rvSemiAmplitudeItem,
    ];
    const activityItems = [
      magneticFieldItem,
      magnetosphereItem,
      coupledContextItems.aurora,
      windCompressionItem,
      moonTidalHeatingItem,
      massLossItem,
    ];

    const identityDetailItems = isBrownDwarf
      ? [
          { label: "Companion Type", value: getGiantCompanionDisplayLabel(m) },
          { label: "Class", value: classValue },
          { label: "Style", value: styleLabel(derivedStyle) },
          { label: "Luminosity", value: m.display.luminosity },
          { label: "Cooling state", value: m.display.coolingState },
        ]
      : [
          { label: "Class", value: `Class ${m.classification.sudarsky}` },
          { label: "Style", value: styleLabel(derivedStyle) },
          { label: "Metallicity", value: m.display.metallicity, meta: metNote },
          { label: "Heavy elements", value: m.display.heavyElements },
          { label: "Bulk metallicity", value: m.display.bulkMetallicity },
        ];
    const physicalDetailItems = [
      { label: "Mass", value: m.display.mass, meta: massNote },
      { label: "Radius", value: m.display.radius, meta: radiusNote },
      { label: "Density", value: m.display.density },
      { label: "Gravity", value: m.display.gravity },
      { label: "Escape Velocity", value: m.display.escapeVelocity },
      { label: "Suggested radius", value: m.display.suggestedRadius },
      { label: "Radius inflation", value: m.display.radiusInflation },
      { label: "Radius age note", value: m.display.radiusAgeNote },
      { label: "Oblateness", value: m.display.oblateness },
      { label: "Equatorial/Polar", value: m.display.equatorialRadius },
    ];
    const environmentDetailItems = [
      {
        label: "Atmosphere mix",
        value: `H2 ${m.atmosphere.h2Pct}%, He ${m.atmosphere.hePct}%${m.atmosphere.ch4Pct > 0 ? `, CH4 ${m.atmosphere.ch4Pct}%` : ""}${m.atmosphere.coPct > 0 ? `, CO ${m.atmosphere.coPct}%` : ""}${m.atmosphere.nh3Pct > 0 ? `, NH3 ${m.atmosphere.nh3Pct}%` : ""}`,
      },
      { label: "Dominant trace", value: m.atmosphere.dominantTrace },
      { label: "Cloud layers", value: clouds },
      {
        label: "Environment Forcing",
        value: m.display.environmentForcing,
        meta:
          Array.isArray(m.environmentForcing?.caveats) && m.environmentForcing.caveats.length
            ? m.environmentForcing.caveats.join(" | ")
            : "Canonical host-frame UV, XUV, wind, and light context",
      },
      { label: "Bond albedo", value: fmt(m.thermal.bondAlbedo, 2) },
      { label: "Internal heat ratio", value: fmt(m.thermal.internalHeatRatio, 2) },
      ...buildGasGiantThermalDetailItems(m, isBrownDwarf),
      ...(isBrownDwarf
        ? [
            { label: "Luminosity", value: m.display.luminosity },
            { label: m.display.zoneLabel || "Current Temperate Zone", value: m.display.zone },
            { label: "Cooling state", value: m.display.coolingState },
          ]
        : []),
      {
        label: "Ring visibility",
        value: ringDisplay.value,
        meta: getGasGiantRingModeLabel(ringState.ringMode),
      },
      { label: "Ring science", value: ringState.scienceReason, meta: ringOverrideMeta },
      { label: "Ring style", value: ringStyleDisplay.value, meta: ringStyleDisplay.meta },
      {
        label: "Ring style source",
        value: getRingStyleSourceLabel(ringAppearance.styleSource),
      },
      { label: "Ring type", value: m.display.ringType },
      { label: "Ring details", value: m.display.ringDetails },
      ...coupledContextItems.ringDetailItems,
    ];
    const systemDetailItems = [
      {
        label: "Host frame",
        value: m.hostFrame?.label || "Primary star",
        meta:
          m.hostFrame?.frameKind === "pair"
            ? "Circumbinary host"
            : m.hostFrame?.orbitFamilyKind === "single"
              ? "Single-star host"
              : "Circumstellar host",
      },
      {
        label: "Orbital Period",
        value: m.display.orbitalPeriod,
        meta: m.display.orbitalVelocity,
      },
      { label: "Insolation", value: m.display.insolation },
      { label: "Companion Flux", value: m.display.companionFlux },
      { label: "Flux Variability", value: m.display.fluxVariability },
      {
        label: "Dynamical Stability",
        value: m.display.dynamicalStability,
        meta:
          Array.isArray(m.orbital?.dynamicalStabilityNotes) &&
          m.orbital.dynamicalStabilityNotes.length
            ? m.orbital.dynamicalStabilityNotes.join(" ")
            : "",
      },
      {
        label: "Transit Depth",
        value: m.display.transitDepth,
        meta: m.display.transitProbability,
      },
      coupledContextItems.observabilityDetail,
      {
        label: "RV Semi-Amplitude",
        value: m.display.rvSemiAmplitude,
        meta: "Edge-on / transiting reference",
      },
      ...(m.display.peri
        ? [{ label: "Periapsis", value: `${m.display.peri} (${m.display.tempPeri})` }]
        : []),
      ...(m.display.apo
        ? [{ label: "Apoapsis", value: `${m.display.apo} (${m.display.tempApo})` }]
        : []),
      { label: "Orbital direction", value: m.display.orbitalDirection },
      { label: "Local days per year", value: m.display.localDaysPerYear },
      { label: "Nearest resonance", value: m.display.resonance },
      { label: "Hill sphere", value: m.display.hillSphere },
      { label: "Roche limit", value: m.display.rocheLimit },
      { label: "Chaotic zone", value: m.display.chaoticZone },
      {
        label: "Ring zone",
        value: `${fmt(m.gravity.ringZoneInnerKm, 0)}-${fmt(m.gravity.ringZoneOuterKm, 0)} km`,
      },
    ];
    const activityDetailItems = [
      {
        label: "Magnetic Field",
        value: m.display.magneticField,
        meta: m.display.magneticMorphology,
      },
      {
        label: "Magnetosphere",
        value: m.display.magnetosphere,
        meta: m.display.windCompression || "",
      },
      coupledContextItems.auroraDetail,
      { label: "Wind compression", value: m.display.windCompression || "Not evaluated" },
      { label: "Moon tidal heating", value: m.display.moonTidalHeating },
      { label: "Atmospheric sputtering", value: m.display.sputteringPlasma },
      { label: "Bands", value: m.display.bands },
      { label: "Wind speed", value: m.display.windSpeed },
      { label: "Mass loss", value: m.display.massLossRate },
      { label: "Evaporation", value: m.display.evaporationTimescale },
      { label: "Roche lobe", value: m.display.rocheLobeRadius },
      { label: "Jeans escape", value: m.display.jeansEscape },
      { label: "Tidal locking", value: m.display.tidalLocking },
      { label: "Circularisation", value: m.display.circularisation },
    ];
    const derivedDetails = createDerivedDetails(
      [
        {
          id: "gas-giant-details-identity",
          title: "Identity & Class",
          items: identityDetailItems,
        },
        {
          id: "gas-giant-details-physical",
          title: "Physical State",
          items: physicalDetailItems,
        },
        {
          id: "gas-giant-details-environment",
          title: "Environment",
          items: environmentDetailItems,
        },
        {
          id: "gas-giant-details-system",
          title: "System Context",
          items: systemDetailItems,
        },
        {
          id: "gas-giant-details-activity",
          title: "Activity & Radiation",
          items: activityDetailItems,
        },
      ],
      { title: "Derived Details" },
    );

    const longTermDynamicsSection = buildLongTermDynamicsSection(world, giant.id);
    bodyOutputsEl.replaceChildren();
    renderKpiSections(bodyOutputsEl, [
      { id: "gas-giant-summary", title: "Key Numbers", items: summaryItems },
      {
        id: "gas-giant-identity",
        title: "Identity & Class",
        density: "compact",
        items: identityItems,
      },
      {
        id: "gas-giant-physical",
        title: "Physical State",
        density: "compact",
        items: physicalItems,
      },
      {
        id: "gas-giant-environment",
        title: "Environment",
        density: "compact",
        items: environmentItems,
      },
      { id: "gas-giant-system", title: "System Context", density: "compact", items: systemItems },
      longTermDynamicsSection,
      {
        id: "gas-giant-activity",
        title: "Activity & Radiation",
        density: "compact",
        items: activityItems,
      },
    ]);
    renderPlanetResultSummary(
      bodyOutputsEl,
      buildGasGiantPlanetResultSummary({ giant, model: m, classValue }),
    );
    if (derivedDetails) bodyOutputsEl.append(derivedDetails);
    enableOutputSectionTabs(bodyOutputsEl, { label: "Planet output sections", includeAll: true });

    let gasCanvas = bodyOutputsEl.querySelector(".gg-preview-canvas");
    if (prevGasCanvas && gasCanvas && prevGasCanvas !== gasCanvas) {
      prevGasCanvas.dataset.style = derivedStyle;
      prevGasCanvas.dataset.rings = String(showRings);
      gasCanvas.replaceWith(prevGasCanvas);
      gasCanvas = prevGasCanvas;
    }
    if (gasCanvas) {
      celestialPreviewController.attach(gasCanvas, {
        bodyType: "gasGiant",
        name: giant.name || "Gas giant",
        recipeId: String(giant.appearanceRecipeId || ""),
        gasCalc: m,
        gasProfile,
        styleId: derivedStyle,
        ringAppearance,
        ringStyleId: ringAppearance.ringStyleId,
        ringMode: ringState.ringMode,
        showRings,
        rotationPeriodHours: Number(m.inputs?.rotationPeriodHours) || 10,
        visualDescriptor,
        visualOverrideSignature,
        visualRenderSignature,
      });
    } else {
      celestialPreviewController.detach();
    }
  }
  /* ── Gas giant recipe picker modal ─────────────────────────────── */

  const extractedPlanetGuidedFlows = createPlanetGuidedFlows({
    overlayClosers,
    buildGasGiantGuidedContext,
    buildRockyGuidedContext,
    getGasGiantGuidedSessionTarget,
    getRockyGuidedSessionTarget,
    buildPlanetGoalTextAssist,
    buildGasGiantGoalQuestionValues,
    buildRockyGoalQuestionValues,
    buildGasGiantGoalStatus,
    buildRockyGoalStatus,
    setGasGiantGoalDraftValue,
    setRockyGoalDraftValue,
    applyGasGiantGuidedRecommendation: (recommendation, options = {}) =>
      applyGasGiantGuidedRecommendation(recommendation, { ...options, render }),
    applyRockyGuidedRecommendation: (recommendation, options = {}) =>
      applyRockyGuidedRecommendation(recommendation, { ...options, render }),
    showPlanetNotice,
  });

  function openGasGiantGuidedQuickPicker(restoredSession = null, dedicatedBaseHash = "") {
    extractedPlanetGuidedFlows.openGasGiantGuidedQuickPicker(restoredSession, dedicatedBaseHash);
  }

  function openGasGiantGuidedFlow(restoredSession = null, dedicatedBaseHash = "") {
    extractedPlanetGuidedFlows.openGasGiantGuidedFlow(restoredSession, dedicatedBaseHash);
  }

  function openRockyGuidedQuickPicker(restoredSession = null, dedicatedBaseHash = "") {
    extractedPlanetGuidedFlows.openRockyGuidedQuickPicker(restoredSession, dedicatedBaseHash);
  }

  function openRockyGuidedFlow(restoredSession = null, dedicatedBaseHash = "") {
    extractedPlanetGuidedFlows.openRockyGuidedFlow(restoredSession, dedicatedBaseHash);
  }

  function openGgRecipePicker(onSelect) {
    extractedPlanetGuidedFlows.openGasGiantRecipePicker(onSelect);
  }

  /* ── Rocky recipe picker modal ─────────────────────────────────── */

  function openRecipePicker(onSelect) {
    extractedPlanetGuidedFlows.openRockyRecipePicker(onSelect);
  }

  /* ── Moons section ──────────────────────────────────────────────── */

  function renderMoons(world, bodyType, bodyId) {
    const moons = listMoons(world)
      .filter((m) => m.planetId === bodyId)
      .sort((a, b) => {
        const aa = Number(a?.inputs?.semiMajorAxisKm);
        const bb = Number(b?.inputs?.semiMajorAxisKm);
        return (Number.isFinite(aa) ? aa : Infinity) - (Number.isFinite(bb) ? bb : Infinity);
      });
    renderMoonSection(bodyMoonsEl, {
      bodyType,
      bodyId,
      moons,
      moonsTip: TIP_LABEL["Moons"],
    });
  }

  /* ── Actions (presets/reset) ────────────────────────────────────── */

  function renderActions(bodyType) {
    if (bodyType === "planet") {
      renderBodyActionButtons(bodyActionsEl, [
        { id: "btn-earth", label: "Earth-ish Preset" },
        { id: "btn-pluto", label: "Pluto-ish Preset" },
        { id: "btn-reset", label: "Reset to Defaults" },
      ]);
      bodyActionsEl.querySelector("#btn-earth").addEventListener("click", () => {
        const w = loadWorld();
        const currentRingMode = normalizeRingMode(
          w.planets.byId?.[w.planets.selectedId]?.inputs?.ringMode,
        );
        const currentRingStyleId = normalizeRingStyleId(
          w.planets.byId?.[w.planets.selectedId]?.inputs?.ringStyleId,
        );
        const inputs = {
          name: "Earth",
          massEarth: 1.0,
          cmfPct: 33.0,
          wmfPct: 0.02,
          axialTiltDeg: 23.44,
          albedoBond: 0.306,
          greenhouseEffect: 0,
          greenhouseMode: "core",
          observerHeightM: 1.75,
          rotationPeriodHours: 23.934,
          semiMajorAxisAu: 1.0,
          eccentricity: 0.0167,
          inclinationDeg: 0.0,
          longitudeOfPeriapsisDeg: 102.937,
          subsolarLongitudeDeg: 0.0,
          pressureAtm: 1.0,
          o2Pct: 20.95,
          co2Pct: 0.04,
          arPct: 0.93,
          h2oPct: 0.4,
          ch4Pct: 0.00018,
          radioisotopeAbundance: 1.0,
          radioisotopeMode: "simple",
          u238Abundance: 1.0,
          u235Abundance: 1.0,
          th232Abundance: 1.0,
          k40Abundance: 1.0,
          ringMode: currentRingMode,
          ringStyleId: currentRingStyleId,
        };
        updatePlanet(w.planets.selectedId, { name: "Earth", inputs });
        updateWorld({ planet: inputs });
        scheduleRender();
      });
      bodyActionsEl.querySelector("#btn-pluto").addEventListener("click", () => {
        const w = loadWorld();
        const currentRingMode = normalizeRingMode(
          w.planets.byId?.[w.planets.selectedId]?.inputs?.ringMode,
        );
        const currentRingStyleId = normalizeRingStyleId(
          w.planets.byId?.[w.planets.selectedId]?.inputs?.ringStyleId,
        );
        const inputs = {
          name: "Pluto",
          massEarth: 0.0022,
          cmfPct: 32.0,
          wmfPct: 30.0,
          axialTiltDeg: 122.5,
          albedoBond: 0.72,
          greenhouseEffect: 0,
          observerHeightM: 1.75,
          rotationPeriodHours: 153.3,
          semiMajorAxisAu: 39.48,
          eccentricity: 0.2488,
          inclinationDeg: 17.16,
          longitudeOfPeriapsisDeg: 113.8,
          subsolarLongitudeDeg: 0.0,
          pressureAtm: 0.00001,
          o2Pct: 0,
          co2Pct: 0,
          arPct: 0,
          h2oPct: 0,
          ch4Pct: 5,
          h2Pct: 0,
          hePct: 0,
          so2Pct: 0,
          nh3Pct: 0,
          radioisotopeAbundance: null,
          radioisotopeMode: "simple",
          u238Abundance: null,
          u235Abundance: null,
          th232Abundance: null,
          k40Abundance: null,
          ringMode: currentRingMode,
          ringStyleId: currentRingStyleId,
        };
        updatePlanet(w.planets.selectedId, { name: "Pluto", inputs });
        updateWorld({ planet: inputs });
        scheduleRender();
      });
      bodyActionsEl.querySelector("#btn-reset").addEventListener("click", () => {
        const w = loadWorld();
        const currentRingStyleId = normalizeRingStyleId(
          w.planets.byId?.[w.planets.selectedId]?.inputs?.ringStyleId,
        );
        const inputs = {
          name: "New Planet",
          massEarth: 0.52,
          cmfPct: 66.0,
          axialTiltDeg: 23.5,
          albedoBond: 0.05,
          greenhouseEffect: 1.65,
          observerHeightM: 1.75,
          rotationPeriodHours: 23.2,
          semiMajorAxisAu: 0.95,
          eccentricity: 0.0167,
          inclinationDeg: 0.0,
          longitudeOfPeriapsisDeg: 283.0,
          subsolarLongitudeDeg: 0.0,
          pressureAtm: 1.0,
          o2Pct: 20.95,
          co2Pct: 0.04,
          arPct: 0.93,
          ringMode: RING_MODE_AUTO,
          ringStyleId: currentRingStyleId,
        };
        updatePlanet(w.planets.selectedId, { name: "New Planet", inputs });
        updateWorld({ planet: inputs });
        scheduleRender();
      });
    } else {
      renderBodyActionButtons(bodyActionsEl, []);
    }
  }

  /* ── Main render ────────────────────────────────────────────────── */

  function render(outputsOnly = false) {
    if (isRendering) return;
    isRendering = true;
    try {
      const world = loadWorld();
      const bodyType = world.selectedBodyType || "planet";
      const homeSystemContext = buildPlanetHomeSystemContext(world);
      const primaryStar = getProjectedPrimaryStar(world);
      const pSov = getStarOverrides(primaryStar);
      const pStarCalc = calcStar({
        massMsol: Number(primaryStar.massMsol),
        ageGyr: Number(primaryStar.ageGyr) || 4.6,
        radiusRsolOverride: pSov.r,
        luminosityLsolOverride: pSov.l,
        tempKOverride: pSov.t,
        evolutionMode: pSov.ev,
      });
      const sysModel = calcSystem({
        starMassMsol: Number(primaryStar.massMsol),
        spacingFactor: Number(world.system.spacingFactor),
        orbit1Au: Number(world.system.orbit1Au),
        luminosityLsolOverride: pStarCalc.luminosityLsol,
        radiusRsolOverride: pStarCalc.radiusRsol,
      });

      if (!outputsOnly) {
        const selectedBody =
          bodyType === "gasGiant" ? getSelectedGasGiant(world) : getSelectedPlanet(world);
        const selectedSolveContext = selectedBody
          ? resolvePlanetPageHostFrameContext(world, selectedBody, sysModel, homeSystemContext)
          : resolvePlanetPageHostFrameContext(world, null, sysModel, homeSystemContext);
        starInfoEl.textContent = buildSelectedBodyContextReadout(selectedSolveContext);

        // Body selector
        populateBodySelector(world);
        syncRockyCreationEntry(world, bodyType);
        syncGasGiantCreationEntry(world, bodyType);
      }
      const selectedClassificationSummary = renderSelectedBodyClassification(
        world,
        sysModel,
        homeSystemContext,
      );

      if (bodyType === "gasGiant") {
        const giant = getSelectedGasGiant(world);
        const bodyId = world.system?.gasGiants?.selectedId;
        if (!outputsOnly) renderGasGiantInputs(world, giant, sysModel);
        renderGasGiantOutputs(world, giant, sysModel);
        if (!outputsOnly) renderMoons(world, "gasGiant", bodyId);
      } else {
        const planet = getSelectedPlanet(world);
        const bodyId = world.planets?.selectedId;
        if (!outputsOnly) renderRockyInputs(world, planet, sysModel);
        const selectedUnifiedBody = getSelectedPlanetaryBodyModel(world);
        if (selectedClassificationSummary?.solverFamily === "volatile") {
          renderVolatileOutputs(world, selectedUnifiedBody, sysModel);
        } else {
          renderRockyOutputs(world, selectedClassificationSummary);
        }
        if (!outputsOnly) renderMoons(world, "planet", bodyId);
      }

      if (!outputsOnly) {
        renderActions(bodyType);
        attachTooltips(wrap);
      }
    } finally {
      isRendering = false;
    }
  }

  /* ── Body selector events ───────────────────────────────────────── */

  bodySel.addEventListener("change", () => {
    const val = bodySel.value;
    const [type, id] = val.split(":");
    if (type === "gasGiant") {
      selectGasGiant(id);
    } else {
      selectPlanet(id);
      selectBodyType("planet");
    }
    render();
  });

  bodySearchEl?.addEventListener("input", () => {
    populateBodySelector(loadWorld());
  });

  rockyCreateQuickBtn?.addEventListener("click", () => {
    openRockyGuidedQuickPicker();
  });
  rockyCreateGuidedBtn?.addEventListener("click", () => {
    openRockyGuidedFlow();
  });
  rockyCreateRecipesBtn?.addEventListener("click", () => {
    openRecipePicker((recipe) => {
      const w = loadWorld();
      const pid = w.planets.selectedId;
      const nextInputs = {
        ...recipe.apply,
        appearanceRecipeId: recipe.id,
        ringMode: normalizeRingMode(w.planets.byId?.[pid]?.inputs?.ringMode),
        ringStyleId: normalizeRingStyleId(w.planets.byId?.[pid]?.inputs?.ringStyleId),
      };
      applyRockyPresetInputs(nextInputs, {
        noticeLabel: recipe.label || "Rocky recipe",
        render,
      });
    });
  });
  gasGiantCreateQuickBtn?.addEventListener("click", () => {
    openGasGiantGuidedQuickPicker();
  });
  gasGiantCreateGuidedBtn?.addEventListener("click", () => {
    openGasGiantGuidedFlow();
  });
  gasGiantCreateRecipesBtn?.addEventListener("click", () => {
    openGgRecipePicker((recipe) => {
      const w = loadWorld();
      const selectedGasGiant = getSelectedGasGiant(w);
      if (!selectedGasGiant) return;
      applyGasGiantPresetInputs(
        buildGasGiantRecipeApplyInputs(recipe.apply, recipe.id, selectedGasGiant),
        {
          noticeLabel: recipe.label || "Gas giant recipe",
          render,
        },
      );
    });
  });

  function createNewRockyPlanet({
    openGuided = false,
    authoringIntent = "rocky",
    name = "New Planet",
    starterInputs = {},
  } = {}) {
    const w = loadWorld();
    const homeSystemContext = buildPlanetHomeSystemContext(w);
    const selectedPlanet = getSelectedPlanet(w);
    const defaultHostFrameId =
      homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || null;
    const baseInputs = getSelectedPlanet(w)?.inputs || w.planet;
    createPlanetFromInputs(
      {
        ...baseInputs,
        ...starterInputs,
        name,
        authoringIntent,
        hostFrameId: normalizeHostFrameId(selectedPlanet?.hostFrameId, defaultHostFrameId),
        ringMode: RING_MODE_AUTO,
        ringStyleId: RING_STYLE_AUTO,
      },
      { name },
    );
    selectBodyType("planet");
    render();
    if (openGuided) openRockyGuidedFlow();
  }

  function createNewVolatileBody() {
    createNewRockyPlanet({
      authoringIntent: "volatile",
      name: "Volatile world",
      starterInputs: {
        massEarth: 5,
        cmfPct: 20,
        wmfPct: 25,
        hHeEnvelopeMassPct: 1,
        albedoBond: 0.45,
        greenhouseMode: "core",
        greenhouseEffect: 0,
        pressureAtm: 8,
        h2Pct: 12,
        hePct: 4,
        o2Pct: 0,
        co2Pct: 2,
        arPct: 0.2,
        h2oPct: 0.5,
        ch4Pct: 1,
      },
    });
  }

  function createNewGasGiant({
    authoringIntent = "gasGiant",
    namePrefix = "Gas giant",
    companionClass = GIANT_COMPANION_CLASS_GAS_GIANT,
    massMjup = null,
    radiusRj = null,
    style = "jupiter",
  } = {}) {
    const w = loadWorld();
    const gasGiants = listSystemGasGiants(w);
    const homeSystemContext = buildPlanetHomeSystemContext(w);
    const activeBody =
      (w.selectedBodyType || "planet") === "gasGiant"
        ? getSelectedGasGiant(w)
        : getSelectedPlanet(w);
    const activeSolveContext = activeBody
      ? resolvePlanetPageHostFrameContext(w, activeBody, null, homeSystemContext)
      : resolvePlanetPageHostFrameContext(w, null, null, homeSystemContext);
    const hostFrameId = normalizeHostFrameId(
      activeSolveContext?.hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const sysModel = activeSolveContext?.hostFrame?.system || homeSystemContext?.primarySystem;
    const planets = filterBodiesForHostFrame(
      listPlanets(w),
      hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const gasGiantsInFrame = filterBodiesForHostFrame(
      gasGiants,
      hostFrameId,
      homeSystemContext?.defaultHostFrameId,
    );
    const planetSlots = new Set();
    for (const p of planets) {
      if (p.slotIndex != null && p.slotIndex >= 1 && p.slotIndex <= 20)
        planetSlots.add(p.slotIndex);
    }
    const usedSlots = new Set([...planetSlots]);
    for (const g of gasGiantsInFrame) {
      if (g.slotIndex) usedSlots.add(g.slotIndex);
    }
    const maxAu = gasGiantsInFrame.length
      ? Math.max(...gasGiantsInFrame.map((g) => Number(g.au) || 0))
      : 0;
    const targetAu = maxAu > 0 ? maxAu * 1.5 : sysModel.frostLineAu * 1.1;
    const slot = findNearestSlot(targetAu, sysModel.orbitsAu, usedSlots);
    const newId = `gg${Math.random().toString(36).slice(2, 9)}`;
    const now = [...gasGiants];
    now.push({
      id: newId,
      name: `${namePrefix} ${gasGiants.length + 1}`,
      hostFrameId,
      au: slot ? sysModel.orbitsAu[slot - 1] : Number(targetAu.toFixed(2)),
      slotIndex: slot,
      authoringIntent,
      companionClass,
      style,
      ringMode: RING_MODE_AUTO,
      ringStyleId: RING_STYLE_AUTO,
      radiusRj: radiusRj ?? randomGasGiantRadiusRj(),
      massMjup,
      rotationPeriodHours: null,
    });
    saveSystemGasGiants(now);
    selectGasGiant(newId);
    render();
  }

  function createNewBodyFromIntent(intent) {
    switch (intent) {
      case "volatile":
        createNewVolatileBody();
        break;
      case "iceGiant":
        createNewGasGiant({
          authoringIntent: "iceGiant",
          namePrefix: "Ice giant",
          massMjup: 0.054,
          radiusRj: 0.36,
          style: "neptune",
        });
        break;
      case "gasGiant":
        createNewGasGiant({
          authoringIntent: "gasGiant",
          massMjup: 1,
          radiusRj: 1,
          style: "jupiter",
        });
        break;
      case "substellar":
        createNewGasGiant({
          authoringIntent: "substellar",
          namePrefix: "Brown dwarf",
          companionClass: GIANT_COMPANION_CLASS_BROWN_DWARF,
          massMjup: 20,
          radiusRj: 1,
          style: "brown-dwarf-t",
        });
        break;
      case "rocky":
      default:
        createNewRockyPlanet({
          authoringIntent: "rocky",
          name: "Rocky world",
        });
        break;
    }
  }

  newBodyBtn?.addEventListener("click", () => {
    createNewBodyFromIntent(newBodyIntentEl?.value || "rocky");
  });

  wrap.querySelector("#newRockyPlanet").addEventListener("click", () => {
    createNewRockyPlanet();
  });

  wrap.querySelector("#newGasGiant").addEventListener("click", () => {
    createNewGasGiant();
  });

  wrap.querySelector("#deleteBody").addEventListener("click", async () => {
    const w = loadWorld();
    const bodyType = w.selectedBodyType || "planet";
    if (bodyType === "gasGiant") {
      const gid = w.system?.gasGiants?.selectedId;
      if (!gid) return;
      const plan = planDeleteGasGiant(gid, w);
      if (!plan) return;
      const confirmed = await confirmDestructiveAction(plan);
      if (!confirmed) return;
      deleteGasGiant(gid);
    } else {
      const pid = w.planets.selectedId;
      if (w.planets.order.length <= 1) return;
      const plan = planDeletePlanet(pid, w);
      if (!plan) return;
      const confirmed = await confirmDestructiveAction(plan);
      if (!confirmed) return;
      deletePlanet(pid);
    }
    render();
  });

  /* ── Init ───────────────────────────────────────────────────────── */

  if (guidedRoute?.dedicated && guidedRoute.objectType === "gasGiant") {
    selectBodyType("gasGiant");
  } else if (guidedRoute?.dedicated && guidedRoute.objectType === "rockyPlanet") {
    selectBodyType("planet");
  }

  render();

  const restoredBodyType = loadWorld().selectedBodyType || "planet";
  if (guidedRoute?.dedicated && guidedRoute.objectType === "gasGiant") {
    const restoredGasGiantSession = loadGuidedSession("gasGiant", getGasGiantGuidedSessionTarget());
    if (guidedRoute.uxMode === "quick") {
      openGasGiantGuidedQuickPicker(
        restoredGasGiantSession?.uxMode === "quick" ? restoredGasGiantSession : null,
        guidedRoute.baseHash || "",
      );
    } else {
      openGasGiantGuidedFlow(
        restoredGasGiantSession?.uxMode === "guided" ? restoredGasGiantSession : null,
        guidedRoute.baseHash || "",
      );
    }
  } else if (guidedRoute?.dedicated && guidedRoute.objectType === "rockyPlanet") {
    const restoredRockySession = loadGuidedSession("rockyPlanet", getRockyGuidedSessionTarget());
    if (guidedRoute.uxMode === "quick") {
      openRockyGuidedQuickPicker(
        restoredRockySession?.uxMode === "quick" ? restoredRockySession : null,
        guidedRoute.baseHash || "",
      );
    } else {
      openRockyGuidedFlow(
        restoredRockySession?.uxMode === "guided" ? restoredRockySession : null,
        guidedRoute.baseHash || "",
      );
    }
  } else if (restoredBodyType === "gasGiant") {
    const restoredGasGiantSession = loadGuidedSession("gasGiant", getGasGiantGuidedSessionTarget());
    if (restoredGasGiantSession?.uxMode === "quick") {
      openGasGiantGuidedQuickPicker(restoredGasGiantSession);
    } else if (restoredGasGiantSession) {
      openGasGiantGuidedFlow(restoredGasGiantSession);
    }
  } else {
    const restoredRockySession = loadGuidedSession("rockyPlanet", getRockyGuidedSessionTarget());
    if (restoredRockySession?.uxMode === "quick") {
      openRockyGuidedQuickPicker(restoredRockySession);
    } else if (restoredRockySession) {
      openRockyGuidedFlow(restoredRockySession);
    }
  }

  return () => {
    overlayClosers.forEach((closeOverlay) => {
      try {
        closeOverlay();
      } catch {
        // Ignore close failures during page teardown.
      }
    });
    if (noticeTimer) clearTimeout(noticeTimer);
    previewCleanupObserver.disconnect();
    celestialPreviewController.dispose();
  };
}
