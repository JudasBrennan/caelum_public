import{a as n,b as e,c as d,d as a,e as p,f as s,g as l,h as o,i as x,j as T,k as f}from"./chunk-L3XYPVN7.js";import{K as y,N as w,O as v}from"./chunk-PEDZU4MZ.js";import{j as c}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function z(t){return[s("What Is the Habitable Zone?",`<p>The <strong>habitable zone</strong> (HZ) is the range of distances
        from a star where conditions on a planet's surface could allow liquid
        water to exist. It is sometimes called the "Goldilocks zone" \u2014 not
        too hot, not too cold, but just right.</p>
      <p>Liquid water is considered essential for life as we know it, so the
        habitable zone is a key concept in the search for potentially
        Earth-like worlds.</p>
      ${l("Imagine sitting around a campfire on a cold night. Too close and you overheat; too far and you freeze. There is a comfortable ring around the fire where the temperature is just right. The habitable zone is that comfortable ring around a star.")}
      ${o("The habitable zone is the band of orbital distances where a planet could sustain liquid water on its surface \u2014 the key requirement for life as we know it.")}`,`<p>The habitable zone is defined by the range of orbital distances
        where the incident stellar flux ${e("S")} allows a planet with
        a suitable atmosphere to maintain surface liquid water. The concept
        is formalised through the <strong>effective stellar flux</strong>
        ${e("S_{\\text{eff}}")}:</p>
      ${n("d = \\sqrt{\\frac{L / L_\\odot}{S_{\\text{eff}}}}\\;\\text{AU}")}
      ${d([["d","orbital distance (AU)"],["L","stellar luminosity (L_\\odot)"],["S_{\\text{eff}}","effective stellar flux at the HZ boundary (dimensionless, relative to solar flux at 1 AU)"]])}
      <p>The ${e("S_{\\text{eff}}")} values for the inner and outer edges
        are not constants \u2014 they depend on the stellar effective temperature
        because cooler stars emit a larger fraction of their light at red/IR
        wavelengths, which interact differently with atmospheric absorbers
        (H${e("_2")}O, CO${e("_2")}).</p>
      ${a("Kopparapu et al. (2013, ApJ 765, 131); Kopparapu et al. (2014, ApJ 787, L29)")}`,t),s("Inner and Outer Edges",`<p>The habitable zone has two boundaries:</p>
      <ul>
        <li><strong>Inner edge</strong> \u2014 too close to the star. Intense
            radiation causes water to evaporate into the upper atmosphere,
            where ultraviolet light splits it apart. The hydrogen escapes to
            space, and a <em>runaway greenhouse</em> effect bakes the planet.
            Venus may have suffered this fate.</li>
        <li><strong>Outer edge</strong> \u2014 too far from the star. The planet
            receives too little warmth to keep water liquid, even with a
            thick CO${e("_2")} atmosphere. Beyond a certain distance,
            CO${e("_2")} itself begins to condense into clouds, reducing
            the greenhouse effect and pushing temperatures even lower.</li>
      </ul>
      ${l("Too close to the fire: your marshmallow catches flame. Too far away: it stays cold and raw. The habitable zone is the sweet spot where it toasts evenly.")}
      ${o("The inner edge is set by the runaway greenhouse limit (all water boils away). The outer edge is set by the maximum greenhouse limit (CO2 condenses and the greenhouse effect fails).")}`,`<p>The inner and outer ${e("S_{\\text{eff}}")} boundaries are
        modelled as 4th-order polynomials in
        ${e("\\Delta T = T_{\\text{eff}} - 5780\\;\\text{K}")}:</p>
      ${n("S_{\\text{eff}} = S_0 + a\\,\\Delta T + b\\,\\Delta T^2 + c\\,\\Delta T^3 + d\\,\\Delta T^4")}
      <p>WorldSmith uses the Chromant Desmos correction to the Kopparapu
        coefficients:</p>
      ${p(["Boundary","S<sub>0</sub>","a","b","c","d"],[["Inner (runaway GH)","1.107","1.332e-4","1.58e-8","-8.308e-12","-5.073e-15"],["Outer (max GH)","0.356","6.171e-5","1.698e-9","-3.198e-12","-5.575e-16"]])}
      <p>The orbital distance at each boundary is then:</p>
      ${n("d_{\\text{HZ}} = \\sqrt{\\frac{L}{S_{\\text{eff}}}}\\;\\text{AU}")}
      <p>The temperature correction matters significantly for M dwarfs
        (${e("T_{\\text{eff}} \\sim 3000\\;\\text{K}")}) where the HZ
        shifts inward, and for early-type stars where it shifts outward.</p>
      ${d([["S_{\\text{eff}}","effective flux boundary (dimensionless)"],["\\Delta T","T_{\\text{eff}} - 5780\\;\\text{K}"],["L","stellar luminosity (L_\\odot)"]])}
      ${a("Kopparapu et al. (2013, ApJ 765, 131); Chromant Desmos Star System Visualizer")}`,t),s("How Star Type Affects the HZ",`<p>The habitable zone shifts depending on the type of star:</p>
      <ul>
        <li><strong>Hot, luminous stars</strong> (O, B, A types) push the
            habitable zone far out \u2014 planets must orbit at great distances to
            avoid being scorched.</li>
        <li><strong>Sun-like stars</strong> (F, G types) have habitable zones
            at moderate distances, roughly 0.9 to 1.7 AU for a solar twin.</li>
        <li><strong>Cool, dim stars</strong> (K, M types) pull the habitable
            zone in very close. An M dwarf's habitable zone might be only
            0.1 to 0.3 AU from the star \u2014 closer than Mercury is to our
            Sun.</li>
      </ul>
      ${l("A dim lamp needs you to sit close to read by its light. A powerful floodlight lets you read comfortably from across the room. Dim stars need their planets close; bright stars can warm planets from a great distance.")}
      ${o("Brighter stars have wider, more distant habitable zones. Dimmer stars have narrow habitable zones very close in. M dwarfs in particular have HZs so close that tidal locking becomes a concern.")}`,`<p>Since ${e("d_{\\text{HZ}} = \\sqrt{L / S_{\\text{eff}}}")}, the
        habitable zone scales primarily with the square root of luminosity.
        Because the mass-luminosity relation is steep
        (${e("L \\propto M^{\\sim 4}")}), even a modest change in mass
        produces a large shift in HZ distance:</p>
      ${p(["Spectral type","Mass (M<sub>&#9737;</sub>)","L (L<sub>&#9737;</sub>)","HZ inner (AU)","HZ outer (AU)"],[["M5V","0.16","0.003","0.05","0.09"],["M0V","0.50","0.06","0.22","0.42"],["K5V","0.70","0.17","0.37","0.70"],["G2V (Sun)","1.00","1.00","0.95","1.67"],["F5V","1.40","3.7","1.8","3.2"],["A0V","2.50","28","4.9","8.8"]])}
      <p>For M dwarfs, the HZ is so close that planets are likely
        tidally locked, presenting the same face to the star permanently.
        Whether such planets can maintain habitable surface conditions
        depends on atmospheric heat transport. For moons, the same close-in
        geometry also compresses the Hill-stable circumplanetary region and
        raises early-XUV escape pressure, so a stellar-HZ moon around a very
        low-mass star is not automatically a strong surface-habitability
        candidate.</p>
      ${a("Kopparapu et al. (2013, ApJ 765, 131); Shields et al. (2016, Phys. Rep. 663, 1)")}`,t),s("Limitations",`<p>The habitable zone is a useful guide, but it is a simplification.
        Real habitability depends on much more than distance from a star:</p>
      <ul>
        <li><strong>Atmosphere</strong> \u2014 a thick greenhouse atmosphere can
            warm a planet beyond the nominal outer edge. A thin or absent
            atmosphere leaves a planet frozen even inside the HZ.</li>
        <li><strong>Tidal heating</strong> \u2014 moons of giant planets (like
            Jupiter's Europa) can have subsurface oceans heated by tidal
            forces, far outside any star's habitable zone. Those are usually
            subsurface-life cases, not automatic surface-habitability cases.</li>
        <li><strong>Planetary composition</strong> \u2014 the amount of water,
            volcanic outgassing, and plate tectonics all affect whether
            liquid water actually exists.</li>
      </ul>
      <p>Venus sits near the inner edge of the Sun's habitable zone but is a
        scorching hellscape because of its thick CO${e("_2")} atmosphere.
        Mars sits near the outer edge but is too cold because it lost most
        of its atmosphere.</p>
      ${o("The habitable zone marks where liquid water <em>could</em> exist, not where it <em>does</em> exist. Atmosphere, geology, radiation, and other factors determine actual habitability. Planets outside the HZ (like icy moons) might still harbour subsurface life.")}`,`<p>The classical HZ assumes a 1-Earth-mass planet with an
        N${e("_2")}--CO${e("_2")}--H${e("_2")}O atmosphere and ignores
        several factors that can shift the boundaries:</p>
      <ul>
        <li><strong>Planetary mass</strong> \u2014 more massive planets retain
            thicker atmospheres and have stronger greenhouse effects,
            potentially extending the outer edge.</li>
        <li><strong>Cloud feedback</strong> \u2014 reflective clouds near the
            inner edge can increase the planet's albedo and push the runaway
            greenhouse threshold closer to the star. Water-ice clouds at the
            outer edge can either warm (IR scattering) or cool (reflection)
            depending on altitude.</li>
        <li><strong>Tidal heating</strong> \u2014 for moons in eccentric orbits
            around giant planets, dissipation can provide enough internal
            heat to maintain subsurface oceans far outside the HZ (e.g.
            Europa, Enceladus). Surface habitability still depends on
            atmosphere retention and tolerable radiation.</li>
        <li><strong>Atmospheric escape</strong> \u2014 M-dwarf planets in close
            HZs are subject to intense XUV irradiation during the star's
            active pre-main-sequence phase, potentially stripping
            atmospheres entirely.</li>
        <li><strong>Synchronous rotation</strong> \u2014 tidally locked planets
            require atmospheric dynamics to redistribute heat. 3D GCM
            studies suggest this is feasible for Earth-like atmospheres but
            uncertain for thin-atmosphere worlds.</li>
      </ul>
      <p>Venus (${e("S \\approx 1.91\\,S_\\oplus")}) experienced a
        runaway greenhouse despite being only slightly inside the inner
        HZ edge. Mars (${e("S \\approx 0.43\\,S_\\oplus")}) is near the
        outer edge but lost its magnetic field and most of its atmosphere
        early, leaving it cold and dry.</p>
      ${a("Kopparapu et al. (2013); Shields et al. (2016, Phys. Rep. 663, 1); Lammer et al. (2009, A&A Rev. 17, 181)")}`,t),x("Habitable Zone Calculator",`${T('<label for="les05-mass">Star mass (M<sub>&#9737;</sub>)</label>',`<input id="les05-mass" type="number" min="0.08" max="5" step="0.01" value="1.0">
         <input id="les05-massSlider" type="range" min="0.08" max="5" step="0.01" value="1.0">`)}
      ${f("les05-inner","HZ inner edge (AU)")}
      ${f("les05-outer","HZ outer edge (AU)")}`)].join("")}function k(t){let r=t.querySelector("#les05-mass"),i=t.querySelector("#les05-massSlider"),m=t.querySelector("#les05-inner"),b=t.querySelector("#les05-outer");if(!r||!i||!m||!b)return;function h(){let u=parseFloat(r.value)||1;i.value=u;let $=y(u),S=w(u),g=v({luminosityLsol:$,teffK:S});m.textContent=c(g.innerAu,4),b.textContent=c(g.outerAu,4)}r.addEventListener("input",h),i.addEventListener("input",()=>{r.value=i.value,h()}),h()}export{z as buildLesson05,k as wireLesson05};
