import{a as o,b as t,c as i,d as n,e as p,f as s,g as c,h as a,i as R,j as h,k as q}from"./chunk-L3XYPVN7.js";import{j as S}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function L(e){return[s("The Roche Limit",`<p>Every planet has an invisible danger zone close to its surface. If a
        moon wanders too close, the difference in gravitational pull between
        the near side and far side of the moon becomes stronger than the
        moon's own gravity holding it together. The moon gets stretched and
        eventually torn apart, scattering its debris into a ring.</p>
      <p>This critical distance is called the <strong>Roche limit</strong>.
        Saturn's rings are a spectacular example: they sit inside Saturn's
        Roche limit, where no large moon could survive intact.</p>
      ${c("Imagine pulling on both ends of a ball of clay. If you pull gently, it stays together. Pull hard enough and it tears apart. The Roche limit is the distance at which the planet's tidal pull is strong enough to tear a moon apart.")}
      ${a("The Roche limit is the closest distance a moon can orbit before tidal forces rip it apart. Inside this limit, you get rings instead of moons.")}`,`<p>The classical Roche limit for a fluid (self-gravitating,
        zero-rigidity) satellite is:</p>
      ${o("d_\\text{Roche} = 2.44\\;R_p\\;\\left(\\frac{\\rho_p}{\\rho_m}\\right)^{1/3}")}
      ${i([["d_\\text{Roche}","orbital radius at which tidal disruption occurs"],["R_p","planet radius"],["\\rho_p","mean density of the planet"],["\\rho_m","mean density of the moon"]])}
      <p>For a rigid body (with internal material strength), the coefficient
        drops to ~1.26 instead of 2.44, because tensile strength helps
        resist tidal deformation. Real moons fall between these extremes
        depending on their composition and internal structure:</p>
      ${p(["Case","Coefficient","Applicable to"],[["Fluid (Roche 1849)","2.44","Rubble piles, loosely bound bodies"],["Rigid (Jeffreys 1947)","1.26","Monolithic rocky bodies"],["Typical rocky moon","~1.5 - 2.0","Partially differentiated bodies"]])}
      <p>Moons discovered inside the classical fluid Roche limit (e.g. Pan
        and Atlas inside Saturn's rings) survive because they are small
        enough for material strength to dominate over self-gravity.</p>
      ${n("Roche (1849); Murray & Dermott (1999), Solar System Dynamics, Ch. 4")}`,e),s("The Hill Sphere",`<p>Just as there is a minimum distance (the Roche limit), there is also
        a maximum distance at which a planet can keep a moon. Beyond a
        certain point, the star's gravity dominates and the moon drifts
        away.</p>
      <p>This outer boundary is called the <strong>Hill sphere</strong>.
        Every planet has one, and its size depends on the planet's mass and
        how far it orbits from the star. A planet far from its star with a
        large mass has a big Hill sphere; a small planet close to its star
        has a tiny one.</p>
      ${c("Think of the Hill sphere as a planet's gravitational 'yard'. Moons can roam freely inside the yard, but if they wander past the fence, the star takes over and pulls them away.")}
      ${a("The Hill sphere marks the outer boundary of a planet's gravitational influence. Moons must orbit well within it to remain stable.")}`,`<p>The Hill radius is derived from the restricted three-body problem:</p>
      ${o("r_\\text{Hill} = a\\;\\left(\\frac{M_p}{3\\,M_\\star}\\right)^{1/3}")}
      ${i([["r_\\text{Hill}","Hill sphere radius"],["a","planet's semi-major axis around the star"],["M_p","planet mass"],["M_\\star","stellar mass"]])}
      <p>In practice, moons are only stable well inside the Hill sphere. WorldSmith now uses a deliberately conservative long-term rule of thumb: roughly one-third of the Hill radius for prograde orbits, and about one-half for retrograde orbits, with an extra comfort margin before that outer edge. The exact stable region still depends on the full three-body context, but major regular moons usually sit far inside these limits.</p>
      ${p(["Body","Hill radius (10\\(^6\\) km)","Outermost major moon"],[["Earth","1.5","Moon (0.384 million km, 0.26 r_Hill)"],["Jupiter","53","Callisto (1.88 million km, 0.035 r_Hill)"],["Neptune","116","Triton (0.35 million km, 0.003 r_Hill)"]])}
      ${n("Hamilton & Burns (1991, Icarus 92, 118); Murray & Dermott (1999), Solar System Dynamics, Ch. 9")}`,e),s("Tidal Locking",`<p>Our Moon always shows the same face to Earth. This is not a
        coincidence \u2014 it is the result of billions of years of tidal
        friction. Early in its history the Moon rotated freely, but the
        gravitational pull of Earth created a tidal bulge in the Moon's
        rock. Friction from that bulge slowly drained the Moon's spin
        energy until its rotation period matched its orbital period
        exactly.</p>
      <p>Tidal locking is extremely common. Most large moons in the solar
        system are tidally locked to their planets. Smaller moons in close
        orbits lock fastest; distant moons may never lock at all.</p>
      ${c("Imagine spinning a ball on a string through thick honey. The honey's drag (tidal friction) gradually slows the spin until the ball always faces the same direction as it swings around.")}
      ${a("Tidal forces slow a moon's rotation over time until one face permanently points toward the planet. This is why we only ever see one side of our Moon.")}`,`<p>The timescale for a satellite to tidally lock (despinning from an
        initial spin ${t("\\omega_0")} to synchronous rotation) is
        approximately:</p>
      ${o("t_\\text{lock} \\approx \\frac{\\omega_0\\;a^6\\;I\\;Q}{3\\,G\\,M_p^2\\,k_2\\,R_m^5}")}
      ${i([["t_\\text{lock}","time to reach synchronous rotation"],["\\omega_0","initial spin angular velocity"],["a","orbital semi-major axis"],["I","moment of inertia of the satellite"],["Q","tidal quality factor (dissipation efficiency; lower = more dissipative)"],["G","gravitational constant"],["M_p","planet mass"],["k_2","Love number (tidal deformability; ~0.03 for rocky moons, ~0.3 for icy moons)"],["R_m","satellite radius"]])}
      <p>The strong dependence on ${t("a^6")} means that close-in moons lock
        quickly (Io locked in ~10 Myr) while distant moons may remain
        unlocked over the age of the solar system. The ${t("R_m^5")} term
        means larger moons are also easier to lock.</p>
      <p>Higher-order spin-orbit resonances (e.g. Mercury's 3:2 lock) can
        occur when orbital eccentricity is significant, preventing
        synchronous capture.</p>
      <p>The parent body also has a <strong>synchronous orbit</strong>, where
        a prograde moon's orbital period equals the parent's rotation
        period:</p>
      ${o("r_\\text{sync} = \\left(\\frac{G M_p}{\\Omega_p^2}\\right)^{1/3}")}
      <p>Inside this radius, a prograde moon orbits faster than the parent
        spins and normally migrates inward; outside it, a faster-spinning
        parent normally pushes the moon outward. WorldSmith reports this as
        a bounded context check, with missing mass or rotation returning
        unknown rather than a confident fate.</p>
      ${n("Gladman et al. (1996, Icarus 122, 166); Peale (1999, ARA&A 37, 533)")}`,e),s("Tidal Heating",`<p>When a moon's orbit is not perfectly circular, its distance to the
        planet changes continuously. As the moon moves closer and farther
        away on each orbit, the planet's tidal pull strengthens and weakens,
        flexing the moon's interior like a stress ball being squeezed and
        released. That flexing generates friction, and friction produces
        heat.</p>
      <p>Jupiter's moon Io is the most volcanically active body in the
        solar system because of this process. Io's orbit is kept slightly
        elliptical by gravitational tugs from Europa and Ganymede, ensuring
        constant tidal flexing and relentless volcanism.</p>
      ${c("Bend a paperclip back and forth rapidly and it gets hot at the bend. Tidal heating works the same way: the planet repeatedly flexes the moon, and internal friction turns that mechanical energy into heat.")}
      ${a("Orbital eccentricity causes a moon to be tidally flexed every orbit. The resulting internal friction heats the moon, powering volcanism and potentially maintaining subsurface oceans.")}`,`<p>The equilibrium tidal heating rate for a synchronously rotating
        satellite on an eccentric orbit (Peale et al. 1979):</p>
      ${o("\\dot{E} = \\frac{21}{2}\\;\\frac{k_2}{Q}\\;\\frac{G\\,M_p^2\\,R_m^5\\,n\\,e^2}{a^6}")}
      ${i([["\\dot{E}","tidal heating power (W)"],["k_2","satellite's tidal Love number (~0.03 for Io)"],["Q","tidal quality factor (~100 for Io)"],["G","gravitational constant (6.674 \\times 10^{-11})"],["M_p","planet mass"],["R_m","satellite radius"],["n","orbital mean motion = \\sqrt{G M_p / a^3}"],["e","orbital eccentricity"],["a","orbital semi-major axis"]])}
      <p>For Io (${t("k_2 \\approx 0.03")}, ${t("Q \\approx 100")},
        ${t("e \\approx 0.004")}), this yields ~100 TW, consistent with
        the observed heat flux of ~2.5 W/m${t("^2")}. The ${t("e^2")}
        dependence means even a modest eccentricity produces substantial
        heating, while the ${t("a^{-6}")} term makes close-in moons
        far more susceptible.</p>
      <p>Resonant orbital configurations (e.g. Io-Europa-Ganymede Laplace
        resonance) maintain forced eccentricities that prevent tidal
        circularisation, sustaining heating over geological timescales.</p>
      <p>WorldSmith now labels that pump-damp balance qualitatively. Resonance
        or manual forced-eccentricity floors can mark heating as
        <strong>maintained</strong>; isolated moons with no sustained forcing
        tend toward <strong>damping</strong>; very high forced eccentricity
        and high heat become <strong>overdriven</strong>; weak or incomplete
        inputs remain <strong>uncertain</strong>.</p>
      <p>The app keeps <strong>current tidal heat</strong> separate from
        <strong>sustained tidal support</strong>. That shared dynamical context
        can improve or reduce habitability persistence confidence, but it does
        not claim that a subsurface ocean is permanent.</p>
      ${n("Peale, Cassen & Reynolds (1979, Science 203, 892); Segatz et al. (1988, Icarus 75, 187)")}`,e),s("Orbital Fate",`<p>Tidal forces do not just heat moons \u2014 they also change their orbits
        over time. Depending on the situation, a moon can:</p>
      <ul>
        <li><strong>Spiral outward</strong> \u2014 Our Moon is slowly drifting away
            from Earth at about 3.8 cm per year. Earth's spin is faster than
            the Moon's orbital period, so tidal friction transfers energy
            from Earth's rotation to the Moon's orbit.</li>
        <li><strong>Spiral inward</strong> \u2014 Mars's moon Phobos orbits faster
            than Mars rotates, so tidal friction steals orbital energy.
            Phobos is expected to either crash into Mars or be torn apart
            into a ring in roughly 50 million years.</li>
        <li><strong>Remain stable</strong> \u2014 When a moon is tidally locked
            and its orbit is nearly circular, orbital evolution slows
            dramatically.</li>
      </ul>
      ${a("Tidal forces slowly push or pull moons, changing their orbits over billions of years. Whether a moon spirals in, spirals out, or stays put depends on the relative spin rates of the planet and moon.")}`,`<p>The rate of tidal orbital evolution depends on the dissipation in
        the planet. For a moon raising tides on its host planet, the
        semi-major axis evolves as:</p>
      ${o("\\frac{da}{dt} = \\text{sgn}(\\Omega_p - n)\\;\\frac{3\\,k_{2p}}{Q_p}\\;\\frac{M_m}{M_p}\\;\\frac{R_p^5}{a^4}\\;n")}
      ${i([["da/dt","rate of change of semi-major axis"],["\\Omega_p","planet spin angular velocity"],["n","moon's orbital mean motion"],["k_{2p}","planet's Love number"],["Q_p","planet's tidal quality factor"],["M_m","moon mass"],["R_p","planet radius"]])}
      <p>When ${t("\\Omega_p > n")} (planet spins faster than the moon
        orbits), the tidal bulge leads the moon and torques it outward
        (Earth-Moon case). When ${t("\\Omega_p < n")}, the bulge lags
        and the moon spirals inward (Phobos).</p>
      ${p(["System","da/dt","Fate"],[["Earth-Moon","+3.8 cm/yr","Outward recession; Moon reaches ~1.2 r_Hill limit"],["Mars-Phobos","-1.8 cm/yr","Inward spiral; disruption in ~50 Myr"],["Jupiter-Io","~0 (resonance-locked)","Stable; Laplace resonance maintains e"]])}
      <p>For systems with multiple modeled moons, WorldSmith also summarizes a
        parent moon-system torque budget. The first pass uses a mass-weighted
        migration-rate proxy, so it can say net outward, net inward, or
        balanced without pretending to know the exact physical torque of a
        simplified exomoon system.</p>
      ${n("Goldreich & Soter (1966, Icarus 5, 375); Bills et al. (2005, J. Geophys. Res. 110, E07004)")}`,e),s("Moon Worlds in WorldSmith",`<p>WorldSmith now treats moons as small worlds rather than only tidal case studies. The Moon page derives a first-pass atmosphere, hydrosphere, climate, geology, biosphere, radiation, and habitability output from the same saved moon inputs used elsewhere in the app.</p>
      <p>The page also separates moon science into <strong>Hydrosphere</strong>, <strong>Atmosphere</strong>, and <strong>Orbital Coupling</strong> modes. Core mode keeps the simple defaults, while Full and Manual expose more of the volatile, atmosphere, resonance, and shielding assumptions behind the result.</p>
      <p>That means a moon can be airless, haze-shrouded, frozen, ocean-bearing, cryovolcanic, radiation-limited at the surface, or even biologically active depending on its orbit, composition, volatile inventory, and parent-body environment.</p>
      <p>For exposed surface-life cases around cool stars, WorldSmith now applies a paper-informed calibration layer that checks whether the moon is massive enough, whether the giant host is favorable enough, and whether the orbital setup is more like a defensible surface-habitable regime than a merely warm iceball.</p>
      ${a("Surface habitability and subsurface potential are not the same thing. A moon can host a subsurface ocean and still remain surface-sterile under the current policy, especially under harsh parent-belt radiation.")}`,`<p>In the current model, moon-world outputs are built in layers: volatile retention and greenhouse define the atmosphere, the hydrosphere model distinguishes dry / surface-liquid / frozen / subsurface-ocean / steam cases, the climate model adds parent-coupled illumination, eclipse forcing, collapse-risk diagnostics, and conservative circumplanetary stability checks, radiation combines parent belts with atmosphere and magnetic shielding, geology estimates resurfacing and volatile replenishment, and the biosphere gate checks whether exposed surface conditions remain viable.</p>
      <p>The Moon page now exposes separate <strong>Hydrosphere</strong>, <strong>Atmosphere</strong>, and <strong>Orbital Coupling</strong> modes. In Full and Manual orbital-coupling modes, sibling moons are solved together first so the engine can tag resonance support, Laplace-chain membership, forced eccentricity floors, a derived tidal-habitable-zone context, and formation scenarios before the single-moon climate stack runs.</p>
      <p>Volatile availability is also mode-sensitive: Core mode keeps the lightweight density-based heuristic, while Full and Manual can use explicit water inventory, ammonia fraction, composition override, and manual atmospheric requests before the atmosphere solver runs.</p>
      <p>Surface and subsurface outcomes are now separated explicitly. A moon can return <strong>surface ocean plausible</strong>, <strong>radiation-limited surface ocean</strong>, or <strong>subsurface ocean plausible</strong> depending on atmosphere retention, intrinsic and induced magnetic shielding, and whether the moon lies inside or outside the stellar habitable zone.</p>
      <p>For exposed surface cases, the stellar habitable zone now comes from the star engine when available, then gets filtered through moon-specific cautions for very low-mass stars where compressed Hill-stable space and strong early XUV make surface-habitable moons harder to sustain.</p>
      <p>WorldSmith now adds a paper-informed <strong>cool-star surface calibration</strong> on top of those gates for exposed surface-life cases. That layer uses moon mass, host giant mass, parent orbital distance, composition, and spin state to decide whether the current moon sits in a defensible surface-habitable regime or below the current mass floor for an atmosphere-bearing exposed surface.</p>
      <p>The spin model is no longer just locked or not locked. A moon can now remain in <strong>1:1 synchronous</strong>, <strong>3:2 resonance</strong>, or a non-resonant / not-yet-tidally-evolved state. A justified 3:2 state modestly softens permanent contrast relative to 1:1 lock, which can help some cool-star surface cases without bypassing the rest of the climate and atmosphere gates.</p>
      <p>This calibration is intentionally narrow: it only applies to long-lived <strong>surface</strong> atmosphere + liquid-water outcomes around cool stars. It does not erase subsurface-ocean candidates outside the stellar habitable zone, and it does not claim that the moon stack is now a first-principles exomoon solver.</p>
      <p>The exported world file stores the moon inputs, and the atmosphere / hydrosphere / climate / geology / biosphere / habitability outputs are recomputed from those inputs after load. This keeps moon-world behavior consistent across the Moon page, visualizer, import/export, and other snapshot-driven consumers.</p>
      ${a("A strong moon habitability score can still come from subsurface support rather than exposed surface life, and a moon outside the stellar habitable zone can remain a credible subsurface-ocean candidate.")}`,e),R("Tidal Heating",`${h('<label for="les12-mass">Planet mass (M<sub>&#8853;</sub>)</label>',`<input id="les12-mass" type="number" min="1" max="1000" step="1" value="318">
         <input id="les12-massSlider" type="range" min="1" max="1000" step="1" value="318">`)}
      ${h('<label for="les12-moonR">Moon radius (km)</label>',`<input id="les12-moonR" type="number" min="100" max="5000" step="10" value="1822">
         <input id="les12-moonRSlider" type="range" min="100" max="5000" step="10" value="1822">`)}
      ${h('<label for="les12-dist">Orbital distance (km)</label>',`<input id="les12-dist" type="number" min="100000" max="2000000" step="1000" value="422000">
         <input id="les12-distSlider" type="range" min="100000" max="2000000" step="1000" value="422000">`)}
      ${h('<label for="les12-ecc">Eccentricity</label>',`<input id="les12-ecc" type="number" min="0" max="0.3" step="0.001" value="0.004">
         <input id="les12-eccSlider" type="range" min="0" max="0.3" step="0.001" value="0.004">`)}
      ${q("les12-heat","Tidal heating (TW): ")}`)].join("")}function j(e){let m=e.querySelector("#les12-mass"),y=e.querySelector("#les12-massSlider"),b=e.querySelector("#les12-moonR"),v=e.querySelector("#les12-moonRSlider"),w=e.querySelector("#les12-dist"),k=e.querySelector("#les12-distSlider"),x=e.querySelector("#les12-ecc"),M=e.querySelector("#les12-eccSlider"),_=e.querySelector("#les12-heat");if(!m||!_)return;function u(){let r=parseFloat(m.value)||318,l=parseFloat(b.value)||1822,T=parseFloat(w.value)||422e3,g=parseFloat(x.value)||.004;y.value=r,v.value=l,k.value=T,M.value=g;let $=6674e-14,f=r*5972e21,H=l*1e3,d=T*1e3,E=Math.sqrt($*f/(d*d*d)),W=21/2*(.03/100)*$*f*f*Math.pow(H,5)*E*g*g/Math.pow(d,6)/1e12;_.textContent=S(W,4)}let I=[[m,y],[b,v],[w,k],[x,M]];for(let[r,l]of I)r.addEventListener("input",u),l.addEventListener("input",()=>{r.value=l.value,u()});u()}export{L as buildLesson12,j as wireLesson12};
