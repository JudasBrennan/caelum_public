import { fmt } from "../../engine/utils.js";
import { createElement, replaceChildren } from "../domHelpers.js";
import { styleLabel } from "../gasGiantStyles.js";

function createTipNode(text) {
  if (!text) return null;
  return createElement("span", {
    className: "tip-icon",
    attrs: { tabindex: "0", role: "note", "aria-label": "Info" },
    dataset: { tip: text },
    text: "i",
  });
}

function createHint(text) {
  return createElement("div", { className: "hint", text });
}

function createKpiCard(item, tipLabels = {}) {
  const tipText = tipLabels[item.tipLabel] || tipLabels[item.label] || "";
  return createElement("div", { className: "kpi-wrap" }, [
    createElement("div", { className: "kpi" }, [
      createElement("div", { className: "kpi__label" }, [item.label, " ", createTipNode(tipText)]),
      createElement("div", { className: "kpi__value", text: item.value ?? "" }),
      createElement("div", { className: "kpi__meta", text: item.meta ?? "" }),
    ]),
  ]);
}

export function renderSystemKpis(container, items = [], tipLabels = {}) {
  return replaceChildren(
    container,
    (items || []).map((item) => createKpiCard(item, tipLabels)),
  );
}

export function createMoonCard(moon, { showParent = false, planetsById = null } = {}) {
  const moonName = moon.name || moon.inputs?.name || moon.id;
  const orbitKm = Number(moon?.inputs?.semiMajorAxisKm);
  const orbitText =
    Number.isFinite(orbitKm) && orbitKm > 0 ? `${fmt(orbitKm, 0)} km` : "Orbit unknown";
  const parent = moon.planetId ? planetsById?.[moon.planetId] : null;
  const parentText = parent
    ? `Parent: ${parent.name || parent.inputs?.name || parent.id}`
    : "Unassigned";
  const locked = !!moon.locked;
  const metaParts = [orbitText];
  if (showParent) metaParts.push(parentText);
  if (locked) metaParts.push("Parent locked");
  const metaText = metaParts.join(" - ");
  const canLock = moon.planetId != null;

  return createElement(
    "div",
    {
      className: `moon-mini moon-card${locked ? " is-locked" : ""}`,
      attrs: {
        draggable: locked ? "false" : "true",
        title: locked ? "Unlock parent to move" : "Drag to reassign parent",
      },
      dataset: { moonId: moon.id },
    },
    [
      createElement("div", {}, [
        createElement("div", { className: "moon-mini__name", text: moonName }),
        createElement("div", { className: "planet-card__meta", text: metaText }),
      ]),
      createElement("div", { className: "moon-mini__actions" }, [
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "lock-moon",
            "data-moon-id": moon.id,
            disabled: canLock ? null : "disabled",
          },
          text: locked ? "Unlock parent" : "Lock parent",
        }),
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "edit-moon",
            "data-moon-id": moon.id,
          },
          text: "Edit",
        }),
      ]),
    ],
  );
}

export function createPlanetCard(
  planet,
  sysModel,
  { showAu = true, moonCountByPlanet = null, allowPlanetDrag = true, placementText = null } = {},
) {
  let meta = "";
  if (showAu && planet.slotIndex != null) {
    const au = sysModel.orbitsAu[planet.slotIndex - 1];
    if (au != null) meta = `${fmt(au, 3)} AU`;
  }
  const moonCount = Number(moonCountByPlanet?.get(planet.id) || 0);
  const slotText =
    placementText ||
    (planet.slotIndex != null ? `Slot ${String(planet.slotIndex).padStart(2, "0")}` : "Unassigned");
  const metaTextBase = meta ? `${slotText} - ${meta}` : slotText;
  const classText = String(planet.classificationLabel || "").trim();
  const metaText = `${classText ? `${classText} - ` : ""}${metaTextBase} - Moons: ${moonCount}`;
  const name = planet.name || planet.inputs?.name || planet.id;
  const draggable = allowPlanetDrag && !planet.locked;

  return createElement(
    "div",
    {
      className: `planet-card${planet.locked ? " is-locked" : ""}${
        !allowPlanetDrag ? " is-drag-disabled" : ""
      } moon-drop-target`,
      attrs: {
        draggable: draggable ? "true" : "false",
        title: planet.locked
          ? "Locked"
          : allowPlanetDrag
            ? "Drag to assign"
            : "Manual orbit mode disables planet slot dragging",
        style: "",
      },
      dataset: {
        planetId: planet.id,
        moonDropPlanetId: planet.id,
      },
    },
    [
      createElement("div", {}, [
        createElement("div", {}, [createElement("b", { text: name })]),
        createElement("div", { className: "planet-card__meta", text: metaText }),
      ]),
      createElement("div", { attrs: { style: "display:flex; gap:8px; align-items:center" } }, [
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "lock",
            "data-planet-id": planet.id,
          },
          text: planet.locked ? "Unlock" : "Lock",
        }),
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "guided-moon",
            "data-parent-id": planet.id,
            "data-parent-type": "planet",
          },
          text: "Guided moon",
        }),
        createElement("button", {
          className: "small",
          attrs: {
            type: "button",
            "data-action": "edit",
            "data-planet-id": planet.id,
          },
          text: "Edit",
        }),
      ]),
    ],
  );
}

