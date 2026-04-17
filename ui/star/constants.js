export const TIP_LABEL = {
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
