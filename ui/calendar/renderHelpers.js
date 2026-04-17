import { fmt } from "../../engine/utils.js";
import { getMonthLengthsForYear } from "../../engine/usableCalendar.js";
import {
  CALENDAR_PHASES as PHASES,
  HOLIDAY_ALGORITHMS,
  HOLIDAY_ANCHOR_TYPES,
  HOLIDAY_CONFLICT_RULES,
  HOLIDAY_RELATIVE_MARKERS,
  HOLIDAY_WEEKEND_RULES,
  OCCURRENCES,
  RECURRENCES,
} from "./constants.js";
import {
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

export function holidaySummary(holiday, ctx) {
  const monthName =
    ctx.monthNames?.[clampI(holiday.startMonth, 0, ctx.monthNames.length - 1)] ||
    `Month ${clampI(holiday.startMonth, 0, 100) + 1}`;
  const recurrence = RECURRENCES.find(([v]) => v === holiday.recurrence)?.[1] || "Yearly";
  const anchorType = String(holiday?.anchor?.type || "");
  const anchorTypeLabel = HOLIDAY_ANCHOR_TYPES.find(([value]) => value === anchorType)?.[1] || "";
  const bits =
    holiday.recurrence === "one-off"
      ? [`One-off in Year ${Math.max(1, I(holiday.year, 1))}, ${monthName}`]
      : [`${recurrence} from ${monthName}`];
  if (anchorTypeLabel) bits.push(`anchor ${anchorTypeLabel}`);
  if (anchorType === "algorithmic") {
    const algoLabel =
      HOLIDAY_ALGORITHMS.find(
        ([value]) => value === String(holiday?.anchor?.algorithmKey || ""),
      )?.[1] || "algorithm";
    bits.push(`algorithm ${algoLabel}`);
  }
  bits.push(`category ${holidayCategoryLabel(holiday.category)}`);
  const rel = holiday?.relative && typeof holiday.relative === "object" ? holiday.relative : null;
  if (rel?.enabled && rel.type !== "none") {
    const offset = I(rel.offsetDays, 0);
    const offsetLabel =
      offset === 0
        ? "same day"
        : offset < 0
          ? `${Math.abs(offset)} day(s) before`
          : `${offset} day(s) after`;
    if (rel.type === "moon-phase") {
      const phase = PHASES.find(([value]) => value === rel.moonPhase)?.[1] || "Moon phase";
      const moonName =
        ctx.moonDefs.find((moonDef) => moonDef.id === rel.moonId)?.name ||
        ctx.moonDefs[clampI(rel.moonSlot, 0, ctx.moonDefs.length - 1)]?.name ||
        "moon";
      bits.push(`relative: ${offsetLabel} ${phase} on ${moonName}`);
    } else if (rel.type === "astronomy-marker") {
      const markerName =
        HOLIDAY_RELATIVE_MARKERS.find(([value]) => value === rel.markerKey)?.[1] ||
        "astronomy marker";
      bits.push(`relative: ${offsetLabel} ${markerName}`);
    } else if (rel.type === "holiday") {
      const targetHoliday =
        (ctx.holidays || []).find(
          (existingHoliday) => String(existingHoliday.id) === String(rel.holidayId),
        ) || null;
      bits.push(`relative: ${offsetLabel} ${targetHoliday?.name || "linked holiday"}`);
    } else {
      bits.push(`relative: ${offsetLabel} ${holidayRelativeKeyLabel(rel)}`);
    }
  } else {
    if (holiday.attrs?.useDate) {
      bits.push(`day ${clampI(holiday.dayOfMonth, 1, 400)}`);
    }
    if (holiday.attrs?.useWeekday) {
      const dayName =
        ctx.dayNames?.[clampI(holiday.weekday, 0, ctx.dayNames.length - 1)] ||
        `Day ${clampI(holiday.weekday, 0, 100) + 1}`;
      const occ = OCCURRENCES.find(([v]) => v === String(holiday.occurrence))?.[1] || "Any week";
      bits.push(String(holiday.occurrence) === "any" ? `weekday ${dayName}` : `${occ} ${dayName}`);
    }
    if (holiday.attrs?.useMoonPhase) {
      const phase = PHASES.find(([v]) => v === holiday.moonPhase)?.[1] || "Moon phase";
      const moonName =
        ctx.moonDefs.find((m) => m.id === holiday.moonId)?.name ||
        ctx.moonDefs[clampI(holiday.moonSlot, 0, ctx.moonDefs.length - 1)]?.name ||
        "moon";
      bits.push(`${phase} on ${moonName}`);
    }
  }
  if (I(holiday?.offsetDays, 0) !== 0) {
    const offset = I(holiday.offsetDays, 0);
    bits.push(`offset ${offset > 0 ? `+${offset}` : offset} days`);
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
    bits.push(`weekend ${label}${weekendDays ? ` (${weekendDays})` : ""}`);
  }
  if (String(holiday?.observance?.holidayConflictRule || "merge") !== "merge") {
    const label =
      HOLIDAY_CONFLICT_RULES.find(
        ([value]) => value === String(holiday?.observance?.holidayConflictRule || ""),
      )?.[1] || "conflict handling";
    bits.push(`conflict ${label}`);
  }
  if (Math.max(1, I(holiday.durationDays, 1)) > 1) {
    bits.push(`${Math.max(1, I(holiday.durationDays, 1))} days`);
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
  const issue = ctx.holidayIssueById?.[holiday.id];
  if (issue) bits.push(`disabled: ${issue}`);
  return bits.join(" | ");
}

function holidayVisibleInFilter(holiday, filters) {
  const category = normalizeHolidayCategory(holiday?.category);
  return !!(filters && typeof filters === "object" ? filters[category] : true);
}

export function applyHolidayFiltersToMonthModel(model, filters) {
  const rows = (model?.rows || []).map((row) => {
    const cells = (row?.cells || []).map((cell) => {
      if (!cell || cell.kind === "festival") return cell;
      const holidays = (cell.holidays || []).filter((holiday) =>
        holidayVisibleInFilter(holiday, filters),
      );
      const allowed = new Set(holidays.map((holiday) => String(holiday?.id || "")));
      const holidayDetails = (cell.holidayDetails || []).filter((detail) =>
        allowed.has(String(detail?.holiday?.id || "")),
      );
      return { ...cell, holidays, holidayDetails };
    });
    return { ...row, cells };
  });

  const holidayHits = new Map();
  for (const row of rows) {
    for (const cell of row.cells || []) {
      if (!cell || cell.kind === "festival") continue;
      for (const holiday of cell.holidays || []) {
        holidayHits.set(holiday.id, (holidayHits.get(holiday.id) || 0) + 1);
      }
    }
  }

  return {
    ...model,
    rows,
    holidaysInMonth: Array.from(holidayHits.entries()),
  };
}

export function festivalSummary(festival, ctx) {
  const monthName =
    ctx.monthNames?.[clampI(festival.startMonth, 0, ctx.monthNames.length - 1)] ||
    `Month ${clampI(festival.startMonth, 0, 100) + 1}`;
  const recurrence = RECURRENCES.find(([v]) => v === festival.recurrence)?.[1] || "Yearly";
  const bits =
    festival.recurrence === "one-off"
      ? [`One-off in Year ${Math.max(1, I(festival.year, 1))}, ${monthName}`]
      : [`${recurrence} from ${monthName}`];
  bits.push(`after day ${clampI(festival.afterDay, 0, 500)}`);
  if (Math.max(1, I(festival.durationDays, 1)) > 1) {
    bits.push(`${Math.max(1, I(festival.durationDays, 1))} days`);
  }
  bits.push(`category ${holidayCategoryLabel(festival.category)}`);
  bits.push(festival.outsideWeekFlow ? "outside weekday flow" : "in weekday flow");
  return bits.join(" | ");
}

export function recommendLeapRuleFromOrbit(ctx) {
  const orbitalDays = Math.max(0.000001, N(ctx?.planetOrbitalPeriodDays, 365.2422));
  const solarHours = Math.max(0.000001, N(ctx?.solarDayHours, 24));
  const localYearActual = orbitalDays / (solarHours / 24);
  const monthsPerYear = Math.max(1, I(ctx?.metrics?.monthsPerYear, 12));
  const baseYearLength = getMonthLengthsForYear({
    metrics: ctx?.metrics,
    year: 1,
    leapRules: [],
    monthLengthOverrides: ctx?.monthLengthOverrides,
  }).reduce((sum, days) => sum + days, 0);
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
