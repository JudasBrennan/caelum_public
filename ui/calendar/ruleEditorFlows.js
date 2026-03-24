import { normalizeLeapRules } from "../../engine/usableCalendar.js";
import { HOLIDAY_ANCHOR_TYPES, HOLIDAY_RELATIVE_MARKERS } from "./constants.js";
import {
  intListText,
  normFestivalRule,
  normFestivalRules,
  normHolidayRule,
  normHolidayRules,
  normalizeHolidayCategory,
  normalizeHolidayColorTag,
  normalizeWeekendDayIndexes,
  normalizeWeekendRule,
  normWorkCycleRule,
  normWorkCycleRules,
  parseIntList,
  parseStringList,
  sanitizeCycleShort,
} from "./stateModel.js";

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createCalendarRuleEditorFlows({
  wrap,
  state,
  els,
  runtime,
  render,
  buildContext,
  loadWorld,
  recommendLeapRuleFromOrbit,
  setLeapStatus,
  I,
  clampI,
}) {
  function updateHolidayEnables() {
    const oneOff = els.holidayRecurrence.value === "one-off";
    const useRelative = !!els.holidayUseRelative.checked;
    const useAdvanced = !!els.holidayAdvancedToggle.checked;
    state.ui.holidayAdvanced = useAdvanced;
    wrap.querySelectorAll(".calendar-holiday-advanced").forEach((row) => {
      row.hidden = !useAdvanced;
    });
    if (oneOff && !useRelative) {
      els.holidayUseDate.checked = true;
    }
    if (useRelative) {
      els.holidayUseDate.checked = false;
      els.holidayUseWeekday.checked = false;
      els.holidayUseMoon.checked = false;
    }
    els.holidayUseDate.disabled = oneOff || useRelative;
    els.holidayUseWeekday.disabled = useRelative;
    els.holidayUseMoon.disabled = useRelative;
    els.holidayDayOfMonth.disabled = useRelative || !els.holidayUseDate.checked;
    els.holidayDuration.disabled = false;
    els.holidayWeekday.disabled = useRelative || !els.holidayUseWeekday.checked;
    els.holidayOccurrence.disabled = useRelative || !els.holidayUseWeekday.checked;
    els.holidayMoonSlot.disabled = useRelative || !els.holidayUseMoon.checked;
    els.holidayMoonPhase.disabled = useRelative || !els.holidayUseMoon.checked;
    els.holidayRelativeType.disabled = !useRelative;
    els.holidayRelativeOffset.disabled = !useRelative;

    const relativeType = String(els.holidayRelativeType.value || "none");
    const usesMoonRelative = useRelative && relativeType === "moon-phase";
    const usesMarkerRelative = useRelative && relativeType === "astronomy-marker";
    const usesHolidayRelative = useRelative && relativeType === "holiday";
    els.holidayRelativeMoonSlot.disabled = !usesMoonRelative;
    els.holidayRelativeMoonPhase.disabled = !usesMoonRelative;
    els.holidayRelativeMarker.disabled = !usesMarkerRelative;
    els.holidayRelativeHoliday.disabled = !usesHolidayRelative;
    els.holidayYear.disabled = !oneOff;

    const anchorType = String(els.holidayAnchorType.value || "fixed-date");
    const anchorUsesMoon = useAdvanced && anchorType === "moon-phase";
    const anchorUsesMarker = useAdvanced && anchorType === "astronomy-marker";
    const anchorUsesHoliday = useAdvanced && anchorType === "holiday";
    const anchorUsesAlgorithm = useAdvanced && anchorType === "algorithmic";
    const conflictScope = String(els.holidayConflictScope.value || "all");

    els.holidayAnchorType.disabled = !useAdvanced;
    els.holidayAlgorithm.disabled = !anchorUsesAlgorithm;
    els.holidayAnchorMoonSlot.disabled = !anchorUsesMoon;
    els.holidayAnchorMoonPhase.disabled = !anchorUsesMoon;
    els.holidayAnchorMarker.disabled = !anchorUsesMarker;
    els.holidayAnchorHoliday.disabled = !anchorUsesHoliday;
    els.holidayAnchorOffset.disabled = !useAdvanced;
    els.holidayConflictRule.disabled = !useAdvanced;
    els.holidayMaxShiftDays.disabled = !useAdvanced;
    els.holidayStayInMonth.disabled = !useAdvanced;
    els.holidayConflictScope.disabled = !useAdvanced;
    els.holidayConflictCategories.disabled = !useAdvanced || conflictScope !== "category";
    els.holidayConflictHolidayIds.disabled = !useAdvanced || conflictScope !== "ids";
  }

  function resetHolidayForm() {
    runtime.editingHolidayId = null;
    els.holidayName.value = "";
    els.holidayCategory.value = "civic";
    els.holidayColorTag.value = "gold";
    els.holidayRecurrence.value = "yearly";
    els.holidayYear.value = String(Math.max(1, I(state.ui.year, 1)));
    els.holidayUseDate.checked = true;
    els.holidayUseWeekday.checked = false;
    els.holidayUseMoon.checked = false;
    els.holidayUseRelative.checked = false;
    els.holidayRelativeType.value = "none";
    els.holidayRelativeOffset.value = "0";
    els.holidayRelativeMoonSlot.value = "0";
    els.holidayRelativeMoonPhase.value = "F";
    els.holidayRelativeMarker.value = HOLIDAY_RELATIVE_MARKERS[0]?.[0] || "vernal-equinox";
    els.holidayRelativeHoliday.value = "";
    els.holidayAnchorType.value = "fixed-date";
    els.holidayAlgorithm.value = "none";
    els.holidayAnchorMoonSlot.value = "0";
    els.holidayAnchorMoonPhase.value = "F";
    els.holidayAnchorMarker.value = HOLIDAY_RELATIVE_MARKERS[0]?.[0] || "vernal-equinox";
    els.holidayAnchorHoliday.value = "";
    els.holidayAnchorOffset.value = "0";
    els.holidayConflictRule.value = "merge";
    els.holidayMaxShiftDays.value = "7";
    els.holidayStayInMonth.checked = false;
    els.holidayConflictScope.value = "all";
    els.holidayConflictCategories.value = "";
    els.holidayConflictHolidayIds.value = "";
    els.holidayDayOfMonth.value = "1";
    els.holidayDuration.value = "1";
    els.holidayPriority.value = "0";
    els.holidayMergeMode.value = "merge";
    els.holidayOccurrence.value = "any";
    els.holidayMoonPhase.value = "F";
    els.holidayExceptYears.value = "";
    els.holidayExceptMonths.value = "";
    els.holidayExceptDays.value = "";
    els.holidaySave.textContent = "Add holiday";
    els.holidayCancel.style.display = "none";
    els.holidayAdvancedToggle.checked = !!state.ui.holidayAdvanced;
    updateHolidayEnables();
  }

  function updateFestivalEnables() {
    const oneOff = els.festivalRecurrence.value === "one-off";
    els.festivalYear.disabled = !oneOff;
  }

  function resetFestivalForm() {
    runtime.editingFestivalId = null;
    els.festivalName.value = "";
    els.festivalRecurrence.value = "yearly";
    els.festivalYear.value = String(Math.max(1, I(state.ui.year, 1)));
    els.festivalStartMonth.value = String(Math.max(0, I(state.ui.monthIndex, 0)));
    els.festivalAfterDay.value = "0";
    els.festivalDuration.value = "1";
    els.festivalOutsideWeek.checked = false;
    els.festivalSave.textContent = "Add festival";
    els.festivalCancel.style.display = "none";
    updateFestivalEnables();
  }

  function updateCycleEnables() {
    const mode = String(els.cycleMode.value || "duty");
    const isDuty = mode === "duty";
    els.cycleOnDays.disabled = !isDuty;
    els.cycleOffDays.disabled = !isDuty;
    els.cycleActiveLabel.disabled = !isDuty;
    els.cycleRestLabel.disabled = !isDuty;
    els.cycleActiveShort.disabled = !isDuty;
    els.cycleRestShort.disabled = !isDuty;
    els.cycleIntervalDays.disabled = isDuty;
    els.cycleMarkerLabel.disabled = isDuty;
    els.cycleMarkerShort.disabled = isDuty;
  }

  function resetCycleForm() {
    runtime.editingCycleId = null;
    els.cycleName.value = "";
    els.cycleMode.value = "duty";
    els.cycleStartDay.value = "0";
    els.cycleOnDays.value = "6";
    els.cycleOffDays.value = "1";
    els.cycleIntervalDays.value = "5";
    els.cycleActiveLabel.value = "Work";
    els.cycleRestLabel.value = "Rest";
    els.cycleMarkerLabel.value = "Market";
    els.cycleActiveShort.value = "W";
    els.cycleRestShort.value = "R";
    els.cycleMarkerShort.value = "M";
    els.cycleSave.textContent = "Add cycle rule";
    els.cycleCancel.style.display = "none";
    updateCycleEnables();
  }

  function buildHolidayDraft(ctx) {
    const recurrence = els.holidayRecurrence.value;
    const oneOff = recurrence === "one-off";
    const useRelative = !!els.holidayUseRelative.checked;
    const relativeType = String(els.holidayRelativeType.value || "none");
    const useAdvanced = !!els.holidayAdvancedToggle.checked;
    const anchorType = String(els.holidayAnchorType.value || "fixed-date");
    const relativeAnchorType =
      !useAdvanced && useRelative && relativeType !== "none"
        ? relativeType === "moon-phase"
          ? "moon-phase"
          : relativeType === "astronomy-marker"
            ? "astronomy-marker"
            : relativeType === "holiday"
              ? "holiday"
              : "fixed-date"
        : anchorType;
    const anchorMoonSlot = Math.max(0, I(els.holidayAnchorMoonSlot.value, 0));
    const anchorMoonId = els.holidayAnchorMoonSlot.selectedOptions?.[0]?.dataset?.moonId || "";
    const anchorMoonPhase = String(els.holidayAnchorMoonPhase.value || "F");
    const anchorMarker = String(els.holidayAnchorMarker.value || "").trim();
    const anchorHoliday = String(els.holidayAnchorHoliday.value || "").trim();
    const relativeMoonSlot = Math.max(0, I(els.holidayRelativeMoonSlot.value, 0));
    const relativeMoonId = els.holidayRelativeMoonSlot.selectedOptions?.[0]?.dataset?.moonId || "";
    const relativeMoonPhase = String(els.holidayRelativeMoonPhase.value || "F");
    const relativeMarker = String(els.holidayRelativeMarker.value || "").trim();
    const relativeHoliday = String(els.holidayRelativeHoliday.value || "").trim();
    const draft = {
      id: runtime.editingHolidayId || createId("holiday"),
      name: String(els.holidayName.value || "").trim(),
      category: normalizeHolidayCategory(els.holidayCategory.value),
      colorTag: normalizeHolidayColorTag(els.holidayColorTag.value),
      recurrence,
      startMonth: Math.max(0, I(els.holidayStartMonth.value, 0)),
      year: Math.max(1, I(els.holidayYear.value, state.ui.year)),
      attrs: {
        useDate: useRelative ? false : oneOff ? true : !!els.holidayUseDate.checked,
        useWeekday: useRelative ? false : !!els.holidayUseWeekday.checked,
        useMoonPhase: useRelative ? false : !!els.holidayUseMoon.checked,
      },
      dayOfMonth: Math.max(1, I(els.holidayDayOfMonth.value, 1)),
      durationDays: Math.max(1, I(els.holidayDuration.value, 1)),
      priority: I(els.holidayPriority.value, 0),
      mergeMode: els.holidayMergeMode.value,
      weekday: Math.max(0, I(els.holidayWeekday.value, 0)),
      occurrence: els.holidayOccurrence.value,
      moonSlot: Math.max(0, I(els.holidayMoonSlot.value, 0)),
      moonId: els.holidayMoonSlot.selectedOptions?.[0]?.dataset?.moonId || "",
      moonPhase: els.holidayMoonPhase.value,
      relative: {
        enabled: useRelative && relativeType !== "none",
        type: relativeType,
        offsetDays: I(els.holidayRelativeOffset.value, 0),
        moonSlot: relativeMoonSlot,
        moonId: relativeMoonId,
        moonPhase: relativeMoonPhase,
        markerKey: relativeMarker,
        holidayId: relativeHoliday,
      },
      anchor: {
        type: HOLIDAY_ANCHOR_TYPES.some(([value]) => value === relativeAnchorType)
          ? relativeAnchorType
          : "fixed-date",
        algorithmKey: String(els.holidayAlgorithm.value || "none"),
        moonSlot: !useAdvanced && useRelative ? relativeMoonSlot : anchorMoonSlot,
        moonId: !useAdvanced && useRelative ? relativeMoonId : anchorMoonId,
        moonPhase: !useAdvanced && useRelative ? relativeMoonPhase : anchorMoonPhase,
        markerKey: !useAdvanced && useRelative ? relativeMarker : anchorMarker,
        holidayId: !useAdvanced && useRelative ? relativeHoliday : anchorHoliday,
      },
      offsetDays: useAdvanced
        ? I(els.holidayAnchorOffset.value, 0)
        : useRelative && relativeType !== "none"
          ? I(els.holidayRelativeOffset.value, 0)
          : 0,
      observance: {
        weekendRule: normalizeWeekendRule(state.ui.workWeekendRule),
        holidayConflictRule: String(els.holidayConflictRule.value || "merge"),
        maxShiftDays: Math.max(0, I(els.holidayMaxShiftDays.value, 7)),
        stayInMonth: !!els.holidayStayInMonth.checked,
      },
      conflictScope: {
        appliesAgainst: String(els.holidayConflictScope.value || "all"),
        categories: parseStringList(els.holidayConflictCategories.value),
        holidayIds: parseStringList(els.holidayConflictHolidayIds.value),
      },
      exceptYears: parseIntList(els.holidayExceptYears.value, 1, 1000000),
      exceptMonths: parseIntList(els.holidayExceptMonths.value, 1, ctx.metrics.monthsPerYear),
      exceptDays: parseIntList(els.holidayExceptDays.value, 1, 500),
    };
    state.ui.holidayAdvanced = useAdvanced;
    if (
      !draft.relative.enabled &&
      !draft.attrs.useDate &&
      !draft.attrs.useWeekday &&
      !draft.attrs.useMoonPhase
    ) {
      draft.attrs.useDate = true;
    }
    return draft;
  }

  function loadHolidayIntoForm(holiday) {
    runtime.editingHolidayId = holiday.id;
    els.holidayName.value = holiday.name;
    els.holidayCategory.value = normalizeHolidayCategory(holiday.category);
    els.holidayColorTag.value = normalizeHolidayColorTag(holiday.colorTag);
    els.holidayRecurrence.value = holiday.recurrence;
    els.holidayStartMonth.value = String(holiday.startMonth);
    els.holidayYear.value = String(Math.max(1, I(holiday.year, 1)));
    els.holidayUseDate.checked = !!holiday.attrs.useDate;
    els.holidayUseWeekday.checked = !!holiday.attrs.useWeekday;
    els.holidayUseMoon.checked = !!holiday.attrs.useMoonPhase;
    els.holidayUseRelative.checked = !!holiday.relative?.enabled;
    els.holidayRelativeType.value = holiday.relative?.type || "none";
    els.holidayRelativeOffset.value = String(I(holiday.relative?.offsetDays, 0));
    els.holidayRelativeMoonSlot.value = String(clampI(holiday.relative?.moonSlot ?? 0, 0, 3));
    els.holidayRelativeMoonPhase.value = String(holiday.relative?.moonPhase || "F");
    els.holidayRelativeMarker.value = String(
      holiday.relative?.markerKey || HOLIDAY_RELATIVE_MARKERS[0]?.[0] || "vernal-equinox",
    );
    els.holidayRelativeHoliday.value = String(holiday.relative?.holidayId || "");
    els.holidayAnchorType.value = String(holiday.anchor?.type || "fixed-date");
    els.holidayAlgorithm.value = String(holiday.anchor?.algorithmKey || "none");
    els.holidayAnchorMoonSlot.value = String(clampI(holiday.anchor?.moonSlot ?? 0, 0, 3));
    els.holidayAnchorMoonPhase.value = String(holiday.anchor?.moonPhase || "F");
    els.holidayAnchorMarker.value = String(
      holiday.anchor?.markerKey || HOLIDAY_RELATIVE_MARKERS[0]?.[0] || "vernal-equinox",
    );
    els.holidayAnchorHoliday.value = String(holiday.anchor?.holidayId || "");
    els.holidayAnchorOffset.value = String(
      I(holiday.offsetDays, I(holiday.relative?.offsetDays, 0)),
    );
    els.holidayConflictRule.value = String(
      holiday.observance?.holidayConflictRule ||
        (String(holiday.mergeMode || "") === "override" ? "override" : "merge"),
    );
    els.holidayMaxShiftDays.value = String(Math.max(0, I(holiday.observance?.maxShiftDays, 7)));
    els.holidayStayInMonth.checked = !!holiday.observance?.stayInMonth;
    els.holidayConflictScope.value = String(holiday.conflictScope?.appliesAgainst || "all");
    els.holidayConflictCategories.value = (holiday.conflictScope?.categories || []).join(", ");
    els.holidayConflictHolidayIds.value = (holiday.conflictScope?.holidayIds || []).join(", ");
    els.holidayDayOfMonth.value = String(holiday.dayOfMonth);
    els.holidayDuration.value = String(Math.max(1, I(holiday.durationDays, 1)));
    els.holidayPriority.value = String(I(holiday.priority, 0));
    els.holidayMergeMode.value = holiday.mergeMode || "merge";
    els.holidayWeekday.value = String(holiday.weekday);
    els.holidayOccurrence.value = String(holiday.occurrence);
    els.holidayMoonSlot.value = String(holiday.moonSlot);
    els.holidayMoonPhase.value = String(holiday.moonPhase);
    els.holidayExceptYears.value = intListText(holiday.exceptYears);
    els.holidayExceptMonths.value = intListText(holiday.exceptMonths);
    els.holidayExceptDays.value = intListText(holiday.exceptDays);
    els.holidaySave.textContent = "Save holiday";
    els.holidayCancel.style.display = "";
    const hasAdvancedRule =
      String(holiday.anchor?.type || "fixed-date") !== "fixed-date" ||
      I(holiday.offsetDays, 0) !== 0 ||
      String(holiday.observance?.holidayConflictRule || "merge") !== "merge" ||
      !!holiday.observance?.stayInMonth ||
      String(holiday.conflictScope?.appliesAgainst || "all") !== "all" ||
      (Array.isArray(holiday.conflictScope?.holidayIds) &&
        holiday.conflictScope.holidayIds.length > 0) ||
      (Array.isArray(holiday.conflictScope?.categories) &&
        holiday.conflictScope.categories.length > 0);
    if (hasAdvancedRule) state.ui.holidayAdvanced = true;
    els.holidayAdvancedToggle.checked = !!state.ui.holidayAdvanced;
    updateHolidayEnables();
  }

  function buildFestivalDraft() {
    return {
      id: runtime.editingFestivalId || createId("festival"),
      name: String(els.festivalName.value || "").trim(),
      recurrence: els.festivalRecurrence.value,
      year: Math.max(1, I(els.festivalYear.value, state.ui.year)),
      startMonth: Math.max(0, I(els.festivalStartMonth.value, 0)),
      afterDay: Math.max(0, I(els.festivalAfterDay.value, 0)),
      durationDays: Math.max(1, I(els.festivalDuration.value, 1)),
      outsideWeekFlow: !!els.festivalOutsideWeek.checked,
    };
  }

  function loadFestivalIntoForm(festival, ctx) {
    runtime.editingFestivalId = festival.id;
    els.festivalName.value = festival.name;
    els.festivalRecurrence.value = festival.recurrence;
    els.festivalYear.value = String(Math.max(1, I(festival.year, 1)));
    els.festivalStartMonth.value = String(
      clampI(festival.startMonth, 0, ctx.metrics.monthsPerYear - 1),
    );
    els.festivalAfterDay.value = String(Math.max(0, I(festival.afterDay, 0)));
    els.festivalDuration.value = String(Math.max(1, I(festival.durationDays, 1)));
    els.festivalOutsideWeek.checked = !!festival.outsideWeekFlow;
    els.festivalSave.textContent = "Save festival";
    els.festivalCancel.style.display = "";
    updateFestivalEnables();
  }

  function buildCycleDraft() {
    return {
      id: runtime.editingCycleId || createId("cycle"),
      name: String(els.cycleName.value || "").trim(),
      mode: String(els.cycleMode.value || "duty"),
      startAbsoluteDay: Math.max(0, I(els.cycleStartDay.value, 0)),
      onDays: Math.max(1, I(els.cycleOnDays.value, 1)),
      offDays: Math.max(1, I(els.cycleOffDays.value, 1)),
      intervalDays: Math.max(1, I(els.cycleIntervalDays.value, 1)),
      activeLabel: String(els.cycleActiveLabel.value || "Work").trim() || "Work",
      restLabel: String(els.cycleRestLabel.value || "Rest").trim() || "Rest",
      intervalLabel: String(els.cycleMarkerLabel.value || "Marker").trim() || "Marker",
      activeShort: sanitizeCycleShort(els.cycleActiveShort.value, "W"),
      restShort: sanitizeCycleShort(els.cycleRestShort.value, "R"),
      intervalShort: sanitizeCycleShort(els.cycleMarkerShort.value, "M"),
    };
  }

  function loadCycleIntoForm(rule) {
    runtime.editingCycleId = rule.id;
    els.cycleName.value = String(rule.name || "");
    els.cycleMode.value = String(rule.mode || "duty");
    els.cycleStartDay.value = String(Math.max(0, I(rule.startAbsoluteDay, 0)));
    els.cycleOnDays.value = String(Math.max(1, I(rule.onDays, 1)));
    els.cycleOffDays.value = String(Math.max(1, I(rule.offDays, 1)));
    els.cycleIntervalDays.value = String(Math.max(1, I(rule.intervalDays, 1)));
    els.cycleActiveLabel.value = String(rule.activeLabel || "Work");
    els.cycleRestLabel.value = String(rule.restLabel || "Rest");
    els.cycleMarkerLabel.value = String(rule.intervalLabel || "Marker");
    els.cycleActiveShort.value = sanitizeCycleShort(rule.activeShort, "W");
    els.cycleRestShort.value = sanitizeCycleShort(rule.restShort, "R");
    els.cycleMarkerShort.value = sanitizeCycleShort(rule.intervalShort, "M");
    els.cycleSave.textContent = "Save cycle rule";
    els.cycleCancel.style.display = "";
    updateCycleEnables();
  }

  function bindRuleEditorEvents() {
    [
      els.holidayUseDate,
      els.holidayUseWeekday,
      els.holidayUseMoon,
      els.holidayUseRelative,
      els.holidayRelativeType,
      els.holidayAdvancedToggle,
      els.holidayAnchorType,
      els.holidayConflictScope,
      els.holidayRecurrence,
    ].forEach((el) => el.addEventListener("change", updateHolidayEnables));

    els.festivalRecurrence.addEventListener("change", updateFestivalEnables);
    els.cycleMode.addEventListener("change", updateCycleEnables);
    els.cycleWeekendRule.addEventListener("change", () => {
      state.ui.workWeekendRule = normalizeWeekendRule(els.cycleWeekendRule.value);
      render();
    });
    els.weekendDays.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-cal-weekend-day]");
      if (!input) return;
      const selected = [
        ...els.weekendDays.querySelectorAll("input[data-cal-weekend-day]:checked"),
      ].map((checkbox) => I(checkbox.getAttribute("data-cal-weekend-day"), 0));
      const daysPerWeek = Math.max(
        1,
        els.weekendDays.querySelectorAll("input[data-cal-weekend-day]").length,
      );
      state.ui.weekendDayIndexes = normalizeWeekendDayIndexes(selected, daysPerWeek);
      render();
    });

    els.holidaySave.addEventListener("click", () => {
      const ctx = buildContext(loadWorld(), state);
      const draft = buildHolidayDraft(ctx);
      if (!draft.name) return;
      const holiday = normHolidayRule(draft, 0, ctx.metrics.monthsPerYear);
      const list = normHolidayRules(state.ui.holidays, ctx.metrics.monthsPerYear);
      const index = list.findIndex((entry) => entry.id === holiday.id);
      if (index >= 0) list[index] = holiday;
      else list.push(holiday);
      state.ui.holidays = list;
      resetHolidayForm();
      render();
    });

    els.holidayCancel.addEventListener("click", () => {
      resetHolidayForm();
      render();
    });

    els.holidayList.addEventListener("click", (event) => {
      const editBtn = event.target.closest("button[data-cal-holiday-edit]");
      if (editBtn) {
        const id = editBtn.getAttribute("data-cal-holiday-edit");
        const ctx = buildContext(loadWorld(), state);
        const holiday = ctx.holidays.find((entry) => entry.id === id);
        if (!holiday) return;
        loadHolidayIntoForm(holiday);
        return;
      }
      const delBtn = event.target.closest("button[data-cal-holiday-del]");
      if (!delBtn) return;
      const id = delBtn.getAttribute("data-cal-holiday-del");
      state.ui.holidays = (Array.isArray(state.ui.holidays) ? state.ui.holidays : []).filter(
        (entry) => String(entry?.id) !== String(id),
      );
      if (runtime.editingHolidayId === id) resetHolidayForm();
      render();
    });

    els.festivalSave.addEventListener("click", () => {
      const ctx = buildContext(loadWorld(), state);
      const draft = buildFestivalDraft();
      if (!draft.name) return;
      const festival = normFestivalRule(draft, 0, ctx.metrics.monthsPerYear);
      const list = normFestivalRules(state.ui.festivalRules, ctx.metrics.monthsPerYear);
      const index = list.findIndex((entry) => entry.id === festival.id);
      if (index >= 0) list[index] = festival;
      else list.push(festival);
      state.ui.festivalRules = list;
      resetFestivalForm();
      render();
    });

    els.festivalCancel.addEventListener("click", () => {
      resetFestivalForm();
      render();
    });

    els.festivalList.addEventListener("click", (event) => {
      const editBtn = event.target.closest("button[data-cal-festival-edit]");
      if (editBtn) {
        const id = editBtn.getAttribute("data-cal-festival-edit");
        const ctx = buildContext(loadWorld(), state);
        const festival = ctx.festivals.find((entry) => entry.id === id);
        if (!festival) return;
        loadFestivalIntoForm(festival, ctx);
        return;
      }
      const delBtn = event.target.closest("button[data-cal-festival-del]");
      if (!delBtn) return;
      const id = delBtn.getAttribute("data-cal-festival-del");
      state.ui.festivalRules = (
        Array.isArray(state.ui.festivalRules) ? state.ui.festivalRules : []
      ).filter((entry) => String(entry?.id) !== String(id));
      if (runtime.editingFestivalId === id) resetFestivalForm();
      render();
    });

    els.cycleSave.addEventListener("click", () => {
      const draft = buildCycleDraft();
      if (!draft.name) return;
      const rule = normWorkCycleRule(draft, 0);
      const list = normWorkCycleRules(state.ui.workCycles);
      const index = list.findIndex((entry) => entry.id === rule.id);
      if (index >= 0) list[index] = rule;
      else list.push(rule);
      state.ui.workCycles = list;
      resetCycleForm();
      render();
    });

    els.cycleCancel.addEventListener("click", () => {
      resetCycleForm();
      render();
    });

    els.cycleList.addEventListener("click", (event) => {
      const editBtn = event.target.closest("button[data-cal-cycle-edit]");
      if (editBtn) {
        const id = editBtn.getAttribute("data-cal-cycle-edit");
        const list = normWorkCycleRules(state.ui.workCycles);
        const rule = list.find((entry) => String(entry.id) === String(id));
        if (!rule) return;
        loadCycleIntoForm(rule);
        return;
      }
      const delBtn = event.target.closest("button[data-cal-cycle-del]");
      if (!delBtn) return;
      const id = delBtn.getAttribute("data-cal-cycle-del");
      state.ui.workCycles = (Array.isArray(state.ui.workCycles) ? state.ui.workCycles : []).filter(
        (entry) => String(entry?.id) !== String(id),
      );
      if (runtime.editingCycleId === id) resetCycleForm();
      render();
    });

    els.leapAdd.addEventListener("click", () => {
      const ctx = buildContext(loadWorld(), state);
      const rule = {
        id: createId("leap"),
        name: String(els.leapName.value || "").trim() || "Leap Rule",
        cycleYears: clampI(els.leapCycle.value || 4, 1, 400),
        offsetYear: clampI(els.leapOffset.value || 1, 1, 400),
        monthIndex: clampI(els.leapMonth.value || 0, 0, ctx.metrics.monthsPerYear - 1),
        dayDelta: clampI(els.leapDelta.value || 1, -30, 30),
      };
      if (rule.dayDelta === 0) return;
      state.ui.leapRules = normalizeLeapRules(
        [...(Array.isArray(state.ui.leapRules) ? state.ui.leapRules : []), rule],
        ctx.metrics.monthsPerYear,
      );
      els.leapName.value = "";
      els.leapCycle.value = "";
      els.leapOffset.value = "";
      els.leapDelta.value = "";
      setLeapStatus("Leap rule added.", "ok");
      render();
    });

    els.leapSuggest.addEventListener("click", () => {
      const ctx = buildContext(loadWorld(), state);
      const suggestion = recommendLeapRuleFromOrbit(ctx);
      if (!suggestion?.ok) {
        setLeapStatus(suggestion?.message || "Could not compute a leap rule suggestion.", "warn");
        return;
      }

      const rule = {
        id: createId("leap"),
        name: suggestion.ruleName || "Recommended Leap Rule",
        cycleYears: Math.max(1, I(suggestion.cycleYears, 1)),
        offsetYear: 1,
        monthIndex: clampI(suggestion.monthIndex, 0, Math.max(0, ctx.metrics.monthsPerYear - 1)),
        dayDelta: clampI(suggestion.dayDelta, -30, 30),
      };
      if (!rule.dayDelta) {
        setLeapStatus("Suggested leap correction resolved to 0 days; no rule added.", "warn");
        return;
      }

      const existingRules = normalizeLeapRules(state.ui.leapRules, ctx.metrics.monthsPerYear);
      const duplicate = existingRules.some(
        (existingRule) =>
          existingRule.cycleYears === rule.cycleYears &&
          existingRule.offsetYear === rule.offsetYear &&
          existingRule.monthIndex === rule.monthIndex &&
          existingRule.dayDelta === rule.dayDelta,
      );
      if (duplicate) {
        setLeapStatus(
          `Recommended rule already exists: ${suggestion.message}`,
          suggestion.quality === "low" ? "warn" : "info",
        );
        return;
      }

      state.ui.leapRules = normalizeLeapRules([...existingRules, rule], ctx.metrics.monthsPerYear);
      render();
      els.leapName.value = rule.name;
      els.leapCycle.value = String(rule.cycleYears);
      els.leapOffset.value = String(rule.offsetYear);
      els.leapMonth.value = String(rule.monthIndex);
      els.leapDelta.value = String(rule.dayDelta);
      setLeapStatus(
        `Suggested and added: ${suggestion.message}`,
        suggestion.quality === "low" ? "warn" : "ok",
      );
    });

    els.leapList.addEventListener("click", (event) => {
      const delBtn = event.target.closest("button[data-cal-leap-del]");
      if (!delBtn) return;
      const id = delBtn.getAttribute("data-cal-leap-del");
      state.ui.leapRules = (Array.isArray(state.ui.leapRules) ? state.ui.leapRules : []).filter(
        (entry) => String(entry?.id) !== String(id),
      );
      render();
    });
  }

  return {
    bindRuleEditorEvents,
    resetCycleForm,
    resetFestivalForm,
    resetHolidayForm,
    updateCycleEnables,
    updateFestivalEnables,
    updateHolidayEnables,
  };
}
