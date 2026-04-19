export function createCalendarProfileState({
  state,
  runtime,
  loadWorld,
  normalizeSingleProfile,
  clonePlain,
}) {
  function resetRuleEditors() {
    if (typeof runtime?.resetRuleEditors === "function") {
      runtime.resetRuleEditors();
      return;
    }
    runtime.editingHolidayId = null;
    runtime.editingFestivalId = null;
    runtime.editingIntercalaryId = null;
    runtime.editingCycleId = null;
  }

  function syncProfileSummaries() {
    state.profiles = state._allProfiles.map((profile) => ({
      id: String(profile.id),
      name: String(profile.name || "Calendar"),
    }));
  }

  function ensureProfileStore() {
    if (!Array.isArray(state._allProfiles) || !state._allProfiles.length) {
      const id = String(state.profileId || "cal-1");
      const name =
        String(state.profileName || state.ui?.calendarName || "Calendar").trim() || "Calendar";
      const world = loadWorld();
      const normalized = normalizeSingleProfile(world, {
        inputs: state.inputs,
        ui: state.ui,
      });
      state._allProfiles = [{ id, name, ...normalized }];
      state.profileId = id;
      state.profileName = name;
    }
    syncProfileSummaries();
  }

  function saveActiveProfileSnapshot(world = loadWorld()) {
    ensureProfileStore();
    const activeId = String(state.profileId || state._allProfiles[0]?.id || "cal-1");
    const activeName =
      String(state.ui?.calendarName || state.profileName || "Calendar").trim() || "Calendar";
    const normalized = normalizeSingleProfile(world, { inputs: state.inputs, ui: state.ui });
    const snapshot = { id: activeId, name: activeName, ...normalized };
    const idx = state._allProfiles.findIndex((profile) => String(profile?.id) === activeId);
    if (idx >= 0) state._allProfiles[idx] = snapshot;
    else state._allProfiles.push(snapshot);
    state.profileName = activeName;
    syncProfileSummaries();
  }

  function activateProfile(profileId, { saveCurrent = true } = {}) {
    ensureProfileStore();
    const world = loadWorld();
    if (saveCurrent) saveActiveProfileSnapshot(world);
    const target = state._allProfiles.find((profile) => String(profile?.id) === String(profileId));
    if (!target) return;
    const normalized = normalizeSingleProfile(world, target);
    state.profileId = String(target.id);
    state.profileName = String(target.name || normalized.ui.calendarName || "Calendar");
    normalized.ui.calendarName = state.profileName;
    state.inputs = clonePlain(normalized.inputs);
    state.ui = clonePlain(normalized.ui);
    resetRuleEditors();
  }

  return {
    activateProfile,
    ensureProfileStore,
    saveActiveProfileSnapshot,
  };
}
