import { fmt } from "../../engine/utils.js";
import { buildYearLayoutForYear } from "../../engine/usableCalendar.js";
import {
  CALENDAR_PHASES as PHASES,
  HOLIDAY_ALGORITHMS,
  HOLIDAY_ANCHOR_TYPES,
  HOLIDAY_CONFLICT_RULES,
  HOLIDAY_CONFLICT_SCOPES,
  HOLIDAY_RELATIVE_MARKERS,
  HOLIDAY_WEEKEND_RULES,
  OCCURRENCES,
  RECUR_MONTHS,
  RECURRENCES,
} from "./constants.js";
import {
  astronomyMarkerAggregateKey,
  holidayCategoryLabel,
  holidayRelativeKeyLabel,
  normalizeHolidayCategory,
  normalizeWeekendDayIndexes,
  normalizeWeekendRule,
} from "./stateModel.js";

const N = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};
const I = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : f;
};
const clampI = (v, min, max) => Math.max(min, Math.min(max, I(v, min)));
const mod = (value, base) => (base > 0 ? ((value % base) + base) % base : 0);

function recurrenceMonthName(rule, ctx, monthsPerYear) {
  const safeMonthsPerYear = Math.max(
    1,
    I(monthsPerYear, Array.isArray(ctx?.monthNames) ? ctx.monthNames.length : 12),
  );
  const safeMonthIndex = clampI(rule?.startMonth, 0, safeMonthsPerYear - 1);
  return ctx?.monthNames?.[safeMonthIndex] || `Month ${safeMonthIndex + 1}`;
}

function recurrenceLabel(recurrence) {
  return RECURRENCES.find(([value]) => value === String(recurrence || ""))?.[1] || "Yearly";
}

export function eventRecurrenceSummary(rule, ctx, monthsPerYear) {
  const monthName = recurrenceMonthName(rule, ctx, monthsPerYear);
  const recurrence = String(rule?.recurrence || "yearly");
  if (recurrence === "one-off") {
    return `One-off in Year ${Math.max(1, I(rule?.year, 1))}, ${monthName}`;
  }
  if (recurrence === "cyclic") {
    return `Every ${Math.max(1, I(rule?.cycleYears, 1))} years from Year ${Math.max(
      1,
      I(rule?.offsetYear, 1),
    )}, ${monthName}`;
  }
  return `${recurrenceLabel(recurrence)} from ${monthName}`;
}

export function eventRecurrenceMismatchReason(rule, year, monthIndex, monthsPerYear, ctx) {
  const recurrence = String(rule?.recurrence || "yearly");
  const safeYear = Math.max(1, I(year, 1));
  const safeMonthsPerYear = Math.max(1, I(monthsPerYear, 12));
  const safeMonthIndex = clampI(monthIndex, 0, safeMonthsPerYear - 1);
  const safeStartMonth = clampI(rule?.startMonth, 0, safeMonthsPerYear - 1);
  const monthName = recurrenceMonthName(rule, ctx, safeMonthsPerYear);

  if (recurrence === "one-off") {
    if (safeYear !== Math.max(1, I(rule?.year, 1))) {
      return `One-off recurrence is only active in Year ${Math.max(1, I(rule?.year, 1))}`;
    }
    if (safeMonthIndex !== safeStartMonth) {
      return `One-off recurrence is only active in ${monthName}`;
    }
    return `One-off recurrence does not apply in this month`;
  }

  if (recurrence === "cyclic") {
    const cycleYears = Math.max(1, I(rule?.cycleYears, 1));
    const offsetYear = Math.max(1, I(rule?.offsetYear, 1));
    if (safeYear < offsetYear || mod(safeYear - offsetYear, cycleYears) !== 0) {
      return `Cyclic recurrence runs every ${cycleYears} years from Year ${offsetYear}; Year ${safeYear} is outside that cycle`;
    }
    if (safeMonthIndex !== safeStartMonth) {
      return `Cyclic recurrence only applies in ${monthName} during active years`;
    }
    return `Cyclic recurrence does not apply in this month`;
  }

  if (recurrence === "yearly") {
    return `Yearly recurrence only applies in ${monthName}`;
  }

  const intervalMonths = Math.max(1, I(RECUR_MONTHS[recurrence], safeMonthsPerYear));
  const label = recurrenceLabel(recurrence);
  const currentOrdinal = (safeYear - 1) * safeMonthsPerYear + safeMonthIndex;
  const startOrdinal = safeStartMonth;
  if (currentOrdinal < startOrdinal) {
    return `${label} recurrence begins in ${monthName}`;
  }
  return `${label} recurrence only applies every ${intervalMonths} month(s) from ${monthName}`;
}

