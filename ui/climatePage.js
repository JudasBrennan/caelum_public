import { calcClimateZones } from "../engine/climate.js";
import { buildDynamicalContext } from "../engine/dynamics/context.js";
import { fmt } from "../engine/utils.js";
import { attachTooltips, tipIcon } from "./tooltip.js";
import { structuredTip } from "./tooltipCopy.js";
import { bindNumberAndSlider } from "./bind.js";
import { createElement, replaceChildren, replaceSelectOptions } from "./domHelpers.js";
import { solvePlanetExactForWorld, solvePlanetaryBodyForWorld } from "./bodySolveHelpers.js";
import {
  findPlanetaryBody,
  getSelectedPlanet,
  listPlanets,
  loadWorld,
  selectPlanet,
  updateWorld,
} from "./store.js";
import { createTutorial } from "./tutorial.js";
import {
  createDiagnosticCockpit,
  createDiagnosticDependencyNotice,
  createDiagnosticEmptyState,
  createDiagnosticObjectSelector,
  workflowHtml,
} from "./workflow/diagnosticOrientation.js";
import {
  buildSubtypeUnsupportedMessage,
  getSubtypePageApplicability,
} from "./planet/bodyClassificationSummary.js";

// ── Tooltips ────────────────────────────────────────────────

const TIP_LABEL = {
  "Climate Zones": structuredTip({
    overview: "Procedural Koppen-style climate classification across latitude bands.",
    drawnFrom:
      "Surface temperature, axial tilt, atmospheric circulation cells, water regime, ocean/land context, and aridity estimates.",
    interpretAs:
      "Each latitude band is assigned a broad A/B/C/D/E master class; mid-latitude bands can show warm-current and cold-current variants.",
    caveat:
      "This is a procedural worldbuilding classifier, not a coupled global circulation model.",
    references: "Peel et al. 2007; see Science & Maths: climate zones.",
  }),
  "Latitude Temperature": structuredTip({
    overview: "Latitude temperature gradient used to seed climate-zone bands.",
    drawnFrom: "Mean surface temperature, atmospheric pressure, gravity, axial tilt, and latitude.",
    interpretAs:
      "The model uses T(lat) = T_eq - deltaT x sin^2(lat). Pressure reduces the gradient; lower gravity increases it; axial tilt scales seasonal amplitude.",
    caveat: "This is a zonal approximation, not a weather or ocean-current simulation.",
    references: "See Science & Maths: latitude temperature model.",
  }),
  "Aridity Index": structuredTip({
    overview: "Moisture availability index from 0 hyperarid to 1 saturated.",
    drawnFrom:
      "Circulation-cell position, water regime, atmospheric H2O content, inferred ocean coverage, and exposed land context.",
    interpretAs:
      "Below 0.25 tends toward desert; below 0.45 tends toward steppe. Hadley ITCZ is wet, Hadley subsidence is dry, Ferrel is moderate, Polar is dry.",
    caveat:
      "This is a latitude-band climate signal, not a rainfall map or hydrological cycle simulation.",
    references: "See Science & Maths: climate zones and aridity.",
  }),
  "Mean Surface Temp": structuredTip({
    overview: "Global mean surface temperature used by the climate-zone model.",
    drawnFrom:
      "The active planet solver: stellar luminosity, orbital distance, albedo, greenhouse effect, atmosphere, and climate modifiers.",
    feedsInto:
      "Latitude temperatures, climate-zone classes, aridity context, and altitude adjustments.",
    caveat: "This is the climate-zone baseline, not a local weather forecast or seasonal map.",
    references: "See Science & Maths: climate energy balance.",
  }),
  "Water Regime": structuredTip({
    overview: "Planet-wide water availability category inherited from the Planet page.",
    drawnFrom: "Water Mass Fraction and the planet solver's water-regime classification.",
    feedsInto:
      "Atmospheric H2O context, aridity, climate-zone classes, and inferred wet/dry band behaviour.",
    caveat:
      "This summarizes inventory; Inferred Ocean Coverage estimates flooded surface separately.",
    references: "See Science & Maths: water inventory and climate zones.",
  }),
  "Inferred Ocean Coverage": structuredTip({
    overview: "Estimated liquid-ocean surface coverage inherited from the Planet solver.",
    drawnFrom: "Water inventory, gravity-scaled relief, basin capacity, and current climate state.",
    feedsInto: "Aridity, land/ocean climate context, and climate-zone interpretation.",
    caveat: "This is a global estimate, not a bathymetry or coastline map.",
    references: "See Science & Maths: inferred ocean coverage.",
  }),
};

