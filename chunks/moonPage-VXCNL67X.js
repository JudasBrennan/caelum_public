import{c as Ca,d as gt}from"./chunk-GJ3A5Z6X.js";import{a as Pa,b as wa,c as ft}from"./chunk-QMDVIU2G.js";import{a as ka,b as Ia,c as Ea}from"./chunk-C5CB7OSM.js";import{b as ca,c as da,d as ua,e as mt,f as pt,g as ht,h as yt,i as ba,j as va,k as fa,l as ga}from"./chunk-UOX25KFH.js";import"./chunk-X5HJXCPV.js";import{b as xa}from"./chunk-SIP25B6Y.js";import{e as bt,f as ce,j as vt}from"./chunk-YAK24QGD.js";import"./chunk-DFN46JRM.js";import{a as ya}from"./chunk-PCXLDNQS.js";import{a as na}from"./chunk-WYZYYRUA.js";import{a as ra,b as la}from"./chunk-C4TNHY3S.js";import{b as Sa}from"./chunk-6HRI5YJ3.js";import{a as sa,b as re}from"./chunk-TC4Y6ZTP.js";import{i as ut}from"./chunk-5LTXGN7J.js";import{a as ha}from"./chunk-RMZ46KGS.js";import{a as pa}from"./chunk-Z2MOTVH7.js";import{a as Ma}from"./chunk-KYI55SIV.js";import{a as G,b as le,d as ma}from"./chunk-L76EVWF4.js";import{b as k,c as dt}from"./chunk-XMLMEZIZ.js";import"./chunk-LAMR64J5.js";import"./chunk-7PVDVLB6.js";import"./chunk-5SEMLOPL.js";import{$a as oa,D as Ut,Ga as ge,Ha as Me,Ia as Zt,Ka as Qt,Q as Wt,Qa as Xt,Sa as Se,Ta as Y,Ua as Yt,Va as Jt,Wa as ea,Xa as ta,Ya as Pe,_a as aa,hb as ct,ob as se,vb as ia,za as B}from"./chunk-5NLRN7M6.js";import{ja as zt}from"./chunk-HTNOXS34.js";import"./chunk-47ATKL5F.js";import{h as jt,m as Kt,n as _t,x as Vt}from"./chunk-XFZMQA63.js";import{j as g}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function Mt(r,u){return k("option",{attrs:{value:r==null?"":String(r)},text:u==null?"":String(u)})}function Aa(r,u=[]){return u.length?k("optgroup",{attrs:{label:r}},u.map(y=>Mt(y?.value,y?.label))):null}function Ra(r,{planets:u=[],gasGiants:y=[],selectedValue:p="",disabled:S=!1,title:I=""}={}){dt(r,[Mt("","Unassigned"),Aa("Planets",(u||[]).map(C=>({value:C?.moonParentId||C?.id||"",label:`${C?.name||C?.inputs?.name||C?.id||"Planet"}${C?.classification?.displayLabel?` - ${C.classification.displayLabel}`:""}`}))),Aa("Gas Giants",(y||[]).map(C=>({value:C?.moonParentId||C?.id||"",label:`${C?.name||C?.id||"Gas Giant"}${C?.classification?.displayLabel?` - ${C.classification.displayLabel}`:""}`})))]);let a=p==null?"":String(p);return r.value=[...r.options].some(C=>C.value===a)?a:"",r.disabled=!!S,r.title=I||"",r}function Ta(r,u=[],y=""){let p=Array.isArray(u)?u:[];if(dt(r,p.map(a=>Mt(a?.id||"",a?.name||a?.inputs?.name||a?.id||"Moon"))),!p.length)return r.value="",r;let S=String(y||""),I=String(p[0]?.id||"");return r.value=[...r.options].some(a=>a.value===S)?S:I,r}function $a(r,u=[]){return da(r,u)}function Na(r,u={}){return Ea(r,u,{id:"moonResultSummary",className:"moon-result-summary",subject:"Moon",ariaLabel:"Moon result summary"})}function Ga(r,u=[],y={}){return ca(r,u,y),r}function ao(r){let u=r?.preview||{},y=u?.tides||{},p=u?.inputs||{},S=u?.physical||{},I=String(y?.compositionClass||""),a=String(r?.id||""),C=Number(y?.tidalHeatingEarth)||0,n=Number(p?.albedo)||0,K=Number(S?.radiusMoon)||0;return a==="irregular-capture"?"Dark captured rubble body":a==="phobos"||a==="deimos"?"Tiny captured moonlet":C>=12?"Volcanic resurfacing world":C>=1&&I==="Subsurface ocean"?"Fractured ice over an interior ocean":I==="Subsurface ocean"?"Ice shell with likely ocean below":I==="Icy"||I==="Very icy"?"Bright frozen surface":I==="Mixed rock/ice"&&K>=1.2&&n<=.25?"Cold haze-prone ice-rock moon":I==="Mixed rock/ice"?"Blended rock and ice surface":I==="Partially molten"?"Heated molten companion":K<.05?"Small irregular capture":"Rocky major moon"}function Ha(r=[]){let u=[...new Set((r||[]).map(y=>y?.category).filter(Boolean))];return k("div",{className:"rp-picker-overlay rp-picker-overlay--moon"},[k("div",{className:"rp-picker-dialog rp-picker-dialog--moon panel"},[k("div",{className:"panel__header"},[k("div",{className:"rp-picker-heading"},[k("h2",{text:"Moon Recipes"}),k("div",{className:"rp-picker-subtitle",text:"Pick a visual and physical starting point for the current moon."})]),k("button",{className:"small rp-picker-close",attrs:{type:"button"},text:"Close"})]),k("div",{className:"rp-picker-progress"},[k("span")]),k("div",{className:"panel__body"},u.flatMap(y=>[k("div",{className:"rp-picker-category",text:y}),k("div",{className:"rp-picker-grid"},(r||[]).filter(p=>p?.category===y).map(p=>k("div",{className:"rp-picker-card",dataset:{recipe:p?.id||""}},[k("canvas",{attrs:{width:"90",height:"90"}}),k("div",{className:"rp-picker-card__label",text:p?.label||p?.id||"Moon recipe"}),k("div",{className:"rp-picker-card__hint",text:p?.hint||ao(p)})])))]))])])}function St(){return pa({overlayClassName:"rp-picker-overlay--moon moon-guided-overlay",dialogClassName:"rp-picker-dialog--moon moon-guided-dialog",closeButtonClassName:"moon-guided-overlay__close",contentClassName:"moon-guided-overlay__content",closeLabel:"Close moon guided creation"})}var A={"Star Mass":`Host star mass in solar masses.

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

For an Earth-like setup, this should usually remain "No".`,"Derived Data":"Read-only parent and host-frame context used for moon calculations. In binary systems this includes which star-centered frame the parent world belongs to, plus any extra companion heating or stability pressure inherited from that frame.","Moon selection":"Saved moon currently being edited.","Editing moon":"Moon selector with create and delete controls.","Belongs to planet":"Parent planet this moon orbits. May be left unassigned.",Identity:"Identity fields for the currently selected moon.",Name:"Display name for the moon, used across tabs and exports.",Orbit:"Orbital inputs that determine moon distance, periods, and lock behaviour.",Physical:"Physical inputs used to derive radius, gravity, and escape velocity.",Composition:`Inferred from bulk density as a proxy for rock/ice fraction. Controls the material rigidity (\u03BC) and tidal quality factor (Q) used in tidal lock and heating calculations.

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

For airless bodies, this stays close to the radiative equilibrium. Tidal heating dominates for close-orbit moons like Io; greenhouse warming matters most for volatile-rich moons such as Titan-like cases.`,"Climate State":`High-level moon climate regime derived from the moon-specific climate model.

Stable, Snowball, Moist greenhouse, and Runaway greenhouse states reflect the modeled surface-water and temperature outcomes after planetshine, eclipses, and internal heating are considered.`,"Surface Temp Range":`Estimated climate envelope for the moon's modeled surface temperature.

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

This Stage M1 model supports volatile greenhouse warming and a simple methane anti-greenhouse penalty, but not full haze photochemistry yet.`,"Atmosphere Stability":"Source-loss balance for the current moon atmosphere. Stable means the current atmosphere is plausibly long-lived; transient means it likely needs active replenishment.","Atmosphere Lifetime":"Estimated order-of-magnitude lifetime of the modeled atmosphere under the current source and loss assumptions.","Atmosphere Haze":"First-pass haze class inferred from the dominant atmospheric chemistry and pressure.","Atmosphere Clouds":"First-pass cloud or aerosol class inferred from pressure, condensables, and surface liquid support.","Volcanic Activity":`Derived silicate-volcanism signal from tidal heating, radiogenic heating, interior class, and bulk size/gravity.

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

The threshold is gravity-aware, so lower-gravity moons need deeper oceans to reach the same pressure.`,"Interior Structure":"Compact readout of the current solved moon interior: ocean depth plus the inferred ice-shell convection regime.","Ocean Chemistry":"Surface or subsurface ocean chemistry inputs used in Full and Manual hydrosphere modes.","Radiogenic Heating":`Internal heat from radioactive decay (U, Th, K) on the moon\u2019s surface.

Scales from Earth\u2019s 44 TW by moon mass and the system\u2019s radioisotope abundance setting. Typically small compared to tidal heating.`,"Magnetospheric Radiation":`Charged-particle radiation dose from the host planet\u2019s magnetosphere.

Scales as B\xB3 at the moon\u2019s orbit (dipole field), calibrated to Jupiter\u2013Europa (~540 rem/day). Zero if the moon orbits outside the magnetopause. Upper estimate \u2014 actual doses may be lower due to ring absorption and loss processes.`,"Magnetosphere Dose":`Charged-particle radiation dose from the host planet\u2019s magnetosphere.

Scales as B\xB3 at the moon\u2019s orbit (dipole field), calibrated to Jupiter\u2013Europa (~540 rem/day). Zero if the moon orbits outside the magnetopause. Upper estimate \u2014 actual doses may be lower due to ring absorption and loss processes.`,"Earth Similarity Index":`Compares this moon to Earth using radius, density, escape velocity, and surface temperature.

Range: 0 to 1, where 1 is most Earth-like. Earth-likeness is not the same as direct habitability.`,Appearance:`Physics-driven visual of the moon from space. Surface texture, ice, clouding, haze, and ocean cues are derived from the current solved moon state.

This preview is now read-only. Use Create This Moon in the Inputs column for Quick, Guided, or Recipes.`,"Habitability Index":`WorldSmith comparative habitability model for moons.

This is PHI-inspired, not a direct literature PHI implementation. The score depends on the selected solvent pathway and the active solvent-policy support for surface water, subsurface water, and alternative solvents.

Use the expanded KPI details to see the current pathway, policy version, and term breakdown.`,"Surface Radiation":"Gate-based surface-radiation class after parent-belt exposure, stellar XUV, atmosphere shielding, and moon magnetic shielding are combined.","Magnetic Shielding":`Combined intrinsic and induced moon magnetic shielding class.

Intrinsic shielding comes from a plausible moon dynamo. Induced shielding comes from a conductive salty subsurface ocean interacting with the parent field.`,"Surface Exomoon Calibration":`Paper-informed exposed-surface moon calibration for cool-star systems.

This surface-only gate weighs cool-star band, giant-host mass, moon mass floor, composition, and spin state. It does not block subsurface-ocean outcomes.`,"Spin State":`Solved moon spin-orbit state from the tidal model.

A 1:1 synchronous lock strengthens permanent parent-facing contrast, while a 3:2 resonance modestly softens that contrast for exposed-surface climate cases.`,"Life Class":`High-level gate-based moon outcome.

This sits alongside the numeric Habitability Index and tells you whether the current moon is best described as a surface-life candidate, a cool-star mass-limited surface moon, a radiation-limited ocean moon, a subsurface-ocean moon, or another environmental class.`,"Surface Habitability":`Gate-based surface-habitability readout.

This separates true surface-life plausibility from warm-but-radiation-limited or marginal-atmosphere cases.`,"Subsurface Habitability":`Gate-based subsurface-habitability readout.

Moons outside the stellar habitable zone can still score well here if they plausibly sustain buried liquid water under ice.`,"Habitability Gates":"Quick count of how many surface and subsurface habitability gates currently pass."},oo=[{title:"Getting Started",body:"The Moons page creates and configures natural satellites. Select a moon from the dropdown, or create a new one. Assign it to a parent planet or giant companion using the parent selector."},{title:"Orbit Setup",body:"Set semi-major axis, eccentricity, and inclination. The semi-major axis is automatically clamped to the parent\u2019s moon zone \u2014 between the Roche limit and Hill sphere."},{title:"Physical Properties",body:"Adjust mass, density, albedo, and composition. Use the composition override dropdown for special scenarios like subsurface oceans or partially molten interiors."},{title:"Tidal System",body:"Outputs show tidal forces, heating, and locking timescales. Check whether the moon is tidally locked to its planet, and whether the planet is locked to its star or moon."},{title:"Creation Modes",body:"Use Create This Moon at the top of Inputs. Quick applies a moon archetype, Guided walks you to a recommendation, Recipes opens the preset library for exact moon templates like Luna, Europa, Io, or Titan, and Advanced is the direct editor below."}];function we(r,u=null){return String(r??"").trim()||u||null}function Fa(r){return Zt(r)}function io(r,u){let y=Me(r),p=ge(y||{}),S={massMsol:Number(y?.massMsol)||1,ageGyr:Number(y?.ageGyr)||4.6,metallicityFeH:Number(y?.metallicityFeH)||0,radiusRsolOverride:p.r,luminosityLsolOverride:p.l,tempKOverride:p.t,evolutionMode:p.ev},I=Vt({massMsol:S.massMsol,ageGyr:S.ageGyr,metallicityFeH:S.metallicityFeH,radiusRsolOverride:S.radiusRsolOverride,luminosityLsolOverride:S.luminosityLsolOverride,tempKOverride:S.tempKOverride,evolutionMode:S.evolutionMode}),a=u?.defaultHostFrameId||u?.primaryStarId||"star_a";return{hostFrameId:a,hostFrame:{id:a,label:y?.name||"Star",frameKind:"star",orbitFamilyKind:"single",zones:{habitableZoneAu:I.habitableZoneAu},fluxModel:{meanCompanionFluxEarth:0,fluxVariabilityFraction:0,meanCompanionXuvFluxEarth:0},stability:{criticalOuterAu:null,diskTruncationAu:null,warnings:[]}},starId:u?.primaryStarId||a,starConfig:S,starModel:I,companionFluxEarth:0,companionXuvFluxEarth:0,fluxVariabilityFraction:0,dominantContributorId:u?.primaryStarId||a}}function no(r,u,y=null){let p=y||Fa(r),S=we(u?.hostFrameId,p?.defaultHostFrameId||p?.primaryStarId);return Ut(p,S)||io(r,p)}function so({compactLifeLimits:r,compactOrbitalFate:u,lifeClass:y}){return u!=="Stable"||r&&r!=="Clear"?"warning":/surface|complex|simple|microbial|candidate|habitable/i.test(String(y||""))?"good":"neutral"}function ro({moonName:r,model:u,moonProfile:y,compactLifeLimits:p,compactOrbitalFate:S}={}){let I=String(r||u?.inputs?.name||"Moon").trim()||"Moon",a=y?.displayClass||u?.display?.compositionClass||"moon environment",C=u?.display?.hydrosphereState||"water state unresolved",n=u?.display?.atmosphereClass||"atmosphere unresolved",K=u?.display?.surfaceTemp||"temperature unresolved",W=u?.display?.lifeClass||"life class unresolved",J=S==="Stable"?"The current orbit is not showing a strong inward decay or outward escape warning.":`Orbital fate needs attention: ${u?.display?.orbitalFate||S}.`,xe=p==="Clear"?"No compact life blockers are flagged.":`${p||"Some blockers"} ${p==="1 blocker"?"is":"are"} active; inspect Habitability for the gate details.`;return{tone:so({compactLifeLimits:p,compactOrbitalFate:S,lifeClass:W}),body:`${I} reads as ${a.toLowerCase()} with ${C.toLowerCase()} and ${n.toLowerCase()}. Surface temperature is ${K}. ${W} is the current habitability class. ${J} ${xe}`,items:[{label:"Focus",value:I},{label:"Surface",value:a},{label:"Life signal",value:W}]}}function Wo(r,u={}){let y=u?.routeContext?.guided||null,p=B(),S=Me(p),I=ge(S),a={starMassMsol:Number(S.massMsol),starAgeGyr:Number(S.ageGyr),starMetallicityFeH:Number(S.metallicityFeH)||0,starRadiusRsolOverride:I.r,starLuminosityLsolOverride:I.l,starTempKOverride:I.t,starEvolutionMode:I.ev,planet:{...p.planet},moon:{...p.moon}},C=ra({speedDaysPerSec:.5}),n=document.createElement("div");n.className="page",n.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--moons" aria-hidden="true"></span><span>Moons</span></h1>
        <button id="moonTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        ${ya({summary:"Author moons for selected planets and gas giants, then validate their orbit and environment outputs.",controls:"The selected moon, its parent assignment, and the orbit, interior, atmosphere, and coupling inputs.",affects:"Planet tides, calendar moon phases, and moon-specific habitability and visual outputs.",primaryAction:"Choose a parent world or leave the moon unassigned, then set orbit distance before fine-tuning the deeper modes.",compact:!0,detailsTitle:"Moon workflow context",detailsSummary:"Parent, orbit, and environment choices feed tides, calendars, and visuals."})}
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">

          <div class="label">Parent Context ${G(A["Derived Data"]||"")}</div>
          <div class="derived-readout derived-readout--context" id="context"></div>

          <div style="height:12px"></div>

          <div class="label">Moon selection ${G(A["Moon selection"]||"")}</div>
          <div class="form-row">
            <div>
              <div class="label">Editing moon ${G(A["Editing moon"]||"")}</div>
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
              <div class="label">Belongs to planet ${G(A["Belongs to planet"]||"")}</div>
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
              <button id="moonCreateQuickBtn" type="button" class="guided-entry-strip__mode" ${le(ce("quick"))}>
                Quick
              </button>
              <button id="moonCreateGuidedBtn" type="button" class="guided-entry-strip__mode" ${le(ce("guided"))}>
                Guided
              </button>
              <button id="moonCreateRecipesBtn" type="button" class="guided-entry-strip__mode" ${le(ce("recipes"))}>
                Recipes
              </button>
              <span class="guided-entry-strip__mode guided-entry-strip__mode--current" aria-current="page" ${le(ce("advanced"))}>
                Advanced
              </span>
            </div>
          </div>

          <div style="height:10px"></div>

          <div class="label">Moon Science Modes ${G(A["Moon Science Modes"]||"")}</div>
          ${Pt("hydModePills","hydMode","Hydrosphere Mode","Hydrosphere Mode",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"hydModeHint")}
          ${Pt("atmModePills","atmMode","Atmosphere Mode","Atmosphere Mode",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"atmModeHint")}
          ${Pt("orbModePills","orbMode","Orbital Coupling","Orbital Coupling",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"orbModeHint")}

          <div style="height:10px"></div>

<div class="label">Identity ${G(A.Identity||"")}</div>
          <div class="form-row">
            <div>
              <div class="label">Name ${G(A.Name||"")}</div>
              <div class="hint">Used in exports and print view.</div>
            </div>
            <input id="name" type="text" />
          </div>

          <div style="height:8px"></div>
          <div class="label">Orbit ${G(A.Orbit||"")}</div>

          ${L("a","Semi-Major Axis","km","",10,1e9,100,"Semi-Major Axis")}
          ${L("e","Eccentricity","","",0,.99,.001,"Eccentricity")}
          ${L("inc","Inclination","\xB0","",0,180,.1,"Inclination")}

          <div style="height:8px"></div>
          <div class="label">Physical ${G(A.Physical||"")}</div>

          ${L("m","Mass","MMoon","",1e-8,1e3,1e-8,"Mass")}
          ${L("density","Density","g/cm\xB3","",.1,20,.01,"Density")}
          ${L("albedo","Albedo","","",0,.95,.001,"Albedo")}

          <div class="form-row">
            <div>
              <div class="label">Composition Override ${G(A["Composition Override"]||"")}</div>
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
          <div class="label">Dynamics ${G(A.Dynamics||"")}</div>
          ${L("initRot","Initial Rotation Period","hours","",2,1e3,.1,"Initial Rotation Period")}

          <div style="height:8px"></div>
          <div class="label">Bulk & Interior ${G(A["Bulk & Interior"]||"")}</div>
          <div id="moonHydrosphereSection">
            ${L("wmf","Water Mass Fraction","%","",0,60,.1,"Water Mass Fraction")}
            ${L("salinity","Salinity","%","",0,35,.1,"Salinity")}
            ${L("ammonia","Ammonia","%","",0,30,.1,"Ammonia")}
            <div class="form-row">
              <div>
                <div class="label">Differentiated Interior ${G(A["Differentiated Interior"]||"")}</div>
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
                <div class="label">Moon Radioisotopes ${G(A["Moon Radioisotopes"]||"")}</div>
                <div class="hint" id="isoModeHint"></div>
              </div>
              <div class="pill-toggle-wrap">
                ${co("isoModePills","isoMode",[{value:"simple",label:"Simple",checked:!0},{value:"advanced",label:"Advanced",checked:!1}])}
              </div>
            </div>
            <div id="moonIsoSimpleRows">
              ${L("radioAbundance","Radioisotope Abundance","x Earth","",.1,3,.01,"Internal Heat")}
            </div>
            <div id="moonIsoAdvancedRows">
              ${L("u238","U-238","x Earth","",0,5,.01,"U-238")}
              ${L("u235","U-235","x Earth","",0,5,.01,"U-235")}
              ${L("th232","Th-232","x Earth","",0,5,.01,"Th-232")}
              ${L("k40","K-40","x Earth","",0,5,.01,"K-40")}
            </div>
          </div>

          <div style="height:8px"></div>
          <div class="label">Atmosphere ${G(A["Atmosphere Controls"]||"")}</div>
          <div id="moonAtmosphereSection">
            ${L("manualPressure","Manual Surface Pressure","atm","",0,10,.01,"Manual Surface Pressure")}
            ${j("n2Pct","Nitrogen (N2)","%","Derived to fill the remainder when left at 0 in manual mode.")}
            ${j("o2Pct","Oxygen (O2)","%","")}
            ${j("co2Pct","Carbon Dioxide (CO2)","%","")}
            ${j("arPct","Argon (Ar)","%","")}
            ${j("h2oPct","Water Vapor (H2O)","%","")}
            ${j("ch4Pct","Methane (CH4)","%","")}
            ${j("coPct","Carbon Monoxide (CO)","%","")}
            ${j("h2Pct","Hydrogen (H2)","%","")}
            ${j("hePct","Helium (He)","%","")}
            ${j("so2Pct","Sulfur Dioxide (SO2)","%","")}
            ${j("nh3Pct","Ammonia (NH3)","%","")}
          </div>

          <div style="height:8px"></div>
          <div class="label">Resonance & Rotation ${G(A["Resonance & Rotation"]||"")}</div>
          <div id="moonOrbitalSection">
            ${L("forcedEcc","Forced Eccentricity","","",0,.2,1e-4,"Forced Eccentricity")}
            <div class="form-row">
              <div>
                <div class="label">Resonance Group ${G(A["Resonance Group"]||"")}</div>
                <div class="hint">Manual mode only. Leave blank for auto.</div>
              </div>
              <input id="resonanceGroup" type="text" />
            </div>
            ${j("resonanceOrder","Resonance Order","","Manual mode only. Smaller numbers are closer in.")}
            ${j("resonanceRatio","Resonance Ratio","","Use 2 for a 2:1-style manual chain, 1.5 for 3:2, etc.")}
          </div>

          <div style="height:8px"></div>
          <div class="label">Surface & Habitability ${G(A["Surface & Habitability"]||"")}</div>
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
  `,r.appendChild(n),ma(n),Ma({steps:oo,storageKey:"worldsmith.moon.tutorial",container:n,triggerBtn:n.querySelector("#moonTutorials")});let K=new Set,W=new MutationObserver(()=>{n.isConnected||(C.dispose(),W.disconnect())});W.observe(document.body,{childList:!0,subtree:!0});let J=n.querySelector("#moonSelect"),xe=n.querySelector("#moonNew"),Oa=n.querySelector("#moonDelete"),Ce=n.querySelector("#moonPlanetSelect"),La=n.querySelector("#context"),de=n.querySelector("#name"),ke=n.querySelector("#a"),Ie=n.querySelector("#e"),Ee=n.querySelector("#inc"),Ae=n.querySelector("#m"),Re=n.querySelector("#density"),Te=n.querySelector("#albedo"),$e=n.querySelector("#compOverride"),Ne=n.querySelector("#initRot"),Ge=n.querySelector("#hydModePills"),He=n.querySelector("#atmModePills"),Fe=n.querySelector("#orbModePills"),wt=n.querySelector("#hydModeHint"),xt=n.querySelector("#atmModeHint"),Ct=n.querySelector("#orbModeHint"),Oe=n.querySelector("#wmf"),Le=n.querySelector("#salinity"),qe=n.querySelector("#ammonia"),ue=n.querySelector("#differentiatedInterior"),De=n.querySelector("#isoModePills"),kt=n.querySelector("#isoModeHint"),Be=n.querySelector("#radioAbundance"),je=n.querySelector("#u238"),Ke=n.querySelector("#u235"),_e=n.querySelector("#th232"),Ve=n.querySelector("#k40"),Ue=n.querySelector("#manualPressure"),ze=n.querySelector("#n2Pct"),We=n.querySelector("#o2Pct"),Ze=n.querySelector("#co2Pct"),Qe=n.querySelector("#arPct"),Xe=n.querySelector("#h2oPct"),Ye=n.querySelector("#ch4Pct"),Je=n.querySelector("#coPct"),et=n.querySelector("#h2Pct"),tt=n.querySelector("#hePct"),at=n.querySelector("#so2Pct"),ot=n.querySelector("#nh3Pct"),it=n.querySelector("#forcedEcc"),ee=n.querySelector("#resonanceGroup"),te=n.querySelector("#resonanceOrder"),ae=n.querySelector("#resonanceRatio"),qa=n.querySelector("#moonCreateQuickBtn"),Da=n.querySelector("#moonCreateGuidedBtn"),Ba=n.querySelector("#moonCreateRecipesBtn"),It=n.querySelector("#moonHydrosphereSection"),Et=n.querySelector("#moonAtmosphereSection"),At=n.querySelector("#moonOrbitalSection"),Rt=n.querySelector("#moonIsoSimpleRows"),Tt=n.querySelector("#moonIsoAdvancedRows"),U=n.querySelector("#kpis"),$t=n.querySelector("#details"),oe=null,Nt={};O("a",ke,10,1e9,100,"auto"),O("e",Ie,0,.99,.001,"auto"),O("inc",Ee,0,180,.1,"auto"),O("m",Ae,1e-8,1e3,1e-8,"auto"),O("density",Re,.1,20,.01,"auto"),O("albedo",Te,0,.95,.001,"auto"),O("initRot",Ne,2,1e3,.1,"auto"),O("wmf",Oe,0,60,.1,"auto"),O("salinity",Le,0,35,.1,"auto"),O("ammonia",qe,0,30,.1,"auto"),O("radioAbundance",Be,.1,3,.01,"auto"),O("u238",je,0,5,.01,"auto"),O("u235",Ke,0,5,.01,"auto"),O("th232",_e,0,5,.01,"auto"),O("k40",Ve,0,5,.01,"auto"),O("manualPressure",Ue,0,10,.01,"auto"),O("forcedEcc",it,0,.2,1e-4,"auto");function O(t,e,i,s,c,d){let l=n.querySelector(`#${t}_slider`),M=n.querySelector(`#${t}_min`),h=n.querySelector(`#${t}_max`);M.textContent=String(i),h.textContent=String(s),Nt[t]=na({numberEl:e,sliderEl:l,min:i,max:s,step:c,mode:d,commitOnInput:!1,onChange:()=>_()})}function ja(){for(let t of["a","e","inc","m","density","albedo","initRot","wmf","salinity","ammonia","radioAbundance","u238","u235","th232","k40","manualPressure","forcedEcc"])Nt[t]?.syncFromNumber({commit:!1,normalize:!0})}function Gt(){let t=B(),e=Me(t);a.starMassMsol=Number(e?.massMsol),a.starAgeGyr=Number(e?.ageGyr),a.starMetallicityFeH=Number(e?.metallicityFeH)||0;let i=ge(e);a.starRadiusRsolOverride=i.r,a.starLuminosityLsolOverride=i.l,a.starTempKOverride=i.t,a.starEvolutionMode=i.ev;let s=Y(t);a.moonId=s?.id||t.moons?.selectedId,a.moon={...s?.inputs||t.moon},a.moonName=s?.name||a.moon.name||"Luna",a.moonPlanetId=s?s.planetId??null:null,a.moonLocked=!!s?.locked;let c=Ht(t,a.moonPlanetId);a.parentType=c.type,c.type==="gasGiant"?(a.gasGiant=c.gasGiant,a.planet=null):(a.planet=c.inputs,a.gasGiant=null)}function Ht(t,e){let i=e==null?null:String(e);if(i){let s=Qt(t).find(d=>String(d.id)===i);if(s?.inputs)return{type:"planet",inputs:{...s.inputs}};let c=se(t).find(d=>String(d.id)===i);if(c)return{type:"gasGiant",gasGiant:c}}return{type:"planet",inputs:{...t.planet}}}function Ka(t){let e=String(t?.companionClass||"").trim();return e?Kt(e):jt({massMjup:t?.massMjup})==="brownDwarf"?"brownDwarf":"gasGiant"}function nt(t){return _t(Ka(t))}function me(t,e,i="core"){return t?.querySelector(`input[name="${e}"]:checked`)?.value||i}function pe(t,e,i,s="core"){let c=i||s;t?.querySelectorAll(`input[name="${e}"]`).forEach(d=>{d.checked=d.value===c})}function Ft(){let t=a.moon.hydrosphereMode||"core",e=a.moon.atmosphereMode||"core",i=a.moon.orbitalCouplingMode||"core",s=a.moon.radioisotopeMode||"simple";pe(Ge,"hydMode",t),pe(He,"atmMode",e),pe(Fe,"orbMode",i),pe(De,"isoMode",s,"simple"),wt&&(wt.textContent=t==="core"?"Compatibility heuristics.":t==="full"?"Inventory-driven moon water and ice solving.":"Direct water/interior inputs with computed outputs."),xt&&(xt.textContent=e==="core"?"Retained-volatile atmosphere only.":e==="full"?"Computed atmosphere plus stability diagnostics.":"Manual pressure and gas mix with stability checks."),Ct&&(Ct.textContent=i==="core"?"Single-moon treatment.":i==="full"?"Sibling resonance and tidal-HZ analysis.":"Manual resonance-chain controls enabled."),kt&&(kt.textContent=s==="advanced"?"Advanced isotope-by-isotope moon heat inputs.":"Single moon radiogenic-heat multiplier."),It&&(It.style.display=t==="core"?"none":""),Et&&(Et.style.display=e==="manual"?"":"none"),At&&(At.style.display=i==="core"?"none":""),Rt&&(Rt.style.display=t==="core"||s==="advanced"?"none":""),Tt&&(Tt.style.display=t==="core"||s!=="advanced"?"none":""),ee&&(ee.disabled=i!=="manual"),te&&(te.disabled=i!=="manual"),ae&&(ae.disabled=i!=="manual")}function _a(){return{name:de.value||"New Moon",semiMajorAxisKm:Number(ke.value),eccentricity:Number(Ie.value),inclinationDeg:Number(Ee.value),massMoon:Number(Ae.value),densityGcm3:Number(Re.value),albedo:Number(Te.value),compositionOverride:$e.value||null,initialRotationPeriodHours:Number(Ne.value)||null,hydrosphereMode:me(Ge,"hydMode"),atmosphereMode:me(He,"atmMode"),orbitalCouplingMode:me(Fe,"orbMode"),waterMassFractionPct:Number(Oe.value)||null,salinityPct:Number(Le.value)||null,ammoniaPct:Number(qe.value)||null,differentiatedInterior:ue.value==="yes"?!0:ue.value==="no"?!1:null,radioisotopeMode:me(De,"isoMode","simple"),radioisotopeAbundance:Number(Be.value)||null,u238Abundance:Number(je.value)||null,u235Abundance:Number(Ke.value)||null,th232Abundance:Number(_e.value)||null,k40Abundance:Number(Ve.value)||null,manualSurfacePressureAtm:Number(Ue.value)||null,n2Pct:Number(ze.value)||0,o2Pct:Number(We.value)||0,co2Pct:Number(Ze.value)||0,arPct:Number(Qe.value)||0,h2oPct:Number(Xe.value)||0,ch4Pct:Number(Ye.value)||0,coPct:Number(Je.value)||0,h2Pct:Number(et.value)||0,hePct:Number(tt.value)||0,so2Pct:Number(at.value)||0,nh3Pct:Number(ot.value)||0,forcedEccentricity:Number(it.value)||null,manualResonanceGroupId:ee.value?.trim()||null,manualResonanceOrder:Number(te.value)||null,manualResonanceRatio:Number(ae.value)||null}}function he(t){let e=n.querySelector(".moon-float-note");e||(e=document.createElement("div"),e.className="moon-float-note",n.appendChild(e)),e.textContent=t,e.classList.add("is-visible"),oe&&clearTimeout(oe),oe=setTimeout(()=>{e.classList.remove("is-visible")},3200)}function st(t,{noticeLabel:e="Moon preset"}={}){let i=B(),s=Y(i);if(!s)return null;let c=s.id,d=s.planetId??a.moonPlanetId??null,l=ie(i,{moonId:c,moonInputs:t,planetId:d}).model,M=String(l?.orbit?.semiMajorAxisGuard||"none"),h=Number(l?.inputs?.semiMajorAxisKm),P=Number(t.semiMajorAxisKm),v=Number.isFinite(h)?Math.round(h):P,E=M!=="none"&&Number.isFinite(v),H={...t,semiMajorAxisKm:E?v:P};return Pe(c,{inputs:H}),ct({moon:H}),E&&Math.abs(H.semiMajorAxisKm-P)>1e-9&&he(`${e} adjusted the semi-major axis to ${g(H.semiMajorAxisKm,0)} km to keep this moon inside the Moon Zone.`),Q(),Z(),H}function Va(){let t=B(),e=Wt(t),i=e.filter(c=>c.moonParentKind==="planet"),s=e.filter(c=>c.moonParentKind==="gasGiant");Ra(Ce,{planets:i,gasGiants:s,selectedValue:a.moonPlanetId,disabled:a.moonLocked,title:a.moonLocked?"This moon is locked to its current planet on the Planetary System tab.":""})}function Ua(){let t=B(),e=Se(t);Ta(J,e,t.moons.selectedId)}function za(t,e,i){let s=Array.isArray(e?.operations)?e.operations:[];if(!s.length)return t;let c=(Array.isArray(t)?t:[]).map(d=>({...d,inputs:{...d?.inputs||{}}}));for(let d=0;d<s.length;d+=1){let l=s[d];if(!(!l||typeof l!="object"))if(l.type==="update"&&l.moonId){let M=c.findIndex(h=>h?.id===l.moonId);M>=0&&(c[M]={...c[M],name:l.name??c[M].name,planetId:l.planetId===void 0?c[M].planetId:l.planetId??null,inputs:{...c[M].inputs||{},...l.inputPatch||{}}})}else l.type==="create"&&l.inputs&&c.push({id:l.previewId||`preview-sibling-${d+1}`,name:l.name||l.inputs?.name||"Preview sibling",planetId:l.planetId===void 0?i??null:l.planetId??null,inputs:{...l.inputs||{}}})}return c}function ie(t,{moonId:e,moonInputs:i,planetId:s,parentPatch:c=null,siblingPatch:d=null}){let l=c?.assignMoonToParentId!=null?c.assignMoonToParentId:s,M=Ht(t,l),h=Se(t).filter(T=>(T.planetId??null)===(l??null)).map(T=>({...T,inputs:T.id===e?i:T.inputs})),P=za(h,d,l),v=c?.parentKind==="gasGiant"&&M.type==="gasGiant"&&M.gasGiant?{...M,gasGiant:{...M.gasGiant,...c.inputPatch||{}}}:c?.parentKind==="planet"&&M.type==="planet"?{...M,inputs:{...M.inputs||{},...c.inputPatch||{}}}:M,E=Fa(t),H=v.type==="gasGiant"&&v.gasGiant?v.gasGiant:{id:l??null,hostFrameId:t.planets?.byId?.[l]?.hostFrameId||null},x=no(t,H,E),m=x?.starConfig||{},b=x?.starModel,N=x?.hostFrame?.zones?.habitableZoneAu||b?.habitableZoneAu||null,R=we(x?.hostFrameId,E?.defaultHostFrameId),f=Number(x?.companionFluxEarth||0),o=Number(x?.companionXuvFluxEarth||0),q=Number(x?.fluxVariabilityFraction||0);if(v.type==="gasGiant"&&v.gasGiant){let T=Sa({...v.gasGiant,orbitAu:Number(v.gasGiant.au)||5,starMassMsol:Number(m.massMsol)||1,starLuminosityLsol:Number(b?.luminosityLsol)||1,starAgeGyr:Number(m.ageGyr)||4.6,starRadiusRsol:Number(b?.radiusRsol)||1,hostFrameId:R,hostFrame:x?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:q,stellarMetallicityFeH:Number(m.metallicityFeH)||0,otherGiants:se(t).filter(F=>F.id!==v.gasGiant.id&&we(F?.hostFrameId,E?.defaultHostFrameId)===R),moons:P.map(F=>F.inputs||{})}),w=wa(T),$=ft({starMassMsol:Number(m.massMsol)||1,starAgeGyr:Number(m.ageGyr)||4.6,starMetallicityFeH:Number(m.metallicityFeH)||0,starRadiusRsolOverride:m.radiusRsolOverride??null,starLuminosityLsolOverride:m.luminosityLsolOverride??null,starTempKOverride:m.tempKOverride??null,starEvolutionMode:m.evolutionMode||"zams",starHabitableZoneAu:N,hostFrameId:R,hostFrame:x?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:q,parentKind:"gasGiant",parentOverride:w,moonEntries:P.length?P:[{id:e||"draft-moon",planetId:l,inputs:i}]});return{parentType:"gasGiant",parentOverride:w,parentInfo:{parentId:v.gasGiant.id||l||null,parentKind:"gasGiant",parentName:v.gasGiant.name||v.gasGiant.id||nt(v.gasGiant),parentClassLabel:nt(v.gasGiant),assigned:l!=null,orbitAu:Number(v.gasGiant.au)||Number(w.inputs.semiMajorAxisAu)||null,eccentricity:Number(v.gasGiant.eccentricity)||0,massEarth:Number(w.inputs.massEarth)||null,massMjup:Number(v.gasGiant.massMjup)||null,rotationPeriodHours:Number(v.gasGiant.rotationPeriodHours)||null,siblingCount:Math.max(P.length-(e?1:0),0),starHabitableZoneAu:N||null,hostFrameId:R},contextText:`Host frame: ${x?.hostFrame?.label||"Primary star"}
Parent: ${v.gasGiant.name||v.gasGiant.id} (${nt(v.gasGiant).toLowerCase()})
Parent orbit: ${g(w.inputs.semiMajorAxisAu,3)} AU
${f>5e-4?`Companion flux: ${g(f,3)}x Earth
`:""}${q>.001?`Flux variability: ${g(q*100,1)}%`:"Flux variability: low"}`,model:$.find(F=>F.raw.id===e)?.model||$.find(F=>F.raw.inputs===i)?.model||$[0]?.model||ut({starMassMsol:Number(m.massMsol)||1,starAgeGyr:Number(m.ageGyr)||4.6,starMetallicityFeH:Number(m.metallicityFeH)||0,starRadiusRsolOverride:m.radiusRsolOverride??null,starLuminosityLsolOverride:m.luminosityLsolOverride??null,starTempKOverride:m.tempKOverride??null,starEvolutionMode:m.evolutionMode||"zams",hostFrameId:R,hostFrame:x?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:q,moon:i,parentOverride:w})}}let D=v.inputs||{...t.planet},V=zt({starMassMsol:Number(m.massMsol)||1,starAgeGyr:Number(m.ageGyr)||4.6,starMetallicityFeH:Number(m.metallicityFeH)||0,starRadiusRsolOverride:m.radiusRsolOverride??null,starLuminosityLsolOverride:m.luminosityLsolOverride??null,starTempKOverride:m.tempKOverride??null,starEvolutionMode:m.evolutionMode||"zams",hostFrameId:R,hostFrame:x?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:q,planet:D,moons:P.map(T=>T.inputs||{}),gasGiants:se(t).filter(T=>we(T?.hostFrameId,E?.defaultHostFrameId)===R).map(T=>({name:T.name,au:T.au}))}),z=Pa(V),X=ft({starMassMsol:Number(m.massMsol)||1,starAgeGyr:Number(m.ageGyr)||4.6,starMetallicityFeH:Number(m.metallicityFeH)||0,starRadiusRsolOverride:m.radiusRsolOverride??null,starLuminosityLsolOverride:m.luminosityLsolOverride??null,starTempKOverride:m.tempKOverride??null,starEvolutionMode:m.evolutionMode||"zams",starHabitableZoneAu:N,hostFrameId:R,hostFrame:x?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:q,parentKind:"planet",parentOverride:z,moonEntries:P.length?P:[{id:e||"draft-moon",planetId:l,inputs:i}]});return{parentType:"planet",parentOverride:z,parentInfo:{parentId:l??null,parentKind:"planet",parentName:l&&t.planets.byId?.[l]?.name||"Planet",assigned:l!=null,orbitAu:Number(D.semiMajorAxisAu)||Number(z.inputs.semiMajorAxisAu)||null,eccentricity:Number(D.eccentricity)||0,massEarth:Number(D.massEarth)||Number(z.inputs.massEarth)||null,massMjup:null,rotationPeriodHours:Number(D.rotationPeriodHours)||null,siblingCount:Math.max(P.length-(e?1:0),0),starHabitableZoneAu:N||null,hostFrameId:R},contextText:`Host frame: ${x?.hostFrame?.label||"Primary star"}
Planet Mass: ${g(D.massEarth,3)} MEarth
Planet orbit: ${g(D.semiMajorAxisAu,3)} AU
${f>5e-4?`Companion flux: ${g(f,3)}x Earth
`:""}${q>.001?`Flux variability: ${g(q*100,1)}%`:"Flux variability: low"}`,model:X.find(T=>T.raw.id===e)?.model||X.find(T=>T.raw.inputs===i)?.model||X[0]?.model||ut({starMassMsol:Number(m.massMsol)||1,starAgeGyr:Number(m.ageGyr)||4.6,starMetallicityFeH:Number(m.metallicityFeH)||0,starRadiusRsolOverride:m.radiusRsolOverride??null,starLuminosityLsolOverride:m.luminosityLsolOverride??null,starTempKOverride:m.tempKOverride??null,starEvolutionMode:m.evolutionMode||"zams",hostFrameId:R,hostFrame:x?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:q,planet:D,moon:i})}}function Z(){Gt();let t=ie(B(),{moonId:a.moonId,moonInputs:a.moon,planetId:a.moonPlanetId});La.textContent=t.contextText;let e=t.model,i=sa(e),s=e.habitability?.earthSimilarityBreakdown||{},c=e.habitability?.breakdown||{},d=e.biosphere||{},l=e.geology||{},M=e.display.surfaceBiosphere.includes("Surface sterile")?"Sterile":e.display.surfaceBiosphere.includes("Marginal")?"Marginal":e.display.surfaceBiosphere.includes("Microbial")?"Microbial":e.display.surfaceBiosphere.includes("Simple")?"Simple":e.display.surfaceBiosphere.includes("Complex")?"Complex":e.display.surfaceBiosphere,h=e.atmosphere?.dominantSpecies?`${e.atmosphere.dominantSpecies}-dominant`:"None",P=l.resurfacingDominantProcess==="volcanic"?"Volcanic":l.resurfacingDominantProcess==="cryovolcanic"?"Cryovolcanic":l.resurfacingDominantProcess==="mixed"?"Mixed":"Quiet",v=d.limitingFactors?.length?`${d.limitingFactors.length} blocker${d.limitingFactors.length===1?"":"s"}`:"Clear",E=e.display.orbitalFate.startsWith("Roche limit")?"Inward decay":e.display.orbitalFate.startsWith("Escape")?"Outward drift":"Stable",H=c.solventPolicyVersion||"surface-plus-subsurface-water-v1",x=H==="surface-subsurface-plus-alt-solvents-v1"?"surface + subsurface + alt solvents":H==="surface-plus-subsurface-water-v1"?"surface + subsurface water":"surface water only",m=e.habitability?.summary||{},b=m.surfaceExomoonCalibration||{},N=b.applicable===!0?[b.starClassBand,b.hostGiantFavorability?.label,`Moon ${g(b.moonMassEarth??0,3)} MEarth vs floor ${g(b.moonMassFloorEarth??0,3)} MEarth`,b.spinStateBenefit?.label,...b.notes||[]].filter(Boolean).join(`
`):"Applied only to exposed-surface, atmosphere-bearing moons around cool-star giant-planet systems.",R=e.spinState?.climateNote||e.tides?.spinState?.climateNote||"",f=[m.gates?.stellarZone?.label,m.gates?.stableOrbit?.label,m.gates?.energyBudget?.label,m.gates?.atmosphereRetention?.label,m.gates?.radiationShielding?.label].filter(Boolean).join(`
`),o=(F,ne,lt="",Bt={})=>({label:F,tip:A[F]||"",value:ne,meta:lt,kpiClass:`kpi--compact ${Bt.kpiClass||""}`.trim(),...Bt}),q=`Substrate ${g(c.substrate??0,2)} | Solvent ${g(c.solvent??0,2)} | Energy ${g(c.energy??0,2)} | Chemistry ${g(c.chemistry??0,2)} | Stability ${g(c.stabilityMultiplier??0,2)} | Radiation ${g(c.radiationMultiplier??0,2)} | Persistence ${g(c.persistenceMultiplier??0,2)}
Pathway ${c.solventPathway||"none"} | ${x}
${e.habitability?.habitabilityModelVersion||"phi-unified-v2"} | ${H}`,D=U.querySelector(".moon-preview-canvas"),V=F=>({...F,collapsible:!0,open:!1}),z=ro({moonName:a.moonName||a.moon.name,model:e,moonProfile:i,compactLifeLimits:v,compactOrbitalFate:E}),X=[{id:"moon-summary",title:"Key Numbers",items:[{kind:"preview",label:"Appearance",tip:A.Appearance||"",canvasClass:"moon-preview-canvas",metaChildren:[i.displayClass," \u2014 ",i.terrain.type.replace("-"," ")]},o("Composition",e.display.compositionClass),o("Radius",e.display.radius,"derived"),o("Surface Temp",e.display.surfaceTemp),o("Hydrosphere",e.display.hydrosphereState),o("Atmosphere",e.display.atmosphereClass,e.display.atmosphereSource),o("Life Class",e.display.lifeClass,e.display.habitabilityGates),o("Habitability Index",e.display.habitabilityIndex,q)]},V({id:"moon-identity",title:"Identity & Class",density:"compact",items:[o("Composition",e.display.compositionClass),o("Albedo",g(a.moon.albedo,3))]}),V({id:"moon-physical",title:"Physical State",density:"compact",items:[o("Mass",`${g(a.moon.massMoon,3)} M\u263E`),o("Density",`${g(a.moon.densityGcm3,2)} g/cm\xB3`),o("Radius",e.display.radius,"derived"),o("Gravity",e.display.gravity),o("Escape Velocity",e.display.esc)]}),V({id:"moon-environment",title:"Environment",density:"compact",items:[o("Atmosphere",e.display.atmosphereClass,e.display.atmosphereSource),o("Surface Pressure",e.display.surfacePressure),o("Atmosphere Mix",h,e.display.atmosphereComposition),o("Greenhouse Warming",e.display.greenhouseWarming),o("Atmosphere Stability",e.display.atmosphereStability,e.display.atmosphereLoss),o("Atmosphere Lifetime",e.display.atmosphereLifetime),o("Atmosphere Haze",e.display.atmosphereHaze),o("Atmosphere Clouds",e.display.atmosphereClouds),o("Hydrosphere",e.display.hydrosphereState),o("Surface Ices",e.display.surfaceIces),o("Surface Water",e.display.surfaceWater),o("Subsurface Ocean",e.display.subsurfaceOcean),o("Ocean Depth",e.display.oceanDepth),o("Ice Shell",e.display.iceShell),o("High-Pressure Ice",e.display.highPressureIce,e.display.oceanPhaseDiagnostics),o("Interior Structure",e.display.interiorStructure),o("Ocean Chemistry",e.display.oceanChemistry),o("Equilibrium Temp",e.display.equilibriumTemp),o("Climate State",e.display.climateState),o("Collapse State",e.display.collapseState),o("Surface Temp Range",e.display.surfaceTempRange),o("Day/Night Contrast",e.display.dayNightContrast),o("Nightside Min",e.display.nightsideMin),o("Climate Zones",e.display.climateZones,e.display.climateZoneSummary),o("Seasonality",e.display.seasonality)]}),V({id:"moon-system",title:"System Context",density:"compact",items:[o("Orbital Period (sidereal)",e.display.sidereal),o("Orbital Period (synodic)",e.display.synodic),o("Rotation Period",e.display.rot),o("Spin State",e.display.spinState,R),o("Initial Rotation Period",e.display.initialRot),o("Planetshine",e.display.planetshine),o("Eclipse Cooling",e.display.eclipseCooling),o("Nearest Resonance",e.display.nearestResonance),o("Laplace Status",e.display.laplaceStatus),o("Forced Eccentricity",e.display.forcedEccentricity),o("Migration Trend",e.display.migrationTrend),o("Tidal HZ",e.display.tidalHabitableZone),o("Formation",e.display.formation),o("Orbital Recession",e.display.recession),o("Orbital Fate",E,E==="Stable"?"No strong inward decay or outward escape trend is currently predicted":e.display.orbitalFate)]}),V({id:"moon-activity",title:"Activity & Radiation",density:"compact",items:[o("Total Tidal Force",e.display.tides),o("Moon Contribution",e.display.moonPct),o("Star Contribution",e.display.starPct),o("Tidal Heating",e.display.tidalHeating,e.display.tidalHeatingTotal),o("Tidal Heating (\xD7 Earth)",e.display.tidalHeatingXEarth),o("Volcanic Activity",e.display.volcanicActivity,`score ${g(l.volcanicActivityScore??0,2)}`),o("Cryovolcanism",e.display.cryovolcanicActivity,`score ${g(l.cryovolcanicActivityScore??0,2)}`),o("Resurfacing",P,`${e.display.resurfacing}
${l.resurfacingDominantProcess==="none"?"No dominant resurfacing driver":`${l.resurfacingDominantProcess||"mixed"}-driven`}`),o("Volatile Supply",e.display.volatileReplenishment,`score ${g(l.volatileReplenishmentScore??0,2)}`),o("Ocean Persistence",e.display.oceanPersistence,`score ${g(l.oceanPersistenceScore??0,2)}`),o("Radiogenic Heating",e.display.radiogenicHeating),o("Magnetosphere Dose",e.display.magnetosphericRad,e.display.magnetosphericLabel),o("Surface Radiation",e.display.surfaceRadiation),o("Magnetic Shielding",e.display.magneticShielding)]}),V({id:"moon-habitability",title:"Habitability",density:"compact",items:[o("Life Class",e.display.lifeClass,e.display.habitabilityGates),o("Habitability Index",e.display.habitabilityIndex,q),o("Earth Similarity Index",e.display.earthSimilarityIndex,`Radius ${g(s.radius??0,2)} | Density ${g(s.density??0,2)} | Escape ${g(s.escapeVelocity??0,2)} | Temp ${g(s.surfaceTemp??0,2)}`),o("Surface Habitability",e.display.surfaceHabitability,m.gates?.radiationShielding?.label||""),o("Surface Exomoon Calibration",e.display.surfaceExomoonCalibration,N),o("Subsurface Habitability",e.display.subsurfaceHabitability),o("Habitability Gates",e.display.habitabilityGates,f),o("Biosphere",M,`${e.display.surfaceBiosphere}
Score ${g(d.surfaceBiologyScore??0,2)}`),o("Plant Life",e.display.plantLife),o("Vegetation",e.biosphere?.vegetationEligible?"Yes":"No",e.display.vegetation==="Supported"?"Surface vegetation is supported by the current biosphere gate":e.display.vegetationNote),o("Life Limits",v,e.display.biosphereLimits),...e.biosphere?.vegetationEligible?[o("Veg Colours","Available",`${e.display.vegetationColours}
${e.display.vegetationNote}`)]:[]]})];$a(U,X),Na(U,z);let T=ka(e.derived?.eraTimeline,{id:"moon-era-timeline"});T&&U.insertBefore(T,U.children[2]||null),Ga($t,[{id:"moon-details-identity",title:"Identity & Class",items:[{label:"Name",value:a.moonName||a.moon.name||"Moon"},{label:"Composition",value:e.display.compositionClass},{label:"Albedo",value:g(a.moon.albedo,3)}]},{id:"moon-details-physical",title:"Physical State",items:[{label:"Mass",value:`${g(a.moon.massMoon,3)} M\u263E`},{label:"Density",value:`${g(a.moon.densityGcm3,2)} g/cm\xB3`},{label:"Radius",value:e.display.radius},{label:"Gravity",value:e.display.gravity},{label:"Escape Velocity",value:e.display.esc}]},{id:"moon-details-environment",title:"Environment",items:[{label:"Atmosphere",value:e.display.atmosphereClass,meta:e.display.atmosphereSource},{label:"Surface Pressure",value:e.display.surfacePressure},{label:"Atmosphere Mix",value:h,meta:e.display.atmosphereComposition},{label:"Greenhouse Warming",value:e.display.greenhouseWarming},{label:"Atmosphere Stability",value:e.display.atmosphereStability,meta:e.display.atmosphereLoss},{label:"Atmosphere Lifetime",value:e.display.atmosphereLifetime},{label:"Atmosphere Haze",value:e.display.atmosphereHaze},{label:"Atmosphere Clouds",value:e.display.atmosphereClouds},{label:"Hydrosphere",value:e.display.hydrosphereState},{label:"Surface Water",value:e.display.surfaceWater},{label:"Subsurface Ocean",value:e.display.subsurfaceOcean},{label:"Ocean Depth",value:e.display.oceanDepth},{label:"Ice Shell",value:e.display.iceShell},{label:"High-Pressure Ice",value:e.display.highPressureIce,meta:e.display.oceanPhaseDiagnostics},{label:"Interior Structure",value:e.display.interiorStructure},{label:"Ocean Chemistry",value:e.display.oceanChemistry},{label:"Climate State",value:e.display.climateState},{label:"Collapse State",value:e.display.collapseState},{label:"Day/Night Contrast",value:e.display.dayNightContrast},{label:"Nightside Min",value:e.display.nightsideMin},{label:"Climate Zones",value:e.display.climateZones,meta:e.display.climateZoneSummary},{label:"Seasonality",value:e.display.seasonality}]},{id:"moon-details-system",title:"System Context",items:[{label:"Classical Roche Limit",value:e.display.classicalRocheLimit},{label:"Effective Inner Limit",value:e.display.effectiveInnerLimit||e.display.zoneInner,meta:e.display.innerLimitNote},{label:"Moon Zone (Outer)",value:e.display.zoneOuter},{label:"Periapsis",value:e.display.peri},{label:"Apoapsis",value:e.display.apo},{label:"Orbital Direction",value:e.orbit.orbitalDirection},{label:"Orbital Period (sidereal)",value:e.display.sidereal},{label:"Orbital Period (synodic)",value:e.display.synodic},{label:"Rotation Period",value:e.display.rot},{label:"Spin State",value:e.display.spinState,meta:R},{label:"Initial Rotation Period",value:e.display.initialRot},{label:"Planetshine",value:e.display.planetshine},{label:"Eclipse Cooling",value:e.display.eclipseCooling},{label:"Nearest Resonance",value:e.display.nearestResonance},{label:"Laplace Status",value:e.display.laplaceStatus},{label:"Forced Eccentricity",value:e.display.forcedEccentricity},{label:"Migration Trend",value:e.display.migrationTrend},{label:"Tidal HZ",value:e.display.tidalHabitableZone},{label:"Formation",value:e.display.formation},{label:"Orbital Recession",value:e.display.recession},{label:"Orbital Fate",value:e.display.orbitalFate},{label:"Moon locked to Planet",value:e.display.moonLocked},{label:"Planet locked to Moon",value:e.display.planetLockedMoon},{label:"Planet locked to Star",value:e.display.planetLockedStar},{label:"Lock time (Moon\u2192Planet)",value:e.display.tMoonLock},{label:"Lock time (Planet\u2192Moon)",value:e.display.tPlanetMoon},{label:"Lock time (Planet\u2192Star)",value:e.display.tPlanetStar}]},{id:"moon-details-activity",title:"Activity & Radiation",items:[{label:"Total Tidal Force",value:e.display.tides},{label:"Moon Contribution",value:e.display.moonPct},{label:"Star Contribution",value:e.display.starPct},{label:"Tidal Heating",value:e.display.tidalHeating,meta:e.display.tidalHeatingTotal},{label:"Tidal Heating (\xD7 Earth)",value:e.display.tidalHeatingXEarth},{label:"Volcanic Activity",value:e.display.volcanicActivity,meta:`score ${g(l.volcanicActivityScore??0,2)}`},{label:"Cryovolcanism",value:e.display.cryovolcanicActivity,meta:`score ${g(l.cryovolcanicActivityScore??0,2)}`},{label:"Resurfacing",value:P,meta:l.resurfacingDominantProcess==="none"?"No dominant resurfacing driver":`${l.resurfacingDominantProcess||"mixed"}-driven`},{label:"Volatile Supply",value:e.display.volatileReplenishment,meta:`score ${g(l.volatileReplenishmentScore??0,2)}`},{label:"Ocean Persistence",value:e.display.oceanPersistence,meta:`score ${g(l.oceanPersistenceScore??0,2)}`},{label:"Radiogenic Heating",value:e.display.radiogenicHeating},{label:"Magnetosphere Dose",value:e.display.magnetosphericRad,meta:e.display.magnetosphericLabel},{label:"Surface Radiation",value:e.display.surfaceRadiation},{label:"Magnetic Shielding",value:e.display.magneticShielding}]},{id:"moon-details-habitability",title:"Habitability",items:[{label:"Life Class",value:e.display.lifeClass,meta:e.display.habitabilityGates},{label:"Habitability Index",value:e.display.habitabilityIndex,meta:q.replace(/\n/g," | ")},{label:"Earth Similarity Index",value:e.display.earthSimilarityIndex,meta:`Radius ${g(s.radius??0,2)} | Density ${g(s.density??0,2)} | Escape ${g(s.escapeVelocity??0,2)} | Temp ${g(s.surfaceTemp??0,2)}`},{label:"Surface Habitability",value:e.display.surfaceHabitability,meta:m.gates?.radiationShielding?.label||""},{label:"Surface Exomoon Calibration",value:e.display.surfaceExomoonCalibration,meta:N.replace(/\n/g," | ")},{label:"Subsurface Habitability",value:e.display.subsurfaceHabitability},{label:"Habitability Gates",value:e.display.habitabilityGates,meta:f.replace(/\n/g," | ")},{label:"Biosphere",value:e.display.surfaceBiosphere,meta:`Score ${g(d.surfaceBiologyScore??0,2)}`},{label:"Plant Life",value:e.display.plantLife},{label:"Vegetation",value:e.display.vegetation,meta:e.display.vegetationNote},{label:"Life Limits",value:v,meta:e.display.biosphereLimits},...e.biosphere?.vegetationEligible?[{label:"Veg Colours",value:e.display.vegetationColours,meta:e.display.vegetationNote}]:[]]}],{title:"Derived Details"});let w=$t.querySelector(".derived-details");w&&U.append(w),Ia(U,{label:"Moon output sections",includeAll:!0});let $=U.querySelector(".moon-preview-canvas");D&&$&&D!==$&&($.replaceWith(D),$=D),$&&i?C.attach($,{bodyType:"moon",name:a.moonName||a.moon.name||"Moon",recipeId:String(a.moon?.appearanceRecipeId||""),moonProfile:i,moonCalc:e,rotationPeriodDays:Number(e?.orbit?.rotationPeriodDays)||Number(e?.orbit?.periodSiderealDays)||27.3}):C.detach()}function Q(){Gt(),Ua(),Va(),de.value=a.moonName,ke.value=a.moon.semiMajorAxisKm,Ie.value=a.moon.eccentricity,Ee.value=a.moon.inclinationDeg,Ae.value=a.moon.massMoon,Re.value=a.moon.densityGcm3,Te.value=a.moon.albedo,$e.value=a.moon.compositionOverride||"",Ne.value=a.moon.initialRotationPeriodHours||12,Oe.value=a.moon.waterMassFractionPct??0,Le.value=a.moon.salinityPct??0,qe.value=a.moon.ammoniaPct??0,ue.value=a.moon.differentiatedInterior===!0?"yes":a.moon.differentiatedInterior===!1?"no":"",Be.value=a.moon.radioisotopeAbundance??1,je.value=a.moon.u238Abundance??1,Ke.value=a.moon.u235Abundance??1,_e.value=a.moon.th232Abundance??1,Ve.value=a.moon.k40Abundance??1,Ue.value=a.moon.manualSurfacePressureAtm??0,ze.value=a.moon.n2Pct??0,We.value=a.moon.o2Pct??0,Ze.value=a.moon.co2Pct??0,Qe.value=a.moon.arPct??0,Xe.value=a.moon.h2oPct??0,Ye.value=a.moon.ch4Pct??0,Je.value=a.moon.coPct??0,et.value=a.moon.h2Pct??0,tt.value=a.moon.hePct??0,at.value=a.moon.so2Pct??0,ot.value=a.moon.nh3Pct??0,it.value=a.moon.forcedEccentricity??0,ee.value=a.moon.manualResonanceGroupId||"",te.value=a.moon.manualResonanceOrder??"",ae.value=a.moon.manualResonanceRatio??"",ja(),Ft()}let rt=!1;function _(){if(rt)return;rt=!0;let t=B(),e=t.moons.selectedId,i=de.value||"New Moon",s=Ce.value||null,c=_a(),d=ie(t,{moonId:e,moonInputs:c,planetId:s}).model,l=String(d?.orbit?.semiMajorAxisGuard||"none"),M=Number(d?.inputs?.semiMajorAxisKm),h=Number(c.semiMajorAxisKm),P=Number.isFinite(M)?Math.round(M):h,v=l!=="none"&&Number.isFinite(P),E={...c,semiMajorAxisKm:v?P:h};Pe(e,{name:i,inputs:E}),aa(e,s),ct({moon:E}),v&&Math.abs(E.semiMajorAxisKm-h)>1e-9&&he(`Semi-Major Axis adjusted to ${g(E.semiMajorAxisKm,0)} km to keep this moon within the Moon Zone.`),Q(),Z(),rt=!1}de.addEventListener("change",_),$e.addEventListener("change",_),Ce.addEventListener("change",_),ue.addEventListener("change",_),ee.addEventListener("change",_),te.addEventListener("change",_),ae.addEventListener("change",_),[Ge,He,Fe,De].forEach(t=>{t?.addEventListener("change",()=>{_(),Ft()})}),[ze,We,Ze,Qe,Xe,Ye,Je,et,tt,at,ot].forEach(t=>{t?.addEventListener("change",_)}),J.addEventListener("change",()=>{Yt(J.value),Q(),Z()}),xe.addEventListener("click",t=>{t.preventDefault();let e=B(),i=Y(e)?.inputs||e.moon;Jt(i,{name:"New Moon",planetId:e.planets.selectedId}),Q(),Z()}),Oa.addEventListener("click",async t=>{t.preventDefault();let e=B();if(e.moons.order.length<=1)return;let i=ta(e.moons.selectedId,e);!i||!await ha(i)||(ea(e.moons.selectedId),Q(),Z())}),qa?.addEventListener("click",()=>{ve()}),Da?.addEventListener("click",()=>{fe()}),Ba?.addEventListener("click",()=>{to(t=>{st(Ca(t.apply,t.id),{noticeLabel:t.label||"Moon recipe"})})}),n.querySelector("#btn-default").addEventListener("click",()=>{a.moon={name:"Luna",semiMajorAxisKm:384748,eccentricity:.055,inclinationDeg:5.15,massMoon:1,densityGcm3:3.34,albedo:.11,initialRotationPeriodHours:null};let t=B();Pe(t.moons.selectedId,{name:a.moon.name||"Luna",inputs:a.moon}),Q(),Z()});let Ot=Object.freeze([{id:"type",label:"Goal"},{id:"parent-context",label:"Setup"},{id:"goal-details",label:"Traits"},{id:"recommendation",label:"Recommendation"}]);function Wa(t){let e=Ot.findIndex(i=>i.id===String(t||""));return e>=0?e:0}function Lt(){let t=B(),e=Y(t),i=e?.id||a.moonId,s=e?.planetId??a.moonPlanetId??null,c=e?.inputs||a.moon,d=ie(t,{moonId:i,moonInputs:c,planetId:s}),l=d.parentInfo?.parentClassLabel?`Current ${String(d.parentInfo.parentClassLabel).toLowerCase()} system`:"Current giant companion system",M=d.parentInfo?.assigned===!1?"No assigned parent":d.parentType==="gasGiant"?l:"Current planet system",h=d.parentInfo?.assigned===!1?`${d.contextText}
Moon is currently unassigned. Assign it to a planet or giant companion before using strict guided fitting.`:d.contextText;return{currentMoonId:i,currentMoonName:a.moonName||a.moon.name||"Moon",currentInputs:{...c||{}},currentOrbitWindowKm:{inner:Number(d.model?.orbit?.zoneInnerKm??d.model?.orbit?.moonZoneInnerKm)||null,outer:Number(d.model?.orbit?.zoneOuterKm??d.model?.orbit?.moonZoneOuterKm)||null},siblingEntries:Se(t).filter(P=>P?.id!==i&&(P?.planetId??null)===(s??null)),currentContextLabel:M,currentContextText:h,parentContext:d.parentInfo||null,starHabitableZoneAu:d.parentInfo?.starHabitableZoneAu||null,recipeCatalog:re,solveMoonInputs:(P,v={})=>{let E=B(),H=Y(E);return ie(E,{moonId:H?.id||i,moonInputs:P,planetId:H?.planetId??s,parentPatch:v.parentPatch||null,siblingPatch:v.siblingPatch||null})}}}function Za(t,e=[]){return ba(t,e)}function Qa(t,e,i,s){return va(t,e,i,s)}function Xa(t,e){return fa(t,e,{objectType:"moon",objectLabel:"moon"})}function Ya(t){return ga(t,{readyDetail:"The structured goal is valid. Run Search to try seeded moon candidates.",searchingDetail:"Trying seeded moon candidates against the current parent context.",completeDetail:"Review the result, diagnostics, and context adjustments before applying.",completeTitleWithoutResult:"Ready to search"})}function ye(){let t=B(),e=Y(t);return{objectKey:e?.id||"",contextFingerprint:ua({moonId:e?.id||"",planetId:e?.planetId||null,inputs:e?.inputs||null})}}function be(t,e,i=""){let s=e==null||e===""||typeof e=="number"&&!Number.isFinite(e)?"n/a":String(e);return k("div",{className:"moon-guided-preview__metric"},[k("div",{className:"moon-guided-preview__metric-label",text:t}),k("div",{className:"moon-guided-preview__metric-value",text:s}),i?k("div",{className:"moon-guided-preview__metric-meta",text:i}):null])}function qt(t){let e=t?.previewPayload?.moonCalc;if(!e)return null;let i=(t?.contextAdjustments||[]).join(" "),s=!!t?.applyPayload?.parentPatch,c=!!t?.applyPayload?.siblingPatch;return k("div",{className:"moon-guided-preview"},[k("div",{className:"moon-guided-preview__title",text:s&&c?"Solved preview after applying the recommended host and moon-system fixes":s?"Solved preview after applying the recommended host fixes":c?"Solved preview after applying the recommended moon-system fixes":"Solved preview in the current host context"}),k("div",{className:"moon-guided-preview__grid"},[be("Hydrosphere",e.display?.hydrosphereState),be("Atmosphere",e.display?.atmosphereClass,e.display?.surfacePressure),be("Climate",e.display?.climateState),be("Biosphere",e.display?.surfaceBiosphere,e.display?.vegetation)]),i?k("div",{className:"moon-guided-preview__summary",text:i}):null])}function Ja(t){if(!t||!t.parentId||!t.parentKind)return!1;if(t.parentKind==="planet")return Xt(t.parentId,{inputs:{...t.inputPatch||{}}}),!0;if(t.parentKind==="gasGiant"){let e=se().map(i=>i.id===t.parentId?{...i,...t.inputPatch||{}}:i);return ia(e),!0}return!1}function eo(t,{noticeLabel:e="Guided moon"}={}){let i=Ja(t?.applyPayload?.parentPatch||null),s=oa(t?.applyPayload?.siblingPatch||null,{preserveSelectedMoonId:B().moons?.selectedId||null});return{appliedInputs:st(t?.applyPayload?.objectInputs||{},{noticeLabel:e}),parentPatched:i,parentPatchSummary:t?.applyPayload?.parentPatch?.summary||"",siblingPatched:!!s?.changed,siblingPatchSummary:t?.applyPayload?.siblingPatch?.summary||"",siblingPatchCreatedCount:s?.createdMoonIds?.length||0,siblingPatchUpdatedCount:s?.updatedMoonIds?.length||0}}function ve(t=null,e=""){let i=gt(),s=Lt(),c=ye(),{overlayEl:d,contentEl:l,closeButtonEl:M}=St(),h=null;function P(x=!1){h?.cancelSearch?.("overlay-closed"),K.delete(E),x||yt("moon"),d.remove(),document.removeEventListener("keydown",H)}function v(){P(!1),e&&location.hash!==e&&(location.hash=e)}let E=()=>P(!0);function H(x){x.key==="Escape"&&v()}h=bt({adapter:i,context:s,initialState:{objectType:"moon",uxMode:"quick",selectedArchetypeId:t?.selectedArchetypeId||"",answers:t?.answers||{}},onUpdate:({state:x,archetypes:m,questions:b,recommendation:N})=>{let R=vt({title:"Moon Quick Types",subtitle:"Pick a defensible starting point. Each option maps to an engine-backed moon preset and is re-solved in the current parent context.",archetypes:(m||[]).filter(f=>f?.quickEnabled!==!1),selectedArchetypeId:x.selectedArchetypeId||"",questions:b,answers:x.answers,recommendation:N,previewContent:qt(N),actions:[{id:"apply",label:N?.diagnostics?.some(f=>f?.severity==="warning")?"Apply Starting Point":"Apply Quick Type",disabled:!N}],onArchetypeSelect:f=>h?.selectArchetype(f),onQuestionChange:(f,o)=>h?.setAnswer(f,o),onAction:f=>{f!=="apply"||!N||(h?.apply({applyMoonInputs:o=>st(o,{noticeLabel:N.title||"Moon quick type"})}),v())}});l.replaceChildren(R),pt("moon",{...c,uxMode:"quick",...mt(x)})}}),K.add(E),M.addEventListener("click",v),d.addEventListener("click",x=>{x.target===d&&v()}),document.addEventListener("keydown",H),document.body.appendChild(d)}function fe(t=null,e=""){let i=gt(),s=Lt(),c=ye(),{overlayEl:d,contentEl:l,closeButtonEl:M}=St(),h=null;function P(b=!1){h?.cancelSearch?.("overlay-closed"),K.delete(E),b||yt("moon"),d.remove(),document.removeEventListener("keydown",H)}function v(){P(!1),e&&location.hash!==e&&(location.hash=e)}let E=()=>P(!0);function H(b){b.key==="Escape"&&v()}function x(b,N=[]){let R=String(b?.currentStepId||"type");return R==="type"?"parent-context":R==="parent-context"&&N.some(f=>f?.stepId==="goal-details")?"goal-details":"recommendation"}function m(b){let N=String(b?.currentStepId||"type");return N==="recommendation"?(b?.questions||[]).some(R=>R?.stepId==="goal-details")?"goal-details":"parent-context":N==="goal-details"?"parent-context":"type"}h=bt({adapter:i,context:s,searchMode:"manual",initialState:{objectType:"moon",uxMode:"guided",currentStepId:t?.currentStepId||"type",selectedArchetypeId:t?.selectedGoalTemplateId||"",selectedGoalTemplateId:t?.selectedGoalTemplateId||"",goalDraft:t?.goalDraft||{},compiledGoal:t?.compiledGoal||null,searchStatus:t?.searchStatus||"idle",lastSearchResult:t?.lastSearchResult||null,lastSearchContextFingerprint:t?.lastSearchContextFingerprint||"",lastSearchEngineFingerprint:t?.lastSearchEngineFingerprint||""},onUpdate:({state:b,archetypes:N,questions:R,recommendation:f})=>{let o=String(b.currentStepId||"type"),q=Wa(o),D=(R||[]).filter(w=>String(w?.stepId||"goal-details")===o),V=Za(b,D),z=(R||[]).some(w=>w?.stepId==="goal-details"),X=Ot.map((w,$)=>({...w,disabled:w.id!=="type"&&!b.selectedGoalTemplateId||w.id==="goal-details"&&!z||w.id==="recommendation"&&(!b.selectedGoalTemplateId||$>q+1)})),T=vt({title:"Moon Goal Builder",subtitle:"Choose the moon outcome you want, set scope and search budget, then compile and run a seeded goal search before applying the recommendation.",steps:X,currentStepId:o,archetypes:(N||[]).filter(w=>w?.guidedEnabled!==!1),selectedArchetypeId:b.selectedGoalTemplateId||"",typeSupplement:o==="type"?Xa(()=>h,b):null,questions:D,answers:V,recommendation:f,status:o==="recommendation"?Ya(b):null,previewContent:o==="recommendation"?qt(f):null,visibleSections:{type:o==="type",questions:o==="parent-context"||o==="goal-details",status:o==="recommendation",recommendation:o==="recommendation",diagnostics:o==="recommendation"},typeSectionTitle:"Moon Goal",questionSectionTitle:o==="parent-context"?"Search Setup":"Goal Traits",recommendationSectionTitle:"Best Moon Fit",diagnosticSectionTitle:"Search Diagnostics",actions:[...o!=="type"?[{id:"back",label:"Back"}]:[],...o!=="recommendation"?[{id:"next",label:o==="goal-details"?"Review Goal Search":"Next",disabled:o==="type"&&!b.selectedGoalTemplateId}]:[{id:"compile",label:"Compile Goal",disabled:!b.selectedGoalTemplateId||b.searchStatus==="searching"},{id:"run-search",label:b.searchStatus==="searching"?"Searching...":"Run Search",disabled:!b.selectedGoalTemplateId||b.searchStatus==="searching"},{id:"apply",label:f?.applyPayload?.parentPatch&&f?.applyPayload?.siblingPatch?"Apply with Host + Moon-System Fixes":f?.applyPayload?.parentPatch?"Apply with Host Fixes":f?.applyPayload?.siblingPatch?"Apply with Moon-System Fixes":"Apply",disabled:!f||f.hasBlockingDiagnostics||b.searchStatus!=="complete"},{id:"apply-advanced",label:f?.applyPayload?.parentPatch&&f?.applyPayload?.siblingPatch?"Apply with Host + Moon-System Fixes and open Advanced":f?.applyPayload?.parentPatch?"Apply with Host Fixes and open Advanced":f?.applyPayload?.siblingPatch?"Apply with Moon-System Fixes and open Advanced":"Apply and open Advanced",disabled:!f||f.hasBlockingDiagnostics||b.searchStatus!=="complete"}],{id:"reset",label:"Reset",className:"is-secondary"}],onArchetypeSelect:w=>h?.reset({objectType:"moon",uxMode:"guided",currentStepId:"type",selectedArchetypeId:w,selectedGoalTemplateId:w}),onQuestionChange:(w,$)=>Qa(h,b,w,$),onStepSelect:(w,$)=>{$?.disabled||h?.setStep(w)},onAction:w=>{if(w==="reset"){h?.reset({objectType:"moon",uxMode:"guided",currentStepId:"type"});return}if(w==="back"){h?.setStep(m(b));return}if(w==="next"){h?.setStep(x(b,R));return}if(w==="compile"){h?.compileGoal();return}if(w==="run-search"){h?.startSearch();return}if((w==="apply"||w==="apply-advanced")&&f){let $=h?.apply({applyMoonRecommendation:lt=>eo(lt,{noticeLabel:f.title||"Guided moon"})});v();let F=[];$?.parentPatched&&$?.parentPatchSummary&&F.push(`host fixes: ${$.parentPatchSummary}`),$?.siblingPatched&&$?.siblingPatchSummary&&F.push(`moon-system fixes: ${$.siblingPatchSummary}`);let ne=F.length?`${f.title||"Guided moon"} applied with ${F.join("; ")}. `:"";w==="apply-advanced"?he(`${ne}Continue refining with the Moon page controls.`):ne&&he(ne.trim())}}});l.replaceChildren(T),pt("moon",{...c,uxMode:"guided",...mt(b,{currentStepId:b.currentStepId||"type"})})}}),K.add(E),M.addEventListener("click",v),d.addEventListener("click",b=>{b.target===d&&v()}),document.addEventListener("keydown",H),document.body.appendChild(d)}function to(t){let e=Ha(re);document.body.appendChild(e);let i=e.querySelector(".rp-picker-progress > span"),s=e.querySelector(".rp-picker-progress"),c=[];for(let M of e.querySelectorAll(".rp-picker-card")){let h=re.find(P=>P.id===M.dataset.recipe);h&&c.push({canvas:M.querySelector("canvas"),model:{bodyType:"moon",name:h.label||"Moon",recipeId:h.id,moonCalc:h.previewCalc||h.preview}})}la(c,(M,h)=>{let P=h?M/h*100:100;i&&(i.style.width=`${P}%`),P>=100&&s&&s.classList.add("is-done")},{maxRendersPerFrame:1,frameBudgetMs:7});function d(){K.delete(d),e.remove(),document.removeEventListener("keydown",l)}for(let M of e.querySelectorAll(".rp-picker-card"))M.addEventListener("click",()=>{let h=re.find(P=>P.id===M.dataset.recipe);h&&t(h),d()});e.addEventListener("click",M=>{M.target===e&&d()}),e.querySelector(".rp-picker-close").addEventListener("click",d);function l(M){M.key==="Escape"&&d()}K.add(d),document.addEventListener("keydown",l)}Q(),Z();let Dt=xa("moon");if(y?.dedicated&&y.objectType==="moon"){let t=ht("moon",ye());y.uxMode==="quick"?ve(t?.uxMode==="quick"?t:null,y.baseHash||""):fe(t?.uxMode==="guided"?t:null,y.baseHash||"")}else if(Dt?.uxMode==="quick")ve();else if(Dt)fe();else{let t=ht("moon",ye());t?.uxMode==="quick"?ve(t):t&&fe(t)}return()=>{K.forEach(t=>{try{t()}catch{}}),oe&&clearTimeout(oe),W.disconnect(),C.dispose()}}function L(r,u,y,p,S,I,a,C){let n=y?` <span class="unit">${y}</span>`:"";return`
  <div class="form-row">
    <div>
      <div class="label">${u}${n} ${G(A[C]||A[u]||"")}</div>
      <div class="hint">${p}</div>
    </div>
    <div class="input-pair">
      <input id="${r}" type="number" step="${a}" aria-label="${u}" />
      <input id="${r}_slider" type="range" aria-label="${u} slider" />
      <div class="range-meta"><span id="${r}_min"></span><span id="${r}_max"></span></div>
    </div>
  </div>`}function lo(r,u,y=[]){return`
    <div id="${r}" class="physics-trio-toggle">
      ${y.map((p,S)=>`
            <input type="radio" name="${u}" id="${r}_${S}" value="${p.value}" ${p.checked?"checked":""} />
            <label for="${r}_${S}">${p.label}</label>`).join("")}
      <span></span>
    </div>`}function co(r,u,y=[]){return`
    <div id="${r}" class="physics-duo-toggle">
      ${y.map((p,S)=>`
            <input type="radio" name="${u}" id="${r}_${S}" value="${p.value}" ${p.checked?"checked":""} />
            <label for="${r}_${S}">${p.label}</label>`).join("")}
      <span></span>
    </div>`}function Pt(r,u,y,p,S,I){return`
  <div class="form-row">
    <div>
      <div class="label">${y} ${G(A[p]||"")}</div>
      <div class="hint" id="${I}"></div>
    </div>
    <div class="pill-toggle-wrap">
      ${lo(r,u,S)}
    </div>
  </div>`}function j(r,u,y="",p="",S=""){let I=y?` <span class="unit">${y}</span>`:"";return`
  <div class="form-row">
    <div>
      <div class="label">${u}${I} ${G(A[S]||A[u]||"")}</div>
      <div class="hint">${p}</div>
    </div>
    <input id="${r}" type="number" step="0.01" />
  </div>`}export{Wo as initMoonPage};
