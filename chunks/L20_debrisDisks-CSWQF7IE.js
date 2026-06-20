import{a as t,b as e,c as s,d as a,e as l,f as i,g as r,h as o}from"./chunk-L3XYPVN7.js";import"./chunk-VC46IEJQ.js";function p(n){return[i("What Are Debris Disks?",`<p>After the planets finish forming, not all the material in a
        stellar system gets incorporated into large bodies. A vast amount
        of leftover rubble remains: <strong>asteroids</strong>,
        <strong>comets</strong>, and <strong>dust</strong>. Collectively,
        this leftover material is called a <strong>debris disk</strong>.</p>
      <p>Our own solar system has two prominent debris structures: the
        <strong>asteroid belt</strong> between Mars and Jupiter (mostly
        rocky), and the <strong>Kuiper belt</strong> beyond Neptune (mostly
        icy). Many other stars show infrared excess from warm dust --
        evidence that they, too, harbour debris disks.</p>
      ${r("Think of a construction site after the buildings are done. There are piles of bricks, gravel, and sawdust left over. A debris disk is the cosmic equivalent -- rubble left behind after the planets were built.")}
      ${o("Debris disks are the leftover material from planet formation: asteroids, comets, and dust. Our asteroid belt and Kuiper belt are nearby examples.")}`,`<p>Debris disks are detected through thermal infrared excess above
        the stellar photosphere. The key observable is the
        <strong>fractional luminosity</strong>:</p>
      ${t("f = \\frac{L_{\\text{disk}}}{L_\\star}")}
      ${s([["f","fractional luminosity (disk-to-star luminosity ratio)"],["L_{\\text{disk}}","total thermal emission from the dust disk"],["L_\\star","stellar luminosity"]])}
      <p>Typical values range from ${e("f \\sim 10^{-3}")} for young,
        bright disks to ${e("f \\sim 10^{-7}")} for the solar system's
        zodiacal dust (near the detection limit of current surveys).</p>
      <p>Disk brightness declines with age as the reservoir of large bodies
        is ground down. Wyatt et al. (2007) found an empirical
        age-luminosity relation:</p>
      ${t("f \\propto t^{-1}")}
      <p>where ${e("t")} is stellar age. This is consistent with a
        steady-state collisional cascade in which the mass loss rate scales
        inversely with time.</p>
      ${l(["Age","Typical \\(f\\)","Example"],[["10 Myr","\\(10^{-3}\\)","Beta Pictoris"],["100 Myr","\\(10^{-4}\\)","Fomalhaut"],["1 Gyr","\\(10^{-5}\\)","Epsilon Eridani"],["4.6 Gyr","\\(10^{-7}\\)","Solar system (zodiacal dust)"]])}
      ${a("Wyatt et al. (2007, ApJ 658, 569); Hughes, Duch\xEAne & Matthews (2018, ARA&A 56, 541)")}`,n),i("Planetary Rings",`<p>Rings are a special kind of debris structure: material orbiting a planet so close that it cannot gather itself into a normal moon. Instead of accreting into a solid satellite, the material stays spread out as countless icy or rocky particles.</p>
      <p>This usually happens inside the planet's <strong>Roche limit</strong>, where tidal forces overpower the self-gravity of a loosely bound moon or rubble pile. Saturn's rings are the most famous example, but the same physics applies to faint ring systems around Jupiter, Uranus, Neptune, and many small bodies.</p>
      ${r("A moon outside the Roche limit is like flour that can clump into dough. Inside the Roche limit, the planet keeps stretching and stirring the flour so it stays as a thin dusty sheet instead of forming one ball.")}
      ${o("Rings are what you get when orbiting material lives inside the Roche limit instead of assembling into a moon.")}`,`<p>The classical fluid Roche limit is:</p>
      ${t("d_{\\text{Roche}} = 2.44\\;R_p\\;\\left(\\frac{\\rho_p}{\\rho_s}\\right)^{1/3}")}
      ${s([["d_{\\text{Roche}}","distance where tidal disruption occurs"],["R_p","planet radius"],["\\rho_p","planet mean density"],["\\rho_s","satellite or debris aggregate density"]])}
      <p>Inside this limit, disrupted material can survive as a ring because particle collisions damp relative motion faster than the material can re-assemble into a moon. Outside the Roche limit, reaccretion becomes much easier, so long-lived solid satellites are favoured.</p>
      <p>Caelum uses the same Roche-limit framing when it explains planetary rings: ring-supporting cases come from debris staying inside the disruption zone, while surviving moons occupy stable orbits outside it.</p>
      ${a("Roche (1849); Murray & Dermott (1999), Solar System Dynamics, Ch. 4; Charnoz et al. (2010, Nature 465, 752)")}`,n),i("Resonance Sculpting",`<p>Planets do not just sit passively in their orbits. Their gravity
        reaches out and shapes the debris around them, creating patterns of
        gaps and concentrations.</p>
      <p>At certain distances, a small body's orbital period forms a
        simple ratio with a planet's period (like 2:1 or 3:2). At these
        <strong>resonances</strong>, the planet's gravitational nudges
        accumulate, either ejecting debris (creating a gap) or trapping it
        (creating a concentration).</p>
      <p>Jupiter has carved several distinct gaps in the asteroid belt
        (called <strong>Kirkwood gaps</strong>) at resonance locations.
        Meanwhile, Neptune has captured a whole population of icy bodies
        (the <strong>Plutinos</strong>, including Pluto itself) in its 3:2
        resonance.</p>
      ${r("A planet's gravity creates invisible barriers and corrals in the debris disk, like a sheepdog herding asteroids into belts and gaps. The pattern depends on the simple number ratios between orbital periods.")}
      ${o("Planets carve gaps and concentrate material at orbital resonances. Jupiter's Kirkwood gaps and Neptune's Plutinos are textbook examples.")}`,`<p>Mean-motion resonances (MMR) occur where the orbital period ratio
        of a debris particle to a planet equals a ratio of small integers
        ${e("p:q")}. The resonant semi-major axis is:</p>
      ${t("a_{\\text{res}} = a_{\\text{planet}} \\times \\left(\\frac{p}{q}\\right)^{2/3}")}
      ${s([["a_{\\text{res}}","semi-major axis of the resonance location"],["a_{\\text{planet}}","semi-major axis of the perturbing planet"],["p:q","integer period ratio (e.g. 2:1, 3:2, 5:3)"]])}
      <p>Whether a resonance clears or traps material depends on the
        resonance order ${e("|p - q|")} and the planet's eccentricity.
        First-order resonances (${e("|p-q|=1")}) are generally the
        strongest.</p>
      ${l(["Resonance","\\(a_{\\text{res}} / a_{\\text{planet}}\\)","Solar system example"],[["2:1","1.587","Kirkwood gap (Jupiter), Hecuba gap"],["3:2","1.310","Plutinos (Neptune)"],["3:1","2.080","Kirkwood gap (Jupiter)"],["4:3","1.211","Thule group (Jupiter)"],["5:2","1.842","Kirkwood gap (Jupiter)"]])}
      <p>In resolved debris disks around other stars, resonant structures
        manifest as narrow rings, clumps, and asymmetries that can be used
        to infer the presence and mass of unseen planets.</p>
      ${a("Murray & Dermott (1999), Solar System Dynamics, Ch. 8; Wyatt (2003, ApJ 598, 1321)")}`,n),i("Composition and Condensation",`<p>What debris is made of depends on where it formed. Close to the
        star, where temperatures are high, only tough, heat-resistant
        materials survive: <strong>metals</strong> and <strong>rocky
        minerals</strong> (silicates). Farther out, where it is cold
        enough, <strong>ices</strong> -- water ice, carbon dioxide ice,
        ammonia ice -- can also condense.</p>
      <p>The boundary where water ice first becomes stable is called the
        <strong>frost line</strong> (or snow line). Inside the frost line,
        debris is predominantly rocky. Outside it, debris can be half ice
        by mass, making it less dense and more volatile.</p>
      ${r("Imagine walking away from a roaring furnace. Close up, only metal survives the heat. A few steps back, rock can form. Further away, wax can solidify. Even further, ice forms. Each material has its own distance threshold -- that is the condensation sequence.")}
      ${o("Close-in debris is rocky and metallic; far-out debris is icy. The frost line marks the transition, and its location depends on the star's luminosity.")}`,`<p>The <strong>condensation sequence</strong> describes the
        temperature thresholds at which different materials condense from
        the protoplanetary nebula gas at a reference pressure of
        ~${e("10^{-4}")} bar:</p>
      ${l(["Material","Condensation T (K)","Type"],[["Corundum (Al\\(_2\\)O\\(_3\\))","~1,700","Refractory oxide"],["Metallic iron / nickel","~1,450","Refractory metal"],["Silicates (olivine, pyroxene)","~1,300","Refractory rock"],["Troilite (FeS)","~700","Moderately volatile"],["Water ice (H\\(_2\\)O)","~170","Volatile ice"],["Ammonia ice (NH\\(_3\\))","~130","Volatile ice"],["Methane ice (CH\\(_4\\))","~70","Hyper-volatile ice"],["CO / N\\(_2\\) ice","~25","Hyper-volatile ice"]])}
      <p>The radial temperature profile in a protoplanetary disk falls
        roughly as:</p>
      ${t("T(r) \\approx T_0 \\left(\\frac{r}{1\\;\\text{AU}}\\right)^{-q}")}
      <p>with ${e("q \\approx 0.5\\text{--}0.75")} depending on the
        disk's optical depth and heating model. This maps each condensation
        temperature to a radial distance, defining the compositional
        zoning of the debris.</p>
      <p>The refractory mass fraction (metals + silicates) is about 0.4%
        of the total disk mass. Volatile ices add another ~1.5% beyond the
        frost line, meaning outer-disk planetesimals can be 4 times more
        massive per unit solid mass than inner-disk ones.</p>
      ${a("Lodders (2003, ApJ 591, 1220); Lewis (1974, Science 186, 440)")}`,n),i("Collisional Cascades",`<p>Debris disks do not stay the same forever. The asteroids and
        comets within them collide with each other, breaking into smaller
        and smaller pieces in a process called a <strong>collisional
        cascade</strong>.</p>
      <p>Large bodies smash into fragments, which smash into smaller
        fragments, which grind down to dust. The smallest dust grains
        are eventually blown out of the system by the star's radiation
        pressure or slowly spiral inward.</p>
      <p>This grinding process means that debris disks get fainter over
        time as the large bodies are consumed and the dust is removed.
        Young systems have bright, massive disks; old systems like ours
        have faint, tenuous ones.</p>
      ${r("Think of colliding rocks in a tumbler. Over time, the big rocks break into pebbles, the pebbles into sand, and the sand into fine powder. In space, the powder gets blown away by starlight, so the rubble pile slowly disappears.")}
      ${o("Asteroids collide and break apart in a collisional cascade, grinding down from large bodies to dust. The dust is removed by radiation pressure, so disks fade over time.")}`,`<p>In a steady-state collisional cascade, the size distribution of
        fragments follows the Dohnanyi (1969) power law:</p>
      ${t("\\frac{dN}{dR} \\propto R^{-3.5}")}
      ${s([["N","cumulative number of bodies"],["R","body radius"]])}
      <p>This corresponds to equal mass per logarithmic size bin -- most of
        the mass is in the largest bodies, but most of the cross-sectional
        area (and hence observability) is in the smallest grains.</p>
      <p>The <strong>collisional lifetime</strong> of a body of radius
        ${e("R")} in a disk of optical depth ${e("\\tau")} and orbital
        period ${e("P")} is approximately:</p>
      ${t("t_{\\text{coll}} \\sim \\frac{P}{4\\pi\\,\\tau}")}
      <p>For the asteroid belt (${e("\\tau \\sim 10^{-9}")}), a
        1 km body has a collisional lifetime of order 1 Gyr.</p>
      <p>Small grains below a critical size ${e("R_{\\text{blow}}")} are
        removed by radiation pressure on orbital timescales. Slightly
        larger grains spiral inward via <strong>Poynting-Robertson
        drag</strong>:</p>
      ${t("t_{\\text{PR}} = \\frac{4\\pi\\,c^2\\,\\rho\\,R\\,a^2}{3\\,L_\\star}")}
      ${s([["t_{\\text{PR}}","Poynting-Robertson inspiral time"],["c","speed of light"],["\\rho","grain density"],["R","grain radius"],["a","orbital semi-major axis"],["L_\\star","stellar luminosity"]])}
      <p>The combination of collisional grinding and radiation-driven
        removal produces the observed ${e("f \\propto t^{-1}")} decline
        in disk brightness.</p>
      ${a("Dohnanyi (1969, J. Geophys. Res. 74, 2531); Burns, Lamy & Soter (1979, Icarus 40, 1); Wyatt et al. (2007, ApJ 658, 569)")}`,n)].join("")}export{p as buildLesson20};
