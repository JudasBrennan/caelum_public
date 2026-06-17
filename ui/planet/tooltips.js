import { GAS_GIANT_RADIUS_MAX_RJ, GAS_GIANT_RADIUS_MIN_RJ } from "../store/gasGiantModel.js";

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
  "Host frame":
    "Choose which host frame this body orbits. In single-star systems there is only one choice. In binaries, changing the host frame changes the slot ladder, habitable-zone placement, companion heating, and the orbit-stability limit that the body is judged against.",
  "Orbital slot":
    "Assign this body to an available system slot. One body per slot within the selected host frame.",
  Name: "Set the body's display name used across tabs and exports.",
  Physical: "Core physical inputs that control the planet's bulk properties.",
  Mass: "Planet mass in Earth masses.\n\nTerrestrial planets: 0.1\u201310 MEarth.\nHabitable Earth-like planets: 0.1\u20133.5 MEarth.\n\nEarth = 1 MEarth = 5.972E24 kg",
  CMF: "Core Mass Fraction (CMF) \u2014 percentage of planetary mass in the iron core.\n\nBy default, auto-derived from the host star\u2019s metallicity [Fe/H] (Schulze et al. 2021, PSJ 2, 113). Use the \u2018auto\u2019 button to reset, or enter a manual value.\n\nMercury \u2248 70%\nVenus \u2248 32%\nEarth \u2248 32.5%\nMars \u2248 22%\nMoon \u2248 2%",
  WMF: "Water Mass Fraction (WMF) \u2014 percentage of planetary mass that is water or ice.\n\nHigher WMF inflates the radius, reduces bulk density, and deepens oceans.\n\nDry: < 0.01%\nShallow oceans: 0.01\u20130.1% (Earth ~0.02%)\nExtensive oceans: 0.1\u20131%\nGlobal ocean: 1\u201310% (no exposed land)\nDeep ocean: 10\u201330% (pressure-aware high-pressure ice caution depends on gravity, depth, and temperature)\nIce world: > 30%\n\nReference: Zeng & Sasselov (2016, ApJ 819, 127) three-layer interior model.",
  "H/He Envelope":
    "Hydrogen/helium envelope mass fraction. Values above about 0.1% move low-mass bodies toward mini-Neptune or ice-giant classification and route them through the volatile-envelope radius and escape model.",
  "Observed Radius":
    "Optional measured transit/photosphere radius in Earth radii. When blank, the volatile solver uses its modelled radius; when filled, detection and bulk-density outputs use the observed radius while still reporting the modelled radius separately.",
  "Axial Tilt":
    "Obliquity of the planet\u2019s rotational axis relative to the orbital plane (0\u2013180\u00b0).\n\n0\u201390\u00b0 = prograde spin. 90\u2013180\u00b0 = retrograde spin. Higher tilt produces more extreme seasons; 0\u00b0/180\u00b0 = no seasons.\n\nHabitable range: 0\u201345\u00b0.\n\nEarth = 23.5\u00b0",
  "Albedo (Bond)":
    "Fraction of incident stellar energy reflected by the planet (0\u20131).\n\n0 = perfect absorber. 1 = perfect reflector.\n\nMercury = 0.068\nVenus = 0.77\nEarth = 0.306\nMoon = 0.11\nMars = 0.25",
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
  "Atmospheric Pressure":
    "Sea-level atmospheric pressure in standard atmospheres.\n\nEarth = 1 atm.",
  "Oxygen (O2)":
    "Oxygen partial pressure. Habitable range: 0.16\u20130.5 atm.\n\nEarth \u2248 0.21 atm.",
  "Carbon Dioxide (CO2)":
    "Carbon dioxide partial pressure. Habitable limit: < 0.02 atm (optimal < 0.005 atm).\n\nEarth \u2248 0.0004 atm (420 ppm).",
  "Argon (Ar)": "Argon partial pressure. Habitable limit: < 1.6 atm.\n\nEarth \u2248 0.0094 atm.",
  "Atmospheric Escape":
    "Atmospheric escape analysis combining Jeans thermal escape with non-thermal processes (charge exchange, polar wind, ion pickup).\n\nComputes the Jeans escape parameter \u03BB for each gas species based on escape velocity and exobase temperature. For H\u2082 and He, enhanced thresholds account for non-thermal loss channels that operate on all warm terrestrial planets (T_exo > 100 K).\n\nWhen enabled, gases classified as \u2018Lost\u2019 are automatically zeroed before computing greenhouse effect, partial pressures, and density. The original composition inputs are preserved.\n\nExobase temperature includes a pressure-dependent XUV absorption term \u2014 thin atmospheres absorb less XUV.\n\nH\u2082: Retained \u03BB \u2265 18 | Marginal 9\u201318 | Lost < 9\nHe: Retained \u03BB \u2265 30 | Marginal 15\u201330 | Lost < 15\nOthers: Retained \u03BB \u2265 6 | Marginal 3\u20136 | Lost < 3",
  "Vegetation override":
    "Override the auto-calculated vegetation colours with manually chosen pale and deep hex values. In Auto mode, colours are derived from the star's spectrum, atmospheric pressure, insolation, and tidal lock status.",
  "Internal Heat":
    "Radioisotope abundance relative to Earth. Scales four geophysics formulas: volcanic activity, elastic lithosphere thickness, internal heat budget, and core solidification timescale.\n\nHigher abundance sustains volcanism longer, thins the lithosphere, and extends dynamo lifetime. Default is 1.0\u00d7 (Earth).",
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
  "Water Regime":
    "Surface water state derived from water mass fraction (WMF).\n\nDry: < 0.01% WMF\nShallow oceans: 0.01\u20130.1% WMF (Earth ~0.02%\u2014thin but widespread oceans)\nExtensive oceans: 0.1\u20131% WMF (deeper oceans, less exposed land)\nGlobal ocean: 1\u201310% WMF (no exposed land)\nDeep ocean: 10\u201330% WMF (high-pressure ice caution is pressure-first and gravity-aware)\nIce world: > 30% WMF",
  "Mean Ocean Depth":
    "Estimated average depth of the liquid surface ocean where substantial surface water is present.\n\nThis divides the planet's water inventory by the modeled liquid-ocean coverage, so it is a global estimate rather than a detailed bathymetry map.",
  "Climate State":
    "Global climate stability classification based on surface temperature and absorbed stellar flux.\n\nStable: normal climate regime.\nSnowball: global glaciation from ice-albedo feedback (T < 240 K with surface water).\nMoist greenhouse: stratospheric water vapour enables hydrogen escape, risking long-term ocean loss (T > 340 K).\nRunaway greenhouse: absorbed flux exceeds the outgoing radiation limit; surface water boils off (flux > 282 W/m\u00b2).\n\nDry worlds are always classified as Stable.\n\nReference: Goldblatt et al. (2013); Kasting (1988); Budyko (1969).",
  "Surface State":
    "High-level rocky-surface classification. Standard rocky worlds stay below silicate-melt thresholds. Lava worlds are hot enough for extensive molten surface regions, and magma-ocean worlds are hot enough for globally widespread silicate melt.",
  "Earth Similarity Index":
    "Earth Similarity Index (ESI) is a 0-1 Earth-likeness score based on radius, density, escape velocity, and average surface temperature.\n\n1.0 = Earth-like across those four inputs. Lower values indicate a less Earth-like rocky world.\n\nESI is not a direct habitability verdict.",
  "Habitability Index":
    "WorldSmith comparative habitability model for rocky worlds.\n\nThis is PHI-inspired, not a direct literature PHI implementation. The score depends on the selected solvent pathway and the active solvent-policy support for surface water, subsurface water, and alternative solvents.\n\nUse the expanded KPI details to see the current pathway, policy version, and term breakdown.",
  "UV Shielding":
    "Estimated surface-UV protection from the combined ozone column, atmospheric pressure support, and XUV environment. Shielded indicates an Earth-like to stronger photochemical UV screen, Partial indicates incomplete coverage, and Unshielded indicates weak protection.",
  "Prebiotic UV Window":
    "Surface-accessible 200-280 nm UV window for prebiotic starter chemistry.\n\nThis combines the host star's photospheric UV supply with atmospheric UV shielding, photochemical haze attenuation, and surface-liquid context. It is not a life, biosignature, or habitability-success verdict.",
  "Prebiotic UV Flux":
    "Estimated 200-280 nm UV flux after atmospheric attenuation, shown with the top-of-atmosphere value for context.\n\nThe stellar supply comes from the Star page stellar-environment model. It is a blackbody/photospheric estimate; flare-driven UV from cool active stars is not explicitly solved.",
  "Environment Forcing":
    "Canonical host-frame forcing used by the body solver: bolometric light, XUV, prebiotic UV, stellar wind, companion contributions, and flux variability. Eccentric-orbit means are retained for science checks while baseline at-orbit values keep existing climate outputs stable.",
  "Coupled Climate Tendency":
    "Phase 4 diagnostic showing how photochemical haze, methane, sulfur aerosols, and bounded feedbacks would tend to shift the climate label if the chemistry forcing were opted in. The baseline surface temperature is not changed.",
  "Photochemical Forcing":
    "Bounded diagnostic temperature delta from climate-chemistry coupling. Negative values usually mean organic haze or sulfur aerosol cooling; positive values usually mean methane greenhouse plus allowed water-vapour feedback.",
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
