import { loadWorld } from "./store.js";
import { calcLagrangePoints } from "../engine/lagrange.js";
import { attachTooltips, tipAttr, tipIcon } from "./tooltip.js";
import { makeTimestampToken } from "./canvasExport.js";
import { buildClusterSnapshot } from "./vizClusterRenderer.js";
import { getClusterObjectVisual } from "./clusterObjectVisuals.js";
import {
  VISUALIZER_TIP_LABEL as TIP_LABEL,
  VISUALIZER_TUTORIAL_STEPS as TUTORIAL_STEPS,
} from "./visualizer/constants.js";
import {
  clusterClassLabel,
  drawClusterCompanions,
  drawClusterStarfield,
  drawStarDot,
} from "./visualizer/clusterOverlay.js";
import {
  computeAxisDirection as computeAxisDirectionForCamera,
  computeSpinAngleRad as computeSpinAngleRadForState,
  crossVec3,
  normalizeAxialTiltDeg,
  normalizeVec3,
  orbitOffsetToScreen as orbitOffsetToScreenForCamera,
  orbitPointToScreen as orbitPointToScreenForCamera,
  parseHexColorNumber,
  projectOrbitOffset as projectOrbitOffsetForCamera,
  projectDirectionToScreen as projectDirectionToScreenForCamera,
  solveKeplerEquation,
} from "./visualizer/projectionMath.js";
import {
  applyInertia as applyCameraInertia,
  applyResetEasing as applyCameraResetEasing,
  applyZoomInterpolation as applyCameraZoomInterpolation,
  computeCometPlacement as computeSystemCometPlacement,
  computeGasGiantPlacement as computeSystemGasGiantPlacement,
  computePlanetPlacement as computeSystemPlanetPlacement,
  desiredFocusZoom as computeDesiredFocusZoom,
  easeFocusZoom as applyCameraFocusZoom,
  hitTestBody as hitTestBodyRegion,
  hitTestLabelUi as hitTestLabelRegion,
  killInertia as stopCameraInertia,
  syncFocusPan as syncFocusedPan,
} from "./visualizer/focusCamera.js";
import { createNativeLabelLayer } from "./visualizer/nativeLabelLayer.js";
import { createNativeSystemLayer } from "./visualizer/nativeSystemLayer.js";
import { buildProjectedCometOrbitDashRuns } from "./visualizer/cometOrbitPath.js";
import {
  buildCometParticleLayout,
  buildCometTailGeometry,
  hexToColorNumber,
  resolveCometTailDirections,
} from "./cometAppearance.js";
import { computeBinaryPairOrbitalState } from "./visualizer/multistarOrbit.js";
import {
  getStarSurfaceSeed,
  getStarVisualStyle,
  hexToRgba,
  mixHex,
  paintStarSurfaceTexture,
} from "./visualizer/starSurface.js";
import {
  buildVisualizerSnapshot,
  getFrameMetrics as getSnapshotFrameMetrics,
  mapAuToPx as mapSnapshotAuToPx,
} from "./visualizer/snapshotModel.js";
import { getFocusedBodySummary, getOverviewSelectionSummary } from "./visualizer/focusSummary.js";
import { createStarActivityRuntime, flareEnergyNorm } from "./visualizer/starActivityRuntime.js";
import { createBodyMeshService, vizBodyCacheKey } from "./visualizer/bodyMeshService.js";
import { bindVisualizerInputBindings } from "./visualizer/inputBindings.js";
import { loadThreeCore } from "./threeBridge2d.js";
import {
  EARTH_PER_MSOL,
  EARTH_RADIUS_KM,
  JUPITER_RADIUS_KM,
  MJUP_PER_MSOL,
  MOON_LABEL_FADE,
  MOON_LABEL_MIN_ZOOM,
  PHYS_VIS_THRESHOLD_PX,
  applyRepresentativeBodyRadiusConstraints,
  computeDebrisParticleTarget,
  dbg,
  debrisKeepChance,
  hashUnit,
  physicalRadiusToPx,
  representativeGasBaseRadiusPx,
  representativeMoonR,
  representativePlanetBaseRadiusPx,
  sampleDebrisAu,
} from "./visualizer/scaleMath.js";
import { clamp } from "../engine/utils.js";
import { createElement, replaceChildren } from "./domHelpers.js";
import { createTutorial } from "./tutorial.js";

