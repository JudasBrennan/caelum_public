import { buildYearLayoutForYear } from "../../engine/usableCalendar.js";
import { monthModelIntercalaryGroups } from "./renderHelpers.js";

export function createCalendarTransferFlows({
  state,
  els,
  runtime,
  readRenderSnapshot,
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
  const PRINTABLE_POPUP_FEATURES = "noopener,noreferrer";
  const getRenderSnapshot = () =>
    typeof readRenderSnapshot === "function"
      ? readRenderSnapshot()
      : (() => {
          const world = loadWorld();
          return { world, ctx: buildContext(world, state) };
        })();

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
    if (scope === "month" && ctx?.monthModel) {
      return [ctx.monthModel];
    }
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
        intercalaryPeriods: ctx.intercalaryPeriods,
        dayNames: ctx.dayNames,
        weekNames: state.ui.weekNames,
        monthNames: ctx.monthNames,
        moonDefs: ctx.moonDefs,
        moonEpochOffsetDays: state.ui.moonEpochOffsetDays,
        holidays: ctx.holidays,
        festivals: ctx.festivals,
        astronomySettings: ctx.astronomySettings,
        workCycles: ctx.workCycles,
        weekendDayIndexes: ctx.weekendDayIndexes,
        holidayAlgorithmSupport: ctx.holidayAlgorithmSupport,
      }),
    );
  }

  function currentCalendarJsonText() {
    return JSON.stringify(createCalendarExportEnvelope(state, clonePlain), null, 2);
  }

  function revokePrintableUrl(url) {
    if (!url || typeof window?.URL?.revokeObjectURL !== "function") return;
    try {
      window.URL.revokeObjectURL(url);
    } catch {
      // no-op: best-effort cleanup only.
    }
  }

  function createPrintableUrl(html) {
    if (typeof Blob !== "function" || typeof window?.URL?.createObjectURL !== "function") {
      return "";
    }
    try {
      return window.URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    } catch {
      return "";
    }
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
    if (typeof runtime?.resetRuleEditors === "function") {
      runtime.resetRuleEditors();
    } else {
      runtime.editingHolidayId = null;
      runtime.editingFestivalId = null;
      runtime.editingIntercalaryId = null;
      runtime.editingCycleId = null;
    }
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

  function intercalaryPlacementLabel(placement, anchorMonthName) {
    const safeAnchor = String(anchorMonthName || "").trim();
    if (placement === "before-month") return safeAnchor ? `Before ${safeAnchor}` : "Before month";
    if (placement === "after-month") return safeAnchor ? `After ${safeAnchor}` : "After month";
    if (placement === "year-end") return "Year end";
    if (placement === "append-to-month")
      return safeAnchor ? `Appended to ${safeAnchor}` : "Appended to month";
    return "Intercalary";
  }

  function intercalaryFlowLabel(advancesWeekdayFlow) {
    return advancesWeekdayFlow ? "In weekday flow" : "Outside weekday flow";
  }

  function renderPrintableMoonPills(cell) {
    return (cell?.moonStates || [])
      .map(
        (moonState, moonIndex) =>
          `<span class="ws-moon-pill ws-moon-c${moonIndex}" data-moon="${esc(
            moonState?.name || `Moon ${moonIndex + 1}`,
          )}">${esc(String(moonState?.phase?.phaseShort || "N").toUpperCase())}</span>`,
      )
      .join("");
  }

  function renderPrintableEventPills(cell) {
    const holidays = (cell?.holidays || [])
      .map(
        (holiday) =>
          `<span class="ws-event-pill ${holidayColorClass(holiday.colorTag)}">H ${esc(
            holiday.name,
          )} (${esc(holidayCategoryLabel(holiday.category))})</span>`,
      )
      .join("");
    const markers = (cell?.markers || [])
      .map(
        (marker) =>
          `<span class="ws-event-pill ws-marker-pill">A ${esc(astronomyMarkerLabel(marker))}</span>`,
      )
      .join("");
    const cycles = (cell?.cycles || [])
      .map(
        (cycle) =>
          `<span class="ws-event-pill ws-cycle-pill">${esc(
            String(cycle.short || "C").toUpperCase(),
          )} ${esc(cycle.ruleName || cycle.label || "Cycle")}</span>`,
      )
      .join("");
    return { holidays, markers, cycles };
  }

  function renderPrintableIntercalaryGroups(groups) {
    return (Array.isArray(groups) ? groups : [])
      .map((group) => {
        const lengthDays = Math.max(0, I(group?.lengthDays, 0));
        const days = (group?.days || [])
          .map((cell) => {
            const moons = renderPrintableMoonPills(cell);
            const events = renderPrintableEventPills(cell);
            return `<div class="ws-intercalary-day-card"><div class="ws-day-top"><span class="ws-day-num">${esc(
              String(cell?.intercalaryDay || 1),
            )}</span><span class="ws-festival-title">${esc(
              cell?.intercalaryName || group?.name || "Intercalary period",
            )}</span></div><div class="ws-day-moons">${moons || `<span class="ws-muted">-</span>`}</div><div class="ws-day-events">${events.holidays || `<span class="ws-muted">No holidays</span>`}</div><div class="ws-day-events">${events.markers || `<span class="ws-muted">No astronomy</span>`}</div><div class="ws-day-events">${events.cycles || `<span class="ws-muted">No cycles</span>`}</div></div>`;
          })
          .join("");
        return `<div class="ws-intercalary-block"><div class="ws-intercalary-block__header"><span class="ws-intercalary-block__title">${esc(
          `${group?.name || "Intercalary period"} (${lengthDays} day${lengthDays === 1 ? "" : "s"})`,
        )}</span><span class="ws-intercalary-block__meta">${esc(
          `${intercalaryPlacementLabel(group?.placement, group?.anchorMonthName)} | ${intercalaryFlowLabel(group?.advancesWeekdayFlow)}`,
        )}</span></div><div class="ws-intercalary-block__days">${days}</div></div>`;
      })
      .join("");
  }

  function calendarCellLabel(cell, model, yearLabel) {
    if (cell?.kind === "intercalary") {
      return `${cell.intercalaryName || "Intercalary period"} day ${Math.max(
        1,
        I(cell.intercalaryDay, 1),
      )}, ${yearLabel}`;
    }
    return `${model.monthName} ${Math.max(1, I(cell?.dayNumber, 1))}, ${yearLabel}`;
  }

  function collectAppendedIntercalarySpans(model, yearLayout) {
    const monthSegment = yearLayout?.monthSegments?.[model?.monthIndex];
    if (!monthSegment) return [];
    const appended = (monthSegment.appendedIntercalaryPeriods || []).filter(
      (item) => Math.max(0, I(item?.lengthDays, 0)) > 0,
    );
    if (!appended.length) return [];
    const totalLength = appended.reduce(
      (sum, item) => sum + Math.max(0, I(item?.lengthDays, 0)),
      0,
    );
    let absoluteCursor =
      Math.max(0, I(monthSegment.absoluteStartDay, 0)) +
      Math.max(1, I(monthSegment.lengthDays, 1)) -
      totalLength;
    return appended.map((item, index) => {
      const lengthDays = Math.max(0, I(item?.lengthDays, 0));
      const span = {
        key: `append:${model.monthIndex}:${String(item?.intercalaryPeriodId || index)}`,
        name: String(item?.name || "Intercalary period").trim() || "Intercalary period",
        placement: "append-to-month",
        anchorMonthName: model?.monthName || `Month ${Math.max(1, I(model?.monthIndex, 0) + 1)}`,
        advancesWeekdayFlow: item?.advancesWeekdayFlow !== false,
        absoluteStartDay: absoluteCursor,
        lengthDays,
      };
      absoluteCursor += lengthDays;
      return span;
    });
  }

  function openPrintableCalendar(scope) {
    const { ctx } = getRenderSnapshot();
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
                const moons = renderPrintableMoonPills(cell);
                const events = renderPrintableEventPills(cell);
                return `<td><div class="ws-day-card"><div class="ws-day-top"><span class="ws-day-num">${cell.dayNumber}</span></div><div class="ws-day-moons">${moons || `<span class="ws-muted">-</span>`}</div><div class="ws-day-events">${events.holidays || `<span class="ws-muted">No holidays</span>`}</div><div class="ws-day-events">${events.markers || `<span class="ws-muted">No astronomy</span>`}</div><div class="ws-day-events">${events.cycles || `<span class="ws-muted">No cycles</span>`}</div></div></td>`;
              })
              .join("");
            return `<tr><th class="ws-week-col">${esc(row.weekName || "")}</th>${cells}</tr>`;
          })
          .join("");
        const outsideFlowFestivals = (model.outsideWeekFlowFestivals || [])
          .slice(0, 10)
          .map((festival) => festival.name)
          .join(", ");
        const intercalarySummary = (model.intercalarySummary || []).join("; ");
        const intercalaryBefore = renderPrintableIntercalaryGroups(model.intercalaryBeforeMonth);
        const intercalaryAfter = renderPrintableIntercalaryGroups(model.intercalaryAfterMonth);
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
        )}</span></div><div class="ws-moon-key"><b>Moon key:</b> ${moonLegendItems}</div>${
          intercalarySummary
            ? `<div class="ws-foot-note"><b>Intercalary structure:</b> ${esc(intercalarySummary)}</div>`
            : ""
        }${
          intercalaryBefore
            ? `<div class="ws-intercalary-print-wrap">${intercalaryBefore}</div>`
            : ""
        }<div class="ws-print-grid-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>${
          intercalaryAfter ? `<div class="ws-intercalary-print-wrap">${intercalaryAfter}</div>` : ""
        }${
          outsideFlowFestivals
            ? `<div class="ws-foot-note"><b>Outside-week-flow festivals:</b> ${esc(outsideFlowFestivals)}</div>`
            : ""
        }</section>`;
      })
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(
      docTitle,
    )}</title><style>@page{size:landscape;margin:10mm;}body{font-family:Segoe UI,Arial,sans-serif;color:#0f1628;margin:0;}h1{margin:0 0 10px;font-size:22px;}h2{margin:0 0 10px;font-size:16px;}.ws-intro{margin:0 0 12px;font-size:12px;color:#304161;}.ws-print-month{margin:0 0 14px;}.ws-chip-row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px;}.ws-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;border:1px solid #d6dfef;background:#f5f8ff;color:#13203f;font-size:11px;}.ws-moon-key{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 8px;font-size:11px;color:#2a3651;}.ws-moon-key-item{display:inline-flex;align-items:center;gap:6px;}.ws-moon-dot{width:10px;height:10px;border-radius:999px;display:inline-block;border:1px solid #96a8ca;}.ws-moon-c0{background:#86cbff;}.ws-moon-c1{background:#ffc98f;}.ws-moon-c2{background:#d5b7ff;}.ws-moon-c3{background:#9eeab8;}.ws-print-grid-wrap{overflow:hidden;border:1px solid #d6dfef;border-radius:10px;}.ws-intercalary-print-wrap{display:flex;flex-direction:column;gap:8px;margin:8px 0;}.ws-intercalary-block{border:1px solid #d6dfef;border-radius:10px;background:#f7faff;padding:8px;}.ws-intercalary-block__header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:8px;}.ws-intercalary-block__title{font-size:12px;font-weight:700;color:#13203f;}.ws-intercalary-block__meta{font-size:11px;color:#304161;}.ws-intercalary-block__days{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;}.ws-intercalary-day-card{min-height:74px;border:1px solid #dbe4f5;border-radius:8px;background:#ffffff;padding:4px 6px;display:flex;flex-direction:column;gap:4px;}table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;}thead th{background:#edf3ff;font-weight:700;color:#1f2f50;border-bottom:1px solid #d6dfef;}th,td{padding:6px;border-right:1px solid #e3e9f5;border-bottom:1px solid #e3e9f5;vertical-align:top;font-size:11px;line-height:1.25;}thead th:last-child,tbody td:last-child{border-right:0;}tbody tr:last-child td,tbody tr:last-child th{border-bottom:0;}.ws-week-col{width:92px;background:#f7faff;color:#2a3651;font-weight:700;}.ws-cell-empty{background:#fbfdff;}.ws-day-card{min-height:74px;border:1px solid #dbe4f5;border-radius:8px;background:#ffffff;padding:4px 6px;display:flex;flex-direction:column;gap:4px;}.ws-festival-card{background:#f1f6ff;border-color:#cddbf4;}.ws-day-top{display:flex;align-items:center;justify-content:space-between;gap:6px;}.ws-day-num{font-size:13px;font-weight:700;color:#13203f;}.ws-festival-title{font-size:11px;font-weight:600;color:#203359;}.ws-day-moons{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}.ws-moon-pill{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:16px;padding:0 5px;border-radius:999px;border:1px solid #c4d2eb;font-size:10px;font-weight:700;color:#13203f;background:#eef4ff;}.ws-day-events{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}.ws-event-pill{display:inline-flex;align-items:center;padding:1px 6px;border-radius:999px;border:1px solid #d2dcf0;background:#f7f9ff;font-size:10px;color:#13203f;}.ws-marker-pill{border-color:#bfd4f7;background:#edf4ff;color:#1c3f7a;}.ws-cycle-pill{border-color:#b8dfc8;background:#eefaf3;color:#1a5a35;}.ws-event-pill.holiday-tag-gold{background:#fff3df;border-color:#f0cf9f;}.ws-event-pill.holiday-tag-azure{background:#eaf6ff;border-color:#b9dfff;}.ws-event-pill.holiday-tag-emerald{background:#ecfdf2;border-color:#bdeccc;}.ws-event-pill.holiday-tag-violet{background:#f2ecff;border-color:#d4c2ff;}.ws-event-pill.holiday-tag-rose{background:#ffedf4;border-color:#f4bfd2;}.ws-event-pill.holiday-tag-slate{background:#edf0f7;border-color:#cad3e5;}.ws-foot-note{margin-top:8px;font-size:11px;color:#304161;}.ws-muted{color:#7385a7;}.ws-break{page-break-before:always;}@media print{body{margin:0;} .ws-print-root{margin:0;} }</style><script>(()=>{let printed=false;const printView=()=>{if(printed)return;printed=true;try{window.focus();window.print();}catch{}};window.addEventListener("load",()=>window.setTimeout(printView,50),{once:true});window.setTimeout(printView,400);})();</script></head><body><div class="ws-print-root"><h1>${esc(
      docTitle,
    )}</h1><div class="ws-intro">Styled detailed export. Visible holiday categories: ${esc(
      enabledCategoryLabels || "None",
    )}.</div>${monthBlocks}</div></body></html>`;
    const printableUrl = createPrintableUrl(html);
    const win = window.open("about:blank", "_blank", PRINTABLE_POPUP_FEATURES);
    if (!win) {
      revokePrintableUrl(printableUrl);
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

    let opened = false;
    if (printableUrl && typeof win.location?.replace === "function") {
      try {
        win.location.replace(printableUrl);
        opened = true;
      } catch {
        opened = false;
      }
    }

    if (!opened) {
      revokePrintableUrl(printableUrl);
      try {
        win.document.open();
        win.document.write(html);
        win.document.close();
        opened = true;
      } catch {
        opened = false;
      }
    } else {
      const cleanupUrl = () => window.setTimeout(() => revokePrintableUrl(printableUrl), 60000);
      if (typeof win.addEventListener === "function") {
        win.addEventListener("load", cleanupUrl, { once: true });
      } else {
        cleanupUrl();
      }
    }

    if (!opened) {
      const fallbackName =
        scope === "year"
          ? `worldsmith-calendar-${state.ui.year}-printable.html`
          : `worldsmith-calendar-${state.ui.year}-m${state.ui.monthIndex + 1}-printable.html`;
      downloadJsonFile(fallbackName, html, "text/html;charset=utf-8");
      setOutputStatus(
        "Printable view could not be opened safely, so a printable HTML file was downloaded instead. Open it and print to PDF.",
        "warn",
      );
      return;
    }

    setOutputStatus("Opened printable view. Use your browser print dialog to save as PDF.", "ok");
  }

  function buildIcs(scope) {
    const { ctx } = getRenderSnapshot();
    const models = buildScopeMonthModels(ctx, scope);
    const yearLayout = buildYearLayoutForYear({
      metrics: ctx.metrics,
      year: state.ui.year,
      leapRules: ctx.leapRules,
      monthLengthOverrides: ctx.monthLengthOverrides,
      intercalaryPeriods: ctx.intercalaryPeriods,
      firstYearStartDayIndex: state.ui.startDayOfYear,
    });
    const include = normalizeIcsIncludes(state.ui.icsIncludes);
    const anchorDate = normalizeIsoDate(state.ui.exportAnchorDate);
    const yearLabel = formatDisplayedYear(state.ui.year, state.ui);
    const stamp = new Date();
    const dtStamp = `${formatIcsDate(stamp)}T${String(stamp.getUTCHours()).padStart(2, "0")}${String(stamp.getUTCMinutes()).padStart(2, "0")}${String(stamp.getUTCSeconds()).padStart(2, "0")}Z`;
    const events = [];
    const seenIntercalarySpans = new Set();

    const pushSpanEvent = (absoluteStartDay, durationDays, summary, description) => {
      const safeAbsoluteDay = Math.max(0, I(absoluteStartDay, 0));
      const safeDurationDays = Math.max(1, I(durationDays, 1));
      const start = toGregorianDateFromAbsolute(safeAbsoluteDay, anchorDate);
      const end = toGregorianDateFromAbsolute(safeAbsoluteDay + safeDurationDays, anchorDate);
      const uid = `${safeAbsoluteDay}-${safeDurationDays}-${events.length + 1}@worldsmith-web`;
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
    const pushEvent = (absoluteDay, summary, description) =>
      pushSpanEvent(absoluteDay, 1, summary, description);

    for (const model of models) {
      for (const group of monthModelIntercalaryGroups(model)) {
        const firstDay = group?.days?.[0];
        const lengthDays = Math.max(0, I(group?.days?.length ?? group?.lengthDays, 0));
        if (!include.festivals || !firstDay || lengthDays <= 0) continue;
        const spanKey = `${String(group?.id || group?.name || "intercalary")}:${Math.max(
          0,
          I(firstDay.absoluteDay, 0),
        )}:${lengthDays}`;
        if (seenIntercalarySpans.has(spanKey)) continue;
        seenIntercalarySpans.add(spanKey);
        pushSpanEvent(
          firstDay.absoluteDay,
          lengthDays,
          `Intercalary: ${group?.name || "Intercalary period"}`,
          `${group?.name || "Intercalary period"} (${intercalaryPlacementLabel(
            group?.placement,
            group?.anchorMonthName,
          )} | ${intercalaryFlowLabel(group?.advancesWeekdayFlow)}) in ${yearLabel}`,
        );
      }
      for (const appended of collectAppendedIntercalarySpans(model, yearLayout)) {
        if (!include.festivals || appended.lengthDays <= 0) continue;
        const spanKey = `${appended.key}:${appended.absoluteStartDay}:${appended.lengthDays}`;
        if (seenIntercalarySpans.has(spanKey)) continue;
        seenIntercalarySpans.add(spanKey);
        pushSpanEvent(
          appended.absoluteStartDay,
          appended.lengthDays,
          `Intercalary: ${appended.name}`,
          `${appended.name} (${intercalaryPlacementLabel(
            appended.placement,
            appended.anchorMonthName,
          )} | ${intercalaryFlowLabel(appended.advancesWeekdayFlow)}) in ${yearLabel}`,
        );
      }

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

        const dayLabel = calendarCellLabel(cell, model, yearLabel);
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

      for (const group of monthModelIntercalaryGroups(model)) {
        for (const cell of group?.days || []) {
          const dayLabel = calendarCellLabel(cell, model, yearLabel);
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
      "PRODID:-//Caelum//Calendar Export//EN",
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
