import { fmt } from "../../engine/utils.js";
import { createElement, replaceChildren } from "../domHelpers.js";
import { styleLabel } from "../gasGiantStyles.js";

function createTipNode(text) {
  if (!text) return null;
  return createElement("span", {
    className: "tip-icon",
    attrs: { tabindex: "0", role: "note", "aria-label": "Info" },
    dataset: { tip: text },
    text: "i",
  });
}

function createHint(text) {
  return createElement("div", { className: "hint", text });
}

function createKpiCard(item, tipLabels = {}) {
  const tipText = tipLabels[item.tipLabel] || tipLabels[item.label] || "";
  return createElement("div", { className: "kpi-wrap" }, [
    createElement("div", { className: "kpi" }, [
      createElement("div", { className: "kpi__label" }, [item.label, " ", createTipNode(tipText)]),
      createElement("div", { className: "kpi__value", text: item.value ?? "" }),
      createElement("div", { className: "kpi__meta", text: item.meta ?? "" }),
    ]),
  ]);
}

export function renderSystemKpis(container, items = [], tipLabels = {}) {
  return replaceChildren(
    container,
    (items || []).map((item) => createKpiCard(item, tipLabels)),
  );
}

export function createMoonCard(moon, { showParent = false, planetsById = null } = {}) {
  const moonName = moon.name || moon.inputs?.name || moon.id;
  const orbitKm = Number(moon?.inputs?.semiMajorAxisKm);
  const orbitText =
    Number.isFinite(orbitKm) && orbitKm > 0 ? `${fmt(orbitKm, 0)} km` : "Orbit unknown";
  const parent = moon.planetId ? planetsById?.[moon.planetId] : null;
  const parentText = parent
    ? `Parent: ${parent.name || parent.inputs?.name || parent.id}`
    : "Unassigned";
  const locked = !!moon.locked;
  const metaParts = [orbitText];
  if (showParent) metaParts.push(parentText);
  if (locked) metaParts.push("Parent locked");
  const metaText = metaParts.join(" - ");
  const canLock = moon.planetId != null;

  return createElement(
    "div",
    {
      className: `moon-mini moon-card${locked ? " is-locked" : ""}`,
      attrs: {
        draggable: locked ? "false" : "true",
        title: locked ? "Unlock parent to move" : "Drag to reassign parent",
      },
      dataset: { moonId: moon.id },
    },
    [
      createElement("div", {}, [
        createElement("div", { className: "moon-mini__name", text: moonName }),
        createElement("div", { className: "planet-card__meta", text: metaText }),
      ]),
      createElement("div", { className: "moon-mini__actions" }, [
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "lock-moon",
            "data-moon-id": moon.id,
            disabled: canLock ? null : "disabled",
          },
          text: locked ? "Unlock parent" : "Lock parent",
        }),
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "edit-moon",
            "data-moon-id": moon.id,
          },
          text: "Edit",
        }),
      ]),
    ],
  );
}

