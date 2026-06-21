import{a as he,c as F,d as ue,f as B}from"./chunk-KD5CBWLO.js";import{a as N,b as le,c as ce,d as re,e as U}from"./chunk-YAWL2UWM.js";import{a as de,b as pe}from"./chunk-SHHWHPOD.js";import{f as se,g as oe}from"./chunk-TML2OYHE.js";import"./chunk-7QO5F3R4.js";import"./chunk-NDMX2VLS.js";import"./chunk-5YVVLRFP.js";import"./chunk-MXEPBJGN.js";import"./chunk-HLZ2ABGO.js";import{b as V}from"./chunk-X5HJXCPV.js";import"./chunk-UN6CKA7Q.js";import"./chunk-A4SFFHC6.js";import"./chunk-OZXGRG3H.js";import{c as Y}from"./chunk-DFN46JRM.js";import{a as u,d as K,e as ne}from"./chunk-4HEO5JKX.js";import{e as j}from"./chunk-XMLMEZIZ.js";import{a as A}from"./chunk-7PVDVLB6.js";import{Ka as te,La as E,Ma as ae,V as q,ib as ie,za as I}from"./chunk-F5HVNKDQ.js";import"./chunk-IHPUCFYV.js";import"./chunk-WNGVR2CK.js";import"./chunk-PEDZU4MZ.js";import"./chunk-32DKD6ZO.js";import{j as w}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";var m={"Max Peak Height":`Maximum possible mountain peak height, inversely proportional to surface gravity. Formula: H_max = C / g, where C depends on crustal composition.

Earth-like: C = 9,267 m. Iron worlds: 12,000 m. Ice worlds: 3,000 m.

Lower gravity allows taller mountains (Mars: Olympus Mons \u2248 21,900 m at 0.38 g).`,"Mountain Type":`Convergent-boundary mountain range classification based on tectonic setting.

Andean: oceanic\u2013continental subduction (high volcanic arc + wide plateau). Laramide: flat-slab subduction (broad inland deformation, e.g. Rocky Mountains). Ural: continent\u2013continent collision (older, lower, no active volcanism). Himalayan: active continent\u2013continent collision (highest peaks, wide plateau).`,"Erosion Rate":`Rate at which inactive mountain ranges lose height over geological time.

Typical Earth value: ~5 m/Myr for exposed granite peaks. Arid climates erode slower; wet climates erode faster.`,"Mid-Ocean Ridge Height":`Elevation of newly-formed oceanic crust at the spreading centre, measured from the abyssal plain reference.

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

Scales shield volcano heights and magmatic rift fill.`,"Climate Erosion":`Erosion rate adjusted for surface temperature and atmospheric moisture. Warmer, wetter worlds erode faster than cold, dry ones.

Applied to inactive mountain range height loss over time.`,"Elastic Lithosphere":`Thickness of the elastic lithosphere (km). Thicker lithosphere supports taller volcanic edifices via flexural strength.

Grows with planet age and mass; thins with tidal heating.`,"Arc Distance":`Distance from the oceanic trench to the volcanic arc (km). Computed as slab depth / tan(slab angle).

Steeper slab angles produce arcs closer to the trench.`,"Original Height":"Starting elevation of the mountain range before erosion began (m). Height decreases linearly at the erosion rate over geological time.","Range Age":"Time since the mountain range stopped actively forming (Myr). Multiplied by erosion rate to compute cumulative height loss.","Shield Height":"Peak height of this shield volcano (m). Clamped to the planet\u2019s max shield height, which depends on gravity, lithosphere thickness, and basal spreading limits.","Shield Slope":`Flank slope angle (\xB0). Steeper slopes produce a narrower base radius. Typical Earth shield volcanoes: 2\u201312\xB0.

Base radius = height / tan(slope).`,"Graben Width":`Total width of the rift graben (km). The down-dropped block between the bounding normal faults.

Earth example: East African Rift graben = 50\u2013100 km.`,"Graben Depth":`Depth of the graben floor below the surrounding surface (m). Controlled by fault throw and extension amount.

Earth example: East African Rift = 1,000\u20132,000 m.`,"Fault Angle":`Dip angle of the bounding normal faults (\xB0). Steeper faults produce narrower grabens for the same depth.

Typical range: 45\u201375\xB0. Earth average: ~60\xB0.`,"Volcanic Fill":"Thickness of volcanic lava fill on the rift floor (m). Active rifts often have basaltic lava lakes and flows that partially fill the graben.","Shoulder Height":"Elevation of the uplifted rift shoulders above the surrounding terrain (m). Caused by isostatic and flexural rebound of the footwall blocks flanking the graben.","Shelf Width":`Width of the continental shelf (km). The gently sloping submerged extension of the continent.

Earth range: 10 km (active margins) to 300+ km (passive margins). Average: ~80 km.`,"Shelf Depth":`Depth at the shelf break where the continental slope begins (m). Controlled by glacioeustatic sea-level history.

Earth: ~130 m (Pleistocene lowstand).`,"Margin Slope":`Angle of the continental slope connecting the shelf break to the continental rise (\xB0).

Earth average: ~3.5\xB0. Steeper at active margins, gentler at passive margins.`,"Ridge Height":"Elevation of newly-formed crust at the mid-ocean ridge above the abyssal plain (m). Starting point for the ocean depth curve.","Max Ocean Depth":"Maximum ocean floor depth reached by old oceanic crust (m). Determined by the plate-cooling model: crust subsides as it ages and cools, flattening at ~80\u2013100 Myr.","Inferred Ocean Coverage":"Liquid-ocean surface fraction inherited from the Planet solver. It is inferred from water inventory, gravity-scaled relief, basin capacity, and climate state; tectonics uses this science context separately from authored visual/population overrides.","Authored Ocean Override":"Manual ocean percentage from Population or visual authoring. When set, it changes authored land/ocean split outputs but does not rewrite the inferred science coverage used by climate, carbon-cycle, and tectonic context.","Exposed Land":"Estimated unflooded surface fraction after inferred basin fill. This is the land context seen by downstream science models unless a page explicitly advertises an authored override.","Cross-Section Width":"Total width of the mountain range cross-section from forearc to back-arc (km). Sum of all tectonic zone widths.","Highest Zone":"Average elevation of the tallest tectonic zone in the cross-section (m). Individual peaks within a zone can exceed this average, up to the max peak height.","Margin Width":"Total width from the coast to the abyssal plain (km). Sum of shelf, slope, and continental rise widths.","Base Radius":`Horizontal distance from the summit to the base of the shield volcano (km). Derived from height and slope angle: R = H / tan(\u03B8).

