// SPDX-License-Identifier: MPL-2.0
import { calcMoon } from "../engine/moon.js";
import { calcGasGiant } from "../engine/gasGiant.js";
import { fmt } from "../engine/utils.js";
import { bindNumberAndSlider } from "./bind.js";
import { computeMoonVisualProfile, MOON_RECIPES } from "./moonStyles.js";
import {
  createCelestialVisualPreviewController,
  renderCelestialRecipeBatch,
} from "./celestialVisualPreview.js";
import {
  createMoonRecipePickerOverlay,
  renderMoonKpiSections,
  renderMoonDerivedDetails,
  renderMoonParentSelector,
  renderMoonSelector,
} from "./moon/domRender.js";
import {
  loadWorld,
  updateWorld,
  listPlanets,
  listMoons,
  listSystemGasGiants,
  getSelectedMoon,
  getStarOverrides,
  selectMoon,
  createMoonFromInputs,
  deleteMoon,
  updateMoon,
  assignMoonToPlanet,
} from "./store.js";
import { attachTooltips, tipIcon } from "./tooltip.js";
import { createTutorial } from "./tutorial.js";

const TIP_LABEL = {
  "Star Mass": "Host star mass in solar masses.\n\nSun = 1 Msol.",
  "Star Radius": "Host star radius in solar radii.\n\nSun = 1 Rsol.",
  "Star Luminosity": "Host star luminosity in solar luminosities.\n\nSun = 1 Lsol.",
  "Star Age": "Age of the host star in billions of years.",
  "Planet Mass": "Parent planet mass in Earth masses.\n\nEarth = 1 MEarth.",
  "Planet CMF": "Parent planet core mass fraction.",
  "Planet Density": "Parent planet bulk density in g/cm\u00B3.\n\nEarth = 5.51 g/cm\u00B3.",
  "Planet Radius": "Parent planet radius in Earth radii.\n\nEarth = 1 REarth = 6,371 km.",
  "Planet Gravity":
    "Surface gravity at sea level on the parent planet.\n\nEarth = 1 g = 9.8 m/s\u00B2.",
  "Planet Semi-Major Axis":
    "Orbital distance of the parent planet from the host star in AU.\n\nEarth = 1 AU.",
  "Planet Eccentricity": "Orbital eccentricity of the parent planet.\n\nEarth = 0.0167.",
  "Planet Periapsis": "Closest approach of the parent planet to the host star during orbit.",
  "Planet Orbital Period": "Orbital period (year length) of the parent planet in Earth days.",
  "Planet Rotation Period": "Rotation period (day length) of the parent planet in Earth hours.",
  Mass: "Moon mass in lunar masses. Moons should be less massive than their parent planet.\n\nMoon = 1 MMoon = 7.342E22 kg.",
  Density:
    "Bulk density of the moon in g/cm\u00B3. Rocky moons typically exceed 3 g/cm\u00B3.\n\nMoon = 3.34 g/cm\u00B3.",
  Radius:
    "Moon radius in lunar radii. Major moons typically exceed 0.173 RMoon.\n\nMoon = 1 RMoon = 1,736.4 km.",
  Gravity:
    "Surface gravity on the moon relative to Earth.\n\nEarth = 1 g = 9.8 m/s\u00B2.\nMoon = 0.17 g = 1.62 m/s\u00B2.",
  "Escape Velocity":
    "Speed required to escape the gravitational pull of the moon.\n\nMoon = 2.38 km/s. Earth = 11.2 km/s.",
  Albedo:
    "Bond albedo of the moon, measuring reflectivity on a scale of 0 to 1.\n\n0 = perfect absorber. 1 = perfect reflector.\n\nMercury = 0.068\nVenus = 0.77\nEarth = 0.306\nMoon = 0.11\nJupiter = 0.343\nSaturn = 0.342\nUranus = 0.30\nNeptune = 0.29\nPluto = 0.49",
  "Moon Zone (Inner)":
    "Closest stable orbit for the moon. Any closer and tidal forces tear it apart (the Roche limit).",
  "Moon Zone (Outer)":
    "Farthest stable orbit for the moon. Beyond this distance the moon is no longer gravitationally bound.",
  "Semi-Major Axis":
    "Orbital distance from the planet in km.\n\nFor moons of habitable Earth-like planets, the semi-major axis should fall between Moon Zone (Inner) and half of Moon Zone (Outer). Multiple major moons should be spaced at least 10 planetary radii apart.\n\nThe app clamps this value on Apply to keep the orbit inside the Moon Zone.\n\nMoon = 384,748 km.",
  Eccentricity:
    "Orbital eccentricity of the moon (0\u20131).\n\n0 = perfect circle. 1 = parabola.\n\nMajor moons should have very low eccentricities.\n\nMoon = 0.055.",
  Periapsis:
    "Closest approach of the moon to the planet during orbit.\n\nShould fall between Moon Zone (Inner) and Moon Zone (Outer).",
  Apoapsis:
    "Farthest point of the moon from the planet during orbit.\n\nShould fall between Moon Zone (Inner) and Moon Zone (Outer).",
  Inclination:
    "Inclination of the moon's orbit relative to the planet's orbital plane.\n\nRange: 0\u2013180\u00b0. Major moons should have very low inclinations.\n\nMoon = 5.15\u00b0 (with respect to the ecliptic).",
  "Orbital Direction":
    "Prograde = the moon orbits the planet in the same direction as the planet's spin.\n\nRetrograde = the moon orbits the planet in the opposite direction of the planet's spin.\n\nUndefined = the orbital inclination is exactly 90\u00ba, so the orbit is classed as neither prograde nor retrograde.\n\nMajor moons of habitable Earth-like planets should be on prograde orbits.",
  "Orbital Period (sidereal)":
    "The time it takes the moon to complete one orbit of the planet with respect to the background stars, in Earth days.",
  "Orbital Period (synodic)":
    "The time between successive occurrences of the same lunar phase (e.g. full moon to full moon).\n\nThis value represents a lunar month on the planet.",
  "Rotation Period":
    "The time it takes the moon to complete one full rotation about its axis.\n\nIf tidally locked, the rotation period equals the synodic orbital period (the moon always shows the same face to the planet).\n\nIf not yet locked, an estimated current period is shown based on exponential tidal despinning from the initial rotation period.",
  "Total Tidal Force":
    "Total tidal force exerted on the planet by the moon and the star, relative to the tidal forces exerted on Earth.\n\n<1 = tides less extreme than Earth.\n~1 = tides comparable to Earth.\n>1 = tides more extreme than Earth.",
  "Moon Contribution":
    "Fraction of the total tidal force contributed by the moon.\n\nMoon \u2248 66% (Earth\u2013Moon system).",
  "Star Contribution":
    "Fraction of the total tidal force contributed by the host star.\n\nSun \u2248 33% (Earth\u2013Moon system).",
  "Moon locked to Planet?":
    'Checks whether the moon is tidally locked to the planet.\n\nA body is tidally locked when it takes the same amount of time to spin about its axis as it does to orbit its companion. Tidally locked objects always present the same face to their companion.\n\nMajor moons should always be tidally locked to the planet, i.e., the expected output is "Yes".',
  "Planet locked to Moon?":
    "Checks whether the planet is tidally locked to the moon.\n\nThe calculations used here are rough approximations, so the output is necessarily imprecise. Outputs that display in red indicate a likely problematic configuration. Adjust the moon's semi-major axis to change the result.",
  "Planet locked to Star?":
    'Checks whether the planet is expected to be tidally locked to its star.\n\nWorldSmith Web uses a user-friendly rule: this shows "Yes" when the computed Planet\u2192Star lock time is less than or equal to the current star age.\n\nFor an Earth-like setup, this should usually remain "No".',
  "Derived Data": "Read-only star and planet context used for moon calculations.",
  "Moon selection": "Saved moon currently being edited.",
  "Editing moon": "Moon selector with create and delete controls.",
  "Belongs to planet": "Parent planet this moon orbits. May be left unassigned.",
  Identity: "Identity fields for the currently selected moon.",
  Name: "Display name for the moon, used across tabs and exports.",
  Orbit: "Orbital inputs that determine moon distance, periods, and lock behaviour.",
  Physical: "Physical inputs used to derive radius, gravity, and escape velocity.",
  Composition:
    "Inferred from bulk density as a proxy for rock/ice fraction. Controls the material rigidity (\u03BC) and tidal quality factor (Q) used in tidal lock and heating calculations.\n\nDensity alone is often enough for cold, geologically quiet moons. But moons with extreme internal states \u2014 active volcanism or subsurface oceans \u2014 have much softer interiors than their bulk density implies. Use the Composition Override dropdown to select a special class when your moon has one of these conditions.\n\nIron-rich (>5 g/cm\u00B3): Dense metallic core, like Mercury.\nRocky (3.2\u20135 g/cm\u00B3): Solid silicate mantle. Earth\u2019s Moon, Io (cold).\nMixed rock/ice (2\u20133.2 g/cm\u00B3): Roughly equal rock and ice. Europa.\nIcy (1\u20132 g/cm\u00B3): Mostly water ice with some rock. Ganymede, Titan.\nVery icy (<1 g/cm\u00B3): Dominated by volatile ices. Cometary bodies.\n\nSpecial overrides (see Composition Override tooltip):\nSubsurface ocean: Liquid layer decouples the ice shell (\u03BC = 0.3 GPa, Q = 2).\nPartially molten: Magma interior from extreme tidal heating (\u03BC = 10 GPa, Q = 10).",
  "Composition Override":
    "Override the density-derived composition class with a specific interior state. Density is a good proxy for cold, solid moons, but it underestimates tidal heating by 10\u2013100\u00D7 for moons with extreme interiors.\n\nAuto (from density): Default. Best for geologically quiet moons.\n\nVery icy: Cometary or outer solar system bodies dominated by volatile ices. Low density (<1 g/cm\u00B3).\n\nIcy: Mostly water ice with some rock. Ganymede, Callisto, Rhea. Density 1\u20132 g/cm\u00B3.\n\nSubsurface ocean: A global liquid ocean beneath a thin ice shell dramatically softens the body and amplifies tidal dissipation. Use for moons showing signs of geological activity despite low density (cryovolcanism, plumes, young surface). Calibrated to Enceladus: predicted heating matches Cassini observations within 10%. WARNING: over-predicts for large moons like Titan (\u223C37\u00D7 too high) \u2014 use Icy for those.\n\nMixed rock/ice: Roughly half rock, half ice. Europa\u2019s density (3.0 g/cm\u00B3) places it here. Good default for moons of giant planets with intermediate density.\n\nRocky: Solid silicate mantle, like Earth\u2019s Moon (3.34 g/cm\u00B3). Appropriate for tidally quiet rocky moons.\n\nPartially molten: Extreme tidal heating has melted the interior, creating a magma ocean or mushy mantle. This makes the body much softer than solid rock, dramatically increasing dissipation. Use for moons in strong orbital resonances with high volcanic activity. Calibrated to Io: predicted heating matches observed 10\u00B9\u2074 W within 1%.\n\nIron-rich: Dense metallic body (>5 g/cm\u00B3). Very stiff, dissipates little energy. Mercury-like composition.",
  Dynamics: "Optional inputs that affect tidal evolution timescales.",
  "Initial Rotation Period":
    "Primordial spin period of the moon before tidal braking. Faster spin (shorter period) means more angular momentum to dissipate and a longer time to reach tidal lock.\n\nDefault: 12 hours (model assumption from accretion dynamics). Range varies widely \u2014 fast-spinning bodies can be as short as 2\u20133 hours (near breakup), while captured moons may spin much slower.\n\nThis value feeds directly into the tidal locking timescale calculation.",
  "Tidal Heating":
    "Surface heat flux from tidal deformation of the moon by its parent body. Uses the Wisdom (2008) formula with higher-order eccentricity corrections that remain accurate up to e \u2248 0.8.\n\nHigher eccentricity and closer orbits produce more heating. Io: ~0.3\u20132 W/m\u00B2 (highest in the Solar System). Earth's geothermal flux: 0.09 W/m\u00B2.\n\nTidal-thermal feedback: for rocky moons (\u03C1 \u2265 3.2), when tidal flux exceeds ~0.02 W/m\u00B2 the model automatically lowers Q and \u03BC toward partially-molten values, modelling the positive feedback loop that drives Io-like volcanism in orbital resonances.",
  "Tidal Heating (\u00D7 Earth)":
    "Tidal surface heat flux normalised to Earth's mean geothermal heat flux (0.09 W/m\u00B2).\n\n<1 = less than Earth's internal heat. >1 = more. Io \u2248 4\u00D7 Earth (equilibrium model).",
  "Orbital Recession":
    "Rate of orbital migration due to tidal dissipation. Positive = outward (planet spins faster than moon orbits, like Earth\u2013Moon at +3.8 cm/yr). Negative = inward (planet spins slower, like Phobos spiralling toward Mars).\n\nDriven by two competing effects: the planet\u2019s tidal bulge transfers angular momentum, while the moon\u2019s own dissipation damps the orbit inward.",
  "Orbital Fate":
    "Linear extrapolation of the current recession rate to estimate when the moon reaches the Roche limit (tidal disruption) or escapes the Hill sphere.\n\nThis is a rough estimate \u2014 real orbital evolution is non-linear and depends on changing tidal parameters over geological time.",
  Limits: "Derived orbital limits and lock times for the selected moon.",
  "Tidal locking": "Lock times and current lock state for the moon\u2013planet\u2013star system.",
  "Equilibrium Temp":
    "Temperature from stellar radiation alone, assuming no atmosphere (airless body)." +
    "\n\nUses the Stefan-Boltzmann equilibrium: T = (L(1\u2212a) / 16\u03C0\u03C3d\u00B2)\u00BC, " +
    "where a is Bond albedo and d is star distance.",
  "Surface Temp":
    "Estimated mean surface temperature including stellar radiation, tidal heating, " +
    "radiogenic heating, and any modeled atmospheric greenhouse warming." +
    "\n\nFor airless bodies, this stays close to the radiative equilibrium. Tidal heating " +
    "dominates for close-orbit moons like Io; greenhouse warming matters most for " +
    "volatile-rich moons such as Titan-like cases.",
  "Climate State":
    "High-level moon climate regime derived from the moon-specific climate model.\n\n" +
    "Stable, Snowball, Moist greenhouse, and Runaway greenhouse states reflect the modeled surface-water and temperature outcomes after planetshine, eclipses, and internal heating are considered.",
  "Surface Temp Range":
    "Estimated climate envelope for the moon's modeled surface temperature.\n\n" +
    "This Stage M3 output combines seasonal forcing, synchronous parentshine contrast, and eclipse cooling into a first-pass min/max surface-temperature range.",
  "Climate Zones":
    "Moon climate-zone summary from the parent-coupled moon climate model.\n\n" +
    "The current implementation reuses the Koppen-style zone classifier with moon-specific mean temperature, water state, pressure, and effective seasonal forcing.",
  Seasonality:
    "Qualitative description of the moon's climate variability.\n\n" +
    "This combines seasonal forcing, eclipse duty cycle, and parentshine contrast to indicate whether the moon behaves as a low-, moderate-, strong-, or extreme-seasonality world.",
  Planetshine:
    "Average climate forcing from the parent body's reflected starlight plus thermal emission.\n\n" +
    "Close-in large moons should show stronger parentshine than distant or small-parent cases.",
  "Eclipse Cooling":
    "Fraction of the stellar energy budget lost to eclipses by the parent body.\n\n" +
    "Low-inclination close moons experience deeper eclipse forcing than high-inclination or distant moons.",
  Atmosphere:
    "Derived moon atmosphere class from the retained volatile inventory.\n\n" +
    "Airless and exosphere states indicate no meaningful surface atmosphere. Thin, substantial, and dense volatile atmospheres represent retained or replenished gases near the surface.",
  "Surface Pressure":
    "Total modeled moon surface pressure from retained volatile species.\n\n" +
    "This is derived from the retained volatile inventory rather than a manual input. Higher values generally support stronger greenhouse warming and denser near-surface air.",
  "Atmosphere Composition":
    "Top atmosphere species by modeled pressure share.\n\n" +
    "This is a volatile-atmosphere composition summary, not a full photochemical equilibrium model.",
  "Atmosphere Mix":
    "Top atmosphere species by modeled pressure share.\n\n" +
    "This is a volatile-atmosphere composition summary, not a full photochemical equilibrium model.",
  "Greenhouse Warming":
    "Approximate surface warming above the moon's airless equilibrium / internal-heating baseline.\n\n" +
    "This Stage M1 model supports volatile greenhouse warming and a simple methane anti-greenhouse penalty, but not full haze photochemistry yet.",
  "Volcanic Activity":
    "Derived silicate-volcanism signal from tidal heating, radiogenic heating, interior class, and bulk size/gravity.\n\n" +
    "High values indicate Io-like or strongly molten rocky interiors that are likely to refresh the surface with lava or outgassed material.",
  "Cryovolcanic Activity":
    "Derived icy-moon cryovolcanism signal from subsurface-water support, internal heating, composition, and venting ease.\n\n" +
    "High values indicate plumes or icy resurfacing that can resupply water-rich volatiles from beneath the surface.",
  Cryovolcanism:
    "Derived icy-moon cryovolcanism signal from subsurface-water support, internal heating, composition, and venting ease.\n\n" +
    "High values indicate plumes or icy resurfacing that can resupply water-rich volatiles from beneath the surface.",
  Resurfacing:
    "High-level surface-renewal class derived from the stronger of the silicate-volcanic and cryovolcanic channels.\n\n" +
    "Quiet moons should stay cratered, while Io-like or Enceladus-like cases should move into active resurfacing classes.",
  "Volatile Replenishment":
    "Tendency for internal activity to resupply the moon's surface or near-surface volatile inventory.\n\n" +
    "This is a source-side signal from volcanism / cryovolcanism, not a guarantee that the moon can retain a long-lived atmosphere.",
  "Ocean Persistence":
    "Tendency for liquid-water reservoirs to persist over time under the current heating, water inventory, and bulk-property assumptions.\n\n" +
    "This favors moons with supported subsurface or surface oceans, enough internal heat, and sufficient bulk support to avoid a purely frozen shell.",
  "Volatile Supply":
    "Tendency for internal activity to resupply the moon's surface or near-surface volatile inventory.\n\n" +
    "This is a source-side signal from volcanism / cryovolcanism, not a guarantee that the moon can retain a long-lived atmosphere.",
  Biosphere:
    "High-level surface-biology classification from the moon biosphere model.\n\n" +
    "This stage estimates whether exposed surface environments are sterile, only marginally habitable for microbes, or plausibly supportive of richer biospheres.",
  "Surface Biosphere":
    "High-level surface-biology classification from the moon biosphere model.\n\n" +
    "This stage estimates whether exposed surface environments are sterile, only marginally habitable for microbes, or plausibly supportive of richer biospheres.",
  "Plant Life":
    "Plant-life plausibility is a stricter gate than PHI.\n\n" +
    "It depends on atmosphere adequacy, accessible surface water, climate livability, radiation, stellar spectrum, and the moon's illumination regime. A moon can have a moderate habitability score and still fail the plant-life gate.",
  Vegetation:
    "Whether the current moon biosphere gate supports visible surface vegetation.\n\n" +
    "This is only enabled when plant-life plausibility is high enough and the current atmosphere, water access, climate, and radiation conditions all support persistent surface flora.",
  "Vegetation Colours":
    "First-pass vegetation colours for supported biosphere cases.\n\n" +
    "This reuses the same star-spectrum vegetation-colour logic as rocky planets, but only after the moon biosphere gate says surface vegetation is plausible.",
  "Veg Colours":
    "First-pass vegetation colours for supported biosphere cases.\n\n" +
    "This reuses the same star-spectrum vegetation-colour logic as rocky planets, but only after the moon biosphere gate says surface vegetation is plausible.",
  "Biosphere Limits":
    "Primary reasons the current moon does or does not support surface biology.\n\n" +
    "Use this readout to see which inputs are blocking exposed life or vegetation under the current model assumptions.",
  "Life Limits":
    "Primary reasons the current moon does or does not support surface biology.\n\n" +
    "Use this readout to see which inputs are blocking exposed life or vegetation under the current model assumptions.",
  Hydrosphere:
    "Derived moon water-state summary.\n\n" +
    "Stage M2 separates dry, surface-liquid, frozen-surface, steam, and subsurface-ocean cases so the model can distinguish ocean moons from icy moons with buried water.",
  "Surface Water":
    "Modeled surface water state and coverage.\n\n" +
    "This reports accessible liquid water when present, otherwise the dominant surface water phase such as ice or vapour.",
  "Subsurface Ocean":
    "Heuristic score for a buried liquid-water ocean beneath the surface ice shell.\n\n" +
    "Europa-like and Enceladus-like cases should reach a clear 'Yes'. Lower scores mean a buried ocean is only a possibility under the current inputs.",
  "Ocean Depth":
    "Heuristic depth estimate for the moon's dominant liquid-water layer.\n\n" +
    "Surface-ocean moons report an exposed ocean depth. Frozen ocean worlds report the estimated buried-ocean depth instead.",
  "Ice Shell":
    "Estimated thickness of the frozen surface shell above the liquid layer.\n\n" +
    "This is only shown for frozen-surface cases and is intended as a first-pass structural estimate.",
  "High-pressure Ice Barrier":
    "Flags when the modeled ocean is deep enough that high-pressure ice is likely to form beneath it.\n\n" +
    "If present, the ocean may be partially separated from deeper rocky material by dense ice phases.",
  "High-Pressure Ice":
    "Flags when the modeled ocean is deep enough that high-pressure ice is likely to form beneath it.\n\n" +
    "If present, the ocean may be partially separated from deeper rocky material by dense ice phases.",
  "Radiogenic Heating":
    "Internal heat from radioactive decay (U, Th, K) on the moon\u2019s surface." +
    "\n\nScales from Earth\u2019s 44 TW by moon mass and the system\u2019s radioisotope " +
    "abundance setting. Typically small compared to tidal heating.",
  "Magnetospheric Radiation":
    "Charged-particle radiation dose from the host planet\u2019s magnetosphere." +
    "\n\nScales as B\u00B3 at the moon\u2019s orbit (dipole field), calibrated to " +
    "Jupiter\u2013Europa (~540 rem/day). Zero if the moon orbits outside the " +
    "magnetopause. Upper estimate \u2014 actual doses may be lower due to ring " +
    "absorption and loss processes.",
  "Magnetosphere Dose":
    "Charged-particle radiation dose from the host planet\u2019s magnetosphere." +
    "\n\nScales as B\u00B3 at the moon\u2019s orbit (dipole field), calibrated to " +
    "Jupiter\u2013Europa (~540 rem/day). Zero if the moon orbits outside the " +
    "magnetopause. Upper estimate \u2014 actual doses may be lower due to ring " +
    "absorption and loss processes.",
  "Earth Similarity Index":
    "Compares this moon to Earth using radius, density, escape velocity, and surface temperature." +
    "\n\nRange: 0 to 1, where 1 is most Earth-like. Earth-likeness is not the same as direct habitability.",
  "Habitability Index":
    "WorldSmith comparative habitability model for moons." +
    "\n\nThis is PHI-inspired, not a direct literature PHI implementation. The score depends on the selected solvent pathway and the active solvent-policy support for surface water, subsurface water, and alternative solvents." +
    "\n\nUse the expanded KPI details to see the current pathway, policy version, and term breakdown.",
};

const TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "The Moons page creates and configures natural satellites. Select a moon " +
      "from the dropdown, or create a new one. Assign it to a parent planet " +
      "or gas giant using the parent selector.",
  },
  {
    title: "Orbit Setup",
    body:
      "Set semi-major axis, eccentricity, and inclination. The semi-major axis " +
      "is automatically clamped to the parent\u2019s moon zone \u2014 between the Roche " +
      "limit and Hill sphere.",
  },
  {
    title: "Physical Properties",
    body:
      "Adjust mass, density, albedo, and composition. Use the composition " +
      "override dropdown for special scenarios like subsurface oceans or " +
      "partially molten interiors.",
  },
  {
    title: "Tidal System",
    body:
      "Outputs show tidal forces, heating, and locking timescales. Check " +
      "whether the moon is tidally locked to its planet, and whether the " +
      "planet is locked to its star or moon.",
  },
  {
    title: "Recipes",
    body:
      "Click Recipes on the appearance preview to apply presets like Luna, " +
      "Europa, Io, or Titan. Each recipe configures orbit and physical inputs " +
      "for a realistic moon archetype.",
  },
];

export function initMoonPage(mountEl) {
  const world = loadWorld();

  const sov0 = getStarOverrides(world.star);
  const state = {
    starMassMsol: Number(world.star.massMsol),
    starAgeGyr: Number(world.star.ageGyr),
    starMetallicityFeH: Number(world.star.metallicityFeH) || 0,
    starRadiusRsolOverride: sov0.r,
    starLuminosityLsolOverride: sov0.l,
    starTempKOverride: sov0.t,
    starEvolutionMode: sov0.ev,
    planet: { ...world.planet },
    moon: { ...world.moon },
  };
  const celestialPreviewController = createCelestialVisualPreviewController({
    speedDaysPerSec: 0.5,
  });

  const wrap = document.createElement("div");
  wrap.className = "page";
  wrap.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--moons" aria-hidden="true"></span><span>Moons</span></h1>
        <button id="moonTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        <div class="hint">Create moons for selected planets and tune orbit/physical inputs. Use outputs to check periods, lock state, and tides.</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">

          <div class="label">Derived Data ${tipIcon(TIP_LABEL["Derived Data"] || "")}</div>
          <div class="derived-readout" id="context"></div>

          <div style="height:12px"></div>

          <div class="label">Moon selection ${tipIcon(TIP_LABEL["Moon selection"] || "")}</div>
          <div class="form-row">
            <div>
              <div class="label">Editing moon ${tipIcon(TIP_LABEL["Editing moon"] || "")}</div>
              <div class="hint">Create multiple moons and assign each to a planet.</div>
            </div>
            <div class="select-stack">
              <select id="moonSelect"></select>
              <div class="select-actions">
                <button id="moonNew" class="small" type="button">New</button>
                <button id="moonDelete" class="small danger" type="button">Delete</button>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div>
              <div class="label">Belongs to planet ${tipIcon(TIP_LABEL["Belongs to planet"] || "")}</div>
              <div class="hint">Set a parent planet or leave this moon unassigned.</div>
            </div>
            <select id="moonPlanetSelect"></select>
          </div>

          <div style="height:10px"></div>

<div class="label">Identity ${tipIcon(TIP_LABEL["Identity"] || "")}</div>
          <div class="form-row">
            <div>
              <div class="label">Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
              <div class="hint">Used in exports and print view.</div>
            </div>
            <input id="name" type="text" />
          </div>

          <div style="height:8px"></div>
          <div class="label">Orbit ${tipIcon(TIP_LABEL["Orbit"] || "")}</div>

          ${numWithSlider("a", "Semi-Major Axis", "km", "", 10, 1e9, 100, "Semi-Major Axis")}
          ${numWithSlider("e", "Eccentricity", "", "", 0, 0.99, 0.001, "Eccentricity")}
          ${numWithSlider("inc", "Inclination", "°", "", 0, 180, 0.1, "Inclination")}

          <div style="height:8px"></div>
          <div class="label">Physical ${tipIcon(TIP_LABEL["Physical"] || "")}</div>

          ${numWithSlider("m", "Mass", "MMoon", "", 1e-8, 1000, 1e-8, "Mass")}
          ${numWithSlider("density", "Density", "g/cm³", "", 0.1, 20, 0.01, "Density")}
          ${numWithSlider("albedo", "Albedo", "", "", 0, 0.95, 0.001, "Albedo")}

          <div class="form-row">
            <div>
              <div class="label">Composition Override ${tipIcon(TIP_LABEL["Composition Override"] || "")}</div>
            </div>
            <select id="compOverride" aria-label="Composition Override">
              <option value="">Auto (from density)</option>
              <option value="Very icy">Very icy</option>
              <option value="Icy">Icy</option>
              <option value="Subsurface ocean">Subsurface ocean</option>
              <option value="Mixed rock/ice">Mixed rock/ice</option>
              <option value="Rocky">Rocky</option>
              <option value="Partially molten">Partially molten</option>
              <option value="Iron-rich">Iron-rich</option>
            </select>
          </div>

          <div style="height:8px"></div>
          <div class="label">Dynamics ${tipIcon(TIP_LABEL["Dynamics"] || "")}</div>
          ${numWithSlider("initRot", "Initial Rotation Period", "hours", "", 2, 1000, 0.1, "Initial Rotation Period")}

          <div class="button-row">
            <button id="btn-default">Reset to Defaults</button>
          </div>

          <div class="hint" style="margin-top:10px">
            Radius, gravity, and escape velocity are derived from Mass + Density.
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
    storageKey: "worldsmith.moon.tutorial",
    container: wrap,
    triggerBtn: wrap.querySelector("#moonTutorials"),
  });

  const previewCleanupObserver = new MutationObserver(() => {
    if (wrap.isConnected) return;
    celestialPreviewController.dispose();
    previewCleanupObserver.disconnect();
  });
  previewCleanupObserver.observe(document.body, { childList: true, subtree: true });

  const moonSelectEl = wrap.querySelector("#moonSelect");
  const moonNewEl = wrap.querySelector("#moonNew");
  const moonDeleteEl = wrap.querySelector("#moonDelete");
  const moonPlanetSelectEl = wrap.querySelector("#moonPlanetSelect");

  const contextEl = wrap.querySelector("#context");
  const nameEl = wrap.querySelector("#name");

  const aEl = wrap.querySelector("#a");
  const eEl = wrap.querySelector("#e");
  const incEl = wrap.querySelector("#inc");
  const mEl = wrap.querySelector("#m");
  const densityEl = wrap.querySelector("#density");
  const albedoEl = wrap.querySelector("#albedo");
  const compOverrideEl = wrap.querySelector("#compOverride");
  const initRotEl = wrap.querySelector("#initRot");

  const kpisEl = wrap.querySelector("#kpis");
  const detailsEl = wrap.querySelector("#details");
  let noticeTimer = null;
  const pairBindings = {};

  bindPair("a", aEl, 10, 1e9, 100, "auto");
  bindPair("e", eEl, 0, 0.99, 0.001, "auto");
  bindPair("inc", incEl, 0, 180, 0.1, "auto");
  bindPair("m", mEl, 1e-8, 1000, 1e-8, "auto");
  bindPair("density", densityEl, 0.1, 20, 0.01, "auto");
  bindPair("albedo", albedoEl, 0, 0.95, 0.001, "auto");
  bindPair("initRot", initRotEl, 2, 1000, 0.1, "auto");

  function bindPair(id, numberEl, min, max, step, mode) {
    const sliderEl = wrap.querySelector(`#${id}_slider`);
    const minEl = wrap.querySelector(`#${id}_min`);
    const maxEl = wrap.querySelector(`#${id}_max`);
    minEl.textContent = String(min);
    maxEl.textContent = String(max);
    pairBindings[id] = bindNumberAndSlider({
      numberEl,
      sliderEl,
      min,
      max,
      step,
      mode,
      commitOnInput: false,
      onChange: () => applyFromInputs(),
    });
  }

  function syncBoundPairs() {
    for (const id of ["a", "e", "inc", "m", "density", "albedo", "initRot"]) {
      pairBindings[id]?.syncFromNumber({ commit: false, normalize: true });
    }
  }

  function syncFromWorld() {
    const w = loadWorld();
    state.starMassMsol = Number(w.star.massMsol);
    state.starAgeGyr = Number(w.star.ageGyr);
    state.starMetallicityFeH = Number(w.star.metallicityFeH) || 0;
    const sovW = getStarOverrides(w.star);
    state.starRadiusRsolOverride = sovW.r;
    state.starLuminosityLsolOverride = sovW.l;
    state.starTempKOverride = sovW.t;
    state.starEvolutionMode = sovW.ev;
    const selMoon = getSelectedMoon(w);
    state.moonId = selMoon?.id || w.moons?.selectedId;
    state.moon = { ...(selMoon?.inputs || w.moon) };
    state.moonName = selMoon?.name || state.moon.name || "Luna";
    state.moonPlanetId = selMoon ? (selMoon.planetId ?? null) : null;
    state.moonLocked = !!selMoon?.locked;
    const resolved = resolvePlanetInputs(w, state.moonPlanetId);
    state.parentType = resolved.type;
    if (resolved.type === "gasGiant") {
      state.gasGiant = resolved.gasGiant;
      state.planet = null;
    } else {
      state.planet = resolved.inputs;
      state.gasGiant = null;
    }
  }

  function resolvePlanetInputs(world, planetId) {
    const pid = planetId == null ? null : String(planetId);
    if (pid) {
      const parent = listPlanets(world).find((p) => String(p.id) === pid);
      if (parent?.inputs) return { type: "planet", inputs: { ...parent.inputs } };
      // Check gas giants
      const gg = listSystemGasGiants(world).find((g) => String(g.id) === pid);
      if (gg) return { type: "gasGiant", gasGiant: gg };
    }
    return { type: "planet", inputs: { ...world.planet } };
  }

  function collectDraftMoonInputs() {
    return {
      name: nameEl.value || "New Moon",
      semiMajorAxisKm: Number(aEl.value),
      eccentricity: Number(eEl.value),
      inclinationDeg: Number(incEl.value),
      massMoon: Number(mEl.value),
      densityGcm3: Number(densityEl.value),
      albedo: Number(albedoEl.value),
      compositionOverride: compOverrideEl.value || null,
      initialRotationPeriodHours: Number(initRotEl.value) || null,
    };
  }

  function showMoonNotice(message) {
    let noteEl = wrap.querySelector(".moon-float-note");
    if (!noteEl) {
      noteEl = document.createElement("div");
      noteEl.className = "moon-float-note";
      wrap.appendChild(noteEl);
    }
    noteEl.textContent = message;
    noteEl.classList.add("is-visible");
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      noteEl.classList.remove("is-visible");
    }, 3200);
  }

  function populatePlanetOptions() {
    const w = loadWorld();
    const planets = listPlanets(w);
    const gasGiants = listSystemGasGiants(w);
    renderMoonParentSelector(moonPlanetSelectEl, {
      planets,
      gasGiants,
      selectedValue: state.moonPlanetId,
      disabled: state.moonLocked,
      title: state.moonLocked
        ? "This moon is locked to its current planet on the Planetary System tab."
        : "",
    });
  }

  function populateMoonSelect() {
    const w = loadWorld();
    const moons = listMoons(w);
    renderMoonSelector(moonSelectEl, moons, w.moons.selectedId);
  }

  function buildParentOverride(gg) {
    const starW = loadWorld().star;
    const ggModel = calcGasGiant({
      massMjup: gg.massMjup,
      radiusRj: gg.radiusRj,
      orbitAu: Number(gg.au) || 5,
      rotationPeriodHours: gg.rotationPeriodHours,
      metallicity: gg.metallicity,
      starMassMsol: Number(starW.massMsol) || 1,
      starLuminosityLsol: Number(starW.luminosityLsol) || 1,
      starAgeGyr: Number(starW.ageGyr) || 4.6,
      starRadiusRsol: Number(starW.radiusRsol) || 1,
      stellarMetallicityFeH: Number(starW.metallicityFeH) || 0,
    });
    return {
      inputs: {
        massEarth: ggModel.physical.massEarth,
        semiMajorAxisAu: ggModel.inputs.orbitAu,
        eccentricity: 0,
        rotationPeriodHours: ggModel.inputs.rotationPeriodHours,
        cmfPct: 0,
      },
      derived: {
        densityGcm3: ggModel.physical.densityGcm3,
        radiusEarth: ggModel.physical.radiusEarth,
        gravityG: ggModel.physical.gravityG,
        surfaceFieldEarths: ggModel.magnetic.surfaceFieldEarths,
        magnetopauseRp: ggModel.magnetic.magnetopauseRp,
        radioisotopeAbundance: 1,
      },
    };
  }

  function render() {
    syncFromWorld();

    let model;
    if (state.parentType === "gasGiant" && state.gasGiant) {
      const po = buildParentOverride(state.gasGiant);
      contextEl.textContent =
        `Star Mass: ${fmt(state.starMassMsol, 4)} Msol\n` +
        `Parent: ${state.gasGiant.name || state.gasGiant.id} (gas giant)\n` +
        `Parent orbit: ${fmt(po.inputs.semiMajorAxisAu, 3)} AU`;
      model = calcMoon({
        starMassMsol: state.starMassMsol,
        starAgeGyr: state.starAgeGyr,
        starMetallicityFeH: state.starMetallicityFeH,
        starRadiusRsolOverride: state.starRadiusRsolOverride,
        starLuminosityLsolOverride: state.starLuminosityLsolOverride,
        starTempKOverride: state.starTempKOverride,
        starEvolutionMode: state.starEvolutionMode,
        moon: state.moon,
        parentOverride: po,
      });
    } else {
      contextEl.textContent =
        `Star Mass: ${fmt(state.starMassMsol, 4)} Msol\n` +
        `Planet Mass: ${fmt(state.planet.massEarth, 3)} MEarth\n` +
        `Planet orbit: ${fmt(state.planet.semiMajorAxisAu, 3)} AU`;
      model = calcMoon({
        starMassMsol: state.starMassMsol,
        starAgeGyr: state.starAgeGyr,
        starMetallicityFeH: state.starMetallicityFeH,
        starRadiusRsolOverride: state.starRadiusRsolOverride,
        starLuminosityLsolOverride: state.starLuminosityLsolOverride,
        starTempKOverride: state.starTempKOverride,
        starEvolutionMode: state.starEvolutionMode,
        planet: state.planet,
        moon: state.moon,
      });
    }

    const moonProfile = computeMoonVisualProfile(model);
    const earthSimilarityBreakdown = model.habitability?.earthSimilarityBreakdown || {};
    const moonHabitabilityBreakdown = model.habitability?.breakdown || {};
    const biosphere = model.biosphere || {};
    const geology = model.geology || {};
    const compactBiosphereValue = model.display.surfaceBiosphere.includes("Surface sterile")
      ? "Sterile"
      : model.display.surfaceBiosphere.includes("Marginal")
        ? "Marginal"
        : model.display.surfaceBiosphere.includes("Microbial")
          ? "Microbial"
          : model.display.surfaceBiosphere.includes("Simple")
            ? "Simple"
            : model.display.surfaceBiosphere.includes("Complex")
              ? "Complex"
              : model.display.surfaceBiosphere;
    const compactAtmosphereMix = model.atmosphere?.dominantSpecies
      ? `${model.atmosphere.dominantSpecies}-dominant`
      : "None";
    const compactResurfacing =
      geology.resurfacingDominantProcess === "volcanic"
        ? "Volcanic"
        : geology.resurfacingDominantProcess === "cryovolcanic"
          ? "Cryovolcanic"
          : geology.resurfacingDominantProcess === "mixed"
            ? "Mixed"
            : "Quiet";
    const compactLifeLimits = biosphere.limitingFactors?.length
      ? `${biosphere.limitingFactors.length} blockers`
      : "Clear";
    const compactOrbitalFate = model.display.orbitalFate.startsWith("Roche limit")
      ? "Inward decay"
      : model.display.orbitalFate.startsWith("Escape")
        ? "Outward drift"
        : "Stable";
    const moonHabitabilityPolicyVersion =
      moonHabitabilityBreakdown.solventPolicyVersion || "surface-plus-subsurface-water-v1";
    const moonHabitabilityPolicyLabel =
      moonHabitabilityPolicyVersion === "surface-subsurface-plus-alt-solvents-v1"
        ? "surface + subsurface + alt solvents"
        : moonHabitabilityPolicyVersion === "surface-plus-subsurface-water-v1"
          ? "surface + subsurface water"
          : "surface water only";

    const buildMoonKpi = (label, value, meta = "", overrides = {}) => ({
      label,
      tip: TIP_LABEL[label] || "",
      value,
      meta,
      kpiClass: `kpi--compact ${overrides.kpiClass || ""}`.trim(),
      ...overrides,
    });

    const habitabilityMeta =
      `Substrate ${fmt(moonHabitabilityBreakdown.substrate ?? 0, 2)} | ` +
      `Solvent ${fmt(moonHabitabilityBreakdown.solvent ?? 0, 2)} | ` +
      `Energy ${fmt(moonHabitabilityBreakdown.energy ?? 0, 2)} | ` +
      `Chemistry ${fmt(moonHabitabilityBreakdown.chemistry ?? 0, 2)} | ` +
      `Stability ${fmt(moonHabitabilityBreakdown.stabilityMultiplier ?? 0, 2)} | ` +
      `Radiation ${fmt(moonHabitabilityBreakdown.radiationMultiplier ?? 0, 2)} | ` +
      `Persistence ${fmt(moonHabitabilityBreakdown.persistenceMultiplier ?? 0, 2)}\n` +
      `Pathway ${moonHabitabilityBreakdown.solventPathway || "none"} | ${moonHabitabilityPolicyLabel}\n` +
      `${model.habitability?.habitabilityModelVersion || "phi-unified-v2"} | ${moonHabitabilityPolicyVersion}`;

    const prevMoonCanvas = kpisEl.querySelector(".moon-preview-canvas");
    const sections = [
      {
        id: "moon-summary",
        title: "Summary",
        items: [
          {
            kind: "preview",
            label: "Appearance",
            tip: TIP_LABEL.Appearance || "",
            actions: [
              { className: "small moon-recipe-btn", text: "Recipes" },
              { className: "small moon-pause-btn", text: "Pause" },
            ],
            canvasClass: "moon-preview-canvas",
            metaChildren: [
              moonProfile.displayClass,
              " \u2014 ",
              moonProfile.terrain.type.replace("-", " "),
            ],
          },
          buildMoonKpi("Composition", model.display.compositionClass),
          buildMoonKpi("Radius", model.display.radius, "derived"),
          buildMoonKpi("Gravity", model.display.gravity),
          buildMoonKpi("Surface Temp", model.display.surfaceTemp),
          buildMoonKpi("Hydrosphere", model.display.hydrosphereState),
          buildMoonKpi("Atmosphere", model.display.atmosphereClass, model.display.atmosphereSource),
          buildMoonKpi("Habitability Index", model.display.habitabilityIndex, habitabilityMeta),
        ],
      },
      {
        id: "moon-identity",
        title: "Identity & Class",
        density: "compact",
        items: [
          buildMoonKpi("Composition", model.display.compositionClass),
          buildMoonKpi("Albedo", fmt(state.moon.albedo, 3)),
        ],
      },
      {
        id: "moon-physical",
        title: "Physical State",
        density: "compact",
        items: [
          buildMoonKpi("Mass", `${fmt(state.moon.massMoon, 3)} M☾`),
          buildMoonKpi("Density", `${fmt(state.moon.densityGcm3, 2)} g/cm³`),
          buildMoonKpi("Radius", model.display.radius, "derived"),
          buildMoonKpi("Gravity", model.display.gravity),
          buildMoonKpi("Escape Velocity", model.display.esc),
        ],
      },
      {
        id: "moon-environment",
        title: "Environment",
        density: "compact",
        items: [
          buildMoonKpi("Atmosphere", model.display.atmosphereClass, model.display.atmosphereSource),
          buildMoonKpi("Surface Pressure", model.display.surfacePressure),
          buildMoonKpi("Atmosphere Mix", compactAtmosphereMix, model.display.atmosphereComposition),
          buildMoonKpi("Greenhouse Warming", model.display.greenhouseWarming),
          buildMoonKpi("Hydrosphere", model.display.hydrosphereState),
          buildMoonKpi("Surface Ices", model.display.surfaceIces),
          buildMoonKpi("Surface Water", model.display.surfaceWater),
          buildMoonKpi("Subsurface Ocean", model.display.subsurfaceOcean),
          buildMoonKpi("Ocean Depth", model.display.oceanDepth),
          buildMoonKpi("Ice Shell", model.display.iceShell),
          buildMoonKpi("High-Pressure Ice", model.display.highPressureIce),
          buildMoonKpi("Equilibrium Temp", model.display.equilibriumTemp),
          buildMoonKpi("Climate State", model.display.climateState),
          buildMoonKpi("Surface Temp Range", model.display.surfaceTempRange),
          buildMoonKpi(
            "Climate Zones",
            model.display.climateZones,
            model.display.climateZoneSummary,
          ),
          buildMoonKpi("Seasonality", model.display.seasonality),
        ],
      },
      {
        id: "moon-system",
        title: "System Context",
        density: "compact",
        items: [
          buildMoonKpi("Orbital Period (sidereal)", model.display.sidereal),
          buildMoonKpi("Orbital Period (synodic)", model.display.synodic),
          buildMoonKpi("Rotation Period", model.display.rot),
          buildMoonKpi("Initial Rotation Period", model.display.initialRot),
          buildMoonKpi("Planetshine", model.display.planetshine),
          buildMoonKpi("Eclipse Cooling", model.display.eclipseCooling),
          buildMoonKpi("Orbital Recession", model.display.recession),
          buildMoonKpi(
            "Orbital Fate",
            compactOrbitalFate,
            compactOrbitalFate === "Stable"
              ? "No strong inward decay or outward escape trend is currently predicted"
              : model.display.orbitalFate,
          ),
        ],
      },
      {
        id: "moon-activity",
        title: "Activity & Radiation",
        density: "compact",
        items: [
          buildMoonKpi("Total Tidal Force", model.display.tides),
          buildMoonKpi("Moon Contribution", model.display.moonPct),
          buildMoonKpi("Star Contribution", model.display.starPct),
          buildMoonKpi(
            "Tidal Heating",
            model.display.tidalHeating,
            model.display.tidalHeatingTotal,
          ),
          buildMoonKpi("Tidal Heating (\u00D7 Earth)", model.display.tidalHeatingXEarth),
          buildMoonKpi(
            "Volcanic Activity",
            model.display.volcanicActivity,
            `score ${fmt(geology.volcanicActivityScore ?? 0, 2)}`,
          ),
          buildMoonKpi(
            "Cryovolcanism",
            model.display.cryovolcanicActivity,
            `score ${fmt(geology.cryovolcanicActivityScore ?? 0, 2)}`,
          ),
          buildMoonKpi(
            "Resurfacing",
            compactResurfacing,
            `${model.display.resurfacing}\n${
              geology.resurfacingDominantProcess === "none"
                ? "No dominant resurfacing driver"
                : `${geology.resurfacingDominantProcess || "mixed"}-driven`
            }`,
          ),
          buildMoonKpi(
            "Volatile Supply",
            model.display.volatileReplenishment,
            `score ${fmt(geology.volatileReplenishmentScore ?? 0, 2)}`,
          ),
          buildMoonKpi(
            "Ocean Persistence",
            model.display.oceanPersistence,
            `score ${fmt(geology.oceanPersistenceScore ?? 0, 2)}`,
          ),
          buildMoonKpi("Radiogenic Heating", model.display.radiogenicHeating),
          buildMoonKpi(
            "Magnetosphere Dose",
            model.display.magnetosphericRad,
            model.display.magnetosphericLabel,
          ),
        ],
      },
      {
        id: "moon-habitability",
        title: "Habitability",
        density: "compact",
        items: [
          buildMoonKpi("Habitability Index", model.display.habitabilityIndex, habitabilityMeta),
          buildMoonKpi(
            "Earth Similarity Index",
            model.display.earthSimilarityIndex,
            `Radius ${fmt(earthSimilarityBreakdown.radius ?? 0, 2)} | ` +
              `Density ${fmt(earthSimilarityBreakdown.density ?? 0, 2)} | ` +
              `Escape ${fmt(earthSimilarityBreakdown.escapeVelocity ?? 0, 2)} | ` +
              `Temp ${fmt(earthSimilarityBreakdown.surfaceTemp ?? 0, 2)}`,
          ),
          buildMoonKpi(
            "Biosphere",
            compactBiosphereValue,
            `${model.display.surfaceBiosphere}\nScore ${fmt(biosphere.surfaceBiologyScore ?? 0, 2)}`,
          ),
          buildMoonKpi("Plant Life", model.display.plantLife),
          buildMoonKpi(
            "Vegetation",
            model.biosphere?.vegetationEligible ? "Yes" : "No",
            model.display.vegetation === "Supported"
              ? "Surface vegetation is supported by the current biosphere gate"
              : model.display.vegetationNote,
          ),
          buildMoonKpi("Life Limits", compactLifeLimits, model.display.biosphereLimits),
          ...(model.biosphere?.vegetationEligible
            ? [
                buildMoonKpi(
                  "Veg Colours",
                  "Available",
                  `${model.display.vegetationColours}\n${model.display.vegetationNote}`,
                ),
              ]
            : []),
        ],
      },
    ];

    renderMoonKpiSections(kpisEl, sections);

    // Render moon preview canvas (animated native celestial controller)
    let moonCvs = kpisEl.querySelector(".moon-preview-canvas");
    if (prevMoonCanvas && moonCvs && prevMoonCanvas !== moonCvs) {
      moonCvs.replaceWith(prevMoonCanvas);
      moonCvs = prevMoonCanvas;
    }
    if (moonCvs && moonProfile) {
      celestialPreviewController.attach(moonCvs, {
        bodyType: "moon",
        name: state.moonName || state.moon.name || "Moon",
        recipeId: String(state.moon?.appearanceRecipeId || ""),
        moonProfile,
        moonCalc: model,
        rotationPeriodDays:
          Number(model?.orbit?.rotationPeriodDays) ||
          Number(model?.orbit?.periodSiderealDays) ||
          27.3,
      });
    } else {
      celestialPreviewController.detach();
    }

    // Wire recipe picker button
    kpisEl.querySelector(".moon-recipe-btn")?.addEventListener("click", () => {
      openMoonRecipePicker((recipe) => {
        const selMoon = getSelectedMoon();
        if (selMoon) {
          updateMoon(selMoon.id, { inputs: { ...recipe.apply, appearanceRecipeId: recipe.id } });
        }
        render();
      });
    });

    // Pause / resume rotation
    const moonPauseBtn = kpisEl.querySelector(".moon-pause-btn");
    if (moonPauseBtn) {
      moonPauseBtn.addEventListener("click", () => {
        const paused = moonPauseBtn.textContent === "Pause";
        celestialPreviewController.setPaused(paused);
        moonPauseBtn.textContent = paused ? "Play" : "Pause";
      });
    }

    renderMoonDerivedDetails(
      detailsEl,
      [
        {
          id: "moon-details-identity",
          title: "Identity & Class",
          items: [
            { label: "Name", value: state.moonName || state.moon.name || "Moon" },
            { label: "Composition", value: model.display.compositionClass },
            { label: "Albedo", value: fmt(state.moon.albedo, 3) },
          ],
        },
        {
          id: "moon-details-physical",
          title: "Physical State",
          items: [
            { label: "Mass", value: `${fmt(state.moon.massMoon, 3)} M☾` },
            { label: "Density", value: `${fmt(state.moon.densityGcm3, 2)} g/cm³` },
            { label: "Radius", value: model.display.radius },
            { label: "Gravity", value: model.display.gravity },
            { label: "Escape Velocity", value: model.display.esc },
          ],
        },
        {
          id: "moon-details-environment",
          title: "Environment",
          items: [
            {
              label: "Atmosphere",
              value: model.display.atmosphereClass,
              meta: model.display.atmosphereSource,
            },
            { label: "Surface Pressure", value: model.display.surfacePressure },
            {
              label: "Atmosphere Mix",
              value: compactAtmosphereMix,
              meta: model.display.atmosphereComposition,
            },
            { label: "Greenhouse Warming", value: model.display.greenhouseWarming },
            { label: "Hydrosphere", value: model.display.hydrosphereState },
            { label: "Surface Water", value: model.display.surfaceWater },
            { label: "Subsurface Ocean", value: model.display.subsurfaceOcean },
            { label: "Ocean Depth", value: model.display.oceanDepth },
            { label: "Ice Shell", value: model.display.iceShell },
            { label: "High-Pressure Ice", value: model.display.highPressureIce },
            { label: "Climate State", value: model.display.climateState },
            {
              label: "Climate Zones",
              value: model.display.climateZones,
              meta: model.display.climateZoneSummary,
            },
            { label: "Seasonality", value: model.display.seasonality },
          ],
        },
        {
          id: "moon-details-system",
          title: "System Context",
          items: [
            { label: "Moon Zone (Inner)", value: model.display.zoneInner },
            { label: "Moon Zone (Outer)", value: model.display.zoneOuter },
            { label: "Periapsis", value: model.display.peri },
            { label: "Apoapsis", value: model.display.apo },
            { label: "Orbital Direction", value: model.orbit.orbitalDirection },
            { label: "Orbital Period (sidereal)", value: model.display.sidereal },
            { label: "Orbital Period (synodic)", value: model.display.synodic },
            { label: "Rotation Period", value: model.display.rot },
            { label: "Initial Rotation Period", value: model.display.initialRot },
            { label: "Planetshine", value: model.display.planetshine },
            { label: "Eclipse Cooling", value: model.display.eclipseCooling },
            { label: "Orbital Recession", value: model.display.recession },
            { label: "Orbital Fate", value: model.display.orbitalFate },
            { label: "Moon locked to Planet", value: model.display.moonLocked },
            { label: "Planet locked to Moon", value: model.display.planetLockedMoon },
            { label: "Planet locked to Star", value: model.display.planetLockedStar },
            { label: "Lock time (Moon→Planet)", value: model.display.tMoonLock },
            { label: "Lock time (Planet→Moon)", value: model.display.tPlanetMoon },
            { label: "Lock time (Planet→Star)", value: model.display.tPlanetStar },
          ],
        },
        {
          id: "moon-details-activity",
          title: "Activity & Radiation",
          items: [
            { label: "Total Tidal Force", value: model.display.tides },
            { label: "Moon Contribution", value: model.display.moonPct },
            { label: "Star Contribution", value: model.display.starPct },
            {
              label: "Tidal Heating",
              value: model.display.tidalHeating,
              meta: model.display.tidalHeatingTotal,
            },
            { label: "Tidal Heating (× Earth)", value: model.display.tidalHeatingXEarth },
            {
              label: "Volcanic Activity",
              value: model.display.volcanicActivity,
              meta: `score ${fmt(geology.volcanicActivityScore ?? 0, 2)}`,
            },
            {
              label: "Cryovolcanism",
              value: model.display.cryovolcanicActivity,
              meta: `score ${fmt(geology.cryovolcanicActivityScore ?? 0, 2)}`,
            },
            {
              label: "Resurfacing",
              value: compactResurfacing,
              meta:
                geology.resurfacingDominantProcess === "none"
                  ? "No dominant resurfacing driver"
                  : `${geology.resurfacingDominantProcess || "mixed"}-driven`,
            },
            {
              label: "Volatile Supply",
              value: model.display.volatileReplenishment,
              meta: `score ${fmt(geology.volatileReplenishmentScore ?? 0, 2)}`,
            },
            {
              label: "Ocean Persistence",
              value: model.display.oceanPersistence,
              meta: `score ${fmt(geology.oceanPersistenceScore ?? 0, 2)}`,
            },
            { label: "Radiogenic Heating", value: model.display.radiogenicHeating },
            {
              label: "Magnetosphere Dose",
              value: model.display.magnetosphericRad,
              meta: model.display.magnetosphericLabel,
            },
          ],
        },
        {
          id: "moon-details-habitability",
          title: "Habitability",
          items: [
            {
              label: "Habitability Index",
              value: model.display.habitabilityIndex,
              meta: habitabilityMeta.replace(/\n/g, " | "),
            },
            {
              label: "Earth Similarity Index",
              value: model.display.earthSimilarityIndex,
              meta:
                `Radius ${fmt(earthSimilarityBreakdown.radius ?? 0, 2)} | ` +
                `Density ${fmt(earthSimilarityBreakdown.density ?? 0, 2)} | ` +
                `Escape ${fmt(earthSimilarityBreakdown.escapeVelocity ?? 0, 2)} | ` +
                `Temp ${fmt(earthSimilarityBreakdown.surfaceTemp ?? 0, 2)}`,
            },
            {
              label: "Biosphere",
              value: model.display.surfaceBiosphere,
              meta: `Score ${fmt(biosphere.surfaceBiologyScore ?? 0, 2)}`,
            },
            { label: "Plant Life", value: model.display.plantLife },
            {
              label: "Vegetation",
              value: model.display.vegetation,
              meta: model.display.vegetationNote,
            },
            { label: "Life Limits", value: compactLifeLimits, meta: model.display.biosphereLimits },
            ...(model.biosphere?.vegetationEligible
              ? [
                  {
                    label: "Veg Colours",
                    value: model.display.vegetationColours,
                    meta: model.display.vegetationNote,
                  },
                ]
              : []),
          ],
        },
      ],
      { title: "Derived Details" },
    );
  }

  function loadIntoInputs() {
    syncFromWorld();
    populateMoonSelect();
    populatePlanetOptions();

    nameEl.value = state.moonName;
    aEl.value = state.moon.semiMajorAxisKm;
    eEl.value = state.moon.eccentricity;
    incEl.value = state.moon.inclinationDeg;
    mEl.value = state.moon.massMoon;
    densityEl.value = state.moon.densityGcm3;
    albedoEl.value = state.moon.albedo;
    compOverrideEl.value = state.moon.compositionOverride || "";
    initRotEl.value = state.moon.initialRotationPeriodHours || 12;
    syncBoundPairs();
  }

  let hydrating = false;
  function applyFromInputs() {
    if (hydrating) return;
    hydrating = true;
    const w = loadWorld();
    const moonId = w.moons.selectedId;

    const newName = nameEl.value || "New Moon";
    const planetId = moonPlanetSelectEl.value || null;

    const draftInputs = collectDraftMoonInputs();
    const resolved = resolvePlanetInputs(w, planetId);
    let guardModel;
    if (resolved.type === "gasGiant") {
      const po = buildParentOverride(resolved.gasGiant);
      guardModel = calcMoon({
        starMassMsol: state.starMassMsol,
        starAgeGyr: state.starAgeGyr,
        starMetallicityFeH: state.starMetallicityFeH,
        starRadiusRsolOverride: state.starRadiusRsolOverride,
        starLuminosityLsolOverride: state.starLuminosityLsolOverride,
        starTempKOverride: state.starTempKOverride,
        starEvolutionMode: state.starEvolutionMode,
        moon: draftInputs,
        parentOverride: po,
      });
    } else {
      guardModel = calcMoon({
        starMassMsol: state.starMassMsol,
        starAgeGyr: state.starAgeGyr,
        starMetallicityFeH: state.starMetallicityFeH,
        starRadiusRsolOverride: state.starRadiusRsolOverride,
        starLuminosityLsolOverride: state.starLuminosityLsolOverride,
        starTempKOverride: state.starTempKOverride,
        starEvolutionMode: state.starEvolutionMode,
        planet: resolved.inputs,
        moon: draftInputs,
      });
    }
    const guardCode = String(guardModel?.orbit?.semiMajorAxisGuard || "none");
    const guardedSemiMajorAxisKm = Number(guardModel?.inputs?.semiMajorAxisKm);
    const rawSemiMajorAxisKm = Number(draftInputs.semiMajorAxisKm);
    const roundedGuardedSemiMajorAxisKm = Number.isFinite(guardedSemiMajorAxisKm)
      ? Math.round(guardedSemiMajorAxisKm)
      : rawSemiMajorAxisKm;
    const useAdjustedAxis = guardCode !== "none" && Number.isFinite(roundedGuardedSemiMajorAxisKm);
    const inputs = {
      ...draftInputs,
      semiMajorAxisKm: useAdjustedAxis ? roundedGuardedSemiMajorAxisKm : rawSemiMajorAxisKm,
    };

    updateMoon(moonId, { name: newName, inputs });
    assignMoonToPlanet(moonId, planetId);

    // Back-compat for any remaining consumers
    updateWorld({ moon: inputs });

    if (useAdjustedAxis && Math.abs(inputs.semiMajorAxisKm - rawSemiMajorAxisKm) > 1e-9) {
      showMoonNotice(
        `Semi-Major Axis adjusted to ${fmt(inputs.semiMajorAxisKm, 0)} km to keep this moon within the Moon Zone.`,
      );
    }

    loadIntoInputs();
    render();
    hydrating = false;
  }

  nameEl.addEventListener("change", applyFromInputs);
  compOverrideEl.addEventListener("change", applyFromInputs);
  moonPlanetSelectEl.addEventListener("change", applyFromInputs);

  moonSelectEl.addEventListener("change", () => {
    selectMoon(moonSelectEl.value);
    loadIntoInputs();
    render();
  });

  moonNewEl.addEventListener("click", (e) => {
    e.preventDefault();
    const w = loadWorld();
    const baseInputs = getSelectedMoon(w)?.inputs || w.moon;
    createMoonFromInputs(baseInputs, { name: "New Moon", planetId: w.planets.selectedId });
    loadIntoInputs();
    render();
  });

  moonDeleteEl.addEventListener("click", (e) => {
    e.preventDefault();
    const w = loadWorld();
    if (w.moons.order.length <= 1) return;
    deleteMoon(w.moons.selectedId);
    loadIntoInputs();
    render();
  });

  wrap.querySelector("#btn-default").addEventListener("click", () => {
    // Spreadsheet defaults
    state.moon = {
      name: "Luna",
      semiMajorAxisKm: 384748,
      eccentricity: 0.055,
      inclinationDeg: 5.15,
      massMoon: 1.0,
      densityGcm3: 3.34,
      albedo: 0.11,
      initialRotationPeriodHours: null,
    };
    const wNow = loadWorld();
    updateMoon(wNow.moons.selectedId, {
      name: state.moon.name || "Luna",
      inputs: state.moon,
    });
    loadIntoInputs();
    render();
  });

  /* ── Moon recipe picker modal ──────────────────────────────────────── */

  function openMoonRecipePicker(onSelect) {
    const overlay = createMoonRecipePickerOverlay(MOON_RECIPES);
    document.body.appendChild(overlay);

    const progressBar = overlay.querySelector(".rp-picker-progress > span");
    const progressTrack = overlay.querySelector(".rp-picker-progress");
    const items = [];
    for (const card of overlay.querySelectorAll(".rp-picker-card")) {
      const recipe = MOON_RECIPES.find((r) => r.id === card.dataset.recipe);
      if (!recipe) continue;
      items.push({
        canvas: card.querySelector("canvas"),
        model: {
          bodyType: "moon",
          name: recipe.label || "Moon",
          recipeId: recipe.id,
          moonCalc: recipe.previewCalc || recipe.preview,
        },
      });
    }
    renderCelestialRecipeBatch(items, (done, total) => {
      const pct = total ? (done / total) * 100 : 100;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (pct >= 100 && progressTrack) progressTrack.classList.add("is-done");
    });

    function close() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }

    for (const card of overlay.querySelectorAll(".rp-picker-card")) {
      card.addEventListener("click", () => {
        const recipe = MOON_RECIPES.find((r) => r.id === card.dataset.recipe);
        if (recipe) onSelect(recipe);
        close();
      });
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector(".rp-picker-close").addEventListener("click", close);

    function onKey(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
  }

  // Init
  loadIntoInputs();
  render();
}

function numWithSlider(id, label, unit, hint, min, max, step, tipLabelKey) {
  const unitHtml = unit ? ` <span class="unit">${unit}</span>` : "";
  return `
  <div class="form-row">
    <div>
      <div class="label">${label}${unitHtml} ${tipIcon(TIP_LABEL[tipLabelKey] || TIP_LABEL[label] || "")}</div>
      <div class="hint">${hint}</div>
    </div>
    <div class="input-pair">
      <input id="${id}" type="number" step="${step}" aria-label="${label}" />
      <input id="${id}_slider" type="range" aria-label="${label} slider" />
      <div class="range-meta"><span id="${id}_min"></span><span id="${id}_max"></span></div>
    </div>
  </div>`;
}