export function createPlanetCard(
  planet,
  sysModel,
  { showAu = true, moonCountByPlanet = null, allowPlanetDrag = true, placementText = null } = {},
) {
  let meta = "";
  if (showAu && planet.slotIndex != null) {
    const au = sysModel.orbitsAu[planet.slotIndex - 1];
    if (au != null) meta = `${fmt(au, 3)} AU`;
  }
  const moonCount = Number(moonCountByPlanet?.get(planet.id) || 0);
  const slotText =
    placementText ||
    (planet.slotIndex != null ? `Slot ${String(planet.slotIndex).padStart(2, "0")}` : "Unassigned");
  const metaTextBase = meta ? `${slotText} - ${meta}` : slotText;
  const classText = String(planet.classificationLabel || "").trim();
  const metaText = `${classText ? `${classText} - ` : ""}${metaTextBase} - Moons: ${moonCount}`;
  const name = planet.name || planet.inputs?.name || planet.id;
  const draggable = allowPlanetDrag && !planet.locked;

  return createElement(
    "div",
    {
      className: `planet-card${planet.locked ? " is-locked" : ""}${
        !allowPlanetDrag ? " is-drag-disabled" : ""
      } moon-drop-target`,
      attrs: {
        draggable: draggable ? "true" : "false",
        title: planet.locked
          ? "Locked"
          : allowPlanetDrag
            ? "Drag to assign"
            : "Manual orbit mode disables planet slot dragging",
        style: "",
      },
      dataset: {
        planetId: planet.id,
        moonDropPlanetId: planet.id,
      },
    },
    [
      createElement("div", {}, [
        createElement("div", {}, [createElement("b", { text: name })]),
        createElement("div", { className: "planet-card__meta", text: metaText }),
      ]),
      createElement("div", { attrs: { style: "display:flex; gap:8px; align-items:center" } }, [
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "lock",
            "data-planet-id": planet.id,
          },
          text: planet.locked ? "Unlock" : "Lock",
        }),
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "guided-moon",
            "data-parent-id": planet.id,
            "data-parent-type": "planet",
          },
          text: "Guided moon",
        }),
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "edit",
            "data-planet-id": planet.id,
          },
          text: "Edit",
        }),
      ]),
    ],
  );
}

function createMoonDropZone(planetId, moons, planetsById) {
  const children = [
    createElement("div", { className: "moon-list__title", text: "Moons" }),
    ...(moons.length
      ? moons.map((moon) => createMoonCard(moon, { planetsById }))
      : [createHint("Drop moons here")]),
  ];
  return createElement(
    "div",
    {
      className: "moon-list moon-drop-target",
      dataset: { moonDropPlanetId: planetId },
    },
    children,
  );
}

function createSlotPlanetWithMoons(planet, sysModel, renderCtx, options = {}) {
  const moons = (renderCtx?.moonsByPlanet?.get(planet.id) || []).slice();
  return [
    createPlanetCard(planet, sysModel, {
      showAu: false,
      moonCountByPlanet: renderCtx?.moonCountByPlanet,
      allowPlanetDrag: options.allowPlanetDrag,
      placementText: options.placementText,
    }),
    createMoonDropZone(planet.id, moons, renderCtx?.planetsById),
  ];
}

function createGasGiantWithMoons(giant, giantKind, renderCtx) {
  const moons = (renderCtx?.moonsByPlanet?.get(giant.id) || []).slice();
  return createElement("div", {}, [
    createHint(`${giantKind} marker (${styleLabel(giant.style || "jupiter")}).`),
    createElement("div", { className: "button-row", attrs: { style: "margin-top:8px" } }, [
      createElement("button", {
        className: "small",
        attrs: {
          type: "button",
          "data-action": "guided-moon",
          "data-parent-id": giant.id,
          "data-parent-type": "gasGiant",
        },
        text: "Guided moon",
      }),
    ]),
    createMoonDropZone(giant.id, moons, renderCtx?.planetsById),
  ]);
}

function createSlotRow(title, body, options = {}) {
  return createElement("div", { className: "slot-row" }, [
    createElement("div", { className: "slot-title", text: title }),
    createElement(
      "div",
      {
        className: options.dropzoneClass || "dropzone",
        attrs: options.dropzoneStyle ? { style: options.dropzoneStyle } : {},
        dataset: options.dataset || {},
      },
      body,
    ),
  ]);
}

export function renderUnassignedPlanets(
  container,
  planets,
  sysModel,
  { moonCountByPlanet = null } = {},
) {
  return replaceChildren(
    container,
    planets.length
      ? planets.map((planet) => createPlanetCard(planet, sysModel, { moonCountByPlanet }))
      : createHint("No unassigned planets."),
  );
}

export function renderUnassignedMoons(container, moons, { planetsById = null } = {}) {
  return replaceChildren(
    container,
    moons.length
      ? createElement(
          "div",
          { className: "moon-list moon-list--unassigned" },
          moons.map((moon) => createMoonCard(moon, { showParent: false, planetsById })),
        )
      : createHint("No unassigned moons."),
  );
}

