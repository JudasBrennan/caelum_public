import{a as b,c as j,d as P,g as T}from"./chunk-YIPUAQ7S.js";import{a as s}from"./chunk-7PVDVLB6.js";import{b as S}from"./chunk-XMLMEZIZ.js";import"./chunk-VC46IEJQ.js";var M=Object.freeze([{dataUrl:"reports/science-verification-matrix.json",htmlUrl:"reports/science-verification-matrix.html",markdownUrl:"reports/science-verification-matrix.md"},{dataUrl:"test-results/science-verification-matrix.json",htmlUrl:"test-results/science-verification-matrix.html",markdownUrl:"test-results/science-verification-matrix.md"},{dataUrl:"reports/model-calibration-report.json",htmlUrl:"reports/model-calibration-report.html",markdownUrl:"reports/model-calibration-report.md"},{dataUrl:"test-results/model-calibration-report.json",htmlUrl:"test-results/model-calibration-report.html",markdownUrl:"test-results/model-calibration-report.md"}]),F=Object.freeze({PASS:"Pass",WARN:"Warning",FAIL:"Failure",GAP:"Modeling gap",INFO:"Info",BLOCKED:"Blocked",OK:"Pass",CHECK:"Needs calibration"}),L=100,K=Object.freeze([{id:"issues",label:"Issues"},{id:"failures",label:"Failures"},{id:"warnings",label:"Warnings"},{id:"gaps",label:"Gaps"},{id:"release-gates",label:"Release gates"},{id:"nasa-anchors",label:"NASA anchors"},{id:"user-visible",label:"User-visible"}]),B=Object.freeze({anchor:"Anchor",invariant:"Invariant",metamorphic:"Metamorphic",boundary:"Boundary","cross-system":"Cross-system",unit:"Unit",oracle:"Oracle",sensitivity:"Sensitivity",population:"Population",browser:"Browser","source-coverage":"Source coverage","release-gate":"Release gate"}),G=Object.freeze([{term:"Benchmark anchors",definition:"Direct comparisons against trusted published reference values, such as NASA/JPL or peer-reviewed benchmark cases."},{term:"Invariants",definition:"Physical rules that should always hold, such as positive masses, normalized fractions, and stable unit relationships."},{term:"Trend checks",definition:"Metamorphic tests that confirm outputs move in the expected direction when one physical input is changed."},{term:"Boundary checks",definition:"Regime-edge tests around thresholds such as phase changes, stability limits, escape limits, and classification boundaries."},{term:"Cross-system coupling",definition:"Checks that one model's output is carried into downstream models that should physically depend on it."},{term:"Units",definition:"Dimensional and conversion checks that catch scale errors between AU, km, Earth units, solar units, SI units, years, and days."},{term:"Independent formula oracles",definition:"Small standalone calculations used to verify core equations without relying on the same implementation path as the engine."},{term:"Sensitivity",definition:"Perturbation checks that make sure small input changes produce bounded, explainable output changes."},{term:"Population sanity",definition:"Generated-world checks that catch unrealistic distributions, missing regimes, or guided outputs outside expected physical ranges."},{term:"Browser coverage",definition:"Production-bundle checks that confirm the user-visible app can load, render, import, export, and navigate with the matrix in place."},{term:"Release gate",definition:"A required command or review step that must pass before release, including regression tests, matrix generation, build, bundle budget, and browser smoke tests."}]);function R(e){return String(e??"").trim().toLowerCase()}function v(e){return[...new Set(e.map(i=>String(i??"").trim()).filter(Boolean))].sort((i,t)=>i.localeCompare(t))}function H(e,i=e){return`<option value="${s(e)}">${s(i)}</option>`}function k(e,i,t={}){return[H("",i),...e.map(n=>H(n,t[n]||n))].join("")}function V(e){return F[e]||e||"Unknown"}function O(e){return B[e]||e||"Unknown"}function h(e,i,t=""){return`<div class="validation-kpi ${t}">
    <div class="validation-kpi__value">${s(i)}</div>
    <div class="validation-kpi__label">${s(e)}</div>
  </div>`}function z(){return`<dl class="validation-term-list">
    ${G.map(({term:e,definition:i})=>`<div class="validation-term-list__item">
        <dt>${s(e)}</dt>
        <dd>${s(i)}</dd>
      </div>`).join("")}
  </dl>`}function W(){return`<div class="validation-quick-filters" aria-label="Quick filters">
    ${K.map(e=>`<button type="button" class="validation-filter-chip" data-validation-quick-filter="${s(e.id)}">${s(e.label)}</button>`).join("")}
    <button type="button" class="validation-filter-chip validation-filter-chip--clear" data-validation-quick-filter="">All rows</button>
  </div>`}function I(e,i=[]){let t=(Array.isArray(i)?i:[i]).map(n=>String(n??"").trim()).filter(Boolean);return`<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">${s(e)}</div>
    ${t.length?`<ul>${t.map(n=>`<li>${s(n)}</li>`).join("")}</ul>`:'<p class="hint">None recorded.</p>'}
  </div>`}function Q(e=[]){let i=(Array.isArray(e)?e:[e]).map(t=>String(t??"").trim()).filter(Boolean);return`<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">Source URLs</div>
    ${i.length?`<ul>${i.map(t=>`<li><a href="${s(t)}" target="_blank" rel="noopener noreferrer">${s(t)}</a></li>`).join("")}</ul>`:'<p class="hint">No source URL attached to this row.</p>'}
  </div>`}function J(e,i=""){return[e.modelAreaId,i,e.family,e.subject,e.metric,e.inputSummary,e.output,e.expected,e.tolerance,e.status,e.severity,e.confidence,e.comparisonSemantics,e.sourceClass,e.action,...e.sourceUrls||[],...e.assumptions||[],...e.limitations||[],...e.downstreamConsumers||[]].map(t=>String(t??"")).join(" ").toLowerCase()}function X(e){return e.issueKind?e.issueKind:e.status==="CHECK"?"hard-issue":e.status==="GAP"?"modeling-gap":e.status==="INFO"?"info":"ok"}function Y(e){let t=(Array.isArray(e.rows)?e.rows:[]).map((a,d)=>({id:`previous-calibration-${d}`,modelAreaId:a.category||"Previous calibration",family:"anchor",subject:a.object||"",metric:a.metric||"",inputSummary:a.input||"",output:a.output||"",expected:a.reference||"",tolerance:a.toleranceDisplay||"",status:a.status==="OK"?"PASS":a.status==="CHECK"?"FAIL":a.status||"INFO",severity:a.status==="CHECK"?"high":a.status==="GAP"?"medium":"info",confidence:a.highUncertaintyWithinBroadTolerance?"low":"medium",comparisonSemantics:a.comparisonSemantics||X(a),sourceClass:a.solarSystemAnchor?"NASA":a.sourceCategory||"Previous calibration",sourceUrls:[],assumptions:[a.modelQuantityKind,a.referenceQuantityKind].filter(Boolean),limitations:[a.uncertaintyKind,a.note].filter(Boolean),downstreamConsumers:[],action:a.calibrationAction||"",userVisible:!0})),n=Object.fromEntries(v(t.map(a=>a.modelAreaId)).map(a=>[a,a]));return{schemaVersion:1,generatedAt:e.generatedAt,generatedBy:e.generatedBy||"previous calibration report",scope:e.scope||"Previous benchmark-only calibration report.",interpretation:e.interpretation||"These rows are benchmark anchors from the previous calibration report format.",headlineCounts:{modelAreas:Object.keys(n).length,verificationRows:t.length,passedRows:t.filter(a=>a.status==="PASS").length,warningRows:0,failedRows:t.filter(a=>a.status==="FAIL").length,gapRows:t.filter(a=>a.status==="GAP").length,blockedRows:0,infoRows:t.filter(a=>a.status==="INFO").length,releaseGatesPassed:0,releaseGatesFailed:0},filters:{modelAreaLabels:n,modelAreas:Object.keys(n),families:["anchor"],statuses:v(t.map(a=>a.status)),severities:v(t.map(a=>a.severity)),sourceClasses:v(t.map(a=>a.sourceClass)),confidences:v(t.map(a=>a.confidence))},modelAreas:Object.entries(n).map(([a,d])=>({id:a,label:d,trustLevel:"bounded",registryKeys:[],coverageSummary:{anchor:!0}})),verificationRows:t,rows:t,releaseGates:[],openGaps:t.filter(a=>a.status==="GAP"||a.status==="FAIL"),recommendations:[{priority:"transition",text:"Regenerate the Science Verification Matrix to replace this previous report."}]}}function Z(e){return Array.isArray(e.verificationRows)?{...e,rows:e.verificationRows,filters:{...e.filters,modelAreaLabels:e.filters?.modelAreaLabels||Object.fromEntries((e.modelAreas||[]).map(i=>[i.id,i.label]))}}:Y(e)}function D(e){let i=String(e.status||"INFO").toLowerCase();return`<span class="validation-status validation-status--${s(i)}">${s(V(e.status))}</span>`}function ee(e){return`<div class="validation-row-detail">
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
      ${Q(e.sourceUrls||[])}
      ${I("Assumptions",e.assumptions||[])}
      ${I("Limitations",e.limitations||[])}
      ${I("Downstream consumers",e.downstreamConsumers||[])}
    </div>
  </div>`}function te(e){let i=e.coverageSummary||{},t=Object.entries(i).filter(([,n])=>n);return t.length?t.map(([n])=>`<span class="badge">${s(O(n))}</span>`).join(" "):'<span class="hint">No direct rows yet</span>'}function ae(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
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
        <td>${te(t)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:""}function ie(e=[]){return e.length?`<div class="validation-table-shell validation-table-shell--compact">
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
        <td>${D(t)}</td>
        <td>${s(t.output)}</td>
        <td>${s(t.action)}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`:'<p class="hint">No release gate rows were recorded in this artifact.</p>'}function se(e,i,t){let a=`${`validation-row-${t}`}-details`;return`<tr
    class="validation-calibration-row validation-verification-row"
    data-row-index="${t}"
    data-search="${s(J(e,i))}"
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
    <td>${s(O(e.family))}</td>
    <td>${s(e.subject)}</td>
    <td>${s(e.metric)}</td>
    <td>${D(e)}</td>
    <td>${s(e.severity)}</td>
    <td>${s(e.sourceClass)}</td>
  </tr>
  <tr
    id="${s(a)}"
    class="validation-verification-details-row"
    data-row-details="${t}"
    hidden
  >
    <td colspan="8">${ee(e)}</td>
  </tr>`}function ne(e){e.className="page validation-page",e.innerHTML=`
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
    </div>
  `,e.querySelector("[data-validation-content]")?.replaceChildren(re())}function re(){return T({label:"Loading science verification matrix",className:"validation-report-skeleton",children:[j({count:8}),S("div",{className:"panel validation-matrix-panel"},[S("div",{className:"panel__header",attrs:{"aria-hidden":"true"}},[b({className:"skeleton-line",width:"34%",height:18}),b({className:"skeleton-page__button",width:84,height:28})]),S("div",{className:"panel__body"},[S("div",{className:"validation-controls",attrs:{"aria-hidden":"true"}},[b({className:"skeleton-page__search",width:"32%",height:38}),b({className:"skeleton-page__button",width:128,height:38}),b({className:"skeleton-page__button",width:116,height:38}),b({className:"skeleton-page__button",width:104,height:38})]),P({columns:8,rows:8})])])]})}function le(e,i){e.innerHTML=`
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
  `}function q(e,i){let t=Z(i),n=e.querySelector("[data-validation-content]"),a=t.headlineCounts||{},d=Array.isArray(t.rows)?t.rows:[],y=t.filters?.modelAreaLabels||{},_=t.filters?.modelAreas?.length?t.filters.modelAreas:v(d.map(o=>o.modelAreaId)),A=t.filters?.families?.length?t.filters.families:v(d.map(o=>o.family)),C=t.filters?.statuses?.length?t.filters.statuses:v(d.map(o=>o.status)),u=t.filters?.severities?.length?t.filters.severities:v(d.map(o=>o.severity)),m=t.filters?.sourceClasses?.length?t.filters.sourceClasses:v(d.map(o=>o.sourceClass)),w=e.querySelector("[data-validation-html]"),x=e.querySelector("[data-validation-markdown]");w&&t.artifactHtmlUrl&&(w.href=t.artifactHtmlUrl),x&&t.artifactMarkdownUrl&&(x.href=t.artifactMarkdownUrl),n.innerHTML=`
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
        ${W()}
        <div class="validation-controls" aria-label="Science verification filters">
          <label class="validation-field validation-field--search">
            <span>Search</span>
            <input data-validation-search type="search" autocomplete="off" placeholder="model, metric, output, action..." />
          </label>
          <label class="validation-field">
            <span>Model area</span>
            <select data-validation-model-area>${k(_,"All model areas",y)}</select>
          </label>
          <label class="validation-field">
            <span>Family</span>
            <select data-validation-family>${k(A,"All families",B)}</select>
          </label>
          <label class="validation-field">
            <span>Status</span>
            <select data-validation-status>${k(C,"All statuses",F)}</select>
          </label>
          <label class="validation-field">
            <span>Severity</span>
            <select data-validation-severity>${k(u,"All severities")}</select>
          </label>
          <label class="validation-field">
            <span>Source</span>
            <select data-validation-source-class>${k(m,"All sources")}</select>
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
            <tbody>${d.map((o,f)=>se(o,y[o.modelAreaId]||o.modelAreaId,f)).join("")}</tbody>
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
            ${z()}
          </div>
          <div>
            <h2>Release Gates</h2>
            ${ie(t.releaseGates||[])}
          </div>
        </div>
      </div>
    </details>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Model Area Coverage</h2>
      </div>
      <div class="panel__body">
        ${ae(t.modelAreas||[])}
      </div>
    </div>
  `,oe(n)}function oe(e){let i={search:e.querySelector("[data-validation-search]"),modelArea:e.querySelector("[data-validation-model-area]"),family:e.querySelector("[data-validation-family]"),status:e.querySelector("[data-validation-status]"),severity:e.querySelector("[data-validation-severity]"),sourceClass:e.querySelector("[data-validation-source-class]")},t=e.querySelector("[data-validation-count]"),n=Array.from(e.querySelectorAll("[data-validation-quick-filter]")),a=e.querySelector("[data-validation-pagination]"),d=e.querySelector("[data-validation-page-prev]"),y=e.querySelector("[data-validation-page-next]"),_=e.querySelector("[data-validation-page-status]"),A=Array.from(e.querySelectorAll(".validation-verification-row")),C=new Map(Array.from(e.querySelectorAll("[data-row-details]")).map(l=>[l.dataset.rowDetails,l])),u="",m=0,w=l=>{let r=String(l.dataset.status||"").toUpperCase(),c=R(l.dataset.family),p=R(l.dataset.sourceClass);return u?u==="issues"?["FAIL","WARN","GAP","BLOCKED","CHECK"].includes(r):u==="failures"?r==="FAIL"||r==="CHECK":u==="warnings"?r==="WARN":u==="gaps"?r==="GAP":u==="release-gates"?c==="release-gate":u==="nasa-anchors"?c==="anchor"&&p.includes("nasa"):u==="user-visible"?l.dataset.userVisible==="true":!0:!0},x=l=>{let r=R(i.search?.value);return!(r&&!R(l.dataset.search).includes(r)||i.modelArea?.value&&l.dataset.modelArea!==i.modelArea.value||i.family?.value&&l.dataset.family!==i.family.value||i.status?.value&&l.dataset.status!==i.status.value||i.severity?.value&&l.dataset.severity!==i.severity.value||i.sourceClass?.value&&l.dataset.sourceClass!==i.sourceClass.value||!w(l))},o=l=>{let r=l.dataset.rowIndex,c=C.get(r),p=l.querySelector("[data-validation-row-toggle]");l.classList.remove("is-expanded"),c&&(c.hidden=!0),p&&(p.setAttribute("aria-expanded","false"),p.textContent="Details")},f=({resetPage:l=!1}={})=>{let r=A.filter(x);l&&(m=0);let c=r.length>300,p=c?Math.max(1,Math.ceil(r.length/L)):1;m=Math.min(m,p-1);let $=c?m*L:0,g=c?$+L:r.length,E=new Set(r.slice($,g));for(let U of A){let N=E.has(U);U.hidden=!N,N||o(U)}t&&(t.textContent=c?`${r.length} of ${A.length} rows, page ${m+1} of ${p}`:`${r.length} of ${A.length} rows`),a&&(a.hidden=!c),_&&(_.textContent=c?`Showing ${$+1}-${Math.min(g,r.length)} of ${r.length}`:""),d&&(d.disabled=m<=0),y&&(y.disabled=m>=p-1)};Object.values(i).forEach(l=>{l?.addEventListener("input",()=>f({resetPage:!0}))}),n.forEach(l=>{l.addEventListener("click",()=>{u=l.dataset.validationQuickFilter||"",n.forEach(r=>{let c=(r.dataset.validationQuickFilter||"")===u;r.classList.toggle("is-active",c),r.setAttribute("aria-pressed",c?"true":"false")}),f({resetPage:!0})})}),d?.addEventListener("click",()=>{m=Math.max(0,m-1),f()}),y?.addEventListener("click",()=>{m+=1,f()}),e.addEventListener("click",l=>{let r=l.target.closest("[data-validation-row-toggle]");if(!r)return;let c=r.closest(".validation-verification-row"),p=r.dataset.validationRowToggle,$=C.get(p);if(!c||!$)return;let g=r.getAttribute("aria-expanded")==="true";c.classList.toggle("is-expanded",!g),$.hidden=g,r.setAttribute("aria-expanded",g?"false":"true"),r.textContent=g?"Details":"Hide"}),f()}async function de(){let e=globalThis.fetch;if(typeof e!="function")throw new Error("This browser environment does not expose fetch().");let i=[];for(let t of M)try{let n=await e(t.dataUrl,{cache:"no-store"});if(!n.ok){i.push(`${t.dataUrl}: HTTP ${n.status}`);continue}return{...await n.json(),artifactDataUrl:t.dataUrl,artifactHtmlUrl:t.htmlUrl,artifactMarkdownUrl:t.markdownUrl}}catch(n){i.push(`${t.dataUrl}: ${n?.message||n}`)}throw new Error(`Tried ${i.join("; ")}.`)}function pe(e,i={}){let t=document.createElement("div"),n=!0;return ne(t),e.innerHTML="",e.appendChild(t),i.reportData?(q(t,{...i.reportData,artifactHtmlUrl:i.reportData.artifactHtmlUrl||M[0].htmlUrl,artifactMarkdownUrl:i.reportData.artifactMarkdownUrl||M[0].markdownUrl}),()=>{n=!1}):(de().then(a=>{n&&q(t,a)}).catch(a=>{n&&le(t.querySelector("[data-validation-content]"),a)}),()=>{n=!1})}export{pe as initValidationPage};
