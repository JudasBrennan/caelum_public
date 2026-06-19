import{a as vt,b as mt}from"./chunk-IGALHBJO.js";import{f as ht,g as ft}from"./chunk-H335UP5P.js";import{b as J}from"./chunk-X5HJXCPV.js";import{c as ut}from"./chunk-DFN46JRM.js";import"./chunk-SK7QD25P.js";import"./chunk-NDMX2VLS.js";import"./chunk-Q2LTS4N3.js";import"./chunk-BZFC53JO.js";import{a as f,d as Q,e as dt}from"./chunk-4HEO5JKX.js";import"./chunk-XMLMEZIZ.js";import{a as H}from"./chunk-7PVDVLB6.js";import{Ka as U,La as V,Ma as X,V as Y,ib as pt,za as j}from"./chunk-XUPETDGS.js";import{X as B,da as ct}from"./chunk-2NRVVUJ7.js";import"./chunk-WNGVR2CK.js";import"./chunk-PEDZU4MZ.js";import{f as y,g as d,h as E,j as u}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";var bt=Object.freeze(["Dry","Shallow oceans","Extensive oceans","Global ocean","Deep ocean","Ice world"].reduce((e,i)=>(e[i]=ct(i).liquidOceanFraction,e),{})),xt={"Hunter-Gatherer":.05,Neolithic:2,"Bronze Age":8,"Iron Age":15,Medieval:30,"Early Industrial":80,Industrial:200,"Post-Industrial":400,"Sci-Fi High":1e3},kt={"Hunter-Gatherer":.005,Neolithic:.008,"Bronze Age":.01,"Iron Age":.01,Medieval:.01,"Early Industrial":.015,Industrial:.02,"Post-Industrial":.005,"Sci-Fi High":.003},gt=4,Et=.77,yt=6371,tt=Object.keys(xt);function Pt(e){return e>=1e12?u(e/1e12,2)+" trillion":e>=1e9?u(e/1e9,2)+" billion":e>=1e6?u(e/1e6,2)+" million":e>=1e3?u(e/1e3,1)+" thousand":u(e,0)}function _t(e){let i=bt[e]??bt["Shallow oceans"];return{oceanFraction:E(i,3),landFraction:E(1-i,3)}}function Ht(e){if(!e||!e.length)return 0;let i=e.filter(a=>a.master!=="E"&&a.master!=="X");if(!i.length)return 0;let o=0,r=0,t=new Set;for(let a of i){let n=`${a.latMin}-${a.latMax}-${a.variant}`;if(t.has(n))continue;t.add(n);let c=Math.sin(a.latMin*Math.PI/180),g=Math.sin(a.latMax*Math.PI/180),h=Math.abs(g-c);o+=h;let m=y(a.aridity,0,1);a.master==="B"&&(m=a.aridity<.25?.05:.3),r+=h*m}return o>0?E(r/o,3):0}function Rt(e,i,o){let r=Math.max(d(e,0),0),t=Math.max(d(i,30),0),a=y(d(o,77)/100,0,1),n=1+(gt-1)*Et,c=1+(gt-1)*a,g=t*(c/n);return Math.round(r*g)}function Ct(e,i,o,r){let t=Math.max(d(e,1e3),1),a=y(d(i,100),1,t),n=Math.max(d(o,.01),0),c=Math.max(d(r,0),0);if(n===0||c===0)return a;let g=(t-a)/a;return Math.round(t/(1+g*Math.exp(-n*c)))}function Lt(e,i,o,r,t=100){let a=Math.max(d(r,1e3),1),n=y(d(t,100),10,500),c=a/n,g=[];for(let h=0;h<=n;h++){let m=E(h*c,1);g.push({year:m,population:Ct(e,i,o,m)})}return g}function wt(e,i,o=1){let r=Math.max(d(e,0),0),t=y(Math.round(d(i,6)),1,100),a=y(d(o,1),.5,1.5);if(r===0)return[];let n=0;for(let h=1;h<=t;h++)n+=1/Math.pow(h,a);let c=r/n,g=[];for(let h=1;h<=t;h++){let m=Math.round(c/Math.pow(h,a));g.push({rank:h,population:m,fraction:E(m/r,4)})}return g}function At({radiusKm:e=yt,waterRegime:i="Extensive oceans",climateZones:o=[],techEra:r="Medieval",initialPopulation:t=1e3,growthRate:a=null,timeElapsedYears:n=0,continentCount:c=6,regionCount:g=10,zipfExponent:h=1,hydrosphere:m=null,productivityContext:b=null,oceanPctOverride:$=null,habitablePctOverride:x=null,productivePctOverride:C=null,cropPctOverride:R=null}={}){let l=Math.max(d(e,yt),1),_=4*Math.PI*l*l,T=m&&typeof m=="object"?{oceanFraction:y(d(m.liquidOceanFraction,0),0,1),landFraction:y(d(m.landFraction,1),0,1)}:_t(i),k=$!=null?y(d($,71),0,99):E(T.oceanFraction*100,1),M=$!=null?1-k/100:y(d(T.landFraction,1-T.oceanFraction),0,1),s=_*M,P=B(o),A=x!=null?y(d(x,50),0,100):E(P*100,1),S=s*(A/100),L=y(d(b?.outputs?.populationCarryingCapacityModifier,1),.1,1.15),z=y(Ht(o)*L,0,1),D=C!=null?y(d(C,50),0,100):E(z*100,1),O=S*(D/100),N=R!=null?y(d(R,77),0,100):77,F=tt.includes(r)?r:"Medieval",G=xt[F],K=kt[F],p=a!=null?y(d(a,K),0,.05):K,w=Rt(O,G,N),I=y(Math.round(d(t,1e3)),1,Math.max(w,1)),W=Math.max(d(n,0),0),q=Ct(w,I,p,W),St=p>0&&w>I?Math.log(19*(w-I)/I)/p:1e3,$t=Math.max(W,St,100),Mt=Lt(w,I,p,$t,100),at=y(Math.round(d(c,6)),1,20),ot=y(Math.round(d(g,10)),1,50),Z=y(d(h,1),.5,1.5),Tt=wt(q,at,Z).map(lt=>({...lt,subregions:wt(lt.population,ot,Z)})),nt=s>0?q/s:0,it=S>0?q/S:0,rt=p>0?Math.LN2/p:1/0,st=w>0?q/w*100:0;return{inputs:{radiusKm:l,waterRegime:i,techEra:F,oceanPct:k,habitablePct:A,productivePct:D,cropPct:N,initialPopulation:I,growthRate:p,timeElapsedYears:W,continentCount:at,regionCount:ot,zipfExponent:Z,oceanIsAuto:$==null,habitableIsAuto:x==null,productiveIsAuto:C==null,cropIsAuto:R==null,productivityContextApplied:C==null&&b!=null},population:{surfaceAreaKm2:_,landAreaKm2:s,habitableAreaKm2:S,productiveAreaKm2:O,K:w,currentPopulation:q,overallDensityPerKm2:E(nt,2),habitableDensityPerKm2:E(it,2),timeSeries:Mt,continents:Tt,doublingTimeYears:E(rt,1),saturationPct:E(st,1)},display:{surfaceArea:u(_,0)+" km\xB2",landArea:u(s,0)+" km\xB2",habitableArea:u(S,0)+" km\xB2",productiveArea:u(O,0)+" km\xB2",carryingCapacity:Pt(w),currentPopulation:Pt(q),overallDensity:u(nt,1)+"/km\xB2",habitableDensity:u(it,1)+"/km\xB2",doublingTime:p>0?u(rt,0)+" years":"\u221E",saturation:u(st,1)+"%",techEra:F,growthRate:u(p*100,2)+"%/yr"}}}var v={Population:`Procedural population model combining land-use analysis, logistic (Verhulst) growth, and Zipf rank-size distribution.

