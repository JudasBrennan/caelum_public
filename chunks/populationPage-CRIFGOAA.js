import{a as fe,b as me}from"./chunk-H4VHNXNI.js";import{f as ue,g as he}from"./chunk-AQ4UOUER.js";import{b as V}from"./chunk-X5HJXCPV.js";import{c as pe}from"./chunk-DFN46JRM.js";import"./chunk-AHYIHLSM.js";import"./chunk-MKVAAU7A.js";import"./chunk-IKPY52EN.js";import{a as de}from"./chunk-KYI55SIV.js";import{a as m,d as X}from"./chunk-L76EVWF4.js";import"./chunk-XMLMEZIZ.js";import{a as H}from"./chunk-7PVDVLB6.js";import{Ka as Y,La as j,Ma as U,V as Z,hb as ce,za as B}from"./chunk-CHTPZXSQ.js";import{O as le,W as se,Z as W}from"./chunk-BSVYDJBQ.js";import"./chunk-47ATKL5F.js";import"./chunk-XFZMQA63.js";import{f as P,g as f,h as k,j as d}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";var ve=Object.freeze(["Dry","Shallow oceans","Extensive oceans","Global ocean","Deep ocean","Ice world"].reduce((t,r)=>(t[r]=se(r).liquidOceanFraction,t),{})),we={"Hunter-Gatherer":.05,Neolithic:2,"Bronze Age":8,"Iron Age":15,Medieval:30,"Early Industrial":80,Industrial:200,"Post-Industrial":400,"Sci-Fi High":1e3},Me={"Hunter-Gatherer":.005,Neolithic:.008,"Bronze Age":.01,"Iron Age":.01,Medieval:.01,"Early Industrial":.015,Industrial:.02,"Post-Industrial":.005,"Sci-Fi High":.003},be=4,ke=.77,ge=6371,J=Object.keys(we);function ye(t){return t>=1e12?d(t/1e12,2)+" trillion":t>=1e9?d(t/1e9,2)+" billion":t>=1e6?d(t/1e6,2)+" million":t>=1e3?d(t/1e3,1)+" thousand":d(t,0)}function Ee(t){let r=ve[t]??ve["Shallow oceans"];return{oceanFraction:k(r,3),landFraction:k(1-r,3)}}function Re(t){if(!t||!t.length)return 0;let r=t.filter(a=>a.master!=="E"&&a.master!=="X");if(!r.length)return 0;let i=0,l=0,e=new Set;for(let a of r){let n=`${a.latMin}-${a.latMax}-${a.variant}`;if(e.has(n))continue;e.add(n);let o=Math.sin(a.latMin*Math.PI/180),g=Math.sin(a.latMax*Math.PI/180),u=Math.abs(g-o);i+=u;let b=P(a.aridity,0,1);a.master==="B"&&(b=a.aridity<.25?.05:.3),l+=u*b}return i>0?k(l/i,3):0}function _e(t,r,i){let l=Math.max(f(t,0),0),e=Math.max(f(r,30),0),a=P(f(i,77)/100,0,1),n=1+(be-1)*ke,o=1+(be-1)*a,g=e*(o/n);return Math.round(l*g)}function xe(t,r,i,l){let e=Math.max(f(t,1e3),1),a=P(f(r,100),1,e),n=Math.max(f(i,.01),0),o=Math.max(f(l,0),0);if(n===0||o===0)return a;let g=(e-a)/a;return Math.round(e/(1+g*Math.exp(-n*o)))}function He(t,r,i,l,e=100){let a=Math.max(f(l,1e3),1),n=P(f(e,100),10,500),o=a/n,g=[];for(let u=0;u<=n;u++){let b=k(u*o,1);g.push({year:b,population:xe(t,r,i,b)})}return g}function Pe(t,r,i=1){let l=Math.max(f(t,0),0),e=P(Math.round(f(r,6)),1,100),a=P(f(i,1),.5,1.5);if(l===0)return[];let n=0;for(let u=1;u<=e;u++)n+=1/Math.pow(u,a);let o=l/n,g=[];for(let u=1;u<=e;u++){let b=Math.round(o/Math.pow(u,a));g.push({rank:u,population:b,fraction:k(b/l,4)})}return g}function Ce({radiusKm:t=ge,waterRegime:r="Extensive oceans",climateZones:i=[],techEra:l="Medieval",initialPopulation:e=1e3,growthRate:a=null,timeElapsedYears:n=0,continentCount:o=6,regionCount:g=10,zipfExponent:u=1,hydrosphere:b=null,oceanPctOverride:h=null,habitablePctOverride:A=null,productivePctOverride:C=null,cropPctOverride:S=null}={}){let F=Math.max(f(t,ge),1),s=4*Math.PI*F*F,E=b&&typeof b=="object"?{oceanFraction:P(f(b.liquidOceanFraction,0),0,1),landFraction:P(f(b.landFraction,1),0,1)}:Ee(r),R=h!=null?P(f(h,71),0,99):k(E.oceanFraction*100,1),_=h!=null?1-R/100:P(f(E.landFraction,1-E.oceanFraction),0,1),w=s*_,c=W(i),y=A!=null?P(f(A,50),0,100):k(c*100,1),x=w*(y/100),L=Re(i),I=C!=null?P(f(C,50),0,100):k(L*100,1),K=x*(I/100),q=S!=null?P(f(S,77),0,100):77,D=J.includes(l)?l:"Medieval",N=we[D],z=Me[D],$=a!=null?P(f(a,z),0,.05):z,T=_e(K,N,q),p=P(Math.round(f(e,1e3)),1,Math.max(T,1)),M=Math.max(f(n,0),0),O=xe(T,p,$,M),Se=$>0&&T>p?Math.log(19*(T-p)/p)/$:1e3,Ae=Math.max(M,Se,100),$e=He(T,p,$,Ae,100),ee=P(Math.round(f(o,6)),1,20),te=P(Math.round(f(g,10)),1,50),G=P(f(u,1),.5,1.5),Te=Pe(O,ee,G).map(re=>({...re,subregions:Pe(re.population,te,G)})),ae=w>0?O/w:0,oe=x>0?O/x:0,ie=$>0?Math.LN2/$:1/0,ne=T>0?O/T*100:0;return{inputs:{radiusKm:F,waterRegime:r,techEra:D,oceanPct:R,habitablePct:y,productivePct:I,cropPct:q,initialPopulation:p,growthRate:$,timeElapsedYears:M,continentCount:ee,regionCount:te,zipfExponent:G,oceanIsAuto:h==null,habitableIsAuto:A==null,productiveIsAuto:C==null,cropIsAuto:S==null},population:{surfaceAreaKm2:s,landAreaKm2:w,habitableAreaKm2:x,productiveAreaKm2:K,K:T,currentPopulation:O,overallDensityPerKm2:k(ae,2),habitableDensityPerKm2:k(oe,2),timeSeries:$e,continents:Te,doublingTimeYears:k(ie,1),saturationPct:k(ne,1)},display:{surfaceArea:d(s,0)+" km\xB2",landArea:d(w,0)+" km\xB2",habitableArea:d(x,0)+" km\xB2",productiveArea:d(K,0)+" km\xB2",carryingCapacity:ye(T),currentPopulation:ye(O),overallDensity:d(ae,1)+"/km\xB2",habitableDensity:d(oe,1)+"/km\xB2",doublingTime:$>0?d(ie,0)+" years":"\u221E",saturation:d(ne,1)+"%",techEra:D,growthRate:d($*100,2)+"%/yr"}}}var v={Population:`Procedural population model combining land-use analysis, logistic (Verhulst) growth, and Zipf rank-size distribution.

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

