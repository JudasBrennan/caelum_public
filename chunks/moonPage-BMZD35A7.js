import{c as Ia,d as Ct}from"./chunk-DU3XAW43.js";import{a as ka,b as Ea,c as St}from"./chunk-CXIGSPAD.js";import{a as Ra,b as $a}from"./chunk-HPRB6J7V.js";import{b as ma,c as pa,d as ha,e as ya,f as yt,g as bt,h as vt,i as gt,j as Ma,k as Sa,l as Ca,m as xa}from"./chunk-IW3FGYCV.js";import"./chunk-X5HJXCPV.js";import{b as Aa}from"./chunk-SIP25B6Y.js";import{e as ft,f as pe,j as Mt}from"./chunk-4CDBXSKU.js";import"./chunk-DFN46JRM.js";import{a as fa}from"./chunk-PCXLDNQS.js";import{a as la}from"./chunk-WYZYYRUA.js";import{a as da,b as ua}from"./chunk-33KDSHUT.js";import{b as Pa}from"./chunk-RXYFSAKD.js";import{a as ca,b as ue}from"./chunk-NIMK63G7.js";import{i as ht}from"./chunk-DJYQUSDU.js";import{a as ga}from"./chunk-FZEHZHVH.js";import{a as va}from"./chunk-NCELRTS6.js";import{a as N,b as me,d as ba,e as wa}from"./chunk-4HEO5JKX.js";import{b as E,c as pt}from"./chunk-XMLMEZIZ.js";import"./chunk-LAMR64J5.js";import"./chunk-7PVDVLB6.js";import"./chunk-5SEMLOPL.js";import{$a as ra,D as Zt,Ga as xe,Ha as we,Ia as Yt,Ka as Jt,Q as Xt,Qa as ea,Sa as Pe,Ta as ae,Ua as ta,Va as aa,Wa as oa,Xa as ia,Ya as ke,_a as na,hb as mt,ob as de,vb as sa,za as q}from"./chunk-5YAI7LVZ.js";import{ra as Qt}from"./chunk-O3V645ME.js";import"./chunk-WNGVR2CK.js";import{S as Wt,h as _t,m as Vt,n as zt}from"./chunk-PEDZU4MZ.js";import{j as m}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function xt(s,u){return E("option",{attrs:{value:s==null?"":String(s)},text:u==null?"":String(u)})}function Ta(s,u=[]){return u.length?E("optgroup",{attrs:{label:s}},u.map(b=>xt(b?.value,b?.label))):null}function Na(s,{planets:u=[],gasGiants:b=[],selectedValue:h="",disabled:C=!1,title:P=""}={}){pt(s,[xt("","Unassigned"),Ta("Planets",(u||[]).map(k=>({value:k?.moonParentId||k?.id||"",label:`${k?.name||k?.inputs?.name||k?.id||"Planet"}${k?.classification?.displayLabel?` - ${k.classification.displayLabel}`:""}`}))),Ta("Gas Giants",(b||[]).map(k=>({value:k?.moonParentId||k?.id||"",label:`${k?.name||k?.id||"Gas Giant"}${k?.classification?.displayLabel?` - ${k.classification.displayLabel}`:""}`})))]);let o=h==null?"":String(h);return s.value=[...s.options].some(k=>k.value===o)?o:"",s.disabled=!!C,s.title=P||"",s}function Ha(s,u=[],b=""){let h=Array.isArray(u)?u:[];if(pt(s,h.map(o=>xt(o?.id||"",o?.name||o?.inputs?.name||o?.id||"Moon"))),!h.length)return s.value="",s;let C=String(b||""),P=String(h[0]?.id||"");return s.value=[...s.options].some(o=>o.value===C)?C:P,s}function Fa(s,u=[]){return pa(s,u)}function Oa(s,u={}){return $a(s,u,{id:"moonResultSummary",className:"moon-result-summary",subject:"Moon",ariaLabel:"Moon result summary"})}function Ga(s,u=[],b={}){return ma(s,u,b),s}function no(s){let u=s?.preview||{},b=u?.tides||{},h=u?.inputs||{},C=u?.physical||{},P=String(b?.compositionClass||""),o=String(s?.id||""),k=Number(b?.tidalHeatingEarth)||0,n=Number(h?.albedo)||0,j=Number(C?.radiusMoon)||0;return o==="irregular-capture"?"Dark captured rubble body":o==="phobos"||o==="deimos"?"Tiny captured moonlet":k>=12?"Volcanic resurfacing world":k>=1&&P==="Subsurface ocean"?"Fractured ice over an interior ocean":P==="Subsurface ocean"?"Ice shell with likely ocean below":P==="Icy"||P==="Very icy"?"Bright frozen surface":P==="Mixed rock/ice"&&j>=1.2&&n<=.25?"Cold haze-prone ice-rock moon":P==="Mixed rock/ice"?"Blended rock and ice surface":P==="Partially molten"?"Heated molten companion":j<.05?"Small irregular capture":"Rocky major moon"}function La(s=[]){let u=[...new Set((s||[]).map(b=>b?.category).filter(Boolean))];return E("div",{className:"rp-picker-overlay rp-picker-overlay--moon"},[E("div",{className:"rp-picker-dialog rp-picker-dialog--moon panel"},[E("div",{className:"panel__header"},[E("div",{className:"rp-picker-heading"},[E("h2",{text:"Moon Recipes"}),E("div",{className:"rp-picker-subtitle",text:"Pick a visual and physical starting point for the current moon."})]),E("button",{className:"small rp-picker-close",attrs:{type:"button"},text:"Close"})]),E("div",{className:"rp-picker-progress"},[E("span")]),E("div",{className:"panel__body"},u.flatMap(b=>[E("div",{className:"rp-picker-category",text:b}),E("div",{className:"rp-picker-grid"},(s||[]).filter(h=>h?.category===b).map(h=>E("div",{className:"rp-picker-card",dataset:{recipe:h?.id||""}},[E("canvas",{attrs:{width:"90",height:"90"}}),E("div",{className:"rp-picker-card__label",text:h?.label||h?.id||"Moon recipe"}),E("div",{className:"rp-picker-card__hint",text:h?.hint||no(h)})])))]))])])}function wt(){return va({overlayClassName:"rp-picker-overlay--moon moon-guided-overlay",dialogClassName:"rp-picker-dialog--moon moon-guided-dialog",closeButtonClassName:"moon-guided-overlay__close",contentClassName:"moon-guided-overlay__content",closeLabel:"Close moon guided creation"})}var R={"Star Mass":`Host star mass in solar masses.

Sun = 1 Msol.`,"Star Radius":`Host star radius in solar radii.

Sun = 1 Rsol.`,"Star Luminosity":`Host star luminosity in solar luminosities.

Sun = 1 Lsol.`,"Star Age":"Age of the host star in billions of years.","Planet Mass":`Parent planet mass in Earth masses.

Earth = 1 MEarth.`,"Planet CMF":"Parent planet core mass fraction.","Planet Density":`Parent planet bulk density in g/cm\xB3.

Earth = 5.51 g/cm\xB3.`,"Planet Radius":`Parent planet radius in Earth radii.

Earth = 1 REarth = 6,371 km.`,"Planet Gravity":`Surface gravity at sea level on the parent planet.

Earth = 1 g = 9.8 m/s\xB2.`,"Planet Semi-Major Axis":`Orbital distance of the parent planet from the host star in AU.

Earth = 1 AU.`,"Planet Eccentricity":`Orbital eccentricity of the parent planet.

Earth = 0.0167.`,"Planet Periapsis":"Closest approach of the parent planet to the host star during orbit.","Planet Orbital Period":"Orbital period (year length) of the parent planet in Earth days.","Planet Rotation Period":"Rotation period (day length) of the parent planet in Earth hours.",Mass:`Moon mass in lunar masses. Moons should be less massive than their parent planet.

Moon = 1 MMoon = 7.342E22 kg.`,Density:`Bulk density of the moon in g/cm\xB3. Rocky moons typically exceed 3 g/cm\xB3.

Moon = 3.34 g/cm\xB3.`,Radius:`Moon radius in lunar radii. Major moons typically exceed 0.173 RMoon.

Moon = 1 RMoon = 1,736.4 km.`,Gravity:`Surface gravity on the moon relative to Earth.

Earth = 1 g = 9.8 m/s\xB2.
Moon = 0.17 g = 1.62 m/s\xB2.`,"Escape Velocity":`Speed required to escape the gravitational pull of the moon.

Moon = 2.38 km/s. Earth = 11.2 km/s.`,Albedo:`Bond albedo of the moon, measuring reflectivity on a scale of 0 to 1.

0 = perfect absorber. 1 = perfect reflector.

Mercury = 0.068
Venus = 0.77
Earth = 0.306
Moon = 0.11
Jupiter = 0.343
Saturn = 0.342
Uranus = 0.30
Neptune = 0.29
Pluto = 0.49`,"Moon Zone (Inner)":"Closest stable orbit for the moon. Any closer and tidal forces tear it apart (the Roche limit).","Moon Zone (Outer)":"Farthest stable orbit for the moon. Beyond this distance the moon is no longer gravitationally bound.","Semi-Major Axis":`Orbital distance from the planet in km.

For moons of habitable Earth-like planets, the semi-major axis should fall between Moon Zone (Inner) and half of Moon Zone (Outer). Multiple major moons should be spaced at least 10 planetary radii apart.

The app clamps this value on Apply to keep the orbit inside the Moon Zone.

Moon = 384,748 km.`,Eccentricity:`Orbital eccentricity of the moon (0\u20131).

0 = perfect circle. 1 = parabola.

Major moons should have very low eccentricities.

Moon = 0.055.`,Periapsis:`Closest approach of the moon to the planet during orbit.

Should fall between Moon Zone (Inner) and Moon Zone (Outer).`,Apoapsis:`Farthest point of the moon from the planet during orbit.

Should fall between Moon Zone (Inner) and Moon Zone (Outer).`,Inclination:`Inclination of the moon's orbit relative to the planet's orbital plane.

Range: 0\u2013180\xB0. Major moons should have very low inclinations.

Moon = 5.15\xB0 (with respect to the ecliptic).`,"Orbital Direction":`Prograde = the moon orbits the planet in the same direction as the planet's spin.

Retrograde = the moon orbits the planet in the opposite direction of the planet's spin.

Undefined = the orbital inclination is exactly 90\xBA, so the orbit is classed as neither prograde nor retrograde.

Major moons of habitable Earth-like planets should be on prograde orbits.`,"Orbital Period (sidereal)":"The time it takes the moon to complete one orbit of the planet with respect to the background stars, in Earth days.","Orbital Period (synodic)":`The time between successive occurrences of the same lunar phase (e.g. full moon to full moon).

This value represents a lunar month on the planet.`,"Rotation Period":`The time it takes the moon to complete one full rotation about its axis.

If tidally locked, the rotation period equals the synodic orbital period (the moon always shows the same face to the planet).

If not yet locked, an estimated current period is shown based on exponential tidal despinning from the initial rotation period.`,"Total Tidal Force":`Total tidal force exerted on the planet by the moon and the star, relative to the tidal forces exerted on Earth.

<1 = tides less extreme than Earth.
~1 = tides comparable to Earth.
>1 = tides more extreme than Earth.`,"Moon Contribution":`Fraction of the total tidal force contributed by the moon.

Moon \u2248 66% (Earth\u2013Moon system).`,"Star Contribution":`Fraction of the total tidal force contributed by the host star.

Sun \u2248 33% (Earth\u2013Moon system).`,"Moon locked to Planet?":`Checks whether the moon is tidally locked to the planet.

A body is tidally locked when it takes the same amount of time to spin about its axis as it does to orbit its companion. Tidally locked objects always present the same face to their companion.

Major moons should always be tidally locked to the planet, i.e., the expected output is "Yes".`,"Planet locked to Moon?":`Checks whether the planet is tidally locked to the moon.

This is shown as a rough lock-timescale category rather than a strict Yes/No result, so the output is necessarily imprecise. 'Very Likely Locked' means the estimated planet-to-moon lock time is extremely short; the longer 'Maybe' categories indicate progressively weaker or less plausible locking. Adjust the moon's semi-major axis to change the result.`,"Planet locked to Star?":`Checks whether the planet is expected to be tidally locked to its star.

WorldSmith Web uses a user-friendly rule: this shows "Yes" when the computed Planet\u2192Star lock time is less than or equal to the current star age.

For an Earth-like setup, this should usually remain "No".`,"Derived Data":"Read-only parent and host-frame context used for moon calculations. In binary systems this includes which star-centered frame the parent world belongs to, plus any extra companion heating or stability pressure inherited from that frame.","Environment Forcing":"Canonical host-frame forcing inherited by the moon solver: bolometric light at the parent planet orbit, XUV, prebiotic UV, stellar wind, companion contributions, and flux variability.","Moon selection":"Saved moon currently being edited.","Editing moon":"Moon selector with create and delete controls.","Belongs to planet":"Parent planet this moon orbits. May be left unassigned.",Identity:"Identity fields for the currently selected moon.",Name:"Display name for the moon, used across tabs and exports.",Orbit:"Orbital inputs that determine moon distance, periods, and lock behaviour.",Physical:"Physical inputs used to derive radius, gravity, and escape velocity.",Composition:`Inferred from bulk density as a proxy for rock/ice fraction. Controls the material rigidity (\u03BC) and tidal quality factor (Q) used in tidal lock and heating calculations.

Density alone is often enough for cold, geologically quiet moons. But moons with extreme internal states \u2014 active volcanism or subsurface oceans \u2014 have much softer interiors than their bulk density implies. Use the Composition Override dropdown to select a special class when your moon has one of these conditions.

Iron-rich (>5 g/cm\xB3): Dense metallic core, like Mercury.
Rocky (3.2\u20135 g/cm\xB3): Solid silicate mantle. Earth\u2019s Moon, Io (cold).
Mixed rock/ice (2\u20133.2 g/cm\xB3): Roughly equal rock and ice. Europa.
Icy (1\u20132 g/cm\xB3): Mostly water ice with some rock. Ganymede, Titan.
Very icy (<1 g/cm\xB3): Dominated by volatile ices. Cometary bodies.

Special overrides (see Composition Override tooltip):
Subsurface ocean: Liquid layer decouples the ice shell (\u03BC = 0.3 GPa, Q = 2).
Partially molten: Magma interior from extreme tidal heating (\u03BC = 10 GPa, Q = 10).`,"Composition Override":`Override the density-derived composition class with a specific interior state. Density is a good proxy for cold, solid moons, but it underestimates tidal heating by 10\u2013100\xD7 for moons with extreme interiors.

Auto (from density): Default. Best for geologically quiet moons.

Very icy: Cometary or outer solar system bodies dominated by volatile ices. Low density (<1 g/cm\xB3).

Icy: Mostly water ice with some rock. Ganymede, Callisto, Rhea. Density 1\u20132 g/cm\xB3.

Subsurface ocean: A global liquid ocean beneath a thin ice shell dramatically softens the body and amplifies tidal dissipation. Use for moons showing signs of geological activity despite low density (cryovolcanism, plumes, young surface). Calibrated to Enceladus: predicted heating matches Cassini observations within 10%. WARNING: over-predicts for large moons like Titan (\u223C37\xD7 too high) \u2014 use Icy for those.

Mixed rock/ice: Roughly half rock, half ice. Europa\u2019s density (3.0 g/cm\xB3) places it here. Good default for moons of giant planets with intermediate density.

Rocky: Solid silicate mantle, like Earth\u2019s Moon (3.34 g/cm\xB3). Appropriate for tidally quiet rocky moons.

Partially molten: Extreme tidal heating has melted the interior, creating a magma ocean or mushy mantle. This makes the body much softer than solid rock, dramatically increasing dissipation. Use for moons in strong orbital resonances with high volcanic activity. Calibrated to Io: predicted heating matches observed 10\xB9\u2074 W within 1%.

Iron-rich: Dense metallic body (>5 g/cm\xB3). Very stiff, dissipates little energy. Mercury-like composition.`,Dynamics:"Optional inputs that affect tidal evolution timescales.","Moon Science Modes":`Top-level complexity controls for the moon solver.

Use these to switch the Hydrosphere, Atmosphere, and Orbital Coupling blocks between compact heuristic handling and the deeper Full / Manual paths.`,"Hydrosphere Mode":`Core keeps the existing density-driven moon water heuristics.

Full adds explicit water inventory, salinity, ammonia, and interior-state controls.

Manual lets you set physical moon water/interior inputs directly, but the engine still computes the resulting ocean and ice structure.`,"Atmosphere Mode":`Core uses the retained-volatile moon atmosphere path.

Full adds stability diagnostics, source/loss reasoning, and haze/cloud outputs.

Manual lets you set pressure and gas mix inputs; the solver then checks whether that atmosphere is stable or transient.`,"Orbital Coupling":`Core treats the moon independently.

Full adds sibling-moon resonance detection, forced eccentricity floors, Laplace-chain flags, and a tidal-habitable-zone readout.

Manual exposes resonance-group inputs and manual forcing controls.`,"Bulk & Interior":`Physical moon water and interior controls used by the Full and Manual hydrosphere paths.

These inputs shape whether the moon ends up dry, ocean-bearing, frozen over, differentiated, or internally warm enough to keep buried liquid water.`,"Water Mass Fraction":"Explicit moon water inventory as percent of total mass. Core mode ignores this and infers water from composition. Full and Manual modes use it to solve exposed ocean depth, buried ocean depth, and ice-shell structure.",Salinity:"Bulk ocean or ice salinity in percent by mass. Higher salinity lowers the freezing point and helps buried oceans persist.",Ammonia:"Bulk ammonia fraction in the volatile inventory. Ammonia acts as an antifreeze and can support colder subsurface oceans.","Differentiated Interior":"Flags whether the moon is internally differentiated into a rocky core and volatile-rich outer shell. Differentiation makes long-lived internal oceans more plausible.","Moon Radioisotopes":"Moon internal heat mode. Simple uses a single abundance multiplier. Advanced exposes the individual U-238, U-235, Th-232, and K-40 controls, mirroring rocky planets.","Radioisotope Abundance":`Simple moon radioisotope abundance multiplier relative to Earth.

Raise this to model a more radionuclide-rich moon with stronger long-lived internal heating, or lower it for an older or less enriched rocky interior.`,"Internal Heat":`Simple moon radioisotope abundance multiplier relative to Earth.

Raise this to model a more radionuclide-rich moon with stronger long-lived internal heating, or lower it for an older or less enriched rocky interior.`,"U-238":`Moon uranium-238 abundance relative to Earth's reference inventory.

U-238 is the dominant long-lived radiogenic heat source on multi-gigayear timescales.`,"U-235":`Moon uranium-235 abundance relative to Earth's reference inventory.

U-235 contributes more strongly in young systems because of its shorter half-life.`,"Th-232":`Moon thorium-232 abundance relative to Earth's reference inventory.

Th-232 is a long-lived radiogenic heat source that helps sustain late-time internal heating.`,"K-40":`Moon potassium-40 abundance relative to Earth's reference inventory.

K-40 is a shorter-lived radiogenic contributor that can matter more in younger rocky interiors.`,"Atmosphere Controls":`Manual atmosphere inputs for the Moon Atmosphere Manual mode.

Set a target surface pressure and gas mix here, then let the moon solver judge whether that atmosphere is stable, transient, or physically strained under the current escape and source conditions.`,"Manual Surface Pressure":"Manual surface pressure used only in Moon Atmosphere Manual mode.","Nitrogen (N2)":`Manual nitrogen fraction for the moon atmosphere in percent.

In Manual mode this acts as the background bulk gas. If you leave it at 0, the remaining percentage can be inferred after the other gases are applied.`,"Oxygen (O2)":`Manual oxygen fraction for the moon atmosphere in percent.

Useful for deliberately Earth-like or oxidizing atmospheres, but the solver still checks whether the overall atmosphere is stable or transient.`,"Carbon Dioxide (CO2)":`Manual carbon-dioxide fraction for the moon atmosphere in percent.

Higher CO2 generally strengthens greenhouse warming and can dominate thin cold atmospheres.`,"Argon (Ar)":`Manual argon fraction for the moon atmosphere in percent.

Argon is chemically inert and mostly acts as a heavy tracer or ballast gas in the current moon atmosphere model.`,"Water Vapor (H2O)":`Manual water-vapour fraction for the moon atmosphere in percent.

This can strengthen greenhouse warming, but warm moist atmospheres may also be short-lived on low-gravity moons.`,"Methane (CH4)":`Manual methane fraction for the moon atmosphere in percent.

Useful for Titan-like or reducing atmospheres. In the current model methane can contribute both greenhouse warming and haze-prone chemistry.`,"Carbon Monoxide (CO)":`Manual carbon-monoxide fraction for the moon atmosphere in percent.

CO is treated as a volatile atmospheric constituent rather than a full photochemical equilibrium species.`,"Hydrogen (H2)":`Manual hydrogen fraction for the moon atmosphere in percent.

Hydrogen gives a low molecular weight and large scale height, but it is also the easiest gas for small moons to lose.`,"Helium (He)":`Manual helium fraction for the moon atmosphere in percent.

Helium is chemically inert but usually hard for low-gravity moons to retain over long timescales.`,"Sulfur Dioxide (SO2)":`Manual sulfur-dioxide fraction for the moon atmosphere in percent.

Useful for volcanic or Io-like moon scenarios where outgassing can temporarily supply a harsh sulfur-rich atmosphere.`,"Ammonia (NH3)":`Manual ammonia fraction for the moon atmosphere in percent.

Useful for cold reducing atmospheres, but ammonia is usually chemically fragile and difficult to keep at the surface over long timescales.`,"Forced Eccentricity":`Minimum orbital eccentricity sustained by gravitational perturbations from a neighbouring moon in or near a mean-motion resonance (MMR). Acts as a floor \u2014 the effective eccentricity is whichever is larger: this value or the user-set eccentricity.

In Full coupling mode the solver derives this automatically from the mass ratio, semi-major-axis ratio, and resonance proximity of sibling moons; in Manual mode you can set it directly. Laplace chains (three consecutive 2:1 MMRs) impose a floor of 0.0035. Values \u2265 0.003 flag sustained tidal heating, which prevents eccentricity from damping to zero over geological time \u2014 the mechanism behind Io\u2019s volcanism.

Range: 0\u20130.2. Capped at 0.02 by the auto solver; higher values require manual entry.`,"Resonance Group":"Manual resonance-chain identifier for moons that should be treated as part of the same forced-eccentricity group.","Resonance & Rotation":`Manual orbital-coupling and primordial-spin controls.

Use these when you want to override the default independent-moon assumption and steer resonant forcing, chain membership, or the initial spin state more directly.`,"Resonance Order":`Manual ordering index for moons placed in the same resonance group.

Lower numbers are treated as the inner members of the chain, which helps the manual coupling solver interpret the sequence you intend.`,"Resonance Ratio":`Manual target period ratio used for a resonance group.

Use 2 for a 2:1-style chain, 1.5 for 3:2, and similar low-order ratios for other hand-built coupled systems.`,"Initial Rotation Period":`Primordial spin period of the moon before tidal braking. Faster spin (shorter period) means more angular momentum to dissipate and a longer time to reach tidal lock.

Default: 12 hours (model assumption from accretion dynamics). Range varies widely \u2014 fast-spinning bodies can be as short as 2\u20133 hours (near breakup), while captured moons may spin much slower.

This value feeds directly into the tidal locking timescale calculation.`,"Surface & Habitability":`Compact summary block for the moon's environment and life-facing implications.

This section is intentionally light on direct inputs; use it as a reminder that the habitability outputs below depend on the water, atmosphere, radiation, and orbital-coupling controls above.`,"Tidal Heating":`Surface heat flux from tidal deformation of the moon by its parent body. Uses the Wisdom (2008) formula with higher-order eccentricity corrections that remain accurate up to e \u2248 0.8.

Higher eccentricity and closer orbits produce more heating. Io: ~0.3\u20132 W/m\xB2 (highest in the Solar System). Earth's geothermal flux: 0.09 W/m\xB2.

Tidal-thermal feedback: for rocky moons (\u03C1 \u2265 3.2), when tidal flux exceeds ~0.02 W/m\xB2 the model automatically lowers Q and \u03BC toward partially-molten values, modelling the positive feedback loop that drives Io-like volcanism in orbital resonances.`,"Tidal Heating (\xD7 Earth)":`Tidal surface heat flux normalised to Earth's mean geothermal heat flux (0.09 W/m\xB2).

<1 = less than Earth's internal heat. >1 = more. Io \u2248 4\xD7 Earth (equilibrium model).`,"Orbital Recession":`Rate of orbital migration due to tidal dissipation. Positive = outward (planet spins faster than moon orbits, like Earth\u2013Moon at +3.8 cm/yr). Negative = inward (planet spins slower, like Phobos spiralling toward Mars).

Driven by two competing effects: the planet\u2019s tidal bulge transfers angular momentum, while the moon\u2019s own dissipation damps the orbit inward.`,"Orbital Fate":`Integrated tidal-evolution estimate for when the moon reaches the Roche limit (tidal disruption) or escapes the stable outer moon zone.

The current migration rate is propagated as an a^(-11/2) tidal law, which reduces distortion in long-lived inward and outward fate estimates. This is still an approximate estimate: the model assumes the current tidal regime continues over geological time.`,"Nearest Resonance":"Closest sibling-moon mean-motion resonance identified by the coupled moon-system solver.","Laplace Status":"Whether the moon is currently tagged as part of a Laplace-style resonant chain.","Migration Trend":"Instantaneous drift of the moon pair's period ratio from the current tidal migration rates. Converging means the pair is moving closer to resonance; diverging means it is moving away. This is not a capture guarantee.","Tidal HZ":"Moon tidal-habitable-zone readout from the coupled moon-system solver.",Formation:"First-pass moon formation classifier derived from orbit geometry, inclination, distance from the parent, and regular versus irregular moon architecture.",Limits:"Derived orbital limits and lock times for the selected moon.","Tidal locking":"Lock times and current lock state for the moon\u2013planet\u2013star system.","Equilibrium Temp":`Temperature from stellar radiation alone, assuming no atmosphere (airless body).

Uses the Stefan-Boltzmann equilibrium: T = (L(1\u2212a) / 16\u03C0\u03C3d\xB2)\xBC, where a is Bond albedo and d is star distance.`,"Surface Temp":`Estimated mean surface temperature including stellar radiation, tidal heating, radiogenic heating, and any modeled atmospheric greenhouse warming.

For airless bodies, this stays close to the radiative equilibrium. Tidal heating dominates for close-orbit moons like Io; greenhouse warming matters most for volatile-rich moons such as Titan-like cases.`,"Global Equilibrium":"Global radiative equilibrium temperature for the moon after albedo, planetshine, and eclipse cooling are applied. This is not the same as a local measured surface temperature on an airless body.","Observable Surface Range":"Modeled airless-body observable temperature envelope spanning nightside floor through dayside/subsolar-like temperatures. The range is widened or narrowed by rotation state and thermal inertia class.","Climate State":`High-level moon climate regime derived from the moon-specific climate model.

Stable, Snowball, Moist greenhouse, and Runaway greenhouse states reflect the modeled surface-water and temperature outcomes after planetshine, eclipses, and internal heating are considered.`,"Coupled Climate Tendency":"Phase 4 diagnostic showing how bounded chemistry forcing would tend to shift the moon climate label if opted in. The baseline moon surface temperature remains unchanged.","Photochemical Forcing":"Bounded diagnostic temperature delta from climate-chemistry coupling. For moons this is conservative because there is not yet a dedicated moon photochemistry solver.","Cloud Regime":"Cloud and circulation context inferred from pressure, exposed water, temperature, rotation, host flux, haze, and atmospheric-collapse risk. Airless moons and subsurface-only oceans do not receive exposed-cloud benefits.","Heat Redistribution":"How effectively the modeled moon atmosphere and cloud context move heat around the surface. Higher values reduce day-night extremes and collapse risk when there is enough pressure.","Cloud Albedo Effect":"Diagnostic cooling leverage from cloud reflectivity. This is bounded and does not directly rewrite the baseline moon temperature solve.","Carbon Cycle":"Long-term carbon-cycle tendency from exposed water/rock, CO2, volcanism or cryovolcanism, and recycling context. For icy ocean moons this is a rock-ocean chemistry cue, not Earth-like exposed-land weathering.","Weathering Efficiency":"Relative strength of CO2 drawdown by exposed-rock weathering plus limited seafloor weathering. Airless, dry, high-pressure-ice, and subsurface-only cases are deliberately limited.","Volcanic Supply":"Relative source-side carbon supply from silicate volcanism, cryovolcanism, or other outgassing context. Cryovolcanic supply is treated conservatively.","Surface Temp Range":`Estimated climate envelope for the moon's modeled surface temperature.

This Stage M3 output combines seasonal forcing, synchronous parentshine contrast, and eclipse cooling into a first-pass min/max surface-temperature range.`,"Day/Night Contrast":"First-pass synchronous day-night thermal contrast for the current moon climate.","Nightside Min":"Estimated nightside minimum temperature after eclipse and synchronous-cooling effects.","Collapse State":"Atmospheric-collapse risk assessment for thin or volatile atmospheres on locked moons.","Climate Zones":`Moon climate-zone summary from the parent-coupled moon climate model.

The current implementation reuses the Koppen-style zone classifier with moon-specific mean temperature, water state, pressure, and effective seasonal forcing.`,"Surface Ices":`High-level description of exposed surface-ice stability on the moon.

This rolls together surface temperature, volatile inventory, and atmosphere into a quick read such as stable frost, seasonal ice, or ice-free terrain. Use it as the compact visual companion to the deeper hydrosphere outputs.`,Seasonality:`Qualitative description of the moon's climate variability.

This combines seasonal forcing, eclipse duty cycle, and parentshine contrast to indicate whether the moon behaves as a low-, moderate-, strong-, or extreme-seasonality world.`,Planetshine:`Average climate forcing from the parent body's reflected starlight plus thermal emission.

Close-in large moons should show stronger parentshine than distant or small-parent cases.`,"Eclipse Cooling":`Fraction of the stellar energy budget lost to eclipses by the parent body.

Low-inclination close moons experience deeper eclipse forcing than high-inclination or distant moons.`,Atmosphere:`Derived moon atmosphere class from the retained volatile inventory.

Airless and exosphere states indicate no meaningful surface atmosphere. Thin, substantial, and dense volatile atmospheres represent retained or replenished gases near the surface.`,"Surface Pressure":`Total modeled moon surface pressure from retained volatile species.

This is derived from the retained volatile inventory rather than a manual input. Higher values generally support stronger greenhouse warming and denser near-surface air.`,"Atmosphere Composition":`Top atmosphere species by modeled pressure share.

This is a volatile-atmosphere composition summary, not a full photochemical equilibrium model.`,"Atmosphere Mix":`Top atmosphere species by modeled pressure share.

This is a volatile-atmosphere composition summary, not a full photochemical equilibrium model.`,"Greenhouse Warming":`Approximate surface warming above the moon's airless equilibrium / internal-heating baseline.

This Stage M1 model supports volatile greenhouse warming and a simple methane anti-greenhouse penalty, but not full haze photochemistry yet.`,"Atmosphere Stability":"Source-loss balance for the current moon atmosphere. Stable means the current atmosphere is plausibly long-lived; transient means it likely needs active replenishment.","Atmosphere Lifetime":"Estimated order-of-magnitude lifetime of the modeled atmosphere under the current source and loss assumptions.","Atmosphere Trend":"Long-term atmosphere source-sink ledger. Stable/replenished moons have source terms that plausibly balance loss terms; declining/transient moons are dominated by escape, cold trapping, or sputtering.","Dominant Source":"Largest current atmosphere source term in the Phase 3 ledger, such as retained volatiles, cryovolcanism, volcanic supply, or ocean buffering.","Dominant Sink":"Largest current atmosphere sink term in the Phase 3 ledger, such as Jeans escape, XUV escape, wind sputtering, condensation collapse, or surface adsorption.","Stability Timescale":"Qualitative atmospheric persistence timescale from the source-sink ledger. This is an order-of-magnitude class, not a precise lifetime calculation.","Atmosphere Haze":"First-pass haze class inferred from the dominant atmospheric chemistry and pressure.","Atmosphere Clouds":"First-pass cloud or aerosol class inferred from pressure, condensables, and surface liquid support.","Volcanic Activity":`Derived silicate-volcanism signal from tidal heating, radiogenic heating, interior class, and bulk size/gravity.

High values indicate Io-like or strongly molten rocky interiors that are likely to refresh the surface with lava or outgassed material.`,"Cryovolcanic Activity":`Derived icy-moon cryovolcanism signal from subsurface-water support, internal heating, composition, and venting ease.

High values indicate plumes or icy resurfacing that can resupply water-rich volatiles from beneath the surface.`,Cryovolcanism:`Derived icy-moon cryovolcanism signal from subsurface-water support, internal heating, composition, and venting ease.

High values indicate plumes or icy resurfacing that can resupply water-rich volatiles from beneath the surface.`,Resurfacing:`High-level surface-renewal class derived from the stronger of the silicate-volcanic and cryovolcanic channels.

Quiet moons should stay cratered, while Io-like or Enceladus-like cases should move into active resurfacing classes.`,"Volatile Replenishment":`Tendency for internal activity to resupply the moon's surface or near-surface volatile inventory.

This is a source-side signal from volcanism / cryovolcanism, not a guarantee that the moon can retain a long-lived atmosphere.`,"Ocean Persistence":`Tendency for liquid-water reservoirs to persist over time under the current heating, water inventory, and bulk-property assumptions.

This favors moons with supported subsurface or surface oceans, enough internal heat, and sufficient bulk support to avoid a purely frozen shell.`,"Volatile Supply":`Tendency for internal activity to resupply the moon's surface or near-surface volatile inventory.

This is a source-side signal from volcanism / cryovolcanism, not a guarantee that the moon can retain a long-lived atmosphere.`,Biosphere:`High-level surface-biology classification from the moon biosphere model.

This stage estimates whether exposed surface environments are sterile, only marginally habitable for microbes, or plausibly supportive of richer biospheres.`,"Surface Biosphere":`High-level surface-biology classification from the moon biosphere model.

This stage estimates whether exposed surface environments are sterile, only marginally habitable for microbes, or plausibly supportive of richer biospheres.`,"Plant Life":`Plant-life plausibility is a stricter gate than PHI.

It depends on atmosphere adequacy, accessible surface water, climate livability, radiation, stellar spectrum, and the moon's illumination regime. A moon can have a moderate habitability score and still fail the plant-life gate.`,Vegetation:`Whether the current moon biosphere gate supports visible surface vegetation.

This is only enabled when plant-life plausibility is high enough and the current atmosphere, water access, climate, and radiation conditions all support persistent surface flora.`,"Vegetation Colours":`First-pass vegetation colours for supported biosphere cases.

This reuses the same star-spectrum vegetation-colour logic as rocky planets, but only after the moon biosphere gate says surface vegetation is plausible.`,"Veg Colours":`First-pass vegetation colours for supported biosphere cases.

This reuses the same star-spectrum vegetation-colour logic as rocky planets, but only after the moon biosphere gate says surface vegetation is plausible.`,"Biosphere Limits":`Primary reasons the current moon does or does not support surface biology.

Use this readout to see which inputs are blocking exposed life or vegetation under the current model assumptions.`,"Life Limits":`Primary reasons the current moon does or does not support surface biology.

Use this readout to see which inputs are blocking exposed life or vegetation under the current model assumptions.`,Hydrosphere:`Derived moon water-state summary.

Stage M2 separates dry, surface-liquid, frozen-surface, steam, and subsurface-ocean cases so the model can distinguish ocean moons from icy moons with buried water.`,"Surface Water":`Modeled surface water state and coverage.

This reports accessible liquid water when present, otherwise the dominant surface water phase such as ice or vapour.`,"Subsurface Ocean":`Heuristic score for a buried liquid-water ocean beneath the surface ice shell.

Europa-like and Enceladus-like cases should reach a clear 'Yes'. Lower scores mean a buried ocean is only a possibility under the current inputs.`,"Ocean Depth":`Heuristic depth estimate for the moon's dominant liquid-water layer.

Surface-ocean moons report an exposed ocean depth. Frozen ocean worlds report the estimated buried-ocean depth instead.`,"Ice Shell":`Estimated thickness of the frozen surface shell above the liquid layer.

This is only shown for frozen-surface cases and is intended as a first-pass structural estimate.`,"High-pressure Ice Barrier":`Flags when the modeled ocean reaches pressure bands where dense ice phases become possible or likely.

The threshold is gravity-aware, so lower-gravity moons need deeper oceans to reach the same pressure.`,"High-Pressure Ice":`Flags when the modeled ocean reaches pressure bands where dense ice phases become possible or likely.

The threshold is gravity-aware, so lower-gravity moons need deeper oceans to reach the same pressure.`,"Interior Structure":"Compact readout of the current solved moon interior: ocean depth plus the inferred ice-shell convection regime.","Ocean Chemistry":"Qualitative surface or subsurface ocean-chemistry context from salinity/ammonia, CO2 pressure, carbonate buffering, rock-ocean access, and hydrothermal support. It is not an exact pH or ocean-circulation model.","Carbonate Saturation":"Whether the current water, CO2, weathering, and rock-ocean context can plausibly support carbonate buffering. High-pressure ice can limit this even on ocean worlds.","Nutrient Support":"Qualitative nutrient and hydrothermal access for moon oceans. Subsurface oceans can be promising, but high-pressure ice or isolated shells reduce rock-ocean exchange.","Biosignature Context":"Context-dependent interpretation of atmospheric O2/O3, methane, CO, haze, replenishment demand, and false-positive risk. This never claims that life is detected.",Disequilibrium:"How strongly reactive gases such as O2 plus CH4 coexist at levels that require ongoing replenishment. A high value means source required, not biology proven.","O2/O3 False Positive":"Abiotic oxygen or ozone risk from water loss, strong UV/XUV, dry surfaces, weak sinks, and redox context.","Methane Context":"Methane interpretation using oxygen level, haze likelihood, outgassing, hydrothermal context, and replenishment demand. Methane can be geologic or photochemical.","CO Buildup Risk":"Carbon-monoxide buildup risk in low-UV or high-CO2 atmospheres. CO can create false-positive or false-negative biosignature context.","Radiogenic Heating":`Internal heat from radioactive decay (U, Th, K) on the moon\u2019s surface.

Scales from Earth\u2019s 44 TW by moon mass and the system\u2019s radioisotope abundance setting. Typically small compared to tidal heating.`,"Magnetospheric Radiation":`Charged-particle radiation dose from the host planet\u2019s magnetosphere.

Scales as B\xB3 at the moon\u2019s orbit (dipole field), calibrated to Jupiter\u2013Europa (~540 rem/day). Zero if the moon orbits outside the magnetopause. Compressed parent magnetospheres can raise the exposed-surface context near the boundary. Upper estimate \u2014 actual doses may be lower due to ring absorption and loss processes.`,"Magnetosphere Dose":`Charged-particle radiation dose from the host planet\u2019s magnetosphere.

Scales as B\xB3 at the moon\u2019s orbit (dipole field), calibrated to Jupiter\u2013Europa (~540 rem/day). Zero if the moon orbits outside the magnetopause. Compressed parent magnetospheres can raise the exposed-surface context near the boundary. Upper estimate \u2014 actual doses may be lower due to ring absorption and loss processes.`,"Earth Similarity Index":`Compares this moon to Earth using radius, density, escape velocity, and surface temperature.

Range: 0 to 1, where 1 is most Earth-like. Earth-likeness is not the same as direct habitability.`,Appearance:`Physics-driven visual of the moon from space. Surface texture, ice, clouding, haze, and ocean cues are derived from the current solved moon state.

This preview is now read-only. Use Create This Moon in the Inputs column for Quick, Guided, or Recipes.`,"Habitability Index":`WorldSmith comparative habitability model for moons.

This is PHI-inspired, not a direct literature PHI implementation. The score depends on the selected solvent pathway and the active solvent-policy support for surface water, subsurface water, and alternative solvents.

Use the expanded KPI details to see the current pathway, policy version, and term breakdown.`,"Surface Radiation":"Gate-based surface-radiation class after parent-belt exposure, stellar XUV, atmosphere shielding, and moon magnetic shielding are combined.","Magnetic Shielding":`Combined intrinsic and induced moon magnetic shielding class.

Intrinsic shielding comes from a plausible moon dynamo. Induced shielding comes from a conductive salty subsurface ocean interacting with the parent field.`,"Surface Exomoon Calibration":`Paper-informed exposed-surface moon calibration for cool-star systems.

This surface-only gate weighs cool-star band, giant-host mass, moon mass floor, composition, and spin state. It does not block subsurface-ocean outcomes.`,"Spin State":`Solved moon spin-orbit state from the tidal model.

A 1:1 synchronous lock strengthens permanent parent-facing contrast, while a 3:2 resonance modestly softens that contrast for exposed-surface climate cases.`,"Life Class":`High-level gate-based moon outcome.

This sits alongside the numeric Habitability Index and tells you whether the current moon is best described as a surface-life candidate, a cool-star mass-limited surface moon, a radiation-limited ocean moon, a subsurface-ocean moon, or another environmental class.`,"Surface Habitability":`Gate-based surface-habitability readout.

This separates true surface-life plausibility from warm-but-radiation-limited or marginal-atmosphere cases.`,"Subsurface Habitability":`Gate-based subsurface-habitability readout.

Moons outside the stellar habitable zone can still score well here if they plausibly sustain buried liquid water under ice.`,"Habitability Gates":"Quick count of how many surface and subsurface habitability gates currently pass."},ro=[{title:"Getting Started",body:"The Moons page creates and configures natural satellites. Select a moon from the dropdown, or create a new one. Assign it to a parent planet or giant companion using the parent selector."},{title:"Orbit Setup",body:"Set semi-major axis, eccentricity, and inclination. The semi-major axis is automatically clamped to the parent\u2019s moon zone \u2014 between the Roche limit and Hill sphere."},{title:"Physical Properties",body:"Adjust mass, density, albedo, and composition. Use the composition override dropdown for special scenarios like subsurface oceans or partially molten interiors."},{title:"Tidal System",body:"Outputs show tidal forces, heating, and locking timescales. Check whether the moon is tidally locked to its planet, and whether the planet is locked to its star or moon."},{title:"Creation Modes",body:"Use Create This Moon at the top of Inputs. Quick applies a moon archetype, Guided walks you to a recommendation, Recipes opens the preset library for exact moon templates like Luna, Europa, Io, or Titan, and Advanced is the direct editor below."}];function Ee(s,u=null){return String(s??"").trim()||u||null}function qa(s){return Yt(s)}function so(s,u){let b=we(s),h=xe(b||{}),C={massMsol:Number(b?.massMsol)||1,ageGyr:Number(b?.ageGyr)||4.6,metallicityFeH:Number(b?.metallicityFeH)||0,radiusRsolOverride:h.r,luminosityLsolOverride:h.l,tempKOverride:h.t,evolutionMode:h.ev},P=Wt({massMsol:C.massMsol,ageGyr:C.ageGyr,metallicityFeH:C.metallicityFeH,radiusRsolOverride:C.radiusRsolOverride,luminosityLsolOverride:C.luminosityLsolOverride,tempKOverride:C.tempKOverride,evolutionMode:C.evolutionMode}),o=u?.defaultHostFrameId||u?.primaryStarId||"star_a";return{hostFrameId:o,hostFrame:{id:o,label:b?.name||"Star",frameKind:"star",orbitFamilyKind:"single",zones:{habitableZoneAu:P.habitableZoneAu},fluxModel:{meanCompanionFluxEarth:0,fluxVariabilityFraction:0,meanCompanionXuvFluxEarth:0,hostWindPressureEarthAt1Au:P?.stellarEnvironment?.wind?.ramPressureEarthRatioAt1Au??null,meanWindPressureEarthAt1Au:P?.stellarEnvironment?.wind?.ramPressureEarthRatioAt1Au??null,meanCompanionWindPressureEarth:0},stability:{criticalOuterAu:null,diskTruncationAu:null,warnings:[]}},starId:u?.primaryStarId||o,starConfig:C,starModel:P,hostWindPressureEarthAt1Au:P?.stellarEnvironment?.wind?.ramPressureEarthRatioAt1Au??null,companionFluxEarth:0,companionXuvFluxEarth:0,companionWindPressureEarth:0,fluxVariabilityFraction:0,dominantContributorId:u?.primaryStarId||o}}function lo(s,u,b=null){let h=b||qa(s),C=Ee(u?.hostFrameId,h?.defaultHostFrameId||h?.primaryStarId);return Zt(h,C)||so(s,h)}function co({compactLifeLimits:s,compactOrbitalFate:u,lifeClass:b}){return u!=="Stable"||s&&s!=="Clear"?"warning":/surface|complex|simple|microbial|candidate|habitable/i.test(String(b||""))?"good":"neutral"}function uo({moonName:s,model:u,moonProfile:b,compactLifeLimits:h,compactOrbitalFate:C}={}){let P=String(s||u?.inputs?.name||"Moon").trim()||"Moon",o=b?.displayClass||u?.display?.compositionClass||"moon environment",k=u?.display?.hydrosphereState||"water state unresolved",n=u?.display?.atmosphereClass||"atmosphere unresolved",j=u?.display?.surfaceTemp||"temperature unresolved",J=u?.display?.lifeClass||"life class unresolved",oe=C==="Stable"?"The current orbit is not showing a strong inward decay or outward escape warning.":`Orbital fate needs attention: ${u?.display?.orbitalFate||C}.`,Ae=h==="Clear"?"No compact life blockers are flagged.":`${h||"Some blockers"} ${h==="1 blocker"?"is":"are"} active; inspect Habitability for the gate details.`;return{tone:co({compactLifeLimits:h,compactOrbitalFate:C,lifeClass:J}),body:`${P} reads as ${o.toLowerCase()} with ${k.toLowerCase()} and ${n.toLowerCase()}. Surface temperature is ${j}. ${J} is the current habitability class. ${oe} ${Ae}`,items:[{label:"Focus",value:P},{label:"Surface",value:o},{label:"Life signal",value:J}]}}function Xo(s,u={}){let b=u?.routeContext?.guided||null,h=q(),C=we(h),P=xe(C),o={starMassMsol:Number(C.massMsol),starAgeGyr:Number(C.ageGyr),starMetallicityFeH:Number(C.metallicityFeH)||0,starRadiusRsolOverride:P.r,starLuminosityLsolOverride:P.l,starTempKOverride:P.t,starEvolutionMode:P.ev,planet:{...h.planet},moon:{...h.moon}},k=da({speedDaysPerSec:.5}),n=document.createElement("div");n.className="page",n.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--moons" aria-hidden="true"></span><span>Moons</span></h1>
        <button id="moonTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        ${fa({summary:"Author moons for selected planets and gas giants, then validate their orbit and environment outputs.",controls:"The selected moon, its parent assignment, and the orbit, interior, atmosphere, and coupling inputs.",affects:"Planet tides, calendar moon phases, and moon-specific habitability and visual outputs.",primaryAction:"Choose a parent world or leave the moon unassigned, then set orbit distance before fine-tuning the deeper modes.",compact:!0,detailsTitle:"Moon workflow context",detailsSummary:"Parent, orbit, and environment choices feed tides, calendars, and visuals."})}
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">

          <div class="label">Parent Context ${N(R["Derived Data"]||"")}</div>
          <div class="derived-readout derived-readout--context" id="context"></div>

          <div style="height:12px"></div>

          <div class="label">Moon selection ${N(R["Moon selection"]||"")}</div>
          <div class="form-row">
            <div>
              <div class="label">Editing moon ${N(R["Editing moon"]||"")}</div>
              <div class="hint">Create multiple moons and assign each to a planet.</div>
            </div>
            <div class="select-stack">
              <select id="moonSelect"></select>
              <div class="select-actions">
                <button id="moonNew" class="small" type="button">New</button>
                <button id="moonDelete" class="small danger" type="button">Delete</button>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div>
              <div class="label">Belongs to planet ${N(R["Belongs to planet"]||"")}</div>
              <div class="hint">Set a parent planet or leave this moon unassigned.</div>
            </div>
            <select id="moonPlanetSelect"></select>
          </div>

          <div style="height:10px"></div>

          <div class="guided-entry-strip" id="moonCreateEntry">
            <div class="guided-entry-strip__title">Create This Moon</div>
            <div class="guided-entry-strip__copy">
              Quick applies a moon archetype, Guided walks you to a recommendation, and Advanced
              is the direct editor below. Use Recipes alongside Advanced when you want a preset
              starting point: Recipes will override the current moon inputs.
            </div>
            <div class="guided-entry-strip__modes">
              <button id="moonCreateQuickBtn" type="button" class="guided-entry-strip__mode" ${me(pe("quick"))}>
                Quick
              </button>
              <button id="moonCreateGuidedBtn" type="button" class="guided-entry-strip__mode" ${me(pe("guided"))}>
                Guided
              </button>
              <button id="moonCreateRecipesBtn" type="button" class="guided-entry-strip__mode" ${me(pe("recipes"))}>
                Recipes
              </button>
              <span class="guided-entry-strip__mode guided-entry-strip__mode--current" aria-current="page" ${me(pe("advanced"))}>
                Advanced
              </span>
            </div>
          </div>

          <div style="height:10px"></div>

          <div class="label">Moon Science Modes ${N(R["Moon Science Modes"]||"")}</div>
          ${Pt("hydModePills","hydMode","Hydrosphere Mode","Hydrosphere Mode",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"hydModeHint")}
          ${Pt("atmModePills","atmMode","Atmosphere Mode","Atmosphere Mode",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"atmModeHint")}
          ${Pt("orbModePills","orbMode","Orbital Coupling","Orbital Coupling",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"orbModeHint")}

          <div style="height:10px"></div>

<div class="label">Identity ${N(R.Identity||"")}</div>
          <div class="form-row">
            <div>
              <div class="label">Name ${N(R.Name||"")}</div>
              <div class="hint">Used in exports and print view.</div>
            </div>
            <input id="name" type="text" />
          </div>

          <div style="height:8px"></div>
          <div class="label">Orbit ${N(R.Orbit||"")}</div>

          ${O("a","Semi-Major Axis","km","",10,1e9,100,"Semi-Major Axis")}
          ${O("e","Eccentricity","","",0,.99,.001,"Eccentricity")}
          ${O("inc","Inclination","\xB0","",0,180,.1,"Inclination")}

          <div style="height:8px"></div>
          <div class="label">Physical ${N(R.Physical||"")}</div>

          ${O("m","Mass","MMoon","",1e-8,1e3,1e-8,"Mass")}
          ${O("density","Density","g/cm\xB3","",.1,20,.01,"Density")}
          ${O("albedo","Albedo","","",0,.95,.001,"Albedo")}

          <div class="form-row">
            <div>
              <div class="label">Composition Override ${N(R["Composition Override"]||"")}</div>
            </div>
            <select id="compOverride" aria-label="Composition Override">
              <option value="">Auto (from density)</option>
              <option value="Very icy">Very icy</option>
              <option value="Icy">Icy</option>
              <option value="Subsurface ocean">Subsurface ocean</option>
              <option value="Mixed rock/ice">Mixed rock/ice</option>
              <option value="Rocky">Rocky</option>
              <option value="Partially molten">Partially molten</option>
              <option value="Iron-rich">Iron-rich</option>
            </select>
          </div>

          <div style="height:8px"></div>
          <div class="label">Dynamics ${N(R.Dynamics||"")}</div>
          ${O("initRot","Initial Rotation Period","hours","",2,1e3,.1,"Initial Rotation Period")}

          <div style="height:8px"></div>
          <div class="label">Bulk & Interior ${N(R["Bulk & Interior"]||"")}</div>
          <div id="moonHydrosphereSection">
            ${O("wmf","Water Mass Fraction","%","",0,60,.1,"Water Mass Fraction")}
            ${O("salinity","Salinity","%","",0,35,.1,"Salinity")}
            ${O("ammonia","Ammonia","%","",0,30,.1,"Ammonia")}
            <div class="form-row">
              <div>
                <div class="label">Differentiated Interior ${N(R["Differentiated Interior"]||"")}</div>
                <div class="hint">Auto defers to the solver. Yes/No pins the interior assumption.</div>
              </div>
              <select id="differentiatedInterior">
                <option value="">Auto</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Moon Radioisotopes ${N(R["Moon Radioisotopes"]||"")}</div>
                <div class="hint" id="isoModeHint"></div>
              </div>
              <div class="pill-toggle-wrap">
                ${po("isoModePills","isoMode",[{value:"simple",label:"Simple",checked:!0},{value:"advanced",label:"Advanced",checked:!1}])}
              </div>
            </div>
            <div id="moonIsoSimpleRows">
              ${O("radioAbundance","Radioisotope Abundance","x Earth","",.1,3,.01,"Internal Heat")}
            </div>
            <div id="moonIsoAdvancedRows">
              ${O("u238","U-238","x Earth","",0,5,.01,"U-238")}
              ${O("u235","U-235","x Earth","",0,5,.01,"U-235")}
              ${O("th232","Th-232","x Earth","",0,5,.01,"Th-232")}
              ${O("k40","K-40","x Earth","",0,5,.01,"K-40")}
            </div>
          </div>

          <div style="height:8px"></div>
          <div class="label">Atmosphere ${N(R["Atmosphere Controls"]||"")}</div>
          <div id="moonAtmosphereSection">
            ${O("manualPressure","Manual Surface Pressure","atm","",0,10,.01,"Manual Surface Pressure")}
            ${B("n2Pct","Nitrogen (N2)","%","Derived to fill the remainder when left at 0 in manual mode.")}
            ${B("o2Pct","Oxygen (O2)","%","")}
            ${B("co2Pct","Carbon Dioxide (CO2)","%","")}
            ${B("arPct","Argon (Ar)","%","")}
            ${B("h2oPct","Water Vapor (H2O)","%","")}
            ${B("ch4Pct","Methane (CH4)","%","")}
            ${B("coPct","Carbon Monoxide (CO)","%","")}
            ${B("h2Pct","Hydrogen (H2)","%","")}
            ${B("hePct","Helium (He)","%","")}
            ${B("so2Pct","Sulfur Dioxide (SO2)","%","")}
            ${B("nh3Pct","Ammonia (NH3)","%","")}
          </div>

          <div style="height:8px"></div>
          <div class="label">Resonance & Rotation ${N(R["Resonance & Rotation"]||"")}</div>
          <div id="moonOrbitalSection">
            ${O("forcedEcc","Forced Eccentricity","","",0,.2,1e-4,"Forced Eccentricity")}
            <div class="form-row">
              <div>
                <div class="label">Resonance Group ${N(R["Resonance Group"]||"")}</div>
                <div class="hint">Manual mode only. Leave blank for auto.</div>
              </div>
              <input id="resonanceGroup" type="text" />
            </div>
            ${B("resonanceOrder","Resonance Order","","Manual mode only. Smaller numbers are closer in.")}
            ${B("resonanceRatio","Resonance Ratio","","Use 2 for a 2:1-style manual chain, 1.5 for 3:2, etc.")}
          </div>

          <div style="height:8px"></div>
          <div class="label">Surface & Habitability ${N(R["Surface & Habitability"]||"")}</div>
          <div class="hint">Core mode keeps the page compact. Full and Manual reveal the deeper moon-environment controls above.</div>

          <div class="button-row">
            <button id="btn-default">Reset to Defaults</button>
          </div>

          <div class="hint" style="margin-top:10px">
            Radius, gravity, and escape velocity are derived from Mass + Density.
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Outputs</h2></div>
        <div class="panel__body">
          <div id="kpis"></div>

          <div id="details"></div>
        </div>
      </div>
    </div>
  `,s.appendChild(n),ba(n),wa({steps:ro,storageKey:"worldsmith.moon.tutorial",container:n,triggerBtn:n.querySelector("#moonTutorials")});let j=new Set,J=new MutationObserver(()=>{n.isConnected||(k.dispose(),J.disconnect())});J.observe(document.body,{childList:!0,subtree:!0});let oe=n.querySelector("#moonSelect"),Ae=n.querySelector("#moonNew"),Da=n.querySelector("#moonDelete"),Ie=n.querySelector("#moonPlanetSelect"),Ba=n.querySelector("#context"),he=n.querySelector("#name"),Re=n.querySelector("#a"),$e=n.querySelector("#e"),Te=n.querySelector("#inc"),Ne=n.querySelector("#m"),He=n.querySelector("#density"),Fe=n.querySelector("#albedo"),Oe=n.querySelector("#compOverride"),Ge=n.querySelector("#initRot"),Le=n.querySelector("#hydModePills"),qe=n.querySelector("#atmModePills"),De=n.querySelector("#orbModePills"),kt=n.querySelector("#hydModeHint"),Et=n.querySelector("#atmModeHint"),At=n.querySelector("#orbModeHint"),Be=n.querySelector("#wmf"),je=n.querySelector("#salinity"),Ke=n.querySelector("#ammonia"),ye=n.querySelector("#differentiatedInterior"),Ue=n.querySelector("#isoModePills"),It=n.querySelector("#isoModeHint"),_e=n.querySelector("#radioAbundance"),Ve=n.querySelector("#u238"),ze=n.querySelector("#u235"),We=n.querySelector("#th232"),Ze=n.querySelector("#k40"),Qe=n.querySelector("#manualPressure"),Xe=n.querySelector("#n2Pct"),Ye=n.querySelector("#o2Pct"),Je=n.querySelector("#co2Pct"),et=n.querySelector("#arPct"),tt=n.querySelector("#h2oPct"),at=n.querySelector("#ch4Pct"),ot=n.querySelector("#coPct"),it=n.querySelector("#h2Pct"),nt=n.querySelector("#hePct"),rt=n.querySelector("#so2Pct"),st=n.querySelector("#nh3Pct"),lt=n.querySelector("#forcedEcc"),ie=n.querySelector("#resonanceGroup"),ne=n.querySelector("#resonanceOrder"),re=n.querySelector("#resonanceRatio"),ja=n.querySelector("#moonCreateQuickBtn"),Ka=n.querySelector("#moonCreateGuidedBtn"),Ua=n.querySelector("#moonCreateRecipesBtn"),Rt=n.querySelector("#moonHydrosphereSection"),$t=n.querySelector("#moonAtmosphereSection"),Tt=n.querySelector("#moonOrbitalSection"),Nt=n.querySelector("#moonIsoSimpleRows"),Ht=n.querySelector("#moonIsoAdvancedRows"),Y=n.querySelector("#kpis"),Ft=n.querySelector("#details"),se=null,Ot={};F("a",Re,10,1e9,100,"auto"),F("e",$e,0,.99,.001,"auto"),F("inc",Te,0,180,.1,"auto"),F("m",Ne,1e-8,1e3,1e-8,"auto"),F("density",He,.1,20,.01,"auto"),F("albedo",Fe,0,.95,.001,"auto"),F("initRot",Ge,2,1e3,.1,"auto"),F("wmf",Be,0,60,.1,"auto"),F("salinity",je,0,35,.1,"auto"),F("ammonia",Ke,0,30,.1,"auto"),F("radioAbundance",_e,.1,3,.01,"auto"),F("u238",Ve,0,5,.01,"auto"),F("u235",ze,0,5,.01,"auto"),F("th232",We,0,5,.01,"auto"),F("k40",Ze,0,5,.01,"auto"),F("manualPressure",Qe,0,10,.01,"auto"),F("forcedEcc",lt,0,.2,1e-4,"auto");function F(t,e,i,r,c,d){let l=n.querySelector(`#${t}_slider`),M=n.querySelector(`#${t}_min`),y=n.querySelector(`#${t}_max`);M.textContent=String(i),y.textContent=String(r),Ot[t]=la({numberEl:e,sliderEl:l,min:i,max:r,step:c,mode:d,commitOnInput:!1,onChange:()=>z()})}function _a(){for(let t of["a","e","inc","m","density","albedo","initRot","wmf","salinity","ammonia","radioAbundance","u238","u235","th232","k40","manualPressure","forcedEcc"])Ot[t]?.syncFromNumber({commit:!1,normalize:!0})}function Gt(){let t=q(),e=we(t);o.starMassMsol=Number(e?.massMsol),o.starAgeGyr=Number(e?.ageGyr),o.starMetallicityFeH=Number(e?.metallicityFeH)||0;let i=xe(e);o.starRadiusRsolOverride=i.r,o.starLuminosityLsolOverride=i.l,o.starTempKOverride=i.t,o.starEvolutionMode=i.ev;let r=ae(t);o.moonId=r?.id||t.moons?.selectedId,o.moon={...r?.inputs||t.moon},o.moonName=r?.name||o.moon.name||"Luna",o.moonPlanetId=r?r.planetId??null:null,o.moonLocked=!!r?.locked;let c=Lt(t,o.moonPlanetId);o.parentType=c.type,c.type==="gasGiant"?(o.gasGiant=c.gasGiant,o.planet=null):(o.planet=c.inputs,o.gasGiant=null)}function Lt(t,e){let i=e==null?null:String(e);if(i){let r=Jt(t).find(d=>String(d.id)===i);if(r?.inputs)return{type:"planet",inputs:{...r.inputs}};let c=de(t).find(d=>String(d.id)===i);if(c)return{type:"gasGiant",gasGiant:c}}return{type:"planet",inputs:{...t.planet}}}function Va(t){let e=String(t?.companionClass||"").trim();return e?Vt(e):_t({massMjup:t?.massMjup})==="brownDwarf"?"brownDwarf":"gasGiant"}function ct(t){return zt(Va(t))}function be(t,e,i="core"){return t?.querySelector(`input[name="${e}"]:checked`)?.value||i}function ve(t,e,i,r="core"){let c=i||r;t?.querySelectorAll(`input[name="${e}"]`).forEach(d=>{d.checked=d.value===c})}function qt(){let t=o.moon.hydrosphereMode||"core",e=o.moon.atmosphereMode||"core",i=o.moon.orbitalCouplingMode||"core",r=o.moon.radioisotopeMode||"simple";ve(Le,"hydMode",t),ve(qe,"atmMode",e),ve(De,"orbMode",i),ve(Ue,"isoMode",r,"simple"),kt&&(kt.textContent=t==="core"?"Compatibility heuristics.":t==="full"?"Inventory-driven moon water and ice solving.":"Direct water/interior inputs with computed outputs."),Et&&(Et.textContent=e==="core"?"Retained-volatile atmosphere only.":e==="full"?"Computed atmosphere plus stability diagnostics.":"Manual pressure and gas mix with stability checks."),At&&(At.textContent=i==="core"?"Single-moon treatment.":i==="full"?"Sibling resonance and tidal-HZ analysis.":"Manual resonance-chain controls enabled."),It&&(It.textContent=r==="advanced"?"Advanced isotope-by-isotope moon heat inputs.":"Single moon radiogenic-heat multiplier."),Rt&&(Rt.style.display=t==="core"?"none":""),$t&&($t.style.display=e==="manual"?"":"none"),Tt&&(Tt.style.display=i==="core"?"none":""),Nt&&(Nt.style.display=t==="core"||r==="advanced"?"none":""),Ht&&(Ht.style.display=t==="core"||r!=="advanced"?"none":""),ie&&(ie.disabled=i!=="manual"),ne&&(ne.disabled=i!=="manual"),re&&(re.disabled=i!=="manual")}function za(){return{name:he.value||"New Moon",semiMajorAxisKm:Number(Re.value),eccentricity:Number($e.value),inclinationDeg:Number(Te.value),massMoon:Number(Ne.value),densityGcm3:Number(He.value),albedo:Number(Fe.value),compositionOverride:Oe.value||null,initialRotationPeriodHours:Number(Ge.value)||null,hydrosphereMode:be(Le,"hydMode"),atmosphereMode:be(qe,"atmMode"),orbitalCouplingMode:be(De,"orbMode"),waterMassFractionPct:Number(Be.value)||null,salinityPct:Number(je.value)||null,ammoniaPct:Number(Ke.value)||null,differentiatedInterior:ye.value==="yes"?!0:ye.value==="no"?!1:null,radioisotopeMode:be(Ue,"isoMode","simple"),radioisotopeAbundance:Number(_e.value)||null,u238Abundance:Number(Ve.value)||null,u235Abundance:Number(ze.value)||null,th232Abundance:Number(We.value)||null,k40Abundance:Number(Ze.value)||null,manualSurfacePressureAtm:Number(Qe.value)||null,n2Pct:Number(Xe.value)||0,o2Pct:Number(Ye.value)||0,co2Pct:Number(Je.value)||0,arPct:Number(et.value)||0,h2oPct:Number(tt.value)||0,ch4Pct:Number(at.value)||0,coPct:Number(ot.value)||0,h2Pct:Number(it.value)||0,hePct:Number(nt.value)||0,so2Pct:Number(rt.value)||0,nh3Pct:Number(st.value)||0,forcedEccentricity:Number(lt.value)||null,manualResonanceGroupId:ie.value?.trim()||null,manualResonanceOrder:Number(ne.value)||null,manualResonanceRatio:Number(re.value)||null}}function ge(t){let e=n.querySelector(".moon-float-note");e||(e=document.createElement("div"),e.className="moon-float-note",n.appendChild(e)),e.textContent=t,e.classList.add("is-visible"),se&&clearTimeout(se),se=setTimeout(()=>{e.classList.remove("is-visible")},3200)}function dt(t,{noticeLabel:e="Moon preset"}={}){let i=q(),r=ae(i);if(!r)return null;let c=r.id,d=r.planetId??o.moonPlanetId??null,l=le(i,{moonId:c,moonInputs:t,planetId:d}).model,M=String(l?.orbit?.semiMajorAxisGuard||"none"),y=Number(l?.inputs?.semiMajorAxisKm),x=Number(t.semiMajorAxisKm),g=Number.isFinite(y)?Math.round(y):x,I=M!=="none"&&Number.isFinite(g),H={...t,semiMajorAxisKm:I?g:x};return ke(c,{inputs:H}),mt({moon:H}),I&&Math.abs(H.semiMajorAxisKm-x)>1e-9&&ge(`${e} adjusted the semi-major axis to ${m(H.semiMajorAxisKm,0)} km to keep this moon inside the Moon Zone.`),te(),ee(),H}function Wa(){let t=q(),e=Xt(t),i=e.filter(c=>c.moonParentKind==="planet"),r=e.filter(c=>c.moonParentKind==="gasGiant");Na(Ie,{planets:i,gasGiants:r,selectedValue:o.moonPlanetId,disabled:o.moonLocked,title:o.moonLocked?"This moon is locked to its current planet on the Planetary System tab.":""})}function Za(){let t=q(),e=Pe(t);Ha(oe,e,t.moons.selectedId)}function Qa(t,e,i){let r=Array.isArray(e?.operations)?e.operations:[];if(!r.length)return t;let c=(Array.isArray(t)?t:[]).map(d=>({...d,inputs:{...d?.inputs||{}}}));for(let d=0;d<r.length;d+=1){let l=r[d];if(!(!l||typeof l!="object"))if(l.type==="update"&&l.moonId){let M=c.findIndex(y=>y?.id===l.moonId);M>=0&&(c[M]={...c[M],name:l.name??c[M].name,planetId:l.planetId===void 0?c[M].planetId:l.planetId??null,inputs:{...c[M].inputs||{},...l.inputPatch||{}}})}else l.type==="create"&&l.inputs&&c.push({id:l.previewId||`preview-sibling-${d+1}`,name:l.name||l.inputs?.name||"Preview sibling",planetId:l.planetId===void 0?i??null:l.planetId??null,inputs:{...l.inputs||{}}})}return c}function le(t,{moonId:e,moonInputs:i,planetId:r,parentPatch:c=null,siblingPatch:d=null}){let l=c?.assignMoonToParentId!=null?c.assignMoonToParentId:r,M=Lt(t,l),y=Pe(t).filter(A=>(A.planetId??null)===(l??null)).map(A=>({...A,inputs:A.id===e?i:A.inputs})),x=Qa(y,d,l),g=c?.parentKind==="gasGiant"&&M.type==="gasGiant"&&M.gasGiant?{...M,gasGiant:{...M.gasGiant,...c.inputPatch||{}}}:c?.parentKind==="planet"&&M.type==="planet"?{...M,inputs:{...M.inputs||{},...c.inputPatch||{}}}:M,I=qa(t),H=g.type==="gasGiant"&&g.gasGiant?g.gasGiant:{id:l??null,hostFrameId:t.planets?.byId?.[l]?.hostFrameId||null},w=lo(t,H,I),p=w?.starConfig||{},v=w?.starModel,T=w?.hostFrame?.zones?.habitableZoneAu||v?.habitableZoneAu||null,$=Ee(w?.hostFrameId,I?.defaultHostFrameId),f=Number(w?.companionFluxEarth||0),a=Number(w?.companionXuvFluxEarth||0),W=w?.hostXuvFluxEarthAt1Au??null,K=w?.hostPrebioticUvEarthAt1Au??null,D=Number(w?.companionPrebioticUvEarth||0),Z=w?.hostWindPressureEarthAt1Au??null,U=Number(w?.companionWindPressureEarth||0),G=Number(w?.fluxVariabilityFraction||0);if(g.type==="gasGiant"&&g.gasGiant){let A=Pa({...g.gasGiant,orbitAu:Number(g.gasGiant.au)||5,starMassMsol:Number(p.massMsol)||1,starLuminosityLsol:Number(v?.luminosityLsol)||1,starAgeGyr:Number(p.ageGyr)||4.6,starRadiusRsol:Number(v?.radiusRsol)||1,hostFrameId:$,hostFrame:w?.hostFrame||null,hostXuvFluxEarthAt1Au:W,hostPrebioticUvEarthAt1Au:K,hostWindPressureEarthAt1Au:Z,companionFluxEarth:f,companionXuvFluxEarth:a,companionPrebioticUvEarth:D,companionWindPressureEarth:U,fluxVariabilityFraction:G,stellarMetallicityFeH:Number(p.metallicityFeH)||0,otherGiants:de(t).filter(X=>X.id!==g.gasGiant.id&&Ee(X?.hostFrameId,I?.defaultHostFrameId)===$),moons:x.map(X=>X.inputs||{})}),V=Ea(A),ce=St({starMassMsol:Number(p.massMsol)||1,starAgeGyr:Number(p.ageGyr)||4.6,starMetallicityFeH:Number(p.metallicityFeH)||0,starRadiusRsolOverride:p.radiusRsolOverride??null,starLuminosityLsolOverride:p.luminosityLsolOverride??null,starTempKOverride:p.tempKOverride??null,starEvolutionMode:p.evolutionMode||"zams",starHabitableZoneAu:T,hostFrameId:$,hostFrame:w?.hostFrame||null,hostXuvFluxEarthAt1Au:W,hostPrebioticUvEarthAt1Au:K,hostWindPressureEarthAt1Au:Z,companionFluxEarth:f,companionXuvFluxEarth:a,companionPrebioticUvEarth:D,companionWindPressureEarth:U,fluxVariabilityFraction:G,parentKind:"gasGiant",parentOverride:V,moonEntries:x.length?x:[{id:e||"draft-moon",planetId:l,inputs:i}]});return{parentType:"gasGiant",parentOverride:V,parentInfo:{parentId:g.gasGiant.id||l||null,parentKind:"gasGiant",parentName:g.gasGiant.name||g.gasGiant.id||ct(g.gasGiant),parentClassLabel:ct(g.gasGiant),assigned:l!=null,orbitAu:Number(g.gasGiant.au)||Number(V.inputs.semiMajorAxisAu)||null,eccentricity:Number(g.gasGiant.eccentricity)||0,massEarth:Number(V.inputs.massEarth)||null,massMjup:Number(g.gasGiant.massMjup)||null,rotationPeriodHours:Number(g.gasGiant.rotationPeriodHours)||null,siblingCount:Math.max(x.length-(e?1:0),0),starHabitableZoneAu:T||null,hostFrameId:$},contextText:`Host frame: ${w?.hostFrame?.label||"Primary star"}
Parent: ${g.gasGiant.name||g.gasGiant.id} (${ct(g.gasGiant).toLowerCase()})
Parent orbit: ${m(V.inputs.semiMajorAxisAu,3)} AU
${f>5e-4?`Companion flux: ${m(f,3)}x Earth
`:""}${G>.001?`Flux variability: ${m(G*100,1)}%`:"Flux variability: low"}`,model:ce.find(X=>X.raw.id===e)?.model||ce.find(X=>X.raw.inputs===i)?.model||ce[0]?.model||ht({starMassMsol:Number(p.massMsol)||1,starAgeGyr:Number(p.ageGyr)||4.6,starMetallicityFeH:Number(p.metallicityFeH)||0,starRadiusRsolOverride:p.radiusRsolOverride??null,starLuminosityLsolOverride:p.luminosityLsolOverride??null,starTempKOverride:p.tempKOverride??null,starEvolutionMode:p.evolutionMode||"zams",hostFrameId:$,hostFrame:w?.hostFrame||null,hostWindPressureEarthAt1Au:Z,companionFluxEarth:f,companionXuvFluxEarth:a,companionWindPressureEarth:U,fluxVariabilityFraction:G,moon:i,parentOverride:V})}}let S=g.inputs||{...t.planet},L=Qt({starMassMsol:Number(p.massMsol)||1,starAgeGyr:Number(p.ageGyr)||4.6,starMetallicityFeH:Number(p.metallicityFeH)||0,starRadiusRsolOverride:p.radiusRsolOverride??null,starLuminosityLsolOverride:p.luminosityLsolOverride??null,starTempKOverride:p.tempKOverride??null,starEvolutionMode:p.evolutionMode||"zams",hostFrameId:$,hostFrame:w?.hostFrame||null,hostXuvFluxEarthAt1Au:W,hostPrebioticUvEarthAt1Au:K,hostWindPressureEarthAt1Au:Z,companionFluxEarth:f,companionXuvFluxEarth:a,companionPrebioticUvEarth:D,companionWindPressureEarth:U,fluxVariabilityFraction:G,planet:S,moons:x.map(A=>A.inputs||{}),gasGiants:de(t).filter(A=>Ee(A?.hostFrameId,I?.defaultHostFrameId)===$).map(A=>({name:A.name,au:A.au}))}),_=ka(L),Q=St({starMassMsol:Number(p.massMsol)||1,starAgeGyr:Number(p.ageGyr)||4.6,starMetallicityFeH:Number(p.metallicityFeH)||0,starRadiusRsolOverride:p.radiusRsolOverride??null,starLuminosityLsolOverride:p.luminosityLsolOverride??null,starTempKOverride:p.tempKOverride??null,starEvolutionMode:p.evolutionMode||"zams",starHabitableZoneAu:T,hostFrameId:$,hostFrame:w?.hostFrame||null,hostXuvFluxEarthAt1Au:W,hostPrebioticUvEarthAt1Au:K,hostWindPressureEarthAt1Au:Z,companionFluxEarth:f,companionXuvFluxEarth:a,companionPrebioticUvEarth:D,companionWindPressureEarth:U,fluxVariabilityFraction:G,parentKind:"planet",parentOverride:_,moonEntries:x.length?x:[{id:e||"draft-moon",planetId:l,inputs:i}]});return{parentType:"planet",parentOverride:_,parentInfo:{parentId:l??null,parentKind:"planet",parentName:l&&t.planets.byId?.[l]?.name||"Planet",assigned:l!=null,orbitAu:Number(S.semiMajorAxisAu)||Number(_.inputs.semiMajorAxisAu)||null,eccentricity:Number(S.eccentricity)||0,massEarth:Number(S.massEarth)||Number(_.inputs.massEarth)||null,massMjup:null,rotationPeriodHours:Number(S.rotationPeriodHours)||null,siblingCount:Math.max(x.length-(e?1:0),0),starHabitableZoneAu:T||null,hostFrameId:$},contextText:`Host frame: ${w?.hostFrame?.label||"Primary star"}
Planet Mass: ${m(S.massEarth,3)} MEarth
Planet orbit: ${m(S.semiMajorAxisAu,3)} AU
${f>5e-4?`Companion flux: ${m(f,3)}x Earth
`:""}${G>.001?`Flux variability: ${m(G*100,1)}%`:"Flux variability: low"}`,model:Q.find(A=>A.raw.id===e)?.model||Q.find(A=>A.raw.inputs===i)?.model||Q[0]?.model||ht({starMassMsol:Number(p.massMsol)||1,starAgeGyr:Number(p.ageGyr)||4.6,starMetallicityFeH:Number(p.metallicityFeH)||0,starRadiusRsolOverride:p.radiusRsolOverride??null,starLuminosityLsolOverride:p.luminosityLsolOverride??null,starTempKOverride:p.tempKOverride??null,starEvolutionMode:p.evolutionMode||"zams",hostFrameId:$,hostFrame:w?.hostFrame||null,hostWindPressureEarthAt1Au:Z,companionFluxEarth:f,companionXuvFluxEarth:a,companionWindPressureEarth:U,fluxVariabilityFraction:G,planet:S,moon:i})}}function ee(){Gt();let t=le(q(),{moonId:o.moonId,moonInputs:o.moon,planetId:o.moonPlanetId});Ba.textContent=t.contextText;let e=t.model,i=ca(e),r=e.habitability?.earthSimilarityBreakdown||{},c=e.habitability?.breakdown||{},d=e.biosphere||{},l=e.geology||{},M=e.display.surfaceBiosphere.includes("Surface sterile")?"Sterile":e.display.surfaceBiosphere.includes("Marginal")?"Marginal":e.display.surfaceBiosphere.includes("Microbial")?"Microbial":e.display.surfaceBiosphere.includes("Simple")?"Simple":e.display.surfaceBiosphere.includes("Complex")?"Complex":e.display.surfaceBiosphere,y=e.atmosphere?.dominantSpecies?`${e.atmosphere.dominantSpecies}-dominant`:"None",x=l.resurfacingDominantProcess==="volcanic"?"Volcanic":l.resurfacingDominantProcess==="cryovolcanic"?"Cryovolcanic":l.resurfacingDominantProcess==="mixed"?"Mixed":"Quiet",g=d.limitingFactors?.length?`${d.limitingFactors.length} blocker${d.limitingFactors.length===1?"":"s"}`:"Clear",I=e.display.orbitalFate.startsWith("Roche limit")?"Inward decay":e.display.orbitalFate.startsWith("Escape")?"Outward drift":"Stable",H=c.solventPolicyVersion||"surface-plus-subsurface-water-v1",w=H==="surface-subsurface-plus-alt-solvents-v1"?"surface + subsurface + alt solvents":H==="surface-plus-subsurface-water-v1"?"surface + subsurface water":"surface water only",p=e.habitability?.summary||{},v=p.surfaceExomoonCalibration||{},T=v.applicable===!0?[v.starClassBand,v.hostGiantFavorability?.label,`Moon ${m(v.moonMassEarth??0,3)} MEarth vs floor ${m(v.moonMassFloorEarth??0,3)} MEarth`,v.spinStateBenefit?.label,...v.notes||[]].filter(Boolean).join(`
`):"Applied only to exposed-surface, atmosphere-bearing moons around cool-star giant-planet systems.",$=e.spinState?.climateNote||e.tides?.spinState?.climateNote||"",f=[p.gates?.stellarZone?.label,p.gates?.stableOrbit?.label,p.gates?.energyBudget?.label,p.gates?.atmosphereRetention?.label,p.gates?.radiationShielding?.label].filter(Boolean).join(`
`),a=(V,ce,X="",Ut={})=>({label:V,tip:R[V]||"",value:ce,meta:X,kpiClass:`kpi--compact ${Ut.kpiClass||""}`.trim(),...Ut}),W=`Substrate ${m(c.substrate??0,2)} | Solvent ${m(c.solvent??0,2)} | Energy ${m(c.energy??0,2)} | Chemistry ${m(c.chemistry??0,2)} | Stability ${m(c.stabilityMultiplier??0,2)} | Radiation ${m(c.radiationMultiplier??0,2)} | Persistence ${m(c.persistenceMultiplier??0,2)}
Pathway ${c.solventPathway||"none"} | ${w}
${e.habitability?.habitabilityModelVersion||"phi-unified-v2"} | ${H}`,K=Y.querySelector(".moon-preview-canvas"),D=V=>({...V,collapsible:!0,open:!1}),Z=uo({moonName:o.moonName||o.moon.name,model:e,moonProfile:i,compactLifeLimits:g,compactOrbitalFate:I}),U="Radiative global equilibrium; excludes local time, roughness, and thermal inertia.",G=[`${String(e.display.thermalEnvelopeConfidence||"medium").toUpperCase()} confidence`,"Compare measured or brightness-style local temperatures with this range; global equilibrium is the radiative baseline.",e.display.thermalEnvelopeCaveats].filter(Boolean).join(" | "),S=[e.display.tidalResponseModel,e.display.tidalUncertaintyCaveats].filter(Boolean).join(" | "),L=[{id:"moon-summary",title:"Key Numbers",items:[{kind:"preview",label:"Appearance",tip:R.Appearance||"",canvasClass:"moon-preview-canvas",metaChildren:[i.displayClass," \u2014 ",i.terrain.type.replace("-"," ")]},a("Composition",e.display.compositionClass),a("Radius",e.display.radius,"derived"),a("Surface Temp",e.display.surfaceTemp),a("Global Equilibrium",e.display.globalEquilibriumTemp||e.display.equilibriumTemp,U),a("Observable Surface Range",e.display.observableSurfaceRange,G),a("Hydrosphere",e.display.hydrosphereState),a("Atmosphere",e.display.atmosphereClass,e.display.atmosphereSource),a("Tidal Regime",e.display.tidalRegime,S),a("Life Class",e.display.lifeClass,e.display.habitabilityGates),a("Habitability Index",e.display.habitabilityIndex,W)]},D({id:"moon-identity",title:"Identity & Class",density:"compact",items:[a("Composition",e.display.compositionClass),a("Albedo",m(o.moon.albedo,3))]}),D({id:"moon-physical",title:"Physical State",density:"compact",items:[a("Mass",`${m(o.moon.massMoon,3)} M\u263E`),a("Density",`${m(o.moon.densityGcm3,2)} g/cm\xB3`),a("Radius",e.display.radius,"derived"),a("Gravity",e.display.gravity),a("Escape Velocity",e.display.esc)]}),D({id:"moon-environment",title:"Environment",density:"compact",items:[a("Atmosphere",e.display.atmosphereClass,e.display.atmosphereSource),a("Environment Forcing",e.display.environmentForcing,Array.isArray(e.environment?.forcing?.caveats)&&e.environment.forcing.caveats.length?e.environment.forcing.caveats.join(" | "):"Canonical host-frame UV, XUV, wind, and light context"),a("Surface Pressure",e.display.surfacePressure),a("Atmosphere Mix",y,e.display.atmosphereComposition),a("Greenhouse Warming",e.display.greenhouseWarming),a("Atmosphere Stability",e.display.atmosphereStability,e.display.atmosphereLoss),a("Atmosphere Trend",e.display.atmosphereTrend,e.atmosphere?.ledger?.confidence?`${String(e.atmosphere.ledger.confidence).toUpperCase()} confidence`:""),a("Dominant Source",e.display.atmosphereDominantSource,e.atmosphere?.ledger?.dominantSource?.reason||""),a("Dominant Sink",e.display.atmosphereDominantSink,e.atmosphere?.ledger?.dominantSink?.reason||""),a("Stability Timescale",e.display.atmosphereStabilityTimescale,e.atmosphere?.ledger?.netBalance!=null?`net ${m(e.atmosphere.ledger.netBalance,2)}`:""),a("Coupled Climate Tendency",e.display.coupledClimateTendency,`${e.display.photochemicalForcing} | baseline temperature unchanged`),a("Photochemical Forcing",e.display.photochemicalForcing,e.climateChemistryForcing?.confidence?`${String(e.climateChemistryForcing.confidence).toUpperCase()} confidence`:""),a("Cloud Regime",e.display.cloudRegime,e.cloudCirculation?.confidence?`${String(e.cloudCirculation.confidence).toUpperCase()} confidence`:""),a("Heat Redistribution",e.display.heatRedistribution,e.cloudCirculation?.substellarCloudDeckLikelihood!=null?`Substellar deck ${m(e.cloudCirculation.substellarCloudDeckLikelihood*100,0)}%`:""),a("Atmosphere Lifetime",e.display.atmosphereLifetime),a("Atmosphere Haze",e.display.atmosphereHaze),a("Atmosphere Clouds",e.display.atmosphereClouds),a("Hydrosphere",e.display.hydrosphereState),a("Surface Ices",e.display.surfaceIces),a("Surface Water",e.display.surfaceWater),a("Subsurface Ocean",e.display.subsurfaceOcean),a("Ocean Depth",e.display.oceanDepth),a("Ice Shell",e.display.iceShell),a("High-Pressure Ice",e.display.highPressureIce,e.display.oceanPhaseDiagnostics),a("Interior Structure",e.display.interiorStructure),a("Ocean Chemistry",e.display.oceanChemistry,e.oceanChemistryContext?.confidence?`${String(e.oceanChemistryContext.confidence).toUpperCase()} confidence`:""),a("Global Equilibrium",e.display.globalEquilibriumTemp||e.display.equilibriumTemp,U),a("Observable Surface Range",e.display.observableSurfaceRange,G),a("Equilibrium Temp",e.display.equilibriumTemp),a("Climate State",e.display.climateState),a("Collapse State",e.display.collapseState),a("Surface Temp Range",e.display.surfaceTempRange),a("Day/Night Contrast",e.display.dayNightContrast),a("Nightside Min",e.display.nightsideMin),a("Climate Zones",e.display.climateZones,e.display.climateZoneSummary),a("Seasonality",e.display.seasonality)]}),D({id:"moon-system",title:"System Context",density:"compact",items:[a("Orbital Period (sidereal)",e.display.sidereal),a("Orbital Period (synodic)",e.display.synodic),a("Rotation Period",e.display.rot),a("Spin State",e.display.spinState,$),a("Initial Rotation Period",e.display.initialRot),a("Planetshine",e.display.planetshine),a("Eclipse Cooling",e.display.eclipseCooling),a("Nearest Resonance",e.display.nearestResonance),a("Laplace Status",e.display.laplaceStatus),a("Forced Eccentricity",e.display.forcedEccentricity),a("Migration Trend",e.display.migrationTrend),a("Tidal HZ",e.display.tidalHabitableZone),a("Formation",e.display.formation),a("Orbital Recession",e.display.recession),a("Orbital Fate",I,I==="Stable"?"No strong inward decay or outward escape trend is currently predicted":e.display.orbitalFate)]}),D({id:"moon-activity",title:"Activity & Radiation",density:"compact",items:[a("Total Tidal Force",e.display.tides),a("Tidal Regime",e.display.tidalRegime,S),a("Moon Contribution",e.display.moonPct),a("Star Contribution",e.display.starPct),a("Tidal Heating",e.display.tidalHeating,e.display.tidalHeatingTotal),a("Tidal Heating (\xD7 Earth)",e.display.tidalHeatingXEarth),a("Volcanic Activity",e.display.volcanicActivity,`score ${m(l.volcanicActivityScore??0,2)}`),a("Cryovolcanism",e.display.cryovolcanicActivity,`score ${m(l.cryovolcanicActivityScore??0,2)}`),a("Resurfacing",x,`${e.display.resurfacing}
${l.resurfacingDominantProcess==="none"?"No dominant resurfacing driver":`${l.resurfacingDominantProcess||"mixed"}-driven`}`),a("Carbon Cycle",e.display.carbonCycle,e.carbonCycleContext?.confidence?`${String(e.carbonCycleContext.confidence).toUpperCase()} confidence`:""),a("Volatile Supply",e.display.volatileReplenishment,`score ${m(l.volatileReplenishmentScore??0,2)}`),a("Ocean Persistence",e.display.oceanPersistence,`score ${m(l.oceanPersistenceScore??0,2)}`),a("Radiogenic Heating",e.display.radiogenicHeating),a("Magnetosphere Dose",e.display.magnetosphericRad,e.display.parentMagnetosphereCompression&&e.display.parentMagnetosphereCompression!=="Not evaluated"?`${e.display.magnetosphericLabel}
${e.display.parentMagnetosphereCompression}`:e.display.magnetosphericLabel),a("Surface Radiation",e.display.surfaceRadiation),a("Magnetic Shielding",e.display.magneticShielding)]}),D({id:"moon-habitability",title:"Habitability",density:"compact",items:[a("Life Class",e.display.lifeClass,e.display.habitabilityGates),a("Habitability Index",e.display.habitabilityIndex,W),a("Earth Similarity Index",e.display.earthSimilarityIndex,`Radius ${m(r.radius??0,2)} | Density ${m(r.density??0,2)} | Escape ${m(r.escapeVelocity??0,2)} | Temp ${m(r.surfaceTemp??0,2)}`),a("Surface Habitability",e.display.surfaceHabitability,p.gates?.radiationShielding?.label||""),a("Surface Exomoon Calibration",e.display.surfaceExomoonCalibration,T),a("Subsurface Habitability",e.display.subsurfaceHabitability),a("Habitability Gates",e.display.habitabilityGates,f),...e.oceanChemistryContext?.applicable?[a("Ocean Chemistry",e.display.oceanChemistry,[e.display.carbonateSaturation,e.display.nutrientSupport,e.oceanChemistryContext?.confidence?`${String(e.oceanChemistryContext.confidence).toUpperCase()} confidence`:""].filter(Boolean).join(" | "))]:[],a("Biosignature Context",e.display.biosignatureContext,e.biosignatureContext?.confidence?`${String(e.biosignatureContext.confidence).toUpperCase()} confidence`:"Context only; not a life detection"),a("Disequilibrium",e.display.disequilibriumStrength,e.biosignatureContext?.replenishmentDemandClass?`Source demand ${e.biosignatureContext.replenishmentDemandClass}`:""),a("O2/O3 False Positive",e.display.oxygenFalsePositiveRisk,`Methane: ${e.display.methaneContext} | CO buildup ${e.display.coBuildupRisk}`),a("Biosphere",M,`${e.display.surfaceBiosphere}
Score ${m(d.surfaceBiologyScore??0,2)}`),a("Plant Life",e.display.plantLife),a("Vegetation",e.biosphere?.vegetationEligible?"Yes":"No",e.display.vegetation==="Supported"?"Surface vegetation is supported by the current biosphere gate":e.display.vegetationNote),a("Life Limits",g,e.display.biosphereLimits),...e.biosphere?.vegetationEligible?[a("Veg Colours","Available",`${e.display.vegetationColours}
${e.display.vegetationNote}`)]:[]]})];Fa(Y,L),Oa(Y,Z);let _=Ra(e.derived?.eraTimeline,{id:"moon-era-timeline"});_&&Y.insertBefore(_,Y.children[2]||null),Ga(Ft,[{id:"moon-details-identity",title:"Identity & Class",items:[{label:"Name",value:o.moonName||o.moon.name||"Moon"},{label:"Composition",value:e.display.compositionClass},{label:"Albedo",value:m(o.moon.albedo,3)}]},{id:"moon-details-physical",title:"Physical State",items:[{label:"Mass",value:`${m(o.moon.massMoon,3)} M\u263E`},{label:"Density",value:`${m(o.moon.densityGcm3,2)} g/cm\xB3`},{label:"Radius",value:e.display.radius},{label:"Gravity",value:e.display.gravity},{label:"Escape Velocity",value:e.display.esc}]},{id:"moon-details-environment",title:"Environment",items:[{label:"Atmosphere",value:e.display.atmosphereClass,meta:e.display.atmosphereSource},{label:"Surface Pressure",value:e.display.surfacePressure},{label:"Atmosphere Mix",value:y,meta:e.display.atmosphereComposition},{label:"Greenhouse Warming",value:e.display.greenhouseWarming},{label:"Atmosphere Stability",value:e.display.atmosphereStability,meta:e.display.atmosphereLoss},{label:"Atmosphere Trend",value:e.display.atmosphereTrend,meta:e.atmosphere?.ledger?.summary||""},{label:"Dominant Source",value:e.display.atmosphereDominantSource,meta:e.atmosphere?.ledger?.dominantSource?.reason||""},{label:"Dominant Sink",value:e.display.atmosphereDominantSink,meta:e.atmosphere?.ledger?.dominantSink?.reason||""},{label:"Stability Timescale",value:e.display.atmosphereStabilityTimescale,meta:Array.isArray(e.atmosphere?.ledger?.caveats)&&e.atmosphere.ledger.caveats.length?e.atmosphere.ledger.caveats.join(" | "):""},{label:"Coupled Climate Tendency",value:e.display.coupledClimateTendency,meta:e.climateChemistryForcing?.optInClimateState||"Derived-only diagnostic; baseline climate state retained"},{label:"Photochemical Forcing",value:e.display.photochemicalForcing,meta:e.climateChemistryForcing?[`Haze ${m(e.climateChemistryForcing.hazeDeltaK||0,1)} K`,`CH4 ${m(e.climateChemistryForcing.methaneGreenhouseDeltaK||0,1)} K`,`SO2 ${m(e.climateChemistryForcing.sulfurAerosolDeltaK||0,1)} K`,`Cloud ${m(e.climateChemistryForcing.cloudAlbedoDeltaK||0,1)} K`,`H2O feedback ${m(e.climateChemistryForcing.waterVaporFeedbackDeltaK||0,1)} K`].join(" | "):""},{label:"Cloud Regime",value:e.display.cloudRegime,meta:Array.isArray(e.cloudCirculation?.notes)&&e.cloudCirculation.notes.length?e.cloudCirculation.notes.join(" | "):e.cloudCirculation?.confidence?`${String(e.cloudCirculation.confidence).toUpperCase()} confidence`:""},{label:"Heat Redistribution",value:e.display.heatRedistribution,meta:e.cloudCirculation?.collapseRiskModifier!=null?`Collapse risk modifier ${m(e.cloudCirculation.collapseRiskModifier,2)}`:""},{label:"Cloud Albedo Effect",value:e.display.cloudAlbedoEffect,meta:e.cloudCirculation?.cloudFraction!=null?`Cloud fraction ${m(e.cloudCirculation.cloudFraction*100,0)}% | deck likelihood ${m((e.cloudCirculation.substellarCloudDeckLikelihood||0)*100,0)}%`:""},{label:"Atmosphere Lifetime",value:e.display.atmosphereLifetime},{label:"Atmosphere Haze",value:e.display.atmosphereHaze},{label:"Atmosphere Clouds",value:e.display.atmosphereClouds},{label:"Hydrosphere",value:e.display.hydrosphereState},{label:"Surface Water",value:e.display.surfaceWater},{label:"Subsurface Ocean",value:e.display.subsurfaceOcean},{label:"Ocean Depth",value:e.display.oceanDepth},{label:"Ice Shell",value:e.display.iceShell},{label:"High-Pressure Ice",value:e.display.highPressureIce,meta:e.display.oceanPhaseDiagnostics},{label:"Interior Structure",value:e.display.interiorStructure},{label:"Ocean Chemistry",value:e.display.oceanChemistry,meta:Array.isArray(e.oceanChemistryContext?.notes)&&e.oceanChemistryContext.notes.length?e.oceanChemistryContext.notes.join(" | "):""},{label:"Global Equilibrium",value:e.display.globalEquilibriumTemp||e.display.equilibriumTemp,meta:U},{label:"Observable Surface Range",value:e.display.observableSurfaceRange,meta:G},{label:"Climate State",value:e.display.climateState},{label:"Collapse State",value:e.display.collapseState},{label:"Day/Night Contrast",value:e.display.dayNightContrast},{label:"Nightside Min",value:e.display.nightsideMin},{label:"Climate Zones",value:e.display.climateZones,meta:e.display.climateZoneSummary},{label:"Seasonality",value:e.display.seasonality}]},{id:"moon-details-system",title:"System Context",items:[{label:"Classical Roche Limit",value:e.display.classicalRocheLimit},{label:"Effective Inner Limit",value:e.display.effectiveInnerLimit||e.display.zoneInner,meta:e.display.innerLimitNote},{label:"Moon Zone (Outer)",value:e.display.zoneOuter},{label:"Periapsis",value:e.display.peri},{label:"Apoapsis",value:e.display.apo},{label:"Orbital Direction",value:e.orbit.orbitalDirection},{label:"Orbital Period (sidereal)",value:e.display.sidereal},{label:"Orbital Period (synodic)",value:e.display.synodic},{label:"Rotation Period",value:e.display.rot},{label:"Spin State",value:e.display.spinState,meta:$},{label:"Initial Rotation Period",value:e.display.initialRot},{label:"Planetshine",value:e.display.planetshine},{label:"Eclipse Cooling",value:e.display.eclipseCooling},{label:"Nearest Resonance",value:e.display.nearestResonance},{label:"Laplace Status",value:e.display.laplaceStatus},{label:"Forced Eccentricity",value:e.display.forcedEccentricity},{label:"Migration Trend",value:e.display.migrationTrend},{label:"Tidal HZ",value:e.display.tidalHabitableZone},{label:"Formation",value:e.display.formation},{label:"Orbital Recession",value:e.display.recession},{label:"Orbital Fate",value:e.display.orbitalFate},{label:"Moon locked to Planet",value:e.display.moonLocked},{label:"Planet locked to Moon",value:e.display.planetLockedMoon},{label:"Planet locked to Star",value:e.display.planetLockedStar},{label:"Lock time (Moon\u2192Planet)",value:e.display.tMoonLock},{label:"Lock time (Planet\u2192Moon)",value:e.display.tPlanetMoon},{label:"Lock time (Planet\u2192Star)",value:e.display.tPlanetStar}]},{id:"moon-details-activity",title:"Activity & Radiation",items:[{label:"Total Tidal Force",value:e.display.tides},{label:"Tidal Regime",value:e.display.tidalRegime,meta:S},{label:"Host Tidal Q",value:e.display.tidalHostQ},{label:"Moon Contribution",value:e.display.moonPct},{label:"Star Contribution",value:e.display.starPct},{label:"Tidal Heating",value:e.display.tidalHeating,meta:e.display.tidalHeatingTotal},{label:"Tidal Heating (\xD7 Earth)",value:e.display.tidalHeatingXEarth},{label:"Volcanic Activity",value:e.display.volcanicActivity,meta:`score ${m(l.volcanicActivityScore??0,2)}`},{label:"Cryovolcanism",value:e.display.cryovolcanicActivity,meta:`score ${m(l.cryovolcanicActivityScore??0,2)}`},{label:"Resurfacing",value:x,meta:l.resurfacingDominantProcess==="none"?"No dominant resurfacing driver":`${l.resurfacingDominantProcess||"mixed"}-driven`},{label:"Carbon Cycle",value:e.display.carbonCycle,meta:Array.isArray(e.carbonCycleContext?.notes)&&e.carbonCycleContext.notes.length?e.carbonCycleContext.notes.join(" | "):e.carbonCycleContext?.confidence?`${String(e.carbonCycleContext.confidence).toUpperCase()} confidence`:""},{label:"Weathering Efficiency",value:e.display.weatheringEfficiency,meta:`Limiter: ${e.carbonCycleContext?.weatheringLimiter||"not evaluated"}`},{label:"Volcanic Supply",value:e.display.volcanicSupply,meta:`Recycling limiter: ${e.carbonCycleContext?.recyclingLimiter||"not evaluated"}`},{label:"Carbon Recycling",value:e.display.carbonRecycling,meta:`Thermostat strength ${e.display.carbonThermostat}`},{label:"Volatile Supply",value:e.display.volatileReplenishment,meta:`score ${m(l.volatileReplenishmentScore??0,2)}`},{label:"Ocean Persistence",value:e.display.oceanPersistence,meta:`score ${m(l.oceanPersistenceScore??0,2)}`},{label:"Radiogenic Heating",value:e.display.radiogenicHeating},{label:"Magnetosphere Dose",value:e.display.magnetosphericRad,meta:e.display.parentMagnetosphereCompression&&e.display.parentMagnetosphereCompression!=="Not evaluated"?`${e.display.magnetosphericLabel} | ${e.display.parentMagnetosphereCompression}`:e.display.magnetosphericLabel},{label:"Surface Radiation",value:e.display.surfaceRadiation},{label:"Magnetic Shielding",value:e.display.magneticShielding}]},{id:"moon-details-habitability",title:"Habitability",items:[{label:"Life Class",value:e.display.lifeClass,meta:e.display.habitabilityGates},{label:"Habitability Index",value:e.display.habitabilityIndex,meta:W.replace(/\n/g," | ")},{label:"Earth Similarity Index",value:e.display.earthSimilarityIndex,meta:`Radius ${m(r.radius??0,2)} | Density ${m(r.density??0,2)} | Escape ${m(r.escapeVelocity??0,2)} | Temp ${m(r.surfaceTemp??0,2)}`},{label:"Surface Habitability",value:e.display.surfaceHabitability,meta:p.gates?.radiationShielding?.label||""},{label:"Surface Exomoon Calibration",value:e.display.surfaceExomoonCalibration,meta:T.replace(/\n/g," | ")},{label:"Subsurface Habitability",value:e.display.subsurfaceHabitability},{label:"Habitability Gates",value:e.display.habitabilityGates,meta:f.replace(/\n/g," | ")},e.oceanChemistryContext?.applicable?{label:"Ocean Chemistry",value:e.display.oceanChemistry,meta:Array.isArray(e.oceanChemistryContext?.notes)&&e.oceanChemistryContext.notes.length?e.oceanChemistryContext.notes.join(" | "):""}:null,e.oceanChemistryContext?.applicable?{label:"Carbonate Saturation",value:e.display.carbonateSaturation,meta:`Acidity: ${e.display.oceanAcidity} | Freezing point ${m(e.oceanChemistryContext.freezingPointK,1)} K`}:null,e.oceanChemistryContext?.applicable?{label:"Nutrient Support",value:e.display.nutrientSupport,meta:`Rock-ocean access ${m(e.oceanChemistryContext.rockOceanAccess??0,2)} | Hydrothermal: ${e.oceanChemistryContext.hydrothermalSupportClass||"not evaluated"}`}:null,{label:"Biosignature Context",value:e.display.biosignatureContext,meta:Array.isArray(e.biosignatureContext?.notes)&&e.biosignatureContext.notes.length?e.biosignatureContext.notes.join(" | "):"Context only; not a life detection"},{label:"Disequilibrium",value:e.display.disequilibriumStrength,meta:`Source demand ${e.biosignatureContext?.replenishmentDemandClass||"Low"}`},{label:"O2/O3 False Positive",value:e.display.oxygenFalsePositiveRisk,meta:`CO buildup risk ${e.display.coBuildupRisk} | Methane: ${e.display.methaneContext}`},{label:"Biosphere",value:e.display.surfaceBiosphere,meta:`Score ${m(d.surfaceBiologyScore??0,2)}`},{label:"Plant Life",value:e.display.plantLife},{label:"Vegetation",value:e.display.vegetation,meta:e.display.vegetationNote},{label:"Life Limits",value:g,meta:e.display.biosphereLimits},...e.biosphere?.vegetationEligible?[{label:"Veg Colours",value:e.display.vegetationColours,meta:e.display.vegetationNote}]:[]]}],{title:"Derived Details"});let Q=Ft.querySelector(".derived-details");Q&&Y.append(Q),ha(Y,{label:"Moon output sections",includeAll:!0});let A=Y.querySelector(".moon-preview-canvas");K&&A&&K!==A&&(A.replaceWith(K),A=K),A&&i?k.attach(A,{bodyType:"moon",name:o.moonName||o.moon.name||"Moon",recipeId:String(o.moon?.appearanceRecipeId||""),moonProfile:i,moonCalc:e,rotationPeriodDays:Number(e?.orbit?.rotationPeriodDays)||Number(e?.orbit?.periodSiderealDays)||27.3}):k.detach()}function te(){Gt(),Za(),Wa(),he.value=o.moonName,Re.value=o.moon.semiMajorAxisKm,$e.value=o.moon.eccentricity,Te.value=o.moon.inclinationDeg,Ne.value=o.moon.massMoon,He.value=o.moon.densityGcm3,Fe.value=o.moon.albedo,Oe.value=o.moon.compositionOverride||"",Ge.value=o.moon.initialRotationPeriodHours||12,Be.value=o.moon.waterMassFractionPct??0,je.value=o.moon.salinityPct??0,Ke.value=o.moon.ammoniaPct??0,ye.value=o.moon.differentiatedInterior===!0?"yes":o.moon.differentiatedInterior===!1?"no":"",_e.value=o.moon.radioisotopeAbundance??1,Ve.value=o.moon.u238Abundance??1,ze.value=o.moon.u235Abundance??1,We.value=o.moon.th232Abundance??1,Ze.value=o.moon.k40Abundance??1,Qe.value=o.moon.manualSurfacePressureAtm??0,Xe.value=o.moon.n2Pct??0,Ye.value=o.moon.o2Pct??0,Je.value=o.moon.co2Pct??0,et.value=o.moon.arPct??0,tt.value=o.moon.h2oPct??0,at.value=o.moon.ch4Pct??0,ot.value=o.moon.coPct??0,it.value=o.moon.h2Pct??0,nt.value=o.moon.hePct??0,rt.value=o.moon.so2Pct??0,st.value=o.moon.nh3Pct??0,lt.value=o.moon.forcedEccentricity??0,ie.value=o.moon.manualResonanceGroupId||"",ne.value=o.moon.manualResonanceOrder??"",re.value=o.moon.manualResonanceRatio??"",_a(),qt()}let ut=!1;function z(){if(ut)return;ut=!0;let t=q(),e=t.moons.selectedId,i=he.value||"New Moon",r=Ie.value||null,c=za(),d=le(t,{moonId:e,moonInputs:c,planetId:r}).model,l=String(d?.orbit?.semiMajorAxisGuard||"none"),M=Number(d?.inputs?.semiMajorAxisKm),y=Number(c.semiMajorAxisKm),x=Number.isFinite(M)?Math.round(M):y,g=l!=="none"&&Number.isFinite(x),I={...c,semiMajorAxisKm:g?x:y};ke(e,{name:i,inputs:I}),na(e,r),mt({moon:I}),g&&Math.abs(I.semiMajorAxisKm-y)>1e-9&&ge(`Semi-Major Axis adjusted to ${m(I.semiMajorAxisKm,0)} km to keep this moon within the Moon Zone.`),te(),ee(),ut=!1}he.addEventListener("change",z),Oe.addEventListener("change",z),Ie.addEventListener("change",z),ye.addEventListener("change",z),ie.addEventListener("change",z),ne.addEventListener("change",z),re.addEventListener("change",z),[Le,qe,De,Ue].forEach(t=>{t?.addEventListener("change",()=>{z(),qt()})}),[Xe,Ye,Je,et,tt,at,ot,it,nt,rt,st].forEach(t=>{t?.addEventListener("change",z)}),oe.addEventListener("change",()=>{ta(oe.value),te(),ee()}),Ae.addEventListener("click",t=>{t.preventDefault();let e=q(),i=ae(e)?.inputs||e.moon;aa(i,{name:"New Moon",planetId:e.planets.selectedId}),te(),ee()}),Da.addEventListener("click",async t=>{t.preventDefault();let e=q();if(e.moons.order.length<=1)return;let i=ia(e.moons.selectedId,e);!i||!await ga(i)||(oa(e.moons.selectedId),te(),ee())}),ja?.addEventListener("click",()=>{Se()}),Ka?.addEventListener("click",()=>{Ce()}),Ua?.addEventListener("click",()=>{io(t=>{dt(Ia(t.apply,t.id),{noticeLabel:t.label||"Moon recipe"})})}),n.querySelector("#btn-default").addEventListener("click",()=>{o.moon={name:"Luna",semiMajorAxisKm:384748,eccentricity:.055,inclinationDeg:5.15,massMoon:1,densityGcm3:3.34,albedo:.11,initialRotationPeriodHours:null};let t=q();ke(t.moons.selectedId,{name:o.moon.name||"Luna",inputs:o.moon}),te(),ee()});let Dt=Object.freeze([{id:"type",label:"Goal"},{id:"parent-context",label:"Setup"},{id:"goal-details",label:"Traits"},{id:"recommendation",label:"Recommendation"}]);function Xa(t){let e=Dt.findIndex(i=>i.id===String(t||""));return e>=0?e:0}function Bt(){let t=q(),e=ae(t),i=e?.id||o.moonId,r=e?.planetId??o.moonPlanetId??null,c=e?.inputs||o.moon,d=le(t,{moonId:i,moonInputs:c,planetId:r}),l=d.parentInfo?.parentClassLabel?`Current ${String(d.parentInfo.parentClassLabel).toLowerCase()} system`:"Current giant companion system",M=d.parentInfo?.assigned===!1?"No assigned parent":d.parentType==="gasGiant"?l:"Current planet system",y=d.parentInfo?.assigned===!1?`${d.contextText}
Moon is currently unassigned. Assign it to a planet or giant companion before using strict guided fitting.`:d.contextText;return{currentMoonId:i,currentMoonName:o.moonName||o.moon.name||"Moon",currentInputs:{...c||{}},currentOrbitWindowKm:{inner:Number(d.model?.orbit?.zoneInnerKm??d.model?.orbit?.moonZoneInnerKm)||null,outer:Number(d.model?.orbit?.zoneOuterKm??d.model?.orbit?.moonZoneOuterKm)||null},siblingEntries:Pe(t).filter(x=>x?.id!==i&&(x?.planetId??null)===(r??null)),currentContextLabel:M,currentContextText:y,parentContext:d.parentInfo||null,starHabitableZoneAu:d.parentInfo?.starHabitableZoneAu||null,recipeCatalog:ue,solveMoonInputs:(x,g={})=>{let I=q(),H=ae(I);return le(I,{moonId:H?.id||i,moonInputs:x,planetId:H?.planetId??r,parentPatch:g.parentPatch||null,siblingPatch:g.siblingPatch||null})}}}function Ya(t,e=[]){return Ma(t,e)}function Ja(t,e,i,r){return Sa(t,e,i,r)}function eo(t,e){return Ca(t,e,{objectType:"moon",objectLabel:"moon"})}function to(t){return xa(t,{readyDetail:"The structured goal is valid. Run Search to try seeded moon candidates.",searchingDetail:"Trying seeded moon candidates against the current parent context.",completeDetail:"Review the result, diagnostics, and context adjustments before applying.",completeTitleWithoutResult:"Ready to search"})}function fe(){let t=q(),e=ae(t);return{objectKey:e?.id||"",contextFingerprint:ya({moonId:e?.id||"",planetId:e?.planetId||null,inputs:e?.inputs||null})}}function Me(t,e,i=""){let r=e==null||e===""||typeof e=="number"&&!Number.isFinite(e)?"n/a":String(e);return E("div",{className:"moon-guided-preview__metric"},[E("div",{className:"moon-guided-preview__metric-label",text:t}),E("div",{className:"moon-guided-preview__metric-value",text:r}),i?E("div",{className:"moon-guided-preview__metric-meta",text:i}):null])}function jt(t){let e=t?.previewPayload?.moonCalc;if(!e)return null;let i=(t?.contextAdjustments||[]).join(" "),r=!!t?.applyPayload?.parentPatch,c=!!t?.applyPayload?.siblingPatch;return E("div",{className:"moon-guided-preview"},[E("div",{className:"moon-guided-preview__title",text:r&&c?"Solved preview after applying the recommended host and moon-system fixes":r?"Solved preview after applying the recommended host fixes":c?"Solved preview after applying the recommended moon-system fixes":"Solved preview in the current host context"}),E("div",{className:"moon-guided-preview__grid"},[Me("Hydrosphere",e.display?.hydrosphereState),Me("Atmosphere",e.display?.atmosphereClass,e.display?.surfacePressure),Me("Climate",e.display?.climateState),Me("Biosphere",e.display?.surfaceBiosphere,e.display?.vegetation)]),i?E("div",{className:"moon-guided-preview__summary",text:i}):null])}function ao(t){if(!t||!t.parentId||!t.parentKind)return!1;if(t.parentKind==="planet")return ea(t.parentId,{inputs:{...t.inputPatch||{}}}),!0;if(t.parentKind==="gasGiant"){let e=de().map(i=>i.id===t.parentId?{...i,...t.inputPatch||{}}:i);return sa(e),!0}return!1}function oo(t,{noticeLabel:e="Guided moon"}={}){let i=ao(t?.applyPayload?.parentPatch||null),r=ra(t?.applyPayload?.siblingPatch||null,{preserveSelectedMoonId:q().moons?.selectedId||null});return{appliedInputs:dt(t?.applyPayload?.objectInputs||{},{noticeLabel:e}),parentPatched:i,parentPatchSummary:t?.applyPayload?.parentPatch?.summary||"",siblingPatched:!!r?.changed,siblingPatchSummary:t?.applyPayload?.siblingPatch?.summary||"",siblingPatchCreatedCount:r?.createdMoonIds?.length||0,siblingPatchUpdatedCount:r?.updatedMoonIds?.length||0}}function Se(t=null,e=""){let i=Ct(),r=Bt(),c=fe(),{overlayEl:d,contentEl:l,closeButtonEl:M}=wt(),y=null;function x(w=!1){y?.cancelSearch?.("overlay-closed"),j.delete(I),w||gt("moon"),d.remove(),document.removeEventListener("keydown",H)}function g(){x(!1),e&&location.hash!==e&&(location.hash=e)}let I=()=>x(!0);function H(w){w.key==="Escape"&&g()}y=ft({adapter:i,context:r,initialState:{objectType:"moon",uxMode:"quick",selectedArchetypeId:t?.selectedArchetypeId||"",answers:t?.answers||{}},onUpdate:({state:w,archetypes:p,questions:v,recommendation:T})=>{let $=Mt({title:"Moon Quick Types",subtitle:"Pick a defensible starting point. Each option maps to an engine-backed moon preset and is re-solved in the current parent context.",archetypes:(p||[]).filter(f=>f?.quickEnabled!==!1),selectedArchetypeId:w.selectedArchetypeId||"",questions:v,answers:w.answers,recommendation:T,previewContent:jt(T),actions:[{id:"apply",label:T?.diagnostics?.some(f=>f?.severity==="warning")?"Apply Starting Point":"Apply Quick Type",disabled:!T}],onArchetypeSelect:f=>y?.selectArchetype(f),onQuestionChange:(f,a)=>y?.setAnswer(f,a),onAction:f=>{f!=="apply"||!T||(y?.apply({applyMoonInputs:a=>dt(a,{noticeLabel:T.title||"Moon quick type"})}),g())}});l.replaceChildren($),bt("moon",{...c,uxMode:"quick",...yt(w)})}}),j.add(I),M.addEventListener("click",g),d.addEventListener("click",w=>{w.target===d&&g()}),document.addEventListener("keydown",H),document.body.appendChild(d)}function Ce(t=null,e=""){let i=Ct(),r=Bt(),c=fe(),{overlayEl:d,contentEl:l,closeButtonEl:M}=wt(),y=null;function x(v=!1){y?.cancelSearch?.("overlay-closed"),j.delete(I),v||gt("moon"),d.remove(),document.removeEventListener("keydown",H)}function g(){x(!1),e&&location.hash!==e&&(location.hash=e)}let I=()=>x(!0);function H(v){v.key==="Escape"&&g()}function w(v,T=[]){let $=String(v?.currentStepId||"type");return $==="type"?"parent-context":$==="parent-context"&&T.some(f=>f?.stepId==="goal-details")?"goal-details":"recommendation"}function p(v){let T=String(v?.currentStepId||"type");return T==="recommendation"?(v?.questions||[]).some($=>$?.stepId==="goal-details")?"goal-details":"parent-context":T==="goal-details"?"parent-context":"type"}y=ft({adapter:i,context:r,searchMode:"manual",initialState:{objectType:"moon",uxMode:"guided",currentStepId:t?.currentStepId||"type",selectedArchetypeId:t?.selectedGoalTemplateId||"",selectedGoalTemplateId:t?.selectedGoalTemplateId||"",goalDraft:t?.goalDraft||{},compiledGoal:t?.compiledGoal||null,searchStatus:t?.searchStatus||"idle",lastSearchResult:t?.lastSearchResult||null,lastSearchContextFingerprint:t?.lastSearchContextFingerprint||"",lastSearchEngineFingerprint:t?.lastSearchEngineFingerprint||""},onUpdate:({state:v,archetypes:T,questions:$,recommendation:f})=>{let a=String(v.currentStepId||"type"),W=Xa(a),K=($||[]).filter(S=>String(S?.stepId||"goal-details")===a),D=Ya(v,K),Z=($||[]).some(S=>S?.stepId==="goal-details"),U=Dt.map((S,L)=>({...S,disabled:S.id!=="type"&&!v.selectedGoalTemplateId||S.id==="goal-details"&&!Z||S.id==="recommendation"&&(!v.selectedGoalTemplateId||L>W+1)})),G=Mt({title:"Moon Goal Builder",subtitle:"Choose the moon outcome you want, set scope and search budget, then compile and run a seeded goal search before applying the recommendation.",steps:U,currentStepId:a,archetypes:(T||[]).filter(S=>S?.guidedEnabled!==!1),selectedArchetypeId:v.selectedGoalTemplateId||"",typeSupplement:a==="type"?eo(()=>y,v):null,questions:K,answers:D,recommendation:f,status:a==="recommendation"?to(v):null,previewContent:a==="recommendation"?jt(f):null,visibleSections:{type:a==="type",questions:a==="parent-context"||a==="goal-details",status:a==="recommendation",recommendation:a==="recommendation",diagnostics:a==="recommendation"},typeSectionTitle:"Moon Goal",questionSectionTitle:a==="parent-context"?"Search Setup":"Goal Traits",recommendationSectionTitle:"Best Moon Fit",diagnosticSectionTitle:"Search Diagnostics",actions:[...a!=="type"?[{id:"back",label:"Back"}]:[],...a!=="recommendation"?[{id:"next",label:a==="goal-details"?"Review Goal Search":"Next",disabled:a==="type"&&!v.selectedGoalTemplateId}]:[{id:"compile",label:"Compile Goal",disabled:!v.selectedGoalTemplateId||v.searchStatus==="searching"},{id:"run-search",label:v.searchStatus==="searching"?"Searching...":"Run Search",disabled:!v.selectedGoalTemplateId||v.searchStatus==="searching"},{id:"apply",label:f?.applyPayload?.parentPatch&&f?.applyPayload?.siblingPatch?"Apply with Host + Moon-System Fixes":f?.applyPayload?.parentPatch?"Apply with Host Fixes":f?.applyPayload?.siblingPatch?"Apply with Moon-System Fixes":"Apply",disabled:!f||f.hasBlockingDiagnostics||v.searchStatus!=="complete"},{id:"apply-advanced",label:f?.applyPayload?.parentPatch&&f?.applyPayload?.siblingPatch?"Apply with Host + Moon-System Fixes and open Advanced":f?.applyPayload?.parentPatch?"Apply with Host Fixes and open Advanced":f?.applyPayload?.siblingPatch?"Apply with Moon-System Fixes and open Advanced":"Apply and open Advanced",disabled:!f||f.hasBlockingDiagnostics||v.searchStatus!=="complete"}],{id:"reset",label:"Reset",className:"is-secondary"}],onArchetypeSelect:S=>y?.reset({objectType:"moon",uxMode:"guided",currentStepId:"type",selectedArchetypeId:S,selectedGoalTemplateId:S}),onQuestionChange:(S,L)=>Ja(y,v,S,L),onStepSelect:(S,L)=>{L?.disabled||y?.setStep(S)},onAction:S=>{if(S==="reset"){y?.reset({objectType:"moon",uxMode:"guided",currentStepId:"type"});return}if(S==="back"){y?.setStep(p(v));return}if(S==="next"){y?.setStep(w(v,$));return}if(S==="compile"){y?.compileGoal();return}if(S==="run-search"){y?.startSearch();return}if((S==="apply"||S==="apply-advanced")&&f){let L=y?.apply({applyMoonRecommendation:A=>oo(A,{noticeLabel:f.title||"Guided moon"})});g();let _=[];L?.parentPatched&&L?.parentPatchSummary&&_.push(`host fixes: ${L.parentPatchSummary}`),L?.siblingPatched&&L?.siblingPatchSummary&&_.push(`moon-system fixes: ${L.siblingPatchSummary}`);let Q=_.length?`${f.title||"Guided moon"} applied with ${_.join("; ")}. `:"";S==="apply-advanced"?ge(`${Q}Continue refining with the Moon page controls.`):Q&&ge(Q.trim())}}});l.replaceChildren(G),bt("moon",{...c,uxMode:"guided",...yt(v,{currentStepId:v.currentStepId||"type"})})}}),j.add(I),M.addEventListener("click",g),d.addEventListener("click",v=>{v.target===d&&g()}),document.addEventListener("keydown",H),document.body.appendChild(d)}function io(t){let e=La(ue);document.body.appendChild(e);let i=e.querySelector(".rp-picker-progress > span"),r=e.querySelector(".rp-picker-progress"),c=[];for(let M of e.querySelectorAll(".rp-picker-card")){let y=ue.find(x=>x.id===M.dataset.recipe);y&&c.push({canvas:M.querySelector("canvas"),model:{bodyType:"moon",name:y.label||"Moon",recipeId:y.id,moonCalc:y.previewCalc||y.preview}})}ua(c,(M,y)=>{let x=y?M/y*100:100;i&&(i.style.width=`${x}%`),x>=100&&r&&r.classList.add("is-done")},{maxRendersPerFrame:1,frameBudgetMs:7});function d(){j.delete(d),e.remove(),document.removeEventListener("keydown",l)}for(let M of e.querySelectorAll(".rp-picker-card"))M.addEventListener("click",()=>{let y=ue.find(x=>x.id===M.dataset.recipe);y&&t(y),d()});e.addEventListener("click",M=>{M.target===e&&d()}),e.querySelector(".rp-picker-close").addEventListener("click",d);function l(M){M.key==="Escape"&&d()}j.add(d),document.addEventListener("keydown",l)}te(),ee();let Kt=Aa("moon");if(b?.dedicated&&b.objectType==="moon"){let t=vt("moon",fe());b.uxMode==="quick"?Se(t?.uxMode==="quick"?t:null,b.baseHash||""):Ce(t?.uxMode==="guided"?t:null,b.baseHash||"")}else if(Kt?.uxMode==="quick")Se();else if(Kt)Ce();else{let t=vt("moon",fe());t?.uxMode==="quick"?Se(t):t&&Ce(t)}return()=>{j.forEach(t=>{try{t()}catch{}}),se&&clearTimeout(se),J.disconnect(),k.dispose()}}function O(s,u,b,h,C,P,o,k){let n=b?` <span class="unit">${b}</span>`:"";return`
  <div class="form-row">
    <div>
      <div class="label">${u}${n} ${N(R[k]||R[u]||"")}</div>
      <div class="hint">${h}</div>
    </div>
    <div class="input-pair">
      <input id="${s}" type="number" step="${o}" aria-label="${u}" />
      <input id="${s}_slider" type="range" aria-label="${u} slider" />
      <div class="range-meta"><span id="${s}_min"></span><span id="${s}_max"></span></div>
    </div>
  </div>`}function mo(s,u,b=[]){return`
    <div id="${s}" class="physics-trio-toggle">
      ${b.map((h,C)=>`
            <input type="radio" name="${u}" id="${s}_${C}" value="${h.value}" ${h.checked?"checked":""} />
            <label for="${s}_${C}">${h.label}</label>`).join("")}
      <span></span>
    </div>`}function po(s,u,b=[]){return`
    <div id="${s}" class="physics-duo-toggle">
      ${b.map((h,C)=>`
            <input type="radio" name="${u}" id="${s}_${C}" value="${h.value}" ${h.checked?"checked":""} />
            <label for="${s}_${C}">${h.label}</label>`).join("")}
      <span></span>
    </div>`}function Pt(s,u,b,h,C,P){return`
  <div class="form-row">
    <div>
      <div class="label">${b} ${N(R[h]||"")}</div>
      <div class="hint" id="${P}"></div>
    </div>
    <div class="pill-toggle-wrap">
      ${mo(s,u,C)}
    </div>
  </div>`}function B(s,u,b="",h="",C=""){let P=b?` <span class="unit">${b}</span>`:"";return`
  <div class="form-row">
    <div>
      <div class="label">${u}${P} ${N(R[C]||R[u]||"")}</div>
      <div class="hint">${h}</div>
    </div>
    <input id="${s}" type="number" step="0.01" />
  </div>`}export{Xo as initMoonPage};
