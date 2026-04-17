const CACHE_LOOKUP_KINDS = Object.freeze([
  "textureSignature",
  "rendererTextureBundle",
  "ringAppearancePayload",
  "ringTextureBundle",
  "recipeSnapshot",
]);

const TEXTURE_SOURCES = Object.freeze(["memory", "indexedDB", "worker", "localFallback"]);
const REUSE_KINDS = Object.freeze(["gpuTextureBundle", "ringStrip", "ringTextureBundle"]);
const DURATION_KINDS = Object.freeze([
  "previewDescriptorToReadyMs",
  "visibleWarmupCompletionMs",
  "recipeBatchRenderCompletionMs",
]);
const MAX_DURATION_SAMPLES = 40;
const PERF_DEBUG_SEARCH_PARAM = "celestialPerfDebug";
const PERF_DEBUG_STORAGE_KEY = "worldsmith:celestial-perf-debug";

function nowMs() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function createLookupState() {
  return { hits: 0, misses: 0 };
}

function createPerfState() {
  return {
    cacheLookups: Object.fromEntries(CACHE_LOOKUP_KINDS.map((kind) => [kind, createLookupState()])),
    textureFulfillmentBySource: Object.fromEntries(TEXTURE_SOURCES.map((source) => [source, 0])),
    textureFulfillmentByScope: {},
    reuseCounts: Object.fromEntries(REUSE_KINDS.map((kind) => [kind, 0])),
    durations: Object.fromEntries(DURATION_KINDS.map((kind) => [kind, []])),
    queueMetrics: {},
    lastUpdatedAtMs: 0,
  };
}

let perfState = createPerfState();

function touchPerfState() {
  perfState.lastUpdatedAtMs = nowMs();
}

function pushDurationSample(kind, sample) {
  if (!perfState.durations[kind]) perfState.durations[kind] = [];
  const list = perfState.durations[kind];
  list.push(sample);
  if (list.length > MAX_DURATION_SAMPLES) list.splice(0, list.length - MAX_DURATION_SAMPLES);
}

function cloneQueueSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return {};
  const workerQueue = Array.isArray(snapshot.workerQueue)
    ? snapshot.workerQueue.map((item) => ({
        key: String(item?.key || ""),
        priority: String(item?.priority || ""),
      }))
    : [];
  const localQueue = Array.isArray(snapshot.localQueue)
    ? snapshot.localQueue.map((item) => ({
        key: String(item?.key || ""),
        priority: String(item?.priority || ""),
      }))
    : [];
  return {
    activeWorkerCount: Math.max(0, Number(snapshot.activeWorkerCount) || 0),
    activeLocalCount: Math.max(0, Number(snapshot.activeLocalCount) || 0),
    activeJobs: Math.max(0, Number(snapshot.activeJobs) || 0),
    queuedJobs: Math.max(0, Number(snapshot.queuedJobs) || 0),
    totalJobs: Math.max(0, Number(snapshot.totalJobs) || 0),
    disposed: snapshot.disposed === true,
    reserveWorkerSlotForLowPriority: snapshot.reserveWorkerSlotForLowPriority !== false,
    workerQueue,
    localQueue,
  };
}

function summarizeDurationSamples(samples) {
  const list = Array.isArray(samples) ? samples : [];
  if (!list.length) return { count: 0, avgMs: 0, maxMs: 0, lastMs: 0 };
  let total = 0;
  let maxMs = 0;
  for (const sample of list) {
    const durationMs = Math.max(0, Number(sample?.durationMs) || 0);
    total += durationMs;
    if (durationMs > maxMs) maxMs = durationMs;
  }
  return {
    count: list.length,
    avgMs: total / list.length,
    maxMs,
    lastMs: Math.max(0, Number(list[list.length - 1]?.durationMs) || 0),
  };
}

