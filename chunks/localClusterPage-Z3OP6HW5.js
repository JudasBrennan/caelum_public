import{a as E,b as z}from"./chunk-LVJGDVKF.js";import{a as Z}from"./chunk-WYZYYRUA.js";import{a as V}from"./chunk-NGCG2ZCM.js";import"./chunk-J2QGFXM6.js";import{a as g,b as _,d as Se,e as B,f as Ce}from"./chunk-LWUHUUMM.js";import"./chunk-5SEMLOPL.js";import{Ba as ve,V as ye,W as ae,X as be,a as te,b as pe,c as se,db as ge,eb as P,fb as ne,gb as ie,hb as F,ib as $,ta as fe}from"./chunk-RSAWJCQ5.js";import{b as u,c as q}from"./chunk-XMLMEZIZ.js";import"./chunk-GYK6DNNS.js";import"./chunk-6BSYNVSS.js";import"./chunk-MWW7VU5Q.js";import"./chunk-ETWCKWXP.js";import"./chunk-WNGVR2CK.js";import{Q as he}from"./chunk-TIXSLYXP.js";import{f as N,j as f}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function Ke(s){return s?u("span",{className:"tip-icon",attrs:{tabindex:"0",role:"note","aria-label":"Info"},dataset:{tip:s},text:"i"}):null}function _e(s){return u("div",{className:"kpi-wrap"},[u("div",{className:"kpi"},[u("div",{className:"kpi__label"},[s.label," ",Ke(s.tip)]),u("div",{className:"kpi__value",text:s.value??""}),u("div",{className:"kpi__meta",text:s.meta??""})])])}function je(s,n=[]){return q(s,(n||[]).map(e=>_e(e)))}function xe(s,n=[],e={}){return q(s,(n||[]).map(d=>{let c=E(d.objectClassKey??d.spectralClass),l=z(c),t=Math.max(0,d.count+(e[d.objectClassKey]||0)),i=t>0;return u("tr",{},[u("td",{},[u("span",{className:"cluster-object-cell"},[u("img",{className:"cluster-object-icon",attrs:{src:l.icon,alt:"","aria-hidden":"true"}}),u("span",{text:d.label})])]),u("td",{text:d.spectralClass}),u("td",{className:"cluster-adjust-cell"},[u("button",{className:"cluster-adjust-btn",attrs:{"data-class":d.objectClassKey,"data-action":"add",title:`Add ${d.label}`},text:"+"}),u("button",{className:"cluster-adjust-btn",attrs:{"data-class":d.objectClassKey,"data-action":"remove",title:`Remove ${d.label}`,disabled:i?null:"disabled"},text:"\u2212"})]),u("td",{text:f(t,0)})])}))}function Le(s,n=[],{homeDefaultName:e,resolveSystemDisplayName:d,formatSystemLabel:c,formatLy:l,fmtFeH:t}){return q(s,(n||[]).map(i=>{let v=E(i.objectClassKey,{isHome:i.isHome}),C=z(v,{isHome:i.isHome}),j=c(i),L=d(i,e);return u("tr",{dataset:{systemId:i.id}},[u("td",{},[u("span",{className:"cluster-object-cell"},[u("img",{className:"cluster-object-icon",attrs:{src:C.icon,alt:"","aria-hidden":"true"}}),u("span",{className:"cluster-object-tag",text:j})])]),u("td",{},[u("input",{className:"cluster-name-input",attrs:{type:"text",maxlength:"80",value:L,placeholder:i.name||"Star System","aria-label":`System name for ${i.id}`,"data-tip":"Editable display name for this generated system. This only changes the label shown in the Local Cluster table and visualiser."},dataset:{systemId:i.id}})]),u("td",{text:f(i.x,2)}),u("td",{text:f(i.y,2)}),u("td",{text:f(i.z,2)}),u("td",{text:l(i.distanceLy,2)}),u("td",{text:t(i.metallicityFeH)}),u("td",{text:`${f(he(i.metallicityFeH)*100,1)}%`})])}))}function we({action:s,systemId:n,classKey:e=null,compIndex:d=null,label:c,visual:l,danger:t=!1}){return u("div",{className:`cluster-context-menu__item${t?" danger":""}`,dataset:{action:s,systemId:n,class:e,compIndex:d}},[u("img",{className:"cluster-object-icon",attrs:{src:l.icon,alt:"","aria-hidden":"true"}}),c])}function Re(s,{systemId:n,components:e=[],companionClasses:d=[]}){let c=[],l=e.length;if(l<4){c.push(u("div",{className:"cluster-context-menu__sep"}));for(let t of d){let i=z(E(t.key));c.push(we({action:"add-companion",systemId:n,classKey:t.key,label:`Add ${t.label}`,visual:i}))}}if(l>1){c.push(u("div",{className:"cluster-context-menu__sep"}));for(let t=1;t<e.length;t++){let i=e[t],v=E(i.objectClassKey),C=z(v),j=v==="LTY"?"L/T/Y":v;c.push(we({action:"remove-companion",systemId:n,compIndex:t,label:`Remove ${j} companion`,visual:C,danger:!0}))}}return c.length||c.push(u("div",{className:"cluster-context-menu__item",attrs:{style:"opacity:0.5;cursor:default"},text:"No actions available"})),q(s,c)}var m={"Galactic Radius":"Radius of the galaxy in light-years. The Galactic Habitable Zone (GHZ) scales from this value (47%\u201360% of radius).",Location:"Galactocentric distance of the local neighbourhood in light-years.","Neighbourhood Radius":"Radius of the local stellar neighbourhood sphere in light-years.","Stellar Density":`Total density of all stellar-mass objects per cubic light-year (stars + white dwarfs + brown dwarfs + other).

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

The system at (0, 0, 0) is treated as the home star.`,"Import Cluster":"Parse the pasted tab-separated cluster table and replace the current neighbourhood with the imported systems."};Object.assign(m,{"Stellar Density":B({overview:"Total density of all stellar-mass objects per cubic light-year, including stars, white dwarfs, brown dwarfs, and other compact/remnant buckets.",feedsInto:"Neighbourhood object counts, generated systems, class breakdowns, and local-cluster visual density.",interpretAs:"The default 0.004/ly^3 matches the HIPPARCOS-calibrated solar-neighbourhood stellar density of about 0.14 stars/pc^3.",caveat:"Class fractions sum to 100% of this value, so Total Stellar-Mass Objects approximately matches the raw estimate apart from rounding.",references:"See Science & Maths: local stellar neighbourhood."}),"Random Seed":B({overview:"Integer seed for the deterministic PRNG used to place generated systems in 3-D space.",feedsInto:"Neighbour coordinates, distance ordering, cluster table rows, and visualizer cluster layout.",interpretAs:"The same seed and inputs always reproduce the same local neighbourhood.",caveat:"Generated neighbours use statistical placement, not a catalogue lookup. For radii above 50 ly, Z is compressed to approximate thin-disk geometry.",references:"See Science & Maths: local cluster generation."}),"GHZ Probability":B({overview:"Probability-style Galactic Habitable Zone score from 0 to 1.",drawnFrom:"A Gaussian model centred at 53% of galactic radius with sigma at 10% of radius.",interpretAs:"Scores fall toward the core due to higher disruption/supernova pressure and toward the outer disk due to lower metallicity and fewer rocky planets.",caveat:"This is a broad galactic context score, not a guarantee that individual systems are habitable.",references:"Lineweaver et al. 2004; see Science & Maths: Galactic Habitable Zone."}),"Cluster Import Table":B({overview:"Paste a tab-separated list of system name, coordinates, distance, and constituents.",changes:"Imported rows replace the generated cluster with authored neighbour systems.",interpretAs:"The system at (0, 0, 0) is treated as the home star.",caveat:"Importing cluster rows changes the local neighbourhood view, not the main saved planets/moons."})});function Ae(s,n=2){return`${f(s,n)} ly`}function De(s){let n=Number(s);return Number.isFinite(n)?(n>0?"+":"")+f(n,2):"\u2014"}function Ge(s,n){let e=Number(s);return Number.isFinite(e)?Math.round(e):n}function Me(s){return String(s??"").replace(/\s+/g," ").trim().slice(0,80)}var Pe=["single","binary","triple","quadruple"];function Y(s){return Pe[N(s,1,4)-1]}var Fe=[{key:"O",label:"O-type star"},{key:"B",label:"B-type star"},{key:"A",label:"A-type star"},{key:"F",label:"F-type star"},{key:"G",label:"G-type star"},{key:"K",label:"K-type star"},{key:"M",label:"M-type star"},{key:"D",label:"White Dwarf"},{key:"LTY",label:"Brown Dwarf"},{key:"OTHER",label:"Other"}];function $e(s){let n=s.trim().toUpperCase();if(/^[LTY]/.test(n))return"LTY";if(/^D/.test(n))return"D";let e=n.match(/^([OBAFGKM])/);return e?e[1]:"OTHER"}function qe(s){let n=s.trim().split(/\r?\n/).filter(l=>l.trim());if(n.length===0)return[];let e=/system name|coordinates|constituents/i.test(n[0])?1:0,d=[],c=Date.now();for(let l=e;l<n.length;l++){let t=n[l].split("	");if(t.length<4)continue;let i=t[0].trim(),v=t[1].match(/\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);if(!v)continue;let C=parseFloat(v[1]),j=parseFloat(v[2]),L=parseFloat(v[3]);if(!Number.isFinite(C)||!Number.isFinite(j)||!Number.isFinite(L))continue;let U=Math.hypot(C,j,L),H=C===0&&j===0&&L===0,X=t[3].trim().split(/,\s*(?:originally|formerly)/i)[0].trim().split(/\s*\+\s*/),I=H?[{objectClassKey:"HOME"}]:X.map(K=>({objectClassKey:$e(K)}));d.push({id:H?"home":`imported-${c}-${l}`,name:i||`Star System ${l}`,index:l-e,isHome:H,objectClassKey:H?"HOME":I[0].objectClassKey,multiplicity:Y(I.length),components:I,x:C,y:j,z:L,distanceLy:U})}return d}function Ze(s,n){let e=Math.random(),d=Math.random()*2*Math.PI,c=Math.acos(2*Math.random()-1),l=Math.cbrt(e)*s,t=l*Math.sin(c)*Math.cos(d),i=l*Math.sin(c)*Math.sin(d),v=l*Math.cos(c)*n;return{x:t,y:i,z:v,distanceLy:Math.hypot(t,i,v)}}function Be(s,n){let e={};for(let c of n.addedSystems)for(let l of c.components||[])l.objectClassKey!=="HOME"&&(e[l.objectClassKey]=(e[l.objectClassKey]||0)+1);let d=new Set(n.removedSystemIds);for(let c of s.systems)if(d.has(c.id))for(let l of c.components||[])l.objectClassKey!=="HOME"&&(e[l.objectClassKey]=(e[l.objectClassKey]||0)-1);for(let[c,l]of Object.entries(n.componentOverrides)){let t=s.systems.find(i=>i.id===c);if(t){for(let i of t.components||[])i.objectClassKey!=="HOME"&&(e[i.objectClassKey]=(e[i.objectClassKey]||0)-1);for(let i of l.components||[])i.objectClassKey!=="HOME"&&(e[i.objectClassKey]=(e[i.objectClassKey]||0)+1)}}return e}function ze(s,n){let e=new Set(n.removedSystemIds),d=[];for(let c of s.systems){if(e.has(c.id))continue;let l=n.componentOverrides[c.id];l?d.push({...c,components:l.components,multiplicity:l.multiplicity}):d.push(c)}for(let c of n.addedSystems)d.push(c);return d}function oe(s){if(!Array.isArray(s.components)||s.components.length<=1){let n=E(s.objectClassKey,{isHome:s.isHome});return n==="LTY"?"L/T/Y":n}return s.components.map(n=>{let e=E(n.objectClassKey);return e==="LTY"?"L/T/Y":e}).join(" + ")}var Ye=[{title:"Getting Started",body:"The Local Cluster page generates a procedural neighbourhood of nearby star systems. Your home star sits at the centre, surrounded by randomly placed neighbours that the Visualiser can display as a 3D cluster."},{title:"Seed and Radius",body:"Change the random seed to regenerate the cluster layout. Adjust the neighbourhood radius to control the volume of space sampled and the number of systems generated."},{title:"Editing Systems",body:"Click any system to rename it, adjust its position, or edit its metallicity. Each neighbour has a spectral class and giant-planet probability derived from its galactic position."},{title:"Galactic Context",body:"The Galactic Habitable Zone indicator shows whether your star\u2019s position favours Earth-like planet formation. Metallicity gradients and stellar density vary with galactic radius."},{title:"Stellar Census",body:"The output panel breaks down the neighbourhood by spectral class, counting O, B, A, F, G, K, M stars, white dwarfs, and brown dwarfs. Binary and triple system rates are estimated."}];function mt(s){let n=ge(),e=pe(n),d=ne(),c=null,l=[],t=document.createElement("div");t.className="page",t.innerHTML=`
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
              <button class="small" id="btnRandomSeed" type="button" title="Generate random seed" ${_(m["Randomise Seed"]||"")} style="margin-top:6px;width:100%">Randomise</button>
            </div>
          </div>

          <div class="button-row">
            <button class="primary" id="btnClusterApply" type="button" ${_(m["Apply Cluster Changes"]||"")}>Apply</button>
            <button id="btnClusterReset" type="button" ${_(m["Reset Cluster Defaults"]||"")}>Reset to Defaults</button>
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
        <textarea id="clusterImportText" rows="6" ${_(m["Cluster Import Table"]||"")} placeholder="System Name&#9;Coordinates (ly)&#9;Distance&#9;Constituents&#10;Home&#9;(0, 0, 0)&#9;0.00 ly&#9;GV&#10;S01&#9;(6.64, 22.03, 8.11)&#9;24.40 ly&#9;MV" style="width:100%;font-family:var(--mono);font-size:0.85rem;resize:vertical"></textarea>
        <div style="margin-top:8px">
          <button id="btnClusterImport" class="action-btn" ${_(m["Import Cluster"]||"")}>Import</button>
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
  `,s.appendChild(t),Se(t),Ce({steps:Ye,storageKey:"worldsmith.cluster.tutorial",container:t,triggerBtn:t.querySelector("#clusterTutorials")});let i=t.querySelector("#clusterGalacticRadius"),v=t.querySelector("#clusterLocation"),C=t.querySelector("#clusterRadius"),j=t.querySelector("#clusterDensity"),L=t.querySelector("#clusterSeed"),U=t.querySelector("#clusterGalacticRadiusSlider"),H=t.querySelector("#clusterLocationSlider"),re=t.querySelector("#clusterRadiusSlider"),le=t.querySelector("#clusterDensitySlider"),X=t.querySelector("#clusterKpis"),I=t.querySelector("#clusterObjectsBody"),K=t.querySelector("#clusterSystemsBody");function ce(a,r){let p=Me(d?.[a.id]);return p||(a.isHome?r:a.name)}Z({numberEl:i,sliderEl:U,min:1e3,max:1e6,step:1,mode:"auto"}),Z({numberEl:v,sliderEl:H,min:0,max:1e6,step:1,mode:"auto"}),Z({numberEl:C,sliderEl:re,min:.1,max:25,step:.1,mode:"auto"}),Z({numberEl:j,sliderEl:le,min:1e-6,max:.1,step:1e-6,mode:"auto"});function de(){i.value=String(e.galacticRadiusLy),v.value=String(e.locationLy),C.value=String(e.neighbourhoodRadiusLy),j.value=String(e.stellarDensityPerLy3),L.value=String(e.randomSeed),i.dispatchEvent(new Event("input",{bubbles:!0})),v.dispatchEvent(new Event("input",{bubbles:!0})),C.dispatchEvent(new Event("input",{bubbles:!0})),j.dispatchEvent(new Event("input",{bubbles:!0}))}function ue(){let a=N(Number(i.value),1e3,1e6),r=N(Number(v.value),0,a),p=N(Number(C.value),.1,25),h=N(Number(j.value),1e-6,.1),o=N(Ge(L.value,te.randomSeed),1,2147483646);e.galacticRadiusLy=a,e.locationLy=r,e.neighbourhoodRadiusLy=p,e.stellarDensityPerLy3=h,e.randomSeed=o,i.value=String(e.galacticRadiusLy),v.value=String(e.locationLy),C.value=String(e.neighbourhoodRadiusLy),j.value=String(e.stellarDensityPerLy3),L.value=String(e.randomSeed),i.dispatchEvent(new Event("input",{bubbles:!0})),v.dispatchEvent(new Event("input",{bubbles:!0})),C.dispatchEvent(new Event("input",{bubbles:!0})),j.dispatchEvent(new Event("input",{bubbles:!0}))}function k(){d=ne();let a=fe(),r=ve(a),p=typeof r?.name=="string"&&r.name.trim()?r.name.trim():"home star system",h=r?.metallicityFeH??0,o=se({...e,homeMetallicityFeH:h}),w=F(),S=ze(o,w),y=Be(o,w);c=o,l=S;let b=[{label:"Galactic Habitable Zone",tip:m["Galactic Habitable Zone"],value:`${f(o.galacticHabitableZoneLy.inner,0)} - ${f(o.galacticHabitableZoneLy.outer,0)}`,meta:"ly"},{label:"In Galactic Habitable Zone?",tip:m["In Galactic Habitable Zone?"],value:o.inHabitableZone?"Yes":"No",meta:`Location ${f(o.inputs.locationLy,0)} ly`},{label:"GHZ Probability",tip:m["GHZ Probability"],value:`${f(o.ghzProbability*100,1)}%`,meta:"Lineweaver (2004) Gaussian model"},{label:"Neighbourhood Volume",tip:m["Neighbourhood Volume"],value:f(o.neighbourhoodVolumeLy3,2),meta:"ly^3"},{label:"Estimated Stellar-Mass Objects",tip:m["Estimated Stellar-Mass Objects"],value:f(o.rawStellarMassObjects,2),meta:"raw estimate"},{label:"Main Sequence Total",tip:m["Main Sequence Total"],value:f(o.mainSequenceTotal,0),meta:"O/B/A/F/G/K/M"},{label:"Total Stellar-Mass Objects",tip:m["Total Stellar-Mass Objects"],value:f(o.totalStellarMassObjects,0),meta:"rounded class sum"},{label:"Total Star Systems",tip:m["Total Star Systems"],value:f(o.systemCounts.total,0),meta:`${f(o.systemCounts.single,0)} single | ${f(o.systemCounts.binary,0)} binary | ${f(o.systemCounts.triple,0)} triple | ${f(o.systemCounts.quadruple,0)} quadruple`},{label:"Generated Neighbours",tip:m["System Coordinates"],value:f(o.systems.length-1,0),meta:o.systemsOmitted>0?`plus 1 home \u2014 ${f(o.systemsOmitted,0)} systems omitted (visualiser cap: 750)`:"plus 1 home system"}];je(X,b),xe(I,o.stellarRows,y),Le(K,S,{homeDefaultName:p,resolveSystemDisplayName:ce,formatSystemLabel:oe,formatLy:Ae,fmtFeH:De})}function Ee(){let a=F();return{addedSystemCount:Array.isArray(a?.addedSystems)?a.addedSystems.length:0,hiddenSystemCount:Array.isArray(a?.removedSystemIds)?a.removedSystemIds.length:0,modifiedSystemCount:a?.componentOverrides&&typeof a.componentOverrides=="object"?Object.keys(a.componentOverrides).length:0}}async function J(a,r){let p=ye({actionLabel:a,finalConsequence:r,...Ee()});return p?V(p):!0}function Q(){$({addedSystems:[],removedSystemIds:[],componentOverrides:{}})}async function me(){await J("Apply cluster changes","The cluster will regenerate from the current galactic inputs.")&&(ue(),P(e),Q(),k())}async function Te(){await J("Reset to defaults","All local-cluster inputs will reset to their default values.")&&(Object.assign(e,te),de(),P(e),Q(),k())}t.querySelector("#btnClusterApply")?.addEventListener("click",me),t.querySelector("#btnClusterReset")?.addEventListener("click",Te);let ke=t.querySelector("#clusterImportText");t.querySelector("#btnClusterImport")?.addEventListener("click",()=>{let a=(ke?.value||"").trim();if(!a)return;let r=qe(a);if(r.length===0){alert("Could not parse any systems from the pasted text. Expected tab-separated columns: System Name, Coordinates (ly), Distance, Constituents.");return}let p=r.find(b=>b.isHome),h=r.filter(b=>!b.isHome),o=Math.max(...r.map(b=>b.distanceLy));o>e.neighbourhoodRadiusLy&&(e.neighbourhoodRadiusLy=Math.ceil(o+1),C.value=String(e.neighbourhoodRadiusLy),C.dispatchEvent(new Event("input",{bubbles:!0})),P(e));let S=se(e).systems.filter(b=>!b.isHome).map(b=>b.id);$({addedSystems:h,removedSystemIds:S,componentOverrides:{}});let y={};p&&(y.home=p.name);for(let b of h)y[b.id]=b.name;ie(y),k()}),t.querySelector("#btnRandomSeed")?.addEventListener("click",async()=>{await J("Randomise seed","The cluster will regenerate from a new random seed.")&&(L.value=String(1+Math.floor(Math.random()*2147483645)),ue(),P(e),Q(),k())}),K?.addEventListener("change",a=>{let r=a.target?.closest?.(".cluster-name-input");if(!r)return;let p=String(r.dataset.systemId||"").trim();if(!p)return;let h=Me(r.value);h?d[p]=h:delete d[p],ie(d),r.value=h}),K?.addEventListener("keydown",a=>{let r=a.target?.closest?.(".cluster-name-input");r&&a.key==="Enter"&&(a.preventDefault(),r.blur())}),I?.addEventListener("click",async a=>{let r=a.target?.closest?.(".cluster-adjust-btn");if(!r)return;let p=r.dataset.class,h=r.dataset.action;if(!p||!h)return;let o=F(),w=e.neighbourhoodRadiusLy>50?Math.max(.15,1-(e.neighbourhoodRadiusLy-50)/1e3):1;if(h==="add"){let S=Ze(e.neighbourhoodRadiusLy,w),y="added-"+Date.now()+"-"+Math.floor(Math.random()*1e4);o.addedSystems.push({id:y,name:"Star System (added)",index:(l.length||0)+1,isHome:!1,objectClassKey:p,multiplicity:"single",components:[{objectClassKey:p}],metallicityFeH:0,...S})}else if(h==="remove"){let S=r.closest("tr")?.querySelector("td")?.textContent?.trim()||String(p).trim(),y=We(o.addedSystems,x=>x.objectClassKey===p),b=y>=0?ae({classLabel:S,sourceKind:"manual"}):ae({classLabel:S,sourceKind:"generated"});if(!await V(b))return;if(y>=0)o.addedSystems.splice(y,1);else if(c){let x=new Set(o.removedSystemIds),A=c.systems.filter(W=>!W.isHome&&!x.has(W.id)&&W.objectClassKey===p);A.length>0&&o.removedSystemIds.push(A[A.length-1].id)}}$(o),k()});let R=t.querySelector("#clusterContextMenu"),Oe=R?.querySelector(".cluster-context-menu__title"),Ne=R?.querySelector(".cluster-context-menu__items");function ee(){R&&(R.style.display="none")}function He(a,r,p){let h=l.find(x=>x.id===p);if(!h)return;let o=h.components||[{objectClassKey:h.objectClassKey}],w=oe(h);Oe.textContent=w+" system",Re(Ne,{systemId:p,components:o,companionClasses:Fe});let S=220,y=R.offsetHeight||200,b=window.innerWidth,T=window.innerHeight;R.style.left=Math.min(a,b-S-10)+"px",R.style.top=Math.min(r,T-y-10)+"px",R.style.display="block"}K?.addEventListener("contextmenu",a=>{let r=a.target?.closest?.("tr[data-system-id]");if(!r)return;a.preventDefault();let p=r.dataset.systemId;p&&He(a.clientX,a.clientY,p)}),R?.addEventListener("click",async a=>{let r=a.target?.closest?.(".cluster-context-menu__item");if(!r)return;let p=r.dataset.action,h=r.dataset.systemId;if(!p||!h)return;let o=F();if(p==="add-companion"){let w=r.dataset.class;if(!w)return;if(h.startsWith("added-")){let y=o.addedSystems.find(b=>b.id===h);y&&(y.components||[]).length<4&&(y.components.push({objectClassKey:w}),y.multiplicity=Y(y.components.length))}else{let y=o.componentOverrides[h],b=c?.systems.find(x=>x.id===h),T=y?y.components:(b?.components||[]).map(x=>({...x}));if(T.length<4){let x=[...T,{objectClassKey:w}];o.componentOverrides[h]={components:x,multiplicity:Y(x.length)}}}}else if(p==="remove-companion"){let w=Number(r.dataset.compIndex);if(!Number.isFinite(w)||w<1)return;let S=l.find(M=>M.id===h);if(!S)return;let y=Array.isArray(S?.components)?S.components:[{objectClassKey:S?.objectClassKey}],b=y[w],T=E(b?.objectClassKey),x=T==="LTY"?"L/T/Y":T,A=ce(S,"Home")||oe(S);if(!await V(be({systemLabel:A,companionLabel:x,beforeComponentCount:y.length})))return;if(h.startsWith("added-")){let M=o.addedSystems.find(D=>D.id===h);M&&M.components.length>1&&(M.components.splice(w,1),M.multiplicity=Y(M.components.length))}else{let M=o.componentOverrides[h],D=c?.systems.find(G=>G.id===h),O=M?[...M.components]:(D?.components||[]).map(G=>({...G}));O.length>1&&w<O.length&&(O.splice(w,1),O.length===(D?.components||[]).length&&O.every((G,Ie)=>G.objectClassKey===D.components[Ie]?.objectClassKey)?delete o.componentOverrides[h]:o.componentOverrides[h]={components:O,multiplicity:Y(O.length)})}}$(o),ee(),k()}),document.addEventListener("click",a=>{R&&!R.contains(a.target)&&ee()}),document.addEventListener("keydown",a=>{a.key==="Escape"&&ee()}),[i,v,C,j,L].forEach(a=>{a?.addEventListener("keydown",r=>{r.key==="Enter"&&me()})}),de(),k()}function We(s,n){for(let e=s.length-1;e>=0;e--)if(n(s[e]))return e;return-1}export{mt as initLocalClusterPage};
