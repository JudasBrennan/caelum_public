export function prefersReducedMotion() {
  try {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  } catch {
    return false;
  }
}

export function getPreferredScrollBehavior(defaultBehavior = "smooth") {
  return prefersReducedMotion() ? "auto" : defaultBehavior;
}

export function scrollIntoViewRespectingMotion(target, options = {}) {
  if (!target?.scrollIntoView) return;
  target.scrollIntoView({
    ...options,
    behavior: getPreferredScrollBehavior(options.behavior || "smooth"),
  });
}
