import{a as t,b as e,c as n,d as a,e as l,f as i,g as r,h as s}from"./chunk-L3XYPVN7.js";import"./chunk-VC46IEJQ.js";function p(o){return[i("The Frost Line",`<p>The frost line (also called the snow line or ice line) is the distance
      from a young star beyond which it is cold enough for water and other
      volatile compounds to freeze into solid ice grains. Inside this line,
      only rock and metal survive in solid form.</p>
      <p>This boundary is crucial for planet formation. Inside the frost line,
      planets form from rock and metal, producing smaller, denser worlds like
      Earth and Mars. Beyond it, ice adds to the available building material,
      allowing the cores of planets to grow much larger, quickly enough to
      capture thick hydrogen and helium envelopes and become gas giants.</p>
      ${r("Imagine a campfire on a winter night. Close to the fire, snow melts and only bare ground remains. Farther away, snow stays frozen and piles up. The frost line is the boundary where snow begins to survive.")}
      ${s("The frost line divides a planetary system into an inner zone of rocky planets and an outer zone where giant planets can form.")}`,`<p>The frost line distance depends on the luminosity of the young star.
      A common approximation for a main-sequence star is:</p>
      ${t("d_{\\text{frost}} = 4.85 \\sqrt{L_\\star} \\text{ AU}")}
      ${n([["d_{\\text{frost}}","frost line distance (AU)"],["L_\\star","stellar luminosity (solar luminosities)"]])}
      <p>For the Sun, this gives about 4.85 AU, consistent with the location
      of Jupiter (5.2 AU) just beyond the frost line. During the
      protoplanetary disk phase, the luminosity was higher, pushing the frost
      line outward; as the disk cooled, it migrated inward.</p>
      <p>Beyond the water frost line, additional ice lines exist for more
      volatile species:</p>
      ${l(["Species","Condensation T (K)","Approx. distance (Sun)"],[["H\u2082O","170","~5 AU"],["CO\u2082","70","~10 AU"],["CO / N\u2082","20-25","~30 AU"]])}
      ${a("Hayashi, C. (1981), Prog. Theor. Phys. Suppl. 70, 35.")}`,o),i("System Architecture",`<p>Planets do not bunch up at random distances from their star. Instead,
      they tend to space themselves out in a pattern where each successive
      planet is roughly a fixed multiple farther out than the one before it.
      This produces a geometric spacing, almost like rungs on a ladder where
      the gaps between rungs keep getting wider.</p>
      <p>This happens because neighbouring planets gravitationally disturb each
      other. If two planets orbit too close together, their mutual gravity will
      eventually push one of them into a different orbit or eject it entirely.
      Over billions of years, only well-separated configurations survive.</p>
      ${r("Think of people on a bus. Nobody sits directly next to a stranger if there is room to spread out. Over time, the spacing becomes roughly even. Planets behave similarly, settling into stable, well-separated orbits.")}
      ${s("Stable planetary systems have roughly geometric spacing: each planet is a similar multiple farther from the star than its inner neighbour.")}`,`<p>Empirically, planetary systems show quasi-geometric spacing. The
      Titius-Bode relation (an 18th-century empirical rule) approximated
      this for the Solar System, but the underlying physics is dynamical
      stability.</p>
      <p>The key stability metric is the <b>mutual Hill radius</b>:</p>
      ${t("R_H = \\frac{a_1 + a_2}{2} \\left(\\frac{m_1 + m_2}{3 M_\\star}\\right)^{1/3}")}
      ${n([["R_H","mutual Hill radius"],["a_1, a_2","semi-major axes of the two planets"],["m_1, m_2","planet masses"],["M_\\star","stellar mass"]])}
      <p>Numerical simulations show that systems are long-term stable when
      adjacent planets are separated by at least ${e("\\Delta > 2\\sqrt{3}")},
      roughly 3.46 mutual Hill radii. Most observed multi-planet systems
      have ${e("\\Delta \\approx 10{-}30 R_H")}.</p>
      <p>A simple geometric spacing model predicts the ${e("n")}-th planet's
      semi-major axis as:</p>
      ${t("a_n = a_1 \\cdot k^{(n-1)}")}
      <p>where ${e("k \\approx 1.4{-}2.0")} is the common ratio. The Solar
      System has ${e("k \\approx 1.7")} on average.</p>
      ${a("Chambers, J. E., Wetherill, G. W., & Boss, A. P. (1996), Icarus 119, 261.")}`,o),i("Multistar Host Frames",`<p>Not every planetary system orbits a single lonely star. Many systems are
      binaries or higher-order multiples, and that changes what &ldquo;the host&rdquo;
      means. In WorldSmith, planets can orbit either a <strong>single star</strong>
      in a circumstellar <strong>S-type</strong> frame, or a <strong>bound pair</strong>
      in a circumbinary <strong>P-type</strong> frame.</p>
      <p>That distinction matters because each host frame has its own orbit ladder,
      habitable zone, frost line, and stability limits. A planet orbiting Star A in
      a wide binary does not feel the same geometry as a planet orbiting the A+B
      barycentre in a close binary.</p>
      <p>Hierarchical triples and quads extend the same idea: an inner pair can act
      as a local host frame, while more distant stars contribute extra light and
      long-term perturbations from higher levels of the hierarchy.</p>
      ${r("Think of an airport with multiple runways. A single runway has one obvious traffic pattern. Add more runways and you need to know which traffic loop you are actually flying: around one runway, or around the whole airport complex. Multistar host frames work the same way.")}
      ${s("In multistar systems, the active host frame matters. S-type worlds orbit one star; P-type worlds orbit a pair barycentre, and each frame has its own stable orbit zone.")}`,`<p>The classic binary-stability fits of Holman & Wiegert (1999) give the rough
      allowed regions:</p>
      ${t("a_{\\text{S-type}} \\lesssim 0.2\\text{--}0.3\\;a_{\\text{bin}}, \\qquad a_{\\text{P-type}} \\gtrsim 3\\text{--}5\\;a_{\\text{bin}}")}
      <p>WorldSmith uses the full coefficient fits rather than just these rules of thumb,
      and it also carries a hierarchical outer-pair guardrail for triples and quads so
      outer branches do not crowd inner binaries.</p>
      <p>Companion stars are not just gravitational nuisances. Their light is sampled across
      the hierarchy orbit and contributes an extra heating term:</p>
      ${t("S_{\\text{comp}} = \\sum_i \\frac{L_i}{d_i^2}")}
      <p>This can shift the effective habitable zone and frost-line context for the selected
      host frame. So in multistar systems you always ask two questions together:
      <em>Which star or pair is my planet orbiting?</em> and <em>How much extra forcing do the
      other stars contribute?</em></p>
      ${a("Holman & Wiegert (1999, AJ 117, 621); Mardling & Aarseth (2001, MNRAS 321, 398).")}`,o),i("Inner Limits",`<p>There is a minimum distance at which a planet can orbit a star. Get
      too close, and the star's enormous gravity will rip the planet apart.
      This boundary is called the <b>Roche limit</b>.</p>
      <p>The exact distance depends on the densities of both the star and the
      planet. A dense iron planet can survive closer than a fluffy gas giant.
      But for any planet, there is a point of no return where tidal forces
      overwhelm the planet's own gravity holding it together.</p>
      <p>In our Solar System, no planet comes close to this limit. But among
      exoplanets, "hot Jupiters" orbit remarkably close to their stars, some
      just a few stellar radii away, near the edge of destruction.</p>
      ${r("Imagine holding a ball of clay near a powerful magnet. From far away, the ball keeps its shape. Move it closer and the side facing the magnet stretches. Get too close and the ball is pulled apart entirely.")}
      ${s("Every star has a minimum safe orbital distance. Below it, tidal forces tear a planet apart. Denser planets can survive closer in.")}`,`<p>The Roche limit for a fluid body orbiting a more massive primary
      is:</p>
      ${t("d_{\\text{Roche}} = 2.456 \\, R_\\star \\left(\\frac{\\rho_\\star}{\\rho_{\\text{planet}}}\\right)^{1/3}")}
      ${n([["d_{\\text{Roche}}","Roche limit distance (from centre of star)"],["R_\\star","stellar radius"],["\\rho_\\star","mean stellar density"],["\\rho_{\\text{planet}}","mean planet density"]])}
      <p>For a rigid body the coefficient drops to about 1.26, but real planets
      behave closer to the fluid case due to internal deformation.</p>
      <p>Approximate Roche limits for the Sun:</p>
      ${l(["Planet type","Density (g/cm\xB3)","Roche limit (R\u2609)"],[["Gas giant (Saturn-like)","0.7","~3.5"],["Gas giant (Jupiter-like)","1.3","~2.9"],["Rocky (Earth-like)","5.5","~1.7"],["Iron-rich (Mercury-like)","5.4","~1.7"]])}
      <p>Hot Jupiters such as WASP-12b orbit at ${e("\\sim 3 R_\\star")},
      dangerously close to tidal disruption. Some show evidence of active
      mass loss.</p>
      ${a("Roche, E. (1849), Acad. Sci. Lettres Montpellier.")}`,o),i("Giant Planet Probability",`<p>Not all stars are equally likely to have giant planets like Jupiter or
      Saturn. Observations of thousands of exoplanet systems have revealed a
      strong pattern: stars that contain more heavy elements (astronomers call
      these "metals", meaning anything heavier than hydrogen and helium) are
      much more likely to host giant planets.</p>
      <p>A star with twice the Sun's metal content is roughly four times more
      likely to have a giant planet. A star with half the Sun's metals is
      much less likely. This makes sense because heavier elements provide the
      raw material for building the solid cores that giant planets need to
      start accumulating gas.</p>
      ${r("Building a giant planet is like making a snowball large enough to start an avalanche. If there is more snow (heavy elements) on the ground, it is much easier to roll a big enough ball to get the avalanche going.")}
      ${s("Metal-rich stars are far more likely to have giant planets. Metallicity is one of the strongest predictors of giant planet occurrence.")}`,`<p>Fischer and Valenti (2005) analysed 850 FGK stars and found that the
      probability of hosting a giant planet scales exponentially with
      metallicity:</p>
      ${t("P(\\text{giant}) \\propto 10^{2 [\\text{Fe/H}]}")}
      ${n([["P(\\text{giant})","probability of hosting a detected giant planet"],["[\\text{Fe/H}]","logarithmic iron abundance relative to the Sun"]])}
      <p>At solar metallicity ${e("[\\text{Fe/H}] = 0")}, Kepler-era surveys
      find about 7% of solar-type stars host a giant planet. At
      ${e("[\\text{Fe/H}] = +0.3")} (twice solar), the rate rises to
      roughly 28%. Giant planets are also more common around higher-mass
      stars (Johnson et al. 2010).</p>
      ${l(["[Fe/H]","Giant planet rate (1 M\u2609)"],[["-0.5","~0.7%"],["0.0","~7%"],["+0.2","~18%"],["+0.3","~28%"],["+0.5","~70%"]])}
      <p>This &ldquo;planet-metallicity correlation&rdquo; strongly supports the
      core-accretion model of giant planet formation, in which a
      ${e("\\sim 10 M_\\oplus")} solid core must form before runaway gas
      accretion can begin.</p>
      ${a("Fischer, D. A. & Valenti, J. (2005), ApJ 622, 1102; Johnson, J. A. et al. (2010), PASP 122, 905; Petigura, E. A. et al. (2018), AJ 155, 89.")}`,o)].join("")}export{p as buildLesson07};
