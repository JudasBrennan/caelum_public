import { createSkeletonCanvas } from "./workflow/skeleton.js";

let celestialVisualPreviewModulePromise = null;
const PREVIEW_SKELETONS = new WeakMap();

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

function showPreviewSkeleton(canvas) {
  const parent = canvas?.parentElement;
  if (!parent) return;
  const existing = PREVIEW_SKELETONS.get(canvas);
  if (existing?.isConnected) {
    existing.hidden = false;
    existing.setAttribute("aria-busy", "true");
    return;
  }
  const skeleton = createSkeletonCanvas({
    aspectRatio: "1 / 1",
    label: "Loading visual preview",
    className: "celestial-preview-skeleton",
  });
  try {
    if (globalThis.getComputedStyle?.(parent).position === "static") {
      parent.style.position = "relative";
    }
  } catch {}
  PREVIEW_SKELETONS.set(canvas, skeleton);
  parent.appendChild(skeleton);
}

function clearPreviewSkeleton(canvas) {
  const skeleton = PREVIEW_SKELETONS.get(canvas);
  if (!skeleton) return;
  skeleton.hidden = true;
  skeleton.setAttribute("aria-busy", "false");
}

export function createCelestialVisualPreviewController(options = {}) {
  let controller = null;
  let disposed = false;
  let attachSequence = 0;
  let attachedCanvas = null;

  return {
    attach(canvas, model) {
      if (disposed || !canAttachPreviewCanvas(canvas)) return;
      const token = ++attachSequence;
      if (attachedCanvas && attachedCanvas !== canvas) clearPreviewSkeleton(attachedCanvas);
      attachedCanvas = canvas;
      showPreviewSkeleton(canvas);
      void loadCelestialVisualPreviewModule()
        .then((mod) => {
          if (disposed || token !== attachSequence || !canAttachPreviewCanvas(canvas)) return;
          controller ??= mod.createCelestialVisualPreviewController(options);
          try {
            controller.attach(canvas, model);
            clearPreviewSkeleton(canvas);
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
      clearPreviewSkeleton(attachedCanvas);
      attachedCanvas = null;
      if (!safelyInvokeController(controller, "detach")) controller = null;
    },

    dispose() {
      disposed = true;
      attachSequence += 1;
      clearPreviewSkeleton(attachedCanvas);
      attachedCanvas = null;
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