function holidayRefName(id, ctx, fallback = "linked holiday") {
  return (
    (ctx.holidays || []).find((holiday) => String(holiday?.id || "") === String(id || ""))?.name ||
    fallback
  );
}

function holidayAnchorDetail(holiday, ctx) {
  const anchor = holiday?.anchor && typeof holiday.anchor === "object" ? holiday.anchor : {};
  const anchorType = String(anchor.type || "");
  const anchorTypeLabel =
    HOLIDAY_ANCHOR_TYPES.find(([value]) => value === anchorType)?.[1] || "Fixed date";
  if (anchorType === "algorithmic") {
    const algoLabel =
      HOLIDAY_ALGORITHMS.find(([value]) => value === String(anchor.algorithmKey || ""))?.[1] ||
      "algorithm";
    return `${anchorTypeLabel} (${algoLabel})`;
  }
  if (anchorType === "astronomy-marker") {
    const markerName =
      HOLIDAY_RELATIVE_MARKERS.find(([value]) => value === String(anchor.markerKey || ""))?.[1] ||
      "astronomy marker";
    return `${anchorTypeLabel} (${markerName})`;
  }
  if (anchorType === "holiday") {
    return `${anchorTypeLabel} (${holidayRefName(anchor.holidayId, ctx)})`;
  }
  if (anchorType === "moon-phase") {
    const phase =
      PHASES.find(([value]) => value === String(anchor.moonPhase || ""))?.[1] || "Moon phase";
    const moonName =
      ctx.moonDefs.find((moonDef) => moonDef.id === anchor.moonId)?.name ||
      ctx.moonDefs[clampI(anchor.moonSlot, 0, ctx.moonDefs.length - 1)]?.name ||
      "moon";
    return `${anchorTypeLabel} (${phase} on ${moonName})`;
  }
  return anchorTypeLabel;
}

function holidayMatchDetail(holiday, ctx) {
  const bits = [];
  if (holiday.attrs?.useDate) {
    bits.push(`day ${clampI(holiday.dayOfMonth, 1, 400)}`);
  }
  if (holiday.attrs?.useWeekday) {
    const dayName =
      ctx.dayNames?.[clampI(holiday.weekday, 0, ctx.dayNames.length - 1)] ||
      `Day ${clampI(holiday.weekday, 0, 100) + 1}`;
    const occ =
      OCCURRENCES.find(([value]) => value === String(holiday.occurrence))?.[1] || "Any week";
    bits.push(String(holiday.occurrence) === "any" ? `weekday ${dayName}` : `${occ} ${dayName}`);
  }
  if (holiday.attrs?.useMoonPhase) {
    const phase =
      PHASES.find(([value]) => value === String(holiday.moonPhase || ""))?.[1] || "Moon phase";
    const moonName =
      ctx.moonDefs.find((moonDef) => moonDef.id === holiday.moonId)?.name ||
      ctx.moonDefs[clampI(holiday.moonSlot, 0, ctx.moonDefs.length - 1)]?.name ||
      "moon";
    bits.push(`${phase} on ${moonName}`);
  }
  return bits.join(", ");
}

function holidayRelativeDetail(holiday, ctx) {
  const rel = holiday?.relative && typeof holiday.relative === "object" ? holiday.relative : null;
  if (!rel?.enabled || rel.type === "none") return "";
  const offset = I(rel.offsetDays, 0);
  const offsetLabel =
    offset === 0
      ? "same day as"
      : offset < 0
        ? `${Math.abs(offset)} day(s) before`
        : `${offset} day(s) after`;
  if (rel.type === "moon-phase") {
    const phase =
      PHASES.find(([value]) => value === String(rel.moonPhase || ""))?.[1] || "Moon phase";
    const moonName =
      ctx.moonDefs.find((moonDef) => moonDef.id === rel.moonId)?.name ||
      ctx.moonDefs[clampI(rel.moonSlot, 0, ctx.moonDefs.length - 1)]?.name ||
      "moon";
    return `${offsetLabel} ${phase} on ${moonName}`;
  }
  if (rel.type === "astronomy-marker") {
    const markerName =
      HOLIDAY_RELATIVE_MARKERS.find(([value]) => value === String(rel.markerKey || ""))?.[1] ||
      "astronomy marker";
    return `${offsetLabel} ${markerName}`;
  }
  if (rel.type === "holiday") {
    return `${offsetLabel} ${holidayRefName(rel.holidayId, ctx)}`;
  }
  return `${offsetLabel} ${holidayRelativeKeyLabel(rel)}`;
}

