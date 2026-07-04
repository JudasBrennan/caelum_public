import { createElement } from "./domHelpers.js";
import { tipIconNode } from "./tooltip.js";
import { structuredTip } from "./tooltipCopy.js";

const VIEW_LABELS = Object.freeze({
  overview: "Overview",
  hazards: "Hazards",
  affected: "Affected Worlds",
  map: "Spatial Read",
  assumptions: "Assumptions",
  report: "Report",
});

const VIEW_TIPS = Object.freeze({
  overview: structuredTip({
    overview: "The first-scan read of the saved system's external stellar-neighbourhood hazards.",
    drawnFrom:
      "Local Cluster density and systems, Oort/comet context, saved bodies, and the hazard model summary.",
    interpretAs:
      "Start here for the overall external-risk weather report before opening individual hazard cards.",
    caveat: "This page is an analytic risk screen, not a scheduled event forecast.",
  }),
  hazards: structuredTip({
    overview: "Supernova, flyby, comet-shower, dense-cluster, and survival hazard cards.",
    drawnFrom: "The hazard family outputs in the current model.",
    interpretAs: "Open cards to inspect drivers, intervals, affected surfaces, and caveats.",
    caveat: "Intervals are broad rate proxies, not exact event dates.",
  }),
  affected: structuredTip({
    overview: "Saved bodies and reservoirs grouped by likely consequence.",
    drawnFrom: "Saved planet, moon, gas-giant, debris, comet, and Oort-cloud context.",
    interpretAs:
      "Use this to see whether a hazard mostly affects atmospheres, impacts, reservoirs, or indirect system context.",
    caveat: "Group labels do not imply equal severity for every listed body.",
  }),
  map: structuredTip({
    overview: "A compact read of the Local Cluster Hazard Lens used by the 3D visualizer.",
    drawnFrom:
      "Generated nearby-star coordinates, massive-star candidates, supernova proxy shells, and flyby/Oort thresholds.",
    interpretAs:
      "Use this to decide whether opening the cluster map will clarify the current hazard result.",
    caveat:
      "The lens draws proxy distances and statistical candidates. It is spatial context, not an exact encounter simulation.",
  }),
  assumptions: structuredTip({
    overview: "Model inputs, assumptions, caveats, and unsupported physics.",
    drawnFrom: "The current hazard model and Local Cluster/Oort inputs.",
    interpretAs:
      "Low confidence here means the page is using broader defaults or fewer saved contexts.",
  }),
  report: structuredTip({
    overview: "Copy-ready summary text for notes or sharing.",
    drawnFrom: "The current hazard model headline, top hazards, affected worlds, and caveats.",
    interpretAs: "Use compact copy for chat and markdown copy for longer notes.",
  }),
});

const DEFINITIONS = Object.freeze([
  {
    term: "Neighbourhood hazard",
    definition:
      "An external deep-time risk from nearby stars or the local stellar environment, separate from the host star's own lifecycle.",
  },
  {
    term: "Supernova exposure",
    definition:
      "A statistical screen for nearby supernova rates within broad atmosphere-stripping and mass-extinction distance proxies.",
  },
  {
    term: "Flyby exposure",
    definition:
      "A rate proxy for passing stars that can stir outer reservoirs or, in very rare cases, disturb wide architecture.",
  },
  {
    term: "Comet-shower potential",
    definition:
      "The chance that flyby pressure plus an active Oort reservoir can produce episodic comet injection.",
  },
  {
    term: "Dense-cluster stress",
    definition:
      "A qualitative pressure label for crowded stellar environments with more frequent perturbations.",
  },
  {
    term: "Expected interval",
    definition:
      "A broad average interval from a rate screen. It is not a scheduled event date or deterministic prediction.",
  },
  {
    term: "Confidence",
    definition:
      "A model-readiness label from available Local Cluster, Oort, small-body, and saved-body context.",
  },
]);

function safeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function makeChip(label, tone = "neutral") {
  return createElement("span", {
    className: `neighbourhood-hazards-chip neighbourhood-hazards-chip--${safeText(tone, "neutral")}`,
    text: label,
  });
}

function createDefinitionsControl() {
  const toast = createElement(
    "div",
    {
      className: "neighbourhood-hazards-definitions__toast",
      attrs: { hidden: "", role: "status" },
    },
    [
      createElement("div", {
        className: "neighbourhood-hazards-definitions__title",
        text: "Definitions",
      }),
      createElement(
        "dl",
        { className: "neighbourhood-hazards-definitions__list" },
        DEFINITIONS.flatMap((entry) => [
          createElement("dt", { text: entry.term }),
          createElement("dd", { text: entry.definition }),
        ]),
      ),
      createElement("div", {
        className: "neighbourhood-hazards-definitions__note",
        text: "Neighbourhood Hazards is an analytic external-risk screen. It does not simulate exact encounters, explosion physics, impactor populations, or biology.",
      }),
    ],
  );
  const button = createElement("button", {
    className: "small neighbourhood-hazards-definitions__button",
    attrs: { type: "button", "aria-expanded": "false" },
    text: "Definitions",
  });
  button.addEventListener("click", () => {
    const shouldShow = toast.hidden;
    toast.hidden = !shouldShow;
    button.setAttribute("aria-expanded", shouldShow ? "true" : "false");
  });
  return createElement("div", { className: "neighbourhood-hazards-definitions" }, [button, toast]);
}

