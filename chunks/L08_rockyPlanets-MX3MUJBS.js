import{a as o,b as w,c as f,d as i,e as a,f as t,g as p,h as r,i as M,j as g,k as d}from"./chunk-B66B57MG.js";import{A as c}from"./chunk-JAT3QFT3.js";import"./chunk-FFUDGKDT.js";function T(e){return[t("What Makes a Rocky Planet",`<p>Rocky (or "terrestrial") planets are built from two main ingredients:
      an iron-nickel core and a silicate (rock) mantle surrounding it. The
      proportion of iron core to total mass is called the <b>core mass
      fraction</b> (CMF), and it is one of the most important properties
      determining a rocky planet's density and internal structure.</p>
      <p>Earth's core makes up about 33% of its total mass. Mercury, by
      contrast, has an unusually large core at roughly 70% of its mass,
      making it the densest terrestrial planet relative to its size.</p>
      ${p("A rocky planet is like a chocolate truffle: a dense metal centre (the chocolate ganache) surrounded by a lighter rocky shell (the chocolate coating). The ratio of centre to coating determines the overall density.")}
      ${r("The core mass fraction (CMF) is the key variable for rocky planets. More iron core means a denser, more compact world.")}`,`<p>Terrestrial planets differentiate into a metallic core (primarily
      Fe-Ni) and a silicate mantle (Mg, Si, O compounds). The <b>core mass
      fraction</b> (CMF) is defined as:</p>
      ${o("\\text{CMF} = \\frac{M_{\\text{core}}}{M_{\\text{planet}}}")}
      <p>CMF correlates with the host star's iron-to-silicate ratio. Schulze
      et al. (2021) showed that stellar Fe/Mg and Fe/Si abundances can predict
      planetary CMF to within roughly 10%.</p>
      ${a(["Body","CMF","Bulk density (g/cm\xB3)"],[["Mercury","~0.70","5.43"],["Venus","~0.32","5.24"],["Earth","~0.33","5.51"],["Mars","~0.24","3.93"],["Moon","~0.02","3.34"]])}
      <p>Higher CMF produces a smaller radius at the same mass because iron is
      denser than silicate. This is the basis of mass-radius models for
      exoplanet characterisation.</p>
      ${i("Schulze, J. G. et al. (2021), Planet. Sci. J. 2, 113.")}`,e),t("Mass and Radius",`<p>A common misconception is that a planet twice as massive as Earth would
      be twice as large. In reality, the relationship between mass and radius
      is much shallower. Doubling the mass only increases the radius by about
      20%, because the added material compresses the interior under its own
      gravity.</p>
      <p>Water content also matters enormously. A planet with a thick layer of
      water or ice on top of its rocky interior will be noticeably larger than
      a dry planet of the same mass, because water is much less dense than
      rock.</p>
      ${p("Think of stacking pillows versus stacking bricks. Adding more bricks (dense rock and iron) to a pile does not make it much taller because the weight compresses the bottom layers. Adding pillows (water, ice) puffs up the stack without adding much weight.")}
      ${r("Mass and radius are not proportional. More mass means stronger self-compression, so bigger planets are proportionally smaller than you might expect.")}`,`<p>For dry rocky planets with Earth-like composition, Zeng and Sasselov
      (2013, 2016) provide a power-law approximation:</p>
      ${o("R_{\\text{dry}} = 1.00 \\times M^{0.270} \\; R_\\oplus")}
      ${f([["R_{\\text{dry}}","planet radius (Earth radii), dry composition"],["M","planet mass (Earth masses)"]])}
      <p>The exponent 0.270 (less than 1/3) reflects gravitational
      self-compression. For comparison, a constant-density sphere would give
      ${w("R \\propto M^{1/3}")}.</p>
      <p>Water content inflates the radius. A 50% water-mass-fraction planet is
      roughly 20-30% larger than a dry planet of the same mass. The water
      layer adds volume without proportional mass.</p>
      ${a(["Mass (M Earth)","R dry (R Earth)","R 50% water"],[["0.5","0.83","~1.00"],["1.0","1.00","~1.25"],["2.0","1.21","~1.50"],["5.0","1.52","~1.90"],["10.0","1.86","~2.30"]])}
      ${i("Zeng, L. & Sasselov, D. (2013), PASP 125, 227; (2016), ApJ 819, 127.")}`,e),t("Surface Gravity and Escape Velocity",`<p><b>Surface gravity</b> is the pull you would feel standing on the
      planet's surface. It depends on both the planet's mass and its size. A
      more massive planet has stronger gravity, but a larger planet (at the
      same mass) has weaker surface gravity because you are farther from the
      centre.</p>
      <p><b>Escape velocity</b> is the speed an object must reach to fly away
      from the planet and never fall back. It determines whether a planet can
      hold onto an atmosphere: if gas molecules move faster than the escape
      velocity, they drift off into space.</p>
      ${p("Surface gravity is how hard you are pulled down when standing still. Escape velocity is how fast you need to throw a ball straight up so it never comes back down. Both get stronger with more mass, but a bigger planet spreads that mass out.")}
      ${r("Surface gravity controls everyday experience (weight, atmosphere pressure). Escape velocity controls whether the planet can keep its atmosphere over billions of years.")}`,`<p>Surface gravity is derived from Newton's law of gravitation:</p>
      ${o("g = \\frac{G M}{R^2} = 9.81 \\frac{M / M_\\oplus}{(R / R_\\oplus)^2} \\; \\text{m/s}^2")}
      <p>Escape velocity is the minimum speed to escape a planet's gravitational
      well from its surface:</p>
      ${o("v_{\\text{esc}} = \\sqrt{\\frac{2 G M}{R}} = \\sqrt{2 g R}")}
      ${f([["g","surface gravitational acceleration"],["G","gravitational constant (6.674 x 10\u207B\xB9\xB9 N m\xB2 kg\u207B\xB2)"],["M","planet mass"],["R","planet radius"],["v_{\\text{esc}}","escape velocity"]])}
      <p>For reference, Earth's surface gravity is 9.81 m/s\xB2 and its escape
      velocity is 11.2 km/s.</p>
      ${a(["Body","g (m/s\xB2)","v_esc (km/s)"],[["Moon","1.62","2.38"],["Mars","3.72","5.03"],["Earth","9.81","11.19"],["Super-Earth (5 M)","~14.5","~16.6"],["Venus","8.87","10.36"]])}`,e),t("Composition Types",`<p>Rocky planets come in a range of compositions, from iron-dominated
      worlds to water-rich ocean planets. Here are the main categories:</p>
      ${a(["Type","Description","Real example"],[["Iron world","Mostly metal, very small rocky mantle","---"],["Mercury-like","Large iron core (~60-70% CMF), thin mantle","Mercury"],["Earth-like","Moderate core (~30-35% CMF), thick mantle","Earth, Venus"],["Mars-like","Smaller core (~20-25% CMF), thicker mantle","Mars"],["Coreless","Almost no iron core, pure silicate","---"],["Ocean world","Rocky interior + deep global ocean","---"]])}
      ${r("The iron-to-rock ratio is set during formation and determines the planet's density, magnetic field potential, and tectonic behaviour.")}`,`<p>Composition categories are defined by CMF and water mass fraction
      (WMF):</p>
      ${a(["Type","CMF","WMF","Bulk density (g/cm\xB3)"],[["Iron world","> 0.60","0","6.5-8.0"],["Mercury-like","0.50-0.70","0","5.3-6.5"],["Earth-like","0.26-0.36","0","5.0-5.5"],["Mars-like","0.18-0.26","0","3.8-5.0"],["Coreless","< 0.05","0","3.0-3.5"],["Ocean world","0.10-0.33","> 0.01","2.5-4.5"],["Water world","0.10-0.33","> 0.25","1.5-3.0"]])}
      <p>CMF affects more than density. High-CMF planets are more likely to
      generate a strong magnetic dynamo (protecting the atmosphere from
      stellar wind stripping). Low-CMF planets may lack plate tectonics
      because the mantle is too thick relative to the core's heat output.</p>
      <p>Water mass fraction above ~0.01 (1%) produces observable radius
      inflation and potentially global surface oceans if the temperature
      permits liquid water.</p>
      ${i("Zeng, L. et al. (2016), ApJ 819, 127; Schulze, J. G. et al. (2021), Planet. Sci. J. 2, 113.")}`,e),t("Exotic Subtypes",`<p>Some planets are still rocky or volatile worlds underneath, but their
      observed evidence suggests a more specific subtype. Caelum treats
      these as <b>overlays</b>: a planet can remain a rocky world while also
      being flagged as carbon-rich, lava-dominated, oceanic, icy, stripped, or
      isolated from its star.</p>
      <p>The subtype label is intentionally conservative. It is a clue about
      which assumptions deserve caution, not a guarantee that the planet has a
      single simple nature.</p>
      ${a(["Subtype","Evidence","Model caution"],[["Carbon-rich","High carbon/rock signal or authored carbon evidence","Surface minerals, colour, and volatile chemistry may differ from Earth-like silicates"],["Ocean or water world","High water fraction, low density, or ocean-friendly state","Deep water can hide the rocky surface and suppress familiar tectonics"],["Lava world","Very high equilibrium or surface temperature","Climate and habitability pages should not treat the surface as temperate land"],["Icy dwarf","Low mass, cold orbit, and volatile retention","Surface inventory may be dominated by ice rather than exposed silicate rock"],["Chthonian","Dense close-in remnant with stripped-envelope evidence","The body may be the core of a former volatile or giant planet"],["Rogue","No stellar host or explicit rogue-candidate context","Temperature depends more on stored/internal heat than sunlight"]])}
      ${r("Subtype labels add evidence-aware context while preserving the broad planet family. A lava world is still solved as a planet; the overlay explains where normal surface assumptions become risky.")}`,`<p>Caelum's subtype overlays combine broad physical
      classification with optional evidence fields such as bulk density,
      carbon-richness, internal heat flux, tidal heat flux,
      stripped-envelope history, migration history, and rogue-candidate
      context. The output records both the matching subtype and a
      confidence/applicability note for downstream pages.</p>
      <p>The same overlay layer covers carbon-rich, ocean/water, lava world,
      icy dwarf, chthonian, rogue, and volatile-envelope cases when the
      evidence supports them.</p>
      <p>This matters because many familiar page models assume a solid surface
      under starlight. A lava world can keep thermal and orbital outputs but
      needs climate caution; a rogue world may still have internal heat but not
      ordinary daylight; a chthonian candidate may share the mass of a rocky
      planet while having a very different history.</p>
      ${a(["Evidence field","Why it helps"],[["Bulk density","Separates dense stripped cores from puffier volatile-rich bodies"],["Carbon-richness","Flags alternate mineral and volatile chemistry"],["Internal heat flux","Supports subsurface or rogue-world thermal context"],["Tidal heat flux","Distinguishes star-heated worlds from tidally stressed worlds"],["Stripped-envelope history","Raises confidence for chthonian remnant candidates"],["Migration history","Explains close-in remnants that formed farther out"],["Rogue-candidate context","Prevents unsupported pages from assuming normal stellar forcing"]])}
      ${i("Madhusudhan, N. et al. (2012), ApJ 759, L40; Leger, A. et al. (2011), Icarus 213, 1; Raymond, S. N. et al. (2008), ApJ 687, L107.")}`,e),M("Planet Properties Calculator",g('<label for="l08Mass">Planet mass (M&#8853;)</label>',`<input type="number" id="l08Mass" value="1.0" min="0.01" max="10" step="0.01">
         <input type="range" id="l08MassSlider" min="0.01" max="10" step="0.01" value="1.0">`)+g('<label for="l08CMF">Core mass fraction</label>',`<input type="number" id="l08CMF" value="0.33" min="0" max="0.8" step="0.01">
           <input type="range" id="l08CMFSlider" min="0" max="0.8" step="0.01" value="0.33">`)+d("l08Radius","Radius (R&#8853;): ")+d("l08Gravity","Surface gravity (m/s\xB2): ")+d("l08EscVel","Escape velocity (km/s): "))].join("")}function A(e){let n=e.querySelector("#l08Mass"),h=e.querySelector("#l08MassSlider"),u=e.querySelector("#l08CMF"),m=e.querySelector("#l08CMFSlider"),k=e.querySelector("#l08Radius"),S=e.querySelector("#l08Gravity"),x=e.querySelector("#l08EscVel");if(!n)return;function s(){let y=parseFloat(n.value)||1,v=parseFloat(u.value)||.33;h.value=y,m.value=v;let C=1-.3*(v-.33),l=Math.pow(y,.27)*C,b=9.81*y/(l*l),F=Math.sqrt(2*b*l*6371e3)/1e3;k.textContent=c(l,3),S.textContent=c(b,2),x.textContent=c(F,2)}n.addEventListener("input",s),h.addEventListener("input",()=>{n.value=h.value,s()}),u.addEventListener("input",s),m.addEventListener("input",()=>{u.value=m.value,s()}),s()}export{T as buildLesson08,A as wireLesson08};
