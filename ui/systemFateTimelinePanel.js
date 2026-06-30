import { formatSystemFateAu, formatSystemFateTiming } from "../engine/systemFateTimeline.js";
import { createElement } from "./domHelpers.js";
import { tipIconNode } from "./tooltip.js";
import { structuredTip } from "./tooltipCopy.js";

const PROMISING_WORLDS_TIP = structuredTip({
  overview:
    "Promising Worlds are model-prioritized bodies worth inspecting for current or future habitability signals.",
  drawnFrom:
    "Saved planet, moon, and gas-giant outputs combined with the selected host-frame stellar lifecycle, habitable-zone migration, orbit context, and risk markers.",
  interpretAs:
    "Use this as a shortlist for inspection, not as a confirmed habitability verdict or evidence of life.",
  caveat:
    "System Fate is an analytic comparison layer. It does not run a full climate model, ecosystem model, or detailed dynamical integration.",
  references:
    "See Science & Maths: stellar lifecycle tracks, habitable zones, and habitability scoring.",
});

const SYSTEM_FATE_TIPS = Object.freeze({
  current: structuredTip({
    overview: "Bodies with the strongest current habitability or temperate-window signal.",
    drawnFrom:
      "Current solved body outputs, host-frame flux, current HZ position, and risk filters.",
    interpretAs: "A high count means there are more worlds worth inspecting now.",
    caveat: "This is not a claim that the bodies are habitable or inhabited.",
    references: "See Science & Maths: habitability scoring and stellar flux.",
  }),
  future: structuredTip({
    overview:
      "Bodies that are not necessarily promising now but enter better exposure windows later.",
    drawnFrom: "The age-preview lifecycle samples, moving HZ bands, and each body's orbit.",
    interpretAs:
      "Useful for spotting cold worlds that may thaw or moons that gain a future window.",
    caveat: "Future windows are broad analytic intervals, not precise climate forecasts.",
    references: "See Science & Maths: stellar lifecycle tracks and habitable-zone migration.",
  }),
  risks: structuredTip({
    overview: "Major long-term exposure risks found across the selected host frame.",
    drawnFrom:
      "Lifecycle markers, HZ migration, irradiation thresholds, orbit context, and remnant caveats.",
    interpretAs: "Higher counts mean more bodies have notable long-term warnings to inspect.",
    caveat:
      "Risk markers do not simulate explosion energy, nucleosynthesis, fallback, remnant light curves, or detailed atmospheric loss.",
    references: "See Science & Maths: stellar lifecycle tracks.",
  }),
  confidence: structuredTip({
    overview: "A page-level confidence label for the selected System Fate reading.",
    drawnFrom:
      "Availability and quality of host lifecycle data, body outputs, orbit data, and risk classifications.",
    interpretAs: "Use lower confidence as a prompt to inspect missing inputs or caveats.",
    caveat: "Confidence is a model-readiness signal, not a probability that a world is habitable.",
    references: "See Science & Maths: model confidence and lifecycle tracks.",
  }),
  hostFrame: structuredTip({
    overview: "The local star or pair frame used for this System Fate calculation.",
    changes:
      "Changing the host frame changes luminosity, lifecycle timing, habitable-zone placement, and which saved bodies are evaluated.",
    interpretAs:
      "In multi-star systems, the same body can have different exposure context depending on its host frame.",
    caveat: "The page follows the app's analytic host-frame model, not a full N-body integration.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  filter: structuredTip({
    overview: "Narrows the timeline lanes to a category of bodies or warnings.",
    changes: "The visible lanes, rankings, and selected drilldown candidates shown on this page.",
    interpretAs:
      "Use filters to focus on promising worlds, high risks, moons, or unevaluated bodies.",
    references: "See Science & Maths: System Fate scoring.",
  }),
  sort: structuredTip({
    overview: "Orders the currently visible System Fate lanes.",
    changes:
      "Only the display order changes; the underlying scores, warnings, and timeline segments stay the same.",
    interpretAs: "Use orbit order for architecture, or score-based sorts for triage.",
    references: "See Science & Maths: System Fate scoring.",
  }),
  agePreview: structuredTip({
    overview: "Selects a stellar age snapshot for the At Age view.",
    feedsInto:
      "The previewed host properties, HZ position, active body lists, and warning lists for that age.",
    drawnFrom: "Analytic stellar lifecycle samples for the selected host frame.",
    caveat:
      "This samples broad lifecycle tracks; it is not a continuous stellar-structure simulation or climate integration.",
    references: "See Science & Maths: stellar lifecycle tracks.",
  }),
  lifecycle: structuredTip({
    overview: "A compact ruler for the selected host frame's sampled stellar lifecycle.",
    drawnFrom:
      "The host star or pair lifecycle track, current age, selected preview age, and major markers.",
    interpretAs: "Markers show broad transition points that affect System Fate lanes.",
    caveat:
      "For massive stars, supernova transition markers do not model explosion energy, nucleosynthesis, fallback, or light curves.",
    references: "See Science & Maths: stellar lifecycle tracks.",
  }),
  rankings: structuredTip({
    overview:
      "Grouped shortlists of bodies sorted by current promise, future windows, stability, moons, risks, or missing data.",
    drawnFrom: "The same timeline lanes and scores used by the overview and timeline views.",
    interpretAs: "Use rankings as navigation shortcuts into the drilldown, not as final verdicts.",
    caveat:
      "Different ranking groups reward different signals, so a world can appear in more than one group.",
    references: "See Science & Maths: habitability scoring and System Fate scoring.",
  }),
  report: structuredTip({
    overview: "A copyable summary of the selected host frame's System Fate reading.",
    drawnFrom: "The current System Fate model, spotlight bodies, major risks, and report lines.",
    interpretAs: "Use compact copy for chat, or the full report for notes and release discussion.",
    caveat:
      "The report summarizes model outputs; it does not preserve every underlying body input.",
    references: "See Science & Maths: System Fate scoring.",
  }),
});