Shallower slopes produce much wider bases.`,"Rift Total Width":"Total width of the rift valley cross-section (km), including the graben floor, both fault scarps, volcanic fill, and uplifted shoulders."},Z=["var(--accent)","var(--muted)","#7eb8a0","var(--warn)","#c49a8b","#8a9ac4"];function xe(s){let l=getComputedStyle(s);return Z.map(i=>{if(i.startsWith("var(")){let a=i.slice(4,-1);return l.getPropertyValue(a).trim()||i}return i})}var ge=he();function me(s){let l={gravityG:1,massEarth:1,ageGyr:4.6,surfaceTempK:288,h2oPct:0,compositionClass:"Earth-like",tidalHeatingWm2:0,radioisotopeAbundance:1,inferredOceanCoverageDisplay:"70.0%",exposedLandDisplay:"30.0%",coverageConfidenceDisplay:"Fallback confidence",surfaceOceanCoverageReason:"fallback",authoredOceanOverrideDisplay:"Auto",authoredOceanOverrideActive:!1},i=E(s);if(!i)return l;let a=q(s,`planet:${i.id}`)||q(s,i.id),e=a?pe(s,a).model||a:null,d=e?se(e,"tectonics"):null,g=d&&d.status!=="full"?oe(e,"tectonics"):"";if(d?.status==="none")return{...l,unsupportedSurfaceMessage:g};let{model:c,starConfig:k}=de(s,i);if(!c?.derived)return l;let f=s.population?.oceanPctOverride,T=f==null||f===""?null:Number(s.population.oceanPctOverride),S=Number.isFinite(T),_=S?Math.max(0,Math.min(100,T)):null;return{gravityG:c.derived.gravityG||1,massEarth:c.inputs?.massEarth||1,ageGyr:Number(k?.ageGyr)||4.6,surfaceTempK:c.derived.surfaceTempK||288,h2oPct:c.derived.hydrosphere?.surfaceAccessibleLiquidFraction!=null?c.derived.hydrosphere.surfaceAccessibleLiquidFraction*100:c.inputs?.h2oPct||0,compositionClass:c.derived.compositionClass||"Earth-like",tidalHeatingWm2:c.derived.planetTidalHeatingWm2||0,radioisotopeAbundance:c.derived.radioisotopeAbundance??1,geodynamicsContext:c.derived.geodynamicsContext||null,inferredOceanCoverageDisplay:c.display?.inferredOceanCoverage||"n/a",exposedLandDisplay:c.display?.exposedLand||"n/a",coverageConfidenceDisplay:c.display?.surfaceOceanCoverageConfidence||"Unknown confidence",surfaceOceanCoverageReason:c.display?.surfaceOceanCoverageReason||c.derived.hydrosphere?.surfaceOceanCoverageContext?.source||"",authoredOceanOverrideDisplay:S?`${w(_,1)}%`:"Auto",authoredOceanOverrideActive:S,limitedSurfaceMessage:d?.status==="limited"?g:""}}function ve(s){let l=s?.geodynamicsContext;if(!l?.outputs)return"";let i=l.outputs,a=Array.isArray(l.limitingFactors)&&l.limitingFactors.length?` Limits: ${l.limitingFactors.join("; ")}`:"";return`<div class="derived-readout">Geodynamics: ${A(i.tectonicRegime||"unknown")}; heat ${A(i.internalHeatClass||"unknown")}; convection ${A(i.convectiveVigorClass||"unknown")}; weathering ${A(i.weatheringFeedbackClass||"unknown")}.${A(a)}</div>`}function fe(s){if(!s)return"";let l=s.authoredOceanOverrideActive?`Authored Ocean Override: ${s.authoredOceanOverrideDisplay} (manual land/ocean authoring; inferred science coverage remains separate)`:"Authored Ocean Override: Auto (uses inferred coverage)",i=s.surfaceOceanCoverageReason?`; class ${A(s.surfaceOceanCoverageReason)}`:"";return`<div class="derived-readout">Surface ocean coverage: inferred ${A(s.inferredOceanCoverageDisplay||"n/a")}; exposed land ${A(s.exposedLandDisplay||"n/a")}; ${A(s.coverageConfidenceDisplay||"Unknown confidence")}${i}. ${A(l)}</div>`}var be=["#5b9bd5","#3a7cc4","#2a5ea0","#1e3f6f"];function $e(s,l,i,a={}){let e=s.getContext("2d"),d=window.devicePixelRatio||1,g=s.clientWidth,c=s.clientHeight;s.width=g*d,s.height=c*d,e.scale(d,d);let k=xe(s),f={top:24,bottom:36,left:56,right:16},T=g-f.left-f.right,S=c-f.top-f.bottom,P=a.isostasyMode==="airy"||a.isostasyMode==="pratt"?Math.round(S*.2):0,H=S-P,r=l.totalWidthKm||1,t=i*1.15,p=T/r,n=H/t,h=getComputedStyle(s).getPropertyValue("color")||"#ccc",o=getComputedStyle(s).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";e.clearRect(0,0,g,c),e.strokeStyle=o,e.lineWidth=.5;let b=z(t,5);for(let R=0;R<=t;R+=b){let M=f.top+H-R*n;e.beginPath(),e.moveTo(f.left,M),e.lineTo(f.left+T,M),e.stroke(),e.fillStyle=h,e.font="10px var(--font-mono, monospace)",e.textAlign="right",e.fillText(w(R,0),f.left-4,M+3)}let y=z(r,5);e.textAlign="center";for(let R=0;R<=r;R+=y){let M=f.left+R*p;e.fillStyle=h,e.font="10px var(--font-mono, monospace)",e.fillText(w(R,0),M,c-f.bottom+16)}e.save(),e.fillStyle=h,e.font="11px var(--font-mono, monospace)",e.textAlign="center",e.fillText("Width (km)",f.left+T/2,c-4),e.save(),e.translate(12,f.top+H/2),e.rotate(-Math.PI/2),e.fillText("Height (m)",0,0),e.restore(),e.restore();let x=f.top+H;e.strokeStyle="rgba(100,180,255,0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(f.left,x),e.lineTo(f.left+T,x),e.stroke(),e.setLineDash([]);let L=f.top+H-i*n;e.strokeStyle="rgba(255,100,100,0.5)",e.lineWidth=1,e.setLineDash([6,3]),e.beginPath(),e.moveTo(f.left,L),e.lineTo(f.left+T,L),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(255,100,100,0.7)",e.font="10px var(--font-mono, monospace)",e.textAlign="right",e.fillText("Max "+w(i,0)+" m",f.left+T-2,L-4);for(let R=0;R<l.zones.length;R++){let M=l.zones[R],C=f.left+M.x*p,D=M.width*p,$=M.height*n;if(e.fillStyle=k[R%k.length],e.globalAlpha=.5,M.taper&&M.taperToPeak)e.beginPath(),e.moveTo(C,x),e.lineTo(C,x-M.minHeight*n),e.lineTo(C+D,x-$),e.lineTo(C+D,x),e.closePath(),e.fill();else if(M.taper&&M.taperFromPeak)e.beginPath(),e.moveTo(C,x),e.lineTo(C,x-$),e.lineTo(C+D,x-M.minHeight*n),e.lineTo(C+D,x),e.closePath(),e.fill();else if(M.taper){let v=R>0?l.zones[R-1]:null,O=R<l.zones.length-1?l.zones[R+1]:null,W=v?v.taperFromPeak?v.minHeight:v.height:0,G=O?O.taperToPeak?O.minHeight:O.height:0;e.beginPath(),e.moveTo(C,x),e.lineTo(C,x-W*n),e.lineTo(C+D,x-G*n),e.lineTo(C+D,x),e.closePath(),e.fill()}else e.fillRect(C,x-$,D,$);if(e.globalAlpha=1,D>30){let v=$;if(M.taper&&!M.taperToPeak&&!M.taperFromPeak){let O=R>0?l.zones[R-1]:null,W=R<l.zones.length-1?l.zones[R+1]:null,G=O?O.taperFromPeak?O.minHeight:O.height:0,ye=W?W.taperToPeak?W.minHeight:W.height:0;v=(G+ye)/2*n}e.fillStyle=h,e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText(M.name,C+D/2,x-v-4)}}if(P>0&&(e.fillStyle="rgba(139,94,60,0.06)",e.fillRect(f.left,x,T,P)),a.isostasyMode==="airy")for(let R=0;R<l.zones.length;R++){let M=l.zones[R];if(M.height<=0)continue;let D=ue(M.height)*n,$=f.left+M.x*p,v=M.width*p;e.fillStyle="#8b5e3c",e.globalAlpha=.35,e.fillRect($,x,v,Math.min(D,P)),e.globalAlpha=1}else if(a.isostasyMode==="pratt"){let R=x+P*.7;e.strokeStyle="#8b5e3c",e.lineWidth=1.5,e.setLineDash([4,3]),e.beginPath(),e.moveTo(f.left,R),e.lineTo(f.left+T,R),e.stroke(),e.setLineDash([])}if(a.arcDistanceKm!=null&&a.arcDistanceKm<=r){let R=f.left+a.arcDistanceKm*p;e.strokeStyle="rgba(255,80,80,0.7)",e.lineWidth=1.5,e.setLineDash([3,3]),e.beginPath(),e.moveTo(R,f.top),e.lineTo(R,x),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(255,80,80,0.85)",e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText("Arc "+w(a.arcDistanceKm,0)+" km",R,f.top+10)}}function ke(s,l,i){let a=s.getContext("2d"),e=window.devicePixelRatio||1,d=s.clientWidth,g=s.clientHeight;s.width=d*e,s.height=g*e,a.scale(e,e);let c={top:20,bottom:36,left:56,right:16},k=d-c.left-c.right,f=g-c.top-c.bottom,T=l[l.length-1]?.ageMyr||1e3,S=7e3,_=k/T,P=f/S,H=getComputedStyle(s).getPropertyValue("color")||"#ccc",r=getComputedStyle(s).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";a.clearRect(0,0,d,g),a.strokeStyle=r,a.lineWidth=.5;let t=1e3;for(let o=0;o<=S;o+=t){let b=c.top+o*P;a.beginPath(),a.moveTo(c.left,b),a.lineTo(c.left+k,b),a.stroke(),a.fillStyle=H,a.font="10px var(--font-mono, monospace)",a.textAlign="right",a.fillText(w(o,0),c.left-4,b+3)}let p=z(T,5);a.textAlign="center";for(let o=0;o<=T;o+=p){let b=c.left+o*_;a.fillStyle=H,a.font="10px var(--font-mono, monospace)",a.fillText(w(o,0),b,g-c.bottom+16)}a.fillStyle=H,a.font="11px var(--font-mono, monospace)",a.textAlign="center",a.fillText("Crust Age (Myr)",c.left+k/2,g-4),a.save(),a.translate(12,c.top+f/2),a.rotate(-Math.PI/2),a.fillText("Depth (m)",0,0),a.restore();let n=c.top+i*P;a.strokeStyle="rgba(100,200,255,0.5)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(c.left,n),a.lineTo(c.left+k,n),a.stroke(),a.setLineDash([]),a.fillStyle="rgba(100,200,255,0.7)",a.font="10px var(--font-mono, monospace)",a.textAlign="left",a.fillText("Ridge "+w(i,0)+" m",c.left+4,n-4);let h=c.top+6400*P;a.strokeStyle="rgba(255,150,100,0.5)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(c.left,h),a.lineTo(c.left+k,h),a.stroke(),a.setLineDash([]),a.fillStyle="rgba(255,150,100,0.7)",a.font="10px var(--font-mono, monospace)",a.textAlign="left",a.fillText("Max 6,400 m",c.left+4,h-4),a.strokeStyle="var(--accent, #66aaff)",a.lineWidth=2,a.beginPath();for(let o=0;o<l.length;o++){let b=l[o],y=c.left+b.ageMyr*_,x=c.top+b.depthM*P;o===0?a.moveTo(y,x):a.lineTo(y,x)}a.stroke(),a.fillStyle="rgba(30,90,160,0.15)",a.beginPath(),a.moveTo(c.left,c.top);for(let o of l)a.lineTo(c.left+o.ageMyr*_,c.top+o.depthM*P);a.lineTo(c.left+k,c.top),a.closePath(),a.fill()}function z(s,l){let i=s/l,a=Math.pow(10,Math.floor(Math.log10(i))),e=i/a,d;return e<=1.5?d=1:e<=3.5?d=2:e<=7.5?d=5:d=10,d*a}function Re(s,l){let i=s.getContext("2d"),a=window.devicePixelRatio||1,e=s.clientWidth,d=s.clientHeight;s.width=e*a,s.height=d*a,i.scale(a,a);let g={top:20,bottom:36,left:56,right:16},c=e-g.left-g.right,k=d-g.top-g.bottom,f=l.totalWidthKm||500,T=5500,S=c/f,_=k/T,P=getComputedStyle(s).getPropertyValue("color")||"#ccc",H=getComputedStyle(s).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";i.clearRect(0,0,e,d),i.strokeStyle=H,i.lineWidth=.5;let r=1e3;for(let p=0;p<=T;p+=r){let n=g.top+p*_;i.beginPath(),i.moveTo(g.left,n),i.lineTo(g.left+c,n),i.stroke(),i.fillStyle=P,i.font="10px var(--font-mono, monospace)",i.textAlign="right",i.fillText(w(p,0),g.left-4,n+3)}let t=z(f,5);i.textAlign="center";for(let p=0;p<=f;p+=t){let n=g.left+p*S;i.fillStyle=P,i.font="10px var(--font-mono, monospace)",i.fillText(w(p,0),n,d-g.bottom+16)}i.fillStyle=P,i.font="11px var(--font-mono, monospace)",i.textAlign="center",i.fillText("Distance from Coast (km)",g.left+c/2,d-4),i.save(),i.translate(12,g.top+k/2),i.rotate(-Math.PI/2),i.fillText("Depth (m)",0,0),i.restore();for(let p=0;p<l.segments.length;p++){let n=l.segments[p],h=g.left+n.startKm*S,o=g.left+n.endKm*S,b=g.top+n.startM*_,y=g.top+n.endM*_;i.fillStyle=be[p%be.length],i.globalAlpha=.3,i.beginPath(),i.moveTo(h,g.top),i.lineTo(h,b),i.lineTo(o,y),i.lineTo(o,g.top),i.closePath(),i.fill(),i.globalAlpha=1;let x=(h+o)/2;o-h>30&&(i.fillStyle=P,i.font="9px var(--font-mono, monospace)",i.textAlign="center",i.fillText(n.name,x,g.top+14))}i.strokeStyle="var(--accent, #66aaff)",i.lineWidth=2,i.beginPath();for(let p=0;p<l.points.length;p++){let n=l.points[p],h=g.left+n.distKm*S,o=g.top+n.depthM*_;p===0?i.moveTo(h,o):i.lineTo(h,o)}i.stroke()}function Se(s,l,i){let a=s.getContext("2d"),e=window.devicePixelRatio||1,d=s.clientWidth,g=s.clientHeight;s.width=d*e,s.height=g*e,a.scale(e,e);let c={top:20,bottom:36,left:56,right:16},k=d-c.left-c.right,f=g-c.top-c.bottom,T=15,_=f/((i||1e4)*1.15),P=_*1e3/T,H=l.baseRadiusKm*2.2*P,r=H>k?k/H:1,t=_*r,p=P*r,n=getComputedStyle(s).getPropertyValue("color")||"#ccc";a.clearRect(0,0,d,g);let h=c.top+f;a.strokeStyle="rgba(100,180,255,0.3)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(c.left,h),a.lineTo(c.left+k,h),a.stroke(),a.setLineDash([]);let o=c.left+k/2;a.fillStyle="#c49a8b",a.globalAlpha=.5,a.beginPath(),a.moveTo(o-l.baseRadiusKm*p,h);for(let y of l.points)a.lineTo(o-y.rKm*p,h-y.hM*t);for(let y=l.points.length-1;y>=0;y--){let x=l.points[y];a.lineTo(o+x.rKm*p,h-x.hM*t)}a.lineTo(o+l.baseRadiusKm*p,h),a.closePath(),a.fill(),a.globalAlpha=1,a.strokeStyle="var(--accent, #66aaff)",a.lineWidth=1.5,a.beginPath(),a.moveTo(o-l.baseRadiusKm*p,h);for(let y of l.points)a.lineTo(o-y.rKm*p,h-y.hM*t);for(let y=l.points.length-1;y>=0;y--){let x=l.points[y];a.lineTo(o+x.rKm*p,h-x.hM*t)}a.lineTo(o+l.baseRadiusKm*p,h),a.stroke(),a.fillStyle=n,a.font="11px var(--font-mono, monospace)",a.textAlign="center",a.fillText("Radius (km)",o,g-4);let b=l.points[l.points.length-1]?.hM||0;a.fillText(w(b,0)+" m",o,h-b*t-6)}function Me(s,l){let i=s.getContext("2d"),a=window.devicePixelRatio||1,e=s.clientWidth,d=s.clientHeight;s.width=e*a,s.height=d*a,i.scale(a,a);let g={top:24,bottom:36,left:56,right:16},c=e-g.left-g.right,k=d-g.top-g.bottom,f=l.totalWidthKm||1,T=0,S=0;for(let n of l.zones)n.height<T&&(T=n.height),n.height>S&&(S=n.height);let _=(S-T)*1.3||1,P=c/f,H=k/_,r=g.top+S*1.15*H,t=getComputedStyle(s).getPropertyValue("color")||"#ccc";i.clearRect(0,0,e,d),i.strokeStyle="rgba(100,180,255,0.4)",i.lineWidth=1,i.setLineDash([4,4]),i.beginPath(),i.moveTo(g.left,r),i.lineTo(g.left+c,r),i.stroke(),i.setLineDash([]);let p=["#8b7355","#a05a3c","#6b3a2a","#a05a3c","#8b7355"];for(let n=0;n<l.zones.length;n++){let h=l.zones[n],o=g.left+h.x*P,b=h.width*P,y=h.height*H;if(i.fillStyle=p[n%p.length],i.globalAlpha=.5,h.taper&&h.taperFromPeak?(i.beginPath(),i.moveTo(o,r),i.lineTo(o,r-(l.zones[0]?.height||0)*H),i.lineTo(o+b,r-y),i.lineTo(o+b,r),i.closePath(),i.fill()):h.taper&&h.taperToPeak?(i.beginPath(),i.moveTo(o,r),i.lineTo(o,r-y),i.lineTo(o+b,r-(l.zones[4]?.height||0)*H),i.lineTo(o+b,r),i.closePath(),i.fill()):i.fillRect(o,r-y,b,y<0?-y:y),i.globalAlpha=1,b>30){i.fillStyle=t,i.font="9px var(--font-mono, monospace)",i.textAlign="center";let x=y>=0?r-y-4:r-y+12;i.fillText(h.name,o+b/2,x)}}i.fillStyle=t,i.font="11px var(--font-mono, monospace)",i.textAlign="center",i.fillText("Width (km)",g.left+c/2,d-4)}var we=[{title:"Getting Started",body:"The Tectonics page models crustal features from plate dynamics. Select a mountain range type, set convergence parameters, and review the resulting elevation profile."},{title:"Mountain Types",body:"Choose from Andean (subduction), Laramide (flat-slab), Ural (ancient collision), or Himalayan (active collision). Each type produces a distinct cross-section and peak height."},{title:"Ocean and Margins",body:"Model continental margins with shelf width, slope angle, and abyssal depth. Ocean depth curves depend on plate age and spreading rate."},{title:"Volcanoes",body:"Configure shield volcanoes, hotspot chains, and rift valleys. Elastic lithosphere thickness and tidal heating affect maximum volcano height."},{title:"Plate Canvas",body:"Generate Voronoi plate boundaries with classification as convergent, divergent, or transform. Use this to sketch a tectonic map for your world."}];function ee(s){return s?.name||s?.inputs?.name||s?.id||"No compatible planet"}function Te(s=[],l=null){return s.map(i=>({value:i.id,label:ee(i),selected:i.id===l?.id}))}function J({selected:s,ctx:l,model:i,regime:a="",unsupportedMessage:e="",empty:d=!1}={}){return N(le({id:"tectonicsCockpit",title:"Tectonics",summary:d?"Create a rocky planet before reading tectonic and terrain limits.":"Reads the selected rocky planet, then interprets terrain limits and local feature profiles.",current:{label:"Selected planet",value:d?"No compatible planet":ee(s),meta:e?"Tectonic output is unavailable for this body.":"Tectonic diagnostic target."},statusItems:[{label:"Reads from",value:"Planets",meta:"Mass, gravity, water, tectonic regime, geodynamics, and surface class."},{label:"Diagnostic only",value:e?"Unsupported":i?.display?.maxPeakHeight||"Waiting",meta:a?`Regime: ${a}. Local feature profiles save to Tectonics.`:"",tone:e?"warn":""},{label:"Authoring override",value:l?.authoredOceanOverrideDisplay||"Auto",meta:l?.authoredOceanOverrideActive?"Population/visual override; inferred science coverage remains separate.":"Auto follows inferred coverage."}],source:{label:"Source",value:"Reads from Planets",meta:"Change inputs on Planets. This page is diagnostic only for planet science."},details:{id:"tectonicsContextDisclosure",title:"What this reads",summary:"Planet mass, water, tectonic regime, geodynamics, and ocean coverage context.",items:["Reads from Planets: mass, gravity, age, water, geodynamics, tectonic regime, and surface classification.","Change inputs on Planets: edit mass, water coverage, radioisotopes, tidal heating, and tectonic regime there.","Diagnostic only: terrain profile controls here do not rewrite planet science context.","Authoring override: population/visual ocean overrides remain separate from inferred surface-ocean coverage."]},nextStep:{id:"tectonicsNextStepStrip",recommendation:d?"Create a rocky planet, then return here to inspect terrain limits.":"Edit mass, water, or tectonic regime on Planets when these limits need to change.",actions:[{label:"Edit planet",href:"#/planet",primary:!0},{label:"Open Climate",href:"#/climate"},{label:"Open Population",href:"#/population"}]}}))}function X(){return N(ce({id:"tectonicsDependencyNotice",title:"Reads from Planets",body:"Reads from the selected rocky planet's mass, water coverage, geodynamics, and tectonic regime. Change inputs on Planets.",source:"Diagnostic only for planet science. Authoring override ocean values stay separate from inferred tectonic and climate coverage.",actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}function Q(s,l,i){return N(re({id:"tectonicsObjectSelector",title:"Planet selection",summary:"Choose the rocky planet whose terrain limits and tectonic context should be interpreted.",selectedLabel:"Selected planet",selectedValue:ee(l),selectedMeta:i?.unsupportedSurfaceMessage?"No compatible tectonic output for this body.":"Tectonic diagnostic target.",selectId:"tecPlanetSelect",selectLabel:"Planet",selectOptions:Te(s,l)}))}function Ae(s,l){return`
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Tectonics</h1></div>
          <div class="panel__body">
            ${J({selected:l,empty:!0})}
            ${X()}
            ${N(U({id:"tectonicsEmptyState",title:"No compatible rocky planet",body:"Tectonics needs a rocky planet before it can read gravity, water, geodynamics, and terrain limits.",actions:[{label:"Create a planet",href:"#/planet"}]}))}
            ${s.length?Q(s,l,{}):""}
          </div>
        </div>
      </div>`}function Ke(s){let l=I(),i=te(l);if(!i.length){s.innerHTML=Ae(i,null);return}let a=l.tectonics||{},e={ridgeHeightM:Number(a.ridgeHeightM)||2600,mountainRanges:Array.isArray(a.mountainRanges)?[...a.mountainRanges]:[],inactiveRanges:Array.isArray(a.inactiveRanges)?[...a.inactiveRanges]:[],selectedRangeIdx:0,spreadingRateFraction:a.spreadingRateFraction!=null?Number(a.spreadingRateFraction):.5,isostasyMode:a.isostasyMode||"off",margin:a.margin||{shelfWidthKm:80,shelfDepthM:130,slopeAngleDeg:3.5},shieldVolcanoes:Array.isArray(a.shieldVolcanoes)?[...a.shieldVolcanoes]:[],riftValleys:Array.isArray(a.riftValleys)?[...a.riftValleys]:[]};function d(){ie({tectonics:{ridgeHeightM:e.ridgeHeightM,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,spreadingRateFraction:e.spreadingRateFraction,isostasyMode:e.isostasyMode,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys}})}function g(r,t,p,n,h){return`
              <section class="kpi-section" id="tectonicsSummary">
                <div class="kpi-section__header"><h3 class="kpi-section__title">Summary</h3></div>
                <div class="kpi-grid" style="margin-top:8px">
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Max Peak Height ${u(m["Max Peak Height"])}</div>
                    <div class="kpi__value">${r.display.maxPeakHeight}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Max Ocean Depth ${u(m["Max Ocean Depth"])}</div>
                    <div class="kpi__value">${r.display.maxOceanDepth}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Inferred Ocean Coverage ${u(m["Inferred Ocean Coverage"])}</div>
                    <div class="kpi__value">${A(h?.inferredOceanCoverageDisplay||"n/a")}</div>
                    <div class="kpi__meta">${A(h?.surfaceOceanCoverageReason||"")}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Authored Ocean Override ${u(m["Authored Ocean Override"])}</div>
                    <div class="kpi__value">${A(h?.authoredOceanOverrideDisplay||"Auto")}</div>
                    <div class="kpi__meta">${h?.authoredOceanOverrideActive?"manual population/visual override":"auto follows inferred coverage"}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Ridge Height ${u(m["Ridge Height"])}</div>
                    <div class="kpi__value">${r.display.ridgeHeight}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Margin Width ${u(m["Margin Width"])}</div>
                    <div class="kpi__value">${w(r.tectonics.margin.totalWidthKm,0)} km</div>
                  </div></div>
                </div>
              </section>
              ${t?`
                <div class="subsection">
                  <h3>Mountain Cross-Section: ${A(t.label)} ${u(m["Cross-Section"])}</h3>
                  ${r.tectonics.mountainProfiles.length>1?`
                    <div class="tec-range-tabs">
                      ${r.tectonics.mountainProfiles.map((o,b)=>`<button class="tec-range-tab ${b===p?"is-active":""}" data-idx="${b}">${A(o.label)} ${b+1}</button>`).join("")}
                    </div>
                  `:""}
                  <div class="tec-isostasy-toggle">
                    <button class="tec-iso-btn ${e.isostasyMode==="off"?"is-active":""}" data-iso="off">Off</button>
                    <button class="tec-iso-btn ${e.isostasyMode==="airy"?"is-active":""}" data-iso="airy">Airy ${u(m.Isostasy)}</button>
                    <button class="tec-iso-btn ${e.isostasyMode==="pratt"?"is-active":""}" data-iso="pratt">Pratt ${u(m.Pratt)}</button>
                  </div>
                  <canvas id="tecMtnCanvas" class="tec-canvas ${e.isostasyMode!=="off"?"tec-canvas--tall":""}"></canvas>
                  <div class="tec-zone-legend">
                    ${t.zones.map((o,b)=>`<span class="tec-legend-item"><span class="tec-legend-swatch" style="background:${Z[b%Z.length]}"></span>${A(o.name)}</span>`).join("")}
                    ${e.isostasyMode==="airy"?'<span class="tec-legend-item"><span class="tec-legend-swatch tec-legend-swatch--crust"></span>Crustal Roots</span>':""}
                    ${e.isostasyMode==="pratt"?'<span class="tec-legend-item"><span class="tec-legend-swatch tec-legend-swatch--crust"></span>Moho</span>':""}
                  </div>
                  ${V([{labelHtml:`Total Width ${u(m["Cross-Section Width"])}`,value:`${w(t.totalWidthKm,0)} km`},{labelHtml:`Highest Zone Avg. ${u(m["Highest Zone"])}`,value:`${w(t.peakM,0)} m`},...n!=null?[{labelHtml:`Arc Distance ${u(m["Arc Distance"])}`,value:`${w(n,0)} km`}]:[]])}
                </div>
              `:'<p class="hint">Add a mountain range to see the cross-section.</p>'}

              ${r.tectonics.inactiveProfiles.length?`
                <div class="subsection">
                  <h3>Inactive Ranges</h3>
                  <div class="cluster-table-wrap">
                    <table class="cluster-table">
                      <thead><tr><th>Type</th><th>Original</th><th>Age</th><th>Eroded Height</th></tr></thead>
                      <tbody>
                        ${r.tectonics.inactiveProfiles.map(o=>`<tr><td>${A(o.label)}</td><td>${w(o.originalHeightM,0)} m</td><td>${w(o.ageMyr,0)} Myr</td><td>${w(o.erodedHeightM,0)} m</td></tr>`).join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              `:""}

              ${r.tectonics.shieldProfiles.length?`
                <div class="subsection">
                  <h3>Shield Volcano Profiles</h3>
                  ${r.tectonics.shieldProfiles.map((o,b)=>`<canvas id="tecShieldCanvas${b}" class="tec-canvas" style="height:180px"></canvas>
                      ${V([{labelHtml:`Height ${u(m["Shield Height"])}`,value:`${w(o.heightM,0)} m`},{labelHtml:`Base Radius ${u(m["Base Radius"])}`,value:`${w(o.baseRadiusKm,0)} km`}])}`).join("")}
                </div>
              `:""}

              ${r.tectonics.riftProfiles.length?`
                <div class="subsection">
                  <h3>Rift Valley Profiles</h3>
                  ${r.tectonics.riftProfiles.map((o,b)=>`<canvas id="tecRiftCanvas${b}" class="tec-canvas" style="height:200px"></canvas>
                      ${V([{labelHtml:`Total Width ${u(m["Rift Total Width"])}`,value:`${w(o.totalWidthKm,0)} km`}])}`).join("")}
                </div>
              `:""}

              <div class="subsection">
                <h3>Ocean Depth Curve ${u(m["Ocean Depth Curve"])}</h3>
                <canvas id="tecOceanCanvas" class="tec-canvas"></canvas>
                ${V([{labelHtml:`Ridge Height ${u(m["Ridge Height"])}`,value:r.display.ridgeHeight},{labelHtml:`Max Ocean Depth ${u(m["Max Ocean Depth"])}`,value:r.display.maxOceanDepth},{labelHtml:`Spreading Rate ${u(m["Spreading Rate"])}`,value:r.display.spreadingRate}])}
              </div>

              <div class="subsection">
                <h3>Continental Margin ${u(m["Continental Margin"])}</h3>
                <canvas id="tecMarginCanvas" class="tec-canvas"></canvas>
                ${V([{labelHtml:`Total Width ${u(m["Margin Width"])}`,value:`${w(r.tectonics.margin.totalWidthKm,0)} km`}])}
              </div>`}function c(r,t,p,n){requestAnimationFrame(()=>{let h=r.querySelector("#tecMtnCanvas");h&&p&&$e(h,p,t.tectonics.maxPeakHeightM,{isostasyMode:e.isostasyMode,arcDistanceKm:n});let o=r.querySelector("#tecOceanCanvas");o&&ke(o,t.tectonics.ocean.subsidence,e.ridgeHeightM);let b=r.querySelector("#tecMarginCanvas");b&&Re(b,t.tectonics.margin),t.tectonics.shieldProfiles.forEach((y,x)=>{let L=r.querySelector(`#tecShieldCanvas${x}`);L&&Se(L,y,t.tectonics.maxShieldHeightM)}),t.tectonics.riftProfiles.forEach((y,x)=>{let L=r.querySelector(`#tecRiftCanvas${x}`);L&&Me(L,y)})})}function k(){let r=I(),t=me(r);if(t.unsupportedSurfaceMessage){let D=s.querySelector("#tecOutputs");D&&(D.innerHTML=`<div class="derived-readout">${A(t.unsupportedSurfaceMessage)}</div>`);return}let p=E(r)?.inputs?.tectonicRegime||"mobile",n=B({gravityG:t.gravityG,tectonicRegime:p,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,ridgeHeightM:e.ridgeHeightM,spreadingRateFraction:e.spreadingRateFraction,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys,massEarth:t.massEarth,ageGyr:t.ageGyr,surfaceTempK:t.surfaceTempK,h2oPct:t.h2oPct,compositionClass:t.compositionClass,tidalHeatingWm2:t.tidalHeatingWm2,radioisotopeAbundance:t.radioisotopeAbundance}),h=Math.min(e.selectedRangeIdx,n.tectonics.mountainProfiles.length-1),o=n.tectonics.mountainProfiles[Math.max(0,h)]||null,b=o&&(o.type==="andean"||o.type==="laramide"),x=e.mountainRanges[Math.max(0,h)]?.slabAngleDeg??45,L=b?F(x):null,R=n.tectonics.ocean.spreadingRate,M=s.querySelector("#tecOutputs");if(!M)return;M.innerHTML=`${t.limitedSurfaceMessage?`<div class="derived-readout">${A(t.limitedSurfaceMessage)}</div>`:""}${ve(t)}${fe(t)}${g(n,o,h,L,t)}`,K(M),Y(s),c(M,n,o,L);let C=s.querySelector("#tecSpreadingRate");C&&(C.value=Math.round(R.rateMmYr))}function f(){s.querySelectorAll(".tec-range-card[data-idx]").forEach(r=>{let t=Number(r.dataset.idx);r.classList.toggle("is-selected",t===e.selectedRangeIdx)})}function T(r){Number.isFinite(r)&&(e.selectedRangeIdx=Math.max(0,r),f(),k())}function S(){let r=I(),t=me(r),p=E(r);if(t.unsupportedSurfaceMessage){s.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Tectonics</h1>
            <button id="tecTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${J({selected:p,ctx:t,unsupportedMessage:t.unsupportedSurfaceMessage})}
            ${X()}
            ${Q(i,p,t)}
            ${N(U({id:"tectonicsUnsupportedState",title:"No compatible tectonic output",body:t.unsupportedSurfaceMessage,actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}
          </div>
        </div>
      </div>`,K(s);let $=s.querySelector("#tecPlanetSelect");$&&j($,i.map(v=>({value:v.id,label:v.name||v.inputs?.name||v.id,selected:v.id===p?.id})));return}let n=t.gravityG,h=E(r)?.inputs?.tectonicRegime||"mobile",o=B({gravityG:n,tectonicRegime:h,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,ridgeHeightM:e.ridgeHeightM,spreadingRateFraction:e.spreadingRateFraction,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys,massEarth:t.massEarth,ageGyr:t.ageGyr,surfaceTempK:t.surfaceTempK,h2oPct:t.h2oPct,compositionClass:t.compositionClass,tidalHeatingWm2:t.tidalHeatingWm2,radioisotopeAbundance:t.radioisotopeAbundance}),b=Math.min(e.selectedRangeIdx,o.tectonics.mountainProfiles.length-1),y=o.tectonics.mountainProfiles[Math.max(0,b)]||null,x=y&&(y.type==="andean"||y.type==="laramide"),R=e.mountainRanges[Math.max(0,b)]?.slabAngleDeg??45,M=x?F(R):null,C=o.tectonics.ocean.spreadingRate;s.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Tectonics</h1>
            <button id="tecTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            <div class="hint">Model mountain ranges, ocean depth, continental margins, shield volcanoes, and rift valleys.</div>
            <p style="margin-top:8px">For an interactive 3D plate simulator with climate, erosion, and more, see <a href="https://the-world-crucible.fagothey.net/" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">The World Crucible</a>.</p>
            ${J({selected:p,ctx:t,model:o,regime:h})}
            ${X()}
          </div>
        </div>

        <div class="grid-2">
          <div class="panel">
            <div class="panel__header"><h2>Inputs</h2></div>
            <div class="panel__body" id="tecInputs">

              ${Q(i,p,t)}

              <div class="kpi-grid">
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Max Peak Height ${u(m["Max Peak Height"])}</div>
                  <div class="kpi__value">${o.display.maxPeakHeight}</div>
                  <div class="kpi__meta">at ${w(n,2)} g</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Gravity ${u(m.Gravity)}</div>
                  <div class="kpi__value">${w(n,3)} g</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Max Shield Height ${u(m["Shield Volcano"])}</div>
                  <div class="kpi__value">${o.display.maxShieldHeight}</div>
                  <div class="kpi__meta">${h==="stagnant"?"stagnant lid (1.5\xD7)":h}</div>
                </div></div>
              </div>

              <details class="subsection" style="margin-top:8px">
                <summary><h3 style="display:inline">Planet Factors ${u(m["Planet Factors"])}</h3></summary>
                <div class="kpi-grid" style="margin-top:8px">
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Composition ${u(m.Composition)}</div>
                    <div class="kpi__value">${A(t.compositionClass)}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Volcanic Activity ${u(m["Volcanic Activity"])}</div>
                    <div class="kpi__value">${o.display.volcanicActivity}</div>
                    <div class="kpi__meta">${w(t.ageGyr,1)} Gyr age</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Erosion Rate ${u(m["Climate Erosion"])}</div>
                    <div class="kpi__value">${o.display.climateErosionRate}</div>
                    <div class="kpi__meta">${w(t.surfaceTempK,0)} K surface</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Elastic Lithosphere ${u(m["Elastic Lithosphere"])}</div>
                    <div class="kpi__value">${o.display.elasticLithosphere}</div>
                  </div></div>
                </div>
              </details>

              <div class="subsection">
                <h3>Active Mountain Ranges ${u(m["Mountain Type"])}</h3>
                <div id="tecRangeCards">
                  ${e.mountainRanges.map(($,v)=>`
                    <div class="tec-range-card ${v===b?"is-selected":""}" data-idx="${v}">
                      <div class="tec-range-card__header">
                        <select class="tec-type-select" data-idx="${v}">
                          ${ge.map(O=>`<option value="${O.key}" ${$.type===O.key?"selected":""}>${A(O.label)}</option>`).join("")}
                        </select>
                        <button class="tec-range-remove" data-idx="${v}" title="Remove range">&times;</button>
                      </div>
                      ${$.type==="andean"||$.type==="laramide"?`
                        <div class="form-row">
                          <div><div class="label">Slab Angle ${u(m["Slab Angle"])} <span class="unit">\xB0</span></div></div>
                          <div class="input-pair">
                            <input type="number" class="tec-slab-angle" data-idx="${v}" value="${$.slabAngleDeg||45}" min="10" max="90" step="1" />
                            <input type="range" class="tec-slab-angle-slider" data-idx="${v}" value="${$.slabAngleDeg||45}" min="10" max="90" step="1" />
                          </div>
                        </div>
                        <div class="kpi" style="margin-top:4px">
                          <div class="kpi__label">Arc Distance ${u(m["Arc Distance"])}</div>
                          <div class="kpi__value">${w(F($.slabAngleDeg||45),0)} km</div>
                        </div>
                      `:""}
                      <div class="form-row">
                        <div><div class="label">Convergence Rate ${u(m["Convergence Rate"])} <span class="unit">mm/yr</span></div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-convergence" data-idx="${v}" value="${$.convergenceMmYr||50}" min="10" max="100" step="1" />
                          <input type="range" class="tec-convergence-slider" data-idx="${v}" value="${$.convergenceMmYr||50}" min="10" max="100" step="1" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddRange" class="tec-add-btn">+ Add Range</button>
              </div>

              <div class="subsection">
                <h3>Inactive Ranges ${u(m["Inactive Range"])}</h3>
                <div id="tecInactiveCards">
                  ${e.inactiveRanges.map(($,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <select class="tec-inactive-type" data-idx="${v}">
                          ${ge.map(O=>`<option value="${O.key}" ${$.type===O.key?"selected":""}>${A(O.label)}</option>`).join("")}
                        </select>
                        <button class="tec-inactive-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Original Height <span class="unit">m</span> ${u(m["Original Height"])}</div></div>
                        <input type="number" class="tec-inactive-height" data-idx="${v}" value="${$.originalHeightM||5e3}" min="0" max="100000" step="100" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Age <span class="unit">Myr</span> ${u(m["Range Age"])}</div></div>
                        <input type="number" class="tec-inactive-age" data-idx="${v}" value="${$.ageMyr||0}" min="0" max="10000" step="1" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Erosion Rate ${u(m["Erosion Rate"])} <span class="unit">m/Myr</span></div></div>
                        <input type="number" class="tec-inactive-erosion" data-idx="${v}" value="${$.erosionRate||5}" min="0" max="100" step="0.5" />
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddInactive" class="tec-add-btn">+ Add Inactive Range</button>
              </div>

              <div class="subsection">
                <h3>Shield Volcanoes ${u(m["Shield Volcano"])}</h3>
                <div id="tecShieldCards">
                  ${e.shieldVolcanoes.map(($,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <span class="label">Shield ${v+1}</span>
                        <button class="tec-shield-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Height <span class="unit">m</span> ${u(m["Shield Height"])}</div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-shield-height" data-idx="${v}" value="${$.heightM||5e3}" min="100" max="${Math.round(o.tectonics.maxShieldHeightM)}" step="100" />
                          <input type="range" class="tec-shield-height-slider" data-idx="${v}" value="${$.heightM||5e3}" min="100" max="${Math.round(o.tectonics.maxShieldHeightM)}" step="100" />
                        </div>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Slope <span class="unit">\xB0</span> ${u(m["Shield Slope"])}</div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-shield-slope" data-idx="${v}" value="${$.slopeAngleDeg||5}" min="1" max="15" step="0.5" />
                          <input type="range" class="tec-shield-slope-slider" data-idx="${v}" value="${$.slopeAngleDeg||5}" min="1" max="15" step="0.5" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddShield" class="tec-add-btn">+ Add Shield Volcano</button>
              </div>

              <div class="subsection">
                <h3>Rift Valleys ${u(m["Rift Valley"])}</h3>
                <div id="tecRiftCards">
                  ${e.riftValleys.map(($,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <span class="label">Rift ${v+1}</span>
                        <button class="tec-rift-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Width <span class="unit">km</span> ${u(m["Graben Width"])}</div></div>
                        <input type="number" class="tec-rift-width" data-idx="${v}" value="${$.grabenWidthKm||50}" min="5" max="300" step="5" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Depth <span class="unit">m</span> ${u(m["Graben Depth"])}</div></div>
                        <input type="number" class="tec-rift-depth" data-idx="${v}" value="${$.grabenDepthM||1e3}" min="50" max="5000" step="50" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Fault Angle <span class="unit">\xB0</span> ${u(m["Fault Angle"])}</div></div>
                        <input type="number" class="tec-rift-angle" data-idx="${v}" value="${$.faultAngleDeg||60}" min="20" max="80" step="1" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Volcanic Fill <span class="unit">m</span> ${u(m["Volcanic Fill"])}</div></div>
                        <input type="number" class="tec-rift-fill" data-idx="${v}" value="${$.volcanicFillM||0}" min="0" max="5000" step="50" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Shoulder Height <span class="unit">m</span> ${u(m["Shoulder Height"])}</div></div>
                        <input type="number" class="tec-rift-shoulder" data-idx="${v}" value="${$.shoulderHeightM||0}" min="0" max="3000" step="50" />
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddRift" class="tec-add-btn">+ Add Rift Valley</button>
              </div>

              <div class="subsection">
                <h3>Oceans</h3>
                <div class="form-row">
                  <div><div class="label">Mid-Ocean Ridge Height ${u(m["Mid-Ocean Ridge Height"])} <span class="unit">m</span></div></div>
                  <div class="input-pair">
                    <input id="tecRidgeHeight" type="number" min="1000" max="5000" step="100" value="${e.ridgeHeightM}" />
                    <input id="tecRidgeHeight_slider" type="range" min="1000" max="5000" step="100" value="${e.ridgeHeightM}" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Spreading Rate ${u(m["Spreading Rate"])} <span class="unit">mm/yr</span></div></div>
                  <div class="input-pair">
                    <input id="tecSpreadingRate" type="number" min="${C.min}" max="${Math.max(C.max,1)}" step="1" value="${Math.round(C.rateMmYr)}" readonly />
                    <input id="tecSpreadingRate_slider" type="range" min="0" max="100" step="1" value="${Math.round(e.spreadingRateFraction*100)}" ${C.min===C.max?"disabled":""} />
                  </div>
                </div>
                <div class="kpi" style="margin-top:4px">
                  <div class="kpi__meta">${A(C.label)} (${A(h)})</div>
                </div>
              </div>

              <div class="subsection">
                <h3>Continental Margin ${u(m["Continental Margin"])}</h3>
                <div class="form-row">
                  <div><div class="label">Shelf Width <span class="unit">km</span> ${u(m["Shelf Width"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-shelf-w" value="${e.margin.shelfWidthKm}" min="1" max="500" step="5" />
                    <input type="range" class="tec-margin-shelf-w-slider" value="${e.margin.shelfWidthKm}" min="1" max="500" step="5" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Shelf Depth <span class="unit">m</span> ${u(m["Shelf Depth"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-shelf-d" value="${e.margin.shelfDepthM}" min="10" max="500" step="5" />
                    <input type="range" class="tec-margin-shelf-d-slider" value="${e.margin.shelfDepthM}" min="10" max="500" step="5" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Slope Angle <span class="unit">\xB0</span> ${u(m["Margin Slope"])}</div></div>
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
              ${t.limitedSurfaceMessage?`<div class="derived-readout">${A(t.limitedSurfaceMessage)}</div>`:""}
              ${ve(t)}
              ${fe(t)}
              ${g(o,y,b,M,t)}
            </div>
          </div>
        </div>

      </div>`,K(s),Y(s);let D=s.querySelector("#tecPlanetSelect");D&&j(D,i.map($=>({value:$.id,label:$.name||$.inputs?.name||$.id,selected:$.id===p?.id}))),c(s,o,y,M)}S();let _=document.createElement("div");document.body.appendChild(_);let P=ne({steps:we,storageKey:"worldsmith.tec.tutorial",container:_});s.addEventListener("click",r=>{r.target.closest("#tecTutorials")&&P?.toggle()});let H=new MutationObserver(()=>{s.isConnected||(P?.destroy(),_.remove(),H.disconnect())});return H.observe(s.parentNode||document.body,{childList:!0}),s.addEventListener("input",r=>{let t=r.target,p=t.closest(".input-pair");if(p&&t.id!=="tecSpreadingRate_slider"){let n=p.querySelector(t.type==="range"?'input[type="number"]':'input[type="range"]');n&&n!==t&&(n.value=t.value)}if(t.id==="tecRidgeHeight"||t.id==="tecRidgeHeight_slider"){e.ridgeHeightM=Number(t.value)||2600,d(),k();return}if(t.classList.contains("tec-inactive-height")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].originalHeightM=Number(t.value)||0,d(),k());return}if(t.classList.contains("tec-inactive-age")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].ageMyr=Number(t.value)||0,d(),k());return}if(t.classList.contains("tec-inactive-erosion")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].erosionRate=Number(t.value)||5,d(),k());return}if(t.classList.contains("tec-slab-angle")||t.classList.contains("tec-slab-angle-slider")){let n=Number(t.dataset.idx);e.mountainRanges[n]&&(e.mountainRanges[n].slabAngleDeg=Number(t.value)||45,d(),k());return}if(t.classList.contains("tec-convergence")||t.classList.contains("tec-convergence-slider")){let n=Number(t.dataset.idx);e.mountainRanges[n]&&(e.mountainRanges[n].convergenceMmYr=Number(t.value)||50,d(),k());return}if(t.id==="tecSpreadingRate_slider"){e.spreadingRateFraction=Number(t.value)/100,d(),k();return}if(t.classList.contains("tec-margin-shelf-w")||t.classList.contains("tec-margin-shelf-w-slider")){e.margin.shelfWidthKm=Number(t.value)||80,d(),k();return}if(t.classList.contains("tec-margin-shelf-d")||t.classList.contains("tec-margin-shelf-d-slider")){e.margin.shelfDepthM=Number(t.value)||130,d(),k();return}if(t.classList.contains("tec-margin-slope")||t.classList.contains("tec-margin-slope-slider")){e.margin.slopeAngleDeg=Number(t.value)||3.5,d(),k();return}if(t.classList.contains("tec-shield-height")||t.classList.contains("tec-shield-height-slider")){let n=Number(t.dataset.idx);e.shieldVolcanoes[n]&&(e.shieldVolcanoes[n].heightM=Number(t.value)||5e3,d(),k());return}if(t.classList.contains("tec-shield-slope")||t.classList.contains("tec-shield-slope-slider")){let n=Number(t.dataset.idx);e.shieldVolcanoes[n]&&(e.shieldVolcanoes[n].slopeAngleDeg=Number(t.value)||5,d(),k());return}if(t.classList.contains("tec-rift-width")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].grabenWidthKm=Number(t.value)||50,d(),k());return}if(t.classList.contains("tec-rift-depth")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].grabenDepthM=Number(t.value)||1e3,d(),k());return}if(t.classList.contains("tec-rift-angle")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].faultAngleDeg=Number(t.value)||60,d(),k());return}if(t.classList.contains("tec-rift-fill")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].volcanicFillM=Number(t.value)||0,d(),k());return}if(t.classList.contains("tec-rift-shoulder")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].shoulderHeightM=Number(t.value)||0,d(),k());return}}),s.addEventListener("change",r=>{let t=r.target;if(t.id==="tecPlanetSelect"){ae(t.value),S();return}if(t.classList.contains("tec-type-select")){let p=Number(t.dataset.idx);e.mountainRanges[p]&&(e.mountainRanges[p].type=t.value,e.selectedRangeIdx=p,d(),S());return}if(t.classList.contains("tec-inactive-type")){let p=Number(t.dataset.idx);e.inactiveRanges[p]&&(e.inactiveRanges[p].type=t.value,d(),S());return}}),s.addEventListener("click",r=>{let t=r.target;if(t.classList.contains("tec-iso-btn")){e.isostasyMode=t.dataset.iso||"off",d(),S();return}if(t.id==="tecAddRange"){let n="mr"+Math.random().toString(36).slice(2,7);e.mountainRanges.push({id:n,type:"andean",label:"Range",widths:{},heights:{},slabAngleDeg:45,convergenceMmYr:50}),e.selectedRangeIdx=e.mountainRanges.length-1,d(),S();return}if(t.classList.contains("tec-range-remove")){let n=Number(t.dataset.idx);e.mountainRanges.splice(n,1),e.selectedRangeIdx=Math.min(e.selectedRangeIdx,Math.max(0,e.mountainRanges.length-1)),d(),S();return}if(t.id==="tecAddInactive"){let n="ir"+Math.random().toString(36).slice(2,7);e.inactiveRanges.push({id:n,type:"ural",originalHeightM:5e3,ageMyr:200,erosionRate:5}),d(),S();return}if(t.classList.contains("tec-inactive-remove")){let n=Number(t.dataset.idx);e.inactiveRanges.splice(n,1),d(),S();return}if(t.classList.contains("tec-range-tab")){T(Number(t.dataset.idx));return}if(t.id==="tecAddShield"){e.shieldVolcanoes.push({heightM:5e3,slopeAngleDeg:5}),d(),S();return}if(t.classList.contains("tec-shield-remove")){e.shieldVolcanoes.splice(Number(t.dataset.idx),1),d(),S();return}if(t.id==="tecAddRift"){e.riftValleys.push({grabenWidthKm:50,grabenDepthM:1e3,faultAngleDeg:60,volcanicFillM:0,shoulderHeightM:0}),d(),S();return}if(t.classList.contains("tec-rift-remove")){e.riftValleys.splice(Number(t.dataset.idx),1),d(),S();return}let p=t.closest(".tec-range-card[data-idx]");if(p&&!t.classList.contains("tec-range-remove")&&!t.closest("select")){T(Number(p.dataset.idx));return}}),()=>{}}export{me as getPlanetTectonicContext,Ke as initTectonicsPage};
