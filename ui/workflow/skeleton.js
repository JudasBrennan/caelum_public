import { createElement } from "../domHelpers.js";

const DEFAULT_TEXT_WIDTHS = Object.freeze(["72%", "100%", "48%"]);

function styleValue(value) {
  if (value == null || value === "") return "";
  return typeof value === "number" ? `${value}px` : String(value);
}

function applySizeStyles(node, { width = "", height = "", radius = "", aspectRatio = "" } = {}) {
  const styles = [];
  const resolvedWidth = styleValue(width);
  const resolvedHeight = styleValue(height);
  const resolvedRadius = styleValue(radius);
  const resolvedAspectRatio = styleValue(aspectRatio);
  if (resolvedWidth) styles.push(`--skeleton-width:${resolvedWidth}`);
  if (resolvedHeight) styles.push(`--skeleton-height:${resolvedHeight}`);
  if (resolvedRadius) styles.push(`--skeleton-radius:${resolvedRadius}`);
  if (resolvedAspectRatio) styles.push(`--skeleton-aspect-ratio:${resolvedAspectRatio}`);
  if (styles.length) node.setAttribute("style", styles.join(";"));
  return node;
}

/**
 * Skeleton policy:
 * - Use these helpers when final layout is known but content is not ready.
 * - Use progress/status UI instead when a user-triggered operation has meaningful steps.
 * - Keep decorative skeleton pieces aria-hidden and put one readable loading label on the region.
 */
export function createSkeletonBlock({
  className = "",
  width = "",
  height = "",
  radius = "",
  ariaHidden = true,
} = {}) {
  const node = createElement("div", {
    className: `skeleton skeleton-block ${className}`.trim(),
    attrs: ariaHidden ? { "aria-hidden": "true" } : {},
  });
  return applySizeStyles(node, { width, height, radius });
}

export function createSkeletonText({
  lines = 3,
  widths = DEFAULT_TEXT_WIDTHS,
  className = "",
} = {}) {
  const count = Math.max(1, Math.min(8, Number(lines) || 1));
  const resolvedWidths = Array.isArray(widths) && widths.length ? widths : DEFAULT_TEXT_WIDTHS;
  return createElement(
    "div",
    { className: `skeleton-text ${className}`.trim(), attrs: { "aria-hidden": "true" } },
    Array.from({ length: count }, (_, index) =>
      createSkeletonBlock({
        className: "skeleton-line",
        width: resolvedWidths[index % resolvedWidths.length],
        height: index === 0 ? 12 : 10,
      }),
    ),
  );
}

export function createSkeletonKpiStrip({ count = 4, className = "" } = {}) {
  const cardCount = Math.max(1, Math.min(8, Number(count) || 1));
  return createElement(
    "div",
    { className: `skeleton-kpi-strip ${className}`.trim(), attrs: { "aria-hidden": "true" } },
    Array.from({ length: cardCount }, () =>
      createElement("div", { className: "skeleton-card skeleton-kpi" }, [
        createSkeletonBlock({ className: "skeleton-line", width: "54%", height: 10 }),
        createSkeletonBlock({ className: "skeleton-line", width: "82%", height: 18 }),
        createSkeletonBlock({ className: "skeleton-line", width: "44%", height: 9 }),
      ]),
    ),
  );
}

export function createSkeletonTable({ columns = 4, rows = 6, className = "" } = {}) {
  const colCount = Math.max(1, Math.min(8, Number(columns) || 1));
  const rowCount = Math.max(1, Math.min(12, Number(rows) || 1));
  const makeRow = (rowIndex) =>
    createElement(
      "div",
      {
        className:
          `skeleton-table__row ${rowIndex === 0 ? "skeleton-table__row--head" : ""}`.trim(),
      },
      Array.from({ length: colCount }, (_, colIndex) =>
        createSkeletonBlock({
          className: "skeleton-line",
          width: rowIndex === 0 ? "68%" : colIndex % 2 ? "84%" : "58%",
          height: rowIndex === 0 ? 11 : 10,
        }),
      ),
    );
  return createElement(
    "div",
    {
      className: `skeleton-table ${className}`.trim(),
      attrs: { "aria-hidden": "true", style: `--skeleton-columns:${colCount}` },
    },
    Array.from({ length: rowCount + 1 }, (_, index) => makeRow(index)),
  );
}

export function createSkeletonCanvas({
  aspectRatio = "16 / 9",
  label = "Loading preview",
  className = "",
} = {}) {
  const frame = createElement("div", {
    className: `skeleton-canvas ${className}`.trim(),
    attrs: {
      role: "status",
      "aria-busy": "true",
      "aria-label": label,
    },
  });
  applySizeStyles(frame, { aspectRatio });
  frame.appendChild(createSkeletonBlock({ className: "skeleton-canvas__surface" }));
  frame.appendChild(createElement("span", { className: "sr-only", text: label }));
  return frame;
}

export function createSkeletonPanel({ lines = 3, className = "", compact = false } = {}) {
  return createElement("div", { className: `skeleton-card skeleton-panel ${className}`.trim() }, [
    createSkeletonBlock({ className: "skeleton-line", width: compact ? "38%" : "48%", height: 14 }),
    createSkeletonText({
      lines,
      widths: compact ? ["78%", "54%"] : ["92%", "72%", "44%"],
    }),
  ]);
}

export function createSkeletonRegion({
  label = "Loading content",
  className = "",
  children = [],
} = {}) {
  return createElement(
    "div",
    {
      className: `skeleton-region ${className}`.trim(),
      attrs: {
        role: "status",
        "aria-busy": "true",
        "aria-label": label,
      },
    },
    [createElement("span", { className: "sr-only", text: label }), children],
  );
}

export function armDelayedSkeleton(show, options = {}) {
  const {
    delayMs = 120,
    setTimeoutFn = globalThis.window?.setTimeout?.bind(globalThis.window) || setTimeout,
    clearTimeoutFn = globalThis.window?.clearTimeout?.bind(globalThis.window) || clearTimeout,
  } = options;
  let shown = false;
  const timerId = setTimeoutFn(
    () => {
      shown = true;
      show?.();
    },
    Math.max(0, Number(delayMs) || 0),
  );
  return {
    cancel() {
      clearTimeoutFn(timerId);
    },
    get shown() {
      return shown;
    },
  };
}
