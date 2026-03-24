import { parseGuidedRoute } from "./ui/guidedCreation/routeState.js";
import * as store from "./ui/store.js";
import { createSolPresetEnvelope } from "./ui/solPreset.js";
import { createBlockingOverlayController } from "./ui/overlayController.js";
import { showSplashOverlay } from "./ui/splashOverlay.js";
import { escapeHtml } from "./ui/uiHelpers.js";

const appEl = document.getElementById("app");
const appAlertsEl = document.getElementById("appAlerts");
let startupSolPromptHandled = false;
let currentPageCleanup = null;
let activeRouteToken = 0;
let dismissedStorageErrorKey = "";
let dismissedLoadFailureOverlayKey = "";
let storageRecoveryOverlay = null;
let storageRecoveryOverlayController = null;

const THEME_KEY = "worldsmith.theme";
const SPLASH_ENABLED_KEY = "worldsmith.splash.enabled";
const NAV_DISPLAY_KEY = "worldsmith.nav.display";
const RELEASE_META_SELECTOR = 'meta[name="worldsmith-release"]';
const RELEASE_SYNC_SESSION_KEY = "worldsmith.release.sync";
const RELEASE_RELOAD_PARAM = "ws_release";
const RELEASE_PROBE_PARAM = "ws_release_probe";
const APP_RELEASE =
  document.querySelector(RELEASE_META_SELECTOR)?.getAttribute("content")?.trim() ||
  document.getElementById("versionTag")?.textContent?.trim() ||
  "";

function currentStorageError() {
  return typeof store.getLastStorageError === "function" ? store.getLastStorageError() : null;
}

function currentWorldLoadFailure() {
  return typeof store.getWorldLoadFailure === "function" ? store.getWorldLoadFailure() : null;
}

function issueKey(issue) {
  if (!issue) return "";
  return [
    issue.stage || "",
    issue.sourceKey || "",
    issue.message || "",
    issue.cause || "",
    issue.detectedAt || "",
  ].join("|");
}