function createTabs(activeView) {
  return createElement(
    "div",
    {
      className: "neighbourhood-hazards-tabs",
      attrs: { role: "tablist", "aria-label": "Stellar Neighbourhood Hazards views" },
    },
    Object.entries(VIEW_LABELS).map(([id, label]) =>
      createElement("button", {
        className: `neighbourhood-hazards-tab${id === activeView ? " is-active" : ""}`,
        attrs: {
          type: "button",
          role: "tab",
          "aria-selected": id === activeView ? "true" : "false",
          "data-tip": VIEW_TIPS[id] || "",
        },
        dataset: { hazardView: id },
        text: label,
      }),
    ),
  );
}

function createMetric(metric) {
  return createElement(
    "div",
    {
      className: `neighbourhood-hazards-metric neighbourhood-hazards-metric--${safeText(
        metric.tone,
        "neutral",
      )}`,
    },
    [
      createElement("div", {
        className: "neighbourhood-hazards-metric__value",
        text: metric.value,
      }),
      createElement("div", {
        className: "neighbourhood-hazards-metric__label",
        text: metric.label,
      }),
      metric.meta
        ? createElement("div", {
            className: "neighbourhood-hazards-metric__meta",
            text: metric.meta,
          })
        : null,
    ],
  );
}

function createKeyReading(item) {
  return createElement(
    "div",
    {
      className: `neighbourhood-hazards-reading neighbourhood-hazards-reading--${safeText(
        item.tone,
        "neutral",
      )}`,
    },
    [
      createElement("div", { className: "neighbourhood-hazards-reading__label", text: item.label }),
      createElement("div", { className: "neighbourhood-hazards-reading__value", text: item.value }),
    ],
  );
}

function createHero(model) {
  return createElement("section", { className: "neighbourhood-hazards-hero" }, [
    createElement("div", { className: "neighbourhood-hazards-hero__header" }, [
      createElement("div", {}, [
        createElement("div", {
          className: "neighbourhood-hazards-hero__eyebrow",
          text: "External deep-time hazard screen",
        }),
        createElement("h2", { text: model.headline }),
      ]),
      createDefinitionsControl(),
    ]),
    createElement("p", { text: model.summary }),
    createElement("div", { className: "neighbourhood-hazards-hero__chips" }, [
      makeChip(model.dominantHazard?.label || "No dominant hazard", model.dominantHazard?.tone),
      makeChip(`${model.confidence} confidence`, model.confidence === "High" ? "good" : "caution"),
      createElement("a", {
        className: "neighbourhood-hazards-hero__link",
        attrs: { href: "#/fate" },
        text: "System Fate",
      }),
    ]),
  ]);
}

function createOverview(model) {
  return createElement("section", { className: "neighbourhood-hazards-overview" }, [
    createElement(
      "div",
      { className: "neighbourhood-hazards-metrics" },
      model.kpis.map(createMetric),
    ),
    createElement("div", { className: "neighbourhood-hazards-readings" }, [
      ...model.keyReadings.map(createKeyReading),
    ]),
  ]);
}

function createDriverList(hazard) {
  return createElement(
    "dl",
    { className: "neighbourhood-hazards-drivers" },
    (hazard.drivers || []).flatMap((item) => [
      createElement("dt", { text: item.label }),
      createElement("dd", {}, [
        createElement("b", { text: item.value }),
        item.detail ? createElement("span", { text: item.detail }) : null,
      ]),
    ]),
  );
}

