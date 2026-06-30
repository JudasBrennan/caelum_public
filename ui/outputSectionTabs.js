import { createElement } from "./domHelpers.js";

const PANEL_SELECTOR_CLASSES = ["kpi-section", "derived-details"];
const ALL_SECTIONS_TAB_ID = "__all";

function directSectionPanels(container) {
  return Array.from(container?.children || []).filter((node) =>
    PANEL_SELECTOR_CLASSES.some((className) => node.classList?.contains(className)),
  );
}

function sectionTitle(node, fallback) {
  const title =
    node.querySelector?.(".kpi-section__title") || node.querySelector?.(".derived-details__title");
  if (!title) return fallback;
  const clone = title.cloneNode(true);
  clone.querySelectorAll?.(".tip-icon").forEach((tip) => tip.remove());
  return clone.textContent?.trim() || fallback;
}

function tabButtonId(container, panelId) {
  return `${container.id || "output"}-${panelId}-tab`;
}

function ensurePanelId(container, panel, index) {
  if (panel.id) return panel.id;
  panel.id = `${container.id || "output"}-section-${index + 1}`;
  return panel.id;
}

function expandSectionPanel(panel) {
  if (panel?.tagName === "DETAILS") {
    panel.open = true;
  }
}

function setActiveOutputSection(container, panelId) {
  const panels = directSectionPanels(container);
  const ids = new Set(panels.map((panel) => panel.id));
  const allEnabled = container.dataset.outputSectionAllTab === "1";
  const activeId =
    allEnabled && panelId === ALL_SECTIONS_TAB_ID
      ? ALL_SECTIONS_TAB_ID
      : ids.has(panelId)
        ? panelId
        : panels[0]?.id || "";
  if (!activeId) return;

  container.dataset.outputSectionActiveId = activeId;
  container.querySelectorAll("[data-output-section-tab]").forEach((tab) => {
    const selected = tab.dataset.outputSectionTab === activeId;
    tab.setAttribute("aria-selected", selected ? "true" : "false");
    tab.setAttribute("tabindex", selected ? "0" : "-1");
    tab.classList.toggle("is-active", selected);
  });

  for (const panel of panels) {
    const active = activeId === ALL_SECTIONS_TAB_ID || panel.id === activeId;
    panel.hidden = !active;
    panel.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) expandSectionPanel(panel);
  }
}

function bindOutputSectionTabs(container) {
  if (!container || container.dataset.outputSectionTabsBound === "1") return;
  container.dataset.outputSectionTabsBound = "1";

  container.addEventListener("click", (event) => {
    const tab = event.target.closest?.("[data-output-section-tab]");
    if (!tab || !container.contains(tab)) return;
    setActiveOutputSection(container, tab.dataset.outputSectionTab);
  });

  container.addEventListener("keydown", (event) => {
    const tab = event.target.closest?.("[data-output-section-tab]");
    if (!tab || !container.contains(tab)) return;
    const tabs = Array.from(container.querySelectorAll("[data-output-section-tab]"));
    const currentIndex = tabs.indexOf(tab);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    nextTab.focus();
    setActiveOutputSection(container, nextTab.dataset.outputSectionTab);
  });
}

export function enableOutputSectionTabs(container, options = {}) {
  if (!container) return container;
  container.querySelector(":scope > .output-section-tabs")?.remove();
  container.dataset.outputSectionAllTab = options.includeAll ? "1" : "0";
  const panels = directSectionPanels(container);
  if (panels.length <= 1) {
    for (const panel of panels) {
      panel.hidden = false;
      panel.removeAttribute("aria-hidden");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-labelledby");
      expandSectionPanel(panel);
    }
    return container;
  }

  const activeCandidate = container.dataset.outputSectionActiveId || panels[0]?.id || "";
  const tabs = panels.map((panel, index) => {
    const panelId = ensurePanelId(container, panel, index);
    const buttonId = tabButtonId(container, panelId);
    panel.classList.add("output-section-tabs__panel");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", buttonId);
    return createElement("button", {
      className: "output-section-tabs__button",
      attrs: {
        id: buttonId,
        type: "button",
        role: "tab",
        "aria-controls": panelId,
      },
      dataset: { outputSectionTab: panelId },
      text: sectionTitle(panel, `Section ${index + 1}`),
    });
  });
  if (options.includeAll) {
    tabs.unshift(
      createElement("button", {
        className: "output-section-tabs__button",
        attrs: {
          id: tabButtonId(container, ALL_SECTIONS_TAB_ID),
          type: "button",
          role: "tab",
        },
        dataset: { outputSectionTab: ALL_SECTIONS_TAB_ID },
        text: options.allLabel || "All",
      }),
    );
  }

  const tablist = createElement(
    "div",
    {
      className: "output-section-tabs",
      attrs: { role: "tablist", "aria-label": options.label || "Output sections" },
    },
    tabs,
  );
  container.insertBefore(tablist, panels[0]);
  bindOutputSectionTabs(container);
  setActiveOutputSection(container, activeCandidate);
  return container;
}