const VIEW_LABELS = Object.freeze({
  overview: "Overview",
  timeline: "Timeline",
  lifecycle: "Lifecycle",
  age: "At Age",
  rankings: "Rankings",
  report: "Report",
});

const FILTER_LABELS = Object.freeze({
  all: "All",
  candidates: "Promising Worlds",
  risks: "Risks",
  moons: "Moons",
  unevaluated: "Not evaluated",
});

const SORT_LABELS = Object.freeze({
  orbit: "Orbit order",
  current: "Best current",
  future: "Future potential",
  risk: "Risk severity",
});

const RANKING_LABELS = Object.freeze({
  currentCandidates: "Current Promising Worlds",
  futureCandidates: "Future Windows",
  longestStable: "Longest Stable Windows",
  moonCandidates: "Promising Moons",
  highRisks: "High Risks",
  notEvaluated: "Not Evaluated",
});

function safeText(value, fallback = "") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pct(value, max) {
  const number = finiteOrNull(value);
  if (number == null || !(max > 0)) return null;
  return Math.max(0, Math.min(100, (number / max) * 100));
}

function laneById(timeline) {
  return new Map((timeline?.lanes || []).map((lane) => [lane.id, lane]));
}

function makeChip(label, tone = "neutral", tip = "") {
  return createElement("span", {
    className: `system-fate-chip system-fate-chip--${tone}`,
    attrs: tip ? { tabindex: "0", "data-tip": tip } : {},
    text: label,
  });
}

function headingWithTip(tagName, label, tip = "") {
  return createElement(tagName, { className: "system-fate-heading" }, [
    createElement("span", { text: label }),
    tip ? tipIconNode(tip) : null,
  ]);
}

function makeMetric(label, value, tone = "neutral") {
  return createElement("div", { className: `system-fate-metric system-fate-metric--${tone}` }, [
    createElement("div", { className: "system-fate-metric__value", text: value }),
    createElement("div", { className: "system-fate-metric__label", text: label }),
  ]);
}

function selectedValue(value, fallback) {
  return safeText(value, fallback);
}

function createOption(value, label, selected) {
  const option = createElement("option", { attrs: { value }, text: label });
  if (String(value) === String(selected)) option.selected = true;
  return option;
}

function createSelect(label, name, options, selected) {
  const id = `system-fate-${name}`;
  const tip = SYSTEM_FATE_TIPS[name] || "";
  return createElement("label", { className: "system-fate-control" }, [
    createElement("span", {}, [
      createElement("span", { text: label }),
      tip ? tipIconNode(tip) : null,
    ]),
    createElement(
      "select",
      { attrs: { id }, dataset: { fateControl: name } },
      options.map((option) => createOption(option.id, option.label, selected)),
    ),
  ]);
}

