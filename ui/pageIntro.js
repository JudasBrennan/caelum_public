import { escapeHtml } from "./uiHelpers.js";

function renderIntroItem(key, label, value) {
  return `
    <div class="page-intro__item" data-page-intro-key="${escapeHtml(key)}">
      <dt class="page-intro__label">${escapeHtml(label)}</dt>
      <dd class="page-intro__value">${escapeHtml(value)}</dd>
    </div>
  `;
}

export function buildPageIntroHtml({
  summary = "",
  controls = "",
  affects = "",
  primaryAction = "",
  compact = false,
  detailsTitle = "Details",
  detailsSummary = "",
} = {}) {
  const gridHtml = `
    <dl class="page-intro__grid">
      ${renderIntroItem("controls", "Controls", controls)}
      ${renderIntroItem("affects", "Affects", affects)}
      ${renderIntroItem("start", "Start with", primaryAction)}
    </dl>
  `;
  if (compact) {
    return `
      <div class="page-intro page-intro--compact" data-page-intro="true">
        <p class="page-intro__summary">${escapeHtml(summary)}</p>
        <details class="page-intro__details">
          <summary>
            <span>${escapeHtml(detailsTitle)}</span>
            <span>${escapeHtml(detailsSummary)}</span>
          </summary>
          ${gridHtml}
        </details>
      </div>
    `;
  }

  return `
    <div class="page-intro" data-page-intro="true">
      <p class="page-intro__summary">${escapeHtml(summary)}</p>
      ${gridHtml}
    </div>
  `;
}
