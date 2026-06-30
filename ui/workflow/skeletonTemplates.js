import { createElement } from "../domHelpers.js";
import {
  createSkeletonBlock,
  createSkeletonCanvas,
  createSkeletonKpiStrip,
  createSkeletonPanel,
  createSkeletonRegion,
  createSkeletonTable,
  createSkeletonText,
} from "./skeleton.js";

export const ROUTE_SKELETON_KIND_BY_ROUTE = Object.freeze({
  star: "authoring",
  planet: "authoring",
  moon: "authoring",
  tectonics: "authoring",
  climate: "authoring",
  population: "authoring",
  system: "system",
  outer: "system",
  calendar: "system",
  fate: "system",
  io: "system",
  viz: "visual",
  cluster: "visual",
  galaxy: "visual",
  "cluster-viz": "visual",
  apparent: "visual",
  science: "document",
  validation: "document",
  lessons: "document",
  about: "document",
});

function routeLabel(label) {
  return String(label || "page").trim() || "page";
}

export function getRouteSkeletonKind(routeKey) {
  return ROUTE_SKELETON_KIND_BY_ROUTE[routeKey] || "generic";
}

function createSkeletonHeader() {
  return createElement(
    "div",
    { className: "skeleton-page__header", attrs: { "aria-hidden": "true" } },
    [
      createElement("div", { className: "skeleton-page__title-group" }, [
        createSkeletonBlock({ className: "skeleton-page__icon", width: 34, height: 34, radius: 8 }),
        createElement("div", { className: "skeleton-page__title-lines" }, [
          createSkeletonBlock({ className: "skeleton-line", width: "44%", height: 18 }),
          createSkeletonBlock({ className: "skeleton-line", width: "72%", height: 10 }),
        ]),
      ]),
      createElement("div", { className: "skeleton-page__actions" }, [
        createSkeletonBlock({ className: "skeleton-page__button", width: 96, height: 34 }),
        createSkeletonBlock({ className: "skeleton-page__button", width: 72, height: 34 }),
      ]),
    ],
  );
}

function createAuthoringSkeletonBody() {
  return createElement("div", { className: "skeleton-page__body skeleton-page__body--authoring" }, [
    createElement("div", { className: "skeleton-page__cockpit" }, [
      createSkeletonPanel({ lines: 2, compact: true }),
      createSkeletonKpiStrip({ count: 4 }),
    ]),
    createElement(
      "div",
      { className: "skeleton-page__columns skeleton-page__columns--authoring" },
      [
        createElement("div", { className: "skeleton-page__sidebar" }, [
          createSkeletonPanel({ lines: 3 }),
          createSkeletonPanel({ lines: 4 }),
          createSkeletonPanel({ lines: 2, compact: true }),
        ]),
        createElement("div", { className: "skeleton-page__main" }, [
          createSkeletonCanvas({ aspectRatio: "16 / 9", label: "Loading preview" }),
          createSkeletonKpiStrip({ count: 6 }),
          createElement("div", { className: "skeleton-page__section-grid" }, [
            createSkeletonPanel({ lines: 3 }),
            createSkeletonPanel({ lines: 3 }),
          ]),
        ]),
      ],
    ),
  ]);
}

function createSystemSkeletonBody() {
  return createElement("div", { className: "skeleton-page__body skeleton-page__body--system" }, [
    createElement(
      "div",
      { className: "skeleton-page__action-bar", attrs: { "aria-hidden": "true" } },
      [
        createSkeletonBlock({ className: "skeleton-page__button", width: 112, height: 34 }),
        createSkeletonBlock({ className: "skeleton-page__button", width: 88, height: 34 }),
        createSkeletonBlock({ className: "skeleton-page__button", width: 132, height: 34 }),
      ],
    ),
    createElement("div", { className: "skeleton-page__columns skeleton-page__columns--system" }, [
      createElement("div", { className: "skeleton-page__main" }, [
        createSkeletonTable({ columns: 5, rows: 7 }),
        createSkeletonPanel({ lines: 3, compact: true }),
      ]),
      createElement("div", { className: "skeleton-page__sidebar" }, [
        createSkeletonPanel({ lines: 4 }),
        createSkeletonCanvas({ aspectRatio: "4 / 3", label: "Loading chart" }),
      ]),
    ]),
  ]);
}

