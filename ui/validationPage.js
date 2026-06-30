import { escapeHtml } from "./uiHelpers.js";
import { createElement } from "./domHelpers.js";
import {
  createSkeletonBlock,
  createSkeletonKpiStrip,
  createSkeletonRegion,
  createSkeletonTable,
} from "./workflow/skeleton.js";

const REPORT_CANDIDATES = Object.freeze([
  {
    dataUrl: "reports/science-verification-matrix.json",
    htmlUrl: "reports/science-verification-matrix.html",
    markdownUrl: "reports/science-verification-matrix.md",
  },
  {
    dataUrl: "test-results/science-verification-matrix.json",
    htmlUrl: "test-results/science-verification-matrix.html",
    markdownUrl: "test-results/science-verification-matrix.md",
  },
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
  PASS: "Pass",
  WARN: "Warning",
  FAIL: "Failure",
  GAP: "Modeling gap",
  INFO: "Info",
  BLOCKED: "Blocked",
  OK: "Pass",
  CHECK: "Needs calibration",
});

const VALIDATION_PAGE_SIZE = 100;

const QUICK_FILTERS = Object.freeze([
  { id: "issues", label: "Issues" },
  { id: "failures", label: "Failures" },
  { id: "warnings", label: "Warnings" },
  { id: "gaps", label: "Gaps" },
  { id: "release-gates", label: "Release gates" },
  { id: "nasa-anchors", label: "NASA anchors" },
  { id: "user-visible", label: "User-visible" },
]);

const FAMILY_LABELS = Object.freeze({
  anchor: "Anchor",
  invariant: "Invariant",
  metamorphic: "Metamorphic",
  boundary: "Boundary",
  "cross-system": "Cross-system",
  unit: "Unit",
  oracle: "Oracle",
  sensitivity: "Sensitivity",
  population: "Population",
  browser: "Browser",
  "source-coverage": "Source coverage",
  "release-gate": "Release gate",
});

const MATRIX_TERM_DEFINITIONS = Object.freeze([
  {
    term: "Benchmark anchors",
    definition:
      "Direct comparisons against trusted published reference values, such as NASA/JPL or peer-reviewed benchmark cases.",
  },
  {
    term: "Invariants",
    definition:
      "Physical rules that should always hold, such as positive masses, normalized fractions, and stable unit relationships.",
  },
  {
    term: "Trend checks",
    definition:
      "Metamorphic tests that confirm outputs move in the expected direction when one physical input is changed.",
  },
  {
    term: "Boundary checks",
    definition:
      "Regime-edge tests around thresholds such as phase changes, stability limits, escape limits, and classification boundaries.",
  },
  {
    term: "Cross-system coupling",
    definition:
      "Checks that one model's output is carried into downstream models that should physically depend on it.",
  },
  {
    term: "Units",
    definition:
      "Dimensional and conversion checks that catch scale errors between AU, km, Earth units, solar units, SI units, years, and days.",
  },
  {
    term: "Independent formula oracles",
    definition:
      "Small standalone calculations used to verify core equations without relying on the same implementation path as the engine.",
  },
  {
    term: "Sensitivity",
    definition:
      "Perturbation checks that make sure small input changes produce bounded, explainable output changes.",
  },
  {
    term: "Population sanity",
    definition:
      "Generated-world checks that catch unrealistic distributions, missing regimes, or guided outputs outside expected physical ranges.",
  },
  {
    term: "Browser coverage",
    definition:
      "Production-bundle checks that confirm the user-visible app can load, render, import, export, and navigate with the matrix in place.",
  },
  {
    term: "Release gate",
    definition:
      "A required command or review step that must pass before release, including regression tests, matrix generation, build, bundle budget, and browser smoke tests.",
  },
]);

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

