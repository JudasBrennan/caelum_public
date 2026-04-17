import {
  requestCelestialTextureBundle,
  normalizeWorkerTextureBundle,
  supportsCelestialTextureWorker,
} from "./celestialTextureWorkerClient.js";
import {
  recordCelestialTextureFulfillment,
  updateCelestialPerfQueueState,
} from "./celestialPerfDebug.js";

const PRIORITY_RANK = Object.freeze({
  high: 0,
  medium: 1,
  low: 2,
});

const DEFAULT_WORKER_CONCURRENCY = 2;
const DEFAULT_LOCAL_CONCURRENCY = 1;
const CANCELED_ERROR_NAME = "CelestialTextureJobCanceledError";

export class CelestialTextureJobCanceledError extends Error {
  constructor(message = "Celestial texture job canceled") {
    super(message);
    this.name = CANCELED_ERROR_NAME;
  }
}

export function isCelestialTextureJobCanceledError(error) {
  return error instanceof CelestialTextureJobCanceledError || error?.name === CANCELED_ERROR_NAME;
}

function normalizePriority(priority) {
  const value = String(priority || "medium").toLowerCase();
  return value in PRIORITY_RANK ? value : "medium";
}

function priorityRank(priority) {
  return PRIORITY_RANK[normalizePriority(priority)];
}

function buildJobKey(signature, textureSize) {
  const sig = String(signature || "");
  const size = Math.max(1, Number(textureSize) || 0);
  return `${sig}:${size}`;
}

function shouldContinueWork(guard) {
  return typeof guard !== "function" || guard();
}

function hasActiveConsumers(job) {
  return job.consumers.some(
    (consumer) => !consumer.settled && shouldContinueWork(consumer.shouldContinue),
  );
}

function settleConsumers(job, resolver, rejecter = null) {
  for (const consumer of job.consumers) {
    if (consumer.settled) continue;
    consumer.settled = true;
    if (!shouldContinueWork(consumer.shouldContinue)) {
      consumer.reject(new CelestialTextureJobCanceledError());
      continue;
    }
    if (resolver) {
      consumer.resolve(resolver);
      continue;
    }
    if (rejecter) {
      consumer.reject(rejecter);
      continue;
    }
    consumer.reject(new Error("Celestial texture job completed without a result"));
  }
  job.consumers.length = 0;
}

function removeQueuedJob(queue, job) {
  const idx = queue.indexOf(job);
  if (idx >= 0) queue.splice(idx, 1);
}

function pushQueuedJob(queue, job) {
  removeQueuedJob(queue, job);
  const rank = priorityRank(job.priority);
  let inserted = false;
  for (let i = 0; i < queue.length; i += 1) {
    if (rank < priorityRank(queue[i].priority)) {
      queue.splice(i, 0, job);
      inserted = true;
      break;
    }
  }
  if (!inserted) queue.push(job);
}

async function requestWorkerMapsDefault({ signature, descriptor, textureSize }) {
  const result = await requestCelestialTextureBundle({ signature, descriptor, textureSize });
  const workerMaps = normalizeWorkerTextureBundle(result);
  if (!workerMaps.surface || !workerMaps.cloud || !workerMaps.normal) {
    throw new Error("Worker payload missing required texture maps");
  }
  return workerMaps;
}