function createViewTabs(activeView) {
  const tabTips = {
    overview: structuredTip({
      overview:
        "Combines the main System Fate summary, timeline, rankings, and selected body drilldown.",
      drawnFrom: "The selected host-frame timeline model.",
      interpretAs: "Start here for a whole-system read before filtering into specific views.",
      references: "See Science & Maths: System Fate scoring.",
    }),
    timeline: structuredTip({
      overview: "Shows each evaluated body as a lane across the host lifecycle.",
      drawnFrom: "Saved body orbits, moving HZ exposure, lifecycle markers, and risk windows.",
      interpretAs:
        "Segments show broad exposure windows; markers show notable future or risk events.",
      caveat: "Timeline lanes are analytic summaries, not orbit integrations.",
      references: "See Science & Maths: stellar lifecycle tracks.",
    }),
    lifecycle: structuredTip({
      overview: "Shows each object's own birth, current phase, next transition, and endpoint.",
      drawnFrom:
        "Planet, moon, and star lifecycle timelines plus System Fate stellar exposure markers.",
      interpretAs: "Use this view when you want a birth-to-endpoint read for each saved body.",
      caveat:
        "Lifecycle rows are broad model summaries; they do not integrate future climates, impacts, or N-body histories.",
      references: "See Science & Maths: lifecycle timelines.",
    }),
    age: SYSTEM_FATE_TIPS.agePreview,
    rankings: SYSTEM_FATE_TIPS.rankings,
    report: SYSTEM_FATE_TIPS.report,
  };
  return createElement(
    "div",
    {
      className: "system-fate-tabs",
      attrs: { role: "tablist", "aria-label": "System Fate views" },
    },
    Object.entries(VIEW_LABELS).map(([id, label]) =>
      createElement("button", {
        className: `system-fate-tab${id === activeView ? " is-active" : ""}`,
        attrs: {
          type: "button",
          role: "tab",
          "aria-selected": id === activeView ? "true" : "false",
          "data-tip": tabTips[id] || "",
        },
        dataset: { fateView: id },
        text: label,
      }),
    ),
  );
}

function filterLanes(lanes, filter) {
  switch (filter) {
    case "candidates":
      return lanes.filter(
        (lane) =>
          lane.currentStatus === "current-candidate" ||
          lane.currentStatus === "subsurface-candidate" ||
          lane.futurePotential >= 0.24,
      );
    case "risks":
      return lanes.filter((lane) => lane.riskSeverity >= 0.35);
    case "moons":
      return lanes.filter((lane) => lane.kind === "moon");
    case "unevaluated":
      return lanes.filter((lane) => lane.currentStatus === "not-evaluated");
    default:
      return lanes;
  }
}

function sortLanes(lanes, sort) {
  const sorted = [...lanes];
  if (sort === "current") {
    sorted.sort((left, right) => right.currentPotential - left.currentPotential);
  } else if (sort === "future") {
    sorted.sort((left, right) => right.futurePotential - left.futurePotential);
  } else if (sort === "risk") {
    sorted.sort((left, right) => right.riskSeverity - left.riskSeverity);
  } else {
    sorted.sort((left, right) => (left.sort?.orbit || 0) - (right.sort?.orbit || 0));
  }
  return sorted;
}

function markerTone(marker) {
  if (marker.severity === "bad") return "bad";
  if (marker.severity === "warning") return "warn";
  if (marker.severity === "caution") return "caution";
  return "info";
}

function segmentStyle(segment, maxAge) {
  const start = pct(segment.startGyr, maxAge) ?? 0;
  const end = pct(segment.endGyr, maxAge);
  const width = end == null ? Math.max(4, 100 - start) : Math.max(2, end - start);
  return `--fate-start:${start.toFixed(3)}%;--fate-width:${width.toFixed(3)}%`;
}

function markerStyle(marker, maxAge) {
  const left = pct(marker.timeGyr, maxAge) ?? 0;
  return `--fate-marker:${left.toFixed(3)}%`;
}