function isBrowserRuntime() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function readPerfDebugFlag() {
  if (!isBrowserRuntime()) return false;
  try {
    const params = new URLSearchParams(window.location?.search || "");
    const queryFlag = params.get(PERF_DEBUG_SEARCH_PARAM);
    if (queryFlag === "1" || queryFlag === "true") return true;
  } catch {}
  try {
    if (window.localStorage?.getItem(PERF_DEBUG_STORAGE_KEY) === "1") return true;
  } catch {}
  return globalThis.__worldsmithCelestialPerfDebug === true;
}

function buildPerfHelper() {
  return {
    disable() {
      setCelestialPerfDebugEnabled(false);
      return getCelestialPerfSnapshot({ includeSamples: true });
    },
    enable() {
      setCelestialPerfDebugEnabled(true);
      return getCelestialPerfSnapshot({ includeSamples: true });
    },
    getSnapshot(options = {}) {
      return getCelestialPerfSnapshot(options);
    },
    reset() {
      resetCelestialPerfMetrics();
      return getCelestialPerfSnapshot({ includeSamples: true });
    },
  };
}

function installPerfBootstrapHelpers() {
  if (!isBrowserRuntime()) return;
  if (typeof globalThis.__worldsmithEnableCelestialPerfDebug !== "function") {
    globalThis.__worldsmithEnableCelestialPerfDebug = () => {
      setCelestialPerfDebugEnabled(true);
      return ensureCelestialPerfDebugHelpers({ force: true });
    };
  }
  if (typeof globalThis.__worldsmithDisableCelestialPerfDebug !== "function") {
    globalThis.__worldsmithDisableCelestialPerfDebug = () => {
      setCelestialPerfDebugEnabled(false);
      return null;
    };
  }
}

export function setCelestialPerfDebugEnabled(enabled) {
  const next = enabled === true;
  globalThis.__worldsmithCelestialPerfDebug = next;
  if (isBrowserRuntime()) {
    try {
      if (next) window.localStorage?.setItem(PERF_DEBUG_STORAGE_KEY, "1");
      else window.localStorage?.removeItem(PERF_DEBUG_STORAGE_KEY);
    } catch {}
  }
  if (next) ensureCelestialPerfDebugHelpers({ force: true });
  else if (isBrowserRuntime()) delete globalThis.__worldsmithCelestialPerf;
}

export function ensureCelestialPerfDebugHelpers(options = {}) {
  installPerfBootstrapHelpers();
  if (!isBrowserRuntime()) return null;
  const force = options.force === true;
  if (!force && !readPerfDebugFlag()) return null;
  if (!globalThis.__worldsmithCelestialPerf) {
    globalThis.__worldsmithCelestialPerf = buildPerfHelper();
  }
  return globalThis.__worldsmithCelestialPerf;
}

export function resetCelestialPerfMetrics() {
  perfState = createPerfState();
  touchPerfState();
}

export function recordCelestialPerfCacheLookup(kind, hit) {
  const key = String(kind || "");
  if (!perfState.cacheLookups[key]) perfState.cacheLookups[key] = createLookupState();
  if (hit) perfState.cacheLookups[key].hits += 1;
  else perfState.cacheLookups[key].misses += 1;
  touchPerfState();
}

export function recordCelestialTextureFulfillment(source, meta = {}) {
  const sourceKey = TEXTURE_SOURCES.includes(source) ? source : "localFallback";
  perfState.textureFulfillmentBySource[sourceKey] += 1;
  const scopeKey = String(meta.scope || "").trim();
  if (scopeKey) {
    const combinedKey = `${scopeKey}:${sourceKey}`;
    perfState.textureFulfillmentByScope[combinedKey] =
      (perfState.textureFulfillmentByScope[combinedKey] || 0) + 1;
  }
  touchPerfState();
}

export function recordCelestialPerfReuse(kind, delta = 1) {
  const key = String(kind || "");
  if (!(key in perfState.reuseCounts)) perfState.reuseCounts[key] = 0;
  perfState.reuseCounts[key] += Math.max(1, Number(delta) || 1);
  touchPerfState();
}

