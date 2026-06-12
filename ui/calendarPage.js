import { fmt } from "../engine/utils.js";
import {
  createYearLayoutRuntime,
  buildYearLayoutForYear,
  describeMoonPhase,
  getAbsoluteDayForDate,
  getDatePartsForAbsoluteDay,
  getMonthLengthsForYear,
  normalizeLeapRules,
  normalizeNameList,
} from "../engine/usableCalendar.js";
import {
  CALENDAR_COLLAPSIBLE_PANELS,
  CALENDAR_PHASES as PHASES,
  CALENDAR_TUTORIAL_STEPS as TUTORIAL_STEPS,
  HOLIDAY_ALGORITHMS,
  HOLIDAY_ANCHOR_TYPES,
  HOLIDAY_CATEGORIES,
  HOLIDAY_CATEGORY_SET,
  HOLIDAY_CONFLICT_RULES,
  HOLIDAY_CONFLICT_SCOPES,
  HOLIDAY_RELATIVE_MARKERS,
  HOLIDAY_RELATIVE_TYPES,
  HOLIDAY_RESOLVE_MODES,
  HOLIDAY_SCAN_MONTH_RADIUS,
  HOLIDAY_WEEKEND_RULES,
  MOON_COLORS,
  OCCURRENCES,
  RECURRENCES,
  SEASON_MARKER_DEFS,
  WORK_CYCLE_MODES,
} from "./calendar/constants.js";
import {
  copyTextToClipboard,
  createCalendarExportEnvelope,
  downloadJsonFile,
  readCalendarCandidate,
  utcStampCompact,
} from "./calendar/calendarIo.js";
import { createCalendarAuditPanelHelpers } from "./calendar/auditPanel.js";
import {
  bindPair,
  collectCalendarPageElements,
  createContextSummaryCard,
  sliderField,
} from "./calendar/pageBasics.js";
import { createCalendarContextBuilder } from "./calendar/renderContext.js";
import {
  createCalendarDetailOverlayActions,
  renderCalendarMoonLegend,
  renderCalendarSelectedDay,
} from "./calendar/detailOverlay.js";
import { createCalendarMonthViewHelpers } from "./calendar/monthView.js";
import { createCalendarProfileState } from "./calendar/profileState.js";
import {
  applyHolidayFiltersToMonthModel,
  buildMonthAuditEntries,
  eventRecurrenceMismatchReason,
  festivalSummary,
  holidaySummary,
  recommendLeapRuleFromOrbit,
} from "./calendar/renderHelpers.js";
import { createCalendarRuleEditorFlows } from "./calendar/ruleEditorFlows.js";
import { createCalendarRenderSnapshotReader } from "./calendar/renderSnapshot.js";
import { confirmDestructiveAction } from "./destructiveActionDialog.js";
import {
  analyzeHolidayRelativeIssues,
  astronomyMarkerAggregateKey,
  astronomyMarkerLabel,
  astroIconClass,
  buildHolidayAlgorithmSupport,
  clonePlain,
  createCalendarStateStoreBindings,
  cycleKindClass,
  cycleMarkerTip,
  cycleRuleSummary,
  evaluateWorkCyclesForDay,
  findById,
  formatDisplayedYear,
  fromLinearMonthOrdinal,
  holidayCategoryLabel,
  holidayAlgorithmAllowed,
  holidayCategoryOptionsHtml,
  holidayColorClass,
  holidayColorOptionsHtml,
  holidayFilterControlsHtml,
  monthLengthOverridesText,
  namesText,
  normEraRules,
  normFestivalRules,
  normHolidayRules,
  normalizeAstronomySettings,
  normalizeHolidayCategory,
  normalizeHolidayCategoryFilters,
  normalizeIcsIncludes,
  normalizeIsoDate,
  normalizeWeekendDayIndexes,
  normalizeWeekendRule,
  normWorkCycleRules,
  moonColorClass,
  phaseClass,
  pickMoonStateForHoliday,
  recursInMonth,
  splitMonthLengths,
  splitNames,
  toLinearMonthOrdinal,
  uniqueSortedNumbers,
  weekdayOccurrence,
} from "./calendar/stateModel.js";
import { createElement, replaceChildren, replaceSelectOptions } from "./domHelpers.js";
import { buildPageIntroHtml } from "./pageIntro.js";
import { buildDeleteCalendarProfilePlan } from "./store/destructiveActions.js";
import { createTutorial } from "./tutorial.js";
import { attachTooltips, tipIcon, tipIconNode } from "./tooltip.js";
import {
  getSelectedMoon,
  getSelectedPlanet,
  listMoons,
  listPlanets,
  loadWorld,
  updateWorld,
} from "./store.js";

const TIPS = {
  "Calendar name": "Name shown on this calendar and carried in calendar-only export/import.",
  "Calendar profile":
    "Switch between multiple calendar systems in this world (for example: civil, religious, or regional).",
  "New profile": "Create a new calendar profile.",
  "Duplicate profile": "Create a copy of the current calendar profile.",
  "Delete profile": "Delete the current calendar profile.",
  "Source planet": "Planet used to derive orbital year length and day-length context.",
  "Primary moon": "Main moon used for lunar cycle calculations and full/new moon summaries.",
  "Extra moon":
    "Additional moon shown in day and detailed views; does not replace the primary moon.",
  "Planet orbital period": "Derived from the selected planet and star. Read-only.",
  "Moon orbital period": "Primary moon synodic period (new moon to new moon). Read-only.",
  "Planet rotation": "Length of one planetary day. Derived from the selected planet and read-only.",
  "Decimal places":
    "When enabled, rounds derived orbital data (planet period, moon period, rotation)" +
    " to the selected number of decimal places before feeding into the calendar model." +
    " This affects month lengths and leap cycles." +
    " 6 = full engine precision; 0 = whole numbers only." +
    " When disabled, raw engine values pass through unmodified.",
  "Months per year":
    "How many months the calendar splits the year into. Defaults to lunar-cycle-based value.",
  "Days per month":
    "How many days each month contains. Defaults to the orbital-derived value for the active basis.",
  "Days per week": "How many days each week contains. Defaults to one quarter of days per month.",
  Basis: "Select which model drives month/week partitioning.",
  Year: "Calendar year shown in Month View.",
  Month: "Month shown in Month View.",
  "Start day of year": "Weekday assigned to day 1 of year 1.",
  "Week starts on": "Controls which weekday is shown as the first column.",
  "Moon epoch offset": "Phase timeline offset in days. Use to align moon phases with your setting.",
  "Day names": "Custom day names, one per line. Missing entries are auto-filled.",
  "Week names": "Custom week labels, one per line. Missing entries are auto-filled.",
  "Month names": "Custom month names, one per line. Missing entries are auto-filled.",
  "Month lengths":
    "Enable this to set a custom day count for each month, one per line. " +
    "Blank or missing lines fall back to the base Days per month value. " +
    "Use Intercalary Periods in Rules for structural extra days before months, " +
    "after months, at year end, or appended into a month. " +
    "Leap rules still add or remove days on top of these overrides. " +
    "Uncheck to revert to uniform month lengths without losing your entries.",
  "Year display mode":
    "Choose how years are shown: custom number, named eras, or pre/post calendar eras (for example BCE/CE).",
  "Pre-calendar schema":
    "Pre/Post era formatting (for example BCE/CE). Traditional BCE/CE has no year zero.",
  "Year offset":
    "Added to displayed year number. Example: offset +999 makes Year 1 display as Year 1000.",
  "Year prefix":
    "Optional text prepended to displayed year (for example: CY, AG, or Imperial Year).",
  "Year suffix": "Optional text appended to displayed year (for example: DR, AE, or CE).",
  "Post-calendar start year":
    "Calendar year where the post-era label begins. Years before this are shown as pre-era years.",
  "Post-era label":
    "Suffix for years at/after the post-calendar start year (for example CE, AD, AE).",
  "Pre-era label":
    "Suffix for years before the post-calendar start year (for example BCE, BC, BAE).",
  "Use year zero":
    "When enabled, the boundary year is shown as year 0 of the post era (astronomical numbering).",
  "Era label": "Name of an era (for example: First Age).",
  "Era start year": "Base calendar year where this era begins.",
  "Era list": "Configured era labels, applied by highest start year <= current year.",
  "Add era": "Add this era rule to the era list.",
  "Holiday name": "Display name shown on calendar days and event lists.",
  Recurrence: "How often this holiday repeats over time. Use Cyclic for every-N-years holidays.",
  Attributes:
    "Choose matching rules for this holiday. Multiple checks mean all selected rules must match the same date.",
  "Start month": "First month where this holiday can occur.",
  "Day of month": "Matches a specific calendar day number in the month.",
  "Use relative trigger":
    "Enable rule anchoring relative to moon phases, astronomy markers, or another holiday.",
  "Relative trigger type": "Choose what this holiday is relative to.",
  "Relative offset days":
    "Negative values place the holiday before the trigger; positive values place it after.",
  "Relative marker": "Astronomy marker to anchor this holiday rule.",
  "Relative holiday": "Holiday used as the anchor for this holiday rule.",
  "Relative moon slot": "Moon used for moon-phase relative triggers.",
  "Relative moon phase": "Moon phase used for moon-phase relative triggers.",
  "Weekday rule": "Matches by weekday position (for example: first Day 2, or last Day 5).",
  Occurrence: "Used with Weekday rule to choose any/1st/2nd/3rd/4th/last weekday occurrence.",
  "Moon slot": "Select which displayed moon to test when Moon phase matching is enabled.",
  "Moon phase": "Required moon phase when Moon phase matching is enabled.",
  Holidays: "Configured holiday rules. Edit or delete existing entries here.",
  "Leap rules": "Rules that add or remove days from a target month on repeating year cycles.",
  "Leap rule name": "Label for this leap rule.",
  "Leap cycle": "Repeat interval in years.",
  "Leap start year": "First year where this leap rule applies.",
  "Leap month": "Month affected by this leap rule.",
  "Leap day delta": "Days added (+) or removed (-) when the rule applies.",
  "Leap list": "Configured leap rules. Delete to remove a rule.",
  "Suggest leap rule":
    "Calculate a recommended ±1-day leap cycle from the source planet orbital year and add it automatically.",
  "Apply inputs": "Apply current input selections and regenerate the calendar context.",
  "Use selected objects":
    "Pull currently selected planet/moon from other pages into this calendar setup.",
  "Apply names": "Apply custom day/week/month naming lists to the calendar.",
  "Reset names": "Clear custom naming lists and restore automatic default names.",
  "Add holiday": "Create a new holiday rule, or save changes while editing.",
  "Cancel holiday edit": "Exit holiday edit mode without keeping form changes.",
  "Add leap rule": "Add this leap-rule row to the active leap rules list.",
  "Previous month": "Move to the previous month (crosses year boundary when needed).",
  "Next month": "Move to the next month (crosses year boundary when needed).",
  Tutorials: "Step-by-step guide to setting up your calendar.",
  "Open detailed view": "Open the full detailed calendar view with moon markers.",
  "Close detailed view": "Close the detailed calendar overlay.",
  "Month summary": "Current month, year, and month length.",
  "Moon summary chips": "Quick list of primary moon full/new moon days and active moon context.",
  "Simple calendar": "Compact month grid. Click a day to inspect details.",
  "Selected day": "Detailed breakdown for the currently selected day.",
  "Moon key": "Color key for moons shown in this calendar.",
  "Compact stats": "Quick month statistics.",
  "Month events": "Holiday occurrences detected in this month.",
  "Detailed calendar": "Full calendar grid with week rows, moon markers, and holiday markers.",
  "Holiday year": "Used by One-off holidays. Cyclic holidays use Cycle years and Offset year.",
  "Holiday cycle years": "Repeat interval in years for cyclic holiday rules.",
  "Holiday offset year": "First year where a cyclic holiday becomes active.",
  "Holiday duration":
    "Number of consecutive days this holiday lasts from its start day (within the month).",
  "Holiday priority":
    "Higher priority wins when an override rule is present. Sort order is priority, then name, then id.",
  "Holiday merge mode":
    "Merge keeps this holiday alongside others. Override suppresses lower-priority matches on the same day.",
  "Holiday advanced toggle":
    "Switch between basic holiday authoring and advanced anchor/conflict controls. Basic mode still supports relative triggers.",
  "Holiday anchor type":
    "Primary date anchor for this holiday rule. Advanced mode supports fixed dates, weekday patterns, moon phases, astronomy markers, linked holidays, and compatible preset algorithms.",
  "Holiday algorithm":
    "Optional preset algorithm for compatible profiles. Gregorian Easter (Western) is currently scoped to Sol/Earth Gregorian-compatible calendars, while the wider rule system still models arbitrary holidays.",
  "Holiday anchor offset":
    "Shift from the selected anchor in days. Negative values are before, positive values are after.",
  "Holiday weekend rule":
    "Legacy per-holiday weekend rule. Weekend handling is now configured in Work/Rest Cycles.",
  "Holiday conflict rule": "How to resolve collisions with other holidays on the same day.",
  "Holiday max shift":
    "Maximum number of days this rule can shift when conflict or weekend adjustments apply.",
  "Holiday stay in month":
    "When enabled, observance shifts are constrained to stay inside the same month.",
  "Holiday conflict scope": "Choose which holidays are considered when applying conflict handling.",
  "Holiday conflict categories":
    "Comma-separated categories used when conflict scope is set to same category.",
  "Holiday conflict ids":
    "Comma-separated holiday IDs used when conflict scope is set to specific holidays.",
  "Holiday exception years":
    "Comma-separated years where this holiday is skipped (for example: 2, 5, 19).",
  "Holiday exception months":
    "Comma-separated month numbers where this holiday is skipped (1-based month numbers).",
  "Holiday exception days": "Comma-separated day-of-month values where this holiday is skipped.",
  "Holiday category": "Classify this holiday so users can filter by category in month views.",
  "Holiday colour": "Visual colour tag used for this holiday marker in calendar views.",
  "Holiday filters": "Show or hide holiday categories in month and detailed calendar displays.",
  "Holiday continuation":
    "Shows whether a holiday segment continues from the previous day and/or into the next day.",
  "Special Days section":
    "Holidays are recurring or one-off observances tied to calendar dates, weekdays, moon phases, or combinations of those rules.",
  "Calendar Designer section":
    "Define the core structure and naming of the calendar: basis, current year/month, weekday flow, naming lists, and era formatting.",
  "Calendar Data section":
    "Import/export calendar settings only. Use this to move calendar rules between worlds without changing star/system/planet/moon data.",
  "Output & Utility section":
    "Open printable browser views, export ICS files for external apps, and control optional astronomy markers shown on the calendar.",
  "Astronomy markers": "Enable optional astronomy markers in month views and exports.",
  "Season markers":
    "Mark quarter-year seasonal anchors: vernal equinox, summer solstice, autumn equinox, winter solstice.",
  "Season bands":
    "Show a seasonal band overlay in month headers that marks where the current month falls in the orbital year.",
  "Eclipse markers":
    "Approximate eclipse windows based on eclipse-season cadence and the phases of selected moons.",
  "PDF month export":
    "Open a clean printable current-month browser view. Use Print or Save as PDF in your browser.",
  "PDF year export":
    "Open a clean printable full-year browser view. Use Print or Save as PDF in your browser.",
  "ICS anchor date": "Gregorian anchor date for Year 1, Month 1, Day 1 when exporting ICS events.",
  "ICS include holidays": "Include holiday events in ICS export.",
  "ICS include festivals": "Include festival/intercalary events in ICS export.",
  "ICS include markers": "Include astronomy marker events in ICS export.",
  "ICS month export":
    "Export an ICS file for the currently shown month using the configured Gregorian anchor date.",
  "ICS year export":
    "Export an ICS file for the currently shown year using the configured Gregorian anchor date.",
  "Festival Days section":
    "Festival rules add named event days within a month. Use Intercalary Periods for structural extra days that belong before months, after months, at year end, or appended into a month.",
  "Intercalary Periods section":
    "Intercalary periods are structural extra days. Use them to place named days before months, after months, at year end, or appended into a month without overloading festival rules or month-length overrides.",
  "Leap Years section":
    "Leap rules add or remove days in specific months on repeating year cycles to keep your calendar aligned.",
  "Work/Rest Cycles section":
    "Define repeating schedules such as work/rest rotations and interval markers (for example: market every 5 days), and set global weekend handling for holidays.",
  "Weekend handling":
    "Global weekend observance shift used by holiday rules. Configure once here to apply weekend policy across all holidays.",
  "Weekend days": "Choose which weekdays are treated as weekend days for weekend handling rules.",
  "Cycle rule name": "Display name for this cycle rule.",
  "Cycle rule mode": "Choose between a duty on/off rotation or a fixed interval marker.",
  "Cycle start day":
    "Absolute day index where this rule starts counting (0 = Year 1, Month 1, Day 1).",
  "Cycle on days": "Number of consecutive active days in a duty cycle.",
  "Cycle off days": "Number of consecutive rest days in a duty cycle.",
  "Cycle interval days": "Trigger marker every N days.",
  "Cycle active label": "Text used for active duty days.",
  "Cycle rest label": "Text used for rest days.",
  "Cycle marker label": "Text used when an interval marker triggers.",
  "Cycle active short": "Short marker (1-3 chars) for active duty days.",
  "Cycle rest short": "Short marker (1-3 chars) for rest days.",
  "Cycle marker short": "Short marker (1-3 chars) for interval trigger days.",
  "Add cycle rule": "Create a new cycle rule, or save changes while editing.",
  "Cancel cycle edit": "Exit cycle edit mode without keeping form changes.",
  "Cycle list": "Configured work/rest cycle rules.",
  "Festival days":
    "Festival rules add named event days inside a month. Use Intercalary Periods for extra structural days that reshape the calendar layout.",
  "Festival name": "Display name for this festival rule.",
  "Festival recurrence":
    "How often this festival repeats over time. Use Cyclic for every-N-years festivals.",
  "Festival start month": "First month where this festival can occur.",
  "Festival year":
    "Used by One-off festival rules. Cyclic festivals use Cycle years and Offset year.",
  "Festival cycle years": "Repeat interval in years for cyclic festival rules.",
  "Festival offset year": "First year where a cyclic festival becomes active.",
  "Festival after day":
    "Insert this festival after the selected day number (0 means before Day 1).",
  "Festival duration": "Number of consecutive festival days to add.",
  "Festival outside week":
    "When enabled, festival days are listed separately and do not consume weekday slots in the grid.",
  "Festival category": "Classify this festival so it can be read and managed consistently.",
  "Festival colour": "Visual colour tag used for this festival rule in editor lists and summaries.",
  "Festival exception years":
    "Comma-separated years where this festival is skipped (for example: 2, 5, 19).",
  "Festival exception months":
    "Comma-separated month numbers where this festival is skipped (1-based month numbers).",
  "Festival exception days": "Comma-separated day-of-month values where this festival is skipped.",
  "Add festival": "Create a new festival rule, or save changes while editing.",
  "Cancel festival edit": "Exit festival edit mode without keeping form changes.",
  "Festival list": "Configured festival day rules.",
  "Intercalary periods":
    "Structural extra days that sit before months, after months, at year end, or appended into a month.",
  "Intercalary list": "Configured structural intercalary periods.",
  "Intercalary name": "Display name for this intercalary period.",
  "Intercalary placement": "Where this intercalary period should appear in the year structure.",
  "Intercalary anchor month":
    "Month used by before/after/appended placements. Year-end placement ignores this field.",
  "Intercalary recurrence":
    "Choose whether the period repeats yearly, happens once, or repeats on a year cycle.",
  "Intercalary year":
    "Used as the first active year for yearly periods, or the exact year for one-off periods.",
  "Intercalary cycle years": "Repeat interval in years for cyclic intercalary periods.",
  "Intercalary offset year": "First year where a cyclic intercalary period becomes active.",
  "Intercalary duration mode":
    "Fixed uses the entered day count. Derived remainder automatically fills the remaining structural days in the year.",
  "Intercalary duration": "Number of days in this intercalary period when using Fixed duration.",
  "Intercalary weekday flow":
    "Choose whether these days consume weekday slots or sit outside the weekday flow.",
  "Intercalary exception years": "Comma-separated years where this intercalary period is skipped.",
  "Add intercalary": "Create a new structural intercalary period, or save changes while editing.",
  "Cancel intercalary edit": "Exit intercalary edit mode without keeping form changes.",
  "Calendar JSON":
    "Calendar-only export/import. This affects calendar settings only and does not change star/system/planet/moon data.",
  "Download calendar JSON": "Download only calendar settings as a JSON file.",
  "Copy calendar JSON": "Copy only calendar settings JSON to clipboard.",
  "Import calendar JSON file": "Import calendar settings from a JSON file.",
  "Apply pasted calendar JSON": "Validate and apply calendar JSON from the text box below.",
  "Date converter":
    "Convert between absolute day index and calendar date, then jump directly to that day.",
  "Absolute day": "Zero-based day index from the start of Year 1. Day 0 is Year 1, Month 1, Day 1.",
  "Jump absolute day": "Jump Month View to the date represented by this absolute day.",
  "Jump date": "Jump Month View to the specified year, month, and day.",
  "Rule audit":
    "Agenda view for resolved holidays, festivals, intercalary periods, astronomy markers, and cycles in the current month or year.",
  "Audit scope": "Switch the audit list between the current month and the full current year.",
  "Audit filter": "Filter the audit list by rule type so dense calendars stay readable.",
  "Rule preview":
    "Preview the next resolved occurrences for the holiday or festival currently being edited.",
};

const INTERCALARY_PLACEMENT_OPTIONS = [
  ["year-end", "Year end"],
  ["before-month", "Before month"],
  ["after-month", "After month"],
  ["append-to-month", "Append to month"],
];

const INTERCALARY_RECURRENCE_OPTIONS = [
  ["yearly", "Yearly"],
  ["one-off", "One-off"],
  ["cyclic", "Cyclic"],
];

const INTERCALARY_DURATION_MODE_OPTIONS = [
  ["fixed", "Fixed duration"],
  ["derived-remainder", "Derived remainder"],
];

const INTERCALARY_WEEKDAY_FLOW_OPTIONS = [
  ["in-flow", "In weekday flow"],
  ["outside-flow", "Outside weekday flow"],
];

const CALENDAR_AUDIT_SCOPE_OPTIONS = [
  ["month", "Current month"],
  ["year", "Current year"],
];

const CALENDAR_AUDIT_KIND_OPTIONS = [
  ["all", "All rules"],
  ["holiday", "Holidays"],
  ["festival", "Festivals"],
  ["intercalary", "Intercalary"],
  ["marker", "Astronomy"],
  ["cycle", "Cycles"],
];

const CALENDAR_AUDIT_RENDER_LIMIT = 180;
const CALENDAR_RULE_PREVIEW_LIMIT = 8;
const CALENDAR_RULE_PREVIEW_SCAN_YEARS = 4;

const { defaultState, normalizeSingleProfile, persistState, readState } =
  createCalendarStateStoreBindings({
    getSelectedMoon,
    getSelectedPlanet,
    listMoons,
    listPlanets,
    updateWorld,
  });

const N = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};
const I = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : f;
};
const clampI = (v, min, max) => Math.max(min, Math.min(max, I(v, min)));
const mod = (v, b) => (b > 0 ? ((v % b) + b) % b : 0);
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function tupleOptions(entries) {
  return (Array.isArray(entries) ? entries : []).map(([value, label]) => ({ value, label }));
}

function holidayAnchorTypeOptions(algorithmSupport, currentValue = "fixed-date") {
  const selectedValue = String(currentValue || "fixed-date");
  return HOLIDAY_ANCHOR_TYPES.map(([value, label]) => ({
    value,
    label,
    disabled:
      value === "algorithmic" &&
      !algorithmSupport?.allowsAlgorithmicAnchors &&
      value !== selectedValue,
  }));
}

function holidayAlgorithmOptions(algorithmSupport, currentValue = "none") {
  const selectedValue = String(currentValue || "none");
  return HOLIDAY_ALGORITHMS.map(([value, label]) => ({
    value,
    label,
    disabled: !holidayAlgorithmAllowed(algorithmSupport?.scope, value) && value !== selectedValue,
  }));
}

function indexedLabelOptions(labels) {
  return (Array.isArray(labels) ? labels : []).map((label, index) => ({ value: index, label }));
}

function bodyOptions(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    value: item?.id || "",
    label: item?.name || item?.inputs?.name || item?.id || "",
  }));
}

function moonSlotOptions(moons) {
  return (Array.isArray(moons) ? moons : []).map((moon, index) => ({
    value: index,
    label: moon?.name || "",
    dataset: { moonId: moon?.id || "" },
  }));
}

function holidayReferenceOptions(holidays) {
  return [
    { value: "", label: "Select holiday" },
    ...(Array.isArray(holidays) ? holidays : []).map((holiday) => ({
      value: holiday?.id || "",
      label: holiday?.name || "",
    })),
  ];
}

function replaceWeekendDayOptions(node, dayNames, selectedIndexes) {
  const selected = new Set(Array.isArray(selectedIndexes) ? selectedIndexes : []);
  return replaceChildren(
    node,
    (Array.isArray(dayNames) ? dayNames : []).map((dayName, index) =>
      createElement("label", { className: "calendar-holiday-attr" }, [
        createElement("input", {
          attrs: { type: "checkbox" },
          dataset: { calWeekendDay: index },
          checked: selected.has(index),
        }),
        dayName,
      ]),
    ),
  );
}

function hintNode(text) {
  return createElement("div", { className: "hint", text });
}

function interleaveNodes(items, separator = ", ") {
  const filtered = (Array.isArray(items) ? items : []).filter(Boolean);
  if (!filtered.length) return ["None"];
  return filtered.flatMap((item, index) => (index ? [separator, item] : [item]));
}

