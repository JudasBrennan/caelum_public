const DB_NAME = "worldsmith-world-storage";
const DB_VERSION = 1;
const META_STORE = "meta";
const BACKUPS_STORE = "backups";
const CURRENT_WORLD_META_KEY = "current-world-raw";

let dbPromise = null;

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

export function openWorldStorageDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(BACKUPS_STORE)) {
        db.createObjectStore(BACKUPS_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      resolve(null);
    };
  });
  return dbPromise;
}

export async function readWorldStorageIndexedDbState(db) {
  if (!db) {
    return { currentRaw: null, backups: [] };
  }
  const metaTx = db.transaction(META_STORE, "readonly");
  const currentRecord = await requestToPromise(
    metaTx.objectStore(META_STORE).get(CURRENT_WORLD_META_KEY),
  ).catch(() => null);

  const backupsTx = db.transaction(BACKUPS_STORE, "readonly");
  const backupRecords = await requestToPromise(backupsTx.objectStore(BACKUPS_STORE).getAll()).catch(
    () => [],
  );

  const backups = (Array.isArray(backupRecords) ? backupRecords : [])
    .map((record) => ({
      id: String(record?.id || "").trim(),
      createdUtc: String(record?.createdUtc || "").trim() || new Date().toISOString(),
      metadata:
        record?.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
          ? { ...record.metadata }
          : null,
      raw: typeof record?.raw === "string" ? record.raw : null,
    }))
    .filter((record) => record.id && record.raw);

  backups.sort((a, b) => String(b.createdUtc).localeCompare(String(a.createdUtc)));

  return {
    currentRaw: typeof currentRecord?.value === "string" ? currentRecord.value : null,
    backups,
  };
}

export async function writeWorldStorageIndexedDbState(db, currentRaw, backups) {
  if (!db) return false;
  return new Promise((resolve, reject) => {
    const tx = db.transaction([META_STORE, BACKUPS_STORE], "readwrite");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));

    const metaStore = tx.objectStore(META_STORE);
    if (typeof currentRaw === "string" && currentRaw) {
      metaStore.put({ key: CURRENT_WORLD_META_KEY, value: currentRaw, savedAt: Date.now() });
    } else {
      metaStore.delete(CURRENT_WORLD_META_KEY);
    }

    const backupsStore = tx.objectStore(BACKUPS_STORE);
    backupsStore.clear();
    for (const backup of backups || []) {
      backupsStore.put({
        id: backup.id,
        createdUtc: backup.createdUtc,
        metadata: backup.metadata || undefined,
        raw: backup.raw,
      });
    }
  });
}

export async function writeWorldStorageIndexedDbCurrentRaw(db, currentRaw) {
  if (!db) return false;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readwrite");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));

    const metaStore = tx.objectStore(META_STORE);
    if (typeof currentRaw === "string" && currentRaw) {
      metaStore.put({ key: CURRENT_WORLD_META_KEY, value: currentRaw, savedAt: Date.now() });
    } else {
      metaStore.delete(CURRENT_WORLD_META_KEY);
    }
  });
}

export async function writeWorldStorageIndexedDbBackups(db, backups) {
  if (!db) return false;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUPS_STORE, "readwrite");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));

    const backupsStore = tx.objectStore(BACKUPS_STORE);
    backupsStore.clear();
    for (const backup of backups || []) {
      backupsStore.put({
        id: backup.id,
        createdUtc: backup.createdUtc,
        metadata: backup.metadata || undefined,
        raw: backup.raw,
      });
    }
  });
}

export async function applyWorldStorageIndexedDbBackupDelta(db, change = {}) {
  if (!db) return false;
  const upserts = Array.isArray(change?.upserts) ? change.upserts : [];
  const removedIds = Array.isArray(change?.removedIds) ? change.removedIds : [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUPS_STORE, "readwrite");
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted."));

    const backupsStore = tx.objectStore(BACKUPS_STORE);
    for (const id of removedIds) {
      const backupId = String(id || "").trim();
      if (backupId) backupsStore.delete(backupId);
    }
    for (const backup of upserts) {
      const id = String(backup?.id || "").trim();
      const createdUtc = String(backup?.createdUtc || "").trim();
      if (!id || typeof backup?.raw !== "string" || !backup.raw) continue;
      backupsStore.put({
        id,
        createdUtc: createdUtc || new Date().toISOString(),
        metadata:
          backup?.metadata && typeof backup.metadata === "object" && !Array.isArray(backup.metadata)
            ? { ...backup.metadata }
            : undefined,
        raw: backup.raw,
      });
    }
  });
}

export async function deleteWorldStorageDatabase() {
  if (typeof indexedDB === "undefined") return;
  await new Promise((resolve) => {
    let request;
    try {
      request = indexedDB.deleteDatabase(DB_NAME);
    } catch {
      resolve();
      return;
    }
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

export async function resetWorldStorageIndexedDbForTests({ deleteDatabase = false } = {}) {
  const db = dbPromise ? await dbPromise.catch(() => null) : null;
  if (db && typeof db.close === "function") {
    try {
      db.close();
    } catch {
      // Ignore close failures.
    }
  }
  dbPromise = null;

  if (deleteDatabase) {
    await deleteWorldStorageDatabase();
  }
}
