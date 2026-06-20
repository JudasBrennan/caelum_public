const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const TASK_SECTION_IDS = new Set(["overview", "structure", "events", "preview", "export"]);

function normalizeTaskSection(section) {
  return TASK_SECTION_IDS.has(section) ? section : "overview";
}

export function buildCalendarTaskOverviewHtml() {
  const tasks = [
    {
      id: "structure",
      title: "Structure",
      body: "Set the reference body, phase cycle, basis, year, month, week, names, and eras.",
    },
    {
      id: "events",
      title: "Events",
      body: "Author holidays, festivals, intercalary periods, leap years, and work/rest cycles.",
    },
    {
      id: "preview",
      title: "Preview",
      body: "Inspect the current month, selected day, compact stats, and rule audit.",
    },
    {
      id: "export",
      title: "Export",
      body: "Copy profile JSON, import calendar settings, print views, or download ICS files.",
    },
  ];
  const taskCards = tasks
    .map(
      (task) => `
        <button type="button" class="calendar-task-card" data-calendar-task-jump="${esc(task.id)}">
          <span class="calendar-task-card__title">${esc(task.title)}</span>
          <span class="calendar-task-card__body">${esc(task.body)}</span>
        </button>`,
    )
    .join("");
  return `
    <div id="calTaskOverview" class="calendar-task-overview" aria-label="Calendar task choices">
      <div class="calendar-task-overview__copy">
        <h2>Choose A Calendar Task</h2>
        <p>Start with source context, then move into the task area that matches the work in front of you.</p>
      </div>
      <div class="calendar-task-overview__grid">${taskCards}</div>
    </div>`;
}

export function installCalendarPreviewSection(wrap) {
  const drawerBodyEl = wrap?.querySelector?.(".calendar-drawer__body");
  const monthPanelEl = wrap?.querySelector?.(".calendar-month-panel");
  if (!drawerBodyEl || !monthPanelEl) return;

  const previewSection = document.createElement("section");
  previewSection.className = "calendar-drawer__section calendar-preview-section";
  previewSection.dataset.drawerSection = "preview";
  previewSection.hidden = true;
  monthPanelEl.remove();
  previewSection.appendChild(monthPanelEl);
  drawerBodyEl.appendChild(previewSection);
}

export function applyCalendarTaskViewState({
  state,
  wrap,
  workspaceEl,
  drawerEl,
  drawerToggle,
} = {}) {
  const open = !!state.ui.drawerOpen;
  state.ui.drawerSection = normalizeTaskSection(state.ui.drawerSection);
  if (workspaceEl) workspaceEl.classList.toggle("drawer-open", open);
  if (drawerEl) drawerEl.classList.toggle("is-hidden", !open);
  drawerToggle?.classList.toggle("is-active", open);
  if (drawerToggle) drawerToggle.textContent = open ? "\u276E" : "\u276F";

  for (const tab of wrap.querySelectorAll("[data-drawer-tab]")) {
    const active = tab.dataset.drawerTab === state.ui.drawerSection;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  }
  for (const section of wrap.querySelectorAll("[data-drawer-section]")) {
    section.hidden = section.dataset.drawerSection !== state.ui.drawerSection;
  }
  for (const st of wrap.querySelectorAll("[data-rules-tab]")) {
    st.classList.toggle("is-active", st.dataset.rulesTab === state.ui.rulesTab);
  }
  for (const rs of wrap.querySelectorAll("[data-rules-section]")) {
    rs.hidden = rs.dataset.rulesSection !== state.ui.rulesTab;
  }

  const backdrop = wrap.querySelector("#calDrawerBackdrop");
  const narrow = typeof window !== "undefined" && window.innerWidth <= 1200;
  if (backdrop) backdrop.classList.toggle("is-visible", open && narrow);
}

export function bindCalendarTaskNavigation(wrap, { state, applyDrawerState, persistState } = {}) {
  wrap.querySelector(".calendar-drawer__tabs")?.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-drawer-tab]");
    if (!tab) return;
    state.ui.drawerSection = tab.dataset.drawerTab;
    applyDrawerState();
    persistState(state);
  });

  wrap.querySelector("#calTaskOverview")?.addEventListener("click", (e) => {
    const target = e.target.closest("[data-calendar-task-jump]");
    if (!target) return;
    state.ui.drawerOpen = true;
    state.ui.drawerSection = target.dataset.calendarTaskJump;
    applyDrawerState();
    persistState(state);
  });
}
