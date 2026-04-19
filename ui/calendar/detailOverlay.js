export function createCalendarDetailOverlayActions({ els, render, shiftMonth }) {
  const closeDetail = () => els.detailOverlay.classList.add("is-hidden");
  const openDetail = () => els.detailOverlay.classList.remove("is-hidden");

  function bindDetailOverlayEvents() {
    els.detailPrev.addEventListener("click", () => {
      shiftMonth(-1);
      render();
    });
    els.detailNext.addEventListener("click", () => {
      shiftMonth(1);
      render();
    });
    els.openDetail.addEventListener("click", openDetail);
    els.closeDetail.addEventListener("click", closeDetail);
    els.detailOverlay.addEventListener("click", (event) => {
      if (event.target === els.detailOverlay) closeDetail();
    });
  }

  return {
    bindDetailOverlayEvents,
    closeDetail,
    openDetail,
  };
}

export function renderCalendarMoonLegend({
  node,
  moonDefs,
  moonIconNode,
  tipIconNode,
  fmt,
  replaceChildren,
  createElement,
  tipText,
}) {
  replaceChildren(node, [
    createElement("div", { className: "calendar-moon-legend__title" }, [
      "Moon key ",
      tipIconNode(tipText || ""),
    ]),
    createElement(
      "div",
      { className: "calendar-moon-legend__items" },
      moonDefs.map((moonDef, index) =>
        createElement("span", { className: "calendar-moon-legend__item" }, [
          moonIconNode({ phase: { phaseShort: "F" } }, index),
          " ",
          `${moonDef.name} (${fmt(moonDef.synodicDays, 3)} d)`,
        ]),
      ),
    ),
  ]);
}

export function renderCalendarSelectedDay({
  node,
  selected,
  model,
  yearLabel,
  holidayDetailById,
  trace,
  fmt,
  holidayColorClass,
  holidayCategoryLabel,
  astroIconNode,
  astronomyMarkerLabel,
  cycleIconNode,
  cycleKindClass,
  moonIconNode,
  createElement,
  replaceChildren,
  selectedDayLine,
  interleaveNodes,
  buildTraceNode,
}) {
  if (!selected) {
    replaceChildren(
      node,
      createElement("div", {
        className: "calendar-selected-day__title",
        text: "No day selected",
      }),
    );
    return;
  }

  const placementLabel =
    selected.kind === "intercalary"
      ? selected.placement === "before-month"
        ? `Before ${selected.anchorMonthName || model.monthName}`
        : selected.placement === "after-month"
          ? `After ${selected.anchorMonthName || model.monthName}`
          : selected.placement === "year-end"
            ? "Year end"
            : "Appended to month"
      : "";
  const flowLabel =
    selected.kind === "intercalary"
      ? selected.advancesWeekdayFlow
        ? "In weekday flow"
        : "Outside weekday flow"
      : "";
  const selectedTitle =
    selected.kind === "intercalary"
      ? `Intercalary Day ${selected.intercalaryDay || 1} of ${selected.intercalaryLength || 1}, ${
          selected.intercalaryName || "Intercalary Period"
        }, ${yearLabel} (Day ${selected.absoluteDay + 1})`
      : `Day ${selected.dayNumber}, ${model.monthName}, ${yearLabel} (Day ${selected.absoluteDay + 1})`;

  const holidayItems = (selected.holidays || []).map((holiday) => {
    const detail = holidayDetailById.get(String(holiday?.id || ""));
    const continuation = detail
      ? [
          detail.continuesFromPrev ? "continues from previous day" : "",
          detail.continuesToNext ? "continues to next day" : "",
        ]
          .filter(Boolean)
          .join(", ")
      : "";
    return createElement(
      "span",
      {
        className: `calendar-selected-day__holiday-item ${holidayColorClass(holiday.colorTag)}`,
      },
      [
        createElement("span", {
          className: "calendar-selected-day__holiday-mark",
          attrs: { "aria-hidden": "true" },
          text: "H",
        }),
        holiday.name,
        " ",
        createElement("span", {
          className: "calendar-selected-day__holiday-cat",
          text: `(${holidayCategoryLabel(holiday.category)}${continuation ? ` | ${continuation}` : ""})`,
        }),
      ],
    );
  });
  const markerItems = (selected.markers || []).map((marker) =>
    createElement("span", { className: "calendar-selected-day__astro-item" }, [
      astroIconNode(marker),
      " ",
      astronomyMarkerLabel(marker),
    ]),
  );
  const cycleItems = (selected.cycles || []).map((cycle) =>
    createElement(
      "span",
      { className: `calendar-selected-day__cycle-item ${cycleKindClass(cycle)}` },
      [
        cycleIconNode(cycle),
        " ",
        createElement("b", { text: cycle.ruleName || "Cycle" }),
        ": ",
        cycle.label || "Marker",
      ],
    ),
  );
  const moonLines = (selected.moonStates || []).map((moonState, index) =>
    createElement(
      "div",
      { className: "calendar-selected-day__line calendar-selected-day__line--moon" },
      [
        moonIconNode(moonState, index),
        " ",
        createElement("b", { text: moonState.name }),
        `: ${moonState.phase.phaseName} (${fmt(moonState.phase.illuminationPct, 1)}%), age ${fmt(
          moonState.phase.ageDays,
          0,
        )} / ${fmt(moonState.synodicDays, 3)} days`,
      ],
    ),
  );
  const traceNode = buildTraceNode(trace);
  replaceChildren(node, [
    createElement("div", {
      className: "calendar-selected-day__title",
      text: selectedTitle,
    }),
    selected.kind === "intercalary"
      ? selectedDayLine(
          "Structure",
          [placementLabel, flowLabel].filter(Boolean).join(" | ") || "Intercalary structure",
        )
      : null,
    moonLines,
    selectedDayLine("Holidays", interleaveNodes(holidayItems)),
    selectedDayLine("Astronomy", interleaveNodes(markerItems)),
    selectedDayLine("Cycles", interleaveNodes(cycleItems)),
    traceNode,
  ]);
}