The dashed line marks carrying capacity K.  The orange marker shows the current elapsed time.`};function Le(t){let r={radiusKm:6371,waterRegime:"Extensive oceans",climateZones:[]},i=j(t);if(!i)return r;let l=Z(t,`planet:${i.id}`)||Z(t,i.id),e=l?me(t,l).model||l:null,a=e?ue(e,"population"):null,n=a&&a.status!=="full"?he(e,"population"):"";if(a?.status==="none")return{...r,unsupportedSurfaceMessage:n};let{model:o}=fe(t,i);if(!o?.derived)return r;let g=le({surfaceTempK:o.derived.surfaceTempK||288,axialTiltDeg:o.inputs?.axialTiltDeg??23.44,circulationCellCount:o.derived.circulationCellCount||"3",circulationCellRanges:o.derived.circulationCellRanges||[],h2oPct:o.inputs?.h2oPct||0,waterRegime:o.derived.waterRegime||"Extensive oceans",pressureAtm:o.inputs?.pressureAtm??1,tidallyLockedToStar:!!o.derived.tidallyLockedToStar,compositionClass:o.derived.compositionClass||"Earth-like",liquidWaterPossible:!!o.derived.liquidWaterPossible,climateState:o.derived.climateState||"Stable",gravityG:o.derived.gravityG||1});return{radiusKm:o.derived.radiusKm||6371,waterRegime:o.derived.waterRegime||"Extensive oceans",hydrosphere:o.derived.hydrosphere||null,climateZones:g.zones||[],limitedSurfaceMessage:a?.status==="limited"?n:""}}function Fe(t,r,i,l){let e=t.getContext("2d"),a=window.devicePixelRatio||1,n=t.clientWidth,o=t.clientHeight;t.width=n*a,t.height=o*a,e.scale(a,a);let g=getComputedStyle(t).getPropertyValue("color")||"#ccc",u="#7eb2ff",b="#a6abcc",h={top:16,bottom:28,left:64,right:16},A=n-h.left-h.right,C=o-h.top-h.bottom;if(e.clearRect(0,0,n,o),!r.length||i<=0)return;let S=r[r.length-1].year||1,F=i*1.05;function s(c){return h.left+c/S*A}function E(c){return h.top+C-c/F*C}e.strokeStyle="rgba(255,255,255,0.06)",e.lineWidth=1;for(let c=1;c<=4;c++){let y=h.top+C*c/5;e.beginPath(),e.moveTo(h.left,y),e.lineTo(h.left+A,y),e.stroke()}e.strokeStyle=b,e.lineWidth=1,e.setLineDash([6,4]);let R=E(i);if(e.beginPath(),e.moveTo(h.left,R),e.lineTo(h.left+A,R),e.stroke(),e.setLineDash([]),e.fillStyle=b,e.font="9px var(--font-mono, monospace)",e.textAlign="left",e.fillText("K",h.left+4,R-4),e.strokeStyle=u,e.lineWidth=2,e.beginPath(),r.forEach((c,y)=>{let x=s(c.year),L=E(c.population);y===0?e.moveTo(x,L):e.lineTo(x,L)}),e.stroke(),l>0&&l<=S){let c=s(l);e.strokeStyle="#ff9966",e.lineWidth=1,e.setLineDash([3,3]),e.beginPath(),e.moveTo(c,h.top),e.lineTo(c,h.top+C),e.stroke(),e.setLineDash([]),e.fillStyle="#ff9966",e.font="9px var(--font-mono, monospace)",e.textAlign="center",e.fillText("t",c,h.top-4)}e.fillStyle=g,e.font="9px var(--font-mono, monospace)",e.textAlign="right";let _=4;for(let c=0;c<=_;c++){let y=i*c/_,x=E(y);e.fillText(Q(y),h.left-6,x+3)}e.textAlign="center";let w=5;for(let c=0;c<=w;c++){let y=S*c/w,x=s(y);e.fillText(d(y,0),x,h.top+C+16)}e.fillStyle=b,e.textAlign="center",e.fillText("Years",h.left+A/2,o-2)}function Q(t){return t>=1e12?d(t/1e12,1)+"T":t>=1e9?d(t/1e9,1)+"B":t>=1e6?d(t/1e6,1)+"M":t>=1e3?d(t/1e3,0)+"K":d(t,0)}function Ie(t,r){let i=t.getContext("2d"),l=window.devicePixelRatio||1,e=t.clientWidth,a=t.clientHeight;t.width=e*l,t.height=a*l,i.scale(l,l);let n=getComputedStyle(t).getPropertyValue("color")||"#ccc",o={left:80,right:8,top:4,bottom:4},g=e-o.left-o.right,u=Math.floor((a-o.top-o.bottom)/3),b=3,h=r.population.surfaceAreaKm2||1,A=r.population.landAreaKm2/h,C=r.population.landAreaKm2>0?r.population.habitableAreaKm2/r.population.landAreaKm2:0,S=r.population.habitableAreaKm2>0?r.population.productiveAreaKm2/r.population.habitableAreaKm2:0;[{label:"Surface",fracs:[{f:1-A,c:"#3a7cc4",l:"Ocean"},{f:A,c:"#6b8f5e",l:"Land"}]},{label:"Land",fracs:[{f:1-C,c:"#666",l:"Uninhabitable"},{f:C,c:"#6b8f5e",l:"Habitable"}]},{label:"Habitable",fracs:[{f:1-S,c:"#8a7a55",l:"Unproductive"},{f:S,c:"#6b8f5e",l:"Productive"}]}].forEach((s,E)=>{let R=o.top+E*(u+b);i.fillStyle=n,i.font="10px var(--font-mono, monospace)",i.textAlign="right",i.fillText(s.label,o.left-8,R+u/2+4);let _=o.left;for(let w of s.fracs){let c=g*w.f;if(!(c<1)){if(i.fillStyle=w.c,i.globalAlpha=.5,i.fillRect(_,R,Math.max(c-1,1),u),i.globalAlpha=1,c>30){i.fillStyle=n,i.font="9px var(--font-mono, monospace)",i.textAlign="center";let y=`${w.l} ${d(w.f*100,0)}%`,x=`${d(w.f*100,0)}%`,L=6,I=i.measureText(y).width+L<c?y:x;i.measureText(I).width+L<c&&i.fillText(I,_+c/2,R+u/2+3)}_+=c}}})}var De=[{title:"Getting Started",body:"The Population page models growth, carrying capacity, and settlement distribution for a civilisation on your planet. It uses logistic growth and Zipf rank-size distributions."},{title:"Technology Era",body:"Select an era from hunter-gatherer to sci-fi. Each era sets baseline parameters for carrying capacity and growth rate. Higher technology supports larger populations per unit of land."},{title:"Growth Parameters",body:"Adjust growth rate, initial population, and elapsed time. The S-curve shows logistic growth approaching carrying capacity. Saturation percentage indicates how full the world is."},{title:"Land Use",body:"Configure ocean coverage, habitability, and productivity percentages. The cascade shows how surface area narrows from total area to productive farmland. Crop and livestock splits affect caloric output."},{title:"Distribution",body:"Population is distributed across continents and regions using Zipf\u2019s law. The rank-size chart shows how cities are distributed, from the largest capital to smaller settlements."}];function tt(t){let r=B();if(!Y(r).length){t.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Population</h1></div>
          <div class="panel__body">
            <p class="hint">Create a planet on the <a href="#/planet">Planets</a> page first.</p>
          </div>
        </div>
      </div>`;return}let l=r.population||{},e={techEra:l.techEra||"Medieval",initialPopulation:l.initialPopulation||1e3,growthRate:l.growthRate??null,timeElapsedYears:l.timeElapsedYears??500,continentCount:l.continentCount||6,regionCount:l.regionCount||10,zipfExponent:l.zipfExponent??1,oceanPctOverride:l.oceanPctOverride??null,habitablePctOverride:l.habitablePctOverride??null,productivePctOverride:l.productivePctOverride??null,cropPctOverride:l.cropPctOverride??null};function a(){ce({population:{...e}})}function n(){let b=B(),h=Y(b),A=j(b),C=Le(b),S=C.unsupportedSurfaceMessage||"",F=C.limitedSurfaceMessage||"",s=S?null:Ce({...C,...e}),E=h.map(p=>{let M=H(p.name||p.inputs?.name||p.id),O=p.id===A?.id?" selected":"";return`<option value="${H(p.id)}"${O}>${M}</option>`}).join("");if(S){t.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${m(v.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            <div class="form-row">
              <label for="popPlanetSelect">Planet</label>
              <select id="popPlanetSelect">${E}</select>
            </div>
            <div class="derived-readout">${H(S)}</div>
          </div>
        </div>
      </div>`,X(t);let p=t.querySelector("#popPlanetSelect");p&&p.addEventListener("change",()=>{U(p.value),n()});return}let R=J.map(p=>`<option value="${H(p)}"${p===e.techEra?" selected":""}>${H(p)}</option>`).join(""),_=p=>p?'<span class="pop-auto-badge">auto</span>':"";t.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${m(v.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">

            <div class="form-row">
              <label for="popPlanetSelect">Planet</label>
              <select id="popPlanetSelect">${E}</select>
            </div>

            ${F?`<div class="derived-readout">${H(F)}</div>`:""}

            <div class="kpi-grid">
              <div class="kpi-wrap"><div class="kpi">
                <div class="kpi__label">Population ${m(v["Current Population"])}</div>
                <div class="kpi__value">${H(s.display.currentPopulation)}</div>
              </div></div>
              <div class="kpi-wrap"><div class="kpi">
                <div class="kpi__label">Carrying Capacity ${m(v["Carrying Capacity"])}</div>
                <div class="kpi__value">${H(s.display.carryingCapacity)}</div>
              </div></div>
              <div class="kpi-wrap"><div class="kpi">
                <div class="kpi__label">Saturation ${m(v.Saturation)}</div>
                <div class="kpi__value">${H(s.display.saturation)}</div>
              </div></div>
              <div class="kpi-wrap"><div class="kpi">
                <div class="kpi__label">Habitable Density ${m(v["Habitable Density"])}</div>
                <div class="kpi__value">${H(s.display.habitableDensity)}</div>
              </div></div>
            </div>

            <div class="grid-2" style="margin-top:12px">
              <div class="subsection">
                <h3>Land Use ${m(v["Land Use Cascade"])}</h3>

                <div class="form-row">
                  <label>Ocean % ${_(s.inputs.oceanIsAuto)} ${m(v["Ocean Coverage"])}</label>
                  <input type="range" id="popOcean" min="0" max="99" step="1"
                    value="${s.inputs.oceanPct}">
                  <span class="derived-readout">${d(s.inputs.oceanPct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Habitable % ${_(s.inputs.habitableIsAuto)} ${m(v.Habitability)}</label>
                  <input type="range" id="popHabitable" min="0" max="100" step="1"
                    value="${s.inputs.habitablePct}">
                  <span class="derived-readout">${d(s.inputs.habitablePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Productive % ${_(s.inputs.productiveIsAuto)} ${m(v.Productivity)}</label>
                  <input type="range" id="popProductive" min="0" max="100" step="1"
                    value="${s.inputs.productivePct}">
                  <span class="derived-readout">${d(s.inputs.productivePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Crop % ${m(v["Crop Fraction"])}</label>
                  <input type="range" id="popCrop" min="0" max="100" step="1"
                    value="${s.inputs.cropPct}">
                  <span class="derived-readout">${d(s.inputs.cropPct,0)}%</span>
                </div>

                <button id="popResetAuto" class="btn btn--sm" style="margin-top:4px">Reset to auto</button>

                <canvas id="popCascadeCanvas" class="pop-cascade-canvas"></canvas>

                ${V([{labelHtml:`Surface Area ${m(v["Surface Area"])}`,value:s.display.surfaceArea},{labelHtml:`Land Area ${m(v["Land Area"])}`,value:s.display.landArea},{labelHtml:`Habitable Area ${m(v["Habitable Area"])}`,value:s.display.habitableArea},{labelHtml:`Productive Area ${m(v["Productive Area"])}`,value:s.display.productiveArea}])}
              </div>

              <div class="subsection">
                <h3>Growth Model ${m(v["Growth Curve"])}</h3>

                <div class="form-row">
                  <label for="popTechEra">Tech Era ${m(v["Technology Era"])}</label>
                  <select id="popTechEra">${R}</select>
                </div>

                <div class="form-row">
                  <label>Initial Population ${m(v["Initial Population"])}</label>
                  <input type="number" id="popInitPop" min="1" step="1"
                    value="${e.initialPopulation}">
                </div>

                <div class="form-row">
                  <label>Growth Rate ${m(v["Growth Rate"])}</label>
                  <input type="range" id="popGrowthRate" min="0.001" max="0.05" step="0.001"
                    value="${s.inputs.growthRate}">
                  <span class="derived-readout">${H(s.display.growthRate)}</span>
                </div>

                <div class="form-row">
                  <label>Time Elapsed (years) ${m(v["Time Elapsed"])}</label>
                  <input type="number" id="popTime" min="0" step="10"
                    value="${e.timeElapsedYears}">
                </div>

                <canvas id="popGrowthCanvas" class="pop-growth-canvas"></canvas>

                ${V([{labelHtml:`Doubling Time ${m(v["Doubling Time"])}`,value:s.display.doublingTime},{labelHtml:`Overall Density ${m(v["Overall Density"])}`,value:s.display.overallDensity}])}
              </div>
            </div>

            <div class="subsection" style="margin-top:12px">
              <h3>Distribution ${m(v["Zipf Exponent"])}</h3>

              <div class="grid-2">
                <div class="form-row">
                  <label>Continents ${m(v.Continents)}</label>
                  <input type="number" id="popContCount" min="1" max="20" step="1"
                    value="${e.continentCount}">
                </div>
                <div class="form-row">
                  <label>Regions per Continent ${m(v["Regions per Continent"])}</label>
                  <input type="number" id="popRegCount" min="1" max="50" step="1"
                    value="${e.regionCount}">
                </div>
              </div>

              <div class="form-row">
                <label>Zipf Exponent (q) ${m(v["Zipf Exponent"])}</label>
                <input type="range" id="popZipf" min="0.5" max="1.5" step="0.05"
                  value="${e.zipfExponent}">
                <span class="derived-readout">${d(e.zipfExponent,2)}</span>
              </div>

              <div class="pop-dist-list">
                ${s.population.continents.map(p=>`
                  <details class="pop-dist-card">
                    <summary class="pop-dist-summary">
                      <span class="pop-dist-rank">Continent ${p.rank}</span>
                      <span class="pop-dist-pop">${Q(p.population)}</span>
                      <span class="pop-dist-frac">${d(p.fraction*100,1)}%</span>
                      <span class="pop-dist-bar-wrap">
                        <span class="pop-dist-bar" style="width:${(p.fraction*100).toFixed(1)}%"></span>
                      </span>
                    </summary>
                    <div class="pop-dist-regions">
                      <table class="pop-dist-table">
                        <thead><tr><th>Region</th><th>Population</th><th>%</th><th></th></tr></thead>
                        <tbody>
                          ${p.subregions.map(M=>`
                            <tr>
                              <td>${M.rank}</td>
                              <td>${Q(M.population)}</td>
                              <td>${d(M.fraction*100,1)}%</td>
                              <td><span class="pop-dist-bar" style="width:${(M.fraction*100).toFixed(1)}%"></span></td>
                            </tr>`).join("")}
                        </tbody>
                      </table>
                    </div>
                  </details>`).join("")}
              </div>
            </div>

          </div>
        </div>
      </div>`,X(t),pe(t),requestAnimationFrame(()=>{let p=t.querySelector("#popGrowthCanvas");p&&Fe(p,s.population.timeSeries,s.population.K,s.inputs.timeElapsedYears);let M=t.querySelector("#popCascadeCanvas");M&&Ie(M,s)});let w=t.querySelector("#popPlanetSelect");w&&w.addEventListener("change",()=>{U(w.value),n()});let c=t.querySelector("#popTechEra");c&&c.addEventListener("change",()=>{e.techEra=c.value,e.growthRate=null,a(),n()});let y=t.querySelector("#popInitPop");y&&y.addEventListener("change",()=>{e.initialPopulation=Math.max(1,Number(y.value)||1e3),a(),n()});let x=t.querySelector("#popGrowthRate");x&&x.addEventListener("input",()=>{e.growthRate=Number(x.value),a(),n()});let L=t.querySelector("#popTime");L&&L.addEventListener("change",()=>{e.timeElapsedYears=Math.max(0,Number(L.value)||0),a(),n()});let I=t.querySelector("#popOcean");I&&I.addEventListener("input",()=>{e.oceanPctOverride=Number(I.value),a(),n()});let K=t.querySelector("#popHabitable");K&&K.addEventListener("input",()=>{e.habitablePctOverride=Number(K.value),a(),n()});let q=t.querySelector("#popProductive");q&&q.addEventListener("input",()=>{e.productivePctOverride=Number(q.value),a(),n()});let D=t.querySelector("#popCrop");D&&D.addEventListener("input",()=>{e.cropPctOverride=Number(D.value),a(),n()});let N=t.querySelector("#popResetAuto");N&&N.addEventListener("click",()=>{e.oceanPctOverride=null,e.habitablePctOverride=null,e.productivePctOverride=null,e.cropPctOverride=null,a(),n()});let z=t.querySelector("#popContCount");z&&z.addEventListener("change",()=>{e.continentCount=Math.max(1,Math.min(20,Number(z.value)||6)),a(),n()});let $=t.querySelector("#popRegCount");$&&$.addEventListener("change",()=>{e.regionCount=Math.max(1,Math.min(50,Number($.value)||10)),a(),n()});let T=t.querySelector("#popZipf");T&&T.addEventListener("input",()=>{e.zipfExponent=Number(T.value),a(),n()})}n();let o=document.createElement("div");document.body.appendChild(o);let g=de({steps:De,storageKey:"worldsmith.pop.tutorial",container:o});t.addEventListener("click",b=>{b.target.closest("#popTutorials")&&g?.toggle()});let u=new MutationObserver(()=>{t.isConnected||(g?.destroy(),o.remove(),u.disconnect())});u.observe(t.parentNode||document.body,{childList:!0})}export{tt as initPopulationPage};
