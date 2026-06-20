import{a as L,d as X}from"./chunk-AF4SWG5J.js";import{e as Q,f as Y}from"./chunk-I2FVXFMW.js";import"./chunk-MX2YGMQG.js";import{b as W,d as J}from"./chunk-PKMDUD76.js";import"./chunk-LTA33HDN.js";import"./chunk-IAVHHK56.js";import{b as O}from"./chunk-46OIQU3N.js";import"./chunk-2QD455J2.js";import"./chunk-L5KGQL7S.js";import"./chunk-NDMX2VLS.js";import"./chunk-7ORUR75H.js";import"./chunk-E74JE3YP.js";import"./chunk-SMGR3AMC.js";import{a as U}from"./chunk-WYZYYRUA.js";import{a as p,d as K,e as G}from"./chunk-4HEO5JKX.js";import{b as h,c as w,e as I}from"./chunk-XMLMEZIZ.js";import"./chunk-LAMR64J5.js";import{La as q,za as N}from"./chunk-SMEWK4VH.js";import"./chunk-MU7BKJ2M.js";import"./chunk-WNGVR2CK.js";import"./chunk-PEDZU4MZ.js";import"./chunk-32DKD6ZO.js";import{j as c}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function be(e){return e?h("span",{className:"tip-icon",attrs:{tabindex:"0",role:"note","aria-label":"Info"},dataset:{tip:e},text:"i"}):null}function m(e,a={}){return h("td",{attrs:a,text:e==null?"":String(e)})}function ge(e){return e?.angDiamArcmin!=null?`${Number(e.angDiamArcmin).toFixed(1)}\u2032`:e?.angDiamArcsec!=null?`${e.angDiamArcsec}\u2033`:"\u2014"}function fe(e){let a=String(e?.classLabel||"").trim(),t=String(e?.bodyTypeLabel||"").trim();return/brown dwarf/i.test(a)?a:t||a}function ve(e){let a=h("input",{className:"cluster-name-input",attrs:{type:"number",min:e?.minDistanceAu,max:e?.maxDistanceAu,step:"0.001",title:`min ${c(e?.minDistanceAu,3)} AU, max ${c(e?.maxDistanceAu,3)} AU`},dataset:{distanceId:e?.id||""}});return a.value=String(e?.currentDistanceAu??""),a}function ee(e,a=[],t=""){let s=Array.isArray(a)?a:[];if(!s.length)return I(e,[{value:"",label:"No planets"}]),e.value="","";let o=new Set(s.map(g=>String(g?.id||"")).filter(Boolean)).has(String(t||""))?String(t||""):String(s[0]?.id||"");return I(e,s.map(g=>({value:g?.id||"",label:g?.name||g?.id||"Planet"}))),e.value=o,o}function Z(e){let a=e?.kind==="moon"&&e?.parentName?`${e.label} (${e.parentName})`:e?.label||e?.id||"Reference body";return h("option",{attrs:{value:e?.selectValue||""},text:a})}function ae(e,a=[],t=""){let s=(Array.isArray(a)?a:[]).filter(y=>y&&y.eligibilityClass!=="invalid");if(!s.length)return I(e,[{value:"",label:"No reference bodies"}]),e.value="","";let r={planet:s.filter(y=>y.kind!=="moon"),moon:s.filter(y=>y.kind==="moon")},o=[];r.planet.length&&o.push(h("optgroup",{attrs:{label:"Planets"}},r.planet.map(y=>Z(y)))),r.moon.length&&o.push(h("optgroup",{attrs:{label:"Moons"}},r.moon.map(y=>Z(y))));let f=new Set(s.map(y=>y.selectValue)).has(String(t||""))?String(t||""):s[0]?.selectValue||"";return w(e,o),e.value=f,f}function te(e,a=[],t={}){return w(e,(Array.isArray(a)?a:[]).map(s=>h("div",{className:"kpi-wrap"},[h("div",{className:"kpi"},[h("div",{className:"kpi__label"},[s?.label||"",t?.[s?.label]?" ":"",be(t?.[s?.label]||"")]),h("div",{className:"kpi__value",text:s?.value??""}),h("div",{className:"kpi__meta",text:s?.meta??""})])]))),e}function ne(e,a=[]){return w(e,(Array.isArray(a)?a:[]).map(t=>h("tr",{},[m(t?.name),m(c(t?.orbitAu,4)),m(c(t?.magnitude,4)),m(c(t?.brightnessRelativeToEarthSun,6)),m(c(t?.apparentSizeRelativeToEarthSun,6)),m(t?.angularDiameterLabel)]))),e}function ie(e,a=[]){return w(e,(Array.isArray(a)?a:[]).map(t=>h("tr",{},[m(t?.name),m(fe(t)),h("td",{},[ve(t)]),m(c(t?.phaseAngleDeg,2)),m(Number.isFinite(t?.apparentMagnitude)?c(t.apparentMagnitude,2):"NA"),m(t?.angularDiameterLabel),m(t?.observable),m(t?.visibility)]))),e}function re(e,a=[]){let t=Array.isArray(a)?a:[];return t.length?(w(e,t.map(s=>h("tr",{},[m(s?.name),m(c(s?.absoluteMagnitude,4)),m(Number.isFinite(s?.apparentMagnitude)?c(s.apparentMagnitude,2):"Invisible"),m(s?.angularDiameterLabel),m(Number.isFinite(s?.brightnessRelativeToFullMoon)?c(s.brightnessRelativeToFullMoon,4):"NA"),m(c(s?.apparentSizeRelativeToReference,4)),m(s?.eclipseType)]))),e):(w(e,[h("tr",{},[m("No moons assigned to home world",{colspan:"7",style:"text-align:center;color:var(--muted)"})])]),e)}function se(e,a=[]){return w(e,(Array.isArray(a)?a:[]).map(t=>h("tr",{},[m(t?.name),m(c(t?.appMag,2)),m(ge(t)),m(t?.note)]))),e}var $=null,oe=new WeakMap;function Se(){return $||($=import("./apparentSkyNativeThree-I2YDLRFY.js")),$}function Ae(){return typeof window<"u"&&typeof document<"u"}function le(e){return!!e&&Ae()&&e.isConnected!==!1}function de(e){let a=oe.get(e);return a||(a={generation:0,disposed:!1},oe.set(e,a)),a}function pe(e,a,t,s,r,o,g,f,y={}){if(!le(e))return;let P=de(e);P.disposed=!1;let E=++P.generation;Se().then(_=>{P.disposed||P.generation!==E||!le(e)||_.drawSkyCanvasNative(e,a,t,s,r,o,g,f,y)}).catch(_=>{console.error("[WorldSmith] Failed to load apparent-sky runtime:",_)})}function me(e){if(!e)return;let a=de(e);a.disposed=!0;let t=++a.generation;$&&$.then(s=>{a.generation===t&&s.disposeSkyCanvasNative(e)}).catch(()=>{})}var d={"Reference body":"Planet or moon used as the observer frame for apparent brightness and size.","Moon phase":`Phase angle applied to all moons uniformly. 0\xB0 = full (opposition), 180\xB0 = new (conjunction, invisible).

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

Pair-host worlds can show two primary suns in a static default sky view or animate them on demand in the sky canvas, while wider hierarchical companions are added using their host-frame separation as an approximate sky-distance reference.`};function we(e,a,t,s,r,o,g){let f=t?` <span class="unit">${t}</span>`:"";return`
    <div class="form-row">
      <div>
        <div class="label">${a}${f} ${p(g||"")}</div>
      </div>
      <div class="input-pair">
        <input id="${e}" type="number" step="${o}" aria-label="${a}" />
        <input id="${e}_slider" type="range" aria-label="${a} slider" />
        <div class="range-meta"><span id="${e}_min"></span><span id="${e}_max"></span></div>
      </div>
    </div>
  `}function Pe(e){let a=(e?.primarySuns||[]).map(s=>s?.name).filter(Boolean),t=(e?.companionStars||[]).map(s=>s?.name).filter(Boolean);return a.length&&t.length?`Primary suns: ${a.join(", ")}. Companion suns: ${t.join(", ")}.`:a.length>1?`Primary suns: ${a.join(", ")}`:a.length===1?a[0]:t.length?`Companion suns: ${t.join(", ")}`:"single-star sky"}var ke=[{title:"Getting Started",body:"The Apparent Size page calculates how celestial objects look from your home world \u2014 angular diameter, apparent magnitude, and visibility based on real optics."},{title:"Sky Canvas",body:"The canvas at the top compares angular sizes at true proportions. Tiny objects use logarithmic scaling so they remain visible. Sol reference sizes are shown for comparison."},{title:"Object Tables",body:"Tables list apparent magnitude, angular diameter, phase angle, and illuminated fraction for every planet, giant companion, and moon in your system."},{title:"Phase Functions",body:"Four body types use different scattering models: rocky airless, rocky with atmosphere, gas giant / brown dwarf, and tiny body. Phase angles above 160\xB0 are flagged as too extreme to observe."}];function ze(e){let a=N(),t=O(a,{mode:L.apparentSelectors}),s=q(a),r={homePlanetId:s?.id||Object.keys(t.planetsById||{})[0]||"",homeBodyRef:s?.id?{kind:"planet",id:s.id}:Object.keys(t.planetsById||{})[0]?{kind:"planet",id:Object.keys(t.planetsById||{})[0]}:null,moonPhaseDeg:0,distanceByBodyId:{},skyMode:"night",animatePrimaryPair:!1},o=document.createElement("div");o.className="page",o.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--apparent" aria-hidden="true"></span><span>Apparent Size</span></h1>
        <button id="apparentTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        <div class="hint">Estimate star, planetary-object, and moon apparent brightness/size from a selected home world.</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">
          <div class="form-row">
            <div>
              <div class="label">Reference body ${p(d["Reference body"])}</div>
            </div>
            <select id="apparentHomePlanet"></select>
          </div>

          ${we("apparentMoonPhase","Moon phase angle","deg",0,180,1,d["Moon phase"])}
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Outputs</h2></div>
        <div class="panel__body">
          <div class="kpi-grid" id="apparentKpis"></div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Angular Size Comparison ${p(d["Sky canvas"])}</h2></div>
      <div class="panel__body">
        <div class="pill-toggle-wrap" style="margin-bottom:12px">
          <div class="physics-duo-toggle">
            <input type="radio" name="skyBg" id="skyNight" value="night" checked />
            <label for="skyNight">Night</label>
            <input type="radio" name="skyBg" id="skyDay" value="day" />
            <label for="skyDay">Day</label>
            <span></span>
          </div>
          <button
            class="small"
            id="skyPairAnimationToggle"
            type="button"
            aria-pressed="false"
            hidden
            style="margin-left:8px"
          >
            Animate primary suns
          </button>
        </div>
        <div class="sky-canvas-wrap" id="skyCanvasWrap">
          <canvas id="skyCanvas" width="800" height="320"></canvas>
        </div>
        <div class="hint" id="skyCanvasHint" style="margin-top:10px" hidden></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Star Apparent Table</h2></div>
      <div class="panel__body">
        <div class="hint">${d["Star apparent table"]}</div>
        <div class="cluster-table-wrap" style="max-height:360px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${p(d.Object)}</th>
                <th>Orbit (AU) ${p(d["Orbit (AU)"])}</th>
                <th>Star Magnitude ${p(d["Star Magnitude"])}</th>
                <th>Brightness (Earth-sun = 1) ${p(d["Brightness (Earth-sun = 1)"])}</th>
                <th>Apparent Size (Earth-sun = 1) ${p(d["Apparent Size (Earth-sun = 1)"])}</th>
                <th>Angular Diameter ${p(d["Angular diameter"])}</th>
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
        <div class="hint">${d["Body apparent table"]}</div>
        <div class="cluster-table-wrap" style="max-height:430px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${p(d.Object)}</th>
                <th>Type ${p(d["Body type"])}</th>
                <th>Distance (AU) ${p(d["Distance (AU)"])}</th>
                <th>Phase (deg) ${p(d["Phase (deg)"])}</th>
                <th>Magnitude ${p(d.Magnitude)}</th>
                <th>Angular Diameter ${p(d["Angular diameter"])}</th>
                <th>Observable ${p(d.Observable)}</th>
                <th>Visibility ${p(d.Visibility)}</th>
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
        <div class="hint">${d["Moon apparent table"]}</div>
        <div class="cluster-table-wrap" style="max-height:320px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Moon ${p(d.Moon)}</th>
                <th>Abs Mag ${p(d["Moon absolute magnitude"])}</th>
                <th>App Mag ${p(d["App Mag"])}</th>
                <th>Angular Diameter ${p(d["Angular diameter"])}</th>
                <th>Brightness (full moon = 1) ${p(d["Brightness (full moon = 1)"])}</th>
                <th>Size (moon = 1) ${p(d["Size (moon = 1)"])}</th>
                <th>Eclipses ${p(d.Eclipses)}</th>
              </tr>
            </thead>
            <tbody id="apparentMoonRows"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Sol System References ${p(d["Sol references"])}</h2></div>
      <div class="panel__body">
        <div class="hint">Familiar Solar System objects for comparison.</div>
        <div class="cluster-table-wrap" style="max-height:260px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${p(d.Object)}</th>
                <th>Apparent Magnitude ${p(d["Apparent Magnitude"])}</th>
                <th>Angular Size ${p(d["Angular Size"])}</th>
                <th>Note ${p(d.Note)}</th>
              </tr>
            </thead>
            <tbody id="apparentSolRefRows"></tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.innerHTML="",e.appendChild(o),K(o),G({steps:ke,storageKey:"worldsmith.apparent.tutorial",container:o,triggerBtn:o.querySelector("#apparentTutorials")});let g=o.querySelector("#apparentHomePlanet"),f=o.querySelector("#apparentMoonPhase"),y=o.querySelector("#apparentKpis"),P=o.querySelector("#apparentStarRows"),E=o.querySelector("#apparentBodyRows"),_=o.querySelector("#apparentMoonRows"),ue=o.querySelector("#apparentSolRefRows"),k=o.querySelector("#skyCanvas"),D=o.querySelector("#skyCanvasWrap"),j=o.querySelector("#skyCanvasHint"),x=o.querySelector("#skyPairAnimationToggle"),ce=!0,T=[],F=new MutationObserver(()=>{if(!o.isConnected){me(k);try{F.disconnect()}catch{}}});F.observe(document.body,{childList:!0,subtree:!0});let he=o.querySelector("#apparentMoonPhase_slider");ye("apparentMoonPhase",f,0,180,1,"auto");function ye(b,v,n,u,B,M){let R=o.querySelector(`#${b}_slider`),C=o.querySelector(`#${b}_min`),i=o.querySelector(`#${b}_max`);C.textContent=String(n),i.textContent=String(u),U({numberEl:v,sliderEl:R,min:n,max:u,step:B,mode:M})}function V(){let b=O(N(),{mode:L.apparentSelectors});T=W(b);let v=ae(g,T,J(r.homeBodyRef)),n=T.find(B=>String(B?.selectValue||"")===String(v||""));if(n?.observerRef){r.homeBodyRef={...n.observerRef},r.homePlanetId=n.observerRef.kind==="moon"?n.observerRef.parentId||"":n.observerRef.id||"";return}let u=Object.values(b.planetsById||{});r.homePlanetId=ee(g,u,r.homePlanetId),r.homeBodyRef=r.homePlanetId?{kind:"planet",id:r.homePlanetId}:null}function S(){let b=N(),v=O(b,{mode:L.apparentPage}),n=X(v,{homeBodyRef:r.homeBodyRef,homePlanetId:r.homePlanetId,distanceByBodyId:r.distanceByBodyId,moonPhaseDeg:r.moonPhaseDeg});r.homeBodyRef=n.homeBodyRef||r.homeBodyRef,r.homePlanetId=n.homePlanetId||r.homePlanetId;let u=Q({starMassMsol:n.starMassMsol,homeOrbitAu:n.homeOrbitAu,orbitSamples:n.orbitSamples,bodySamples:n.bodySamples,moonSamples:n.moonSamples});if(n.hasLivePrimaryPair||(r.animatePrimaryPair=!1),x){let i=!!n.hasLivePrimaryPair;x.hidden=!i,x.setAttribute("aria-pressed",r.animatePrimaryPair?"true":"false"),x.textContent=r.animatePrimaryPair?"Pause primary suns":"Animate primary suns"}u.moons.forEach((i,l)=>{n.moonSamples[l]?.moonCalc&&(i.moonCalc=n.moonSamples[l].moonCalc)});let B=new Map(n.bodySamples.map(i=>[i.id,i]));u.bodiesFromHome.forEach(i=>{let l=B.get(i.id);l&&(l._derived&&(i._derived=l._derived),l._planetInputs&&(i._planetInputs=l._planetInputs),l._styleId&&(i._styleId=l._styleId),l._visualProfile&&(i._visualProfile=l._visualProfile),l._gasProfile&&(i._gasProfile=l._gasProfile),l._visualDescriptor&&(i._visualDescriptor=l._visualDescriptor),l._visualSubtypeKey&&(i._visualSubtypeKey=l._visualSubtypeKey),l._visualOverrideSignature&&(i._visualOverrideSignature=l._visualOverrideSignature),l._visualRenderSignature&&(i._visualRenderSignature=l._visualRenderSignature),l.renderFamily&&(i.renderFamily=l.renderFamily),l.classLabel&&(i.classLabel=l.classLabel))});let M=[...u.bodiesFromHome].filter(i=>Number.isFinite(i.apparentMagnitude)).sort((i,l)=>i.apparentMagnitude-l.apparentMagnitude)[0],R=[...u.moons].filter(i=>Number.isFinite(i.apparentMagnitude)).sort((i,l)=>i.apparentMagnitude-l.apparentMagnitude)[0];if(te(y,[{label:"Star absolute magnitude",value:c(u.star.absoluteMagnitude,3),meta:"M"},{label:"Home orbit",value:c(n.homeOrbitAu,3),meta:"AU"},{label:"Home star magnitude",value:c(u.starByOrbit[0]?.magnitude,3),meta:"at home"},{label:"Brightest object",value:M?M.name:"-",meta:M?`${c(M.apparentMagnitude,2)} mag`:"-"},{label:"Brightest moon",value:R?R.name:"-",meta:R?`${c(R.apparentMagnitude,2)} mag`:u.moons.length?"All invisible at this phase":"No moons"},{label:"Moon count",value:String(u.moons.length),meta:n.isMoonObserver?"shown as nearby bodies":"assigned to reference body"},{label:"Visible suns",value:String(n.visibleSunsCount??1+(n.companionStars?.length||0)),meta:Pe(n)}],d),ne(P,u.starByOrbit),u.bodiesFromHome.forEach(i=>{r.distanceByBodyId[i.id]=i.currentDistanceAu}),ie(E,u.bodiesFromHome),re(_,u.moons),se(ue,Y),j){let i="";n.hasLivePrimaryPair&&r.animatePrimaryPair&&n.hasApproximateCompanionSuns?i="Live pair phase: primary suns follow the local binary orbit on a compressed simulation timescale, while companion suns use host-frame separation as an approximate sky-distance reference.":n.hasLivePrimaryPair&&r.animatePrimaryPair?i="Live pair phase: the two primary suns follow the local binary orbit on a compressed simulation timescale.":n.hasLivePrimaryPair&&n.hasApproximateCompanionSuns?i="Static pair view by default. Use Animate primary suns to play the local binary orbit on a compressed simulation timescale; companion suns use host-frame separation as an approximate sky-distance reference.":n.hasLivePrimaryPair?i="Static pair view by default. Use Animate primary suns to play the local binary orbit on a compressed simulation timescale.":n.hasApproximatePrimarySuns?i="Schematic sky layout: local multi-primary host suns are grouped for readability and are not phase-resolved.":n.hasApproximateCompanionSuns&&(i=n.primarySuns?.length>1?"Schematic sky layout: primary suns are drawn together, while companion suns use host-frame separation as an approximate sky-distance reference.":"Schematic sky layout: companion suns use host-frame separation as an approximate sky-distance reference."),j.textContent=i,j.hidden=!i}let C=n.starModel;if(n.homeBodyRef){if(ce){let i={dayHex:n.homeSkyDayHex,dayEdgeHex:n.homeSkyDayEdgeHex,horizonHex:n.homeSkyHorizonHex};pe(k,u,C?.starColourHex,r.skyMode,r.moonPhaseDeg,i,{starTempK:C?.tempK,starMassMsol:n.starMassMsol,starAgeGyr:n.starAgeGyr},n.skyStars||n.companionStars||[],{animatePrimaryPair:r.animatePrimaryPair})}}else{let i=D?.getBoundingClientRect?.();if(i&&k){let l=window.devicePixelRatio||1,z=Math.round(i.width*l),H=Math.round(i.height*l);k.width=z,k.height=H;let A=k.getContext("2d");A&&(A.fillStyle="#050818",A.fillRect(0,0,z,H),A.font=`italic ${12*l}px system-ui, sans-serif`,A.fillStyle="rgba(160,170,200,0.5)",A.textAlign="center",A.textBaseline="middle",A.fillText("Add planets to populate the sky comparison",z/2,H/2))}}}g?.addEventListener("change",()=>{let b=T.find(v=>String(v?.selectValue||"")===String(g.value||""));r.homeBodyRef=b?.observerRef?{...b.observerRef}:null,r.homePlanetId=r.homeBodyRef?.kind==="moon"?r.homeBodyRef.parentId||"":r.homeBodyRef?.id||"",V(),S()}),E?.addEventListener("change",b=>{let v=b.target?.closest?.("input[data-distance-id]");if(!v)return;let n=String(v.dataset.distanceId||""),u=Number(v.value);!n||!Number.isFinite(u)||(r.distanceByBodyId[n]=u,S())}),he?.addEventListener("input",()=>{r.moonPhaseDeg=Number(f.value)||0,S()}),f?.addEventListener("change",()=>{r.moonPhaseDeg=Number(f.value)||0,S()}),o.addEventListener("change",b=>{b.target.name==="skyBg"&&(r.skyMode=b.target.value,S())}),x?.addEventListener("click",()=>{r.animatePrimaryPair=!r.animatePrimaryPair,S()}),D&&new ResizeObserver(()=>S()).observe(D),V(),f.value=String(r.moonPhaseDeg),f.dispatchEvent(new Event("input",{bubbles:!0})),S()}export{ze as initApparentPage};
