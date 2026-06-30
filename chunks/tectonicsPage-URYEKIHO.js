import{a as F,b as re,c as ce,d as de,e as B}from"./chunk-YAWL2UWM.js";import{a as he,b as pe}from"./chunk-RHHVANF4.js";import{a as ge,c as G,d as me,f as Z}from"./chunk-KD5CBWLO.js";import{f as oe,g as le}from"./chunk-PZVFO3CG.js";import"./chunk-5YVVLRFP.js";import"./chunk-MXEPBJGN.js";import"./chunk-HLZ2ABGO.js";import"./chunk-MKWHWN6W.js";import"./chunk-NDMX2VLS.js";import{b as V}from"./chunk-PSJ7PKPQ.js";import"./chunk-UN6CKA7Q.js";import{c as U}from"./chunk-DFN46JRM.js";import{a as g,d as K,e as f,f as se}from"./chunk-LWUHUUMM.js";import{a as C}from"./chunk-7PVDVLB6.js";import{Ea as ae,Fa as N,Ga as ie,P as j,cb as ne,ta as E}from"./chunk-RSAWJCQ5.js";import{e as Y}from"./chunk-XMLMEZIZ.js";import"./chunk-GYK6DNNS.js";import"./chunk-CDO5DGPP.js";import"./chunk-UD73CBTW.js";import"./chunk-UDNL2GYU.js";import"./chunk-6BSYNVSS.js";import"./chunk-MWW7VU5Q.js";import"./chunk-ETWCKWXP.js";import"./chunk-WNGVR2CK.js";import"./chunk-TIXSLYXP.js";import{j as T}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";var m={"Max Peak Height":f({overview:"Maximum possible mountain peak height under the planet's gravity and crust type.",drawnFrom:"Surface gravity and crustal composition constant C in H_max = C / g.",feedsInto:"Mountain range caps, inactive-range erosion limits, and tectonic feature readouts.",interpretAs:"Lower gravity allows taller mountains. Earth-like C = 9,267 m; iron worlds 12,000 m; ice worlds 3,000 m.",caveat:"This is a gravity/material cap, not a terrain generator or local uplift model.",references:"See Science & Maths: tectonic relief and gravity scaling."}),"Mountain Type":`Convergent-boundary mountain range classification based on tectonic setting.

Andean: oceanic\u2013continental subduction (high volcanic arc + wide plateau). Laramide: flat-slab subduction (broad inland deformation, e.g. Rocky Mountains). Ural: continent\u2013continent collision (older, lower, no active volcanism). Himalayan: active continent\u2013continent collision (highest peaks, wide plateau).`,"Erosion Rate":f({overview:"Rate at which inactive mountain ranges lose height over geological time.",drawnFrom:"Planet surface temperature, atmospheric moisture/water-vapour context, water availability, climate state, and baseline rock-weathering assumptions.",feedsInto:"Inactive range height loss, old-mountain survival, tectonic summaries, and erosion warnings.",interpretAs:"Warmer, wetter worlds erode faster; cold, dry, or airless worlds erode more slowly. Output is reported in m/Myr.",caveat:"This is a global analytic rate, not a sediment-transport, glacier, river-network, or local rainfall model.",references:"See Science & Maths: climate erosion and tectonic relief."}),"Mid-Ocean Ridge Height":`Elevation of newly-formed oceanic crust at the spreading centre, measured from the abyssal plain reference.

Earth average: ~2,600 m above the deep ocean floor.`,"Ocean Depth Curve":`Ocean floor depth as a function of crust age. Uses a two-regime plate model: half-space cooling (depth \u221D \u221Aage) for young crust, exponential flattening for old crust.

Reference: Parsons & Sclater (1977, JGR 82, 803).`,"Cross-Section":`Schematic cross-section showing average elevation of each tectonic zone (arc, forearc, slope, plateau, back-arc). Individual peaks within a zone can exceed the zone average, up to the Max Peak Height limit.

Heights are capped by the gravitational limit for the planet\u2019s surface gravity.`,"Inactive Range":`A mountain range that is no longer actively forming. Height decreases linearly with time at the specified erosion rate.

Example: the Ural Mountains formed ~300 Mya and have eroded from ~6,000 m to ~1,895 m.`,"Slab Angle":`Dip angle of the subducting slab. Controls the distance from trench to volcanic arc: d = slab_depth / tan(angle). Steeper slabs produce arcs closer to the trench.

Reference: Syracuse & Abers (2006, G\xB3). Global mean slab depth: 105 \xB1 19 km.`,"Spreading Rate":`Rate at which new oceanic crust is created at mid-ocean ridges. Linked to tectonic regime: mobile lid = 20\u2013200 mm/yr, stagnant lid = 0.

Reference: Dalton et al. (2022, GRL). Earth range: 10\u2013200 mm/yr.`,Pratt:`Pratt isostasy: mountains are less dense than lowlands, compensated at a uniform depth (the Moho). Higher terrain requires lower crustal density.

Contrast with Airy, where all crust has the same density but varies in thickness.

Reference: Pratt (1855, Phil. Trans. R. Soc. Lond.).`,Isostasy:`Compensation of topographic loads by the mantle. Mountains have deep crustal \u201Croots.\u201D

Airy model: root = h \xD7 \u03C1_c / (\u03C1_m \u2212 \u03C1_c). Pratt model: density decreases with elevation at constant compensation depth.

Reference: Turcotte & Schubert (2014) Geodynamics.`,"Continental Margin":`Transition from continent to deep ocean: shelf (0\u2013130 m, avg 80 km wide), slope (3\u20134\xB0), rise (sediment apron), abyssal plain.

Shelf break depth ~130 m is tied to Pleistocene sea-level lowstands.`,"Shield Volcano":`Large, gently-sloped volcanic edifice built by successive lava flows. Height is the minimum of three limits: gravitational (1/g), flexural (elastic lithosphere support), and basal spreading (self-weight yield). Result is scaled by volcanic activity (radiogenic decay + tidal heating).

Stagnant-lid worlds allow ~50% taller edifices.

Reference: McGovern & Solomon (1993, 1998, JGR).`,"Rift Valley":`Extensional tectonic feature where the crust is pulled apart, forming a graben (down-dropped block) flanked by uplifted shoulders.

Example: East African Rift (50\u2013100 km wide, 1\u20132 km deep).`,"Planet Factors":`How the planet\u2019s physical properties affect tectonic features.

Composition: crustal material strength sets the max peak height constant. Ice worlds have much lower peaks than iron-rich worlds.

Volcanic Activity: radiogenic heat decays with age; tidal heating can sustain volcanism. Scales shield volcano heights.

Erosion Rate: warmer temperatures and more atmospheric moisture accelerate erosion. Applied to inactive mountain ranges.

Elastic Lithosphere: thicker lithosphere supports taller volcanic edifices. Grows with age, thins with tidal heating.`,"Convergence Rate":`Rate at which tectonic plates converge at a subduction zone or collision boundary (mm/yr).

Faster convergence drives taller mountains. Scaled with a sub-linear exponent (factor = (rate/50)^0.3) because peak height is limited by gravitational and erosional equilibrium.

Earth examples: Himalayas ~50 mm/yr, Andes ~65 mm/yr, Pacific subduction ~80 mm/yr.`,Gravity:"Surface gravity in Earth g (9.81 m/s\xB2). Controls maximum mountain and shield volcano heights: lower gravity allows taller structures.",Composition:`Crustal material class derived from the planet\u2019s composition.

Sets the peak-height constant C: Earth-like (silicate) = 9,267 m, Iron-rich = 12,000 m, Ice = 3,000 m.`,"Volcanic Activity":`Combined index of radiogenic heating and tidal heating. Radiogenic heat decays exponentially with age; tidal heating can sustain volcanism indefinitely.

Scales shield volcano heights and magmatic rift fill.`,"Climate Erosion":f({overview:"Erosion rate adjusted for climate and atmospheric moisture.",drawnFrom:"Surface temperature, atmospheric H2O, pressure/water context, and the active planet climate solve.",feedsInto:"Inactive mountain range decay and tectonic-factor summaries.",interpretAs:"Warmer and wetter worlds erode faster than cold, dry worlds.",caveat:"This is a broad climate modifier, not a detailed hydrology or sediment model.",references:"See Science & Maths: climate erosion."}),"Elastic Lithosphere":f({overview:"Thickness of the elastic lithosphere in km.",drawnFrom:"Planet age, mass/gravity, internal heat, radiogenic context, and tidal heating.",feedsInto:"Shield volcano flexural support, rift geometry, and tectonic-factor summaries.",interpretAs:"Thicker lithosphere supports taller volcanic edifices; tidal heating and high internal heat thin it.",caveat:"This is an effective elastic thickness, not a full lithosphere thermal model.",references:"See Science & Maths: lithosphere and solid-body response."}),"Arc Distance":`Distance from the oceanic trench to the volcanic arc (km). Computed as slab depth / tan(slab angle).

Steeper slab angles produce arcs closer to the trench.`,"Original Height":"Starting elevation of the mountain range before erosion began (m). Height decreases linearly at the erosion rate over geological time.","Range Age":"Time since the mountain range stopped actively forming (Myr). Multiplied by erosion rate to compute cumulative height loss.","Shield Height":"Peak height of this shield volcano (m). Clamped to the planet\u2019s max shield height, which depends on gravity, lithosphere thickness, and basal spreading limits.","Shield Slope":`Flank slope angle (\xB0). Steeper slopes produce a narrower base radius. Typical Earth shield volcanoes: 2\u201312\xB0.

Base radius = height / tan(slope).`,"Graben Width":`Total width of the rift graben (km). The down-dropped block between the bounding normal faults.

Earth example: East African Rift graben = 50\u2013100 km.`,"Graben Depth":`Depth of the graben floor below the surrounding surface (m). Controlled by fault throw and extension amount.

