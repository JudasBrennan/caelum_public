import { calcMoon } from "../engine/moon.js";
import { calcPlanetExact } from "../engine/planet.js";
import { calcGasGiant } from "../engine/gasGiant.js";
import { calcStar } from "../engine/star.js";
import {
  buildGasGiantMoonParentOverride,
  buildRockyMoonParentOverride,
  solveMoonSystem,
} from "../engine/moon/system.js";
import { fmt } from "../engine/utils.js";
import { bindNumberAndSlider } from "./bind.js";
import { createElement } from "./domHelpers.js";
import { createGuidedFlowController } from "./guidedCreation/flowController.js";
import { createGuidedPanel } from "./guidedCreation/components/guidedPanel.js";
import { createGoalTextAssist } from "./guidedCreation/components/goalTextAssist.js";
import { consumeGuidedCreationLaunch } from "./guidedCreation/launchState.js";
import { getGoalTextAliasHelp } from "./guidedCreation/goalAliases.js";
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
import {
  buildMoonRecipeApplyInputs,
  ensureMoonGuidedAdapterRegistered,
} from "./guidedCreation/adapters/moon.js";
import { computeMoonVisualProfile, MOON_RECIPES } from "./moonStyles.js";
import {
  createCelestialVisualPreviewController,
  renderCelestialRecipeBatch,
} from "./celestialVisualPreview.js";
import {
  createMoonGuidedCreationOverlay,
  createMoonRecipePickerOverlay,
  renderMoonKpiSections,
  renderMoonDerivedDetails,
  renderMoonParentSelector,
  renderMoonSelector,
} from "./moon/domRender.js";
import {
  loadWorld,
  updateWorld,
  updatePlanet,
  listPlanets,
  listMoons,
  listSystemGasGiants,
  saveSystemGasGiants,
  getSelectedMoon,
  getStarOverrides,
  selectMoon,
  createMoonFromInputs,
  deleteMoon,
  updateMoon,
  assignMoonToPlanet,
  applyMoonSiblingPatch,
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
  "Hydrosphere Mode":
    "Core keeps the existing density-driven moon water heuristics.\n\nFull adds explicit water inventory, salinity, ammonia, and interior-state controls.\n\nManual lets you set physical moon water/interior inputs directly, but the engine still computes the resulting ocean and ice structure.",
  "Atmosphere Mode":
    "Core uses the retained-volatile moon atmosphere path.\n\nFull adds stability diagnostics, source/loss reasoning, and haze/cloud outputs.\n\nManual lets you set pressure and gas mix inputs; the solver then checks whether that atmosphere is stable or transient.",
  "Orbital Coupling":
    "Core treats the moon independently.\n\nFull adds sibling-moon resonance detection, forced eccentricity floors, Laplace-chain flags, and a tidal-habitable-zone readout.\n\nManual exposes resonance-group inputs and manual forcing controls.",
  "Water Mass Fraction":
    "Explicit moon water inventory as percent of total mass. Core mode ignores this and infers water from composition. Full and Manual modes use it to solve exposed ocean depth, buried ocean depth, and ice-shell structure.",
  Salinity:
    "Bulk ocean or ice salinity in percent by mass. Higher salinity lowers the freezing point and helps buried oceans persist.",
  Ammonia:
    "Bulk ammonia fraction in the volatile inventory. Ammonia acts as an antifreeze and can support colder subsurface oceans.",
  "Differentiated Interior":
    "Flags whether the moon is internally differentiated into a rocky core and volatile-rich outer shell. Differentiation makes long-lived internal oceans more plausible.",
  "Moon Radioisotopes":
    "Moon internal heat mode. Simple uses a single abundance multiplier. Advanced exposes the individual U-238, U-235, Th-232, and K-40 controls, mirroring rocky planets.",
  "Manual Surface Pressure": "Manual surface pressure used only in Moon Atmosphere Manual mode.",
  "Forced Eccentricity":
    "Minimum eccentricity maintained by resonant forcing. In Full mode the solver can derive this from sibling resonances; in Manual mode you can set the floor directly.",
  "Resonance Group":
    "Manual resonance-chain identifier for moons that should be treated as part of the same forced-eccentricity group.",
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
  "Nearest Resonance":
    "Closest sibling-moon mean-motion resonance identified by the coupled moon-system solver.",
  "Laplace Status":
    "Whether the moon is currently tagged as part of a Laplace-style resonant chain.",
  "Tidal HZ": "Moon tidal-habitable-zone readout from the coupled moon-system solver.",
  Formation:
    "First-pass moon formation classifier derived from orbit geometry, inclination, distance from the parent, and regular versus irregular moon architecture.",
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
  "Day/Night Contrast":
    "First-pass synchronous day-night thermal contrast for the current moon climate.",
  "Nightside Min":
    "Estimated nightside minimum temperature after eclipse and synchronous-cooling effects.",
  "Collapse State":
    "Atmospheric-collapse risk assessment for thin or volatile atmospheres on locked moons.",
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
  "Atmosphere Stability":
    "Source-loss balance for the current moon atmosphere. Stable means the current atmosphere is plausibly long-lived; transient means it likely needs active replenishment.",
  "Atmosphere Lifetime":
    "Estimated order-of-magnitude lifetime of the modeled atmosphere under the current source and loss assumptions.",
  "Atmosphere Haze":
    "First-pass haze class inferred from the dominant atmospheric chemistry and pressure.",
  "Atmosphere Clouds":
    "First-pass cloud or aerosol class inferred from pressure, condensables, and surface liquid support.",
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
  "Interior Structure":
    "Compact readout of the current solved moon interior: ocean depth plus the inferred ice-shell convection regime.",
  "Ocean Chemistry":
    "Surface or subsurface ocean chemistry inputs used in Full and Manual hydrosphere modes.",
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
  Appearance:
    "Physics-driven visual of the moon from space. Surface texture, ice, clouding, haze, and ocean cues are derived from the current solved moon state.\n\nThis preview is now read-only. Use Create This Moon in the Inputs column for Quick, Guided, or Recipes.",
  "Habitability Index":
    "WorldSmith comparative habitability model for moons." +
    "\n\nThis is PHI-inspired, not a direct literature PHI implementation. The score depends on the selected solvent pathway and the active solvent-policy support for surface water, subsurface water, and alternative solvents." +
    "\n\nUse the expanded KPI details to see the current pathway, policy version, and term breakdown.",
  "Surface Radiation":
    "Gate-based surface-radiation class after parent-belt exposure, stellar XUV, atmosphere shielding, and moon magnetic shielding are combined.",
  "Magnetic Shielding":
    "Combined intrinsic and induced moon magnetic shielding class.\n\nIntrinsic shielding comes from a plausible moon dynamo. Induced shielding comes from a conductive salty subsurface ocean interacting with the parent field.",
  "Surface Exomoon Calibration":
    "Paper-informed exposed-surface moon calibration for cool-star systems.\n\n" +
    "This surface-only gate weighs cool-star band, giant-host mass, moon mass floor, composition, and spin state. It does not block subsurface-ocean outcomes.",
  "Spin State":
    "Solved moon spin-orbit state from the tidal model.\n\n" +
    "A 1:1 synchronous lock strengthens permanent parent-facing contrast, while a 3:2 resonance modestly softens that contrast for exposed-surface climate cases.",
  "Life Class":
    "High-level gate-based moon outcome.\n\nThis sits alongside the numeric Habitability Index and tells you whether the current moon is best described as a surface-life candidate, a cool-star mass-limited surface moon, a radiation-limited ocean moon, a subsurface-ocean moon, or another environmental class.",
  "Surface Habitability":
    "Gate-based surface-habitability readout.\n\nThis separates true surface-life plausibility from warm-but-radiation-limited or marginal-atmosphere cases.",
  "Subsurface Habitability":
    "Gate-based subsurface-habitability readout.\n\nMoons outside the stellar habitable zone can still score well here if they plausibly sustain buried liquid water under ice.",
  "Habitability Gates":
    "Quick count of how many surface and subsurface habitability gates currently pass.",
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
    title: "Creation Modes",
    body:
      "Use Create This Moon at the top of Inputs. Quick applies a moon " +
      "archetype, Guided walks you to a recommendation, Recipes opens the " +
      "preset library for exact moon templates like Luna, Europa, Io, or " +
      "Titan, and Advanced is the direct editor below.",
  },
];

