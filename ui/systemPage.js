import { fmt } from "../engine/utils.js";
import { buildDynamicalContext } from "../engine/dynamics/context.js";
import { buildSystemPosterSnapshotInputs } from "../engine/worldAdapters.js";
import { bindNumberAndSlider } from "./bind.js";
import { downloadCanvasPng, makeTimestampToken } from "./canvasExport.js";
import { attachTooltips, tipIcon } from "./tooltip.js";
import {
  renderManualBodyList,
  renderOrbitalArchitectureDiagnostics,
  renderOrbitSlots,
  renderSystemKpis,
  renderUnassignedMoons,
  renderUnassignedPlanets,
} from "./system/domRender.js";
import {
  getPlanetaryBodyClassification,
  getPlanetaryBodyClassificationLabel,
} from "./planet/bodyClassificationSummary.js";
import { drawSystemPosterNative, disposeSystemPosterNative } from "./lazySystemPosterNative.js";
import {
  loadWorld,
  updateWorld,
  listPlanets,
  listMoons,
  listMoonParentBodies,
  listPlanetaryBodies,
  assignPlanetToSlot,
  movePlanetToSlot,
  assignMoonToPlanet,
  selectPlanet,
  selectMoon,
  togglePlanetLock,
  toggleMoonLock,
  listSystemDebrisDisks,
  setOrbitMode,
  buildWorldHomeSystemContext,
  getProjectedPrimaryStar,
  resolveWorldHostFrameContext,
} from "./store.js";
import { createTutorial } from "./tutorial.js";
import { launchGuidedMoonForParent } from "./moonGuidedLaunch.js";
import { openSystemRandomGenerationOverlay } from "./systemRandomGeneration.js";

const TIP_LABEL = {
  "Orbit Placement Mode":
    "Guided mode generates logarithmically-spaced orbit slots from Spacing Factor and Orbit 1; planets are assigned to slots via drag-and-drop.\n\n" +
    "Manual mode disables the slot system\u2014each planet\u2019s semi-major axis is set directly on the Planets page.\n\n" +
    "Switching from Guided to Manual copies each planet\u2019s slot distance into its semi-major axis input.",
  "Host Frame":
    "Select which stellar host frame this page is arranging.\n\n" +
    "Single-star systems have one frame. Binary, triple, and quad systems can have separate circumstellar (S-type) or circumbinary (P-type) frames.\n\n" +
    "The orbit ladder, planet list, KPIs, and poster preview all follow the selected host frame.",
  "Selected Host":
    "Read-only summary of the currently selected host frame.\n\n" +
    "Change stellar topology and component properties on the Star page.",
  "Star Mass": "Star mass in solar masses (read-only; set on the Star page).\n\nSun = 1 Msol.",
  "Host Mass":
    "Effective mass of the selected host frame in solar masses.\n\n" +
    "For a circumstellar frame this is the host star mass. For a circumbinary frame this is the combined pair mass.",
  "Habitable Zone":
    "A planet orbiting within this region receives Earth-like stellar heating.\n\nUses a temperature-dependent model where the inner/outer flux thresholds (S_in/S_out) vary with stellar effective temperature, based on Chromant\u2019s Desmos correction.",
  "Star Luminosity": "Stellar luminosity in solar luminosities.\n\nSun = 1 Lsol.",
  "Host Luminosity":
    "Radiative output used for the selected host frame.\n\n" +
    "Circumbinary frames use the combined light of the host pair; circumstellar frames use the local host star with companion-flux adjustments applied to zones.",
  "Star Radius": "Stellar radius in solar radii.\n\nSun = 1 Rsol.",
  "Host Radius":
    "Characteristic radius used for the selected host frame.\n\n" +
    "Circumbinary frames show a representative equivalent radius; circumstellar frames show the host star radius.",
  "Star Density": "Mean stellar density in solar densities.\n\nSun = 1 Dsol.",
  "Habitable Zone (Inner)":
    "Inner boundary of the habitable zone in AU, from the temperature-dependent HZ model.\n\n1 AU = ~150,000,000 km.",
  "Habitable Zone (Outer)":
    "Outer boundary of the habitable zone in AU, from the temperature-dependent HZ model.\n\n1 AU = ~150,000,000 km.",
  "H2O Frost Line":
    "Distance from the star beyond which volatile compounds (water, ammonia, methane, CO\u2082) can exist as ices.\n\nGas giants may only be placed beyond the frost line.",
  "Spacing Factor":
    "Logarithmic spacing factor for Bode\u2019s-law orbit generation. Higher values spread orbits farther apart.\n\nSolar System value: 0.3.",
  "System Inner Limit":
    "Inner limit of the planetary system, set by the Roche limit. No planet can orbit closer than this distance.",
  "Orbit 1":
    "Semi-major axis of the first (innermost) orbit slot in AU. Must be beyond the System Inner Limit.",
  "Orbit 2":
    "Additional stable orbit slots generated from the Bode\u2019s-law spacing.\n\nGreen slots fall within the habitable zone and suit Earth-like planets. Grey slots lie beyond the H\u2082O frost line and suit gas giants. The first grey orbit is typically the primary gas giant\u2019s slot.\n\nSlots within 0.15 AU of an adjacent orbit are too close for a stable planet. All other slots may be filled or left empty.",
  "Debris Disk": "Debris disk regions in your system. Managed on the Other Objects tab.",
  "Planets in system":
    "Assign created inner planets to valid orbital slots. Each slot can hold at most one planet.",
  "Orbit slots":
    "These are the currently available orbital slots for inner planets after gas giant and debris constraints are applied.",
  "Orbit Slots (AU)": "List of generated orbit distances in astronomical units.",
  Name: "Name used in system lists, visualiser labels, and exports.",
  Orbit: "Orbital distance from the star in astronomical units (AU).",
  "Visual style": "Visualiser-only appearance preset for gas giant markers.",
  "Outer debris disk name": "Name used for the computed outer debris disk.",
  "Inner debris disk name": "Name used for the optional inner debris disk.",
  "Inner edge": "Inner boundary of the debris disk in astronomical units (AU).",
  "Outer edge": "Outer boundary of the debris disk in astronomical units (AU).",
  "System poster":
    "Visual lineup of all bodies in the system, arranged left-to-right by orbital distance. " +
    "Body sizes use a power-law scale so rocky planets remain visible next to gas giants. " +
    "The green band marks the habitable zone; the dashed line marks the H\u2082O frost line.",
  "Multistar info panel":
    "Show or hide the multistar summary overlay on supported system-poster views.\n\n" +
    "This affects the in-canvas host-frame, hierarchy, and companion-branch information card.",
};

/* ── System Poster ────────────────────────────────────── */

function drawSystemPoster(canvas, data, opts = {}) {
  if (!canvas) return;
  drawSystemPosterNative(
    canvas,
    data,
    opts,
    typeof opts.onReady === "function" ? opts.onReady : null,
  );
}

