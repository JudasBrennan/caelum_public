import { formatEraTiming } from "../engine/planetaryEraTimeline.js";
import { createElement } from "./domHelpers.js";
import { tipIconNode } from "./tooltip.js";
import { structuredTip } from "./tooltipCopy.js";

const STATE_LABELS = {
  past: "Past",
  current: "Current",
  future: "Future",
  conditional: "Conditional",
};

const CONFIDENCE_LABELS = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const ROLE_LABELS = {
  birth: "Birth",
  early: "Early",
  current: "Current",
  transition: "Next",
  risk: "Risk",
  endpoint: "Endpoint",
};

const CATEGORY_LABELS = {
  formation: "Formation",
  interior: "Interior",
  atmosphere: "Atmosphere",
  envelope: "Envelope",
  hydrosphere: "Hydrosphere",
  climate: "Climate",
  habitability: "Habitability",
  orbital: "Orbital",
  radiation: "Radiation",
  stellar: "Stellar",
  remnant: "Remnant",
  substellar: "Substellar",
  reference: "Reference",
};

const ERA_TIMELINE_TIP = structuredTip({
  overview:
    "A chronological summary of the major past, current, and future eras for the solved body or star.",
  drawnFrom:
    "The solved model's era timeline object, including age, category, state, confidence, drivers, warnings, and future summaries.",
  interpretAs:
    "Use it to see why the current state is highlighted and which later windows or risks are expected.",
  caveat:
    "Era timelines are analytic summaries. They do not replace full climate integrations, N-body histories, or detailed stellar-structure simulations.",
  references: "See Science & Maths for the source model behind each page's timeline.",
});

const ERA_TRACK_TIP = structuredTip({
  overview: "A compressed visual ruler for the timeline eras.",
  drawnFrom:
    "Era start/end ages, current model age, and the maximum sampled age for this timeline.",
  interpretAs:
    "Segments show approximate era windows; the vertical marker shows the current solved age.",
  caveat: "Open the era cards below the track for drivers, warnings, and model limits.",
});

const STATE_TIPS = Object.freeze({
  past: structuredTip({
    overview: "This era is earlier than the current solved age.",
    drawnFrom: "The era state and age window in the solved timeline.",
    interpretAs:
      "Past eras provide context for how the current body or star reached its present state.",
  }),
  current: structuredTip({
    overview: "This era is active at the current solved age.",
    drawnFrom: "The timeline's current age and current-era selection.",
    interpretAs: "Current eras are opened by default because they explain the present model state.",
  }),
  future: structuredTip({
    overview: "This era lies after the current solved age.",
    drawnFrom: "Projected era windows from the page's analytic model.",
    interpretAs: "Future eras are broad forecast windows, not exact event predictions.",
    caveat: "Inspect warnings for model limits before treating a future window as precise.",
  }),
  conditional: structuredTip({
    overview: "This era depends on a model condition or threshold rather than a guaranteed event.",
    drawnFrom: "Conditional markers, thresholds, and caveats in the solved timeline.",
    interpretAs: "Read this as a risk or possibility that depends on the current inputs.",
  }),
});