Object.assign(TIP_LABEL, {
  Altitude: structuredTip({
    overview: "Reference altitude above sea level for climate-zone adjustment.",
    feedsInto: "Latitude-band temperatures and resulting climate-zone classes.",
    interpretAs:
      "Higher altitude cools the band using an environmental lapse-rate approximation scaled by gravity.",
    caveat: "This is a global reference altitude, not a terrain/elevation map.",
    references: "International Standard Atmosphere; see Science & Maths: climate zones.",
  }),
  "Zone Count": structuredTip({
    overview: "Number of generated latitude climate bands.",
    drawnFrom:
      "Atmospheric circulation-cell count and whether mid-latitude warm/cold-current variants are split.",
    interpretAs: "More bands give a finer procedural climate summary.",
    caveat: "Bands are zonal averages, not local regional climates.",
    references: "See Science & Maths: climate zones.",
  }),
  "Dominant Class": structuredTip({
    overview: "Most common Koppen master class across generated latitude bands.",
    drawnFrom: "Area-weighted or band-level climate-zone classifications.",
    interpretAs:
      "A quick summary of whether the world trends tropical, arid, temperate, continental, polar, or special.",
    caveat: "Dominance can hide important minority climates.",
    references: "See Science & Maths: climate zones.",
  }),
  "Exposed Land": structuredTip({
    overview: "Estimated unflooded surface fraction after inferred basin fill.",
    drawnFrom: "Planet water inventory, basin capacity, and inferred ocean coverage.",
    feedsInto: "Aridity, productivity, weathering context, and visual/population defaults.",
    caveat: "This is a global fraction, not a coastline map.",
    references: "See Science & Maths: inferred ocean coverage.",
  }),
  "Coverage Confidence": structuredTip({
    overview: "Confidence label for inferred ocean/land split.",
    drawnFrom: "Availability and quality of water inventory, relief, basin, and climate inputs.",
    interpretAs: "Lower confidence means fallback assumptions had more influence.",
    caveat: "Confidence is about the estimate pathway, not a measured uncertainty interval.",
    references: "See Science & Maths: inferred ocean coverage.",
  }),
  "Climate Legend": structuredTip({
    overview: "Colour key for climate master classes shown in the latitude chart.",
    drawnFrom: "Climate classes present in the current generated zone set.",
    caveat: "It explains chart colours only; full class interpretation lives in the zone cards.",
  }),
  "Zone Card": structuredTip({
    overview: "Detailed readout for one generated latitude climate band.",
    drawnFrom: "Latitude temperature, aridity index, circulation context, and water/ocean context.",
    interpretAs:
      "Expand a card for environmental description, location context, seasonal temperatures, and exact aridity.",
    caveat: "Each card is a zonal average rather than a local biome map.",
    references: "See Science & Maths: climate zones.",
  }),
});

// ── Master class colors ─────────────────────────────────────

const MASTER_COLORS = {
  A: "#e05555", // warm red
  B: "#d4a44a", // sandy yellow
  C: "#4caf6e", // green
  D: "#5b8fd4", // blue
  E: "#c0d0e0", // ice blue
  X: "#9b7cc4", // purple
};

// ── Planet context extraction ───────────────────────────────

