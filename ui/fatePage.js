import { createPageShell } from "./workflow/pageShell.js";
import { createElement } from "./domHelpers.js";
import { loadWorld } from "./store.js";
import { buildSystemFatePageModel } from "./systemFate/systemFateTimelineModel.js";
import { createSystemFateTimelinePanel } from "./systemFateTimelinePanel.js";
import { attachTooltips } from "./tooltip.js";
import { structuredTip } from "./tooltipCopy.js";
import { createTutorial } from "./tutorial.js";

const FATE_TUTORIAL_TIP = structuredTip({
  overview: "Opens the guided System Fate walkthrough.",
  drawnFrom: "The tutorial text for this page; it does not change the saved system.",
  interpretAs: "Use it when the timeline, rankings, or risk chips need context.",
  caveat: "Tooltips explain individual controls; the tutorial explains the whole workflow.",
});

export const FATE_TUTORIAL_STEPS = [
  {
    title: "What System Fate Shows",
    body: "System Fate is a whole-system reading of long-term stellar exposure. It compares each saved body against the host star's lifecycle, moving habitable-zone windows, remnant endpoint, and major risk markers.",
  },
  {
    title: "Promising Worlds",
    body: "Promising Worlds are bodies the model thinks are worth inspecting for current or future habitability signals. They are not confirmed habitable worlds, not evidence of life, and not a full climate forecast.",
  },
  {
    title: "Start With the Summary",
    body: "The top card gives the quick read: how many Promising Worlds, future windows, and major risks the current host frame contains. Use the confidence chip as a reminder that this is an analytic shortlist, not a final verdict.",
  },
  {
    title: "Host Frames Matter",
    body: "In binary and higher-order systems, the Host frame control changes which star or pair the page evaluates. A world can look safe around one host frame and risky around another because luminosity, lifecycle timing, and orbital context change.",
  },
  {
    title: "Read the Timeline",
    body: "The Timeline view stacks each body as a lane. Coloured segments show conservative or optimistic habitable-zone exposure; markers show events such as overheating, giant-branch danger, engulfment, remnant caveats, or supernova transition risk.",
  },
  {
    title: "Use Lifecycle View",
    body: "Lifecycle view is the birth-to-endpoint read. It lists each object's origin, current lifecycle era, next broad transition, endpoint, confidence, and major model limits, while Timeline stays focused on habitable-zone exposure across stellar age.",
  },
  {
    title: "Use Age Preview",
    body: "The Age preview slider asks what the system looks like at a selected stellar age. It helps you spot worlds that are cold now but may thaw later, or worlds that are currently interesting but become unsafe as the host brightens.",
  },
  {
    title: "Rankings and Drilldown",
    body: "Rankings group the same lanes by current promise, future windows, long stable windows, moon promise, high risks, and bodies that cannot be evaluated. Click a listed world or timeline lane to open its drilldown notes.",
  },
  {
    title: "Interpreting Risks",
    body: "Risks are long-term exposure warnings, not detailed event simulations. The page can flag things like envelope drag, runaway irradiation, remnant uncertainty, or supernova transition, but it does not model explosion energy, nucleosynthesis, fallback, or light curves.",
  },
  {
    title: "Reports and Next Steps",
    body: "Use Report to copy a short Discord-friendly summary or a fuller markdown note. When something looks interesting, open the Star, Planet, Moon, or Visualizer pages to inspect the underlying inputs and detailed science outputs.",
  },
];

function safeText(value, fallback = "") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function reportText(timeline, mode) {
  if (mode === "compact") return timeline?.report?.compact || timeline?.headline || "";
  return timeline?.report?.markdown || (timeline?.report?.lines || []).join("\n");
}

async function copyText(text) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable in this browser.");
  }
  await navigator.clipboard.writeText(text);
}

