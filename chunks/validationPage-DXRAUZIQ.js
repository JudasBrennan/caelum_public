import{d as u}from"./chunk-YZYZEETI.js";import{a as y,c as P,d as T,g as H}from"./chunk-H2TA4Z36.js";import{a as s}from"./chunk-4DOSHAKO.js";import{b as k}from"./chunk-TR2TDQN3.js";import"./chunk-FFUDGKDT.js";var C=Object.freeze([{dataUrl:u("reports/science-verification-matrix.json"),htmlUrl:u("reports/science-verification-matrix.html"),markdownUrl:u("reports/science-verification-matrix.md")},{dataUrl:u("test-results/science-verification-matrix.json"),htmlUrl:u("test-results/science-verification-matrix.html"),markdownUrl:u("test-results/science-verification-matrix.md")},{dataUrl:u("reports/model-calibration-report.json"),htmlUrl:u("reports/model-calibration-report.html"),markdownUrl:u("reports/model-calibration-report.md")},{dataUrl:u("test-results/model-calibration-report.json"),htmlUrl:u("test-results/model-calibration-report.html"),markdownUrl:u("test-results/model-calibration-report.md")}]),B=Object.freeze({PASS:"Pass",WARN:"Warning",FAIL:"Failure",GAP:"Modeling gap",INFO:"Info",BLOCKED:"Blocked",OK:"Pass",CHECK:"Needs calibration"}),M=100,G=Object.freeze([{id:"issues",label:"Issues"},{id:"failures",label:"Failures"},{id:"warnings",label:"Warnings"},{id:"gaps",label:"Gaps"},{id:"release-gates",label:"Release gates"},{id:"nasa-anchors",label:"NASA anchors"},{id:"user-visible",label:"User-visible"}]),O=Object.freeze({anchor:"Anchor",invariant:"Invariant",metamorphic:"Metamorphic",boundary:"Boundary","cross-system":"Cross-system",unit:"Unit",oracle:"Oracle",sensitivity:"Sensitivity",population:"Population",browser:"Browser","source-coverage":"Source coverage","release-gate":"Release gate"}),V=Object.freeze([{term:"Benchmark anchors",definition:"Direct comparisons against trusted published reference values, such as NASA/JPL or peer-reviewed benchmark cases."},{term:"Invariants",definition:"Physical rules that should always hold, such as positive masses, normalized fractions, and stable unit relationships."},{term:"Trend checks",definition:"Metamorphic tests that confirm outputs move in the expected direction when one physical input is changed."},{term:"Boundary checks",definition:"Regime-edge tests around thresholds such as phase changes, stability limits, escape limits, and classification boundaries."},{term:"Cross-system coupling",definition:"Checks that one model's output is carried into downstream models that should physically depend on it."},{term:"Units",definition:"Dimensional and conversion checks that catch scale errors between AU, km, Earth units, solar units, SI units, years, and days."},{term:"Independent formula oracles",definition:"Small standalone calculations used to verify core equations without relying on the same implementation path as the engine."},{term:"Sensitivity",definition:"Perturbation checks that make sure small input changes produce bounded, explainable output changes."},{term:"Population sanity",definition:"Generated-world checks that catch unrealistic distributions, missing regimes, or guided outputs outside expected physical ranges."},{term:"Browser coverage",definition:"Production-bundle checks that confirm the user-visible app can load, render, import, export, and navigate with the matrix in place."},{term:"Release gate",definition:"A required command or review step that must pass before release, including regression tests, matrix generation, build, bundle budget, and browser smoke tests."}]);function L(e){return String(e??"").trim().toLowerCase()}function h(e){return[...new Set(e.map(i=>String(i??"").trim()).filter(Boolean))].sort((i,t)=>i.localeCompare(t))}function q(e,i=e){return`<option value="${s(e)}">${s(i)}</option>`}function _(e,i,t={}){return[q("",i),...e.map(n=>q(n,t[n]||n))].join("")}function z(e){return B[e]||e||"Unknown"}function D(e){return O[e]||e||"Unknown"}function f(e,i,t=""){return`<div class="validation-kpi ${t}">
    <div class="validation-kpi__value">${s(i)}</div>
    <div class="validation-kpi__label">${s(e)}</div>
  </div>`}function W(){return`<dl class="validation-term-list">
    ${V.map(({term:e,definition:i})=>`<div class="validation-term-list__item">
        <dt>${s(e)}</dt>
        <dd>${s(i)}</dd>
      </div>`).join("")}
  </dl>`}function Q(){return`<div class="validation-quick-filters" aria-label="Quick filters">
    ${G.map(e=>`<button type="button" class="validation-filter-chip" data-validation-quick-filter="${s(e.id)}">${s(e.label)}</button>`).join("")}
    <button type="button" class="validation-filter-chip validation-filter-chip--clear" data-validation-quick-filter="">All rows</button>
  </div>`}function N(e,i=[]){let t=(Array.isArray(i)?i:[i]).map(n=>String(n??"").trim()).filter(Boolean);return`<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">${s(e)}</div>
    ${t.length?`<ul>${t.map(n=>`<li>${s(n)}</li>`).join("")}</ul>`:'<p class="hint">None recorded.</p>'}
  </div>`}function J(e=[]){let i=(Array.isArray(e)?e:[e]).map(t=>String(t??"").trim()).filter(Boolean);return`<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">Source URLs</div>
    ${i.length?`<ul>${i.map(t=>`<li><a href="${s(t)}" target="_blank" rel="noopener noreferrer">${s(t)}</a></li>`).join("")}</ul>`:'<p class="hint">No source URL attached to this row.</p>'}
  </div>`}function X(e,i=""){return[e.modelAreaId,i,e.family,e.subject,e.metric,e.inputSummary,e.output,e.expected,e.tolerance,e.status,e.severity,e.confidence,e.comparisonSemantics,e.sourceClass,e.action,...e.sourceUrls||[],...e.assumptions||[],...e.limitations||[],...e.downstreamConsumers||[]].map(t=>String(t??"")).join(" ").toLowerCase()}function Y(e){return e.issueKind?e.issueKind:e.status==="CHECK"?"hard-issue":e.status==="GAP"?"modeling-gap":e.status==="INFO"?"info":"ok"}function Z(e){let t=(Array.isArray(e.rows)?e.rows:[]).map((a,d)=>({id:`previous-calibration-${d}`,modelAreaId:a.category||"Previous calibration",family:"anchor",subject:a.object||"",metric:a.metric||"",inputSummary:a.input||"",output:a.output||"",expected:a.reference||"",tolerance:a.toleranceDisplay||"",status:a.status==="OK"?"PASS":a.status==="CHECK"?"FAIL":a.status||"INFO",severity:a.status==="CHECK"?"high":a.status==="GAP"?"medium":"info",confidence:a.highUncertaintyWithinBroadTolerance?"low":"medium",comparisonSemantics:a.comparisonSemantics||Y(a),sourceClass:a.solarSystemAnchor?"NASA":a.sourceCategory||"Previous calibration",sourceUrls:[],assumptions:[a.modelQuantityKind,a.referenceQuantityKind].filter(Boolean),limitations:[a.uncertaintyKind,a.note].filter(Boolean),downstreamConsumers:[],action:a.calibrationAction||"",userVisible:!0})),n=Object.fromEntries(h(t.map(a=>a.modelAreaId)).map(a=>[a,a]));return{schemaVersion:1,generatedAt:e.generatedAt,generatedBy:e.generatedBy||"previous calibration report",scope:e.scope||"Previous benchmark-only calibration report.",interpretation:e.interpretation||"These rows are benchmark anchors from the previous calibration report format.",headlineCounts:{modelAreas:Object.keys(n).length,verificationRows:t.length,passedRows:t.filter(a=>a.status==="PASS").length,warningRows:0,failedRows:t.filter(a=>a.status==="FAIL").length,gapRows:t.filter(a=>a.status==="GAP").length,blockedRows:0,infoRows:t.filter(a=>a.status==="INFO").length,releaseGatesPassed:0,releaseGatesFailed:0},filters:{modelAreaLabels:n,modelAreas:Object.keys(n),families:["anchor"],statuses:h(t.map(a=>a.status)),severities:h(t.map(a=>a.severity)),sourceClasses:h(t.map(a=>a.sourceClass)),confidences:h(t.map(a=>a.confidence))},modelAreas:Object.entries(n).map(([a,d])=>({id:a,label:d,trustLevel:"bounded",registryKeys:[],coverageSummary:{anchor:!0}})),verificationRows:t,rows:t,releaseGates:[],openGaps:t.filter(a=>a.status==="GAP"||a.status==="FAIL"),recommendations:[{priority:"transition",text:"Regenerate the Science Verification Matrix to replace this previous report."}]}}function ee(e){return Array.isArray(e.verificationRows)?{...e,rows:e.verificationRows,filters:{...e.filters,modelAreaLabels:e.filters?.modelAreaLabels||Object.fromEntries((e.modelAreas||[]).map(i=>[i.id,i.label]))}}:Z(e)}function E(e){let i=String(e.status||"INFO").toLowerCase();return`<span class="validation-status validation-status--${s(i)}">${s(z(e.status))}</span>`}function te(e){return`<div class="validation-row-detail">
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
      ${J(e.sourceUrls||[])}
      ${N("Assumptions",e.assumptions||[])}
      ${N("Limitations",e.limitations||[])}
      ${N("Downstream consumers",e.downstreamConsumers||[])}
    </div>
  </div>`}function ae(e){let i=e.coverageSummary||{},t=Object.entries(i).filter(([,n])=>n);return t.length?t.map(([n])=>`<span class="badge">${s(D(n))}</span>`).join(" "):'<span class="hint">No direct rows yet</span>'}function ie(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
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
        <td>${ae(t)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:""}function se(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
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
        <td>${E(t)}</td>
        <td>${s(t.output)}</td>
        <td>${s(t.action)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:'<p class="hint">No release gate rows were recorded in this artifact.</p>'}function ne(e,i,t){let a=`${`validation-row-${t}`}-details`;return`<tr
    class="validation-calibration-row validation-verification-row"
    data-row-index="${t}"
    data-search="${s(X(e,i))}"
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
    <td>${s(D(e.family))}</td>
    <td>${s(e.subject)}</td>
    <td>${s(e.metric)}</td>
    <td>${E(e)}</td>
    <td>${s(e.severity)}</td>
    <td>${s(e.sourceClass)}</td>
  </tr>
  <tr
    id="${s(a)}"
    class="validation-verification-details-row"
    data-row-details="${t}"
    hidden
  >
    <td colspan="8">${te(e)}</td>
  </tr>`}function re(e){e.className="page validation-page",e.innerHTML=`
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
  `,e.querySelector("[data-validation-content]")?.replaceChildren(le())}function le(){return H({label:"Loading science verification matrix",className:"validation-report-skeleton",children:[P({count:8}),k("div",{className:"panel validation-matrix-panel"},[k("div",{className:"panel__header",attrs:{"aria-hidden":"true"}},[y({className:"skeleton-line",width:"34%",height:18}),y({className:"skeleton-page__button",width:84,height:28})]),k("div",{className:"panel__body"},[k("div",{className:"validation-controls",attrs:{"aria-hidden":"true"}},[y({className:"skeleton-page__search",width:"32%",height:38}),y({className:"skeleton-page__button",width:128,height:38}),y({className:"skeleton-page__button",width:116,height:38}),y({className:"skeleton-page__button",width:104,height:38})]),T({columns:8,rows:8})])])]})}function oe(e,i){e.innerHTML=`
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
  `}function F(e,i){let t=ee(i),n=e.querySelector("[data-validation-content]"),a=t.headlineCounts||{},d=Array.isArray(t.rows)?t.rows:[],A=t.filters?.modelAreaLabels||{},w=t.filters?.modelAreas?.length?t.filters.modelAreas:h(d.map(o=>o.modelAreaId)),$=t.filters?.families?.length?t.filters.families:h(d.map(o=>o.family)),U=t.filters?.statuses?.length?t.filters.statuses:h(d.map(o=>o.status)),m=t.filters?.severities?.length?t.filters.severities:h(d.map(o=>o.severity)),p=t.filters?.sourceClasses?.length?t.filters.sourceClasses:h(d.map(o=>o.sourceClass)),x=e.querySelector("[data-validation-html]"),R=e.querySelector("[data-validation-markdown]");x&&t.artifactHtmlUrl&&(x.href=t.artifactHtmlUrl),R&&t.artifactMarkdownUrl&&(R.href=t.artifactMarkdownUrl),n.innerHTML=`
    <div class="validation-kpis" aria-label="Science verification headline counts">
      ${f("Model areas",a.modelAreas??t.modelAreas?.length??0)}
      ${f("Verification rows",a.verificationRows??d.length)}
      ${f("Pass",a.passedRows??d.filter(o=>o.status==="PASS").length,"validation-kpi--ok")}
      ${f("Warnings",a.warningRows??d.filter(o=>o.status==="WARN").length)}
      ${f("Failures",a.failedRows??d.filter(o=>o.status==="FAIL").length,"validation-kpi--check")}
      ${f("Modeling gaps",a.gapRows??d.filter(o=>o.status==="GAP").length,"validation-kpi--gap")}
      ${f("Blocked",a.blockedRows??d.filter(o=>o.status==="BLOCKED").length)}
      ${f("Release gates passed",a.releaseGatesPassed??0)}
    </div>

    <div class="panel validation-matrix-panel">
      <div class="panel__header">
        <h2 class="panel__title">Verification Matrix</h2>
        <div class="badge" data-validation-count aria-live="polite">${s(d.length)} rows</div>
      </div>
      <div class="panel__body">
        ${Q()}
        <div class="validation-controls" aria-label="Science verification filters">
          <label class="validation-field validation-field--search">
            <span>Search</span>
            <input data-validation-search type="search" autocomplete="off" placeholder="model, metric, output, action..." />
          </label>
          <label class="validation-field">
            <span>Model area</span>
            <select data-validation-model-area>${_(w,"All model areas",A)}</select>
          </label>
          <label class="validation-field">
            <span>Family</span>
            <select data-validation-family>${_($,"All families",O)}</select>
          </label>
          <label class="validation-field">
            <span>Status</span>
            <select data-validation-status>${_(U,"All statuses",B)}</select>
          </label>
          <label class="validation-field">
            <span>Severity</span>
            <select data-validation-severity>${_(m,"All severities")}</select>
          </label>
          <label class="validation-field">
            <span>Source</span>
            <select data-validation-source-class>${_(p,"All sources")}</select>
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
            <tbody>${d.map((o,g)=>ne(o,A[o.modelAreaId]||o.modelAreaId,g)).join("")}</tbody>
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
            ${W()}
          </div>
          <div>
            <h2>Release Gates</h2>
            ${se(t.releaseGates||[])}
          </div>
        </div>
      </div>
    </details>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Model Area Coverage</h2>
      </div>
      <div class="panel__body">
        ${ie(t.modelAreas||[])}
      </div>
    </div>
  `,de(n)}function de(e){let i={search:e.querySelector("[data-validation-search]"),modelArea:e.querySelector("[data-validation-model-area]"),family:e.querySelector("[data-validation-family]"),status:e.querySelector("[data-validation-status]"),severity:e.querySelector("[data-validation-severity]"),sourceClass:e.querySelector("[data-validation-source-class]")},t=e.querySelector("[data-validation-count]"),n=Array.from(e.querySelectorAll("[data-validation-quick-filter]")),a=e.querySelector("[data-validation-pagination]"),d=e.querySelector("[data-validation-page-prev]"),A=e.querySelector("[data-validation-page-next]"),w=e.querySelector("[data-validation-page-status]"),$=Array.from(e.querySelectorAll(".validation-verification-row")),U=new Map(Array.from(e.querySelectorAll("[data-row-details]")).map(l=>[l.dataset.rowDetails,l])),m="",p=0,x=l=>{let r=String(l.dataset.status||"").toUpperCase(),c=L(l.dataset.family),v=L(l.dataset.sourceClass);return m?m==="issues"?["FAIL","WARN","GAP","BLOCKED","CHECK"].includes(r):m==="failures"?r==="FAIL"||r==="CHECK":m==="warnings"?r==="WARN":m==="gaps"?r==="GAP":m==="release-gates"?c==="release-gate":m==="nasa-anchors"?c==="anchor"&&v.includes("nasa"):m==="user-visible"?l.dataset.userVisible==="true":!0:!0},R=l=>{let r=L(i.search?.value);return!(r&&!L(l.dataset.search).includes(r)||i.modelArea?.value&&l.dataset.modelArea!==i.modelArea.value||i.family?.value&&l.dataset.family!==i.family.value||i.status?.value&&l.dataset.status!==i.status.value||i.severity?.value&&l.dataset.severity!==i.severity.value||i.sourceClass?.value&&l.dataset.sourceClass!==i.sourceClass.value||!x(l))},o=l=>{let r=l.dataset.rowIndex,c=U.get(r),v=l.querySelector("[data-validation-row-toggle]");l.classList.remove("is-expanded"),c&&(c.hidden=!0),v&&(v.setAttribute("aria-expanded","false"),v.textContent="Details")},g=({resetPage:l=!1}={})=>{let r=$.filter(R);l&&(p=0);let c=r.length>300,v=c?Math.max(1,Math.ceil(r.length/M)):1;p=Math.min(p,v-1);let S=c?p*M:0,b=c?S+M:r.length,K=new Set(r.slice(S,b));for(let I of $){let j=K.has(I);I.hidden=!j,j||o(I)}t&&(t.textContent=c?`${r.length} of ${$.length} rows, page ${p+1} of ${v}`:`${r.length} of ${$.length} rows`),a&&(a.hidden=!c),w&&(w.textContent=c?`Showing ${S+1}-${Math.min(b,r.length)} of ${r.length}`:""),d&&(d.disabled=p<=0),A&&(A.disabled=p>=v-1)};Object.values(i).forEach(l=>{l?.addEventListener("input",()=>g({resetPage:!0}))}),n.forEach(l=>{l.addEventListener("click",()=>{m=l.dataset.validationQuickFilter||"",n.forEach(r=>{let c=(r.dataset.validationQuickFilter||"")===m;r.classList.toggle("is-active",c),r.setAttribute("aria-pressed",c?"true":"false")}),g({resetPage:!0})})}),d?.addEventListener("click",()=>{p=Math.max(0,p-1),g()}),A?.addEventListener("click",()=>{p+=1,g()}),e.addEventListener("click",l=>{let r=l.target.closest("[data-validation-row-toggle]");if(!r)return;let c=r.closest(".validation-verification-row"),v=r.dataset.validationRowToggle,S=U.get(v);if(!c||!S)return;let b=r.getAttribute("aria-expanded")==="true";c.classList.toggle("is-expanded",!b),S.hidden=b,r.setAttribute("aria-expanded",b?"false":"true"),r.textContent=b?"Details":"Hide"}),g()}async function ce(){let e=globalThis.fetch;if(typeof e!="function")throw new Error("This browser environment does not expose fetch().");let i=[];for(let t of C)try{let n=await e(t.dataUrl,{cache:"no-store"});if(!n.ok){i.push(`${t.dataUrl}: HTTP ${n.status}`);continue}return{...await n.json(),artifactDataUrl:t.dataUrl,artifactHtmlUrl:t.htmlUrl,artifactMarkdownUrl:t.markdownUrl}}catch(n){i.push(`${t.dataUrl}: ${n?.message||n}`)}throw new Error(`Tried ${i.join("; ")}.`)}function fe(e,i={}){let t=document.createElement("div"),n=!0;return re(t),e.innerHTML="",e.appendChild(t),i.reportData?(F(t,{...i.reportData,artifactHtmlUrl:i.reportData.artifactHtmlUrl||C[0].htmlUrl,artifactMarkdownUrl:i.reportData.artifactMarkdownUrl||C[0].markdownUrl}),()=>{n=!1}):(ce().then(a=>{n&&F(t,a)}).catch(a=>{n&&oe(t.querySelector("[data-validation-content]"),a)}),()=>{n=!1})}export{fe as initValidationPage};
