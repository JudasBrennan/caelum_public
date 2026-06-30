import { calcPopulation, TECH_ERAS } from "../engine/population.js";
import { fmt } from "../engine/utils.js";
import { attachTooltips, tipIcon } from "./tooltip.js";
import { structuredTip } from "./tooltipCopy.js";
import { escapeHtml } from "./uiHelpers.js";
import { statRowsHTML } from "./statRows.js";
import { enableKpiInteractions } from "./planet/outputRender.js";
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

const TIP_LABEL = {};

// ── Planet context extraction ───────────────────────────────

Object.assign(TIP_LABEL, {
  Population: structuredTip({
    overview: "Procedural population model for a selected rocky world or supported surface body.",
    drawnFrom:
      "Solved planet radius, inferred/overridden ocean fraction, climate-zone habitability, productivity context, and user-authored civilisation settings.",
    interpretAs:
      "It estimates capacity, growth state, density, and regional distribution for worldbuilding use.",
    caveat:
      "This is not an economic, demographic, migration, or political simulation; it is a bounded carrying-capacity model.",
    references: "See Science & Maths: population and habitability context.",
  }),
  "Technology Era": structuredTip({
    overview: "Civilisation technology band used to seed density and default growth assumptions.",
    feedsInto:
      "Carrying capacity, default growth rate, current population projection, and density outputs.",
    typicalRange:
      "Hunter-gatherer is sparse; medieval and industrial eras raise productive-land density; sci-fi high assumes intensive infrastructure.",
    caveat: "Era is a coarse worldbuilding proxy, not a full development-history model.",
    references: "See Science & Maths: population carrying capacity.",
  }),
  "Growth Rate": structuredTip({
    overview: "Intrinsic yearly growth rate for the logistic population curve.",
    feedsInto:
      "Current population, saturation, doubling time, and growth-curve shape over elapsed time.",
    interpretAs:
      "The effective rate slows as population approaches carrying capacity: r_eff = r x (1 - P/K).",
    caveat:
      "The model does not simulate age structure, disease, shocks, migration, or policy changes.",
    references: "Verhulst 1838; see Science & Maths: logistic growth.",
  }),
  "Carrying Capacity": structuredTip({
    overview: "Maximum population supported by the modelled productive land.",
    drawnFrom:
      "Productive area, technology-era density, crop fraction, and crop/livestock efficiency assumptions.",
    interpretAs:
      "Values near or above current population indicate how close the model is to resource saturation.",
    caveat:
      "It represents broad food/land capacity, not trade, energy supply, imports, or non-agricultural limits.",
    references: "See Science & Maths: population carrying capacity.",
  }),
  "Ocean Coverage": structuredTip({
    overview: "Population-page land/ocean split.",
    feedsInto:
      "Land area, habitable area, productive area, carrying capacity, and density outputs.",
    drawnFrom:
      "Auto mode follows solved inferred surface-ocean coverage when available; manual mode uses the authored population override.",
    caveat:
      "Manual population overrides affect population/visual land-use outputs and do not rewrite the planet hydrosphere.",
    references: "See Science & Maths: surface ocean coverage.",
  }),
  Habitability: structuredTip({
    overview: "Fraction of land treated as broadly settlement-suitable.",
    feedsInto: "Habitable area, habitable density, productivity, and carrying capacity.",
    drawnFrom:
      "Auto mode uses area-weighted climate zones; polar/special zones are excluded unless you override the percentage.",
    caveat:
      "This is a land-use suitability screen, not a guarantee of comfort, technology, or biosphere support.",
    references: "See Science & Maths: climate zones and habitability context.",
  }),
  Productivity: structuredTip({
    overview: "Fraction of habitable land treated as agriculturally or grazing productive.",
    feedsInto: "Productive area, carrying capacity, and the land-use cascade.",
    drawnFrom:
      "Auto mode uses aridity/productivity context; manual mode uses the authored productivity percentage.",
    caveat: "Soil, irrigation, infrastructure, and crop choice are simplified into one scalar.",
    references: "See Science & Maths: productivity context.",
  }),
  "Crop Fraction": structuredTip({
    overview: "Share of productive land assigned to crop production instead of grazing.",
    feedsInto: "Carrying capacity through the crop/livestock efficiency factor.",
    interpretAs:
      "Higher crop fractions support more people per productive area; lower values imply more grazing or less intensive food production.",
    caveat: "This is a food-efficiency proxy, not a complete diet or land-management model.",
    references: "See Science & Maths: population carrying capacity.",
  }),
  "Zipf Exponent": structuredTip({
    overview: "Controls how unevenly population is distributed across generated regions.",
    feedsInto: "Continent and region population ranks in the distribution table.",
    interpretAs:
      "q = 1 approximates classic Zipf behaviour; lower q is more even, higher q concentrates more population in the top-ranked region.",
    caveat: "It shapes settlement hierarchy only; it does not place cities spatially.",
    references: "Zipf 1949; see Science & Maths: rank-size distribution.",
  }),
  "Current Population": structuredTip({
    overview: "Projected population after the selected elapsed time.",
    drawnFrom:
      "Initial population, carrying capacity, intrinsic growth rate, and elapsed years through the logistic equation.",
    interpretAs: "It approaches carrying capacity asymptotically as time increases.",
    caveat: "External shocks, migration, technology shifts, and collapse cycles are not simulated.",
    references: "Verhulst 1838; see Science & Maths: logistic growth.",
  }),
  Saturation: structuredTip({
    overview: "Current population as a share of carrying capacity.",
    drawnFrom: "Current projected population divided by carrying capacity.",
    interpretAs:
      "Low saturation leaves room for near-exponential growth; high saturation means growth slows strongly.",
    caveat: "A high value is a model pressure signal, not a prediction of social stability.",
    references: "See Science & Maths: logistic growth.",
  }),
  "Habitable Density": structuredTip({
    overview: "Population density over habitable land only.",
    drawnFrom: "Current population divided by habitable land area.",
    interpretAs:
      "Compare with overall density to see whether population is concentrated into a small suitable fraction.",
    caveat: "The model does not distribute settlements within individual climate zones.",
    references: "See Science & Maths: population carrying capacity.",
  }),
  "Surface Area": structuredTip({
    overview: "Total surface area of the selected body.",
    drawnFrom: "Solved body radius using 4 x pi x r^2.",
    feedsInto: "Land area, ocean area, habitable area, and productive area.",
    caveat:
      "Oblateness, terrain roughness, and elevation hypsometry do not change this simple spherical area.",
    references: "See Science & Maths: geometry and population context.",
  }),
  "Land Area": structuredTip({
    overview: "Non-ocean area available before habitability/productivity filtering.",
    drawnFrom: "Surface area multiplied by 1 - ocean fraction.",
    feedsInto: "Habitable area, productive area, carrying capacity, and density outputs.",
    caveat: "Manual ocean overrides on this page do not change the physical hydrosphere model.",
    references: "See Science & Maths: surface ocean coverage.",
  }),
  "Habitable Area": structuredTip({
    overview: "Land area that passes the model's broad settlement-suitability screen.",
    drawnFrom: "Land area multiplied by habitability percentage.",
    feedsInto: "Productive area, habitable density, and carrying capacity.",
    caveat:
      "Local hazards, latitude-level detail, and infrastructure are outside this page's model.",
    references: "See Science & Maths: climate zones and habitability context.",
  }),
  "Productive Area": structuredTip({
    overview: "Habitable land that is treated as food-productive.",
    drawnFrom: "Habitable area multiplied by productivity percentage.",
    feedsInto: "Carrying capacity and land-use cascade outputs.",
    caveat:
      "This collapses soils, irrigation, rainfall, and land management into one productivity factor.",
    references: "See Science & Maths: productivity context.",
  }),
  "Doubling Time": structuredTip({
    overview: "Time needed for the current population to double at the current effective rate.",
    drawnFrom: "ln(2) divided by the logistic effective growth rate.",
    interpretAs:
      "Doubling time increases as population nears carrying capacity because r_eff slows.",
    caveat: "Undefined or very large values can appear when growth is near zero or saturated.",
    references: "See Science & Maths: logistic growth.",
  }),
  "Overall Density": structuredTip({
    overview: "Population density over all land, including unsuitable land.",
    drawnFrom: "Current population divided by total land area.",
    interpretAs: "Compare with habitable density to estimate how constrained settlement is.",
    caveat: "It does not distinguish urban, rural, wilderness, or protected land.",
    references: "See Science & Maths: population carrying capacity.",
  }),
  "Initial Population": structuredTip({
    overview: "Starting population at t = 0 for the logistic growth model.",
    feedsInto: "Current population, saturation trajectory, and growth curve.",
    interpretAs:
      "Smaller starts spend longer in the early exponential phase before approaching the S-curve midpoint.",
    caveat:
      "The model does not infer initial population from colonisation history or biosphere state.",
    references: "See Science & Maths: logistic growth.",
  }),
  "Time Elapsed": structuredTip({
    overview: "Years advanced along the logistic growth curve.",
    feedsInto: "Current population, saturation, and the orange marker on the growth chart.",
    interpretAs: "Increasing time moves the projection toward carrying capacity.",
    caveat: "It is scenario time, not necessarily the planet's geological or stellar age.",
    references: "See Science & Maths: logistic growth.",
  }),
  Continents: structuredTip({
    overview: "Number of top-level landmass groups used for rank-size distribution.",
    feedsInto: "Generated continent and region population breakdowns.",
    caveat: "The model does not map actual coastlines or terrain geometry.",
    references: "See Science & Maths: rank-size distribution.",
  }),
  "Regions per Continent": structuredTip({
    overview: "Number of regional subdivisions generated under each continent.",
    feedsInto: "Regional population table and settlement hierarchy.",
    caveat: "Regions are procedural rank buckets, not geographic polygons.",
    references: "See Science & Maths: rank-size distribution.",
  }),
  "Land Use Cascade": structuredTip({
    overview: "Visual funnel from total surface area to productive land.",
    drawnFrom:
      "Surface area, ocean fraction, habitability percentage, and productivity percentage.",
    interpretAs: "Each step shows how much area remains available after the previous filter.",
    caveat:
      "It shows modelled land suitability only, not legal, cultural, or ecological restrictions.",
    references: "See Science & Maths: population carrying capacity.",
  }),
  "Growth Curve": structuredTip({
    overview: "Logistic population curve for the selected scenario.",
    drawnFrom: "Initial population, carrying capacity, growth rate, and elapsed time.",
    interpretAs:
      "The dashed line is carrying capacity and the marker is the current elapsed-time point.",
    caveat: "It is a smooth model curve and does not include boom/bust events.",
    references: "Verhulst 1838; see Science & Maths: logistic growth.",
  }),
});

