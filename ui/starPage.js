import { calcStar } from "../engine/star.js";
import { buildHomeSystemContext, resolveHostFrameContext } from "../engine/homeSystem/context.js";
import { buildTopologyGuardrailSummary } from "../engine/homeSystem/stability.js";
import { BROWN_DWARF_MIN_MSOL, regimeDisplayLabel } from "../engine/substellarRegime.js";
import { computeStellarActivityModel } from "../engine/stellarActivity.js";
import { clamp, fmt } from "../engine/utils.js";
import { bindNumberAndSlider } from "./bind.js";
import { appendChildren, createElement } from "./domHelpers.js";
import { createCelestialVisualPreviewController } from "./celestialVisualPreview.js";
import { renderDerivedDetails } from "./derivedDetails.js";
import { renderKpiSections } from "./kpiSections.js";
import { createGuidedFlowController } from "./guidedCreation/flowController.js";
import { createGuidedPanel } from "./guidedCreation/components/guidedPanel.js";
import { createGoalTextAssist } from "./guidedCreation/components/goalTextAssist.js";
import { createGuidedCreationOverlay } from "./guidedCreation/components/overlay.js";
import { ensureStarGuidedAdapterRegistered } from "./guidedCreation/adapters/star.js";
import { getGoalTextAliasHelp } from "./guidedCreation/goalAliases.js";
import { listStellarSystemHostFrames } from "./store/stellarSystemModel.js";
import {
  applyGuidedGoalTextInterpretation,
  clearGuidedGoalTextInterpretation,
} from "./guidedCreation/goalTextInterpretation.js";
import {
  buildGuidedSessionSnapshot,
  clearGuidedSession,
  createGuidedContextFingerprint,
  loadGuidedSession,
  saveGuidedSession,
} from "./guidedCreation/sessionState.js";
import { getGuidedEntryModeTooltip } from "./guidedCreation/tooltips.js";
import { attachTooltips, tipAttr, tipIcon, tipIconNode } from "./tooltip.js";
import {
  getProjectedPrimaryStar,
  getStellarSystem,
  loadWorld,
  saveStellarSystem,
} from "./store.js";
import { createTutorial } from "./tutorial.js";

const TIP_LABEL = {
  Name: "Display name used in exports, the visualiser, and linked pages.",
  Class:
    'Hydrogen-burning stars use the familiar O, B, A, F, G, K, M classes.\n\nBrown dwarfs use cooler L, T, and Y classes and are substellar cooling objects rather than main-sequence stars.\n\nEach class is subdivided 0\u20139 (0 = hottest within class). "V" denotes a main-sequence star undergoing core hydrogen fusion.',
  "Brown Dwarf Class":
    'Brown dwarfs use the L, T, and Y sequence from hottest to coolest.\n\nThe number runs 0-9 within each family, where 0 is hotter and 9 is cooler. So "T9 BD" means a very cool late-T brown dwarf near the T/Y boundary.\n\nQuick guide:\nL = warmer dusty brown dwarf\nT = cooler methane-rich brown dwarf\nY = coldest known brown-dwarf class\nBD = brown dwarf.',
  Mass: "Host-component mass in solar masses.\n\nApproximate regimes:\nBrown dwarf: ~0.0124\u20130.0716 Msol (~13\u201375 Mjup)\nM star: ~0.075\u20130.47 Msol\nK star: ~0.47\u20130.84 Msol\nG star: ~0.84\u20131.06 Msol\nF star: ~1.06\u20131.44 Msol\nA star: ~1.44\u20132.19 Msol\nB star: ~2.19\u201316 Msol\nO star: ~16+ Msol\n\nHydrogen-burning stars between 0.5 and 1.4 Msol are considered most suitable for Earth-like life.\n\nSun = 1 Msol = 1.989E30 kg",
  "Current Age":
    "Star age in billions of years (Gyr). Must be less than the Maximum Age shown in outputs.",
  "Maximum Age":
    "How long your star will remain on the main sequence, in billions of earth years.\n\nComputed as (M / L) \u00d7 10 Gyr \u2014 nuclear fuel supply divided by luminous burn rate.",
  Radius:
    "Stellar radius in solar radii.\n\nFor M \u2264 0.5 Msol: Schweitzer et al. (2019) linear relation from M-dwarf eclipsing binaries.\nFor 0.5\u20131.5 Msol: Eker et al. (2018, MNRAS 479, 5491) quadratic mass\u2013radius relation.\nFor M > 1.5 Msol: Stefan-Boltzmann derivation from Eker MLR + MTR.\n\nSun = 1 Rsol = 695,700 km",
  Luminosity:
    "Stellar luminosity in solar luminosities.\n\nKPI cards may auto-scale dim outputs for readability:\nLsol = Sun's luminosity\nmLsol = 10^-3 Lsol (one thousandth of Sol)\n\u03bcLsol = 10^-6 Lsol (one millionth of Sol)\nnLsol = 10^-9 Lsol (one billionth of Sol)\n\nHover the KPI for the exact Lsol and watt values.\n\nZAMS mode: Eker et al. (2018, MNRAS 479, 5491) six-piece empirical relation from 509 eclipsing binaries. Replaces the classical L = M\u2074 approximation, which overestimated K-dwarf luminosities by 30\u201385%.\n\nEvolved mode: Hurley, Pols & Tout (2000) analytical stellar evolution. Radius and temperature are accurate to ~1\u20132%, but luminosity carries ~10% mean error inherent to the Tout (1996) polynomial ZAMS baseline and Hurley evolution-rate fits. This is the practical accuracy ceiling of analytical single-star evolution; sub-2% luminosity would require tabulated MESA/MIST isochrone grids.\n\nSun = 1 Lsol = 3.846E26 watts",
  "Radius Override":
    "Optionally override the mass-derived stellar radius in solar radii. Leave blank to use the Eker et al. (2018) scaling-law value derived from mass.\n\nUseful for modelling subgiants, evolved stars, or stars with a measured radius.\n\nSun = 1 Rsol = 695,700 km",
  "Luminosity Override":
    "Optionally override the mass-derived luminosity in solar luminosities. Leave blank to use the Eker et al. (2018) scaling-law value derived from mass.\n\nUseful for modelling post-main-sequence stars or stars with a measured luminosity.\n\nSun = 1 Lsol = 3.846E26 watts",
  "Temperature Override":
    "Optionally override the effective temperature in kelvin. Used with one other override to resolve the third via Stefan-Boltzmann (L = R\u00b2 \u00d7 (T/5776)\u2074).\n\nLeave blank to derive temperature from Radius and Luminosity (default).\n\nSun \u2248 5,776 K.",
  Density: "Mean stellar density in solar densities.\n\nSun = 1 Dsol = 1.41 g/cm\u00b3.",
  Temperature:
    "Effective photospheric temperature in kelvin, derived from luminosity and radius via Stefan-Boltzmann.",
  "Habitable Zone":
    "A planet orbiting within this region receives Earth-like stellar heating.\n\nHydrogen-burning stars use the classical habitable-zone wording. Brown dwarfs instead expose a current temperate zone because their luminosity cools over time.\n\nUses a temperature-dependent model where the inner/outer flux thresholds (S_in/S_out) vary with effective temperature.\n\n1 AU = ~150,000,000 km.",
  "Star Colour":
    "Stellar colour derived from effective temperature using Tanner Helland\u2019s empirical blackbody approximation (valid 1000\u201340,000 K, R\u00b2 > 0.987), producing a smooth, continuous colour gradient across spectral classes.",
  "Sun Visual":
    "Animated stellar preview using the current star colour and the active flare/CME rates.\n\nThe preview runs at 0.5 simulated days per second and renders textured photosphere detail plus flare/CME activity.",
  "Earth-like Life?":
    "Whether a planet comparable to modern-day Earth could orbit this host object.\n\nFor hydrogen-burning stars this follows the classic mass/age rule-of-thumb. Brown dwarfs default to no direct Earth-like-life verdict because they are cooling substellar objects; use the current temperate-zone and moon outputs instead.",
  "Stellar Evolution":
    "When enabled, luminosity and radius evolve with age and metallicity using analytical stellar evolution tracks (Hurley, Pols & Tout 2000).\n\nWhen off, properties are derived from mass only using static scaling laws (ZAMS).",
  "Physics Mode":
    "Simple: all physical properties (radius, luminosity, temperature) are derived from mass and age using stellar scaling laws.\n\nAdvanced: specify any two of radius, luminosity, and temperature; the third is computed via Stefan-Boltzmann (L = R\u00b2 \u00d7 (T/5776)\u2074).",
  "Metallicity [Fe/H]":
    "Stellar metallicity measures heavy-element abundance relative to the Sun.\n\n[Fe/H] = log\u2081\u2080(Fe/H)_star \u2212 log\u2081\u2080(Fe/H)_sun\n\nSun = 0.0 by definition. Positive = metal-rich, negative = metal-poor.\n\nTypical range:\n\u2022 Metal-rich inner disk: +0.1 to +0.5\n\u2022 Solar neighbourhood: \u22120.2 to +0.1\n\u2022 Old thin disk: \u22120.7 to \u22120.3\n\u2022 Halo / globular clusters: \u22122.5 to \u22121.0\n\nMetallicity does not modify the Eker mass\u2013luminosity or mass\u2013radius relations (their empirical scatter already includes metallicity variation). Instead it drives downstream effects like giant planet probability.",
  "Giant Planet Probability":
    "Probability that a star hosts at least one giant planet (\u22650.3 M_Jup).\n\nMetallicity scaling P \u221d 10^(2*[Fe/H]) from Fischer & Valenti (2005, ApJ 622, 1102). Stellar mass scaling P \u221d M from Johnson et al. (2010, PASP 122, 905).\nBaseline ~7% at solar mass and metallicity (Petigura et al. 2018, AJ 155, 89).\n\nM dwarfs host fewer giant planets; A/F stars host more. A +0.3 dex increase in [Fe/H] roughly quadruples the probability.",
  "Stellar Population":
    "A broad classification based on metallicity.\n\nPopulation I (solar neighbourhood): [Fe/H] > \u22120.3 \u2014 young-to-middle-aged disk stars like the Sun\nIntermediate (old thin disk): \u22121.0 < [Fe/H] \u2264 \u22120.3\nPopulation II (metal-poor): [Fe/H] \u2264 \u22121.0 \u2014 old halo and thick-disk stars\nMetal-rich (inner disk): [Fe/H] > +0.15 \u2014 stars formed in the metal-enriched inner galaxy",
  "Activity Regime":
    "Activity regime is based on effective temperature and age bins used by flare-frequency studies.\n\nTemperature bins:\nFGK: T >= 3900 K\nEarly M: 3200 K \u2264 T < 3900 K\nLate M: T < 3200 K\n\nAge bands:\nFGK: young <0.5 Gyr, mid 0.5\u20132 Gyr, old >=2 Gyr\nEarly M: young <1 Gyr, mid 1\u20134 Gyr, old >=4 Gyr\nLate M: young <2 Gyr, mid 2\u20136 Gyr, old >=6 Gyr.",
  "Energetic Flare Rate (>1e32 erg)":
    "N32 is the expected rate of energetic flares above 10^32 erg.\n\nBaselines by regime:\nFGK old/mid/young: 0.05 / 0.25 / 1.0 per day\nEarly M old/mid/young: 0.5 / 2.0 / 8.0 per day\nLate M old/mid/young: 2.0 / 8.0 / 30.0 per day.",
  "Energetic Flare Recurrence":
    "Recurrence is computed from N32 as 1 / N32 days for flares above 10^32 erg.",
  "Solar CME Envelope (FGK)":
    "Solar observations show coronal mass ejection rates varying from about 0.5 to 6.0 per day across the solar cycle.\n\nThis envelope is shown only for FGK stars.",
  "Total Flare Rate (>1e30 erg)":
    "Expected flare rate above 10^30 erg, computed from the flare-frequency distribution (FFD) anchored to N32 and alpha.\n\nThis is a broader event count than the energetic >10^32 erg rate.",
  "Total Flare Recurrence":
    "Recurrence for flares above 10^30 erg, computed as 1 / rate and shown in hours or minutes when frequent.",
  "Associated CME Rate":
    "Expected CME rate linked to flare activity, using an energy-weighted flare-CME association probability and activity suppression at very high flare rates.",
  "Background CME Rate":
    "Expected CME rate not explicitly tied to an individual rendered flare. For FGK stars this fills the gap between the associated rate and the cycle envelope.",
  "Total CME Rate":
    "Total expected CME rate per day. For FGK stars, this follows the solar-cycle envelope and is split into associated and background channels.\n\nReference: Yashiro et al. (2006, JGR 111, A12S05).",
  "XUV Regime":
    "Extreme-UV and soft X-ray activity regime from the host-object XUV model.\n\nHydrogen-burning stars use the stellar saturated/unsaturated activity track. Brown dwarfs currently report negligible XUV in this model.",
  "XUV Luminosity":
    "High-energy host-object luminosity in the XUV band.\n\nHydrogen-burning stars report stellar coronal output. Brown dwarfs currently report negligible XUV in this model.",
  "XUV Flux at 1 AU":
    "XUV flux a body would receive at 1 AU from this host object.\n\nReported both as erg/cm²/s and relative to present-day Earth, then diluted by inverse-square distance for planets and moons.",
  "XUV Saturation Age":
    "Approximate duration of the host object's saturated high-XUV phase.\n\nLower-mass cool stars keep elevated XUV output for much longer than Sun-like stars. Brown dwarfs currently report no stellar-style saturation interval in this model.",
  "Home System Architecture":
    "Defines whether the home system uses one star or a constrained hierarchical multi-star tree.\n\nSingle keeps the classic workflow. Binary adds one bound pair. Triple and Quad use nested stable templates so later planet, moon, and canvas views can stay readable.",
  Topology:
    "Choose the home-system layout.\n\nSingle keeps one host star. Binary uses (A+B). Triple uses ((A+B)+C). Quad supports either (((A+B)+C)+D) or (A+B)+(C+D). These templates intentionally reject arbitrary non-hierarchical graphs so the engine and canvases only solve stable tree-shaped systems.",
  "Quad Layout":
    "Choose how the four-star hierarchy is arranged.\n\nChain uses (((A+B)+C)+D), adding one outer companion at a time. Paired uses (A+B)+(C+D), where two inner binaries orbit a shared outer barycentre.",
  "Hierarchy Health":
    "Live guardrail summary for constrained triple and quad layouts.\n\nGood means the outer layer is comfortably wide. Caution means the hierarchy is fairly tight. Unstable means the nesting is technically possible but likely problematic. Blocked means the outer layer is inverted and will not be saved.",
  "Default Orbit Host":
    "Choose which host frame new planets and gas giants use by default.\n\nStar frames create circumstellar (S-type) bodies around one star. Pair frames create barycentric / P-type bodies around a shared pair. Existing bodies keep their current host frame until you reassign them on later pages.",
  "Companion Star":
    "The secondary stellar component in a binary system.\n\nIts mass and name shape the binary's topology, future host-frame context, and how the system will read in topology-aware snapshots and visualisers.",
  "Tertiary Star":
    "The third stellar component in the constrained triple / quad hierarchy.\n\nIt orbits outside the inner A+B pair, adds tertiary light and stability constraints, and becomes its own selectable host frame.",
  "Quaternary Star":
    "The fourth stellar component in the constrained quad hierarchy.\n\nIn Chain mode it orbits outside the inner ((A+B)+C) hierarchy. In Paired mode it completes the C+D inner binary before both inner pairs orbit a shared outer barycentre.",
  "Binary Pair":
    "The orbit of the two stars around their shared barycentre.\n\nWider separations make the system feel like a looser companion setup; tighter separations make the pair behave more like a strongly coupled binary.",
  "Hierarchy Pair":
    "The outer orbit that binds the next stellar layer to the existing inner hierarchy.\n\nWider values reduce tertiary or quaternary perturbations; tighter values make outer-star flux and stability effects more obvious in later host-frame views.",
  "Binary Semi-Major Axis":
    "Average separation of the binary pair in AU.\n\nIncreasing it pushes the stars farther apart and makes wide-binary layouts more likely in future visualiser and orbit-host views.",
  "Binary Eccentricity":
    "How stretched the binary orbit is.\n\nHigher eccentricity means the stars spend part of the orbit much closer together and part much farther apart, which will later affect stability and flux variation.",
  "Binary Inclination":
    "Tilt of the binary orbit plane in degrees.\n\nThis is persisted now for topology completeness and later visualiser/canvas orientation, even though the current engine still solves worlds from the primary-star compatibility view.",
  "Binary Argument of Periapsis":
    "Orientation of periapsis within the binary orbital plane.\n\nThis mainly matters for later visualisation and orbital-state rendering, rather than the current primary-star compatibility calculations.",
  "Binary Mean Anomaly":
    "Current orbital phase position of the binary pair.\n\nThis is stored now so later animated or phase-aware views can place the stars consistently.",
};

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

function normalizeQuadLayoutKind(value, fallback = "chain") {
  if (value === "paired" || value === "chain") return value;
  return fallback === "paired" ? "paired" : "chain";
}

function inferQuadLayoutKind(stellarSystem) {
  if (stellarSystem?.topologyKind !== "quad") return "chain";
  const pairsById = stellarSystem?.pairs?.byId || {};
  const rootPair = pairsById?.[stellarSystem?.rootNodeId] || null;
  if (pairsById.pair_ab && pairsById.pair_cd && pairsById.pair_root) return "paired";
  if (rootPair?.childA?.kind === "pair" && rootPair?.childB?.kind === "pair") return "paired";
  return "chain";
}

function buildQuadLayoutCopy(quadLayoutKind = "chain") {
  if (quadLayoutKind === "paired") {
    return {
      topologyLabel: "Quad (Paired)",
      topologyHint:
        "Quad uses the paired (A+B)+(C+D) hierarchy. Two inner binaries orbit a shared outer barycentre while keeping the topology readable in later canvases.",
      layoutHint: "Paired: two inner binaries orbit a shared outer barycenter.",
      tertiaryPairTitle: "Second Inner Pair C+D",
      tertiaryPairAxisHint: "Average separation between Stars C and D.",
      tertiaryPairEccentricityHint: "Controls how circular or stretched the C+D orbit is.",
      quaternaryPairTitle: "Root Pair (A+B)+(C+D)",
      quaternaryPairAxisHint: "Average separation between the A+B and C+D inner binaries.",
      quaternaryPairEccentricityHint:
        "Controls how strongly the two inner binaries modulate the shared outer hierarchy.",
    };
  }
  return {
    topologyLabel: "Quad (Chain)",
    topologyHint:
      "Quad uses the constrained (((A+B)+C)+D) hierarchy. Each outer layer adds more light and tighter outer stability constraints while keeping the topology readable in later canvases.",
    layoutHint: "Chain: one outer companion is added at each layer.",
    tertiaryPairTitle: "Outer Pair (A+B)+C",
    tertiaryPairAxisHint: "Average separation between the inner pair and the tertiary star.",
    tertiaryPairEccentricityHint:
      "Controls how strongly the tertiary swings toward and away from the inner pair.",
    quaternaryPairTitle: "Outer Pair ((A+B)+C)+D",
    quaternaryPairAxisHint:
      "Average separation between the inner triple hierarchy and the fourth star.",
    quaternaryPairEccentricityHint:
      "Controls how strongly the fourth star modulates the outermost hierarchy.",
  };
}