function actionButton(label, dataset, className = "small") {
  return createElement("button", { className, attrs: { type: "button" }, dataset, text: label });
}

function calendarItemRow({ nameChildren, hint, actions = [], isEditing = false }) {
  return createElement("div", { className: `calendar-item-row${isEditing ? " is-editing" : ""}` }, [
    createElement("div", { className: "calendar-item-row__main" }, [
      createElement(
        "div",
        { className: "calendar-item-row__name" },
        Array.isArray(nameChildren) ? nameChildren : [nameChildren],
      ),
      hintNode(hint),
    ]),
    createElement("div", { className: "calendar-item-row__actions" }, actions),
  ]);
}

const {
  buildCalendarAuditEntries,
  buildRulePreviewEntries,
  pickActiveRulePreview,
  buildAuditRenderKey,
  buildRulePreviewContent,
  buildAuditAgendaContent,
} = createCalendarAuditPanelHelpers({
  TIPS,
  I,
  buildMonthModel,
  createElement,
  actionButton,
  hintNode,
  tipIconNode,
  buildMonthAuditEntries,
  applyHolidayFiltersToMonthModel,
  festivalSummary,
  holidaySummary,
  normalizeHolidayCategoryFilters,
  toLinearMonthOrdinal,
  fromLinearMonthOrdinal,
  CALENDAR_AUDIT_RENDER_LIMIT,
  CALENDAR_RULE_PREVIEW_LIMIT,
  CALENDAR_RULE_PREVIEW_SCAN_YEARS,
});

const {
  astroIconNode,
  buildSeasonBandContent,
  cycleIconNode,
  detailedGrid,
  miniGrid,
  moonIconNode,
  renderIntercalaryGroups,
  selectedDayLine,
} = createCalendarMonthViewHelpers({
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
});

function renderListContent(node, items, emptyText) {
  return replaceChildren(node, items.length ? items : [hintNode(emptyText)]);
}

function renderTraceTable(headings, rows) {
  return createElement("table", { className: "calendar-rule-trace__table" }, [
    createElement(
      "thead",
      {},
      createElement(
        "tr",
        {},
        headings.map((heading) => createElement("th", { text: heading })),
      ),
    ),
    createElement(
      "tbody",
      {},
      rows.map((row) =>
        createElement(
          "tr",
          { className: row.className },
          row.cells.map((cell) =>
            createElement(
              "td",
              {},
              Array.isArray(cell) ? cell : [cell == null ? "" : String(cell)],
            ),
          ),
        ),
      ),
    ),
  ]);
}

function buildTraceNode(trace) {
  if (!trace) return null;
  const r = trace.raw;
  const hs = trace.holidays;
  const fs = trace.festivals;
  const cs = trace.workCycles;
  if (!hs.length && !fs.length && !cs.length) return null;

  const rawChildren = [
    createElement("b", { text: "Selected:" }),
    ` ${r.dayLabel} | `,
    createElement("b", { text: "Absolute day:" }),
    ` ${r.absoluteDay} | `,
    createElement("b", { text: "Weekday:" }),
    ` ${r.weekdayName} (${r.weekdayIndex})${r.isWeekend ? " [weekend]" : ""}`,
  ];
  if (r.kind === "intercalary") {
    rawChildren.push(
      createElement("br"),
      createElement("b", { text: "Intercalary:" }),
      ` ${intercalaryPlacementLabel(r.placement, r.anchorMonthName)} | ${intercalaryFlowLabel(r.advancesWeekdayFlow)}`,
    );
  }
  if (r.moonPhases.length) {
    rawChildren.push(
      createElement("br"),
      createElement("b", { text: "Moon:" }),
      ` ${r.moonPhases.map((m) => `${m.name} ${m.phaseShort} (${fmt(m.illumination, 1)}%)`).join("; ")}`,
    );
  }
  if (r.leapRulesActive.length) {
    rawChildren.push(
      createElement("br"),
      createElement("b", { text: "Leap rules active:" }),
      ` ${r.leapRulesActive
        .map((l) => `${l.name} (month ${l.month}, ${l.delta > 0 ? "+" : ""}${l.delta}d)`)
        .join("; ")}`,
    );
  }

  const sections = [];
  if (hs.length) {
    sections.push(
      createElement("div", { className: "calendar-rule-trace__section" }, [
        createElement("b", { text: "Holidays" }),
        ` (${hs.length} rules)`,
        renderTraceTable(
          ["", "Rule", "Anchor", "Pri", "Reason"],
          hs.map((holiday) => ({
            className: holiday.matched
              ? "calendar-rule-trace__row--matched"
              : "calendar-rule-trace__row--missed",
            cells: [
              holiday.matched ? "\u2705" : "\u2014",
              holiday.name,
              holiday.anchorType,
              String(holiday.priority),
              holiday.reason,
            ],
          })),
        ),
      ]),
    );
  }
  if (fs.length) {
    sections.push(
      createElement("div", { className: "calendar-rule-trace__section" }, [
        createElement("b", { text: "Festivals" }),
        ` (${fs.length} rules)`,
        renderTraceTable(
          ["", "Rule", "Reason"],
          fs.map((festival) => ({
            className: festival.matched
              ? "calendar-rule-trace__row--matched"
              : "calendar-rule-trace__row--missed",
            cells: [festival.matched ? "\u2705" : "\u2014", festival.name, festival.reason],
          })),
        ),
      ]),
    );
  }
  if (cs.length) {
    sections.push(
      createElement("div", { className: "calendar-rule-trace__section" }, [
        createElement("b", { text: "Work Cycles" }),
        ` (${cs.length} rules)`,
        renderTraceTable(
          ["", "Rule", "Mode", "Reason"],
          cs.map((cycle) => ({
            className: cycle.matched
              ? "calendar-rule-trace__row--matched"
              : "calendar-rule-trace__row--missed",
            cells: [cycle.matched ? "\u2705" : "\u2014", cycle.name, cycle.mode, cycle.reason],
          })),
        ),
      ]),
    );
  }

  return createElement("details", { className: "calendar-rule-trace" }, [
    createElement("summary", { text: "Rule trace" }),
    createElement("div", { className: "calendar-rule-trace__raw" }, rawChildren),
    sections,
    actionButton("Copy to clipboard", {}, "calendar-rule-trace__copy small"),
  ]);
}

function dayMatchesHolidayBaseAttrs(holiday, dayCtx) {
  const attrs =
    holiday?.attrs && typeof holiday.attrs === "object"
      ? {
          useDate: !!holiday.attrs.useDate,
          useWeekday: !!holiday.attrs.useWeekday,
          useMoonPhase: !!holiday.attrs.useMoonPhase,
        }
      : { useDate: true, useWeekday: false, useMoonPhase: false };
  if (!attrs.useDate && !attrs.useWeekday && !attrs.useMoonPhase) attrs.useDate = true;

  if (attrs.useDate) {
    const targetDay = clampI(holiday?.dayOfMonth ?? 1, 1, dayCtx.monthLength);
    if (dayCtx.dayNumber !== targetDay) return false;
  }

  if (attrs.useWeekday) {
    const weekday = clampI(holiday?.weekday ?? 0, 0, dayCtx.daysPerWeek - 1);
    if (dayCtx.weekdayIndex !== weekday) return false;
    if (holiday?.occurrence && holiday.occurrence !== "any") {
      const occ = weekdayOccurrence(
        dayCtx.dayNumber,
        dayCtx.monthLength,
        dayCtx.monthStartWeekday,
        weekday,
        dayCtx.daysPerWeek,
      );
      if (holiday.occurrence === "last") {
        if (!occ.isLast) return false;
      } else if (occ.nth !== clampI(holiday.occurrence, 1, 8)) {
        return false;
      }
    }
  }

  if (attrs.useMoonPhase) {
    const moon = pickMoonStateForHoliday(holiday, dayCtx.moonStates, { relative: false });
    if (!moon) return false;
    if ((moon.phase?.phaseShort || "") !== String(holiday?.moonPhase || "F")) return false;
  }

  return true;
}

function mergeHolidayDayMatches(matches) {
  const byHolidayId = new Map();
  for (const match of matches || []) {
    const holiday = match?.holiday;
    if (!holiday) continue;
    const key = String(holiday.id || "");
    if (!key) continue;
    const existing = byHolidayId.get(key);
    if (!existing) {
      byHolidayId.set(key, {
        holiday,
        startAbs: I(match.startAbs, 0),
        endAbs: I(match.endAbs, 0),
      });
      continue;
    }
    existing.startAbs = Math.min(existing.startAbs, I(match.startAbs, existing.startAbs));
    existing.endAbs = Math.max(existing.endAbs, I(match.endAbs, existing.endAbs));
  }
  return Array.from(byHolidayId.values());
}

function festivalAppliesInMonth(festival, year, monthIndex, monthsPerYear) {
  if (!recursInMonth(festival, year, monthIndex, monthsPerYear)) return false;
  if ((festival.exceptYears || []).includes(Math.max(1, I(year, 1)))) return false;
  if ((festival.exceptMonths || []).includes(clampI(monthIndex, 0, 1000) + 1)) return false;
  return true;
}

function buildFestivalBuckets(festivals, year, monthIndex, monthLength, monthsPerYear) {
  const inFlowByAfterDay = new Map();
  const outsideWeekFlow = [];
  const monthFestivalHits = new Map();

  for (const festival of festivals || []) {
    if (!festivalAppliesInMonth(festival, year, monthIndex, monthsPerYear)) continue;
    const startAfter = clampI(festival.afterDay, 0, monthLength);
    const duration = Math.max(1, I(festival.durationDays, 1));
    let hitCount = 0;
    for (let i = 0; i < duration; i++) {
      const rawAfter = startAfter + i;
      const afterDay = clampI(rawAfter, 0, monthLength);
      const eventDayNumber = Math.max(1, afterDay);
      if ((festival.exceptDays || []).includes(eventDayNumber)) continue;
      const entry = {
        ...festival,
        key: `${festival.id}-${i + 1}`,
        segment: i + 1,
        segmentCount: duration,
        afterDay,
      };
      if (festival.outsideWeekFlow) {
        outsideWeekFlow.push(entry);
      } else {
        if (!inFlowByAfterDay.has(afterDay)) inFlowByAfterDay.set(afterDay, []);
        inFlowByAfterDay.get(afterDay).push(entry);
      }
      hitCount += 1;
    }
    if (hitCount > 0) monthFestivalHits.set(festival.id, hitCount);
  }

  for (const [, list] of inFlowByAfterDay.entries()) {
    list.sort(
      (a, b) =>
        I(a.afterDay, 0) - I(b.afterDay, 0) ||
        String(a.name || "").localeCompare(String(b.name || "")) ||
        String(a.id || "").localeCompare(String(b.id || "")),
    );
  }
  outsideWeekFlow.sort(
    (a, b) =>
      I(a.afterDay, 0) - I(b.afterDay, 0) ||
      String(a.name || "").localeCompare(String(b.name || "")) ||
      String(a.id || "").localeCompare(String(b.id || "")),
  );

  return {
    inFlowByAfterDay,
    outsideWeekFlow,
    festivalsInMonth: Array.from(monthFestivalHits.entries()),
  };
}

function resolveHolidayMatches(matched) {
  const sorted = (Array.isArray(matched) ? matched : [])
    .slice()
    .sort(
      (a, b) =>
        I(b?.priority ?? 0, 0) - I(a?.priority ?? 0, 0) ||
        String(a?.name || "").localeCompare(String(b?.name || "")) ||
        String(a?.id || "").localeCompare(String(b?.id || "")),
    );
  const overrides = sorted.filter((h) => String(h?.mergeMode || "merge") === "override");
  if (overrides.length) return [overrides[0]];
  return sorted;
}

function buildAstronomyMarkers(ctx) {
  const settings = normalizeAstronomySettings(ctx?.settings);
  if (!settings.enabled) return [];
  const out = [];
  const yearLength = Math.max(1, I(ctx?.yearLength, 1));
  const yearDay = Math.max(1, I(ctx?.yearDay, 1));
  const moonStates = Array.isArray(ctx?.moonStates) ? ctx.moonStates : [];

  if (settings.seasons) {
    for (const s of SEASON_MARKER_DEFS) {
      const day = clampI(Math.round(yearLength * s.fraction) + 1, 1, yearLength);
      if (day === yearDay) {
        out.push({
          key: s.key,
          kind: "season",
          name: s.name,
          short: s.short,
          sourceLabel: "Planet year",
        });
      }
    }
  }

  if (settings.eclipses) {
    const cycleDays = 173.31;
    const windowDays = 17;
    const markerOffset = N(ctx?.absoluteDay, 0) + N(ctx?.moonEpochOffsetDays, 0);
    const seasonPos = mod(markerOffset, cycleDays);
    const inSeason = seasonPos <= windowDays || seasonPos >= cycleDays - windowDays;
    if (inSeason) {
      for (let idx = 0; idx < moonStates.length; idx++) {
        const moonState = moonStates[idx] || {};
        const phaseShort = String(moonState?.phase?.phaseShort || "");
        const sourceMoonName = String(moonState?.name || `Moon ${idx + 1}`).trim();
        const sourceMoonId = String(moonState?.id || "").trim();
        const sourceMoonIndex = Number.isFinite(Number(moonState?.moonIndex))
          ? clampI(Number(moonState.moonIndex), 0, MOON_COLORS.length - 1)
          : clampI(idx, 0, MOON_COLORS.length - 1);
        if (phaseShort === "N") {
          out.push({
            key: "solar-eclipse-window",
            kind: "eclipse",
            name: "Solar Eclipse Window",
            short: "SE",
            sourceMoonName,
            sourceMoonId,
            sourceMoonIndex,
          });
        }
        if (phaseShort === "F") {
          out.push({
            key: "lunar-eclipse-window",
            kind: "eclipse",
            name: "Lunar Eclipse Window",
            short: "LE",
            sourceMoonName,
            sourceMoonId,
            sourceMoonIndex,
          });
        }
      }
    }
  }

  return out;
}

function toAbsoluteDay(
  metrics,
  leapRules,
  year,
  monthIndex,
  dayOfMonth,
  monthLengthOverrides,
  intercalaryPeriods,
  firstYearStartDayIndex = 0,
  yearLayoutRuntime = createYearLayoutRuntime(),
) {
  const safeYear = Math.max(1, I(year, 1));
  const monthLengths = getMonthLengthsForYear(
    {
      metrics,
      year: safeYear,
      leapRules,
      monthLengthOverrides,
      intercalaryPeriods,
    },
    yearLayoutRuntime,
  );
  const monthsPerYear = Math.max(1, I(metrics?.monthsPerYear, 12));
  const safeMonth = clampI(monthIndex, 0, monthsPerYear - 1);
  const safeDay = clampI(dayOfMonth, 1, monthLengths[safeMonth] || 1);
  return getAbsoluteDayForDate(
    {
      metrics,
      year: safeYear,
      monthIndex: safeMonth,
      dayOfMonth: safeDay,
      leapRules,
      monthLengthOverrides,
      intercalaryPeriods,
      firstYearStartDayIndex,
    },
    yearLayoutRuntime,
  );
}

function fromAbsoluteDay(
  metrics,
  leapRules,
  absoluteDayInput,
  monthLengthOverrides,
  intercalaryPeriods,
  firstYearStartDayIndex = 0,
  yearLayoutRuntime = createYearLayoutRuntime(),
) {
  const resolved = getDatePartsForAbsoluteDay(
    {
      metrics,
      absoluteDay: absoluteDayInput,
      leapRules,
      monthLengthOverrides,
      intercalaryPeriods,
      firstYearStartDayIndex,
    },
    yearLayoutRuntime,
  );
  const monthsPerYear = Math.max(1, I(metrics?.monthsPerYear, 12));
  const intercalaryFallbackMonth =
    String(resolved.placement || "") === "year-end" ? Math.max(0, monthsPerYear - 1) : 0;
  const mappedMonthIndex =
    resolved.kind === "month"
      ? clampI(resolved.monthIndex, 0, monthsPerYear - 1)
      : clampI(
          resolved.anchorMonthIndex ?? resolved.monthIndex ?? intercalaryFallbackMonth,
          0,
          monthsPerYear - 1,
        );
  const monthLengths = getMonthLengthsForYear(
    {
      metrics,
      year: resolved.year,
      leapRules,
      monthLengthOverrides,
      intercalaryPeriods,
    },
    yearLayoutRuntime,
  );
  const mappedDayOfMonth =
    resolved.kind === "month"
      ? clampI(resolved.dayOfMonth, 1, monthLengths[mappedMonthIndex] || 1)
      : String(resolved.placement || "") === "before-month"
        ? 1
        : monthLengths[mappedMonthIndex] || 1;

  return {
    year: resolved.year,
    monthIndex: mappedMonthIndex,
    dayOfMonth: mappedDayOfMonth,
    absoluteDay: Math.max(0, I(absoluteDayInput, 0)),
    kind: resolved.kind,
    intercalaryDay: resolved.intercalaryDay,
    intercalaryPeriodId: resolved.intercalaryPeriodId,
    advancesWeekdayFlow: resolved.advancesWeekdayFlow,
    weekdayIndex: resolved.weekdayIndex,
    anchorMonthIndex: resolved.anchorMonthIndex,
    placement: resolved.placement,
  };
}

