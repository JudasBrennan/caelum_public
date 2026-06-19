import{a as s}from"./chunk-7PVDVLB6.js";import"./chunk-VC46IEJQ.js";var p=Object.freeze([{dataUrl:"reports/science-verification-matrix.json",htmlUrl:"reports/science-verification-matrix.html",markdownUrl:"reports/science-verification-matrix.md"},{dataUrl:"test-results/science-verification-matrix.json",htmlUrl:"test-results/science-verification-matrix.html",markdownUrl:"test-results/science-verification-matrix.md"},{dataUrl:"reports/model-calibration-report.json",htmlUrl:"reports/model-calibration-report.html",markdownUrl:"reports/model-calibration-report.md"},{dataUrl:"test-results/model-calibration-report.json",htmlUrl:"test-results/model-calibration-report.html",markdownUrl:"test-results/model-calibration-report.md"}]),A=Object.freeze({PASS:"Pass",WARN:"Warning",FAIL:"Failure",GAP:"Modeling gap",INFO:"Info",BLOCKED:"Blocked",OK:"Pass",CHECK:"Needs calibration"}),$=Object.freeze({anchor:"Anchor",invariant:"Invariant",metamorphic:"Metamorphic",boundary:"Boundary","cross-system":"Cross-system",unit:"Unit",oracle:"Oracle",sensitivity:"Sensitivity",population:"Population",browser:"Browser","source-coverage":"Source coverage","release-gate":"Release gate"}),U=Object.freeze([{term:"Benchmark anchors",definition:"Direct comparisons against trusted published reference values, such as NASA/JPL or peer-reviewed benchmark cases."},{term:"Invariants",definition:"Physical rules that should always hold, such as positive masses, normalized fractions, and stable unit relationships."},{term:"Trend checks",definition:"Metamorphic tests that confirm outputs move in the expected direction when one physical input is changed."},{term:"Boundary checks",definition:"Regime-edge tests around thresholds such as phase changes, stability limits, escape limits, and classification boundaries."},{term:"Cross-system coupling",definition:"Checks that one model's output is carried into downstream models that should physically depend on it."},{term:"Units",definition:"Dimensional and conversion checks that catch scale errors between AU, km, Earth units, solar units, SI units, years, and days."},{term:"Independent formula oracles",definition:"Small standalone calculations used to verify core equations without relying on the same implementation path as the engine."},{term:"Sensitivity",definition:"Perturbation checks that make sure small input changes produce bounded, explainable output changes."},{term:"Population sanity",definition:"Generated-world checks that catch unrealistic distributions, missing regimes, or guided outputs outside expected physical ranges."},{term:"Browser coverage",definition:"Production-bundle checks that confirm the user-visible app can load, render, import, export, and navigate with the matrix in place."},{term:"Release gate",definition:"A required command or review step that must pass before release, including regression tests, matrix generation, build, bundle budget, and browser smoke tests."}]);function b(e){return String(e??"").trim().toLowerCase()}function c(e){return[...new Set(e.map(i=>String(i??"").trim()).filter(Boolean))].sort((i,t)=>i.localeCompare(t))}function y(e,i=e){return`<option value="${s(e)}">${s(i)}</option>`}function m(e,i,t={}){return[y("",i),...e.map(r=>y(r,t[r]||r))].join("")}function x(e){return A[e]||e||"Unknown"}function S(e){return $[e]||e||"Unknown"}function d(e,i,t=""){return`<div class="validation-kpi ${t}">
    <div class="validation-kpi__value">${s(i)}</div>
    <div class="validation-kpi__label">${s(e)}</div>
  </div>`}function I(){return`<dl class="validation-term-list">
    ${U.map(({term:e,definition:i})=>`<div class="validation-term-list__item">
        <dt>${s(e)}</dt>
        <dd>${s(i)}</dd>
      </div>`).join("")}
  </dl>`}function L(e,i=""){return[e.modelAreaId,i,e.family,e.subject,e.metric,e.inputSummary,e.output,e.expected,e.tolerance,e.status,e.severity,e.confidence,e.comparisonSemantics,e.sourceClass,e.action,...e.assumptions||[],...e.limitations||[],...e.downstreamConsumers||[]].map(t=>String(t??"")).join(" ").toLowerCase()}function j(e){return e.issueKind?e.issueKind:e.status==="CHECK"?"hard-issue":e.status==="GAP"?"modeling-gap":e.status==="INFO"?"info":"ok"}function M(e){let t=(Array.isArray(e.rows)?e.rows:[]).map((a,l)=>({id:`previous-calibration-${l}`,modelAreaId:a.category||"Previous calibration",family:"anchor",subject:a.object||"",metric:a.metric||"",inputSummary:a.input||"",output:a.output||"",expected:a.reference||"",tolerance:a.toleranceDisplay||"",status:a.status==="OK"?"PASS":a.status==="CHECK"?"FAIL":a.status||"INFO",severity:a.status==="CHECK"?"high":a.status==="GAP"?"medium":"info",confidence:a.highUncertaintyWithinBroadTolerance?"low":"medium",comparisonSemantics:a.comparisonSemantics||j(a),sourceClass:a.solarSystemAnchor?"NASA":a.sourceCategory||"Previous calibration",sourceUrls:[],assumptions:[a.modelQuantityKind,a.referenceQuantityKind].filter(Boolean),limitations:[a.uncertaintyKind,a.note].filter(Boolean),downstreamConsumers:[],action:a.calibrationAction||"",userVisible:!0})),r=Object.fromEntries(c(t.map(a=>a.modelAreaId)).map(a=>[a,a]));return{schemaVersion:1,generatedAt:e.generatedAt,generatedBy:e.generatedBy||"previous calibration report",scope:e.scope||"Previous benchmark-only calibration report.",interpretation:e.interpretation||"These rows are benchmark anchors from the previous calibration report format.",headlineCounts:{modelAreas:Object.keys(r).length,verificationRows:t.length,passedRows:t.filter(a=>a.status==="PASS").length,warningRows:0,failedRows:t.filter(a=>a.status==="FAIL").length,gapRows:t.filter(a=>a.status==="GAP").length,blockedRows:0,infoRows:t.filter(a=>a.status==="INFO").length,releaseGatesPassed:0,releaseGatesFailed:0},filters:{modelAreaLabels:r,modelAreas:Object.keys(r),families:["anchor"],statuses:c(t.map(a=>a.status)),severities:c(t.map(a=>a.severity)),sourceClasses:c(t.map(a=>a.sourceClass)),confidences:c(t.map(a=>a.confidence))},modelAreas:Object.entries(r).map(([a,l])=>({id:a,label:l,trustLevel:"bounded",registryKeys:[],coverageSummary:{anchor:!0}})),verificationRows:t,rows:t,releaseGates:[],openGaps:t.filter(a=>a.status==="GAP"||a.status==="FAIL"),recommendations:[{priority:"transition",text:"Regenerate the Science Verification Matrix to replace this previous report."}]}}function P(e){return Array.isArray(e.verificationRows)?{...e,rows:e.verificationRows,filters:{...e.filters,modelAreaLabels:e.filters?.modelAreaLabels||Object.fromEntries((e.modelAreas||[]).map(i=>[i.id,i.label]))}}:M(e)}function k(e){let i=String(e.status||"INFO").toLowerCase();return`<span class="validation-status validation-status--${s(i)}">${s(x(e.status))}</span>`}function T(e){let i=e.coverageSummary||{},t=Object.entries(i).filter(([,r])=>r);return t.length?t.map(([r])=>`<span class="badge">${s(S(r))}</span>`).join(" "):'<span class="hint">No direct rows yet</span>'}function H(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
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
        <td>${T(t)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:""}function O(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
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
        <td>${k(t)}</td>
        <td>${s(t.output)}</td>
        <td>${s(t.action)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:'<p class="hint">No release gate rows were recorded in this artifact.</p>'}function w(e,i){return`<tr
    class="validation-calibration-row validation-verification-row"
    data-search="${s(L(e,i))}"
    data-model-area="${s(e.modelAreaId||"")}"
    data-family="${s(e.family||"")}"
    data-status="${s(e.status||"")}"
    data-severity="${s(e.severity||"")}"
    data-source-class="${s(e.sourceClass||"")}"
    data-confidence="${s(e.confidence||"")}"
  >
    <td>${s(i||e.modelAreaId)}</td>
    <td>${s(S(e.family))}</td>
    <td>${s(e.subject)}</td>
    <td>${s(e.metric)}</td>
    <td>${s(e.output)}</td>
    <td>${s(e.expected)}</td>
    <td>${k(e)}</td>
    <td>${s(e.severity)}</td>
    <td>${s(e.sourceClass)}</td>
    <td>${s(e.action)}</td>
  </tr>`}function B(e){e.className="page validation-page",e.innerHTML=`
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
          WorldSmith verifies science with benchmark anchors, physical
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
  `}function F(e,i){e.innerHTML=`
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
  `}function g(e,i){let t=P(i),r=e.querySelector("[data-validation-content]"),a=t.headlineCounts||{},l=Array.isArray(t.rows)?t.rows:[],o=t.filters?.modelAreaLabels||{},u=t.filters?.modelAreas?.length?t.filters.modelAreas:c(l.map(n=>n.modelAreaId)),h=t.filters?.families?.length?t.filters.families:c(l.map(n=>n.family)),_=t.filters?.statuses?.length?t.filters.statuses:c(l.map(n=>n.status)),C=t.filters?.severities?.length?t.filters.severities:c(l.map(n=>n.severity)),R=t.filters?.sourceClasses?.length?t.filters.sourceClasses:c(l.map(n=>n.sourceClass)),v=e.querySelector("[data-validation-html]"),f=e.querySelector("[data-validation-markdown]");v&&t.artifactHtmlUrl&&(v.href=t.artifactHtmlUrl),f&&t.artifactMarkdownUrl&&(f.href=t.artifactMarkdownUrl),r.innerHTML=`
    <div class="validation-kpis" aria-label="Science verification headline counts">
      ${d("Model areas",a.modelAreas??t.modelAreas?.length??0)}
      ${d("Verification rows",a.verificationRows??l.length)}
      ${d("Pass",a.passedRows??l.filter(n=>n.status==="PASS").length,"validation-kpi--ok")}
      ${d("Warnings",a.warningRows??l.filter(n=>n.status==="WARN").length)}
      ${d("Failures",a.failedRows??l.filter(n=>n.status==="FAIL").length,"validation-kpi--check")}
      ${d("Modeling gaps",a.gapRows??l.filter(n=>n.status==="GAP").length,"validation-kpi--gap")}
      ${d("Blocked",a.blockedRows??l.filter(n=>n.status==="BLOCKED").length)}
      ${d("Release gates passed",a.releaseGatesPassed??0)}
    </div>

    <div class="panel validation-explainer">
      <div class="panel__body">
        <div class="validation-explainer__grid">
          <div>
            <h2>What The Matrix Means</h2>
            <p>${s(t.scope||"")}</p>
            <p>${s(t.interpretation||"")}</p>
            ${I()}
          </div>
          <div>
            <h2>Release Gates</h2>
            ${O(t.releaseGates||[])}
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Model Area Coverage</h2>
      </div>
      <div class="panel__body">
        ${H(t.modelAreas||[])}
      </div>
    </div>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Verification Matrix</h2>
        <div class="badge" data-validation-count aria-live="polite">${s(l.length)} rows</div>
      </div>
      <div class="panel__body">
        <div class="validation-controls" aria-label="Science verification filters">
          <label class="validation-field validation-field--search">
            <span>Search</span>
            <input data-validation-search type="search" autocomplete="off" placeholder="model, metric, output, action..." />
          </label>
          <label class="validation-field">
            <span>Model area</span>
            <select data-validation-model-area>${m(u,"All model areas",o)}</select>
          </label>
          <label class="validation-field">
            <span>Family</span>
            <select data-validation-family>${m(h,"All families",$)}</select>
          </label>
          <label class="validation-field">
            <span>Status</span>
            <select data-validation-status>${m(_,"All statuses",A)}</select>
          </label>
          <label class="validation-field">
            <span>Severity</span>
            <select data-validation-severity>${m(C,"All severities")}</select>
          </label>
          <label class="validation-field">
            <span>Source</span>
            <select data-validation-source-class>${m(R,"All sources")}</select>
          </label>
        </div>
        <div class="validation-table-shell">
          <table>
            <thead>
              <tr>
                <th>Model area</th>
                <th>Family</th>
                <th>Subject</th>
                <th>Metric</th>
                <th>Output</th>
                <th>Expected</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Source</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${l.map(n=>w(n,o[n.modelAreaId]||n.modelAreaId)).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>
  `,q(r)}function q(e){let i={search:e.querySelector("[data-validation-search]"),modelArea:e.querySelector("[data-validation-model-area]"),family:e.querySelector("[data-validation-family]"),status:e.querySelector("[data-validation-status]"),severity:e.querySelector("[data-validation-severity]"),sourceClass:e.querySelector("[data-validation-source-class]")},t=e.querySelector("[data-validation-count]"),r=Array.from(e.querySelectorAll(".validation-verification-row")),a=o=>{let u=b(i.search?.value);return!(u&&!b(o.dataset.search).includes(u)||i.modelArea?.value&&o.dataset.modelArea!==i.modelArea.value||i.family?.value&&o.dataset.family!==i.family.value||i.status?.value&&o.dataset.status!==i.status.value||i.severity?.value&&o.dataset.severity!==i.severity.value||i.sourceClass?.value&&o.dataset.sourceClass!==i.sourceClass.value)},l=()=>{let o=0;for(let u of r){let h=a(u);u.hidden=!h,h&&(o+=1)}t&&(t.textContent=`${o} of ${r.length} rows`)};Object.values(i).forEach(o=>{o?.addEventListener("input",l)}),l()}async function E(){let e=globalThis.fetch;if(typeof e!="function")throw new Error("This browser environment does not expose fetch().");let i=[];for(let t of p)try{let r=await e(t.dataUrl,{cache:"no-store"});if(!r.ok){i.push(`${t.dataUrl}: HTTP ${r.status}`);continue}return{...await r.json(),artifactDataUrl:t.dataUrl,artifactHtmlUrl:t.htmlUrl,artifactMarkdownUrl:t.markdownUrl}}catch(r){i.push(`${t.dataUrl}: ${r?.message||r}`)}throw new Error(`Tried ${i.join("; ")}.`)}function K(e,i={}){let t=document.createElement("div"),r=!0;return B(t),e.innerHTML="",e.appendChild(t),i.reportData?(g(t,{...i.reportData,artifactHtmlUrl:i.reportData.artifactHtmlUrl||p[0].htmlUrl,artifactMarkdownUrl:i.reportData.artifactMarkdownUrl||p[0].markdownUrl}),()=>{r=!1}):(E().then(a=>{r&&g(t,a)}).catch(a=>{r&&F(t.querySelector("[data-validation-content]"),a)}),()=>{r=!1})}export{K as initValidationPage};
