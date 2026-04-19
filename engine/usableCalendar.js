// Usable calendar engine
//
// Builds fully-rendered calendar months from a configurable calendar
// model, supporting solar, lunar, and lunisolar bases. Handles
// week-day layout, leap-rule intercalation, holiday overlays, and
// per-day moon-phase calculation.
//
// Inputs:  calendar model object (basis metrics, day/week/month names,
//          leap rules, holidays, moon synodic period & epoch offset),
//          target year and month index.
// Outputs: structured month grid (rows of week cells with day numbers,
//          moon phase info, holiday annotations), plus header labels,
//          month lengths, and full/new moon day lists.

import { clamp, toFinite } from "./utils.js";

const DEFAULT_BASIS = "solar";

function toInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function positiveInt(value, fallback, min = 1) {
  return Math.max(min, toInt(value, fallback));
}

function mod(value, base) {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) return 0;
  return ((value % base) + base) % base;
}

function splitNameInput(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  return raw
    .split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Extracts normalised calendar metrics (months, days, week structure)
 * for the given basis mode (solar, lunar, or lunisolar).
 *
 * @param {object} calendarModel - Full calendar model containing solar,
 *   lunar, and lunisolar sub-objects with month/week configuration.
 * @param {string} [basis="solar"] - Calendar basis: "solar", "lunar",
 *   or "lunisolar".
 * @returns {{ basis: string, monthsPerYear: number, daysPerMonth: number,
 *   daysPerWeek: number, weeksPerMonth: number, intercalaryDays: number }}
 *   Normalised metrics for the selected basis.
 */
export function getCalendarBasisMetrics(calendarModel, basis = DEFAULT_BASIS) {
  const mode = String(basis || DEFAULT_BASIS).toLowerCase();
  if (mode === "lunar") {
    return {
      basis: "lunar",
      monthsPerYear: positiveInt(calendarModel?.lunar?.monthsPerYear, 12),
      daysPerMonth: Math.max(1, Math.round(toFinite(calendarModel?.lunar?.commonMonthLength, 30))),
      daysPerWeek: positiveInt(calendarModel?.lunar?.week?.daysPerWeek, 7),
      weeksPerMonth: positiveInt(calendarModel?.lunar?.week?.weeksPerMonth, 4),
      intercalaryDays: Math.round(toFinite(calendarModel?.lunar?.week?.intercalaryDays, 0)),
    };
  }
  if (mode === "lunisolar") {
    return {
      basis: "lunisolar",
      monthsPerYear: positiveInt(calendarModel?.lunisolar?.monthsPerCommonYear, 12),
      daysPerMonth: Math.max(
        1,
        Math.round(toFinite(calendarModel?.lunisolar?.commonMonthLength, 30)),
      ),
      daysPerWeek: positiveInt(calendarModel?.lunisolar?.week?.daysPerWeek, 7),
      weeksPerMonth: positiveInt(calendarModel?.lunisolar?.week?.weeksPerMonth, 4),
      intercalaryDays: Math.round(toFinite(calendarModel?.lunisolar?.week?.intercalaryDays, 0)),
    };
  }
  return {
    basis: "solar",
    monthsPerYear: positiveInt(calendarModel?.solar?.monthsPerYear, 12),
    daysPerMonth: Math.max(1, Math.round(toFinite(calendarModel?.solar?.daysPerMonth, 30))),
    daysPerWeek: positiveInt(calendarModel?.solar?.week?.daysPerWeek, 7),
    weeksPerMonth: positiveInt(calendarModel?.solar?.week?.weeksPerMonth, 4),
    intercalaryDays: Math.round(toFinite(calendarModel?.solar?.intercalaryDays, 0)),
  };
}

/**
 * Normalises a raw name list (string, array, or absent) into an array
 * of exactly `count` entries, filling gaps with numbered fallbacks.
 *
 * @param {string|string[]|undefined} raw - Comma- or newline-separated
 *   string, an array of names, or undefined.
 * @param {number} count - Required number of output entries.
 * @param {string} fallbackPrefix - Prefix for auto-generated names
 *   (e.g. "Day" produces "Day 1", "Day 2", ...).
 * @returns {string[]} Array of exactly `count` trimmed name strings.
 */
export function normalizeNameList(raw, count, fallbackPrefix) {
  const expected = positiveInt(count, 1);
  const source = splitNameInput(raw);
  const out = [];
  for (let i = 0; i < expected; i++) {
    const name = String(source[i] || "").trim();
    out.push(name || `${fallbackPrefix} ${i + 1}`);
  }
  return out;
}

/**
 * Validates and normalises an array of per-month day-count overrides.
 * Entries that are null, undefined, or non-positive fall back to the
 * base daysPerMonth (represented as null in the output).
 *
 * @param {(number|string|null|undefined)[]|undefined} overrides - Raw
 *   per-month override values (one per month).
 * @param {number} monthsPerYear - Number of months in the calendar year.
 * @returns {(number|null)[]} Array of exactly `monthsPerYear` entries.
 */
export function normalizeMonthLengthOverrides(overrides, monthsPerYear) {
  const count = positiveInt(monthsPerYear, 1);
  const source = Array.isArray(overrides) ? overrides : [];
  const out = [];
  for (let i = 0; i < count; i++) {
    const n = toInt(source[i], NaN);
    out.push(Number.isFinite(n) && n >= 1 ? Math.min(n, 500) : null);
  }
  return out;
}

/**
 * Validates and normalises an array of leap-year intercalation rules.
 * Each rule specifies a cycle length, offset year, target month, and
 * day delta. Rules with a zero delta are discarded.
 *
 * @param {object[]|undefined} rules - Raw leap rule objects, each with
 *   optional id, name, cycleYears, offsetYear, monthIndex, and dayDelta.
 * @param {number} monthsPerYear - Number of months in the calendar year
 *   (used to clamp monthIndex).
 * @returns {{ id: string, name: string, cycleYears: number,
 *   offsetYear: number, monthIndex: number, dayDelta: number }[]}
 *   Normalised leap rules with non-zero deltas.
 */
export function normalizeLeapRules(rules, monthsPerYear) {
  const maxMonthIndex = Math.max(0, positiveInt(monthsPerYear, 1) - 1);
  return (Array.isArray(rules) ? rules : [])
    .map((rule, idx) => {
      const id = String(rule?.id || `rule-${idx + 1}`);
      const name = String(rule?.name || "").trim() || `Leap Rule ${idx + 1}`;
      const cycleYears = positiveInt(rule?.cycleYears, 4);
      const offsetYear = Math.max(1, positiveInt(rule?.offsetYear, 1));
      const monthIndex = clamp(toInt(rule?.monthIndex, 0), 0, maxMonthIndex);
      const dayDelta = clamp(toInt(rule?.dayDelta, 1), -30, 30);
      return { id, name, cycleYears, offsetYear, monthIndex, dayDelta };
    })
    .filter((rule) => rule.dayDelta !== 0);
}

/**
 * Validates and normalises an array of holiday definitions. Entries
 * without a name are discarded.
 *
 * @param {object[]|undefined} holidays - Raw holiday objects, each with
 *   optional id, name, monthIndex, and day.
 * @param {number} monthsPerYear - Number of months in the calendar year
 *   (used to clamp monthIndex).
 * @returns {{ id: string, name: string, monthIndex: number,
 *   day: number }[]} Normalised holidays with non-empty names.
 */
export function normalizeHolidays(holidays, monthsPerYear) {
  const maxMonthIndex = Math.max(0, positiveInt(monthsPerYear, 1) - 1);
  return (Array.isArray(holidays) ? holidays : [])
    .map((holiday, idx) => {
      const id = String(holiday?.id || `holiday-${idx + 1}`);
      const name = String(holiday?.name || "").trim();
      const monthIndex = clamp(toInt(holiday?.monthIndex, 0), 0, maxMonthIndex);
      const day = positiveInt(holiday?.day, 1);
      return { id, name, monthIndex, day };
    })
    .filter((holiday) => holiday.name);
}

function isLeapRuleActive(rule, year) {
  const cycle = positiveInt(rule?.cycleYears, 1);
  const offset = Math.max(1, positiveInt(rule?.offsetYear, 1));
  return mod(year - offset, cycle) === 0;
}

function parseYearList(raw) {
  if (Array.isArray(raw)) {
    const out = [];
    const seen = new Set();
    for (const value of raw) {
      const year = Math.max(1, positiveInt(value, NaN));
      if (!Number.isFinite(year) || seen.has(year)) continue;
      seen.add(year);
      out.push(year);
    }
    return out.sort((a, b) => a - b);
  }

  const text = String(raw || "").trim();
  if (!text) return [];

  const out = [];
  const seen = new Set();
  for (const token of text.split(/[\s,;|]+/g)) {
    const year = Math.max(1, positiveInt(token, NaN));
    if (!Number.isFinite(year) || seen.has(year)) continue;
    seen.add(year);
    out.push(year);
  }
  return out.sort((a, b) => a - b);
}

function normalizeIntercalaryPeriod(period, index, monthsPerYear) {
  const raw = period && typeof period === "object" ? period : {};
  const maxMonthIndex = Math.max(0, positiveInt(monthsPerYear, 1) - 1);
  const placement = String(raw?.placement || "")
    .trim()
    .toLowerCase();
  const durationMode = String(raw?.durationMode || "")
    .trim()
    .toLowerCase();
  const weekdayFlowMode = String(raw?.weekdayFlowMode || "")
    .trim()
    .toLowerCase();
  const recurrence = String(raw?.recurrence || "")
    .trim()
    .toLowerCase();

  const normalizedPlacement = [
    "append-to-month",
    "before-month",
    "after-month",
    "year-end",
  ].includes(placement)
    ? placement
    : "year-end";
  const normalizedDurationMode = ["fixed", "derived-remainder"].includes(durationMode)
    ? durationMode
    : "fixed";
  const normalizedWeekdayFlowMode = ["in-flow", "outside-flow"].includes(weekdayFlowMode)
    ? weekdayFlowMode
    : "in-flow";
  const normalizedRecurrence = ["yearly", "one-off", "cyclic"].includes(recurrence)
    ? recurrence
    : "yearly";

  const anchorMonthIndex =
    raw?.anchorMonthIndex == null || raw.anchorMonthIndex === ""
      ? null
      : clamp(toInt(raw.anchorMonthIndex, maxMonthIndex), 0, maxMonthIndex);

  return {
    id: String(raw?.id || `intercalary-${index + 1}`),
    name: String(raw?.name || "").trim(),
    placement: normalizedPlacement,
    anchorMonthIndex,
    recurrence: normalizedRecurrence,
    year: Math.max(1, positiveInt(raw?.year ?? raw?.startYear ?? 1, 1)),
    cycleYears: Math.max(1, positiveInt(raw?.cycleYears ?? 1, 1)),
    offsetYear: Math.max(1, positiveInt(raw?.offsetYear ?? 1, 1)),
    durationMode: normalizedDurationMode,
    durationDays:
      normalizedDurationMode === "derived-remainder"
        ? null
        : Math.max(1, positiveInt(raw?.durationDays ?? 1, 1)),
    weekdayFlowMode: normalizedWeekdayFlowMode,
    exceptYears: parseYearList(raw?.exceptYears ?? raw?.skipYears ?? []),
    legacyCompatibility: !!raw?.legacyCompatibility,
  };
}

function normalizeIntercalaryPeriodsForYear(intercalaryPeriods, metrics) {
  const monthsPerYear = positiveInt(metrics?.monthsPerYear, 12);
  if (intercalaryPeriods === undefined) {
    const legacyDays = toInt(metrics?.intercalaryDays, 0);
    if (legacyDays === 0) return [];
    return [
      normalizeIntercalaryPeriod(
        {
          id: "__legacy-metrics-intercalary__",
          name: "Year-end remainder",
          placement: "append-to-month",
          anchorMonthIndex: monthsPerYear - 1,
          recurrence: "yearly",
          year: 1,
          cycleYears: 1,
          offsetYear: 1,
          durationMode: "derived-remainder",
          weekdayFlowMode: "in-flow",
          legacyCompatibility: true,
        },
        0,
        monthsPerYear,
      ),
    ];
  }

  return (Array.isArray(intercalaryPeriods) ? intercalaryPeriods : [])
    .map((period, index) => normalizeIntercalaryPeriod(period, index, monthsPerYear))
    .filter((period) => period.name || period.legacyCompatibility);
}

function isIntercalaryPeriodActive(period, year) {
  const safeYear = Math.max(1, positiveInt(year, 1));
  if ((period?.exceptYears || []).includes(safeYear)) return false;

  if (period?.recurrence === "one-off") {
    return safeYear === Math.max(1, positiveInt(period?.year, 1));
  }
  if (period?.recurrence === "cyclic") {
    const cycle = Math.max(1, positiveInt(period?.cycleYears, 1));
    const offset = Math.max(1, positiveInt(period?.offsetYear, 1));
    return mod(safeYear - offset, cycle) === 0;
  }
  return safeYear >= Math.max(1, positiveInt(period?.year, 1));
}

function resolveIntercalaryAnchorMonth(period, monthsPerYear) {
  if (String(period?.placement || "") === "year-end") return null;
  const fallback = Math.max(0, positiveInt(monthsPerYear, 1) - 1);
  if (period?.anchorMonthIndex == null) return fallback;
  return clamp(toInt(period.anchorMonthIndex, fallback), 0, fallback);
}

export function createYearLayoutRuntime() {
  return {
    daysBeforeYear: new Map([[1, 0]]),
    weekdayAdvancingDaysBeforeYear: new Map([[1, 0]]),
    yearLayouts: new Map(),
  };
}

function buildYearLayoutCacheKey({
  metrics,
  year,
  leapRules,
  monthLengthOverrides,
  intercalaryPeriods,
  firstYearStartDayIndex,
}) {
  return JSON.stringify({
    metrics: {
      monthsPerYear: positiveInt(metrics?.monthsPerYear, 12),
      daysPerMonth: Math.max(1, positiveInt(metrics?.daysPerMonth, 30)),
      daysPerWeek: positiveInt(metrics?.daysPerWeek, 7),
      weeksPerMonth: positiveInt(metrics?.weeksPerMonth, 4),
      intercalaryDays: toInt(metrics?.intercalaryDays, 0),
    },
    year: Math.max(1, positiveInt(year, 1)),
    leapRules: normalizeLeapRules(leapRules, positiveInt(metrics?.monthsPerYear, 12)),
    monthLengthOverrides: normalizeMonthLengthOverrides(
      monthLengthOverrides,
      positiveInt(metrics?.monthsPerYear, 12),
    ),
    intercalaryPeriods: normalizeIntercalaryPeriodsForYear(intercalaryPeriods, metrics),
    firstYearStartDayIndex: mod(
      toInt(firstYearStartDayIndex, 0),
      positiveInt(metrics?.daysPerWeek, 7),
    ),
  });
}

function sumSegmentLengths(segments) {
  return segments.reduce((sum, segment) => sum + Math.max(0, toInt(segment?.lengthDays, 0)), 0);
}

function resolveYearStructure({
  metrics,
  year,
  leapRules = [],
  monthLengthOverrides = [],
  intercalaryPeriods,
}) {
  const safeYear = Math.max(1, positiveInt(year, 1));
  const monthsPerYear = positiveInt(metrics?.monthsPerYear, 12);
  const baseDaysPerMonth = Math.max(1, positiveInt(metrics?.daysPerMonth, 30));
  const normalizedOverrides = normalizeMonthLengthOverrides(monthLengthOverrides, monthsPerYear);
  const normalizedLeapRules = normalizeLeapRules(leapRules, monthsPerYear);
  const normalizedIntercalaryPeriods = normalizeIntercalaryPeriodsForYear(
    intercalaryPeriods,
    metrics,
  );
  const activeIntercalaryPeriods = normalizedIntercalaryPeriods.filter((period) =>
    isIntercalaryPeriodActive(period, safeYear),
  );

  const baseMonthLengths = Array.from(
    { length: monthsPerYear },
    (_, index) => normalizedOverrides[index] ?? baseDaysPerMonth,
  );
  const appendAdjustmentsByMonth = Array.from({ length: monthsPerYear }, () => []);
  const beforeMonthSegments = new Map();
  const afterMonthSegments = new Map();
  const yearEndSegments = [];

  const addPlacementSegment = (period, lengthDays) => {
    const resolvedLength = Math.max(0, toInt(lengthDays, 0));
    if (resolvedLength <= 0) return;
    const anchorMonthIndex = resolveIntercalaryAnchorMonth(period, monthsPerYear);
    const resolved = {
      intercalaryPeriodId: period.id,
      placement: period.placement,
      anchorMonthIndex,
      lengthDays: resolvedLength,
      advancesWeekdayFlow: String(period.weekdayFlowMode || "in-flow") !== "outside-flow",
      weekdayFlowMode: String(period.weekdayFlowMode || "in-flow"),
      legacyCompatibility: !!period.legacyCompatibility,
      name: period.name,
    };
    if (period.placement === "year-end") {
      yearEndSegments.push(resolved);
      return;
    }
    if (period.placement === "before-month") {
      if (!beforeMonthSegments.has(anchorMonthIndex)) beforeMonthSegments.set(anchorMonthIndex, []);
      beforeMonthSegments.get(anchorMonthIndex).push(resolved);
      return;
    }
    if (period.placement === "after-month") {
      if (!afterMonthSegments.has(anchorMonthIndex)) afterMonthSegments.set(anchorMonthIndex, []);
      afterMonthSegments.get(anchorMonthIndex).push(resolved);
    }
  };

  for (const period of activeIntercalaryPeriods) {
    if (period.durationMode !== "fixed") continue;
    if (period.placement === "append-to-month") {
      const anchorMonthIndex = resolveIntercalaryAnchorMonth(period, monthsPerYear);
      appendAdjustmentsByMonth[anchorMonthIndex].push({
        intercalaryPeriodId: period.id,
        lengthDays: Math.max(0, toInt(period.durationDays, 0)),
        advancesWeekdayFlow: String(period.weekdayFlowMode || "in-flow") !== "outside-flow",
        weekdayFlowMode: String(period.weekdayFlowMode || "in-flow"),
        legacyCompatibility: !!period.legacyCompatibility,
        name: period.name,
      });
      continue;
    }
    addPlacementSegment(period, period.durationDays);
  }

  const fixedAppendDays = appendAdjustmentsByMonth.reduce(
    (sum, list) => sum + list.reduce((inner, item) => inner + item.lengthDays, 0),
    0,
  );
  const fixedNonAppendDays =
    sumSegmentLengths([...beforeMonthSegments.values()].flat()) +
    sumSegmentLengths([...afterMonthSegments.values()].flat()) +
    sumSegmentLengths(yearEndSegments);

  const derivedPeriod =
    activeIntercalaryPeriods.find((period) => period.durationMode === "derived-remainder") || null;
  if (derivedPeriod) {
    let derivedLengthDays = 0;
    if (derivedPeriod.legacyCompatibility) {
      derivedLengthDays = toInt(metrics?.intercalaryDays, 0);
    } else {
      const resolvedYearTarget =
        monthsPerYear * baseDaysPerMonth + toInt(metrics?.intercalaryDays, 0);
      derivedLengthDays =
        resolvedYearTarget -
        baseMonthLengths.reduce((sum, days) => sum + days, 0) -
        fixedAppendDays -
        fixedNonAppendDays;
    }
    if (derivedPeriod.placement === "append-to-month") {
      const anchorMonthIndex = resolveIntercalaryAnchorMonth(derivedPeriod, monthsPerYear);
      appendAdjustmentsByMonth[anchorMonthIndex].push({
        intercalaryPeriodId: derivedPeriod.id,
        lengthDays: toInt(derivedLengthDays, 0),
        advancesWeekdayFlow: String(derivedPeriod.weekdayFlowMode || "in-flow") !== "outside-flow",
        weekdayFlowMode: String(derivedPeriod.weekdayFlowMode || "in-flow"),
        legacyCompatibility: !!derivedPeriod.legacyCompatibility,
        name: derivedPeriod.name,
      });
    } else {
      addPlacementSegment(derivedPeriod, derivedLengthDays);
    }
  }

  const monthLengths = baseMonthLengths.map((baseLength, monthIndex) => {
    const appendedDelta = appendAdjustmentsByMonth[monthIndex].reduce(
      (sum, item) => sum + toInt(item.lengthDays, 0),
      0,
    );
    return Math.max(1, baseLength + appendedDelta);
  });

  for (const rule of normalizedLeapRules) {
    if (!isLeapRuleActive(rule, safeYear)) continue;
    const monthIndex = clamp(toInt(rule.monthIndex, 0), 0, monthsPerYear - 1);
    monthLengths[monthIndex] = Math.max(1, monthLengths[monthIndex] + toInt(rule.dayDelta, 0));
  }

  return {
    monthsPerYear,
    monthLengths,
    appendAdjustmentsByMonth,
    beforeMonthSegments,
    afterMonthSegments,
    yearEndSegments,
  };
}

function getDaysBeforeYearInternal(options, runtime) {
  const safeYear = Math.max(1, positiveInt(options?.year, 1));
  if (runtime.daysBeforeYear.has(safeYear)) return runtime.daysBeforeYear.get(safeYear);

  let highestKnownYear = 1;
  for (const cachedYear of runtime.daysBeforeYear.keys()) {
    if (cachedYear <= safeYear && cachedYear > highestKnownYear) highestKnownYear = cachedYear;
  }

  let total = runtime.daysBeforeYear.get(highestKnownYear) || 0;
  for (let currentYear = highestKnownYear; currentYear < safeYear; currentYear++) {
    const yearLength = buildYearLayoutForYearInternal(
      { ...options, year: currentYear },
      runtime,
    ).yearLengthDays;
    total += yearLength;
    runtime.daysBeforeYear.set(currentYear + 1, total);
  }
  return runtime.daysBeforeYear.get(safeYear) || 0;
}

function getWeekdayAdvancingDaysBeforeYearInternal(options, runtime) {
  const safeYear = Math.max(1, positiveInt(options?.year, 1));
  if (runtime.weekdayAdvancingDaysBeforeYear.has(safeYear)) {
    return runtime.weekdayAdvancingDaysBeforeYear.get(safeYear);
  }

  let highestKnownYear = 1;
  for (const cachedYear of runtime.weekdayAdvancingDaysBeforeYear.keys()) {
    if (cachedYear <= safeYear && cachedYear > highestKnownYear) highestKnownYear = cachedYear;
  }

  let total = runtime.weekdayAdvancingDaysBeforeYear.get(highestKnownYear) || 0;
  for (let currentYear = highestKnownYear; currentYear < safeYear; currentYear++) {
    const weekdayAdvancingDays = buildYearLayoutForYearInternal(
      { ...options, year: currentYear },
      runtime,
    ).weekdayAdvancingDays;
    total += weekdayAdvancingDays;
    runtime.weekdayAdvancingDaysBeforeYear.set(currentYear + 1, total);
  }
  return runtime.weekdayAdvancingDaysBeforeYear.get(safeYear) || 0;
}

function buildYearLayoutForYearInternal(
  {
    metrics,
    year = 1,
    leapRules = [],
    monthLengthOverrides = [],
    intercalaryPeriods,
    firstYearStartDayIndex = 0,
  },
  runtime,
) {
  const options = {
    metrics,
    year,
    leapRules,
    monthLengthOverrides,
    intercalaryPeriods,
    firstYearStartDayIndex,
  };
  const cacheKey = buildYearLayoutCacheKey(options);
  if (runtime.yearLayouts.has(cacheKey)) return runtime.yearLayouts.get(cacheKey);

  const safeYear = Math.max(1, positiveInt(year, 1));
  const daysPerWeek = positiveInt(metrics?.daysPerWeek, 7);
  const firstStartWeekday = mod(toInt(firstYearStartDayIndex, 0), daysPerWeek);
  const yearAbsoluteStart = getDaysBeforeYearInternal({ ...options, year: safeYear }, runtime);
  const weekdayAdvancingDaysBeforeYear = getWeekdayAdvancingDaysBeforeYearInternal(
    { ...options, year: safeYear },
    runtime,
  );
  const yearStartWeekdayIndex = mod(
    firstStartWeekday + weekdayAdvancingDaysBeforeYear,
    daysPerWeek,
  );
  const structure = resolveYearStructure(options);

  let absoluteCursor = yearAbsoluteStart;
  let weekdayCursor = yearStartWeekdayIndex;
  let weekdayAdvancingDays = 0;
  const monthSegments = Array.from({ length: structure.monthsPerYear }, () => null);
  const segments = [];

  const pushIntercalarySegments = (items) => {
    for (const item of items || []) {
      const lengthDays = Math.max(0, toInt(item.lengthDays, 0));
      if (lengthDays <= 0) continue;
      const segment = {
        kind: "intercalary",
        year: safeYear,
        monthIndex: item.anchorMonthIndex,
        lengthDays,
        absoluteStartDay: absoluteCursor,
        dayOfYearStart: absoluteCursor - yearAbsoluteStart,
        startWeekdayIndex: weekdayCursor,
        advancesWeekdayFlow: !!item.advancesWeekdayFlow,
        intercalaryPeriodId: item.intercalaryPeriodId,
        placement: item.placement,
        anchorMonthIndex: item.anchorMonthIndex,
        weekdayFlowMode: item.weekdayFlowMode,
        legacyCompatibility: !!item.legacyCompatibility,
        name: item.name,
      };
      segments.push(segment);
      absoluteCursor += lengthDays;
      if (segment.advancesWeekdayFlow) {
        weekdayCursor = mod(weekdayCursor + lengthDays, daysPerWeek);
        weekdayAdvancingDays += lengthDays;
      }
    }
  };

  for (let monthIndex = 0; monthIndex < structure.monthsPerYear; monthIndex++) {
    pushIntercalarySegments(structure.beforeMonthSegments.get(monthIndex));

    const monthLength = Math.max(1, toInt(structure.monthLengths[monthIndex], 1));
    const segment = {
      kind: "month",
      year: safeYear,
      monthIndex,
      lengthDays: monthLength,
      absoluteStartDay: absoluteCursor,
      dayOfYearStart: absoluteCursor - yearAbsoluteStart,
      startWeekdayIndex: weekdayCursor,
      advancesWeekdayFlow: true,
      intercalaryPeriodId: null,
      appendedIntercalaryPeriods: structure.appendAdjustmentsByMonth[monthIndex]
        .filter((item) => toInt(item.lengthDays, 0) !== 0)
        .map((item) => ({ ...item })),
    };
    monthSegments[monthIndex] = segment;
    segments.push(segment);
    absoluteCursor += monthLength;
    weekdayCursor = mod(weekdayCursor + monthLength, daysPerWeek);
    weekdayAdvancingDays += monthLength;

    pushIntercalarySegments(structure.afterMonthSegments.get(monthIndex));
  }

  pushIntercalarySegments(structure.yearEndSegments);

  const layout = {
    year: safeYear,
    yearAbsoluteStart,
    yearStartWeekdayIndex,
    yearLengthDays: absoluteCursor - yearAbsoluteStart,
    weekdayAdvancingDays,
    monthLengths: monthSegments.map((segment) => segment.lengthDays),
    monthSegments,
    monthStartWeekdayByMonth: monthSegments.map((segment) => segment.startWeekdayIndex),
    monthAbsoluteStartByMonth: monthSegments.map((segment) => segment.absoluteStartDay),
    segments,
  };

  runtime.yearLayouts.set(cacheKey, layout);
  return layout;
}

/**
 * Builds the resolved structural layout for a year. Month segments
 * always remain month-only lengths; intercalary periods are resolved
 * separately and ordered around those month segments unless their
 * placement explicitly appends them into a month.
 *
 * @param {object} options
 * @param {object} options.metrics - Calendar basis metrics.
 * @param {number} [options.year=1] - Target year (1-based).
 * @param {object[]} [options.leapRules=[]] - Leap rule definitions.
 * @param {(number|null)[]} [options.monthLengthOverrides=[]] - Per-month
 *   overrides for authored month lengths.
 * @param {object[]|undefined} [options.intercalaryPeriods] - Explicit
 *   intercalary periods. When omitted, legacy metrics.intercalaryDays
 *   behaviour is preserved for backward compatibility.
 * @param {number} [options.firstYearStartDayIndex=0] - Weekday index for
 *   year 1, used to derive segment weekday starts.
 * @returns {{ year: number, yearAbsoluteStart: number,
 *   yearStartWeekdayIndex: number, yearLengthDays: number,
 *   weekdayAdvancingDays: number, monthLengths: number[],
 *   monthSegments: object[], monthStartWeekdayByMonth: number[],
 *   monthAbsoluteStartByMonth: number[], segments: object[] }}
 *   Resolved structural layout for the year.
 */
export function buildYearLayoutForYear(options, runtime = createYearLayoutRuntime()) {
  return buildYearLayoutForYearInternal(options || {}, runtime);
}

export function getYearLengthForYear(options, runtime = createYearLayoutRuntime()) {
  return buildYearLayoutForYear(options, runtime).yearLengthDays;
}

export function getAbsoluteDayForDate(
  {
    metrics,
    year = 1,
    monthIndex = 0,
    dayOfMonth = 1,
    intercalaryPeriodId = "",
    intercalaryDay = 1,
    leapRules = [],
    monthLengthOverrides = [],
    intercalaryPeriods,
    firstYearStartDayIndex = 0,
  },
  runtime = createYearLayoutRuntime(),
) {
  const layout = buildYearLayoutForYearInternal(
    {
      metrics,
      year,
      leapRules,
      monthLengthOverrides,
      intercalaryPeriods,
      firstYearStartDayIndex,
    },
    runtime,
  );

  if (intercalaryPeriodId) {
    const segment = layout.segments.find(
      (item) => item.kind === "intercalary" && item.intercalaryPeriodId === intercalaryPeriodId,
    );
    if (segment) {
      const safeIntercalaryDay = clamp(
        toInt(intercalaryDay, 1),
        1,
        Math.max(1, segment.lengthDays),
      );
      return segment.absoluteStartDay + safeIntercalaryDay - 1;
    }
  }

  const monthsPerYear = positiveInt(metrics?.monthsPerYear, 12);
  const safeMonthIndex = clamp(toInt(monthIndex, 0), 0, monthsPerYear - 1);
  const monthSegment = layout.monthSegments[safeMonthIndex];
  const safeDayOfMonth = clamp(toInt(dayOfMonth, 1), 1, Math.max(1, monthSegment.lengthDays));
  return monthSegment.absoluteStartDay + safeDayOfMonth - 1;
}

export function getDatePartsForAbsoluteDay(
  {
    metrics,
    absoluteDay = 0,
    leapRules = [],
    monthLengthOverrides = [],
    intercalaryPeriods,
    firstYearStartDayIndex = 0,
  },
  runtime = createYearLayoutRuntime(),
) {
  const safeAbsoluteDay = Math.max(0, toInt(absoluteDay, 0));
  const sampleYearLength = Math.max(
    1,
    buildYearLayoutForYearInternal(
      {
        metrics,
        year: 1,
        leapRules,
        monthLengthOverrides,
        intercalaryPeriods,
        firstYearStartDayIndex,
      },
      runtime,
    ).yearLengthDays,
  );

  let year = Math.max(1, Math.floor(safeAbsoluteDay / sampleYearLength) - 1);
  let yearStart = getDaysBeforeYearInternal(
    {
      metrics,
      year,
      leapRules,
      monthLengthOverrides,
      intercalaryPeriods,
      firstYearStartDayIndex,
    },
    runtime,
  );

  while (yearStart > safeAbsoluteDay && year > 1) {
    year -= 1;
    yearStart = getDaysBeforeYearInternal(
      {
        metrics,
        year,
        leapRules,
        monthLengthOverrides,
        intercalaryPeriods,
        firstYearStartDayIndex,
      },
      runtime,
    );
  }

  while (true) {
    const layout = buildYearLayoutForYearInternal(
      {
        metrics,
        year,
        leapRules,
        monthLengthOverrides,
        intercalaryPeriods,
        firstYearStartDayIndex,
      },
      runtime,
    );
    if (safeAbsoluteDay < layout.yearAbsoluteStart + layout.yearLengthDays) {
      const offsetInYear = safeAbsoluteDay - layout.yearAbsoluteStart;
      for (const segment of layout.segments) {
        const start = segment.dayOfYearStart;
        const end = start + segment.lengthDays;
        if (offsetInYear < start || offsetInYear >= end) continue;
        const offsetInSegment = safeAbsoluteDay - segment.absoluteStartDay;
        if (segment.kind === "month") {
          return {
            kind: "month",
            year,
            monthIndex: segment.monthIndex,
            dayOfMonth: offsetInSegment + 1,
            intercalaryDay: null,
            intercalaryPeriodId: null,
            absoluteDay: safeAbsoluteDay,
            weekdayIndex: mod(
              segment.startWeekdayIndex + offsetInSegment,
              positiveInt(metrics?.daysPerWeek, 7),
            ),
            advancesWeekdayFlow: true,
            anchorMonthIndex: segment.monthIndex,
            placement: "month",
          };
        }
        return {
          kind: "intercalary",
          year,
          monthIndex: segment.anchorMonthIndex,
          dayOfMonth: null,
          intercalaryDay: offsetInSegment + 1,
          intercalaryPeriodId: segment.intercalaryPeriodId,
          absoluteDay: safeAbsoluteDay,
          weekdayIndex: segment.advancesWeekdayFlow
            ? mod(segment.startWeekdayIndex + offsetInSegment, positiveInt(metrics?.daysPerWeek, 7))
            : segment.startWeekdayIndex,
          advancesWeekdayFlow: !!segment.advancesWeekdayFlow,
          anchorMonthIndex: segment.anchorMonthIndex,
          placement: segment.placement,
        };
      }
      break;
    }
    year += 1;
    if (year > 100000) {
      break;
    }
  }

  return {
    kind: "month",
    year: 100000,
    monthIndex: 0,
    dayOfMonth: 1,
    intercalaryDay: null,
    intercalaryPeriodId: null,
    absoluteDay: safeAbsoluteDay,
    weekdayIndex: 0,
    advancesWeekdayFlow: true,
    anchorMonthIndex: 0,
    placement: "month",
  };
}

/**
 * Computes the day-length of every month in a given year, applying
 * intercalary days and any active leap rules.
 *
 * @param {object} options
 * @param {object} options.metrics - Calendar basis metrics (from
 *   getCalendarBasisMetrics).
 * @param {number} [options.year=1] - Target year (1-based).
 * @param {object[]} [options.leapRules=[]] - Leap rule definitions.
 * @param {(number|null)[]} [options.monthLengthOverrides=[]] - Per-month
 *   day-count overrides (null entries use base daysPerMonth).
 * @returns {number[]} Array of month lengths (one entry per month).
 */
export function getMonthLengthsForYear(
  { metrics, year = 1, leapRules = [], monthLengthOverrides = [], intercalaryPeriods },
  runtime = createYearLayoutRuntime(),
) {
  return buildYearLayoutForYear(
    {
      metrics,
      year,
      leapRules,
      monthLengthOverrides,
      intercalaryPeriods,
    },
    runtime,
  ).monthLengths;
}

// (offset, offset+cycle, offset+2·cycle, …). Count firings in [1, target-1]

/**
 * Determines the weekday index on which a given year begins, accounting
 * for cumulative day drift from prior years and leap rules.
 *
 * @param {object} options
 * @param {object} options.metrics - Calendar basis metrics.
 * @param {number} [options.year=1] - Target year (1-based).
 * @param {number} [options.firstYearStartDayIndex=0] - Weekday index
 *   on which year 1 begins (0-based into the day-name list).
 * @param {object[]} [options.leapRules=[]] - Leap rule definitions.
 * @returns {number} Weekday index (0-based) for the first day of the
 *   target year.
 */
export function getYearStartDayIndex(
  {
    metrics,
    year = 1,
    firstYearStartDayIndex = 0,
    leapRules = [],
    monthLengthOverrides = [],
    intercalaryPeriods,
  },
  runtime = createYearLayoutRuntime(),
) {
  return buildYearLayoutForYear(
    {
      metrics,
      year,
      firstYearStartDayIndex,
      leapRules,
      monthLengthOverrides,
      intercalaryPeriods,
    },
    runtime,
  ).yearStartWeekdayIndex;
}

/**
 * Describes the moon phase for a given age within a synodic cycle.
 * Divides the cycle into eight equal phases (new, waxing crescent,
 * first quarter, waxing gibbous, full, waning gibbous, last quarter,
 * waning crescent) and computes fractional illumination via cosine.
 *
 * @param {object} options
 * @param {number} options.ageDays - Days elapsed since the moon's
 *   reference new-moon epoch.
 * @param {number} [options.synodicDays=29.5306] - Length of the
 *   synodic period in days.
 * @returns {{ ageDays: number, fraction: number,
 *   illuminationPct: number, phaseName: string, phaseShort: string }}
 *   Phase descriptor with age, cycle fraction, illumination percentage,
 *   full phase name, and short phase code.
 */
export function describeMoonPhase({ ageDays, synodicDays }) {
  const synodic = Math.max(0.000001, toFinite(synodicDays, 29.5306));
  const age = mod(toFinite(ageDays, 0), synodic);
  const fraction = age / synodic;
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * fraction));

  let phaseName = "New Moon";
  let phaseShort = "N";
  if (fraction >= 1 / 16 && fraction < 3 / 16) {
    phaseName = "Waxing Crescent";
    phaseShort = "WC";
  } else if (fraction >= 3 / 16 && fraction < 5 / 16) {
    phaseName = "First Quarter";
    phaseShort = "1Q";
  } else if (fraction >= 5 / 16 && fraction < 7 / 16) {
    phaseName = "Waxing Gibbous";
    phaseShort = "WG";
  } else if (fraction >= 7 / 16 && fraction < 9 / 16) {
    phaseName = "Full Moon";
    phaseShort = "F";
  } else if (fraction >= 9 / 16 && fraction < 11 / 16) {
    phaseName = "Waning Gibbous";
    phaseShort = "NG";
  } else if (fraction >= 11 / 16 && fraction < 13 / 16) {
    phaseName = "Last Quarter";
    phaseShort = "3Q";
  } else if (fraction >= 13 / 16 && fraction < 15 / 16) {
    phaseName = "Waning Crescent";
    phaseShort = "NC";
  }

  return {
    ageDays: age,
    fraction,
    illuminationPct: illumination * 100,
    phaseName,
    phaseShort,
  };
}