function createLifecycleRuler(timeline) {
  const maxAge = Number(timeline?.maxAgeGyr) || 1;
  const current = pct(timeline?.currentAgeGyr, maxAge);
  const selected = pct(timeline?.selectedAge?.ageGyr, maxAge);
  const markers = Array.isArray(timeline?.lifecycleMarkers) ? timeline.lifecycleMarkers : [];
  return createElement("section", { className: "system-fate-ruler" }, [
    createElement("div", { className: "system-fate-ruler__header" }, [
      headingWithTip("h2", "Host Lifecycle", SYSTEM_FATE_TIPS.lifecycle),
      createElement("span", {
        text: `${formatSystemFateTiming(timeline?.currentAgeGyr)} now | ${formatSystemFateTiming(
          timeline?.maxAgeGyr,
        )} sampled`,
      }),
    ]),
    createElement("div", { className: "system-fate-ruler__track" }, [
      ...markers.map((item) =>
        createElement("span", {
          className: `system-fate-ruler__marker system-fate-ruler__marker--${markerTone(item)}`,
          attrs: {
            style: markerStyle(item, maxAge),
            title: `${item.label} near ${formatSystemFateTiming(item.timeGyr)}`,
          },
        }),
      ),
      current == null
        ? null
        : createElement("span", {
            className: "system-fate-ruler__now",
            attrs: { style: `--fate-now:${current.toFixed(3)}%`, title: "Current model age" },
          }),
      selected == null
        ? null
        : createElement("span", {
            className: "system-fate-ruler__selected",
            attrs: {
              style: `--fate-selected:${selected.toFixed(3)}%`,
              title: "Selected preview age",
            },
          }),
    ]),
    createElement(
      "div",
      { className: "system-fate-ruler__labels" },
      markers.slice(0, 7).map((item) =>
        createElement("span", {
          text: `${item.label} ${formatSystemFateTiming(item.timeGyr)}`,
        }),
      ),
    ),
  ]);
}

function createLaneTrack(lane, timeline) {
  const maxAge = Number(timeline?.maxAgeGyr) || 1;
  const segments = Array.isArray(lane?.segments) ? lane.segments : [];
  const markers = Array.isArray(lane?.markers) ? lane.markers : [];
  return createElement(
    "div",
    {
      className: "system-fate-lane__track",
      attrs: {
        role: "img",
        "aria-label": lane.ariaLabel || `${lane.label} fate timeline`,
      },
    },
    [
      segments.length
        ? null
        : createElement("span", {
            className: "system-fate-lane__empty-track",
            text: "No HZ window",
          }),
      ...segments.map((segment) =>
        createElement("span", {
          className: `system-fate-lane__segment system-fate-lane__segment--${segment.kind}`,
          attrs: {
            style: segmentStyle(segment, maxAge),
            title: `${segment.label}: ${formatSystemFateTiming(
              segment.startGyr,
            )}-${formatSystemFateTiming(segment.endGyr)}`,
          },
        }),
      ),
      ...markers.map((item) =>
        createElement("span", {
          className: `system-fate-lane__marker system-fate-lane__marker--${markerTone(item)}`,
          attrs: {
            style: markerStyle(item, maxAge),
            title: `${item.label} near ${formatSystemFateTiming(item.timeGyr)}`,
          },
        }),
      ),
    ],
  );
}

function createLane(lane, timeline, selectedLaneId) {
  const selected = lane.id === selectedLaneId;
  return createElement(
    "button",
    {
      className: `system-fate-lane${selected ? " is-selected" : ""}`,
      attrs: {
        type: "button",
        "aria-pressed": selected ? "true" : "false",
      },
      dataset: { fateLane: lane.id },
    },
    [
      createElement("span", { className: "system-fate-lane__summary" }, [
        createElement("span", { className: "system-fate-lane__name", text: lane.label }),
        createElement("span", {
          className: "system-fate-lane__meta",
          text: [
            lane.family,
            lane.parentLabel ? `parent: ${lane.parentLabel}` : formatSystemFateAu(lane.orbitAu),
          ]
            .filter(Boolean)
            .join(" | "),
        }),
      ]),
      createElement("span", { className: "system-fate-lane__chips" }, [
        makeChip(lane.currentStatusLabel, lane.currentStatus),
        makeChip(`${lane.confidence} confidence`, lane.confidence),
      ]),
      createLaneTrack(lane, timeline),
    ],
  );
}