export function renderOrbitSlots(
  container,
  { hostSummary = "", hostTitle = "Host frame", orbitItems, planets, sysModel, renderCtx },
) {
  const rows = [
    createSlotRow(hostTitle, createHint(hostSummary || "Current host-frame context."), {
      dropzoneStyle: "cursor:default",
    }),
  ];

  for (const item of orbitItems) {
    if (item.type === "slot") {
      const occupant = planets.find((planet) => planet.slotIndex === item.slot);
      rows.push(
        createSlotRow(
          `Slot ${String(item.slot).padStart(2, "0")} (${fmt(item.au, 3)} AU)`,
          occupant
            ? createSlotPlanetWithMoons(occupant, sysModel, renderCtx)
            : createHint("Drop a planet here."),
          {
            dropzoneClass: "dropzone slot-drop",
            dataset: { slot: item.slot },
          },
        ),
      );
      continue;
    }

    if (item.type === "gas") {
      const giant = item.giant;
      const giantKind = giant.companionClass === "brownDwarf" ? "Brown dwarf" : "Gas giant";
      rows.push(
        createSlotRow(
          `${giant.name || giantKind} (Slot ${String(item.slot).padStart(2, "0")} - ${fmt(Number(giant.au) || item.au, 3)} AU)`,
          createGasGiantWithMoons(giant, giantKind, renderCtx),
          { dropzoneStyle: "cursor:default" },
        ),
      );
      continue;
    }

    rows.push(
      createSlotRow(
        `${item.name || "Debris disk"} (${fmt(item.inner, 2)} - ${fmt(item.outer, 2)} AU)`,
        createHint("Asteroid belt / debris disk region."),
        { dropzoneStyle: "cursor:default" },
      ),
    );
  }

  return replaceChildren(container, rows);
}

function architectureStateLabel(state) {
  switch (state) {
    case "stable":
      return "Stable spacing";
    case "packed":
      return "Packed spacing";
    case "crowded":
      return "Crowded spacing";
    case "unstable":
      return "Unstable spacing";
    default:
      return "Spacing unknown";
  }
}

function architecturePairName(pair) {
  return `${pair?.innerName || pair?.innerId || "Inner"} -> ${pair?.outerName || pair?.outerId || "Outer"}`;
}

function normalizeArchitectureBodyKind(kind) {
  const text = String(kind || "").trim();
  if (text === "gasGiant") return "gasGiant";
  if (text === "moon") return "moon";
  if (text === "planet") return "planet";
  return text || "planet";
}

function architectureSeparationLabel(value) {
  return value == null || !Number.isFinite(Number(value))
    ? "Unknown"
    : `${fmt(Number(value), 2)} R_H,m`;
}

function createArchitectureMetric(label, value) {
  return createElement("div", { className: "orbital-architecture__metric" }, [
    createElement("div", { className: "orbital-architecture__metric-label", text: label }),
    createElement("div", { className: "orbital-architecture__metric-value", text: value }),
  ]);
}

function createArchitecturePairRow(pair, { limiting = false } = {}) {
  const facts = [
    ["Spacing", architectureSeparationLabel(pair?.separationMutualHill)],
    ["State", architectureStateLabel(pair?.state)],
    ["Confidence", titleCase(pair?.confidence)],
    ["Orbit crossing", pair?.eccentricityOverlapRisk ? "Possible" : "Clear"],
  ];
  return createElement("div", { className: "orbital-architecture__pair-row" }, [
    createElement("div", { className: "orbital-architecture__pair-name" }, [
      createElement("span", { text: architecturePairName(pair) }),
      limiting
        ? createElement("span", {
            className: "orbital-architecture__pair-badge",
            text: "Limiting",
          })
        : null,
    ]),
    createElement(
      "div",
      { className: "orbital-architecture__pair-facts" },
      facts.map(([label, value]) =>
        createElement("span", { className: "orbital-architecture__pair-fact" }, [
          createElement("span", {
            className: "orbital-architecture__pair-fact-label",
            text: label,
          }),
          createElement("span", {
            className: "orbital-architecture__pair-fact-value",
            text: value,
          }),
        ]),
      ),
    ),
  ]);
}

