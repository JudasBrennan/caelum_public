import{a as s}from"./chunk-7PVDVLB6.js";import"./chunk-VC46IEJQ.js";var I=Object.freeze([{dataUrl:"reports/science-verification-matrix.json",htmlUrl:"reports/science-verification-matrix.html",markdownUrl:"reports/science-verification-matrix.md"},{dataUrl:"test-results/science-verification-matrix.json",htmlUrl:"test-results/science-verification-matrix.html",markdownUrl:"test-results/science-verification-matrix.md"},{dataUrl:"reports/model-calibration-report.json",htmlUrl:"reports/model-calibration-report.html",markdownUrl:"reports/model-calibration-report.md"},{dataUrl:"test-results/model-calibration-report.json",htmlUrl:"test-results/model-calibration-report.html",markdownUrl:"test-results/model-calibration-report.md"}]),P=Object.freeze({PASS:"Pass",WARN:"Warning",FAIL:"Failure",GAP:"Modeling gap",INFO:"Info",BLOCKED:"Blocked",OK:"Pass",CHECK:"Needs calibration"}),U=100,B=Object.freeze([{id:"issues",label:"Issues"},{id:"failures",label:"Failures"},{id:"warnings",label:"Warnings"},{id:"gaps",label:"Gaps"},{id:"release-gates",label:"Release gates"},{id:"nasa-anchors",label:"NASA anchors"},{id:"user-visible",label:"User-visible"}]),T=Object.freeze({anchor:"Anchor",invariant:"Invariant",metamorphic:"Metamorphic",boundary:"Boundary","cross-system":"Cross-system",unit:"Unit",oracle:"Oracle",sensitivity:"Sensitivity",population:"Population",browser:"Browser","source-coverage":"Source coverage","release-gate":"Release gate"}),N=Object.freeze([{term:"Benchmark anchors",definition:"Direct comparisons against trusted published reference values, such as NASA/JPL or peer-reviewed benchmark cases."},{term:"Invariants",definition:"Physical rules that should always hold, such as positive masses, normalized fractions, and stable unit relationships."},{term:"Trend checks",definition:"Metamorphic tests that confirm outputs move in the expected direction when one physical input is changed."},{term:"Boundary checks",definition:"Regime-edge tests around thresholds such as phase changes, stability limits, escape limits, and classification boundaries."},{term:"Cross-system coupling",definition:"Checks that one model's output is carried into downstream models that should physically depend on it."},{term:"Units",definition:"Dimensional and conversion checks that catch scale errors between AU, km, Earth units, solar units, SI units, years, and days."},{term:"Independent formula oracles",definition:"Small standalone calculations used to verify core equations without relying on the same implementation path as the engine."},{term:"Sensitivity",definition:"Perturbation checks that make sure small input changes produce bounded, explainable output changes."},{term:"Population sanity",definition:"Generated-world checks that catch unrealistic distributions, missing regimes, or guided outputs outside expected physical ranges."},{term:"Browser coverage",definition:"Production-bundle checks that confirm the user-visible app can load, render, import, export, and navigate with the matrix in place."},{term:"Release gate",definition:"A required command or review step that must pass before release, including regression tests, matrix generation, build, bundle budget, and browser smoke tests."}]);function x(e){return String(e??"").trim().toLowerCase()}function v(e){return[...new Set(e.map(i=>String(i??"").trim()).filter(Boolean))].sort((i,t)=>i.localeCompare(t))}function M(e,i=e){return`<option value="${s(e)}">${s(i)}</option>`}function $(e,i,t={}){return[M("",i),...e.map(n=>M(n,t[n]||n))].join("")}function O(e){return P[e]||e||"Unknown"}function H(e){return T[e]||e||"Unknown"}function h(e,i,t=""){return`<div class="validation-kpi ${t}">
    <div class="validation-kpi__value">${s(i)}</div>
    <div class="validation-kpi__label">${s(e)}</div>
  </div>`}function D(){return`<dl class="validation-term-list">
    ${N.map(({term:e,definition:i})=>`<div class="validation-term-list__item">
        <dt>${s(e)}</dt>
        <dd>${s(i)}</dd>
      </div>`).join("")}
  </dl>`}function E(){return`<div class="validation-quick-filters" aria-label="Quick filters">
    ${B.map(e=>`<button type="button" class="validation-filter-chip" data-validation-quick-filter="${s(e.id)}">${s(e.label)}</button>`).join("")}
    <button type="button" class="validation-filter-chip validation-filter-chip--clear" data-validation-quick-filter="">All rows</button>
  </div>`}function L(e,i=[]){let t=(Array.isArray(i)?i:[i]).map(n=>String(n??"").trim()).filter(Boolean);return`<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">${s(e)}</div>
    ${t.length?`<ul>${t.map(n=>`<li>${s(n)}</li>`).join("")}</ul>`:'<p class="hint">None recorded.</p>'}
  </div>`}function G(e=[]){let i=(Array.isArray(e)?e:[e]).map(t=>String(t??"").trim()).filter(Boolean);return`<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">Source URLs</div>
    ${i.length?`<ul>${i.map(t=>`<li><a href="${s(t)}" target="_blank" rel="noopener noreferrer">${s(t)}</a></li>`).join("")}</ul>`:'<p class="hint">No source URL attached to this row.</p>'}
  </div>`}function K(e,i=""){return[e.modelAreaId,i,e.family,e.subject,e.metric,e.inputSummary,e.output,e.expected,e.tolerance,e.status,e.severity,e.confidence,e.comparisonSemantics,e.sourceClass,e.action,...e.sourceUrls||[],...e.assumptions||[],...e.limitations||[],...e.downstreamConsumers||[]].map(t=>String(t??"")).join(" ").toLowerCase()}function V(e){return e.issueKind?e.issueKind:e.status==="CHECK"?"hard-issue":e.status==="GAP"?"modeling-gap":e.status==="INFO"?"info":"ok"}function z(e){let t=(Array.isArray(e.rows)?e.rows:[]).map((a,d)=>({id:`previous-calibration-${d}`,modelAreaId:a.category||"Previous calibration",family:"anchor",subject:a.object||"",metric:a.metric||"",inputSummary:a.input||"",output:a.output||"",expected:a.reference||"",tolerance:a.toleranceDisplay||"",status:a.status==="OK"?"PASS":a.status==="CHECK"?"FAIL":a.status||"INFO",severity:a.status==="CHECK"?"high":a.status==="GAP"?"medium":"info",confidence:a.highUncertaintyWithinBroadTolerance?"low":"medium",comparisonSemantics:a.comparisonSemantics||V(a),sourceClass:a.solarSystemAnchor?"NASA":a.sourceCategory||"Previous calibration",sourceUrls:[],assumptions:[a.modelQuantityKind,a.referenceQuantityKind].filter(Boolean),limitations:[a.uncertaintyKind,a.note].filter(Boolean),downstreamConsumers:[],action:a.calibrationAction||"",userVisible:!0})),n=Object.fromEntries(v(t.map(a=>a.modelAreaId)).map(a=>[a,a]));return{schemaVersion:1,generatedAt:e.generatedAt,generatedBy:e.generatedBy||"previous calibration report",scope:e.scope||"Previous benchmark-only calibration report.",interpretation:e.interpretation||"These rows are benchmark anchors from the previous calibration report format.",headlineCounts:{modelAreas:Object.keys(n).length,verificationRows:t.length,passedRows:t.filter(a=>a.status==="PASS").length,warningRows:0,failedRows:t.filter(a=>a.status==="FAIL").length,gapRows:t.filter(a=>a.status==="GAP").length,blockedRows:0,infoRows:t.filter(a=>a.status==="INFO").length,releaseGatesPassed:0,releaseGatesFailed:0},filters:{modelAreaLabels:n,modelAreas:Object.keys(n),families:["anchor"],statuses:v(t.map(a=>a.status)),severities:v(t.map(a=>a.severity)),sourceClasses:v(t.map(a=>a.sourceClass)),confidences:v(t.map(a=>a.confidence))},modelAreas:Object.entries(n).map(([a,d])=>({id:a,label:d,trustLevel:"bounded",registryKeys:[],coverageSummary:{anchor:!0}})),verificationRows:t,rows:t,releaseGates:[],openGaps:t.filter(a=>a.status==="GAP"||a.status==="FAIL"),recommendations:[{priority:"transition",text:"Regenerate the Science Verification Matrix to replace this previous report."}]}}function W(e){return Array.isArray(e.verificationRows)?{...e,rows:e.verificationRows,filters:{...e.filters,modelAreaLabels:e.filters?.modelAreaLabels||Object.fromEntries((e.modelAreas||[]).map(i=>[i.id,i.label]))}}:z(e)}function q(e){let i=String(e.status||"INFO").toLowerCase();return`<span class="validation-status validation-status--${s(i)}">${s(O(e.status))}</span>`}function Q(e){return`<div class="validation-row-detail">
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
      ${G(e.sourceUrls||[])}
      ${L("Assumptions",e.assumptions||[])}
      ${L("Limitations",e.limitations||[])}
      ${L("Downstream consumers",e.downstreamConsumers||[])}
    </div>
  </div>`}function J(e){let i=e.coverageSummary||{},t=Object.entries(i).filter(([,n])=>n);return t.length?t.map(([n])=>`<span class="badge">${s(H(n))}</span>`).join(" "):'<span class="hint">No direct rows yet</span>'}function X(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
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
        <td>${J(t)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:""}function Y(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
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
        <td>${q(t)}</td>
        <td>${s(t.output)}</td>
        <td>${s(t.action)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:'<p class="hint">No release gate rows were recorded in this artifact.</p>'}function Z(e,i,t){let a=`${`validation-row-${t}`}-details`;return`<tr
    class="validation-calibration-row validation-verification-row"
    data-row-index="${t}"
    data-search="${s(K(e,i))}"
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
    <td>${s(H(e.family))}</td>
    <td>${s(e.subject)}</td>
    <td>${s(e.metric)}</td>
    <td>${q(e)}</td>
    <td>${s(e.severity)}</td>
    <td>${s(e.sourceClass)}</td>
  </tr>
  <tr
    id="${s(a)}"
    class="validation-verification-details-row"
    data-row-details="${t}"
    hidden
  >
    <td colspan="8">${Q(e)}</td>
  </tr>`}function ee(e){e.className="page validation-page",e.innerHTML=`
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
          <a class="validation-action validation-action--accent" data-validation-html href="reports/science-verification-matrix.html" target="_blank" rel="noopener noreferrer">Standalone HTML</a>
          <a class="validation-action" data-validation-markdown href="reports/science-verification-matrix.md" target="_blank" rel="noopener noreferrer">Markdown</a>
          <a class="validation-action" href="#/science">Science &amp; Maths</a>
        </div>
      </div>
    </div>
    <div class="validation-report" data-validation-content>
      <div class="panel">
        <div class="panel__body">
          <p class="hint">Loading prebuilt science verification matrix...</p>
        </div>
      </div>
    </div>
  `}function te(e,i){e.innerHTML=`
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
  `}function j(e,i){let t=W(i),n=e.querySelector("[data-validation-content]"),a=t.headlineCounts||{},d=Array.isArray(t.rows)?t.rows:[],g=t.filters?.modelAreaLabels||{},S=t.filters?.modelAreas?.length?t.filters.modelAreas:v(d.map(o=>o.modelAreaId)),y=t.filters?.families?.length?t.filters.families:v(d.map(o=>o.family)),k=t.filters?.statuses?.length?t.filters.statuses:v(d.map(o=>o.status)),u=t.filters?.severities?.length?t.filters.severities:v(d.map(o=>o.severity)),p=t.filters?.sourceClasses?.length?t.filters.sourceClasses:v(d.map(o=>o.sourceClass)),_=e.querySelector("[data-validation-html]"),C=e.querySelector("[data-validation-markdown]");_&&t.artifactHtmlUrl&&(_.href=t.artifactHtmlUrl),C&&t.artifactMarkdownUrl&&(C.href=t.artifactMarkdownUrl),n.innerHTML=`
    <div class="validation-kpis" aria-label="Science verification headline counts">
      ${h("Model areas",a.modelAreas??t.modelAreas?.length??0)}
      ${h("Verification rows",a.verificationRows??d.length)}
      ${h("Pass",a.passedRows??d.filter(o=>o.status==="PASS").length,"validation-kpi--ok")}
      ${h("Warnings",a.warningRows??d.filter(o=>o.status==="WARN").length)}
      ${h("Failures",a.failedRows??d.filter(o=>o.status==="FAIL").length,"validation-kpi--check")}
      ${h("Modeling gaps",a.gapRows??d.filter(o=>o.status==="GAP").length,"validation-kpi--gap")}
      ${h("Blocked",a.blockedRows??d.filter(o=>o.status==="BLOCKED").length)}
      ${h("Release gates passed",a.releaseGatesPassed??0)}
    </div>

    <div class="panel validation-matrix-panel">
      <div class="panel__header">
        <h2 class="panel__title">Verification Matrix</h2>
        <div class="badge" data-validation-count aria-live="polite">${s(d.length)} rows</div>
      </div>
      <div class="panel__body">
        ${E()}
        <div class="validation-controls" aria-label="Science verification filters">
          <label class="validation-field validation-field--search">
            <span>Search</span>
            <input data-validation-search type="search" autocomplete="off" placeholder="model, metric, output, action..." />
          </label>
          <label class="validation-field">
            <span>Model area</span>
            <select data-validation-model-area>${$(S,"All model areas",g)}</select>
          </label>
          <label class="validation-field">
            <span>Family</span>
            <select data-validation-family>${$(y,"All families",T)}</select>
          </label>
          <label class="validation-field">
            <span>Status</span>
            <select data-validation-status>${$(k,"All statuses",P)}</select>
          </label>
          <label class="validation-field">
            <span>Severity</span>
            <select data-validation-severity>${$(u,"All severities")}</select>
          </label>
          <label class="validation-field">
            <span>Source</span>
            <select data-validation-source-class>${$(p,"All sources")}</select>
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
            <tbody>${d.map((o,f)=>Z(o,g[o.modelAreaId]||o.modelAreaId,f)).join("")}</tbody>
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
            ${D()}
          </div>
          <div>
            <h2>Release Gates</h2>
            ${Y(t.releaseGates||[])}
          </div>
        </div>
      </div>
    </details>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Model Area Coverage</h2>
      </div>
      <div class="panel__body">
        ${X(t.modelAreas||[])}
      </div>
    </div>
  `,ae(n)}function ae(e){let i={search:e.querySelector("[data-validation-search]"),modelArea:e.querySelector("[data-validation-model-area]"),family:e.querySelector("[data-validation-family]"),status:e.querySelector("[data-validation-status]"),severity:e.querySelector("[data-validation-severity]"),sourceClass:e.querySelector("[data-validation-source-class]")},t=e.querySelector("[data-validation-count]"),n=Array.from(e.querySelectorAll("[data-validation-quick-filter]")),a=e.querySelector("[data-validation-pagination]"),d=e.querySelector("[data-validation-page-prev]"),g=e.querySelector("[data-validation-page-next]"),S=e.querySelector("[data-validation-page-status]"),y=Array.from(e.querySelectorAll(".validation-verification-row")),k=new Map(Array.from(e.querySelectorAll("[data-row-details]")).map(l=>[l.dataset.rowDetails,l])),u="",p=0,_=l=>{let r=String(l.dataset.status||"").toUpperCase(),c=x(l.dataset.family),m=x(l.dataset.sourceClass);return u?u==="issues"?["FAIL","WARN","GAP","BLOCKED","CHECK"].includes(r):u==="failures"?r==="FAIL"||r==="CHECK":u==="warnings"?r==="WARN":u==="gaps"?r==="GAP":u==="release-gates"?c==="release-gate":u==="nasa-anchors"?c==="anchor"&&m.includes("nasa"):u==="user-visible"?l.dataset.userVisible==="true":!0:!0},C=l=>{let r=x(i.search?.value);return!(r&&!x(l.dataset.search).includes(r)||i.modelArea?.value&&l.dataset.modelArea!==i.modelArea.value||i.family?.value&&l.dataset.family!==i.family.value||i.status?.value&&l.dataset.status!==i.status.value||i.severity?.value&&l.dataset.severity!==i.severity.value||i.sourceClass?.value&&l.dataset.sourceClass!==i.sourceClass.value||!_(l))},o=l=>{let r=l.dataset.rowIndex,c=k.get(r),m=l.querySelector("[data-validation-row-toggle]");l.classList.remove("is-expanded"),c&&(c.hidden=!0),m&&(m.setAttribute("aria-expanded","false"),m.textContent="Details")},f=({resetPage:l=!1}={})=>{let r=y.filter(C);l&&(p=0);let c=r.length>300,m=c?Math.max(1,Math.ceil(r.length/U)):1;p=Math.min(p,m-1);let A=c?p*U:0,b=c?A+U:r.length,F=new Set(r.slice(A,b));for(let R of y){let w=F.has(R);R.hidden=!w,w||o(R)}t&&(t.textContent=c?`${r.length} of ${y.length} rows, page ${p+1} of ${m}`:`${r.length} of ${y.length} rows`),a&&(a.hidden=!c),S&&(S.textContent=c?`Showing ${A+1}-${Math.min(b,r.length)} of ${r.length}`:""),d&&(d.disabled=p<=0),g&&(g.disabled=p>=m-1)};Object.values(i).forEach(l=>{l?.addEventListener("input",()=>f({resetPage:!0}))}),n.forEach(l=>{l.addEventListener("click",()=>{u=l.dataset.validationQuickFilter||"",n.forEach(r=>{let c=(r.dataset.validationQuickFilter||"")===u;r.classList.toggle("is-active",c),r.setAttribute("aria-pressed",c?"true":"false")}),f({resetPage:!0})})}),d?.addEventListener("click",()=>{p=Math.max(0,p-1),f()}),g?.addEventListener("click",()=>{p+=1,f()}),e.addEventListener("click",l=>{let r=l.target.closest("[data-validation-row-toggle]");if(!r)return;let c=r.closest(".validation-verification-row"),m=r.dataset.validationRowToggle,A=k.get(m);if(!c||!A)return;let b=r.getAttribute("aria-expanded")==="true";c.classList.toggle("is-expanded",!b),A.hidden=b,r.setAttribute("aria-expanded",b?"false":"true"),r.textContent=b?"Details":"Hide"}),f()}async function ie(){let e=globalThis.fetch;if(typeof e!="function")throw new Error("This browser environment does not expose fetch().");let i=[];for(let t of I)try{let n=await e(t.dataUrl,{cache:"no-store"});if(!n.ok){i.push(`${t.dataUrl}: HTTP ${n.status}`);continue}return{...await n.json(),artifactDataUrl:t.dataUrl,artifactHtmlUrl:t.htmlUrl,artifactMarkdownUrl:t.markdownUrl}}catch(n){i.push(`${t.dataUrl}: ${n?.message||n}`)}throw new Error(`Tried ${i.join("; ")}.`)}function ne(e,i={}){let t=document.createElement("div"),n=!0;return ee(t),e.innerHTML="",e.appendChild(t),i.reportData?(j(t,{...i.reportData,artifactHtmlUrl:i.reportData.artifactHtmlUrl||I[0].htmlUrl,artifactMarkdownUrl:i.reportData.artifactMarkdownUrl||I[0].markdownUrl}),()=>{n=!1}):(ie().then(a=>{n&&j(t,a)}).catch(a=>{n&&te(t.querySelector("[data-validation-content]"),a)}),()=>{n=!1})}export{ne as initValidationPage};