function createOverview(timeline) {
  return createElement("section", { className: "system-fate-overview" }, [
    createElement("div", { className: "system-fate-overview__copy" }, [
      createElement("h2", { text: timeline.headline || "System fate" }),
      createElement("p", { text: timeline.summary || "No system fate summary available." }),
    ]),
    createElement("div", { className: "system-fate-overview__metrics" }, [
      makeMetric("Best current", timeline.spotlight?.bestCurrentCandidateLabel || "None", "good"),
      makeMetric("Future thaw", timeline.spotlight?.bestFutureCandidateLabel || "None", "info"),
      makeMetric("Longest window", timeline.spotlight?.longestStableLabel || "None", "neutral"),
      makeMetric("Largest risk", timeline.spotlight?.largestRiskLabel || "None", "warn"),
      makeMetric("Endpoint", timeline.spotlight?.remnantSummary || "Unknown", "caution"),
    ]),
  ]);
}

function createControls({ pageModel, state, timeline }) {
  const hostOptions = (pageModel?.hostFrameOptions || []).map((option) => ({
    id: option.id,
    label: option.label,
  }));
  const filterOptions = Object.entries(FILTER_LABELS).map(([id, label]) => ({ id, label }));
  const sortOptions = Object.entries(SORT_LABELS).map(([id, label]) => ({ id, label }));
  return createElement("div", { className: "system-fate-controls" }, [
    createViewTabs(state.view),
    createElement("div", { className: "system-fate-controls__row" }, [
      hostOptions.length > 1
        ? createSelect("Host frame", "hostFrame", hostOptions, pageModel.selectedHostFrameId)
        : null,
      createSelect("Filter", "filter", filterOptions, selectedValue(state.filter, "all")),
      createSelect("Sort", "sort", sortOptions, selectedValue(state.sort, "orbit")),
      createElement("label", { className: "system-fate-control system-fate-control--age" }, [
        createElement("span", {}, [
          createElement("span", { text: "Age preview" }),
          tipIconNode(SYSTEM_FATE_TIPS.agePreview),
        ]),
        createElement("input", {
          attrs: {
            type: "range",
            min: "0",
            max: String(Math.max(0.1, Number(timeline.maxAgeGyr) || 1)),
            step: "0.01",
            value: String(timeline.selectedAge?.ageGyr ?? timeline.currentAgeGyr ?? 0),
          },
          dataset: { fateControl: "selectedAge" },
        }),
      ]),
    ]),
  ]);
}

function createTimelineView(timeline, state) {
  const filtered = sortLanes(filterLanes(timeline.lanes || [], state.filter), state.sort);
  return createElement(
    "section",
    { className: "system-fate-section system-fate-section--timeline" },
    [
      createLifecycleRuler(timeline),
      createElement(
        "div",
        { className: "system-fate-lanes" },
        filtered.length
          ? filtered.map((lane) => createLane(lane, timeline, state.selectedLaneId))
          : [
              createElement("div", {
                className: "system-fate-empty",
                text: "No lanes match the current filters.",
              }),
            ],
      ),
    ],
  );
}

function laneNames(timeline, ids) {
  const byId = laneById(timeline);
  return (Array.isArray(ids) ? ids : [])
    .map((id) => byId.get(id)?.label)
    .filter(Boolean)
    .join(", ");
}

