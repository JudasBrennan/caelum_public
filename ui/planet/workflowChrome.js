import { fmt } from "../../engine/utils.js";
import { createElement } from "../domHelpers.js";
import { getGuidedEntryModeTooltip } from "../guidedCreation/tooltips.js";
import { createContextCockpit } from "../workflow/contextCockpit.js";
import { createCreationModeStrip } from "../workflow/creationModeStrip.js";
import { createNextStepStrip } from "../workflow/nextStepStrip.js";
import { createObjectSelectorPanel } from "../workflow/objectSelectorPanel.js";
import { hasLimitedSurfaceApplicability } from "./bodyClassificationSummary.js";

export function buildPlanetCreationModeStrip({
  id,
  className = "",
  title,
  summaryId,
  summary,
  buttonPrefix,
  hidden = false,
}) {
  const node = createCreationModeStrip({
    id,
    className,
    title,
    summaryId,
    summary,
    selectedMode: "advanced",
    modes: [
      {
        id: "quick",
        elementId: `${buttonPrefix}QuickBtn`,
        attrs: { "data-tip": getGuidedEntryModeTooltip("quick") },
      },
      {
        id: "guided",
        elementId: `${buttonPrefix}GuidedBtn`,
        attrs: { "data-tip": getGuidedEntryModeTooltip("guided") },
      },
      {
        id: "recipes",
        elementId: `${buttonPrefix}RecipesBtn`,
        attrs: { "data-tip": getGuidedEntryModeTooltip("recipes") },
      },
      {
        id: "advanced",
        currentMarker: true,
        attrs: { "data-tip": getGuidedEntryModeTooltip("advanced") },
      },
    ],
  });
  node.hidden = hidden;
  return node;
}

export function buildPlanetCockpitMarkup() {
  const cockpit = createContextCockpit({
    id: "planetCockpit",
    className: "planet-cockpit",
    ariaLabel: "Planet authoring cockpit",
    eyebrow: "Planet setup",
    summaryId: "planetCockpitSummary",
    summary: "Select a body, confirm host and slot, then tune the inputs.",
    statusItems: [
      {
        label: "Current Body",
        value: "No body selected",
        meta: "Create or select a body",
        valueId: "planetCockpitBodyValue",
        metaId: "planetCockpitBodyMeta",
      },
      {
        label: "Body Type",
        value: "Rocky world",
        meta: "Authoring branch",
        valueId: "planetCockpitTypeValue",
        metaId: "planetCockpitTypeMeta",
      },
      {
        label: "Host / Slot",
        value: "Primary host",
        meta: "Orbit context",
        valueId: "planetCockpitHostValue",
        metaId: "planetCockpitHostMeta",
      },
      {
        label: "Classification",
        value: "Pending",
        meta: "Solver summary",
        valueId: "planetCockpitClassValue",
        metaId: "planetCockpitClassMeta",
      },
    ],
    source: {
      label: "Source",
      value: "Authored inputs + solver",
      meta: "Confidence updates with the selected body.",
      valueId: "planetCockpitSourceValue",
      metaId: "planetCockpitSourceMeta",
    },
    details: {
      id: "planetContextDisclosure",
      title: "Derived Data",
      summaryId: "planetContextDisclosureSummary",
      summary: "Host-frame and solver context.",
      content: [
        createElement("div", {
          className: "derived-readout",
          attrs: { id: "starInfo" },
        }),
      ],
    },
    footer: createNextStepStrip({
      id: "planetNextStepStrip",
      recommendationId: "planetNextStepRecommendation",
      recommendation: "Next: moons, climate, or visuals.",
      actions: [
        { label: "Planetary System", href: "#/system", primary: true },
        { label: "Moons", href: "#/moon" },
        { label: "Climate", href: "#/climate" },
      ],
    }),
  });
  return cockpit.outerHTML;
}

export function buildPlanetSelectorMarkup() {
  const selector = createObjectSelectorPanel({
    id: "planetObjectSelector",
    className: "planet-object-selector",
    title: "Body Selection",
    summary: "Search, switch, or create a planet-like body in the current system.",
    selected: {
      label: "Selected",
      value: "No body selected",
      meta: "Choose an entry to edit its inputs.",
      valueId: "planetSelectedBodyValue",
      metaId: "planetSelectedBodyMeta",
    },
    search: {
      id: "bodySearch",
      placeholder: "Search bodies",
      ariaLabel: "Search bodies",
    },
    select: {
      id: "bodySelect",
      ariaLabel: "Current body",
    },
    typeSelect: {
      id: "newBodyIntent",
      ariaLabel: "New body starting intent",
      options: [
        { value: "rocky", label: "Rocky world", selected: true },
        { value: "volatile", label: "Volatile / mini-Neptune" },
        { value: "iceGiant", label: "Ice giant" },
        { value: "gasGiant", label: "Gas giant" },
        { value: "substellar", label: "Substellar companion" },
      ],
    },
    actions: [
      { id: "newBody", label: "New body" },
      { id: "newRockyPlanet", label: "Rocky quick start" },
      { id: "newGasGiant", label: "Gas giant quick start" },
      { id: "deleteBody", label: "Delete", danger: true },
    ],
  });
  return selector.outerHTML;
}

