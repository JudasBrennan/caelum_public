import { structuredTip } from "../tooltipCopy.js";

export const TIP_LABEL = {
  Name: "Display name used in exports, the visualiser, and linked pages.",
  Class:
    'Hydrogen-burning stars use the familiar O, B, A, F, G, K, M classes.\n\nBrown dwarfs use cooler L, T, and Y classes and are substellar cooling objects rather than main-sequence stars.\n\nEach class is subdivided 0\u20139 (0 = hottest within class). "V" denotes a main-sequence star undergoing core hydrogen fusion.',
  "Class Input": structuredTip({
    overview: 'Enter a supported stellar class such as "G2V", "K dwarf", "red dwarf", or "T6 BD".',
    feedsInto:
      "The mass shortcut, brown-dwarf cooling lookup, displayed class label, luminosity/radius/temperature solve, and downstream planet/moon host context.",
    changes:
      "Main-sequence O/B/A/F/G/K/M entries resolve through the normal star engine. Brown-dwarf L/T/Y entries resolve against current age because brown dwarfs cool over time.",
    caveat:
      "Unsupported luminosity classes such as giants, subgiants, white dwarfs, and Wolf-Rayet stars are outside v1.",
    references: "See Science & Maths: stellar classification and brown-dwarf cooling.",
  }),
  "Brown Dwarf Class": structuredTip({
    overview:
      "Brown dwarfs use the L, T, and Y sequence from hottest to coolest; the number runs 0-9 within each family.",
    drawnFrom: "The solved brown-dwarf temperature, luminosity, mass band, and current system age.",
    interpretAs:
      'L = warmer dusty brown dwarf; T = cooler methane-rich brown dwarf; Y = coldest known brown-dwarf class. "T9 BD" means a very cool late-T brown dwarf near the T/Y boundary.',
    caveat:
      "Brown dwarfs are substellar cooling objects, not main-sequence hydrogen-burning stars.",
    references: "See Science & Maths: brown-dwarf cooling tracks.",
  }),
  Mass: structuredTip({
    overview: "Host-component mass in solar masses.",
    feedsInto:
      "Stellar class, radius, luminosity, lifetime, lifecycle endpoint, habitable zone, activity context, and downstream planet/moon environment.",
    interpretAs:
      "Approximate regimes: brown dwarf ~0.0124-0.0716 Msol; M star ~0.075-0.47; K ~0.47-0.84; G ~0.84-1.06; F ~1.06-1.44; A ~1.44-2.19; B ~2.19-16; O ~16+.",
    caveat:
      "Hydrogen-burning stars between about 0.5 and 1.4 Msol are treated as the most suitable broad range for Earth-like life.",
    references: "See Science & Maths: stellar mass, luminosity, and lifecycle tracks.",
  }),
  "Current Age": structuredTip({
    overview: "Star age in billions of years (Gyr).",
    feedsInto:
      "Stellar lifecycle stage, evolved luminosity/radius, activity regime, XUV history, habitable-zone migration, and System Fate timeline placement.",
    interpretAs: "Must be less than the maximum age reported by the solved stellar model.",
    caveat:
      "Age-sensitive outputs are analytic track estimates, not full stellar-structure simulations.",
    references: "See Science & Maths: stellar lifecycle tracks.",
  }),
  "Maximum Age": structuredTip({
    overview:
      "Approximate time available before the star leaves or exhausts its supported lifecycle phase.",
    drawnFrom:
      "Mass, luminosity, metallicity, and the active lifecycle approximation. The classic main-sequence estimate uses (M / L) x 10 Gyr.",
    interpretAs: "Shorter maximum ages mean faster evolution and earlier risk transitions.",
    caveat:
      "The app uses analytic lifecycle tracks. It does not run tabulated MESA/MIST stellar-structure grids.",
    references: "See Science & Maths: stellar lifecycle tracks.",
  }),
  Radius: structuredTip({
    overview: "Stellar radius in solar radii.",
    drawnFrom:
      "For M <= 0.5 Msol, a Schweitzer et al. M-dwarf relation; for 0.5-1.5 Msol, Eker et al. mass-radius fitting; for higher masses, Stefan-Boltzmann from luminosity and temperature.",
    feedsInto:
      "Effective temperature, density, visual star size, evolved lifecycle context, and environment diagnostics.",
    caveat:
      "Evolved mode applies analytic Hurley-style corrections; sub-percent stellar-structure precision would require tabulated grids.",
    references: "Schweitzer et al. 2019; Eker et al. 2018; see Science & Maths: stellar scaling.",
  }),
  Luminosity: structuredTip({
    overview: "Stellar luminosity in solar luminosities.",
    drawnFrom:
      "ZAMS mode uses the Eker et al. six-piece empirical relation. Evolved mode uses Hurley, Pols & Tout analytic stellar evolution with the Tout ZAMS baseline.",
    feedsInto:
      "Habitable-zone distance, planet/moon stellar flux, System Fate HZ migration, visual brightness, and apparent-sky calculations.",
    interpretAs:
      "KPI cards may auto-scale dim outputs: Lsol, mLsol = 10^-3 Lsol, μLsol = 10^-6 Lsol, nLsol = 10^-9 Lsol. Hover the KPI for exact Lsol and watt values.",
    caveat:
      "Analytic evolved luminosity carries about 10% mean error; sub-2% luminosity would require tabulated MESA/MIST isochrone grids.",
    references:
      "Eker et al. 2018; Hurley, Pols & Tout 2000; Tout et al. 1996; see Science & Maths: stellar luminosity.",
  }),
  "Radius Override":
    "Optionally override the mass-derived stellar radius in solar radii. Leave blank to use the Eker et al. (2018) scaling-law value derived from mass.\n\nUseful for modelling subgiants, evolved stars, or stars with a measured radius.\n\nSun = 1 Rsol = 695,700 km",
  "Luminosity Override":
    "Optionally override the mass-derived luminosity in solar luminosities. Leave blank to use the Eker et al. (2018) scaling-law value derived from mass.\n\nUseful for modelling post-main-sequence stars or stars with a measured luminosity.\n\nSun = 1 Lsol = 3.846E26 watts",
  "Temperature Override":
    "Optionally override the effective temperature in kelvin. Used with one other override to resolve the third via Stefan-Boltzmann (L = R\u00b2 \u00d7 (T/5776)\u2074).\n\nLeave blank to derive temperature from Radius and Luminosity (default).\n\nSun \u2248 5,776 K.",
  Density: "Mean stellar density in solar densities.\n\nSun = 1 Dsol = 1.41 g/cm\u00b3.",
  Temperature: structuredTip({
    overview: "Effective photospheric temperature in kelvin.",
    drawnFrom: "Luminosity and radius through the Stefan-Boltzmann relation.",
    feedsInto:
      "Spectral colour, habitable-zone coefficients, prebiotic UV estimate, activity binning, and visual star rendering.",
    caveat:
      "This is an effective temperature, not a detailed stellar atmosphere or spectrum model.",
    references: "See Science & Maths: Stefan-Boltzmann law and stellar scaling.",
  }),
  "Rotation Period":
    "Estimated stellar surface rotation period range in days.\n\nStars are treated as differentially rotating fluid bodies: the equator rotates faster than high latitudes. The gyrochronology period is interpreted as a representative active-latitude/spot-modulation period, not a solid-body spin.\n\nMost reliable for solar-like FGK main-sequence stars; lower confidence for young stars, hot stars, evolved stars, and M dwarfs. Brown dwarfs are not assigned gyrochronology periods in this model.",
  "Equatorial Rotation":
    "Estimated equatorial surface rotation speed, derived from the faster equatorial period and stellar radius.\n\nThis is an equatorial speed, not a projected v sin i observation.",
  "Differential Shear":
    "Latitude-dependent surface shear, reported as Omega_eq - Omega_pole in radians per day.\n\nSolar-like stars use a sin^2(latitude) differential-rotation law, with shear estimated from effective temperature and representative rotation period. Extrapolated regimes are labelled with lower confidence.",
  "Rossby Number":
    "Rotation period divided by convective turnover time.\n\nLower Rossby numbers usually indicate stronger magnetic activity and more efficient dynamo action. The convective turnover estimate is colour-based, so it becomes uncertain outside the calibrated stellar range.",
  "Rotation Activity Factor":
    "Multiplier applied to the flare-frequency baseline from the star's Rossby number.\n\nLow Rossby numbers mark fast, magnetically active rotation and increase the expected energetic flare rate; high Rossby numbers mark slower, quieter magnetic activity.",
  "Mass Loss":
    "Estimated steady stellar-wind mass-loss rate relative to the present-day Sun.\n\nThe scaling uses rotation, radius, and mass for hydrogen-burning stars. It is most useful as an order-of-magnitude environment diagnostic, not a precise measured mass-loss rate. Brown dwarfs and unsupported regimes are labelled rather than forced into the relation.",
  "Wind Pressure at 1 AU":
    "Estimated stellar-wind ram pressure at 1 AU, in nanopascals and relative to present-day Earth.\n\nPlanet pages dilute this host pressure by orbital distance and add any wide companion-star wind from the host-frame model. This is an environment diagnostic for wind exposure, not a full magnetopause or atmospheric erosion solve.",
  "Stellar Wind":
    "Combined stellar-wind diagnostic: mass-loss scaling, wind speed, and ram pressure at 1 AU.\n\nBrown dwarfs and unsupported host regimes are labelled rather than forced into the stellar wind scaling.",
  "Stellar Environment":
    "Cross-model host diagnostics that feed downstream planet and moon context: XUV flux, prebiotic 200-280 nm UV, stellar-wind mass loss, and wind pressure. These are reported with confidence/caveat wording and should be read as environment inputs rather than complete climate or atmospheric-loss predictions.",
  "Gyrochronology Confidence":
    "Confidence class for the rotation and gyrochronology estimate.\n\nHigh confidence is reserved for solar-like FGK main-sequence stars inside the calibrated colour, mass, and age range. M dwarfs, hot stars, evolved stars, and brown dwarfs are flagged as lower confidence or unsupported.",
  "Habitable Zone": structuredTip({
    overview: "The orbital region where a body receives roughly Earth-like stellar heating.",
    drawnFrom:
      "Current luminosity, effective temperature, and temperature-dependent inner/outer flux thresholds.",
    feedsInto:
      "Planet/moon climate context, visualizer HZ bands, System Fate HZ migration, and habitability triage.",
    interpretAs:
      "Hydrogen-burning stars use classical habitable-zone wording. Brown dwarfs expose a current temperate zone because their luminosity cools over time.",
    caveat:
      "HZ placement is a flux screen, not a climate guarantee. Atmosphere, rotation, water inventory, and geology still matter.",
    references: "See Science & Maths: habitable-zone model.",
  }),
  "Star Colour":
    "Stellar colour derived from effective temperature using Tanner Helland\u2019s empirical blackbody approximation (valid 1000\u201340,000 K, R\u00b2 > 0.987), producing a smooth, continuous colour gradient across spectral classes.",
  "Sun Visual":
    "Animated stellar preview using the current star colour and the active flare/CME rates.\n\nThe preview runs at 0.5 simulated days per second and renders textured photosphere detail plus flare/CME activity.",
  "Earth-like Life?":
    "Whether a planet comparable to modern-day Earth could orbit this host object.\n\nFor hydrogen-burning stars this follows the classic mass/age rule-of-thumb. Brown dwarfs default to no direct Earth-like-life verdict because they are cooling substellar objects; use the current temperate-zone and moon outputs instead.",
  "Stellar Evolution": structuredTip({
    overview: "Switches the star from static ZAMS scaling to analytic age-aware lifecycle tracks.",
    changes:
      "When enabled, luminosity and radius evolve with age and metallicity using Hurley, Pols & Tout style analytical stellar evolution. When off, properties are derived from mass using static ZAMS scaling laws.",
    feedsInto:
      "Lifecycle stage, habitable-zone migration, System Fate, activity context, and downstream planet/moon irradiation.",
    caveat:
      "This is not a full MESA-grade stellar structure simulation and does not model detailed interiors, pulsation, nucleosynthesis, fallback, explosion energy, or light curves.",
    references: "Hurley, Pols & Tout 2000; see Science & Maths: stellar lifecycle tracks.",
  }),
  "Physics Mode": structuredTip({
    overview: "Controls how radius, luminosity, and temperature are solved.",
    changes:
      "Simple derives physical properties from mass and age. Advanced lets you specify any two of radius, luminosity, and temperature; the third is computed via Stefan-Boltzmann.",
    feedsInto:
      "Displayed stellar KPIs, habitable zone, planet/moon irradiation, visual colour, and apparent-sky calculations.",
    caveat:
      "Manual combinations can represent measured or fictional stars, but downstream outputs still assume the app's analytic host model.",
    references: "See Science & Maths: Stefan-Boltzmann law and stellar scaling.",
  }),
  "Metallicity [Fe/H]": structuredTip({
    overview: "Stellar metallicity measures heavy-element abundance relative to the Sun.",
    feedsInto:
      "Giant planet probability, stellar population label, evolved lifecycle context, and downstream system-formation interpretation.",
    interpretAs:
      "[Fe/H] = log10(Fe/H)_star - log10(Fe/H)_sun. Sun = 0.0; positive is metal-rich; negative is metal-poor.",
    typicalRange:
      "Solar neighbourhood about -0.2 to +0.1 dex; metal-rich inner disk +0.1 to +0.5; halo/globular clusters can reach -2.5 to -1.0.",
    caveat:
      "Metallicity does not modify the Eker mass-luminosity or mass-radius relations directly; their empirical scatter already includes metallicity variation.",
    references: "See Science & Maths: stellar metallicity and giant planet occurrence.",
  }),
  "Giant Planet Probability": structuredTip({
    overview:
      "Estimated probability that the star hosts at least one giant planet of about 0.3 Mjup or larger.",
    drawnFrom:
      "Metallicity scaling P proportional to 10^(2*[Fe/H]), stellar-mass scaling, and a solar-mass baseline occurrence rate.",
    feedsInto:
      "System-formation context, guided creation expectations, and gas-giant plausibility checks.",
    interpretAs:
      "M dwarfs host fewer giant planets; A/F stars host more. A +0.3 dex increase in [Fe/H] roughly quadruples the probability.",
    caveat: "This is an occurrence prior, not a generator guarantee.",
    references:
      "Fischer & Valenti 2005; Johnson et al. 2010; Petigura et al. 2018; see Science & Maths.",
  }),
  "Stellar Population":
    "A broad classification based on metallicity.\n\nPopulation I (solar neighbourhood): [Fe/H] > \u22120.3 \u2014 young-to-middle-aged disk stars like the Sun\nIntermediate (old thin disk): \u22121.0 < [Fe/H] \u2264 \u22120.3\nPopulation II (metal-poor): [Fe/H] \u2264 \u22121.0 \u2014 old halo and thick-disk stars\nMetal-rich (inner disk): [Fe/H] > +0.15 \u2014 stars formed in the metal-enriched inner galaxy",
  "Activity Regime": structuredTip({
    overview: "Broad magnetic-activity regime used for flare and CME estimates.",
    drawnFrom:
      "Effective temperature and age bins: FGK >= 3900 K, early M 3200-3900 K, late M < 3200 K, with age bands by class.",
    feedsInto:
      "Energetic flare rate, total flare rate, CME estimates, visual star activity, and planet/moon radiation context.",
    caveat:
      "Activity bins are population-level approximations. Individual stars can be quieter or more active.",
    references: "See Science & Maths: stellar activity and flare-frequency distributions.",
  }),
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
  "XUV Regime": structuredTip({
    overview: "Extreme-UV and soft X-ray activity regime for the host object.",
    drawnFrom:
      "The host XUV model, current age, stellar class, and saturated/unsaturated activity track for hydrogen-burning stars.",
    feedsInto:
      "Atmospheric escape, surface-radiation context, photochemistry, and moon/planet environment summaries.",
    caveat:
      "Brown dwarfs currently report negligible XUV in this model; flare-driven episodic UV is not fully solved.",
    references: "See Science & Maths: XUV evolution and atmospheric escape context.",
  }),
  "XUV Luminosity":
    "High-energy host-object luminosity in the XUV band.\n\nHydrogen-burning stars report stellar coronal output. Brown dwarfs currently report negligible XUV in this model.",
  "XUV Flux at 1 AU":
    "XUV flux a body would receive at 1 AU from this host object.\n\nReported both as erg/cm^2/s and relative to present-day Earth, then diluted by inverse-square distance for planets and moons.",
  "Prebiotic UV at 1 AU": structuredTip({
    overview: "Photospheric 200-280 nm UV flux at 1 AU.",
    drawnFrom:
      "The host effective temperature and luminosity, reported in physical units and relative to an Earth/Sun blackbody reference.",
    feedsInto: "Prebiotic-chemistry window checks and organic-haze diagnostics on planet pages.",
    caveat:
      "This does not imply life. Cool active stars may receive extra episodic UV from flares that this blackbody estimate does not explicitly solve.",
    references: "See Science & Maths: prebiotic UV and stellar spectra.",
  }),
  "XUV Saturation Age":
    "Approximate duration of the host object's saturated high-XUV phase.\n\nLower-mass cool stars keep elevated XUV output for much longer than Sun-like stars. Brown dwarfs currently report no stellar-style saturation interval in this model.",
  "Home System Architecture": structuredTip({
    overview:
      "Defines whether the home system uses one star or a constrained hierarchical multi-star tree.",
    changes:
      "Single keeps the classic workflow. Binary adds one bound pair. Triple and Quad use nested stable templates.",
    feedsInto:
      "Available host frames, orbit-host choices, stability checks, visualizer hierarchy, and System Fate host-frame readings.",
    caveat:
      "The app supports readable hierarchical templates, not arbitrary non-hierarchical stellar graphs.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  Topology: structuredTip({
    overview: "Chooses the shape of the home-system stellar hierarchy.",
    changes:
      "Single uses one host star. Binary uses (A+B). Triple uses ((A+B)+C). Quad supports either (((A+B)+C)+D) or (A+B)+(C+D).",
    feedsInto:
      "Host-frame menus, topology maps, visualizer hierarchy, planet orbit hosts, and System Fate frame choices.",
    caveat:
      "Templates intentionally reject arbitrary non-hierarchical graphs so the engine and canvases only solve stable tree-shaped systems.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  "Quad Layout":
    "Choose how the four-star hierarchy is arranged.\n\nChain uses (((A+B)+C)+D), adding one outer companion at a time. Paired uses (A+B)+(C+D), where two inner binaries orbit a shared outer barycentre.",
  "Hierarchy Health":
    "Live guardrail summary for constrained triple and quad layouts.\n\nGood means the outer layer is comfortably wide. Caution means the hierarchy is fairly tight. Unstable means the nesting is technically possible but likely problematic. Blocked means the outer layer is inverted and will not be saved.",
  "Default Orbit Host": structuredTip({
    overview: "Choose which host frame new planets and gas giants use by default.",
    changes:
      "Star frames create circumstellar S-type bodies around one star. Pair frames create barycentric P-type bodies around a shared pair.",
    feedsInto:
      "New body placement, host-frame climate context, visualizer orbits, and System Fate grouping.",
    caveat: "Existing bodies keep their current host frame until you reassign them on later pages.",
    references: "See Science & Maths: S-type and P-type host frames.",
  }),
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

Object.assign(TIP_LABEL, {
  Name: structuredTip({
    overview: "Display name for this stellar component.",
    feedsInto: "Exports, visualizer labels, System Fate summaries, and linked page context.",
    caveat: "Changing the name does not change any physical stellar properties.",
  }),
  Class: structuredTip({
    overview: "Spectral/luminosity class label for supported stars and brown dwarfs.",
    drawnFrom: "Parsed class input or solved mass/temperature/luminosity context.",
    interpretAs:
      "OBAFGKM are hydrogen-burning star classes; L/T/Y are substellar brown-dwarf classes.",
    caveat:
      "Unsupported luminosity classes such as giants, subgiants, white dwarfs, Wolf-Rayet stars, and detailed remnants are not solved as full class tracks.",
    references: "See Science & Maths: stellar classification.",
  }),
  "Radius Override": structuredTip({
    overview: "Optional manual stellar radius in solar radii.",
    feedsInto:
      "Temperature/luminosity solve, habitable zone, visual star size, density, and downstream irradiation.",
    changes:
      "Leave blank to use mass-derived scaling; provide radius with one other advanced property to solve the third.",
    caveat:
      "Manual overrides can represent measured or fictional stars but still use the app's analytic host model.",
    references: "See Science & Maths: Stefan-Boltzmann law and stellar scaling.",
  }),
  "Luminosity Override": structuredTip({
    overview: "Optional manual stellar luminosity in solar luminosities.",
    feedsInto:
      "Temperature/radius solve, habitable zone, frost line, System Fate, and planet/moon irradiation.",
    changes:
      "Leave blank to use mass-derived or evolved luminosity; provide luminosity with one other advanced property to solve the third.",
    caveat:
      "Manual luminosity changes downstream flux immediately and can create deliberately non-standard stars.",
    references: "See Science & Maths: stellar luminosity and Stefan-Boltzmann law.",
  }),
  "Temperature Override": structuredTip({
    overview: "Optional manual effective temperature in kelvin.",
    feedsInto:
      "Spectral colour, radius/luminosity solve, habitable-zone coefficients, UV estimates, and visual rendering.",
    changes:
      "Leave blank to derive temperature from radius and luminosity; provide it with one other advanced property to solve the third.",
    caveat:
      "This is effective photospheric temperature, not a detailed atmosphere or spectrum model.",
    references: "See Science & Maths: Stefan-Boltzmann law.",
  }),
  Density: structuredTip({
    overview: "Mean stellar density in solar-density units.",
    drawnFrom: "Solved mass and radius.",
    interpretAs: "Useful as a compact sanity check for stellar scale and evolutionary state.",
    caveat: "It is a bulk average, not an interior density profile.",
    references: "See Science & Maths: stellar scaling.",
  }),
  "Rotation Period": structuredTip({
    overview: "Estimated representative stellar surface rotation period.",
    drawnFrom: "Gyrochronology/activity context when supported by mass, age, and colour regime.",
    feedsInto:
      "Rossby number, magnetic activity, flare/CME context, wind estimates, and visual activity.",
    caveat:
      "Stars rotate differentially; this is a representative spot-modulation period, not a solid-body spin. Brown dwarfs are not assigned gyrochronology periods.",
    references: "See Science & Maths: stellar rotation and activity.",
  }),
  "Equatorial Rotation": structuredTip({
    overview: "Estimated equatorial surface rotation speed.",
    drawnFrom: "Faster equatorial period and stellar radius.",
    interpretAs: "This is equatorial speed, not a projected v sin i observation.",
    caveat: "Differential rotation and inclination are not fully observed here.",
    references: "See Science & Maths: stellar rotation.",
  }),
  "Differential Shear": structuredTip({
    overview: "Latitude-dependent surface rotation shear.",
    drawnFrom: "Effective temperature and representative rotation period using a solar-like law.",
    interpretAs: "Higher shear means a larger equator-to-pole angular-speed difference.",
    caveat: "Extrapolated regimes are labelled with lower confidence.",
    references: "See Science & Maths: stellar rotation.",
  }),
  "Rossby Number": structuredTip({
    overview: "Rotation period divided by convective turnover time.",
    drawnFrom: "Representative rotation period and colour/temperature-based turnover estimate.",
    feedsInto: "Magnetic activity, flare-frequency scaling, and rotation activity factor.",
    caveat: "Turnover estimates become uncertain outside calibrated stellar ranges.",
    references: "See Science & Maths: stellar activity.",
  }),
  "Rotation Activity Factor": structuredTip({
    overview: "Activity multiplier derived from rotation context.",
    drawnFrom: "Rossby number and the activity scaling used by the flare/CME model.",
    feedsInto: "Flare frequency, CME estimates, and visual activity runtime.",
    caveat: "It is population-level activity scaling, not a measured flare forecast.",
    references: "See Science & Maths: stellar activity.",
  }),
  "Mass Loss": structuredTip({
    overview: "Estimated steady stellar-wind mass-loss rate relative to the Sun.",
    drawnFrom: "Rotation, radius, and mass for supported hydrogen-burning stars.",
    feedsInto: "Wind pressure context and downstream planet/moon environment summaries.",
    caveat:
      "This is an order-of-magnitude diagnostic. Brown dwarfs and unsupported regimes are labelled rather than forced into the relation.",
    references: "See Science & Maths: stellar wind.",
  }),
  "Wind Pressure at 1 AU": structuredTip({
    overview: "Estimated stellar-wind ram pressure at 1 AU.",
    drawnFrom: "Mass-loss estimate, wind speed assumption, and host-frame wind context.",
    feedsInto: "Planet/moon radiation and magnetosphere environment summaries.",
    caveat: "It is not a full magnetopause or atmospheric-erosion solve.",
    references: "See Science & Maths: stellar wind and atmospheric escape context.",
  }),
  "Stellar Wind": structuredTip({
    overview: "Combined wind diagnostic for the host object.",
    drawnFrom: "Mass-loss scaling, wind speed, and ram pressure at 1 AU.",
    feedsInto: "Downstream planet/moon wind exposure and environment context.",
    caveat: "Unsupported host regimes are labelled rather than forced into the scaling.",
    references: "See Science & Maths: stellar wind.",
  }),
  "Stellar Environment": structuredTip({
    overview: "Cross-model host radiation and wind diagnostics.",
    drawnFrom:
      "Solved XUV flux, prebiotic UV, flare/CME activity, wind pressure, and lifecycle context.",
    feedsInto: "Planet and moon radiation, photochemistry, atmosphere, and habitability context.",
    caveat:
      "These are environment inputs and diagnostics, not full climate or atmospheric-loss predictions.",
    references: "See Science & Maths: stellar environment.",
  }),
  "Gyrochronology Confidence": structuredTip({
    overview: "Confidence class for rotation and gyrochronology estimates.",
    drawnFrom: "Stellar class, mass, colour/temperature, age, and evolutionary state.",
    interpretAs:
      "Highest confidence is reserved for solar-like FGK main-sequence stars inside calibration ranges.",
    caveat:
      "M dwarfs, hot stars, evolved stars, and brown dwarfs are lower confidence or unsupported.",
    references: "See Science & Maths: stellar rotation and activity.",
  }),
  "Star Colour": structuredTip({
    overview: "Rendered stellar colour derived from effective temperature.",
    drawnFrom: "Effective temperature using a blackbody-style colour approximation.",
    feedsInto: "Star preview and visualizer star appearance.",
    caveat: "It is a display colour, not a detailed spectrum or filter response.",
    references: "See Science & Maths: stellar colour and temperature.",
  }),
  "Sun Visual": structuredTip({
    overview: "Animated stellar preview for the current host object.",
    drawnFrom: "Solved star colour, flare/CME rates, and visual activity runtime.",
    interpretAs: "Use it as a qualitative activity and colour preview.",
    caveat: "It is not a radiative-transfer, surface-convection, or light-curve simulation.",
  }),
  "Earth-like Life?": structuredTip({
    overview: "Broad host suitability verdict for Earth-like life.",
    drawnFrom: "Host class, mass, age, lifecycle state, and supported habitability heuristics.",
    interpretAs:
      "It is a triage label for classic Earth-like conditions around hydrogen-burning stars.",
    caveat:
      "It is not a life detector; brown dwarfs defer to current temperate-zone and body outputs.",
    references: "See Science & Maths: stellar habitability context.",
  }),
  "Stellar Population": structuredTip({
    overview: "Broad Galactic population label based on metallicity.",
    drawnFrom: "Current [Fe/H] value.",
    interpretAs:
      "Population I is metal-richer disk context; Population II is older metal-poor halo/thick-disk context.",
    caveat: "This is a simple metallicity bin, not a full kinematic/orbital population assignment.",
    references: "See Science & Maths: stellar metallicity.",
  }),
  "Energetic Flare Rate (>1e32 erg)": structuredTip({
    overview: "Expected rate of energetic flares above 10^32 erg.",
    drawnFrom: "Activity regime, age bin, class bin, and rotation/activity factor where available.",
    feedsInto: "Total flare rate, CME estimates, visual star activity, and radiation context.",
    caveat: "Population-level flare rates do not predict individual flare timing.",
    references: "See Science & Maths: stellar flares.",
  }),
  "Energetic Flare Recurrence": structuredTip({
    overview: "Average interval between energetic flares.",
    drawnFrom: "The inverse of the >10^32 erg flare rate.",
    interpretAs: "Short recurrence means a more active high-energy environment.",
    caveat: "Real flare timing is stochastic and clustered, not evenly spaced.",
    references: "See Science & Maths: stellar flares.",
  }),
  "Total Flare Rate (>1e30 erg)": structuredTip({
    overview: "Expected broader flare rate above 10^30 erg.",
    drawnFrom: "Flare-frequency distribution anchored to the energetic flare rate.",
    feedsInto: "Associated CME rate and visual activity context.",
    caveat: "This is an integrated rate above a threshold, not a light-curve model.",
    references: "See Science & Maths: stellar flares.",
  }),
  "Associated CME Rate": structuredTip({
    overview: "Expected CME events linked to flare activity.",
    drawnFrom: "Energy-weighted flare-CME association probability and activity suppression logic.",
    feedsInto: "Total CME rate and stellar environment context.",
    caveat: "CME mass, speed, direction, and impact probability are not individually simulated.",
    references: "See Science & Maths: stellar CMEs.",
  }),
  "Background CME Rate": structuredTip({
    overview: "Expected CME activity not explicitly tied to rendered flares.",
    drawnFrom: "Solar-cycle envelope for FGK hosts and modelled activity gaps.",
    feedsInto: "Total CME rate and visual activity context.",
    caveat: "Only broad rates are modelled, not individual ejections.",
    references: "See Science & Maths: stellar CMEs.",
  }),
  "Total CME Rate": structuredTip({
    overview: "Combined expected CME rate per day.",
    drawnFrom: "Associated CME rate plus background CME channel where supported.",
    feedsInto: "Stellar environment summaries and visual activity.",
    caveat: "Directionality, plasma propagation, and impact on a specific planet are not solved.",
    references: "Yashiro et al. 2006; see Science & Maths: stellar CMEs.",
  }),
  "XUV Luminosity": structuredTip({
    overview: "Host luminosity in extreme-UV and soft X-ray bands.",
    drawnFrom: "The host XUV evolution model and current activity/lifecycle state.",
    feedsInto: "Atmospheric escape, radiation environment, and planet/moon context.",
    caveat: "Brown dwarfs currently report negligible XUV in this model.",
    references: "See Science & Maths: XUV evolution.",
  }),
  "XUV Flux at 1 AU": structuredTip({
    overview: "High-energy flux a body would receive at 1 AU from the host.",
    drawnFrom: "XUV luminosity diluted to 1 AU.",
    feedsInto: "Planet/moon scaled XUV exposure and atmospheric escape context.",
    caveat: "Actual body exposure is diluted by its own orbital distance and host-frame context.",
    references: "See Science & Maths: XUV flux and atmospheric escape.",
  }),
  "XUV Saturation Age": structuredTip({
    overview: "Approximate duration of the host's saturated high-XUV phase.",
    drawnFrom: "Stellar mass/class and the app's XUV evolution track.",
    feedsInto: "Radiation history and early atmosphere-retention context.",
    caveat: "Brown dwarfs currently do not receive a stellar-style saturation interval.",
    references: "See Science & Maths: XUV evolution.",
  }),
  "Quad Layout": structuredTip({
    overview: "Arrangement of the four-star hierarchy.",
    changes:
      "Chain adds one outer companion at a time; Paired uses two inner binaries orbiting a shared outer barycentre.",
    feedsInto: "Host-frame options, hierarchy health, visualizer topology, and orbit-host choices.",
    caveat: "Only constrained hierarchical quad templates are supported.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  "Hierarchy Health": structuredTip({
    overview: "Live guardrail summary for triple and quad hierarchy spacing.",
    drawnFrom: "Inner and outer pair separations, mass hierarchy, and nesting ratios.",
    interpretAs:
      "Good is comfortably wide; caution is tight; unstable is risky; blocked will not be saved.",
    caveat: "It is a heuristic hierarchy guardrail, not a long-term N-body integration.",
    references: "See Science & Maths: multi-star stability.",
  }),
  "Companion Star": structuredTip({
    overview: "Secondary stellar component in a binary system.",
    feedsInto:
      "Binary topology, host-frame choices, visualizer hierarchy, and companion flux context.",
    caveat: "Component details are analytic host-frame inputs, not a full binary-evolution solve.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  "Tertiary Star": structuredTip({
    overview: "Third stellar component in a constrained triple or quad hierarchy.",
    feedsInto:
      "Outer hierarchy, selectable host frames, stability guardrails, and visualizer context.",
    caveat: "Only hierarchical configurations are supported.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  "Quaternary Star": structuredTip({
    overview: "Fourth stellar component in a constrained quad hierarchy.",
    feedsInto: "Chain or paired hierarchy, host-frame choices, and visualizer topology.",
    caveat: "The app does not support arbitrary four-star graphs.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  "Binary Pair": structuredTip({
    overview: "Orbit binding two stars around a shared barycentre.",
    feedsInto: "Pair host frames, hierarchy health, visualizer placement, and companion context.",
    caveat:
      "Stored orbital elements are used for host-frame/visual context, not full binary evolution.",
    references: "See Science & Maths: binary host frames.",
  }),
  "Hierarchy Pair": structuredTip({
    overview: "Outer orbit binding a new stellar layer to the existing inner hierarchy.",
    feedsInto: "Hierarchy health, host-frame availability, and companion branch context.",
    caveat: "Wider values reduce perturbation concerns but still remain heuristic.",
    references: "See Science & Maths: multi-star stability.",
  }),
  "Binary Semi-Major Axis": structuredTip({
    overview: "Average separation of a stellar pair in AU.",
    feedsInto: "Pair period, hierarchy health, host-frame context, and visualizer placement.",
    caveat: "It is an authoring element for the hierarchy model, not a full orbit integration.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  "Binary Eccentricity": structuredTip({
    overview: "How stretched the stellar-pair orbit is.",
    feedsInto:
      "Periapsis/apoapsis separation, hierarchy health, visualizer orbit shape, and stability concern.",
    caveat:
      "High eccentricity can make close-approach risks stronger than average separation suggests.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  "Binary Inclination": structuredTip({
    overview: "Tilt of the binary orbit plane in degrees.",
    feedsInto:
      "Visualizer orientation, hierarchy context, and future inclination-aware diagnostics.",
    caveat:
      "Current world climate outputs still use host-frame summaries rather than full inclined N-body forcing.",
    references: "See Science & Maths: orbital inclination.",
  }),
  "Binary Argument of Periapsis": structuredTip({
    overview: "Orientation of closest approach within the binary orbital plane.",
    feedsInto: "Visualizer orbit placement and phase-aware binary context.",
    caveat: "This affects orientation, not the pair's average separation or masses.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  "Binary Mean Anomaly": structuredTip({
    overview: "Current orbital phase position of the binary pair.",
    feedsInto: "Visualizer placement and phase-aware snapshots.",
    caveat: "It is a saved phase marker, not a dynamically integrated ephemeris.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
});