export function initVisualiserPage(root, options = {}) {
  root.innerHTML = `
    <div class="page">
      <div class="viz-layout">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title"><span class="ws-icon icon--visualiser" aria-hidden="true"></span><span id="viz-title">System Visualiser</span></h1>
            <button id="vizTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
            <div class="viz-canvas-actions">
              <button id="btn-controls" type="button" class="small">${tipIcon(TIP_LABEL["Controls"] || "")} Controls &#x25BE;</button>
              <button id="btn-reset-view" type="button" class="small" disabled>${tipIcon(TIP_LABEL["Reset view"] || "")} Reset view</button>
              <button id="btn-fullscreen" type="button" class="small">${tipIcon(TIP_LABEL["Fullscreen"] || "")} Fullscreen</button>
              <button id="btn-export-image" type="button" class="small">${tipIcon(TIP_LABEL["Download image"] || "")} Download image</button>
              <button id="btn-export-gif" type="button" class="small" disabled>${tipIcon(TIP_LABEL["Download GIF"] || "")} Download GIF</button>
              <button id="btn-help-overlay" type="button" class="small" aria-label="Controls help" ${tipAttr(TIP_LABEL["Controls help"] || "")}>?</button>
            </div>
          </div>

          <div class="viz-canvas-area">
          <div id="viz-controls-dropdown" class="viz-controls-dropdown" style="display:none">
            <div id="viz-controls-system">
            <div class="viz-controls-dropdown__row">
              <button id="btn-refresh" type="button" class="small">Refresh</button>
              <button id="btn-play" type="button" class="small">Play</button>
              <div class="viz-speed">
                <span class="viz-speed__label">Speed ${tipIcon(TIP_LABEL["Speed"] || "")}</span>
                <input id="rng-speed" type="range" min="0" max="4" step="1" value="1" />
                <span id="txt-speed" class="viz-speed__value">0.5 d/s</span>
              </div>
            </div>

            <div id="view-mode-row" class="viz-controls-dropdown__row" style="display:none">
              <div class="pill-toggle-wrap" style="width:100%; margin-bottom:0">
                <div class="viz-view-mode">
                  <span class="viz-speed__label">View mode ${tipIcon(TIP_LABEL["View mode"] || "")}</span>
                  <div class="physics-duo-toggle" data-toggle="view-mode">
                    <input type="radio" name="vizViewMode" id="vizViewLocal" value="local" checked />
                    <label for="vizViewLocal">Local Frame</label>
                    <input type="radio" name="vizViewMode" id="vizViewOverview" value="overview" />
                    <label for="vizViewOverview">System Overview</label>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            <div id="body-scale-row" class="viz-controls-dropdown__row">
              <div class="viz-speed">
                <span class="viz-speed__label">Body scale ${tipIcon(TIP_LABEL["Body scale"] || "")}</span>
                <input id="rng-body-scale" type="range" min="25" max="100" step="1" value="40" />
                <span id="txt-body-scale" class="viz-speed__value">40%</span>
              </div>
            </div>

            <div id="host-frame-row" class="viz-controls-dropdown__row" style="display:none">
              <div class="viz-speed" style="width:100%">
                <span class="viz-speed__label"><span id="viz-host-frame-label">Host frame</span> <span id="viz-host-frame-tip">${tipIcon(TIP_LABEL["Host frame"] || "")}</span></span>
                <select id="viz-host-frame" aria-label="Visualizer host frame"></select>
              </div>
            </div>
            <div id="host-frame-hint-row" class="viz-controls-dropdown__row" style="display:none">
              <div id="viz-host-frame-hint" class="hint"></div>
            </div>

            <div class="viz-controls-dropdown__row viz-controls-dropdown__toggles">
              <div class="pill-toggle-wrap">
                <div class="physics-duo-toggle" data-toggle="distance">
                  <input type="radio" name="vizDistanceScale" id="vizDistLinear" value="linear" checked />
                  <label for="vizDistLinear">Linear scale</label>
                  <input type="radio" name="vizDistanceScale" id="vizDistLog" value="log" />
                  <label for="vizDistLog">Logarithmic scale</label>
                  <span></span>
                </div>
                ${tipIcon(TIP_LABEL["Logarithmic scale"] || "")}
              </div>
              <div class="pill-toggle-wrap">
                <div class="physics-duo-toggle" data-toggle="size">
                  <input type="radio" name="vizSizeScale" id="vizSizeRep" value="representative" checked />
                  <label for="vizSizeRep">Representative size</label>
                  <input type="radio" name="vizSizeScale" id="vizSizePhysical" value="physical" />
                  <label for="vizSizePhysical">1:1 size</label>
                  <span></span>
                </div>
                ${tipIcon(TIP_LABEL["Physical size scale"] || "")}
              </div>
            </div>

            <div class="viz-controls-dropdown__row viz-controls-dropdown__checks">
              <label class="viz-check"><input id="chk-labels" type="checkbox" checked /><span>Labels ${tipIcon(TIP_LABEL["Labels"] || "")}</span></label>
              <label class="viz-check"><input id="chk-label-leaders" type="checkbox" checked /><span>Leader lines ${tipIcon(TIP_LABEL["Label leader lines"] || "")}</span></label>
              <label class="viz-check"><input id="chk-moons" type="checkbox" checked /><span>Moons ${tipIcon(TIP_LABEL["Moons"] || "")}</span></label>
              <label class="viz-check"><input id="chk-orbits" type="checkbox" checked /><span>Orbits ${tipIcon(TIP_LABEL["Orbits"] || "")}</span></label>
              <label class="viz-check"><input id="chk-hz" type="checkbox" checked /><span>Habitable zone ${tipIcon(TIP_LABEL["Habitable zone"] || "")}</span></label>
              <label class="viz-check"><input id="chk-debris" type="checkbox" checked /><span>Debris disks ${tipIcon(TIP_LABEL["Debris disks"] || "")}</span></label>
              <label class="viz-check"><input id="chk-comets" type="checkbox" checked /><span>Comets ${tipIcon(TIP_LABEL["Comets"] || "")}</span></label>
              <label class="viz-check"><input id="chk-eccentric" type="checkbox" /><span>Eccentric orbits ${tipIcon(TIP_LABEL["Eccentric orbits"] || "")}</span></label>
              <label class="viz-check"><input id="chk-pe-ap" type="checkbox" /><span>Pe / Ap markers ${tipIcon(TIP_LABEL["Pe / Ap markers"] || "")}</span></label>
              <label class="viz-check"><input id="chk-hill" type="checkbox" /><span>Hill spheres ${tipIcon(TIP_LABEL["Hill spheres"] || "")}</span></label>
              <label class="viz-check"><input id="chk-lagrange" type="checkbox" /><span>Lagrange points ${tipIcon(TIP_LABEL["Lagrange points"] || "")}</span></label>
              <label class="viz-check"><input id="chk-frost" type="checkbox" checked /><span>Frost line ${tipIcon(TIP_LABEL["Frost line"] || "")}</span></label>
              <label class="viz-check"><input id="chk-distances" type="checkbox" checked /><span>Distances ${tipIcon(TIP_LABEL["Distances"] || "")}</span></label>
              <label class="viz-check"><input id="chk-grid" type="checkbox" /><span>AU grid ${tipIcon(TIP_LABEL["AU grid"] || "")}</span></label>
              <label class="viz-check"><input id="chk-rotation" type="checkbox" checked /><span>Rotation ${tipIcon(TIP_LABEL["Rotation"] || "")}</span></label>
              <label class="viz-check"><input id="chk-axial-tilt" type="checkbox" checked /><span>Axial tilt helpers ${tipIcon(TIP_LABEL["Axial tilt helpers"] || "")}</span></label>
              <label class="viz-check"><input id="chk-multistar-info" type="checkbox" checked /><span>Multistar info ${tipIcon(TIP_LABEL["Multistar info"] || "")}</span></label>
              <label class="viz-check"><input id="chk-click-focus-bodies" type="checkbox" checked /><span>Click zoom bodies ${tipIcon(TIP_LABEL["Click zoom bodies"] || "")}</span></label>
              <label class="viz-check"><input id="chk-click-focus-star" type="checkbox" checked /><span>Click zoom star ${tipIcon(TIP_LABEL["Click zoom star"] || "")}</span></label>
              <label class="viz-check"><input id="chk-debug" type="checkbox" /><span>Debug ${tipIcon(TIP_LABEL["Debug"] || "")}</span></label>
            </div>

            <div class="viz-controls-dropdown__row">
              <div class="hint">Left-drag to pan (orbit when focused), right-drag to rotate, scroll to zoom. Click a body to center, double-click to zoom in. Esc releases focus. Press <b>?</b> for full controls.</div>
            </div>
            </div>

            <div id="viz-controls-cluster" style="display:none">
            <div class="viz-controls-dropdown__row">
              <button id="btn-cluster-refresh" type="button" class="small">Refresh</button>
              <button id="btn-cluster-play" type="button" class="small">Play</button>
              <div class="viz-speed">
                <span class="viz-speed__label">Speed ${tipIcon(TIP_LABEL["Cluster Speed"] || "")}</span>
                <input id="rng-cluster-speed" type="range" min="0" max="4" step="1" value="1" />
                <span id="txt-cluster-speed" class="viz-speed__value">0.5x</span>
              </div>
            </div>

            <div class="viz-controls-dropdown__row viz-controls-dropdown__toggles">
              <div class="pill-toggle-wrap">
                <div class="physics-duo-toggle" data-toggle="bearing">
                  <input type="radio" name="clusterBearingUnit" id="clusterVizDegrees" value="degrees" checked />
                  <label for="clusterVizDegrees">Degrees</label>
                  <input type="radio" name="clusterBearingUnit" id="clusterVizMils" value="mils" />
                  <label for="clusterVizMils">Mils</label>
                  <span></span>
                </div>
                ${tipIcon(TIP_LABEL["Bearing Units"] || "")}
              </div>
            </div>

            <div class="viz-controls-dropdown__row viz-controls-dropdown__checks">
              <label class="viz-check"><input id="chk-cluster-labels" type="checkbox" checked /><span>Labels ${tipIcon(TIP_LABEL["Cluster Labels"] || "")}</span></label>
              <label class="viz-check"><input id="chk-cluster-links" type="checkbox" checked /><span>Links ${tipIcon(TIP_LABEL["Links"] || "")}</span></label>
              <label class="viz-check"><input id="chk-cluster-axes" type="checkbox" checked /><span>Axes ${tipIcon(TIP_LABEL["Axes"] || "")}</span></label>
              <label class="viz-check"><input id="chk-cluster-grid" type="checkbox" checked /><span>Range/Bearing Grid ${tipIcon(TIP_LABEL["Range/Bearing Grid"] || "")}</span></label>
              <label class="viz-check"><input id="chk-cluster-stars" type="checkbox" checked /><span>Starfield ${tipIcon(TIP_LABEL["Starfield"] || "")}</span></label>
            </div>

            <div class="viz-controls-dropdown__row">
              <div class="hint">Drag to rotate, scroll to zoom. Touch: 1-finger rotate, pinch to zoom. Press <b>?</b> for full controls.</div>
            </div>
            </div>
          </div>

          <div class="viz-wrap">
            <canvas id="viz" width="1200" height="600"></canvas>
            <canvas id="viz-overlay" width="1200" height="600"></canvas>
          </div>

          <div id="viz-native-transition" class="viz-native-transition" aria-hidden="true" style="display:none">
            <div id="viz-native-transition-label" class="viz-native-transition__label"></div>
            <div class="viz-native-transition__track">
              <div id="viz-native-transition-fill" class="viz-native-transition__fill"></div>
            </div>
          </div>

          <div id="viz-offscale-note" class="viz-offscale-note" style="display:none" aria-hidden="true" aria-live="polite"></div>

          <div id="viz-toast" class="viz-toast" style="display:none">
            Tip: Zoom out past the system to view your local stellar neighbourhood
            <button id="viz-toast-close" class="viz-toast__close" type="button" aria-label="Dismiss">&times;</button>
          </div>

          <div id="viz-help-overlay" class="viz-help-overlay" style="display:none" aria-hidden="true">
            <div class="viz-help-overlay__content">
              <button id="viz-help-close" class="viz-help-overlay__close" type="button" aria-label="Close">&times;</button>
              <h3 class="viz-help-overlay__title">Controls</h3>
              <div id="viz-help-system" class="viz-help-overlay__section">
                <h4>System Mode</h4>
                <div class="viz-help-overlay__grid">
                  <div class="viz-help-overlay__item"><kbd>LMB drag</kbd><span>Pan (orbit when focused)</span></div>
                  <div class="viz-help-overlay__item"><kbd>RMB drag</kbd><span>Rotate</span></div>
                  <div class="viz-help-overlay__item"><kbd>Scroll</kbd><span>Zoom</span></div>
                  <div class="viz-help-overlay__item"><kbd>Click</kbd><span>Center on body</span></div>
                  <div class="viz-help-overlay__item"><kbd>Dbl-click</kbd><span>Zoom to body</span></div>
                  <div class="viz-help-overlay__item"><kbd>Esc</kbd><span>Release focus</span></div>
                  <div class="viz-help-overlay__item"><kbd>1 finger</kbd><span>Rotate</span></div>
                  <div class="viz-help-overlay__item"><kbd>Pinch</kbd><span>Zoom</span></div>
                  <div class="viz-help-overlay__item"><kbd>2-finger drag</kbd><span>Pan</span></div>
                </div>
              </div>
              <div id="viz-help-cluster" class="viz-help-overlay__section" style="display:none">
                <h4>Cluster Mode</h4>
                <div class="viz-help-overlay__grid">
                  <div class="viz-help-overlay__item"><kbd>Drag</kbd><span>Rotate</span></div>
                  <div class="viz-help-overlay__item"><kbd>Scroll</kbd><span>Zoom</span></div>
                  <div class="viz-help-overlay__item"><kbd>1 finger</kbd><span>Rotate</span></div>
                  <div class="viz-help-overlay__item"><kbd>Pinch</kbd><span>Zoom</span></div>
                </div>
              </div>
            </div>
          </div>
          </div>
          <div id="viz-focus-summary" class="viz-focus-summary" style="display:none"></div>
        </div>
      </div>
    </div>
  `;
  attachTooltips(root);
  createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.viz.tutorial",
    container: root,
    triggerBtn: root.querySelector("#vizTutorials"),
  });

  const canvas = root.querySelector("#viz");
  const overlayCanvas = root.querySelector("#viz-overlay");
  const overlayCtx = overlayCanvas?.getContext("2d");
  let nativeThree = null;
  const nativeTextures = new Map();
  const nativeTextTextures = new Map();
  const nativeProceduralTextures = new Map();
  const canvasStarSurfaceTextures = new Map();
  const chkLabels = root.querySelector("#chk-labels");
  const chkLabelLeaders = root.querySelector("#chk-label-leaders");
  const chkMoons = root.querySelector("#chk-moons");
  const chkOrbits = root.querySelector("#chk-orbits");
  const vizDistLinear = root.querySelector("#vizDistLinear");
  const vizDistLog = root.querySelector("#vizDistLog");
  const vizSizePhysical = root.querySelector("#vizSizePhysical");
  const chkHz = root.querySelector("#chk-hz");
  const chkDebris = root.querySelector("#chk-debris");
  const chkComets = root.querySelector("#chk-comets");
  const chkEccentric = root.querySelector("#chk-eccentric");
  const chkPeAp = root.querySelector("#chk-pe-ap");
  const chkHill = root.querySelector("#chk-hill");
  const chkLagrange = root.querySelector("#chk-lagrange");
  const chkFrost = root.querySelector("#chk-frost");
  const chkDistances = root.querySelector("#chk-distances");
  const chkGrid = root.querySelector("#chk-grid");
  const chkRotation = root.querySelector("#chk-rotation");
  const chkAxialTilt = root.querySelector("#chk-axial-tilt");
  const chkMultistarInfo = root.querySelector("#chk-multistar-info");
  const chkClickFocusBodies = root.querySelector("#chk-click-focus-bodies");
  const chkClickFocusStar = root.querySelector("#chk-click-focus-star");
  const chkDebug = root.querySelector("#chk-debug");
  const btnRefresh = root.querySelector("#btn-refresh");
  const btnPlay = root.querySelector("#btn-play");
  const btnResetView = root.querySelector("#btn-reset-view");
  const btnControls = root.querySelector("#btn-controls");
  const vizDropdown = root.querySelector("#viz-controls-dropdown");
  const btnFullscreen = root.querySelector("#btn-fullscreen");
  const btnExportImage = root.querySelector("#btn-export-image");
  const btnExportGif = root.querySelector("#btn-export-gif");
  const vizLayout = root.querySelector(".viz-layout");
  const rngSpeed = root.querySelector("#rng-speed");
  const txtSpeed = root.querySelector("#txt-speed");
  const rngBodyScale = root.querySelector("#rng-body-scale");
  const txtBodyScale = root.querySelector("#txt-body-scale");

  /* Cluster-mode DOM elements */
  const vizTitle = root.querySelector("#viz-title");
  const vizControlsSystem = root.querySelector("#viz-controls-system");
  const vizControlsCluster = root.querySelector("#viz-controls-cluster");
  const chkClusterLabels = root.querySelector("#chk-cluster-labels");
  const chkClusterLinks = root.querySelector("#chk-cluster-links");
  const chkClusterAxes = root.querySelector("#chk-cluster-axes");
  const chkClusterGrid = root.querySelector("#chk-cluster-grid");
  const chkClusterStars = root.querySelector("#chk-cluster-stars");
  const clusterMilsEl = root.querySelector("#clusterVizMils");
  const btnClusterRefresh = root.querySelector("#btn-cluster-refresh");
  const btnClusterPlay = root.querySelector("#btn-cluster-play");
  const rngClusterSpeed = root.querySelector("#rng-cluster-speed");
  const txtClusterSpeed = root.querySelector("#txt-cluster-speed");
  const vizToast = root.querySelector("#viz-toast");
  const vizToastClose = root.querySelector("#viz-toast-close");
  const nativeTransitionEl = root.querySelector("#viz-native-transition");
  const nativeTransitionLabelEl = root.querySelector("#viz-native-transition-label");
  const nativeTransitionFillEl = root.querySelector("#viz-native-transition-fill");
  const offscaleNoteEl = root.querySelector("#viz-offscale-note");
  const focusSummaryEl = root.querySelector("#viz-focus-summary");
  const helpOverlay = root.querySelector("#viz-help-overlay");
  const helpSystemSection = root.querySelector("#viz-help-system");
  const helpClusterSection = root.querySelector("#viz-help-cluster");
  const btnHelp = root.querySelector("#btn-help-overlay");
  const btnHelpClose = root.querySelector("#viz-help-close");
  const bodyScaleRow = root.querySelector("#body-scale-row");
  const viewModeRow = root.querySelector("#view-mode-row");
  const vizViewLocal = root.querySelector("#vizViewLocal");
  const vizViewOverview = root.querySelector("#vizViewOverview");
  const hostFrameRow = root.querySelector("#host-frame-row");
  const hostFrameHintRow = root.querySelector("#host-frame-hint-row");
  const hostFrameSelect = root.querySelector("#viz-host-frame");
  const hostFrameLabelEl = root.querySelector("#viz-host-frame-label");
  const hostFrameTipEl = root.querySelector("#viz-host-frame-tip .tip-icon");
  const hostFrameHintEl = root.querySelector("#viz-host-frame-hint");
  const speedControlEl = rngSpeed?.closest(".viz-speed");
  const distanceToggleWrap = vizDistLinear?.closest(".pill-toggle-wrap");
  const sizeToggleWrap = vizSizePhysical?.closest(".pill-toggle-wrap");
  const systemCheckToggles = {
    labels: chkLabels?.closest(".viz-check"),
    leaderLines: chkLabelLeaders?.closest(".viz-check"),
    moons: chkMoons?.closest(".viz-check"),
    orbits: chkOrbits?.closest(".viz-check"),
    hz: chkHz?.closest(".viz-check"),
    debris: chkDebris?.closest(".viz-check"),
    comets: chkComets?.closest(".viz-check"),
    eccentric: chkEccentric?.closest(".viz-check"),
    peAp: chkPeAp?.closest(".viz-check"),
    hill: chkHill?.closest(".viz-check"),
    lagrange: chkLagrange?.closest(".viz-check"),
    frost: chkFrost?.closest(".viz-check"),
    distances: chkDistances?.closest(".viz-check"),
    grid: chkGrid?.closest(".viz-check"),
    rotation: chkRotation?.closest(".viz-check"),
    axialTilt: chkAxialTilt?.closest(".viz-check"),
    multistarInfo: chkMultistarInfo?.closest(".viz-check"),
    clickBodies: chkClickFocusBodies?.closest(".viz-check"),
    clickStar: chkClickFocusStar?.closest(".viz-check"),
    debug: chkDebug?.closest(".viz-check"),
  };

  const DEFAULT_ZOOM = 1.18;
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 10000;
  const TRANSITION_ZOOM_START = 1.0;
  const TRANSITION_ZOOM_END = 0.15;
  const FOCUS_MIN_ZOOM = 1.55;
  const FOCUS_MAX_ZOOM = 500;
  const CAMERA_ZOOM_RATE = 3.8;
  const INERTIA_DECAY_RATE = 8.0;
  const INERTIA_MIN_VEL_PX = 0.5;
  const INERTIA_MIN_VEL_RAD = 0.001;
  const RESET_RATE = 6.0;
  const STAR_BURST_SIZE_SCALE = 0.3;
  const STAR_CME_RENDER_SCALE = 0.099;
  const DEFAULT_YAW = -0.6;
  const DEFAULT_PITCH = 1.24;
  const PITCH_MIN = 0.2;
  const PITCH_MAX = 1.52;

  /* Cluster-mode constants */
  const CLUSTER_DEFAULT_YAW = -0.7;
  const CLUSTER_DEFAULT_PITCH = 0.35;
  const CLUSTER_DEFAULT_ZOOM = 1.1;
  const CLUSTER_ZOOM_MIN = 0.35;
  const CLUSTER_ZOOM_MAX = 10.0;
  const CLUSTER_TRANSITION_ZOOM_START = 3.4;
  const CLUSTER_TRANSITION_ZOOM_END = 8.0;
  const CLUSTER_SPEED_STEPS = [0.1, 0.5, 1, 5, 20];
  const OFFSCALE_ZONE_RATIO = 20;
  const OFFSCALE_ZONE_MIN_AU = 200;
  const OFFSCALE_ZONE_RANGE_RATIO = 1.3;

  btnRefresh?.setAttribute("data-tip", TIP_LABEL["Refresh"] || "");
  btnPlay?.setAttribute("data-tip", TIP_LABEL["Play"] || "");
  btnExportImage?.setAttribute("data-tip", TIP_LABEL["Download image"] || "");
  btnExportGif?.setAttribute("data-tip", TIP_LABEL["Download GIF"] || "");

  function isLogScale() {
    return vizDistLog?.checked !== false;
  }
  function isPhysicalScale() {
    return vizSizePhysical?.checked === true;
  }
  function canUseSystemOverview(snapshot) {
    return state.mode === "system" && !!snapshot?.overviewModel;
  }
  function isSystemOverviewMode(snapshot) {
    return state.systemViewMode === "overview" && canUseSystemOverview(snapshot);
  }
  function getZoomMax() {
    return ZOOM_MAX;
  }
  function getFocusMaxZoom() {
    return FOCUS_MAX_ZOOM;
  }

  function stopSystemPlayback() {
    if (!state.isPlaying) return;
    state.isPlaying = false;
    state.lastTick = 0;
    if (btnPlay) btnPlay.textContent = "Play";
    stopTickLoop();
    syncExportButtons();
  }

  function applySystemViewMode(nextMode, snapshotArg = null) {
    const snapshot = snapshotArg || getSnapshot();
    const resolvedMode =
      nextMode === "overview" && canUseSystemOverview(snapshot) ? "overview" : "local";
    if (state.systemViewMode === resolvedMode) return resolvedMode;
    state.systemViewMode = resolvedMode;
    if (resolvedMode === "overview") {
      stopSystemPlayback();
      stopCameraLoop();
      killInertia();
      clearFocusTarget();
    }
    syncSystemViewModeControls(snapshot);
    syncHostFrameControls(snapshot);
    return resolvedMode;
  }

  const state = {
    panX: 0,
    panY: 0,
    yaw: DEFAULT_YAW,
    pitch: DEFAULT_PITCH,
    zoom: DEFAULT_ZOOM,
    isPlaying: false,
    simTime: 0, // simulated days
    activityTime: 0, // simulated days for stellar activity (partially decoupled from orbit speed)
    activeHostFrameId: null,
    systemViewMode: "local",

    lastTick: 0,
    speed: 1,
    starBursts: [],
    flareState: {
      signature: "",
      params: null,
      surfaceParams: null,
      seeded: false,
      rng: Math.random,
      loopToggle: true,
      nextFlareTimeSec: Infinity,
      nextFlareEnergyErg: null,
      nextSurfaceFlareTimeSec: Infinity,
      nextSurfaceFlareEnergyErg: null,
      nextAssociatedCmeTimeSec: Infinity,
      nextBackgroundCmeTimeSec: Infinity,
      cyclePhase: 0,
      cyclePeriodSec: 11 * 365.25 * 86400,
      cmeTimes24hSec: [],
    },
    snapshotCache: null,
    focusTargetKind: null,
    focusTargetId: null,
    focusZoomTarget: null,
    zoomTarget: DEFAULT_ZOOM,
    zoomCursorX: null,
    zoomCursorY: null,
    panVelX: 0,
    panVelY: 0,
    yawVel: 0,
    pitchVel: 0,
    resetting: false,
    resetTargets: null,
    canvasDpr: 1,
    bodyHitRegions: [],
    labelHitRegions: [],
    labelOverrides: new Map(),
    debugLast: new Map(),
    exportingGif: false,
    transitioning: false,
    bodyScale: 0.4,

    /* Unified mode */
    mode: options.startMode === "cluster" ? "cluster" : "system",

    /* Cluster-mode state */
    clusterSnapshot: null,
    clusterMouseX: null,
    clusterMouseY: null,
    clusterSpinSpeed: 0.5,
    clusterIsPlaying: false,
    clusterLastTick: 0,
  };

  function syncExportButtons() {
    const playing = state.mode === "cluster" ? state.clusterIsPlaying : state.isPlaying;
    const overviewMode = state.mode === "system" && state.systemViewMode === "overview";
    const canCaptureGif = playing && !state.exportingGif && !overviewMode;
    if (btnExportGif) btnExportGif.disabled = !canCaptureGif;
    if (btnExportGif) {
      const gifHint = overviewMode
        ? "GIF export is unavailable in System Overview."
        : TIP_LABEL["Download GIF"] || "";
      btnExportGif.setAttribute("data-tip", gifHint);
      btnExportGif.title = overviewMode ? "GIF export is unavailable in System Overview." : "";
    }
    if (btnExportImage) btnExportImage.disabled = state.exportingGif;
    if (btnPlay) btnPlay.disabled = state.exportingGif;
    if (btnClusterPlay) btnClusterPlay.disabled = state.exportingGif;
  }

  function dbgThrottled(enabled, key, intervalMs, ...args) {
    if (!enabled) return;
    const now = performance.now();
    const last = state.debugLast.get(key) ?? -Infinity;
    if (now - last < intervalMs) return;
    state.debugLast.set(key, now);
    dbg(true, ...args);
  }

  const starActivityRuntime = createStarActivityRuntime({
    state,
    debugLog: dbg,
    debugLogThrottled: dbgThrottled,
    isDebugEnabled: () => chkDebug?.checked === true,
  });

  let rafId = null;
  let cameraRafId = null;
  let disposed = false;
  const disposers = [];

  /* ── 3D body mesh system ───────────────────────────────────── */
  const bodyMeshService = createBodyMeshService({
    getNativeThree: () => nativeThree,
    getCameraState: () => ({ pitch: state.pitch, yaw: state.yaw }),
    hashUnit,
    isDisposed: () => disposed,
  });

  function warmBodyMeshes(snapshot) {
    return bodyMeshService.warmBodyMeshes(snapshot);
  }

  function disposeBodyMeshCache() {
    return bodyMeshService.disposeBodyMeshCache();
  }

  function disposeSharedGeo() {
    return bodyMeshService.disposeSharedGeo();
  }

  function positionBodyMesh(
    key,
    model,
    pos,
    bodyZ,
    pr,
    bodyId,
    axialTiltDeg,
    spinAngle,
    touched,
    lightDirectionWorld = null,
  ) {
    return bodyMeshService.positionBodyMesh({
      axialTiltDeg,
      bodyId,
      bodyZ,
      key,
      lightDirectionWorld,
      model,
      pos,
      pr,
      spinAngle,
      touched,
    });
  }

  function addDisposableListener(target, type, handler, options) {
    if (!target?.addEventListener) return;
    target.addEventListener(type, handler, options);
    disposers.push(() => {
      try {
        target.removeEventListener(type, handler, options);
      } catch {}
    });
  }

  function addCleanup(cleanup) {
    if (typeof cleanup === "function") disposers.push(cleanup);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    state.isPlaying = false;
    disposeNativeThree();
    if (rafId != null) {
      try {
        cancelAnimationFrame(rafId);
      } catch {}
      rafId = null;
    }
    if (cameraRafId != null) {
      try {
        cancelAnimationFrame(cameraRafId);
      } catch {}
      cameraRafId = null;
    }
    while (disposers.length) {
      const fn = disposers.pop();
      try {
        fn?.();
      } catch {}
    }
    canvasStarSurfaceTextures.clear();
  }

  const unmountObserver = new MutationObserver(() => {
    if (!root.isConnected) dispose();
  });
  unmountObserver.observe(document.body, { childList: true, subtree: true });
  disposers.push(() => {
    try {
      unmountObserver.disconnect();
    } catch {}
  });

  const vizWrap = root.querySelector(".viz-wrap") || canvas?.parentElement;

  /* ── Cluster helpers ───────────────────────────────────────── */

  function refreshClusterSnapshot() {
    state.clusterSnapshot = buildClusterSnapshot();
  }

  function updateClusterSpeedUI() {
    const idx = Number(rngClusterSpeed?.value || 1);
    state.clusterSpinSpeed = CLUSTER_SPEED_STEPS[idx] ?? 0.5;
    if (txtClusterSpeed) txtClusterSpeed.textContent = `${state.clusterSpinSpeed}x`;
  }
  updateClusterSpeedUI();
  let inputBindings = null;

  /* ── Mode switching ────────────────────────────────────────── */

  function switchMode(newMode) {
    if (newMode === state.mode) return;
    state.mode = newMode;

    /* Toggle dropdown control sections */
    if (vizControlsSystem) vizControlsSystem.style.display = newMode === "system" ? "" : "none";
    if (vizControlsCluster) vizControlsCluster.style.display = newMode === "cluster" ? "" : "none";

    /* Update page title */
    if (vizTitle)
      vizTitle.textContent =
        newMode === "cluster" ? "Local Cluster Visualiser" : "System Visualiser";

    /* Ensure cluster snapshot exists when entering cluster mode */
    if (newMode === "cluster" && !state.clusterSnapshot) refreshClusterSnapshot();

    /* Track first transition for toast dismissal */
    if (newMode === "cluster") {
      try {
        localStorage.setItem("worldsmith.viz.hasTransitioned", "1");
      } catch {}
      if (vizToast) vizToast.style.display = "none";
      hideOffscaleZoneNotice();
    }

    syncExportButtons();
    inputBindings?.syncModeUi?.();
  }

  /* Apply initial mode (if opened via #/cluster-viz) */
  if (state.mode === "cluster") {
    if (vizControlsSystem) vizControlsSystem.style.display = "none";
    if (vizControlsCluster) vizControlsCluster.style.display = "";
    if (vizTitle) vizTitle.textContent = "Local Cluster Visualiser";
  }

  /* ── Toast (first-load hint) ───────────────────────────────── */

  let toastTimeout = null;
  function showToast() {
    if (!vizToast) return;
    vizToast.style.display = "";
    toastTimeout = setTimeout(() => {
      if (vizToast) vizToast.style.display = "none";
    }, 8000);
  }
  function hideToast() {
    if (vizToast) vizToast.style.display = "none";
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
  }
  if (state.mode === "system") {
    try {
      if (!localStorage.getItem("worldsmith.viz.hasTransitioned")) showToast();
    } catch {}
  }

  function hideNativeTransitionOverlay() {
    if (!nativeTransitionEl) return;
    nativeTransitionEl.style.display = "none";
    nativeTransitionEl.setAttribute("aria-hidden", "true");
    if (nativeTransitionFillEl) nativeTransitionFillEl.style.width = "0%";
  }

  function showNativeTransitionOverlay(progress, label) {
    if (!nativeTransitionEl) return;
    const t = clamp(Number(progress) || 0, 0, 1);
    if (t <= 0) {
      hideNativeTransitionOverlay();
      return;
    }
    nativeTransitionEl.style.display = "";
    nativeTransitionEl.setAttribute("aria-hidden", "false");
    if (nativeTransitionLabelEl) nativeTransitionLabelEl.textContent = String(label || "");
    if (nativeTransitionFillEl) nativeTransitionFillEl.style.width = `${(t * 100).toFixed(1)}%`;
  }

  function hideOffscaleZoneNotice() {
    if (!offscaleNoteEl) return;
    offscaleNoteEl.style.display = "none";
    offscaleNoteEl.setAttribute("aria-hidden", "true");
    offscaleNoteEl.textContent = "";
  }

  function getOffscaleNoticeTopPx() {
    const controlsOpen = vizDropdown?.style.display !== "none";
    const controlsHeight = controlsOpen ? vizDropdown?.getBoundingClientRect?.().height || 0 : 0;
    return Math.round(12 + controlsHeight);
  }

  function updateOffscaleZoneNotice(info) {
    if (!offscaleNoteEl) return;
    const lines = Array.isArray(info?.lines) ? info.lines.filter(Boolean) : [];
    if (state.mode !== "system" || !lines.length) {
      hideOffscaleZoneNotice();
      return;
    }
    const topPx = getOffscaleNoticeTopPx();
    offscaleNoteEl.style.top = `${topPx}px`;
    offscaleNoteEl.textContent = [
      "Extreme-distance zones not rendered",
      ...lines,
      "Arrow indicates off-canvas direction.",
    ].join("\n");
    offscaleNoteEl.style.display = "";
    offscaleNoteEl.setAttribute("aria-hidden", "false");
  }

  function resizeCanvas(force = false) {
    if (!vizWrap) return;
    /* Clear inline size so CSS width:100%/height:100% governs display —
       prevents the canvas from blocking layout shrink after fullscreen. */
    canvas.style.width = "";
    canvas.style.height = "";
    const rect = vizWrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    state.canvasDpr = dpr;
    const newW = Math.max(1, Math.ceil(rect.width * dpr));
    const newH = Math.max(1, Math.ceil(rect.height * dpr));
    if (!force && newW === canvas.width && newH === canvas.height) return;
    canvas.width = newW;
    canvas.height = newH;
  }

  function disposeNativeThree() {
    if (!nativeThree) return;
    /* Dispose body mesh cache first — owns textures, materials, and ring
       geometry.  Skip bodyGroup in the generic traverse to avoid double-
       disposing shared geometries that disposeSharedGeo() handles. */
    disposeBodyMeshCache();
    disposeSharedGeo();
    try {
      for (const grp of [nativeThree.systemGroup, nativeThree.clusterGroup]) {
        grp?.traverse?.((obj) => {
          try {
            obj.geometry?.dispose?.();
          } catch {}
          try {
            obj.material?.dispose?.();
          } catch {}
        });
      }
      nativeThree.renderer?.dispose?.();
    } catch {}
    nativeThree = null;
    bodyMeshService.resetPositionHelpers();
    nativeTextures.clear();
    nativeTextTextures.clear();
    nativeProceduralTextures.clear();
    hideNativeTransitionOverlay();
  }

  function clearThreeGroup(group) {
    if (!group) return;
    while (group.children.length) {
      const child = group.children.pop();
      try {
        group.remove(child);
      } catch {}
      try {
        child.geometry?.dispose?.();
      } catch {}
      try {
        child.material?.dispose?.();
      } catch {}
    }
  }

  function toThreeXY(metrics, sx, sy) {
    const x = sx - metrics.W / 2;
    const y = metrics.H / 2 - sy;
    return { x, y };
  }

  function getNativeProceduralTexture(cacheKey, drawFn, size = 256) {
    if (!nativeThree || typeof drawFn !== "function") return null;
    const key = `${cacheKey}:${size}`;
    const cached = nativeProceduralTextures.get(key);
    if (cached) return cached;

    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const cctx = c.getContext("2d");
    if (!cctx) return null;
    drawFn(cctx, size);

    const tex = new nativeThree.THREE.CanvasTexture(c);
    tex.minFilter = nativeThree.THREE.LinearFilter;
    tex.magFilter = nativeThree.THREE.LinearFilter;
    tex.generateMipmaps = false;
    if (nativeThree.THREE.SRGBColorSpace) tex.colorSpace = nativeThree.THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    nativeProceduralTextures.set(key, tex);
    return tex;
  }

  function threeCircle(radius, color, opacity = 1, segments = 128) {
    const THREE = nativeThree.THREE;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: false,
    });
    return new THREE.LineLoop(g, m);
  }

  function _threeLine(x1, y1, x2, y2, color, opacity = 1, z = 0) {
    const THREE = nativeThree.THREE;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, y1, z),
      new THREE.Vector3(x2, y2, z),
    ]);
    const m = new THREE.LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: false,
    });
    return new THREE.Line(g, m);
  }

  function getNativeTextTexture(text, opts = {}) {
    if (!nativeThree) return null;
    const label = String(text ?? "");
    if (!label) return null;
    const font = String(opts.font || "11px system-ui, sans-serif");
    const color = String(opts.color || "rgba(230,235,248,0.9)");
    const key = `${font}|${color}|${label}`;
    const cached = nativeTextTextures.get(key);
    if (cached) return cached;
    const c = document.createElement("canvas");
    const cctx = c.getContext("2d");
    if (!cctx) return null;
    cctx.font = font;
    const fontMatch = /([0-9]+(?:\.[0-9]+)?)px/.exec(font);
    const fontPx = fontMatch ? Number(fontMatch[1]) : 12;
    const tw = Math.max(1, Math.ceil(cctx.measureText(label).width + 8));
    const th = Math.max(1, Math.ceil(fontPx + 8));
    c.width = tw;
    c.height = th;
    cctx.font = font;
    cctx.textAlign = "center";
    cctx.textBaseline = "middle";
    cctx.fillStyle = color;
    cctx.shadowColor = "rgba(0,0,0,0.5)";
    cctx.shadowBlur = 3;
    cctx.fillText(label, tw / 2, th / 2 + 0.5);
    const tex = new nativeThree.THREE.CanvasTexture(c);
    tex.minFilter = nativeThree.THREE.LinearFilter;
    tex.magFilter = nativeThree.THREE.LinearFilter;
    tex.generateMipmaps = false;
    if (nativeThree.THREE.SRGBColorSpace) tex.colorSpace = nativeThree.THREE.SRGBColorSpace;
    nativeTextTextures.set(key, tex);
    return tex;
  }

  function threeText(text, sx, sy, z = 10, opts = {}) {
    if (!nativeThree) return null;
    const tex = getNativeTextTexture(text, opts);
    if (!tex) return null;
    const img = tex.image;
    const THREE = nativeThree.THREE;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: 0xffffff,
      transparent: true,
      opacity: Number.isFinite(opts.opacity) ? opts.opacity : 1,
      depthWrite: false,
    });
    const spr = new THREE.Sprite(mat);
    spr.position.set(sx, sy, z);
    spr.scale.set(Math.max(1, Number(img?.width) || 16), Math.max(1, Number(img?.height) || 10), 1);
    return spr;
  }

  function nativePlanetRadiusPx(node, metrics) {
    if (!node) return 4;
    if (isPhysicalScale()) {
      return physicalRadiusToPx(node.radiusKm, metrics.starR, metrics.starRadiusKm, 1, 40);
    }
    return applyRepresentativeBodyRadiusConstraints(
      representativePlanetBaseRadiusPx(node, metrics?.bodyZoom || 1),
      metrics,
    );
  }

  function nativeGasRadiusPx(node, metrics) {
    if (!node) return 6;
    if (isPhysicalScale()) {
      return physicalRadiusToPx(node.radiusKm, metrics.starR, metrics.starRadiusKm, 1, 48);
    }
    return applyRepresentativeBodyRadiusConstraints(
      representativeGasBaseRadiusPx(node, metrics?.bodyZoom || 1),
      metrics,
    );
  }

  function trimOverviewLabel(value, max = 18) {
    const text = String(value || "").trim();
    return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}...` : text;
  }

  function getSnapshotZoneLabel(snapshot) {
    return String(snapshot?.sys?.zoneLabel || "Habitable Zone").trim() || "Habitable Zone";
  }

  function syncZoneToggleLabel(snapshot) {
    const labelWrap = systemCheckToggles?.hz?.querySelector("span");
    if (!labelWrap) return;
    const zoneLabel = getSnapshotZoneLabel(snapshot);
    const nextText = `${zoneLabel} `;
    if (labelWrap.firstChild?.nodeType === Node.TEXT_NODE) {
      labelWrap.firstChild.textContent = nextText;
      return;
    }
    labelWrap.insertBefore(document.createTextNode(nextText), labelWrap.firstChild || null);
  }

  function formatOverviewBodyBadge(bodyCounts) {
    if (!bodyCounts || typeof bodyCounts !== "object" || Number(bodyCounts.total) <= 0) return "";
    const parts = [];
    if (Number(bodyCounts.rockyPlanets) > 0) {
      parts.push(`${Number(bodyCounts.rockyPlanets)} rocky`);
    }
    if (Number(bodyCounts.gasGiants) > 0) {
      parts.push(`${Number(bodyCounts.gasGiants)} giant`);
    }
    if (Number(bodyCounts.brownDwarfs) > 0) {
      parts.push(`${Number(bodyCounts.brownDwarfs)} brown dwarf`);
    }
    if (Number(bodyCounts.debrisDisks) > 0) {
      parts.push(`${Number(bodyCounts.debrisDisks)} debris`);
    }
    return parts.join(" | ");
  }

  function traceRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width * 0.5, height * 0.5));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawOverviewChip(ctx, x, y, text, options = {}) {
    if (!ctx || !text) return 0;
    const {
      fillStyle = "rgba(12, 20, 43, 0.88)",
      strokeStyle = "rgba(122, 156, 214, 0.36)",
      textStyle = "rgba(235, 242, 255, 0.94)",
    } = options;
    ctx.save();
    ctx.font = "10px system-ui, sans-serif";
    const width = Math.ceil(ctx.measureText(text).width) + 20;
    const height = 22;
    traceRoundedRect(ctx, x, y, width, height, 11);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = textStyle;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 10, y + height * 0.5 + 0.5);
    ctx.restore();
    return width;
  }

  function drawSystemOverview(snapshot) {
    if (!nativeThree || !overlayCtx || !overlayCanvas) return false;
    const overview = snapshot?.overviewModel;
    if (!overview) return false;

    hideOffscaleZoneNotice();
    syncOverlaySize();

    nativeThree.systemGroup.visible = false;
    nativeThree.clusterGroup.visible = false;
    if (nativeThree.bodyGroup) nativeThree.bodyGroup.visible = false;
    clearThreeGroup(nativeThree.systemGroup);
    state.bodyHitRegions = [];
    state.labelHitRegions = [];

    const dpr = state.canvasDpr || window.devicePixelRatio || 1;
    const W = overlayCanvas.width / dpr;
    const H = overlayCanvas.height / dpr;
    if (W < 1 || H < 1) return false;

    nativeThree.renderer.setSize(
      Math.max(1, Math.round(W * dpr)),
      Math.max(1, Math.round(H * dpr)),
      false,
    );
    nativeThree.renderer.setPixelRatio(1);
    nativeThree.renderer.setClearColor(0x040714, 1);
    nativeThree.renderer.render(nativeThree.scene, nativeThree.cameraSystem);
    if (btnResetView) btnResetView.disabled = true;

    renderFocusSummary(getOverviewSelectionSummary(snapshot), {
      onAction(actionId) {
        if (actionId === "view-locally") {
          applySystemViewMode("local", snapshot);
          draw(snapshot);
        }
      },
    });

    overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    overlayCtx.clearRect(0, 0, W, H);

    const topInset = getOffscaleNoticeTopPx();
    const left = Math.max(36, W * 0.08);
    const right = Math.min(W - 36, W * 0.92);
    const top = Math.max(topInset + 44, 76);
    const bottom = Math.max(top + 120, H - 48);
    const laneRows = Array.isArray(overview.nodeIdsByDepth)
      ? overview.nodeIdsByDepth.filter((lane) => Array.isArray(lane) && lane.length > 0)
      : [];
    const positionsByNodeId = Object.create(null);
    const laneCount = Math.max(1, laneRows.length);
    const laneYFractions =
      laneCount <= 1
        ? [0.5]
        : laneCount === 2
          ? [0.3, 0.72]
          : laneCount === 3
            ? [0.2, 0.5, 0.8]
            : null;

    laneRows.forEach((lane, depthIndex) => {
      const y = Array.isArray(laneYFractions)
        ? top + (bottom - top) * laneYFractions[Math.min(depthIndex, laneYFractions.length - 1)]
        : laneCount > 1
          ? top + (depthIndex * (bottom - top)) / (laneCount - 1)
          : (top + bottom) * 0.5;
      if (lane.length === 1) {
        positionsByNodeId[lane[0]] = { x: (left + right) * 0.5, y };
        return;
      }
      const step = (right - left) / Math.max(1, lane.length - 1);
      lane.forEach((nodeId, laneIndex) => {
        positionsByNodeId[nodeId] = {
          x: left + step * laneIndex,
          y,
        };
      });
    });

    const chipTop = Math.max(14, topInset - 30);
    let chipCursorX = 18;
    chipCursorX += drawOverviewChip(overlayCtx, chipCursorX, chipTop, "System Overview") + 8;
    chipCursorX +=
      drawOverviewChip(overlayCtx, chipCursorX, chipTop, "Not to scale", {
        fillStyle: "rgba(37, 31, 15, 0.88)",
        strokeStyle: "rgba(220, 190, 120, 0.34)",
        textStyle: "rgba(255, 229, 176, 0.94)",
      }) + 8;
    drawOverviewChip(
      overlayCtx,
      chipCursorX,
      chipTop,
      `Selected: ${trimOverviewLabel(overview?.legend?.selectedLabel || snapshot?.activeHostFrameLabel || "Host frame", 26)}`,
      {
        fillStyle: "rgba(16, 38, 61, 0.9)",
        strokeStyle: "rgba(112, 182, 255, 0.34)",
      },
    );

    overlayCtx.save();
    overlayCtx.lineCap = "round";
    overview.edges.forEach((edge) => {
      const parentPos = positionsByNodeId[edge.parentId];
      const childPos = positionsByNodeId[edge.childId];
      if (!parentPos || !childPos) return;
      overlayCtx.beginPath();
      overlayCtx.moveTo(parentPos.x, parentPos.y);
      overlayCtx.lineTo(childPos.x, childPos.y);
      overlayCtx.lineWidth = edge.isOnActivePath ? 3 : 1.35;
      overlayCtx.strokeStyle = edge.isOnActivePath
        ? "rgba(134, 205, 255, 0.86)"
        : "rgba(96, 116, 154, 0.52)";
      overlayCtx.stroke();
    });

    const labelsEnabled = chkLabels?.checked !== false;
    const showBadges = chkMultistarInfo?.checked !== false;
    overview.nodes.forEach((node) => {
      const pos = positionsByNodeId[node.id];
      if (!pos) return;
      const baseRadius = node.kind === "pair" ? 15 : 12;
      const glowRadius = node.kind === "pair" ? 26 : 22;
      const fillColor = node.displayColorHex || "#dbe7ff";
      overlayCtx.beginPath();
      overlayCtx.fillStyle = hexToRgba(
        fillColor,
        node.isActive ? 0.24 : node.isOnActivePath ? 0.16 : 0.08,
      );
      overlayCtx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
      overlayCtx.fill();

      if (node.kind === "pair") {
        overlayCtx.beginPath();
        overlayCtx.strokeStyle = node.isActive
          ? "rgba(144, 217, 255, 0.96)"
          : node.isOnActivePath
            ? "rgba(180, 214, 255, 0.84)"
            : "rgba(156, 176, 214, 0.62)";
        overlayCtx.lineWidth = node.isActive ? 3 : 2;
        overlayCtx.arc(pos.x, pos.y, baseRadius, 0, Math.PI * 2);
        overlayCtx.stroke();
        overlayCtx.beginPath();
        overlayCtx.fillStyle = hexToRgba(fillColor, node.isActive ? 0.95 : 0.82);
        overlayCtx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
        overlayCtx.fill();
      } else {
        overlayCtx.beginPath();
        overlayCtx.fillStyle = hexToRgba(fillColor, node.isActive ? 0.98 : 0.9);
        overlayCtx.arc(pos.x, pos.y, baseRadius, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.beginPath();
        overlayCtx.strokeStyle = node.isActive
          ? "rgba(255,255,255,0.95)"
          : "rgba(210, 223, 246, 0.74)";
        overlayCtx.lineWidth = node.isActive ? 2.4 : 1.4;
        overlayCtx.arc(pos.x, pos.y, baseRadius, 0, Math.PI * 2);
        overlayCtx.stroke();
      }

      state.bodyHitRegions.push({
        kind: "overview-host-frame",
        id: node.id,
        hostFrameId: node.id,
        x: pos.x,
        y: pos.y,
        r: glowRadius,
      });

      if (labelsEnabled) {
        overlayCtx.textAlign = "center";
        overlayCtx.textBaseline = "top";
        overlayCtx.fillStyle = "rgba(238, 244, 255, 0.95)";
        overlayCtx.font =
          node.kind === "pair" ? "600 10px system-ui, sans-serif" : "10px system-ui, sans-serif";
        overlayCtx.fillText(
          trimOverviewLabel(node.shortLabel || node.label, node.kind === "pair" ? 22 : 16),
          pos.x,
          pos.y + glowRadius + 2,
        );
      }

      if (showBadges) {
        const badgeText = formatOverviewBodyBadge(node.bodyCounts);
        if (badgeText) {
          overlayCtx.textAlign = "center";
          overlayCtx.textBaseline = "top";
          overlayCtx.fillStyle = "rgba(176, 190, 214, 0.86)";
          overlayCtx.font = "8px monospace";
          overlayCtx.fillText(badgeText, pos.x, pos.y + glowRadius + (labelsEnabled ? 16 : 4));
        } else if (Number.isFinite(node.separationAu) && node.separationAu > 0) {
          overlayCtx.textAlign = "center";
          overlayCtx.textBaseline = "top";
          overlayCtx.fillStyle = "rgba(160, 174, 200, 0.82)";
          overlayCtx.font = "8px monospace";
          overlayCtx.fillText(
            `${Number(node.separationAu).toFixed(1)} AU`,
            pos.x,
            pos.y + glowRadius + (labelsEnabled ? 16 : 4),
          );
        }
      }
    });
    overlayCtx.restore();
    return true;
  }

  function drawBinarySystemOverlay(snapshot) {
    if (!overlayCtx || !overlayCanvas) return;
    if (chkMultistarInfo?.checked === false) return;
    if ((snapshot?.topologyKind || "single") === "single") return;
    const topologyKind = snapshot?.topologyKind || "single";
    const hierarchySummary =
      snapshot?.hierarchySummary && typeof snapshot.hierarchySummary === "object"
        ? snapshot.hierarchySummary
        : null;
    const isHierarchical =
      hierarchySummary?.isHierarchical || topologyKind === "triple" || topologyKind === "quad";
    const canvasMode = snapshot?.canvasMode || "single";
    const companions = Array.isArray(snapshot?.companionStars) ? snapshot.companionStars : [];
    const hostStars = Array.isArray(snapshot?.hostStars) ? snapshot.hostStars : [];
    const localStars = (hierarchySummary?.localStars || hostStars || []).filter(Boolean);
    const outerBranches =
      hierarchySummary?.outerBranches?.length > 0
        ? hierarchySummary.outerBranches
        : companions.map((entry, index) => ({
            id: entry?.companionNodeId || entry?.id || `companion_${index + 1}`,
            label: entry?.companionLabel || entry?.name || `Companion ${index + 1}`,
            hierarchyLevel: Number(entry?.hierarchyLevel || 1),
            separationAu:
              Number.isFinite(Number(entry?.separationAu)) && Number(entry?.separationAu) > 0
                ? Number(entry.separationAu)
                : null,
            stars: [entry].filter(Boolean),
            starNames: [entry?.name].filter(Boolean),
            representativeStar: entry || null,
          }));
    if (!localStars.length && !outerBranches.length) return;

    const trimLabel = (value, max = 18) => {
      const text = String(value || "").trim();
      return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}...` : text;
    };
    const localSectionLabel = localStars.length > 1 ? "Local host frame" : "Local host star";
    const outerSectionLabel =
      outerBranches.length > 1 ? "Outer companion branches" : "Outer companion branch";
    const dpr = state.canvasDpr || window.devicePixelRatio || 1;
    const W = overlayCanvas.width / dpr;
    overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const showHierarchyInset =
      isHierarchical && (hierarchySummary?.hierarchyNodes?.length || 0) > 1;
    const panelW = Math.min(312, W * 0.31);
    const panelH = Math.min(
      Math.max(
        122,
        102 + localStars.length * 34 + outerBranches.length * 38 + (showHierarchyInset ? 54 : 0),
      ),
      Math.max(122, overlayCanvas.height / dpr - 36),
    );
    const panelX = W - panelW - 18;
    const panelY = 18;
    const panelBottom = panelY + panelH;
    overlayCtx.fillStyle = "rgba(10, 18, 34, 0.82)";
    overlayCtx.strokeStyle = "rgba(126, 150, 188, 0.28)";
    overlayCtx.lineWidth = 1;
    overlayCtx.fillRect(panelX, panelY, panelW, panelH);
    overlayCtx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);
    overlayCtx.fillStyle = "rgba(241, 246, 255, 0.94)";
    overlayCtx.font = "12px system-ui, sans-serif";
    overlayCtx.fillText(
      canvasMode === "binary-p-type"
        ? isHierarchical
          ? "Hierarchical pair-host view"
          : "Binary P-type view"
        : isHierarchical
          ? "Hierarchical S-type view"
          : "Binary S-type view",
      panelX + 14,
      panelY + 20,
    );
    overlayCtx.fillStyle = "rgba(188, 204, 228, 0.84)";
    overlayCtx.font = "10px system-ui, sans-serif";
    overlayCtx.fillText(
      canvasMode === "binary-p-type"
        ? `${snapshot?.activeHostFrameLabel || "Pair"} barycenter host`
        : `${snapshot?.activeHostFrameLabel || "Host"} local host frame`,
      panelX + 14,
      panelY + 36,
    );
    const companionFluxEarth = Number(snapshot?.companionFluxEarth || 0);
    overlayCtx.fillText(
      canvasMode === "binary-p-type"
        ? outerBranches.length
          ? "Local pair sets climate; outer branch keeps context."
          : "Combined pair light sets the local climate."
        : outerBranches.length && companionFluxEarth > 0.0005
          ? `Outer branch adds ~${companionFluxEarth.toFixed(3)}x Earth flux.`
          : outerBranches.length
            ? "Outer branch tracks stability more than heating."
            : "Companion flux negligible.",
      panelX + 14,
      panelY + 50,
    );
    let cursorY = panelY + 72;
    if (showHierarchyInset) {
      const nodes = hierarchySummary?.hierarchyNodes || [];
      const insetLeft = panelX + 16;
      const insetRight = panelX + panelW - 16;
      const insetWidth = insetRight - insetLeft;
      const centerY = cursorY + 12;
      overlayCtx.fillStyle = "rgba(176, 190, 214, 0.78)";
      overlayCtx.font = "9px system-ui, sans-serif";
      overlayCtx.fillText("Hierarchy inset", insetLeft, cursorY - 2);
      overlayCtx.strokeStyle = "rgba(110, 132, 168, 0.46)";
      overlayCtx.lineWidth = 1;
      const step = nodes.length > 1 ? insetWidth / (nodes.length - 1) : 0;
      for (let index = 0; index < nodes.length - 1; index += 1) {
        const x1 = insetLeft + step * index;
        const x2 = insetLeft + step * (index + 1);
        overlayCtx.beginPath();
        overlayCtx.moveTo(x1, centerY);
        overlayCtx.lineTo(x2, centerY);
        overlayCtx.stroke();
      }
      nodes.forEach((node, index) => {
        const x = nodes.length > 1 ? insetLeft + step * index : insetLeft + insetWidth * 0.5;
        const fill =
          node?.kind === "local" ? "rgba(144, 214, 255, 0.92)" : "rgba(255, 214, 148, 0.9)";
        overlayCtx.beginPath();
        overlayCtx.fillStyle = fill;
        overlayCtx.arc(x, centerY, node?.kind === "local" ? 6 : 5, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.fillStyle = "rgba(220, 228, 244, 0.82)";
        overlayCtx.font = "8px system-ui, sans-serif";
        overlayCtx.textAlign = "center";
        overlayCtx.fillText(trimLabel(node?.label, 16), x, centerY + 16);
        overlayCtx.textAlign = "left";
      });
      cursorY += 52;
    }

    if (localStars.length) {
      overlayCtx.fillStyle = "rgba(180, 211, 255, 0.9)";
      overlayCtx.font = "9px system-ui, sans-serif";
      overlayCtx.fillText(localSectionLabel, panelX + 14, cursorY);
      cursorY += 16;
      localStars.forEach((entry, index) => {
        const y = cursorY + index * 32;
        overlayCtx.beginPath();
        overlayCtx.fillStyle = hexToRgba(entry.starColourHex || "#ffe9c0", 0.95);
        overlayCtx.arc(panelX + 18, y - 4, 6, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.beginPath();
        overlayCtx.fillStyle = hexToRgba(entry.starColourHex || "#ffe9c0", 0.18);
        overlayCtx.arc(panelX + 18, y - 4, 12, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.fillStyle = "rgba(233, 238, 248, 0.92)";
        overlayCtx.font = "10px system-ui, sans-serif";
        overlayCtx.fillText(entry.name || `Host star ${index + 1}`, panelX + 34, y);
        overlayCtx.fillStyle = "rgba(176, 190, 214, 0.72)";
        overlayCtx.font = "8px monospace";
        overlayCtx.fillText(
          Number.isFinite(entry.barycentricOrbitAu) && entry.barycentricOrbitAu > 0
            ? `${Number(entry.barycentricOrbitAu).toFixed(2)} AU from barycenter`
            : "local climate driver",
          panelX + 34,
          y + 12,
        );
      });
      cursorY += localStars.length * 32 + 6;
    }

    if (outerBranches.length) {
      overlayCtx.fillStyle = "rgba(255, 214, 162, 0.9)";
      overlayCtx.font = "9px system-ui, sans-serif";
      overlayCtx.fillText(outerSectionLabel, panelX + 14, cursorY);
      cursorY += 16;
      outerBranches.forEach((branch, index) => {
        const y = cursorY + index * 36;
        const starTint =
          branch?.representativeStar?.starColourHex ||
          branch?.stars?.[0]?.starColourHex ||
          "#ffe9c0";
        overlayCtx.beginPath();
        overlayCtx.fillStyle = hexToRgba(starTint, 0.92);
        overlayCtx.arc(panelX + 18, y - 4, 5.5, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.beginPath();
        overlayCtx.fillStyle = hexToRgba(starTint, 0.16);
        overlayCtx.arc(panelX + 18, y - 4, 11, 0, Math.PI * 2);
        overlayCtx.fill();
        overlayCtx.fillStyle = "rgba(233, 238, 248, 0.92)";
        overlayCtx.font = "10px system-ui, sans-serif";
        overlayCtx.fillText(branch?.label || `Companion ${index + 1}`, panelX + 34, y);
        overlayCtx.fillStyle = "rgba(176, 190, 214, 0.72)";
        overlayCtx.font = "8px monospace";
        const branchDetailParts = [];
        if (Array.isArray(branch?.starNames) && branch.starNames.length > 0) {
          branchDetailParts.push(branch.starNames.join(", "));
        }
        if (Number.isFinite(Number(branch?.separationAu))) {
          branchDetailParts.push(
            `${Number(branch.separationAu).toFixed(1)} AU ${branch?.hierarchyLevel > 1 ? "outer " : ""}separation`,
          );
        }
        overlayCtx.fillText(branchDetailParts.join(" | ") || "outer branch", panelX + 34, y + 12);
      });
      cursorY += outerBranches.length * 36 + 4;
    }

    if (hierarchySummary?.notToScale) {
      overlayCtx.fillStyle = "rgba(150, 166, 190, 0.78)";
      overlayCtx.font = "italic 8px system-ui, sans-serif";
      overlayCtx.fillText("Not to scale", panelX + 14, Math.min(panelBottom - 10, cursorY + 10));
    }
  }

  function drawNativeSystemMode(snapshotArg) {
    if (!nativeThree) return false;
    /* Clear cluster 2D overlay when in system mode */
    syncOverlaySize();
    if (overlayCtx && overlayCanvas) {
      overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
    nativeThree.systemGroup.visible = true;
    nativeThree.clusterGroup.visible = false;
    if (nativeThree.bodyGroup) nativeThree.bodyGroup.visible = true;
    const snapshot =
      snapshotArg &&
      typeof snapshotArg === "object" &&
      snapshotArg.sys &&
      Array.isArray(snapshotArg.planetNodes)
        ? snapshotArg
        : getSnapshot();
    syncSystemViewModeControls(snapshot);
    syncHostFrameControls(snapshot);
    if (isSystemOverviewMode(snapshot)) {
      return drawSystemOverview(snapshot);
    }
    renderFocusSummary(getFocusedBodySummary(snapshot, state.focusTargetKind, state.focusTargetId));
    const { sys, planetNodes, debrisDisks, comets, gasGiants } = snapshot;
    const debugOn = flareDebugEnabled();
    const metrics = getFrameMetrics(snapshot);
    const { W, H, baseCx, baseCy, minAu, maxAu, maxR } = metrics;
    const offscaleZones = metrics.offscaleZones || { hideHz: false, hideFrost: false, lines: [] };
    if (maxR < 1 || W < 1 || H < 1) return false;
    // Snap pan so the focused body is exactly at screen centre.
    // This runs before cx/cy are derived so all subsequent drawing
    // uses the corrected pan — the body is centred BY CONSTRUCTION.
    syncFocusPan(snapshot, metrics);
    const usePhysicalSize = isPhysicalScale();
    const moonLabelOpacity = chkLabels?.checked
      ? clamp((state.zoom - MOON_LABEL_MIN_ZOOM) / MOON_LABEL_FADE, 0, 1)
      : 0;
    const showMoonLabels = moonLabelOpacity > 0.01;
    updateOffscaleZoneNotice(offscaleZones);

    const dpr = state.canvasDpr || window.devicePixelRatio || 1;
    nativeThree.renderer.setSize(
      Math.max(1, Math.round(W * dpr)),
      Math.max(1, Math.round(H * dpr)),
      false,
    );
    nativeThree.renderer.setPixelRatio(1);
    nativeThree.cameraSystem.left = -W / 2;
    nativeThree.cameraSystem.right = W / 2;
    nativeThree.cameraSystem.top = H / 2;
    nativeThree.cameraSystem.bottom = -H / 2;
    nativeThree.cameraSystem.updateProjectionMatrix();

    clearThreeGroup(nativeThree.systemGroup);
    state.bodyHitRegions = [];
    state.labelHitRegions = [];
    const bodyMeshTouched = new Set();

    const cx = baseCx + state.panX;
    const cy = baseCy + state.panY;
    const center = toThreeXY(metrics, cx, cy);
    const starR = metrics.starR;
    const THREE = nativeThree.THREE;
    const ringLightVectorForOrbit = (ox, oz, oy = 0) => {
      const projected = projectOrbitOffset(ox, oz, oy);
      return {
        x: -Number(projected?.x || 0),
        y: -Number(projected?.y || 0),
        z: -Number(projected?.depth || 0),
      };
    };
    const screenToThree = (sx, sy, z = 0) => {
      const tp = toThreeXY(metrics, sx, sy);
      return new THREE.Vector3(tp.x, tp.y, z);
    };
    const addScreenLine = (x1, y1, x2, y2, color, opacity = 1, z = 8) => {
      const g = new THREE.BufferGeometry().setFromPoints([
        screenToThree(x1, y1, z),
        screenToThree(x2, y2, z),
      ]);
      const m = new THREE.LineBasicMaterial({
        color,
        transparent: opacity < 1,
        opacity,
        depthWrite: false,
      });
      nativeThree.systemGroup.add(new THREE.Line(g, m));
    };
    const {
      addApsisMarkersNative,
      addAxialTiltOverlayNative,
      addHillSphereMarkerNative,
      addLagrangeMarkerNative,
      addPositionIndicatorNative,
      addRotationOverlayNative,
      projectedDashedOrbitLine,
      projectedEllipseOrbitLine,
      projectedOrbitBand,
      projectedOrbitLine,
    } = createNativeSystemLayer({
      THREE,
      addScreenLine,
      addToGroup: (node) => nativeThree.systemGroup.add(node),
      addTextAtScreen: (text, sx, sy, z = 10, opts = {}) => {
        const tp = screenToThree(sx, sy, z);
        return threeText(text, tp.x, tp.y, z, opts);
      },
      circleFactory: threeCircle,
      computeAxisDirection,
      crossVec3,
      labelsEnabled: !!chkLabels?.checked,
      normalizeVec3,
      orbitOffsetToScreen,
      orbitPointToScreen,
      projectDirectionToScreen,
      screenToThree,
      centerScreenX: cx,
      centerScreenY: cy,
    });
    // -- Deferred label system --------------------------------------------------
    // Labels are collected during draw, then sorted by priority and placed in a
    // single pass.  This ensures high-priority bodies (star, planets) claim the
    // best positions before low-priority ones (moons, debris).
    const { addDraggableLabelNative, flushPendingLabels } = createNativeLabelLayer({
      addScreenLine,
      addToGroup: (node) => nativeThree.systemGroup.add(node),
      getNativeTextTexture,
      labelHitRegions: state.labelHitRegions,
      labelOverrides: state.labelOverrides,
      labelsEnabled: !!chkLabels?.checked,
      leadersEnabled: !!chkLabelLeaders?.checked,
      screenToGroup: (sx, sy) => toThreeXY(metrics, sx, sy),
      threeText,
    });

    const addBodyLabelNative = (
      name,
      distText,
      sx,
      sy,
      bodyR,
      z = 9.0,
      labelKey = null,
      priority = 50,
      opacity = 1,
    ) =>
      addDraggableLabelNative({
        key: labelKey,
        line1: String(name || "Body"),
        line2: chkDistances?.checked && distText ? String(distText) : "",
        anchorX: sx,
        anchorY: sy,
        defaultX: sx + bodyR + 10 - 6,
        defaultY: sy - bodyR - 22 - 10,
        z,
        leaderRadius: Math.max(2, bodyR),
        priority,
        opacity,
      });

    const mapAuSpanToPx = (startAu, spanAu) => {
      if (!(Number.isFinite(startAu) && Number.isFinite(spanAu) && spanAu > 0)) return 0;
      return Math.max(
        0,
        mapAuToPx(startAu + spanAu, minAu, maxAu, maxR) - mapAuToPx(startAu, minAu, maxAu, maxR),
      );
    };

    const normalizeVec2 = (x, y, fallback = { x: 1, y: 0 }) => {
      const mag = Math.hypot(x, y);
      if (!(mag > 0)) return fallback;
      return { x: x / mag, y: y / mag };
    };

    const projectedDashedCometOrbitDashArc = (
      comet,
      color = 0xa8d7ff,
      opacity = 0.42,
      z = -5.9,
      segments = 1920,
    ) => {
      const { pointRuns } = buildProjectedCometOrbitDashRuns({
        comet,
        cx,
        cy,
        z,
        minAu,
        maxAu,
        maxR,
        mapAuToPx,
        orbitOffsetToScreen,
        screenToThree,
        sampleCount: segments,
        dashSteps: 14,
        gapSteps: 10,
        substepsPerSample: 4,
      });
      if (!Array.isArray(pointRuns) || !pointRuns.length) return null;
      const group = new THREE.Group();
      for (const run of pointRuns) {
        if (!Array.isArray(run) || run.length < 2) continue;
        group.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(run),
            new THREE.LineBasicMaterial({
              color,
              transparent: opacity < 1,
              opacity,
              depthWrite: false,
            }),
          ),
        );
      }
      return group.children.length ? group : null;
    };

    const addTailRibbonNative = ({
      tailBase,
      dustUpperControl,
      dustTip,
      dustLowerControl,
      dustBaseReturn,
      color,
      opacity,
      z,
    }) => {
      const segments = 20;
      const shape = new THREE.Shape();
      const start = screenToThree(tailBase.x, tailBase.y, z);
      shape.moveTo(start.x, start.y);
      for (let i = 1; i <= segments; i += 1) {
        const t = i / segments;
        const p = quadraticScreenPoint(
          tailBase.x,
          tailBase.y,
          dustUpperControl.x,
          dustUpperControl.y,
          dustTip.x,
          dustTip.y,
          t,
        );
        const tp = screenToThree(p.x, p.y, z);
        shape.lineTo(tp.x, tp.y);
      }
      for (let i = 1; i <= segments; i += 1) {
        const t = i / segments;
        const p = quadraticScreenPoint(
          dustTip.x,
          dustTip.y,
          dustLowerControl.x,
          dustLowerControl.y,
          dustBaseReturn.x,
          dustBaseReturn.y,
          t,
        );
        const tp = screenToThree(p.x, p.y, z);
        shape.lineTo(tp.x, tp.y);
      }
      shape.closePath();
      nativeThree.systemGroup.add(
        new THREE.Mesh(
          new THREE.ShapeGeometry(shape),
          new THREE.MeshBasicMaterial({
            color,
            transparent: opacity < 1,
            opacity,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          }),
        ),
      );
    };

    const quadraticScreenPoint = (sx, sy, cx1, cy1, ex, ey, t) => {
      const inv = 1 - t;
      return {
        x: inv * inv * sx + 2 * inv * t * cx1 + t * t * ex,
        y: inv * inv * sy + 2 * inv * t * cy1 + t * t * ey,
      };
    };

    const quadraticScreenNormal = (sx, sy, cx1, cy1, ex, ey, t) => {
      const dx = 2 * (1 - t) * (cx1 - sx) + 2 * t * (ex - cx1);
      const dy = 2 * (1 - t) * (cy1 - sy) + 2 * t * (ey - cy1);
      const tangent = normalizeVec2(dx, dy, { x: 1, y: 0 });
      return { x: -tangent.y, y: tangent.x };
    };

    const addParticleFieldNative = ({
      particles,
      resolveScreenPoint,
      color,
      opacity = 0.6,
      baseSize = 2.4,
      z = 2.6,
    }) => {
      if (
        !Array.isArray(particles) ||
        !particles.length ||
        typeof resolveScreenPoint !== "function"
      ) {
        return null;
      }
      const baseColor = new THREE.Color(color);
      const buckets = [
        { maxSize: 1.0, sizeScale: 0.85, opacityScale: 0.52, positions: [], colors: [] },
        { maxSize: 1.55, sizeScale: 1.2, opacityScale: 0.72, positions: [], colors: [] },
        { maxSize: Infinity, sizeScale: 1.7, opacityScale: 0.92, positions: [], colors: [] },
      ];

      for (const particle of particles) {
        const screenPoint = resolveScreenPoint(particle);
        if (!screenPoint) continue;
        const { x, y, alpha = 1, size = 1 } = screenPoint;
        if (!(Number.isFinite(x) && Number.isFinite(y))) continue;
        const bucket =
          buckets.find((entry) => size <= entry.maxSize) || buckets[buckets.length - 1];
        const tp = screenToThree(x, y, z);
        const brightness = clamp(0.22 + alpha * 0.95, 0.08, 1.15);
        bucket.positions.push(tp.x, tp.y, z);
        bucket.colors.push(
          clamp(baseColor.r * brightness, 0, 1),
          clamp(baseColor.g * brightness, 0, 1),
          clamp(baseColor.b * brightness, 0, 1),
        );
      }

      const group = new THREE.Group();
      for (const bucket of buckets) {
        if (!bucket.positions.length) continue;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(bucket.positions, 3));
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(bucket.colors, 3));
        group.add(
          new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
              size: baseSize * bucket.sizeScale,
              vertexColors: true,
              transparent: true,
              opacity: clamp(opacity * bucket.opacityScale, 0.05, 1),
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
              sizeAttenuation: false,
            }),
          ),
        );
      }

      return group.children.length ? group : null;
    };

    if (chkGrid?.checked) {
      const niceSteps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
      const range = maxAu - Math.max(minAu, 0);
      const targetRings = 8;
      const rawStep = range / Math.max(1, targetRings);
      let step = niceSteps[niceSteps.length - 1];
      for (const s of niceSteps) {
        if (s >= rawStep) {
          step = s;
          break;
        }
      }
      const startAu = Math.ceil(Math.max(minAu, 0) / step) * step;
      for (let au = startAu; au <= maxAu; au += step) {
        if (au <= 0) continue;
        const r = mapAuToPx(au, minAu, maxAu, maxR);
        if (r < 2 || r > maxR * 1.05) continue;
        nativeThree.systemGroup.add(projectedOrbitLine(r, 0xffffff, 0.08, 220, 0, -24));
        const labelAngle = -Math.PI * 0.28;
        const lp = orbitOffsetToScreen(Math.cos(labelAngle) * r, Math.sin(labelAngle) * r, cx, cy);
        const text = step >= 1 ? `${au} AU` : `${au.toFixed(1)} AU`;
        const lbl = threeText(
          text,
          toThreeXY(metrics, lp.x + 4, lp.y).x,
          toThreeXY(metrics, lp.x + 4, lp.y).y,
          -23.8,
          {
            font: "10px system-ui, sans-serif",
            color: "rgba(255,255,255,0.25)",
          },
        );
        if (lbl) nativeThree.systemGroup.add(lbl);
      }
    }

    if (chkHz?.checked && sys?.habitableZoneAu && !offscaleZones.hideHz) {
      const zoneLabel = getSnapshotZoneLabel(snapshot);
      const hzi = Math.max(
        0.000001,
        Math.min(Number(sys.habitableZoneAu.inner), Number(sys.habitableZoneAu.outer)),
      );
      const hzo = Math.max(
        hzi,
        Math.max(Number(sys.habitableZoneAu.inner), Number(sys.habitableZoneAu.outer)),
      );
      const r1 = mapAuToPx(hzi, minAu, maxAu, maxR);
      const r2 = mapAuToPx(hzo, minAu, maxAu, maxR);
      const mesh = projectedOrbitBand(
        Math.max(1, Math.min(r1, r2)),
        Math.max(Math.min(r1, r2) + 1, Math.max(r1, r2)),
        0x4ac575,
        0.1,
        220,
        0,
        -20,
      );
      nativeThree.systemGroup.add(mesh);
      const hzInnerRing = projectedOrbitLine(
        Math.max(1, Math.min(r1, r2)),
        0x64e682,
        0.42,
        220,
        0,
        -19.8,
      );
      const hzOuterRing = projectedOrbitLine(
        Math.max(Math.min(r1, r2) + 1, Math.max(r1, r2)),
        0x64e682,
        0.42,
        220,
        0,
        -19.8,
      );
      if (hzInnerRing) nativeThree.systemGroup.add(hzInnerRing);
      if (hzOuterRing) nativeThree.systemGroup.add(hzOuterRing);
      if (chkLabels?.checked) {
        const rMid =
          (Math.max(1, Math.min(r1, r2)) + Math.max(Math.min(r1, r2) + 1, Math.max(r1, r2))) * 0.5;
        const p = orbitOffsetToScreen(
          Math.cos(0.12 * Math.PI * 2) * rMid,
          Math.sin(0.12 * Math.PI * 2) * rMid,
          cx,
          cy,
        );
        addDraggableLabelNative({
          key: "zone:hz",
          line1:
            snapshot.topologyKind !== "single" && snapshot.activeHostFrameLabel
              ? `${snapshot.activeHostFrameLabel} ${zoneLabel}`
              : zoneLabel,
          line2: chkDistances?.checked
            ? `${Number(sys.habitableZoneAu.inner).toFixed(2)}-${Number(sys.habitableZoneAu.outer).toFixed(2)} AU`
            : "",
          anchorX: p.x,
          anchorY: p.y,
          defaultX: p.x + 8 - 6,
          defaultY: p.y - 2 - 10,
          z: -19.5,
          leaderRadius: 0,
          color1: "rgba(170,255,190,0.86)",
          color2: "rgba(170,255,190,0.65)",
          priority: 40,
        });
      }
    }

    if (
      chkFrost?.checked &&
      Number.isFinite(sys?.frostLineAu) &&
      sys.frostLineAu > 0 &&
      !offscaleZones.hideFrost
    ) {
      const rf = mapAuToPx(sys.frostLineAu, minAu, maxAu, maxR);
      const dashed = projectedDashedOrbitLine(rf, 0x8caac8, 0.36, 240, 0, -10, 6, 6);
      if (dashed) nativeThree.systemGroup.add(dashed);
      if (chkLabels?.checked) {
        const p = orbitOffsetToScreen(
          Math.cos(0.62 * Math.PI * 2) * rf,
          Math.sin(0.62 * Math.PI * 2) * rf,
          cx,
          cy,
        );
        addDraggableLabelNative({
          key: "zone:frost",
          line1:
            snapshot.topologyKind !== "single" && snapshot.activeHostFrameLabel
              ? `${snapshot.activeHostFrameLabel} Frost Line`
              : "H2O Frost Line",
          line2: chkDistances?.checked ? `${Number(sys.frostLineAu).toFixed(2)} AU` : "",
          anchorX: p.x,
          anchorY: p.y,
          defaultX: p.x + 10 - 6,
          defaultY: p.y - 2 - 10,
          z: -9.5,
          leaderRadius: 0,
          color1: "rgba(255,255,255,0.78)",
          color2: "rgba(255,255,255,0.55)",
          priority: 40,
        });
      }
    }

    if (chkDebris?.checked && Array.isArray(debrisDisks)) {
      const debrisPointTex = getNativeProceduralTexture(
        "debris-point:v1",
        (cctx, size) => {
          cctx.clearRect(0, 0, size, size);
          const dc = size * 0.5;
          const dr = size * 0.42;
          const g = cctx.createRadialGradient(dc, dc, dr * 0.1, dc, dc, dr);
          g.addColorStop(0.0, "rgba(255,255,255,1.0)");
          g.addColorStop(0.35, "rgba(220,210,190,0.85)");
          g.addColorStop(0.7, "rgba(180,170,150,0.4)");
          g.addColorStop(1.0, "rgba(120,110,100,0.0)");
          cctx.fillStyle = g;
          cctx.beginPath();
          for (let i = 0; i <= 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const wobble = 0.85 + 0.15 * Math.sin(a * 3.7 + 1.2) * Math.cos(a * 2.3 + 0.8);
            const px = dc + Math.cos(a) * dr * wobble;
            const py = dc + Math.sin(a) * dr * wobble;
            i === 0 ? cctx.moveTo(px, py) : cctx.lineTo(px, py);
          }
          cctx.closePath();
          cctx.fill();
        },
        64,
      );
      const sMass = Math.max(0.08, Number(snapshot.starMassMsol) || 1);
      for (let di = 0; di < debrisDisks.length; di += 1) {
        const d = debrisDisks[di];
        const inner = mapAuToPx(d.inner, minAu, maxAu, maxR);
        const outer = mapAuToPx(d.outer, minAu, maxAu, maxR);
        if (!(outer > inner && outer > 0)) continue;
        const THREE = nativeThree.THREE;
        const bandTint = di === 0 ? 0xc8c8dc : 0xb4d7be;
        const mesh = projectedOrbitBand(Math.max(1, inner), outer, bandTint, 0.045, 220, 0, -8);
        nativeThree.systemGroup.add(mesh);
        nativeThree.systemGroup.add(
          projectedOrbitLine(Math.max(1, inner), bandTint, 0.16, 220, 0, -7.9),
        );
        nativeThree.systemGroup.add(
          projectedOrbitLine(Math.max(1, outer), bandTint, 0.11, 220, 0, -7.9),
        );

        // Dense, clumped asteroids with Keplerian orbital motion.
        const particleCount = computeDebrisParticleTarget(inner, outer, d.inner, d.outer);
        const bucketPositions = [[], [], []];
        const bucketColors = [[], [], []];
        const diskSeed = `native:debris:${di}`;
        const maxAttempts = particleCount * 3;
        let placed = 0;
        for (let i = 0; i < maxAttempts && placed < particleCount; i += 1) {
          const seed = `${diskSeed}:${i}`;
          const baseAng = hashUnit(`${seed}:a`) * Math.PI * 2;
          if (hashUnit(`${seed}:keep`) > debrisKeepChance(baseAng, diskSeed)) continue;
          const au = sampleDebrisAu(d.inner, d.outer, seed);
          const periodDays = Math.sqrt((au * au * au) / sMass) * 365.256;
          const omega = (2 * Math.PI) / periodDays;
          const ang = baseAng + omega * state.simTime;
          const rPx = mapAuToPx(au, minAu, maxAu, maxR);
          const tangentJitter =
            (hashUnit(`${seed}:tj`) - 0.5) * Math.max(3.8, (outer - inner) * 0.2);
          const ox = Math.cos(ang) * rPx + -Math.sin(ang) * tangentJitter;
          const oy = Math.sin(ang) * rPx + Math.cos(ang) * tangentJitter;
          const p = orbitOffsetToScreen(ox, oy, cx, cy);
          const tp = toThreeXY(metrics, p.x, p.y);
          const sizeRoll = hashUnit(`${seed}:s`);
          const sizeBucket = sizeRoll > 0.94 ? 3 : sizeRoll > 0.72 ? 2 : 1;
          const tone = 148 + Math.floor(hashUnit(`${seed}:tone`) * 72);
          const warmth = hashUnit(`${seed}:warm`);
          const rCol = clamp(tone + 8 + warmth * 12, 0, 255) / 255;
          const gCol = clamp(tone - 10 + warmth * 7, 0, 255) / 255;
          const bCol = clamp(tone - 30 - warmth * 5, 0, 255) / 255;
          const bi = clamp(sizeBucket - 1, 0, 2);
          bucketPositions[bi].push(tp.x, tp.y, -7.6 + bi * 0.01);
          bucketColors[bi].push(rCol, gCol, bCol);
          placed += 1;
        }
        const sizes = [3.5, 5.5, 8.0];
        const opacities = [0.45, 0.58, 0.72];
        for (let bi = 0; bi < 3; bi += 1) {
          if (!bucketPositions[bi].length) continue;
          const pg = new THREE.BufferGeometry();
          pg.setAttribute("position", new THREE.Float32BufferAttribute(bucketPositions[bi], 3));
          pg.setAttribute("color", new THREE.Float32BufferAttribute(bucketColors[bi], 3));
          const pm = new THREE.PointsMaterial({
            size: sizes[bi],
            sizeAttenuation: false,
            vertexColors: true,
            transparent: true,
            opacity: opacities[bi],
            depthWrite: false,
            map: debrisPointTex,
            alphaTest: 0.01,
          });
          nativeThree.systemGroup.add(new THREE.Points(pg, pm));
        }

        if (chkLabels?.checked) {
          const midAu = (Number(d.inner) + Number(d.outer)) * 0.5;
          const rr = mapAuToPx(midAu, minAu, maxAu, maxR);
          const la = (-0.35 + di * 0.14) * Math.PI * 2;
          const labelPos = orbitOffsetToScreen(Math.cos(la) * rr, Math.sin(la) * rr, cx, cy);
          addDraggableLabelNative({
            key: `debris:${di}`,
            line1: d.name || "Debris disk",
            line2: chkDistances?.checked
              ? `${Number(d.inner).toFixed(2)}-${Number(d.outer).toFixed(2)} AU`
              : "",
            anchorX: labelPos.x,
            anchorY: labelPos.y,
            defaultX: labelPos.x + 8 - 6,
            defaultY: labelPos.y - 10,
            z: 9,
            leaderRadius: 0,
            color1: "rgba(255,255,255,0.70)",
            color2: "rgba(255,255,255,0.45)",
            priority: 30,
          });
        }
      }
    }

    if (chkOrbits?.checked) {
      const useEccentricRings = chkEccentric?.checked === true;
      for (const p of planetNodes || []) {
        if (!(p?.au > 0)) continue;
        const rPx = mapAuToPx(p.au, minAu, maxAu, maxR);
        const incDeg = useEccentricRings ? Number(p.inclinationDeg) || 0 : 0;
        const ecc = Number.isFinite(p.eccentricity) ? clamp(p.eccentricity, 0, 0.99) : 0;
        const ring =
          useEccentricRings && ecc > 0
            ? projectedEllipseOrbitLine(
                rPx,
                ecc,
                Number(p.longitudeOfPeriapsisDeg) || 0,
                incDeg,
                0x5f6c8a,
                0.34,
                220,
                -6,
              )
            : projectedOrbitLine(rPx, 0x5f6c8a, 0.34, 220, incDeg, -6);
        nativeThree.systemGroup.add(ring);
        if (chkPeAp?.checked && useEccentricRings && ecc > 0.01) {
          addApsisMarkersNative(
            rPx,
            ecc,
            Number(p.longitudeOfPeriapsisDeg) || 0,
            incDeg,
            chkLabels?.checked,
          );
        }
      }
      for (const g of gasGiants || []) {
        if (!(g?.au > 0)) continue;
        const rPx = mapAuToPx(g.au, minAu, maxAu, maxR);
        const ecc = Number.isFinite(g.eccentricity) ? clamp(g.eccentricity, 0, 0.99) : 0;
        const ring =
          useEccentricRings && ecc > 0
            ? projectedEllipseOrbitLine(
                rPx,
                ecc,
                Number(g.longitudeOfPeriapsisDeg) || 0,
                Number(g.inclinationDeg) || 0,
                0x6f7b98,
                0.32,
                220,
                -6,
              )
            : projectedOrbitLine(rPx, 0x6f7b98, 0.32, 220, 0, -6);
        nativeThree.systemGroup.add(ring);
        if (chkPeAp?.checked && useEccentricRings && ecc > 0.01) {
          addApsisMarkersNative(
            rPx,
            ecc,
            Number(g.longitudeOfPeriapsisDeg) || 0,
            Number(g.inclinationDeg) || 0,
            chkLabels?.checked,
          );
        }
      }
    }

    const pairHostStars =
      snapshot?.canvasMode === "binary-p-type" && Array.isArray(snapshot?.hostStars)
        ? snapshot.hostStars.filter((entry) => entry && entry.starColourHex)
        : [];
    const pairHostView = pairHostStars.length > 1;
    const starVisualStyle = getStarVisualStyle({
      regime: snapshot.starRegime,
      tempK: snapshot.starTempK,
      massMsol: snapshot.starMassMsol,
    });
    const starTint = parseHexColorNumber(snapshot.starColourHex, 0xfff4dc);
    const starCoreHex = mixHex(snapshot.starColourHex, "#ffffff", starVisualStyle.coreMix);
    const starCoreTint = parseHexColorNumber(starCoreHex, starTint);
    const starRimTint = parseHexColorNumber(
      mixHex(
        snapshot.starColourHex,
        starVisualStyle.rimWarmHex,
        Math.max(starVisualStyle.faculaMix, 0.12),
      ),
      starTint,
    );
    const flareRimTint = parseHexColorNumber(
      mixHex(snapshot.starColourHex, "#ffd7ab", 0.45),
      starTint,
    );
    const flareBeadTint = parseHexColorNumber(
      mixHex(snapshot.starColourHex, "#fff3dc", 0.55),
      starTint,
    );
    const flareLoopTint = parseHexColorNumber(
      mixHex(snapshot.starColourHex, "#ffaf7d", 0.7),
      starTint,
    );
    const flareLoopCoreTint = parseHexColorNumber(
      mixHex(snapshot.starColourHex, "#fff7e7", 0.62),
      flareBeadTint,
    );
    const cmeCloudTint = parseHexColorNumber(
      mixHex(snapshot.starColourHex, "#ffc18e", 0.68),
      flareLoopTint,
    );
    const starSurfaceSeed = getStarSurfaceSeed(snapshot);
    const starActivity = clamp(Number(snapshot.starActivityLevel), 0, 1);
    const glowPulse =
      0.55 + 0.45 * Math.sin(state.simTime * 0.08 + Number(snapshot.starMassMsol || 1) * 0.45);
    const starSurfaceRotation =
      state.simTime * 0.004 + hashUnit(`${starSurfaceSeed}:surface-rotation`) * Math.PI * 2;

    const starGlowTex = getNativeProceduralTexture(
      "star-glow:v2",
      (cctx, size) => {
        const c = size * 0.5;
        const g = cctx.createRadialGradient(c, c, size * 0.03, c, c, c);
        g.addColorStop(0.0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.2, "rgba(255,255,255,0.55)");
        g.addColorStop(0.45, "rgba(255,255,255,0.2)");
        g.addColorStop(0.72, "rgba(255,255,255,0.06)");
        g.addColorStop(1.0, "rgba(255,255,255,0)");
        cctx.clearRect(0, 0, size, size);
        cctx.fillStyle = g;
        cctx.fillRect(0, 0, size, size);
      },
      384,
    );
    const starSurfaceTex = getNativeProceduralTexture(
      `star-surface:v3:${snapshot.starColourHex}:${starSurfaceSeed}:${Math.round(Number(snapshot.starTempK) || 5776)}:${Math.round(starActivity * 100)}`,
      (cctx, size) => {
        paintStarSurfaceTexture(cctx, size, {
          baseHex: snapshot.starColourHex,
          seed: starSurfaceSeed,
          tempK: snapshot.starTempK,
          activity: starActivity,
          regime: snapshot.starRegime,
          massMsol: snapshot.starMassMsol,
        });
      },
      512,
    );
    const flarePlumeTex = getNativeProceduralTexture(
      "flare-plume:v3",
      (cctx, size) => {
        cctx.clearRect(0, 0, size, size);
        const cxp = size * 0.5;
        const cyp = size * 0.5;
        cctx.save();
        cctx.translate(cxp, cyp);
        cctx.scale(1.85, 0.82);
        const g = cctx.createRadialGradient(0, 0, size * 0.04, 0, 0, size * 0.32);
        g.addColorStop(0.0, "rgba(255,255,255,0.96)");
        g.addColorStop(0.25, "rgba(255,220,170,0.75)");
        g.addColorStop(0.58, "rgba(255,160,112,0.34)");
        g.addColorStop(1.0, "rgba(255,140,96,0)");
        cctx.fillStyle = g;
        cctx.beginPath();
        cctx.arc(0, 0, size * 0.34, 0, Math.PI * 2);
        cctx.fill();
        cctx.restore();
      },
      256,
    );
    const flareKnotTex = getNativeProceduralTexture(
      "flare-knot:v2",
      (cctx, size) => {
        cctx.clearRect(0, 0, size, size);
        const cxp = size * 0.5;
        const cyp = size * 0.5;
        const g = cctx.createRadialGradient(cxp, cyp, size * 0.05, cxp, cyp, size * 0.48);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.32, "rgba(255,234,190,0.92)");
        g.addColorStop(0.72, "rgba(255,164,112,0.42)");
        g.addColorStop(1, "rgba(255,120,86,0)");
        cctx.fillStyle = g;
        cctx.beginPath();
        cctx.arc(cxp, cyp, size * 0.48, 0, Math.PI * 2);
        cctx.fill();
      },
      192,
    );
    const cmeCloudTex = getNativeProceduralTexture(
      "cme-cloud:v1",
      (cctx, size) => {
        cctx.clearRect(0, 0, size, size);
        const cxp = size * 0.5;
        const cyp = size * 0.5;
        cctx.save();
        cctx.translate(cxp, cyp);
        cctx.scale(1.45, 0.82);
        const g = cctx.createRadialGradient(0, 0, size * 0.05, 0, 0, size * 0.48);
        g.addColorStop(0.0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.24, "rgba(255,230,186,0.72)");
        g.addColorStop(0.56, "rgba(255,166,112,0.3)");
        g.addColorStop(1.0, "rgba(255,140,98,0)");
        cctx.fillStyle = g;
        cctx.beginPath();
        cctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
        cctx.fill();
        cctx.restore();

        cctx.save();
        cctx.translate(cxp, cyp);
        cctx.rotate(Math.PI * 0.24);
        cctx.scale(1.15, 0.6);
        const g2 = cctx.createRadialGradient(0, 0, size * 0.04, 0, 0, size * 0.36);
        g2.addColorStop(0.0, "rgba(255,250,242,0.55)");
        g2.addColorStop(0.7, "rgba(255,182,128,0.2)");
        g2.addColorStop(1.0, "rgba(255,150,110,0)");
        cctx.fillStyle = g2;
        cctx.beginPath();
        cctx.arc(0, 0, size * 0.32, 0, Math.PI * 2);
        cctx.fill();
        cctx.restore();
      },
      256,
    );
    const addStarSprite = ({
      tex,
      radius,
      opacity,
      z,
      x = center.x,
      y = center.y,
      color = 0xffffff,
      blending = THREE.NormalBlending,
      rotation = 0,
    }) => {
      if (!tex) return;
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: false,
        blending,
      });
      mat.rotation = rotation;
      const sprite = new THREE.Sprite(mat);
      const rr = Math.max(1, radius);
      sprite.position.set(x, y, z);
      sprite.scale.set(rr * 2, rr * 2, 1);
      nativeThree.systemGroup.add(sprite);
    };
    const addBurstLoopArcNative = (
      sx,
      sy,
      mx,
      my,
      ex,
      ey,
      haloOpacity,
      coreOpacity,
      zBase = -0.845,
      pointSize = 1.4,
    ) => {
      const segments = 26;
      const pts = [];
      const knotPts = [];
      for (let si = 0; si <= segments; si += 1) {
        const u = si / segments;
        const inv = 1 - u;
        const px = inv * inv * sx + 2 * inv * u * mx + u * u * ex;
        const py = inv * inv * sy + 2 * inv * u * my + u * u * ey;
        const tp = toThreeXY(metrics, px, py);
        pts.push(new THREE.Vector3(tp.x, tp.y, zBase));
        if (si > 0 && si < segments) knotPts.push(tp.x, tp.y, zBase + 0.0006);
      }
      const haloGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const haloMat = new THREE.LineBasicMaterial({
        color: flareLoopTint,
        transparent: true,
        opacity: Math.min(0.9, haloOpacity * 1.45),
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      nativeThree.systemGroup.add(new THREE.Line(haloGeom, haloMat));
      const coreGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const coreMat = new THREE.LineBasicMaterial({
        color: flareLoopCoreTint,
        transparent: true,
        opacity: Math.min(1, coreOpacity * 1.55),
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      nativeThree.systemGroup.add(new THREE.Line(coreGeom, coreMat));
      if (flareKnotTex && knotPts.length) {
        const knotGeom = new THREE.BufferGeometry();
        knotGeom.setAttribute("position", new THREE.Float32BufferAttribute(knotPts, 3));
        const knotMat = new THREE.PointsMaterial({
          map: flareKnotTex,
          color: flareLoopCoreTint,
          size: Math.max(0.9, pointSize),
          sizeAttenuation: false,
          transparent: true,
          opacity: Math.min(0.96, coreOpacity * 1.75),
          alphaTest: 0.02,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });
        nativeThree.systemGroup.add(new THREE.Points(knotGeom, knotMat));
      }
    };
    const addCmePlasmaTrailNative = ({
      sx,
      sy,
      mx,
      my,
      ex,
      ey,
      opacity = 0.2,
      plumeSize = 2,
      jitterPhase = 0,
      jitterAmp = 0.6,
      zBase = -0.844,
      color = cmeCloudTint,
      lineColor = flareLoopTint,
    }) => {
      const segments = 8;
      const linePts = [];
      for (let si = 0; si <= segments; si += 1) {
        const u = si / segments;
        const inv = 1 - u;
        const qx = inv * inv * sx + 2 * inv * u * mx + u * u * ex;
        const qy = inv * inv * sy + 2 * inv * u * my + u * u * ey;
        const wobbleA = jitterPhase + u * 7.1;
        const wobbleR = jitterAmp * (0.35 + 0.65 * (1 - u));
        const px = qx + Math.cos(wobbleA) * wobbleR;
        const py = qy + Math.sin(wobbleA * 1.12) * wobbleR;
        const tp = toThreeXY(metrics, px, py);
        linePts.push(new THREE.Vector3(tp.x, tp.y, zBase + si * 0.00012));

        const puff = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: cmeCloudTex || flarePlumeTex || null,
            color,
            transparent: true,
            opacity: Math.max(0.02, opacity * (0.92 - u * 0.56)),
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        const puffSize = Math.max(0.75, plumeSize * (1.08 - u * 0.42));
        puff.position.set(tp.x, tp.y, zBase + 0.00045 + si * 0.0001);
        puff.scale.set(puffSize * (1.2 - u * 0.25), puffSize, 1);
        puff.material.rotation = -Math.atan2(ey - sy, ex - sx) + Math.PI * 0.5;
        nativeThree.systemGroup.add(puff);
      }
      if (linePts.length >= 2) {
        const spineGeom = new THREE.BufferGeometry().setFromPoints(linePts);
        const spineMat = new THREE.LineBasicMaterial({
          color: lineColor,
          transparent: true,
          opacity: Math.max(0.02, opacity * 0.16),
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });
        nativeThree.systemGroup.add(new THREE.Line(spineGeom, spineMat));
      }
    };
    addStarSprite({
      tex: starGlowTex,
      radius: Math.max(10, starR * (3.45 + 0.22 * glowPulse) * starVisualStyle.glowRadiusScale),
      opacity: pairHostView ? 0 : 0.19 * starVisualStyle.glowOpacityScale,
      z: -1.35,
      color: starTint,
      blending: THREE.AdditiveBlending,
    });
    addStarSprite({
      tex: starGlowTex,
      radius: Math.max(7, starR * (2.25 + 0.14 * glowPulse) * starVisualStyle.glowRadiusScale),
      opacity: pairHostView ? 0 : 0.28 * starVisualStyle.glowOpacityScale,
      z: -1.18,
      color: starTint,
      blending: THREE.AdditiveBlending,
    });
    addStarSprite({
      tex: starSurfaceTex,
      radius: Math.max(2, starR * 1.03),
      opacity: pairHostView ? 0 : 0.99,
      z: -0.98,
      color: 0xffffff,
      blending: THREE.NormalBlending,
      rotation: starSurfaceRotation,
    });
    addStarSprite({
      tex: starGlowTex,
      radius: Math.max(2.5, starR * 1.1),
      opacity: pairHostView ? 0 : 0.35 * starVisualStyle.rimOpacityScale,
      z: -0.94,
      color: starRimTint,
      blending: THREE.AdditiveBlending,
    });
    addStarSprite({
      tex: starGlowTex,
      radius: Math.max(1.2, starR * 0.55),
      opacity: pairHostView ? 0 : 0.42 * starVisualStyle.haloOpacityScale,
      z: -0.91,
      color: starCoreTint,
      blending: THREE.AdditiveBlending,
    });
    let starHitRadius = Math.max(14, starR * 1.08);
    if (pairHostView) {
      const livePairOrbit =
        pairHostStars.length === 2 && snapshot?.activeHostFrame?.pair
          ? computeBinaryPairOrbitalState({
              hostStars: pairHostStars,
              pair: snapshot.activeHostFrame.pair,
              simTime: state.simTime,
              cx,
              cy,
              minAu,
              maxAu,
              maxR,
              logScale: isLogScale(),
              mapAuToPx,
              orbitOffsetToScreen,
              solveKeplerEquation,
            })
          : null;
      const hostRadiusScales = pairHostStars.map((entry) =>
        Math.max(0.18, Number(entry.radiusRsol) || Number(entry.massMsol) || 1),
      );
      const maxHostRadiusScale = Math.max(...hostRadiusScales, 1);
      const pairStarNodes = pairHostStars.map((entry, index) => {
        const radiusScale = Math.sqrt(hostRadiusScales[index] / maxHostRadiusScale);
        const visualRadius = clamp(
          starR * (0.56 + 0.28 * radiusScale),
          Math.max(4, starR * 0.42),
          Math.max(8, starR * 0.9),
        );
        const liveNode = livePairOrbit?.starNodes?.[index] || null;
        const mappedOrbitPx =
          Number.isFinite(Number(liveNode?.orbitSemiMajorPx)) &&
          Number(liveNode.orbitSemiMajorPx) > 0
            ? Number(liveNode.orbitSemiMajorPx)
            : mapAuToPx(Math.max(0, Number(entry.barycentricOrbitAu) || 0), minAu, maxAu, maxR, {
                logScale: isLogScale(),
              });
        let offsetPx = mappedOrbitPx;
        if (!(offsetPx > 0)) offsetPx = 0;
        const direction = index % 2 === 0 ? -1 : 1;
        return {
          ...entry,
          direction,
          mappedOrbitPx,
          offsetPx,
          screenX:
            Number.isFinite(Number(liveNode?.screenX)) && livePairOrbit
              ? Number(liveNode.screenX)
              : cx + direction * offsetPx,
          screenY:
            Number.isFinite(Number(liveNode?.screenY)) && livePairOrbit
              ? Number(liveNode.screenY)
              : cy,
          depth:
            Number.isFinite(Number(liveNode?.depth)) && livePairOrbit ? Number(liveNode.depth) : 0,
          orbitEccentricity:
            Number.isFinite(Number(liveNode?.orbitEccentricity)) && livePairOrbit
              ? Number(liveNode.orbitEccentricity)
              : 0,
          orbitInclinationDeg:
            Number.isFinite(Number(liveNode?.orbitInclinationDeg)) && livePairOrbit
              ? Number(liveNode.orbitInclinationDeg)
              : 0,
          orbitArgPeriapsisDeg:
            Number.isFinite(Number(liveNode?.orbitArgPeriapsisDeg)) && livePairOrbit
              ? Number(liveNode.orbitArgPeriapsisDeg)
              : 0,
          visualRadius,
        };
      });
      if (!livePairOrbit && pairStarNodes.length >= 2) {
        const left = pairStarNodes[0];
        const right = pairStarNodes[1];
        const gap = Math.abs(right.screenX - left.screenX);
        const minGap = left.visualRadius + right.visualRadius + 22;
        if (gap < minGap) {
          const extra = (minGap - gap) * 0.5;
          left.screenX -= extra;
          right.screenX += extra;
        }
      }
      const pairEnvelopeRadius = pairStarNodes.reduce(
        (maxRadius, entry) =>
          Math.max(
            maxRadius,
            Math.hypot(entry.screenX - cx, Number(entry.screenY || cy) - cy) + entry.visualRadius,
          ),
        starR,
      );
      starHitRadius = Math.max(starHitRadius, pairEnvelopeRadius);
      if (livePairOrbit) {
        for (const entry of pairStarNodes) {
          if (!(Number(entry.mappedOrbitPx) > 3)) continue;
          nativeThree.systemGroup.add(
            projectedEllipseOrbitLine(
              entry.mappedOrbitPx,
              entry.orbitEccentricity,
              entry.orbitArgPeriapsisDeg,
              entry.orbitInclinationDeg,
              0x7284a2,
              0.12,
              180,
              -1.26,
            ),
          );
        }
      } else {
        const pairOrbitRadiiPx = [
          ...new Set(
            pairStarNodes
              .map((entry) => Number(entry.mappedOrbitPx))
              .filter((radius) => Number.isFinite(radius) && radius > 3)
              .map((radius) => Number(radius.toFixed(3))),
          ),
        ];
        for (const radiusPx of pairOrbitRadiiPx) {
          nativeThree.systemGroup.add(projectedOrbitLine(radiusPx, 0x7284a2, 0.12, 180, 0, -1.26));
        }
      }
      if (pairStarNodes.length >= 2) {
        addScreenLine(
          pairStarNodes[0].screenX,
          Number(pairStarNodes[0].screenY || cy),
          pairStarNodes[1].screenX,
          Number(pairStarNodes[1].screenY || cy),
          0x627593,
          0.16,
          -1.21,
        );
      }
      const barycenterCore = new THREE.Mesh(
        new THREE.CircleGeometry(Math.max(0.7, starR * 0.06), 20),
        new THREE.MeshBasicMaterial({
          color: 0xdbe8ff,
          transparent: true,
          opacity: 0.44,
          depthWrite: false,
          depthTest: false,
        }),
      );
      barycenterCore.position.set(center.x, center.y, -0.88);
      nativeThree.systemGroup.add(barycenterCore);
      const renderPairStarNodes = livePairOrbit
        ? [...pairStarNodes].sort(
            (left, right) => Number(left.depth || 0) - Number(right.depth || 0),
          )
        : pairStarNodes;
      for (const entry of renderPairStarNodes) {
        const entryVisualStyle = getStarVisualStyle({
          regime: entry.regime,
          tempK: entry.tempK,
          massMsol: entry.massMsol,
        });
        const entryTint = parseHexColorNumber(entry.starColourHex, starTint);
        const entryRimTint = parseHexColorNumber(
          mixHex(
            entry.starColourHex,
            entryVisualStyle.rimWarmHex,
            Math.max(entryVisualStyle.faculaMix, 0.12),
          ),
          entryTint,
        );
        const entryCoreTint = parseHexColorNumber(
          mixHex(entry.starColourHex, "#fff7e7", Math.max(entryVisualStyle.coreMix + 0.18, 0.18)),
          entryTint,
        );
        const entrySurfaceSeed = getStarSurfaceSeed({
          starSeed:
            entry.seed ||
            `${entry.name || "Star"}:${Number(entry.tempK || 5776).toFixed(0)}:${Number(entry.ageGyr || 4.6).toFixed(2)}`,
          starName: entry.name,
          starTempK: entry.tempK,
          starAgeGyr: entry.ageGyr,
        });
        const entrySurfaceTex = getNativeProceduralTexture(
          `star-surface:v3:${entry.starColourHex}:${entrySurfaceSeed}:${Math.round(Number(entry.tempK) || 5776)}:${Math.round(starActivity * 100)}`,
          (cctx, size) => {
            paintStarSurfaceTexture(cctx, size, {
              baseHex: entry.starColourHex,
              seed: entrySurfaceSeed,
              tempK: entry.tempK,
              activity: starActivity,
              regime: entry.regime,
              massMsol: entry.massMsol,
            });
          },
          384,
        );
        const entryCenter = toThreeXY(metrics, entry.screenX, Number(entry.screenY || cy));
        addStarSprite({
          tex: starGlowTex,
          radius: Math.max(
            8,
            entry.visualRadius * (2.35 + 0.16 * glowPulse) * entryVisualStyle.glowRadiusScale,
          ),
          opacity: 0.16 * entryVisualStyle.glowOpacityScale,
          z: -1.34,
          x: entryCenter.x,
          y: entryCenter.y,
          color: entryTint,
          blending: THREE.AdditiveBlending,
        });
        addStarSprite({
          tex: starGlowTex,
          radius: Math.max(
            5.5,
            entry.visualRadius * (1.7 + 0.12 * glowPulse) * entryVisualStyle.glowRadiusScale,
          ),
          opacity: 0.23 * entryVisualStyle.glowOpacityScale,
          z: -1.16,
          x: entryCenter.x,
          y: entryCenter.y,
          color: entryTint,
          blending: THREE.AdditiveBlending,
        });
        addStarSprite({
          tex: entrySurfaceTex,
          radius: Math.max(2, entry.visualRadius * 1.02),
          opacity: 0.99,
          z: -0.98,
          x: entryCenter.x,
          y: entryCenter.y,
          color: 0xffffff,
          blending: THREE.NormalBlending,
          rotation:
            state.simTime * 0.0042 +
            entry.direction * 0.05 +
            hashUnit(`${entrySurfaceSeed}:surface-rotation`) * Math.PI * 2,
        });
        addStarSprite({
          tex: starGlowTex,
          radius: Math.max(2.5, entry.visualRadius * 1.1),
          opacity: 0.3 * entryVisualStyle.rimOpacityScale,
          z: -0.94,
          x: entryCenter.x,
          y: entryCenter.y,
          color: entryRimTint,
          blending: THREE.AdditiveBlending,
        });
        addStarSprite({
          tex: starGlowTex,
          radius: Math.max(1.2, entry.visualRadius * 0.52),
          opacity: 0.36 * entryVisualStyle.haloOpacityScale,
          z: -0.91,
          x: entryCenter.x,
          y: entryCenter.y,
          color: entryCoreTint,
          blending: THREE.AdditiveBlending,
        });
      }
    }
    registerHit("star", "home", cx, cy, starHitRadius);
    const canRenderBursts = !pairHostView && (state.isPlaying || state.exportingGif);
    const activeBurstCount = Array.isArray(state.starBursts) ? state.starBursts.length : 0;
    let nativeVisibleBurstCount = 0;
    let nativeVisibleCmeCount = 0;
    let nativeVisibleLoopBurstCount = 0;
    let nativeVisibleSurfaceBurstCount = 0;
    if (canRenderBursts && activeBurstCount) {
      for (const burst of state.starBursts) {
        const ttl = Number.isFinite(burst?.ttl) && burst.ttl > 0 ? burst.ttl : 1;
        const t = clamp((Number(burst?.age) || 0) / ttl, 0, 1);
        const fade = Math.sin(Math.PI * t) * Math.max(0.02, Number(burst?.intensity) || 0.1);
        if (!(fade > 0.001)) continue;
        nativeVisibleBurstCount += 1;
        if (burst?.hasLoops !== false) nativeVisibleLoopBurstCount += 1;
        if (burst?.type === "cme") nativeVisibleCmeCount += 1;
        if (burst?.type === "surface") nativeVisibleSurfaceBurstCount += 1;
        const burstAngle = Number(burst?.angle) || 0;
        const burstReach = Number.isFinite(burst?.reach) ? burst.reach : 0.7;
        const burstSpread = Number.isFinite(burst?.spread) ? burst.spread : 0.08;
        const energyNorm = clamp(
          Number(burst?.energyNorm) || flareEnergyNorm(burst?.energyErg),
          0,
          1,
        );
        const activityNorm = clamp(Number(burst?.activityNorm) || 0, 0, 1);
        const hasLoops = burst?.hasLoops !== false;
        const loopRise = clamp(Number(burst?.loopRise) || 0.7, 0.45, 1.35);
        const loopCount = clamp(
          Number.isFinite(Number(burst?.loops))
            ? Number(burst.loops)
            : burst?.type === "cme"
              ? 3
              : 2,
          1,
          burst?.type === "cme" ? 8 : 6,
        );
        const isCme = burst?.type === "cme";
        const isSurface = burst?.type === "surface";
        const rInner = starR * 1.03;
        const rSpan = starR * burstReach * STAR_BURST_SIZE_SCALE;
        const radialStartNorm = clamp(
          Number(burst?.radialStartNorm) || (isCme ? 0.32 : 0.1),
          0.04,
          3,
        );
        const radialEndNormRaw = Number(burst?.radialEndNorm);
        const radialEndNorm = Math.max(
          radialStartNorm + 0.05,
          Number.isFinite(radialEndNormRaw) ? radialEndNormRaw : isCme ? 1.5 : 0.75,
        );
        const radialNorm = radialStartNorm + (radialEndNorm - radialStartNorm) * t;
        const spreadBase = burstSpread * STAR_BURST_SIZE_SCALE;
        const spread = spreadBase * (isCme ? 1.22 - 0.28 * t : 1 - 0.25 * t);
        const dirX = Math.cos(burstAngle);
        const dirY = Math.sin(burstAngle);
        const plumeStretch = clamp(Number(burst?.plumeStretch) || 1, 0.6, 2.8);

        if (isSurface) {
          const surfaceRadiusNorm = clamp(Number(burst?.surfaceRadiusNorm) || 0.5, 0.02, 0.92);
          const surfaceSpotScale = clamp(Number(burst?.surfaceSpotScale) || 1, 0.5, 1.8);
          const px = cx + dirX * (starR * surfaceRadiusNorm);
          const py = cy + dirY * (starR * surfaceRadiusNorm);
          const spotPos = toThreeXY(metrics, px, py);
          const tangentialRotation = -burstAngle + Math.PI * 0.5;
          const spotSize = Math.max(0.85, starR * (0.018 + 0.02 * energyNorm) * surfaceSpotScale);
          const halo = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: flareKnotTex || flarePlumeTex || null,
              color: flareLoopTint,
              transparent: true,
              opacity: Math.min(0.62, fade * (0.75 + energyNorm * 0.5)),
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          halo.position.set(spotPos.x, spotPos.y, -0.83);
          halo.scale.set(spotSize * 2.1, spotSize * 1.3, 1);
          halo.material.rotation = tangentialRotation;
          nativeThree.systemGroup.add(halo);

          const core = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: flareKnotTex || null,
              color: flareLoopCoreTint,
              transparent: true,
              opacity: Math.min(0.95, fade * 1.35),
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          core.position.set(spotPos.x, spotPos.y, -0.8295);
          core.scale.set(spotSize * 0.9, spotSize * 0.9, 1);
          nativeThree.systemGroup.add(core);
          continue;
        }

        if (isCme) {
          const cmeScale = STAR_CME_RENDER_SCALE;
          const cmeSpread = spread * (1.15 + 0.24 * energyNorm) * cmeScale;
          const rOuter = rInner + rSpan * radialNorm * cmeScale * (1.05 + 0.2 * energyNorm);
          const midR = rInner + (rOuter - rInner) * (0.58 + 0.08 * Math.sin(t * Math.PI));
          const plumePos = toThreeXY(metrics, cx + dirX * midR, cy + dirY * midR);

          const plume = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: flarePlumeTex || cmeCloudTex || null,
              color: flareLoopTint,
              transparent: true,
              opacity: Math.min(0.5, fade * (0.95 + 0.22 * energyNorm)),
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          plume.position.set(plumePos.x, plumePos.y, -0.845);
          plume.material.rotation = -burstAngle;
          plume.scale.set(
            Math.max(3.4, (rOuter - rInner) * (1.4 + cmeSpread * 5.6) * plumeStretch),
            Math.max(2.4, (rOuter - rInner) * (0.7 + 0.25 * energyNorm)),
            1,
          );
          nativeThree.systemGroup.add(plume);

          const plumeCore = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: flareKnotTex || flarePlumeTex || null,
              color: flareLoopCoreTint,
              transparent: true,
              opacity: Math.min(0.82, fade * 1.35),
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          plumeCore.position.set(plumePos.x, plumePos.y, -0.8446);
          plumeCore.material.rotation = -burstAngle;
          plumeCore.scale.set(
            Math.max(1.9, (rOuter - rInner) * (0.62 + 0.18 * energyNorm)),
            Math.max(1.6, (rOuter - rInner) * (0.36 + 0.12 * energyNorm)),
            1,
          );
          nativeThree.systemGroup.add(plumeCore);

          const cmeLoopCount = clamp(loopCount + 2, 3, 10);
          for (let li = 0; li < cmeLoopCount; li += 1) {
            const u = (li + 1) / (cmeLoopCount + 1);
            const loopCenterA =
              burstAngle +
              (u - 0.5) * cmeSpread * 1.7 +
              (Number(burst?.curl) || 0) * (0.55 - 0.2 * u) * (1 - t);
            const footDelta = Math.max(
              cmeSpread * (0.32 + (1 - u) * 0.95),
              0.05 + energyNorm * 0.05,
            );
            const leftA = loopCenterA - footDelta;
            const rightA = loopCenterA + footDelta;
            const leftR = rInner * (1 + li * 0.006);
            const rightR = rInner * (1 + li * 0.006);
            const extraLift = starR * (0.06 + energyNorm * 0.08) * (1 - u * 0.55);
            const apexR =
              rInner +
              (rOuter - rInner) * clamp((0.62 + loopRise * 0.4) * (0.74 + 0.26 * u), 0.45, 1.3) +
              extraLift;
            const apexA = loopCenterA + (Number(burst?.curl) || 0) * (0.45 + u * 0.45) * (1 - t);
            const sx = cx + Math.cos(leftA) * leftR;
            const sy = cy + Math.sin(leftA) * leftR;
            const ex = cx + Math.cos(rightA) * rightR;
            const ey = cy + Math.sin(rightA) * rightR;
            const mx = cx + Math.cos(apexA) * apexR;
            const my = cy + Math.sin(apexA) * apexR;
            addBurstLoopArcNative(
              sx,
              sy,
              mx,
              my,
              ex,
              ey,
              fade * (0.34 + 0.24 * (1 - u)) * (0.92 + activityNorm * 0.42),
              fade * (0.52 + 0.3 * (1 - u)),
              -0.852 + li * 0.00045,
              Math.max(1.15, starR * (0.015 + (1 - u) * 0.007 + energyNorm * 0.004)),
            );
          }

          const streamerCount = clamp(Math.round(2 + energyNorm * 3.2 + activityNorm * 1.6), 2, 7);
          for (let si = 0; si < streamerCount; si += 1) {
            const u = (si + 0.5) / streamerCount;
            const footA = burstAngle + (u - 0.5) * cmeSpread * 0.95;
            const headA = burstAngle + (u - 0.5) * cmeSpread * 1.35;
            const footR = rInner * (1 + u * 0.02);
            const headR = rInner + (rOuter - rInner) * (0.42 + 0.5 * u);
            const ctrlR =
              footR + (headR - footR) * (0.44 + 0.28 * u) + starR * (0.06 + 0.05 * energyNorm);
            const ctrlA =
              (footA + headA) * 0.5 + (Number(burst?.curl) || 0) * (0.52 + 0.22 * u) * (1 - t);
            const sx = cx + Math.cos(footA) * footR;
            const sy = cy + Math.sin(footA) * footR;
            const ex = cx + Math.cos(headA) * headR;
            const ey = cy + Math.sin(headA) * headR;
            const mx = cx + Math.cos(ctrlA) * ctrlR;
            const my = cy + Math.sin(ctrlA) * ctrlR;
            addCmePlasmaTrailNative({
              sx,
              sy,
              mx,
              my,
              ex,
              ey,
              opacity: fade * (0.16 + 0.14 * (1 - u)),
              plumeSize: Math.max(0.9 * cmeScale, starR * (0.028 + (1 - u) * 0.016) * cmeScale),
              jitterPhase: (Number(burst?.plumeNoise) || 0) + si * 0.77 + t * 3.4,
              jitterAmp: starR * 0.018 * (1 - u * 0.5),
              zBase: -0.846 + si * 0.0002,
              color: flareLoopTint,
              lineColor: flareLoopCoreTint,
            });
          }

          const footPos = toThreeXY(
            metrics,
            cx +
              Math.cos(burstAngle + (Number(burst?.curl) || 0) * 0.16 * (1 - t)) * (rInner + 1.5),
            cy +
              Math.sin(burstAngle + (Number(burst?.curl) || 0) * 0.16 * (1 - t)) * (rInner + 1.5),
          );
          const footGlow = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: flareKnotTex || null,
              color: flareLoopCoreTint,
              transparent: true,
              opacity: Math.min(0.78, fade * 1.6),
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          const footSize = Math.max(1.4, starR * (0.044 + energyNorm * 0.016));
          footGlow.position.set(footPos.x, footPos.y, -0.842);
          footGlow.scale.set(footSize, footSize, 1);
          nativeThree.systemGroup.add(footGlow);

          const rimPos = toThreeXY(metrics, cx + dirX * rOuter, cy + dirY * rOuter);
          const rim = new THREE.Mesh(
            new THREE.CircleGeometry(Math.max(0.55, starR * 0.029), 20),
            new THREE.MeshBasicMaterial({
              color: flareRimTint,
              transparent: true,
              opacity: Math.min(0.56, fade * (0.56 + energyNorm * 0.16)),
              depthWrite: false,
              depthTest: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          rim.position.set(rimPos.x, rimPos.y, -0.841);
          nativeThree.systemGroup.add(rim);
          continue;
        }

        const rOuter = rInner + rSpan * radialNorm;
        const midR = rInner + (rOuter - rInner) * 0.52;
        const flarePos = toThreeXY(metrics, cx + dirX * midR, cy + dirY * midR);
        const flareMat = new THREE.SpriteMaterial({
          map: flarePlumeTex || null,
          color: flareLoopTint,
          transparent: true,
          opacity: Math.min(0.44, fade * 0.9 + 0.03),
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
        });
        flareMat.rotation = -burstAngle;
        const flare = new THREE.Sprite(flareMat);
        flare.position.set(flarePos.x, flarePos.y, -0.86);
        flare.scale.set(
          Math.max(2.6, (rOuter - rInner) * (0.95 + spread * 9.5) * plumeStretch),
          Math.max(2.1, (rOuter - rInner) * (0.45 + energyNorm * 0.18)),
          1,
        );
        nativeThree.systemGroup.add(flare);

        if (hasLoops) {
          for (let li = 0; li < loopCount; li += 1) {
            const u = (li + 1) / (loopCount + 1);
            const loopCenterA =
              burstAngle +
              (u - 0.5) * spread * 1.55 +
              (Number(burst?.curl) || 0) * (0.58 - 0.2 * u) * (1 - t);
            const minLoopHalfAngle = (0.05 + energyNorm * 0.05) * (0.85 + 0.25 * (1 - u));
            const footDelta = Math.max(spread * (0.34 + (1 - u) * 0.9), minLoopHalfAngle);
            const leftA = loopCenterA - footDelta;
            const rightA = loopCenterA + footDelta;
            const leftR = rInner * (1 + li * 0.008);
            const rightR = rInner * (1 + li * 0.008);
            const extraLift = starR * (0.035 + energyNorm * 0.055) * (1 - u * 0.6);
            const apexR =
              rInner +
              (rOuter - rInner) * clamp((0.56 + loopRise * 0.36) * (0.7 + 0.3 * u), 0.42, 1.2) +
              extraLift;
            const apexA = loopCenterA + (Number(burst?.curl) || 0) * (0.42 + u * 0.52) * (1 - t);
            const sx = cx + Math.cos(leftA) * leftR;
            const sy = cy + Math.sin(leftA) * leftR;
            const ex = cx + Math.cos(rightA) * rightR;
            const ey = cy + Math.sin(rightA) * rightR;
            const mx = cx + Math.cos(apexA) * apexR;
            const my = cy + Math.sin(apexA) * apexR;
            addBurstLoopArcNative(
              sx,
              sy,
              mx,
              my,
              ex,
              ey,
              fade * (0.34 + 0.24 * (1 - u)) * (0.85 + activityNorm * 0.5),
              fade * (0.5 + 0.3 * (1 - u)),
              -0.852 + li * 0.0005,
              Math.max(1.05, starR * (0.013 + (1 - u) * 0.006 + energyNorm * 0.004)),
            );
          }
        }

        const footPos = toThreeXY(
          metrics,
          cx + Math.cos(burstAngle + (Number(burst?.curl) || 0) * 0.16 * (1 - t)) * (rInner + 1.3),
          cy + Math.sin(burstAngle + (Number(burst?.curl) || 0) * 0.16 * (1 - t)) * (rInner + 1.3),
        );
        const footGlow = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: flareKnotTex || null,
            color: flareLoopCoreTint,
            transparent: true,
            opacity: Math.min(0.72, fade * 1.5),
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        const footSizeClamped = Math.max(1.3, starR * (0.038 + energyNorm * 0.014));
        footGlow.position.set(footPos.x, footPos.y, -0.84);
        footGlow.scale.set(footSizeClamped, footSizeClamped, 1);
        nativeThree.systemGroup.add(footGlow);

        const rimPos = toThreeXY(metrics, cx + dirX * rOuter, cy + dirY * rOuter);
        const rim = new THREE.Mesh(
          new THREE.CircleGeometry(Math.max(0.45, starR * 0.026), 18),
          new THREE.MeshBasicMaterial({
            color: flareRimTint,
            transparent: true,
            opacity: Math.min(0.5, fade * (0.48 + energyNorm * 0.14)),
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        rim.position.set(rimPos.x, rimPos.y, -0.84);
        nativeThree.systemGroup.add(rim);

        // CME visuals are rendered in their own branch above.
      }
    }
    if (activeBurstCount > 0 || nativeVisibleBurstCount > 0) {
      dbgThrottled(debugOn, "flare:draw:native", 800, "flare:draw:native", {
        canRenderBursts,
        isPlaying: !!state.isPlaying,
        exportingGif: !!state.exportingGif,
        activeBursts: activeBurstCount,
        visibleBursts: nativeVisibleBurstCount,
        visibleLoopBursts: nativeVisibleLoopBurstCount,
        visibleCmes: nativeVisibleCmeCount,
        visibleSurfaceBursts: nativeVisibleSurfaceBurstCount,
        starR: Number(starR.toFixed(3)),
      });
    }
    if (chkLabels?.checked) {
      addDraggableLabelNative({
        key: "star:home",
        line1: pairHostView
          ? `${snapshot.activeHostFrameLabel || snapshot.starName || "Pair"} barycenter`
          : snapshot.starName || "Star",
        anchorX: cx,
        anchorY: cy,
        defaultX: cx + Math.max(16, starHitRadius * 1.08) - 6,
        defaultY: cy - 14 - 10,
        z: 8,
        leaderRadius: Math.max(starR, starHitRadius),
        color1: hexToRgba(mixHex(snapshot.starColourHex, "#fff5d7", 0.5), 0.92),
        priority: 100,
      });
    }

    function registerHit(kind, id, x, y, r, data) {
      state.bodyHitRegions.push({
        kind,
        id,
        x,
        y,
        r,
        data,
      });
    }

    const nativePlanetRenderNodes = [];
    const nativeGasRenderNodes = [];

    for (const p of planetNodes || []) {
      const placement = computePlanetPlacement(p, metrics);
      if (!placement) continue;
      const pPos = orbitOffsetToScreen(placement.ox, placement.oy, cx, cy, placement.oyVert || 0);
      if (!Number.isFinite(pPos.x) || !Number.isFinite(pPos.y)) continue;
      const pr = nativePlanetRadiusPx(p, metrics);
      const pos = toThreeXY(metrics, pPos.x, pPos.y);
      const bodyZ = pPos.depth < 0 ? -1.6 : 2.2;
      const planetRotationHours = Number(p.rotationPeriodHours);
      const planetRotationDays =
        Number.isFinite(planetRotationHours) && planetRotationHours > 0
          ? planetRotationHours / 24
          : null;
      const planetAxialTiltDeg = normalizeAxialTiltDeg(p.axialTiltDeg);
      const planetSpinAngle = computeSpinAngleRad(p.id, planetRotationDays, planetAxialTiltDeg);
      if (usePhysicalSize && pr < PHYS_VIS_THRESHOLD_PX) {
        addPositionIndicatorNative(pPos.x, pPos.y, 0x9ec4ff, bodyZ + 0.8);
      } else {
        const vizKey = vizBodyCacheKey("rocky", p);
        const meshModel = {
          bodyType: "rocky",
          visualProfile: p.visualProfile,
          ringAppearance: p.ringAppearance,
          axialTiltDeg: planetAxialTiltDeg,
        };
        positionBodyMesh(
          vizKey,
          meshModel,
          pos,
          bodyZ,
          pr,
          p.id,
          planetAxialTiltDeg,
          planetSpinAngle,
          bodyMeshTouched,
          ringLightVectorForOrbit(placement.ox, placement.oy, placement.oyVert || 0),
        );
        if (chkRotation?.checked) {
          addRotationOverlayNative(
            pPos.x,
            pPos.y,
            Math.max(pr, 0.5),
            p.id,
            planetAxialTiltDeg,
            planetSpinAngle,
            bodyZ + 0.5,
          );
        }
        if (chkAxialTilt?.checked) {
          addAxialTiltOverlayNative(
            pPos.x,
            pPos.y,
            Math.max(pr, 0.5),
            p.id,
            planetAxialTiltDeg,
            bodyZ + 0.45,
          );
        }
      }
      addBodyLabelNative(
        p.name || "Planet",
        `${Number(p.au || 0).toFixed(2)} AU`,
        pPos.x,
        pPos.y,
        Math.max(pr, 2),
        9,
        `planet:${p.id}`,
        80,
      );
      registerHit("planet", p.id, pPos.x, pPos.y, Math.max(10, pr + 3), p);

      if (chkMoons?.checked && Array.isArray(p.moons)) {
        const n = p.moons.length;
        const moonAxes = p.moons
          .map((m) => Number(m.semiMajorAxisKm))
          .filter((v) => Number.isFinite(v) && v > 0);
        const minMoonAxis = moonAxes.length ? Math.min(...moonAxes) : null;
        const maxMoonAxis = moonAxes.length ? Math.max(...moonAxes) : null;
        const moonBand = Math.max(pr * 0.6, 8 * (n - 1), 12);
        const orbitInner = pr + Math.max(10, pr * 0.2);
        const useEccentricMoons = chkEccentric?.checked === true;
        const planetKm =
          Number.isFinite(p.radiusKm) && p.radiusKm > 0
            ? Number(p.radiusKm)
            : Number.isFinite(p.radiusEarth) && p.radiusEarth > 0
              ? p.radiusEarth * EARTH_RADIUS_KM
              : EARTH_RADIUS_KM;

        for (let i = 0; i < n; i += 1) {
          const moon = p.moons[i];
          const moonAxis = Number(moon.semiMajorAxisKm);
          // Compute moon pixel radius early so orbit can clear the body.
          const moonR = usePhysicalSize
            ? physicalRadiusToPx(
                Number(moon.radiusKm),
                metrics.starR,
                metrics.starRadiusKm,
                0,
                Infinity,
              )
            : representativeMoonR(moon.radiusKm, planetKm, pr);
          let orbitR = orbitInner + i * 8;
          if (
            Number.isFinite(moonAxis) &&
            Number.isFinite(minMoonAxis) &&
            Number.isFinite(maxMoonAxis) &&
            maxMoonAxis > minMoonAxis
          ) {
            const t =
              (Math.log10(moonAxis) - Math.log10(minMoonAxis)) /
              (Math.log10(maxMoonAxis) - Math.log10(minMoonAxis));
            orbitR = orbitInner + t * moonBand;
          }
          const mEcc = useEccentricMoons ? clamp(Number(moon.eccentricity) || 0, 0, 0.99) : 0;
          const mIncDeg = useEccentricMoons ? Number(moon.inclinationDeg) || 0 : 0;
          const mArgW = Number(moon.longitudeOfPeriapsisDeg) || 0;
          // Ensure the periapsis clears the parent body.
          orbitR = Math.max(orbitR, (pr + moonR + 6) / (1 - mEcc));
          if (chkOrbits?.checked) {
            const moonRing =
              useEccentricMoons && mEcc > 0
                ? projectedEllipseOrbitLine(
                    orbitR,
                    mEcc,
                    mArgW,
                    mIncDeg,
                    0x64708a,
                    0.22,
                    120,
                    bodyZ - 0.2,
                    pPos.x,
                    pPos.y,
                  )
                : projectedOrbitLine(
                    orbitR,
                    0x64708a,
                    0.22,
                    120,
                    mIncDeg,
                    bodyZ - 0.2,
                    pPos.x,
                    pPos.y,
                  );
            nativeThree.systemGroup.add(moonRing);
            if (chkPeAp?.checked && useEccentricMoons && mEcc > 0.01) {
              addApsisMarkersNative(
                orbitR,
                mEcc,
                mArgW,
                mIncDeg,
                chkLabels?.checked,
                pPos.x,
                pPos.y,
              );
            }
          }

          const baseMa = (i / n) * Math.PI * 2 + placement.baseAngle * 0.35;
          const mp = Number(moon.periodDays);
          const omegaM =
            Number.isFinite(mp) && mp > 0 ? (2 * Math.PI) / mp : (2 * Math.PI) / (6 + i * 2.5);
          let mox;
          let moy;
          if (useEccentricMoons && mEcc > 0) {
            const M = baseMa + omegaM * state.simTime;
            const Ea = solveKeplerEquation(M, mEcc);
            const mA = orbitR;
            const mB = mA * Math.sqrt(1 - mEcc * mEcc);
            const mCFocus = mA * mEcc;
            const argWRad = (mArgW * Math.PI) / 180;
            const cosW = Math.cos(argWRad);
            const sinW = Math.sin(argWRad);
            const xf = mA * Math.cos(Ea) - mCFocus;
            const zf = mB * Math.sin(Ea);
            mox = xf * cosW - zf * sinW;
            moy = xf * sinW + zf * cosW;
          } else {
            const ma = baseMa + omegaM * state.simTime;
            mox = Math.cos(ma) * orbitR;
            moy = Math.sin(ma) * orbitR;
          }
          const mIncRad = (mIncDeg * Math.PI) / 180;
          const moyVert = moy * Math.sin(mIncRad);
          const moyFlat = moy * Math.cos(mIncRad);
          const mProj = orbitOffsetToScreen(mox, moyFlat, pPos.x, pPos.y, moyVert);
          const mpos = toThreeXY(metrics, mProj.x, mProj.y);
          // Offset past the parent's 3-D sphere so the depth test passes.
          const moonZ = mProj.depth < 0 ? bodyZ - pr - moonR - 1 : bodyZ + pr + moonR + 1;
          const moonRotationDays = Number(moon.rotationPeriodDays);
          const moonAxialTiltDeg = normalizeAxialTiltDeg(moon.axialTiltDeg);
          const moonSpinAngle = computeSpinAngleRad(moon.id, moonRotationDays, moonAxialTiltDeg);
          if (usePhysicalSize && moonR < PHYS_VIS_THRESHOLD_PX) {
            addPositionIndicatorNative(mProj.x, mProj.y, 0xc8c6c3, moonZ + 0.2);
          } else {
            const mVizKey = vizBodyCacheKey("moon", moon);
            const mModel = {
              bodyType: "moon",
              moonCalc: moon.moonCalc,
              axialTiltDeg: moonAxialTiltDeg,
            };
            positionBodyMesh(
              mVizKey,
              mModel,
              mpos,
              moonZ,
              Math.max(moonR, 0.5),
              moon.id,
              moonAxialTiltDeg,
              moonSpinAngle,
              bodyMeshTouched,
              ringLightVectorForOrbit(
                Number(placement.ox || 0) + Number(mox || 0),
                Number(placement.oy || 0) + Number(moyFlat || 0),
                Number(placement.oyVert || 0) + Number(moyVert || 0),
              ),
            );
            if (chkRotation?.checked) {
              addRotationOverlayNative(
                mProj.x,
                mProj.y,
                Math.max(moonR, 0.5),
                moon.id,
                moonAxialTiltDeg,
                moonSpinAngle,
                moonZ + 0.45,
              );
            }
            if (chkAxialTilt?.checked) {
              addAxialTiltOverlayNative(
                mProj.x,
                mProj.y,
                Math.max(moonR, 0.5),
                moon.id,
                moonAxialTiltDeg,
                moonZ + 0.4,
              );
            }
          }
          if (showMoonLabels && moon?.name) {
            addDraggableLabelNative({
              key: `moon:${moon.id}`,
              line1: moon.name,
              anchorX: mProj.x,
              anchorY: mProj.y,
              defaultX: mProj.x + Math.max(8, Math.max(moonR, 0.5) + 3) - 6,
              defaultY: mProj.y + 5 - 10,
              z: 9,
              leaderRadius: Math.max(1, moonR),
              font1: "10px system-ui, sans-serif",
              color1: "rgba(200,208,226,0.72)",
              priority: 20,
              opacity: moonLabelOpacity,
            });
          }
          registerHit("moon", moon.id, mProj.x, mProj.y, Math.max(10, moonR + 3), moon);
        }
      }

      nativePlanetRenderNodes.push({ p, placement, pPos, pr });
    }

    for (let gi = 0; gi < (gasGiants || []).length; gi += 1) {
      const g = gasGiants[gi];
      const placement = computeGasGiantPlacement(g, gi, metrics, snapshot.starMassMsol);
      if (!placement) continue;
      const gPos = orbitOffsetToScreen(placement.ox, placement.oy, cx, cy);
      if (!Number.isFinite(gPos.x) || !Number.isFinite(gPos.y)) continue;
      const gr = nativeGasRadiusPx(g, metrics);
      const pos = toThreeXY(metrics, gPos.x, gPos.y);
      const bodyZ = gPos.depth < 0 ? -1.55 : 2.15;
      const gasRotationHours = Number(g.rotationPeriodHours);
      const gasRotationDays =
        Number.isFinite(gasRotationHours) && gasRotationHours > 0 ? gasRotationHours / 24 : null;
      const gasAxialTiltDeg = normalizeAxialTiltDeg(g.axialTiltDeg ?? 0);
      const gasSpinAngle = computeSpinAngleRad(g.id, gasRotationDays, gasAxialTiltDeg);
      const isBrownDwarfRender = g.renderModel === "brownDwarfStar" && !!g.starVisual;
      if (usePhysicalSize && gr < PHYS_VIS_THRESHOLD_PX) {
        addPositionIndicatorNative(
          gPos.x,
          gPos.y,
          isBrownDwarfRender
            ? parseHexColorNumber(g.starVisual?.starColourHex, 0x7a495f)
            : 0xe6bf88,
          bodyZ + 0.7,
        );
      } else if (isBrownDwarfRender) {
        const brownDwarfVisual = g.starVisual;
        const brownDwarfStyle = getStarVisualStyle({
          regime: brownDwarfVisual.regime,
          tempK: brownDwarfVisual.starTempK,
          massMsol: brownDwarfVisual.starMassMsol,
        });
        const brownDwarfTint = parseHexColorNumber(brownDwarfVisual.starColourHex, 0x7a495f);
        const brownDwarfRimTint = parseHexColorNumber(
          mixHex(
            brownDwarfVisual.starColourHex,
            brownDwarfStyle.rimWarmHex,
            Math.max(brownDwarfStyle.faculaMix, 0.12),
          ),
          brownDwarfTint,
        );
        const brownDwarfCoreTint = parseHexColorNumber(
          mixHex(
            brownDwarfVisual.starColourHex,
            "#fff7e7",
            Math.max(brownDwarfStyle.coreMix + 0.18, 0.18),
          ),
          brownDwarfTint,
        );
        const brownDwarfSeed = getStarSurfaceSeed({
          starSeed: brownDwarfVisual.seed,
          starName: brownDwarfVisual.starName,
          starTempK: brownDwarfVisual.starTempK,
          starAgeGyr: brownDwarfVisual.starAgeGyr,
        });
        const brownDwarfSurfaceTex = getNativeProceduralTexture(
          `star-surface:v3:${brownDwarfVisual.starColourHex}:${brownDwarfSeed}:${Math.round(Number(brownDwarfVisual.starTempK) || 5776)}:0`,
          (cctx, size) => {
            paintStarSurfaceTexture(cctx, size, {
              baseHex: brownDwarfVisual.starColourHex,
              seed: brownDwarfSeed,
              tempK: brownDwarfVisual.starTempK,
              activity: 0,
              regime: brownDwarfVisual.regime,
              massMsol: brownDwarfVisual.starMassMsol,
            });
          },
          384,
        );
        const brownDwarfGlowPulse =
          0.55 +
          0.45 *
            Math.sin(state.simTime * 0.08 + Number(brownDwarfVisual.starMassMsol || 0.05) * 10);
        addStarSprite({
          tex: starGlowTex,
          radius: Math.max(
            6,
            gr * (2.35 + 0.16 * brownDwarfGlowPulse) * brownDwarfStyle.glowRadiusScale,
          ),
          opacity: 0.14 * brownDwarfStyle.glowOpacityScale,
          z: bodyZ - 0.36,
          x: pos.x,
          y: pos.y,
          color: brownDwarfTint,
          blending: THREE.AdditiveBlending,
        });
        addStarSprite({
          tex: starGlowTex,
          radius: Math.max(
            4,
            gr * (1.72 + 0.12 * brownDwarfGlowPulse) * brownDwarfStyle.glowRadiusScale,
          ),
          opacity: 0.22 * brownDwarfStyle.glowOpacityScale,
          z: bodyZ - 0.16,
          x: pos.x,
          y: pos.y,
          color: brownDwarfTint,
          blending: THREE.AdditiveBlending,
        });
        addStarSprite({
          tex: brownDwarfSurfaceTex,
          radius: Math.max(1.5, gr * 1.02),
          opacity: 0.99,
          z: bodyZ,
          x: pos.x,
          y: pos.y,
          color: 0xffffff,
          blending: THREE.NormalBlending,
          rotation:
            state.simTime * 0.0042 +
            hashUnit(`${g.id}:brown-dwarf-surface`) * Math.PI * 2 +
            hashUnit(`${brownDwarfSeed}:surface-rotation`) * Math.PI * 2,
        });
        addStarSprite({
          tex: starGlowTex,
          radius: Math.max(2, gr * 1.08),
          opacity: 0.28 * brownDwarfStyle.rimOpacityScale,
          z: bodyZ + 0.03,
          x: pos.x,
          y: pos.y,
          color: brownDwarfRimTint,
          blending: THREE.AdditiveBlending,
        });
        addStarSprite({
          tex: starGlowTex,
          radius: Math.max(1, gr * 0.5),
          opacity: 0.32 * brownDwarfStyle.haloOpacityScale,
          z: bodyZ + 0.06,
          x: pos.x,
          y: pos.y,
          color: brownDwarfCoreTint,
          blending: THREE.AdditiveBlending,
        });
      } else {
        const gVizKey = vizBodyCacheKey("gas", g);
        const gModel = {
          bodyType: "gasGiant",
          styleId: g.style || "jupiter",
          showRings: !!g.rings,
          ringMode: g.ringMode,
          ringStyleId: g.ringAppearance?.ringStyleId,
          ringAppearance: g.ringAppearance,
          gasCalc: g.gasCalc,
          axialTiltDeg: gasAxialTiltDeg,
        };
        positionBodyMesh(
          gVizKey,
          gModel,
          pos,
          bodyZ,
          gr,
          g.id,
          gasAxialTiltDeg,
          gasSpinAngle,
          bodyMeshTouched,
          ringLightVectorForOrbit(placement.ox, placement.oy, placement.oyVert || 0),
        );
        if (chkRotation?.checked) {
          addRotationOverlayNative(
            gPos.x,
            gPos.y,
            Math.max(gr, 0.5),
            g.id,
            gasAxialTiltDeg,
            gasSpinAngle,
            bodyZ + 0.45,
          );
        }
        if (chkAxialTilt?.checked) {
          addAxialTiltOverlayNative(
            gPos.x,
            gPos.y,
            Math.max(gr, 0.5),
            g.id,
            gasAxialTiltDeg,
            bodyZ + 0.4,
          );
        }
      }
      addBodyLabelNative(
        g.name || g.classLabel || "Gas giant",
        `${Number(g.au || 0).toFixed(2)} AU`,
        gPos.x,
        gPos.y,
        Math.max(gr, 2),
        9,
        `gas:${g.id}`,
        70,
      );
      if (chkMoons?.checked && Array.isArray(g.moons)) {
        const n = g.moons.length;
        const moonAxes = g.moons
          .map((m) => Number(m.semiMajorAxisKm))
          .filter((v) => Number.isFinite(v) && v > 0);
        const minMoonAxis = moonAxes.length ? Math.min(...moonAxes) : null;
        const maxMoonAxis = moonAxes.length ? Math.max(...moonAxes) : null;
        const moonBand = Math.max(gr * 0.6, 8 * (n - 1), 12);
        const orbitInner = gr + Math.max(10, gr * 0.2);
        const useEccentricMoons = chkEccentric?.checked === true;
        const gasRadiusKm =
          Number.isFinite(g.radiusKm) && g.radiusKm > 0
            ? Number(g.radiusKm)
            : Number.isFinite(g.radiusRj) && g.radiusRj > 0
              ? g.radiusRj * JUPITER_RADIUS_KM
              : JUPITER_RADIUS_KM;
        for (let i = 0; i < n; i += 1) {
          const moon = g.moons[i];
          const baseAxis = Number(moon?.semiMajorAxisKm);
          // Compute moon pixel radius early so orbit can clear the body.
          const moonR = usePhysicalSize
            ? physicalRadiusToPx(
                Number(moon.radiusKm),
                metrics.starR,
                metrics.starRadiusKm,
                0,
                Infinity,
              )
            : representativeMoonR(moon.radiusKm, gasRadiusKm, gr);
          let orbitR = orbitInner + i * 8;
          if (
            Number.isFinite(baseAxis) &&
            Number.isFinite(minMoonAxis) &&
            Number.isFinite(maxMoonAxis) &&
            maxMoonAxis > minMoonAxis
          ) {
            const t =
              (Math.log10(baseAxis) - Math.log10(minMoonAxis)) /
              (Math.log10(maxMoonAxis) - Math.log10(minMoonAxis));
            orbitR = orbitInner + t * moonBand;
          }
          const mEcc = useEccentricMoons ? clamp(Number(moon.eccentricity) || 0, 0, 0.99) : 0;
          const mIncDeg = useEccentricMoons ? Number(moon.inclinationDeg) || 0 : 0;
          const mArgW = Number(moon.longitudeOfPeriapsisDeg) || 0;
          // Ensure the periapsis clears the parent body.
          orbitR = Math.max(orbitR, (gr + moonR + 6) / (1 - mEcc));
          if (chkOrbits?.checked) {
            const moonRing =
              useEccentricMoons && mEcc > 0
                ? projectedEllipseOrbitLine(
                    orbitR,
                    mEcc,
                    mArgW,
                    mIncDeg,
                    0x6d7693,
                    0.2,
                    120,
                    bodyZ - 0.2,
                    gPos.x,
                    gPos.y,
                  )
                : projectedOrbitLine(
                    orbitR,
                    0x6d7693,
                    0.2,
                    120,
                    mIncDeg,
                    bodyZ - 0.2,
                    gPos.x,
                    gPos.y,
                  );
            nativeThree.systemGroup.add(moonRing);
            if (chkPeAp?.checked && useEccentricMoons && mEcc > 0.01) {
              addApsisMarkersNative(
                orbitR,
                mEcc,
                mArgW,
                mIncDeg,
                chkLabels?.checked,
                gPos.x,
                gPos.y,
              );
            }
          }

          const baseMa = (i / n) * Math.PI * 2 + placement.angle * 0.35;
          const mp = Number(moon.periodDays);
          const omegaM =
            Number.isFinite(mp) && mp > 0 ? (2 * Math.PI) / mp : (2 * Math.PI) / (6 + i * 2.5);
          let mox;
          let moy;
          if (useEccentricMoons && mEcc > 0) {
            const M = baseMa + omegaM * state.simTime;
            const Ea = solveKeplerEquation(M, mEcc);
            const mA = orbitR;
            const mB = mA * Math.sqrt(1 - mEcc * mEcc);
            const mCFocus = mA * mEcc;
            const argWRad = (mArgW * Math.PI) / 180;
            const cosW = Math.cos(argWRad);
            const sinW = Math.sin(argWRad);
            const xf = mA * Math.cos(Ea) - mCFocus;
            const zf = mB * Math.sin(Ea);
            mox = xf * cosW - zf * sinW;
            moy = xf * sinW + zf * cosW;
          } else {
            const ma = baseMa + omegaM * state.simTime;
            mox = Math.cos(ma) * orbitR;
            moy = Math.sin(ma) * orbitR;
          }
          const mIncRad = (mIncDeg * Math.PI) / 180;
          const moyVert = moy * Math.sin(mIncRad);
          const moyFlat = moy * Math.cos(mIncRad);
          const mProj = orbitOffsetToScreen(mox, moyFlat, gPos.x, gPos.y, moyVert);
          const mpos = toThreeXY(metrics, mProj.x, mProj.y);
          // Offset past the parent's 3-D sphere so the depth test passes.
          const moonZ = mProj.depth < 0 ? bodyZ - gr - moonR - 1 : bodyZ + gr + moonR + 1;
          const moonRotationDays = Number(moon.rotationPeriodDays);
          const moonAxialTiltDeg = normalizeAxialTiltDeg(moon.axialTiltDeg);
          const moonSpinAngle = computeSpinAngleRad(moon.id, moonRotationDays, moonAxialTiltDeg);
          if (usePhysicalSize && moonR < PHYS_VIS_THRESHOLD_PX) {
            addPositionIndicatorNative(mProj.x, mProj.y, 0xc8c6c3, moonZ + 0.2);
          } else {
            const mVizKey = vizBodyCacheKey("moon", moon);
            const mModel = {
              bodyType: "moon",
              moonCalc: moon.moonCalc,
              axialTiltDeg: moonAxialTiltDeg,
            };
            positionBodyMesh(
              mVizKey,
              mModel,
              mpos,
              moonZ,
              Math.max(moonR, 0.5),
              moon.id,
              moonAxialTiltDeg,
              moonSpinAngle,
              bodyMeshTouched,
              ringLightVectorForOrbit(
                Number(placement.ox || 0) + Number(mox || 0),
                Number(placement.oy || 0) + Number(moyFlat || 0),
                Number(placement.oyVert || 0) + Number(moyVert || 0),
              ),
            );
            if (chkRotation?.checked) {
              addRotationOverlayNative(
                mProj.x,
                mProj.y,
                Math.max(moonR, 0.5),
                moon.id,
                moonAxialTiltDeg,
                moonSpinAngle,
                moonZ + 0.45,
              );
            }
            if (chkAxialTilt?.checked) {
              addAxialTiltOverlayNative(
                mProj.x,
                mProj.y,
                Math.max(moonR, 0.5),
                moon.id,
                moonAxialTiltDeg,
                moonZ + 0.4,
              );
            }
          }
          if (showMoonLabels && moon?.name) {
            addDraggableLabelNative({
              key: `moon:${moon.id}`,
              line1: moon.name,
              anchorX: mProj.x,
              anchorY: mProj.y,
              defaultX: mProj.x + Math.max(8, Math.max(moonR, 0.5) + 3) - 6,
              defaultY: mProj.y + 5 - 10,
              z: 9,
              leaderRadius: Math.max(1, moonR),
              font1: "10px system-ui, sans-serif",
              color1: "rgba(200,208,226,0.72)",
              priority: 20,
              opacity: moonLabelOpacity,
            });
          }
          registerHit("moon", moon.id, mProj.x, mProj.y, Math.max(10, moonR + 3), moon);
        }
      }
      registerHit("gasGiant", g.id, gPos.x, gPos.y, Math.max(12, gr + 4), g);
      nativeGasRenderNodes.push({ g, placement, gPos, gr });
    }

    if (chkComets?.checked && Array.isArray(comets)) {
      for (const comet of comets) {
        if (!(Number(comet?.semiMajorAxisAu) > 0)) continue;
        const cometParticles = buildCometParticleLayout({
          comet,
          seed: `${comet.id || comet.name || "comet"}:viz`,
        });
        const cometAppearance = cometParticles.appearance;
        const orbitColor = hexToColorNumber(cometAppearance.orbitHex, 0xa8d7ff);
        const comaColor = hexToColorNumber(cometAppearance.comaHex, 0xe9fbff);
        const ionTailColor = hexToColorNumber(cometAppearance.ionTailHex, 0x74d7ff);
        const dustTailColor = hexToColorNumber(cometAppearance.dustTailHex, 0xf0dcc1);
        const nucleusHaloColor = hexToColorNumber(cometAppearance.nucleusHaloHex, 0xa7edff);
        const nucleusCoreColor = hexToColorNumber(cometAppearance.nucleusCoreHex, 0xeef8ff);
        if (chkOrbits?.checked) {
          const cometOrbitArc = projectedDashedCometOrbitDashArc(
            comet,
            orbitColor,
            0.34 + cometAppearance.activityLevel * 0.14,
          );
          if (cometOrbitArc) nativeThree.systemGroup.add(cometOrbitArc);
        }

        const placement = computeCometPlacement(comet, metrics, snapshot.starMassMsol);
        const cometPos = orbitOffsetToScreen(
          placement.ox,
          placement.oy,
          cx,
          cy,
          placement.oyVert || 0,
        );
        if (!Number.isFinite(cometPos.x) || !Number.isFinite(cometPos.y)) continue;

        const futureStepDays = clamp(Number(placement.periodDays || 120) * 0.0025, 0.35, 16);
        const futurePlacement = computeSystemCometPlacement(comet, metrics, snapshot.starMassMsol, {
          mapAuToPx,
          simTime: state.simTime + futureStepDays,
          solveKeplerEquation,
        });
        const futurePos = orbitOffsetToScreen(
          futurePlacement.ox,
          futurePlacement.oy,
          cx,
          cy,
          futurePlacement.oyVert || 0,
        );

        const nucleusR = clamp((Number(comet.nucleusRadiusKm) || 1) * 0.5, 3.2, 11);
        const { antiSolarDir, dustDir } = resolveCometTailDirections({
          cometPos,
          futurePos,
          starPos: { x: cx, y: cy },
          dustBias: cometAppearance.dustBias,
        });
        const ionTailPx = mapAuSpanToPx(
          Math.max(Number(comet.currentRadiusAu) || 0.001, 0.001),
          Number(comet.ionTailLengthAu) || 0,
        );
        const dustTailPx = mapAuSpanToPx(
          Math.max(Number(comet.currentRadiusAu) || 0.001, 0.001),
          Number(comet.dustTailLengthAu) || 0,
        );
        const nucleusPos = screenToThree(cometPos.x, cometPos.y, 2.72);
        const cometZoomFade = isPhysicalScale()
          ? clamp((state.zoom - 0.28) / 0.72, 0, 1)
          : clamp((metrics.bodyZoom - 0.12) / 0.4, 0, 1);
        const cometFocusFade =
          state.focusTargetKind === "comet" && state.focusTargetId === comet.id ? 0.45 : 0;
        const cometDetailFade = Math.max(cometZoomFade, cometFocusFade);
        const tailGeometry = buildCometTailGeometry({
          tailBase: cometPos,
          tailDir: dustDir,
          preferredNormal: antiSolarDir,
          dustLength: dustTailPx,
          ionLength: ionTailPx * 0.82,
          baseFlare: Math.max(nucleusR * 0.9, 3.4 + cometAppearance.dustBias * 2.6),
        });

        if (comet.activeNow) {
          const comaR = clamp(
            Math.log10((Number(comet.comaRadiusKm) || 0) + 10) * 4.2,
            nucleusR * 1.7,
            34,
          );
          if (cometDetailFade > 0.02) {
            addStarSprite({
              tex: starGlowTex,
              radius: comaR * (0.82 + cometAppearance.activityLevel * 0.12),
              opacity: (0.05 + cometAppearance.activityLevel * 0.09) * cometDetailFade,
              z: 2.68,
              x: nucleusPos.x,
              y: nucleusPos.y,
              color: comaColor,
              blending: THREE.NormalBlending,
            });
            const comaParticles = addParticleFieldNative({
              particles: cometParticles.comaParticles,
              resolveScreenPoint: (particle) => ({
                x: cometPos.x + Math.cos(particle.angle) * comaR * particle.radiusNorm,
                y: cometPos.y + Math.sin(particle.angle) * comaR * particle.radiusNorm,
                alpha: particle.alpha,
                size: particle.size,
              }),
              color: comaColor,
              opacity: (0.52 + cometAppearance.activityLevel * 0.1) * cometDetailFade,
              baseSize: Math.max(1.5, nucleusR * 0.42),
              z: 2.69,
            });
            if (comaParticles) nativeThree.systemGroup.add(comaParticles);
          }

          if (ionTailPx > 0.5) {
            addScreenLine(
              tailGeometry.tailBase.x,
              tailGeometry.tailBase.y,
              tailGeometry.ionEnd.x,
              tailGeometry.ionEnd.y,
              ionTailColor,
              0.16 + cometAppearance.ionBias * 0.06,
              2.58,
            );
            const ionParticleCloud = addParticleFieldNative({
              particles: cometParticles.ionParticles,
              resolveScreenPoint: (particle) => {
                return {
                  x:
                    tailGeometry.tailBase.x +
                    (tailGeometry.ionEnd.x - tailGeometry.tailBase.x) * particle.t +
                    tailGeometry.tailNormal.x * ionTailPx * particle.lateral,
                  y:
                    tailGeometry.tailBase.y +
                    (tailGeometry.ionEnd.y - tailGeometry.tailBase.y) * particle.t +
                    tailGeometry.tailNormal.y * ionTailPx * particle.lateral,
                  alpha: particle.alpha,
                  size: particle.size,
                };
              },
              color: ionTailColor,
              opacity: 0.5 + cometAppearance.ionBias * 0.08,
              baseSize: Math.max(1.7, nucleusR * 0.34),
              z: 2.6,
            });
            if (ionParticleCloud) nativeThree.systemGroup.add(ionParticleCloud);
          }

          if (dustTailPx > 0.5) {
            addTailRibbonNative({
              tailBase: tailGeometry.tailBase,
              dustUpperControl: tailGeometry.dustUpperControl,
              dustTip: tailGeometry.dustTip,
              dustLowerControl: tailGeometry.dustLowerControl,
              dustBaseReturn: tailGeometry.dustBaseReturn,
              color: dustTailColor,
              opacity: 0.28 + cometAppearance.dustBias * 0.16,
              z: 2.56,
            });
            const dustParticleCloud = addParticleFieldNative({
              particles: cometParticles.dustParticles,
              resolveScreenPoint: (particle) => {
                const base = quadraticScreenPoint(
                  tailGeometry.tailBase.x,
                  tailGeometry.tailBase.y,
                  tailGeometry.dustUpperControl.x,
                  tailGeometry.dustUpperControl.y,
                  tailGeometry.dustTip.x,
                  tailGeometry.dustTip.y,
                  particle.t,
                );
                const normal = quadraticScreenNormal(
                  tailGeometry.tailBase.x,
                  tailGeometry.tailBase.y,
                  tailGeometry.dustUpperControl.x,
                  tailGeometry.dustUpperControl.y,
                  tailGeometry.dustTip.x,
                  tailGeometry.dustTip.y,
                  particle.t,
                );
                return {
                  x: base.x + normal.x * dustTailPx * particle.lateral,
                  y: base.y + normal.y * dustTailPx * particle.lateral,
                  alpha: particle.alpha,
                  size: particle.size,
                };
              },
              color: dustTailColor,
              opacity: 0.6 + cometAppearance.dustBias * 0.16,
              baseSize: Math.max(1.8, nucleusR * 0.42),
              z: 2.59,
            });
            if (dustParticleCloud) nativeThree.systemGroup.add(dustParticleCloud);
          }
        }

        if (cometDetailFade > 0.05) {
          addStarSprite({
            tex: starGlowTex,
            radius: nucleusR * (1.08 + cometAppearance.activityLevel * 0.22),
            opacity:
              (comet.activeNow ? 0.035 + cometAppearance.activityLevel * 0.045 : 0.018) *
              cometDetailFade,
            z: 2.7,
            x: nucleusPos.x,
            y: nucleusPos.y,
            color: nucleusHaloColor,
            blending: THREE.NormalBlending,
          });
        }
        const nucleusCore = new THREE.Mesh(
          new THREE.CircleGeometry(nucleusR, 22),
          new THREE.MeshBasicMaterial({
            color: nucleusCoreColor,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            depthTest: false,
          }),
        );
        nucleusCore.position.set(nucleusPos.x, nucleusPos.y, 2.72);
        nativeThree.systemGroup.add(nucleusCore);

        if (chkLabels?.checked) {
          addBodyLabelNative(
            comet.name || "Comet",
            `${Number(comet.currentRadiusAu || 0).toFixed(2)} AU`,
            cometPos.x,
            cometPos.y,
            nucleusR,
            9,
            `comet:${comet.id}`,
            60,
          );
        }

        registerHit("comet", comet.id, cometPos.x, cometPos.y, Math.max(10, nucleusR + 4), comet);
      }
    }

    // All labels have been collected; sort by priority and place.
    flushPendingLabels();

    if (chkHill?.checked) {
      for (const node of nativePlanetRenderNodes) {
        const massEarth = Number(node.p.massEarth);
        if (
          !Number.isFinite(massEarth) ||
          massEarth <= 0 ||
          !Number.isFinite(node.p.au) ||
          node.p.au <= 0
        )
          continue;
        const hillAu =
          node.p.au * (massEarth / (3 * snapshot.starMassMsol * EARTH_PER_MSOL)) ** (1 / 3);
        if (!Number.isFinite(hillAu) || hillAu <= 0) continue;
        const hillPx =
          mapAuToPx(node.p.au + hillAu, minAu, maxAu, maxR) -
          mapAuToPx(node.p.au, minAu, maxAu, maxR);
        addHillSphereMarkerNative(
          node.pPos.x,
          node.pPos.y,
          hillPx,
          chkLabels?.checked,
          chkDistances?.checked,
          hillAu,
        );
      }
      for (const node of nativeGasRenderNodes) {
        const mj = Number(node.g.massMjup);
        if (!Number.isFinite(mj) || mj <= 0 || !Number.isFinite(node.g.au) || node.g.au <= 0)
          continue;
        const hillAu = node.g.au * (mj / (3 * snapshot.starMassMsol * MJUP_PER_MSOL)) ** (1 / 3);
        if (!Number.isFinite(hillAu) || hillAu <= 0) continue;
        const hillPx =
          mapAuToPx(node.g.au + hillAu, minAu, maxAu, maxR) -
          mapAuToPx(node.g.au, minAu, maxAu, maxR);
        addHillSphereMarkerNative(
          node.gPos.x,
          node.gPos.y,
          hillPx,
          chkLabels?.checked,
          chkDistances?.checked,
          hillAu,
        );
      }
    }

    if (chkLagrange?.checked) {
      for (const node of nativePlanetRenderNodes) {
        const massEarth = Number(node.p.massEarth);
        if (
          !Number.isFinite(massEarth) ||
          massEarth <= 0 ||
          !Number.isFinite(node.p.au) ||
          node.p.au <= 0
        )
          continue;
        const lp = calcLagrangePoints({
          bodyAu: node.p.au,
          bodyMass: massEarth,
          starMass: snapshot.starMassMsol * EARTH_PER_MSOL,
          bodyAngleRad: node.placement.angle,
        });
        if (!lp) continue;
        const isFocused = state.focusTargetKind === "planet" && state.focusTargetId === node.p.id;
        for (const key of ["L4", "L5"]) {
          const pt = lp.points[key];
          const pr = mapAuToPx(pt.au, minAu, maxAu, maxR);
          const sp = orbitOffsetToScreen(
            Math.cos(pt.angleRad) * pr,
            Math.sin(pt.angleRad) * pr,
            cx,
            cy,
          );
          const mode = !pt.stable ? "trojan-unstable" : isFocused ? "full" : "trojan";
          addLagrangeMarkerNative(sp.x, sp.y, pt.label, mode);
        }
        if (isFocused) {
          for (const key of ["L1", "L2", "L3"]) {
            const pt = lp.points[key];
            const pr = mapAuToPx(pt.au, minAu, maxAu, maxR);
            const sp = orbitOffsetToScreen(
              Math.cos(pt.angleRad) * pr,
              Math.sin(pt.angleRad) * pr,
              cx,
              cy,
            );
            addLagrangeMarkerNative(sp.x, sp.y, pt.label, "full");
          }
        }
      }
      for (const node of nativeGasRenderNodes) {
        const mj = Number(node.g.massMjup);
        if (!Number.isFinite(mj) || mj <= 0 || !Number.isFinite(node.g.au) || node.g.au <= 0)
          continue;
        const lp = calcLagrangePoints({
          bodyAu: node.g.au,
          bodyMass: mj,
          starMass: snapshot.starMassMsol * MJUP_PER_MSOL,
          bodyAngleRad: node.placement.angle,
        });
        if (!lp) continue;
        const isFocused = state.focusTargetKind === "gasGiant" && state.focusTargetId === node.g.id;
        for (const key of ["L4", "L5"]) {
          const pt = lp.points[key];
          const pr = mapAuToPx(pt.au, minAu, maxAu, maxR);
          const sp = orbitOffsetToScreen(
            Math.cos(pt.angleRad) * pr,
            Math.sin(pt.angleRad) * pr,
            cx,
            cy,
          );
          const mode = !pt.stable ? "trojan-unstable" : isFocused ? "full" : "trojan";
          addLagrangeMarkerNative(sp.x, sp.y, pt.label, mode);
        }
        if (isFocused) {
          for (const key of ["L1", "L2", "L3"]) {
            const pt = lp.points[key];
            const pr = mapAuToPx(pt.au, minAu, maxAu, maxR);
            const sp = orbitOffsetToScreen(
              Math.cos(pt.angleRad) * pr,
              Math.sin(pt.angleRad) * pr,
              cx,
              cy,
            );
            addLagrangeMarkerNative(sp.x, sp.y, pt.label, "full");
          }
        }
      }
    }

    const viewChanged =
      Math.abs(state.zoom - DEFAULT_ZOOM) > 0.01 ||
      Math.abs(state.panX) > 1 ||
      Math.abs(state.panY) > 1 ||
      Math.abs(state.yaw - DEFAULT_YAW) > 0.01 ||
      Math.abs(state.pitch - DEFAULT_PITCH) > 0.01;
    if (btnResetView) btnResetView.disabled = !viewChanged;

    if (state.zoom < TRANSITION_ZOOM_START && !state.transitioning) {
      const progress = clamp(
        (TRANSITION_ZOOM_START - state.zoom) / (TRANSITION_ZOOM_START - TRANSITION_ZOOM_END),
        0,
        1,
      );
      showNativeTransitionOverlay(progress, "Zoom out to cluster view");
      if (progress >= 1.0) triggerClusterTransition();
    } else {
      hideNativeTransitionOverlay();
    }

    /* Hide body meshes that were not touched this frame */
    bodyMeshService.hideUntouched(bodyMeshTouched);

    nativeThree.renderer.setClearColor(0x050916, 1);
    nativeThree.renderer.render(nativeThree.scene, nativeThree.cameraSystem);
    drawBinarySystemOverlay(snapshot);
    return true;
  }
  function syncOverlaySize() {
    if (!overlayCanvas || !canvas) return;
    const pw = canvas.width;
    const ph = canvas.height;
    if (overlayCanvas.width !== pw) overlayCanvas.width = pw;
    if (overlayCanvas.height !== ph) overlayCanvas.height = ph;
  }

  function drawNativeClusterMode() {
    if (!nativeThree) return false;
    hideOffscaleZoneNotice();
    nativeThree.systemGroup.visible = false;
    nativeThree.clusterGroup.visible = false;
    if (nativeThree.bodyGroup) nativeThree.bodyGroup.visible = false;
    if (!state.clusterSnapshot) refreshClusterSnapshot();
    if (!state.clusterSnapshot) return false;

    const dpr = state.canvasDpr || window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    if (W < 1 || H < 1) return false;

    /* Render a blank Three.js frame (just the dark background) so the
       WebGL canvas matches the overlay.  All cluster visuals are drawn
       entirely on the 2D overlay to avoid dual-canvas compositing judder. */
    nativeThree.renderer.setSize(
      Math.max(1, Math.round(W * dpr)),
      Math.max(1, Math.round(H * dpr)),
      false,
    );
    nativeThree.renderer.setPixelRatio(1);
    clearThreeGroup(nativeThree.clusterGroup);
    nativeThree.renderer.setClearColor(0x040714, 1);
    nativeThree.renderer.render(nativeThree.scene, nativeThree.cameraCluster);

    /* Camera setup for projection math only */
    const snapshot = state.clusterSnapshot;
    const THREE = nativeThree.THREE;
    const radiusLy = Math.max(1, Number(snapshot?.radiusLy) || 1);
    const useMils = !!clusterMilsEl?.checked;
    const yaw = state.yaw || 0;
    const pitch = state.pitch || 0;
    const zoom = clamp(state.zoom || 1, 0.3, 12);
    nativeThree.cameraCluster.aspect = W / Math.max(1, H);
    nativeThree.cameraCluster.updateProjectionMatrix();
    nativeThree.cameraCluster.position.set(
      (Math.sin(yaw) * Math.cos(pitch) * 24) / zoom,
      (Math.sin(pitch) * 20) / zoom,
      (Math.cos(yaw) * Math.cos(pitch) * 24) / zoom,
    );
    nativeThree.cameraCluster.lookAt(0, 0, 0);
    nativeThree.cameraCluster.updateMatrixWorld(true);

    const projectToScreen = (v3) => {
      const p = v3.clone().project(nativeThree.cameraCluster);
      return {
        x: (p.x * 0.5 + 0.5) * W,
        y: (-p.y * 0.5 + 0.5) * H,
        depth: p.z,
      };
    };
    const project3D = (x, y, z) => projectToScreen(new THREE.Vector3(x, y, z));

    /* Project all systems */
    const plotted = [];
    for (const sys of snapshot.systems || []) {
      const p3 = new THREE.Vector3(Number(sys.x) || 0, Number(sys.y) || 0, Number(sys.z) || 0);
      const isHome = !!sys.isHome;
      const visual = getClusterObjectVisual(sys.objectClassKey, { isHome });
      const camDist = nativeThree.cameraCluster.position.distanceTo(p3);
      const perspective = clamp(28 / Math.max(4, camDist), 0.35, 2.3);
      const baseRadius = isHome ? 5.2 : 2.9;
      const pointRadius = clamp(baseRadius * perspective, 1.6, 9.5);
      const screen = projectToScreen(p3);
      plotted.push({ sys, p3, screen, pointRadius, perspective, isHome, visual });
    }

    /* ── All drawing on single 2D overlay canvas ───────────── */
    syncOverlaySize();
    const ctx = overlayCtx;
    if (!ctx) return true;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* Background gradient */
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "rgba(4, 7, 20, 1)");
    bgGrad.addColorStop(1, "rgba(2, 5, 16, 1)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    /* Starfield background */
    if (chkClusterStars?.checked) {
      drawClusterStarfield(ctx, W, H);
    }

    /* Range/bearing grid (2D projected from XZ plane) */
    if (chkClusterGrid?.checked) {
      const ringCount = 4;
      const RING_SEGS = 96;
      for (let i = 1; i <= ringCount; i++) {
        const ringLy = radiusLy * (i / ringCount);
        const alpha = i === ringCount ? 0.2 : 0.12;
        ctx.strokeStyle = `rgba(196,216,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let s = 0; s <= RING_SEGS; s++) {
          const angle = (s / RING_SEGS) * Math.PI * 2;
          const sp = project3D(Math.sin(angle) * ringLy, 0, Math.cos(angle) * ringLy);
          if (s === 0) ctx.moveTo(sp.x, sp.y);
          else ctx.lineTo(sp.x, sp.y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      /* Range labels */
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let i = 1; i <= ringCount; i++) {
        const ring = radiusLy * (i / ringCount);
        const sp = project3D(ring, 0, 0);
        ctx.fillStyle = "rgba(186,208,248,0.82)";
        const lyStr =
          ring >= 100 ? ring.toFixed(0) : ring >= 10 ? ring.toFixed(1) : ring.toFixed(2);
        ctx.fillText(`${lyStr} ly`, sp.x + 8, sp.y);
      }
      /* Bearing tick marks + labels */
      const degreeMarks = [0, 45, 90, 135, 180, 225, 270, 315];
      for (const deg of degreeMarks) {
        const angle = (deg * Math.PI) / 180;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const innerSp = project3D(sin * radiusLy * 0.985, 0, cos * radiusLy * 0.985);
        const outerSp = project3D(sin * radiusLy * 1.03, 0, cos * radiusLy * 1.03);
        ctx.strokeStyle = "rgba(210,226,255,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(innerSp.x, innerSp.y);
        ctx.lineTo(outerSp.x, outerSp.y);
        ctx.stroke();
        const labelSp = project3D(sin * radiusLy * 1.09, 0, cos * radiusLy * 1.09);
        ctx.fillStyle = "rgba(205,220,248,0.8)";
        ctx.font = "10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const bearingLabel = useMils ? `${Math.round((deg / 360) * 6400)} mil` : `${deg}\u00b0`;
        ctx.fillText(bearingLabel, labelSp.x, labelSp.y);
      }
      ctx.textAlign = "left";
    }

    /* Axes (2D lines) */
    if (chkClusterAxes?.checked) {
      const axes = [
        {
          color: "rgba(255,130,130,0.8)",
          label: "X",
          from: { x: -radiusLy * 1.1, y: 0, z: 0 },
          to: { x: radiusLy * 1.1, y: 0, z: 0 },
        },
        {
          color: "rgba(130,255,180,0.8)",
          label: "Y",
          from: { x: 0, y: -radiusLy * 1.1, z: 0 },
          to: { x: 0, y: radiusLy * 1.1, z: 0 },
        },
        {
          color: "rgba(140,180,255,0.8)",
          label: "Z",
          from: { x: 0, y: 0, z: -radiusLy * 1.1 },
          to: { x: 0, y: 0, z: radiusLy * 1.1 },
        },
      ];
      for (const axis of axes) {
        const p0 = project3D(axis.from.x, axis.from.y, axis.from.z);
        const p1 = project3D(axis.to.x, axis.to.y, axis.to.z);
        ctx.strokeStyle = axis.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        ctx.fillStyle = axis.color;
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText(axis.label, p1.x + 5, p1.y + 2);
      }
    }

    /* Neighbourhood boundary — screen-facing circle */
    const cxB = W * 0.5;
    const cyB = H * 0.5;
    let maxBoundaryR = 0;
    for (let s = 0; s <= 96; s++) {
      const angle = (s / 96) * Math.PI * 2;
      const sp = project3D(Math.sin(angle) * radiusLy, 0, Math.cos(angle) * radiusLy);
      const dist = Math.hypot(sp.x - cxB, sp.y - cyB);
      if (dist > maxBoundaryR) maxBoundaryR = dist;
    }
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cxB, cyB, maxBoundaryR, 0, Math.PI * 2);
    ctx.stroke();

    /* Vertical links (2D) */
    if (chkClusterLinks?.checked) {
      for (const item of plotted) {
        if (item.isHome) continue;
        const planeSp = project3D(item.p3.x, 0, item.p3.z);
        const alpha = clamp(0.08 + item.perspective * 0.08, 0.05, 0.22);
        ctx.strokeStyle = `rgba(140,180,255,${alpha.toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(planeSp.x, planeSp.y);
        ctx.lineTo(item.screen.x, item.screen.y);
        ctx.stroke();
      }
    }

    /* Sort back-to-front for painter's order */
    plotted.sort((a, b) => a.screen.depth - b.screen.depth);

    /* Draw stars */
    for (const item of plotted) {
      const { sys, screen, visual, pointRadius: radius } = item;
      const sx = screen.x;
      const sy = screen.y;

      if (sys.isHome) {
        const glow = ctx.createRadialGradient(sx, sy, radius * 0.3, sx, sy, radius * 2.4);
        glow.addColorStop(0, "rgba(255,245,185,0.98)");
        glow.addColorStop(0.42, "rgba(255,236,160,0.90)");
        glow.addColorStop(0.72, "rgba(255,188,110,0.55)");
        glow.addColorStop(1, "rgba(255,160,80,0)");
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,248,200,0.99)";
        ctx.fill();
      } else {
        const p = clamp(item.perspective, 0.35, 2.3);
        const alpha = clamp(0.45 + p * 0.25, 0.35, 0.9);
        drawStarDot(ctx, sx, sy, radius, visual.color, alpha);
        if (Array.isArray(sys.components) && sys.components.length > 1) {
          drawClusterCompanions(ctx, sx, sy, radius, sys.components, item.perspective);
        }
      }
    }

    /* System name labels */
    if (chkClusterLabels?.checked) {
      const maxLabels = Math.max(4, Math.round(160 / radiusLy));
      const homeEntry = plotted.find((item) => item.isHome);
      const candidates = [
        homeEntry,
        ...plotted.filter((item) => !item.isHome).sort((a, b) => b.perspective - a.perspective),
      ].filter(Boolean);
      const drawnBoxes = [];
      const labelBounds = (lx, ly, line1, line2) => {
        const w = Math.max(line1.length * 7, line2.length * 6.2) + 6;
        return { x1: lx - 2, y1: ly - 22, x2: lx + w, y2: ly + 5 };
      };
      const collides = (box) => {
        const margin = 3;
        for (const b of drawnBoxes) {
          if (
            box.x1 < b.x2 + margin &&
            box.x2 > b.x1 - margin &&
            box.y1 < b.y2 + margin &&
            box.y2 > b.y1 - margin
          )
            return true;
        }
        return false;
      };
      let drawn = 0;
      for (const entry of candidates) {
        if (!entry) continue;
        if (!entry.isHome && drawn >= maxLabels) break;
        const { sys, screen, pointRadius: radius } = entry;
        const classLabel = clusterClassLabel(sys);
        const line1 = sys.name || "Star system";
        const feH = Number.isFinite(sys.metallicityFeH)
          ? ` | ${sys.metallicityFeH >= 0 ? "+" : ""}${Number(sys.metallicityFeH).toFixed(2)}`
          : "";
        const line2 = `${classLabel} | ${Number(sys.distanceLy || 0).toFixed(2)} ly${feH}`;
        let labelX;
        if (sys.isHome) {
          labelX = screen.x + Math.max(14, radius * 2.4 + 8);
        } else {
          const companionCount = Array.isArray(sys.components) ? sys.components.length - 1 : 0;
          if (companionCount > 0) {
            const cRadius = clamp(radius * 0.55, 1.0, 5.5);
            const rightEdge = radius * 1.15 + (companionCount - 1) * cRadius * 2.4 + cRadius * 2.6;
            labelX = screen.x + rightEdge + 6;
          } else {
            labelX = screen.x + 8;
          }
        }
        const box = labelBounds(labelX, screen.y, line1, line2);
        if (!sys.isHome && collides(box)) continue;
        drawnBoxes.push(box);
        if (!sys.isHome) drawn++;
        ctx.fillStyle = sys.isHome ? "rgba(255,245,190,0.95)" : "rgba(220,232,255,0.85)";
        ctx.font = sys.isHome ? "12px system-ui, sans-serif" : "11px system-ui, sans-serif";
        ctx.fillText(line1, labelX, screen.y - 10);
        ctx.fillStyle = sys.isHome ? "rgba(245,228,172,0.88)" : "rgba(185,208,248,0.78)";
        ctx.font = "10px system-ui, sans-serif";
        ctx.fillText(line2, labelX, screen.y + 3);
      }
    }

    /* Hover label */
    let hoverEntry = null;
    if (state.clusterMouseX != null && state.clusterMouseY != null) {
      let closestDist = Infinity;
      for (const item of plotted) {
        const hitR = Math.max(item.pointRadius * 2.6, 10);
        const d = Math.hypot(
          item.screen.x - state.clusterMouseX,
          item.screen.y - state.clusterMouseY,
        );
        if (d < hitR && d < closestDist) {
          closestDist = d;
          hoverEntry = item;
        }
      }
      if (hoverEntry) {
        const { sys, screen, pointRadius: radius } = hoverEntry;
        const classLabel = clusterClassLabel(sys);
        const hLine1 = sys.name || "Star system";
        const hFeH = Number.isFinite(sys.metallicityFeH)
          ? ` | ${sys.metallicityFeH >= 0 ? "+" : ""}${Number(sys.metallicityFeH).toFixed(2)}`
          : "";
        const hLine2 = `${classLabel} | ${Number(sys.distanceLy || 0).toFixed(2)} ly${hFeH}`;
        const companionCount = Array.isArray(sys.components) ? sys.components.length - 1 : 0;
        let hLabelX;
        if (sys.isHome) {
          hLabelX = screen.x + Math.max(14, radius * 2.4 + 8);
        } else if (companionCount > 0) {
          const cRadius = clamp(radius * 0.55, 1.0, 5.5);
          const rightEdge = radius * 1.15 + (companionCount - 1) * cRadius * 2.4 + cRadius * 2.6;
          hLabelX = screen.x + rightEdge + 6;
        } else {
          hLabelX = screen.x + 8;
        }
        ctx.fillStyle = sys.isHome ? "rgba(255,255,210,1.0)" : "rgba(245,252,255,1.0)";
        ctx.font = sys.isHome
          ? "bold 12px system-ui, sans-serif"
          : "bold 11px system-ui, sans-serif";
        ctx.fillText(hLine1, hLabelX, screen.y - 10);
        ctx.fillStyle = sys.isHome ? "rgba(255,240,185,0.98)" : "rgba(205,225,255,0.98)";
        ctx.font = "10px system-ui, sans-serif";
        ctx.fillText(hLine2, hLabelX, screen.y + 3);
      }
    }

    canvas.style.cursor = state.dragging ? "grabbing" : hoverEntry ? "pointer" : "grab";

    const viewChanged =
      Math.abs(state.zoom - CLUSTER_DEFAULT_ZOOM) > 0.01 ||
      Math.abs(state.yaw - CLUSTER_DEFAULT_YAW) > 0.01 ||
      Math.abs(state.pitch - CLUSTER_DEFAULT_PITCH) > 0.01;
    if (btnResetView) btnResetView.disabled = !viewChanged;

    if (state.zoom > CLUSTER_TRANSITION_ZOOM_START && !state.transitioning) {
      const progress = clamp(
        (state.zoom - CLUSTER_TRANSITION_ZOOM_START) /
          (CLUSTER_TRANSITION_ZOOM_END - CLUSTER_TRANSITION_ZOOM_START),
        0,
        1,
      );
      showNativeTransitionOverlay(progress, "Zoom in to system view");
      if (progress >= 1.0) triggerSystemTransition();
    } else {
      hideNativeTransitionOverlay();
    }

    return true;
  }

  /* ResizeObserver fires whenever .viz-wrap changes size (window resize,
     fullscreen enter/exit, layout reflow) — much more reliable than
     setTimeout-based approaches. */
  const wrapResizeObserver = new ResizeObserver(() => {
    resizeCanvas(true);
    draw();
  });
  if (vizWrap) wrapResizeObserver.observe(vizWrap);
  disposers.push(() => wrapResizeObserver.disconnect());

  const SPEED_STEPS = [0.1, 0.5, 1, 5, 20];

  function updateSpeedUI() {
    const idx = Number(rngSpeed.value || 1);
    state.speed = SPEED_STEPS[idx] ?? 1;
    txtSpeed.textContent = `${state.speed} d/s`;
  }

  function exportFileName(extension) {
    const prefix =
      state.mode === "cluster" ? "worldsmith-cluster-visualiser" : "worldsmith-system-visualiser";
    return `${prefix}-${makeTimestampToken()}.${extension}`;
  }

  function invalidateSnapshot() {
    state.snapshotCache = null;
    disposeBodyMeshCache();
  }

  function syncHostFrameControls(snapshot) {
    if (!hostFrameRow || !hostFrameSelect || !hostFrameHintEl || !hostFrameHintRow) return;
    syncZoneToggleLabel(snapshot);
    const options = Array.isArray(snapshot?.hostFrameOptions) ? snapshot.hostFrameOptions : [];
    const show = (snapshot?.topologyKind || "single") !== "single" && options.length > 1;
    const overviewMode = isSystemOverviewMode(snapshot);
    hostFrameRow.style.display = show ? "" : "none";
    hostFrameHintRow.style.display = show ? "" : "none";
    if (hostFrameLabelEl)
      hostFrameLabelEl.textContent = overviewMode ? "Selected frame" : "Host frame";
    if (hostFrameTipEl) {
      hostFrameTipEl.setAttribute(
        "data-tip",
        overviewMode ? TIP_LABEL["Selected frame"] || "" : TIP_LABEL["Host frame"] || "",
      );
    }
    if (!show) return;
    if (hostFrameSelect.options.length !== options.length) {
      hostFrameSelect.replaceChildren(
        ...options.map((option) => {
          const node = document.createElement("option");
          node.value = option.id;
          node.textContent = option.label;
          return node;
        }),
      );
    }
    const resolvedHostFrameId = snapshot?.activeHostFrameId || options[0]?.id || "";
    if (hostFrameSelect.value !== resolvedHostFrameId) hostFrameSelect.value = resolvedHostFrameId;
    if (overviewMode) {
      const activePathLabels = (snapshot?.overviewModel?.activePathNodeIds || [])
        .map((nodeId) => snapshot?.overviewModel?.nodesById?.[nodeId]?.shortLabel || nodeId)
        .filter(Boolean);
      hostFrameHintEl.textContent = [
        "System overview is schematic, not to scale.",
        `${snapshot?.activeHostFrameLabel || "Selected frame"} is currently selected.`,
        activePathLabels.length > 0 ? `Hierarchy path: ${activePathLabels.join(" -> ")}.` : "",
        "Click a star or pair node to inspect that host frame, then use View locally for detailed orbits.",
      ]
        .filter(Boolean)
        .join(" ");
      return;
    }
    const isPairHost = snapshot?.activeHostFrame?.frameKind === "pair";
    const isHierarchical = snapshot?.topologyKind === "triple" || snapshot?.topologyKind === "quad";
    const hintParts = isPairHost
      ? [
          `${snapshot?.activeHostFrameLabel || "Host frame"} barycenter view.`,
          isHierarchical
            ? "Combined pair light sets the local climate in this frame while outer stars still add hierarchy-level flux and stability context."
            : "Combined pair light sets the climate in this frame.",
        ]
      : [
          `${snapshot?.activeHostFrameLabel || "Host frame"} view.`,
          Number(snapshot?.companionFluxEarth || 0) > 0.0005
            ? `${isHierarchical ? "Other stars add" : "Companion adds"} ~${Number(snapshot.companionFluxEarth).toFixed(3)}x Earth flux.`
            : isHierarchical
              ? "Outer-star heating is negligible in this host frame."
              : "Companion heating is negligible.",
        ];
    if (isPairHost && Number(snapshot?.activeHostFrame?.stability?.criticalInnerAu || 0) > 0) {
      hintParts.push(
        `Circumbinary stability floor near ${Number(snapshot.activeHostFrame.stability.criticalInnerAu).toFixed(2)} AU.`,
      );
    }
    if (snapshot?.hierarchySummary?.outerBranches?.length > 0) {
      hintParts.push(
        `Outer companion ${snapshot.hierarchySummary.outerBranches.length > 1 ? "branches" : "branch"}: ${snapshot.hierarchySummary.outerBranches
          .map((branch) => branch.label)
          .join(" | ")}.`,
      );
    }
    if (Number(snapshot?.fluxVariabilityFraction || 0) > 0.001) {
      hintParts.push(
        `Flux varies by about ${(Number(snapshot.fluxVariabilityFraction) * 100).toFixed(1)}% across the ${isHierarchical ? "host-star hierarchy" : "binary orbit"}.`,
      );
    }
    hostFrameHintEl.textContent = hintParts.join(" ");
  }

  function syncSystemViewModeControls(snapshot) {
    if (!viewModeRow || !vizViewLocal || !vizViewOverview) return;
    const supportsOverview = canUseSystemOverview(snapshot);
    if (!supportsOverview && state.systemViewMode !== "local") {
      state.systemViewMode = "local";
    }
    const overviewMode = isSystemOverviewMode(snapshot);
    viewModeRow.style.display = supportsOverview ? "" : "none";
    vizViewLocal.checked = !overviewMode;
    vizViewOverview.checked = overviewMode;

    if (btnPlay) btnPlay.style.display = overviewMode ? "none" : "";
    if (speedControlEl) speedControlEl.style.display = overviewMode ? "none" : "";
    if (distanceToggleWrap) distanceToggleWrap.style.display = overviewMode ? "none" : "";
    if (sizeToggleWrap) sizeToggleWrap.style.display = overviewMode ? "none" : "";
    if (bodyScaleRow) bodyScaleRow.style.display = overviewMode || isPhysicalScale() ? "none" : "";

    const showMap = {
      labels: true,
      leaderLines: !overviewMode,
      moons: !overviewMode,
      orbits: !overviewMode,
      hz: !overviewMode,
      debris: !overviewMode,
      comets: !overviewMode,
      eccentric: !overviewMode,
      peAp: !overviewMode,
      hill: !overviewMode,
      lagrange: !overviewMode,
      frost: !overviewMode,
      distances: !overviewMode,
      grid: !overviewMode,
      rotation: !overviewMode,
      axialTilt: !overviewMode,
      multistarInfo: true,
      clickBodies: !overviewMode,
      clickStar: !overviewMode,
      debug: true,
    };
    Object.entries(systemCheckToggles).forEach(([key, node]) => {
      if (!node) return;
      node.style.display = showMap[key] ? "" : "none";
    });
  }

  function getSnapshot({ force = false } = {}) {
    if (!force && state.snapshotCache) return state.snapshotCache;
    const snapshot = buildVisualizerSnapshot(loadWorld(), {
      debug: {
        enabled: !!chkDebug?.checked,
        log: dbg,
        logThrottled: dbgThrottled,
      },
      hostFrameId: state.activeHostFrameId,
      hashUnit,
    });
    state.activeHostFrameId = snapshot.activeHostFrameId || null;
    syncSystemViewModeControls(snapshot);
    syncHostFrameControls(snapshot);
    state.snapshotCache = snapshot;
    warmBodyMeshes(snapshot);
    return snapshot;
  }

  function mapAuToPx(au, minAu, maxAu, maxR) {
    return mapSnapshotAuToPx(au, minAu, maxAu, maxR, { logScale: isLogScale() });
  }

  function getFrameMetrics(snapshot) {
    return getSnapshotFrameMetrics(snapshot, {
      bodyScale: state.bodyScale,
      canvasHeight: canvas.height,
      canvasWidth: canvas.width,
      dpr: state.canvasDpr || window.devicePixelRatio || 1,
      logScale: isLogScale(),
      offscaleZoneMinAu: OFFSCALE_ZONE_MIN_AU,
      offscaleZoneRangeRatio: OFFSCALE_ZONE_RANGE_RATIO,
      offscaleZoneRatio: OFFSCALE_ZONE_RATIO,
      physicalScale: isPhysicalScale(),
      showDebris: !!chkDebris?.checked,
      showFrost: !!chkFrost?.checked,
      showHz: !!chkHz?.checked,
      zoom: state.zoom,
    });
  }

  function computePlanetPlacement(planetNode, metrics) {
    return computeSystemPlanetPlacement(planetNode, metrics, {
      applyRepresentativeBodyRadiusConstraints,
      earthRadiusKm: EARTH_RADIUS_KM,
      hashUnit,
      mapAuToPx,
      physicalRadiusToPx,
      representativePlanetBaseRadiusPx,
      simTime: state.simTime,
      solveKeplerEquation,
      useEccentric: chkEccentric?.checked === true,
      usePhysicalScale: isPhysicalScale(),
    });
  }

  function computeGasGiantPlacement(gasGiant, idx, metrics, starMassMsol) {
    return computeSystemGasGiantPlacement(gasGiant, idx, metrics, starMassMsol, {
      mapAuToPx,
      simTime: state.simTime,
      solveKeplerEquation,
      useEccentric: chkEccentric?.checked === true,
    });
  }

  function computeCometPlacement(comet, metrics, starMassMsol) {
    return computeSystemCometPlacement(comet, metrics, starMassMsol, {
      mapAuToPx,
      simTime: state.simTime,
      solveKeplerEquation,
    });
  }

  // Project a 3-D orbit-plane offset (ox, oy, oz) through the camera.
  // oy is the vertical offset (from inclination tilt); defaults to 0 for flat orbits.
  function projectOrbitOffset(ox, oz, oy = 0) {
    return projectOrbitOffsetForCamera(ox, oz, state.yaw, state.pitch, oy);
  }

  function orbitOffsetToScreen(ox, oz, cx, cy, oy = 0) {
    return orbitOffsetToScreenForCamera(ox, oz, cx, cy, state.yaw, state.pitch, oy);
  }

  function orbitPointToScreen(
    cx,
    cy,
    semiMajorPx,
    ecc,
    argPeriapsisDeg,
    inclinationDeg,
    trueAnomalyRad,
  ) {
    return orbitPointToScreenForCamera(
      cx,
      cy,
      semiMajorPx,
      ecc,
      argPeriapsisDeg,
      inclinationDeg,
      trueAnomalyRad,
      state.yaw,
      state.pitch,
    );
  }

  function projectDirectionToScreen(vx, vz, vy = 0) {
    return projectDirectionToScreenForCamera(vx, vz, state.yaw, state.pitch, vy);
  }

  function computeSpinAngleRad(bodyId, rotationPeriodDays, axialTiltDeg) {
    return computeSpinAngleRadForState(
      bodyId,
      rotationPeriodDays,
      axialTiltDeg,
      state.simTime,
      hashUnit,
    );
  }

  function computeAxisDirection(bodyId, axialTiltDeg) {
    return computeAxisDirectionForCamera(bodyId, axialTiltDeg, state.yaw, state.pitch, hashUnit);
  }
  function clearFocusTarget() {
    state.focusTargetKind = null;
    state.focusTargetId = null;
    state.focusZoomTarget = null;
    stopCameraLoop();
  }

  function desiredFocusZoom(kind, id, snapshot) {
    const snap = snapshot || getSnapshot();
    const metrics = getFrameMetrics(snap);
    return computeDesiredFocusZoom({
      currentZoom: state.zoom,
      defaultZoom: DEFAULT_ZOOM,
      focusMinZoom: FOCUS_MIN_ZOOM,
      getFocusMaxZoom,
      kind,
      id,
      metrics,
      snapshot: snap,
      zoomMin: ZOOM_MIN,
      computeCometPlacement,
      computeGasGiantPlacement,
      computePlanetPlacement,
      mapAuToPx,
      getGasGiantRadiusPx(g, metricsArg) {
        return Math.max(
          1,
          isPhysicalScale()
            ? physicalRadiusToPx(g.radiusKm, metricsArg.starR, metricsArg.starRadiusKm, 1, 48)
            : applyRepresentativeBodyRadiusConstraints(
                representativeGasBaseRadiusPx(g, metricsArg.bodyZoom),
                metricsArg,
              ),
        );
      },
    });
  }

  function setFocusTarget(kind, id, snapshotArg) {
    if (!id || !kind) return;
    state.focusTargetKind = kind;
    state.focusTargetId = id;
    state.focusZoomTarget = desiredFocusZoom(kind, id, snapshotArg);
  }

  function hitTestBody(x, y) {
    return hitTestBodyRegion(state.bodyHitRegions, x, y);
  }

  function hitTestLabelUi(x, y) {
    return hitTestLabelRegion(state.labelHitRegions, x, y);
  }

  // Centre the focused body on screen.  Called at the top of every
  // drawNativeSystemMode so that pan is ALWAYS derived from the body's
  // projected position — the body stays centred BY CONSTRUCTION, not
  // by correction after the fact.
  function syncFocusPan(snapshot, metrics) {
    return syncFocusedPan({
      clearFocusTarget,
      computeCometPlacement,
      computeGasGiantPlacement,
      computePlanetPlacement,
      metrics,
      projectOrbitOffset,
      snapshot,
      state,
    });
  }

  // Smooth zoom toward the focus target.  Only touches state.zoom —
  // pan is handled by syncFocusPan at draw time.
  function easeFocusZoom(dt) {
    return applyCameraFocusZoom({
      state,
      dt,
      zoomMin: ZOOM_MIN,
      getZoomMax,
      cameraZoomRate: CAMERA_ZOOM_RATE,
    });
  }

  function applyInertia(dt) {
    return applyCameraInertia({
      state,
      dt,
      inertiaDecayRate: INERTIA_DECAY_RATE,
      inertiaMinVelPx: INERTIA_MIN_VEL_PX,
      inertiaMinVelRad: INERTIA_MIN_VEL_RAD,
      systemPitchMin: PITCH_MIN,
      systemPitchMax: PITCH_MAX,
    });
  }

  function applyZoomInterpolation(dt) {
    return applyCameraZoomInterpolation({
      state,
      dt,
      cameraZoomRate: CAMERA_ZOOM_RATE,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      devicePixelRatio: state.canvasDpr || window.devicePixelRatio || 1,
    });
  }

  function applyResetEasing(dt) {
    return applyCameraResetEasing({
      state,
      dt,
      resetRate: RESET_RATE,
    });
  }

  function killInertia() {
    stopCameraInertia(state);
  }

  function isLive() {
    return !disposed && root.isConnected;
  }

  function isTickScheduled() {
    return rafId != null;
  }

  function startTickLoop() {
    if (rafId != null) return;
    rafId = requestAnimationFrame(tick);
  }

  function stopTickLoop() {
    if (rafId == null) return;
    try {
      cancelAnimationFrame(rafId);
    } catch {}
    rafId = null;
  }

  function stopCameraLoop() {
    if (cameraRafId == null) return;
    try {
      cancelAnimationFrame(cameraRafId);
    } catch {}
    cameraRafId = null;
  }

  function startCameraLoop() {
    if (state.isPlaying || cameraRafId != null) return;
    let lastCameraTs = 0;
    const cameraTick = (ts) => {
      if (disposed || !root.isConnected || state.isPlaying) {
        cameraRafId = null;
        return;
      }
      if (!lastCameraTs) lastCameraTs = ts;
      const dt = Math.min(0.2, (ts - lastCameraTs) / 1000);
      lastCameraTs = ts;
      let needsFrame = false;
      if (state.focusTargetId) {
        // Pan is handled by syncFocusPan inside draw — kill pan velocity
        // but allow rotation inertia so the camera decelerates smoothly.
        state.panVelX = 0;
        state.panVelY = 0;
        needsFrame = easeFocusZoom(dt) || needsFrame;
        needsFrame = applyInertia(dt) || needsFrame;
      } else {
        needsFrame = applyInertia(dt) || needsFrame;
        needsFrame = applyZoomInterpolation(dt) || needsFrame;
      }
      if (state.resetting) {
        needsFrame = applyResetEasing(dt) || needsFrame;
      }
      draw();
      if (needsFrame) cameraRafId = requestAnimationFrame(cameraTick);
      else cameraRafId = null;
    };
    cameraRafId = requestAnimationFrame(cameraTick);
  }

  function flareDebugEnabled() {
    return !!chkDebug?.checked;
  }

  function updateStarBursts(dtSec, snapshot, nowActivitySec) {
    return starActivityRuntime.updateStarBursts(dtSec, snapshot, nowActivitySec);
  }

  function renderFocusSummary(summary, options = {}) {
    const { onAction = null } = options;
    if (!focusSummaryEl) return;
    if (!summary) {
      focusSummaryEl.style.display = "none";
      replaceChildren(focusSummaryEl);
      return;
    }

    const rows = createElement(
      "div",
      { className: "viz-focus-summary__rows" },
      (summary.lines || []).map((line) =>
        createElement("div", { className: "viz-focus-summary__row" }, [
          createElement("div", {
            className: "viz-focus-summary__label",
            text: line.label || "",
          }),
          createElement("div", {
            className: "viz-focus-summary__value",
            text: line.value || "-",
          }),
        ]),
      ),
    );

    const children = [
      createElement("div", {
        className: "viz-focus-summary__title",
        text: summary.title || "Focused body",
      }),
      createElement("div", {
        className: "viz-focus-summary__subtitle",
        text: summary.subtitle || "",
      }),
      rows,
    ];

    if (summary.note) {
      children.push(
        createElement("div", {
          className: "viz-focus-summary__note",
          text: summary.note,
        }),
      );
    }

    if (Array.isArray(summary.actions) && summary.actions.length > 0) {
      const actionsWrap = createElement("div", { className: "viz-focus-summary__actions" });
      for (const action of summary.actions) {
        const button = createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-summary-action": action.id,
          },
          text: action.label || action.id || "Action",
        });
        if (typeof onAction === "function") {
          button.addEventListener("click", () => onAction(action.id, summary));
        }
        actionsWrap.appendChild(button);
      }
      children.push(actionsWrap);
    }

    focusSummaryEl.style.display = "";
    replaceChildren(focusSummaryEl, children);
  }

  /* ── Draw dispatcher ────────────────────────────────────────── */

  function draw(snapshotArg) {
    if (disposed || !root.isConnected || !canvas || !canvas.isConnected) return;
    if (!nativeThree) return;
    if (state.mode === "cluster") {
      renderFocusSummary(null);
      drawNativeClusterMode();
    } else {
      drawNativeSystemMode(snapshotArg);
    }
  }

  /* ── Transition animations (mode switch, no page navigation) ─ */

  function triggerClusterTransition() {
    if (state.transitioning) return;
    state.transitioning = true;
    hideToast();
    if (state.isPlaying) {
      state.isPlaying = false;
      if (btnPlay) btnPlay.textContent = "Play";
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    const startZoom = state.zoom;
    const endZoom = 0.02;
    const startPanX = state.panX;
    const startPanY = state.panY;
    const duration = 400;
    const t0 = performance.now();

    function shrinkTick(now) {
      if (disposed) return;
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / duration);
      const ease = t * t;
      state.zoom = startZoom + (endZoom - startZoom) * ease;
      state.zoomTarget = state.zoom;
      state.panX = startPanX * (1 - ease);
      state.panY = startPanY * (1 - ease);
      draw();
      if (t < 1) {
        requestAnimationFrame(shrinkTick);
      } else {
        /* Brief opacity fade at mode switch to soften the visual pop */
        canvas.style.transition = "opacity 80ms ease";
        canvas.style.opacity = "0.15";
        setTimeout(() => {
          switchMode("cluster");
          state.zoom = 10.0;
          state.zoomTarget = 10.0;
          state.yaw = CLUSTER_DEFAULT_YAW;
          state.pitch = CLUSTER_DEFAULT_PITCH;
          draw();
          canvas.style.opacity = "1";
          setTimeout(() => {
            canvas.style.transition = "";
            animateZoomTo(CLUSTER_DEFAULT_ZOOM, 800);
          }, 100);
        }, 80);
      }
    }
    requestAnimationFrame(shrinkTick);
  }

  function triggerSystemTransition() {
    if (state.transitioning) return;
    state.transitioning = true;
    if (state.clusterIsPlaying) {
      state.clusterIsPlaying = false;
      if (btnClusterPlay) btnClusterPlay.textContent = "Play";
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    const startZoom = state.zoom;
    const endZoom = 15.0;
    const duration = 400;
    const t0 = performance.now();

    function shrinkTick(now) {
      if (disposed) return;
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / duration);
      const ease = t * t;
      state.zoom = startZoom + (endZoom - startZoom) * ease;
      state.zoomTarget = state.zoom;
      draw();
      if (t < 1) {
        requestAnimationFrame(shrinkTick);
      } else {
        /* Brief opacity fade at mode switch to soften the visual pop */
        canvas.style.transition = "opacity 80ms ease";
        canvas.style.opacity = "0.15";
        setTimeout(() => {
          switchMode("system");
          state.zoom = 0.05;
          state.zoomTarget = 0.05;
          state.panX = 0;
          state.panY = 0;
          state.yaw = DEFAULT_YAW;
          state.pitch = DEFAULT_PITCH;
          draw();
          canvas.style.opacity = "1";
          setTimeout(() => {
            canvas.style.transition = "";
            animateZoomTo(DEFAULT_ZOOM, 800);
          }, 100);
        }, 80);
      }
    }
    requestAnimationFrame(shrinkTick);
  }

  function animateZoomTo(target, durationMs) {
    state.transitioning = true;
    const startZoom = state.zoom;
    const startPanX = state.panX;
    const startPanY = state.panY;
    const t0 = performance.now();

    function expandTick(now) {
      if (disposed) return;
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);
      state.zoom = startZoom + (target - startZoom) * ease;
      state.zoomTarget = state.zoom;
      state.panX = startPanX * (1 - ease);
      state.panY = startPanY * (1 - ease);
      draw();
      if (t < 1) {
        requestAnimationFrame(expandTick);
      } else {
        state.zoomTarget = target;
        state.transitioning = false;
      }
    }
    requestAnimationFrame(expandTick);
  }

  hostFrameSelect?.addEventListener("change", () => {
    state.activeHostFrameId = String(hostFrameSelect.value || "").trim() || null;
    invalidateSnapshot();
    clearFocusTarget();
    draw();
  });

  root.querySelectorAll('[name="vizViewMode"]').forEach((element) => {
    addDisposableListener(element, "change", () => {
      const requestedMode = vizViewOverview?.checked ? "overview" : "local";
      applySystemViewMode(requestedMode);
      draw();
    });
  });

  inputBindings = bindVisualizerInputBindings({
    addCleanup,
    addDisposableListener,
    root,
    canvas,
    overlayCanvas,
    vizLayout,
    offscaleNoteEl,
    state,
    elements: {
      chkLabels,
      chkLabelLeaders,
      chkMoons,
      chkOrbits,
      chkHz,
      chkDebris,
      chkComets,
      chkEccentric,
      chkPeAp,
      chkHill,
      chkLagrange,
      chkFrost,
      chkDistances,
      chkGrid,
      chkRotation,
      chkAxialTilt,
      chkMultistarInfo,
      chkClickFocusBodies,
      chkClickFocusStar,
      chkDebug,
      btnRefresh,
      btnPlay,
      btnResetView,
      btnControls,
      vizDropdown,
      btnFullscreen,
      btnExportImage,
      btnExportGif,
      rngSpeed,
      rngBodyScale,
      txtBodyScale,
      bodyScaleRow,
      helpOverlay,
      helpSystemSection,
      helpClusterSection,
      btnHelp,
      btnHelpClose,
      chkClusterLabels,
      chkClusterLinks,
      chkClusterAxes,
      chkClusterGrid,
      chkClusterStars,
      btnClusterRefresh,
      btnClusterPlay,
      rngClusterSpeed,
      vizToastClose,
    },
    constants: {
      defaultYaw: DEFAULT_YAW,
      defaultPitch: DEFAULT_PITCH,
      defaultZoom: DEFAULT_ZOOM,
      pitchMin: PITCH_MIN,
      pitchMax: PITCH_MAX,
      zoomMin: ZOOM_MIN,
      clusterDefaultYaw: CLUSTER_DEFAULT_YAW,
      clusterDefaultPitch: CLUSTER_DEFAULT_PITCH,
      clusterDefaultZoom: CLUSTER_DEFAULT_ZOOM,
      clusterZoomMin: CLUSTER_ZOOM_MIN,
      clusterZoomMax: CLUSTER_ZOOM_MAX,
      inertiaMinVelPx: INERTIA_MIN_VEL_PX,
      inertiaMinVelRad: INERTIA_MIN_VEL_RAD,
      controlsTipHtml: tipIcon(TIP_LABEL["Controls"] || "") || "",
    },
    helpers: {
      clamp,
      clearFocusTarget,
      draw,
      easeFocusZoom,
      exportFileName,
      getFocusMaxZoom,
      getOffscaleNoticeTopPx,
      getSnapshot,
      getZoomMax,
      hideToast,
      hitTestBody,
      hitTestLabelUi,
      invalidateSnapshot,
      isLive,
      isPhysicalScale,
      killInertia,
      refreshClusterSnapshot,
      setFocusTarget,
      startCameraLoop,
      syncExportButtons,
      updateClusterSpeedUI,
      updateSpeedUI,
      updateStarBursts,
    },
    animation: {
      isTickScheduled,
      startTickLoop,
      stopCameraLoop,
      stopTickLoop,
    },
  });

  /* ── Tick / animation loop (both modes) ────────────────────── */

  function tick(ts) {
    if (disposed || !root.isConnected) {
      dispose();
      return;
    }

    if (state.mode === "cluster") {
      /* Cluster auto-spin */
      if (!state.clusterIsPlaying) {
        rafId = null;
        return;
      }
      if (!state.clusterLastTick) state.clusterLastTick = ts;
      const dt = (ts - state.clusterLastTick) / 1000;
      state.clusterLastTick = ts;
      state.yaw += dt * 0.2 * state.clusterSpinSpeed;
      draw();
      rafId = requestAnimationFrame(tick);
      return;
    }

    /* System orbit animation */
    if (!state.isPlaying) {
      rafId = null;
      return;
    }
    if (!state.lastTick) state.lastTick = ts;
    const dt = (ts - state.lastTick) / 1000;
    state.lastTick = ts;
    state.simTime += dt * state.speed;
    state.activityTime += dt * state.speed;
    const snapshot = getSnapshot();
    updateStarBursts(dt, snapshot, state.activityTime * 86400);
    if (state.focusTargetId) {
      state.panVelX = 0;
      state.panVelY = 0;
      easeFocusZoom(dt);
      applyInertia(dt);
    } else {
      applyInertia(dt);
      applyZoomInterpolation(dt);
    }
    if (state.resetting) applyResetEasing(dt);
    draw(snapshot);
    rafId = requestAnimationFrame(tick);
  }

  /* Window resize is handled by the ResizeObserver on vizWrap */
  /* Initialise based on start mode */
  if (state.mode === "cluster") {
    refreshClusterSnapshot();
    state.yaw = CLUSTER_DEFAULT_YAW;
    state.pitch = CLUSTER_DEFAULT_PITCH;
    state.zoom = CLUSTER_DEFAULT_ZOOM;
    state.zoomTarget = CLUSTER_DEFAULT_ZOOM;
  }

  async function initialiseNativeRenderer() {
    try {
      const THREE = await loadThreeCore();
      if (disposed || !root.isConnected) return false;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(1);
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      const systemGroup = new THREE.Group();
      const clusterGroup = new THREE.Group();
      const bodyGroup = new THREE.Group();
      scene.add(systemGroup);
      scene.add(clusterGroup);
      scene.add(bodyGroup);
      const cameraSystem = new THREE.OrthographicCamera(-100, 100, 100, -100, -2000, 2000);
      cameraSystem.position.set(0, 0, 40);
      cameraSystem.lookAt(0, 0, 0);
      const cameraCluster = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
      /* PBR 3-light rig (matches recipe renderer) */
      const fillLight = new THREE.HemisphereLight(0xffffff, 0x091124, 0.8);
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.02);
      keyLight.position.set(-3, 2, 3);
      const rimLight = new THREE.DirectionalLight(0x8eb7ff, 0.28);
      rimLight.position.set(2.1, -1.2, -2.8);
      scene.add(fillLight, keyLight, rimLight);
      nativeThree = {
        THREE,
        renderer,
        scene,
        systemGroup,
        clusterGroup,
        bodyGroup,
        cameraSystem,
        cameraCluster,
        fillLight,
        keyLight,
        rimLight,
      };
      resizeCanvas(true);
      draw();
      return true;
    } catch (err) {
      console.warn(
        "[WorldSmith] Native Three visualiser unavailable, falling back to compatibility renderer.",
        err,
      );
      return false;
    }
  }

  async function initialiseRenderer() {
    await initialiseNativeRenderer();
  }
  initialiseRenderer();

  return dispose;
}

// EOF
