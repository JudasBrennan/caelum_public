export function createCalendarTransferFlows({
  state,
  els,
  runtime,
  buildContext,
  buildMonthModel,
  applyHolidayFiltersToMonthModel,
  formatDisplayedYear,
  normalizeIcsIncludes,
  normalizeIsoDate,
  normalizeAstronomySettings,
  astronomyMarkerLabel,
  HOLIDAY_CATEGORIES,
  holidayColorClass,
  holidayCategoryLabel,
  createCalendarExportEnvelope,
  clonePlain,
  readCalendarCandidate,
  readState,
  loadWorld,
  render,
  setJsonStatus,
  setOutputStatus,
  downloadJsonFile,
  utcStampCompact,
  fmt,
  esc,
  I,
  clampI,
}) {
  function formatIcsDate(date) {
    const yyyy = String(date.getUTCFullYear()).padStart(4, "0");
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  }

  function parseAnchorDateUtc(anchorDate) {
    const safe = normalizeIsoDate(anchorDate);
    const parts = safe.split("-").map((value) => Number(value));
    if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
      const now = new Date();
      return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    }
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function toGregorianDateFromAbsolute(absoluteDay, anchorDate) {
    const baseMs = parseAnchorDateUtc(anchorDate);
    return new Date(baseMs + Math.max(0, I(absoluteDay, 0)) * 86400000);
  }

  function escapeIcsText(text) {
    return String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  }

  function buildScopeMonthModels(ctx, scope) {
    const months =
      scope === "year"
        ? Array.from({ length: ctx.metrics.monthsPerYear }, (_, index) => index)
        : [ctx.monthModel.monthIndex];
    return months.map((monthIndex) =>
      buildMonthModel({
        metrics: ctx.metrics,
        year: state.ui.year,
        monthIndex,
        firstYearStartDayIndex: state.ui.startDayOfYear,
        weekStartDayIndex: state.ui.weekStartsOn,
        leapRules: ctx.leapRules,
        monthLengthOverrides: ctx.monthLengthOverrides,
        dayNames: ctx.dayNames,
        weekNames: state.ui.weekNames,
        monthNames: ctx.monthNames,
        moonDefs: ctx.moonDefs,
        moonEpochOffsetDays: state.ui.moonEpochOffsetDays,
        holidays: ctx.holidays,
        festivals: ctx.festivals,
        astronomySettings: ctx.astronomySettings,
        workCycles: ctx.workCycles,
      }),
    );
  }

  function currentCalendarJsonText() {
    return JSON.stringify(createCalendarExportEnvelope(state, clonePlain), null, 2);
  }

  function loadCurrentJsonToTextarea() {
    if (!els.jsonText) return;
    els.jsonText.value = currentCalendarJsonText();
    setJsonStatus(`Ready. ${els.jsonText.value.length.toLocaleString("en-GB")} characters.`, "ok");
  }

  function applyCalendarPayload(payload) {
    const candidate = readCalendarCandidate(payload);
    if (!candidate) throw new Error("JSON does not contain a calendar payload.");
    const next = readState({ ...loadWorld(), calendar: candidate });
    state.inputs = next.inputs;
    state.ui = next.ui;
    state.profileId = next.profileId;
    state.profileName = next.profileName;
    state.profiles = next.profiles;
    state._allProfiles = next._allProfiles;
    state.ui.monthIndex = 0;
    state.ui.selectedDay = 1;
    runtime.editingHolidayId = null;
    runtime.editingFestivalId = null;
    runtime.editingCycleId = null;
    render();
    setJsonStatus("Calendar settings imported.", "ok");
  }

  async function importCalendarJsonText(rawText, label = "JSON") {
    const text = String(rawText || "").trim();
    if (!text) {
      setJsonStatus("No JSON provided.", "warn");
      return;
    }
    try {
      const parsed = JSON.parse(text);
      applyCalendarPayload(parsed);
      setJsonStatus(`Imported calendar from ${label}.`, "ok");
    } catch (error) {
      setJsonStatus(`Import failed: ${error?.message || "Invalid JSON."}`, "error");
    }
  }

  function openPrintableCalendar(scope) {
    const ctx = buildContext(loadWorld(), state);
    const models = buildScopeMonthModels(ctx, scope).map((model) =>
      applyHolidayFiltersToMonthModel(model, state.ui.holidayCategoryFilters),
    );
    const yearLabel = formatDisplayedYear(state.ui.year, state.ui);
    const moonLegendItems = ctx.moonDefs
      .map(
        (moon, index) =>
          `<span class="ws-moon-key-item"><span class="ws-moon-dot ws-moon-c${index}"></span>${esc(moon.name)} (${fmt(moon.synodicDays, 3)} d)</span>`,
      )
      .join("");
    const enabledCategoryLabels = HOLIDAY_CATEGORIES.filter(
      ([category]) => state.ui.holidayCategoryFilters?.[category],
    )
      .map(([, label]) => label)
      .join(", ");
    const docTitle =
      scope === "year"
        ? `${state.ui.calendarName || "Calendar"} - Year ${yearLabel}`
        : `${state.ui.calendarName || "Calendar"} - ${models[0]?.monthName || ""} ${yearLabel}`;
    const monthBlocks = models
      .map((model, index) => {
        const head =
          `<th class="ws-week-col">Week</th>` +
          model.headers.map((heading) => `<th>${esc(heading)}</th>`).join("");
        const rows = model.rows
          .map((row) => {
            const cells = row.cells
              .map((cell) => {
                if (!cell) return `<td class="ws-cell-empty"></td>`;
                if (cell.kind === "festival") {
                  const seq =
                    I(cell.festival?.segmentCount, 1) > 1
                      ? ` ${I(cell.festival?.segment, 1)}/${I(cell.festival?.segmentCount, 1)}`
                      : "";
                  return `<td><div class="ws-day-card ws-festival-card"><div class="ws-day-top"><span class="ws-day-num">F</span><span class="ws-festival-title">${esc(cell.festival?.name || "Festival")}${seq}</span></div><div class="ws-day-events">${esc(cell.festival?.outsideWeekFlow ? "Outside weekday flow" : "Festival day")}</div></div></td>`;
                }
                const moons = (cell.moonStates || [])
                  .map(
                    (moonState, moonIndex) =>
                      `<span class="ws-moon-pill ws-moon-c${moonIndex}" data-moon="${esc(
                        moonState?.name || `Moon ${moonIndex + 1}`,
                      )}">${esc(String(moonState?.phase?.phaseShort || "N").toUpperCase())}</span>`,
                  )
                  .join("");
                const holidays = (cell.holidays || [])
                  .map(
                    (holiday) =>
                      `<span class="ws-event-pill ${holidayColorClass(holiday.colorTag)}">H ${esc(
                        holiday.name,
                      )} (${esc(holidayCategoryLabel(holiday.category))})</span>`,
                  )
                  .join("");
                const markers = (cell.markers || [])
                  .map(
                    (marker) =>
                      `<span class="ws-event-pill ws-marker-pill">A ${esc(
                        astronomyMarkerLabel(marker),
                      )}</span>`,
                  )
                  .join("");
                const cycles = (cell.cycles || [])
                  .map(
                    (cycle) =>
                      `<span class="ws-event-pill ws-cycle-pill">${esc(
                        String(cycle.short || "C").toUpperCase(),
                      )} ${esc(cycle.ruleName || cycle.label || "Cycle")}</span>`,
                  )
                  .join("");
                return `<td><div class="ws-day-card"><div class="ws-day-top"><span class="ws-day-num">${cell.dayNumber}</span></div><div class="ws-day-moons">${moons || `<span class="ws-muted">-</span>`}</div><div class="ws-day-events">${holidays || `<span class="ws-muted">No holidays</span>`}</div><div class="ws-day-events">${markers || `<span class="ws-muted">No astronomy</span>`}</div><div class="ws-day-events">${cycles || `<span class="ws-muted">No cycles</span>`}</div></div></td>`;
              })
              .join("");
            return `<tr><th class="ws-week-col">${esc(row.weekName || "")}</th>${cells}</tr>`;
          })
          .join("");
        const outsideFlowFestivals = (model.outsideWeekFlowFestivals || [])
          .slice(0, 10)
          .map((festival) => festival.name)
          .join(", ");
        return `<section class="ws-print-month ${scope === "year" && index > 0 ? "ws-break" : ""}"><h2>${esc(model.monthName)} - ${esc(yearLabel)} (${model.monthLength} days)</h2><div class="ws-chip-row"><span class="ws-chip"><b>Calendar:</b> ${esc(
          String(state.ui.calendarName || "Calendar"),
        )}</span><span class="ws-chip"><b>Full Moon:</b> ${esc(
          model.fullMoonDays.length ? model.fullMoonDays.join(", ") : "None",
        )}</span><span class="ws-chip"><b>New Moon:</b> ${esc(
          model.newMoonDays.length ? model.newMoonDays.join(", ") : "None",
        )}</span><span class="ws-chip"><b>Holidays:</b> ${model.holidaysInMonth.reduce(
          (sum, [, count]) => sum + count,
          0,
        )}</span><span class="ws-chip"><b>Astronomy:</b> ${model.markersInMonth.reduce(
          (sum, marker) => sum + (marker.count || 0),
          0,
        )}</span></div><div class="ws-moon-key"><b>Moon key:</b> ${moonLegendItems}</div><div class="ws-print-grid-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>${
          outsideFlowFestivals
            ? `<div class="ws-foot-note"><b>Outside-week-flow festivals:</b> ${esc(outsideFlowFestivals)}</div>`
            : ""
        }</section>`;
      })
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(
      docTitle,
    )}</title><style>@page{size:landscape;margin:10mm;}body{font-family:Segoe UI,Arial,sans-serif;color:#0f1628;margin:0;}h1{margin:0 0 10px;font-size:22px;}h2{margin:0 0 10px;font-size:16px;}.ws-intro{margin:0 0 12px;font-size:12px;color:#304161;}.ws-print-month{margin:0 0 14px;}.ws-chip-row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px;}.ws-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;border:1px solid #d6dfef;background:#f5f8ff;color:#13203f;font-size:11px;}.ws-moon-key{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 8px;font-size:11px;color:#2a3651;}.ws-moon-key-item{display:inline-flex;align-items:center;gap:6px;}.ws-moon-dot{width:10px;height:10px;border-radius:999px;display:inline-block;border:1px solid #96a8ca;}.ws-moon-c0{background:#86cbff;}.ws-moon-c1{background:#ffc98f;}.ws-moon-c2{background:#d5b7ff;}.ws-moon-c3{background:#9eeab8;}.ws-print-grid-wrap{overflow:hidden;border:1px solid #d6dfef;border-radius:10px;}table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;}thead th{background:#edf3ff;font-weight:700;color:#1f2f50;border-bottom:1px solid #d6dfef;}th,td{padding:6px;border-right:1px solid #e3e9f5;border-bottom:1px solid #e3e9f5;vertical-align:top;font-size:11px;line-height:1.25;}thead th:last-child,tbody td:last-child{border-right:0;}tbody tr:last-child td,tbody tr:last-child th{border-bottom:0;}.ws-week-col{width:92px;background:#f7faff;color:#2a3651;font-weight:700;}.ws-cell-empty{background:#fbfdff;}.ws-day-card{min-height:74px;border:1px solid #dbe4f5;border-radius:8px;background:#ffffff;padding:4px 6px;display:flex;flex-direction:column;gap:4px;}.ws-festival-card{background:#f1f6ff;border-color:#cddbf4;}.ws-day-top{display:flex;align-items:center;justify-content:space-between;gap:6px;}.ws-day-num{font-size:13px;font-weight:700;color:#13203f;}.ws-festival-title{font-size:11px;font-weight:600;color:#203359;}.ws-day-moons{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}.ws-moon-pill{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:16px;padding:0 5px;border-radius:999px;border:1px solid #c4d2eb;font-size:10px;font-weight:700;color:#13203f;background:#eef4ff;}.ws-day-events{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}.ws-event-pill{display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;border:1px solid #d2dcf0;background:#f7f9ff;font-size:10px;color:#13203f;}.ws-marker-pill{border-color:#bfd4f7;background:#edf4ff;color:#1c3f7a;}.ws-cycle-pill{border-color:#b8dfc8;background:#eefaf3;color:#1a5a35;}.ws-event-pill.holiday-tag-gold{background:#fff3df;border-color:#f0cf9f;}.ws-event-pill.holiday-tag-azure{background:#eaf6ff;border-color:#b9dfff;}.ws-event-pill.holiday-tag-emerald{background:#ecfdf2;border-color:#bdeccc;}.ws-event-pill.holiday-tag-violet{background:#f2ecff;border-color:#d4c2ff;}.ws-event-pill.holiday-tag-rose{background:#ffedf4;border-color:#f4bfd2;}.ws-event-pill.holiday-tag-slate{background:#edf0f7;border-color:#cad3e5;}.ws-foot-note{margin-top:8px;font-size:11px;color:#304161;}.ws-muted{color:#7385a7;}.ws-break{page-break-before:always;}@media print{body{margin:0;} .ws-print-root{margin:0;} }</style></head><body><div class="ws-print-root"><h1>${esc(
      docTitle,
    )}</h1><div class="ws-intro">Styled detailed export. Visible holiday categories: ${esc(
      enabledCategoryLabels || "None",
    )}.</div>${monthBlocks}</div></body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      const fallbackName =
        scope === "year"
          ? `worldsmith-calendar-${state.ui.year}-printable.html`
          : `worldsmith-calendar-${state.ui.year}-m${state.ui.monthIndex + 1}-printable.html`;
      downloadJsonFile(fallbackName, html, "text/html;charset=utf-8");
      setOutputStatus(
        "Popup was blocked, so a printable HTML file was downloaded instead. Open it and print to PDF.",
        "warn",
      );
      return;
    }
    try {
      win.opener = null;
    } catch {
      // no-op: some browsers block assigning opener.
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    let hasPrinted = false;
    const printView = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      try {
        win.focus();
        win.print();
      } catch {
        // no-op: user can still print manually from opened view.
      }
    };
    if (typeof win.addEventListener === "function") {
      win.addEventListener("load", () => window.setTimeout(printView, 50), { once: true });
    }
    window.setTimeout(printView, 400);
    setOutputStatus("Opened printable view. Use your browser print dialog to save as PDF.", "ok");
  }

  function buildIcs(scope) {
    const ctx = buildContext(loadWorld(), state);
    const models = buildScopeMonthModels(ctx, scope);
    const include = normalizeIcsIncludes(state.ui.icsIncludes);
    const anchorDate = normalizeIsoDate(state.ui.exportAnchorDate);
    const yearLabel = formatDisplayedYear(state.ui.year, state.ui);
    const stamp = new Date();
    const dtStamp = `${formatIcsDate(stamp)}T${String(stamp.getUTCHours()).padStart(2, "0")}${String(stamp.getUTCMinutes()).padStart(2, "0")}${String(stamp.getUTCSeconds()).padStart(2, "0")}Z`;
    const events = [];

    const pushEvent = (absoluteDay, summary, description) => {
      const start = toGregorianDateFromAbsolute(absoluteDay, anchorDate);
      const end = toGregorianDateFromAbsolute(absoluteDay + 1, anchorDate);
      const uid = `${absoluteDay}-${events.length + 1}@worldsmith-web`;
      events.push(
        [
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTAMP:${dtStamp}`,
          `DTSTART;VALUE=DATE:${formatIcsDate(start)}`,
          `DTEND;VALUE=DATE:${formatIcsDate(end)}`,
          `SUMMARY:${escapeIcsText(summary)}`,
          `DESCRIPTION:${escapeIcsText(description)}`,
          "END:VEVENT",
        ].join("\r\n"),
      );
    };

    for (const model of models) {
      const rows = model.rows.flatMap((row) => row.cells).filter(Boolean);
      for (const cell of rows) {
        if (cell.kind === "festival") {
          if (!include.festivals) continue;
          const dayNumber = Math.max(1, clampI(cell.festival?.afterDay, 1, model.monthLength));
          const absoluteDay = model.absoluteMonthStart + dayNumber - 1;
          pushEvent(
            absoluteDay,
            `Festival: ${cell.festival?.name || "Festival"}`,
            `${model.monthName} ${dayNumber}, ${yearLabel} (calendar ${state.ui.calendarName || "Calendar"})`,
          );
          continue;
        }

        const dayLabel = `${model.monthName} ${cell.dayNumber}, ${yearLabel}`;
        if (include.holidays) {
          for (const holiday of cell.holidays || []) {
            pushEvent(
              cell.absoluteDay,
              `Holiday: ${holiday.name}`,
              `${dayLabel} (calendar ${state.ui.calendarName || "Calendar"})`,
            );
          }
        }
        if (include.markers && normalizeAstronomySettings(state.ui.astronomy).enabled) {
          for (const marker of cell.markers || []) {
            const markerLabel = astronomyMarkerLabel(marker);
            pushEvent(
              cell.absoluteDay,
              `Astronomy: ${markerLabel}`,
              `${dayLabel} (calendar ${state.ui.calendarName || "Calendar"})`,
            );
          }
        }
      }

      if (include.festivals) {
        for (const fest of model.outsideWeekFlowFestivals || []) {
          const dayNumber = Math.max(1, clampI(fest.afterDay, 1, model.monthLength));
          const absoluteDay = model.absoluteMonthStart + dayNumber - 1;
          pushEvent(
            absoluteDay,
            `Festival: ${fest.name}`,
            `${model.monthName} ${dayNumber}, ${yearLabel} (outside weekday flow)`,
          );
        }
      }
    }

    const calName = String(state.ui.calendarName || "Calendar").trim() || "Calendar";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//WorldSmith Web//Calendar Export//EN",
      "CALSCALE:GREGORIAN",
      `X-WORLDSMITH-CALENDAR:${escapeIcsText(calName)}`,
      `X-WORLDSMITH-YEAR:${escapeIcsText(String(yearLabel))}`,
      ...events,
      "END:VCALENDAR",
      "",
    ];
    return { text: lines.join("\r\n"), count: events.length };
  }

  function downloadIcs(scope) {
    const { text, count } = buildIcs(scope);
    const safeName = String(state.ui.calendarName || "calendar")
      .trim()
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    const filename =
      scope === "month"
        ? `${safeName || "calendar"}-${state.ui.year}-m${state.ui.monthIndex + 1}-${utcStampCompact()}.ics`
        : `${safeName || "calendar"}-${state.ui.year}-${utcStampCompact()}.ics`;
    downloadJsonFile(filename, text, "text/calendar;charset=utf-8");
    setOutputStatus(
      `Exported ${scope === "month" ? "month" : "year"} ICS with ${count} events.`,
      "ok",
    );
  }

  return {
    currentCalendarJsonText,
    downloadIcs,
    importCalendarJsonText,
    loadCurrentJsonToTextarea,
    openPrintableCalendar,
  };
}
