import{a as v,b as h,c as y}from"./chunk-XCN227BY.js";import"./chunk-24KHYB4L.js";import"./chunk-VC46IEJQ.js";function t(n,i,a=null){let l=null;return async()=>(l??(l=n().then(c=>{let u=c?.[i];if(typeof u!="function")throw new Error(`Lesson module is missing ${i}.`);let m=a&&typeof c?.[a]=="function"?c[a]:null;return{build:u,wire:m}})),l)}var p=[{unit:"Stars",lessons:[{id:"L01",num:1,title:"What Is a Star?",subtitle:"Mass, luminosity, and the master variable",load:t(()=>import("./L01_starBasics-GN4VLMWS.js"),"buildLesson01","wireLesson01")},{id:"L02",num:2,title:"Classifying Stars",subtitle:"Spectral types and the colour-temperature link",load:t(()=>import("./L02_spectralTypes-ZD4Y2F3F.js"),"buildLesson02")},{id:"L03",num:3,title:"Stellar Luminosity",subtitle:"The mass-luminosity relation",load:t(()=>import("./L03_luminosity-O45CZRAX.js"),"buildLesson03","wireLesson03")},{id:"L04",num:4,title:"Stellar Evolution",subtitle:"From birth to giant branch",load:t(()=>import("./L04_stellarEvolution-CJFRRMTZ.js"),"buildLesson04")},{id:"L05",num:5,title:"The Habitable Zone",subtitle:"Where liquid water can exist",load:t(()=>import("./L05_habitableZone-SVDKWKQZ.js"),"buildLesson05","wireLesson05")}]},{unit:"Orbits & Systems",lessons:[{id:"L06",num:6,title:"Orbital Mechanics",subtitle:"Kepler's laws and elliptical orbits",load:t(()=>import("./L06_orbitalMechanics-NN65LRXD.js"),"buildLesson06")},{id:"L07",num:7,title:"Planetary Systems",subtitle:"Frost lines, spacing, and architecture",load:t(()=>import("./L07_planetarySystems-TXMSV763.js"),"buildLesson07")}]},{unit:"Terrestrial Worlds",lessons:[{id:"L08",num:8,title:"Rocky Planets",subtitle:"Composition, density, and gravity",load:t(()=>import("./L08_rockyPlanets-CDU3HZ7K.js"),"buildLesson08","wireLesson08")},{id:"L09",num:9,title:"Atmospheres",subtitle:"Pressure, escape, and outgassing",load:t(()=>import("./L09_atmospheres-QOB6DZZW.js"),"buildLesson09")},{id:"L10",num:10,title:"Surface Temperature",subtitle:"Energy balance and the greenhouse effect",load:t(()=>import("./L10_surfaceTemperature-6SHES6M7.js"),"buildLesson10","wireLesson10")}]},{unit:"Giants & Moons",lessons:[{id:"L11",num:11,title:"Gas Giants",subtitle:"Mass-radius relations and cloud layers",load:t(()=>import("./L11_gasGiants-YTPA63BA.js"),"buildLesson11","wireLesson11")},{id:"L12",num:12,title:"Moons & Tides",subtitle:"Roche limits, Hill spheres, and tidal heating",load:t(()=>import("./L12_moonsTides-KVK2CR6H.js"),"buildLesson12","wireLesson12")}]},{unit:"Surface & Climate",lessons:[{id:"L13",num:13,title:"Interiors & Tectonics",subtitle:"Plates, mountains, and volcanism",load:t(()=>import("./L13_tectonics-RYGJRRLL.js"),"buildLesson13")},{id:"L14",num:14,title:"Climate Zones",subtitle:"K\xF6ppen classification and circulation",load:t(()=>import("./L14_climateZones-X4I2LXGO.js"),"buildLesson14")}]},{unit:"The Wider Universe",lessons:[{id:"L15",num:15,title:"Stellar Activity",subtitle:"Flares, CMEs, and habitability",load:t(()=>import("./L15_stellarActivity-LXWJM6T5.js"),"buildLesson15","wireLesson15")},{id:"L16",num:16,title:"Observing the Sky",subtitle:"Magnitudes, brightness, and visibility",load:t(()=>import("./L16_observing-MBWH342Y.js"),"buildLesson16","wireLesson16")},{id:"L17",num:17,title:"Calendars & Time",subtitle:"Days, months, years, and leap cycles",load:t(()=>import("./L17_calendars-BWKJR72W.js"),"buildLesson17","wireLesson17")},{id:"L18",num:18,title:"Population & Civilisation",subtitle:"Carrying capacity and growth",load:t(()=>import("./L18_population-TAYUKJ6I.js"),"buildLesson18")},{id:"L19",num:19,title:"The Local Cluster",subtitle:"Stellar neighbourhoods and multiplicity",load:t(()=>import("./L19_localCluster-AUMVVG54.js"),"buildLesson19")},{id:"L20",num:20,title:"Debris & Small Bodies",subtitle:"Rings, asteroids, and resonance sculpting",load:t(()=>import("./L20_debrisDisks-VEOK2XTC.js"),"buildLesson20")}]}];var g="worldsmith.lessons.mode";function f(){try{if(localStorage.getItem(g)==="advanced")return"advanced"}catch{}return"basic"}function S(n){try{localStorage.setItem(g,n)}catch{}}function _(){return p.map(n=>`
    <div class="les-toc__unit">
      <div class="les-toc__unit-title">${n.unit}</div>
      <div class="les-toc__links">
        ${n.lessons.map(i=>`<a class="les-toc__link" data-target="${i.id}">${i.num}. ${i.title}</a>`).join("")}
      </div>
    </div>`).join("")}function M(){return p.map(n=>`<div class="les-unit-divider">${n.unit}</div>`+n.lessons.map(i=>`
      <details class="les-section" id="les-${i.id}">
        <summary class="les-section__summary">
          <span class="les-section__number">${i.num}</span>
          <span class="les-section__title">${i.title}</span>
          <span class="les-section__meta">${i.subtitle}</span>
        </summary>
        <div class="les-section__body" data-lesson="${i.id}"></div>
      </details>`).join("")).join("")}function k(n){let i=f(),a=0,l=document.createElement("div");l.className="page",l.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title">
          <span class="ws-icon icon--lessons" aria-hidden="true"></span>
          <span>Lessons</span>
        </h1>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="physics-duo-toggle les-mode-toggle" id="lessonModeToggle">
            <input type="radio" name="lessonMode" id="lesModeBasic" value="basic" ${i!=="advanced"?"checked":""} />
            <label for="lesModeBasic">Basic</label>
            <input type="radio" name="lessonMode" id="lesModeAdvanced" value="advanced" ${i==="advanced"?"checked":""} />
            <label for="lesModeAdvanced">Advanced</label>
            <span></span>
          </div>
          <div class="badge">Educational</div>
        </div>
      </div>
      <div class="panel__body">
        <p style="color:var(--muted);font-size:13px;margin:0 0 4px">
          A progressive curriculum covering every scientific concept in WorldSmith.
          Work through the units in order, or jump to any topic.
        </p>
        ${_()}
      </div>
    </div>

    <div class="les-sections">${M()}</div>
  `,n.innerHTML="",n.appendChild(l);let c=p.flatMap(e=>e.lessons),u=Object.fromEntries(c.map(e=>[e.id,e]));async function m(e){let o=u[e];if(!o)return;let s=l.querySelector(`.les-section__body[data-lesson="${e}"]`);if(!s)return;let d=++a;s.dataset.lessonState="loading",s.innerHTML='<div class="hint">Loading lesson...</div>';let b;try{b=await o.load()}catch(r){if(d!==a||!s.isConnected)return;s.dataset.lessonState="error",s.innerHTML='<div class="hint">Lesson content failed to load.</div>',console.error(`[WorldSmith] Failed to load lesson ${e}:`,r);return}if(!(d!==a||!s.isConnected)){s.innerHTML=b.build(i),s.dataset.lessonState="ready";try{b.wire?.(s)}catch(r){console.error(`[WorldSmith] Failed to wire lesson ${e}:`,r)}i==="advanced"&&v().then(r=>{d!==a||!s.isConnected||h(s,r)}).catch(r=>{console.error(`[WorldSmith] Failed to load KaTeX for lesson ${e}:`,r)})}}let L=l.querySelectorAll(".les-section");L.forEach(e=>{e.addEventListener("toggle",()=>{if(!e.open)return;L.forEach(s=>{s!==e&&s.open&&(s.open=!1)});let o=e.id.replace("les-","");m(o),y(e,{block:"start"})})}),l.querySelectorAll(".les-toc__link").forEach(e=>{e.addEventListener("click",o=>{o.preventDefault();let s=e.dataset.target,d=l.querySelector(`#les-${s}`);d&&(d.open=!0)})}),l.querySelector("#lessonModeToggle").addEventListener("change",e=>{i=e.target.value,S(i);let o=l.querySelector(".les-section[open]");if(o){let s=o.id.replace("les-","");m(s)}})}export{k as initLessonsPage};