function holidayConflictDetail(holiday) {
  const conflictRule = String(holiday?.observance?.holidayConflictRule || "merge");
  const scope = String(holiday?.conflictScope?.appliesAgainst || "all");
  const categories = Array.isArray(holiday?.conflictScope?.categories)
    ? holiday.conflictScope.categories
    : [];
  const holidayIds = Array.isArray(holiday?.conflictScope?.holidayIds)
    ? holiday.conflictScope.holidayIds
    : [];
  const usesNonDefaultScope = scope !== "all" || categories.length > 0 || holidayIds.length > 0;
  if (conflictRule === "merge" && !usesNonDefaultScope) return "";
  const ruleLabel =
    HOLIDAY_CONFLICT_RULES.find(([value]) => value === conflictRule)?.[1] || "conflict handling";
  const scopeLabel =
    HOLIDAY_CONFLICT_SCOPES.find(([value]) => value === scope)?.[1] || "All holidays";
  let detail = `${ruleLabel} vs ${scopeLabel}`;
  if (scope === "category" && categories.length) {
    detail += ` (${categories.join(", ")})`;
  }
  if (scope === "ids" && holidayIds.length) {
    detail += ` (${holidayIds.join(", ")})`;
  }
  return detail;
}

export function holidaySummary(holiday, ctx) {
  const bits = [eventRecurrenceSummary(holiday, ctx, ctx?.metrics?.monthsPerYear)];
  bits.push(`anchor: ${holidayAnchorDetail(holiday, ctx)}`);
  const relativeDetail = holidayRelativeDetail(holiday, ctx);
  if (relativeDetail) {
    bits.push(`trigger: ${relativeDetail}`);
  } else {
    const matchDetail = holidayMatchDetail(holiday, ctx);
    if (matchDetail) bits.push(`match: ${matchDetail}`);
  }
  bits.push(`category ${holidayCategoryLabel(holiday.category)}`);
  const relativeOffset =
    holiday?.relative && typeof holiday.relative === "object" && holiday.relative.enabled
      ? I(holiday.relative.offsetDays, 0)
      : null;
  if (I(holiday?.offsetDays, 0) !== 0 && relativeOffset !== I(holiday.offsetDays, 0)) {
    const offset = I(holiday.offsetDays, 0);
    bits.push(`anchor shift: ${offset > 0 ? `+${offset}` : offset} day(s)`);
  }
  const weekendRule = normalizeWeekendRule(
    normalizeWeekendRule(ctx?.workWeekendRule) !== "none"
      ? ctx.workWeekendRule
      : holiday?.observance?.weekendRule,
  );
  if (weekendRule !== "none") {
    const label =
      HOLIDAY_WEEKEND_RULES.find(([value]) => value === weekendRule)?.[1] || "weekend shift";
    const weekendDays = normalizeWeekendDayIndexes(
      ctx?.weekendDayIndexes,
      Array.isArray(ctx?.dayNames) && ctx.dayNames.length ? ctx.dayNames.length : 7,
    )
      .map((idx) => String(ctx?.dayNames?.[idx] || `Day ${idx + 1}`))
      .join(", ");
    const maxShift = Math.max(0, I(holiday?.observance?.maxShiftDays, 7));
    const monthLimit = holiday?.observance?.stayInMonth ? ", same month only" : "";
    bits.push(
      `weekend observance: ${label}${weekendDays ? ` (${weekendDays})` : ""}, max ${maxShift} day(s)${monthLimit}`,
    );
  }
  const conflictDetail = holidayConflictDetail(holiday);
  if (conflictDetail) bits.push(`conflicts: ${conflictDetail}`);
  if (Math.max(1, I(holiday.durationDays, 1)) > 1) {
    bits.push(`duration: ${Math.max(1, I(holiday.durationDays, 1))} days`);
  }
  bits.push(
    `priority ${I(holiday.priority, 0)} (${holiday.mergeMode === "override" ? "override" : "merge"})`,
  );
  if ((holiday.exceptYears || []).length) {
    bits.push(`skip years: ${(holiday.exceptYears || []).join(", ")}`);
  }
  if ((holiday.exceptMonths || []).length) {
    bits.push(`skip months: ${(holiday.exceptMonths || []).join(", ")}`);
  }
  if ((holiday.exceptDays || []).length) {
    bits.push(`skip days: ${(holiday.exceptDays || []).join(", ")}`);
  }
  return bits.join(" | ");
}

