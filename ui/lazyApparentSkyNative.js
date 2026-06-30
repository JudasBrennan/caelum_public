let apparentSkyModulePromise = null;
const APPARENT_SKY_STATE = new WeakMap();

function loadApparentSkyModule() {
  if (!apparentSkyModulePromise) {
    apparentSkyModulePromise = import("./apparentSkyNativeThree.js");
  }
  return apparentSkyModulePromise;
}

function hasSkyRuntimeGlobals() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function canDrawSkyCanvas(canvas) {
  return !!canvas && hasSkyRuntimeGlobals() && canvas.isConnected !== false;
}

function getSkyState(canvas) {
  let state = APPARENT_SKY_STATE.get(canvas);
  if (!state) {
    state = { generation: 0, disposed: false };
    APPARENT_SKY_STATE.set(canvas, state);
  }
  return state;
}

export function drawSkyCanvasNative(
  canvas,
  model,
  starColorHex,
  skyMode,
  moonPhaseDeg,
  skyPalette,
  starMeta,
  companionStars,
  options = {},
  onReady = null,
) {
  if (!canDrawSkyCanvas(canvas)) return;
  const state = getSkyState(canvas);
  state.disposed = false;
  const token = ++state.generation;
  void loadApparentSkyModule()
    .then((mod) => {
      if (state.disposed || state.generation !== token || !canDrawSkyCanvas(canvas)) return;
      mod.drawSkyCanvasNative(
        canvas,
        model,
        starColorHex,
        skyMode,
        moonPhaseDeg,
        skyPalette,
        starMeta,
        companionStars,
        options,
        typeof onReady === "function"
          ? (...args) => {
              if (state.disposed || state.generation !== token || !canDrawSkyCanvas(canvas)) {
                return;
              }
              onReady(...args);
            }
          : null,
      );
    })
    .catch((error) => {
      console.error("[WorldSmith] Failed to load apparent-sky runtime:", error);
    });
}

export function disposeSkyCanvasNative(canvas) {
  if (!canvas) return;
  const state = getSkyState(canvas);
  state.disposed = true;
  const token = ++state.generation;
  if (!apparentSkyModulePromise) return;
  void apparentSkyModulePromise
    .then((mod) => {
      if (state.generation !== token) return;
      mod.disposeSkyCanvasNative(canvas);
    })
    .catch(() => {
      // Ignore dispose errors if the apparent-sky runtime failed to load.
    });
}
