let celestialVisualPreviewModulePromise = null;

function loadCelestialVisualPreviewModule() {
  if (!celestialVisualPreviewModulePromise) {
    celestialVisualPreviewModulePromise = import("./celestialVisualPreview.js");
  }
  return celestialVisualPreviewModulePromise;
}

function hasPreviewRuntimeGlobals() {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof requestAnimationFrame === "function" &&
    typeof cancelAnimationFrame === "function"
  );
}

function canAttachPreviewCanvas(canvas) {
  return !!canvas && hasPreviewRuntimeGlobals() && canvas.isConnected !== false;
}

function safelyInvokeController(controller, methodName) {
  if (!controller) return true;
  if (!hasPreviewRuntimeGlobals()) return false;
  try {
    controller[methodName]?.();
    return true;
  } catch (error) {
    console.error(`[WorldSmith] Failed to ${methodName} celestial preview runtime:`, error);
    return false;
  }
}

export function createCelestialVisualPreviewController(options = {}) {
  let controller = null;
  let disposed = false;
  let attachSequence = 0;

  return {
    attach(canvas, model) {
      if (disposed || !canAttachPreviewCanvas(canvas)) return;
      const token = ++attachSequence;
      void loadCelestialVisualPreviewModule()
        .then((mod) => {
          if (disposed || token !== attachSequence || !canAttachPreviewCanvas(canvas)) return;
          controller ??= mod.createCelestialVisualPreviewController(options);
          try {
            controller.attach(canvas, model);
          } catch (error) {
            console.error("[WorldSmith] Failed to attach celestial preview runtime:", error);
          }
        })
        .catch((error) => {
          console.error("[WorldSmith] Failed to load celestial preview runtime:", error);
        });
    },

    detach() {
      attachSequence += 1;
      if (!safelyInvokeController(controller, "detach")) controller = null;
    },

    dispose() {
      disposed = true;
      attachSequence += 1;
      if (!controller) return;
      if (!safelyInvokeController(controller, "dispose")) {
        controller = null;
        return;
      }
      controller = null;
    },
  };
}

export async function renderCelestialRecipeBatch(items, onProgress, options) {
  const mod = await loadCelestialVisualPreviewModule();
  return mod.renderCelestialRecipeBatch(items, onProgress, options);
}
