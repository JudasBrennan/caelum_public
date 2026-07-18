import{a as s,b as e,c as p,d as i,e as d,f as o,g as n,h as l,i as g,j as y,k as b}from"./chunk-B66B57MG.js";import{R as f}from"./chunk-JVKPTJKR.js";import"./chunk-Q3EXAOWE.js";import"./chunk-ASLSWSPR.js";import"./chunk-MTXM7GCO.js";import{A as c}from"./chunk-JAT3QFT3.js";import"./chunk-6DA3R6ZF.js";import"./chunk-RC2KHOII.js";import"./chunk-FFUDGKDT.js";function x(t){return[o("The Mass-Luminosity Relation",`<p>The most important rule in stellar physics might be the simplest to
        state: <strong>more massive stars are dramatically more luminous</strong>.
        But the relationship is far from linear.</p>
      <p>Doubling a star's mass does not merely double its brightness. In
        fact, a star twice the mass of the Sun is roughly ten times brighter.
        A star ten times the Sun's mass can be thousands of times more
        luminous.</p>
      ${n("Imagine two engines: one twice the size of the other. You might expect it to produce twice the power, but stellar physics is far more extreme \u2014 the bigger engine runs so much hotter that it outputs ten times the power, not two.")}
      ${l("Luminosity scales roughly as mass to the fourth power: double the mass and you get about 10 to 16 times the luminosity. This steep relation has huge consequences for stellar lifetimes.")}`,`<p>The mass-luminosity relation (MLR) for main-sequence stars is
        commonly approximated as a single power law:</p>
      ${s("L \\propto M^\\alpha")}
      <p>In reality, ${e("\\alpha")} varies with mass. Eker et al. (2018)
        calibrated a six-piece empirical relation from 509 eclipsing binary
        components:</p>
      ${d(["Mass range (M<sub>&#9737;</sub>)","\\(\\alpha\\)","Regime"],[["< 0.45","2.028","Fully convective M dwarfs"],["0.45 -- 0.72","4.572","Late-K / early-M transition"],["0.72 -- 1.05","5.743","Solar-type (G/K boundary)"],["1.05 -- 2.40","4.329","F / A stars"],["2.40 -- 7.0","3.967","B stars"],["> 7.0","2.865","O / early-B stars"]])}
      <p>The exponent ${e("\\alpha")} is steepest near 1 ${e("M_\\odot")}
        (where opacity-driven envelope physics dominates) and flattens toward
        both extremes. The simplified ${e("\\alpha \\approx 4")} is a useful
        approximation for back-of-the-envelope calculations in the
        1--10 ${e("M_\\odot")} range.</p>
      ${s("L = c \\cdot M^\\alpha \\quad (c \\text{ adjusted for continuity at each boundary})")}
      ${i("Eker et al. (2018, MNRAS 479, 5491), Table 4")}`,t),o("The Stefan-Boltzmann Law",`<p>A star's luminosity depends on two things: how <strong>big</strong>
        it is and how <strong>hot</strong> its surface is. A larger star has
        more surface area to radiate from, and a hotter surface radiates far
        more energy per unit area.</p>
      <p>Temperature matters most. If you double the surface temperature of a
        star (keeping its size the same), its luminosity increases by a
        factor of sixteen \u2014 because luminosity goes as the <em>fourth
        power</em> of temperature.</p>
      ${n("Think of two metal plates heated in a forge, one twice as hot as the other. The hotter plate does not glow just twice as brightly \u2014 it radiates sixteen times more energy. That is the power of the fourth-power law.")}
      ${l("A star's luminosity equals its surface area multiplied by the energy radiated per unit area, which depends on the fourth power of temperature: L = 4 pi R squared times sigma T to the fourth.")}`,`<p>The Stefan-Boltzmann law relates luminosity to radius and effective
        temperature:</p>
      ${s("L = 4\\pi R^2 \\sigma T_{\\text{eff}}^{\\,4}")}
      ${p([["L","luminosity (W)"],["R","stellar radius (m)"],["\\sigma","Stefan-Boltzmann constant (5.670 \\times 10^{-8}\\;\\text{W m}^{-2}\\text{K}^{-4})"],["T_{\\text{eff}}","effective surface temperature (K)"]])}
      <p>In solar units, this simplifies to:</p>
      ${s("\\frac{L}{L_\\odot} = \\left(\\frac{R}{R_\\odot}\\right)^{\\!2} \\left(\\frac{T_{\\text{eff}}}{T_{\\odot}}\\right)^{\\!4}")}
      <p>This is the basis for the Caelum engine's temperature derivation:
        given mass-derived ${e("L")} and ${e("R")}, the effective
        temperature is solved as
        ${e("T_{\\text{eff}} = (L / R^2)^{0.25} \\times 5776\\;\\text{K}")}.</p>
      <p>The Stefan-Boltzmann law follows from integrating the Planck
        blackbody function over all wavelengths and over the hemisphere,
        yielding total emitted flux ${e("F = \\sigma T^4")} per unit area.</p>
      ${i("Carroll & Ostlie (2017), An Introduction to Modern Astrophysics, Ch. 3")}`,t),o("Energy Source: Fusion",`<p>Stars shine because they fuse light elements into heavier ones in
        their cores. On the main sequence, the primary fuel is
        <strong>hydrogen</strong>, which is converted to helium.</p>
      <p>More massive stars have hotter, denser cores, so they burn through
        hydrogen at a ferocious rate. A star ten times the Sun's mass is
        thousands of times brighter but has only ten times the fuel \u2014 it
        runs out in a tiny fraction of the Sun's lifetime.</p>
      ${n("Think of fuel in a vehicle: a larger tank holds more fuel, but if the engine burns it a hundred times faster, the tank empties far sooner. Massive stars are like powerful engines with only moderately larger tanks.")}
      ${l("Stars are powered by hydrogen fusion. More massive stars fuse hydrogen faster, producing more light but exhausting their fuel supply in far less time.")}`,`<p>Main-sequence stars convert hydrogen to helium via two pathways:</p>
      <ul>
        <li><strong>pp chain</strong> \u2014 dominant below ~1.3 ${e("M_\\odot")};
            reaction rate ${e("\\propto T^4")}. Energy yield: 26.73 MeV per
            ${e("{}^4\\!He")} nucleus (minus neutrino losses of ~2%).</li>
        <li><strong>CNO cycle</strong> \u2014 dominant above ~1.3 ${e("M_\\odot")};
            reaction rate ${e("\\propto T^{16}")}. Uses C, N, O as catalysts.
            Same net energy per helium nucleus, but neutrino losses are
            slightly higher (~5%).</li>
      </ul>
      ${s("\\varepsilon_{\\text{pp}} \\propto \\rho T^4, \\quad \\varepsilon_{\\text{CNO}} \\propto \\rho T^{16}")}
      ${p([["\\varepsilon","energy generation rate per unit mass"],["\\rho","core density"],["T","core temperature"]])}
      <p>The steep temperature dependence of the CNO cycle means that even a
        modest increase in core temperature (driven by higher mass) causes a
        dramatic increase in energy output. This is the physical origin of
        the mass-luminosity relation's steep exponent near
        1 ${e("M_\\odot")}.</p>
      <p>Main-sequence lifetime scales as available fuel divided by burn
        rate:</p>
      ${s("t_{\\text{MS}} \\sim \\frac{E_{\\text{fuel}}}{L} \\propto \\frac{M}{L} \\propto M^{1-\\alpha}")}
      ${i("Kippenhahn, Weigert & Weiss (2012), Ch. 18; Eker et al. (2018, MNRAS 479, 5491)")}`,t),g("Mass to Luminosity",`${y('<label for="les03-mass">Star mass (M<sub>&#9737;</sub>)</label>',`<input id="les03-mass" type="number" min="0.08" max="100" step="0.01" value="1.0">
         <input id="les03-massSlider" type="range" min="0.08" max="100" step="0.01" value="1.0">`)}
      ${b("les03-lum","Luminosity (L<sub>&#9737;</sub>)")}`)].join("")}function M(t){let a=t.querySelector("#les03-mass"),r=t.querySelector("#les03-massSlider"),h=t.querySelector("#les03-lum");if(!a||!r||!h)return;function u(){let m=parseFloat(a.value)||1;r.value=m,h.textContent=c(f(m),4)}a.addEventListener("input",u),r.addEventListener("input",()=>{a.value=r.value,u()}),u()}export{x as buildLesson03,M as wireLesson03};