function createVisualSkeletonBody() {
  return createElement("div", { className: "skeleton-page__body skeleton-page__body--visual" }, [
    createElement(
      "div",
      { className: "skeleton-page__toolbar", attrs: { "aria-hidden": "true" } },
      [
        createSkeletonBlock({ className: "skeleton-page__button", width: 92, height: 32 }),
        createSkeletonBlock({ className: "skeleton-page__button", width: 108, height: 32 }),
        createSkeletonBlock({ className: "skeleton-page__button", width: 76, height: 32 }),
      ],
    ),
    createElement("div", { className: "skeleton-page__columns skeleton-page__columns--visual" }, [
      createElement("div", { className: "skeleton-page__main" }, [
        createSkeletonCanvas({ aspectRatio: "16 / 9", label: "Loading visual surface" }),
        createSkeletonText({ lines: 2, widths: ["84%", "52%"] }),
      ]),
      createElement("div", { className: "skeleton-page__sidebar" }, [
        createSkeletonPanel({ lines: 4 }),
        createSkeletonPanel({ lines: 3, compact: true }),
      ]),
    ]),
  ]);
}

function createDocumentSkeletonBody() {
  return createElement("div", { className: "skeleton-page__body skeleton-page__body--document" }, [
    createElement(
      "div",
      { className: "skeleton-page__search-row", attrs: { "aria-hidden": "true" } },
      [
        createSkeletonBlock({ className: "skeleton-page__search", width: "48%", height: 38 }),
        createSkeletonBlock({ className: "skeleton-page__button", width: 96, height: 34 }),
      ],
    ),
    createElement("div", { className: "skeleton-page__columns skeleton-page__columns--document" }, [
      createElement("div", { className: "skeleton-page__main" }, [
        createSkeletonPanel({ lines: 4 }),
        createSkeletonPanel({ lines: 5 }),
        createSkeletonTable({ columns: 4, rows: 5 }),
      ]),
      createElement("div", { className: "skeleton-page__sidebar" }, [
        createSkeletonPanel({ lines: 5, compact: true }),
        createSkeletonPanel({ lines: 3, compact: true }),
      ]),
    ]),
  ]);
}

function createGenericSkeletonBody() {
  return createElement("div", { className: "skeleton-page__body skeleton-page__body--generic" }, [
    createSkeletonPanel({ lines: 4 }),
    createSkeletonKpiStrip({ count: 3 }),
    createSkeletonTable({ columns: 3, rows: 4 }),
  ]);
}

const BODY_FACTORY_BY_KIND = Object.freeze({
  authoring: createAuthoringSkeletonBody,
  system: createSystemSkeletonBody,
  visual: createVisualSkeletonBody,
  document: createDocumentSkeletonBody,
  generic: createGenericSkeletonBody,
});

export function createDenseScienceSkeleton({ label = "Loading science details" } = {}) {
  return createSkeletonRegion({
    label,
    className: "skeleton-dense-science",
    children: [
      createSkeletonKpiStrip({ count: 4 }),
      createElement("div", { className: "skeleton-page__section-grid" }, [
        createSkeletonPanel({ lines: 4 }),
        createSkeletonPanel({ lines: 4 }),
        createSkeletonPanel({ lines: 3 }),
      ]),
    ],
  });
}

export function createTimelineSkeleton({ label = "Loading timeline" } = {}) {
  return createSkeletonRegion({
    label,
    className: "skeleton-timeline",
    children: [
      createSkeletonBlock({ className: "skeleton-timeline__track", width: "100%", height: 44 }),
      createSkeletonTable({ columns: 4, rows: 4 }),
    ],
  });
}

export function createRouteSkeleton(routeKey, label) {
  const kind = getRouteSkeletonKind(routeKey);
  const bodyFactory = BODY_FACTORY_BY_KIND[kind] || BODY_FACTORY_BY_KIND.generic;
  const readableLabel = routeLabel(label);
  const root = createSkeletonRegion({
    label: `Loading ${readableLabel}`,
    className: `skeleton-page skeleton-page--${kind} page workflow-page-shell`,
    children: [
      createElement("div", { className: "panel skeleton-page__panel" }, [
        createSkeletonHeader(),
        createElement("div", { className: "panel__body skeleton-page__panel-body" }, [
          bodyFactory(),
        ]),
      ]),
    ],
  });
  root.dataset.routeSkeleton = routeKey || "fallback";
  root.dataset.routeSkeletonKind = kind;
  return root;
}