function getPopulationContext(world) {
  const fallback = {
    radiusKm: 6371,
    waterRegime: "Extensive oceans",
    climateZones: [],
  };
  const planet = getSelectedPlanet(world);
  if (!planet) return fallback;
  const body =
    findPlanetaryBody(world, `planet:${planet.id}`) || findPlanetaryBody(world, planet.id);
  const pageBody = body ? solvePlanetaryBodyForWorld(world, body).model || body : null;
  const pageApplicability = pageBody ? getSubtypePageApplicability(pageBody, "population") : null;
  const subtypeMessage =
    pageApplicability && pageApplicability.status !== "full"
      ? buildSubtypeUnsupportedMessage(pageBody, "population")
      : "";
  if (pageApplicability?.status === "none") {
    return {
      ...fallback,
      unsupportedSurfaceMessage: subtypeMessage,
    };
  }

  const { model } = solvePlanetExactForWorld(world, planet);

  if (!model?.derived) return fallback;

  const climateZones = Array.isArray(model.derived.surfaceClimateContext?.outputs?.zones)
    ? model.derived.surfaceClimateContext.outputs.zones
    : [];

  return {
    radiusKm: model.derived.radiusKm || 6371,
    waterRegime: model.derived.waterRegime || "Extensive oceans",
    hydrosphere: model.derived.hydrosphere || null,
    surfaceClimateContext: model.derived.surfaceClimateContext || null,
    productivityContext: model.derived.productivityContext || null,
    climateZones,
    limitedSurfaceMessage: pageApplicability?.status === "limited" ? subtypeMessage : "",
  };
}