const ARCHITECTURE_PAIR_TAB_TYPES = Object.freeze([
  { kind: "planet", label: "Rocky planets" },
  { kind: "gasGiant", label: "Gas giants" },
  { kind: "moon", label: "Moons" },
]);

let architecturePairTabsInstance = 0;

function architecturePairTabIdPart(kind) {
  return (
    String(kind || "body")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "body"
  );
}

function architecturePairTabLabel(kind) {
  const configured = ARCHITECTURE_PAIR_TAB_TYPES.find((tab) => tab.kind === kind);
  if (configured) return configured.label;
  const label = titleCase(kind || "body");
  return label === "Body" ? "Other bodies" : `${label} bodies`;
}

function architecturePairKinds(pair) {
  return new Set([
    normalizeArchitectureBodyKind(pair?.innerKind),
    normalizeArchitectureBodyKind(pair?.outerKind),
  ]);
}

function groupArchitecturePairsByKind(pairs) {
  const groupsByKind = new Map();
  for (const pair of pairs || []) {
    for (const kind of architecturePairKinds(pair)) {
      if (!groupsByKind.has(kind)) groupsByKind.set(kind, []);
      groupsByKind.get(kind).push(pair);
    }
  }

  const configuredGroups = ARCHITECTURE_PAIR_TAB_TYPES.map((tab) => ({
    ...tab,
    items: groupsByKind.get(tab.kind) || [],
  }));
  const configuredKinds = new Set(ARCHITECTURE_PAIR_TAB_TYPES.map((tab) => tab.kind));
  const extraGroups = Array.from(groupsByKind.entries())
    .filter(([kind]) => !configuredKinds.has(kind))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, items]) => ({
      kind,
      label: architecturePairTabLabel(kind),
      items,
    }));

  return [...configuredGroups, ...extraGroups];
}

function createArchitecturePairReadout(pairs, limitingPair) {
  const groups = groupArchitecturePairsByKind(pairs);
  if (!groups.length) return null;

  architecturePairTabsInstance += 1;
  const tabPrefix = `orbital-architecture-pair-tabs-${architecturePairTabsInstance}`;
  const tabs = [];
  const panels = [];

  const activateTab = (activeIndex) => {
    tabs.forEach((tab, index) => {
      const isActive = index === activeIndex;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      panels[index].hidden = !isActive;
    });
  };

  groups.forEach((group, index) => {
    const idPart = architecturePairTabIdPart(group.kind);
    const tabId = `${tabPrefix}-${idPart}-tab`;
    const panelId = `${tabPrefix}-${idPart}-panel`;
    const countLabel = `${group.items.length} ${group.items.length === 1 ? "adjacent pair" : "adjacent pairs"}`;
    const tab = createElement(
      "button",
      {
        className: `orbital-architecture__pair-tab${index === 0 ? " is-active" : ""}`,
        attrs: {
          type: "button",
          role: "tab",
          id: tabId,
          "aria-controls": panelId,
          "aria-label": `${group.label}, ${countLabel}`,
          "aria-selected": index === 0 ? "true" : "false",
        },
      },
      [
        group.label,
        createElement("span", {
          className: "orbital-architecture__pair-tab-count",
          text: group.items.length,
        }),
      ],
    );
    const panelChildren = group.items.length
      ? [
          createElement(
            "div",
            { className: "orbital-architecture__pair-list" },
            group.items.map((pair) =>
              createArchitecturePairRow(pair, { limiting: pair === limitingPair }),
            ),
          ),
        ]
      : [
          createElement("div", {
            className: "orbital-architecture__empty",
            text:
              group.kind === "moon"
                ? "No moon adjacent-pair spacing is available in this host-frame diagnostic."
                : "No adjacent pairs for this body type.",
          }),
        ];
    const panel = createElement(
      "div",
      {
        className: "orbital-architecture__pair-panel",
        attrs: {
          role: "tabpanel",
          id: panelId,
          "aria-labelledby": tabId,
        },
      },
      panelChildren,
    );
    panel.hidden = index !== 0;
    tab.addEventListener("click", () => activateTab(index));
    tabs.push(tab);
    panels.push(panel);
  });

  return createElement("div", { className: "orbital-architecture__pair-tabs" }, [
    createElement(
      "div",
      {
        className: "orbital-architecture__pair-tablist",
        attrs: { role: "tablist", "aria-label": "Packed spacing body type" },
      },
      tabs,
    ),
    ...panels,
  ]);
}

