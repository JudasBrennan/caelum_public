import{a,b as e,c as h,d as s,e as w,f as r,g as p,h as o,i as M,j as v,k as d}from"./chunk-L3XYPVN7.js";import{N as y,Q as b}from"./chunk-6APDEY5P.js";import{A as u}from"./chunk-JOWNJXZP.js";import"./chunk-VC46IEJQ.js";function k(t){return[r("What Makes a Star",`<p>A star is a massive ball of hot gas \u2014 mostly hydrogen \u2014 held together
        by its own gravity. Deep in its core, the pressure and temperature are
        so extreme that hydrogen atoms are squeezed together and fused into
        helium, releasing enormous amounts of energy in the process.</p>
      <p>That energy pushes outward as radiation pressure, perfectly balancing
        the inward pull of gravity. This tug-of-war keeps the star stable for
        millions or even billions of years.</p>
      ${p("Think of a star as a campfire that keeps itself going: gravity pulls fuel inward, fusion pushes energy outward, and the two stay in balance for as long as there is fuel to burn.")}
      ${o("A star shines because hydrogen nuclei fuse into helium in its core, releasing energy. Gravity and radiation pressure hold each other in check \u2014 a state called hydrostatic equilibrium.")}`,`<p>Stars are gravitationally bound plasma spheres sustained by
        thermonuclear fusion in their cores. The dominant energy-generation
        pathway depends on mass and core temperature:</p>
      <ul>
        <li><strong>Proton-proton (pp) chain</strong> \u2014 dominant in stars with
            ${e("M \\lesssim 1.3\\,M_\\odot")} and core temperatures below
            ~18 MK. Four protons are fused into one ${e("{}^4\\!He")} nucleus
            via a sequence of weak and strong interactions, releasing 26.73 MeV
            per cycle.</li>
        <li><strong>CNO cycle</strong> \u2014 dominant above ${e("\\sim 1.3\\,M_\\odot")}.
            Carbon, nitrogen, and oxygen act as catalysts; the net reaction is
            the same (4p &rarr; He + energy) but the rate scales as
            ${e("T^{\\sim 16}")} vs ${e("T^{\\sim 4}")} for the pp chain,
            making it fiercely temperature-sensitive.</li>
      </ul>
      ${a("4\\,{}^1\\!H \\;\\longrightarrow\\; {}^4\\!He + 2e^+ + 2\\nu_e + 26.73\\;\\text{MeV}")}
      <p>Hydrostatic equilibrium requires the pressure gradient to balance
        gravitational acceleration at every radius:</p>
      ${a("\\frac{dP}{dr} = -\\frac{G\\,M(r)\\,\\rho(r)}{r^2}")}
      ${h([["P","pressure at radius r"],["G","gravitational constant"],["M(r)","mass enclosed within radius r"],["\\rho(r)","density at radius r"]])}
      ${s("Kippenhahn, Weigert & Weiss (2012), Stellar Structure and Evolution, Ch. 2")}`,t),r("Mass: The Master Variable",`<p>If you could know only one thing about a star, you would want to know
        its <strong>mass</strong>. Mass determines virtually every other
        property: how bright the star is, how hot its surface gets, how large
        it grows, and how long it lives.</p>
      <p>A more massive star has a hotter, denser core, which drives faster
        fusion and produces far more light. But that extravagance comes at a
        cost \u2014 massive stars burn through their fuel much more quickly.</p>
      ${p("Imagine mass as a single dial on a control panel. Turn it up and the star gets brighter, hotter, bigger, and shorter-lived \u2014 all at once.")}
      ${o("Mass is the master variable of stellar physics. Once you fix a star's mass, its luminosity, temperature, radius, and lifetime all follow.")}`,`<p>For main-sequence stars, empirical and theoretical relations tie
        nearly every observable to mass:</p>
      <ul>
        <li><strong>Mass-luminosity:</strong> ${e("L \\propto M^\\alpha")} with
            ${e("\\alpha \\approx 4")} near 1 ${e("M_\\odot")} (varies by
            mass range; see Lesson 3).</li>
        <li><strong>Mass-radius:</strong> Schweitzer linear for M dwarfs
            (${e("M \\le 0.5\\,M_\\odot")}); Eker quadratic for
            ${e("0.5\\text{--}1.5\\,M_\\odot")}; Stefan-Boltzmann
            from Eker MLR + MTR above.</li>
        <li><strong>Mass-lifetime:</strong> ${e("t_{\\text{MS}} \\propto M / L \\propto M^{1-\\alpha}")}
            \u2014 roughly ${e("t \\propto M^{-2.5}")} for solar-type stars.</li>
      </ul>
      ${a("t_{\\text{MS}} \\approx \\frac{10}{M^{2.5}}\\;\\text{Gyr}")}
      ${h([["L","luminosity (L\\odot)"],["M","mass (M\\odot)"],["R","radius (R\\odot)"],["\\alpha","mass-luminosity exponent (~2 to ~5.7 depending on mass range)"],["t_{\\text{MS}}","main-sequence lifetime"]])}
      ${s("Schweitzer et al. (2019, A&A 625, A68); Eker et al. (2018, MNRAS 479, 5491)")}`,t),r("Luminosity and Brightness",`<p><strong>Luminosity</strong> is the total amount of energy a star
        radiates every second \u2014 its intrinsic power output. It does not depend
        on how far away the star is from you.</p>
      <p><strong>Brightness</strong> (what astronomers call <em>apparent
        magnitude</em>) is how bright the star <em>looks</em> from a given
        distance. The same star appears dimmer when it is farther away.</p>
      ${p("Think of a torch: it has one fixed power output (luminosity), but if you walk further from it, the light reaching your eyes gets weaker (brightness drops). The torch itself has not changed.")}
      ${o("Luminosity is how much energy a star actually emits. Brightness is how much of that energy reaches an observer, and it falls off with the square of the distance.")}`,`<p>Luminosity ${e("L")} is an intrinsic property measured in watts (or
        solar luminosities ${e("L_\\odot = 3.828 \\times 10^{26}\\,\\text{W}")}).
        The observed flux ${e("F")} at distance ${e("d")} obeys the
        inverse-square law:</p>
      ${a("F = \\frac{L}{4\\pi d^2}")}
      <p>Astronomers express brightness on a logarithmic magnitude scale:</p>
      <ul>
        <li><strong>Apparent magnitude</strong> ${e("m")} \u2014 how bright a star
            appears from Earth.</li>
        <li><strong>Absolute magnitude</strong> ${e("M")} \u2014 the apparent
            magnitude a star would have at a standard distance of 10 parsecs.</li>
      </ul>
      ${a("m - M = 5\\log_{10}\\!\\left(\\frac{d}{10\\;\\text{pc}}\\right)")}
      ${h([["F","flux (W/m^2)"],["L","luminosity (W)"],["d","distance to observer"],["m","apparent magnitude"],["M","absolute magnitude"]])}
      ${s("Carroll & Ostlie (2017), An Introduction to Modern Astrophysics, Ch. 3")}`,t),r("The Life of a Star",`<p>A star spends most of its life on the <strong>main sequence</strong>,
        the long, stable phase during which it fuses hydrogen into helium in
        its core. Our Sun has been on the main sequence for about 4.6 billion
        years and will remain there for roughly another 5 billion.</p>
      <p>When the hydrogen fuel in the core runs out, the star begins to
        change dramatically: it swells into a giant or supergiant, and its
        fate depends on its mass \u2014 some end as white dwarfs, others as
        neutron stars or black holes.</p>
      ${o("The main sequence is the stable, hydrogen-burning phase of a star's life. What happens after depends on mass \u2014 a topic explored in Lesson 4.")}`,`<p>The main sequence is defined by core hydrogen burning. The
        main-sequence lifetime scales inversely with a high power of mass
        because luminosity rises much faster than the available fuel supply:</p>
      ${a("t_{\\text{MS}} \\propto \\frac{M}{L} \\propto M^{1-\\alpha}")}
      <p>Post-main-sequence evolution includes the subgiant branch, red giant
        branch (RGB), horizontal branch, asymptotic giant branch (AGB), and
        terminal phases (white dwarf, neutron star, or black hole) depending
        on the initial mass. These stages are covered in detail in Lesson 4.</p>
      ${w(["Mass range","MS lifetime","End state"],[["< 0.5 M\\(_{\\odot}\\)","> 100 Gyr","He white dwarf (theoretical)"],["0.5 -- 8 M\\(_{\\odot}\\)","0.1 -- 100 Gyr","CO white dwarf + planetary nebula"],["8 -- 25 M\\(_{\\odot}\\)","5 -- 30 Myr","Neutron star + core-collapse SN"],["> 25 M\\(_{\\odot}\\)","2 -- 5 Myr","Black hole (direct or fallback)"]])}
      ${s("Hurley, Pols & Tout (2000, MNRAS 315, 543)")}`,t),M("How massive is your star?",`${v('<label for="les01-mass">Star mass (M<sub>&#9737;</sub>)</label>',`<input id="les01-mass" type="number" min="0.08" max="100" step="0.01" value="1.0">
         <input id="les01-massSlider" type="range" min="0.08" max="100" step="0.01" value="1.0">`)}
      ${d("les01-lum","Luminosity (L<sub>&#9737;</sub>)")}
      ${d("les01-teff","Surface temperature (K)")}
      ${d("les01-life","Main-sequence lifetime (Gyr)")}`)].join("")}function _(t){let n=t.querySelector("#les01-mass"),i=t.querySelector("#les01-massSlider"),c=t.querySelector("#les01-lum"),g=t.querySelector("#les01-teff"),f=t.querySelector("#les01-life");if(!n||!i||!c||!g||!f)return;function m(){let l=parseFloat(n.value)||1;i.value=l;let $=y(l),x=b(l),L=10/Math.pow(l,2.5);c.textContent=u($,4),g.textContent=u(x,0),f.textContent=u(L,4)}n.addEventListener("input",m),i.addEventListener("input",()=>{n.value=i.value,m()}),m()}export{k as buildLesson01,_ as wireLesson01};
