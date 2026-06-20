import { calcComet } from "../engine/comet.js";
import { calcDebrisDisk, calcDebrisDiskSuggestions } from "../engine/debrisDisk.js";
import { buildHomeSystemContext, resolveHostFrameContext } from "../engine/homeSystem/context.js";
import { calcOortCloud, resolveOortCloudModel } from "../engine/oortCloud.js";
import { fmt } from "../engine/utils.js";
import { bindNumberAndSlider } from "./bind.js";
import { paintCometPreview, resolveCometAppearance } from "./cometAppearance.js";
import { confirmDestructiveAction } from "./destructiveActionDialog.js";
import { createElement, replaceChildren } from "./domHelpers.js";
import {
  bindOrbitRangeControl,
  createOrbitRangeModeToggleNode,
  ORBIT_AU_MAX,
  ORBIT_AU_MIN,
  orbitRangeModeForValue,
} from "./orbitRangeControl.js";
import { buildPageIntroHtml } from "./pageIntro.js";
import { enableKpiInteractions } from "./planet/outputRender.js";
import { buildDeleteCometPlan, buildDeleteDebrisDiskPlan } from "./store/destructiveActions.js";
import { COMET_SOURCE_RESERVOIRS, COMET_VOLATILE_CLASSES } from "./store/cometModel.js";
import {
  DEFAULT_OORT_CLOUD_CONFIG,
  OORT_CLOUD_SEED_INCLINATIONS,
  OORT_CLOUD_SEED_NUCLEUS_BIASES,
  OORT_CLOUD_SEED_PROFILES,
  OORT_CLOUD_SEED_VOLATILES,
} from "./store/oortCloudModel.js";
import { attachTooltips, tipIcon } from "./tooltip.js";
import { createTutorial } from "./tutorial.js";
import {
  getSelectedComet,
  getSystemOortCloudConfig,
  listDebrisDiskPerturbers,
  listSystemComets,
  loadWorld,
  listSystemDebrisDisks,
  saveSystemComets,
  saveSystemDebrisDisks,
  saveSystemOortCloudConfig,
  saveWorld,
  selectComet,
} from "./store.js";

const TIP_LABEL = {
  // ── Debris disk inputs ──
  "Debris disks":
    "Debris regions (asteroid/Kuiper-belt-like zones) of planetesimals, dust, and ice. This page edits the disks for the selected host frame only, so multistar systems can keep separate belt families around different stars or pairs.\n\nSwitch Host Frame to work on another orbit family without overwriting its belts.",
  "Host Frame":
    "Select which stellar host frame these debris disks belong to.\n\nIn multistar systems, each host frame has its own gas giants, frost line, stable belt region, and radiative environment. Suggestions, thermals, and stability checks all follow the selected host frame.",
  "Selected Host":
    "Read-only summary of the active host frame.\n\nThis tells you which star or pair is supplying the dominant light, where its habitable zone and frost line sit, and whether the current page is editing an S-type or P-type debris architecture.",
  "Disk name": "Name of this debris disk zone.",
  "Inner edge":
    "Inner boundary of the debris disk in AU. In resonance-sculpted disks, this is set by interior mean-motion resonances (e.g. 4:1, 2:1) with the nearest gas giant.",
  "Outer edge":
    "Outer boundary of the debris disk in AU. Exterior resonances (3:2, 2:1) with the nearest gas giant define the outer edge, analogous to the Kuiper cliff at Neptune\u2019s 2:1 resonance.",
  "Disk center":
    "Semi-major axis of the disk midpoint in AU. The disk extends symmetrically around this point by half the width in each direction.",
  "Disk width":
    "Radial width (depth) of the debris disk in AU. The inner edge is center \u2212 width/2, the outer edge is center + width/2.",
  Suggest:
    "Possible debris disk zones ranked by priority for the selected host frame.\n\nP1 \u2014 Outer disk: outermost giant\u2019s 3:2 \u2192 2:1 exterior mean-motion resonance (MMR) (Kuiper belt analog).\nP2 \u2014 Inner disk: innermost giant\u2019s 4:1 \u2192 2:1 interior MMR (asteroid belt analog).\nP3 \u2014 Gap disk: inter-giant gap between adjacent giants\u2019 2:1 resonances. Only viable when giants are ~4\u00d7 apart in AU.\nP4 \u2014 Extended outer disk: outermost giant\u2019s 2:1 \u2192 5:2 exterior MMR (scattered disk analog). Shares boundary with P1.\nP5 \u2014 Warm inner disk: innermost giant\u2019s 8:1 \u2192 4:1 interior MMR (exozodiacal dust analog). Shares boundary with P2.\n\nP4/P5 are not recommended by default because they are contiguous with P1/P2, forming a single mega-belt. With no gas giants in the selected host frame, zones are scaled from that frame\u2019s frost line instead.",

  // ── Debris disk outputs ──
  "Disk Range":
    "Radial extent of the debris disk in AU. Wider disks contain more material and are more likely to be detected via infrared excess.",
  "Disk Temperature":
    "Blackbody equilibrium temperature at the disk midpoint. Determines which ices and minerals condense: water ice below ~170 K, CO\u2082 ice below ~80 K, CO/N\u2082 ice below ~25 K.",
  "Disk Composition":
    "Dominant grain materials based on temperature and stellar metallicity. Inside the frost line (~170 K): rocky silicates and metals. Outside: water ice, organics, and at the coldest distances, volatile ices. Higher [Fe/H] biases solids modestly toward refractory content.",
  Resonance:
    "Debris disk edges sculpted by mean-motion resonances (MMR) with gas giants. 3:2 and 2:1 exterior MMRs define the outer disk; 4:1 and 2:1 interior MMRs define the inner disk.",
  "Estimated Mass":
    "Wyatt (2007) steady-state maximum mass from optical depth and Dohnanyi (1969) collisional cascade (q = 3.5). Represents the upper bound for a disk of this age and location. Actual mass depends on collision history and the largest surviving body.",
  "Disk Orbital Period":
    "Orbital period at the disk midpoint, from Kepler\u2019s third law. Bodies at the inner and outer edges orbit faster and slower respectively.",
  "Disk Derived":
    "Fractional luminosity (L_disk/L\u2605) measures dust brightness. Optical depth (\u03c4) is the fraction of starlight intercepted. Grain blowout size is the minimum grain surviving radiation pressure. PR drag and collisional timescales determine whether the disk is collision- or drag-dominated.",

  // ── New disk inputs ──
  "Disk Eccentricity":
    "Mean orbital eccentricity of disk particles (0\u20130.5). Higher eccentricity increases collision speeds and widens the pericenter\u2013apocenter range. Default 0.05 is typical for a dynamically cool belt.",
  "Disk Inclination":
    "Mean inclination of disk particle orbits (0\u201390\u00b0). Affects the vertical thickness of the disk. 0\u00b0 = face-on; higher values reduce projected area for observers.",
  "Disk Mass Override":
    "Total disk mass in Earth masses. When set, this overrides the Wyatt steady-state mass estimate and reverse-derives optical depth from the given mass. Leave empty to use the default age-based estimate.",

  // ── New disk outputs ──
  "Collision Velocity":
    "Mean collision speed between disk particles: v_coll = e \u00d7 v_Kepler \u00d7 \u221A2. Gentle (<10 m/s) allows accretion, erosive (10\u2013100 m/s) grinds grains, catastrophic (>100 m/s) shatters bodies.",
  "Surface Density":
    "Mass per unit area (\u03A3) of the disk annulus, compared to the Minimum Mass Solar Nebula (MMSN). Values near 100% of MMSN suggest a primordial-mass disk.",
  "IR Excess":
    "Ratio of disk thermal emission to stellar flux at 24 \u03BCm. >10% is easily detectable, 1\u201310% is marginal, <1% is below current instrument thresholds (Spitzer/JWST).",
  "Disk Stability":
    "Checks whether any gas giant\u2019s chaotic zone (Wisdom 1980: \u0394a = 1.3 a (M_p/M\u2605)^(2/7)) overlaps the disk. Overlap means the disk would be cleared on ~Myr timescales.",
  "Dust Production":
    "Rate at which collisional grinding converts planetesimal mass into small dust grains. Equal to M_disk / t_collisional.",
  "Zodiacal Delivery":
    "Poynting\u2013Robertson drag slowly spirals small grains inward. This estimates the mass inflow rate toward the inner system, analogous to the zodiacal dust cloud.",
  "Ice-to-Rock Ratio":
    "Mass ratio of condensed ices to refractory minerals at the disk midpoint. Beyond the frost line this exceeds ~1; inside, the disk is rock-dominated.",
  "Condensation Species":
    "Species present at each disk location based on the Lodders (2003) condensation sequence. A species condenses (is solid) when the local temperature is below its condensation temperature.",

  // ── Summary KPIs ──
  "Debris disks count": "Total number of debris disk zones in the selected host frame.",
  Comets:
    "Named, user-authored comets for the selected host frame. Keep these separate from debris disks so you can model specific short-period or long-period passages without changing the surrounding belt architecture.",
  "Comets count": "Total number of authored comets in the selected host frame.",
  "Oort Cloud":
    "System-wide long-period comet reservoir. Auto mode uses the Caelum paper-backed baseline estimate. Guided mode applies authoring adjustments on top of that baseline. Manual mode directly overrides the displayed reservoir values without creating a literal shell object in the system model.",
  "Reservoir Class":
    "Qualitative reservoir strength from the inferred Oort-cloud mass proxy. Robust systems should sustain a meaningful long-period comet population; Negligible systems should not.",
  "Inner Boundary":
    "Inner edge of the inferred Oort reservoir in AU. Caelum starts from the Solar Oort cloud inner edge scaled by Galactic Hill radius, then applies an outer-giant architecture floor so the cloud remains detached from the scattered-planet region.",
  "Outer Boundary":
    "Outer edge of the inferred Oort reservoir in AU. Caelum scales the Solar Oort cloud outer edge by the system's Galactic Hill radius, so more massive systems or systems farther from the Galactic centre can retain larger clouds.",
  "Oort Estimated Mass":
    "Estimated total Oort-cloud reservoir mass in Earth masses. This is a Solar-calibrated proxy that combines stellar mass, total giant-planet mass, outer-giant extent, inner-ejector depletion, age, and environmental retention.",
  "LPC Injection Rate":
    "Approximate long-period comet injection rate in new comets per year. The Solar anchor is ~2 to 3 new long-period comets per year, then scaled by inferred reservoir mass, local stellar density, and how compact the surviving inner cloud is.",
  Confidence:
    "Confidence in the inferred Oort reservoir. Mature systems with wide, substantial giant-planet architectures support a stronger inference than young or giant-poor systems.",
  "Seed from Oort":
    "Create a deterministic long-period comet template from the inferred Oort-cloud reservoir and attach it to the current host frame.",
  "Oort Cloud Mode":
    "Choose how Caelum resolves the Oort reservoir. Auto uses the baseline literature-inspired model. Guided applies controlled authoring adjustments on top. Manual directly overrides the reservoir fields shown on this page.",
  "Baseline vs Resolved":
    "Read-only comparison between the automatic Oort baseline and the final resolved reservoir after Guided or Manual adjustments.",
  "Formation Efficiency":
    "Guided multiplier for how efficiently scattered outer-system material ended up trapped in the Oort reservoir. Higher values increase the resolved reservoir mass.",
  "Retention / Erosion":
    "Guided multiplier for how much of the formed cloud survives stellar encounters, tides, and long-term stripping. Lower values reduce resolved mass and can slightly trim the outer edge.",
  "Inner Cloud Compactness":
    "Guided multiplier on the inner Oort edge. Lower values pack the cloud inward; higher values push the effective inner edge outward and reduce long-period injection.",
  "Late Instability History":
    "Guided history flag for how violent the system's late giant-planet evolution was. Quiet systems retain more mass and a tighter inner edge. Violent systems lose mass and push the inner cloud outward.",
  "Manual Present":
    "Manual override for whether the reservoir should be treated as present. Auto follows the resolved mass threshold. Present and Not inferred force the status directly.",
  "Manual Inner Boundary":
    "Manual override for the Oort cloud inner boundary in AU. Leave empty to use the automatic baseline.",
  "Manual Outer Boundary":
    "Manual override for the Oort cloud outer boundary in AU. Leave empty to use the automatic baseline.",
  "Manual Estimated Mass":
    "Manual override for the Oort cloud estimated mass in Earth masses. Leave empty to use the automatic baseline.",
  "Manual LPC Injection Rate":
    "Manual override for the long-period comet injection rate in new comets per year. Leave empty to use the automatic baseline.",
  "Oort Seeding":
    "Controls for the deterministic comet template created by Seed from Oort. These settings affect only newly seeded comets and do not retroactively change existing authored comets.",
  "Seed Profile":
    "Template family used when creating a new comet from the resolved Oort reservoir. Different profiles change the seeded semi-major axis, eccentricity, and default orbit class.",
  "Default Volatiles":
    "Override the volatile inventory assigned to newly seeded Oort comets. Auto follows the selected seed profile.",
  "Inclination Profile":
    "Override the inclination family for newly seeded Oort comets. Auto follows the selected seed profile.",
  "Nucleus Size Bias": "Choose the default nucleus size class for newly seeded Oort comets.",
  "Source reservoir":
    "Source label for this authored comet. Manual is fully user-defined, Debris Disk implies an inner-system scattered source, and Oort Cloud is reserved for long-period seeding and derived context.",
  "Semi-major axis":
    "Orbital semi-major axis in AU. Larger semi-major axes produce longer orbital periods and larger aphelia at fixed eccentricity.",
  Eccentricity:
    "Orbital eccentricity (0 to <1). Higher eccentricity drives stronger perihelion heating and much larger aphelion distance.",
  Inclination:
    "Orbital inclination in degrees. This also controls the tilt of the comet orbit in the Local Frame visualizer.",
  "Longitude of periapsis":
    "Periapsis orientation of the comet orbit within the local orbital plane.",
  Phase:
    "Current orbital phase as mean anomaly in degrees. This sets the comet's present position at sim time zero.",
  "Nucleus radius":
    "Radius of the solid comet nucleus in kilometers. Larger nuclei support larger active areas and larger visible comae and tails.",
  "Volatile class":
    "Dominant volatile inventory controlling how far from the star the comet can become active.",
  Density: "Bulk nucleus density in g/cm^3. Low values are typical for porous icy comet nuclei.",
  Albedo:
    "Reflectivity proxy for the comet nucleus. Darker nuclei absorb more sunlight and tend to support higher sublimation rates.",
  "Active surface fraction": "Fraction of the nucleus surface that is actively sublimating.",
  "Dust-to-gas ratio":
    "Relative dust production compared with gas outflow. Higher values bias the visible tail toward the dust component.",
  Orbit:
    "Current orbit summary derived from the authored elements: perihelion distance, aphelion distance, and orbital period.",
  Perihelion: "Closest distance between the comet and its host star during the orbit.",
  Aphelion: "Farthest distance between the comet and its host star during the orbit.",
  "Orbital Period": "Time required for the comet to complete one full orbit around its host star.",
  Activity: "Present activity state from the comet solver: Dormant, Weakly active, or Active.",
  "Current Radius": "Instantaneous star-comet distance at the authored orbital phase.",
  "Current Speed": "Instantaneous orbital speed from the vis-viva relation.",
  "Coma Radius": "Approximate coma radius from the current sublimation-driven gas production rate.",
  "Dust Tail":
    "Approximate dust-tail length. Dust tails are broader and more curved than ion tails.",
  "Ion Tail":
    "Approximate ion-tail length. Ion tails track the anti-solar direction more directly.",
  "Source Reservoir": "Display label for the comet's selected source reservoir.",
  Appearance:
    "Visualizer-facing appearance preview for the selected comet. Volatile class sets the core coma and tail palette, while the current activity state controls how vivid that plume appears.",
};

