import {
  normalizeCelestialTexturePayload,
  texturePayloadToCanvas,
} from "./celestialTexturePayloads.js";

const CELESTIAL_TEX_WORKER_URL = new URL("./celestialTextureWorker.js", import.meta.url);

let workerInstance = null;
let workerBroken = false;
let nextRequestId = 1;
const pendingRequests = new Map();
const inflightByKey = new Map();

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
    const worker = new Worker(CELESTIAL_TEX_WORKER_URL, { type: "module" });
    worker.onmessage = (event) => {
      const msg = event?.data || {};
      const requestId = Number(msg.id);
      if (!Number.isFinite(requestId) || !pendingRequests.has(requestId)) return;
      const pending = pendingRequests.get(requestId);
      pendingRequests.delete(requestId);
      if (msg.ok) pending.resolve(msg);
      else pending.reject(new Error(String(msg.error || "Celestial texture worker failed")));
    };
    worker.onerror = (event) => {
      workerBroken = true;
      workerInstance = null;
      try {
        worker.terminate();
      } catch {}
      const message = event?.message || "Celestial texture worker crashed";
      rejectAllPending(new Error(String(message)));
    };
    workerInstance = worker;
    return workerInstance;
  } catch {
    workerBroken = true;
    workerInstance = null;
    return null;
  }
}

export function supportsCelestialTextureWorker() {
  return !workerBroken && typeof Worker === "function";
}

export function requestCelestialTextureBundle({ signature, descriptor, textureSize }) {
  const sig = String(signature || "");
  const key = sig ? `${sig}:${Math.max(1, Number(textureSize) || 0)}` : "";
  if (key && inflightByKey.has(key)) return inflightByKey.get(key);
  const worker = getWorker();
  if (!worker) return Promise.reject(new Error("Celestial texture worker unavailable"));

  const requestId = nextRequestId;
  nextRequestId += 1;
  const promise = new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    try {
      worker.postMessage({
        id: requestId,
        signature,
        descriptor,
        textureSize,
      });
    } catch (err) {
      pendingRequests.delete(requestId);
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  }).finally(() => {
    if (key) inflightByKey.delete(key);
  });

  if (key) inflightByKey.set(key, promise);
  return promise;
}

export function normalizeWorkerTextureBundle(result) {
  return normalizeCelestialTexturePayload(result?.maps || null);
}

export function canvasFromMapPayload(mapPayload) {
  if (!mapPayload?.buffer || !(mapPayload.width > 0) || !(mapPayload.height > 0)) return null;
  return texturePayloadToCanvas(
    {
      width: mapPayload.width,
      height: mapPayload.height,
      surface: mapPayload.buffer,
    },
    "surface",
  );
}

export function disposeCelestialTextureWorker() {
  if (workerInstance) {
    try {
      workerInstance.terminate();
    } catch {}
  }
  workerInstance = null;
  workerBroken = false;
  rejectAllPending(new Error("Celestial texture worker disposed"));
}
