import {
  applyWorldStorageIndexedDbBackupDelta,
  openWorldStorageDb,
  readWorldStorageIndexedDbState,
  resetWorldStorageIndexedDbForTests,
  writeWorldStorageIndexedDbBackups,
  writeWorldStorageIndexedDbCurrentRaw,
  writeWorldStorageIndexedDbState,
} from "./worldStorage/indexedDb.js";
import {
  buildLegacyBackupIndex,
  clearLegacyBackupEntries,
  LEGACY_BACKUP_PREFIX,
  LEGACY_BACKUPS_INDEX_KEY,
  LEGACY_FALLBACK_KEY,
  LEGACY_PRIMARY_KEY,
  readLegacyBackups,
  readLegacyCurrentWorld,
  removeLegacyPersistenceKeys,
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
} from "./worldStorage/legacyStorage.js";
import { createWorldStorageClearOperations } from "./worldStorage/clearOperations.js";
import { installWorldStorageLifecycleFlushHandlers } from "./worldStorage/lifecycle.js";

const STORAGE_DRIVER_KEY = "worldsmith.storage.driver";
const STORAGE_HAS_WORLD_KEY = "worldsmith.storage.hasWorld";
const STORAGE_MIGRATED_KEY = "worldsmith.storage.migrated.v1";
const STORAGE_LAST_SAVED_KEY = "worldsmith.storage.lastSavedUtc";

const SAVE_DEBOUNCE_MS = 180;
const BACKUP_METADATA_STRING_FIELDS = new Set(["label", "source", "worldName"]);

let storageReadyPromise = null;
let persistenceQueue = Promise.resolve();
let pendingWorldRaw = null;
let pendingWorldTimer = null;
let lastLifecycleFlushPromise = Promise.resolve();

let currentRawCache = null;
let currentSourceKey = null;
let backupsIndexCache = [];
let backupRawByIdCache = new Map();
let storageDriver = "memory";
let lastStorageError = null;
let clearStoredWorldDataInFlight = false;
let currentWorldMutationId = 0;

initializeStorage();

function emitStorageError(message, cause = null) {
  lastStorageError = {
    message: String(message || "Storage error"),
    cause: cause == null ? null : String(cause),
    detectedAt: new Date().toISOString(),
  };
  try {
    window.dispatchEvent(
      new CustomEvent("worldsmith:storageError", {
        detail: { ...lastStorageError },
      }),
    );
  } catch {
    // Ignore event failures.
  }
}

function markDriver(driver) {
  storageDriver = driver;
  safeLocalStorageSet(STORAGE_DRIVER_KEY, driver);
}

function markHasWorld(hasWorld) {
  safeLocalStorageSet(STORAGE_HAS_WORLD_KEY, hasWorld ? "1" : "0");
  if (hasWorld) safeLocalStorageSet(STORAGE_LAST_SAVED_KEY, new Date().toISOString());
  else safeLocalStorageRemove(STORAGE_LAST_SAVED_KEY);
}

function bootstrapLegacyCaches() {
  const legacyWorld = readLegacyCurrentWorld();
  if (legacyWorld.raw) {
    currentRawCache = legacyWorld.raw;
    currentSourceKey = legacyWorld.sourceKey;
  }
  const legacyBackups = readLegacyBackups();
  backupsIndexCache = legacyBackups.index;
  backupRawByIdCache = legacyBackups.rawById;
  markHasWorld(!!currentRawCache);
  if (currentRawCache || backupsIndexCache.length) {
    markDriver("localStorage");
  }
}

function initializeStorage() {
  bootstrapLegacyCaches();
  installWorldStorageLifecycleFlushHandlers(requestLifecycleFlush);
  storageReadyPromise = bootstrapStorage();
}

function requestLifecycleFlush() {
  lastLifecycleFlushPromise = flushWorldStorage().catch(() => {});
  return lastLifecycleFlushPromise;
}