function getClimateContext(world) {
  const fallback = {
    surfaceTempK: 288,
    axialTiltDeg: 23.44,
    circulationCellCount: "3",
    circulationCellRanges: [],
    h2oPct: 0,
    waterRegime: "Extensive oceans",
    pressureAtm: 1,
    tidallyLockedToStar: false,
    compositionClass: "Earth-like",
    liquidWaterPossible: true,
    insolationEarth: 1,
    gravityG: 1,
    inferredOceanCoverageDisplay: "70.0%",
    exposedLandDisplay: "30.0%",
    coverageConfidenceDisplay: "Fallback confidence",
    coverageReason: "fallback",
  };

  const planet = getSelectedPlanet(world);
  if (!planet) return fallback;
  const body =
    findPlanetaryBody(world, `planet:${planet.id}`) || findPlanetaryBody(world, planet.id);
  const pageBody = body ? solvePlanetaryBodyForWorld(world, body).model || body : null;
  const pageApplicability = pageBody ? getSubtypePageApplicability(pageBody, "climate") : null;
  const subtypeMessage =
    pageApplicability && pageApplicability.status !== "full"
      ? buildSubtypeUnsupportedMessage(pageBody, "climate")
      : "";
  if (pageApplicability?.status === "none") {
    return {
      ...fallback,
      unsupportedSurfaceMessage: subtypeMessage,
    };
  }

  const { model } = solvePlanetExactForWorld(world, planet);

  if (!model?.derived) return fallback;
  let dynamicalVariabilityContext = null;
  try {
    dynamicalVariabilityContext =
      buildDynamicalContext({ world, detailLevel: "summary" }).bodies?.[planet.id]
        ?.dynamicalVariabilityContext || null;
  } catch {
    dynamicalVariabilityContext = null;
  }
  const dynamicalVariabilityOutputs = dynamicalVariabilityContext?.outputs || {};
  const climateVariabilityWarning =
    dynamicalVariabilityOutputs.climateWarningMessages?.[0] ||
    (dynamicalVariabilityOutputs.habitabilityVariabilityWarning &&
    dynamicalVariabilityOutputs.habitabilityVariabilityWarning !== "none"
      ? "Long-cycle orbital variability is a warning only; climate bands are not rewritten."
      : "");

  return {
    surfaceTempK: model.derived.surfaceTempK || 288,
    axialTiltDeg: model.inputs?.axialTiltDeg ?? 23.44,
    circulationCellCount: model.derived.circulationCellCount || "3",
    circulationCellRanges: model.derived.circulationCellRanges || [],
    h2oPct: model.inputs?.h2oPct || 0,
    waterRegime: model.derived.waterRegime || "Extensive oceans",
    pressureAtm: model.inputs?.pressureAtm ?? 1,
    tidallyLockedToStar: !!model.derived.tidallyLockedToStar,
    compositionClass: model.derived.compositionClass || "Earth-like",
    liquidWaterPossible: !!model.derived.liquidWaterPossible,
    climateState: model.derived.climateState || "Stable",
    insolationEarth: model.derived.insolationEarth || 1,
    gravityG: model.derived.gravityG || 1,
    surfaceClimateContext: model.derived.surfaceClimateContext || null,
    dynamicalVariabilityContext,
    climateVariabilityWarning,
    inferredOceanCoverageDisplay: model.display?.inferredOceanCoverage || "n/a",
    exposedLandDisplay: model.display?.exposedLand || "n/a",
    coverageConfidenceDisplay:
      model.display?.surfaceOceanCoverageConfidence || "Unknown confidence",
    coverageReason:
      model.display?.surfaceOceanCoverageReason ||
      model.derived.hydrosphere?.surfaceOceanCoverageContext?.source ||
      "",
    limitedSurfaceMessage: pageApplicability?.status === "limited" ? subtypeMessage : "",
  };
}

