const GUIDED_SESSION_PREFIX = "worldsmith.guidedCreation.session.";

function sessionKey(objectType) {
  return `${GUIDED_SESSION_PREFIX}${String(objectType || "").trim()}`;
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map((entry) => sortObjectKeys(entry));
  if (!value || typeof value !== "object") return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectKeys(value[key]);
      return acc;
    }, {});
}

function normalizeObjectKey(value) {
  const text = String(value || "").trim();
  return text || "";
}

function normalizeAnswers(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...value };
}

function normalizeObjectMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return { ...value };
}

function normalizeSearchResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    ...value,
    compiledGoal: normalizeObjectMap(value.compiledGoal),
    recommendation:
      value.recommendation && typeof value.recommendation === "object"
        ? { ...value.recommendation }
        : null,
  };
}

function normalizeSession(objectType, value = {}) {
  const normalizedType = String(objectType || value?.objectType || "").trim();
  if (!normalizedType) return null;
  return {
    objectType: normalizedType,
    objectKey: normalizeObjectKey(value.objectKey),
    contextFingerprint: String(value.contextFingerprint || ""),
    uxMode: value.uxMode === "quick" ? "quick" : "guided",
    currentStepId: String(value.currentStepId || ""),
    selectedArchetypeId: String(value.selectedArchetypeId || ""),
    selectedGoalTemplateId: String(value.selectedGoalTemplateId || ""),
    answers: normalizeAnswers(value.answers),
    goalDraft: normalizeObjectMap(value.goalDraft),
    compiledGoal:
      value.compiledGoal && typeof value.compiledGoal === "object"
        ? { ...value.compiledGoal }
        : null,
    searchStatus: String(value.searchStatus || ""),
    lastSearchResult: normalizeSearchResult(value.lastSearchResult),
    lastSearchContextFingerprint: String(value.lastSearchContextFingerprint || ""),
    lastSearchEngineFingerprint: String(value.lastSearchEngineFingerprint || ""),
    routeMode: String(value.routeMode || ""),
    savedAt: Number.isFinite(Number(value.savedAt)) ? Number(value.savedAt) : Date.now(),
  };
}

export function createGuidedContextFingerprint(value) {
  try {
    return JSON.stringify(sortObjectKeys(value));
  } catch {
    return "";
  }
}

export function buildGuidedSessionSnapshot(flowState = {}, overrides = {}) {
  return {
    currentStepId: String(flowState.currentStepId || ""),
    selectedArchetypeId: String(flowState.selectedArchetypeId || ""),
    selectedGoalTemplateId: String(flowState.selectedGoalTemplateId || ""),
    answers: normalizeAnswers(flowState.answers),
    goalDraft: normalizeObjectMap(flowState.goalDraft),
    compiledGoal:
      flowState.compiledGoal && typeof flowState.compiledGoal === "object"
        ? { ...flowState.compiledGoal }
        : null,
    searchStatus: String(flowState.searchStatus || ""),
    lastSearchResult: normalizeSearchResult(flowState.lastSearchResult),
    lastSearchContextFingerprint: String(flowState.lastSearchContextFingerprint || ""),
    lastSearchEngineFingerprint: String(flowState.lastSearchEngineFingerprint || ""),
    ...overrides,
  };
}

export function saveGuidedSession(objectType, payload = {}) {
  const session = normalizeSession(objectType, {
    ...payload,
    savedAt: Date.now(),
  });
  if (!session) return false;
  try {
    sessionStorage.setItem(sessionKey(objectType), JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function loadGuidedSession(objectType, expected = {}) {
  try {
    const raw = sessionStorage.getItem(sessionKey(objectType));
    if (!raw) return null;
    const parsed = normalizeSession(objectType, JSON.parse(raw));
    if (!parsed) return null;
    const expectedObjectKey = normalizeObjectKey(expected.objectKey);
    if (expectedObjectKey && parsed.objectKey && parsed.objectKey !== expectedObjectKey) {
      clearGuidedSession(objectType);
      return null;
    }
    const expectedFingerprint = String(expected.contextFingerprint || "");
    if (
      expectedFingerprint &&
      parsed.contextFingerprint &&
      parsed.contextFingerprint !== expectedFingerprint
    ) {
      clearGuidedSession(objectType);
      return null;
    }
    return parsed;
  } catch {
    clearGuidedSession(objectType);
    return null;
  }
}

export function clearGuidedSession(objectType) {
  try {
    sessionStorage.removeItem(sessionKey(objectType));
    return true;
  } catch {
    return false;
  }
}