function gregorianEasterWesternMonthDay(yearInput) {
  const year = Math.max(1, I(yearInput, 1));
  const a = mod(year, 19);
  const b = Math.floor(year / 100);
  const c = mod(year, 100);
  const d = Math.floor(b / 4);
  const e = mod(b, 4);
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = mod(19 * a + b - d - g + 15, 30);
  const i = Math.floor(c / 4);
  const k = mod(c, 4);
  const l = mod(32 + 2 * e + 2 * i - h - k, 7);
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=Mar, 4=Apr
  const day = mod(h + l - 7 * m + 114, 31) + 1;
  return { monthIndex: month - 1, day };
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

function intercalaryPlacementSentence(placement, anchorMonthName) {
  const safeAnchor = String(anchorMonthName || "").trim();
  if (placement === "before-month")
    return safeAnchor ? `before ${safeAnchor}` : "before the selected month";
  if (placement === "after-month")
    return safeAnchor ? `after ${safeAnchor}` : "after the selected month";
  if (placement === "year-end") return "at year end";
  if (placement === "append-to-month")
    return safeAnchor ? `appended to ${safeAnchor}` : "appended to the selected month";
  return "as structural intercalary time";
}

function intercalaryFlowSentence(advancesWeekdayFlow) {
  return advancesWeekdayFlow ? "in weekday flow" : "outside weekday flow";
}

function intercalaryRuleSummary(period, ctx) {
  const monthCount = Math.max(
    1,
    I(ctx?.metrics?.monthsPerYear, Array.isArray(ctx?.monthNames) ? ctx.monthNames.length : 1),
  );
  const fallbackAnchorIndex = Math.max(0, monthCount - 1);
  const anchorMonthIndex =
    period?.anchorMonthIndex == null
      ? fallbackAnchorIndex
      : clampI(period.anchorMonthIndex, 0, fallbackAnchorIndex);
  const anchorMonthName = ctx?.monthNames?.[anchorMonthIndex] || `Month ${anchorMonthIndex + 1}`;
  const recurrence =
    period?.recurrence === "one-off"
      ? `one-off in Year ${Math.max(1, I(period?.year, 1))}`
      : period?.recurrence === "cyclic"
        ? `every ${Math.max(1, I(period?.cycleYears, 1))} years from Year ${Math.max(
            1,
            I(period?.offsetYear, 1),
          )}`
        : Math.max(1, I(period?.year, 1)) > 1
          ? `yearly from Year ${Math.max(1, I(period?.year, 1))}`
          : "yearly";
  const durationDays = Math.max(1, I(period?.durationDays, 1));
  const duration =
    String(period?.durationMode || "fixed") === "derived-remainder"
      ? "derived remainder"
      : `${durationDays} day${durationDays === 1 ? "" : "s"}`;
  const flow = intercalaryFlowSentence(
    String(period?.weekdayFlowMode || "in-flow") !== "outside-flow",
  );
  const bits = [
    recurrence,
    intercalaryPlacementSentence(period?.placement, anchorMonthName),
    duration,
    flow,
  ];
  if ((period?.exceptYears || []).length) {
    bits.push(`skip years: ${(period.exceptYears || []).join(", ")}`);
  }
  if (period?.legacyCompatibility) {
    bits.push("legacy compatibility");
  }
  return bits.join(" | ");
}

function flattenIntercalaryGroupDays(groups) {
  return (Array.isArray(groups) ? groups : []).flatMap((group) => group?.days || []);
}

function getSelectableCalendarDays(model) {
  return [
    ...flattenIntercalaryGroupDays(model?.intercalaryBeforeMonth),
    ...(model?.rows || [])
      .flatMap((row) => row?.cells || [])
      .filter(
        (cell) => cell && cell.kind !== "festival" && Number.isFinite(Number(cell.absoluteDay)),
      ),
    ...flattenIntercalaryGroupDays(model?.intercalaryAfterMonth),
  ];
}

function buildIntercalarySummaryItem(group) {
  const lengthDays = Math.max(0, I(group?.lengthDays, 0));
  const name = String(group?.name || "Intercalary period").trim() || "Intercalary period";
  const placement = intercalaryPlacementSentence(group?.placement, group?.anchorMonthName);
  const flow = intercalaryFlowSentence(group?.advancesWeekdayFlow);
  return `${name}: ${lengthDays} day${lengthDays === 1 ? "" : "s"} ${placement}, ${flow}`;
}

function buildMonthModel(params) {
  const {
    metrics,
    year,
    monthIndex,
    firstYearStartDayIndex,
    weekStartDayIndex,
    leapRules,
    monthLengthOverrides,
    intercalaryPeriods,
    dayNames,
    weekNames,
    monthNames,
    moonDefs,
    moonEpochOffsetDays,
    holidays,
    festivals,
    astronomySettings,
    workCycles,
    weekendDayIndexes,
    holidayAlgorithmSupport = buildHolidayAlgorithmSupport("none"),
  } = params;
  const safeYear = Math.max(1, I(year, 1));
  const safeMonth = clampI(monthIndex, 0, metrics.monthsPerYear - 1);
  const daysPerWeek = Math.max(1, I(metrics.daysPerWeek, 7));
  const weekStart = mod(I(weekStartDayIndex, 0), daysPerWeek);
  const weekendSet = new Set(normalizeWeekendDayIndexes(weekendDayIndexes, daysPerWeek));
  const monthCoreCache = new Map();
  const yearLayoutRuntime = createYearLayoutRuntime();

  const getMonthCore = (targetYear, targetMonth) => {
    const yearValue = Math.max(1, I(targetYear, 1));
    const monthValue = clampI(targetMonth, 0, metrics.monthsPerYear - 1);
    const cacheKey = `${yearValue}:${monthValue}`;
    if (monthCoreCache.has(cacheKey)) return monthCoreCache.get(cacheKey);

    const yearLayout = buildYearLayoutForYear(
      {
        metrics,
        year: yearValue,
        leapRules,
        monthLengthOverrides,
        intercalaryPeriods,
        firstYearStartDayIndex,
      },
      yearLayoutRuntime,
    );
    const monthSegment = yearLayout.monthSegments[monthValue];
    const monthLength = monthSegment.lengthDays;
    const yearLength = yearLayout.yearLengthDays;
    const daysBeforeMonth = monthSegment.dayOfYearStart;
    const monthStartWeekday = monthSegment.startWeekdayIndex;
    const absoluteMonthStart = monthSegment.absoluteStartDay;
    const days = [];
    for (let dayNumber = 1; dayNumber <= monthLength; dayNumber++) {
      const absoluteDay = absoluteMonthStart + dayNumber - 1;
      const weekdayIndex = mod(monthStartWeekday + dayNumber - 1, daysPerWeek);
      const moonStates = moonDefs.map((moonDef, moonIndex) => ({
        ...moonDef,
        moonIndex,
        phase: describeMoonPhase({
          ageDays: absoluteDay + N(moonEpochOffsetDays, 0),
          synodicDays: moonDef.synodicDays,
        }),
      }));
      const yearDay = daysBeforeMonth + dayNumber;
      const markers = buildAstronomyMarkers({
        settings: astronomySettings,
        yearLength,
        yearDay,
        absoluteDay,
        moonEpochOffsetDays,
        moonStates,
      });
      days.push({
        dayNumber,
        absoluteDay,
        weekdayIndex,
        moonStates,
        markers,
      });
    }
    const core = {
      year: yearValue,
      monthIndex: monthValue,
      monthLength,
      yearLength,
      daysBeforeMonth,
      monthStartWeekday,
      absoluteMonthStart,
      yearLayout,
      monthSegment,
      days,
    };
    monthCoreCache.set(cacheKey, core);
    return core;
  };

  const currentCore = getMonthCore(safeYear, safeMonth);
  const currentYearLayout = currentCore.yearLayout;
  const currentMonthSegment = currentCore.monthSegment;
  const monthLength = currentCore.monthLength;
  const monthStartWeekday = currentCore.monthStartWeekday;
  const absoluteMonthStart = currentCore.absoluteMonthStart;
  const absoluteMonthEnd = absoluteMonthStart + monthLength - 1;
  const structuralIntercalaryBefore = (currentYearLayout.segments || []).filter(
    (segment) =>
      segment.kind === "intercalary" &&
      String(segment.placement || "") === "before-month" &&
      I(segment.anchorMonthIndex, -1) === safeMonth,
  );
  const structuralIntercalaryAfter = (currentYearLayout.segments || []).filter(
    (segment) =>
      segment.kind === "intercalary" &&
      ((String(segment.placement || "") === "after-month" &&
        I(segment.anchorMonthIndex, -1) === safeMonth) ||
        (String(segment.placement || "") === "year-end" &&
          safeMonth === Math.max(0, metrics.monthsPerYear - 1))),
  );
  const visibleStartAbsoluteDay = Math.min(
    absoluteMonthStart,
    ...structuralIntercalaryBefore.map((segment) => segment.absoluteStartDay),
  );
  const visibleEndAbsoluteDay = Math.max(
    absoluteMonthEnd,
    ...structuralIntercalaryAfter.map(
      (segment) => segment.absoluteStartDay + Math.max(1, segment.lengthDays) - 1,
    ),
  );
  const leadingEmpty = mod(monthStartWeekday - weekStart, daysPerWeek);

  const headers = Array.from(
    { length: daysPerWeek },
    (_, i) => dayNames[mod(weekStart + i, daysPerWeek)],
  );
  const cells = [];
  for (let i = 0; i < leadingEmpty; i++) cells.push(null);

  const fullMoonDays = [];
  const newMoonDays = [];
  const holidayHits = new Map();
  const markerHits = new Map();
  const cycleHits = new Map();
  const holidaysById = new Map((holidays || []).map((holiday) => [String(holiday.id), holiday]));
  const holidayRelativeIssues = analyzeHolidayRelativeIssues(holidays);
  for (const holiday of holidays || []) {
    const holidayId = String(holiday?.id || "");
    if (!holidayId || holidayRelativeIssues.has(holidayId)) continue;
    if (String(holiday?.anchor?.type || "") !== "algorithmic") continue;
    const algorithmKey = String(holiday?.anchor?.algorithmKey || "none");
    if (!holidayAlgorithmAllowed(holidayAlgorithmSupport?.scope, algorithmKey)) {
      holidayRelativeIssues.set(
        holidayId,
        holidayAlgorithmSupport?.unavailableReason ||
          "Built-in Gregorian algorithm presets are only available in Sol/Earth Gregorian-compatible profiles.",
      );
    }
  }
  const startDayMemo = new Map();
  const startDayActive = new Set();

  const absoluteDayMetaCache = new Map();
  const getAbsoluteDayMeta = (absoluteDay) => {
    const safeAbsoluteDay = Math.max(0, I(absoluteDay, 0));
    if (absoluteDayMetaCache.has(safeAbsoluteDay)) return absoluteDayMetaCache.get(safeAbsoluteDay);
    const loc = fromAbsoluteDay(
      metrics,
      leapRules,
      safeAbsoluteDay,
      monthLengthOverrides,
      intercalaryPeriods,
      firstYearStartDayIndex,
      yearLayoutRuntime,
    );
    const core = getMonthCore(loc.year, loc.monthIndex);
    const dayNumber = clampI(loc.dayOfMonth, 1, core.monthLength);
    const dayIndex = dayNumber - 1;
    const weekdayIndex = Number.isFinite(Number(loc.weekdayIndex))
      ? clampI(loc.weekdayIndex, 0, daysPerWeek - 1)
      : (core.days?.[dayIndex]?.weekdayIndex ??
        mod(core.monthStartWeekday + dayIndex, daysPerWeek));
    const meta = {
      absoluteDay: safeAbsoluteDay,
      year: loc.year,
      monthIndex: loc.monthIndex,
      dayNumber,
      monthLength: core.monthLength,
      weekdayIndex,
      kind: loc.kind || "month",
      advancesWeekdayFlow: loc.advancesWeekdayFlow !== false,
      intercalaryPeriodId: loc.intercalaryPeriodId || "",
    };
    absoluteDayMetaCache.set(safeAbsoluteDay, meta);
    return meta;
  };

  const isWeekendAbsoluteDay = (absoluteDay) =>
    (() => {
      const meta = getAbsoluteDayMeta(absoluteDay);
      return meta.advancesWeekdayFlow && weekendSet.has(meta.weekdayIndex);
    })();

  const getRuleStartAbsoluteDays = (holidayRule, anchorYear, anchorMonth) => {
    const holidayId = String(holidayRule?.id || "");
    const yearValue = Math.max(1, I(anchorYear, 1));
    const monthValue = clampI(anchorMonth, 0, metrics.monthsPerYear - 1);
    const memoKey = `${holidayId}@${yearValue}:${monthValue}`;
    if (startDayMemo.has(memoKey)) return startDayMemo.get(memoKey);
    if (startDayActive.has(memoKey)) {
      holidayRelativeIssues.set(holidayId, "Circular relative/anchor dependency detected.");
      startDayMemo.set(memoKey, []);
      return [];
    }
    const anchorType = String(holidayRule?.anchor?.type || "fixed-date");
    const relativeCfg =
      holidayRule?.relative && typeof holidayRule.relative === "object"
        ? holidayRule.relative
        : null;
    const relativeType =
      relativeCfg?.enabled &&
      HOLIDAY_RELATIVE_TYPES.some(([value]) => value === String(relativeCfg?.type || ""))
        ? String(relativeCfg.type)
        : "none";
    const usesRelativeFallbackAnchor = anchorType === "fixed-date" && relativeType !== "none";
    const effectiveAnchorType = usesRelativeFallbackAnchor
      ? relativeType === "moon-phase"
        ? "moon-phase"
        : relativeType === "astronomy-marker"
          ? "astronomy-marker"
          : relativeType === "holiday"
            ? "holiday"
            : "fixed-date"
      : anchorType;
    const isAlgorithmicAnchor = anchorType === "algorithmic";
    if (
      !isAlgorithmicAnchor &&
      !recursInMonth(holidayRule, yearValue, monthValue, metrics.monthsPerYear)
    ) {
      startDayMemo.set(memoKey, []);
      return [];
    }
    if ((holidayRule?.exceptYears || []).includes(yearValue)) {
      startDayMemo.set(memoKey, []);
      return [];
    }
    if ((holidayRule?.exceptMonths || []).includes(monthValue + 1)) {
      startDayMemo.set(memoKey, []);
      return [];
    }
    if (holidayRelativeIssues.has(holidayId)) {
      startDayMemo.set(memoKey, []);
      return [];
    }

    startDayActive.add(memoKey);
    try {
      const monthCore = getMonthCore(yearValue, monthValue);
      const anchor =
        holidayRule?.anchor && typeof holidayRule.anchor === "object" ? holidayRule.anchor : {};
      const anchorMoonSlot = clampI(anchor.moonSlot ?? relativeCfg?.moonSlot ?? 0, 0, 3);
      const anchorMoonId = String(anchor.moonId ?? relativeCfg?.moonId ?? "");
      const anchorMoonPhase = String(anchor.moonPhase ?? relativeCfg?.moonPhase ?? "F");
      const anchorMarkerKey = String(anchor.markerKey ?? relativeCfg?.markerKey ?? "");
      const anchorHolidayId = String(anchor.holidayId ?? relativeCfg?.holidayId ?? "");
      let starts = [];
      if (effectiveAnchorType === "moon-phase") {
        starts = monthCore.days
          .filter((dayState) => {
            const moonRef = {
              moonId: anchorMoonId,
              moonSlot: clampI(
                anchorMoonSlot,
                0,
                Math.max(0, monthCore.days[0]?.moonStates?.length - 1),
              ),
            };
            const moonState = pickMoonStateForHoliday(moonRef, dayState.moonStates, {
              relative: false,
            });
            return !!moonState && (moonState.phase?.phaseShort || "") === anchorMoonPhase;
          })
          .map((dayState) => dayState.absoluteDay);
      } else if (effectiveAnchorType === "astronomy-marker") {
        starts = monthCore.days
          .filter((dayState) =>
            (dayState.markers || []).some(
              (marker) => String(marker?.key || "") === anchorMarkerKey,
            ),
          )
          .map((dayState) => dayState.absoluteDay);
      } else if (effectiveAnchorType === "holiday") {
        const depHoliday = holidaysById.get(anchorHolidayId);
        if (!depHoliday) {
          holidayRelativeIssues.set(holidayId, "Anchor holiday references a missing holiday.");
          starts = [];
        } else {
          starts = getRuleStartAbsoluteDays(depHoliday, yearValue, monthValue);
        }
      } else if (anchorType === "algorithmic") {
        if (
          holidayRule.recurrence !== "one-off" ||
          yearValue === Math.max(1, I(holidayRule.year, 1))
        ) {
          const algorithmKey = String(anchor.algorithmKey || "none");
          if (algorithmKey === "gregorian-easter-western") {
            const easter = gregorianEasterWesternMonthDay(yearValue);
            if (easter.monthIndex === monthValue && easter.monthIndex < metrics.monthsPerYear) {
              const targetDay = clampI(easter.day, 1, monthCore.monthLength);
              starts = [monthCore.absoluteMonthStart + targetDay - 1];
            }
          }
        }
      } else if (anchorType === "nth-weekday") {
        const weekday = clampI(holidayRule?.weekday ?? 0, 0, daysPerWeek - 1);
        const occurrence = String(holidayRule?.occurrence || "any");
        starts = monthCore.days
          .filter((dayState) => {
            if (dayState.weekdayIndex !== weekday) return false;
            if (occurrence === "any") return true;
            const occ = weekdayOccurrence(
              dayState.dayNumber,
              monthCore.monthLength,
              monthCore.monthStartWeekday,
              weekday,
              daysPerWeek,
            );
            if (occurrence === "last") return !!occ.isLast;
            return occ.nth === clampI(occurrence, 1, 8);
          })
          .map((dayState) => dayState.absoluteDay);
      } else {
        starts = monthCore.days
          .filter((dayState) =>
            dayMatchesHolidayBaseAttrs(holidayRule, {
              dayNumber: dayState.dayNumber,
              monthLength: monthCore.monthLength,
              monthStartWeekday: monthCore.monthStartWeekday,
              weekdayIndex: dayState.weekdayIndex,
              daysPerWeek,
              moonStates: dayState.moonStates,
            }),
          )
          .map((dayState) => dayState.absoluteDay);
      }

      const anchorOffsetDays = I(holidayRule?.offsetDays, 0);
      if (anchorOffsetDays !== 0) {
        starts = starts.map((absoluteDay) => absoluteDay + anchorOffsetDays);
      }

      const dedupedStarts = uniqueSortedNumbers(starts);
      startDayMemo.set(memoKey, dedupedStarts);
      return dedupedStarts;
    } finally {
      startDayActive.delete(memoKey);
    }
  };

  const inConflictScope = (holidayRule, otherHoliday) => {
    if (!otherHoliday) return false;
    if (String(otherHoliday.id || "") === String(holidayRule?.id || "")) return false;
    const scope = String(holidayRule?.conflictScope?.appliesAgainst || "all");
    if (scope === "all") return true;
    if (scope === "category") {
      const categories = Array.isArray(holidayRule?.conflictScope?.categories)
        ? holidayRule.conflictScope.categories
        : [];
      const otherCategory = normalizeHolidayCategory(otherHoliday?.category);
      if (categories.length) return categories.includes(otherCategory);
      return otherCategory === normalizeHolidayCategory(holidayRule?.category);
    }
    if (scope === "ids") {
      const ids = Array.isArray(holidayRule?.conflictScope?.holidayIds)
        ? holidayRule.conflictScope.holidayIds
        : [];
      return ids.includes(String(otherHoliday.id || ""));
    }
    return true;
  };

  const rangesOverlap = (startA, endA, startB, endB) => startA <= endB && endA >= startB;

  const applyWeekendObservanceStart = (startAbs, holidayRule) => {
    const weekendRule = normalizeWeekendRule(holidayRule?.observance?.weekendRule);
    if (weekendRule === "none") return startAbs;
    if (!isWeekendAbsoluteDay(startAbs)) return startAbs;
    const maxShiftDays = Math.max(0, I(holidayRule?.observance?.maxShiftDays, 7));
    if (maxShiftDays <= 0) return startAbs;
    const stayInMonth = !!holidayRule?.observance?.stayInMonth;
    const origin = getAbsoluteDayMeta(startAbs);
    const isAllowed = (candidateAbs) => {
      if (candidateAbs < 0) return false;
      if (Math.abs(candidateAbs - startAbs) > maxShiftDays) return false;
      if (!stayInMonth) return true;
      const candidate = getAbsoluteDayMeta(candidateAbs);
      return candidate.year === origin.year && candidate.monthIndex === origin.monthIndex;
    };
    const isWeekdayCandidate = (candidateAbs) =>
      isAllowed(candidateAbs) && !isWeekendAbsoluteDay(candidateAbs);

    if (weekendRule === "next-monday") {
      for (let step = 1; step <= maxShiftDays; step++) {
        const candidateAbs = startAbs + step;
        if (!isAllowed(candidateAbs)) continue;
        const weekdayIndex = getAbsoluteDayMeta(candidateAbs).weekdayIndex;
        if (weekdayIndex === 0 && !isWeekendAbsoluteDay(candidateAbs)) return candidateAbs;
      }
      return startAbs;
    }

    if (weekendRule === "nearest-weekday") {
      for (let step = 1; step <= maxShiftDays; step++) {
        const previousAbs = startAbs - step;
        const nextAbs = startAbs + step;
        const previousOk = isWeekdayCandidate(previousAbs);
        const nextOk = isWeekdayCandidate(nextAbs);
        if (previousOk && nextOk) return previousAbs;
        if (previousOk) return previousAbs;
        if (nextOk) return nextAbs;
      }
      return startAbs;
    }

    if (weekendRule === "next-weekday") {
      for (let step = 1; step <= maxShiftDays; step++) {
        const candidateAbs = startAbs + step;
        if (isWeekdayCandidate(candidateAbs)) return candidateAbs;
      }
      return startAbs;
    }

    if (weekendRule === "previous-weekday") {
      for (let step = 1; step <= maxShiftDays; step++) {
        const candidateAbs = startAbs - step;
        if (isWeekdayCandidate(candidateAbs)) return candidateAbs;
      }
      return startAbs;
    }

    return startAbs;
  };

  const hasConflictAtStart = (startAbs, durationDays, holidayRule, acceptedOccurrences) => {
    const endAbs = startAbs + durationDays - 1;
    for (const occurrence of acceptedOccurrences || []) {
      if (!occurrence?.holiday) continue;
      if (!inConflictScope(holidayRule, occurrence.holiday)) continue;
      if (rangesOverlap(startAbs, endAbs, occurrence.startAbs, occurrence.endAbs)) return true;
    }
    return false;
  };

  const applyConflictObservanceStart = (startAbs, holidayRule, acceptedOccurrences) => {
    const conflictRule = String(holidayRule?.observance?.holidayConflictRule || "merge");
    if (!["shift-forward", "shift-backward", "next-weekday"].includes(conflictRule))
      return startAbs;
    const durationDays = Math.max(1, I(holidayRule?.durationDays, 1));
    const maxShiftDays = Math.max(0, I(holidayRule?.observance?.maxShiftDays, 7));
    if (maxShiftDays <= 0) return startAbs;
    if (!hasConflictAtStart(startAbs, durationDays, holidayRule, acceptedOccurrences))
      return startAbs;
    const stayInMonth = !!holidayRule?.observance?.stayInMonth;
    const origin = getAbsoluteDayMeta(startAbs);
    const isAllowed = (candidateAbs) => {
      if (candidateAbs < 0) return false;
      if (Math.abs(candidateAbs - startAbs) > maxShiftDays) return false;
      if (!stayInMonth) return true;
      const candidate = getAbsoluteDayMeta(candidateAbs);
      return candidate.year === origin.year && candidate.monthIndex === origin.monthIndex;
    };
    for (let step = 1; step <= maxShiftDays; step++) {
      let candidateAbs = startAbs;
      if (conflictRule === "shift-forward") {
        candidateAbs = startAbs + step;
      } else if (conflictRule === "shift-backward") {
        candidateAbs = startAbs - step;
      } else if (conflictRule === "next-weekday") {
        candidateAbs = startAbs + step;
        if (isWeekendAbsoluteDay(candidateAbs)) continue;
      }
      if (!isAllowed(candidateAbs)) continue;
      const weekendAdjustedAbs = applyWeekendObservanceStart(candidateAbs, holidayRule);
      if (!isAllowed(weekendAdjustedAbs)) continue;
      if (!hasConflictAtStart(weekendAdjustedAbs, durationDays, holidayRule, acceptedOccurrences)) {
        return weekendAdjustedAbs;
      }
    }
    return startAbs;
  };

  const holidayMatchesByAbsoluteDay = new Map();
  const currentLinearMonth = toLinearMonthOrdinal(safeYear, safeMonth, metrics.monthsPerYear);
  const avgDaysPerMonth = Math.max(
    1,
    N(currentCore.yearLength, monthLength) / Math.max(1, metrics.monthsPerYear),
  );
  const maxRelativeOffsetDays = Math.max(
    0,
    ...(holidays || []).map((holidayRule) =>
      Math.abs(I(holidayRule?.relative?.enabled ? holidayRule.relative.offsetDays : 0, 0)),
    ),
  );
  const maxAnchorOffsetDays = Math.max(
    0,
    ...(holidays || []).map((holidayRule) => Math.abs(I(holidayRule?.offsetDays, 0))),
  );
  const maxObservanceShiftDays = Math.max(
    0,
    ...(holidays || []).map((holidayRule) =>
      Math.max(0, I(holidayRule?.observance?.maxShiftDays, 0)),
    ),
  );
  const maxHolidayDurationDays = Math.max(
    1,
    ...(holidays || []).map((holidayRule) => Math.max(1, I(holidayRule?.durationDays, 1))),
  );
  const dynamicScanRadius = Math.max(
    HOLIDAY_SCAN_MONTH_RADIUS,
    Math.ceil(
      (maxRelativeOffsetDays +
        maxAnchorOffsetDays +
        maxObservanceShiftDays +
        maxHolidayDurationDays) /
        avgDaysPerMonth,
    ) + 2,
  );
  const minLinearMonth = Math.max(0, currentLinearMonth - dynamicScanRadius);
  const maxLinearMonth = currentLinearMonth + dynamicScanRadius;

  const holidayOccurrencesRaw = [];
  for (const holidayRule of holidays || []) {
    const durationDays = Math.max(1, I(holidayRule?.durationDays, 1));
    for (let linearMonth = minLinearMonth; linearMonth <= maxLinearMonth; linearMonth++) {
      const { year: anchorYear, monthIndex: anchorMonth } = fromLinearMonthOrdinal(
        linearMonth,
        metrics.monthsPerYear,
      );
      const starts = getRuleStartAbsoluteDays(holidayRule, anchorYear, anchorMonth);
      for (const startAbs of starts) {
        holidayOccurrencesRaw.push({
          holiday: holidayRule,
          startAbs: I(startAbs, 0),
          endAbs: I(startAbs, 0) + durationDays - 1,
          durationDays,
        });
      }
    }
  }

  holidayOccurrencesRaw.sort(
    (a, b) =>
      I(b?.holiday?.priority ?? 0, 0) - I(a?.holiday?.priority ?? 0, 0) ||
      I(a?.startAbs ?? 0, 0) - I(b?.startAbs ?? 0, 0) ||
      String(a?.holiday?.name || "").localeCompare(String(b?.holiday?.name || "")) ||
      String(a?.holiday?.id || "").localeCompare(String(b?.holiday?.id || "")),
  );

  const holidayOccurrences = [];
  for (const occurrence of holidayOccurrencesRaw) {
    const holidayRule = occurrence.holiday;
    const durationDays = Math.max(1, I(occurrence.durationDays, 1));
    let shiftedStartAbs = applyWeekendObservanceStart(occurrence.startAbs, holidayRule);
    shiftedStartAbs = applyConflictObservanceStart(
      shiftedStartAbs,
      holidayRule,
      holidayOccurrences,
    );
    const shiftedEndAbs = shiftedStartAbs + durationDays - 1;
    const resolvedOccurrence = {
      holiday: holidayRule,
      startAbs: shiftedStartAbs,
      endAbs: shiftedEndAbs,
      durationDays,
    };
    holidayOccurrences.push(resolvedOccurrence);
    if (shiftedEndAbs < visibleStartAbsoluteDay || shiftedStartAbs > visibleEndAbsoluteDay)
      continue;
    const fromAbs = Math.max(shiftedStartAbs, visibleStartAbsoluteDay);
    const toAbs = Math.min(shiftedEndAbs, visibleEndAbsoluteDay);
    for (let absoluteDay = fromAbs; absoluteDay <= toAbs; absoluteDay++) {
      const meta = getAbsoluteDayMeta(absoluteDay);
      if (meta.kind === "month" && (holidayRule?.exceptDays || []).includes(meta.dayNumber)) {
        continue;
      }
      if (!holidayMatchesByAbsoluteDay.has(absoluteDay)) {
        holidayMatchesByAbsoluteDay.set(absoluteDay, []);
      }
      holidayMatchesByAbsoluteDay.get(absoluteDay).push({
        holiday: holidayRule,
        startAbs: shiftedStartAbs,
        endAbs: shiftedEndAbs,
      });
    }
  }

  const festivalBuckets = buildFestivalBuckets(
    festivals || [],
    safeYear,
    safeMonth,
    monthLength,
    metrics.monthsPerYear,
  );
  for (const fest of festivalBuckets.inFlowByAfterDay.get(0) || []) {
    cells.push({ kind: "festival", festival: fest });
  }

  const currentMonthName = monthNames[safeMonth] || `Month ${safeMonth + 1}`;

  const resolveVisibleHolidayState = (absoluteDay) => {
    const mergedMatches = mergeHolidayDayMatches(
      holidayMatchesByAbsoluteDay.get(absoluteDay) || [],
    );
    const resolvedHolidays = resolveHolidayMatches(mergedMatches.map((match) => match.holiday));
    const resolvedIds = new Set(resolvedHolidays.map((holiday) => String(holiday.id || "")));
    const holidayDetails = mergedMatches
      .filter((match) => resolvedIds.has(String(match.holiday?.id || "")))
      .map((match) => ({
        ...match,
        startsToday: match.startAbs === absoluteDay,
        endsToday: match.endAbs === absoluteDay,
        continuesFromPrev: match.startAbs < absoluteDay,
        continuesToNext: match.endAbs > absoluteDay,
      }));
    return { resolvedHolidays, holidayDetails };
  };

  const accumulateVisibleSummary = (cell) => {
    for (const holiday of cell.holidays || []) {
      holidayHits.set(holiday.id, (holidayHits.get(holiday.id) || 0) + 1);
    }
    for (const marker of cell.markers || []) {
      const markerKey = astronomyMarkerAggregateKey(marker);
      markerHits.set(markerKey, {
        key: marker.key,
        name: marker.name,
        short: marker.short,
        sourceLabel: marker.sourceLabel,
        sourceMoonId: marker.sourceMoonId,
        sourceMoonName: marker.sourceMoonName,
        sourceMoonIndex: marker.sourceMoonIndex,
        count: (markerHits.get(markerKey)?.count || 0) + 1,
      });
    }
    for (const cycle of cell.cycles || []) {
      const cycleKey = String(cycle.ruleId || cycle.ruleName || "");
      if (!cycleKey) continue;
      const existing = cycleHits.get(cycleKey);
      cycleHits.set(cycleKey, {
        ruleId: cycle.ruleId,
        ruleName: cycle.ruleName,
        kind: cycle.kind,
        short: cycle.short,
        label: cycle.label,
        count: (existing?.count || 0) + 1,
      });
    }
  };

  const buildMoonStatesForAbsoluteDay = (absoluteDay) =>
    moonDefs.map((moonDef, moonIndex) => ({
      ...moonDef,
      moonIndex,
      phase: describeMoonPhase({
        ageDays: absoluteDay + N(moonEpochOffsetDays, 0),
        synodicDays: moonDef.synodicDays,
      }),
    }));

  const buildMarkersForAbsoluteDay = (absoluteDay, moonStates) =>
    buildAstronomyMarkers({
      settings: astronomySettings,
      yearLength: currentCore.yearLength,
      yearDay: absoluteDay - currentYearLayout.yearAbsoluteStart + 1,
      absoluteDay,
      moonEpochOffsetDays,
      moonStates,
    });

  const buildIntercalaryDayCell = (segment, offsetInSegment) => {
    const absoluteDay = segment.absoluteStartDay + offsetInSegment;
    const weekdayIndex = segment.advancesWeekdayFlow
      ? mod(segment.startWeekdayIndex + offsetInSegment, daysPerWeek)
      : clampI(segment.startWeekdayIndex, 0, daysPerWeek - 1);
    const moonStates = buildMoonStatesForAbsoluteDay(absoluteDay);
    const markers = buildMarkersForAbsoluteDay(absoluteDay, moonStates);
    const cycles = evaluateWorkCyclesForDay(workCycles, absoluteDay);
    const { resolvedHolidays, holidayDetails } = resolveVisibleHolidayState(absoluteDay);
    const anchorMonthIndex =
      segment.anchorMonthIndex == null || String(segment.placement || "") === "year-end"
        ? Math.max(0, metrics.monthsPerYear - 1)
        : clampI(segment.anchorMonthIndex, 0, metrics.monthsPerYear - 1);
    const anchorMonthName = monthNames[anchorMonthIndex] || `Month ${anchorMonthIndex + 1}`;
    const cell = {
      kind: "intercalary",
      dayNumber: null,
      absoluteDay,
      weekdayIndex,
      moonStates,
      holidays: resolvedHolidays,
      holidayDetails,
      markers,
      cycles,
      intercalaryDay: offsetInSegment + 1,
      intercalaryLength: Math.max(1, I(segment.lengthDays, 1)),
      intercalaryName: String(segment.name || "Intercalary period").trim() || "Intercalary period",
      intercalaryPeriodId: String(segment.intercalaryPeriodId || ""),
      placement: String(segment.placement || "year-end"),
      advancesWeekdayFlow: !!segment.advancesWeekdayFlow,
      anchorMonthIndex,
      anchorMonthName,
      mappedDayOfMonth:
        String(segment.placement || "") === "before-month" ? 1 : Math.max(1, monthLength),
    };
    accumulateVisibleSummary(cell);
    return cell;
  };

  const buildIntercalaryGroup = (segment) => {
    const anchorMonthIndex =
      segment.anchorMonthIndex == null || String(segment.placement || "") === "year-end"
        ? Math.max(0, metrics.monthsPerYear - 1)
        : clampI(segment.anchorMonthIndex, 0, metrics.monthsPerYear - 1);
    const anchorMonthName = monthNames[anchorMonthIndex] || `Month ${anchorMonthIndex + 1}`;
    return {
      id:
        String(segment.intercalaryPeriodId || "").trim() ||
        `${String(segment.placement || "intercalary")}-${segment.absoluteStartDay}`,
      name: String(segment.name || "Intercalary period").trim() || "Intercalary period",
      placement: String(segment.placement || "year-end"),
      lengthDays: Math.max(1, I(segment.lengthDays, 1)),
      advancesWeekdayFlow: !!segment.advancesWeekdayFlow,
      anchorMonthIndex,
      anchorMonthName,
      legacyCompatibility: !!segment.legacyCompatibility,
      weekdayFlowMode: String(segment.weekdayFlowMode || ""),
      days: Array.from({ length: Math.max(1, I(segment.lengthDays, 1)) }, (_, index) =>
        buildIntercalaryDayCell(segment, index),
      ),
    };
  };

  const intercalaryBeforeMonth = structuralIntercalaryBefore.map((segment) =>
    buildIntercalaryGroup(segment),
  );
  const intercalaryAfterMonth = structuralIntercalaryAfter.map((segment) =>
    buildIntercalaryGroup(segment),
  );
  const legacyAppendedIntercalaryPeriods = (currentMonthSegment.appendedIntercalaryPeriods || [])
    .filter((period) => Math.max(0, I(period?.lengthDays, 0)) > 0)
    .map((period) => ({
      id:
        String(period?.intercalaryPeriodId || "").trim() ||
        `append-${safeYear}-${safeMonth}-${String(period?.name || "").trim() || "period"}`,
      name: String(period?.name || "Appended intercalary").trim() || "Appended intercalary",
      placement: "append-to-month",
      lengthDays: Math.max(0, I(period?.lengthDays, 0)),
      advancesWeekdayFlow: period?.advancesWeekdayFlow !== false,
      anchorMonthIndex: safeMonth,
      anchorMonthName: currentMonthName,
      legacyCompatibility: !!period?.legacyCompatibility,
    }));
  const intercalarySummary = [
    ...intercalaryBeforeMonth.map((group) => buildIntercalarySummaryItem(group)),
    ...intercalaryAfterMonth.map((group) => buildIntercalarySummaryItem(group)),
    ...legacyAppendedIntercalaryPeriods.map((group) => buildIntercalarySummaryItem(group)),
  ];

  for (const dayState of currentCore.days) {
    const dayNumber = dayState.dayNumber;
    const absoluteDay = dayState.absoluteDay;
    const weekdayIndex = dayState.weekdayIndex;
    const moonStates = dayState.moonStates;
    const markers = dayState.markers;
    const cycles = evaluateWorkCyclesForDay(workCycles, absoluteDay);

    if (moonStates[0]?.phase?.phaseShort === "F") fullMoonDays.push(dayNumber);
    if (moonStates[0]?.phase?.phaseShort === "N") newMoonDays.push(dayNumber);

    const { resolvedHolidays, holidayDetails } = resolveVisibleHolidayState(absoluteDay);
    const cell = {
      kind: "month",
      dayNumber,
      absoluteDay,
      weekdayIndex,
      moonStates,
      holidays: resolvedHolidays,
      holidayDetails,
      markers,
      cycles,
      anchorMonthIndex: safeMonth,
      anchorMonthName: currentMonthName,
      mappedDayOfMonth: dayNumber,
    };
    accumulateVisibleSummary(cell);
    cells.push(cell);
    for (const fest of festivalBuckets.inFlowByAfterDay.get(dayNumber) || []) {
      cells.push({ kind: "festival", festival: fest });
    }
  }

  const rows = [];
  const rowCount = Math.ceil(cells.length / daysPerWeek);
  const weekLabels = normalizeNameList(weekNames, rowCount, "Week");
  for (let row = 0; row < rowCount; row++) {
    const rowCells = cells.slice(row * daysPerWeek, row * daysPerWeek + daysPerWeek);
    while (rowCells.length < daysPerWeek) rowCells.push(null);
    rows.push({ weekName: weekLabels[row] || `Week ${row + 1}`, cells: rowCells });
  }

  return {
    year: safeYear,
    monthIndex: safeMonth,
    monthName: currentMonthName,
    monthLength,
    yearLength: currentCore.yearLength,
    daysBeforeMonth: currentCore.daysBeforeMonth,
    absoluteMonthStart,
    monthStartWeekday,
    headers,
    rows,
    intercalaryBeforeMonth,
    intercalaryAfterMonth,
    legacyAppendedIntercalaryPeriods,
    intercalarySummary,
    intercalaryDayCountInView:
      flattenIntercalaryGroupDays(intercalaryBeforeMonth).length +
      flattenIntercalaryGroupDays(intercalaryAfterMonth).length,
    fullMoonDays,
    newMoonDays,
    holidaysInMonth: Array.from(holidayHits.entries()),
    markersInMonth: Array.from(markerHits.values()),
    cyclesInMonth: Array.from(cycleHits.values()),
    festivalsInMonth: festivalBuckets.festivalsInMonth,
    outsideWeekFlowFestivals: festivalBuckets.outsideWeekFlow,
    holidayIssueById: Object.fromEntries(holidayRelativeIssues.entries()),
  };
}

const { buildContext } = createCalendarContextBuilder({ buildMonthModel });

/* ── Rule Debugger: on-demand trace for a selected day ──────────── */

function traceRulesForDay({
  cell,
  model,
  holidays,
  festivals,
  workCycles,
  leapRules,
  metrics,
  dayNames,
  monthNames,
  weekendDayIndexes,
}) {
  if (!cell || !Number.isFinite(cell.absoluteDay)) return null;

  const daysPerWeek = Math.max(1, I(metrics?.daysPerWeek, 7));
  const weekendSet = new Set(normalizeWeekendDayIndexes(weekendDayIndexes, daysPerWeek));
  const weekdayBaseName =
    (Array.isArray(dayNames) ? dayNames : [])[cell.weekdayIndex] || `Day ${cell.weekdayIndex + 1}`;
  const isWeekend = cell.advancesWeekdayFlow !== false && weekendSet.has(cell.weekdayIndex);
  const weekdayName =
    cell.kind === "intercalary" && cell.advancesWeekdayFlow === false
      ? `Outside weekday flow (anchored to ${weekdayBaseName})`
      : weekdayBaseName;

  // Active leap rules this year
  const safeRules = normalizeLeapRules(leapRules, metrics?.monthsPerYear || 12);
  const activeLeap = safeRules.filter((rule) => {
    const cycle = Math.max(1, I(rule.cycleYears, 1));
    const offset = I(rule.offsetYear, 0);
    return mod(model.year - 1 - offset, cycle) === 0;
  });

  // Moon phases for display
  const moonPhases = (cell.moonStates || []).map((m) => ({
    name: m.name || "Moon",
    phaseShort: m.phase?.phaseShort || "?",
    phaseName: m.phase?.phaseName || "Unknown",
    illumination: m.phase?.illuminationPct ?? 0,
    ageDays: m.phase?.ageDays ?? 0,
    synodic: m.synodicDays ?? 0,
  }));

  const raw = {
    kind: cell.kind || "month",
    dayNumber: cell.dayNumber,
    dayLabel:
      cell.kind === "intercalary"
        ? `${cell.intercalaryName || "Intercalary period"} day ${cell.intercalaryDay || 1}`
        : `Day ${cell.dayNumber}`,
    absoluteDay: cell.absoluteDay,
    weekdayIndex: cell.weekdayIndex,
    weekdayName,
    isWeekend,
    moonPhases,
    advancesWeekdayFlow: cell.advancesWeekdayFlow !== false,
    intercalaryPeriodId: cell.intercalaryPeriodId || "",
    placement: cell.placement || "",
    leapRulesActive: activeLeap.map((r) => ({
      name: r.name || "Unnamed",
      month: r.monthIndex + 1,
      delta: r.dayDelta,
    })),
    festivalSlot: cell.kind === "festival",
  };

  // Trace holidays
  const issueById = model.holidayIssueById || {};
  const resolvedIds = new Set((cell.holidays || []).map((h) => String(h.id || "")));
  const detailById = new Map(
    (cell.holidayDetails || []).map((d) => [String(d.holiday?.id || ""), d]),
  );
  const allHolidays = Array.isArray(holidays) ? holidays : [];
  const monthsPerYear = Math.max(1, I(metrics?.monthsPerYear, 12));

  const holidayTraces = allHolidays.map((rule) => {
    const id = String(rule.id || "");
    const name = String(rule.name || "Unnamed");
    const category = normalizeHolidayCategory(rule.category);
    const anchorType = String(rule.anchor?.type || "fixed-date");
    const priority = I(rule.priority, 0);
    const mergeMode = String(rule.mergeMode || "merge");
    const matched = resolvedIds.has(id);
    const detail = detailById.get(id);

    // Determine reason for match / non-match
    let reason;
    if (issueById[id]) {
      reason = `Error: ${issueById[id]}`;
    } else if (matched) {
      const anchorLabel = HOLIDAY_ANCHOR_TYPES.find(([v]) => v === anchorType)?.[1] || anchorType;
      if (detail) {
        const span =
          detail.startAbs === detail.endAbs
            ? `day ${detail.startAbs + 1}`
            : `days ${detail.startAbs + 1}\u2013${detail.endAbs + 1}`;
        reason = `Matched via ${anchorLabel}, covers ${span}`;
        if (detail.continuesFromPrev) reason += " (continues from previous day)";
      } else {
        reason = `Matched via ${anchorLabel}`;
      }
    } else if (!recursInMonth(rule, model.year, model.monthIndex, monthsPerYear)) {
      reason = eventRecurrenceMismatchReason(rule, model.year, model.monthIndex, monthsPerYear, {
        monthNames,
      });
    } else if ((rule.exceptYears || []).includes(model.year)) {
      reason = `Excluded: year ${model.year} in exceptYears`;
    } else if ((rule.exceptMonths || []).includes(model.monthIndex + 1)) {
      reason = `Excluded: month ${model.monthIndex + 1} in exceptMonths`;
    } else if (
      Number.isFinite(Number(cell.dayNumber)) &&
      (rule.exceptDays || []).includes(cell.dayNumber)
    ) {
      reason = `Excluded: day ${cell.dayNumber} in exceptDays`;
    } else {
      const anchorLabel = HOLIDAY_ANCHOR_TYPES.find(([v]) => v === anchorType)?.[1] || anchorType;
      reason = `Anchor "${anchorLabel}" did not produce a start covering this day`;
    }

    return {
      id,
      name,
      category,
      matched,
      reason,
      anchorType,
      priority,
      mergeMode,
      resolved: matched,
      weekendShift: detail
        ? detail.startAbs !== cell.absoluteDay && detail.startsToday
          ? "shifted"
          : null
        : null,
      conflictShift: null,
    };
  });

  // Trace festivals
  const festivalTraces = (Array.isArray(festivals) ? festivals : []).map((rule) => {
    const id = String(rule.id || "");
    const name = String(rule.name || "Unnamed");
    if (cell.kind === "intercalary") {
      return {
        id,
        name,
        matched: false,
        reason: "Festival rules target in-month festival slots, not structural intercalary dates",
      };
    }
    if (!recursInMonth(rule, model.year, model.monthIndex, monthsPerYear)) {
      return {
        id,
        name,
        matched: false,
        reason: eventRecurrenceMismatchReason(rule, model.year, model.monthIndex, monthsPerYear, {
          monthNames,
        }),
      };
    }
    if ((rule.exceptYears || []).includes(model.year)) {
      return { id, name, matched: false, reason: `Excluded: year ${model.year} in exceptYears` };
    }
    if ((rule.exceptMonths || []).includes(model.monthIndex + 1)) {
      return {
        id,
        name,
        matched: false,
        reason: `Excluded: month ${model.monthIndex + 1} in exceptMonths`,
      };
    }
    if (
      Number.isFinite(Number(cell.dayNumber)) &&
      (rule.exceptDays || []).includes(cell.dayNumber)
    ) {
      return {
        id,
        name,
        matched: false,
        reason: `Excluded: day ${cell.dayNumber} in exceptDays`,
      };
    }
    const afterDay = clampI(rule.afterDay, 0, model.monthLength);
    const duration = Math.max(1, I(rule.durationDays, 1));
    const startDay = afterDay + 1;
    const endDay = afterDay + duration;
    if (cell.dayNumber >= startDay && cell.dayNumber <= endDay) {
      const seg = cell.dayNumber - afterDay;
      return {
        id,
        name,
        matched: true,
        reason: `After day ${afterDay}, segment ${seg}/${duration}`,
      };
    }
    return {
      id,
      name,
      matched: false,
      reason: `Covers days ${startDay}\u2013${endDay}, this is day ${cell.dayNumber}`,
    };
  });

  // Trace work cycles
  const cycleTraces = (Array.isArray(workCycles) ? workCycles : []).map((rule) => {
    const id = String(rule.id || "");
    const name = String(rule.name || "Unnamed");
    const modeLabel = rule.mode === "interval" ? "interval" : "duty";
    const startAbsoluteDay = Math.max(0, I(rule.startAbsoluteDay, 0));
    const dayOffset = cell.absoluteDay - startAbsoluteDay;
    if (dayOffset < 0) {
      return {
        id,
        name,
        mode: modeLabel,
        matched: false,
        reason: `Cycle starts at absolute day ${startAbsoluteDay}, this is ${cell.absoluteDay} (before start)`,
      };
    }
    if (rule.mode === "interval") {
      const intervalDays = Math.max(1, I(rule.intervalDays, 1));
      const hit = mod(dayOffset, intervalDays) === 0;
      return {
        id,
        name,
        mode: modeLabel,
        matched: hit,
        reason: hit
          ? `Interval ${intervalDays}: offset ${dayOffset} is a multiple`
          : `Interval ${intervalDays}: offset ${dayOffset} remainder ${mod(dayOffset, intervalDays)}`,
      };
    }
    const onDays = Math.max(1, I(rule.onDays, 1));
    const offDays = Math.max(1, I(rule.offDays, 1));
    const span = onDays + offDays;
    const pos = mod(dayOffset, span);
    const isActive = pos < onDays;
    return {
      id,
      name,
      mode: modeLabel,
      matched: true,
      reason: `Position ${pos + 1}/${span} (${isActive ? "active" : "rest"}: ${onDays} on / ${offDays} off)`,
    };
  });

  return { raw, holidays: holidayTraces, festivals: festivalTraces, workCycles: cycleTraces };
}

function traceToPlainText(trace) {
  if (!trace) return "No trace data.";
  const lines = [];
  const r = trace.raw;
  lines.push(
    `${r.dayLabel} | Absolute ${r.absoluteDay} | ${r.weekdayName} (index ${r.weekdayIndex})${r.isWeekend ? " [weekend]" : ""}`,
  );
  if (r.kind === "intercalary") {
    lines.push(
      `Intercalary structure: ${intercalaryPlacementLabel(r.placement, r.anchorMonthName)} | ${intercalaryFlowLabel(r.advancesWeekdayFlow)}`,
    );
  }
  if (r.moonPhases.length) {
    lines.push(
      `Moons: ${r.moonPhases.map((m) => `${m.name} ${m.phaseShort} (${m.phaseName}, ${fmt(m.illumination, 1)}%)`).join("; ")}`,
    );
  }
  if (r.leapRulesActive.length) {
    lines.push(
      `Leap rules active: ${r.leapRulesActive.map((l) => `${l.name} (month ${l.month}, ${l.delta > 0 ? "+" : ""}${l.delta}d)`).join("; ")}`,
    );
  }
  if (trace.holidays.length) {
    lines.push("", "HOLIDAYS:");
    for (const h of trace.holidays) {
      const mark = h.matched ? "[MATCH]" : "[  --  ]";
      lines.push(
        `  ${mark} ${h.name} | anchor=${h.anchorType} priority=${h.priority} merge=${h.mergeMode} | ${h.reason}`,
      );
    }
  }
  if (trace.festivals.length) {
    lines.push("", "FESTIVALS:");
    for (const f of trace.festivals) {
      const mark = f.matched ? "[MATCH]" : "[  --  ]";
      lines.push(`  ${mark} ${f.name} | ${f.reason}`);
    }
  }
  if (trace.workCycles.length) {
    lines.push("", "WORK CYCLES:");
    for (const c of trace.workCycles) {
      const mark = c.matched ? "[MATCH]" : "[  --  ]";
      lines.push(`  ${mark} ${c.name} (${c.mode}) | ${c.reason}`);
    }
  }
  return lines.join("\n");
}

export function initCalendarPage(mountEl) {
  const initialWorld = loadWorld();
  const state = readState(initialWorld);
  const runtime = {
    editingHolidayId: null,
    editingFestivalId: null,
    editingIntercalaryId: null,
    editingCycleId: null,
    auditPanelKey: "",
  };

  const wrap = document.createElement("div");
  wrap.className = "page";
  wrap.innerHTML = `
    <div class="panel"><div class="panel__header"><h1 class="panel__title"><span class="ws-icon icon--calendar" aria-hidden="true"></span><span>Calendar</span></h1><button id="calTutorials" type="button" class="ws-tutorial-trigger" data-tip="${esc(TIPS.Tutorials || "")}">Tutorials</button></div><div class="panel__body">${buildPageIntroHtml(
      {
        summary:
          "Build a usable calendar from the selected planet and moons, then inspect compact and detailed views.",
        controls:
          "Profiles, calendar structure, identity rules, holidays, festivals, cycles, and export settings.",
        affects:
          "Printable calendars, ICS export, and any world-specific moon-phase timing exposed elsewhere in the app.",
        primaryAction:
          "Choose or create a profile, sync from the selected planet and moons, then shape the rules and outputs.",
        compact: true,
        detailsTitle: "Calendar workflow context",
        detailsSummary: "Profiles, structure rules, events, and exports stay calendar-scoped.",
      },
    )}<div id="calProfileSummaryPanel" class="context-summary context-summary--compact calendar-profile-summary" aria-label="Active calendar profile summary"><div class="context-summary__header"><div><div class="context-summary__title">Active Profile Summary</div><div id="calProfileSummaryCopy" class="context-summary__copy"></div></div></div><div id="calProfileSummaryGrid" class="context-summary__grid context-summary__grid--compact"></div><div id="calProfileSummaryNotes" class="context-summary__notes"></div></div></div></div>
    <div class="calendar-workspace">
      <div class="calendar-toolbar">
        <div class="calendar-toolbar__left">
          <select id="calProfileSelect" class="calendar-toolbar__profile" data-tip="${esc(TIPS["Calendar profile"] || "")}"></select>
          <button id="calProfileNew" type="button" class="small" data-tip="${esc(TIPS["New profile"] || "")}">New</button>
          <button id="calProfileDuplicate" type="button" class="small" data-tip="${esc(TIPS["Duplicate profile"] || "")}">Dup</button>
          <button id="calProfileDelete" class="small danger" type="button" data-tip="${esc(TIPS["Delete profile"] || "")}">Del</button>
        </div>
        <div class="calendar-toolbar__nav">
          <button id="calPrevMonth" type="button" class="calendar-toolbar__btn" data-tip="${esc(TIPS["Previous month"] || "")}">\u2190</button>
          <select id="calMonth" class="calendar-toolbar__select" data-tip="${esc(TIPS.Month || "")}"></select>
          <input id="calYear" type="number" min="1" step="1" class="calendar-toolbar__year" data-tip="${esc(TIPS.Year || "")}" />
          <button id="calNextMonth" type="button" class="calendar-toolbar__btn" data-tip="${esc(TIPS["Next month"] || "")}">\u2192</button>
        </div>
        <div class="calendar-toolbar__right">
          <button id="calDrawerToggle" type="button" class="calendar-toolbar__btn" data-tip="${esc(TIPS["Toggle settings"] || "")}" aria-label="Toggle settings">\u276E</button>
          <button id="calOpenDetail" type="button" class="calendar-toolbar__btn" data-tip="${esc(TIPS["Open detailed view"] || "")}">Detailed Calendar</button>
        </div>
      </div>
      <div class="calendar-drawer" id="calDrawer">
        <div class="calendar-drawer__tabs">
          <button type="button" class="calendar-drawer__tab is-active" data-drawer-tab="structure">Structure</button>
          <button type="button" class="calendar-drawer__tab" data-drawer-tab="identity">Identity</button>
          <button type="button" class="calendar-drawer__tab" data-drawer-tab="rules">Rules</button>
          <button type="button" class="calendar-drawer__tab" data-drawer-tab="output">Output</button>
        </div>
        <div class="calendar-drawer__body">
        <section data-drawer-section="structure" class="calendar-drawer__section">
        <div class="panel"><div class="panel__header"><h2>Inputs</h2></div><div class="panel__body">
          <div class="form-row"><div><div class="label">Source planet ${tipIcon(TIPS["Source planet"] || "")}</div></div><select id="calSourcePlanet"></select></div>
          <div class="form-row"><div><div class="label">Primary moon ${tipIcon(TIPS["Primary moon"] || "")}</div></div><select id="calPrimaryMoon"></select></div>
          <div class="form-row"><div><div class="label">Extra moon 1 ${tipIcon(TIPS["Extra moon"] || "")}</div></div><select id="calExtraMoon1"></select></div>
          <div class="form-row"><div><div class="label">Extra moon 2 ${tipIcon(TIPS["Extra moon"] || "")}</div></div><select id="calExtraMoon2"></select></div>
          <div class="form-row"><div><div class="label">Extra moon 3 ${tipIcon(TIPS["Extra moon"] || "")}</div></div><select id="calExtraMoon3"></select></div>
          <div class="form-row"><div><div class="label">Basis ${tipIcon(TIPS.Basis || "")}</div></div><select id="calBasis"><option value="solar">Solar</option><option value="lunar">Lunar</option><option value="lunisolar">Lunisolar</option></select></div>
          <details class="calendar-derived-details" open>
            <summary>Orbital data</summary>
            <div class="derived-readout" id="calDerivedData"></div>
            <div class="form-row"><div><div class="label">Round derived data ${tipIcon(TIPS["Decimal places"] || "")}</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calDerivedRoundEnabled" type="checkbox" />Enable</label></div></div>
            ${sliderField("calDerivedDecimalPlaces", "Decimal places", "", "", 0, 6, 1, TIPS["Decimal places"] || "")}
          </details>
          ${sliderField("calMonthsPerYear", "Months per year", "", "Linked to lunar cycles by default.", 1, 60, 1, TIPS["Months per year"])}
          ${sliderField("calDaysPerMonth", "Days per month", "", "Linked to orbital data by default.", 1, 120, 1, TIPS["Days per month"])}
          ${sliderField("calDaysPerWeek", "Days per week", "", "Linked to days per month by default.", 1, 30, 1, TIPS["Days per week"])}
          <div class="derived-readout" id="calStructureInfo"></div>
          <div class="button-row"><button id="calUseSelected" type="button" data-tip="${esc(TIPS["Use selected objects"] || "")}">Use selected objects</button></div>
        </div></div>
        </section>
        <section data-drawer-section="identity" class="calendar-drawer__section" hidden>
        <div class="panel"><div class="panel__header"><h2>Calendar Designer</h2><div class="calendar-section-info">${tipIcon(TIPS["Calendar Designer section"] || "")}</div></div><div class="panel__body">
          <div class="form-row"><div><div class="label">Calendar name ${tipIcon(TIPS["Calendar name"] || "")}</div></div><input id="calCalendarName" type="text" /></div>
          <div class="form-row"><div><div class="label">Start day of year ${tipIcon(TIPS["Start day of year"] || "")}</div></div><select id="calStartDay"></select></div>
          <div class="form-row"><div><div class="label">Week starts on ${tipIcon(TIPS["Week starts on"] || "")}</div></div><select id="calWeekStart"></select></div>
          <div class="form-row"><div><div class="label">Moon epoch offset <span class="unit">days</span> ${tipIcon(TIPS["Moon epoch offset"] || "")}</div></div><input id="calMoonEpoch" type="number" step="0.1" /></div>
          <div class="form-row"><div><div class="label">Year display mode ${tipIcon(TIPS["Year display mode"] || "")}</div></div><select id="calYearDisplayMode"><option value="numeric">Custom year number</option><option value="era">Era + year</option><option value="pre-calendar">Pre/Post calendar eras</option></select></div>
          <div class="form-row"><div><div class="label">Year offset ${tipIcon(TIPS["Year offset"] || "")}</div></div><input id="calYearOffset" type="number" step="1" /></div>
          <div class="form-row"><div><div class="label">Year prefix ${tipIcon(TIPS["Year prefix"] || "")}</div></div><input id="calYearPrefix" type="text" /></div>
          <div class="form-row"><div><div class="label">Year suffix ${tipIcon(TIPS["Year suffix"] || "")}</div></div><input id="calYearSuffix" type="text" /></div>
          <div class="form-row calendar-pre-era-row"><div><div class="label">Post-calendar start year ${tipIcon(TIPS["Post-calendar start year"] || "")}</div></div><input id="calPreCalendarStartYear" type="number" min="1" step="1" /></div>
          <div class="form-row calendar-pre-era-row"><div><div class="label">Post-era label ${tipIcon(TIPS["Post-era label"] || "")}</div></div><input id="calPostEraLabel" type="text" /></div>
          <div class="form-row calendar-pre-era-row"><div><div class="label">Pre-era label ${tipIcon(TIPS["Pre-era label"] || "")}</div></div><input id="calPreEraLabel" type="text" /></div>
          <div class="form-row calendar-pre-era-row"><div><div class="label">Use year zero ${tipIcon(TIPS["Use year zero"] || "")}</div></div><label class="calendar-holiday-attr"><input id="calPreCalendarUseYearZero" type="checkbox" />Astronomical numbering</label></div>
          <div class="form-row calendar-name-row"><div><div class="label">Day names ${tipIcon(TIPS["Day names"] || "")}</div><div class="hint">One per line.</div></div><textarea id="calDayNames" class="calendar-textarea"></textarea></div>
          <div class="form-row calendar-name-row"><div><div class="label">Week names ${tipIcon(TIPS["Week names"] || "")}</div><div class="hint">One per line.</div></div><textarea id="calWeekNames" class="calendar-textarea"></textarea></div>
          <div class="form-row calendar-name-row"><div><div class="label">Month names ${tipIcon(TIPS["Month names"] || "")}</div><div class="hint">One per line.</div></div><textarea id="calMonthNames" class="calendar-textarea"></textarea></div>
          <div class="form-row"><div><div class="label">Month lengths ${tipIcon(TIPS["Month lengths"] || "")}</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calMonthLengthOverridesEnabled" type="checkbox" />Enable</label></div></div>
          <div class="form-row calendar-name-row" id="calMonthLengthOverridesRow"><div><div class="hint">One number per line. Blank = base month length only.</div><div class="hint">Use Intercalary Periods in Rules for extra structural days before months, after months, at year end, or appended into a month.</div></div><textarea id="calMonthLengthOverrides" class="calendar-textarea" placeholder="e.g.\n31\n28\n31\n30"></textarea></div>

          <div class="label">Eras ${tipIcon(TIPS["Era list"] || "")}</div>
          <div class="form-row"><div><div class="label">Era label ${tipIcon(TIPS["Era label"] || "")}</div></div><input id="calEraName" type="text" /></div>
          <div class="form-row"><div><div class="label">Era start year ${tipIcon(TIPS["Era start year"] || "")}</div></div><input id="calEraStartYear" type="number" min="1" step="1" /></div>
          <div class="button-row"><button id="calEraAdd" type="button" data-tip="${esc(TIPS["Add era"] || "")}">Add era</button></div>
          <div id="calEraList" class="calendar-item-list" data-tip="${esc(TIPS["Era list"] || "")}"></div>

          <div class="button-row"><button id="calResetNames" type="button" data-tip="${esc(TIPS["Reset names"] || "")}">Reset names</button></div>
        </div></div>
        </section>
        <section data-drawer-section="output" class="calendar-drawer__section" hidden>
        <div class="panel"><div class="panel__header"><h2>Calendar Data</h2><div class="calendar-section-info">${tipIcon(TIPS["Calendar Data section"] || "")}</div></div><div class="panel__body">
          <div class="hint" id="calOutputScopeHint">Calendar JSON here is profile-only. It updates calendar settings without replacing star, planet, moon, or world-generation data.</div>
          <div style="height:10px"></div>
          <div class="io-actions">
            <button id="calExportDownload" type="button" data-tip="${esc(TIPS["Download calendar JSON"] || "")}">Download calendar JSON</button>
            <button id="calExportCopy" type="button" data-tip="${esc(TIPS["Copy calendar JSON"] || "")}">Copy calendar JSON</button>
            <button id="calImportFileBtn" type="button" data-tip="${esc(TIPS["Import calendar JSON file"] || "")}">Import JSON file</button>
            <input id="calImportFile" type="file" accept="application/json,.json" style="display:none" />
          </div>
          <div style="height:10px"></div>
          <textarea id="calJsonText" class="io-textarea" spellcheck="false" placeholder="{ ...calendar json... }" data-tip="${esc(TIPS["Calendar JSON"] || "")}"></textarea>
          <div class="io-actions" style="margin-top:10px;">
            <button class="primary" id="calImportApply" type="button" data-tip="${esc(TIPS["Apply pasted calendar JSON"] || "")}">Apply pasted JSON</button>
            <button id="calJsonLoadCurrent" type="button" data-tip="${esc(TIPS["Calendar JSON"] || "")}">Load current</button>
          </div>
          <div id="calJsonStatus" class="io-status" data-kind="info"></div>
        </div></div>

        <div class="panel"><div class="panel__header"><h2>Output & Utility</h2><div class="calendar-section-info">${tipIcon(TIPS["Output & Utility section"] || "")}</div></div><div class="panel__body">
          <div class="label">Astronomy markers ${tipIcon(TIPS["Astronomy markers"] || "")}</div>
          <div class="calendar-holiday-form">
            <div class="form-row calendar-holiday-attrs"><div><div class="label">Show markers in calendar ${tipIcon(TIPS["Astronomy markers"] || "")}</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calMarkerEnabled" type="checkbox" />Enabled</label></div></div>
            <div class="form-row calendar-holiday-attrs"><div><div class="label">Marker types</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calMarkerSeasons" type="checkbox" />Seasons ${tipIcon(TIPS["Season markers"] || "")}</label><label class="calendar-holiday-attr"><input id="calMarkerSeasonBands" type="checkbox" />Season bands ${tipIcon(TIPS["Season bands"] || "")}</label><label class="calendar-holiday-attr"><input id="calMarkerEclipses" type="checkbox" />Eclipses ${tipIcon(TIPS["Eclipse markers"] || "")}</label></div></div>
          </div>

          <div style="height:10px"></div>
          <div class="label">Printable / Save as PDF</div>
          <div id="calPrintableHint" class="hint">Opens a printable browser view. Use Print or Save as PDF in your browser.</div>
          <div class="io-actions">
            <button id="calPdfMonth" type="button" data-tip="${esc(TIPS["PDF month export"] || "")}">Open month print view</button>
            <button id="calPdfYear" type="button" data-tip="${esc(TIPS["PDF year export"] || "")}">Open year print view</button>
          </div>

          <div style="height:10px"></div>
          <div class="label">ICS export</div>
          <div class="form-row"><div><div class="label">Anchor date ${tipIcon(TIPS["ICS anchor date"] || "")}</div><div class="hint">Maps Year 1 Month 1 Day 1 to this Gregorian date.</div></div><input id="calIcsAnchor" type="date" /></div>
          <div class="form-row calendar-holiday-attrs"><div><div class="label">Include in ICS</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calIcsIncHolidays" type="checkbox" />Holidays ${tipIcon(TIPS["ICS include holidays"] || "")}</label><label class="calendar-holiday-attr"><input id="calIcsIncFestivals" type="checkbox" />Festivals ${tipIcon(TIPS["ICS include festivals"] || "")}</label><label class="calendar-holiday-attr"><input id="calIcsIncMarkers" type="checkbox" />Markers ${tipIcon(TIPS["ICS include markers"] || "")}</label></div></div>
          <div class="io-actions">
            <button id="calIcsMonth" type="button" data-tip="${esc(TIPS["ICS month export"] || "")}">Export month ICS</button>
            <button id="calIcsYear" type="button" data-tip="${esc(TIPS["ICS year export"] || "")}">Export year ICS</button>
          </div>
          <div id="calOutputStatus" class="io-status" data-kind="info"></div>
        </div></div>
        </section>
        <section data-drawer-section="rules" class="calendar-drawer__section" hidden>
        <div class="calendar-drawer__subtabs">
          <button class="calendar-drawer__subtab is-active" data-rules-tab="holidays">Holidays</button>
          <button class="calendar-drawer__subtab" data-rules-tab="festivals">Festivals</button>
          <button class="calendar-drawer__subtab" data-rules-tab="intercalary">Intercalary</button>
          <button class="calendar-drawer__subtab" data-rules-tab="leap">Leap Years</button>
          <button class="calendar-drawer__subtab" data-rules-tab="cycles">Cycles</button>
        </div>
        <div id="calRulesSummary" class="calendar-rules-summary"></div>
        <div id="calRulesGuidance" class="context-summary__note">Month-length overrides set authored month lengths first. Leap rules then adjust months. Intercalary periods then place structural extra days before months, after months, at year end, or appended into a month. Holidays and festivals are then matched on the resolved dates, and work/rest cycles finally add shared weekend handling across the active profile.</div>
        <div data-rules-section="holidays">
        <div class="panel"><div class="panel__header"><h2>Special Days</h2><div class="calendar-section-info">${tipIcon(TIPS["Special Days section"] || "")}</div></div><div class="panel__body">
          <div id="calHolidayList" class="calendar-item-list" data-tip="${esc(TIPS.Holidays || "")}"></div>
          <div class="label">Holidays ${tipIcon(TIPS.Holidays || "")}</div>
          <div class="calendar-holiday-form">
            <div class="form-row"><div><div class="label">Holiday name ${tipIcon(TIPS["Holiday name"] || "")}</div></div><input id="calHolidayName" type="text" /></div>
            <div class="form-row"><div><div class="label">Holiday category ${tipIcon(TIPS["Holiday category"] || "")}</div></div><select id="calHolidayCategory">${holidayCategoryOptionsHtml()}</select></div>
            <div class="form-row"><div><div class="label">Holiday colour ${tipIcon(TIPS["Holiday colour"] || "")}</div></div><select id="calHolidayColorTag">${holidayColorOptionsHtml()}</select></div>
            <div class="form-row"><div><div class="label">Recurrence ${tipIcon(TIPS.Recurrence || "")}</div></div><select id="calHolidayRecurrence"></select></div>
            <div class="form-row"><div><div class="label">Cycle years ${tipIcon(TIPS["Holiday cycle years"] || "")}</div><div class="hint">Used when recurrence is Cyclic.</div></div><input id="calHolidayCycleYears" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Offset year ${tipIcon(TIPS["Holiday offset year"] || "")}</div><div class="hint">Used when recurrence is Cyclic.</div></div><input id="calHolidayOffsetYear" type="number" min="1" step="1" /></div>
            <div class="form-row calendar-holiday-attrs"><div><div class="label">Authoring mode ${tipIcon(TIPS["Holiday advanced toggle"] || "")}</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calHolidayAdvancedToggle" type="checkbox" />Advanced mode</label></div></div>
            <div id="calHolidayAdvancedHint" class="hint">Basic mode handles fixed dates, weekdays, moon phases, and optional relative triggers. Advanced mode adds explicit anchor overrides, linked holidays, astronomy markers, compatible algorithm presets such as Gregorian Easter, and observance/conflict controls. The broader rule system can still model arbitrary holidays.</div>
            <div id="calHolidayIssueStatus" class="io-status" data-kind="info">Basic authoring supports fixed dates, weekdays, moon phases, and optional relative triggers.</div>
            <div class="form-row"><div><div class="label">Holiday year ${tipIcon(TIPS["Holiday year"] || "")}</div><div class="hint">Used for one-off rules.</div></div><input id="calHolidayYear" type="number" min="1" step="1" /></div>
            <div class="form-row calendar-holiday-attrs"><div><div class="label">Attributes ${tipIcon(TIPS.Attributes || "")}</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calHolidayUseDate" type="checkbox" checked />Date</label><label class="calendar-holiday-attr"><input id="calHolidayUseWeekday" type="checkbox" />Weekday</label><label class="calendar-holiday-attr"><input id="calHolidayUseMoon" type="checkbox" />Moon phase</label></div></div>
            <div class="form-row calendar-holiday-attrs"><div><div class="label">Relative trigger ${tipIcon(TIPS["Use relative trigger"] || "")}</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calHolidayUseRelative" type="checkbox" />Use relative trigger</label></div></div>
            <div class="form-row"><div><div class="label">Relative type ${tipIcon(TIPS["Relative trigger type"] || "")}</div></div><select id="calHolidayRelativeType"></select></div>
            <div class="form-row"><div><div class="label">Relative offset <span class="unit">days</span> ${tipIcon(TIPS["Relative offset days"] || "")}</div><div class="hint">Negative = before, positive = after.</div></div><input id="calHolidayRelativeOffset" type="number" step="1" /></div>
            <div class="form-row"><div><div class="label">Relative moon ${tipIcon(TIPS["Relative moon slot"] || "")}</div></div><select id="calHolidayRelativeMoonSlot"></select></div>
            <div class="form-row"><div><div class="label">Relative moon phase ${tipIcon(TIPS["Relative moon phase"] || "")}</div></div><select id="calHolidayRelativeMoonPhase"></select></div>
            <div class="form-row"><div><div class="label">Relative marker ${tipIcon(TIPS["Relative marker"] || "")}</div></div><select id="calHolidayRelativeMarker"></select></div>
            <div class="form-row"><div><div class="label">Relative holiday ${tipIcon(TIPS["Relative holiday"] || "")}</div></div><select id="calHolidayRelativeHoliday"></select></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Anchor type ${tipIcon(TIPS["Holiday anchor type"] || "")}</div></div><select id="calHolidayAnchorType"></select></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Built-in algorithm ${tipIcon(TIPS["Holiday algorithm"] || "")}</div></div><select id="calHolidayAlgorithm"></select></div>
            <div id="calHolidayAlgorithmSupportHint" class="hint calendar-holiday-advanced" hidden>Built-in Gregorian algorithm presets are only available in Sol/Earth Gregorian-compatible profiles. Use the wider anchor, relative, marker, and observance rules to author arbitrary holidays elsewhere.</div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Anchor moon ${tipIcon(TIPS["Relative moon slot"] || "")}</div></div><select id="calHolidayAnchorMoonSlot"></select></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Anchor moon phase ${tipIcon(TIPS["Relative moon phase"] || "")}</div></div><select id="calHolidayAnchorMoonPhase"></select></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Anchor marker ${tipIcon(TIPS["Relative marker"] || "")}</div></div><select id="calHolidayAnchorMarker"></select></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Anchor holiday ${tipIcon(TIPS["Relative holiday"] || "")}</div></div><select id="calHolidayAnchorHoliday"></select></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Anchor offset <span class="unit">days</span> ${tipIcon(TIPS["Holiday anchor offset"] || "")}</div></div><input id="calHolidayAnchorOffset" type="number" step="1" /></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Conflict handling ${tipIcon(TIPS["Holiday conflict rule"] || "")}</div></div><select id="calHolidayConflictRule"></select></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Max shift <span class="unit">days</span> ${tipIcon(TIPS["Holiday max shift"] || "")}</div></div><input id="calHolidayMaxShiftDays" type="number" min="0" step="1" /></div>
            <div class="form-row calendar-holiday-advanced calendar-holiday-attrs"><div><div class="label">Shift constraints ${tipIcon(TIPS["Holiday stay in month"] || "")}</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calHolidayStayInMonth" type="checkbox" />Keep shifts in same month</label></div></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Conflict scope ${tipIcon(TIPS["Holiday conflict scope"] || "")}</div></div><select id="calHolidayConflictScope"></select></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Conflict categories ${tipIcon(TIPS["Holiday conflict categories"] || "")}</div><div class="hint">Used when scope is Same category.</div></div><input id="calHolidayConflictCategories" type="text" placeholder="civic, religious" /></div>
            <div class="form-row calendar-holiday-advanced"><div><div class="label">Conflict holiday IDs ${tipIcon(TIPS["Holiday conflict ids"] || "")}</div><div class="hint">Used when scope is Specific holidays.</div></div><input id="calHolidayConflictHolidayIds" type="text" placeholder="holiday-1, holiday-2" /></div>
            <div class="form-row"><div><div class="label">Start month ${tipIcon(TIPS["Start month"] || "")}</div></div><select id="calHolidayStartMonth"></select></div>
            <div class="form-row"><div><div class="label">Day of month ${tipIcon(TIPS["Day of month"] || "")}</div><div class="hint">Date match.</div></div><input id="calHolidayDayOfMonth" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Duration <span class="unit">days</span> ${tipIcon(TIPS["Holiday duration"] || "")}</div><div class="hint">Consecutive days from start day.</div></div><input id="calHolidayDuration" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Priority ${tipIcon(TIPS["Holiday priority"] || "")}</div><div class="hint">Higher priority wins when override mode applies.</div></div><input id="calHolidayPriority" type="number" step="1" /></div>
            <div class="form-row"><div><div class="label">Merge mode ${tipIcon(TIPS["Holiday merge mode"] || "")}</div></div><select id="calHolidayMergeMode"></select></div>
            <div class="form-row"><div><div class="label">Weekday rule ${tipIcon(TIPS["Weekday rule"] || "")}</div><div class="hint">Weekday match.</div></div><select id="calHolidayWeekday"></select></div>
            <div class="form-row"><div><div class="label">Occurrence ${tipIcon(TIPS.Occurrence || "")}</div></div><select id="calHolidayOccurrence"></select></div>
            <div class="form-row"><div><div class="label">Moon slot ${tipIcon(TIPS["Moon slot"] || "")}</div></div><select id="calHolidayMoonSlot"></select></div>
            <div class="form-row"><div><div class="label">Moon phase ${tipIcon(TIPS["Moon phase"] || "")}</div></div><select id="calHolidayMoonPhase"></select></div>
            <div class="form-row"><div><div class="label">Skip years ${tipIcon(TIPS["Holiday exception years"] || "")}</div><div class="hint">Comma-separated.</div></div><input id="calHolidayExceptYears" type="text" placeholder="2, 5, 19" /></div>
            <div class="form-row"><div><div class="label">Skip months ${tipIcon(TIPS["Holiday exception months"] || "")}</div><div class="hint">1-based month numbers.</div></div><input id="calHolidayExceptMonths" type="text" placeholder="1, 7" /></div>
            <div class="form-row"><div><div class="label">Skip days ${tipIcon(TIPS["Holiday exception days"] || "")}</div><div class="hint">Day numbers in month.</div></div><input id="calHolidayExceptDays" type="text" placeholder="13" /></div>
            <div class="button-row"><button class="primary" id="calHolidaySave" type="button" data-tip="${esc(TIPS["Add holiday"] || "")}">Add holiday</button><button id="calHolidayCancel" type="button" style="display:none" data-tip="${esc(TIPS["Cancel holiday edit"] || "")}">Cancel edit</button></div>
          </div>
        </div></div>
        </div>

        <div data-rules-section="festivals" hidden>
        <div class="panel"><div class="panel__header"><h2>Festival Days</h2><div class="calendar-section-info">${tipIcon(TIPS["Festival Days section"] || "")}</div></div><div class="panel__body">
          <div id="calFestivalList" class="calendar-item-list" data-tip="${esc(TIPS["Festival list"] || "")}"></div>
          <div class="label">Festival days ${tipIcon(TIPS["Festival days"] || "")}</div>
          <div class="calendar-holiday-form">
            <div class="form-row"><div><div class="label">Festival name ${tipIcon(TIPS["Festival name"] || "")}</div></div><input id="calFestivalName" type="text" /></div>
            <div class="form-row"><div><div class="label">Festival category ${tipIcon(TIPS["Festival category"] || "")}</div></div><select id="calFestivalCategory">${holidayCategoryOptionsHtml()}</select></div>
            <div class="form-row"><div><div class="label">Festival colour ${tipIcon(TIPS["Festival colour"] || "")}</div></div><select id="calFestivalColorTag">${holidayColorOptionsHtml()}</select></div>
            <div class="form-row"><div><div class="label">Recurrence ${tipIcon(TIPS["Festival recurrence"] || "")}</div></div><select id="calFestivalRecurrence"></select></div>
            <div class="form-row"><div><div class="label">Cycle years ${tipIcon(TIPS["Festival cycle years"] || "")}</div><div class="hint">Used when recurrence is Cyclic.</div></div><input id="calFestivalCycleYears" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Offset year ${tipIcon(TIPS["Festival offset year"] || "")}</div><div class="hint">Used when recurrence is Cyclic.</div></div><input id="calFestivalOffsetYear" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Festival year ${tipIcon(TIPS["Festival year"] || "")}</div><div class="hint">Used for one-off rules.</div></div><input id="calFestivalYear" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Start month ${tipIcon(TIPS["Festival start month"] || "")}</div></div><select id="calFestivalStartMonth"></select></div>
            <div class="form-row"><div><div class="label">After day ${tipIcon(TIPS["Festival after day"] || "")}</div><div class="hint">0 inserts before day 1.</div></div><input id="calFestivalAfterDay" type="number" min="0" step="1" /></div>
            <div class="form-row"><div><div class="label">Duration <span class="unit">days</span> ${tipIcon(TIPS["Festival duration"] || "")}</div></div><input id="calFestivalDuration" type="number" min="1" step="1" /></div>
            <div class="form-row calendar-holiday-attrs"><div><div class="label">Behaviour ${tipIcon(TIPS["Festival outside week"] || "")}</div></div><div class="calendar-holiday-attrs__list"><label class="calendar-holiday-attr"><input id="calFestivalOutsideWeek" type="checkbox" />Outside weekday flow</label></div></div>
            <div class="form-row"><div><div class="label">Skip years ${tipIcon(TIPS["Festival exception years"] || "")}</div><div class="hint">Comma-separated.</div></div><input id="calFestivalExceptYears" type="text" placeholder="2, 5, 19" /></div>
            <div class="form-row"><div><div class="label">Skip months ${tipIcon(TIPS["Festival exception months"] || "")}</div><div class="hint">1-based month numbers.</div></div><input id="calFestivalExceptMonths" type="text" placeholder="1, 7" /></div>
            <div class="form-row"><div><div class="label">Skip days ${tipIcon(TIPS["Festival exception days"] || "")}</div><div class="hint">Day numbers in month.</div></div><input id="calFestivalExceptDays" type="text" placeholder="13" /></div>
            <div class="button-row"><button class="primary" id="calFestivalSave" type="button" data-tip="${esc(TIPS["Add festival"] || "")}">Add festival</button><button id="calFestivalCancel" type="button" style="display:none" data-tip="${esc(TIPS["Cancel festival edit"] || "")}">Cancel edit</button></div>
          </div>
        </div></div>
        </div>

        <div data-rules-section="intercalary" hidden>
        <div class="panel"><div class="panel__header"><h2>Intercalary Periods</h2><div class="calendar-section-info">${tipIcon(TIPS["Intercalary Periods section"] || "")}</div></div><div class="panel__body">
          <div class="hint">Use intercalary periods for structural extra days before months, after months, at year end, or appended into a month. They are separate from month-length overrides and festival events.</div>
          <div style="height:10px"></div>
          <div id="calIntercalaryList" class="calendar-item-list" data-tip="${esc(TIPS["Intercalary list"] || "")}"></div>
          <div class="label">Intercalary periods ${tipIcon(TIPS["Intercalary periods"] || "")}</div>
          <div class="calendar-holiday-form">
            <div class="form-row"><div><div class="label">Period name ${tipIcon(TIPS["Intercalary name"] || "")}</div></div><input id="calIntercalaryName" type="text" /></div>
            <div class="form-row"><div><div class="label">Placement ${tipIcon(TIPS["Intercalary placement"] || "")}</div></div><select id="calIntercalaryPlacement"></select></div>
            <div class="form-row"><div><div class="label">Anchor month ${tipIcon(TIPS["Intercalary anchor month"] || "")}</div><div class="hint">Ignored for year-end placement.</div></div><select id="calIntercalaryAnchorMonth"></select></div>
            <div class="form-row"><div><div class="label">Recurrence ${tipIcon(TIPS["Intercalary recurrence"] || "")}</div></div><select id="calIntercalaryRecurrence"></select></div>
            <div class="form-row"><div><div class="label">Start / one-off year ${tipIcon(TIPS["Intercalary year"] || "")}</div><div class="hint">Used for yearly start years and one-off rules.</div></div><input id="calIntercalaryYear" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Cycle years ${tipIcon(TIPS["Intercalary cycle years"] || "")}</div><div class="hint">Used when recurrence is Cyclic.</div></div><input id="calIntercalaryCycleYears" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Offset year ${tipIcon(TIPS["Intercalary offset year"] || "")}</div><div class="hint">Used when recurrence is Cyclic.</div></div><input id="calIntercalaryOffsetYear" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Duration mode ${tipIcon(TIPS["Intercalary duration mode"] || "")}</div></div><select id="calIntercalaryDurationMode"></select></div>
            <div class="form-row"><div><div class="label">Duration <span class="unit">days</span> ${tipIcon(TIPS["Intercalary duration"] || "")}</div><div class="hint">Ignored when using derived remainder.</div></div><input id="calIntercalaryDuration" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Weekday flow ${tipIcon(TIPS["Intercalary weekday flow"] || "")}</div></div><select id="calIntercalaryWeekdayFlow"></select></div>
            <div class="form-row"><div><div class="label">Exception years ${tipIcon(TIPS["Intercalary exception years"] || "")}</div><div class="hint">Comma-separated years to skip.</div></div><input id="calIntercalaryExceptYears" type="text" placeholder="2, 5, 19" /></div>
            <div class="button-row"><button class="primary" id="calIntercalarySave" type="button" data-tip="${esc(TIPS["Add intercalary"] || "")}">Add intercalary period</button><button id="calIntercalaryCancel" type="button" style="display:none" data-tip="${esc(TIPS["Cancel intercalary edit"] || "")}">Cancel edit</button></div>
          </div>
        </div></div>
        </div>

        <div data-rules-section="leap" hidden>
        <div class="panel"><div class="panel__header"><h2>Leap Years</h2><div class="calendar-section-info">${tipIcon(TIPS["Leap Years section"] || "")}</div></div><div class="panel__body">
          <div class="button-row"><button id="calLeapSuggest" class="primary" type="button" data-tip="${esc(TIPS["Suggest leap rule"] || "")}">Suggest leap rule</button></div>
          <div id="calLeapStatus" class="io-status" data-kind="info"></div>
          <div id="calLeapList" class="calendar-item-list" data-tip="${esc(TIPS["Leap list"] || "")}"></div>
          <div class="label">Leap rules ${tipIcon(TIPS["Leap rules"] || "")}</div>
          <div class="calendar-holiday-form">
            <div class="form-row"><div><div class="label">Rule name ${tipIcon(TIPS["Leap rule name"] || "")}</div></div><input id="calLeapName" type="text" placeholder="Rule name" /></div>
            <div class="form-row"><div><div class="label">Cycle <span class="unit">years</span> ${tipIcon(TIPS["Leap cycle"] || "")}</div></div><input id="calLeapCycle" type="number" min="1" step="1" placeholder="4" /></div>
            <div class="form-row"><div><div class="label">Start year ${tipIcon(TIPS["Leap start year"] || "")}</div></div><input id="calLeapOffset" type="number" min="1" step="1" placeholder="1" /></div>
            <div class="form-row"><div><div class="label">Target month ${tipIcon(TIPS["Leap month"] || "")}</div></div><select id="calLeapMonth"></select></div>
            <div class="form-row"><div><div class="label">Day delta <span class="unit">days</span> ${tipIcon(TIPS["Leap day delta"] || "")}</div></div><input id="calLeapDelta" type="number" min="-30" max="30" step="1" placeholder="+/- days" /></div>
            <div class="button-row"><button id="calLeapAdd" type="button" data-tip="${esc(TIPS["Add leap rule"] || "")}">Add rule</button></div>
          </div>
        </div></div>
        </div>

        <div data-rules-section="cycles" hidden>
        <div class="panel"><div class="panel__header"><h2>Work/Rest Cycles</h2><div class="calendar-section-info">${tipIcon(TIPS["Work/Rest Cycles section"] || "")}</div></div><div class="panel__body">
          <div id="calCycleList" class="calendar-item-list" data-tip="${esc(TIPS["Cycle list"] || "")}"></div>
          <div class="label">Cycle rules ${tipIcon(TIPS["Cycle list"] || "")}</div>
          <div class="calendar-holiday-form">
            <div class="form-row"><div><div class="label">Rule name ${tipIcon(TIPS["Cycle rule name"] || "")}</div></div><input id="calCycleName" type="text" placeholder="Work cycle" /></div>
            <div class="form-row"><div><div class="label">Mode ${tipIcon(TIPS["Cycle rule mode"] || "")}</div></div><select id="calCycleMode"></select></div>
            <div class="form-row"><div><div class="label">Weekend handling ${tipIcon(TIPS["Weekend handling"] || "")}</div><div class="hint">Applies globally to holiday observance shifts.</div></div><select id="calCycleWeekendRule"></select></div>
            <div class="form-row calendar-holiday-attrs"><div><div class="label">Weekend days ${tipIcon(TIPS["Weekend days"] || "")}</div></div><div class="calendar-holiday-attrs__list" id="calWeekendDays"></div></div>
            <div class="form-row"><div><div class="label">Start absolute day ${tipIcon(TIPS["Cycle start day"] || "")}</div><div class="hint">Day 0 is Year 1, Month 1, Day 1.</div></div><input id="calCycleStartDay" type="number" min="0" step="1" /></div>
            <div class="form-row"><div><div class="label">On days ${tipIcon(TIPS["Cycle on days"] || "")}</div></div><input id="calCycleOnDays" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Off days ${tipIcon(TIPS["Cycle off days"] || "")}</div></div><input id="calCycleOffDays" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Interval days ${tipIcon(TIPS["Cycle interval days"] || "")}</div></div><input id="calCycleIntervalDays" type="number" min="1" step="1" /></div>
            <div class="form-row"><div><div class="label">Active label ${tipIcon(TIPS["Cycle active label"] || "")}</div></div><input id="calCycleActiveLabel" type="text" /></div>
            <div class="form-row"><div><div class="label">Rest label ${tipIcon(TIPS["Cycle rest label"] || "")}</div></div><input id="calCycleRestLabel" type="text" /></div>
            <div class="form-row"><div><div class="label">Marker label ${tipIcon(TIPS["Cycle marker label"] || "")}</div></div><input id="calCycleMarkerLabel" type="text" /></div>
            <div class="form-row"><div><div class="label">Active short ${tipIcon(TIPS["Cycle active short"] || "")}</div></div><input id="calCycleActiveShort" type="text" maxlength="3" /></div>
            <div class="form-row"><div><div class="label">Rest short ${tipIcon(TIPS["Cycle rest short"] || "")}</div></div><input id="calCycleRestShort" type="text" maxlength="3" /></div>
            <div class="form-row"><div><div class="label">Marker short ${tipIcon(TIPS["Cycle marker short"] || "")}</div></div><input id="calCycleMarkerShort" type="text" maxlength="3" /></div>
            <div class="button-row"><button class="primary" id="calCycleSave" type="button" data-tip="${esc(TIPS["Add cycle rule"] || "")}">Add cycle rule</button><button id="calCycleCancel" type="button" style="display:none" data-tip="${esc(TIPS["Cancel cycle edit"] || "")}">Cancel edit</button></div>
          </div>
        </div></div>
        </div>
        </section>
        </div>
      </div>
      <div class="calendar-drawer-backdrop is-hidden" id="calDrawerBackdrop"></div>

      <div class="panel calendar-month-panel"><div class="panel__header"><h2>Month View</h2></div><div class="panel__body"><div class="calendar-month-title" id="calMonthTitle" data-tip="${esc(TIPS["Month summary"] || "")}"></div><div class="calendar-chip-row" id="calChipRow" data-tip="${esc(TIPS["Moon summary chips"] || "")}"></div><div class="calendar-season-band" id="calSeasonBand" data-tip="${esc(TIPS["Season bands"] || "")}" hidden></div><div class="calendar-holiday-filter-bar" id="calHolidayFilters" data-tip="${esc(TIPS["Holiday filters"] || "")}">${holidayFilterControlsHtml()}</div><div class="calendar-intercalary-stack" id="calIntercalaryBefore" hidden></div><div class="calendar-mini-grid-wrap" data-tip="${esc(TIPS["Simple calendar"] || "")}"><table class="calendar-mini-grid"><thead><tr id="calMiniHead"></tr></thead><tbody id="calMiniBody"></tbody></table></div><div class="calendar-intercalary-stack" id="calIntercalaryAfter" hidden></div><div class="calendar-selected-day" id="calSelectedDay" data-tip="${esc(TIPS["Selected day"] || "")}"></div><div class="calendar-date-tools" data-tip="${esc(TIPS["Date converter"] || "")}"><div class="calendar-date-tools__title">Date Converter ${tipIcon(TIPS["Date converter"] || "")}</div><div class="calendar-date-tools__row"><label>Absolute day ${tipIcon(TIPS["Absolute day"] || "")}</label><input id="calJumpAbs" type="number" min="0" step="1" /><button id="calJumpAbsBtn" type="button" data-tip="${esc(TIPS["Jump absolute day"] || "")}">Jump</button></div><div class="calendar-date-tools__row"><label>Year</label><input id="calJumpYear" type="number" min="1" step="1" /><label>Month</label><select id="calJumpMonth"></select><label>Day</label><input id="calJumpDay" type="number" min="1" step="1" /><button id="calJumpDateBtn" type="button" data-tip="${esc(TIPS["Jump date"] || "")}">Jump</button></div><div class="calendar-date-tools__resolved" id="calJumpResolved" hidden></div></div><div class="calendar-compact-summary"><div class="calendar-moon-legend" id="calMoonLegend" data-tip="${esc(TIPS["Moon key"] || "")}"></div><div class="calendar-compact-grid" id="calCompactGrid" data-tip="${esc(TIPS["Compact stats"] || "")}"></div><div class="calendar-compact-events" id="calCompactEvents" data-tip="${esc(TIPS["Month events"] || "")}"></div></div><div class="calendar-audit-panel" id="calAuditPanel" data-tip="${esc(TIPS["Rule audit"] || "")}"><div class="calendar-audit-toolbar"><div class="calendar-audit-toolbar__title">Rule Audit ${tipIcon(TIPS["Rule audit"] || "")}</div><div class="calendar-audit-controls"><label>Scope ${tipIcon(TIPS["Audit scope"] || "")}<select id="calAuditScope"></select></label><label>Filter ${tipIcon(TIPS["Audit filter"] || "")}<select id="calAuditKind"></select></label></div></div><div class="calendar-audit-preview" id="calAuditPreview"></div><div class="calendar-audit-agenda" id="calAuditAgenda"></div></div></div></div>
    </div>

    <div class="calendar-detail-overlay is-hidden" id="calDetailOverlay"><div class="panel calendar-detail-dialog"><div class="panel__header"><h2>Detailed Calendar</h2><div class="button-row" style="margin:0"><button id="calDetailPrev" type="button" data-tip="${esc(TIPS["Previous month"] || "")}">Previous</button><button id="calDetailNext" type="button" data-tip="${esc(TIPS["Next month"] || "")}">Next</button><button id="calCloseDetail" type="button" data-tip="${esc(TIPS["Close detailed view"] || "")}">Close</button></div></div><div class="panel__body"><div class="calendar-month-title" id="calDetailMonthTitle" data-tip="${esc(TIPS["Month summary"] || "")}"></div><div class="calendar-chip-row" id="calDetailChipRow" data-tip="${esc(TIPS["Moon summary chips"] || "")}"></div><div class="calendar-season-band" id="calDetailSeasonBand" data-tip="${esc(TIPS["Season bands"] || "")}" hidden></div><div class="calendar-moon-legend" id="calDetailMoonLegend" data-tip="${esc(TIPS["Moon key"] || "")}"></div><div class="calendar-intercalary-stack" id="calDetailIntercalaryBefore" hidden></div><div class="calendar-selected-day" id="calDetailSelectedDay" data-tip="${esc(TIPS["Selected day"] || "")}"></div><div class="calendar-grid-wrap calendar-grid-wrap--detail" data-tip="${esc(TIPS["Detailed calendar"] || "")}"><table class="calendar-grid-table"><thead><tr id="calDetailHead"></tr></thead><tbody id="calDetailBody"></tbody></table></div><div class="calendar-intercalary-stack" id="calDetailIntercalaryAfter" hidden></div></div></div></div>

  `;
  mountEl.appendChild(wrap);
  attachTooltips(wrap);

  const els = collectCalendarPageElements(wrap);

  replaceSelectOptions(els.holidayRecurrence, tupleOptions(RECURRENCES));
  replaceSelectOptions(els.festivalRecurrence, tupleOptions(RECURRENCES));
  replaceSelectOptions(els.intercalaryPlacement, tupleOptions(INTERCALARY_PLACEMENT_OPTIONS));
  replaceSelectOptions(els.intercalaryRecurrence, tupleOptions(INTERCALARY_RECURRENCE_OPTIONS));
  replaceSelectOptions(
    els.intercalaryDurationMode,
    tupleOptions(INTERCALARY_DURATION_MODE_OPTIONS),
  );
  replaceSelectOptions(els.intercalaryWeekdayFlow, tupleOptions(INTERCALARY_WEEKDAY_FLOW_OPTIONS));
  replaceSelectOptions(els.holidayOccurrence, tupleOptions(OCCURRENCES));
  replaceSelectOptions(els.holidayMoonPhase, tupleOptions(PHASES));
  replaceSelectOptions(els.holidayRelativeType, tupleOptions(HOLIDAY_RELATIVE_TYPES));
  replaceSelectOptions(els.holidayRelativeMoonPhase, tupleOptions(PHASES));
  replaceSelectOptions(els.holidayAnchorType, tupleOptions(HOLIDAY_ANCHOR_TYPES));
  replaceSelectOptions(els.holidayAlgorithm, tupleOptions(HOLIDAY_ALGORITHMS));
  replaceSelectOptions(els.holidayAnchorMoonPhase, tupleOptions(PHASES));
  replaceSelectOptions(els.holidayRelativeMarker, tupleOptions(HOLIDAY_RELATIVE_MARKERS));
  replaceSelectOptions(els.holidayAnchorMarker, tupleOptions(HOLIDAY_RELATIVE_MARKERS));
  replaceSelectOptions(els.holidayMergeMode, tupleOptions(HOLIDAY_RESOLVE_MODES));
  replaceSelectOptions(els.cycleWeekendRule, tupleOptions(HOLIDAY_WEEKEND_RULES));
  replaceSelectOptions(els.holidayConflictRule, tupleOptions(HOLIDAY_CONFLICT_RULES));
  replaceSelectOptions(els.holidayConflictScope, tupleOptions(HOLIDAY_CONFLICT_SCOPES));
  replaceSelectOptions(els.cycleMode, tupleOptions(WORK_CYCLE_MODES));
  replaceSelectOptions(els.auditScope, tupleOptions(CALENDAR_AUDIT_SCOPE_OPTIONS));
  replaceSelectOptions(els.auditKind, tupleOptions(CALENDAR_AUDIT_KIND_OPTIONS));

  const binders = [
    bindPair(wrap, "calDerivedDecimalPlaces", 0, 6, 1),
    bindPair(wrap, "calMonthsPerYear", 1, 60, 1),
    bindPair(wrap, "calDaysPerMonth", 1, 120, 1),
    bindPair(wrap, "calDaysPerWeek", 1, 30, 1),
  ];
  const collapsiblePanels = {};

  for (const def of CALENDAR_COLLAPSIBLE_PANELS) {
    const titleEl = [
      ...wrap.querySelectorAll(".calendar-drawer__section .panel > .panel__header > h2"),
    ].find((h2) => h2.textContent.trim() === def.title);
    const header = titleEl?.parentElement || null;
    const panel = header?.closest(".panel") || null;
    const body = panel?.querySelector(":scope > .panel__body") || null;
    if (!header || !panel || !body) continue;

    const bodyId = `calSectionBody-${def.key}`;
    body.id = bodyId;
    header.classList.add("calendar-collapsible-header");

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "calendar-collapse-toggle";
    toggleBtn.dataset.collapseKey = def.key;
    toggleBtn.setAttribute("aria-controls", bodyId);
    toggleBtn.innerHTML =
      '<span class="calendar-collapse-toggle__label">Collapse</span><span class="calendar-collapse-toggle__icon" aria-hidden="true"></span>';
    header.appendChild(toggleBtn);

    collapsiblePanels[def.key] = { panel, body, button: toggleBtn };
  }

  const syncSliders = () => binders.forEach((b) => b?.syncFromNumber?.());
  const { bindDetailOverlayEvents, closeDetail } = createCalendarDetailOverlayActions({
    els,
    render,
    shiftMonth,
  });

  const { activateProfile, ensureProfileStore, saveActiveProfileSnapshot } =
    createCalendarProfileState({
      state,
      runtime,
      loadWorld,
      normalizeSingleProfile,
      clonePlain,
    });
  const readRenderSnapshot = createCalendarRenderSnapshotReader({
    state,
    loadWorld,
    buildContext,
  });

  function applyCollapsedPanels() {
    if (!state.ui.collapsedSections || typeof state.ui.collapsedSections !== "object") {
      state.ui.collapsedSections = {
        designer: true,
        data: true,
        output: true,
        special: true,
        festival: true,
        leap: true,
        cycles: true,
      };
    }
    for (const { key } of CALENDAR_COLLAPSIBLE_PANELS) {
      if (typeof state.ui.collapsedSections[key] !== "boolean") {
        state.ui.collapsedSections[key] = true;
      }
      const refs = collapsiblePanels[key];
      if (!refs) continue;
      const collapsed = !!state.ui.collapsedSections[key];
      refs.panel.classList.toggle("is-collapsed", collapsed);
      refs.body.hidden = collapsed;
      refs.button.dataset.state = collapsed ? "collapsed" : "expanded";
      refs.button.setAttribute("aria-expanded", collapsed ? "false" : "true");
      refs.button.querySelector(".calendar-collapse-toggle__label").textContent = collapsed
        ? "Expand"
        : "Collapse";
    }
  }

  const drawerEl = wrap.querySelector("#calDrawer");
  const workspaceEl = wrap.querySelector(".calendar-workspace");

  function applyDrawerState() {
    const open = !!state.ui.drawerOpen;
    if (workspaceEl) workspaceEl.classList.toggle("drawer-open", open);
    if (drawerEl) drawerEl.classList.toggle("is-hidden", !open);
    els.drawerToggle?.classList.toggle("is-active", open);
    if (els.drawerToggle) els.drawerToggle.textContent = open ? "\u276E" : "\u276F";
    const tabs = wrap.querySelectorAll("[data-drawer-tab]");
    for (const tab of tabs) {
      tab.classList.toggle("is-active", tab.dataset.drawerTab === state.ui.drawerSection);
    }
    const sections = wrap.querySelectorAll("[data-drawer-section]");
    for (const section of sections) {
      section.hidden = section.dataset.drawerSection !== state.ui.drawerSection;
    }
    const subtabs = wrap.querySelectorAll("[data-rules-tab]");
    for (const st of subtabs) {
      st.classList.toggle("is-active", st.dataset.rulesTab === state.ui.rulesTab);
    }
    const ruleSections = wrap.querySelectorAll("[data-rules-section]");
    for (const rs of ruleSections) {
      rs.hidden = rs.dataset.rulesSection !== state.ui.rulesTab;
    }
    const backdrop = wrap.querySelector("#calDrawerBackdrop");
    const narrow = typeof window !== "undefined" && window.innerWidth <= 1200;
    if (backdrop) backdrop.classList.toggle("is-visible", open && narrow);
  }

  function setJsonStatus(msg, kind = "info") {
    if (!els.jsonStatus) return;
    els.jsonStatus.textContent = msg;
    els.jsonStatus.dataset.kind = kind === "bad" ? "error" : kind;
  }

  function setOutputStatus(msg, kind = "info") {
    if (!els.outputStatus) return;
    els.outputStatus.textContent = msg;
    els.outputStatus.dataset.kind = kind === "bad" ? "error" : kind;
  }

  function setLeapStatus(msg, kind = "info") {
    if (!els.leapStatus) return;
    els.leapStatus.textContent = msg;
    els.leapStatus.dataset.kind = kind === "bad" ? "error" : kind;
  }

  function currentCalendarJsonText() {
    return JSON.stringify(createCalendarExportEnvelope(state, clonePlain), null, 2);
  }

  function loadCurrentJsonToTextarea() {
    if (!els.jsonText) return;
    els.jsonText.value = currentCalendarJsonText();
    setJsonStatus(`Ready. ${els.jsonText.value.length.toLocaleString("en-GB")} characters.`, "ok");
  }

  let transferFlows = null;
  let transferFlowsLoading = null;

  function ensureTransferFlows() {
    if (transferFlows) return Promise.resolve(transferFlows);
    if (!transferFlowsLoading) {
      transferFlowsLoading = import("./calendar/transferFlows.js").then(
        ({ createCalendarTransferFlows }) => {
          transferFlows = createCalendarTransferFlows({
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
          });
          return transferFlows;
        },
      );
    }
    return transferFlowsLoading;
  }

  async function importCalendarJsonText(rawText, label = "JSON") {
    const api = await ensureTransferFlows();
    return api.importCalendarJsonText(rawText, label);
  }

  async function openPrintableCalendar(scope) {
    setOutputStatus("Loading printable calendar tools...", "info");
    const api = await ensureTransferFlows();
    return api.openPrintableCalendar(scope);
  }

  async function downloadIcs(scope) {
    setOutputStatus("Loading ICS export tools...", "info");
    const api = await ensureTransferFlows();
    return api.downloadIcs(scope);
  }

  const {
    bindRuleEditorEvents,
    readFestivalPreviewDraft,
    readHolidayPreviewDraft,
    resetCycleForm,
    resetFestivalForm,
    resetHolidayForm,
    resetIntercalaryForm,
    updateCycleEnables,
    updateFestivalEnables,
    updateHolidayEnables,
    updateIntercalaryEnables,
  } = createCalendarRuleEditorFlows({
    wrap,
    state,
    els,
    runtime,
    render,
    readRenderSnapshot,
    buildContext,
    loadWorld,
    recommendLeapRuleFromOrbit,
    setLeapStatus,
    I,
    clampI,
  });
  runtime.resetRuleEditors = () => {
    resetHolidayForm();
    resetFestivalForm();
    resetIntercalaryForm();
    resetCycleForm();
    runtime.auditPanelKey = "";
  };

  function renderAuditPanels(ctx, model) {
    if (!els.auditPreview || !els.auditAgenda || !els.auditScope || !els.auditKind || !ctx) return;
    const safeScope = ["month", "year"].includes(String(state.ui.auditScope || ""))
      ? String(state.ui.auditScope)
      : "month";
    const safeKind = ["all", "holiday", "festival", "intercalary", "marker", "cycle"].includes(
      String(state.ui.auditKind || ""),
    )
      ? String(state.ui.auditKind)
      : "all";
    state.ui.auditScope = safeScope;
    state.ui.auditKind = safeKind;
    els.auditScope.value = safeScope;
    els.auditKind.value = safeKind;
    const auditPanelKey = buildAuditRenderKey({
      state,
      runtime,
      els,
      ctx,
      model,
    });
    if (runtime.auditPanelKey === auditPanelKey) return;
    runtime.auditPanelKey = auditPanelKey;

    const auditResult = buildCalendarAuditEntries({
      ctx,
      state,
      model,
      scope: safeScope,
      kindFilter: safeKind,
    });
    const preview = pickActiveRulePreview(state, {
      readHolidayPreviewDraft,
      readFestivalPreviewDraft,
    });
    const previewResult =
      preview && !preview.issue
        ? buildRulePreviewEntries({ ctx, state, preview })
        : {
            entries: [],
            truncated: false,
            scannedMonths: Math.max(
              24,
              Math.max(1, I(ctx?.metrics?.monthsPerYear, 12)) * CALENDAR_RULE_PREVIEW_SCAN_YEARS,
            ),
          };
    const formatYearLabel = (year) => formatDisplayedYear(state.ui, year);

    replaceChildren(
      els.auditPreview,
      buildRulePreviewContent({ preview, previewResult, formatYearLabel, currentModel: model }),
    );
    replaceChildren(
      els.auditAgenda,
      buildAuditAgendaContent({
        entries: auditResult.entries,
        truncated: auditResult.truncated,
        formatYearLabel,
        currentModel: model,
      }),
    );
  }

  function render() {
    ensureProfileStore();
    const world = loadWorld();
    saveActiveProfileSnapshot(world);
    const { ctx } = readRenderSnapshot(world);
    runtime.lastCtx = ctx;
    state.ui.holidayCategoryFilters = normalizeHolidayCategoryFilters(
      state.ui.holidayCategoryFilters,
    );

    replaceSelectOptions(els.profileSelect, bodyOptions(state.profiles));
    els.profileSelect.value = state.profileId;
    els.profileDelete.disabled = state.profiles.length <= 1;

    replaceSelectOptions(els.sourcePlanet, bodyOptions(ctx.planets));
    els.sourcePlanet.value = ctx.sourcePlanetId;
    const moonOptions = [{ value: "", label: "None" }, ...bodyOptions(ctx.planetMoons)];
    replaceSelectOptions(els.primaryMoon, moonOptions);
    replaceSelectOptions(els.extraMoon1, moonOptions);
    replaceSelectOptions(els.extraMoon2, moonOptions);
    replaceSelectOptions(els.extraMoon3, moonOptions);
    els.primaryMoon.value = state.inputs.primaryMoonId || "";
    els.extraMoon1.value = state.inputs.extraMoonIds[0] || "";
    els.extraMoon2.value = state.inputs.extraMoonIds[1] || "";
    els.extraMoon3.value = state.inputs.extraMoonIds[2] || "";

    const roundOn = !!state.ui.derivedRoundEnabled;
    const ddp = clampI(state.ui.derivedDecimalPlaces ?? 6, 0, 6);
    const orbDp = roundOn ? ddp : 6;
    const rotDp = roundOn ? Math.min(ddp, 3) : 3;
    const derivedTimingText =
      `Planet orbital period: ${N(ctx.planetOrbitalPeriodDays).toFixed(orbDp)} days\n` +
      `Moon orbital period: ${N(ctx.primaryMoonSynodicDays).toFixed(orbDp)} days\n` +
      `Planet rotation: ${N(ctx.planetRotationPeriodHours).toFixed(rotDp)} hours (sidereal)\n` +
      `Solar day: ${N(ctx.solarDayHours).toFixed(rotDp)} hours`;
    els.derivedData.textContent = ctx.unsupportedSourceMessage
      ? `${ctx.unsupportedSourceMessage}\nCalendar timing is using neutral Earth-like defaults until you select a rocky, surface-applicable planet.`
      : `${ctx.limitedSourceMessage ? `${ctx.limitedSourceMessage}\n` : ""}${derivedTimingText}`;

    els.derivedRoundEnabled.checked = roundOn;
    els.derivedDecimalPlaces.value = String(ddp);
    els.derivedDecimalPlaces.disabled = !roundOn;
    const dpSlider = els.derivedDecimalPlaces
      .closest(".form-row")
      ?.querySelector('input[type="range"]');
    if (dpSlider) dpSlider.disabled = !roundOn;
    els.monthsPerYear.value = String(ctx.metrics.monthsPerYear);
    els.daysPerMonth.value = String(ctx.metrics.daysPerMonth);
    els.daysPerWeek.value = String(ctx.metrics.daysPerWeek);
    const dpwCeiling = Math.min(30, ctx.metrics.daysPerMonth);
    const dpwSlider = wrap.querySelector("#calDaysPerWeek_slider");
    const dpwMaxLabel = wrap.querySelector("#calDaysPerWeek_max");
    if (dpwSlider) dpwSlider.max = String(dpwCeiling);
    if (dpwMaxLabel) dpwMaxLabel.textContent = String(dpwCeiling);
    syncSliders();

    // Structure readout — use getMonthLengthsForYear to account for leap rules
    const wpm = Math.floor(ctx.metrics.daysPerMonth / ctx.metrics.daysPerWeek);
    const weekRemainder = ctx.metrics.daysPerMonth - wpm * ctx.metrics.daysPerWeek;
    const resolvedYearLayout = buildYearLayoutForYear({
      metrics: ctx.metrics,
      year: state.ui.year,
      leapRules: state.ui.leapRules || [],
      monthLengthOverrides: ctx.monthLengthOverrides,
      intercalaryPeriods: ctx.intercalaryPeriods,
      firstYearStartDayIndex: state.ui.startDayOfYear,
    });
    const actualMonthLengths = resolvedYearLayout.monthLengths;
    const actualBaseYear = resolvedYearLayout.yearLengthDays;
    const lastMonthLen = actualMonthLengths[actualMonthLengths.length - 1];
    const drift = actualBaseYear - ctx.yearLen;
    let readout =
      `Weeks per month: ${wpm}` + (weekRemainder ? ` (+${weekRemainder} remainder)` : "");
    readout += `\nCalendar year: ${actualBaseYear} days`;
    if (drift) readout += ` (${drift > 0 ? "+" : ""}${drift} vs orbital ${ctx.yearLen})`;
    if (lastMonthLen !== ctx.metrics.daysPerMonth) readout += `\nLast month: ${lastMonthLen} days`;
    const clampedRules = (state.ui.leapRules || []).filter(
      (r) => I(r?.monthIndex, 0) >= ctx.metrics.monthsPerYear,
    ).length;
    if (clampedRules > 0) {
      readout += `\n${clampedRules} leap rule(s) clamped to last month`;
    }
    els.structureInfo.textContent = readout;
    els.structureInfo.classList.toggle(
      "drift-warning",
      ctx.yearLen > 0 && Math.abs(drift / ctx.yearLen) > 0.1,
    );

    if (document.activeElement !== els.calendarName) {
      els.calendarName.value = String(state.ui.calendarName || "Calendar");
    }
    els.basis.value = state.ui.basis;
    els.year.value = String(state.ui.year);
    els.yearDisplayMode.value = ["numeric", "era", "pre-calendar"].includes(
      String(state.ui.yearDisplayMode || ""),
    )
      ? String(state.ui.yearDisplayMode)
      : "numeric";
    if (document.activeElement !== els.yearOffset)
      els.yearOffset.value = String(I(state.ui.yearOffset, 0));
    if (document.activeElement !== els.yearPrefix)
      els.yearPrefix.value = String(state.ui.yearPrefix || "");
    if (document.activeElement !== els.yearSuffix)
      els.yearSuffix.value = String(state.ui.yearSuffix || "");
    if (document.activeElement !== els.preCalendarStartYear) {
      els.preCalendarStartYear.value = String(Math.max(1, I(state.ui.preCalendarStartYear, 1)));
    }
    if (document.activeElement !== els.postEraLabel) {
      els.postEraLabel.value = String(state.ui.postEraLabel || "CE");
    }
    if (document.activeElement !== els.preEraLabel) {
      els.preEraLabel.value = String(state.ui.preEraLabel || "BCE");
    }
    els.preCalendarUseYearZero.checked = !!state.ui.preCalendarUseYearZero;
    const preCalendarMode = String(state.ui.yearDisplayMode || "numeric") === "pre-calendar";
    wrap.querySelectorAll(".calendar-pre-era-row").forEach((row) => {
      row.hidden = !preCalendarMode;
    });
    [
      els.preCalendarStartYear,
      els.postEraLabel,
      els.preEraLabel,
      els.preCalendarUseYearZero,
    ].forEach((el) => {
      if (el) el.disabled = !preCalendarMode;
    });
    els.markerEnabled.checked = !!state.ui.astronomy?.enabled;
    els.markerSeasons.checked = !!state.ui.astronomy?.seasons;
    els.markerSeasonBands.checked = !!state.ui.astronomy?.seasonBands;
    els.markerEclipses.checked = !!state.ui.astronomy?.eclipses;
    els.markerSeasons.disabled = !els.markerEnabled.checked;
    els.markerSeasonBands.disabled = !els.markerEnabled.checked || !els.markerSeasons.checked;
    els.markerEclipses.disabled = !els.markerEnabled.checked;
    if (document.activeElement !== els.icsAnchor) {
      els.icsAnchor.value = normalizeIsoDate(state.ui.exportAnchorDate);
    }
    els.icsIncHolidays.checked = !!state.ui.icsIncludes?.holidays;
    els.icsIncFestivals.checked = !!state.ui.icsIncludes?.festivals;
    els.icsIncMarkers.checked = !!state.ui.icsIncludes?.markers;
    els.icsIncMarkers.disabled = !els.markerEnabled.checked;
    for (const [category] of HOLIDAY_CATEGORIES) {
      const input = els.holidayFilters?.querySelector(`[data-cal-holiday-filter="${category}"]`);
      if (!input) continue;
      input.checked = !!state.ui.holidayCategoryFilters?.[category];
    }
    replaceSelectOptions(els.month, indexedLabelOptions(ctx.monthNames));
    els.month.value = String(state.ui.monthIndex);
    replaceSelectOptions(els.jumpMonth, indexedLabelOptions(ctx.monthNames));
    state.ui.jumpMonthIndex = clampI(state.ui.jumpMonthIndex, 0, ctx.metrics.monthsPerYear - 1);
    replaceSelectOptions(els.startDay, indexedLabelOptions(ctx.dayNames));
    replaceSelectOptions(els.weekStart, indexedLabelOptions(ctx.dayNames));
    els.startDay.value = String(state.ui.startDayOfYear);
    els.weekStart.value = String(state.ui.weekStartsOn);
    els.moonEpoch.value = String(N(state.ui.moonEpochOffsetDays, 0));
    if (document.activeElement !== els.dayNames) els.dayNames.value = namesText(state.ui.dayNames);
    if (document.activeElement !== els.weekNames)
      els.weekNames.value = namesText(state.ui.weekNames);
    if (document.activeElement !== els.monthNames)
      els.monthNames.value = namesText(state.ui.monthNames);
    const mloEnabled = !!state.ui.monthLengthOverridesEnabled;
    els.monthLengthOverridesEnabled.checked = mloEnabled;
    els.monthLengthOverrides.disabled = !mloEnabled;
    els.monthLengthOverridesRow.style.opacity = mloEnabled ? "" : "0.4";
    if (document.activeElement !== els.monthLengthOverrides)
      els.monthLengthOverrides.value = monthLengthOverridesText(state.ui.monthLengthOverrides);
    if (document.activeElement !== els.jsonText && !els.jsonText.value.trim()) {
      els.jsonText.value = currentCalendarJsonText();
    }

    state.ui.eras = normEraRules(state.ui.eras);
    renderListContent(
      els.eraList,
      state.ui.eras.map((era) =>
        calendarItemRow({
          nameChildren: era.name,
          hint: `Starts in Year ${era.startYear}`,
          actions: [actionButton("Delete", { calEraDel: era.id }, "small danger")],
        }),
      ),
      "No eras configured.",
    );

    replaceSelectOptions(els.holidayStartMonth, indexedLabelOptions(ctx.monthNames));
    replaceSelectOptions(els.festivalStartMonth, indexedLabelOptions(ctx.monthNames));
    const intercalaryAnchorValue = String(
      clampI(
        els.intercalaryAnchorMonth.value || state.ui.monthIndex,
        0,
        ctx.metrics.monthsPerYear - 1,
      ),
    );
    replaceSelectOptions(els.intercalaryAnchorMonth, indexedLabelOptions(ctx.monthNames));
    els.intercalaryAnchorMonth.value = intercalaryAnchorValue;
    replaceSelectOptions(els.holidayWeekday, indexedLabelOptions(ctx.dayNames));
    const moonSlotSelectOptions = moonSlotOptions(ctx.moonDefs);
    replaceSelectOptions(els.holidayMoonSlot, moonSlotSelectOptions);
    replaceSelectOptions(els.holidayRelativeMoonSlot, moonSlotSelectOptions);
    replaceSelectOptions(els.holidayAnchorMoonSlot, moonSlotSelectOptions);
    const holidaySelectOptions = holidayReferenceOptions(ctx.holidays || []);
    replaceSelectOptions(els.holidayRelativeHoliday, holidaySelectOptions);
    replaceSelectOptions(els.holidayAnchorHoliday, holidaySelectOptions);
    const holidayAlgorithmSupport =
      ctx.holidayAlgorithmSupport || buildHolidayAlgorithmSupport("none");
    const currentAnchorType = String(els.holidayAnchorType.value || "fixed-date");
    replaceSelectOptions(
      els.holidayAnchorType,
      holidayAnchorTypeOptions(holidayAlgorithmSupport, currentAnchorType),
    );
    els.holidayAnchorType.value = holidayAnchorTypeOptions(
      holidayAlgorithmSupport,
      currentAnchorType,
    ).some((option) => option.value === currentAnchorType)
      ? currentAnchorType
      : "fixed-date";
    const currentAlgorithmKey = String(els.holidayAlgorithm.value || "none");
    replaceSelectOptions(
      els.holidayAlgorithm,
      holidayAlgorithmOptions(holidayAlgorithmSupport, currentAlgorithmKey),
    );
    els.holidayAlgorithm.value = holidayAlgorithmOptions(
      holidayAlgorithmSupport,
      currentAlgorithmKey,
    ).some((option) => option.value === currentAlgorithmKey)
      ? currentAlgorithmKey
      : "none";
    els.holidayAdvancedToggle.checked = !!state.ui.holidayAdvanced;

    const holidays = normHolidayRules(state.ui.holidays, ctx.metrics.monthsPerYear);
    const festivals = normFestivalRules(state.ui.festivalRules, ctx.metrics.monthsPerYear);
    const intercalaryPeriods = Array.isArray(ctx.intercalaryPeriods) ? ctx.intercalaryPeriods : [];
    renderListContent(
      els.holidayList,
      holidays.map((holiday) => {
        const issue = ctx.holidayIssueById?.[holiday.id] || "";
        const hint = issue
          ? `Issue: ${issue} | ${holidaySummary(holiday, ctx)}`
          : holidaySummary(holiday, ctx);
        return calendarItemRow({
          isEditing: runtime.editingHolidayId === holiday.id,
          nameChildren: [
            holiday.name,
            " ",
            createElement("span", {
              className: `calendar-holiday-chip ${holidayColorClass(holiday.colorTag)}`,
              text: holidayCategoryLabel(holiday.category),
            }),
            issue
              ? [
                  " ",
                  createElement("span", {
                    className: "calendar-holiday-chip holiday-tag-rose",
                    text: "Issue",
                  }),
                ]
              : null,
          ],
          hint,
          actions: [
            actionButton("Edit", { calHolidayEdit: holiday.id }),
            actionButton("Delete", { calHolidayDel: holiday.id }, "small danger"),
          ],
        });
      }),
      "No holidays configured.",
    );
    renderListContent(
      els.festivalList,
      festivals.map((festival) =>
        calendarItemRow({
          isEditing: runtime.editingFestivalId === festival.id,
          nameChildren: [
            festival.name,
            " ",
            createElement("span", {
              className: `calendar-holiday-chip ${holidayColorClass(festival.colorTag)}`,
              text: holidayCategoryLabel(festival.category),
            }),
          ],
          hint: festivalSummary(festival, ctx),
          actions: [
            actionButton("Edit", { calFestivalEdit: festival.id }),
            actionButton("Delete", { calFestivalDel: festival.id }, "small danger"),
          ],
        }),
      ),
      "No festival rules configured.",
    );
    renderListContent(
      els.intercalaryList,
      intercalaryPeriods.map((period) =>
        calendarItemRow({
          isEditing: runtime.editingIntercalaryId === period.id,
          nameChildren: period.name,
          hint: intercalaryRuleSummary(period, ctx),
          actions: [
            actionButton("Edit", { calIntercalaryEdit: period.id }),
            actionButton("Delete", { calIntercalaryDel: period.id }, "small danger"),
          ],
        }),
      ),
      "No intercalary periods configured.",
    );

    replaceSelectOptions(els.leapMonth, indexedLabelOptions(ctx.monthNames));
    const leaps = normalizeLeapRules(state.ui.leapRules, ctx.metrics.monthsPerYear);
    renderListContent(
      els.leapList,
      leaps.map((rule) =>
        calendarItemRow({
          nameChildren: rule.name,
          hint: `Every ${rule.cycleYears} years from Year ${rule.offsetYear}`,
          actions: [actionButton("Delete", { calLeapDel: rule.id }, "small danger")],
        }),
      ),
      "No leap rules configured.",
    );

    const workCycles = normWorkCycleRules(state.ui.workCycles);
    state.ui.workWeekendRule = normalizeWeekendRule(state.ui.workWeekendRule);
    state.ui.weekendDayIndexes = normalizeWeekendDayIndexes(
      state.ui.weekendDayIndexes,
      ctx.metrics.daysPerWeek,
    );
    els.cycleWeekendRule.value = state.ui.workWeekendRule;
    replaceWeekendDayOptions(els.weekendDays, ctx.dayNames, state.ui.weekendDayIndexes);
    renderListContent(
      els.cycleList,
      workCycles.map((rule) =>
        calendarItemRow({
          isEditing: runtime.editingCycleId === rule.id,
          nameChildren: rule.name,
          hint: cycleRuleSummary(rule),
          actions: [
            actionButton("Edit", { calCycleEdit: rule.id }),
            actionButton("Delete", { calCycleDel: rule.id }, "small danger"),
          ],
        }),
      ),
      "No cycle rules configured.",
    );

    const sourcePlanet = findById(ctx.planets, ctx.sourcePlanetId);
    const sourcePlanetLabel =
      sourcePlanet?.name || sourcePlanet?.inputs?.name || sourcePlanet?.label || "No source planet";
    const primaryMoonLabel = ctx.moonDefs[0]?.name || "Primary moon";
    const profileNameLabel =
      String(state.profileName || state.ui.calendarName || "Calendar").trim() || "Calendar";
    const ruleCountsText = [
      `Holidays ${holidays.length}`,
      `Festivals ${festivals.length}`,
      `Intercalary ${intercalaryPeriods.length}`,
      `Leap Rules ${leaps.length}`,
      `Cycles ${workCycles.length}`,
    ].join(" | ");
    els.profileSummaryCopy.textContent = `${profileNameLabel} uses ${sourcePlanetLabel} and ${primaryMoonLabel}. Calendar rules affect views and exports only; world physics stays unchanged.`;
    els.profileSummaryGrid.replaceChildren(
      createContextSummaryCard(
        "Active Profile",
        profileNameLabel,
        `${state.profiles.length} saved profile(s) in this world`,
      ),
      createContextSummaryCard(
        "Source Context",
        `${sourcePlanetLabel} -> ${primaryMoonLabel}`,
        `${ctx.moonDefs.length} moon reference${ctx.moonDefs.length === 1 ? "" : "s"} available`,
      ),
      createContextSummaryCard(
        "Rules",
        ruleCountsText,
        "Open the Rules drawer tab for holiday, festival, leap, intercalary, and cycle editing.",
      ),
      createContextSummaryCard(
        "Output Scope",
        "Profile-only",
        "Printable views, ICS, and calendar JSON do not replace the world model.",
      ),
    );
    els.profileSummaryNotes.replaceChildren(
      createElement("div", { className: "context-summary__note" }, [
        createElement("strong", { text: "Import/export scope. " }),
        "Calendar JSON here is profile-only. Use the Import/Export route when you want to replace or transfer an entire world instead.",
      ]),
      createElement("details", { className: "context-summary__details" }, [
        createElement("summary", { text: "Rule order" }),
        createElement("div", { className: "context-summary__note" }, [
          createElement("strong", { text: "Rule order. " }),
          "Leap rules resolve month lengths first, intercalary periods then place structural extra days, holidays and festivals match against those resolved dates, and work/rest cycles add global weekend handling and cycle markers.",
        ]),
      ]),
    );
    els.rulesSummary.textContent = [
      `${holidays.length} holiday${holidays.length === 1 ? "" : "s"}`,
      `${festivals.length} festival${festivals.length === 1 ? "" : "s"}`,
      `${intercalaryPeriods.length} intercalary period${intercalaryPeriods.length === 1 ? "" : "s"}`,
      `${leaps.length} leap rule${leaps.length === 1 ? "" : "s"}`,
      `${workCycles.length} cycle${workCycles.length === 1 ? "" : "s"}`,
    ].join(" • ");

    const model = applyHolidayFiltersToMonthModel(ctx.monthModel, state.ui.holidayCategoryFilters);
    if (model.intercalarySummary.length) {
      readout += `\nStructural intercalary periods: ${model.intercalarySummary.join("; ")}`;
    }
    els.structureInfo.textContent = readout;

    const allDays = getSelectableCalendarDays(model);
    const requestedAbsoluteDay = Math.max(0, I(state.ui.jumpAbsoluteDay, 0));
    const selected =
      allDays.find((day) => day.absoluteDay === requestedAbsoluteDay) ||
      allDays.find((day) => day.dayNumber === state.ui.selectedDay) ||
      allDays[0];
    if (selected) {
      state.ui.jumpAbsoluteDay = selected.absoluteDay;
      state.ui.jumpYear = model.year;
      state.ui.jumpMonthIndex = model.monthIndex;
      state.ui.jumpDayOfMonth =
        selected.kind === "intercalary"
          ? Math.max(1, I(selected.mappedDayOfMonth, 1))
          : Math.max(1, I(selected.dayNumber, 1));
      if (selected.kind === "month") {
        state.ui.selectedDay = Math.max(1, I(selected.dayNumber, 1));
      }
    }
    if (document.activeElement !== els.jumpAbs)
      els.jumpAbs.value = String(state.ui.jumpAbsoluteDay);
    if (document.activeElement !== els.jumpYear) els.jumpYear.value = String(state.ui.jumpYear);
    if (document.activeElement !== els.jumpMonth)
      els.jumpMonth.value = String(state.ui.jumpMonthIndex);
    if (document.activeElement !== els.jumpDay) els.jumpDay.value = String(state.ui.jumpDayOfMonth);
    const holidayDetails = Array.isArray(selected?.holidayDetails) ? selected.holidayDetails : [];
    const holidayDetailById = new Map(
      holidayDetails.map((detail) => [String(detail?.holiday?.id || ""), detail]),
    );

    const yearLabel = formatDisplayedYear(model.year, state.ui);
    const title = `${model.monthName} - ${yearLabel} (${model.monthLength} days)`;
    els.monthTitle.textContent = title;
    els.detailMonthTitle.textContent = title;
    if (selected?.kind === "intercalary") {
      els.jumpResolved.textContent = `Resolved absolute day ${selected.absoluteDay} to ${selected.intercalaryName} day ${
        selected.intercalaryDay
      } (${intercalaryPlacementLabel(selected.placement, selected.anchorMonthName)} | ${intercalaryFlowLabel(selected.advancesWeekdayFlow)}).`;
      els.jumpResolved.hidden = false;
    } else {
      els.jumpResolved.textContent = "";
      els.jumpResolved.hidden = true;
    }

    const calendarNameLabel = String(state.ui.calendarName || "Calendar").trim() || "Calendar";
    const chipNodes = [
      {
        label: "Calendar",
        value: calendarNameLabel,
        tip: TIPS["Calendar name"] || "",
      },
      {
        label: "Full Moon",
        value: model.fullMoonDays.length ? model.fullMoonDays.join(", ") : "None",
        tip: "Primary moon full-phase days this month.",
      },
      {
        label: "New Moon",
        value: model.newMoonDays.length ? model.newMoonDays.join(", ") : "None",
        tip: "Primary moon new-phase days this month.",
      },
      {
        label: "Primary moon",
        value: ctx.moonDefs[0]?.name || "Primary moon",
        tip: "Moon used as the main lunar reference for this calendar.",
      },
      {
        label: "Moons shown",
        value: String(ctx.moonDefs.length),
        tip: "Total moons currently displayed in selected-day and detailed views.",
      },
      {
        label: "Festival days",
        value: String(model.festivalsInMonth.reduce((a, e) => a + e[1], 0)),
        tip: TIPS["Festival days"] || "",
      },
      {
        label: "Intercalary days",
        value: String(model.intercalaryDayCountInView || 0),
        tip: TIPS["Intercalary periods"] || "",
      },
      {
        label: "Cycle markers",
        value: String(model.cyclesInMonth.reduce((a, e) => a + (e.count || 0), 0)),
        tip: TIPS["Cycle list"] || "",
      },
    ].map((chip) =>
      createElement("div", { className: "calendar-chip", dataset: { tip: chip.tip } }, [
        createElement("b", { text: `${chip.label}:` }),
        " ",
        chip.value,
      ]),
    );
    replaceChildren(els.chipRow, chipNodes);
    replaceChildren(
      els.detailChipRow,
      [
        {
          label: "Calendar",
          value: calendarNameLabel,
          tip: TIPS["Calendar name"] || "",
        },
        {
          label: "Full Moon",
          value: model.fullMoonDays.length ? model.fullMoonDays.join(", ") : "None",
          tip: "Primary moon full-phase days this month.",
        },
        {
          label: "New Moon",
          value: model.newMoonDays.length ? model.newMoonDays.join(", ") : "None",
          tip: "Primary moon new-phase days this month.",
        },
        {
          label: "Primary moon",
          value: ctx.moonDefs[0]?.name || "Primary moon",
          tip: "Moon used as the main lunar reference for this calendar.",
        },
        {
          label: "Moons shown",
          value: String(ctx.moonDefs.length),
          tip: "Total moons currently displayed in selected-day and detailed views.",
        },
        {
          label: "Festival days",
          value: String(model.festivalsInMonth.reduce((a, e) => a + e[1], 0)),
          tip: TIPS["Festival days"] || "",
        },
        {
          label: "Intercalary days",
          value: String(model.intercalaryDayCountInView || 0),
          tip: TIPS["Intercalary periods"] || "",
        },
        {
          label: "Cycle markers",
          value: String(model.cyclesInMonth.reduce((a, e) => a + (e.count || 0), 0)),
          tip: TIPS["Cycle list"] || "",
        },
      ].map((chip) =>
        createElement("div", { className: "calendar-chip", dataset: { tip: chip.tip } }, [
          createElement("b", { text: `${chip.label}:` }),
          " ",
          chip.value,
        ]),
      ),
    );
    const seasonBandContent = buildSeasonBandContent(model, ctx.astronomySettings);
    replaceChildren(els.seasonBand, seasonBandContent);
    els.seasonBand.hidden = !seasonBandContent.length;
    replaceChildren(els.detailSeasonBand, buildSeasonBandContent(model, ctx.astronomySettings));
    els.detailSeasonBand.hidden = !seasonBandContent.length;

    renderCalendarMoonLegend({
      node: els.moonLegend,
      moonDefs: ctx.moonDefs,
      moonIconNode,
      tipIconNode,
      fmt,
      replaceChildren,
      createElement,
      tipText: TIPS["Moon key"] || "",
    });
    renderCalendarMoonLegend({
      node: els.detailMoonLegend,
      moonDefs: ctx.moonDefs,
      moonIconNode,
      tipIconNode,
      fmt,
      replaceChildren,
      createElement,
      tipText: TIPS["Moon key"] || "",
    });
    replaceChildren(
      els.intercalaryBefore,
      renderIntercalaryGroups(model.intercalaryBeforeMonth, selected?.absoluteDay),
    );
    els.intercalaryBefore.hidden = !model.intercalaryBeforeMonth.length;
    replaceChildren(
      els.intercalaryAfter,
      renderIntercalaryGroups(model.intercalaryAfterMonth, selected?.absoluteDay),
    );
    els.intercalaryAfter.hidden = !model.intercalaryAfterMonth.length;
    replaceChildren(
      els.detailIntercalaryBefore,
      renderIntercalaryGroups(model.intercalaryBeforeMonth, selected?.absoluteDay),
    );
    els.detailIntercalaryBefore.hidden = !model.intercalaryBeforeMonth.length;
    replaceChildren(
      els.detailIntercalaryAfter,
      renderIntercalaryGroups(model.intercalaryAfterMonth, selected?.absoluteDay),
    );
    els.detailIntercalaryAfter.hidden = !model.intercalaryAfterMonth.length;

    const trace = selected
      ? traceRulesForDay({
          cell: selected,
          model,
          holidays,
          festivals,
          workCycles,
          leapRules: ctx.leapRules,
          metrics: ctx.metrics,
          dayNames: ctx.dayNames,
          monthNames: ctx.monthNames,
          weekendDayIndexes: state.ui.weekendDayIndexes,
        })
      : null;
    renderCalendarSelectedDay({
      node: els.selectedDay,
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
    });
    renderCalendarSelectedDay({
      node: els.detailSelectedDay,
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
    });

    replaceChildren(
      els.compactGrid,
      [
        { label: "Basis", tip: TIPS.Basis || "", value: state.ui.basis },
        {
          label: "Days this month",
          tip: "Number of days in the current month after leap adjustments.",
          value: model.monthLength,
        },
        {
          label: "Weeks shown",
          tip: "Rows needed to display this month in the current week layout.",
          value: model.rows.length,
        },
        {
          label: "Holiday hits in view",
          tip: "Total holiday matches across the month grid and visible structural intercalary days.",
          value: model.holidaysInMonth.reduce((a, e) => a + e[1], 0),
        },
        {
          label: "Festivals this month",
          tip: TIPS["Festival days"] || "",
          value: model.festivalsInMonth.reduce((a, e) => a + e[1], 0),
        },
        {
          label: "Intercalary in view",
          tip: TIPS["Intercalary periods"] || "",
          value: model.intercalaryDayCountInView || 0,
        },
        {
          label: "Astronomy markers",
          tip: TIPS["Astronomy markers"] || "",
          value: model.markersInMonth.reduce((a, e) => a + (e.count || 0), 0),
        },
        {
          label: "Cycle markers",
          tip: TIPS["Cycle list"] || "",
          value: model.cyclesInMonth.reduce((a, e) => a + (e.count || 0), 0),
        },
      ].map((item) =>
        createElement("div", { className: "calendar-compact-card" }, [
          createElement("div", { className: "calendar-compact-card__label" }, [
            item.label,
            " ",
            tipIconNode(item.tip || ""),
          ]),
          createElement("div", {
            className: "calendar-compact-card__value",
            text: String(item.value),
          }),
        ]),
      ),
    );

    const holidayEvents = model.holidaysInMonth
      .slice(0, 6)
      .map(([hid, hits]) => {
        const h = holidays.find((x) => x.id === hid);
        return h ? `${h.name} [${holidayCategoryLabel(h.category)}] (${hits})` : "";
      })
      .filter(Boolean);
    const festivalEvents = model.festivalsInMonth
      .slice(0, 6)
      .map(([fid, hits]) => {
        const f = festivals.find((x) => x.id === fid);
        return f ? `${f.name} (${hits})` : "";
      })
      .filter(Boolean);
    const markerEvents = model.markersInMonth
      .slice(0, 8)
      .map((marker) => `${astronomyMarkerLabel(marker)} (${marker.count})`);
    const cycleEvents = model.cyclesInMonth
      .slice(0, 8)
      .map((cycle) => `Cycle: ${cycle.ruleName || "Rule"} (${cycle.count})`);
    const intercalaryEvents = (model.intercalarySummary || [])
      .slice(0, 6)
      .map((item) => `Intercalary: ${item}`);
    const eventItems = [
      holidayEvents,
      festivalEvents,
      intercalaryEvents,
      markerEvents,
      cycleEvents,
    ].flat();
    replaceChildren(els.compactEvents, [
      createElement("div", { className: "calendar-compact-events__label" }, [
        "Month events ",
        tipIconNode(TIPS["Month events"] || ""),
      ]),
      eventItems.length
        ? createElement(
            "ul",
            {},
            eventItems.map((item) => createElement("li", { text: item })),
          )
        : hintNode("No holiday, festival, or intercalary events in view."),
      model.outsideWeekFlowFestivals.length
        ? hintNode(
            `Outside-week-flow festivals: ${model.outsideWeekFlowFestivals
              .map((festival) => `${festival.name} (after day ${festival.afterDay})`)
              .slice(0, 4)
              .join(", ")}`,
          )
        : null,
    ]);

    renderAuditPanels(ctx, model);

    const mini = miniGrid(model, selected?.absoluteDay ?? state.ui.jumpAbsoluteDay);
    replaceChildren(els.miniHead, mini.head);
    replaceChildren(els.miniBody, mini.body);

    const detail = detailedGrid(model, selected?.absoluteDay ?? state.ui.jumpAbsoluteDay);
    replaceChildren(els.detailHead, detail.head);
    replaceChildren(els.detailBody, detail.body);

    updateHolidayEnables();
    updateFestivalEnables();
    updateIntercalaryEnables();
    updateCycleEnables();
    applyCollapsedPanels();
    applyDrawerState();
    persistState(state);
  }

  function shiftMonth(delta) {
    const { ctx } = readRenderSnapshot();
    const mpy = ctx.metrics.monthsPerYear;
    let month = state.ui.monthIndex + delta;
    let year = state.ui.year;
    while (month < 0) {
      month += mpy;
      year -= 1;
    }
    while (month >= mpy) {
      month -= mpy;
      year += 1;
    }
    state.ui.year = Math.max(1, year);
    state.ui.monthIndex = clampI(month, 0, mpy - 1);
    state.ui.selectedDay = 1;
  }

  function jumpToAbsoluteDay(absDay) {
    const { ctx } = readRenderSnapshot();
    const converted = fromAbsoluteDay(
      ctx.metrics,
      ctx.leapRules,
      absDay,
      ctx.monthLengthOverrides,
      ctx.intercalaryPeriods,
      state.ui.startDayOfYear,
    );
    state.ui.jumpAbsoluteDay = converted.absoluteDay;
    state.ui.jumpYear = converted.year;
    state.ui.jumpMonthIndex = converted.monthIndex;
    state.ui.jumpDayOfMonth = converted.dayOfMonth;
    state.ui.year = converted.year;
    state.ui.monthIndex = converted.monthIndex;
    state.ui.selectedDay = converted.dayOfMonth;
  }

  function jumpToDate(year, monthIndex, dayOfMonth) {
    const { ctx } = readRenderSnapshot();
    const safeYear = Math.max(1, I(year, 1));
    const safeMonth = clampI(monthIndex, 0, ctx.metrics.monthsPerYear - 1);
    const lengths = getMonthLengthsForYear({
      metrics: ctx.metrics,
      year: safeYear,
      leapRules: ctx.leapRules,
      monthLengthOverrides: ctx.monthLengthOverrides,
      intercalaryPeriods: ctx.intercalaryPeriods,
    });
    const safeDay = clampI(dayOfMonth, 1, lengths[safeMonth] || 1);
    const abs = toAbsoluteDay(
      ctx.metrics,
      ctx.leapRules,
      safeYear,
      safeMonth,
      safeDay,
      ctx.monthLengthOverrides,
      ctx.intercalaryPeriods,
      state.ui.startDayOfYear,
    );
    state.ui.jumpAbsoluteDay = abs;
    state.ui.jumpYear = safeYear;
    state.ui.jumpMonthIndex = safeMonth;
    state.ui.jumpDayOfMonth = safeDay;
    state.ui.year = safeYear;
    state.ui.monthIndex = safeMonth;
    state.ui.selectedDay = safeDay;
  }

  runtime.resetRuleEditors();
  loadCurrentJsonToTextarea();
  setOutputStatus("Ready.", "info");
  applyCollapsedPanels();
  applyDrawerState();

  els.drawerToggle.addEventListener("click", () => {
    state.ui.drawerOpen = !state.ui.drawerOpen;
    applyDrawerState();
    persistState(state);
  });
  wrap.querySelector(".calendar-drawer__tabs")?.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-drawer-tab]");
    if (!tab) return;
    state.ui.drawerSection = tab.dataset.drawerTab;
    applyDrawerState();
    persistState(state);
  });
  wrap.querySelector(".calendar-drawer__subtabs")?.addEventListener("click", (e) => {
    const st = e.target.closest("[data-rules-tab]");
    if (!st) return;
    state.ui.rulesTab = st.dataset.rulesTab;
    applyDrawerState();
    refreshAuditPanelsFromLatestSnapshot();
    persistState(state);
  });
  wrap.querySelector("#calDrawerBackdrop")?.addEventListener("click", () => {
    state.ui.drawerOpen = false;
    applyDrawerState();
    persistState(state);
  });

  // Tutorial panel
  createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.cal.tutorial",
    container: wrap,
    triggerBtn: wrap.querySelector("#calTutorials"),
  });

  for (const { key } of CALENDAR_COLLAPSIBLE_PANELS) {
    const refs = collapsiblePanels[key];
    if (!refs?.button) continue;
    refs.button.addEventListener("click", () => {
      state.ui.collapsedSections[key] = !state.ui.collapsedSections[key];
      applyCollapsedPanels();
      persistState(state);
    });
  }

  const makeProfileId = () => `cal-${Math.random().toString(36).slice(2, 10)}`;

  els.profileSelect.addEventListener("change", () => {
    activateProfile(els.profileSelect.value);
    render();
  });

  els.profileNew.addEventListener("click", () => {
    saveActiveProfileSnapshot();
    const suggested = `Calendar ${Math.max(2, (state.profiles?.length || 0) + 1)}`;
    const name = String(window.prompt("Name for new calendar profile:", suggested) || "").trim();
    if (!name) return;
    const id = makeProfileId();
    const world = loadWorld();
    const seed = normalizeSingleProfile(world, defaultState(world));
    seed.ui.calendarName = name;
    const profile = { id, name, ...seed };
    state._allProfiles.push(profile);
    activateProfile(id);
    render();
  });

  els.profileDuplicate.addEventListener("click", () => {
    saveActiveProfileSnapshot();
    const suggested = `${state.profileName || state.ui.calendarName || "Calendar"} copy`;
    const name = String(window.prompt("Name for duplicated profile:", suggested) || "").trim();
    if (!name) return;
    const id = makeProfileId();
    const world = loadWorld();
    const clone = normalizeSingleProfile(world, {
      inputs: clonePlain(state.inputs),
      ui: clonePlain(state.ui),
    });
    clone.ui.calendarName = name;
    const profile = { id, name, ...clone };
    state._allProfiles.push(profile);
    activateProfile(id);
    render();
  });

  els.profileDelete.addEventListener("click", async () => {
    saveActiveProfileSnapshot();
    if ((state._allProfiles || []).length <= 1) return;
    const deletePlan = buildDeleteCalendarProfilePlan({
      profiles: state._allProfiles || [],
      profileId: state.profileId,
      profileName: state.profileName,
    });
    if (!deletePlan) return;
    const confirmed = await confirmDestructiveAction(deletePlan);
    if (!confirmed) return;
    state._allProfiles = state._allProfiles.filter(
      (p) => String(p?.id) !== String(state.profileId),
    );
    const fallback = state._allProfiles[0];
    if (!fallback) return;
    activateProfile(fallback.id, { saveCurrent: false });
    render();
  });

  // Live-update: read inputs and re-render without resetting view position
  function applyInputsLive() {
    state.inputs.sourcePlanetId = els.sourcePlanet.value || "";
    state.inputs.primaryMoonId = els.primaryMoon.value || "";
    state.inputs.extraMoonIds = [
      els.extraMoon1.value || "",
      els.extraMoon2.value || "",
      els.extraMoon3.value || "",
    ];
    state.ui.derivedRoundEnabled = !!els.derivedRoundEnabled.checked;
    state.ui.derivedDecimalPlaces = clampI(els.derivedDecimalPlaces.value, 0, 6);
    state.inputs.monthsPerYear = clampI(els.monthsPerYear.value, 1, 240);
    state.inputs.daysPerMonth = clampI(els.daysPerMonth.value, 1, 500);
    const liveDpm = state.inputs.daysPerMonth;
    state.inputs.daysPerWeek = clampI(els.daysPerWeek.value, 1, Math.min(30, liveDpm));
    render();
  }

  // Source object selects reset calendar view position (new orbital data)
  [els.sourcePlanet, els.primaryMoon, els.extraMoon1, els.extraMoon2, els.extraMoon3].forEach(
    (el) =>
      el.addEventListener("change", () => {
        state.ui.monthIndex = 0;
        state.ui.selectedDay = 1;
        applyInputsLive();
      }),
  );

  // Number/slider inputs live-update without resetting view
  [els.monthsPerYear, els.daysPerMonth, els.daysPerWeek, els.derivedDecimalPlaces].forEach((el) =>
    el.addEventListener("input", applyInputsLive),
  );

  // Rounding toggle: enable/disable slider + live-update
  els.derivedRoundEnabled.addEventListener("change", () => {
    const on = els.derivedRoundEnabled.checked;
    els.derivedDecimalPlaces.disabled = !on;
    const dpSlider = els.derivedDecimalPlaces
      .closest(".form-row")
      ?.querySelector('input[type="range"]');
    if (dpSlider) dpSlider.disabled = !on;
    applyInputsLive();
  });

  els.useSelected.addEventListener("click", () => {
    const w = loadWorld();
    state.inputs.sourcePlanetId = getSelectedPlanet(w)?.id || "";
    state.inputs.primaryMoonId = getSelectedMoon(w)?.id || "";
    state.inputs.extraMoonIds = ["", "", ""];
    state.inputs.monthsPerYear = null;
    state.inputs.daysPerMonth = null;
    state.inputs.daysPerWeek = null;
    render();
  });

  els.exportDownload.addEventListener("click", () => {
    const text = currentCalendarJsonText();
    downloadJsonFile(`worldsmith-calendar-${utcStampCompact()}.json`, text);
    setJsonStatus("Downloaded calendar JSON.", "ok");
  });

  els.exportCopy.addEventListener("click", async () => {
    const ok = await copyTextToClipboard(currentCalendarJsonText());
    setJsonStatus(ok ? "Copied calendar JSON to clipboard." : "Copy failed.", ok ? "ok" : "error");
  });

  els.importFileBtn.addEventListener("click", () => {
    els.importFile.click();
  });

  els.importFile.addEventListener("change", async () => {
    const file = els.importFile.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (document.activeElement !== els.jsonText) {
        els.jsonText.value = text;
      }
      await importCalendarJsonText(text, file.name);
    } catch (err) {
      setJsonStatus(`Import failed: ${err?.message || "Could not read file."}`, "error");
    } finally {
      els.importFile.value = "";
    }
  });

  els.importApply.addEventListener("click", async () => {
    await importCalendarJsonText(els.jsonText.value, "pasted JSON");
  });

  els.jsonLoadCurrent.addEventListener("click", () => {
    loadCurrentJsonToTextarea();
  });

  els.jumpAbsBtn.addEventListener("click", () => {
    jumpToAbsoluteDay(els.jumpAbs.value);
    render();
  });

  els.jumpDateBtn.addEventListener("click", () => {
    jumpToDate(els.jumpYear.value, els.jumpMonth.value, els.jumpDay.value);
    render();
  });

  const updateYearDisplayState = () => {
    state.ui.calendarName = String(els.calendarName.value || "").trim() || "Calendar";
    state.profileName = state.ui.calendarName;
    state.ui.yearDisplayMode = ["numeric", "era", "pre-calendar"].includes(
      els.yearDisplayMode.value,
    )
      ? els.yearDisplayMode.value
      : "numeric";
    state.ui.yearOffset = I(els.yearOffset.value, 0);
    state.ui.yearPrefix = String(els.yearPrefix.value || "").trim();
    state.ui.yearSuffix = String(els.yearSuffix.value || "").trim();
    state.ui.preCalendarStartYear = Math.max(1, I(els.preCalendarStartYear.value, 1));
    state.ui.postEraLabel = String(els.postEraLabel.value || "").trim() || "CE";
    state.ui.preEraLabel = String(els.preEraLabel.value || "").trim() || "BCE";
    state.ui.preCalendarUseYearZero = !!els.preCalendarUseYearZero.checked;
  };

  const updateOutputStateFromControls = () => {
    state.ui.astronomy = {
      enabled: !!els.markerEnabled.checked,
      seasons: !!els.markerSeasons.checked,
      seasonBands: !!els.markerSeasonBands.checked,
      eclipses: !!els.markerEclipses.checked,
    };
    state.ui.exportAnchorDate = normalizeIsoDate(els.icsAnchor.value);
    state.ui.icsIncludes = {
      holidays: !!els.icsIncHolidays.checked,
      festivals: !!els.icsIncFestivals.checked,
      markers: !!els.icsIncMarkers.checked,
    };
  };
  [
    els.calendarName,
    els.yearDisplayMode,
    els.yearOffset,
    els.yearPrefix,
    els.yearSuffix,
    els.preCalendarStartYear,
    els.postEraLabel,
    els.preEraLabel,
    els.preCalendarUseYearZero,
  ].forEach((el) =>
    el.addEventListener("change", () => {
      updateYearDisplayState();
      render();
    }),
  );

  [els.markerEnabled, els.markerSeasons, els.markerSeasonBands, els.markerEclipses].forEach((el) =>
    el.addEventListener("change", () => {
      updateOutputStateFromControls();
      render();
    }),
  );
  els.holidayFilters?.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-cal-holiday-filter]");
    if (!input) return;
    const category = String(input.getAttribute("data-cal-holiday-filter") || "").trim();
    if (!HOLIDAY_CATEGORY_SET.has(category)) return;
    state.ui.holidayCategoryFilters = normalizeHolidayCategoryFilters(
      state.ui.holidayCategoryFilters,
    );
    state.ui.holidayCategoryFilters[category] = !!input.checked;
    render();
  });
  [els.icsAnchor, els.icsIncHolidays, els.icsIncFestivals, els.icsIncMarkers].forEach((el) =>
    el.addEventListener("change", () => {
      updateOutputStateFromControls();
      render();
    }),
  );

  els.pdfMonth.addEventListener("click", () => {
    updateOutputStateFromControls();
    void openPrintableCalendar("month");
  });
  els.pdfYear.addEventListener("click", () => {
    updateOutputStateFromControls();
    void openPrintableCalendar("year");
  });
  els.icsMonth.addEventListener("click", () => {
    updateOutputStateFromControls();
    void downloadIcs("month");
  });
  els.icsYear.addEventListener("click", () => {
    updateOutputStateFromControls();
    void downloadIcs("year");
  });

  els.basis.addEventListener("change", () => {
    state.ui.basis = els.basis.value;
    state.ui.monthIndex = 0;
    state.ui.selectedDay = 1;
    render();
  });
  els.year.addEventListener("change", () => {
    state.ui.year = Math.max(1, clampI(els.year.value, 1, 1000000));
    render();
  });
  els.month.addEventListener("change", () => {
    state.ui.monthIndex = Math.max(0, I(els.month.value, 0));
    state.ui.selectedDay = 1;
    render();
  });
  els.startDay.addEventListener("change", () => {
    state.ui.startDayOfYear = Math.max(0, I(els.startDay.value, 0));
    render();
  });
  els.weekStart.addEventListener("change", () => {
    state.ui.weekStartsOn = Math.max(0, I(els.weekStart.value, 0));
    render();
  });
  els.moonEpoch.addEventListener("change", () => {
    state.ui.moonEpochOffsetDays = N(els.moonEpoch.value, 0);
    render();
  });

  // Live-update: name textareas apply on every keystroke
  function applyNamesLive() {
    updateYearDisplayState();
    state.ui.dayNames = splitNames(els.dayNames.value);
    state.ui.weekNames = splitNames(els.weekNames.value);
    state.ui.monthNames = splitNames(els.monthNames.value);
    render();
  }
  [els.dayNames, els.weekNames, els.monthNames].forEach((el) =>
    el.addEventListener("input", applyNamesLive),
  );
  els.monthLengthOverridesEnabled.addEventListener("change", () => {
    state.ui.monthLengthOverridesEnabled = els.monthLengthOverridesEnabled.checked;
    render();
  });
  els.monthLengthOverrides.addEventListener("input", () => {
    state.ui.monthLengthOverrides = splitMonthLengths(els.monthLengthOverrides.value);
    render();
  });
  els.resetNames.addEventListener("click", () => {
    state.ui.calendarName = "Calendar";
    state.profileName = "Calendar";
    state.ui.dayNames = [];
    state.ui.weekNames = [];
    state.ui.monthNames = [];
    state.ui.monthLengthOverridesEnabled = false;
    state.ui.monthLengthOverrides = [];
    state.ui.yearPrefix = "";
    state.ui.yearSuffix = "";
    state.ui.yearOffset = 0;
    state.ui.yearDisplayMode = "numeric";
    state.ui.preCalendarStartYear = 1;
    state.ui.postEraLabel = "CE";
    state.ui.preEraLabel = "BCE";
    state.ui.preCalendarUseYearZero = false;
    render();
  });

  els.eraAdd.addEventListener("click", () => {
    const name = String(els.eraName.value || "").trim();
    const startYear = Math.max(1, I(els.eraStartYear.value, 1));
    if (!name) return;
    const next = normEraRules([
      ...(Array.isArray(state.ui.eras) ? state.ui.eras : []),
      { id: `era-${Math.random().toString(36).slice(2, 9)}`, name, startYear },
    ]);
    state.ui.eras = next;
    els.eraName.value = "";
    els.eraStartYear.value = "";
    render();
  });

  els.eraList.addEventListener("click", (event) => {
    const delBtn = event.target.closest("button[data-cal-era-del]");
    if (!delBtn) return;
    const id = delBtn.getAttribute("data-cal-era-del");
    state.ui.eras = normEraRules(
      (Array.isArray(state.ui.eras) ? state.ui.eras : []).filter(
        (x) => String(x?.id) !== String(id),
      ),
    );
    render();
  });

  bindRuleEditorEvents();

  function refreshAuditPanelsFromLatestSnapshot() {
    const ctx = runtime.lastCtx || readRenderSnapshot().ctx;
    if (!ctx?.monthModel) return;
    const model = applyHolidayFiltersToMonthModel(ctx.monthModel, state.ui.holidayCategoryFilters);
    renderAuditPanels(ctx, model);
  }

  function revealSelectedDayTrace() {
    els.selectedDay?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    const traceDetails = els.selectedDay?.querySelector?.("details.calendar-rule-trace");
    if (traceDetails) traceDetails.open = true;
  }

  [els.auditScope, els.auditKind].forEach((el) =>
    el?.addEventListener("change", () => {
      state.ui.auditScope = els.auditScope.value || "month";
      state.ui.auditKind = els.auditKind.value || "all";
      refreshAuditPanelsFromLatestSnapshot();
      persistState(state);
    }),
  );

  const holidayForm = els.holidayName?.closest(".calendar-holiday-form") || null;
  const festivalForm = els.festivalName?.closest(".calendar-holiday-form") || null;
  holidayForm?.addEventListener("input", (event) => {
    if (!String(event.target?.id || "").startsWith("calHoliday")) return;
    refreshAuditPanelsFromLatestSnapshot();
  });
  holidayForm?.addEventListener("change", (event) => {
    if (!String(event.target?.id || "").startsWith("calHoliday")) return;
    refreshAuditPanelsFromLatestSnapshot();
  });
  festivalForm?.addEventListener("input", (event) => {
    if (!String(event.target?.id || "").startsWith("calFestival")) return;
    refreshAuditPanelsFromLatestSnapshot();
  });
  festivalForm?.addEventListener("change", (event) => {
    if (!String(event.target?.id || "").startsWith("calFestival")) return;
    refreshAuditPanelsFromLatestSnapshot();
  });

  els.prevMonth.addEventListener("click", () => {
    shiftMonth(-1);
    render();
  });
  els.nextMonth.addEventListener("click", () => {
    shiftMonth(1);
    render();
  });
  bindDetailOverlayEvents();

  wrap.addEventListener("click", (event) => {
    const copyBtn = event.target.closest(".calendar-rule-trace__copy");
    if (copyBtn) {
      const trace = traceRulesForDay({
        cell: (() => {
          const ctx = runtime.lastCtx;
          if (!ctx?.monthModel) return null;
          const allDays = getSelectableCalendarDays(ctx.monthModel);
          return (
            allDays.find(
              (day) => day.absoluteDay === Math.max(0, I(state.ui.jumpAbsoluteDay, 0)),
            ) ||
            allDays.find((day) => day.dayNumber === state.ui.selectedDay) ||
            allDays[0]
          );
        })(),
        model: runtime.lastCtx?.monthModel,
        holidays: runtime.lastCtx?.holidays || [],
        festivals: runtime.lastCtx?.festivals || [],
        workCycles: runtime.lastCtx?.workCycles || [],
        leapRules: runtime.lastCtx?.leapRules || [],
        metrics: runtime.lastCtx?.metrics,
        dayNames: runtime.lastCtx?.dayNames || [],
        monthNames: runtime.lastCtx?.monthNames || [],
        weekendDayIndexes: state.ui.weekendDayIndexes,
      });
      const text = traceToPlainText(trace);
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(
          () => {
            copyBtn.textContent = "Copied!";
            setTimeout(() => {
              copyBtn.textContent = "Copy to clipboard";
            }, 1500);
          },
          () => {
            copyBtn.textContent = "Copy failed";
          },
        );
      }
      return;
    }
    const auditMonthBtn = event.target.closest("button[data-cal-audit-trace]");
    if (auditMonthBtn) {
      jumpToDate(
        Math.max(1, I(auditMonthBtn.getAttribute("data-cal-audit-year"), state.ui.year)),
        Math.max(0, I(auditMonthBtn.getAttribute("data-cal-audit-month"), state.ui.monthIndex)),
        Math.max(1, I(auditMonthBtn.getAttribute("data-cal-audit-day"), 1)),
      );
      const auditAbsoluteDay = auditMonthBtn.getAttribute("data-cal-audit-absolute-day");
      if (auditAbsoluteDay != null && auditAbsoluteDay !== "") {
        state.ui.jumpAbsoluteDay = Math.max(0, I(auditAbsoluteDay, state.ui.jumpAbsoluteDay));
      }
      render();
      revealSelectedDayTrace();
      return;
    }
    const calendarBtn = event.target.closest("button[data-cal-absolute-day]");
    if (!calendarBtn) return;
    state.ui.jumpAbsoluteDay = Math.max(0, I(calendarBtn.getAttribute("data-cal-absolute-day"), 0));
    const explicitDay =
      calendarBtn.getAttribute("data-cal-mini-day") ?? calendarBtn.getAttribute("data-cal-day");
    if (explicitDay != null && explicitDay !== "") {
      state.ui.selectedDay = Math.max(1, I(explicitDay, 1));
    } else {
      const currentDay = getSelectableCalendarDays(runtime.lastCtx?.monthModel).find(
        (day) => day.absoluteDay === state.ui.jumpAbsoluteDay,
      );
      state.ui.selectedDay = Math.max(
        1,
        I(currentDay?.mappedDayOfMonth ?? currentDay?.dayNumber ?? state.ui.selectedDay, 1),
      );
    }
    render();
  });

  const onEsc = (event) => {
    if (event.key === "Escape") {
      closeDetail();
    }
  };
  document.addEventListener("keydown", onEsc);
  const wrapObserver = new MutationObserver(() => {
    if (!wrap.isConnected) {
      document.removeEventListener("keydown", onEsc);
      wrapObserver.disconnect();
    }
  });
  if (wrap.parentNode) {
    wrapObserver.observe(wrap.parentNode, { childList: true });
  }

  render();
}