function buildTopologyCardDescriptors(draftState) {
  const quadLayoutCopy = buildQuadLayoutCopy(draftState?.quadLayoutKind);
  return [
    {
      value: "single",
      id: "topologyCardSingle",
      title: "Single star",
      formula: "A",
      meaning: "One host star with the simplest orbit context.",
      summary: "Best when you want the classic one-star workflow.",
      detail:
        "Single star keeps the classic one-star flow. Switch to a hierarchical topology when you want manually authored multiple stars.",
    },
    {
      value: "binary",
      id: "topologyCardBinary",
      title: "Binary system",
      formula: "(A+B)",
      meaning: "Two stars with star-hosted and pair-hosted world options.",
      summary: "Adds one companion star and one pair host frame.",
      detail:
        "Binary system keeps a shared age and metallicity, adds one companion star, and saves Pair A+B for topology-aware host-frame views.",
    },
    {
      value: "triple",
      id: "topologyCardTriple",
      title: "Hierarchical triple",
      formula: "((A+B)+C)",
      meaning: "An inner binary plus one outer star in a stable hierarchy.",
      summary: "Adds tertiary light and outer stability context.",
      detail:
        "Hierarchical triple uses the constrained ((A+B)+C) hierarchy. The tertiary star adds outer light and stability limits without opening the door to non-hierarchical graphs.",
    },
    {
      value: "quad",
      id: "topologyCardQuad",
      title: "Hierarchical quad",
      formula: "(((A+B)+C)+D) or (A+B)+(C+D)",
      meaning: "Four stars in a constrained tree-shaped system.",
      summary: "Choose a chained or paired quad layout below.",
      detail: quadLayoutCopy.topologyHint,
    },
  ];
}

function buildQuadLayoutCardDescriptors() {
  const chainCopy = buildQuadLayoutCopy("chain");
  const pairedCopy = buildQuadLayoutCopy("paired");
  return [
    {
      value: "chain",
      id: "quadLayoutCardChain",
      title: "Chained quad",
      formula: "(((A+B)+C)+D)",
      meaning: "One outer companion is added at each layer.",
      summary: "Keeps one expanding hierarchy from the inner pair outward.",
      hint: chainCopy.layoutHint,
      detail: chainCopy.topologyHint,
    },
    {
      value: "paired",
      id: "quadLayoutCardPaired",
      title: "Paired quad",
      formula: "(A+B)+(C+D)",
      meaning: "Two inner binaries orbit a shared outer barycentre.",
      summary: "Keeps both inner pairs explicit and symmetric.",
      hint: pairedCopy.layoutHint,
      detail: pairedCopy.topologyHint,
    },
  ];
}

const TOPOLOGY_MAP_STATUS_RANK = Object.freeze({
  good: 0,
  caution: 1,
  unstable: 2,
  blocked: 3,
});

function buildTopologyMapLayoutKey(draftState = {}) {
  const topologyKind = ["binary", "triple", "quad"].includes(draftState?.topologyKind)
    ? draftState.topologyKind
    : "single";
  if (topologyKind !== "quad") return topologyKind;
  return normalizeQuadLayoutKind(draftState?.quadLayoutKind) === "paired"
    ? "quad-paired"
    : "quad-chain";
}

function buildTopologyMapStarMeta(starId, draftState = {}) {
  const shortLabelById = {
    star_a: "A",
    star_b: "B",
    star_c: "C",
    star_d: "D",
  };
  const nameById = {
    star_a: String(draftState?.name || "Star").trim() || "Star",
    star_b: String(draftState?.companionName || "Companion").trim() || "Companion",
    star_c: String(draftState?.tertiaryName || "Tertiary").trim() || "Tertiary",
    star_d: String(draftState?.quaternaryName || "Quaternary").trim() || "Quaternary",
  };
  return {
    title: shortLabelById[starId] || String(starId || "Star"),
    subtitle: nameById[starId] || "Star",
    accessibleLabel: `Star ${shortLabelById[starId] || starId} (${nameById[starId] || "Star"})`,
  };
}

function buildTopologyMapPairMeta(pairId, draftState = {}) {
  if (pairId === "pair_ab") {
    return {
      title: "A+B",
      subtitle: "Inner pair",
      accessibleLabel: "Pair A+B",
    };
  }
  if (pairId === "pair_abc") {
    return {
      title: "(A+B)+C",
      subtitle: "Outer pair",
      accessibleLabel: "Pair (A+B)+C",
    };
  }
  if (pairId === "pair_abcd") {
    return {
      title: "((A+B)+C)+D",
      subtitle: "Root pair",
      accessibleLabel: "Pair ((A+B)+C)+D",
    };
  }
  if (pairId === "pair_cd") {
    return {
      title: "C+D",
      subtitle: "Second inner pair",
      accessibleLabel: "Pair C+D",
    };
  }
  if (pairId === "pair_root") {
    return normalizeQuadLayoutKind(draftState?.quadLayoutKind) === "paired"
      ? {
          title: "Root",
          subtitle: "(A+B)+(C+D)",
          accessibleLabel: "Root pair (A+B)+(C+D)",
        }
      : {
          title: "Root",
          subtitle: "Outer hierarchy",
          accessibleLabel: "Root pair",
        };
  }
  return {
    title: String(pairId || "Pair"),
    subtitle: "Pair host",
    accessibleLabel: String(pairId || "Pair"),
  };
}

function buildTopologyMapLayoutDefinition(draftState = {}) {
  const layoutKey = buildTopologyMapLayoutKey(draftState);
  switch (layoutKey) {
    case "binary":
      return {
        layoutKey,
        minHeightPx: 230,
        nodes: [
          { id: "pair_ab", kind: "pair", x: 50, y: 28 },
          { id: "star_a", kind: "star", x: 32, y: 74 },
          { id: "star_b", kind: "star", x: 68, y: 74 },
        ],
        edges: [
          { id: "pair_ab:star_a", from: "pair_ab", to: "star_a" },
          { id: "pair_ab:star_b", from: "pair_ab", to: "star_b" },
        ],
      };
    case "triple":
      return {
        layoutKey,
        minHeightPx: 270,
        nodes: [
          { id: "pair_abc", kind: "pair", x: 52, y: 18 },
          { id: "pair_ab", kind: "pair", x: 34, y: 50 },
          { id: "star_c", kind: "star", x: 74, y: 50 },
          { id: "star_a", kind: "star", x: 22, y: 82 },
          { id: "star_b", kind: "star", x: 46, y: 82 },
        ],
        edges: [
          { id: "pair_abc:pair_ab", from: "pair_abc", to: "pair_ab" },
          { id: "pair_abc:star_c", from: "pair_abc", to: "star_c" },
          { id: "pair_ab:star_a", from: "pair_ab", to: "star_a" },
          { id: "pair_ab:star_b", from: "pair_ab", to: "star_b" },
        ],
      };
    case "quad-chain":
      return {
        layoutKey,
        minHeightPx: 300,
        nodes: [
          { id: "pair_abcd", kind: "pair", x: 52, y: 16 },
          { id: "pair_abc", kind: "pair", x: 34, y: 42 },
          { id: "star_d", kind: "star", x: 78, y: 42 },
          { id: "pair_ab", kind: "pair", x: 24, y: 70 },
          { id: "star_c", kind: "star", x: 48, y: 70 },
          { id: "star_a", kind: "star", x: 16, y: 92 },
          { id: "star_b", kind: "star", x: 32, y: 92 },
        ],
        edges: [
          { id: "pair_abcd:pair_abc", from: "pair_abcd", to: "pair_abc" },
          { id: "pair_abcd:star_d", from: "pair_abcd", to: "star_d" },
          { id: "pair_abc:pair_ab", from: "pair_abc", to: "pair_ab" },
          { id: "pair_abc:star_c", from: "pair_abc", to: "star_c" },
          { id: "pair_ab:star_a", from: "pair_ab", to: "star_a" },
          { id: "pair_ab:star_b", from: "pair_ab", to: "star_b" },
        ],
      };
    case "quad-paired":
      return {
        layoutKey,
        minHeightPx: 300,
        nodes: [
          { id: "pair_root", kind: "pair", x: 50, y: 18 },
          { id: "pair_ab", kind: "pair", x: 30, y: 56 },
          { id: "pair_cd", kind: "pair", x: 70, y: 56 },
          { id: "star_a", kind: "star", x: 18, y: 90 },
          { id: "star_b", kind: "star", x: 42, y: 90 },
          { id: "star_c", kind: "star", x: 58, y: 90 },
          { id: "star_d", kind: "star", x: 82, y: 90 },
        ],
        edges: [
          { id: "pair_root:pair_ab", from: "pair_root", to: "pair_ab" },
          { id: "pair_root:pair_cd", from: "pair_root", to: "pair_cd" },
          { id: "pair_ab:star_a", from: "pair_ab", to: "star_a" },
          { id: "pair_ab:star_b", from: "pair_ab", to: "star_b" },
          { id: "pair_cd:star_c", from: "pair_cd", to: "star_c" },
          { id: "pair_cd:star_d", from: "pair_cd", to: "star_d" },
        ],
      };
    case "single":
    default:
      return {
        layoutKey: "single",
        minHeightPx: 190,
        nodes: [{ id: "star_a", kind: "star", x: 50, y: 52 }],
        edges: [],
      };
  }
}

function buildTopologyMapPairStatusLookup(draftState = {}, topologyHealth = {}) {
  const layers = Array.isArray(topologyHealth?.layers) ? topologyHealth.layers : [];
  const layerById = new Map(layers.map((layer) => [layer.id, layer]));
  const pairStatusLookup = new Map();
  const edgeStatusLookup = new Map();
  const setPairStatus = (pairId, layer) => {
    if (pairId && layer) pairStatusLookup.set(pairId, layer);
  };
  const setEdgeStatus = (edgeId, layer) => {
    if (edgeId && layer) edgeStatusLookup.set(edgeId, layer);
  };

  if (draftState?.topologyKind === "triple") {
    const layer = layerById.get("pair_abc");
    setPairStatus("pair_abc", layer);
    setEdgeStatus("pair_abc:pair_ab", layer);
    setEdgeStatus("pair_abc:star_c", layer);
  } else if (draftState?.topologyKind === "quad") {
    if (normalizeQuadLayoutKind(draftState?.quadLayoutKind) === "paired") {
      const layerAb = layerById.get("pair_root_ab");
      const layerCd = layerById.get("pair_root_cd");
      setPairStatus("pair_ab", layerAb);
      setPairStatus("pair_cd", layerCd);
      setEdgeStatus("pair_root:pair_ab", layerAb);
      setEdgeStatus("pair_root:pair_cd", layerCd);
      const rootLayer =
        [layerAb, layerCd]
          .filter(Boolean)
          .sort(
            (left, right) =>
              (TOPOLOGY_MAP_STATUS_RANK[right?.status] ?? 0) -
              (TOPOLOGY_MAP_STATUS_RANK[left?.status] ?? 0),
          )[0] || null;
      setPairStatus("pair_root", rootLayer);
    } else {
      const layerAbc = layerById.get("pair_abc");
      const layerAbcd = layerById.get("pair_abcd");
      setPairStatus("pair_abc", layerAbc);
      setPairStatus("pair_abcd", layerAbcd);
      setEdgeStatus("pair_abc:pair_ab", layerAbc);
      setEdgeStatus("pair_abc:star_c", layerAbc);
      setEdgeStatus("pair_abcd:pair_abc", layerAbcd);
      setEdgeStatus("pair_abcd:star_d", layerAbcd);
    }
  }

  return { pairStatusLookup, edgeStatusLookup };
}

function buildTopologyHealthChipLabel(layer, draftState = {}) {
  if (!layer) return "Hierarchy";
  if (
    draftState?.topologyKind === "quad" &&
    normalizeQuadLayoutKind(draftState?.quadLayoutKind) === "paired"
  ) {
    if (layer.id === "pair_root_ab") return "Root vs A+B";
    if (layer.id === "pair_root_cd") return "Root vs C+D";
  }
  return layer.label || "Hierarchy layer";
}

function buildTopologyNodeBadgeRow({ selected = false, defaultHost = false } = {}) {
  if (!selected && !defaultHost) return null;
  return createElement("span", { className: "star-topology-node__badge-row" }, [
    selected
      ? createElement("span", {
          className: "star-topology-node__editor-badge",
          text: "Editing",
        })
      : null,
    defaultHost
      ? createElement("span", {
          className: "star-topology-node__host-badge",
          text: "Default host",
        })
      : null,
  ]);
}

const TOPOLOGY_MAP_LEGEND_ROWS = [
  {
    id: "type",
    label: "Node type",
    tip: "Node type explains what the host frame is. Star nodes are S-type hosts around one star. Pair nodes are P-type hosts around a shared barycentre.",
    items: [
      {
        id: "star",
        label: "Star host",
        detail: "S-type",
        tokenKind: "star",
        tokenText: "A",
        tip: "Star host: a single-star host frame. If you choose Star A, B, C, or D as the default orbit host, newly added planets, gas giants, and debris will orbit that individual star.",
      },
      {
        id: "pair",
        label: "Pair host",
        detail: "P-type",
        tokenKind: "pair",
        tokenText: "A+B",
        tip: "Pair host: a barycentric host frame for a bound stellar pair. If you choose A+B, C+D, or the root pair as the default orbit host, newly added bodies orbit the pair's shared barycentre rather than a single star.",
      },
    ],
  },
  {
    id: "state",
    label: "State",
    tip: "State markers show which target is currently active for editing and which host frame is used by default for new bodies. Only one node is marked as Editing at a time.",
    items: [
      {
        id: "editing",
        label: "Editing",
        detail: "editor open below",
        badgeKind: "editing",
        tip: "Editing: the node's editor panel is currently visible below. Only one node is marked as the active editing focus at a time.",
      },
      {
        id: "default",
        label: "Outline",
        detail: "default orbit host",
        tokenKind: "star",
        tokenText: "A",
        defaultHost: true,
        tip: "Outline: the default orbit host for newly added planets, gas giants, and debris. It highlights where new bodies start by default and does not move any existing bodies already in the system.",
      },
    ],
  },
];

function createTopologyLegendToken(item) {
  if (item.badgeKind === "editing") {
    return createElement("span", { className: "star-topology-map__legend-badge" }, [
      createElement("span", {
        className: "star-topology-node__editor-badge",
        text: "Editing",
      }),
    ]);
  }

  return createElement(
    "span",
    {
      className: `star-topology-map__legend-token star-topology-map__legend-token--${item.tokenKind || "star"}`,
      attrs: {
        "aria-hidden": "true",
        "data-default-host": item.defaultHost ? "true" : "false",
      },
    },
    item.tokenText,
  );
}

function createTopologyLegendItem(item) {
  return createElement(
    "span",
    {
      className: "star-topology-map__legend-item",
      attrs: {
        tabindex: "0",
        role: "note",
        "data-tip": item.tip,
      },
    },
    [
      createTopologyLegendToken(item),
      createElement("span", { className: "star-topology-map__legend-copy" }, [
        createElement("span", {
          className: "star-topology-map__legend-label",
          text: item.label,
        }),
        createElement("span", {
          className: "star-topology-map__legend-detail",
          text: item.detail,
        }),
      ]),
    ],
  );
}

function createTopologyLegendRow(row) {
  return createElement("div", { className: "star-topology-map__legend-row" }, [
    createElement("span", { className: "star-topology-map__legend-heading" }, [
      createElement("span", { text: row.label }),
      tipIconNode(row.tip),
    ]),
    createElement(
      "div",
      { className: "star-topology-map__legend-items" },
      row.items.map((item) => createTopologyLegendItem(item)),
    ),
  ]);
}

function buildTopologyMapModel({
  draftState = {},
  topologyHealth = {},
  selectedEditorTargetId = "star_a",
  defaultHostFrameId = "star_a",
} = {}) {
  const layoutDefinition = buildTopologyMapLayoutDefinition(draftState);
  const selectedNodeId = String(selectedEditorTargetId || "");
  const { pairStatusLookup, edgeStatusLookup } = buildTopologyMapPairStatusLookup(
    draftState,
    topologyHealth,
  );
  const nodes = layoutDefinition.nodes.map((node) => {
    const meta =
      node.kind === "star"
        ? buildTopologyMapStarMeta(node.id, draftState)
        : buildTopologyMapPairMeta(node.id, draftState);
    const pairLayer = node.kind === "pair" ? pairStatusLookup.get(node.id) || null : null;
    const selected = selectedNodeId === node.id;
    const defaultHost = defaultHostFrameId === node.id;
    const extraBits = [
      selected ? "currently selected for editing" : "",
      defaultHost ? "current default orbit host" : "",
      pairLayer?.statusLabel ? `guardrail ${pairLayer.statusLabel}` : "",
    ].filter(Boolean);
    return {
      ...node,
      ...meta,
      selected,
      defaultHost,
      status: pairLayer?.status || "",
      statusLabel: pairLayer?.statusLabel || "",
      ariaLabel: `${meta.accessibleLabel}${extraBits.length ? `. ${extraBits.join(". ")}.` : ""}`,
    };
  });
  const nodeIndex = new Map(nodes.map((node) => [node.id, node]));
  const edges = layoutDefinition.edges.map((edge) => ({
    ...edge,
    fromNode: nodeIndex.get(edge.from),
    toNode: nodeIndex.get(edge.to),
    status: edgeStatusLookup.get(edge.id)?.status || "",
  }));
  const chips = [
    {
      id: "overall",
      label: "Hierarchy",
      value: topologyHealth?.statusLabel || "Good",
      status: topologyHealth?.status || "good",
      title: topologyHealth?.headline || "Hierarchy health",
    },
    ...(Array.isArray(topologyHealth?.layers) ? topologyHealth.layers : []).map((layer) => ({
      id: layer.id,
      label: buildTopologyHealthChipLabel(layer, draftState),
      value: layer.statusLabel,
      status: layer.status,
      title: `${layer.headline}. ${layer.summary}`.trim(),
    })),
  ];
  const currentTargetMeta = selectedNodeId
    ? String(selectedNodeId).startsWith("pair_")
      ? buildTopologyMapPairMeta(selectedNodeId, draftState)
      : buildTopologyMapStarMeta(selectedNodeId, draftState)
    : null;
  const defaultHostMeta =
    nodeIndex.get(defaultHostFrameId) ||
    nodes.find((node) => node.id === defaultHostFrameId) ||
    null;
  const summaryText = [
    `Topology map for ${buildTopologyMapLayoutKey(draftState).replace("-", " ")} layout.`,
    currentTargetMeta ? `Current editor focus ${currentTargetMeta.accessibleLabel}.` : "",
    defaultHostMeta ? `Default orbit host ${defaultHostMeta.accessibleLabel}.` : "",
    "Only one node is marked as the current editing focus at a time.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    layoutKey: layoutDefinition.layoutKey,
    minHeightPx: layoutDefinition.minHeightPx,
    nodes,
    edges,
    chips,
    summaryText,
  };
}

