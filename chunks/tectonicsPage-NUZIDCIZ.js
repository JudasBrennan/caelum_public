import{a as te,b as ie}from"./chunk-5UTN4JF5.js";import{a as ae,c as O,d as se,f as j}from"./chunk-KD5CBWLO.js";import{f as Q,g as ee}from"./chunk-7KREH3G2.js";import{b as N}from"./chunk-X5HJXCPV.js";import{c as Y}from"./chunk-DFN46JRM.js";import"./chunk-3PTMSAEF.js";import"./chunk-OTQP7TWD.js";import"./chunk-WC4KNZ43.js";import{a as m,d as I,e as X}from"./chunk-4HEO5JKX.js";import{e as q}from"./chunk-XMLMEZIZ.js";import{a as L}from"./chunk-7PVDVLB6.js";import{Ka as U,La as K,Ma as Z,V as G,ib as J,za as E}from"./chunk-CO4MAOXZ.js";import"./chunk-6EWUDDHO.js";import"./chunk-WNGVR2CK.js";import"./chunk-PEDZU4MZ.js";import{j as w}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";var u={"Max Peak Height":`Maximum possible mountain peak height, inversely proportional to surface gravity. Formula: H_max = C / g, where C depends on crustal composition.

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

Earth average: ~3.5\xB0. Steeper at active margins, gentler at passive margins.`,"Ridge Height":"Elevation of newly-formed crust at the mid-ocean ridge above the abyssal plain (m). Starting point for the ocean depth curve.","Max Ocean Depth":"Maximum ocean floor depth reached by old oceanic crust (m). Determined by the plate-cooling model: crust subsides as it ages and cools, flattening at ~80\u2013100 Myr.","Cross-Section Width":"Total width of the mountain range cross-section from forearc to back-arc (km). Sum of all tectonic zone widths.","Highest Zone":"Average elevation of the tallest tectonic zone in the cross-section (m). Individual peaks within a zone can exceed this average, up to the max peak height.","Margin Width":"Total width from the coast to the abyssal plain (km). Sum of shelf, slope, and continental rise widths.","Base Radius":`Horizontal distance from the summit to the base of the shield volcano (km). Derived from height and slope angle: R = H / tan(\u03B8).

