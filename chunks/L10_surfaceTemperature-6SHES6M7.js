import{a as r,b as e,c as u,d as s,e as p,f as i,g as o,h as n,i as T,j as h,k as q}from"./chunk-L3XYPVN7.js";import{j as v}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function _(a){return[i("Energy Balance",`<p>A planet's surface temperature is set by a balancing act between two
      processes: energy arriving from the star (heating) and energy radiating
      away into space (cooling). When these two are in balance, the planet
      reaches a stable temperature called the <b>equilibrium temperature</b>.</p>
      <p>The closer a planet is to its star, the more energy it receives and
      the hotter it gets. A brighter star also means more energy. Conversely,
      a planet that radiates heat efficiently (or reflects a lot of starlight)
      will be cooler.</p>
      ${o("Think of a balance between heating and cooling, like a pot of water on a stove. Turn the burner up (brighter star or closer orbit) and the water gets hotter. Take the lid off (less greenhouse trapping) and it cools down. The steady temperature is where heating and cooling match.")}
      ${n("A planet's temperature is determined by how much starlight it absorbs versus how much heat it radiates away. Closer to the star or brighter star means hotter.")}`,`<p>The equilibrium temperature is found by equating absorbed stellar
      flux with emitted thermal radiation. For a rapidly rotating planet
      (uniform dayside/nightside temperature):</p>
      ${r("T_{\\text{eq}} = T_\\star \\sqrt{\\frac{R_\\star}{2a}} \\; (1 - A)^{1/4}")}
      <p>Or equivalently, using luminosity ${e("L = 4\\pi R_\\star^2 \\sigma T_\\star^4")}:</p>
      ${r("T_{\\text{eq}} = 278.5 \\; \\frac{L^{1/4}}{a^{1/2}} \\; (1 - A)^{1/4} \\; \\text{K}")}
      ${u([["T_{\\text{eq}}","equilibrium temperature (K)"],["T_\\star","stellar effective temperature (K)"],["R_\\star","stellar radius"],["a","orbital semi-major axis (AU)"],["A","Bond albedo"],["L","stellar luminosity (solar luminosities)"]])}
      <p>The factor 278.5 K is the equilibrium temperature of a zero-albedo
      planet at 1 AU from a solar-luminosity star. Earth's actual equilibrium
      temperature (with albedo 0.30) is about 255 K, well below the observed
      mean of 288 K; the 33 K difference is the greenhouse effect.</p>
      ${s("Pierrehumbert, R. T. (2010), Principles of Planetary Climate, Cambridge Univ. Press.")}`,a),i("Albedo",`<p>Albedo measures how reflective a planet is. A perfectly reflective
      surface (like a mirror) has an albedo of 1. A perfectly absorbing
      surface (like charcoal) has an albedo of 0. Real planets fall
      somewhere in between.</p>
      <p>Ice and clouds are bright and reflective, pushing the albedo up.
      Oceans and dark rock absorb more light, keeping the albedo low. This
      matters because a more reflective planet absorbs less energy from its
      star and stays cooler.</p>
      <p>Earth's average albedo is about 0.30, meaning it reflects 30% of
      incoming sunlight. Venus, covered in thick bright clouds, has an
      albedo of about 0.76. The Moon, with no atmosphere and dark basaltic
      rock, has an albedo of only 0.12.</p>
      ${o("Albedo is like wearing a white shirt versus a black shirt on a sunny day. The white shirt reflects sunlight and keeps you cooler; the black shirt absorbs it and heats up. Planets work the same way.")}
      ${n("High albedo (bright, reflective) means cooler. Low albedo (dark, absorbing) means warmer. Ice, clouds, and surface colour all contribute.")}`,`<p>Two types of albedo are used in planetary science:</p>
      <p><b>Bond albedo</b> ${e("(A_B)")} is the fraction of total incident
      stellar energy reflected in all directions across all wavelengths. This
      is what enters the energy balance equation.</p>
      <p><b>Geometric albedo</b> ${e("(A_g)")} is the ratio of flux
      reflected at zero phase angle (full illumination, looking straight at
      the planet) compared to a Lambertian disk of the same cross-section.
      This is what observers measure from afar.</p>
      <p>They are related by the phase integral ${e("q")}:</p>
      ${r("A_B = A_g \\times q")}
      <p>For a Lambertian sphere, ${e("q = 3/2")}, so ${e("A_B = 1.5 A_g")}.
      Real planets have ${e("q")} values between 0.5 and 2.0 depending on
      surface and atmospheric scattering properties.</p>
      ${p(["Body","Bond albedo","Geometric albedo"],[["Mercury","0.07","0.14"],["Venus","0.76","0.67"],["Earth","0.30","0.37"],["Moon","0.12","0.12"],["Mars","0.25","0.17"],["Jupiter","0.50","0.52"],["Enceladus","0.81","1.38"]])}
      <p>Note that geometric albedo can exceed 1.0 (as for Enceladus) because
      a strongly forward-scattering or specularly reflective surface can
      outperform a Lambertian reference at zero phase angle.</p>
      ${s("Mallama, A. & Hilton, J. L. (2018), Astron. Comput. 25, 10.")}`,a),i("The Greenhouse Effect",`<p>The greenhouse effect is the process by which certain gases in a
      planet's atmosphere trap outgoing heat, warming the surface above
      the bare equilibrium temperature. Without any greenhouse effect,
      Earth's average temperature would be about -18 degrees Celsius instead
      of the current +15 degrees Celsius.</p>
      <p>Here is how it works: sunlight passes through the atmosphere and warms
      the surface. The warm surface radiates heat back upward as infrared
      radiation. Greenhouse gases (CO\u2082, H\u2082O, CH\u2084) absorb some of this
      outgoing infrared and re-emit it in all directions, including back
      toward the surface. This extra downward radiation warms the surface
      further.</p>
      <p>The effect can run away. If the surface gets hot enough to evaporate
      all surface water, the water vapour itself is a powerful greenhouse gas,
      trapping even more heat. This runaway greenhouse is likely what happened
      to Venus.</p>
      ${o("The greenhouse effect works like a blanket on a cold night. Your body radiates heat; the blanket does not add heat, but it traps some of the heat you are already producing and sends it back to you, keeping you warmer than you would be without it.")}
      ${n("Greenhouse gases let sunlight in but trap outgoing heat, warming the surface. Too much greenhouse gas can trigger a runaway that boils away oceans.")}`,`<p>The greenhouse warming can be parameterised as an additive temperature
      increment ${e("\\Delta T_g")} above the equilibrium temperature:</p>
      ${r("T_{\\text{surf}} = T_{\\text{eq}} + \\Delta T_g")}
      <p>The optical depth ${e("\\tau")} of the atmosphere in the infrared
      governs the greenhouse strength. For a grey atmosphere:</p>
      ${r("T_{\\text{surf}} = T_{\\text{eq}} \\left(1 + \\frac{3\\tau}{4}\\right)^{1/4}")}
      ${u([["T_{\\text{surf}}","actual surface temperature (K)"],["T_{\\text{eq}}","equilibrium temperature (K)"],["\\tau","infrared optical depth"],["\\Delta T_g","greenhouse temperature increment (K)"]])}
      <p>For Earth, ${e("\\tau \\approx 1.9")} and ${e("\\Delta T_g \\approx 33")} K.</p>
      <p>A <b>runaway greenhouse</b> occurs when the outgoing longwave
      radiation reaches a maximum (the Simpson-Nakajima limit,
      ${e("\\sim 282")} W/m\xB2 for water vapour) and the planet absorbs more
      energy than it can radiate. The surface temperature increases without
      bound until all surface water is vaporised and eventually
      photodissociated.</p>
      ${p(["Planet","T_eq (K)","T_surf (K)","Greenhouse effect (K)"],[["Venus","227","737","+510"],["Earth","255","288","+33"],["Mars","210","218","+8"],["Titan","82","94","+12"]])}
      ${s("Pierrehumbert, R. T. (2010), Principles of Planetary Climate, Cambridge Univ. Press; Nakajima, S. et al. (1992), J. Atmos. Sci. 49, 2256.")}`,a),i("Boiling Point and Water",`<p>Whether liquid water can exist on a planet's surface depends on both
      temperature and atmospheric pressure. Water boils when its vapour
      pressure equals the surrounding atmospheric pressure. At lower
      pressures, water boils at lower temperatures.</p>
      <p>On Earth at sea level (1 atmosphere of pressure), water boils at
      100 degrees Celsius. On top of Mount Everest, where the pressure is
      about one-third of sea level, water boils at roughly 70 degrees
      Celsius. On Mars, with its extremely thin atmosphere (0.6% of Earth's),
      liquid water would boil almost instantly at any temperature above about
      0 degrees Celsius.</p>
      <p>This means that surface pressure is just as important as temperature
      when determining whether a planet can have oceans, lakes, or rivers.</p>
      ${o("Think of a pressure cooker in reverse. A pressure cooker raises the pressure so water boils at a higher temperature (useful for cooking). A planet with thin atmosphere is the opposite: water boils at a lower temperature, making surface liquid harder to maintain.")}
      ${n("Liquid water requires both the right temperature AND enough atmospheric pressure. Low-pressure worlds cannot sustain surface water even at moderate temperatures.")}`,`<p>The boiling point of water as a function of pressure is described by
      the Clausius-Clapeyron relation. For an idealised single-component
      system:</p>
      ${r("\\frac{1}{T_{\\text{boil}}} = \\frac{1}{373.15} - \\frac{R \\ln(P / 101325)}{L_v}")}
      ${u([["T_{\\text{boil}}","boiling point (K)"],["R","specific gas constant for water (461.5 J kg\u207B\xB9 K\u207B\xB9)"],["P","surface pressure (Pa)"],["L_v","latent heat of vaporisation (2.26 x 10\u2076 J/kg)"],["373.15","boiling point at 1 atm (K)"],["101325","standard atmosphere (Pa)"]])}
      <p>The triple point of water (611 Pa, 273.16 K) sets the absolute minimum
      pressure for liquid water to exist. Below 611 Pa, water can only exist
      as ice or vapour.</p>
      ${p(["Pressure","T_boil (C)","Context"],[["0.006 atm (611 Pa)","0.01","Triple point (Mars-like)"],["0.01 atm","7","Very thin atmosphere"],["0.1 atm","46","High altitude on Earth"],["1.0 atm","100","Earth sea level"],["10 atm","180","Venus-like pressure range"],["92 atm","~300","Venus surface pressure"]])}
      <p>For worldbuilding, the phase diagram of water determines whether a
      planet can sustain surface oceans. A planet with ${e("T_{\\text{surf}}")}
      between the freezing and boiling points at its surface pressure lies in
      the "liquid water zone" of the phase diagram.</p>
      ${s("Clausius, R. (1850), Ann. Phys. 155, 500; Pierrehumbert, R. T. (2010), Principles of Planetary Climate.")}`,a),T("Equilibrium Temperature Calculator",h('<label for="l10Lum">Stellar luminosity (L&#9737;)</label>',`<input type="number" id="l10Lum" value="1.0" min="0.001" max="100" step="0.001">
         <input type="range" id="l10LumSlider" min="0.001" max="100" step="0.001" value="1.0">`)+h('<label for="l10Dist">Orbital distance (AU)</label>',`<input type="number" id="l10Dist" value="1.0" min="0.1" max="10" step="0.01">
           <input type="range" id="l10DistSlider" min="0.1" max="10" step="0.01" value="1.0">`)+h('<label for="l10Albedo">Albedo</label>',`<input type="number" id="l10Albedo" value="0.3" min="0" max="0.9" step="0.01">
           <input type="range" id="l10AlbedoSlider" min="0" max="0.9" step="0.01" value="0.3">`)+q("l10Teq","Equilibrium temperature (K): "))].join("")}function L(a){let l=a.querySelector("#l10Lum"),d=a.querySelector("#l10LumSlider"),c=a.querySelector("#l10Dist"),m=a.querySelector("#l10DistSlider"),b=a.querySelector("#l10Albedo"),f=a.querySelector("#l10AlbedoSlider"),k=a.querySelector("#l10Teq");if(!l)return;function t(){let g=parseFloat(l.value)||1,w=parseFloat(c.value)||1,y=parseFloat(b.value)||0;d.value=g,m.value=w,f.value=y;let $=278.5*Math.pow(g,.25)/Math.pow(w,.5)*Math.pow(1-y,.25);k.textContent=v($,1)}l.addEventListener("input",t),d.addEventListener("input",()=>{l.value=d.value,t()}),c.addEventListener("input",t),m.addEventListener("input",()=>{c.value=m.value,t()}),b.addEventListener("input",t),f.addEventListener("input",()=>{b.value=f.value,t()}),t()}export{_ as buildLesson10,L as wireLesson10};