function titleCase(value) {
  const text = String(value || "unknown").replace(/[-_]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function longTermBodyKindLabel(kind) {
  switch (kind) {
    case "gasGiant":
      return "Gas giant";
    case "moon":
      return "Moon";
    case "planet":
      return "Planet";
    default:
      return titleCase(kind || "body");
  }
}

function longTermBodyLabel(bodyContext) {
  const kind = longTermBodyKindLabel(bodyContext?.bodyKind || "body");
  const id = String(bodyContext?.bodyId || "").trim();
  const name = String(
    bodyContext?.bodyName || bodyContext?.displayName || bodyContext?.name || "",
  ).trim();
  if (!name || name === id || name === kind) return kind;
  return `${kind} ${name}`.trim();
}

const LONG_TERM_BODY_TAB_TYPES = Object.freeze([
  { kind: "planet", label: "Rocky planets" },
  { kind: "gasGiant", label: "Gas giants" },
  { kind: "moon", label: "Moons" },
]);

const LONG_TERM_DEFINITIONS = Object.freeze([
  {
    term: "Secular",
    definition:
      "Slow gravitational forcing that can reshape eccentricity, inclination, or orientation over long timescales.",
  },
  {
    term: "KL",
    definition:
      "Kozai-Lidov cycling: companion-driven inclination and eccentricity exchange in tilted systems.",
  },
  {
    term: "Migration",
    definition:
      "Evidence that a body may have formed elsewhere and moved through the disk or by later scattering.",
  },
  {
    term: "Variability",
    definition:
      "Long-cycle orbital, tilt, or tidal change that could matter for climate or habitability interpretation.",
  },
  {
    term: "Trojans",
    definition:
      "Support for stable L4/L5 co-orbital reservoirs near the body, not a count of actual objects.",
  },
  {
    term: "Precession",
    definition:
      "Slow rotation of an orbit or spin direction, reported here as a bounded diagnostic.",
  },
]);

let longTermBodyTabsInstance = 0;

function isLongTermMetricSummary(note) {
  return /^(Secular forcing is|Migration evidence is|Trojan reservoir support is)\b/.test(
    String(note || ""),
  );
}

function createLongTermDefinitionsControl() {
  const toast = createElement(
    "div",
    {
      className: "long-term-dynamics__definitions-toast",
      attrs: {
        hidden: "",
        role: "status",
      },
    },
    [
      createElement("div", {
        className: "long-term-dynamics__definitions-title",
        text: "Definitions",
      }),
      createElement(
        "dl",
        { className: "long-term-dynamics__definitions-list" },
        LONG_TERM_DEFINITIONS.flatMap((entry) => [
          createElement("dt", { text: entry.term }),
          createElement("dd", { text: entry.definition }),
        ]),
      ),
      createElement("div", {
        className: "long-term-dynamics__definitions-note",
        text: "Labels are qualitative guideposts, not exact N-body integrations.",
      }),
    ],
  );
  const button = createElement("button", {
    className: "small long-term-dynamics__definitions-button",
    attrs: { type: "button", "aria-expanded": "false" },
    text: "Definitions",
  });
  button.addEventListener("click", () => {
    const shouldShow = toast.hidden;
    toast.hidden = !shouldShow;
    button.setAttribute("aria-expanded", shouldShow ? "true" : "false");
  });
  return createElement("div", { className: "long-term-dynamics__definitions" }, [button, toast]);
}

function createLongTermMetric(label, value) {
  return createElement("div", { className: "long-term-dynamics__metric" }, [
    createElement("div", { className: "long-term-dynamics__metric-label", text: label }),
    createElement("div", { className: "long-term-dynamics__metric-value", text: titleCase(value) }),
  ]);
}

function createLongTermNoteSection(title, notes) {
  const visibleNotes = (notes || []).filter(Boolean);
  if (!visibleNotes.length) return null;
  return createElement("div", { className: "long-term-dynamics__section" }, [
    createElement("div", { className: "long-term-dynamics__section-title", text: title }),
    createElement(
      "ul",
      { className: "long-term-dynamics__note-list" },
      visibleNotes.map((note) => createElement("li", { text: note })),
    ),
  ]);
}

function createLongTermBodyRow(bodyContext) {
  const summary = bodyContext?.summary || {};
  const facts = [
    ["Secular", summary.secularClass],
    ["Precession", summary.precessionClass],
    ["Variability", summary.variabilityClass],
    ["Trojans", summary.trojanReservoirClass],
  ];
  return createElement("div", { className: "long-term-dynamics__body-row" }, [
    createElement("div", {
      className: "long-term-dynamics__body-name",
      text: longTermBodyLabel(bodyContext),
    }),
    createElement(
      "div",
      { className: "long-term-dynamics__body-facts" },
      facts.map(([label, value]) =>
        createElement("span", { className: "long-term-dynamics__body-fact" }, [
          createElement("span", { className: "long-term-dynamics__body-fact-label", text: label }),
          createElement("span", {
            className: "long-term-dynamics__body-fact-value",
            text: titleCase(value),
          }),
        ]),
      ),
    ),
  ]);
}

function longTermBodyTabLabel(kind) {
  const configured = LONG_TERM_BODY_TAB_TYPES.find((tab) => tab.kind === kind);
  if (configured) return configured.label;
  const label = titleCase(kind || "body");
  return label === "Body" ? "Other bodies" : `${label} bodies`;
}

function longTermBodyTabIdPart(kind) {
  return (
    String(kind || "body")
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "body"
  );
}

function groupLongTermBodiesByKind(bodyContexts) {
  const groupsByKind = new Map();
  for (const bodyContext of bodyContexts || []) {
    const kind = String(bodyContext?.bodyKind || "body");
    if (!groupsByKind.has(kind)) groupsByKind.set(kind, []);
    groupsByKind.get(kind).push(bodyContext);
  }

  const configuredGroups = LONG_TERM_BODY_TAB_TYPES.flatMap((tab) => {
    const items = groupsByKind.get(tab.kind);
    return items?.length ? [{ ...tab, items }] : [];
  });
  const configuredKinds = new Set(LONG_TERM_BODY_TAB_TYPES.map((tab) => tab.kind));
  const extraGroups = Array.from(groupsByKind.entries())
    .filter(([kind]) => !configuredKinds.has(kind))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, items]) => ({
      kind,
      label: longTermBodyTabLabel(kind),
      items,
    }));

  return [...configuredGroups, ...extraGroups];
}

