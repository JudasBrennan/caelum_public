import{a as t,b as e,c as n,d as a,e as r,f as i,g as l,h as s}from"./chunk-L3XYPVN7.js";import"./chunk-VC46IEJQ.js";function c(o){return[i("The Zero-Age Main Sequence (ZAMS)",`<p>When a newly formed star finishes collapsing from its birth cloud
        and begins fusing hydrogen in its core, it arrives at what
        astronomers call the <strong>zero-age main sequence</strong>, or
        ZAMS. This is the star's starting position on the HR diagram.</p>
      <p>At the ZAMS, the star's properties \u2014 luminosity, radius, and
        temperature \u2014 are determined almost entirely by its mass (and to a
        lesser degree by the metals mixed into its gas).</p>
      ${l("Think of the ZAMS as the starting line of a race. Every star begins here, but how fast it runs and how long the race lasts depend on its mass.")}
      ${s("The ZAMS is the moment a star begins core hydrogen fusion. Its position on the HR diagram at this point is set by its mass and chemical composition.")}`,`<p>The ZAMS is defined as the point at which a contracting protostar
        reaches thermal equilibrium with core hydrogen ignition. ZAMS
        luminosity and radius are well-described by the analytic fits of
        Tout et al. (1996), which express ${e("L_{\\text{ZAMS}}")} and
        ${e("R_{\\text{ZAMS}}")} as rational functions of mass with
        coefficients that are polynomials in metallicity
        ${e("\\zeta = \\log_{10}(Z / 0.02)")}:</p>
      ${t("L_{\\text{ZAMS}} = \\frac{a_0 M^{5.5} + a_1 M^{11}}{a_2 + M^3 + a_3 M^5 + a_4 M^7 + a_5 M^8 + a_6 M^{9.5}}")}
      ${t("R_{\\text{ZAMS}} = \\frac{a_0 M^{2.5} + a_1 M^{6.5} + a_2 M^{11} + a_3 M^{19} + a_4 M^{19.5}}{a_5 + a_6 M^{2} + a_7 M^{8.5} + M^{18.5} + a_8 M^{19.5}}")}
      <p>where each ${e("a_i")} is a 4th-order polynomial in ${e("\\zeta")}.
        These fits reproduce detailed stellar models to within a few percent
        across the mass range 0.1--100 ${e("M_\\odot")} and metallicities
        ${e("10^{-4} \\le Z \\le 0.03")}.</p>
      ${n([["M","stellar mass (M_\\odot)"],["Z","metal mass fraction (Z_\\odot = 0.02 in SSE convention)"],["\\zeta","\\log_{10}(Z/0.02)"]])}
      ${a("Tout, Pols, Eggleton & Han (1996, MNRAS 281, 257)")}`,o),i("Main-Sequence Lifetime",`<p>How long a star lives on the main sequence depends overwhelmingly on
        its mass. Massive stars are far more luminous, so they burn through
        their hydrogen fuel at a prodigious rate and die young. Low-mass stars
        sip their fuel slowly and can shine for trillions of years.</p>
      ${r(["Star mass","Approx. MS lifetime"],[["0.1 M\\(_{\\odot}\\)","~3 trillion years"],["0.5 M\\(_{\\odot}\\)","~57 billion years"],["1.0 M\\(_{\\odot}\\) (Sun)","~10 billion years"],["2.0 M\\(_{\\odot}\\)","~1.8 billion years"],["10 M\\(_{\\odot}\\)","~30 million years"],["50 M\\(_{\\odot}\\)","~4 million years"]])}
      ${l("A big campfire burns out fast because it consumes its wood rapidly. A small candle, burning slowly, can last all night. Stars work the same way: the biggest ones exhaust their fuel in mere millions of years.")}
      ${s("Massive stars live short lives (millions of years); low-mass stars live enormously long ones (billions to trillions of years). The Sun, at 1 solar mass, has about 10 billion years on the main sequence.")}`,`<p>The main-sequence lifetime is closely related to the time to reach
        the base of the giant branch (${e("t_{\\text{BGB}}")}). Hurley,
        Pols & Tout (2000) provide an analytic fit:</p>
      ${t("t_{\\text{BGB}} = \\frac{a_0 + a_1 M^4 + a_2 M^{5.5} + M^7}{a_3 M^2 + a_4 M^7}\\;\\text{Myr}")}
      <p>where the coefficients ${e("a_i")} are polynomials in
        ${e("\\zeta = \\log_{10}(Z/0.02)")}. The main-sequence lifetime is
        approximately:</p>
      ${t("t_{\\text{MS}} \\approx 0.95\\,t_{\\text{BGB}}")}
      <p>For a quick approximation at solar metallicity:</p>
      ${t("t_{\\text{MS}} \\approx \\frac{10}{M^{2.5}}\\;\\text{Gyr}")}
      <p>This approximation captures the essential scaling but becomes less
        accurate at the extremes of the mass range, where the Hurley
        coefficients properly account for changes in opacity, convective
        efficiency, and nuclear burning pathways.</p>
      ${n([["t_{\\text{BGB}}","time to base of giant branch (Myr)"],["t_{\\text{MS}}","main-sequence lifetime"],["M","stellar mass (M_\\odot)"],["\\zeta","\\log_{10}(Z/0.02)"]])}
      ${a("Hurley, Pols & Tout (2000, MNRAS 315, 543), eq. 4")}`,o),i("Off the Main Sequence",`<p>When a star exhausts the hydrogen in its core, it can no longer
        sustain the fusion reactions that kept it in equilibrium. The core
        contracts and heats up, while a shell of hydrogen surrounding the
        core ignites and begins fusing.</p>
      <p>This shell burning dumps energy into the outer layers, causing them
        to expand and cool. The star swells dramatically, becoming a
        <strong>subgiant</strong> and then a <strong>red giant</strong>. Its
        surface temperature drops (it reddens), but its enormous size makes
        it far more luminous than it was on the main sequence.</p>
      ${s("When core hydrogen is exhausted, shell burning causes the star to expand into a giant. Its surface cools but its luminosity soars because of the vastly increased surface area.")}`,`<p>Post-main-sequence evolution proceeds through several phases:</p>
      <ul>
        <li><strong>Hertzsprung gap</strong> \u2014 rapid crossing from the main
            sequence to the giant branch as the hydrogen-exhausted core
            contracts on a thermal timescale. For intermediate-mass stars
            (${e("\\sim 2")}--${e("8\\,M_\\odot")}), this crossing is
            fast enough that few stars are observed here.</li>
        <li><strong>Red giant branch (RGB)</strong> \u2014 hydrogen shell burning
            drives steady luminosity increase and envelope expansion. The
            core becomes isothermal and electron-degenerate (for low-mass
            stars).</li>
        <li><strong>Helium flash / core He ignition</strong> \u2014 at the tip of
            the RGB, core temperatures reach ~10${e("^8")} K and helium
            ignites (explosively in degenerate cores of low-mass stars).</li>
      </ul>
      <p>Hurley et al. (2000) model the luminosity and radius evolution
        parametrically. On the main sequence, the fractional age
        ${e("\\tau = t / t_{\\text{MS}}")} governs the departure from ZAMS
        values:</p>
      ${t("\\log\\!\\left(\\frac{L}{L_{\\text{ZAMS}}}\\right) = \\alpha_L \\tau + \\beta_L \\tau^\\eta + \\left(\\log\\frac{L_{\\text{TMS}}}{L_{\\text{ZAMS}}} - \\alpha_L - \\beta_L\\right)\\tau^2")}
      ${n([["\\tau","fractional main-sequence age (t / t_{\\text{MS}})"],["L_{\\text{ZAMS}}","ZAMS luminosity"],["L_{\\text{TMS}}","terminal main-sequence luminosity"],["\\alpha_L, \\beta_L","Hurley evolution coefficients"],["\\eta","curvature exponent (10 for M \\le 1, 20 for M \\ge 1.1)"]])}
      ${a("Hurley, Pols & Tout (2000, MNRAS 315, 543), eqs. 8, 19, 20")}`,o),i("Metallicity Matters",`<p>Stars are mostly hydrogen and helium, but they also contain small
        amounts of heavier elements \u2014 what astronomers collectively call
        <strong>metals</strong> (everything heavier than helium). The fraction
        of metals in a star is its <strong>metallicity</strong>.</p>
      <p>Metallicity matters because metals are efficient at absorbing
        radiation inside the star. More metals mean the star's interior is
        more opaque, which changes how energy flows outward and alters the
        star's structure, temperature, and lifetime.</p>
      <p>Astronomers group stars into broad populations based on metallicity:</p>
      <ul>
        <li><strong>Population I</strong> \u2014 metal-rich, found in the thin
            disk of galaxies (like the Sun).</li>
        <li><strong>Population II</strong> \u2014 metal-poor, found in the halo
            and thick disk.</li>
        <li><strong>Population III</strong> \u2014 the hypothetical first stars,
            with zero metals (none yet observed).</li>
      </ul>
      ${s("Metals in a star change how it evolves by affecting its internal opacity. Metal-rich and metal-poor stars of the same mass follow slightly different life paths.")}`,`<p>Metallicity is commonly expressed as [Fe/H], the logarithmic iron
        abundance relative to the Sun:</p>
      ${t("[\\text{Fe/H}] = \\log_{10}\\!\\left(\\frac{N_{\\text{Fe}}}{N_{\\text{H}}}\\right)_\\star - \\log_{10}\\!\\left(\\frac{N_{\\text{Fe}}}{N_{\\text{H}}}\\right)_\\odot")}
      <p>The metal mass fraction ${e("Z")} is related to [Fe/H] by:</p>
      ${t("Z = Z_\\odot \\times 10^{[\\text{Fe/H}]}")}
      <p>where ${e("Z_\\odot = 0.02")} in the SSE convention (Hurley et al.
        2000). Key effects of metallicity on stellar evolution:</p>
      <ul>
        <li><strong>Opacity</strong> \u2014 higher ${e("Z")} increases bound-free
            and line opacities, making the interior more opaque. This raises
            the radiative temperature gradient and can extend convective
            envelopes.</li>
        <li><strong>ZAMS position</strong> \u2014 at higher ${e("Z")}, a given
            mass is slightly cooler and less luminous on the ZAMS.</li>
        <li><strong>Lifetime</strong> \u2014 metal-rich stars are somewhat less
            luminous and therefore live slightly longer.</li>
        <li><strong>Giant branch morphology</strong> \u2014 metallicity shifts the
            RGB tip luminosity, the helium-flash mass, and the horizontal
            branch morphology.</li>
      </ul>
      ${r(["Population","[Fe/H] range","Z range","Location"],[["I (metal-rich)","> -0.3","> 0.01","Thin disk"],["Intermediate","-1.0 to -0.3","0.002 -- 0.01","Old thin / thick disk"],["II (metal-poor)","< -1.0","< 0.002","Halo, globular clusters"],["III (primordial)","~ -inf","~ 0","Theoretical; early universe"]])}
      ${a("Hurley, Pols & Tout (2000, MNRAS 315, 543); Tout et al. (1996, MNRAS 281, 257)")}`,o)].join("")}export{c as buildLesson04};