/**
 * Builds a fully-rendered calendar month grid suitable for display.
 * Computes week rows with leading empty cells for alignment, annotates
 * each day with moon phase and matching holidays, and collects
 * full-moon / new-moon day lists for the month.
 *
 * @param {object} options
 * @param {object} options.metrics - Calendar basis metrics (from
 *   getCalendarBasisMetrics).
 * @param {number} [options.year=1] - Target year (1-based).
 * @param {number} [options.monthIndex=0] - Zero-based month index.
 * @param {number} [options.firstYearStartDayIndex=0] - Weekday index
 *   on which year 1 begins.
 * @param {number} [options.weekStartDayIndex=0] - Weekday index that
 *   starts each displayed week row.
 * @param {object[]} [options.leapRules=[]] - Leap rule definitions.
 * @param {object[]} [options.holidays=[]] - Holiday definitions.
 * @param {string|string[]} [options.dayNames=[]] - Day-of-week names.
 * @param {string|string[]} [options.weekNames=[]] - Week-of-month names.
 * @param {number} [options.moonSynodicDays=29.5306] - Moon synodic
 *   period in days.
 * @param {number} [options.moonEpochOffsetDays=0] - Day offset from
 *   calendar day 0 to the moon's reference new-moon epoch.
 * @returns {{ year: number, monthIndex: number, monthLength: number,
 *   monthLengths: number[], monthStartWeekday: number,
 *   leadingEmptyCount: number, daysPerWeek: number, headers: string[],
 *   rows: { weekIndex: number, weekName: string, cells: (?object)[] }[],
 *   fullMoonDays: number[], newMoonDays: number[] }}
 *   Structured month data for rendering.
 */
