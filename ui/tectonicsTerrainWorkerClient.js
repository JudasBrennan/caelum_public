import { serializeTerrainModel } from "../engine/tectonics-sim/terrain.js";

const TECTONICS_TERRAIN_WORKER_URL = new URL("./tectonicsTerrainWorker.js", import.meta.url);

let workerInstance = null;
let workerBroken = false;
let nextRequestId = 1;
const pendingRequests = new Map();

function rejectAllPending(reason) {
  for (const pending of pendingRequests.values()) {
    try {
      pending.reject(reason);
    } catch {}
  }
  pendingRequests.clear();
}

function getWorker() {
  if (workerBroken || typeof Worker !== "function") return null;
  if (workerInstance) return workerInstance;
  try {
    const worker = new Worker(TECTONICS_TERRAIN_WORKER_URL, { type: "module" });
    worker.onmessage = (event) => {
      const msg = event?.data || {};
      const requestId = Number(msg.id);
      if (!Number.isFinite(requestId) || !pendingRequests.has(requestId)) return;
      const pending = pendingRequests.get(requestId);
      pendingRequests.delete(requestId);
      if (!msg.ok) {
        pending.reject(new Error(String(msg.error || "Tectonics terrain worker failed")));
        return;
      }
      const raster = msg.raster || {};
      pending.resolve({
        width: raster.width,
        height: raster.height,
        mode: raster.mode,
        colors: new Uint8ClampedArray(raster.colorsBuffer || 0),
        heights: new Float32Array(raster.heightsBuffer || 0),
        contourHeights: new Float32Array(raster.contourHeightsBuffer || 0),
        cellIds: new Uint16Array(raster.cellIdsBuffer || 0),
        slopeDeg: new Float32Array(raster.slopeDegBuffer || 0),
        aspectDeg: new Float32Array(raster.aspectDegBuffer || 0),
        hillshade: new Float32Array(raster.hillshadeBuffer || 0),
      });
    };
    worker.onerror = (event) => {
      workerBroken = true;
      workerInstance = null;
      try {
        worker.terminate();
      } catch {}
      rejectAllPending(new Error(String(event?.message || "Tectonics terrain worker crashed")));
    };
    workerInstance = worker;
    return workerInstance;
  } catch {
    workerBroken = true;
    workerInstance = null;
    return null;
  }
}

export function supportsTectonicsTerrainWorker() {
  return !workerBroken && typeof Worker === "function";
}

export function requestTectonicsTerrainRaster({
  model,
  width,
  height,
  mode,
  topographyBandStepM,
  topographyPeakColor,
  terrainStylePreset,
  reliefStrength,
  coastlineEmphasis,
}) {
  const worker = getWorker();
  if (!worker) return Promise.reject(new Error("Tectonics terrain worker unavailable"));

  const requestId = nextRequestId;
  nextRequestId += 1;

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });
    try {
      worker.postMessage({
        id: requestId,
        model: serializeTerrainModel(model),
        width,
        height,
        mode,
        topographyBandStepM,
        topographyPeakColor,
        terrainStylePreset,
        reliefStrength,
        coastlineEmphasis,
      });
    } catch (error) {
      pendingRequests.delete(requestId);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export function disposeTectonicsTerrainWorker() {
  if (workerInstance) {
    try {
      workerInstance.terminate();
    } catch {}
  }
  workerInstance = null;
  workerBroken = false;
  rejectAllPending(new Error("Tectonics terrain worker disposed"));
}