function createSelectedAge(timeline) {
  const selected = timeline.selectedAge || {};
  return createElement("section", { className: "system-fate-selected-age" }, [
    createElement("div", { className: "system-fate-selected-age__header" }, [
      headingWithTip("h2", `At ${selected.label || "selected age"}`, SYSTEM_FATE_TIPS.agePreview),
      createElement("span", {
        text: selected.hostStage?.label || "Lifecycle stage unavailable",
      }),
    ]),
    createElement("div", { className: "system-fate-selected-age__grid" }, [
      makeMetric("Luminosity", formatNumberWithUnit(selected.luminosityLsol, " Lsol"), "neutral"),
      makeMetric("Radius", formatNumberWithUnit(selected.radiusRsol, " Rsol"), "neutral"),
      makeMetric("Temperature", formatNumberWithUnit(selected.tempK, " K", 0), "neutral"),
      makeMetric(
        "Conservative HZ",
        `${formatSystemFateAu(
          selected.habitableZoneAu?.conservativeInner,
        )}-${formatSystemFateAu(selected.habitableZoneAu?.conservativeOuter)}`,
        "good",
      ),
    ]),
    createElement("div", { className: "system-fate-selected-age__lists" }, [
      createAgeList("Inside conservative HZ", laneNames(timeline, selected.activeLaneIds)),
      createAgeList("Inside optimistic HZ", laneNames(timeline, selected.optimisticLaneIds)),
      createAgeList("Too hot", laneNames(timeline, selected.hotLaneIds)),
      createAgeList("Cold", laneNames(timeline, selected.coldLaneIds)),
      createAgeList("Active warnings", laneNames(timeline, selected.warningLaneIds)),
    ]),
    createElement(
      "ul",
      { className: "system-fate-warning-list" },
      (selected.caveats || []).map((caveat) => createElement("li", { text: caveat })),
    ),
  ]);
}

function formatNumberWithUnit(value, unit, decimals = 2) {
  const number = finiteOrNull(value);
  if (number == null) return "n/a";
  return `${number.toFixed(decimals)}${unit}`;
}

function createAgeList(label, value) {
  return createElement("div", { className: "system-fate-age-list" }, [
    createElement("b", { text: label }),
    createElement("span", { text: value || "None" }),
  ]);
}

function rankingReason(lane, groupKey) {
  if (!lane) return "";
  if (groupKey === "highRisks") {
    return lane.markers?.[0]
      ? `${lane.markers[0].label} near ${formatSystemFateTiming(lane.markers[0].timeGyr)}`
      : "Risk marker";
  }
  if (groupKey === "futureCandidates") return `Future score ${lane.futurePotential}`;
  if (groupKey === "longestStable") {
    const longest = Math.max(
      0,
      ...lane.segments
        .filter((segment) => segment.kind === "conservative-hz")
        .map((segment) => Number(segment.durationGyr) || 0),
    );
    return `${formatSystemFateTiming(longest)} continuous conservative HZ`;
  }
  if (groupKey === "notEvaluated") return "Missing finite lifecycle exposure";
  return lane.details?.[0]?.value || `Current score ${lane.currentPotential}`;
}

function createRankingGroup(timeline, groupKey) {
  const ids = timeline.rankings?.[groupKey] || [];
  const byId = laneById(timeline);
  const label = RANKING_LABELS[groupKey] || groupKey;
  const tip =
    groupKey === "currentCandidates" || groupKey === "moonCandidates" ? PROMISING_WORLDS_TIP : "";
  return createElement("section", { className: "system-fate-ranking" }, [
    headingWithTip("h3", label, tip),
    ids.length
      ? createElement(
          "ol",
          {},
          ids.slice(0, 8).map((id) => {
            const lane = byId.get(id);
            return createElement("li", {}, [
              createElement("button", {
                attrs: { type: "button" },
                dataset: { fateLane: id },
                text: lane?.label || id,
              }),
              createElement("span", { text: rankingReason(lane, groupKey) }),
              lane ? makeChip(lane.confidence, lane.confidence) : null,
            ]);
          }),
        )
      : createElement("p", { className: "hint", text: "None in this host frame." }),
  ]);
}

function createRankings(timeline) {
  return createElement("div", { className: "system-fate-rankings" }, [
    headingWithTip("h2", "Rankings", SYSTEM_FATE_TIPS.rankings),
    createRankingGroup(timeline, "currentCandidates"),
    createRankingGroup(timeline, "futureCandidates"),
    createRankingGroup(timeline, "longestStable"),
    createRankingGroup(timeline, "moonCandidates"),
    createRankingGroup(timeline, "highRisks"),
    createRankingGroup(timeline, "notEvaluated"),
  ]);
}