function optionsHtml(values, allLabel, labels = {}) {
  return [
    optionHtml("", allLabel),
    ...values.map((value) => optionHtml(value, labels[value] || value)),
  ].join("");
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function familyLabel(family) {
  return FAMILY_LABELS[family] || family || "Unknown";
}

function kpiHtml(label, value, className = "") {
  return `<div class="validation-kpi ${className}">
    <div class="validation-kpi__value">${escapeHtml(value)}</div>
    <div class="validation-kpi__label">${escapeHtml(label)}</div>
  </div>`;
}

function matrixTermDefinitionsHtml() {
  return `<dl class="validation-term-list">
    ${MATRIX_TERM_DEFINITIONS.map(
      ({ term, definition }) => `<div class="validation-term-list__item">
        <dt>${escapeHtml(term)}</dt>
        <dd>${escapeHtml(definition)}</dd>
      </div>`,
    ).join("")}
  </dl>`;
}

function quickFilterChipsHtml() {
  return `<div class="validation-quick-filters" aria-label="Quick filters">
    ${QUICK_FILTERS.map(
      (filter) =>
        `<button type="button" class="validation-filter-chip" data-validation-quick-filter="${escapeHtml(filter.id)}">${escapeHtml(filter.label)}</button>`,
    ).join("")}
    <button type="button" class="validation-filter-chip validation-filter-chip--clear" data-validation-quick-filter="">All rows</button>
  </div>`;
}

function listBlockHtml(label, values = []) {
  const normalized = (Array.isArray(values) ? values : [values])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  return `<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">${escapeHtml(label)}</div>
    ${
      normalized.length
        ? `<ul>${normalized.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`
        : `<p class="hint">None recorded.</p>`
    }
  </div>`;
}

function sourceUrlsHtml(urls = []) {
  const normalized = (Array.isArray(urls) ? urls : [urls])
    .map((url) => String(url ?? "").trim())
    .filter(Boolean);
  return `<div class="validation-row-detail__block">
    <div class="validation-row-detail__label">Source URLs</div>
    ${
      normalized.length
        ? `<ul>${normalized
            .map(
              (url) =>
                `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`,
            )
            .join("")}</ul>`
        : `<p class="hint">No source URL attached to this row.</p>`
    }
  </div>`;
}

function rowSearchText(row, modelAreaLabel = "") {
  return [
    row.modelAreaId,
    modelAreaLabel,
    row.family,
    row.subject,
    row.metric,
    row.inputSummary,
    row.output,
    row.expected,
    row.tolerance,
    row.status,
    row.severity,
    row.confidence,
    row.comparisonSemantics,
    row.sourceClass,
    row.action,
    ...(row.sourceUrls || []),
    ...(row.assumptions || []),
    ...(row.limitations || []),
    ...(row.downstreamConsumers || []),
  ]
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();
}

function previousIssueKind(row) {
  if (row.issueKind) return row.issueKind;
  if (row.status === "CHECK") return "hard-issue";
  if (row.status === "GAP") return "modeling-gap";
  if (row.status === "INFO") return "info";
  return "ok";
}

function convertPreviousCalibrationReport(report) {
  const previousRows = Array.isArray(report.rows) ? report.rows : [];
  const rows = previousRows.map((row, index) => ({
    id: `previous-calibration-${index}`,
    modelAreaId: row.category || "Previous calibration",
    family: "anchor",
    subject: row.object || "",
    metric: row.metric || "",
    inputSummary: row.input || "",
    output: row.output || "",
    expected: row.reference || "",
    tolerance: row.toleranceDisplay || "",
    status: row.status === "OK" ? "PASS" : row.status === "CHECK" ? "FAIL" : row.status || "INFO",
    severity: row.status === "CHECK" ? "high" : row.status === "GAP" ? "medium" : "info",
    confidence: row.highUncertaintyWithinBroadTolerance ? "low" : "medium",
    comparisonSemantics: row.comparisonSemantics || previousIssueKind(row),
    sourceClass: row.solarSystemAnchor ? "NASA" : row.sourceCategory || "Previous calibration",
    sourceUrls: [],
    assumptions: [row.modelQuantityKind, row.referenceQuantityKind].filter(Boolean),
    limitations: [row.uncertaintyKind, row.note].filter(Boolean),
    downstreamConsumers: [],
    action: row.calibrationAction || "",
    userVisible: true,
  }));
  const modelAreaLabels = Object.fromEntries(
    uniqueSorted(rows.map((row) => row.modelAreaId)).map((id) => [id, id]),
  );
  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    generatedBy: report.generatedBy || "previous calibration report",
    scope: report.scope || "Previous benchmark-only calibration report.",
    interpretation:
      report.interpretation ||
      "These rows are benchmark anchors from the previous calibration report format.",
    headlineCounts: {
      modelAreas: Object.keys(modelAreaLabels).length,
      verificationRows: rows.length,
      passedRows: rows.filter((row) => row.status === "PASS").length,
      warningRows: 0,
      failedRows: rows.filter((row) => row.status === "FAIL").length,
      gapRows: rows.filter((row) => row.status === "GAP").length,
      blockedRows: 0,
      infoRows: rows.filter((row) => row.status === "INFO").length,
      releaseGatesPassed: 0,
      releaseGatesFailed: 0,
    },
    filters: {
      modelAreaLabels,
      modelAreas: Object.keys(modelAreaLabels),
      families: ["anchor"],
      statuses: uniqueSorted(rows.map((row) => row.status)),
      severities: uniqueSorted(rows.map((row) => row.severity)),
      sourceClasses: uniqueSorted(rows.map((row) => row.sourceClass)),
      confidences: uniqueSorted(rows.map((row) => row.confidence)),
    },
    modelAreas: Object.entries(modelAreaLabels).map(([id, label]) => ({
      id,
      label,
      trustLevel: "bounded",
      registryKeys: [],
      coverageSummary: { anchor: true },
    })),
    verificationRows: rows,
    rows,
    releaseGates: [],
    openGaps: rows.filter((row) => row.status === "GAP" || row.status === "FAIL"),
    recommendations: [
      {
        priority: "transition",
        text: "Regenerate the Science Verification Matrix to replace this previous report.",
      },
    ],
  };
}

function normalizeReport(report) {
  if (Array.isArray(report.verificationRows)) {
    return {
      ...report,
      rows: report.verificationRows,
      filters: {
        ...report.filters,
        modelAreaLabels:
          report.filters?.modelAreaLabels ||
          Object.fromEntries((report.modelAreas || []).map((area) => [area.id, area.label])),
      },
    };
  }
  return convertPreviousCalibrationReport(report);
}

function statusBadgeHtml(row) {
  const status = String(row.status || "INFO").toLowerCase();
  return `<span class="validation-status validation-status--${escapeHtml(status)}">${escapeHtml(
    statusLabel(row.status),
  )}</span>`;
}

function rowDetailsHtml(row) {
  return `<div class="validation-row-detail">
    <div class="validation-row-detail__summary">
      <div>
        <div class="validation-row-detail__label">Input summary</div>
        <p>${escapeHtml(row.inputSummary || "No input summary recorded.")}</p>
      </div>
      <div>
        <div class="validation-row-detail__label">Tolerance</div>
        <p>${escapeHtml(row.tolerance || "No tolerance recorded.")}</p>
      </div>
      <div>
        <div class="validation-row-detail__label">Action</div>
        <p>${escapeHtml(row.action || "No action recorded.")}</p>
      </div>
    </div>
    <div class="validation-row-detail__grid">
      ${sourceUrlsHtml(row.sourceUrls || [])}
      ${listBlockHtml("Assumptions", row.assumptions || [])}
      ${listBlockHtml("Limitations", row.limitations || [])}
      ${listBlockHtml("Downstream consumers", row.downstreamConsumers || [])}
    </div>
  </div>`;
}

function coverageBadges(area) {
  const coverage = area.coverageSummary || {};
  const families = Object.entries(coverage).filter(([, covered]) => covered);
  if (!families.length) return `<span class="hint">No direct rows yet</span>`;
  return families
    .map(([family]) => `<span class="badge">${escapeHtml(familyLabel(family))}</span>`)
    .join(" ");
}

function modelAreaTableHtml(modelAreas = []) {
  if (!modelAreas.length) return "";
  const rows = modelAreas
    .map(
      (area) => `<tr>
        <td>${escapeHtml(area.label || area.id)}</td>
        <td>${escapeHtml(area.trustLevel || "bounded")}</td>
        <td>${escapeHtml((area.registryKeys || []).join(", ") || "n/a")}</td>
        <td>${coverageBadges(area)}</td>
      </tr>`,
    )
    .join("");
  return `<div class="validation-table-shell validation-table-shell--compact">
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
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function releaseGateTableHtml(rows = []) {
  if (!rows.length)
    return `<p class="hint">No release gate rows were recorded in this artifact.</p>`;
  const body = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.subject)}</td>
        <td>${escapeHtml(row.inputSummary)}</td>
        <td>${statusBadgeHtml(row)}</td>
        <td>${escapeHtml(row.output)}</td>
        <td>${escapeHtml(row.action)}</td>
      </tr>`,
    )
    .join("");
  return `<div class="validation-table-shell validation-table-shell--compact">
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
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

function verificationRowHtml(row, modelAreaLabel, index) {
  const rowId = `validation-row-${index}`;
  const detailId = `${rowId}-details`;
  return `<tr
    class="validation-calibration-row validation-verification-row"
    data-row-index="${index}"
    data-search="${escapeHtml(rowSearchText(row, modelAreaLabel))}"
    data-model-area="${escapeHtml(row.modelAreaId || "")}"
    data-family="${escapeHtml(row.family || "")}"
    data-status="${escapeHtml(row.status || "")}"
    data-severity="${escapeHtml(row.severity || "")}"
    data-source-class="${escapeHtml(row.sourceClass || "")}"
    data-confidence="${escapeHtml(row.confidence || "")}"
    data-user-visible="${row.userVisible ? "true" : "false"}"
  >
    <td>
      <button
        type="button"
        class="validation-row-toggle"
        data-validation-row-toggle="${index}"
        aria-expanded="false"
        aria-controls="${escapeHtml(detailId)}"
      >Details</button>
    </td>
    <td>${escapeHtml(modelAreaLabel || row.modelAreaId)}</td>
    <td>${escapeHtml(familyLabel(row.family))}</td>
    <td>${escapeHtml(row.subject)}</td>
    <td>${escapeHtml(row.metric)}</td>
    <td>${statusBadgeHtml(row)}</td>
    <td>${escapeHtml(row.severity)}</td>
    <td>${escapeHtml(row.sourceClass)}</td>
  </tr>
  <tr
    id="${escapeHtml(detailId)}"
    class="validation-verification-details-row"
    data-row-details="${index}"
    hidden
  >
    <td colspan="8">${rowDetailsHtml(row)}</td>
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
  `;
  root.querySelector("[data-validation-content]")?.replaceChildren(createValidationSkeleton());
}

function createValidationSkeleton() {
  return createSkeletonRegion({
    label: "Loading science verification matrix",
    className: "validation-report-skeleton",
    children: [
      createSkeletonKpiStrip({ count: 8 }),
      createElement("div", { className: "panel validation-matrix-panel" }, [
        createElement("div", { className: "panel__header", attrs: { "aria-hidden": "true" } }, [
          createSkeletonBlock({ className: "skeleton-line", width: "34%", height: 18 }),
          createSkeletonBlock({ className: "skeleton-page__button", width: 84, height: 28 }),
        ]),
        createElement("div", { className: "panel__body" }, [
          createElement(
            "div",
            { className: "validation-controls", attrs: { "aria-hidden": "true" } },
            [
              createSkeletonBlock({ className: "skeleton-page__search", width: "32%", height: 38 }),
              createSkeletonBlock({ className: "skeleton-page__button", width: 128, height: 38 }),
              createSkeletonBlock({ className: "skeleton-page__button", width: 116, height: 38 }),
              createSkeletonBlock({ className: "skeleton-page__button", width: 104, height: 38 }),
            ],
          ),
          createSkeletonTable({ columns: 8, rows: 8 }),
        ]),
      ]),
    ],
  });
}

function renderError(contentEl, error) {
  contentEl.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Report Unavailable</h2>
      </div>
      <div class="panel__body">
        <p>The prebuilt science verification matrix could not be loaded.</p>
        <p class="hint">${escapeHtml(error?.message || error)}</p>
        <p class="hint">Run <code>npm run science:verify</code> and rebuild the app to refresh the release artifact.</p>
      </div>
    </div>
  `;
}

