export const LEGACY_PRIMARY_KEY = "worldsmith.world.v1";
export const LEGACY_FALLBACK_KEY = "worldsmith.world";
export const LEGACY_BACKUPS_INDEX_KEY = "worldsmith.world.backups";
export const LEGACY_BACKUP_PREFIX = "worldsmith.world.backup.";

export function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeLocalStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readLegacyCurrentWorld() {
  const primary = safeLocalStorageGet(LEGACY_PRIMARY_KEY);
  if (primary) return { raw: primary, sourceKey: LEGACY_PRIMARY_KEY };
  const fallback = safeLocalStorageGet(LEGACY_FALLBACK_KEY);
  if (fallback) return { raw: fallback, sourceKey: LEGACY_FALLBACK_KEY };
  return { raw: null, sourceKey: null };
}

export function readLegacyBackups() {
  const rawById = new Map();
  let index = [];
  try {
    const rawIndex = safeLocalStorageGet(LEGACY_BACKUPS_INDEX_KEY);
    const parsed = rawIndex ? JSON.parse(rawIndex) : [];
    if (Array.isArray(parsed)) {
      index = parsed
        .map((item) => {
          const id = String(item?.id || "").trim();
          const key = String(item?.key || `${LEGACY_BACKUP_PREFIX}${id}`).trim();
          const createdUtc = String(item?.createdUtc || "").trim() || new Date().toISOString();
          const metadata =
            item?.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
              ? { ...item.metadata }
              : null;
          if (!id) return null;
          const raw = safeLocalStorageGet(key);
          if (!raw) return null;
          rawById.set(id, raw);
          return metadata ? { id, createdUtc, metadata } : { id, createdUtc };
        })
        .filter(Boolean);
    }
  } catch {
    index = [];
  }

  if (index.length) {
    index.sort((a, b) => String(b.createdUtc).localeCompare(String(a.createdUtc)));
    return { index, rawById };
  }

  try {
    const discovered = [];
    if (typeof localStorage?.length === "number" && typeof localStorage?.key === "function") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(LEGACY_BACKUP_PREFIX)) continue;
        const raw = safeLocalStorageGet(key);
        if (!raw) continue;
        const id = key.slice(LEGACY_BACKUP_PREFIX.length);
        rawById.set(id, raw);
        discovered.push({ id, createdUtc: new Date().toISOString() });
      }
    }
    discovered.sort((a, b) => String(b.createdUtc).localeCompare(String(a.createdUtc)));
    return { index: discovered, rawById };
  } catch {
    return { index: [], rawById: new Map() };
  }
}

export function buildLegacyBackupIndex(index = []) {
  return index.map((backup) => {
    const entry = {
      id: backup.id,
      key: `${LEGACY_BACKUP_PREFIX}${backup.id}`,
      createdUtc: backup.createdUtc,
    };
    if (backup.metadata && typeof backup.metadata === "object" && !Array.isArray(backup.metadata)) {
      entry.metadata = { ...backup.metadata };
    }
    return entry;
  });
}

export function clearLegacyBackupEntries() {
  try {
    if (typeof localStorage?.length === "number" && typeof localStorage?.key === "function") {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LEGACY_BACKUP_PREFIX)) toRemove.push(key);
      }
      for (const key of toRemove) {
        safeLocalStorageRemove(key);
      }
    }
  } catch {
    // Ignore cleanup failures.
  }
}

export function removeLegacyPersistenceKeys() {
  safeLocalStorageRemove(LEGACY_PRIMARY_KEY);
  safeLocalStorageRemove(LEGACY_FALLBACK_KEY);
  safeLocalStorageRemove(LEGACY_BACKUPS_INDEX_KEY);
  clearLegacyBackupEntries();
}
