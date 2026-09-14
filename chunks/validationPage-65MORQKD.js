import{a as q}from"./chunk-BIPAQZBG.js";import{d as u}from"./chunk-GMGQAEBO.js";import{a as y,c as P,d as T,g as H}from"./chunk-H2TA4Z36.js";import{a as s}from"./chunk-4DOSHAKO.js";import{b as k}from"./chunk-TR2TDQN3.js";import"./chunk-WLUJ3GDC.js";var C=Object.freeze([{dataUrl:u("reports/science-verification-matrix.json"),htmlUrl:u("reports/science-verification-matrix.html"),markdownUrl:u("reports/science-verification-matrix.md")},{dataUrl:u("test-results/science-verification-matrix.json"),htmlUrl:u("test-results/science-verification-matrix.html"),markdownUrl:u("test-results/science-verification-matrix.md")},{dataUrl:u("reports/model-calibration-report.json"),htmlUrl:u("reports/model-calibration-report.html"),markdownUrl:u("reports/model-calibration-report.md")},{dataUrl:u("test-results/model-calibration-report.json"),htmlUrl:u("test-results/model-calibration-report.html"),markdownUrl:u("test-results/model-calibration-report.md")}]),O=Object.freeze({PASS:"Pass",WARN:"Warning",FAIL:"Failure",GAP:"Modeling gap",INFO:"Info",BLOCKED:"Blocked",OK:"Pass",CHECK:"Needs calibration"}),j=100,V=Object.freeze([{id:"issues",label:"Issues"},{id:"failures",label:"Failures"},{id:"warnings",label:"Warnings"},{id:"gaps",label:"Gaps"},{id:"release-gates",label:"Release gates"},{id:"nasa-anchors",label:"NASA anchors"},{id:"user-visible",label:"User-visible"}]),D=Object.freeze({anchor:"Anchor",invariant:"Invariant",metamorphic:"Metamorphic",boundary:"Boundary","cross-system":"Cross-system",unit:"Unit",oracle:"Oracle",sensitivity:"Sensitivity",population:"Population",browser:"Browser","source-coverage":"Source coverage","release-gate":"Release gate"}),z=Object.freeze([{term:"Benchmark anchors",definition:"Direct comparisons against trusted published reference values, such as NASA/JPL or peer-reviewed benchmark cases."},{term:"Invariants",definition:"Physical rules that should always hold, such as positive masses, normalized fractions, and stable unit relationships."},{term:"Trend checks",definition:"Metamorphic tests that confirm outputs move in the expected direction when one physical input is changed."},{term:"Boundary checks",definition:"Regime-edge tests around thresholds such as phase changes, stability limits, escape limits, and classification boundaries."},{term:"Cross-system coupling",definition:"Checks that one model's output is carried into downstream models that should physically depend on it."},{term:"Units",definition:"Dimensional and conversion checks that catch scale errors between AU, km, Earth units, solar units, SI units, years, and days."},{term:"Independent formula oracles",definition:"Small standalone calculations used to verify core equations without relying on the same implementation path as the engine."},{term:"Sensitivity",definition:"Perturbation checks that make sure small input changes produce bounded, explainable output changes."},{term:"Population sanity",definition:"Generated-world checks that catch unrealistic distributions, missing regimes, or guided outputs outside expected physical ranges."},{term:"Browser coverage",definition:"Production-bundle checks that confirm the user-visible app can load, render, import, export, and navigate with the matrix in place."},{term:"Release gate",definition:"A required command or review step that must pass before release, including regression tests, matrix generation, build, bundle budget, and browser smoke tests."}]);function L(e){return String(e??"").trim().toLowerCase()}function h(e){return[...new Set(e.map(i=>String(i??"").trim()).filter(Boolean))].sort((i,t)=>i.localeCompare(t))}function F(e,i=e){return`<option value="${s(e)}">${s(i)}</option>`}function _(e,i,t={}){return[F("",i),...e.map(r=>F(r,t[r]||r))].join("")}function W(e){return O[e]||e||"Unknown"}function E(e){return D[e]||e||"Unknown"}function g(e,i,t=""){return`<div class="validation-kpi ${t}">
    <div class="validation-kpi__value">${s(i)}</div>
    <div class="validation-kpi__label">${s(e)}</div>
  </div>`}function Q(){return`<dl class="validation-term-list">
    ${z.map(({term:e,definition:i})=>`<div class="validation-term-list__item">
        <dt>${s(e)}</dt>
        <dd>${s(i)}</dd>
      </div>`).join("")}
  </dl>`}function J(){return`<div class="validation-quick-filters" aria-label="Quick filters">
    ${V.map(e=>`<button type="button" class="validation-filter-chip" data-validation-quick-filter="${s(e.id)}">${s(e.label)}</button>`).join("")}
    <button type="button" class="validation-filter-chip validation-filter-chip--clear" data-validation-quick-filter="">All rows</button>
  </div>`}function N(e,i=[]){let t=(Array.isArray(i)?i:[i]).map(r=>String(r??"").trim()).filter(Boolean);return`<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">${s(e)}</div>
    ${t.length?`<ul>${t.map(r=>`<li>${s(r)}</li>`).join("")}</ul>`:'<p class="hint">None recorded.</p>'}
  </div>`}function X(e=[]){let i=(Array.isArray(e)?e:[e]).map(t=>String(t??"").trim()).filter(Boolean);return`<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">Source URLs</div>
    ${i.length?`<ul>${i.map(t=>`<li><a href="${s(t)}" target="_blank" rel="noopener noreferrer">${s(t)}</a></li>`).join("")}</ul>`:'<p class="hint">No source URL attached to this row.</p>'}
  </div>`}function Y(e,i=""){return[e.modelAreaId,i,e.family,e.subject,e.metric,e.inputSummary,e.output,e.expected,e.tolerance,e.status,e.severity,e.confidence,e.comparisonSemantics,e.sourceClass,e.action,...e.sourceUrls||[],...e.assumptions||[],...e.limitations||[],...e.downstreamConsumers||[]].map(t=>String(t??"")).join(" ").toLowerCase()}function Z(e){return e.issueKind?e.issueKind:e.status==="CHECK"?"hard-issue":e.status==="GAP"?"modeling-gap":e.status==="INFO"?"info":"ok"}function ee(e){let t=(Array.isArray(e.rows)?e.rows:[]).map((a,o)=>({id:`previous-calibration-${o}`,modelAreaId:a.category||"Previous calibration",family:"anchor",subject:a.object||"",metric:a.metric||"",inputSummary:a.input||"",output:a.output||"",expected:a.reference||"",tolerance:a.toleranceDisplay||"",status:a.status==="OK"?"PASS":a.status==="CHECK"?"FAIL":a.status||"INFO",severity:a.status==="CHECK"?"high":a.status==="GAP"?"medium":"info",confidence:a.highUncertaintyWithinBroadTolerance?"low":"medium",comparisonSemantics:a.comparisonSemantics||Z(a),sourceClass:a.solarSystemAnchor?"NASA":a.sourceCategory||"Previous calibration",sourceUrls:[],assumptions:[a.modelQuantityKind,a.referenceQuantityKind].filter(Boolean),limitations:[a.uncertaintyKind,a.note].filter(Boolean),downstreamConsumers:[],action:a.calibrationAction||"",userVisible:!0})),r=Object.fromEntries(h(t.map(a=>a.modelAreaId)).map(a=>[a,a]));return{schemaVersion:1,generatedAt:e.generatedAt,generatedBy:e.generatedBy||"previous calibration report",scope:e.scope||"Previous benchmark-only calibration report.",interpretation:e.interpretation||"These rows are benchmark anchors from the previous calibration report format.",headlineCounts:{modelAreas:Object.keys(r).length,verificationRows:t.length,passedRows:t.filter(a=>a.status==="PASS").length,warningRows:0,failedRows:t.filter(a=>a.status==="FAIL").length,gapRows:t.filter(a=>a.status==="GAP").length,blockedRows:0,infoRows:t.filter(a=>a.status==="INFO").length,releaseGatesPassed:0,releaseGatesFailed:0},filters:{modelAreaLabels:r,modelAreas:Object.keys(r),families:["anchor"],statuses:h(t.map(a=>a.status)),severities:h(t.map(a=>a.severity)),sourceClasses:h(t.map(a=>a.sourceClass)),confidences:h(t.map(a=>a.confidence))},modelAreas:Object.entries(r).map(([a,o])=>({id:a,label:o,trustLevel:"bounded",registryKeys:[],coverageSummary:{anchor:!0}})),verificationRows:t,rows:t,releaseGates:[],openGaps:t.filter(a=>a.status==="GAP"||a.status==="FAIL"),recommendations:[{priority:"transition",text:"Regenerate the Science Verification Matrix to replace this previous report."}]}}function te(e){return Array.isArray(e.verificationRows)?{...e,rows:e.verificationRows,filters:{...e.filters,modelAreaLabels:e.filters?.modelAreaLabels||Object.fromEntries((e.modelAreas||[]).map(i=>[i.id,i.label]))}}:ee(e)}function K(e){let i=String(e.status||"INFO").toLowerCase();return`<span class="validation-status validation-status--${s(i)}">${s(W(e.status))}</span>`}function ae(e){return`<div class="validation-row-detail">
    <div class="validation-row-detail__summary">
      <div>
        <div class="validation-row-detail__label">Input summary</div>
        <p>${s(e.inputSummary||"No input summary recorded.")}</p>
      </div>
      <div>
        <div class="validation-row-detail__label">Tolerance</div>
        <p>${s(e.tolerance||"No tolerance recorded.")}</p>
      </div>
      <div>
        <div class="validation-row-detail__label">Action</div>
        <p>${s(e.action||"No action recorded.")}</p>
      </div>
    </div>
    <div class="validation-row-detail__grid">
      ${X(e.sourceUrls||[])}
      ${N("Assumptions",e.assumptions||[])}
      ${N("Limitations",e.limitations||[])}
      ${N("Downstream consumers",e.downstreamConsumers||[])}
    </div>
  </div>`}function ie(e){let i=e.coverageSummary||{},t=Object.entries(i).filter(([,r])=>r);return t.length?t.map(([r])=>`<span class="badge">${s(E(r))}</span>`).join(" "):'<span class="hint">No direct rows yet</span>'}function se(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
    <table>
      <caption>Model area coverage</caption>
      <thead>
        <tr>
          <th>Model area</th>
          <th>Trust</th>
          <th>Registry keys</th>
          <th>Verification families</th>
        </tr>
      </thead>
      <tbody>${e.map(t=>`<tr>
        <td>${s(t.label||t.id)}</td>
        <td>${s(t.trustLevel||"bounded")}</td>
        <td>${s((t.registryKeys||[]).join(", ")||"n/a")}</td>
        <td>${ie(t)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:""}function ne(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
    <table>
      <caption>Release gates</caption>
      <thead>
        <tr>
          <th>Gate</th>
          <th>Command</th>
          <th>Status</th>
          <th>Recorded result</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>${e.map(t=>`<tr>
        <td>${s(t.subject)}</td>
        <td>${s(t.inputSummary)}</td>
        <td>${K(t)}</td>
        <td>${s(t.output)}</td>
        <td>${s(t.action)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:'<p class="hint">No release gate rows were recorded in this artifact.</p>'}function re(e,i,t){let a=`${`validation-row-${t}`}-details`;return`<tr
    class="validation-calibration-row validation-verification-row"
    data-row-index="${t}"
    data-search="${s(Y(e,i))}"
    data-model-area="${s(e.modelAreaId||"")}"
    data-family="${s(e.family||"")}"
    data-status="${s(e.status||"")}"
    data-severity="${s(e.severity||"")}"
    data-source-class="${s(e.sourceClass||"")}"
    data-confidence="${s(e.confidence||"")}"
    data-user-visible="${e.userVisible?"true":"false"}"
  >
    <td>
      <button
        type="button"
        class="validation-row-toggle"
        data-validation-row-toggle="${t}"
        aria-expanded="false"
        aria-controls="${s(a)}"
      >Details</button>
    </td>
    <td>${s(i||e.modelAreaId)}</td>
    <td>${s(E(e.family))}</td>
    <td>${s(e.subject)}</td>
    <td>${s(e.metric)}</td>
    <td>${K(e)}</td>
    <td>${s(e.severity)}</td>
    <td>${s(e.sourceClass)}</td>
  </tr>
  <tr
    id="${s(a)}"
    class="validation-verification-details-row"
    data-row-details="${t}"
    hidden
  >
    <td colspan="8">${ae(e)}</td>
  </tr>`}function le(e){e.className="page validation-page",e.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title">
          <span class="ws-icon icon--validation" aria-hidden="true"></span>
          <span>Validation</span>
        </h1>
        <div class="badge">Science Matrix</div>
      </div>
      <div class="panel__body">
        <p>
          Caelum verifies science with benchmark anchors, physical
          invariants, trend checks, boundary checks, cross-system coupling,
          unit checks, formula oracles, population checks, and release gates.
        </p>
        <p class="hint">
          The release bundle includes this matrix as prebuilt static data and
          refreshes it during release preparation.
        </p>
        <div class="validation-actions">
          <a class="validation-action validation-action--accent" data-validation-html href="${s(C[0].htmlUrl)}" target="_blank" rel="noopener noreferrer">Standalone HTML</a>
          <a class="validation-action" data-validation-markdown href="${s(C[0].markdownUrl)}" target="_blank" rel="noopener noreferrer">Markdown</a>
          <a class="validation-action" href="#/science">Science &amp; Maths</a>
        </div>
      </div>
    </div>
    <div class="validation-report" data-validation-content>
    </div>
  `,e.querySelector("[data-validation-content]")?.replaceChildren(oe())}function oe(){return H({label:"Loading science verification matrix",className:"validation-report-skeleton",children:[P({count:8}),k("div",{className:"panel validation-matrix-panel"},[k("div",{className:"panel__header",attrs:{"aria-hidden":"true"}},[y({className:"skeleton-line",width:"34%",height:18}),y({className:"skeleton-page__button",width:84,height:28})]),k("div",{className:"panel__body"},[k("div",{className:"validation-controls",attrs:{"aria-hidden":"true"}},[y({className:"skeleton-page__search",width:"32%",height:38}),y({className:"skeleton-page__button",width:128,height:38}),y({className:"skeleton-page__button",width:116,height:38}),y({className:"skeleton-page__button",width:104,height:38})]),T({columns:8,rows:8})])])]})}function de(e,i){e.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Report Unavailable</h2>
      </div>
      <div class="panel__body">
        <p>The prebuilt science verification matrix could not be loaded.</p>
        <p class="hint">${s(i?.message||i)}</p>
        <p class="hint">Run <code>npm run science:verify</code> and rebuild the app to refresh the release artifact.</p>
      </div>
    </div>
  `}function B(e,i){let t=te(i),r=e.querySelector("[data-validation-content]"),a=t.headlineCounts||{},o=Array.isArray(t.rows)?t.rows:[],$=t.filters?.modelAreaLabels||{},w=t.filters?.modelAreas?.length?t.filters.modelAreas:h(o.map(n=>n.modelAreaId)),A=t.filters?.families?.length?t.filters.families:h(o.map(n=>n.family)),R=t.filters?.statuses?.length?t.filters.statuses:h(o.map(n=>n.status)),p=t.filters?.severities?.length?t.filters.severities:h(o.map(n=>n.severity)),m=t.filters?.sourceClasses?.length?t.filters.sourceClasses:h(o.map(n=>n.sourceClass)),U=e.querySelector("[data-validation-html]"),x=e.querySelector("[data-validation-markdown]");U&&t.artifactHtmlUrl&&(U.href=t.artifactHtmlUrl),x&&t.artifactMarkdownUrl&&(x.href=t.artifactMarkdownUrl),r.innerHTML=`
    <div class="validation-kpis" aria-label="Science verification headline counts">
      ${g("Model areas",a.modelAreas??t.modelAreas?.length??0)}
      ${g("Verification rows",a.verificationRows??o.length)}
      ${g("Pass",a.passedRows??o.filter(n=>n.status==="PASS").length,"validation-kpi--ok")}
      ${g("Warnings",a.warningRows??o.filter(n=>n.status==="WARN").length)}
      ${g("Failures",a.failedRows??o.filter(n=>n.status==="FAIL").length,"validation-kpi--check")}
      ${g("Modeling gaps",o.some(n=>n.family==="model-limitation")?a.gapRows??o.filter(n=>n.status==="GAP").length:"Not assessed","validation-kpi--gap")}
      ${g("Blocked",a.blockedRows??o.filter(n=>n.status==="BLOCKED").length)}
      ${g("Release gates passed",a.releaseGatesPassed??0)}
    </div>

    <p class="hint">Pass counts describe checks, not an accuracy percentage. Source-model fidelity compares against the source calculation; empirical calibration compares published anchors. Accepted modelling gaps remain visible. <a href="#/science">Read model assumptions</a>.</p>
    <details><summary>Evidence and spectral support coverage</summary>
      ${[...new Set(o.map(n=>n.evidenceType).filter(Boolean))].map(n=>`<p>${s(n)}: ${o.filter(f=>f.evidenceType===n).length} rows</p>`).join("")}
      ${o.filter(n=>n.family==="support-coverage").map(n=>`<p><strong>${s(n.subject)}</strong>: ${s(n.output)}</p>`).join("")}
    </details>
    <div class="panel validation-matrix-panel">
      <div class="panel__header">
        <h2 class="panel__title">Verification Matrix</h2>
        <div class="badge" data-validation-count aria-live="polite">${s(o.length)} rows</div>
      </div>
      <div class="panel__body">
        ${J()}
        <div class="validation-controls" aria-label="Science verification filters">
          <label class="validation-field validation-field--search">
            <span>Search</span>
            <input data-validation-search type="search" autocomplete="off" placeholder="model, metric, output, action..." />
          </label>
          <label class="validation-field">
            <span>Model area</span>
            <select data-validation-model-area>${_(w,"All model areas",$)}</select>
          </label>
          <label class="validation-field">
            <span>Family</span>
            <select data-validation-family>${_(A,"All families",D)}</select>
          </label>
          <label class="validation-field">
            <span>Status</span>
            <select data-validation-status>${_(R,"All statuses",O)}</select>
          </label>
          <label class="validation-field">
            <span>Severity</span>
            <select data-validation-severity>${_(p,"All severities")}</select>
          </label>
          <label class="validation-field">
            <span>Source</span>
            <select data-validation-source-class>${_(m,"All sources")}</select>
          </label>
        </div>
        <div class="validation-table-shell">
          <table>
            <thead>
              <tr>
                <th>Details</th>
                <th>Model area</th>
                <th>Family</th>
                <th>Subject</th>
                <th>Metric</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>${o.map((n,f)=>re(n,$[n.modelAreaId]||n.modelAreaId,f)).join("")}</tbody>
          </table>
        </div>
        <div class="validation-pagination" data-validation-pagination hidden>
          <button type="button" data-validation-page-prev>Previous</button>
          <span data-validation-page-status></span>
          <button type="button" data-validation-page-next>Next</button>
        </div>
      </div>
    </div>

    <details class="panel validation-explainer">
      <summary class="validation-explainer__summary">
        <span>What The Matrix Means</span>
        <span>${s(t.scope||"Science verification methodology and release evidence.")}</span>
      </summary>
      <div class="panel__body">
        <div class="validation-explainer__grid">
          <div>
            <p>${s(t.interpretation||"")}</p>
            ${Q()}
          </div>
          <div>
            <h2>Release Gates</h2>
            ${ne(t.releaseGates||[])}
          </div>
        </div>
      </div>
    </details>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Model Area Coverage</h2>
      </div>
      <div class="panel__body">
        ${se(t.modelAreas||[])}
      </div>
    </div>
  `,ce(r)}function ce(e){let i={search:e.querySelector("[data-validation-search]"),modelArea:e.querySelector("[data-validation-model-area]"),family:e.querySelector("[data-validation-family]"),status:e.querySelector("[data-validation-status]"),severity:e.querySelector("[data-validation-severity]"),sourceClass:e.querySelector("[data-validation-source-class]")},t=e.querySelector("[data-validation-count]"),r=Array.from(e.querySelectorAll("[data-validation-quick-filter]")),a=e.querySelector("[data-validation-pagination]"),o=e.querySelector("[data-validation-page-prev]"),$=e.querySelector("[data-validation-page-next]"),w=e.querySelector("[data-validation-page-status]"),A=Array.from(e.querySelectorAll(".validation-verification-row")),R=new Map(Array.from(e.querySelectorAll("[data-row-details]")).map(d=>[d.dataset.rowDetails,d])),p="",m=0,U=d=>{let l=String(d.dataset.status||"").toUpperCase(),c=L(d.dataset.family),v=L(d.dataset.sourceClass);return p?p==="issues"?["FAIL","WARN","GAP","BLOCKED","CHECK"].includes(l):p==="failures"?l==="FAIL"||l==="CHECK":p==="warnings"?l==="WARN":p==="gaps"?l==="GAP":p==="release-gates"?c==="release-gate":p==="nasa-anchors"?c==="anchor"&&v.includes("nasa"):p==="user-visible"?d.dataset.userVisible==="true":!0:!0},x=d=>{let l=L(i.search?.value);return!(l&&!L(d.dataset.search).includes(l)||i.modelArea?.value&&d.dataset.modelArea!==i.modelArea.value||i.family?.value&&d.dataset.family!==i.family.value||i.status?.value&&d.dataset.status!==i.status.value||i.severity?.value&&d.dataset.severity!==i.severity.value||i.sourceClass?.value&&d.dataset.sourceClass!==i.sourceClass.value||!U(d))},n=d=>{let l=d.dataset.rowIndex,c=R.get(l),v=d.querySelector("[data-validation-row-toggle]");d.classList.remove("is-expanded"),c&&(c.hidden=!0),v&&(v.setAttribute("aria-expanded","false"),v.textContent="Details")},f=({resetPage:d=!1}={})=>{let l=A.filter(x);d&&(m=0);let c=l.length>300,v=c?Math.max(1,Math.ceil(l.length/j)):1;m=Math.min(m,v-1);let S=c?m*j:0,b=c?S+j:l.length,G=new Set(l.slice(S,b));for(let I of A){let M=G.has(I);I.hidden=!M,M||n(I)}t&&(t.textContent=c?`${l.length} of ${A.length} rows, page ${m+1} of ${v}`:`${l.length} of ${A.length} rows`),a&&(a.hidden=!c),w&&(w.textContent=c?`Showing ${S+1}-${Math.min(b,l.length)} of ${l.length}`:""),o&&(o.disabled=m<=0),$&&($.disabled=m>=v-1)};Object.values(i).forEach(d=>{d?.addEventListener("input",()=>f({resetPage:!0}))}),r.forEach(d=>{d.addEventListener("click",()=>{p=d.dataset.validationQuickFilter||"",r.forEach(l=>{let c=(l.dataset.validationQuickFilter||"")===p;l.classList.toggle("is-active",c),l.setAttribute("aria-pressed",c?"true":"false")}),f({resetPage:!0})})}),o?.addEventListener("click",()=>{m=Math.max(0,m-1),f()}),$?.addEventListener("click",()=>{m+=1,f()}),e.addEventListener("click",d=>{let l=d.target.closest("[data-validation-row-toggle]");if(!l)return;let c=l.closest(".validation-verification-row"),v=l.dataset.validationRowToggle,S=R.get(v);if(!c||!S)return;let b=l.getAttribute("aria-expanded")==="true";c.classList.toggle("is-expanded",!b),S.hidden=b,l.setAttribute("aria-expanded",b?"false":"true"),l.textContent=b?"Details":"Hide"}),f()}async function ue(){let e=globalThis.fetch;if(typeof e!="function")throw new Error("This browser environment does not expose fetch().");let i=[];for(let t of C)try{let r=await e(t.dataUrl,{cache:"no-store"});if(!r.ok){i.push(`${t.dataUrl}: HTTP ${r.status}`);continue}return{...await r.json(),artifactDataUrl:t.dataUrl,artifactHtmlUrl:t.htmlUrl,artifactMarkdownUrl:t.markdownUrl}}catch(r){i.push(`${t.dataUrl}: ${r?.message||r}`)}throw new Error(`Tried ${i.join("; ")}.`)}function be(e,i={}){let t=document.createElement("div"),r=!0;le(t),e.innerHTML="",e.appendChild(t);let a=q(t,".validation-table-shell");return i.reportData?(B(t,{...i.reportData,artifactHtmlUrl:i.reportData.artifactHtmlUrl||C[0].htmlUrl,artifactMarkdownUrl:i.reportData.artifactMarkdownUrl||C[0].markdownUrl}),()=>{r=!1,a()}):(ue().then(o=>{r&&B(t,o)}).catch(o=>{r&&de(t.querySelector("[data-validation-content]"),o)}),()=>{r=!1,a()})}export{be as initValidationPage};