function createLongTermBodyReadout(bodyContexts) {
  const groups = groupLongTermBodiesByKind(bodyContexts);
  if (!groups.length) return null;

  longTermBodyTabsInstance += 1;
  const tabPrefix = `long-term-dynamics-body-tabs-${longTermBodyTabsInstance}`;
  const tabs = [];
  const panels = [];

  const activateTab = (activeIndex) => {
    tabs.forEach((tab, index) => {
      const isActive = index === activeIndex;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      panels[index].hidden = !isActive;
    });
  };

  groups.forEach((group, index) => {
    const idPart = longTermBodyTabIdPart(group.kind);
    const tabId = `${tabPrefix}-${idPart}-tab`;
    const panelId = `${tabPrefix}-${idPart}-panel`;
    const countLabel = `${group.items.length} ${group.items.length === 1 ? "body" : "bodies"}`;
    const tab = createElement(
      "button",
      {
        className: `long-term-dynamics__body-tab${index === 0 ? " is-active" : ""}`,
        attrs: {
          type: "button",
          role: "tab",
          id: tabId,
          "aria-controls": panelId,
          "aria-label": `${group.label}, ${countLabel}`,
          "aria-selected": index === 0 ? "true" : "false",
        },
      },
      [
        group.label,
        createElement("span", {
          className: "long-term-dynamics__body-tab-count",
          text: group.items.length,
        }),
      ],
    );
    const panel = createElement(
      "div",
      {
        className: "long-term-dynamics__body-panel",
        attrs: {
          role: "tabpanel",
          id: panelId,
          "aria-labelledby": tabId,
        },
      },
      [
        createElement(
          "div",
          { className: "long-term-dynamics__body-list" },
          group.items.map((bodyContext) => createLongTermBodyRow(bodyContext)),
        ),
      ],
    );
    panel.hidden = index !== 0;
    tab.addEventListener("click", () => activateTab(index));
    tabs.push(tab);
    panels.push(panel);
  });

  return createElement("div", { className: "long-term-dynamics__body-tabs" }, [
    createElement(
      "div",
      {
        className: "long-term-dynamics__body-tablist",
        attrs: { role: "tablist", "aria-label": "Body readout type" },
      },
      tabs,
    ),
    ...panels,
  ]);
}