function renderReport(root, rawReport) {
  const report = normalizeReport(rawReport);
  const contentEl = root.querySelector("[data-validation-content]");
  const counts = report.headlineCounts || {};
  const rows = Array.isArray(report.rows) ? report.rows : [];
  const labels = report.filters?.modelAreaLabels || {};
  const modelAreaIds = report.filters?.modelAreas?.length
    ? report.filters.modelAreas
    : uniqueSorted(rows.map((row) => row.modelAreaId));
  const families = report.filters?.families?.length
    ? report.filters.families
    : uniqueSorted(rows.map((row) => row.family));
  const statuses = report.filters?.statuses?.length
    ? report.filters.statuses
    : uniqueSorted(rows.map((row) => row.status));
  const severities = report.filters?.severities?.length
    ? report.filters.severities
    : uniqueSorted(rows.map((row) => row.severity));
  const sourceClasses = report.filters?.sourceClasses?.length
    ? report.filters.sourceClasses
    : uniqueSorted(rows.map((row) => row.sourceClass));

  const htmlLink = root.querySelector("[data-validation-html]");
  const markdownLink = root.querySelector("[data-validation-markdown]");
  if (htmlLink && report.artifactHtmlUrl) htmlLink.href = report.artifactHtmlUrl;
  if (markdownLink && report.artifactMarkdownUrl) markdownLink.href = report.artifactMarkdownUrl;

  contentEl.innerHTML = `
    <div class="validation-kpis" aria-label="Science verification headline counts">
      ${kpiHtml("Model areas", counts.modelAreas ?? report.modelAreas?.length ?? 0)}
      ${kpiHtml("Verification rows", counts.verificationRows ?? rows.length)}
      ${kpiHtml("Pass", counts.passedRows ?? rows.filter((row) => row.status === "PASS").length, "validation-kpi--ok")}
      ${kpiHtml("Warnings", counts.warningRows ?? rows.filter((row) => row.status === "WARN").length)}
      ${kpiHtml("Failures", counts.failedRows ?? rows.filter((row) => row.status === "FAIL").length, "validation-kpi--check")}
      ${kpiHtml("Modeling gaps", counts.gapRows ?? rows.filter((row) => row.status === "GAP").length, "validation-kpi--gap")}
      ${kpiHtml("Blocked", counts.blockedRows ?? rows.filter((row) => row.status === "BLOCKED").length)}
      ${kpiHtml("Release gates passed", counts.releaseGatesPassed ?? 0)}
    </div>

    <div class="panel validation-matrix-panel">
      <div class="panel__header">
        <h2 class="panel__title">Verification Matrix</h2>
        <div class="badge" data-validation-count aria-live="polite">${escapeHtml(rows.length)} rows</div>
      </div>
      <div class="panel__body">
        ${quickFilterChipsHtml()}
        <div class="validation-controls" aria-label="Science verification filters">
          <label class="validation-field validation-field--search">
            <span>Search</span>
            <input data-validation-search type="search" autocomplete="off" placeholder="model, metric, output, action..." />
          </label>
          <label class="validation-field">
            <span>Model area</span>
            <select data-validation-model-area>${optionsHtml(modelAreaIds, "All model areas", labels)}</select>
          </label>
          <label class="validation-field">
            <span>Family</span>
            <select data-validation-family>${optionsHtml(families, "All families", FAMILY_LABELS)}</select>
          </label>
          <label class="validation-field">
            <span>Status</span>
            <select data-validation-status>${optionsHtml(statuses, "All statuses", STATUS_LABELS)}</select>
          </label>
          <label class="validation-field">
            <span>Severity</span>
            <select data-validation-severity>${optionsHtml(severities, "All severities")}</select>
          </label>
          <label class="validation-field">
            <span>Source</span>
            <select data-validation-source-class>${optionsHtml(sourceClasses, "All sources")}</select>
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
            <tbody>${rows
              .map((row, index) =>
                verificationRowHtml(row, labels[row.modelAreaId] || row.modelAreaId, index),
              )
              .join("")}</tbody>
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
        <span>${escapeHtml(report.scope || "Science verification methodology and release evidence.")}</span>
      </summary>
      <div class="panel__body">
        <div class="validation-explainer__grid">
          <div>
            <p>${escapeHtml(report.interpretation || "")}</p>
            ${matrixTermDefinitionsHtml()}
          </div>
          <div>
            <h2>Release Gates</h2>
            ${releaseGateTableHtml(report.releaseGates || [])}
          </div>
        </div>
      </div>
    </details>

    <div class="panel">
      <div class="panel__header">
        <h2 class="panel__title">Model Area Coverage</h2>
      </div>
      <div class="panel__body">
        ${modelAreaTableHtml(report.modelAreas || [])}
      </div>
    </div>
  `;

  attachFilters(contentEl);
}

