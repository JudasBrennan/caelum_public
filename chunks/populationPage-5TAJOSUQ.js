import{a as G,b as Ce,c as Me,d as Ae,e as ae}from"./chunk-YAWL2UWM.js";import"./chunk-5YVVLRFP.js";import"./chunk-MXEPBJGN.js";import"./chunk-HLZ2ABGO.js";import{b as Pe,c as xe}from"./chunk-OBBE35AJ.js";import{b as ee}from"./chunk-ULJFFZ4N.js";import"./chunk-UN6CKA7Q.js";import{f as we,g as Se}from"./chunk-BDZ5CE5Z.js";import"./chunk-EX3WGBQA.js";import{c as ye}from"./chunk-2RPLHINH.js";import"./chunk-WGUMHBZW.js";import{a as h,d as te,e as b,f as ge}from"./chunk-M5QM7R5S.js";import{a as H}from"./chunk-7PVDVLB6.js";import"./chunk-XMLMEZIZ.js";import{Ia as B,Ta as V,Ua as X,Va as J,_ as Z,tb as fe}from"./chunk-2JIBIIRO.js";import"./chunk-I5NSRPWR.js";import"./chunk-HUJYRNV2.js";import"./chunk-B745U7OS.js";import"./chunk-DH56NUIM.js";import"./chunk-DGEV3A6M.js";import"./chunk-YH6C3Z3W.js";import"./chunk-IONKVRYA.js";import"./chunk-54NJNAYQ.js";import"./chunk-PEGGMJTM.js";import"./chunk-HEDIWBL2.js";import"./chunk-P3CTCSNJ.js";import{h as be,x as Q}from"./chunk-63GWEYJK.js";import"./chunk-4TNQN7I2.js";import"./chunk-I7AFU66Y.js";import"./chunk-MLUBV3I6.js";import"./chunk-56JJ2DZ6.js";import"./chunk-EZDQFTR7.js";import"./chunk-MA3XYP6Z.js";import"./chunk-TKWW4P6B.js";import{A as p,w,x as d,y as E}from"./chunk-JOWNJXZP.js";import"./chunk-RUSIDZ3J.js";import"./chunk-74DXXQZP.js";import"./chunk-VC46IEJQ.js";var $e=Object.freeze(["Dry","Shallow oceans","Extensive oceans","Global ocean","Deep ocean","Ice world"].reduce((e,o)=>(e[o]=be(o).liquidOceanFraction,e),{})),Re={"Hunter-Gatherer":.05,Neolithic:2,"Bronze Age":8,"Iron Age":15,Medieval:30,"Early Industrial":80,Industrial:200,"Post-Industrial":400,"Sci-Fi High":1e3},ze={"Hunter-Gatherer":.005,Neolithic:.008,"Bronze Age":.01,"Iron Age":.01,Medieval:.01,"Early Industrial":.015,Industrial:.02,"Post-Industrial":.005,"Sci-Fi High":.003},ke=4,Ne=.77,Te=6371,oe=Object.keys(Re);function Ie(e){return e>=1e12?p(e/1e12,2)+" trillion":e>=1e9?p(e/1e9,2)+" billion":e>=1e6?p(e/1e6,2)+" million":e>=1e3?p(e/1e3,1)+" thousand":p(e,0)}function qe(e){let o=$e[e]??$e["Shallow oceans"];return{oceanFraction:E(o,3),landFraction:E(1-o,3)}}function Ke(e){if(!e||!e.length)return 0;let o=e.filter(a=>a.master!=="E"&&a.master!=="X");if(!o.length)return 0;let i=0,n=0,t=new Set;for(let a of o){let r=`${a.latMin}-${a.latMax}-${a.variant}`;if(t.has(r))continue;t.add(r);let c=Math.sin(a.latMin*Math.PI/180),y=Math.sin(a.latMax*Math.PI/180),u=Math.abs(y-c);i+=u;let f=w(a.aridity,0,1);a.master==="B"&&(f=a.aridity<.25?.05:.3),n+=u*f}return i>0?E(n/i,3):0}function Ge(e,o,i){let n=Math.max(d(e,0),0),t=Math.max(d(o,30),0),a=w(d(i,77)/100,0,1),r=1+(ke-1)*Ne,c=1+(ke-1)*a,y=t*(c/r);return Math.round(n*y)}function _e(e,o,i,n){let t=Math.max(d(e,1e3),1),a=w(d(o,100),1,t),r=Math.max(d(i,.01),0),c=Math.max(d(n,0),0);if(r===0||c===0)return a;let y=(t-a)/a;return Math.round(t/(1+y*Math.exp(-r*c)))}function We(e,o,i,n,t=100){let a=Math.max(d(n,1e3),1),r=w(d(t,100),10,500),c=a/r,y=[];for(let u=0;u<=r;u++){let f=E(u*c,1);y.push({year:f,population:_e(e,o,i,f)})}return y}function Ee(e,o,i=1){let n=Math.max(d(e,0),0),t=w(Math.round(d(o,6)),1,100),a=w(d(i,1),.5,1.5);if(n===0)return[];let r=0;for(let u=1;u<=t;u++)r+=1/Math.pow(u,a);let c=n/r,y=[];for(let u=1;u<=t;u++){let f=Math.round(c/Math.pow(u,a));y.push({rank:u,population:f,fraction:E(f/n,4)})}return y}function Fe({radiusKm:e=Te,waterRegime:o="Extensive oceans",climateZones:i=[],techEra:n="Medieval",initialPopulation:t=1e3,growthRate:a=null,timeElapsedYears:r=0,continentCount:c=6,regionCount:y=10,zipfExponent:u=1,hydrosphere:f=null,productivityContext:m=null,oceanPctOverride:P=null,habitablePctOverride:M=null,productivePctOverride:x=null,cropPctOverride:_=null}={}){let s=Math.max(d(e,Te),1),R=4*Math.PI*s*s,A=f&&typeof f=="object"?{oceanFraction:w(d(f.liquidOceanFraction,0),0,1),landFraction:w(d(f.landFraction,1),0,1)}:qe(o),I=P!=null?w(d(P,71),0,99):E(A.oceanFraction*100,1),T=P!=null?1-I/100:w(d(A.landFraction,1-A.oceanFraction),0,1),l=R*T,S=Q(i),$=M!=null?w(d(M,50),0,100):E(S*100,1),k=l*($/100),L=w(d(m?.outputs?.populationCarryingCapacityModifier,1),.1,1.15),W=w(Ke(i)*L,0,1),D=x!=null?w(d(x,50),0,100):E(W*100,1),z=k*(D/100),N=_!=null?w(d(_,77),0,100):77,O=oe.includes(n)?n:"Medieval",j=Re[O],g=ze[O],C=a!=null?w(d(a,g),0,.05):g,F=Ge(z,j,N),q=w(Math.round(d(t,1e3)),1,Math.max(F,1)),U=Math.max(d(r,0),0),K=_e(F,q,C,U),He=C>0&&F>q?Math.log(19*(F-q)/q)/C:1e3,Le=Math.max(U,He,100),Oe=We(F,q,C,Le,100),ce=w(Math.round(d(c,6)),1,20),pe=w(Math.round(d(y,10)),1,50),Y=w(d(u,1),.5,1.5),De=Ee(K,ce,Y).map(me=>({...me,subregions:Ee(me.population,pe,Y)})),de=l>0?K/l:0,ue=k>0?K/k:0,he=C>0?Math.LN2/C:1/0,ve=F>0?K/F*100:0;return{inputs:{radiusKm:s,waterRegime:o,techEra:O,oceanPct:I,habitablePct:$,productivePct:D,cropPct:N,initialPopulation:q,growthRate:C,timeElapsedYears:U,continentCount:ce,regionCount:pe,zipfExponent:Y,oceanIsAuto:P==null,habitableIsAuto:M==null,productiveIsAuto:x==null,cropIsAuto:_==null,productivityContextApplied:x==null&&m!=null},population:{surfaceAreaKm2:R,landAreaKm2:l,habitableAreaKm2:k,productiveAreaKm2:z,K:F,currentPopulation:K,overallDensityPerKm2:E(de,2),habitableDensityPerKm2:E(ue,2),timeSeries:Oe,continents:De,doublingTimeYears:E(he,1),saturationPct:E(ve,1)},display:{surfaceArea:p(R,0)+" km\xB2",landArea:p(l,0)+" km\xB2",habitableArea:p(k,0)+" km\xB2",productiveArea:p(z,0)+" km\xB2",carryingCapacity:Ie(F),currentPopulation:Ie(K),overallDensity:p(de,1)+"/km\xB2",habitableDensity:p(ue,1)+"/km\xB2",doublingTime:C>0?p(he,0)+" years":"\u221E",saturation:p(ve,1)+"%",techEra:O,growthRate:p(C*100,2)+"%/yr"}}}var v={};Object.assign(v,{Population:b({overview:"Procedural population model for a selected rocky world or supported surface body.",drawnFrom:"Solved planet radius, inferred/overridden ocean fraction, climate-zone habitability, productivity context, and user-authored civilisation settings.",interpretAs:"It estimates capacity, growth state, density, and regional distribution for worldbuilding use.",caveat:"This is not an economic, demographic, migration, or political simulation; it is a bounded carrying-capacity model.",references:"See Science & Maths: population and habitability context."}),"Technology Era":b({overview:"Civilisation technology band used to seed density and default growth assumptions.",feedsInto:"Carrying capacity, default growth rate, current population projection, and density outputs.",typicalRange:"Hunter-gatherer is sparse; medieval and industrial eras raise productive-land density; sci-fi high assumes intensive infrastructure.",caveat:"Era is a coarse worldbuilding proxy, not a full development-history model.",references:"See Science & Maths: population carrying capacity."}),"Growth Rate":b({overview:"Intrinsic yearly growth rate for the logistic population curve.",feedsInto:"Current population, saturation, doubling time, and growth-curve shape over elapsed time.",interpretAs:"The effective rate slows as population approaches carrying capacity: r_eff = r x (1 - P/K).",caveat:"The model does not simulate age structure, disease, shocks, migration, or policy changes.",references:"Verhulst 1838; see Science & Maths: logistic growth."}),"Carrying Capacity":b({overview:"Maximum population supported by the modelled productive land.",drawnFrom:"Productive area, technology-era density, crop fraction, and crop/livestock efficiency assumptions.",interpretAs:"Values near or above current population indicate how close the model is to resource saturation.",caveat:"It represents broad food/land capacity, not trade, energy supply, imports, or non-agricultural limits.",references:"See Science & Maths: population carrying capacity."}),"Ocean Coverage":b({overview:"Population-page land/ocean split.",feedsInto:"Land area, habitable area, productive area, carrying capacity, and density outputs.",drawnFrom:"Auto mode follows solved inferred surface-ocean coverage when available; manual mode uses the authored population override.",caveat:"Manual population overrides affect population/visual land-use outputs and do not rewrite the planet hydrosphere.",references:"See Science & Maths: surface ocean coverage."}),Habitability:b({overview:"Fraction of land treated as broadly settlement-suitable.",feedsInto:"Habitable area, habitable density, productivity, and carrying capacity.",drawnFrom:"Auto mode uses area-weighted climate zones; polar/special zones are excluded unless you override the percentage.",caveat:"This is a land-use suitability screen, not a guarantee of comfort, technology, or biosphere support.",references:"See Science & Maths: climate zones and habitability context."}),Productivity:b({overview:"Fraction of habitable land treated as agriculturally or grazing productive.",feedsInto:"Productive area, carrying capacity, and the land-use cascade.",drawnFrom:"Auto mode uses aridity/productivity context; manual mode uses the authored productivity percentage.",caveat:"Soil, irrigation, infrastructure, and crop choice are simplified into one scalar.",references:"See Science & Maths: productivity context."}),"Crop Fraction":b({overview:"Share of productive land assigned to crop production instead of grazing.",feedsInto:"Carrying capacity through the crop/livestock efficiency factor.",interpretAs:"Higher crop fractions support more people per productive area; lower values imply more grazing or less intensive food production.",caveat:"This is a food-efficiency proxy, not a complete diet or land-management model.",references:"See Science & Maths: population carrying capacity."}),"Zipf Exponent":b({overview:"Controls how unevenly population is distributed across generated regions.",feedsInto:"Continent and region population ranks in the distribution table.",interpretAs:"q = 1 approximates classic Zipf behaviour; lower q is more even, higher q concentrates more population in the top-ranked region.",caveat:"It shapes settlement hierarchy only; it does not place cities spatially.",references:"Zipf 1949; see Science & Maths: rank-size distribution."}),"Current Population":b({overview:"Projected population after the selected elapsed time.",drawnFrom:"Initial population, carrying capacity, intrinsic growth rate, and elapsed years through the logistic equation.",interpretAs:"It approaches carrying capacity asymptotically as time increases.",caveat:"External shocks, migration, technology shifts, and collapse cycles are not simulated.",references:"Verhulst 1838; see Science & Maths: logistic growth."}),Saturation:b({overview:"Current population as a share of carrying capacity.",drawnFrom:"Current projected population divided by carrying capacity.",interpretAs:"Low saturation leaves room for near-exponential growth; high saturation means growth slows strongly.",caveat:"A high value is a model pressure signal, not a prediction of social stability.",references:"See Science & Maths: logistic growth."}),"Habitable Density":b({overview:"Population density over habitable land only.",drawnFrom:"Current population divided by habitable land area.",interpretAs:"Compare with overall density to see whether population is concentrated into a small suitable fraction.",caveat:"The model does not distribute settlements within individual climate zones.",references:"See Science & Maths: population carrying capacity."}),"Surface Area":b({overview:"Total surface area of the selected body.",drawnFrom:"Solved body radius using 4 x pi x r^2.",feedsInto:"Land area, ocean area, habitable area, and productive area.",caveat:"Oblateness, terrain roughness, and elevation hypsometry do not change this simple spherical area.",references:"See Science & Maths: geometry and population context."}),"Land Area":b({overview:"Non-ocean area available before habitability/productivity filtering.",drawnFrom:"Surface area multiplied by 1 - ocean fraction.",feedsInto:"Habitable area, productive area, carrying capacity, and density outputs.",caveat:"Manual ocean overrides on this page do not change the physical hydrosphere model.",references:"See Science & Maths: surface ocean coverage."}),"Habitable Area":b({overview:"Land area that passes the model's broad settlement-suitability screen.",drawnFrom:"Land area multiplied by habitability percentage.",feedsInto:"Productive area, habitable density, and carrying capacity.",caveat:"Local hazards, latitude-level detail, and infrastructure are outside this page's model.",references:"See Science & Maths: climate zones and habitability context."}),"Productive Area":b({overview:"Habitable land that is treated as food-productive.",drawnFrom:"Habitable area multiplied by productivity percentage.",feedsInto:"Carrying capacity and land-use cascade outputs.",caveat:"This collapses soils, irrigation, rainfall, and land management into one productivity factor.",references:"See Science & Maths: productivity context."}),"Doubling Time":b({overview:"Time needed for the current population to double at the current effective rate.",drawnFrom:"ln(2) divided by the logistic effective growth rate.",interpretAs:"Doubling time increases as population nears carrying capacity because r_eff slows.",caveat:"Undefined or very large values can appear when growth is near zero or saturated.",references:"See Science & Maths: logistic growth."}),"Overall Density":b({overview:"Population density over all land, including unsuitable land.",drawnFrom:"Current population divided by total land area.",interpretAs:"Compare with habitable density to estimate how constrained settlement is.",caveat:"It does not distinguish urban, rural, wilderness, or protected land.",references:"See Science & Maths: population carrying capacity."}),"Initial Population":b({overview:"Starting population at t = 0 for the logistic growth model.",feedsInto:"Current population, saturation trajectory, and growth curve.",interpretAs:"Smaller starts spend longer in the early exponential phase before approaching the S-curve midpoint.",caveat:"The model does not infer initial population from colonisation history or biosphere state.",references:"See Science & Maths: logistic growth."}),"Time Elapsed":b({overview:"Years advanced along the logistic growth curve.",feedsInto:"Current population, saturation, and the orange marker on the growth chart.",interpretAs:"Increasing time moves the projection toward carrying capacity.",caveat:"It is scenario time, not necessarily the planet's geological or stellar age.",references:"See Science & Maths: logistic growth."}),Continents:b({overview:"Number of top-level landmass groups used for rank-size distribution.",feedsInto:"Generated continent and region population breakdowns.",caveat:"The model does not map actual coastlines or terrain geometry.",references:"See Science & Maths: rank-size distribution."}),"Regions per Continent":b({overview:"Number of regional subdivisions generated under each continent.",feedsInto:"Regional population table and settlement hierarchy.",caveat:"Regions are procedural rank buckets, not geographic polygons.",references:"See Science & Maths: rank-size distribution."}),"Land Use Cascade":b({overview:"Visual funnel from total surface area to productive land.",drawnFrom:"Surface area, ocean fraction, habitability percentage, and productivity percentage.",interpretAs:"Each step shows how much area remains available after the previous filter.",caveat:"It shows modelled land suitability only, not legal, cultural, or ecological restrictions.",references:"See Science & Maths: population carrying capacity."}),"Growth Curve":b({overview:"Logistic population curve for the selected scenario.",drawnFrom:"Initial population, carrying capacity, growth rate, and elapsed time.",interpretAs:"The dashed line is carrying capacity and the marker is the current elapsed-time point.",caveat:"It is a smooth model curve and does not include boom/bust events.",references:"Verhulst 1838; see Science & Maths: logistic growth."})});function je(e){let o={radiusKm:6371,waterRegime:"Extensive oceans",climateZones:[]},i=X(e);if(!i)return o;let n=Z(e,`planet:${i.id}`)||Z(e,i.id),t=n?xe(e,n).model||n:null,a=t?we(t,"population"):null,r=a&&a.status!=="full"?Se(t,"population"):"";if(a?.status==="none")return{...o,unsupportedSurfaceMessage:r};let{model:c}=Pe(e,i);if(!c?.derived)return o;let y=Array.isArray(c.derived.surfaceClimateContext?.outputs?.zones)?c.derived.surfaceClimateContext.outputs.zones:[];return{radiusKm:c.derived.radiusKm||6371,waterRegime:c.derived.waterRegime||"Extensive oceans",hydrosphere:c.derived.hydrosphere||null,surfaceClimateContext:c.derived.surfaceClimateContext||null,productivityContext:c.derived.productivityContext||null,climateZones:y,limitedSurfaceMessage:a?.status==="limited"?r:""}}function Ue(e,o,i,n){let t=e.getContext("2d"),a=window.devicePixelRatio||1,r=e.clientWidth,c=e.clientHeight;e.width=r*a,e.height=c*a,t.scale(a,a);let y=getComputedStyle(e).getPropertyValue("color")||"#ccc",u="#7eb2ff",f="#a6abcc",m={top:16,bottom:28,left:64,right:16},P=r-m.left-m.right,M=c-m.top-m.bottom;if(t.clearRect(0,0,r,c),!o.length||i<=0)return;let x=o[o.length-1].year||1,_=i*1.05;function s(l){return m.left+l/x*P}function R(l){return m.top+M-l/_*M}t.strokeStyle="rgba(255,255,255,0.06)",t.lineWidth=1;for(let l=1;l<=4;l++){let S=m.top+M*l/5;t.beginPath(),t.moveTo(m.left,S),t.lineTo(m.left+P,S),t.stroke()}t.strokeStyle=f,t.lineWidth=1,t.setLineDash([6,4]);let A=R(i);if(t.beginPath(),t.moveTo(m.left,A),t.lineTo(m.left+P,A),t.stroke(),t.setLineDash([]),t.fillStyle=f,t.font="9px var(--font-mono, monospace)",t.textAlign="left",t.fillText("K",m.left+4,A-4),t.strokeStyle=u,t.lineWidth=2,t.beginPath(),o.forEach((l,S)=>{let $=s(l.year),k=R(l.population);S===0?t.moveTo($,k):t.lineTo($,k)}),t.stroke(),n>0&&n<=x){let l=s(n);t.strokeStyle="#ff9966",t.lineWidth=1,t.setLineDash([3,3]),t.beginPath(),t.moveTo(l,m.top),t.lineTo(l,m.top+M),t.stroke(),t.setLineDash([]),t.fillStyle="#ff9966",t.font="9px var(--font-mono, monospace)",t.textAlign="center",t.fillText("t",l,m.top-4)}t.fillStyle=y,t.font="9px var(--font-mono, monospace)",t.textAlign="right";let I=4;for(let l=0;l<=I;l++){let S=i*l/I,$=R(S);t.fillText(ie(S),m.left-6,$+3)}t.textAlign="center";let T=5;for(let l=0;l<=T;l++){let S=x*l/T,$=s(S);t.fillText(p(S,0),$,m.top+M+16)}t.fillStyle=f,t.textAlign="center",t.fillText("Years",m.left+P/2,c-2)}function ie(e){return e>=1e12?p(e/1e12,1)+"T":e>=1e9?p(e/1e9,1)+"B":e>=1e6?p(e/1e6,1)+"M":e>=1e3?p(e/1e3,0)+"K":p(e,0)}function Ye(e,o){let i=e.getContext("2d"),n=window.devicePixelRatio||1,t=e.clientWidth,a=e.clientHeight;e.width=t*n,e.height=a*n,i.scale(n,n);let r=getComputedStyle(e).getPropertyValue("color")||"#ccc",c={left:80,right:8,top:4,bottom:4},y=t-c.left-c.right,u=Math.floor((a-c.top-c.bottom)/3),f=3,m=o.population.surfaceAreaKm2||1,P=o.population.landAreaKm2/m,M=o.population.landAreaKm2>0?o.population.habitableAreaKm2/o.population.landAreaKm2:0,x=o.population.habitableAreaKm2>0?o.population.productiveAreaKm2/o.population.habitableAreaKm2:0;[{label:"Surface",fracs:[{f:1-P,c:"#3a7cc4",l:"Ocean"},{f:P,c:"#6b8f5e",l:"Land"}]},{label:"Land",fracs:[{f:1-M,c:"#666",l:"Uninhabitable"},{f:M,c:"#6b8f5e",l:"Habitable"}]},{label:"Habitable",fracs:[{f:1-x,c:"#8a7a55",l:"Unproductive"},{f:x,c:"#6b8f5e",l:"Productive"}]}].forEach((s,R)=>{let A=c.top+R*(u+f);i.fillStyle=r,i.font="10px var(--font-mono, monospace)",i.textAlign="right",i.fillText(s.label,c.left-8,A+u/2+4);let I=c.left;for(let T of s.fracs){let l=y*T.f;if(!(l<1)){if(i.fillStyle=T.c,i.globalAlpha=.5,i.fillRect(I,A,Math.max(l-1,1),u),i.globalAlpha=1,l>30){i.fillStyle=r,i.font="9px var(--font-mono, monospace)",i.textAlign="center";let S=`${T.l} ${p(T.f*100,0)}%`,$=`${p(T.f*100,0)}%`,k=6,L=i.measureText(S).width+k<l?S:$;i.measureText(L).width+k<l&&i.fillText(L,I+l/2,A+u/2+3)}I+=l}}})}var Ze=[{title:"Getting Started",body:"The Population page models growth, carrying capacity, and settlement distribution for a civilisation on your planet. It uses logistic growth and Zipf rank-size distributions."},{title:"Technology Era",body:"Select an era from hunter-gatherer to sci-fi. Each era sets baseline parameters for carrying capacity and growth rate. Higher technology supports larger populations per unit of land."},{title:"Growth Parameters",body:"Adjust growth rate, initial population, and elapsed time. The S-curve shows logistic growth approaching carrying capacity. Saturation percentage indicates how full the world is."},{title:"Land Use",body:"Configure ocean coverage, habitability, and productivity percentages. The cascade shows how surface area narrows from total area to productive farmland. Crop and livestock splits affect caloric output."},{title:"Distribution",body:"Population is distributed across continents and regions using Zipf\u2019s law. The rank-size chart shows how cities are distributed, from the largest capital to smaller settlements."}];function le(e){return e?.name||e?.inputs?.name||e?.id||"No compatible planet"}function Be(e=[],o=null){return e.map(i=>({value:i.id,label:le(i),selected:i.id===o?.id}))}function Ve(e={}){return[e.oceanPctOverride,e.habitablePctOverride,e.productivePctOverride,e.cropPctOverride].filter(o=>o!=null&&o!=="").length}function ne({selected:e,state:o,model:i,unsupportedMessage:n="",empty:t=!1}={}){let a=Ve(o);return G(Ce({id:"populationCockpit",title:"Population",summary:t?"Create a rocky planet before modelling settlement capacity.":"Reads the selected rocky planet's surface context, then applies population-only civilization assumptions.",current:{label:"Selected planet",value:t?"No compatible planet":le(e),meta:n?"Population output is unavailable for this body.":"Population diagnostic target."},statusItems:[{label:"Reads from",value:"Planets",meta:"Radius, climate zones, water regime, and hydrosphere context."},{label:"Diagnostic only",value:n?"Unsupported":i?i.display.currentPopulation:"Waiting",meta:"Planet science is not rewritten from this page.",tone:n?"warn":""},{label:"Authoring override",value:a?`${a} active`:"Auto",meta:"Ocean, habitability, productivity, and crop assumptions save only to Population."}],source:{label:"Source",value:"Reads from Planets",meta:"Change inputs on Planets. Local civilization assumptions stay on Population."},details:{id:"populationContextDisclosure",title:"What this reads",summary:"Planet surface, climate, hydrosphere, and optional population assumptions.",items:["Reads from Planets: radius, climate zones, water regime, hydrosphere, and surface classification.","Change inputs on Planets: edit climate, water, orbit, and habitability assumptions upstream.","Diagnostic only: population outputs do not rewrite planet science context.","Authoring override: local ocean, habitability, productivity, and crop percentages affect population outputs only."]},nextStep:{id:"populationNextStepStrip",recommendation:t?"Create a rocky planet before modelling population.":"Edit habitability or climate assumptions on Planets when capacity looks wrong.",actions:[{label:"Edit planet",href:"#/planet",primary:!0},{label:"Open Climate",href:"#/climate"},{label:"Open Calendar",href:"#/calendar"}]}}))}function re(){return G(Me({id:"populationDependencyNotice",title:"Reads from Planets",body:"Reads from the selected rocky planet's radius, water regime, climate zones, and hydrosphere context. Change inputs on Planets.",source:"Diagnostic only for planet science. Authoring override sliders here affect population outputs without rewriting inferred climate or ocean coverage.",actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}function se(e,o,i=""){return G(Ae({id:"populationObjectSelector",title:"Planet selection",summary:"Choose the rocky planet whose settlement model should read upstream science from.",selectedLabel:"Selected planet",selectedValue:le(o),selectedMeta:i?"No compatible population output for this body.":"Population diagnostic target.",selectId:"popPlanetSelect",selectLabel:"Planet",selectOptions:Be(e,o)}))}function Xe(e,o){return`
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Population</h1></div>
          <div class="panel__body">
            ${ne({selected:o,empty:!0})}
            ${re()}
            ${G(ae({id:"populationEmptyState",title:"No compatible rocky planet",body:"Population needs a rocky planet before it can read climate, hydrosphere, and surface-area context.",actions:[{label:"Create a planet",href:"#/planet"}]}))}
            ${e.length?se(e,o):""}
          </div>
        </div>
      </div>`}function ft(e){let o=B(),i=V(o);if(!i.length){e.innerHTML=Xe(i,null);return}let n=o.population||{},t={techEra:n.techEra||"Medieval",initialPopulation:n.initialPopulation||1e3,growthRate:n.growthRate??null,timeElapsedYears:n.timeElapsedYears??500,continentCount:n.continentCount||6,regionCount:n.regionCount||10,zipfExponent:n.zipfExponent??1,oceanPctOverride:n.oceanPctOverride??null,habitablePctOverride:n.habitablePctOverride??null,productivePctOverride:n.productivePctOverride??null,cropPctOverride:n.cropPctOverride??null};function a(){fe({population:{...t}})}function r(){let f=B(),m=V(f),P=X(f),M=je(f),x=M.unsupportedSurfaceMessage||"",_=M.limitedSurfaceMessage||"",s=x?null:Fe({...M,...t});if(x){e.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${h(v.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${ne({selected:P,state:t,unsupportedMessage:x})}
            ${re()}
            ${se(m,P,x)}
            ${G(ae({id:"populationUnsupportedState",title:"No compatible population output",body:x,actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}
          </div>
        </div>
      </div>`,te(e);let g=e.querySelector("#popPlanetSelect");g&&g.addEventListener("change",()=>{J(g.value),r()});return}let R=oe.map(g=>`<option value="${H(g)}"${g===t.techEra?" selected":""}>${H(g)}</option>`).join(""),A=g=>g?'<span class="pop-auto-badge">auto</span>':"";e.innerHTML=`
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${h(v.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${ne({selected:P,state:t,model:s})}
            ${re()}
            ${se(m,P)}

            ${_?`<div class="derived-readout">${H(_)}</div>`:""}

            <section class="kpi-section" id="populationSummary">
              <div class="kpi-section__header"><h3 class="kpi-section__title">Summary</h3></div>
              <div class="kpi-grid">
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Population ${h(v["Current Population"])}</div>
                  <div class="kpi__value">${H(s.display.currentPopulation)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Carrying Capacity ${h(v["Carrying Capacity"])}</div>
                  <div class="kpi__value">${H(s.display.carryingCapacity)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Saturation ${h(v.Saturation)}</div>
                  <div class="kpi__value">${H(s.display.saturation)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Habitable Density ${h(v["Habitable Density"])}</div>
                  <div class="kpi__value">${H(s.display.habitableDensity)}</div>
                </div></div>
              </div>
            </section>

            <div class="grid-2" style="margin-top:12px">
              <div class="subsection">
                <h3>Land Use ${h(v["Land Use Cascade"])}</h3>

                <div class="form-row">
                  <label>Ocean % ${A(s.inputs.oceanIsAuto)} ${h(v["Ocean Coverage"])}</label>
                  <input type="range" id="popOcean" min="0" max="99" step="1"
                    value="${s.inputs.oceanPct}">
                  <span class="derived-readout">${p(s.inputs.oceanPct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Habitable % ${A(s.inputs.habitableIsAuto)} ${h(v.Habitability)}</label>
                  <input type="range" id="popHabitable" min="0" max="100" step="1"
                    value="${s.inputs.habitablePct}">
                  <span class="derived-readout">${p(s.inputs.habitablePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Productive % ${A(s.inputs.productiveIsAuto)} ${h(v.Productivity)}</label>
                  <input type="range" id="popProductive" min="0" max="100" step="1"
                    value="${s.inputs.productivePct}">
                  <span class="derived-readout">${p(s.inputs.productivePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Crop % ${h(v["Crop Fraction"])}</label>
                  <input type="range" id="popCrop" min="0" max="100" step="1"
                    value="${s.inputs.cropPct}">
                  <span class="derived-readout">${p(s.inputs.cropPct,0)}%</span>
                </div>

                <button id="popResetAuto" class="btn btn--sm" style="margin-top:4px">Reset to auto</button>

                <canvas id="popCascadeCanvas" class="pop-cascade-canvas"></canvas>

                ${ee([{labelHtml:`Surface Area ${h(v["Surface Area"])}`,value:s.display.surfaceArea},{labelHtml:`Land Area ${h(v["Land Area"])}`,value:s.display.landArea},{labelHtml:`Habitable Area ${h(v["Habitable Area"])}`,value:s.display.habitableArea},{labelHtml:`Productive Area ${h(v["Productive Area"])}`,value:s.display.productiveArea}])}
              </div>

              <div class="subsection">
                <h3>Growth Model ${h(v["Growth Curve"])}</h3>

                <div class="form-row">
                  <label for="popTechEra">Tech Era ${h(v["Technology Era"])}</label>
                  <select id="popTechEra">${R}</select>
                </div>

                <div class="form-row">
                  <label>Initial Population ${h(v["Initial Population"])}</label>
                  <input type="number" id="popInitPop" min="1" step="1"
                    value="${t.initialPopulation}">
                </div>

                <div class="form-row">
                  <label>Growth Rate ${h(v["Growth Rate"])}</label>
                  <input type="range" id="popGrowthRate" min="0.001" max="0.05" step="0.001"
                    value="${s.inputs.growthRate}">
                  <span class="derived-readout">${H(s.display.growthRate)}</span>
                </div>

                <div class="form-row">
                  <label>Time Elapsed (years) ${h(v["Time Elapsed"])}</label>
                  <input type="number" id="popTime" min="0" step="10"
                    value="${t.timeElapsedYears}">
                </div>

                <canvas id="popGrowthCanvas" class="pop-growth-canvas"></canvas>

                ${ee([{labelHtml:`Doubling Time ${h(v["Doubling Time"])}`,value:s.display.doublingTime},{labelHtml:`Overall Density ${h(v["Overall Density"])}`,value:s.display.overallDensity}])}
              </div>
            </div>

            <div class="subsection" style="margin-top:12px">
              <h3>Distribution ${h(v["Zipf Exponent"])}</h3>

              <div class="grid-2">
                <div class="form-row">
                  <label>Continents ${h(v.Continents)}</label>
                  <input type="number" id="popContCount" min="1" max="20" step="1"
                    value="${t.continentCount}">
                </div>
                <div class="form-row">
                  <label>Regions per Continent ${h(v["Regions per Continent"])}</label>
                  <input type="number" id="popRegCount" min="1" max="50" step="1"
                    value="${t.regionCount}">
                </div>
              </div>

              <div class="form-row">
                <label>Zipf Exponent (q) ${h(v["Zipf Exponent"])}</label>
                <input type="range" id="popZipf" min="0.5" max="1.5" step="0.05"
                  value="${t.zipfExponent}">
                <span class="derived-readout">${p(t.zipfExponent,2)}</span>
              </div>

              <div class="pop-dist-list">
                ${s.population.continents.map(g=>`
                  <details class="pop-dist-card">
                    <summary class="pop-dist-summary">
                      <span class="pop-dist-rank">Continent ${g.rank}</span>
                      <span class="pop-dist-pop">${ie(g.population)}</span>
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
                              <td>${ie(C.population)}</td>
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
      </div>`,te(e),ye(e),requestAnimationFrame(()=>{let g=e.querySelector("#popGrowthCanvas");g&&Ue(g,s.population.timeSeries,s.population.K,s.inputs.timeElapsedYears);let C=e.querySelector("#popCascadeCanvas");C&&Ye(C,s)});let I=e.querySelector("#popPlanetSelect");I&&I.addEventListener("change",()=>{J(I.value),r()});let T=e.querySelector("#popTechEra");T&&T.addEventListener("change",()=>{t.techEra=T.value,t.growthRate=null,a(),r()});let l=e.querySelector("#popInitPop");l&&l.addEventListener("change",()=>{t.initialPopulation=Math.max(1,Number(l.value)||1e3),a(),r()});let S=e.querySelector("#popGrowthRate");S&&S.addEventListener("input",()=>{t.growthRate=Number(S.value),a(),r()});let $=e.querySelector("#popTime");$&&$.addEventListener("change",()=>{t.timeElapsedYears=Math.max(0,Number($.value)||0),a(),r()});let k=e.querySelector("#popOcean");k&&k.addEventListener("input",()=>{t.oceanPctOverride=Number(k.value),a(),r()});let L=e.querySelector("#popHabitable");L&&L.addEventListener("input",()=>{t.habitablePctOverride=Number(L.value),a(),r()});let W=e.querySelector("#popProductive");W&&W.addEventListener("input",()=>{t.productivePctOverride=Number(W.value),a(),r()});let D=e.querySelector("#popCrop");D&&D.addEventListener("input",()=>{t.cropPctOverride=Number(D.value),a(),r()});let z=e.querySelector("#popResetAuto");z&&z.addEventListener("click",()=>{t.oceanPctOverride=null,t.habitablePctOverride=null,t.productivePctOverride=null,t.cropPctOverride=null,a(),r()});let N=e.querySelector("#popContCount");N&&N.addEventListener("change",()=>{t.continentCount=Math.max(1,Math.min(20,Number(N.value)||6)),a(),r()});let O=e.querySelector("#popRegCount");O&&O.addEventListener("change",()=>{t.regionCount=Math.max(1,Math.min(50,Number(O.value)||10)),a(),r()});let j=e.querySelector("#popZipf");j&&j.addEventListener("input",()=>{t.zipfExponent=Number(j.value),a(),r()})}r();let c=document.createElement("div");document.body.appendChild(c);let y=ge({steps:Ze,storageKey:"worldsmith.pop.tutorial",container:c});e.addEventListener("click",f=>{f.target.closest("#popTutorials")&&y?.toggle()});let u=new MutationObserver(()=>{e.isConnected||(y?.destroy(),c.remove(),u.disconnect())});u.observe(e.parentNode||document.body,{childList:!0})}export{ft as initPopulationPage};
