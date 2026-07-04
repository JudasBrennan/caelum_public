import { buildStellarNeighbourhoodHazardModelForWorld } from "../engine/stellarNeighbourhoodHazards.js";
import { createPageShell } from "./workflow/pageShell.js";
import { loadWorld } from "./store.js";
import { attachTooltips } from "./tooltip.js";
import { structuredTip } from "./tooltipCopy.js";
import { createTutorial } from "./tutorial.js";
import { createNeighbourhoodHazardsPanel } from "./neighbourhoodHazardsPanel.js";

const HAZARD_TUTORIAL_TIP = structuredTip({
  overview: "Opens the guided Stellar Neighbourhood Hazards walkthrough.",
  drawnFrom: "The tutorial text for this page; it does not change the saved system.",
  interpretAs: "Use it when the hazard cards, intervals, or affected-world groups need context.",
  caveat: "Tooltips explain individual terms; the tutorial explains the whole workflow.",
});

export const NEIGHBOURHOOD_HAZARDS_TUTORIAL_STEPS = [
  {
    title: "What This Page Shows",
    body: "Stellar Neighbourhood Hazards is the external deep-time companion to System Fate. It estimates broad risks from nearby supernovae, stellar flybys, comet showers, dense clusters, and outer-reservoir disturbance.",
  },
  {
    title: "Local Cluster Connection",
    body: "Local Cluster supplies the neighbourhood density, generated systems, and galactic position. This page turns those inputs into consequences for the saved system.",
  },
  {
    title: "Intervals Are Not Dates",
    body: "Expected intervals are broad rate screens. They are useful for worldbuilding timescales, but they are not scheduled events or deterministic predictions.",
  },
  {
    title: "Affected Worlds",
    body: "Affected Worlds groups saved bodies by consequence: atmosphere and surface exposure, impact context, outer reservoirs, or mostly indirect effects.",
  },
  {
    title: "Model Limits",
    body: "The model does not simulate exact flyby histories, supernova blast physics, impactor size populations, climate outcomes, or biology. Confidence and caveats show where the read is broadest.",
  },
];

function safeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function reportText(model, mode) {
  if (mode === "compact") return model?.report?.compact || model?.headline || "";
  return model?.report?.markdown || (model?.report?.lines || []).join("\n");
}

async function copyText(text) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable in this browser.");
  }
  await navigator.clipboard.writeText(text);
}

export function initNeighbourhoodHazardsPage(root) {
  const world = loadWorld();
  let tutorial = null;
  const state = {
    view: "overview",
    affectedGroup: "",
    copyStatus: "",
  };

  function buildModel() {
    return buildStellarNeighbourhoodHazardModelForWorld(world);
  }

  function render() {
    tutorial?.destroy();
    tutorial = null;
    const model = buildModel();
    const shell = createPageShell({
      iconClass: "icon--neighbourhood-hazards",
      title: "Stellar Neighbourhood Hazards",
      task: "Estimate external long-term risks from nearby stars, supernovae, flybys, dense clusters, and Oort-cloud disturbance.",
      primaryAction: {
        label: "Local Cluster",
        href: "#/cluster",
        className: "workflow-page-shell__action small",
      },
      helpAction: {
        label: "Tutorials",
        className: "workflow-page-shell__action ws-tutorial-trigger",
        attrs: {
          id: "neighbourhoodHazardsTutorials",
          "data-tip": HAZARD_TUTORIAL_TIP,
        },
      },
      children: [createNeighbourhoodHazardsPanel(model, state)],
    });
    root.replaceChildren(shell);
    attachTooltips(root);
    tutorial = createTutorial({
      steps: NEIGHBOURHOOD_HAZARDS_TUTORIAL_STEPS,
      storageKey: "worldsmith.neighbourhoodHazards.tutorial",
      container: root,
      triggerBtn: root.querySelector("#neighbourhoodHazardsTutorials"),
    });
  }

  async function handleCopy(mode) {
    const model = buildModel();
    const text = reportText(model, mode);
    if (!text) {
      state.copyStatus = "No hazard report text is available to copy.";
      render();
      return;
    }
    try {
      await copyText(text);
      state.copyStatus = "Copied neighbourhood hazard report.";
    } catch (error) {
      state.copyStatus = error?.message || "Clipboard copy failed.";
    }
    render();
  }

  function onClick(event) {
    const viewButton = event.target.closest("[data-hazard-view]");
    if (viewButton) {
      state.view = safeText(viewButton.dataset.hazardView, "overview");
      state.copyStatus = "";
      render();
      return;
    }
    const groupButton = event.target.closest("[data-hazard-group]");
    if (groupButton && !groupButton.disabled) {
      state.affectedGroup = safeText(groupButton.dataset.hazardGroup, "atmospheres");
      state.copyStatus = "";
      render();
      return;
    }
    const copyButton = event.target.closest("[data-hazard-copy]");
    if (copyButton) {
      void handleCopy(copyButton.dataset.hazardCopy);
    }
  }

  root.addEventListener("click", onClick);
  render();

  return function cleanup() {
    tutorial?.destroy();
    tutorial = null;
    root.removeEventListener("click", onClick);
  };
}