// ── Canvas: growth curve ────────────────────────────────────

function drawGrowthCurve(canvas, timeSeries, K, currentT) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const textColor = getComputedStyle(canvas).getPropertyValue("color") || "#ccc";
  const accentColor = "#7eb2ff";
  const mutedColor = "#a6abcc";

  const PAD = { top: 16, bottom: 28, left: 64, right: 16 };
  const plotW = w - PAD.left - PAD.right;
  const plotH = h - PAD.top - PAD.bottom;

  ctx.clearRect(0, 0, w, h);

  if (!timeSeries.length || K <= 0) return;

  const tMax = timeSeries[timeSeries.length - 1].year || 1;
  const pMax = K * 1.05;

  function xOf(t) {
    return PAD.left + (t / tMax) * plotW;
  }
  function yOf(p) {
    return PAD.top + plotH - (p / pMax) * plotH;
  }

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const gy = PAD.top + (plotH * i) / 5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, gy);
    ctx.lineTo(PAD.left + plotW, gy);
    ctx.stroke();
  }

  // K dashed line
  ctx.strokeStyle = mutedColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  const ky = yOf(K);
  ctx.beginPath();
  ctx.moveTo(PAD.left, ky);
  ctx.lineTo(PAD.left + plotW, ky);
  ctx.stroke();
  ctx.setLineDash([]);

  // K label
  ctx.fillStyle = mutedColor;
  ctx.font = "9px var(--font-mono, monospace)";
  ctx.textAlign = "left";
  ctx.fillText("K", PAD.left + 4, ky - 4);

  // S-curve
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  timeSeries.forEach((pt, i) => {
    const x = xOf(pt.year);
    const y = yOf(pt.population);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Current-time marker
  if (currentT > 0 && currentT <= tMax) {
    const mx = xOf(currentT);
    ctx.strokeStyle = "#ff9966";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, PAD.top);
    ctx.lineTo(mx, PAD.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#ff9966";
    ctx.font = "9px var(--font-mono, monospace)";
    ctx.textAlign = "center";
    ctx.fillText("t", mx, PAD.top - 4);
  }

  // Axes labels
  ctx.fillStyle = textColor;
  ctx.font = "9px var(--font-mono, monospace)";

  // Y-axis
  ctx.textAlign = "right";
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const val = (K * i) / ySteps;
    const y = yOf(val);
    ctx.fillText(fmtAxisPop(val), PAD.left - 6, y + 3);
  }

  // X-axis
  ctx.textAlign = "center";
  const xSteps = 5;
  for (let i = 0; i <= xSteps; i++) {
    const val = (tMax * i) / xSteps;
    const x = xOf(val);
    ctx.fillText(fmt(val, 0), x, PAD.top + plotH + 16);
  }

  // Axis titles
  ctx.fillStyle = mutedColor;
  ctx.textAlign = "center";
  ctx.fillText("Years", PAD.left + plotW / 2, h - 2);
}

