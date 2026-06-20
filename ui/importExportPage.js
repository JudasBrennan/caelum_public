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
  buildClearBackupsPlan,
  buildClearCurrentSavedWorldPlan,
  buildClearSavedDataPlan,
  buildDeleteBackupPlan,
  buildReplaceCurrentWorldPlan,
  buildReplaceCurrentWorldWithoutBackupPlan,
  buildRestoreBackupPlan,
} from "./store/destructiveActions.js";
import {
  clearAllSavedData as clearAllSavedDataFromPersistence,
  clearOwnedSessionStorageKeys as clearOwnedSessionStorageKeysFromPersistence,
} from "./store/persistenceBridge.js";
import { buildImportPreviewSummary } from "../engine/worldAdapters.js";

const {
  exportEnvelope,
  validateEnvelope,
  importWorld,
  createBackup,
  createBackupFromRaw,
  listBackups,
  restoreBackup,
  readBackupRaw,
  deleteBackup,
  clearBackups,
  clearCurrentSavedWorld,
  hasSavedWorldInLocalStorage,
  getLastStorageError,
  getSchemaVersion,
} = store;
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
    "Remove all Caelum saved data from this browser, including backups. This cannot be undone.",
  "Start fresh":
    "Remove only the current saved world. Browser backups remain available for restore.",
  "Create backup now": "Create a manual backup of the current saved world.",
  "Delete backups": "Delete the backup library while keeping the current saved world.",
  "Validate import": "Check import JSON structure and show a pre-import summary.",
  "Replace current world": "Apply the validated import and replace the current saved world.",
  "Save import as backup": "Store the validated import in the backup library without applying it.",
  "Replace without backup": "Apply the validated import without creating a pre-replacement backup.",
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

function formatDateStamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mon = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][
    date.getMonth()
  ];
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}${mon}${dd}_${hh}${mm}hrs`;
}

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

function normalizeSourceLabel(source = "") {
  switch (String(source || "").trim()) {
    case "manual":
      return "Manual";
    case "auto-before-import":
      return "Before import";
    case "auto-before-preset":
      return "Before starter world";
    case "auto-before-restore":
      return "Before restore";
    case "import-only":
      return "Imported backup";
    case "legacy":
      return "Legacy";
    default:
      return source ? String(source) : "Backup";
  }
}

function rawWorldToExportEnvelope(raw) {
  const parsed = JSON.parse(raw);
  if (parsed?.world && typeof parsed.world === "object") {
    return {
      ...parsed,
      exportedUtc: new Date().toISOString(),
    };
  }
  return {
    tool: store.TOOL_ID || "Caelum",
    schemaVersion: getSchemaVersion(),
    exportedUtc: new Date().toISOString(),
    world: parsed,
  };
}

function summarizeWorldForBackupMetadata(world, fallbackName = "") {
  let normalized = null;
  try {
    normalized = normalizeWorld(world);
  } catch {
    normalized = world && typeof world === "object" ? world : {};
  }
  const worldName =
    String(
      normalized?.star?.name ||
        normalized?.clusterSystemNames?.home ||
        normalized?.planet?.name ||
        fallbackName ||
        "",
    ).trim() || fallbackName;
  const bodyCounts = {
    planets: Array.isArray(normalized?.planets?.order) ? normalized.planets.order.length : 0,
    moons: Array.isArray(normalized?.moons?.order) ? normalized.moons.order.length : 0,
    gasGiants: Array.isArray(normalized?.system?.gasGiants?.order)
      ? normalized.system.gasGiants.order.length
      : 0,
  };
  return { worldName, bodyCounts };
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

function cloneImportWorld(world) {
  return JSON.parse(JSON.stringify(world || {}));
}

function normaliseImportVisualMode(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function hasImportedCustomVisuals(appearance) {
  if (!appearance || typeof appearance !== "object" || Array.isArray(appearance)) return false;
  const mode = normaliseImportVisualMode(appearance.visualMode);
  return (
    mode === "mixed" ||
    mode === "custom" ||
    (appearance.visualOverrides &&
      typeof appearance.visualOverrides === "object" &&
      !Array.isArray(appearance.visualOverrides))
  );
}

function resetImportedVisualRecord(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  if (!hasImportedCustomVisuals(body.appearance)) return false;
  body.appearance = {
    ...(body.appearance || {}),
    visualMode: "auto",
  };
  delete body.appearance.visualOverrides;
  return true;
}

function resetImportedCustomVisualsInCollection(collection, seen) {
  if (!collection || typeof collection !== "object" || Array.isArray(collection)) return 0;
  const byId =
    collection.byId && typeof collection.byId === "object" && !Array.isArray(collection.byId)
      ? collection.byId
      : {};
  let resetCount = 0;
  for (const [id, body] of Object.entries(byId)) {
    if (resetImportedVisualRecord(body) && !seen.has(id)) {
      seen.add(id);
      resetCount += 1;
    }
  }
  return resetCount;
}

function resetAllImportedCustomVisuals(world) {
  const seen = new Set();
  return (
    resetImportedCustomVisualsInCollection(world?.planetaryBodies, seen) +
    resetImportedCustomVisualsInCollection(world?.planets, seen) +
    resetImportedCustomVisualsInCollection(world?.system?.gasGiants, seen)
  );
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
      "The Import/Export page separates the current saved world, backup library, imports, " +
      "starter worlds, and full browser-data reset actions.",
  },
  {
    title: "Exporting",
    body:
      "Download or copy the current world JSON from Current World. The export includes stars, " +
      "systems, bodies, calendars, assignments, settings, and visual overrides.",
  },
  {
    title: "Backups",
    body:
      "Backups are restore points. You can preview, export, restore, or delete individual " +
      "backups without changing the current saved world unless you choose restore.",
  },
  {
    title: "Importing",
    body:
      "Validate JSON or XLSX imports before applying. The default replacement path creates " +
      "a backup first, and imports can also be saved as backup-only snapshots.",
  },
];

export function initImportExportPage(root) {
  let pendingImport = null;

  root.innerHTML = `
    <div class="page">
      <div class="panel">
        <div class="panel__header">
          <h1 class="panel__title"><span class="ws-icon icon--import-export" aria-hidden="true"></span><span>Import/Export</span></h1>
          <button id="ioTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
        </div>
        <div class="panel__body">
          ${buildPageIntroHtml({
            summary: "Back up, restore, replace, and reset the world model stored in this browser.",
            controls:
              "Current world export, backup library management, import validation, starter worlds, and scoped reset actions.",
            affects:
              "The current saved world, browser backup library, and optional browser storage cleanup actions.",
            primaryAction:
              "Use the current-world and backup-library sections for routine work; use the danger zone only for deletion.",
          })}
        </div>
      </div>

      <div id="ioStorageOverview" class="io-storage-overview" aria-live="polite"></div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel__header"><h2>Current World ${tipIcon(TIP_LABEL["Export"] || "")}</h2></div>
          <div class="panel__body">
            <div id="ioCurrentSummary" class="hint"></div>
            <div class="io-actions io-actions--spaced">
              <button id="btn-download" type="button" ${tipAttr(TIP_LABEL["Download JSON"] || "")}>Download JSON</button>
              <button id="btn-copy" type="button" ${tipAttr(TIP_LABEL["Copy to clipboard"] || "")}>Copy to clipboard</button>
              <button id="btn-refresh" type="button" ${tipAttr(TIP_LABEL["Refresh view"] || "")}>Refresh view</button>
              <button id="btn-manual-backup" type="button" ${tipAttr(TIP_LABEL["Create backup now"] || "")}>Create backup now</button>
              <button id="btn-clear-current" type="button" class="small danger" ${tipAttr(TIP_LABEL["Start fresh"] || "")}>Start fresh, keep backups</button>
            </div>
            <textarea id="txt-json" class="io-textarea io-textarea--export" spellcheck="false" ${tipAttr(TIP_LABEL["Export JSON text"] || "")}></textarea>
            <div id="status-export" class="io-status" data-kind="info"></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__header"><h2>Backup Library ${tipIcon(TIP_LABEL["Backups"] || "")}</h2></div>
          <div class="panel__body">
            <div class="hint">Backups are separate from the current saved world. Restore replaces the current world and creates a pre-restore backup first.</div>
            <div id="backupList" class="io-backups"></div>
            <div id="backupPreview" class="io-import-preview io-backup-preview" style="display:none"></div>
            <div id="status-backups" class="io-status" data-kind="info"></div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel__header"><h2>Import World ${tipIcon(TIP_LABEL["Import"] || "")}</h2></div>
          <div class="panel__body">
            <div class="hint">Choose a JSON export, a WorldSmith 8.x XLSX workbook, or paste JSON below. Validation shows a summary before anything is applied.</div>
            <div class="io-actions io-actions--spaced">
              <input id="file" type="file" accept="application/json,.json,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ${tipAttr(TIP_LABEL["Import file"] || "")} />
              <button id="btn-import" type="button" ${tipAttr(TIP_LABEL["Validate import"] || "")}>Validate import</button>
            </div>
            <div id="importPreview" class="io-import-preview" style="display:none"></div>
            <div class="io-import-actions" id="importActions" style="display:none">
              <button id="btn-apply-import" type="button" class="btn-primary" ${tipAttr(TIP_LABEL["Replace current world"] || "")}>Replace current world</button>
              <button id="btn-import-as-backup" type="button" ${tipAttr(TIP_LABEL["Save import as backup"] || "")}>Save as backup only</button>
              <button id="btn-apply-import-no-backup" type="button" class="small danger" ${tipAttr(TIP_LABEL["Replace without backup"] || "")}>Replace without backup</button>
              <button id="btn-cancel-import" type="button">Cancel</button>
            </div>
            <textarea id="txt-import" class="io-textarea" spellcheck="false" placeholder="{ ... }" ${tipAttr(TIP_LABEL["Import JSON text"] || "")}></textarea>
            <div id="status-import" class="io-status" data-kind="info"></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__header"><h2>Starter Worlds</h2></div>
          <div class="panel__body">
            <div class="hint">Starter worlds use the same replace-current-world flow as imports, with an automatic backup before the preset is applied.</div>
            <div class="io-preset-list">
              <button id="btn-sol-preset" type="button" ${tipAttr(TIP_LABEL["Import Sol preset"] || "")}>Import Sol preset</button>
              <button id="btn-realmspace-preset" type="button" ${tipAttr(TIP_LABEL["Import Realmspace preset"] || "")}>Import Realmspace preset</button>
              <button id="btn-arrakis-preset" type="button" ${tipAttr(TIP_LABEL["Import Arrakis preset"] || "")}>Import Arrakis preset</button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel io-danger-zone">
        <div class="panel__header"><h2>Danger Zone</h2></div>
        <div class="panel__body">
          <div class="hint">These actions are scoped separately. Current-world reset keeps backups; backup deletion keeps the current world; full clear removes both.</div>
          <div class="io-actions">
            <button id="btn-clear-backups" type="button" class="small danger" ${tipAttr(TIP_LABEL["Delete backups"] || "")}>Delete all backups</button>
            <button id="btn-clear-data" type="button" class="small danger" ${tipAttr(TIP_LABEL["Clear saved data"] || "")}>Clear all saved data</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Notes</h2></div>
        <div class="panel__body">
          <ul class="bullets">
            <li>Current saved world means the single world the app loads from this browser.</li>
            <li>Backup library means restore points stored separately from the current saved world.</li>
            <li>Caelum stores your data in browser storage, not cookies. It does not follow you to another browser or device unless you export and import.</li>
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
  const statusBackups = root.querySelector("#status-backups");
  const btnDownload = root.querySelector("#btn-download");
  const btnCopy = root.querySelector("#btn-copy");
  const btnRefresh = root.querySelector("#btn-refresh");
  const btnManualBackup = root.querySelector("#btn-manual-backup");
  const btnClearCurrent = root.querySelector("#btn-clear-current");
  const btnClearBackups = root.querySelector("#btn-clear-backups");
  const btnClearData = root.querySelector("#btn-clear-data");
  const btnImport = root.querySelector("#btn-import");
  const btnSolPreset = root.querySelector("#btn-sol-preset");
  const btnRealmspacePreset = root.querySelector("#btn-realmspace-preset");
  const btnArrakisPreset = root.querySelector("#btn-arrakis-preset");
  const fileInput = root.querySelector("#file");
  const storageOverviewEl = root.querySelector("#ioStorageOverview");
  const currentSummaryEl = root.querySelector("#ioCurrentSummary");
  const backupListEl = root.querySelector("#backupList");
  const backupPreviewEl = root.querySelector("#backupPreview");
  const importPreviewEl = root.querySelector("#importPreview");
  const importActionsEl = root.querySelector("#importActions");
  const btnApplyImport = root.querySelector("#btn-apply-import");
  const btnImportAsBackup = root.querySelector("#btn-import-as-backup");
  const btnApplyImportNoBackup = root.querySelector("#btn-apply-import-no-backup");
  const btnCancelImport = root.querySelector("#btn-cancel-import");

  attachTooltips(root);
  createTutorial({
    steps: TUTORIAL_STEPS,
    storageKey: "worldsmith.io.tutorial",
    container: root,
    triggerBtn: root.querySelector("#ioTutorials"),
  });

  function getCurrentExportJson() {
    return JSON.stringify(exportEnvelope(), null, 2);
  }

  function formatBackupTimestamp(value) {
    return (
      String(value || "")
        .trim()
        .replace("T", " ")
        .replace("Z", " UTC") || "No timestamp"
    );
  }

  function buildOverviewMetric(label, value, note = "") {
    return createElement("div", { className: "io-overview-card" }, [
      createElement("div", { className: "io-overview-label", text: label }),
      createElement("div", { className: "io-overview-value", text: value }),
      note ? createElement("div", { className: "io-overview-note", text: note }) : null,
    ]);
  }

  function refreshStorageOverview() {
    const hasCurrent = hasSavedWorldInLocalStorage();
    const backups = listBackups();
    const storageError = getLastStorageError?.();
    replaceChildren(storageOverviewEl, [
      buildOverviewMetric(
        "Current saved world",
        hasCurrent ? "Stored" : "Not stored",
        hasCurrent
          ? "Loaded automatically by this browser"
          : "Export still shows the default world",
      ),
      buildOverviewMetric(
        "Backup library",
        `${backups.length} ${backups.length === 1 ? "backup" : "backups"}`,
        backups.length
          ? "Available for preview, export, restore, or delete"
          : "No restore points yet",
      ),
      buildOverviewMetric(
        "Storage health",
        storageError ? "Needs attention" : "Ready",
        storageError?.message || "Browser persistence is available",
      ),
    ]);
    if (currentSummaryEl) {
      currentSummaryEl.textContent = hasCurrent
        ? "This section works with the current saved world. Starting fresh here keeps backups available."
        : "No current saved world is stored yet. You can still export the default world or import a replacement.";
    }
    if (btnManualBackup) btnManualBackup.disabled = !hasCurrent;
    if (btnClearCurrent) btnClearCurrent.disabled = !hasCurrent;
    if (btnClearBackups) btnClearBackups.disabled = backups.length === 0;
  }

  function refreshExportView({ updateStatus = true } = {}) {
    const str = getCurrentExportJson();
    txtJson.value = str;
    if (updateStatus) {
      setStatus(statusExport, `Ready. ${str.length.toLocaleString("en-GB")} characters.`, "ok");
    }
    refreshStorageOverview();
  }

  function refreshAll({ updateExportStatus = true } = {}) {
    refreshExportView({ updateStatus: updateExportStatus });
    renderBackups();
    refreshStorageOverview();
  }

  function backupRawToSummary(raw) {
    if (!(typeof raw === "string" && raw)) {
      return {
        ok: false,
        reason: "missing-payload",
        message: "No backup payload was found.",
        details: [
          "The backup index entry exists, but the saved JSON payload for this restore point is missing from browser storage.",
        ],
      };
    }
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return {
        ok: false,
        reason: "invalid-json",
        message: "The backup payload is not valid JSON.",
        details: [error?.message || String(error || "JSON parse failed.")],
      };
    }

    const rawWorld = parsed?.world || parsed;
    const valid = validateEnvelope(parsed);
    let world = null;
    const details = [];
    if (!valid.ok && Array.isArray(valid.errors) && valid.errors.length) {
      details.push(...valid.errors.slice(0, 4));
    }

    try {
      world = normalizeWorld(valid.ok ? valid.world : rawWorld);
    } catch (error) {
      return {
        ok: false,
        reason: valid.ok ? "normalization-failed" : "unsupported-world-shape",
        message: valid.ok
          ? "Caelum could parse the backup, but could not normalize it for preview."
          : "The backup JSON does not match a supported Caelum world shape.",
        details: [...details, error?.message || String(error || "World normalization failed.")],
      };
    }

    try {
      const meta = buildImportPreviewSummary(world, { rawWorld });
      return { ok: true, parsed, world, meta, warnings: details };
    } catch (error) {
      return {
        ok: false,
        reason: "summary-failed",
        message: "Caelum could read the backup, but could not build the preview summary.",
        details: [error?.message || String(error || "Preview summary failed.")],
      };
    }
  }

  function getBackupDisplay(backup) {
    const raw = readBackupRaw(backup.id);
    const summary = backupRawToSummary(raw);
    const metadata = backup.metadata || {};
    const title = metadata.worldName || (summary?.ok ? summary.world?.star?.name : "") || "Backup";
    const source = normalizeSourceLabel(metadata.source || "legacy");
    const byteSize = Number(metadata.byteSize) || textSizeBytes(raw || "");
    const counts = metadata.bodyCounts || {};
    const countText = [
      Number.isFinite(Number(counts.planets)) ? `${counts.planets} planets` : null,
      Number.isFinite(Number(counts.moons)) ? `${counts.moons} moons` : null,
      Number.isFinite(Number(counts.gasGiants)) ? `${counts.gasGiants} giants` : null,
    ]
      .filter(Boolean)
      .join(" | ");
    return {
      title,
      source,
      details: [
        formatBackupTimestamp(backup.createdUtc),
        source,
        byteSize ? formatBytes(byteSize) : null,
        countText || null,
      ]
        .filter(Boolean)
        .join(" | "),
    };
  }

  function renderBackups() {
    if (!backupListEl) return;
    const items = listBackups();
    if (!items.length) {
      replaceChildren(
        backupListEl,
        createElement("div", { className: "hint", text: "No backups yet." }),
      );
      if (backupPreviewEl) {
        backupPreviewEl.style.display = "none";
        replaceChildren(backupPreviewEl);
      }
      refreshStorageOverview();
      return;
    }
    replaceChildren(
      backupListEl,
      items.map((backup) => {
        const display = getBackupDisplay(backup);
        return createElement("div", { className: "io-backup-row" }, [
          createElement("div", { className: "io-backup-meta" }, [
            createElement("div", { className: "io-backup-title", text: display.title }),
            createElement("div", { className: "io-backup-sub", text: display.details }),
          ]),
          createElement("div", { className: "io-backup-actions" }, [
            createElement("button", {
              attrs: { type: "button" },
              dataset: { previewBackup: backup.id },
              text: "Preview",
            }),
            createElement("button", {
              attrs: { type: "button" },
              dataset: { exportBackup: backup.id },
              text: "Export",
            }),
            createElement("button", {
              attrs: { type: "button" },
              dataset: { restore: backup.id },
              text: "Restore",
            }),
            createElement("button", {
              className: "small danger",
              attrs: { type: "button" },
              dataset: { deleteBackup: backup.id },
              text: "Delete",
            }),
          ]),
        ]);
      }),
    );
    refreshStorageOverview();
  }

  function buildPreviewGrid(m) {
    const debrisText = m.debrisCount
      ? m.debrisRanges
          .map((d) => {
            const hostSuffix =
              m.topologyKind !== "single" && d.hostFrameLabel ? ` (${d.hostFrameLabel})` : "";
            return `${d.name}${hostSuffix}: ${d.inner}-${d.outer} AU`;
          })
          .join(" | ")
      : "-";
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
    const customVisualBodies = Number(m.customVisualBodies) || 0;
    const customVisualOverrides = Number(m.customVisualOverrides) || 0;
    const customVisualText = customVisualBodies
      ? `${customVisualBodies} custom ${customVisualBodies === 1 ? "body" : "bodies"}${
          customVisualOverrides
            ? ` | ${customVisualOverrides} active override${customVisualOverrides === 1 ? "" : "s"}`
            : ""
        }`
      : "-";

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
    addRow("Custom visuals", customVisualText);
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
    return grid;
  }

  function buildPreviewChildren(meta, { resetVisuals = false, footerText = "" } = {}) {
    const previewChildren = [buildPreviewGrid(meta)];
    const visualWarnings = Array.isArray(meta.visualImportWarnings)
      ? meta.visualImportWarnings.filter(Boolean)
      : [];
    if (visualWarnings.length) {
      previewChildren.push(
        createElement("div", {
          className: "hint",
          attrs: { style: "margin-top:8px" },
          text: `Visual import warning: ${visualWarnings.join(" ")}`,
        }),
      );
    }
    if (resetVisuals && Number(meta.customVisualBodies || 0) > 0) {
      const resetVisualsButton = createElement("button", {
        className: "small",
        attrs: { type: "button" },
        dataset: { resetImportedVisuals: "true" },
        text: "Reset all imported custom visuals",
      });
      resetVisualsButton.addEventListener("click", () => {
        if (!pendingImport?.world) return;
        const resetWorld = cloneImportWorld(pendingImport.world);
        const resetCount = resetAllImportedCustomVisuals(resetWorld);
        const { sourceLabel, backupSource } = pendingImport;
        if (!showImportPreview(resetWorld, { sourceLabel, backupSource })) return;
        setStatus(
          statusImport,
          resetCount
            ? `Reset custom visuals for ${resetCount} imported ${resetCount === 1 ? "body" : "bodies"}.`
            : "No imported custom visuals needed resetting.",
          "ok",
        );
      });
      previewChildren.push(
        createElement("div", { className: "io-actions", attrs: { style: "margin-top:8px" } }, [
          resetVisualsButton,
        ]),
      );
    }
    if (footerText) {
      previewChildren.push(
        createElement("div", {
          className: "hint",
          attrs: { style: "margin-top:8px" },
          text: footerText,
        }),
      );
    }
    return previewChildren;
  }

  function showImportPreview(world, options = {}) {
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

    pendingImport = {
      world: normalisedWorld,
      meta,
      raw: JSON.stringify(normalisedWorld),
      sourceLabel: options.sourceLabel || "the validated import",
      backupSource: options.backupSource || "auto-before-import",
    };
    if (!importPreviewEl || !importActionsEl) return true;

    importPreviewEl.style.display = "block";
    importActionsEl.style.display = "flex";
    replaceChildren(
      importPreviewEl,
      buildPreviewChildren(meta, {
        resetVisuals: true,
        footerText:
          "Import will replace your current saved world. The default action creates a backup automatically first. Moon-world atmosphere, hydrosphere, climate, geology, biosphere, and habitability outputs are rebuilt from the imported inputs after load.",
      }),
    );
    return true;
  }

  function hideImportPreview() {
    pendingImport = null;
    if (importPreviewEl) importPreviewEl.style.display = "none";
    if (importActionsEl) importActionsEl.style.display = "none";
    if (importPreviewEl) replaceChildren(importPreviewEl);
  }

  function previewBackup(id) {
    const raw = readBackupRaw(id);
    const summary = backupRawToSummary(raw);
    if (!summary?.ok || !summary?.meta) {
      if (backupPreviewEl) {
        backupPreviewEl.style.display = "block";
        replaceChildren(backupPreviewEl, [
          createElement("div", { className: "io-preview-error" }, [
            createElement("strong", { text: "Backup preview unavailable" }),
            createElement("p", { text: summary?.message || "Could not preview this backup." }),
            summary?.details?.length
              ? createElement(
                  "ul",
                  { className: "bullets" },
                  summary.details.map((detail) => createElement("li", { text: detail })),
                )
              : null,
            createElement("p", {
              className: "hint",
              text: "Export may still work if the raw backup payload exists, but restore is not recommended until the backup can be read as a valid Caelum world.",
            }),
          ]),
        ]);
      }
      setStatus(statusBackups, "");
      return;
    }
    backupPreviewEl.style.display = "block";
    replaceChildren(
      backupPreviewEl,
      buildPreviewChildren(summary.meta, {
        footerText: "Backup preview only. Restore is the action that replaces the current world.",
      }),
    );
    setStatus(statusBackups, "Backup preview ready.", "ok");
  }

  function exportBackup(id) {
    const raw = readBackupRaw(id);
    if (!raw) {
      setStatus(statusBackups, "Could not export backup.", "bad");
      return;
    }
    try {
      const json = JSON.stringify(rawWorldToExportEnvelope(raw), null, 2);
      downloadText(`worldsmith-backup-${formatDateStamp()}.json`, json);
      setStatus(statusBackups, "Backup exported.", "ok");
    } catch (error) {
      setStatus(statusBackups, `Could not export backup: ${error?.message || error}`, "bad");
    }
  }

  function createCurrentBackup(source = "manual") {
    const envelope = exportEnvelope();
    const metadata = {
      source,
      ...summarizeWorldForBackupMetadata(envelope.world, "Current world"),
    };
    return createBackup(source === "manual" ? 20 : 5, metadata);
  }

  async function restoreBackupWithConfirmation(id) {
    const backup = listBackups().find((entry) => entry.id === id);
    const display = backup ? getBackupDisplay(backup) : { title: "this backup" };
    const confirmed = await confirmDestructiveAction(
      buildRestoreBackupPlan({ backupLabel: display.title }),
    );
    if (!confirmed) {
      setStatus(statusBackups, "Restore cancelled.", "info");
      return;
    }
    if (hasSavedWorldInLocalStorage()) {
      createCurrentBackup("auto-before-restore");
    }
    const ok = restoreBackup(id);
    setStatus(
      statusImport,
      ok ? "Restored backup." : "Could not restore backup.",
      ok ? "ok" : "bad",
    );
    setStatus(
      statusBackups,
      ok ? "Backup restored." : "Could not restore backup.",
      ok ? "ok" : "bad",
    );
    refreshAll({ updateExportStatus: false });
  }

  async function deleteBackupWithConfirmation(id) {
    const backup = listBackups().find((entry) => entry.id === id);
    const display = backup ? getBackupDisplay(backup) : { title: "this backup" };
    const confirmed = await confirmDestructiveAction(
      buildDeleteBackupPlan({ backupLabel: display.title }),
    );
    if (!confirmed) {
      setStatus(statusBackups, "Delete backup cancelled.", "info");
      return;
    }
    const ok = deleteBackup(id);
    renderBackups();
    refreshStorageOverview();
    setStatus(
      statusBackups,
      ok ? "Backup deleted." : "Could not delete backup.",
      ok ? "ok" : "bad",
    );
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

  async function validateImportData(
    data,
    { sourceLabel = "the validated import", backupSource } = {},
  ) {
    const v = validateEnvelope(data);
    if (!v.ok) {
      setStatus(statusImport, `Import failed:\n- ${v.errors.join("\n- ")}`, "bad");
      hideImportPreview();
      return false;
    }
    setStatus(statusImport, "Validated. Review the summary and confirm to apply.", "ok");
    return showImportPreview(v.world, { sourceLabel, backupSource });
  }

  function applyPendingImport({ createBackupFirst = true, successMessage = "" } = {}) {
    if (!pendingImport?.world) return false;
    const { world, backupSource } = pendingImport;
    if (createBackupFirst && hasSavedWorldInLocalStorage()) {
      createCurrentBackup(backupSource || "auto-before-import");
    }
    importWorld(world);
    hideImportPreview();
    renderBackups();
    refreshExportView({ updateStatus: false });
    setStatus(
      statusImport,
      successMessage ||
        (createBackupFirst
          ? "Import applied (a backup was created first)."
          : "Import applied without creating a backup."),
      "ok",
    );
    return true;
  }

  async function savePendingImportAsBackup() {
    if (!pendingImport?.world || !pendingImport.raw) return;
    const metadata = {
      source: "import-only",
      ...summarizeWorldForBackupMetadata(pendingImport.world, "Imported world"),
    };
    const backup = createBackupFromRaw(pendingImport.raw, 20, metadata);
    renderBackups();
    refreshStorageOverview();
    setStatus(
      statusImport,
      backup
        ? "Import saved as backup without replacing the current world."
        : "Could not save import as backup.",
      backup ? "ok" : "bad",
    );
  }

  async function loadPreset(envelope, sourceLabel, successLabel) {
    txtImport.value = JSON.stringify(envelope, null, 2);
    const v = validateEnvelope(envelope);
    if (!v.ok) {
      setStatus(
        statusImport,
        `${successLabel} preset failed validation:\n- ${v.errors.join("\n- ")}`,
        "bad",
      );
      hideImportPreview();
      return;
    }
    if (!showImportPreview(v.world, { sourceLabel, backupSource: "auto-before-preset" })) return;
    const shouldApply = await confirmReplaceCurrentWorld(sourceLabel, "Import preset");
    if (!shouldApply) {
      setStatus(
        statusImport,
        `${successLabel} preset loaded. Review the summary and click Replace current world to apply.`,
        "info",
      );
      return;
    }
    applyPendingImport({
      createBackupFirst: true,
      successMessage: `${successLabel} preset imported (a backup was created first).`,
    });
  }

  backupListEl?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const previewId = button.getAttribute("data-preview-backup");
    const exportId = button.getAttribute("data-export-backup");
    const restoreId = button.getAttribute("data-restore");
    const deleteId = button.getAttribute("data-delete-backup");
    if (previewId) previewBackup(previewId);
    else if (exportId) exportBackup(exportId);
    else if (restoreId) void restoreBackupWithConfirmation(restoreId);
    else if (deleteId) void deleteBackupWithConfirmation(deleteId);
  });

  btnRefresh.addEventListener("click", () => refreshAll());

  btnDownload.addEventListener("click", () => {
    const json = getCurrentExportJson();
    downloadText(`worldsmith-export-${formatDateStamp()}.json`, json);
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

  btnManualBackup?.addEventListener("click", () => {
    const backup = createCurrentBackup("manual");
    renderBackups();
    refreshStorageOverview();
    setStatus(
      statusBackups,
      backup ? "Manual backup created." : "No current saved world was available to back up.",
      backup ? "ok" : "bad",
    );
  });

  btnClearCurrent?.addEventListener("click", async () => {
    const confirmed = await confirmDestructiveAction(
      buildClearCurrentSavedWorldPlan({ hasBackups: listBackups().length > 0 }),
    );
    if (!confirmed) {
      setStatus(statusExport, "Start fresh cancelled.", "info");
      return;
    }
    const result = await clearCurrentSavedWorld();
    hideImportPreview();
    refreshAll({ updateExportStatus: false });
    setStatus(
      statusExport,
      result?.ok
        ? "Current saved world cleared. Backups were preserved."
        : `Could not clear current saved world: ${result?.error || "browser storage error"}.`,
      result?.ok ? "ok" : "bad",
    );
  });

  btnClearBackups?.addEventListener("click", async () => {
    const backupCount = listBackups().length;
    const confirmed = await confirmDestructiveAction(buildClearBackupsPlan({ backupCount }));
    if (!confirmed) {
      setStatus(statusBackups, "Delete backups cancelled.", "info");
      return;
    }
    const result = await clearBackups();
    renderBackups();
    refreshStorageOverview();
    setStatus(
      statusBackups,
      result?.ok
        ? "Backup library cleared. Current world was preserved."
        : "Could not clear backups.",
      result?.ok ? "ok" : "bad",
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
      refreshAll({ updateExportStatus: false });
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
    refreshAll({ updateExportStatus: false });
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

    setStatus(statusExport, "All saved Caelum data has been cleared.", "ok");
    setStatus(statusImport, "Saved data cleared.", "info");
    setStatus(statusBackups, "Backup library cleared.", "info");
  });

  btnImport.addEventListener("click", async () => {
    const data = await parseImportText(txtImport.value);
    if (!data) return;
    await validateImportData(data);
  });

  btnSolPreset.addEventListener("click", async () => {
    await loadPreset(createSolPresetEnvelope(), "the Sol preset", "Sol");
  });

  btnRealmspacePreset.addEventListener("click", async () => {
    await loadPreset(createRealmspacePresetEnvelope(), "the Realmspace preset", "Realmspace");
  });

  btnArrakisPreset.addEventListener("click", async () => {
    await loadPreset(createArrakisPresetEnvelope(), "the Arrakis (Dune) preset", "Arrakis");
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
        showImportPreview(v.world, {
          sourceLabel: "the validated XLSX import",
          backupSource: "auto-before-import",
        });
        return;
      }

      const text = await f.text();
      txtImport.value = text;
      const data = await parseImportText(text);
      if (!data) return;
      await validateImportData(data);
    } catch (e) {
      setStatus(statusImport, `Could not read file: ${e?.message || e}`, "bad");
      hideImportPreview();
    }
  });

  btnApplyImport.addEventListener("click", async () => {
    if (!pendingImport?.world) return;
    const confirmed = await confirmReplaceCurrentWorld(pendingImport.sourceLabel);
    if (!confirmed) {
      setStatus(statusImport, "Import cancelled.", "info");
      return;
    }
    applyPendingImport({ createBackupFirst: true });
  });

  btnImportAsBackup?.addEventListener("click", () => {
    void savePendingImportAsBackup();
  });

  btnApplyImportNoBackup?.addEventListener("click", async () => {
    if (!pendingImport?.world) return;
    const confirmed = await confirmDestructiveAction(
      buildReplaceCurrentWorldWithoutBackupPlan({ sourceLabel: pendingImport.sourceLabel }),
    );
    if (!confirmed) {
      setStatus(statusImport, "Import cancelled.", "info");
      return;
    }
    applyPendingImport({ createBackupFirst: false });
  });

  btnCancelImport.addEventListener("click", () => {
    hideImportPreview();
    setStatus(statusImport, "Import cancelled.", "info");
  });

  refreshAll();
  setStatus(statusImport, "");
  setStatus(statusBackups, "");
}