export function initFatePage(root) {
  const world = loadWorld();
  let tutorial = null;
  const state = {
    view: "overview",
    hostFrameId: "",
    selectedAgeGyr: null,
    filter: "all",
    sort: "orbit",
    selectedLaneId: "",
    copyStatus: "",
  };

  function buildModel() {
    return buildSystemFatePageModel(world, {
      hostFrameId: state.hostFrameId || null,
      selectedAgeGyr: state.selectedAgeGyr,
    });
  }

  function render() {
    tutorial?.destroy();
    tutorial = null;
    const pageModel = buildModel();
    const timeline = pageModel.selectedTimeline;
    if (!state.hostFrameId) state.hostFrameId = pageModel.selectedHostFrameId;
    if (!state.selectedLaneId) {
      state.selectedLaneId =
        timeline.spotlight?.bestCurrentCandidateLaneId || timeline.lanes?.[0]?.id || "";
    }
    const shell = createPageShell({
      iconClass: "icon--fate",
      title: "System Fate",
      task: "Compare Promising Worlds, future windows, and long-term stellar risks across the saved system.",
      primaryAction: {
        label: "Star Page",
        href: "#/star",
        className: "workflow-page-shell__action small",
      },
      helpAction: {
        label: "Tutorials",
        className: "workflow-page-shell__action ws-tutorial-trigger",
        attrs: {
          id: "fateTutorials",
          "data-tip": FATE_TUTORIAL_TIP,
        },
      },
      children: [
        createSystemFateTimelinePanel(timeline, {
          pageModel,
          state: {
            view: state.view,
            filter: state.filter,
            sort: state.sort,
            selectedLaneId: state.selectedLaneId,
            copyStatus: state.copyStatus,
          },
        }),
      ],
    });
    root.replaceChildren(shell);
    attachTooltips(root);
    tutorial = createTutorial({
      steps: FATE_TUTORIAL_STEPS,
      storageKey: "worldsmith.fate.tutorial",
      container: root,
      triggerBtn: root.querySelector("#fateTutorials"),
    });
  }

  function updateFromControl(target) {
    const control = target?.dataset?.fateControl;
    if (!control) return false;
    if (control === "hostFrame") {
      state.hostFrameId = safeText(target.value);
      state.selectedLaneId = "";
    } else if (control === "filter") {
      state.filter = safeText(target.value, "all");
    } else if (control === "sort") {
      state.sort = safeText(target.value, "orbit");
    } else if (control === "selectedAge") {
      const nextAge = finiteOrNull(target.value);
      state.selectedAgeGyr = nextAge == null ? state.selectedAgeGyr : nextAge;
    }
    state.copyStatus = "";
    render();
    return true;
  }

  async function handleCopy(mode) {
    const pageModel = buildModel();
    const text = reportText(pageModel.selectedTimeline, mode);
    if (!text) {
      state.copyStatus = "No report text is available to copy.";
      render();
      return;
    }
    try {
      await copyText(text);
      state.copyStatus = "Copied System Fate report.";
    } catch (error) {
      state.copyStatus = error?.message || "Clipboard copy failed.";
    }
    render();
  }

  function onClick(event) {
    const viewButton = event.target.closest("[data-fate-view]");
    if (viewButton) {
      state.view = safeText(viewButton.dataset.fateView, "overview");
      state.copyStatus = "";
      render();
      return;
    }
    const laneButton = event.target.closest("[data-fate-lane]");
    if (laneButton) {
      state.selectedLaneId = safeText(laneButton.dataset.fateLane);
      state.view = state.view === "overview" ? "timeline" : state.view;
      state.copyStatus = "";
      render();
      return;
    }
    const copyButton = event.target.closest("[data-fate-copy]");
    if (copyButton) {
      void handleCopy(copyButton.dataset.fateCopy);
    }
  }

  function onInput(event) {
    updateFromControl(event.target);
  }

  function onChange(event) {
    updateFromControl(event.target);
  }

  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onChange);
  render();

  return () => {
    tutorial?.destroy();
    tutorial = null;
    root.removeEventListener("click", onClick);
    root.removeEventListener("input", onInput);
    root.removeEventListener("change", onChange);
  };
}

export function createFatePageForTests(timeline, pageModel, state = {}) {
  return createElement("div", {}, [
    createSystemFateTimelinePanel(timeline, {
      pageModel,
      state,
    }),
  ]);
}