function holidayVisibleInFilter(holiday, filters) {
  const category = normalizeHolidayCategory(holiday?.category);
  return !!(filters && typeof filters === "object" ? filters[category] : true);
}

function filterHolidayDataForDayCell(cell, filters) {
  if (!cell || cell.kind === "festival") return cell;
  const holidays = (cell.holidays || []).filter((holiday) =>
    holidayVisibleInFilter(holiday, filters),
  );
  const allowed = new Set(holidays.map((holiday) => String(holiday?.id || "")));
  const holidayDetails = (cell.holidayDetails || []).filter((detail) =>
    allowed.has(String(detail?.holiday?.id || "")),
  );
  return { ...cell, holidays, holidayDetails };
}

function filterHolidayDataForIntercalaryGroups(groups, filters) {
  return (Array.isArray(groups) ? groups : []).map((group) => ({
    ...group,
    days: (group?.days || []).map((day) => filterHolidayDataForDayCell(day, filters)),
  }));
}

export function applyHolidayFiltersToMonthModel(model, filters) {
  const rows = (model?.rows || []).map((row) => {
    const cells = (row?.cells || []).map((cell) => filterHolidayDataForDayCell(cell, filters));
    return { ...row, cells };
  });
  const intercalaryBeforeMonth = filterHolidayDataForIntercalaryGroups(
    model?.intercalaryBeforeMonth,
    filters,
  );
  const intercalaryAfterMonth = filterHolidayDataForIntercalaryGroups(
    model?.intercalaryAfterMonth,
    filters,
  );

  const holidayHits = new Map();
  const countHolidayHits = (cells) => {
    for (const cell of cells || []) {
      if (!cell || cell.kind === "festival") continue;
      for (const holiday of cell.holidays || []) {
        holidayHits.set(holiday.id, (holidayHits.get(holiday.id) || 0) + 1);
      }
    }
  };
  for (const row of rows) {
    countHolidayHits(row.cells);
  }
  for (const group of intercalaryBeforeMonth) {
    countHolidayHits(group.days);
  }
  for (const group of intercalaryAfterMonth) {
    countHolidayHits(group.days);
  }

  return {
    ...model,
    rows,
    intercalaryBeforeMonth,
    intercalaryAfterMonth,
    holidaysInMonth: Array.from(holidayHits.entries()),
  };
}

export function monthModelIntercalaryGroups(model) {
  return [
    ...(Array.isArray(model?.intercalaryBeforeMonth) ? model.intercalaryBeforeMonth : []),
    ...(Array.isArray(model?.intercalaryAfterMonth) ? model.intercalaryAfterMonth : []),
  ];
}

export function festivalSummary(festival, ctx) {
  const bits = [eventRecurrenceSummary(festival, ctx, ctx?.metrics?.monthsPerYear)];
  bits.push(`after day ${clampI(festival.afterDay, 0, 500)}`);
  if (Math.max(1, I(festival.durationDays, 1)) > 1) {
    bits.push(`${Math.max(1, I(festival.durationDays, 1))} days`);
  }
  bits.push(`category ${holidayCategoryLabel(festival.category)}`);
  bits.push(festival.outsideWeekFlow ? "outside weekday flow" : "in weekday flow");
  if ((festival.exceptYears || []).length) {
    bits.push(`skip years: ${(festival.exceptYears || []).join(", ")}`);
  }
  if ((festival.exceptMonths || []).length) {
    bits.push(`skip months: ${(festival.exceptMonths || []).join(", ")}`);
  }
  if ((festival.exceptDays || []).length) {
    bits.push(`skip days: ${(festival.exceptDays || []).join(", ")}`);
  }
  return bits.join(" | ");
}