const CONFIDENCE_TIP = structuredTip({
  overview: "A confidence label for this timeline or era.",
  drawnFrom: "Input completeness, model applicability, calibration range, and timeline caveats.",
  interpretAs:
    "Lower confidence means the app is leaning harder on approximations or missing context.",
  caveat: "Confidence is a model-readiness label, not a probability that the era will occur.",
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeText(value, fallback = "") {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function safeNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeTimeline(timeline) {
  if (!isObject(timeline)) return null;
  const eras = Array.isArray(timeline.eras) ? timeline.eras.filter(isObject) : [];
  if (!eras.length && !safeText(timeline.summary)) return null;
  return { ...timeline, eras };
}

function makeChip(kind, value, fallback = "Unknown") {
  const key = safeText(value, "unknown").toLowerCase();
  const label =
    kind === "confidence"
      ? CONFIDENCE_LABELS[key] || fallback
      : STATE_LABELS[key] || safeText(value, fallback);
  const tip = kind === "confidence" ? CONFIDENCE_TIP : STATE_TIPS[key] || "";
  return createElement("span", {
    className: `era-timeline__chip era-timeline__chip--${kind} era-timeline__chip--${key}`,
    attrs: tip ? { tabindex: "0", "data-tip": tip } : {},
    text: label,
  });
}

function makeRoleChip(value) {
  const key = safeText(value).toLowerCase();
  if (!key || !ROLE_LABELS[key]) return null;
  return createElement("span", {
    className: `era-timeline__chip era-timeline__chip--role era-timeline__chip--role-${key}`,
    text: ROLE_LABELS[key],
  });
}

function categoryLabel(category) {
  const key = safeText(category, "reference");
  return CATEGORY_LABELS[key] || key.replace(/[-_]+/g, " ");
}

function eraSortValue(era, fallbackIndex) {
  const start = safeNumber(era.startGyr, null);
  const end = safeNumber(era.endGyr, null);
  return {
    start: start == null ? 1_000_000 + fallbackIndex : start,
    end: end == null ? 1_000_000 + fallbackIndex : end,
  };
}

function sortedEras(eras) {
  return [...eras].sort((a, b) => {
    const aa = eraSortValue(a, eras.indexOf(a));
    const bb = eraSortValue(b, eras.indexOf(b));
    return (
      aa.start - bb.start || aa.end - bb.end || safeText(a.label).localeCompare(safeText(b.label))
    );
  });
}

function currentEraFor(timeline, eras) {
  return (
    eras.find((era) => safeText(era.id) === safeText(timeline.currentEraId)) ||
    eras.find((era) => safeText(era.state) === "current") ||
    null
  );
}

function timelineMaxGyr(timeline, eras) {
  const values = [
    safeNumber(timeline.maxAgeGyr, null),
    safeNumber(timeline.currentAgeGyr, null),
    ...eras.flatMap((era) => [safeNumber(era.startGyr, null), safeNumber(era.endGyr, null)]),
  ].filter((value) => value != null && value >= 0);
  const max = Math.max(0.1, ...values);
  return max > 0 ? max : 1;
}

function pct(value, max) {
  const number = safeNumber(value, null);
  if (number == null || max <= 0) return null;
  return Math.max(0, Math.min(100, (number / max) * 100));
}

function segmentStyle(era, maxGyr) {
  const startPct = pct(era.startGyr, maxGyr) ?? 0;
  const endPct = pct(era.endGyr, maxGyr);
  const widthPct =
    endPct == null ? Math.max(8, 100 - startPct) : Math.max(6, Math.min(100, endPct - startPct));
  return `--era-start:${startPct.toFixed(2)}%;--era-width:${widthPct.toFixed(2)}%`;
}

function createTimelineTrack(timeline, eras) {
  if (!eras.length) return null;
  const maxGyr = timelineMaxGyr(timeline, eras);
  const currentPct = pct(timeline.currentAgeGyr, maxGyr);
  return createElement("div", { className: "era-timeline__track-wrap" }, [
    createElement(
      "div",
      {
        className: "era-timeline__track",
        attrs: {
          role: "img",
          "aria-label": "Chronological era timeline",
          tabindex: "0",
          "data-tip": ERA_TRACK_TIP,
        },
      },
      [
        ...eras.map((era) =>
          createElement(
            "span",
            {
              className: `era-timeline__segment era-timeline__segment--${safeText(
                era.category,
                "reference",
              )} era-timeline__segment--${safeText(era.state, "conditional")}`,
              attrs: { style: segmentStyle(era, maxGyr), title: safeText(era.label, "Era") },
            },
            [createElement("span", { text: safeText(era.label, "Era") })],
          ),
        ),
        currentPct == null
          ? null
          : createElement("span", {
              className: "era-timeline__marker",
              attrs: {
                style: `--era-current:${currentPct.toFixed(2)}%`,
                title: "Current model age",
              },
            }),
      ],
    ),
    createElement("div", { className: "era-timeline__scale" }, [
      createElement("span", { text: "Formation" }),
      createElement("span", {
        text:
          safeNumber(timeline.currentAgeGyr, null) == null
            ? "Current age unknown"
            : `${safeNumber(timeline.currentAgeGyr, 0).toFixed(2)} Gyr`,
      }),
    ]),
  ]);
}

function createEraTip(era) {
  return structuredTip({
    overview: `${safeText(era.label, safeText(era.headline, "Era"))} is a ${categoryLabel(
      era.category,
    ).toLowerCase()} era in this timeline.`,
    drawnFrom: `Timeline state ${safeText(era.state, "unknown")}, window ${formatEraTiming(
      era,
    )}, confidence ${safeText(era.confidence, "unknown")}, and listed drivers/warnings.`,
    interpretAs:
      safeText(era.state) === "current"
        ? "This card explains the model's current highlighted phase."
        : "Open this card to inspect the drivers and warnings behind the timeline placement.",
    caveat:
      "The era card is a compact model summary; use the detailed page outputs and Science & Maths for full formula context.",
  });
}

function createDriverList(drivers = []) {
  const normalized = (Array.isArray(drivers) ? drivers : []).filter(isObject);
  if (!normalized.length) return null;
  return createElement("ul", { className: "era-timeline__drivers" }, [
    ...normalized.map((driver) =>
      createElement("li", {}, [
        createElement("b", { text: safeText(driver.label || driver.key, "Driver") }),
        safeText(driver.value) ? `: ${safeText(driver.value)}` : "",
        safeText(driver.effect) ? ` - ${safeText(driver.effect)}` : "",
      ]),
    ),
  ]);
}

function warningText(warning) {
  if (isObject(warning)) {
    return safeText(warning.message || warning.text || warning.label || warning.code);
  }
  return safeText(warning);
}

function createWarningList(era) {
  const warnings = [
    ...(Array.isArray(era?.warnings) ? era.warnings : []),
    ...(Array.isArray(era?.caveats) ? era.caveats : []),
    ...(Array.isArray(era?.warningMessages) ? era.warningMessages : []),
  ]
    .map(warningText)
    .filter(Boolean);
  if (!warnings.length) return null;
  return createElement(
    "ul",
    {
      className: "era-timeline__warnings",
      attrs: { "aria-label": "Model limits and warnings" },
    },
    warnings.map((warning) =>
      createElement("li", {}, [
        createElement("b", { className: "era-timeline__warning-label", text: "Limit: " }),
        warning,
      ]),
    ),
  );
}

function createEraItem(era, isCurrent) {
  const isEndpoint = safeText(era.lifecycleRole) === "endpoint" || era.endpointCandidate === true;
  return createElement(
    "details",
    {
      className: `era-timeline__item${isCurrent ? " era-timeline__item--current" : ""}${
        isEndpoint ? " era-timeline__item--endpoint" : ""
      }`,
      attrs: isCurrent || isEndpoint ? { open: "" } : {},
    },
    [
      createElement("summary", { className: "era-timeline__item-summary" }, [
        createElement(
          "span",
          {
            className: "era-timeline__item-main",
            attrs: { "data-tip": createEraTip(era) },
          },
          [
            createElement("span", {
              className: "era-timeline__item-title",
              text: safeText(era.label, safeText(era.headline, "Era")),
            }),
            createElement("span", {
              className: "era-timeline__item-meta",
              text: `${categoryLabel(era.category)} | ${formatEraTiming(era)}`,
            }),
          ],
        ),
        createElement("span", { className: "era-timeline__item-chips" }, [
          makeRoleChip(era.lifecycleRole),
          makeChip("state", era.state, "State unknown"),
          makeChip("confidence", era.confidence, "Confidence unknown"),
        ]),
      ]),
      createElement("div", { className: "era-timeline__item-body" }, [
        safeText(era.headline)
          ? createElement("div", { className: "era-timeline__headline", text: era.headline })
          : null,
        safeText(era.detail)
          ? createElement("p", { className: "era-timeline__detail", text: era.detail })
          : null,
        createWarningList(era),
        createDriverList(era.drivers),
      ]),
    ],
  );
}

function groupErasForDisplay(eras = []) {
  return [
    { id: "past", label: "Past", eras: eras.filter((era) => era.state === "past") },
    { id: "current", label: "Current", eras: eras.filter((era) => era.state === "current") },
    {
      id: "future",
      label: "Future / Risks",
      eras: eras.filter((era) => era.state === "future" || era.state === "conditional"),
    },
  ].filter((group) => group.eras.length);
}

function createEraGroups(eras, currentEra) {
  const groupTips = {
    past: STATE_TIPS.past,
    current: STATE_TIPS.current,
    future: structuredTip({
      overview:
        "Future / Risks groups forecast windows and conditional warnings after the current age.",
      drawnFrom: "Future and conditional era cards in the solved timeline.",
      interpretAs:
        "Use this group to inspect likely next stages and the major caveats attached to them.",
      caveat:
        "Risk labels are bounded warnings. They are not full event simulations or precise survival forecasts.",
    }),
  };
  return groupErasForDisplay(eras).map((group) =>
    createElement("div", { className: `era-timeline__group era-timeline__group--${group.id}` }, [
      createElement("h5", { className: "era-timeline__group-title" }, [
        createElement("span", { text: group.label }),
        tipIconNode(groupTips[group.id]),
      ]),
      ...group.eras.map((era) => createEraItem(era, era === currentEra)),
    ]),
  );
}

export function createEraTimelineSummary(timeline, options = {}) {
  const normalized = normalizeTimeline(timeline);
  if (!normalized) {
    if (!options.showUnavailable) return null;
    return createElement("div", { className: "era-timeline-summary era-timeline-summary--empty" }, [
      createElement("span", { text: options.unavailableText || "Era timeline unavailable" }),
    ]);
  }
  const eras = sortedEras(normalized.eras);
  const currentEra = currentEraFor(normalized, eras);
  return createElement("div", { className: "era-timeline-summary" }, [
    createElement("span", {
      className: "era-timeline-summary__text",
      text: safeText(normalized.summary, currentEra?.label || "Era timeline"),
    }),
    currentEra ? makeChip("state", currentEra.state, "Current") : null,
    makeChip("confidence", normalized.confidence || currentEra?.confidence, "Confidence unknown"),
  ]);
}

export function createEraTimelinePanel(timeline, options = {}) {
  const normalized = normalizeTimeline(timeline);
  if (!normalized) {
    if (!options.showUnavailable) return null;
    return createElement("div", { className: "era-timeline era-timeline--empty" }, [
      createElement("div", {
        className: "era-timeline__summary",
        text: options.unavailableText || "Era timeline unavailable for this solved model.",
      }),
    ]);
  }

  const eras = sortedEras(normalized.eras);
  const currentEra = currentEraFor(normalized, eras);

  return createElement("section", { className: "era-timeline" }, [
    createElement("div", { className: "era-timeline__header" }, [
      createElement("div", {}, [
        createElement("div", {
          className: "era-timeline__eyebrow",
          text: options.eyebrow || "Derived chronology",
        }),
        createElement("h4", { className: "era-timeline__title" }, [
          createElement("span", { text: options.title || "Era Timeline" }),
          tipIconNode(ERA_TIMELINE_TIP),
        ]),
        safeText(options.subtitle || normalized.subtitle)
          ? createElement("p", {
              className: "era-timeline__subtitle",
              text: safeText(options.subtitle || normalized.subtitle),
            })
          : null,
      ]),
      createElement("div", { className: "era-timeline__header-chips" }, [
        currentEra ? makeChip("state", currentEra.state, "Current") : null,
        makeChip(
          "confidence",
          normalized.confidence || currentEra?.confidence,
          "Confidence unknown",
        ),
      ]),
    ]),
    createElement("div", {
      className: "era-timeline__summary",
      text: safeText(normalized.summary, currentEra?.label || "Timeline available"),
    }),
    safeText(normalized.futureSummary)
      ? createElement("div", {
          className: "era-timeline__future",
          text: normalized.futureSummary,
        })
      : null,
    Array.isArray(normalized.unsupportedPhysics) && normalized.unsupportedPhysics.length
      ? createElement("div", { className: "era-timeline__limits" }, [
          createElement("b", { text: "Model limits" }),
          createElement("span", {
            text: normalized.unsupportedPhysics.slice(0, 4).join(" "),
          }),
        ])
      : null,
    createTimelineTrack(normalized, eras),
    createElement("div", { className: "era-timeline__list" }, createEraGroups(eras, currentEra)),
  ]);
}

export function createEraTimelineSection(timeline, options = {}) {
  const normalized = normalizeTimeline(timeline);
  if (!normalized && !options.showUnavailable) return null;
  const eras = normalized ? sortedEras(normalized.eras) : [];
  const currentEra = normalized ? currentEraFor(normalized, eras) : null;
  const panel = createEraTimelinePanel(normalized || timeline, {
    showUnavailable: options.showUnavailable,
    unavailableText: options.unavailableText,
    eyebrow: options.eyebrow || "Derived chronology",
    title: options.panelTitle || currentEra?.label || "Era Timeline",
    subtitle: options.subtitle,
  });
  if (!panel) return null;
  return createElement(
    "section",
    {
      className: "kpi-section kpi-section--era-timeline",
      attrs: options.id ? { id: options.id } : {},
    },
    [
      createElement("div", { className: "kpi-section__header" }, [
        createElement("h3", {
          className: "kpi-section__title",
          text: options.title || "Era Timeline",
        }),
        tipIconNode(ERA_TIMELINE_TIP),
      ]),
      panel,
    ],
  );
}
