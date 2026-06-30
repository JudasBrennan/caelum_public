import { createSkeletonCanvas } from "../workflow/skeleton.js";

export function mountCanvasLoadingSkeleton(
  container,
  { id = "", label = "Loading visual surface", className = "" } = {},
) {
  if (!container) return () => {};
  const skeleton = createSkeletonCanvas({ aspectRatio: "16 / 9", label, className });
  if (id) skeleton.id = id;
  container.appendChild(skeleton);
  return () => {
    if (skeleton.hidden) return;
    skeleton.hidden = true;
    skeleton.setAttribute("aria-busy", "false");
  };
}

export function mountVisualizerCanvasLoadingSkeleton(container) {
  return mountCanvasLoadingSkeleton(container, {
    id: "viz-canvas-skeleton",
    label: "Loading visual surface",
    className: "viz-canvas-skeleton",
  });
}