function displayFromZones(zones = []) {
  const counts = new Map();
  for (const zone of zones) {
    const key = zone?.master || "X";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let dominantClass = "X";
  let dominantCount = -1;
  for (const [key, count] of counts.entries()) {
    if (count > dominantCount) {
      dominantClass = key;
      dominantCount = count;
    }
  }
  return {
    zoneCount: zones.length,
    dominantClass,
  };
}

function climateModelForContext(ctx, altitudeM = 0) {
  if (ctx.unsupportedSurfaceMessage) return null;
  if (Number(altitudeM) === 0 && ctx.surfaceClimateContext?.outputs) {
    const outputs = ctx.surfaceClimateContext.outputs;
    const zones = Array.isArray(outputs.zones) ? outputs.zones : [];
    return {
      zones,
      advisory: outputs.advisory || null,
      display: {
        ...displayFromZones(zones),
        ...(outputs.display || {}),
      },
    };
  }
  return calcClimateZones({ ...ctx, altitudeM });
}

// ── Canvas drawing ──────────────────────────────────────────

function drawLatitudeBands(canvas, zones) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const textColor = getComputedStyle(canvas).getPropertyValue("color") || "#ccc";

  ctx.clearRect(0, 0, w, h);

  if (!zones.length) return;

  const PAD = { top: 8, bottom: 24, left: 10, right: 10 };
  const barH = h - PAD.top - PAD.bottom;
  const barW = w - PAD.left - PAD.right;

  // Check if this is a tidally locked or global-zone scenario
  const isTidal = zones.some((z) =>
    ["substellar", "terminator", "antistellar"].includes(z.cellRole),
  );
  const isGlobal = zones.length === 1 && zones[0].latMin === 0 && zones[0].latMax === 90;

  if (isTidal) {
    // Equal-width segments for tidal zones
    const segW = barW / zones.length;
    zones.forEach((z, i) => {
      const x = PAD.left + i * segW;
      ctx.fillStyle = MASTER_COLORS[z.master] || "#666";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x, PAD.top, segW - 2, barH);
      ctx.globalAlpha = 1;

      // Label
      ctx.fillStyle = textColor;
      ctx.font = "10px var(--font-mono, monospace)";
      ctx.textAlign = "center";
      const label =
        z.cellRole === "substellar"
          ? "Substellar"
          : z.cellRole === "terminator"
            ? "Terminator"
            : "Antistellar";
      ctx.fillText(label, x + segW / 2, PAD.top + barH / 2 - 6);
      ctx.font = "bold 11px var(--font-mono, monospace)";
      ctx.fillText(z.code, x + segW / 2, PAD.top + barH / 2 + 8);
    });
    return;
  }

  if (isGlobal) {
    ctx.fillStyle = MASTER_COLORS[zones[0].master] || "#666";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(PAD.left, PAD.top, barW, barH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = textColor;
    ctx.font = "bold 12px var(--font-mono, monospace)";
    ctx.textAlign = "center";
    ctx.fillText(zones[0].code + " " + zones[0].name, PAD.left + barW / 2, PAD.top + barH / 2 + 4);
    return;
  }

  // Normal latitude-band mode: equator (0°) on left, pole (90°) on right
  const maxLat = 90;
  const xScale = barW / maxLat;

  // Draw each zone as a colored segment
  // Group overlapping latitude ranges (warm-coast / cold-coast at same lat)
  // by rendering two half-height bars
  const drawn = new Map(); // latKey → count

  for (const z of zones) {
    const x0 = PAD.left + z.latMin * xScale;
    const segW = (z.latMax - z.latMin) * xScale;
    const latKey = `${z.latMin}-${z.latMax}`;
    const count = drawn.get(latKey) || 0;
    drawn.set(latKey, count + 1);

    // Check if this lat band has multiple variants
    const siblings = zones.filter((o) => o.latMin === z.latMin && o.latMax === z.latMax);
    const halfBar = siblings.length > 1;
    const yOff = halfBar ? (count === 0 ? 0 : barH / 2) : 0;
    const segH = halfBar ? barH / 2 : barH;

    ctx.fillStyle = MASTER_COLORS[z.master] || "#666";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x0, PAD.top + yOff, Math.max(segW - 1, 1), segH);
    ctx.globalAlpha = 1;

    // Label if wide enough
    if (segW > 28) {
      ctx.fillStyle = textColor;
      ctx.font = "bold 10px var(--font-mono, monospace)";
      ctx.textAlign = "center";
      ctx.fillText(z.code, x0 + segW / 2, PAD.top + yOff + segH / 2 + 4);
    }
  }

  // Axis labels
  ctx.fillStyle = textColor;
  ctx.font = "9px var(--font-mono, monospace)";
  ctx.textAlign = "left";
  ctx.fillText("Equator", PAD.left, h - 4);
  ctx.textAlign = "right";
  ctx.fillText("Pole", PAD.left + barW, h - 4);
  // Interior tick labels only (skip 0° and 90° to avoid overlap with Equator/Pole)
  ctx.textAlign = "center";
  const step = maxLat <= 30 ? 5 : 15;
  for (let lat = step; lat < maxLat; lat += step) {
    const x = PAD.left + lat * xScale;
    ctx.fillText(`${lat}\u00b0`, x, h - 4);
  }
}

const TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "Climate Zones derives K\u00F6ppen classification bands from your planet\u2019s " +
      "temperature, axial tilt, and atmospheric circulation. Select a planet " +
      "to see its latitude-by-latitude climate.",
  },
  {
    title: "Latitude Bands",
    body:
      "Each band is colour-coded by K\u00F6ppen class: A (tropical), B (arid), " +
      "C (temperate), D (continental), and E (polar). Band widths depend on " +
      "circulation cells and axial tilt.",
  },
  {
    title: "Zone Details",
    body:
      "Expand any zone card to see temperature range, environment description, " +
      "and aridity index. Use this to decide where forests, deserts, and ice " +
      "caps appear on your world.",
  },
  {
    title: "Altitude",
    body:
      "The altitude slider adjusts the reference height for temperature " +
      "lapse-rate calculations. Higher altitudes shift zone boundaries, " +
      "turning temperate regions into alpine or polar climates.",
  },
];

// ── Page init ───────────────────────────────────────────────

function planetLabel(planet) {
  return planet?.name || planet?.inputs?.name || planet?.id || "No compatible planet";
}

function planetSelectOptions(planets = [], selectedPlanet = null) {
  return planets.map((planet) => ({
    value: planet.id,
    label: planetLabel(planet),
    selected: planet.id === selectedPlanet?.id,
  }));
}

function buildClimateCockpitMarkup({ selected, ctx, model, altitudeM, empty = false } = {}) {
  const zoneCount = model?.display?.zoneCount ?? 0;
  return workflowHtml(
    createDiagnosticCockpit({
      id: "climateCockpit",
      title: "Climate Zones",
      summary: empty
        ? "Create a rocky planet before reading climate bands."
        : "Reads the selected rocky planet and shows interpreted Koppen-style latitude bands.",
      current: {
        label: "Selected planet",
        value: empty ? "No compatible planet" : planetLabel(selected),
        meta: empty ? "No rocky planet is available." : "Change selection below.",
      },
      statusItems: [
        {
          label: "Reads from",
          value: "Planets",
          meta: "Atmosphere, orbit, water inventory, and surface classification.",
        },
        {
          label: "Diagnostic only",
          value: empty
            ? "Waiting for planet"
            : ctx?.unsupportedSurfaceMessage
              ? "Unsupported"
              : `${zoneCount} zones`,
          meta: `Altitude view: ${fmt(Number(altitudeM) || 0, 0)} m.`,
          tone: ctx?.unsupportedSurfaceMessage ? "warn" : "",
        },
        {
          label: "Authoring override",
          value: "Separate",
          meta: "Visual and ocean overrides do not rewrite inferred climate coverage.",
        },
      ],
      source: {
        label: "Source",
        value: "Reads from Planets",
        meta: "Change inputs on Planets. This page is diagnostic only.",
      },
      details: {
        id: "climateContextDisclosure",
        title: "What this reads",
        summary: "Planet atmosphere, water, orbit, circulation, and inferred ocean coverage.",
        items: [
          "Reads from Planets: atmosphere, greenhouse, water inventory, orbit, gravity, and surface classification.",
          "Change inputs on Planets: edit atmosphere, water, orbit, and physical properties there.",
          "Diagnostic only: altitude changes adjust this view and do not rewrite planet science inputs.",
          "Authoring override: visual or population ocean overrides stay separate from inferred ocean coverage.",
        ],
      },
      nextStep: {
        id: "climateNextStepStrip",
        recommendation: empty
          ? "Create a rocky planet, then return here to inspect climate bands."
          : "Tune atmosphere, water, or orbit on Planets when these climate bands need to change.",
        actions: [
          { label: "Edit planet", href: "#/planet", primary: true },
          { label: "Open Tectonics", href: "#/tectonics" },
          { label: "Open Population", href: "#/population" },
        ],
      },
    }),
  );
}