function normalizeAuditKindFilter(kindFilter) {
  const value = String(kindFilter || "all")
    .trim()
    .toLowerCase();
  return ["all", "holiday", "festival", "intercalary", "marker", "cycle"].includes(value)
    ? value
    : "all";
}

function intercalaryAuditLocation(group) {
  const placement = String(group?.placement || "year-end");
  const anchorMonthName = String(group?.anchorMonthName || "month");
  if (placement === "before-month") return `Before ${anchorMonthName}`;
  if (placement === "after-month") return `After ${anchorMonthName}`;
  if (placement === "append-to-month") return `Within ${anchorMonthName}`;
  return `Year end after ${anchorMonthName}`;
}

function auditLocationLabel(cell, model) {
  if (cell?.kind === "intercalary") {
    return `${String(cell?.intercalaryName || "Intercalary period").trim() || "Intercalary period"} day ${Math.max(1, I(cell?.intercalaryDay, 1))}`;
  }
  return `${String(model?.monthName || "Month").trim() || "Month"} day ${Math.max(
    1,
    I(cell?.dayNumber, 1),
  )}`;
}

export function buildMonthAuditEntries(
  model,
  { kindFilter = "all", ruleId = "", limit = Number.POSITIVE_INFINITY, seenKeys } = {},
) {
  const entries = [];
  const safeLimit = Number.isFinite(Number(limit))
    ? Math.max(0, I(limit, 0))
    : Number.POSITIVE_INFINITY;
  const targetKind = normalizeAuditKindFilter(kindFilter);
  const targetRuleId = String(ruleId || "");
  const seen = seenKeys instanceof Set ? seenKeys : new Set();
  let truncated = false;

  const pushEntry = (entry) => {
    if (!entry) return true;
    const entryKind = String(entry.kind || "");
    if (targetKind !== "all" && entryKind !== targetKind) return true;
    if (targetRuleId && String(entry.ruleId || "") !== targetRuleId) return true;
    const key = String(entry.key || "");
    if (key && seen.has(key)) return true;
    if (entries.length >= safeLimit) {
      truncated = true;
      return false;
    }
    if (key) seen.add(key);
    entries.push(entry);
    return true;
  };

  const addCellEntries = (cell) => {
    if (!cell || cell.kind === "festival") return true;
    const absoluteDay = Math.max(0, I(cell.absoluteDay, 0));
    const locationLabel = auditLocationLabel(cell, model);

    for (const detail of cell.holidayDetails || []) {
      const holiday = detail?.holiday;
      if (!holiday) continue;
      const startAbs = Math.max(0, I(detail.startAbs, absoluteDay));
      const endAbs = Math.max(startAbs, I(detail.endAbs, startAbs));
      const continuity = [];
      if (detail.continuesFromPrev) continuity.push("continues from earlier");
      if (detail.continuesToNext) continuity.push("continues later");
      if (
        !pushEntry({
          kind: "holiday",
          key: `holiday:${String(holiday.id || "")}:${startAbs}:${endAbs}`,
          ruleId: String(holiday.id || ""),
          absoluteDay,
          focusDay: Math.max(1, I(cell?.mappedDayOfMonth ?? cell?.dayNumber, 1)),
          year: Math.max(1, I(model?.year, 1)),
          monthIndex: Math.max(0, I(model?.monthIndex, 0)),
          monthName: String(model?.monthName || "Month"),
          locationLabel,
          title: String(holiday.name || "Holiday").trim() || "Holiday",
          summary: [
            `category ${holidayCategoryLabel(holiday.category)}`,
            Math.max(1, endAbs - startAbs + 1) > 1
              ? `${Math.max(1, endAbs - startAbs + 1)} day span`
              : "1 day",
            ...continuity,
          ]
            .filter(Boolean)
            .join(" | "),
          category: normalizeHolidayCategory(holiday.category),
          colorTag: String(holiday.colorTag || "gold"),
        })
      ) {
        return false;
      }
    }

    for (const marker of cell.markers || []) {
      const markerKey = astronomyMarkerAggregateKey(marker);
      if (
        !pushEntry({
          kind: "marker",
          key: `marker:${markerKey}:${absoluteDay}`,
          ruleId: String(markerKey || marker?.key || ""),
          absoluteDay,
          focusDay: Math.max(1, I(cell?.mappedDayOfMonth ?? cell?.dayNumber, 1)),
          year: Math.max(1, I(model?.year, 1)),
          monthIndex: Math.max(0, I(model?.monthIndex, 0)),
          monthName: String(model?.monthName || "Month"),
          locationLabel,
          title: String(marker?.name || "Astronomy marker").trim() || "Astronomy marker",
          summary: [
            marker?.sourceLabel ? `source ${marker.sourceLabel}` : null,
            marker?.sourceMoonName ? `moon ${marker.sourceMoonName}` : null,
          ]
            .filter(Boolean)
            .join(" | "),
        })
      ) {
        return false;
      }
    }

    for (const cycle of cell.cycles || []) {
      const cycleRuleId = String(cycle?.ruleId || cycle?.ruleName || "");
      if (
        !pushEntry({
          kind: "cycle",
          key: `cycle:${cycleRuleId}:${String(cycle?.kind || "cycle")}:${absoluteDay}`,
          ruleId: cycleRuleId,
          absoluteDay,
          focusDay: Math.max(1, I(cell?.mappedDayOfMonth ?? cell?.dayNumber, 1)),
          year: Math.max(1, I(model?.year, 1)),
          monthIndex: Math.max(0, I(model?.monthIndex, 0)),
          monthName: String(model?.monthName || "Month"),
          locationLabel,
          title: String(cycle?.ruleName || "Cycle").trim() || "Cycle",
          summary: [
            String(cycle?.label || "Cycle").trim() || "Cycle",
            cycle?.kind === "interval"
              ? `every ${Math.max(1, I(cycle?.intervalDays, 1))} day(s)`
              : `day ${Math.max(1, I(cycle?.dayInCycle, 1))}/${Math.max(1, I(cycle?.cycleLength, 1))}`,
          ]
            .filter(Boolean)
            .join(" | "),
        })
      ) {
        return false;
      }
    }

    return true;
  };

  const addFestivalEntry = (festival) =>
    pushEntry({
      kind: "festival",
      key:
        `festival:${String(festival?.id || "")}:` +
        `${Math.max(1, I(model?.year, 1))}:${Math.max(0, I(model?.monthIndex, 0))}:` +
        `${Math.max(0, I(festival?.afterDay, 0))}:${Math.max(1, I(festival?.segment, 1))}:` +
        `${Math.max(1, I(festival?.segmentCount, 1))}:${festival?.outsideWeekFlow ? 1 : 0}`,
      ruleId: String(festival?.id || ""),
      absoluteDay: null,
      year: Math.max(1, I(model?.year, 1)),
      monthIndex: Math.max(0, I(model?.monthIndex, 0)),
      monthName: String(model?.monthName || "Month"),
      afterDay: Math.max(0, I(festival?.afterDay, 0)),
      focusDay: clampI(I(festival?.afterDay, 0) + 1, 1, Math.max(1, I(model?.monthLength, 1))),
      locationLabel:
        `${String(model?.monthName || "Month").trim() || "Month"}, after day ` +
        `${Math.max(0, I(festival?.afterDay, 0))}`,
      title: String(festival?.name || "Festival").trim() || "Festival",
      summary: [
        `category ${holidayCategoryLabel(festival?.category)}`,
        Math.max(1, I(festival?.segmentCount, 1)) > 1
          ? `segment ${Math.max(1, I(festival?.segment, 1))}/${Math.max(1, I(festival?.segmentCount, 1))}`
          : "1 day",
        festival?.outsideWeekFlow ? "outside weekday flow" : "in weekday flow",
      ]
        .filter(Boolean)
        .join(" | "),
      category: normalizeHolidayCategory(festival?.category),
      colorTag: String(festival?.colorTag || "gold"),
    });

  const addIntercalaryGroup = (group) =>
    pushEntry({
      kind: "intercalary",
      key:
        `intercalary:${String(group?.id || "")}:` +
        `${Math.max(0, I(group?.days?.[0]?.absoluteDay, 0))}:${String(group?.placement || "year-end")}`,
      ruleId: String(group?.id || ""),
      absoluteDay:
        group?.days && Number.isFinite(Number(group.days[0]?.absoluteDay))
          ? Math.max(0, I(group.days[0].absoluteDay, 0))
          : null,
      focusDay:
        group?.days && Number.isFinite(Number(group.days[0]?.mappedDayOfMonth))
          ? Math.max(1, I(group.days[0].mappedDayOfMonth, 1))
          : 1,
      year: Math.max(1, I(model?.year, 1)),
      monthIndex: Math.max(0, I(model?.monthIndex, 0)),
      monthName: String(model?.monthName || "Month"),
      locationLabel: intercalaryAuditLocation(group),
      title: String(group?.name || "Intercalary period").trim() || "Intercalary period",
      summary: [
        `${Math.max(1, I(group?.lengthDays, 1))} day${Math.max(1, I(group?.lengthDays, 1)) === 1 ? "" : "s"}`,
        group?.advancesWeekdayFlow ? "advances weekday flow" : "outside weekday flow",
      ].join(" | "),
    });

  for (const group of model?.intercalaryBeforeMonth || []) {
    if (!addIntercalaryGroup(group)) return { entries, truncated };
    for (const day of group?.days || []) {
      if (!addCellEntries(day)) return { entries, truncated };
    }
  }

  for (const row of model?.rows || []) {
    for (const cell of row?.cells || []) {
      if (!cell) continue;
      if (cell.kind === "festival") {
        if (!addFestivalEntry(cell.festival)) return { entries, truncated };
        continue;
      }
      if (!addCellEntries(cell)) return { entries, truncated };
    }
  }

  for (const group of model?.intercalaryAfterMonth || []) {
    if (!addIntercalaryGroup(group)) return { entries, truncated };
    for (const day of group?.days || []) {
      if (!addCellEntries(day)) return { entries, truncated };
    }
  }

  for (const festival of model?.outsideWeekFlowFestivals || []) {
    if (!addFestivalEntry(festival)) return { entries, truncated };
  }

  return { entries, truncated };
}