function sanitizeBackupMetadata(metadata = null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const clean = {};
  for (const field of BACKUP_METADATA_STRING_FIELDS) {
    const value = String(metadata[field] ?? "").trim();
    if (value) clean[field] = value.slice(0, 160);
  }
  if (
    metadata.bodyCounts &&
    typeof metadata.bodyCounts === "object" &&
    !Array.isArray(metadata.bodyCounts)
  ) {
    const bodyCounts = {};
    for (const [key, value] of Object.entries(metadata.bodyCounts)) {
      const count = Number(value);
      if (!Number.isFinite(count) || count < 0) continue;
      bodyCounts[String(key).slice(0, 48)] = Math.trunc(count);
    }
    if (Object.keys(bodyCounts).length) clean.bodyCounts = bodyCounts;
  }
  const byteSize = Number(metadata.byteSize);
  if (Number.isFinite(byteSize) && byteSize >= 0) clean.byteSize = Math.trunc(byteSize);
  if (metadata.pinned === true) clean.pinned = true;
  return Object.keys(clean).length ? clean : null;
}

function normalizeBackupIndexEntry(backup = {}) {
  const id = String(backup?.id || "").trim();
  if (!id) return null;
  const createdUtc = String(backup?.createdUtc || "").trim() || new Date().toISOString();
  const metadata = sanitizeBackupMetadata(backup?.metadata);
  return metadata ? { id, createdUtc, metadata } : { id, createdUtc };
}

function setBackupCaches(backups) {
  backupsIndexCache = backups.map(normalizeBackupIndexEntry).filter(Boolean);
  backupRawByIdCache = new Map(backups.map(({ id, raw }) => [id, raw]));
}

function buildBackupRecordsFromCache() {
  return backupsIndexCache
    .map((backup) => ({
      ...backup,
      raw: backupRawByIdCache.get(backup.id) || null,
    }))
    .filter((backup) => backup.id && backup.raw);
}

async function migrateLegacyStateToIndexedDb(db) {
  if (!db) return false;
  const legacyWorld = readLegacyCurrentWorld();
  const legacyBackups = readLegacyBackups();
  if (!legacyWorld.raw && !legacyBackups.index.length) {
    markDriver("indexeddb");
    markHasWorld(false);
    safeLocalStorageSet(STORAGE_MIGRATED_KEY, "1");
    return true;
  }

  const backupRecords = legacyBackups.index
    .map((backup) => ({
      id: backup.id,
      createdUtc: backup.createdUtc,
      raw: legacyBackups.rawById.get(backup.id) || null,
    }))
    .filter((backup) => backup.id && backup.raw);

  try {
    await writeWorldStorageIndexedDbState(db, legacyWorld.raw, backupRecords);
    currentRawCache = legacyWorld.raw;
    currentSourceKey = legacyWorld.raw ? "indexeddb" : null;
    setBackupCaches(backupRecords);
    removeLegacyPersistenceKeys();
    safeLocalStorageSet(STORAGE_MIGRATED_KEY, "1");
    markDriver("indexeddb");
    markHasWorld(!!currentRawCache);
    return true;
  } catch (error) {
    emitStorageError(
      "Could not migrate existing local WorldSmith data into IndexedDB.",
      error?.message,
    );
    markDriver("localStorage");
    return false;
  }
}

async function bootstrapStorage() {
  const db = await openWorldStorageDb();
  if (!db) {
    markDriver(currentRawCache || backupsIndexCache.length ? "localStorage" : "memory");
    return;
  }

  const idbState = await readWorldStorageIndexedDbState(db);
  if (idbState.currentRaw || idbState.backups.length) {
    currentRawCache = idbState.currentRaw ?? currentRawCache;
    currentSourceKey = idbState.currentRaw ? "indexeddb" : currentSourceKey;
    setBackupCaches(idbState.backups);
    markDriver("indexeddb");
    markHasWorld(!!currentRawCache);
    if (safeLocalStorageGet(STORAGE_MIGRATED_KEY) !== "1") {
      removeLegacyPersistenceKeys();
      safeLocalStorageSet(STORAGE_MIGRATED_KEY, "1");
    }
    return;
  }

  const migrated = await migrateLegacyStateToIndexedDb(db);
  if (migrated) return;

  markDriver(currentRawCache || backupsIndexCache.length ? "localStorage" : "memory");
}

function queuePersistence(job) {
  persistenceQueue = persistenceQueue.then(job, job);
  return persistenceQueue;
}