export function renderOrbitalArchitectureDiagnostics(container, architecture) {
  if (!container) return null;
  const bodyCount = Number(architecture?.bodyCount || 0);
  if (!architecture || bodyCount < 2 || !architecture.pairs?.length) {
    return replaceChildren(container);
  }

  const summary = architecture.summary || {};
  const state = String(summary.state || "unknown");
  const limitingPair = architecture.pairs.find(
    (pair) =>
      pair.innerId === summary.limitingPairIds?.[0] &&
      pair.outerId === summary.limitingPairIds?.[1],
  );
  const prioritizedPairs = [
    ...(limitingPair ? [limitingPair] : []),
    ...architecture.pairs.filter((pair) => pair !== limitingPair),
  ];
  const pairReadout = createArchitecturePairReadout(prioritizedPairs, limitingPair);
  const summaryNote =
    summary.note ||
    limitingPair?.note ||
    "Adjacent body spacing was evaluated for the selected host frame.";

  return replaceChildren(
    container,
    createElement("div", { className: `system-architecture system-architecture--${state}` }, [
      createElement("div", { className: "slot-row" }, [
        createElement("div", {
          className: "slot-title",
          text: architectureStateLabel(state),
        }),
        createElement(
          "div",
          {
            className: "dropzone orbital-architecture",
            attrs: { style: "cursor:default" },
          },
          [
            createElement("div", { className: "orbital-architecture__summary", text: summaryNote }),
            createElement("div", { className: "orbital-architecture__metrics" }, [
              createArchitectureMetric("Status", architectureStateLabel(state)),
              createArchitectureMetric(
                "Minimum spacing",
                architectureSeparationLabel(
                  summary.minSeparationMutualHill ?? limitingPair?.separationMutualHill,
                ),
              ),
              createArchitectureMetric("Confidence", titleCase(summary.confidence)),
              createArchitectureMetric("Adjacent pairs", String(architecture.pairs.length)),
            ]),
            createElement("div", { className: "orbital-architecture__section" }, [
              createElement("div", {
                className: "orbital-architecture__section-title",
                text: "Adjacent pairs",
              }),
              pairReadout,
            ]),
          ],
        ),
      ]),
    ]),
  );
}

