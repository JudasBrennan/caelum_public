let systemPosterModulePromise = null;
const SYSTEM_POSTER_STATE = new WeakMap();

function loadSystemPosterModule() {
  if (!systemPosterModulePromise) {
    systemPosterModulePromise = import("./systemPosterNativeThree.js");
  }
  return systemPosterModulePromise;
}

function hasPosterRuntimeGlobals() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function canDrawPosterCanvas(canvas) {
  return !!canvas && hasPosterRuntimeGlobals() && canvas.isConnected !== false;
}

function getPosterState(canvas) {
  let state = SYSTEM_POSTER_STATE.get(canvas);
  if (!state) {
    state = { generation: 0, disposed: false };
    SYSTEM_POSTER_STATE.set(canvas, state);
  }
  return state;
}

export function drawSystemPosterNative(canvas, data, opts = {}, onReady = null) {
  if (!canDrawPosterCanvas(canvas)) return;
  const state = getPosterState(canvas);
  state.disposed = false;
  const token = ++state.generation;
  void loadSystemPosterModule()
    .then((mod) => {
      if (state.disposed || state.generation !== token || !canDrawPosterCanvas(canvas)) return;
      mod.drawSystemPosterNative(
        canvas,
        data,
        opts,
        typeof onReady === "function"
          ? (...args) => {
              if (state.disposed || state.generation !== token || !canDrawPosterCanvas(canvas)) {
                return;
              }
              onReady(...args);
            }
          : null,
      );
    })
    .catch((error) => {
      console.error("[WorldSmith] Failed to load system poster runtime:", error);
    });
}

export function disposeSystemPosterNative(canvas) {
  if (!canvas) return;
  const state = getPosterState(canvas);
  state.disposed = true;
  const token = ++state.generation;
  if (!systemPosterModulePromise) return;
  void systemPosterModulePromise
    .then((mod) => {
      if (state.generation !== token) return;
      mod.disposeSystemPosterNative(canvas);
    })
    .catch(() => {
      // Ignore dispose errors if the poster runtime failed to load.
    });
}