function createMoonDropZone(planetId, moons, planetsById) {
  const children = [
    createElement("div", { className: "moon-list__title", text: "Moons" }),
    ...(moons.length
      ? moons.map((moon) => createMoonCard(moon, { planetsById }))
      : [createHint("Drop moons here")]),
  ];
  return createElement(
    "div",
    {
      className: "moon-list moon-drop-target",
      dataset: { moonDropPlanetId: planetId },
    },
    children,
  );
}

function createSlotPlanetWithMoons(planet, sysModel, renderCtx, options = {}) {
  const moons = (renderCtx?.moonsByPlanet?.get(planet.id) || []).slice();
  return [
    createPlanetCard(planet, sysModel, {
      showAu: false,
      moonCountByPlanet: renderCtx?.moonCountByPlanet,
      allowPlanetDrag: options.allowPlanetDrag,
      placementText: options.placementText,
    }),
    createMoonDropZone(planet.id, moons, renderCtx?.planetsById),
  ];
}

function createGasGiantWithMoons(giant, giantKind, renderCtx) {
  const moons = (renderCtx?.moonsByPlanet?.get(giant.id) || []).slice();
  return createElement("div", {}, [
    createHint(`${giantKind} marker (${styleLabel(giant.style || "jupiter")}).`),
    createElement("div", { className: "button-row", attrs: { style: "margin-top:8px" } }, [
      createElement("button", {
        className: "small",
        attrs: {
          type: "button",
          "data-action": "guided-moon",
          "data-parent-id": giant.id,
          "data-parent-type": "gasGiant",
        },
        text: "Guided moon",
      }),
    ]),
    createMoonDropZone(giant.id, moons, renderCtx?.planetsById),
  ]);
}

function createSlotRow(title, body, options = {}) {
  return createElement("div", { className: "slot-row" }, [
    createElement("div", { className: "slot-title", text: title }),
    createElement(
      "div",
      {
        className: options.dropzoneClass || "dropzone",
        attrs: options.dropzoneStyle ? { style: options.dropzoneStyle } : {},
        dataset: options.dataset || {},
      },
      body,
    ),
  ]);
}

export function renderUnassignedPlanets(
  container,
  planets,
  sysModel,
  { moonCountByPlanet = null } = {},
) {
  return replaceChildren(
    container,
    planets.length
      ? planets.map((planet) => createPlanetCard(planet, sysModel, { moonCountByPlanet }))
      : createHint("No unassigned planets."),
  );
}

export function renderUnassignedMoons(container, moons, { planetsById = null } = {}) {
  return replaceChildren(
    container,
    moons.length
      ? createElement(
          "div",
          { className: "moon-list moon-list--unassigned" },
          moons.map((moon) => createMoonCard(moon, { showParent: false, planetsById })),
        )
      : createHint("No unassigned moons."),
  );
}