function createLifecycleView(timeline, state) {
  const filtered = sortLanes(filterLanes(timeline.lanes || [], state.filter), state.sort);
  return createElement("section", { className: "system-fate-lifecycle" }, [
    headingWithTip(
      "h2",
      "System Lifecycle",
      structuredTip({
        overview: "A compact birth-to-endpoint read for each evaluated world, moon, or giant.",
        drawnFrom: "Each object's lifecycle timeline plus host-frame stellar exposure markers.",
        interpretAs:
          "Compare origin, present era, next transition, and endpoint without opening each page.",
        caveat:
          "Endpoints are broad analytic context, not full future climate, impact, or orbital integrations.",
        references: "See Science & Maths: lifecycle timelines.",
      }),
    ),
    filtered.length
      ? createElement(
          "div",
          { className: "system-fate-lifecycle__rows" },
          filtered.map((lane) =>
            createElement(
              "button",
              {
                className: "system-fate-lifecycle-row",
                attrs: { type: "button" },
                dataset: { fateLane: lane.id },
              },
              [
                createElement("span", { className: "system-fate-lifecycle-row__name" }, [
                  createElement("b", { text: lane.label }),
                  createElement("span", {
                    text: [lane.family, lane.parentLabel ? `parent: ${lane.parentLabel}` : ""]
                      .filter(Boolean)
                      .join(" | "),
                  }),
                ]),
                createLifecycleCell("Origin", lane.originLabel || "Unresolved"),
                createLifecycleCell(
                  "Current",
                  lane.currentLifecycleLabel || lane.currentStatusLabel,
                ),
                createLifecycleCell("Next", lane.nextTransitionLabel || "No resolved transition"),
                createLifecycleCell(
                  "Endpoint",
                  lane.endpointLabel || "Endpoint unresolved",
                  lane.endpointTimingLabel || "",
                ),
                createElement("span", { className: "system-fate-lifecycle-row__chips" }, [
                  makeChip(
                    `${lane.endpointConfidence || lane.confidence} endpoint`,
                    lane.endpointConfidence || lane.confidence,
                  ),
                  lane.accuracyTier ? makeChip(lane.accuracyTier, "neutral") : null,
                ]),
              ],
            ),
          ),
        )
      : createElement("p", { className: "system-fate-empty", text: "No lifecycle rows match." }),
  ]);
}

function createLifecycleCell(label, value, meta = "") {
  return createElement("span", { className: "system-fate-lifecycle-cell" }, [
    createElement("span", { text: label }),
    createElement("b", { text: value }),
    meta ? createElement("small", { text: meta }) : null,
  ]);
}

function createDrilldown(timeline, selectedLaneId) {
  const byId = laneById(timeline);
  const lane =
    byId.get(selectedLaneId) ||
    byId.get(timeline.spotlight?.bestCurrentCandidateLaneId) ||
    timeline.lanes?.[0] ||
    null;
  if (!lane) {
    return createElement("section", { className: "system-fate-drilldown system-fate-empty" }, [
      createElement("h2", { text: "Body Drilldown" }),
      createElement("p", { text: "No body lane is available for this host frame." }),
    ]);
  }
  return createElement("section", { className: "system-fate-drilldown" }, [
    createElement("div", { className: "system-fate-drilldown__header" }, [
      createElement("h2", { text: lane.label }),
      createElement("div", { className: "system-fate-drilldown__chips" }, [
        makeChip(lane.currentStatusLabel, lane.currentStatus),
        makeChip(`${lane.confidence} confidence`, lane.confidence),
      ]),
    ]),
    createElement(
      "dl",
      { className: "system-fate-detail-list" },
      (lane.details || []).flatMap((detail) => [
        createElement("dt", { text: detail.label }),
        createElement("dd", { text: detail.value }),
      ]),
    ),
    lane.warnings?.length
      ? createElement(
          "ul",
          { className: "system-fate-warning-list" },
          lane.warnings.map((warning) => createElement("li", { text: warning })),
        )
      : null,
    createElement("div", { className: "system-fate-drilldown__actions" }, [
      createElement("a", {
        className: "small",
        attrs: {
          href:
            lane.kind === "moon" ? "#/moon" : lane.kind === "gasGiant" ? "#/planet" : "#/planet",
        },
        text: lane.kind === "moon" ? "Open Moon Page" : "Open Body Page",
      }),
    ]),
  ]);
}