function createHazardCard(hazard) {
  return createElement(
    "details",
    {
      className: `neighbourhood-hazards-card neighbourhood-hazards-card--${safeText(
        hazard.tone,
        "neutral",
      )}`,
      attrs: { open: hazard.severity >= 0.45 ? "" : null },
    },
    [
      createElement("summary", { className: "neighbourhood-hazards-card__summary" }, [
        createElement("span", { className: "neighbourhood-hazards-card__main" }, [
          createElement("b", { text: hazard.label }),
          createElement("span", { text: hazard.summary }),
        ]),
        createElement("span", { className: "neighbourhood-hazards-card__chips" }, [
          makeChip(hazard.riskClass, hazard.tone),
          makeChip(hazard.intervalLabel, "neutral"),
          makeChip(
            `${hazard.confidence} confidence`,
            hazard.confidence === "High" ? "good" : "caution",
          ),
        ]),
      ]),
      createElement("div", { className: "neighbourhood-hazards-card__body" }, [
        hazard.affects?.length
          ? createElement("div", { className: "neighbourhood-hazards-affects" }, [
              createElement("span", { text: "Affects" }),
              ...hazard.affects.map((item) => makeChip(item, "info")),
            ])
          : null,
        createDriverList(hazard),
        hazard.caveats?.length
          ? createElement(
              "ul",
              { className: "neighbourhood-hazards-caveats" },
              hazard.caveats.map((item) => createElement("li", { text: item })),
            )
          : null,
      ]),
    ],
  );
}

function createHazardsView(model) {
  return createElement(
    "section",
    { className: "neighbourhood-hazards-cards" },
    model.hazards.map(createHazardCard),
  );
}

function activeAffectedGroup(model, state) {
  const requested = safeText(state.affectedGroup);
  if (model.affectedGroups.some((group) => group.id === requested && group.count > 0))
    return requested;
  return (
    model.affectedGroups.find((group) => group.count > 0)?.id ||
    model.affectedGroups[0]?.id ||
    "atmospheres"
  );
}

function createAffectedTabs(model, activeGroup) {
  return createElement(
    "div",
    {
      className: "neighbourhood-hazards-group-tabs",
      attrs: { role: "tablist", "aria-label": "Affected-world groups" },
    },
    model.affectedGroups.map((group) =>
      createElement("button", {
        className: `neighbourhood-hazards-group-tab${group.id === activeGroup ? " is-active" : ""}`,
        attrs: {
          type: "button",
          role: "tab",
          "aria-selected": group.id === activeGroup ? "true" : "false",
          disabled: group.count ? null : "disabled",
        },
        dataset: { hazardGroup: group.id },
        text: `${group.label} (${group.count})`,
      }),
    ),
  );
}

function createAffectedRow(item) {
  return createElement("div", { className: "neighbourhood-hazards-affected-row" }, [
    createElement("div", { className: "neighbourhood-hazards-affected-row__main" }, [
      createElement("b", { text: item.name }),
      createElement("span", { text: `${item.kind} | ${item.consequenceClass}` }),
      createElement("p", { text: item.summary }),
    ]),
    createElement("div", { className: "neighbourhood-hazards-affected-row__chips" }, [
      makeChip(item.confidence, item.confidence === "High" ? "good" : "caution"),
      ...item.drivers.slice(0, 2).map((driver) => makeChip(driver, "neutral")),
    ]),
  ]);
}

function createAffectedView(model, state) {
  const activeGroup = activeAffectedGroup(model, state);
  const rows = model.affectedWorlds.filter((item) => item.group === activeGroup);
  return createElement("section", { className: "neighbourhood-hazards-affected" }, [
    createAffectedTabs(model, activeGroup),
    rows.length
      ? createElement(
          "div",
          { className: "neighbourhood-hazards-affected-list" },
          rows.map(createAffectedRow),
        )
      : createElement("div", {
          className: "neighbourhood-hazards-empty",
          text: "No saved bodies or reservoirs are in this group for the current model.",
        }),
  ]);
}

function createFacts(model) {
  const facts = [
    ["Model", model.modelVersion],
    ["Stellar density", `${model.inputs.stellarDensityPerLy3} / ly^3`],
    ["Neighbourhood radius", `${model.inputs.neighbourhoodRadiusLy} ly`],
    ["GHZ probability", `${Math.round(model.inputs.ghzProbability * 100)}%`],
    ["Generated systems", String(model.inputs.systemCount)],
    ["Oort present", model.inputs.oortPresent ? "Yes" : "No"],
  ];
  return createElement(
    "dl",
    { className: "neighbourhood-hazards-facts" },
    facts.flatMap(([label, value]) => [
      createElement("dt", { text: label }),
      createElement("dd", { text: value }),
    ]),
  );
}

function formatLy(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unavailable";
  return `${number >= 10 ? number.toFixed(1) : number.toFixed(2)} ly`;
}

