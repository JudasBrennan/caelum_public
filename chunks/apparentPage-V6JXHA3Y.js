import{a as B,b as N,e as J}from"./chunk-EAGNDHCF.js";import{e as W,f as K}from"./chunk-7TT5SDUM.js";import"./chunk-7OTWKY36.js";import{a as U}from"./chunk-WYZYYRUA.js";import"./chunk-EQDWXQUV.js";import"./chunk-LTA33HDN.js";import"./chunk-DVWV4FNB.js";import"./chunk-5UDXXN2Q.js";import"./chunk-4KUGDHQ7.js";import"./chunk-DYVI34GA.js";import"./chunk-WYUSUDJD.js";import{a as G}from"./chunk-KYI55SIV.js";import{a as l,d as V}from"./chunk-L76EVWF4.js";import{b as h,c as A,e as H}from"./chunk-XMLMEZIZ.js";import"./chunk-LAMR64J5.js";import{ma as T,ya as q}from"./chunk-F26INHTW.js";import"./chunk-MWCNAQBY.js";import"./chunk-XYLDORKF.js";import"./chunk-XFZMQA63.js";import{j as u}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function me(e){return e?h("span",{className:"tip-icon",attrs:{tabindex:"0",role:"note","aria-label":"Info"},dataset:{tip:e},text:"i"}):null}function p(e,a={}){return h("td",{attrs:a,text:e==null?"":String(e)})}function ue(e){return e?.angDiamArcmin!=null?`${Number(e.angDiamArcmin).toFixed(1)}\u2032`:e?.angDiamArcsec!=null?`${e.angDiamArcsec}\u2033`:"\u2014"}function ce(e){let a=String(e?.classLabel||"").trim(),t=String(e?.bodyTypeLabel||"").trim();return/brown dwarf/i.test(a)?a:t||a}function he(e){let a=h("input",{className:"cluster-name-input",attrs:{type:"number",min:e?.minDistanceAu,max:e?.maxDistanceAu,step:"0.001",title:`min ${u(e?.minDistanceAu,3)} AU, max ${u(e?.maxDistanceAu,3)} AU`},dataset:{distanceId:e?.id||""}});return a.value=String(e?.currentDistanceAu??""),a}function Q(e,a=[],t=""){let r=Array.isArray(a)?a:[];if(!r.length)return H(e,[{value:"",label:"No planets"}]),e.value="","";let o=new Set(r.map(y=>String(y?.id||"")).filter(Boolean)).has(String(t||""))?String(t||""):String(r[0]?.id||"");return H(e,r.map(y=>({value:y?.id||"",label:y?.name||y?.id||"Planet"}))),e.value=o,o}function Y(e,a=[],t={}){return A(e,(Array.isArray(a)?a:[]).map(r=>h("div",{className:"kpi-wrap"},[h("div",{className:"kpi"},[h("div",{className:"kpi__label"},[r?.label||"",t?.[r?.label]?" ":"",me(t?.[r?.label]||"")]),h("div",{className:"kpi__value",text:r?.value??""}),h("div",{className:"kpi__meta",text:r?.meta??""})])]))),e}function X(e,a=[]){return A(e,(Array.isArray(a)?a:[]).map(t=>h("tr",{},[p(t?.name),p(u(t?.orbitAu,4)),p(u(t?.magnitude,4)),p(u(t?.brightnessRelativeToEarthSun,6)),p(u(t?.apparentSizeRelativeToEarthSun,6)),p(t?.angularDiameterLabel)]))),e}function Z(e,a=[]){return A(e,(Array.isArray(a)?a:[]).map(t=>h("tr",{},[p(t?.name),p(ce(t)),h("td",{},[he(t)]),p(u(t?.phaseAngleDeg,2)),p(Number.isFinite(t?.apparentMagnitude)?u(t.apparentMagnitude,2):"NA"),p(t?.angularDiameterLabel),p(t?.observable),p(t?.visibility)]))),e}function ee(e,a=[]){let t=Array.isArray(a)?a:[];return t.length?(A(e,t.map(r=>h("tr",{},[p(r?.name),p(u(r?.absoluteMagnitude,4)),p(Number.isFinite(r?.apparentMagnitude)?u(r.apparentMagnitude,2):"Invisible"),p(r?.angularDiameterLabel),p(Number.isFinite(r?.brightnessRelativeToFullMoon)?u(r.brightnessRelativeToFullMoon,4):"NA"),p(u(r?.apparentSizeRelativeToReference,4)),p(r?.eclipseType)]))),e):(A(e,[h("tr",{},[p("No moons assigned to home world",{colspan:"7",style:"text-align:center;color:var(--muted)"})])]),e)}function ae(e,a=[]){return A(e,(Array.isArray(a)?a:[]).map(t=>h("tr",{},[p(t?.name),p(u(t?.appMag,2)),p(ue(t)),p(t?.note)]))),e}var E=null,te=new WeakMap;function ye(){return E||(E=import("./apparentSkyNativeThree-NNODXU2U.js")),E}function ge(){return typeof window<"u"&&typeof document<"u"}function ne(e){return!!e&&ge()&&e.isConnected!==!1}function ie(e){let a=te.get(e);return a||(a={generation:0,disposed:!1},te.set(e,a)),a}function se(e,a,t,r,d,o,y,b,L={}){if(!ne(e))return;let w=ie(e);w.disposed=!1;let R=++w.generation;ye().then(x=>{w.disposed||w.generation!==R||!ne(e)||x.drawSkyCanvasNative(e,a,t,r,d,o,y,b,L)}).catch(x=>{console.error("[WorldSmith] Failed to load apparent-sky runtime:",x)})}function re(e){if(!e)return;let a=ie(e);a.disposed=!0;let t=++a.generation;E&&E.then(r=>{a.generation===t&&r.disposeSkyCanvasNative(e)}).catch(()=>{})}var s={"Home world":"Reference world used for apparent brightness and apparent size outputs.","Moon phase":`Phase angle applied to all moons uniformly. 0\xB0 = full (opposition), 180\xB0 = new (conjunction, invisible).

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

Pair-host worlds can show two primary suns in a static default sky view or animate them on demand in the sky canvas, while wider hierarchical companions are added using their host-frame separation as an approximate sky-distance reference.`};function be(e,a,t,r,d,o,y){let b=t?` <span class="unit">${t}</span>`:"";return`
    <div class="form-row">
      <div>
        <div class="label">${a}${b} ${l(y||"")}</div>
      </div>
      <div class="input-pair">
        <input id="${e}" type="number" step="${o}" aria-label="${a}" />
        <input id="${e}_slider" type="range" aria-label="${a} slider" />
        <div class="range-meta"><span id="${e}_min"></span><span id="${e}_max"></span></div>
      </div>
    </div>
  `}function ve(e){let a=(e?.primarySuns||[]).map(r=>r?.name).filter(Boolean),t=(e?.companionStars||[]).map(r=>r?.name).filter(Boolean);return a.length&&t.length?`Primary suns: ${a.join(", ")}. Companion suns: ${t.join(", ")}.`:a.length>1?`Primary suns: ${a.join(", ")}`:a.length===1?a[0]:t.length?`Companion suns: ${t.join(", ")}`:"single-star sky"}var fe=[{title:"Getting Started",body:"The Apparent Size page calculates how celestial objects look from your home world \u2014 angular diameter, apparent magnitude, and visibility based on real optics."},{title:"Sky Canvas",body:"The canvas at the top compares angular sizes at true proportions. Tiny objects use logarithmic scaling so they remain visible. Sol reference sizes are shown for comparison."},{title:"Object Tables",body:"Tables list apparent magnitude, angular diameter, phase angle, and illuminated fraction for every planet, giant companion, and moon in your system."},{title:"Phase Functions",body:"Four body types use different scattering models: rocky airless, rocky with atmosphere, gas giant / brown dwarf, and tiny body. Phase angles above 160\xB0 are flagged as too extreme to observe."}];function Le(e){let a=T(),t=B(a,{mode:N.apparentSelectors}),d={homePlanetId:q(a)?.id||Object.keys(t.planetsById||{})[0]||"",moonPhaseDeg:0,distanceByBodyId:{},skyMode:"night",animatePrimaryPair:!1},o=document.createElement("div");o.className="page",o.innerHTML=`
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
              <div class="label">Home world ${l(s["Home world"])}</div>
            </div>
            <select id="apparentHomePlanet"></select>
          </div>

          ${be("apparentMoonPhase","Moon phase angle","deg",0,180,1,s["Moon phase"])}
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
      <div class="panel__header"><h2>Angular Size Comparison ${l(s["Sky canvas"])}</h2></div>
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
        <div class="hint">${s["Star apparent table"]}</div>
        <div class="cluster-table-wrap" style="max-height:360px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${l(s.Object)}</th>
                <th>Orbit (AU) ${l(s["Orbit (AU)"])}</th>
                <th>Star Magnitude ${l(s["Star Magnitude"])}</th>
                <th>Brightness (Earth-sun = 1) ${l(s["Brightness (Earth-sun = 1)"])}</th>
                <th>Apparent Size (Earth-sun = 1) ${l(s["Apparent Size (Earth-sun = 1)"])}</th>
                <th>Angular Diameter ${l(s["Angular diameter"])}</th>
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
        <div class="hint">${s["Body apparent table"]}</div>
        <div class="cluster-table-wrap" style="max-height:430px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${l(s.Object)}</th>
                <th>Type ${l(s["Body type"])}</th>
                <th>Distance (AU) ${l(s["Distance (AU)"])}</th>
                <th>Phase (deg) ${l(s["Phase (deg)"])}</th>
                <th>Magnitude ${l(s.Magnitude)}</th>
                <th>Angular Diameter ${l(s["Angular diameter"])}</th>
                <th>Observable ${l(s.Observable)}</th>
                <th>Visibility ${l(s.Visibility)}</th>
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
        <div class="hint">${s["Moon apparent table"]}</div>
        <div class="cluster-table-wrap" style="max-height:320px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Moon ${l(s.Moon)}</th>
                <th>Abs Mag ${l(s["Moon absolute magnitude"])}</th>
                <th>App Mag ${l(s["App Mag"])}</th>
                <th>Angular Diameter ${l(s["Angular diameter"])}</th>
                <th>Brightness (full moon = 1) ${l(s["Brightness (full moon = 1)"])}</th>
                <th>Size (moon = 1) ${l(s["Size (moon = 1)"])}</th>
                <th>Eclipses ${l(s.Eclipses)}</th>
              </tr>
            </thead>
            <tbody id="apparentMoonRows"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Sol System References ${l(s["Sol references"])}</h2></div>
      <div class="panel__body">
        <div class="hint">Familiar Solar System objects for comparison.</div>
        <div class="cluster-table-wrap" style="max-height:260px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${l(s.Object)}</th>
                <th>Apparent Magnitude ${l(s["Apparent Magnitude"])}</th>
                <th>Angular Size ${l(s["Angular Size"])}</th>
                <th>Note ${l(s.Note)}</th>
              </tr>
            </thead>
            <tbody id="apparentSolRefRows"></tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.innerHTML="",e.appendChild(o),V(o),G({steps:fe,storageKey:"worldsmith.apparent.tutorial",container:o,triggerBtn:o.querySelector("#apparentTutorials")});let y=o.querySelector("#apparentHomePlanet"),b=o.querySelector("#apparentMoonPhase"),L=o.querySelector("#apparentKpis"),w=o.querySelector("#apparentStarRows"),R=o.querySelector("#apparentBodyRows"),x=o.querySelector("#apparentMoonRows"),oe=o.querySelector("#apparentSolRefRows"),P=o.querySelector("#skyCanvas"),C=o.querySelector("#skyCanvasWrap"),j=o.querySelector("#skyCanvasHint"),_=o.querySelector("#skyPairAnimationToggle"),le=!0,O=new MutationObserver(()=>{if(!o.isConnected){re(P);try{O.disconnect()}catch{}}});O.observe(document.body,{childList:!0,subtree:!0});let de=o.querySelector("#apparentMoonPhase_slider");pe("apparentMoonPhase",b,0,180,1,"auto");function pe(g,v,i,c,D,M){let k=o.querySelector(`#${g}_slider`),$=o.querySelector(`#${g}_min`),n=o.querySelector(`#${g}_max`);$.textContent=String(i),n.textContent=String(c),U({numberEl:v,sliderEl:k,min:i,max:c,step:D,mode:M})}function F(){let g=B(T(),{mode:N.apparentSelectors}),v=Object.values(g.planetsById||{});d.homePlanetId=Q(y,v,d.homePlanetId)}function f(){let g=T(),v=B(g,{mode:N.apparentPage}),i=J(v,{homePlanetId:d.homePlanetId,distanceByBodyId:d.distanceByBodyId,moonPhaseDeg:d.moonPhaseDeg}),c=W({starMassMsol:i.starMassMsol,homeOrbitAu:i.homeOrbitAu,orbitSamples:i.orbitSamples.filter(n=>n.id!==`planet:${d.homePlanetId}`),bodySamples:i.bodySamples,moonSamples:i.moonSamples});if(i.hasLivePrimaryPair||(d.animatePrimaryPair=!1),_){let n=!!i.hasLivePrimaryPair;_.hidden=!n,_.setAttribute("aria-pressed",d.animatePrimaryPair?"true":"false"),_.textContent=d.animatePrimaryPair?"Pause primary suns":"Animate primary suns"}c.moons.forEach((n,m)=>{i.moonSamples[m]?.moonCalc&&(n.moonCalc=i.moonSamples[m].moonCalc)});let D=new Map(i.bodySamples.map(n=>[n.id,n]));c.bodiesFromHome.forEach(n=>{let m=D.get(n.id);m&&(m._derived&&(n._derived=m._derived),m._planetInputs&&(n._planetInputs=m._planetInputs),m._styleId&&(n._styleId=m._styleId),m.classLabel&&(n.classLabel=m.classLabel))});let M=[...c.bodiesFromHome].filter(n=>Number.isFinite(n.apparentMagnitude)).sort((n,m)=>n.apparentMagnitude-m.apparentMagnitude)[0],k=[...c.moons].filter(n=>Number.isFinite(n.apparentMagnitude)).sort((n,m)=>n.apparentMagnitude-m.apparentMagnitude)[0];if(Y(L,[{label:"Star absolute magnitude",value:u(c.star.absoluteMagnitude,3),meta:"M"},{label:"Home orbit",value:u(i.homeOrbitAu,3),meta:"AU"},{label:"Home star magnitude",value:u(c.starByOrbit[0]?.magnitude,3),meta:"at home"},{label:"Brightest object",value:M?M.name:"-",meta:M?`${u(M.apparentMagnitude,2)} mag`:"-"},{label:"Brightest moon",value:k?k.name:"-",meta:k?`${u(k.apparentMagnitude,2)} mag`:c.moons.length?"All invisible at this phase":"No moons"},{label:"Moon count",value:String(c.moons.length),meta:"assigned to home world"},{label:"Visible suns",value:String(i.visibleSunsCount??1+(i.companionStars?.length||0)),meta:ve(i)}],s),X(w,c.starByOrbit),c.bodiesFromHome.forEach(n=>{d.distanceByBodyId[n.id]=n.currentDistanceAu}),Z(R,c.bodiesFromHome),ee(x,c.moons),ae(oe,K),j){let n="";i.hasLivePrimaryPair&&d.animatePrimaryPair&&i.hasApproximateCompanionSuns?n="Live pair phase: primary suns follow the local binary orbit on a compressed simulation timescale, while companion suns use host-frame separation as an approximate sky-distance reference.":i.hasLivePrimaryPair&&d.animatePrimaryPair?n="Live pair phase: the two primary suns follow the local binary orbit on a compressed simulation timescale.":i.hasLivePrimaryPair&&i.hasApproximateCompanionSuns?n="Static pair view by default. Use Animate primary suns to play the local binary orbit on a compressed simulation timescale; companion suns use host-frame separation as an approximate sky-distance reference.":i.hasLivePrimaryPair?n="Static pair view by default. Use Animate primary suns to play the local binary orbit on a compressed simulation timescale.":i.hasApproximatePrimarySuns?n="Schematic sky layout: local multi-primary host suns are grouped for readability and are not phase-resolved.":i.hasApproximateCompanionSuns&&(n=i.primarySuns?.length>1?"Schematic sky layout: primary suns are drawn together, while companion suns use host-frame separation as an approximate sky-distance reference.":"Schematic sky layout: companion suns use host-frame separation as an approximate sky-distance reference."),j.textContent=n,j.hidden=!n}let $=i.starModel;if(d.homePlanetId){if(le){let n={dayHex:i.homeSkyDayHex,dayEdgeHex:i.homeSkyDayEdgeHex,horizonHex:i.homeSkyHorizonHex};se(P,c,$?.starColourHex,d.skyMode,d.moonPhaseDeg,n,{starTempK:$?.tempK,starMassMsol:i.starMassMsol,starAgeGyr:i.starAgeGyr},i.skyStars||i.companionStars||[],{animatePrimaryPair:d.animatePrimaryPair})}}else{let n=C?.getBoundingClientRect?.();if(n&&P){let m=window.devicePixelRatio||1,z=Math.round(n.width*m),I=Math.round(n.height*m);P.width=z,P.height=I;let S=P.getContext("2d");S&&(S.fillStyle="#050818",S.fillRect(0,0,z,I),S.font=`italic ${12*m}px system-ui, sans-serif`,S.fillStyle="rgba(160,170,200,0.5)",S.textAlign="center",S.textBaseline="middle",S.fillText("Add planets to populate the sky comparison",z/2,I/2))}}}y?.addEventListener("change",()=>{d.homePlanetId=String(y.value||""),F(),f()}),R?.addEventListener("change",g=>{let v=g.target?.closest?.("input[data-distance-id]");if(!v)return;let i=String(v.dataset.distanceId||""),c=Number(v.value);!i||!Number.isFinite(c)||(d.distanceByBodyId[i]=c,f())}),de?.addEventListener("input",()=>{d.moonPhaseDeg=Number(b.value)||0,f()}),b?.addEventListener("change",()=>{d.moonPhaseDeg=Number(b.value)||0,f()}),o.addEventListener("change",g=>{g.target.name==="skyBg"&&(d.skyMode=g.target.value,f())}),_?.addEventListener("click",()=>{d.animatePrimaryPair=!d.animatePrimaryPair,f()}),C&&new ResizeObserver(()=>f()).observe(C),F(),b.value=String(d.moonPhaseDeg),b.dispatchEvent(new Event("input",{bubbles:!0})),f()}export{Le as initApparentPage};