async function persistCurrentRaw(raw) {
  const db = await openWorldStorageDb();
  if (db) {
    try {
      await writeWorldStorageIndexedDbCurrentRaw(db, raw);
      currentSourceKey = raw ? "indexeddb" : null;
      markDriver("indexeddb");
      markHasWorld(!!raw);
      return "indexeddb";
    } catch (error) {
      emitStorageError(
        "IndexedDB could not save the current world. Falling back to local storage.",
        error?.message,
      );
    }
  }

  const savedPrimary = raw
    ? safeLocalStorageSet(LEGACY_PRIMARY_KEY, raw)
    : safeLocalStorageRemove(LEGACY_PRIMARY_KEY);
  const savedLegacy = raw
    ? safeLocalStorageSet(LEGACY_FALLBACK_KEY, raw)
    : safeLocalStorageRemove(LEGACY_FALLBACK_KEY);
  if (savedPrimary || savedLegacy) {
    currentSourceKey = raw ? LEGACY_PRIMARY_KEY : null;
    markDriver("localStorage");
    markHasWorld(!!raw);
    return "localStorage";
  }

  markDriver("memory");
  markHasWorld(!!raw);
  emitStorageError(
    "Storage quota exceeded or unavailable. Changes are only kept for this session.",
    null,
  );
  return "memory";
}

function scheduleCurrentRawPersist(raw, { immediate = false } = {}) {
  currentWorldMutationId += 1;
  currentRawCache = typeof raw === "string" && raw ? raw : null;
  currentSourceKey = currentRawCache ? "memory-write" : null;
  markHasWorld(!!currentRawCache);
  pendingWorldRaw = currentRawCache;

  const flushJob = () => {
    const nextRaw = pendingWorldRaw;
    pendingWorldRaw = null;
    return queuePersistence(() => persistCurrentRaw(nextRaw));
  };

  if (pendingWorldTimer != null) {
    clearTimeout(pendingWorldTimer);
    pendingWorldTimer = null;
  }

  if (immediate) {
    return flushJob();
  }

  pendingWorldTimer = setTimeout(() => {
    pendingWorldTimer = null;
    flushJob();
  }, SAVE_DEBOUNCE_MS);
  return Promise.resolve(storageDriver);
}

function scheduleBackupPersist(change = null) {
  return queuePersistence(async () => {
    const db = await openWorldStorageDb();
    const backupRecords = buildBackupRecordsFromCache();
    const hasDelta =
      !!change &&
      (change.replaceAll === true ||
        (Array.isArray(change.upserts) && change.upserts.length > 0) ||
        (Array.isArray(change.removedIds) && change.removedIds.length > 0));
    if (db) {
      try {
        if (change?.replaceAll) {
          await writeWorldStorageIndexedDbBackups(db, backupRecords);
        } else if (hasDelta) {
          await applyWorldStorageIndexedDbBackupDelta(db, change);
        } else {
          await writeWorldStorageIndexedDbBackups(db, backupRecords);
        }
        markDriver("indexeddb");
        return "indexeddb";
      } catch (error) {
        emitStorageError("IndexedDB could not save backup history.", error?.message);
      }
    }

    const legacyIndex = buildLegacyBackupIndex(backupsIndexCache);
    const wroteIndex = legacyIndex.length
      ? safeLocalStorageSet(LEGACY_BACKUPS_INDEX_KEY, JSON.stringify(legacyIndex))
      : safeLocalStorageRemove(LEGACY_BACKUPS_INDEX_KEY);
    let wroteBackups = false;
    if (change?.replaceAll || !hasDelta) {
      for (const backup of backupRecords) {
        wroteBackups =
          safeLocalStorageSet(`${LEGACY_BACKUP_PREFIX}${backup.id}`, backup.raw) || wroteBackups;
      }
    } else {
      for (const backup of change.upserts || []) {
        const id = String(backup?.id || "").trim();
        if (!id || typeof backup?.raw !== "string" || !backup.raw) continue;
        wroteBackups =
          safeLocalStorageSet(`${LEGACY_BACKUP_PREFIX}${id}`, backup.raw) || wroteBackups;
      }
      for (const removedId of change.removedIds || []) {
        const id = String(removedId || "").trim();
        if (!id) continue;
        wroteBackups = safeLocalStorageRemove(`${LEGACY_BACKUP_PREFIX}${id}`) || wroteBackups;
      }
    }
    if (wroteIndex || wroteBackups) {
      markDriver("localStorage");
      return "localStorage";
    }
    return "memory";
  });
}

