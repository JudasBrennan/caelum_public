export function createCalendarMonthViewHelpers({
  TIPS,
  N,
  I,
  clampI,
  createElement,
  phaseClass,
  moonColorClass,
  MOON_COLORS,
  astroIconClass,
  cycleKindClass,
  cycleMarkerTip,
  holidayColorClass,
  astronomyMarkerLabel,
  holidayCategoryLabel,
  intercalaryPlacementLabel,
  intercalaryFlowLabel,
  normalizeAstronomySettings,
  SEASON_MARKER_DEFS,
}) {
  function moonIconNode(moonState, idx) {
    return createElement("span", {
      className: `calendar-moon-icon ${phaseClass(moonState?.phase?.phaseShort)} ${moonColorClass(idx)}`,
      attrs: { "aria-hidden": "true" },
    });
  }

  function astroIconNode(marker) {
    const moonSourceIndex = Number.isFinite(Number(marker?.sourceMoonIndex))
      ? clampI(Number(marker.sourceMoonIndex), 0, MOON_COLORS.length - 1)
      : null;
    return createElement(
      "span",
      { className: "calendar-astro-marker", attrs: { "aria-hidden": "true" } },
      [
        createElement("span", {
          className: `calendar-astro-icon ${astroIconClass(marker?.key)}`,
          attrs: { "aria-hidden": "true" },
        }),
        moonSourceIndex == null
          ? null
          : createElement("span", {
              className: `calendar-astro-source ${moonColorClass(moonSourceIndex)}`,
              attrs: { "aria-hidden": "true" },
            }),
      ],
    );
  }

  function cycleIconNode(cycle) {
    const short = String(cycle?.short || "C")
      .toUpperCase()
      .slice(0, 3);
    return createElement("span", {
      className: `calendar-cycle-marker ${cycleKindClass(cycle)}`,
      attrs: { "aria-hidden": "true" },
      dataset: { tip: cycleMarkerTip(cycle) },
      text: short,
    });
  }

  function selectedDayLine(label, children, className = "calendar-selected-day__line") {
    return createElement("div", { className }, [
      createElement("b", { text: `${label}:` }),
      " ",
      ...(Array.isArray(children) ? children : [children]),
    ]);
  }

  function renderIntercalaryGroups(groups, selectedAbsoluteDay) {
    return (Array.isArray(groups) ? groups : []).map((group) => {
      const heading = `${intercalaryPlacementLabel(group.placement, group.anchorMonthName)} | ${intercalaryFlowLabel(
        group.advancesWeekdayFlow,
      )} | ${group.lengthDays} day${group.lengthDays === 1 ? "" : "s"}`;
      const days = (group.days || []).map((cell) => {
        const classNames = ["calendar-intercalary-day"];
        if (cell.absoluteDay === selectedAbsoluteDay) classNames.push("is-selected");
        if (cell.holidays?.length) classNames.push("has-holiday");
        if (cell.holidays?.length) classNames.push(holidayColorClass(cell.holidays[0]?.colorTag));
        if ((cell.markers || []).length) classNames.push("has-astronomy");
        if ((cell.cycles || []).length) classNames.push("has-cycle");
        const summaryBits = [];
        if (cell.holidays?.length) summaryBits.push(`H${cell.holidays.length}`);
        if ((cell.markers || []).length) summaryBits.push(`A${cell.markers.length}`);
        if ((cell.cycles || []).length) summaryBits.push(`C${cell.cycles.length}`);
        if (!summaryBits.length) {
          summaryBits.push(cell.advancesWeekdayFlow ? "Weekday flow" : "Outside flow");
        }
        const holidayNames = (cell.holidays || []).map((holiday) => holiday.name).join(", ");
        const markerNames = (cell.markers || [])
          .map((marker) => astronomyMarkerLabel(marker))
          .join(", ");
        const cycleNames = (cell.cycles || []).map((cycle) => cycleMarkerTip(cycle)).join(", ");
        const tip = [
          `${cell.intercalaryName} day ${cell.intercalaryDay}/${cell.intercalaryLength}`,
          intercalaryPlacementLabel(cell.placement, cell.anchorMonthName),
          intercalaryFlowLabel(cell.advancesWeekdayFlow),
          holidayNames ? `Holidays: ${holidayNames}` : "",
          markerNames ? `Astronomy: ${markerNames}` : "",
          cycleNames ? `Cycles: ${cycleNames}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
        return createElement(
          "button",
          {
            className: classNames.join(" "),
            attrs: { type: "button" },
            dataset: { calAbsoluteDay: cell.absoluteDay, tip },
          },
          [
            createElement("span", {
              className: "calendar-intercalary-day__num",
              text: String(cell.intercalaryDay),
            }),
            createElement("span", {
              className: "calendar-intercalary-day__label",
              text: cell.intercalaryName,
            }),
            createElement("span", {
              className: "calendar-intercalary-day__meta",
              text: summaryBits.join(" • "),
            }),
          ],
        );
      });
      return createElement(
        "section",
        {
          className:
            `calendar-intercalary-group ${group.advancesWeekdayFlow ? "" : "is-outside-flow"}`.trim(),
        },
        [
          createElement("div", { className: "calendar-intercalary-group__header" }, [
            createElement("b", { text: group.name }),
            createElement("span", {
              className: "calendar-intercalary-group__summary",
              text: heading,
            }),
          ]),
          createElement("div", { className: "calendar-intercalary-group__days" }, days),
        ],
      );
    });
  }

  function detailedGrid(model, selectedAbsoluteDay) {
    const head = [
      createElement("th", { className: "calendar-week-col", text: "Week" }),
      ...(model.headers || []).map((header) => createElement("th", { text: header })),
    ];
    const body = (model.rows || []).map((row) =>
      createElement("tr", {}, [
        createElement("th", { className: "calendar-week-col", text: row.weekName }),
        ...(row.cells || []).map((cell) => {
          if (!cell) return createElement("td", { className: "calendar-cell--empty" });
          if (cell.kind === "festival") {
            const label = cell.festival?.name || "Festival";
            const seq =
              I(cell.festival?.segmentCount, 1) > 1
                ? ` ${I(cell.festival?.segment, 1)}/${I(cell.festival?.segmentCount, 1)}`
                : "";
            const marker = cell.festival?.outsideWeekFlow ? "Outside" : "Festival";
            return createElement("td", {}, [
              createElement(
                "div",
                {
                  className: "calendar-day-btn calendar-day-btn--festival",
                  dataset: { tip: `${label}${seq} (${marker})` },
                },
                [
                  createElement("span", { className: "calendar-day-btn__num", text: "F" }),
                  createElement("span", {
                    className: "calendar-day-btn__phase",
                    text: `${label}${seq}`,
                  }),
                ],
              ),
            ]);
          }
          const classNames = ["calendar-day-btn"];
          if (cell.absoluteDay === selectedAbsoluteDay) classNames.push("is-selected");
          if (cell.holidays.length) classNames.push("has-holiday");
          if (cell.holidays.length) classNames.push(holidayColorClass(cell.holidays[0]?.colorTag));
          if ((cell.markers || []).length) classNames.push("has-astronomy");
          if ((cell.cycles || []).length) classNames.push("has-cycle");
          if (cell.moonStates[0]?.phase?.phaseShort === "F") classNames.push("is-full-moon");
          if (cell.moonStates[0]?.phase?.phaseShort === "N") classNames.push("is-new-moon");
          const markers = Array.isArray(cell.markers) ? cell.markers : [];
          const cycles = Array.isArray(cell.cycles) ? cell.cycles : [];
          const markerNames = markers.map((marker) => astronomyMarkerLabel(marker)).join(", ");
          const cycleNames = cycles.map((cycle) => cycleMarkerTip(cycle)).join(", ");
          const holidayDetails = Array.isArray(cell.holidayDetails) ? cell.holidayDetails : [];
          const hasContinuationFromPrev = holidayDetails.some(
            (detail) => !!detail.continuesFromPrev,
          );
          const hasContinuationToNext = holidayDetails.some((detail) => !!detail.continuesToNext);
          const holidayMarkerText = cell.holidays.length
            ? `${hasContinuationFromPrev ? "←" : ""}H${
                cell.holidays.length > 1 ? cell.holidays.length : ""
              }${hasContinuationToNext ? "→" : ""}`
            : "";
          const holidayTip = cell.holidays.length
            ? `Holidays: ${holidayDetails
                .map((detail) => {
                  const holiday = detail.holiday || {};
                  const continuation = [
                    detail.continuesFromPrev ? "continues from previous day" : "",
                    detail.continuesToNext ? "continues to next day" : "",
                  ]
                    .filter(Boolean)
                    .join(", ");
                  return `${holiday.name} (${holidayCategoryLabel(holiday.category)})${
                    continuation ? ` [${continuation}]` : ""
                  }`;
                })
                .join("; ")}`
            : "";
          return createElement("td", {}, [
            createElement(
              "button",
              {
                className: classNames.join(" "),
                attrs: { type: "button" },
                dataset: { calDay: cell.dayNumber, calAbsoluteDay: cell.absoluteDay },
              },
              [
                createElement("span", {
                  className: "calendar-day-btn__num",
                  text: String(cell.dayNumber),
                }),
                createElement("span", { className: "calendar-day-btn__moons" }, [
                  ...(cell.moonStates || []).map((moonState, index) =>
                    moonIconNode(moonState, index),
                  ),
                  markers.length
                    ? createElement(
                        "span",
                        {
                          className: "calendar-day-btn__astro-icons",
                          dataset: { tip: `Astronomy: ${markerNames}` },
                        },
                        markers.map((marker) => astroIconNode(marker)),
                      )
                    : null,
                  cycles.length
                    ? createElement(
                        "span",
                        {
                          className: "calendar-day-btn__cycle-icons",
                          dataset: { tip: `Cycles: ${cycleNames}` },
                        },
                        cycles.map((cycle) => cycleIconNode(cycle)),
                      )
                    : null,
                ]),
                cell.holidays.length
                  ? createElement("span", {
                      className: "calendar-day-btn__holiday",
                      dataset: { tip: holidayTip },
                      text: holidayMarkerText,
                    })
                  : createElement("span", {
                      className: "calendar-day-btn__holiday is-empty",
                      text: " ",
                    }),
              ],
            ),
          ]);
        }),
      ]),
    );
    return { head, body };
  }

  function miniGrid(model, selectedAbsoluteDay) {
    const head = (model.headers || []).map((header) => createElement("th", { text: header }));
    const body = (model.rows || []).map((row) =>
      createElement(
        "tr",
        {},
        (row.cells || []).map((cell) => {
          if (!cell) return createElement("td", { className: "calendar-mini-cell is-empty" });
          if (cell.kind === "festival") {
            const label = cell.festival?.name || "Festival";
            const seq =
              I(cell.festival?.segmentCount, 1) > 1
                ? ` ${I(cell.festival?.segment, 1)}/${I(cell.festival?.segmentCount, 1)}`
                : "";
            return createElement("td", { className: "calendar-mini-cell" }, [
              createElement(
                "div",
                {
                  className: "calendar-mini-day is-festival",
                  dataset: { tip: `${label}${seq}` },
                },
                [
                  createElement("span", { className: "calendar-mini-day__num", text: "F" }),
                  createElement("span", {
                    className: "calendar-mini-day__holiday",
                    text: label,
                  }),
                ],
              ),
            ]);
          }
          const classNames = ["calendar-mini-day"];
          if (cell.absoluteDay === selectedAbsoluteDay) classNames.push("is-selected");
          if (cell.holidays.length) classNames.push("has-holiday");
          if (cell.holidays.length) classNames.push(holidayColorClass(cell.holidays[0]?.colorTag));
          if ((cell.markers || []).length) classNames.push("has-astronomy");
          if ((cell.cycles || []).length) classNames.push("has-cycle");
          const holidayCount = cell.holidays.length;
          const markerCount = (cell.markers || []).length;
          const cycleCount = (cell.cycles || []).length;
          const holidayNames = holidayCount
            ? cell.holidays.map((holiday) => holiday.name).join(", ")
            : "";
          const markerNames = markerCount
            ? cell.markers.map((marker) => astronomyMarkerLabel(marker)).join(", ")
            : "";
          const cycleNames = cycleCount
            ? cell.cycles.map((cycle) => cycleMarkerTip(cycle)).join(", ")
            : "";
          const holidayDetails = Array.isArray(cell.holidayDetails) ? cell.holidayDetails : [];
          const hasContinuationFromPrev = holidayDetails.some(
            (detail) => !!detail.continuesFromPrev,
          );
          const hasContinuationToNext = holidayDetails.some((detail) => !!detail.continuesToNext);
          const holidayMarkerPrefix = hasContinuationFromPrev ? "←" : "";
          const holidayMarkerSuffix = hasContinuationToNext ? "→" : "";
          let holidayMark = createElement("span", {
            className: "calendar-mini-day__holiday is-empty",
            attrs: { "aria-hidden": "true" },
            text: " ",
          });
          if (holidayCount && markerCount) {
            holidayMark = createElement("span", {
              className: "calendar-mini-day__holiday",
              dataset: {
                tip: `Holidays: ${holidayNames}; Astronomy: ${markerNames}; Cycles: ${
                  cycleNames || "None"
                }; ${TIPS["Holiday continuation"]}`,
              },
              text: `${holidayMarkerPrefix}H${holidayCount > 1 ? holidayCount : ""}${holidayMarkerSuffix}/A${
                markerCount > 1 ? markerCount : ""
              }${cycleCount ? `/C${cycleCount > 1 ? cycleCount : ""}` : ""}`,
            });
          } else if (holidayCount) {
            holidayMark = createElement("span", {
              className: "calendar-mini-day__holiday",
              dataset: {
                tip: `Holiday${holidayCount > 1 ? "s" : ""}: ${holidayNames}; Cycles: ${
                  cycleNames || "None"
                }; ${TIPS["Holiday continuation"]}`,
              },
              text: `${holidayMarkerPrefix}H${holidayCount > 1 ? holidayCount : ""}${holidayMarkerSuffix}${
                cycleCount ? `/C${cycleCount > 1 ? cycleCount : ""}` : ""
              }`,
            });
          } else if (markerCount) {
            holidayMark = createElement("span", {
              className: "calendar-mini-day__holiday calendar-mini-day__holiday--astro",
              dataset: { tip: `Astronomy: ${markerNames}; Cycles: ${cycleNames || "None"}` },
              text: `A${markerCount > 1 ? markerCount : ""}${
                cycleCount ? `/C${cycleCount > 1 ? cycleCount : ""}` : ""
              }`,
            });
          } else if (cycleCount) {
            holidayMark = createElement("span", {
              className: "calendar-mini-day__holiday calendar-mini-day__holiday--cycle",
              dataset: { tip: `Cycles: ${cycleNames}` },
              text: `C${cycleCount > 1 ? cycleCount : ""}`,
            });
          }
          return createElement("td", { className: "calendar-mini-cell" }, [
            createElement(
              "button",
              {
                className: classNames.join(" "),
                attrs: { type: "button" },
                dataset: { calMiniDay: cell.dayNumber, calAbsoluteDay: cell.absoluteDay },
              },
              [
                createElement("span", {
                  className: "calendar-mini-day__num",
                  text: String(cell.dayNumber),
                }),
                holidayMark,
              ],
            ),
          ]);
        }),
      ),
    );
    return { head, body };
  }

  function buildSeasonRangesForYear(yearLengthInput) {
    const yearLength = Math.max(1, I(yearLengthInput, 1));
    const starts = SEASON_MARKER_DEFS.map((def, seasonIndex) => ({
      ...def,
      seasonIndex,
      startDay: clampI(Math.round(yearLength * def.fraction) + 1, 1, yearLength),
    }));
    return starts.map((entry, index) => {
      const nextStart = index < starts.length - 1 ? starts[index + 1].startDay : yearLength + 1;
      return {
        ...entry,
        endDay: Math.max(entry.startDay, nextStart - 1),
      };
    });
  }

  function buildSeasonBandContent(model, astronomySettings) {
    const settings = normalizeAstronomySettings(astronomySettings);
    if (!settings.enabled || !settings.seasons || !settings.seasonBands) return [];
    const monthLength = Math.max(1, I(model?.monthLength, 1));
    const yearLength = Math.max(1, I(model?.yearLength, monthLength));
    const monthStartDay = Math.max(1, I(model?.daysBeforeMonth, 0) + 1);
    const monthEndDay = Math.min(yearLength, monthStartDay + monthLength - 1);
    const ranges = buildSeasonRangesForYear(yearLength);
    const toPercent = (value) => `${Math.max(0, Math.min(100, N(value, 0))).toFixed(3)}%`;

    const segments = ranges
      .map((range) => {
        const overlapStart = Math.max(monthStartDay, range.startDay);
        const overlapEnd = Math.min(monthEndDay, range.endDay);
        if (overlapEnd < overlapStart) return null;
        const left = ((overlapStart - monthStartDay) / monthLength) * 100;
        const width = ((overlapEnd - overlapStart + 1) / monthLength) * 100;
        return createElement("span", {
          className: `calendar-season-band__segment season-${range.seasonIndex}`,
          attrs: { style: `left:${toPercent(left)};width:${toPercent(width)}` },
          dataset: { tip: `${range.name}: days ${overlapStart}-${overlapEnd} in this month` },
        });
      })
      .filter(Boolean);

    const ticks = ranges
      .filter((range) => range.startDay >= monthStartDay && range.startDay <= monthEndDay)
      .map((range) => {
        const left = ((range.startDay - monthStartDay + 0.5) / monthLength) * 100;
        return createElement(
          "span",
          {
            className: `calendar-season-band__tick season-${range.seasonIndex}`,
            attrs: { style: `left:${toPercent(left)}` },
            dataset: { tip: `${range.name} begins on day ${range.startDay} of the year` },
          },
          createElement("span", {
            className: "calendar-season-band__tick-label",
            text: range.short,
          }),
        );
      });

    return [
      createElement("div", {
        className: "calendar-season-band__meta",
        text: `Season band | Year days ${monthStartDay}-${monthEndDay} of ${yearLength}`,
      }),
      createElement("div", { className: "calendar-season-band__track" }, [...segments, ...ticks]),
    ];
  }

  return {
    astroIconNode,
    buildSeasonBandContent,
    cycleIconNode,
    detailedGrid,
    miniGrid,
    moonIconNode,
    renderIntercalaryGroups,
    selectedDayLine,
  };
}