export function renderLongTermDynamicsDiagnostics(container, context, hostFrameId = null) {
  if (!container) return null;
  if (!context || context.status === "unknown") {
    return replaceChildren(container);
  }

  const outputs = context.outputs || {};
  const notes = Array.isArray(outputs.userFacingSummary) ? outputs.userFacingSummary : [];
  const insightNotes = notes.filter((note) => !isLongTermMetricSummary(note)).slice(0, 2);
  const hostContext = hostFrameId ? context.hostFrameContexts?.[hostFrameId] : null;
  const bodyContexts = Object.values(context.bodyContextsByRef || {}).filter(
    (bodyContext) => !hostFrameId || bodyContext.hostFrameId === hostFrameId,
  );
  const bodyReadout = createLongTermBodyReadout(bodyContexts);
  const timelineNotes = (context.migrationHistoryContext?.outputs?.timelineAnnotations || []).slice(
    0,
    2,
  );

  return replaceChildren(
    container,
    createElement("div", { className: "system-architecture system-architecture--long-term" }, [
      createElement("div", { className: "slot-row" }, [
        createElement("div", { className: "long-term-dynamics__header" }, [
          createElement("div", {
            className: "slot-title",
            text: "Long-term dynamics",
          }),
          createLongTermDefinitionsControl(),
        ]),
        createElement(
          "div",
          {
            className: "dropzone long-term-dynamics",
            attrs: { style: "cursor:default" },
          },
          [
            createElement("div", {
              className: "long-term-dynamics__summary",
              text: "Read-only long-cycle diagnostics for architecture risks and history clues. They do not change authored orbits.",
            }),
            createElement(
              "div",
              {
                className: "long-term-dynamics__metrics",
              },
              [
                createLongTermMetric("Secular", outputs.systemSecularClass),
                createLongTermMetric("KL", outputs.kozaiLidovClass),
                createLongTermMetric("Migration", outputs.migrationEvidenceClass),
                createLongTermMetric("Variability", outputs.dynamicalVariabilityClass),
                createLongTermMetric("Trojans", outputs.trojanReservoirClass),
              ],
            ),
            ...(hostContext
              ? [
                  createElement("div", { className: "long-term-dynamics__host" }, [
                    createElement("span", {
                      className: "long-term-dynamics__host-label",
                      text: "Selected host frame",
                    }),
                    createElement("span", {
                      className: "long-term-dynamics__host-value",
                      text: `Secular forcing ${titleCase(hostContext.secularForcingClass)}`,
                    }),
                  ]),
                ]
              : []),
            createLongTermNoteSection("Watch", insightNotes),
            createLongTermNoteSection("History clues", timelineNotes),
            bodyReadout
              ? createElement("div", { className: "long-term-dynamics__section" }, [
                  createElement("div", {
                    className: "long-term-dynamics__section-title",
                    text: "Body readout",
                  }),
                  bodyReadout,
                ])
              : null,
          ],
        ),
      ]),
    ]),
  );
}

export function renderManualBodyList(container, bodies = [], options = {}) {
  const sysModel = options.sysModel || { orbitsAu: [] };
  const renderCtx = options.renderCtx || {};
  const allowPlanetDrag = options.allowPlanetDrag !== false;
  return replaceChildren(
    container,
    bodies.length
      ? bodies.map((body) => {
          let content = createHint(body.kind);
          if (body.planet) {
            content = createSlotPlanetWithMoons(body.planet, sysModel, renderCtx, {
              allowPlanetDrag,
              placementText: options.placementText || "Manual orbit",
            });
          } else if (body.gasGiant) {
            const giantKind =
              body.gasGiant.companionClass === "brownDwarf" ? "Brown dwarf" : "Gas giant";
            content = createGasGiantWithMoons(body.gasGiant, giantKind, renderCtx);
          }
          return createSlotRow(`${body.name} (${body.auLabel})`, content, {
            dropzoneStyle: "cursor:default",
          });
        })
      : createHint("No bodies created yet."),
  );
}