const DEFAULT_NEW_COMET = Object.freeze({
  name: "New comet",
  sourceReservoir: "manual",
  semiMajorAxisAu: 8,
  eccentricity: 0.65,
  inclinationDeg: 15,
  longitudeOfPeriapsisDeg: 0,
  meanAnomalyDeg: 0,
  nucleusRadiusKm: 4,
  densityGcm3: 0.6,
  albedo: 0.04,
  activeFraction: 0.08,
  dustToGasRatio: 1.2,
  volatileClass: "waterRich",
});

const COMET_SOURCE_LABELS = Object.freeze({
  manual: "Manual",
  debrisDisk: "Debris Disk",
  oortCloud: "Oort Cloud",
});

const COMET_VOLATILE_LABELS = Object.freeze({
  waterRich: "H2O-dominated",
  mixed: "Mixed H2O/CO2",
  co2Rich: "CO2-rich",
  coRich: "CO-rich",
});

const OORT_MODE_LABELS = Object.freeze({
  auto: "Auto",
  guided: "Guided",
  manual: "Manual",
});

const OORT_INSTABILITY_LABELS = Object.freeze({
  quiet: "Quiet",
  mild: "Mild",
  violent: "Violent",
});

const OORT_SEED_PROFILE_LABELS = Object.freeze({
  typicalLongPeriod: "Typical long-period",
  extremeLongPeriod: "Extreme long-period",
  sunSkimmer: "Sun-skimmer",
  isotropicSample: "Isotropic sample",
});

const OORT_SEED_VOLATILE_LABELS = Object.freeze({
  auto: "Auto from profile",
  waterRich: "Water-rich",
  mixed: "Mixed H2O/CO2",
  co2Rich: "CO2-rich",
  coRich: "CO-rich",
});

const OORT_SEED_INCLINATION_LABELS = Object.freeze({
  auto: "Auto from profile",
  isotropic: "Isotropic",
  mildlyPrograde: "Mildly prograde",
  retrogradeHeavy: "Retrograde-heavy",
});

const OORT_SEED_SIZE_LABELS = Object.freeze({
  small: "Small",
  medium: "Medium",
  large: "Large",
});

const TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "The Other Objects page models debris disks \u2014 asteroid belts, " +
      "Kuiper-belt analogs, authored comets, and other non-planetary material orbiting your star.",
  },
  {
    title: "Disk Geometry",
    body:
      "Set the inner and outer edges of each disk in AU. The centre and width " +
      "are derived automatically. Composition and temperature depend on " +
      "distance from the star.",
  },
  {
    title: "Suggest Feature",
    body:
      "Click Suggest to auto-generate debris disk positions based on " +
      "mean-motion resonances with your gas giants. This produces realistic " +
      "belt structures like the asteroid and Kuiper belts.",
  },
  {
    title: "Derived Properties",
    body:
      "Review collision velocities, ice-to-rock ratios, and infrared " +
      "detectability for debris, or switch to the Comets tab to inspect " +
      "named nuclei, orbital state, and present activity.",
  },
];

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

function formatHostFrameScopeLabel(hostFrame) {
  if (!hostFrame) return "Host frame";
  if (hostFrame.frameKind === "pair") return "P-type circumbinary";
  if (hostFrame.orbitFamilyKind === "single") return "Single-star";
  return "S-type circumstellar";
}

function formatHostFrameOptionLabel(hostFrame) {
  return `${hostFrame?.label || hostFrame?.id || "Host frame"} (${formatHostFrameScopeLabel(hostFrame)})`;
}

function buildHostFrameOptions(homeSystemContext, selectedHostFrameId = null) {
  const hostFrames = Object.values(homeSystemContext?.hostFramesById || {});
  const fallbackHostFrameId =
    homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || "star_a";
  const normalizedSelectedId = normalizeHostFrameId(selectedHostFrameId, fallbackHostFrameId);
  return hostFrames.map((hostFrame) => ({
    value: hostFrame.id,
    label: formatHostFrameOptionLabel(hostFrame),
    selected: hostFrame.id === normalizedSelectedId,
  }));
}

function cloneOortCloudConfig(config = DEFAULT_OORT_CLOUD_CONFIG) {
  return {
    mode: config?.mode || DEFAULT_OORT_CLOUD_CONFIG.mode,
    guided: {
      ...DEFAULT_OORT_CLOUD_CONFIG.guided,
      ...(config?.guided || {}),
    },
    manual: {
      ...DEFAULT_OORT_CLOUD_CONFIG.manual,
      ...(config?.manual || {}),
    },
    seeding: {
      ...DEFAULT_OORT_CLOUD_CONFIG.seeding,
      ...(config?.seeding || {}),
    },
  };
}

function buildSelectedHostReadout(solveContext) {
  if (!solveContext?.hostFrame || !solveContext?.starModel) {
    return "Host-frame context unavailable.";
  }
  const hostFrame = solveContext.hostFrame;
  const companionFluxEarth = Number(solveContext.companionFluxEarth || 0);
  const variability = Number(solveContext.fluxVariabilityFraction || 0);
  const hzInner = Number(hostFrame.zones?.habitableZoneAu?.inner);
  const hzOuter = Number(hostFrame.zones?.habitableZoneAu?.outer);
  const frostLineAu = Number(hostFrame.zones?.frostLineAu);
  const details = [
    `${hostFrame.label} (${formatHostFrameScopeLabel(hostFrame)})`,
    `Host light: ${fmt(Number(solveContext.starModel.luminosityLsol) || 0, 3)} Lsol`,
    Number.isFinite(hzInner) && Number.isFinite(hzOuter)
      ? `HZ ${fmt(hzInner, 3)} - ${fmt(hzOuter, 3)} AU`
      : "HZ unavailable",
    Number.isFinite(frostLineAu) ? `Frost line ${fmt(frostLineAu, 3)} AU` : null,
  ].filter(Boolean);
  if (hostFrame.frameKind === "pair") {
    details.push("Disk geometry is measured from the host pair barycenter.");
  } else if (companionFluxEarth > 0.0005) {
    details.push(`Companion adds about ${fmt(companionFluxEarth, 3)}x Earth flux on average.`);
  } else {
    details.push("Companion heating is negligible in this frame.");
  }
  if (variability > 0.001) {
    details.push(`Flux swing is about ${fmt(variability * 100, 1)}%.`);
  }
  return details.join(" | ");
}

function replaceDebrisDisksForHostFrame(world, nextHostDisks, hostFrameId, fallbackHostFrameId) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  const otherDisks = listSystemDebrisDisks(world, { fallbackHostFrameId }).filter(
    (disk) => normalizeHostFrameId(disk?.hostFrameId, fallbackHostFrameId) !== targetHostFrameId,
  );
  return [
    ...otherDisks,
    ...(nextHostDisks || []).map((disk) => ({
      ...disk,
      hostFrameId: targetHostFrameId,
    })),
  ];
}

function replaceCometsForHostFrame(world, nextHostComets, hostFrameId, fallbackHostFrameId) {
  const targetHostFrameId = normalizeHostFrameId(hostFrameId, fallbackHostFrameId);
  const otherComets = listSystemComets(world, { fallbackHostFrameId }).filter(
    (comet) => normalizeHostFrameId(comet?.hostFrameId, fallbackHostFrameId) !== targetHostFrameId,
  );
  return [
    ...otherComets,
    ...(nextHostComets || []).map((comet) => ({
      ...comet,
      hostFrameId: targetHostFrameId,
    })),
  ];
}

