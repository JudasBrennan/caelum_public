export function createWorldStorageClearOperations({
  keys,
  stateAccess,
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
}) {
  function snapshotLocalStorageValues(localStorageKeys = []) {
    const values = new Map();
    for (const key of Array.isArray(localStorageKeys) ? localStorageKeys : []) {
      values.set(key, safeLocalStorageGet(key));
    }
    return values;
  }

  function restoreLocalStorageValues(snapshot = new Map()) {
    for (const [key, value] of snapshot.entries()) {
      if (value == null) safeLocalStorageRemove(key);
      else safeLocalStorageSet(key, value);
    }
  }

  function captureWorldStorageClearSnapshot() {
    const {
      pendingWorldRaw,
      currentRawCache,
      currentSourceKey,
      currentWorldMutationId,
      backupsIndexCache,
      backupRawByIdCache,
      storageDriver,
    } = stateAccess.read();
    const backupRecords = buildBackupRecordsFromCache();
    const localStorageKeys = [
      keys.STORAGE_DRIVER_KEY,
      keys.STORAGE_HAS_WORLD_KEY,
      keys.STORAGE_MIGRATED_KEY,
      keys.STORAGE_LAST_SAVED_KEY,
      keys.LEGACY_PRIMARY_KEY,
      keys.LEGACY_FALLBACK_KEY,
      keys.LEGACY_BACKUPS_INDEX_KEY,
      ...backupRecords.map((backup) => `${keys.LEGACY_BACKUP_PREFIX}${backup.id}`),
    ];
    return {
      pendingWorldRaw,
      currentRawCache,
      currentSourceKey,
      currentWorldMutationId,
      backupsIndexCache: backupsIndexCache.slice(),
      backupRawEntries: Array.from(backupRawByIdCache.entries()),
      storageDriver,
      localStorageValues: snapshotLocalStorageValues(localStorageKeys),
    };
  }

  function restoreWorldStorageClearSnapshot(snapshot = null) {
    if (!snapshot) return;
    stateAccess.setPendingWorldRaw(snapshot.pendingWorldRaw ?? null);
    stateAccess.setCurrentRawCache(snapshot.currentRawCache ?? null);
    stateAccess.setCurrentSourceKey(snapshot.currentSourceKey ?? null);
    stateAccess.setCurrentWorldMutationId(Number(snapshot.currentWorldMutationId) || 0);
    stateAccess.setBackupsIndexCache(
      Array.isArray(snapshot.backupsIndexCache) ? snapshot.backupsIndexCache.slice() : [],
    );
    stateAccess.setBackupRawByIdCache(
      new Map(Array.isArray(snapshot.backupRawEntries) ? snapshot.backupRawEntries : []),
    );
    stateAccess.setStorageDriverValue(String(snapshot.storageDriver || "memory"));
    stateAccess.setClearStoredWorldDataInFlight(false);
    restoreLocalStorageValues(snapshot.localStorageValues);
  }

  function restoreCurrentWorldState(previousRaw, previousSourceKey) {
    if (!(typeof previousRaw === "string" && previousRaw)) {
      stateAccess.setPendingWorldRaw(null);
      stateAccess.setCurrentRawCache(null);
      stateAccess.setCurrentSourceKey(null);
      markHasWorld(false);
      return;
    }

    stateAccess.setCurrentRawCache(previousRaw);
    stateAccess.setPendingWorldRaw(previousSourceKey === "pending-write" ? previousRaw : null);
    stateAccess.setCurrentSourceKey(
      previousSourceKey === "pending-write" ? "memory-write" : previousSourceKey || "cache",
    );
    markHasWorld(true);

    if (
      previousSourceKey === keys.LEGACY_PRIMARY_KEY ||
      previousSourceKey === keys.LEGACY_FALLBACK_KEY
    ) {
      safeLocalStorageSet(previousSourceKey, previousRaw);
    }
  }

  function clearPendingWorldTimer() {
    const { pendingWorldTimer } = stateAccess.read();
    if (pendingWorldTimer != null) {
      clearTimeout(pendingWorldTimer);
      stateAccess.setPendingWorldTimer(null);
    }
  }

  async function clearStoredCurrentWorldData() {
    try {
      await stateAccess.read().storageReadyPromise;
    } catch {
      // Ignore bootstrap failures and still attempt a direct clear.
    }

    clearPendingWorldTimer();

    try {
      await stateAccess.read().persistenceQueue;
    } catch {
      // Ignore earlier persistence failures so recovery can still proceed.
    }

    const { pendingWorldRaw, currentRawCache, currentSourceKey, backupsIndexCache, storageDriver } =
      stateAccess.read();
    const legacy = readLegacyCurrentWorld();
    const previousRaw = pendingWorldRaw || currentRawCache || legacy.raw;
    const previousSourceKey =
      currentSourceKey || (pendingWorldRaw ? "pending-write" : legacy.sourceKey) || null;
    const hadWorld = !!previousRaw;

    stateAccess.setPendingWorldRaw(null);
    stateAccess.setCurrentRawCache(null);
    stateAccess.setCurrentSourceKey(null);
    markHasWorld(false);
    safeLocalStorageRemove(keys.LEGACY_PRIMARY_KEY);
    safeLocalStorageRemove(keys.LEGACY_FALLBACK_KEY);

    const db = await openWorldStorageDb();
    if (db) {
      try {
        await writeWorldStorageIndexedDbCurrentRaw(db, null);
        markDriver("indexeddb");
        return { ok: true, hadWorld, driver: "indexeddb" };
      } catch (error) {
        restoreCurrentWorldState(previousRaw, previousSourceKey);
        emitStorageError(
          "Could not remove the unreadable saved world from browser storage.",
          error?.message,
        );
        return {
          ok: false,
          hadWorld,
          driver: storageDriver,
          error: error?.message || String(error),
        };
      }
    }

    markDriver(backupsIndexCache.length ? "localStorage" : "memory");
    return { ok: true, hadWorld, driver: stateAccess.read().storageDriver };
  }

  function clearStoredWorldData() {
    const { currentWorldMutationId, backupsIndexCache, pendingWorldRaw, currentRawCache } =
      stateAccess.read();
    const clearRequestedAtMutationId = currentWorldMutationId;
    stateAccess.setClearStoredWorldDataInFlight(true);
    const previousBackupCount = backupsIndexCache.length;
    const hadWorld = !!(pendingWorldRaw || currentRawCache || readLegacyCurrentWorld().raw);
    const removedCount = previousBackupCount + (hadWorld ? 1 : 0);

    return (async () => {
      try {
        await stateAccess.read().storageReadyPromise;
      } catch {
        // Ignore bootstrap failures and still attempt a direct clear.
      }

      const snapshot = captureWorldStorageClearSnapshot();
      const {
        currentWorldMutationId: latestMutationId,
        pendingWorldRaw: latestPendingWorldRaw,
        currentRawCache: latestCurrentRawCache,
      } = stateAccess.read();
      const preserveNewerWorldRaw =
        latestMutationId !== clearRequestedAtMutationId
          ? latestPendingWorldRaw || latestCurrentRawCache || null
          : null;

      clearPendingWorldTimer();
      stateAccess.setPendingWorldRaw(null);
      stateAccess.setCurrentRawCache(null);
      stateAccess.setCurrentSourceKey(null);
      stateAccess.setBackupsIndexCache([]);
      stateAccess.setBackupRawByIdCache(new Map());
      markHasWorld(false);

      const clearResult = await queuePersistence(async () => {
        const db = await openWorldStorageDb();
        if (db) {
          await writeWorldStorageIndexedDbState(db, null, []);
        }
        safeLocalStorageRemove(keys.LEGACY_PRIMARY_KEY);
        safeLocalStorageRemove(keys.LEGACY_FALLBACK_KEY);
        safeLocalStorageRemove(keys.LEGACY_BACKUPS_INDEX_KEY);
        safeLocalStorageRemove(keys.STORAGE_MIGRATED_KEY);
        clearLegacyBackupEntries();
        return { driver: db ? "indexeddb" : "memory" };
      }).catch((error) => ({ error }));

      if (clearResult?.error) {
        restoreWorldStorageClearSnapshot(snapshot);
        emitStorageError(
          "Could not clear saved WorldSmith data from browser storage.",
          clearResult.error?.message || String(clearResult.error),
        );
        return {
          ok: false,
          removedCount,
          scope: "durable",
          confirmedDurableClear: false,
          driver: stateAccess.read().storageDriver,
          error: clearResult.error?.message || String(clearResult.error),
        };
      }

      stateAccess.setClearStoredWorldDataInFlight(false);
      markDriver(clearResult?.driver || "memory");
      markHasWorld(false);
      if (typeof preserveNewerWorldRaw === "string" && preserveNewerWorldRaw) {
        void scheduleCurrentRawPersist(preserveNewerWorldRaw, { immediate: true });
      }
      return {
        ok: true,
        removedCount,
        scope: "durable",
        confirmedDurableClear: true,
        driver: stateAccess.read().storageDriver,
      };
    })();
  }

  async function resetWorldStorageForTests(options = {}) {
    const { deleteDatabase = false, rebootstrap = true } = options;

    clearPendingWorldTimer();
    stateAccess.setPendingWorldRaw(null);

    try {
      await stateAccess.read().storageReadyPromise;
    } catch {
      // Ignore bootstrap failures during test resets.
    }

    try {
      await stateAccess.read().persistenceQueue;
    } catch {
      // Ignore queued write failures during test resets.
    }

    await resetWorldStorageIndexedDbForTests({ deleteDatabase });
    stateAccess.setStorageReadyPromise(null);
    stateAccess.setPersistenceQueue(Promise.resolve());
    stateAccess.setLastLifecycleFlushPromise(Promise.resolve());
    stateAccess.setCurrentRawCache(null);
    stateAccess.setCurrentSourceKey(null);
    stateAccess.setBackupsIndexCache([]);
    stateAccess.setBackupRawByIdCache(new Map());
    stateAccess.setStorageDriverValue("memory");
    stateAccess.setLastStorageErrorValue(null);
    stateAccess.setClearStoredWorldDataInFlight(false);
    stateAccess.setCurrentWorldMutationId(0);
    markDriver("memory");
    markHasWorld(false);

    if (rebootstrap) {
      initializeStorage();
      await stateAccess.read().storageReadyPromise;
    }
  }

  return {
    clearStoredCurrentWorldData,
    clearStoredWorldData,
    resetWorldStorageForTests,
  };
}
