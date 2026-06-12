export const PLANET_TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "The Planets page is the main editor for planet-class bodies: rocky worlds, " +
      "volatile mini-Neptunes, ice giants, gas giants, and substellar companions. " +
      "Use the left column for authored inputs. Use the right column to read the " +
      "model's derived outputs, warnings, and downstream page guidance.",
  },
  {
    title: "Select, Search, or Create",
    body:
      "Start at Body selection. Search existing bodies, switch between them, or " +
      "choose a new body intent before clicking New body. Rocky quick start and " +
      "Gas giant quick start keep the old fast paths for common workflows.",
  },
  {
    title: "Host Frame and Orbital Slot",
    body:
      "Every body needs a host frame and orbital slot. In single-star systems this " +
      "is simple. In binary or higher systems, the host frame changes habitable-zone " +
      "placement, companion heating, stability limits, and where the body appears " +
      "on the System and Visualizer pages.",
  },
  {
    title: "Creation Modes",
    body:
      "Use Create This Rocky World or Create This Gas Giant at the top of Inputs. " +
      "Quick applies an archetype, Guided searches for a recommended setup, Recipes " +
      "applies an exact template, and Advanced leaves you in the direct editor.",
  },
  {
    title: "Classification Summary",
    body:
      "The summary under Body selection is the compact reading of the model. It " +
      "shows the broad family, confidence, primary subtype when present, evidence " +
      "notes, and whether surface-focused pages should treat the body as normal, " +
      "limited, or unsupported.",
  },
  {
    title: "Mass and Composition",
    body:
      "For rocky planets, set Mass, Core Mass Fraction (CMF), and Water Mass " +
      "Fraction (WMF). The Auto button for CMF derives a value from stellar " +
      "metallicity. These inputs drive radius, density, surface gravity, core " +
      "radius, water regime, and iron-rich or water-rich subtype evidence.",
  },
  {
    title: "Volatiles and Observed Radius",
    body:
      "H/He Envelope and Observed Radius let low-density worlds move into the " +
      "volatile solver. Use them for sub-Neptunes, mini-Neptunes, super-puffs, " +
      "ice giants, and Hycean candidates. Observed Radius is best for transit-like " +
      "measurements where the visible photosphere is larger than the solid body.",
  },
  {
    title: "Orbit and Rotation",
    body:
      "Set semi-major axis, eccentricity, inclination, and rotation period. " +
      "These determine year length, tidal locking, and day/night cycles. " +
      "Habitable-zone status, stellar flux, surface temperature, and close-in " +
      "lava or envelope-loss warnings appear in outputs when the evidence supports them.",
  },
  {
    title: "Atmosphere",
    body:
      "Set atmospheric pressure and gas composition. Choose a greenhouse mode: " +
      "Core uses CO2/H2O/CH4, Full adds expert gases, Manual lets you set " +
      "the effect directly. Atmospheric escape can zero gases the body is too " +
      "small, too hot, or too irradiated to keep.",
  },
  {
    title: "Climate and Surface State",
    body:
      "Outputs distinguish equilibrium temperature, greenhouse-warmed surface " +
      "temperature, climate state, UV shielding, photochemistry, and surface " +
      "state. Treat habitability scores as comparative guidance, not a final " +
      "yes-or-no verdict.",
  },
  {
    title: "Geology, Rings, and Appearance",
    body:
      "Tectonic regime, mantle oxidation, internal heat, rings, water, ice, clouds, " +
      "and vegetation controls shape the visual preview. Auto settings follow the " +
      "science model; forced ring and manual appearance choices are useful for " +
      "authored worlds but can intentionally override plausibility.",
  },
  {
    title: "Exotic Subtypes",
    body:
      "Subtype labels are evidence overlays on top of the broad family. Carbon-rich, " +
      "ocean/water, steam, lava, icy dwarf, chthonian, rogue, sub-Neptune, Hycean, " +
      "inflated, and super-puff candidates appear only when their input evidence is " +
      "strong enough. They are conservative hints, not full formation histories.",
  },
  {
    title: "Gas Giants and Companions",
    body:
      "Gas giants use radius as the primary input; mass and metallicity can be " +
      "auto-derived. Sudarsky class, ring type, and atmospheric bands are " +
      "computed from temperature and composition. Very massive companions can be " +
      "tracked as brown-dwarf-like substellar companions while still sharing the " +
      "planet-class placement workflow.",
  },
  {
    title: "Downstream Pages",
    body:
      "Planets feed the Moon parent list, System page orbits, Visualizer placement, " +
      "Climate, Tectonics, Population, Apparent Sky, and Calendar pages. If a " +
      "downstream page warns that a subtype has limited surface applicability, " +
      "use that page's output as a constrained approximation.",
  },
  {
    title: "Sanity-Check Workflow",
    body:
      "After major edits, scan the classification summary, key KPIs, warnings, " +
      "and visual preview together. If a result looks surprising, check whether " +
      "the inputs intentionally describe an observed world, an authored override, " +
      "or an edge case where the conservative subtype evidence is doing its job.",
  },
];
