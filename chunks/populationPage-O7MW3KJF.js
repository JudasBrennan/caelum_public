import{a as q,b as wt,c as xt,d as Ct,e as et}from"./chunk-YAWL2UWM.js";import{a as St,b as At}from"./chunk-XBX7C7DH.js";import{f as yt,g as Pt}from"./chunk-B6FZYDGD.js";import"./chunk-2QQ4TWOT.js";import"./chunk-NDMX2VLS.js";import"./chunk-5YVVLRFP.js";import"./chunk-MXEPBJGN.js";import"./chunk-HLZ2ABGO.js";import{b as Q}from"./chunk-X5HJXCPV.js";import"./chunk-UN6CKA7Q.js";import"./chunk-E74JE3YP.js";import"./chunk-SMGR3AMC.js";import{c as vt}from"./chunk-DFN46JRM.js";import{a as h,d as tt,e as gt}from"./chunk-4HEO5JKX.js";import"./chunk-XMLMEZIZ.js";import{a as L}from"./chunk-7PVDVLB6.js";import{Ka as V,La as X,Ma as J,V as U,ib as bt,za as Y}from"./chunk-26GBR7HP.js";import{X as j,da as mt}from"./chunk-MU7BKJ2M.js";import"./chunk-WNGVR2CK.js";import"./chunk-PEDZU4MZ.js";import"./chunk-32DKD6ZO.js";import{f as y,g as u,h as E,j as p}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";var $t=Object.freeze(["Dry","Shallow oceans","Extensive oceans","Global ocean","Deep ocean","Ice world"].reduce((t,o)=>(t[o]=mt(o).liquidOceanFraction,t),{})),Rt={"Hunter-Gatherer":.05,Neolithic:2,"Bronze Age":8,"Iron Age":15,Medieval:30,"Early Industrial":80,Industrial:200,"Post-Industrial":400,"Sci-Fi High":1e3},Ft={"Hunter-Gatherer":.005,Neolithic:.008,"Bronze Age":.01,"Iron Age":.01,Medieval:.01,"Early Industrial":.015,Industrial:.02,"Post-Industrial":.005,"Sci-Fi High":.003},kt=4,zt=.77,Mt=6371,at=Object.keys(Rt);function Tt(t){return t>=1e12?p(t/1e12,2)+" trillion":t>=1e9?p(t/1e9,2)+" billion":t>=1e6?p(t/1e6,2)+" million":t>=1e3?p(t/1e3,1)+" thousand":p(t,0)}function Kt(t){let o=$t[t]??$t["Shallow oceans"];return{oceanFraction:E(o,3),landFraction:E(1-o,3)}}function Nt(t){if(!t||!t.length)return 0;let o=t.filter(a=>a.master!=="E"&&a.master!=="X");if(!o.length)return 0;let i=0,n=0,e=new Set;for(let a of o){let r=`${a.latMin}-${a.latMax}-${a.variant}`;if(e.has(r))continue;e.add(r);let c=Math.sin(a.latMin*Math.PI/180),v=Math.sin(a.latMax*Math.PI/180),d=Math.abs(v-c);i+=d;let b=y(a.aridity,0,1);a.master==="B"&&(b=a.aridity<.25?.05:.3),n+=d*b}return i>0?E(n/i,3):0}function qt(t,o,i){let n=Math.max(u(t,0),0),e=Math.max(u(o,30),0),a=y(u(i,77)/100,0,1),r=1+(kt-1)*zt,c=1+(kt-1)*a,v=e*(c/r);return Math.round(n*v)}function _t(t,o,i,n){let e=Math.max(u(t,1e3),1),a=y(u(o,100),1,e),r=Math.max(u(i,.01),0),c=Math.max(u(n,0),0);if(r===0||c===0)return a;let v=(e-a)/a;return Math.round(e/(1+v*Math.exp(-r*c)))}function Gt(t,o,i,n,e=100){let a=Math.max(u(n,1e3),1),r=y(u(e,100),10,500),c=a/r,v=[];for(let d=0;d<=r;d++){let b=E(d*c,1);v.push({year:b,population:_t(t,o,i,b)})}return v}function Et(t,o,i=1){let n=Math.max(u(t,0),0),e=y(Math.round(u(o,6)),1,100),a=y(u(i,1),.5,1.5);if(n===0)return[];let r=0;for(let d=1;d<=e;d++)r+=1/Math.pow(d,a);let c=n/r,v=[];for(let d=1;d<=e;d++){let b=Math.round(c/Math.pow(d,a));v.push({rank:d,population:b,fraction:E(b/n,4)})}return v}function Ht({radiusKm:t=Mt,waterRegime:o="Extensive oceans",climateZones:i=[],techEra:n="Medieval",initialPopulation:e=1e3,growthRate:a=null,timeElapsedYears:r=0,continentCount:c=6,regionCount:v=10,zipfExponent:d=1,hydrosphere:b=null,productivityContext:f=null,oceanPctOverride:w=null,habitablePctOverride:S=null,productivePctOverride:x=null,cropPctOverride:_=null}={}){let l=Math.max(u(t,Mt),1),R=4*Math.PI*l*l,A=b&&typeof b=="object"?{oceanFraction:y(u(b.liquidOceanFraction,0),0,1),landFraction:y(u(b.landFraction,1),0,1)}:Kt(o),T=w!=null?y(u(w,71),0,99):E(A.oceanFraction*100,1),M=w!=null?1-T/100:y(u(A.landFraction,1-A.oceanFraction),0,1),s=R*M,P=j(i),$=S!=null?y(u(S,50),0,100):E(P*100,1),k=s*($/100),O=y(u(f?.outputs?.populationCarryingCapacityModifier,1),.1,1.15),G=y(Nt(i)*O,0,1),I=x!=null?y(u(x,50),0,100):E(G*100,1),F=k*(I/100),z=_!=null?y(u(_,77),0,100):77,D=at.includes(n)?n:"Medieval",W=Rt[D],g=Ft[D],C=a!=null?y(u(a,g),0,.05):g,H=qt(F,W,z),K=y(Math.round(u(e,1e3)),1,Math.max(H,1)),Z=Math.max(u(r,0),0),N=_t(H,K,C,Z),Lt=C>0&&H>K?Math.log(19*(H-K)/K)/C:1e3,Ot=Math.max(Z,Lt,100),Dt=Gt(H,K,C,Ot,100),st=y(Math.round(u(c,6)),1,20),ct=y(Math.round(u(v,10)),1,50),B=y(u(d,1),.5,1.5),It=Et(N,st,B).map(ft=>({...ft,subregions:Et(ft.population,ct,B)})),pt=s>0?N/s:0,ut=k>0?N/k:0,dt=C>0?Math.LN2/C:1/0,ht=H>0?N/H*100:0;return{inputs:{radiusKm:l,waterRegime:o,techEra:D,oceanPct:T,habitablePct:$,productivePct:I,cropPct:z,initialPopulation:K,growthRate:C,timeElapsedYears:Z,continentCount:st,regionCount:ct,zipfExponent:B,oceanIsAuto:w==null,habitableIsAuto:S==null,productiveIsAuto:x==null,cropIsAuto:_==null,productivityContextApplied:x==null&&f!=null},population:{surfaceAreaKm2:R,landAreaKm2:s,habitableAreaKm2:k,productiveAreaKm2:F,K:H,currentPopulation:N,overallDensityPerKm2:E(pt,2),habitableDensityPerKm2:E(ut,2),timeSeries:Dt,continents:It,doublingTimeYears:E(dt,1),saturationPct:E(ht,1)},display:{surfaceArea:p(R,0)+" km\xB2",landArea:p(s,0)+" km\xB2",habitableArea:p(k,0)+" km\xB2",productiveArea:p(F,0)+" km\xB2",carryingCapacity:Tt(H),currentPopulation:Tt(N),overallDensity:p(pt,1)+"/km\xB2",habitableDensity:p(ut,1)+"/km\xB2",doublingTime:C>0?p(dt,0)+" years":"\u221E",saturation:p(ht,1)+"%",techEra:D,growthRate:p(C*100,2)+"%/yr"}}}var m={Population:`Procedural population model combining land-use analysis, logistic (Verhulst) growth, and Zipf rank-size distribution.