export function recommendLeapRuleFromOrbit(ctx) {
  const orbitalDays = Math.max(0.000001, N(ctx?.planetOrbitalPeriodDays, 365.2422));
  const solarHours = Math.max(0.000001, N(ctx?.solarDayHours, 24));
  const localYearActual = orbitalDays / (solarHours / 24);
  const monthsPerYear = Math.max(1, I(ctx?.metrics?.monthsPerYear, 12));
  const baseYearLength = buildYearLayoutForYear({
    metrics: ctx?.metrics,
    year: 1,
    leapRules: [],
    monthLengthOverrides: ctx?.monthLengthOverrides,
    intercalaryPeriods: ctx?.intercalaryPeriods,
  }).yearLengthDays;
  const delta = localYearActual - baseYearLength;
  const absDelta = Math.abs(delta);

  if (!(absDelta > 0.000001)) {
    return {
      ok: false,
      message: "No leap rule needed: baseline year already matches orbital year closely.",
    };
  }

  const maxCycleYears = 5000;
  let bestCycleYears = 1;
  let bestError = Number.POSITIVE_INFINITY;
  for (let cycleYears = 1; cycleYears <= maxCycleYears; cycleYears += 1) {
    const correction = cycleYears * absDelta;
    const error = Math.abs(correction - 1);
    if (
      error < bestError - 1e-12 ||
      (Math.abs(error - bestError) <= 1e-12 && cycleYears < bestCycleYears)
    ) {
      bestError = error;
      bestCycleYears = cycleYears;
    }
  }

  const dayDelta = delta >= 0 ? 1 : -1;
  const monthIndex = Math.max(0, monthsPerYear - 1);
  const driftPerCycle = bestError;
  const driftPerYear = driftPerCycle / bestCycleYears;
  const quality = driftPerCycle <= 0.02 ? "high" : driftPerCycle <= 0.08 ? "medium" : "low";
  const verb = dayDelta > 0 ? "Add" : "Subtract";
  return {
    ok: true,
    cycleYears: bestCycleYears,
    dayDelta,
    monthIndex,
    driftPerCycle,
    driftPerYear,
    quality,
    localYearActual,
    baseYearLength,
    ruleName: `${verb} 1 day every ${bestCycleYears} years`,
    message:
      `${verb} 1 day every ${bestCycleYears} years ` +
      `(drift ${fmt(driftPerCycle, 4)} d/cycle, ${fmt(driftPerYear, 6)} d/year; quality ${quality}).`,
  };
}