function buildClimateDependencyNoticeMarkup() {
  return workflowHtml(
    createDiagnosticDependencyNotice({
      id: "climateDependencyNotice",
      title: "Reads from Planets",
      body: "Reads from the selected rocky planet's atmosphere, water, orbit, and inferred surface-ocean coverage. Change inputs on Planets.",
      source:
        "Diagnostic only. Authoring override values on visual or population surfaces remain separate from inferred climate science.",
      actions: [{ label: "Change inputs on Planets", href: "#/planet" }],
    }),
  );
}

function buildClimateObjectSelectorMarkup(planets, selected, ctx) {
  return workflowHtml(
    createDiagnosticObjectSelector({
      id: "climateObjectSelector",
      title: "Planet selection",
      summary: "Choose the rocky planet whose climate bands should be interpreted.",
      selectedLabel: "Selected planet",
      selectedValue: planetLabel(selected),
      selectedMeta: ctx?.unsupportedSurfaceMessage
        ? "No compatible climate output for this body."
        : "Climate diagnostic target.",
      selectId: "climPlanetSelect",
      selectLabel: "Planet",
      selectOptions: planetSelectOptions(planets, selected),
    }),
  );
}

function buildClimateEmptyPageMarkup(planets, selected) {
  return `
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Climate Zones</h1></div>
          <div class="panel__body">
            ${buildClimateCockpitMarkup({ selected, altitudeM: 0, empty: true })}
            ${buildClimateDependencyNoticeMarkup()}
            ${workflowHtml(
              createDiagnosticEmptyState({
                id: "climateEmptyState",
                title: "No compatible rocky planet",
                body: "Climate Zones needs a rocky planet before it can read atmosphere, water, orbit, and circulation context.",
                actions: [{ label: "Create a planet", href: "#/planet" }],
              }),
            )}
            ${
              planets.length
                ? buildClimateObjectSelectorMarkup(planets, selected, {
                    unsupportedSurfaceMessage: "No compatible climate output.",
                  })
                : ""
            }
          </div>
        </div>
      </div>`;
}