export function initStarPage(mountEl, options = {}) {
  const defaults = { name: "Star", massMsol: 0.8653, ageGyr: 6.254 }; // workbook defaults
  const guidedRoute = options?.routeContext?.guided || null;
  const world = loadWorld();
  const primaryStar = getProjectedPrimaryStar(world);
  const stellarSystem = getStellarSystem(world);
  const quadLayoutKind = inferQuadLayoutKind(stellarSystem);
  const companionStar =
    stellarSystem?.stars?.byId?.star_b ||
    stellarSystem?.stars?.byId?.[stellarSystem?.stars?.order?.[1] || ""] ||
    null;
  const binaryPair =
    stellarSystem?.pairs?.byId?.pair_ab ||
    stellarSystem?.pairs?.byId?.[stellarSystem?.pairs?.order?.[0] || ""] ||
    null;
  const tertiaryStar =
    stellarSystem?.stars?.byId?.star_c ||
    stellarSystem?.stars?.byId?.[stellarSystem?.stars?.order?.[2] || ""] ||
    null;
  const quaternaryStar =
    stellarSystem?.stars?.byId?.star_d ||
    stellarSystem?.stars?.byId?.[stellarSystem?.stars?.order?.[3] || ""] ||
    null;
  const tertiaryPair =
    (quadLayoutKind === "paired"
      ? stellarSystem?.pairs?.byId?.pair_cd
      : stellarSystem?.pairs?.byId?.pair_abc) ||
    stellarSystem?.pairs?.byId?.[stellarSystem?.pairs?.order?.[1] || ""] ||
    null;
  const quaternaryPair =
    (quadLayoutKind === "paired"
      ? stellarSystem?.pairs?.byId?.pair_root
      : stellarSystem?.pairs?.byId?.pair_abcd) ||
    stellarSystem?.pairs?.byId?.[stellarSystem?.pairs?.order?.[2] || ""] ||
    null;
  const state = {
    name:
      typeof primaryStar?.name === "string" && primaryStar.name.trim()
        ? primaryStar.name.trim()
        : defaults.name,
    massMsol: Number.isFinite(primaryStar?.massMsol)
      ? Number(primaryStar.massMsol)
      : defaults.massMsol,
    ageGyr: Number.isFinite(primaryStar?.ageGyr) ? Number(primaryStar.ageGyr) : defaults.ageGyr,
    metallicityFeH: Number.isFinite(primaryStar?.metallicityFeH)
      ? Number(primaryStar.metallicityFeH)
      : 0.0,
    radiusRsolOverride:
      Number.isFinite(primaryStar?.radiusRsolOverride) && primaryStar.radiusRsolOverride > 0
        ? Number(primaryStar.radiusRsolOverride)
        : null,
    luminosityLsolOverride:
      Number.isFinite(primaryStar?.luminosityLsolOverride) && primaryStar.luminosityLsolOverride > 0
        ? Number(primaryStar.luminosityLsolOverride)
        : null,
    tempKOverride:
      Number.isFinite(primaryStar?.tempKOverride) && primaryStar.tempKOverride > 0
        ? Number(primaryStar.tempKOverride)
        : null,
    physicsMode:
      primaryStar?.physicsMode === "advanced" || primaryStar?.physicsMode === "simple"
        ? primaryStar.physicsMode
        : "simple",
    advancedDerivationMode: ["rl", "rt", "lt"].includes(primaryStar?.advancedDerivationMode)
      ? primaryStar.advancedDerivationMode
      : "rl",
    evolutionMode: primaryStar?.evolutionMode === "evolved" ? "evolved" : "zams",
    activityModelVersion: primaryStar?.activityModelVersion === "v1" ? "v1" : "v2",
    topologyKind: ["binary", "triple", "quad"].includes(stellarSystem?.topologyKind)
      ? stellarSystem.topologyKind
      : "single",
    quadLayoutKind,
    defaultHostFrameId:
      typeof stellarSystem?.defaultHostFrameId === "string" && stellarSystem.defaultHostFrameId
        ? stellarSystem.defaultHostFrameId
        : "star_a",
    companionName:
      typeof companionStar?.name === "string" && companionStar.name.trim()
        ? companionStar.name.trim()
        : "Companion",
    companionMassMsol:
      Number.isFinite(companionStar?.massMsol) && Number(companionStar.massMsol) > 0
        ? Number(companionStar.massMsol)
        : 0.72,
    companionRadiusRsolOverride:
      Number.isFinite(companionStar?.radiusRsolOverride) && companionStar.radiusRsolOverride > 0
        ? Number(companionStar.radiusRsolOverride)
        : null,
    companionLuminosityLsolOverride:
      Number.isFinite(companionStar?.luminosityLsolOverride) &&
      companionStar.luminosityLsolOverride > 0
        ? Number(companionStar.luminosityLsolOverride)
        : null,
    companionTempKOverride:
      Number.isFinite(companionStar?.tempKOverride) && companionStar.tempKOverride > 0
        ? Number(companionStar.tempKOverride)
        : null,
    companionPhysicsMode:
      companionStar?.physicsMode === "advanced" || companionStar?.physicsMode === "simple"
        ? companionStar.physicsMode
        : "simple",
    companionAdvancedDerivationMode: ["rl", "rt", "lt"].includes(
      companionStar?.advancedDerivationMode,
    )
      ? companionStar.advancedDerivationMode
      : "rl",
    binarySemiMajorAxisAu:
      Number.isFinite(binaryPair?.semiMajorAxisAu) && Number(binaryPair.semiMajorAxisAu) > 0
        ? Number(binaryPair.semiMajorAxisAu)
        : 24,
    binaryEccentricity:
      Number.isFinite(binaryPair?.eccentricity) && Number(binaryPair.eccentricity) >= 0
        ? Number(binaryPair.eccentricity)
        : 0.2,
    binaryInclinationDeg: Number.isFinite(binaryPair?.inclinationDeg)
      ? Number(binaryPair.inclinationDeg)
      : 0,
    binaryArgPeriapsisDeg: Number.isFinite(binaryPair?.argPeriapsisDeg)
      ? Number(binaryPair.argPeriapsisDeg)
      : 0,
    binaryMeanAnomalyDeg: Number.isFinite(binaryPair?.meanAnomalyDeg)
      ? Number(binaryPair.meanAnomalyDeg)
      : 0,
    tertiaryName:
      typeof tertiaryStar?.name === "string" && tertiaryStar.name.trim()
        ? tertiaryStar.name.trim()
        : "Tertiary",
    tertiaryMassMsol:
      Number.isFinite(tertiaryStar?.massMsol) && Number(tertiaryStar.massMsol) > 0
        ? Number(tertiaryStar.massMsol)
        : 0.54,
    tertiaryRadiusRsolOverride:
      Number.isFinite(tertiaryStar?.radiusRsolOverride) && tertiaryStar.radiusRsolOverride > 0
        ? Number(tertiaryStar.radiusRsolOverride)
        : null,
    tertiaryLuminosityLsolOverride:
      Number.isFinite(tertiaryStar?.luminosityLsolOverride) &&
      tertiaryStar.luminosityLsolOverride > 0
        ? Number(tertiaryStar.luminosityLsolOverride)
        : null,
    tertiaryTempKOverride:
      Number.isFinite(tertiaryStar?.tempKOverride) && tertiaryStar.tempKOverride > 0
        ? Number(tertiaryStar.tempKOverride)
        : null,
    tertiaryPhysicsMode:
      tertiaryStar?.physicsMode === "advanced" || tertiaryStar?.physicsMode === "simple"
        ? tertiaryStar.physicsMode
        : "simple",
    tertiaryAdvancedDerivationMode: ["rl", "rt", "lt"].includes(
      tertiaryStar?.advancedDerivationMode,
    )
      ? tertiaryStar.advancedDerivationMode
      : "rl",
    tripleOuterSemiMajorAxisAu:
      Number.isFinite(tertiaryPair?.semiMajorAxisAu) && Number(tertiaryPair.semiMajorAxisAu) > 0
        ? Number(tertiaryPair.semiMajorAxisAu)
        : 180,
    tripleOuterEccentricity:
      Number.isFinite(tertiaryPair?.eccentricity) && Number(tertiaryPair.eccentricity) >= 0
        ? Number(tertiaryPair.eccentricity)
        : 0.18,
    tripleOuterInclinationDeg: Number.isFinite(tertiaryPair?.inclinationDeg)
      ? Number(tertiaryPair.inclinationDeg)
      : 0,
    tripleOuterArgPeriapsisDeg: Number.isFinite(tertiaryPair?.argPeriapsisDeg)
      ? Number(tertiaryPair.argPeriapsisDeg)
      : 0,
    tripleOuterMeanAnomalyDeg: Number.isFinite(tertiaryPair?.meanAnomalyDeg)
      ? Number(tertiaryPair.meanAnomalyDeg)
      : 0,
    quaternaryName:
      typeof quaternaryStar?.name === "string" && quaternaryStar.name.trim()
        ? quaternaryStar.name.trim()
        : "Quaternary",
    quaternaryMassMsol:
      Number.isFinite(quaternaryStar?.massMsol) && Number(quaternaryStar.massMsol) > 0
        ? Number(quaternaryStar.massMsol)
        : 0.33,
    quaternaryRadiusRsolOverride:
      Number.isFinite(quaternaryStar?.radiusRsolOverride) && quaternaryStar.radiusRsolOverride > 0
        ? Number(quaternaryStar.radiusRsolOverride)
        : null,
    quaternaryLuminosityLsolOverride:
      Number.isFinite(quaternaryStar?.luminosityLsolOverride) &&
      quaternaryStar.luminosityLsolOverride > 0
        ? Number(quaternaryStar.luminosityLsolOverride)
        : null,
    quaternaryTempKOverride:
      Number.isFinite(quaternaryStar?.tempKOverride) && quaternaryStar.tempKOverride > 0
        ? Number(quaternaryStar.tempKOverride)
        : null,
    quaternaryPhysicsMode:
      quaternaryStar?.physicsMode === "advanced" || quaternaryStar?.physicsMode === "simple"
        ? quaternaryStar.physicsMode
        : "simple",
    quaternaryAdvancedDerivationMode: ["rl", "rt", "lt"].includes(
      quaternaryStar?.advancedDerivationMode,
    )
      ? quaternaryStar.advancedDerivationMode
      : "rl",
    quadOuterSemiMajorAxisAu:
      Number.isFinite(quaternaryPair?.semiMajorAxisAu) && Number(quaternaryPair.semiMajorAxisAu) > 0
        ? Number(quaternaryPair.semiMajorAxisAu)
        : 640,
    quadOuterEccentricity:
      Number.isFinite(quaternaryPair?.eccentricity) && Number(quaternaryPair.eccentricity) >= 0
        ? Number(quaternaryPair.eccentricity)
        : 0.24,
    quadOuterInclinationDeg: Number.isFinite(quaternaryPair?.inclinationDeg)
      ? Number(quaternaryPair.inclinationDeg)
      : 0,
    quadOuterArgPeriapsisDeg: Number.isFinite(quaternaryPair?.argPeriapsisDeg)
      ? Number(quaternaryPair.argPeriapsisDeg)
      : 0,
    quadOuterMeanAnomalyDeg: Number.isFinite(quaternaryPair?.meanAnomalyDeg)
      ? Number(quaternaryPair.meanAnomalyDeg)
      : 0,
  };

  const STAR_EDITOR_FIELD_MAP = {
    star_a: {
      title: "Primary Star A",
      role: "Primary star",
      nameField: "name",
      massField: "massMsol",
      radiusField: "radiusRsolOverride",
      luminosityField: "luminosityLsolOverride",
      tempField: "tempKOverride",
      physicsModeField: "physicsMode",
      derivationField: "advancedDerivationMode",
      defaultName: defaults.name,
      defaultMass: defaults.massMsol,
    },
    star_b: {
      title: "Star B",
      role: "Companion star",
      nameField: "companionName",
      massField: "companionMassMsol",
      radiusField: "companionRadiusRsolOverride",
      luminosityField: "companionLuminosityLsolOverride",
      tempField: "companionTempKOverride",
      physicsModeField: "companionPhysicsMode",
      derivationField: "companionAdvancedDerivationMode",
      defaultName: "Companion",
      defaultMass: 0.72,
    },
    star_c: {
      title: "Star C",
      role: "Tertiary star",
      nameField: "tertiaryName",
      massField: "tertiaryMassMsol",
      radiusField: "tertiaryRadiusRsolOverride",
      luminosityField: "tertiaryLuminosityLsolOverride",
      tempField: "tertiaryTempKOverride",
      physicsModeField: "tertiaryPhysicsMode",
      derivationField: "tertiaryAdvancedDerivationMode",
      defaultName: "Tertiary",
      defaultMass: 0.54,
    },
    star_d: {
      title: "Star D",
      role: "Quaternary star",
      nameField: "quaternaryName",
      massField: "quaternaryMassMsol",
      radiusField: "quaternaryRadiusRsolOverride",
      luminosityField: "quaternaryLuminosityLsolOverride",
      tempField: "quaternaryTempKOverride",
      physicsModeField: "quaternaryPhysicsMode",
      derivationField: "quaternaryAdvancedDerivationMode",
      defaultName: "Quaternary",
      defaultMass: 0.33,
    },
  };

  function getStarEditorFieldConfig(starId = "star_a") {
    return STAR_EDITOR_FIELD_MAP[starId] || STAR_EDITOR_FIELD_MAP.star_a;
  }

  function getStarDraftState(starId = "star_a", draftState = state) {
    const config = getStarEditorFieldConfig(starId);
    return {
      id: starId,
      title: config.title,
      role: config.role,
      name:
        String(draftState?.[config.nameField] || config.defaultName).trim() || config.defaultName,
      massMsol: Number(draftState?.[config.massField] ?? config.defaultMass),
      physicsMode: draftState?.[config.physicsModeField] === "advanced" ? "advanced" : "simple",
      advancedDerivationMode: ["rl", "rt", "lt"].includes(draftState?.[config.derivationField])
        ? draftState[config.derivationField]
        : "rl",
      radiusRsolOverride:
        Number.isFinite(draftState?.[config.radiusField]) &&
        Number(draftState[config.radiusField]) > 0
          ? Number(draftState[config.radiusField])
          : null,
      luminosityLsolOverride:
        Number.isFinite(draftState?.[config.luminosityField]) &&
        Number(draftState[config.luminosityField]) > 0
          ? Number(draftState[config.luminosityField])
          : null,
      tempKOverride:
        Number.isFinite(draftState?.[config.tempField]) && Number(draftState[config.tempField]) > 0
          ? Number(draftState[config.tempField])
          : null,
      ageGyr: Number(draftState?.ageGyr ?? defaults.ageGyr),
      metallicityFeH: Number(draftState?.metallicityFeH ?? 0) || 0,
      evolutionMode: draftState?.evolutionMode === "evolved" ? "evolved" : "zams",
      activityModelVersion: draftState?.activityModelVersion === "v1" ? "v1" : "v2",
    };
  }

  function assignStarDraftState(starId = "star_a", patch = {}, draftState = state) {
    const config = getStarEditorFieldConfig(starId);
    if (Object.hasOwn(patch, "name")) draftState[config.nameField] = patch.name;
    if (Object.hasOwn(patch, "massMsol")) draftState[config.massField] = patch.massMsol;
    if (Object.hasOwn(patch, "physicsMode"))
      draftState[config.physicsModeField] = patch.physicsMode;
    if (Object.hasOwn(patch, "advancedDerivationMode"))
      draftState[config.derivationField] = patch.advancedDerivationMode;
    if (Object.hasOwn(patch, "radiusRsolOverride"))
      draftState[config.radiusField] = patch.radiusRsolOverride;
    if (Object.hasOwn(patch, "luminosityLsolOverride"))
      draftState[config.luminosityField] = patch.luminosityLsolOverride;
    if (Object.hasOwn(patch, "tempKOverride")) draftState[config.tempField] = patch.tempKOverride;
    return draftState;
  }

  function getFocusedStarEditorId(draftState = state) {
    return normalizeSelectedStarEditorId(editorUiState?.rememberedStarEditorId, draftState);
  }

  function normalizeTopologyHostFrameId(
    value,
    topologyKind = state.topologyKind,
    quadLayoutKind = state.quadLayoutKind,
  ) {
    const normalizedQuadLayoutKind = normalizeQuadLayoutKind(quadLayoutKind);
    const validHostFrameIds =
      topologyKind === "quad"
        ? normalizedQuadLayoutKind === "paired"
          ? ["star_a", "star_b", "star_c", "star_d", "pair_ab", "pair_cd", "pair_root"]
          : ["star_a", "star_b", "star_c", "star_d", "pair_ab", "pair_abc", "pair_abcd"]
        : topologyKind === "triple"
          ? ["star_a", "star_b", "star_c", "pair_ab", "pair_abc"]
          : topologyKind === "binary"
            ? ["star_a", "star_b", "pair_ab"]
            : ["star_a"];
    let normalizedValue = String(value || "");
    if (topologyKind === "quad" && !validHostFrameIds.includes(normalizedValue)) {
      if (normalizedQuadLayoutKind === "paired") {
        if (normalizedValue === "pair_abcd" || normalizedValue === "pair_abc") {
          normalizedValue = "pair_root";
        }
      } else if (normalizedValue === "pair_root" || normalizedValue === "pair_cd") {
        normalizedValue = "pair_abcd";
      }
    }
    return validHostFrameIds.includes(normalizedValue) ? normalizedValue : validHostFrameIds[0];
  }

  function listAvailableStarEditorIds(draftState = state) {
    const ids = ["star_a"];
    if (draftState.topologyKind !== "single") ids.push("star_b");
    if (draftState.topologyKind === "triple" || draftState.topologyKind === "quad")
      ids.push("star_c");
    if (draftState.topologyKind === "quad") ids.push("star_d");
    return ids;
  }

  function listAvailablePairEditorIds(draftState = state) {
    if (draftState.topologyKind === "quad") {
      return normalizeQuadLayoutKind(draftState.quadLayoutKind) === "paired"
        ? ["pair_ab", "pair_cd", "pair_root"]
        : ["pair_ab", "pair_abc", "pair_abcd"];
    }
    if (draftState.topologyKind === "triple") return ["pair_ab", "pair_abc"];
    if (draftState.topologyKind === "binary") return ["pair_ab"];
    return [];
  }

  function getEditorTargetKind(targetId) {
    return String(targetId || "").startsWith("pair_") ? "pair" : "star";
  }

  function suggestStarEditorId(draftState = state) {
    const available = listAvailableStarEditorIds(draftState);
    return available[available.length - 1] || "star_a";
  }

  function suggestPairEditorId(draftState = state) {
    const available = listAvailablePairEditorIds(draftState);
    return available.length ? available[available.length - 1] : null;
  }

  function normalizeSelectedStarEditorId(
    value,
    draftState = state,
    { preferSuggested = false } = {},
  ) {
    const available = listAvailableStarEditorIds(draftState);
    if (!available.length) return "star_a";
    const normalizedValue = String(value || "");
    if (!preferSuggested && available.includes(normalizedValue)) return normalizedValue;
    const suggested = suggestStarEditorId(draftState);
    return available.includes(suggested) ? suggested : available[0];
  }

  function normalizeSelectedPairEditorId(
    value,
    draftState = state,
    { preferSuggested = false } = {},
  ) {
    const available = listAvailablePairEditorIds(draftState);
    if (!available.length) return null;
    const normalizedValue = String(value || "");
    if (!preferSuggested && available.includes(normalizedValue)) return normalizedValue;
    const suggested = suggestPairEditorId(draftState);
    return available.includes(suggested) ? suggested : available[0];
  }

  function buildEditorTopologySignature(draftState = state) {
    return `${draftState.topologyKind}:${normalizeQuadLayoutKind(draftState.quadLayoutKind)}`;
  }

  function normalizeInspectorMode(value, draftState = state) {
    return value === "pair" && listAvailablePairEditorIds(draftState).length ? "pair" : "star";
  }

  function pickEditorTargetForMode(
    mode,
    draftState = state,
    { rememberedStarEditorId = null, rememberedPairEditorId = null, preferSuggested = false } = {},
  ) {
    const normalizedMode = normalizeInspectorMode(mode, draftState);
    if (normalizedMode === "pair") {
      return normalizeSelectedPairEditorId(rememberedPairEditorId, draftState, {
        preferSuggested,
      });
    }
    return normalizeSelectedStarEditorId(rememberedStarEditorId, draftState, {
      preferSuggested,
    });
  }

  function normalizeSelectedEditorTargetId(
    value,
    draftState = state,
    {
      preferredMode = "star",
      rememberedStarEditorId = null,
      rememberedPairEditorId = null,
      preferSuggested = false,
    } = {},
  ) {
    const normalizedValue = String(value || "");
    const targetKind = getEditorTargetKind(normalizedValue);
    const normalizedPreferredMode = normalizeInspectorMode(preferredMode, draftState);
    const availableTargets =
      targetKind === "pair"
        ? listAvailablePairEditorIds(draftState)
        : listAvailableStarEditorIds(draftState);
    if (!preferSuggested && availableTargets.includes(normalizedValue)) {
      if (
        targetKind === normalizedPreferredMode ||
        (normalizedPreferredMode === "pair" && !listAvailablePairEditorIds(draftState).length)
      ) {
        return normalizedValue;
      }
    }

    const preferredTarget = pickEditorTargetForMode(normalizedPreferredMode, draftState, {
      rememberedStarEditorId,
      rememberedPairEditorId,
      preferSuggested,
    });
    if (preferredTarget) return preferredTarget;

    return (
      normalizeSelectedStarEditorId(rememberedStarEditorId, draftState, { preferSuggested }) ||
      normalizeSelectedPairEditorId(rememberedPairEditorId, draftState, { preferSuggested }) ||
      "star_a"
    );
  }

  function buildStarEditorLabel(starId, draftState = state) {
    if (starId === "star_a") return `Star A (${draftState.name})`;
    if (starId === "star_b") return `Star B (${draftState.companionName})`;
    if (starId === "star_c") return `Star C (${draftState.tertiaryName})`;
    if (starId === "star_d") return `Star D (${draftState.quaternaryName})`;
    return String(starId || "Star");
  }

  function buildPairEditorLabel(pairId, draftState = state) {
    if (pairId === "pair_ab") return "Pair A+B";
    if (pairId === "pair_abc") return "Pair (A+B)+C";
    if (pairId === "pair_abcd") return "Pair ((A+B)+C)+D";
    if (pairId === "pair_cd") return "Pair C+D";
    if (pairId === "pair_root") {
      return normalizeQuadLayoutKind(draftState.quadLayoutKind) === "paired"
        ? "Root Pair (A+B)+(C+D)"
        : "Root Pair";
    }
    return String(pairId || "Pair");
  }

  function getPairOrbitDraftSummary(pairId, draftState = state) {
    if (pairId === "pair_ab") {
      return {
        semiMajorAxisAu: Number(draftState.binarySemiMajorAxisAu),
        eccentricity: Number(draftState.binaryEccentricity),
      };
    }
    if (pairId === "pair_abc" || pairId === "pair_cd") {
      return {
        semiMajorAxisAu: Number(draftState.tripleOuterSemiMajorAxisAu),
        eccentricity: Number(draftState.tripleOuterEccentricity),
      };
    }
    if (pairId === "pair_abcd" || pairId === "pair_root") {
      return {
        semiMajorAxisAu: Number(draftState.quadOuterSemiMajorAxisAu),
        eccentricity: Number(draftState.quadOuterEccentricity),
      };
    }
    return {
      semiMajorAxisAu: 0,
      eccentricity: 0,
    };
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

  function buildEditorTargetDescriptors(draftState = state, topologyHealth = {}) {
    const { pairStatusLookup } = buildTopologyMapPairStatusLookup(draftState, topologyHealth);
    const starTargets = listAvailableStarEditorIds(draftState).map((starId) => {
      const meta = buildTopologyMapStarMeta(starId, draftState);
      const starDraft = getStarDraftState(starId, draftState);
      const model = solveStarSummaryModel(starId, draftState);
      const roleById = {
        star_a: "Primary star",
        star_b: "Companion star",
        star_c: "Tertiary star",
        star_d: "Quaternary star",
      };
      const hintById = {
        star_a: "Edit the primary star. Shared age, metallicity, and stellar evolution stay above.",
        star_b:
          "Edit the companion star. Shared age, metallicity, and stellar evolution stay above.",
        star_c:
          "Edit the tertiary star. Shared age, metallicity, and stellar evolution stay above.",
        star_d:
          "Edit the quaternary star. Shared age, metallicity, and stellar evolution stay above.",
      };
      return {
        id: starId,
        kind: "star",
        pillLabel: meta.title,
        pillSummary: `${getHostClassValue(model)} · ${fmt(starDraft.massMsol, 4)} Msol`,
        summaryTitle: buildStarEditorLabel(starId, draftState),
        summaryMeta: `${roleById[starId] || "Star"} · ${getHostClassValue(model)} · ${fmt(starDraft.massMsol, 4)} Msol`,
        summaryHint: hintById[starId] || "Edit this star. Shared system context stays above.",
      };
    });
    const pairTargets = listAvailablePairEditorIds(draftState).map((pairId) => {
      const meta = buildTopologyMapPairMeta(pairId, draftState);
      const orbit = getPairOrbitDraftSummary(pairId, draftState);
      const layer = pairStatusLookup.get(pairId) || null;
      return {
        id: pairId,
        kind: "pair",
        pillLabel: meta.title,
        pillSummary: `${fmt(orbit.semiMajorAxisAu, 3)} AU · e ${fmt(orbit.eccentricity, 3)}`,
        summaryTitle: buildPairEditorLabel(pairId, draftState),
        summaryMeta: `${fmt(orbit.semiMajorAxisAu, 3)} AU · e ${fmt(orbit.eccentricity, 3)}${layer?.statusLabel ? ` · ${layer.statusLabel}` : ""}`,
        summaryHint: `Edit the shared orbit for ${meta.accessibleLabel}. Shared age, metallicity, and stellar evolution stay above.`,
        status: layer?.status || "",
        statusLabel: layer?.statusLabel || "",
      };
    });
    return {
      starTargets,
      pairTargets,
      byId: new Map([...starTargets, ...pairTargets].map((target) => [target.id, target])),
    };
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
  wrap.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--star" aria-hidden="true"></span><span>Star</span></h1>
        <button id="starTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        <div class="hint">Set the home-system layout, then edit the shared stellar context and the selected star or pair. These values drive linked system, planet, and moon calculations.</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">
          <div id="starCreateEntry" class="guided-entry-strip">
            <div class="guided-entry-strip__title">Create This Star</div>
            <div id="starCreateEntryHint" class="guided-entry-strip__copy">
              Quick applies a stellar archetype, Guided walks you to a recommendation, and
              Advanced is the direct editor below. Sol-ish Preset and Reset remain available as
              direct input helpers.
            </div>
            <div class="guided-entry-strip__modes">
              <button id="starCreateQuickBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("quick"))}>
                Quick
              </button>
              <button id="starCreateGuidedBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("guided"))}>
                Guided
              </button>
              <span class="guided-entry-strip__mode guided-entry-strip__mode--current" aria-current="page" ${tipAttr(getGuidedEntryModeTooltip("advanced"))}>
                Advanced
              </span>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection__title">Home System Layout ${tipIcon(TIP_LABEL["Home System Architecture"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Topology ${tipIcon(TIP_LABEL["Topology"] || "")}</div>
                <div class="hint" id="topologyHint">
                  Single keeps the classic one-star flow. Binary adds a companion and a shared pair orbit.
                </div>
              </div>
              <div>
                <select id="topologyKind" aria-label="Home system topology">
                  <option value="single">Single star</option>
                  <option value="binary">Binary system</option>
                  <option value="triple">Hierarchical triple</option>
                  <option value="quad">Hierarchical quad</option>
                </select>
              </div>
            </div>

            <div class="form-row" id="quadLayoutRow" style="display:none">
              <div>
                <div class="label">Quad Layout ${tipIcon(TIP_LABEL["Quad Layout"] || "")}</div>
                <div class="hint" id="quadLayoutHint">
                  Chain: one outer companion is added at each layer.
                </div>
              </div>
              <div class="physics-duo-toggle">
                <input type="radio" name="quadLayoutKind" id="quadLayoutChain" value="chain" />
                <label for="quadLayoutChain">Chain</label>
                <input type="radio" name="quadLayoutKind" id="quadLayoutPaired" value="paired" />
                <label for="quadLayoutPaired">Paired</label>
                <span></span>
              </div>
            </div>

            <div class="form-row" id="activeHostFrameRow" style="display:none">
              <div>
                <div class="label">Default Orbit Host ${tipIcon(TIP_LABEL["Default Orbit Host"] || "")}</div>
                <div class="hint">New planets and gas giants start here by default. Existing bodies stay where they are until reassigned later.</div>
              </div>
              <div>
                <select id="activeHostFrame" aria-label="Default orbit host"></select>
              </div>
            </div>
            <div class="hint" id="activeHostFrameSummary" role="status" aria-live="polite" aria-atomic="true" style="display:none;margin-top:6px"></div>

            <div id="topologyHealthPanel" class="subsection" style="display:none;margin-top:12px">
              <div class="subsection__title">Hierarchy Health ${tipIcon(TIP_LABEL["Hierarchy Health"] || "")}</div>
              <div class="hint" id="topologyHealthSummary" aria-live="polite"></div>
              <div class="hint" id="topologyHealthMeta" style="margin-top:6px"></div>
              <div id="topologyHealthLayers" style="margin-top:8px"></div>
            </div>
          </div>

          <div id="binaryAuthoringSection" class="subsection" style="display:none">
            <div class="subsection__title">Secondary Star ${tipIcon(TIP_LABEL["Companion Star"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Companion Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
                <div class="hint">Appears in topology-aware host-frame labels and future visualiser views.</div>
              </div>
              <div>
                <input id="companionName" type="text" maxlength="80" aria-label="Companion star name" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Companion Mass <span class="unit">Msol</span> ${tipIcon(TIP_LABEL["Mass"] || "")}</div>
                <div class="hint">Shapes the companion luminosity, class, and future binary context.</div>
              </div>
              <div>
                <input id="companionMass" type="number" step="0.0001" min="${HOST_COMPONENT_MASS_MIN_TEXT}" max="100" aria-label="Companion mass" />
              </div>
            </div>

            <div class="hint" id="companionSummaryHint" style="margin-top:6px"></div>

            <div id="binaryPairTitle" class="subsection__title" style="margin-top:14px">Inner Pair A+B ${tipIcon(TIP_LABEL["Binary Pair"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Semi-Major Axis <span class="unit">AU</span> ${tipIcon(TIP_LABEL["Binary Semi-Major Axis"] || "")}</div>
                <div class="hint">Average star-to-star separation. Wider pairs read as looser companions.</div>
              </div>
              <div>
                <input id="binarySemiMajorAxis" type="number" step="0.001" min="0.001" max="100000" aria-label="Binary semi-major axis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Eccentricity ${tipIcon(TIP_LABEL["Binary Eccentricity"] || "")}</div>
                <div class="hint">Controls how circular or stretched the binary orbit is.</div>
              </div>
              <div>
                <input id="binaryEccentricity" type="number" step="0.001" min="0" max="0.95" aria-label="Binary eccentricity" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Inclination <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Inclination"] || "")}</div>
                <div class="hint">Stored for future orbit rendering and phase-aware views.</div>
              </div>
              <div>
                <input id="binaryInclination" type="number" step="0.1" min="0" max="180" aria-label="Binary inclination" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Arg. Periapsis <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Argument of Periapsis"] || "")}</div>
                <div class="hint">Orientation of closest approach inside the orbital plane.</div>
              </div>
              <div>
                <input id="binaryArgPeriapsis" type="number" step="0.1" min="0" max="360" aria-label="Binary argument of periapsis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Mean Anomaly <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Mean Anomaly"] || "")}</div>
                <div class="hint">Saved orbital phase position for future animated layouts.</div>
              </div>
              <div>
                <input id="binaryMeanAnomaly" type="number" step="0.1" min="0" max="360" aria-label="Binary mean anomaly" />
              </div>
            </div>

            <div class="hint" id="binaryPairGuardrailHint" style="margin-top:8px"></div>
          </div>

          <div id="tertiaryAuthoringSection" class="subsection" style="display:none">
            <div class="subsection__title">Tertiary Star ${tipIcon(TIP_LABEL["Tertiary Star"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Tertiary Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
                <div class="hint">Appears in outer hierarchical host-frame labels and multi-star canvases.</div>
              </div>
              <div>
                <input id="tertiaryName" type="text" maxlength="80" aria-label="Tertiary star name" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Tertiary Mass <span class="unit">Msol</span> ${tipIcon(TIP_LABEL["Mass"] || "")}</div>
                <div class="hint">Shapes the tertiary light contribution and the outer stability boundary.</div>
              </div>
              <div>
                <input id="tertiaryMass" type="number" step="0.0001" min="${HOST_COMPONENT_MASS_MIN_TEXT}" max="100" aria-label="Tertiary mass" />
              </div>
            </div>

            <div class="hint" id="tertiarySummaryHint" style="margin-top:6px"></div>

            <div id="tertiaryPairTitle" class="subsection__title" style="margin-top:14px">Outer Pair (A+B)+C ${tipIcon(TIP_LABEL["Hierarchy Pair"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Semi-Major Axis <span class="unit">AU</span> ${tipIcon(TIP_LABEL["Binary Semi-Major Axis"] || "")}</div>
                <div class="hint" id="tertiaryPairAxisHint">Average separation between the inner pair and the tertiary star.</div>
              </div>
              <div>
                <input id="tripleOuterSemiMajorAxis" type="number" step="0.001" min="0.001" max="100000" aria-label="Triple outer semi-major axis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Eccentricity ${tipIcon(TIP_LABEL["Binary Eccentricity"] || "")}</div>
                <div class="hint" id="tertiaryPairEccentricityHint">Controls how strongly the tertiary swings toward and away from the inner pair.</div>
              </div>
              <div>
                <input id="tripleOuterEccentricity" type="number" step="0.001" min="0" max="0.95" aria-label="Triple outer eccentricity" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Inclination <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Inclination"] || "")}</div>
                <div class="hint">Stored for future topology-aware orbit rendering.</div>
              </div>
              <div>
                <input id="tripleOuterInclination" type="number" step="0.1" min="0" max="180" aria-label="Triple outer inclination" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Arg. Periapsis <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Argument of Periapsis"] || "")}</div>
                <div class="hint">Orientation of the tertiary orbit inside its plane.</div>
              </div>
              <div>
                <input id="tripleOuterArgPeriapsis" type="number" step="0.1" min="0" max="360" aria-label="Triple outer argument of periapsis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Mean Anomaly <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Mean Anomaly"] || "")}</div>
                <div class="hint">Saved orbital phase position for future animated multi-star layouts.</div>
              </div>
              <div>
                <input id="tripleOuterMeanAnomaly" type="number" step="0.1" min="0" max="360" aria-label="Triple outer mean anomaly" />
              </div>
            </div>

            <div class="hint" id="triplePairGuardrailHint" style="margin-top:8px"></div>
          </div>

          <div id="quaternaryAuthoringSection" class="subsection" style="display:none">
            <div class="subsection__title">Quaternary Star ${tipIcon(TIP_LABEL["Quaternary Star"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Quaternary Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
                <div class="hint">Appears in the outermost hierarchical host-frame labels and overview canvases.</div>
              </div>
              <div>
                <input id="quaternaryName" type="text" maxlength="80" aria-label="Quaternary star name" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Quaternary Mass <span class="unit">Msol</span> ${tipIcon(TIP_LABEL["Mass"] || "")}</div>
                <div class="hint">Extends the outermost light contribution and top-level stability envelope.</div>
              </div>
              <div>
                <input id="quaternaryMass" type="number" step="0.0001" min="${HOST_COMPONENT_MASS_MIN_TEXT}" max="100" aria-label="Quaternary mass" />
              </div>
            </div>

            <div class="hint" id="quaternarySummaryHint" style="margin-top:6px"></div>

            <div id="quaternaryPairTitle" class="subsection__title" style="margin-top:14px">Outer Pair ((A+B)+C)+D ${tipIcon(TIP_LABEL["Hierarchy Pair"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Semi-Major Axis <span class="unit">AU</span> ${tipIcon(TIP_LABEL["Binary Semi-Major Axis"] || "")}</div>
                <div class="hint" id="quaternaryPairAxisHint">Average separation between the inner triple hierarchy and the fourth star.</div>
              </div>
              <div>
                <input id="quadOuterSemiMajorAxis" type="number" step="0.001" min="0.001" max="100000" aria-label="Quad outer semi-major axis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Eccentricity ${tipIcon(TIP_LABEL["Binary Eccentricity"] || "")}</div>
                <div class="hint" id="quaternaryPairEccentricityHint">Controls how strongly the fourth star modulates the outermost hierarchy.</div>
              </div>
              <div>
                <input id="quadOuterEccentricity" type="number" step="0.001" min="0" max="0.95" aria-label="Quad outer eccentricity" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Inclination <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Inclination"] || "")}</div>
                <div class="hint">Stored for future topology-aware orbit rendering.</div>
              </div>
              <div>
                <input id="quadOuterInclination" type="number" step="0.1" min="0" max="180" aria-label="Quad outer inclination" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Arg. Periapsis <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Argument of Periapsis"] || "")}</div>
                <div class="hint">Orientation of the outermost orbit inside its plane.</div>
              </div>
              <div>
                <input id="quadOuterArgPeriapsis" type="number" step="0.1" min="0" max="360" aria-label="Quad outer argument of periapsis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Mean Anomaly <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Mean Anomaly"] || "")}</div>
                <div class="hint">Saved orbital phase position for future animated multi-star layouts.</div>
              </div>
              <div>
                <input id="quadOuterMeanAnomaly" type="number" step="0.1" min="0" max="360" aria-label="Quad outer mean anomaly" />
              </div>
            </div>

            <div class="hint" id="quadPairGuardrailHint" style="margin-top:8px"></div>
          </div>

          <div class="form-row" id="primaryStarNameRow">
            <div>
              <div class="label">Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
              <div class="hint">Used across pages and in the visualiser labels.</div>
            </div>
            <div>
              <input id="starName" type="text" maxlength="80" aria-label="Star name" />
            </div>
          </div>

          <div class="form-row" id="primaryStarMassRow">
            <div>
              <div class="label">Mass <span class="unit">Msol</span> ${tipIcon(TIP_LABEL["Mass"] || "")}</div>
              <div class="hint">Valid host-component range: ${HOST_COMPONENT_MASS_MIN_TEXT} to 100.</div>
            </div>
            <div class="input-pair">
            <input id="mass" type="number" step="0.0001" min="${HOST_COMPONENT_MASS_MIN_TEXT}" max="100" aria-label="Mass" />
            <input id="mass_slider" type="range" aria-label="Mass slider" />
            <div class="range-meta"><span id="mass_min"></span><span id="mass_max"></span></div>
          </div>
          </div>

          <div class="form-row" id="sharedAgeRow">
            <div>
              <div class="label">Current Age <span class="unit">Gyr</span> ${tipIcon(TIP_LABEL["Current Age"] || "")}</div>
              <div class="hint">Used to check if Earth-like life is plausible. Shared across the home system in binary mode.</div>
            </div>
            <div class="input-pair">
            <input id="age" type="number" step="0.001" min="0" max="20" aria-label="Current Age" />
            <input id="age_slider" type="range" aria-label="Current Age slider" />
            <div class="range-meta"><span id="age_min"></span><span id="age_max"></span></div>
          </div>
          </div>

          <div id="sharedEvolutionBlock">
            <div style="height:8px"></div>
            <div class="label">Stellar Evolution ${tipIcon(TIP_LABEL["Stellar Evolution"] || "")}</div>
            <div class="physics-duo-toggle" style="margin:4px 0 6px">
              <input type="radio" name="evolutionMode" id="evolutionOff" value="zams" />
              <label for="evolutionOff">Off</label>
              <input type="radio" name="evolutionMode" id="evolutionOn" value="evolved" />
              <label for="evolutionOn">On</label>
              <span></span>
            </div>
            <div class="hint" id="evolutionHint" style="margin-bottom:8px"></div>
          </div>

          <div class="form-row" id="sharedMetallicityRow">
            <div>
              <div class="label">Metallicity [Fe/H] <span class="unit">dex</span> ${tipIcon(TIP_LABEL["Metallicity [Fe/H]"] || "")}</div>
              <div class="hint">Sun = 0.0 · Metal-poor halo ≈ −2 · Metal-rich disk ≈ +0.3 · Shared across the home system in binary mode.</div>
            </div>
            <div class="input-pair">
            <input id="metallicity" type="number" step="0.01" min="-3" max="1" aria-label="Metallicity [Fe/H]" />
            <input id="metallicity_slider" type="range" aria-label="Metallicity slider" />
            <div class="range-meta"><span id="metallicity_min"></span><span id="metallicity_max"></span></div>
          </div>
          </div>

          <div id="primaryPhysicsBlock">
            <div style="height:8px"></div>
            <div class="label">Physics Mode ${tipIcon(TIP_LABEL["Physics Mode"] || "")}</div>
            <div class="physics-duo-toggle" style="margin:4px 0 6px">
              <input type="radio" name="physicsMode" id="physicsSimple" value="simple" />
              <label for="physicsSimple">Simple</label>
              <input type="radio" name="physicsMode" id="physicsAdvanced" value="advanced" />
              <label for="physicsAdvanced">Advanced</label>
              <span></span>
            </div>
            <div class="hint" id="physicsModeHint" style="margin-bottom:8px"></div>
          </div>

          <div id="advancedDerivRow" style="display:none;margin-bottom:8px">
            <div class="label" style="margin-bottom:6px">Derivation Mode</div>
            <div class="physics-trio-toggle">
              <input type="radio" name="physicsDerivMode" id="derivModeRl" value="rl" />
              <label for="derivModeRl">R + L → T</label>
              <input type="radio" name="physicsDerivMode" id="derivModeRt" value="rt" />
              <label for="derivModeRt">R + T → L</label>
              <input type="radio" name="physicsDerivMode" id="derivModeLt" value="lt" />
              <label for="derivModeLt">L + T → R</label>
              <span></span>
            </div>
            <div class="hint" style="margin-top:5px">R = Radius (Rsol) · L = Luminosity (Lsol) · T = Temperature (K) · Arrow = computed value</div>
          </div>

          <div class="form-row" id="radiusOverrideRow">
            <div>
              <div class="label">Radius <span class="unit">Rsol</span> ${tipIcon(TIP_LABEL["Radius Override"] || "")}</div>
              <div class="hint" id="radiusHint">Auto (mass-derived)</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="radiusOverride" type="number" step="0.001" min="0.001" max="1000" placeholder="Auto" aria-label="Radius override" />
              <button id="radiusClear" type="button">Auto</button>
            </div>
          </div>

          <div class="form-row" id="luminosityOverrideRow">
            <div>
              <div class="label">Luminosity <span class="unit">Lsol</span> ${tipIcon(TIP_LABEL["Luminosity Override"] || "")}</div>
              <div class="hint" id="luminosityHint">Auto (mass-derived)</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="luminosityOverride" type="number" step="0.001" min="0.0001" max="1000000" placeholder="Auto" aria-label="Luminosity override" />
              <button id="luminosityClear" type="button">Auto</button>
            </div>
          </div>

          <div class="form-row" id="tempOverrideRow">
            <div>
              <div class="label">Temperature <span class="unit">K</span> ${tipIcon(TIP_LABEL["Temperature Override"] || "")}</div>
              <div class="hint" id="tempHint">Auto (derived from R and L)</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="tempOverride" type="number" step="1" min="1" max="100000" placeholder="Auto" aria-label="Temperature override" />
              <button id="tempClear" type="button">Auto</button>
            </div>
          </div>

          <div class="hint" id="resolutionStatus" style="margin-top:4px;font-style:italic"></div>

          <div id="primaryStarActionsRow" class="button-row">
            <button id="btn-sol">Sol-ish Preset</button>
            <button id="btn-reset">Reset to Defaults</button>
          </div>

          <div id="inputAutosaveHint" class="hint" style="margin-top:10px">
            Autosaves locally as you make changes.
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Outputs</h2></div>
        <div class="panel__body">
          <div id="kpis"></div>
          <div id="details"></div>
        </div>
      </div>
    </div>
  `;
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

  function createArchitectureCard(card, selected, kind) {
    const buttonEl = createElement("button", {
      attrs: {
        id: card.id,
        type: "button",
        "data-architecture-kind": kind,
        "data-value": card.value,
        "aria-pressed": selected ? "true" : "false",
        "aria-label": `${card.title}. ${card.formula}. ${card.meaning}`,
      },
      className: `star-architecture-card${selected ? " is-selected" : ""}`,
    });
    buttonEl.append(
      createElement("div", { className: "star-architecture-card__title", text: card.title }),
      createElement("div", { className: "star-architecture-card__formula", text: card.formula }),
      createElement("div", { className: "star-architecture-card__meaning", text: card.meaning }),
      createElement("div", { className: "star-architecture-card__summary", text: card.summary }),
    );
    return buttonEl;
  }

  function createSvgElement(tagName, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    for (const [key, value] of Object.entries(attrs)) {
      if (value == null) continue;
      node.setAttribute(key, String(value));
    }
    return node;
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
    onChange: () => applyFromInputs({ commit: true }),
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
    onChange: () => applyFromInputs({ commit: true }),
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
    onChange: () => applyFromInputs({ commit: true }),
  });

  function sanitiseName(raw) {
    const txt = String(raw ?? "").trim();
    return txt || defaults.name;
  }

  function readOptionalNumberInput(inputEl) {
    const raw = String(inputEl.value ?? "");
    if (!raw.trim()) return null;
    const asNumber = inputEl.valueAsNumber;
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function readClampedNumberInput(inputEl, min, max, fallback, { commit = false } = {}) {
    const parsed = readOptionalNumberInput(inputEl);
    if (!Number.isFinite(parsed)) {
      if (commit && Number.isFinite(fallback)) inputEl.value = String(fallback);
      return fallback;
    }
    const clamped = clamp(parsed, min, max);
    if (commit) inputEl.value = String(clamped);
    return clamped;
  }

  function readPositiveOverride(inputEl, { commit = false } = {}) {
    const parsed = readOptionalNumberInput(inputEl);
    if (!(parsed > 0)) {
      if (commit) inputEl.value = "";
      return null;
    }
    return parsed;
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

  function buildStarComponent(id = "star_a", draftState = state) {
    const starDraft = getStarDraftState(id, draftState);
    return {
      id,
      name: starDraft.name,
      massMsol: starDraft.massMsol,
      physicsMode: starDraft.physicsMode,
      advancedDerivationMode: starDraft.advancedDerivationMode,
      radiusRsolOverride: starDraft.radiusRsolOverride,
      luminosityLsolOverride: starDraft.luminosityLsolOverride,
      tempKOverride: starDraft.tempKOverride,
      evolutionMode: starDraft.evolutionMode,
      activityModelVersion: starDraft.activityModelVersion,
    };
  }

  function buildPairComponent(id, childA, childB, pairState) {
    return {
      id,
      childA,
      childB,
      semiMajorAxisAu: pairState.semiMajorAxisAu,
      eccentricity: pairState.eccentricity,
      inclinationDeg: pairState.inclinationDeg,
      argPeriapsisDeg: pairState.argPeriapsisDeg,
      meanAnomalyDeg: pairState.meanAnomalyDeg,
    };
  }

  function buildHostFrameOptionText(frame) {
    if (!frame) return "Orbit host";
    if (frame.id === "star_a") return `Around Star A (${frame.label})`;
    if (frame.id === "star_b") return `Around Star B (${frame.label})`;
    if (frame.id === "star_c") return `Around Star C (${frame.label})`;
    if (frame.id === "star_d") return `Around Star D (${frame.label})`;
    if (frame.id === "pair_ab") return `Around Pair A+B barycentre (${frame.label})`;
    if (frame.id === "pair_cd") return `Around Pair C+D barycentre (${frame.label})`;
    if (frame.id === "pair_abc") return `Around Pair (A+B)+C barycentre (${frame.label})`;
    if (frame.id === "pair_abcd") return `Around Pair ((A+B)+C)+D barycentre (${frame.label})`;
    if (frame.id === "pair_root") return `Around Pair (A+B)+(C+D) barycentre (${frame.label})`;
    return frame.frameKind === "pair"
      ? `Around ${frame.label} barycentre`
      : `Around ${frame.label}`;
  }

  function buildDefaultOrbitHostSummary(frame) {
    if (!frame) {
      return "New planets and gas giants will use this host frame by default. Existing bodies keep their current host frame until you reassign them later.";
    }
    if (frame.frameKind === "pair") {
      return `New planets and gas giants will default to orbiting the ${frame.label} barycentre in a P-type frame. Existing bodies keep their current host frame until reassigned on the Planets or System pages.`;
    }
    return `New planets and gas giants will default to orbiting ${frame.label} in an S-type circumstellar frame. Existing bodies keep their current host frame until reassigned on the Planets or System pages.`;
  }

  function buildStellarSystemFromDraft(draftState = state) {
    const primaryStar = buildStarComponent("star_a", draftState);
    const shared = {
      ageGyr: draftState.ageGyr,
      metallicityFeH: draftState.metallicityFeH,
    };

    if (draftState.topologyKind === "single") {
      return {
        topologyKind: "single",
        shared,
        stars: {
          order: ["star_a"],
          byId: { star_a: primaryStar },
        },
        pairs: {
          order: [],
          byId: {},
        },
        rootNodeId: "star_a",
        defaultHostFrameId: "star_a",
      };
    }

    const starsOrder = ["star_a", "star_b"];
    const starsById = {
      star_a: primaryStar,
      star_b: buildStarComponent("star_b", draftState),
    };
    const pairsOrder = ["pair_ab"];
    const pairsById = {
      pair_ab: buildPairComponent(
        "pair_ab",
        { kind: "star", id: "star_a" },
        { kind: "star", id: "star_b" },
        {
          semiMajorAxisAu: draftState.binarySemiMajorAxisAu,
          eccentricity: draftState.binaryEccentricity,
          inclinationDeg: draftState.binaryInclinationDeg,
          argPeriapsisDeg: draftState.binaryArgPeriapsisDeg,
          meanAnomalyDeg: draftState.binaryMeanAnomalyDeg,
        },
      ),
    };
    let topologyKind = "binary";
    let rootNodeId = "pair_ab";

    if (draftState.topologyKind === "triple") {
      starsOrder.push("star_c");
      starsById.star_c = buildStarComponent("star_c", draftState);
      pairsOrder.push("pair_abc");
      pairsById.pair_abc = buildPairComponent(
        "pair_abc",
        { kind: "pair", id: "pair_ab" },
        { kind: "star", id: "star_c" },
        {
          semiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
          eccentricity: draftState.tripleOuterEccentricity,
          inclinationDeg: draftState.tripleOuterInclinationDeg,
          argPeriapsisDeg: draftState.tripleOuterArgPeriapsisDeg,
          meanAnomalyDeg: draftState.tripleOuterMeanAnomalyDeg,
        },
      );
      topologyKind = "triple";
      rootNodeId = "pair_abc";
    }

    if (draftState.topologyKind === "quad") {
      starsOrder.push("star_c");
      starsById.star_c = buildStarComponent("star_c", draftState);
      starsOrder.push("star_d");
      starsById.star_d = buildStarComponent("star_d", draftState);
      if (normalizeQuadLayoutKind(draftState.quadLayoutKind) === "paired") {
        pairsOrder.push("pair_cd");
        pairsById.pair_cd = buildPairComponent(
          "pair_cd",
          { kind: "star", id: "star_c" },
          { kind: "star", id: "star_d" },
          {
            semiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
            eccentricity: draftState.tripleOuterEccentricity,
            inclinationDeg: draftState.tripleOuterInclinationDeg,
            argPeriapsisDeg: draftState.tripleOuterArgPeriapsisDeg,
            meanAnomalyDeg: draftState.tripleOuterMeanAnomalyDeg,
          },
        );
        pairsOrder.push("pair_root");
        pairsById.pair_root = buildPairComponent(
          "pair_root",
          { kind: "pair", id: "pair_ab" },
          { kind: "pair", id: "pair_cd" },
          {
            semiMajorAxisAu: draftState.quadOuterSemiMajorAxisAu,
            eccentricity: draftState.quadOuterEccentricity,
            inclinationDeg: draftState.quadOuterInclinationDeg,
            argPeriapsisDeg: draftState.quadOuterArgPeriapsisDeg,
            meanAnomalyDeg: draftState.quadOuterMeanAnomalyDeg,
          },
        );
        rootNodeId = "pair_root";
      } else {
        pairsOrder.push("pair_abc");
        pairsById.pair_abc = buildPairComponent(
          "pair_abc",
          { kind: "pair", id: "pair_ab" },
          { kind: "star", id: "star_c" },
          {
            semiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
            eccentricity: draftState.tripleOuterEccentricity,
            inclinationDeg: draftState.tripleOuterInclinationDeg,
            argPeriapsisDeg: draftState.tripleOuterArgPeriapsisDeg,
            meanAnomalyDeg: draftState.tripleOuterMeanAnomalyDeg,
          },
        );
        pairsOrder.push("pair_abcd");
        pairsById.pair_abcd = buildPairComponent(
          "pair_abcd",
          { kind: "pair", id: "pair_abc" },
          { kind: "star", id: "star_d" },
          {
            semiMajorAxisAu: draftState.quadOuterSemiMajorAxisAu,
            eccentricity: draftState.quadOuterEccentricity,
            inclinationDeg: draftState.quadOuterInclinationDeg,
            argPeriapsisDeg: draftState.quadOuterArgPeriapsisDeg,
            meanAnomalyDeg: draftState.quadOuterMeanAnomalyDeg,
          },
        );
        rootNodeId = "pair_abcd";
      }
      topologyKind = "quad";
    }

    return {
      topologyKind,
      shared,
      stars: {
        order: starsOrder,
        byId: starsById,
      },
      pairs: {
        order: pairsOrder,
        byId: pairsById,
      },
      rootNodeId,
      defaultHostFrameId: normalizeTopologyHostFrameId(
        draftState.defaultHostFrameId,
        topologyKind,
        draftState.quadLayoutKind,
      ),
    };
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

  function buildPreviewWorldFromDraft(draftState = state) {
    const baseWorld = loadWorld();
    const basePrimaryStar = getProjectedPrimaryStar(baseWorld);
    const primaryStarDraft = getStarDraftState("star_a", draftState);
    return {
      ...baseWorld,
      star: {
        ...(basePrimaryStar || {}),
        name: primaryStarDraft.name,
        massMsol: primaryStarDraft.massMsol,
        ageGyr: draftState.ageGyr,
        metallicityFeH: draftState.metallicityFeH,
        physicsMode: primaryStarDraft.physicsMode,
        advancedDerivationMode: primaryStarDraft.advancedDerivationMode,
        radiusRsolOverride: primaryStarDraft.radiusRsolOverride,
        luminosityLsolOverride: primaryStarDraft.luminosityLsolOverride,
        tempKOverride: primaryStarDraft.tempKOverride,
        evolutionMode: draftState.evolutionMode,
        activityModelVersion: draftState.activityModelVersion,
      },
      stellarSystem: buildStellarSystemFromDraft(draftState),
    };
  }

  function buildTopologyHealthAssessment(draftState = state) {
    const guardrails = buildTopologyGuardrailSummary({
      topologyKind: draftState.topologyKind,
      quadLayoutKind: draftState.quadLayoutKind,
      primaryMassMsol: draftState.massMsol,
      companionMassMsol: draftState.companionMassMsol,
      binarySemiMajorAxisAu: draftState.binarySemiMajorAxisAu,
      binaryEccentricity: draftState.binaryEccentricity,
      binaryInclinationDeg: draftState.binaryInclinationDeg,
      tertiaryMassMsol: draftState.tertiaryMassMsol,
      tripleOuterSemiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
      tripleOuterEccentricity: draftState.tripleOuterEccentricity,
      tripleOuterInclinationDeg: draftState.tripleOuterInclinationDeg,
      quaternaryMassMsol: draftState.quaternaryMassMsol,
      quadOuterSemiMajorAxisAu: draftState.quadOuterSemiMajorAxisAu,
      quadOuterEccentricity: draftState.quadOuterEccentricity,
      quadOuterInclinationDeg: draftState.quadOuterInclinationDeg,
      quadSecondarySemiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
      quadSecondaryEccentricity: draftState.tripleOuterEccentricity,
      quadSecondaryInclinationDeg: draftState.tripleOuterInclinationDeg,
    });

    let hostFrameLabel = "Star A";
    let fluxSummary =
      draftState.topologyKind === "single"
        ? "Single-star layout: no companion-driven flux variability."
        : "Flux context unavailable until the hierarchy preview resolves.";

    try {
      const previewWorld = buildPreviewWorldFromDraft(draftState);
      const homeSystemContext = buildHomeSystemContext(previewWorld);
      const solveContext = resolveHostFrameContext(
        homeSystemContext,
        normalizeTopologyHostFrameId(
          draftState.defaultHostFrameId,
          draftState.topologyKind,
          draftState.quadLayoutKind,
        ),
      );
      hostFrameLabel =
        solveContext?.hostFrame?.label ||
        listStellarSystemHostFrames(buildStellarSystemFromDraft(draftState))[0]?.label ||
        "Star A";
      const fluxVariabilityFraction = Number(solveContext?.fluxVariabilityFraction || 0);
      const companionFluxEarth = Number(solveContext?.companionFluxEarth || 0);
      if (draftState.topologyKind === "single") {
        fluxSummary = "Single-star layout: no companion-driven flux variability.";
      } else if (guardrails.blocked) {
        fluxSummary = "Hierarchy preview paused until the inverted outer layer is widened.";
      } else if (fluxVariabilityFraction >= 0.1) {
        fluxSummary = `Strong flux variability (~${(fluxVariabilityFraction * 100).toFixed(1)}%) in the ${hostFrameLabel} frame.`;
      } else if (fluxVariabilityFraction >= 0.02) {
        fluxSummary = `Moderate flux variability (~${(fluxVariabilityFraction * 100).toFixed(1)}%) in the ${hostFrameLabel} frame.`;
      } else if (companionFluxEarth > 0.0005) {
        fluxSummary = `Outer-star heating stays mild in the ${hostFrameLabel} frame (~${companionFluxEarth.toFixed(3)}x Earth flux).`;
      } else {
        fluxSummary = `Outer-star heating is negligible in the ${hostFrameLabel} frame.`;
      }
    } catch {
      if (guardrails.blocked) {
        fluxSummary = "Hierarchy preview paused until the inverted outer layer is widened.";
      }
    }

    return {
      ...guardrails,
      hostFrameLabel,
      fluxSummary,
    };
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

  function createEditorTargetPill(targetDescriptor, selected) {
    const buttonEl = createElement("button", {
      attrs: {
        type: "button",
        "data-editor-target-id": targetDescriptor.id,
        "data-editor-target-kind": targetDescriptor.kind,
        "aria-pressed": selected ? "true" : "false",
      },
      className: `star-editor-inspector__pill${selected ? " is-selected" : ""}`,
    });
    appendChildren(buttonEl, [
      createElement("span", {
        className: "star-editor-inspector__pill-label",
        text: targetDescriptor.pillLabel,
      }),
      createElement("span", {
        className: "star-editor-inspector__pill-summary",
        text: targetDescriptor.pillSummary,
      }),
      targetDescriptor.statusLabel
        ? createElement("span", {
            className: "star-editor-inspector__pill-status",
            attrs: { "data-status": targetDescriptor.status || "good" },
            text: targetDescriptor.statusLabel,
          })
        : null,
    ]);
    return buttonEl;
  }

  function buildSelectedStarEditorHint(starId = "star_a", draftState = state) {
    if (starId === "star_a") {
      return "These inputs apply only to the selected primary star. Shared system context lives above.";
    }
    return `These inputs apply only to ${buildStarEditorLabel(starId, draftState)}. Shared age, metallicity, and stellar evolution live above and apply across the home stellar system.`;
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

  function buildOutputStarPreviewDescriptors(draftState = state) {
    return listAvailableStarEditorIds(draftState).map((starId) => {
      const starDraft = getStarDraftState(starId, draftState);
      const model = solveStarSummaryModel(starId, draftState);
      const meta = buildTopologyMapStarMeta(starId, draftState);
      return {
        id: starId,
        starDraft,
        model,
        meta,
      };
    });
  }

  function buildOutputStarStripCopy(focusedStarId, draftState = state) {
    const focusedLabel = buildStarEditorLabel(focusedStarId, draftState);
    const starCount = listAvailableStarEditorIds(draftState).length;
    const selectedTargetId = normalizeSelectedEditorTargetId(
      editorUiState.selectedEditorTargetId,
      draftState,
      {
        preferredMode: editorUiState.selectedEditorMode,
        rememberedStarEditorId: editorUiState.rememberedStarEditorId,
        rememberedPairEditorId: editorUiState.rememberedPairEditorId,
      },
    );
    if (getEditorTargetKind(selectedTargetId) === "pair") {
      return `Showing outputs for ${focusedLabel} while ${buildPairEditorLabel(selectedTargetId, draftState)} is selected in the inspector. Click a star card to switch the main preview and focus that star.`;
    }
    if (starCount <= 1) {
      return `Showing outputs for ${focusedLabel}. This system currently has one star.`;
    }
    return `Showing outputs for ${focusedLabel}. Click another star to switch the main preview and derived outputs.`;
  }

  function createOutputStarPreviewCard(descriptor, isActive) {
    const buttonEl = createElement("button", {
      className: `star-output-strip__card${isActive ? " is-active" : ""}`,
      attrs: {
        type: "button",
        "aria-pressed": isActive ? "true" : "false",
        "aria-label": `Show outputs for ${descriptor.meta.accessibleLabel}`,
      },
      dataset: {
        outputStarId: descriptor.id,
      },
    });
    const swatchEl = createElement("div", {
      className: "star-output-strip__swatch",
      attrs: {
        "aria-hidden": "true",
      },
    });
    swatchEl.style.setProperty("--star-preview-hex", descriptor.model?.starColourHex || "#fff4dc");
    appendChildren(buttonEl, [
      createElement("div", { className: "star-output-strip__card-top" }, [
        createElement("div", {
          className: "star-output-strip__card-label",
          text: `Star ${descriptor.meta.title}`,
        }),
        isActive
          ? createElement("span", {
              className: "star-output-strip__card-badge",
              text: "Showing",
            })
          : null,
      ]),
      swatchEl,
      createElement("div", {
        className: "star-output-strip__card-name",
        text: descriptor.starDraft.name,
      }),
      createElement("div", {
        className: "star-output-strip__card-meta",
        text:
          `${getHostClassValue(descriptor.model)} · ` +
          `${fmt(descriptor.starDraft.massMsol, 4)} Msol`,
      }),
    ]);
    buttonEl.addEventListener("click", () => {
      if (
        editorUiState.selectedEditorMode === "star" &&
        editorUiState.selectedEditorTargetId === descriptor.id
      ) {
        return;
      }
      setSelectedEditorTarget(descriptor.id);
      render();
    });
    return buttonEl;
  }

  function renderOutputStarStrip(summarySectionEl, focusedStarId, draftState = state) {
    if (!summarySectionEl) return;
    summarySectionEl.querySelector("#starOutputStrip")?.remove();
    const descriptors = buildOutputStarPreviewDescriptors(draftState);
    if (!descriptors.length) return;
    const stripEl = createElement("div", {
      className: "star-output-strip",
      attrs: { id: "starOutputStrip" },
    });
    appendChildren(stripEl, [
      createElement("div", { className: "star-output-strip__header" }, [
        createElement("div", { className: "star-output-strip__title", text: "System Stars" }),
        createElement("div", {
          attrs: {
            id: "starOutputStripCopy",
            role: "status",
            "aria-live": "polite",
            "aria-atomic": "true",
          },
          className: "star-output-strip__copy",
          text: buildOutputStarStripCopy(focusedStarId, draftState),
        }),
      ]),
      createElement(
        "div",
        { className: "star-output-strip__grid" },
        descriptors.map((descriptor) =>
          createOutputStarPreviewCard(descriptor, descriptor.id === focusedStarId, draftState),
        ),
      ),
    ]);
    summarySectionEl.appendChild(stripEl);
  }

  function renderArchitectureCards() {
    const topologyCards = buildTopologyCardDescriptors(state);
    topologyCardGridEl.replaceChildren(
      ...topologyCards.map((card) =>
        createArchitectureCard(card, state.topologyKind === card.value, "topology"),
      ),
    );
    const selectedTopologyCard =
      topologyCards.find((card) => card.value === state.topologyKind) || topologyCards[0] || null;
    if (topologyHintEl) topologyHintEl.textContent = selectedTopologyCard?.detail || "";

    const quadLayoutCards = buildQuadLayoutCardDescriptors();
    quadLayoutCardGridEl.replaceChildren(
      ...quadLayoutCards.map((card) =>
        createArchitectureCard(card, state.quadLayoutKind === card.value, "quad-layout"),
      ),
    );
    const selectedQuadLayoutCard =
      quadLayoutCards.find((card) => card.value === state.quadLayoutKind) ||
      quadLayoutCards[0] ||
      null;
    if (quadLayoutHintEl) {
      quadLayoutHintEl.textContent =
        selectedQuadLayoutCard?.hint || selectedQuadLayoutCard?.detail || "";
    }
  }

  function renderTopologyMap(topologyMapModel) {
    topologyMapCanvasEl.dataset.layout = topologyMapModel.layoutKey;
    topologyMapCanvasEl.style.minHeight = `${topologyMapModel.minHeightPx}px`;

    topologyMapSvgEl.replaceChildren(
      ...topologyMapModel.edges
        .filter((edge) => edge.fromNode && edge.toNode)
        .map((edge) =>
          createSvgElement("line", {
            class: "star-topology-map__line",
            x1: edge.fromNode.x,
            y1: edge.fromNode.y,
            x2: edge.toNode.x,
            y2: edge.toNode.y,
            "data-status": edge.status || "",
          }),
        ),
    );

    topologyMapNodesEl.replaceChildren(
      ...topologyMapModel.nodes.map((node) => {
        const buttonEl = createElement(
          "button",
          {
            attrs: {
              id: `topologyMapNode-${node.id}`,
              type: "button",
              "data-topology-node-id": node.id,
              "data-node-kind": node.kind,
              "data-selected": node.selected ? "true" : "false",
              "data-default-host": node.defaultHost ? "true" : "false",
              "data-status": node.status || "",
              "aria-pressed": node.selected ? "true" : "false",
              "aria-label": node.ariaLabel,
              title: node.ariaLabel,
            },
            className: `star-topology-node star-topology-node--${node.kind}`,
          },
          [
            createElement("span", { className: "star-topology-node__title", text: node.title }),
            node.subtitle
              ? createElement("span", {
                  className: "star-topology-node__subtitle",
                  text: node.subtitle,
                })
              : null,
            node.statusLabel
              ? createElement("span", {
                  className: "star-topology-node__status",
                  attrs: { "data-status": node.status || "good" },
                  text: node.statusLabel,
                })
              : null,
            buildTopologyNodeBadgeRow({
              selected: node.selected,
              defaultHost: node.defaultHost,
            }),
          ],
        );
        buttonEl.style.left = `${node.x}%`;
        buttonEl.style.top = `${node.y}%`;
        return buttonEl;
      }),
    );

    topologyMapHealthChipsEl.replaceChildren(
      ...topologyMapModel.chips.map((chip) =>
        createElement(
          "div",
          {
            className: "star-topology-map__chip",
            attrs: {
              "data-status": chip.status || "good",
              title: chip.title || `${chip.label}: ${chip.value}`,
            },
          },
          [
            createElement("span", {
              className: "star-topology-map__chip-label",
              text: chip.label,
            }),
            createElement("span", {
              className: "star-topology-map__chip-value",
              text: chip.value,
            }),
          ],
        ),
      ),
    );

    topologyMapLegendEl.replaceChildren(
      ...TOPOLOGY_MAP_LEGEND_ROWS.map((row) => createTopologyLegendRow(row)),
    );

    topologyMapSummaryEl.textContent = topologyMapModel.summaryText;

    if (editorUiState.pendingTopologyMapFocusId) {
      const focusTarget = topologyMapNodesEl.querySelector(
        `#topologyMapNode-${editorUiState.pendingTopologyMapFocusId}`,
      );
      editorUiState.pendingTopologyMapFocusId = null;
      focusTarget?.focus?.({ preventScroll: true });
    }
  }

  function updateTopologyUI({ syncVisibleStarInputs = true } = {}) {
    const isMulti = state.topologyKind !== "single";
    const isTripleLike = state.topologyKind === "triple" || state.topologyKind === "quad";
    const isQuad = state.topologyKind === "quad";
    const quadLayoutCopy = buildQuadLayoutCopy(state.quadLayoutKind);
    const topologyHealth = buildTopologyHealthAssessment();
    syncEditorSelectionState();
    renderArchitectureCards();
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
    renderTopologyMap(topologyMapModel);
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

  function applyStarSystemInputs(systemInputs = null) {
    if (!systemInputs || typeof systemInputs !== "object") return null;

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

    topologyKindEl.value = state.topologyKind;
    const nextQuadLayoutRadio = wrap.querySelector(
      `#${state.quadLayoutKind === "paired" ? "quadLayoutPaired" : "quadLayoutChain"}`,
    );
    if (nextQuadLayoutRadio) nextQuadLayoutRadio.checked = true;
    companionNameEl.value = state.companionName;
    companionMassEl.value = state.companionMassMsol;
    binarySemiMajorAxisEl.value = state.binarySemiMajorAxisAu;
    binaryEccentricityEl.value = state.binaryEccentricity;
    binaryInclinationEl.value = state.binaryInclinationDeg;
    binaryArgPeriapsisEl.value = state.binaryArgPeriapsisDeg;
    binaryMeanAnomalyEl.value = state.binaryMeanAnomalyDeg;
    tertiaryNameEl.value = state.tertiaryName;
    tertiaryMassEl.value = state.tertiaryMassMsol;
    tripleOuterSemiMajorAxisEl.value = state.tripleOuterSemiMajorAxisAu;
    tripleOuterEccentricityEl.value = state.tripleOuterEccentricity;
    tripleOuterInclinationEl.value = state.tripleOuterInclinationDeg;
    tripleOuterArgPeriapsisEl.value = state.tripleOuterArgPeriapsisDeg;
    tripleOuterMeanAnomalyEl.value = state.tripleOuterMeanAnomalyDeg;
    quaternaryNameEl.value = state.quaternaryName;
    quaternaryMassEl.value = state.quaternaryMassMsol;
    quadOuterSemiMajorAxisEl.value = state.quadOuterSemiMajorAxisAu;
    quadOuterEccentricityEl.value = state.quadOuterEccentricity;
    quadOuterInclinationEl.value = state.quadOuterInclinationDeg;
    quadOuterArgPeriapsisEl.value = state.quadOuterArgPeriapsisDeg;
    quadOuterMeanAnomalyEl.value = state.quadOuterMeanAnomalyDeg;
    updateTopologyUI();
    activeHostFrameEl.value = state.defaultHostFrameId;

    return {
      topologyKind: state.topologyKind,
      defaultHostFrameId: state.defaultHostFrameId,
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
    state.evolutionMode = nextInputs?.evolutionMode === "evolved" ? "evolved" : "zams";
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

  function formatRecurrence(ratePerDay) {
    const rate = Number(ratePerDay);
    if (!(rate > 0)) return "Rare";
    const days = 1 / rate;
    if (days >= 365) return `~${fmt(days / 365, 2)} years`;
    if (days >= 1) return `~${fmt(days, 2)} days`;
    const hours = days * 24;
    if (hours >= 1) return `~${fmt(hours, 2)} hours`;
    return `~${fmt(hours * 60, 2)} minutes`;
  }

  function shortPopulationLabel(label) {
    const txt = String(label || "").trim();
    if (txt === "Population I (solar neighbourhood)") return "Pop I";
    if (txt === "Intermediate (old thin disk)") return "Intermediate";
    if (txt === "Population II (metal-poor)") return "Pop II";
    if (txt === "Metal-rich (inner disk)") return "Metal-rich";
    return txt;
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
    const energeticRecurrenceText = formatRecurrence(activity.energeticFlareRatePerDay);
    const totalRecurrenceText = formatRecurrence(activity.totalFlareRatePerDay);
    const cmeTotalMeta =
      activity.teffBin === "FGK"
        ? "Solar-cycle envelope split into associated + background"
        : "Empirical split model outside FGK solar envelope";
    const xuvFluxMeta = isBrownDwarfModel(model)
      ? `${model.display.xuvFluxRatioEarth} | negligible`
      : `${model.display.xuvFluxRatioEarth} | saturation ${model.display.xuvSaturationAge}`;
    const life = model.earthLikeLifePossible;
    const classLabel = getHostClassLabel(model);
    const classValue = getHostClassValue(model);
    const zoneLabel = getHostZoneLabel(model);
    const zoneValue = formatHostZoneValue(model);
    const zoneMeta = `AU | ${model.display.hzMkm} million km`;
    const lifetimeLabel = getHostLifetimeLabel(model);
    const lifetimeValue = getHostLifetimeValue(model);
    const lifetimeMeta = getHostLifetimeMeta(model);
    const lifeLabel = isBrownDwarfModel(model) ? "Direct Earth-like Life" : "Earth-like Life?";
    const lifeValue = isBrownDwarfModel(model) ? "No (substellar host)" : life;
    const lifeMeta = isBrownDwarfModel(model)
      ? "Use the current temperate zone and moon outputs instead"
      : "";
    const quadLayoutCopy = buildQuadLayoutCopy(state.quadLayoutKind);
    const topologyLabel =
      state.topologyKind === "quad"
        ? quadLayoutCopy.topologyLabel
        : state.topologyKind === "triple"
          ? "Triple"
          : state.topologyKind === "binary"
            ? "Binary"
            : "Single";
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
    const activeHostFrameLabel = activeHostFrameRecord
      ? buildHostFrameOptionText(activeHostFrameRecord)
      : "Star A";
    const tertiaryPairLabel =
      state.topologyKind === "quad" && state.quadLayoutKind === "paired"
        ? "Inner Pair C+D"
        : "Outer Pair (A+B)+C";
    const quaternaryPairLabel =
      state.topologyKind === "quad" && state.quadLayoutKind === "paired"
        ? "Root Pair (A+B)+(C+D)"
        : "Outer Pair ((A+B)+C)+D";

    const starKpi = (label, value, meta = "", overrides = {}) => ({
      label,
      tip: TIP_LABEL[overrides.tipLabel || label] || "",
      value,
      meta,
      ...overrides,
    });

    const systemContextItems = [
      ...(isMulti
        ? [
            starKpi("Topology", topologyLabel, `${hostFrameRecords.length} host frame(s)`, {
              tipLabel: "Topology",
            }),
            starKpi("Default Orbit Host", activeHostFrameLabel, "Default future orbit host", {
              tipLabel: "Default Orbit Host",
            }),
            starKpi(
              "Secondary Mass",
              fmt(state.companionMassMsol, 4),
              `${getHostClassValue(companionModel)} | ${formatLuminosityLsol(companionModel?.luminosityLsol || 0, 3)} Lsol`,
              { tipLabel: "Companion Star" },
            ),
            starKpi(
              "Inner Pair A+B",
              fmt(state.binarySemiMajorAxisAu, 3),
              `AU | e = ${fmt(state.binaryEccentricity, 3)}`,
              { tipLabel: "Binary Pair" },
            ),
            starKpi("Hierarchy Health", topologyHealth.headline, topologyHealth.summary, {
              tipLabel: "Hierarchy Health",
            }),
            ...(isTripleLike
              ? [
                  starKpi(
                    "Tertiary Mass",
                    fmt(state.tertiaryMassMsol, 4),
                    `${getHostClassValue(tertiaryModel)} | ${formatLuminosityLsol(tertiaryModel?.luminosityLsol || 0, 3)} Lsol`,
                    { tipLabel: "Tertiary Star" },
                  ),
                  starKpi(
                    tertiaryPairLabel,
                    fmt(state.tripleOuterSemiMajorAxisAu, 3),
                    `AU | e = ${fmt(state.tripleOuterEccentricity, 3)}`,
                    { tipLabel: "Hierarchy Pair" },
                  ),
                ]
              : []),
            ...(isQuad
              ? [
                  starKpi(
                    "Quaternary Mass",
                    fmt(state.quaternaryMassMsol, 4),
                    `${getHostClassValue(quaternaryModel)} | ${formatLuminosityLsol(quaternaryModel?.luminosityLsol || 0, 3)} Lsol`,
                    { tipLabel: "Quaternary Star" },
                  ),
                  starKpi(
                    quaternaryPairLabel,
                    fmt(state.quadOuterSemiMajorAxisAu, 3),
                    `AU | e = ${fmt(state.quadOuterEccentricity, 3)}`,
                    { tipLabel: "Hierarchy Pair" },
                  ),
                ]
              : []),
          ]
        : []),
      starKpi(
        "Giant Planet Probability",
        `${fmt(model.giantPlanetProbability * 100, 1)}%`,
        "Fischer & Valenti (2005); Johnson et al. (2010)",
      ),
    ];

    const systemDetailItems = [
      ...(isMulti
        ? [
            {
              label: "Topology",
              value: topologyLabel,
            },
            {
              label: "Default Orbit Host",
              value: activeHostFrameLabel,
            },
            {
              label: "Hierarchy Health",
              value: topologyHealth.headline,
              meta: `${topologyHealth.summary} ${topologyHealth.fluxSummary}`.trim(),
            },
            {
              label: "Secondary Star",
              value: `${state.companionName} (${getHostClassValue(companionModel)})`,
              meta: `${fmt(state.companionMassMsol, 4)} Msol`,
            },
            {
              label: "Inner Pair A+B",
              value: `${fmt(state.binarySemiMajorAxisAu, 3)} AU`,
              meta: `e ${fmt(state.binaryEccentricity, 3)} | i ${fmt(state.binaryInclinationDeg, 1)}°`,
            },
            ...(isTripleLike
              ? [
                  {
                    label: "Tertiary Star",
                    value: `${state.tertiaryName} (${getHostClassValue(tertiaryModel)})`,
                    meta: `${fmt(state.tertiaryMassMsol, 4)} Msol`,
                  },
                  {
                    label: tertiaryPairLabel,
                    value: `${fmt(state.tripleOuterSemiMajorAxisAu, 3)} AU`,
                    meta: `e ${fmt(state.tripleOuterEccentricity, 3)} | i ${fmt(state.tripleOuterInclinationDeg, 1)}°`,
                  },
                ]
              : []),
            ...(isQuad
              ? [
                  {
                    label: "Quaternary Star",
                    value: `${state.quaternaryName} (${getHostClassValue(quaternaryModel)})`,
                    meta: `${fmt(state.quaternaryMassMsol, 4)} Msol`,
                  },
                  {
                    label: quaternaryPairLabel,
                    value: `${fmt(state.quadOuterSemiMajorAxisAu, 3)} AU`,
                    meta: `e ${fmt(state.quadOuterEccentricity, 3)} | i ${fmt(state.quadOuterInclinationDeg, 1)}°`,
                  },
                ]
              : []),
          ]
        : []),
      {
        label: "Giant Planet Probability",
        value: `${fmt(model.giantPlanetProbability * 100, 1)}%`,
        meta: "Fischer & Valenti (2005); Johnson et al. (2010)",
      },
    ];

    syncFocusedStarEditorInputs({ syncVisibleInputs: !preserveFocusedDraft });
    renderKpiSections(kpisEl, [
      {
        id: "star-summary",
        title: "Summary",
        items: [
          starKpi(
            "Focused Star Preview",
            `${model.starColourHex}`,
            "Hex (derived from temperature) - Animated at 0.5 d/s with flares + CMEs",
            {
              kind: "sunVisual",
              tipLabel: "Star Colour",
            },
          ),
          starKpi(
            classLabel,
            classValue,
            isBrownDwarfModel(model) ? regimeDisplayLabel(model.regime) : "",
            {
              tipLabel: isBrownDwarfModel(model) ? "Brown Dwarf Class" : "Class",
            },
          ),
          starKpi(
            "Radius",
            fmt(model.radiusRsol, 3),
            `Rsol | ${fmt(model.metric.radiusKm, 0)} km${model.radiusOverridden ? " (Override)" : ""}`,
          ),
          starKpi(
            "Luminosity",
            formatScaledLuminosityLsol(model.luminosityLsol, 3),
            buildLuminosityKpiMeta(model),
            { tip: buildLuminosityKpiTooltip(model) },
          ),
          starKpi("Temperature", fmt(model.tempK, 0), "K"),
          starKpi(zoneLabel, zoneValue, zoneMeta, { tipLabel: "Habitable Zone" }),
          starKpi("Activity Regime", `${activity.teffBin}/${activity.ageBand}`, "Teff + age bins"),
          starKpi(lifeLabel, lifeValue, lifeMeta, { tipLabel: "Earth-like Life?" }),
        ],
      },
      {
        id: "star-identity",
        title: "Identity & Class",
        density: "compact",
        items: [
          starKpi("Current Age", fmt(state.ageGyr, 3), "Gyr"),
          starKpi("Metallicity [Fe/H]", fmt(state.metallicityFeH, 2), "dex"),
          starKpi(
            "Population",
            shortPopulationLabel(model.populationLabel),
            `${model.populationLabel} | [Fe/H] = ${fmt(model.inputs.metallicityFeH, 2)}`,
            { tipLabel: "Stellar Population" },
          ),
        ],
      },
      {
        id: "star-physical",
        title: "Physical State",
        density: "compact",
        items: [
          starKpi(lifetimeLabel, lifetimeValue, lifetimeMeta, {
            tipLabel: isBrownDwarfModel(model) ? "Maximum Age" : lifetimeLabel,
          }),
          starKpi(
            "Radius",
            fmt(model.radiusRsol, 3),
            `Rsol | ${fmt(model.metric.radiusKm, 0)} km${model.radiusOverridden ? " (Override)" : ""}`,
          ),
          starKpi(
            "Luminosity",
            formatScaledLuminosityLsol(model.luminosityLsol, 3),
            buildLuminosityKpiMeta(model),
            { tip: buildLuminosityKpiTooltip(model) },
          ),
          starKpi("Density", fmt(model.densityGcm3, 3), "g/cm³"),
          starKpi("Temperature", fmt(model.tempK, 0), "K"),
        ],
      },
      {
        id: "star-environment",
        title: "Environment",
        density: "compact",
        items: [starKpi(zoneLabel, zoneValue, zoneMeta, { tipLabel: "Habitable Zone" })],
      },
      {
        id: "star-system",
        title: "System Context",
        density: "compact",
        items: systemContextItems,
      },
      {
        id: "star-activity",
        title: "Activity & Radiation",
        density: "compact",
        items: [
          starKpi("Activity Regime", `${activity.teffBin}/${activity.ageBand}`, "Teff + age bins"),
          starKpi("XUV Regime", model.display.xuvRegime, model.display.xuvSaturationAge),
          starKpi("XUV Flux at 1 AU", model.display.xuvFluxAt1Au, xuvFluxMeta),
          starKpi("XUV Luminosity", model.display.xuvLuminosityW, model.display.xuvLuminosityErgS),
          starKpi("N32 Rate", fmt(activity.energeticFlareRatePerDay, 3), "flares/day (>1e32 erg)", {
            tipLabel: "Energetic Flare Rate (>1e32 erg)",
          }),
          starKpi("Energetic Flare Recurrence", energeticRecurrenceText, "for >1e32 erg flares"),
          starKpi(
            "Total Flare Rate (>1e30 erg)",
            fmt(activity.totalFlareRatePerDay, 3),
            "flares/day",
          ),
          starKpi("Total Flare Recurrence", totalRecurrenceText, "for >1e30 erg flares"),
          starKpi("Associated CME Rate", fmt(activity.cmeAssociatedRatePerDay, 3), "CME/day"),
          starKpi("Background CME Rate", fmt(activity.cmeBackgroundRatePerDay, 3), "CME/day"),
          starKpi("Total CME Rate", fmt(activity.cmeTotalRatePerDay, 3), cmeTotalMeta),
          starKpi(
            "Solar CME Envelope (FGK)",
            activity.teffBin === "FGK" ? "0.5 to 6.0/day" : "n/a",
            activity.teffBin === "FGK" ? "Solar-cycle observed range" : "FGK stars only",
          ),
        ],
      },
      {
        id: "star-habitability",
        title: "Habitability",
        density: "compact",
        items: [starKpi(lifeLabel, lifeValue, lifeMeta, { tipLabel: "Earth-like Life?" })],
      },
    ]);
    renderOutputStarStrip(kpisEl.querySelector("#star-summary"), focusedStarId, state);

    renderDerivedDetails(
      detailsEl,
      [
        {
          id: "star-details-identity",
          title: "Identity & Class",
          items: [
            { label: "Name", value: focusedStar.name },
            { label: classLabel, value: classValue },
            { label: "Current Age", value: `${fmt(state.ageGyr, 3)} Gyr` },
            { label: "Metallicity [Fe/H]", value: `${fmt(state.metallicityFeH, 2)} dex` },
            { label: "Population", value: model.populationLabel },
            { label: "Stellar Evolution", value: model.evolutionMode === "evolved" ? "On" : "Off" },
            {
              label: "Physics Mode",
              value: focusedStar.physicsMode === "advanced" ? "Advanced" : "Simple",
            },
          ],
        },
        {
          id: "star-details-physical",
          title: "Physical State",
          items: [
            { label: lifetimeLabel, value: lifetimeValue, meta: lifetimeMeta },
            {
              label: "Radius",
              value: `${fmt(model.radiusRsol, 3)} Rsol`,
              meta: `${fmt(model.metric.radiusKm, 0)} km`,
            },
            {
              label: "Luminosity",
              value: `${formatLuminosityLsol(model.luminosityLsol, 3)} Lsol`,
              meta: `${fmt(model.metric.luminosityW, 0)} W`,
            },
            { label: "Density", value: `${fmt(model.densityGcm3, 3)} g/cm³` },
            { label: "Temperature", value: `${fmt(model.tempK, 0)} K` },
          ],
        },
        {
          id: "star-details-environment",
          title: "Environment",
          items: [
            {
              label: zoneLabel,
              value: zoneValue,
              meta: `${model.display.hzMkm} million km`,
            },
            { label: "Star Colour", value: model.starColourHex },
          ],
        },
        {
          id: "star-details-system",
          title: "System Context",
          items: systemDetailItems,
        },
        {
          id: "star-details-activity",
          title: "Activity & Radiation",
          items: [
            { label: "Activity Regime", value: `${activity.teffBin}/${activity.ageBand}` },
            {
              label: "XUV Regime",
              value: model.display.xuvRegime,
              meta: model.display.xuvSaturationAge,
            },
            {
              label: "XUV Flux at 1 AU",
              value: model.display.xuvFluxAt1Au,
              meta: model.display.xuvFluxRatioEarth,
            },
            {
              label: "XUV Luminosity",
              value: model.display.xuvLuminosityW,
              meta: model.display.xuvLuminosityErgS,
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
          ],
        },
        {
          id: "star-details-habitability",
          title: "Habitability",
          items: [{ label: lifeLabel, value: lifeValue, meta: lifeMeta }],
        },
      ],
      { title: "Derived Details" },
    );

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

  let hydrating = false;
  function applyFromInputs({ commit = false } = {}) {
    if (hydrating) return;
    hydrating = true;
    const focusedStarId = getFocusedStarEditorId();
    const focusedStar = getStarDraftState(focusedStarId, state);
    state.topologyKind = ["binary", "triple", "quad"].includes(topologyKindEl.value)
      ? topologyKindEl.value
      : "single";
    state.quadLayoutKind = normalizeQuadLayoutKind(
      wrap.querySelector('input[name="quadLayoutKind"]:checked')?.value,
      state.quadLayoutKind,
    );
    state.defaultHostFrameId = normalizeTopologyHostFrameId(
      activeHostFrameEl.value,
      state.topologyKind,
      state.quadLayoutKind,
    );
    const nextFocusedStarName =
      focusedStarId === "star_a"
        ? commit
          ? sanitiseName(nameEl.value)
          : sanitiseName(String(nameEl.value ?? ""))
        : focusedStarId === "star_b"
          ? commit
            ? sanitiseCompanionName(nameEl.value)
            : sanitiseCompanionName(String(nameEl.value ?? ""))
          : focusedStarId === "star_c"
            ? commit
              ? sanitiseTertiaryName(nameEl.value)
              : sanitiseTertiaryName(String(nameEl.value ?? ""))
            : commit
              ? sanitiseQuaternaryName(nameEl.value)
              : sanitiseQuaternaryName(String(nameEl.value ?? ""));
    assignStarDraftState(focusedStarId, { name: nextFocusedStarName });
    if (commit) nameEl.value = nextFocusedStarName;
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
      wrap.querySelector('input[name="evolutionMode"]:checked')?.value || "zams";
    state.defaultHostFrameId = normalizeTopologyHostFrameId(
      state.defaultHostFrameId,
      state.topologyKind,
      state.quadLayoutKind,
    );

    // Read overrides only in Advanced mode; in Simple they stay dormant in state
    // so values are preserved if the user switches back to Advanced.
    if (nextPhysicsMode === "advanced") {
      assignStarDraftState(focusedStarId, {
        radiusRsolOverride:
          radiusOverrideRowEl.style.display !== "none"
            ? readPositiveOverride(radiusOverrideEl, { commit })
            : null,
        luminosityLsolOverride:
          luminosityOverrideRowEl.style.display !== "none"
            ? readPositiveOverride(luminosityOverrideEl, { commit })
            : null,
        tempKOverride:
          tempOverrideRowEl.style.display !== "none"
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

  function applyCompatStarInputs(starId, { commit = false } = {}) {
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
        ? config.sanitiseName(config.nameEl.value)
        : config.sanitiseName(String(config.nameEl.value ?? "")),
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

  function buildStarGoalQuestionValues(flowState, questions = []) {
    const goalDraft =
      flowState?.goalDraft &&
      typeof flowState.goalDraft === "object" &&
      !Array.isArray(flowState.goalDraft)
        ? flowState.goalDraft
        : {};
    const traitRoles =
      goalDraft.traitRoles &&
      typeof goalDraft.traitRoles === "object" &&
      !Array.isArray(goalDraft.traitRoles)
        ? goalDraft.traitRoles
        : {};
    const values = {};
    for (const question of Array.isArray(questions) ? questions : []) {
      if (question?.id === "priority")
        values.priority = goalDraft.priority || question?.defaultValue;
      else if (question?.id === "allowedEdits") {
        values.allowedEdits = goalDraft.allowedEdits || question?.defaultValue;
      } else if (question?.id === "searchBudget") {
        values.searchBudget = goalDraft.searchBudget || question?.defaultValue;
      } else if (question?.id === "system_architecture") {
        values.system_architecture = goalDraft.systemArchitecture || question?.defaultValue;
      } else if (String(question?.id || "").startsWith("traitRole:")) {
        const traitId = String(question.id).slice("traitRole:".length);
        values[question.id] = traitRoles[traitId] || "off";
      }
    }
    return values;
  }

  function setStarGoalDraftValue(controllerRef, flowState, questionId, value) {
    const normalizedId = String(questionId || "");
    if (!normalizedId) return;
    if (
      normalizedId === "priority" ||
      normalizedId === "allowedEdits" ||
      normalizedId === "searchBudget"
    ) {
      controllerRef?.setGoalDraftValue(normalizedId, value);
      return;
    }
    if (normalizedId === "system_architecture") {
      controllerRef?.setGoalDraftValue("systemArchitecture", value);
      return;
    }
    if (normalizedId.startsWith("traitRole:")) {
      const traitId = normalizedId.slice("traitRole:".length);
      const currentGoalDraft =
        flowState?.goalDraft &&
        typeof flowState.goalDraft === "object" &&
        !Array.isArray(flowState.goalDraft)
          ? flowState.goalDraft
          : {};
      const nextTraitRoles =
        currentGoalDraft.traitRoles &&
        typeof currentGoalDraft.traitRoles === "object" &&
        !Array.isArray(currentGoalDraft.traitRoles)
          ? { ...currentGoalDraft.traitRoles }
          : {};
      if (!value || value === "off") delete nextTraitRoles[traitId];
      else nextTraitRoles[traitId] = value;
      controllerRef?.setGoalDraft({
        ...currentGoalDraft,
        traitRoles: nextTraitRoles,
      });
    }
  }

  function buildStarGoalTextAssist(resolveController, flowState) {
    const goalDraft =
      flowState?.goalDraft &&
      typeof flowState.goalDraft === "object" &&
      !Array.isArray(flowState.goalDraft)
        ? flowState.goalDraft
        : {};
    const help = getGoalTextAliasHelp("star");
    return createGoalTextAssist({
      objectLabel: "star",
      value: goalDraft.goalText || "",
      placeholder: help.placeholder,
      examples: help.examples,
      interpretation: goalDraft.goalTextInterpretation || null,
      onInterpret: (value) =>
        applyGuidedGoalTextInterpretation(resolveController?.(), flowState, "star", value),
      onClear: () => clearGuidedGoalTextInterpretation(resolveController?.(), flowState),
    });
  }

  function buildStarGoalStatus(flowState) {
    const compileDiagnostics = Array.isArray(flowState?.compileDiagnostics)
      ? flowState.compileDiagnostics
      : [];
    const searchStatus = String(flowState?.searchStatus || "idle");
    const hasRestoredResult = !!flowState?.lastSearchResult?.recommendation;
    const title =
      searchStatus === "searching"
        ? "Goal search in progress"
        : searchStatus === "complete"
          ? "Goal search result ready"
          : searchStatus === "ready"
            ? "Goal compiled"
            : searchStatus === "error"
              ? "Goal compile or search blocked"
              : searchStatus === "canceled"
                ? "Goal search canceled"
                : searchStatus === "needs-compile"
                  ? "Goal needs compile"
                  : "";
    const detailParts = [];
    if (searchStatus === "needs-compile") {
      detailParts.push("Compile the goal or run the search again after changing setup or traits.");
    } else if (searchStatus === "ready") {
      detailParts.push(
        "The structured goal is valid. Run Search to try seeded stellar candidates.",
      );
    } else if (searchStatus === "searching") {
      detailParts.push("Trying seeded stellar candidates against the current star context.");
    } else if (searchStatus === "complete") {
      detailParts.push("Review the result and diagnostics before applying.");
    } else if (searchStatus === "error" && flowState?.searchError) {
      detailParts.push(flowState.searchError);
    }
    if (searchStatus !== "complete" && hasRestoredResult) {
      detailParts.push(
        "A previous search result is still visible below until you re-run the search.",
      );
    }
    return {
      compileStatus: compileDiagnostics.length
        ? "error"
        : searchStatus === "ready" || searchStatus === "complete"
          ? "ready"
          : searchStatus,
      searchStatus,
      title,
      detail: detailParts.join(" "),
      diagnostics: compileDiagnostics,
    };
  }

  const starGuidedSteps = Object.freeze([
    { id: "type", label: "Goal" },
    { id: "stellar-context", label: "Setup" },
    { id: "goal-details", label: "Traits" },
    { id: "recommendation", label: "Recommendation" },
  ]);

  function starGuidedStepIndex(stepId) {
    const index = starGuidedSteps.findIndex((step) => step.id === String(stepId || ""));
    return index >= 0 ? index : 0;
  }

  function openStarGuidedQuickPicker(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureStarGuidedAdapterRegistered();
    const context = buildStarGuidedContext();
    const sessionTarget = getStarGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "guided-overlay--star",
      dialogClassName: "guided-dialog--star",
      closeLabel: "Close star quick types",
    });
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("star");
      overlayEl.remove();
      document.removeEventListener("keydown", onKey);
    }

    function close() {
      teardownOverlay(false);
      if (dedicatedBaseHash && location.hash !== dedicatedBaseHash) {
        location.hash = dedicatedBaseHash;
      }
    }

    const preserveClose = () => teardownOverlay(true);

    function onKey(e) {
      if (e.key === "Escape") close();
    }

    controller = createGuidedFlowController({
      adapter,
      context,
      initialState: {
        objectType: "star",
        uxMode: "quick",
        selectedArchetypeId: restoredSession?.selectedArchetypeId || "",
        answers: restoredSession?.answers || {},
      },
      onUpdate: ({ state: flowState, questions, recommendation, archetypes }) => {
        const panel = createGuidedPanel({
          title: "Star Quick Types",
          subtitle:
            "Pick a stellar starting point. Each option re-solves the star and its activity outputs in the current editor context.",
          archetypes: (archetypes || []).filter((entry) => entry?.quickEnabled !== false),
          selectedArchetypeId: flowState.selectedArchetypeId || "",
          questions,
          answers: flowState.answers,
          recommendation,
          previewContent: createStarGuidedPreviewContent(recommendation),
          actions: [
            {
              id: "apply",
              label: recommendation?.diagnostics?.some((entry) => entry?.severity === "warning")
                ? "Apply Starting Point"
                : "Apply Quick Type",
              disabled: !recommendation,
            },
          ],
          onArchetypeSelect: (archetypeId) => controller?.selectArchetype(archetypeId),
          onQuestionChange: (questionId, value) => controller?.setAnswer(questionId, value),
          onAction: (actionId) => {
            if (actionId !== "apply" || !recommendation) return;
            controller?.apply({
              applyStarRecommendation: (nextRecommendation) =>
                applyStarGuidedRecommendation(nextRecommendation, {
                  noticeLabel: recommendation.title || "Star quick type",
                }),
            });
            close();
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("star", {
          ...sessionTarget,
          uxMode: "quick",
          ...buildGuidedSessionSnapshot(flowState),
        });
      },
    });

    overlayClosers.add(preserveClose);
    closeButtonEl.addEventListener("click", close);
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlayEl);
  }

  function openStarGuidedFlow(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureStarGuidedAdapterRegistered();
    const context = buildStarGuidedContext();
    const sessionTarget = getStarGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "guided-overlay--star",
      dialogClassName: "guided-dialog--star",
      closeLabel: "Close star guided creation",
    });
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("star");
      overlayEl.remove();
      document.removeEventListener("keydown", onKey);
    }

    function close() {
      teardownOverlay(false);
      if (dedicatedBaseHash && location.hash !== dedicatedBaseHash) {
        location.hash = dedicatedBaseHash;
      }
    }

    const preserveClose = () => teardownOverlay(true);

    function onKey(e) {
      if (e.key === "Escape") close();
    }

    function nextStarGuidedStepId(flowState, questions = []) {
      const currentId = String(flowState?.currentStepId || "type");
      if (currentId === "type") return "stellar-context";
      if (currentId === "stellar-context") {
        return questions.some((question) => question?.stepId === "goal-details")
          ? "goal-details"
          : "recommendation";
      }
      return "recommendation";
    }

    function previousStarGuidedStepId(flowState, questions = []) {
      const currentId = String(flowState?.currentStepId || "type");
      if (currentId === "recommendation") {
        return questions.some((question) => question?.stepId === "goal-details")
          ? "goal-details"
          : "stellar-context";
      }
      if (currentId === "goal-details") return "stellar-context";
      if (currentId === "stellar-context") return "type";
      return "type";
    }

    controller = createGuidedFlowController({
      adapter,
      context,
      searchMode: "manual",
      initialState: {
        objectType: "star",
        uxMode: "guided",
        currentStepId: restoredSession?.currentStepId || "type",
        selectedArchetypeId: restoredSession?.selectedGoalTemplateId || "",
        selectedGoalTemplateId: restoredSession?.selectedGoalTemplateId || "",
        goalDraft: restoredSession?.goalDraft || {},
        compiledGoal: restoredSession?.compiledGoal || null,
        searchStatus: restoredSession?.searchStatus || "idle",
        lastSearchResult: restoredSession?.lastSearchResult || null,
        lastSearchContextFingerprint: restoredSession?.lastSearchContextFingerprint || "",
        lastSearchEngineFingerprint: restoredSession?.lastSearchEngineFingerprint || "",
      },
      onUpdate: ({ state: flowState, questions, recommendation, archetypes }) => {
        const currentStepId = String(flowState.currentStepId || "type");
        const currentStepIndex = starGuidedStepIndex(currentStepId);
        const filteredQuestions = (questions || []).filter(
          (question) => String(question?.stepId || "goal-details") === currentStepId,
        );
        const questionValues = buildStarGoalQuestionValues(flowState, filteredQuestions);
        const hasGoalStep = (questions || []).some(
          (question) => question?.stepId === "goal-details",
        );
        const steps = starGuidedSteps.map((step, index) => ({
          ...step,
          disabled:
            (step.id !== "type" && !flowState.selectedGoalTemplateId) ||
            (step.id === "goal-details" && !hasGoalStep) ||
            (step.id === "recommendation" &&
              (!flowState.selectedGoalTemplateId || index > currentStepIndex + 1)),
        }));

        const panel = createGuidedPanel({
          title: "Star Goal Builder",
          subtitle:
            "Choose the stellar outcome you want, set scope and search budget, then compile and run a seeded goal search before applying the recommendation.",
          steps,
          currentStepId,
          archetypes: (archetypes || []).filter((entry) => entry?.guidedEnabled !== false),
          selectedArchetypeId: flowState.selectedGoalTemplateId || "",
          typeSupplement:
            currentStepId === "type" ? buildStarGoalTextAssist(() => controller, flowState) : null,
          questions: filteredQuestions,
          answers: questionValues,
          recommendation,
          status: currentStepId === "recommendation" ? buildStarGoalStatus(flowState) : null,
          previewContent:
            currentStepId === "recommendation"
              ? createStarGuidedPreviewContent(recommendation)
              : null,
          visibleSections: {
            type: currentStepId === "type",
            questions: currentStepId === "stellar-context" || currentStepId === "goal-details",
            status: currentStepId === "recommendation",
            recommendation: currentStepId === "recommendation",
            diagnostics: currentStepId === "recommendation",
          },
          typeSectionTitle: "Star Goal",
          questionSectionTitle:
            currentStepId === "stellar-context" ? "Search Setup" : "Goal Traits",
          recommendationSectionTitle: "Best Stellar Fit",
          diagnosticSectionTitle: "Search Diagnostics",
          actions: [
            ...(currentStepId !== "type" ? [{ id: "back", label: "Back" }] : []),
            ...(currentStepId !== "recommendation"
              ? [
                  {
                    id: "next",
                    label: currentStepId === "goal-details" ? "Review Goal Search" : "Next",
                    disabled: currentStepId === "type" && !flowState.selectedGoalTemplateId,
                  },
                ]
              : [
                  {
                    id: "compile",
                    label: "Compile Goal",
                    disabled:
                      !flowState.selectedGoalTemplateId || flowState.searchStatus === "searching",
                  },
                  {
                    id: "run-search",
                    label: flowState.searchStatus === "searching" ? "Searching..." : "Run Search",
                    disabled:
                      !flowState.selectedGoalTemplateId || flowState.searchStatus === "searching",
                  },
                  {
                    id: "apply",
                    label: "Apply",
                    disabled:
                      !recommendation ||
                      recommendation.hasBlockingDiagnostics ||
                      flowState.searchStatus !== "complete",
                  },
                  {
                    id: "apply-advanced",
                    label: "Apply and open Advanced",
                    disabled:
                      !recommendation ||
                      recommendation.hasBlockingDiagnostics ||
                      flowState.searchStatus !== "complete",
                  },
                ]),
            { id: "reset", label: "Reset", className: "is-secondary" },
          ],
          onArchetypeSelect: (goalTemplateId) =>
            controller?.reset({
              objectType: "star",
              uxMode: "guided",
              currentStepId: "type",
              selectedArchetypeId: goalTemplateId,
              selectedGoalTemplateId: goalTemplateId,
            }),
          onQuestionChange: (questionId, value) =>
            setStarGoalDraftValue(controller, flowState, questionId, value),
          onStepSelect: (stepId, step) => {
            if (step?.disabled) return;
            controller?.setStep(stepId);
          },
          onAction: (actionId) => {
            if (actionId === "reset") {
              controller?.reset({
                objectType: "star",
                uxMode: "guided",
                currentStepId: "type",
              });
              return;
            }
            if (actionId === "back") {
              controller?.setStep(previousStarGuidedStepId(flowState, questions));
              return;
            }
            if (actionId === "next") {
              controller?.setStep(nextStarGuidedStepId(flowState, questions));
              return;
            }
            if (actionId === "compile") {
              controller?.compileGoal();
              return;
            }
            if (actionId === "run-search") {
              void controller?.startSearch();
              return;
            }
            if ((actionId === "apply" || actionId === "apply-advanced") && recommendation) {
              controller?.apply({
                applyStarRecommendation: (nextRecommendation) =>
                  applyStarGuidedRecommendation(nextRecommendation, {
                    noticeLabel: recommendation.title || "Guided star",
                  }),
              });
              close();
            }
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("star", {
          ...sessionTarget,
          uxMode: "guided",
          ...buildGuidedSessionSnapshot(flowState, {
            currentStepId: flowState.currentStepId || "type",
          }),
        });
      },
    });

    overlayClosers.add(preserveClose);
    closeButtonEl.addEventListener("click", close);
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlayEl);
  }

  // Initial population
  topologyKindEl.value = state.topologyKind;
  const quadLayoutRadio = wrap.querySelector(
    `#${state.quadLayoutKind === "paired" ? "quadLayoutPaired" : "quadLayoutChain"}`,
  );
  if (quadLayoutRadio) quadLayoutRadio.checked = true;
  companionNameEl.value = state.companionName;
  companionMassEl.value = state.companionMassMsol;
  binarySemiMajorAxisEl.value = state.binarySemiMajorAxisAu;
  binaryEccentricityEl.value = state.binaryEccentricity;
  binaryInclinationEl.value = state.binaryInclinationDeg;
  binaryArgPeriapsisEl.value = state.binaryArgPeriapsisDeg;
  binaryMeanAnomalyEl.value = state.binaryMeanAnomalyDeg;
  tertiaryNameEl.value = state.tertiaryName;
  tertiaryMassEl.value = state.tertiaryMassMsol;
  tripleOuterSemiMajorAxisEl.value = state.tripleOuterSemiMajorAxisAu;
  tripleOuterEccentricityEl.value = state.tripleOuterEccentricity;
  tripleOuterInclinationEl.value = state.tripleOuterInclinationDeg;
  tripleOuterArgPeriapsisEl.value = state.tripleOuterArgPeriapsisDeg;
  tripleOuterMeanAnomalyEl.value = state.tripleOuterMeanAnomalyDeg;
  quaternaryNameEl.value = state.quaternaryName;
  quaternaryMassEl.value = state.quaternaryMassMsol;
  quadOuterSemiMajorAxisEl.value = state.quadOuterSemiMajorAxisAu;
  quadOuterEccentricityEl.value = state.quadOuterEccentricity;
  quadOuterInclinationEl.value = state.quadOuterInclinationDeg;
  quadOuterArgPeriapsisEl.value = state.quadOuterArgPeriapsisDeg;
  quadOuterMeanAnomalyEl.value = state.quadOuterMeanAnomalyDeg;
  const evolutionRadio = wrap.querySelector(
    `#${state.evolutionMode === "evolved" ? "evolutionOn" : "evolutionOff"}`,
  );
  if (evolutionRadio) evolutionRadio.checked = true;
  syncFocusedStarEditorInputs();
  render();

  // Live-update: apply on every input change
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
  ].forEach((el) => el.addEventListener("input", () => applyFromInputs()));
  [
    nameEl,
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
  ].forEach((el) => el.addEventListener("change", () => applyFromInputs({ commit: true })));

  wrap.querySelector("#radiusClear").addEventListener("click", () => {
    radiusOverrideEl.value = "";
    applyFromInputs({ commit: true });
  });

  wrap.querySelector("#luminosityClear").addEventListener("click", () => {
    luminosityOverrideEl.value = "";
    applyFromInputs({ commit: true });
  });

  wrap.querySelector("#tempClear").addEventListener("click", () => {
    tempOverrideEl.value = "";
    applyFromInputs({ commit: true });
  });

  // Live-update the UI layout when the mode toggle or dropdown changes
  physicsModeRadios.forEach((r) => {
    r.addEventListener("change", () => {
      applyFromInputs({ commit: true });
    });
  });

  evolutionModeRadios.forEach((r) => {
    r.addEventListener("change", () => {
      state.evolutionMode = r.value;
      applyFromInputs({ commit: true });
    });
  });

  physicsDerivRadios.forEach((r) => {
    r.addEventListener("change", () => {
      applyFromInputs({ commit: true });
    });
  });

  [companionNameEl, companionMassEl].forEach((el) =>
    el?.addEventListener("change", () => applyCompatStarInputs("star_b", { commit: true })),
  );
  [tertiaryNameEl, tertiaryMassEl].forEach((el) =>
    el?.addEventListener("change", () => applyCompatStarInputs("star_c", { commit: true })),
  );
  [quaternaryNameEl, quaternaryMassEl].forEach((el) =>
    el?.addEventListener("change", () => applyCompatStarInputs("star_d", { commit: true })),
  );

  topologyKindEl?.addEventListener("change", () => {
    applyFromInputs({ commit: true });
  });
  topologyCardGridEl?.addEventListener("click", (event) => {
    const buttonEl = event.target?.closest?.('button[data-architecture-kind="topology"]');
    const nextTopologyKind = String(buttonEl?.dataset?.value || "");
    if (!["single", "binary", "triple", "quad"].includes(nextTopologyKind)) return;
    topologyKindEl.value = nextTopologyKind;
    applyFromInputs({ commit: true });
  });
  quadLayoutRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      state.quadLayoutKind = normalizeQuadLayoutKind(radio.value, state.quadLayoutKind);
      applyFromInputs({ commit: true });
    });
  });
  quadLayoutCardGridEl?.addEventListener("click", (event) => {
    const buttonEl = event.target?.closest?.('button[data-architecture-kind="quad-layout"]');
    const nextLayoutKind = normalizeQuadLayoutKind(buttonEl?.dataset?.value, state.quadLayoutKind);
    const nextQuadLayoutRadio = wrap.querySelector(
      `#${nextLayoutKind === "paired" ? "quadLayoutPaired" : "quadLayoutChain"}`,
    );
    if (nextQuadLayoutRadio) nextQuadLayoutRadio.checked = true;
    state.quadLayoutKind = nextLayoutKind;
    applyFromInputs({ commit: true });
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
    editorUiState.pendingTopologyMapFocusId = nodeId;
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

  starCreateQuickBtn?.addEventListener("click", () => {
    openStarGuidedQuickPicker();
  });
  starCreateGuidedBtn?.addEventListener("click", () => {
    openStarGuidedFlow();
  });

  wrap.querySelector("#btn-sol").addEventListener("click", () => {
    const focusedStarId = getFocusedStarEditorId();
    const nextName =
      focusedStarId === "star_a"
        ? sanitiseName(nameEl.value)
        : focusedStarId === "star_b"
          ? sanitiseCompanionName(nameEl.value)
          : focusedStarId === "star_c"
            ? sanitiseTertiaryName(nameEl.value)
            : sanitiseQuaternaryName(nameEl.value);
    // "Sol-ish" (simple): mass 1, age ~4.6 Gyr
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
    state.evolutionMode = "zams";
    syncFocusedStarEditorInputs();
    persistState();
    render();
  });

  wrap.querySelector("#btn-reset").addEventListener("click", () => {
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
    state.evolutionMode = "zams";
    syncFocusedStarEditorInputs();
    persistState();
    render();
  });

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
