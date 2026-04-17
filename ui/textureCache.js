// Persistent IndexedDB cache for celestial texture RGBA buffers.
// Survives browser refresh. Graceful degradation: returns null
// if IndexedDB is unavailable (private browsing, quota exceeded).

import { normalizeCelestialTexturePayload } from "./celestialTexturePayloads.js";

const DB_NAME = "worldsmith-textures";
const DB_VERSION = 1;
const STORE_NAME = "textures";
const MAX_ENTRIES = 200;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "signature" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      resolve(null);
    };
  });
  return dbPromise;
}

function touchEntry(db, signature) {
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(signature);
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.accessedAt = Date.now();
        store.put(record);
      }
    };
  } catch {
    /* fail silently */
  }
}

function evictOldEntries(db) {
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const all = store.getAll();
    all.onsuccess = () => {
      const entries = all.result || [];
      if (entries.length <= MAX_ENTRIES) return;
      entries.sort((a, b) => (a.accessedAt || 0) - (b.accessedAt || 0));
      const toRemove = entries.length - MAX_ENTRIES;
      for (let i = 0; i < toRemove; i++) {
        store.delete(entries[i].signature);
      }
    };
  } catch {
    /* fail silently */
  }
}

export async function loadTexturesFromIDB(signature) {
  if (!signature) return null;
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(signature);
      req.onsuccess = () => {
        const record = req.result;
        if (!record || !record.surface) {
          resolve(null);
          return;
        }
        touchEntry(db, signature);
        resolve(
          normalizeCelestialTexturePayload(
            {
              width: record.width,
              height: record.height,
              surface: record.surface,
              cloud: record.cloud,
              normal: record.normal,
              roughness: record.roughness,
              emissive: record.emissive,
            },
            { cloneBuffers: false },
          ),
        );
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function storeTexturesToIDB(signature, maps, pipelineVersion) {
  if (!signature || !maps?.surface) return;
  try {
    const db = await openDB();
    if (!db) return;
    const payload = normalizeCelestialTexturePayload(maps, { cloneBuffers: false });
    if (!payload) return;
    const record = {
      signature,
      pipelineVersion: pipelineVersion || 0,
      accessedAt: Date.now(),
      width: payload.width,
      height: payload.height,
      surface: payload.surface,
      cloud: payload.cloud,
      normal: payload.normal,
      roughness: payload.roughness,
      emissive: payload.emissive,
    };
    if (!record.surface) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    evictOldEntries(db);
    await new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
    /* IDB quota exceeded or other error — fail silently */
  }
}

export async function clearStaleTextures(currentPipelineVersion) {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (cursor.value.pipelineVersion !== currentPipelineVersion) {
        cursor.delete();
      }
      cursor.continue();
    };
  } catch {
    /* fail silently */
  }
}

export function resetTextureCacheForTests() {
  dbPromise = null;
}
