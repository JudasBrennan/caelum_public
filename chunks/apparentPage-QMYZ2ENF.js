import{a as B,b as N,e as J}from"./chunk-3TT4JFPX.js";import{e as G,f as W}from"./chunk-ZFAIBQGO.js";import"./chunk-QMDVIU2G.js";import{a as U}from"./chunk-WYZYYRUA.js";import"./chunk-EQDWXQUV.js";import"./chunk-LTA33HDN.js";import"./chunk-6RMECBMI.js";import"./chunk-EU33JWD3.js";import"./chunk-I5PS2ICZ.js";import"./chunk-6HRI5YJ3.js";import"./chunk-5LTXGN7J.js";import{a as K}from"./chunk-KYI55SIV.js";import{a as d,d as V}from"./chunk-L76EVWF4.js";import{b as h,c as A,e as I}from"./chunk-XMLMEZIZ.js";import"./chunk-LAMR64J5.js";import{La as q,za as T}from"./chunk-5NLRN7M6.js";import"./chunk-HTNOXS34.js";import"./chunk-47ATKL5F.js";import"./chunk-XFZMQA63.js";import{j as u}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function me(e){return e?h("span",{className:"tip-icon",attrs:{tabindex:"0",role:"note","aria-label":"Info"},dataset:{tip:e},text:"i"}):null}function m(e,a={}){return h("td",{attrs:a,text:e==null?"":String(e)})}function ue(e){return e?.angDiamArcmin!=null?`${Number(e.angDiamArcmin).toFixed(1)}\u2032`:e?.angDiamArcsec!=null?`${e.angDiamArcsec}\u2033`:"\u2014"}function ce(e){let a=String(e?.classLabel||"").trim(),n=String(e?.bodyTypeLabel||"").trim();return/brown dwarf/i.test(a)?a:n||a}function he(e){let a=h("input",{className:"cluster-name-input",attrs:{type:"number",min:e?.minDistanceAu,max:e?.maxDistanceAu,step:"0.001",title:`min ${u(e?.minDistanceAu,3)} AU, max ${u(e?.maxDistanceAu,3)} AU`},dataset:{distanceId:e?.id||""}});return a.value=String(e?.currentDistanceAu??""),a}function Q(e,a=[],n=""){let o=Array.isArray(a)?a:[];if(!o.length)return I(e,[{value:"",label:"No planets"}]),e.value="","";let l=new Set(o.map(y=>String(y?.id||"")).filter(Boolean)).has(String(n||""))?String(n||""):String(o[0]?.id||"");return I(e,o.map(y=>({value:y?.id||"",label:y?.name||y?.id||"Planet"}))),e.value=l,l}function Y(e,a=[],n={}){return A(e,(Array.isArray(a)?a:[]).map(o=>h("div",{className:"kpi-wrap"},[h("div",{className:"kpi"},[h("div",{className:"kpi__label"},[o?.label||"",n?.[o?.label]?" ":"",me(n?.[o?.label]||"")]),h("div",{className:"kpi__value",text:o?.value??""}),h("div",{className:"kpi__meta",text:o?.meta??""})])]))),e}function X(e,a=[]){return A(e,(Array.isArray(a)?a:[]).map(n=>h("tr",{},[m(n?.name),m(u(n?.orbitAu,4)),m(u(n?.magnitude,4)),m(u(n?.brightnessRelativeToEarthSun,6)),m(u(n?.apparentSizeRelativeToEarthSun,6)),m(n?.angularDiameterLabel)]))),e}function Z(e,a=[]){return A(e,(Array.isArray(a)?a:[]).map(n=>h("tr",{},[m(n?.name),m(ce(n)),h("td",{},[he(n)]),m(u(n?.phaseAngleDeg,2)),m(Number.isFinite(n?.apparentMagnitude)?u(n.apparentMagnitude,2):"NA"),m(n?.angularDiameterLabel),m(n?.observable),m(n?.visibility)]))),e}function ee(e,a=[]){let n=Array.isArray(a)?a:[];return n.length?(A(e,n.map(o=>h("tr",{},[m(o?.name),m(u(o?.absoluteMagnitude,4)),m(Number.isFinite(o?.apparentMagnitude)?u(o.apparentMagnitude,2):"Invisible"),m(o?.angularDiameterLabel),m(Number.isFinite(o?.brightnessRelativeToFullMoon)?u(o.brightnessRelativeToFullMoon,4):"NA"),m(u(o?.apparentSizeRelativeToReference,4)),m(o?.eclipseType)]))),e):(A(e,[h("tr",{},[m("No moons assigned to home world",{colspan:"7",style:"text-align:center;color:var(--muted)"})])]),e)}function ae(e,a=[]){return A(e,(Array.isArray(a)?a:[]).map(n=>h("tr",{},[m(n?.name),m(u(n?.appMag,2)),m(ue(n)),m(n?.note)]))),e}var R=null,te=new WeakMap;function ye(){return R||(R=import("./apparentSkyNativeThree-HKUQH2DY.js")),R}function ge(){return typeof window<"u"&&typeof document<"u"}function ne(e){return!!e&&ge()&&e.isConnected!==!1}function ie(e){let a=te.get(e);return a||(a={generation:0,disposed:!1},te.set(e,a)),a}function re(e,a,n,o,p,l,y,b,L={}){if(!ne(e))return;let w=ie(e);w.disposed=!1;let E=++w.generation;ye().then(_=>{w.disposed||w.generation!==E||!ne(e)||_.drawSkyCanvasNative(e,a,n,o,p,l,y,b,L)}).catch(_=>{console.error("[WorldSmith] Failed to load apparent-sky runtime:",_)})}function se(e){if(!e)return;let a=ie(e);a.disposed=!0;let n=++a.generation;R&&R.then(o=>{a.generation===n&&o.disposeSkyCanvasNative(e)}).catch(()=>{})}var s={"Home world":"Reference world used for apparent brightness and apparent size outputs.","Moon phase":`Phase angle applied to all moons uniformly. 0\xB0 = full (opposition), 180\xB0 = new (conjunction, invisible).

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

Pair-host worlds can show two primary suns in a static default sky view or animate them on demand in the sky canvas, while wider hierarchical companions are added using their host-frame separation as an approximate sky-distance reference.`};function be(e,a,n,o,p,l,y){let b=n?` <span class="unit">${n}</span>`:"";return`
    <div class="form-row">
      <div>
        <div class="label">${a}${b} ${d(y||"")}</div>
      </div>
      <div class="input-pair">
        <input id="${e}" type="number" step="${l}" aria-label="${a}" />
        <input id="${e}_slider" type="range" aria-label="${a} slider" />
        <div class="range-meta"><span id="${e}_min"></span><span id="${e}_max"></span></div>
      </div>
    </div>
  `}function ve(e){let a=(e?.primarySuns||[]).map(o=>o?.name).filter(Boolean),n=(e?.companionStars||[]).map(o=>o?.name).filter(Boolean);return a.length&&n.length?`Primary suns: ${a.join(", ")}. Companion suns: ${n.join(", ")}.`:a.length>1?`Primary suns: ${a.join(", ")}`:a.length===1?a[0]:n.length?`Companion suns: ${n.join(", ")}`:"single-star sky"}var fe=[{title:"Getting Started",body:"The Apparent Size page calculates how celestial objects look from your home world \u2014 angular diameter, apparent magnitude, and visibility based on real optics."},{title:"Sky Canvas",body:"The canvas at the top compares angular sizes at true proportions. Tiny objects use logarithmic scaling so they remain visible. Sol reference sizes are shown for comparison."},{title:"Object Tables",body:"Tables list apparent magnitude, angular diameter, phase angle, and illuminated fraction for every planet, giant companion, and moon in your system."},{title:"Phase Functions",body:"Four body types use different scattering models: rocky airless, rocky with atmosphere, gas giant / brown dwarf, and tiny body. Phase angles above 160\xB0 are flagged as too extreme to observe."}];function Le(e){let a=T(),n=B(a,{mode:N.apparentSelectors}),p={homePlanetId:q(a)?.id||Object.keys(n.planetsById||{})[0]||"",moonPhaseDeg:0,distanceByBodyId:{},skyMode:"night",animatePrimaryPair:!1},l=document.createElement("div");l.className="page",l.innerHTML=`
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
              <div class="label">Home world ${d(s["Home world"])}</div>
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
      <div class="panel__header"><h2>Angular Size Comparison ${d(s["Sky canvas"])}</h2></div>
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
                <th>Object ${d(s.Object)}</th>
                <th>Orbit (AU) ${d(s["Orbit (AU)"])}</th>
                <th>Star Magnitude ${d(s["Star Magnitude"])}</th>
                <th>Brightness (Earth-sun = 1) ${d(s["Brightness (Earth-sun = 1)"])}</th>
                <th>Apparent Size (Earth-sun = 1) ${d(s["Apparent Size (Earth-sun = 1)"])}</th>
                <th>Angular Diameter ${d(s["Angular diameter"])}</th>
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
                <th>Object ${d(s.Object)}</th>
                <th>Type ${d(s["Body type"])}</th>
                <th>Distance (AU) ${d(s["Distance (AU)"])}</th>
                <th>Phase (deg) ${d(s["Phase (deg)"])}</th>
                <th>Magnitude ${d(s.Magnitude)}</th>
                <th>Angular Diameter ${d(s["Angular diameter"])}</th>
                <th>Observable ${d(s.Observable)}</th>
                <th>Visibility ${d(s.Visibility)}</th>
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
                <th>Moon ${d(s.Moon)}</th>
                <th>Abs Mag ${d(s["Moon absolute magnitude"])}</th>
                <th>App Mag ${d(s["App Mag"])}</th>
                <th>Angular Diameter ${d(s["Angular diameter"])}</th>
                <th>Brightness (full moon = 1) ${d(s["Brightness (full moon = 1)"])}</th>
                <th>Size (moon = 1) ${d(s["Size (moon = 1)"])}</th>
                <th>Eclipses ${d(s.Eclipses)}</th>
              </tr>
            </thead>
            <tbody id="apparentMoonRows"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header"><h2>Sol System References ${d(s["Sol references"])}</h2></div>
      <div class="panel__body">
        <div class="hint">Familiar Solar System objects for comparison.</div>
        <div class="cluster-table-wrap" style="max-height:260px">
          <table class="cluster-table">
            <thead>
              <tr>
                <th>Object ${d(s.Object)}</th>
                <th>Apparent Magnitude ${d(s["Apparent Magnitude"])}</th>
                <th>Angular Size ${d(s["Angular Size"])}</th>
                <th>Note ${d(s.Note)}</th>
              </tr>
            </thead>
            <tbody id="apparentSolRefRows"></tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.innerHTML="",e.appendChild(l),V(l),K({steps:fe,storageKey:"worldsmith.apparent.tutorial",container:l,triggerBtn:l.querySelector("#apparentTutorials")});let y=l.querySelector("#apparentHomePlanet"),b=l.querySelector("#apparentMoonPhase"),L=l.querySelector("#apparentKpis"),w=l.querySelector("#apparentStarRows"),E=l.querySelector("#apparentBodyRows"),_=l.querySelector("#apparentMoonRows"),oe=l.querySelector("#apparentSolRefRows"),P=l.querySelector("#skyCanvas"),C=l.querySelector("#skyCanvasWrap"),D=l.querySelector("#skyCanvasHint"),x=l.querySelector("#skyPairAnimationToggle"),le=!0,H=new MutationObserver(()=>{if(!l.isConnected){se(P);try{H.disconnect()}catch{}}});H.observe(document.body,{childList:!0,subtree:!0});let de=l.querySelector("#apparentMoonPhase_slider");pe("apparentMoonPhase",b,0,180,1,"auto");function pe(g,v,i,c,j,M){let k=l.querySelector(`#${g}_slider`),$=l.querySelector(`#${g}_min`),t=l.querySelector(`#${g}_max`);$.textContent=String(i),t.textContent=String(c),U({numberEl:v,sliderEl:k,min:i,max:c,step:j,mode:M})}function F(){let g=B(T(),{mode:N.apparentSelectors}),v=Object.values(g.planetsById||{});p.homePlanetId=Q(y,v,p.homePlanetId)}function f(){let g=T(),v=B(g,{mode:N.apparentPage}),i=J(v,{homePlanetId:p.homePlanetId,distanceByBodyId:p.distanceByBodyId,moonPhaseDeg:p.moonPhaseDeg}),c=G({starMassMsol:i.starMassMsol,homeOrbitAu:i.homeOrbitAu,orbitSamples:i.orbitSamples.filter(t=>t.id!==`planet:${p.homePlanetId}`),bodySamples:i.bodySamples,moonSamples:i.moonSamples});if(i.hasLivePrimaryPair||(p.animatePrimaryPair=!1),x){let t=!!i.hasLivePrimaryPair;x.hidden=!t,x.setAttribute("aria-pressed",p.animatePrimaryPair?"true":"false"),x.textContent=p.animatePrimaryPair?"Pause primary suns":"Animate primary suns"}c.moons.forEach((t,r)=>{i.moonSamples[r]?.moonCalc&&(t.moonCalc=i.moonSamples[r].moonCalc)});let j=new Map(i.bodySamples.map(t=>[t.id,t]));c.bodiesFromHome.forEach(t=>{let r=j.get(t.id);r&&(r._derived&&(t._derived=r._derived),r._planetInputs&&(t._planetInputs=r._planetInputs),r._styleId&&(t._styleId=r._styleId),r._visualProfile&&(t._visualProfile=r._visualProfile),r._gasProfile&&(t._gasProfile=r._gasProfile),r._visualDescriptor&&(t._visualDescriptor=r._visualDescriptor),r._visualSubtypeKey&&(t._visualSubtypeKey=r._visualSubtypeKey),r._visualOverrideSignature&&(t._visualOverrideSignature=r._visualOverrideSignature),r._visualRenderSignature&&(t._visualRenderSignature=r._visualRenderSignature),r.renderFamily&&(t.renderFamily=r.renderFamily),r.classLabel&&(t.classLabel=r.classLabel))});let M=[...c.bodiesFromHome].filter(t=>Number.isFinite(t.apparentMagnitude)).sort((t,r)=>t.apparentMagnitude-r.apparentMagnitude)[0],k=[...c.moons].filter(t=>Number.isFinite(t.apparentMagnitude)).sort((t,r)=>t.apparentMagnitude-r.apparentMagnitude)[0];if(Y(L,[{label:"Star absolute magnitude",value:u(c.star.absoluteMagnitude,3),meta:"M"},{label:"Home orbit",value:u(i.homeOrbitAu,3),meta:"AU"},{label:"Home star magnitude",value:u(c.starByOrbit[0]?.magnitude,3),meta:"at home"},{label:"Brightest object",value:M?M.name:"-",meta:M?`${u(M.apparentMagnitude,2)} mag`:"-"},{label:"Brightest moon",value:k?k.name:"-",meta:k?`${u(k.apparentMagnitude,2)} mag`:c.moons.length?"All invisible at this phase":"No moons"},{label:"Moon count",value:String(c.moons.length),meta:"assigned to home world"},{label:"Visible suns",value:String(i.visibleSunsCount??1+(i.companionStars?.length||0)),meta:ve(i)}],s),X(w,c.starByOrbit),c.bodiesFromHome.forEach(t=>{p.distanceByBodyId[t.id]=t.currentDistanceAu}),Z(E,c.bodiesFromHome),ee(_,c.moons),ae(oe,W),D){let t="";i.hasLivePrimaryPair&&p.animatePrimaryPair&&i.hasApproximateCompanionSuns?t="Live pair phase: primary suns follow the local binary orbit on a compressed simulation timescale, while companion suns use host-frame separation as an approximate sky-distance reference.":i.hasLivePrimaryPair&&p.animatePrimaryPair?t="Live pair phase: the two primary suns follow the local binary orbit on a compressed simulation timescale.":i.hasLivePrimaryPair&&i.hasApproximateCompanionSuns?t="Static pair view by default. Use Animate primary suns to play the local binary orbit on a compressed simulation timescale; companion suns use host-frame separation as an approximate sky-distance reference.":i.hasLivePrimaryPair?t="Static pair view by default. Use Animate primary suns to play the local binary orbit on a compressed simulation timescale.":i.hasApproximatePrimarySuns?t="Schematic sky layout: local multi-primary host suns are grouped for readability and are not phase-resolved.":i.hasApproximateCompanionSuns&&(t=i.primarySuns?.length>1?"Schematic sky layout: primary suns are drawn together, while companion suns use host-frame separation as an approximate sky-distance reference.":"Schematic sky layout: companion suns use host-frame separation as an approximate sky-distance reference."),D.textContent=t,D.hidden=!t}let $=i.starModel;if(p.homePlanetId){if(le){let t={dayHex:i.homeSkyDayHex,dayEdgeHex:i.homeSkyDayEdgeHex,horizonHex:i.homeSkyHorizonHex};re(P,c,$?.starColourHex,p.skyMode,p.moonPhaseDeg,t,{starTempK:$?.tempK,starMassMsol:i.starMassMsol,starAgeGyr:i.starAgeGyr},i.skyStars||i.companionStars||[],{animatePrimaryPair:p.animatePrimaryPair})}}else{let t=C?.getBoundingClientRect?.();if(t&&P){let r=window.devicePixelRatio||1,z=Math.round(t.width*r),O=Math.round(t.height*r);P.width=z,P.height=O;let S=P.getContext("2d");S&&(S.fillStyle="#050818",S.fillRect(0,0,z,O),S.font=`italic ${12*r}px system-ui, sans-serif`,S.fillStyle="rgba(160,170,200,0.5)",S.textAlign="center",S.textBaseline="middle",S.fillText("Add planets to populate the sky comparison",z/2,O/2))}}}y?.addEventListener("change",()=>{p.homePlanetId=String(y.value||""),F(),f()}),E?.addEventListener("change",g=>{let v=g.target?.closest?.("input[data-distance-id]");if(!v)return;let i=String(v.dataset.distanceId||""),c=Number(v.value);!i||!Number.isFinite(c)||(p.distanceByBodyId[i]=c,f())}),de?.addEventListener("input",()=>{p.moonPhaseDeg=Number(b.value)||0,f()}),b?.addEventListener("change",()=>{p.moonPhaseDeg=Number(b.value)||0,f()}),l.addEventListener("change",g=>{g.target.name==="skyBg"&&(p.skyMode=g.target.value,f())}),x?.addEventListener("click",()=>{p.animatePrimaryPair=!p.animatePrimaryPair,f()}),C&&new ResizeObserver(()=>f()).observe(C),F(),b.value=String(p.moonPhaseDeg),b.dispatchEvent(new Event("input",{bubbles:!0})),f()}export{Le as initApparentPage};