export function initMoonPage(mountEl, options = {}) {
  const guidedRoute = options?.routeContext?.guided || null;
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

          <div class="guided-entry-strip" id="moonCreateEntry">
            <div class="guided-entry-strip__title">Create This Moon</div>
            <div class="guided-entry-strip__copy">
              Quick applies a moon archetype, Guided walks you to a recommendation, and Advanced
              is the direct editor below. Use Recipes alongside Advanced when you want a preset
              starting point: Recipes will override the current moon inputs.
            </div>
            <div class="guided-entry-strip__modes">
              <button id="moonCreateQuickBtn" type="button" class="guided-entry-strip__mode">
                Quick
              </button>
              <button id="moonCreateGuidedBtn" type="button" class="guided-entry-strip__mode">
                Guided
              </button>
              <button id="moonCreateRecipesBtn" type="button" class="guided-entry-strip__mode">
                Recipes
              </button>
              <span class="guided-entry-strip__mode guided-entry-strip__mode--current" aria-current="page">
                Advanced
              </span>
            </div>
          </div>

          <div style="height:10px"></div>

          <div class="label">Moon Science Modes</div>
          ${modeToggleRow(
            "hydModePills",
            "hydMode",
            "Hydrosphere Mode",
            "Hydrosphere Mode",
            [
              { value: "core", label: "Core", checked: true },
              { value: "full", label: "Full", checked: false },
              { value: "manual", label: "Manual", checked: false },
            ],
            "hydModeHint",
          )}
          ${modeToggleRow(
            "atmModePills",
            "atmMode",
            "Atmosphere Mode",
            "Atmosphere Mode",
            [
              { value: "core", label: "Core", checked: true },
              { value: "full", label: "Full", checked: false },
              { value: "manual", label: "Manual", checked: false },
            ],
            "atmModeHint",
          )}
          ${modeToggleRow(
            "orbModePills",
            "orbMode",
            "Orbital Coupling",
            "Orbital Coupling",
            [
              { value: "core", label: "Core", checked: true },
              { value: "full", label: "Full", checked: false },
              { value: "manual", label: "Manual", checked: false },
            ],
            "orbModeHint",
          )}

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

          <div style="height:8px"></div>
          <div class="label">Bulk & Interior</div>
          <div id="moonHydrosphereSection">
            ${numWithSlider("wmf", "Water Mass Fraction", "%", "", 0, 60, 0.1, "Water Mass Fraction")}
            ${numWithSlider("salinity", "Salinity", "%", "", 0, 35, 0.1, "Salinity")}
            ${numWithSlider("ammonia", "Ammonia", "%", "", 0, 30, 0.1, "Ammonia")}
            <div class="form-row">
              <div>
                <div class="label">Differentiated Interior ${tipIcon(TIP_LABEL["Differentiated Interior"] || "")}</div>
                <div class="hint">Auto defers to the solver. Yes/No pins the interior assumption.</div>
              </div>
              <select id="differentiatedInterior">
                <option value="">Auto</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Moon Radioisotopes ${tipIcon(TIP_LABEL["Moon Radioisotopes"] || "")}</div>
                <div class="hint" id="isoModeHint"></div>
              </div>
              <div class="pill-toggle-wrap">
                ${duoToggle("isoModePills", "isoMode", [
                  { value: "simple", label: "Simple", checked: true },
                  { value: "advanced", label: "Advanced", checked: false },
                ])}
              </div>
            </div>
            <div id="moonIsoSimpleRows">
              ${numWithSlider("radioAbundance", "Radioisotope Abundance", "x Earth", "", 0.1, 3, 0.01, "Internal Heat")}
            </div>
            <div id="moonIsoAdvancedRows">
              ${numWithSlider("u238", "U-238", "x Earth", "", 0, 5, 0.01, "U-238")}
              ${numWithSlider("u235", "U-235", "x Earth", "", 0, 5, 0.01, "U-235")}
              ${numWithSlider("th232", "Th-232", "x Earth", "", 0, 5, 0.01, "Th-232")}
              ${numWithSlider("k40", "K-40", "x Earth", "", 0, 5, 0.01, "K-40")}
            </div>
          </div>

          <div style="height:8px"></div>
          <div class="label">Atmosphere</div>
          <div id="moonAtmosphereSection">
            ${numWithSlider("manualPressure", "Manual Surface Pressure", "atm", "", 0, 10, 0.01, "Manual Surface Pressure")}
            ${simpleNumberRow("n2Pct", "Nitrogen (N2)", "%", "Derived to fill the remainder when left at 0 in manual mode.")}
            ${simpleNumberRow("o2Pct", "Oxygen (O2)", "%", "")}
            ${simpleNumberRow("co2Pct", "Carbon Dioxide (CO2)", "%", "")}
            ${simpleNumberRow("arPct", "Argon (Ar)", "%", "")}
            ${simpleNumberRow("h2oPct", "Water Vapor (H2O)", "%", "")}
            ${simpleNumberRow("ch4Pct", "Methane (CH4)", "%", "")}
            ${simpleNumberRow("coPct", "Carbon Monoxide (CO)", "%", "")}
            ${simpleNumberRow("h2Pct", "Hydrogen (H2)", "%", "")}
            ${simpleNumberRow("hePct", "Helium (He)", "%", "")}
            ${simpleNumberRow("so2Pct", "Sulfur Dioxide (SO2)", "%", "")}
            ${simpleNumberRow("nh3Pct", "Ammonia (NH3)", "%", "")}
          </div>

          <div style="height:8px"></div>
          <div class="label">Resonance & Rotation</div>
          <div id="moonOrbitalSection">
            ${numWithSlider("forcedEcc", "Forced Eccentricity", "", "", 0, 0.2, 0.0001, "Forced Eccentricity")}
            <div class="form-row">
              <div>
                <div class="label">Resonance Group ${tipIcon(TIP_LABEL["Resonance Group"] || "")}</div>
                <div class="hint">Manual mode only. Leave blank for auto.</div>
              </div>
              <input id="resonanceGroup" type="text" />
            </div>
            ${simpleNumberRow("resonanceOrder", "Resonance Order", "", "Manual mode only. Smaller numbers are closer in.")}
            ${simpleNumberRow("resonanceRatio", "Resonance Ratio", "", "Use 2 for a 2:1-style manual chain, 1.5 for 3:2, etc.")}
          </div>

          <div style="height:8px"></div>
          <div class="label">Surface & Habitability</div>
          <div class="hint">Core mode keeps the page compact. Full and Manual reveal the deeper moon-environment controls above.</div>

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

  const overlayClosers = new Set();
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
  const hydModePillsEl = wrap.querySelector("#hydModePills");
  const atmModePillsEl = wrap.querySelector("#atmModePills");
  const orbModePillsEl = wrap.querySelector("#orbModePills");
  const hydModeHintEl = wrap.querySelector("#hydModeHint");
  const atmModeHintEl = wrap.querySelector("#atmModeHint");
  const orbModeHintEl = wrap.querySelector("#orbModeHint");
  const wmfEl = wrap.querySelector("#wmf");
  const salinityEl = wrap.querySelector("#salinity");
  const ammoniaEl = wrap.querySelector("#ammonia");
  const differentiatedInteriorEl = wrap.querySelector("#differentiatedInterior");
  const isoModePillsEl = wrap.querySelector("#isoModePills");
  const isoModeHintEl = wrap.querySelector("#isoModeHint");
  const radioAbundanceEl = wrap.querySelector("#radioAbundance");
  const u238El = wrap.querySelector("#u238");
  const u235El = wrap.querySelector("#u235");
  const th232El = wrap.querySelector("#th232");
  const k40El = wrap.querySelector("#k40");
  const manualPressureEl = wrap.querySelector("#manualPressure");
  const n2PctEl = wrap.querySelector("#n2Pct");
  const o2PctEl = wrap.querySelector("#o2Pct");
  const co2PctEl = wrap.querySelector("#co2Pct");
  const arPctEl = wrap.querySelector("#arPct");
  const h2oPctEl = wrap.querySelector("#h2oPct");
  const ch4PctEl = wrap.querySelector("#ch4Pct");
  const coPctEl = wrap.querySelector("#coPct");
  const h2PctEl = wrap.querySelector("#h2Pct");
  const hePctEl = wrap.querySelector("#hePct");
  const so2PctEl = wrap.querySelector("#so2Pct");
  const nh3PctEl = wrap.querySelector("#nh3Pct");
  const forcedEccEl = wrap.querySelector("#forcedEcc");
  const resonanceGroupEl = wrap.querySelector("#resonanceGroup");
  const resonanceOrderEl = wrap.querySelector("#resonanceOrder");
  const resonanceRatioEl = wrap.querySelector("#resonanceRatio");
  const moonCreateQuickBtn = wrap.querySelector("#moonCreateQuickBtn");
  const moonCreateGuidedBtn = wrap.querySelector("#moonCreateGuidedBtn");
  const moonCreateRecipesBtn = wrap.querySelector("#moonCreateRecipesBtn");
  const moonHydrosphereSectionEl = wrap.querySelector("#moonHydrosphereSection");
  const moonAtmosphereSectionEl = wrap.querySelector("#moonAtmosphereSection");
  const moonOrbitalSectionEl = wrap.querySelector("#moonOrbitalSection");
  const moonIsoSimpleRowsEl = wrap.querySelector("#moonIsoSimpleRows");
  const moonIsoAdvancedRowsEl = wrap.querySelector("#moonIsoAdvancedRows");

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
  bindPair("wmf", wmfEl, 0, 60, 0.1, "auto");
  bindPair("salinity", salinityEl, 0, 35, 0.1, "auto");
  bindPair("ammonia", ammoniaEl, 0, 30, 0.1, "auto");
  bindPair("radioAbundance", radioAbundanceEl, 0.1, 3, 0.01, "auto");
  bindPair("u238", u238El, 0, 5, 0.01, "auto");
  bindPair("u235", u235El, 0, 5, 0.01, "auto");
  bindPair("th232", th232El, 0, 5, 0.01, "auto");
  bindPair("k40", k40El, 0, 5, 0.01, "auto");
  bindPair("manualPressure", manualPressureEl, 0, 10, 0.01, "auto");
  bindPair("forcedEcc", forcedEccEl, 0, 0.2, 0.0001, "auto");

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
    for (const id of [
      "a",
      "e",
      "inc",
      "m",
      "density",
      "albedo",
      "initRot",
      "wmf",
      "salinity",
      "ammonia",
      "radioAbundance",
      "u238",
      "u235",
      "th232",
      "k40",
      "manualPressure",
      "forcedEcc",
    ]) {
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

  function getModeValue(container, name, fallback = "core") {
    return container?.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
  }

  function setModeValue(container, name, value, fallback = "core") {
    const targetValue = value || fallback;
    container?.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
      radio.checked = radio.value === targetValue;
    });
  }

  function syncMoonModeUi() {
    const hydMode = state.moon.hydrosphereMode || "core";
    const atmMode = state.moon.atmosphereMode || "core";
    const orbMode = state.moon.orbitalCouplingMode || "core";
    const isoMode = state.moon.radioisotopeMode || "simple";

    setModeValue(hydModePillsEl, "hydMode", hydMode);
    setModeValue(atmModePillsEl, "atmMode", atmMode);
    setModeValue(orbModePillsEl, "orbMode", orbMode);
    setModeValue(isoModePillsEl, "isoMode", isoMode, "simple");

    if (hydModeHintEl)
      hydModeHintEl.textContent =
        hydMode === "core"
          ? "Compatibility heuristics."
          : hydMode === "full"
            ? "Inventory-driven moon water and ice solving."
            : "Direct water/interior inputs with computed outputs.";
    if (atmModeHintEl)
      atmModeHintEl.textContent =
        atmMode === "core"
          ? "Retained-volatile atmosphere only."
          : atmMode === "full"
            ? "Computed atmosphere plus stability diagnostics."
            : "Manual pressure and gas mix with stability checks.";
    if (orbModeHintEl)
      orbModeHintEl.textContent =
        orbMode === "core"
          ? "Single-moon treatment."
          : orbMode === "full"
            ? "Sibling resonance and tidal-HZ analysis."
            : "Manual resonance-chain controls enabled.";
    if (isoModeHintEl)
      isoModeHintEl.textContent =
        isoMode === "advanced"
          ? "Advanced isotope-by-isotope moon heat inputs."
          : "Single moon radiogenic-heat multiplier.";

    if (moonHydrosphereSectionEl)
      moonHydrosphereSectionEl.style.display = hydMode === "core" ? "none" : "";
    if (moonAtmosphereSectionEl)
      moonAtmosphereSectionEl.style.display = atmMode === "manual" ? "" : "none";
    if (moonOrbitalSectionEl) moonOrbitalSectionEl.style.display = orbMode === "core" ? "none" : "";
    if (moonIsoSimpleRowsEl) {
      moonIsoSimpleRowsEl.style.display =
        hydMode === "core" ? "none" : isoMode === "advanced" ? "none" : "";
    }
    if (moonIsoAdvancedRowsEl) {
      moonIsoAdvancedRowsEl.style.display =
        hydMode === "core" || isoMode !== "advanced" ? "none" : "";
    }
    if (resonanceGroupEl) resonanceGroupEl.disabled = orbMode !== "manual";
    if (resonanceOrderEl) resonanceOrderEl.disabled = orbMode !== "manual";
    if (resonanceRatioEl) resonanceRatioEl.disabled = orbMode !== "manual";
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
      hydrosphereMode: getModeValue(hydModePillsEl, "hydMode"),
      atmosphereMode: getModeValue(atmModePillsEl, "atmMode"),
      orbitalCouplingMode: getModeValue(orbModePillsEl, "orbMode"),
      waterMassFractionPct: Number(wmfEl.value) || null,
      salinityPct: Number(salinityEl.value) || null,
      ammoniaPct: Number(ammoniaEl.value) || null,
      differentiatedInterior:
        differentiatedInteriorEl.value === "yes"
          ? true
          : differentiatedInteriorEl.value === "no"
            ? false
            : null,
      radioisotopeMode: getModeValue(isoModePillsEl, "isoMode", "simple"),
      radioisotopeAbundance: Number(radioAbundanceEl.value) || null,
      u238Abundance: Number(u238El.value) || null,
      u235Abundance: Number(u235El.value) || null,
      th232Abundance: Number(th232El.value) || null,
      k40Abundance: Number(k40El.value) || null,
      manualSurfacePressureAtm: Number(manualPressureEl.value) || null,
      n2Pct: Number(n2PctEl.value) || 0,
      o2Pct: Number(o2PctEl.value) || 0,
      co2Pct: Number(co2PctEl.value) || 0,
      arPct: Number(arPctEl.value) || 0,
      h2oPct: Number(h2oPctEl.value) || 0,
      ch4Pct: Number(ch4PctEl.value) || 0,
      coPct: Number(coPctEl.value) || 0,
      h2Pct: Number(h2PctEl.value) || 0,
      hePct: Number(hePctEl.value) || 0,
      so2Pct: Number(so2PctEl.value) || 0,
      nh3Pct: Number(nh3PctEl.value) || 0,
      forcedEccentricity: Number(forcedEccEl.value) || null,
      manualResonanceGroupId: resonanceGroupEl.value?.trim() || null,
      manualResonanceOrder: Number(resonanceOrderEl.value) || null,
      manualResonanceRatio: Number(resonanceRatioEl.value) || null,
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

  function applyMoonPresetInputs(nextInputs, { noticeLabel = "Moon preset" } = {}) {
    const w = loadWorld();
    const selMoon = getSelectedMoon(w);
    if (!selMoon) return null;

    const moonId = selMoon.id;
    const planetId = selMoon.planetId ?? state.moonPlanetId ?? null;
    const guardModel = solveMoonModelForWorld(w, {
      moonId,
      moonInputs: nextInputs,
      planetId,
    }).model;
    const guardCode = String(guardModel?.orbit?.semiMajorAxisGuard || "none");
    const guardedSemiMajorAxisKm = Number(guardModel?.inputs?.semiMajorAxisKm);
    const rawSemiMajorAxisKm = Number(nextInputs.semiMajorAxisKm);
    const roundedGuardedSemiMajorAxisKm = Number.isFinite(guardedSemiMajorAxisKm)
      ? Math.round(guardedSemiMajorAxisKm)
      : rawSemiMajorAxisKm;
    const useAdjustedAxis = guardCode !== "none" && Number.isFinite(roundedGuardedSemiMajorAxisKm);
    const appliedInputs = {
      ...nextInputs,
      semiMajorAxisKm: useAdjustedAxis ? roundedGuardedSemiMajorAxisKm : rawSemiMajorAxisKm,
    };

    updateMoon(moonId, { inputs: appliedInputs });
    updateWorld({ moon: appliedInputs });

    if (useAdjustedAxis && Math.abs(appliedInputs.semiMajorAxisKm - rawSemiMajorAxisKm) > 1e-9) {
      showMoonNotice(
        `${noticeLabel} adjusted the semi-major axis to ${fmt(appliedInputs.semiMajorAxisKm, 0)} km to keep this moon inside the Moon Zone.`,
      );
    }

    loadIntoInputs();
    render();
    return appliedInputs;
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

  function applyPreviewSiblingPatch(siblingEntries, siblingPatch, requestedPlanetId) {
    const operations = Array.isArray(siblingPatch?.operations) ? siblingPatch.operations : [];
    if (!operations.length) return siblingEntries;

    const nextEntries = (Array.isArray(siblingEntries) ? siblingEntries : []).map((entry) => ({
      ...entry,
      inputs: { ...(entry?.inputs || {}) },
    }));

    for (let index = 0; index < operations.length; index += 1) {
      const operation = operations[index];
      if (!operation || typeof operation !== "object") continue;

      if (operation.type === "update" && operation.moonId) {
        const siblingIndex = nextEntries.findIndex((entry) => entry?.id === operation.moonId);
        if (siblingIndex >= 0) {
          nextEntries[siblingIndex] = {
            ...nextEntries[siblingIndex],
            name: operation.name ?? nextEntries[siblingIndex].name,
            planetId:
              operation.planetId === undefined
                ? nextEntries[siblingIndex].planetId
                : (operation.planetId ?? null),
            inputs: {
              ...(nextEntries[siblingIndex].inputs || {}),
              ...(operation.inputPatch || {}),
            },
          };
        }
      } else if (operation.type === "create" && operation.inputs) {
        nextEntries.push({
          id: operation.previewId || `preview-sibling-${index + 1}`,
          name: operation.name || operation.inputs?.name || "Preview sibling",
          planetId:
            operation.planetId === undefined
              ? (requestedPlanetId ?? null)
              : (operation.planetId ?? null),
          inputs: { ...(operation.inputs || {}) },
        });
      }
    }

    return nextEntries;
  }

  function solveMoonModelForWorld(
    world,
    { moonId, moonInputs, planetId, parentPatch = null, siblingPatch = null },
  ) {
    const requestedPlanetId =
      parentPatch?.assignMoonToParentId != null ? parentPatch.assignMoonToParentId : planetId;
    const resolvedBase = resolvePlanetInputs(world, requestedPlanetId);
    const starModel = calcStar({
      massMsol: state.starMassMsol,
      ageGyr: state.starAgeGyr,
      metallicityFeH: state.starMetallicityFeH,
      radiusRsolOverride: state.starRadiusRsolOverride,
      luminosityLsolOverride: state.starLuminosityLsolOverride,
      tempKOverride: state.starTempKOverride,
      evolutionMode: state.starEvolutionMode,
    });
    const siblingEntries = listMoons(world)
      .filter((entry) => (entry.planetId ?? null) === (requestedPlanetId ?? null))
      .map((entry) => ({
        ...entry,
        inputs: entry.id === moonId ? moonInputs : entry.inputs,
      }));
    const patchedSiblingEntries = applyPreviewSiblingPatch(
      siblingEntries,
      siblingPatch,
      requestedPlanetId,
    );

    const resolved =
      parentPatch?.parentKind === "gasGiant" &&
      resolvedBase.type === "gasGiant" &&
      resolvedBase.gasGiant
        ? {
            ...resolvedBase,
            gasGiant: {
              ...resolvedBase.gasGiant,
              ...(parentPatch.inputPatch || {}),
            },
          }
        : parentPatch?.parentKind === "planet" && resolvedBase.type === "planet"
          ? {
              ...resolvedBase,
              inputs: {
                ...(resolvedBase.inputs || {}),
                ...(parentPatch.inputPatch || {}),
              },
            }
          : resolvedBase;

    if (resolved.type === "gasGiant" && resolved.gasGiant) {
      const gasParentModel = calcGasGiant({
        ...resolved.gasGiant,
        orbitAu: Number(resolved.gasGiant.au) || 5,
        starMassMsol: state.starMassMsol,
        starLuminosityLsol: starModel.luminosityLsol,
        starAgeGyr: state.starAgeGyr,
        starRadiusRsol: starModel.radiusRsol,
        stellarMetallicityFeH: state.starMetallicityFeH,
        otherGiants: listSystemGasGiants(world).filter(
          (giant) => giant.id !== resolved.gasGiant.id,
        ),
        moons: patchedSiblingEntries.map((entry) => entry.inputs || {}),
      });
      const parentOverride = buildGasGiantMoonParentOverride(gasParentModel);
      const solved = solveMoonSystem({
        starMassMsol: state.starMassMsol,
        starAgeGyr: state.starAgeGyr,
        starMetallicityFeH: state.starMetallicityFeH,
        starRadiusRsolOverride: state.starRadiusRsolOverride,
        starLuminosityLsolOverride: state.starLuminosityLsolOverride,
        starTempKOverride: state.starTempKOverride,
        starEvolutionMode: state.starEvolutionMode,
        starHabitableZoneAu: starModel.habitableZoneAu,
        parentKind: "gasGiant",
        parentOverride,
        moonEntries: patchedSiblingEntries.length
          ? patchedSiblingEntries
          : [{ id: moonId || "draft-moon", planetId: requestedPlanetId, inputs: moonInputs }],
      });
      return {
        parentType: "gasGiant",
        parentOverride,
        parentInfo: {
          parentId: resolved.gasGiant.id || requestedPlanetId || null,
          parentKind: "gasGiant",
          parentName: resolved.gasGiant.name || resolved.gasGiant.id || "Gas giant",
          assigned: requestedPlanetId != null,
          orbitAu:
            Number(resolved.gasGiant.au) || Number(parentOverride.inputs.semiMajorAxisAu) || null,
          eccentricity: Number(resolved.gasGiant.eccentricity) || 0,
          massEarth: Number(parentOverride.inputs.massEarth) || null,
          massMjup: Number(resolved.gasGiant.massMjup) || null,
          rotationPeriodHours: Number(resolved.gasGiant.rotationPeriodHours) || null,
          siblingCount: Math.max(patchedSiblingEntries.length - (moonId ? 1 : 0), 0),
          starHabitableZoneAu: starModel.habitableZoneAu || null,
        },
        contextText:
          `Star Mass: ${fmt(state.starMassMsol, 4)} Msol\n` +
          `Parent: ${resolved.gasGiant.name || resolved.gasGiant.id} (gas giant)\n` +
          `Parent orbit: ${fmt(parentOverride.inputs.semiMajorAxisAu, 3)} AU`,
        model:
          solved.find((entry) => entry.raw.id === moonId)?.model ||
          solved.find((entry) => entry.raw.inputs === moonInputs)?.model ||
          solved[0]?.model ||
          calcMoon({
            starMassMsol: state.starMassMsol,
            starAgeGyr: state.starAgeGyr,
            starMetallicityFeH: state.starMetallicityFeH,
            starRadiusRsolOverride: state.starRadiusRsolOverride,
            starLuminosityLsolOverride: state.starLuminosityLsolOverride,
            starTempKOverride: state.starTempKOverride,
            starEvolutionMode: state.starEvolutionMode,
            moon: moonInputs,
            parentOverride,
          }),
      };
    }

    const parentInputs = resolved.inputs || { ...world.planet };
    const rockyParentModel = calcPlanetExact({
      starMassMsol: state.starMassMsol,
      starAgeGyr: state.starAgeGyr,
      starMetallicityFeH: state.starMetallicityFeH,
      starRadiusRsolOverride: state.starRadiusRsolOverride,
      starLuminosityLsolOverride: state.starLuminosityLsolOverride,
      starTempKOverride: state.starTempKOverride,
      starEvolutionMode: state.starEvolutionMode,
      planet: parentInputs,
      moons: patchedSiblingEntries.map((entry) => entry.inputs || {}),
      gasGiants: listSystemGasGiants(world),
    });
    const parentOverride = buildRockyMoonParentOverride(rockyParentModel);
    const solved = solveMoonSystem({
      starMassMsol: state.starMassMsol,
      starAgeGyr: state.starAgeGyr,
      starMetallicityFeH: state.starMetallicityFeH,
      starRadiusRsolOverride: state.starRadiusRsolOverride,
      starLuminosityLsolOverride: state.starLuminosityLsolOverride,
      starTempKOverride: state.starTempKOverride,
      starEvolutionMode: state.starEvolutionMode,
      starHabitableZoneAu: starModel.habitableZoneAu,
      parentKind: "planet",
      parentOverride,
      moonEntries: patchedSiblingEntries.length
        ? patchedSiblingEntries
        : [{ id: moonId || "draft-moon", planetId: requestedPlanetId, inputs: moonInputs }],
    });
    return {
      parentType: "planet",
      parentOverride,
      parentInfo: {
        parentId: requestedPlanetId ?? null,
        parentKind: "planet",
        parentName: requestedPlanetId
          ? world.planets.byId?.[requestedPlanetId]?.name || "Planet"
          : "Planet",
        assigned: requestedPlanetId != null,
        orbitAu:
          Number(parentInputs.semiMajorAxisAu) ||
          Number(parentOverride.inputs.semiMajorAxisAu) ||
          null,
        eccentricity: Number(parentInputs.eccentricity) || 0,
        massEarth:
          Number(parentInputs.massEarth) || Number(parentOverride.inputs.massEarth) || null,
        massMjup: null,
        rotationPeriodHours: Number(parentInputs.rotationPeriodHours) || null,
        siblingCount: Math.max(patchedSiblingEntries.length - (moonId ? 1 : 0), 0),
        starHabitableZoneAu: starModel.habitableZoneAu || null,
      },
      contextText:
        `Star Mass: ${fmt(state.starMassMsol, 4)} Msol\n` +
        `Planet Mass: ${fmt(parentInputs.massEarth, 3)} MEarth\n` +
        `Planet orbit: ${fmt(parentInputs.semiMajorAxisAu, 3)} AU`,
      model:
        solved.find((entry) => entry.raw.id === moonId)?.model ||
        solved.find((entry) => entry.raw.inputs === moonInputs)?.model ||
        solved[0]?.model ||
        calcMoon({
          starMassMsol: state.starMassMsol,
          starAgeGyr: state.starAgeGyr,
          starMetallicityFeH: state.starMetallicityFeH,
          starRadiusRsolOverride: state.starRadiusRsolOverride,
          starLuminosityLsolOverride: state.starLuminosityLsolOverride,
          starTempKOverride: state.starTempKOverride,
          starEvolutionMode: state.starEvolutionMode,
          planet: parentInputs,
          moon: moonInputs,
        }),
    };
  }

  function render() {
    syncFromWorld();
    const solved = solveMoonModelForWorld(loadWorld(), {
      moonId: state.moonId,
      moonInputs: state.moon,
      planetId: state.moonPlanetId,
    });
    contextEl.textContent = solved.contextText;
    const model = solved.model;

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
    const moonHabitabilitySummary = model.habitability?.summary || {};
    const surfaceExomoonCalibration = moonHabitabilitySummary.surfaceExomoonCalibration || {};
    const surfaceExomoonCalibrationMeta =
      surfaceExomoonCalibration.applicable === true
        ? [
            surfaceExomoonCalibration.starClassBand,
            surfaceExomoonCalibration.hostGiantFavorability?.label,
            `Moon ${fmt(surfaceExomoonCalibration.moonMassEarth ?? 0, 3)} MEarth vs floor ${fmt(
              surfaceExomoonCalibration.moonMassFloorEarth ?? 0,
              3,
            )} MEarth`,
            surfaceExomoonCalibration.spinStateBenefit?.label,
            ...(surfaceExomoonCalibration.notes || []),
          ]
            .filter(Boolean)
            .join("\n")
        : "Applied only to exposed-surface, atmosphere-bearing moons around cool-star giant-planet systems.";
    const spinStateMeta = model.spinState?.climateNote || model.tides?.spinState?.climateNote || "";
    const habitabilityGateMeta = [
      moonHabitabilitySummary.gates?.stellarZone?.label,
      moonHabitabilitySummary.gates?.stableOrbit?.label,
      moonHabitabilitySummary.gates?.energyBudget?.label,
      moonHabitabilitySummary.gates?.atmosphereRetention?.label,
      moonHabitabilitySummary.gates?.radiationShielding?.label,
    ]
      .filter(Boolean)
      .join("\n");

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
          buildMoonKpi("Life Class", model.display.lifeClass, model.display.habitabilityGates),
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
          buildMoonKpi(
            "Atmosphere Stability",
            model.display.atmosphereStability,
            model.display.atmosphereLoss,
          ),
          buildMoonKpi("Atmosphere Lifetime", model.display.atmosphereLifetime),
          buildMoonKpi("Atmosphere Haze", model.display.atmosphereHaze),
          buildMoonKpi("Atmosphere Clouds", model.display.atmosphereClouds),
          buildMoonKpi("Hydrosphere", model.display.hydrosphereState),
          buildMoonKpi("Surface Ices", model.display.surfaceIces),
          buildMoonKpi("Surface Water", model.display.surfaceWater),
          buildMoonKpi("Subsurface Ocean", model.display.subsurfaceOcean),
          buildMoonKpi("Ocean Depth", model.display.oceanDepth),
          buildMoonKpi("Ice Shell", model.display.iceShell),
          buildMoonKpi("High-Pressure Ice", model.display.highPressureIce),
          buildMoonKpi("Interior Structure", model.display.interiorStructure),
          buildMoonKpi("Ocean Chemistry", model.display.oceanChemistry),
          buildMoonKpi("Equilibrium Temp", model.display.equilibriumTemp),
          buildMoonKpi("Climate State", model.display.climateState),
          buildMoonKpi("Collapse State", model.display.collapseState),
          buildMoonKpi("Surface Temp Range", model.display.surfaceTempRange),
          buildMoonKpi("Day/Night Contrast", model.display.dayNightContrast),
          buildMoonKpi("Nightside Min", model.display.nightsideMin),
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
          buildMoonKpi("Spin State", model.display.spinState, spinStateMeta),
          buildMoonKpi("Initial Rotation Period", model.display.initialRot),
          buildMoonKpi("Planetshine", model.display.planetshine),
          buildMoonKpi("Eclipse Cooling", model.display.eclipseCooling),
          buildMoonKpi("Nearest Resonance", model.display.nearestResonance),
          buildMoonKpi("Laplace Status", model.display.laplaceStatus),
          buildMoonKpi("Forced Eccentricity", model.display.forcedEccentricity),
          buildMoonKpi("Tidal HZ", model.display.tidalHabitableZone),
          buildMoonKpi("Formation", model.display.formation),
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
          buildMoonKpi("Surface Radiation", model.display.surfaceRadiation),
          buildMoonKpi("Magnetic Shielding", model.display.magneticShielding),
        ],
      },
      {
        id: "moon-habitability",
        title: "Habitability",
        density: "compact",
        items: [
          buildMoonKpi("Life Class", model.display.lifeClass, model.display.habitabilityGates),
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
            "Surface Habitability",
            model.display.surfaceHabitability,
            moonHabitabilitySummary.gates?.radiationShielding?.label || "",
          ),
          buildMoonKpi(
            "Surface Exomoon Calibration",
            model.display.surfaceExomoonCalibration,
            surfaceExomoonCalibrationMeta,
          ),
          buildMoonKpi("Subsurface Habitability", model.display.subsurfaceHabitability),
          buildMoonKpi("Habitability Gates", model.display.habitabilityGates, habitabilityGateMeta),
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
            {
              label: "Atmosphere Stability",
              value: model.display.atmosphereStability,
              meta: model.display.atmosphereLoss,
            },
            { label: "Atmosphere Lifetime", value: model.display.atmosphereLifetime },
            { label: "Atmosphere Haze", value: model.display.atmosphereHaze },
            { label: "Atmosphere Clouds", value: model.display.atmosphereClouds },
            { label: "Hydrosphere", value: model.display.hydrosphereState },
            { label: "Surface Water", value: model.display.surfaceWater },
            { label: "Subsurface Ocean", value: model.display.subsurfaceOcean },
            { label: "Ocean Depth", value: model.display.oceanDepth },
            { label: "Ice Shell", value: model.display.iceShell },
            { label: "High-Pressure Ice", value: model.display.highPressureIce },
            { label: "Interior Structure", value: model.display.interiorStructure },
            { label: "Ocean Chemistry", value: model.display.oceanChemistry },
            { label: "Climate State", value: model.display.climateState },
            { label: "Collapse State", value: model.display.collapseState },
            { label: "Day/Night Contrast", value: model.display.dayNightContrast },
            { label: "Nightside Min", value: model.display.nightsideMin },
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
            { label: "Spin State", value: model.display.spinState, meta: spinStateMeta },
            { label: "Initial Rotation Period", value: model.display.initialRot },
            { label: "Planetshine", value: model.display.planetshine },
            { label: "Eclipse Cooling", value: model.display.eclipseCooling },
            { label: "Nearest Resonance", value: model.display.nearestResonance },
            { label: "Laplace Status", value: model.display.laplaceStatus },
            { label: "Forced Eccentricity", value: model.display.forcedEccentricity },
            { label: "Tidal HZ", value: model.display.tidalHabitableZone },
            { label: "Formation", value: model.display.formation },
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
            { label: "Surface Radiation", value: model.display.surfaceRadiation },
            { label: "Magnetic Shielding", value: model.display.magneticShielding },
          ],
        },
        {
          id: "moon-details-habitability",
          title: "Habitability",
          items: [
            {
              label: "Life Class",
              value: model.display.lifeClass,
              meta: model.display.habitabilityGates,
            },
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
              label: "Surface Habitability",
              value: model.display.surfaceHabitability,
              meta: moonHabitabilitySummary.gates?.radiationShielding?.label || "",
            },
            {
              label: "Surface Exomoon Calibration",
              value: model.display.surfaceExomoonCalibration,
              meta: surfaceExomoonCalibrationMeta.replace(/\n/g, " | "),
            },
            {
              label: "Subsurface Habitability",
              value: model.display.subsurfaceHabitability,
            },
            {
              label: "Habitability Gates",
              value: model.display.habitabilityGates,
              meta: habitabilityGateMeta.replace(/\n/g, " | "),
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
    wmfEl.value = state.moon.waterMassFractionPct ?? 0;
    salinityEl.value = state.moon.salinityPct ?? 0;
    ammoniaEl.value = state.moon.ammoniaPct ?? 0;
    differentiatedInteriorEl.value =
      state.moon.differentiatedInterior === true
        ? "yes"
        : state.moon.differentiatedInterior === false
          ? "no"
          : "";
    radioAbundanceEl.value = state.moon.radioisotopeAbundance ?? 1;
    u238El.value = state.moon.u238Abundance ?? 1;
    u235El.value = state.moon.u235Abundance ?? 1;
    th232El.value = state.moon.th232Abundance ?? 1;
    k40El.value = state.moon.k40Abundance ?? 1;
    manualPressureEl.value = state.moon.manualSurfacePressureAtm ?? 0;
    n2PctEl.value = state.moon.n2Pct ?? 0;
    o2PctEl.value = state.moon.o2Pct ?? 0;
    co2PctEl.value = state.moon.co2Pct ?? 0;
    arPctEl.value = state.moon.arPct ?? 0;
    h2oPctEl.value = state.moon.h2oPct ?? 0;
    ch4PctEl.value = state.moon.ch4Pct ?? 0;
    coPctEl.value = state.moon.coPct ?? 0;
    h2PctEl.value = state.moon.h2Pct ?? 0;
    hePctEl.value = state.moon.hePct ?? 0;
    so2PctEl.value = state.moon.so2Pct ?? 0;
    nh3PctEl.value = state.moon.nh3Pct ?? 0;
    forcedEccEl.value = state.moon.forcedEccentricity ?? 0;
    resonanceGroupEl.value = state.moon.manualResonanceGroupId || "";
    resonanceOrderEl.value = state.moon.manualResonanceOrder ?? "";
    resonanceRatioEl.value = state.moon.manualResonanceRatio ?? "";
    syncBoundPairs();
    syncMoonModeUi();
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
    const guardModel = solveMoonModelForWorld(w, {
      moonId,
      moonInputs: draftInputs,
      planetId,
    }).model;
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
  differentiatedInteriorEl.addEventListener("change", applyFromInputs);
  resonanceGroupEl.addEventListener("change", applyFromInputs);
  resonanceOrderEl.addEventListener("change", applyFromInputs);
  resonanceRatioEl.addEventListener("change", applyFromInputs);
  [hydModePillsEl, atmModePillsEl, orbModePillsEl, isoModePillsEl].forEach((container) => {
    container?.addEventListener("change", () => {
      applyFromInputs();
      syncMoonModeUi();
    });
  });
  [
    n2PctEl,
    o2PctEl,
    co2PctEl,
    arPctEl,
    h2oPctEl,
    ch4PctEl,
    coPctEl,
    h2PctEl,
    hePctEl,
    so2PctEl,
    nh3PctEl,
  ].forEach((input) => {
    input?.addEventListener("change", applyFromInputs);
  });

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

  moonCreateQuickBtn?.addEventListener("click", () => {
    openMoonGuidedQuickPicker();
  });
  moonCreateGuidedBtn?.addEventListener("click", () => {
    openMoonGuidedFlow();
  });
  moonCreateRecipesBtn?.addEventListener("click", () => {
    openMoonRecipePicker((recipe) => {
      applyMoonPresetInputs(buildMoonRecipeApplyInputs(recipe.apply, recipe.id), {
        noticeLabel: recipe.label || "Moon recipe",
      });
    });
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

  const moonGuidedSteps = Object.freeze([
    { id: "type", label: "Goal" },
    { id: "parent-context", label: "Setup" },
    { id: "goal-details", label: "Traits" },
    { id: "recommendation", label: "Recommendation" },
  ]);

  function moonGuidedStepIndex(stepId) {
    const index = moonGuidedSteps.findIndex((step) => step.id === String(stepId || ""));
    return index >= 0 ? index : 0;
  }

  function buildMoonGuidedContext() {
    const world = loadWorld();
    const selectedMoon = getSelectedMoon(world);
    const activeMoonId = selectedMoon?.id || state.moonId;
    const activePlanetId = selectedMoon?.planetId ?? state.moonPlanetId ?? null;
    const activeMoonInputs = selectedMoon?.inputs || state.moon;
    const solvedContext = solveMoonModelForWorld(world, {
      moonId: activeMoonId,
      moonInputs: activeMoonInputs,
      planetId: activePlanetId,
    });
    const currentContextLabel =
      solvedContext.parentInfo?.assigned === false
        ? "No assigned parent"
        : solvedContext.parentType === "gasGiant"
          ? "Current gas giant system"
          : "Current planet system";
    const currentContextText =
      solvedContext.parentInfo?.assigned === false
        ? `${solvedContext.contextText}\nMoon is currently unassigned. Assign it to a planet or gas giant before using strict guided fitting.`
        : solvedContext.contextText;

    return {
      currentMoonId: activeMoonId,
      currentMoonName: state.moonName || state.moon.name || "Moon",
      currentInputs: { ...(activeMoonInputs || {}) },
      currentOrbitWindowKm: {
        inner:
          Number(
            solvedContext.model?.orbit?.zoneInnerKm ?? solvedContext.model?.orbit?.moonZoneInnerKm,
          ) || null,
        outer:
          Number(
            solvedContext.model?.orbit?.zoneOuterKm ?? solvedContext.model?.orbit?.moonZoneOuterKm,
          ) || null,
      },
      siblingEntries: listMoons(world).filter(
        (entry) =>
          entry?.id !== activeMoonId && (entry?.planetId ?? null) === (activePlanetId ?? null),
      ),
      currentContextLabel,
      currentContextText,
      parentContext: solvedContext.parentInfo || null,
      starHabitableZoneAu: solvedContext.parentInfo?.starHabitableZoneAu || null,
      recipeCatalog: MOON_RECIPES,
      solveMoonInputs: (moonInputs, options = {}) => {
        const latestWorld = loadWorld();
        const latestSelectedMoon = getSelectedMoon(latestWorld);
        return solveMoonModelForWorld(latestWorld, {
          moonId: latestSelectedMoon?.id || activeMoonId,
          moonInputs,
          planetId: latestSelectedMoon?.planetId ?? activePlanetId,
          parentPatch: options.parentPatch || null,
          siblingPatch: options.siblingPatch || null,
        });
      },
    };
  }

  function buildMoonGoalQuestionValues(flowState, questions = []) {
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
      } else if (String(question?.id || "").startsWith("traitRole:")) {
        const traitId = String(question.id).slice("traitRole:".length);
        values[question.id] = traitRoles[traitId] || "off";
      }
    }
    return values;
  }

  function setMoonGoalDraftValue(controllerRef, flowState, questionId, value) {
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

  function buildMoonGoalTextAssist(resolveController, flowState) {
    const goalDraft =
      flowState?.goalDraft &&
      typeof flowState.goalDraft === "object" &&
      !Array.isArray(flowState.goalDraft)
        ? flowState.goalDraft
        : {};
    const help = getGoalTextAliasHelp("moon");
    return createGoalTextAssist({
      objectLabel: "moon",
      value: goalDraft.goalText || "",
      placeholder: help.placeholder,
      examples: help.examples,
      interpretation: goalDraft.goalTextInterpretation || null,
      onInterpret: (value) =>
        applyGuidedGoalTextInterpretation(resolveController?.(), flowState, "moon", value),
      onClear: () => clearGuidedGoalTextInterpretation(resolveController?.(), flowState),
    });
  }

  function buildMoonGoalStatus(flowState) {
    const compileDiagnostics = Array.isArray(flowState?.compileDiagnostics)
      ? flowState.compileDiagnostics
      : [];
    const searchStatus = String(flowState?.searchStatus || "idle");
    const hasRestoredResult = !!flowState?.lastSearchResult?.recommendation;
    const title =
      searchStatus === "searching"
        ? "Goal search in progress"
        : searchStatus === "complete"
          ? hasRestoredResult
            ? "Goal search result ready"
            : "Ready to search"
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
      detailParts.push("The structured goal is valid. Run Search to try seeded moon candidates.");
    } else if (searchStatus === "searching") {
      detailParts.push("Trying seeded moon candidates against the current parent context.");
    } else if (searchStatus === "complete") {
      detailParts.push("Review the result, diagnostics, and context adjustments before applying.");
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

  function getMoonGuidedSessionTarget() {
    const world = loadWorld();
    const selectedMoon = getSelectedMoon(world);
    return {
      objectKey: selectedMoon?.id || "",
      contextFingerprint: createGuidedContextFingerprint({
        moonId: selectedMoon?.id || "",
        planetId: selectedMoon?.planetId || null,
        inputs: selectedMoon?.inputs || null,
      }),
    };
  }

  function createMoonGuidedPreviewMetric(label, value, meta = "") {
    const displayValue =
      value == null || value === ""
        ? "n/a"
        : typeof value === "number" && !Number.isFinite(value)
          ? "n/a"
          : String(value);
    return createElement("div", { className: "moon-guided-preview__metric" }, [
      createElement("div", {
        className: "moon-guided-preview__metric-label",
        text: label,
      }),
      createElement("div", {
        className: "moon-guided-preview__metric-value",
        text: displayValue,
      }),
      meta
        ? createElement("div", {
            className: "moon-guided-preview__metric-meta",
            text: meta,
          })
        : null,
    ]);
  }

  function createMoonGuidedPreviewContent(recommendation) {
    const model = recommendation?.previewPayload?.moonCalc;
    if (!model) return null;
    const adjustmentSummary = (recommendation?.contextAdjustments || []).join(" ");
    const hasParentPatch = !!recommendation?.applyPayload?.parentPatch;
    const hasSiblingPatch = !!recommendation?.applyPayload?.siblingPatch;
    return createElement("div", { className: "moon-guided-preview" }, [
      createElement("div", {
        className: "moon-guided-preview__title",
        text:
          hasParentPatch && hasSiblingPatch
            ? "Solved preview after applying the recommended host and moon-system fixes"
            : hasParentPatch
              ? "Solved preview after applying the recommended host fixes"
              : hasSiblingPatch
                ? "Solved preview after applying the recommended moon-system fixes"
                : "Solved preview in the current host context",
      }),
      createElement("div", { className: "moon-guided-preview__grid" }, [
        createMoonGuidedPreviewMetric("Hydrosphere", model.display?.hydrosphereState),
        createMoonGuidedPreviewMetric(
          "Atmosphere",
          model.display?.atmosphereClass,
          model.display?.surfacePressure,
        ),
        createMoonGuidedPreviewMetric("Climate", model.display?.climateState),
        createMoonGuidedPreviewMetric(
          "Biosphere",
          model.display?.surfaceBiosphere,
          model.display?.vegetation,
        ),
      ]),
      adjustmentSummary
        ? createElement("div", {
            className: "moon-guided-preview__summary",
            text: adjustmentSummary,
          })
        : null,
    ]);
  }

  function applyMoonParentPatch(parentPatch) {
    if (!parentPatch || !parentPatch.parentId || !parentPatch.parentKind) return false;

    if (parentPatch.parentKind === "planet") {
      updatePlanet(parentPatch.parentId, {
        inputs: {
          ...(parentPatch.inputPatch || {}),
        },
      });
      return true;
    }

    if (parentPatch.parentKind === "gasGiant") {
      const nextGasGiants = listSystemGasGiants().map((gasGiant) =>
        gasGiant.id === parentPatch.parentId
          ? {
              ...gasGiant,
              ...(parentPatch.inputPatch || {}),
            }
          : gasGiant,
      );
      saveSystemGasGiants(nextGasGiants);
      return true;
    }

    return false;
  }

  function applyMoonGuidedRecommendation(recommendation, { noticeLabel = "Guided moon" } = {}) {
    const parentPatched = applyMoonParentPatch(recommendation?.applyPayload?.parentPatch || null);
    const siblingPatchResult = applyMoonSiblingPatch(
      recommendation?.applyPayload?.siblingPatch || null,
      {
        preserveSelectedMoonId: loadWorld().moons?.selectedId || null,
      },
    );
    const appliedInputs = applyMoonPresetInputs(recommendation?.applyPayload?.objectInputs || {}, {
      noticeLabel,
    });
    return {
      appliedInputs,
      parentPatched,
      parentPatchSummary: recommendation?.applyPayload?.parentPatch?.summary || "",
      siblingPatched: !!siblingPatchResult?.changed,
      siblingPatchSummary: recommendation?.applyPayload?.siblingPatch?.summary || "",
      siblingPatchCreatedCount: siblingPatchResult?.createdMoonIds?.length || 0,
      siblingPatchUpdatedCount: siblingPatchResult?.updatedMoonIds?.length || 0,
    };
  }

  function openMoonGuidedQuickPicker(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureMoonGuidedAdapterRegistered();
    const context = buildMoonGuidedContext();
    const sessionTarget = getMoonGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createMoonGuidedCreationOverlay();
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("moon");
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
        objectType: "moon",
        uxMode: "quick",
        selectedArchetypeId: restoredSession?.selectedArchetypeId || "",
        answers: restoredSession?.answers || {},
      },
      onUpdate: ({ state: flowState, archetypes, questions, recommendation }) => {
        const panel = createGuidedPanel({
          title: "Moon Quick Types",
          subtitle:
            "Pick a defensible starting point. Each option maps to an engine-backed moon preset and is re-solved in the current parent context.",
          archetypes: (archetypes || []).filter((entry) => entry?.quickEnabled !== false),
          selectedArchetypeId: flowState.selectedArchetypeId || "",
          questions,
          answers: flowState.answers,
          recommendation,
          previewContent: createMoonGuidedPreviewContent(recommendation),
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
              applyMoonInputs: (objectInputs) =>
                applyMoonPresetInputs(objectInputs, {
                  noticeLabel: recommendation.title || "Moon quick type",
                }),
            });
            close();
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("moon", {
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

  function openMoonGuidedFlow(restoredSession = null, dedicatedBaseHash = "") {
    const adapter = ensureMoonGuidedAdapterRegistered();
    const context = buildMoonGuidedContext();
    const sessionTarget = getMoonGuidedSessionTarget();
    const { overlayEl, contentEl, closeButtonEl } = createMoonGuidedCreationOverlay();
    let controller = null;

    function teardownOverlay(preserveSession = false) {
      controller?.cancelSearch?.("overlay-closed");
      overlayClosers.delete(preserveClose);
      if (!preserveSession) clearGuidedSession("moon");
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

    function nextMoonGuidedStepId(flowState, questions = []) {
      const currentId = String(flowState?.currentStepId || "type");
      if (currentId === "type") return "parent-context";
      if (currentId === "parent-context") {
        return questions.some((question) => question?.stepId === "goal-details")
          ? "goal-details"
          : "recommendation";
      }
      return "recommendation";
    }

    function previousMoonGuidedStepId(flowState) {
      const currentId = String(flowState?.currentStepId || "type");
      if (currentId === "recommendation") {
        return (flowState?.questions || []).some((question) => question?.stepId === "goal-details")
          ? "goal-details"
          : "parent-context";
      }
      if (currentId === "goal-details") return "parent-context";
      if (currentId === "parent-context") return "type";
      return "type";
    }

    controller = createGuidedFlowController({
      adapter,
      context,
      searchMode: "manual",
      initialState: {
        objectType: "moon",
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
      onUpdate: ({ state: flowState, archetypes, questions, recommendation }) => {
        const currentStepId = String(flowState.currentStepId || "type");
        const currentStepIndex = moonGuidedStepIndex(currentStepId);
        const filteredQuestions = (questions || []).filter(
          (question) => String(question?.stepId || "goal-details") === currentStepId,
        );
        const questionValues = buildMoonGoalQuestionValues(flowState, filteredQuestions);
        const hasGoalStep = (questions || []).some(
          (question) => question?.stepId === "goal-details",
        );
        const steps = moonGuidedSteps.map((step, index) => ({
          ...step,
          disabled:
            (step.id !== "type" && !flowState.selectedGoalTemplateId) ||
            (step.id === "goal-details" && !hasGoalStep) ||
            (step.id === "recommendation" &&
              (!flowState.selectedGoalTemplateId || index > currentStepIndex + 1)),
        }));

        const panel = createGuidedPanel({
          title: "Moon Goal Builder",
          subtitle:
            "Choose the moon outcome you want, set scope and search budget, then compile and run a seeded goal search before applying the recommendation.",
          steps,
          currentStepId,
          archetypes: (archetypes || []).filter((entry) => entry?.guidedEnabled !== false),
          selectedArchetypeId: flowState.selectedGoalTemplateId || "",
          typeSupplement:
            currentStepId === "type" ? buildMoonGoalTextAssist(() => controller, flowState) : null,
          questions: filteredQuestions,
          answers: questionValues,
          recommendation,
          status: currentStepId === "recommendation" ? buildMoonGoalStatus(flowState) : null,
          previewContent:
            currentStepId === "recommendation"
              ? createMoonGuidedPreviewContent(recommendation)
              : null,
          visibleSections: {
            type: currentStepId === "type",
            questions: currentStepId === "parent-context" || currentStepId === "goal-details",
            status: currentStepId === "recommendation",
            recommendation: currentStepId === "recommendation",
            diagnostics: currentStepId === "recommendation",
          },
          typeSectionTitle: "Moon Goal",
          questionSectionTitle: currentStepId === "parent-context" ? "Search Setup" : "Goal Traits",
          recommendationSectionTitle: "Best Moon Fit",
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
                    label:
                      recommendation?.applyPayload?.parentPatch &&
                      recommendation?.applyPayload?.siblingPatch
                        ? "Apply with Host + Moon-System Fixes"
                        : recommendation?.applyPayload?.parentPatch
                          ? "Apply with Host Fixes"
                          : recommendation?.applyPayload?.siblingPatch
                            ? "Apply with Moon-System Fixes"
                            : "Apply",
                    disabled:
                      !recommendation ||
                      recommendation.hasBlockingDiagnostics ||
                      flowState.searchStatus !== "complete",
                  },
                  {
                    id: "apply-advanced",
                    label:
                      recommendation?.applyPayload?.parentPatch &&
                      recommendation?.applyPayload?.siblingPatch
                        ? "Apply with Host + Moon-System Fixes and open Advanced"
                        : recommendation?.applyPayload?.parentPatch
                          ? "Apply with Host Fixes and open Advanced"
                          : recommendation?.applyPayload?.siblingPatch
                            ? "Apply with Moon-System Fixes and open Advanced"
                            : "Apply and open Advanced",
                    disabled:
                      !recommendation ||
                      recommendation.hasBlockingDiagnostics ||
                      flowState.searchStatus !== "complete",
                  },
                ]),
            {
              id: "reset",
              label: "Reset",
              className: "is-secondary",
            },
          ],
          onArchetypeSelect: (goalTemplateId) =>
            controller?.reset({
              objectType: "moon",
              uxMode: "guided",
              currentStepId: "type",
              selectedArchetypeId: goalTemplateId,
              selectedGoalTemplateId: goalTemplateId,
            }),
          onQuestionChange: (questionId, value) =>
            setMoonGoalDraftValue(controller, flowState, questionId, value),
          onStepSelect: (stepId, step) => {
            if (step?.disabled) return;
            controller?.setStep(stepId);
          },
          onAction: (actionId) => {
            if (actionId === "reset") {
              controller?.reset({
                objectType: "moon",
                uxMode: "guided",
                currentStepId: "type",
              });
              return;
            }
            if (actionId === "back") {
              controller?.setStep(previousMoonGuidedStepId(flowState));
              return;
            }
            if (actionId === "next") {
              controller?.setStep(nextMoonGuidedStepId(flowState, questions));
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
              const applyResult = controller?.apply({
                applyMoonRecommendation: (nextRecommendation) =>
                  applyMoonGuidedRecommendation(nextRecommendation, {
                    noticeLabel: recommendation.title || "Guided moon",
                  }),
              });
              close();
              const fixFragments = [];
              if (applyResult?.parentPatched && applyResult?.parentPatchSummary) {
                fixFragments.push(`host fixes: ${applyResult.parentPatchSummary}`);
              }
              if (applyResult?.siblingPatched && applyResult?.siblingPatchSummary) {
                fixFragments.push(`moon-system fixes: ${applyResult.siblingPatchSummary}`);
              }
              const fixPrefix = fixFragments.length
                ? `${recommendation.title || "Guided moon"} applied with ${fixFragments.join("; ")}. `
                : "";
              if (actionId === "apply-advanced") {
                showMoonNotice(`${fixPrefix}Continue refining with the Moon page controls.`);
              } else if (fixPrefix) {
                showMoonNotice(fixPrefix.trim());
              }
            }
          },
        });
        contentEl.replaceChildren(panel);
        saveGuidedSession("moon", {
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
      overlayClosers.delete(close);
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
    overlayClosers.add(close);
    document.addEventListener("keydown", onKey);
  }

  // Init
  loadIntoInputs();
  render();

  const pendingGuidedLaunch = consumeGuidedCreationLaunch("moon");
  if (guidedRoute?.dedicated && guidedRoute.objectType === "moon") {
    const restoredMoonSession = loadGuidedSession("moon", getMoonGuidedSessionTarget());
    if (guidedRoute.uxMode === "quick") {
      openMoonGuidedQuickPicker(
        restoredMoonSession?.uxMode === "quick" ? restoredMoonSession : null,
        guidedRoute.baseHash || "",
      );
    } else {
      openMoonGuidedFlow(
        restoredMoonSession?.uxMode === "guided" ? restoredMoonSession : null,
        guidedRoute.baseHash || "",
      );
    }
  } else if (pendingGuidedLaunch?.uxMode === "quick") {
    openMoonGuidedQuickPicker();
  } else if (pendingGuidedLaunch) {
    openMoonGuidedFlow();
  } else {
    const restoredMoonSession = loadGuidedSession("moon", getMoonGuidedSessionTarget());
    if (restoredMoonSession?.uxMode === "quick") {
      openMoonGuidedQuickPicker(restoredMoonSession);
    } else if (restoredMoonSession) {
      openMoonGuidedFlow(restoredMoonSession);
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

function trioToggle(id, name, options = []) {
  return `
    <div id="${id}" class="physics-trio-toggle">
      ${options
        .map(
          (option, index) => `
            <input type="radio" name="${name}" id="${id}_${index}" value="${option.value}" ${option.checked ? "checked" : ""} />
            <label for="${id}_${index}">${option.label}</label>`,
        )
        .join("")}
      <span></span>
    </div>`;
}

function duoToggle(id, name, options = []) {
  return `
    <div id="${id}" class="physics-duo-toggle">
      ${options
        .map(
          (option, index) => `
            <input type="radio" name="${name}" id="${id}_${index}" value="${option.value}" ${option.checked ? "checked" : ""} />
            <label for="${id}_${index}">${option.label}</label>`,
        )
        .join("")}
      <span></span>
    </div>`;
}

function modeToggleRow(id, name, label, tipKey, options, hintId) {
  return `
  <div class="form-row">
    <div>
      <div class="label">${label} ${tipIcon(TIP_LABEL[tipKey] || "")}</div>
      <div class="hint" id="${hintId}"></div>
    </div>
    <div class="pill-toggle-wrap">
      ${trioToggle(id, name, options)}
    </div>
  </div>`;
}

function simpleNumberRow(id, label, unit = "", hint = "") {
  const unitHtml = unit ? ` <span class="unit">${unit}</span>` : "";
  return `
  <div class="form-row">
    <div>
      <div class="label">${label}${unitHtml}</div>
      <div class="hint">${hint}</div>
    </div>
    <input id="${id}" type="number" step="0.01" />
  </div>`;
}