Land area, habitability, and productivity are auto-derived from the planet\u2019s water regime and climate zones; civilization parameters (tech era, growth rate, time) are user-configurable.`,"Technology Era":`Civilization technology level determining base population density (people per km\xB2 of productive land) and default growth rate.

Hunter-Gatherer: ~0.05/km\xB2.  Medieval: ~30/km\xB2.  Industrial: ~200/km\xB2.  Sci-Fi High: ~1,000/km\xB2.`,"Growth Rate":`Intrinsic growth rate r (per year) for the Verhulst logistic model. This is the maximum rate when population is far below carrying capacity.

The effective rate slows automatically as P approaches K: r_eff = r \xD7 (1 \u2212 P/K).

Reference: Verhulst (1838, Correspondance math\xE9matique et physique).`,"Carrying Capacity":`Maximum sustainable population K = productive area \xD7 density \xD7 crop-efficiency factor.

Crops feed ~4\xD7 more people per unit area than livestock (FAO, 2020). A 100% crop world supports ~1.3\xD7 more than the 77/23 Earth default.`,"Ocean Coverage":`Percentage of the planet\u2019s surface covered by ocean. Auto mode follows the inferred surface-ocean coverage from water inventory and basin capacity when available; override only sets authored population/visual land-ocean split outputs.