function createMapView(model) {
  const hazardMap = model.hazardMap || {};
  const facts = hazardMap.facts || {};
  const encounterInset = hazardMap.encounterInset || {};
  const shells = Array.isArray(hazardMap.shells) ? hazardMap.shells : [];
  const candidateCount = Number(facts.massiveCandidateCount) || 0;
  const factRows = [
    ["Rendered cluster radius", formatLy(facts.renderedClusterRadiusLy)],
    [
      "Lethal supernova proxy",
      facts.lethalProxyFits ? "Visible in current radius" : "Extrapolated beyond view",
    ],
    [
      "Atmosphere-stripping proxy",
      facts.strippingProxyFits ? "Visible in current radius" : "Extrapolated beyond view",
    ],
    ["Nearest generated neighbour", encounterInset.nearestGeneratedSystemLabel || "unavailable"],
    [
      "Massive-star candidates",
      candidateCount ? String(candidateCount) : "None in generated sample",
    ],
    ["Flyby interval", encounterInset.flybyIntervalLabel || "unavailable"],
  ];
  return createElement("section", { className: "neighbourhood-hazards-map" }, [
    createElement("div", { className: "neighbourhood-hazards-map__header" }, [
      createElement("div", {}, [
        createElement("h2", {}, [
          createElement("span", { text: "Spatial Hazard Read" }),
          tipIconNode(VIEW_TIPS.map),
        ]),
        createElement("p", {
          text: "The Local Cluster visualizer can overlay the same hazard model as proxy shells, massive-star candidates, and an Oort/flyby inset.",
        }),
      ]),
      createElement("a", {
        className: "workflow-page-shell__action small",
        attrs: { href: "#/cluster-viz?hazards=1" },
        text: "Open Hazard Lens",
      }),
    ]),
    createElement(
      "dl",
      { className: "neighbourhood-hazards-facts neighbourhood-hazards-map__facts" },
      factRows.flatMap(([label, value]) => [
        createElement("dt", { text: label }),
        createElement("dd", { text: value }),
      ]),
    ),
    shells.length
      ? createElement(
          "div",
          { className: "neighbourhood-hazards-map__shells" },
          shells.map((shell) =>
            createElement("div", { className: "neighbourhood-hazards-map__shell" }, [
              makeChip(shell.label || "Hazard shell", shell.tone || "neutral"),
              createElement("span", {
                text: `${formatLy(shell.radiusLy)}${shell.extrapolated ? " | extrapolated to cluster edge" : ""}`,
              }),
            ]),
          ),
        )
      : null,
    createElement("p", {
      className: "neighbourhood-hazards-map__note",
      text: "Use the lens for orientation and storytelling checks. Numerical hazard confidence still comes from the hazard cards and assumptions.",
    }),
  ]);
}

function createAssumptionsView(model) {
  return createElement("section", { className: "neighbourhood-hazards-assumptions" }, [
    createElement("h2", {}, [
      createElement("span", { text: "Assumptions" }),
      tipIconNode(VIEW_TIPS.assumptions),
    ]),
    createFacts(model),
    createElement(
      "ul",
      { className: "neighbourhood-hazards-assumption-list" },
      model.assumptions.map((item) => createElement("li", { text: item })),
    ),
    model.limitingFactors.length
      ? createElement("div", { className: "neighbourhood-hazards-limits" }, [
          createElement("h3", { text: "Model Limits" }),
          createElement(
            "ul",
            {},
            model.limitingFactors.map((item) => createElement("li", { text: item })),
          ),
        ])
      : null,
  ]);
}

function createReportView(model, state) {
  return createElement("section", { className: "neighbourhood-hazards-report" }, [
    createElement("div", { className: "neighbourhood-hazards-report__header" }, [
      createElement("h2", { text: "Shareable Report" }),
      createElement("div", { className: "neighbourhood-hazards-report__actions" }, [
        createElement("button", {
          className: "small",
          attrs: { type: "button" },
          dataset: { hazardCopy: "compact" },
          text: "Copy Compact",
        }),
        createElement("button", {
          className: "small",
          attrs: { type: "button" },
          dataset: { hazardCopy: "markdown" },
          text: "Copy Markdown",
        }),
      ]),
    ]),
    state.copyStatus
      ? createElement("div", {
          className: "neighbourhood-hazards-copy-status",
          text: state.copyStatus,
        })
      : null,
    createElement("div", { className: "neighbourhood-hazards-report__body" }, [
      ...model.report.markdown
        .split("\n")
        .map((line) =>
          line
            ? createElement("p", { text: line })
            : createElement("div", { className: "flow-spacer--sm" }),
        ),
    ]),
  ]);
}

function createActiveView(model, state) {
  switch (state.view) {
    case "hazards":
      return createHazardsView(model);
    case "affected":
      return createAffectedView(model, state);
    case "map":
      return createMapView(model);
    case "assumptions":
      return createAssumptionsView(model);
    case "report":
      return createReportView(model, state);
    default:
      return createOverview(model);
  }
}

export function createNeighbourhoodHazardsPanel(model, state = {}) {
  const activeView = safeText(state.view, "overview");
  return createElement("div", { className: "neighbourhood-hazards" }, [
    createHero(model),
    createTabs(activeView),
    createActiveView(model, { ...state, view: activeView }),
  ]);
}
