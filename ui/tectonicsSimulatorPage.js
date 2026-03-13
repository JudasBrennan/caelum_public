import { fmt } from "../engine/utils.js";
import { initTectonicsSimulator } from "./tectonicsSimulator.js";
import { getPlanetTectonicContext } from "./tectonicsPage.js";
import { escapeHtml } from "./uiHelpers.js";
import { getSelectedPlanet, loadWorld, updateWorld } from "./store.js";

function readLaunchWorkspacePatch() {
  const query = location.hash.includes("?") ? location.hash.split("?")[1] : "";
  const params = new URLSearchParams(query);
  const patch = {};
  const mode = params.get("mode");
  const projection = params.get("projection");
  if (mode === "plate" || mode === "terrain") patch.mode = mode;
  if (projection === "flat" || projection === "sphere") patch.projection = projection;
  return patch;
}

function applyLaunchWorkspacePatch() {
  const patch = readLaunchWorkspacePatch();
  if (!Object.keys(patch).length) return;
  updateWorld({
    tectonics: {
      simulator: {
        workspace: patch,
      },
    },
  });
}

export function initTectonicsSimulatorPage(containerEl) {
  if (!containerEl) return () => {};

  let cleanupSimulator = null;

  function cleanup() {
    if (typeof cleanupSimulator === "function") {
      cleanupSimulator();
      cleanupSimulator = null;
    }
  }

  function render() {
    cleanup();
    applyLaunchWorkspacePatch();

    const world = loadWorld();
    const planet = getSelectedPlanet(world);
    const planetContext = getPlanetTectonicContext(world);
    const tectonics = world?.tectonics || {};
    const regime = planet?.inputs?.tectonicRegime || "mobile";
    const ridgeHeightM = Number(tectonics.ridgeHeightM) || 2600;
    const spreadingRateFraction =
      tectonics.spreadingRateFraction != null ? Number(tectonics.spreadingRateFraction) : 0.5;
    const simulatorRootMarkup = planet
      ? `<div id="tectonicsSimulatorPageRoot"></div>`
      : `<div class="panel"><div class="panel__body"><p class="hint">Create or select a planet before opening the simulator workspace.</p></div></div>`;

    containerEl.innerHTML = `
      <div class="panel">
        <div class="panel__header">
          <div>
            <div class="section-title">Surface Studio</div>
            <h1 class="panel__title">Plate Simulator Workspace</h1>
            <p class="hint">
              Edit plate ownership, inspect derived geology, preview terrain, and prepare exports in one dedicated workspace.
            </p>
          </div>
          <div class="button-row">
            <button type="button" id="tecSimPageBack">Back to Tectonics</button>
          </div>
        </div>
        <div class="panel__body">
          <div class="kpi-grid">
            <div class="kpi-wrap"><div class="kpi">
              <div class="kpi__label">Active Planet</div>
              <div class="kpi__value">${escapeHtml(planet?.name || planet?.inputs?.name || "No planet")}</div>
              <div class="kpi__meta">Workspace state persists across route entry and reload.</div>
            </div></div>
            <div class="kpi-wrap"><div class="kpi">
              <div class="kpi__label">Tectonic Regime</div>
              <div class="kpi__value">${escapeHtml(regime)}</div>
              <div class="kpi__meta">Ridge height ${fmt(ridgeHeightM, 0)} m</div>
            </div></div>
            <div class="kpi-wrap"><div class="kpi">
              <div class="kpi__label">Spread Fraction</div>
              <div class="kpi__value">${fmt(spreadingRateFraction * 100, 0)}%</div>
              <div class="kpi__meta">Gravity ${fmt(planetContext.gravityG, 2)} g</div>
            </div></div>
          </div>
          ${simulatorRootMarkup}
        </div>
      </div>
    `;

    containerEl.querySelector("#tecSimPageBack")?.addEventListener("click", () => {
      location.hash = "#/tectonics";
    });

    const root = containerEl.querySelector("#tectonicsSimulatorPageRoot");
    if (!root || !planet) return;
    cleanupSimulator = initTectonicsSimulator(root, {
      planetContext,
      tectonicRegime: regime,
      ridgeHeightM,
      spreadingRateFraction,
    });
  }

  render();
  return cleanup;
}