Earth example: East African Rift = 1,000\u20132,000 m.`,"Fault Angle":`Dip angle of the bounding normal faults (\xB0). Steeper faults produce narrower grabens for the same depth.

Typical range: 45\u201375\xB0. Earth average: ~60\xB0.`,"Volcanic Fill":"Thickness of volcanic lava fill on the rift floor (m). Active rifts often have basaltic lava lakes and flows that partially fill the graben.","Shoulder Height":"Elevation of the uplifted rift shoulders above the surrounding terrain (m). Caused by isostatic and flexural rebound of the footwall blocks flanking the graben.","Shelf Width":`Width of the continental shelf (km). The gently sloping submerged extension of the continent.

Earth range: 10 km (active margins) to 300+ km (passive margins). Average: ~80 km.`,"Shelf Depth":`Depth at the shelf break where the continental slope begins (m). Controlled by glacioeustatic sea-level history.

Earth: ~130 m (Pleistocene lowstand).`,"Margin Slope":`Angle of the continental slope connecting the shelf break to the continental rise (\xB0).

Earth average: ~3.5\xB0. Steeper at active margins, gentler at passive margins.`,"Ridge Height":"Elevation of newly-formed crust at the mid-ocean ridge above the abyssal plain (m). Starting point for the ocean depth curve.","Max Ocean Depth":"Maximum ocean floor depth reached by old oceanic crust (m). Determined by the plate-cooling model: crust subsides as it ages and cools, flattening at ~80\u2013100 Myr.","Inferred Ocean Coverage":"Liquid-ocean surface fraction inherited from the Planet solver. It is inferred from water inventory, gravity-scaled relief, basin capacity, and climate state; tectonics uses this science context separately from authored visual/population overrides.","Authored Ocean Override":"Manual ocean percentage from Population or visual authoring. When set, it changes authored land/ocean split outputs but does not rewrite the inferred science coverage used by climate, carbon-cycle, and tectonic context.","Exposed Land":"Estimated unflooded surface fraction after inferred basin fill. This is the land context seen by downstream science models unless a page explicitly advertises an authored override.","Cross-Section Width":"Total width of the mountain range cross-section from forearc to back-arc (km). Sum of all tectonic zone widths.","Highest Zone":"Average elevation of the tallest tectonic zone in the cross-section (m). Individual peaks within a zone can exceed this average, up to the max peak height.","Margin Width":"Total width from the coast to the abyssal plain (km). Sum of shelf, slope, and continental rise widths.","Base Radius":`Horizontal distance from the summit to the base of the shield volcano (km). Derived from height and slope angle: R = H / tan(\u03B8).