export function renderOrbitSlots(
  container,
  { hostSummary = "", hostTitle = "Host frame", orbitItems, planets, sysModel, renderCtx },
) {
  const rows = [
    createSlotRow(hostTitle, createHint(hostSummary || "Current host-frame context."), {
      dropzoneStyle: "cursor:default",
    }),
  ];

  for (const item of orbitItems) {
    if (item.type === "slot") {
      const occupant = planets.find((planet) => planet.slotIndex === item.slot);
      rows.push(
        createSlotRow(
          `Slot ${String(item.slot).padStart(2, "0")} (${fmt(item.au, 3)} AU)`,
          occupant
            ? createSlotPlanetWithMoons(occupant, sysModel, renderCtx)
            : createHint("Drop a planet here."),
          {
            dropzoneClass: "dropzone slot-drop",
            dataset: { slot: item.slot },
          },
        ),
      );
      continue;
    }

    if (item.type === "gas") {
      const giant = item.giant;
      const giantKind = giant.companionClass === "brownDwarf" ? "Brown dwarf" : "Gas giant";
      rows.push(
        createSlotRow(
          `${giant.name || giantKind} (Slot ${String(item.slot).padStart(2, "0")} - ${fmt(Number(giant.au) || item.au, 3)} AU)`,
          createGasGiantWithMoons(giant, giantKind, renderCtx),
          { dropzoneStyle: "cursor:default" },
        ),
      );
      continue;
    }

    rows.push(
      createSlotRow(
        `${item.name || "Debris disk"} (${fmt(item.inner, 2)} - ${fmt(item.outer, 2)} AU)`,
        createHint("Asteroid belt / debris disk region."),
        { dropzoneStyle: "cursor:default" },
      ),
    );
  }

  return replaceChildren(container, rows);
}

function architectureStateLabel(state) {
  switch (state) {
    case "stable":
      return "Stable spacing";
    case "packed":
      return "Packed spacing";
    case "crowded":
      return "Crowded spacing";
    case "unstable":
      return "Unstable spacing";
    default:
      return "Spacing unknown";
  }
}

function architecturePairLabel(pair) {
  const separation =
    pair?.separationMutualHill == null ? "unknown" : `${fmt(pair.separationMutualHill, 2)} R_H,m`;
  return `${pair?.innerName || pair?.innerId || "Inner"} -> ${pair?.outerName || pair?.outerId || "Outer"}: ${separation}`;
}

export function renderOrbitalArchitectureDiagnostics(container, architecture) {
  if (!container) return null;
  const bodyCount = Number(architecture?.bodyCount || 0);
  if (!architecture || bodyCount < 2 || !architecture.pairs?.length) {
    return replaceChildren(container);
  }

  const summary = architecture.summary || {};
  const state = String(summary.state || "unknown");
  const limitingPair = architecture.pairs.find(
    (pair) =>
      pair.innerId === summary.limitingPairIds?.[0] &&
      pair.outerId === summary.limitingPairIds?.[1],
  );
  const pairRows = architecture.pairs
    .slice(0, 4)
    .map((pair) =>
      createElement("div", { className: "hint" }, [
        createElement("b", { text: architecturePairLabel(pair) }),
        ` - ${pair.note || architectureStateLabel(pair.state)}`,
      ]),
    );

  return replaceChildren(
    container,
    createElement("div", { className: `system-architecture system-architecture--${state}` }, [
      createElement("div", { className: "slot-row" }, [
        createElement("div", {
          className: "slot-title",
          text: architectureStateLabel(state),
        }),
        createElement("div", { className: "dropzone", attrs: { style: "cursor:default" } }, [
          createElement("div", {
            className: "hint",
            text:
              summary.note ||
              (limitingPair
                ? limitingPair.note
                : "Adjacent body spacing was evaluated for the selected host frame."),
          }),
          createElement("div", {
            className: "planet-card__meta",
            text: `Confidence: ${summary.confidence || "unknown"} | Adjacent pairs: ${architecture.pairs.length}`,
          }),
          ...pairRows,
        ]),
      ]),
    ]),
  );
}

export function renderManualBodyList(container, bodies = [], options = {}) {
  const sysModel = options.sysModel || { orbitsAu: [] };
  const renderCtx = options.renderCtx || {};
  const allowPlanetDrag = options.allowPlanetDrag !== false;
  return replaceChildren(
    container,
    bodies.length
      ? bodies.map((body) => {
          let content = createHint(body.kind);
          if (body.planet) {
            content = createSlotPlanetWithMoons(body.planet, sysModel, renderCtx, {
              allowPlanetDrag,
              placementText: options.placementText || "Manual orbit",
            });
          } else if (body.gasGiant) {
            const giantKind =
              body.gasGiant.companionClass === "brownDwarf" ? "Brown dwarf" : "Gas giant";
            content = createGasGiantWithMoons(body.gasGiant, giantKind, renderCtx);
          }
          return createSlotRow(`${body.name} (${body.auLabel})`, content, {
            dropzoneStyle: "cursor:default",
          });
        })
      : createHint("No bodies created yet."),
  );
}
