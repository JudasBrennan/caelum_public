import{a as e}from"./chunk-7PVDVLB6.js";import"./chunk-VC46IEJQ.js";var m=Object.freeze([{dataUrl:"reports/model-calibration-report.json",htmlUrl:"reports/model-calibration-report.html",markdownUrl:"reports/model-calibration-report.md"},{dataUrl:"test-results/model-calibration-report.json",htmlUrl:"test-results/model-calibration-report.html",markdownUrl:"test-results/model-calibration-report.md"}]),S=Object.freeze({CHECK:"Needs calibration",GAP:"Modeling gap",INFO:"Info",OK:"OK"}),k=Object.freeze({all:"All rows",issues:"Issues and gaps","hard-issue":"Hard calibration issues","semantic-mismatch":"Semantic mismatches","modeling-gap":"Modeling gaps",watch:"High-uncertainty anchors",resolved:"Resolved rows",ok:"Passing rows"});function g(a){return String(a??"").trim().toLowerCase()}function b(a){return[...new Set(a.map(t=>String(t??"").trim()).filter(Boolean))].sort((t,i)=>t.localeCompare(i))}function p(a,t=a){return`<option value="${e(a)}">${e(t)}</option>`}function y(a,t){return[p("",t),...a.map(i=>p(i))].join("")}function u(a){return a.issueKind?a.issueKind:a.comparisonSemantics==="semantic-mismatch"?"semantic-mismatch":a.status==="CHECK"?"hard-issue":a.status==="GAP"?"modeling-gap":a.highUncertaintyWithinBroadTolerance?"watch":a.resolvedSincePreviousRun?"resolved":a.status==="INFO"?"info":"ok"}function C(a){if(a.issueClass)return a.issueClass;let t=u(a);return t==="semantic-mismatch"?"row-semantic":t==="hard-issue"?"row-check":t==="modeling-gap"?"row-gap":t==="watch"?"row-watch":"row-ok"}function _(a){return a.displayStatus||S[a.status]||a.status||"Unknown"}function U(a){return[a.category,a.object,a.metric,a.input,a.output,a.reference,a.diffDisplay,a.status,a.displayStatus,a.sourceCategory,a.modelQuantityKind,a.referenceQuantityKind,a.comparisonSemantics,a.uncertaintyKind,a.calibrationAction,a.source,a.note].map(t=>String(t??"")).join(" ").toLowerCase()}function A(a){return a.solarSystemAnchor?"solar":"non-solar"}function H(a,t){let i=u(a);return!t||t==="all"?!0:t==="issues"?i==="hard-issue"||i==="semantic-mismatch"||i==="modeling-gap":i===t}function c(a,t,i=""){return`<div class="validation-kpi ${i}">
    <div class="validation-kpi__value">${e(t)}</div>
    <div class="validation-kpi__label">${e(a)}</div>
  </div>`}function T(a){return a?.worst?`${a.worst.object} - ${a.worst.metric} (${a.worst.diffDisplay})`:"n/a"}function f(a,t,i){if(!t?.length)return"";let s=t.map(n=>`<tr>
        <td>${e(n.label||n.category)}</td>
        <td class="number">${e(n.rows)}</td>
        <td class="number">${e(n.numeric)}</td>
        <td class="number">${e(n.meanDisplay||"n/a")}</td>
        <td class="number">${e(n.checks)}</td>
        <td class="number">${e(n.gaps)}</td>
        <td>${e(T(n))}</td>
      </tr>`).join("");return`<div class="validation-table-shell validation-table-shell--compact">
    <table>
      <caption>${e(a)}</caption>
      <thead>
        <tr>
          <th>${e(i)}</th>
          <th>Rows</th>
          <th>Numeric</th>
          <th>Mean delta</th>
          <th>Checks</th>
          <th>Gaps</th>
          <th>Worst numeric delta</th>
        </tr>
      </thead>
      <tbody>${s}</tbody>
    </table>
  </div>`}function w(a){let t=String(a.status||"INFO").toLowerCase();return`<span class="validation-status validation-status--${e(t)}">${e(_(a))}</span>`}function j(a){let t=U(a),i=a.sourceCategory||"Unclassified",s=A(a);return`<tr
    class="validation-calibration-row ${e(C(a))}"
    data-search="${e(t)}"
    data-status="${e(a.status||"")}"
    data-issue-kind="${e(u(a))}"
    data-category="${e(a.category||"")}"
    data-source-category="${e(i)}"
    data-anchor="${e(s)}"
  >
    <td>${e(a.category)}</td>
    <td>${e(a.object)}</td>
    <td>${e(a.metric)}</td>
    <td>${e(a.output)}</td>
    <td>${e(a.reference)}</td>
    <td class="number">${e(a.diffDisplay||"n/a")}</td>
    <td class="number">${e(a.toleranceDisplay||"n/a")}</td>
    <td>${w(a)}</td>
    <td>${e(i)}</td>
    <td>${e(s==="solar"?"Solar System":"Non-Solar")}</td>
    <td>${e(a.calibrationAction||"")}</td>
    <td>${e(a.note||"")}</td>
  </tr>`}function M(a){a.className="page validation-page",a.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title">
          <span class="ws-icon icon--validation" aria-hidden="true"></span>
          <span>Validation</span>
        </h1>
        <div class="badge">Calibration</div>
      </div>
      <div class="panel__body">
        <p>
          WorldSmith validates the generic engine against Solar System anchors,
          benchmark-star observations, and selected non-Solar exoplanet anchors.
          These checks are used to catch weak regimes without teaching the model
          special rules for Sol.
        </p>
        <p class="hint">
          The release bundle includes this report as prebuilt static data; it is
          refreshed during release verification.
        </p>
        <div class="validation-actions">
          <a class="validation-action validation-action--accent" data-validation-html href="reports/model-calibration-report.html" target="_blank" rel="noopener noreferrer">Standalone HTML</a>
          <a class="validation-action" data-validation-markdown href="reports/model-calibration-report.md" target="_blank" rel="noopener noreferrer">Markdown</a>
          <a class="validation-action" href="#/science">Science &amp; Maths</a>
        </div>
      </div>
    </div>
    <div class="validation-report" data-validation-content>
      <div class="panel">
        <div class="panel__body">
          <p class="hint">Loading prebuilt calibration report...</p>
        </div>
      </div>
    </div>
  `}function L(a,t){a.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Report Unavailable</h2>
      </div>
      <div class="panel__body">
        <p>The prebuilt calibration report could not be loaded.</p>
        <p class="hint">${e(t?.message||t)}</p>
        <p class="hint">Run <code>npm run calibration:report</code> and rebuild the app to refresh the release artifact.</p>
      </div>
    </div>
  `}function $(a,t){let i=a.querySelector("[data-validation-content]"),s=t.headlineCounts||{},n=Array.isArray(t.rows)?t.rows:[],h=t.filters?.categories?.length?t.filters.categories:b(n.map(r=>r.category)),l=t.filters?.sourceCategories?.length?t.filters.sourceCategories:b(n.map(r=>r.sourceCategory)),o=a.querySelector("[data-validation-html]"),d=a.querySelector("[data-validation-markdown]");o&&t.artifactHtmlUrl&&(o.href=t.artifactHtmlUrl),d&&t.artifactMarkdownUrl&&(d.href=t.artifactMarkdownUrl),i.innerHTML=`
    <div class="validation-kpis" aria-label="Calibration report headline counts">
      ${c("Calibration rows",s.totalRows??n.length)}
      ${c("Numeric rows",s.numericRows??n.filter(r=>Number.isFinite(r.diffPct)).length)}
      ${c("Needs attention",s.checks??n.filter(r=>r.status==="CHECK").length,"validation-kpi--check")}
      ${c("Hard physics issues",s.hardIssues??n.filter(r=>u(r)==="hard-issue").length,"validation-kpi--check")}
      ${c("Modeling gaps",s.gaps??n.filter(r=>r.status==="GAP").length,"validation-kpi--gap")}
      ${c("Resolved",s.resolvedRows??n.filter(r=>u(r)==="resolved").length,"validation-kpi--ok")}
    </div>

    <div class="panel validation-explainer">
      <div class="panel__body">
        <div class="validation-explainer__grid">
          <div>
            <h2>What The Report Means</h2>
            <p>${e(t.scope||"")}</p>
            <p>${e(t.interpretation||"")}</p>
          </div>
          <div>
            <h2>Generalization Coverage</h2>
            ${f("Anchor summary",t.anchorSummary||[],"Anchor group")}
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Calibration Rows</h2>
        <div class="badge" data-validation-count aria-live="polite">${e(n.length)} rows</div>
      </div>
      <div class="panel__body">
        <div class="validation-controls" aria-label="Calibration report filters">
          <label class="validation-field validation-field--search">
            <span>Search</span>
            <input data-validation-search type="search" autocomplete="off" placeholder="planet, metric, source, action..." />
          </label>
          <label class="validation-field">
            <span>View</span>
            <select data-validation-view>
              ${Object.entries(k).map(([r,v])=>p(r,v)).join("")}
            </select>
          </label>
          <label class="validation-field">
            <span>Status</span>
            <select data-validation-status>
              <option value="">All statuses</option>
              ${Object.entries(S).map(([r,v])=>p(r,v)).join("")}
            </select>
          </label>
          <label class="validation-field">
            <span>Category</span>
            <select data-validation-category>${y(h,"All categories")}</select>
          </label>
          <label class="validation-field">
            <span>Anchor</span>
            <select data-validation-anchor>
              <option value="">All anchors</option>
              <option value="solar">Solar System</option>
              <option value="non-solar">Non-Solar</option>
            </select>
          </label>
          <label class="validation-field">
            <span>Source group</span>
            <select data-validation-source>${y(l,"All source groups")}</select>
          </label>
        </div>
        <div class="validation-table-shell">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Object</th>
                <th>Metric</th>
                <th>Model output</th>
                <th>Reference</th>
                <th>Delta</th>
                <th>Tolerance</th>
                <th>Status</th>
                <th>Source group</th>
                <th>Anchor</th>
                <th>Action</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>${n.map(j).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="validation-summary-grid">
      <div class="panel">
        <div class="panel__body">
          <h2>Category Summary</h2>
          ${f("Category summary",t.categorySummary||[],"Category")}
        </div>
      </div>
      <div class="panel">
        <div class="panel__body">
          <h2>Source Summary</h2>
          ${f("Source category summary",t.sourceCategorySummary||[],"Source group")}
        </div>
      </div>
    </div>
  `,R(i)}function R(a){let t={search:a.querySelector("[data-validation-search]"),view:a.querySelector("[data-validation-view]"),status:a.querySelector("[data-validation-status]"),category:a.querySelector("[data-validation-category]"),anchor:a.querySelector("[data-validation-anchor]"),source:a.querySelector("[data-validation-source]")},i=a.querySelector("[data-validation-count]"),s=Array.from(a.querySelectorAll(".validation-calibration-row")),n=l=>{let o=g(t.search?.value);return!(o&&!g(l.dataset.search).includes(o)||!H({issueKind:l.dataset.issueKind},t.view?.value||"all")||t.status?.value&&l.dataset.status!==t.status.value||t.category?.value&&l.dataset.category!==t.category.value||t.anchor?.value&&l.dataset.anchor!==t.anchor.value||t.source?.value&&l.dataset.sourceCategory!==t.source.value)},h=()=>{let l=0;for(let o of s){let d=n(o);o.hidden=!d,d&&(l+=1)}i&&(i.textContent=`${l} of ${s.length} rows`)};Object.values(t).forEach(l=>{l?.addEventListener("input",h)}),h()}async function q(){let a=globalThis.fetch;if(typeof a!="function")throw new Error("This browser environment does not expose fetch().");let t=[];for(let i of m)try{let s=await a(i.dataUrl,{cache:"no-store"});if(!s.ok){t.push(`${i.dataUrl}: HTTP ${s.status}`);continue}return{...await s.json(),artifactDataUrl:i.dataUrl,artifactHtmlUrl:i.htmlUrl,artifactMarkdownUrl:i.markdownUrl}}catch(s){t.push(`${i.dataUrl}: ${s?.message||s}`)}throw new Error(`Tried ${t.join("; ")}.`)}function K(a,t={}){let i=document.createElement("div"),s=!0;return M(i),a.innerHTML="",a.appendChild(i),t.reportData?($(i,{...t.reportData,artifactHtmlUrl:t.reportData.artifactHtmlUrl||m[0].htmlUrl,artifactMarkdownUrl:t.reportData.artifactMarkdownUrl||m[0].markdownUrl}),()=>{s=!1}):(q().then(n=>{s&&$(i,n)}).catch(n=>{s&&L(i.querySelector("[data-validation-content]"),n)}),()=>{s=!1})}export{K as initValidationPage};