Shallower slopes produce much wider bases.`,"Rift Total Width":"Total width of the rift valley cross-section (km), including the graben floor, both fault scarps, volcanic fill, and uplifted shoulders."},B=["var(--accent)","var(--muted)","#7eb8a0","var(--warn)","#c49a8b","#8a9ac4"];function re(l){let p=getComputedStyle(l);return B.map(a=>{if(a.startsWith("var(")){let i=a.slice(4,-1);return p.getPropertyValue(i).trim()||a}return a})}var ne=ae();function le(l){let p={gravityG:1,massEarth:1,ageGyr:4.6,surfaceTempK:288,h2oPct:0,compositionClass:"Earth-like",tidalHeatingWm2:0,radioisotopeAbundance:1},a=K(l);if(!a)return p;let i=G(l,`planet:${a.id}`)||G(l,a.id),e=i?ie(l,i).model||i:null,c=e?Q(e,"tectonics"):null,g=c&&c.status!=="full"?ee(e,"tectonics"):"";if(c?.status==="none")return{...p,unsupportedSurfaceMessage:g};let{model:r,starConfig:R}=te(l,a);return r?.derived?{gravityG:r.derived.gravityG||1,massEarth:r.inputs?.massEarth||1,ageGyr:Number(R?.ageGyr)||4.6,surfaceTempK:r.derived.surfaceTempK||288,h2oPct:r.inputs?.h2oPct||0,compositionClass:r.derived.compositionClass||"Earth-like",tidalHeatingWm2:r.derived.planetTidalHeatingWm2||0,radioisotopeAbundance:r.derived.radioisotopeAbundance??1,limitedSurfaceMessage:c?.status==="limited"?g:""}:p}var oe=["#5b9bd5","#3a7cc4","#2a5ea0","#1e3f6f"];function de(l,p,a,i={}){let e=l.getContext("2d"),c=window.devicePixelRatio||1,g=l.clientWidth,r=l.clientHeight;l.width=g*c,l.height=r*c,e.scale(c,c);let R=re(l),f={top:24,bottom:36,left:56,right:16},P=g-f.left-f.right,k=r-f.top-f.bottom,T=i.isostasyMode==="airy"||i.isostasyMode==="pratt"?Math.round(k*.2):0,H=k-T,o=p.totalWidthKm||1,t=a*1.15,d=P/o,s=H/t,h=getComputedStyle(l).getPropertyValue("color")||"#ccc",n=getComputedStyle(l).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";e.clearRect(0,0,g,r),e.strokeStyle=n,e.lineWidth=.5;let $=z(t,5);for(let S=0;S<=t;S+=$){let M=f.top+H-S*s;e.beginPath(),e.moveTo(f.left,M),e.lineTo(f.left+P,M),e.stroke(),e.fillStyle=h,e.font="10px var(--font-mono, monospace)",e.textAlign="right",e.fillText(w(S,0),f.left-4,M+3)}let b=z(o,5);e.textAlign="center";for(let S=0;S<=o;S+=b){let M=f.left+S*d;e.fillStyle=h,e.font="10px var(--font-mono, monospace)",e.fillText(w(S,0),M,r-f.bottom+16)}e.save(),e.fillStyle=h,e.font="11px var(--font-mono, monospace)",e.textAlign="center",e.fillText("Width (km)",f.left+P/2,r-4),e.save(),e.translate(12,f.top+H/2),e.rotate(-Math.PI/2),e.fillText("Height (m)",0,0),e.restore(),e.restore();let y=f.top+H;e.strokeStyle="rgba(100,180,255,0.5)",e.lineWidth=1,e.setLineDash([4,4]),e.beginPath(),e.moveTo(f.left,y),e.lineTo(f.left+P,y),e.stroke(),e.setLineDash([]);let W=f.top+H-a*s;e.strokeStyle="rgba(255,100,100,0.5)",e.lineWidth=1,e.setLineDash([6,3]),e.beginPath(),e.moveTo(f.left,W),e.lineTo(f.left+P,W),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(255,100,100,0.7)",e.font="10px var(--font-mono, monospace)",e.textAlign="right",e.fillText("Max "+w(a,0)+" m",f.left+P-2,W-4);for(let S=0;S<p.zones.length;S++){let M=p.zones[S],A=f.left+M.x*d,_=M.width*d,x=M.height*s;if(e.fillStyle=R[S%R.length],e.globalAlpha=.5,M.taper&&M.taperToPeak)e.beginPath(),e.moveTo(A,y),e.lineTo(A,y-M.minHeight*s),e.lineTo(A+_,y-x),e.lineTo(A+_,y),e.closePath(),e.fill();else if(M.taper&&M.taperFromPeak)e.beginPath(),e.moveTo(A,y),e.lineTo(A,y-x),e.lineTo(A+_,y-M.minHeight*s),e.lineTo(A+_,y),e.closePath(),e.fill();else if(M.taper){let v=S>0?p.zones[S-1]:null,D=S<p.zones.length-1?p.zones[S+1]:null,V=v?v.taperFromPeak?v.minHeight:v.height:0,F=D?D.taperToPeak?D.minHeight:D.height:0;e.beginPath(),e.moveTo(A,y),e.lineTo(A,y-V*s),e.lineTo(A+_,y-F*s),e.lineTo(A+_,y),e.closePath(),e.fill()}else e.fillRect(A,y-x,_,x);if(e.globalAlpha=1,_>30){let v=x;if(M.taper&&!M.taperToPeak&&!M.taperFromPeak){let D=S>0?p.zones[S-1]:null,V=S<p.zones.length-1?p.zones[S+1]:null,F=D?D.taperFromPeak?D.minHeight:D.height:0,ce=V?V.taperToPeak?V.minHeight:V.height:0;v=(F+ce)/2*s}e.fillStyle=h,e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText(M.name,A+_/2,y-v-4)}}if(T>0&&(e.fillStyle="rgba(139,94,60,0.06)",e.fillRect(f.left,y,P,T)),i.isostasyMode==="airy")for(let S=0;S<p.zones.length;S++){let M=p.zones[S];if(M.height<=0)continue;let _=se(M.height)*s,x=f.left+M.x*d,v=M.width*d;e.fillStyle="#8b5e3c",e.globalAlpha=.35,e.fillRect(x,y,v,Math.min(_,T)),e.globalAlpha=1}else if(i.isostasyMode==="pratt"){let S=y+T*.7;e.strokeStyle="#8b5e3c",e.lineWidth=1.5,e.setLineDash([4,3]),e.beginPath(),e.moveTo(f.left,S),e.lineTo(f.left+P,S),e.stroke(),e.setLineDash([])}if(i.arcDistanceKm!=null&&i.arcDistanceKm<=o){let S=f.left+i.arcDistanceKm*d;e.strokeStyle="rgba(255,80,80,0.7)",e.lineWidth=1.5,e.setLineDash([3,3]),e.beginPath(),e.moveTo(S,f.top),e.lineTo(S,y),e.stroke(),e.setLineDash([]),e.fillStyle="rgba(255,80,80,0.85)",e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText("Arc "+w(i.arcDistanceKm,0)+" km",S,f.top+10)}}function he(l,p,a){let i=l.getContext("2d"),e=window.devicePixelRatio||1,c=l.clientWidth,g=l.clientHeight;l.width=c*e,l.height=g*e,i.scale(e,e);let r={top:20,bottom:36,left:56,right:16},R=c-r.left-r.right,f=g-r.top-r.bottom,P=p[p.length-1]?.ageMyr||1e3,k=7e3,C=R/P,T=f/k,H=getComputedStyle(l).getPropertyValue("color")||"#ccc",o=getComputedStyle(l).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";i.clearRect(0,0,c,g),i.strokeStyle=o,i.lineWidth=.5;let t=1e3;for(let n=0;n<=k;n+=t){let $=r.top+n*T;i.beginPath(),i.moveTo(r.left,$),i.lineTo(r.left+R,$),i.stroke(),i.fillStyle=H,i.font="10px var(--font-mono, monospace)",i.textAlign="right",i.fillText(w(n,0),r.left-4,$+3)}let d=z(P,5);i.textAlign="center";for(let n=0;n<=P;n+=d){let $=r.left+n*C;i.fillStyle=H,i.font="10px var(--font-mono, monospace)",i.fillText(w(n,0),$,g-r.bottom+16)}i.fillStyle=H,i.font="11px var(--font-mono, monospace)",i.textAlign="center",i.fillText("Crust Age (Myr)",r.left+R/2,g-4),i.save(),i.translate(12,r.top+f/2),i.rotate(-Math.PI/2),i.fillText("Depth (m)",0,0),i.restore();let s=r.top+a*T;i.strokeStyle="rgba(100,200,255,0.5)",i.lineWidth=1,i.setLineDash([4,4]),i.beginPath(),i.moveTo(r.left,s),i.lineTo(r.left+R,s),i.stroke(),i.setLineDash([]),i.fillStyle="rgba(100,200,255,0.7)",i.font="10px var(--font-mono, monospace)",i.textAlign="left",i.fillText("Ridge "+w(a,0)+" m",r.left+4,s-4);let h=r.top+6400*T;i.strokeStyle="rgba(255,150,100,0.5)",i.lineWidth=1,i.setLineDash([4,4]),i.beginPath(),i.moveTo(r.left,h),i.lineTo(r.left+R,h),i.stroke(),i.setLineDash([]),i.fillStyle="rgba(255,150,100,0.7)",i.font="10px var(--font-mono, monospace)",i.textAlign="left",i.fillText("Max 6,400 m",r.left+4,h-4),i.strokeStyle="var(--accent, #66aaff)",i.lineWidth=2,i.beginPath();for(let n=0;n<p.length;n++){let $=p[n],b=r.left+$.ageMyr*C,y=r.top+$.depthM*T;n===0?i.moveTo(b,y):i.lineTo(b,y)}i.stroke(),i.fillStyle="rgba(30,90,160,0.15)",i.beginPath(),i.moveTo(r.left,r.top);for(let n of p)i.lineTo(r.left+n.ageMyr*C,r.top+n.depthM*T);i.lineTo(r.left+R,r.top),i.closePath(),i.fill()}function z(l,p){let a=l/p,i=Math.pow(10,Math.floor(Math.log10(a))),e=a/i,c;return e<=1.5?c=1:e<=3.5?c=2:e<=7.5?c=5:c=10,c*i}function pe(l,p){let a=l.getContext("2d"),i=window.devicePixelRatio||1,e=l.clientWidth,c=l.clientHeight;l.width=e*i,l.height=c*i,a.scale(i,i);let g={top:20,bottom:36,left:56,right:16},r=e-g.left-g.right,R=c-g.top-g.bottom,f=p.totalWidthKm||500,P=5500,k=r/f,C=R/P,T=getComputedStyle(l).getPropertyValue("color")||"#ccc",H=getComputedStyle(l).getPropertyValue("--muted")||"rgba(255,255,255,0.12)";a.clearRect(0,0,e,c),a.strokeStyle=H,a.lineWidth=.5;let o=1e3;for(let d=0;d<=P;d+=o){let s=g.top+d*C;a.beginPath(),a.moveTo(g.left,s),a.lineTo(g.left+r,s),a.stroke(),a.fillStyle=T,a.font="10px var(--font-mono, monospace)",a.textAlign="right",a.fillText(w(d,0),g.left-4,s+3)}let t=z(f,5);a.textAlign="center";for(let d=0;d<=f;d+=t){let s=g.left+d*k;a.fillStyle=T,a.font="10px var(--font-mono, monospace)",a.fillText(w(d,0),s,c-g.bottom+16)}a.fillStyle=T,a.font="11px var(--font-mono, monospace)",a.textAlign="center",a.fillText("Distance from Coast (km)",g.left+r/2,c-4),a.save(),a.translate(12,g.top+R/2),a.rotate(-Math.PI/2),a.fillText("Depth (m)",0,0),a.restore();for(let d=0;d<p.segments.length;d++){let s=p.segments[d],h=g.left+s.startKm*k,n=g.left+s.endKm*k,$=g.top+s.startM*C,b=g.top+s.endM*C;a.fillStyle=oe[d%oe.length],a.globalAlpha=.3,a.beginPath(),a.moveTo(h,g.top),a.lineTo(h,$),a.lineTo(n,b),a.lineTo(n,g.top),a.closePath(),a.fill(),a.globalAlpha=1;let y=(h+n)/2;n-h>30&&(a.fillStyle=T,a.font="9px var(--font-mono, monospace)",a.textAlign="center",a.fillText(s.name,y,g.top+14))}a.strokeStyle="var(--accent, #66aaff)",a.lineWidth=2,a.beginPath();for(let d=0;d<p.points.length;d++){let s=p.points[d],h=g.left+s.distKm*k,n=g.top+s.depthM*C;d===0?a.moveTo(h,n):a.lineTo(h,n)}a.stroke()}function ge(l,p,a){let i=l.getContext("2d"),e=window.devicePixelRatio||1,c=l.clientWidth,g=l.clientHeight;l.width=c*e,l.height=g*e,i.scale(e,e);let r={top:20,bottom:36,left:56,right:16},R=c-r.left-r.right,f=g-r.top-r.bottom,P=15,C=f/((a||1e4)*1.15),T=C*1e3/P,H=p.baseRadiusKm*2.2*T,o=H>R?R/H:1,t=C*o,d=T*o,s=getComputedStyle(l).getPropertyValue("color")||"#ccc";i.clearRect(0,0,c,g);let h=r.top+f;i.strokeStyle="rgba(100,180,255,0.3)",i.lineWidth=1,i.setLineDash([4,4]),i.beginPath(),i.moveTo(r.left,h),i.lineTo(r.left+R,h),i.stroke(),i.setLineDash([]);let n=r.left+R/2;i.fillStyle="#c49a8b",i.globalAlpha=.5,i.beginPath(),i.moveTo(n-p.baseRadiusKm*d,h);for(let b of p.points)i.lineTo(n-b.rKm*d,h-b.hM*t);for(let b=p.points.length-1;b>=0;b--){let y=p.points[b];i.lineTo(n+y.rKm*d,h-y.hM*t)}i.lineTo(n+p.baseRadiusKm*d,h),i.closePath(),i.fill(),i.globalAlpha=1,i.strokeStyle="var(--accent, #66aaff)",i.lineWidth=1.5,i.beginPath(),i.moveTo(n-p.baseRadiusKm*d,h);for(let b of p.points)i.lineTo(n-b.rKm*d,h-b.hM*t);for(let b=p.points.length-1;b>=0;b--){let y=p.points[b];i.lineTo(n+y.rKm*d,h-y.hM*t)}i.lineTo(n+p.baseRadiusKm*d,h),i.stroke(),i.fillStyle=s,i.font="11px var(--font-mono, monospace)",i.textAlign="center",i.fillText("Radius (km)",n,g-4);let $=p.points[p.points.length-1]?.hM||0;i.fillText(w($,0)+" m",n,h-$*t-6)}function me(l,p){let a=l.getContext("2d"),i=window.devicePixelRatio||1,e=l.clientWidth,c=l.clientHeight;l.width=e*i,l.height=c*i,a.scale(i,i);let g={top:24,bottom:36,left:56,right:16},r=e-g.left-g.right,R=c-g.top-g.bottom,f=p.totalWidthKm||1,P=0,k=0;for(let s of p.zones)s.height<P&&(P=s.height),s.height>k&&(k=s.height);let C=(k-P)*1.3||1,T=r/f,H=R/C,o=g.top+k*1.15*H,t=getComputedStyle(l).getPropertyValue("color")||"#ccc";a.clearRect(0,0,e,c),a.strokeStyle="rgba(100,180,255,0.4)",a.lineWidth=1,a.setLineDash([4,4]),a.beginPath(),a.moveTo(g.left,o),a.lineTo(g.left+r,o),a.stroke(),a.setLineDash([]);let d=["#8b7355","#a05a3c","#6b3a2a","#a05a3c","#8b7355"];for(let s=0;s<p.zones.length;s++){let h=p.zones[s],n=g.left+h.x*T,$=h.width*T,b=h.height*H;if(a.fillStyle=d[s%d.length],a.globalAlpha=.5,h.taper&&h.taperFromPeak?(a.beginPath(),a.moveTo(n,o),a.lineTo(n,o-(p.zones[0]?.height||0)*H),a.lineTo(n+$,o-b),a.lineTo(n+$,o),a.closePath(),a.fill()):h.taper&&h.taperToPeak?(a.beginPath(),a.moveTo(n,o),a.lineTo(n,o-b),a.lineTo(n+$,o-(p.zones[4]?.height||0)*H),a.lineTo(n+$,o),a.closePath(),a.fill()):a.fillRect(n,o-b,$,b<0?-b:b),a.globalAlpha=1,$>30){a.fillStyle=t,a.font="9px var(--font-mono, monospace)",a.textAlign="center";let y=b>=0?o-b-4:o-b+12;a.fillText(h.name,n+$/2,y)}}a.fillStyle=t,a.font="11px var(--font-mono, monospace)",a.textAlign="center",a.fillText("Width (km)",g.left+r/2,c-4)}var ue=[{title:"Getting Started",body:"The Tectonics page models crustal features from plate dynamics. Select a mountain range type, set convergence parameters, and review the resulting elevation profile."},{title:"Mountain Types",body:"Choose from Andean (subduction), Laramide (flat-slab), Ural (ancient collision), or Himalayan (active collision). Each type produces a distinct cross-section and peak height."},{title:"Ocean and Margins",body:"Model continental margins with shelf width, slope angle, and abyssal depth. Ocean depth curves depend on plate age and spreading rate."},{title:"Volcanoes",body:"Configure shield volcanoes, hotspot chains, and rift valleys. Elastic lithosphere thickness and tidal heating affect maximum volcano height."},{title:"Plate Canvas",body:"Generate Voronoi plate boundaries with classification as convergent, divergent, or transform. Use this to sketch a tectonic map for your world."}];function Te(l){let p=E(),a=U(p);if(!a.length){l.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Tectonics</h1></div>
          <div class="panel__body">
            <p class="hint">Create a planet on the <a href="#/planet">Planets</a> page first.</p>
          </div>
        </div>
      </div>`;return}let i=p.tectonics||{},e={ridgeHeightM:Number(i.ridgeHeightM)||2600,mountainRanges:Array.isArray(i.mountainRanges)?[...i.mountainRanges]:[],inactiveRanges:Array.isArray(i.inactiveRanges)?[...i.inactiveRanges]:[],selectedRangeIdx:0,spreadingRateFraction:i.spreadingRateFraction!=null?Number(i.spreadingRateFraction):.5,isostasyMode:i.isostasyMode||"off",margin:i.margin||{shelfWidthKm:80,shelfDepthM:130,slopeAngleDeg:3.5},shieldVolcanoes:Array.isArray(i.shieldVolcanoes)?[...i.shieldVolcanoes]:[],riftValleys:Array.isArray(i.riftValleys)?[...i.riftValleys]:[]};function c(){J({tectonics:{ridgeHeightM:e.ridgeHeightM,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,spreadingRateFraction:e.spreadingRateFraction,isostasyMode:e.isostasyMode,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys}})}function g(o,t,d,s){return`
              <div class="subsection">
                <h3>Summary</h3>
                <div class="kpi-grid" style="margin-top:8px">
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Max Peak Height ${m(u["Max Peak Height"])}</div>
                    <div class="kpi__value">${o.display.maxPeakHeight}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Max Ocean Depth ${m(u["Max Ocean Depth"])}</div>
                    <div class="kpi__value">${o.display.maxOceanDepth}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Ridge Height ${m(u["Ridge Height"])}</div>
                    <div class="kpi__value">${o.display.ridgeHeight}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Margin Width ${m(u["Margin Width"])}</div>
                    <div class="kpi__value">${w(o.tectonics.margin.totalWidthKm,0)} km</div>
                  </div></div>
                </div>
              </div>
              ${t?`
                <div class="subsection">
                  <h3>Mountain Cross-Section: ${L(t.label)} ${m(u["Cross-Section"])}</h3>
                  ${o.tectonics.mountainProfiles.length>1?`
                    <div class="tec-range-tabs">
                      ${o.tectonics.mountainProfiles.map((h,n)=>`<button class="tec-range-tab ${n===d?"is-active":""}" data-idx="${n}">${L(h.label)} ${n+1}</button>`).join("")}
                    </div>
                  `:""}
                  <div class="tec-isostasy-toggle">
                    <button class="tec-iso-btn ${e.isostasyMode==="off"?"is-active":""}" data-iso="off">Off</button>
                    <button class="tec-iso-btn ${e.isostasyMode==="airy"?"is-active":""}" data-iso="airy">Airy ${m(u.Isostasy)}</button>
                    <button class="tec-iso-btn ${e.isostasyMode==="pratt"?"is-active":""}" data-iso="pratt">Pratt ${m(u.Pratt)}</button>
                  </div>
                  <canvas id="tecMtnCanvas" class="tec-canvas ${e.isostasyMode!=="off"?"tec-canvas--tall":""}"></canvas>
                  <div class="tec-zone-legend">
                    ${t.zones.map((h,n)=>`<span class="tec-legend-item"><span class="tec-legend-swatch" style="background:${B[n%B.length]}"></span>${L(h.name)}</span>`).join("")}
                    ${e.isostasyMode==="airy"?'<span class="tec-legend-item"><span class="tec-legend-swatch tec-legend-swatch--crust"></span>Crustal Roots</span>':""}
                    ${e.isostasyMode==="pratt"?'<span class="tec-legend-item"><span class="tec-legend-swatch tec-legend-swatch--crust"></span>Moho</span>':""}
                  </div>
                  ${N([{labelHtml:`Total Width ${m(u["Cross-Section Width"])}`,value:`${w(t.totalWidthKm,0)} km`},{labelHtml:`Highest Zone Avg. ${m(u["Highest Zone"])}`,value:`${w(t.peakM,0)} m`},...s!=null?[{labelHtml:`Arc Distance ${m(u["Arc Distance"])}`,value:`${w(s,0)} km`}]:[]])}
                </div>
              `:'<p class="hint">Add a mountain range to see the cross-section.</p>'}

              ${o.tectonics.inactiveProfiles.length?`
                <div class="subsection">
                  <h3>Inactive Ranges</h3>
                  <div class="cluster-table-wrap">
                    <table class="cluster-table">
                      <thead><tr><th>Type</th><th>Original</th><th>Age</th><th>Eroded Height</th></tr></thead>
                      <tbody>
                        ${o.tectonics.inactiveProfiles.map(h=>`<tr><td>${L(h.label)}</td><td>${w(h.originalHeightM,0)} m</td><td>${w(h.ageMyr,0)} Myr</td><td>${w(h.erodedHeightM,0)} m</td></tr>`).join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              `:""}

              ${o.tectonics.shieldProfiles.length?`
                <div class="subsection">
                  <h3>Shield Volcano Profiles</h3>
                  ${o.tectonics.shieldProfiles.map((h,n)=>`<canvas id="tecShieldCanvas${n}" class="tec-canvas" style="height:180px"></canvas>
                      ${N([{labelHtml:`Height ${m(u["Shield Height"])}`,value:`${w(h.heightM,0)} m`},{labelHtml:`Base Radius ${m(u["Base Radius"])}`,value:`${w(h.baseRadiusKm,0)} km`}])}`).join("")}
                </div>
              `:""}

              ${o.tectonics.riftProfiles.length?`
                <div class="subsection">
                  <h3>Rift Valley Profiles</h3>
                  ${o.tectonics.riftProfiles.map((h,n)=>`<canvas id="tecRiftCanvas${n}" class="tec-canvas" style="height:200px"></canvas>
                      ${N([{labelHtml:`Total Width ${m(u["Rift Total Width"])}`,value:`${w(h.totalWidthKm,0)} km`}])}`).join("")}
                </div>
              `:""}

              <div class="subsection">
                <h3>Ocean Depth Curve ${m(u["Ocean Depth Curve"])}</h3>
                <canvas id="tecOceanCanvas" class="tec-canvas"></canvas>
                ${N([{labelHtml:`Ridge Height ${m(u["Ridge Height"])}`,value:o.display.ridgeHeight},{labelHtml:`Max Ocean Depth ${m(u["Max Ocean Depth"])}`,value:o.display.maxOceanDepth},{labelHtml:`Spreading Rate ${m(u["Spreading Rate"])}`,value:o.display.spreadingRate}])}
              </div>

              <div class="subsection">
                <h3>Continental Margin ${m(u["Continental Margin"])}</h3>
                <canvas id="tecMarginCanvas" class="tec-canvas"></canvas>
                ${N([{labelHtml:`Total Width ${m(u["Margin Width"])}`,value:`${w(o.tectonics.margin.totalWidthKm,0)} km`}])}
              </div>`}function r(o,t,d,s){requestAnimationFrame(()=>{let h=o.querySelector("#tecMtnCanvas");h&&d&&de(h,d,t.tectonics.maxPeakHeightM,{isostasyMode:e.isostasyMode,arcDistanceKm:s});let n=o.querySelector("#tecOceanCanvas");n&&he(n,t.tectonics.ocean.subsidence,e.ridgeHeightM);let $=o.querySelector("#tecMarginCanvas");$&&pe($,t.tectonics.margin),t.tectonics.shieldProfiles.forEach((b,y)=>{let W=o.querySelector(`#tecShieldCanvas${y}`);W&&ge(W,b,t.tectonics.maxShieldHeightM)}),t.tectonics.riftProfiles.forEach((b,y)=>{let W=o.querySelector(`#tecRiftCanvas${y}`);W&&me(W,b)})})}function R(){let o=E(),t=le(o);if(t.unsupportedSurfaceMessage){let _=l.querySelector("#tecOutputs");_&&(_.innerHTML=`<div class="derived-readout">${L(t.unsupportedSurfaceMessage)}</div>`);return}let d=K(o)?.inputs?.tectonicRegime||"mobile",s=j({gravityG:t.gravityG,tectonicRegime:d,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,ridgeHeightM:e.ridgeHeightM,spreadingRateFraction:e.spreadingRateFraction,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys,massEarth:t.massEarth,ageGyr:t.ageGyr,surfaceTempK:t.surfaceTempK,h2oPct:t.h2oPct,compositionClass:t.compositionClass,tidalHeatingWm2:t.tidalHeatingWm2,radioisotopeAbundance:t.radioisotopeAbundance}),h=Math.min(e.selectedRangeIdx,s.tectonics.mountainProfiles.length-1),n=s.tectonics.mountainProfiles[Math.max(0,h)]||null,$=n&&(n.type==="andean"||n.type==="laramide"),y=e.mountainRanges[Math.max(0,h)]?.slabAngleDeg??45,W=$?O(y):null,S=s.tectonics.ocean.spreadingRate,M=l.querySelector("#tecOutputs");if(!M)return;M.innerHTML=`${t.limitedSurfaceMessage?`<div class="derived-readout">${L(t.limitedSurfaceMessage)}</div>`:""}${g(s,n,h,W)}`,I(M),Y(l),r(M,s,n,W);let A=l.querySelector("#tecSpreadingRate");A&&(A.value=Math.round(S.rateMmYr))}function f(){l.querySelectorAll(".tec-range-card[data-idx]").forEach(o=>{let t=Number(o.dataset.idx);o.classList.toggle("is-selected",t===e.selectedRangeIdx)})}function P(o){Number.isFinite(o)&&(e.selectedRangeIdx=Math.max(0,o),f(),R())}function k(){let o=E(),t=le(o),d=K(o);if(t.unsupportedSurfaceMessage){l.innerHTML=`
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
            <div class="derived-readout">${L(t.unsupportedSurfaceMessage)}</div>
          </div>
        </div>
      </div>`,I(l);let x=l.querySelector("#tecPlanetSelect");x&&q(x,a.map(v=>({value:v.id,label:v.name||v.inputs?.name||v.id,selected:v.id===d?.id})));return}let s=t.gravityG,h=K(o)?.inputs?.tectonicRegime||"mobile",n=j({gravityG:s,tectonicRegime:h,mountainRanges:e.mountainRanges,inactiveRanges:e.inactiveRanges,ridgeHeightM:e.ridgeHeightM,spreadingRateFraction:e.spreadingRateFraction,margin:e.margin,shieldVolcanoes:e.shieldVolcanoes,riftValleys:e.riftValleys,massEarth:t.massEarth,ageGyr:t.ageGyr,surfaceTempK:t.surfaceTempK,h2oPct:t.h2oPct,compositionClass:t.compositionClass,tidalHeatingWm2:t.tidalHeatingWm2,radioisotopeAbundance:t.radioisotopeAbundance}),$=Math.min(e.selectedRangeIdx,n.tectonics.mountainProfiles.length-1),b=n.tectonics.mountainProfiles[Math.max(0,$)]||null,y=b&&(b.type==="andean"||b.type==="laramide"),S=e.mountainRanges[Math.max(0,$)]?.slabAngleDeg??45,M=y?O(S):null,A=n.tectonics.ocean.spreadingRate;l.innerHTML=`
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
                  <div class="kpi__label">Max Peak Height ${m(u["Max Peak Height"])}</div>
                  <div class="kpi__value">${n.display.maxPeakHeight}</div>
                  <div class="kpi__meta">at ${w(s,2)} g</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Gravity ${m(u.Gravity)}</div>
                  <div class="kpi__value">${w(s,3)} g</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Max Shield Height ${m(u["Shield Volcano"])}</div>
                  <div class="kpi__value">${n.display.maxShieldHeight}</div>
                  <div class="kpi__meta">${h==="stagnant"?"stagnant lid (1.5\xD7)":h}</div>
                </div></div>
              </div>

              <details class="subsection" style="margin-top:8px">
                <summary><h3 style="display:inline">Planet Factors ${m(u["Planet Factors"])}</h3></summary>
                <div class="kpi-grid" style="margin-top:8px">
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Composition ${m(u.Composition)}</div>
                    <div class="kpi__value">${L(t.compositionClass)}</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Volcanic Activity ${m(u["Volcanic Activity"])}</div>
                    <div class="kpi__value">${n.display.volcanicActivity}</div>
                    <div class="kpi__meta">${w(t.ageGyr,1)} Gyr age</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Erosion Rate ${m(u["Climate Erosion"])}</div>
                    <div class="kpi__value">${n.display.climateErosionRate}</div>
                    <div class="kpi__meta">${w(t.surfaceTempK,0)} K surface</div>
                  </div></div>
                  <div class="kpi-wrap"><div class="kpi">
                    <div class="kpi__label">Elastic Lithosphere ${m(u["Elastic Lithosphere"])}</div>
                    <div class="kpi__value">${n.display.elasticLithosphere}</div>
                  </div></div>
                </div>
              </details>

              <div class="subsection">
                <h3>Active Mountain Ranges ${m(u["Mountain Type"])}</h3>
                <div id="tecRangeCards">
                  ${e.mountainRanges.map((x,v)=>`
                    <div class="tec-range-card ${v===$?"is-selected":""}" data-idx="${v}">
                      <div class="tec-range-card__header">
                        <select class="tec-type-select" data-idx="${v}">
                          ${ne.map(D=>`<option value="${D.key}" ${x.type===D.key?"selected":""}>${L(D.label)}</option>`).join("")}
                        </select>
                        <button class="tec-range-remove" data-idx="${v}" title="Remove range">&times;</button>
                      </div>
                      ${x.type==="andean"||x.type==="laramide"?`
                        <div class="form-row">
                          <div><div class="label">Slab Angle ${m(u["Slab Angle"])} <span class="unit">\xB0</span></div></div>
                          <div class="input-pair">
                            <input type="number" class="tec-slab-angle" data-idx="${v}" value="${x.slabAngleDeg||45}" min="10" max="90" step="1" />
                            <input type="range" class="tec-slab-angle-slider" data-idx="${v}" value="${x.slabAngleDeg||45}" min="10" max="90" step="1" />
                          </div>
                        </div>
                        <div class="kpi" style="margin-top:4px">
                          <div class="kpi__label">Arc Distance ${m(u["Arc Distance"])}</div>
                          <div class="kpi__value">${w(O(x.slabAngleDeg||45),0)} km</div>
                        </div>
                      `:""}
                      <div class="form-row">
                        <div><div class="label">Convergence Rate ${m(u["Convergence Rate"])} <span class="unit">mm/yr</span></div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-convergence" data-idx="${v}" value="${x.convergenceMmYr||50}" min="10" max="100" step="1" />
                          <input type="range" class="tec-convergence-slider" data-idx="${v}" value="${x.convergenceMmYr||50}" min="10" max="100" step="1" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddRange" class="tec-add-btn">+ Add Range</button>
              </div>

              <div class="subsection">
                <h3>Inactive Ranges ${m(u["Inactive Range"])}</h3>
                <div id="tecInactiveCards">
                  ${e.inactiveRanges.map((x,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <select class="tec-inactive-type" data-idx="${v}">
                          ${ne.map(D=>`<option value="${D.key}" ${x.type===D.key?"selected":""}>${L(D.label)}</option>`).join("")}
                        </select>
                        <button class="tec-inactive-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Original Height <span class="unit">m</span> ${m(u["Original Height"])}</div></div>
                        <input type="number" class="tec-inactive-height" data-idx="${v}" value="${x.originalHeightM||5e3}" min="0" max="100000" step="100" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Age <span class="unit">Myr</span> ${m(u["Range Age"])}</div></div>
                        <input type="number" class="tec-inactive-age" data-idx="${v}" value="${x.ageMyr||0}" min="0" max="10000" step="1" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Erosion Rate ${m(u["Erosion Rate"])} <span class="unit">m/Myr</span></div></div>
                        <input type="number" class="tec-inactive-erosion" data-idx="${v}" value="${x.erosionRate||5}" min="0" max="100" step="0.5" />
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddInactive" class="tec-add-btn">+ Add Inactive Range</button>
              </div>

              <div class="subsection">
                <h3>Shield Volcanoes ${m(u["Shield Volcano"])}</h3>
                <div id="tecShieldCards">
                  ${e.shieldVolcanoes.map((x,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <span class="label">Shield ${v+1}</span>
                        <button class="tec-shield-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Height <span class="unit">m</span> ${m(u["Shield Height"])}</div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-shield-height" data-idx="${v}" value="${x.heightM||5e3}" min="100" max="${Math.round(n.tectonics.maxShieldHeightM)}" step="100" />
                          <input type="range" class="tec-shield-height-slider" data-idx="${v}" value="${x.heightM||5e3}" min="100" max="${Math.round(n.tectonics.maxShieldHeightM)}" step="100" />
                        </div>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Slope <span class="unit">\xB0</span> ${m(u["Shield Slope"])}</div></div>
                        <div class="input-pair">
                          <input type="number" class="tec-shield-slope" data-idx="${v}" value="${x.slopeAngleDeg||5}" min="1" max="15" step="0.5" />
                          <input type="range" class="tec-shield-slope-slider" data-idx="${v}" value="${x.slopeAngleDeg||5}" min="1" max="15" step="0.5" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddShield" class="tec-add-btn">+ Add Shield Volcano</button>
              </div>

              <div class="subsection">
                <h3>Rift Valleys ${m(u["Rift Valley"])}</h3>
                <div id="tecRiftCards">
                  ${e.riftValleys.map((x,v)=>`
                    <div class="tec-range-card">
                      <div class="tec-range-card__header">
                        <span class="label">Rift ${v+1}</span>
                        <button class="tec-rift-remove" data-idx="${v}" title="Remove">&times;</button>
                      </div>
                      <div class="form-row">
                        <div><div class="label">Width <span class="unit">km</span> ${m(u["Graben Width"])}</div></div>
                        <input type="number" class="tec-rift-width" data-idx="${v}" value="${x.grabenWidthKm||50}" min="5" max="300" step="5" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Depth <span class="unit">m</span> ${m(u["Graben Depth"])}</div></div>
                        <input type="number" class="tec-rift-depth" data-idx="${v}" value="${x.grabenDepthM||1e3}" min="50" max="5000" step="50" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Fault Angle <span class="unit">\xB0</span> ${m(u["Fault Angle"])}</div></div>
                        <input type="number" class="tec-rift-angle" data-idx="${v}" value="${x.faultAngleDeg||60}" min="20" max="80" step="1" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Volcanic Fill <span class="unit">m</span> ${m(u["Volcanic Fill"])}</div></div>
                        <input type="number" class="tec-rift-fill" data-idx="${v}" value="${x.volcanicFillM||0}" min="0" max="5000" step="50" />
                      </div>
                      <div class="form-row">
                        <div><div class="label">Shoulder Height <span class="unit">m</span> ${m(u["Shoulder Height"])}</div></div>
                        <input type="number" class="tec-rift-shoulder" data-idx="${v}" value="${x.shoulderHeightM||0}" min="0" max="3000" step="50" />
                      </div>
                    </div>
                  `).join("")}
                </div>
                <button id="tecAddRift" class="tec-add-btn">+ Add Rift Valley</button>
              </div>

              <div class="subsection">
                <h3>Oceans</h3>
                <div class="form-row">
                  <div><div class="label">Mid-Ocean Ridge Height ${m(u["Mid-Ocean Ridge Height"])} <span class="unit">m</span></div></div>
                  <div class="input-pair">
                    <input id="tecRidgeHeight" type="number" min="1000" max="5000" step="100" value="${e.ridgeHeightM}" />
                    <input id="tecRidgeHeight_slider" type="range" min="1000" max="5000" step="100" value="${e.ridgeHeightM}" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Spreading Rate ${m(u["Spreading Rate"])} <span class="unit">mm/yr</span></div></div>
                  <div class="input-pair">
                    <input id="tecSpreadingRate" type="number" min="${A.min}" max="${Math.max(A.max,1)}" step="1" value="${Math.round(A.rateMmYr)}" readonly />
                    <input id="tecSpreadingRate_slider" type="range" min="0" max="100" step="1" value="${Math.round(e.spreadingRateFraction*100)}" ${A.min===A.max?"disabled":""} />
                  </div>
                </div>
                <div class="kpi" style="margin-top:4px">
                  <div class="kpi__meta">${L(A.label)} (${L(h)})</div>
                </div>
              </div>

              <div class="subsection">
                <h3>Continental Margin ${m(u["Continental Margin"])}</h3>
                <div class="form-row">
                  <div><div class="label">Shelf Width <span class="unit">km</span> ${m(u["Shelf Width"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-shelf-w" value="${e.margin.shelfWidthKm}" min="1" max="500" step="5" />
                    <input type="range" class="tec-margin-shelf-w-slider" value="${e.margin.shelfWidthKm}" min="1" max="500" step="5" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Shelf Depth <span class="unit">m</span> ${m(u["Shelf Depth"])}</div></div>
                  <div class="input-pair">
                    <input type="number" class="tec-margin-shelf-d" value="${e.margin.shelfDepthM}" min="10" max="500" step="5" />
                    <input type="range" class="tec-margin-shelf-d-slider" value="${e.margin.shelfDepthM}" min="10" max="500" step="5" />
                  </div>
                </div>
                <div class="form-row">
                  <div><div class="label">Slope Angle <span class="unit">\xB0</span> ${m(u["Margin Slope"])}</div></div>
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
              ${t.limitedSurfaceMessage?`<div class="derived-readout">${L(t.limitedSurfaceMessage)}</div>`:""}
              ${g(n,b,$,M)}
            </div>
          </div>
        </div>

      </div>`,I(l),Y(l);let _=l.querySelector("#tecPlanetSelect");_&&q(_,a.map(x=>({value:x.id,label:x.name||x.inputs?.name||x.id,selected:x.id===d?.id}))),r(l,n,b,M)}k();let C=document.createElement("div");document.body.appendChild(C);let T=X({steps:ue,storageKey:"worldsmith.tec.tutorial",container:C});l.addEventListener("click",o=>{o.target.closest("#tecTutorials")&&T?.toggle()});let H=new MutationObserver(()=>{l.isConnected||(T?.destroy(),C.remove(),H.disconnect())});return H.observe(l.parentNode||document.body,{childList:!0}),l.addEventListener("input",o=>{let t=o.target,d=t.closest(".input-pair");if(d&&t.id!=="tecSpreadingRate_slider"){let s=d.querySelector(t.type==="range"?'input[type="number"]':'input[type="range"]');s&&s!==t&&(s.value=t.value)}if(t.id==="tecRidgeHeight"||t.id==="tecRidgeHeight_slider"){e.ridgeHeightM=Number(t.value)||2600,c(),R();return}if(t.classList.contains("tec-inactive-height")){let s=Number(t.dataset.idx);e.inactiveRanges[s]&&(e.inactiveRanges[s].originalHeightM=Number(t.value)||0,c(),R());return}if(t.classList.contains("tec-inactive-age")){let s=Number(t.dataset.idx);e.inactiveRanges[s]&&(e.inactiveRanges[s].ageMyr=Number(t.value)||0,c(),R());return}if(t.classList.contains("tec-inactive-erosion")){let s=Number(t.dataset.idx);e.inactiveRanges[s]&&(e.inactiveRanges[s].erosionRate=Number(t.value)||5,c(),R());return}if(t.classList.contains("tec-slab-angle")||t.classList.contains("tec-slab-angle-slider")){let s=Number(t.dataset.idx);e.mountainRanges[s]&&(e.mountainRanges[s].slabAngleDeg=Number(t.value)||45,c(),R());return}if(t.classList.contains("tec-convergence")||t.classList.contains("tec-convergence-slider")){let s=Number(t.dataset.idx);e.mountainRanges[s]&&(e.mountainRanges[s].convergenceMmYr=Number(t.value)||50,c(),R());return}if(t.id==="tecSpreadingRate_slider"){e.spreadingRateFraction=Number(t.value)/100,c(),R();return}if(t.classList.contains("tec-margin-shelf-w")||t.classList.contains("tec-margin-shelf-w-slider")){e.margin.shelfWidthKm=Number(t.value)||80,c(),R();return}if(t.classList.contains("tec-margin-shelf-d")||t.classList.contains("tec-margin-shelf-d-slider")){e.margin.shelfDepthM=Number(t.value)||130,c(),R();return}if(t.classList.contains("tec-margin-slope")||t.classList.contains("tec-margin-slope-slider")){e.margin.slopeAngleDeg=Number(t.value)||3.5,c(),R();return}if(t.classList.contains("tec-shield-height")||t.classList.contains("tec-shield-height-slider")){let s=Number(t.dataset.idx);e.shieldVolcanoes[s]&&(e.shieldVolcanoes[s].heightM=Number(t.value)||5e3,c(),R());return}if(t.classList.contains("tec-shield-slope")||t.classList.contains("tec-shield-slope-slider")){let s=Number(t.dataset.idx);e.shieldVolcanoes[s]&&(e.shieldVolcanoes[s].slopeAngleDeg=Number(t.value)||5,c(),R());return}if(t.classList.contains("tec-rift-width")){let s=Number(t.dataset.idx);e.riftValleys[s]&&(e.riftValleys[s].grabenWidthKm=Number(t.value)||50,c(),R());return}if(t.classList.contains("tec-rift-depth")){let s=Number(t.dataset.idx);e.riftValleys[s]&&(e.riftValleys[s].grabenDepthM=Number(t.value)||1e3,c(),R());return}if(t.classList.contains("tec-rift-angle")){let s=Number(t.dataset.idx);e.riftValleys[s]&&(e.riftValleys[s].faultAngleDeg=Number(t.value)||60,c(),R());return}if(t.classList.contains("tec-rift-fill")){let s=Number(t.dataset.idx);e.riftValleys[s]&&(e.riftValleys[s].volcanicFillM=Number(t.value)||0,c(),R());return}if(t.classList.contains("tec-rift-shoulder")){let s=Number(t.dataset.idx);e.riftValleys[s]&&(e.riftValleys[s].shoulderHeightM=Number(t.value)||0,c(),R());return}}),l.addEventListener("change",o=>{let t=o.target;if(t.id==="tecPlanetSelect"){Z(t.value),k();return}if(t.classList.contains("tec-type-select")){let d=Number(t.dataset.idx);e.mountainRanges[d]&&(e.mountainRanges[d].type=t.value,e.selectedRangeIdx=d,c(),k());return}if(t.classList.contains("tec-inactive-type")){let d=Number(t.dataset.idx);e.inactiveRanges[d]&&(e.inactiveRanges[d].type=t.value,c(),k());return}}),l.addEventListener("click",o=>{let t=o.target;if(t.classList.contains("tec-iso-btn")){e.isostasyMode=t.dataset.iso||"off",c(),k();return}if(t.id==="tecAddRange"){let s="mr"+Math.random().toString(36).slice(2,7);e.mountainRanges.push({id:s,type:"andean",label:"Range",widths:{},heights:{},slabAngleDeg:45,convergenceMmYr:50}),e.selectedRangeIdx=e.mountainRanges.length-1,c(),k();return}if(t.classList.contains("tec-range-remove")){let s=Number(t.dataset.idx);e.mountainRanges.splice(s,1),e.selectedRangeIdx=Math.min(e.selectedRangeIdx,Math.max(0,e.mountainRanges.length-1)),c(),k();return}if(t.id==="tecAddInactive"){let s="ir"+Math.random().toString(36).slice(2,7);e.inactiveRanges.push({id:s,type:"ural",originalHeightM:5e3,ageMyr:200,erosionRate:5}),c(),k();return}if(t.classList.contains("tec-inactive-remove")){let s=Number(t.dataset.idx);e.inactiveRanges.splice(s,1),c(),k();return}if(t.classList.contains("tec-range-tab")){P(Number(t.dataset.idx));return}if(t.id==="tecAddShield"){e.shieldVolcanoes.push({heightM:5e3,slopeAngleDeg:5}),c(),k();return}if(t.classList.contains("tec-shield-remove")){e.shieldVolcanoes.splice(Number(t.dataset.idx),1),c(),k();return}if(t.id==="tecAddRift"){e.riftValleys.push({grabenWidthKm:50,grabenDepthM:1e3,faultAngleDeg:60,volcanicFillM:0,shoulderHeightM:0}),c(),k();return}if(t.classList.contains("tec-rift-remove")){e.riftValleys.splice(Number(t.dataset.idx),1),c(),k();return}let d=t.closest(".tec-range-card[data-idx]");if(d&&!t.classList.contains("tec-range-remove")&&!t.closest("select")){P(Number(d.dataset.idx));return}}),()=>{}}export{le as getPlanetTectonicContext,Te as initTectonicsPage};
