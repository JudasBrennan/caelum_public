export const CONTEXT_SCIENCE_REGISTRY = Object.freeze({
  surfaceClimate: {
    key: "surfaceClimate",
    label: "Surface climate context",
    formulaName: "Koppen-like climate zones with first-order heat redistribution",
    sourceSummary:
      "Koppen-Geiger classes follow Peel et al. 2007; latitudinal heat redistribution follows the first-order energy-balance framing used in planetary climate texts.",
    sourceUrls: [
      "https://hess.copernicus.org/articles/11/1633/2007/",
      "https://www.cambridge.org/core/books/principles-of-planetary-climate/",
    ],
    assumptions:
      "Procedural climate bands are not a GCM. Clouds, haze, and chemistry are diagnostic modifiers, not solved circulation.",
    validInputRange:
      "Rocky bodies with surface pressure, temperature, water state, gravity, and rotation/lock context.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "Does not resolve geography, ocean circulation, topography, cloud microphysics, or seasonal orbital phase.",
  },
  surfaceOceanCoverage: {
    key: "surfaceOceanCoverage",
    label: "Surface ocean coverage and hypsometry context",
    formulaName: "Earth-calibrated basin-capacity and hypsometry coverage proxy",
    sourceSummary:
      "Earth's observed 71% ocean coverage is a surface-area constraint, not a direct water-mass-fraction output. The planned context will infer surface ocean coverage from water inventory, planet size, gravity, climate state, and a bounded Earth-hypsometry basin-capacity proxy.",
    sourceUrls: [
      "https://spaceplace.nasa.gov/water/",
      "https://ssd.jpl.nasa.gov/planets/phys_par.html",
      "https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO1/tiled/",
      "https://www.ncei.noaa.gov/sites/default/files/2023-01/Hypsographic%20Curve%20of%20Earth%E2%80%99s%20Surface%20from%20ETOPO1.pdf",
      "https://doi.org/10.1088/0004-637X/781/1/27",
      "https://doi.org/10.1016/j.epsl.2024.119071",
    ],
    assumptions:
      "Outputs will be global coverage diagnostics. Hypsometry is represented by a compact Earth-calibrated basin-fill proxy, not a topographic map, mantle water-cycle solver, or plate-tectonic terrain generator.",
    validInputRange:
      "Rocky planets with mass, radius, gravity or mass-radius gravity inference, water mass fraction, climate state, surface temperature, pressure, and tectonic or geodynamic context.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "No exact continent/ocean geography, dynamic sea level, crustal thickness model, erosion/sedimentation cycle, mantle water partitioning, or regional bathymetry is solved.",
  },
  coupledClimatePass: {
    key: "coupledClimatePass",
    label: "Coupled climate second pass",
    formulaName: "Confidence-gated single-pass climate chemistry and hydrosphere coupling",
    sourceSummary:
      "Uses existing greenhouse, haze, cloud, water-vapor, and hydrosphere diagnostics as a bounded second pass. Habitable-zone and greenhouse limits follow Kopparapu et al.; slow-rotator cloud feedback is caveated by Yang et al.; Solar System pressure/temperature anchors come from NASA fact sheets.",
    sourceUrls: [
      "https://doi.org/10.1088/0004-637X/765/2/131",
      "https://doi.org/10.1088/2041-8205/771/2/L45",
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
    ],
    assumptions:
      "The pass is a single bounded update of dependent contexts, not an iterative GCM, photochemistry, or atmospheric reservoir solve.",
    validInputRange:
      "Rocky planets and major moons with baseline surface temperature, atmosphere pressure/composition, hydrosphere, cloud/chemistry forcing, and confidence metadata.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "Does not solve cloud microphysics, circulation, ocean transport, evolving CO2 reservoirs, or climate hysteresis.",
  },
  atmosphereEvolution: {
    key: "atmosphereEvolution",
    label: "Atmosphere evolution tendency context",
    formulaName: "Bounded atmosphere source/sink and volatile-loss tendency screen",
    sourceSummary:
      "Atmosphere persistence is inferred from current pressure, escape/source terms, stellar-environment forcing, and carbon-cycle weathering. Solar System pressure/temperature anchors come from NASA fact sheets; escape framing follows Zahnle and Catling; M-dwarf water-loss and abiotic oxygen caution follows Luger and Barnes.",
    sourceUrls: [
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
      "https://doi.org/10.3847/1538-4357/aa7846",
      "https://doi.org/10.1089/ast.2014.1231",
    ],
    assumptions:
      "Outputs are tendency and lifetime classes only. The model does not integrate reservoirs, isotopes, impact chronology, atmospheric chemistry, or exact escape rates over time.",
    validInputRange:
      "Rocky planets and major moons with atmosphere pressure/composition, source/sink ledger, escape or stellar-forcing context, hydrosphere, and carbon-cycle diagnostics.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No coupled atmospheric evolution integration, no magma-ocean outgassing history, no photochemical network, and no exact volatile inventory reconstruction.",
  },
  stellarHistoryDose: {
    key: "stellarHistoryDose",
    label: "Stellar-history dose context",
    formulaName: "Bounded saturated-XUV and wind-history fluence risk screen",
    sourceSummary:
      "Long-lived high XUV around low-mass stars and pre-main-sequence water-loss/abiotic-oxygen caution follow Luger and Barnes. Atmospheric escape framing follows Zahnle and Catling, with Solar System pressure and gravity anchors from NASA fact sheets.",
    sourceUrls: [
      "https://doi.org/10.1089/ast.2014.1231",
      "https://doi.org/10.3847/1538-4357/aa7846",
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
    ],
    assumptions:
      "Outputs are relative dose and risk classes. The model does not solve stellar evolution tracks, hydrodynamic escape, ocean inventories, or photochemical oxygen reservoirs.",
    validInputRange:
      "Rocky planets and major moons with host-star mass/age, orbit, current XUV/wind forcing, escape/gravity, pressure, and hydrosphere context.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "M-dwarf and evolved-star histories are especially uncertain; unsupported evolution modes produce caveats rather than precise water-loss amounts.",
  },
  planetRadiationEnvironment: {
    key: "planetRadiationEnvironment",
    label: "Rocky planet radiation environment context",
    formulaName: "Atmosphere, ozone, magnetosphere, XUV, and wind shielding screen",
    sourceSummary:
      "Charged-particle shielding follows NASA magnetosphere/aurora framing; atmosphere and ozone shielding follow NASA ozone/UV explanations; Earth, Mars, Mercury, and Venus calibration bounds use NASA planetary fact sheets.",
    sourceUrls: [
      "https://science.nasa.gov/science-research/earth-science/earths-magnetosphere-protecting-our-planet-from-harmful-space-energy/",
      "https://ozonewatch.gsfc.nasa.gov/",
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
    ],
    assumptions:
      "The context distinguishes UV shielding from charged-particle shielding. It is a comparative hazard screen, not a particle transport, radiation chemistry, or biological dose model.",
    validInputRange:
      "Rocky planets with host-star high-energy forcing, atmosphere pressure/composition, photochemical ozone/UV proxy, magnetosphere context, gravity/escape velocity, and hydrosphere/ice context.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No spectral UV transfer, cosmic-ray transport, flare statistics, atmospheric chemistry network, or exact radiation dose in rem/day is solved for rocky planets.",
  },
  co2ClimateTendency: {
    key: "co2ClimateTendency",
    label: "CO2 climate tendency context",
    formulaName: "Carbonate-silicate drawdown and outgassing climate-tendency proxy",
    sourceSummary:
      "Carbonate-silicate weathering/outgassing feedback follows the bounded framing of Walker, Hays, and Kasting, with Venus/Earth/Mars calibration guarded by NASA fact-sheet pressure and temperature anchors.",
    sourceUrls: [
      "https://doi.org/10.1029/JC086iC10p09776",
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
    ],
    assumptions:
      "CO2 tendency is a bounded climate adjustment and weathering sink confidence cue. It does not mutate atmospheric composition or solve carbonate, mantle, or ocean reservoirs.",
    validInputRange:
      "Rocky planets and major moons with pressure, CO2 partial pressure, hydrosphere exposure, carbon-cycle context, geology/outgassing support, temperature, and climate state.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "No exact pCO2 evolution, ocean alkalinity reservoir, land-area weathering law, silicate mineralogy, plate-history solve, or hysteresis loop.",
  },
  orbitalEpoch: {
    key: "orbitalEpoch",
    label: "Orbital epoch context",
    formulaName: "Keplerian two-body orbital phase approximation",
    sourceSummary:
      "Uses standard Keplerian period/phase geometry. Eclipse confidence follows NASA eclipse-season geometry: alignment depends on phase and the Moon crossing the orbital plane near nodes.",
    sourceUrls: ["https://eclipse.gsfc.nasa.gov/SEhelp/moonorbit.html"],
    assumptions:
      "No N-body integration, apsidal precession, nodal precession, or stored longitude of node unless supplied by future inputs.",
    validInputRange:
      "Low-to-moderate eccentricity orbits with approximate period and semi-major axis.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "Exact eclipse and transit schedules require node, inclination, argument of periapsis, observer latitude, and epoch data.",
  },
  observerFrame: {
    key: "observerFrame",
    label: "Observer reference frame context",
    formulaName: "Planet-local and moon-local reference-frame resolver",
    sourceSummary:
      "Moon observer calendars distinguish host-star years, local spin/solar days, and synodic phase cycles; synchronously rotating moons keep the parent near-fixed in longitude while illumination changes with star-parent-moon geometry.",
    sourceUrls: [
      "https://www.lpi.usra.edu/education/skytellers/moon-phases/",
      "https://doi.org/10.1089/ast.2012.0859",
    ],
    assumptions:
      "Moon-local frames are first-order observer frames. Surface latitude/longitude, libration, and full ephemerides are not solved.",
    validInputRange:
      "Planets and major moons with radius, host-star orbit, parent orbit, rotation/spin state, and synodic period context.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "Exact local sky paths and calendars require site coordinates, reference epochs, and phase-resolved orbital elements.",
  },
  eclipseTiming: {
    key: "eclipseTiming",
    label: "Moon eclipse and transit timing readiness",
    formulaName: "Angular-radius and node/epoch readiness screen",
    sourceSummary:
      "Eclipse possibility is geometric, but eclipse timing requires phase plus alignment near orbital nodes.",
    sourceUrls: [
      "https://eclipse.gsfc.nasa.gov/SEhelp/moonorbit.html",
      "https://doi.org/10.1089/ast.2012.0859",
    ],
    assumptions:
      "Outputs are readiness and likelihood classes unless node, epoch, periods, radii, and inclinations are provided.",
    validInputRange:
      "Moon observers with parent radius, moon orbit, host-star radius/distance, inclination, and optional node/epoch data.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No exact eclipse dates, durations, or surface visibility maps without a full ephemeris and observer location.",
  },
  moonOrientation: {
    key: "moonOrientation",
    label: "Moon orientation and long-cycle dynamics",
    formulaName: "Laplace-radius regime and J2 precession proxy",
    sourceSummary:
      "Laplace-plane and Cassini-state behaviour depends on parent oblateness, stellar perturbations, moon orbit, and spin-axis state.",
    sourceUrls: [
      "https://doi.org/10.1088/0004-6256/137/3/3706",
      "https://doi.org/10.1086/421788",
      "https://science.nasa.gov/earth/climate-change/milankovitch-orbital-cycles-and-their-role-in-earths-climate/",
    ],
    assumptions:
      "Laplace radius and J2 precession are qualitative guards. Cassini-state output is readiness guidance without moments of inertia and spin-axis integration.",
    validInputRange:
      "Regular moons with parent mass/radius/J2, host-star mass, parent orbit, moon orbit, and optional spin/obliquity inputs.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "Does not solve coupled secular evolution, tidal damping, chaotic spin states, or climate impacts of precession.",
  },
  longTermDynamics: {
    key: "longTermDynamics",
    label: "Long-term dynamical history context",
    formulaName: "Shared secular, precession, migration, and Trojan evidence aggregator",
    sourceSummary:
      "Long-term dynamical interpretation combines bounded secular susceptibility, precession readiness, migration evidence, and Trojan reservoir diagnostics without solving N-body history.",
    sourceUrls: [
      "https://www.solarsystemdynamics.info/",
      "https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/",
    ],
    assumptions:
      "Outputs are diagnostic summaries and evidence classes. They do not rewrite authored orbits or reconstruct exact past evolution.",
    validInputRange:
      "Systems with host-frame architecture, body masses/orbits, spin/orientation inputs, small-body context, and optional resonance/migration evidence.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No N-body integration, exact ephemeris, exact migration reconstruction, or climate-cycle integration.",
  },
  dynamicalVariability: {
    key: "dynamicalVariability",
    label: "Long-cycle dynamical variability context",
    formulaName:
      "Bounded eccentricity, obliquity, secular, and migration variability warning screen",
    sourceSummary:
      "Kozai-Lidov susceptibility follows the hierarchical inclination caveats summarized by Naoz. Climate-cycle language is bounded by NASA Milankovitch framing, and migration evidence remains non-unique following planet-disk migration reviews.",
    sourceUrls: [
      "https://ui.adsabs.harvard.edu/abs/2016ARA%26A..54..441N/abstract",
      "https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/",
      "https://ui.adsabs.harvard.edu/abs/2012ARA%26A..50..211K/abstract",
    ],
    assumptions:
      "Outputs are variability warnings and persistence caveats only. Authored orbital elements, obliquity, climate bands, and generation slots are never changed by this context.",
    validInputRange:
      "Bodies with eccentricity, inclination, and at least one long-term dynamics context: secular/Kozai-Lidov, precession, Cassini-state, moon orientation, or migration-history evidence.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No N-body integration, no Milankovitch climate model, no spin-axis evolution, no exact Kozai cycle amplitude, and no unique migration reconstruction.",
  },
  secularDynamics: {
    key: "secularDynamics",
    label: "Secular and Kozai-Lidov dynamics context",
    formulaName: "Hierarchical Kozai-Lidov susceptibility and timescale screen",
    sourceSummary:
      "Kozai-Lidov cycles require hierarchical perturbers and sufficiently high mutual inclination; quadrupole timescales and octupole relevance are only bounded diagnostics here.",
    sourceUrls: [
      "https://ui.adsabs.harvard.edu/abs/2016ARA%26A..54..441N/abstract",
      "https://www.solarsystemdynamics.info/",
    ],
    assumptions:
      "The context classifies susceptibility and timescale order. It does not integrate eccentricity/inclination cycles.",
    validInputRange:
      "Hierarchical or potentially hierarchical systems with semi-major axes, periods, masses, eccentricities, and mutual inclination.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "Missing mutual inclination, node/periapsis angles, non-hierarchical architecture, or age data reduce confidence.",
  },
  precession: {
    key: "precession",
    label: "Orbital and spin precession context",
    formulaName: "J2 nodal/apsidal and relativistic periapsis precession proxies",
    sourceSummary:
      "Oblateness-driven nodal/apsidal precession and relativistic periapsis precession are useful long-cycle diagnostics, but coupled secular dynamics require fuller integrations.",
    sourceUrls: [
      "https://www.solarsystemdynamics.info/",
      "https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/",
    ],
    assumptions:
      "J2 and GR terms are first-order diagnostics. Calendar, climate, and apparent-sky calculations are not changed by these proxies.",
    validInputRange:
      "Bodies with central mass, semi-major axis, eccentricity, and optional central J2/radius, spin, obliquity, and moment of inertia.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "No coupled secular solution, spin-axis integration, exact seasons, or ephemeris propagation.",
  },
  cassiniState: {
    key: "cassiniState",
    label: "Cassini-state and obliquity readiness context",
    formulaName: "Spin-axis/orbit-precession equilibrium readiness screen",
    sourceSummary:
      "Cassini states require coupling spin-axis precession, orbit-plane precession, obliquity, inclination, and dissipation history.",
    sourceUrls: [
      "https://ui.adsabs.harvard.edu/abs/2004AJ....128.2501W",
      "https://doi.org/10.1086/421788",
    ],
    assumptions:
      "Outputs are readiness, scenario, and equilibrium-residual diagnostics unless all required spin/orbit inputs exist.",
    validInputRange:
      "Planets and moons with spin-axis precession, orbital-plane precession, obliquity, inclination to reference plane, spin period, and moment factor.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No tidal capture history, chaotic spin evolution, obliquity tide feedback, or exact named Cassini-state assignment without a parameter-ready solve.",
  },
  migrationHistory: {
    key: "migrationHistory",
    label: "Planetary migration-history evidence context",
    formulaName:
      "Non-unique evidence classes for disk migration, scattering, Grand Tack, and Nice-style histories",
    sourceSummary:
      "Planet migration can be driven by disk torques, resonance capture, scattering, and giant-planet resonance crossing; current architecture provides evidence but not a unique history.",
    sourceUrls: [
      "https://ui.adsabs.harvard.edu/abs/2012ARA%26A..50..211K/abstract",
      "https://www.nature.com/articles/nature10201",
      "https://pubmed.ncbi.nlm.nih.gov/15917800/",
    ],
    assumptions:
      "Outputs say evidence is consistent with a scenario. They do not assert that the scenario happened.",
    validInputRange:
      "Systems with current orbits, masses, snow-line context, giant planets, resonances, debris/small-body mixing, and composition evidence.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No gas-disk simulation, scattering integration, population synthesis, or unique reconstruction of formation location.",
  },
  trojanPopulation: {
    key: "trojanPopulation",
    label: "Trojan reservoir context",
    formulaName:
      "L4/L5 mass-ratio stability plus eccentricity, inclination, perturbation, and supply screen",
    sourceSummary:
      "Triangular Lagrange points are linearly stable below the Routh/Gascheau mass-ratio threshold, but populated Trojan reservoirs also require long-lived phase space and source/capture history.",
    sourceUrls: [
      "https://science.nasa.gov/resource/what-is-a-lagrange-point/",
      "https://www-n.oca.eu/morby/papers/Rev39.pdf",
      "https://ui.adsabs.harvard.edu/abs/2005CeMDA..92...19D",
    ],
    assumptions:
      "Stable L4/L5 points do not guarantee a populated Trojan swarm. Outputs are reservoir likelihood classes only.",
    validInputRange:
      "Star/body or primary/secondary pairs with masses, eccentricity, inclination, perturbation context, debris/supply context, and snow-line context.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No Trojan orbit integration, no generated Trojan objects, no collisional evolution, and no L4/L5 asymmetry solve.",
  },
  geodynamics: {
    key: "geodynamics",
    label: "Geodynamics context",
    formulaName: "Heat-flow and mantle-convection proxy classes",
    sourceSummary:
      "Uses mantle-convection Rayleigh-number concepts and water/temperature effects on viscosity as qualitative bounds for tectonic regime support.",
    sourceUrls: ["https://doi.org/10.1029/2000JB900200", "https://doi.org/10.1086/430652"],
    assumptions:
      "Mantle viscosity and Rayleigh number are proxy classes unless a calibrated interior model is added.",
    validInputRange:
      "Rocky planets and major moons with mass, gravity, heat flux, water state, climate, and composition context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "Does not prove plate tectonics; stagnant-lid and episodic regimes remain plausible.",
  },
  interiorEvolution: {
    key: "interiorEvolution",
    label: "Interior evolution and dynamo lifetime context",
    formulaName: "Bounded heat-retention, core-cooling, volcanic-longevity, and recycling screen",
    sourceSummary:
      "Terrestrial interior, mantle, and core-climate coupling follows peer-reviewed whole-planet and thermal-evolution framing; Earth, Mars, Mercury, and Io calibration use NASA Solar System anchors.",
    sourceUrls: [
      "https://doi.org/10.1002/2015GL064751",
      "https://doi.org/10.1007/s11214-010-9685-1",
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
      "https://science.nasa.gov/jupiter/moons/io/facts/",
    ],
    assumptions:
      "Outputs are support classes and confidence cues for current interior context. They do not integrate mantle convection, core entropy, mineral phase history, or exact dynamo onset/cessation.",
    validInputRange:
      "Rocky planets and major moons with mass, radius, density, age, radiogenic and tidal heat flux, core-mass fraction proxy, hydrosphere, surface temperature, and tectonic or geology context.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "Mercury-like weak dynamos, Mars-like early dynamos, and tidally heated moons remain class-level analogs. No named-body hard-coding, full mantle model, or magnetic-field-strength rewrite is performed.",
  },
  impactEnvironment: {
    key: "impactEnvironment",
    label: "Impact environment context",
    formulaName: "Qualitative impact-flux and crater-retention synthesis",
    sourceSummary:
      "Crater density as a relative surface-age indicator is standard planetary geology; retention depends on bombardment, atmosphere, erosion, volcanism, and tectonic resurfacing.",
    sourceUrls: [
      "https://science.nasa.gov/moon/lunar-surface/",
      "https://www.lpi.usra.edu/publications/books/craterbook/",
    ],
    assumptions:
      "Impact flux is class-based. This is not crater-count dating or an integrated bombardment chronology.",
    validInputRange:
      "Bodies with surface gravity, atmosphere, age, geologic activity, and debris/Oort/comet context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "Does not model impactor size-frequency distributions, impact velocities, or stochastic late heavy bombardment histories.",
  },
  smallBodyReservoir: {
    key: "smallBodyReservoir",
    label: "Small-body reservoir context",
    formulaName: "Debris, comet, and Oort-cloud source routing for impact and volatile context",
    sourceSummary:
      "Oort-cloud and comet framing follows NASA summaries; crater preservation and relative surface-age interpretation follow NASA/LPI lunar-cratering references; debris-disk dust context follows the steady-state collisional-evolution framing of Wyatt et al.",
    sourceUrls: [
      "https://science.nasa.gov/solar-system/oort-cloud/facts/",
      "https://science.nasa.gov/solar-system/comets/",
      "https://science.nasa.gov/moon/lunar-craters/",
      "https://science.nasa.gov/moon/lunar-craters/why-study-craters/",
      "https://www.lpi.usra.edu/publications/books/craterbook/",
      "https://ui.adsabs.harvard.edu/abs/2007ApJ...663..365W",
    ],
    assumptions:
      "Reservoir outputs are source and tendency classes. The model does not date surfaces, integrate impactor populations, or guarantee volatile retention.",
    validInputRange:
      "Systems with host-frame scoped debris disks, Oort-cloud resolved model, authored comets, gas-giant architecture, and age.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No stochastic impact chronology, impactor size-frequency distribution, volatile isotope model, or dynamical scattering integration.",
  },
  productivity: {
    key: "productivity",
    label: "Primary productivity potential",
    formulaName: "Environmental productivity limiting-factor screen",
    sourceSummary:
      "Primary productivity is limited by light, temperature, liquid solvent, nutrients, circulation, and radiation. Exoplanet biosignature interpretation must separate environmental support from life claims.",
    sourceUrls: ["https://doi.org/10.1089/ast.2017.1723", "https://doi.org/10.1089/ast.2018.1936"],
    assumptions:
      "Estimates potential only; it does not assert biology, ecology, vegetation, or biosignature presence.",
    validInputRange:
      "Bodies with surface climate, hydrosphere, radiation, atmosphere, light, and nutrient context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "No ecosystem model, nutrient cycling model, or evolutionary history is solved.",
  },
  nitrogenCycle: {
    key: "nitrogenCycle",
    label: "Nitrogen reservoir and nutrient context",
    formulaName: "N2 pressure-buffer, broadening, and fixed-nitrogen limitation screen",
    sourceSummary:
      "Atmospheric N2 is treated as a background gas and pressure broadener following early-Earth greenhouse studies, while fixed nitrogen is treated as a productivity limiter rather than a life claim. Earth/Titan calibration uses NASA fact sheets to keep N2-rich worlds from being interpreted as automatically Earth-like.",
    sourceUrls: [
      "https://doi.org/10.1038/ngeo692",
      "https://doi.org/10.1146/annurev.ecolsys.28.1.59",
      "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html",
      "https://science.nasa.gov/saturn/moons/titan/facts/",
    ],
    assumptions:
      "Outputs are reservoir, pressure-support, and nutrient-availability classes. N2 abundance is never treated as evidence for biology or an automatic Earth-like nitrogen cycle.",
    validInputRange:
      "Rocky planets and major moons with surface pressure, N2 fraction or partial pressure, temperature, hydrosphere, atmosphere-evolution, and geology or outgassing context.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No biological nitrogen fixation, exact lightning chemistry, isotope cycle, sediment reservoir, denitrification, or coupled atmospheric-ocean nitrogen budget is solved.",
  },
  ringMagnetosphere: {
    key: "ringMagnetosphere",
    label: "Ring and magnetosphere visibility context",
    formulaName: "Roche-zone, ring-source, magnetopause, and aurora screen",
    sourceSummary:
      "Rings are bounded by Roche disruption and sculpted by source moons/resonances; aurora require charged particles guided by magnetic fields into an atmosphere.",
    sourceUrls: [
      "https://science.nasa.gov/saturn/rings/",
      "https://science.nasa.gov/earth/auroras/",
    ],
    assumptions:
      "Ring gaps, ring lifetime, radiation belts, and aurora visibility are class diagnostics, not plasma simulations.",
    validInputRange:
      "Bodies with Roche/ring outputs, source moons, magnetic field, stellar wind, atmosphere, and parent plasma context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "No detailed magnetohydrodynamics, dust evolution, or ring particle dynamics.",
  },
  gasGiantMoonInfluenceSummary: {
    key: "gasGiantMoonInfluenceSummary",
    label: "Solved moon plasma-source influence summary",
    formulaName:
      "Bounded volcanic, cryovolcanic, atmospheric escape, and sputtering plasma-source screen",
    sourceSummary:
      "Io-like volcanic moons can supply heavy ions to a parent plasma torus, while Enceladus-like plume activity supplies neutral and plasma material to Saturn's magnetosphere. This context summarizes solved moon outputs into parent magnetosphere loading classes.",
    sourceUrls: [
      "https://science.nasa.gov/jupiter/moons/io/facts/",
      "https://science.nasa.gov/saturn/moons/enceladus/facts/",
      "https://doi.org/10.1146/annurev.astro.45.051806.110547",
      "https://doi.org/10.1126/science.1120985",
    ],
    assumptions:
      "Solved moon contexts are used only as source/loading classes. Parent magnetopause and aurora outputs remain bounded diagnostics, not plasma transport or MHD simulations.",
    validInputRange:
      "Solved regular moon models with tidal heating, geology/resurfacing, atmosphere, radiation, and parent-magnetosphere membership context.",
    outputKind: "qualitative",
    calibrationRequired: true,
    knownLimitations:
      "No neutral cloud chemistry, pickup-ion transport, plasma mass-loading rate, magnetodisk current system, or time-variable plume/volcano model is solved.",
  },
  icyMoonExosphere: {
    key: "icyMoonExosphere",
    label: "Icy moon sputtered oxygen exosphere",
    formulaName: "Europa-calibrated radiolysis, sputtering, and pickup-ion exosphere proxy",
    sourceSummary:
      "Europa's water-ice surface is dissociated by magnetospheric particles into H2 and O2; Juno/JADE pickup-ion measurements constrain Europa O2 production near 12 kg/s, while Hubble/Nature observations establish an extremely tenuous abiotic O2 atmosphere.",
    sourceUrls: [
      "https://science.nasa.gov/mission/europa-clipper/why-europa-ingredients-for-life/",
      "https://www.nasa.gov/missions/juno/nasas-juno-mission-measures-oxygen-production-at-europa/",
      "https://www.nature.com/articles/s41550-024-02206-x",
      "https://doi.org/10.1038/373677a0",
      "https://doi.org/10.1016/j.icarus.2016.10.027",
    ],
    assumptions:
      "Outputs are global support classes and broad O2 production estimates only. Exosphere O2 is abiotic, exosphere-only, and never added to retained pressure, greenhouse warming, breathability, or life confidence.",
    validInputRange:
      "Airless or exosphere-pressure icy moons with exposed water ice, parent-magnetosphere particle context, radius, temperature, and hydrosphere state.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "No MHD or plasma transport, no neutral column-density map, no sputtering-yield chemistry network, no local leading/trailing hemisphere structure, and no plume time variability.",
  },
  secularStress: {
    key: "secularStress",
    label: "Secular dynamics and moon stress context",
    formulaName: "Qualitative Kozai/secular susceptibility and tidal-stress morphology",
    sourceSummary:
      "Kozai-Lidov cycles require inclined hierarchical orbits; tidal stress morphology is inferred from tidal heating, eccentricity forcing, composition, and resurfacing analogs.",
    sourceUrls: [
      "https://doi.org/10.1146/annurev-astro-081913-035941",
      "https://doi.org/10.1146/annurev.earth.35.031306.140126",
    ],
    assumptions:
      "Outputs are susceptibility and analog morphology, not long-term integration or stress-field mapping.",
    validInputRange:
      "Hierarchical systems and moons with inclination/eccentricity, tidal, composition, and geology context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "Missing node, periapsis, shell thickness, and interior rheology reduce confidence.",
  },
  observability: {
    key: "observability",
    label: "Observation difficulty context",
    formulaName: "Transit, radial-velocity, direct-imaging, and transmission detectability screen",
    sourceSummary:
      "Transit depth scales with radius ratio squared; RV semi-amplitude follows standard exoplanet detection equations; direct imaging depends on contrast and angular separation. Transmission readiness now also consumes scale height, clouds, haze, atmosphere persistence, stellar activity, and biosignature interpretation context.",
    sourceUrls: [
      "https://exoplanetarchive.ipac.caltech.edu/docs/poet_calculations.html",
      "https://science.nasa.gov/exoplanets/how-do-we-find-exoplanets/",
    ],
    assumptions:
      "Instrument outputs are classes unless a specific telescope/noise model is selected. Atmosphere persistence and stellar activity change interpretation/readiness classes, not the core transit or RV formulas.",
    validInputRange:
      "Bodies with host-star, orbit, radius/mass, atmosphere, cloud/haze, and distance assumptions.",
    outputKind: "semiQuantitative",
    calibrationRequired: true,
    knownLimitations:
      "No spectral retrieval, coronagraph model, cadence/noise model, target-star activity time series, or atmospheric retrieval degeneracy solve.",
  },
  radiusValleyBoundary: {
    key: "radiusValleyBoundary",
    label: "Radius-valley boundary context",
    formulaName: "Qualitative radius-gap period and irradiation screen",
    sourceSummary:
      "The super-Earth/sub-Neptune radius valley is a population-level feature tied to radius, period, irradiation, and atmospheric loss, not a deterministic single-planet label.",
    sourceUrls: [
      "https://doi.org/10.3847/1538-3881/aa80eb",
      "https://doi.org/10.1093/mnras/sty178",
    ],
    assumptions:
      "The context only explains whether a boundary-family interpretation is close-in and irradiation-relevant.",
    validInputRange:
      "Small planets or boundary-family bodies with radius plus orbital period, irradiation, or semi-major axis context.",
    outputKind: "qualitative",
    calibrationRequired: false,
    knownLimitations:
      "Does not infer formation history, atmospheric mass loss, or core/envelope composition for an individual planet.",
  },
});

export function getContextScienceRegistryEntry(key) {
  return CONTEXT_SCIENCE_REGISTRY[String(key || "")] || null;
}

export function listContextScienceRegistryEntries() {
  return Object.values(CONTEXT_SCIENCE_REGISTRY);
}
