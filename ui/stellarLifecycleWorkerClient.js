import { computeStellarLifecycleTrack } from "../engine/stellarLifecycle.js";

const STELLAR_LIFECYCLE_WORKER_URL = new URL("./stellarLifecycleWorker.js", import.meta.url);
const MAX_CACHE_ENTRIES = 24;

let workerInstance = null;
let workerBroken = false;
let nextRequestId = 1;
const pendingRequests = new Map();
const inflightByKey = new Map();
const trackCache = new Map();

function normalizeTrackPayload(payload = {}) {
  return {
    massMsol: Number(payload.massMsol ?? 1),
    ageGyr: Number(payload.ageGyr ?? 4.6),
    metallicityFeH: Number(payload.metallicityFeH ?? 0),
    sampleCount: Number(payload.sampleCount ?? 96),
    maxAgeGyr: payload.maxAgeGyr == null ? null : Number(payload.maxAgeGyr),
    planetOrbitsAu: Array.isArray(payload.planetOrbitsAu)
      ? payload.planetOrbitsAu.map((orbit) => Number(orbit)).filter((orbit) => orbit > 0)
      : [],
  };
}

function payloadSignature(payload) {
  return JSON.stringify(normalizeTrackPayload(payload));
}

function rememberTrack(key, track) {
  if (!key || !track) return;
  if (trackCache.has(key)) trackCache.delete(key);
  trackCache.set(key, track);
  while (trackCache.size > MAX_CACHE_ENTRIES) {
    const firstKey = trackCache.keys().next().value;
    trackCache.delete(firstKey);
  }
}

function rejectAllPending(reason) {
  for (const pending of pendingRequests.values()) {
    try {
      pending.reject(reason);
    } catch {}
  }
  pendingRequests.clear();
  inflightByKey.clear();
}

function getWorker() {
  if (workerBroken || typeof Worker !== "function") return null;
  if (workerInstance) return workerInstance;
  try {
    const worker = new Worker(STELLAR_LIFECYCLE_WORKER_URL, { type: "module" });
    worker.onmessage = (event) => {
      const msg = event?.data || {};
      const requestId = Number(msg.id);
      if (!Number.isFinite(requestId) || !pendingRequests.has(requestId)) return;
      const pending = pendingRequests.get(requestId);
      pendingRequests.delete(requestId);
      if (msg.ok) pending.resolve(msg.track);
      else pending.reject(new Error(String(msg.error || "Stellar lifecycle worker failed")));
    };
    worker.onerror = (event) => {
      workerBroken = true;
      workerInstance = null;
      try {
        worker.terminate();
      } catch {}
      rejectAllPending(new Error(String(event?.message || "Stellar lifecycle worker crashed")));
    };
    workerInstance = worker;
    return workerInstance;
  } catch {
    workerBroken = true;
    workerInstance = null;
    return null;
  }
}

function computeSync(payload, key) {
  const track = computeStellarLifecycleTrack(payload);
  rememberTrack(key, track);
  return track;
}

export function supportsStellarLifecycleWorker() {
  return !workerBroken && typeof Worker === "function";
}

export function computeStellarLifecycleTrackAsync(payload = {}, options = {}) {
  const normalized = normalizeTrackPayload(payload);
  const key = payloadSignature(normalized);
  if (trackCache.has(key)) return Promise.resolve(trackCache.get(key));
  if (inflightByKey.has(key)) return inflightByKey.get(key);

  const preferWorker = options.preferWorker !== false;
  const allowSyncFallback = options.allowSyncFallback !== false;
  const worker = preferWorker ? getWorker() : null;
  if (!worker) return Promise.resolve(computeSync(normalized, key));

  const requestId = nextRequestId;
  nextRequestId += 1;
  const workerPromise = new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    try {
      worker.postMessage({
        id: requestId,
        signature: key,
        payload: normalized,
      });
    } catch (err) {
      pendingRequests.delete(requestId);
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  })
    .catch((err) => {
      if (!allowSyncFallback) throw err;
      return computeSync(normalized, key);
    })
    .then((track) => {
      rememberTrack(key, track);
      return track;
    })
    .finally(() => {
      inflightByKey.delete(key);
    });

  inflightByKey.set(key, workerPromise);
  return workerPromise;
}

export function clearStellarLifecycleTrackCache() {
  trackCache.clear();
  inflightByKey.clear();
}

export function disposeStellarLifecycleWorker() {
  if (workerInstance) {
    try {
      workerInstance.terminate();
    } catch {}
  }
  workerInstance = null;
  workerBroken = false;
  rejectAllPending(new Error("Stellar lifecycle worker disposed"));
}
