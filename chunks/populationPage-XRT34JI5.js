import{a as se,e as ce}from"./chunk-5SAPJVLW.js";import"./chunk-BRNPJGEW.js";import"./chunk-DRLPC5MQ.js";import{b as Ae,c as Me}from"./chunk-HBNXX252.js";import"./chunk-JUK5PP3S.js";import{b as re}from"./chunk-ZI63CFXG.js";import"./chunk-BI755AXV.js";import{f as Ce,g as Pe}from"./chunk-KM4G7NFN.js";import"./chunk-67BZ5CSS.js";import{c as Se}from"./chunk-KBPV7C6X.js";import"./chunk-B5JT2W7P.js";import{a as h,d as le,e as b,f as xe}from"./chunk-EHZCB5HO.js";import{a as I}from"./chunk-4DOSHAKO.js";import{$a as oe,Bb as ge,Pa as te,_a as ae,ab as ie,da as ee}from"./chunk-LXNIONG2.js";import"./chunk-TR2TDQN3.js";import"./chunk-7MOERMFY.js";import"./chunk-CHI6BCHQ.js";import"./chunk-ILDN3TNT.js";import"./chunk-JY5EGEKT.js";import"./chunk-7WOMQQJ7.js";import"./chunk-4NRNBL6B.js";import"./chunk-5LTSFBYL.js";import"./chunk-QFPSSDPE.js";import"./chunk-CBTHXHPR.js";import"./chunk-7GQDESQ2.js";import"./chunk-QUJRDZK4.js";import"./chunk-IEW7HQ43.js";import"./chunk-MQPPEWJZ.js";import{h as we,x as ne}from"./chunk-4SQRNXTG.js";import"./chunk-L3IA4LVI.js";import"./chunk-UNOVE7R7.js";import"./chunk-GLBR67F3.js";import"./chunk-Q3EXAOWE.js";import"./chunk-ASLSWSPR.js";import"./chunk-VW67QI3I.js";import"./chunk-HWHNMDED.js";import{A as _,C as d,w as P,y as S}from"./chunk-TXBNWBBK.js";import"./chunk-6DA3R6ZF.js";import"./chunk-RC2KHOII.js";import"./chunk-WLUJ3GDC.js";var $e=Object.freeze(["Dry","Shallow oceans","Extensive oceans","Global ocean","Deep ocean","Ice world"].reduce((e,a)=>(e[a]=we(a).liquidOceanFraction,e),{})),Fe={"Hunter-Gatherer":.05,Neolithic:2,"Bronze Age":8,"Iron Age":15,Medieval:30,"Early Industrial":80,Industrial:200,"Post-Industrial":400,"Sci-Fi High":1e3},qe={"Hunter-Gatherer":.005,Neolithic:.008,"Bronze Age":.01,"Iron Age":.01,Medieval:.01,"Early Industrial":.015,Industrial:.02,"Post-Industrial":.005,"Sci-Fi High":.003},Te=4,ze=.77,ke=6371,pe=Object.keys(Fe);function Ie(e){return e>=1e12?d(e/1e12,2)+" trillion":e>=1e9?d(e/1e9,2)+" billion":e>=1e6?d(e/1e6,2)+" million":e>=1e3?d(e/1e3,1)+" thousand":d(e,0)}function je(e){let a=$e[e]??$e["Shallow oceans"];return{oceanFraction:_(a,3),landFraction:_(1-a,3)}}function Ge(e){if(!e||!e.length)return 0;let a=e.filter(i=>i.master!=="E"&&i.master!=="X");if(!a.length)return 0;let o=0,n=0,t=new Set;for(let i of a){let v=`${i.latMin}-${i.latMax}-${i.variant}`;if(t.has(v))continue;t.add(v);let p=Math.sin(i.latMin*Math.PI/180),u=Math.sin(i.latMax*Math.PI/180),y=Math.abs(u-p);o+=y;let m=P(i.aridity,0,1);i.master==="B"&&(m=i.aridity<.25?.05:.3),n+=y*m}return o>0?_(n/o,3):0}function Ke(e,a,o){let n=Math.max(S(e,0),0),t=Math.max(S(a,30),0),i=P(S(o,77)/100,0,1),v=1+(Te-1)*ze,p=1+(Te-1)*i,u=t*(p/v);return Math.round(n*u)}function _e(e,a,o,n){if(![e,a,o,n].every(i=>typeof i=="number"&&Number.isFinite(i)&&i>=0)||e>Number.MAX_SAFE_INTEGER||a>Number.MAX_SAFE_INTEGER)return null;if(a===0||n===0)return a;if(e===0)return null;if(o===0)return a;let t=Math.exp(-o*n);return Math.round(e*a/(e*t-a*Math.expm1(-o*n)))}function Ue(e,a,o,n,t=100){let i=Math.max(S(n,1e3),1),v=P(S(t,100),10,500),p=i/v,u=[];for(let y=0;y<=v;y++){let m=_(y*p,1);u.push({year:m,population:_e(e,a,o,m)})}return u}function Ee(e,a,o=1){if(!Number.isSafeInteger(e)||e<0)return[];let n=e,t=P(Math.round(S(a,6)),1,100),i=P(S(o,1),.5,1.5);if(n===0)return[];let v=0;for(let r=1;r<=t;r++)v+=1/Math.pow(r,i);let p=n/v,u=[];for(let r=1;r<=t;r++){let l=p/Math.pow(r,i);u.push({rank:r,population:Math.floor(l),remainder:l-Math.floor(l)})}let y=n-u.reduce((r,l)=>r+l.population,0),m=[...u].sort((r,l)=>l.remainder-r.remainder||r.rank-l.rank);for(let r=0;r<y;r++)m[r%m.length].population++;return u.map(({rank:r,population:l})=>({rank:r,population:l,fraction:_(l/n,4)}))}function ue({sourceMode:e="auto",sourceAvailable:a=!0,climateSelection:o=null,radiusKm:n,oceanPctOverride:t,habitablePctOverride:i,productivePctOverride:v,cropPctOverride:p}={}){if(e==="manual"){let r=Object.entries({oceanPctOverride:t,habitablePctOverride:i,productivePctOverride:v,cropPctOverride:p}).filter(([,l])=>typeof l!="number"||!Number.isFinite(l)||l<0||l>100).map(([l])=>l);return typeof n=="number"&&Number.isFinite(n)&&n>0||r.push("radiusKm"),{status:r.length?"unavailable":"available",sourceMode:e,reason:r.length?"Complete all four manual land-use fractions and supply a valid body radius.":"Authored population scenario; inferred climate is not used.",missing:r}}if([t,i,v,p].some(m=>m!=null&&(typeof m!="number"||!Number.isFinite(m)||m<0||m>100)))return{status:"unavailable",sourceMode:"auto",missing:[],reason:"Land-use overrides must be finite percentages between 0 and 100."};let y=!a||o&&o.status!=="supported";return{status:y?"unavailable":"available",sourceMode:"auto",missing:[],reason:y?`Upstream climate unavailable. ${(o?.issues||[]).join(" ")}`.trim():"Reads the selected planet's inferred surface climate."}}function Le({sourceMode:e="auto",sourceAvailable:a=!0,climateSelection:o=null,radiusKm:n=ke,waterRegime:t="Extensive oceans",climateZones:i=[],techEra:v="Medieval",initialPopulation:p=1e3,growthRate:u=null,timeElapsedYears:y=0,continentCount:m=6,regionCount:r=10,zipfExponent:l=1,hydrosphere:x=null,productivityContext:A=null,oceanPctOverride:E=null,habitablePctOverride:T=null,productivePctOverride:C=null,cropPctOverride:M=null}={}){let c=ue({sourceMode:e,sourceAvailable:a,climateSelection:o,radiusKm:n,oceanPctOverride:E,habitablePctOverride:T,productivePctOverride:C,cropPctOverride:M});if(c.status!=="available")return{status:"unavailable",reason:c.reason,availability:c,inputs:{sourceMode:e},population:null,display:null};e==="manual"&&(x=null,A=null);let k=Math.max(S(n,ke),1),s=4*Math.PI*k*k,g=x&&typeof x=="object"?{oceanFraction:P(S(x.liquidOceanFraction,0),0,1),landFraction:P(S(x.landFraction,1),0,1)}:je(t),$=E!=null?P(S(E,71),0,100):_(g.oceanFraction*100,1),L=E!=null?1-$/100:P(S(g.landFraction,1-g.oceanFraction),0,1),R=s*L,G=ne(i),K=T!=null?P(S(T,50),0,100):_(G*100,1),D=R*(K/100),W=P(S(A?.outputs?.populationCarryingCapacityModifier,1),.1,1.15),Y=P(Ge(i)*W,0,1),Z=C!=null?P(S(C,50),0,100):_(Y*100,1),j=D*(Z/100),U=M!=null?P(S(M,77),0,100):77,z=pe.includes(v)?v:"Medieval",w=Fe[z],q=qe[z],O=u??q,N=Ke(j,w,U),H=p,J=y,F=Number.isSafeInteger(H)&&O<=.05?_e(N,H,O,J):null,Re=O>0&&H>0&&N>H?Math.log(19*(N-H)/H)/O:1e3,He=Math.max(J,Re,100),Ne=F===null?[]:Ue(N,H,O,He,100),fe=P(Math.round(S(m,6)),1,20),me=P(Math.round(S(r,10)),1,50),Q=P(S(l,1),.5,1.5),Oe=Ee(F,fe,Q).map(ye=>({...ye,subregions:Ee(ye.population,me,Q)})),B=F!==null&&R>0?F/R:null,V=F!==null&&D>0?F/D:null,be=O>0?Math.LN2/O:1/0,X=N>0&&F!==null?F/N*100:null;return{availability:c,status:F===null?"unavailable":"available",reason:F===null?"No logistic forecast for these initial conditions and capacity.":N===0&&H>0?"Initial population only; no logistic forecast at zero capacity.":"",forecastAvailable:N>0||H===0,inputs:{sourceMode:e,radiusKm:k,waterRegime:t,techEra:z,oceanPct:$,habitablePct:K,productivePct:Z,cropPct:U,initialPopulation:H,growthRate:O,timeElapsedYears:J,continentCount:fe,regionCount:me,zipfExponent:Q,oceanIsAuto:E==null,habitableIsAuto:T==null,productiveIsAuto:C==null,cropIsAuto:M==null,productivityContextApplied:C==null&&A!=null},population:{surfaceAreaKm2:s,landAreaKm2:R,habitableAreaKm2:D,productiveAreaKm2:j,K:N,currentPopulation:F,overallDensityPerKm2:B===null?null:_(B,2),habitableDensityPerKm2:V===null?null:_(V,2),timeSeries:Ne,continents:Oe,doublingTimeYears:_(be,1),saturationPct:X===null?null:_(X,1)},display:{surfaceArea:d(s,0)+" km\xB2",landArea:d(R,0)+" km\xB2",habitableArea:d(D,0)+" km\xB2",productiveArea:d(j,0)+" km\xB2",carryingCapacity:Ie(N),currentPopulation:F===null?"Unavailable":Ie(F),overallDensity:B===null?"Unavailable":d(B,1)+"/km\xB2",habitableDensity:V===null?"Unavailable":d(V,1)+"/km\xB2",doublingTime:N<=H||H===0?"Not applicable":O>0?d(be,0)+" years (low-density)":"\u221E",saturation:X===null?"Unavailable":d(X,1)+"%",techEra:z,growthRate:d(O*100,2)+"%/yr"}}}var f={};Object.assign(f,{Population:b({overview:"Procedural population model for a selected rocky world or supported surface body.",drawnFrom:"Solved planet radius, inferred/overridden ocean fraction, climate-zone habitability, productivity context, and user-authored civilisation settings.",interpretAs:"It estimates capacity, growth state, density, and regional distribution for worldbuilding use.",caveat:"This is not an economic, demographic, migration, or political simulation; it is a bounded carrying-capacity model.",references:"See Science & Maths: population and habitability context."}),"Technology Era":b({overview:"Civilisation technology band used to seed density and default growth assumptions.",feedsInto:"Carrying capacity, default growth rate, current population projection, and density outputs.",typicalRange:"Hunter-gatherer is sparse; medieval and industrial eras raise productive-land density; sci-fi high assumes intensive infrastructure.",caveat:"Era is a coarse worldbuilding proxy, not a full development-history model.",references:"See Science & Maths: population carrying capacity."}),"Growth Rate":b({overview:"Intrinsic yearly growth rate for the logistic population curve.",feedsInto:"Current population, saturation, doubling time, and growth-curve shape over elapsed time.",interpretAs:"The effective rate slows as population approaches carrying capacity: r_eff = r x (1 - P/K).",caveat:"The model does not simulate age structure, disease, shocks, migration, or policy changes.",references:"Verhulst 1838; see Science & Maths: logistic growth."}),"Carrying Capacity":b({overview:"Maximum population supported by the modelled productive land.",drawnFrom:"Productive area, technology-era density, crop fraction, and crop/livestock efficiency assumptions.",interpretAs:"Values near or above current population indicate how close the model is to resource saturation.",caveat:"It represents broad food/land capacity, not trade, energy supply, imports, or non-agricultural limits.",references:"See Science & Maths: population carrying capacity."}),"Ocean Coverage":b({overview:"Population-page land/ocean split.",feedsInto:"Land area, habitable area, productive area, carrying capacity, and density outputs.",drawnFrom:"Auto mode follows solved inferred surface-ocean coverage when available; manual mode uses the authored population override.",caveat:"Manual population overrides affect population/visual land-use outputs and do not rewrite the planet hydrosphere.",references:"See Science & Maths: surface ocean coverage."}),Habitability:b({overview:"Fraction of land treated as broadly settlement-suitable.",feedsInto:"Habitable area, habitable density, productivity, and carrying capacity.",drawnFrom:"Auto mode uses area-weighted climate zones; polar/special zones are excluded unless you override the percentage.",caveat:"This is a land-use suitability screen, not a guarantee of comfort, technology, or biosphere support.",references:"See Science & Maths: climate zones and habitability context."}),Productivity:b({overview:"Fraction of habitable land treated as agriculturally or grazing productive.",feedsInto:"Productive area, carrying capacity, and the land-use cascade.",drawnFrom:"Auto mode uses aridity/productivity context; manual mode uses the authored productivity percentage.",caveat:"Soil, irrigation, infrastructure, and crop choice are simplified into one scalar.",references:"See Science & Maths: productivity context."}),"Crop Fraction":b({overview:"Share of productive land assigned to crop production instead of grazing.",feedsInto:"Carrying capacity through the crop/livestock efficiency factor.",interpretAs:"Higher crop fractions support more people per productive area; lower values imply more grazing or less intensive food production.",caveat:"This is a food-efficiency proxy, not a complete diet or land-management model.",references:"See Science & Maths: population carrying capacity."}),"Zipf Exponent":b({overview:"Controls how unevenly population is distributed across generated regions.",feedsInto:"Continent and region population ranks in the distribution table.",interpretAs:"q = 1 approximates classic Zipf behaviour; lower q is more even, higher q concentrates more population in the top-ranked region.",caveat:"It shapes settlement hierarchy only; it does not place cities spatially.",references:"Zipf 1949; see Science & Maths: rank-size distribution."}),"Current Population":b({overview:"Projected population after the selected elapsed time.",drawnFrom:"Initial population, carrying capacity, intrinsic growth rate, and elapsed years through the logistic equation.",interpretAs:"It approaches carrying capacity asymptotically as time increases.",caveat:"External shocks, migration, technology shifts, and collapse cycles are not simulated.",references:"Verhulst 1838; see Science & Maths: logistic growth."}),Saturation:b({overview:"Current population as a share of carrying capacity.",drawnFrom:"Current projected population divided by carrying capacity.",interpretAs:"Low saturation leaves room for near-exponential growth; high saturation means growth slows strongly.",caveat:"A high value is a model pressure signal, not a prediction of social stability.",references:"See Science & Maths: logistic growth."}),"Habitable Density":b({overview:"Population density over habitable land only.",drawnFrom:"Current population divided by habitable land area.",interpretAs:"Compare with overall density to see whether population is concentrated into a small suitable fraction.",caveat:"The model does not distribute settlements within individual climate zones.",references:"See Science & Maths: population carrying capacity."}),"Surface Area":b({overview:"Total surface area of the selected body.",drawnFrom:"Solved body radius using 4 x pi x r^2.",feedsInto:"Land area, ocean area, habitable area, and productive area.",caveat:"Oblateness, terrain roughness, and elevation hypsometry do not change this simple spherical area.",references:"See Science & Maths: geometry and population context."}),"Land Area":b({overview:"Non-ocean area available before habitability/productivity filtering.",drawnFrom:"Surface area multiplied by 1 - ocean fraction.",feedsInto:"Habitable area, productive area, carrying capacity, and density outputs.",caveat:"Manual ocean overrides on this page do not change the physical hydrosphere model.",references:"See Science & Maths: surface ocean coverage."}),"Habitable Area":b({overview:"Land area that passes the model's broad settlement-suitability screen.",drawnFrom:"Land area multiplied by habitability percentage.",feedsInto:"Productive area, habitable density, and carrying capacity.",caveat:"Local hazards, latitude-level detail, and infrastructure are outside this page's model.",references:"See Science & Maths: climate zones and habitability context."}),"Productive Area":b({overview:"Habitable land that is treated as food-productive.",drawnFrom:"Habitable area multiplied by productivity percentage.",feedsInto:"Carrying capacity and land-use cascade outputs.",caveat:"This collapses soils, irrigation, rainfall, and land management into one productivity factor.",references:"See Science & Maths: productivity context."}),"Doubling Time":b({overview:"Time needed for the current population to double at the current effective rate.",drawnFrom:"ln(2) divided by the logistic effective growth rate.",interpretAs:"Doubling time increases as population nears carrying capacity because r_eff slows.",caveat:"Undefined or very large values can appear when growth is near zero or saturated.",references:"See Science & Maths: logistic growth."}),"Overall Density":b({overview:"Population density over all land, including unsuitable land.",drawnFrom:"Current population divided by total land area.",interpretAs:"Compare with habitable density to estimate how constrained settlement is.",caveat:"It does not distinguish urban, rural, wilderness, or protected land.",references:"See Science & Maths: population carrying capacity."}),"Initial Population":b({overview:"Starting population at t = 0 for the logistic growth model.",feedsInto:"Current population, saturation trajectory, and growth curve.",interpretAs:"Smaller starts spend longer in the early exponential phase before approaching the S-curve midpoint.",caveat:"The model does not infer initial population from colonisation history or biosphere state.",references:"See Science & Maths: logistic growth."}),"Time Elapsed":b({overview:"Years advanced along the logistic growth curve.",feedsInto:"Current population, saturation, and the orange marker on the growth chart.",interpretAs:"Increasing time moves the projection toward carrying capacity.",caveat:"It is scenario time, not necessarily the planet's geological or stellar age.",references:"See Science & Maths: logistic growth."}),Continents:b({overview:"Number of top-level landmass groups used for rank-size distribution.",feedsInto:"Generated continent and region population breakdowns.",caveat:"The model does not map actual coastlines or terrain geometry.",references:"See Science & Maths: rank-size distribution."}),"Regions per Continent":b({overview:"Number of regional subdivisions generated under each continent.",feedsInto:"Regional population table and settlement hierarchy.",caveat:"Regions are procedural rank buckets, not geographic polygons.",references:"See Science & Maths: rank-size distribution."}),"Land Use Cascade":b({overview:"Visual funnel from total surface area to productive land.",drawnFrom:"Surface area, ocean fraction, habitability percentage, and productivity percentage.",interpretAs:"Each step shows how much area remains available after the previous filter.",caveat:"It shows modelled land suitability only, not legal, cultural, or ecological restrictions.",references:"See Science & Maths: population carrying capacity."}),"Growth Curve":b({overview:"Logistic population curve for the selected scenario.",drawnFrom:"Initial population, carrying capacity, growth rate, and elapsed time.",interpretAs:"The dashed line is carrying capacity and the marker is the current elapsed-time point.",caveat:"It is a smooth model curve and does not include boom/bust events.",references:"Verhulst 1838; see Science & Maths: logistic growth."})});function We(e){let a={sourceAvailable:!1,radiusKm:null,waterRegime:null,climateZones:[]},o=oe(e);if(!o)return a;let n=ee(e,`planet:${o.id}`)||ee(e,o.id),t=n?Me(e,n).model||n:null,i=t?Ce(t,"population"):null,v=i&&i.status!=="full"?Pe(t,"population"):"";if(i?.status==="none")return{...a,unsupportedSurfaceMessage:v};let{model:p}=Ae(e,o);if(!p?.derived)return a;let u=Array.isArray(p.derived.surfaceClimateContext?.outputs?.zones)?p.derived.surfaceClimateContext.outputs.zones:[];return{sourceAvailable:u.length>0&&Number.isFinite(p.derived.radiusKm),climateSelection:p.derived.climateSelection||null,radiusKm:p.derived.radiusKm??null,waterRegime:p.derived.waterRegime??null,hydrosphere:p.derived.hydrosphere||null,surfaceClimateContext:p.derived.surfaceClimateContext||null,productivityContext:p.derived.productivityContext||null,climateZones:u,limitedSurfaceMessage:i?.status==="limited"?v:""}}function Ye(e,a,o,n){let t=e.getContext("2d"),i=window.devicePixelRatio||1,v=e.clientWidth,p=e.clientHeight;e.width=v*i,e.height=p*i,t.scale(i,i);let u=getComputedStyle(e).getPropertyValue("color")||"#ccc",y="#7eb2ff",m="#a6abcc",r={top:16,bottom:28,left:64,right:16},l=v-r.left-r.right,x=p-r.top-r.bottom;if(t.clearRect(0,0,v,p),a=a.filter(s=>Number.isFinite(s.population)),!a.length||o<=0)return;let A=a[a.length-1].year||1,E=Math.max(o,...a.map(s=>s.population),1)*1.05;function T(s){return r.left+s/A*l}function C(s){return r.top+x-s/E*x}t.strokeStyle="rgba(255,255,255,0.06)",t.lineWidth=1;for(let s=1;s<=4;s++){let g=r.top+x*s/5;t.beginPath(),t.moveTo(r.left,g),t.lineTo(r.left+l,g),t.stroke()}t.strokeStyle=m,t.lineWidth=1,t.setLineDash([6,4]);let M=C(o);if(t.beginPath(),t.moveTo(r.left,M),t.lineTo(r.left+l,M),t.stroke(),t.setLineDash([]),t.fillStyle=m,t.font="9px var(--font-mono, monospace)",t.textAlign="left",t.fillText("K",r.left+4,M-4),t.strokeStyle=y,t.lineWidth=2,t.beginPath(),a.forEach((s,g)=>{let $=T(s.year),L=C(s.population);g===0?t.moveTo($,L):t.lineTo($,L)}),t.stroke(),n>0&&n<=A){let s=T(n);t.strokeStyle="#ff9966",t.lineWidth=1,t.setLineDash([3,3]),t.beginPath(),t.moveTo(s,r.top),t.lineTo(s,r.top+x),t.stroke(),t.setLineDash([]),t.fillStyle="#ff9966",t.font="9px var(--font-mono, monospace)",t.textAlign="center",t.fillText("t",s,r.top-4)}t.fillStyle=u,t.font="9px var(--font-mono, monospace)",t.textAlign="right";let c=4;for(let s=0;s<=c;s++){let g=o*s/c,$=C(g);t.fillText(de(g),r.left-6,$+3)}t.textAlign="center";let k=5;for(let s=0;s<=k;s++){let g=A*s/k,$=T(g);t.fillText(d(g,0),$,r.top+x+16)}t.fillStyle=m,t.textAlign="center",t.fillText("Years",r.left+l/2,p-2)}function de(e){return e>=1e12?d(e/1e12,1)+"T":e>=1e9?d(e/1e9,1)+"B":e>=1e6?d(e/1e6,1)+"M":e>=1e3?d(e/1e3,0)+"K":d(e,0)}function Ze(e,a){let o=e.getContext("2d"),n=window.devicePixelRatio||1,t=e.clientWidth,i=e.clientHeight;e.width=t*n,e.height=i*n,o.scale(n,n);let v=getComputedStyle(e).getPropertyValue("color")||"#ccc",p={left:80,right:8,top:4,bottom:4},u=t-p.left-p.right,y=Math.floor((i-p.top-p.bottom)/3),m=3,r=a.population.surfaceAreaKm2||1,l=a.population.landAreaKm2/r,x=a.population.landAreaKm2>0?a.population.habitableAreaKm2/a.population.landAreaKm2:0,A=a.population.habitableAreaKm2>0?a.population.productiveAreaKm2/a.population.habitableAreaKm2:0;[{label:"Surface",fracs:[{f:1-l,c:"#3a7cc4",l:"Ocean"},{f:l,c:"#6b8f5e",l:"Land"}]},{label:"Land",fracs:[{f:1-x,c:"#666",l:"Uninhabitable"},{f:x,c:"#6b8f5e",l:"Habitable"}]},{label:"Habitable",fracs:[{f:1-A,c:"#8a7a55",l:"Unproductive"},{f:A,c:"#6b8f5e",l:"Productive"}]}].forEach((T,C)=>{let M=p.top+C*(y+m);o.fillStyle=v,o.font="10px var(--font-mono, monospace)",o.textAlign="right",o.fillText(T.label,p.left-8,M+y/2+4);let c=p.left;for(let k of T.fracs){let s=u*k.f;if(!(s<1)){if(o.fillStyle=k.c,o.globalAlpha=.5,o.fillRect(c,M,Math.max(s-1,1),y),o.globalAlpha=1,s>30){o.fillStyle=v,o.font="9px var(--font-mono, monospace)",o.textAlign="center";let g=`${k.l} ${d(k.f*100,0)}%`,$=`${d(k.f*100,0)}%`,L=6,R=o.measureText(g).width+L<s?g:$;o.measureText(R).width+L<s&&o.fillText(R,c+s/2,M+y/2+3)}c+=s}}})}var Be=[{title:"Getting Started",body:"The Population page models growth, carrying capacity, and settlement distribution for a civilisation on your planet. It uses logistic growth and Zipf rank-size distributions."},{title:"Technology Era",body:"Select an era from hunter-gatherer to sci-fi. Each era sets baseline parameters for carrying capacity and growth rate. Higher technology supports larger populations per unit of land."},{title:"Growth Parameters",body:"Adjust growth rate, initial population, and elapsed time. The S-curve shows logistic growth approaching carrying capacity. Saturation percentage indicates how full the world is."},{title:"Land Use",body:"Configure ocean coverage, habitability, and productivity percentages. The cascade shows how surface area narrows from total area to productive farmland. Crop and livestock splits affect caloric output."},{title:"Distribution",body:"Population is distributed across continents and regions using Zipf\u2019s law. The rank-size chart shows how cities are distributed, from the largest capital to smaller settlements."}];function Ve(e){return e?.name||e?.inputs?.name||e?.id||"No compatible planet"}function Xe(e=[],a=null){return e.map(o=>({value:o.id,label:Ve(o),selected:o.id===a?.id}))}function ve({state:e={},model:a,unsupportedMessage:o="",empty:n=!1}={}){return`<div id="populationCockpit" class="population-context-strip">
    <span>${n?"Create a rocky planet to begin.":e.sourceMode==="manual"?"Authored population scenario":"Reads from Planets"}</span>
    <span role="status">${I(o||a?.reason||a?.display?.currentPopulation||"")}</span>
    <details id="populationContextDisclosure"><summary>Source and assumptions</summary>
      <p>Inferred mode reads radius, climate and hydrosphere from Planets. Complete manual scenarios use four authored land-use fractions. Population assumptions change only this settlement model.</p>
      <p>The 77% crop share and fourfold crop efficiency are scenario assumptions, not Earth or FAO calibration.</p>
      <a href="#/planet">Edit planet</a> \xB7 <a href="#/climate">Open Climate</a>
    </details>
  </div>`}function he(e,a){return`<div id="populationObjectSelector" class="population-selector"><label for="popPlanetSelect">Planet</label>
    <select id="popPlanetSelect">${Xe(e,a).map(o=>`<option value="${I(o.value)}" ${o.selected?"selected":""}>${I(o.label)}</option>`).join("")}</select></div>`}function Je(e,a){return`
      <div class="page page--population">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Population</h1></div>
          <div class="panel__body">
            ${ve({selected:a,empty:!0})}
            ${se(ce({id:"populationEmptyState",title:"No compatible rocky planet",body:"Population needs a rocky planet before it can read climate, hydrosphere, and surface-area context.",actions:[{label:"Create a planet",href:"#/planet"}]}))}
            ${e.length?he(e,a):""}
          </div>
        </div>
      </div>`}function yt(e){let a=te(),o=ae(a);if(!o.length){e.innerHTML=Je(o,null);return}let n=a.population||{},t={sourceMode:n.sourceMode==="manual"?"manual":"auto",techEra:n.techEra||"Medieval",initialPopulation:n.initialPopulation??1e3,growthRate:n.growthRate??null,timeElapsedYears:n.timeElapsedYears??500,continentCount:n.continentCount||6,regionCount:n.regionCount||10,zipfExponent:n.zipfExponent??1,oceanPctOverride:n.oceanPctOverride??null,habitablePctOverride:n.habitablePctOverride??null,productivePctOverride:n.productivePctOverride??null,cropPctOverride:n.cropPctOverride??null};function i(){ge({population:{...t}})}function v(){return`<div class="population-source">
      <label for="popSourceMode">Land-use source</label>
      <select id="popSourceMode"><option value="auto" ${t.sourceMode==="auto"?"selected":""}>Inferred planet climate</option><option value="manual" ${t.sourceMode==="manual"?"selected":""}>Authored population scenario</option></select>
      ${t.sourceMode==="manual"?`<p class="hint">All four fractions are explicit assumptions. Inferred climate and productivity are not used.</p>${[["oceanPctOverride","Ocean coverage"],["habitablePctOverride","Habitable land"],["productivePctOverride","Productive habitable land"],["cropPctOverride","Crop share of productive land"]].map(([l,x])=>`<div class="form-row"><label for="popManual-${l}">${x} %</label><input id="popManual-${l}" data-pop-manual="${l}" type="number" min="0" max="100" required value="${I(String(t[l]??""))}"></div>`).join("")}`:""}
    </div>`}function p(){e.querySelector("#popSourceMode")?.addEventListener("change",l=>{t.sourceMode=l.target.value,i(),u()});for(let l of e.querySelectorAll("[data-pop-manual]"))l.addEventListener("change",()=>{t[l.dataset.popManual]=l.value===""?null:Number(l.value),i(),u()})}function u(){let l=te(),x=ae(l),A=oe(l),E=We(l),T=ue({...E,...t}),C=E.unsupportedSurfaceMessage||(T.status==="unavailable"?T.reason:""),M=E.limitedSurfaceMessage||"",c=C?null:Le({...E,...t});if(C){e.innerHTML=`
      <div class="page page--population">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${h(f.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${ve({selected:A,state:t,unsupportedMessage:C})}
            ${he(x,A,C)}
            ${v()}
            <div role="status" aria-live="polite">${I(C)}</div>
            ${se(ce({id:"populationUnsupportedState",title:"No compatible population output",body:C,actions:[{label:"Change inputs on Planets",href:"#/planet"}]}))}
          </div>
        </div>
      </div>`,le(e),p();let w=e.querySelector("#popPlanetSelect");w&&w.addEventListener("change",()=>{ie(w.value),u()});return}let k=pe.map(w=>`<option value="${I(w)}"${w===t.techEra?" selected":""}>${I(w)}</option>`).join(""),s=w=>w?'<span class="pop-auto-badge">auto</span>':"";e.innerHTML=`
      <div class="page page--population">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${h(f.Population)}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${ve({selected:A,state:t,model:c})}
            ${he(x,A)}

            ${M?`<div class="derived-readout">${I(M)}</div>`:""}

            <section class="kpi-section" id="populationSummary">
              <div class="kpi-section__header"><h3 class="kpi-section__title">Summary</h3></div>
              <div class="kpi-grid">
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Population ${h(f["Current Population"])}</div>
                  <div class="kpi__value">${I(c.display.currentPopulation)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Carrying Capacity ${h(f["Carrying Capacity"])}</div>
                  <div class="kpi__value">${I(c.display.carryingCapacity)}</div>
                </div></div>
              </div>
              <details class="population-secondary-summary"><summary>Density and saturation</summary><div class="kpi-grid">
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Saturation ${h(f.Saturation)}</div>
                  <div class="kpi__value">${I(c.display.saturation)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Habitable Density ${h(f["Habitable Density"])}</div>
                  <div class="kpi__value">${I(c.display.habitableDensity)}</div>
                </div></div>
              </div></details>
            </section>

            <div class="grid-2" style="margin-top:12px">
              <div class="subsection">
                <h3>Land Use ${h(f["Land Use Cascade"])}</h3>

                <div class="form-row">
                  <label>Ocean % ${s(c.inputs.oceanIsAuto)} ${h(f["Ocean Coverage"])}</label>
                  <input type="range" id="popOcean" min="0" max="100" step="1"
                    value="${c.inputs.oceanPct}">
                  <span class="derived-readout">${d(c.inputs.oceanPct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Habitable % ${s(c.inputs.habitableIsAuto)} ${h(f.Habitability)}</label>
                  <input type="range" id="popHabitable" min="0" max="100" step="1"
                    value="${c.inputs.habitablePct}">
                  <span class="derived-readout">${d(c.inputs.habitablePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Productive % ${s(c.inputs.productiveIsAuto)} ${h(f.Productivity)}</label>
                  <input type="range" id="popProductive" min="0" max="100" step="1"
                    value="${c.inputs.productivePct}">
                  <span class="derived-readout">${d(c.inputs.productivePct,0)}%</span>
                </div>

                <div class="form-row">
                  <label>Crop % ${h(f["Crop Fraction"])}</label>
                  <input type="range" id="popCrop" min="0" max="100" step="1"
                    value="${c.inputs.cropPct}">
                  <span class="derived-readout">${d(c.inputs.cropPct,0)}%</span>
                </div>

                <button id="popResetAuto" class="btn btn--sm" style="margin-top:4px">Reset to auto</button>

                <canvas id="popCascadeCanvas" class="pop-cascade-canvas"></canvas>

                ${re([{labelHtml:`Surface Area ${h(f["Surface Area"])}`,value:c.display.surfaceArea},{labelHtml:`Land Area ${h(f["Land Area"])}`,value:c.display.landArea},{labelHtml:`Habitable Area ${h(f["Habitable Area"])}`,value:c.display.habitableArea},{labelHtml:`Productive Area ${h(f["Productive Area"])}`,value:c.display.productiveArea}])}
              </div>

              <div class="subsection">
                <h3>Growth Model ${h(f["Growth Curve"])}</h3>

                <div class="form-row">
                  <label for="popTechEra">Tech Era ${h(f["Technology Era"])}</label>
                  <select id="popTechEra">${k}</select>
                </div>

                <div class="form-row">
                  <label>Initial Population ${h(f["Initial Population"])}</label>
                  <input type="number" id="popInitPop" min="0" step="1"
                    value="${t.initialPopulation}">
                </div>

                <div class="form-row">
                  <label>Growth Rate ${h(f["Growth Rate"])}</label>
                  <input type="range" id="popGrowthRate" min="0" max="0.05" step="0.001"
                    value="${c.inputs.growthRate}">
                  <span class="derived-readout">${I(c.display.growthRate)}</span>
                </div>

                <div class="form-row">
                  <label>Time Elapsed (years) ${h(f["Time Elapsed"])}</label>
                  <input type="number" id="popTime" min="0" step="10"
                    value="${t.timeElapsedYears}">
                </div>

                <canvas id="popGrowthCanvas" class="pop-growth-canvas"></canvas>

                ${re([{labelHtml:`Low-density Doubling Time ${h(f["Doubling Time"])}`,value:c.display.doublingTime},{labelHtml:`Overall Density ${h(f["Overall Density"])}`,value:c.display.overallDensity}])}
              </div>
            </div>

            <div class="subsection" style="margin-top:12px">
              <h3>Distribution ${h(f["Zipf Exponent"])}</h3>

              <div class="grid-2">
                <div class="form-row">
                  <label>Continents ${h(f.Continents)}</label>
                  <input type="number" id="popContCount" min="1" max="20" step="1"
                    value="${t.continentCount}">
                </div>
                <div class="form-row">
                  <label>Regions per Continent ${h(f["Regions per Continent"])}</label>
                  <input type="number" id="popRegCount" min="1" max="50" step="1"
                    value="${t.regionCount}">
                </div>
              </div>

              <div class="form-row">
                <label>Zipf Exponent (q) ${h(f["Zipf Exponent"])}</label>
                <input type="range" id="popZipf" min="0.5" max="1.5" step="0.05"
                  value="${t.zipfExponent}">
                <span class="derived-readout">${d(t.zipfExponent,2)}</span>
              </div>

              <div class="pop-dist-list">
                ${c.population.continents.map(w=>`
                  <details class="pop-dist-card">
                    <summary class="pop-dist-summary">
                      <span class="pop-dist-rank">Continent ${w.rank}</span>
                      <span class="pop-dist-pop">${de(w.population)}</span>
                      <span class="pop-dist-frac">${d(w.fraction*100,1)}%</span>
                      <span class="pop-dist-bar-wrap">
                        <span class="pop-dist-bar" style="width:${(w.fraction*100).toFixed(1)}%"></span>
                      </span>
                    </summary>
                    <div class="pop-dist-regions">
                      <table class="pop-dist-table">
                        <thead><tr><th>Region</th><th>Population</th><th>%</th><th></th></tr></thead>
                        <tbody>
                          ${w.subregions.map(q=>`
                            <tr>
                              <td>${q.rank}</td>
                              <td>${de(q.population)}</td>
                              <td>${d(q.fraction*100,1)}%</td>
                              <td><span class="pop-dist-bar" style="width:${(q.fraction*100).toFixed(1)}%"></span></td>
                            </tr>`).join("")}
                        </tbody>
                      </table>
                    </div>
                  </details>`).join("")}
              </div>
            </div>

          </div>
        </div>
      </div>`,le(e),e.querySelector("#populationObjectSelector").insertAdjacentHTML("afterend",v()),p(),Se(e),requestAnimationFrame(()=>{let w=e.querySelector("#popGrowthCanvas");w&&Ye(w,c.population.timeSeries,c.population.K,c.inputs.timeElapsedYears);let q=e.querySelector("#popCascadeCanvas");q&&Ze(q,c)});let g=e.querySelector("#popPlanetSelect");g&&g.addEventListener("change",()=>{ie(g.value),u()});let $=e.querySelector("#popTechEra");$&&$.addEventListener("change",()=>{t.techEra=$.value,t.growthRate=null,i(),u()});let L=e.querySelector("#popInitPop");L&&L.addEventListener("change",()=>{t.initialPopulation=L.value===""?null:Number(L.value),i(),u()});let R=e.querySelector("#popGrowthRate");R&&R.addEventListener("input",()=>{t.growthRate=Number(R.value),i(),u()});let G=e.querySelector("#popTime");G&&G.addEventListener("change",()=>{t.timeElapsedYears=G.value===""?null:Number(G.value),i(),u()});let K=e.querySelector("#popOcean");K&&K.addEventListener("input",()=>{t.oceanPctOverride=Number(K.value),i(),u()});let D=e.querySelector("#popHabitable");D&&D.addEventListener("input",()=>{t.habitablePctOverride=Number(D.value),i(),u()});let W=e.querySelector("#popProductive");W&&W.addEventListener("input",()=>{t.productivePctOverride=Number(W.value),i(),u()});let Y=e.querySelector("#popCrop");Y&&Y.addEventListener("input",()=>{t.cropPctOverride=Number(Y.value),i(),u()});let Z=e.querySelector("#popResetAuto");Z&&Z.addEventListener("click",()=>{t.sourceMode="auto",t.oceanPctOverride=null,t.habitablePctOverride=null,t.productivePctOverride=null,t.cropPctOverride=null,i(),u()});let j=e.querySelector("#popContCount");j&&j.addEventListener("change",()=>{t.continentCount=Math.max(1,Math.min(20,Number(j.value)||6)),i(),u()});let U=e.querySelector("#popRegCount");U&&U.addEventListener("change",()=>{t.regionCount=Math.max(1,Math.min(50,Number(U.value)||10)),i(),u()});let z=e.querySelector("#popZipf");z&&z.addEventListener("input",()=>{t.zipfExponent=Number(z.value),i(),u()})}u();let y=document.createElement("div");document.body.appendChild(y);let m=xe({steps:Be,storageKey:"worldsmith.pop.tutorial",container:y});e.addEventListener("click",l=>{l.target.closest("#popTutorials")&&m?.toggle()});let r=new MutationObserver(()=>{e.isConnected||(m?.destroy(),y.remove(),r.disconnect())});r.observe(e.parentNode||document.body,{childList:!0})}export{yt as initPopulationPage};
