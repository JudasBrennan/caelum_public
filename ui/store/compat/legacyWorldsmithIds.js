export const LEGACY_WORLDSMITH_STORAGE_KEYS = Object.freeze({
  theme: "worldsmith.theme",
  splashEnabled: "worldsmith.splash.enabled",
  firstRunChoice: "worldsmith.firstRun.choice",
  navDisplay: "worldsmith.nav.display",
  currentWorldV1: "worldsmith.world.v1",
  currentWorldLegacy: "worldsmith.world",
  backupsIndex: "worldsmith.world.backups",
  backupPrefix: "worldsmith.world.backup.",
  guidedCreationLaunch: "worldsmith.guidedCreation.launch",
  guidedCreationSessionPrefix: "worldsmith.guidedCreation.session.",
});

export const LEGACY_WORLDSMITH_SESSION_KEYS = Object.freeze({
  releaseSync: "worldsmith.release.sync",
});

export const LEGACY_WORLDSMITH_EVENTS = Object.freeze({
  worldChanged: "worldsmith:worldChanged",
  storageError: "worldsmith:storageError",
  worldLoadFailure: "worldsmith:worldLoadFailure",
  worldLoadRecovered: "worldsmith:worldLoadRecovered",
});

export const LEGACY_WORLDSMITH_MIME_TYPES = Object.freeze({
  systemDrag: "application/worldsmith-drag",
});

export const LEGACY_WORLDSMITH_DATABASES = Object.freeze({
  worldStorage: "worldsmith-world-storage",
  textureCache: "worldsmith-textures",
});

export const LEGACY_WORLDSMITH_RELEASE_META = Object.freeze({
  name: "worldsmith-release",
  selector: 'meta[name="worldsmith-release"]',
  reloadParam: "ws_release",
  probeParam: "ws_release_probe",
});

export const LEGACY_WORLDSMITH_TOOL_IDS = Object.freeze({
  webApp: "WorldSmith Web",
  legacyWorkbook: "WorldSmith 8.x",
});

export const LEGACY_WORLDSMITH_COMPATIBILITY_INVENTORY = Object.freeze([
  {
    category: "browser-storage",
    reason: "Keeps saved worlds, backups, sessions, and user preferences readable after rename.",
    values: LEGACY_WORLDSMITH_STORAGE_KEYS,
  },
  {
    category: "browser-events",
    reason: "Preserves event contracts shared across store, visualizer, and route modules.",
    values: LEGACY_WORLDSMITH_EVENTS,
  },
  {
    category: "drag-and-drop",
    reason: "Keeps existing system-layout drag payload handling stable.",
    values: LEGACY_WORLDSMITH_MIME_TYPES,
  },
  {
    category: "indexed-db",
    reason: "Keeps persistent world storage and texture caches available without migration.",
    values: LEGACY_WORLDSMITH_DATABASES,
  },
  {
    category: "release-sync",
    reason: "Keeps deployed release cache probing compatible with existing metadata.",
    values: LEGACY_WORLDSMITH_RELEASE_META,
  },
  {
    category: "legacy-import-export",
    reason: "Keeps old exports, backups, and WorldSmith 8.x spreadsheet imports recognized.",
    values: LEGACY_WORLDSMITH_TOOL_IDS,
  },
]);
