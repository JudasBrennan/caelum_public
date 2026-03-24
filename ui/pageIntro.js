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
} = {}) {
  return `
    <div class="page-intro" data-page-intro="true">
      <p class="page-intro__summary">${escapeHtml(summary)}</p>
      <dl class="page-intro__grid">
        ${renderIntroItem("controls", "Controls", controls)}
        ${renderIntroItem("affects", "Affects", affects)}
        ${renderIntroItem("start", "Start with", primaryAction)}
      </dl>
    </div>
  `;
}
