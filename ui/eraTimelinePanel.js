import { formatEraTiming } from "../engine/planetaryEraTimeline.js";
import { createElement } from "./domHelpers.js";

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
  substellar: "Substellar",
  reference: "Reference",
};

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
  return createElement("span", {
    className: `era-timeline__chip era-timeline__chip--${kind} era-timeline__chip--${key}`,
    text: label,
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
        attrs: { role: "img", "aria-label": "Chronological planetary era timeline" },
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

function createEraItem(era, isCurrent) {
  return createElement(
    "details",
    {
      className: `era-timeline__item${isCurrent ? " era-timeline__item--current" : ""}`,
      attrs: isCurrent ? { open: "" } : {},
    },
    [
      createElement("summary", { className: "era-timeline__item-summary" }, [
        createElement("span", { className: "era-timeline__item-main" }, [
          createElement("span", {
            className: "era-timeline__item-title",
            text: safeText(era.label, safeText(era.headline, "Era")),
          }),
          createElement("span", {
            className: "era-timeline__item-meta",
            text: `${categoryLabel(era.category)} | ${formatEraTiming(era)}`,
          }),
        ]),
        createElement("span", { className: "era-timeline__item-chips" }, [
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
  return groupErasForDisplay(eras).map((group) =>
    createElement("div", { className: `era-timeline__group era-timeline__group--${group.id}` }, [
      createElement("h5", { className: "era-timeline__group-title", text: group.label }),
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
        createElement("h4", {
          className: "era-timeline__title",
          text: options.title || "Era Timeline",
        }),
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
      ]),
      panel,
    ],
  );
}
