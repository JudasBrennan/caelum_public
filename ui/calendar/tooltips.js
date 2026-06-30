import { structuredTip } from "../tooltipCopy.js";

export const CALENDAR_TOOLTIP_OVERRIDES = {
  "Reference body": structuredTip({
    overview: "Planet or moon whose local sky frame supplies the calendar context.",
    feedsInto:
      "Year length, local day length, visible phase cycles, month suggestions, leap-rule suggestions, and export summaries.",
    changes:
      "Switching the reference body changes which solved planet/moon data the calendar uses.",
    caveat:
      "Calendar profiles store their own overrides, so existing custom names/rules are not automatically erased.",
    references: "See Science & Maths: orbital periods and calendar construction.",
  }),
  "Primary phase cycle": structuredTip({
    overview: "Main visible phase cycle used for lunar or parent-body phase calculations.",
    feedsInto:
      "Full/new summaries, moon phase markers, relative holiday triggers, and detailed day views.",
    drawnFrom: "The selected reference body's moon/parent phase context.",
    caveat: "Additional moons can be displayed without replacing the primary phase cycle.",
    references: "See Science & Maths: synodic periods and moon phases.",
  }),
  "Planet orbital period": structuredTip({
    overview: "Read-only orbital year for the selected planet.",
    drawnFrom: "The solved planet/star orbit model.",
    feedsInto:
      "Calendar year length, month suggestions, leap-rule suggestions, and year export data.",
    caveat:
      "Change the planet orbit on the Planet page; this field only reflects the solved value.",
    references: "See Science & Maths: Keplerian orbital periods.",
  }),
  "Moon orbital period": structuredTip({
    overview: "Read-only primary moon synodic period from new moon to new moon.",
    drawnFrom: "The selected moon/parent/reference-body phase model.",
    feedsInto: "Lunar month suggestions, phase markers, and relative moon-phase holidays.",
    caveat: "If no usable moon is selected, the calendar falls back to non-lunar defaults.",
    references: "See Science & Maths: synodic periods.",
  }),
  "Planet rotation": structuredTip({
    overview: "Read-only local day length for the selected planet.",
    drawnFrom: "The solved planet rotation period.",
    feedsInto: "Local day counts, calendar year/day conversions, and export summaries.",
    caveat: "Change rotation on the Planet page; the calendar only consumes the solved value.",
    references: "See Science & Maths: rotation period and local days.",
  }),
  "Decimal places": structuredTip({
    overview:
      "Optional precision control for derived orbital inputs before they enter the calendar model.",
    feedsInto: "Month lengths, leap-cycle suggestions, and displayed period values.",
    changes:
      "When enabled, rounds planet period, moon period, and rotation to the selected decimal places. 6 keeps full engine precision; 0 uses whole numbers.",
    caveat:
      "When disabled, raw engine values pass through unmodified. Rounding can make calendars easier to use but less physically exact.",
    references: "See Science & Maths: calendar construction.",
  }),
  "Months per year": structuredTip({
    overview: "How many months the calendar splits the year into.",
    feedsInto:
      "Month grid layout, month names, holiday matching, intercalary rules, and export chronology.",
    drawnFrom: "User override or the lunar-cycle-based default.",
    caveat: "Changing this can invalidate custom month names or month-length assumptions.",
    references: "See Science & Maths: calendar construction.",
  }),
  "Days per month": structuredTip({
    overview: "Base number of days each month contains.",
    feedsInto:
      "Month grids, weekday alignment, holiday matching, intercalary periods, and leap rules.",
    drawnFrom: "User override or the orbital-derived value for the active basis.",
    caveat:
      "Custom Month lengths and leap rules can add, remove, or override days after this base value.",
    references: "See Science & Maths: calendar construction.",
  }),
  "Month lengths": structuredTip({
    overview: "Custom day counts for individual months, one per line.",
    feedsInto:
      "Month grids, absolute dates, holiday placement, intercalary chronology, and export output.",
    changes:
      "Blank or missing lines fall back to the base Days per month value. Leap rules still add or remove days on top of these overrides.",
    caveat:
      "Use Intercalary Periods for structural extra days before months, after months, at year end, or appended into a month.",
    references: "See Science & Maths: calendar construction.",
  }),
  "Year display mode": structuredTip({
    overview: "Controls how calendar years are displayed.",
    changes: "Choose custom numbering, named eras, or pre/post calendar eras such as BCE/CE.",
    feedsInto:
      "Month headers, detailed day view, holiday exports, printable export, and ICS labels.",
    caveat: "This changes labels, not the underlying absolute year arithmetic.",
  }),
  "Use relative trigger": structuredTip({
    overview: "Enables holiday rules anchored relative to another event.",
    feedsInto: "Holiday date matching, conflict checks, event summaries, and exports.",
    changes:
      "A holiday can be placed relative to moon phases, astronomy markers, or another holiday with a positive or negative day offset.",
    caveat:
      "Linked-holiday chains can create impossible or circular rules; use the audit panel to inspect warnings.",
    references: "See Science & Maths: calendar event rules.",
  }),
  "Leap rules": structuredTip({
    overview: "Rules that add or remove days from a target month on repeating year cycles.",
    feedsInto:
      "Year length correction, month grids, absolute dates, holiday matching, and exports.",
    drawnFrom: "The configured cycle, start year, target month, and day delta.",
    caveat: "Leap rules run after base month lengths and custom month-length overrides.",
    references: "See Science & Maths: leap cycles and calendar drift.",
  }),
  "Suggest leap rule": structuredTip({
    overview: "Calculates a recommended +/-1-day leap cycle from the source orbital year.",
    drawnFrom:
      "The selected reference body's orbital year, day length, current month settings, and drift estimate.",
    changes: "Adds a leap rule automatically to reduce long-term calendar drift.",
    caveat:
      "The suggestion is a usability aid; authored calendars may intentionally choose different drift.",
    references: "See Science & Maths: leap cycles and calendar drift.",
  }),
  "Calendar profile": structuredTip({
    overview: "Saved calendar variant inside the current world.",
    changes:
      "Switching profiles changes calendar rules, names, year labels, exports, and active month view.",
    caveat: "Calendar profiles do not alter the physical star/system/planet/moon data.",
  }),
  "New profile": structuredTip({
    overview: "Create a separate calendar profile.",
    changes: "Adds a new editable calendar-rule set without replacing the current world.",
    caveat: "The new profile starts from defaults or copied state depending on the action flow.",
  }),
  "Duplicate profile": structuredTip({
    overview: "Copy the current calendar profile.",
    changes:
      "Creates a new profile with the same rules, names, year labels, holidays, and export settings.",
    caveat: "Later edits to the duplicate do not update the original profile.",
  }),
  "Delete profile": structuredTip({
    overview: "Delete the active calendar profile.",
    changes: "Removes the selected profile from this world after confirmation.",
    caveat: "This cannot be recovered unless the world was exported or backed up earlier.",
  }),
  "Extra moon": structuredTip({
    overview: "Optional additional moon shown in calendar views.",
    feedsInto: "Moon legends, phase chips, detailed day views, and moon-phase holiday context.",
    caveat: "It does not replace the primary phase cycle used for the main lunar month.",
    references: "See Science & Maths: synodic periods and moon phases.",
  }),
  "Days per week": structuredTip({
    overview: "Number of named weekdays in each week.",
    feedsInto: "Month grids, weekday rules, weekend handling, and holiday observance shifts.",
    drawnFrom: "User override or the calendar's derived default.",
    caveat: "Changing this can invalidate custom day names and weekday-based holiday rules.",
  }),
  Basis: structuredTip({
    overview: "Selects which physical or authored cycle drives the calendar structure.",
    feedsInto:
      "Year length, month partitioning, default day/week/month counts, and leap suggestions.",
    caveat:
      "Basis changes can reshape the whole profile; existing custom rules may need review afterward.",
    references: "See Science & Maths: calendar construction.",
  }),
  "Moon epoch offset": structuredTip({
    overview: "Phase timeline offset in local days.",
    feedsInto: "Moon phase markers, full/new summaries, and moon-phase relative holidays.",
    interpretAs: "Use it to align phase labels with your setting's chosen epoch.",
    caveat: "It shifts displayed phase timing only; it does not change the moon orbit.",
    references: "See Science & Maths: synodic periods and moon phases.",
  }),
  "Day names": structuredTip({
    overview: "Custom weekday names, one per line.",
    feedsInto: "Month grids, detailed day views, weekday holiday rules, and exports.",
    caveat: "Missing entries are auto-filled from defaults.",
  }),
  "Week names": structuredTip({
    overview: "Custom week labels, one per line.",
    feedsInto: "Week headers, detailed views, and calendar export labels.",
    caveat: "Missing entries are auto-filled from defaults.",
  }),
  "Month names": structuredTip({
    overview: "Custom month names, one per line.",
    feedsInto: "Month headers, date converter, holiday rules, exports, and era labels.",
    caveat: "Missing entries are auto-filled from defaults.",
  }),
  "Pre-calendar schema": structuredTip({
    overview: "Pre/post era year-formatting scheme.",
    feedsInto: "Displayed year labels, printable output, and ICS/export text.",
    caveat: "This changes display labels only; internal year arithmetic remains numeric.",
  }),
  "Era list": structuredTip({
    overview: "Configured named eras for year display.",
    drawnFrom: "Era labels and their start years; the latest start year <= current year wins.",
    feedsInto: "Month headers, detailed views, exports, and year label formatting.",
    caveat: "Eras label chronology but do not change absolute date arithmetic.",
  }),
  Recurrence: structuredTip({
    overview: "How often a holiday or festival repeats.",
    feedsInto: "Rule matching, audit preview, month events, printable exports, and ICS output.",
    interpretAs:
      "Use one-off for a single year, yearly for every year, and cyclic for every-N-years events.",
    caveat: "Other anchors, exceptions, and conflict rules can still suppress occurrences.",
  }),
  Attributes: structuredTip({
    overview: "Extra matching requirements for a holiday rule.",
    feedsInto: "Whether a rule appears on a given day and how the audit explains matches.",
    interpretAs: "Multiple selected checks must all match the same date.",
    caveat: "Over-constrained rules may never appear.",
  }),
  "Relative marker": structuredTip({
    overview: "Astronomy marker used as a relative holiday anchor.",
    feedsInto: "Holiday date matching and export output.",
    caveat: "Markers are calendar approximations, not precision ephemerides.",
    references: "See Science & Maths: calendar event rules.",
  }),
  "Relative holiday": structuredTip({
    overview: "Existing holiday used as the anchor for another holiday.",
    feedsInto: "Linked holiday matching, conflict handling, and audit warnings.",
    caveat: "Circular or missing links can prevent a rule from resolving.",
  }),
  "Moon phase": structuredTip({
    overview: "Required moon phase for phase-based event matching.",
    feedsInto: "Holiday and festival date matching, phase markers, and audit results.",
    drawnFrom: "Selected moon slot, synodic period, and epoch offset.",
    caveat: "Phase matching is calendar-level and not a high-precision ephemeris.",
    references: "See Science & Maths: synodic periods and moon phases.",
  }),
  "Holiday algorithm": structuredTip({
    overview: "Preset rule algorithm for compatible holiday systems.",
    feedsInto: "Holiday matching and audit preview.",
    caveat:
      "Preset algorithms are scoped to compatible calendar assumptions; arbitrary worlds may need manual rules.",
  }),
  "Holiday merge mode": structuredTip({
    overview: "How this holiday behaves when multiple holidays land on the same day.",
    feedsInto: "Month events, detailed day view, audit output, printable export, and ICS export.",
    interpretAs: "Merge keeps events together; override suppresses lower-priority matches.",
    caveat: "Priority and conflict rules can still alter the final observed event.",
  }),
  "Holiday conflict rule": structuredTip({
    overview: "How an event responds to collisions with other events.",
    feedsInto: "Resolved event dates, audit warnings, exports, and detailed day labels.",
    caveat: "Large shifts can move observances away from their underlying anchor.",
  }),
  "Weekend handling": structuredTip({
    overview: "Global observance policy for events landing on weekend days.",
    feedsInto: "Holiday/festival shifts, audit warnings, month events, and exports.",
    caveat: "Weekend handling changes observance dates, not the underlying calendar date.",
  }),
  "Weekend days": structuredTip({
    overview: "Weekdays treated as weekends by observance rules.",
    feedsInto: "Weekend handling, event shifts, audit warnings, and export dates.",
    caveat: "Changing weekend days can move observed holidays in existing profiles.",
  }),
  "Festival Days section": structuredTip({
    overview: "Rules for named event days inserted within months.",
    drawnFrom: "Festival recurrence, anchor month/day, duration, category, and exceptions.",
    caveat: "Use Intercalary Periods for structural extra days that reshape the calendar layout.",
  }),
  "Intercalary Periods section": structuredTip({
    overview: "Structural extra days placed before, after, or inside months.",
    feedsInto: "Month layout, weekday flow, absolute dates, event matching, and exports.",
    caveat: "Intercalary days can reshape chronology; audit complex profiles after editing.",
    references: "See Science & Maths: calendar construction.",
  }),
  "Intercalary periods": structuredTip({
    overview: "Named structural extra-day rules.",
    feedsInto: "Month grids, weekday flow, absolute dates, date conversion, and exports.",
    caveat: "They are structural calendar days, not holidays layered on normal days.",
    references: "See Science & Maths: calendar construction.",
  }),
  "Intercalary placement": structuredTip({
    overview: "Where an intercalary period sits in the year.",
    feedsInto: "Month layout, absolute day ordering, weekday flow, and export chronology.",
    caveat: "Year-end placement ignores the anchor month field.",
  }),
  "Intercalary duration mode": structuredTip({
    overview: "Controls how long an intercalary period lasts.",
    feedsInto: "Year length, month layout, date conversion, and audit output.",
    interpretAs:
      "Fixed uses the entered day count; derived remainder fills remaining structural days in the year.",
    caveat: "Derived remainder depends on the active year/month settings.",
  }),
  "Intercalary weekday flow": structuredTip({
    overview: "Whether intercalary days consume weekday slots.",
    feedsInto: "Weekday alignment, weekday holidays, weekend handling, and month grids.",
    caveat: "Outside-weekday-flow days can make calendar layouts less familiar but more flexible.",
  }),
  "Calendar JSON": structuredTip({
    overview: "Calendar-only import/export payload.",
    drawnFrom: "The active calendar profile and its names, rules, eras, and export settings.",
    caveat: "Calendar JSON does not alter star/system/planet/moon physics data.",
  }),
  "Download calendar JSON": structuredTip({
    overview: "Download the current calendar profile as JSON.",
    drawnFrom: "Active calendar profile settings only.",
    caveat: "Use full world export on Import/Export if you also need the physical world data.",
  }),
  "Copy calendar JSON": structuredTip({
    overview: "Copy the current calendar profile JSON to the clipboard.",
    drawnFrom: "Active calendar profile settings only.",
    caveat: "Clipboard availability depends on browser permissions.",
  }),
  "Import calendar JSON file": structuredTip({
    overview: "Load calendar settings from a JSON file.",
    changes: "Replaces or applies calendar-profile settings without changing world physics.",
    caveat: "Review the imported profile before relying on event rules.",
  }),
  "Apply pasted calendar JSON": structuredTip({
    overview: "Validate and apply pasted calendar-profile JSON.",
    changes: "Updates calendar settings only; saved star/system/body data is untouched.",
    caveat: "Invalid or incompatible profile data is rejected before applying.",
  }),
  "Date converter": structuredTip({
    overview: "Convert between absolute day index and calendar date.",
    drawnFrom: "Current calendar structure, month lengths, leap rules, and intercalary periods.",
    caveat: "Changing structural rules can change the same absolute day's displayed date.",
  }),
  "Rule audit": structuredTip({
    overview: "Resolved agenda for rules that affect the current month or year.",
    drawnFrom:
      "Holidays, festivals, intercalary periods, leap rules, astronomy markers, and work/rest cycles.",
    interpretAs: "Use this to debug dense or conflicting calendar rules.",
    caveat:
      "The audit explains the resolved profile; it does not fix impossible rules automatically.",
  }),
  "Audit scope": structuredTip({
    overview: "Choose whether audit output covers the current month or full year.",
    changes: "A wider scope reveals more future conflicts but can be denser to scan.",
  }),
  "Audit filter": structuredTip({
    overview: "Filter audit output by event or rule type.",
    changes: "Hides unrelated audit rows so one class of rule can be inspected.",
  }),
  "Rule preview": structuredTip({
    overview: "Preview upcoming occurrences for the rule currently being edited.",
    drawnFrom: "Current form values plus the active calendar profile.",
    caveat: "Preview rows are draft diagnostics until the rule is saved.",
  }),
};