Land area, habitability, and productivity are auto-derived from the planet\u2019s water regime and climate zones; civilization parameters (tech era, growth rate, time) are user-configurable.`,"Technology Era":`Civilization technology level determining base population density (people per km\xB2 of productive land) and default growth rate.

Hunter-Gatherer: ~0.05/km\xB2.  Medieval: ~30/km\xB2.  Industrial: ~200/km\xB2.  Sci-Fi High: ~1,000/km\xB2.`,"Growth Rate":`Intrinsic growth rate r (per year) for the Verhulst logistic model. This is the maximum rate when population is far below carrying capacity.

The effective rate slows automatically as P approaches K: r_eff = r \xD7 (1 \u2212 P/K).

Reference: Verhulst (1838, Correspondance math\xE9matique et physique).`,"Carrying Capacity":`Maximum sustainable population K = productive area \xD7 density \xD7 crop-efficiency factor.

Crops feed ~4\xD7 more people per unit area than livestock (FAO, 2020). A 100% crop world supports ~1.3\xD7 more than the 77/23 Earth default.`,"Ocean Coverage":`Percentage of the planet\u2019s surface covered by ocean. Auto-derived from the water regime; override to set manually.

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

The dashed line marks carrying capacity K.  The orange marker shows the current elapsed time.`};function Ft(e){let i={radiusKm:6371,waterRegime:"Extensive oceans",climateZones:[]},o=V(e);if(!o)return i;let r=Y(e,`planet:${o.id}`)||Y(e,o.id),t=r?mt(e,r).model||r:null,a=t?ht(t,"population"):null,n=a&&a.status!=="full"?ft(t,"population"):"";if(a?.status==="none")return{...i,unsupportedSurfaceMessage:n};let{model:c}=vt(e,o);if(!c?.derived)return i;let g=Array.isArray(c.derived.surfaceClimateContext?.outputs?.zones)?c.derived.surfaceClimateContext.outputs.zones:[];return{radiusKm:c.derived.radiusKm||6371,waterRegime:c.derived.waterRegime||"Extensive oceans",hydrosphere:c.derived.hydrosphere||null,surfaceClimateContext:c.derived.surfaceClimateContext||null,productivityContext:c.derived.productivityContext||null,climateZones:g,limitedSurfaceMessage:a?.status==="limited"?n:""}}function It(e,i,o,r){let t=e.getContext("2d"),a=window.devicePixelRatio||1,n=e.clientWidth,c=e.clientHeight;e.width=n*a,e.height=c*a,t.scale(a,a);let g=getComputedStyle(e).getPropertyValue("color")||"#ccc",h="#7eb2ff",m="#a6abcc",b={top:16,bottom:28,left:64,right:16},$=n-b.left-b.right,x=c-b.top-b.bottom;if(t.clearRect(0,0,n,c),!i.length||o<=0)return;let C=i[i.length-1].year||1,R=o*1.05;function l(s){return b.left+s/C*$}function _(s){return b.top+x-s/R*x}t.strokeStyle="rgba(255,255,255,0.06)",t.lineWidth=1;for(let s=1;s<=4;s++){let P=b.top+x*s/5;t.beginPath(),t.moveTo(b.left,P),t.lineTo(b.left+$,P),t.stroke()}t.strokeStyle=m,t.lineWidth=1,t.setLineDash([6,4]);let T=_(o);if(t.beginPath(),t.moveTo(b.left,T),t.lineTo(b.left+$,T),t.stroke(),t.setLineDash([]),t.fillStyle=m,t.font="9px var(--font-mono, monospace)",t.textAlign="left",t.fillText("K",b.left+4,T-4),t.strokeStyle=h,t.lineWidth=2,t.beginPath(),i.forEach((s,P)=>{let A=l(s.year),S=_(s.population);P===0?t.moveTo(A,S):t.lineTo(A,S)}),t.stroke(),r>0&&r<=C){let s=l(r);t.strokeStyle="#ff9966",t.lineWidth=1,t.setLineDash([3,3]),t.beginPath(),t.moveTo(s,b.top),t.lineTo(s,b.top+x),t.stroke(),t.setLineDash([]),t.fillStyle="#ff9966",t.font="9px var(--font-mono, monospace)",t.textAlign="center",t.fillText("t",s,b.top-4)}t.fillStyle=g,t.font="9px var(--font-mono, monospace)",t.textAlign="right";let k=4;for(let s=0;s<=k;s++){let P=o*s/k,A=_(P);t.fillText(et(P),b.left-6,A+3)}t.textAlign="center";let M=5;for(let s=0;s<=M;s++){let P=C*s/M,A=l(P);t.fillText(u(P,0),A,b.top+x+16)}t.fillStyle=m,t.textAlign="center",t.fillText("Years",b.left+$/2,c-2)}function et(e){return e>=1e12?u(e/1e12,1)+"T":e>=1e9?u(e/1e9,1)+"B":e>=1e6?u(e/1e6,1)+"M":e>=1e3?u(e/1e3,0)+"K":u(e,0)}function Ot(e,i){let o=e.getContext("2d"),r=window.devicePixelRatio||1,t=e.clientWidth,a=e.clientHeight;e.width=t*r,e.height=a*r,o.scale(r,r);let n=getComputedStyle(e).getPropertyValue("color")||"#ccc",c={left:80,right:8,top:4,bottom:4},g=t-c.left-c.right,h=Math.floor((a-c.top-c.bottom)/3),m=3,b=i.population.surfaceAreaKm2||1,$=i.population.landAreaKm2/b,x=i.population.landAreaKm2>0?i.population.habitableAreaKm2/i.population.landAreaKm2:0,C=i.population.habitableAreaKm2>0?i.population.productiveAreaKm2/i.population.habitableAreaKm2:0;[{label:"Surface",fracs:[{f:1-$,c:"#3a7cc4",l:"Ocean"},{f:$,c:"#6b8f5e",l:"Land"}]},{label:"Land",fracs:[{f:1-x,c:"#666",l:"Uninhabitable"},{f:x,c:"#6b8f5e",l:"Habitable"}]},{label:"Habitable",fracs:[{f:1-C,c:"#8a7a55",l:"Unproductive"},{f:C,c:"#6b8f5e",l:"Productive"}]}].forEach((l,_)=>{let T=c.top+_*(h+m);o.fillStyle=n,o.font="10px var(--font-mono, monospace)",o.textAlign="right",o.fillText(l.label,c.left-8,T+h/2+4);let k=c.left;for(let M of l.fracs){let s=g*M.f;if(!(s<1)){if(o.fillStyle=M.c,o.globalAlpha=.5,o.fillRect(k,T,Math.max(s-1,1),h),o.globalAlpha=1,s>30){o.fillStyle=n,o.font="9px var(--font-mono, monospace)",o.textAlign="center";let P=`${M.l} ${u(M.f*100,0)}%`,A=`${u(M.f*100,0)}%`,S=6,L=o.measureText(P).width+S<s?P:A;o.measureText(L).width+S<s&&o.fillText(L,k+s/2,T+h/2+3)}k+=s}}})}var Dt=[{title:"Getting Started",body:"The Population page models growth, carrying capacity, and settlement distribution for a civilisation on your planet. It uses logistic growth and Zipf rank-size distributions."},{title:"Technology Era",body:"Select an era from hunter-gatherer to sci-fi. Each era sets baseline parameters for carrying capacity and growth rate. Higher technology supports larger populations per unit of land."},{title:"Growth Parameters",body:"Adjust growth rate, initial population, and elapsed time. The S-curve shows logistic growth approaching carrying capacity. Saturation percentage indicates how full the world is."},{title:"Land Use",body:"Configure ocean coverage, habitability, and productivity percentages. The cascade shows how surface area narrows from total area to productive farmland. Crop and livestock splits affect caloric output."},{title:"Distribution",body:"Population is distributed across continents and regions using Zipf\u2019s law. The rank-size chart shows how cities are distributed, from the largest capital to smaller settlements."}];function ee(e){let i=j();if(!U(i).length){e.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Population</h1></div>
          <div class="panel__body">
            <p class="hint">Create a planet on the <a href="#/planet">Planets</a> page first.</p>
          </div>
        </div>
      </div>`;return}let r=i.population||{},t={techEra:r.techEra||"Medieval",initialPopulation:r.initialPopulation||1e3,growthRate:r.growthRate??null,timeElapsedYears:r.timeElapsedYears??500,continentCount:r.continentCount||6,regionCount:r.regionCount||10,zipfExponent:r.zipfExponent??1,oceanPctOverride:r.oceanPctOverride??null,habitablePctOverride:r.habitablePctOverride??null,productivePctOverride:r.productivePctOverride??null,cropPctOverride:r.cropPctOverride??null};function a(){pt({population:{...t}})}function n(){let m=j(),b=U(m),$=V(m),x=Ft(m),C=x.unsupportedSurfaceMessage||"",R=x.limitedSurfaceMessage||"",l=C?null:At({...x,...t}),_=b.map(p=>{let w=H(p.name||p.inputs?.name||p.id),I=p.id===$?.id?" selected":"";return`<option value="${H(p.id)}"${I}>${w}</option>`}).join("");if(C){e.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${f(v.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            <div class="form-row">
              <label for="popPlanetSelect">Planet</label>
              <select id="popPlanetSelect">${_}</select>
            </div>
            <div class="derived-readout">${H(C)}</div>
          </div>
        </div>
      </div>`,Q(e);let p=e.querySelector("#popPlanetSelect");p&&p.addEventListener("change",()=>{X(p.value),n()});return}let T=tt.map(p=>`<option value="${H(p)}"${p===t.techEra?" selected":""}>${H(p)}</option>`).join(""),k=p=>p?'<span class="pop-auto-badge">auto</span>':"";e.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${f(v.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">

            <div class="form-row">
              <label for="popPlanetSelect">Planet</label>
              <select id="popPlanetSelect">${_}</select>
            </div>

            ${R?`<div class="derived-readout">${H(R)}</div>`:""}

            <div class="kpi-grid">
              <div class="kpi-wrap"><div class="kpi">
                <div class="kpi__label">Population ${f(v["Current Population"])}</div>
                <div class="kpi__value">${H(l.display.currentPopulation)}</div>
              </div></div>
              <div class="kpi-wrap"><div class="kpi">
                <div class="kpi__label">Carrying Capacity ${f(v["Carrying Capacity"])}</div>
                <div class="kpi__value">${H(l.display.carryingCapacity)}</div>
              </div></div>
              <div class="kpi-wrap"><div class="kpi">
                <div class="kpi__label">Saturation ${f(v.Saturation)}</div>
                <div class="kpi__value">${H(l.display.saturation)}</div>
              </div></div>
              <div class="kpi-wrap"><div class="kpi">
                <div class="kpi__label">Habitable Density ${f(v["Habitable Density"])}</div>
                <div class="kpi__value">${H(l.display.habitableDensity)}</div>
              </div></div>
            </div>

            <div class="grid-2" style="margin-top:12px">
              <div class="subsection">
                <h3>Land Use ${f(v["Land Use Cascade"])}</h3>

                <div class="form-row">
                  <label>Ocean % ${k(l.inputs.oceanIsAuto)} ${f(v["Ocean Coverage"])}</label>
                  <input type="range" id="popOcean" min="0" max="99" step="1"
                    value="${l.inputs.oceanPct}">
                  <span class="derived-readout">${u(l.inputs.oceanPct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Habitable % ${k(l.inputs.habitableIsAuto)} ${f(v.Habitability)}</label>
                  <input type="range" id="popHabitable" min="0" max="100" step="1"
                    value="${l.inputs.habitablePct}">
                  <span class="derived-readout">${u(l.inputs.habitablePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Productive % ${k(l.inputs.productiveIsAuto)} ${f(v.Productivity)}</label>
                  <input type="range" id="popProductive" min="0" max="100" step="1"
                    value="${l.inputs.productivePct}">
                  <span class="derived-readout">${u(l.inputs.productivePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Crop % ${f(v["Crop Fraction"])}</label>
                  <input type="range" id="popCrop" min="0" max="100" step="1"
                    value="${l.inputs.cropPct}">
                  <span class="derived-readout">${u(l.inputs.cropPct,0)}%</span>
                </div>

                <button id="popResetAuto" class="btn btn--sm" style="margin-top:4px">Reset to auto</button>

                <canvas id="popCascadeCanvas" class="pop-cascade-canvas"></canvas>

                ${J([{labelHtml:`Surface Area ${f(v["Surface Area"])}`,value:l.display.surfaceArea},{labelHtml:`Land Area ${f(v["Land Area"])}`,value:l.display.landArea},{labelHtml:`Habitable Area ${f(v["Habitable Area"])}`,value:l.display.habitableArea},{labelHtml:`Productive Area ${f(v["Productive Area"])}`,value:l.display.productiveArea}])}
              </div>

              <div class="subsection">
                <h3>Growth Model ${f(v["Growth Curve"])}</h3>

                <div class="form-row">
                  <label for="popTechEra">Tech Era ${f(v["Technology Era"])}</label>
                  <select id="popTechEra">${T}</select>
                </div>

                <div class="form-row">
                  <label>Initial Population ${f(v["Initial Population"])}</label>
                  <input type="number" id="popInitPop" min="1" step="1"
                    value="${t.initialPopulation}">
                </div>

                <div class="form-row">
                  <label>Growth Rate ${f(v["Growth Rate"])}</label>
                  <input type="range" id="popGrowthRate" min="0.001" max="0.05" step="0.001"
                    value="${l.inputs.growthRate}">
                  <span class="derived-readout">${H(l.display.growthRate)}</span>
                </div>

                <div class="form-row">
                  <label>Time Elapsed (years) ${f(v["Time Elapsed"])}</label>
                  <input type="number" id="popTime" min="0" step="10"
                    value="${t.timeElapsedYears}">
                </div>

                <canvas id="popGrowthCanvas" class="pop-growth-canvas"></canvas>

                ${J([{labelHtml:`Doubling Time ${f(v["Doubling Time"])}`,value:l.display.doublingTime},{labelHtml:`Overall Density ${f(v["Overall Density"])}`,value:l.display.overallDensity}])}
              </div>
            </div>

            <div class="subsection" style="margin-top:12px">
              <h3>Distribution ${f(v["Zipf Exponent"])}</h3>

              <div class="grid-2">
                <div class="form-row">
                  <label>Continents ${f(v.Continents)}</label>
                  <input type="number" id="popContCount" min="1" max="20" step="1"
                    value="${t.continentCount}">
                </div>
                <div class="form-row">
                  <label>Regions per Continent ${f(v["Regions per Continent"])}</label>
                  <input type="number" id="popRegCount" min="1" max="50" step="1"
                    value="${t.regionCount}">
                </div>
              </div>

              <div class="form-row">
                <label>Zipf Exponent (q) ${f(v["Zipf Exponent"])}</label>
                <input type="range" id="popZipf" min="0.5" max="1.5" step="0.05"
                  value="${t.zipfExponent}">
                <span class="derived-readout">${u(t.zipfExponent,2)}</span>
              </div>

              <div class="pop-dist-list">
                ${l.population.continents.map(p=>`
                  <details class="pop-dist-card">
                    <summary class="pop-dist-summary">
                      <span class="pop-dist-rank">Continent ${p.rank}</span>
                      <span class="pop-dist-pop">${et(p.population)}</span>
                      <span class="pop-dist-frac">${u(p.fraction*100,1)}%</span>
                      <span class="pop-dist-bar-wrap">
                        <span class="pop-dist-bar" style="width:${(p.fraction*100).toFixed(1)}%"></span>
                      </span>
                    </summary>
                    <div class="pop-dist-regions">
                      <table class="pop-dist-table">
                        <thead><tr><th>Region</th><th>Population</th><th>%</th><th></th></tr></thead>
                        <tbody>
                          ${p.subregions.map(w=>`
                            <tr>
                              <td>${w.rank}</td>
                              <td>${et(w.population)}</td>
                              <td>${u(w.fraction*100,1)}%</td>
                              <td><span class="pop-dist-bar" style="width:${(w.fraction*100).toFixed(1)}%"></span></td>
                            </tr>`).join("")}
                        </tbody>
                      </table>
                    </div>
                  </details>`).join("")}
              </div>
            </div>

          </div>
        </div>
      </div>`,Q(e),ut(e),requestAnimationFrame(()=>{let p=e.querySelector("#popGrowthCanvas");p&&It(p,l.population.timeSeries,l.population.K,l.inputs.timeElapsedYears);let w=e.querySelector("#popCascadeCanvas");w&&Ot(w,l)});let M=e.querySelector("#popPlanetSelect");M&&M.addEventListener("change",()=>{X(M.value),n()});let s=e.querySelector("#popTechEra");s&&s.addEventListener("change",()=>{t.techEra=s.value,t.growthRate=null,a(),n()});let P=e.querySelector("#popInitPop");P&&P.addEventListener("change",()=>{t.initialPopulation=Math.max(1,Number(P.value)||1e3),a(),n()});let A=e.querySelector("#popGrowthRate");A&&A.addEventListener("input",()=>{t.growthRate=Number(A.value),a(),n()});let S=e.querySelector("#popTime");S&&S.addEventListener("change",()=>{t.timeElapsedYears=Math.max(0,Number(S.value)||0),a(),n()});let L=e.querySelector("#popOcean");L&&L.addEventListener("input",()=>{t.oceanPctOverride=Number(L.value),a(),n()});let z=e.querySelector("#popHabitable");z&&z.addEventListener("input",()=>{t.habitablePctOverride=Number(z.value),a(),n()});let D=e.querySelector("#popProductive");D&&D.addEventListener("input",()=>{t.productivePctOverride=Number(D.value),a(),n()});let O=e.querySelector("#popCrop");O&&O.addEventListener("input",()=>{t.cropPctOverride=Number(O.value),a(),n()});let N=e.querySelector("#popResetAuto");N&&N.addEventListener("click",()=>{t.oceanPctOverride=null,t.habitablePctOverride=null,t.productivePctOverride=null,t.cropPctOverride=null,a(),n()});let F=e.querySelector("#popContCount");F&&F.addEventListener("change",()=>{t.continentCount=Math.max(1,Math.min(20,Number(F.value)||6)),a(),n()});let G=e.querySelector("#popRegCount");G&&G.addEventListener("change",()=>{t.regionCount=Math.max(1,Math.min(50,Number(G.value)||10)),a(),n()});let K=e.querySelector("#popZipf");K&&K.addEventListener("input",()=>{t.zipfExponent=Number(K.value),a(),n()})}n();let c=document.createElement("div");document.body.appendChild(c);let g=dt({steps:Dt,storageKey:"worldsmith.pop.tutorial",container:c});e.addEventListener("click",m=>{m.target.closest("#popTutorials")&&g?.toggle()});let h=new MutationObserver(()=>{e.isConnected||(g?.destroy(),c.remove(),h.disconnect())});h.observe(e.parentNode||document.body,{childList:!0})}export{ee as initPopulationPage};