export function initOuterObjectsPage(mountEl) {
  const wrap = document.createElement("div");
  wrap.className = "page";
  wrap.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--outer-objects" aria-hidden="true"></span><span>Other Objects</span></h1>
        <button id="outerTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        ${buildPageIntroHtml({
          summary:
            "Configure debris disks, authored comets, and Oort-cloud context for the selected host frame.",
          controls:
            "Belts, comet orbits, and reservoir assumptions for the current star or pair rather than the whole system at once.",
          affects:
            "Visualizer context, host-specific belt architecture, and long-period comet expectations across the system.",
          primaryAction:
            "Choose the host frame first so the suggestions, temperatures, and stability checks use the right stellar context.",
        })}
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">
          <div class="form-row" id="outerHostFrameRow">
            <div>
              <div class="label">Host Frame ${tipIcon(TIP_LABEL["Host Frame"] || "")}</div>
              <div class="hint">Choose which star or pair this page is editing.</div>
            </div>
            <div class="input-pair">
              <select id="outerHostFrameSelect" aria-label="Host frame"></select>
              <div class="hint" id="outerHostFrameHint"></div>
            </div>
          </div>

          <div class="flow-spacer"></div>

          <div class="label">Selected Host ${tipIcon(TIP_LABEL["Selected Host"] || "")}</div>
          <div class="derived-readout" id="outerHostReadout"></div>

          <div class="flow-spacer"></div>

          <div class="pill-toggle-wrap outer-objects-tabs">
            <div class="physics-trio-toggle" data-toggle="outer-object-tab">
              <input type="radio" name="outerObjectTab" id="outerTabDebris" value="debris" checked />
              <label for="outerTabDebris">Debris Disks</label>
              <input type="radio" name="outerObjectTab" id="outerTabComets" value="comets" />
              <label for="outerTabComets">Comets</label>
              <input type="radio" name="outerObjectTab" id="outerTabOort" value="oort" />
              <label for="outerTabOort">Oort Cloud</label>
              <span></span>
            </div>
          </div>

          <div class="flow-spacer"></div>

          <div id="debrisDisksEditor"></div>
          <div id="cometsEditor" style="display:none"></div>
          <div id="oortEditor" style="display:none"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Outputs</h2></div>
        <div class="panel__body">
          <div id="outerSummary"></div>
        </div>
      </div>
    </div>
  `;
  mountEl.appendChild(wrap);
  attachTooltips(wrap);
  createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.outer.tutorial",
    container: wrap,
    triggerBtn: wrap.querySelector("#outerTutorials"),
  });

  const summaryEl = wrap.querySelector("#outerSummary");
  const debrisEditorEl = wrap.querySelector("#debrisDisksEditor");
  const cometsEditorEl = wrap.querySelector("#cometsEditor");
  const oortEditorEl = wrap.querySelector("#oortEditor");
  const hostFrameSelectEl = wrap.querySelector("#outerHostFrameSelect");
  const hostFrameHintEl = wrap.querySelector("#outerHostFrameHint");
  const hostReadoutEl = wrap.querySelector("#outerHostReadout");
  const debrisTabEl = wrap.querySelector("#outerTabDebris");
  const cometsTabEl = wrap.querySelector("#outerTabComets");
  const oortTabEl = wrap.querySelector("#outerTabOort");
  const state = {
    activeHostFrameId: normalizeHostFrameId(
      loadWorld()?.stellarSystem?.defaultHostFrameId,
      "star_a",
    ),
    activeTab: "debris",
  };

  let isRendering = false;
  let renderQueued = false;

  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    setTimeout(() => {
      renderQueued = false;
      render();
    }, 0);
  }

  function getGasGiants(world, { hostFrameId = null, fallbackHostFrameId = null } = {}) {
    return filterBodiesForHostFrame(
      listDebrisDiskPerturbers(world),
      hostFrameId,
      fallbackHostFrameId,
    ).sort((a, b) => Number(a.au) - Number(b.au));
  }

  function getDebrisDisks(world, { hostFrameId = null, fallbackHostFrameId = null } = {}) {
    return listSystemDebrisDisks(world, {
      hostFrameId,
      fallbackHostFrameId,
    });
  }

  function getComets(world, { hostFrameId = null, fallbackHostFrameId = null } = {}) {
    return listSystemComets(world, {
      hostFrameId,
      fallbackHostFrameId,
    });
  }

  function getSystemStarMassMsol(world, homeSystemContext) {
    const starMasses = Object.values(homeSystemContext?.starsById || {})
      .map((starContext) => Number(starContext?.config?.massMsol))
      .filter(Number.isFinite);
    if (starMasses.length) {
      return starMasses.reduce((sum, mass) => sum + Math.max(0, mass), 0);
    }
    return Number(homeSystemContext?.primaryStarConfig?.massMsol ?? world?.star?.massMsol) || 1;
  }

  function getSystemStarAgeGyr(world, homeSystemContext) {
    const sharedAgeGyr = Number(world?.stellarSystem?.shared?.ageGyr);
    if (Number.isFinite(sharedAgeGyr)) return sharedAgeGyr;
    const starAges = Object.values(homeSystemContext?.starsById || {})
      .map((starContext) => Number(starContext?.config?.ageGyr))
      .filter(Number.isFinite);
    if (starAges.length) {
      return starAges.reduce((sum, age) => sum + Math.max(0, age), 0) / starAges.length;
    }
    return Number(homeSystemContext?.primaryStarConfig?.ageGyr ?? world?.star?.ageGyr) || 4.6;
  }

  function calcSystemOortCloud(world, homeSystemContext) {
    const autoModel = calcOortCloud({
      starMassMsol: getSystemStarMassMsol(world, homeSystemContext),
      starAgeGyr: getSystemStarAgeGyr(world, homeSystemContext),
      locationLy: Number(world?.cluster?.locationLy),
      stellarDensityPerLy3: Number(world?.cluster?.stellarDensityPerLy3),
      gasGiants: listDebrisDiskPerturbers(world).map((gasGiant) => ({
        au: gasGiant?.au,
        massMjup: gasGiant?.massMjup,
      })),
    });
    return resolveOortCloudModel({
      autoModel,
      config: getSystemOortCloudConfig(world),
    });
  }

  function updateOortCloudConfig(mutator) {
    const nextConfig = cloneOortCloudConfig(getSystemOortCloudConfig(loadWorld()));
    mutator?.(nextConfig);
    saveSystemOortCloudConfig(nextConfig);
    scheduleRender();
  }

  function parseOptionalNumber(value) {
    return String(value ?? "").trim() === "" ? undefined : Number(value);
  }

  function setSelectedCometId(cometId) {
    const world = loadWorld();
    if (!world.system?.comets) return world;
    world.system.comets.selectedId = cometId || null;
    saveWorld(world);
    return loadWorld();
  }

  function ensureVisibleCometSelection(world, { hostFrameId, fallbackHostFrameId }) {
    const visibleComets = getComets(world, {
      hostFrameId,
      fallbackHostFrameId,
    });
    const selectedComet = getSelectedComet(world);
    if (selectedComet && visibleComets.some((comet) => comet.id === selectedComet.id)) {
      return world;
    }
    const nextSelectedId = visibleComets[0]?.id || null;
    if ((world.system?.comets?.selectedId ?? null) === nextSelectedId) return world;
    return setSelectedCometId(nextSelectedId);
  }

  /* ── Debris Disks Editor ────────────────────────────────────────── */

  // Per-disk input mode state: "edges" (inner/outer) or "center" (center/width).
  // Persisted across re-renders but not saved to the world model.
  const ddInputModes = new Map();

  function tipIconNode(text) {
    if (!text) return null;
    return createElement("span", {
      className: "tip-icon",
      attrs: { tabindex: "0", role: "note", "aria-label": "Info" },
      dataset: { tip: text },
      text: "i",
    });
  }

  function labelWithTipNode(text, tipText, { unit = null, className = "label" } = {}) {
    return createElement("div", { className }, [
      text,
      unit ? " " : "",
      unit ? createElement("span", { className: "unit", text: unit }) : null,
      tipText ? " " : "",
      tipIconNode(tipText),
    ]);
  }

  function rangeMetaNode(minLabel, maxLabel) {
    return createElement("div", { className: "range-meta" }, [
      createElement("span", { text: minLabel }),
      createElement("span", { text: maxLabel }),
    ]);
  }

  function numberSliderPairNode({
    inputClass,
    sliderClass,
    value,
    step,
    min,
    max,
    placeholder = null,
    rangeMinLabel,
    rangeMaxLabel,
    orbitRangeName = "",
    orbitRangeStatusSubject = "orbit",
  }) {
    const normalizedValue = value == null ? "" : String(value);
    const isOrbitRange = !!orbitRangeName;
    return createElement(
      "div",
      {
        className: `input-pair${isOrbitRange ? " orbit-range-control" : ""}`,
        dataset: isOrbitRange ? { orbitRangeSubject: orbitRangeStatusSubject } : {},
      },
      [
        createElement("input", {
          className: inputClass,
          attrs: {
            type: "number",
            step,
            min,
            max,
            placeholder,
            value: normalizedValue,
          },
        }),
        isOrbitRange
          ? createOrbitRangeModeToggleNode({
              name: orbitRangeName,
              selectedModeId: orbitRangeModeForValue(value).id,
            })
          : null,
        createElement("input", {
          className: sliderClass,
          attrs: { type: "range", value: normalizedValue },
        }),
        rangeMetaNode(rangeMinLabel, rangeMaxLabel),
        isOrbitRange
          ? createElement("div", {
              className: "hint orbit-range-status",
              dataset: { orbitRangeSubject: orbitRangeStatusSubject },
            })
          : null,
      ],
    );
  }

  function setInputValue(node, value) {
    if (!node) return node;
    node.value = value == null ? "" : String(value);
    return node;
  }

  function debrisRowNode(disk, index) {
    const inner = Number(disk.innerAu || 0);
    const outer = Number(disk.outerAu || 0);
    const center = Math.round(((inner + outer) / 2) * 100) / 100;
    const width = Math.round((outer - inner) * 100) / 100;
    const mode = ddInputModes.get(disk.id) || "edges";
    const row = createElement("div", {
      className: "dd-row",
      dataset: { ddId: disk.id },
    });

    const head = createElement("div", { className: "dd-row__head" }, [
      labelWithTipNode("Name", TIP_LABEL["Disk name"]),
      createElement("input", { className: "dd-name", attrs: { type: "text" } }),
      createElement("button", {
        className: "small danger dd-remove",
        attrs: { type: "button" },
        text: "Remove",
      }),
    ]);
    setInputValue(head.querySelector(".dd-name"), disk.name || `Debris disk ${index + 1}`);
    row.appendChild(head);

    row.appendChild(
      createElement(
        "div",
        {
          className: "physics-duo-toggle dd-mode-toggle dd-mode-toggle--stacked",
          attrs: { "data-toggle": "dd-mode" },
        },
        [
          createElement("input", {
            attrs: {
              type: "radio",
              name: `ddMode_${disk.id}`,
              id: `ddModeEdges_${disk.id}`,
              value: "edges",
            },
            checked: mode === "edges",
          }),
          createElement("label", {
            attrs: { for: `ddModeEdges_${disk.id}` },
            text: "Inner / Outer",
          }),
          createElement("input", {
            attrs: {
              type: "radio",
              name: `ddMode_${disk.id}`,
              id: `ddModeCenter_${disk.id}`,
              value: "center",
            },
            checked: mode === "center",
          }),
          createElement("label", {
            attrs: { for: `ddModeCenter_${disk.id}` },
            text: "Center / Width",
          }),
          createElement("span"),
        ],
      ),
    );

    const edgesGroup = createElement("div", {
      className: "dd-edges-group",
      attrs: { style: mode === "center" ? "display:none" : "" },
    });
    const innerRow = createElement("div", { className: "form-row flow-stack-gap--sm" }, [
      createElement("div", {}, [
        labelWithTipNode("Inner edge", TIP_LABEL["Inner edge"], { unit: "AU" }),
      ]),
      numberSliderPairNode({
        inputClass: "dd-inner",
        sliderClass: "dd-inner-slider",
        value: inner,
        step: "0.01",
        min: String(ORBIT_AU_MIN),
        max: String(ORBIT_AU_MAX),
        rangeMinLabel: String(ORBIT_AU_MIN),
        rangeMaxLabel: String(ORBIT_AU_MAX),
        orbitRangeName: `dd_${disk.id}_innerRange`,
        orbitRangeStatusSubject: "edge",
      }),
    ]);
    setInputValue(innerRow.querySelector(".dd-inner"), inner);
    edgesGroup.appendChild(innerRow);

    const outerRow = createElement("div", { className: "form-row flow-stack-gap--sm" }, [
      createElement("div", {}, [
        labelWithTipNode("Outer edge", TIP_LABEL["Outer edge"], { unit: "AU" }),
      ]),
      numberSliderPairNode({
        inputClass: "dd-outer",
        sliderClass: "dd-outer-slider",
        value: outer,
        step: "0.01",
        min: String(ORBIT_AU_MIN),
        max: String(ORBIT_AU_MAX),
        rangeMinLabel: String(ORBIT_AU_MIN),
        rangeMaxLabel: String(ORBIT_AU_MAX),
        orbitRangeName: `dd_${disk.id}_outerRange`,
        orbitRangeStatusSubject: "edge",
      }),
    ]);
    setInputValue(outerRow.querySelector(".dd-outer"), outer);
    edgesGroup.appendChild(outerRow);
    row.appendChild(edgesGroup);

    const centerGroup = createElement("div", {
      className: "dd-center-group",
      attrs: { style: mode === "edges" ? "display:none" : "" },
    });
    const centerRow = createElement("div", { className: "form-row flow-stack-gap--sm" }, [
      createElement("div", {}, [
        labelWithTipNode("Center", TIP_LABEL["Disk center"], { unit: "AU" }),
      ]),
      numberSliderPairNode({
        inputClass: "dd-center",
        sliderClass: "dd-center-slider",
        value: center,
        step: "0.01",
        min: String(ORBIT_AU_MIN),
        max: String(ORBIT_AU_MAX),
        rangeMinLabel: String(ORBIT_AU_MIN),
        rangeMaxLabel: String(ORBIT_AU_MAX),
        orbitRangeName: `dd_${disk.id}_centerRange`,
        orbitRangeStatusSubject: "center",
      }),
    ]);
    setInputValue(centerRow.querySelector(".dd-center"), center);
    centerGroup.appendChild(centerRow);

    const widthRow = createElement("div", { className: "form-row flow-stack-gap--sm" }, [
      createElement("div", {}, [
        labelWithTipNode("Width", TIP_LABEL["Disk width"], { unit: "AU" }),
      ]),
      numberSliderPairNode({
        inputClass: "dd-width",
        sliderClass: "dd-width-slider",
        value: width,
        step: "0.01",
        min: String(ORBIT_AU_MIN),
        max: String(ORBIT_AU_MAX),
        rangeMinLabel: String(ORBIT_AU_MIN),
        rangeMaxLabel: String(ORBIT_AU_MAX),
        orbitRangeName: `dd_${disk.id}_widthRange`,
        orbitRangeStatusSubject: "width",
      }),
    ]);
    setInputValue(widthRow.querySelector(".dd-width"), width);
    centerGroup.appendChild(widthRow);
    row.appendChild(centerGroup);

    const eccentricityRow = createElement("div", { className: "form-row flow-stack-gap--sm" }, [
      createElement("div", {}, [labelWithTipNode("Eccentricity", TIP_LABEL["Disk Eccentricity"])]),
      numberSliderPairNode({
        inputClass: "dd-ecc",
        sliderClass: "dd-ecc-slider",
        value: disk.eccentricity != null ? disk.eccentricity : "",
        step: "0.01",
        min: "0",
        max: "0.5",
        placeholder: "0.05",
        rangeMinLabel: "0",
        rangeMaxLabel: "0.5",
      }),
    ]);
    setInputValue(
      eccentricityRow.querySelector(".dd-ecc"),
      disk.eccentricity != null ? disk.eccentricity : "",
    );
    row.appendChild(eccentricityRow);

    const inclinationRow = createElement("div", { className: "form-row flow-stack-gap--sm" }, [
      createElement("div", {}, [
        labelWithTipNode("Inclination", TIP_LABEL["Disk Inclination"], { unit: "\u00b0" }),
      ]),
      numberSliderPairNode({
        inputClass: "dd-inc",
        sliderClass: "dd-inc-slider",
        value: disk.inclination != null ? disk.inclination : "",
        step: "1",
        min: "0",
        max: "90",
        placeholder: "0",
        rangeMinLabel: "0",
        rangeMaxLabel: "90",
      }),
    ]);
    setInputValue(
      inclinationRow.querySelector(".dd-inc"),
      disk.inclination != null ? disk.inclination : "",
    );
    row.appendChild(inclinationRow);

    const massRow = createElement("div", { className: "form-row flow-stack-gap--sm" }, [
      createElement("div", {}, [
        labelWithTipNode("Total mass", TIP_LABEL["Disk Mass Override"], { unit: "M\u2295" }),
      ]),
      createElement("div", { className: "input-pair" }, [
        createElement("input", {
          className: "dd-mass",
          attrs: {
            type: "number",
            step: "0.001",
            min: "0",
            placeholder: "Auto",
          },
        }),
        createElement("button", {
          className: "small dd-mass-clear",
          attrs: { type: "button" },
          text: "Auto",
        }),
      ]),
    ]);
    setInputValue(
      massRow.querySelector(".dd-mass"),
      disk.totalMassMearth != null ? disk.totalMassMearth : "",
    );
    row.appendChild(massRow);

    return row;
  }

  function createOuterKpiCard(label, value, meta, tipText) {
    return createElement("div", { className: "kpi-wrap" }, [
      createElement("div", { className: "kpi" }, [
        createElement("div", { className: "kpi__label" }, [
          label,
          tipText ? " " : "",
          tipIconNode(tipText),
        ]),
        createElement("div", { className: "kpi__value", text: value }),
        createElement("div", { className: "kpi__meta", text: meta || "" }),
      ]),
    ]);
  }

  function createOuterPreviewKpiCard(label, meta, tipText, canvasClass = "comet-preview-canvas") {
    return createElement("div", { className: "kpi-wrap kpi-wrap--expandable" }, [
      createElement("div", { className: "kpi kpi--preview" }, [
        createElement("div", { className: "kpi__label" }, [
          label,
          tipText ? " " : "",
          tipIconNode(tipText),
        ]),
        createElement("button", {
          className: "kpi__toggle",
          attrs: {
            type: "button",
            "aria-expanded": "false",
            "aria-label": `Show details for ${label}`,
            title: `Show details for ${label}`,
          },
          text: "\u25be",
        }),
        createElement("canvas", {
          className: canvasClass,
          attrs: { width: 180, height: 180, "aria-label": `${label} preview` },
        }),
        createElement("div", { className: "kpi__meta", text: meta || "" }),
      ]),
    ]);
  }

  function createOortModeToggle(mode) {
    const normalizedMode =
      mode === "guided" || mode === "manual" ? mode : DEFAULT_OORT_CLOUD_CONFIG.mode;
    return createElement("div", { className: "physics-trio-toggle oort-mode-toggle" }, [
      ...["auto", "guided", "manual"].flatMap((value) => {
        const id = `oortMode${value[0].toUpperCase()}${value.slice(1)}`;
        return [
          createElement("input", {
            attrs: {
              type: "radio",
              id,
              name: "oortCloudMode",
              value,
              ...(normalizedMode === value ? { checked: "checked" } : {}),
            },
          }),
          createElement("label", {
            attrs: { for: id },
            text: OORT_MODE_LABELS[value] || value,
          }),
        ];
      }),
      createElement("span"),
    ]);
  }

  function createOortCompareCard({ field, label, baseline, resolved }) {
    return createElement(
      "div",
      { className: "oort-compare-card", dataset: { oortCompare: field } },
      [
        createElement("div", { className: "oort-compare-card__label", text: label }),
        createElement("div", { className: "oort-compare-card__values" }, [
          createElement("span", { className: "oort-compare-card__baseline", text: baseline }),
          createElement("span", { className: "oort-compare-card__arrow", text: "->" }),
          createElement("span", { className: "oort-compare-card__resolved", text: resolved }),
        ]),
      ],
    );
  }

  function createOortGuidedSliderField({
    label,
    tipText,
    unit = null,
    numberClass,
    sliderClass,
    value,
    step,
    min,
    max,
    rangeMinLabel,
    rangeMaxLabel,
  }) {
    return createElement("div", { className: "form-row oort-field" }, [
      createElement("div", {}, [labelWithTipNode(label, tipText, { unit })]),
      numberSliderPairNode({
        inputClass: numberClass,
        sliderClass,
        value,
        step,
        min,
        max,
        rangeMinLabel,
        rangeMaxLabel,
      }),
    ]);
  }

  function createOortManualNumberField({
    label,
    tipText,
    unit = null,
    className,
    value = "",
    placeholder = "Auto",
    step = "0.1",
    min = null,
    max = null,
  }) {
    return createElement("div", { className: "form-row oort-field" }, [
      createElement("div", {}, [labelWithTipNode(label, tipText, { unit })]),
      createElement("div", { className: "input-pair" }, [
        createElement("input", {
          className,
          attrs: {
            type: "number",
            step,
            ...(min != null ? { min } : {}),
            ...(max != null ? { max } : {}),
            placeholder,
            value: value == null ? "" : String(value),
          },
        }),
      ]),
    ]);
  }

  function createOortManualPresentField(value) {
    const selectEl = createElement("select", { className: "oort-manual-present" }, [
      createElement("option", { attrs: { value: "" }, text: "Auto" }),
      createElement("option", { attrs: { value: "present" }, text: "Present" }),
      createElement("option", { attrs: { value: "absent" }, text: "Not inferred" }),
    ]);
    selectEl.value = value === true ? "present" : value === false ? "absent" : "";
    return createElement("div", { className: "form-row oort-field" }, [
      createElement("div", {}, [labelWithTipNode("Present", TIP_LABEL["Manual Present"])]),
      createElement("div", { className: "input-pair" }, [selectEl]),
    ]);
  }

  function createOortSummarySection(oortCloud, { marginBottom = 0 } = {}) {
    const resolved = oortCloud?.resolved || oortCloud || {};
    return createElement(
      "div",
      {
        attrs: {
          id: "outerOortSummary",
          ...(marginBottom > 0 ? { style: `margin-bottom:${marginBottom}px` } : {}),
        },
      },
      [
        createElement("div", { className: "kpi-grid" }, [
          createOuterKpiCard(
            "Oort Cloud",
            resolved.present ? "Present" : "Not inferred",
            "",
            TIP_LABEL["Oort Cloud"],
          ),
          createOuterKpiCard(
            "Reservoir Class",
            resolved.formationClass,
            "",
            TIP_LABEL["Reservoir Class"],
          ),
          createOuterKpiCard(
            "Inner Boundary",
            `${fmt(resolved.innerBoundaryAu, 0)} AU`,
            "",
            TIP_LABEL["Inner Boundary"],
          ),
          createOuterKpiCard(
            "Outer Boundary",
            `${fmt(resolved.outerBoundaryAu, 0)} AU`,
            "",
            TIP_LABEL["Outer Boundary"],
          ),
          createOuterKpiCard(
            "Estimated Mass",
            `${fmt(resolved.estimatedMassMearth, 1)} M\u2295`,
            "",
            TIP_LABEL["Oort Estimated Mass"],
          ),
          createOuterKpiCard(
            "LPC Injection Rate",
            `${fmt(resolved.injectionRatePerYear, 1)}/yr`,
            "",
            TIP_LABEL["LPC Injection Rate"],
          ),
          createOuterKpiCard("Confidence", resolved.confidence, "", TIP_LABEL.Confidence),
        ]),
        !resolved.present
          ? createElement("div", {
              className: "derived-readout",
              attrs: { style: "margin-top:14px" },
              text: "No robust Oort cloud reservoir is inferred for this system yet. Switch to Guided or Manual mode on the left to author a different reservoir state.",
            })
          : null,
      ],
    );
  }

  function renderOortSummaryCard(oortCloud, oortConfig) {
    if (!oortEditorEl) return;
    const baseline = oortCloud?.baseline || oortCloud || {};
    const resolved = oortCloud?.resolved || oortCloud || {};
    const mode = oortCloud?.mode || oortConfig?.mode || DEFAULT_OORT_CLOUD_CONFIG.mode;
    const config = cloneOortCloudConfig(oortConfig);
    const modeHint =
      mode === "guided"
        ? "Guided mode keeps the automatic Oort model visible, then applies authoring adjustments on top of it."
        : mode === "manual"
          ? "Manual mode directly overrides the reservoir shown here. The automatic baseline stays visible in the comparison strip."
          : "Auto mode shows the literature-inspired baseline Oort estimate with no authoring adjustments.";
    oortCloud = resolved;
    replaceChildren(summaryEl, [
      createElement("div", { attrs: { id: "outerOortSummary" } }, [
        createElement("div", { className: "kpi-grid" }, [
          createOuterKpiCard(
            "Oort Cloud",
            resolved.present ? "Present" : "Not inferred",
            "",
            TIP_LABEL["Oort Cloud"],
          ),
          createOuterKpiCard(
            "Reservoir Class",
            resolved.formationClass,
            "",
            TIP_LABEL["Reservoir Class"],
          ),
          createOuterKpiCard(
            "Inner Boundary",
            `${fmt(resolved.innerBoundaryAu, 0)} AU`,
            "",
            TIP_LABEL["Inner Boundary"],
          ),
          createOuterKpiCard(
            "Outer Boundary",
            `${fmt(resolved.outerBoundaryAu, 0)} AU`,
            "",
            TIP_LABEL["Outer Boundary"],
          ),
          createOuterKpiCard(
            "Estimated Mass",
            `${fmt(oortCloud.estimatedMassMearth, 1)} M\u2295`,
            "",
            TIP_LABEL["Oort Estimated Mass"],
          ),
          createOuterKpiCard(
            "LPC Injection Rate",
            `${fmt(oortCloud.injectionRatePerYear, 1)}/yr`,
            "",
            TIP_LABEL["LPC Injection Rate"],
          ),
          createOuterKpiCard("Confidence", oortCloud.confidence, "", TIP_LABEL.Confidence),
        ]),
        !oortCloud.present
          ? createElement("div", {
              className: "derived-readout",
              attrs: { style: "margin-top:14px" },
              text: "No robust Oort cloud reservoir is inferred for this system yet. Switch to Guided or Manual mode on the left to author a different reservoir state.",
            })
          : null,
      ]),
    ]);
    replaceChildren(oortEditorEl, [
      createElement("div", { className: "subsection" }, [
        createElement("div", { className: "subsection__title" }, [
          "Oort Cloud",
          " ",
          tipIconNode(TIP_LABEL["Oort Cloud"]),
        ]),
        createElement("div", {
          className: "hint",
          text: "System-wide long-period comet reservoir inferred from the whole giant-planet architecture and the local galactic environment.",
        }),
        createElement("div", { className: "kpi-grid", attrs: { style: "display:none" } }, [
          createOuterKpiCard(
            "Oort Cloud",
            resolved.present ? "Present" : "Not inferred",
            "",
            TIP_LABEL["Oort Cloud"],
          ),
          createOuterKpiCard(
            "Reservoir Class",
            resolved.formationClass,
            "",
            TIP_LABEL["Reservoir Class"],
          ),
          createOuterKpiCard(
            "Inner Boundary",
            `${fmt(resolved.innerBoundaryAu, 0)} AU`,
            "",
            TIP_LABEL["Inner Boundary"],
          ),
          createOuterKpiCard(
            "Outer Boundary",
            `${fmt(resolved.outerBoundaryAu, 0)} AU`,
            "",
            TIP_LABEL["Outer Boundary"],
          ),
          createOuterKpiCard(
            "Estimated Mass",
            `${fmt(oortCloud.estimatedMassMearth, 1)} M\u2295`,
            "",
            TIP_LABEL["Oort Estimated Mass"],
          ),
          createOuterKpiCard(
            "LPC Injection Rate",
            `${fmt(oortCloud.injectionRatePerYear, 1)}/yr`,
            "",
            TIP_LABEL["LPC Injection Rate"],
          ),
          createOuterKpiCard("Confidence", oortCloud.confidence, "", TIP_LABEL.Confidence),
        ]),
        createElement("div", { className: "oort-controls" }, [
          createElement("div", { className: "form-row oort-mode-row" }, [
            createElement("div", {}, [
              labelWithTipNode("Oort Cloud Mode", TIP_LABEL["Oort Cloud Mode"]),
            ]),
            createElement("div", { className: "pill-toggle-wrap" }, [createOortModeToggle(mode)]),
          ]),
          createElement("div", {
            className: "hint flow-stack-gap--sm",
            text: modeHint,
          }),
          createElement("div", { className: "oort-compare-grid" }, [
            createOortCompareCard({
              field: "mass",
              label: "Mass",
              baseline: `${fmt(baseline.estimatedMassMearth, 1)} M\u2295`,
              resolved: `${fmt(resolved.estimatedMassMearth, 1)} M\u2295`,
            }),
            createOortCompareCard({
              field: "innerEdge",
              label: "Inner Edge",
              baseline: `${fmt(baseline.innerBoundaryAu, 0)} AU`,
              resolved: `${fmt(resolved.innerBoundaryAu, 0)} AU`,
            }),
            createOortCompareCard({
              field: "lpcRate",
              label: "LPC Rate",
              baseline: `${fmt(baseline.injectionRatePerYear, 1)}/yr`,
              resolved: `${fmt(resolved.injectionRatePerYear, 1)}/yr`,
            }),
          ]),
          mode === "guided"
            ? createElement("div", { className: "oort-panel", attrs: { id: "oortGuidedPanel" } }, [
                createElement("div", { className: "oort-panel__title-row" }, [
                  createElement("span", {
                    className: "oort-panel__title",
                    text: "Adjust Reservoir",
                  }),
                ]),
                createElement("div", { className: "oort-panel__body" }, [
                  createElement("div", { className: "oort-control-grid" }, [
                    createOortGuidedSliderField({
                      label: "Formation Efficiency",
                      tipText: TIP_LABEL["Formation Efficiency"],
                      unit: "×",
                      numberClass: "oort-guided-formation",
                      sliderClass: "oort-guided-formation-slider",
                      value: config.guided.formationEfficiency,
                      step: "0.01",
                      min: "0.25",
                      max: "2.5",
                      rangeMinLabel: "0.25×",
                      rangeMaxLabel: "2.50×",
                    }),
                    createOortGuidedSliderField({
                      label: "Retention / Erosion",
                      tipText: TIP_LABEL["Retention / Erosion"],
                      unit: "×",
                      numberClass: "oort-guided-retention",
                      sliderClass: "oort-guided-retention-slider",
                      value: config.guided.retention,
                      step: "0.01",
                      min: "0.25",
                      max: "2",
                      rangeMinLabel: "0.25×",
                      rangeMaxLabel: "2.00×",
                    }),
                    createOortGuidedSliderField({
                      label: "Inner Cloud Compactness",
                      tipText: TIP_LABEL["Inner Cloud Compactness"],
                      unit: "×",
                      numberClass: "oort-guided-inner",
                      sliderClass: "oort-guided-inner-slider",
                      value: config.guided.innerCompactness,
                      step: "0.01",
                      min: "0.6",
                      max: "1.8",
                      rangeMinLabel: "0.60×",
                      rangeMaxLabel: "1.80×",
                    }),
                    createElement("div", { className: "form-row oort-field oort-field--full" }, [
                      createElement("div", {}, [
                        labelWithTipNode(
                          "Late Instability History",
                          TIP_LABEL["Late Instability History"],
                        ),
                      ]),
                      createElement("div", { className: "pill-toggle-wrap" }, [
                        createElement(
                          "div",
                          { className: "physics-trio-toggle oort-instability-toggle" },
                          [
                            ...["quiet", "mild", "violent"].flatMap((value) => {
                              const id = `oortInstability${value[0].toUpperCase()}${value.slice(1)}`;
                              return [
                                createElement("input", {
                                  attrs: {
                                    type: "radio",
                                    id,
                                    name: "oortInstabilityHistory",
                                    value,
                                    ...(config.guided.instabilityHistory === value
                                      ? { checked: "checked" }
                                      : {}),
                                  },
                                }),
                                createElement("label", {
                                  attrs: { for: id },
                                  text: OORT_INSTABILITY_LABELS[value] || value,
                                }),
                              ];
                            }),
                            createElement("span"),
                          ],
                        ),
                      ]),
                    ]),
                  ]),
                ]),
              ])
            : null,
          mode === "manual"
            ? createElement("div", { className: "oort-panel", attrs: { id: "oortManualPanel" } }, [
                createElement("div", { className: "oort-panel__title-row" }, [
                  createElement("span", {
                    className: "oort-panel__title",
                    text: "Manual Overrides",
                  }),
                ]),
                createElement("div", { className: "oort-panel__body" }, [
                  createElement("div", { className: "oort-control-grid" }, [
                    createOortManualPresentField(config.manual.present),
                    createOortManualNumberField({
                      label: "Inner Boundary",
                      tipText: TIP_LABEL["Manual Inner Boundary"],
                      unit: "AU",
                      className: "oort-manual-inner",
                      value: config.manual.innerBoundaryAu,
                      step: "1",
                      min: "1000",
                      max: "300000",
                    }),
                    createOortManualNumberField({
                      label: "Outer Boundary",
                      tipText: TIP_LABEL["Manual Outer Boundary"],
                      unit: "AU",
                      className: "oort-manual-outer",
                      value: config.manual.outerBoundaryAu,
                      step: "1",
                      min: "2500",
                      max: "500000",
                    }),
                    createOortManualNumberField({
                      label: "Estimated Mass",
                      tipText: TIP_LABEL["Manual Estimated Mass"],
                      unit: "M\u2295",
                      className: "oort-manual-mass",
                      value: config.manual.estimatedMassMearth,
                      step: "0.1",
                      min: "0",
                      max: "200",
                    }),
                    createOortManualNumberField({
                      label: "LPC Injection Rate",
                      tipText: TIP_LABEL["Manual LPC Injection Rate"],
                      className: "oort-manual-rate",
                      value: config.manual.injectionRatePerYear,
                      step: "0.1",
                      min: "0",
                      max: "100",
                    }),
                  ]),
                ]),
              ])
            : null,
        ]),
        !oortCloud.present
          ? createElement("div", {
              className: "hint",
              attrs: { style: "margin-top:10px" },
              text: "No robust Oort cloud reservoir is inferred for this system yet.",
            })
          : null,
      ]),
    ]);

    const massKpi = [...oortEditorEl.querySelectorAll(".kpi-wrap")].find((card) =>
      /Estimated Mass/i.test(card.querySelector(".kpi__label")?.textContent || ""),
    );
    const massValueEl = massKpi?.querySelector(".kpi__value");
    if (massValueEl) {
      massValueEl.textContent = `${fmt(resolved.estimatedMassMearth, 1)} M\u2295`;
    }

    for (const input of oortEditorEl.querySelectorAll('input[name="oortCloudMode"]')) {
      input.addEventListener("change", () => {
        if (!input.checked) return;
        updateOortCloudConfig((next) => {
          next.mode = input.value;
        });
      });
    }

    if (mode === "guided") {
      const bindGuidedField = ({ numberSelector, sliderSelector, key, min, max, step }) => {
        const numberEl = oortEditorEl.querySelector(numberSelector);
        const sliderEl = oortEditorEl.querySelector(sliderSelector);
        bindNumberAndSlider({
          numberEl,
          sliderEl,
          min,
          max,
          step,
          mode: "linear",
          commitOnInput: false,
          onChange: (value) => {
            updateOortCloudConfig((next) => {
              next.mode = "guided";
              next.guided[key] = value;
            });
          },
        });
      };

      bindGuidedField({
        numberSelector: ".oort-guided-formation",
        sliderSelector: ".oort-guided-formation-slider",
        key: "formationEfficiency",
        min: 0.25,
        max: 2.5,
        step: 0.01,
      });
      bindGuidedField({
        numberSelector: ".oort-guided-retention",
        sliderSelector: ".oort-guided-retention-slider",
        key: "retention",
        min: 0.25,
        max: 2,
        step: 0.01,
      });
      bindGuidedField({
        numberSelector: ".oort-guided-inner",
        sliderSelector: ".oort-guided-inner-slider",
        key: "innerCompactness",
        min: 0.6,
        max: 1.8,
        step: 0.01,
      });

      for (const input of oortEditorEl.querySelectorAll('input[name="oortInstabilityHistory"]')) {
        input.addEventListener("change", () => {
          if (!input.checked) return;
          updateOortCloudConfig((next) => {
            next.mode = "guided";
            next.guided.instabilityHistory = input.value;
          });
        });
      }
    }

    if (mode === "manual") {
      const presentEl = oortEditorEl.querySelector(".oort-manual-present");
      presentEl?.addEventListener("change", () => {
        updateOortCloudConfig((next) => {
          next.mode = "manual";
          next.manual.present =
            presentEl.value === "present" ? true : presentEl.value === "absent" ? false : null;
        });
      });

      const bindManualNumber = (selector, key) => {
        const input = oortEditorEl.querySelector(selector);
        input?.addEventListener("change", () => {
          updateOortCloudConfig((next) => {
            next.mode = "manual";
            const raw = String(input.value ?? "").trim();
            next.manual[key] = raw === "" ? null : Number(raw);
          });
        });
      };

      bindManualNumber(".oort-manual-inner", "innerBoundaryAu");
      bindManualNumber(".oort-manual-outer", "outerBoundaryAu");
      bindManualNumber(".oort-manual-mass", "estimatedMassMearth");
      bindManualNumber(".oort-manual-rate", "injectionRatePerYear");
    }
  }

  function formatCometOrbitPeriod(periodYears) {
    const years = Number(periodYears);
    if (!Number.isFinite(years)) return "n/a";
    return `${fmt(years, 1)} ${Math.abs(years - 1) < 1e-9 ? "year" : "years"}`;
  }

  function cometFieldNode({
    label,
    tipText,
    unit = null,
    className,
    sliderClassName = "",
    type = "number",
    step = null,
    min = null,
    max = null,
    value = "",
    orbitRangeName = "",
    orbitRangeStatusSubject = "orbit",
  }) {
    const isOrbitRange = !!orbitRangeName;
    return createElement("div", { className: "form-row comet-field" }, [
      createElement("div", {}, [labelWithTipNode(label, tipText, { unit })]),
      createElement(
        "div",
        {
          className: `input-pair${isOrbitRange ? " orbit-range-control" : ""}`,
          dataset: isOrbitRange ? { orbitRangeSubject: orbitRangeStatusSubject } : {},
        },
        [
          createElement("input", {
            className,
            attrs: {
              type,
              ...(step != null ? { step } : {}),
              ...(min != null ? { min } : {}),
              ...(max != null ? { max } : {}),
              value: value == null ? "" : String(value),
            },
          }),
          isOrbitRange
            ? createOrbitRangeModeToggleNode({
                name: orbitRangeName,
                selectedModeId: orbitRangeModeForValue(value).id,
              })
            : null,
          isOrbitRange
            ? createElement("input", {
                className: sliderClassName,
                attrs: {
                  type: "range",
                  "aria-label": `${label} slider`,
                  value: value == null ? "" : String(value),
                },
              })
            : null,
          isOrbitRange ? rangeMetaNode(String(ORBIT_AU_MIN), String(ORBIT_AU_MAX)) : null,
          isOrbitRange
            ? createElement("div", {
                className: "hint orbit-range-status",
                dataset: { orbitRangeSubject: orbitRangeStatusSubject },
              })
            : null,
        ],
      ),
    ]);
  }

  function cometSelectFieldNode({ label, tipText, className, value, options }) {
    const selectEl = createElement(
      "select",
      { className },
      options.map((option) =>
        createElement("option", {
          attrs: { value: option.value },
          text: option.label,
        }),
      ),
    );
    selectEl.value = value == null ? "" : String(value);
    return createElement("div", { className: "form-row comet-field" }, [
      createElement("div", {}, [labelWithTipNode(label, tipText)]),
      createElement("div", { className: "input-pair" }, [selectEl]),
    ]);
  }

  function cometRowNode(comet, index, isSelected) {
    const sourceOptions = COMET_SOURCE_RESERVOIRS.map((value) => ({
      value,
      label: COMET_SOURCE_LABELS[value] || value,
    }));
    const volatileOptions = COMET_VOLATILE_CLASSES.map((value) => ({
      value,
      label: COMET_VOLATILE_LABELS[value] || value,
    }));
    return createElement(
      "div",
      {
        className: `comet-row${isSelected ? " is-selected" : ""}`,
        dataset: { cometId: comet.id },
      },
      [
        createElement("div", { className: "comet-row__head" }, [
          createElement("div", { className: "comet-row__title" }, [
            createElement("div", { className: "label" }, [
              `Comet ${index + 1}`,
              isSelected
                ? createElement("span", {
                    className: "comet-row__badge",
                    text: "Selected",
                  })
                : null,
            ]),
            createElement("div", {
              className: "hint",
              text: "Named comet scoped to the active host frame.",
            }),
          ]),
          createElement("div", { className: "comet-row__actions" }, [
            createElement("button", {
              className: "small comet-select",
              attrs: { type: "button" },
              text: isSelected ? "Selected" : "Select",
            }),
            createElement("button", {
              className: "small comet-duplicate",
              attrs: { type: "button" },
              text: "Duplicate",
            }),
            createElement("button", {
              className: "small danger comet-remove",
              attrs: { type: "button" },
              text: "Delete",
            }),
          ]),
        ]),
        createElement("div", { className: "form-row flow-stack-gap--sm" }, [
          createElement("div", {}, [labelWithTipNode("Name", TIP_LABEL.Comets)]),
          createElement("div", { className: "input-pair" }, [
            createElement("input", {
              className: "comet-name",
              attrs: { type: "text", value: comet.name || `Comet ${index + 1}` },
            }),
          ]),
        ]),
        createElement("div", { className: "comet-grid" }, [
          cometSelectFieldNode({
            label: "Source reservoir",
            tipText: TIP_LABEL["Source reservoir"],
            className: "comet-source",
            value: comet.sourceReservoir,
            options: sourceOptions,
          }),
          cometFieldNode({
            label: "Semi-major axis",
            tipText: TIP_LABEL["Semi-major axis"],
            unit: "AU",
            className: "comet-a",
            sliderClassName: "comet-a-slider",
            step: "0.01",
            min: String(ORBIT_AU_MIN),
            max: String(ORBIT_AU_MAX),
            value: comet.semiMajorAxisAu,
            orbitRangeName: `comet_${comet.id}_axisRange`,
            orbitRangeStatusSubject: "orbit",
          }),
          cometFieldNode({
            label: "Eccentricity",
            tipText: TIP_LABEL.Eccentricity,
            className: "comet-e",
            step: "0.0001",
            min: "0",
            max: "0.9999",
            value: comet.eccentricity,
          }),
          cometFieldNode({
            label: "Inclination",
            tipText: TIP_LABEL.Inclination,
            unit: "\u00b0",
            className: "comet-inc",
            step: "0.1",
            min: "0",
            max: "180",
            value: comet.inclinationDeg,
          }),
          cometFieldNode({
            label: "Longitude of periapsis",
            tipText: TIP_LABEL["Longitude of periapsis"],
            unit: "\u00b0",
            className: "comet-argw",
            step: "0.1",
            min: "0",
            max: "360",
            value: comet.longitudeOfPeriapsisDeg,
          }),
          cometFieldNode({
            label: "Phase",
            tipText: TIP_LABEL.Phase,
            unit: "\u00b0",
            className: "comet-ma",
            step: "0.1",
            min: "0",
            max: "360",
            value: comet.meanAnomalyDeg,
          }),
          cometFieldNode({
            label: "Nucleus radius",
            tipText: TIP_LABEL["Nucleus radius"],
            unit: "km",
            className: "comet-radius",
            step: "0.1",
            min: "0.5",
            max: "50",
            value: comet.nucleusRadiusKm,
          }),
          cometSelectFieldNode({
            label: "Volatile class",
            tipText: TIP_LABEL["Volatile class"],
            className: "comet-volatile",
            value: comet.volatileClass,
            options: volatileOptions,
          }),
        ]),
        createElement("details", { className: "derived-details comet-advanced" }, [
          createElement("summary", { className: "derived-details__summary" }, [
            createElement("span", { className: "derived-details__title", text: "Advanced" }),
          ]),
          createElement("div", { className: "derived-details__body" }, [
            createElement("div", { className: "comet-grid comet-grid--advanced" }, [
              cometFieldNode({
                label: "Density",
                tipText: TIP_LABEL.Density,
                unit: "g/cm^3",
                className: "comet-density",
                step: "0.01",
                min: "0.2",
                max: "1",
                value: comet.densityGcm3,
              }),
              cometFieldNode({
                label: "Albedo",
                tipText: TIP_LABEL.Albedo,
                className: "comet-albedo",
                step: "0.001",
                min: "0.01",
                max: "0.12",
                value: comet.albedo,
              }),
              cometFieldNode({
                label: "Active surface fraction",
                tipText: TIP_LABEL["Active surface fraction"],
                className: "comet-active",
                step: "0.001",
                min: "0.005",
                max: "0.5",
                value: comet.activeFraction,
              }),
              cometFieldNode({
                label: "Dust-to-gas ratio",
                tipText: TIP_LABEL["Dust-to-gas ratio"],
                className: "comet-dustgas",
                step: "0.01",
                min: "0.5",
                max: "4",
                value: comet.dustToGasRatio,
              }),
            ]),
          ]),
        ]),
      ],
    );
  }

  function renderCometsEditor(world, _model, context) {
    const { activeHostFrame, activeHostFrameId, fallbackHostFrameId, oortCloud } = context;
    const resolvedOortCloud = oortCloud?.resolved || oortCloud || {};
    const oortCloudConfig = getSystemOortCloudConfig(world);
    const seedProfileOptions = OORT_CLOUD_SEED_PROFILES.map((value) => ({
      value,
      label: OORT_SEED_PROFILE_LABELS[value] || value,
    }));
    const seedVolatileOptions = OORT_CLOUD_SEED_VOLATILES.map((value) => ({
      value,
      label: OORT_SEED_VOLATILE_LABELS[value] || value,
    }));
    const seedInclinationOptions = OORT_CLOUD_SEED_INCLINATIONS.map((value) => ({
      value,
      label: OORT_SEED_INCLINATION_LABELS[value] || value,
    }));
    const seedSizeOptions = OORT_CLOUD_SEED_NUCLEUS_BIASES.map((value) => ({
      value,
      label: OORT_SEED_SIZE_LABELS[value] || value,
    }));
    const comets = getComets(world, {
      hostFrameId: activeHostFrameId,
      fallbackHostFrameId,
    });
    const selectedComet = getSelectedComet(world);
    const selectedCometId =
      selectedComet && comets.some((comet) => comet.id === selectedComet.id)
        ? selectedComet.id
        : comets[0]?.id || null;

    replaceChildren(cometsEditorEl, [
      createElement("div", { className: "subsection" }, [
        createElement("div", { className: "subsection__title" }, [
          "Comets",
          " ",
          tipIconNode(TIP_LABEL.Comets),
        ]),
        createElement("div", {
          className: "hint",
          text: `Author named comets for ${activeHostFrame?.label || "this host frame"} without changing the debris-disk architecture.`,
        }),
        createElement(
          "details",
          {
            className: "derived-details",
            attrs: { id: "oortSeedingPanel", style: "margin-top:10px" },
          },
          [
            createElement("summary", { className: "derived-details__summary" }, [
              createElement("span", { className: "derived-details__title", text: "Oort Seeding" }),
            ]),
            createElement("div", { className: "derived-details__body" }, [
              createElement("div", { className: "comet-grid comet-grid--advanced" }, [
                cometSelectFieldNode({
                  label: "Seed Profile",
                  tipText: TIP_LABEL["Seed Profile"],
                  className: "oort-seeding-profile",
                  value: oortCloudConfig.seeding.profile,
                  options: seedProfileOptions,
                }),
                cometSelectFieldNode({
                  label: "Default Volatiles",
                  tipText: TIP_LABEL["Default Volatiles"],
                  className: "oort-seeding-volatile",
                  value: oortCloudConfig.seeding.volatileClass,
                  options: seedVolatileOptions,
                }),
                cometSelectFieldNode({
                  label: "Inclination Profile",
                  tipText: TIP_LABEL["Inclination Profile"],
                  className: "oort-seeding-inclination",
                  value: oortCloudConfig.seeding.inclinationMode,
                  options: seedInclinationOptions,
                }),
                cometSelectFieldNode({
                  label: "Nucleus Size Bias",
                  tipText: TIP_LABEL["Nucleus Size Bias"],
                  className: "oort-seeding-size",
                  value: oortCloudConfig.seeding.nucleusSizeBias,
                  options: seedSizeOptions,
                }),
              ]),
            ]),
          ],
        ),
        createElement(
          "div",
          { className: "row", attrs: { style: "margin-top:10px; gap:8px; flex-wrap:wrap;" } },
          [
            createElement("button", {
              className: "small",
              attrs: { id: "btn-comet-add", type: "button" },
              text: "Add comet",
            }),
            createElement("button", {
              className: "small",
              attrs: {
                id: "btn-comet-seed-oort",
                type: "button",
                ...(resolvedOortCloud?.present ? {} : { disabled: "disabled" }),
                title: TIP_LABEL["Seed from Oort"],
              },
              text: "Seed from Oort",
            }),
          ],
        ),
        createElement("div", {
          className: "hint",
          attrs: { id: "cometOortSeedHint", style: "margin-top:8px" },
          text: resolvedOortCloud?.present
            ? "Create a deterministic long-period comet template from the inferred Oort reservoir and attach it to this host frame."
            : "No robust Oort cloud reservoir is inferred for this system yet.",
        }),
        comets.length
          ? createElement(
              "div",
              { className: "comet-list" },
              comets.map((comet, index) =>
                cometRowNode(comet, index, comet.id === selectedCometId),
              ),
            )
          : createElement("div", {
              className: "derived-readout comet-empty",
              text: "No authored comets in this host frame yet. Add a comet to start modeling a named short-period or long-period visitor.",
            }),
      ]),
    ]);

    function saveFromEditor() {
      const rows = [...cometsEditorEl.querySelectorAll(".comet-row")];
      const result = rows.map((row) => ({
        id: row.getAttribute("data-comet-id"),
        name: row.querySelector(".comet-name")?.value,
        hostFrameId: activeHostFrameId,
        sourceReservoir: row.querySelector(".comet-source")?.value,
        semiMajorAxisAu: parseOptionalNumber(row.querySelector(".comet-a")?.value),
        eccentricity: parseOptionalNumber(row.querySelector(".comet-e")?.value),
        inclinationDeg: parseOptionalNumber(row.querySelector(".comet-inc")?.value),
        longitudeOfPeriapsisDeg: parseOptionalNumber(row.querySelector(".comet-argw")?.value),
        meanAnomalyDeg: parseOptionalNumber(row.querySelector(".comet-ma")?.value),
        nucleusRadiusKm: parseOptionalNumber(row.querySelector(".comet-radius")?.value),
        densityGcm3: parseOptionalNumber(row.querySelector(".comet-density")?.value),
        albedo: parseOptionalNumber(row.querySelector(".comet-albedo")?.value),
        activeFraction: parseOptionalNumber(row.querySelector(".comet-active")?.value),
        dustToGasRatio: parseOptionalNumber(row.querySelector(".comet-dustgas")?.value),
        volatileClass: row.querySelector(".comet-volatile")?.value,
      }));
      saveSystemComets(
        replaceCometsForHostFrame(world, result, activeHostFrameId, fallbackHostFrameId),
      );
      scheduleRender();
    }

    cometsEditorEl.querySelector("#btn-comet-add")?.addEventListener("click", () => {
      const currentWorld = loadWorld();
      const now = getComets(currentWorld, {
        hostFrameId: activeHostFrameId,
        fallbackHostFrameId,
      });
      const nextId = `c${Math.random().toString(36).slice(2, 9)}`;
      now.push({
        id: nextId,
        ...DEFAULT_NEW_COMET,
        hostFrameId: activeHostFrameId,
      });
      saveSystemComets(
        replaceCometsForHostFrame(currentWorld, now, activeHostFrameId, fallbackHostFrameId),
      );
      selectComet(nextId);
      scheduleRender();
    });

    const bindSeedingPreference = (selector, key) => {
      const input = cometsEditorEl.querySelector(selector);
      input?.addEventListener("change", () => {
        updateOortCloudConfig((next) => {
          next.seeding[key] = input.value;
        });
      });
    };

    bindSeedingPreference(".oort-seeding-profile", "profile");
    bindSeedingPreference(".oort-seeding-volatile", "volatileClass");
    bindSeedingPreference(".oort-seeding-inclination", "inclinationMode");
    bindSeedingPreference(".oort-seeding-size", "nucleusSizeBias");

    cometsEditorEl.querySelector("#btn-comet-seed-oort")?.addEventListener("click", () => {
      if (!resolvedOortCloud?.present) return;
      const currentWorld = loadWorld();
      const now = getComets(currentWorld, {
        hostFrameId: activeHostFrameId,
        fallbackHostFrameId,
      });
      const nextId = `c${Math.random().toString(36).slice(2, 9)}`;
      now.push({
        id: nextId,
        ...resolvedOortCloud.seedCometDefaults,
        hostFrameId: activeHostFrameId,
      });
      saveSystemComets(
        replaceCometsForHostFrame(currentWorld, now, activeHostFrameId, fallbackHostFrameId),
      );
      selectComet(nextId);
      scheduleRender();
    });

    for (const row of cometsEditorEl.querySelectorAll(".comet-row")) {
      const cometId = row.getAttribute("data-comet-id");
      const cometAxisEl = row.querySelector(".comet-a");
      const cometAxisSliderEl = row.querySelector(".comet-a-slider");
      if (cometAxisEl && cometAxisSliderEl) {
        bindOrbitRangeControl({
          numberEl: cometAxisEl,
          sliderEl: cometAxisSliderEl,
          root: cometAxisEl.closest(".orbit-range-control"),
          min: ORBIT_AU_MIN,
          max: ORBIT_AU_MAX,
          step: 0.01,
          commitOnInput: false,
          statusSubject: "orbit",
          onChange: saveFromEditor,
        });
      }
      for (const field of row.querySelectorAll("input, select")) {
        if (
          field === cometAxisEl ||
          field === cometAxisSliderEl ||
          field.matches("[data-orbit-range-mode]")
        ) {
          continue;
        }
        field.addEventListener("change", saveFromEditor);
      }

      row.querySelector(".comet-select")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        selectComet(cometId);
        scheduleRender();
      });

      row.querySelector(".comet-duplicate")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const currentWorld = loadWorld();
        const now = getComets(currentWorld, {
          hostFrameId: activeHostFrameId,
          fallbackHostFrameId,
        });
        const source = now.find((comet) => comet.id === cometId);
        if (!source) return;
        const nextId = `c${Math.random().toString(36).slice(2, 9)}`;
        now.push({
          ...source,
          id: nextId,
          name: `${source.name || "Comet"} Copy`,
        });
        saveSystemComets(
          replaceCometsForHostFrame(currentWorld, now, activeHostFrameId, fallbackHostFrameId),
        );
        selectComet(nextId);
        scheduleRender();
      });

      row.querySelector(".comet-remove")?.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const currentWorld = loadWorld();
        const deletePlan = buildDeleteCometPlan(currentWorld, cometId, {
          hostFrameId: activeHostFrameId,
          fallbackHostFrameId,
        });
        if (!deletePlan) return;
        const confirmed = await confirmDestructiveAction(deletePlan);
        if (!confirmed) return;
        const now = getComets(currentWorld, {
          hostFrameId: activeHostFrameId,
          fallbackHostFrameId,
        }).filter((comet) => comet.id !== cometId);
        saveSystemComets(
          replaceCometsForHostFrame(currentWorld, now, activeHostFrameId, fallbackHostFrameId),
        );
        setSelectedCometId(now[0]?.id || null);
        scheduleRender();
      });
    }
  }

  function renderDebrisDisksEditor(world, model, context) {
    const { activeHostFrame, activeHostFrameId, fallbackHostFrameId } = context;
    const disks = getDebrisDisks(world, {
      hostFrameId: activeHostFrameId,
      fallbackHostFrameId,
    });

    // Compute suggestions for the preview
    const gasGiants = getGasGiants(world, {
      hostFrameId: activeHostFrameId,
      fallbackHostFrameId,
    });
    const zones = calcDebrisDiskSuggestions({
      gasGiants: gasGiants.map((g) => ({ name: g.name, au: g.au })),
      starLuminosityLsol: model.star.luminosityLsol,
    });
    replaceChildren(debrisEditorEl, [
      createElement("div", { className: "subsection" }, [
        createElement("div", { className: "subsection__title" }, [
          "Debris disks",
          " ",
          tipIconNode(TIP_LABEL["Debris disks"]),
        ]),
        createElement("div", {
          className: "hint",
          text: `Debris disk positions for ${activeHostFrame?.label || "this host frame"} can be auto-suggested from gas giant resonances (or this frame's frost line if no giants), or set manually.`,
        }),
        createElement("div", { className: "dd-suggest-preview" }, [
          zones.length
            ? createElement("div", { className: "label flow-stack-gap--sm" }, [
                "Possible zones",
                " ",
                tipIconNode(TIP_LABEL["Suggest"]),
              ])
            : null,
          zones.length
            ? createElement("div", {
                className: "hint",
                text: `Select zones to add. Based on ${
                  gasGiants.length
                    ? "gas giant resonances in this host frame"
                    : "this host frame's frost line estimate"
                }. Recommended zones are pre-selected.`,
              })
            : createElement("div", {
                className: "hint flow-stack-gap--sm",
                text: "No suggestions available. Add gas giants or adjust star parameters.",
              }),
          zones.length
            ? createElement(
                "div",
                { className: "dd-suggest-list" },
                zones.map((zone, index) =>
                  createElement(
                    "label",
                    {
                      className: `dd-suggest-item${
                        zone.recommended ? "" : " dd-suggest-item--alt"
                      }`,
                    },
                    [
                      createElement("input", {
                        attrs: { type: "checkbox" },
                        dataset: { zoneIdx: index },
                        checked: zone.recommended,
                      }),
                      createElement("span", {
                        className: "dd-suggest-priority",
                        text: `P${zone.priority}`,
                      }),
                      createElement("span", {
                        className: "dd-suggest-label",
                        text: zone.label,
                      }),
                      createElement("span", {
                        className: "dd-suggest-range",
                        text: `${fmt(zone.innerAu, 2)}\u2013${fmt(zone.outerAu, 2)} AU`,
                      }),
                      createElement("span", {
                        className: "dd-suggest-res",
                        text: `${
                          zone.resonanceInner && zone.resonanceOuter
                            ? `${zone.resonanceInner} \u2192 ${zone.resonanceOuter}`
                            : "Frost-line scaled"
                        }${zone.sculptorName ? ` (${zone.sculptorName})` : ""}`,
                      }),
                    ],
                  ),
                ),
              )
            : null,
          zones.length
            ? createElement(
                "div",
                { className: "button-row", attrs: { style: "margin-top:6px" } },
                [
                  createElement("button", {
                    attrs: { id: "btn-dd-add-selected", type: "button" },
                    text: "Add selected",
                  }),
                ],
              )
            : null,
        ]),
        createElement("div", { className: "dd-list" }, disks.map(debrisRowNode)),
        createElement("div", { className: "button-row", attrs: { style: "margin-top:10px" } }, [
          createElement("button", {
            attrs: { id: "btn-dd-add", type: "button" },
            text: "Add debris disk",
          }),
        ]),
      ]),
    ]);

    const ddRows = [...debrisEditorEl.querySelectorAll(".dd-row")];
    let hydrating = true;

    function saveFromEditor() {
      if (isRendering) return;
      const result = [];
      for (const row of ddRows) {
        const id = row.getAttribute("data-dd-id");
        const name = row.querySelector(".dd-name").value;
        const mode = ddInputModes.get(id) || "edges";
        let innerAu, outerAu;
        if (mode === "center") {
          const c = Number(row.querySelector(".dd-center").value);
          const w = Number(row.querySelector(".dd-width").value);
          const cVal = Number.isFinite(c) && c > 0 ? c : 1;
          const wVal = Number.isFinite(w) && w > 0 ? w : 0.1;
          innerAu = Math.max(0.01, cVal - wVal / 2);
          outerAu = cVal + wVal / 2;
        } else {
          const inner = Number(row.querySelector(".dd-inner").value);
          const outer = Number(row.querySelector(".dd-outer").value);
          innerAu = Number.isFinite(inner) && inner > 0 ? inner : 0.01;
          outerAu = Number.isFinite(outer) && outer > 0 ? outer : 0.01;
        }
        const eccVal = row.querySelector(".dd-ecc").value;
        const incVal = row.querySelector(".dd-inc").value;
        const massVal = row.querySelector(".dd-mass").value;
        result.push({
          id,
          name,
          hostFrameId: activeHostFrameId,
          innerAu,
          outerAu,
          suggested: false,
          eccentricity: eccVal !== "" ? Number(eccVal) : null,
          inclination: incVal !== "" ? Number(incVal) : null,
          totalMassMearth: massVal !== "" ? Number(massVal) : null,
        });
      }
      saveSystemDebrisDisks(
        replaceDebrisDisksForHostFrame(world, result, activeHostFrameId, fallbackHostFrameId),
      );
      scheduleRender();
    }

    for (const row of ddRows) {
      const id = row.getAttribute("data-dd-id");
      const innerEl = row.querySelector(".dd-inner");
      const innerSl = row.querySelector(".dd-inner-slider");
      const outerEl = row.querySelector(".dd-outer");
      const outerSl = row.querySelector(".dd-outer-slider");
      const centerEl = row.querySelector(".dd-center");
      const centerSl = row.querySelector(".dd-center-slider");
      const widthEl = row.querySelector(".dd-width");
      const widthSl = row.querySelector(".dd-width-slider");
      const edgesGroup = row.querySelector(".dd-edges-group");
      const centerGroup = row.querySelector(".dd-center-group");
      const modeToggle = row.querySelector(".dd-mode-toggle");

      const onChange = () => {
        if (hydrating) return;
        saveFromEditor();
      };

      bindOrbitRangeControl({
        numberEl: innerEl,
        sliderEl: innerSl,
        root: innerEl.closest(".orbit-range-control"),
        min: ORBIT_AU_MIN,
        max: ORBIT_AU_MAX,
        step: 0.01,
        commitOnInput: false,
        statusSubject: "edge",
        onChange,
      });
      bindOrbitRangeControl({
        numberEl: outerEl,
        sliderEl: outerSl,
        root: outerEl.closest(".orbit-range-control"),
        min: ORBIT_AU_MIN,
        max: ORBIT_AU_MAX,
        step: 0.01,
        commitOnInput: false,
        statusSubject: "edge",
        onChange,
      });
      bindOrbitRangeControl({
        numberEl: centerEl,
        sliderEl: centerSl,
        root: centerEl.closest(".orbit-range-control"),
        min: ORBIT_AU_MIN,
        max: ORBIT_AU_MAX,
        step: 0.01,
        commitOnInput: false,
        statusSubject: "center",
        onChange,
      });
      bindOrbitRangeControl({
        numberEl: widthEl,
        sliderEl: widthSl,
        root: widthEl.closest(".orbit-range-control"),
        min: ORBIT_AU_MIN,
        max: ORBIT_AU_MAX,
        step: 0.01,
        commitOnInput: false,
        statusSubject: "width",
        onChange,
      });

      const eccEl = row.querySelector(".dd-ecc");
      const eccSl = row.querySelector(".dd-ecc-slider");
      const incEl = row.querySelector(".dd-inc");
      const incSl = row.querySelector(".dd-inc-slider");
      const massEl = row.querySelector(".dd-mass");
      const massClear = row.querySelector(".dd-mass-clear");

      bindNumberAndSlider({
        numberEl: eccEl,
        sliderEl: eccSl,
        min: 0,
        max: 0.5,
        step: 0.01,
        mode: "linear",
        onChange,
      });
      bindNumberAndSlider({
        numberEl: incEl,
        sliderEl: incSl,
        min: 0,
        max: 90,
        step: 1,
        mode: "linear",
        onChange,
      });
      massEl.addEventListener("change", onChange);
      massClear.addEventListener("click", () => {
        massEl.value = "";
        onChange();
      });

      modeToggle.addEventListener("change", () => {
        const newMode = row.querySelector('input[name="ddMode_' + id + '"]:checked').value;
        ddInputModes.set(id, newMode);
        if (newMode === "center") {
          // Sync center/width from current inner/outer
          const inner = Number(innerEl.value) || 0;
          const outer = Number(outerEl.value) || 0;
          centerEl.value = Math.round(((inner + outer) / 2) * 100) / 100;
          widthEl.value = Math.round((outer - inner) * 100) / 100;
          centerEl.dispatchEvent(new Event("input", { bubbles: true }));
          widthEl.dispatchEvent(new Event("input", { bubbles: true }));
          edgesGroup.style.display = "none";
          centerGroup.style.display = "";
        } else {
          // Sync inner/outer from current center/width
          const c = Number(centerEl.value) || 0;
          const w = Number(widthEl.value) || 0;
          innerEl.value = Math.max(0.01, Math.round((c - w / 2) * 100) / 100);
          outerEl.value = Math.round((c + w / 2) * 100) / 100;
          innerEl.dispatchEvent(new Event("input", { bubbles: true }));
          outerEl.dispatchEvent(new Event("input", { bubbles: true }));
          edgesGroup.style.display = "";
          centerGroup.style.display = "none";
        }
        if (!hydrating) saveFromEditor();
      });

      row.querySelector(".dd-name").addEventListener("change", saveFromEditor);
      row.querySelector(".dd-remove").addEventListener("click", async () => {
        const currentWorld = loadWorld();
        const deletePlan = buildDeleteDebrisDiskPlan(currentWorld, id, {
          hostFrameId: activeHostFrameId,
          fallbackHostFrameId,
        });
        if (!deletePlan) return;
        const confirmed = await confirmDestructiveAction(deletePlan);
        if (!confirmed) return;
        const now = getDebrisDisks(currentWorld, {
          hostFrameId: activeHostFrameId,
          fallbackHostFrameId,
        }).filter((d) => d.id !== id);
        ddInputModes.delete(id);
        saveSystemDebrisDisks(
          replaceDebrisDisksForHostFrame(currentWorld, now, activeHostFrameId, fallbackHostFrameId),
        );
        scheduleRender();
      });
    }

    hydrating = false;

    // "Add selected" button — adds only checked zones from the preview
    debrisEditorEl.querySelector("#btn-dd-add-selected")?.addEventListener("click", () => {
      const checked = [
        ...debrisEditorEl.querySelectorAll('.dd-suggest-item input[type="checkbox"]:checked'),
      ];
      if (!checked.length) return;

      const w = loadWorld();
      const existing = getDebrisDisks(w, {
        hostFrameId: activeHostFrameId,
        fallbackHostFrameId,
      });
      const newDisks = [...existing];
      for (const cb of checked) {
        const idx = Number(cb.dataset.zoneIdx);
        const z = zones[idx];
        if (!z) continue;
        newDisks.push({
          id: `dd${Math.random().toString(36).slice(2, 9)}`,
          name: z.label,
          hostFrameId: activeHostFrameId,
          innerAu: z.innerAu,
          outerAu: z.outerAu,
          suggested: true,
        });
      }
      saveSystemDebrisDisks(
        replaceDebrisDisksForHostFrame(w, newDisks, activeHostFrameId, fallbackHostFrameId),
      );
      scheduleRender();
    });

    // Add button
    debrisEditorEl.querySelector("#btn-dd-add")?.addEventListener("click", () => {
      const currentWorld = loadWorld();
      const now = getDebrisDisks(currentWorld, {
        hostFrameId: activeHostFrameId,
        fallbackHostFrameId,
      });
      // Default placement: beyond frost line, scaled to this system
      const frostAu = model.frostLineAu || activeHostFrame?.zones?.frostLineAu || 5;
      const defaultInner = Math.round(frostAu * 3 * 100) / 100;
      const defaultOuter = Math.round(frostAu * 5 * 100) / 100;
      now.push({
        id: `dd${Math.random().toString(36).slice(2, 9)}`,
        name: `Debris disk ${now.length + 1}`,
        hostFrameId: activeHostFrameId,
        innerAu: defaultInner,
        outerAu: defaultOuter,
      });
      saveSystemDebrisDisks(
        replaceDebrisDisksForHostFrame(currentWorld, now, activeHostFrameId, fallbackHostFrameId),
      );
      scheduleRender();
    });
  }

  /* ── Output Summary ─────────────────────────────────────────────── */

  function renderSummary(world, model, context) {
    const { activeHostFrame, activeHostFrameId, activeSolveContext, fallbackHostFrameId } = context;
    const oortSummaryBlock = createOortSummarySection(context.oortCloud, {
      marginBottom: state.activeTab === "oort" ? 0 : 18,
    });

    if (state.activeTab === "oort") {
      replaceChildren(summaryEl, [oortSummaryBlock]);
      enableKpiInteractions(summaryEl);
      return;
    }

    if (state.activeTab === "comets") {
      const comets = getComets(world, {
        hostFrameId: activeHostFrameId,
        fallbackHostFrameId,
      });
      const selectedComet = getSelectedComet(world);
      const visibleSelectedComet =
        selectedComet && comets.some((comet) => comet.id === selectedComet.id)
          ? selectedComet
          : comets[0] || null;
      const cometModel = visibleSelectedComet
        ? calcComet({
            comet: visibleSelectedComet,
            starMassMsol: Number(activeSolveContext?.starConfig?.massMsol) || 1,
            starLuminosityLsol: Number(model?.star?.luminosityLsol) || 1,
          })
        : null;
      const cometAppearance =
        visibleSelectedComet && cometModel
          ? resolveCometAppearance({ comet: visibleSelectedComet, cometModel })
          : null;

      replaceChildren(summaryEl, [
        oortSummaryBlock,
        createElement("div", { className: "kpi-grid" }, [
          createOuterKpiCard(
            "Comets",
            comets.length,
            activeHostFrame?.label || "",
            TIP_LABEL["Comets count"],
          ),
        ]),
        visibleSelectedComet && cometModel
          ? [
              createElement("div", {
                className: "label",
                attrs: { style: "margin-top:18px" },
                text: visibleSelectedComet.name,
              }),
              createElement("div", { className: "kpi-grid" }, [
                createOuterKpiCard(
                  "Perihelion",
                  `${fmt(cometModel.orbit.perihelionAu, 2)} AU`,
                  "",
                  TIP_LABEL.Perihelion,
                ),
                createOuterKpiCard(
                  "Aphelion",
                  `${fmt(cometModel.orbit.aphelionAu, 2)} AU`,
                  "",
                  TIP_LABEL.Aphelion,
                ),
                createOuterKpiCard(
                  "Orbital Period",
                  formatCometOrbitPeriod(cometModel.orbit.orbitalPeriodYears),
                  cometModel.classification.dynamicalClass,
                  TIP_LABEL["Orbital Period"],
                ),
                createOuterKpiCard(
                  "Activity",
                  cometModel.display.activityState,
                  cometModel.classification.volatileLabel,
                  TIP_LABEL.Activity,
                ),
                createOuterPreviewKpiCard(
                  "Appearance",
                  cometAppearance
                    ? `${cometAppearance.label} | ${cometAppearance.meta}. ${cometAppearance.description}`
                    : "",
                  TIP_LABEL.Appearance,
                ),
                createOuterKpiCard(
                  "Current Radius",
                  `${fmt(cometModel.orbit.currentRadiusAu, 3)} AU`,
                  "",
                  TIP_LABEL["Current Radius"],
                ),
                createOuterKpiCard(
                  "Current Speed",
                  `${fmt(cometModel.orbit.currentSpeedKms, 2)} km/s`,
                  "",
                  TIP_LABEL["Current Speed"],
                ),
                createOuterKpiCard(
                  "Coma Radius",
                  cometModel.activity.comaRadiusKm > 0
                    ? `${fmt(cometModel.activity.comaRadiusKm, 0)} km`
                    : "None",
                  "",
                  TIP_LABEL["Coma Radius"],
                ),
                createOuterKpiCard(
                  "Dust Tail",
                  cometModel.activity.dustTailLengthAu > 0
                    ? `${fmt(cometModel.activity.dustTailLengthAu, 3)} AU`
                    : "None",
                  "",
                  TIP_LABEL["Dust Tail"],
                ),
                createOuterKpiCard(
                  "Ion Tail",
                  cometModel.activity.ionTailLengthAu > 0
                    ? `${fmt(cometModel.activity.ionTailLengthAu, 3)} AU`
                    : "None",
                  "",
                  TIP_LABEL["Ion Tail"],
                ),
                createOuterKpiCard(
                  "Source Reservoir",
                  cometModel.display.sourceReservoir,
                  cometModel.classification.sourceReservoir,
                  TIP_LABEL["Source Reservoir"],
                ),
              ]),
            ]
          : createElement("div", {
              className: "derived-readout",
              attrs: { style: "margin-top:16px" },
              text: "Select or add a comet in this host frame to see current orbit and activity outputs.",
            }),
      ]);
      const previewCanvas = summaryEl.querySelector(".comet-preview-canvas");
      if (previewCanvas && cometAppearance) {
        paintCometPreview(previewCanvas, cometAppearance);
      }
      enableKpiInteractions(summaryEl);
      return;
    }

    const disks = getDebrisDisks(world, {
      hostFrameId: activeHostFrameId,
      fallbackHostFrameId,
    });
    const gasGiants = getGasGiants(world, {
      hostFrameId: activeHostFrameId,
      fallbackHostFrameId,
    });
    const starTeffK = model.star.tempK || 0;
    const starData = {
      starMassMsol: Number(activeSolveContext?.starConfig?.massMsol) || 1,
      starLuminosityLsol: model.star.luminosityLsol,
      starAgeGyr: Number(activeSolveContext?.starConfig?.ageGyr) || 4.6,
      starRadiusRsol: model.star.radiusRsol,
      starMetallicityFeH: Number(activeSolveContext?.starConfig?.metallicityFeH) || 0,
    };
    const giantsForEngine = gasGiants.map((g) => ({
      name: g.name,
      au: g.au,
      massMjup: g.massMjup,
    }));

    // Compute debris disk derived properties
    const ddModels = disks.map((d) =>
      calcDebrisDisk({
        innerAu: d.innerAu,
        outerAu: d.outerAu,
        eccentricity: d.eccentricity,
        inclination: d.inclination,
        totalMassMearth: d.totalMassMearth,
        gasGiants: giantsForEngine,
        starTeffK,
        ...starData,
      }),
    );

    replaceChildren(summaryEl, [
      oortSummaryBlock,
      createElement("div", { className: "kpi-grid" }, [
        createOuterKpiCard(
          "Debris disks",
          disks.length,
          activeHostFrame?.label || "",
          TIP_LABEL["Debris disks count"],
        ),
      ]),
      disks.map((disk, index) => {
        const diskModel = ddModels[index];
        return [
          createElement("div", {
            className: "label",
            attrs: { style: "margin-top:18px" },
            text: disk.name,
          }),
          createElement("div", { className: "kpi-grid" }, [
            createOuterKpiCard(
              "Range",
              diskModel.display.range,
              diskModel.inputs.eccentricity > 0 ? diskModel.display.periApo : "",
              TIP_LABEL["Disk Range"],
            ),
            createOuterKpiCard(
              "Temperature",
              diskModel.display.temperature,
              "",
              TIP_LABEL["Disk Temperature"],
            ),
            createOuterKpiCard(
              "Composition",
              diskModel.display.composition,
              diskModel.composition.dominantMaterials.join(", "),
              TIP_LABEL["Disk Composition"],
            ),
            createOuterKpiCard(
              "Classification",
              diskModel.display.classification,
              diskModel.display.frostLine,
              TIP_LABEL["Resonance"],
            ),
            createOuterKpiCard(
              "Estimated Mass",
              `${diskModel.display.mass} M\u2295`,
              diskModel.display.massSource,
              TIP_LABEL["Estimated Mass"],
            ),
            createOuterKpiCard(
              "Orbital Period",
              diskModel.display.orbitalPeriod,
              "At midpoint",
              TIP_LABEL["Disk Orbital Period"],
            ),
            createOuterKpiCard(
              "Collision Velocity",
              diskModel.display.collisionVelocity,
              diskModel.display.collisionRegime,
              TIP_LABEL["Collision Velocity"],
            ),
            createOuterKpiCard(
              "Surface Density",
              `${diskModel.display.surfaceDensity} g/cm\u00b2`,
              diskModel.display.surfaceDensityVsMMSN,
              TIP_LABEL["Surface Density"],
            ),
            createOuterKpiCard(
              "IR Excess",
              diskModel.display.irExcess,
              diskModel.display.irExcessLabel,
              TIP_LABEL["IR Excess"],
            ),
            createOuterKpiCard(
              "Stability",
              diskModel.display.stability,
              "",
              TIP_LABEL["Disk Stability"],
            ),
          ]),
          createElement("div", { attrs: { style: "margin-top:14px" } }, [
            createElement("div", { className: "label" }, [
              "Derived details",
              " ",
              tipIconNode(TIP_LABEL["Disk Derived"]),
            ]),
            createElement("div", {
              className: "derived-readout",
              text:
                `Fractional luminosity: ${diskModel.display.luminosity}\n` +
                `Optical depth: ${diskModel.display.opticalDepth}\n\n` +
                `Grain blowout size: ${diskModel.display.blowout}\n` +
                `PR drag timescale: ${diskModel.display.prDrag}\n` +
                `Collisional lifetime: ${diskModel.display.collisional}\n` +
                `Dominant process: ${diskModel.display.dominantProcess}\n\n` +
                `Dust production: ${diskModel.display.dustProduction}\n` +
                `Zodiacal delivery: ${diskModel.display.zodiacalInflow} (${diskModel.display.zodiacalLabel})\n` +
                `Ice-to-rock ratio: ${diskModel.display.iceToRock}`,
            }),
          ]),
          createElement("div", { attrs: { style: "margin-top:14px" } }, [
            createElement("div", { className: "label" }, [
              "Condensation species",
              " ",
              tipIconNode(TIP_LABEL["Condensation Species"]),
            ]),
            createElement("div", { className: "derived-readout" }, [
              createElement("table", { className: "mini-table" }, [
                createElement("thead", {}, [
                  createElement("tr", {}, [
                    createElement("th", { text: "Species" }),
                    createElement("th", {}, ["T", createElement("sub", { text: "cond" })]),
                    createElement("th", { text: "Inner" }),
                    createElement("th", { text: "Mid" }),
                    createElement("th", { text: "Outer" }),
                  ]),
                ]),
                createElement(
                  "tbody",
                  {},
                  diskModel.composition.species.map((species) =>
                    createElement("tr", {}, [
                      createElement("td", { text: species.name }),
                      createElement("td", { text: `${species.condensationK} K` }),
                      createElement("td", { text: species.presentAtInner ? "\u2713" : "\u2717" }),
                      createElement("td", { text: species.presentAtMid ? "\u2713" : "\u2717" }),
                      createElement("td", { text: species.presentAtOuter ? "\u2713" : "\u2717" }),
                    ]),
                  ),
                ),
              ]),
              createElement("div", { attrs: { style: "margin-top:4px" } }, [
                "Ice-to-rock ratio",
                " ",
                tipIconNode(TIP_LABEL["Ice-to-Rock Ratio"]),
                ": ",
                diskModel.display.iceToRock,
              ]),
            ]),
          ]),
        ];
      }),
    ]);
    enableKpiInteractions(summaryEl);
  }

  /* ── Main render ────────────────────────────────────────────────── */

  function render() {
    if (isRendering) return;
    isRendering = true;
    try {
      let world = loadWorld();
      let homeSystemContext = buildHomeSystemContext(world);
      const fallbackHostFrameId =
        homeSystemContext?.defaultHostFrameId || homeSystemContext?.primaryStarId || "star_a";
      let activeSolveContext =
        resolveHostFrameContext(
          homeSystemContext,
          normalizeHostFrameId(state.activeHostFrameId, fallbackHostFrameId),
        ) || resolveHostFrameContext(homeSystemContext, fallbackHostFrameId);
      let activeHostFrameId = normalizeHostFrameId(
        activeSolveContext?.hostFrameId,
        fallbackHostFrameId,
      );
      let activeHostFrame =
        activeSolveContext?.hostFrame || homeSystemContext?.hostFramesById?.[activeHostFrameId];
      state.activeHostFrameId = activeHostFrameId;
      const model = activeHostFrame?.system || homeSystemContext?.primarySystem;
      const oortCloud = calcSystemOortCloud(world, homeSystemContext);
      const oortCloudConfig = getSystemOortCloudConfig(world);

      const hostFrameOptions = buildHostFrameOptions(homeSystemContext, activeHostFrameId);
      replaceChildren(
        hostFrameSelectEl,
        hostFrameOptions.map((option) =>
          createElement("option", {
            attrs: { value: option.value },
            text: option.label,
            selected: option.selected,
          }),
        ),
      );
      hostFrameSelectEl.value = activeHostFrameId || "";
      hostFrameHintEl.textContent =
        activeHostFrame?.frameKind === "pair"
          ? "Suggestions and temperatures use the host pair's combined light."
          : "Suggestions and temperatures use the selected star's local orbit family.";
      hostReadoutEl.textContent = buildSelectedHostReadout(activeSolveContext);
      debrisTabEl.checked = state.activeTab === "debris";
      cometsTabEl.checked = state.activeTab === "comets";
      oortTabEl.checked = state.activeTab === "oort";

      // Auto-sync: when gas giants change, update any suggested debris disks
      const gg = getGasGiants(world, {
        hostFrameId: activeHostFrameId,
        fallbackHostFrameId,
      });
      const allZones = calcDebrisDiskSuggestions({
        gasGiants: gg.map((g) => ({ name: g.name, au: g.au })),
        starLuminosityLsol: model.star.luminosityLsol,
      });
      const zones = allZones.filter((z) => z.recommended);
      const existingDisks = getDebrisDisks(world, {
        hostFrameId: activeHostFrameId,
        fallbackHostFrameId,
      });
      const userEdited = existingDisks.filter((d) => !d.suggested);
      const pristine = existingDisks.filter((d) => d.suggested);
      if (
        pristine.length > 0 &&
        (pristine.length !== zones.length ||
          pristine.some(
            (d, i) => !zones[i] || d.innerAu !== zones[i].innerAu || d.outerAu !== zones[i].outerAu,
          ))
      ) {
        const synced = [...userEdited];
        for (let i = 0; i < zones.length; i++) {
          synced.push({
            id: pristine[i]?.id || `dd${Math.random().toString(36).slice(2, 9)}`,
            name: zones[i].label,
            hostFrameId: activeHostFrameId,
            innerAu: zones[i].innerAu,
            outerAu: zones[i].outerAu,
            suggested: true,
          });
        }
        saveSystemDebrisDisks(
          replaceDebrisDisksForHostFrame(world, synced, activeHostFrameId, fallbackHostFrameId),
        );
        world = loadWorld();
        homeSystemContext = buildHomeSystemContext(world);
        activeSolveContext =
          resolveHostFrameContext(homeSystemContext, activeHostFrameId) ||
          resolveHostFrameContext(homeSystemContext, fallbackHostFrameId);
        activeHostFrame =
          activeSolveContext?.hostFrame || homeSystemContext?.hostFramesById?.[activeHostFrameId];
      }

      world = ensureVisibleCometSelection(world, {
        hostFrameId: activeHostFrameId,
        fallbackHostFrameId,
      });

      const renderContext = {
        homeSystemContext,
        fallbackHostFrameId,
        activeHostFrameId,
        activeHostFrame,
        activeSolveContext,
        oortCloud,
      };

      debrisEditorEl.style.display = state.activeTab === "debris" ? "" : "none";
      cometsEditorEl.style.display = state.activeTab === "comets" ? "" : "none";
      oortEditorEl.style.display = state.activeTab === "oort" ? "" : "none";
      if (state.activeTab === "debris") {
        renderDebrisDisksEditor(world, model, renderContext);
      } else if (state.activeTab === "comets") {
        renderCometsEditor(world, model, renderContext);
      } else {
        renderOortSummaryCard(oortCloud, oortCloudConfig);
      }
      renderSummary(world, model, renderContext);
    } finally {
      isRendering = false;
    }
  }

  hostFrameSelectEl?.addEventListener("change", () => {
    state.activeHostFrameId = normalizeHostFrameId(
      hostFrameSelectEl.value,
      state.activeHostFrameId || "star_a",
    );
    render();
  });

  debrisTabEl?.addEventListener("change", () => {
    if (!debrisTabEl.checked) return;
    state.activeTab = "debris";
    render();
  });

  cometsTabEl?.addEventListener("change", () => {
    if (!cometsTabEl.checked) return;
    state.activeTab = "comets";
    render();
  });

  oortTabEl?.addEventListener("change", () => {
    if (!oortTabEl.checked) return;
    state.activeTab = "oort";
    render();
  });

  render();
}
