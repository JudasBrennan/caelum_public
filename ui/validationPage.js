import { escapeHtml } from "./uiHelpers.js";

const REPORT_CANDIDATES = Object.freeze([
  {
    dataUrl: "reports/model-calibration-report.json",
    htmlUrl: "reports/model-calibration-report.html",
    markdownUrl: "reports/model-calibration-report.md",
  },
  {
    dataUrl: "test-results/model-calibration-report.json",
    htmlUrl: "test-results/model-calibration-report.html",
    markdownUrl: "test-results/model-calibration-report.md",
  },
]);

const STATUS_LABELS = Object.freeze({
  CHECK: "Needs calibration",
  GAP: "Modeling gap",
  INFO: "Info",
  OK: "OK",
});

const VIEW_LABELS = Object.freeze({
  all: "All rows",
  issues: "Issues and gaps",
  "hard-issue": "Hard calibration issues",
  "semantic-mismatch": "Semantic mismatches",
  "modeling-gap": "Modeling gaps",
  watch: "High-uncertainty anchors",
  resolved: "Resolved rows",
  ok: "Passing rows",
});

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function uniqueSorted(values) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right),
  );
}

function optionHtml(value, label = value) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function optionsHtml(values, allLabel) {
  return [optionHtml("", allLabel), ...values.map((value) => optionHtml(value))].join("");
}

function rowIssueKind(row) {
  if (row.issueKind) return row.issueKind;
  if (row.comparisonSemantics === "semantic-mismatch") return "semantic-mismatch";
  if (row.status === "CHECK") return "hard-issue";
  if (row.status === "GAP") return "modeling-gap";
  if (row.highUncertaintyWithinBroadTolerance) return "watch";
  if (row.resolvedSincePreviousRun) return "resolved";
  if (row.status === "INFO") return "info";
  return "ok";
}

function rowIssueClass(row) {
  if (row.issueClass) return row.issueClass;
  const kind = rowIssueKind(row);
  if (kind === "semantic-mismatch") return "row-semantic";
  if (kind === "hard-issue") return "row-check";
  if (kind === "modeling-gap") return "row-gap";
  if (kind === "watch") return "row-watch";
  return "row-ok";
}

function rowStatusLabel(row) {
  return row.displayStatus || STATUS_LABELS[row.status] || row.status || "Unknown";
}

function rowSearchText(row) {
  return [
    row.category,
    row.object,
    row.metric,
    row.input,
    row.output,
    row.reference,
    row.diffDisplay,
    row.status,
    row.displayStatus,
    row.sourceCategory,
    row.modelQuantityKind,
    row.referenceQuantityKind,
    row.comparisonSemantics,
    row.uncertaintyKind,
    row.calibrationAction,
    row.source,
    row.note,
  ]
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();
}

function anchorValue(row) {
  return row.solarSystemAnchor ? "solar" : "non-solar";
}

function viewMatches(row, view) {
  const kind = rowIssueKind(row);
  if (!view || view === "all") return true;
  if (view === "issues") {
    return kind === "hard-issue" || kind === "semantic-mismatch" || kind === "modeling-gap";
  }
  return kind === view;
}

function kpiHtml(label, value, className = "") {
  return `<div class="validation-kpi ${className}">
    <div class="validation-kpi__value">${escapeHtml(value)}</div>
    <div class="validation-kpi__label">${escapeHtml(label)}</div>
  </div>`;
}

function formatWorst(summary) {
  if (!summary?.worst) return "n/a";
  return `${summary.worst.object} - ${summary.worst.metric} (${summary.worst.diffDisplay})`;
}

