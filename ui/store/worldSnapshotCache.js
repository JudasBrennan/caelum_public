const NO_CACHED_RAW = Symbol("worldSnapshotCache.noRaw");

let cachedRaw = NO_CACHED_RAW;
let cachedEntry = null;
let cacheStats = {
  builds: 0,
  seeds: 0,
  worldHits: 0,
  failureHits: 0,
  invalidations: 0,
};

function cloneSnapshot(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function readCachedWorldSnapshot(raw) {
  if (typeof raw !== "string") return null;
  if (cachedRaw !== raw || cachedEntry?.kind !== "world") return null;
  cacheStats.worldHits += 1;
  return cloneSnapshot(cachedEntry.world);
}

export function readCachedWorldLoadFailure(raw) {
  if (typeof raw !== "string") return null;
  if (cachedRaw !== raw || cachedEntry?.kind !== "failure") return null;
  cacheStats.failureHits += 1;
  return {
    stage: cachedEntry.stage,
    cause: cachedEntry.cause,
  };
}

export function cacheWorldSnapshot(raw, world, { reason = "build" } = {}) {
  if (typeof raw !== "string") {
    invalidateWorldSnapshotCache();
    return;
  }
  if (reason === "seed") cacheStats.seeds += 1;
  else cacheStats.builds += 1;
  cachedRaw = raw;
  cachedEntry = {
    kind: "world",
    world: cloneSnapshot(world),
  };
}

export function cacheWorldLoadFailure(raw, failure) {
  if (typeof raw !== "string") {
    invalidateWorldSnapshotCache();
    return;
  }
  cacheStats.builds += 1;
  cachedRaw = raw;
  cachedEntry = {
    kind: "failure",
    stage: failure?.stage === "migrate" ? "migrate" : "parse",
    cause: String(failure?.cause || ""),
  };
}

export function invalidateWorldSnapshotCache() {
  cachedRaw = NO_CACHED_RAW;
  cachedEntry = null;
  cacheStats.invalidations += 1;
}

export function __getWorldSnapshotCacheStatsForTests() {
  return {
    ...cacheStats,
    kind: cachedEntry?.kind || null,
    hasEntry: !!cachedEntry,
    rawLength: typeof cachedRaw === "string" ? cachedRaw.length : 0,
  };
}

export function __resetWorldSnapshotCacheForTests() {
  cachedRaw = NO_CACHED_RAW;
  cachedEntry = null;
  cacheStats = {
    builds: 0,
    seeds: 0,
    worldHits: 0,
    failureHits: 0,
    invalidations: 0,
  };
}