function extractReleaseFromHtml(html) {
  const match = String(html || "").match(
    /<meta\s+name=["']worldsmith-release["']\s+content=["']([^"']+)["']/i,
  );
  return match?.[1]?.trim() || "";
}

function normalizeReleaseReloadUrl() {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(RELEASE_RELOAD_PARAM)) return;
  url.searchParams.delete(RELEASE_RELOAD_PARAM);
  window.history.replaceState(null, "", url.toString());
}

function clearReleaseSyncMarker(targetRelease = APP_RELEASE) {
  if (!targetRelease) return;
  try {
    const marker = sessionStorage.getItem(RELEASE_SYNC_SESSION_KEY) || "";
    if (marker === targetRelease || marker.endsWith(`->${targetRelease}`)) {
      sessionStorage.removeItem(RELEASE_SYNC_SESSION_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

async function maybeReloadToLiveRelease() {
  if (!APP_RELEASE || typeof fetch !== "function") return false;
  if (!/^https?:$/i.test(window.location.protocol)) return false;
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return false;

  let liveRelease = "";
  try {
    const probeUrl = new URL("./index.html", window.location.href);
    probeUrl.searchParams.set(RELEASE_PROBE_PARAM, String(Date.now()));
    const response = await fetch(probeUrl, { cache: "no-store" });
    if (!response.ok) return false;
    liveRelease = extractReleaseFromHtml(await response.text());
  } catch {
    return false;
  }

  if (!liveRelease || liveRelease === APP_RELEASE) {
    clearReleaseSyncMarker(liveRelease || APP_RELEASE);
    return false;
  }

  const syncMarker = `${APP_RELEASE}->${liveRelease}`;
  try {
    if (sessionStorage.getItem(RELEASE_SYNC_SESSION_KEY) === syncMarker) {
      console.warn(
        `[WorldSmith] Release mismatch persists after reload attempt (${APP_RELEASE} -> ${liveRelease}).`,
      );
      return false;
    }
    sessionStorage.setItem(RELEASE_SYNC_SESSION_KEY, syncMarker);
  } catch {
    // Ignore storage failures and still attempt the reload.
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set(RELEASE_RELOAD_PARAM, liveRelease);
  window.location.replace(nextUrl.toString());
  return true;
}

function downloadTextFile(filename, text, mimeType = "application/json") {
  const blob = new Blob([String(text ?? "")], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function closeStorageRecoveryOverlay({ restoreFocus = true } = {}) {
  storageRecoveryOverlayController?.deactivate({ restoreFocus });
  storageRecoveryOverlayController = null;
  if (!storageRecoveryOverlay) return;
  storageRecoveryOverlay.remove();
  storageRecoveryOverlay = null;
}

function openImportExportRoute() {
  closeStorageRecoveryOverlay({ restoreFocus: false });
  if (location.hash === "#/io") {
    void route();
    return;
  }
  location.hash = "#/io";
}

function renderStorageAlerts() {
  if (!appAlertsEl) return;
  appAlertsEl.replaceChildren();

  const loadFailure = currentWorldLoadFailure();
  if (loadFailure) {
    const backups = typeof store.listBackups === "function" ? store.listBackups().length : 0;
    const card = document.createElement("div");
    card.className = "app-alert app-alert--bad";
    card.id = "app-storage-load-alert";
    card.setAttribute("role", "alert");

    const content = document.createElement("div");
    content.className = "app-alert__content";

    const title = document.createElement("div");
    title.className = "app-alert__title";
    title.textContent = "Saved world could not be read";
    content.appendChild(title);

    const text = document.createElement("div");
    text.className = "app-alert__text";
    text.textContent =
      backups > 0
        ? `The current saved world is unreadable. ${backups} backup${backups === 1 ? "" : "s"} remain available in Import/Export.`
        : "The current saved world is unreadable. You can download the raw data, reset the broken save, or import a replacement world.";
    content.appendChild(text);

    if (loadFailure.cause) {
      const detail = document.createElement("div");
      detail.className = "app-alert__detail";
      detail.textContent = `Details: ${loadFailure.cause}`;
      content.appendChild(detail);
    }

    const actions = document.createElement("div");
    actions.className = "app-alert__actions";

    const openIoBtn = document.createElement("button");
    openIoBtn.id = "app-storage-open-io";
    openIoBtn.type = "button";
    openIoBtn.textContent = "Import/Export";
    openIoBtn.addEventListener("click", openImportExportRoute);
    actions.appendChild(openIoBtn);

    const downloadBtn = document.createElement("button");
    downloadBtn.id = "app-storage-download-raw";
    downloadBtn.type = "button";
    downloadBtn.textContent = "Download raw save";
    downloadBtn.addEventListener("click", () => {
      const failure = currentWorldLoadFailure();
      if (!failure?.raw) return;
      downloadTextFile("worldsmith-unreadable-save.json", failure.raw);
    });
    actions.appendChild(downloadBtn);

    const resetBtn = document.createElement("button");
    resetBtn.id = "app-storage-reset-world";
    resetBtn.type = "button";
    resetBtn.className = "danger";
    resetBtn.textContent = "Reset unreadable save";
    resetBtn.addEventListener("click", async () => {
      if (typeof store.clearUnreadableSavedWorld !== "function") return;
      const result = await store.clearUnreadableSavedWorld();
      if (!result?.ok) {
        dismissedStorageErrorKey = "";
      }
      renderStorageAlerts();
      if (result?.ok) openImportExportRoute();
    });
    actions.appendChild(resetBtn);

    card.append(content, actions);
    appAlertsEl.appendChild(card);
    return;
  }

  const storageError = currentStorageError();
  const errorKey = issueKey(storageError);
  if (!storageError || (errorKey && errorKey === dismissedStorageErrorKey)) {
    return;
  }

  const card = document.createElement("div");
  card.className = "app-alert app-alert--warn";
  card.id = "app-storage-warning-alert";
  card.setAttribute("role", "alert");

  const content = document.createElement("div");
  content.className = "app-alert__content";

  const title = document.createElement("div");
  title.className = "app-alert__title";
  title.textContent = "Storage warning";
  content.appendChild(title);

  const text = document.createElement("div");
  text.className = "app-alert__text";
  text.textContent = storageError.message || "WorldSmith hit a browser-storage problem.";
  content.appendChild(text);

  if (storageError.cause) {
    const detail = document.createElement("div");
    detail.className = "app-alert__detail";
    detail.textContent = `Details: ${storageError.cause}`;
    content.appendChild(detail);
  }

  const actions = document.createElement("div");
  actions.className = "app-alert__actions";

  const openIoBtn = document.createElement("button");
  openIoBtn.id = "app-storage-warning-open-io";
  openIoBtn.type = "button";
  openIoBtn.textContent = "Import/Export";
  openIoBtn.addEventListener("click", openImportExportRoute);
  actions.appendChild(openIoBtn);

  const dismissBtn = document.createElement("button");
  dismissBtn.id = "app-storage-warning-dismiss";
  dismissBtn.type = "button";
  dismissBtn.className = "small";
  dismissBtn.textContent = "Dismiss";
  dismissBtn.addEventListener("click", () => {
    dismissedStorageErrorKey = errorKey;
    if (typeof store.clearLastStorageError === "function") {
      store.clearLastStorageError();
    }
    renderStorageAlerts();
  });
  actions.appendChild(dismissBtn);

  card.append(content, actions);
  appAlertsEl.appendChild(card);
}

function getAppBlockingBackgroundElements() {
  return [document.querySelector(".app-header"), document.querySelector(".app-main")].filter(
    Boolean,
  );
}

function getNavBlockingBackgroundElements() {
  return [
    document.querySelector(".app-header"),
    document.getElementById("appAlerts"),
    document.getElementById("app"),
    document.querySelector(".app-footer"),
  ].filter(Boolean);
}

function showStorageRecoveryOverlay(force = false) {
  const failure = currentWorldLoadFailure();
  if (!failure) {
    closeStorageRecoveryOverlay();
    return;
  }

  const failureKey = issueKey(failure);
  if (!force && failureKey && failureKey === dismissedLoadFailureOverlayKey) {
    return;
  }
  if (storageRecoveryOverlay?.dataset.failureKey === failureKey) {
    return;
  }

  closeStorageRecoveryOverlay();

  const overlay = document.createElement("div");
  overlay.className = "storage-recovery-overlay";
  overlay.id = "storage-load-failure-overlay";
  overlay.dataset.failureKey = failureKey;

  const dialog = document.createElement("div");
  dialog.className = "storage-recovery-dialog panel";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "storageRecoveryTitle");

  const header = document.createElement("div");
  header.className = "panel__header";

  const title = document.createElement("h2");
  title.id = "storageRecoveryTitle";
  title.className = "panel__title";
  title.textContent = "Saved world recovery";
  header.appendChild(title);

  const badge = document.createElement("div");
  badge.className = "badge bad";
  badge.textContent = failure.stage === "parse" ? "Parse failure" : "Migration failure";
  header.appendChild(badge);

  const body = document.createElement("div");
  body.className = "panel__body";

  const lead = document.createElement("p");
  lead.textContent =
    "WorldSmith found saved world data in this browser, but it could not be read safely.";
  body.appendChild(lead);

  const backups = typeof store.listBackups === "function" ? store.listBackups().length : 0;
  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent =
    backups > 0
      ? `${backups} backup${backups === 1 ? "" : "s"} remain available. You can reset the unreadable current save and restore a backup from Import/Export.`
      : "No automatic backups were found. Download the raw data before resetting if you may need to inspect it later.";
  body.appendChild(hint);

  if (failure.cause) {
    const detail = document.createElement("div");
    detail.className = "derived-readout storage-recovery-detail";
    detail.textContent = `Details: ${failure.cause}`;
    body.appendChild(detail);
  }

  const actions = document.createElement("div");
  actions.className = "button-row storage-recovery-actions";

  const openIoBtn = document.createElement("button");
  openIoBtn.id = "storage-recovery-open-io";
  openIoBtn.type = "button";
  openIoBtn.textContent = "Open Import/Export";
  openIoBtn.addEventListener("click", openImportExportRoute);
  actions.appendChild(openIoBtn);

  const downloadBtn = document.createElement("button");
  downloadBtn.id = "storage-recovery-download";
  downloadBtn.type = "button";
  downloadBtn.textContent = "Download raw save";
  downloadBtn.addEventListener("click", () => {
    const currentFailure = currentWorldLoadFailure();
    if (!currentFailure?.raw) return;
    downloadTextFile("worldsmith-unreadable-save.json", currentFailure.raw);
  });
  actions.appendChild(downloadBtn);

  const resetBtn = document.createElement("button");
  resetBtn.id = "storage-recovery-reset";
  resetBtn.type = "button";
  resetBtn.className = "danger";
  resetBtn.textContent = "Reset unreadable save";
  resetBtn.addEventListener("click", async () => {
    if (typeof store.clearUnreadableSavedWorld !== "function") return;
    const result = await store.clearUnreadableSavedWorld();
    if (!result?.ok) {
      dismissedStorageErrorKey = "";
      renderStorageAlerts();
      return;
    }
    openImportExportRoute();
  });
  actions.appendChild(resetBtn);

  const dismissBtn = document.createElement("button");
  dismissBtn.id = "storage-recovery-dismiss";
  dismissBtn.type = "button";
  dismissBtn.className = "small";
  dismissBtn.textContent = "Dismiss";
  dismissBtn.addEventListener("click", () => {
    dismissedLoadFailureOverlayKey = failureKey;
    closeStorageRecoveryOverlay();
  });
  actions.appendChild(dismissBtn);

  body.appendChild(actions);
  dialog.append(header, body);
  overlay.appendChild(dialog);
  storageRecoveryOverlay = overlay;
  document.body.appendChild(overlay);
  storageRecoveryOverlayController = createBlockingOverlayController({
    overlayEl: overlay,
    focusRoot: dialog,
    initialFocus: () => dismissBtn,
    backgroundElements: getAppBlockingBackgroundElements(),
    dismissTarget: overlay,
    onDismiss: () => {
      dismissedLoadFailureOverlayKey = failureKey;
      closeStorageRecoveryOverlay();
    },
  });
  storageRecoveryOverlayController.activate();
}

function syncStorageUi() {
  renderStorageAlerts();
  showStorageRecoveryOverlay(false);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    applyTheme("light");
  }

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "light" ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (event) => {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(event.matches ? "light" : "dark");
    }
  });
}

initTheme();

function isSplashEnabled() {
  try {
    const saved = localStorage.getItem(SPLASH_ENABLED_KEY);
    if (saved === "0") return false;
    if (saved === "1") return true;
  } catch {
    // Ignore storage errors and keep default behavior.
  }
  return true;
}

function setSplashEnabled(enabled) {
  try {
    localStorage.setItem(SPLASH_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // Ignore storage errors.
  }
}

function initSplashToggle() {
  const input = document.getElementById("splashToggle");
  const enabled = isSplashEnabled();
  if (!input) return enabled;
  input.checked = enabled;
  input.addEventListener("change", () => {
    setSplashEnabled(!!input.checked);
  });
  return enabled;
}

const splashEnabled = initSplashToggle();

function hasSavedWorldData() {
  if (typeof store.hasAnySavedData === "function") {
    return store.hasAnySavedData();
  }
  if (typeof store.hasSavedWorldInLocalStorage === "function") {
    return store.hasSavedWorldInLocalStorage();
  }
  try {
    return !!(
      localStorage.getItem("worldsmith.world.v1") || localStorage.getItem("worldsmith.world")
    );
  } catch {
    return false;
  }
}

function importWorldData(world) {
  if (typeof store.importWorld === "function") {
    store.importWorld(world);
    return true;
  }
  return false;
}

function lazyPage(load, label) {
  return {
    label,
    lazy: true,
    load,
  };
}

function modulePage(loadModule, exportName, label, mapInit = null) {
  return lazyPage(async () => {
    const mod = await loadModule();
    const init = mod?.[exportName];
    if (typeof init !== "function") {
      throw new Error(`Missing page initializer "${exportName}" for ${label}.`);
    }
    return typeof mapInit === "function" ? mapInit(init, mod) : init;
  }, label);
}

const PAGE_MAP = {
  star: modulePage(() => import("./ui/starPage.js"), "initStarPage", "Star"),
  system: modulePage(() => import("./ui/systemPage.js"), "initSystemPage", "Planetary System"),
  outer: modulePage(
    () => import("./ui/outerObjectsPage.js"),
    "initOuterObjectsPage",
    "Other Objects",
  ),
  planet: modulePage(() => import("./ui/planetPage.js"), "initPlanetPage", "Planets"),
  moon: modulePage(() => import("./ui/moonPage.js"), "initMoonPage", "Moons"),
  viz: modulePage(
    () => import("./ui/visualizerPage.js"),
    "initVisualiserPage",
    "System Visualiser",
  ),
  cluster: modulePage(
    () => import("./ui/localClusterPage.js"),
    "initLocalClusterPage",
    "Local Cluster",
  ),
  galaxy: modulePage(
    () => import("./ui/localClusterPage.js"),
    "initLocalClusterPage",
    "Local Cluster",
  ),
  "cluster-viz": modulePage(
    () => import("./ui/visualizerPage.js"),
    "initVisualiserPage",
    "Cluster Visualiser",
    (init) => (el) => init(el, { startMode: "cluster" }),
  ),
  io: modulePage(() => import("./ui/importExportPage.js"), "initImportExportPage", "Import/Export"),
  apparent: modulePage(
    () => import("./ui/apparentPage.js"),
    "initApparentPage",
    "Apparent Size and Brightness",
  ),
  calendar: modulePage(() => import("./ui/calendarPage.js"), "initCalendarPage", "Calendar"),
  about: modulePage(() => import("./ui/aboutPage.js"), "initAboutPage", "About WorldSmith"),
  science: modulePage(() => import("./ui/sciencePage.js"), "initSciencePage", "Science and Maths"),
  tectonics: modulePage(() => import("./ui/tectonicsPage.js"), "initTectonicsPage", "Tectonics"),
  climate: modulePage(() => import("./ui/climatePage.js"), "initClimatePage", "Climate Zones"),
  population: modulePage(
    () => import("./ui/populationPage.js"),
    "initPopulationPage",
    "Population",
  ),
  lessons: modulePage(() => import("./ui/lessonsPage.js"), "initLessonsPage", "Lessons"),
  "science-viz": modulePage(
    () => import("./ui/scienceVisualiserPage.js"),
    "initScienceVisualiserPage",
    "Science Visualiser",
  ),
};

function cleanupCurrentPage() {
  if (typeof currentPageCleanup !== "function") {
    currentPageCleanup = null;
    return;
  }
  try {
    currentPageCleanup();
  } catch (err) {
    console.error("[WorldSmith] Page cleanup failed:", err);
  } finally {
    currentPageCleanup = null;
  }
}

function renderRouteLoading(label) {
  const safeLabel = escapeHtml(label || "page");
  appEl.innerHTML = `
    <div class="panel">
      <div class="panel__header"><h1 class="panel__title">Loading</h1></div>
      <div class="panel__body">
        <p>Loading <b>${safeLabel}</b>...</p>
      </div>
    </div>
  `;
}

function armRouteLoading(label, routeToken) {
  const timerId = window.setTimeout(() => {
    if (routeToken !== activeRouteToken) return;
    renderRouteLoading(label);
  }, 120);
  return () => window.clearTimeout(timerId);
}

async function route() {
  const hash = location.hash || "#/star";
  const routeState = parseGuidedRoute(hash);
  const requestedKey = routeState.pageKey;
  if (requestedKey === "tectonics-simulator") {
    location.hash = "#/tectonics";
    return;
  }
  const key = requestedKey;
  const routeToken = ++activeRouteToken;

  const navKey = key === "cluster-viz" ? "viz" : key;
  document.querySelectorAll(".side-nav__item").forEach((link) => {
    if (!link.getAttribute("href")) return;
    const isActive = link.getAttribute("href") === `#/${navKey}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  cleanupCurrentPage();
  appEl.innerHTML = "";

  const pageSpec = PAGE_MAP[key];
  if (pageSpec) {
    const stopLoadingIndicator = pageSpec.lazy
      ? armRouteLoading(pageSpec.label || key, routeToken)
      : null;

    try {
      const initFn = await pageSpec.load();
      stopLoadingIndicator?.();
      if (routeToken !== activeRouteToken) return;
      appEl.innerHTML = "";
      const maybeCleanup = initFn(appEl, { routeContext: routeState });
      currentPageCleanup = typeof maybeCleanup === "function" ? maybeCleanup : null;
    } catch (err) {
      stopLoadingIndicator?.();
      if (routeToken !== activeRouteToken) return;
      console.error(`[WorldSmith] Failed to load page "${key}":`, err);
      currentPageCleanup = null;
      appEl.innerHTML = `
        <div class="panel">
          <div class="panel__header"><h1 class="panel__title">Page Error</h1></div>
          <div class="panel__body">
            <p>Something went wrong loading the <b>${key}</b> page.</p>
            <pre style="white-space:pre-wrap;color:var(--bad)">${escapeHtml(String(err))}</pre>
            <p class="hint">Try refreshing, or choose another page from the navigation menu.</p>
          </div>
        </div>
      `;
    }
    return;
  }

  const safeKey = escapeHtml(key);
  currentPageCleanup = null;
  appEl.innerHTML = `
    <div class="panel">
      <div class="panel__header"><h1>Coming soon</h1></div>
      <div class="panel__body">
        <div class="page-title">#/ ${safeKey}</div>
        <p class="muted">This section is not available in the current release.</p>
        <p>Please choose a tab from the navigation menu.</p>
      </div>
    </div>
  `;
}

function showStartupSolPresetPrompt() {
  const overlay = document.createElement("div");
  overlay.className = "startup-sol-overlay";
  overlay.innerHTML = `
    <div class="startup-sol-dialog panel" role="dialog" aria-modal="true" aria-labelledby="startupSolTitle">
      <div class="panel__header">
        <h2 id="startupSolTitle" class="panel__title">
          <span class="ws-icon icon--import-export" aria-hidden="true"></span>
          <span>Import Sol Preset?</span>
        </h2>
        <div class="badge">Quick start</div>
      </div>
      <div class="panel__body">
        <p>No saved world data was found in this browser.</p>
        <p class="hint">Would you like to import the built-in Sol preset now?</p>
        <div class="button-row startup-sol-actions">
          <button type="button" id="startup-sol-yes" class="primary">Yes</button>
          <button type="button" id="startup-sol-no">No</button>
        </div>
      </div>
    </div>
  `;

  const dialog = overlay.querySelector(".startup-sol-dialog");
  const btnYes = overlay.querySelector("#startup-sol-yes");
  const btnNo = overlay.querySelector("#startup-sol-no");
  const overlayController = createBlockingOverlayController({
    overlayEl: overlay,
    focusRoot: dialog,
    initialFocus: () => btnNo,
    backgroundElements: getAppBlockingBackgroundElements(),
    dismissTarget: overlay,
    onDismiss: () => close(),
  });

  function close({ restoreFocus = true } = {}) {
    overlayController.deactivate({ restoreFocus });
    overlay.remove();
  }

  btnNo?.addEventListener("click", () => close());
  btnYes?.addEventListener("click", () => {
    const envelope = createSolPresetEnvelope();
    importWorldData(envelope.world);
    close({ restoreFocus: false });
    void route();
  });
  document.body.appendChild(overlay);
  overlayController.activate();
}

function maybeShowStartupSolPresetPrompt() {
  if (startupSolPromptHandled) return;
  startupSolPromptHandled = true;
  if (typeof store.hasWorldLoadFailure === "function" && store.hasWorldLoadFailure()) return;
  if (hasSavedWorldData()) return;
  showStartupSolPresetPrompt();
}

window.addEventListener("worldsmith:storageError", () => {
  dismissedStorageErrorKey = "";
  renderStorageAlerts();
});

window.addEventListener("worldsmith:worldLoadFailure", () => {
  renderStorageAlerts();
  showStorageRecoveryOverlay(true);
});

window.addEventListener("worldsmith:worldLoadRecovered", () => {
  closeStorageRecoveryOverlay();
  renderStorageAlerts();
});

window.addEventListener("hashchange", () => {
  void route();
});

function initNav() {
  const sideNav = document.querySelector(".side-nav");
  const hamburger = document.getElementById("navHamburger");
  const backdrop = document.getElementById("navBackdrop");
  const navViewToggle = document.getElementById("navViewToggle");
  let mobileNavController = null;

  function isMobileViewport() {
    return window.matchMedia("(max-width: 980px)").matches;
  }

  function readNavDisplayPreference() {
    try {
      const value = localStorage.getItem(NAV_DISPLAY_KEY);
      return value === "collapsed" ? "collapsed" : value === "expanded" ? "expanded" : "";
    } catch {
      return "";
    }
  }

  function writeNavDisplayPreference(display) {
    try {
      if (display === "collapsed" || display === "expanded") {
        localStorage.setItem(NAV_DISPLAY_KEY, display);
      } else {
        localStorage.removeItem(NAV_DISPLAY_KEY);
      }
    } catch {
      // Ignore storage errors.
    }
  }

  function syncNavViewToggle() {
    if (!navViewToggle || !sideNav) return;
    const collapsed = sideNav.classList.contains("is-collapsed");
    const hidden = isMobileViewport() || collapsed;
    navViewToggle.hidden = hidden;
    navViewToggle.textContent = collapsed ? "\u00bb" : "\u00ab";
    const actionLabel = collapsed ? "Expand navigation" : "Collapse navigation";
    navViewToggle.setAttribute("aria-label", actionLabel);
    navViewToggle.title = actionLabel;
  }

  function syncMobileNavState() {
    if (!hamburger || !sideNav || !backdrop) return;
    const isOpen = sideNav.classList.contains("is-open");
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    backdrop.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  function expandDesktopNav({ persist = true } = {}) {
    if (!sideNav || isMobileViewport()) return;
    sideNav.classList.remove("is-collapsed");
    if (persist) {
      writeNavDisplayPreference("expanded");
    }
    syncNavViewToggle();
  }

  function collapseDesktopNav({ persist = true } = {}) {
    if (!sideNav || isMobileViewport()) return;
    sideNav.classList.add("is-collapsed");
    if (persist) {
      writeNavDisplayPreference("collapsed");
    }
    syncNavViewToggle();
  }

  function applyStoredDesktopNavState() {
    if (!sideNav || isMobileViewport()) return;
    const displayPreference = readNavDisplayPreference();
    sideNav.classList.remove("is-locked");
    sideNav.classList.toggle("is-collapsed", displayPreference === "collapsed");
    syncNavViewToggle();
  }

  if (sideNav) {
    applyStoredDesktopNavState();
  }
  syncNavViewToggle();
  syncMobileNavState();

  sideNav?.addEventListener("click", (event) => {
    if (isMobileViewport()) return;
    if (!sideNav.classList.contains("is-collapsed")) return;
    if (event.target.closest(".side-nav__item")) return;
    expandDesktopNav();
  });

  function ensureMobileNavController() {
    if (mobileNavController || !sideNav || !backdrop) return;
    mobileNavController = createBlockingOverlayController({
      overlayEl: sideNav,
      focusRoot: sideNav,
      initialFocus: () => sideNav.querySelector(".side-nav__item"),
      backgroundElements: getNavBlockingBackgroundElements(),
      dismissTarget: backdrop,
      onDismiss: () => closeMobileNav(),
    });
  }

  function closeMobileNav({ restoreFocus = true } = {}) {
    mobileNavController?.deactivate({ restoreFocus });
    sideNav?.classList.remove("is-open");
    backdrop?.classList.remove("is-visible");
    syncMobileNavState();
  }

  function openMobileNav() {
    if (!isMobileViewport()) return;
    ensureMobileNavController();
    sideNav?.classList.add("is-open");
    backdrop?.classList.add("is-visible");
    syncMobileNavState();
    mobileNavController?.activate();
  }

  hamburger?.addEventListener("click", () => {
    if (sideNav?.classList.contains("is-open")) {
      closeMobileNav();
      return;
    }
    openMobileNav();
  });

  navViewToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!sideNav) return;
    if (sideNav.classList.contains("is-collapsed")) {
      expandDesktopNav();
    } else {
      collapseDesktopNav();
    }
  });

  sideNav?.addEventListener("click", (event) => {
    if (!isMobileViewport()) return;
    if (!event.target.closest(".side-nav__item")) return;
    closeMobileNav({ restoreFocus: false });
  });

  window.addEventListener("hashchange", () => closeMobileNav({ restoreFocus: false }));
  window.addEventListener("resize", () => {
    if (!isMobileViewport()) {
      closeMobileNav({ restoreFocus: false });
      applyStoredDesktopNavState();
    }
    syncNavViewToggle();
    syncMobileNavState();
  });
}

async function startApp() {
  initNav();
  if (typeof store.waitForStorageReady === "function") {
    try {
      await store.waitForStorageReady();
    } catch (err) {
      console.error("[WorldSmith] Storage bootstrap failed:", err);
    }
  }
  syncStorageUi();
  await route();
  syncStorageUi();
  maybeShowStartupSolPresetPrompt();
}

async function bootstrapApp() {
  const reloadingToLiveRelease = await maybeReloadToLiveRelease();
  if (reloadingToLiveRelease) return;

  normalizeReleaseReloadUrl();

  if (splashEnabled) {
    showSplashOverlay()
      .then(() => startApp())
      .catch((err) => {
        console.error("[WorldSmith] Splash overlay failed:", err);
        void startApp();
      });
    return;
  }

  void startApp();
}

void bootstrapApp();