function summaryTableHtml(caption, summaries, labelHeader) {
  if (!summaries?.length) return "";
  const rows = summaries
    .map(
      (summary) => `<tr>
        <td>${escapeHtml(summary.label || summary.category)}</td>
        <td class="number">${escapeHtml(summary.rows)}</td>
        <td class="number">${escapeHtml(summary.numeric)}</td>
        <td class="number">${escapeHtml(summary.meanDisplay || "n/a")}</td>
        <td class="number">${escapeHtml(summary.checks)}</td>
        <td class="number">${escapeHtml(summary.gaps)}</td>
        <td>${escapeHtml(formatWorst(summary))}</td>
      </tr>`,
    )
    .join("");

  return `<div class="validation-table-shell validation-table-shell--compact">
    <table>
      <caption>${escapeHtml(caption)}</caption>
      <thead>
        <tr>
          <th>${escapeHtml(labelHeader)}</th>
          <th>Rows</th>
          <th>Numeric</th>
          <th>Mean delta</th>
          <th>Checks</th>
          <th>Gaps</th>
          <th>Worst numeric delta</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function statusBadgeHtml(row) {
  const status = String(row.status || "INFO").toLowerCase();
  return `<span class="validation-status validation-status--${escapeHtml(status)}">${escapeHtml(
    rowStatusLabel(row),
  )}</span>`;
}

function calibrationRowHtml(row) {
  const searchText = rowSearchText(row);
  const sourceCategory = row.sourceCategory || "Unclassified";
  const anchor = anchorValue(row);
  return `<tr
    class="validation-calibration-row ${escapeHtml(rowIssueClass(row))}"
    data-search="${escapeHtml(searchText)}"
    data-status="${escapeHtml(row.status || "")}"
    data-issue-kind="${escapeHtml(rowIssueKind(row))}"
    data-category="${escapeHtml(row.category || "")}"
    data-source-category="${escapeHtml(sourceCategory)}"
    data-anchor="${escapeHtml(anchor)}"
  >
    <td>${escapeHtml(row.category)}</td>
    <td>${escapeHtml(row.object)}</td>
    <td>${escapeHtml(row.metric)}</td>
    <td>${escapeHtml(row.output)}</td>
    <td>${escapeHtml(row.reference)}</td>
    <td class="number">${escapeHtml(row.diffDisplay || "n/a")}</td>
    <td class="number">${escapeHtml(row.toleranceDisplay || "n/a")}</td>
    <td>${statusBadgeHtml(row)}</td>
    <td>${escapeHtml(sourceCategory)}</td>
    <td>${escapeHtml(anchor === "solar" ? "Solar System" : "Non-Solar")}</td>
    <td>${escapeHtml(row.calibrationAction || "")}</td>
    <td>${escapeHtml(row.note || "")}</td>
  </tr>`;
}

function renderShell(root) {
  root.className = "page validation-page";
  root.innerHTML = `
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
  `;
}

function renderError(contentEl, error) {
  contentEl.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Report Unavailable</h2>
      </div>
      <div class="panel__body">
        <p>The prebuilt calibration report could not be loaded.</p>
        <p class="hint">${escapeHtml(error?.message || error)}</p>
        <p class="hint">Run <code>npm run calibration:report</code> and rebuild the app to refresh the release artifact.</p>
      </div>
    </div>
  `;
}

function renderReport(root, report) {
  const contentEl = root.querySelector("[data-validation-content]");
  const counts = report.headlineCounts || {};
  const rows = Array.isArray(report.rows) ? report.rows : [];
  const categories = report.filters?.categories?.length
    ? report.filters.categories
    : uniqueSorted(rows.map((row) => row.category));
  const sourceCategories = report.filters?.sourceCategories?.length
    ? report.filters.sourceCategories
    : uniqueSorted(rows.map((row) => row.sourceCategory));

  const htmlLink = root.querySelector("[data-validation-html]");
  const markdownLink = root.querySelector("[data-validation-markdown]");
  if (htmlLink && report.artifactHtmlUrl) htmlLink.href = report.artifactHtmlUrl;
  if (markdownLink && report.artifactMarkdownUrl) markdownLink.href = report.artifactMarkdownUrl;

  contentEl.innerHTML = `
    <div class="validation-kpis" aria-label="Calibration report headline counts">
      ${kpiHtml("Calibration rows", counts.totalRows ?? rows.length)}
      ${kpiHtml("Numeric rows", counts.numericRows ?? rows.filter((row) => Number.isFinite(row.diffPct)).length)}
      ${kpiHtml("Needs attention", counts.checks ?? rows.filter((row) => row.status === "CHECK").length, "validation-kpi--check")}
      ${kpiHtml("Hard physics issues", counts.hardIssues ?? rows.filter((row) => rowIssueKind(row) === "hard-issue").length, "validation-kpi--check")}
      ${kpiHtml("Modeling gaps", counts.gaps ?? rows.filter((row) => row.status === "GAP").length, "validation-kpi--gap")}
      ${kpiHtml("Resolved", counts.resolvedRows ?? rows.filter((row) => rowIssueKind(row) === "resolved").length, "validation-kpi--ok")}
    </div>

    <div class="panel validation-explainer">
      <div class="panel__body">
        <div class="validation-explainer__grid">
          <div>
            <h2>What The Report Means</h2>
            <p>${escapeHtml(report.scope || "")}</p>
            <p>${escapeHtml(report.interpretation || "")}</p>
          </div>
          <div>
            <h2>Generalization Coverage</h2>
            ${summaryTableHtml("Anchor summary", report.anchorSummary || [], "Anchor group")}
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Calibration Rows</h2>
        <div class="badge" data-validation-count aria-live="polite">${escapeHtml(rows.length)} rows</div>
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
              ${Object.entries(VIEW_LABELS)
                .map(([value, label]) => optionHtml(value, label))
                .join("")}
            </select>
          </label>
          <label class="validation-field">
            <span>Status</span>
            <select data-validation-status>
              <option value="">All statuses</option>
              ${Object.entries(STATUS_LABELS)
                .map(([value, label]) => optionHtml(value, label))
                .join("")}
            </select>
          </label>
          <label class="validation-field">
            <span>Category</span>
            <select data-validation-category>${optionsHtml(categories, "All categories")}</select>
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
            <select data-validation-source>${optionsHtml(sourceCategories, "All source groups")}</select>
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
            <tbody>${rows.map(calibrationRowHtml).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="validation-summary-grid">
      <div class="panel">
        <div class="panel__body">
          <h2>Category Summary</h2>
          ${summaryTableHtml("Category summary", report.categorySummary || [], "Category")}
        </div>
      </div>
      <div class="panel">
        <div class="panel__body">
          <h2>Source Summary</h2>
          ${summaryTableHtml("Source category summary", report.sourceCategorySummary || [], "Source group")}
        </div>
      </div>
    </div>
  `;

  attachFilters(contentEl);
}

