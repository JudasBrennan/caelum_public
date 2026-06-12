import * as store from "./store.js";
import { confirmDestructiveAction } from "./destructiveActionDialog.js";
import { isXlsxFile, importLegacyWorldsmithWorkbook } from "./legacyXlsxImport.js";
import { attachTooltips, tipAttr, tipIcon } from "./tooltip.js";
import { createSolPresetEnvelope } from "./solPreset.js";
import { createRealmspacePresetEnvelope } from "./realmspacePreset.js";
import { createArrakisPresetEnvelope } from "./arrakisPreset.js";
import { buildPageIntroHtml } from "./pageIntro.js";
import { createTutorial } from "./tutorial.js";
import {
  assertImportFileWithinLimit,
  assertImportTextWithinLimit,
  formatBytes,
  getImportLimitLabel,
  isLargeImport,
  nextImportTurn,
} from "./importSafety.js";
import { createElement, replaceChildren } from "./domHelpers.js";
import {
  buildClearSavedDataPlan,
  buildReplaceCurrentWorldPlan,
} from "./store/destructiveActions.js";
import {
  clearAllSavedData as clearAllSavedDataFromPersistence,
  clearOwnedSessionStorageKeys as clearOwnedSessionStorageKeysFromPersistence,
} from "./store/persistenceBridge.js";
import { buildImportPreviewSummary } from "../engine/worldAdapters.js";

const { exportEnvelope, validateEnvelope, importWorld, createBackup, listBackups, restoreBackup } =
  store;
const { normalizeWorld } = store;

let importExportCompatibilityOverrides = null;

const TIP_LABEL = {
  Export:
    "Export the full world model as JSON, including star, system, planets, moons, moon-world inputs, assignments, and settings.",
  Backups: "Automatic restore points created before imports are applied.",
  Import:
    "Validate and import a previously exported JSON world file or a WorldSmith 8.x XLSX workbook.",
  "Download JSON": "Download the current world as a JSON file.",
  "Copy to clipboard": "Copy the current export JSON to your clipboard.",
  "Refresh view": "Regenerate the export preview from current saved data.",
  "Clear saved data":
    "Remove all WorldSmith saved data from this browser, including backups. This cannot be undone.",
  "Validate import": "Check import JSON structure and show a pre-import summary.",
  "Replace current world": "Apply the validated import and replace the current saved world.",
  "Import Sol preset":
    "Load and import a built-in Sol preset (Mercury-Pluto, Jupiter-Neptune, asteroid and Kuiper belts, flagship moons, and Halley).",
  "Import Realmspace preset":
    "Load a Forgotten Realms / Spelljammer preset (Anadia-Chandos, Coliar, Glyth, Selune, and Calendar of Harptos).",
  "Import Arrakis preset":
    "Load the Arrakis (Dune) preset: Canopus system with Seban, Menaris, Arrakis, Ven, gas giants Extaris and Revona, moons Krelln and Arvon, and Imperial Standard calendar.",
  "Import file": "Select either a JSON export file or a WorldSmith 8.x XLSX workbook.",
  "Import JSON text": "Paste JSON here for validation and import.",
  "Export JSON text": "Read-only JSON export preview.",
  "Moon world data":
    "Moon atmosphere, hydrosphere, climate, geology, biosphere, and habitability outputs are recalculated from the exported moon inputs when the world is loaded again.",
};

const JSON_IMPORT_LIMIT_LABEL = getImportLimitLabel("json");
const XLSX_IMPORT_LIMIT_LABEL = getImportLimitLabel("xlsx");
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function setStatus(el, msg, kind = "info") {
  if (!el) return;
  const normalizedKind = kind === "bad" ? "error" : kind;
  el.textContent = msg;
  el.dataset.kind = normalizedKind;
}

function formatHostFrameLabel(hostFrameId = "") {
  switch (String(hostFrameId || "").trim()) {
    case "star_b":
      return "Star B";
    case "star_c":
      return "Star C";
    case "star_d":
      return "Star D";
    case "pair_ab":
      return "Pair A+B";
    case "pair_abc":
      return "Pair (A+B)+C";
    case "pair_abcd":
      return "Pair ((A+B)+C)+D";
    case "star_a":
    default:
      return "Star A";
  }
}

