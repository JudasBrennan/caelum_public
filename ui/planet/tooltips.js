import { GAS_GIANT_RADIUS_MAX_RJ, GAS_GIANT_RADIUS_MIN_RJ } from "../store/gasGiantModel.js";
import { structuredTip } from "../tooltipCopy.js";

export const TIP_LABEL = {
  // ── Star context ──
  "Star (read-only)":
    "Read-only host-frame context for the currently selected body. In binary systems this changes when you move a world between stars, because the slot ladder, habitable zone, companion heating, and stability limits all change with the chosen host frame.",

  // ── Body selector ──
  "Body selection":
    "Choose which body you are editing. Bodies are grouped by host frame, sorted by orbital distance, and labelled by the current physical classification.",

  "Body Class":
    "Classification based on mass. Bodies below 0.1 M\u2295 (~Mars mass) are labelled as dwarf planets. The physics model is identical \u2014 this is purely a label.\n\nReal examples: Ceres (0.00016 M\u2295), Pluto (0.0022 M\u2295), Eris (0.0028 M\u2295).",

  // ── Rocky planet inputs ──
  "Host frame": structuredTip({
    overview: "Choose which stellar host frame this body orbits.",
    changes:
      "Changing host frame changes the slot ladder, habitable-zone placement, companion heating, orbit-stability limits, visualizer grouping, and System Fate context.",
    feedsInto:
      "Planet climate inputs, moon environment inheritance, orbit validity, visualizer placement, and fate rankings.",
    caveat:
      "Host-frame checks are analytic stability/context screens, not a full N-body integration.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  "Orbital slot":
    "Assign this body to an available system slot. One body per slot within the selected host frame.",
  Name: "Set the body's display name used across tabs and exports.",
  Physical: "Core physical inputs that control the planet's bulk properties.",
  Mass: structuredTip({
    overview: "Planet mass in Earth masses.",
    feedsInto:
      "Radius, density, gravity, escape velocity, atmospheric retention, tectonic context, habitability scores, and subtype classification.",
    typicalRange:
      "Terrestrial planets: 0.1-10 MEarth. Habitable Earth-like planets are usually treated as 0.1-3.5 MEarth.",
    caveat:
      "Mass alone does not determine habitability; composition, atmosphere, orbit, and host context also matter.",
    references: "See Science & Maths: rocky planet mass-radius and habitability scoring.",
  }),
  CMF: structuredTip({
    overview: "Core Mass Fraction is the percentage of planetary mass in the iron core.",
    feedsInto:
      "Radius, density, magnetic-field context, internal structure, tectonics, and rocky subtype labels.",
    drawnFrom: "Either the manual input or the auto suggestion derived from host-star metallicity.",
    interpretAs: "Mercury is about 70%; Venus about 32%; Earth about 32.5%; Mars about 22%.",
    caveat:
      "Giant impacts or formation location can shift CMF away from host-metallicity expectations.",
    references: "Schulze et al. 2021; see Science & Maths: rocky composition.",
  }),
  WMF: structuredTip({
    overview: "Water Mass Fraction is the percentage of planetary mass stored as water or ice.",
    feedsInto:
      "Radius inflation, density, water regime, inferred ocean coverage, high-pressure ice risk, visual oceans, and habitability scoring.",
    interpretAs:
      "Dry <0.01%; shallow oceans 0.01-0.1%; extensive oceans 0.1-1%; global ocean 1-10%; deep ocean 10-30%; ice world >30%.",
    caveat:
      "Surface-ocean coverage is inferred separately by comparing inventory with planet size, gravity-scaled relief, basin capacity, and climate state.",
    references: "Zeng & Sasselov 2016; see Science & Maths: water inventory and ocean coverage.",
  }),
  "H/He Envelope": structuredTip({
    overview: "Hydrogen/helium envelope mass fraction.",
    feedsInto:
      "Volatile-envelope radius, bulk density, mini-Neptune/ice-giant classification, and atmospheric escape context.",
    interpretAs:
      "Values above about 0.1% can move low-mass bodies away from rocky-world treatment.",
    caveat:
      "Envelope outputs are analytic approximations and should not be read as a detailed interior-atmosphere evolution model.",
    references: "See Science & Maths: volatile envelopes and atmospheric retention.",
  }),
  "Observed Radius":
    "Optional measured transit/photosphere radius in Earth radii. When blank, the volatile solver uses its modelled radius; when filled, detection and bulk-density outputs use the observed radius while still reporting the modelled radius separately.",
  "Axial Tilt": structuredTip({
    overview: "Obliquity of the planet's rotational axis relative to the orbital plane.",
    feedsInto:
      "Season strength, climate-zone distribution, visual spin helpers, and some habitability context.",
    interpretAs:
      "0-90 degrees is prograde; 90-180 is retrograde. Higher tilt produces more extreme seasons; 0 or 180 degrees gives little seasonal tilt.",
    typicalRange:
      "Earth is about 23.5 degrees; broad habitability guidance treats 0-45 degrees as easier.",
    caveat: "Long-term obliquity stability is not integrated here.",
    references: "See Science & Maths: seasons and obliquity.",
  }),
  "Albedo (Bond)": structuredTip({
    overview: "Fraction of incident stellar energy reflected by the planet.",
    feedsInto:
      "Equilibrium temperature, surface temperature, climate state, visual ice/cloud context, and System Fate exposure interpretation.",
    interpretAs: "0 absorbs everything; 1 reflects everything. Earth is about 0.306.",
    typicalRange: "Mercury 0.068; Venus 0.77; Moon 0.11; Mars 0.25.",
    caveat: "This is a global Bond albedo, not a surface map.",
    references: "See Science & Maths: climate energy balance.",
  }),
  "Greenhouse Effect":
    "Manual dimensionless greenhouse multiplier (Manual mode only). 0 = no atmosphere. ~1.2 = Earth-equivalent. ~217 = Venus-equivalent.\n\nIn Core and Full modes this is computed from atmospheric gases automatically.",
  "Greenhouse Mode":
    "Core — greenhouse computed from CO₂, H₂O, and CH₄ with pressure broadening.\n\nFull — adds H₂, SO₂, and NH₃ (expert gases) to the greenhouse model.\n\nManual — set the greenhouse effect directly via the slider.",
  "Water Vapor (H\u2082O)":
    "Average column water-vapor fraction. Earth averages ~0.4%. Treated as a user input rather than a feedback gas to avoid circular temperature dependence.\n\nH₂O is the strongest greenhouse gas by total contribution on Earth (~50% of the greenhouse effect).",
  "Methane (CH\u2084)":
    "Atmospheric methane fraction. Earth ≈ 0.00018% (1.8 ppm). Titan ≈ 5%.\n\nCH₄ absorbs in the 7.7 µm IR band with square-root forcing (IPCC TAR).",
  "Hydrogen (H\u2082)":
    "Atmospheric hydrogen fraction (Full mode). Greenhouse effect via collision-induced absorption with N₂ (Wordsworth & Pierrehumbert 2013). Important for reducing/primordial atmospheres and early-Earth scenarios.",
  "Helium (He)":
    "Atmospheric helium fraction (Full mode). No greenhouse effect — helium is IR-transparent. Affects mean molecular weight and scale height only.",
  "Sulfur Dioxide (SO\u2082)":
    "Atmospheric SO₂ fraction (Full mode). Strong 7.3 µm and 8.7 µm IR absorber. Relevant for volcanic worlds. Venus has ~150 ppm.",
  "Ammonia (NH\u2083)":
    "Atmospheric ammonia fraction (Full mode). Potent greenhouse gas absorbing at 10.5 µm (atmospheric window). Rapidly photodissociated by UV, so sustained levels require an active source.",
  "Height of Observer":
    "Observer elevation above sea level in metres, used to compute horizon distance.",
  "Orbit & Rotation":
    "Orbital and rotational inputs used for year length, seasons, and climate-related outputs.",
  "Rotation Period":
    "Current sidereal rotation period (day length) in Earth hours.\n\nHabitable range: ~6\u201348 hours.\n\nEarth = 23.93 hours.",
  "Semi-Major axis":
    "Orbital distance from the host star in AU. Habitable planets should lie within the habitable zone.\n\nEarth = 1 AU = ~150,000,000 km",
  Eccentricity:
    "Orbital eccentricity (0\u20131). 0 = circular, 1 = parabolic.\n\nLow eccentricities keep the planet within the habitable zone year-round.\n\nEarth = 0.0167",
  Inclination:
    "Orbital inclination relative to the primary habitable world\u2019s orbital plane.\n\nPrimary habitable world = 0\u00b0. Other worlds: 0\u2013180\u00b0 (lower values indicate a flatter system).",
  "Longitude of Periapsis":
    "Geocentric longitude of periapsis in degrees (0\u2013360\u00b0).\n\nEarth \u2248 283\u00b0.",
  "Subsolar Longitude":
    "Longitude of the subsolar point at the vernal equinox in degrees (0\u2013360\u00b0). Controls the phase offset of the seasonal cycle.",
  Atmosphere:
    "Atmospheric composition and pressure inputs for derived climate and density outputs.\n\nN₂ is derived: 100% minus all other gases. If the sum exceeds 100%, N₂ is clamped to 0%.",
  "Atmospheric Pressure": structuredTip({
    overview: "Sea-level atmospheric pressure in standard atmospheres.",
    feedsInto:
      "Greenhouse pressure broadening, heat redistribution, UV shielding, atmospheric escape, climate zones, and collapse checks.",
    interpretAs: "Earth is 1 atm.",
    caveat:
      "This is a bulk surface pressure; the app does not solve vertical atmospheric structure in detail.",
    references: "See Science & Maths: atmosphere and climate coupling.",
  }),
  "Oxygen (O2)":
    "Oxygen partial pressure. Habitable range: 0.16\u20130.5 atm.\n\nEarth \u2248 0.21 atm.",
  "Carbon Dioxide (CO2)":
    "Carbon dioxide partial pressure. Habitable limit: < 0.02 atm (optimal < 0.005 atm).\n\nEarth \u2248 0.0004 atm (420 ppm).",
  "Argon (Ar)": "Argon partial pressure. Habitable limit: < 1.6 atm.\n\nEarth \u2248 0.0094 atm.",
  "Atmospheric Escape": structuredTip({
    overview:
      "Atmospheric escape analysis combining Jeans thermal escape with bounded non-thermal loss context.",
    feedsInto:
      "Retained gas fractions, greenhouse calculation, partial pressures, density, habitability context, and atmosphere-evolution outputs.",
    drawnFrom:
      "Escape velocity, exobase temperature, host XUV context, pressure, and gas molecular masses.",
    interpretAs:
      "H2 retained at lambda >= 18, marginal 9-18, lost <9. He retained >=30, marginal 15-30, lost <15. Heavier gases use retained >=6, marginal 3-6, lost <3.",
    caveat:
      "When enabled, gases classified as Lost are zeroed for downstream atmosphere calculations, but original input composition is preserved.",
    references: "Jeans 1925; see Science & Maths: atmospheric escape.",
  }),
  "Vegetation override":
    "Override the auto-calculated vegetation colours with manually chosen pale and deep hex values. In Auto mode, colours are derived from the star's spectrum, atmospheric pressure, insolation, and tidal lock status.",
  "Internal Heat": structuredTip({
    overview: "Radioisotope abundance relative to Earth.",
    feedsInto:
      "Volcanic activity, elastic lithosphere thickness, internal heat budget, core solidification timescale, tectonics, and magnetic-field context.",
    interpretAs:
      "Higher abundance sustains volcanism longer, thins the lithosphere, and extends dynamo lifetime. Default is 1.0x Earth.",
    caveat: "This is a bulk heat-production multiplier, not a full mantle convection simulation.",
    references: "See Science & Maths: radiogenic heat and solid-body evolution.",
  }),
  "Radioisotope Abundance":
    "Bulk radioisotope abundance as a single multiplier of Earth\u2019s present-day radiogenic heat production (44 TW).\n\nRange: 0.1\u20133.0\u00d7 Earth.",
  "U-238":
    "Uranium-238 abundance relative to Earth. Contributes 39% of Earth\u2019s radiogenic heat.\n\nt\u00bd = 4.47 Gyr. Range: 0.0\u20135.0\u00d7.",
  "U-235":
    "Uranium-235 abundance relative to Earth. Contributes 4% of Earth\u2019s radiogenic heat.\n\nt\u00bd = 0.70 Gyr. Range: 0.0\u20135.0\u00d7.",
  "Th-232":
    "Thorium-232 abundance relative to Earth. Contributes 40% of Earth\u2019s radiogenic heat.\n\nt\u00bd = 14.05 Gyr. Range: 0.0\u20135.0\u00d7.",
  "K-40":
    "Potassium-40 abundance relative to Earth. Contributes 17% of Earth\u2019s radiogenic heat.\n\nt\u00bd = 1.25 Gyr. Range: 0.0\u20135.0\u00d7.",
  Moons: "Major moons currently assigned to this body.",

  // ── Rocky planet outputs ──
  Appearance:
    "Physics-driven visual of the planet from space. Surface colour, oceans, ice caps, clouds, and terrain are derived from composition, water regime, temperature, pressure, and tectonics.\n\nThis preview is now read-only. Use Create This Rocky World in the Inputs column for Quick, Guided, or Recipes.",
  Rings:
    "Controls whether rocky-planet rings follow the current Roche-limit science or are manually forced on or off. Auto only enables rings when an assigned moon's current periapsis crosses the rocky Roche limit. Forced settings can go against the science and are labelled explicitly.",
  Composition:
    "Interior composition class derived from Core Mass Fraction (CMF) and Water Mass Fraction (WMF).\n\nIron world: CMF > 60% (Mercury-like interior)\nMercury-like: CMF 45\u201360%\nEarth-like: CMF 25\u201345%\nMars-like: CMF 10\u201325%\nCoreless: CMF < 10%\nOcean world: WMF 0.1\u201310%\nIce world: WMF > 10%",
  "Core Radius":
    "Core radius as a fraction of the total planetary radius. Estimated via CRF \u2248 CMF^0.5 (Zeng & Jacobsen 2017).\n\nEarth: CRF \u2248 0.55 (core radius ~3,485 km).",
  "Water Regime": structuredTip({
    overview: "Surface water inventory category derived from Water Mass Fraction.",
    drawnFrom:
      "WMF, planet size, gravity context, and the water-inventory thresholds used by the rocky-world solver.",
    feedsInto:
      "Inferred ocean coverage, climate/aridity context, visual ocean coverage, high-pressure ice caution, and habitability scoring.",
    interpretAs:
      "Dry <0.01% WMF; shallow oceans 0.01-0.1%; extensive oceans 0.1-1%; global ocean 1-10%; deep ocean 10-30%; ice world >30%.",
    caveat:
      "This is an inventory label. Inferred Ocean Coverage separately estimates how much of the surface is actually flooded.",
    references: "See Science & Maths: water inventory and ocean coverage.",
  }),
  "Inferred Ocean Coverage": structuredTip({
    overview: "Estimated fraction of the surface covered by liquid ocean.",
    drawnFrom:
      "Water inventory, planet radius/mass, gravity-scaled relief, Earth-hypsometry basin capacity, and current climate state.",
    feedsInto:
      "Exposed land, climate aridity, carbon-cycle context, visuals, and habitability scoring.",
    caveat:
      "This is science context, not a manual art override or a detailed bathymetry simulation.",
    references: "See Science & Maths: inferred ocean coverage.",
  }),
  "Exposed Land":
    "Estimated unflooded surface fraction remaining after the inferred basin fill and climate transfer. Carbon-cycle, productivity, climate, and visual auto coverage use this context when no manual override is set.",
  "Coverage Confidence":
    "Confidence in the inferred ocean/land split. High confidence means mass, radius, water inventory, climate, pressure, and relief context are all available; lower confidence means the model is leaning harder on fallback assumptions.",
  "Mean Ocean Depth":
    "Estimated average depth of the liquid surface ocean where substantial surface water is present.\n\nThis divides the planet's water inventory by the modeled liquid-ocean coverage, so it is a global estimate rather than a detailed bathymetry map.",
  "Climate State": structuredTip({
    overview:
      "Global climate stability classification based on surface temperature and absorbed stellar flux.",
    drawnFrom:
      "Stellar flux, albedo, greenhouse effect, surface temperature, water inventory, and outgoing-radiation limits.",
    feedsInto:
      "Habitability scoring, ocean coverage interpretation, climate-zone generation, System Fate risk context, and visual warnings.",
    interpretAs:
      "Stable is ordinary climate; Snowball indicates global glaciation; Moist greenhouse risks long-term ocean loss; Runaway greenhouse exceeds the outgoing-radiation limit.",
    caveat:
      "Dry worlds are classified as Stable by this screen because water-driven snowball/greenhouse transitions are not applicable.",
    references: "Goldblatt et al. 2013; Kasting 1988; Budyko 1969; see Science & Maths.",
  }),
  "Surface State":
    "High-level rocky-surface classification. Standard rocky worlds stay below silicate-melt thresholds. Lava worlds are hot enough for extensive molten surface regions, and magma-ocean worlds are hot enough for globally widespread silicate melt.",
  "Earth Similarity Index": structuredTip({
    overview: "Earth Similarity Index is a 0-1 Earth-likeness score.",
    drawnFrom: "Radius, density, escape velocity, and average surface temperature.",
    interpretAs:
      "1.0 is Earth-like across those four inputs. Lower values indicate a less Earth-like rocky world.",
    caveat:
      "ESI is not a direct habitability verdict and does not include biology, atmosphere chemistry, geology, or stellar risk.",
    references: "See Science & Maths: ESI and habitability metrics.",
  }),
  "Habitability Index": structuredTip({
    overview: "Caelum comparative habitability model for rocky worlds.",
    drawnFrom:
      "The active solvent pathway, policy version, climate state, water/land context, atmosphere, stellar forcing, stability, and expanded KPI term breakdown.",
    interpretAs:
      "Use it as a model-prioritized comparison score, not as a confirmation that a world is habitable.",
    caveat:
      "This is PHI-inspired, not a direct literature PHI implementation, and it is not evidence of life.",
    references: "See Science & Maths: habitability scoring and solvent policy.",
  }),
  "UV Shielding":
    "Estimated surface-UV protection from the combined ozone column, atmospheric pressure support, and XUV environment. Shielded indicates an Earth-like to stronger photochemical UV screen, Partial indicates incomplete coverage, and Unshielded indicates weak protection.",
  "Prebiotic UV Window":
    "Surface-accessible 200-280 nm UV window for prebiotic starter chemistry.\n\nThis combines the host star's photospheric UV supply with atmospheric UV shielding, photochemical haze attenuation, and surface-liquid context. It is not a life, biosignature, or habitability-success verdict.",
  "Prebiotic UV Flux":
    "Estimated 200-280 nm UV flux after atmospheric attenuation, shown with the top-of-atmosphere value for context.\n\nThe stellar supply comes from the Star page stellar-environment model. It is a blackbody/photospheric estimate; flare-driven UV from cool active stars is not explicitly solved.",
  "Environment Forcing":
    "Canonical host-frame forcing used by the body solver: bolometric light, XUV, prebiotic UV, stellar wind, companion contributions, and flux variability. Eccentric-orbit means are retained for science checks while baseline at-orbit values keep existing climate outputs stable.",
  "Coupled Climate Tendency":
    "Bounded second-pass climate tendency from photochemical haze, methane, sulfur aerosols, clouds, water vapour, and CO2 weathering/outgassing feedback. Baseline values are preserved; when confidence gates pass, an effective climate state is shown beside them.",
  "Photochemical Forcing":
    "Bounded diagnostic temperature delta from climate-chemistry coupling. Negative values usually mean organic haze or sulfur aerosol cooling; positive values usually mean methane greenhouse plus allowed water-vapour feedback.",
  "Atmosphere Evolution":
    "Bounded atmosphere source/sink tendency from pressure, escape, retained volatiles, and carbon-cycle context. This is not a reservoir time integration and it never rewrites manual atmosphere inputs.",
  "CO2 Tendency":
    "Carbonate-silicate and outgassing tendency for CO2 drawdown or buildup. It can add a small bounded climate tendency, but it does not mutate atmospheric composition.",
  "Cloud Regime":
    "Cloud and circulation context inferred from pressure, exposed water, temperature, rotation, tidal lock state, stellar flux, haze, and collapse risk. It is diagnostic and does not directly rewrite the baseline temperature solve.",
  "Heat Redistribution":
    "How effectively the modeled atmosphere and cloud regime move heat around the planet. Higher values reduce day-night extremes and atmospheric-collapse risk, especially on slow or locked worlds.",
  "Cloud Albedo Effect":
    "Diagnostic cooling leverage from cloud reflectivity. Wet, high-flux synchronously rotating worlds can develop a substellar cloud-deck signal, but the model keeps this bounded and does not automatically make them habitable.",
  "Carbon Cycle":
    "Carbonate-silicate tendency context from exposed land, liquid water, CO2, volcanic supply, and tectonic recycling. It is a regulation tendency, not a solved CO2 history.",
  "Weathering Efficiency":
    "Relative strength of CO2 drawdown by exposed-rock weathering and limited seafloor weathering. Dry, airless, deep-ocean, or high-pressure-ice worlds are deliberately limited.",
  "Volcanic Supply":
    "Relative source-side carbon supply from volcanic or outgassing context. Stagnant-lid worlds can still outgas, but recycling is weaker than mobile-lid cases.",
  "Ocean Chemistry":
    "Qualitative ocean-chemistry context from water inventory, salinity/ammonia when available, CO2 pressure, carbonate buffering, rock-ocean access, and hydrothermal support. Salinity is inferred only when no explicit value exists.",
  "Carbonate Saturation":
    "Whether the current water, CO2, weathering, and rock-ocean context can plausibly support carbonate buffering. This is a saturation class, not a solved ocean pH model.",
  "Nutrient Support":
    "Qualitative nutrient and hydrothermal access for water-bearing worlds. High-pressure ice and isolated deep oceans reduce direct rock-ocean exchange.",
  "Biosignature Context":
    "Context-dependent interpretation of atmospheric O2/O3, methane, CO, haze, replenishment demand, and false-positive risk. This never claims that life is detected.",
  Disequilibrium:
    "How strongly reactive gases such as O2 plus CH4 coexist at levels that require ongoing replenishment. A high value means source required, not biology proven.",
  "O2/O3 False Positive":
    "Abiotic oxygen or ozone risk from water loss, strong UV/XUV, dry surfaces, weak sinks, and redox context.",
  "Methane Context":
    "Methane interpretation using oxygen level, haze likelihood, outgassing, hydrothermal context, and replenishment demand. Methane can be geologic or photochemical.",
  "CO Buildup Risk":
    "Carbon-monoxide buildup risk in low-UV or high-CO2 atmospheres. CO can create false-positive or false-negative biosignature context.",
  "Photochemical Haze":
    "Organic photochemical haze likelihood from methane-to-CO2 ratio, oxygen suppression, atmospheric pressure, and available UV. Haze cooling now feeds the Phase 4 coupled-climate diagnostic, but it still does not change the baseline surface-temperature solve.",
  "Haze Cooling Potential":
    "Estimated anti-greenhouse cooling potential from organic haze opacity. This release reports the potential but does not feed it back into the main climate temperature solve.",
  "Surface Light":
    "Visible-light reduction at the surface from photochemical haze opacity. This affects display context only and does not change the physical habitability score.",
  "Ozone Column":
    "Estimated stratospheric ozone column in Dobson Units, scaled from oxygen partial pressure, stellar XUV level, and bulk atmospheric pressure. Earth averages about 300 DU.",
  "Photochemical Stability":
    "Flags incompatible atmospheric gas pairs that should not coexist at the shown levels without continuous replenishment. This is a lightweight plausibility screen, not a full photochemical equilibrium solver.",
  "Atmosphere Trend":
    "Long-term atmosphere source-sink ledger. Stable/replenished worlds have source terms that plausibly balance loss terms; declining/transient worlds are dominated by escape, collapse, cold trapping, or sputtering.",
  "Dominant Source":
    "Largest current atmosphere source term in the Phase 3 ledger, such as retained volatiles, volcanic outgassing, cryovolcanism, or ocean buffering.",
  "Dominant Sink":
    "Largest current atmosphere sink term in the Phase 3 ledger, such as Jeans escape, XUV escape, wind sputtering, condensation collapse, weathering, or surface adsorption.",
  "Stability Timescale":
    "Qualitative atmospheric persistence timescale from the source-sink ledger. This is an order-of-magnitude class, not a precise lifetime calculation.",
  "Magnetic Field":
    "Estimated surface magnetic field strength relative to Earth (1.0\u00d7 = Earth's field).\n\nUses simplified Olson & Christensen (2006) dynamo scaling: field strength depends on core size, bulk density, heat flux, and core solidification state.\n\nTidal heating from assigned moons can extend core liquid lifetime, potentially sustaining a dynamo that would otherwise shut down. Shown as 'tidally sustained' when moon heating exceeds 10% of the planet's internal heat budget.\n\nA dipolar field (like Earth's) provides strong magnetospheric protection. Multipolar fields (slow rotators, P > ~96 h) are ~20\u00d7 weaker at the surface.\n\nStrong (> 0.5\u00d7): good protection from stellar wind\nModerate (0.1\u20130.5\u00d7): partial protection\nWeak (< 0.1\u00d7): minimal protection\nNone: no active dynamo",
  "Moon Tidal Heating":
    "Solid-body tidal heating on the planet from its assigned moons, expressed as a multiple of Earth's mean geothermal heat flux (0.087 W/m\u00b2).\n\nComputed using the Peale et al. (1979) formula with the planet's composition-dependent Love number (k\u2082) and tidal quality factor (Q). Only solid-body dissipation is modelled\u2014oceanic tidal heating is not included.\n\nA circular orbit (e = 0) produces zero tidal heating. Higher eccentricity and closer orbits dramatically increase heating.\n\n< 0.1\u00d7 Earth: negligible\n0.1\u20131\u00d7: comparable to Earth's internal heat\n1\u201310\u00d7: enhanced volcanism\n> 10\u00d7: extreme resurfacing (Io-like)",
  "Suggested CMF":
    "Core mass fraction predicted from the host star's metallicity [Fe/H], using solar abundance scaling (Schulze et al. 2021, PSJ 2, 113).\n\n~75% of observed rocky exoplanets have CMF consistent with their host star. This is a suggestion, not a constraint\u2014giant impacts or formation location can shift CMF significantly.",
  "Tectonic Regime":
    "The green-highlighted option is the recommended regime, computed from mass, age, water content, core fraction, and tidal heating. It is pre-selected by default and updates as you change inputs. Selecting a different option overrides the recommendation.\n\nStagnant lid: single rigid plate, no subduction (Venus, Mars)\nMobile lid: plate tectonics with subduction and recycling (Earth)\nEpisodic: periodic catastrophic overturn events\nPlutonic-squishy: intrusive volcanism without rigid plates\n\nThe science is genuinely unsettled (Valencia 2007 vs O'Neill 2007). The probability bar shows the engine's estimate.",
  "Mantle Oxidation":
    "Oxidation state of the mantle controls which gases are outgassed by volcanism (Ortenzi et al. 2020, Sci. Rep. 10, 10907).\n\nHighly reduced (\u0394IW \u2248 \u22124): H\u2082 + CO dominated\nModerately reduced (\u0394IW \u2248 \u22122): mixed H\u2082 + CO\u2082\nEarth-like (\u0394IW \u2248 +1): CO\u2082 + H\u2082O dominated\nOxidized (\u0394IW \u2248 +3): CO\u2082 + H\u2082O + SO\u2082\n\n\u0394IW = oxygen fugacity relative to the iron-w\u00fcstite buffer.",
  Outgassing:
    "Primary volcanic outgassed species, determined by mantle oxidation state. Oxidised mantles produce CO\u2082 + H\u2082O (denser atmospheres), while reduced mantles produce H\u2082 + CO (lighter, puffier atmospheres).",
  Density:
    "The average density of your planet. Earth = 5.51 g/cm\u00b3\n\nThe density of silicate rock is ~ 3 g/cm\u00b3 and the density of iron is ~ 8 g/cm\u00b3.",
  Radius:
    "The radius of your planet in Earth radii. Earth = 1 REarth = 6371 km.\n\nTerrestrial planets should have radii less than about 1.6 Earth radii.",
  Gravity:
    "The surface gravity at sea level on your planet. Earth = 1g = 9.8 m/s\u00b2\n\nHabitable Earth-like planets should surface gravities between 0.4 and 1.6 g.",
  "Escape Velocity":
    "How fast a spacecraft would need to travelling in order to escape the planet's gravitational pull. Earth = 1 VEarth = 11.2 km/s",
  Oblateness:
    "Rotational flattening f = (Req - Rpol) / Req. Faster rotation and lower central concentration make a rocky planet more oblate. J2 is the quadrupole gravity moment associated with that flattening.",
  "Surface Temperature (Avg.)":
    "The average surface temperature of your planet. Earth = ~287 K ( ~14\u00b0 C)",
  "Horizon Distance":
    "The distance to the horizon in km based on planet radius and observer height.",
  "Year length": "The orbital period shown in Earth days and local days.",
  "Star apparent size": "Apparent angular diameter of the star as seen from the planet.",
  "Transit Depth":
    "Fraction of the star's light blocked during a central transit, shown as both percent and ppm. Computed from (R_body / R_star)^2 and assumes the orbital geometry actually produces a transit.",
  "RV Semi-Amplitude":
    "Approximate stellar radial-velocity semi-amplitude K induced by the planet, assuming sin i = 1 (edge-on / transiting reference geometry). Higher values are easier to detect in stellar spectra.",
  "Sky colour (sun high)":
    "Estimated daytime sky colour near local noon based on stellar spectrum, surface pressure, gravity, temperature, and atmospheric composition.\n\nLower gravity or higher temperature increases the atmospheric column depth, shifting colours toward thicker-atmosphere entries. CO₂-rich atmospheres receive a warm amber tint.",
  "Sky colour (low sun)":
    "Estimated sky colour near the horizon based on stellar spectrum, surface pressure, gravity, temperature, and atmospheric composition.\n\nThe same column-density and CO₂ corrections apply as for the high-sun colour.",
  Details:
    "Detailed derived outputs and atmospheric composition values.\n\nIncludes a guardrail note when O2 + CO2 + Ar exceeds 100% and N2 is clamped to 0%.",
  Insolation:
    "Stellar energy received at the planet's orbit relative to Earth. Insolation = L☉ / d² where L is stellar luminosity and d is the semi-major axis in AU.\n\nEarth = 1.0× by definition.",
  "Stellar Wind Pressure":
    "Estimated local stellar-wind ram pressure at the planet, reported in nanopascals and relative to present-day Earth.\n\nHost-star wind is diluted by orbital distance; wide companion-star wind is added from the host-frame binary separation model. This feeds the magnetopause sizing model but remains a first-order wind diagnostic, not a full MHD simulation.",
  Magnetopause:
    "Estimated dayside magnetopause standoff distance from dipole pressure balance against the local stellar wind.\n\nEarth-like fields under present-day solar wind land near 8-12 planetary radii. Weak or multipolar fields can collapse close to the surface even if an intrinsic dynamo exists.",
  "Wind Compression":
    "How strongly the local stellar wind compresses the magnetosphere.\n\nThe standoff follows the dipole pressure-balance scaling R_mp proportional to wind pressure^(-1/6), so very large wind changes produce moderate but important size changes.",
  "Companion Flux":
    "Average extra visible-light heating from the other star or stars in the selected host frame. Higher companion flux usually warms the world, shifts the effective habitable zone outward, and can make otherwise cool orbits more temperate.",
  "Flux Variability":
    "Approximate long-period flux swing driven by the binary orbit. Higher variability means the companion star's contribution changes more strongly over time, which can reinforce slow seasonal forcing and make climates less steady.",
  "Dynamical Stability":
    "Empirical binary-orbit stability check for the selected host frame. Stable means the current orbit sits comfortably inside the circumstellar limit. Marginal means it is close to the edge. Likely unstable means long-term survival is doubtful without changing the orbit or host frame.",
  "Tidal lock":
    "Estimated tidal-evolution state of the planet's rotation.\n\n• Synchronous (1:1) — rotation period equals orbital period (permanent day/night sides).\n• Spin-orbit resonance (3:2, 2:1, …) — higher-order lock driven by orbital eccentricity (Goldreich & Peale 1966). Mercury is a real 3:2 example.\n• Atmosphere-stabilised — thick atmospheres generate thermal tides that counteract gravitational locking (Leconte+ 2015). Venus is the classic case.\n• Otherwise shows the estimated time to despin (Love-number k₂ / quality-factor Q model).\n\nHigh eccentricity favours higher-order resonances; thick atmospheres resist all locking.",
  "Atmospheric Collapse":
    "Locked-world atmospheric collapse check for synchronously rotating planets. The model estimates a pressure-supported night-side temperature and compares it against the dominant atmospheric gas condensation point. Thin CO2 atmospheres are the main risk case; ~0.1–1 bar atmospheres generally redistribute enough heat to stay stable.\n\nReferences: Joshi et al. (1997), Wordsworth (2015), Turbet et al. (2018).",
  "In habitable zone":
    "Whether the planet's semi-major axis falls within the star's conservative habitable zone (liquid water on the surface). The HZ boundaries use temperature-dependent Seff polynomials.",
  "Liquid water":
    "Whether the average surface temperature and pressure allow liquid water to exist. Checks against the water phase diagram: pressure ≥ triple point (0.006 atm) and temperature between freezing (273 K) and the pressure-dependent boiling point.",
  "Temp at periapsis":
    "Equilibrium temperature (no greenhouse) at the closest orbital approach. Uses the same blackbody formula as average T_eq but substitutes the periapsis distance. Only shown for eccentric orbits (e > 0.005).",
  "Nearest resonance":
    "Checks whether this body\u2019s orbit lies close to a mean-motion resonance with a system gas giant. Shows the closest p:q ratio, the exact resonance distance, and how far off the planet is (%). Example: Pluto is in Neptune\u2019s 3:2 resonance.",
  "Volatile ices":
    "For dwarf planets (mass < 0.01 M\u2295), checks whether surface ices (N\u2082, CO, CH\u2084, H\u2082O, CO\u2082) can sublimate at periapsis and apoapsis temperatures. Transient atmospheres form when periapsis is warm enough to sublimate but apoapsis is not.",
  "Vegetation colour":
    "Estimated plant/vegetation colour based on photosynthetic pigment adaptation to the host star's spectrum.\n\nHotter stars (F/A) → plants absorb UV/blue and reflect yellow-orange.\nSun-like stars (G) → green, like Earth.\nCool stars (K) → dark green/teal, broader absorption.\nRed dwarfs (M) → near-black, absorbing all available light.\n\nGradient shows low concentration (pale) → high concentration (deep).\n\nReferences: Kiang (2007), Lehmer et al. (2021), Arp et al. (2020), PanoptesV.",
  "Vegetation colour (twilight)":
    "Plant colours adapted to the permanent twilight zone on tidally locked worlds. Only shown for K/M star planets that are tidally locked.\n\nOrganisms at the terminator receive only scattered and refracted starlight, so pigments are paler and more tan/brown.",
  "Atmospheric circulation": "Derived circulation-cell summary for the current planet.",
  "Derived atmosphere":
    "Atmospheric pressure, composition, partial pressures, and escape analysis.",

  // ── Gas giant inputs ──
  "GG Slot":
    "Orbital slot from the system layout. Each slot has a fixed distance determined by the orbit spacing formula. Slots occupied by rocky planets are unavailable.",
  "Custom orbit":
    "Manual semi-major axis in AU. Use this when the gas giant does not sit neatly on one of the system\u2019s Titius\u2013Bode-style orbital slots.",
  "GG Companion Class":
    "Substellar companion regime. Gas giants stay below the deuterium-burning threshold (~13 Mjup). Brown dwarfs occupy the ~13-75 Mjup cooling-track regime and use brown-dwarf classification and current-temperate-zone outputs instead of the gas-giant atmosphere model.",
  "GG Size": `Gas giant radius in Jupiter radii (Rj). Constrained to ${GAS_GIANT_RADIUS_MIN_RJ.toFixed(2)}\u2013${GAS_GIANT_RADIUS_MAX_RJ.toFixed(2)} Rj. Radius and mass are related: larger giants are not always heavier due to electron degeneracy pressure compressing the core at high masses.`,
  "GG Mass":
    "Mass in Jupiter masses (M\u2081 = 1.898\u00d710\u00b2\u2077 kg). If blank, estimated from radius using Chen & Kipping 2017 power-law forecasting. Above ~3\u201310 Mj, deuterium fusion begins (brown dwarf regime).",
  "GG Rotation":
    "Sidereal rotation period in hours. Jupiter rotates in ~9.9 h, Saturn in ~10.7 h. Faster rotation strengthens the magnetic dynamo, increases the number of atmospheric jet streams (bands), and raises equatorial wind speeds.",
  "GG Metallicity":
    "Atmospheric heavy-element enrichment relative to solar (Z/Z\u2299). If blank, estimated from mass via Thorngren & Fortney 2019. Higher metallicity increases CH\u2084, NH\u2083, and H\u2082O cloud abundances. Jupiter is ~3* solar; Saturn ~10*; Uranus/Neptune ~50\u2013100*.",
  "GG Eccentricity":
    "Orbital eccentricity (0 = circular, 0.99 = nearly parabolic). Affects periapsis/apoapsis distances, equilibrium temperature variation, and tidal circularisation timescale.\n\nJupiter e = 0.048, Saturn e = 0.054, HD 80606b e = 0.93.",
  "GG Inclination":
    "Orbital inclination relative to the reference plane (0\u2013180\u00b0). Inclination > 90\u00b0 indicates a retrograde orbit.\n\nMost solar system giants have inclinations < 3\u00b0.",
  "GG Axial Tilt":
    "Obliquity \u2014 the angle between the rotation axis and the orbital normal (0\u2013180\u00b0). Affects seasonal atmospheric variation and ring illumination geometry.\n\nJupiter 3.1\u00b0, Saturn 26.7\u00b0, Uranus 97.8\u00b0, Neptune 28.3\u00b0.",
  "GG Insolation":
    "Stellar energy received relative to Earth (L\u2609 / d\u00b2). Drives cloud formation, Sudarsky classification, and weather patterns.",
  "GG Nearest Resonance":
    "Checks whether this gas giant\u2019s orbit lies close to a mean-motion resonance with another gas giant in the system. Example: Jupiter and Saturn are near a 5:2 resonance.",

  // ── Gas giant outputs ──
  "GG Output Radius":
    "Equatorial radius in Jupiter radii. Due to degeneracy pressure, giant planets above ~4 Mj barely increase in radius with added mass.\n\n1 Rj = 71,492 km",
  "GG Density":
    "Mean bulk density (mass/volume). Jupiter is ~1.33 g/cm\u00b3; Saturn is less dense than water at ~0.69 g/cm\u00b3.",
  "GG Gravity":
    "Surface gravity at the 1-bar pressure level, in Earth g\u2019s and m/s\u00b2. Depends on both mass and radius: g = GM/R\u00b2.",
  "GG Equilibrium Temp":
    "Blackbody equilibrium temperature from stellar irradiation alone. Effective temperature (T_eff) adds internal heat from gravitational contraction (Kelvin\u2013Helmholtz mechanism).",
  "GG Orbital Period":
    "Time for one complete orbit, from Kepler\u2019s third law: P\u00b2 = a\u00b3/M\u2605. Orbital velocity is the mean speed along the orbit.",
  Sudarsky:
    "Temperature-based appearance classification (Sudarsky et al. 2000). Class I: ammonia clouds (<150 K). Class II: water clouds (150\u2013250 K). Class III: cloudless (250\u2013900 K). Class IV: alkali metals (900\u20131400 K). Class V: silicate/iron clouds (>1400 K).",
  "GG Derived":
    "Detailed atmospheric, thermal, magnetic, and gravitational properties computed from the input parameters and host-star luminosity.",
  "GG Oblateness":
    "Rotational flattening f = (R_eq \u2212 R_pol)/R_eq. Faster spin \u2192 more oblate. Gas giants use f/q \u2248 0.75; ice giants \u2248 0.9. Jupiter f = 0.065, Saturn f = 0.098. J\u2082 is the quadrupole gravity moment.",
  "GG Magnetic Field":
    "Surface dipole field from Christensen (2009) energy-flux dynamo scaling, self-normalised to Jupiter (4.28 G).\n\nAccounts for: bulk density, internal heat flux (with 0.2 W/m\u00b2 compositional convection floor), dynamo shell geometry (metallic hydrogen depth for gas giants, ionic ocean for ice giants), and conductivity regime.\n\nGas giants: dipolar fields (deep metallic-H shell).\nIce giants: multipolar fields (thin ionic conducting shell).\n\nMoon tidal heating contributes to the heat flux driving the dynamo.",
  "GG Magnetosphere":
    "Dayside magnetopause standoff from Chapman-Ferraro dipole pressure balance against local stellar-wind ram pressure.\n\nMoon plasma loading can inflate the cavity, while close-in high-wind cases compress it. This remains a first-order pressure-balance model, not a full plasma-physics simulation.",
  "GG Moon Tidal":
    "Tidal heating deposited on the gas giant by orbiting moons (Peale et al. 1979). Uses fluid Love number k\u2082 (Wahl+ 2016, Lainey+ 2017) and tidal quality factor Q. Jupiter Q \u2248 10\u2075, Saturn Q \u2248 3\u00d710\u00b3 (resonance locking, Fuller+ 2016). Fraction is relative to the giant's intrinsic internal heat flux.",
  "GG Mass Loss":
    "Energy-limited atmospheric escape driven by stellar XUV radiation (Ribas et al. 2005). Hot Jupiters at <0.1 AU can lose >10\u2076 kg/s. Evaporation timescale \u226b Hubble time for most giants. Roche lobe overflow flags planets exceeding the Eggleton (1983) tidal radius.",
  "GG Jeans Escape":
    "Per-species Jeans escape for the gas giant\u2019s atmosphere. The Jeans parameter \u03bb = v_esc\u00b2 \u00d7 m / (2 R T_exo) measures how firmly each species is bound at the exobase.\n\n\u03bb \u2265 6: Retained. 3 \u2264 \u03bb < 6: Marginal. \u03bb < 3: Lost.\n\nH\u2082 and He experience non-thermal escape (charge exchange, ion pickup) which raises effective retention thresholds.\n\nGas giant exobase temperature accounts for extended H\u2082/He envelope XUV absorption. Hot Jupiters can reach T_exo \u2248 10,000 K (hydrodynamic blow-off).\n\nReferences: Jeans (1925), Murray-Clay et al. (2009, ApJ 693, 23).",
  "GG Interior":
    "Heavy-element budget from Thorngren et al. (2016): M_Z = 49.3 \u00d7 (M/Mj)^0.61 M\u2295. Core mass capped at 25 M\u2295 per Juno constraints. Bulk metallicity Z = M_Z / M_total.",
  "GG Suggested Radius":
    "Suggested gas-giant radius from age-dependent cooling plus hot-Jupiter irradiation. The cooling term follows the existing Fortney-style age correction, then highly irradiated giants receive a Thorngren & Fortney (2018)-style flux-driven radius anomaly with a conservative cap.",
  "GG Ring Properties":
    "Ring composition depends on equilibrium temperature: icy (<150 K), mixed (150\u2013300 K), or rocky (>300 K). Mass scaled from Saturn\u2019s rings. Optical depth classified as Dense (\u03c4 > 1), Moderate (0.1\u20131), or Tenuous (< 0.1).",
  "GG Rings":
    "Choose whether rings follow the science recommendation or are manually forced on or off. Auto follows the derived ring science. Forced settings can go against the science and are labelled explicitly.",
  "GG Tidal":
    "Tidal locking timescale \u221d a\u2076: hot Jupiters at <0.05 AU lock within ~1 Gyr. Circularisation timescale \u221d a^6.5. Both compared to the host star\u2019s age to determine current state.",
  "Brown Dwarf Class":
    'Brown dwarfs use the L, T, and Y sequence from hottest to coolest.\n\nThe number runs 0-9 within each family, where 0 is hotter and 9 is cooler. So "T9 BD" means a very cool late-T brown dwarf near the T/Y boundary.\n\nQuick guide:\nL = warmer dusty brown dwarf\nT = cooler methane-rich brown dwarf\nY = coldest known brown-dwarf class\nBD = brown dwarf.',
  "Current Age":
    "Current age of this brown dwarf companion in billions of years (Gyr). In the current system model it follows the host system age.",
  "Metallicity [Fe/H]":
    "Host-system metallicity relative to the Sun.\n\n[Fe/H] = log\u2081\u2080(Fe/H)_object \u2212 log\u2081\u2080(Fe/H)_sun\n\nSun = 0.0 by definition. Positive = metal-rich, negative = metal-poor.",
  "Stellar Population":
    "A broad population label derived from metallicity.\n\nPopulation I (solar neighbourhood): [Fe/H] > \u22120.3\nIntermediate (old thin disk): \u22121.0 < [Fe/H] \u2264 \u22120.3\nPopulation II (metal-poor): [Fe/H] \u2264 \u22121.0\nMetal-rich (inner disk): [Fe/H] > +0.15",
  "BD Radius":
    "Brown-dwarf radius in solar radii.\n\nBrown dwarfs stay close to Jupiter-size despite much larger mass because electron degeneracy pressure limits radius growth.\n\nSun = 1 Rsol = 695,700 km",
  Luminosity:
    "Stellar luminosity in solar luminosities.\n\nKPI cards may auto-scale dim outputs for readability:\nLsol = Sun's luminosity\nmLsol = 10^-3 Lsol (one thousandth of Sol)\n\u03bcLsol = 10^-6 Lsol (one millionth of Sol)\nnLsol = 10^-9 Lsol (one billionth of Sol)\n\nHover the KPI for the exact Lsol and watt values.\n\nSun = 1 Lsol = 3.846E26 watts",
  "BD Temperature":
    "Effective photospheric temperature of the brown dwarf in kelvin, derived from its current cooling-track luminosity and radius.",
  "Star Colour":
    "Visible-light stylisation derived from the current brown-dwarf effective temperature. Cooler T and Y dwarfs are rendered much dimmer and redder/magenta than ordinary stars because most of their energy emerges in the infrared.",
  "Activity Regime":
    "Activity regime is based on effective temperature and age bins used by the flare-frequency model.\n\nTemperature bins:\nFGK: T >= 3900 K\nEarly M: 3200 K \u2264 T < 3900 K\nLate M: T < 3200 K\n\nAge bands:\nFGK: young <0.5 Gyr, mid 0.5\u20132 Gyr, old >=2 Gyr\nEarly M: young <1 Gyr, mid 1\u20134 Gyr, old >=4 Gyr\nLate M: young <2 Gyr, mid 2\u20136 Gyr, old >=6 Gyr.",
  "Direct Earth-like Life":
    "Whether a modern Earth-like planet is expected to work directly around this host object.\n\nBrown dwarfs default to no direct Earth-like-life verdict because they are cooling substellar objects; use the current temperate zone and moon outputs instead.",
  "Cooling State":
    "Brown dwarfs cool and fade over time instead of sustaining long-term core hydrogen fusion. This field shows the current cooling-track state, or the brief deuterium-burning phase near the low-mass brown-dwarf boundary.",
  "XUV Regime":
    "Extreme-UV and soft X-ray activity regime from the host-object XUV model.\n\nBrown dwarfs currently report negligible XUV in this model.",
  "XUV Luminosity":
    "High-energy host-object luminosity in the XUV band.\n\nBrown dwarfs currently report negligible XUV in this model.",
  "XUV Flux at 1 AU":
    "XUV flux a body would receive at 1 AU from this host object.\n\nReported both as erg/cm\u00b2/s and relative to present-day Earth, then diluted by inverse-square distance for planets and moons.",
  "Energetic Flare Rate (>1e32 erg)":
    "N32 is the expected rate of energetic flares above 10^32 erg.\n\nBaselines by regime:\nFGK old/mid/young: 0.05 / 0.25 / 1.0 per day\nEarly M old/mid/young: 0.5 / 2.0 / 8.0 per day\nLate M old/mid/young: 2.0 / 8.0 / 30.0 per day.",
  "Energetic Flare Recurrence":
    "Recurrence is computed from N32 as 1 / N32 days for flares above 10^32 erg.",
  "Total Flare Rate (>1e30 erg)":
    "Expected flare rate above 10^30 erg, computed from the flare-frequency distribution anchored to N32 and alpha.\n\nThis is a broader event count than the energetic >10^32 erg rate.",
  "Total Flare Recurrence":
    "Recurrence for flares above 10^30 erg, computed as 1 / rate and shown in hours or minutes when frequent.",
  "Associated CME Rate":
    "Expected CME rate linked to flare activity, using an energy-weighted flare-CME association probability and activity suppression at very high flare rates.",
  "Background CME Rate":
    "Expected CME rate not explicitly tied to an individual rendered flare. For FGK stars this fills the gap between the associated rate and the cycle envelope.",
  "Total CME Rate":
    "Total expected CME rate per day. For FGK stars, this follows the solar-cycle envelope and is split into associated and background channels.\n\nReference: Yashiro et al. (2006, JGR 111, A12S05).",
  "Solar CME Envelope (FGK)":
    "Solar observations show coronal mass ejection rates varying from about 0.5 to 6.0 per day across the solar cycle.\n\nThis envelope is shown only for FGK stars.",
};

Object.assign(TIP_LABEL, {
  "Star (read-only)": structuredTip({
    overview: "Read-only host-frame context for the selected body.",
    drawnFrom:
      "Saved stellar topology, selected host frame, and solved host luminosity/mass context.",
    feedsInto:
      "Habitable zone, companion heating, orbit stability, and downstream climate context.",
    caveat: "Edit stellar properties on the Star page.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  "Body selection": structuredTip({
    overview: "Choose which saved body is being edited.",
    changes:
      "Switches the visible inputs and outputs to that body without changing its saved data.",
    caveat: "Bodies are grouped by host frame and sorted by orbital distance for navigation.",
  }),
  "Body Class": structuredTip({
    overview: "Display classification from mass and subtype context.",
    drawnFrom: "Body mass, envelope/water inventory, and classification helpers.",
    caveat: "Some classes are labels over the same physical solver rather than separate engines.",
    references: "See Science & Maths: planetary classification.",
  }),
  "Orbital slot": structuredTip({
    overview: "Assign this body to an available generated system slot.",
    changes: "Updates guided system placement within the selected host frame.",
    caveat: "One body may occupy each slot; manual orbit editing uses semi-major axis directly.",
    references: "See Science & Maths: orbital architecture.",
  }),
  Name: structuredTip({
    overview: "Display name for this body.",
    feedsInto: "Selectors, exports, visualizer labels, System Fate, and page headings.",
    caveat: "Changing the name does not change physical outputs.",
  }),
  Physical: structuredTip({
    overview: "Core bulk-property inputs for the selected body.",
    feedsInto:
      "Radius, density, gravity, escape, atmosphere, climate, tectonics, and classification.",
    caveat: "Some exotic subtypes may use only a limited subset of rocky-world outputs.",
  }),
  "Observed Radius": structuredTip({
    overview: "Optional measured transit/photosphere radius.",
    feedsInto: "Detection-style radius, bulk density, and volatile envelope reporting.",
    changes:
      "Blank uses modelled radius; filled preserves both observed and modelled radius context.",
    caveat: "It does not force the interior model to physically match the observation.",
    references: "See Science & Maths: volatile envelopes.",
  }),
  "Greenhouse Effect": structuredTip({
    overview: "Manual greenhouse multiplier used in Manual greenhouse mode.",
    feedsInto: "Surface temperature, climate state, habitability metrics, and climate zones.",
    interpretAs: "0 means no atmospheric warming; Earth-like is near 1.2 in this app's scale.",
    caveat: "Core and Full modes compute greenhouse from gas composition instead.",
    references: "See Science & Maths: climate energy balance.",
  }),
  "Greenhouse Mode": structuredTip({
    overview: "Selects how greenhouse warming is computed.",
    changes:
      "Core uses CO2/H2O/CH4 and pressure broadening; Full adds expert gases; Manual uses the direct multiplier.",
    feedsInto: "Surface temperature, climate state, atmosphere outputs, and habitability context.",
    caveat: "The model is bounded and does not run radiative-transfer columns.",
    references: "See Science & Maths: greenhouse model.",
  }),
  "Water Vapor (H₂O)": structuredTip({
    overview: "Average atmospheric water-vapour fraction.",
    feedsInto: "Greenhouse warming, climate erosion, cloud context, and aridity signals.",
    caveat:
      "It is an authored/solved fraction, not a feedback loop that recomputes with temperature.",
    references: "See Science & Maths: greenhouse gases and climate erosion.",
  }),
  "Methane (CH₄)": structuredTip({
    overview: "Atmospheric methane fraction.",
    feedsInto:
      "Greenhouse warming, photochemical forcing, haze context, and biosignature interpretation.",
    caveat:
      "Methane can be biological, geological, or photochemical; the app does not claim a source by default.",
    references: "See Science & Maths: greenhouse gases and biosignature context.",
  }),
  "Hydrogen (H₂)": structuredTip({
    overview: "Atmospheric hydrogen fraction in Full mode.",
    feedsInto: "Greenhouse warming, mean molecular weight, scale height, and escape checks.",
    caveat: "Hydrogen is easy to lose on low-gravity or high-XUV worlds.",
    references: "Wordsworth & Pierrehumbert 2013; see Science & Maths: atmosphere.",
  }),
  "Helium (He)": structuredTip({
    overview: "Atmospheric helium fraction in Full mode.",
    feedsInto: "Mean molecular weight, scale height, and escape checks.",
    caveat:
      "Helium is IR-transparent in this model and usually difficult for small worlds to retain.",
    references: "See Science & Maths: atmospheric escape.",
  }),
  "Sulfur Dioxide (SO₂)": structuredTip({
    overview: "Atmospheric sulfur-dioxide fraction in Full mode.",
    feedsInto: "Greenhouse/aerosol context and volcanic-world interpretation.",
    caveat: "Aerosol chemistry is bounded, not a full sulfur photochemistry model.",
    references: "See Science & Maths: greenhouse gases and photochemical forcing.",
  }),
  "Ammonia (NH₃)": structuredTip({
    overview: "Atmospheric ammonia fraction in Full mode.",
    feedsInto: "Greenhouse forcing and reducing-atmosphere interpretation.",
    caveat:
      "Ammonia is UV-fragile, so sustained levels imply an active source not fully simulated here.",
    references: "See Science & Maths: greenhouse gases.",
  }),
  "Height of Observer": structuredTip({
    overview: "Observer elevation used for horizon-distance calculations.",
    feedsInto: "Apparent horizon and visibility outputs.",
    caveat: "It does not modify climate or atmosphere outputs.",
  }),
  "Orbit & Rotation": structuredTip({
    overview: "Orbital and spin inputs for the selected body.",
    feedsInto:
      "Year length, season strength, climate, visualizer placement, and apparent-sky outputs.",
    references: "See Science & Maths: Keplerian orbit geometry and seasons.",
  }),
  "Rotation Period": structuredTip({
    overview: "Sidereal day length in Earth hours.",
    feedsInto: "Day/night cycle, climate redistribution, visual rotation, and apparent sky.",
    caveat:
      "Spin evolution and tidal locking are summarized elsewhere rather than integrated here.",
    references: "See Science & Maths: rotation and climate context.",
  }),
  "Semi-Major axis": structuredTip({
    overview: "Average orbital distance from the selected host frame.",
    feedsInto:
      "Stellar flux, equilibrium temperature, habitable-zone context, orbital period, and visualizer placement.",
    caveat: "For eccentric orbits, instantaneous distance varies between periapsis and apoapsis.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  Eccentricity: structuredTip({
    overview: "How stretched the orbit is.",
    feedsInto:
      "Periapsis/apoapsis, seasonal flux variability, visualizer orbit shape, and stability context.",
    interpretAs: "0 is circular; values near 1 are extremely elongated.",
    caveat: "The app uses analytic orbit context, not a full N-body integration.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  Inclination: structuredTip({
    overview: "Tilt of this orbit relative to the primary reference plane.",
    feedsInto: "Visualizer projected orbit orientation and long-term dynamics diagnostics.",
    caveat: "Climate outputs are not a full inclined-orbit secular simulation.",
    references: "See Science & Maths: orbital inclination.",
  }),
  "Longitude of Periapsis": structuredTip({
    overview: "Orientation of closest approach within the orbital plane.",
    feedsInto: "Visualizer eccentric orbit placement and periapsis/apoapsis markers.",
    caveat: "It rotates the ellipse; it does not change semi-major axis or eccentricity.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  Atmosphere: structuredTip({
    overview: "Bulk atmospheric composition and pressure inputs.",
    feedsInto:
      "Greenhouse warming, escape, density, climate state, UV shielding, and habitability metrics.",
    caveat:
      "N2 is inferred from the remainder after other gases and clamped at zero if totals exceed 100%.",
    references: "See Science & Maths: atmosphere and climate coupling.",
  }),
  "Oxygen (O2)": structuredTip({
    overview: "Atmospheric oxygen partial pressure.",
    feedsInto:
      "Habitability checks, biosignature context, UV shielding, and atmosphere composition.",
    caveat: "Oxygen can have abiotic pathways; the app does not treat O2 as proof of life.",
    references: "See Science & Maths: biosignature context.",
  }),
  "Carbon Dioxide (CO2)": structuredTip({
    overview: "Atmospheric carbon-dioxide partial pressure.",
    feedsInto: "Greenhouse warming, carbon-cycle tendency, weathering, and habitability limits.",
    caveat: "The carbon-cycle tendency is diagnostic and does not mutate CO2 inputs.",
    references: "See Science & Maths: carbon cycle and greenhouse gases.",
  }),
  "Argon (Ar)": structuredTip({
    overview: "Atmospheric argon partial pressure.",
    feedsInto: "Bulk pressure and atmosphere composition.",
    caveat: "Argon is treated as an inert ballast gas in this model.",
  }),
  "Radioisotope Abundance": structuredTip({
    overview: "Bulk radiogenic heat multiplier relative to Earth.",
    feedsInto: "Internal heat, volcanism, tectonics, lithosphere thickness, and dynamo context.",
    caveat: "Use isotope controls for a more explicit U/Th/K mix.",
    references: "See Science & Maths: radiogenic heating.",
  }),
  "U-238": structuredTip({
    overview: "Uranium-238 abundance relative to Earth's reference inventory.",
    feedsInto: "Radiogenic heating and late-time internal heat.",
    references: "See Science & Maths: radiogenic heating.",
  }),
  "U-235": structuredTip({
    overview: "Uranium-235 abundance relative to Earth's reference inventory.",
    feedsInto: "Radiogenic heating, especially in younger systems.",
    references: "See Science & Maths: radiogenic heating.",
  }),
  "Th-232": structuredTip({
    overview: "Thorium-232 abundance relative to Earth's reference inventory.",
    feedsInto: "Long-lived radiogenic heating.",
    references: "See Science & Maths: radiogenic heating.",
  }),
  "K-40": structuredTip({
    overview: "Potassium-40 abundance relative to Earth's reference inventory.",
    feedsInto: "Shorter-lived radiogenic heating, especially in younger rocky interiors.",
    references: "See Science & Maths: radiogenic heating.",
  }),
  Appearance: structuredTip({
    overview: "Read-only physics-driven visual preview of the planet.",
    drawnFrom:
      "Composition, water regime, temperature, pressure, climate, ice/cloud context, and visuals.",
    caveat: "It is a stylised preview, not a surface map or renderer export.",
  }),
  Rings: structuredTip({
    overview: "Controls whether rocky-planet rings follow science or manual override.",
    drawnFrom: "Roche-limit checks and assigned moon periapses in Auto mode.",
    caveat: "Forced settings can go against science and are labelled explicitly.",
    references: "See Science & Maths: Roche limits and rings.",
  }),
  Composition: structuredTip({
    overview: "Interior composition class for rocky worlds.",
    drawnFrom: "Core Mass Fraction, Water Mass Fraction, and subtype context.",
    feedsInto:
      "Radius/density interpretation, core radius, tectonics, and visual/material outputs.",
    caveat: "This is a bulk class, not a layered mineralogical model.",
    references: "See Science & Maths: rocky composition.",
  }),
  "Core Radius": structuredTip({
    overview: "Estimated core radius fraction.",
    drawnFrom: "Core Mass Fraction using an approximate CMF-to-CRF relation.",
    caveat: "Layered equation-of-state details are simplified.",
    references: "Zeng & Jacobsen 2017; see Science & Maths: rocky composition.",
  }),
  "Exposed Land": structuredTip({
    overview: "Estimated unflooded surface fraction after inferred basin fill.",
    drawnFrom: "Inferred ocean coverage and basin capacity context.",
    feedsInto: "Carbon-cycle, productivity, climate, and visual auto coverage.",
    caveat: "This is a global fraction, not a coastline map.",
    references: "See Science & Maths: inferred ocean coverage.",
  }),
  "Coverage Confidence": structuredTip({
    overview: "Confidence label for inferred ocean/land split.",
    drawnFrom: "Mass, radius, water inventory, climate, pressure, and relief-context availability.",
    interpretAs: "Lower confidence means fallback assumptions carried more of the estimate.",
    caveat: "It is a pathway confidence label, not a measured uncertainty interval.",
    references: "See Science & Maths: inferred ocean coverage.",
  }),
  "Mean Ocean Depth": structuredTip({
    overview: "Estimated average liquid surface-ocean depth.",
    drawnFrom: "Liquid water inventory divided by inferred liquid-ocean coverage.",
    caveat: "It is a global estimate, not bathymetry.",
    references: "See Science & Maths: inferred ocean coverage.",
  }),
  "Surface State": structuredTip({
    overview: "High-level rocky surface thermal class.",
    drawnFrom: "Surface temperature and silicate-melt thresholds.",
    interpretAs: "Flags standard rocky, lava-world, and magma-ocean regimes.",
    caveat: "It does not simulate lava flow geography or crustal recycling.",
    references: "See Science & Maths: rocky surface states.",
  }),
  "UV Shielding": structuredTip({
    overview: "Estimated surface-UV protection.",
    drawnFrom: "Ozone/oxygen context, atmospheric pressure, and host XUV/UV environment.",
    feedsInto: "Habitability and prebiotic UV interpretation.",
    caveat: "This is a shielding diagnostic, not a photochemical column model.",
    references: "See Science & Maths: UV shielding.",
  }),
  "Prebiotic UV Window": structuredTip({
    overview: "Surface-accessible 200-280 nm UV window for prebiotic chemistry.",
    drawnFrom:
      "Host UV supply, atmosphere shielding, haze attenuation, and surface-liquid context.",
    caveat: "This is not a life or habitability-success verdict.",
    references: "See Science & Maths: prebiotic UV.",
  }),
  "Prebiotic UV Flux": structuredTip({
    overview: "Estimated 200-280 nm UV flux after atmospheric attenuation.",
    drawnFrom: "Star-page UV supply and planet atmosphere/haze shielding.",
    caveat: "Flare-driven UV from cool active stars is not explicitly solved.",
    references: "See Science & Maths: prebiotic UV.",
  }),
  "Environment Forcing": structuredTip({
    overview: "Canonical host-frame forcing used by the body solver.",
    drawnFrom:
      "Bolometric light, XUV, UV, stellar wind, companion flux, and eccentric-orbit context.",
    feedsInto: "Climate, atmosphere, radiation, and habitability outputs.",
    caveat: "It is a bounded forcing context, not full time-dependent irradiation integration.",
    references: "See Science & Maths: environment forcing.",
  }),
  "Coupled Climate Tendency": structuredTip({
    overview: "Second-pass climate tendency from coupled atmosphere/chemistry context.",
    drawnFrom:
      "Haze, methane, aerosols, clouds, water vapour, and CO2 weathering/outgassing diagnostics.",
    caveat:
      "It is bounded and diagnostic; baseline temperature is preserved unless confidence gates pass.",
    references: "See Science & Maths: coupled climate tendency.",
  }),
  "Photochemical Forcing": structuredTip({
    overview: "Temperature tendency from photochemical haze and gas context.",
    drawnFrom: "Methane, UV, sulfur aerosols, haze likelihood, and atmosphere state.",
    caveat: "It is not a full photochemical model.",
    references: "See Science & Maths: photochemical forcing.",
  }),
  "Atmosphere Evolution": structuredTip({
    overview: "Source/sink tendency for the current atmosphere.",
    drawnFrom: "Pressure, escape, retained volatiles, source terms, and carbon-cycle context.",
    caveat: "This is not a reservoir time integration and never rewrites manual atmosphere inputs.",
    references: "See Science & Maths: atmosphere evolution.",
  }),
  "Carbon Cycle": structuredTip({
    overview: "Carbonate-silicate regulation tendency context.",
    drawnFrom: "Exposed land, liquid water, CO2, volcanic supply, and tectonic recycling.",
    caveat: "It is a regulation tendency, not a solved CO2 history.",
    references: "See Science & Maths: carbon cycle.",
  }),
  "Weathering Efficiency": structuredTip({
    overview: "Relative CO2 drawdown strength from exposed rock and limited seafloor weathering.",
    drawnFrom: "Exposed land, water access, climate, pressure, and high-pressure ice context.",
    caveat: "Local soils, runoff, biology, and erosion networks are not simulated.",
    references: "See Science & Maths: weathering and carbon cycle.",
  }),
  "Volcanic Supply": structuredTip({
    overview: "Relative carbon/outgassing source-side supply.",
    drawnFrom: "Volcanism, tectonic regime, internal heat, and recycling context.",
    caveat: "It is a source tendency, not an eruption or gas-flux chronology.",
    references: "See Science & Maths: carbon cycle.",
  }),
  "Ocean Chemistry": structuredTip({
    overview: "Qualitative ocean-chemistry context.",
    drawnFrom:
      "Water inventory, CO2 pressure, carbonate buffering, salinity/ammonia context, and rock-ocean access.",
    caveat: "It is not an exact pH, salinity, circulation, or biogeochemistry model.",
    references: "See Science & Maths: ocean chemistry.",
  }),
  "Carbonate Saturation": structuredTip({
    overview: "Whether water/CO2/rock context supports carbonate buffering.",
    drawnFrom: "CO2, water, weathering, rock-ocean exchange, and high-pressure ice context.",
    caveat: "This is a saturation class, not a solved ocean pH model.",
    references: "See Science & Maths: ocean chemistry.",
  }),
  "Nutrient Support": structuredTip({
    overview: "Qualitative support for ocean nutrients and hydrothermal access.",
    drawnFrom: "Rock-ocean exchange, internal heat, water state, and chemistry context.",
    caveat: "Nutrient cycling and biology are not simulated.",
    references: "See Science & Maths: ocean chemistry and habitability.",
  }),
});