export function recordCelestialPerfDuration(kind, durationMs, meta = {}) {
  const key = String(kind || "");
  const safeDurationMs = Math.max(0, Number(durationMs) || 0);
  pushDurationSample(key, {
    atMs: nowMs(),
    durationMs: safeDurationMs,
    bodyType: String(meta.bodyType || ""),
    count: Math.max(0, Number(meta.count) || 0),
    scope: String(meta.scope || ""),
  });
  touchPerfState();
}

export function beginCelestialPerfDuration(kind, meta = {}) {
  const key = String(kind || "");
  const startedAtMs = nowMs();
  let ended = false;
  return {
    cancel() {
      ended = true;
    },
    end(extraMeta = {}) {
      if (ended) return 0;
      ended = true;
      const durationMs = nowMs() - startedAtMs;
      recordCelestialPerfDuration(key, durationMs, { ...meta, ...extraMeta });
      return durationMs;
    },
  };
}

export function updateCelestialPerfQueueState(name, snapshot) {
  const key = String(name || "");
  if (!key) return;
  const current = cloneQueueSnapshot(snapshot);
  const activeJobs = current.activeWorkerCount + current.activeLocalCount;
  const queuedJobs = current.workerQueue.length + current.localQueue.length;
  const prev = perfState.queueMetrics[key] || {
    current: {},
    peakActiveJobs: 0,
    peakQueuedJobs: 0,
    peakTotalJobs: 0,
  };
  perfState.queueMetrics[key] = {
    current: {
      ...current,
      activeJobs,
      queuedJobs,
    },
    peakActiveJobs: Math.max(prev.peakActiveJobs || 0, activeJobs),
    peakQueuedJobs: Math.max(prev.peakQueuedJobs || 0, queuedJobs),
    peakTotalJobs: Math.max(prev.peakTotalJobs || 0, current.totalJobs),
  };
  touchPerfState();
}

export function getCelestialPerfSnapshot(options = {}) {
  const includeSamples = options.includeSamples === true;
  const cacheHitRates = Object.fromEntries(
    Object.entries(perfState.cacheLookups).map(([kind, stats]) => {
      const hits = Math.max(0, Number(stats?.hits) || 0);
      const misses = Math.max(0, Number(stats?.misses) || 0);
      const total = hits + misses;
      return [
        kind,
        {
          hits,
          misses,
          total,
          hitRate: total > 0 ? hits / total : 0,
        },
      ];
    }),
  );
  const durations = Object.fromEntries(
    Object.entries(perfState.durations).map(([kind, samples]) => [
      kind,
      {
        summary: summarizeDurationSamples(samples),
        samples: includeSamples
          ? samples.map((sample) => ({
              atMs: Math.max(0, Number(sample?.atMs) || 0),
              bodyType: String(sample?.bodyType || ""),
              count: Math.max(0, Number(sample?.count) || 0),
              durationMs: Math.max(0, Number(sample?.durationMs) || 0),
              scope: String(sample?.scope || ""),
            }))
          : [],
      },
    ]),
  );
  const queueMetrics = Object.fromEntries(
    Object.entries(perfState.queueMetrics).map(([name, entry]) => [
      name,
      {
        current: cloneQueueSnapshot(entry.current),
        peakActiveJobs: Math.max(0, Number(entry?.peakActiveJobs) || 0),
        peakQueuedJobs: Math.max(0, Number(entry?.peakQueuedJobs) || 0),
        peakTotalJobs: Math.max(0, Number(entry?.peakTotalJobs) || 0),
      },
    ]),
  );
  return {
    cacheHitRates,
    durations,
    queueMetrics,
    reuseCounts: { ...perfState.reuseCounts },
    textureFulfillmentByScope: { ...perfState.textureFulfillmentByScope },
    textureFulfillmentBySource: { ...perfState.textureFulfillmentBySource },
    updatedAtMs: perfState.lastUpdatedAtMs,
  };
}

installPerfBootstrapHelpers();
ensureCelestialPerfDebugHelpers();