function formatTopologyLabel(topologyKind = "") {
  switch (String(topologyKind || "").trim()) {
    case "binary":
      return "Binary";
    case "triple":
      return "Triple";
    case "quad":
      return "Quad";
    case "single":
    default:
      return "Single";
  }
}

function textSizeBytes(text) {
  return new Blob([String(text || "")]).size;
}

async function maybeWarnLargeImport(statusEl, bytes, label) {
  if (!isLargeImport(bytes)) return;
  setStatus(
    statusEl,
    `${label} (${formatBytes(bytes)}). Parsing happens on the main thread and may take a moment.`,
    "info",
  );
  await nextImportTurn();
}

function resolveImportExportCompatibilityValue(key, fallbackValue) {
  if (
    importExportCompatibilityOverrides &&
    Object.prototype.hasOwnProperty.call(importExportCompatibilityOverrides, key)
  ) {
    return importExportCompatibilityOverrides[key];
  }
  return fallbackValue;
}

export function __setImportExportCompatibilityOverridesForTests(overrides = null) {
  importExportCompatibilityOverrides =
    overrides && typeof overrides === "object" ? { ...overrides } : null;
}

function clearLegacyWorldsmithLocalStorageKeysForCompatibility() {
  try {
    if (
      typeof localStorage?.length !== "number" ||
      typeof localStorage?.key !== "function" ||
      typeof localStorage?.removeItem !== "function"
    ) {
      return 0;
    }

    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && String(key).startsWith("worldsmith.")) toRemove.push(key);
    }

    let removedCount = 0;
    for (const key of toRemove) {
      try {
        localStorage.removeItem(key);
        removedCount += 1;
      } catch {}
    }
    return removedCount;
  } catch {
    return 0;
  }
}

function clearOwnedSessionStorageKeysForCompatibility() {
  const clearOwnedSessionStorageKeys = resolveImportExportCompatibilityValue(
    "clearOwnedSessionStorageKeys",
    clearOwnedSessionStorageKeysFromPersistence,
  );
  if (typeof clearOwnedSessionStorageKeys === "function") {
    return clearOwnedSessionStorageKeys();
  }

  try {
    if (
      typeof sessionStorage?.length !== "number" ||
      typeof sessionStorage?.key !== "function" ||
      typeof sessionStorage?.removeItem !== "function"
    ) {
      return 0;
    }

    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      if (
        key === "worldsmith.guidedCreation.launch" ||
        String(key).startsWith("worldsmith.guidedCreation.session.")
      ) {
        toRemove.push(key);
      }
    }

    let removedCount = 0;
    for (const key of toRemove) {
      try {
        sessionStorage.removeItem(key);
        removedCount += 1;
      } catch {}
    }
    return removedCount;
  } catch {
    return 0;
  }
}

async function clearLegacySavedDataCompatibilityFallback() {
  try {
    const removedLocalStorageCount = clearLegacyWorldsmithLocalStorageKeysForCompatibility();
    const removedSessionStorageCount = clearOwnedSessionStorageKeysForCompatibility();
    try {
      window.dispatchEvent(new CustomEvent("worldsmith:worldChanged"));
    } catch {}
    return {
      ok: true,
      removedCount: null,
      scope: "legacy-only",
      confirmedDurableClear: false,
      driver: "legacy-compatibility",
      removedLocalStorageCount,
      removedSessionStorageCount,
      warning:
        "Cleared legacy browser keys and guided session state, but could not confirm IndexedDB or other durable browser storage was removed.",
    };
  } catch {
    return {
      ok: false,
      removedCount: null,
      scope: "legacy-only",
      confirmedDurableClear: false,
      driver: "legacy-compatibility",
      error: "Legacy compatibility clear failed.",
    };
  }
}