const worldStorageClearStateAccess = {
  read() {
    return {
      backupRawByIdCache,
      backupsIndexCache,
      clearStoredWorldDataInFlight,
      currentRawCache,
      currentSourceKey,
      currentWorldMutationId,
      lastLifecycleFlushPromise,
      lastStorageError,
      pendingWorldRaw,
      pendingWorldTimer,
      persistenceQueue,
      storageDriver,
      storageReadyPromise,
    };
  },
  setBackupRawByIdCache(value) {
    backupRawByIdCache = value;
  },
  setBackupsIndexCache(value) {
    backupsIndexCache = value;
  },
  setClearStoredWorldDataInFlight(value) {
    clearStoredWorldDataInFlight = value;
  },
  setCurrentRawCache(value) {
    currentRawCache = value;
  },
  setCurrentSourceKey(value) {
    currentSourceKey = value;
  },
  setCurrentWorldMutationId(value) {
    currentWorldMutationId = value;
  },
  setLastLifecycleFlushPromise(value) {
    lastLifecycleFlushPromise = value;
  },
  setLastStorageErrorValue(value) {
    lastStorageError = value;
  },
  setPendingWorldRaw(value) {
    pendingWorldRaw = value;
  },
  setPendingWorldTimer(value) {
    pendingWorldTimer = value;
  },
  setPersistenceQueue(value) {
    persistenceQueue = value;
  },
  setStorageDriverValue(value) {
    storageDriver = value;
  },
  setStorageReadyPromise(value) {
    storageReadyPromise = value;
  },
};

const {
  clearStoredCurrentWorldData: clearStoredCurrentWorldDataImpl,
  clearStoredWorldData: clearStoredWorldDataImpl,
  resetWorldStorageForTests,
} = createWorldStorageClearOperations({
  keys: {
    LEGACY_BACKUP_PREFIX,
    LEGACY_BACKUPS_INDEX_KEY,
    LEGACY_FALLBACK_KEY,
    LEGACY_PRIMARY_KEY,
    STORAGE_DRIVER_KEY,
    STORAGE_HAS_WORLD_KEY,
    STORAGE_LAST_SAVED_KEY,
    STORAGE_MIGRATED_KEY,
  },
  stateAccess: worldStorageClearStateAccess,
  buildBackupRecordsFromCache,
  initializeStorage,
  queuePersistence,
  scheduleCurrentRawPersist,
  markDriver,
  markHasWorld,
  emitStorageError,
  readLegacyCurrentWorld,
  openWorldStorageDb,
  writeWorldStorageIndexedDbCurrentRaw,
  writeWorldStorageIndexedDbState,
  resetWorldStorageIndexedDbForTests,
  clearLegacyBackupEntries,
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageSet,
});

export function readStoredWorldRawSync() {
  if (clearStoredWorldDataInFlight) {
    return { raw: null, sourceKey: null };
  }
  if (pendingWorldRaw) {
    return { raw: pendingWorldRaw, sourceKey: "pending-write" };
  }
  if (currentRawCache) {
    return { raw: currentRawCache, sourceKey: currentSourceKey || "cache" };
  }
  const legacy = readLegacyCurrentWorld();
  if (legacy.raw) {
    return legacy;
  }
  return { raw: null, sourceKey: null };
}

export function hasStoredWorldDataSync() {
  if (clearStoredWorldDataInFlight) return false;
  if (pendingWorldRaw || currentRawCache) return true;
  if (safeLocalStorageGet(STORAGE_HAS_WORLD_KEY) === "1") return true;
  const legacy = readLegacyCurrentWorld();
  return !!legacy.raw;
}

export function hasAnyStoredDataSync() {
  if (clearStoredWorldDataInFlight) return false;
  if (pendingWorldRaw || currentRawCache || backupsIndexCache.length) return true;
  if (safeLocalStorageGet(STORAGE_HAS_WORLD_KEY) === "1") return true;
  const legacy = readLegacyCurrentWorld();
  if (legacy.raw) return true;
  return readLegacyBackups().index.length > 0;
}

export function listStoredBackupsSync() {
  return backupsIndexCache.slice();
}

export function readStoredBackupRawSync(id) {
  return backupRawByIdCache.get(String(id || "").trim()) || null;
}

export function getWorldStorageDriver() {
  return storageDriver;
}

export function getLastStorageError() {
  return lastStorageError ? { ...lastStorageError } : null;
}

export function clearLastStorageError() {
  const hadError = !!lastStorageError;
  lastStorageError = null;
  return hadError;
}

