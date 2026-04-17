import { appendChildren, createElement } from "../domHelpers.js";
import { tipIconNode } from "../tooltip.js";
import { buildQuadLayoutCardDescriptors, buildTopologyCardDescriptors } from "./topologyModel.js";

function buildTopologyNodeBadgeRow({ selected = false, defaultHost = false } = {}) {
  if (!selected && !defaultHost) return null;
  return createElement("span", { className: "star-topology-node__badge-row" }, [
    selected
      ? createElement("span", {
          className: "star-topology-node__editor-badge",
          text: "Editing",
        })
      : null,
    defaultHost
      ? createElement("span", {
          className: "star-topology-node__host-badge",
          text: "Default host",
        })
      : null,
  ]);
}

const TOPOLOGY_MAP_LEGEND_ROWS = [
  {
    id: "type",
    label: "Node type",
    tip: "Node type explains what the host frame is. Star nodes are S-type hosts around one star. Pair nodes are P-type hosts around a shared barycentre.",
    items: [
      {
        id: "star",
        label: "Star host",
        detail: "S-type",
        tokenKind: "star",
        tokenText: "A",
        tip: "Star host: a single-star host frame. If you choose Star A, B, C, or D as the default orbit host, newly added planets, gas giants, and debris will orbit that individual star.",
      },
      {
        id: "pair",
        label: "Pair host",
        detail: "P-type",
        tokenKind: "pair",
        tokenText: "A+B",
        tip: "Pair host: a barycentric host frame for a bound stellar pair. If you choose A+B, C+D, or the root pair as the default orbit host, newly added bodies orbit the pair's shared barycentre rather than a single star.",
      },
    ],
  },
  {
    id: "state",
    label: "State",
    tip: "State markers show which target is currently active for editing and which host frame is used by default for new bodies. Only one node is marked as Editing at a time.",
    items: [
      {
        id: "editing",
        label: "Editing",
        detail: "editor open below",
        badgeKind: "editing",
        tip: "Editing: the node's editor panel is currently visible below. Only one node is marked as the active editing focus at a time.",
      },
      {
        id: "default",
        label: "Outline",
        detail: "default orbit host",
        tokenKind: "star",
        tokenText: "A",
        defaultHost: true,
        tip: "Outline: the default orbit host for newly added planets, gas giants, and debris. It highlights where new bodies start by default and does not move any existing bodies already in the system.",
      },
    ],
  },
];

function createTopologyLegendToken(item) {
  if (item.badgeKind === "editing") {
    return createElement("span", { className: "star-topology-map__legend-badge" }, [
      createElement("span", {
        className: "star-topology-node__editor-badge",
        text: "Editing",
      }),
    ]);
  }

  return createElement(
    "span",
    {
      className: `star-topology-map__legend-token star-topology-map__legend-token--${item.tokenKind || "star"}`,
      attrs: {
        "aria-hidden": "true",
        "data-default-host": item.defaultHost ? "true" : "false",
      },
    },
    item.tokenText,
  );
}

function createTopologyLegendItem(item) {
  return createElement(
    "span",
    {
      className: "star-topology-map__legend-item",
      attrs: {
        tabindex: "0",
        role: "note",
        "data-tip": item.tip,
      },
    },
    [
      createTopologyLegendToken(item),
      createElement("span", { className: "star-topology-map__legend-copy" }, [
        createElement("span", {
          className: "star-topology-map__legend-label",
          text: item.label,
        }),
        createElement("span", {
          className: "star-topology-map__legend-detail",
          text: item.detail,
        }),
      ]),
    ],
  );
}

function createTopologyLegendRow(row) {
  return createElement("div", { className: "star-topology-map__legend-row" }, [
    createElement("span", { className: "star-topology-map__legend-heading" }, [
      createElement("span", { text: row.label }),
      tipIconNode(row.tip),
    ]),
    createElement(
      "div",
      { className: "star-topology-map__legend-items" },
      row.items.map((item) => createTopologyLegendItem(item)),
    ),
  ]);
}

export function createArchitectureCard(card, selected, kind) {
  const buttonEl = createElement("button", {
    attrs: {
      id: card.id,
      type: "button",
      "data-architecture-kind": kind,
      "data-value": card.value,
      "aria-pressed": selected ? "true" : "false",
      "aria-label": `${card.title}. ${card.formula}. ${card.meaning}`,
    },
    className: `star-architecture-card${selected ? " is-selected" : ""}`,
  });
  buttonEl.append(
    createElement("div", { className: "star-architecture-card__title", text: card.title }),
    createElement("div", { className: "star-architecture-card__formula", text: card.formula }),
    createElement("div", { className: "star-architecture-card__meaning", text: card.meaning }),
    createElement("div", { className: "star-architecture-card__summary", text: card.summary }),
  );
  return buttonEl;
}

export function createSvgElement(tagName, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    node.setAttribute(key, String(value));
  }
  return node;
}