async function clearAllSavedDataCompatibly() {
  const clearAllSavedDataFromStore = resolveImportExportCompatibilityValue(
    "clearAllSavedData",
    store.clearAllSavedData,
  );
  if (typeof clearAllSavedDataFromStore === "function") {
    return clearAllSavedDataFromStore();
  }

  const clearAllSavedDataDurably = resolveImportExportCompatibilityValue(
    "clearAllSavedDataFromPersistence",
    clearAllSavedDataFromPersistence,
  );
  if (typeof clearAllSavedDataDurably === "function") {
    return clearAllSavedDataDurably();
  }

  return clearLegacySavedDataCompatibilityFallback();
}

async function confirmClearSavedData() {
  return confirmDestructiveAction(
    buildClearSavedDataPlan({
      hasBackups: (listBackups() || []).length > 0,
    }),
  );
}

async function confirmReplaceCurrentWorld(sourceLabel, confirmLabel = "Replace current world") {
  return confirmDestructiveAction(
    buildReplaceCurrentWorldPlan({
      sourceLabel,
      confirmLabel,
    }),
  );
}

const TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "The Import/Export page lets you save your entire world as a JSON file " +
      "and restore it later. Use it to back up your work, share worlds, or " +
      "start from a preset.",
  },
  {
    title: "Exporting",
    body:
      "Click Export JSON to download your world, or Copy to Clipboard to " +
      "paste it elsewhere. The file includes your star, system, all planets, " +
      "moons, calendar, and settings.",
  },
  {
    title: "Importing",
    body:
      "Drop a JSON file or click Import to load a saved world. The tool " +
      "validates the file and shows a summary before applying. An automatic " +
      "backup is created before any import.",
  },
  {
    title: "Presets",
    body:
      "Load built-in worlds like Sol (our Solar System), Realmspace " +
      "(D&D Spelljammer), or Arrakis (Dune) for instant starting points " +
      "or inspiration.",
  },
];

