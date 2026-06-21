import { solveRockyBodyComposition } from "../rockyBodyComposition.js";

export function compositionFromDensity(densityGcm3, options = {}) {
  return solveRockyBodyComposition({
    bodyType: "moon",
    densityGcm3,
    ...options,
  });
}

export function compositionFromClass(className, options = {}) {
  const composition = solveRockyBodyComposition({
    bodyType: "moon",
    compositionOverride: className,
    ...options,
  });
  return composition || null;
}