function attachFilters(contentEl) {
  const controls = {
    search: contentEl.querySelector("[data-validation-search]"),
    view: contentEl.querySelector("[data-validation-view]"),
    status: contentEl.querySelector("[data-validation-status]"),
    category: contentEl.querySelector("[data-validation-category]"),
    anchor: contentEl.querySelector("[data-validation-anchor]"),
    source: contentEl.querySelector("[data-validation-source]"),
  };
  const countEl = contentEl.querySelector("[data-validation-count]");
  const rows = Array.from(contentEl.querySelectorAll(".validation-calibration-row"));

  const matches = (row) => {
    const query = normalize(controls.search?.value);
    if (query && !normalize(row.dataset.search).includes(query)) return false;
    if (!viewMatches({ issueKind: row.dataset.issueKind }, controls.view?.value || "all")) {
      return false;
    }
    if (controls.status?.value && row.dataset.status !== controls.status.value) return false;
    if (controls.category?.value && row.dataset.category !== controls.category.value) return false;
    if (controls.anchor?.value && row.dataset.anchor !== controls.anchor.value) return false;
    if (controls.source?.value && row.dataset.sourceCategory !== controls.source.value)
      return false;
    return true;
  };

  const applyFilters = () => {
    let visible = 0;
    for (const row of rows) {
      const show = matches(row);
      row.hidden = !show;
      if (show) visible += 1;
    }
    if (countEl) countEl.textContent = `${visible} of ${rows.length} rows`;
  };

  Object.values(controls).forEach((control) => {
    control?.addEventListener("input", applyFilters);
  });
  applyFilters();
}

async function loadCalibrationReport() {
  const fetchImpl = globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("This browser environment does not expose fetch().");
  }

  const errors = [];
  for (const candidate of REPORT_CANDIDATES) {
    try {
      const response = await fetchImpl(candidate.dataUrl, { cache: "no-store" });
      if (!response.ok) {
        errors.push(`${candidate.dataUrl}: HTTP ${response.status}`);
        continue;
      }
      const report = await response.json();
      return {
        ...report,
        artifactDataUrl: candidate.dataUrl,
        artifactHtmlUrl: candidate.htmlUrl,
        artifactMarkdownUrl: candidate.markdownUrl,
      };
    } catch (error) {
      errors.push(`${candidate.dataUrl}: ${error?.message || error}`);
    }
  }

  throw new Error(`Tried ${errors.join("; ")}.`);
}

export function initValidationPage(mountEl, options = {}) {
  const root = document.createElement("div");
  let active = true;
  renderShell(root);

  mountEl.innerHTML = "";
  mountEl.appendChild(root);

  if (options.reportData) {
    renderReport(root, {
      ...options.reportData,
      artifactHtmlUrl: options.reportData.artifactHtmlUrl || REPORT_CANDIDATES[0].htmlUrl,
      artifactMarkdownUrl:
        options.reportData.artifactMarkdownUrl || REPORT_CANDIDATES[0].markdownUrl,
    });
    return () => {
      active = false;
    };
  }

  void loadCalibrationReport()
    .then((report) => {
      if (active) renderReport(root, report);
    })
    .catch((error) => {
      if (active) renderError(root.querySelector("[data-validation-content]"), error);
    });

  return () => {
    active = false;
  };
}