export function initImportExportPage(root) {
  let pendingImport = null; // { world, meta }

  root.innerHTML = `
    <div class="page">
      <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--import-export" aria-hidden="true"></span><span>Import/Export</span></h1>
        <button id="ioTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        ${buildPageIntroHtml({
          summary: "Back up, restore, and replace the full world model stored in this browser.",
          controls:
            "Current export JSON, browser backups, import validation, and the built-in preset entry points.",
          affects:
            "The entire saved world, including stars, bodies, calendars, assignments, and settings.",
          primaryAction:
            "Export before risky changes, then validate an import before replacing the current world.",
        })}
      </div>
    </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel__header"><h2>Export ${tipIcon(TIP_LABEL["Export"] || "")}</h2></div>
          <div class="panel__body">
            <div class="hint">This exports <b>all</b> data (star, system, planets, moons, moon-world inputs, locks, slots, and settings).</div>
            <div style="height:10px"></div>

            <div class="io-actions">
              <button id="btn-download" type="button" ${tipAttr(TIP_LABEL["Download JSON"] || "")}>Download JSON</button>
              <button id="btn-copy" type="button" ${tipAttr(TIP_LABEL["Copy to clipboard"] || "")}>Copy to clipboard</button>
              <button id="btn-refresh" type="button" ${tipAttr(TIP_LABEL["Refresh view"] || "")}>Refresh view</button>
              <button id="btn-clear-data" type="button" class="small danger" ${tipAttr(TIP_LABEL["Clear saved data"] || "")}>Clear saved data</button>
            </div>

            <div style="height:10px"></div>
            <textarea id="txt-json" class="io-textarea" spellcheck="false" ${tipAttr(TIP_LABEL["Export JSON text"] || "")}></textarea>
            <div id="status-export" class="io-status" data-kind="info"></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__header"><h2>Import & Backups ${tipIcon(TIP_LABEL["Import"] || "")}</h2></div>
            <div class="panel__body">
              <div class="label">Backups ${tipIcon(TIP_LABEL["Backups"] || "")}</div>
              <div class="hint">A backup is created automatically before applying an import. If something goes wrong, restore one here.</div>
            <div style="height:10px"></div>
            <div id="backupList" class="io-backups"></div>
            <div style="height:14px"></div>

            <div class="label">Import ${tipIcon(TIP_LABEL["Import"] || "")}</div>
            <div class="hint">Choose a previously exported JSON file, a WorldSmith 8.x XLSX workbook, or paste JSON into the box below. You will see a summary before anything is replaced, including a compact moon-world snapshot when moons are present.</div>
            <div style="height:10px"></div>

            <div class="io-actions">
              <input id="file" type="file" accept="application/json,.json,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ${tipAttr(TIP_LABEL["Import file"] || "")} />
              <button id="btn-import" type="button" ${tipAttr(TIP_LABEL["Validate import"] || "")}>Validate import</button>
              <button id="btn-sol-preset" type="button" ${tipAttr(TIP_LABEL["Import Sol preset"] || "")}>Import Sol preset</button>
              <button id="btn-realmspace-preset" type="button" ${tipAttr(TIP_LABEL["Import Realmspace preset"] || "")}>Import Realmspace preset</button>
              <button id="btn-arrakis-preset" type="button" ${tipAttr(TIP_LABEL["Import Arrakis preset"] || "")}>Import Arrakis preset</button>
            </div>

            <div style="height:10px"></div>

            <div id="importPreview" class="io-import-preview" style="display:none"></div>
            <div class="io-import-actions" id="importActions" style="display:none">
              <button id="btn-apply-import" type="button" class="btn-primary" ${tipAttr(TIP_LABEL["Replace current world"] || "")}>Replace current world</button>
              <button id="btn-cancel-import" type="button">Cancel</button>
            </div>

            <div style="height:10px"></div>
            <textarea id="txt-import" class="io-textarea" spellcheck="false" placeholder="{ ... }" ${tipAttr(TIP_LABEL["Import JSON text"] || "")}></textarea>
            <div id="status-import" class="io-status" data-kind="info"></div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Notes</h2></div>
        <div class="panel__body">
          <ul class="bullets">
            <li>WorldSmith Web stores your data in your browser storage (IndexedDB plus small browser settings keys), not in cookies.</li>
            <li>If you clear site data, use a different browser, or use a different device, your data will not follow you unless you export and import.</li>
            <li>Imported files are validated and migrated to the latest format automatically where possible.</li>
            <li>Moon atmosphere, hydrosphere, climate, geology, biosphere, and habitability outputs are derived from saved moon inputs and survive save/load/import/export by recomputation.</li>
            <li>XLSX imports identify Star/System/Planet/Moon tabs by sheet structure, so tab order changes and duplicated tab copies are supported.</li>
            <li>JSON imports above ${JSON_IMPORT_LIMIT_LABEL} and XLSX imports above ${XLSX_IMPORT_LIMIT_LABEL} are rejected to keep browser imports responsive.</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  const txtJson = root.querySelector("#txt-json");
  const txtImport = root.querySelector("#txt-import");
  const statusExport = root.querySelector("#status-export");
  const statusImport = root.querySelector("#status-import");
  const btnDownload = root.querySelector("#btn-download");
  const btnCopy = root.querySelector("#btn-copy");
  const btnRefresh = root.querySelector("#btn-refresh");
  const btnClearData = root.querySelector("#btn-clear-data");
  const btnImport = root.querySelector("#btn-import");
  const btnSolPreset = root.querySelector("#btn-sol-preset");
  const btnRealmspacePreset = root.querySelector("#btn-realmspace-preset");
  const btnArrakisPreset = root.querySelector("#btn-arrakis-preset");
  const fileInput = root.querySelector("#file");

  const backupListEl = root.querySelector("#backupList");
  if (backupListEl) {
    backupListEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-restore]");
      if (!btn) return;
      const id = btn.getAttribute("data-restore");
      const ok = restoreBackup(id);
      setStatus(
        statusImport,
        ok ? "Restored backup." : "Could not restore backup.",
        ok ? "ok" : "bad",
      );
      refreshExportView();
    });
  }
  const importPreviewEl = root.querySelector("#importPreview");
  const importActionsEl = root.querySelector("#importActions");
  const btnApplyImport = root.querySelector("#btn-apply-import");
  const btnCancelImport = root.querySelector("#btn-cancel-import");

  attachTooltips(root);
  createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.io.tutorial",
    container: root,
    triggerBtn: root.querySelector("#ioTutorials"),
  });
  btnDownload?.setAttribute("data-tip", TIP_LABEL["Download JSON"] || "");
  btnCopy?.setAttribute("data-tip", TIP_LABEL["Copy to clipboard"] || "");
  btnRefresh?.setAttribute("data-tip", TIP_LABEL["Refresh view"] || "");
  btnClearData?.setAttribute("data-tip", TIP_LABEL["Clear saved data"] || "");
  btnImport?.setAttribute("data-tip", TIP_LABEL["Validate import"] || "");
  btnSolPreset?.setAttribute("data-tip", TIP_LABEL["Import Sol preset"] || "");
  btnRealmspacePreset?.setAttribute("data-tip", TIP_LABEL["Import Realmspace preset"] || "");
  btnArrakisPreset?.setAttribute("data-tip", TIP_LABEL["Import Arrakis preset"] || "");
  btnApplyImport?.setAttribute("data-tip", TIP_LABEL["Replace current world"] || "");
  fileInput?.setAttribute("data-tip", TIP_LABEL["Import file"] || "");

  function refreshExportView() {
    const env = exportEnvelope();
    const str = JSON.stringify(env, null, 2);
    txtJson.value = str;
    setStatus(statusExport, `Ready. ${str.length.toLocaleString("en-GB")} characters.`, "ok");
  }

  function renderBackups() {
    if (!backupListEl) return;
    const items = listBackups();
    if (!items.length) {
      replaceChildren(
        backupListEl,
        createElement("div", { className: "hint", text: "No backups yet." }),
      );
      return;
    }
    replaceChildren(
      backupListEl,
      items.map((b) => {
        const when = (b.createdUtc || "").replace("T", " ").replace("Z", " UTC");
        const restoreBtn = createElement("button", {
          attrs: { type: "button" },
          dataset: { restore: b.id },
          text: "Restore",
        });
        return createElement("div", { className: "io-backup-row" }, [
          createElement("div", { className: "io-backup-meta" }, [
            createElement("div", { className: "io-backup-title", text: "Backup" }),
            createElement("div", { className: "io-backup-sub", text: when }),
          ]),
          createElement("div", { className: "io-backup-actions" }, [restoreBtn]),
        ]);
      }),
    );
  }

  function showImportPreview(world) {
    let normalisedWorld = null;
    let meta = null;
    try {
      normalisedWorld = normalizeWorld(world);
      meta = buildImportPreviewSummary(normalisedWorld, { rawWorld: world });
    } catch (error) {
      hideImportPreview();
      setStatus(statusImport, `Could not build import preview: ${error?.message || error}`, "bad");
      return false;
    }

    pendingImport = { world: normalisedWorld, meta };
    if (!importPreviewEl || !importActionsEl) return;

    const m = pendingImport.meta;
    const debrisText = m.debrisCount
      ? m.debrisRanges
          .map((d) => {
            const hostSuffix =
              m.topologyKind !== "single" && d.hostFrameLabel ? ` (${d.hostFrameLabel})` : "";
            return `${d.name}${hostSuffix}: ${d.inner}-${d.outer} AU`;
          })
          .join(" | ")
      : "-";
    importPreviewEl.style.display = "block";
    importActionsEl.style.display = "flex";

    const tecParts = [];
    if (m.tecRanges) tecParts.push(`${m.tecRanges} range(s)`);
    if (m.tecInactive) tecParts.push(`${m.tecInactive} inactive`);
    if (m.tecVolcanoes) tecParts.push(`${m.tecVolcanoes} volcano(es)`);
    if (m.tecRifts) tecParts.push(`${m.tecRifts} rift(s)`);
    const moonWorlds = m.moonWorlds || {
      withAtmosphere: 0,
      withLiquidOrVapour: 0,
      withSubsurfaceOcean: 0,
      withSurfaceBiosphere: 0,
    };
    const moonWorldText =
      m.moons > 0
        ? `${moonWorlds.withAtmosphere} atmosphere-bearing | ${moonWorlds.withLiquidOrVapour} wet/steam | ${moonWorlds.withSubsurfaceOcean} subsurface-ocean | ${moonWorlds.withSurfaceBiosphere} non-sterile surface`
        : "-";
    const subtypeText = Array.isArray(m.planetarySubtypeSummary)
      ? m.planetarySubtypeSummary
          .filter((entry) => entry?.count > 0)
          .map((entry) => `${entry.label || entry.id} x${entry.count}`)
          .join(", ")
      : "";

    const grid = createElement("div", { className: "io-preview-grid" });
    const addRow = (label, value) => {
      grid.append(
        createElement("div", {}, [createElement("strong", { text: label })]),
        createElement("div", { text: value }),
      );
    };

    addRow(
      "Star",
      `${m.spec ? m.spec : "-"}${m.starMass != null ? ` | ${m.starMass} Msol` : ""}${
        m.starAge != null ? ` | ${m.starAge} Gyr` : ""
      }`,
    );
    addRow(
      "Home system",
      `${formatTopologyLabel(m.topologyKind)} | ${m.starCount || 1} star${Number(m.starCount || 1) === 1 ? "" : "s"}${
        m.defaultHostFrameId ? ` | default ${formatHostFrameLabel(m.defaultHostFrameId)}` : ""
      }`,
    );
    if (m.planetaryBodies != null) {
      const buckets = [
        `${m.rockyLikeBodies || 0} rocky/surface`,
        `${m.volatileBodies || 0} volatile`,
        `${m.giantBodies || 0} giant`,
        `${m.substellarBodies || 0} substellar`,
      ];
      addRow("Planetary bodies", `${m.planetaryBodies} total (${buckets.join(", ")})`);
      addRow("Exotic subtypes", subtypeText || "-");
    }
    addRow("Planets", `${m.planets} total (${m.assigned} assigned, ${m.unassigned} unassigned)`);
    addRow("Moons", `${m.moons} total`);
    addRow("Moon worlds", moonWorldText);
    addRow("Gas giants", `${m.gasCount} total${m.gas != null ? ` (outermost ${m.gas} AU)` : ""}`);
    addRow("Debris disks", debrisText);
    addRow("Comets", `${m.cometCount || 0} total`);
    addRow(
      "Oort cloud",
      `${m.oortCloudMode || "Auto"}${m.oortCloudCustomised ? " | customized" : ""}`,
    );
    addRow("Tectonics", m.hasTectonics ? tecParts.join(", ") || "defaults" : "-");
    addRow("Population", m.hasPopulation ? m.popTechEra || "configured" : "-");
    addRow(
      "Climate",
      m.hasClimate ? (m.climAltitude ? `altitude ${m.climAltitude} m` : "sea level") : "-",
    );
    addRow("Calendar", m.hasCalendar ? "included" : "-");

    replaceChildren(importPreviewEl, [
      grid,
      createElement("div", {
        className: "hint",
        attrs: { style: "margin-top:8px" },
        text: "Import will replace your current saved world. A backup will be created automatically first. Moon-world atmosphere, hydrosphere, climate, geology, biosphere, and habitability outputs are rebuilt from the imported inputs after load.",
      }),
    ]);
    return true;
  }

  function hideImportPreview() {
    pendingImport = null;
    if (importPreviewEl) importPreviewEl.style.display = "none";
    if (importActionsEl) importActionsEl.style.display = "none";
    if (importPreviewEl) replaceChildren(importPreviewEl);
  }

  async function parseImportText(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) {
      setStatus(statusImport, "No import JSON provided.", "bad");
      return null;
    }
    try {
      assertImportTextWithinLimit(trimmed, "Pasted JSON");
    } catch (error) {
      setStatus(
        statusImport,
        `${error?.message || error} Use file import for smaller chunks.`,
        "bad",
      );
      return null;
    }
    await maybeWarnLargeImport(
      statusImport,
      textSizeBytes(trimmed),
      "Validating large JSON import",
    );
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      setStatus(statusImport, `Invalid JSON: ${e?.message || e}`, "bad");
      return null;
    }
  }

  btnRefresh.addEventListener("click", refreshExportView);

  btnDownload.addEventListener("click", () => {
    const env = exportEnvelope();
    const json = JSON.stringify(env, null, 2);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mon = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ][now.getMonth()];
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const stamp = `${yyyy}${mon}${dd}_${hh}${mm}hrs`;
    downloadText(`worldsmith-export-${stamp}.json`, json);
    setStatus(statusExport, "Downloaded JSON.", "ok");
  });

  btnCopy.addEventListener("click", async () => {
    const ok = await copyText(txtJson.value || "");
    setStatus(
      statusExport,
      ok ? "Copied to clipboard." : "Could not copy (browser blocked clipboard).",
      ok ? "ok" : "bad",
    );
  });

  btnClearData?.addEventListener("click", async () => {
    const shouldClear = await confirmClearSavedData();
    if (!shouldClear) {
      setStatus(statusExport, "Clear saved data cancelled.", "info");
      return;
    }

    const clearResult = await clearAllSavedDataCompatibly();
    if (!clearResult?.ok) {
      refreshExportView();
      renderBackups();
      setStatus(
        statusExport,
        `Could not fully clear saved data: ${clearResult?.error || "browser storage error"}.`,
        "bad",
      );
      setStatus(statusImport, "Saved data was not fully cleared.", "bad");
      return;
    }

    hideImportPreview();
    txtImport.value = "";
    if (fileInput) fileInput.value = "";
    refreshExportView();
    renderBackups();
    if (clearResult.confirmedDurableClear === false) {
      setStatus(
        statusExport,
        clearResult.warning ||
          "Legacy browser keys were cleared, but durable browser storage could not be confirmed.",
        "info",
      );
      setStatus(
        statusImport,
        "Legacy browser keys were cleared, but durable storage could not be confirmed.",
        "info",
      );
      return;
    }

    setStatus(statusExport, "All saved WorldSmith data has been cleared.", "ok");
    setStatus(statusImport, "Saved data cleared.", "info");
  });

  // Validate import (file or text) and show preview
  btnImport.addEventListener("click", async () => {
    const data = await parseImportText(txtImport.value);
    if (!data) return;
    const v = validateEnvelope(data);
    if (!v.ok) {
      setStatus(statusImport, `Import failed:\n- ${v.errors.join("\n- ")}`, "bad");
      hideImportPreview();
      return;
    }
    setStatus(statusImport, "Validated. Review the summary and confirm to apply.", "ok");
    showImportPreview(v.world);
  });

  btnSolPreset.addEventListener("click", async () => {
    const envelope = createSolPresetEnvelope();
    txtImport.value = JSON.stringify(envelope, null, 2);

    const v = validateEnvelope(envelope);
    if (!v.ok) {
      setStatus(statusImport, `Sol preset failed validation:\n- ${v.errors.join("\n- ")}`, "bad");
      hideImportPreview();
      return;
    }

    if (!showImportPreview(v.world)) return;
    const shouldApply = await confirmReplaceCurrentWorld("the Sol preset", "Import preset");

    if (!shouldApply) {
      setStatus(
        statusImport,
        "Sol preset loaded. Review the summary and click Replace current world to apply.",
        "info",
      );
      return;
    }

    createBackup(5);
    importWorld(v.world);
    hideImportPreview();
    renderBackups();
    refreshExportView();
    setStatus(statusImport, "Sol preset imported (a backup was created first).", "ok");
  });

  btnRealmspacePreset.addEventListener("click", async () => {
    const envelope = createRealmspacePresetEnvelope();
    txtImport.value = JSON.stringify(envelope, null, 2);

    const v = validateEnvelope(envelope);
    if (!v.ok) {
      setStatus(
        statusImport,
        `Realmspace preset failed validation:\n- ${v.errors.join("\n- ")}`,
        "bad",
      );
      hideImportPreview();
      return;
    }

    if (!showImportPreview(v.world)) return;
    const shouldApply = await confirmReplaceCurrentWorld("the Realmspace preset", "Import preset");

    if (!shouldApply) {
      setStatus(
        statusImport,
        "Realmspace preset loaded. Review the summary and click Replace current world to apply.",
        "info",
      );
      return;
    }

    createBackup(5);
    importWorld(v.world);
    hideImportPreview();
    renderBackups();
    refreshExportView();
    setStatus(statusImport, "Realmspace preset imported (a backup was created first).", "ok");
  });

  btnArrakisPreset.addEventListener("click", async () => {
    const envelope = createArrakisPresetEnvelope();
    txtImport.value = JSON.stringify(envelope, null, 2);

    const v = validateEnvelope(envelope);
    if (!v.ok) {
      setStatus(
        statusImport,
        `Arrakis preset failed validation:\n- ${v.errors.join("\n- ")}`,
        "bad",
      );
      hideImportPreview();
      return;
    }

    if (!showImportPreview(v.world)) return;
    const shouldApply = await confirmReplaceCurrentWorld(
      "the Arrakis (Dune) preset",
      "Import preset",
    );

    if (!shouldApply) {
      setStatus(
        statusImport,
        "Arrakis preset loaded. Review the summary and click Replace current world to apply.",
        "info",
      );
      return;
    }

    createBackup(5);
    importWorld(v.world);
    hideImportPreview();
    renderBackups();
    refreshExportView();
    setStatus(statusImport, "Arrakis preset imported (a backup was created first).", "ok");
  });

  fileInput.addEventListener("change", async () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    try {
      const kind = isXlsxFile(f) ? "xlsx" : "json";
      assertImportFileWithinLimit(f, kind);
      await maybeWarnLargeImport(
        statusImport,
        f.size,
        `Reading ${kind === "xlsx" ? "large XLSX workbook" : "large JSON import"}`,
      );

      if (kind === "xlsx") {
        const parsed = await importLegacyWorldsmithWorkbook(f);
        const v = validateEnvelope(parsed.world);
        if (!v.ok) {
          setStatus(statusImport, `Import failed:\n- ${v.errors.join("\n- ")}`, "bad");
          hideImportPreview();
          return;
        }

        txtImport.value = JSON.stringify({ world: parsed.world }, null, 2);
        const planetTabs = (parsed.summary.planetSheetNames || []).slice(0, 4).join(", ");
        const moonTabs = (parsed.summary.moonSheetNames || []).slice(0, 4).join(", ");
        const planetTabsSuffix = parsed.summary.planetSheetNames?.length > 4 ? ", ..." : "";
        const moonTabsSuffix = parsed.summary.moonSheetNames?.length > 4 ? ", ..." : "";
        setStatus(
          statusImport,
          `XLSX parsed (star: ${parsed.summary.starSheet || "?"}, system: ${parsed.summary.systemSheet || "?"}). Imported ${parsed.summary.planetSheetsImported} planet tab(s) [${planetTabs}${planetTabsSuffix}] and ${parsed.summary.moonSheetsImported} moon tab(s) [${moonTabs}${moonTabsSuffix}]. Review and confirm.`,
          "ok",
        );
        if (!showImportPreview(v.world)) return;
        return;
      }

      const text = await f.text();
      txtImport.value = text;
      // auto-validate
      const data = await parseImportText(text);
      if (!data) return;
      const v = validateEnvelope(data);
      if (!v.ok) {
        setStatus(statusImport, `Import failed:\n- ${v.errors.join("\n- ")}`, "bad");
        hideImportPreview();
        return;
      }
      setStatus(statusImport, "Validated. Review the summary and confirm to apply.", "ok");
      showImportPreview(v.world);
    } catch (e) {
      setStatus(statusImport, `Could not read file: ${e?.message || e}`, "bad");
      hideImportPreview();
    }
  });

  btnApplyImport.addEventListener("click", async () => {
    if (!pendingImport?.world) return;
    const confirmed = await confirmReplaceCurrentWorld("the validated import");
    if (!confirmed) {
      setStatus(statusImport, "Import cancelled.", "info");
      return;
    }
    createBackup(5);
    importWorld(pendingImport.world);
    hideImportPreview();
    renderBackups();
    refreshExportView();
    setStatus(statusImport, "Import applied (a backup was created first).", "ok");
  });

  btnCancelImport.addEventListener("click", () => {
    hideImportPreview();
    setStatus(statusImport, "Import cancelled.", "info");
  });

  refreshExportView();
  renderBackups();
  setStatus(statusImport, "");
}
