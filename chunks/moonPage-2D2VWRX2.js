import{c as Pa,d as ft}from"./chunk-DQ3REHMK.js";import{a as ga,b as Ma,c as vt}from"./chunk-MLACVDF5.js";import{b as sa,c as ra,d as la,e as ut,f as mt,g as pt,h as ht,i as pa,j as ha,k as ya,l as ba}from"./chunk-UOX25KFH.js";import"./chunk-X5HJXCPV.js";import{b as Sa}from"./chunk-SIP25B6Y.js";import{e as yt,f as le,j as bt}from"./chunk-YAK24QGD.js";import"./chunk-DFN46JRM.js";import{a as ma}from"./chunk-PCXLDNQS.js";import{a as aa}from"./chunk-WYZYYRUA.js";import{a as ia,b as na}from"./chunk-BYDCMUQI.js";import{b as fa}from"./chunk-MKVAAU7A.js";import{a as oa,b as se}from"./chunk-Q3VLUPE4.js";import{i as dt}from"./chunk-IKPY52EN.js";import{a as ua}from"./chunk-RMZ46KGS.js";import{a as da}from"./chunk-Z2MOTVH7.js";import{a as va}from"./chunk-KYI55SIV.js";import{a as T,b as re,d as ca}from"./chunk-L76EVWF4.js";import{b as x,c as ct}from"./chunk-XMLMEZIZ.js";import"./chunk-LAMR64J5.js";import"./chunk-7PVDVLB6.js";import"./chunk-5SEMLOPL.js";import{$a as ea,D as jt,Ga as ge,Ha as Me,Ia as zt,Ka as Ut,Q as Vt,Qa as Wt,Sa as Se,Ta as X,Ua as Zt,Va as Qt,Wa as Xt,Xa as Yt,Ya as Pe,_a as Jt,hb as lt,ob as ne,vb as ta,za as B}from"./chunk-CHTPZXSQ.js";import{ga as Kt}from"./chunk-BSVYDJBQ.js";import"./chunk-47ATKL5F.js";import{h as qt,m as Dt,n as Bt,x as _t}from"./chunk-XFZMQA63.js";import{j as g}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function gt(n,l){return x("option",{attrs:{value:n==null?"":String(n)},text:l==null?"":String(l)})}function wa(n,l=[]){return l.length?x("optgroup",{attrs:{label:n}},l.map(m=>gt(m?.value,m?.label))):null}function xa(n,{planets:l=[],gasGiants:m=[],selectedValue:p="",disabled:P=!1,title:I=""}={}){ct(n,[gt("","Unassigned"),wa("Planets",(l||[]).map(k=>({value:k?.moonParentId||k?.id||"",label:`${k?.name||k?.inputs?.name||k?.id||"Planet"}${k?.classification?.displayLabel?` - ${k.classification.displayLabel}`:""}`}))),wa("Gas Giants",(m||[]).map(k=>({value:k?.moonParentId||k?.id||"",label:`${k?.name||k?.id||"Gas Giant"}${k?.classification?.displayLabel?` - ${k.classification.displayLabel}`:""}`})))]);let a=p==null?"":String(p);return n.value=[...n.options].some(k=>k.value===a)?a:"",n.disabled=!!P,n.title=I||"",n}function Ca(n,l=[],m=""){let p=Array.isArray(l)?l:[];if(ct(n,p.map(a=>gt(a?.id||"",a?.name||a?.inputs?.name||a?.id||"Moon"))),!p.length)return n.value="",n;let P=String(m||""),I=String(p[0]?.id||"");return n.value=[...n.options].some(a=>a.value===P)?P:I,n}function ka(n,l=[]){return ra(n,l)}function Ya(n=[]){return(Array.isArray(n)?n:[]).filter(l=>l&&l.label&&l.value!=null&&l.value!=="")}function Ja(n={}){let l=String(n.body||"").trim();if(!l)return null;let m=Ya(n.items);return x("section",{className:"moon-result-summary result-summary",attrs:{id:"moonResultSummary","data-tone":n.tone||"neutral","aria-label":"Moon result summary"}},[x("div",{className:"result-summary__eyebrow",text:"Result Summary"}),x("p",{className:"result-summary__body",text:l}),m.length?x("div",{className:"result-summary__items"},m.map(p=>x("div",{className:"result-summary__item"},[x("span",{className:"result-summary__item-label",text:p.label}),x("span",{className:"result-summary__item-value",text:p.value})]))):null])}function Ia(n,l={}){if(!n)return n;n.querySelector("#moonResultSummary")?.remove();let m=Ja(l);return m&&n.insertBefore(m,n.firstChild),n}function Ea(n,l=[],m={}){return sa(n,l,m),n}function eo(n){let l=n?.preview||{},m=l?.tides||{},p=l?.inputs||{},P=l?.physical||{},I=String(m?.compositionClass||""),a=String(n?.id||""),k=Number(m?.tidalHeatingEarth)||0,s=Number(p?.albedo)||0,j=Number(P?.radiusMoon)||0;return a==="irregular-capture"?"Dark captured rubble body":a==="phobos"||a==="deimos"?"Tiny captured moonlet":k>=12?"Volcanic resurfacing world":k>=1&&I==="Subsurface ocean"?"Fractured ice over an interior ocean":I==="Subsurface ocean"?"Ice shell with likely ocean below":I==="Icy"||I==="Very icy"?"Bright frozen surface":I==="Mixed rock/ice"&&j>=1.2&&s<=.25?"Cold haze-prone ice-rock moon":I==="Mixed rock/ice"?"Blended rock and ice surface":I==="Partially molten"?"Heated molten companion":j<.05?"Small irregular capture":"Rocky major moon"}function Aa(n=[]){let l=[...new Set((n||[]).map(m=>m?.category).filter(Boolean))];return x("div",{className:"rp-picker-overlay rp-picker-overlay--moon"},[x("div",{className:"rp-picker-dialog rp-picker-dialog--moon panel"},[x("div",{className:"panel__header"},[x("div",{className:"rp-picker-heading"},[x("h2",{text:"Moon Recipes"}),x("div",{className:"rp-picker-subtitle",text:"Pick a visual and physical starting point for the current moon."})]),x("button",{className:"small rp-picker-close",attrs:{type:"button"},text:"Close"})]),x("div",{className:"rp-picker-progress"},[x("span")]),x("div",{className:"panel__body"},l.flatMap(m=>[x("div",{className:"rp-picker-category",text:m}),x("div",{className:"rp-picker-grid"},(n||[]).filter(p=>p?.category===m).map(p=>x("div",{className:"rp-picker-card",dataset:{recipe:p?.id||""}},[x("canvas",{attrs:{width:"90",height:"90"}}),x("div",{className:"rp-picker-card__label",text:p?.label||p?.id||"Moon recipe"}),x("div",{className:"rp-picker-card__hint",text:p?.hint||eo(p)})])))]))])])}function Mt(){return da({overlayClassName:"rp-picker-overlay--moon moon-guided-overlay",dialogClassName:"rp-picker-dialog--moon moon-guided-dialog",closeButtonClassName:"moon-guided-overlay__close",contentClassName:"moon-guided-overlay__content",closeLabel:"Close moon guided creation"})}var R={"Star Mass":`Host star mass in solar masses.

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

Moons outside the stellar habitable zone can still score well here if they plausibly sustain buried liquid water under ice.`,"Habitability Gates":"Quick count of how many surface and subsurface habitability gates currently pass."},to=[{title:"Getting Started",body:"The Moons page creates and configures natural satellites. Select a moon from the dropdown, or create a new one. Assign it to a parent planet or giant companion using the parent selector."},{title:"Orbit Setup",body:"Set semi-major axis, eccentricity, and inclination. The semi-major axis is automatically clamped to the parent\u2019s moon zone \u2014 between the Roche limit and Hill sphere."},{title:"Physical Properties",body:"Adjust mass, density, albedo, and composition. Use the composition override dropdown for special scenarios like subsurface oceans or partially molten interiors."},{title:"Tidal System",body:"Outputs show tidal forces, heating, and locking timescales. Check whether the moon is tidally locked to its planet, and whether the planet is locked to its star or moon."},{title:"Creation Modes",body:"Use Create This Moon at the top of Inputs. Quick applies a moon archetype, Guided walks you to a recommendation, Recipes opens the preset library for exact moon templates like Luna, Europa, Io, or Titan, and Advanced is the direct editor below."}];function we(n,l=null){return String(n??"").trim()||l||null}function Ra(n){return zt(n)}function ao(n,l){let m=Me(n),p=ge(m||{}),P={massMsol:Number(m?.massMsol)||1,ageGyr:Number(m?.ageGyr)||4.6,metallicityFeH:Number(m?.metallicityFeH)||0,radiusRsolOverride:p.r,luminosityLsolOverride:p.l,tempKOverride:p.t,evolutionMode:p.ev},I=_t({massMsol:P.massMsol,ageGyr:P.ageGyr,metallicityFeH:P.metallicityFeH,radiusRsolOverride:P.radiusRsolOverride,luminosityLsolOverride:P.luminosityLsolOverride,tempKOverride:P.tempKOverride,evolutionMode:P.evolutionMode}),a=l?.defaultHostFrameId||l?.primaryStarId||"star_a";return{hostFrameId:a,hostFrame:{id:a,label:m?.name||"Star",frameKind:"star",orbitFamilyKind:"single",zones:{habitableZoneAu:I.habitableZoneAu},fluxModel:{meanCompanionFluxEarth:0,fluxVariabilityFraction:0,meanCompanionXuvFluxEarth:0},stability:{criticalOuterAu:null,diskTruncationAu:null,warnings:[]}},starId:l?.primaryStarId||a,starConfig:P,starModel:I,companionFluxEarth:0,companionXuvFluxEarth:0,fluxVariabilityFraction:0,dominantContributorId:l?.primaryStarId||a}}function oo(n,l,m=null){let p=m||Ra(n),P=we(l?.hostFrameId,p?.defaultHostFrameId||p?.primaryStarId);return jt(p,P)||ao(n,p)}function io({compactLifeLimits:n,compactOrbitalFate:l,lifeClass:m}){return l!=="Stable"||n&&n!=="Clear"?"warning":/surface|complex|simple|microbial|candidate|habitable/i.test(String(m||""))?"good":"neutral"}function no({moonName:n,model:l,moonProfile:m,compactLifeLimits:p,compactOrbitalFate:P}={}){let I=String(n||l?.inputs?.name||"Moon").trim()||"Moon",a=m?.displayClass||l?.display?.compositionClass||"moon environment",k=l?.display?.hydrosphereState||"water state unresolved",s=l?.display?.atmosphereClass||"atmosphere unresolved",j=l?.display?.surfaceTemp||"temperature unresolved",U=l?.display?.lifeClass||"life class unresolved",J=P==="Stable"?"The current orbit is not showing a strong inward decay or outward escape warning.":`Orbital fate needs attention: ${l?.display?.orbitalFate||P}.`,xe=p==="Clear"?"No compact life blockers are flagged.":`${p||"Some blockers"} ${p==="1 blocker"?"is":"are"} active; inspect Habitability for the gate details.`;return{tone:io({compactLifeLimits:p,compactOrbitalFate:P,lifeClass:U}),body:`${I} reads as ${a.toLowerCase()} with ${k.toLowerCase()} and ${s.toLowerCase()}. Surface temperature is ${j}. ${U} is the current habitability class. ${J} ${xe}`,items:[{label:"Focus",value:I},{label:"Surface",value:a},{label:"Life signal",value:U}]}}function _o(n,l={}){let m=l?.routeContext?.guided||null,p=B(),P=Me(p),I=ge(P),a={starMassMsol:Number(P.massMsol),starAgeGyr:Number(P.ageGyr),starMetallicityFeH:Number(P.metallicityFeH)||0,starRadiusRsolOverride:I.r,starLuminosityLsolOverride:I.l,starTempKOverride:I.t,starEvolutionMode:I.ev,planet:{...p.planet},moon:{...p.moon}},k=ia({speedDaysPerSec:.5}),s=document.createElement("div");s.className="page",s.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--moons" aria-hidden="true"></span><span>Moons</span></h1>
        <button id="moonTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        ${ma({summary:"Author moons for selected planets and gas giants, then validate their orbit and environment outputs.",controls:"The selected moon, its parent assignment, and the orbit, interior, atmosphere, and coupling inputs.",affects:"Planet tides, calendar moon phases, and moon-specific habitability and visual outputs.",primaryAction:"Choose a parent world or leave the moon unassigned, then set orbit distance before fine-tuning the deeper modes.",compact:!0,detailsTitle:"Moon workflow context",detailsSummary:"Parent, orbit, and environment choices feed tides, calendars, and visuals."})}
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">

          <div class="label">Parent Context ${T(R["Derived Data"]||"")}</div>
          <div class="derived-readout derived-readout--context" id="context"></div>

          <div style="height:12px"></div>

          <div class="label">Moon selection ${T(R["Moon selection"]||"")}</div>
          <div class="form-row">
            <div>
              <div class="label">Editing moon ${T(R["Editing moon"]||"")}</div>
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
              <div class="label">Belongs to planet ${T(R["Belongs to planet"]||"")}</div>
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
              <button id="moonCreateQuickBtn" type="button" class="guided-entry-strip__mode" ${re(le("quick"))}>
                Quick
              </button>
              <button id="moonCreateGuidedBtn" type="button" class="guided-entry-strip__mode" ${re(le("guided"))}>
                Guided
              </button>
              <button id="moonCreateRecipesBtn" type="button" class="guided-entry-strip__mode" ${re(le("recipes"))}>
                Recipes
              </button>
              <span class="guided-entry-strip__mode guided-entry-strip__mode--current" aria-current="page" ${re(le("advanced"))}>
                Advanced
              </span>
            </div>
          </div>

          <div style="height:10px"></div>

          <div class="label">Moon Science Modes ${T(R["Moon Science Modes"]||"")}</div>
          ${St("hydModePills","hydMode","Hydrosphere Mode","Hydrosphere Mode",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"hydModeHint")}
          ${St("atmModePills","atmMode","Atmosphere Mode","Atmosphere Mode",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"atmModeHint")}
          ${St("orbModePills","orbMode","Orbital Coupling","Orbital Coupling",[{value:"core",label:"Core",checked:!0},{value:"full",label:"Full",checked:!1},{value:"manual",label:"Manual",checked:!1}],"orbModeHint")}

          <div style="height:10px"></div>

<div class="label">Identity ${T(R.Identity||"")}</div>
          <div class="form-row">
            <div>
              <div class="label">Name ${T(R.Name||"")}</div>
              <div class="hint">Used in exports and print view.</div>
            </div>
            <input id="name" type="text" />
          </div>

          <div style="height:8px"></div>
          <div class="label">Orbit ${T(R.Orbit||"")}</div>

          ${O("a","Semi-Major Axis","km","",10,1e9,100,"Semi-Major Axis")}
          ${O("e","Eccentricity","","",0,.99,.001,"Eccentricity")}
          ${O("inc","Inclination","\xB0","",0,180,.1,"Inclination")}

          <div style="height:8px"></div>
          <div class="label">Physical ${T(R.Physical||"")}</div>

          ${O("m","Mass","MMoon","",1e-8,1e3,1e-8,"Mass")}
          ${O("density","Density","g/cm\xB3","",.1,20,.01,"Density")}
          ${O("albedo","Albedo","","",0,.95,.001,"Albedo")}

          <div class="form-row">
            <div>
              <div class="label">Composition Override ${T(R["Composition Override"]||"")}</div>
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
          <div class="label">Dynamics ${T(R.Dynamics||"")}</div>
          ${O("initRot","Initial Rotation Period","hours","",2,1e3,.1,"Initial Rotation Period")}

          <div style="height:8px"></div>
          <div class="label">Bulk & Interior ${T(R["Bulk & Interior"]||"")}</div>
          <div id="moonHydrosphereSection">
            ${O("wmf","Water Mass Fraction","%","",0,60,.1,"Water Mass Fraction")}
            ${O("salinity","Salinity","%","",0,35,.1,"Salinity")}
            ${O("ammonia","Ammonia","%","",0,30,.1,"Ammonia")}
            <div class="form-row">
              <div>
                <div class="label">Differentiated Interior ${T(R["Differentiated Interior"]||"")}</div>
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
                <div class="label">Moon Radioisotopes ${T(R["Moon Radioisotopes"]||"")}</div>
                <div class="hint" id="isoModeHint"></div>
              </div>
              <div class="pill-toggle-wrap">
                ${ro("isoModePills","isoMode",[{value:"simple",label:"Simple",checked:!0},{value:"advanced",label:"Advanced",checked:!1}])}
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
          <div class="label">Atmosphere ${T(R["Atmosphere Controls"]||"")}</div>
          <div id="moonAtmosphereSection">
            ${O("manualPressure","Manual Surface Pressure","atm","",0,10,.01,"Manual Surface Pressure")}
            ${_("n2Pct","Nitrogen (N2)","%","Derived to fill the remainder when left at 0 in manual mode.")}
            ${_("o2Pct","Oxygen (O2)","%","")}
            ${_("co2Pct","Carbon Dioxide (CO2)","%","")}
            ${_("arPct","Argon (Ar)","%","")}
            ${_("h2oPct","Water Vapor (H2O)","%","")}
            ${_("ch4Pct","Methane (CH4)","%","")}
            ${_("coPct","Carbon Monoxide (CO)","%","")}
            ${_("h2Pct","Hydrogen (H2)","%","")}
            ${_("hePct","Helium (He)","%","")}
            ${_("so2Pct","Sulfur Dioxide (SO2)","%","")}
            ${_("nh3Pct","Ammonia (NH3)","%","")}
          </div>

          <div style="height:8px"></div>
          <div class="label">Resonance & Rotation ${T(R["Resonance & Rotation"]||"")}</div>
          <div id="moonOrbitalSection">
            ${O("forcedEcc","Forced Eccentricity","","",0,.2,1e-4,"Forced Eccentricity")}
            <div class="form-row">
              <div>
                <div class="label">Resonance Group ${T(R["Resonance Group"]||"")}</div>
                <div class="hint">Manual mode only. Leave blank for auto.</div>
              </div>
              <input id="resonanceGroup" type="text" />
            </div>
            ${_("resonanceOrder","Resonance Order","","Manual mode only. Smaller numbers are closer in.")}
            ${_("resonanceRatio","Resonance Ratio","","Use 2 for a 2:1-style manual chain, 1.5 for 3:2, etc.")}
          </div>

          <div style="height:8px"></div>
          <div class="label">Surface & Habitability ${T(R["Surface & Habitability"]||"")}</div>
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
  `,n.appendChild(s),ca(s),va({steps:to,storageKey:"worldsmith.moon.tutorial",container:s,triggerBtn:s.querySelector("#moonTutorials")});let j=new Set,U=new MutationObserver(()=>{s.isConnected||(k.dispose(),U.disconnect())});U.observe(document.body,{childList:!0,subtree:!0});let J=s.querySelector("#moonSelect"),xe=s.querySelector("#moonNew"),Na=s.querySelector("#moonDelete"),Ce=s.querySelector("#moonPlanetSelect"),$a=s.querySelector("#context"),ce=s.querySelector("#name"),ke=s.querySelector("#a"),Ie=s.querySelector("#e"),Ee=s.querySelector("#inc"),Ae=s.querySelector("#m"),Re=s.querySelector("#density"),Ne=s.querySelector("#albedo"),$e=s.querySelector("#compOverride"),Te=s.querySelector("#initRot"),Ge=s.querySelector("#hydModePills"),He=s.querySelector("#atmModePills"),Fe=s.querySelector("#orbModePills"),Pt=s.querySelector("#hydModeHint"),wt=s.querySelector("#atmModeHint"),xt=s.querySelector("#orbModeHint"),Oe=s.querySelector("#wmf"),Le=s.querySelector("#salinity"),qe=s.querySelector("#ammonia"),de=s.querySelector("#differentiatedInterior"),De=s.querySelector("#isoModePills"),Ct=s.querySelector("#isoModeHint"),Be=s.querySelector("#radioAbundance"),_e=s.querySelector("#u238"),je=s.querySelector("#u235"),Ke=s.querySelector("#th232"),Ve=s.querySelector("#k40"),ze=s.querySelector("#manualPressure"),Ue=s.querySelector("#n2Pct"),We=s.querySelector("#o2Pct"),Ze=s.querySelector("#co2Pct"),Qe=s.querySelector("#arPct"),Xe=s.querySelector("#h2oPct"),Ye=s.querySelector("#ch4Pct"),Je=s.querySelector("#coPct"),et=s.querySelector("#h2Pct"),tt=s.querySelector("#hePct"),at=s.querySelector("#so2Pct"),ot=s.querySelector("#nh3Pct"),it=s.querySelector("#forcedEcc"),ee=s.querySelector("#resonanceGroup"),te=s.querySelector("#resonanceOrder"),ae=s.querySelector("#resonanceRatio"),Ta=s.querySelector("#moonCreateQuickBtn"),Ga=s.querySelector("#moonCreateGuidedBtn"),Ha=s.querySelector("#moonCreateRecipesBtn"),kt=s.querySelector("#moonHydrosphereSection"),It=s.querySelector("#moonAtmosphereSection"),Et=s.querySelector("#moonOrbitalSection"),At=s.querySelector("#moonIsoSimpleRows"),Rt=s.querySelector("#moonIsoAdvancedRows"),ue=s.querySelector("#kpis"),Fa=s.querySelector("#details"),oe=null,Nt={};F("a",ke,10,1e9,100,"auto"),F("e",Ie,0,.99,.001,"auto"),F("inc",Ee,0,180,.1,"auto"),F("m",Ae,1e-8,1e3,1e-8,"auto"),F("density",Re,.1,20,.01,"auto"),F("albedo",Ne,0,.95,.001,"auto"),F("initRot",Te,2,1e3,.1,"auto"),F("wmf",Oe,0,60,.1,"auto"),F("salinity",Le,0,35,.1,"auto"),F("ammonia",qe,0,30,.1,"auto"),F("radioAbundance",Be,.1,3,.01,"auto"),F("u238",_e,0,5,.01,"auto"),F("u235",je,0,5,.01,"auto"),F("th232",Ke,0,5,.01,"auto"),F("k40",Ve,0,5,.01,"auto"),F("manualPressure",ze,0,10,.01,"auto"),F("forcedEcc",it,0,.2,1e-4,"auto");function F(t,e,i,r,d,u){let c=s.querySelector(`#${t}_slider`),M=s.querySelector(`#${t}_min`),y=s.querySelector(`#${t}_max`);M.textContent=String(i),y.textContent=String(r),Nt[t]=aa({numberEl:e,sliderEl:c,min:i,max:r,step:d,mode:u,commitOnInput:!1,onChange:()=>K()})}function Oa(){for(let t of["a","e","inc","m","density","albedo","initRot","wmf","salinity","ammonia","radioAbundance","u238","u235","th232","k40","manualPressure","forcedEcc"])Nt[t]?.syncFromNumber({commit:!1,normalize:!0})}function $t(){let t=B(),e=Me(t);a.starMassMsol=Number(e?.massMsol),a.starAgeGyr=Number(e?.ageGyr),a.starMetallicityFeH=Number(e?.metallicityFeH)||0;let i=ge(e);a.starRadiusRsolOverride=i.r,a.starLuminosityLsolOverride=i.l,a.starTempKOverride=i.t,a.starEvolutionMode=i.ev;let r=X(t);a.moonId=r?.id||t.moons?.selectedId,a.moon={...r?.inputs||t.moon},a.moonName=r?.name||a.moon.name||"Luna",a.moonPlanetId=r?r.planetId??null:null,a.moonLocked=!!r?.locked;let d=Tt(t,a.moonPlanetId);a.parentType=d.type,d.type==="gasGiant"?(a.gasGiant=d.gasGiant,a.planet=null):(a.planet=d.inputs,a.gasGiant=null)}function Tt(t,e){let i=e==null?null:String(e);if(i){let r=Ut(t).find(u=>String(u.id)===i);if(r?.inputs)return{type:"planet",inputs:{...r.inputs}};let d=ne(t).find(u=>String(u.id)===i);if(d)return{type:"gasGiant",gasGiant:d}}return{type:"planet",inputs:{...t.planet}}}function La(t){let e=String(t?.companionClass||"").trim();return e?Dt(e):qt({massMjup:t?.massMjup})==="brownDwarf"?"brownDwarf":"gasGiant"}function nt(t){return Bt(La(t))}function me(t,e,i="core"){return t?.querySelector(`input[name="${e}"]:checked`)?.value||i}function pe(t,e,i,r="core"){let d=i||r;t?.querySelectorAll(`input[name="${e}"]`).forEach(u=>{u.checked=u.value===d})}function Gt(){let t=a.moon.hydrosphereMode||"core",e=a.moon.atmosphereMode||"core",i=a.moon.orbitalCouplingMode||"core",r=a.moon.radioisotopeMode||"simple";pe(Ge,"hydMode",t),pe(He,"atmMode",e),pe(Fe,"orbMode",i),pe(De,"isoMode",r,"simple"),Pt&&(Pt.textContent=t==="core"?"Compatibility heuristics.":t==="full"?"Inventory-driven moon water and ice solving.":"Direct water/interior inputs with computed outputs."),wt&&(wt.textContent=e==="core"?"Retained-volatile atmosphere only.":e==="full"?"Computed atmosphere plus stability diagnostics.":"Manual pressure and gas mix with stability checks."),xt&&(xt.textContent=i==="core"?"Single-moon treatment.":i==="full"?"Sibling resonance and tidal-HZ analysis.":"Manual resonance-chain controls enabled."),Ct&&(Ct.textContent=r==="advanced"?"Advanced isotope-by-isotope moon heat inputs.":"Single moon radiogenic-heat multiplier."),kt&&(kt.style.display=t==="core"?"none":""),It&&(It.style.display=e==="manual"?"":"none"),Et&&(Et.style.display=i==="core"?"none":""),At&&(At.style.display=t==="core"||r==="advanced"?"none":""),Rt&&(Rt.style.display=t==="core"||r!=="advanced"?"none":""),ee&&(ee.disabled=i!=="manual"),te&&(te.disabled=i!=="manual"),ae&&(ae.disabled=i!=="manual")}function qa(){return{name:ce.value||"New Moon",semiMajorAxisKm:Number(ke.value),eccentricity:Number(Ie.value),inclinationDeg:Number(Ee.value),massMoon:Number(Ae.value),densityGcm3:Number(Re.value),albedo:Number(Ne.value),compositionOverride:$e.value||null,initialRotationPeriodHours:Number(Te.value)||null,hydrosphereMode:me(Ge,"hydMode"),atmosphereMode:me(He,"atmMode"),orbitalCouplingMode:me(Fe,"orbMode"),waterMassFractionPct:Number(Oe.value)||null,salinityPct:Number(Le.value)||null,ammoniaPct:Number(qe.value)||null,differentiatedInterior:de.value==="yes"?!0:de.value==="no"?!1:null,radioisotopeMode:me(De,"isoMode","simple"),radioisotopeAbundance:Number(Be.value)||null,u238Abundance:Number(_e.value)||null,u235Abundance:Number(je.value)||null,th232Abundance:Number(Ke.value)||null,k40Abundance:Number(Ve.value)||null,manualSurfacePressureAtm:Number(ze.value)||null,n2Pct:Number(Ue.value)||0,o2Pct:Number(We.value)||0,co2Pct:Number(Ze.value)||0,arPct:Number(Qe.value)||0,h2oPct:Number(Xe.value)||0,ch4Pct:Number(Ye.value)||0,coPct:Number(Je.value)||0,h2Pct:Number(et.value)||0,hePct:Number(tt.value)||0,so2Pct:Number(at.value)||0,nh3Pct:Number(ot.value)||0,forcedEccentricity:Number(it.value)||null,manualResonanceGroupId:ee.value?.trim()||null,manualResonanceOrder:Number(te.value)||null,manualResonanceRatio:Number(ae.value)||null}}function he(t){let e=s.querySelector(".moon-float-note");e||(e=document.createElement("div"),e.className="moon-float-note",s.appendChild(e)),e.textContent=t,e.classList.add("is-visible"),oe&&clearTimeout(oe),oe=setTimeout(()=>{e.classList.remove("is-visible")},3200)}function st(t,{noticeLabel:e="Moon preset"}={}){let i=B(),r=X(i);if(!r)return null;let d=r.id,u=r.planetId??a.moonPlanetId??null,c=ie(i,{moonId:d,moonInputs:t,planetId:u}).model,M=String(c?.orbit?.semiMajorAxisGuard||"none"),y=Number(c?.inputs?.semiMajorAxisKm),w=Number(t.semiMajorAxisKm),v=Number.isFinite(y)?Math.round(y):w,A=M!=="none"&&Number.isFinite(v),G={...t,semiMajorAxisKm:A?v:w};return Pe(d,{inputs:G}),lt({moon:G}),A&&Math.abs(G.semiMajorAxisKm-w)>1e-9&&he(`${e} adjusted the semi-major axis to ${g(G.semiMajorAxisKm,0)} km to keep this moon inside the Moon Zone.`),Z(),W(),G}function Da(){let t=B(),e=Vt(t),i=e.filter(d=>d.moonParentKind==="planet"),r=e.filter(d=>d.moonParentKind==="gasGiant");xa(Ce,{planets:i,gasGiants:r,selectedValue:a.moonPlanetId,disabled:a.moonLocked,title:a.moonLocked?"This moon is locked to its current planet on the Planetary System tab.":""})}function Ba(){let t=B(),e=Se(t);Ca(J,e,t.moons.selectedId)}function _a(t,e,i){let r=Array.isArray(e?.operations)?e.operations:[];if(!r.length)return t;let d=(Array.isArray(t)?t:[]).map(u=>({...u,inputs:{...u?.inputs||{}}}));for(let u=0;u<r.length;u+=1){let c=r[u];if(!(!c||typeof c!="object"))if(c.type==="update"&&c.moonId){let M=d.findIndex(y=>y?.id===c.moonId);M>=0&&(d[M]={...d[M],name:c.name??d[M].name,planetId:c.planetId===void 0?d[M].planetId:c.planetId??null,inputs:{...d[M].inputs||{},...c.inputPatch||{}}})}else c.type==="create"&&c.inputs&&d.push({id:c.previewId||`preview-sibling-${u+1}`,name:c.name||c.inputs?.name||"Preview sibling",planetId:c.planetId===void 0?i??null:c.planetId??null,inputs:{...c.inputs||{}}})}return d}function ie(t,{moonId:e,moonInputs:i,planetId:r,parentPatch:d=null,siblingPatch:u=null}){let c=d?.assignMoonToParentId!=null?d.assignMoonToParentId:r,M=Tt(t,c),y=Se(t).filter(E=>(E.planetId??null)===(c??null)).map(E=>({...E,inputs:E.id===e?i:E.inputs})),w=_a(y,u,c),v=d?.parentKind==="gasGiant"&&M.type==="gasGiant"&&M.gasGiant?{...M,gasGiant:{...M.gasGiant,...d.inputPatch||{}}}:d?.parentKind==="planet"&&M.type==="planet"?{...M,inputs:{...M.inputs||{},...d.inputPatch||{}}}:M,A=Ra(t),G=v.type==="gasGiant"&&v.gasGiant?v.gasGiant:{id:c??null,hostFrameId:t.planets?.byId?.[c]?.hostFrameId||null},C=oo(t,G,A),h=C?.starConfig||{},b=C?.starModel,$=C?.hostFrame?.zones?.habitableZoneAu||b?.habitableZoneAu||null,N=we(C?.hostFrameId,A?.defaultHostFrameId),f=Number(C?.companionFluxEarth||0),o=Number(C?.companionXuvFluxEarth||0),L=Number(C?.fluxVariabilityFraction||0);if(v.type==="gasGiant"&&v.gasGiant){let E=fa({...v.gasGiant,orbitAu:Number(v.gasGiant.au)||5,starMassMsol:Number(h.massMsol)||1,starLuminosityLsol:Number(b?.luminosityLsol)||1,starAgeGyr:Number(h.ageGyr)||4.6,starRadiusRsol:Number(b?.radiusRsol)||1,hostFrameId:N,hostFrame:C?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:L,stellarMetallicityFeH:Number(h.metallicityFeH)||0,otherGiants:ne(t).filter(D=>D.id!==v.gasGiant.id&&we(D?.hostFrameId,A?.defaultHostFrameId)===N),moons:w.map(D=>D.inputs||{})}),S=Ma(E),H=vt({starMassMsol:Number(h.massMsol)||1,starAgeGyr:Number(h.ageGyr)||4.6,starMetallicityFeH:Number(h.metallicityFeH)||0,starRadiusRsolOverride:h.radiusRsolOverride??null,starLuminosityLsolOverride:h.luminosityLsolOverride??null,starTempKOverride:h.tempKOverride??null,starEvolutionMode:h.evolutionMode||"zams",starHabitableZoneAu:$,hostFrameId:N,hostFrame:C?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:L,parentKind:"gasGiant",parentOverride:S,moonEntries:w.length?w:[{id:e||"draft-moon",planetId:c,inputs:i}]});return{parentType:"gasGiant",parentOverride:S,parentInfo:{parentId:v.gasGiant.id||c||null,parentKind:"gasGiant",parentName:v.gasGiant.name||v.gasGiant.id||nt(v.gasGiant),parentClassLabel:nt(v.gasGiant),assigned:c!=null,orbitAu:Number(v.gasGiant.au)||Number(S.inputs.semiMajorAxisAu)||null,eccentricity:Number(v.gasGiant.eccentricity)||0,massEarth:Number(S.inputs.massEarth)||null,massMjup:Number(v.gasGiant.massMjup)||null,rotationPeriodHours:Number(v.gasGiant.rotationPeriodHours)||null,siblingCount:Math.max(w.length-(e?1:0),0),starHabitableZoneAu:$||null,hostFrameId:N},contextText:`Host frame: ${C?.hostFrame?.label||"Primary star"}
Parent: ${v.gasGiant.name||v.gasGiant.id} (${nt(v.gasGiant).toLowerCase()})
Parent orbit: ${g(S.inputs.semiMajorAxisAu,3)} AU
${f>5e-4?`Companion flux: ${g(f,3)}x Earth
`:""}${L>.001?`Flux variability: ${g(L*100,1)}%`:"Flux variability: low"}`,model:H.find(D=>D.raw.id===e)?.model||H.find(D=>D.raw.inputs===i)?.model||H[0]?.model||dt({starMassMsol:Number(h.massMsol)||1,starAgeGyr:Number(h.ageGyr)||4.6,starMetallicityFeH:Number(h.metallicityFeH)||0,starRadiusRsolOverride:h.radiusRsolOverride??null,starLuminosityLsolOverride:h.luminosityLsolOverride??null,starTempKOverride:h.tempKOverride??null,starEvolutionMode:h.evolutionMode||"zams",hostFrameId:N,hostFrame:C?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:L,moon:i,parentOverride:S})}}let q=v.inputs||{...t.planet},V=Kt({starMassMsol:Number(h.massMsol)||1,starAgeGyr:Number(h.ageGyr)||4.6,starMetallicityFeH:Number(h.metallicityFeH)||0,starRadiusRsolOverride:h.radiusRsolOverride??null,starLuminosityLsolOverride:h.luminosityLsolOverride??null,starTempKOverride:h.tempKOverride??null,starEvolutionMode:h.evolutionMode||"zams",hostFrameId:N,hostFrame:C?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:L,planet:q,moons:w.map(E=>E.inputs||{}),gasGiants:ne(t).filter(E=>we(E?.hostFrameId,A?.defaultHostFrameId)===N).map(E=>({name:E.name,au:E.au}))}),z=ga(V),Q=vt({starMassMsol:Number(h.massMsol)||1,starAgeGyr:Number(h.ageGyr)||4.6,starMetallicityFeH:Number(h.metallicityFeH)||0,starRadiusRsolOverride:h.radiusRsolOverride??null,starLuminosityLsolOverride:h.luminosityLsolOverride??null,starTempKOverride:h.tempKOverride??null,starEvolutionMode:h.evolutionMode||"zams",starHabitableZoneAu:$,hostFrameId:N,hostFrame:C?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:L,parentKind:"planet",parentOverride:z,moonEntries:w.length?w:[{id:e||"draft-moon",planetId:c,inputs:i}]});return{parentType:"planet",parentOverride:z,parentInfo:{parentId:c??null,parentKind:"planet",parentName:c&&t.planets.byId?.[c]?.name||"Planet",assigned:c!=null,orbitAu:Number(q.semiMajorAxisAu)||Number(z.inputs.semiMajorAxisAu)||null,eccentricity:Number(q.eccentricity)||0,massEarth:Number(q.massEarth)||Number(z.inputs.massEarth)||null,massMjup:null,rotationPeriodHours:Number(q.rotationPeriodHours)||null,siblingCount:Math.max(w.length-(e?1:0),0),starHabitableZoneAu:$||null,hostFrameId:N},contextText:`Host frame: ${C?.hostFrame?.label||"Primary star"}
Planet Mass: ${g(q.massEarth,3)} MEarth
Planet orbit: ${g(q.semiMajorAxisAu,3)} AU
${f>5e-4?`Companion flux: ${g(f,3)}x Earth
`:""}${L>.001?`Flux variability: ${g(L*100,1)}%`:"Flux variability: low"}`,model:Q.find(E=>E.raw.id===e)?.model||Q.find(E=>E.raw.inputs===i)?.model||Q[0]?.model||dt({starMassMsol:Number(h.massMsol)||1,starAgeGyr:Number(h.ageGyr)||4.6,starMetallicityFeH:Number(h.metallicityFeH)||0,starRadiusRsolOverride:h.radiusRsolOverride??null,starLuminosityLsolOverride:h.luminosityLsolOverride??null,starTempKOverride:h.tempKOverride??null,starEvolutionMode:h.evolutionMode||"zams",hostFrameId:N,hostFrame:C?.hostFrame||null,companionFluxEarth:f,companionXuvFluxEarth:o,fluxVariabilityFraction:L,planet:q,moon:i})}}function W(){$t();let t=ie(B(),{moonId:a.moonId,moonInputs:a.moon,planetId:a.moonPlanetId});$a.textContent=t.contextText;let e=t.model,i=oa(e),r=e.habitability?.earthSimilarityBreakdown||{},d=e.habitability?.breakdown||{},u=e.biosphere||{},c=e.geology||{},M=e.display.surfaceBiosphere.includes("Surface sterile")?"Sterile":e.display.surfaceBiosphere.includes("Marginal")?"Marginal":e.display.surfaceBiosphere.includes("Microbial")?"Microbial":e.display.surfaceBiosphere.includes("Simple")?"Simple":e.display.surfaceBiosphere.includes("Complex")?"Complex":e.display.surfaceBiosphere,y=e.atmosphere?.dominantSpecies?`${e.atmosphere.dominantSpecies}-dominant`:"None",w=c.resurfacingDominantProcess==="volcanic"?"Volcanic":c.resurfacingDominantProcess==="cryovolcanic"?"Cryovolcanic":c.resurfacingDominantProcess==="mixed"?"Mixed":"Quiet",v=u.limitingFactors?.length?`${u.limitingFactors.length} blocker${u.limitingFactors.length===1?"":"s"}`:"Clear",A=e.display.orbitalFate.startsWith("Roche limit")?"Inward decay":e.display.orbitalFate.startsWith("Escape")?"Outward drift":"Stable",G=d.solventPolicyVersion||"surface-plus-subsurface-water-v1",C=G==="surface-subsurface-plus-alt-solvents-v1"?"surface + subsurface + alt solvents":G==="surface-plus-subsurface-water-v1"?"surface + subsurface water":"surface water only",h=e.habitability?.summary||{},b=h.surfaceExomoonCalibration||{},$=b.applicable===!0?[b.starClassBand,b.hostGiantFavorability?.label,`Moon ${g(b.moonMassEarth??0,3)} MEarth vs floor ${g(b.moonMassFloorEarth??0,3)} MEarth`,b.spinStateBenefit?.label,...b.notes||[]].filter(Boolean).join(`
`):"Applied only to exposed-surface, atmosphere-bearing moons around cool-star giant-planet systems.",N=e.spinState?.climateNote||e.tides?.spinState?.climateNote||"",f=[h.gates?.stellarZone?.label,h.gates?.stableOrbit?.label,h.gates?.energyBudget?.label,h.gates?.atmosphereRetention?.label,h.gates?.radiationShielding?.label].filter(Boolean).join(`
`),o=(S,H,D="",Y={})=>({label:S,tip:R[S]||"",value:H,meta:D,kpiClass:`kpi--compact ${Y.kpiClass||""}`.trim(),...Y}),L=`Substrate ${g(d.substrate??0,2)} | Solvent ${g(d.solvent??0,2)} | Energy ${g(d.energy??0,2)} | Chemistry ${g(d.chemistry??0,2)} | Stability ${g(d.stabilityMultiplier??0,2)} | Radiation ${g(d.radiationMultiplier??0,2)} | Persistence ${g(d.persistenceMultiplier??0,2)}
Pathway ${d.solventPathway||"none"} | ${C}
${e.habitability?.habitabilityModelVersion||"phi-unified-v2"} | ${G}`,q=ue.querySelector(".moon-preview-canvas"),V=S=>({...S,collapsible:!0,open:!1}),z=no({moonName:a.moonName||a.moon.name,model:e,moonProfile:i,compactLifeLimits:v,compactOrbitalFate:A}),Q=[{id:"moon-summary",title:"Key Numbers",items:[{kind:"preview",label:"Appearance",tip:R.Appearance||"",canvasClass:"moon-preview-canvas",metaChildren:[i.displayClass," \u2014 ",i.terrain.type.replace("-"," ")]},o("Composition",e.display.compositionClass),o("Radius",e.display.radius,"derived"),o("Surface Temp",e.display.surfaceTemp),o("Hydrosphere",e.display.hydrosphereState),o("Atmosphere",e.display.atmosphereClass,e.display.atmosphereSource),o("Life Class",e.display.lifeClass,e.display.habitabilityGates),o("Habitability Index",e.display.habitabilityIndex,L)]},V({id:"moon-identity",title:"Identity & Class",density:"compact",items:[o("Composition",e.display.compositionClass),o("Albedo",g(a.moon.albedo,3))]}),V({id:"moon-physical",title:"Physical State",density:"compact",items:[o("Mass",`${g(a.moon.massMoon,3)} M\u263E`),o("Density",`${g(a.moon.densityGcm3,2)} g/cm\xB3`),o("Radius",e.display.radius,"derived"),o("Gravity",e.display.gravity),o("Escape Velocity",e.display.esc)]}),V({id:"moon-environment",title:"Environment",density:"compact",items:[o("Atmosphere",e.display.atmosphereClass,e.display.atmosphereSource),o("Surface Pressure",e.display.surfacePressure),o("Atmosphere Mix",y,e.display.atmosphereComposition),o("Greenhouse Warming",e.display.greenhouseWarming),o("Atmosphere Stability",e.display.atmosphereStability,e.display.atmosphereLoss),o("Atmosphere Lifetime",e.display.atmosphereLifetime),o("Atmosphere Haze",e.display.atmosphereHaze),o("Atmosphere Clouds",e.display.atmosphereClouds),o("Hydrosphere",e.display.hydrosphereState),o("Surface Ices",e.display.surfaceIces),o("Surface Water",e.display.surfaceWater),o("Subsurface Ocean",e.display.subsurfaceOcean),o("Ocean Depth",e.display.oceanDepth),o("Ice Shell",e.display.iceShell),o("High-Pressure Ice",e.display.highPressureIce,e.display.oceanPhaseDiagnostics),o("Interior Structure",e.display.interiorStructure),o("Ocean Chemistry",e.display.oceanChemistry),o("Equilibrium Temp",e.display.equilibriumTemp),o("Climate State",e.display.climateState),o("Collapse State",e.display.collapseState),o("Surface Temp Range",e.display.surfaceTempRange),o("Day/Night Contrast",e.display.dayNightContrast),o("Nightside Min",e.display.nightsideMin),o("Climate Zones",e.display.climateZones,e.display.climateZoneSummary),o("Seasonality",e.display.seasonality)]}),V({id:"moon-system",title:"System Context",density:"compact",items:[o("Orbital Period (sidereal)",e.display.sidereal),o("Orbital Period (synodic)",e.display.synodic),o("Rotation Period",e.display.rot),o("Spin State",e.display.spinState,N),o("Initial Rotation Period",e.display.initialRot),o("Planetshine",e.display.planetshine),o("Eclipse Cooling",e.display.eclipseCooling),o("Nearest Resonance",e.display.nearestResonance),o("Laplace Status",e.display.laplaceStatus),o("Forced Eccentricity",e.display.forcedEccentricity),o("Migration Trend",e.display.migrationTrend),o("Tidal HZ",e.display.tidalHabitableZone),o("Formation",e.display.formation),o("Orbital Recession",e.display.recession),o("Orbital Fate",A,A==="Stable"?"No strong inward decay or outward escape trend is currently predicted":e.display.orbitalFate)]}),V({id:"moon-activity",title:"Activity & Radiation",density:"compact",items:[o("Total Tidal Force",e.display.tides),o("Moon Contribution",e.display.moonPct),o("Star Contribution",e.display.starPct),o("Tidal Heating",e.display.tidalHeating,e.display.tidalHeatingTotal),o("Tidal Heating (\xD7 Earth)",e.display.tidalHeatingXEarth),o("Volcanic Activity",e.display.volcanicActivity,`score ${g(c.volcanicActivityScore??0,2)}`),o("Cryovolcanism",e.display.cryovolcanicActivity,`score ${g(c.cryovolcanicActivityScore??0,2)}`),o("Resurfacing",w,`${e.display.resurfacing}
${c.resurfacingDominantProcess==="none"?"No dominant resurfacing driver":`${c.resurfacingDominantProcess||"mixed"}-driven`}`),o("Volatile Supply",e.display.volatileReplenishment,`score ${g(c.volatileReplenishmentScore??0,2)}`),o("Ocean Persistence",e.display.oceanPersistence,`score ${g(c.oceanPersistenceScore??0,2)}`),o("Radiogenic Heating",e.display.radiogenicHeating),o("Magnetosphere Dose",e.display.magnetosphericRad,e.display.magnetosphericLabel),o("Surface Radiation",e.display.surfaceRadiation),o("Magnetic Shielding",e.display.magneticShielding)]}),V({id:"moon-habitability",title:"Habitability",density:"compact",items:[o("Life Class",e.display.lifeClass,e.display.habitabilityGates),o("Habitability Index",e.display.habitabilityIndex,L),o("Earth Similarity Index",e.display.earthSimilarityIndex,`Radius ${g(r.radius??0,2)} | Density ${g(r.density??0,2)} | Escape ${g(r.escapeVelocity??0,2)} | Temp ${g(r.surfaceTemp??0,2)}`),o("Surface Habitability",e.display.surfaceHabitability,h.gates?.radiationShielding?.label||""),o("Surface Exomoon Calibration",e.display.surfaceExomoonCalibration,$),o("Subsurface Habitability",e.display.subsurfaceHabitability),o("Habitability Gates",e.display.habitabilityGates,f),o("Biosphere",M,`${e.display.surfaceBiosphere}
Score ${g(u.surfaceBiologyScore??0,2)}`),o("Plant Life",e.display.plantLife),o("Vegetation",e.biosphere?.vegetationEligible?"Yes":"No",e.display.vegetation==="Supported"?"Surface vegetation is supported by the current biosphere gate":e.display.vegetationNote),o("Life Limits",v,e.display.biosphereLimits),...e.biosphere?.vegetationEligible?[o("Veg Colours","Available",`${e.display.vegetationColours}
${e.display.vegetationNote}`)]:[]]})];ka(ue,Q),Ia(ue,z);let E=ue.querySelector(".moon-preview-canvas");q&&E&&q!==E&&(E.replaceWith(q),E=q),E&&i?k.attach(E,{bodyType:"moon",name:a.moonName||a.moon.name||"Moon",recipeId:String(a.moon?.appearanceRecipeId||""),moonProfile:i,moonCalc:e,rotationPeriodDays:Number(e?.orbit?.rotationPeriodDays)||Number(e?.orbit?.periodSiderealDays)||27.3}):k.detach(),Ea(Fa,[{id:"moon-details-identity",title:"Identity & Class",items:[{label:"Name",value:a.moonName||a.moon.name||"Moon"},{label:"Composition",value:e.display.compositionClass},{label:"Albedo",value:g(a.moon.albedo,3)}]},{id:"moon-details-physical",title:"Physical State",items:[{label:"Mass",value:`${g(a.moon.massMoon,3)} M\u263E`},{label:"Density",value:`${g(a.moon.densityGcm3,2)} g/cm\xB3`},{label:"Radius",value:e.display.radius},{label:"Gravity",value:e.display.gravity},{label:"Escape Velocity",value:e.display.esc}]},{id:"moon-details-environment",title:"Environment",items:[{label:"Atmosphere",value:e.display.atmosphereClass,meta:e.display.atmosphereSource},{label:"Surface Pressure",value:e.display.surfacePressure},{label:"Atmosphere Mix",value:y,meta:e.display.atmosphereComposition},{label:"Greenhouse Warming",value:e.display.greenhouseWarming},{label:"Atmosphere Stability",value:e.display.atmosphereStability,meta:e.display.atmosphereLoss},{label:"Atmosphere Lifetime",value:e.display.atmosphereLifetime},{label:"Atmosphere Haze",value:e.display.atmosphereHaze},{label:"Atmosphere Clouds",value:e.display.atmosphereClouds},{label:"Hydrosphere",value:e.display.hydrosphereState},{label:"Surface Water",value:e.display.surfaceWater},{label:"Subsurface Ocean",value:e.display.subsurfaceOcean},{label:"Ocean Depth",value:e.display.oceanDepth},{label:"Ice Shell",value:e.display.iceShell},{label:"High-Pressure Ice",value:e.display.highPressureIce,meta:e.display.oceanPhaseDiagnostics},{label:"Interior Structure",value:e.display.interiorStructure},{label:"Ocean Chemistry",value:e.display.oceanChemistry},{label:"Climate State",value:e.display.climateState},{label:"Collapse State",value:e.display.collapseState},{label:"Day/Night Contrast",value:e.display.dayNightContrast},{label:"Nightside Min",value:e.display.nightsideMin},{label:"Climate Zones",value:e.display.climateZones,meta:e.display.climateZoneSummary},{label:"Seasonality",value:e.display.seasonality}]},{id:"moon-details-system",title:"System Context",items:[{label:"Moon Zone (Inner)",value:e.display.zoneInner},{label:"Moon Zone (Outer)",value:e.display.zoneOuter},{label:"Periapsis",value:e.display.peri},{label:"Apoapsis",value:e.display.apo},{label:"Orbital Direction",value:e.orbit.orbitalDirection},{label:"Orbital Period (sidereal)",value:e.display.sidereal},{label:"Orbital Period (synodic)",value:e.display.synodic},{label:"Rotation Period",value:e.display.rot},{label:"Spin State",value:e.display.spinState,meta:N},{label:"Initial Rotation Period",value:e.display.initialRot},{label:"Planetshine",value:e.display.planetshine},{label:"Eclipse Cooling",value:e.display.eclipseCooling},{label:"Nearest Resonance",value:e.display.nearestResonance},{label:"Laplace Status",value:e.display.laplaceStatus},{label:"Forced Eccentricity",value:e.display.forcedEccentricity},{label:"Migration Trend",value:e.display.migrationTrend},{label:"Tidal HZ",value:e.display.tidalHabitableZone},{label:"Formation",value:e.display.formation},{label:"Orbital Recession",value:e.display.recession},{label:"Orbital Fate",value:e.display.orbitalFate},{label:"Moon locked to Planet",value:e.display.moonLocked},{label:"Planet locked to Moon",value:e.display.planetLockedMoon},{label:"Planet locked to Star",value:e.display.planetLockedStar},{label:"Lock time (Moon\u2192Planet)",value:e.display.tMoonLock},{label:"Lock time (Planet\u2192Moon)",value:e.display.tPlanetMoon},{label:"Lock time (Planet\u2192Star)",value:e.display.tPlanetStar}]},{id:"moon-details-activity",title:"Activity & Radiation",items:[{label:"Total Tidal Force",value:e.display.tides},{label:"Moon Contribution",value:e.display.moonPct},{label:"Star Contribution",value:e.display.starPct},{label:"Tidal Heating",value:e.display.tidalHeating,meta:e.display.tidalHeatingTotal},{label:"Tidal Heating (\xD7 Earth)",value:e.display.tidalHeatingXEarth},{label:"Volcanic Activity",value:e.display.volcanicActivity,meta:`score ${g(c.volcanicActivityScore??0,2)}`},{label:"Cryovolcanism",value:e.display.cryovolcanicActivity,meta:`score ${g(c.cryovolcanicActivityScore??0,2)}`},{label:"Resurfacing",value:w,meta:c.resurfacingDominantProcess==="none"?"No dominant resurfacing driver":`${c.resurfacingDominantProcess||"mixed"}-driven`},{label:"Volatile Supply",value:e.display.volatileReplenishment,meta:`score ${g(c.volatileReplenishmentScore??0,2)}`},{label:"Ocean Persistence",value:e.display.oceanPersistence,meta:`score ${g(c.oceanPersistenceScore??0,2)}`},{label:"Radiogenic Heating",value:e.display.radiogenicHeating},{label:"Magnetosphere Dose",value:e.display.magnetosphericRad,meta:e.display.magnetosphericLabel},{label:"Surface Radiation",value:e.display.surfaceRadiation},{label:"Magnetic Shielding",value:e.display.magneticShielding}]},{id:"moon-details-habitability",title:"Habitability",items:[{label:"Life Class",value:e.display.lifeClass,meta:e.display.habitabilityGates},{label:"Habitability Index",value:e.display.habitabilityIndex,meta:L.replace(/\n/g," | ")},{label:"Earth Similarity Index",value:e.display.earthSimilarityIndex,meta:`Radius ${g(r.radius??0,2)} | Density ${g(r.density??0,2)} | Escape ${g(r.escapeVelocity??0,2)} | Temp ${g(r.surfaceTemp??0,2)}`},{label:"Surface Habitability",value:e.display.surfaceHabitability,meta:h.gates?.radiationShielding?.label||""},{label:"Surface Exomoon Calibration",value:e.display.surfaceExomoonCalibration,meta:$.replace(/\n/g," | ")},{label:"Subsurface Habitability",value:e.display.subsurfaceHabitability},{label:"Habitability Gates",value:e.display.habitabilityGates,meta:f.replace(/\n/g," | ")},{label:"Biosphere",value:e.display.surfaceBiosphere,meta:`Score ${g(u.surfaceBiologyScore??0,2)}`},{label:"Plant Life",value:e.display.plantLife},{label:"Vegetation",value:e.display.vegetation,meta:e.display.vegetationNote},{label:"Life Limits",value:v,meta:e.display.biosphereLimits},...e.biosphere?.vegetationEligible?[{label:"Veg Colours",value:e.display.vegetationColours,meta:e.display.vegetationNote}]:[]]}],{title:"Derived Details"})}function Z(){$t(),Ba(),Da(),ce.value=a.moonName,ke.value=a.moon.semiMajorAxisKm,Ie.value=a.moon.eccentricity,Ee.value=a.moon.inclinationDeg,Ae.value=a.moon.massMoon,Re.value=a.moon.densityGcm3,Ne.value=a.moon.albedo,$e.value=a.moon.compositionOverride||"",Te.value=a.moon.initialRotationPeriodHours||12,Oe.value=a.moon.waterMassFractionPct??0,Le.value=a.moon.salinityPct??0,qe.value=a.moon.ammoniaPct??0,de.value=a.moon.differentiatedInterior===!0?"yes":a.moon.differentiatedInterior===!1?"no":"",Be.value=a.moon.radioisotopeAbundance??1,_e.value=a.moon.u238Abundance??1,je.value=a.moon.u235Abundance??1,Ke.value=a.moon.th232Abundance??1,Ve.value=a.moon.k40Abundance??1,ze.value=a.moon.manualSurfacePressureAtm??0,Ue.value=a.moon.n2Pct??0,We.value=a.moon.o2Pct??0,Ze.value=a.moon.co2Pct??0,Qe.value=a.moon.arPct??0,Xe.value=a.moon.h2oPct??0,Ye.value=a.moon.ch4Pct??0,Je.value=a.moon.coPct??0,et.value=a.moon.h2Pct??0,tt.value=a.moon.hePct??0,at.value=a.moon.so2Pct??0,ot.value=a.moon.nh3Pct??0,it.value=a.moon.forcedEccentricity??0,ee.value=a.moon.manualResonanceGroupId||"",te.value=a.moon.manualResonanceOrder??"",ae.value=a.moon.manualResonanceRatio??"",Oa(),Gt()}let rt=!1;function K(){if(rt)return;rt=!0;let t=B(),e=t.moons.selectedId,i=ce.value||"New Moon",r=Ce.value||null,d=qa(),u=ie(t,{moonId:e,moonInputs:d,planetId:r}).model,c=String(u?.orbit?.semiMajorAxisGuard||"none"),M=Number(u?.inputs?.semiMajorAxisKm),y=Number(d.semiMajorAxisKm),w=Number.isFinite(M)?Math.round(M):y,v=c!=="none"&&Number.isFinite(w),A={...d,semiMajorAxisKm:v?w:y};Pe(e,{name:i,inputs:A}),Jt(e,r),lt({moon:A}),v&&Math.abs(A.semiMajorAxisKm-y)>1e-9&&he(`Semi-Major Axis adjusted to ${g(A.semiMajorAxisKm,0)} km to keep this moon within the Moon Zone.`),Z(),W(),rt=!1}ce.addEventListener("change",K),$e.addEventListener("change",K),Ce.addEventListener("change",K),de.addEventListener("change",K),ee.addEventListener("change",K),te.addEventListener("change",K),ae.addEventListener("change",K),[Ge,He,Fe,De].forEach(t=>{t?.addEventListener("change",()=>{K(),Gt()})}),[Ue,We,Ze,Qe,Xe,Ye,Je,et,tt,at,ot].forEach(t=>{t?.addEventListener("change",K)}),J.addEventListener("change",()=>{Zt(J.value),Z(),W()}),xe.addEventListener("click",t=>{t.preventDefault();let e=B(),i=X(e)?.inputs||e.moon;Qt(i,{name:"New Moon",planetId:e.planets.selectedId}),Z(),W()}),Na.addEventListener("click",async t=>{t.preventDefault();let e=B();if(e.moons.order.length<=1)return;let i=Yt(e.moons.selectedId,e);!i||!await ua(i)||(Xt(e.moons.selectedId),Z(),W())}),Ta?.addEventListener("click",()=>{ve()}),Ga?.addEventListener("click",()=>{fe()}),Ha?.addEventListener("click",()=>{Qa(t=>{st(Pa(t.apply,t.id),{noticeLabel:t.label||"Moon recipe"})})}),s.querySelector("#btn-default").addEventListener("click",()=>{a.moon={name:"Luna",semiMajorAxisKm:384748,eccentricity:.055,inclinationDeg:5.15,massMoon:1,densityGcm3:3.34,albedo:.11,initialRotationPeriodHours:null};let t=B();Pe(t.moons.selectedId,{name:a.moon.name||"Luna",inputs:a.moon}),Z(),W()});let Ht=Object.freeze([{id:"type",label:"Goal"},{id:"parent-context",label:"Setup"},{id:"goal-details",label:"Traits"},{id:"recommendation",label:"Recommendation"}]);function ja(t){let e=Ht.findIndex(i=>i.id===String(t||""));return e>=0?e:0}function Ft(){let t=B(),e=X(t),i=e?.id||a.moonId,r=e?.planetId??a.moonPlanetId??null,d=e?.inputs||a.moon,u=ie(t,{moonId:i,moonInputs:d,planetId:r}),c=u.parentInfo?.parentClassLabel?`Current ${String(u.parentInfo.parentClassLabel).toLowerCase()} system`:"Current giant companion system",M=u.parentInfo?.assigned===!1?"No assigned parent":u.parentType==="gasGiant"?c:"Current planet system",y=u.parentInfo?.assigned===!1?`${u.contextText}
Moon is currently unassigned. Assign it to a planet or giant companion before using strict guided fitting.`:u.contextText;return{currentMoonId:i,currentMoonName:a.moonName||a.moon.name||"Moon",currentInputs:{...d||{}},currentOrbitWindowKm:{inner:Number(u.model?.orbit?.zoneInnerKm??u.model?.orbit?.moonZoneInnerKm)||null,outer:Number(u.model?.orbit?.zoneOuterKm??u.model?.orbit?.moonZoneOuterKm)||null},siblingEntries:Se(t).filter(w=>w?.id!==i&&(w?.planetId??null)===(r??null)),currentContextLabel:M,currentContextText:y,parentContext:u.parentInfo||null,starHabitableZoneAu:u.parentInfo?.starHabitableZoneAu||null,recipeCatalog:se,solveMoonInputs:(w,v={})=>{let A=B(),G=X(A);return ie(A,{moonId:G?.id||i,moonInputs:w,planetId:G?.planetId??r,parentPatch:v.parentPatch||null,siblingPatch:v.siblingPatch||null})}}}function Ka(t,e=[]){return pa(t,e)}function Va(t,e,i,r){return ha(t,e,i,r)}function za(t,e){return ya(t,e,{objectType:"moon",objectLabel:"moon"})}function Ua(t){return ba(t,{readyDetail:"The structured goal is valid. Run Search to try seeded moon candidates.",searchingDetail:"Trying seeded moon candidates against the current parent context.",completeDetail:"Review the result, diagnostics, and context adjustments before applying.",completeTitleWithoutResult:"Ready to search"})}function ye(){let t=B(),e=X(t);return{objectKey:e?.id||"",contextFingerprint:la({moonId:e?.id||"",planetId:e?.planetId||null,inputs:e?.inputs||null})}}function be(t,e,i=""){let r=e==null||e===""||typeof e=="number"&&!Number.isFinite(e)?"n/a":String(e);return x("div",{className:"moon-guided-preview__metric"},[x("div",{className:"moon-guided-preview__metric-label",text:t}),x("div",{className:"moon-guided-preview__metric-value",text:r}),i?x("div",{className:"moon-guided-preview__metric-meta",text:i}):null])}function Ot(t){let e=t?.previewPayload?.moonCalc;if(!e)return null;let i=(t?.contextAdjustments||[]).join(" "),r=!!t?.applyPayload?.parentPatch,d=!!t?.applyPayload?.siblingPatch;return x("div",{className:"moon-guided-preview"},[x("div",{className:"moon-guided-preview__title",text:r&&d?"Solved preview after applying the recommended host and moon-system fixes":r?"Solved preview after applying the recommended host fixes":d?"Solved preview after applying the recommended moon-system fixes":"Solved preview in the current host context"}),x("div",{className:"moon-guided-preview__grid"},[be("Hydrosphere",e.display?.hydrosphereState),be("Atmosphere",e.display?.atmosphereClass,e.display?.surfacePressure),be("Climate",e.display?.climateState),be("Biosphere",e.display?.surfaceBiosphere,e.display?.vegetation)]),i?x("div",{className:"moon-guided-preview__summary",text:i}):null])}function Wa(t){if(!t||!t.parentId||!t.parentKind)return!1;if(t.parentKind==="planet")return Wt(t.parentId,{inputs:{...t.inputPatch||{}}}),!0;if(t.parentKind==="gasGiant"){let e=ne().map(i=>i.id===t.parentId?{...i,...t.inputPatch||{}}:i);return ta(e),!0}return!1}function Za(t,{noticeLabel:e="Guided moon"}={}){let i=Wa(t?.applyPayload?.parentPatch||null),r=ea(t?.applyPayload?.siblingPatch||null,{preserveSelectedMoonId:B().moons?.selectedId||null});return{appliedInputs:st(t?.applyPayload?.objectInputs||{},{noticeLabel:e}),parentPatched:i,parentPatchSummary:t?.applyPayload?.parentPatch?.summary||"",siblingPatched:!!r?.changed,siblingPatchSummary:t?.applyPayload?.siblingPatch?.summary||"",siblingPatchCreatedCount:r?.createdMoonIds?.length||0,siblingPatchUpdatedCount:r?.updatedMoonIds?.length||0}}function ve(t=null,e=""){let i=ft(),r=Ft(),d=ye(),{overlayEl:u,contentEl:c,closeButtonEl:M}=Mt(),y=null;function w(C=!1){y?.cancelSearch?.("overlay-closed"),j.delete(A),C||ht("moon"),u.remove(),document.removeEventListener("keydown",G)}function v(){w(!1),e&&location.hash!==e&&(location.hash=e)}let A=()=>w(!0);function G(C){C.key==="Escape"&&v()}y=yt({adapter:i,context:r,initialState:{objectType:"moon",uxMode:"quick",selectedArchetypeId:t?.selectedArchetypeId||"",answers:t?.answers||{}},onUpdate:({state:C,archetypes:h,questions:b,recommendation:$})=>{let N=bt({title:"Moon Quick Types",subtitle:"Pick a defensible starting point. Each option maps to an engine-backed moon preset and is re-solved in the current parent context.",archetypes:(h||[]).filter(f=>f?.quickEnabled!==!1),selectedArchetypeId:C.selectedArchetypeId||"",questions:b,answers:C.answers,recommendation:$,previewContent:Ot($),actions:[{id:"apply",label:$?.diagnostics?.some(f=>f?.severity==="warning")?"Apply Starting Point":"Apply Quick Type",disabled:!$}],onArchetypeSelect:f=>y?.selectArchetype(f),onQuestionChange:(f,o)=>y?.setAnswer(f,o),onAction:f=>{f!=="apply"||!$||(y?.apply({applyMoonInputs:o=>st(o,{noticeLabel:$.title||"Moon quick type"})}),v())}});c.replaceChildren(N),mt("moon",{...d,uxMode:"quick",...ut(C)})}}),j.add(A),M.addEventListener("click",v),u.addEventListener("click",C=>{C.target===u&&v()}),document.addEventListener("keydown",G),document.body.appendChild(u)}function fe(t=null,e=""){let i=ft(),r=Ft(),d=ye(),{overlayEl:u,contentEl:c,closeButtonEl:M}=Mt(),y=null;function w(b=!1){y?.cancelSearch?.("overlay-closed"),j.delete(A),b||ht("moon"),u.remove(),document.removeEventListener("keydown",G)}function v(){w(!1),e&&location.hash!==e&&(location.hash=e)}let A=()=>w(!0);function G(b){b.key==="Escape"&&v()}function C(b,$=[]){let N=String(b?.currentStepId||"type");return N==="type"?"parent-context":N==="parent-context"&&$.some(f=>f?.stepId==="goal-details")?"goal-details":"recommendation"}function h(b){let $=String(b?.currentStepId||"type");return $==="recommendation"?(b?.questions||[]).some(N=>N?.stepId==="goal-details")?"goal-details":"parent-context":$==="goal-details"?"parent-context":"type"}y=yt({adapter:i,context:r,searchMode:"manual",initialState:{objectType:"moon",uxMode:"guided",currentStepId:t?.currentStepId||"type",selectedArchetypeId:t?.selectedGoalTemplateId||"",selectedGoalTemplateId:t?.selectedGoalTemplateId||"",goalDraft:t?.goalDraft||{},compiledGoal:t?.compiledGoal||null,searchStatus:t?.searchStatus||"idle",lastSearchResult:t?.lastSearchResult||null,lastSearchContextFingerprint:t?.lastSearchContextFingerprint||"",lastSearchEngineFingerprint:t?.lastSearchEngineFingerprint||""},onUpdate:({state:b,archetypes:$,questions:N,recommendation:f})=>{let o=String(b.currentStepId||"type"),L=ja(o),q=(N||[]).filter(S=>String(S?.stepId||"goal-details")===o),V=Ka(b,q),z=(N||[]).some(S=>S?.stepId==="goal-details"),Q=Ht.map((S,H)=>({...S,disabled:S.id!=="type"&&!b.selectedGoalTemplateId||S.id==="goal-details"&&!z||S.id==="recommendation"&&(!b.selectedGoalTemplateId||H>L+1)})),E=bt({title:"Moon Goal Builder",subtitle:"Choose the moon outcome you want, set scope and search budget, then compile and run a seeded goal search before applying the recommendation.",steps:Q,currentStepId:o,archetypes:($||[]).filter(S=>S?.guidedEnabled!==!1),selectedArchetypeId:b.selectedGoalTemplateId||"",typeSupplement:o==="type"?za(()=>y,b):null,questions:q,answers:V,recommendation:f,status:o==="recommendation"?Ua(b):null,previewContent:o==="recommendation"?Ot(f):null,visibleSections:{type:o==="type",questions:o==="parent-context"||o==="goal-details",status:o==="recommendation",recommendation:o==="recommendation",diagnostics:o==="recommendation"},typeSectionTitle:"Moon Goal",questionSectionTitle:o==="parent-context"?"Search Setup":"Goal Traits",recommendationSectionTitle:"Best Moon Fit",diagnosticSectionTitle:"Search Diagnostics",actions:[...o!=="type"?[{id:"back",label:"Back"}]:[],...o!=="recommendation"?[{id:"next",label:o==="goal-details"?"Review Goal Search":"Next",disabled:o==="type"&&!b.selectedGoalTemplateId}]:[{id:"compile",label:"Compile Goal",disabled:!b.selectedGoalTemplateId||b.searchStatus==="searching"},{id:"run-search",label:b.searchStatus==="searching"?"Searching...":"Run Search",disabled:!b.selectedGoalTemplateId||b.searchStatus==="searching"},{id:"apply",label:f?.applyPayload?.parentPatch&&f?.applyPayload?.siblingPatch?"Apply with Host + Moon-System Fixes":f?.applyPayload?.parentPatch?"Apply with Host Fixes":f?.applyPayload?.siblingPatch?"Apply with Moon-System Fixes":"Apply",disabled:!f||f.hasBlockingDiagnostics||b.searchStatus!=="complete"},{id:"apply-advanced",label:f?.applyPayload?.parentPatch&&f?.applyPayload?.siblingPatch?"Apply with Host + Moon-System Fixes and open Advanced":f?.applyPayload?.parentPatch?"Apply with Host Fixes and open Advanced":f?.applyPayload?.siblingPatch?"Apply with Moon-System Fixes and open Advanced":"Apply and open Advanced",disabled:!f||f.hasBlockingDiagnostics||b.searchStatus!=="complete"}],{id:"reset",label:"Reset",className:"is-secondary"}],onArchetypeSelect:S=>y?.reset({objectType:"moon",uxMode:"guided",currentStepId:"type",selectedArchetypeId:S,selectedGoalTemplateId:S}),onQuestionChange:(S,H)=>Va(y,b,S,H),onStepSelect:(S,H)=>{H?.disabled||y?.setStep(S)},onAction:S=>{if(S==="reset"){y?.reset({objectType:"moon",uxMode:"guided",currentStepId:"type"});return}if(S==="back"){y?.setStep(h(b));return}if(S==="next"){y?.setStep(C(b,N));return}if(S==="compile"){y?.compileGoal();return}if(S==="run-search"){y?.startSearch();return}if((S==="apply"||S==="apply-advanced")&&f){let H=y?.apply({applyMoonRecommendation:Xa=>Za(Xa,{noticeLabel:f.title||"Guided moon"})});v();let D=[];H?.parentPatched&&H?.parentPatchSummary&&D.push(`host fixes: ${H.parentPatchSummary}`),H?.siblingPatched&&H?.siblingPatchSummary&&D.push(`moon-system fixes: ${H.siblingPatchSummary}`);let Y=D.length?`${f.title||"Guided moon"} applied with ${D.join("; ")}. `:"";S==="apply-advanced"?he(`${Y}Continue refining with the Moon page controls.`):Y&&he(Y.trim())}}});c.replaceChildren(E),mt("moon",{...d,uxMode:"guided",...ut(b,{currentStepId:b.currentStepId||"type"})})}}),j.add(A),M.addEventListener("click",v),u.addEventListener("click",b=>{b.target===u&&v()}),document.addEventListener("keydown",G),document.body.appendChild(u)}function Qa(t){let e=Aa(se);document.body.appendChild(e);let i=e.querySelector(".rp-picker-progress > span"),r=e.querySelector(".rp-picker-progress"),d=[];for(let M of e.querySelectorAll(".rp-picker-card")){let y=se.find(w=>w.id===M.dataset.recipe);y&&d.push({canvas:M.querySelector("canvas"),model:{bodyType:"moon",name:y.label||"Moon",recipeId:y.id,moonCalc:y.previewCalc||y.preview}})}na(d,(M,y)=>{let w=y?M/y*100:100;i&&(i.style.width=`${w}%`),w>=100&&r&&r.classList.add("is-done")},{maxRendersPerFrame:1,frameBudgetMs:7});function u(){j.delete(u),e.remove(),document.removeEventListener("keydown",c)}for(let M of e.querySelectorAll(".rp-picker-card"))M.addEventListener("click",()=>{let y=se.find(w=>w.id===M.dataset.recipe);y&&t(y),u()});e.addEventListener("click",M=>{M.target===e&&u()}),e.querySelector(".rp-picker-close").addEventListener("click",u);function c(M){M.key==="Escape"&&u()}j.add(u),document.addEventListener("keydown",c)}Z(),W();let Lt=Sa("moon");if(m?.dedicated&&m.objectType==="moon"){let t=pt("moon",ye());m.uxMode==="quick"?ve(t?.uxMode==="quick"?t:null,m.baseHash||""):fe(t?.uxMode==="guided"?t:null,m.baseHash||"")}else if(Lt?.uxMode==="quick")ve();else if(Lt)fe();else{let t=pt("moon",ye());t?.uxMode==="quick"?ve(t):t&&fe(t)}return()=>{j.forEach(t=>{try{t()}catch{}}),oe&&clearTimeout(oe),U.disconnect(),k.dispose()}}function O(n,l,m,p,P,I,a,k){let s=m?` <span class="unit">${m}</span>`:"";return`
  <div class="form-row">
    <div>
      <div class="label">${l}${s} ${T(R[k]||R[l]||"")}</div>
      <div class="hint">${p}</div>
    </div>
    <div class="input-pair">
      <input id="${n}" type="number" step="${a}" aria-label="${l}" />
      <input id="${n}_slider" type="range" aria-label="${l} slider" />
      <div class="range-meta"><span id="${n}_min"></span><span id="${n}_max"></span></div>
    </div>
  </div>`}function so(n,l,m=[]){return`
    <div id="${n}" class="physics-trio-toggle">
      ${m.map((p,P)=>`
            <input type="radio" name="${l}" id="${n}_${P}" value="${p.value}" ${p.checked?"checked":""} />
            <label for="${n}_${P}">${p.label}</label>`).join("")}
      <span></span>
    </div>`}function ro(n,l,m=[]){return`
    <div id="${n}" class="physics-duo-toggle">
      ${m.map((p,P)=>`
            <input type="radio" name="${l}" id="${n}_${P}" value="${p.value}" ${p.checked?"checked":""} />
            <label for="${n}_${P}">${p.label}</label>`).join("")}
      <span></span>
    </div>`}function St(n,l,m,p,P,I){return`
  <div class="form-row">
    <div>
      <div class="label">${m} ${T(R[p]||"")}</div>
      <div class="hint" id="${I}"></div>
    </div>
    <div class="pill-toggle-wrap">
      ${so(n,l,P)}
    </div>
  </div>`}function _(n,l,m="",p="",P=""){let I=m?` <span class="unit">${m}</span>`:"";return`
  <div class="form-row">
    <div>
      <div class="label">${l}${I} ${T(R[P]||R[l]||"")}</div>
      <div class="hint">${p}</div>
    </div>
    <input id="${n}" type="number" step="0.01" />
  </div>`}export{_o as initMoonPage};
