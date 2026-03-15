export class GuidedSearchCanceledError extends Error {
  constructor(message = "Guided search canceled.") {
    super(message);
    this.name = "GuidedSearchCanceledError";
  }
}

function makeResult(payload = {}) {
  return {
    status: String(payload.status || "idle"),
    jobId: String(payload.jobId || ""),
    generation: Number.isFinite(Number(payload.generation)) ? Number(payload.generation) : 0,
    result: payload.result ?? null,
    error: payload.error || null,
    reason: String(payload.reason || ""),
  };
}

export function createGuidedSolverJobRunner({
  onStart = null,
  onComplete = null,
  onCancel = null,
  onError = null,
} = {}) {
  let activeJob = null;
  let generation = 0;
  let jobCounter = 0;

  function buildJobId() {
    jobCounter += 1;
    return `guided-search-${jobCounter}`;
  }

  function getActiveJob() {
    return activeJob ? { ...activeJob } : null;
  }

  function cancel(reason = "canceled") {
    if (!activeJob) return null;
    const canceled = makeResult({
      status: "canceled",
      jobId: activeJob.jobId,
      generation: activeJob.generation,
      reason,
    });
    activeJob.canceled = true;
    activeJob = null;
    if (typeof onCancel === "function") onCancel(canceled);
    return canceled;
  }

  function start(executor, { cancelReason = "superseded" } = {}) {
    if (typeof executor !== "function") {
      throw new TypeError("Guided search executor must be a function.");
    }

    if (activeJob) cancel(cancelReason);

    generation += 1;
    const jobId = buildJobId();
    const nextJob = {
      jobId,
      generation,
      canceled: false,
    };
    activeJob = nextJob;

    const controls = {
      jobId,
      generation,
      isCanceled() {
        return nextJob.canceled || !activeJob || activeJob.jobId !== jobId;
      },
      throwIfCanceled(message = "Guided search canceled.") {
        if (this.isCanceled()) throw new GuidedSearchCanceledError(message);
      },
    };

    const started = makeResult({
      status: "searching",
      jobId,
      generation,
    });
    if (typeof onStart === "function") onStart(started);

    const promise = Promise.resolve()
      .then(() => executor(controls))
      .then((result) => {
        if (controls.isCanceled()) {
          return makeResult({
            status: "stale",
            jobId,
            generation,
            result,
            reason: "superseded",
          });
        }

        activeJob = null;
        const completed = makeResult({
          status: "complete",
          jobId,
          generation,
          result,
        });
        if (typeof onComplete === "function") onComplete(completed);
        return completed;
      })
      .catch((error) => {
        const canceled = error instanceof GuidedSearchCanceledError || controls.isCanceled();
        if (canceled) {
          if (activeJob?.jobId === jobId) activeJob = null;
          return makeResult({
            status: "canceled",
            jobId,
            generation,
            reason: error?.message || "canceled",
          });
        }

        if (activeJob?.jobId === jobId) activeJob = null;
        const failed = makeResult({
          status: "error",
          jobId,
          generation,
          error,
          reason: error?.message || "error",
        });
        if (typeof onError === "function") onError(failed);
        return failed;
      });

    return {
      jobId,
      generation,
      promise,
    };
  }

  return {
    start,
    cancel,
    getActiveJob,
    getGeneration() {
      return generation;
    },
  };
}