export function buildUsableCalendarMonth({
  metrics,
  year = 1,
  monthIndex = 0,
  firstYearStartDayIndex = 0,
  weekStartDayIndex = 0,
  leapRules = [],
  holidays = [],
  dayNames = [],
  weekNames = [],
  moonSynodicDays = 29.5306,
  moonEpochOffsetDays = 0,
  monthLengthOverrides = [],
  intercalaryPeriods,
}) {
  const monthsPerYear = positiveInt(metrics?.monthsPerYear, 12);
  const daysPerWeek = positiveInt(metrics?.daysPerWeek, 7);
  const safeYear = Math.max(1, positiveInt(year, 1));
  const safeMonthIndex = clamp(toInt(monthIndex, 0), 0, monthsPerYear - 1);
  const safeWeekStart = mod(toInt(weekStartDayIndex, 0), daysPerWeek);
  const yearLayout = buildYearLayoutForYear({
    metrics,
    year: safeYear,
    leapRules,
    monthLengthOverrides,
    intercalaryPeriods,
    firstYearStartDayIndex,
  });
  const monthSegment = yearLayout.monthSegments[safeMonthIndex];
  const monthLengths = yearLayout.monthLengths;
  const monthLength = monthSegment.lengthDays;

  const normalizedDayNames = normalizeNameList(dayNames, daysPerWeek, "Day");
  const configuredWeeksPerMonth = Math.max(1, positiveInt(metrics?.weeksPerMonth, 4));
  const normalizedWeekNames = normalizeNameList(weekNames, configuredWeeksPerMonth, "Week");
  const normalizedHolidays = normalizeHolidays(holidays, monthsPerYear);

  const monthStartWeekday = monthSegment.startWeekdayIndex;
  const leadingEmptyCount = mod(monthStartWeekday - safeWeekStart, daysPerWeek);

  const headers = Array.from(
    { length: daysPerWeek },
    (_, i) => normalizedDayNames[mod(safeWeekStart + i, daysPerWeek)],
  );

  const allCells = [];
  const absoluteMonthStartDay = monthSegment.absoluteStartDay;

  for (let i = 0; i < leadingEmptyCount; i++) {
    allCells.push(null);
  }

  const fullMoonDays = [];
  const newMoonDays = [];

  for (let day = 1; day <= monthLength; day++) {
    const absoluteDay = absoluteMonthStartDay + day - 1;
    const moon = describeMoonPhase({
      ageDays: absoluteDay + toFinite(moonEpochOffsetDays, 0),
      synodicDays: moonSynodicDays,
    });
    if (moon.phaseShort === "F") fullMoonDays.push(day);
    if (moon.phaseShort === "N") newMoonDays.push(day);

    const holidayNames = normalizedHolidays
      .filter((holiday) => holiday.monthIndex === safeMonthIndex && holiday.day === day)
      .map((holiday) => holiday.name);

    allCells.push({
      dayNumber: day,
      absoluteDay,
      moon,
      holidayNames,
    });
  }

  const rows = [];
  const rowCount = Math.ceil(allCells.length / daysPerWeek);
  for (let row = 0; row < rowCount; row++) {
    const weekName = normalizedWeekNames[row] || `Week ${row + 1}`;
    const cells = allCells.slice(row * daysPerWeek, row * daysPerWeek + daysPerWeek);
    while (cells.length < daysPerWeek) cells.push(null);
    rows.push({ weekIndex: row, weekName, cells });
  }

  return {
    year: safeYear,
    monthIndex: safeMonthIndex,
    monthLength,
    monthLengths,
    monthStartWeekday,
    leadingEmptyCount,
    daysPerWeek,
    headers,
    rows,
    fullMoonDays,
    newMoonDays,
  };
}