export function setStoredWorldRaw(raw, options = {}) {
  return scheduleCurrentRawPersist(raw, { immediate: options.immediate === true });
}

export async function waitForWorldStorageReady() {
  await storageReadyPromise;
}

export async function flushWorldStorage() {
  if (pendingWorldTimer != null) {
    clearTimeout(pendingWorldTimer);
    pendingWorldTimer = null;
    await scheduleCurrentRawPersist(pendingWorldRaw, { immediate: true });
  }
  await persistenceQueue;
}

export async function clearStoredCurrentWorldData() {
  return clearStoredCurrentWorldDataImpl();
}

export async function __waitForLastStorageLifecycleFlushForTests() {
  await lastLifecycleFlushPromise;
}

function createStoredBackupFromRaw(raw, maxKeep = 5, metadata = {}) {
  if (!(typeof raw === "string" && raw)) return null;
  const id = `b${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdUtc = new Date().toISOString();
  const removedIds = [];
  const metadataWithSize = sanitizeBackupMetadata({
    ...metadata,
    byteSize: metadata?.byteSize ?? new Blob([raw]).size,
  });
  const backupIndexEntry = metadataWithSize
    ? { id, createdUtc, metadata: metadataWithSize }
    : { id, createdUtc };
  backupsIndexCache.unshift(backupIndexEntry);
  backupRawByIdCache.set(id, raw);

  const keepCount = Math.max(1, Math.trunc(Number(maxKeep) || 1));
  const pinned = backupsIndexCache.filter((backup) => backup.metadata?.pinned === true);
  const unpinned = backupsIndexCache.filter((backup) => backup.metadata?.pinned !== true);
  const retainedUnpinned = unpinned.slice(0, keepCount);
  const retainedIds = new Set([...pinned, ...retainedUnpinned].map((backup) => backup.id));
  for (const extra of backupsIndexCache.filter((backup) => !retainedIds.has(backup.id))) {
    removedIds.push(extra.id);
    backupRawByIdCache.delete(extra.id);
    safeLocalStorageRemove(`${LEGACY_BACKUP_PREFIX}${extra.id}`);
  }
  backupsIndexCache = backupsIndexCache.filter((backup) => retainedIds.has(backup.id));

  scheduleBackupPersist({
    upserts: [{ ...backupIndexEntry, raw }],
    removedIds,
  });
  return backupsIndexCache[0];
}

export function createStoredBackup(maxKeep = 5, metadata = {}) {
  const raw = pendingWorldRaw || currentRawCache || readLegacyCurrentWorld().raw;
  return createStoredBackupFromRaw(raw, maxKeep, metadata);
}

export function createStoredBackupSnapshot(raw, maxKeep = 5, metadata = {}) {
  return createStoredBackupFromRaw(raw, maxKeep, metadata);
}

export function deleteStoredBackup(id) {
  const backupId = String(id || "").trim();
  if (!backupId || !backupRawByIdCache.has(backupId)) return false;
  backupsIndexCache = backupsIndexCache.filter((backup) => backup.id !== backupId);
  backupRawByIdCache.delete(backupId);
  safeLocalStorageRemove(`${LEGACY_BACKUP_PREFIX}${backupId}`);
  scheduleBackupPersist({ removedIds: [backupId] });
  return true;
}

export function clearStoredBackups() {
  const removedIds = backupsIndexCache.map((backup) => backup.id).filter(Boolean);
  const removedCount = removedIds.length;
  backupsIndexCache = [];
  backupRawByIdCache = new Map();
  for (const id of removedIds) {
    safeLocalStorageRemove(`${LEGACY_BACKUP_PREFIX}${id}`);
  }
  safeLocalStorageSet(LEGACY_BACKUPS_INDEX_KEY, JSON.stringify([]));
  scheduleBackupPersist({ replaceAll: true, removedIds });
  return { ok: true, removedCount, driver: storageDriver };
}

export function restoreStoredBackup(id) {
  const raw = readStoredBackupRawSync(id);
  if (!raw) return false;
  scheduleCurrentRawPersist(raw, { immediate: true });
  return true;
}

export function clearStoredWorldData() {
  return clearStoredWorldDataImpl();
}

export async function __resetWorldStorageForTests(options = {}) {
  await resetWorldStorageForTests(options);
}