function orbitSlotToleranceAu(slotAu) {
  return Math.max(0.05, slotAu * 0.02);
}

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function filterBodiesForHostFrame(entries, hostFrameId, fallbackHostFrameId) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  return (entries || []).filter(
    (entry) => normalizeHostFrameId(entry?.hostFrameId, fallbackHostFrameId) === targetHostFrameId,
  );
}

function planetaryBodyOrbitAu(body) {
  const au = Number(body?.orbit?.semiMajorAxisAu);
  return Number.isFinite(au) ? au : Number.NaN;
}

function planetaryBodyKindLabel(body) {
  const classification = getPlanetaryBodyClassification(body);
  const label = getPlanetaryBodyClassificationLabel(classification);
  if (label) return label;
  if (body?.legacyKind === "gasGiant") {
    return body?.giant?.companionClass === "brownDwarf" ? "Brown dwarf" : "Gas giant";
  }
  return "Rocky planet";
}

function gasGiantFromBodyProjection(body) {
  return {
    id: body.id,
    name: body.name,
    au: planetaryBodyOrbitAu(body),
    hostFrameId: body.hostFrameId,
    slotIndex: body.slotIndex,
    locked: Boolean(body.locked),
    style: body.appearance?.styleId || body.legacy?.source?.style || "",
    companionClass: body.giant?.companionClass || body.classificationSeed?.companionClass || null,
    massMjup: body.giant?.massMjup ?? null,
    radiusRj: body.giant?.radiusRj ?? null,
    sourceBody: body,
  };
}

function manualBodyListItemFromProjection(body) {
  const au = planetaryBodyOrbitAu(body);
  return {
    id: body.id,
    kind: planetaryBodyKindLabel(body),
    name: body.name || body.id,
    au: Number.isFinite(au) && au > 0 ? au : Number.POSITIVE_INFINITY,
    auLabel: Number.isFinite(au) && au > 0 ? `${fmt(au, 3)} AU` : "Orbit TBD",
  };
}

function formatHostFrameScopeLabel(hostFrame) {
  if (!hostFrame) return "Host frame";
  if (hostFrame.frameKind === "pair") return "P-type circumbinary";
  if (hostFrame.orbitFamilyKind === "single") return "Single-star";
  return "S-type circumstellar";
}

function formatHostFrameOptionLabel(hostFrame) {
  const label = hostFrame?.label || hostFrame?.id || "Host frame";
  return `${label} (${formatHostFrameScopeLabel(hostFrame)})`;
}

function formatHabitableZoneRange(habitableZoneAu) {
  const inner = Number(habitableZoneAu?.inner);
  const outer = Number(habitableZoneAu?.outer);
  if (!(Number.isFinite(inner) && Number.isFinite(outer))) return "Unavailable";
  return `${fmt(inner, 3)} - ${fmt(outer, 3)} AU`;
}

function getHostZoneLabel(hostFrame) {
  return String(hostFrame?.zones?.zoneLabel || "Habitable Zone");
}

function formatHostFrameHint(solveContext) {
  if (!solveContext?.hostFrame) return "Host-frame context unavailable.";
  const hostFrame = solveContext.hostFrame;
  const parts = [`${hostFrame.label} is the active ${formatHostFrameScopeLabel(hostFrame)} view.`];
  if (hostFrame.frameKind === "pair") {
    parts.push("Planets here orbit the host pair barycenter.");
  } else {
    const companionFluxEarth = Number(solveContext.companionFluxEarth || 0);
    if (companionFluxEarth > 0.0005) {
      parts.push(`Companion adds about ${fmt(companionFluxEarth, 3)}x Earth flux on average.`);
    } else {
      parts.push("Companion heating is negligible here.");
    }
  }
  const variability = Number(solveContext.fluxVariabilityFraction || 0);
  if (variability > 0.001) {
    parts.push(`Flux swing is about ${fmt(variability * 100, 1)}% across the host orbit.`);
  }
  return parts.join(" ");
}

function buildSelectedHostReadout(solveContext) {
  if (!solveContext?.hostFrame) return "Host-frame context unavailable.";
  const hostFrame = solveContext.hostFrame;
  const hostMass = Number(solveContext.starConfig?.massMsol || 0);
  const hzText = formatHabitableZoneRange(hostFrame.zones?.habitableZoneAu);
  return [
    `Selected host: ${hostFrame.label} (${formatHostFrameScopeLabel(hostFrame)})`,
    `Host mass: ${fmt(hostMass, 4)} Msol`,
    `${getHostZoneLabel(hostFrame)}: ${hzText}`,
  ].join(" | ");
}

function buildHostFrameOptions(homeSystemContext) {
  return Object.values(homeSystemContext?.hostFramesById || {}).map((hostFrame) => ({
    id: hostFrame.id,
    label: formatHostFrameOptionLabel(hostFrame),
  }));
}

function buildOtherHostFrameBodies({
  bodies,
  selectedHostFrameId,
  fallbackHostFrameId,
  homeSystemContext,
  orbitMode,
}) {
  const rows = [];
  const targetHostFrameId = normalizeHostFrameId(selectedHostFrameId, fallbackHostFrameId);
  const pushBody = (body) => {
    if (!body) return;
    rows.push(body);
  };

  for (const body of bodies || []) {
    const hostFrameId = normalizeHostFrameId(body?.hostFrameId, fallbackHostFrameId);
    if (hostFrameId === targetHostFrameId) continue;
    const hostFrame = homeSystemContext?.hostFramesById?.[hostFrameId] || null;
    const manualAu = planetaryBodyOrbitAu(body);
    const orbitSlots = hostFrame?.system?.orbitsAu || [];
    const slotAu =
      body?.slotIndex != null && body?.legacyKind === "rocky"
        ? Number(orbitSlots[body.slotIndex - 1])
        : Number.NaN;
    const usesSlot = body?.legacyKind === "rocky" && orbitMode !== "manual";
    const au = usesSlot && Number.isFinite(slotAu) && slotAu > 0 ? slotAu : manualAu;
    let orbitLabel =
      Number.isFinite(manualAu) && manualAu > 0 ? `${fmt(manualAu, 3)} AU` : "Orbit TBD";
    if (usesSlot) {
      orbitLabel =
        body?.slotIndex != null
          ? Number.isFinite(slotAu) && slotAu > 0
            ? `Slot ${String(body.slotIndex).padStart(2, "0")} - ${fmt(slotAu, 3)} AU`
            : `Slot ${String(body.slotIndex).padStart(2, "0")}`
          : "Unassigned";
    }
    pushBody({
      name: body.name || body.id,
      kind: `${planetaryBodyKindLabel(body)} - ${hostFrame?.label || hostFrameId}`,
      au: Number.isFinite(au) && au > 0 ? au : Number.POSITIVE_INFINITY,
      auLabel: orbitLabel,
    });
  }

  return rows.sort((left, right) => left.au - right.au);
}

const TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "The System page arranges planets and moons into orbital slots around " +
      "your star. Use the system poster at the top for a visual overview, and " +
      "the panels below to configure placement.",
  },
  {
    title: "Orbit Spacing",
    body:
      "In Guided mode, Spacing Factor and Orbit 1 control logarithmic orbit " +
      "slot placement. Adjust them to space out your planets realistically. " +
      "The slot list shows generated positions in AU.",
  },
  {
    title: "Assigning Bodies",
    body:
      "Drag planets from the Unassigned list into orbit slots. Green slots " +
      "are in the habitable zone; grey slots lie beyond the frost line. Each " +
      "slot holds one body.",
  },
  {
    title: "Moons and Locking",
    body:
      "Drag moons onto planets to assign them. Lock bodies with the lock " +
      "icon to prevent accidental reassignment. Edit buttons jump to the " +
      "Planet or Moon detail page.",
  },
  {
    title: "System Poster",
    body:
      "The poster visualises your full system. Toggle labels, moons, " +
      "habitable zone, frost line, debris disks, and guides. Switch between " +
      "logarithmic and linear scale. Export as PNG.",
  },
];

export function initSystemPage(mountEl) {
  const defaults = {
    spacingFactor: 0.33,
    orbit1Au: 0.62,
  };

  const world = loadWorld();
  const primaryStar = getProjectedPrimaryStar(world);
  const state = {
    starMassMsol: Number(primaryStar.massMsol),
    spacingFactor: Number.isFinite(world.system.spacingFactor)
      ? Number(world.system.spacingFactor)
      : defaults.spacingFactor,
    orbit1Au: Number.isFinite(world.system.orbit1Au)
      ? Number(world.system.orbit1Au)
      : defaults.orbit1Au,
    activeHostFrameId: normalizeHostFrameId(
      world?.stellarSystem?.defaultHostFrameId,
      world?.star ? "star_a" : null,
    ),
  };

  const wrap = document.createElement("div");
  wrap.className = "page";
  wrap.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--system" aria-hidden="true"></span><span>Planetary System</span></h1>
        <button id="sysTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        <div class="hint">Tune Spacing Factor and Orbit 1 to generate slot spacing, then assign inner planets to available orbit slots.</div>
        <div class="button-row" style="margin-top:10px">
          <button id="systemGenerateRandomBtn" type="button">Generate Random System</button>
        </div>
      </div>
    </div>

    <div class="panel" id="posterPanel">
      <div class="panel__header" style="cursor:pointer" id="posterToggleHeader">
        <h2>System Poster ${tipIcon(TIP_LABEL["System poster"])}</h2>
        <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
          <button class="small" type="button" id="btn-poster-export" title="Export PNG">Export PNG</button>
          <button class="small" type="button" id="btn-poster-fs" title="Fullscreen">Fullscreen</button>
          <button class="small" type="button" id="btn-poster-collapse" title="Toggle poster">&#x25B2;</button>
        </div>
      </div>
      <div class="panel__body" id="posterBody">
        <div class="poster-controls" id="posterControls">
          <div class="poster-controls__row poster-controls__checks">
            <label class="viz-check"><input id="pchk-labels" type="checkbox" checked /><span>Labels</span></label>
            <label class="viz-check"><input id="pchk-moons" type="checkbox" checked /><span>Moons</span></label>
            <label class="viz-check"><input id="pchk-hz" type="checkbox" checked /><span>Habitable zone</span></label>
            <label class="viz-check"><input id="pchk-frost" type="checkbox" checked /><span>Frost line</span></label>
            <label class="viz-check"><input id="pchk-debris" type="checkbox" checked /><span>Debris disks</span></label>
            <label class="viz-check"><input id="pchk-guides" type="checkbox" checked /><span>Orbital guides</span></label>
            <label class="viz-check"><input id="pchk-starfield" type="checkbox" checked /><span>Starfield</span></label>
            <label class="viz-check"><input id="pchk-multistar-info" type="checkbox" checked /><span>Multistar info ${tipIcon(TIP_LABEL["Multistar info panel"] || "")}</span></label>
          </div>
          <div class="poster-controls__row">
            <div class="pill-toggle-wrap" style="min-width:260px">
              <div class="physics-duo-toggle" data-toggle="posterScale">
                <input type="radio" name="posterScale" id="pscale-log" value="log" checked />
                <label for="pscale-log">Logarithmic</label>
                <input type="radio" name="posterScale" id="pscale-lin" value="linear" />
                <label for="pscale-lin">Linear</label>
                <span></span>
              </div>
            </div>
          </div>
        </div>
        <div class="system-poster-wrap" id="posterWrap">
          <canvas id="systemPoster"></canvas>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">

          <div class="label">Orbit Placement ${tipIcon(TIP_LABEL["Orbit Placement Mode"] || "")}</div>
          <div class="hint">Guided uses generated orbit slots. Manual sets orbit per-planet.</div>
          <div class="pill-toggle-wrap" style="min-width:260px">
            <div class="physics-duo-toggle" data-toggle="orbitMode">
              <input type="radio" name="orbitMode" id="omode-guided" value="guided" checked />
              <label for="omode-guided">Guided</label>
              <input type="radio" name="orbitMode" id="omode-manual" value="manual" />
              <label for="omode-manual">Manual</label>
              <span></span>
            </div>
          </div>

          <div style="height:10px"></div>

          <div class="form-row" id="hostFrameRow">
            <div>
              <div class="label">Host Frame ${tipIcon(TIP_LABEL["Host Frame"] || "")}</div>
              <div class="hint">Choose which star or pair this page is arranging.</div>
            </div>
            <div class="input-pair">
              <select id="hostFrameSelect" aria-label="Host frame"></select>
              <div class="hint" id="hostFrameHint"></div>
            </div>
          </div>

          <div style="height:10px"></div>

          <div class="label">Selected Host ${tipIcon(TIP_LABEL["Selected Host"] || "")}</div>
          <div class="hint">Read-only. Change stellar topology and properties on the Star tab.</div>
          <div class="derived-readout" id="massDisplay"></div>

          <div id="guidedInputs">
            <div style="height:8px"></div>

            ${numWithSlider("spacing", "Spacing Factor", "", "Controls orbit slot spacing.", 0, 10, 0.01)}
            ${numWithSlider("orbit1", "Orbit 1", "AU", "First orbit slot.", 0.0001, 1000000, 0.01)}

            <div style="height:10px"></div>
            <div class="hint">Gas giants are managed on the <a href="#/planet">Planets</a> tab. Debris disks are managed on the <a href="#/outer">Other Objects</a> tab.</div>

            <div class="button-row">
              <button id="btn-sol">Sol-ish Preset</button>
              <button id="btn-reset">Reset to Defaults</button>
            </div>

            <div class="hint" style="margin-top:10px">
              Tip: adjust Orbit 1 and Spacing to get a nice distribution of orbit slots around the habitable zone.
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Outputs</h2></div>
        <div class="panel__body">
          <div class="kpi-grid" id="kpis"></div>
          <div id="orbitalArchitectureDiagnostics" style="margin-top:12px"></div>

          <div style="margin-top:14px">
            <div id="guidedOutputs">
              <div class="label">Planets in system ${tipIcon(TIP_LABEL["Planets in system"] || "")}</div>
              <div class="hint">Drag planets into orbit slots. One planet per slot.</div>
              <div class="dropzone" id="unassignedZone">
                <div class="dropzone-title">Unassigned planets</div>
                <div id="unassignedPlanets"></div>
              </div>

              <div style="height:10px"></div>
              <div class="dropzone" id="unassignedMoonsZone">
                <div class="dropzone-title">Unassigned moons</div>
                <div id="unassignedMoons"></div>
              </div>

              <div style="height:14px"></div>
              <div class="label">Orbit slots ${tipIcon(TIP_LABEL["Orbit slots"] || "")}</div>
              <div class="hint">One planet per slot. Manage planets on the Planets tab.</div>
              <div id="slotsUi" style="margin-top:10px"></div>

              <div style="height:10px"></div>
              <div class="label">Derived orbit slots (AU) ${tipIcon(TIP_LABEL["Orbit Slots (AU)"] || "")}</div>
              <div class="hint">Generated orbit positions (1-20).</div>
              <div class="derived-readout" id="orbits"></div>
            </div>

            <div id="manualOutputs" style="display:none">
              <div class="label">Bodies by orbit</div>
              <div class="hint" id="manualBodyHint">Sorted by semi-major axis in the selected host frame. Edit orbits on the Planets tab.</div>
              <div id="manualBodyList" style="margin-top:10px"></div>
            </div>

            <div id="otherHostBodiesWrap" style="display:none; margin-top:14px">
              <div class="label">Other host-frame bodies</div>
              <div class="hint" id="otherHostBodiesHint">
                Bodies assigned to other stars or pairs stay listed here. Switch Host Frame to edit them in the main ladder.
              </div>
              <div id="otherHostBodies" style="margin-top:10px"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

  `;
  mountEl.appendChild(wrap);
  attachTooltips(wrap);
  createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.system.tutorial",
    container: wrap,
    triggerBtn: wrap.querySelector("#sysTutorials"),
  });

  const massDisplay = wrap.querySelector("#massDisplay");
  const hostFrameRowEl = wrap.querySelector("#hostFrameRow");
  const hostFrameSelectEl = wrap.querySelector("#hostFrameSelect");
  const hostFrameHintEl = wrap.querySelector("#hostFrameHint");

  const spacingEl = wrap.querySelector("#spacing");
  const orbit1El = wrap.querySelector("#orbit1");

  const kpisEl = wrap.querySelector("#kpis");
  const orbitalArchitectureEl = wrap.querySelector("#orbitalArchitectureDiagnostics");
  const unassignedEl = wrap.querySelector("#unassignedPlanets");
  const unassignedMoonsEl = wrap.querySelector("#unassignedMoons");
  const slotsUiEl = wrap.querySelector("#slotsUi");
  const orbitsEl = wrap.querySelector("#orbits");
  const guidedInputsEl = wrap.querySelector("#guidedInputs");
  const guidedOutputsEl = wrap.querySelector("#guidedOutputs");
  const manualOutputsEl = wrap.querySelector("#manualOutputs");
  const manualBodyHintEl = wrap.querySelector("#manualBodyHint");
  const manualBodyListEl = wrap.querySelector("#manualBodyList");
  const otherHostBodiesWrapEl = wrap.querySelector("#otherHostBodiesWrap");
  const otherHostBodiesHintEl = wrap.querySelector("#otherHostBodiesHint");
  const otherHostBodiesEl = wrap.querySelector("#otherHostBodies");
  const posterCanvas = wrap.querySelector("#systemPoster");
  const posterWrap = wrap.querySelector("#posterWrap");
  const posterBody = wrap.querySelector("#posterBody");
  const posterPanel = wrap.querySelector("#posterPanel");
  let posterRendererReady = false;
  let disposed = false;
  let noticeTimer = null;
  const cleanupFns = [];

  function disposePage() {
    if (disposed) return;
    disposed = true;
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    posterRendererReady = false;
    cachedPosterData = null;
    disposeSystemPosterNative(posterCanvas);
    while (cleanupFns.length) {
      const fn = cleanupFns.pop();
      try {
        fn?.();
      } catch {}
    }
  }

  function showSystemNotice(message) {
    let noteEl = wrap.querySelector(".system-float-note");
    if (!noteEl) {
      noteEl = document.createElement("div");
      noteEl.className = "system-float-note";
      wrap.appendChild(noteEl);
    }
    noteEl.textContent = message;
    noteEl.classList.add("is-visible");
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      noteEl.classList.remove("is-visible");
    }, 3200);
  }

  const posterUnmountObserver = new MutationObserver(() => {
    if (wrap.isConnected) return;
    disposePage();
  });
  posterUnmountObserver.observe(document.body, { childList: true, subtree: true });
  cleanupFns.push(() => {
    try {
      posterUnmountObserver.disconnect();
    } catch {}
  });

  // Poster display state
  const posterState = {
    labels: true,
    moons: true,
    hz: true,
    frost: true,
    debris: true,
    guides: true,
    starfield: true,
    multistarInfo: true,
    scale: "log", // "log" or "linear"
    collapsed: false,
  };

  // Collapse toggle
  const collapseBtn = wrap.querySelector("#btn-poster-collapse");
  const collapseBtnDefaultTitle = collapseBtn?.getAttribute("title") || "Toggle poster";
  wrap.querySelector("#posterToggleHeader").addEventListener("click", (e) => {
    if (collapseBtn?.disabled) return;
    if (e.target.closest("button") && e.target.closest("button") !== collapseBtn) return;
    posterState.collapsed = !posterState.collapsed;
    posterBody.style.display = posterState.collapsed ? "none" : "";
    collapseBtn.textContent = posterState.collapsed ? "\u25BC" : "\u25B2";
  });

  // Export PNG
  wrap.querySelector("#btn-poster-export").addEventListener("click", async (e) => {
    e.stopPropagation();
    const fn = `worldsmith-system-poster-${makeTimestampToken()}.png`;
    await downloadCanvasPng(posterCanvas, fn);
  });

  // Fullscreen
  const btnPosterFs = wrap.querySelector("#btn-poster-fs");
  function isPosterFullscreen() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    return fsEl === posterPanel;
  }
  btnPosterFs.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPosterFullscreen()) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else if (posterPanel.requestFullscreen) {
      posterPanel.requestFullscreen();
    } else if (posterPanel.webkitRequestFullscreen) {
      posterPanel.webkitRequestFullscreen();
    }
  });
  function onPosterFullscreenChange() {
    const isFs = isPosterFullscreen();
    btnPosterFs.textContent = isFs ? "Exit" : "Fullscreen";
    if (collapseBtn) {
      collapseBtn.disabled = isFs;
      collapseBtn.title = isFs ? "Hide/show disabled in fullscreen" : collapseBtnDefaultTitle;
    }
    posterCanvas.style.width = "";
    posterCanvas.style.height = "";
    requestAnimationFrame(() => drawPoster());
  }
  document.addEventListener("fullscreenchange", onPosterFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onPosterFullscreenChange);
  cleanupFns.push(() => {
    try {
      document.removeEventListener("fullscreenchange", onPosterFullscreenChange);
    } catch {}
    try {
      document.removeEventListener("webkitfullscreenchange", onPosterFullscreenChange);
    } catch {}
  });
  onPosterFullscreenChange();

  // Checkbox toggles
  const posterChecks = {
    labels: wrap.querySelector("#pchk-labels"),
    moons: wrap.querySelector("#pchk-moons"),
    hz: wrap.querySelector("#pchk-hz"),
    frost: wrap.querySelector("#pchk-frost"),
    debris: wrap.querySelector("#pchk-debris"),
    guides: wrap.querySelector("#pchk-guides"),
    starfield: wrap.querySelector("#pchk-starfield"),
    multistarInfo: wrap.querySelector("#pchk-multistar-info"),
  };
  for (const [key, el] of Object.entries(posterChecks)) {
    el.addEventListener("change", () => {
      posterState[key] = el.checked;
      drawPoster();
    });
  }

  // Scale toggle
  wrap.querySelector('[data-toggle="posterScale"]').addEventListener("change", (e) => {
    posterState.scale = e.target.value;
    drawPoster();
  });

  // Cached poster data for redraws from controls
  let cachedPosterData = null;
  function drawPoster() {
    if (!posterRendererReady || !cachedPosterData) return;
    drawSystemPoster(posterCanvas, cachedPosterData, { ...posterState });
  }

  function initPosterRenderer() {
    posterRendererReady = true;
    drawPoster();
  }

  // Bind sliders
  bindPair("spacing", spacingEl, 0, 10, 0.01, "auto");
  bindPair("orbit1", orbit1El, 0.0001, 1000000, 0.01, "auto");

  function bindPair(id, numberEl, min, max, step, mode) {
    const sliderEl = wrap.querySelector(`#${id}_slider`);
    const minEl = wrap.querySelector(`#${id}_min`);
    const maxEl = wrap.querySelector(`#${id}_max`);
    minEl.textContent = String(min);
    maxEl.textContent = String(max);
    bindNumberAndSlider({ numberEl, sliderEl, min, max, step, mode });
  }

  let isRendering = false;

  function getGasGiants(w) {
    return listMoonParentBodies(w)
      .filter((body) => body.legacyKind === "gasGiant")
      .map(gasGiantFromBodyProjection)
      .sort((a, b) => a.au - b.au);
  }

  function getDebrisDisks(w) {
    return listSystemDebrisDisks(w, {
      hostFrameId: state.activeHostFrameId,
      fallbackHostFrameId:
        normalizeHostFrameId(w?.stellarSystem?.defaultHostFrameId, state.activeHostFrameId) ||
        "star_a",
    });
  }

  function mapGasGiantsToSlots(orbitsAu, gasGiants) {
    const bySlot = new Map();
    const usedSlots = new Set();
    const sorted = [...gasGiants].sort((a, b) => a.au - b.au);
    for (const giant of sorted) {
      let bestSlot = null;
      let bestDiff = Infinity;
      for (let i = 0; i < orbitsAu.length; i++) {
        const slot = i + 1;
        if (usedSlots.has(slot)) continue;
        const diff = Math.abs(orbitsAu[i] - giant.au);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestSlot = slot;
        }
      }
      if (bestSlot == null) continue;
      const slotAu = orbitsAu[bestSlot - 1];
      const tol = orbitSlotToleranceAu(slotAu);
      if (bestDiff <= tol || !Number.isFinite(tol)) {
        bySlot.set(bestSlot, giant);
        usedSlots.add(bestSlot);
        continue;
      }
      // If no slot is close enough, still map to nearest slot so the giant replaces one row.
      bySlot.set(bestSlot, giant);
      usedSlots.add(bestSlot);
    }
    return bySlot;
  }

  function syncFromWorld() {
    const w = loadWorld();
    state.spacingFactor = Number.isFinite(w.system.spacingFactor)
      ? Number(w.system.spacingFactor)
      : defaults.spacingFactor;
    state.orbit1Au = Number.isFinite(w.system.orbit1Au)
      ? Number(w.system.orbit1Au)
      : defaults.orbit1Au;
  }

  function renderHostFrameSelector(homeSystemContext, solveContext) {
    const options = buildHostFrameOptions(homeSystemContext);
    hostFrameRowEl.style.display = options.length > 1 ? "" : "none";
    hostFrameSelectEl.replaceChildren(
      ...options.map((option) => {
        const node = document.createElement("option");
        node.value = option.id;
        node.textContent = option.label;
        return node;
      }),
    );
    hostFrameSelectEl.value = solveContext?.hostFrameId || state.activeHostFrameId || "";
    hostFrameSelectEl.disabled = options.length <= 1;
    hostFrameHintEl.textContent = formatHostFrameHint(solveContext);
  }

  function render() {
    if (isRendering) return;
    isRendering = true;
    try {
      syncFromWorld();

      const w0 = loadWorld();
      const primaryStar = getProjectedPrimaryStar(w0);

      const homeSystemContext = buildWorldHomeSystemContext(w0);
      const fallbackHostFrameId =
        homeSystemContext.defaultHostFrameId || homeSystemContext.primaryStarId || null;
      const activeSolveContext = resolveWorldHostFrameContext(
        w0,
        normalizeHostFrameId(state.activeHostFrameId, fallbackHostFrameId),
        homeSystemContext,
      );
      state.activeHostFrameId =
        activeSolveContext?.hostFrameId ||
        normalizeHostFrameId(state.activeHostFrameId, fallbackHostFrameId);
      const activeHostFrame = activeSolveContext?.hostFrame || null;
      const model = activeHostFrame?.system || homeSystemContext.primarySystem;
      state.starMassMsol = Number(activeSolveContext?.starConfig?.massMsol || primaryStar.massMsol);
      const zoneLabel = getHostZoneLabel(activeHostFrame);

      renderHostFrameSelector(homeSystemContext, activeSolveContext);
      massDisplay.textContent = buildSelectedHostReadout(activeSolveContext);

      const items = [
        {
          label: zoneLabel,
          value: formatHabitableZoneRange(activeHostFrame?.zones?.habitableZoneAu).replace(
            " AU",
            "",
          ),
          meta: "AU",
          tipLabel: "Habitable Zone",
        },
        {
          label: "H2O Frost Line",
          value: fmt(Number(activeHostFrame?.zones?.frostLineAu) || 0, 3),
          meta: "AU",
        },
        {
          label: "System Inner Limit",
          value: fmt(Number(activeHostFrame?.zones?.systemInnerLimitAu) || 0, 4),
          meta: "AU",
        },
        { label: "Host Mass", value: fmt(state.starMassMsol, 4), meta: "Msol" },
        {
          label: "Host Luminosity",
          value: fmt(Number(activeSolveContext?.starModel?.luminosityLsol) || 0, 3),
          meta: "Lsol",
        },
        {
          label: "Host Radius",
          value: fmt(Number(activeSolveContext?.starModel?.radiusRsol) || 0, 3),
          meta: "Rsol",
        },
      ];

      renderSystemKpis(kpisEl, items, TIP_LABEL);

      // ── Orbit mode UI toggle ──
      const orbitMode = w0.system.orbitMode || "guided";
      const isManual = orbitMode === "manual";
      const guidedRadio = wrap.querySelector("#omode-guided");
      const manualRadio = wrap.querySelector("#omode-manual");
      if (guidedRadio) guidedRadio.checked = !isManual;
      if (manualRadio) manualRadio.checked = isManual;
      guidedInputsEl.style.display = isManual ? "none" : "";
      guidedOutputsEl.style.display = isManual ? "none" : "";
      manualOutputsEl.style.display = isManual ? "" : "none";
      manualBodyHintEl.textContent = `Sorted by semi-major axis in ${activeHostFrame?.label || "the selected host frame"}. Edit orbits on the Planets tab. Manual orbit mode disables planet slot dragging, but moon parent assignment is still available.`;

      // Planet assignment UI
      const planets = listPlanets(w0);

      // Build ordered orbit items with slot replacement by gas giants.
      const gasGiants = getGasGiants(w0);
      const hostPlanets = filterBodiesForHostFrame(
        planets,
        state.activeHostFrameId,
        fallbackHostFrameId,
      );
      const hostGasGiants = filterBodiesForHostFrame(
        gasGiants,
        state.activeHostFrameId,
        fallbackHostFrameId,
      );
      const gasBySlot = mapGasGiantsToSlots(model.orbitsAu, hostGasGiants);
      const debrisRows = getDebrisDisks(w0)
        .filter((d) => d.innerAu > 0 && d.outerAu > 0)
        .map((d) => ({
          id: d.id,
          name: d.name,
          inner: Math.min(d.innerAu, d.outerAu),
          outer: Math.max(d.innerAu, d.outerAu),
        }));

      const maxGasAu = hostGasGiants.length
        ? Math.max(...hostGasGiants.map((giant) => Number(giant.au) || 0))
        : 0;
      const maxDebrisAu = debrisRows.length
        ? Math.max(...debrisRows.map((d) => Number(d.outer) || 0))
        : 0;
      const cutoffAu = Math.max(maxGasAu, maxDebrisAu, 0);

      const orbitItems = [];
      for (let i = 0; i < model.orbitsAu.length; i++) {
        const slotAu = model.orbitsAu[i];
        const slot = i + 1;
        if (cutoffAu > 0 && slotAu > cutoffAu) continue;
        const giant = gasBySlot.get(slot);
        if (giant) {
          orbitItems.push({ type: "gas", slot, au: Number(giant.au) || slotAu, giant });
        } else {
          orbitItems.push({ type: "slot", slot, au: slotAu });
        }
      }
      for (const disk of debrisRows) {
        const mid = (disk.inner + disk.outer) / 2;
        orbitItems.push({ type: "debris", au: mid, ...disk });
      }
      orbitItems.sort((a, b) => a.au - b.au);

      // Keep persisted assignments valid when slots get replaced/cut off.
      const validSlots = new Set(
        orbitItems.filter((it) => it.type === "slot").map((it) => it.slot),
      );
      const invalidAssignments = hostPlanets.filter(
        (p) => p.slotIndex != null && !validSlots.has(p.slotIndex),
      );
      if (invalidAssignments.length) {
        for (const p of invalidAssignments) assignPlanetToSlot(p.id, null);
      }
      let worldForUi = w0;
      let allPlanetsForUi = planets;
      if (invalidAssignments.length) {
        worldForUi = loadWorld();
        allPlanetsForUi = listPlanets(worldForUi);
      }
      const planetsForUi = filterBodiesForHostFrame(
        allPlanetsForUi,
        state.activeHostFrameId,
        fallbackHostFrameId,
      );
      const allBodyProjectionsForUi = listPlanetaryBodies(worldForUi);
      const bodyProjectionsForUi = filterBodiesForHostFrame(
        allBodyProjectionsForUi,
        state.activeHostFrameId,
        fallbackHostFrameId,
      );
      const bodyProjectionById = new Map(bodyProjectionsForUi.map((body) => [body.id, body]));
      const annotatedPlanetsForUi = planetsForUi.map((planet) => {
        const projection = bodyProjectionById.get(planet.id);
        if (!projection) return planet;
        return {
          ...planet,
          classification: projection.classification,
          classificationLabel: planetaryBodyKindLabel(projection),
        };
      });
      const moonsForUi = listMoons(worldForUi);
      const moonParentBodiesForUi = filterBodiesForHostFrame(
        listMoonParentBodies(worldForUi),
        state.activeHostFrameId,
        fallbackHostFrameId,
      );
      const moonParentsById = Object.fromEntries(
        moonParentBodiesForUi.map((parent) => [parent.moonParentId || parent.id, parent]),
      );
      const visibleParentIds = new Set(
        moonParentBodiesForUi.map((parent) => parent.moonParentId || parent.id),
      );
      const moonsByPlanet = new Map();
      for (const moon of moonsForUi) {
        const pid = moon?.planetId;
        if (!pid || !visibleParentIds.has(pid)) continue;
        if (!moonsByPlanet.has(pid)) moonsByPlanet.set(pid, []);
        moonsByPlanet.get(pid).push(moon);
      }
      for (const list of moonsByPlanet.values()) list.sort(sortMoonsByOrbitKm);
      const moonCountByPlanet = new Map();
      for (const [pid, list] of moonsByPlanet.entries()) {
        moonCountByPlanet.set(pid, list.length);
      }
      const renderCtx = { planetsById: moonParentsById, moonsByPlanet, moonCountByPlanet };
      const dynamicalContext = buildDynamicalContext({ world: worldForUi, detailLevel: "summary" });
      const orbitalArchitecture =
        dynamicalContext.hostFrames?.[state.activeHostFrameId]?.orbitalArchitecture ||
        dynamicalContext.hostFrames?.[fallbackHostFrameId]?.orbitalArchitecture ||
        null;
      renderOrbitalArchitectureDiagnostics(orbitalArchitectureEl, orbitalArchitecture);

      // Unassigned list
      const unassigned = annotatedPlanetsForUi.filter((p) => p.slotIndex == null);
      renderUnassignedPlanets(unassignedEl, unassigned, model, { moonCountByPlanet });

      const unassignedMoons = moonsForUi.filter((m) => m.planetId == null).sort(sortMoonsByOrbitKm);
      renderUnassignedMoons(unassignedMoonsEl, unassignedMoons, { planetsById: moonParentsById });
      renderOrbitSlots(slotsUiEl, {
        hostTitle: activeHostFrame?.label || "Host frame",
        hostSummary: `${formatHostFrameScopeLabel(activeHostFrame)} - ${fmt(state.starMassMsol, 4)} Msol`,
        orbitItems,
        planets: annotatedPlanetsForUi,
        sysModel: model,
        renderCtx,
      });
      // Attach DnD handlers
      setupDnD();

      orbitsEl.textContent = model.orbitsAu
        .map((v, i) => `Orbit ${String(i + 1).padStart(2, "0")}: ${fmt(v, 3)} AU`)
        .join("\n");

      // ── Manual mode: sorted body list ──
      if (isManual) {
        const manualPlanetsById = new Map(
          annotatedPlanetsForUi.map((planet) => [planet.id, planet]),
        );
        const allBodies = bodyProjectionsForUi.map((body) => {
          const row = manualBodyListItemFromProjection(body);
          if (body?.legacyKind === "rocky") {
            row.planet = manualPlanetsById.get(body.id) || null;
          } else if (body?.legacyKind === "gasGiant") {
            row.gasGiant = gasGiantFromBodyProjection(body);
          }
          return row;
        });
        for (const d of debrisRows) {
          const mid = (d.inner + d.outer) / 2;
          allBodies.push({
            kind: "Debris disk",
            name: d.name || "Debris disk",
            au: mid,
            auLabel: `${fmt(d.inner, 2)}\u2013${fmt(d.outer, 2)} AU`,
          });
        }
        allBodies.sort((a, b) => a.au - b.au);
        renderManualBodyList(manualBodyListEl, allBodies, {
          sysModel: model,
          renderCtx,
          allowPlanetDrag: false,
          placementText: "Manual orbit",
        });
      } else {
        manualBodyListEl.replaceChildren();
      }
      const otherHostBodies = buildOtherHostFrameBodies({
        bodies: allBodyProjectionsForUi,
        selectedHostFrameId: state.activeHostFrameId,
        fallbackHostFrameId,
        homeSystemContext,
        orbitMode,
      });
      if (otherHostBodies.length) {
        otherHostBodiesWrapEl.style.display = "";
        otherHostBodiesHintEl.textContent = `Bodies assigned outside ${activeHostFrame?.label || "this host frame"} stay listed here. Switch Host Frame to work on their orbit family.`;
        renderManualBodyList(otherHostBodiesEl, otherHostBodies);
      } else {
        otherHostBodiesWrapEl.style.display = "none";
        otherHostBodiesEl.replaceChildren();
      }

      // ── System Poster ──────────────────────────────
      const posterSnapshot = buildSystemPosterSnapshotInputs(worldForUi, {
        orbitMode,
        hostFrameId: state.activeHostFrameId,
      });
      const posterPlanets = posterSnapshot.posterData.planets.map((planet) => ({
        id: planet.id,
        name: planet.name,
        au: planet.au,
        radiusKm: planet.radiusKm,
        dayHex: planet.dayHex,
        horizonHex: planet.horizonHex,
        renderFamily: planet.renderFamily,
        classLabel: planet.classLabel,
        style: planet.style,
        gasCalc: planet.gasCalc,
        visualProfile: planet.visualProfile,
        visualSubtypeKey: planet.visualSubtypeKey,
        subtypeSummary: planet.subtypeSummary,
        recipeId: planet.recipeId,
        ringAppearance: planet.ringAppearance,
      }));

      cachedPosterData = {
        star: posterSnapshot.posterData.star,
        system: posterSnapshot.posterData.system,
        topologyKind: posterSnapshot.posterData.topologyKind,
        activeHostFrameId: posterSnapshot.posterData.activeHostFrameId,
        activeHostFrameLabel: posterSnapshot.posterData.activeHostFrameLabel,
        canvasMode: posterSnapshot.posterData.canvasMode,
        hostStars: posterSnapshot.posterData.hostStars,
        companionStars: posterSnapshot.posterData.companionStars,
        planets: posterPlanets,
        gasGiants: posterSnapshot.posterData.gasGiants,
        moons: posterSnapshot.posterData.moons,
        debrisDisks: posterSnapshot.posterData.debrisDisks,
      };
      drawPoster();
    } finally {
      isRendering = false;
    }
  }

  function loadIntoInputs() {
    syncFromWorld();
    spacingEl.value = state.spacingFactor;
    orbit1El.value = state.orbit1Au;

    ["spacing", "orbit1"].forEach((id) => {
      const numberEl = wrap.querySelector(`#${id}`);
      numberEl.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  function applyFromInputs() {
    state.spacingFactor = Number(spacingEl.value);
    state.orbit1Au = Number(orbit1El.value);

    updateWorld({
      system: {
        spacingFactor: state.spacingFactor,
        orbit1Au: state.orbit1Au,
      },
    });

    render();
  }

  // Live-update: apply on every input change
  [spacingEl, orbit1El].forEach((el) => el.addEventListener("input", applyFromInputs));

  wrap.querySelector("#btn-sol").addEventListener("click", () => {
    state.spacingFactor = 0.35;
    state.orbit1Au = 0.4;
    updateWorld({
      system: {
        spacingFactor: state.spacingFactor,
        orbit1Au: state.orbit1Au,
      },
    });
    loadIntoInputs();
    render();
  });

  wrap.querySelector("#btn-reset").addEventListener("click", () => {
    Object.assign(state, defaults);
    updateWorld({
      system: {
        spacingFactor: state.spacingFactor,
        orbit1Au: state.orbit1Au,
      },
    });
    loadIntoInputs();
    render();
  });

  wrap.querySelector("#systemGenerateRandomBtn")?.addEventListener("click", () => {
    openSystemRandomGenerationOverlay({
      onApplied() {
        loadIntoInputs();
        render();
      },
    });
  });

  // ── Orbit placement mode toggle ──
  wrap.querySelector('[data-toggle="orbitMode"]').addEventListener("change", (e) => {
    const mode = e.target.value;
    const currentWorld = loadWorld();
    const homeSystemContext = buildWorldHomeSystemContext(currentWorld);
    const solveContext = resolveWorldHostFrameContext(
      currentWorld,
      state.activeHostFrameId,
      homeSystemContext,
    );
    setOrbitMode(mode, solveContext?.hostFrame?.system?.orbitsAu);
    render();
  });

  hostFrameSelectEl.addEventListener("change", () => {
    state.activeHostFrameId = normalizeHostFrameId(
      hostFrameSelectEl.value,
      state.activeHostFrameId,
    );
    render();
  });

  function sortMoonsByOrbitKm(a, b) {
    const aa = Number(a?.inputs?.semiMajorAxisKm);
    const bb = Number(b?.inputs?.semiMajorAxisKm);
    const av = Number.isFinite(aa) && aa > 0 ? aa : Infinity;
    const bv = Number.isFinite(bb) && bb > 0 ? bb : Infinity;
    return av - bv;
  }

  function setupDnD() {
    // Ensure we don't double-bind
    if (wrap.__dndBound) return;
    wrap.__dndBound = true;

    let dragPayload = null;

    function getDropTarget(fromEl, payload) {
      if (!fromEl || !payload) return null;
      if (payload.type === "planet") {
        return fromEl.closest?.(".dropzone.slot-drop, #unassignedZone");
      }
      if (payload.type === "moon") {
        return fromEl.closest?.(".moon-drop-target, #unassignedMoonsZone");
      }
      return null;
    }

    function readDragPayload(e) {
      if (dragPayload?.id) return dragPayload;
      try {
        const json = e.dataTransfer.getData("application/worldsmith-drag");
        if (json) {
          const parsed = JSON.parse(json);
          if (parsed && parsed.type && parsed.id) return parsed;
        }
      } catch {}
      try {
        const id = e.dataTransfer.getData("text/plain");
        if (id) return { type: "planet", id };
      } catch {}
      return null;
    }

    wrap.addEventListener("dragstart", (e) => {
      const curWorld = loadWorld();
      const moonCard = e.target.closest?.(".moon-card");
      if (moonCard) {
        if (moonCard.classList.contains("is-locked")) {
          e.preventDefault();
          showSystemNotice("This moon's parent assignment is locked. Unlock parent to move it.");
          return;
        }
        const mid = moonCard.getAttribute("data-moon-id");
        if (!mid) {
          e.preventDefault();
          return;
        }
        dragPayload = { type: "moon", id: mid };
        try {
          e.dataTransfer.setData("application/worldsmith-drag", JSON.stringify(dragPayload));
        } catch {}
        try {
          e.dataTransfer.setData("text/plain", mid);
        } catch {}
        e.dataTransfer.effectAllowed = "move";
        return;
      }

      const card = e.target.closest?.(".planet-card");
      if (!card) return;
      if ((curWorld.system.orbitMode || "guided") === "manual") {
        e.preventDefault();
        return;
      }
      if (card.classList.contains("is-locked")) {
        e.preventDefault();
        return;
      }
      const pid = card.getAttribute("data-planet-id");
      if (!pid) {
        e.preventDefault();
        return;
      }
      dragPayload = { type: "planet", id: pid };
      try {
        e.dataTransfer.setData("application/worldsmith-drag", JSON.stringify(dragPayload));
      } catch {}
      try {
        e.dataTransfer.setData("text/plain", pid);
      } catch {}
      e.dataTransfer.effectAllowed = "move";
    });

    wrap.addEventListener("dragend", () => {
      dragPayload = null;
      wrap
        .querySelectorAll(
          ".dropzone.is-over, .moon-drop-target.is-over, #unassignedMoonsZone.is-over",
        )
        .forEach((el) => el.classList.remove("is-over"));
    });

    wrap.addEventListener("dragover", (e) => {
      const payload = readDragPayload(e);
      const target = getDropTarget(e.target, payload);
      if (!target) return;
      e.preventDefault();
      target.classList.add("is-over");
      e.dataTransfer.dropEffect = "move";
    });

    wrap.addEventListener("dragleave", (e) => {
      const payload = readDragPayload(e);
      const target = getDropTarget(e.target, payload);
      if (!target) return;
      if (e.relatedTarget && target.contains(e.relatedTarget)) return;
      target.classList.remove("is-over");
    });

    wrap.addEventListener("drop", (e) => {
      const payload = readDragPayload(e);
      const target = getDropTarget(e.target, payload);
      if (!target || !payload?.id) return;
      e.preventDefault();
      target.classList.remove("is-over");

      if (payload.type === "moon") {
        if (target.id === "unassignedMoonsZone") {
          assignMoonToPlanet(payload.id, null);
          render();
          return;
        }
        const targetPlanetId = target.getAttribute("data-moon-drop-planet-id");
        if (!targetPlanetId) return;
        assignMoonToPlanet(payload.id, targetPlanetId);
        render();
        return;
      }

      if (payload.type === "planet") {
        const zone = target;
        if (zone.id === "unassignedZone") {
          const result = movePlanetToSlot(payload.id, null);
          if (!result.changed && result.reason === "source-locked") {
            showSystemNotice("This planet's slot assignment is locked. Unlock it to move it.");
          }
          render();
          return;
        }

        const slotAttr = zone.getAttribute("data-slot");
        if (!slotAttr) return;
        const slot = Number(slotAttr);

        const wNow = loadWorld();
        const homeSystemContext = buildWorldHomeSystemContext(wNow);
        const solveContext = resolveWorldHostFrameContext(
          wNow,
          state.activeHostFrameId,
          homeSystemContext,
        );
        const orbitSlots = solveContext?.hostFrame?.system?.orbitsAu || [];
        const result = movePlanetToSlot(payload.id, slot, { orbitsAu: orbitSlots });
        if (!result.changed) {
          if (result.reason === "target-locked") {
            showSystemNotice("That slot is occupied by a locked planet. Unlock it to swap.");
          } else if (result.reason === "source-locked") {
            showSystemNotice("This planet's slot assignment is locked. Unlock it to move it.");
          } else if (result.reason === "target-occupied") {
            showSystemNotice("That slot is occupied. Drag from another slot to swap planets.");
          }
        }
        render();
      }
    });

    // Edit button: jump to Planet tab and select planet
    wrap.addEventListener("click", (e) => {
      const guidedMoonBtn = e.target.closest?.("button[data-action='guided-moon']");
      if (guidedMoonBtn) {
        const parentId = guidedMoonBtn.getAttribute("data-parent-id");
        const parentType = guidedMoonBtn.getAttribute("data-parent-type") || "planet";
        if (!parentId) return;
        launchGuidedMoonForParent(parentType, parentId, { sourcePage: "system" });
        return;
      }

      const lockBtn = e.target.closest?.("button[data-action='lock']");
      if (lockBtn) {
        const pid2 = lockBtn.getAttribute("data-planet-id");
        if (pid2) {
          togglePlanetLock(pid2);
          render();
        }
        return;
      }

      const moonLockBtn = e.target.closest?.("button[data-action='lock-moon']");
      if (moonLockBtn) {
        const mid = moonLockBtn.getAttribute("data-moon-id");
        if (!mid) return;
        toggleMoonLock(mid);
        render();
        return;
      }

      const moonBtn = e.target.closest?.("button[data-action='edit-moon']");
      if (moonBtn) {
        const mid = moonBtn.getAttribute("data-moon-id");
        if (!mid) return;
        selectMoon(mid);
        location.hash = "#/moon";
        return;
      }

      const btn = e.target.closest?.("button[data-action='edit']");
      if (!btn) return;
      const pid = btn.getAttribute("data-planet-id");
      if (!pid) return;
      selectPlanet(pid);
      location.hash = "#/planet";
    });
  }

  // Init
  loadIntoInputs();
  render();
  initPosterRenderer();

  // Resize poster canvas on container resize
  if (posterWrap) {
    const posterResizeObserver = new ResizeObserver(() => render());
    posterResizeObserver.observe(posterWrap);
    cleanupFns.push(() => {
      try {
        posterResizeObserver.disconnect();
      } catch {}
    });
  }

  return disposePage;
}

function numWithSlider(id, label, unit, hint, min, max, step) {
  const unitHtml = unit ? ` <span class="unit">${unit}</span>` : "";
  return `
  <div class="form-row">
    <div>
      <div class="label">${label}${unitHtml} ${tipIcon(TIP_LABEL[label] || TIP_LABEL[id] || "")}</div>
      <div class="hint">${hint}</div>
    </div>
    <div class="input-pair">
      <input id="${id}" type="number" step="${step}" aria-label="${label}" />
      <input id="${id}_slider" type="range" aria-label="${label} slider" />
      <div class="range-meta"><span id="${id}_min"></span><span id="${id}_max"></span></div>
    </div>
  </div>`;
}