function createReport(timeline, copyStatus = "") {
  return createElement("section", { className: "system-fate-report" }, [
    createElement("div", { className: "system-fate-report__header" }, [
      headingWithTip("h2", "Shareable Report", SYSTEM_FATE_TIPS.report),
      createElement("div", { className: "button-row" }, [
        createElement("button", {
          attrs: { type: "button" },
          dataset: { fateCopy: "compact" },
          text: "Copy compact",
        }),
        createElement("button", {
          attrs: { type: "button" },
          dataset: { fateCopy: "markdown" },
          text: "Copy report",
        }),
      ]),
    ]),
    createElement(
      "div",
      { className: "system-fate-report__body" },
      (timeline.report?.lines || []).map((line) => createElement("p", { text: line })),
    ),
    copyStatus ? createElement("p", { className: "hint", text: copyStatus }) : null,
  ]);
}

function createWarnings(timeline) {
  const warnings = Array.isArray(timeline?.warnings) ? timeline.warnings : [];
  if (!warnings.length) return null;
  return createElement(
    "ul",
    { className: "system-fate-warning-list system-fate-warning-list--page" },
    warnings.map((warning) => createElement("li", { text: warning })),
  );
}

function createActiveView(timeline, state) {
  if (state.view === "age") return createSelectedAge(timeline);
  if (state.view === "lifecycle") {
    return createElement("div", { className: "system-fate-main-grid" }, [
      createLifecycleView(timeline, state),
      createDrilldown(timeline, state.selectedLaneId),
    ]);
  }
  if (state.view === "rankings") return createRankings(timeline);
  if (state.view === "report") return createReport(timeline, state.copyStatus);
  if (state.view === "timeline") {
    return createElement("div", { className: "system-fate-main-grid" }, [
      createTimelineView(timeline, state),
      createDrilldown(timeline, state.selectedLaneId),
    ]);
  }
  return createElement("div", { className: "system-fate-main-grid" }, [
    createElement("div", { className: "system-fate-main-grid__primary" }, [
      createOverview(timeline),
      createTimelineView(timeline, state),
    ]),
    createElement("div", { className: "system-fate-main-grid__side" }, [
      createSelectedAge(timeline),
      createRankings(timeline),
      createDrilldown(timeline, state.selectedLaneId),
    ]),
  ]);
}

export function createSystemFateTimelineSummary(timeline) {
  return createOverview(timeline || {});
}

export function createSystemFateTimelinePanel(timeline, options = {}) {
  const state = {
    view: "overview",
    filter: "all",
    sort: "orbit",
    selectedLaneId:
      timeline?.spotlight?.bestCurrentCandidateLaneId || timeline?.lanes?.[0]?.id || "",
    copyStatus: "",
    ...(options.state || {}),
  };
  const pageModel = options.pageModel || {};
  return createElement("div", { className: "system-fate" }, [
    createElement("section", { className: "system-fate-hero" }, [
      createElement("div", {}, [
        createElement("div", {
          className: "system-fate-hero__eyebrow",
          text: `${timeline?.hostFrameLabel || "Host frame"} | ${
            timeline?.selectedAge?.hostStage?.label || "Lifecycle track"
          }`,
        }),
        headingWithTip("h2", timeline?.headline || "System fate unavailable", PROMISING_WORLDS_TIP),
        createElement("p", { text: timeline?.summary || "No system fate data is available." }),
      ]),
      createElement("div", { className: "system-fate-hero__chips" }, [
        makeChip(
          `${timeline?.counts?.currentCandidates || 0} current`,
          "good",
          SYSTEM_FATE_TIPS.current,
        ),
        makeChip(
          `${timeline?.counts?.futureCandidates || 0} future`,
          "info",
          SYSTEM_FATE_TIPS.future,
        ),
        makeChip(`${timeline?.counts?.majorRisks || 0} risks`, "warn", SYSTEM_FATE_TIPS.risks),
        makeChip(
          `${timeline?.confidence || "unknown"} confidence`,
          timeline?.confidence || "neutral",
          SYSTEM_FATE_TIPS.confidence,
        ),
      ]),
    ]),
    createControls({ pageModel, state, timeline: timeline || {} }),
    createActiveView(timeline || {}, state),
    createWarnings(timeline || {}),
  ]);
}

export function createSystemFateReport(timeline, options = {}) {
  return createReport(timeline || {}, options.copyStatus || "");
}

export function createSystemFateRankings(timeline) {
  return createRankings(timeline || {});
}