Shallower slopes produce much wider bases.`,"Rift Total Width":"Total width of the rift valley cross-section (km), including the graben floor, both fault scarps, volcanic fill, and uplifted shoulders."};Object.assign(m,{"Mountain Type":f({overview:"Convergent-boundary mountain range archetype.",drawnFrom:"Selected tectonic setting and the active mountain profile.",feedsInto:"Cross-section shape, zone labels, uplift style, and example interpretation.",caveat:"Archetypes are schematic and do not generate local terrain.",references:"See Science & Maths: tectonic relief and mountain types."}),"Mid-Ocean Ridge Height":f({overview:"Elevation of newly formed oceanic crust at the spreading centre.",drawnFrom:"The tectonics engine's ridge-height baseline and active spreading context.",feedsInto:"Ocean depth curve and ridge KPI readouts.",caveat:"It is a ridge-to-abyssal-plain guide, not a bathymetric map.",references:"See Science & Maths: oceanic plate cooling."}),"Ocean Depth Curve":f({overview:"Ocean-floor depth as oceanic crust ages and cools.",drawnFrom:"A two-regime plate-cooling model: young half-space cooling and older flattening.",interpretAs:"Depth increases with crust age, then approaches a mature-plate limit.",caveat:"Sedimentation, hotspots, trenches, and local crustal thickness are not mapped.",references:"Parsons & Sclater 1977; see Science & Maths: oceanic plate cooling."}),"Cross-Section":f({overview:"Schematic average-elevation profile across a mountain system.",drawnFrom:"Mountain type, convergence context, gravity/material caps, and zone templates.",interpretAs:"Zone averages can sit below individual peak limits.",caveat:"It is an explanatory cross-section, not a terrain generator.",references:"See Science & Maths: tectonic relief."}),"Inactive Range":f({overview:"Mountain range that is no longer actively uplifting.",drawnFrom:"Original height, age since activity ended, erosion rate, and max peak cap.",interpretAs:"Height decreases over time according to the configured/global erosion rate.",caveat:"Linear erosion is a global simplification, not local drainage or glaciation.",references:"See Science & Maths: climate erosion and tectonic relief."}),"Slab Angle":f({overview:"Dip angle of a subducting slab in degrees.",feedsInto:"Volcanic arc distance using d = slab depth / tan(angle).",interpretAs:"Steeper slabs place arcs closer to the trench; shallower slabs push arcs inland.",caveat:"The model uses a representative slab depth rather than a full subduction geometry.",references:"Syracuse & Abers 2006; see Science & Maths: tectonic relief."}),"Spreading Rate":f({overview:"Rate at which new oceanic crust is created at mid-ocean ridges.",feedsInto:"Ocean depth curve, ridge context, and tectonic activity summaries.",interpretAs:"Mobile-lid worlds can use Earth-like mm/yr ranges; stagnant-lid worlds trend to zero.",caveat:"This is a regime parameter, not a global plate reconstruction.",references:"Dalton et al. 2022; see Science & Maths: plate spreading."}),Pratt:f({overview:"Isostasy mode where topography is supported by lateral density differences.",feedsInto:"Mountain compensation interpretation and cross-section context.",caveat:"This is an idealised end-member, not a full crust/mantle density model.",references:"Pratt 1855; Turcotte & Schubert 2014."}),Isostasy:f({overview:"How topographic loads are compensated by the mantle.",changes:"Airy uses crustal roots; Pratt uses density differences at uniform compensation depth.",feedsInto:"Mountain root/compensation interpretation and cross-section summaries.",caveat:"Both modes are simplified end-members.",references:"Turcotte & Schubert 2014; see Science & Maths: isostasy."}),"Continental Margin":f({overview:"Transition from continent to deep ocean.",drawnFrom:"Shelf width, shelf break depth, slope angle, and margin profile settings.",feedsInto:"Margin width and continental margin chart.",caveat:"It is a schematic margin, not local bathymetry or sediment routing.",references:"See Science & Maths: continental margins."}),"Shield Volcano":f({overview:"Large, gently sloped volcano built by repeated lava flows.",drawnFrom:"Gravity limit, flexural lithosphere support, basal spreading, volcanic activity, and stagnant/mobile-lid context.",feedsInto:"Max shield height, shield volcano rows, and volcanic factor summaries.",caveat:"The model does not simulate magma plumbing, eruption chronology, or edifice collapse.",references:"McGovern & Solomon 1993/1998; see Science & Maths: shield volcano limits."}),"Rift Valley":f({overview:"Extensional feature where crust pulls apart and a graben drops down.",drawnFrom:"Graben width/depth, fault angle, volcanic fill, and shoulder uplift settings.",feedsInto:"Rift valley cross-section and rift summary readouts.",caveat:"It is a geometric tectonic profile, not a terrain mesh or stress simulation.",references:"See Science & Maths: rift geometry."}),"Planet Factors":f({overview:"Summary of planetary controls applied to tectonic features.",drawnFrom:"Gravity, composition, volcanic activity, climate erosion, elastic lithosphere, age, and heating context.",interpretAs:"Use this to see why the same feature differs between worlds.",caveat:"These are analytic controls, not a full mantle-convection or plate-tectonics simulation.",references:"See Science & Maths: tectonic relief and solid-body response."}),"Convergence Rate":f({overview:"Rate at which plates converge at a collision or subduction boundary.",feedsInto:"Mountain uplift scaling and active range height.",interpretAs:"Faster convergence drives taller ranges, with sub-linear scaling due to caps and erosion.",caveat:"The model does not solve stress accumulation or earthquake cycles.",references:"See Science & Maths: tectonic relief."}),Gravity:f({overview:"Surface gravity in Earth g.",drawnFrom:"Solved planet mass and radius.",feedsInto:"Maximum mountain height, shield volcano limits, and relief scaling.",caveat:"Gravity is global; local terrain strength is simplified by composition classes.",references:"See Science & Maths: gravity and relief scaling."}),Composition:f({overview:"Crustal material class used by tectonic relief limits.",drawnFrom:"Planet composition and derived crust/material context.",feedsInto:"Peak-height constant, mountain caps, and material interpretation.",caveat:"Material classes are broad; detailed mineralogy is not solved.",references:"See Science & Maths: rocky body composition."}),"Volcanic Activity":f({overview:"Combined volcanic activity index.",drawnFrom:"Radiogenic heating, age, tidal heating, and geodynamic context.",feedsInto:"Shield volcano height scaling, magmatic rift fill, and tectonic summaries.",caveat:"This is an activity scalar, not an eruption forecast.",references:"See Science & Maths: radiogenic and tidal heating."}),"Arc Distance":f({overview:"Distance from trench to volcanic arc.",drawnFrom:"Representative slab depth divided by tan(slab angle).",interpretAs:"Steeper slab angles produce arcs closer to the trench.",caveat:"Actual arcs vary with slab age, hydration, mantle flow, and convergence geometry.",references:"Syracuse & Abers 2006; see Science & Maths: subduction geometry."}),"Original Height":f({overview:"Initial elevation before an inactive range began eroding.",feedsInto:"Current inactive-range height after erosion over age.",caveat:"The original height is authored; the app does not reconstruct it from past tectonics."}),"Range Age":f({overview:"Time since an inactive range stopped actively forming.",feedsInto:"Cumulative height loss from erosion rate x age.",caveat:"Age is applied as a simple elapsed time, not a changing climate history.",references:"See Science & Maths: climate erosion."}),"Shield Height":f({overview:"Authored or capped height of a shield volcano.",drawnFrom:"Input height clamped by max shield height and activity/lithosphere limits.",caveat:"Local collapse, landslides, and caldera formation are not simulated.",references:"See Science & Maths: shield volcano limits."}),"Shield Slope":f({overview:"Average flank slope angle of a shield volcano.",feedsInto:"Base radius through R = H / tan(theta).",interpretAs:"Shallower slopes produce wider volcanic shields.",caveat:"Real volcano slopes vary by elevation, lava type, and flank stability.",references:"See Science & Maths: shield volcano geometry."}),"Graben Width":f({overview:"Width of the down-dropped rift block.",feedsInto:"Rift valley total width and cross-section geometry.",caveat:"It is a geometric control, not a crustal strain simulation.",references:"See Science & Maths: rift geometry."}),"Graben Depth":f({overview:"Depth of the rift floor below surrounding terrain.",feedsInto:"Rift valley relief and cross-section geometry.",caveat:"Sediment fill and erosion are not dynamically applied.",references:"See Science & Maths: rift geometry."}),"Fault Angle":f({overview:"Dip angle of the bounding normal faults.",feedsInto:"Rift geometry and width/depth interpretation.",interpretAs:"Steeper faults produce narrower grabens for the same depth.",caveat:"Fault networks are simplified to representative boundary faults.",references:"See Science & Maths: rift geometry."}),"Volcanic Fill":f({overview:"Thickness of lava or volcanic material filling the rift floor.",feedsInto:"Rift cross-section shape and apparent floor elevation.",caveat:"Composition, eruption timing, and flow emplacement are not simulated.",references:"See Science & Maths: rift geometry."}),"Shoulder Height":f({overview:"Uplift of rift shoulders above surrounding terrain.",feedsInto:"Rift cross-section relief.",caveat:"Isostatic/flexural rebound is simplified into one height control.",references:"See Science & Maths: rift geometry."}),"Shelf Width":f({overview:"Width of the continental shelf.",feedsInto:"Continental margin total width and margin chart.",caveat:"Shelf geometry is schematic and does not model sediment supply or sea-level history.",references:"See Science & Maths: continental margins."}),"Shelf Depth":f({overview:"Depth at the continental shelf break.",feedsInto:"Continental margin profile and slope geometry.",caveat:"The app uses a representative value rather than a glacioeustatic history.",references:"See Science & Maths: continental margins."}),"Margin Slope":f({overview:"Angle of the continental slope below the shelf break.",feedsInto:"Continental margin width and chart geometry.",caveat:"Active/passive margin complexity is compressed into one slope value.",references:"See Science & Maths: continental margins."}),"Ridge Height":f({overview:"Mid-ocean ridge elevation above the abyssal plain.",drawnFrom:"Ridge-height setting and oceanic crust model.",feedsInto:"Ocean depth curve and tectonic KPI rows.",caveat:"Hotspots, transform offsets, and local bathymetry are not represented.",references:"See Science & Maths: oceanic plate cooling."}),"Max Ocean Depth":f({overview:"Maximum depth reached by old oceanic crust in the plate-cooling model.",drawnFrom:"Oceanic crust age-depth curve and mature-plate flattening limit.",caveat:"Trenches and sediment-loaded basins are not modelled as local features.",references:"Parsons & Sclater 1977; see Science & Maths: oceanic plate cooling."}),"Inferred Ocean Coverage":f({overview:"Science-model liquid-ocean surface fraction.",drawnFrom:"Planet water inventory, gravity-scaled relief, basin capacity, and climate state.",feedsInto:"Tectonic context and downstream climate/carbon-cycle science outputs.",caveat:"This is separate from authored visual/population ocean overrides.",references:"See Science & Maths: surface ocean coverage."}),"Authored Ocean Override":f({overview:"Manual ocean percentage from population or visual authoring.",drawnFrom:"Authored override value when present.",interpretAs:"It changes authored land/ocean split outputs without rewriting inferred science coverage.",caveat:"Climate, carbon-cycle, and tectonic science read the inferred coverage unless stated otherwise.",references:"See Science & Maths: surface ocean coverage."}),"Exposed Land":f({overview:"Estimated unflooded surface fraction after inferred basin fill.",drawnFrom:"Inferred ocean coverage and surface basin capacity context.",feedsInto:"Downstream science land context where available.",caveat:"This is not a terrain map or coastline generator.",references:"See Science & Maths: surface ocean coverage."}),"Cross-Section Width":f({overview:"Total width of the mountain cross-section.",drawnFrom:"The sum of active tectonic zone widths in the selected mountain profile.",caveat:"A schematic width, not a mapped orogen footprint."}),"Highest Zone":f({overview:"Average elevation of the highest zone in the mountain cross-section.",drawnFrom:"Selected mountain type, convergence scaling, and gravity/material caps.",caveat:"Individual peaks can exceed the zone average up to the max peak limit."}),"Margin Width":f({overview:"Total width from coast to abyssal plain.",drawnFrom:"Shelf, slope, and continental-rise geometry.",caveat:"Margin shape is schematic and not a coastline/bathymetry model.",references:"See Science & Maths: continental margins."}),"Base Radius":f({overview:"Horizontal distance from shield-volcano summit to base.",drawnFrom:"Volcano height and flank slope using R = H / tan(theta).",interpretAs:"Lower slopes produce broader bases.",caveat:"The volcano is treated as a simple conical/profile geometry.",references:"See Science & Maths: shield volcano geometry."}),"Rift Total Width":f({overview:"Total width of the rift valley cross-section.",drawnFrom:"Graben, fault scarp, volcanic fill, and shoulder geometry.",caveat:"This is profile geometry, not a map of rift segmentation.",references:"See Science & Maths: rift geometry."})});var J=["var(--accent)","var(--muted)","#7eb8a0","var(--warn)","#c49a8b","#8a9ac4"];function Se(s){let l=getComputedStyle(s);return J.map(i=>{if(i.startsWith("var(")){let a=i.slice(4,-1);return l.getPropertyValue(a).trim()||i}return i})}var ue=ge();function ve(s){let l={gravityG:1,massEarth:1,ageGyr:4.6,surfaceTempK:288,h2oPct:0,compositionClass:"Earth-like",tidalHeatingWm2:0,radioisotopeAbundance:1,inferredOceanCoverageDisplay:"70.0%",exposedLandDisplay:"30.0%",coverageConfidenceDisplay:"Fallback confidence",surfaceOceanCoverageReason:"fallback",authoredOceanOverrideDisplay:"Auto",authoredOceanOverrideActive:!1},i=N(s);if(!i)return l;let a=j(s,`planet:${i.id}`)||j(s,i.id),e=a?pe(s,a).model||a:null,d=e?oe(e,"tectonics"):null,u=d&&d.status!=="full"?le(e,"tectonics"):"";if(d?.status==="none")return{...l,unsupportedSurfaceMessage:u};let{model:r,starConfig:M}=he(s,i);if(!r?.derived)return l;let y=s.population?.oceanPctOverride,A=y==null||y===""?null:Number(s.population.oceanPctOverride),R=Number.isFinite(A),D=R?Math.max(0,Math.min(100,A)):null;return{gravityG:r.derived.gravityG||1,massEarth:r.inputs?.massEarth||1,ageGyr:Number(M?.ageGyr)||4.6,surfaceTempK:r.derived.surfaceTempK||288,h2oPct:Number.isFinite(Number(r.inputs?.h2oPct))?Number(r.inputs.h2oPct):0,compositionClass:r.derived.compositionClass||"Earth-like",tidalHeatingWm2:r.derived.planetTidalHeatingWm2||0,radioisotopeAbundance:r.derived.radioisotopeAbundance??1,geodynamicsContext:r.derived.geodynamicsContext||null,inferredOceanCoverageDisplay:r.display?.inferredOceanCoverage||"n/a",exposedLandDisplay:r.display?.exposedLand||"n/a",coverageConfidenceDisplay:r.display?.surfaceOceanCoverageConfidence||"Unknown confidence",surfaceOceanCoverageReason:r.display?.surfaceOceanCoverageReason||r.derived.hydrosphere?.surfaceOceanCoverageContext?.source||"",authoredOceanOverrideDisplay:R?`${T(D,1)}%`:"Auto",authoredOceanOverrideActive:R,limitedSurfaceMessage:d?.status==="limited"?u:""}}function fe(s){let l=s?.geodynamicsContext;if(!l?.outputs)return"";let i=l.outputs,a=Array.isArray(l.limitingFactors)&&l.limitingFactors.length?` Limits: ${l.limitingFactors.join("; ")}`:"";return`<div class="derived-readout">Geodynamics: ${C(i.tectonicRegime||"unknown")}; heat ${C(i.internalHeatClass||"unknown")}; convection ${C(i.convectiveVigorClass||"unknown")}; weathering ${C(i.weatheringFeedbackClass||"unknown")}.${C(a)}</div>`}function ye(s){if(!s)return"";let l=s.authoredOceanOverrideActive?`Authored Ocean Override: ${s.authoredOceanOverrideDisplay} (manual land/ocean authoring; inferred science coverage remains separate)`:"Authored Ocean Override: Auto (uses inferred coverage)",i=s.surfaceOceanCoverageReason?`; class ${C(s.surfaceOceanCoverageReason)}`:"";return`<div class="derived-readout">Surface ocean coverage: inferred ${C(s.inferredOceanCoverageDisplay||"n/a")}; exposed land ${C(s.exposedLandDisplay||"n/a")}; ${C(s.coverageConfidenceDisplay||"Unknown confidence")}${i}. ${C(l)}</div>`}var be=["#5b9bd5","#3a7cc4","#2a5ea0","#1e3f6f"];function we(s,l,i,a={}){let e=s.getContext("2d"),d=window.devicePixelRatio||1,u=s.clientWidth,r=s.clientHeight;s.width=u*d,s.height=r*d,e.scale(d,d);let M=Se(s),y={top:24,bottom:36,left:56,right:16},A=u-y.left-y.right,R=r-y.top-y.bottom,P=a.isostasyMode==="airy"||a.isostasyMode==="pratt"?Math.round(R*.2):0,_=R-P,c=l.totalWidthKm||1,t=i*1.15,h=A/c,n=_/t,p=getComputedStyle(s).getPropertyValue("color")||"#ccc",o=getComputedStyle(s).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";e.clearRect(0,0,u,r),e.strokeStyle=o,e.lineWidth=.5;let b=z(t,5);for(let k=0;k<=t;k+=b){let $=y.top+_-k*n;e.beginPath(),e.moveTo(y.left,$),e.lineTo(y.left+A,$),e.stroke(),e.fillStyle=p,e.font="10px var(--font-mono, monospace)",e.textAlign="right",e.fillText(T(k,0),y.left-4,$+3)}let x=z(c,5);e.textAlign="center";for(let k=0;k<=c;k+=x){let $=y.left+k*h;e.fillStyle=p,e.font="10px var(--font-mono, monospace)",e.fillText(T(k,0),$,r-y.bottom+16)}e.save(),e.fillStyle=p,e.font="11px var(--font-mono, monospace)",e.textAlign="center",e.fillText("Width (km)",y.left+A/2,r-4),e.save(),e.translate(12,y.top+_/2),e.rotate(-Math.PI/2),e.fillText("Height (m)",0,0),e.restore(),e.restore();let S=y.top+_;e.strokeStyle="rgba(100,180,255,0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(y.left,S),e.lineTo(y.left+A,S),e.stroke(),e.setLineDash([]);let I=y.top+_-i*n;e.strokeStyle="rgba(255,100,100,0.5)",e.lineWidth=1,e.setLineDash([6,3]),e.beginPath(),e.moveTo(y.left,I),e.lineTo(y.left+A,I),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(255,100,100,0.7)",e.font="10px var(--font-mono, monospace)",e.textAlign="right",e.fillText("Max "+T(i,0)+" m",y.left+A-2,I-4);for(let k=0;k<l.zones.length;k++){let $=l.zones[k],H=y.left+$.x*h,O=$.width*h,w=$.height*n;if(e.fillStyle=M[k%M.length],e.globalAlpha=.5,$.taper&&$.taperToPeak)e.beginPath(),e.moveTo(H,S),e.lineTo(H,S-$.minHeight*n),e.lineTo(H+O,S-w),e.lineTo(H+O,S),e.closePath(),e.fill();else if($.taper&&$.taperFromPeak)e.beginPath(),e.moveTo(H,S),e.lineTo(H,S-w),e.lineTo(H+O,S-$.minHeight*n),e.lineTo(H+O,S),e.closePath(),e.fill();else if($.taper){let v=k>0?l.zones[k-1]:null,L=k<l.zones.length-1?l.zones[k+1]:null,W=v?v.taperFromPeak?v.minHeight:v.height:0,q=L?L.taperToPeak?L.minHeight:L.height:0;e.beginPath(),e.moveTo(H,S),e.lineTo(H,S-W*n),e.lineTo(H+O,S-q*n),e.lineTo(H+O,S),e.closePath(),e.fill()}else e.fillRect(H,S-w,O,w);if(e.globalAlpha=1,O>30){let v=w;if($.taper&&!$.taperToPeak&&!$.taperFromPeak){let L=k>0?l.zones[k-1]:null,W=k<l.zones.length-1?l.zones[k+1]:null,q=L?L.taperFromPeak?L.minHeight:L.height:0,xe=W?W.taperToPeak?W.minHeight:W.height:0;v=(q+xe)/2*n}e.fillStyle=p,e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText($.name,H+O/2,S-v-4)}}if(P>0&&(e.fillStyle="rgba(139,94,60,0.06)",e.fillRect(y.left,S,A,P)),a.isostasyMode==="airy")for(let k=0;k<l.zones.length;k++){let $=l.zones[k];if($.height<=0)continue;let O=me($.height)*n,w=y.left+$.x*h,v=$.width*h;e.fillStyle="#8b5e3c",e.globalAlpha=.35,e.fillRect(w,S,v,Math.min(O,P)),e.globalAlpha=1}else if(a.isostasyMode==="pratt"){let k=S+P*.7;e.strokeStyle="#8b5e3c",e.lineWidth=1.5,e.setLineDash([4,3]),e.beginPath(),e.moveTo(y.left,k),e.lineTo(y.left+A,k),e.stroke(),e.setLineDash([])}if(a.arcDistanceKm!=null&&a.arcDistanceKm<=c){let k=y.left+a.arcDistanceKm*h;e.strokeStyle="rgba(255,80,80,0.7)",e.lineWidth=1.5,e.setLineDash([3,3]),e.beginPath(),e.moveTo(k,y.top),e.lineTo(k,S),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(255,80,80,0.85)",e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText("Arc "+T(a.arcDistanceKm,0)+" km",k,y.top+10)}}function Me(s,l,i){let a=s.getContext("2d"),e=window.devicePixelRatio||1,d=s.clientWidth,u=s.clientHeight;s.width=d*e,s.height=u*e,a.scale(e,e);let r={top:20,bottom:36,left:56,right:16},M=d-r.left-r.right,y=u-r.top-r.bottom,A=l[l.length-1]?.ageMyr||1e3,R=7e3,D=M/A,P=y/R,_=getComputedStyle(s).getPropertyValue("color")||"#ccc",c=getComputedStyle(s).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";a.clearRect(0,0,d,u),a.strokeStyle=c,a.lineWidth=.5;let t=1e3;for(let o=0;o<=R;o+=t){let b=r.top+o*P;a.beginPath(),a.moveTo(r.left,b),a.lineTo(r.left+M,b),a.stroke(),a.fillStyle=_,a.font="10px var(--font-mono, monospace)",a.textAlign="right",a.fillText(T(o,0),r.left-4,b+3)}let h=z(A,5);a.textAlign="center";for(let o=0;o<=A;o+=h){let b=r.left+o*D;a.fillStyle=_,a.font="10px var(--font-mono, monospace)",a.fillText(T(o,0),b,u-r.bottom+16)}a.fillStyle=_,a.font="11px var(--font-mono, monospace)",a.textAlign="center",a.fillText("Crust Age (Myr)",r.left+M/2,u-4),a.save(),a.translate(12,r.top+y/2),a.rotate(-Math.PI/2),a.fillText("Depth (m)",0,0),a.restore();let n=r.top+i*P;a.strokeStyle="rgba(100,200,255,0.5)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(r.left,n),a.lineTo(r.left+M,n),a.stroke(),a.setLineDash([]),a.fillStyle="rgba(100,200,255,0.7)",a.font="10px var(--font-mono, monospace)",a.textAlign="left",a.fillText("Ridge "+T(i,0)+" m",r.left+4,n-4);let p=r.top+6400*P;a.strokeStyle="rgba(255,150,100,0.5)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(r.left,p),a.lineTo(r.left+M,p),a.stroke(),a.setLineDash([]),a.fillStyle="rgba(255,150,100,0.7)",a.font="10px var(--font-mono, monospace)",a.textAlign="left",a.fillText("Max 6,400 m",r.left+4,p-4),a.strokeStyle="var(--accent, #66aaff)",a.lineWidth=2,a.beginPath();for(let o=0;o<l.length;o++){let b=l[o],x=r.left+b.ageMyr*D,S=r.top+b.depthM*P;o===0?a.moveTo(x,S):a.lineTo(x,S)}a.stroke(),a.fillStyle="rgba(30,90,160,0.15)",a.beginPath(),a.moveTo(r.left,r.top);for(let o of l)a.lineTo(r.left+o.ageMyr*D,r.top+o.depthM*P);a.lineTo(r.left+M,r.top),a.closePath(),a.fill()}function z(s,l){let i=s/l,a=Math.pow(10,Math.floor(Math.log10(i))),e=i/a,d;return e<=1.5?d=1:e<=3.5?d=2:e<=7.5?d=5:d=10,d*a}function ke(s,l){let i=s.getContext("2d"),a=window.devicePixelRatio||1,e=s.clientWidth,d=s.clientHeight;s.width=e*a,s.height=d*a,i.scale(a,a);let u={top:20,bottom:36,left:56,right:16},r=e-u.left-u.right,M=d-u.top-u.bottom,y=l.totalWidthKm||500,A=5500,R=r/y,D=M/A,P=getComputedStyle(s).getPropertyValue("color")||"#ccc",_=getComputedStyle(s).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";i.clearRect(0,0,e,d),i.strokeStyle=_,i.lineWidth=.5;let c=1e3;for(let h=0;h<=A;h+=c){let n=u.top+h*D;i.beginPath(),i.moveTo(u.left,n),i.lineTo(u.left+r,n),i.stroke(),i.fillStyle=P,i.font="10px var(--font-mono, monospace)",i.textAlign="right",i.fillText(T(h,0),u.left-4,n+3)}let t=z(y,5);i.textAlign="center";for(let h=0;h<=y;h+=t){let n=u.left+h*R;i.fillStyle=P,i.font="10px var(--font-mono, monospace)",i.fillText(T(h,0),n,d-u.bottom+16)}i.fillStyle=P,i.font="11px var(--font-mono, monospace)",i.textAlign="center",i.fillText("Distance from Coast (km)",u.left+r/2,d-4),i.save(),i.translate(12,u.top+M/2),i.rotate(-Math.PI/2),i.fillText("Depth (m)",0,0),i.restore();for(let h=0;h<l.segments.length;h++){let n=l.segments[h],p=u.left+n.startKm*R,o=u.left+n.endKm*R,b=u.top+n.startM*D,x=u.top+n.endM*D;i.fillStyle=be[h%be.length],i.globalAlpha=.3,i.beginPath(),i.moveTo(p,u.top),i.lineTo(p,b),i.lineTo(o,x),i.lineTo(o,u.top),i.closePath(),i.fill(),i.globalAlpha=1;let S=(p+o)/2;o-p>30&&(i.fillStyle=P,i.font="9px var(--font-mono, monospace)",i.textAlign="center",i.fillText(n.name,S,u.top+14))}i.strokeStyle="var(--accent, #66aaff)",i.lineWidth=2,i.beginPath();for(let h=0;h<l.points.length;h++){let n=l.points[h],p=u.left+n.distKm*R,o=u.top+n.depthM*D;h===0?i.moveTo(p,o):i.lineTo(p,o)}i.stroke()}function Re(s,l,i){let a=s.getContext("2d"),e=window.devicePixelRatio||1,d=s.clientWidth,u=s.clientHeight;s.width=d*e,s.height=u*e,a.scale(e,e);let r={top:20,bottom:36,left:56,right:16},M=d-r.left-r.right,y=u-r.top-r.bottom,A=15,D=y/((i||1e4)*1.15),P=D*1e3/A,_=l.baseRadiusKm*2.2*P,c=_>M?M/_:1,t=D*c,h=P*c,n=getComputedStyle(s).getPropertyValue("color")||"#ccc";a.clearRect(0,0,d,u);let p=r.top+y;a.strokeStyle="rgba(100,180,255,0.3)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(r.left,p),a.lineTo(r.left+M,p),a.stroke(),a.setLineDash([]);let o=r.left+M/2;a.fillStyle="#c49a8b",a.globalAlpha=.5,a.beginPath(),a.moveTo(o-l.baseRadiusKm*h,p);for(let x of l.points)a.lineTo(o-x.rKm*h,p-x.hM*t);for(let x=l.points.length-1;x>=0;x--){let S=l.points[x];a.lineTo(o+S.rKm*h,p-S.hM*t)}a.lineTo(o+l.baseRadiusKm*h,p),a.closePath(),a.fill(),a.globalAlpha=1,a.strokeStyle="var(--accent, #66aaff)",a.lineWidth=1.5,a.beginPath(),a.moveTo(o-l.baseRadiusKm*h,p);for(let x of l.points)a.lineTo(o-x.rKm*h,p-x.hM*t);for(let x=l.points.length-1;x>=0;x--){let S=l.points[x];a.lineTo(o+S.rKm*h,p-S.hM*t)}a.lineTo(o+l.baseRadiusKm*h,p),a.stroke(),a.fillStyle=n,a.font="11px var(--font-mono, monospace)",a.textAlign="center",a.fillText("Radius (km)",o,u-4);let b=l.points[l.points.length-1]?.hM||0;a.fillText(T(b,0)+" m",o,p-b*t-6)}function $e(s,l){let i=s.getContext("2d"),a=window.devicePixelRatio||1,e=s.clientWidth,d=s.clientHeight;s.width=e*a,s.height=d*a,i.scale(a,a);let u={top:24,bottom:36,left:56,right:16},r=e-u.left-u.right,M=d-u.top-u.bottom,y=l.totalWidthKm||1,A=0,R=0;for(let n of l.zones)n.height<A&&(A=n.height),n.height>R&&(R=n.height);let D=(R-A)*1.3||1,P=r/y,_=M/D,c=u.top+R*1.15*_,t=getComputedStyle(s).getPropertyValue("color")||"#ccc";i.clearRect(0,0,e,d),i.strokeStyle="rgba(100,180,255,0.4)",i.lineWidth=1,i.setLineDash([4,4]),i.beginPath(),i.moveTo(u.left,c),i.lineTo(u.left+r,c),i.stroke(),i.setLineDash([]);let h=["#8b7355","#a05a3c","#6b3a2a","#a05a3c","#8b7355"];for(let n=0;n<l.zones.length;n++){let p=l.zones[n],o=u.left+p.x*P,b=p.width*P,x=p.height*_;if(i.fillStyle=h[n%h.length],i.globalAlpha=.5,p.taper&&p.taperFromPeak?(i.beginPath(),i.moveTo(o,c),i.lineTo(o,c-(l.zones[0]?.height||0)*_),i.lineTo(o+b,c-x),i.lineTo(o+b,c),i.closePath(),i.fill()):p.taper&&p.taperToPeak?(i.beginPath(),i.moveTo(o,c),i.lineTo(o,c-x),i.lineTo(o+b,c-(l.zones[4]?.height||0)*_),i.lineTo(o+b,c),i.closePath(),i.fill()):i.fillRect(o,c-x,b,x<0?-x:x),i.globalAlpha=1,b>30){i.fillStyle=t,i.font="9px var(--font-mono, monospace)",i.textAlign="center";let S=x>=0?c-x-4:c-x+12;i.fillText(p.name,o+b/2,S)}}i.fillStyle=t,i.font="11px var(--font-mono, monospace)",i.textAlign="center",i.fillText("Width (km)",u.left+r/2,d-4)}var Te=[{title:"Getting Started",body:"The Tectonics page models crustal features from plate dynamics. Select a mountain range type, set convergence parameters, and review the resulting elevation profile."},{title:"Mountain Types",body:"Choose from Andean (subduction), Laramide (flat-slab), Ural (ancient collision), or Himalayan (active collision). Each type produces a distinct cross-section and peak height."},{title:"Ocean and Margins",body:"Model continental margins with shelf width, slope angle, and abyssal depth. Ocean depth curves depend on plate age and spreading rate."},{title:"Volcanoes",body:"Configure shield volcanoes, hotspot chains, and rift valleys. Elastic lithosphere thickness and tidal heating affect maximum volcano height."},{title:"Plate Canvas",body:"Generate Voronoi plate boundaries with classification as convergent, divergent, or transform. Use this to sketch a tectonic map for your world."}];function te(s){return s?.name||s?.inputs?.name||s?.id||"No compatible planet"}function Ae(s=[],l=null){return s.map(i=>({value:i.id,label:te(i),selected:i.id===l?.id}))}function X({selected:s,ctx:l,model:i,regime:a="",unsupportedMessage:e="",empty:d=!1}={}){return F(re({id:"tectonicsCockpit",title:"Tectonics",summary:d?"Create a rocky planet before reading tectonic and terrain limits.":"Reads the selected rocky planet, then interprets terrain limits and local feature profiles.",current:{label:"Selected planet",value:d?"No compatible planet":te(s),meta:e?"Tectonic output is unavailable for this body.":"Tectonic diagnostic target."},statusItems:[{label:"Reads from",value:"Planets",meta:"Mass, gravity, water, tectonic regime, geodynamics, and surface class."},{label:"Diagnostic only",value:e?"Unsupported":i?.display?.maxPeakHeight||"Waiting",meta:a?`Regime: ${a}. Local feature profiles save to Tectonics.`:"",tone:e?"warn":""},{label:"Authoring override",value:l?.authoredOceanOverrideDisplay||"Auto",meta:l?.authoredOceanOverrideActive?"Population/visual override; inferred science coverage remains separate.":"Auto follows inferred coverage."}],source:{label:"Source",value:"Reads from Planets",meta:"Change inputs on Planets. This page is diagnostic only for planet science."},details:{id:"tectonicsContextDisclosure",title:"What this reads",summary:"Planet mass, water, tectonic regime, geodynamics, and ocean coverage context.",items:["Reads from Planets: mass, gravity, age, water, geodynamics, tectonic regime, and surface classification.","Change inputs on Planets: edit mass, water coverage, radioisotopes, tidal heating, and tectonic regime there.","Diagnostic only: terrain profile controls here do not rewrite planet science context.","Authoring override: population/visual ocean overrides remain separate from inferred surface-ocean coverage."]},nextStep:{id:"tectonicsNextStepStrip",recommendation:d?"Create a rocky planet, then return here to inspect terrain limits.":"Edit mass, water, or tectonic regime on Planets when these limits need to change.",actions:[{label:"Edit planet",href:"#/planet",primary:!0},{label:"Open Climate",href:"#/climate"},{label:"Open Population",href:"#/population"}]}}))}function Q(){return F(ce({id:"tectonicsDependencyNotice",title:"Reads from Planets",body:"Reads from the selected rocky planet's mass, water coverage, geodynamics, and tectonic regime. Change inputs on Planets.",source:"Diagnostic only for planet science. Authoring override ocean values stay separate from inferred tectonic and climate coverage.",actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}function ee(s,l,i){return F(de({id:"tectonicsObjectSelector",title:"Planet selection",summary:"Choose the rocky planet whose terrain limits and tectonic context should be interpreted.",selectedLabel:"Selected planet",selectedValue:te(l),selectedMeta:i?.unsupportedSurfaceMessage?"No compatible tectonic output for this body.":"Tectonic diagnostic target.",selectId:"tecPlanetSelect",selectLabel:"Planet",selectOptions:Ae(s,l)}))}function Ce(s,l){return`
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Tectonics</h1></div>
          <div class="panel__body">
            ${X({selected:l,empty:!0})}
            ${Q()}
            ${F(B({id:"tectonicsEmptyState",title:"No compatible rocky planet",body:"Tectonics needs a rocky planet before it can read gravity, water, geodynamics, and terrain limits.",actions:[{label:"Create a planet",href:"#/planet"}]}))}
            ${s.length?ee(s,l,{}):""}
          </div>
        </div>
      </div>`}function Ge(s){let l=E(),i=ae(l);if(!i.length){s.innerHTML=Ce(i,null);return}let a=l.tectonics||{},e={ridgeHeightM:Number(a.ridgeHeightM)||2600,mountainRanges:Array.isArray(a.mountainRanges)?[...a.mountainRanges]:[],inactiveRanges:Array.isArray(a.inactiveRanges)?[...a.inactiveRanges]:[],selectedRangeIdx:0,spreadingRateFraction:a.spreadingRateFraction!=null?Number(a.spreadingRateFraction):.5,isostasyMode:a.isostasyMode||"off",margin:a.margin||{shelfWidthKm:80,shelfDepthM:130,slopeAngleDeg:3.5},shieldVolcanoes:Array.isArray(a.shieldVolcanoes)?[...a.shieldVolcanoes]:[],riftValleys:Array.isArray(a.riftValleys)?[...a.riftValleys]:[]};function d(){ne({tectonics:{ridgeHeightM:e.ridgeHeightM,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,spreadingRateFraction:e.spreadingRateFraction,isostasyMode:e.isostasyMode,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys}})}function u(c,t,h,n,p){return`
              <section class="kpi-section" id="tectonicsSummary">
                <div class="kpi-section__header"><h3 class="kpi-section__title">Summary</h3></div>
                <div class="kpi-grid" style="margin-top:8px">
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Max Peak Height ${g(m["Max Peak Height"])}</div>
                    <div class="kpi__value">${c.display.maxPeakHeight}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Max Ocean Depth ${g(m["Max Ocean Depth"])}</div>
                    <div class="kpi__value">${c.display.maxOceanDepth}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Inferred Ocean Coverage ${g(m["Inferred Ocean Coverage"])}</div>
                    <div class="kpi__value">${C(p?.inferredOceanCoverageDisplay||"n/a")}</div>
                    <div class="kpi__meta">${C(p?.surfaceOceanCoverageReason||"")}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Authored Ocean Override ${g(m["Authored Ocean Override"])}</div>
                    <div class="kpi__value">${C(p?.authoredOceanOverrideDisplay||"Auto")}</div>
                    <div class="kpi__meta">${p?.authoredOceanOverrideActive?"manual population/visual override":"auto follows inferred coverage"}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Ridge Height ${g(m["Ridge Height"])}</div>
                    <div class="kpi__value">${c.display.ridgeHeight}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Margin Width ${g(m["Margin Width"])}</div>
                    <div class="kpi__value">${T(c.tectonics.margin.totalWidthKm,0)} km</div>
                  </div></div>
                </div>
              </section>
              ${t?`
                <div class="subsection">
                  <h3>Mountain Cross-Section: ${C(t.label)} ${g(m["Cross-Section"])}</h3>
                  ${c.tectonics.mountainProfiles.length>1?`
                    <div class="tec-range-tabs">
                      ${c.tectonics.mountainProfiles.map((o,b)=>`<button class="tec-range-tab ${b===h?"is-active":""}" data-idx="${b}">${C(o.label)} ${b+1}</button>`).join("")}
                    </div>
                  `:""}
                  <div class="tec-isostasy-toggle">
                    <button class="tec-iso-btn ${e.isostasyMode==="off"?"is-active":""}" data-iso="off">Off</button>
                    <button class="tec-iso-btn ${e.isostasyMode==="airy"?"is-active":""}" data-iso="airy">Airy ${g(m.Isostasy)}</button>
                    <button class="tec-iso-btn ${e.isostasyMode==="pratt"?"is-active":""}" data-iso="pratt">Pratt ${g(m.Pratt)}</button>
                  </div>
                  <canvas id="tecMtnCanvas" class="tec-canvas ${e.isostasyMode!=="off"?"tec-canvas--tall":""}"></canvas>
                  <div class="tec-zone-legend">
                    ${t.zones.map((o,b)=>`<span class="tec-legend-item"><span class="tec-legend-swatch" style="background:${J[b%J.length]}"></span>${C(o.name)}</span>`).join("")}
                    ${e.isostasyMode==="airy"?'<span class="tec-legend-item"><span class="tec-legend-swatch tec-legend-swatch--crust"></span>Crustal Roots</span>':""}
                    ${e.isostasyMode==="pratt"?'<span class="tec-legend-item"><span class="tec-legend-swatch tec-legend-swatch--crust"></span>Moho</span>':""}
                  </div>
                  ${V([{labelHtml:`Total Width ${g(m["Cross-Section Width"])}`,value:`${T(t.totalWidthKm,0)} km`},{labelHtml:`Highest Zone Avg. ${g(m["Highest Zone"])}`,value:`${T(t.peakM,0)} m`},...n!=null?[{labelHtml:`Arc Distance ${g(m["Arc Distance"])}`,value:`${T(n,0)} km`}]:[]])}
                </div>
              `:'<p class="hint">Add a mountain range to see the cross-section.</p>'}

              ${c.tectonics.inactiveProfiles.length?`
                <div class="subsection">
                  <h3>Inactive Ranges</h3>
                  <div class="cluster-table-wrap">
                    <table class="cluster-table">
                      <thead><tr><th>Type</th><th>Original</th><th>Age</th><th>Eroded Height</th></tr></thead>
                      <tbody>
                        ${c.tectonics.inactiveProfiles.map(o=>`<tr><td>${C(o.label)}</td><td>${T(o.originalHeightM,0)} m</td><td>${T(o.ageMyr,0)} Myr</td><td>${T(o.erodedHeightM,0)} m</td></tr>`).join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              `:""}

              ${c.tectonics.shieldProfiles.length?`
                <div class="subsection">
                  <h3>Shield Volcano Profiles</h3>
                  ${c.tectonics.shieldProfiles.map((o,b)=>`<canvas id="tecShieldCanvas${b}" class="tec-canvas" style="height:180px"></canvas>
                      ${V([{labelHtml:`Height ${g(m["Shield Height"])}`,value:`${T(o.heightM,0)} m`},{labelHtml:`Base Radius ${g(m["Base Radius"])}`,value:`${T(o.baseRadiusKm,0)} km`}])}`).join("")}
                </div>
              `:""}

              ${c.tectonics.riftProfiles.length?`
                <div class="subsection">
                  <h3>Rift Valley Profiles</h3>
                  ${c.tectonics.riftProfiles.map((o,b)=>`<canvas id="tecRiftCanvas${b}" class="tec-canvas" style="height:200px"></canvas>
                      ${V([{labelHtml:`Total Width ${g(m["Rift Total Width"])}`,value:`${T(o.totalWidthKm,0)} km`}])}`).join("")}
                </div>
              `:""}

              <div class="subsection">
                <h3>Ocean Depth Curve ${g(m["Ocean Depth Curve"])}</h3>
                <canvas id="tecOceanCanvas" class="tec-canvas"></canvas>
                ${V([{labelHtml:`Ridge Height ${g(m["Ridge Height"])}`,value:c.display.ridgeHeight},{labelHtml:`Max Ocean Depth ${g(m["Max Ocean Depth"])}`,value:c.display.maxOceanDepth},{labelHtml:`Spreading Rate ${g(m["Spreading Rate"])}`,value:c.display.spreadingRate}])}
              </div>

              <div class="subsection">
                <h3>Continental Margin ${g(m["Continental Margin"])}</h3>
                <canvas id="tecMarginCanvas" class="tec-canvas"></canvas>
                ${V([{labelHtml:`Total Width ${g(m["Margin Width"])}`,value:`${T(c.tectonics.margin.totalWidthKm,0)} km`}])}
              </div>`}function r(c,t,h,n){requestAnimationFrame(()=>{let p=c.querySelector("#tecMtnCanvas");p&&h&&we(p,h,t.tectonics.maxPeakHeightM,{isostasyMode:e.isostasyMode,arcDistanceKm:n});let o=c.querySelector("#tecOceanCanvas");o&&Me(o,t.tectonics.ocean.subsidence,e.ridgeHeightM);let b=c.querySelector("#tecMarginCanvas");b&&ke(b,t.tectonics.margin),t.tectonics.shieldProfiles.forEach((x,S)=>{let I=c.querySelector(`#tecShieldCanvas${S}`);I&&Re(I,x,t.tectonics.maxShieldHeightM)}),t.tectonics.riftProfiles.forEach((x,S)=>{let I=c.querySelector(`#tecRiftCanvas${S}`);I&&$e(I,x)})})}function M(){let c=E(),t=ve(c);if(t.unsupportedSurfaceMessage){let O=s.querySelector("#tecOutputs");O&&(O.innerHTML=`<div class="derived-readout">${C(t.unsupportedSurfaceMessage)}</div>`);return}let h=N(c)?.inputs?.tectonicRegime||"mobile",n=Z({gravityG:t.gravityG,tectonicRegime:h,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,ridgeHeightM:e.ridgeHeightM,spreadingRateFraction:e.spreadingRateFraction,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys,massEarth:t.massEarth,ageGyr:t.ageGyr,surfaceTempK:t.surfaceTempK,h2oPct:t.h2oPct,compositionClass:t.compositionClass,tidalHeatingWm2:t.tidalHeatingWm2,radioisotopeAbundance:t.radioisotopeAbundance}),p=Math.min(e.selectedRangeIdx,n.tectonics.mountainProfiles.length-1),o=n.tectonics.mountainProfiles[Math.max(0,p)]||null,b=o&&(o.type==="andean"||o.type==="laramide"),S=e.mountainRanges[Math.max(0,p)]?.slabAngleDeg??45,I=b?G(S):null,k=n.tectonics.ocean.spreadingRate,$=s.querySelector("#tecOutputs");if(!$)return;$.innerHTML=`${t.limitedSurfaceMessage?`<div class="derived-readout">${C(t.limitedSurfaceMessage)}</div>`:""}${fe(t)}${ye(t)}${u(n,o,p,I,t)}`,K($),U(s),r($,n,o,I);let H=s.querySelector("#tecSpreadingRate");H&&(H.value=Math.round(k.rateMmYr))}function y(){s.querySelectorAll(".tec-range-card[data-idx]").forEach(c=>{let t=Number(c.dataset.idx);c.classList.toggle("is-selected",t===e.selectedRangeIdx)})}function A(c){Number.isFinite(c)&&(e.selectedRangeIdx=Math.max(0,c),y(),M())}function R(){let c=E(),t=ve(c),h=N(c);if(t.unsupportedSurfaceMessage){s.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Tectonics</h1>
            <button id="tecTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${X({selected:h,ctx:t,unsupportedMessage:t.unsupportedSurfaceMessage})}
            ${Q()}
            ${ee(i,h,t)}
            ${F(B({id:"tectonicsUnsupportedState",title:"No compatible tectonic output",body:t.unsupportedSurfaceMessage,actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}
          </div>
        </div>
      </div>`,K(s);let w=s.querySelector("#tecPlanetSelect");w&&Y(w,i.map(v=>({value:v.id,label:v.name||v.inputs?.name||v.id,selected:v.id===h?.id})));return}let n=t.gravityG,p=N(c)?.inputs?.tectonicRegime||"mobile",o=Z({gravityG:n,tectonicRegime:p,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,ridgeHeightM:e.ridgeHeightM,spreadingRateFraction:e.spreadingRateFraction,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys,massEarth:t.massEarth,ageGyr:t.ageGyr,surfaceTempK:t.surfaceTempK,h2oPct:t.h2oPct,compositionClass:t.compositionClass,tidalHeatingWm2:t.tidalHeatingWm2,radioisotopeAbundance:t.radioisotopeAbundance}),b=Math.min(e.selectedRangeIdx,o.tectonics.mountainProfiles.length-1),x=o.tectonics.mountainProfiles[Math.max(0,b)]||null,S=x&&(x.type==="andean"||x.type==="laramide"),k=e.mountainRanges[Math.max(0,b)]?.slabAngleDeg??45,$=S?G(k):null,H=o.tectonics.ocean.spreadingRate;s.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Tectonics</h1>
            <button id="tecTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            <div class="hint">Model mountain ranges, ocean depth, continental margins, shield volcanoes, and rift valleys.</div>
            <p style="margin-top:8px">For an interactive 3D plate simulator with climate, erosion, and more, see <a href="https://the-world-crucible.fagothey.net/" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">The World Crucible</a>.</p>
            ${X({selected:h,ctx:t,model:o,regime:p})}
            ${Q()}
          </div>
        </div>

        <div class="grid-2">
          <div class="panel">
            <div class="panel__header"><h2>Inputs</h2></div>
            <div class="panel__body" id="tecInputs">

              ${ee(i,h,t)}

              <div class="kpi-grid">
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Max Peak Height ${g(m["Max Peak Height"])}</div>
                  <div class="kpi__value">${o.display.maxPeakHeight}</div>
                  <div class="kpi__meta">at ${T(n,2)} g</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Gravity ${g(m.Gravity)}</div>
                  <div class="kpi__value">${T(n,3)} g</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Max Shield Height ${g(m["Shield Volcano"])}</div>
                  <div class="kpi__value">${o.display.maxShieldHeight}</div>
                  <div class="kpi__meta">${p==="stagnant"?"stagnant lid (1.5\xD7)":p}</div>
                </div></div>
              </div>

              <details class="subsection" style="margin-top:8px">
                <summary><h3 style="display:inline">Planet Factors ${g(m["Planet Factors"])}</h3></summary>
                <div class="kpi-grid" style="margin-top:8px">
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Composition ${g(m.Composition)}</div>
                    <div class="kpi__value">${C(t.compositionClass)}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Volcanic Activity ${g(m["Volcanic Activity"])}</div>
                    <div class="kpi__value">${o.display.volcanicActivity}</div>
                    <div class="kpi__meta">${T(t.ageGyr,1)} Gyr age</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Erosion Rate ${g(m["Climate Erosion"])}</div>
                    <div class="kpi__value">${o.display.climateErosionRate}</div>
                    <div class="kpi__meta">${T(t.surfaceTempK,0)} K surface</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Elastic Lithosphere ${g(m["Elastic Lithosphere"])}</div>
                    <div class="kpi__value">${o.display.elasticLithosphere}</div>
                  </div></div>
                </div>
              </details>

              <div class="subsection">
                <h3>Active Mountain Ranges ${g(m["Mountain Type"])}</h3>
                <div id="tecRangeCards">
                  ${e.mountainRanges.map((w,v)=>`
                    <div class="tec-range-card ${v===b?"is-selected":""}" data-idx="${v}">
                      <div class="tec-range-card__header">
                        <select class="tec-type-select" data-idx="${v}">
                          ${ue.map(L=>`<option value="${L.key}" ${w.type===L.key?"selected":""}>${C(L.label)}</option>`).join("")}
                        </select>
                        <button class="tec-range-remove" data-idx="${v}" title="Remove range">&times;</button>
                      </div>
                      ${w.type==="andean"||w.type==="laramide"?`
                        <div class="form-row">
                          <div><div class="label">Slab Angle ${g(m["Slab Angle"])} <span class="unit">\xB0</span></div></div>
                          <div class="input-pair">
                            <input type="number" class="tec-slab-angle" data-idx="${v}" value="${w.slabAngleDeg||45}" min="10" max="90" step="1" />
                            <input type="range" class="tec-slab-angle-slider" data-idx="${v}" value="${w.slabAngleDeg||45}" min="10" max="90" step="1" />
                          </div>
                        </div>
                        <div class="kpi" style="margin-top:4px">
                          <div class="kpi__label">Arc Distance ${g(m["Arc Distance"])}</div>
                          <div class="kpi__value">${T(G(w.slabAngleDeg||45),0)} km</div>
                        </div>
                      `:""}
                      <div class="form-row">
                        <div><div class="label">Convergence Rate ${g(m["Convergence Rate"])} <span class="unit">mm/yr</span></div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-convergence" data-idx="${v}" value="${w.convergenceMmYr||50}" min="10" max="100" step="1" />
                          <input type="range" class="tec-convergence-slider" data-idx="${v}" value="${w.convergenceMmYr||50}" min="10" max="100" step="1" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddRange" class="tec-add-btn">+ Add Range</button>
              </div>

              <div class="subsection">
                <h3>Inactive Ranges ${g(m["Inactive Range"])}</h3>
                <div id="tecInactiveCards">
                  ${e.inactiveRanges.map((w,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <select class="tec-inactive-type" data-idx="${v}">
                          ${ue.map(L=>`<option value="${L.key}" ${w.type===L.key?"selected":""}>${C(L.label)}</option>`).join("")}
                        </select>
                        <button class="tec-inactive-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Original Height <span class="unit">m</span> ${g(m["Original Height"])}</div></div>
                        <input type="number" class="tec-inactive-height" data-idx="${v}" value="${w.originalHeightM||5e3}" min="0" max="100000" step="100" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Age <span class="unit">Myr</span> ${g(m["Range Age"])}</div></div>
                        <input type="number" class="tec-inactive-age" data-idx="${v}" value="${w.ageMyr||0}" min="0" max="10000" step="1" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Erosion Rate ${g(m["Erosion Rate"])} <span class="unit">m/Myr</span></div></div>
                        <input type="number" class="tec-inactive-erosion" data-idx="${v}" value="${w.erosionRate||5}" min="0" max="100" step="0.5" />
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddInactive" class="tec-add-btn">+ Add Inactive Range</button>
              </div>

              <div class="subsection">
                <h3>Shield Volcanoes ${g(m["Shield Volcano"])}</h3>
                <div id="tecShieldCards">
                  ${e.shieldVolcanoes.map((w,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <span class="label">Shield ${v+1}</span>
                        <button class="tec-shield-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Height <span class="unit">m</span> ${g(m["Shield Height"])}</div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-shield-height" data-idx="${v}" value="${w.heightM||5e3}" min="100" max="${Math.round(o.tectonics.maxShieldHeightM)}" step="100" />
                          <input type="range" class="tec-shield-height-slider" data-idx="${v}" value="${w.heightM||5e3}" min="100" max="${Math.round(o.tectonics.maxShieldHeightM)}" step="100" />
                        </div>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Slope <span class="unit">\xB0</span> ${g(m["Shield Slope"])}</div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-shield-slope" data-idx="${v}" value="${w.slopeAngleDeg||5}" min="1" max="15" step="0.5" />
                          <input type="range" class="tec-shield-slope-slider" data-idx="${v}" value="${w.slopeAngleDeg||5}" min="1" max="15" step="0.5" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddShield" class="tec-add-btn">+ Add Shield Volcano</button>
              </div>

              <div class="subsection">
                <h3>Rift Valleys ${g(m["Rift Valley"])}</h3>
                <div id="tecRiftCards">
                  ${e.riftValleys.map((w,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <span class="label">Rift ${v+1}</span>
                        <button class="tec-rift-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Width <span class="unit">km</span> ${g(m["Graben Width"])}</div></div>
                        <input type="number" class="tec-rift-width" data-idx="${v}" value="${w.grabenWidthKm||50}" min="5" max="300" step="5" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Depth <span class="unit">m</span> ${g(m["Graben Depth"])}</div></div>
                        <input type="number" class="tec-rift-depth" data-idx="${v}" value="${w.grabenDepthM||1e3}" min="50" max="5000" step="50" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Fault Angle <span class="unit">\xB0</span> ${g(m["Fault Angle"])}</div></div>
                        <input type="number" class="tec-rift-angle" data-idx="${v}" value="${w.faultAngleDeg||60}" min="20" max="80" step="1" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Volcanic Fill <span class="unit">m</span> ${g(m["Volcanic Fill"])}</div></div>
                        <input type="number" class="tec-rift-fill" data-idx="${v}" value="${w.volcanicFillM||0}" min="0" max="5000" step="50" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Shoulder Height <span class="unit">m</span> ${g(m["Shoulder Height"])}</div></div>
                        <input type="number" class="tec-rift-shoulder" data-idx="${v}" value="${w.shoulderHeightM||0}" min="0" max="3000" step="50" />
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddRift" class="tec-add-btn">+ Add Rift Valley</button>
              </div>

              <div class="subsection">
                <h3>Oceans</h3>
                <div class="form-row">
                  <div><div class="label">Mid-Ocean Ridge Height ${g(m["Mid-Ocean Ridge Height"])} <span class="unit">m</span></div></div>
                  <div class="input-pair">
                    <input id="tecRidgeHeight" type="number" min="1000" max="5000" step="100" value="${e.ridgeHeightM}" />
                    <input id="tecRidgeHeight_slider" type="range" min="1000" max="5000" step="100" value="${e.ridgeHeightM}" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Spreading Rate ${g(m["Spreading Rate"])} <span class="unit">mm/yr</span></div></div>
                  <div class="input-pair">
                    <input id="tecSpreadingRate" type="number" min="${H.min}" max="${Math.max(H.max,1)}" step="1" value="${Math.round(H.rateMmYr)}" readonly />
                    <input id="tecSpreadingRate_slider" type="range" min="0" max="100" step="1" value="${Math.round(e.spreadingRateFraction*100)}" ${H.min===H.max?"disabled":""} />
                  </div>
                </div>
                <div class="kpi" style="margin-top:4px">
                  <div class="kpi__meta">${C(H.label)} (${C(p)})</div>
                </div>
              </div>

              <div class="subsection">
                <h3>Continental Margin ${g(m["Continental Margin"])}</h3>
                <div class="form-row">
                  <div><div class="label">Shelf Width <span class="unit">km</span> ${g(m["Shelf Width"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-shelf-w" value="${e.margin.shelfWidthKm}" min="1" max="500" step="5" />
                    <input type="range" class="tec-margin-shelf-w-slider" value="${e.margin.shelfWidthKm}" min="1" max="500" step="5" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Shelf Depth <span class="unit">m</span> ${g(m["Shelf Depth"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-shelf-d" value="${e.margin.shelfDepthM}" min="10" max="500" step="5" />
                    <input type="range" class="tec-margin-shelf-d-slider" value="${e.margin.shelfDepthM}" min="10" max="500" step="5" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Slope Angle <span class="unit">\xB0</span> ${g(m["Margin Slope"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-slope" value="${e.margin.slopeAngleDeg}" min="0.5" max="15" step="0.5" />
                    <input type="range" class="tec-margin-slope-slider" value="${e.margin.slopeAngleDeg}" min="0.5" max="15" step="0.5" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div class="panel">
            <div class="panel__header"><h2>Outputs</h2></div>
            <div class="panel__body" id="tecOutputs">
              ${t.limitedSurfaceMessage?`<div class="derived-readout">${C(t.limitedSurfaceMessage)}</div>`:""}
              ${fe(t)}
              ${ye(t)}
              ${u(o,x,b,$,t)}
            </div>
          </div>
        </div>

      </div>`,K(s),U(s);let O=s.querySelector("#tecPlanetSelect");O&&Y(O,i.map(w=>({value:w.id,label:w.name||w.inputs?.name||w.id,selected:w.id===h?.id}))),r(s,o,x,$)}R();let D=document.createElement("div");document.body.appendChild(D);let P=se({steps:Te,storageKey:"worldsmith.tec.tutorial",container:D});s.addEventListener("click",c=>{c.target.closest("#tecTutorials")&&P?.toggle()});let _=new MutationObserver(()=>{s.isConnected||(P?.destroy(),D.remove(),_.disconnect())});return _.observe(s.parentNode||document.body,{childList:!0}),s.addEventListener("input",c=>{let t=c.target,h=t.closest(".input-pair");if(h&&t.id!=="tecSpreadingRate_slider"){let n=h.querySelector(t.type==="range"?'input[type="number"]':'input[type="range"]');n&&n!==t&&(n.value=t.value)}if(t.id==="tecRidgeHeight"||t.id==="tecRidgeHeight_slider"){e.ridgeHeightM=Number(t.value)||2600,d(),M();return}if(t.classList.contains("tec-inactive-height")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].originalHeightM=Number(t.value)||0,d(),M());return}if(t.classList.contains("tec-inactive-age")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].ageMyr=Number(t.value)||0,d(),M());return}if(t.classList.contains("tec-inactive-erosion")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].erosionRate=Number(t.value)||5,d(),M());return}if(t.classList.contains("tec-slab-angle")||t.classList.contains("tec-slab-angle-slider")){let n=Number(t.dataset.idx);e.mountainRanges[n]&&(e.mountainRanges[n].slabAngleDeg=Number(t.value)||45,d(),M());return}if(t.classList.contains("tec-convergence")||t.classList.contains("tec-convergence-slider")){let n=Number(t.dataset.idx);e.mountainRanges[n]&&(e.mountainRanges[n].convergenceMmYr=Number(t.value)||50,d(),M());return}if(t.id==="tecSpreadingRate_slider"){e.spreadingRateFraction=Number(t.value)/100,d(),M();return}if(t.classList.contains("tec-margin-shelf-w")||t.classList.contains("tec-margin-shelf-w-slider")){e.margin.shelfWidthKm=Number(t.value)||80,d(),M();return}if(t.classList.contains("tec-margin-shelf-d")||t.classList.contains("tec-margin-shelf-d-slider")){e.margin.shelfDepthM=Number(t.value)||130,d(),M();return}if(t.classList.contains("tec-margin-slope")||t.classList.contains("tec-margin-slope-slider")){e.margin.slopeAngleDeg=Number(t.value)||3.5,d(),M();return}if(t.classList.contains("tec-shield-height")||t.classList.contains("tec-shield-height-slider")){let n=Number(t.dataset.idx);e.shieldVolcanoes[n]&&(e.shieldVolcanoes[n].heightM=Number(t.value)||5e3,d(),M());return}if(t.classList.contains("tec-shield-slope")||t.classList.contains("tec-shield-slope-slider")){let n=Number(t.dataset.idx);e.shieldVolcanoes[n]&&(e.shieldVolcanoes[n].slopeAngleDeg=Number(t.value)||5,d(),M());return}if(t.classList.contains("tec-rift-width")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].grabenWidthKm=Number(t.value)||50,d(),M());return}if(t.classList.contains("tec-rift-depth")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].grabenDepthM=Number(t.value)||1e3,d(),M());return}if(t.classList.contains("tec-rift-angle")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].faultAngleDeg=Number(t.value)||60,d(),M());return}if(t.classList.contains("tec-rift-fill")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].volcanicFillM=Number(t.value)||0,d(),M());return}if(t.classList.contains("tec-rift-shoulder")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].shoulderHeightM=Number(t.value)||0,d(),M());return}}),s.addEventListener("change",c=>{let t=c.target;if(t.id==="tecPlanetSelect"){ie(t.value),R();return}if(t.classList.contains("tec-type-select")){let h=Number(t.dataset.idx);e.mountainRanges[h]&&(e.mountainRanges[h].type=t.value,e.selectedRangeIdx=h,d(),R());return}if(t.classList.contains("tec-inactive-type")){let h=Number(t.dataset.idx);e.inactiveRanges[h]&&(e.inactiveRanges[h].type=t.value,d(),R());return}}),s.addEventListener("click",c=>{let t=c.target;if(t.classList.contains("tec-iso-btn")){e.isostasyMode=t.dataset.iso||"off",d(),R();return}if(t.id==="tecAddRange"){let n="mr"+Math.random().toString(36).slice(2,7);e.mountainRanges.push({id:n,type:"andean",label:"Range",widths:{},heights:{},slabAngleDeg:45,convergenceMmYr:50}),e.selectedRangeIdx=e.mountainRanges.length-1,d(),R();return}if(t.classList.contains("tec-range-remove")){let n=Number(t.dataset.idx);e.mountainRanges.splice(n,1),e.selectedRangeIdx=Math.min(e.selectedRangeIdx,Math.max(0,e.mountainRanges.length-1)),d(),R();return}if(t.id==="tecAddInactive"){let n="ir"+Math.random().toString(36).slice(2,7);e.inactiveRanges.push({id:n,type:"ural",originalHeightM:5e3,ageMyr:200,erosionRate:5}),d(),R();return}if(t.classList.contains("tec-inactive-remove")){let n=Number(t.dataset.idx);e.inactiveRanges.splice(n,1),d(),R();return}if(t.classList.contains("tec-range-tab")){A(Number(t.dataset.idx));return}if(t.id==="tecAddShield"){e.shieldVolcanoes.push({heightM:5e3,slopeAngleDeg:5}),d(),R();return}if(t.classList.contains("tec-shield-remove")){e.shieldVolcanoes.splice(Number(t.dataset.idx),1),d(),R();return}if(t.id==="tecAddRift"){e.riftValleys.push({grabenWidthKm:50,grabenDepthM:1e3,faultAngleDeg:60,volcanicFillM:0,shoulderHeightM:0}),d(),R();return}if(t.classList.contains("tec-rift-remove")){e.riftValleys.splice(Number(t.dataset.idx),1),d(),R();return}let h=t.closest(".tec-range-card[data-idx]");if(h&&!t.classList.contains("tec-range-remove")&&!t.closest("select")){A(Number(h.dataset.idx));return}}),()=>{}}export{ve as getPlanetTectonicContext,Ge as initTectonicsPage};
