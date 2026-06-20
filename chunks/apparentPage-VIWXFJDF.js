import{a as F,e as te}from"./chunk-YAWL2UWM.js";import{a as I,d as ee}from"./chunk-M2OHM2TC.js";import{e as X,f as Z}from"./chunk-I2FVXFMW.js";import"./chunk-MX2YGMQG.js";import{b as Q,d as Y}from"./chunk-PKMDUD76.js";import"./chunk-LTA33HDN.js";import"./chunk-IFZDGLZU.js";import{b as N}from"./chunk-5VWRMW5Z.js";import"./chunk-2QQ4TWOT.js";import"./chunk-L5KGQL7S.js";import"./chunk-NDMX2VLS.js";import"./chunk-5YVVLRFP.js";import{a as ae}from"./chunk-MXEPBJGN.js";import"./chunk-HLZ2ABGO.js";import"./chunk-UN6CKA7Q.js";import"./chunk-7ORUR75H.js";import"./chunk-E74JE3YP.js";import"./chunk-SMGR3AMC.js";import{a as G}from"./chunk-WYZYYRUA.js";import{a as d,d as W,e as J}from"./chunk-4HEO5JKX.js";import{b,c as w,e as O}from"./chunk-XMLMEZIZ.js";import"./chunk-LAMR64J5.js";import{La as K,za as C}from"./chunk-26GBR7HP.js";import"./chunk-MU7BKJ2M.js";import"./chunk-WNGVR2CK.js";import"./chunk-PEDZU4MZ.js";import"./chunk-32DKD6ZO.js";import{j as h}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function ke(e){return e?b("span",{className:"tip-icon",attrs:{tabindex:"0",role:"note","aria-label":"Info"},dataset:{tip:e},text:"i"}):null}function m(e,a={}){return b("td",{attrs:a,text:e==null?"":String(e)})}function Pe(e){return e?.angDiamArcmin!=null?`${Number(e.angDiamArcmin).toFixed(1)}\u2032`:e?.angDiamArcsec!=null?`${e.angDiamArcsec}\u2033`:"\u2014"}function Me(e){let a=String(e?.classLabel||"").trim(),t=String(e?.bodyTypeLabel||"").trim();return/brown dwarf/i.test(a)?a:t||a}function Re(e){let a=b("input",{className:"cluster-name-input",attrs:{type:"number",min:e?.minDistanceAu,max:e?.maxDistanceAu,step:"0.001",title:`min ${h(e?.minDistanceAu,3)} AU, max ${h(e?.maxDistanceAu,3)} AU`},dataset:{distanceId:e?.id||""}});return a.value=String(e?.currentDistanceAu??""),a}function re(e,a=[],t=""){let s=Array.isArray(a)?a:[];if(!s.length)return O(e,[{value:"",label:"No planets"}]),e.value="","";let o=new Set(s.map(f=>String(f?.id||"")).filter(Boolean)).has(String(t||""))?String(t||""):String(s[0]?.id||"");return O(e,s.map(f=>({value:f?.id||"",label:f?.name||f?.id||"Planet"}))),e.value=o,o}function ne(e){let a=e?.kind==="moon"&&e?.parentName?`${e.label} (${e.parentName})`:e?.label||e?.id||"Reference body";return b("option",{attrs:{value:e?.selectValue||""},text:a})}function ie(e,a=[],t=""){let s=(Array.isArray(a)?a:[]).filter(g=>g&&g.eligibilityClass!=="invalid");if(!s.length)return O(e,[{value:"",label:"No reference bodies"}]),e.value="","";let i={planet:s.filter(g=>g.kind!=="moon"),moon:s.filter(g=>g.kind==="moon")},o=[];i.planet.length&&o.push(b("optgroup",{attrs:{label:"Planets"}},i.planet.map(g=>ne(g)))),i.moon.length&&o.push(b("optgroup",{attrs:{label:"Moons"}},i.moon.map(g=>ne(g))));let v=new Set(s.map(g=>g.selectValue)).has(String(t||""))?String(t||""):s[0]?.selectValue||"";return w(e,o),e.value=v,v}function se(e,a=[],t={}){return w(e,(Array.isArray(a)?a:[]).map(s=>b("div",{className:"kpi-wrap"},[b("div",{className:"kpi"},[b("div",{className:"kpi__label"},[s?.label||"",t?.[s?.label]?" ":"",ke(t?.[s?.label]||"")]),b("div",{className:"kpi__value",text:s?.value??""}),b("div",{className:"kpi__meta",text:s?.meta??""})])]))),e}function oe(e,a=[]){return w(e,(Array.isArray(a)?a:[]).map(t=>b("tr",{},[m(t?.name),m(h(t?.orbitAu,4)),m(h(t?.magnitude,4)),m(h(t?.brightnessRelativeToEarthSun,6)),m(h(t?.apparentSizeRelativeToEarthSun,6)),m(t?.angularDiameterLabel)]))),e}function le(e,a=[]){return w(e,(Array.isArray(a)?a:[]).map(t=>b("tr",{},[m(t?.name),m(Me(t)),b("td",{},[Re(t)]),m(h(t?.phaseAngleDeg,2)),m(Number.isFinite(t?.apparentMagnitude)?h(t.apparentMagnitude,2):"NA"),m(t?.angularDiameterLabel),m(t?.observable),m(t?.visibility)]))),e}function pe(e,a=[]){let t=Array.isArray(a)?a:[];return t.length?(w(e,t.map(s=>b("tr",{},[m(s?.name),m(h(s?.absoluteMagnitude,4)),m(Number.isFinite(s?.apparentMagnitude)?h(s.apparentMagnitude,2):"Invisible"),m(s?.angularDiameterLabel),m(Number.isFinite(s?.brightnessRelativeToFullMoon)?h(s.brightnessRelativeToFullMoon,4):"NA"),m(h(s?.apparentSizeRelativeToReference,4)),m(s?.eclipseType)]))),e):(w(e,[b("tr",{},[m("No moons assigned to home world",{colspan:"7",style:"text-align:center;color:var(--muted)"})])]),e)}function de(e,a=[]){return w(e,(Array.isArray(a)?a:[]).map(t=>b("tr",{},[m(t?.name),m(h(t?.appMag,2)),m(Pe(t)),m(t?.note)]))),e}var E=null,me=new WeakMap;function _e(){return E||(E=import("./apparentSkyNativeThree-NWCJI4QG.js")),E}function Be(){return typeof window<"u"&&typeof document<"u"}function ue(e){return!!e&&Be()&&e.isConnected!==!1}function ce(e){let a=me.get(e);return a||(a={generation:0,disposed:!1},me.set(e,a)),a}function he(e,a,t,s,i,o,f,v,g={}){if(!ue(e))return;let k=ce(e);k.disposed=!1;let L=++k.generation;_e().then(B=>{k.disposed||k.generation!==L||!ue(e)||B.drawSkyCanvasNative(e,a,t,s,i,o,f,v,g)}).catch(B=>{console.error("[WorldSmith] Failed to load apparent-sky runtime:",B)})}function ye(e){if(!e)return;let a=ce(e);a.disposed=!0;let t=++a.generation;E&&E.then(s=>{a.generation===t&&s.disposeSkyCanvasNative(e)}).catch(()=>{})}var p={"Reference body":"Planet or moon used as the observer frame for apparent brightness and size.","Moon phase":`Phase angle applied to all moons uniformly. 0\xB0 = full (opposition), 180\xB0 = new (conjunction, invisible).

Individual moon phases depend on orbital geometry; this slider lets you explore the full range.`,"Star apparent table":"Star apparent magnitude/brightness/size as seen from each body orbit in the current system.","Body apparent table":"Planetary object visibility from the selected home world. Phase functions vary by body type (types 1\u20134). Bond albedo is auto-converted to geometric albedo via an approximate phase integral. Star luminosity scales planet brightness via a -2.5 log10(L) correction. Phase angles above 160\xB0 are flagged as too extreme to observe. Distance per object can be overridden.","Body type":"Phase function classification. Type 1 (Rocky, airless): Bowell HG system, G=0.28. Type 2 (Rocky w/ atmosphere): empirical polynomial. Type 3 (Gas giant / brown dwarf, R \u2265 1.5 R\u2295): piecewise polynomial with opposition surge. Type 4 (Tiny body, R < 0.1 R\u2295): Bowell HG, G=0.15.","Moon apparent table":"Moon apparent outputs from the selected home world. All moons assigned to the home world are shown automatically.","Moon absolute magnitude":"Moon absolute magnitude includes a -2.5\xB7log10(L) correction for the host star\u2019s luminosity (implemented as dividing by \u221AL inside the log argument). Brighter stars illuminate moons more strongly, making them appear brighter from the home world.","Angular diameter":`Apparent angular size of the object as seen from the home world. Shown in degrees (\xB0) for very large objects, arcminutes (\u2032) for medium, or arcseconds (\u2033) for small.

Reference: Sun from Earth \u2248 31.6\u2032, Full Moon \u2248 31.1\u2032.`,Object:"Current row object in the apparent-size tables. For stars this is the emitting sun; for bodies and moons it is the target being compared from the selected home world.","Orbit (AU)":"Orbital distance of the emitting star or host world in astronomical units. This sets the illumination and apparent-size geometry used in the apparent model.","Star Magnitude":`Apparent visual magnitude of the star from the listed orbit.

Lower values are brighter; negative values indicate extremely bright naked-eye suns.`,"Brightness (Earth-sun = 1)":"Relative stellar brightness compared with the Sun as seen from Earth. Values above 1 mean a brighter sky than the Earth-Sun baseline.","Apparent Size (Earth-sun = 1)":"Relative angular size compared with the Sun as seen from Earth. Values above 1 mean the object appears larger on the sky than our Sun does from Earth.","Distance (AU)":"Line-of-sight distance used for the body apparent-magnitude and angular-size calculation. This can differ from orbital radius when you override per-body distances.","Phase (deg)":"Sun-object-observer phase angle in degrees. 0\xB0 is full illumination; 180\xB0 is new or backlit geometry.",Magnitude:`Apparent visual magnitude of the listed object under the current distance and phase geometry.

Lower values are brighter.`,Observable:"Quick visibility flag indicating whether the geometry stays inside the app's observable phase limits.",Visibility:"Human-readable brightness impression for the current apparent magnitude, such as daylight object, brilliant night object, faint target, or effectively invisible.",Moon:"Moon name for the current apparent-output row.","App Mag":"Apparent visual magnitude of the moon from the selected home world under the current phase setting.","Brightness (full moon = 1)":"Relative moon brightness compared with Earth\u2019s full Moon. Values above 1 indicate a brighter moon than Luna at full phase.","Size (moon = 1)":"Relative angular size compared with Earth\u2019s Moon. Values above 1 indicate a larger apparent moon than Luna.",Eclipses:"Simple eclipse-visibility note for the moon as seen from the selected home world.","Apparent Magnitude":"Reference apparent magnitude for the listed Solar System comparison object as seen from Earth.","Angular Size":"Reference angular size for the listed Solar System comparison object as seen from Earth.",Note:"Short comparison note explaining why the listed Solar System reference is useful in the table.","Sol references":"Familiar Solar System objects for magnitude and angular size comparison. All values are as seen from Earth.","Sky canvas":`Visual comparison of angular sizes as seen from the home world. Objects are drawn as disks at their true relative angular sizes. Dotted outlines show familiar Solar System references (Sol, Luna, Jupiter).

In multistar skies, the canvas separates primary suns from companion suns. Two-star primary pairs are static by default and can be animated with the sky control on a compressed orbital timescale, while companion positions remain schematic when only host-frame separations are available.

When the star is much larger than other objects, a split scale is used: the star appears at reduced scale (labelled) on the left, with moons and planets at full scale on the right.

Very small objects are enlarged on a logarithmic scale so their relative size differences remain visible.`,"Star absolute magnitude":`Absolute visual magnitude of the host star (magnitude at 10 pc).

Lower values = brighter. The Sun is +4.83 M.`,"Home orbit":`Orbital distance of the selected home world from the host star in AU.

All apparent magnitudes and angular sizes are computed from this distance.`,"Home star magnitude":`Apparent visual magnitude of the host star as seen from the home world.

The Sun from Earth is \u22122.74 mag.`,"Brightest object":"The planet or giant companion with the lowest (brightest) apparent magnitude as seen from the home world at the current phase.","Brightest moon":"The moon with the lowest (brightest) apparent magnitude as seen from the home world at the selected moon phase angle.","Moon count":`Total number of moons assigned to the home world.

Moons are assigned on the Moons page.`,"Visible suns":`Counts the host star or host pair plus any additional companion stars visible from the selected home world.

Pair-host worlds can show two primary suns in a static default sky view or animate them on demand in the sky canvas, while wider hierarchical companions are added using their host-frame separation as an approximate sky-distance reference.`};function xe(e,a,t,s,i,o,f){let v=t?` <span class="unit">${t}</span>`:"";return`
    <div class="form-row">
      <div>
        <div class="label">${a}${v} ${d(f||"")}</div>
      </div>
      <div class="input-pair">
        <input id="${e}" type="number" step="${o}" aria-label="${a}" />
        <input id="${e}_slider" type="range" aria-label="${a} slider" />
        <div class="range-meta"><span id="${e}_min"></span><span id="${e}_max"></span></div>
      </div>
    </div>
  `}function Ee(e){let a=(e?.primarySuns||[]).map(s=>s?.name).filter(Boolean),t=(e?.companionStars||[]).map(s=>s?.name).filter(Boolean);return a.length&&t.length?`Primary suns: ${a.join(", ")}. Companion suns: ${t.join(", ")}.`:a.length>1?`Primary suns: ${a.join(", ")}`:a.length===1?a[0]:t.length?`Companion suns: ${t.join(", ")}`:"single-star sky"}var $e=[{title:"Getting Started",body:"The Apparent Size page calculates how celestial objects look from your home world \u2014 angular diameter, apparent magnitude, and visibility based on real optics."},{title:"Sky Canvas",body:"The canvas at the top compares angular sizes at true proportions. Tiny objects use logarithmic scaling so they remain visible. Sol reference sizes are shown for comparison."},{title:"Object Tables",body:"Tables list apparent magnitude, angular diameter, phase angle, and illuminated fraction for every planet, giant companion, and moon in your system."},{title:"Phase Functions",body:"Four body types use different scattering models: rocky airless, rocky with atmosphere, gas giant / brown dwarf, and tiny body. Phase angles above 160\xB0 are flagged as too extreme to observe."}];function Te(){return F(ae({id:"apparentObjectSelector",title:"Observer selection",summary:"Choose the planet or moon whose sky should be interpreted.",select:{id:"apparentHomePlanet",label:"Reference body",options:[]}}))}function Ce(){return F(te({id:"apparentEmptyState",title:"No observer body available",body:"Apparent Size needs a planet or moon observer before it can compare sky brightness, angular size, and visibility.",actions:[{label:"Create a planet",href:"#/planet"}]}))}function Ye(e){let a=C(),t=N(a,{mode:I.apparentSelectors}),s=K(a),i={homePlanetId:s?.id||Object.keys(t.planetsById||{})[0]||"",homeBodyRef:s?.id?{kind:"planet",id:s.id}:Object.keys(t.planetsById||{})[0]?{kind:"planet",id:Object.keys(t.planetsById||{})[0]}:null,moonPhaseDeg:0,distanceByBodyId:{},skyMode:"night",animatePrimaryPair:!1},o=document.createElement("div");o.className="page",o.innerHTML=`
    <div class="panel apparent-workbench">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--apparent" aria-hidden="true"></span><span>Apparent Size</span></h1>
        <button id="apparentTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        <div class="hint">Compare apparent brightness and angular size from the selected observer. The current world snapshot supplies the data; viewing controls stay local.</div>
        <div class="apparent-workbench__grid">
          <section class="apparent-workbench__section" aria-labelledby="apparentInputsTitle">
            <div class="apparent-workbench__section-header">
              <h2 id="apparentInputsTitle">Inputs</h2>
              <p>Choose the observer and local viewing phase.</p>
            </div>
            ${Te()}
            <div id="apparentEmptyStateHost" hidden>
              ${Ce()}
            </div>
            <div class="apparent-local-note">Moon phase and per-row distances affect this view only.</div>
            ${xe("apparentMoonPhase","Moon phase angle","deg",0,180,1,p["Moon phase"])}
          </section>

          <section class="apparent-workbench__section" aria-labelledby="apparentOutputsTitle">
            <div class="apparent-workbench__section-header">
              <h2 id="apparentOutputsTitle">Outputs</h2>
              <p id="apparentSummaryMeta">Current snapshot summary.</p>
            </div>
            <section class="kpi-section" id="apparentSummary" aria-label="Apparent size summary">
              <div class="kpi-grid" id="apparentKpis"></div>
            </section>
          </section>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Angular Size Comparison ${d(p["Sky canvas"])}</h2></div>
      <div class="panel__body">
        <div class="pill-toggle-wrap apparent-sky-toggle">
          <div class="physics-duo-toggle">
            <input type="radio" name="skyBg" id="skyNight" value="night" checked />
            <label for="skyNight">Night</label>
            <input type="radio" name="skyBg" id="skyDay" value="day" />
            <label for="skyDay">Day</label>
            <span></span>
          </div>
          <button
            class="small apparent-sky-toggle__animate"
            id="skyPairAnimationToggle"
            type="button"
            aria-pressed="false"
            hidden
          >
            Animate primary suns
          </button>
        </div>
        <div class="sky-canvas-wrap" id="skyCanvasWrap">
          <canvas id="skyCanvas" width="800" height="320"></canvas>
        </div>
        <div class="hint flow-stack-gap" id="skyCanvasHint" hidden></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Star Apparent Table</h2></div>
      <div class="panel__body">
        <div class="hint">${p["Star apparent table"]}</div>
        <div class="cluster-table-wrap cluster-table-wrap--tall">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${d(p.Object)}</th>
                <th>Orbit (AU) ${d(p["Orbit (AU)"])}</th>
                <th>Star Magnitude ${d(p["Star Magnitude"])}</th>
                <th>Brightness (Earth-sun = 1) ${d(p["Brightness (Earth-sun = 1)"])}</th>
                <th>Apparent Size (Earth-sun = 1) ${d(p["Apparent Size (Earth-sun = 1)"])}</th>
                <th>Angular Diameter ${d(p["Angular diameter"])}</th>
              </tr>
            </thead>
            <tbody id="apparentStarRows"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Body Apparent Table</h2></div>
      <div class="panel__body">
        <div class="hint">${p["Body apparent table"]}</div>
        <div class="cluster-table-wrap cluster-table-wrap--x-tall">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${d(p.Object)}</th>
                <th>Type ${d(p["Body type"])}</th>
                <th>Distance (AU) ${d(p["Distance (AU)"])}</th>
                <th>Phase (deg) ${d(p["Phase (deg)"])}</th>
                <th>Magnitude ${d(p.Magnitude)}</th>
                <th>Angular Diameter ${d(p["Angular diameter"])}</th>
                <th>Observable ${d(p.Observable)}</th>
                <th>Visibility ${d(p.Visibility)}</th>
              </tr>
            </thead>
            <tbody id="apparentBodyRows"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Moon Apparent Table</h2></div>
      <div class="panel__body">
        <div class="hint">${p["Moon apparent table"]}</div>
        <div class="cluster-table-wrap cluster-table-wrap--standard">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Moon ${d(p.Moon)}</th>
                <th>Abs Mag ${d(p["Moon absolute magnitude"])}</th>
                <th>App Mag ${d(p["App Mag"])}</th>
                <th>Angular Diameter ${d(p["Angular diameter"])}</th>
                <th>Brightness (full moon = 1) ${d(p["Brightness (full moon = 1)"])}</th>
                <th>Size (moon = 1) ${d(p["Size (moon = 1)"])}</th>
                <th>Eclipses ${d(p.Eclipses)}</th>
              </tr>
            </thead>
            <tbody id="apparentMoonRows"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Sol System References ${d(p["Sol references"])}</h2></div>
      <div class="panel__body">
        <div class="hint">Familiar Solar System objects for comparison.</div>
        <div class="cluster-table-wrap cluster-table-wrap--compact">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${d(p.Object)}</th>
                <th>Apparent Magnitude ${d(p["Apparent Magnitude"])}</th>
                <th>Angular Size ${d(p["Angular Size"])}</th>
                <th>Note ${d(p.Note)}</th>
              </tr>
            </thead>
            <tbody id="apparentSolRefRows"></tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.innerHTML="",e.appendChild(o),W(o),J({steps:$e,storageKey:"worldsmith.apparent.tutorial",container:o,triggerBtn:o.querySelector("#apparentTutorials")});let f=o.querySelector("#apparentHomePlanet"),v=o.querySelector("#apparentMoonPhase"),g=o.querySelector("#apparentSummaryMeta"),k=o.querySelector("#apparentEmptyStateHost"),L=o.querySelector("#apparentKpis"),B=o.querySelector("#apparentStarRows"),V=o.querySelector("#apparentBodyRows"),be=o.querySelector("#apparentMoonRows"),ge=o.querySelector("#apparentSolRefRows"),M=o.querySelector("#skyCanvas"),j=o.querySelector("#skyCanvasWrap"),D=o.querySelector("#skyCanvasHint"),x=o.querySelector("#skyPairAnimationToggle"),fe=!0,$=[];function ve(c,y){c&&(c.textContent=y==null?"":String(y))}function Se(c,y){let n=Array.isArray(y?.bodiesFromHome)?y.bodiesFromHome.length:0,u=Array.isArray(y?.moons)?y.moons.length:0,P=Number(c?.visibleSunsCount??1+(c?.companionStars?.length||0));ve(g,`Current snapshot: ${n} body rows, ${u} moon rows, ${P} visible suns.`),k&&(k.hidden=!!c?.homeBodyRef)}let q=new MutationObserver(()=>{if(!o.isConnected){ye(M);try{q.disconnect()}catch{}}});q.observe(document.body,{childList:!0,subtree:!0});let Ae=o.querySelector("#apparentMoonPhase_slider");we("apparentMoonPhase",v,0,180,1,"auto");function we(c,y,n,u,P,R){let _=o.querySelector(`#${c}_slider`),T=o.querySelector(`#${c}_min`),r=o.querySelector(`#${c}_max`);T.textContent=String(n),r.textContent=String(u),G({numberEl:y,sliderEl:_,min:n,max:u,step:P,mode:R})}function U(){let c=N(C(),{mode:I.apparentSelectors});$=Q(c);let y=ie(f,$,Y(i.homeBodyRef)),n=$.find(P=>String(P?.selectValue||"")===String(y||""));if(n?.observerRef){i.homeBodyRef={...n.observerRef},i.homePlanetId=n.observerRef.kind==="moon"?n.observerRef.parentId||"":n.observerRef.id||"";return}let u=Object.values(c.planetsById||{});i.homePlanetId=re(f,u,i.homePlanetId),i.homeBodyRef=i.homePlanetId?{kind:"planet",id:i.homePlanetId}:null}function S(){let c=C(),y=N(c,{mode:I.apparentPage}),n=ee(y,{homeBodyRef:i.homeBodyRef,homePlanetId:i.homePlanetId,distanceByBodyId:i.distanceByBodyId,moonPhaseDeg:i.moonPhaseDeg});i.homeBodyRef=n.homeBodyRef||i.homeBodyRef,i.homePlanetId=n.homePlanetId||i.homePlanetId;let u=X({starMassMsol:n.starMassMsol,homeOrbitAu:n.homeOrbitAu,orbitSamples:n.orbitSamples,bodySamples:n.bodySamples,moonSamples:n.moonSamples});if(n.hasLivePrimaryPair||(i.animatePrimaryPair=!1),x){let r=!!n.hasLivePrimaryPair;x.hidden=!r,x.setAttribute("aria-pressed",i.animatePrimaryPair?"true":"false"),x.textContent=i.animatePrimaryPair?"Pause primary suns":"Animate primary suns"}u.moons.forEach((r,l)=>{n.moonSamples[l]?.moonCalc&&(r.moonCalc=n.moonSamples[l].moonCalc)});let P=new Map(n.bodySamples.map(r=>[r.id,r]));u.bodiesFromHome.forEach(r=>{let l=P.get(r.id);l&&(l._derived&&(r._derived=l._derived),l._planetInputs&&(r._planetInputs=l._planetInputs),l._styleId&&(r._styleId=l._styleId),l._visualProfile&&(r._visualProfile=l._visualProfile),l._gasProfile&&(r._gasProfile=l._gasProfile),l._visualDescriptor&&(r._visualDescriptor=l._visualDescriptor),l._visualSubtypeKey&&(r._visualSubtypeKey=l._visualSubtypeKey),l._visualOverrideSignature&&(r._visualOverrideSignature=l._visualOverrideSignature),l._visualRenderSignature&&(r._visualRenderSignature=l._visualRenderSignature),l.renderFamily&&(r.renderFamily=l.renderFamily),l.classLabel&&(r.classLabel=l.classLabel))});let R=[...u.bodiesFromHome].filter(r=>Number.isFinite(r.apparentMagnitude)).sort((r,l)=>r.apparentMagnitude-l.apparentMagnitude)[0],_=[...u.moons].filter(r=>Number.isFinite(r.apparentMagnitude)).sort((r,l)=>r.apparentMagnitude-l.apparentMagnitude)[0];if(Se(n,u),se(L,[{label:"Star absolute magnitude",value:h(u.star.absoluteMagnitude,3),meta:"M"},{label:"Home orbit",value:h(n.homeOrbitAu,3),meta:"AU"},{label:"Home star magnitude",value:h(u.starByOrbit[0]?.magnitude,3),meta:"at home"},{label:"Brightest object",value:R?R.name:"-",meta:R?`${h(R.apparentMagnitude,2)} mag`:"-"},{label:"Brightest moon",value:_?_.name:"-",meta:_?`${h(_.apparentMagnitude,2)} mag`:u.moons.length?"All invisible at this phase":"No moons"},{label:"Moon count",value:String(u.moons.length),meta:n.isMoonObserver?"shown as nearby bodies":"assigned to reference body"},{label:"Visible suns",value:String(n.visibleSunsCount??1+(n.companionStars?.length||0)),meta:Ee(n)}],p),oe(B,u.starByOrbit),u.bodiesFromHome.forEach(r=>{i.distanceByBodyId[r.id]=r.currentDistanceAu}),le(V,u.bodiesFromHome),pe(be,u.moons),de(ge,Z),D){let r="";n.hasLivePrimaryPair&&i.animatePrimaryPair&&n.hasApproximateCompanionSuns?r="Live pair phase: primary suns follow the local binary orbit on a compressed simulation timescale, while companion suns use host-frame separation as an approximate sky-distance reference.":n.hasLivePrimaryPair&&i.animatePrimaryPair?r="Live pair phase: the two primary suns follow the local binary orbit on a compressed simulation timescale.":n.hasLivePrimaryPair&&n.hasApproximateCompanionSuns?r="Static pair view by default. Use Animate primary suns to play the local binary orbit on a compressed simulation timescale; companion suns use host-frame separation as an approximate sky-distance reference.":n.hasLivePrimaryPair?r="Static pair view by default. Use Animate primary suns to play the local binary orbit on a compressed simulation timescale.":n.hasApproximatePrimarySuns?r="Schematic sky layout: local multi-primary host suns are grouped for readability and are not phase-resolved.":n.hasApproximateCompanionSuns&&(r=n.primarySuns?.length>1?"Schematic sky layout: primary suns are drawn together, while companion suns use host-frame separation as an approximate sky-distance reference.":"Schematic sky layout: companion suns use host-frame separation as an approximate sky-distance reference."),D.textContent=r,D.hidden=!r}let T=n.starModel;if(n.homeBodyRef){if(fe){let r={dayHex:n.homeSkyDayHex,dayEdgeHex:n.homeSkyDayEdgeHex,horizonHex:n.homeSkyHorizonHex};he(M,u,T?.starColourHex,i.skyMode,i.moonPhaseDeg,r,{starTempK:T?.tempK,starMassMsol:n.starMassMsol,starAgeGyr:n.starAgeGyr},n.skyStars||n.companionStars||[],{animatePrimaryPair:i.animatePrimaryPair})}}else{let r=j?.getBoundingClientRect?.();if(r&&M){let l=window.devicePixelRatio||1,z=Math.round(r.width*l),H=Math.round(r.height*l);M.width=z,M.height=H;let A=M.getContext("2d");A&&(A.fillStyle="#050818",A.fillRect(0,0,z,H),A.font=`italic ${12*l}px system-ui, sans-serif`,A.fillStyle="rgba(160,170,200,0.5)",A.textAlign="center",A.textBaseline="middle",A.fillText("Add planets to populate the sky comparison",z/2,H/2))}}}f?.addEventListener("change",()=>{let c=$.find(y=>String(y?.selectValue||"")===String(f.value||""));i.homeBodyRef=c?.observerRef?{...c.observerRef}:null,i.homePlanetId=i.homeBodyRef?.kind==="moon"?i.homeBodyRef.parentId||"":i.homeBodyRef?.id||"",U(),S()}),V?.addEventListener("change",c=>{let y=c.target?.closest?.("input[data-distance-id]");if(!y)return;let n=String(y.dataset.distanceId||""),u=Number(y.value);!n||!Number.isFinite(u)||(i.distanceByBodyId[n]=u,S())}),Ae?.addEventListener("input",()=>{i.moonPhaseDeg=Number(v.value)||0,S()}),v?.addEventListener("change",()=>{i.moonPhaseDeg=Number(v.value)||0,S()}),o.addEventListener("change",c=>{c.target.name==="skyBg"&&(i.skyMode=c.target.value,S())}),x?.addEventListener("click",()=>{i.animatePrimaryPair=!i.animatePrimaryPair,S()}),j&&new ResizeObserver(()=>S()).observe(j),U(),v.value=String(i.moonPhaseDeg),v.dispatchEvent(new Event("input",{bubbles:!0})),S()}export{Ye as initApparentPage};
