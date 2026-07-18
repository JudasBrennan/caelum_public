import{a as N,b as Z}from"./chunk-M5WOH54N.js";import{a as je}from"./chunk-74UAHGLV.js";import"./chunk-AQMEZ2LS.js";import"./chunk-YZYZEETI.js";import{a as U}from"./chunk-T34JJ5JY.js";import"./chunk-Q4W4SK6X.js";import"./chunk-T3FNRHH6.js";import{a as $}from"./chunk-EHRPTLYW.js";import{a as g,b as I,d as we,e as q,f as xe}from"./chunk-EHZCB5HO.js";import{a as he}from"./chunk-EZA3XW5K.js";import"./chunk-7EO5RNQ6.js";import{b as o,c as O}from"./chunk-TR2TDQN3.js";import{Bb as Ce,Cb as P,Db as ie,Eb as oe,Fb as z,Gb as F,Oa as ge,Wa as Se,a as se,b as ye,c as ae,na as fe,oa as ne,pa as ve}from"./chunk-YJMCOWCP.js";import"./chunk-ZCN5A4VI.js";import"./chunk-EWEM4J4F.js";import"./chunk-7JKY7PUM.js";import"./chunk-VIGVCDXU.js";import"./chunk-XN2IBEAK.js";import"./chunk-HYNVHEYD.js";import"./chunk-CH7OG2WY.js";import"./chunk-LHEZNGZ5.js";import{U as be}from"./chunk-JVKPTJKR.js";import"./chunk-Q3EXAOWE.js";import"./chunk-ASLSWSPR.js";import"./chunk-MTXM7GCO.js";import"./chunk-JVOZJUGE.js";import{A as f,w as _}from"./chunk-JAT3QFT3.js";import"./chunk-6DA3R6ZF.js";import"./chunk-RC2KHOII.js";import"./chunk-FFUDGKDT.js";function Pe(t){return t?o("span",{className:"tip-icon",attrs:{tabindex:"0",role:"note","aria-label":"Info"},dataset:{tip:t},text:"i"}):null}function ze(t){return o("div",{className:"kpi-wrap"},[o("div",{className:"kpi"},[o("div",{className:"kpi__label"},[t.label," ",Pe(t.tip)]),o("div",{className:"kpi__value",text:t.value??""}),o("div",{className:"kpi__meta",text:t.meta??""})])])}function Me(t,a=[]){return O(t,(a||[]).map(e=>ze(e)))}function Fe(t={}){let a=String(t.tone||"neutral").replace(/[^a-z0-9_-]/gi,"")||"neutral";return o("div",{className:`cluster-hazard-signal cluster-hazard-signal--${a}`},[o("div",{className:"cluster-hazard-signal__label",text:t.label||""}),o("div",{className:"cluster-hazard-signal__value",text:t.value||""}),t.meta?o("div",{className:"cluster-hazard-signal__meta",text:t.meta}):null])}function Re(t,a=[]){return O(t,[o("div",{className:"cluster-hazard-signals__header"},[o("div",{},[o("div",{className:"cluster-hazard-signals__title",text:"Hazard Signals"}),o("div",{className:"cluster-hazard-signals__body",text:"A quick external-risk preview from this Local Cluster. Open the hazard model for the full read."})]),o("a",{className:"cluster-hazard-signals__action",attrs:{href:"#/neighbourhood-hazards"},text:"Open Hazard Model"})]),o("div",{className:"cluster-hazard-signals__grid"},(Array.isArray(a)?a:[]).map(e=>Fe(e)))])}function Ee(t,a=[],e={}){return O(t,(a||[]).map(u=>{let d=N(u.objectClassKey??u.spectralClass),c=Z(d),s=Math.max(0,u.count+(e[u.objectClassKey]||0)),r=s>0;return o("tr",{},[o("td",{},[o("span",{className:"cluster-object-cell"},[o("img",{className:"cluster-object-icon",attrs:{src:c.icon,alt:"","aria-hidden":"true"}}),o("span",{text:u.label})])]),o("td",{text:u.spectralClass}),o("td",{className:"cluster-adjust-cell"},[o("button",{className:"cluster-adjust-btn",attrs:{"data-class":u.objectClassKey,"data-action":"add",title:`Add ${u.label}`},text:"+"}),o("button",{className:"cluster-adjust-btn",attrs:{"data-class":u.objectClassKey,"data-action":"remove",title:`Remove ${u.label}`,disabled:r?null:"disabled"},text:"\u2212"})]),o("td",{text:f(s,0)})])}))}function Ne(t,a=[],{homeDefaultName:e,resolveSystemDisplayName:u,formatSystemLabel:d,formatLy:c,fmtFeH:s}){return O(t,(a||[]).map(r=>{let v=N(r.objectClassKey,{isHome:r.isHome}),C=Z(v,{isHome:r.isHome}),x=d(r),L=u(r,e);return o("tr",{dataset:{systemId:r.id}},[o("td",{},[o("span",{className:"cluster-object-cell"},[o("img",{className:"cluster-object-icon",attrs:{src:C.icon,alt:"","aria-hidden":"true"}}),o("span",{className:"cluster-object-tag",text:x})])]),o("td",{},[o("input",{className:"cluster-name-input",attrs:{type:"text",maxlength:"80",value:L,placeholder:r.name||"Star System","aria-label":`System name for ${r.id}`,"data-tip":"Editable display name for this generated system. This only changes the label shown in the Local Cluster table and visualiser."},dataset:{systemId:r.id}})]),o("td",{text:f(r.x,2)}),o("td",{text:f(r.y,2)}),o("td",{text:f(r.z,2)}),o("td",{text:c(r.distanceLy,2)}),o("td",{text:s(r.metallicityFeH)}),o("td",{text:`${f(be(r.metallicityFeH)*100,1)}%`})])}))}function Le({action:t,systemId:a,classKey:e=null,compIndex:u=null,label:d,visual:c,danger:s=!1}){return o("div",{className:`cluster-context-menu__item${s?" danger":""}`,dataset:{action:t,systemId:a,class:e,compIndex:u}},[o("img",{className:"cluster-object-icon",attrs:{src:c.icon,alt:"","aria-hidden":"true"}}),d])}function He(t,{systemId:a,components:e=[],companionClasses:u=[]}){let d=[],c=e.length;if(c<4){d.push(o("div",{className:"cluster-context-menu__sep"}));for(let s of u){let r=Z(N(s.key));d.push(Le({action:"add-companion",systemId:a,classKey:s.key,label:`Add ${s.label}`,visual:r}))}}if(c>1){d.push(o("div",{className:"cluster-context-menu__sep"}));for(let s=1;s<e.length;s++){let r=e[s],v=N(r.objectClassKey),C=Z(v),x=v==="LTY"?"L/T/Y":v;d.push(Le({action:"remove-companion",systemId:a,compIndex:s,label:`Remove ${x} companion`,visual:C,danger:!0}))}}return d.length||d.push(o("div",{className:"cluster-context-menu__item",attrs:{style:"opacity:0.5;cursor:default"},text:"No actions available"})),O(t,d)}var m={"Galactic Radius":"Radius of the galaxy in light-years. The Galactic Habitable Zone (GHZ) scales from this value (47%\u201360% of radius).",Location:"Galactocentric distance of the local neighbourhood in light-years.","Neighbourhood Radius":"Radius of the local stellar neighbourhood sphere in light-years.","Stellar Density":`Total density of all stellar-mass objects per cubic light-year (stars + white dwarfs + brown dwarfs + other).

The default 0.004/ly^3 matches the HIPPARCOS-calibrated solar-neighbourhood stellar density (~0.14 stars/pc^3). All class fractions now sum to 100% of this value, so Total Stellar-Mass Objects \u2248 raw estimate.`,"Random Seed":`Integer seed for the Park-Miller PRNG used to place systems in 3-D space. The same seed always reproduces the same layout.

Each neighbour is placed at a random distance (uniform-in-volume cube-root sampling) and random spherical direction derived from the seed. For neighbourhood radii > 50 ly the z-axis is progressively compressed to approximate galactic disk geometry (thin-disk scale height ~300 pc).`,"Galactic Habitable Zone":`Hard-boundary Galactic Habitable Zone (GHZ): 0.47 \xD7 galactic radius (inner) to 0.60 \xD7 galactic radius (outer).

The GHZ Probability field below gives a more accurate continuous Gaussian estimate.

Reference: Lineweaver et al. (2004, Science 303, 59).`,"In Galactic Habitable Zone?":"Whether the selected galactocentric distance falls within the GHZ band (47%\u201360% of galactic radius). Hard boundary \u2014 see also GHZ Probability for a continuous estimate.","GHZ Probability":`Probability-based GHZ score (0\u20131) using a Gaussian model centred at 53% of galactic radius (\u03C3 = 10% \xD7 R).

A score of 1.0 indicates optimal habitability; scores fall off smoothly toward the core (high supernova rate, tidal disruption) and outer disc (low metallicity, fewer rocky planets).

Reference: Lineweaver et al. (2004, Science 303, 59).`,"Neighbourhood Volume":"Spherical volume of the local neighbourhood: V = (4/3) \xD7 \u03C0 \xD7 r\xB3. Used as the basis for stellar-mass object count estimates.","Estimated Stellar-Mass Objects":`Raw estimate before class breakdown: stellar density \xD7 neighbourhood volume.

Class fractions sum to 100% of this figure (MS 72% + WD 6% + BD 19% + Other 3%), so Total Stellar-Mass Objects \u2248 this value (\xB1rounding).`,"Main Sequence Total":`Rounded sum of O/B/A/F/G/K/M stars, each class computed as round(raw \xD7 0.72 \xD7 fraction).

The 0.72 factor allocates 72% of total objects to main-sequence stars, matching the solar-neighbourhood census (Reyl\xE9 et al. 2021; RECONS within 10 pc). Relative class fractions follow the Kroupa/Chabrier initial mass function (IMF). The O-type fraction (3 \xD7 10^\u22127) gives essentially 0 O stars for any neighbourhood under ~500 ly.`,"Total Stellar-Mass Objects":`Rounded sum of all stellar-mass object classes (MS + WD + BD + Other).

Fractions applied: MS 72%, WD 6%, BD 19%, Other 3% \u2014 these sum to 100% of the raw estimate. Sources: Reyl\xE9 et al. (2021) for BD fraction; typical WD fraction ~5\u20138% for field stars; RECONS for class breakdown.`,"Total Star Systems":`Estimated count of gravitationally bound systems derived from the stellar-mass object total using mass-weighted multiplicity fractions.

Multiplicity rates are class-dependent: M dwarfs (~72% of MS) have ~27% binary fraction; FGK stars ~46%; O/B stars ~50\u201370%. This gives ~1.3\u20131.4 stars/system for a typical solar neighbourhood. Companion classes are constrained to be no more massive than their primary.

References: Duch\xEAne & Kraus (2013, ARA&A 51, 269); Raghavan et al. (2010, ApJS 190, 1).`,"Class breakdown":"Class counts use population fractions (MS 72%, WD 6%, BD 19%, Other 3%). Each generated system is randomly assigned an object class from the same weighted distribution, and companion classes are drawn from a filtered set that excludes classes heavier than the primary.","System Coordinates":`Home star system is fixed at (0, 0, 0). Neighbour positions are generated with a Park-Miller PRNG seeded from the Random Seed input.

Distances use cube-root sampling (uniform in volume inside the sphere). Directions use spherical-coordinate sampling. For radii > 50 ly, the z-axis is compressed by a disk factor (1 \u2212 (r\u221250)/1000, floored at 0.15) to approximate Milky Way thin-disk geometry.`,"System Name":"Editable name override for this generated star system. Leave blank to use the default generated name.","[Fe/H]":`Iron abundance relative to the Sun on a logarithmic scale. [Fe/H] = 0 is solar; +0.3 means twice solar iron; -1.0 means one-tenth.

Generated from galactic position (radial gradient -0.06 dex/kpc, vertical gradient -0.30 dex/kpc) plus Gaussian scatter (sigma 0.20 dex). The home system uses the value set on the Star page.

References: Nordstrom et al. (2004); Luck & Lambert (2011); Schlesinger et al. (2014).`,"P(giant)":`Estimated probability of hosting at least one giant planet (> 0.3 Mjup), based on the Fischer & Valenti (2005) metallicity-planet correlation with Kepler-era baseline: P = 0.07 * M * 10^(2*[Fe/H]), clamped to 0\u2013100%. Assumes 1 Msol in cluster view (mass dependence not applied).

Metal-rich stars are far more likely to host gas giants; at [Fe/H] = +0.3 the probability is ~28%.`,Type:"Broad stellar-object family used in the local-cluster census table, such as main-sequence star, white dwarf, brown dwarf, or other compact remnant bucket.",Class:`Spectral or object-class breakdown used for the generated local neighbourhood.

For main-sequence stars this is the familiar O/B/A/F/G/K/M sequence; white dwarfs, brown dwarfs, and other objects are grouped into their own census classes.`,Count:"Rounded number of generated objects or systems in the current row after any manual cluster adjustments are applied.",Object:"Rendered object marker or system tag used by the table and visualiser to identify the current row.","X (ly)":"Cartesian X coordinate of the generated system in light-years relative to the home star at (0, 0, 0).","Y (ly)":"Cartesian Y coordinate of the generated system in light-years relative to the home star at (0, 0, 0).","Z (ly)":`Cartesian Z coordinate of the generated system in light-years relative to the home star at (0, 0, 0).

For large neighbourhoods the generator compresses Z to approximate Milky Way thin-disk geometry.`,"Distance (ly)":"Straight-line distance from the home system to this generated neighbour, in light-years.","Apply Cluster Changes":"Recompute the local-cluster model with the current galactic inputs and save the updated cluster settings.","Reset Cluster Defaults":"Restore the Local Cluster inputs to their default solar-neighbourhood values.","Randomise Seed":"Generate a new deterministic random seed for neighbour placement while keeping the current galactic settings.","Cluster Import Table":`Paste a tab-separated list of system name, coordinates, distance, and constituents to replace the current generated cluster.

The system at (0, 0, 0) is treated as the home star.`,"Import Cluster":"Parse the pasted tab-separated cluster table and replace the current neighbourhood with the imported systems."};Object.assign(m,{"Stellar Density":q({overview:"Total density of all stellar-mass objects per cubic light-year, including stars, white dwarfs, brown dwarfs, and other compact/remnant buckets.",feedsInto:"Neighbourhood object counts, generated systems, class breakdowns, and local-cluster visual density.",interpretAs:"The default 0.004/ly^3 matches the HIPPARCOS-calibrated solar-neighbourhood stellar density of about 0.14 stars/pc^3.",caveat:"Class fractions sum to 100% of this value, so Total Stellar-Mass Objects approximately matches the raw estimate apart from rounding.",references:"See Science & Maths: local stellar neighbourhood."}),"Random Seed":q({overview:"Integer seed for the deterministic PRNG used to place generated systems in 3-D space.",feedsInto:"Neighbour coordinates, distance ordering, cluster table rows, and visualizer cluster layout.",interpretAs:"The same seed and inputs always reproduce the same local neighbourhood.",caveat:"Generated neighbours use statistical placement, not a catalogue lookup. For radii above 50 ly, Z is compressed to approximate thin-disk geometry.",references:"See Science & Maths: local cluster generation."}),"GHZ Probability":q({overview:"Probability-style Galactic Habitable Zone score from 0 to 1.",drawnFrom:"A Gaussian model centred at 53% of galactic radius with sigma at 10% of radius.",interpretAs:"Scores fall toward the core due to higher disruption/supernova pressure and toward the outer disk due to lower metallicity and fewer rocky planets.",caveat:"This is a broad galactic context score, not a guarantee that individual systems are habitable.",references:"Lineweaver et al. 2004; see Science & Maths: Galactic Habitable Zone."}),"Cluster Import Table":q({overview:"Paste a tab-separated list of system name, coordinates, distance, and constituents.",changes:"Imported rows replace the generated cluster with authored neighbour systems.",interpretAs:"The system at (0, 0, 0) is treated as the home star.",caveat:"Importing cluster rows changes the local neighbourhood view, not the main saved planets/moons."})});function $e(t,a=2){return`${f(t,a)} ly`}function qe(t){let a=Number(t);return Number.isFinite(a)?(a>0?"+":"")+f(a,2):"\u2014"}function Ze(t,a){let e=Number(t);return Number.isFinite(e)?Math.round(e):a}function Te(t){return String(t??"").replace(/\s+/g," ").trim().slice(0,80)}var Be=["single","binary","triple","quadruple"];function B(t){return Be[_(t,1,4)-1]}var Ye=[{key:"O",label:"O-type star"},{key:"B",label:"B-type star"},{key:"A",label:"A-type star"},{key:"F",label:"F-type star"},{key:"G",label:"G-type star"},{key:"K",label:"K-type star"},{key:"M",label:"M-type star"},{key:"D",label:"White Dwarf"},{key:"LTY",label:"Brown Dwarf"},{key:"OTHER",label:"Other"}];function We(t){let a=t.trim().toUpperCase();if(/^[LTY]/.test(a))return"LTY";if(/^D/.test(a))return"D";let e=a.match(/^([OBAFGKM])/);return e?e[1]:"OTHER"}function Ve(t){let a=t.trim().split(/\r?\n/).filter(c=>c.trim());if(a.length===0)return[];let e=/system name|coordinates|constituents/i.test(a[0])?1:0,u=[],d=Date.now();for(let c=e;c<a.length;c++){let s=a[c].split("	");if(s.length<4)continue;let r=s[0].trim(),v=s[1].match(/\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);if(!v)continue;let C=parseFloat(v[1]),x=parseFloat(v[2]),L=parseFloat(v[3]);if(!Number.isFinite(C)||!Number.isFinite(x)||!Number.isFinite(L))continue;let X=Math.hypot(C,x,L),k=C===0&&x===0&&L===0,J=s[3].trim().split(/,\s*(?:originally|formerly)/i)[0].trim().split(/\s*\+\s*/),A=k?[{objectClassKey:"HOME"}]:J.map(Y=>({objectClassKey:We(Y)}));u.push({id:k?"home":`imported-${d}-${c}`,name:r||`Star System ${c}`,index:c-e,isHome:k,objectClassKey:k?"HOME":A[0].objectClassKey,multiplicity:B(A.length),components:A,x:C,y:x,z:L,distanceLy:X})}return u}function Ue(t,a){let e=Math.random(),u=Math.random()*2*Math.PI,d=Math.acos(2*Math.random()-1),c=Math.cbrt(e)*t,s=c*Math.sin(d)*Math.cos(u),r=c*Math.sin(d)*Math.sin(u),v=c*Math.cos(d)*a;return{x:s,y:r,z:v,distanceLy:Math.hypot(s,r,v)}}function Xe(t,a){let e={};for(let d of a.addedSystems)for(let c of d.components||[])c.objectClassKey!=="HOME"&&(e[c.objectClassKey]=(e[c.objectClassKey]||0)+1);let u=new Set(a.removedSystemIds);for(let d of t.systems)if(u.has(d.id))for(let c of d.components||[])c.objectClassKey!=="HOME"&&(e[c.objectClassKey]=(e[c.objectClassKey]||0)-1);for(let[d,c]of Object.entries(a.componentOverrides)){let s=t.systems.find(r=>r.id===d);if(s){for(let r of s.components||[])r.objectClassKey!=="HOME"&&(e[r.objectClassKey]=(e[r.objectClassKey]||0)-1);for(let r of c.components||[])r.objectClassKey!=="HOME"&&(e[r.objectClassKey]=(e[r.objectClassKey]||0)+1)}}return e}function Je(t,a){let e=new Set(a.removedSystemIds),u=[];for(let d of t.systems){if(e.has(d.id))continue;let c=a.componentOverrides[d.id];c?u.push({...d,components:c.components,multiplicity:c.multiplicity}):u.push(d)}for(let d of a.addedSystems)u.push(d);return u}function re(t){if(!Array.isArray(t.components)||t.components.length<=1){let a=N(t.objectClassKey,{isHome:t.isHome});return a==="LTY"?"L/T/Y":a}return t.components.map(a=>{let e=N(a.objectClassKey);return e==="LTY"?"L/T/Y":e}).join(" + ")}var Qe=[{title:"Getting Started",body:"The Local Cluster page generates a procedural neighbourhood of nearby star systems. Your home star sits at the centre, surrounded by randomly placed neighbours that the Visualiser can display as a 3D cluster."},{title:"Seed and Radius",body:"Change the random seed to regenerate the cluster layout. Adjust the neighbourhood radius to control the volume of space sampled and the number of systems generated."},{title:"Editing Systems",body:"Click any system to rename it, adjust its position, or edit its metallicity. Each neighbour has a spectral class and giant-planet probability derived from its galactic position."},{title:"Galactic Context",body:"The Galactic Habitable Zone indicator shows whether your star\u2019s position favours Earth-like planet formation. Metallicity gradients and stellar density vary with galactic radius."},{title:"Hazard Signals",body:"The compact Hazard Signals strip previews external deep-time risks from the current neighbourhood. Open the hazard model when you want the supernova, flyby, comet-shower, and reservoir consequences."},{title:"Stellar Census",body:"The output panel breaks down the neighbourhood by spectral class, counting O, B, A, F, G, K, M stars, white dwarfs, and brown dwarfs. Binary and triple system rates are estimated."}];function Ct(t){let a=Ce(),e=ye(a),u=ie(),d=null,c=[],s=document.createElement("div");s.className="page",s.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--local-cluster" aria-hidden="true"></span><span>Local Cluster</span></h1>
        <button id="clusterTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        <div class="cluster-visualizer-callout" role="note" aria-label="Local cluster visualiser connection">
          <div>
            <div class="cluster-visualizer-callout__title">Feeds the 3D Visualiser</div>
            <div class="cluster-visualizer-callout__body">These coordinates and names become the nearby stars shown around your home system.</div>
          </div>
          <a class="cluster-visualizer-callout__action" href="#/cluster-viz">Open 3D Visualiser</a>
        </div>
        <div id="clusterHazardSignals" class="cluster-hazard-signals" role="note" aria-label="Local cluster hazard signals"></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">
          <div class="form-row">
            <div>
              <div class="label">Galactic Radius <span class="unit">ly</span> ${g(m["Galactic Radius"]||"")}</div>
              <div class="hint">Used to derive the Galactic Habitable Zone.</div>
            </div>
            <div class="input-pair">
              <input id="clusterGalacticRadius" type="number" min="1000" max="1000000" step="1" aria-label="Galactic Radius" />
              <input id="clusterGalacticRadiusSlider" type="range" aria-label="Galactic Radius slider" />
              <div class="range-meta"><span>1,000</span><span>1,000,000</span></div>
            </div>
          </div>

          <div class="form-row">
            <div>
              <div class="label">Location <span class="unit">ly</span> ${g(m.Location||"")}</div>
              <div class="hint">Distance from galactic centre.</div>
            </div>
            <div class="input-pair">
              <input id="clusterLocation" type="number" min="0" max="1000000" step="1" aria-label="Location" />
              <input id="clusterLocationSlider" type="range" aria-label="Location slider" />
              <div class="range-meta"><span>0</span><span>1,000,000</span></div>
            </div>
          </div>

          <div class="form-row">
            <div>
              <div class="label">Neighbourhood Radius <span class="unit">ly</span> ${g(m["Neighbourhood Radius"]||"")}</div>
              <div class="hint">Local sphere radius used for counts and coordinates.</div>
            </div>
            <div class="input-pair">
              <input id="clusterRadius" type="number" min="0.1" max="25" step="0.1" aria-label="Neighbourhood Radius" />
              <input id="clusterRadiusSlider" type="range" aria-label="Neighbourhood Radius slider" />
              <div class="range-meta"><span>0.1</span><span>25</span></div>
            </div>
          </div>

          <div class="form-row">
            <div>
              <div class="label">Stellar Density <span class="unit">stars/ly^3</span> ${g(m["Stellar Density"]||"")}</div>
              <div class="hint">Density of stellar objects in the local neighbourhood.</div>
            </div>
            <div class="input-pair">
              <input id="clusterDensity" type="number" min="0.000001" max="0.1" step="0.000001" aria-label="Stellar Density" />
              <input id="clusterDensitySlider" type="range" aria-label="Stellar Density slider" />
              <div class="range-meta"><span>0.000001</span><span>0.1</span></div>
            </div>
          </div>

          <div class="form-row">
            <div>
              <div class="label">Random Seed ${g(m["Random Seed"]||"")}</div>
              <div class="hint">Integer seed (Park-Miller) for deterministic coordinates.</div>
            </div>
            <div>
              <input id="clusterSeed" type="number" min="1" max="2147483646" step="1" aria-label="Random Seed" />
              <button class="small" id="btnRandomSeed" type="button" title="Generate random seed" ${I(m["Randomise Seed"]||"")} style="margin-top:6px;width:100%">Randomise</button>
            </div>
          </div>

          <div class="button-row">
            <button class="primary" id="btnClusterApply" type="button" ${I(m["Apply Cluster Changes"]||"")}>Apply</button>
            <button id="btnClusterReset" type="button" ${I(m["Reset Cluster Defaults"]||"")}>Reset to Defaults</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Outputs</h2></div>
        <div class="panel__body">
          <div id="clusterKpis" class="kpi-grid"></div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Stellar Object Breakdown ${g(m["Class breakdown"]||"")}</h2></div>
      <div class="panel__body">
        <div class="hint">Class breakdown ${g(m["Class breakdown"]||"")}</div>
        <div class="cluster-table-wrap">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Type ${g(m.Type||"")}</th>
                <th>Class ${g(m.Class||"")}</th>
                <th></th>
                <th>Count ${g(m.Count||"")}</th>
              </tr>
            </thead>
            <tbody id="clusterObjectsBody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Import Cluster ${g(m["Import Cluster"]||"")}</h2></div>
      <div class="panel__body">
        <div class="hint">Paste a tab-separated table of star systems to replace the current cluster. The system at (0, 0, 0) is treated as the home star.</div>
        <textarea id="clusterImportText" rows="6" ${I(m["Cluster Import Table"]||"")} placeholder="System Name&#9;Coordinates (ly)&#9;Distance&#9;Constituents&#10;Home&#9;(0, 0, 0)&#9;0.00 ly&#9;GV&#10;S01&#9;(6.64, 22.03, 8.11)&#9;24.40 ly&#9;MV" style="width:100%;font-family:var(--mono);font-size:0.85rem;resize:vertical"></textarea>
        <div style="margin-top:8px">
          <button id="btnClusterImport" class="action-btn" ${I(m["Import Cluster"]||"")}>Import</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Star System Coordinates</h2></div>
      <div class="panel__body">
        <div class="hint">System Coordinates ${g(m["System Coordinates"]||"")}</div>
        <div class="cluster-table-wrap cluster-table-wrap--coords">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${g(m.Object||"")}</th>
                <th>Name ${g(m["System Name"]||"")}</th>
                <th>X (ly) ${g(m["X (ly)"]||"")}</th>
                <th>Y (ly) ${g(m["Y (ly)"]||"")}</th>
                <th>Z (ly) ${g(m["Z (ly)"]||"")}</th>
                <th>Distance (ly) ${g(m["Distance (ly)"]||"")}</th>
                <th>[Fe/H] ${g(m["[Fe/H]"])}</th>
                <th>P(giant) ${g(m["P(giant)"])}</th>
              </tr>
            </thead>
            <tbody id="clusterSystemsBody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="clusterContextMenu" class="cluster-context-menu" style="display:none">
      <div class="cluster-context-menu__title"></div>
      <div class="cluster-context-menu__items"></div>
    </div>
  `,t.appendChild(s),he(s),we(s),xe({steps:Qe,storageKey:"worldsmith.cluster.tutorial",container:s,triggerBtn:s.querySelector("#clusterTutorials")});let r=s.querySelector("#clusterGalacticRadius"),v=s.querySelector("#clusterLocation"),C=s.querySelector("#clusterRadius"),x=s.querySelector("#clusterDensity"),L=s.querySelector("#clusterSeed"),X=s.querySelector("#clusterGalacticRadiusSlider"),k=s.querySelector("#clusterLocationSlider"),le=s.querySelector("#clusterRadiusSlider"),ce=s.querySelector("#clusterDensitySlider"),J=s.querySelector("#clusterKpis"),A=s.querySelector("#clusterHazardSignals"),Y=s.querySelector("#clusterObjectsBody"),W=s.querySelector("#clusterSystemsBody");function de(n,l){let p=Te(u?.[n.id]);return p||(n.isHome?l:n.name)}$({numberEl:r,sliderEl:X,min:1e3,max:1e6,step:1,mode:"auto"}),$({numberEl:v,sliderEl:k,min:0,max:1e6,step:1,mode:"auto"}),$({numberEl:C,sliderEl:le,min:.1,max:25,step:.1,mode:"auto"}),$({numberEl:x,sliderEl:ce,min:1e-6,max:.1,step:1e-6,mode:"auto"});function ue(){r.value=String(e.galacticRadiusLy),v.value=String(e.locationLy),C.value=String(e.neighbourhoodRadiusLy),x.value=String(e.stellarDensityPerLy3),L.value=String(e.randomSeed),r.dispatchEvent(new Event("input",{bubbles:!0})),v.dispatchEvent(new Event("input",{bubbles:!0})),C.dispatchEvent(new Event("input",{bubbles:!0})),x.dispatchEvent(new Event("input",{bubbles:!0}))}function me(){let n=_(Number(r.value),1e3,1e6),l=_(Number(v.value),0,n),p=_(Number(C.value),.1,25),h=_(Number(x.value),1e-6,.1),i=_(Ze(L.value,se.randomSeed),1,2147483646);e.galacticRadiusLy=n,e.locationLy=l,e.neighbourhoodRadiusLy=p,e.stellarDensityPerLy3=h,e.randomSeed=i,r.value=String(e.galacticRadiusLy),v.value=String(e.locationLy),C.value=String(e.neighbourhoodRadiusLy),x.value=String(e.stellarDensityPerLy3),L.value=String(e.randomSeed),r.dispatchEvent(new Event("input",{bubbles:!0})),v.dispatchEvent(new Event("input",{bubbles:!0})),C.dispatchEvent(new Event("input",{bubbles:!0})),x.dispatchEvent(new Event("input",{bubbles:!0}))}function H(){u=ie();let n=ge(),l=Se(n),p=typeof l?.name=="string"&&l.name.trim()?l.name.trim():"home star system",h=l?.metallicityFeH??0,i=ae({...e,homeMetallicityFeH:h}),w=z(),S=Je(i,w),y=Xe(i,w);d=i,c=S;let b=[{label:"Galactic Habitable Zone",tip:m["Galactic Habitable Zone"],value:`${f(i.galacticHabitableZoneLy.inner,0)} - ${f(i.galacticHabitableZoneLy.outer,0)}`,meta:"ly"},{label:"In Galactic Habitable Zone?",tip:m["In Galactic Habitable Zone?"],value:i.inHabitableZone?"Yes":"No",meta:`Location ${f(i.inputs.locationLy,0)} ly`},{label:"GHZ Probability",tip:m["GHZ Probability"],value:`${f(i.ghzProbability*100,1)}%`,meta:"Lineweaver (2004) Gaussian model"},{label:"Neighbourhood Volume",tip:m["Neighbourhood Volume"],value:f(i.neighbourhoodVolumeLy3,2),meta:"ly^3"},{label:"Estimated Stellar-Mass Objects",tip:m["Estimated Stellar-Mass Objects"],value:f(i.rawStellarMassObjects,2),meta:"raw estimate"},{label:"Main Sequence Total",tip:m["Main Sequence Total"],value:f(i.mainSequenceTotal,0),meta:"O/B/A/F/G/K/M"},{label:"Total Stellar-Mass Objects",tip:m["Total Stellar-Mass Objects"],value:f(i.totalStellarMassObjects,0),meta:"rounded class sum"},{label:"Total Star Systems",tip:m["Total Star Systems"],value:f(i.systemCounts.total,0),meta:`${f(i.systemCounts.single,0)} single | ${f(i.systemCounts.binary,0)} binary | ${f(i.systemCounts.triple,0)} triple | ${f(i.systemCounts.quadruple,0)} quadruple`},{label:"Generated Neighbours",tip:m["System Coordinates"],value:f(i.systems.length-1,0),meta:i.systemsOmitted>0?`plus 1 home \u2014 ${f(i.systemsOmitted,0)} systems omitted (visualiser cap: 750)`:"plus 1 home system"}];Me(J,b);let R=je(n,{clusterInputs:e,localClusterModel:i,systems:S});Re(A,R.hazardSignals),Ee(Y,i.stellarRows,y),Ne(W,S,{homeDefaultName:p,resolveSystemDisplayName:de,formatSystemLabel:re,formatLy:$e,fmtFeH:qe})}function _e(){let n=z();return{addedSystemCount:Array.isArray(n?.addedSystems)?n.addedSystems.length:0,hiddenSystemCount:Array.isArray(n?.removedSystemIds)?n.removedSystemIds.length:0,modifiedSystemCount:n?.componentOverrides&&typeof n.componentOverrides=="object"?Object.keys(n.componentOverrides).length:0}}async function Q(n,l){let p=fe({actionLabel:n,finalConsequence:l,..._e()});return p?U(p):!0}function ee(){F({addedSystems:[],removedSystemIds:[],componentOverrides:{}})}async function pe(){await Q("Apply cluster changes","The cluster will regenerate from the current galactic inputs.")&&(me(),P(e),ee(),H())}async function ke(){await Q("Reset to defaults","All local-cluster inputs will reset to their default values.")&&(Object.assign(e,se),ue(),P(e),ee(),H())}s.querySelector("#btnClusterApply")?.addEventListener("click",pe),s.querySelector("#btnClusterReset")?.addEventListener("click",ke);let Oe=s.querySelector("#clusterImportText");s.querySelector("#btnClusterImport")?.addEventListener("click",()=>{let n=(Oe?.value||"").trim();if(!n)return;let l=Ve(n);if(l.length===0){alert("Could not parse any systems from the pasted text. Expected tab-separated columns: System Name, Coordinates (ly), Distance, Constituents.");return}let p=l.find(b=>b.isHome),h=l.filter(b=>!b.isHome),i=Math.max(...l.map(b=>b.distanceLy));i>e.neighbourhoodRadiusLy&&(e.neighbourhoodRadiusLy=Math.ceil(i+1),C.value=String(e.neighbourhoodRadiusLy),C.dispatchEvent(new Event("input",{bubbles:!0})),P(e));let S=ae(e).systems.filter(b=>!b.isHome).map(b=>b.id);F({addedSystems:h,removedSystemIds:S,componentOverrides:{}});let y={};p&&(y.home=p.name);for(let b of h)y[b.id]=b.name;oe(y),H()}),s.querySelector("#btnRandomSeed")?.addEventListener("click",async()=>{await Q("Randomise seed","The cluster will regenerate from a new random seed.")&&(L.value=String(1+Math.floor(Math.random()*2147483645)),me(),P(e),ee(),H())}),W?.addEventListener("change",n=>{let l=n.target?.closest?.(".cluster-name-input");if(!l)return;let p=String(l.dataset.systemId||"").trim();if(!p)return;let h=Te(l.value);h?u[p]=h:delete u[p],oe(u),l.value=h}),W?.addEventListener("keydown",n=>{let l=n.target?.closest?.(".cluster-name-input");l&&n.key==="Enter"&&(n.preventDefault(),l.blur())}),Y?.addEventListener("click",async n=>{let l=n.target?.closest?.(".cluster-adjust-btn");if(!l)return;let p=l.dataset.class,h=l.dataset.action;if(!p||!h)return;let i=z(),w=e.neighbourhoodRadiusLy>50?Math.max(.15,1-(e.neighbourhoodRadiusLy-50)/1e3):1;if(h==="add"){let S=Ue(e.neighbourhoodRadiusLy,w),y="added-"+Date.now()+"-"+Math.floor(Math.random()*1e4);i.addedSystems.push({id:y,name:"Star System (added)",index:(c.length||0)+1,isHome:!1,objectClassKey:p,multiplicity:"single",components:[{objectClassKey:p}],metallicityFeH:0,...S})}else if(h==="remove"){let S=l.closest("tr")?.querySelector("td")?.textContent?.trim()||String(p).trim(),y=et(i.addedSystems,j=>j.objectClassKey===p),b=y>=0?ne({classLabel:S,sourceKind:"manual"}):ne({classLabel:S,sourceKind:"generated"});if(!await U(b))return;if(y>=0)i.addedSystems.splice(y,1);else if(d){let j=new Set(i.removedSystemIds),K=d.systems.filter(V=>!V.isHome&&!j.has(V.id)&&V.objectClassKey===p);K.length>0&&i.removedSystemIds.push(K[K.length-1].id)}}F(i),H()});let M=s.querySelector("#clusterContextMenu"),Ie=M?.querySelector(".cluster-context-menu__title"),Ae=M?.querySelector(".cluster-context-menu__items");function te(){M&&(M.style.display="none")}function Ke(n,l,p){let h=c.find(j=>j.id===p);if(!h)return;let i=h.components||[{objectClassKey:h.objectClassKey}],w=re(h);Ie.textContent=w+" system",He(Ae,{systemId:p,components:i,companionClasses:Ye});let S=220,y=M.offsetHeight||200,b=window.innerWidth,R=window.innerHeight;M.style.left=Math.min(n,b-S-10)+"px",M.style.top=Math.min(l,R-y-10)+"px",M.style.display="block"}W?.addEventListener("contextmenu",n=>{let l=n.target?.closest?.("tr[data-system-id]");if(!l)return;n.preventDefault();let p=l.dataset.systemId;p&&Ke(n.clientX,n.clientY,p)}),M?.addEventListener("click",async n=>{let l=n.target?.closest?.(".cluster-context-menu__item");if(!l)return;let p=l.dataset.action,h=l.dataset.systemId;if(!p||!h)return;let i=z();if(p==="add-companion"){let w=l.dataset.class;if(!w)return;if(h.startsWith("added-")){let y=i.addedSystems.find(b=>b.id===h);y&&(y.components||[]).length<4&&(y.components.push({objectClassKey:w}),y.multiplicity=B(y.components.length))}else{let y=i.componentOverrides[h],b=d?.systems.find(j=>j.id===h),R=y?y.components:(b?.components||[]).map(j=>({...j}));if(R.length<4){let j=[...R,{objectClassKey:w}];i.componentOverrides[h]={components:j,multiplicity:B(j.length)}}}}else if(p==="remove-companion"){let w=Number(l.dataset.compIndex);if(!Number.isFinite(w)||w<1)return;let S=c.find(E=>E.id===h);if(!S)return;let y=Array.isArray(S?.components)?S.components:[{objectClassKey:S?.objectClassKey}],b=y[w],R=N(b?.objectClassKey),j=R==="LTY"?"L/T/Y":R,K=de(S,"Home")||re(S);if(!await U(ve({systemLabel:K,companionLabel:j,beforeComponentCount:y.length})))return;if(h.startsWith("added-")){let E=i.addedSystems.find(D=>D.id===h);E&&E.components.length>1&&(E.components.splice(w,1),E.multiplicity=B(E.components.length))}else{let E=i.componentOverrides[h],D=d?.systems.find(G=>G.id===h),T=E?[...E.components]:(D?.components||[]).map(G=>({...G}));T.length>1&&w<T.length&&(T.splice(w,1),T.length===(D?.components||[]).length&&T.every((G,De)=>G.objectClassKey===D.components[De]?.objectClassKey)?delete i.componentOverrides[h]:i.componentOverrides[h]={components:T,multiplicity:B(T.length)})}}F(i),te(),H()}),document.addEventListener("click",n=>{M&&!M.contains(n.target)&&te()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&te()}),[r,v,C,x,L].forEach(n=>{n?.addEventListener("keydown",l=>{l.key==="Enter"&&pe()})}),ue(),H()}function et(t,a){for(let e=t.length-1;e>=0;e--)if(a(t[e]))return e;return-1}export{Ct as initLocalClusterPage};
