import{a as ie,c as F,d as ne,f as j}from"./chunk-KD5CBWLO.js";import{a as te,b as ae}from"./chunk-B4CMXN2I.js";import{f as Q,g as ee}from"./chunk-OEGIWYER.js";import"./chunk-2QD455J2.js";import"./chunk-NDMX2VLS.js";import{b as V}from"./chunk-X5HJXCPV.js";import"./chunk-E74JE3YP.js";import"./chunk-SMGR3AMC.js";import{c as Y}from"./chunk-DFN46JRM.js";import{a as g,d as E,e as X}from"./chunk-4HEO5JKX.js";import{e as q}from"./chunk-XMLMEZIZ.js";import{a as A}from"./chunk-7PVDVLB6.js";import{Ka as B,La as N,Ma as Z,V as G,ib as J,za as K}from"./chunk-SMEWK4VH.js";import"./chunk-MU7BKJ2M.js";import"./chunk-WNGVR2CK.js";import"./chunk-PEDZU4MZ.js";import"./chunk-32DKD6ZO.js";import{j as w}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";var v={"Max Peak Height":`Maximum possible mountain peak height, inversely proportional to surface gravity. Formula: H_max = C / g, where C depends on crustal composition.

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

Shallower slopes produce much wider bases.`,"Rift Total Width":"Total width of the rift valley cross-section (km), including the graben floor, both fault scarps, volcanic fill, and uplifted shoulders."},U=["var(--accent)","var(--muted)","#7eb8a0","var(--warn)","#c49a8b","#8a9ac4"];function he(o){let r=getComputedStyle(o);return U.map(i=>{if(i.startsWith("var(")){let a=i.slice(4,-1);return r.getPropertyValue(a).trim()||i}return i})}var se=ie();function oe(o){let r={gravityG:1,massEarth:1,ageGyr:4.6,surfaceTempK:288,h2oPct:0,compositionClass:"Earth-like",tidalHeatingWm2:0,radioisotopeAbundance:1,inferredOceanCoverageDisplay:"70.0%",exposedLandDisplay:"30.0%",coverageConfidenceDisplay:"Fallback confidence",surfaceOceanCoverageReason:"fallback",authoredOceanOverrideDisplay:"Auto",authoredOceanOverrideActive:!1},i=N(o);if(!i)return r;let a=G(o,`planet:${i.id}`)||G(o,i.id),e=a?ae(o,a).model||a:null,d=e?Q(e,"tectonics"):null,u=d&&d.status!=="full"?ee(e,"tectonics"):"";if(d?.status==="none")return{...r,unsupportedSurfaceMessage:u};let{model:l,starConfig:R}=te(o,i);if(!l?.derived)return r;let f=o.population?.oceanPctOverride,T=f==null||f===""?null:Number(o.population.oceanPctOverride),M=Number.isFinite(T),_=M?Math.max(0,Math.min(100,T)):null;return{gravityG:l.derived.gravityG||1,massEarth:l.inputs?.massEarth||1,ageGyr:Number(R?.ageGyr)||4.6,surfaceTempK:l.derived.surfaceTempK||288,h2oPct:l.derived.hydrosphere?.surfaceAccessibleLiquidFraction!=null?l.derived.hydrosphere.surfaceAccessibleLiquidFraction*100:l.inputs?.h2oPct||0,compositionClass:l.derived.compositionClass||"Earth-like",tidalHeatingWm2:l.derived.planetTidalHeatingWm2||0,radioisotopeAbundance:l.derived.radioisotopeAbundance??1,geodynamicsContext:l.derived.geodynamicsContext||null,inferredOceanCoverageDisplay:l.display?.inferredOceanCoverage||"n/a",exposedLandDisplay:l.display?.exposedLand||"n/a",coverageConfidenceDisplay:l.display?.surfaceOceanCoverageConfidence||"Unknown confidence",surfaceOceanCoverageReason:l.display?.surfaceOceanCoverageReason||l.derived.hydrosphere?.surfaceOceanCoverageContext?.source||"",authoredOceanOverrideDisplay:M?`${w(_,1)}%`:"Auto",authoredOceanOverrideActive:M,limitedSurfaceMessage:d?.status==="limited"?u:""}}function le(o){let r=o?.geodynamicsContext;if(!r?.outputs)return"";let i=r.outputs,a=Array.isArray(r.limitingFactors)&&r.limitingFactors.length?` Limits: ${r.limitingFactors.join("; ")}`:"";return`<div class="derived-readout">Geodynamics: ${A(i.tectonicRegime||"unknown")}; heat ${A(i.internalHeatClass||"unknown")}; convection ${A(i.convectiveVigorClass||"unknown")}; weathering ${A(i.weatheringFeedbackClass||"unknown")}.${A(a)}</div>`}function ce(o){if(!o)return"";let r=o.authoredOceanOverrideActive?`Authored Ocean Override: ${o.authoredOceanOverrideDisplay} (manual land/ocean authoring; inferred science coverage remains separate)`:"Authored Ocean Override: Auto (uses inferred coverage)",i=o.surfaceOceanCoverageReason?`; class ${A(o.surfaceOceanCoverageReason)}`:"";return`<div class="derived-readout">Surface ocean coverage: inferred ${A(o.inferredOceanCoverageDisplay||"n/a")}; exposed land ${A(o.exposedLandDisplay||"n/a")}; ${A(o.coverageConfidenceDisplay||"Unknown confidence")}${i}. ${A(r)}</div>`}var re=["#5b9bd5","#3a7cc4","#2a5ea0","#1e3f6f"];function pe(o,r,i,a={}){let e=o.getContext("2d"),d=window.devicePixelRatio||1,u=o.clientWidth,l=o.clientHeight;o.width=u*d,o.height=l*d,e.scale(d,d);let R=he(o),f={top:24,bottom:36,left:56,right:16},T=u-f.left-f.right,M=l-f.top-f.bottom,P=a.isostasyMode==="airy"||a.isostasyMode==="pratt"?Math.round(M*.2):0,H=M-P,c=r.totalWidthKm||1,t=i*1.15,h=T/c,n=H/t,p=getComputedStyle(o).getPropertyValue("color")||"#ccc",s=getComputedStyle(o).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";e.clearRect(0,0,u,l),e.strokeStyle=s,e.lineWidth=.5;let b=I(t,5);for(let k=0;k<=t;k+=b){let S=f.top+H-k*n;e.beginPath(),e.moveTo(f.left,S),e.lineTo(f.left+T,S),e.stroke(),e.fillStyle=p,e.font="10px var(--font-mono, monospace)",e.textAlign="right",e.fillText(w(k,0),f.left-4,S+3)}let y=I(c,5);e.textAlign="center";for(let k=0;k<=c;k+=y){let S=f.left+k*h;e.fillStyle=p,e.font="10px var(--font-mono, monospace)",e.fillText(w(k,0),S,l-f.bottom+16)}e.save(),e.fillStyle=p,e.font="11px var(--font-mono, monospace)",e.textAlign="center",e.fillText("Width (km)",f.left+T/2,l-4),e.save(),e.translate(12,f.top+H/2),e.rotate(-Math.PI/2),e.fillText("Height (m)",0,0),e.restore(),e.restore();let x=f.top+H;e.strokeStyle="rgba(100,180,255,0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(f.left,x),e.lineTo(f.left+T,x),e.stroke(),e.setLineDash([]);let O=f.top+H-i*n;e.strokeStyle="rgba(255,100,100,0.5)",e.lineWidth=1,e.setLineDash([6,3]),e.beginPath(),e.moveTo(f.left,O),e.lineTo(f.left+T,O),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(255,100,100,0.7)",e.font="10px var(--font-mono, monospace)",e.textAlign="right",e.fillText("Max "+w(i,0)+" m",f.left+T-2,O-4);for(let k=0;k<r.zones.length;k++){let S=r.zones[k],C=f.left+S.x*h,D=S.width*h,$=S.height*n;if(e.fillStyle=R[k%R.length],e.globalAlpha=.5,S.taper&&S.taperToPeak)e.beginPath(),e.moveTo(C,x),e.lineTo(C,x-S.minHeight*n),e.lineTo(C+D,x-$),e.lineTo(C+D,x),e.closePath(),e.fill();else if(S.taper&&S.taperFromPeak)e.beginPath(),e.moveTo(C,x),e.lineTo(C,x-$),e.lineTo(C+D,x-S.minHeight*n),e.lineTo(C+D,x),e.closePath(),e.fill();else if(S.taper){let m=k>0?r.zones[k-1]:null,L=k<r.zones.length-1?r.zones[k+1]:null,W=m?m.taperFromPeak?m.minHeight:m.height:0,z=L?L.taperToPeak?L.minHeight:L.height:0;e.beginPath(),e.moveTo(C,x),e.lineTo(C,x-W*n),e.lineTo(C+D,x-z*n),e.lineTo(C+D,x),e.closePath(),e.fill()}else e.fillRect(C,x-$,D,$);if(e.globalAlpha=1,D>30){let m=$;if(S.taper&&!S.taperToPeak&&!S.taperFromPeak){let L=k>0?r.zones[k-1]:null,W=k<r.zones.length-1?r.zones[k+1]:null,z=L?L.taperFromPeak?L.minHeight:L.height:0,de=W?W.taperToPeak?W.minHeight:W.height:0;m=(z+de)/2*n}e.fillStyle=p,e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText(S.name,C+D/2,x-m-4)}}if(P>0&&(e.fillStyle="rgba(139,94,60,0.06)",e.fillRect(f.left,x,T,P)),a.isostasyMode==="airy")for(let k=0;k<r.zones.length;k++){let S=r.zones[k];if(S.height<=0)continue;let D=ne(S.height)*n,$=f.left+S.x*h,m=S.width*h;e.fillStyle="#8b5e3c",e.globalAlpha=.35,e.fillRect($,x,m,Math.min(D,P)),e.globalAlpha=1}else if(a.isostasyMode==="pratt"){let k=x+P*.7;e.strokeStyle="#8b5e3c",e.lineWidth=1.5,e.setLineDash([4,3]),e.beginPath(),e.moveTo(f.left,k),e.lineTo(f.left+T,k),e.stroke(),e.setLineDash([])}if(a.arcDistanceKm!=null&&a.arcDistanceKm<=c){let k=f.left+a.arcDistanceKm*h;e.strokeStyle="rgba(255,80,80,0.7)",e.lineWidth=1.5,e.setLineDash([3,3]),e.beginPath(),e.moveTo(k,f.top),e.lineTo(k,x),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(255,80,80,0.85)",e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText("Arc "+w(a.arcDistanceKm,0)+" km",k,f.top+10)}}function ge(o,r,i){let a=o.getContext("2d"),e=window.devicePixelRatio||1,d=o.clientWidth,u=o.clientHeight;o.width=d*e,o.height=u*e,a.scale(e,e);let l={top:20,bottom:36,left:56,right:16},R=d-l.left-l.right,f=u-l.top-l.bottom,T=r[r.length-1]?.ageMyr||1e3,M=7e3,_=R/T,P=f/M,H=getComputedStyle(o).getPropertyValue("color")||"#ccc",c=getComputedStyle(o).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";a.clearRect(0,0,d,u),a.strokeStyle=c,a.lineWidth=.5;let t=1e3;for(let s=0;s<=M;s+=t){let b=l.top+s*P;a.beginPath(),a.moveTo(l.left,b),a.lineTo(l.left+R,b),a.stroke(),a.fillStyle=H,a.font="10px var(--font-mono, monospace)",a.textAlign="right",a.fillText(w(s,0),l.left-4,b+3)}let h=I(T,5);a.textAlign="center";for(let s=0;s<=T;s+=h){let b=l.left+s*_;a.fillStyle=H,a.font="10px var(--font-mono, monospace)",a.fillText(w(s,0),b,u-l.bottom+16)}a.fillStyle=H,a.font="11px var(--font-mono, monospace)",a.textAlign="center",a.fillText("Crust Age (Myr)",l.left+R/2,u-4),a.save(),a.translate(12,l.top+f/2),a.rotate(-Math.PI/2),a.fillText("Depth (m)",0,0),a.restore();let n=l.top+i*P;a.strokeStyle="rgba(100,200,255,0.5)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(l.left,n),a.lineTo(l.left+R,n),a.stroke(),a.setLineDash([]),a.fillStyle="rgba(100,200,255,0.7)",a.font="10px var(--font-mono, monospace)",a.textAlign="left",a.fillText("Ridge "+w(i,0)+" m",l.left+4,n-4);let p=l.top+6400*P;a.strokeStyle="rgba(255,150,100,0.5)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(l.left,p),a.lineTo(l.left+R,p),a.stroke(),a.setLineDash([]),a.fillStyle="rgba(255,150,100,0.7)",a.font="10px var(--font-mono, monospace)",a.textAlign="left",a.fillText("Max 6,400 m",l.left+4,p-4),a.strokeStyle="var(--accent, #66aaff)",a.lineWidth=2,a.beginPath();for(let s=0;s<r.length;s++){let b=r[s],y=l.left+b.ageMyr*_,x=l.top+b.depthM*P;s===0?a.moveTo(y,x):a.lineTo(y,x)}a.stroke(),a.fillStyle="rgba(30,90,160,0.15)",a.beginPath(),a.moveTo(l.left,l.top);for(let s of r)a.lineTo(l.left+s.ageMyr*_,l.top+s.depthM*P);a.lineTo(l.left+R,l.top),a.closePath(),a.fill()}function I(o,r){let i=o/r,a=Math.pow(10,Math.floor(Math.log10(i))),e=i/a,d;return e<=1.5?d=1:e<=3.5?d=2:e<=7.5?d=5:d=10,d*a}function ue(o,r){let i=o.getContext("2d"),a=window.devicePixelRatio||1,e=o.clientWidth,d=o.clientHeight;o.width=e*a,o.height=d*a,i.scale(a,a);let u={top:20,bottom:36,left:56,right:16},l=e-u.left-u.right,R=d-u.top-u.bottom,f=r.totalWidthKm||500,T=5500,M=l/f,_=R/T,P=getComputedStyle(o).getPropertyValue("color")||"#ccc",H=getComputedStyle(o).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";i.clearRect(0,0,e,d),i.strokeStyle=H,i.lineWidth=.5;let c=1e3;for(let h=0;h<=T;h+=c){let n=u.top+h*_;i.beginPath(),i.moveTo(u.left,n),i.lineTo(u.left+l,n),i.stroke(),i.fillStyle=P,i.font="10px var(--font-mono, monospace)",i.textAlign="right",i.fillText(w(h,0),u.left-4,n+3)}let t=I(f,5);i.textAlign="center";for(let h=0;h<=f;h+=t){let n=u.left+h*M;i.fillStyle=P,i.font="10px var(--font-mono, monospace)",i.fillText(w(h,0),n,d-u.bottom+16)}i.fillStyle=P,i.font="11px var(--font-mono, monospace)",i.textAlign="center",i.fillText("Distance from Coast (km)",u.left+l/2,d-4),i.save(),i.translate(12,u.top+R/2),i.rotate(-Math.PI/2),i.fillText("Depth (m)",0,0),i.restore();for(let h=0;h<r.segments.length;h++){let n=r.segments[h],p=u.left+n.startKm*M,s=u.left+n.endKm*M,b=u.top+n.startM*_,y=u.top+n.endM*_;i.fillStyle=re[h%re.length],i.globalAlpha=.3,i.beginPath(),i.moveTo(p,u.top),i.lineTo(p,b),i.lineTo(s,y),i.lineTo(s,u.top),i.closePath(),i.fill(),i.globalAlpha=1;let x=(p+s)/2;s-p>30&&(i.fillStyle=P,i.font="9px var(--font-mono, monospace)",i.textAlign="center",i.fillText(n.name,x,u.top+14))}i.strokeStyle="var(--accent, #66aaff)",i.lineWidth=2,i.beginPath();for(let h=0;h<r.points.length;h++){let n=r.points[h],p=u.left+n.distKm*M,s=u.top+n.depthM*_;h===0?i.moveTo(p,s):i.lineTo(p,s)}i.stroke()}function ve(o,r,i){let a=o.getContext("2d"),e=window.devicePixelRatio||1,d=o.clientWidth,u=o.clientHeight;o.width=d*e,o.height=u*e,a.scale(e,e);let l={top:20,bottom:36,left:56,right:16},R=d-l.left-l.right,f=u-l.top-l.bottom,T=15,_=f/((i||1e4)*1.15),P=_*1e3/T,H=r.baseRadiusKm*2.2*P,c=H>R?R/H:1,t=_*c,h=P*c,n=getComputedStyle(o).getPropertyValue("color")||"#ccc";a.clearRect(0,0,d,u);let p=l.top+f;a.strokeStyle="rgba(100,180,255,0.3)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(l.left,p),a.lineTo(l.left+R,p),a.stroke(),a.setLineDash([]);let s=l.left+R/2;a.fillStyle="#c49a8b",a.globalAlpha=.5,a.beginPath(),a.moveTo(s-r.baseRadiusKm*h,p);for(let y of r.points)a.lineTo(s-y.rKm*h,p-y.hM*t);for(let y=r.points.length-1;y>=0;y--){let x=r.points[y];a.lineTo(s+x.rKm*h,p-x.hM*t)}a.lineTo(s+r.baseRadiusKm*h,p),a.closePath(),a.fill(),a.globalAlpha=1,a.strokeStyle="var(--accent, #66aaff)",a.lineWidth=1.5,a.beginPath(),a.moveTo(s-r.baseRadiusKm*h,p);for(let y of r.points)a.lineTo(s-y.rKm*h,p-y.hM*t);for(let y=r.points.length-1;y>=0;y--){let x=r.points[y];a.lineTo(s+x.rKm*h,p-x.hM*t)}a.lineTo(s+r.baseRadiusKm*h,p),a.stroke(),a.fillStyle=n,a.font="11px var(--font-mono, monospace)",a.textAlign="center",a.fillText("Radius (km)",s,u-4);let b=r.points[r.points.length-1]?.hM||0;a.fillText(w(b,0)+" m",s,p-b*t-6)}function me(o,r){let i=o.getContext("2d"),a=window.devicePixelRatio||1,e=o.clientWidth,d=o.clientHeight;o.width=e*a,o.height=d*a,i.scale(a,a);let u={top:24,bottom:36,left:56,right:16},l=e-u.left-u.right,R=d-u.top-u.bottom,f=r.totalWidthKm||1,T=0,M=0;for(let n of r.zones)n.height<T&&(T=n.height),n.height>M&&(M=n.height);let _=(M-T)*1.3||1,P=l/f,H=R/_,c=u.top+M*1.15*H,t=getComputedStyle(o).getPropertyValue("color")||"#ccc";i.clearRect(0,0,e,d),i.strokeStyle="rgba(100,180,255,0.4)",i.lineWidth=1,i.setLineDash([4,4]),i.beginPath(),i.moveTo(u.left,c),i.lineTo(u.left+l,c),i.stroke(),i.setLineDash([]);let h=["#8b7355","#a05a3c","#6b3a2a","#a05a3c","#8b7355"];for(let n=0;n<r.zones.length;n++){let p=r.zones[n],s=u.left+p.x*P,b=p.width*P,y=p.height*H;if(i.fillStyle=h[n%h.length],i.globalAlpha=.5,p.taper&&p.taperFromPeak?(i.beginPath(),i.moveTo(s,c),i.lineTo(s,c-(r.zones[0]?.height||0)*H),i.lineTo(s+b,c-y),i.lineTo(s+b,c),i.closePath(),i.fill()):p.taper&&p.taperToPeak?(i.beginPath(),i.moveTo(s,c),i.lineTo(s,c-y),i.lineTo(s+b,c-(r.zones[4]?.height||0)*H),i.lineTo(s+b,c),i.closePath(),i.fill()):i.fillRect(s,c-y,b,y<0?-y:y),i.globalAlpha=1,b>30){i.fillStyle=t,i.font="9px var(--font-mono, monospace)",i.textAlign="center";let x=y>=0?c-y-4:c-y+12;i.fillText(p.name,s+b/2,x)}}i.fillStyle=t,i.font="11px var(--font-mono, monospace)",i.textAlign="center",i.fillText("Width (km)",u.left+l/2,d-4)}var fe=[{title:"Getting Started",body:"The Tectonics page models crustal features from plate dynamics. Select a mountain range type, set convergence parameters, and review the resulting elevation profile."},{title:"Mountain Types",body:"Choose from Andean (subduction), Laramide (flat-slab), Ural (ancient collision), or Himalayan (active collision). Each type produces a distinct cross-section and peak height."},{title:"Ocean and Margins",body:"Model continental margins with shelf width, slope angle, and abyssal depth. Ocean depth curves depend on plate age and spreading rate."},{title:"Volcanoes",body:"Configure shield volcanoes, hotspot chains, and rift valleys. Elastic lithosphere thickness and tidal heating affect maximum volcano height."},{title:"Plate Canvas",body:"Generate Voronoi plate boundaries with classification as convergent, divergent, or transform. Use this to sketch a tectonic map for your world."}];function Pe(o){let r=K(),i=B(r);if(!i.length){o.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Tectonics</h1></div>
          <div class="panel__body">
            <p class="hint">Create a planet on the <a href="#/planet">Planets</a> page first.</p>
          </div>
        </div>
      </div>`;return}let a=r.tectonics||{},e={ridgeHeightM:Number(a.ridgeHeightM)||2600,mountainRanges:Array.isArray(a.mountainRanges)?[...a.mountainRanges]:[],inactiveRanges:Array.isArray(a.inactiveRanges)?[...a.inactiveRanges]:[],selectedRangeIdx:0,spreadingRateFraction:a.spreadingRateFraction!=null?Number(a.spreadingRateFraction):.5,isostasyMode:a.isostasyMode||"off",margin:a.margin||{shelfWidthKm:80,shelfDepthM:130,slopeAngleDeg:3.5},shieldVolcanoes:Array.isArray(a.shieldVolcanoes)?[...a.shieldVolcanoes]:[],riftValleys:Array.isArray(a.riftValleys)?[...a.riftValleys]:[]};function d(){J({tectonics:{ridgeHeightM:e.ridgeHeightM,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,spreadingRateFraction:e.spreadingRateFraction,isostasyMode:e.isostasyMode,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys}})}function u(c,t,h,n,p){return`
              <div class="subsection">
                <h3>Summary</h3>
                <div class="kpi-grid" style="margin-top:8px">
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Max Peak Height ${g(v["Max Peak Height"])}</div>
                    <div class="kpi__value">${c.display.maxPeakHeight}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Max Ocean Depth ${g(v["Max Ocean Depth"])}</div>
                    <div class="kpi__value">${c.display.maxOceanDepth}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Inferred Ocean Coverage ${g(v["Inferred Ocean Coverage"])}</div>
                    <div class="kpi__value">${A(p?.inferredOceanCoverageDisplay||"n/a")}</div>
                    <div class="kpi__meta">${A(p?.surfaceOceanCoverageReason||"")}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Authored Ocean Override ${g(v["Authored Ocean Override"])}</div>
                    <div class="kpi__value">${A(p?.authoredOceanOverrideDisplay||"Auto")}</div>
                    <div class="kpi__meta">${p?.authoredOceanOverrideActive?"manual population/visual override":"auto follows inferred coverage"}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Ridge Height ${g(v["Ridge Height"])}</div>
                    <div class="kpi__value">${c.display.ridgeHeight}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Margin Width ${g(v["Margin Width"])}</div>
                    <div class="kpi__value">${w(c.tectonics.margin.totalWidthKm,0)} km</div>
                  </div></div>
                </div>
              </div>
              ${t?`
                <div class="subsection">
                  <h3>Mountain Cross-Section: ${A(t.label)} ${g(v["Cross-Section"])}</h3>
                  ${c.tectonics.mountainProfiles.length>1?`
                    <div class="tec-range-tabs">
                      ${c.tectonics.mountainProfiles.map((s,b)=>`<button class="tec-range-tab ${b===h?"is-active":""}" data-idx="${b}">${A(s.label)} ${b+1}</button>`).join("")}
                    </div>
                  `:""}
                  <div class="tec-isostasy-toggle">
                    <button class="tec-iso-btn ${e.isostasyMode==="off"?"is-active":""}" data-iso="off">Off</button>
                    <button class="tec-iso-btn ${e.isostasyMode==="airy"?"is-active":""}" data-iso="airy">Airy ${g(v.Isostasy)}</button>
                    <button class="tec-iso-btn ${e.isostasyMode==="pratt"?"is-active":""}" data-iso="pratt">Pratt ${g(v.Pratt)}</button>
                  </div>
                  <canvas id="tecMtnCanvas" class="tec-canvas ${e.isostasyMode!=="off"?"tec-canvas--tall":""}"></canvas>
                  <div class="tec-zone-legend">
                    ${t.zones.map((s,b)=>`<span class="tec-legend-item"><span class="tec-legend-swatch" style="background:${U[b%U.length]}"></span>${A(s.name)}</span>`).join("")}
                    ${e.isostasyMode==="airy"?'<span class="tec-legend-item"><span class="tec-legend-swatch tec-legend-swatch--crust"></span>Crustal Roots</span>':""}
                    ${e.isostasyMode==="pratt"?'<span class="tec-legend-item"><span class="tec-legend-swatch tec-legend-swatch--crust"></span>Moho</span>':""}
                  </div>
                  ${V([{labelHtml:`Total Width ${g(v["Cross-Section Width"])}`,value:`${w(t.totalWidthKm,0)} km`},{labelHtml:`Highest Zone Avg. ${g(v["Highest Zone"])}`,value:`${w(t.peakM,0)} m`},...n!=null?[{labelHtml:`Arc Distance ${g(v["Arc Distance"])}`,value:`${w(n,0)} km`}]:[]])}
                </div>
              `:'<p class="hint">Add a mountain range to see the cross-section.</p>'}

              ${c.tectonics.inactiveProfiles.length?`
                <div class="subsection">
                  <h3>Inactive Ranges</h3>
                  <div class="cluster-table-wrap">
                    <table class="cluster-table">
                      <thead><tr><th>Type</th><th>Original</th><th>Age</th><th>Eroded Height</th></tr></thead>
                      <tbody>
                        ${c.tectonics.inactiveProfiles.map(s=>`<tr><td>${A(s.label)}</td><td>${w(s.originalHeightM,0)} m</td><td>${w(s.ageMyr,0)} Myr</td><td>${w(s.erodedHeightM,0)} m</td></tr>`).join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              `:""}

              ${c.tectonics.shieldProfiles.length?`
                <div class="subsection">
                  <h3>Shield Volcano Profiles</h3>
                  ${c.tectonics.shieldProfiles.map((s,b)=>`<canvas id="tecShieldCanvas${b}" class="tec-canvas" style="height:180px"></canvas>
                      ${V([{labelHtml:`Height ${g(v["Shield Height"])}`,value:`${w(s.heightM,0)} m`},{labelHtml:`Base Radius ${g(v["Base Radius"])}`,value:`${w(s.baseRadiusKm,0)} km`}])}`).join("")}
                </div>
              `:""}

              ${c.tectonics.riftProfiles.length?`
                <div class="subsection">
                  <h3>Rift Valley Profiles</h3>
                  ${c.tectonics.riftProfiles.map((s,b)=>`<canvas id="tecRiftCanvas${b}" class="tec-canvas" style="height:200px"></canvas>
                      ${V([{labelHtml:`Total Width ${g(v["Rift Total Width"])}`,value:`${w(s.totalWidthKm,0)} km`}])}`).join("")}
                </div>
              `:""}

              <div class="subsection">
                <h3>Ocean Depth Curve ${g(v["Ocean Depth Curve"])}</h3>
                <canvas id="tecOceanCanvas" class="tec-canvas"></canvas>
                ${V([{labelHtml:`Ridge Height ${g(v["Ridge Height"])}`,value:c.display.ridgeHeight},{labelHtml:`Max Ocean Depth ${g(v["Max Ocean Depth"])}`,value:c.display.maxOceanDepth},{labelHtml:`Spreading Rate ${g(v["Spreading Rate"])}`,value:c.display.spreadingRate}])}
              </div>

              <div class="subsection">
                <h3>Continental Margin ${g(v["Continental Margin"])}</h3>
                <canvas id="tecMarginCanvas" class="tec-canvas"></canvas>
                ${V([{labelHtml:`Total Width ${g(v["Margin Width"])}`,value:`${w(c.tectonics.margin.totalWidthKm,0)} km`}])}
              </div>`}function l(c,t,h,n){requestAnimationFrame(()=>{let p=c.querySelector("#tecMtnCanvas");p&&h&&pe(p,h,t.tectonics.maxPeakHeightM,{isostasyMode:e.isostasyMode,arcDistanceKm:n});let s=c.querySelector("#tecOceanCanvas");s&&ge(s,t.tectonics.ocean.subsidence,e.ridgeHeightM);let b=c.querySelector("#tecMarginCanvas");b&&ue(b,t.tectonics.margin),t.tectonics.shieldProfiles.forEach((y,x)=>{let O=c.querySelector(`#tecShieldCanvas${x}`);O&&ve(O,y,t.tectonics.maxShieldHeightM)}),t.tectonics.riftProfiles.forEach((y,x)=>{let O=c.querySelector(`#tecRiftCanvas${x}`);O&&me(O,y)})})}function R(){let c=K(),t=oe(c);if(t.unsupportedSurfaceMessage){let D=o.querySelector("#tecOutputs");D&&(D.innerHTML=`<div class="derived-readout">${A(t.unsupportedSurfaceMessage)}</div>`);return}let h=N(c)?.inputs?.tectonicRegime||"mobile",n=j({gravityG:t.gravityG,tectonicRegime:h,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,ridgeHeightM:e.ridgeHeightM,spreadingRateFraction:e.spreadingRateFraction,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys,massEarth:t.massEarth,ageGyr:t.ageGyr,surfaceTempK:t.surfaceTempK,h2oPct:t.h2oPct,compositionClass:t.compositionClass,tidalHeatingWm2:t.tidalHeatingWm2,radioisotopeAbundance:t.radioisotopeAbundance}),p=Math.min(e.selectedRangeIdx,n.tectonics.mountainProfiles.length-1),s=n.tectonics.mountainProfiles[Math.max(0,p)]||null,b=s&&(s.type==="andean"||s.type==="laramide"),x=e.mountainRanges[Math.max(0,p)]?.slabAngleDeg??45,O=b?F(x):null,k=n.tectonics.ocean.spreadingRate,S=o.querySelector("#tecOutputs");if(!S)return;S.innerHTML=`${t.limitedSurfaceMessage?`<div class="derived-readout">${A(t.limitedSurfaceMessage)}</div>`:""}${le(t)}${ce(t)}${u(n,s,p,O,t)}`,E(S),Y(o),l(S,n,s,O);let C=o.querySelector("#tecSpreadingRate");C&&(C.value=Math.round(k.rateMmYr))}function f(){o.querySelectorAll(".tec-range-card[data-idx]").forEach(c=>{let t=Number(c.dataset.idx);c.classList.toggle("is-selected",t===e.selectedRangeIdx)})}function T(c){Number.isFinite(c)&&(e.selectedRangeIdx=Math.max(0,c),f(),R())}function M(){let c=K(),t=oe(c),h=N(c);if(t.unsupportedSurfaceMessage){o.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Tectonics</h1>
            <button id="tecTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            <div class="form-row">
              <div><div class="label">Planet</div></div>
              <select id="tecPlanetSelect"></select>
            </div>
            <div class="derived-readout">${A(t.unsupportedSurfaceMessage)}</div>
          </div>
        </div>
      </div>`,E(o);let $=o.querySelector("#tecPlanetSelect");$&&q($,i.map(m=>({value:m.id,label:m.name||m.inputs?.name||m.id,selected:m.id===h?.id})));return}let n=t.gravityG,p=N(c)?.inputs?.tectonicRegime||"mobile",s=j({gravityG:n,tectonicRegime:p,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,ridgeHeightM:e.ridgeHeightM,spreadingRateFraction:e.spreadingRateFraction,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys,massEarth:t.massEarth,ageGyr:t.ageGyr,surfaceTempK:t.surfaceTempK,h2oPct:t.h2oPct,compositionClass:t.compositionClass,tidalHeatingWm2:t.tidalHeatingWm2,radioisotopeAbundance:t.radioisotopeAbundance}),b=Math.min(e.selectedRangeIdx,s.tectonics.mountainProfiles.length-1),y=s.tectonics.mountainProfiles[Math.max(0,b)]||null,x=y&&(y.type==="andean"||y.type==="laramide"),k=e.mountainRanges[Math.max(0,b)]?.slabAngleDeg??45,S=x?F(k):null,C=s.tectonics.ocean.spreadingRate;o.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Tectonics</h1>
            <button id="tecTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            <div class="hint">Model mountain ranges, ocean depth, continental margins, shield volcanoes, and rift valleys.</div>
            <p style="margin-top:8px">For an interactive 3D plate simulator with climate, erosion, and more, see <a href="https://the-world-crucible.fagothey.net/" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">The World Crucible</a>.</p>
          </div>
        </div>

        <div class="grid-2">
          <div class="panel">
            <div class="panel__header"><h2>Inputs</h2></div>
            <div class="panel__body" id="tecInputs">

              <div class="form-row">
                <div><div class="label">Planet</div></div>
                <select id="tecPlanetSelect"></select>
              </div>

              <div class="kpi-grid">
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Max Peak Height ${g(v["Max Peak Height"])}</div>
                  <div class="kpi__value">${s.display.maxPeakHeight}</div>
                  <div class="kpi__meta">at ${w(n,2)} g</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Gravity ${g(v.Gravity)}</div>
                  <div class="kpi__value">${w(n,3)} g</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Max Shield Height ${g(v["Shield Volcano"])}</div>
                  <div class="kpi__value">${s.display.maxShieldHeight}</div>
                  <div class="kpi__meta">${p==="stagnant"?"stagnant lid (1.5\xD7)":p}</div>
                </div></div>
              </div>

              <details class="subsection" style="margin-top:8px">
                <summary><h3 style="display:inline">Planet Factors ${g(v["Planet Factors"])}</h3></summary>
                <div class="kpi-grid" style="margin-top:8px">
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Composition ${g(v.Composition)}</div>
                    <div class="kpi__value">${A(t.compositionClass)}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Volcanic Activity ${g(v["Volcanic Activity"])}</div>
                    <div class="kpi__value">${s.display.volcanicActivity}</div>
                    <div class="kpi__meta">${w(t.ageGyr,1)} Gyr age</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Erosion Rate ${g(v["Climate Erosion"])}</div>
                    <div class="kpi__value">${s.display.climateErosionRate}</div>
                    <div class="kpi__meta">${w(t.surfaceTempK,0)} K surface</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Elastic Lithosphere ${g(v["Elastic Lithosphere"])}</div>
                    <div class="kpi__value">${s.display.elasticLithosphere}</div>
                  </div></div>
                </div>
              </details>

              <div class="subsection">
                <h3>Active Mountain Ranges ${g(v["Mountain Type"])}</h3>
                <div id="tecRangeCards">
                  ${e.mountainRanges.map(($,m)=>`
                    <div class="tec-range-card ${m===b?"is-selected":""}" data-idx="${m}">
                      <div class="tec-range-card__header">
                        <select class="tec-type-select" data-idx="${m}">
                          ${se.map(L=>`<option value="${L.key}" ${$.type===L.key?"selected":""}>${A(L.label)}</option>`).join("")}
                        </select>
                        <button class="tec-range-remove" data-idx="${m}" title="Remove range">&times;</button>
                      </div>
                      ${$.type==="andean"||$.type==="laramide"?`
                        <div class="form-row">
                          <div><div class="label">Slab Angle ${g(v["Slab Angle"])} <span class="unit">\xB0</span></div></div>
                          <div class="input-pair">
                            <input type="number" class="tec-slab-angle" data-idx="${m}" value="${$.slabAngleDeg||45}" min="10" max="90" step="1" />
                            <input type="range" class="tec-slab-angle-slider" data-idx="${m}" value="${$.slabAngleDeg||45}" min="10" max="90" step="1" />
                          </div>
                        </div>
                        <div class="kpi" style="margin-top:4px">
                          <div class="kpi__label">Arc Distance ${g(v["Arc Distance"])}</div>
                          <div class="kpi__value">${w(F($.slabAngleDeg||45),0)} km</div>
                        </div>
                      `:""}
                      <div class="form-row">
                        <div><div class="label">Convergence Rate ${g(v["Convergence Rate"])} <span class="unit">mm/yr</span></div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-convergence" data-idx="${m}" value="${$.convergenceMmYr||50}" min="10" max="100" step="1" />
                          <input type="range" class="tec-convergence-slider" data-idx="${m}" value="${$.convergenceMmYr||50}" min="10" max="100" step="1" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddRange" class="tec-add-btn">+ Add Range</button>
              </div>

              <div class="subsection">
                <h3>Inactive Ranges ${g(v["Inactive Range"])}</h3>
                <div id="tecInactiveCards">
                  ${e.inactiveRanges.map(($,m)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <select class="tec-inactive-type" data-idx="${m}">
                          ${se.map(L=>`<option value="${L.key}" ${$.type===L.key?"selected":""}>${A(L.label)}</option>`).join("")}
                        </select>
                        <button class="tec-inactive-remove" data-idx="${m}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Original Height <span class="unit">m</span> ${g(v["Original Height"])}</div></div>
                        <input type="number" class="tec-inactive-height" data-idx="${m}" value="${$.originalHeightM||5e3}" min="0" max="100000" step="100" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Age <span class="unit">Myr</span> ${g(v["Range Age"])}</div></div>
                        <input type="number" class="tec-inactive-age" data-idx="${m}" value="${$.ageMyr||0}" min="0" max="10000" step="1" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Erosion Rate ${g(v["Erosion Rate"])} <span class="unit">m/Myr</span></div></div>
                        <input type="number" class="tec-inactive-erosion" data-idx="${m}" value="${$.erosionRate||5}" min="0" max="100" step="0.5" />
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddInactive" class="tec-add-btn">+ Add Inactive Range</button>
              </div>

              <div class="subsection">
                <h3>Shield Volcanoes ${g(v["Shield Volcano"])}</h3>
                <div id="tecShieldCards">
                  ${e.shieldVolcanoes.map(($,m)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <span class="label">Shield ${m+1}</span>
                        <button class="tec-shield-remove" data-idx="${m}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Height <span class="unit">m</span> ${g(v["Shield Height"])}</div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-shield-height" data-idx="${m}" value="${$.heightM||5e3}" min="100" max="${Math.round(s.tectonics.maxShieldHeightM)}" step="100" />
                          <input type="range" class="tec-shield-height-slider" data-idx="${m}" value="${$.heightM||5e3}" min="100" max="${Math.round(s.tectonics.maxShieldHeightM)}" step="100" />
                        </div>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Slope <span class="unit">\xB0</span> ${g(v["Shield Slope"])}</div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-shield-slope" data-idx="${m}" value="${$.slopeAngleDeg||5}" min="1" max="15" step="0.5" />
                          <input type="range" class="tec-shield-slope-slider" data-idx="${m}" value="${$.slopeAngleDeg||5}" min="1" max="15" step="0.5" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddShield" class="tec-add-btn">+ Add Shield Volcano</button>
              </div>

              <div class="subsection">
                <h3>Rift Valleys ${g(v["Rift Valley"])}</h3>
                <div id="tecRiftCards">
                  ${e.riftValleys.map(($,m)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <span class="label">Rift ${m+1}</span>
                        <button class="tec-rift-remove" data-idx="${m}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Width <span class="unit">km</span> ${g(v["Graben Width"])}</div></div>
                        <input type="number" class="tec-rift-width" data-idx="${m}" value="${$.grabenWidthKm||50}" min="5" max="300" step="5" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Depth <span class="unit">m</span> ${g(v["Graben Depth"])}</div></div>
                        <input type="number" class="tec-rift-depth" data-idx="${m}" value="${$.grabenDepthM||1e3}" min="50" max="5000" step="50" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Fault Angle <span class="unit">\xB0</span> ${g(v["Fault Angle"])}</div></div>
                        <input type="number" class="tec-rift-angle" data-idx="${m}" value="${$.faultAngleDeg||60}" min="20" max="80" step="1" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Volcanic Fill <span class="unit">m</span> ${g(v["Volcanic Fill"])}</div></div>
                        <input type="number" class="tec-rift-fill" data-idx="${m}" value="${$.volcanicFillM||0}" min="0" max="5000" step="50" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Shoulder Height <span class="unit">m</span> ${g(v["Shoulder Height"])}</div></div>
                        <input type="number" class="tec-rift-shoulder" data-idx="${m}" value="${$.shoulderHeightM||0}" min="0" max="3000" step="50" />
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddRift" class="tec-add-btn">+ Add Rift Valley</button>
              </div>

              <div class="subsection">
                <h3>Oceans</h3>
                <div class="form-row">
                  <div><div class="label">Mid-Ocean Ridge Height ${g(v["Mid-Ocean Ridge Height"])} <span class="unit">m</span></div></div>
                  <div class="input-pair">
                    <input id="tecRidgeHeight" type="number" min="1000" max="5000" step="100" value="${e.ridgeHeightM}" />
                    <input id="tecRidgeHeight_slider" type="range" min="1000" max="5000" step="100" value="${e.ridgeHeightM}" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Spreading Rate ${g(v["Spreading Rate"])} <span class="unit">mm/yr</span></div></div>
                  <div class="input-pair">
                    <input id="tecSpreadingRate" type="number" min="${C.min}" max="${Math.max(C.max,1)}" step="1" value="${Math.round(C.rateMmYr)}" readonly />
                    <input id="tecSpreadingRate_slider" type="range" min="0" max="100" step="1" value="${Math.round(e.spreadingRateFraction*100)}" ${C.min===C.max?"disabled":""} />
                  </div>
                </div>
                <div class="kpi" style="margin-top:4px">
                  <div class="kpi__meta">${A(C.label)} (${A(p)})</div>
                </div>
              </div>

              <div class="subsection">
                <h3>Continental Margin ${g(v["Continental Margin"])}</h3>
                <div class="form-row">
                  <div><div class="label">Shelf Width <span class="unit">km</span> ${g(v["Shelf Width"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-shelf-w" value="${e.margin.shelfWidthKm}" min="1" max="500" step="5" />
                    <input type="range" class="tec-margin-shelf-w-slider" value="${e.margin.shelfWidthKm}" min="1" max="500" step="5" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Shelf Depth <span class="unit">m</span> ${g(v["Shelf Depth"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-shelf-d" value="${e.margin.shelfDepthM}" min="10" max="500" step="5" />
                    <input type="range" class="tec-margin-shelf-d-slider" value="${e.margin.shelfDepthM}" min="10" max="500" step="5" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Slope Angle <span class="unit">\xB0</span> ${g(v["Margin Slope"])}</div></div>
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
              ${le(t)}
              ${ce(t)}
              ${u(s,y,b,S,t)}
            </div>
          </div>
        </div>

      </div>`,E(o),Y(o);let D=o.querySelector("#tecPlanetSelect");D&&q(D,i.map($=>({value:$.id,label:$.name||$.inputs?.name||$.id,selected:$.id===h?.id}))),l(o,s,y,S)}M();let _=document.createElement("div");document.body.appendChild(_);let P=X({steps:fe,storageKey:"worldsmith.tec.tutorial",container:_});o.addEventListener("click",c=>{c.target.closest("#tecTutorials")&&P?.toggle()});let H=new MutationObserver(()=>{o.isConnected||(P?.destroy(),_.remove(),H.disconnect())});return H.observe(o.parentNode||document.body,{childList:!0}),o.addEventListener("input",c=>{let t=c.target,h=t.closest(".input-pair");if(h&&t.id!=="tecSpreadingRate_slider"){let n=h.querySelector(t.type==="range"?'input[type="number"]':'input[type="range"]');n&&n!==t&&(n.value=t.value)}if(t.id==="tecRidgeHeight"||t.id==="tecRidgeHeight_slider"){e.ridgeHeightM=Number(t.value)||2600,d(),R();return}if(t.classList.contains("tec-inactive-height")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].originalHeightM=Number(t.value)||0,d(),R());return}if(t.classList.contains("tec-inactive-age")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].ageMyr=Number(t.value)||0,d(),R());return}if(t.classList.contains("tec-inactive-erosion")){let n=Number(t.dataset.idx);e.inactiveRanges[n]&&(e.inactiveRanges[n].erosionRate=Number(t.value)||5,d(),R());return}if(t.classList.contains("tec-slab-angle")||t.classList.contains("tec-slab-angle-slider")){let n=Number(t.dataset.idx);e.mountainRanges[n]&&(e.mountainRanges[n].slabAngleDeg=Number(t.value)||45,d(),R());return}if(t.classList.contains("tec-convergence")||t.classList.contains("tec-convergence-slider")){let n=Number(t.dataset.idx);e.mountainRanges[n]&&(e.mountainRanges[n].convergenceMmYr=Number(t.value)||50,d(),R());return}if(t.id==="tecSpreadingRate_slider"){e.spreadingRateFraction=Number(t.value)/100,d(),R();return}if(t.classList.contains("tec-margin-shelf-w")||t.classList.contains("tec-margin-shelf-w-slider")){e.margin.shelfWidthKm=Number(t.value)||80,d(),R();return}if(t.classList.contains("tec-margin-shelf-d")||t.classList.contains("tec-margin-shelf-d-slider")){e.margin.shelfDepthM=Number(t.value)||130,d(),R();return}if(t.classList.contains("tec-margin-slope")||t.classList.contains("tec-margin-slope-slider")){e.margin.slopeAngleDeg=Number(t.value)||3.5,d(),R();return}if(t.classList.contains("tec-shield-height")||t.classList.contains("tec-shield-height-slider")){let n=Number(t.dataset.idx);e.shieldVolcanoes[n]&&(e.shieldVolcanoes[n].heightM=Number(t.value)||5e3,d(),R());return}if(t.classList.contains("tec-shield-slope")||t.classList.contains("tec-shield-slope-slider")){let n=Number(t.dataset.idx);e.shieldVolcanoes[n]&&(e.shieldVolcanoes[n].slopeAngleDeg=Number(t.value)||5,d(),R());return}if(t.classList.contains("tec-rift-width")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].grabenWidthKm=Number(t.value)||50,d(),R());return}if(t.classList.contains("tec-rift-depth")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].grabenDepthM=Number(t.value)||1e3,d(),R());return}if(t.classList.contains("tec-rift-angle")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].faultAngleDeg=Number(t.value)||60,d(),R());return}if(t.classList.contains("tec-rift-fill")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].volcanicFillM=Number(t.value)||0,d(),R());return}if(t.classList.contains("tec-rift-shoulder")){let n=Number(t.dataset.idx);e.riftValleys[n]&&(e.riftValleys[n].shoulderHeightM=Number(t.value)||0,d(),R());return}}),o.addEventListener("change",c=>{let t=c.target;if(t.id==="tecPlanetSelect"){Z(t.value),M();return}if(t.classList.contains("tec-type-select")){let h=Number(t.dataset.idx);e.mountainRanges[h]&&(e.mountainRanges[h].type=t.value,e.selectedRangeIdx=h,d(),M());return}if(t.classList.contains("tec-inactive-type")){let h=Number(t.dataset.idx);e.inactiveRanges[h]&&(e.inactiveRanges[h].type=t.value,d(),M());return}}),o.addEventListener("click",c=>{let t=c.target;if(t.classList.contains("tec-iso-btn")){e.isostasyMode=t.dataset.iso||"off",d(),M();return}if(t.id==="tecAddRange"){let n="mr"+Math.random().toString(36).slice(2,7);e.mountainRanges.push({id:n,type:"andean",label:"Range",widths:{},heights:{},slabAngleDeg:45,convergenceMmYr:50}),e.selectedRangeIdx=e.mountainRanges.length-1,d(),M();return}if(t.classList.contains("tec-range-remove")){let n=Number(t.dataset.idx);e.mountainRanges.splice(n,1),e.selectedRangeIdx=Math.min(e.selectedRangeIdx,Math.max(0,e.mountainRanges.length-1)),d(),M();return}if(t.id==="tecAddInactive"){let n="ir"+Math.random().toString(36).slice(2,7);e.inactiveRanges.push({id:n,type:"ural",originalHeightM:5e3,ageMyr:200,erosionRate:5}),d(),M();return}if(t.classList.contains("tec-inactive-remove")){let n=Number(t.dataset.idx);e.inactiveRanges.splice(n,1),d(),M();return}if(t.classList.contains("tec-range-tab")){T(Number(t.dataset.idx));return}if(t.id==="tecAddShield"){e.shieldVolcanoes.push({heightM:5e3,slopeAngleDeg:5}),d(),M();return}if(t.classList.contains("tec-shield-remove")){e.shieldVolcanoes.splice(Number(t.dataset.idx),1),d(),M();return}if(t.id==="tecAddRift"){e.riftValleys.push({grabenWidthKm:50,grabenDepthM:1e3,faultAngleDeg:60,volcanicFillM:0,shoulderHeightM:0}),d(),M();return}if(t.classList.contains("tec-rift-remove")){e.riftValleys.splice(Number(t.dataset.idx),1),d(),M();return}let h=t.closest(".tec-range-card[data-idx]");if(h&&!t.classList.contains("tec-range-remove")&&!t.closest("select")){T(Number(h.dataset.idx));return}}),()=>{}}export{oe as getPlanetTectonicContext,Pe as initTectonicsPage};