export function initClimatePage(containerEl) {
  const world = loadWorld();
  const planets = listPlanets(world);

  if (!planets.length) {
    containerEl.innerHTML = buildClimateEmptyPageMarkup(planets, null);
    return;
  }

  const clim = world.climate || {};
  const state = { altitudeM: Number(clim.altitudeM) || 0 };

  function save() {
    updateWorld({ climate: { ...state } });
  }

  // ── Helpers for dynamic content ──

  const DOMINANT_NAMES = {
    A: "Tropical",
    B: "Arid",
    C: "Temperate",
    D: "Continental",
    E: "Polar",
    X: "Special",
  };

  function tipIconNode(text) {
    if (!text) return null;
    return createElement("span", {
      className: "tip-icon",
      attrs: { tabindex: "0", role: "note", "aria-label": "Info" },
      dataset: { tip: text },
      text: "i",
    });
  }

  function kpiNode(label, value, tipText, meta = "") {
    return createElement("div", { className: "kpi-wrap" }, [
      createElement("div", { className: "kpi" }, [
        createElement("div", { className: "kpi__label" }, [
          label,
          tipText ? " " : "",
          tipIconNode(tipText),
        ]),
        createElement("div", { className: "kpi__value", text: value }),
        meta ? createElement("div", { className: "kpi__meta", text: meta }) : null,
      ]),
    ]);
  }

  function detailRowNode(label, text) {
    return createElement("p", { className: "clim-detail-row" }, [
      createElement("strong", { text: label }),
      " ",
      text,
    ]);
  }

  function renderClimateDynamic(container, model, ctx) {
    if (ctx.unsupportedSurfaceMessage) {
      replaceChildren(container, [
        createElement("div", {
          className: "derived-readout",
          text: ctx.unsupportedSurfaceMessage,
        }),
      ]);
      return;
    }
    const dominantLabel =
      DOMINANT_NAMES[model.display.dominantClass] || model.display.dominantClass;
    const legendItems = Object.entries(MASTER_COLORS)
      .filter(([key]) => model.zones.some((zone) => zone.master === key))
      .map(([key, color]) =>
        createElement("span", { className: "clim-legend-item" }, [
          createElement("span", {
            className: "clim-legend-swatch",
            attrs: { style: `background:${color}` },
          }),
          key === "A"
            ? "Tropical"
            : key === "B"
              ? "Arid"
              : key === "C"
                ? "Temperate"
                : key === "D"
                  ? "Continental"
                  : key === "E"
                    ? "Polar"
                    : "Special",
        ]),
      );

    replaceChildren(container, [
      ctx.limitedSurfaceMessage
        ? createElement("div", { className: "derived-readout", text: ctx.limitedSurfaceMessage })
        : null,
      model.advisory
        ? createElement("div", { className: "clim-advisory", text: model.advisory })
        : null,
      ctx.climateVariabilityWarning
        ? createElement("div", { className: "clim-advisory", text: ctx.climateVariabilityWarning })
        : null,
      createElement("section", { className: "kpi-section", attrs: { id: "climateSummary" } }, [
        createElement("div", { className: "kpi-section__header" }, [
          createElement("h3", { className: "kpi-section__title", text: "Summary" }),
        ]),
        createElement("div", { className: "kpi-grid" }, [
          kpiNode("Zone Count", model.display.zoneCount, TIP_LABEL["Zone Count"]),
          kpiNode(
            "Mean Surface Temp",
            `${fmt(ctx.surfaceTempK - 273.15, 1)} \u00b0C`,
            TIP_LABEL["Mean Surface Temp"],
          ),
          kpiNode("Dominant Class", dominantLabel, TIP_LABEL["Dominant Class"]),
          kpiNode("Water Regime", ctx.waterRegime, TIP_LABEL["Water Regime"]),
          kpiNode(
            "Inferred Ocean Coverage",
            ctx.inferredOceanCoverageDisplay,
            TIP_LABEL["Inferred Ocean Coverage"],
            ctx.coverageReason,
          ),
          kpiNode("Exposed Land", ctx.exposedLandDisplay, TIP_LABEL["Exposed Land"]),
          kpiNode(
            "Coverage Confidence",
            ctx.coverageConfidenceDisplay,
            TIP_LABEL["Coverage Confidence"],
          ),
        ]),
      ]),
      createElement("div", { className: "subsection", attrs: { style: "margin-top:12px" } }, [
        createElement("h3", {}, [
          "Latitude Bands",
          " ",
          tipIconNode(TIP_LABEL["Latitude Temperature"]),
        ]),
        createElement("canvas", { attrs: { id: "climBandCanvas" }, className: "clim-canvas" }),
        createElement("div", { className: "clim-legend" }, [
          tipIconNode(TIP_LABEL["Climate Legend"]),
          ...legendItems,
        ]),
      ]),
      createElement("div", { className: "subsection", attrs: { style: "margin-top:12px" } }, [
        createElement("h3", {}, [
          "Zone Details",
          " ",
          tipIconNode(TIP_LABEL["Zone Card"]),
          " ",
          tipIconNode(TIP_LABEL["Aridity Index"]),
        ]),
        createElement(
          "div",
          { className: "clim-zone-list" },
          model.zones.map((zone) =>
            createElement("details", { className: "clim-zone-card" }, [
              createElement("summary", { className: "clim-zone-summary" }, [
                createElement("span", {
                  className: "clim-zone-badge",
                  attrs: { style: `background:${MASTER_COLORS[zone.master] || "var(--muted)"}` },
                  text: zone.code,
                }),
                createElement("span", { className: "clim-zone-name", text: zone.name }),
                zone.variant !== "general"
                  ? createElement("span", { className: "clim-zone-variant", text: zone.variant })
                  : null,
                createElement("span", { className: "clim-zone-range", text: zone.rangeLabel }),
                createElement("span", {
                  className: "clim-zone-temp",
                  text: `${fmt(zone.meanTempC, 1)} \u00b0C`,
                }),
              ]),
              createElement("div", { className: "clim-zone-detail" }, [
                createElement("p", { text: zone.description }),
                zone.environment ? detailRowNode("Environment:", zone.environment) : null,
                zone.location ? detailRowNode("Location:", zone.location) : null,
                detailRowNode(
                  "Temperature:",
                  `warmest ${fmt(zone.warmestMonthC, 1)} \u00b0C, coldest ${fmt(
                    zone.coldestMonthC,
                    1,
                  )} \u00b0C`,
                ),
                detailRowNode("Aridity index:", fmt(zone.aridity, 2)),
              ]),
            ]),
          ),
        ),
      ]),
    ]);
  }

  /** Lightweight refresh — replaces only the dynamic area below the inputs. */
  function update() {
    const w = loadWorld();
    const ctx = getClimateContext(w);
    const model = climateModelForContext(ctx, state.altitudeM);

    const dyn = containerEl.querySelector("#climDynamic");
    if (!dyn) return;
    renderClimateDynamic(dyn, model, ctx);
    requestAnimationFrame(() => {
      const canvas = dyn.querySelector("#climBandCanvas");
      if (canvas) drawLatitudeBands(canvas, model.zones);
    });
  }

  /** Full rebuild — inputs, listeners, everything. */
  function render() {
    const w = loadWorld();
    const pList = listPlanets(w);
    const selected = getSelectedPlanet(w);
    const ctx = getClimateContext(w);
    const model = climateModelForContext(ctx, state.altitudeM);

    containerEl.innerHTML = `
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Climate Zones ${tipIcon(TIP_LABEL["Climate Zones"])}</h1>
            <button id="climTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${buildClimateCockpitMarkup({
              selected,
              ctx,
              model,
              altitudeM: state.altitudeM,
            })}
            ${buildClimateDependencyNoticeMarkup()}
            ${buildClimateObjectSelectorMarkup(pList, selected, ctx)}

            <div class="form-row">
              <label>Altitude <span class="unit">m</span> ${tipIcon(TIP_LABEL["Altitude"])}</label>
              <div class="input-pair">
                <input id="climAltitude" type="number" step="100"
                       value="${state.altitudeM}" aria-label="Altitude" />
                <input id="climAltitudeSlider" type="range" aria-label="Altitude slider" />
                <div class="range-meta"><span>0</span><span>10,000</span></div>
              </div>
            </div>

            <div id="climDynamic"></div>

          </div>
        </div>
      </div>`;

    attachTooltips(containerEl);

    const dyn = containerEl.querySelector("#climDynamic");
    if (dyn) renderClimateDynamic(dyn, model, ctx);

    const planetSelect = containerEl.querySelector("#climPlanetSelect");
    if (planetSelect) {
      replaceSelectOptions(
        planetSelect,
        pList.map((planet) => ({
          value: planet.id,
          label: planet.name || planet.inputs?.name || planet.id,
          selected: planet.id === selected?.id,
        })),
      );
    }

    requestAnimationFrame(() => {
      const canvas = containerEl.querySelector("#climBandCanvas");
      if (canvas) drawLatitudeBands(canvas, model.zones);
    });

    if (planetSelect) {
      planetSelect.addEventListener("change", () => {
        selectPlanet(planetSelect.value);
        render();
      });
    }

    const altNum = containerEl.querySelector("#climAltitude");
    const altSlider = containerEl.querySelector("#climAltitudeSlider");
    if (altNum && altSlider) {
      let ready = false;
      bindNumberAndSlider({
        numberEl: altNum,
        sliderEl: altSlider,
        min: 0,
        max: 10000,
        step: 100,
        onChange(v) {
          state.altitudeM = v;
          if (!ready) return;
          save();
          update();
        },
      });
      ready = true;
    }
  }

  render();

  // Tutorial (hosted on document.body because render() resets containerEl.innerHTML)
  const tutHost = document.createElement("div");
  document.body.appendChild(tutHost);
  const tut = createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.climate.tutorial",
    container: tutHost,
  });
  containerEl.addEventListener("click", (e) => {
    if (e.target.closest("#climTutorials")) tut?.toggle();
  });
  const tutObs = new MutationObserver(() => {
    if (!containerEl.isConnected) {
      tut?.destroy();
      tutHost.remove();
      tutObs.disconnect();
    }
  });
  tutObs.observe(containerEl.parentNode || document.body, { childList: true });
}