function attachFilters(contentEl) {
  const controls = {
    search: contentEl.querySelector("[data-validation-search]"),
    modelArea: contentEl.querySelector("[data-validation-model-area]"),
    family: contentEl.querySelector("[data-validation-family]"),
    status: contentEl.querySelector("[data-validation-status]"),
    severity: contentEl.querySelector("[data-validation-severity]"),
    sourceClass: contentEl.querySelector("[data-validation-source-class]"),
  };
  const countEl = contentEl.querySelector("[data-validation-count]");
  const quickFilterButtons = Array.from(
    contentEl.querySelectorAll("[data-validation-quick-filter]"),
  );
  const pagination = contentEl.querySelector("[data-validation-pagination]");
  const prevButton = contentEl.querySelector("[data-validation-page-prev]");
  const nextButton = contentEl.querySelector("[data-validation-page-next]");
  const pageStatus = contentEl.querySelector("[data-validation-page-status]");
  const rows = Array.from(contentEl.querySelectorAll(".validation-verification-row"));
  const detailRows = new Map(
    Array.from(contentEl.querySelectorAll("[data-row-details]")).map((row) => [
      row.dataset.rowDetails,
      row,
    ]),
  );
  let activeQuickFilter = "";
  let pageIndex = 0;

  const matchesQuickFilter = (row) => {
    const status = String(row.dataset.status || "").toUpperCase();
    const family = normalize(row.dataset.family);
    const sourceClass = normalize(row.dataset.sourceClass);
    if (!activeQuickFilter) return true;
    if (activeQuickFilter === "issues") {
      return ["FAIL", "WARN", "GAP", "BLOCKED", "CHECK"].includes(status);
    }
    if (activeQuickFilter === "failures") return status === "FAIL" || status === "CHECK";
    if (activeQuickFilter === "warnings") return status === "WARN";
    if (activeQuickFilter === "gaps") return status === "GAP";
    if (activeQuickFilter === "release-gates") return family === "release-gate";
    if (activeQuickFilter === "nasa-anchors") {
      return family === "anchor" && sourceClass.includes("nasa");
    }
    if (activeQuickFilter === "user-visible") return row.dataset.userVisible === "true";
    return true;
  };

  const matches = (row) => {
    const query = normalize(controls.search?.value);
    if (query && !normalize(row.dataset.search).includes(query)) return false;
    if (controls.modelArea?.value && row.dataset.modelArea !== controls.modelArea.value)
      return false;
    if (controls.family?.value && row.dataset.family !== controls.family.value) return false;
    if (controls.status?.value && row.dataset.status !== controls.status.value) return false;
    if (controls.severity?.value && row.dataset.severity !== controls.severity.value) return false;
    if (controls.sourceClass?.value && row.dataset.sourceClass !== controls.sourceClass.value)
      return false;
    if (!matchesQuickFilter(row)) return false;
    return true;
  };

  const collapseDetails = (row) => {
    const index = row.dataset.rowIndex;
    const detail = detailRows.get(index);
    const button = row.querySelector("[data-validation-row-toggle]");
    row.classList.remove("is-expanded");
    if (detail) detail.hidden = true;
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.textContent = "Details";
    }
  };

  const applyFilters = ({ resetPage = false } = {}) => {
    const matchedRows = rows.filter(matches);
    if (resetPage) pageIndex = 0;
    const shouldPaginate = matchedRows.length > 300;
    const pageCount = shouldPaginate
      ? Math.max(1, Math.ceil(matchedRows.length / VALIDATION_PAGE_SIZE))
      : 1;
    pageIndex = Math.min(pageIndex, pageCount - 1);
    const pageStart = shouldPaginate ? pageIndex * VALIDATION_PAGE_SIZE : 0;
    const pageEnd = shouldPaginate ? pageStart + VALIDATION_PAGE_SIZE : matchedRows.length;
    const visibleSet = new Set(matchedRows.slice(pageStart, pageEnd));

    for (const row of rows) {
      const show = visibleSet.has(row);
      row.hidden = !show;
      if (!show) collapseDetails(row);
    }

    if (countEl) {
      countEl.textContent = shouldPaginate
        ? `${matchedRows.length} of ${rows.length} rows, page ${pageIndex + 1} of ${pageCount}`
        : `${matchedRows.length} of ${rows.length} rows`;
    }
    if (pagination) pagination.hidden = !shouldPaginate;
    if (pageStatus) {
      pageStatus.textContent = shouldPaginate
        ? `Showing ${pageStart + 1}-${Math.min(pageEnd, matchedRows.length)} of ${matchedRows.length}`
        : "";
    }
    if (prevButton) prevButton.disabled = pageIndex <= 0;
    if (nextButton) nextButton.disabled = pageIndex >= pageCount - 1;
  };

  Object.values(controls).forEach((control) => {
    control?.addEventListener("input", () => applyFilters({ resetPage: true }));
  });

  quickFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeQuickFilter = button.dataset.validationQuickFilter || "";
      quickFilterButtons.forEach((other) => {
        const active = (other.dataset.validationQuickFilter || "") === activeQuickFilter;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-pressed", active ? "true" : "false");
      });
      applyFilters({ resetPage: true });
    });
  });

  prevButton?.addEventListener("click", () => {
    pageIndex = Math.max(0, pageIndex - 1);
    applyFilters();
  });
  nextButton?.addEventListener("click", () => {
    pageIndex += 1;
    applyFilters();
  });

  contentEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-validation-row-toggle]");
    if (!button) return;
    const row = button.closest(".validation-verification-row");
    const index = button.dataset.validationRowToggle;
    const detail = detailRows.get(index);
    if (!row || !detail) return;
    const expanded = button.getAttribute("aria-expanded") === "true";
    row.classList.toggle("is-expanded", !expanded);
    detail.hidden = expanded;
    button.setAttribute("aria-expanded", expanded ? "false" : "true");
    button.textContent = expanded ? "Details" : "Hide";
  });

  applyFilters();
}

async function loadValidationReport() {
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

  void loadValidationReport()
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