Earth: ~71%.  Mars-like (Dry): ~0%.`,Habitability:`Fraction of land area that is habitable, derived from climate zones. K\xF6ppen master classes E (polar) and X (special) are excluded.

Area-weighted by spherical zone geometry.`,Productivity:"Fraction of habitable land that is productive (arable or grazing-suitable). Based on aridity index: deserts ~5%, steppes ~30%, temperate/tropical ~80\u2013100%.","Crop Fraction":`Percentage of productive land used for crops versus livestock grazing.

Earth: ~77% crops, ~23% livestock (FAO, 2020). Crops feed ~4\xD7 more people per unit area.`,"Zipf Exponent":`Controls how unevenly population is distributed across regions. P(rank) = P(1) / rank^q.

q = 1.0: standard Zipf\u2019s law (2nd region = \xBD of 1st). q < 1.0: more even.  q > 1.0: more concentrated.

Empirical range for Earth: q \u2248 0.8\u20131.2.

Reference: Zipf (1949, Human Behavior and the Principle of Least Effort).`,"Current Population":`Projected population after logistic growth from the initial population over the elapsed time.

P(t) = K / (1 + ((K \u2212 P\u2080) / P\u2080) \xD7 e^(\u2212r \xD7 t)).

Approaches carrying capacity K as time increases.`,Saturation:`Population as a percentage of carrying capacity (P / K \xD7 100%).

Below ~50%: growth is near-exponential.  Above ~50%: growth decelerates as resources become scarce.`,"Habitable Density":`People per km\xB2 of habitable land area.

Habitable land excludes polar (E) and special (X) climate zones.`,"Surface Area":`Total surface area of the planet (4\u03C0r\xB2).

Split into ocean and land fractions by the ocean coverage percentage.`,"Land Area":`Non-ocean portion of the planet's surface.

Land Area = Surface Area \xD7 (1 \u2212 Ocean%).`,"Habitable Area":`Portion of land area with climate zones suitable for settlement (excludes polar and special zones).

Derived from climate zone data or the habitable % override.`,"Productive Area":`Arable and grazing-suitable land within the habitable area.

Productivity fraction is driven by aridity index: deserts ~5%, steppes ~30%, temperate/tropical ~80\u2013100%.`,"Doubling Time":`Time for the population to double at the current effective growth rate.

t\u2082 = ln(2) / r_eff.  Increases as population approaches carrying capacity because r_eff slows.`,"Overall Density":`People per km\xB2 of total land area (including uninhabitable land).

Compare with habitable density to gauge how much land is actually settled.`,"Initial Population":`Starting population P\u2080 at time t = 0 for the logistic growth curve.

Smaller values produce a longer exponential phase before the S-curve inflects.`,"Time Elapsed":`Number of years elapsed since the initial population.

The orange marker on the growth curve shows the current time position.`,Continents:`Number of major landmasses for the Zipf rank-size distribution.

Population is divided among continents by Zipf's law, then each continent is further subdivided into regions.`,"Regions per Continent":`Number of regional subdivisions within each continent.

Regions within a continent also follow a Zipf rank-size distribution with the same exponent q.`,"Land Use Cascade":`Visual breakdown showing how the planet's surface area cascades from total surface \u2192 land \u2192 habitable \u2192 productive.