export function buildPlanetDependencyNoticesMarkup() {
  const node = createElement("details", {
    className: "planet-input-source-disclosure",
    attrs: {
      id: "planetOrbitDependencyNotice",
      "data-workflow-component": "dependency-notice",
    },
  });
  node.appendChild(
    createElement("summary", {}, [
      createElement("span", {
        className: "planet-input-source-disclosure__title",
        text: "How inputs connect",
      }),
      createElement("span", {
        className: "planet-input-source-disclosure__summary",
        text: "Orbit slots, visual edits, and ocean coverage keep separate sources.",
      }),
    ]),
  );
  node.appendChild(
    createElement("div", { className: "planet-input-source-disclosure__body" }, [
      createElement("div", { className: "planet-input-source-disclosure__item" }, [
        createElement("span", {
          className: "planet-input-source-disclosure__chip",
          text: "Linked from System",
        }),
        createElement("span", {
          text: "Guided orbit mode can use Planetary System slots. Manual AU edits stay on this body.",
        }),
      ]),
      createElement("div", { className: "planet-input-source-disclosure__item" }, [
        createElement("span", {
          className: "planet-input-source-disclosure__chip",
          text: "Appearance only",
        }),
        createElement("span", {
          text: "Visual edits change how the planet looks, not its mass, atmosphere, climate, or science values.",
        }),
      ]),
      createElement("div", { className: "planet-input-source-disclosure__item" }, [
        createElement("span", {
          className: "planet-input-source-disclosure__chip",
          text: "Manual override",
        }),
        createElement("span", {
          text: "Ocean coverage can be authored separately from inferred water and hypsometry outputs.",
        }),
      ]),
    ]),
  );
  return node.outerHTML;
}

function setText(node, value) {
  if (node) node.textContent = value == null ? "" : String(value);
}

function selectedBodyName(rawBody, unifiedBody, bodyType) {
  return (
    unifiedBody?.name ||
    rawBody?.name ||
    rawBody?.inputs?.name ||
    rawBody?.id ||
    (bodyType === "gasGiant" ? "Gas giant" : "Planet")
  );
}

function formatBodySlotMeta(rawBody, bodyType) {
  const slot = Number(rawBody?.slotIndex);
  const orbitAu =
    bodyType === "gasGiant"
      ? Number(rawBody?.au)
      : Number(rawBody?.inputs?.semiMajorAxisAu ?? rawBody?.semiMajorAxisAu);
  const orbitText = Number.isFinite(orbitAu) && orbitAu > 0 ? `${fmt(orbitAu, 3)} AU` : "";
  if (Number.isFinite(slot) && slot > 0) {
    return orbitText ? `Slot ${slot} - ${orbitText}` : `Slot ${slot}`;
  }
  return orbitText ? `Custom orbit - ${orbitText}` : "No slot assigned";
}

export function renderPlanetWorkflowChrome({
  elements,
  bodyType,
  rawBody,
  unifiedBody,
  solveContext,
  classificationSummary,
}) {
  const hasSelection = !!rawBody || !!unifiedBody;
  const name = hasSelection ? selectedBodyName(rawBody, unifiedBody, bodyType) : "No body selected";
  const typeValue =
    bodyType === "gasGiant"
      ? classificationSummary?.label || "Gas giant"
      : classificationSummary?.label || "Rocky world";
  const typeMeta =
    classificationSummary?.authoringIntentLabel ||
    unifiedBody?.authoringIntent ||
    rawBody?.authoringIntent ||
    rawBody?.inputs?.authoringIntent ||
    (bodyType === "gasGiant" ? "Giant branch" : "Rocky branch");
  const hostFrame = solveContext?.hostFrame;
  const hostValue = hostFrame?.label || "Primary host";
  const slotMeta = hasSelection
    ? formatBodySlotMeta(rawBody || unifiedBody, bodyType)
    : "No body selected";
  const classValue = classificationSummary?.label || (hasSelection ? "Pending" : "No body");
  const classMeta = classificationSummary
    ? `${classificationSummary.confidence || "unknown"} confidence - ${classificationSummary.surfaceApplicabilityLabel || "surface applicability pending"}`
    : "Select or create a body to classify.";
  const selectorMeta = hasSelection
    ? `${typeValue} in ${hostValue}; ${slotMeta}.`
    : "Choose an entry to edit its inputs.";

  setText(elements?.bodyValue, name);
  setText(elements?.bodyMeta, selectorMeta);
  setText(elements?.typeValue, typeValue);
  setText(elements?.typeMeta, typeMeta);
  setText(elements?.hostValue, hostValue);
  setText(elements?.hostMeta, slotMeta);
  setText(elements?.classValue, classValue);
  setText(elements?.classMeta, classMeta);
  setText(
    elements?.sourceMeta,
    classificationSummary
      ? `Classification source: authored inputs + solver (${classificationSummary.confidence || "unknown"} confidence).`
      : "Classification source appears after a body is selected.",
  );
  setText(elements?.selectedBodyValue, name);
  setText(elements?.selectedBodyMeta, selectorMeta);

  if (!elements?.nextStepRecommendation) return;
  if (!hasSelection) {
    elements.nextStepRecommendation.textContent =
      "Create or select a body, then assign its host frame and slot.";
  } else if (bodyType === "gasGiant") {
    elements.nextStepRecommendation.textContent =
      "Giant context is ready. Review moons, visuals, or system placement.";
  } else if (hasLimitedSurfaceApplicability(classificationSummary)) {
    elements.nextStepRecommendation.textContent =
      "Surface applicability is limited; review classification before using climate or habitability pages.";
  } else {
    elements.nextStepRecommendation.textContent =
      "Rocky context is ready. Continue with moons, climate, or visuals.";
  }
}
