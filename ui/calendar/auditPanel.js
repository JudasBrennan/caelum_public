export function createCalendarAuditPanelHelpers({
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
}) {
  function auditKindLabel(kind) {
    switch (String(kind || "")) {
      case "holiday":
        return "Holiday";
      case "festival":
        return "Festival";
      case "intercalary":
        return "Intercalary";
      case "marker":
        return "Astronomy";
      case "cycle":
        return "Cycle";
      default:
        return "Entry";
    }
  }

  function buildCalendarAuditMonthModel(ctx, state, year, monthIndex, overrides = {}) {
    return buildMonthModel({
      metrics: ctx.metrics,
      year,
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
      holidays: overrides.holidays || ctx.holidays,
      festivals: overrides.festivals || ctx.festivals,
      astronomySettings: ctx.astronomySettings,
      workCycles: ctx.workCycles,
      weekendDayIndexes: ctx.weekendDayIndexes,
      holidayAlgorithmSupport: ctx.holidayAlgorithmSupport,
    });
  }

  function buildCalendarAuditEntries({ ctx, state, model, scope, kindFilter }) {
    const entries = [];
    const seenKeys = new Set();
    let truncated = false;

    const appendFromModel = (monthModel) => {
      const result = buildMonthAuditEntries(monthModel, {
        kindFilter,
        limit: CALENDAR_AUDIT_RENDER_LIMIT - entries.length,
        seenKeys,
      });
      entries.push(...result.entries);
      if (result.truncated || entries.length >= CALENDAR_AUDIT_RENDER_LIMIT) {
        truncated = true;
        return false;
      }
      return true;
    };

    if (String(scope || "month") === "year") {
      for (let targetMonth = 0; targetMonth < ctx.metrics.monthsPerYear; targetMonth += 1) {
        const baseModel =
          targetMonth === ctx.monthModel.monthIndex && state.ui.year === ctx.monthModel.year
            ? ctx.monthModel
            : buildCalendarAuditMonthModel(ctx, state, state.ui.year, targetMonth);
        const filteredModel = applyHolidayFiltersToMonthModel(
          baseModel,
          state.ui.holidayCategoryFilters,
        );
        if (!appendFromModel(filteredModel)) break;
      }
      return { entries, truncated };
    }

    appendFromModel(model);
    return { entries, truncated };
  }

  function buildRulePreviewEntries({ ctx, state, preview }) {
    if (!preview?.draft?.id) {
      return { entries: [], truncated: false, scannedMonths: 0 };
    }

    const entries = [];
    const seenKeys = new Set();
    const kindFilter = preview.type === "festival" ? "festival" : "holiday";
    const safeMonthsPerYear = Math.max(1, I(ctx?.metrics?.monthsPerYear, 12));
    const recurrence = String(preview?.draft?.recurrence || "yearly");
    const recurrenceLeadYears =
      recurrence === "cyclic"
        ? Math.max(
            Math.max(1, I(preview?.draft?.cycleYears, 1)),
            Math.max(0, I(preview?.draft?.offsetYear, 1) - Math.max(1, I(state?.ui?.year, 1)) + 1),
          )
        : recurrence === "one-off"
          ? Math.max(0, I(preview?.draft?.year, 1) - Math.max(1, I(state?.ui?.year, 1)) + 1)
          : 0;
    const scanYears = Math.min(24, Math.max(CALENDAR_RULE_PREVIEW_SCAN_YEARS, recurrenceLeadYears));
    const scanMonths = Math.max(24, safeMonthsPerYear * scanYears);
    const startLinearMonth = toLinearMonthOrdinal(
      state.ui.year,
      state.ui.monthIndex,
      safeMonthsPerYear,
    );
    const holidays =
      preview.type === "holiday"
        ? [
            ...(Array.isArray(ctx.holidays) ? ctx.holidays : []).filter(
              (entry) => String(entry?.id || "") !== String(preview.draft.id || ""),
            ),
            preview.draft,
          ]
        : ctx.holidays;
    const festivals =
      preview.type === "festival"
        ? [
            ...(Array.isArray(ctx.festivals) ? ctx.festivals : []).filter(
              (entry) => String(entry?.id || "") !== String(preview.draft.id || ""),
            ),
            preview.draft,
          ]
        : ctx.festivals;
    let truncated = false;

    for (
      let monthOffset = 0;
      monthOffset < scanMonths && entries.length < CALENDAR_RULE_PREVIEW_LIMIT;
      monthOffset += 1
    ) {
      const target = fromLinearMonthOrdinal(startLinearMonth + monthOffset, safeMonthsPerYear);
      const previewModel = buildCalendarAuditMonthModel(
        ctx,
        state,
        target.year,
        target.monthIndex,
        {
          holidays,
          festivals,
        },
      );
      const result = buildMonthAuditEntries(previewModel, {
        kindFilter,
        ruleId: preview.draft.id,
        limit: CALENDAR_RULE_PREVIEW_LIMIT - entries.length,
        seenKeys,
      });
      entries.push(...result.entries);
      if (result.truncated || entries.length >= CALENDAR_RULE_PREVIEW_LIMIT) {
        truncated = true;
        break;
      }
    }

    return { entries, truncated, scannedMonths: scanMonths };
  }

  function pickActiveRulePreview(state, readers) {
    const holidayPreview =
      typeof readers?.readHolidayPreviewDraft === "function"
        ? readers.readHolidayPreviewDraft()
        : null;
    const festivalPreview =
      typeof readers?.readFestivalPreviewDraft === "function"
        ? readers.readFestivalPreviewDraft()
        : null;

    if (state.ui.rulesTab === "holidays") return holidayPreview;
    if (state.ui.rulesTab === "festivals") return festivalPreview;
    return holidayPreview || festivalPreview || null;
  }

  function buildAuditSummaryCounts(entries) {
    const counts = new Map();
    for (const entry of entries || []) {
      const kind = String(entry?.kind || "");
      if (!kind) continue;
      counts.set(kind, (counts.get(kind) || 0) + 1);
    }
    return ["holiday", "festival", "intercalary", "marker", "cycle"]
      .map((kind) => ({ kind, count: counts.get(kind) || 0 }))
      .filter((entry) => entry.count > 0);
  }

  const HOLIDAY_AUDIT_FORM_KEYS = [
    "holidayName",
    "holidayCategory",
    "holidayColorTag",
    "holidayRecurrence",
    "holidayCycleYears",
    "holidayOffsetYear",
    "holidayAdvancedToggle",
    "holidayYear",
    "holidayUseDate",
    "holidayUseWeekday",
    "holidayUseMoon",
    "holidayUseRelative",
    "holidayRelativeType",
    "holidayRelativeOffset",
    "holidayRelativeMoonSlot",
    "holidayRelativeMoonPhase",
    "holidayRelativeMarker",
    "holidayRelativeHoliday",
    "holidayAnchorType",
    "holidayAlgorithm",
    "holidayAnchorMoonSlot",
    "holidayAnchorMoonPhase",
    "holidayAnchorMarker",
    "holidayAnchorHoliday",
    "holidayAnchorOffset",
    "holidayConflictRule",
    "holidayMaxShiftDays",
    "holidayStayInMonth",
    "holidayConflictScope",
    "holidayConflictCategories",
    "holidayConflictHolidayIds",
    "holidayStartMonth",
    "holidayDayOfMonth",
    "holidayDuration",
    "holidayPriority",
    "holidayMergeMode",
    "holidayWeekday",
    "holidayOccurrence",
    "holidayMoonSlot",
    "holidayMoonPhase",
    "holidayExceptYears",
    "holidayExceptMonths",
    "holidayExceptDays",
  ];

  const FESTIVAL_AUDIT_FORM_KEYS = [
    "festivalName",
    "festivalCategory",
    "festivalColorTag",
    "festivalRecurrence",
    "festivalCycleYears",
    "festivalOffsetYear",
    "festivalYear",
    "festivalStartMonth",
    "festivalAfterDay",
    "festivalDuration",
    "festivalOutsideWeek",
    "festivalExceptYears",
    "festivalExceptMonths",
    "festivalExceptDays",
  ];

  function auditFieldSnapshot(el) {
    if (!el) return null;
    const type = String(el?.type || "").toLowerCase();
    if (type === "checkbox" || type === "radio") return !!el.checked;
    if (el.multiple && el.selectedOptions) {
      return Array.from(el.selectedOptions).map((option) => String(option?.value || ""));
    }
    return String(el.value ?? "");
  }

  function buildAuditEditorSnapshot(els, keys) {
    return (Array.isArray(keys) ? keys : []).reduce((snapshot, key) => {
      snapshot[key] = auditFieldSnapshot(els?.[key]);
      return snapshot;
    }, {});
  }

  function buildAuditFormStateKey(state, runtime, els) {
    return JSON.stringify({
      rulesTab: state.ui.rulesTab,
      editingHolidayId: runtime.editingHolidayId || "",
      editingFestivalId: runtime.editingFestivalId || "",
      holidayFormState: buildAuditEditorSnapshot(els, HOLIDAY_AUDIT_FORM_KEYS),
      festivalFormState: buildAuditEditorSnapshot(els, FESTIVAL_AUDIT_FORM_KEYS),
    });
  }

  function buildAuditRenderKey({ state, runtime, els, ctx, model }) {
    return JSON.stringify({
      profileId: state.profileId,
      displayedYear: model?.year,
      displayedMonth: model?.monthIndex,
      displayedMonthLength: model?.monthLength,
      auditScope: state.ui.auditScope,
      auditKind: state.ui.auditKind,
      holidayCategoryFilters: normalizeHolidayCategoryFilters(state.ui.holidayCategoryFilters),
      holidays: state.ui.holidays,
      festivals: state.ui.festivalRules,
      intercalaryPeriods: state.ui.intercalaryPeriods,
      workCycles: state.ui.workCycles,
      leapRules: state.ui.leapRules,
      inputs: state.inputs,
      dayNames: state.ui.dayNames,
      monthNames: state.ui.monthNames,
      weekNames: state.ui.weekNames,
      yearDisplayMode: state.ui.yearDisplayMode,
      yearOffset: state.ui.yearOffset,
      yearPrefix: state.ui.yearPrefix,
      yearSuffix: state.ui.yearSuffix,
      preCalendarStartYear: state.ui.preCalendarStartYear,
      eras: state.ui.eras,
      workWeekendRule: state.ui.workWeekendRule,
      astronomy: state.ui.astronomy,
      monthLengthOverridesEnabled: !!state.ui.monthLengthOverridesEnabled,
      monthLengthOverrides: state.ui.monthLengthOverrides,
      startDayOfYear: state.ui.startDayOfYear,
      weekStartsOn: state.ui.weekStartsOn,
      rulesTab: state.ui.rulesTab,
      formState: buildAuditFormStateKey(state, runtime, els),
      metrics: {
        monthsPerYear: ctx?.metrics?.monthsPerYear,
        daysPerWeek: ctx?.metrics?.daysPerWeek,
      },
    });
  }

  function buildAuditRowNode(entry, formatYearLabel, currentModel) {
    const yearLabel =
      typeof formatYearLabel === "function"
        ? formatYearLabel(Math.max(1, I(entry?.year, 1)))
        : `Year ${Math.max(1, I(entry?.year, 1))}`;
    const sameVisibleMonth =
      Math.max(1, I(entry?.year, 1)) === Math.max(1, I(currentModel?.year, 1)) &&
      Math.max(0, I(entry?.monthIndex, 0)) === Math.max(0, I(currentModel?.monthIndex, 0));
    const action =
      Number.isFinite(Number(entry?.year)) && Number.isFinite(Number(entry?.monthIndex))
        ? actionButton(
            sameVisibleMonth && Number.isFinite(Number(entry?.absoluteDay))
              ? "Trace day"
              : "Open & trace",
            { calAuditTrace: "1" },
            "small",
          )
        : null;
    if (action) {
      action.dataset.calAuditYear = String(Math.max(1, I(entry?.year, 1)));
      action.dataset.calAuditMonth = String(Math.max(0, I(entry?.monthIndex, 0)));
      action.dataset.calAuditDay = String(Math.max(1, I(entry?.focusDay ?? 1, 1)));
      if (Number.isFinite(Number(entry?.absoluteDay))) {
        action.dataset.calAuditAbsoluteDay = String(Math.max(0, I(entry.absoluteDay, 0)));
      }
    }
    return createElement("div", { className: "calendar-audit-row" }, [
      createElement("div", { className: "calendar-audit-row__main" }, [
        createElement("div", { className: "calendar-audit-row__title" }, [
          createElement("span", {
            className: `calendar-audit-kind calendar-audit-kind--${String(entry?.kind || "entry")}`,
            text: auditKindLabel(entry?.kind),
          }),
          createElement("span", {
            className: "calendar-audit-row__name",
            text: String(entry?.title || "Entry"),
          }),
        ]),
        createElement("div", {
          className: "calendar-audit-row__meta",
          text: `${yearLabel} | ${String(entry?.locationLabel || "Current view")}`,
        }),
        entry?.summary
          ? createElement("div", {
              className: "calendar-audit-row__detail",
              text: String(entry.summary),
            })
          : null,
      ]),
      action ? createElement("div", { className: "calendar-audit-row__actions" }, [action]) : null,
    ]);
  }

  function buildRulePreviewContent({ preview, previewResult, formatYearLabel, currentModel }) {
    if (!preview) {
      return [
        createElement("div", { className: "calendar-audit-preview__title" }, [
          "Rule preview ",
          tipIconNode(TIPS["Rule preview"] || ""),
        ]),
        hintNode("Start editing a holiday or festival rule to preview upcoming resolved matches."),
      ];
    }

    const summaryText =
      preview.type === "festival"
        ? festivalSummary(preview.draft, preview.ctx)
        : holidaySummary(preview.draft, preview.ctx);
    const previewEntries = Array.isArray(previewResult?.entries) ? previewResult.entries : [];
    const scannedMonths = Math.max(0, I(previewResult?.scannedMonths, 0));

    return [
      createElement("div", { className: "calendar-audit-preview__title" }, [
        `${preview.type === "festival" ? "Festival" : "Holiday"} preview `,
        tipIconNode(TIPS["Rule preview"] || ""),
      ]),
      createElement("div", {
        className: "calendar-audit-preview__summary",
        text: summaryText,
      }),
      preview.issue
        ? createElement("div", {
            className: "calendar-audit-preview__issue",
            text: `Current rule issue: ${preview.issue}`,
          })
        : previewEntries.length
          ? createElement("div", {
              className: "calendar-audit-preview__hint",
              text: "Next resolved occurrences for this draft:",
            })
          : createElement("div", {
              className: "calendar-audit-preview__hint",
              text: `No resolved matches found in the next ${scannedMonths} months.`,
            }),
      previewEntries.length
        ? createElement(
            "div",
            { className: "calendar-audit-list" },
            previewEntries.map((entry) => buildAuditRowNode(entry, formatYearLabel, currentModel)),
          )
        : null,
      previewEntries.length && previewResult?.truncated
        ? hintNode(`Showing the next ${previewEntries.length} occurrences.`)
        : null,
    ];
  }

  function buildAuditAgendaContent({ entries, truncated, formatYearLabel, currentModel }) {
    const summaryCounts = buildAuditSummaryCounts(entries);
    return [
      createElement("div", { className: "calendar-audit-agenda__label" }, [
        "Resolved agenda ",
        tipIconNode(TIPS["Rule audit"] || ""),
      ]),
      summaryCounts.length
        ? createElement(
            "div",
            { className: "calendar-audit-summary" },
            summaryCounts.map((entry) =>
              createElement("div", { className: "calendar-audit-chip" }, [
                createElement("b", { text: `${auditKindLabel(entry.kind)}:` }),
                " ",
                String(entry.count),
              ]),
            ),
          )
        : null,
      entries.length
        ? createElement(
            "div",
            { className: "calendar-audit-list" },
            entries.map((entry) => buildAuditRowNode(entry, formatYearLabel, currentModel)),
          )
        : hintNode("No resolved entries match the current audit scope and filter."),
      truncated
        ? hintNode(
            `Rendering is capped to the first ${CALENDAR_AUDIT_RENDER_LIMIT} entries for performance.`,
          )
        : null,
    ];
  }

  return {
    buildCalendarAuditEntries,
    buildRulePreviewEntries,
    pickActiveRulePreview,
    buildAuditRenderKey,
    buildRulePreviewContent,
    buildAuditAgendaContent,
  };
}