function fmtAxisPop(n) {
  if (n >= 1e12) return fmt(n / 1e12, 1) + "T";
  if (n >= 1e9) return fmt(n / 1e9, 1) + "B";
  if (n >= 1e6) return fmt(n / 1e6, 1) + "M";
  if (n >= 1e3) return fmt(n / 1e3, 0) + "K";
  return fmt(n, 0);
}

// ── Canvas: land-use cascade ────────────────────────────────

function drawLandUseCascade(canvas, model) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const textColor = getComputedStyle(canvas).getPropertyValue("color") || "#ccc";

  const PAD = { left: 80, right: 8, top: 4, bottom: 4 };
  const barW = w - PAD.left - PAD.right;
  const rowH = Math.floor((h - PAD.top - PAD.bottom) / 3);
  const gap = 3;

  const total = model.population.surfaceAreaKm2 || 1;
  const landFrac = model.population.landAreaKm2 / total;
  const habFrac =
    model.population.landAreaKm2 > 0
      ? model.population.habitableAreaKm2 / model.population.landAreaKm2
      : 0;
  const prodFrac =
    model.population.habitableAreaKm2 > 0
      ? model.population.productiveAreaKm2 / model.population.habitableAreaKm2
      : 0;

  const rows = [
    {
      label: "Surface",
      fracs: [
        { f: 1 - landFrac, c: "#3a7cc4", l: "Ocean" },
        { f: landFrac, c: "#6b8f5e", l: "Land" },
      ],
    },
    {
      label: "Land",
      fracs: [
        { f: 1 - habFrac, c: "#666", l: "Uninhabitable" },
        { f: habFrac, c: "#6b8f5e", l: "Habitable" },
      ],
    },
    {
      label: "Habitable",
      fracs: [
        { f: 1 - prodFrac, c: "#8a7a55", l: "Unproductive" },
        { f: prodFrac, c: "#6b8f5e", l: "Productive" },
      ],
    },
  ];

  rows.forEach((row, ri) => {
    const y = PAD.top + ri * (rowH + gap);

    // Row label
    ctx.fillStyle = textColor;
    ctx.font = "10px var(--font-mono, monospace)";
    ctx.textAlign = "right";
    ctx.fillText(row.label, PAD.left - 8, y + rowH / 2 + 4);

    // Segments
    let x = PAD.left;
    for (const seg of row.fracs) {
      const segW = barW * seg.f;
      if (segW < 1) continue;
      ctx.fillStyle = seg.c;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x, y, Math.max(segW - 1, 1), rowH);
      ctx.globalAlpha = 1;
      if (segW > 30) {
        ctx.fillStyle = textColor;
        ctx.font = "9px var(--font-mono, monospace)";
        ctx.textAlign = "center";
        const full = `${seg.l} ${fmt(seg.f * 100, 0)}%`;
        const short = `${fmt(seg.f * 100, 0)}%`;
        const pad = 6;
        const label = ctx.measureText(full).width + pad < segW ? full : short;
        if (ctx.measureText(label).width + pad < segW) {
          ctx.fillText(label, x + segW / 2, y + rowH / 2 + 3);
        }
      }
      x += segW;
    }
  });
}

const TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "The Population page models growth, carrying capacity, and settlement " +
      "distribution for a civilisation on your planet. It uses logistic " +
      "growth and Zipf rank-size distributions.",
  },
  {
    title: "Technology Era",
    body:
      "Select an era from hunter-gatherer to sci-fi. Each era sets baseline " +
      "parameters for carrying capacity and growth rate. Higher technology " +
      "supports larger populations per unit of land.",
  },
  {
    title: "Growth Parameters",
    body:
      "Adjust growth rate, initial population, and elapsed time. The S-curve " +
      "shows logistic growth approaching carrying capacity. Saturation " +
      "percentage indicates how full the world is.",
  },
  {
    title: "Land Use",
    body:
      "Configure ocean coverage, habitability, and productivity percentages. " +
      "The cascade shows how surface area narrows from total area to " +
      "productive farmland. Crop and livestock splits affect caloric output.",
  },
  {
    title: "Distribution",
    body:
      "Population is distributed across continents and regions using " +
      "Zipf\u2019s law. The rank-size chart shows how cities are distributed, " +
      "from the largest capital to smaller settlements.",
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

function populationOverrideCount(state = {}) {
  return [
    state.oceanPctOverride,
    state.habitablePctOverride,
    state.productivePctOverride,
    state.cropPctOverride,
  ].filter((value) => value != null && value !== "").length;
}

function buildPopulationCockpitMarkup({
  selected,
  state,
  model,
  unsupportedMessage = "",
  empty = false,
} = {}) {
  const overrideCount = populationOverrideCount(state);
  return workflowHtml(
    createDiagnosticCockpit({
      id: "populationCockpit",
      title: "Population",
      summary: empty
        ? "Create a rocky planet before modelling settlement capacity."
        : "Reads the selected rocky planet's surface context, then applies population-only civilization assumptions.",
      current: {
        label: "Selected planet",
        value: empty ? "No compatible planet" : planetLabel(selected),
        meta: unsupportedMessage
          ? "Population output is unavailable for this body."
          : "Population diagnostic target.",
      },
      statusItems: [
        {
          label: "Reads from",
          value: "Planets",
          meta: "Radius, climate zones, water regime, and hydrosphere context.",
        },
        {
          label: "Diagnostic only",
          value: unsupportedMessage
            ? "Unsupported"
            : model
              ? model.display.currentPopulation
              : "Waiting",
          meta: "Planet science is not rewritten from this page.",
          tone: unsupportedMessage ? "warn" : "",
        },
        {
          label: "Authoring override",
          value: overrideCount ? `${overrideCount} active` : "Auto",
          meta: "Ocean, habitability, productivity, and crop assumptions save only to Population.",
        },
      ],
      source: {
        label: "Source",
        value: "Reads from Planets",
        meta: "Change inputs on Planets. Local civilization assumptions stay on Population.",
      },
      details: {
        id: "populationContextDisclosure",
        title: "What this reads",
        summary: "Planet surface, climate, hydrosphere, and optional population assumptions.",
        items: [
          "Reads from Planets: radius, climate zones, water regime, hydrosphere, and surface classification.",
          "Change inputs on Planets: edit climate, water, orbit, and habitability assumptions upstream.",
          "Diagnostic only: population outputs do not rewrite planet science context.",
          "Authoring override: local ocean, habitability, productivity, and crop percentages affect population outputs only.",
        ],
      },
      nextStep: {
        id: "populationNextStepStrip",
        recommendation: empty
          ? "Create a rocky planet before modelling population."
          : "Edit habitability or climate assumptions on Planets when capacity looks wrong.",
        actions: [
          { label: "Edit planet", href: "#/planet", primary: true },
          { label: "Open Climate", href: "#/climate" },
          { label: "Open Calendar", href: "#/calendar" },
        ],
      },
    }),
  );
}

function buildPopulationDependencyNoticeMarkup() {
  return workflowHtml(
    createDiagnosticDependencyNotice({
      id: "populationDependencyNotice",
      title: "Reads from Planets",
      body: "Reads from the selected rocky planet's radius, water regime, climate zones, and hydrosphere context. Change inputs on Planets.",
      source:
        "Diagnostic only for planet science. Authoring override sliders here affect population outputs without rewriting inferred climate or ocean coverage.",
      actions: [{ label: "Change inputs on Planets", href: "#/planet" }],
    }),
  );
}

function buildPopulationObjectSelectorMarkup(planets, selected, unsupportedMessage = "") {
  return workflowHtml(
    createDiagnosticObjectSelector({
      id: "populationObjectSelector",
      title: "Planet selection",
      summary: "Choose the rocky planet whose settlement model should read upstream science from.",
      selectedLabel: "Selected planet",
      selectedValue: planetLabel(selected),
      selectedMeta: unsupportedMessage
        ? "No compatible population output for this body."
        : "Population diagnostic target.",
      selectId: "popPlanetSelect",
      selectLabel: "Planet",
      selectOptions: planetSelectOptions(planets, selected),
    }),
  );
}

function buildPopulationEmptyPageMarkup(planets, selected) {
  return `
      <div class="page">
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Population</h1></div>
          <div class="panel__body">
            ${buildPopulationCockpitMarkup({ selected, empty: true })}
            ${buildPopulationDependencyNoticeMarkup()}
            ${workflowHtml(
              createDiagnosticEmptyState({
                id: "populationEmptyState",
                title: "No compatible rocky planet",
                body: "Population needs a rocky planet before it can read climate, hydrosphere, and surface-area context.",
                actions: [{ label: "Create a planet", href: "#/planet" }],
              }),
            )}
            ${planets.length ? buildPopulationObjectSelectorMarkup(planets, selected) : ""}
          </div>
        </div>
      </div>`;
}

export function initPopulationPage(containerEl) {
  const world = loadWorld();
  const planets = listPlanets(world);

  if (!planets.length) {
    containerEl.innerHTML = buildPopulationEmptyPageMarkup(planets, null);
    return;
  }

  const pop = world.population || {};
  const state = {
    techEra: pop.techEra || "Medieval",
    initialPopulation: pop.initialPopulation || 1000,
    growthRate: pop.growthRate ?? null,
    timeElapsedYears: pop.timeElapsedYears ?? 500,
    continentCount: pop.continentCount || 6,
    regionCount: pop.regionCount || 10,
    zipfExponent: pop.zipfExponent ?? 1.0,
    oceanPctOverride: pop.oceanPctOverride ?? null,
    habitablePctOverride: pop.habitablePctOverride ?? null,
    productivePctOverride: pop.productivePctOverride ?? null,
    cropPctOverride: pop.cropPctOverride ?? null,
  };

  function save() {
    updateWorld({ population: { ...state } });
  }

  function render() {
    const w = loadWorld();
    const pList = listPlanets(w);
    const selected = getSelectedPlanet(w);
    const pCtx = getPopulationContext(w);
    const unsupportedMessage = pCtx.unsupportedSurfaceMessage || "";
    const limitedMessage = pCtx.limitedSurfaceMessage || "";
    const model = unsupportedMessage ? null : calcPopulation({ ...pCtx, ...state });

    if (unsupportedMessage) {
      containerEl.innerHTML = `
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${tipIcon(TIP_LABEL["Population"])}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${buildPopulationCockpitMarkup({
              selected,
              state,
              unsupportedMessage,
            })}
            ${buildPopulationDependencyNoticeMarkup()}
            ${buildPopulationObjectSelectorMarkup(pList, selected, unsupportedMessage)}
            ${workflowHtml(
              createDiagnosticEmptyState({
                id: "populationUnsupportedState",
                title: "No compatible population output",
                body: unsupportedMessage,
                actions: [{ label: "Change inputs on Planets", href: "#/planet" }],
              }),
            )}
          </div>
        </div>
      </div>`;
      attachTooltips(containerEl);
      const planetSel = containerEl.querySelector("#popPlanetSelect");
      if (planetSel) {
        planetSel.addEventListener("change", () => {
          selectPlanet(planetSel.value);
          render();
        });
      }
      return;
    }

    // Tech era options
    const eraOptions = TECH_ERAS.map(
      (e) =>
        `<option value="${escapeHtml(e)}"${e === state.techEra ? " selected" : ""}>${escapeHtml(e)}</option>`,
    ).join("");

    // Auto badges
    const autoBadge = (isAuto) => (isAuto ? '<span class="pop-auto-badge">auto</span>' : "");

    containerEl.innerHTML = `
      <div class="page">
        <div class="panel">
          <div class="panel__header">
            <h1 class="panel__title">Population ${tipIcon(TIP_LABEL["Population"])}</h1>
            <button id="popTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
          </div>
          <div class="panel__body">
            ${buildPopulationCockpitMarkup({
              selected,
              state,
              model,
            })}
            ${buildPopulationDependencyNoticeMarkup()}
            ${buildPopulationObjectSelectorMarkup(pList, selected)}

            ${limitedMessage ? `<div class="derived-readout">${escapeHtml(limitedMessage)}</div>` : ""}

            <section class="kpi-section" id="populationSummary">
              <div class="kpi-section__header"><h3 class="kpi-section__title">Summary</h3></div>
              <div class="kpi-grid">
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Population ${tipIcon(TIP_LABEL["Current Population"])}</div>
                  <div class="kpi__value">${escapeHtml(model.display.currentPopulation)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Carrying Capacity ${tipIcon(TIP_LABEL["Carrying Capacity"])}</div>
                  <div class="kpi__value">${escapeHtml(model.display.carryingCapacity)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Saturation ${tipIcon(TIP_LABEL["Saturation"])}</div>
                  <div class="kpi__value">${escapeHtml(model.display.saturation)}</div>
                </div></div>
                <div class="kpi-wrap"><div class="kpi">
                  <div class="kpi__label">Habitable Density ${tipIcon(TIP_LABEL["Habitable Density"])}</div>
                  <div class="kpi__value">${escapeHtml(model.display.habitableDensity)}</div>
                </div></div>
              </div>
            </section>

            <div class="grid-2" style="margin-top:12px">
              <div class="subsection">
                <h3>Land Use ${tipIcon(TIP_LABEL["Land Use Cascade"])}</h3>

                <div class="form-row">
                  <label>Ocean % ${autoBadge(model.inputs.oceanIsAuto)} ${tipIcon(TIP_LABEL["Ocean Coverage"])}</label>
                  <input type="range" id="popOcean" min="0" max="99" step="1"
                    value="${model.inputs.oceanPct}">
                  <span class="derived-readout">${fmt(model.inputs.oceanPct, 0)}%</span>
                </div>

                <div class="form-row">
                  <label>Habitable % ${autoBadge(model.inputs.habitableIsAuto)} ${tipIcon(TIP_LABEL["Habitability"])}</label>
                  <input type="range" id="popHabitable" min="0" max="100" step="1"
                    value="${model.inputs.habitablePct}">
                  <span class="derived-readout">${fmt(model.inputs.habitablePct, 0)}%</span>
                </div>

                <div class="form-row">
                  <label>Productive % ${autoBadge(model.inputs.productiveIsAuto)} ${tipIcon(TIP_LABEL["Productivity"])}</label>
                  <input type="range" id="popProductive" min="0" max="100" step="1"
                    value="${model.inputs.productivePct}">
                  <span class="derived-readout">${fmt(model.inputs.productivePct, 0)}%</span>
                </div>

                <div class="form-row">
                  <label>Crop % ${tipIcon(TIP_LABEL["Crop Fraction"])}</label>
                  <input type="range" id="popCrop" min="0" max="100" step="1"
                    value="${model.inputs.cropPct}">
                  <span class="derived-readout">${fmt(model.inputs.cropPct, 0)}%</span>
                </div>

                <button id="popResetAuto" class="btn btn--sm" style="margin-top:4px">Reset to auto</button>

                <canvas id="popCascadeCanvas" class="pop-cascade-canvas"></canvas>

                ${statRowsHTML([
                  {
                    labelHtml: `Surface Area ${tipIcon(TIP_LABEL["Surface Area"])}`,
                    value: model.display.surfaceArea,
                  },
                  {
                    labelHtml: `Land Area ${tipIcon(TIP_LABEL["Land Area"])}`,
                    value: model.display.landArea,
                  },
                  {
                    labelHtml: `Habitable Area ${tipIcon(TIP_LABEL["Habitable Area"])}`,
                    value: model.display.habitableArea,
                  },
                  {
                    labelHtml: `Productive Area ${tipIcon(TIP_LABEL["Productive Area"])}`,
                    value: model.display.productiveArea,
                  },
                ])}
              </div>

              <div class="subsection">
                <h3>Growth Model ${tipIcon(TIP_LABEL["Growth Curve"])}</h3>

                <div class="form-row">
                  <label for="popTechEra">Tech Era ${tipIcon(TIP_LABEL["Technology Era"])}</label>
                  <select id="popTechEra">${eraOptions}</select>
                </div>

                <div class="form-row">
                  <label>Initial Population ${tipIcon(TIP_LABEL["Initial Population"])}</label>
                  <input type="number" id="popInitPop" min="1" step="1"
                    value="${state.initialPopulation}">
                </div>

                <div class="form-row">
                  <label>Growth Rate ${tipIcon(TIP_LABEL["Growth Rate"])}</label>
                  <input type="range" id="popGrowthRate" min="0.001" max="0.05" step="0.001"
                    value="${model.inputs.growthRate}">
                  <span class="derived-readout">${escapeHtml(model.display.growthRate)}</span>
                </div>

                <div class="form-row">
                  <label>Time Elapsed (years) ${tipIcon(TIP_LABEL["Time Elapsed"])}</label>
                  <input type="number" id="popTime" min="0" step="10"
                    value="${state.timeElapsedYears}">
                </div>

                <canvas id="popGrowthCanvas" class="pop-growth-canvas"></canvas>

                ${statRowsHTML([
                  {
                    labelHtml: `Doubling Time ${tipIcon(TIP_LABEL["Doubling Time"])}`,
                    value: model.display.doublingTime,
                  },
                  {
                    labelHtml: `Overall Density ${tipIcon(TIP_LABEL["Overall Density"])}`,
                    value: model.display.overallDensity,
                  },
                ])}
              </div>
            </div>

            <div class="subsection" style="margin-top:12px">
              <h3>Distribution ${tipIcon(TIP_LABEL["Zipf Exponent"])}</h3>

              <div class="grid-2">
                <div class="form-row">
                  <label>Continents ${tipIcon(TIP_LABEL["Continents"])}</label>
                  <input type="number" id="popContCount" min="1" max="20" step="1"
                    value="${state.continentCount}">
                </div>
                <div class="form-row">
                  <label>Regions per Continent ${tipIcon(TIP_LABEL["Regions per Continent"])}</label>
                  <input type="number" id="popRegCount" min="1" max="50" step="1"
                    value="${state.regionCount}">
                </div>
              </div>

              <div class="form-row">
                <label>Zipf Exponent (q) ${tipIcon(TIP_LABEL["Zipf Exponent"])}</label>
                <input type="range" id="popZipf" min="0.5" max="1.5" step="0.05"
                  value="${state.zipfExponent}">
                <span class="derived-readout">${fmt(state.zipfExponent, 2)}</span>
              </div>

              <div class="pop-dist-list">
                ${model.population.continents
                  .map(
                    (c) => `
                  <details class="pop-dist-card">
                    <summary class="pop-dist-summary">
                      <span class="pop-dist-rank">Continent ${c.rank}</span>
                      <span class="pop-dist-pop">${fmtAxisPop(c.population)}</span>
                      <span class="pop-dist-frac">${fmt(c.fraction * 100, 1)}%</span>
                      <span class="pop-dist-bar-wrap">
                        <span class="pop-dist-bar" style="width:${(c.fraction * 100).toFixed(1)}%"></span>
                      </span>
                    </summary>
                    <div class="pop-dist-regions">
                      <table class="pop-dist-table">
                        <thead><tr><th>Region</th><th>Population</th><th>%</th><th></th></tr></thead>
                        <tbody>
                          ${c.subregions
                            .map(
                              (sr) => `
                            <tr>
                              <td>${sr.rank}</td>
                              <td>${fmtAxisPop(sr.population)}</td>
                              <td>${fmt(sr.fraction * 100, 1)}%</td>
                              <td><span class="pop-dist-bar" style="width:${(sr.fraction * 100).toFixed(1)}%"></span></td>
                            </tr>`,
                            )
                            .join("")}
                        </tbody>
                      </table>
                    </div>
                  </details>`,
                  )
                  .join("")}
              </div>
            </div>

          </div>
        </div>
      </div>`;

    attachTooltips(containerEl);
    enableKpiInteractions(containerEl);

    requestAnimationFrame(() => {
      const growthCanvas = containerEl.querySelector("#popGrowthCanvas");
      if (growthCanvas) {
        drawGrowthCurve(
          growthCanvas,
          model.population.timeSeries,
          model.population.K,
          model.inputs.timeElapsedYears,
        );
      }
      const cascadeCanvas = containerEl.querySelector("#popCascadeCanvas");
      if (cascadeCanvas) drawLandUseCascade(cascadeCanvas, model);
    });

    // ── Event listeners ──

    const planetSel = containerEl.querySelector("#popPlanetSelect");
    if (planetSel) {
      planetSel.addEventListener("change", () => {
        selectPlanet(planetSel.value);
        render();
      });
    }

    const techEra = containerEl.querySelector("#popTechEra");
    if (techEra) {
      techEra.addEventListener("change", () => {
        state.techEra = techEra.value;
        state.growthRate = null; // reset to era default
        save();
        render();
      });
    }

    const initPop = containerEl.querySelector("#popInitPop");
    if (initPop) {
      initPop.addEventListener("change", () => {
        state.initialPopulation = Math.max(1, Number(initPop.value) || 1000);
        save();
        render();
      });
    }

    const growthRate = containerEl.querySelector("#popGrowthRate");
    if (growthRate) {
      growthRate.addEventListener("input", () => {
        state.growthRate = Number(growthRate.value);
        save();
        render();
      });
    }

    const timeSel = containerEl.querySelector("#popTime");
    if (timeSel) {
      timeSel.addEventListener("change", () => {
        state.timeElapsedYears = Math.max(0, Number(timeSel.value) || 0);
        save();
        render();
      });
    }

    const oceanSl = containerEl.querySelector("#popOcean");
    if (oceanSl) {
      oceanSl.addEventListener("input", () => {
        state.oceanPctOverride = Number(oceanSl.value);
        save();
        render();
      });
    }

    const habSl = containerEl.querySelector("#popHabitable");
    if (habSl) {
      habSl.addEventListener("input", () => {
        state.habitablePctOverride = Number(habSl.value);
        save();
        render();
      });
    }

    const prodSl = containerEl.querySelector("#popProductive");
    if (prodSl) {
      prodSl.addEventListener("input", () => {
        state.productivePctOverride = Number(prodSl.value);
        save();
        render();
      });
    }

    const cropSl = containerEl.querySelector("#popCrop");
    if (cropSl) {
      cropSl.addEventListener("input", () => {
        state.cropPctOverride = Number(cropSl.value);
        save();
        render();
      });
    }

    const resetBtn = containerEl.querySelector("#popResetAuto");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.oceanPctOverride = null;
        state.habitablePctOverride = null;
        state.productivePctOverride = null;
        state.cropPctOverride = null;
        save();
        render();
      });
    }

    const contCount = containerEl.querySelector("#popContCount");
    if (contCount) {
      contCount.addEventListener("change", () => {
        state.continentCount = Math.max(1, Math.min(20, Number(contCount.value) || 6));
        save();
        render();
      });
    }

    const regCount = containerEl.querySelector("#popRegCount");
    if (regCount) {
      regCount.addEventListener("change", () => {
        state.regionCount = Math.max(1, Math.min(50, Number(regCount.value) || 10));
        save();
        render();
      });
    }

    const zipfSl = containerEl.querySelector("#popZipf");
    if (zipfSl) {
      zipfSl.addEventListener("input", () => {
        state.zipfExponent = Number(zipfSl.value);
        save();
        render();
      });
    }
  }

  render();

  // Tutorial (hosted on document.body because render() resets containerEl.innerHTML)
  const tutHost = document.createElement("div");
  document.body.appendChild(tutHost);
  const tut = createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.pop.tutorial",
    container: tutHost,
  });
  containerEl.addEventListener("click", (e) => {
    if (e.target.closest("#popTutorials")) tut?.toggle();
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