export function createEditorTargetPill(targetDescriptor, selected) {
  const buttonEl = createElement("button", {
    attrs: {
      type: "button",
      "data-editor-target-id": targetDescriptor.id,
      "data-editor-target-kind": targetDescriptor.kind,
      "aria-pressed": selected ? "true" : "false",
    },
    className: `star-editor-inspector__pill${selected ? " is-selected" : ""}`,
  });
  appendChildren(buttonEl, [
    createElement("span", {
      className: "star-editor-inspector__pill-label",
      text: targetDescriptor.pillLabel,
    }),
    createElement("span", {
      className: "star-editor-inspector__pill-summary",
      text: targetDescriptor.pillSummary,
    }),
    targetDescriptor.statusLabel
      ? createElement("span", {
          className: "star-editor-inspector__pill-status",
          attrs: { "data-status": targetDescriptor.status || "good" },
          text: targetDescriptor.statusLabel,
        })
      : null,
  ]);
  return buttonEl;
}

export function renderArchitectureCards({
  draftState = {},
  topologyCardGridEl,
  quadLayoutCardGridEl,
  topologyHintEl,
  quadLayoutHintEl,
} = {}) {
  const topologyCards = buildTopologyCardDescriptors(draftState);
  topologyCardGridEl.replaceChildren(
    ...topologyCards.map((card) =>
      createArchitectureCard(card, draftState.topologyKind === card.value, "topology"),
    ),
  );
  const selectedTopologyCard =
    topologyCards.find((card) => card.value === draftState.topologyKind) ||
    topologyCards[0] ||
    null;
  if (topologyHintEl) topologyHintEl.textContent = selectedTopologyCard?.detail || "";

  const quadLayoutCards = buildQuadLayoutCardDescriptors();
  quadLayoutCardGridEl.replaceChildren(
    ...quadLayoutCards.map((card) =>
      createArchitectureCard(card, draftState.quadLayoutKind === card.value, "quad-layout"),
    ),
  );
  const selectedQuadLayoutCard =
    quadLayoutCards.find((card) => card.value === draftState.quadLayoutKind) ||
    quadLayoutCards[0] ||
    null;
  if (quadLayoutHintEl) {
    quadLayoutHintEl.textContent =
      selectedQuadLayoutCard?.hint || selectedQuadLayoutCard?.detail || "";
  }
}

export function renderTopologyMap({
  topologyMapCanvasEl,
  topologyMapSvgEl,
  topologyMapNodesEl,
  topologyMapHealthChipsEl,
  topologyMapLegendEl,
  topologyMapSummaryEl,
  topologyMapModel,
  pendingFocusId = null,
} = {}) {
  topologyMapCanvasEl.dataset.layout = topologyMapModel.layoutKey;
  topologyMapCanvasEl.style.minHeight = `${topologyMapModel.minHeightPx}px`;

  topologyMapSvgEl.replaceChildren(
    ...topologyMapModel.edges
      .filter((edge) => edge.fromNode && edge.toNode)
      .map((edge) =>
        createSvgElement("line", {
          class: "star-topology-map__line",
          x1: edge.fromNode.x,
          y1: edge.fromNode.y,
          x2: edge.toNode.x,
          y2: edge.toNode.y,
          "data-status": edge.status || "",
        }),
      ),
  );

  topologyMapNodesEl.replaceChildren(
    ...topologyMapModel.nodes.map((node) => {
      const buttonEl = createElement(
        "button",
        {
          attrs: {
            id: `topologyMapNode-${node.id}`,
            type: "button",
            "data-topology-node-id": node.id,
            "data-node-kind": node.kind,
            "data-selected": node.selected ? "true" : "false",
            "data-default-host": node.defaultHost ? "true" : "false",
            "data-status": node.status || "",
            "aria-pressed": node.selected ? "true" : "false",
            "aria-label": node.ariaLabel,
            title: node.ariaLabel,
          },
          className: `star-topology-node star-topology-node--${node.kind}`,
        },
        [
          createElement("span", { className: "star-topology-node__title", text: node.title }),
          node.subtitle
            ? createElement("span", {
                className: "star-topology-node__subtitle",
                text: node.subtitle,
              })
            : null,
          node.statusLabel
            ? createElement("span", {
                className: "star-topology-node__status",
                attrs: { "data-status": node.status || "good" },
                text: node.statusLabel,
              })
            : null,
          buildTopologyNodeBadgeRow({
            selected: node.selected,
            defaultHost: node.defaultHost,
          }),
        ],
      );
      buttonEl.style.left = `${node.x}%`;
      buttonEl.style.top = `${node.y}%`;
      return buttonEl;
    }),
  );

  topologyMapHealthChipsEl.replaceChildren(
    ...topologyMapModel.chips.map((chip) =>
      createElement(
        "div",
        {
          className: "star-topology-map__chip",
          attrs: {
            "data-status": chip.status || "good",
            title: chip.title || `${chip.label}: ${chip.value}`,
          },
        },
        [
          createElement("span", {
            className: "star-topology-map__chip-label",
            text: chip.label,
          }),
          createElement("span", {
            className: "star-topology-map__chip-value",
            text: chip.value,
          }),
        ],
      ),
    ),
  );

  topologyMapLegendEl.replaceChildren(
    ...TOPOLOGY_MAP_LEGEND_ROWS.map((row) => createTopologyLegendRow(row)),
  );

  topologyMapSummaryEl.textContent = topologyMapModel.summaryText;

  if (pendingFocusId) {
    const focusTarget = topologyMapNodesEl.querySelector(`#topologyMapNode-${pendingFocusId}`);
    focusTarget?.focus?.({ preventScroll: true });
  }
}
