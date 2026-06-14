import {
  __resetWorldStorageForTests,
  clearLastStorageError,
  clearStoredCurrentWorldData,
  clearStoredWorldData,
  clearStoredBackups,
  createStoredBackupSnapshot,
  createStoredBackup,
  deleteStoredBackup,
  flushWorldStorage,
  getLastStorageError,
  hasAnyStoredDataSync,
  hasStoredWorldDataSync,
  listStoredBackupsSync,
  readStoredBackupRawSync,
  readStoredWorldRawSync,
  restoreStoredBackup,
  setStoredWorldRaw,
  waitForWorldStorageReady,
} from "../worldStorage.js";

const WORLD_CHANGED_EVENT = "worldsmith:worldChanged";
const GUIDED_SESSION_STORAGE_PREFIX = "worldsmith.guidedCreation.session.";
const GUIDED_LAUNCH_SESSION_KEY = "worldsmith.guidedCreation.launch";

let volatileWorldRaw = null;
let volatileWorldRevision = 0;

function setVolatileWorldRaw(raw) {
  volatileWorldRaw = typeof raw === "string" && raw ? raw : null;
  volatileWorldRevision += 1;
  return volatileWorldRevision;
}

function restoreVolatileWorldRawIfUnchanged(revision) {
  if (revision !== volatileWorldRevision) return false;
  setVolatileWorldRaw(readStoredWorldRawSync().raw);
  return true;
}

function dispatchWorldChanged() {
  try {
    window.dispatchEvent(new CustomEvent(WORLD_CHANGED_EVENT));
  } catch {}
}

function clearLegacyWorldsmithLocalStorageKeys() {
  try {
    if (typeof localStorage?.length !== "number" || typeof localStorage?.key !== "function") return;
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && String(key).startsWith("worldsmith.")) toRemove.push(key);
    }
    for (const key of toRemove) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  } catch {}
}

export function clearOwnedSessionStorageKeys() {
  try {
    if (
      typeof sessionStorage?.length !== "number" ||
      typeof sessionStorage?.key !== "function" ||
      typeof sessionStorage?.removeItem !== "function"
    ) {
      return 0;
    }

    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      if (
        key === GUIDED_LAUNCH_SESSION_KEY ||
        String(key).startsWith(GUIDED_SESSION_STORAGE_PREFIX)
      ) {
        toRemove.push(key);
      }
    }

    let removedCount = 0;
    for (const key of toRemove) {
      try {
        sessionStorage.removeItem(key);
        removedCount += 1;
      } catch {}
    }
    return removedCount;
  } catch {
    return 0;
  }
}

export function hasSavedWorldInLocalStorage() {
  return hasStoredWorldDataSync();
}

export function hasAnySavedData() {
  return hasAnyStoredDataSync();
}

export function waitForStorageReady() {
  return waitForWorldStorageReady();
}

export function flushStorage() {
  return flushWorldStorage();
}

export function readWorldRaw() {
  const stored = readStoredWorldRawSync();
  if (stored.raw) return stored;
  if (volatileWorldRaw) return { raw: volatileWorldRaw, sourceKey: "memory" };
  return { raw: null, sourceKey: null };
}

export function saveWorldRaw(raw, options = {}) {
  setVolatileWorldRaw(raw);
  void setStoredWorldRaw(raw, { immediate: options.immediate === true });
  dispatchWorldChanged();
  return true;
}

export function getStorageError() {
  return getLastStorageError();
}

export function clearStorageError() {
  return clearLastStorageError();
}

export function listBackups() {
  return listStoredBackupsSync();
}

export function readBackupRaw(id) {
  return readStoredBackupRawSync(id);
}

export function createBackup(maxKeep = 5, metadata = {}) {
  return createStoredBackup(maxKeep, metadata);
}

export function createBackupFromRaw(raw, maxKeep = 5, metadata = {}) {
  return createStoredBackupSnapshot(raw, maxKeep, metadata);
}

export function deleteBackup(id) {
  return deleteStoredBackup(id);
}

export async function clearBackups() {
  const result = clearStoredBackups();
  await flushWorldStorage();
  return result;
}

export function restoreBackup(id) {
  const restored = restoreStoredBackup(id);
  if (!restored) return false;
  setVolatileWorldRaw(readStoredWorldRawSync().raw);
  dispatchWorldChanged();
  return true;
}

export async function clearAllSavedData() {
  const clearRevision = setVolatileWorldRaw(null);
  const result = await clearStoredWorldData();
  if (!result?.ok) {
    restoreVolatileWorldRawIfUnchanged(clearRevision);
    return result;
  }
  const shouldClearLegacyKeys = clearRevision === volatileWorldRevision;
  if (shouldClearLegacyKeys) {
    clearLegacyWorldsmithLocalStorageKeys();
  }
  const clearedSessionStorageCount = shouldClearLegacyKeys ? clearOwnedSessionStorageKeys() : 0;
  dispatchWorldChanged();
  return {
    ...result,
    clearedSessionStorageCount,
  };
}

export async function clearCurrentSavedWorld() {
  const clearRevision = setVolatileWorldRaw(null);
  const result = await clearStoredCurrentWorldData();
  if (result?.ok) {
    dispatchWorldChanged();
  } else {
    restoreVolatileWorldRawIfUnchanged(clearRevision);
  }
  return result;
}

export async function resetStorePersistenceForTests(options = {}) {
  setVolatileWorldRaw(null);
  await __resetWorldStorageForTests(options);
}