Each bar shows the split as a percentage.`,"Growth Curve":`Logistic (Verhulst) S-curve showing population over time.

The dashed line marks carrying capacity K.  The orange marker shows the current elapsed time.`};function Wt(t){let o={radiusKm:6371,waterRegime:"Extensive oceans",climateZones:[]},i=X(t);if(!i)return o;let n=U(t,`planet:${i.id}`)||U(t,i.id),e=n?At(t,n).model||n:null,a=e?yt(e,"population"):null,r=a&&a.status!=="full"?Pt(e,"population"):"";if(a?.status==="none")return{...o,unsupportedSurfaceMessage:r};let{model:c}=St(t,i);if(!c?.derived)return o;let v=Array.isArray(c.derived.surfaceClimateContext?.outputs?.zones)?c.derived.surfaceClimateContext.outputs.zones:[];return{radiusKm:c.derived.radiusKm||6371,waterRegime:c.derived.waterRegime||"Extensive oceans",hydrosphere:c.derived.hydrosphere||null,surfaceClimateContext:c.derived.surfaceClimateContext||null,productivityContext:c.derived.productivityContext||null,climateZones:v,limitedSurfaceMessage:a?.status==="limited"?r:""}}function Zt(t,o,i,n){let e=t.getContext("2d"),a=window.devicePixelRatio||1,r=t.clientWidth,c=t.clientHeight;t.width=r*a,t.height=c*a,e.scale(a,a);let v=getComputedStyle(t).getPropertyValue("color")||"#ccc",d="#7eb2ff",b="#a6abcc",f={top:16,bottom:28,left:64,right:16},w=r-f.left-f.right,S=c-f.top-f.bottom;if(e.clearRect(0,0,r,c),!o.length||i<=0)return;let x=o[o.length-1].year||1,_=i*1.05;function l(s){return f.left+s/x*w}function R(s){return f.top+S-s/_*S}e.strokeStyle="rgba(255,255,255,0.06)",e.lineWidth=1;for(let s=1;s<=4;s++){let P=f.top+S*s/5;e.beginPath(),e.moveTo(f.left,P),e.lineTo(f.left+w,P),e.stroke()}e.strokeStyle=b,e.lineWidth=1,e.setLineDash([6,4]);let A=R(i);if(e.beginPath(),e.moveTo(f.left,A),e.lineTo(f.left+w,A),e.stroke(),e.setLineDash([]),e.fillStyle=b,e.font="9px var(--font-mono, monospace)",e.textAlign="left",e.fillText("K",f.left+4,A-4),e.strokeStyle=d,e.lineWidth=2,e.beginPath(),o.forEach((s,P)=>{let $=l(s.year),k=R(s.population);P===0?e.moveTo($,k):e.lineTo($,k)}),e.stroke(),n>0&&n<=x){let s=l(n);e.strokeStyle="#ff9966",e.lineWidth=1,e.setLineDash([3,3]),e.beginPath(),e.moveTo(s,f.top),e.lineTo(s,f.top+S),e.stroke(),e.setLineDash([]),e.fillStyle="#ff9966",e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText("t",s,f.top-4)}e.fillStyle=v,e.font="9px var(--font-mono, monospace)",e.textAlign="right";let T=4;for(let s=0;s<=T;s++){let P=i*s/T,$=R(P);e.fillText(ot(P),f.left-6,$+3)}e.textAlign="center";let M=5;for(let s=0;s<=M;s++){let P=x*s/M,$=l(P);e.fillText(p(P,0),$,f.top+S+16)}e.fillStyle=b,e.textAlign="center",e.fillText("Years",f.left+w/2,c-2)}function ot(t){return t>=1e12?p(t/1e12,1)+"T":t>=1e9?p(t/1e9,1)+"B":t>=1e6?p(t/1e6,1)+"M":t>=1e3?p(t/1e3,0)+"K":p(t,0)}function Bt(t,o){let i=t.getContext("2d"),n=window.devicePixelRatio||1,e=t.clientWidth,a=t.clientHeight;t.width=e*n,t.height=a*n,i.scale(n,n);let r=getComputedStyle(t).getPropertyValue("color")||"#ccc",c={left:80,right:8,top:4,bottom:4},v=e-c.left-c.right,d=Math.floor((a-c.top-c.bottom)/3),b=3,f=o.population.surfaceAreaKm2||1,w=o.population.landAreaKm2/f,S=o.population.landAreaKm2>0?o.population.habitableAreaKm2/o.population.landAreaKm2:0,x=o.population.habitableAreaKm2>0?o.population.productiveAreaKm2/o.population.habitableAreaKm2:0;[{label:"Surface",fracs:[{f:1-w,c:"#3a7cc4",l:"Ocean"},{f:w,c:"#6b8f5e",l:"Land"}]},{label:"Land",fracs:[{f:1-S,c:"#666",l:"Uninhabitable"},{f:S,c:"#6b8f5e",l:"Habitable"}]},{label:"Habitable",fracs:[{f:1-x,c:"#8a7a55",l:"Unproductive"},{f:x,c:"#6b8f5e",l:"Productive"}]}].forEach((l,R)=>{let A=c.top+R*(d+b);i.fillStyle=r,i.font="10px var(--font-mono, monospace)",i.textAlign="right",i.fillText(l.label,c.left-8,A+d/2+4);let T=c.left;for(let M of l.fracs){let s=v*M.f;if(!(s<1)){if(i.fillStyle=M.c,i.globalAlpha=.5,i.fillRect(T,A,Math.max(s-1,1),d),i.globalAlpha=1,s>30){i.fillStyle=r,i.font="9px var(--font-mono, monospace)",i.textAlign="center";let P=`${M.l} ${p(M.f*100,0)}%`,$=`${p(M.f*100,0)}%`,k=6,O=i.measureText(P).width+k<s?P:$;i.measureText(O).width+k<s&&i.fillText(O,T+s/2,A+d/2+3)}T+=s}}})}var jt=[{title:"Getting Started",body:"The Population page models growth, carrying capacity, and settlement distribution for a civilisation on your planet. It uses logistic growth and Zipf rank-size distributions."},{title:"Technology Era",body:"Select an era from hunter-gatherer to sci-fi. Each era sets baseline parameters for carrying capacity and growth rate. Higher technology supports larger populations per unit of land."},{title:"Growth Parameters",body:"Adjust growth rate, initial population, and elapsed time. The S-curve shows logistic growth approaching carrying capacity. Saturation percentage indicates how full the world is."},{title:"Land Use",body:"Configure ocean coverage, habitability, and productivity percentages. The cascade shows how surface area narrows from total area to productive farmland. Crop and livestock splits affect caloric output."},{title:"Distribution",body:"Population is distributed across continents and regions using Zipf\u2019s law. The rank-size chart shows how cities are distributed, from the largest capital to smaller settlements."}];function lt(t){return t?.name||t?.inputs?.name||t?.id||"No compatible planet"}function Ut(t=[],o=null){return t.map(i=>({value:i.id,label:lt(i),selected:i.id===o?.id}))}function Yt(t={}){return[t.oceanPctOverride,t.habitablePctOverride,t.productivePctOverride,t.cropPctOverride].filter(o=>o!=null&&o!=="").length}function it({selected:t,state:o,model:i,unsupportedMessage:n="",empty:e=!1}={}){let a=Yt(o);return q(wt({id:"populationCockpit",title:"Population",summary:e?"Create a rocky planet before modelling settlement capacity.":"Reads the selected rocky planet's surface context, then applies population-only civilization assumptions.",current:{label:"Selected planet",value:e?"No compatible planet":lt(t),meta:n?"Population output is unavailable for this body.":"Population diagnostic target."},statusItems:[{label:"Reads from",value:"Planets",meta:"Radius, climate zones, water regime, and hydrosphere context."},{label:"Diagnostic only",value:n?"Unsupported":i?i.display.currentPopulation:"Waiting",meta:"Planet science is not rewritten from this page.",tone:n?"warn":""},{label:"Authoring override",value:a?`${a} active`:"Auto",meta:"Ocean, habitability, productivity, and crop assumptions save only to Population."}],source:{label:"Source",value:"Reads from Planets",meta:"Change inputs on Planets. Local civilization assumptions stay on Population."},details:{id:"populationContextDisclosure",title:"What this reads",summary:"Planet surface, climate, hydrosphere, and optional population assumptions.",items:["Reads from Planets: radius, climate zones, water regime, hydrosphere, and surface classification.","Change inputs on Planets: edit climate, water, orbit, and habitability assumptions upstream.","Diagnostic only: population outputs do not rewrite planet science context.","Authoring override: local ocean, habitability, productivity, and crop percentages affect population outputs only."]},nextStep:{id:"populationNextStepStrip",recommendation:e?"Create a rocky planet before modelling population.":"Edit habitability or climate assumptions on Planets when capacity looks wrong.",actions:[{label:"Edit planet",href:"#/planet",primary:!0},{label:"Open Climate",href:"#/climate"},{label:"Open Calendar",href:"#/calendar"}]}}))}function nt(){return q(xt({id:"populationDependencyNotice",title:"Reads from Planets",body:"Reads from the selected rocky planet's radius, water regime, climate zones, and hydrosphere context. Change inputs on Planets.",source:"Diagnostic only for planet science. Authoring override sliders here affect population outputs without rewriting inferred climate or ocean coverage.",actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}function rt(t,o,i=""){return q(Ct({id:"populationObjectSelector",title:"Planet selection",summary:"Choose the rocky planet whose settlement model should read upstream science from.",selectedLabel:"Selected planet",selectedValue:lt(o),selectedMeta:i?"No compatible population output for this body.":"Population diagnostic target.",selectId:"popPlanetSelect",selectLabel:"Planet",selectOptions:Ut(t,o)}))}function Vt(t,o){return`
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Population</h1></div>
          <div class="panel__body">
            ${it({selected:o,empty:!0})}
            ${nt()}
            ${q(et({id:"populationEmptyState",title:"No compatible rocky planet",body:"Population needs a rocky planet before it can read climate, hydrosphere, and surface-area context.",actions:[{label:"Create a planet",href:"#/planet"}]}))}
            ${t.length?rt(t,o):""}
          </div>
        </div>
      </div>`}function fe(t){let o=Y(),i=V(o);if(!i.length){t.innerHTML=Vt(i,null);return}let n=o.population||{},e={techEra:n.techEra||"Medieval",initialPopulation:n.initialPopulation||1e3,growthRate:n.growthRate??null,timeElapsedYears:n.timeElapsedYears??500,continentCount:n.continentCount||6,regionCount:n.regionCount||10,zipfExponent:n.zipfExponent??1,oceanPctOverride:n.oceanPctOverride??null,habitablePctOverride:n.habitablePctOverride??null,productivePctOverride:n.productivePctOverride??null,cropPctOverride:n.cropPctOverride??null};function a(){bt({population:{...e}})}function r(){let b=Y(),f=V(b),w=X(b),S=Wt(b),x=S.unsupportedSurfaceMessage||"",_=S.limitedSurfaceMessage||"",l=x?null:Ht({...S,...e});if(x){t.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${h(m.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${it({selected:w,state:e,unsupportedMessage:x})}
            ${nt()}
            ${rt(f,w,x)}
            ${q(et({id:"populationUnsupportedState",title:"No compatible population output",body:x,actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}
          </div>
        </div>
      </div>`,tt(t);let g=t.querySelector("#popPlanetSelect");g&&g.addEventListener("change",()=>{J(g.value),r()});return}let R=at.map(g=>`<option value="${L(g)}"${g===e.techEra?" selected":""}>${L(g)}</option>`).join(""),A=g=>g?'<span class="pop-auto-badge">auto</span>':"";t.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${h(m.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${it({selected:w,state:e,model:l})}
            ${nt()}
            ${rt(f,w)}

            ${_?`<div class="derived-readout">${L(_)}</div>`:""}

            <section class="kpi-section" id="populationSummary">
              <div class="kpi-section__header"><h3 class="kpi-section__title">Summary</h3></div>
              <div class="kpi-grid">
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Population ${h(m["Current Population"])}</div>
                  <div class="kpi__value">${L(l.display.currentPopulation)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Carrying Capacity ${h(m["Carrying Capacity"])}</div>
                  <div class="kpi__value">${L(l.display.carryingCapacity)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Saturation ${h(m.Saturation)}</div>
                  <div class="kpi__value">${L(l.display.saturation)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Habitable Density ${h(m["Habitable Density"])}</div>
                  <div class="kpi__value">${L(l.display.habitableDensity)}</div>
                </div></div>
              </div>
            </section>

            <div class="grid-2" style="margin-top:12px">
              <div class="subsection">
                <h3>Land Use ${h(m["Land Use Cascade"])}</h3>

                <div class="form-row">
                  <label>Ocean % ${A(l.inputs.oceanIsAuto)} ${h(m["Ocean Coverage"])}</label>
                  <input type="range" id="popOcean" min="0" max="99" step="1"
                    value="${l.inputs.oceanPct}">
                  <span class="derived-readout">${p(l.inputs.oceanPct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Habitable % ${A(l.inputs.habitableIsAuto)} ${h(m.Habitability)}</label>
                  <input type="range" id="popHabitable" min="0" max="100" step="1"
                    value="${l.inputs.habitablePct}">
                  <span class="derived-readout">${p(l.inputs.habitablePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Productive % ${A(l.inputs.productiveIsAuto)} ${h(m.Productivity)}</label>
                  <input type="range" id="popProductive" min="0" max="100" step="1"
                    value="${l.inputs.productivePct}">
                  <span class="derived-readout">${p(l.inputs.productivePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Crop % ${h(m["Crop Fraction"])}</label>
                  <input type="range" id="popCrop" min="0" max="100" step="1"
                    value="${l.inputs.cropPct}">
                  <span class="derived-readout">${p(l.inputs.cropPct,0)}%</span>
                </div>

                <button id="popResetAuto" class="btn btn--sm" style="margin-top:4px">Reset to auto</button>

                <canvas id="popCascadeCanvas" class="pop-cascade-canvas"></canvas>

                ${Q([{labelHtml:`Surface Area ${h(m["Surface Area"])}`,value:l.display.surfaceArea},{labelHtml:`Land Area ${h(m["Land Area"])}`,value:l.display.landArea},{labelHtml:`Habitable Area ${h(m["Habitable Area"])}`,value:l.display.habitableArea},{labelHtml:`Productive Area ${h(m["Productive Area"])}`,value:l.display.productiveArea}])}
              </div>

              <div class="subsection">
                <h3>Growth Model ${h(m["Growth Curve"])}</h3>

                <div class="form-row">
                  <label for="popTechEra">Tech Era ${h(m["Technology Era"])}</label>
                  <select id="popTechEra">${R}</select>
                </div>

                <div class="form-row">
                  <label>Initial Population ${h(m["Initial Population"])}</label>
                  <input type="number" id="popInitPop" min="1" step="1"
                    value="${e.initialPopulation}">
                </div>

                <div class="form-row">
                  <label>Growth Rate ${h(m["Growth Rate"])}</label>
                  <input type="range" id="popGrowthRate" min="0.001" max="0.05" step="0.001"
                    value="${l.inputs.growthRate}">
                  <span class="derived-readout">${L(l.display.growthRate)}</span>
                </div>

                <div class="form-row">
                  <label>Time Elapsed (years) ${h(m["Time Elapsed"])}</label>
                  <input type="number" id="popTime" min="0" step="10"
                    value="${e.timeElapsedYears}">
                </div>

                <canvas id="popGrowthCanvas" class="pop-growth-canvas"></canvas>

                ${Q([{labelHtml:`Doubling Time ${h(m["Doubling Time"])}`,value:l.display.doublingTime},{labelHtml:`Overall Density ${h(m["Overall Density"])}`,value:l.display.overallDensity}])}
              </div>
            </div>

            <div class="subsection" style="margin-top:12px">
              <h3>Distribution ${h(m["Zipf Exponent"])}</h3>

              <div class="grid-2">
                <div class="form-row">
                  <label>Continents ${h(m.Continents)}</label>
                  <input type="number" id="popContCount" min="1" max="20" step="1"
                    value="${e.continentCount}">
                </div>
                <div class="form-row">
                  <label>Regions per Continent ${h(m["Regions per Continent"])}</label>
                  <input type="number" id="popRegCount" min="1" max="50" step="1"
                    value="${e.regionCount}">
                </div>
              </div>

              <div class="form-row">
                <label>Zipf Exponent (q) ${h(m["Zipf Exponent"])}</label>
                <input type="range" id="popZipf" min="0.5" max="1.5" step="0.05"
                  value="${e.zipfExponent}">
                <span class="derived-readout">${p(e.zipfExponent,2)}</span>
              </div>

              <div class="pop-dist-list">
                ${l.population.continents.map(g=>`
                  <details class="pop-dist-card">
                    <summary class="pop-dist-summary">
                      <span class="pop-dist-rank">Continent ${g.rank}</span>
                      <span class="pop-dist-pop">${ot(g.population)}</span>
                      <span class="pop-dist-frac">${p(g.fraction*100,1)}%</span>
                      <span class="pop-dist-bar-wrap">
                        <span class="pop-dist-bar" style="width:${(g.fraction*100).toFixed(1)}%"></span>
                      </span>
                    </summary>
                    <div class="pop-dist-regions">
                      <table class="pop-dist-table">
                        <thead><tr><th>Region</th><th>Population</th><th>%</th><th></th></tr></thead>
                        <tbody>
                          ${g.subregions.map(C=>`
                            <tr>
                              <td>${C.rank}</td>
                              <td>${ot(C.population)}</td>
                              <td>${p(C.fraction*100,1)}%</td>
                              <td><span class="pop-dist-bar" style="width:${(C.fraction*100).toFixed(1)}%"></span></td>
                            </tr>`).join("")}
                        </tbody>
                      </table>
                    </div>
                  </details>`).join("")}
              </div>
            </div>

          </div>
        </div>
      </div>`,tt(t),vt(t),requestAnimationFrame(()=>{let g=t.querySelector("#popGrowthCanvas");g&&Zt(g,l.population.timeSeries,l.population.K,l.inputs.timeElapsedYears);let C=t.querySelector("#popCascadeCanvas");C&&Bt(C,l)});let T=t.querySelector("#popPlanetSelect");T&&T.addEventListener("change",()=>{J(T.value),r()});let M=t.querySelector("#popTechEra");M&&M.addEventListener("change",()=>{e.techEra=M.value,e.growthRate=null,a(),r()});let s=t.querySelector("#popInitPop");s&&s.addEventListener("change",()=>{e.initialPopulation=Math.max(1,Number(s.value)||1e3),a(),r()});let P=t.querySelector("#popGrowthRate");P&&P.addEventListener("input",()=>{e.growthRate=Number(P.value),a(),r()});let $=t.querySelector("#popTime");$&&$.addEventListener("change",()=>{e.timeElapsedYears=Math.max(0,Number($.value)||0),a(),r()});let k=t.querySelector("#popOcean");k&&k.addEventListener("input",()=>{e.oceanPctOverride=Number(k.value),a(),r()});let O=t.querySelector("#popHabitable");O&&O.addEventListener("input",()=>{e.habitablePctOverride=Number(O.value),a(),r()});let G=t.querySelector("#popProductive");G&&G.addEventListener("input",()=>{e.productivePctOverride=Number(G.value),a(),r()});let I=t.querySelector("#popCrop");I&&I.addEventListener("input",()=>{e.cropPctOverride=Number(I.value),a(),r()});let F=t.querySelector("#popResetAuto");F&&F.addEventListener("click",()=>{e.oceanPctOverride=null,e.habitablePctOverride=null,e.productivePctOverride=null,e.cropPctOverride=null,a(),r()});let z=t.querySelector("#popContCount");z&&z.addEventListener("change",()=>{e.continentCount=Math.max(1,Math.min(20,Number(z.value)||6)),a(),r()});let D=t.querySelector("#popRegCount");D&&D.addEventListener("change",()=>{e.regionCount=Math.max(1,Math.min(50,Number(D.value)||10)),a(),r()});let W=t.querySelector("#popZipf");W&&W.addEventListener("input",()=>{e.zipfExponent=Number(W.value),a(),r()})}r();let c=document.createElement("div");document.body.appendChild(c);let v=gt({steps:jt,storageKey:"worldsmith.pop.tutorial",container:c});t.addEventListener("click",b=>{b.target.closest("#popTutorials")&&v?.toggle()});let d=new MutationObserver(()=>{t.isConnected||(v?.destroy(),c.remove(),d.disconnect())});d.observe(t.parentNode||document.body,{childList:!0})}export{fe as initPopulationPage};