export function createCelestialTextureJobQueue(options = {}) {
  const maxWorkerConcurrency = Math.max(
    1,
    Number(options.maxWorkerConcurrency) || DEFAULT_WORKER_CONCURRENCY,
  );
  const maxLocalConcurrency = Math.max(
    1,
    Number(options.maxLocalConcurrency) || DEFAULT_LOCAL_CONCURRENCY,
  );
  const supportsWorker =
    typeof options.supportsWorker === "function"
      ? options.supportsWorker
      : supportsCelestialTextureWorker;
  const requestWorkerMaps =
    typeof options.requestWorkerTextureBundle === "function"
      ? options.requestWorkerTextureBundle
      : requestWorkerMapsDefault;
  const reserveWorkerSlotForLowPriority =
    options.reserveWorkerSlotForLowPriority !== false && maxWorkerConcurrency > 1;

  const jobsByKey = new Map();
  const workerQueue = [];
  const localQueue = [];
  let activeWorkerCount = 0;
  let activeLocalCount = 0;
  let disposed = false;

  function publishQueueMetrics() {
    updateCelestialPerfQueueState(options.perfQueueName || "celestialTextureJobs", snapshot());
  }

  function finalizeJob(job, maps) {
    jobsByKey.delete(job.key);
    job.status = "done";
    recordCelestialTextureFulfillment(job.lane === "worker" ? "worker" : "localFallback", {
      scope: job.perfScope,
    });
    settleConsumers(job, maps, null);
    publishQueueMetrics();
  }

  function failJob(job, error) {
    jobsByKey.delete(job.key);
    job.status = "done";
    settleConsumers(job, null, error instanceof Error ? error : new Error(String(error)));
    publishQueueMetrics();
  }

  function cancelQueuedJob(job) {
    jobsByKey.delete(job.key);
    removeQueuedJob(workerQueue, job);
    removeQueuedJob(localQueue, job);
    job.status = "done";
    settleConsumers(job, null, new CelestialTextureJobCanceledError());
    publishQueueMetrics();
  }

  function canStartQueuedWorkerJob(job) {
    if (!job || normalizePriority(job.priority) !== "low") return true;
    if (!reserveWorkerSlotForLowPriority) return true;
    return activeWorkerCount < maxWorkerConcurrency - 1;
  }

  function pumpQueues() {
    if (disposed) return;
    while (activeWorkerCount < maxWorkerConcurrency && workerQueue.length) {
      const job = workerQueue[0];
      if (!canStartQueuedWorkerJob(job)) break;
      workerQueue.shift();
      if (!job || job.status !== "queued") continue;
      if (!hasActiveConsumers(job)) {
        cancelQueuedJob(job);
        continue;
      }
      activeWorkerCount += 1;
      job.status = "running";
      Promise.resolve()
        .then(() =>
          requestWorkerMaps({
            signature: job.signature,
            descriptor: job.descriptor,
            textureSize: job.textureSize,
          }),
        )
        .then((maps) => {
          finalizeJob(job, maps);
        })
        .catch((error) => {
          if (typeof job.localFactory === "function") {
            job.status = "queued";
            job.lane = "local";
            pushQueuedJob(localQueue, job);
          } else {
            failJob(job, error);
          }
        })
        .finally(() => {
          activeWorkerCount = Math.max(0, activeWorkerCount - 1);
          publishQueueMetrics();
          pumpQueues();
        });
      publishQueueMetrics();
    }

    while (activeLocalCount < maxLocalConcurrency && localQueue.length) {
      const job = localQueue.shift();
      if (!job || job.status !== "queued") continue;
      if (!hasActiveConsumers(job)) {
        cancelQueuedJob(job);
        continue;
      }
      activeLocalCount += 1;
      job.status = "running";
      Promise.resolve()
        .then(() => job.localFactory(job.descriptor, job.textureSize))
        .then((maps) => {
          if (!maps?.surface || !maps?.cloud || !maps?.normal) {
            throw new Error("Local texture generation returned incomplete maps");
          }
          finalizeJob(job, maps);
        })
        .catch((error) => {
          failJob(job, error);
        })
        .finally(() => {
          activeLocalCount = Math.max(0, activeLocalCount - 1);
          publishQueueMetrics();
          pumpQueues();
        });
      publishQueueMetrics();
    }
  }

  function attachConsumer(job, shouldContinue) {
    return new Promise((resolve, reject) => {
      job.consumers.push({
        resolve,
        reject,
        shouldContinue,
        settled: false,
      });
    });
  }

  function requestTextureMaps(request = {}) {
    if (disposed) {
      return Promise.reject(new Error("Celestial texture job queue disposed"));
    }
    const signature = String(request.signature || "");
    const textureSize = Math.max(1, Number(request.textureSize) || 0);
    if (!signature || !textureSize) {
      return Promise.reject(
        new Error("Celestial texture job requires a signature and textureSize"),
      );
    }
    const localFactory = typeof request.localFactory === "function" ? request.localFactory : null;
    const allowWorker = request.allowWorker !== false;
    const priority = normalizePriority(request.priority);
    const key = buildJobKey(signature, textureSize);

    let job = jobsByKey.get(key);
    if (job) {
      if (localFactory && !job.localFactory) job.localFactory = localFactory;
      if (request.perfScope && !job.perfScope) job.perfScope = request.perfScope;
      if (priorityRank(priority) < priorityRank(job.priority)) {
        job.priority = priority;
        if (job.status === "queued") {
          if (job.lane === "worker") pushQueuedJob(workerQueue, job);
          else pushQueuedJob(localQueue, job);
        }
      }
      publishQueueMetrics();
      return attachConsumer(job, request.shouldContinue);
    }

    const lane = allowWorker && supportsWorker() ? "worker" : "local";
    if (lane === "local" && !localFactory) {
      return Promise.reject(
        new Error(
          "Celestial texture job requires a localFactory when worker generation is unavailable",
        ),
      );
    }

    job = {
      key,
      signature,
      descriptor: request.descriptor || null,
      textureSize,
      priority,
      lane,
      localFactory,
      perfScope: String(request.perfScope || ""),
      consumers: [],
      status: "queued",
    };
    jobsByKey.set(key, job);
    const promise = attachConsumer(job, request.shouldContinue);
    if (lane === "worker") pushQueuedJob(workerQueue, job);
    else pushQueuedJob(localQueue, job);
    publishQueueMetrics();
    pumpQueues();
    return promise;
  }

  function dispose(reason = "Celestial texture job queue disposed") {
    disposed = true;
    const error = new Error(String(reason));
    for (const job of jobsByKey.values()) {
      job.status = "done";
      settleConsumers(job, null, error);
    }
    jobsByKey.clear();
    workerQueue.length = 0;
    localQueue.length = 0;
    activeWorkerCount = 0;
    activeLocalCount = 0;
    publishQueueMetrics();
  }

  function snapshot() {
    return {
      activeWorkerCount,
      activeLocalCount,
      workerQueue: workerQueue.map((job) => ({ key: job.key, priority: job.priority })),
      localQueue: localQueue.map((job) => ({ key: job.key, priority: job.priority })),
      totalJobs: jobsByKey.size,
      disposed,
      reserveWorkerSlotForLowPriority,
    };
  }

  return {
    requestTextureMaps,
    dispose,
    snapshot,
  };
}

const defaultQueue = createCelestialTextureJobQueue();
updateCelestialPerfQueueState("celestialTextureJobs", defaultQueue.snapshot());

export function requestQueuedCelestialTextureMaps(request = {}) {
  return defaultQueue.requestTextureMaps(request);
}

export function disposeCelestialTextureJobQueue() {
  defaultQueue.dispose();
}
