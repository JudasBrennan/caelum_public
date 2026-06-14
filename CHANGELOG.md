# Changelog

All notable changes to WorldSmith Web will be documented in this file.

## Unreleased

### Splash Screen Resilience

**Prevented the 3D splash preview from trapping users on browser-specific loader failures**
(ui/splashOverlay.js, tests/splashOverlay.ui.test.js)

The splash screen now reveals the Enter button after a short delay and falls
back to "3D preview unavailable" if the decorative planet preview hangs. This
keeps WorldSmith usable in browsers where the GLTF/Draco preview path or an
injected script fails without affecting the main app startup path.

## 2.7.0 - 2026-06-14

### Import/Export Storage UX

**Separated current-world, backup-library, import, starter-world, and danger-zone workflows**
(app.js, ui/importExportPage.js, ui/store.js, ui/store/destructiveActions.js,
ui/store/persistenceBridge.js, ui/worldStorage.js,
ui/worldStorage/indexedDb.js, ui/worldStorage/legacyStorage.js, styles.css,
README.md, tests/importExportPage.ui.test.js, tests/worldStorage.test.js,
tests/browser/smoke.spec.js)

The Import/Export page now shows a storage overview and separates routine
current-world export/backup work from backup-library management, import
validation, starter worlds, and destructive cleanup actions. Users can create
manual backups, preview/export/restore/delete individual backups, save a
validated import as a backup without applying it, start fresh while preserving
backups, delete only backups, or clear all saved data from the danger zone.

Backup restore now asks for confirmation and creates a pre-restore backup of
the current saved world by default. Recovery copy for unreadable current saves
now points users to the Import/Export Backup Library so the distinction between
the broken current save and preserved backups is clearer.

Backup preview failures now explain the specific reason, such as a missing raw
payload, malformed JSON, an unsupported world shape, or a preview-summary
generation error, instead of only saying the backup could not be previewed.
Starter worlds now pass through the same current import/normalization path as
user-created worlds before they are saved, backed up, or previewed, so Sol,
Realmspace, and Arrakis backups no longer depend on preset-only legacy aliases.

### Ocean World High-Pressure Ice

**Made ocean-world high-pressure ice warnings phase-diagram-aware,
pressure-first, and gravity-aware**
(engine/habitability/highPressureIce.js,
engine/habitability/hydrosphere.js,
engine/habitability/oceanPhaseDisplay.js,
engine/habitability/oceanThermalProfile.js,
engine/habitability/waterPhaseDiagram.js,
engine/planetarySubtypes/oceanWorld.js, engine/moon/hydrosphere.js,
engine/moon.js, ui/planetPage.js, ui/moonPage.js,
tests/highPressureIce.test.js, tests/hydrosphere.test.js,
tests/oceanThermalProfile.test.js, tests/planet.test.js,
tests/planetarySubtypes.test.js, tests/moon.test.js,
tests/moonHydrosphere.test.js, tests/waterPhaseDiagram.test.js)

Ocean and water-world subtype warnings now compare local seafloor pressure and
estimated bottom-ocean temperature against IAPWS pure-water liquidus boundaries
instead of using a fixed 60 km depth trigger, raw water-mass shortcut, or
pressure band alone. The model still reports local threshold depths for
pressure-only fallback cases, so lower-gravity bodies need deeper oceans before
the same fallback warning band appears.

The screenshot-like case of a roughly 0.52 GPa seafloor pressure now remains a
caution rather than "high-pressure ice likely", and the UI shows the pressure,
bottom-temperature range, liquidus boundary, and interpretation used for that
decision. Hot deep oceans no longer become "Ice VII likely" solely because they
exceed 2.2 GPa; Ice VII wording is reserved for phase-diagram-supported cases.

Planet and moon hydrosphere outputs now expose bottom-ocean temperature,
liquidus pressure, seafloor phase, dense-ice barrier interpretation, and
phase-diagram confidence alongside the legacy high-pressure ice fields.

The Science and Maths page now includes a WorldSmith-tailored ocean-floor water
phase diagram that shows the implemented liquid/dense-ice boundary, example
model points, and the caveats around bottom-temperature uncertainty.

### Planet Ocean Depth Display

**Showed mean ocean depth for ordinary surface-ocean planets**
(engine/planet.js, ui/planetPage.js, tests/planet.test.js)

The Planet page now surfaces mean ocean depth for rocky planets with substantial
accessible surface liquid, not only for exotic ocean/water-world subtype cards.
The Water Regime card includes the estimate in its summary line, and the
Environment section adds a dedicated Mean Ocean Depth card with surface liquid
coverage and seafloor pressure context where available.

## 2.6.0 Beta - 2026-06-13

### Planetary Visual Editor

**Added canonical custom planetary appearance editing with draft-safe previews,
visual presets, sparse overrides, and Visualizer integration**
(ui/planetaryVisual/\*, ui/planet/bodyAppearance.js, ui/planetPage.js,
ui/visualizer/visualEditorEntry.js, ui/visualizer/focusSummary.js,
ui/visualizer/focusSummaryPanel.js, ui/visualizer/snapshotModel.js,
ui/visualizer/bodyMeshService.js, ui/visualizerPage.js,
ui/celestialComposer.js, ui/apparentPage.js, ui/apparentSkyNativeThree.js,
ui/systemPosterNativeThree.js, ui/store/planetaryBodyModel.js,
ui/store/importValidation.js, ui/store/compat/planetaryBodyCompatibility.js,
engine/worldAdapters.js, styles.css, tests/planetaryVisual\*.test.js,
tests/visualizerVisualEditorEntry.test.js,
tests/visualizerSnapshotModel.test.js,
tests/visualizerBodyMeshService.test.js, tests/browser/smoke.spec.js)

Planetary bodies now support visual-only appearance customization through
canonical `appearance.visualMode` and sparse `appearance.visualOverrides`
fields. Auto remains the default, while custom and mixed modes layer user
choices on top of the generated science-derived appearance without mutating the
underlying physical model.

The Planet page and Visualizer focus panel can open a draft-safe visual editor
with a sticky live preview, Auto/Draft comparison, compatible presets,
section-level reset/randomize actions, per-field locks, and a custom generation
seed. Supported controls cover rocky/volatile surface palettes, land/ocean/ice
coverage, atmosphere and cloud styling, giant/brown-dwarf bands and storms,
ring appearance, and material glow/emissive treatments where applicable.

The editor color controls were tightened after usability review: native color
picker changes now stage locally until the user chooses Apply, swatches remain
quick-select actions, hex fields stay editable, the planet preview remains
static while controls scroll, and color rows now keep their lock checkboxes
visible and aligned in the compact action group.

Custom visual data now survives save, import, export, browser storage
migration, snapshots, Visualizer rendering, apparent-size rendering, and system
poster rendering through the same canonical planetary body model. Invalid or
oversized visual override payloads are stripped or rejected during import
validation.

**Tests and checks** (tests/planetaryVisualControlManifest.test.js,
tests/planetaryVisualEditor.ui.test.js,
tests/planetaryVisualEditorControls.ui.test.js,
tests/planetaryVisualEditorState.test.js,
tests/planetaryVisualOverrides.test.js,
tests/planetaryVisualPhase0.test.js,
tests/planetaryVisualPresets.test.js,
tests/visualizerVisualEditorEntry.test.js,
tests/visualizerSnapshotModel.test.js,
tests/visualizerBodyMeshService.test.js, tests/importExport.test.js,
tests/importSafety.test.js, tests/worldStorage.test.js,
tests/browser/smoke.spec.js)

- Added auto-visual stability fixtures, override resolver coverage, editor
  draft/save/cancel tests, preset/randomize/lock regressions, import/export
  persistence coverage, and Visualizer entry/rendering coverage.
- Added browser smoke coverage for opening the visual editor from the
  Visualizer focus panel, preventing control overflow, keeping color rows
  compact, and ensuring color action locks remain visible and aligned.

### Exotic Planetary Subtypes

**Added conservative subtype classification, authoring evidence, downstream page
guidance, and visual integration for unusual planet-class bodies**
(engine/planetarySubtypes.js, engine/planetarySubtypes/\*,
engine/worldSnapshot.js, engine/worldAdapters.js, ui/planet/inputRender.js,
ui/planet/domRender.js, ui/planet/subtypeVisualHints.js, ui/climatePage.js,
ui/populationPage.js, ui/tectonicsPage.js, ui/visualizer/snapshotModel.js,
ui/visualizer/focusSummary.js, ui/systemPosterNativeThree.js,
tests/planetarySubtypes.test.js, tests/planetarySubtypePhase0.test.js,
tests/importExport.test.js, tests/inputDraftStability.ui.test.js,
tests/worldSnapshot.test.js, tests/worldAdapters.test.js,
tests/visualizerSnapshotModel.test.js)

Planet-class bodies now resolve optional exotic subtypes on top of their broad
family classification. Rocky and volatile worlds can surface carbon-rich,
ocean/water, lava, icy dwarf, chthonian, rogue, sub-Neptune, mini-Neptune,
hycean, super-puff, and radius-valley evidence, while giant planets can surface
hot/warm/cold, inflated, and rogue-context signals without replacing the
existing gas-giant model.

The Planet page now exposes optional evidence fields for composition density,
carbon-richness, internal/tidal heat flux, stripped-envelope history, migration
history, and rogue-candidate context. Fresh saves and exports persist these
fields through the canonical `world.planetaryBodies` model, while old worlds
that omit them continue to import and migrate unchanged.

Subtype metadata now feeds import/export previews, world snapshots, the
Visualizer focus summary, System poster rendering, and page applicability
guidance. Unsupported or limited surfaces such as Population, Climate, and
Tectonics now keep their broad science outputs conservative when a subtype makes
the page's assumptions unsafe.

**Tests** (tests/planetarySubtypes.test.js,
tests/planetarySubtypePhase0.test.js, tests/importExport.test.js,
tests/inputDraftStability.ui.test.js, tests/worldSnapshot.test.js,
tests/worldAdapters.test.js, tests/visualizerSnapshotModel.test.js)

- Added subtype anchor fixtures and overlay regressions for carbon-rich,
  ocean/water, lava, icy dwarf, chthonian, rogue, volatile, and giant subtype
  evidence.
- Added canonical save/export/import coverage for the optional evidence fields.
- Added UI regressions for Planet authoring controls, page guidance, import
  preview summaries, Visualizer subtype focus text, and System poster subtype
  visual routing.

### Unified Planetary Body Storage

**Stopped persisting legacy rocky/gas-giant split projections during normal
saves and exports**
(ui/store.js, ui/store/importValidation.js,
ui/store/planetaryBodyModel.js, tests/importExport.test.js,
tests/worldStorage.test.js)

Fresh world saves and exports now serialize planet-class bodies through the
canonical `world.planetaryBodies` collection. Old split collections are still
accepted by import and migration, and the app restores runtime compatibility
projections after load for modules that have not yet been retired from the
legacy shape.

### Legacy Compatibility Boundaries

**Documented and guarded the legacy compatibility ownership model while keeping
old-world support intact**
(package.json, README.md, scripts/check-compat-boundaries.mjs,
scripts/check-compat-decommissioning.mjs,
ui/store/worldMigration.js, ui/store/planetaryBodyModel.js,
ui/store/compat/planetaryBodyCompatibility.js,
ui/store/compat/worldShapeCompatibility.js,
ui/store/compat/worldShapeMigrationHelpers.js,
engine/planetaryBodyAdapters.js, engine/usableCalendar.js,
engine/worldAdapters.js, engine/planetaryRings.js, engine/debrisDisk.js,
filed-plans/LEGACY_COMPATIBILITY_BOUNDARIES_PLAN.md,
filed-plans/LEGACY_COMPATIBILITY_INVENTORY.md,
tests/legacyCompatibilityBoundaries.test.js, tests/worldMigration.test.js,
tests/worldStorage.test.js, tests/importExport.test.js,
tests/storeSystemFacade.test.js, tests/browser/smoke.spec.js)

Legacy save, backup, spreadsheet import, split-collection, singleton
planet/moon, calendar, debris preview, and ring fallback support remains in
place, but the ownership boundaries are now explicit. Storage-key compatibility
stays under `ui/worldStorage/`, workbook import compatibility stays in
`ui/legacyXlsxImport.js`, persisted shape migration routes through
`ui/store/worldMigration.js` and `ui/store/compat/`, and engine legacy-source
normalization happens before calculators through narrow adapters.

The new `npm run check:compat-boundaries` guardrail scans source files for
legacy compatibility leakage and is wired into `npm run check`. Existing
transitional route callers are budgeted so future changes can shrink them over
time without quietly adding new historical-shape handling.

The new `npm run check:compat-decommissioning` guardrail keeps the current
long-term support decision explicit: no legacy path is being removed yet.
Retained anchors cover old browser storage keys, singleton planet/moon
projections, split rocky/gas-giant projections, `outermostGasGiantAu`
migration, legacy workbook import, and current canonical round-trip tests.

**Tests and checks** (`npm run check:compat-boundaries`,
`npm run check:compat-decommissioning`,
tests/legacyCompatibilityBoundaries.test.js, tests/worldMigration.test.js,
tests/worldStorage.test.js, tests/importExport.test.js,
tests/storeSystemFacade.test.js, tests/browser/smoke.spec.js, snapshot,
adapter, calendar, debris, and ring regressions)

- Added focused guard coverage for legacy browser keys, old singleton worlds,
  split rocky/gas collections, canonical planetary body projections, moon
  parent aliases, and snapshot adapter selector keys.
- Kept old saves, old backups, legacy workbook import, current canonical saves,
  and runtime compatibility projections covered while the internals move toward
  canonical models.

## 2.5.0 - 2026-06-09

### Dense UI/UX Simplification

**Reduced first-screen density across the Star, Moon, Planet, and Calendar
authoring pages with action-first summaries, compact workflow context, and
progressively disclosed secondary output details**
(ui/pageIntro.js, ui/starPage.js, ui/star/markup.js,
ui/star/contextSummary.js, ui/star/outputModel.js, ui/star/outputStrip.js,
ui/star/resultSummary.js, ui/moonPage.js, ui/moon/domRender.js,
ui/planetPage.js, ui/planet/domRender.js, ui/calendarPage.js,
ui/kpiSections.js, styles.css, tests/browser/smoke.spec.js,
tests/inputDraftStability.ui.test.js, tests/pageIntroPanels.ui.test.js,
tests/planetDomRender.test.js, tests/starOutputModel.test.js,
tests/starTopologyAuthoring.ui.test.js, tests/calendarPage.ui.test.js)

The Star page now opens with a compact cockpit that explains the current
editing target, topology, default host frame, and hierarchy health before users
reach the deeper topology controls. The guided/manual creation strip has been
pulled into that cockpit, the heavier system-context explanation now lives
behind a disclosure, single-star layouts hide multistar-only topology clutter,
and focused-editor hints adapt to the currently available star or pair targets.

Star and Moon outputs now lead with a plain-language Result Summary and keep
the primary output strip focused on Key Numbers, with identity, physical,
environment, system, activity, and habitability sections collapsed until needed.
The Planet page now shows an actionable empty output state with buttons for
creating a rocky planet, creating a gas giant, or starting the rocky guided
flow instead of leaving users at a terse "no selection" message.

Calendar profile context is more compact, with rule counts grouped into a
single summary card, profile-only output scope called out directly, and the
long rule-order explanation placed behind a local disclosure. Planet and Moon
page intro panels also use the compact workflow-context pattern so their first
viewport is less crowded while still keeping downstream effects available.

**Tests** (tests/browser/smoke.spec.js, tests/inputDraftStability.ui.test.js,
tests/pageIntroPanels.ui.test.js, tests/planetDomRender.test.js,
tests/starOutputModel.test.js, tests/starTopologyAuthoring.ui.test.js,
tests/calendarPage.ui.test.js)

- Added Star cockpit smoke coverage across desktop, mobile, and topology
  changes, including paired quad behavior and collapsed context disclosures.
- Added Planet output empty-state coverage for rocky, gas-giant, and guided
  actions, plus escaping regressions for the empty-state renderer.
- Added Moon and Calendar regressions for compact summaries, collapsed detail
  sections, and preserved selected/unassigned body states.
- Added output-model assertions proving Star and Moon now expose Result
  Summary content and collapse non-primary KPI sections by default.

### Apparent Visibility Geometry

**Prevented very bright night-side planets from being labeled as visible
"Day and night" when their elongation makes daytime viewing physically
impossible**
(engine/apparent.js, tests/apparent.test.js)

Planet visibility classification now requires an object to be bright enough
and positioned on the star-side half of the observer's sky before promoting it
to "Day and night". Bright outer planets at opposition, around 180 deg
elongation, now remain "At night" with a very-bright naked-eye visibility
label instead of being incorrectly marked as day-visible.

**Tests** (tests/apparent.test.js)

- Added a positive day-side bright-object case that still reports "Day and
  night".
- Added a regression for a very bright outer planet at opposition that now
  stays night-only.

### Dev Server and Release Workflow

**Hardened local dev-server startup, filtered test runs, and manual-upload
release checklist expectations**
(scripts/dev.mjs, scripts/serve-dist.mjs, scripts/run-tests.mjs,
RELEASE_CHECKLIST.md)

The `dev` script now probes for an available local port and automatically
falls forward from the requested port when it is already in use, while
`serve-dist` reports clearer bind and permission errors. The shared test
runner now accepts filename filters while still forwarding Node test options,
which makes targeted runs such as apparent-engine checks faster to execute.

The release checklist now treats `dist/` as the local manual-upload artifact
set and avoids asking maintainers to verify a live deployment before those
files have been uploaded.

## 2.4.0 - 2026-04-29

### Wide-Orbit Authoring Controls

**Added shared range-mode AU controls so rocky planets, gas giants,
debris disks, and comets can be authored out to the million-AU model
ceiling without losing practical inner-system slider precision**
(ui/orbitRangeControl.js, ui/planet/inputRender.js, ui/planetPage.js,
ui/outerObjectsPage.js, ui/store/cometModel.js, engine/comet.js,
styles.css, tests/inputDraftStability.ui.test.js,
tests/outerObjectsComets.ui.test.js, tests/comet.test.js,
tests/cometStoreModel.test.js)

AU placement fields now keep a full-range number input while the slider
switches between Inner, Outer, and Distant bands. Common 1-30 AU edits
stay precise, but distant worlds, belts, and comet orbits can be typed or
slid up to 1,000,000 AU with clear status feedback.

**Tests** (tests/inputDraftStability.ui.test.js,
tests/outerObjectsComets.ui.test.js, tests/comet.test.js,
tests/cometStoreModel.test.js)

- Added regressions for distant rocky-planet, gas-giant, debris-disk, and
  comet authoring, plus comet normalization at the shared million-AU cap.

### Stellar Classification Input

**Added stellar-class-driven star authoring with shared spectral parsing,
mass solving, UI application, persistence, and regression coverage**
(engine/starClassification.js, engine/starClassSolver.js, engine/star.js,
engine/brownDwarf.js, ui/star/markup.js, ui/star/inputController.js,
ui/star/constants.js, ui/starPage.js, styles.css, tests/starClassification.test.js,
tests/starClassSolver.test.js, tests/starInputController.test.js,
tests/starTopologyAuthoring.ui.test.js, tests/browser/smoke.spec.js)

Star authoring now accepts spectral class text such as `G2V`, `K dwarf`,
`sun-like`, `red dwarf`, and L/T/Y brown dwarf inputs, normalizes aliases
through a shared parser, and solves the nearest mass that produces the
requested class. Main-sequence requests resolve against ZAMS expectations,
while brown dwarf requests use the current system age so cooling-sensitive
targets report clear age-dependent feedback.

The Star page now exposes the workflow directly beside mass editing for
the focused star, including Apply and Enter-key submission, success/error
status, automatic cleanup of conflicting advanced overrides, persistence,
reload support, and multistar companion targeting.

**Tests** (tests/starClassification.test.js, tests/starClassSolver.test.js,
tests/starInputController.test.js, tests/starTopologyAuthoring.ui.test.js,
tests/browser/smoke.spec.js)

- Added parser and solver coverage for accepted aliases, rejected invalid
  classes, main-sequence targets, and age-sensitive brown dwarf targets.
- Added controller and UI regressions proving class application clears
  conflicting overrides, preserves intended evolution behavior, targets
  focused companions, avoids mutation on invalid input, persists changes,
  survives reload, and appears in exported world JSON.

### Tidal Locking Accuracy

**Corrected rocky-planet tidal despinning timescales by applying
differentiated-planet Love-number and inertia factors**
(engine/planet.js, engine/moon/tides.js, engine/physics/materials.js,
tests/planet.test.js)

Rocky planets now use the differentiated moment-of-inertia factor already
derived by the oblateness model instead of a uniform-sphere `0.4 MR^2`
assumption when estimating star-driven tidal locking. Their homogeneous
elastic Love number is also scaled back to Earth-like differentiated-body
values, preventing Earth-like planets from reporting despinning times
that are too short by roughly a factor of two.

Moon-system tidal reporting now shares the same differentiated-planet
Love-number correction for rocky parent lock-to-star and lock-to-moon
estimates, keeping the standalone planet page and moon context aligned.

**Tests** (tests/planet.test.js)

- Added a regression for an Earth-like near-Sun orbit that now remains
  near a 10 Gyr despinning timescale instead of the previously too-short
  roughly 4.3 Gyr result.

## 2.3.0 - 2026-04-19

### Calendar Audit And Import Follow-Up

**Closed the remaining calendar UX follow-up gaps by preserving live
view state during calendar-only import, broadening Rule Audit cache
invalidation, and fully resetting rule editors during profile changes**
(ui/calendar/transferFlows.js, ui/calendar/profileState.js,
ui/calendarPage.js, tests/calendarPage.ui.test.js,
tests/calendarPage.data.ui.test.js)

Calendar-only JSON import now keeps the imported month/day selection
instead of snapping the view back to the first month and first day after
apply. That keeps round-tripped calendars aligned with the exported live
state and makes phase 7's "do not hide or drop live calendar data"
acceptance criteria true in practice, not just in the schema.

Rule Audit preview and agenda invalidation is now keyed from the full
holiday and festival editor state, plus the broader calendar context the
audit summaries depend on. Editing categories, skip lists, advanced
anchor/conflict fields, or related display context now refreshes the
audit immediately instead of leaving stale preview text cached until
some other field happens to change.

Profile switches and calendar imports now reuse a shared editor-reset
path, which clears holiday, festival, intercalary, and cycle edit state
consistently. That closes the intercalary editor leak where switching to
another profile could leave the form looking like it was still editing a
rule from the previous profile.

**Tests** (tests/calendarPage.ui.test.js,
tests/calendarPage.data.ui.test.js)

- Added regressions for preserving imported month/day selection and
  selected-day state through calendar JSON apply flows.
- Added Rule Audit regressions proving preview text updates when holiday
  category and festival skip-year inputs change.
- Added profile-switch coverage proving the intercalary editor resets to
  a clean add state on the newly active profile.

### Calendar Recurrence And Export Lock-In

**Completed calendar UX plan phases 6 and 7 by expanding holiday and
festival recurrence, hardening calendar-only export/import round-trips,
and locking the new audit/export behavior in with regression coverage**
(ui/calendar/constants.js, ui/calendar/stateModel.js,
ui/calendar/renderHelpers.js, ui/calendar/ruleEditorFlows.js,
ui/calendar/calendarIo.js, ui/calendarPage.js,
tests/calendarIo.test.js, tests/calendarPage.ui.test.js,
tests/calendarStateModel.test.js)

Holiday and festival rules can now use a true `cyclic` recurrence with
explicit `cycleYears` and `offsetYear` fields, instead of forcing
authors to approximate every-N-years behavior through unrelated month
logic. The Calendar editor now exposes those fields directly, editor
enable/disable behavior matches the selected recurrence, and rule
summaries, previews, and trace output explain cyclic and one-off timing
in calendar-relative language.

Calendar-only JSON export/import is now safer for live calendar work.
Export envelopes deep-clone the active profile payload even when only a
single profile is present, preventing nested festival, recurrence, and
audit state from being shared by reference during later edits. UI
round-trip coverage now proves that custom-year yearly recurrence on
13-month calendars survives export/import, and that festival metadata
such as category, colour, cyclic recurrence, outside-week-flow, and
exception lists remains editable after import.

The release is also locked in with targeted recurrence and audit
regressions. Tests now cover cyclic holiday/festival normalization,
calendar-relative recurrence evaluation, calendar JSON round-trips for
audit filters and festival metadata, and the existing rule-audit agenda
surfaces alongside the broader calendar transfer and world import/export
paths.

### Calendar Intercalary Periods

**Completed the calendar intercalary periods feature, turning extra
calendar days into first-class structural time instead of implicit last-
month remainder hacks**
(ui/calendar/stateModel.js, engine/usableCalendar.js, ui/calendarPage.js,
ui/calendar/renderContext.js, ui/calendar/renderHelpers.js,
ui/calendar/ruleEditorFlows.js, ui/calendar/transferFlows.js,
ui/realmspacePreset.js, ui/solPreset.js,
tests/usableCalendar.test.js, tests/calendarStateModel.test.js,
tests/calendarPage.ui.test.js, tests/calendarPage.data.ui.test.js,
tests/calendarTransferFlows.test.js, tests/importExport.test.js)

Calendar profiles now support explicit `intercalaryPeriods` with stable
schema fields for placement, recurrence, duration, weekday-flow mode,
and exception years. Existing worlds still load without visible
regression because legacy calendars are migrated onto an explicit
compatibility `append-to-month` derived-remainder period when needed,
while newly authored calendars can keep month lengths and intercalary
placement separate.

The calendar engine now resolves an ordered year layout made up of month
segments and intercalary segments, with support for `before-month`,
`after-month`, `year-end`, and compatibility `append-to-month`
behaviour. Absolute-day conversion, year-start calculation, month-length
resolution, and rendered month models all follow that shared resolved
layout, so intercalary days behave as real chronology whether they
advance weekday flow or sit outside it.

The Calendar UI also now exposes intercalary periods as a first-class
authoring tool. Users can create, edit, and delete named structural
periods, the month view renders dedicated intercalary day rows before
and after months, selected-day and date-converter flows can land on and
describe intercalary dates directly, and the structure/compact summaries
report intercalary placement explicitly instead of disguising it as a
longer last month.

External calendar outputs now preserve the same structure. Calendar JSON
round-trips explicit intercalary data, printable output renders
structural intercalary blocks, and ICS export uses resolved absolute
dates for both structural and appended intercalary periods while keeping
ordinary festival export behaviour intact.

Shipped content now demonstrates the new model. Realmspace's Harptos
calendar uses explicit structural periods for Midwinter, Greengrass,
Midsummer, Shieldmeet, Highharvestide, and Feast of the Moon, making it
the canonical preset example of authored intercalary structure. Sol
keeps Gregorian behaviour unchanged, but now serializes an explicit
compatibility derived-remainder period so it stays on the new schema
path without relying on implicit migration-time synthesis.

**Tests** (tests/usableCalendar.test.js, tests/calendarStateModel.test.js,
tests/calendarPage.ui.test.js, tests/calendarPage.data.ui.test.js,
tests/calendarTransferFlows.test.js, tests/importExport.test.js)

- Added engine coverage for fixed and derived intercalary resolution,
  `before-month`, `after-month`, `year-end`, and `append-to-month`
  placements, plus absolute-day traversal across intercalary
  boundaries.
- Added UI and data-round-trip coverage for the dedicated intercalary
  editor, structural rendering, selected-day/date-converter behaviour,
  and JSON import/export persistence.
- Added transfer and preset regressions for printable output, ICS export,
  old-schema migration, Sol compatibility behaviour, and Realmspace's
  explicit Harptos layout including Shieldmeet.

## 2.2.0 - 2026-04-17

### Celestial Render Performance Plan

**Completed the celestial render performance plan with split cache signatures, shared texture job scheduling, immutable texture payloads, renderer-local GPU bundle reuse, shared ring caching, direct data-texture upload support, and budgeted visible-first warm-up across previews, the visualizer, poster prewarm, and guided flows**
(CELESTIAL_RENDER_PERFORMANCE_PLAN.md, ui/celestialVisualPreview.js,
ui/celestialTextureWorker.js, ui/celestialTextureWorkerClient.js,
ui/textureCache.js, ui/systemPosterNativeThree.js,
ui/visualizer/bodyMeshService.js, ui/visualizerPage.js,
ui/celestialPerfDebug.js, ui/celestialTextureJobQueue.js,
ui/celestialTexturePayloads.js, ui/rendererTextureBundleCache.js,
ui/ringTextureCache.js, ui/visualizer/renderBudget.js,
ui/visualizer/visibleWarmup.js, tests/celestialPerfDebug.test.js,
tests/celestialTextureJobQueue.test.js,
tests/celestialTexturePayloads.test.js,
tests/rendererTextureBundleCache.test.js, tests/ringTextureCache.test.js,
tests/visualizerRenderBudget.test.js)

The celestial render pipeline now separates texture, runtime,
ring-appearance, and ring-geometry identity so axial tilt, spin, ring
orientation, and other runtime-only edits no longer invalidate cached
body maps or force visualizer mesh recreation. Preview, visualizer, and
prewarm flows now route texture work through a shared priority queue
with bounded worker and fallback concurrency, stale-result suppression,
and visible/focused-body preference instead of unbounded parallel
fan-out.

Texture storage also moved away from clone-on-read canvas caching.
Worker, memory-cache, and IndexedDB paths now share immutable RGBA
payloads that can be reused directly, and preview/visualizer renderers
now acquire renderer-local texture bundles so same-signature renders
avoid rebuilding and re-uploading identical GPU assets. Ring strip
generation now follows the same shared cache model across preview and
visualizer, and the upload path can create `THREE.DataTexture`s
directly from payload buffers while keeping canvas fallback behavior
for compatibility.

The visualizer warm-up pass is now budgeted and view-aware rather than
snapshot-wide. Focused and large on-screen bodies warm first,
background work yields between batches, poster and recipe prewarm flows
respect the same queue behavior, and dev-only celestial performance
helpers now expose cache-hit, queue, reuse, and timing metrics for
verification.

**Tests** (tests/celestialVisual.test.js, tests/importExport.test.js,
tests/visualizerBodyMeshService.test.js,
tests/visualizerNativeLabelLayer.test.js,
tests/celestialPerfDebug.test.js,
tests/celestialTextureJobQueue.test.js,
tests/celestialTexturePayloads.test.js,
tests/rendererTextureBundleCache.test.js, tests/ringTextureCache.test.js,
tests/visualizerRenderBudget.test.js)

- Added dedicated regressions for signature stability, queue
  dedupe/concurrency, payload normalization and cache round-trips,
  renderer-local bundle refcounting/reuse, ring payload reuse, and
  warm-up prioritization and budget behavior.
- Kept existing preview, visualizer, import/export, and poster/browser
  coverage green while landing the pipeline changes.

### Route-Shell And Storage Hardening Follow-Up

**Hardened printable calendar export, extracted the next planet and calendar route-shell seams, and moved destructive world-storage clear/reset flows into a dedicated storage helper so the maintainability guardrails are green again**
(ui/calendar/transferFlows.js, tests/calendarTransferFlows.test.js,
ui/planet/hostFrame.js, ui/planet/bodyAppearance.js, ui/planetPage.js,
ui/calendar/renderContext.js, ui/calendar/profileState.js,
ui/calendar/renderSnapshot.js, ui/calendar/renderHelpers.js,
ui/calendar/ruleEditorFlows.js, ui/calendarPage.js,
ui/worldStorage/clearOperations.js, ui/worldStorage.js,
tests/calendarPage.ui.test.js, tests/calendarPage.data.ui.test.js,
tests/inputDraftStability.ui.test.js,
tests/rockyGuidedCreation.ui.test.js,
tests/gasGiantGuidedCreation.ui.test.js,
tests/deleteConfirmation.ui.test.js, tests/planetStore.test.js,
tests/guidedRoutes.ui.test.js,
tests/guidedSessionPersistence.ui.test.js,
tests/worldStorage.test.js, tests/importExportPage.ui.test.js,
tests/appStorageUi.ui.test.js)

Calendar printable export now opens its popup with
`noopener,noreferrer`, prefers a blob/object-URL printable document
instead of writing directly into the child window, and still falls back
to downloading a printable HTML file when the browser blocks popup
creation. The user-facing print-to-PDF flow and status messaging remain
the same, but the unsafe popup/document-write path is no longer the
primary route.

The planet and calendar route shells also shed another large tranche of
high-churn logic. Planet host-frame resolution, host-frame summaries,
luminosity formatting, brown-dwarf companion presentation, gas-giant and
rocky appearance derivation, and ring-display helpers now live under
`ui/planet/`, while the Calendar page now delegates render-context
assembly, profile activation/snapshot handling, month-model helper
summaries, and repeated `buildContext(loadWorld(), state)` access to
seam modules under `ui/calendar/` instead of keeping those concerns in a
single route shell.

This pass also cleared the remaining maintainability red signal in the
storage facade. World-save clear, unreadable-save recovery, durable
clear rollback, and test reset/rebootstrap flows now live in
`ui/worldStorage/clearOperations.js`, leaving `ui/worldStorage.js`
focused on bootstrap, cached reads, and scheduled persistence. That
reduced the facade from 664 lines to 526 lines and brought the
maintainability check back to green without changing the public storage
API.

**Tests** (`node scripts/check-maintainability.mjs`,
tests/calendarTransferFlows.test.js, tests/calendarPage.ui.test.js,
tests/calendarPage.data.ui.test.js, tests/inputDraftStability.ui.test.js,
tests/rockyGuidedCreation.ui.test.js,
tests/gasGiantGuidedCreation.ui.test.js,
tests/deleteConfirmation.ui.test.js, tests/planetStore.test.js,
tests/guidedRoutes.ui.test.js,
tests/guidedSessionPersistence.ui.test.js, tests/worldStorage.test.js,
tests/importExportPage.ui.test.js, tests/appStorageUi.ui.test.js)

- Added focused printable-export regressions for safe popup features,
  blob navigation, and blocked-popup HTML fallback behavior.
- Kept the planet editor, guided-flow/session, calendar UI/data, import/
  export, and world-storage durability suites green while landing the
  route-shell and storage-seam extractions.

## 2.1.0 - 2026-03-24

### Consequence-Aware Destructive Confirmations

**Added a shared destructive-action confirmation dialog across body deletion, star-topology collapse, calendar profile deletion, outer-object removal, local-cluster adjustment clearing, and import/export replacement flows**
(ui/destructiveActionDialog.js, ui/store/destructiveActions.js, ui/store.js,
ui/starPage.js, ui/planetPage.js, ui/moonPage.js, ui/calendarPage.js,
ui/outerObjectsPage.js, ui/localClusterPage.js, ui/importExportPage.js,
styles.css, tests/deleteConfirmation.ui.test.js,
tests/starTopologyAuthoring.ui.test.js, tests/planetStore.test.js,
tests/calendarPage.ui.test.js, tests/outerObjectsComets.ui.test.js,
tests/localClusterActions.ui.test.js, tests/importExportPage.ui.test.js)

Deleting planets, gas giants, moons, comets, debris disks, and calendar
profiles now opens a shared confirmation dialog that explains the exact
fallout before the mutation happens. The dialog calls out downstream
effects like dependent moons becoming unassigned, selection fallback,
host-frame-specific debris/comet fallout, and browser data loss for
clear-data/import replacement flows instead of relying on terse native
`confirm()` prompts.

Star topology changes now use the same destructive-action planning layer.
When collapsing a multi-star layout would remove stars or invalidate host
frames, the Star page now explains the surviving default host frame,
counts the planets, gas giants, moons, debris disks, and comets that
will be reassigned, and notes when moved planets or giant companions
lose their orbit-slot bindings. The store save path now keeps those
reassignments in sync automatically instead of leaving stale host-frame
ownership behind after topology changes.

This pass also fixed a calendar profile deletion bug where deleting the
active profile could accidentally re-save it during fallback activation.

**Tests** (tests/deleteConfirmation.ui.test.js,
tests/starTopologyAuthoring.ui.test.js, tests/planetStore.test.js,
tests/calendarPage.ui.test.js, tests/outerObjectsComets.ui.test.js,
tests/localClusterActions.ui.test.js, tests/importExportPage.ui.test.js)

- Added store and UI regressions for star-topology reassignment,
  destructive dialog confirm/cancel flows, calendar profile deletion,
  comet/debris deletion, local-cluster destructive actions, and import
  replacement/clear-data confirmation paths.

### UI / UX Accessibility And Orientation Pass

**Improved shell accessibility, first-run navigation orientation, dense-editor guidance, and touch ergonomics across the app shell, Star page, and Calendar page**
(index.html, app.js, styles.css, ui/overlayController.js, ui/pageIntro.js,
ui/tutorial.js, ui/tooltip.js, ui/motion.js, ui/star/contextSummary.js,
ui/starPage.js, ui/calendarPage.js, ui/lessonsPage.js, ui/sciencePage.js,
tests/appShellMarkup.test.js, tests/appStorageUi.ui.test.js,
tests/pageIntroPanels.ui.test.js, tests/starTopologyAuthoring.ui.test.js,
tests/calendarPage.ui.test.js, tests/tooltipBehavior.ui.test.js,
tests/lessonsPage.ui.test.js, tests/sciencePageReference.ui.test.js,
tests/tutorial.ui.test.js)

Blocking overlays and the mobile nav drawer now share a consistent
interaction model with focus trapping, focus restore, explicit drawer
state, and background hiding, while the tutorial panel remains a
deliberately non-modal helper surface. The main app outlet no longer
acts like a giant live region, first-run desktop navigation now opens
expanded instead of as a mystery icon rail, and active routes expose
`aria-current` so orientation is clearer for both keyboard and
screen-reader users.

The Star and Calendar editors now surface more of their key state
inline instead of forcing users to infer it from dense controls and
tooltip hunting. Star gained a persistent current-system summary for
topology, default host, and orbit-ownership impact, while Calendar now
shows an active-profile summary, rule counts, and visible rule
interaction/import-export guidance near the controls they affect.

Touch and microinteraction polish landed across the shell at the same
time. Global control targets were enlarged, tooltips now work through
click and keyboard instead of hover only, reduced-motion users no
longer get forced smooth scrolling, and the sidebar footer/navigation
shell were tightened so the footer controls stay on one row and the
full nav remains inside the viewport on smaller displays.

**Tests** (tests/appShellMarkup.test.js, tests/appStorageUi.ui.test.js,
tests/pageIntroPanels.ui.test.js, tests/starTopologyAuthoring.ui.test.js,
tests/calendarPage.ui.test.js, tests/tooltipBehavior.ui.test.js,
tests/lessonsPage.ui.test.js, tests/sciencePageReference.ui.test.js,
tests/tutorial.ui.test.js)

- Added regressions for nav drawer ARIA state and focus return, app-shell
  live-region semantics, route-intro rendering, Star/Calendar summary
  behavior, touch-friendly tooltip interaction, reduced-motion scroll
  behavior, and tutorial non-modal behavior.

### UX Guardrails And Help-Pattern Rules

**Documented the new help-system rules and added an automated UX guardrail check to keep the accessibility and guidance pass from drifting**
(STYLE_GUIDE.md, README.md, RELEASE_CHECKLIST.md, package.json,
.github/workflows/ci.yml, scripts/check-ux-guardrails.mjs,
ui/destructiveActionDialog.js, ui/tutorial.js, ui/tooltip.js,
tests/deleteConfirmation.ui.test.js, tests/tutorial.ui.test.js)

The style guide now explicitly says when to use inline hints, tooltips,
tutorial panels, and destructive confirmations, so future copy and help
surfaces do not collapse back into tooltip-only guidance. The shared
tutorial, tooltip, and destructive-dialog components also now mark
their own help pattern and overlay mode in source, which makes the
contracts visible instead of relying on contributor memory.

`npm run check:ux-guardrails` is now part of local checks, CI, and the
release gate. It fails fast if the app shell regains a broad live
region, if core icon-only controls lose accessible names, if tutorial
panels drift back toward modal behavior, or if destructive confirms stop
using the shared overlay controller.

**Tests** (tests/deleteConfirmation.ui.test.js, tests/tutorial.ui.test.js)

- Added explicit UX-contract coverage for destructive-dialog focus
  return/shared metadata and tutorial non-modal behavior.

## 2.0.1 - 2026-03-22

### Apparent Moon Texture Cache Fix

**Fixed the Apparent Size canvas reusing the same moon texture for different moons that shared a broad moon class**
(ui/apparentSkyNativeThree.js, tests/apparentSkyNativeThree.test.js,
tests/apparentPage.ui.test.js, tests/apparentDomRender.test.js)

The native Apparent Size sky canvas was caching moon preview snapshots
too coarsely, so different moons could collapse onto the same rendered
surface if they landed in the same broad display class. Moon snapshots
now key from the computed moon visual profile instead of only class
labels, so the sky canvas preserves distinct moon textures more
consistently.

**Tests** (tests/apparentSkyNativeThree.test.js,
tests/apparentPage.ui.test.js, tests/apparentDomRender.test.js)

- Added a focused regression to ensure same-class moons do not reuse the
  same cached apparent-sky texture, plus targeted Apparent page and DOM
  render verification.

## 2.0.0 - 2026-03-22

### Brown Dwarf Full Integration

**Added fully integrated brown dwarf support across star hosts, orbiting giant companions, and shared read-only views**
(engine/substellarRegime.js, engine/brownDwarf.js, engine/brownDwarfVisual.js, engine/star.js,
engine/system.js, engine/gasGiant.js, engine/homeSystem/\*.js,
engine/worldSnapshot.js, engine/worldAdapters.js,
ui/store/stellarSystemModel.js, ui/store/gasGiantModel.js, ui/store.js,
ui/starPage.js, ui/planetPage.js, ui/moonPage.js,
ui/apparentPage.js, ui/apparent/domRender.js, ui/apparentSkyNativeThree.js,
ui/systemPage.js, ui/systemPosterNativeThree.js,
ui/visualizer/snapshotModel.js, ui/visualizer/bodyMeshService.js,
ui/visualizer/focusSummary.js, ui/visualizerPage.js,
ui/visualizer/starSurface.js, ui/celestialVisualPreview.js, ui/gasGiantStyles.js,
tests/brownDwarf.test.js, tests/star.test.js, tests/system.test.js,
tests/worldAdapters.test.js, tests/visualizerSnapshotModel.test.js,
tests/visualizerFocusSummary.test.js, tests/starTopologyAuthoring.ui.test.js)

Brown dwarfs now occupy the shared substellar regime between gas giants
and hydrogen-burning stars. They can be authored as host stars on the
Star page or as orbiting giant companions on the Planets page without
branching into a bespoke workflow. The engine now solves brown-dwarf
cooling-track properties, current temperate zones, and substellar
classification, and the visualizer, system poster, apparent-size page,
moon context, and snapshot/adaptation layers now surface brown dwarfs
with class-aware labels, styles, and zone wording instead of collapsing
them back into ordinary gas-giant or star-only presentation.

Follow-up parity work brought the presentation layer into line across
the Star page, Planets page, visualizer, poster, and apparent-sky
surfaces. Brown dwarfs now use corrected L/T/Y visible-light colours,
scaled luminosity formatting with explanatory tooltips, brown-dwarf
class tooltips, star-style companion summaries, and explicit
brown-dwarf render payloads so orbiting brown dwarfs no longer fall
back to gas-giant or rocky-body graphics on shared renderer pages.

**Tests** (tests/brownDwarf.test.js, tests/star.test.js, tests/system.test.js,
tests/worldSnapshot.test.js, tests/worldAdapters.test.js,
tests/engineWorldFixtures.test.js, tests/importExport.test.js,
tests/gasGiant.test.js, tests/visualizerSnapshotModel.test.js,
tests/visualizerFocusSummary.test.js, tests/starTopologyAuthoring.ui.test.js,
tests/inputDraftStability.ui.test.js, tests/planetInputRender.test.js,
tests/planetBodySelector.test.js, tests/storeSystemFacade.test.js,
tests/planetStore.test.js)

- Added brown-dwarf engine/regime tests, host-authoring coverage,
  visualizer/poster/apparent renderer regressions, and full regression
  sweeps across the star, planet, moon, snapshot, import/export, and
  store paths.

### Moon Tidal And Resonance Accuracy

**Replaced the old linear moon-fate estimate with integrated tidal timescales, mass-aware resonance forcing, and migration-trend diagnostics**
(engine/moon/tides.js, engine/moon/resonance.js,
engine/moon/system.js, engine/moon.js, ui/moonPage.js,
tests/moon.test.js, tests/moonResonance.test.js,
tests/moonOrbitalFateRegression.test.js,
tests/moonDisplayModel.test.js, tests/crossModelMoonSystems.test.js,
tests/engineWorldFixtures.test.js)

Moon orbital-fate outputs no longer rely on the old
`distance / |da/dt|` shortcut. The Moon page now uses the integrated
tidal migration timescale for inward Roche evolution and outward escape
cases, so long-lived systems do not overstate or understate their
remaining lifetime by large factors.

Resonant moons also gained a more defensible forcing model. Forced
eccentricity now depends on resonance partner mass instead of a flat
heuristic floor, and adjacent moon pairs now surface a converging,
diverging, or neutral migration trend so resonance approach and
departure are easier to interpret directly from the Moon page.

**Tests** (tests/moon.test.js, tests/moonResonance.test.js,
tests/moonOrbitalFateRegression.test.js,
tests/moonDisplayModel.test.js, tests/crossModelMoonSystems.test.js,
tests/engineWorldFixtures.test.js)

- Added Earth-Moon, Phobos, and Triton orbital-fate regressions, plus
  mass-aware resonance and migration-trend coverage for the public moon
  model and Moon page display layer.

### Rocky-Planet Photochemical Stability

**Added explicit rocky-world photochemical stability, ozone-column, and UV-shielding outputs**
(engine/planet/photochemistry.js, engine/planet.js,
engine/habitability/schema.js, engine/habitability/context.js,
engine/habitability/chemistry.js, ui/planetPage.js,
tests/planetPhotochemistry.test.js,
tests/habitabilityChemistry.test.js,
tests/engineWorldFixtures.test.js, tests/worldSnapshot.test.js,
tests/worldSnapshotParity.test.js, tests/planetInputRender.test.js,
tests/habitabilityMetrics.test.js, tests/habitabilityRadiation.test.js,
tests/habitabilityContext.test.js)

Rocky planets now estimate whether their atmospheres remain
photochemically stable, derive a bounded ozone-column proxy, and report
UV shielding directly on the Planet page. This gives thin, irradiated,
or chemically fragile atmospheres more honest presentation than the
older coarse ozone/UV proxy alone.

The new photochemistry layer also feeds the shared habitability context,
so atmosphere chemistry and radiation shielding are more consistent
between the Planet page, the habitability model, snapshots, and
import/export paths.

**Tests** (tests/planetPhotochemistry.test.js,
tests/habitabilityChemistry.test.js,
tests/engineWorldFixtures.test.js, tests/worldSnapshot.test.js,
tests/worldSnapshotParity.test.js, tests/planetInputRender.test.js,
tests/habitabilityMetrics.test.js, tests/habitabilityRadiation.test.js,
tests/habitabilityContext.test.js)

- Added dedicated rocky photochemistry regressions and cross-model
  validation for Planet page outputs, habitability context wiring, and
  snapshot parity.

### Editable Comets And Visualizer Integration

**Added authored comets as a first-class system collection with comet-specific outputs, appearance previews, and Local Frame rendering**
(engine/comet.js, ui/store/cometModel.js, ui/store/worldSchema.js,
ui/store/worldMigration.js, ui/store.js, ui/outerObjectsPage.js,
ui/cometAppearance.js, ui/visualizer/cometOrbitPath.js,
ui/visualizer/snapshotModel.js, ui/visualizer/focusCamera.js,
ui/visualizer/focusSummary.js, ui/visualizer/constants.js,
ui/visualizer/inputBindings.js, ui/visualizerPage.js, styles.css,
tests/comet.test.js, tests/cometStoreModel.test.js,
tests/outerObjectsComets.ui.test.js,
tests/visualizerSnapshotModel.test.js,
tests/visualizerInputBindings.test.js,
tests/inputDraftStability.ui.test.js)

WorldSmith can now store, name, edit, duplicate, delete, import, and
export authored comets instead of treating them as purely derived
flavour. The `Other Objects` page gained a dedicated `Comets` tab,
host-frame-aware comet editing, Oort seeding hooks, and live orbit,
activity, tail, and appearance outputs for the selected comet.

The Local Frame visualizer now renders comets as first-class bodies
with eccentric-orbit placement, dashed orbit arcs, focus summaries,
preview-aware appearance data, and a comet-specific tail/coma treatment
that matches the `Appearance` KPI language on the editor side.

**Tests** (tests/comet.test.js, tests/cometStoreModel.test.js,
tests/outerObjectsComets.ui.test.js,
tests/visualizerSnapshotModel.test.js,
tests/visualizerInputBindings.test.js,
tests/inputDraftStability.ui.test.js)

- Added persistence, host-frame filtering, UI CRUD, seeding, draft
  stability, and visualizer orbit/selection regression coverage for the
  authored-comet path.

### Oort Cloud Reservoir Modeling And User Controls

**Added a paper-backed Oort-cloud baseline model, seeded long-period comet generation, and user-adjustable `Auto / Guided / Manual` reservoir controls**
(engine/oortCloud.js, ui/store/oortCloudModel.js,
ui/store/worldSchema.js, ui/store/worldMigration.js, ui/store.js,
ui/outerObjectsPage.js, engine/worldAdapters.js,
ui/importExportPage.js, ui/sciencePage.js,
tests/oortCloud.test.js, tests/oortCloudControls.test.js,
tests/engineWorldFixtures.test.js, tests/outerObjectsComets.ui.test.js,
tests/importExportPage.ui.test.js, tests/importExport.test.js,
tests/sciencePageReference.ui.test.js)

WorldSmith now derives a system-wide Oort-cloud reservoir from stellar
mass, giant-planet architecture, age, and Galactic environment, then
surfaces that reservoir on the `Other Objects` page with explicit
status, edge, mass, flux, and confidence KPIs. `Seed from Oort` now
creates deterministic long-period comet templates from the resolved
reservoir instead of using a fixed one-size-fits-all seed.

The Oort model is no longer auto-only. Worlds now persist Oort-cloud
controls in save data, support `Auto`, `Guided`, and `Manual` modes,
and carry those settings cleanly through migration, save/load,
import/export preview, and full round-trip validation. Guided controls
apply disclosed multipliers on top of the automatic science layer;
Manual mode explicitly overrides the displayed reservoir state.

The Science page now distinguishes the literature-inspired automatic
Oort baseline from the WorldSmith authoring overlay, and the
Import/Export page now shows the Oort mode and whether the reservoir
has been customized.

**Tests** (tests/oortCloud.test.js, tests/oortCloudControls.test.js,
tests/engineWorldFixtures.test.js, tests/outerObjectsComets.ui.test.js,
tests/importExportPage.ui.test.js, tests/importExport.test.js,
tests/sciencePageReference.ui.test.js)

- Added Solar-calibration, control-layer normalization, UI mode switch,
  seeding-profile, fixture, science-reference, and import/export
  round-trip coverage for the Oort reservoir model.

### Science Page Search And Reference UX

**Added top-of-page search and live filtering to the Science page, plus Oort-control disclosure and formula fixes**
(ui/sciencePage.js, styles.css, tests/sciencePageReference.ui.test.js)

The `Science & Maths` page now has a top search bar that indexes live
section and formula content, jumps directly to the best match, opens the
correct accordion section, and highlights the selected entry. Active
searches can also filter the visible science entries so the page is
usable even as the reference catalogue grows.

This pass also repaired broken formula rendering in the companion-flux
section and added explicit reference-page wording that separates the
automatic Oort-cloud science model from Guided and Manual worldbuilding
overlays.

**Tests** (tests/sciencePageReference.ui.test.js)

- Added search/jump, filter/restore, Oort-overlay reference, and
  formula-render regression coverage for the Science page.

### Gas Giant Eccentric Orbit Rendering

**Fixed gas giants rendering as circular orbits in the visualizer even when eccentric orbits were enabled**
(ui/store/gasGiantModel.js, ui/visualizer/snapshotModel.js,
ui/visualizer/focusCamera.js, ui/visualizer/constants.js,
ui/visualizerPage.js, tests/visualizerSnapshotModel.test.js,
tests/visualizerFocusCamera.test.js)

Gas giants now carry eccentricity, inclination, periapsis orientation,
axial tilt, and derived orbital period through the visualizer snapshot
and placement pipeline instead of being flattened back to circular
tracks. The local-frame renderer now animates gas giants with the same
eccentric-orbit motion used for planets, and saved/imported gas giant
periapsis orientation now survives normalization so ellipse orientation
is preserved in the visualizer.

**Tests** (tests/visualizerSnapshotModel.test.js,
tests/visualizerFocusCamera.test.js)

- Added regression coverage for gas giant orbital-field propagation and
  eccentric placement math in the visualizer.

## 1.27.0 - 2026-03-21

### Multistar Release Readiness

**Normalized the multistar model around `stellarSystem`, completed paired-quad authoring, and finished whole-system overview support across the visualizer**
(engine/homeSystem/\*.js, engine/worldSnapshot.js, engine/worldAdapters.js,
ui/store/stellarSystemModel.js, ui/store/worldMigration.js,
ui/store/worldSchema.js, ui/store.js, ui/bodySolveHelpers.js,
ui/starPage.js, ui/systemPage.js, ui/outerObjectsPage.js,
ui/apparentPage.js, ui/visualizerPage.js,
ui/visualizer/snapshotModel.js, ui/visualizer/inputBindings.js,
ui/visualizer/focusSummary.js, ui/canvasExport.js,
tests/worldSnapshot.test.js, tests/worldAdapters.test.js,
tests/storeHomeSystemHelpers.test.js,
tests/homeSystemContextTopologyGraph.test.js,
tests/visualizerSnapshotModel.test.js,
tests/visualizerInputBindings.test.js,
tests/visualizerFocusSummary.test.js, tests/browser/smoke.spec.js)

The multistar branch is now a first-class working product surface rather
than an experimental side path. `stellarSystem` is the practical source
of truth across migration, storage, snapshots, adapters, and
host-frame-aware page logic, while the old `world.star` object is kept
as a compatibility projection instead of a competing model.

Star authoring now supports the paired-quad hierarchy `(A+B)+(C+D)` in
both direct UI and guided-star flows, preserves that topology on
load/save, and validates it with hierarchy guardrails instead of
collapsing it back to the chained quad shape. Planet, moon, calendar,
climate, population, tectonics, debris, and import/export paths now
resolve from the active multistar host frame rather than assuming the
primary star.

The visualizer now ships a real `System Overview` mode with shared
host-frame selection, `View locally`, whole-system PNG export, and
overview availability across single, binary, triple, and quad systems.
Binary, triple, chained-quad, and paired-quad worlds all remain
reachable end to end across the Star, System, Apparent, Debris, and
Visualizer routes.

**Tests** (tests/worldSnapshot.test.js, tests/worldAdapters.test.js,
tests/storeHomeSystemHelpers.test.js,
tests/homeSystemContextTopologyGraph.test.js,
tests/visualizerSnapshotModel.test.js,
tests/visualizerInputBindings.test.js,
tests/visualizerFocusSummary.test.js, tests/browser/smoke.spec.js)

- Added normalization, migration-authority, host-frame, paired-quad,
  overview, export, and route-smoke regression coverage for the full
  multistar release path.

### Guided Random System Generation

**Added seeded random-system drafting with host-frame-safe AU allocation, curated naming pools, and preserve/reroll strategies**
(engine/systemGeneration/\*.js, ui/guidedCreation/adapters/system.js,
ui/guidedCreation/adapters/star.js, ui/systemRandomGeneration.js,
ui/systemPage.js, ui/store.js, tests/randomSystemGeneration.test.js,
tests/systemGenerationFoundation.test.js,
tests/systemGuidedAdapter.test.js,
tests/systemRandomGeneration.ui.test.js, tests/browser/smoke.spec.js)

WorldSmith can now generate full random home-system drafts instead of
only individual stars or planets. The new generator builds single-star
and multistar topologies from a seed, tunes orbit ladders, allocates
planets and gas giants onto validated host-frame slot catalogs, creates
moon families after parent worlds are fixed, and applies curated random
names for stars, planets, and moons from preloaded catalogs.

The System page now exposes a guided `Generate Random System` flow that
produces draft worlds before apply, then commits them atomically so
topology, stars, planets, moons, debris, and downstream derived state
stay in sync. The release path ships with ambitious follow-up behavior
too: `reroll names only`, `keep stars, reroll planets`, `keep planets,
reroll moons`, richer goal templates, and preserve-selected-homeworld
logic where the regenerated slot layout remains scientifically workable.

As part of this work, the guided Star adapter now treats paired quads as
a first-class topology target, so the random-system stack and the
standalone guided-star flow share the same multistar architecture set.

**Tests** (tests/randomSystemGeneration.test.js,
tests/systemGenerationFoundation.test.js,
tests/systemGuidedAdapter.test.js,
tests/systemRandomGeneration.ui.test.js, tests/browser/smoke.spec.js)

- Added deterministic-generation, paired-quad, preserve/reroll, UI-flow,
  and browser-smoke coverage for seeded random-system drafting and apply.

### Star Page Multistar UX Redesign

**Rebuilt the multistar Star page into a single-focus inspector with layout cards, an interactive topology map, and per-star advanced physics**
(ui/starPage.js, styles.css, tests/starTopologyAuthoring.ui.test.js,
tests/starGuidedCreation.ui.test.js, tests/inputDraftStability.ui.test.js,
tests/browser/smoke.spec.js)

The Star page no longer presents multistar authoring as one long stacked
form. Shared age, metallicity, and evolution controls now live in a
`Shared System Context` block; topology and quad layout are chosen
through `Home System Layout` cards; and the new topology map teaches the
hierarchy directly with clickable star/pair nodes, guardrail state, and
default-host highlighting.

Focused editing now uses a single visible target across the map,
inspector pills, and editor pane. Users switch between `Stars` and
`Pairs`, edit one target at a time, and see the same selection echoed in
the focused summary and output preview. All stars selected through the
inspector now support the same `Physics mode` controls as the old
primary-star-only advanced editor, including derivation modes and
radius/luminosity/temperature overrides.

The outputs block was also made multistar-aware. The old single-target
visualizer KPI is now a labeled `Focused Star Preview` backed by a
`System Stars` strip, so every star remains visible, named, and
switchable from the outputs area without losing inspector focus.

This pass also fixed several redesign-edge bugs, including stale
paired-to-chained host-frame transitions and the literal `null` text
that could leak into star pills when an optional status badge was not
present.

**Tests** (tests/starTopologyAuthoring.ui.test.js,
tests/starGuidedCreation.ui.test.js,
tests/inputDraftStability.ui.test.js, tests/browser/smoke.spec.js)

- Added staged safety-net coverage for topology cards, quad layouts,
  topology-map selection, single-focus inspector behavior, advanced
  companion physics editing, output-strip sync, and route persistence.

### Science, Lessons, And Science Visualiser Sync

**Brought the educational surfaces up to date with the current multistar host-frame model and modern science references**
(ui/sciencePage.js, ui/lessons/L07_planetarySystems.js,
ui/scienceGraphData.js, ui/scienceVisualiserPage.js,
tests/sciencePageReference.ui.test.js, tests/lessonsContent.test.js,
tests/scienceGraphData.test.js, tests/scienceVisualiser.ui.test.js)

The `Science & Maths` page, Lesson 07, and the Science Visualiser now
explain the same multistar logic that the live engine uses. The Science
page gained explicit coverage for S-type and P-type host frames,
companion-flux habitable-zone shifts, Holman-Wiegert binary stability
limits, disk truncation, and hierarchical triple/quad guardrails, so
the educational references no longer describe system architecture as if
everything were single-star only.

The Science Visualiser graph now includes matching system-level concepts
for host-frame topology, companion flux, and multistar stability, plus
new runtime edges that show how those concepts feed into habitable-zone
context and interpreted planetary orbits. Reference-chip labels are also
normalized to the current Science-page section names so the visualizer
does not surface stale section titles when linking back to the
reference page.

**Tests** (tests/sciencePageReference.ui.test.js,
tests/lessonsContent.test.js, tests/scienceGraphData.test.js,
tests/scienceVisualiser.ui.test.js)

- Added educational-surface regressions for the refreshed system
  architecture content, new graph nodes and edges, and updated
  Science-Visualiser render copy.

### Tooltip Completion And Coverage Audit

**Finished the remaining tooltip gaps across science-facing, import/export, cluster, and visualizer pages**
(ui/apparentPage.js, ui/localClusterPage.js, ui/localCluster/domRender.js,
ui/importExportPage.js, ui/scienceVisualiserPage.js,
ui/calendarPage.js, ui/moonPage.js, ui/visualizerPage.js,
ui/visualizer/constants.js, tests/tooltipCoverage.ui.test.js)

The remaining tooltip drift after the broader style-guide pass has now
been closed. Apparent-sky tables, Local Cluster controls and census
headers, Import/Export actions and textareas, Science Visualiser KPI
labels and filter headings, Calendar `Decimal places`, Moon `Surface
Ices`, and the remaining Visualizer controls all now carry explicit
tooltips that explain what each input or output means and, where
relevant, the underlying science or modeling assumption.

This audit also added a dedicated tooltip-coverage regression file so
future UI passes do not silently reintroduce unlabeled controls on these
pages.

**Tests** (tests/tooltipCoverage.ui.test.js)

- Added focused UI coverage for the remaining tooltip-sensitive pages and
  their newly documented controls.

## 1.26.0 - 2026-03-15

### Star XUV Evolution

**Moved XUV history into the star engine, added mass-dependent saturation times, and exposed star-owned XUV outputs across escape, moon-radiation, and habitability paths**
(engine/star.js, engine/physics/escape.js, engine/planet/atmosphere.js,
engine/planet.js, engine/gasGiant/escape.js, engine/moon/radiation.js,
engine/moon.js, engine/habitability/context.js, ui/starPage.js,
tests/star.test.js, tests/physicsEscape.test.js,
tests/starXuvPropagation.test.js, tests/inputDraftStability.ui.test.js)

Stars now solve a dedicated XUV evolution track with a saturated
high-energy phase and a mass-dependent saturation lifetime, instead of
relying on the old escape-side age heuristic. That star-owned XUV model
now drives rocky-planet escape, gas-giant mass loss, moon radiation, and
habitability context building, while the Star page surfaces `XUV
Regime`, `XUV Flux at 1 AU`, `XUV Luminosity`, and `XUV Saturation Age`
directly.

**Tests** (tests/star.test.js, tests/physicsEscape.test.js,
tests/starXuvPropagation.test.js, tests/inputDraftStability.ui.test.js)

- Added star-level XUV evolution regressions, downstream gas-giant and
  moon propagation coverage, and Star-page rendering checks for the new
  XUV outputs.

### Atmospheric Collapse On Tidally Locked Worlds

**Added a pressure-supported night-side atmospheric-collapse check for synchronously locked rocky planets and threaded it into rocky habitability scoring**
(engine/planet.js, engine/planet/climate.js, ui/planetPage.js,
tests/planet.test.js, tests/inputDraftStability.ui.test.js)

Rocky planets now estimate whether a synchronously locked atmosphere can
stay gaseous on the permanent night side, using dominant-gas
condensation thresholds plus pressure-supported heat transport. Thin,
locked atmospheres on M-dwarf worlds can now be flagged as marginal or
collapse-prone, that penalty now feeds the rocky climate-stability and
habitability path, and the Planet page surfaces the collapse state,
modeled night-side minimum temperature, and dominant condensable gas.

**Tests** (tests/planet.test.js, tests/inputDraftStability.ui.test.js)

- Added direct locked-world collapse helper regressions, an end-to-end
  locked rocky-world solve case, and a Planet-page rendering check for
  the new `Atmospheric Collapse` output.

### Hot Jupiter Radius Inflation

**Replaced the old hot-giant proximity heuristic with a flux-based hot-Jupiter inflation model and applied it to real derived gas-giant radii**
(engine/gasGiant.js, engine/gasGiant/structure.js, ui/planetPage.js,
tests/gasGiant.test.js, tests/inputDraftStability.ui.test.js)

Gas giants now use a Thorngren & Fortney-style irradiation anomaly when
deriving radius from mass, rather than only exposing a loose
temperature-based suggestion. Highly irradiated giants gain a bounded
fractional radius anomaly from incident flux, manual radii remain
authoritative, and the Planet page now surfaces the inflation state in
the gas-giant physical outputs.

**Tests** (tests/gasGiant.test.js, tests/inputDraftStability.ui.test.js)

- Added direct hot-Jupiter flux-threshold tests, auto-derived hot-vs-cold
  radius regression coverage, manual-radius override protection, and a
  gas-giant UI rendering check for the new inflation output.

### Lava World Classification

**Added explicit lava-world and magma-ocean classification for rocky planets**
(engine/planet/composition.js, engine/planet.js, ui/planetPage.js,
tests/planet.test.js, tests/inputDraftStability.ui.test.js)

Rocky planets now classify extremely hot surface states explicitly rather
than leaving close-in scorched worlds as generic rocky bodies. The
solver distinguishes `Standard rocky world`, `Lava world`, and `Magma
ocean world` from solved surface temperature and tidal-lock context, and
the Planet page now surfaces the resulting `Surface State` in both the
headline outputs and detailed environment readouts.

**Tests** (tests/planet.test.js, tests/inputDraftStability.ui.test.js)

- Added direct threshold-order regression coverage for the rocky surface
  classifier and Planet-page rendering checks for the new `Surface
State` output.

### Rocky Planet Oblateness And J2

**Added rocky-planet rotational flattening and quadrupole gravity outputs**
(engine/planet.js, engine/planet/orbit.js, ui/planetPage.js,
tests/planet.test.js, tests/inputDraftStability.ui.test.js)

Rocky planets now estimate rotational oblateness, equatorial and polar
radii, and `J2` from mass, radius, spin rate, and bulk interior
concentration. The Planet page surfaces those values in the rocky-world
physical outputs so fast rotators no longer render as perfectly
spherical bodies in the science readouts.

**Tests** (tests/planet.test.js, tests/inputDraftStability.ui.test.js)

- Added Earth-like flattening/J2 regression coverage and Planet-page
  rendering checks for the new rocky-planet physical-state outputs.

### Detection Observables

**Added transit depth, geometric transit probability, and stellar radial-velocity semi-amplitude outputs for rocky planets and gas giants**
(engine/physics/orbital.js, engine/planet.js, engine/gasGiant.js,
ui/planetPage.js, tests/physicsOrbital.test.js, tests/planet.test.js,
tests/gasGiant.test.js, tests/inputDraftStability.ui.test.js)

Rocky planets and gas giants now expose basic exoplanet-detection
observables in their solved outputs and Planet-page `System Context`
panels. The engine computes transit depth in percent and ppm, geometric
transit probability, and edge-on RV semi-amplitude, making it easier to
judge whether a generated world would be detectable in transit or
stellar wobble surveys.

**Tests** (tests/physicsOrbital.test.js, tests/planet.test.js,
tests/gasGiant.test.js, tests/inputDraftStability.ui.test.js)

- Added direct orbital-helper regression tests and page-level rendering
  checks for the new detection metrics.

### Guided Creation Expansion And Goal-Seeking Search

**Extended the guided-creation framework across gas giants and stars, then added structured goal-building, session restore, dedicated routes, async search jobs, and controlled free-text aliases**
(app.js, ui/guidedCreation/types.js, ui/guidedCreation/state.js,
ui/guidedCreation/registry.js, ui/guidedCreation/flowController.js,
ui/guidedCreation/routeState.js, ui/guidedCreation/sessionState.js,
ui/guidedCreation/solverJob.js, ui/guidedCreation/goalTraits.js,
ui/guidedCreation/goalCompiler.js, ui/guidedCreation/goalAliases.js,
ui/guidedCreation/goalTextParser.js,
ui/guidedCreation/goalTextInterpretation.js,
ui/guidedCreation/components/guidedPanel.js,
ui/guidedCreation/components/goalTextAssist.js,
ui/guidedCreation/adapters/moon.js,
ui/guidedCreation/adapters/rockyPlanet.js,
ui/guidedCreation/adapters/gasGiant.js,
ui/guidedCreation/adapters/star.js, ui/moonPage.js, ui/planetPage.js,
ui/starPage.js, styles.css, tests/guidedCreationFlowController.test.js,
tests/guidedCreationSessionState.test.js,
tests/guidedGasGiantAdapter.test.js,
tests/guidedGoalCompiler.test.js,
tests/guidedGoalTextParser.test.js,
tests/guidedGoalTraitRegistry.test.js,
tests/guidedMoonAdapter.test.js, tests/guidedRockyAdapter.test.js,
tests/guidedRoutes.ui.test.js, tests/guidedRouteState.test.js,
tests/guidedSessionPersistence.ui.test.js,
tests/guidedSolverJob.test.js, tests/guidedStarAdapter.test.js,
tests/gasGiantGuidedCreation.ui.test.js,
tests/moonGuidedCreation.ui.test.js,
tests/rockyGuidedCreation.ui.test.js,
tests/starGuidedCreation.ui.test.js)

Guided creation is now a full cross-object product surface rather than a
moon/rocky-world feature. Gas giants and stars now ship with the same
top-level `Quick` and `Guided` workflows, and the framework supports
restorable guided sessions, dedicated guided routes, async/cancelable
search jobs, and structured goal-builder state instead of only
archetype-first recommendations.

This pass also completed the `PR 12` goal-seeking layer. Moons, rocky
worlds, gas giants, and stars can now compile structured goals into
bounded search requests, run seeded recommendation searches, and accept
reviewed free-text aliases like `forest moon`, `ringed gas giant`, or
`quiet orange dwarf` through a controlled parser that maps back onto the
shared trait/template model instead of writing raw inputs directly.

**Tests** (tests/guidedCreationFlowController.test.js,
tests/guidedCreationSessionState.test.js,
tests/guidedGasGiantAdapter.test.js,
tests/guidedGoalCompiler.test.js,
tests/guidedGoalTextParser.test.js,
tests/guidedGoalTraitRegistry.test.js,
tests/guidedMoonAdapter.test.js,
tests/guidedRockyAdapter.test.js,
tests/guidedRoutes.ui.test.js,
tests/guidedRouteState.test.js,
tests/guidedSessionPersistence.ui.test.js,
tests/guidedSolverJob.test.js, tests/guidedStarAdapter.test.js)

- Added framework, parser, session, routing, and end-to-end guided-flow
  coverage for all supported object types.

### Moon Habitability, Radiation, And Stability Follow-Up

**Extended the moon model toward more defensible habitable and life-bearing moon outcomes with explicit radiation, shielding, stability, and surface-vs-subsurface habitability gates**
(engine/moon.js, engine/moon/biosphere.js, engine/moon/climate.js,
engine/moon/hydrosphere.js, engine/moon/magnetosphere.js,
engine/moon/orbit.js, engine/moon/radiation.js,
engine/moon/retention.js, engine/moon/system.js,
engine/habitability/context.js, engine/habitability/radiation.js,
ui/guidedCreation/adapters/moon.js, ui/moonPage.js,
tests/crossModelCalendar.test.js, tests/engineWorldFixtures.test.js,
tests/habitabilityRadiation.test.js, tests/moon.test.js,
tests/moonAtmosphere.test.js, tests/moonClimate.test.js,
tests/moonHabitability.test.js, tests/moonHydrosphere.test.js,
tests/moonRadiationMagnetosphere.test.js)

The moon engine now includes dedicated moon magnetosphere and radiation
layers, separates surface and subsurface moon-life outcomes more
explicitly, and pushes that richer radiation state all the way through
moon biosphere and unified habitability scoring instead of collapsing it
back to the older parent-belt proxy. Moon summaries and Moon-page
outputs now distinguish cases like `surface ocean plausible`,
`radiation-limited surface ocean`, and `subsurface ocean plausible`
using explicit shielding and exposure diagnostics.

This follow-up also tightened moon science where the prior review found
we were still too heuristic: circumplanetary stability now uses
conservative prograde/retrograde outer limits instead of treating the
full Hill sphere as long-term stable space, exposed surface cases now
prefer the star engine's real habitable-zone output with low-mass-star
penalties, the moon-system tidal-habitable-zone flag is derived from the
solved orbit/heating/radiation context rather than a fixed parent-type
band, and `Full` / `Manual` moon volatile handling now respects explicit
inventory and manual atmospheric requests more than raw density-only
shortcuts.

Guided moon search was reweighted around `water + atmosphere +
radiation + stability` rather than leaning mainly on warmer orbits, so
goal-seeking moon creation is now more willing to choose safer surface
or subsurface outcomes over hotter but harsher inner-moon candidates.

**Tests** (tests/moonRadiationMagnetosphere.test.js,
tests/moonHabitability.test.js, tests/moonHydrosphere.test.js,
tests/moonClimate.test.js, tests/moonAtmosphere.test.js,
tests/moon.test.js, tests/habitabilityRadiation.test.js,
tests/engineWorldFixtures.test.js)

- Added new moon radiation/magnetosphere analog checks plus regression
  coverage for the updated habitability, stability, volatile, and
  guided-search paths.

### Cool-Star Surface-Habitable Moon Calibration

**Added a paper-informed cool-star surface-moon calibration layer, real moon spin-state outputs, and the matching Moon/science-surface explanations**
(engine/moon.js, engine/moon/tides.js,
engine/moon/surfaceHabitabilityCalibration.js,
ui/guidedCreation/adapters/moon.js, ui/moonPage.js, ui/sciencePage.js,
ui/lessons/L12_moonsTides.js, ui/scienceGraphData.js,
ui/scienceVisualiserPage.js, tests/moonSurfaceHabitabilityCalibration.test.js,
tests/moonSpinState.test.js, tests/guidedMoonAdapter.test.js,
tests/inputDraftStability.ui.test.js, tests/sciencePageReference.ui.test.js,
tests/lessonsContent.test.js, tests/scienceGraphData.test.js,
tests/scienceVisualiser.ui.test.js)

Surface-habitable moons around cool stars are now calibrated more
selectively instead of being treated as generic warm moon outcomes. The
moon solver adds a dedicated surface-exomoon calibration block that
weighs moon mass, host giant favorability, parent orbital distance,
composition, and spin state; the tidal path now exposes `1:1`,
`3:2`, and non-resonant moon spin states; and guided moon search now
uses that calibration when scoring exposed-surface goals. The Moon page
surfaces the new `Surface Exomoon Calibration` and `Spin State` outputs,
while the Science page, Lesson 12, and Science Visualiser now explain
that this layer only constrains exposed surface outcomes and does not
replace the broader subsurface-ocean moon model.

**Tests** (tests/moonSurfaceHabitabilityCalibration.test.js,
tests/moonSpinState.test.js, tests/guidedMoonAdapter.test.js,
tests/inputDraftStability.ui.test.js, tests/sciencePageReference.ui.test.js,
tests/lessonsContent.test.js, tests/scienceGraphData.test.js,
tests/scienceVisualiser.ui.test.js)

- Added regression coverage for mass-floor behavior, 3:2 resonance
  handling, guided selection of calibration-favored moons, Moon-page
  rendering of the new outputs, and the updated science/reference copy.

### Science, Lessons, And Visualiser Sync

**Refreshed the science references, lessons, and science visualiser again so they stay aligned with the newer guided-search and moon-habitability model**
(ui/sciencePage.js, ui/scienceVisualiserPage.js,
ui/scienceGraphData.js, ui/lessons/L05_habitableZone.js,
ui/lessons/L12_moonsTides.js, tests/sciencePageReference.ui.test.js,
tests/lessonsContent.test.js, tests/scienceGraphData.test.js,
tests/scienceVisualiser.ui.test.js)

The science and lesson surfaces now reflect the current moon model more
precisely: conservative moon-stability limits instead of the older
larger Hill-sphere simplification, mode-sensitive moon volatile
inventories instead of density-only wording, star-engine habitable-zone
context with low-mass-star cautions for surface-habitable moons, and the
current separation between exposed surface and subsurface moon-life
outcomes. The Science Visualiser lede and graph metadata were updated to
keep that language aligned across the reference surfaces.

**Tests** (tests/sciencePageReference.ui.test.js,
tests/lessonsContent.test.js, tests/scienceGraphData.test.js,
tests/scienceVisualiser.ui.test.js)

- Added regression checks for the updated moon-reference wording across
  the Science page, lessons, and visualiser.

## 1.25.0 BETA - 2026-03-15

### Moon Science Parity And Coupled Moon Systems

**Extended the moon engine into a mode-gated moon-world solver with richer atmosphere, hydrosphere, climate, and system-coupling outputs**
(engine/moon.js, engine/moon/atmosphere.js,
engine/moon/climate.js, engine/moon/hydrosphere.js,
engine/worldAdapters.js, engine/worldSnapshot.js, ui/moonPage.js,
ui/moonStyles.js, ui/store/bodyMutations.js,
ui/store/worldMigration.js, ui/store/worldSchema.js,
tests/moonHydrosphere.test.js, tests/worldAdapters.test.js,
tests/importExport.test.js, tests/inputDraftStability.ui.test.js)

Moons now expose separate `Hydrosphere`, `Atmosphere`, and
`Orbital Coupling` modes, with compatibility-preserving `Core` paths
and richer `Full` / `Manual` science controls. The moon solver now
surfaces atmosphere-stability diagnostics, climate collapse-risk data,
interior and ocean-state outputs, resonance and tidal-habitable-zone
metadata, and formation-classification context instead of treating moons
as a much thinner special case.

This pass also converted the newer oceanic and biologically active moon
archetypes into engine-backed solved outcomes, carried the richer
moon-world data through adapters and snapshots, and updated Moon-page
state persistence so the expanded moon input schema survives save/load,
import/export, and cross-page consumers.

**Tests** (tests/moonHydrosphere.test.js,
tests/worldAdapters.test.js, tests/importExport.test.js,
tests/inputDraftStability.ui.test.js)

- Added regression coverage for the richer moon inputs, evolved
  hydrosphere outputs, and snapshot/adapter propagation paths.

### Guided Creation Framework For Moons And Rocky Worlds

**Added a shared guided-creation framework plus top-level `Quick`, `Guided`, and `Recipes` entry flows for moons and rocky planets**
(ui/guidedCreation/types.js, ui/guidedCreation/state.js,
ui/guidedCreation/registry.js, ui/guidedCreation/launchState.js,
ui/guidedCreation/flowController.js,
ui/guidedCreation/diagnostics.js,
ui/guidedCreation/adapters/moon.js,
ui/guidedCreation/adapters/rockyPlanet.js,
ui/guidedCreation/components/archetypeGrid.js,
ui/guidedCreation/components/confidenceBadge.js,
ui/guidedCreation/components/diagnosticList.js,
ui/guidedCreation/components/guidedPanel.js,
ui/guidedCreation/components/overlay.js,
ui/guidedCreation/components/questionStep.js,
ui/guidedCreation/components/recommendationCard.js,
ui/moonGuidedLaunch.js, ui/moonPage.js, ui/planetPage.js,
ui/moon/domRender.js, ui/planet/domRender.js,
ui/system/domRender.js, ui/systemPage.js, ui/moonStyles.js,
ui/rockyPlanetStyles.js, ui/store/bodyMutations.js,
tests/guidedCreationRegistry.test.js,
tests/guidedCreationState.test.js,
tests/guidedCreationDiagnostics.test.js,
tests/guidedCreationFlowController.test.js,
tests/guidedCreationComponents.ui.test.js,
tests/guidedMoonAdapter.test.js, tests/guidedRockyAdapter.test.js,
tests/guidedMoonEntry.ui.test.js,
tests/moonGuidedCreation.ui.test.js,
tests/rockyGuidedCreation.ui.test.js, tests/bodyMutations.test.js,
tests/planetDomRender.test.js, tests/systemDomRender.test.js,
tests/inputDraftStability.ui.test.js)

WorldSmith now has a reusable guided-creation shell rather than a
moon-only wizard. Moons and rocky planets both support quick archetype
application, staged guided recommendations, confidence-badged
diagnostics, and `Apply and open Advanced` handoff into the existing
editors. Guided moon creation can now launch from Moon, Planet, and
System contexts, preview host-context adjustments, and apply reviewed
moon-system sibling fixes when resonance-backed moon setups need them.

The primary create actions were also moved to dedicated top-of-inputs
`Create This Moon` and `Create This Rocky World` strips so guided
workflows no longer depend on small action buttons inside output KPI
cards. `Recipes` is now framed explicitly as an Advanced-mode preset
starting point that will override current inputs.

**Tests** (tests/guidedMoonAdapter.test.js,
tests/guidedRockyAdapter.test.js,
tests/moonGuidedCreation.ui.test.js,
tests/rockyGuidedCreation.ui.test.js,
tests/guidedMoonEntry.ui.test.js, tests/bodyMutations.test.js)

- Added framework-level, adapter-level, and end-to-end UI coverage for
  guided flows, launch entry points, and reviewed sibling-patch
  application.

### Science, Lessons, And Visualiser Alignment

**Refreshed the science reference, lesson content, and science visualiser metadata so they match the current moon, ring, and curriculum models**
(ui/sciencePage.js, ui/scienceVisualiserPage.js,
ui/scienceGraphData.js, ui/lessons/L12_moonsTides.js,
ui/lessons/L20_debrisDisks.js, tests/scienceGraphData.test.js,
tests/scienceVisualiser.ui.test.js, tests/lessonsContent.test.js,
tests/sciencePageReference.ui.test.js)

The Science page and Lesson 12 now document the current moon-world
stack, including moon science modes, coupled moon-system solving,
Laplace-chain and resonance context, and the newer surface-versus-
subsurface habitability framing. Lesson 20 now explicitly teaches
planetary rings instead of implying them only through the subtitle.

The Science Visualiser now uses current curriculum titles, updated lede
copy, richer moon/ring section descriptions, and additional graph nodes
for `Moon World State` and `Planetary Rings`, so the visual dependency
map no longer lags behind the current simulation and lesson structure.

**Tests** (tests/scienceGraphData.test.js,
tests/scienceVisualiser.ui.test.js,
tests/lessonsContent.test.js, tests/sciencePageReference.ui.test.js)

- Added regression checks for lesson-link validity against the live
  curriculum, the updated visualiser lede, and the new moon/ring
  reference content.

## 1.24.0 - 2026-03-13

### Planetary Ring Override Controls

**Added explicit ring visibility overrides for gas giants and rocky worlds while preserving science-driven auto mode**
(engine/planetaryRings.js, engine/worldAdapters.js, ui/planetPage.js,
ui/planet/inputRender.js, ui/store/gasGiantModel.js,
ui/store/bodyMutations.js, ui/store/worldMigration.js,
ui/store/worldSchema.js, tests/planetaryRings.test.js,
tests/worldAdapters.test.js, tests/visualizerSnapshotModel.test.js,
tests/importExport.test.js)

Gas giants and rocky planets now share one `ringMode` model:
`Auto (science)`, `Force on`, and `Force off`. In `Auto`, ring
visibility still follows the science. In manual modes, users can
override that result explicitly, and the Planet page now makes it clear
when a visibility override goes against the science. Manual ring intent
also now survives save/load, import/export, recipes, presets, preview,
visualizer, and poster rendering instead of being silently replaced by
legacy compatibility booleans.

**Tests** (tests/planetaryRings.test.js, tests/worldAdapters.test.js,
tests/visualizerSnapshotModel.test.js, tests/importExport.test.js)

- Added end-to-end coverage for gas giant and rocky `ringMode`
  resolution, adapter propagation, and persistence through
  import/export.

### Planetary Ring Appearance And Style

**Added deterministic ring-style selection plus procedural banded ring rendering across preview, visualizer, and poster**
(ui/ringAppearanceProfiles.js, ui/ringTextureGenerator.js,
ui/celestialComposer.js, ui/celestialVisualPreview.js,
ui/visualizer/bodyMeshService.js, ui/visualizer/snapshotModel.js,
ui/systemPosterNativeThree.js, ui/systemPage.js,
tests/ringAppearanceProfiles.test.js, tests/ringTextureGenerator.test.js,
tests/celestialComposer.test.js, tests/visualizerBodyMeshService.test.js)

Visible rings now resolve through a separate `ringStyleId` model.
`Auto (recommended)` picks a deterministic style from the current body
state, while `Force on` lets users choose an explicit ring family.
Saturn-like, icy, dusty, dark, arc-like, and rocky-debris ring families
now carry authored banding, opacity, and gap profiles instead of a flat
uniform tint. Preview, visualizer, and poster now all render rings from
the same resolved appearance data and generated strip textures, so ring
style changes invalidate caches correctly and stay visually aligned
across renderers.

**Tests** (tests/ringAppearanceProfiles.test.js,
tests/ringTextureGenerator.test.js, tests/celestialComposer.test.js,
tests/visualizerBodyMeshService.test.js)

- Added style-resolution, texture-generation, and renderer-parity
  coverage for the shared ring appearance pipeline.

### Ring Lighting And Planet Shadows

**Added stylized-realistic ring lighting plus softened ring shadows on ringed planets**
(ui/ringLightingShader.js, ui/ringShadowBodyPatch.js,
ui/celestialVisualPreview.js, ui/visualizer/bodyMeshService.js,
ui/visualizerPage.js, tests/visualizerBodyMeshService.test.js,
tests/celestialComposer.test.js, tests/ringAppearanceProfiles.test.js)

Ring rendering now reacts to star-light angle and view angle instead of
behaving like a flat tinted cutout. The shared renderer adds soft
planet-cast shadows across the ring plane, and rocky planets and gas
giants now receive ring shadows that preserve visible ring gaps while
staying softer and wider than a hard stencil. The visualizer also now
keeps those shadows oriented to the host star instead of changing with
camera motion.

**Tests** (tests/visualizerBodyMeshService.test.js,
tests/celestialComposer.test.js, tests/ringAppearanceProfiles.test.js)

- Added shader-helper and body-shadow patch coverage for ring lighting
  uniforms, body-shadow patch attachment, and ring-shadow propagation.

## 1.23.1 BETA - 2026-03-10

### Gas Giant Input Fix

**Restored gas-giant numeric input updates after the gas-giant form renderer rename**
(ui/planetPage.js, tests/inputDraftStability.ui.test.js)

Fixed the Planet-page gas-giant number/slider bindings after the form
renderer moved those sliders to the shared `*_slider` id pattern. The
old page selectors were still querying the removed camel-case slider
ids, which meant gas-giant numeric edits silently failed to commit.
This was especially visible on mobile, where manual number entry is the
primary interaction path.

## 1.22.1 - 2026-03-09

### KPI Output Redesign

**Reworked dense output pages around grouped KPI sections, unified celestial section names, lighter stat rows, and explicit detail expansion**
(ui/kpiSections.js, ui/statRows.js, ui/derivedDetails.js, ui/planet/outputRender.js,
ui/moon/domRender.js, ui/moonPage.js, ui/starPage.js,
ui/planetPage.js, ui/tectonicsPage.js, ui/populationPage.js,
styles.css, STYLE_GUIDE.md, tests/inputDraftStability.ui.test.js,
tests/moonDomRender.test.js, tests/planetOutputRender.test.js)

Dense pages no longer rely on one flat wall of KPI cards. The Star,
Planet, and Moon pages now share one celestial-output language across
rocky planets, gas giants, and moons:
`Summary`, `Identity & Class`, `Physical State`, `Environment`,
`System Context`, `Activity & Radiation`, `Habitability`, plus one
shared collapsible `Derived Details` block that uses lighter stat rows
for the secondary output layer. Tectonics and Population now use lighter
stat rows for more secondary readouts instead of repeating full
KPI-card grids.

This pass also added explicit tap/click expansion support for KPI
detail, so touch users are no longer dependent on hover to read
secondary output text on dense pages.

The redesign was completed across both rocky and gas-giant Planet-page
outputs, so all celestial-body editors now follow the same section
order instead of mixing the older gas-giant readout layout with the new
sectioned KPI model.

Follow-up fixes tightened the shared `Derived Details` stat-row layout
so long secondary values wrap cleanly instead of obscuring their labels,
and corrected the special colour KPI cards so they show only one
disclosure chevron and keep the sky-colour title row at a stable
one-line height.

### Habitability Science Corrections

**Rebuilt the WorldSmith habitability model into a pathway-aware `phi-unified-v2` while keeping `ESI` literature-faithful**
(engine/habitability/constants.js, engine/habitability/species.js,
engine/habitability/schema.js, engine/habitability/context.js,
engine/habitability/hydrosphere.js, engine/habitability/solvent.js,
engine/habitability/chemistry.js, engine/habitability/radiation.js,
engine/habitability/persistence.js, engine/habitability/stability.js,
engine/habitability/metrics.js, engine/moon/atmosphere.js,
engine/moon/hydrosphere.js, engine/planet.js,
tests/habitabilitySpecies.test.js,
tests/habitabilitySolvent.test.js,
tests/habitabilityChemistry.test.js,
tests/habitabilityPersistence.test.js,
tests/habitabilityRadiation.test.js,
tests/habitabilityStability.test.js,
tests/habitabilityMetrics.test.js,
tests/hydrosphere.test.js,
tests/moonHabitability.test.js,
tests/planet.test.js)

Implemented the full filed PHI / ESI science-corrections plan from
`filed-plans/PHI_ESI_SCIENCE_CORRECTIONS_PLAN.md`. `ESI` remains the
standard four-term Earth-likeness metric, but the WorldSmith
habitability score is now explicitly a custom PHI-inspired comparative
model with `surface-water`, `subsurface-water`, and
`alternative-solvent` pathways, explicit policy versions, and
pathway-specific solvent, chemistry, radiation, persistence, and
stability handling.

This pass also fixed the key science defects from the review: canonical
species normalization now removes label and alias drift across the
habitability stack, planet and moon contexts now carry the missing
radiogenic/internal-heating support fields, dry and frozen worlds no
longer leak surface-solvent credit, Titan-like alternative-solvent
support stays policy-gated, subsurface moons are scored through their
own solvent/stability/radiation path instead of surface-water logic, and
the hydrosphere model now uses the locked blended depth-based surface
coverage rules.

### Habitability UI and Documentation Alignment

**Updated the Planet and Moon pages to present the new score honestly and expose its active pathway**
(ui/planetPage.js, ui/moonPage.js, ui/sciencePage.js,
ui/rockyPlanetStyles.js, tests/inputDraftStability.ui.test.js,
tests/rockyPlanetStyles.test.js, tests/celestialVisual.test.js)

The user-facing KPI is now consistently presented as `Habitability
Index`, with tooltip copy that explicitly says it is a WorldSmith
comparative metric rather than a direct literature PHI implementation.
The expanded KPI state now exposes the selected solvent pathway, policy
version, and model version so users can tell when a score is coming from
surface water, subsurface oceans, or alternative solvents.

The Science page now documents that distinction directly, and the rocky
visual fallback path was tightened so recipe previews and regime-only
visual tests keep their expected baseline ocean coverage instead of
accidentally picking up the full physical depth-blend path when the
preview data does not include a real hydrosphere state.

## 1.22.0 — 2026-03-09

### Moon Workflow Integration

**Integrated moon-world outputs into snapshots, visualizer focus, import/export preview, and documentation**
(engine/moon.js, engine/worldSnapshot.js, engine/worldAdapters.js,
ui/visualizer/focusSummary.js, ui/visualizerPage.js,
ui/importExportPage.js, ui/lessons/L12_moonsTides.js, ui/sciencePage.js,
styles.css,
tests/worldSnapshot.test.js, tests/worldAdapters.test.js,
tests/importExportPage.ui.test.js, tests/visualizerFocusSummary.test.js,
tests/moonWorldRoundTrip.test.js, .gitignore)

Implemented `Stage M7` from the moon-world plan. Moon-world state is now
available to cross-page consumers through the snapshot layer even in
summary mode, including atmosphere class, hydrosphere state, climate
state, biosphere class, subsurface-ocean presence, and habitability
index. The Visualiser can now focus moons directly and exposes a compact
focused-body summary card, with explicit surface-vs-subsurface wording
when a moon score is being supported by subsurface water rather than an
exposed biosphere.

The Import/Export page now reports a compact moon-world preview summary
for imports and explicitly notes that moon atmosphere, hydrosphere,
climate, geology, biosphere, and habitability outputs are rebuilt from
saved inputs after load. Lesson 12 and the Science page now document the
current moon-world stack and its surface-versus-subsurface distinction.
A new round-trip integration test also proves those moon outputs
survive save/load and export/import workflows.

### Moon Surface and Visual Integration

**Made moon visuals depend on modelled atmosphere, hydrosphere, biosphere, and geology state**
(ui/moon/displayModel.js, ui/moonStyles.js, ui/celestialComposer.js,
ui/celestialArtProfiles.js, tests/moonDisplayModel.test.js,
tests/moonStyles.test.js, tests/celestialComposer.test.js, .gitignore)

Implemented `Stage M6` from the moon-world plan. Moon visual output is
now driven from the engine-side moon world state instead of relying only
on older density / albedo / tidal-heating heuristics. The Moon preview
and shared celestial renderer now react to explicit hydrosphere,
atmosphere, biosphere, cryovolcanic, and volcanic outputs, so wet ocean
moons, hazy atmospheric moons, icy fracture-plume moons, and
biologically active moons render in ways that match the current model.
The Moon recipe picker now uses richer Moon-specific cards with short
style hints, the new `Temperate Ocean`, `Biologically Active`, and
`Hazy Atmosphere` recipes now appear in the picker, and the
irregular-capture style now renders as a visibly non-spherical captured
body instead of a perfect sphere. Small captured moons now use a
deterministic lumpy-body geometry in the shared Moon preview path, so
Phobos-, Deimos-, and irregular-capture-style bodies read as potato
shapes rather than stretched spheres. Moon atmosphere shells now render
as tighter limb haze instead of the old solid tinted aura, which makes
Titan-like, hazy, oceanic, and biologically active Moon previews read
more naturally.

### Moon KPI Layout Consistency

**Normalized Moon-page KPI card sizing and moved verbose details into hover meta**
(ui/moonPage.js, styles.css, tests/inputDraftStability.ui.test.js)

Aligned the Moon page with the KPI rules in the style guide. The
collapsed Moon-page KPI cards now use short labels and compact summary
values so every card stays at the same footprint, while the extra
descriptive detail is exposed in the existing hover/focus expansion
state instead of forcing taller cards.

### Moon Biosphere and Plant-Life Layer

**Added first-pass moon biosphere gating for surface biology and vegetation**
(engine/moon/biosphere.js, engine/moon.js, ui/moonPage.js,
tests/moonBiosphere.test.js, tests/inputDraftStability.ui.test.js,
.gitignore)

Implemented `Stage M5` from the moon-world plan. Moons now derive a
first-pass biosphere layer that separates surface biology from PHI and
adds explicit plant-life gating. The new moon biosphere model evaluates
atmosphere adequacy, accessible surface water, climate livability,
radiation, host-star spectrum, and illumination regime, then emits a
surface-biosphere class, plant-life plausibility, vegetation
eligibility, vegetation colours where supported, and a limiting-factor
summary when exposed life is not supported.

The Moon page now surfaces these biosphere outputs directly so users can
see whether a moon supports surface life, whether visible vegetation is
plausible, and which factors are blocking surface biology in cold,
airless, or highly irradiated cases.

**Tests** (tests/moonBiosphere.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct biosphere regressions for Luna-like, temperate wet, and
  Enceladus-like moon cases
- Added Moon-page UI assertions for the new biosphere labels and
  explanatory tooltip copy

### Moon Geology and Volatile Replenishment

**Implemented moon geology outputs for resurfacing, volatile replenishment, and ocean persistence**
(engine/moon/geology.js, engine/moon.js, ui/moonPage.js,
tests/moonGeology.test.js, tests/inputDraftStability.ui.test.js,
.gitignore)

Implemented `Stage M4` from the moon-world plan. Moons now derive a
first-pass geology layer instead of behaving like passive bodies with
fixed volatile and ocean inventories. The new geology model adds
separate silicate-volcanic and cryovolcanic activity scores, a derived
resurfacing class, volatile-replenishment tendency, and
ocean-persistence tendency using the current tidal heating, radiogenic
heating, composition, size, gravity, and hydrosphere state.

The Moon page now surfaces these geology outputs directly, so users can
distinguish inert cratered moons from Io-like volcanic resurfacing and
Enceladus-like cryovolcanic / volatile-replenishing cases under the
current inputs.

**Tests** (tests/moonGeology.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct anchor-case regressions for Luna-like, Io-like, and
  Enceladus-like moons
- Added Moon-page UI assertions for the new geology labels and tooltip
  copy

### Parent-Coupled Moon Climate

**Implemented moon climate outputs driven by parent illumination and eclipse geometry**
(engine/moon/illumination.js, engine/moon/climate.js,
engine/moon/temperature.js, engine/moon.js,
engine/habitability/context.js, ui/moonPage.js,
tests/moonClimate.test.js, tests/inputDraftStability.ui.test.js,
.gitignore)

Implemented `Stage M3` from the moon-world plan. Moons now derive a
first-pass climate layer instead of relying only on a single bulk
surface temperature. The new model adds parent reflected light, parent
thermal emission, eclipse duty cycle, and synchronous-geometry contrast,
then emits moon-specific climate state, climate zones, seasonality, a
surface-temperature range, eclipse cooling, and planetshine forcing.

The Moon page now surfaces these climate outputs directly, and moon
habitability now consumes the explicit moon climate block instead of the
earlier frozen-surface shortcut.

**Tests** (tests/moonClimate.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct illumination and eclipse regressions
- Added moon climate integration checks for zones and livability
- Added Moon-page UI assertions for the new climate outputs and tooltip
  copy

### Moon Hydrosphere and Ocean System

**Implemented the second moon-world tranche with explicit moon hydrosphere states**
(engine/moon/hydrosphere.js, engine/habitability/hydrosphere.js,
engine/habitability/context.js, engine/moon.js, ui/moonPage.js,
tests/moonHydrosphere.test.js, tests/moonHabitability.test.js,
tests/inputDraftStability.ui.test.js, .gitignore)

Implemented `Stage M2` from the moon-world plan. Moons now derive a
separate hydrosphere state instead of relying on the earlier thin shared
moon-water heuristic. The new moon hydrosphere model distinguishes dry,
surface-ocean, frozen-surface, subsurface-ocean, and steam cases, and it
adds first-pass heuristics for water coverage, subsurface-ocean score,
surface-accessible liquid water, ocean depth, ice-shell thickness, and
high-pressure-ice barriers.

The Moon page now surfaces this state directly through new hydrosphere
outputs, so users can see when a moon is frozen at the surface, when a
buried ocean is supported, and how deep the modeled liquid or ice layers
are under the current inputs.

**Tests** (tests/moonHydrosphere.test.js,
tests/moonHabitability.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct hydrosphere regressions for dry, temperate wet,
  Europa-like, and Titan-like moon cases
- Rebased moon habitability expectations onto the new subsurface-ocean
  hydrosphere state
- Added Moon-page UI assertions for the new hydrosphere labels and
  tooltip copy

### Moon Atmosphere Foundation

**Began the moon-world roadmap with first-pass moon atmosphere modeling**
(engine/moon/atmosphere.js, engine/moon/temperature.js, engine/moon.js,
engine/habitability/context.js, ui/moonPage.js,
tests/moonAtmosphere.test.js, tests/moon-nasa-validation.test.js,
tests/engineWorldFixtures.test.js,
tests/inputDraftStability.ui.test.js, .gitignore)

Implemented `Stage M1` from the moon-world plan. Moons now derive a
first-pass atmosphere state with source classification, dominant gas,
surface pressure, composition summary, density, scale height, and simple
greenhouse / anti-greenhouse treatment. The moon engine now solves
volatile inventory, atmosphere state, and temperature together instead
of exposing only the earlier thin-atmosphere retention estimate.

The Moon page now surfaces the new atmosphere outputs directly,
including `Atmosphere`, `Surface Pressure`, `Atmosphere Composition`,
and `Greenhouse Warming`, with updated tooltip wording to explain the
current model scope.

**Tests** (tests/moonAtmosphere.test.js,
tests/moon-nasa-validation.test.js,
tests/engineWorldFixtures.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct atmosphere regressions for Luna-like, Titan-like,
  Triton-like, and Io-like moon cases
- Updated Moon-page UI expectations for the new atmosphere outputs
- Rebased the icy-moon fixture snapshot and NASA-validation caveats to
  match the new first-pass atmosphere model

### Rocky Visual Tuning

**Improved Earth-like / shallow-ocean rocky texture colour balance**
(ui/rockyPlanetStyles.js, ui/celestialArtProfiles.js,
ui/celestialComposer.js, tests/rockyPlanetStyles.test.js)

Adjusted the rocky-planet texture pipeline so Earth-like and shallow-ocean
worlds render with a clearer blue ocean signal instead of reading muddy or
overly brown. The Earth-like ocean tint is now brighter, the Earth-style
art profiles use a slightly stronger ocean/atmosphere treatment, and the
ocean fill layer now paints more decisively beneath the continent mask.

### Sol Preset Refresh

**Updated the Sol preset to stay aligned with the current habitability and moon models**
(ui/solPreset.js, tests/solPresetConsistency.test.js, .gitignore)

Refreshed the built-in Solar System preset so its inputs still make sense
after the recent hydrosphere and habitability work. Earth now uses a
realistic water mass fraction, which keeps the preset Earth-like while
placing it in the more defensible `Shallow oceans` regime under the
current water-inventory model.

The preset's moon data was also cleaned up: the Bond albedos for the
moons covered by the local NASA calibration suite now match those
reference values, several stale >1 geometric-albedo values were removed,
and the two moons explicitly calibrated in the current moon model now use
their intended composition overrides (`Io` as `Partially molten`,
`Enceladus` as `Subsurface ocean`).

### Unified Habitability Model

**Completed Stage 7 unified PHI composition for planets and moons**
(engine/habitability/solvent.js, engine/habitability/chemistry.js,
engine/habitability/radiation.js, engine/habitability/persistence.js,
engine/habitability/schema.js, engine/habitability/context.js,
engine/habitability/metrics.js, engine/planet.js, engine/moon.js,
ui/planetPage.js, ui/moonPage.js, tests/habitabilitySolvent.test.js,
tests/habitabilityChemistry.test.js,
tests/habitabilityRadiation.test.js,
tests/habitabilityPersistence.test.js, tests/habitabilityMetrics.test.js,
tests/moonHabitability.test.js, tests/planet.test.js,
tests/inputDraftStability.ui.test.js, .gitignore)

Habitability scoring now uses one explicit unified model version,
`phi-unified-v1`, for both planets and moons. The shared PHI core still
uses substrate, solvent, energy, and chemistry, but Stage 7 makes the
major policy layers explicit: solvent pathways, chemistry and
photochemistry, radiation, and long-term persistence are now all modeled
as separate bounded submodels instead of being folded into generic
heuristics.

The current default policy supports surface water and subsurface water.
Alternative solvents are now implemented as an explicit policy hook but
remain disabled by default. Europa-like and Enceladus-like moons now
improve once subsurface-water support is available, while Titan-like
worlds only improve when alternative-solvent support is explicitly
enabled.

Planet and Moon habitability cards now surface the unified model version
and active solvent-policy scope in their KPI metadata and tooltip text.

**Tests** (tests/habitabilitySolvent.test.js,
tests/habitabilityChemistry.test.js,
tests/habitabilityRadiation.test.js,
tests/habitabilityPersistence.test.js, tests/habitabilityMetrics.test.js,
tests/moonHabitability.test.js, tests/planet.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct solvent-policy tests for surface-only, subsurface-water,
  and alternative-solvent behavior
- Added dedicated chemistry, radiation, and persistence regressions
- Rebased planet and moon habitability tests onto the unified PHI model
- Added UI regressions confirming unified version/policy disclosure on
  both Planet and Moon pages

### Moon Habitability Metrics

**Completed Stage 6 moon ESI and Moon Habitability Index support**
(engine/habitability/hydrosphere.js, engine/habitability/radiation.js,
engine/habitability/context.js, engine/habitability/metrics.js,
engine/moon.js, ui/moonPage.js, tests/moonHabitability.test.js,
tests/inputDraftStability.ui.test.js, .gitignore)

Implemented the first moon habitability-metrics release. The moon engine
added `Earth Similarity Index` and `Moon Habitability Index` values,
backed by a surface-focused moon hydrosphere helper and a direct
magnetospheric-radiation penalty. This phase introduced the first shared
moon PHI path before the later Stage 7 unified model replaced the
intermediate moon-only release state.

The Moon page gained both KPI cards with plain-text breakdowns for
substrate, solvent, energy, chemistry, stability, and radiation. Stage 6
itself was intentionally surface-water-only: subsurface oceans and
alternative solvents remained out of scope until the later unified policy
work.

**Tests** (tests/moonHabitability.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct moon habitability coverage for Luna-like, Io-like,
  Europa-like, Enceladus-like, and temperate wet reference cases
- Added adapter regressions confirming valid `context-v2` moon outputs
  and radiation-aware scoring
- Added a Moon-page UI regression confirming the new KPI cards, rendered
  breakdown text, and tooltip wording

### Habitability Context Generalization

**Completed Stage 5 normalized context refactor for habitability metrics**
(engine/habitability/schema.js, engine/habitability/context.js,
engine/habitability/metrics.js, tests/habitabilityContext.test.js,
tests/habitabilityMetrics.test.js, tests/planet.test.js, .gitignore)

Moved the habitability metric layer onto a versioned nested
`context-v2` schema so the scoring core is no longer coupled to a flat,
planet-specific adapter shape. The rocky-planet adapter now emits the
normalized context, a fixture-ready moon adapter now exists for future
moon PHI work, and the metric functions read only the shared nested
sections for bulk, surface, energy, chemistry, climate, environment,
and provenance.

This is an architectural phase rather than a user-facing scoring change:
the current rocky-planet ESI and PHI outputs are intended to remain
numerically unchanged while the shared schema and validator lock down the
contract needed for later moon support.

**Tests** (tests/habitabilityContext.test.js,
tests/habitabilityMetrics.test.js, tests/planet.test.js)

- Added direct schema and adapter coverage for valid planet and moon
  `context-v2` outputs
- Added validator regressions for missing core fields, invalid surface
  fraction totals, and optional-environment normalization
- Confirmed metric parity for current rocky-planet engine outputs after
  the nested-schema refactor

### Science Formula Contrast

**Gave light-mode equation cards their own theme token**
(styles.css)

Science and Maths equation blocks now use dedicated theme variables for
their background and border, so the light-theme formula surface has
better contrast without relying on a hardcoded selector colour.

### About Page Licensing

**Added a View License toast to the About page**
(ui/aboutPage.js, styles.css, tests/aboutPage.ui.test.js)

The About page now includes a `View License` button beside `View
Changelog`, opening a toast that explains the app code is released under
MPL-2.0, distinguishes software licensing from generated user output,
explicitly states that users can use their generated output as they see
fit, and links to the public license and third-party notices.

### Rocky Habitability Metrics Beta

**Added Stage 1 Earth Similarity Index and Habitability Score metrics**
(engine/habitability/metrics.js, engine/habitability/context.js,
engine/planet.js, ui/planetPage.js, tests/planet.test.js,
tests/planet-nasa-validation.test.js,
tests/inputDraftStability.ui.test.js)

Implemented the first habitability-metrics phase for rocky planets. The
planet engine now computes an Earth Similarity Index (ESI) from radius,
density, escape velocity, and surface temperature, plus a clearly-labeled
`Habitability Score (Beta)` built from substrate, solvent, energy, and
chemistry terms.

The Planet page gained both rocky-world KPI cards with plain-text
breakdowns and tooltip guidance. Gas giants remained out of scope. This
engine-side metric layer also established the adapter pattern that later
stages used for moon support and for the PHI upgrades that replaced the
initial beta score.

**Tests** (tests/planet.test.js, tests/planet-nasa-validation.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct metric tests for ESI and PHI beta term behavior
- Added engine integration checks for wet and dry rocky worlds
- Added NASA-based ESI regressions for Earth, Venus, and Mars
- Added a Planet-page UI regression confirming the new KPI cards render
  for rocky planets but not for gas giants

### Shared Hydrosphere Model

**Completed Stage 2 shared hydrosphere and surface-access integration**
(engine/habitability/hydrosphere.js, engine/habitability/context.js,
engine/habitability/metrics.js, engine/planet.js,
engine/population.js, ui/populationPage.js, ui/rockyPlanetStyles.js,
tests/hydrosphere.test.js, tests/population.test.js,
tests/rockyPlanetStyles.test.js, tests/planet.test.js, .gitignore)

Implemented the second habitability-metrics phase by moving rocky-world
surface water interpretation onto a single engine-side hydrosphere
model. `calcPlanetExact()` now emits shared liquid-ocean, land, ice,
steam, and surface-accessible-liquid fractions, and the Phase 1
habitability metrics now read those outputs instead of relying on the
temporary Stage 1 land/ocean fallback.

Population auto land/ocean handling and rocky-planet rendering now
consume the same hydrosphere state, removing the earlier disagreement
between population math and visual ocean coverage. In this phase the
climate model intentionally remains label-based; the shared hydrosphere
model is authoritative for PHI, Population, and rocky rendering.

**Tests** (tests/hydrosphere.test.js, tests/population.test.js,
tests/rockyPlanetStyles.test.js, tests/planet.test.js)

- Added direct hydrosphere regressions for normalization, dry, frozen,
  low-pressure, and runaway-greenhouse cases
- Rebased rocky renderer and population tests onto the authoritative
  hydrosphere fractions
- Added planet integration checks for emitted hydrosphere outputs and
  PHI solvent behavior

### Planetary Habitability Index v1

**Completed Stage 3 rocky-world PHI v1**
(engine/habitability/metrics.js, engine/habitability/context.js,
engine/planet.js, ui/planetPage.js, tests/habitabilityMetrics.test.js,
tests/planet.test.js, tests/inputDraftStability.ui.test.js, .gitignore)

Replaced the Stage 1 beta habitability heuristic with `phi-v1`, a more
defensible rocky-world `Planetary Habitability Index` built on the
shared Stage 2 hydrosphere outputs. The score keeps the four-term
geometric-mean structure, but now uses a mixed-land substrate term,
surface-accessible-liquid solvent term, insolation-plus-internal-heat
energy term, and a broader chemistry composite.

This phase graduated the rocky-world KPI from `Habitability Score
(Beta)` to `Planetary Habitability Index`, with gas giants still out of
scope. It also introduced the intermediate `phi-v1` engine model version
before later climate-aware and unified-model upgrades replaced it.

**Tests** (tests/habitabilityMetrics.test.js, tests/planet.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct PHI v1 regression coverage for solvent, substrate,
  chemistry, energy, and bounds behavior
- Rebased rocky-world ranking tests onto PHI v1 with a wet low-mass
  reference world
- Updated Planet-page UI regressions for the graduated PHI v1 label

### Climate-Aware Habitability

**Completed Stage 4 climate and stability integration for rocky PHI**
(engine/habitability/climateLivability.js,
engine/habitability/stability.js, engine/habitability/context.js,
engine/habitability/metrics.js, engine/planet.js, engine/population.js,
ui/planetPage.js, tests/habitabilityStability.test.js,
tests/habitabilityMetrics.test.js, tests/planet.test.js,
tests/inputDraftStability.ui.test.js, .gitignore)

Upgraded the rocky-world habitability model from `phi-v1` to
`phi-v2-planet`. The PHI base still uses substrate, solvent, energy, and
chemistry, but the final score is now multiplied by a climate/stability
term derived from climate state and climate-zone livability.

This phase also extracts the climate-zone habitability fraction out of
Population into a shared engine helper, so PHI no longer depends on a
Population-owned implementation detail. The rocky Planet page keeps the
same `Planetary Habitability Index` label, but its tooltip and KPI meta
were updated to reflect the added stability term. This climate-aware
planet model was later folded into the Stage 7 unified `phi-unified-v1`
system.

**Tests** (tests/habitabilityStability.test.js,
tests/habitabilityMetrics.test.js, tests/planet.test.js,
tests/inputDraftStability.ui.test.js)

- Added direct stability regressions for climate-state penalties,
  climate-zone livability, and bounded output
- Rebased PHI direct tests and rocky-world integration checks onto
  `phi-v2-planet`
- Added engine checks that the climate multiplier never raises PHI above
  its four-term base
- Updated the Planet-page UI regression to require the new stability line

## 1.21.1 — 2026-03-08

### Reading Comfort

**Updated global text selection styling and increased main-content line height**
(styles.css)

Selected text now uses the site theme colours instead of the browser
default highlight. Main reading areas across the app also now use a
`1.5rem` line height to improve scanability and reduce cramped text in
panel content, hints, tutorials, lessons, and changelog views.

### Planet KPI Detail Units

**Added exact SI secondary values to Planet-page radius and gravity KPIs**
(ui/planetPage.js)

The expanded rocky-planet KPI cards for Radius and Gravity now show exact
secondary values in meters and meters per second squared, matching the
existing pattern used by the average surface temperature card.

### Visualizer Spin Direction

**Corrected planet and moon spin direction in the visualizer**
(ui/visualizer/projectionMath.js, tests/visualizerProjectionMath.test.js)

Fixed the visualizer spin convention so body rotation now resolves
against the orbit animation correctly instead of appearing inverted.
Retrograde is now carried by the tilted spin axis alone, rather than
being applied twice through both axis direction and spin-rate sign.

**Tests** (tests/visualizerProjectionMath.test.js)

- Added a regression asserting prograde and retrograde bodies resolve to
  opposite effective spin directions in the visualizer math

### Stellar and Moon Physics Corrections

**Fixed metallicity-driven star, planet, and moon inconsistencies**
(engine/star.js, engine/planet.js, engine/moon.js,
engine/moon/orbit.js, engine/moon/tides.js, ui/climatePage.js,
ui/populationPage.js, ui/tectonicsPage.js, ui/moonPage.js,
ui/planet/inputRender.js, ui/planetPage.js, ui/calendar/stateModel.js,
ui/visualizer/snapshotModel.js, engine/worldSnapshot.js,
tests/star.test.js, tests/planet.test.js, tests/moon.test.js,
tests/planetInputRender.test.js, tests/worldFixtureHelpers.js,
tests/worldSnapshot.test.js, TODO.md)

Clamped the evolved-star metallicity track to the physically stable range
used by the Hurley/Tout polynomials so near-solar evolved stars no longer
produce impossible negative radii at high `[Fe/H]`. The rocky-planet CMF
auto-suggestion path now reads the actual host-star metallicity instead of
silently behaving as if every star were solar metallicity.

Moon orbital-fate handling was also corrected so retrograde moons migrate
inward as expected and small cohesive moons are no longer forced outward
to a fluid Roche limit before the fate calculation runs. Related UI paths,
snapshots, and calendar/visualizer helpers now pass star metallicity
through consistently. The Planet page also now defaults its greenhouse UI
to manual mode when no mode is set, and the rotation tooltip clarifies
that day length refers to the current sidereal day.

**Tests** (tests/star.test.js, tests/planet.test.js, tests/moon.test.js,
tests/planetInputRender.test.js, tests/worldSnapshot.test.js)

- Added regressions for evolved-star metallicity stability, CMF metallicity
  auto-scaling, Phobos/Triton-style moon-fate edge cases, rocky-form
  greenhouse defaults, and snapshot parity for metallicity-aware planet
  calculations

### Planet Page Route Resilience

**Hardened the planet route against incomplete slider/input DOM pairs**
(ui/bind.js, ui/planetPage.js, tests/inputDraftStability.ui.test.js)

The shared number-and-slider binder now fails closed when a page ends up
with an incomplete input pair instead of crashing the entire route. The
Planet page's CMF path was also hardened so mixed or partial render
states no longer throw during initialization if the slider control is
missing.

**Tests** (tests/inputDraftStability.ui.test.js)

- Added regressions for missing slider bindings and for Planet-page init
  with a missing CMF slider

### Tectonics Input Focus

**Stopped tectonics input fields from dropping focus on click**
(ui/tectonicsPage.js, tests/inputDraftStability.ui.test.js)

Fixed the active mountain-range card selection flow so clicking into a
number field no longer triggers a full page rerender before typing can
begin. Selecting a range card now updates the selected state and outputs
panel without rebuilding the input DOM, which keeps the tectonics text
inputs focused and editable.

**Tests** (tests/inputDraftStability.ui.test.js)

- Added a regression covering clicks into active-range inputs to ensure
  focus is preserved and edits still update the selected range

### Release Cache Busting

**Hardened release updates against stale cached HTML and entry assets**
(index.html, app.js, scripts/build.mjs, README.md, RELEASE_CHECKLIST.md)

The production build now keeps release-busted URLs for `themeBoot.js`,
`styles.css`, and `app.js` instead of stripping them back to stable
paths. The app shell also now probes the live `index.html` release
marker on startup and performs a one-time reload to a fresh document URL
when the running app version is older than the deployed release.

This does not clear user storage, but it makes stale cached entry assets
much less likely to strand users on an older release after a deploy.

## 1.21.0 — 2026-03-08

### Navigation Lock Toggle

**Added a desktop nav lock button in the sidebar footer**
(index.html, app.js, styles.css, tests/appStorageUi.ui.test.js)

Added a padlock control next to the theme toggle that pins the desktop
sidebar open until it is explicitly unlocked. The lock state now
persists in local storage, the button hides whenever the sidebar is in
its collapsed rail state, and locked navigation no longer auto-collapses
on outside clicks or route changes.

**Tests** (tests/appStorageUi.ui.test.js)

- Added app-shell regression coverage for expand, lock, route-click,
  unlock, and collapse behavior

### Input Stability and Mobile Editing

**Stabilized moon, planet, and star input editing**
(ui/bind.js, ui/moonPage.js, ui/planetPage.js, ui/starPage.js,
tests/inputDraftStability.ui.test.js, .gitignore)

Reworked the shared number-and-slider binding so draft numeric text is
no longer treated as committed state on every `input` event. Empty or
partial edits now remain in the field while the user is typing, invalid
blur restores the last committed value, and slider interactions still
commit immediately.

The Star page now keeps typed drafts local while editing instead of
writing sanitized or clamped values back into focused controls on every
keystroke. The Moon page no longer reloads its editor on raw text
entry, and the Planet page's rocky and gas-giant numeric controls now
commit on change instead of every keypress. This removes the focus and
caret churn users were reporting, especially on mobile keyboards.

**Tests** (tests/inputDraftStability.ui.test.js)

- Added regression coverage for shared numeric draft handling and for
  commit behavior on the Star, Moon, and Planet pages

### Persistence Recovery and Write-path Hardening

**Made unreadable saves visible, recoverable, and cheaper to persist**
(ui/store.js, ui/store/persistenceBridge.js, ui/worldStorage.js,
app.js, index.html, styles.css, tests/storeLoadFailure.test.js,
tests/worldStorage.test.js, tests/appStorageUi.ui.test.js,
tests/browser/smoke.spec.js)

Completed the persistence-hardening follow-up by distinguishing missing
state from unreadable saved state, surfacing storage and load failures
in the main UI, and adding a recovery path that clears only the broken
current save while preserving backups for restore. The app now exposes a
durable alert/recovery flow instead of silently falling back to a fresh
default world when stored data cannot be parsed or migrated.

The storage write path was also tightened so normal current-world saves
no longer rewrite the entire backup history. Backup persistence is now
incremental, restore behavior remains durable, and IndexedDB/localStorage
fallback coverage was expanded around the new save and recovery flow.

**Tests** (tests/storeLoadFailure.test.js, tests/worldStorage.test.js,
tests/appStorageUi.ui.test.js, tests/browser/smoke.spec.js)

- Added direct regression coverage for unreadable-save detection,
  backup-preserving reset, storage-recovery UI, and backup persistence
  durability

### Remaining Safer-DOM Follow-Up

**Finished the last user-influenced DOM cleanup on the targeted pages**
(ui/climatePage.js, ui/tectonicsPage.js, ui/starPage.js,
ui/outerObjectsPage.js, ui/scienceVisualiserPage.js,
tests/pageDomSafety.ui.test.js)

Completed the planned safer-DOM follow-up on the remaining high-risk
surfaces called out after the earlier render splits. User-influenced
selectors, summaries, search results, and inspector/detail surfaces on
the Climate, Tectonics, Star, Outer Objects, and Science Visualiser
pages were moved off string-built dynamic markup and onto explicit
DOM-safe rendering paths.

This narrows the remaining `innerHTML` usage on those pages to static
shells or tightly controlled internal fragments rather than the main
edited or imported data path.

**Tests** (tests/pageDomSafety.ui.test.js)

- Added hostile-string regressions covering the migrated climate,
  tectonics, star, outer-objects, and science-visualiser surfaces

### Targeted Test Expansion

**Added direct seam tests for the newest extracted modules and recovery UI**
(ui/visualizer/inputBindings.js, tests/visualizerInputBindings.test.js,
tests/appStorageUi.ui.test.js, tests/pageDomSafety.ui.test.js)

Finished the implementation-plan test-expansion pass by adding direct
coverage for the extracted visualizer input-binding layer and for the
new storage-error and unreadable-save recovery UI. These behaviors are
now guarded by focused tests rather than relying only on browser smoke
or broader end-to-end coverage.

This keeps the recently extracted modules honest at the seam level and
raises confidence that later refactors to the visualizer controls,
storage alerts, and recovery overlay will fail in a local test before
they regress the built app.

**Tests** (tests/visualizerInputBindings.test.js,
tests/appStorageUi.ui.test.js, tests/pageDomSafety.ui.test.js)

- Added focused control-binding, recovery-UI, and DOM-safety regression
  coverage for the newest extracted seams

### Runtime and Dependency Alignment

**Bundled critical runtime dependencies and aligned shipped versions**
(package.json, package-lock.json, index.html, themeBoot.js,
ui/runtimeDeps.js, ui/vendor/, ui/threeBridge2d.js,
ui/legacyXlsxImport.js, ui/sciencePage.js, ui/lessonsPage.js,
ui/katexLoader.js, scripts/runtime-deps.config.mjs,
scripts/check-runtime-deps.mjs, scripts/build.mjs, assets/vendor/)

Moved Three.js, XLSX, KaTeX, and related runtime assets onto bundled or
repo-local delivery paths so the browser no longer depends on live CDN
imports for critical functionality. Theme bootstrapping was extracted
from inline HTML into a dedicated script, runtime dependency checks were
added to guard against version drift, and the release build now emits
only the files needed at runtime.

### Security and Import Hardening

**Hardened the browser runtime and large import paths**
(index.html, themeBoot.js, ui/importSafety.js,
ui/importExportPage.js, ui/legacyXlsxImport.js,
tests/importSafety.test.js, tests/importExportPage.ui.test.js,
tests/calendarPage.data.ui.test.js, tests/planetBodySelector.test.js)

Reduced remote execution exposure, tightened browser-side import
validation, and added regression coverage around hostile or oversized
inputs. Import flows now fail with clearer user-facing errors instead of
attempting to parse unsafe payloads unchecked on the main thread.

### UI Module Decomposition

**Split large UI controllers into smaller shared modules**
(ui/calendar/, ui/visualizer/, ui/planet/, ui/calendarPage.js,
ui/visualizerPage.js, ui/planetPage.js, tests/calendarIo.test.js,
tests/visualizerScaleMath.test.js, tests/planetBodySelector.test.js)

Refactored the heaviest page controllers by extracting shared constants,
math helpers, selectors, rendering helpers, tutorials, and import/export
logic into focused submodules. The router-facing page entry points stay
stable, but the code is easier to test, reason about, and extend.

### Persistence and Data Safety

**Moved primary world persistence to IndexedDB with safer saves**
(ui/worldStorage.js, ui/store.js, app.js, ui/aboutPage.js,
ui/importExportPage.js, README.md, tests/worldStorage.test.js,
tests/importExport.test.js, tests/planetStore.test.js,
tests/calendarPage.ui.test.js, tests/calendarPage.data.ui.test.js)

Introduced IndexedDB-backed world and backup storage with migration from
legacy localStorage saves, while keeping localStorage for lightweight
preferences and boot markers. Save behavior is now debounced and the app
waits for storage readiness at startup so large worlds do not block or
corrupt the UI as data grows.

### Release Confidence

**Added browser smoke tests, release verification, and CI gating**
(tests/browser/smoke.spec.js, playwright.config.js,
scripts/serve-dist.mjs, package.json, RELEASE_CHECKLIST.md,
.github/workflows/ci.yml)

Added a Playwright smoke suite covering production boot, import/export,
visualizer load, and fallback behavior against the built app. The
project now includes a release checklist, a single `npm run
release:verify` command, and CI gates that exercise the main static-app
release path before shipping.

### Bundle and Delivery Performance

**Reduced initial bundle weight and enforced a bundle budget**
(app.js, scripts/build.mjs, scripts/check-bundle-budget.mjs,
package.json, README.md)

Lazy-loaded the heaviest routes, trimmed the production artifact set,
and added an automated budget check for release builds. The entry bundle
dropped from roughly 3.0 MB to about 491 KB, with the largest lazy chunk
around 698 KB after the route split.

### Encoding Integrity

**Repaired mojibake corruption and added automated detection**
(engine/planet.js, ui/planetPage.js, ui/starPage.js, ui/systemPage.js,
tests/planet.test.js, scripts/check-mojibake.mjs,
tests/mojibakeCheck.test.js)

Repaired corrupted unit and symbol strings across the affected engine,
UI, and test files, then added a repo-wide mojibake check to the main
verification pipeline so future encoding regressions fail quickly.

### Store and Persistence Completion

**Finished the store split and hardened import and save boundaries**
(ui/store.js, ui/store/worldSchema.js, ui/store/systemCollections.js,
ui/store/gasGiantModel.js, ui/store/bodyMutations.js,
ui/store/worldMigration.js, ui/store/persistenceBridge.js,
ui/store/importValidation.js, ui/store/deepMerge.js,
ui/worldStorage.js, tests/importSanitization.test.js,
tests/worldMigration.test.js, tests/persistenceBridge.test.js,
tests/bodyMutations.test.js, tests/storeSystemFacade.test.js,
tests/worldStorage.test.js)

Closed the remaining store-side remediation work by reducing `ui/store.js`
to a thin compatibility facade and moving schema defaults, collection
helpers, gas-giant model behavior, mutations, migration orchestration,
merge hardening, and persistence bridging into dedicated modules.
Recursive reserved-key import sanitization now rejects or strips hostile
`__proto__`, `constructor`, and `prototype` payloads before imported
world data is normalized into app state.

Persistence follow-up also added lifecycle flushes for pending writes on
page hide, unload, and hidden-document transitions, so large saves and
backup updates are less likely to be dropped when the browser tab is
closed or backgrounded.

**Tests** (tests/importSanitization.test.js, tests/worldMigration.test.js,
tests/persistenceBridge.test.js, tests/bodyMutations.test.js,
tests/storeSystemFacade.test.js, tests/worldStorage.test.js)

- Added regression coverage for reserved-key imports, world migration,
  persistence bridge behavior, extracted body mutations, store facade
  wiring, and lifecycle save flushing

### Rendering Hygiene Completion

**Moved the remaining user-influenced UI rendering onto DOM-safe paths**
(ui/domHelpers.js, ui/importExportPage.js, ui/calendarPage.js,
ui/planetPage.js, ui/planet/domRender.js, ui/planet/outputRender.js,
ui/planet/inputRender.js, ui/apparentPage.js, ui/moonPage.js,
ui/systemPage.js, ui/localClusterPage.js, ui/sciencePage.js,
tests/calendarPage.data.ui.test.js, tests/planetDomRender.test.js,
tests/planetOutputRender.test.js, tests/planetInputRender.test.js,
tests/apparentDomRender.test.js, tests/moonDomRender.test.js,
tests/systemDomRender.test.js, tests/localClusterDomRender.test.js,
tests/scienceDomRender.test.js)

Completed the safer-DOM rollout across the remaining high-risk UI
surfaces. Selectors, KPI cards, tables, overlays, recipe pickers,
detail panels, output summaries, and the final rocky and gas-giant
input-form shells were moved off string-built HTML onto DOM-construction
helpers and page-local render modules.

As a result, the remaining `innerHTML` usage is now limited to static
route shells, mount clearing, or tightly controlled internal fragments
rather than the main user-facing render path for imported or edited
world data.

**Tests** (tests/calendarPage.data.ui.test.js,
tests/planetDomRender.test.js, tests/planetOutputRender.test.js,
tests/planetInputRender.test.js, tests/apparentDomRender.test.js,
tests/moonDomRender.test.js, tests/systemDomRender.test.js,
tests/localClusterDomRender.test.js, tests/scienceDomRender.test.js)

- Added hostile-string and DOM-render regressions for the migrated
  calendar, planet, apparent, moon, system, local-cluster, and science
  surfaces

### Verification and Delivery Hardening

**Made release verification deterministic and expanded production smoke**
(playwright.config.js, scripts/build.mjs, scripts/backup-live.mjs, scripts/dev.mjs,
scripts/serve-dist.mjs, scripts/check-bundle-budget.mjs,
tests/browser/smoke.spec.js, README.md, IMPLEMENTATION_PLAN.md)

Separated development and production output so local `npm run dev` no
longer interferes with Playwright or release verification. Development
work now builds into `dist-dev/`, release verification uses a dedicated
production server, and release builds emit machine-readable summary
data for bundle checks.

The production smoke suite was expanded to cover legacy storage
migration, IndexedDB fallback, hostile and oversized import rejection,
backup restore after repeated imports, lazy-route loading, calendar
export, legacy XLSX import, and visualizer control interactions. This
closed the earlier nondeterministic browser-smoke failure mode while
adding broader end-to-end coverage to the shipped static build.

The live backup archive now also includes `themeBoot.js`, closing a
release-packaging gap in the boot path for source-root deployments and
recovery snapshots.

**Tests** (tests/browser/smoke.spec.js)

- Expanded Playwright smoke coverage for import flows, storage
  resilience, route loading, exports, XLSX import, and visualizer
  controls in the production bundle

### Visualizer Interaction Follow-Up

**Extracted visualizer input and event-binding orchestration**
(ui/visualizerPage.js, ui/visualizer/inputBindings.js,
tests/browser/smoke.spec.js)

Finished the planned visualizer follow-up by moving pointer, wheel,
touch, toolbar, cluster-control, and cross-tab refresh listeners out of
`ui/visualizerPage.js` and into a dedicated binding module. The page now
acts more cleanly as the visualizer orchestration shell while the
interaction layer evolves independently.

This keeps the visualizer in a better position for future mechanics
work, where renderer and state changes are likely to continue but the
page controller should not grow back into a single interaction-heavy
file.

**Tests** (tests/browser/smoke.spec.js)

- Extended browser smoke to verify the controls dropdown, help overlay,
  and play/pause behavior on the built visualizer route

### Runtime Cleanup and Repository Hygiene

**Removed residual runtime footguns and cleaned generated artifacts**
(ui/aboutPage.js, ui/canvasExport.js, .gitignore, .rgignore,
tests/aboutPage.ui.test.js, tests/canvasExport.test.js)

Removed the dead remote GIF-export fallback, fixed the About-page
changelog modal's leaked keydown listener, and added ignore rules so
`dist-dev/` no longer pollutes Git status or broad source searches.
These changes were small individually, but they removed several sources
of verification noise and reduced maintenance friction after the larger
refactor pass.

**Tests** (tests/aboutPage.ui.test.js, tests/canvasExport.test.js)

- Added focused runtime regressions for changelog modal cleanup and local
  GIF export behavior

## 1.20.0 — 2026-03-06

### Engine Snapshot and Regression Foundation

**Added canonical fixture worlds and a world-level engine snapshot**
(engine/worldSnapshot.js, engine/worldAdapters.js,
tests/engineWorldFixtures.test.js, tests/worldSnapshot.test.js,
tests/worldSnapshotParity.test.js, tests/worldAdapters.test.js)

Added a fixture-driven regression layer covering six representative
worlds, then used it to introduce `buildWorldSnapshot(world, options)`
as the engine's canonical composition boundary. The snapshot layer now
derives stars, systems, rocky planets, gas giants, moons, lookup maps,
and orbit-ordered body lists from one pure engine path instead of
relying on page-local assembly.

Read-only UI consumers were moved onto the snapshot/adapters layer in
stages. Import/export preview, System poster inputs, and Apparent-page
body tables now consume consistent engine-derived world views instead of
rebuilding overlapping composition logic independently.

**Tests** (tests/engineWorldFixtures.test.js, tests/worldSnapshot.test.js,
tests/worldSnapshotParity.test.js, tests/worldAdapters.test.js)

- Added canonical fixture worlds for Sol-like, M-dwarf habitable,
  gas-giant-heavy, icy-moon-system, eccentric-extremes, and
  thin-atmosphere-edge cases
- Added fixture invariants, golden-output regression checks, snapshot
  contract coverage, summary/full parity checks, and adapter parity
  coverage

### Engine Modularisation and Shared Physics Kernels

**Split the largest engine calculators and centralized shared physics**
(engine/planet.js, engine/gasGiant.js, engine/moon.js,
engine/planet/, engine/gasGiant/, engine/moon/, engine/physics/)

Split the three largest body calculators behind stable public facades:
`calcPlanetExact`, `calcGasGiant`, and `calcMoonExact` now delegate to
smaller concern-specific modules for composition, orbit, temperature,
atmosphere, magnetism, tectonics, rings, tides, retention, and related
subsystems. This reduced the maintenance burden of the engine without
changing the top-level API surface used by the rest of the app.

Shared scientific logic was then consolidated into dedicated physics
modules. Radiative, orbital, escape, materials, and rotation helpers
now live under `engine/physics/`, replacing repeated local formulas and
literal unit conversions across the planet, moon, gas giant, system,
debris-disk, and apparent-model code paths.

**Tests** (tests/planet.test.js, tests/gasGiant.test.js,
tests/moon.test.js, tests/physicsRadiative.test.js,
tests/physicsOrbital.test.js, tests/physicsEscape.test.js,
tests/physicsMaterials.test.js, tests/physicsRotation.test.js)

- Added direct seam tests for extracted planet, gas giant, and moon
  modules
- Added dedicated shared-physics regression suites for radiative,
  orbital, escape, materials, and rotation helpers

### Cross-Model Validation Expansion

**Added integration-level validation across composed engine chains**
(tests/crossModelHelpers.js, tests/crossModelClimate.test.js,
tests/crossModelMoonSystems.test.js, tests/crossModelApparent.test.js,
tests/crossModelCalendar.test.js)

Expanded the validation strategy from module-level correctness to
whole-world consistency. The test suite now checks climate chains,
gas-giant-to-moon propagation, apparent outputs, calendar basis values,
and snapshot parity against the canonical fixture worlds, so changes in
composition logic fail with labeled fixture and subsystem context before
they reach the UI.

This materially raises trust in the engine as a single scientific system
rather than a loose collection of calculators. Snapshot and downstream
consumer regressions are now tied back to upstream star/system/body
inputs in one shared validation harness.

**Tests** (tests/crossModelClimate.test.js,
tests/crossModelMoonSystems.test.js, tests/crossModelApparent.test.js,
tests/crossModelCalendar.test.js)

- Added cross-model fixture harness and validation matrix
- Added climate, moon-system, apparent, and calendar integration suites

### Performance and Incremental Evaluation

**Made summary evaluation materially cheaper and budgeted read-only consumers**
(scripts/profile-engine.mjs, engine/worldSnapshot.js,
engine/worldAdapters.js, ui/apparentPage.js, ENGINE_PHASE6_BASELINE.md)

Added a repeatable profiling harness, then reshaped snapshot evaluation
so `mode: "summary"` derives only the fields summary consumers need
instead of computing full body models and trimming them afterward.
Request-local star/system context reuse and moon-parent override reuse
were added inside snapshot-driven flows, and guided System poster mode
was reduced from a full-snapshot prepass to a star/system-only prepass
plus one poster snapshot build.

The measured improvement is substantial on representative fixtures. In
the checked-in Phase 6 baseline, `sol-like` `snapshot:summary` dropped
from 4.625 ms to 0.606 ms, while
`adapter:systemPoster:guided` dropped from 9.460 ms to 4.481 ms. Import
/export preview and Apparent-page selector flows now use explicit
summary-mode budgets, while full-detail consumers remain on the full
path intentionally.

**Tests** (tests/worldSnapshot.test.js, tests/worldAdapters.test.js)

- Added structural guardrails for summary/full mode expectations
- Added context-reuse and consumer-budget assertions alongside the
  profiler baseline

### Methane Greenhouse Coefficient Recalibration

**Corrected CH₄ radiative forcing coefficient**
(engine/planet/atmosphere.js, ui/sciencePage.js)

The methane greenhouse coefficient `GH_CH4_COEFF` was 0.085, producing a
CH₄/CO₂ forcing ratio of only 2.1% at Earth-like conditions — well below
the 10–15% ratio from NASA GISS attribution data (Schmidt et al. 2010).
The coefficient was originally back-fitted to Titan's _net effective_ τ
(≈ 0.97), which conflated haze anti-greenhouse cooling with raw optical
depth and suppressed methane's contribution everywhere else.

Raised the coefficient to 0.45. At Earth conditions (1 atm, 0.042% CO₂,
0.00019% CH₄) the CH₄/CO₂ ratio is now 11.1% and CH₄/total is 2.7%,
both within NASA GISS targets. The Titan-like test case now validates
against raw thermal IR optical depth (τ ≈ 5.1, within the 3–6 range from
McKay et al. 1991 and Lorenz et al. 1997) rather than the haze-reduced
net value. The functional forms (√ for CH₄, ln for CO₂) remain unchanged
and match standard IPCC parameterizations (Myhre et al. 1998).

| Scenario              | Old (0.085) | New (0.45) | Target             |
| --------------------- | ----------- | ---------- | ------------------ |
| CH₄/CO₂ ratio (Earth) | 2.1%        | 11.1%      | 10–15% (NASA GISS) |
| CH₄/total (Earth)     | 0.5%        | 2.7%       | 2–3% (NASA GISS)   |
| Titan raw τ           | 0.97        | 5.14       | 3–6 (McKay/Lorenz) |

**Tests** (tests/greenhouse.test.js)

- Updated Titan-like test: expects raw τ ≈ 5.14 ± 0.3 instead of net
  τ ≈ 0.97 ± 0.05

**References**

- Schmidt, G. A. et al. (2010), "Attribution of the present-day total
  greenhouse effect", J. Geophys. Res. 115, D20106
- Myhre, G. et al. (1998), "New estimates of radiative forcing due to
  well mixed greenhouse gases", Geophys. Res. Lett. 25(14), 2715–2718
- McKay, C. P. et al. (1991), "The greenhouse and antigreenhouse effects
  on Titan", Science 253, 1118–1121
- Lorenz, R. D. et al. (1997), "Titan's atmosphere and surface
  temperature", Planet. Space Sci. 45, 981–992

### WebGL Route Cleanup

**Explicit page disposal for route transitions**
(app.js, ui/systemPage.js, ui/systemPosterNativeThree.js,
ui/celestialVisualPreview.js, ui/visualizerPage.js)

Leaving the Planetary System page could leak stale system-poster render work into the next route. Both `#/system → #/cluster` and `#/system → #/viz` emitted two `texImage3D` warnings per transition, while control paths such as `#/apparent → #/viz` stayed clean. That isolated the fault to System page teardown rather than general WebGL initialisation.

The router now runs explicit page cleanup before replacing `#app`, and the System and Visualiser pages return real disposal functions instead of relying only on post-removal `MutationObserver` cleanup. System poster texture pre-warming and snapshot rendering also gained cancellation guards so abandoned work stops before uploading textures into a renderer that is no longer current. In Brave retests, the warning count dropped from 2 per transition to 0 across 3 repeated `system → cluster` runs and 3 repeated `system → viz` runs.

**Tests** (manual browser walkthrough, npm scripts)

- `npm run lint`
- `npm run check:syntax`
- `npm test`
- Manual Brave retest: `system → cluster` ×3, `system → viz` ×3,
  `apparent → viz` ×2 control; all produced zero WebGL warnings after the fix.

## 1.19.0 — 2026-03-05

### Collapsible Sidebar Navigation

**Single-sidebar navigation with icon rail and mobile drawer**
(index.html, styles.css, app.js, STYLE_GUIDE.md)

Replaced the dual-nav design (horizontal top nav + sidebar) with a
single collapsible sidebar. The top nav is removed entirely.

- **Desktop:** sidebar starts collapsed as a 52px icon-only rail. Click
  the rail to expand to full 240px width with text labels; click outside
  or click a nav link to collapse back. A `»` chevron hint at the bottom
  indicates the rail is expandable.
- **Mobile (≤ 980px):** sidebar is fully off-screen (no collapsed rail).
  A hamburger button in the header opens it as a fixed drawer with a
  backdrop overlay. Tapping a link, the backdrop, or pressing Escape
  closes the drawer.
- Brand mark and title moved to sidebar top; version tag, splash toggle,
  and theme toggle moved to sidebar footer. Footer controls hidden when
  collapsed.
- Nav items reorganised into six semantic groups: Cosmos, Bodies,
  Surface, Time & Light, Tools, and ungrouped utilities (Import/Export,
  About).
- New blackboard-style SVG icon for the Science Visualiser page
  (`assets/icons/science-viz.svg`).
- "Apparent Size & Brightness" renamed to "Apparent Size" in the nav
  and page title.

### Light Mode Overhaul

**Paper Dashboard colour palette and theme-aware icons**
(styles.css, index.html, ui/aboutPage.js, assets/icons/)

Replaced the grey light theme with a warm-cream palette derived from the
Paper Dashboard scheme (E1DADE / 88C6E8 / 369AEC / EAAB54 / 37455E).

- New light palette: warm cream background (`#e1dade`), lighter cream
  panels (`#ede9e7`), dark slate text (`#37455e`), bright blue accent
  (`#369aec`), golden amber warnings.
- Created 18 light-mode icon variants in `assets/icons/light/` with
  darkened, saturated colours designed for the cream background. CSS
  swaps icons per-class via `[data-theme="light"]` selectors, replacing
  the previous `filter: brightness()` hack.
- Light-mode favicon (`favicon-light.svg`) with cream background, blue
  planet, and amber moon.
- Inline `<script>` in `<head>` reads theme from localStorage before
  first paint, eliminating the dark-to-light flash on page load.
- Sidebar starts with `is-collapsed` class in the HTML to prevent the
  expanded-to-collapsed flash on load.
- Star visualiser KPI text shadow overridden in light mode (white glow
  instead of heavy black shadow).
- Other Objects icon redesigned from gas giant to comet + debris
  fragments (both dark and light variants).
- Discord invite link added to the sidebar footer with the official
  Blurple icon.
- Changelog moved from inline About page content to a modal toast
  overlay with collapsible `<details>` releases; latest release starts
  expanded.

### Schweitzer M-dwarf Radius

**Schweitzer et al. (2019) linear MRR for low-mass stars** (engine/star.js)

Replaced the Eker (2018) quadratic below 0.5 Msol with the Schweitzer
et al. (2019, A&A 625, A68) linear relation `R = 0.0282 + 0.935 M`,
calibrated from 55 eclipsing M-dwarf binaries (0.09–0.6 Msol). A smooth
linear blend over 0.5–0.7 Msol ensures continuity with the Eker
quadratic.

- Added Schweitzer linear branch for M ≤ 0.5 Msol.
- Added blend zone (0.5–0.7 Msol) interpolating Schweitzer → Eker.
- Low-mass benchmark RMSE improves (Proxima Cen, Barnard's Star).
- Updated Science & Maths page, Lesson 1, and Star page tooltip.

### L4/L5 Stability (Gascheau Criterion)

**Gascheau (1843) stability flag for Trojan points** (engine/lagrange.js)

L4 and L5 Lagrange points are now flagged as stable or unstable based on
the Gascheau criterion: μ = m/(m + M★) < (1 − √69/9)/2 ≈ 0.0385.

- `calcLagrangePoints` returns `stability: { mu, muCrit, l45Stable }`
  and `stable` booleans on L4/L5 point objects.
- Visualiser shows unstable Trojans as dimmed amber diamonds instead of
  cyan.
- Science page formula updated with the exact Gascheau criterion.

### Updated Giant Planet Occurrence Probability

**Kepler-era baseline + stellar mass dependence** (engine/star.js)

Updated `giantPlanetProbability` from the Fischer & Valenti (2005)
metallicity-only formula to include stellar mass scaling from
Johnson et al. (2010) and a revised 7% baseline from Kepler-era
surveys.

- Formula: `P = clamp(0.07 × M★ × 10^(2·[Fe/H]), 0, 1)`.
- Optional `massMsol` parameter (defaults to 1.0 for backwards
  compatibility).
- `calcStar` now passes stellar mass to the probability function.
- Updated tooltips, Science & Maths page, Lessons 7 and 19, and
  science graph (new `stellar_mass → giant_planet_probability` edge).

---

## 1.18.1 — 2026-03-05

### Improved Mass-Radius Relation

**Eker (2018) MRR breakpoint correction** (engine/star.js)

Extended the Eker et al. (2018) quadratic mass-radius relation from its
previous 1.0 Msol breakpoint to the paper's full calibration range of
1.5 Msol (Table 5). Above 1.5 Msol the Demircan & Kahraman (1991) power
law is replaced by a Stefan-Boltzmann derivation using the Eker
mass-luminosity and mass-temperature relations, with a normalisation
factor for exact continuity at the boundary.

- Added `massToTeff()` — Eker (2018) mass-temperature relation for
  M > 1.5 Msol.
- Changed `massToRadius()` breakpoint from 1.0 to 1.5 Msol.
- Replaced `M^0.57` (Demircan & Kahraman 1991) with
  `R = √L × (5776/T)² × norm` (Stefan-Boltzmann from Eker MLR + MTR).
- RMSE against 17 benchmark stars drops from ~28% to ~18%.
- Updated Science & Maths page formulas, Lesson 1 text, and Star page
  tooltip.

---

## 1.18.0 — 2026-03-04

### Calendar Page UX Redesign

**Toolbar + drawer layout** (ui/calendarPage.js, styles.css)

Restructured the calendar page from a fixed two-column layout into a
toolbar + closable drawer pattern. The calendar grid is now the primary
view, filling the full width when the drawer is closed.

- Persistent toolbar holds profile management, calendar name, basis
  selector, and month/year navigation.
- Drawer contains four tabs: **Structure**, **Identity**, **Rules**,
  and **Output**, consolidating the previous 8 collapsible panels.
- Rules tab uses sub-tabs (Holidays, Festivals, Leap Years, Cycles)
  with a list-first pattern — item lists appear above forms, with
  forms revealed on Add/Edit.
- Drawer pushes the calendar right on wide screens (>980px) and
  overlays with a backdrop on narrow screens.
- Derived orbital data wrapped in a collapsible `<details>` element.

**Sidereal → solar day conversion** (ui/calendarPage.js)

The planet model stores sidereal rotation period (star-to-star), but
a calendar day is a solar day (noon-to-noon). Added conversion before
passing rotation to the calendar engine:
`solarDay = 1 / (1/sidereal − 1/orbital)`. For Earth this corrects
23.934 h (sidereal) → 24.0 h (solar), producing the correct 365-day
common year instead of the previous erroneous 366.

**Structure readout accuracy** (ui/calendarPage.js)

The "Last month" readout previously used a naive formula
(`daysPerMonth + yearlyIntercalary`) that ignored active leap rules.
Replaced with a call to `getMonthLengthsForYear()` so the displayed
month length accounts for leap-rule adjustments (e.g. the Sol preset's
Gregorian month-shape rules that redistribute intercalary days).

**Tests** (tests/calendarPage.ui.test.js, tests/calendarPage.data.ui.test.js)

- Added test: Sol preset Earth sidereal rotation produces 365-day
  common year.
- Updated derived-data readout regex to match new format showing
  sidereal rotation and solar day.

### Tutorials on Every Page

**Shared tutorial module** (ui/tutorial.js, styles.css)

Added a reusable tutorial toast panel system. Each interactive page now
has a "Tutorials" button in its header that opens a step-by-step guide
anchored to the bottom-right of the viewport. Position and open state
persist across sessions via localStorage.

- Created `ui/tutorial.js` — shared `createTutorial()` factory handling
  panel DOM, state persistence, navigation, and Escape-key dismissal.
- Renamed CSS from `.cal-tutorial` to `.ws-tutorial` (generic). Added
  `.ws-tutorial-trigger` class for the header button.
- Refactored the Calendar page to use the shared module (~80 lines of
  inline tutorial code removed).

**Page tutorials added** (13 pages total)

| Page              | Steps | Key topics                                        |
| ----------------- | ----- | ------------------------------------------------- |
| Star              | 5     | Mass/age, evolution, physics mode, outputs        |
| Planetary System  | 5     | Orbit spacing, drag-and-drop, system poster       |
| Planets           | 8     | Rocky/gas giant, atmosphere, tectonics, recipes   |
| Moons             | 5     | Orbit, tidal system, composition, recipes         |
| Other Objects     | 4     | Debris disks, suggest feature, derived properties |
| System Visualiser | 5     | Navigation, display options, animation, export    |
| Local Cluster     | 5     | Seed, editing systems, galactic context, census   |
| Import/Export     | 4     | Export, import, presets                           |
| Apparent Size     | 4     | Sky canvas, object tables, phase functions        |
| Calendar          | 8     | Structure, identity, rules, output (existing)     |
| Tectonics         | 5     | Mountain types, ocean, volcanoes, plate canvas    |
| Climate Zones     | 4     | Latitude bands, zone details, altitude            |
| Population        | 5     | Tech era, growth, land use, distribution          |

Pages that re-render via `innerHTML` (Tectonics, Climate, Population)
host the tutorial panel on `document.body` with event delegation and
MutationObserver cleanup.

**Style guide updated** (STYLE_GUIDE.md)

Documented both integration patterns (standard and re-rendering pages)
with code examples, updated component inventory and HTML layout template.

### Live-Update Inputs

**Removed Apply buttons from Star, Moon, System, and Calendar pages**
(ui/starPage.js, ui/moonPage.js, ui/systemPage.js, ui/calendarPage.js)

All input fields now live-update immediately on keystroke or slider drag,
matching the existing behaviour on Planet, Climate, Population, Tectonics,
Apparent, and Outer Objects pages. The Local Cluster page retains its
Apply button because regenerating the cluster discards manual star-system
edits.

Star page radio groups (physics mode, evolution mode, derivation mode)
also trigger immediate recalculation. Enter-key shortcuts removed (no
longer needed).

Calendar page splits live-update into two concerns: source-object selects
reset the calendar view position (month index, selected day), while
numeric sliders and the rounding toggle re-render without resetting the
view.

**Tests** (tests/calendarPage.data.ui.test.js)

- Updated rounding tests to dispatch `input`/`change` events instead of
  clicking the removed Apply button.

### Bug Fixes

- Fixed `dataTable()` call in Science page moon volatile retention section
  that passed a single array-of-arrays instead of separate `headers` and
  `rows` arguments, crashing the page on load (ui/sciencePage.js:913).
- Fixed calendar rounding toggle not immediately enabling the decimal
  places slider — added `change` listener that toggles disabled state
  without requiring Apply (ui/calendarPage.js).

### Calendar Structure Controls

Replaced the three "weeks per month" sliders (Solar/Lunar/Lunisolar) with
two direct inputs: **Days per month** and **Days per week**. Both default
to physics-derived values (null = auto) and cascade: changing months/year
recalculates days/month if auto, which recalculates days/week if auto.

A new **structure readout** below the inputs shows weeks per month,
monthly intercalary days, calendar year length, and drift vs orbital year
(with a warning when drift exceeds 10%).

Engine simplified from three `solarWeeksPerMonth` / `lunarWeeksPerMonth` /
`lunisolarWeeksPerMonth` parameters to a single `weeksPerMonth`
(engine/calendar.js). Preset calendars updated (Sol, Arrakis, Realmspace).

### CSS

- Adjusted `.physics-duo-toggle` radio hit target (`left: 0` → `1px`).
- Increased `.physics-trio-toggle` radio hit target height (30px → 50px).
- Added `#moonsList .planet-card` spacing rule (5px vertical margin).

## 1.17.1 — 2026-03-04

### Science Visualiser

**New page** (ui/scienceVisualiserPage.js, ui/scienceGraphData.js)

Interactive dependency graph mapping every scientific concept in the engine.
58 nodes across 12 thematic sections (Local Cluster, Stellar Physics, System
Layout, Interior & Composition, Atmosphere & Surface, Climate, Tectonics,
Moons & Tides, Gas Giants, Debris Disks, Population, Observing) connected
by 112 typed edges (runtime, documented, curated). Each node carries a
plain-language summary, formula, engine references, and documentation links.

Three view modes — full graph, section-filtered, and trace mode — let users
explore the model at different scales. Trace mode highlights all concepts
within a configurable hop depth of the selected node. A search bar filters by
name, tag, or description. Clicking a node opens a detail panel with its
formula, upstream/downstream connections, and links to engine source and
lessons.

**Tests** (tests/scienceGraphData.test.js, tests/scienceVisualiser.ui.test.js)

7 tests: graph data integrity checks (unique IDs, valid edge references,
required fields) and UI rendering tests.

### Climate State Classification

**Snowball / greenhouse flags** (engine/planet.js, engine/climate.js,
ui/planetPage.js, ui/climatePage.js, ui/populationPage.js,
ui/scienceGraphData.js)

Planets are now classified into one of four climate regimes based on surface
temperature and absorbed stellar flux:

| State              | Condition                        | Reference               |
| ------------------ | -------------------------------- | ----------------------- |
| Stable             | Normal regime (or dry world)     | —                       |
| Snowball           | T < 240 K with surface water     | Budyko (1969)           |
| Moist greenhouse   | T > 340 K with surface water     | Kasting (1988)          |
| Runaway greenhouse | Absorbed flux > 282 W/m² + water | Goldblatt et al. (2013) |

A new `classifyClimateState()` function checks thresholds in priority order
(runaway → moist → snowball → stable). Dry worlds are always Stable since
snowball and greenhouse feedbacks require water. The absorbed stellar flux
diagnostic (`absorbedFluxWm2`) is computed as `S × 1361 × (1 − A) / 4` and
exposed in both `derived` and `display`.

The planet page gains a Climate State KPI card (with absorbed flux in the
meta line). The climate advisory in `calcClimateZones()` now appends
regime-specific warnings for extreme states. The science visualiser adds a
`climate_state` node with five edges (from surface temperature, albedo,
insolation, and water regime; to climate zones).

**Tests** (tests/planet.test.js)

7 tests: Earth-like → Stable, cold orbit → Snowball, strong greenhouse →
Moist greenhouse, close-in orbit → Runaway greenhouse, dry cold → Stable,
absorbed flux sanity check (≈ 238 W/m² for Earth), display string validation.

### Climate State NASA Validation

**19 new tests** (tests/climateState-nasa-validation.test.js)

Validates absorbed stellar flux and climate-state classification against Solar
System reference data from NASA Planetary Fact Sheets. Five inner bodies
(Mercury, Venus, Earth, Mars, Ceres) tested in both dry and wet configurations.
Venus gets a third "primordial" test (albedo 0.3, pre-cloud-deck) confirming
runaway greenhouse. Absorbed flux values match analytical expectations within 1%.

### Calendar Derived Data Rounding Override

**Decimal places toggle** (ui/calendarPage.js)

New "Round derived data" checkbox with a 0–6 decimal places slider on the
Calendar Inputs panel. When enabled, rounds the three derived astronomical
values (planet orbital period, moon synodic period, planet rotation) before
they enter `calcCalendarModel()`. The rounded values propagate through month
lengths, leap cycles, and week structure. When disabled (default), raw engine
values pass through unmodified — preserving existing behaviour. The setting
persists per calendar profile.

**Tests** (tests/calendarPage.data.ui.test.js)

2 tests: toggle-off preserves full precision; toggle-on with 0 dp produces
whole numbers and with 2 dp produces two-decimal output.

## 1.17.0 — 2026-03-04

### New Features

- **Lessons page** (ui/lessonsPage.js, ui/lessons/) — Added a 20-lesson
  progressive curriculum covering every scientific concept in the model.
  Organised into six units (Stars, Orbits & Systems, Terrestrial Worlds,
  Giants & Moons, Surface & Climate, The Wider Universe). A global
  Basic / Advanced toggle switches between plain-language explainers and
  equation-level deep-dives with KaTeX rendering. Ten lessons include
  embedded mini-calculators backed by real engine functions.

- **Periapsis / apoapsis temperatures** (engine/planet.js, ui/planetPage.js) —
  All rocky planets with eccentricity > 0.005 now show equilibrium
  temperature at closest and farthest orbital approach alongside the
  existing periapsis/apoapsis distance readouts.

- **Volatile sublimation flags** (engine/planet.js, ui/planetPage.js) —
  Dwarf planets (mass < 0.01 M⊕) display which surface ices (N₂, CO,
  CH₄, H₂O, CO₂) can sublimate at periapsis vs apoapsis temperatures,
  flagging transient or persistent atmospheres.

- **Moon volatile inventory & atmospheric retention** (engine/moon.js,
  engine/utils.js, ui/moonPage.js) — Moons now display surface ices and
  thin volatile atmospheres. Seven species (N₂, CO, CH₄, CO₂, NH₃, SO₂,
  H₂O) are checked via density-based presence, vacuum sublimation
  threshold, Jeans escape parameter (λ > 6), and geological retention
  (escape timescale > system age). Vapor pressure estimated via
  Clausius–Clapeyron. Correctly predicts Triton's N₂ atmosphere, Io's
  SO₂ envelope, Titan's N₂ retention, Titania's lack of atmosphere
  (escape too fast), and Europa's stable water ice.

- **Atmospheric sputtering magnetopause inflation** (engine/gasGiant.js) —
  Moons with sublimation-driven volatile atmospheres (e.g. Triton's N₂)
  now contribute plasma via magnetospheric ion sputtering, inflating the
  magnetopause alongside volcanic outgassing. Includes triple-point
  filtering (ice must exist) and pressure saturation (thick atmospheres
  shield the surface). Fixes Neptune's magnetopause from 18 → 23 Rp
  (observed: 23 Rp). All four Solar System giants now match within 3%:
  Jupiter 75 Rp, Saturn 22 Rp, Uranus 18.5 Rp, Neptune 23 Rp.

- **Suggested gas giant resonance** (engine/debrisDisk.js, engine/planet.js,
  ui/planetPage.js) — All rocky planets now show the nearest mean-motion
  resonance with a system gas giant (e.g. "Neptune 3:2 (39.4 AU, 0.3%
  off)"). Checks ten resonance ratios (3:2, 2:1, 5:2, 3:1, 4:1 exterior;
  1:2, 1:3, 1:4, 2:3, 2:5 interior) within an 8% tolerance.

### Gas Giant Orbital Parameters

**Eccentricity, inclination, and axial tilt inputs** (engine/gasGiant.js,
ui/store.js, ui/planetPage.js)

Gas giants now accept three new orbital/physical parameters that bring them to
parity with rocky planets: eccentricity (0–0.99), orbital inclination
(0–180°), and axial tilt (0–180°). All three are nullable — blank means "use
default 0". Three new sliders appear under an "Orbit & Orientation" section
below metallicity.

**Derived outputs** (engine/gasGiant.js, ui/planetPage.js)

The new inputs unlock several derived quantities:

- Periapsis / apoapsis distances (only shown when e > 0.005)
- Equilibrium and effective temperatures at orbital extremes
- Insolation (stellar flux relative to Earth)
- Orbital direction (prograde / retrograde from inclination)
- Local days per year
- Spin-orbit resonance state for tidally locked eccentric giants (Goldreich &
  Peale 1966: 1:1, 3:2, 2:1, or 5:2 depending on eccentricity)
- Giant-to-giant mean-motion resonance (reuses `findNearestResonance` from
  `engine/debrisDisk.js`)

Tidal circularisation timescale now scales with the Wisdom (2004) eccentricity
dissipation factor — higher eccentricity drives faster circularisation.

`spinOrbitResonance()` was extracted from `engine/planet.js` to
`engine/utils.js` to avoid a circular dependency.

**Tests** (tests/gasGiant.test.js)

- Eccentric orbit produces correct periapsis/apoapsis distances
- Periapsis equilibrium temperature exceeds apoapsis temperature
- Circular orbit (e < 0.005) hides peri/apo display lines
- Insolation at 5.2 AU ≈ 0.037× Earth
- Inclination 0° → prograde, 150° → retrograde
- Hot Jupiter at 0.03 AU with e = 0.15 → tidally locked in 3:2 spin-orbit
- Circularisation timescale decreases with higher eccentricity
- Giant-to-giant 5:2 resonance detected (Jupiter at 5.2 AU, test body at 8.25 AU)
- No other giants → null resonance
- Axial tilt echoed in inputs
- Local days per year for Jupiter-like orbit ≈ 10,475

**References**

- Goldreich, P. & Peale, S. (1966), "Spin-orbit coupling in the solar system",
  Astronomical Journal 71, 425
- Wisdom, J. (2004), "Spin-orbit secondary resonance dynamics of Enceladus",
  Astronomical Journal 128, 484

### Gas Giant Thermal Model

**Chromophore-adjusted Class I albedo and recalibrated internal heat ratio**
(engine/gasGiant.js, ui/sciencePage.js)

Two thermal model improvements that cascade into more accurate magnetic field
strength, effective temperatures, and internal heat flux:

- **Class I bond albedo** lowered from 0.57 to 0.34. The Sudarsky (2000) value
  assumed pure NH₃ ice crystals; real ammonia cloud decks contain UV-photolysis
  chromophores that darken the atmosphere. The adjusted value matches the observed
  mean of Jupiter (0.343) and Saturn (0.342). Jupiter T_eq improves from 99 K to
  110 K (NASA: 110 K); internal flux from 3.8 to 5.5 W/m² (observed: 5.4).

- **`internalHeatRatio()` recalibrated** with a sigmoid transition in the ice
  giant regime (centered at 0.05 Mjup) and corrected gas giant values. Key fixes:
  Neptune ihRatio 1.59 → 2.62 (observed), Saturn 2.30 → 1.77 (observed), Jupiter
  1.70 → 1.66 (observed). Uranus (1.06) was already correct.

- **Compositional convection floor** raised from 0.2 to 0.4 W/m². Phase
  separation (H/He demixing, water/ammonia differentiation) sustains at least
  ~0.4 W/m² of compositional buoyancy flux even without measurable thermal output.

### Gas Giant Magnetic Dynamo

**Christensen energy-flux dynamo** (engine/gasGiant.js, ui/planetPage.js,
ui/sciencePage.js)

The simplified parametric scaling (B ∝ M^(1/3) × P^(-1/3)) is replaced by a
Christensen (2009) energy-flux dynamo model self-normalised to Jupiter (4.28 G).
The old model gave Saturn ~3 G — 14× the observed 0.21 G — because it ignored
the mass-dependent conducting-shell geometry that drives real dynamo physics.

The new model computes surface field strength from three physically motivated
inputs, all already available in the engine:

- **Dynamo shell geometry** — metallic hydrogen transition depth for gas giants
  (log-interpolated: Jupiter r_o/R = 0.83, Saturn 0.40). Ice giants use a
  density-dependent ionic ocean shell (r_o/R = 0.70 × (ρ_ref/ρ)^0.82) — less
  dense ice giants reach ionic dissociation at larger fractional radius, producing
  thicker conducting shells. Shell exponent 3.2 (vs theoretical 3) accounts for
  thin-shell dipolarity reduction and stable-layer attenuation (Heimpel+ 2005,
  Christensen & Wicht 2008).
- **Internal heat flux** — thermal + moon tidal heating drive convective power.
- **Compositional convection floor** (0.4 W/m²) — prevents unrealistically weak
  fields for planets like Uranus with near-zero measured thermal flux, reflecting
  phase-separation-driven convection (H/He demixing, water/ammonia
  differentiation).

**Dual normalisation** — gas giants normalise to Jupiter (4.28 G), ice giants
normalise to the Uranus/Neptune geometric mean (0.18 G). Separate references
avoid cross-regime extrapolation between thick-shell dipolar dynamos and
thin-shell multipolar dynamos, eliminating the need for a conductivity fudge
factor.

Field morphology is now reported: gas giants → dipolar (thick metallic-H shell),
ice giants → multipolar (thin ionic shell, Stanley & Bloxham 2004).

**Calibration** (all four Solar System giants within ~2%):

| Planet  | Observed (G) | Model (G) | Ratio  | Morphology |
| ------- | ------------ | --------- | ------ | ---------- |
| Jupiter | 4.28         | 4.28      | 1.00×  | Dipolar    |
| Saturn  | 0.21         | ~0.21     | ~0.99× | Dipolar    |
| Uranus  | 0.23         | ~0.24     | ~1.02× | Multipolar |
| Neptune | 0.14         | ~0.14     | ~1.00× | Multipolar |

New output fields: `dynamoActive`, `dynamoReason`, `fieldMorphology`,
`fieldLabel`, `surfaceFieldEarths`, `shellRatio`, `conductivityRegime`,
`effectiveFluxWm2`. All existing fields (`surfaceFieldGauss`,
`dipoleMomentAm2`, `magnetopauseRp`, `magnetopauseKm`) preserved.

**Tests** (tests/gasGiant.test.js, tests/gasGiant-nasa-validation.test.js)

- Jupiter self-normalisation → within 2% of 4.28 G, dipolar, metallic-H
- Saturn within 20% of 0.21 G, dipolar
- Uranus within 20% of 0.23 G, multipolar, ionic
- Neptune within 20% of 0.14 G, multipolar
- Heavier planet → stronger field (monotonicity)
- Output structure contains all 12 expected fields
- Magnetopause scales with orbital distance
- Display string includes field label and Gauss value
- surfaceFieldEarths consistent with surfaceFieldGauss / 0.31
- NASA validation: morphology, conductivity regime, dynamo active for all 4 giants

**References**

- Christensen, U. R. et al. (2009), "Energy flux determines magnetic field
  strength of planets and stars", Nature 457, 167
- Christensen, U. R. & Aubert, J. (2006), "Scaling properties of convection-
  driven dynamos in rotating spherical shells", Geophys. J. Int. 166, 97
- Stanley, S. & Bloxham, J. (2004), "Convective-region geometry as the cause
  of Uranus' and Neptune's unusual magnetic fields", Nature 428, 151
- French, M. et al. (2012), "Ab initio simulations for material properties along
  the Jupiter adiabat", ApJS 202, 5

### Gas Giant Magnetopause

**Chapman-Ferraro + moon plasma inflation** (engine/gasGiant.js, ui/sciencePage.js)

The magnetopause formula is replaced with a first-principles Chapman-Ferraro
dipole pressure balance plus plasma inflation from tidally-heated moons:

- **Chapman-Ferraro standoff**: `R_CF = [B²/(2μ₀ P_sw)]^(1/6)` where `P_sw`
  is solar wind pressure at orbit distance. Gives the vacuum dipole prediction.
- **Moon self-heating**: tidal heating ON each moon FROM the planet, using a
  cold-body k₂/Q model with tidal-thermal feedback for intensely heated bodies
  (Io mechanism — partial melting reduces rigidity and Q, amplifying
  dissipation).
- **Plasma inflation**: `f = (1 + H_moon/H_ref)^γ` where H_ref = 4×10⁵ W
  and γ = 0.047, calibrated to Jupiter (f ≈ 2.4, Io plasma torus) and Saturn
  (f ≈ 1.6). Below 10⁸ W total moon heating, no inflation is applied.

The old formula (`75 × (B/B_J)^(1/3) × (r/5.2)^(1/3)`) baked Jupiter's
anomalous Io-driven inflation into the calibration constant, producing 52–145%
errors for non-Jupiter planets.

| Planet  | Old          | New   | Observed | Improvement |
| ------- | ------------ | ----- | -------- | ----------- |
| Jupiter | 75 Rp (0%)   | 75 Rp | 75 Rp    | Same        |
| Saturn  | 34 Rp (52%)  | 22 Rp | 22 Rp    | 52% → ~0%   |
| Uranus  | 44 Rp (145%) | 19 Rp | 18 Rp    | 145% → ~3%  |
| Neptune | 43 Rp (87%)  | 18 Rp | 23 Rp    | 87% → ~21%  |

Neptune's remaining 21% error is due to its highly tilted (47°) and offset
(0.55 R) magnetic dipole, which the centered-dipole model cannot capture.

**References**

- Chapman, S. & Ferraro, V. C. A. (1931), "A new theory of magnetic storms",
  Terrestrial Magnetism 36, 77
- Peale, S. J., Cassen, P. & Reynolds, R. T. (1979), "Melting of Io by tidal
  dissipation", Science 203, 892

### Gas Giant Per-Species Atmospheric Escape

**Jeans escape analysis** (engine/gasGiant.js, ui/planetPage.js)

Gas giants now show per-species Jeans escape analysis for all six tracked
atmospheric species (H₂, He, CH₄, NH₃, H₂O, CO), complementing the existing
bulk energy-limited (XUV) mass-loss model. Each species displays its Jeans
parameter λ and retention status (Retained, Marginal, or Lost).

A gas-giant-specific exobase temperature model accounts for extended H₂/He
envelope XUV absorption — no surface pressure or CO₂ cooling like rocky
planets. Uses an effective temperature floor of 200 K (UV + gravity-wave
heating baseline) with XUV boost capped at 10,000 K (hydrodynamic blow-off
regime). Non-thermal escape mechanisms raise retention thresholds for H₂ (×3,
charge exchange/polar wind) and He (×5, ion pickup).

Key behaviour: Jupiter-mass planets retain all species easily (λ ≫ 18), but
mini-Neptunes (≤0.05 Mjup) at close orbits can lose H₂ and He through
non-thermal processes even when thermally retained.

**Tests** (tests/gasGiant.test.js)

- Jupiter at 5.2 AU retains all heavy species
- Mini-Neptune at 0.02 AU: non-thermal escape flips H₂/He from Retained to Lost
- Sub-Neptune at 0.02 AU: H₂ thermally lost (λ < 3)
- Higher mass → higher λ (stronger retention)
- Closer orbit → hotter exobase
- Display string contains species, λ values, and T_exo
- Exobase temperature capped at 10,000 K

**References**

- Jeans, J. (1925), "The Dynamical Theory of Gases", Cambridge Univ. Press
- Murray-Clay, R. A. et al. (2009), "Atmospheric escape from hot Jupiters",
  ApJ 693, 23
- Gunell, H. et al. (2018), "Why an intrinsic magnetic field does not protect
  a planet against atmospheric escape", A&A 614, L3

### Gas Giant Moon Tidal Heating

**Tidal heating from orbiting moons** (engine/gasGiant.js, ui/planetPage.js)

Gas giants now compute tidal heating deposited by their moons using the Peale,
Cassen & Reynolds (1979) dissipation formula with gas-giant-specific fluid
Love number k₂ and tidal quality factor Q.

Gas giants are fluid bodies — the rigid-body k₂ formula (Munk & MacDonald 1960)
does not apply. Instead, k₂ is calibrated to Solar System measurements: Jupiter
k₂ ≈ 0.38 (Wahl+ 2016, Juno), Saturn k₂ ≈ 0.34 (Lainey+ 2017), ice giants
k₂ ≈ 0.1–0.13. Tidal Q uses empirical piecewise fits: Jupiter Q ≈ 10⁵ (Lainey+
2009), Saturn Q ≈ 3×10³ (resonance locking, Fuller+ 2016), ice giants Q ≈ 10⁴.

Moon tidal heating is displayed as absolute power (W) and as a percentage of
the giant's intrinsic internal heat flux. For Jupiter with Io, the reciprocal
heating is ~4×10⁹ W (<10⁻⁶% of internal heat) — negligible, as expected. More
significant contributions arise for lower-Q Saturn-mass hosts with eccentric
close-in moons.

New output fields: `thermal.moonTidalHeatingW`, `thermal.moonTidalFraction`,
`thermal.k2`, `thermal.tidalQ`.

**Tests** (tests/gasGiant.test.js)

- No moons → zero tidal heating
- Io-analog at Jupiter → ~10⁹ W (k₂/Q limits dissipation)
- Higher eccentricity → more heating
- Closer moon → more heating (a⁻⁶ dependence)
- Saturn Q < Jupiter Q → same moon heats Saturn more
- Ice giant k₂ lower than gas giant k₂
- Display string contains W and % when moons present
- Multiple moons sum → more than either alone

**References**

- Peale, S. J., Cassen, P. & Reynolds, R. T. (1979), "Melting of Io by tidal
  dissipation", Science 203, 892
- Wahl, S. M. et al. (2016), "Comparing Jupiter interior structure models to
  Juno gravity measurements", Geophys. Res. Lett. 44, 4649
- Lainey, V. et al. (2009), "Strong tidal dissipation in Io and Jupiter", Nature
  459, 957
- Lainey, V. et al. (2017), "New constraints on Saturn's interior from Cassini
  astrometric data", Icarus 281, 286
- Fuller, J., Luan, J. & Quataert, E. (2016), "Resonance locking as the source
  of rapid tidal migration in the Jupiter and Saturn moon systems", MNRAS 458,
  3867

## 1.16.1 — 2026-03-03

### Bug Fixes

- **Internal Heat UI** (ui/planetPage.js) — Added the missing Internal
  Heat input section to the planet page. The radioisotope abundance
  engine logic (simple and per-isotope modes) was fully wired in v1.15.0
  but the UI controls were never rendered. Users can now adjust
  radioisotope abundance via a single slider (Simple mode) or four
  per-isotope sliders (Per-Isotope mode) with a live effective-abundance
  readout.

- **Internal Heat slider defaults** (ui/planetPage.js) — Fixed isotope
  sliders initialising empty when no value was stored. All five sliders
  now default to 1.0× (Earth-equivalent). Added radioisotope fields to
  the Earth preset in the Sol system.

- **Atmospheric Escape / Vegetation toggles** (ui/planetPage.js) —
  Replaced the iOS-style viz-switch checkboxes with segmented pill
  toggles (`physics-duo-toggle`), matching the Internal Heat section and
  the rest of the app's toggle convention.

- **Cluster visualiser PNG/GIF export** (ui/visualizerPage.js) — Fixed
  blank exports in cluster mode. All cluster visuals are drawn on the 2D
  overlay canvas, but the export captured only the WebGL canvas (which
  renders a blank dark frame in cluster mode). Both PNG and GIF exports
  now target the correct canvas per mode.

**Tests** (tests/planet-nasa-validation.test.js, tests/tectonics.test.js)

- 15 new NASA-calibrated validation tests for internal heat, dynamo
  state, volcanic activity, elastic lithosphere thickness, per-isotope
  fractions, and abundance scaling.

## 1.16.0 — 2026-03-02

### Atmospheric Escape

**New feature** (engine/planet.js)

Added per-species atmospheric escape analysis for rocky planets and
dwarf planets. For each of the 10 tracked gas species, the engine
computes a Jeans escape parameter (λ) that determines whether the
body can retain that gas against thermal escape over geological time.

- Jeans escape parameter: λ = v_esc² · M / (2 R T_exo).
- Exobase temperature model with XUV-driven thermospheric heating
  (Ribas et al. 2005), CO₂ radiative cooling suppression, and
  pressure-dependent XUV absorption efficiency (Beer-Lambert η_abs
  term — thin atmospheres absorb less XUV).
- Non-thermal escape enhancement for H₂ and He: charge exchange,
  polar wind, and ion pickup raise the effective retention thresholds
  (×3 for H₂, ×5 for He) on warm bodies (T_exo > 100 K), matching
  observed loss from Earth, Mars, and Mercury.
- Optional auto-strip toggle: when enabled, gases classified "Lost"
  are zeroed before computing greenhouse, partial pressures, and
  density. Original inputs are preserved.

Each species returns `thermalStatus` (pure Jeans), `status`
(effective, including non-thermal), `nonThermal` flag, and `lambda`.

**Calibration against NASA Planetary Fact Sheet:**

| Body    | T_eq  | T_exo | H₂ status           | He status           |
| ------- | ----- | ----- | ------------------- | ------------------- |
| Earth   | 254 K | 944 K | Marginal (non-thml) | Retained            |
| Venus   | 229 K | 229 K | Retained            | Retained            |
| Mars    | 210 K | 233 K | Marginal (non-thml) | Marginal (non-thml) |
| Mercury | 439 K | 439 K | Lost                | Lost                |
| Pluto   | 32 K  | 32 K  | Retained (barely)   | Retained            |
| Ceres   | 166 K | 166 K | Lost                | Lost                |

**UI** (ui/planetPage.js)

- "Atmospheric Escape" toggle in the atmosphere input section
  (viz-switch pattern, default off).
- Per-species retention table in derived details output showing λ,
  status, and "(non-thermal)" tag where applicable.
- Tooltip documenting both thermal and non-thermal thresholds.

**Science page** (ui/sciencePage.js)

Four new formula sections: Jeans Escape Parameter, Exobase
Temperature (with η_abs and calibration table), XUV Flux (Ribas
et al. 2005), and Non-Thermal Escape Enhancement (Gunell et al.
2018, Gronoff et al. 2020).

**Tests** (tests/planet.test.js, tests/planet-nasa-validation.test.js)

- 9 unit tests: Earth-like retention, Ceres mass loss, auto-strip
  on/off, exobase Earth/Venus, Mars retention, cold-body non-thermal
  inactive, no NaN at minimum mass.
- 24 NASA validation tests: T_eq within 1–3% of NASA Fact Sheet for
  Mercury/Venus/Earth/Mars/Ceres, T_exo range checks, escape velocity
  cross-checks, per-species retention against observed atmospheres,
  λ ordering sanity, orbital distance effects.

### Dwarf Planets

**New feature** (engine/planet.js, ui/planetPage.js)

Added mass-based body classification for rocky planets. Bodies below
0.01 M⊕ (~Mercury mass) are labelled "Dwarf planet"; at or above that
threshold they remain "Planet". The physics model is identical for
both classes — this is purely a labelling change.

- Lowered the planet mass floor from 0.01 to 0.0001 M⊕, covering
  Ceres (0.00016 M⊕) through sub-Mercury bodies.
- New `bodyClass()` function classifies by mass threshold.
- Body class appears as a KPI card in the planet output panel, with
  a tooltip explaining the threshold.
- Planet selector shows `[D]` prefix for dwarf planets (alongside
  `[R]` for rocky and `[G]` for gas giants).
- "Pluto-ish Preset" button pre-fills Pluto-like parameters
  (0.0022 M⊕, 30% ice, 122.5° axial tilt, trace CH₄ atmosphere).

**Science page** (ui/sciencePage.js)

Added a "Body Classification" section documenting the mass threshold
and listing real-world examples.

**Sol preset** (ui/solPreset.js)

Added Ceres, Pluto, and Charon (Pluto's moon) to the Solar System
preset. The preset now uses Manual orbit placement mode so all
bodies render at their real semi-major axis values.

| Body   | Mass (M⊕) | Class        | Semi-major axis (AU) |
| ------ | --------- | ------------ | -------------------- |
| Ceres  | 0.00016   | Dwarf planet | 2.77                 |
| Pluto  | 0.0022    | Dwarf planet | 39.48                |
| Charon | —         | Moon (Pluto) | 19 591 km            |

**Visualiser** (ui/visualizerPage.js)

Fixed planet rendering filter to include unslotted planets. Previously
only planets with an assigned orbital slot appeared in the system
visualiser; planets without a slot now render at their
`semiMajorAxisAu` position, matching how gas giants already worked.

**Tests** (tests/planet.test.js)

- `bodyClass → Earth-like → Planet`
- `bodyClass → Pluto mass → Dwarf planet`
- `bodyClass → Mercury mass (0.055) → Planet`
- `bodyClass → Mars mass (0.107) → Planet`
- `radiusEarth → Pluto mass → ~0.19 R⊕`
- `radiusEarth → Ceres mass → ~0.074 R⊕`
- `no NaN at minimum mass (0.0001 M⊕)`

### Guided / Manual Orbit Placement Mode

**New feature** (ui/store.js, ui/systemPage.js)

Added an orbit placement mode toggle (Guided / Manual) to the System
tab. Guided mode auto-assigns orbital slots using spacing heuristics;
Manual mode lets users place planets at arbitrary semi-major axes
without auto-spacing constraints.

**Store** (ui/store.js)

Schema version bumped from 51 to 52. New field:
`world.system.orbitMode` (default `"guided"`).

### Derived Details Section Headings

**UI improvement** (ui/planetPage.js, ui/moonPage.js)

Broke the monolithic Derived Details output block into labelled
section headings (Physical, Orbital, Tides, etc.) for easier
scanning.

### Canvas Loading Performance Optimisations

**Problem**: Pages with large celestial body canvases (system poster,
visualiser, planet previews) took ~5 seconds to load due to
synchronous procedural texture generation on the main thread.

**Five optimisations implemented**:

1. **Three.js modulepreload** (index.html) — `<link rel="modulepreload">`
   starts downloading Three.js during HTML head parse instead of
   waiting for the dynamic `import()`. Eliminates 1–2 s of CDN
   latency.

2. **Larger in-memory caches** (ui/celestialVisualPreview.js,
   ui/celestialComposer.js) — `CELESTIAL_TEXTURE_CACHE_MAX` 16 → 64,
   `LAYER_FIELD_CACHE_MAX` 14 → 32. Fits a full solar system without
   evictions (~30 MB total).

3. **IndexedDB texture persistence** (ui/textureCache.js) — New
   standalone module stores RGBA texture buffers across browser
   sessions. LRU eviction at 200 entries, automatic pipeline-version
   invalidation, graceful degradation when IndexedDB is unavailable.

4. **Batch pre-warming** (ui/celestialVisualPreview.js,
   ui/systemPosterNativeThree.js) — `preWarmTextures()` generates all
   body textures in parallel via Web Worker. System poster overlaps
   texture generation with layout and zone rendering.

5. **Progressive LOD** (ui/visualizerPage.js) — Shows a tiny 64 px
   placeholder instantly (~10 ms) then upgrades to full quality
   asynchronously via worker. Five-step fallback chain: memory cache
   → IndexedDB → tiny placeholder → worker → local generation.

Expected improvement: ~5 s → ~1.5 s (first visit), <1 s (subsequent
visits with warm IndexedDB cache).

### Moon Initial Rotation Period

**New input** (engine/moon.js, ui/moonPage.js)

Added configurable initial rotation period for moons. Previously
hardcoded at 12 hours (WorldSmith 8 spreadsheet assumption), now
exposed as an optional slider (2–1000 hours) under a new "Dynamics"
section on the Moon page.

The initial spin rate feeds directly into the tidal locking timescale:
faster initial spin means more angular momentum to dissipate, resulting
in a longer time to reach tidal lock. Default remains 12 hours for
backwards compatibility — existing worlds are unaffected.

**Unlocked moon rotation estimate** (engine/moon.js)

Moons that are not yet tidally locked now show an estimated current
rotation period instead of "Not tidally locked". Uses an exponential
despinning model: `omega(t) = n + (omega_0 - n) * exp(-t/tau)`, where
tau is calibrated so the moon reaches synchronous rotation at the
computed lock time. Display distinguishes "(locked)" vs "(est.)".

**Store** (ui/store.js)

Schema version bumped from 52 to 53. New field:
`initialRotationPeriodHours` (default `null` → engine uses 12 h).

**Tests** (tests/moon.test.js)

- 5 new tests: backwards compatibility (default 12 h), null handling,
  slower spin locks faster, faster spin locks slower, unlocked moon
  shows estimated rotation period

### Radioisotope Abundance Override

**New engine feature** (engine/planet.js, engine/tectonics.js)

Added configurable radioisotope abundance for rocky planets. The
parameter scales four core geophysics formulas:

- Volcanic activity: `exp(-0.15 * age / A)` — higher abundance
  sustains volcanism longer
- Elastic lithosphere: `sqrt(age / A)` — more heat thins the
  lithosphere
- Internal heat budget: `44 TW × mass × A` — direct linear scaling
- Core solidification: `τ_base × A` — extends dynamo lifetime

Default is 1.0× (Earth). Range: 0.1–3.0× in simple mode.

**Per-isotope mode** (engine/planet.js)

Added advanced per-isotope mode with individual sliders for U-238
(39% of Earth heat, t½ = 4.47 Gyr), U-235 (4%, 0.70 Gyr), Th-232
(40%, 14.05 Gyr), and K-40 (17%, 1.25 Gyr). The effective abundance
is the weighted sum: `A = Σ(aᵢ × wᵢ)`. All isotopes at 1.0 gives
A = 1.0. Per-isotope range: 0.0–5.0×.

New constant: `ISOTOPE_HEAT_FRACTIONS` (`{ u238: 0.39, u235: 0.04,
th232: 0.40, k40: 0.17 }`).

**UI** (ui/planetPage.js)

New "Internal Heat" section with isotope detail toggle (Simple /
Per-Isotope). Simple mode shows a single Radioisotope Abundance
slider. Per-Isotope mode reveals four individual isotope sliders
with a computed "Effective abundance" readout. Added tooltips with
half-lives and heat contributions for each isotope.

**Store** (ui/store.js)

Schema version bumped from 53 to 55. New fields:
`radioisotopeAbundance` (v54, default `null` → 1.0),
`radioisotopeMode` (v55, default `"simple"`),
`u238Abundance`, `u235Abundance`, `th232Abundance`, `k40Abundance`
(v55, default `null` → 1.0 each).

**Science page** (ui/sciencePage.js)

Updated Volcanic Activity, Elastic Lithosphere Thickness, Core
Solidification Timescale, and Moon Tidal Heating formulas to include
radioisotope abundance parameter. Added new "Radioisotope Abundance"
formula section documenting the weighted-sum computation and
per-isotope heat fractions.

**Tests** (tests/planet.test.js, tests/tectonics.test.js)

- 7 new tectonics tests: abundance scaling for volcanic activity
  (increase, decrease, default), lithosphere thickness (thin, thick,
  default), calcTectonics integration
- 9 new planet tests: null default, internal heat scaling, dynamo
  extension, display format, advanced mode all-1x, all-2x equals
  simple, selective Th-232 boost, zero floors at 0.01, simple mode
  ignores per-isotope fields

### Pill Toggle UI Unification

**UI improvement** (ui/planetPage.js, ui/starPage.js)

Replaced four `viz-switch` (iOS-style checkbox) toggles with
`physics-duo-toggle` (segmented pill radio) controls, matching the
debris disk page style:

- Planet page: Vegetation (Auto / Manual), Internal Heat isotope
  detail (Simple / Per-Isotope)
- Star page: Stellar Evolution (Off / On), Physics Mode (Simple /
  Advanced)

Added bold section headers ("Stellar Evolution", "Physics Mode")
above the star page pill toggles with new tooltip entries, matching
the planet page pattern.

### Moon Surface Temperature

**New derived output** (engine/moon.js, ui/moonPage.js)

Added equilibrium and surface temperature calculations for moons.
Equilibrium temperature uses the Stefan-Boltzmann formula for an
airless body: `T_eq = (L★(1−a) / 16πσd²)^0.25`. Surface temperature
adds tidal heating and radiogenic heating flux: `σT⁴ = F_star +
F_tidal + F_radio`.

Radiogenic heat flux scales from Earth's 44 TW by moon mass and
radioisotope abundance: `F_radio = 44 TW × (M/M⊕) × A / 4πR²`.

Two new output rows: Equilibrium Temp and Surface Temp (displayed in
both K and °C).

**Validation** — Earth's Moon: 270 K (exact). Titan: 84 K vs 85 K
observed (−1.2%). Triton: 36 K vs 38 K (−5.3%).

### Magnetospheric Radiation

**New derived output** (engine/moon.js, ui/moonPage.js)

Added charged-particle radiation dose from the host planet's
magnetosphere. Dipole field at the moon's orbit:
`B(r) = B_surface × (R_planet / r)³`. Radiation dose scales as B³,
calibrated to Jupiter-Europa (~540 rem/day):
`D = 3.97×10⁹ × B³ rem/day`.

Magnetopause standoff uses Chapman-Ferraro scaling for rocky planets,
or pre-computed values from the gas giant engine. Moons beyond the
magnetopause receive zero trapped-particle radiation.

**Magnetopause shadowing** — energetic particle drift orbits that
intersect the magnetopause deplete the outer radiation belts. Applied
as a logistic attenuation: `D_eff = D / (1 + exp(25(L/L_mp − 0.3)))`.
Rolloff onset at 30% of magnetopause distance, calibrated to Callisto.

| Moon     | Model         | Observed | Ratio |
| -------- | ------------- | -------- | ----- |
| Europa   | 538 rem/day   | 540      | 1.00× |
| Ganymede | 7.5 rem/day   | 8        | 0.94× |
| Callisto | 0.011 rem/day | 0.01     | 1.09× |

Labels: Negligible / Low / Moderate / High / Very High / Extreme.

**Gas giant magnetic field passthrough** (ui/moonPage.js)

Extended `buildParentOverride` to include `surfaceFieldEarths`,
`magnetopauseRp`, and `radioisotopeAbundance` from the gas giant
engine, enabling radiation calculations for gas giant moons.

### Tidal-Thermal Feedback

**New engine feature** (engine/moon.js)

Added automatic tidal-thermal feedback for rocky moons (ρ ≥ 3.2
g/cm³). When tidal flux exceeds a critical threshold (0.02 W/m²),
the model recognises that the interior is partially molten and
automatically lowers rigidity μ and quality factor Q via a smooth
logistic blend: `f = 1 / (1 + (F_crit/F₀)³)`.

This models the positive feedback loop behind Io's extreme volcanism
in the Laplace resonance — intense tidal heating melts the interior,
which lowers Q, which further amplifies dissipation.

| Moon      | Before             | After              | Observed   |
| --------- | ------------------ | ------------------ | ---------- |
| Io        | 1.5×10¹³ W (0.15×) | 1.0×10¹⁴ W (1.01×) | 10¹⁴ W     |
| Moon      | 2.7×10⁹ W          | 2.7×10⁹ W          | —          |
| Enceladus | 1.8×10¹⁰ W         | 1.8×10¹⁰ W         | 1.6×10¹⁰ W |

Guard rails: only fires for rocky densities without a manual
composition override. Icy moons, manually overridden compositions,
and cold moons are unaffected.

**Science page** (ui/sciencePage.js)

Added three new formula sections: Moon Surface Temperature,
Tidal-Thermal Feedback, and Magnetospheric Radiation.

**Tests** (tests/moon.test.js)

- 8 new tests for temperature, radiogenic heating, display strings,
  magnetospheric radiation (Europa-like, beyond magnetopause, no
  field), and 4 tests for tidal-thermal feedback (no feedback for
  cold moons, Io auto-melting, override skips feedback, Europa
  excluded by density)

**References**

- Moore, W. B. (2003), "Tidal heating and convection on Io",
  J. Geophys. Res. 108, 5096
- Segatz, M. et al. (1988), "Tidal dissipation, surface heat flow,
  and figure of viscoelastic models of Io", Icarus 75, 187–206
- Paranicas, C. et al. (2009), "Europa's radiation environment",
  Europa (U. Arizona Press), 529–544
- Divine, N. & Garrett, H. B. (1983), "Charged particle
  distributions in Jupiter's magnetosphere", J. Geophys. Res. 88,
  6889–6903

### Local Cluster Limits

**Improved limits** (engine/localCluster.js, ui/localClusterPage.js)

Tightened local cluster input ranges to scientifically reasonable
values and raised the system rendering cap from 99 to 750:

| Parameter         | Before   | After    |
| ----------------- | -------- | -------- |
| Max radius        | 500 ly   | 25 ly    |
| Max density       | 1.0 /ly³ | 0.1 /ly³ |
| System render cap | 99       | 750      |

The old 500 ly radius produced millions of unrenderable systems at
any realistic density. The new 25 ly max covers the full local
neighbourhood at default density (~193 systems) with room to spare.
The density cap of 0.1 /ly³ covers all habitable environments up to
young open clusters; the old 1.0 /ly³ was globular-core territory
where isolated planetary systems are dynamically unstable.

The 750-system cap means most configurations within the new ranges
display all generated systems. At 25 ly / 0.1 /ly³ (~4,800 systems)
the cap limits the rendered subset; the "systems omitted" counter
already reports the difference.

**Tests** (tests/localCluster.test.js)

- Updated `systemsOmitted` test to use the new 751-total threshold
  (density 0.1, radius 25)

## 1.15.0 — 2026-03-02

### Tectonics Phase 2 — Science Enhancements

**New engine functions** (engine/tectonics.js)

Added eight new exported functions with full scientific references:
`spreadingRate`, `volcanicArcDistance`, `airyRootDepth`, `prattDensity`,
`continentalMarginProfile`, `maxShieldHeight`, `shieldVolcanoProfile`,
`riftProfile`. Extended `calcTectonics()` to compute all new features.

New constants: crustal/mantle densities (Turcotte & Schubert 2014),
slab depth 110 km (Syracuse & Abers 2006), shield volcano reference
10 km (McGovern & Solomon 1993/1998), spreading rate ranges
(Dalton et al. 2022).

**New UI features** (ui/tectonicsPage.js)

- Seafloor spreading rate slider with regime-dependent range and KPI
- Slab angle slider per Andean/Laramide range with volcanic arc
  distance marker on cross-section canvas
- Isostasy toggle (Off / Airy / Pratt) with root polygon and
  density-zone visualisations on the cross-section
- Continental margin canvas with shelf/slope/rise/abyssal zones
  and adjustable shelf width, depth, and slope angle
- Shield volcano subsection with height/slope cards and profile
  canvases; max shield height KPI scales with 1/g
- Rift valley subsection with add/remove cards, graben
  width/depth/fault angle inputs, and profile canvases

**Store** (ui/store.js)

Schema version bumped from 47 to 48. New fields: `spreadingRateFraction`,
`isostasyMode`, `margin`, `shieldVolcanoes`, `riftValleys`, `plates`,
`plateTimeMyr`. Migration adds `slabAngleDeg: 45` to existing mountain
ranges.

**Tests** (tests/tectonics.test.js)

- ~35 new tests covering all Phase 2 functions (68 total, all passing)

**References**

- Turcotte, D. L. & Schubert, G. (2014), Geodynamics, Ch. 2
- Syracuse, E. & Abers, G. (2006), G³, 7
- McGovern, P. J. & Solomon, S. C. (1993, 1998), JGR
- Dalton, C. A. et al. (2022), GRL

### Tectonics Phase 3 — Interactive Plate Canvas

**New engine** (engine/plates.js)

Spherical Voronoi tessellation via 3D incremental convex hull (dual
graph). Functions: `latLonToXYZ`, `xyzToLatLon`, `convexHull3D`,
`sphericalVoronoi`, `rotateAroundPole`, `classifyBoundaryWithSeeds`,
`calcPlates`. Rigid kinematic plates with Euler pole rotation and
convergent/divergent/transform boundary classification.

**New UI** (ui/tectonicsPage.js)

Full-width plate canvas panel below the existing two-column grid:

- Equirectangular projection (Plate Carrée) with lat/lon grid
- Click to place plate seeds (up to 20), drag to reposition,
  right-click to toggle continental/oceanic type
- Colour-coded cells (warm tones = continental, blues = oceanic)
- Boundary lines: red = convergent, blue = divergent,
  green = transform
- Timeline slider (0–500 Myr) with live redraw
- Earth preset (8 major plates with approximate Euler poles)
- Plate summary table with type toggle and remove buttons

**Tests** (tests/plates.test.js)

- 20 new tests: coordinate transforms, convex hull, Voronoi cells,
  Euler rotation, boundary classification, calcPlates integration

### Science & Maths Page — Tectonics Section

**New section** (ui/sciencePage.js)

Added "Tectonics & Geodynamics" section with 11 formulas:
maximum mountain height (Weisskopf 1975), ocean subsidence (PSM 1977),
Airy/Pratt isostasy (Turcotte & Schubert 2014), volcanic arc distance
(Syracuse & Abers 2006), linear erosion, spreading rate categories
(Dalton et al. 2022), shield volcano scaling (McGovern & Solomon),
continental margin dimensions, and tectonic regime probabilities.

Interactive calculator: gravity slider → max mountain height + max
shield volcano height + Airy root depth.

Moved tectonic regime probability formula from Interior & Composition
into the new section. Added 3 new divergence entries (ocean subsidence
intersection constant, shield volcano 1/g scaling, continental margin
fixed dimensions).

### Science & Maths Page — Complete Formula Audit

Cross-referenced all 14 engine modules against the Science & Maths
page and expanded coverage from 12 sections / ~108 equations to
18 sections / ~160 equations.

**6 new sections** (ui/sciencePage.js)

- **Stellar Evolution** (7 formulas) — metallicity conversion,
  ZAMS luminosity/radius (Tout et al. 1996), main-sequence lifetime
  (Hurley 2000), terminal-age luminosity/radius, evolved L/R
  parametric tracks.
- **Gas Giant Physics** (12 formulas) — Chen & Kipping mass-radius,
  Sudarsky classification, Lodders & Fegley cloud condensation
  layers, Thorngren & Fortney atmospheric metallicity,
  mass-dependent internal heat ratio, Christensen dipole scaling,
  Rhines atmospheric dynamics, Darwin-Radau oblateness, Ribas XUV
  mass loss, Thorngren core mass, Fortney radius inflation,
  Gaussian ring model.
- **Lagrange Points** (4 formulas) — Hill sphere, L1/L2, L3,
  L4/L5 equilateral points.
- **Climate Classification** (7 formulas) — temperature at
  latitude with equator-pole gradient, seasonal amplitude,
  three-zone moisture index, Köppen decision tree (E/B/A/D/C),
  tidally locked substellar/terminator/antistellar zones,
  environmental lapse rate.
- **Population Dynamics** (5 formulas) — ocean fraction by water
  regime, latitude-weighted habitability fraction, tech-era
  carrying capacity with crop efficiency scaling, Verhulst
  logistic growth, Zipf rank-size distribution.
- **Debris Disks** (9 formulas) — mean-motion resonance positions,
  Lodders condensation sequence, dust equilibrium temperature,
  Wyatt fractional luminosity, blowout grain size, PR drag
  timescale, collisional lifetime, Wisdom chaotic zone, Planck
  IR excess at 24 μm.

**4 sections expanded** (ui/sciencePage.js)

- **Tectonics & Geodynamics** (+4 formulas, 14 total) — added
  composition-dependent peak heights table, elastic lithosphere
  thickness, volcanic activity index, climate-adjusted erosion
  scaling.
- **Stellar Activity** (+2 formulas, 7 total) — added N₃₂
  reference table with age-band boundaries per spectral bin,
  flare cycle multiplier ranges (FGK/early-M/late-M).
- **Local Cluster** (+1 formula, 7 total) — added metallicity
  gradient model (radial −0.06 dex/kpc, vertical −0.30 dex/kpc)
  and per-class multiplicity fractions table (O through L/T/Y).
- **Interior & Composition** (+2 formulas, 7 total) — added
  composition classification thresholds (WMF/CMF → class label)
  and mantle outgassing oxidation states (Ortenzi et al. 2020).

**Fixes** (ui/sciencePage.js)

- Replaced stale CME Association Probability table. Old values
  (0.2/0.5/0.8/0.95) did not match engine truth; corrected to
  0.005/0.12/0.4/0.75 at energy breaks 10³²/10³³/10³⁴ erg,
  matching `stellarActivity.js`.
- Corrected equation counts in SECTIONS array: Planetary Physics
  11 (was 12), Orbital Mechanics 13 (was 11).

**6 new divergence entries** (ui/sciencePage.js)

- Gas giant internal heat ratio ramps (WS-derived)
- Gas giant ring mass Gaussian model (WS-derived)
- Gas giant oblateness MOI interpolation (WS-derived)
- Population tech era density/growth tables (WS-derived)
- Climate moisture index zone model (WS-derived)
- Climate tidally-locked temperature model (WS-derived)

**References**

- Chen, J. & Kipping, D. (2017), ApJ 834
- Christensen, U. R. (2009), Space Sci. Rev. 152
- Fortney, J. J. et al. (2007), ApJ 659
- Hurley, J. R. et al. (2000), MNRAS 315
- Lodders, K. (2003), ApJ 591
- Lodders, K. & Fegley, B. (2002), Icarus 155
- Luck, R. E. & Lambert, D. L. (2011), AJ 142
- Ortenzi, G. et al. (2020), Sci. Rep. 10
- Ribas, I. et al. (2005), ApJ 622
- Schlesinger, K. J. et al. (2014), ApJ 791
- Thorngren, D. P. & Fortney, J. J. (2019), ApJL 874
- Thorngren, D. P. et al. (2016), ApJ 831
- Tout, C. A. et al. (1996), MNRAS 281
- Wyatt, M. C. (2007), ApJ 663
- Yashiro, S. et al. (2006), ApJL 650

### Tooltip Audit & Style Guide Compliance

**Full tooltip review** (ui/\*.js)

Audited all page controllers for style guide compliance. Rewrote
tooltips across moonPage, outerObjectsPage, and visualizerPage to
use declarative tone, Unicode units (g/cm³, m/s²), and correct
reference names ("Sun" not "Sol", "Moon" not "Our Moon"). Added
missing tipIcon calls on visualiser download buttons. Removed all
imperative verbs ("Choose", "Select", "Set") in favour of
declarative phrasing.

Added ~80 new tooltips across tectonicsPage, climatePage, and
populationPage covering all previously undocumented inputs and
outputs.

### Preset Schema Compliance

**Updated all presets to schema version 51** (ui/solPreset.js,
ui/realmspacePreset.js, ui/arrakisPreset.js)

All three presets (Sol, Realmspace, Arrakis) updated from version
44 to 51 with the following additions:

- Star: `evolutionMode`, `activityModelVersion`
- Gas giants: explicit `style` and `rings` fields (Saturn gets
  rings; Uranus/Neptune/Revona get "neptune" style)
- Planets: `wmfPct`, `tectonicRegime`, `mantleOxidation`,
  `greenhouseMode` where missing
- Moons: `compositionOverride: null` on all moon inputs
- Top-level: `clusterAdjustments` collection

**Data corruption fix** — Venus (Sol) and Toril (Realmspace) had
`cmfPct: 32.0`, which the v43 migration silently converts to −1
(auto). Changed Venus to 31.17% and Toril to 33.0% to preserve
intended values.

**Tectonic regime fix** — The v42 migration unconditionally
converts `"mobile"` to `"auto"`. Changed Earth and Toril presets
to use `"auto"` directly to match post-migration state.

### Import/Export Improvements

**Extended import summary** (ui/importExportPage.js)

The import preview now shows all nine world sections: Star,
Planets, Moons, Gas Giants, Debris Disks, Tectonics (with range/
volcano/rift/inactive counts), Population (tech era), Climate
(altitude), and Calendar (present/absent).

**Fixed default world** (ui/store.js)

Added missing `climate: { altitudeM: 0 }` to `defaultWorld()`.
Without this, a fresh install (no localStorage) returned a world
object missing the climate section, causing the Climate page to
fail on first load.

### Build Fix

**GIF encoder path resolution** (ui/canvasExport.js)

Changed `new URL("../assets/vendor/gif.js", import.meta.url)` to
page-relative string `"./assets/vendor/gif.js"`. The old pattern
resolved correctly in development but escaped the `dist/` root
after esbuild bundling, breaking GIF export in production builds.

## 1.14.0 — 2026-02-28

### Bug Fixes

- Unified Visualiser cluster mode now renders from canvas
  backing-store dimensions (instead of client dimensions), removing
  fractional bottom-edge artifact strips on large/high-DPR canvases.
- Cluster star rendering now culls fully off-canvas glows/companion
  dots to prevent clipped edge speckling at the canvas border.
- System Poster and Apparent Sky canvases now use the same
  `ceil + backing-store` sizing path, preventing sub-pixel underpaint
  rows in normal and fullscreen layouts.
- Lagrange/Hill display toggles now trigger an immediate visualiser
  redraw instead of waiting for the next animation frame.
- Focus camera follow now couples pan with zoom ratio when
  selecting/focusing bodies, removing the brief snap toward the host
  star.
- In System Poster fullscreen mode, the hide/show poster control is
  now disabled and visibly greyed out for consistent behaviour.
- Gas giant atmospheric metallicity now defaults to the mass-derived
  Thorngren relation scaled by host-star metallicity (`10^[Fe/H]`)
  when left blank, while manual metallicity overrides remain unchanged.
- Debris disk composition now includes stellar metallicity influence:
  condensed-species weighting and ice-to-rock ratio are modulated by
  host-star `[Fe/H]` while retaining temperature-driven condensation
  presence and class labels.
- Planet and moon Appearance KPI preview cards now hide Recipes and
  Pause buttons when collapsed, preventing the buttons from pushing
  the canvas downward. Buttons reappear on hover or focus-within.
- Gas giant preview materials now use a fully matte PBR finish
  (roughness 1.0, metalness 0, clearcoat 0), removing the glossy
  specular highlight that was inconsistent with gas giant appearance
  at planetary scales.

**Tests** (tests/debrisDisk.test.js, tests/gasGiant.test.js)

- 2 new tests: metal-poor stars increase debris disk ice/rock ratio
  while metal-rich decrease it; composition class stays
  temperature-driven across metallicity extremes.
- 1 new test: gas giant derived atmospheric metallicity scales with
  host-star `[Fe/H]` when metallicity input is blank.

### Rendering Platform

**Three.js native rendering pipeline**
(ui/celestialVisualPreview.js, ui/celestialComposer.js,
ui/celestialArtProfiles.js, ui/threeNativePreview.js,
ui/threeBridge2d.js, ui/threeRenderAssetMap.js,
ui/apparentSkyNativeThree.js, ui/systemPosterNativeThree.js,
ui/celestialTextureWorker.js, ui/celestialTextureWorkerClient.js,
ui/starVisualPreview.js, ui/visualizerPage.js, ui/systemPage.js,
ui/apparentPage.js, ui/planetPage.js, ui/moonPage.js,
ui/gasGiantStyles.js, ui/rockyPlanetStyles.js, ui/moonStyles.js)

Completed a full migration from Canvas2D to native Three.js WebGL
rendering across all major render surfaces: the Unified Visualiser
system view, System Poster, Apparent Sky comparison, and all body
preview canvases.

- Added a lazy-loading Three.js bridge (`ui/threeBridge2d.js`) for CDN
  import (v0.170.0) with retry on failure.
- Migrated rocky/gas/moon preview and recipe canvases to native Three
  shader/material previews (`ui/threeNativePreview.js`) with a custom
  `ShaderMaterial` implementing UV-mapped texture, diffuse lighting,
  rim lighting, ambient term, and alpha transparency.
- Added generated 3D-render asset pipeline
  (`scripts/generate-three-render-assets.mjs`) producing SVG sprites
  for 8 star, 17 gas giant, 19 rocky, 17 moon, and 6 debris disk
  variants under `assets/three-renders/`, with an asset-map module
  (`ui/threeRenderAssetMap.js`) for runtime lookup.
- Promoted the star-only preview runtime into a unified
  `ui/celestialVisualPreview.js` controller with compatibility
  re-export from `ui/starVisualPreview.js`. Supports `attach/detach`,
  `setPaused`, rotation animation at configurable speed, and disposal.
- Added a modular rule-driven composition engine
  (`ui/celestialComposer.js`) for rocky, gas giant, and moon textures
  using deterministic seeded layer stacks. Layers include base
  gradient, noise-based terrain, band patterns, oceans, ice caps,
  vegetation, clouds, volcanic features, craters, and more.
  Equirectangular texture maps are generated using 3D value noise,
  fBm, ridged fBm, and domain warping.
- Added full per-type celestial art-profile library
  (`ui/celestialArtProfiles.js`) covering all established rocky
  recipes, moon recipes, and gas styles, then wired those directives
  into `ui/celestialComposer.js`. Includes 11 new procedural texture
  modules: `dune-streaks`, `caustic-bloom`, `terminator-band`,
  `impact-rays`, `rift-lines`, `plume-haze`, `band-shear`,
  `storm-fronts`, `polar-haze`, `aurora-ovals`, `geo-grid`.
- Added off-thread texture generation via a Web Worker
  (`ui/celestialTextureWorker.js`,
  `ui/celestialTextureWorkerClient.js`) with request queueing,
  signature-based deduplication, and error recovery.
- Added descriptor texture caching + hover-aware LOD tiers
  (`low`/`medium`/`high`/`ultra`) for preview performance and quality
  scaling.
- Added preset-asset catalog generation
  (`scripts/generate-celestial-preset-assets.mjs`) and generated
  `assets/celestial-presets/manifest.json` covering established
  rocky/gas/moon families.
- Updated planet and moon Appearance KPI previews to use the unified
  animated controller, with rotation driven at `0.5` simulated Earth
  days per second. Added Pause/Play buttons that appear on
  hover/focus-within.
- Persisted recipe identifiers (`appearanceRecipeId`) through
  rocky/moon/gas flows so preview rendering keeps deterministic
  type-specific visual signatures across edits and reloads.
- Upgraded celestial preview rendering quality with higher LOD texture
  tiers, physically based body materials, and generated
  normal/roughness/emissive maps for richer lighting detail on planets
  and moons.
- Migrated the System Poster to Three.js orthographic rendering
  (`ui/systemPosterNativeThree.js`) with textured body spheres, star
  glow, habitable-zone arc band, frost line, debris disk particles,
  orbital guides, and starfield background. Removed ~430 lines of
  Canvas2D poster drawing code from `ui/systemPage.js`.
- Migrated the Apparent Sky angular-size comparison to Three.js
  (`ui/apparentSkyNativeThree.js`) with textured body spheres,
  Sol/Luna/Jupiter reference outlines, star glow, and day/night sky
  backgrounds. Removed ~450 lines of Canvas2D sky drawing code from
  `ui/apparentPage.js`.
- Added Three.js native body mesh cache in the Visualiser system view
  with LOD swapping, texture generation, atmosphere materials, and
  spin animation. Moon labels fade in based on zoom level.
- Replaced the canvas-drawn transition bar (`ui/vizTransition.js`)
  with a native HTML transition overlay with progress bar. Added an
  off-scale zone notice for bodies beyond the visible viewport.
- Removed the Canvas2D body-rendering dispatch layer
  (`ui/bodyRenderer.js`) — responsibilities absorbed by the Three.js
  pipeline.
- Removed 2D Canvas rendering functions from `gasGiantStyles.js`,
  `moonStyles.js`, and `rockyPlanetStyles.js` (preview, visualiser,
  and recipe-thumbnail renderers), replaced by Three.js native
  preview calls.

**Tests** (tests/celestialArtProfiles.test.js,
tests/celestialComposer.test.js, tests/celestialVisual.test.js,
tests/three.test.js, tests/visualHelpers.js)

- Added visual regression test infrastructure
  (`tests/visualHelpers.js`) with `@napi-rs/canvas` and `pixelmatch`
  for pixel-perfect snapshot comparison. Reference snapshots stored
  in `tests/snapshots/`.
- Patched `tests/domHarness.js` to delegate `getContext("2d")` to
  `@napi-rs/canvas` for real pixel-level rendering in headless tests.
- New test file `tests/celestialArtProfiles.test.js`: art profile
  resolution for every rocky/moon/gas recipe, layer verification,
  noise parameter coverage, gas ring/atmosphere specs.
- New test file `tests/celestialComposer.test.js`: descriptor
  defaults, ring enabling, subsurface-ocean mapping, LOD fallback,
  recipe-like model handling.
- New test file `tests/celestialVisual.test.js`: deterministic
  texture generation, pixel-perfect snapshot comparison, visual
  differentiation between body types.
- New test file `tests/three.test.js`: Three.js core constructors,
  vector/matrix operations, colour parsing, geometry vertex counts,
  colour space constants.
- Removed `tests/bodyRenderer.test.js` (superseded by celestial
  composer/art profile tests).

### Cluster Visualiser

**Pure 2D overlay rendering**
(ui/visualizerPage.js, ui/vizClusterRenderer.js)

Rewrote the cluster visualiser to render entirely on a single 2D
canvas overlay, eliminating the hybrid WebGL + Canvas2D split that
caused compositing judder during camera rotation. Three.js is used
only for projection math (camera matrix); all visual elements —
background gradient, starfield, grid rings, bearing labels, axes,
boundary circle, vertical links, star dots with radial gradients,
companion stars, system labels, and hover highlights — are drawn on
one `<canvas>` surface.

- Stars render as radial-gradient dots with bright cores and soft
  glow, matching the v1.13.0 Canvas2D visual style, instead of flat
  `SphereGeometry` meshes.
- System labels use native `ctx.fillText` with collision detection
  instead of Three.js `Sprite` objects, restoring readable text at
  all zoom levels.
- Boundary circle is drawn as a screen-facing 2D arc instead of a 3D
  `RingGeometry` on the XZ plane that appeared as a tilted ellipse.
- Home star remains pinned to the projected centre during rotation.
- Added a toggleable starfield background (400 seeded random stars)
  with a "Starfield" checkbox in the cluster controls panel.
- Moved `vizClusterRenderer.js` to a data-only module
  (`buildClusterSnapshot`); all rendering code now lives in
  `visualizerPage.js`.

### Stellar Activity

**Structured activity model with split-rate CME channels**
(engine/stellarActivity.js, ui/starPage.js,
scripts/calibrate-stellar-activity.mjs)

Added a structured three-tier stellar-activity model
(`inputs` / `activity` / `display`) with activity-cycle-aware flare
rate modulation, a comprehensive CME rate model, recalibrated CME
association probabilities, smooth saturation curves replacing hard
caps, and support for nested parameter shapes — while maintaining
backward compatibility through the existing `computeFlareParams`
entry point.

- New primary entry point `computeStellarActivityModel(star)` returns
  all numeric outputs and pre-formatted display strings in a
  three-tier object.
- Activity-cycle modulation: `flareCycleMultiplierFromCycle()` applies
  spectral-bin-specific min/max multipliers (FGK 0.35–1.65, earlyM
  0.6–1.4, lateM 0.75–1.25) from a new `FLARE_CYCLE_MULTIPLIER_TABLE`.
- Comprehensive CME rate model via `computeCmeRateModel()`: associated
  rate (power-law-weighted mean association probability × flare rate),
  background rate (FGK: fills to cycle target; M-dwarf: activity-norm
  scaled), and total rate.
- Recalibrated `baseCmeProbability()` from a hardcoded if/else chain
  to a data-driven `CME_PROBABILITY_BREAKS` table with updated values
  (micro-flares 0.02→0.005, super-flares 0.5→0.75).
- Replaced hard CME cutoff logic in `maybeSpawnCME()` with a smooth
  `cmeSaturationFactor()` that gradually reduces probability as
  recent count exceeds the target.
- Added `scheduleNextCme()` Poisson-process CME scheduler.
- Updated the visualiser flare/CME runtime to consume the v2 model:
  flare cadence follows energetic flare rate, while CMEs are
  scheduled from associated/background channels with separate queues
  and backlog guards.
- Updated Star page to show seven activity metrics: energetic flare
  rate, energetic flare recurrence, total flare rate (>10³⁰ erg),
  total flare recurrence, associated CME rate, background CME rate,
  and total CME rate.
- Added animated star visual preview on the Star page with real-time
  flare bursts and CME events driven by the activity model, rotating
  at 0.5 simulated days per second.
- Added schema migration for `star.activityModelVersion` (`v1` legacy,
  `v2` split-rate model) and persisted it through Star page
  apply/preset/reset flows.
- Added `data/stellarActivity/calibration.v2.json` as a v2
  stellar-activity calibration anchor dataset.
- Added `scripts/calibrate-stellar-activity.mjs` and
  `npm run calibrate:activity` for calibration regression checks.

**Tests** (tests/stellarActivity.test.js)

- New test: `computeStellarActivityModel` returns correct structure
  and rates for a Sun-like star (Teff 5770, age 4.6 Gyr).
- Rewritten CME throttling test validates soft-suppression curve
  instead of binary pass/fail.
- New test: nested `{ inputs, activity, display }` params accepted
  by `scheduleNextFlare`, `expectedRateAboveEnergyPerDay`, and
  `maybeSpawnCME`.
- New test: `flareCycleMultiplierFromCycle` returns 1.0 at midpoint
  (cycle 0.5) for all spectral bins.
- New test: `computeCmeRateModel` FGK associated + background matches
  cycle target envelope.
- New test: `scheduleNextCme` is deterministic with seeded RNG.

### Gas Giant Styles

**Fantastical styles removed, palette tuning**
(ui/gasGiantStyles.js, ui/store.js, tests/gasGiantStyles.test.js)

- Removed the 7 Fantastical gas giant styles; the style library now
  contains 17 Realistic styles only.
- Removed the `"exotic"→"crystal"` legacy alias from the store
  migration.
- Tuned colour palettes across all Realistic styles for higher
  saturation and contrast (Jupiter, Saturn, Neptune, Uranus, Hot
  Jupiter, etc.).
- Added `inferGasStyleFamily()` and `enrichGasStyleDef()` helpers.

### Splash Screen Toggle

**Persistent splash-screen opt-out**
(app.js, index.html, styles.css)

Added a "Splash" checkbox in the header controls that persists to
`localStorage`. When unchecked, the splash overlay is skipped
entirely and the app starts directly. Defaults to enabled.

### Initial State

**Empty initial world** (ui/store.js)

New worlds now start with no planets and no moons. The previous
default (one Earth-like planet "New Planet" and one Luna-like moon)
has been removed. Schema version advanced from 45 to 46.

- `clearAllData()` now removes all `worldsmith.*` localStorage keys
  (previously only removed backup keys), ensuring theme preferences,
  splash state, and visualizer flags are also reset.

### Internal

**Refactoring and deduplication**

- Extracted `eccentricityFactor(e)` (Wisdom 2004/2008 tidal heating
  function) from `engine/moon.js` and `engine/planet.js` into
  `engine/utils.js` as a single shared export.
- Extracted `escapeHtml()` from five UI files into `ui/uiHelpers.js`.
- Stellar population label shortened on the Star page: display value
  uses `shortPopulationLabel()` (e.g. "Pop I"), full label moved to
  meta text.
- "Exotic" style alias removed from `gasGiantStyles.js`
  `normalizeStyleId`; "storm" normalises to "neptune".
- About page changelog wording updated: "many real and fantastical
  types" changed to "many realistic types".

**CSS** (styles.css)

- Added `.header-controls` container and `.splash-toggle` component
  for the header splash opt-out checkbox.
- Added responsive `.top-nav__link` font scaling at 1640 px and
  1505 px breakpoints.
- Added `backdrop-filter: blur(8px)` to `button.small` and the
  splash overlay.
- Replaced `.brand__mark` gradient with `favicon.svg` background
  image.
- Added `.kpi--sun-preview` card styles with expandable animated
  canvas.
- Added `.rp-picker-progress` recipe-picker progress bar with
  animated fill and fade-out.
- Added `#viz-overlay` absolute-positioned overlay canvas for the
  cluster visualiser.
- Added `.viz-native-transition` progress bar and
  `.viz-offscale-note` positioned note for the visualiser.
- Added `.viz-help-overlay` modal with close button, two-column
  grid, and `<kbd>` styled shortcut keys.
- Added poster fullscreen layout improvements and disabled-state
  styling for the collapse button.

**New devDependencies**

- `three` (^0.183.1) — Three.js 3D library
- `@napi-rs/canvas` (^0.1.95) — native Node canvas for headless
  rendering in tests
- `pixelmatch` (^7.1.0) — pixel-level image comparison for visual
  regression

**New npm scripts**

- `npm run assets:three` — generate Three.js SVG sprite assets
- `npm run assets:celestial` — generate celestial preset manifest
- `npm run calibrate:activity` — stellar activity calibration check

## 1.13.0 — 2026-02-24

### Bug Fixes

**Star overrides not propagated to System page layout**
(engine/system.js, ui/systemPage.js, ui/visualizerPage.js,
ui/planetPage.js, ui/outerObjectsPage.js)

- `calcSystem` computed habitable zone, frost line, and inner limit
  from mass-derived luminosity and radius only, ignoring Advanced-mode
  R/L/T overrides and stellar evolution. Added optional
  `luminosityLsolOverride` and `radiusRsolOverride` parameters to
  `calcSystem`; all five UI call sites now resolve star properties via
  `calcStar` with full overrides before passing resolved L/R through.
- System Poster `calcStar` call only received mass and age — evolution
  mode, metallicity, and R/L/T overrides were missing. Gas giant poster
  calcs used the resulting non-evolved luminosity. Hoisted the
  `calcStar` call to the top of `render()` with full `getStarOverrides`
  propagation.
- System page star resolution now also passes `metallicityFeH` into
  `calcStar`, so evolved-mode metallicity-dependent outputs match the
  Star page's physics path.
- Rocky planet poster visuals (`calcPlanetExact`) received raw
  `p.inputs` instead of slot-AU-corrected inputs, so climate and sky
  colours were computed at the stored semi-major axis rather than the
  assigned orbit slot. Applied the `{ ...p.inputs, semiMajorAxisAu:
slotAu }` override pattern already used by the Visualiser.
- Moon parent planet inputs passed to `calcMoonExact` on the System
  page also lacked the slot-AU override. Added a
  `correctedInputsByPlanetId` lookup built from assigned slot positions,
  matching the Visualiser's existing pattern.

**Tests** (tests/system.test.js)

- 4 new tests: luminosity override affects frost line and HZ, radius
  override affects inner limit and density, both overrides together,
  invalid overrides (negative, zero, NaN) fall back to mass-derived
  values

### Planet Visualisation System

**Unified rocky/gas/moon visualisation pipeline**
(ui/bodyRenderer.js, ui/renderUtils.js, ui/rockyPlanetStyles.js,
ui/gasGiantStyles.js, ui/moonStyles.js, ui/systemPage.js,
ui/visualizerPage.js, ui/apparentPage.js)

- Added a shared body-rendering pipeline so rocky planets, gas giants,
  and moons use one consistent rendering path across Planet, System
  Poster, Visualiser, and Apparent views.
- Centralised scale-aware rendering decisions and fallback behaviour so
  bodies keep consistent style and readability across different canvas
  sizes and page contexts.
- Unified profile-driven rendering hooks for all three body classes to
  reduce duplicate draw logic and keep cross-page visuals in sync.

### Gas Giant Visual Automation

**Auto-ring detection and style-sync for gas giants**
(ui/planetPage.js, ui/gasGiantStyles.js,
tests/gasGiantSuggest.test.js, tests/gasGiant-nasa-validation.test.js)

- Gas giant ring visibility is now auto-derived from physics output:
  `Dense`/`Moderate` ring optical-depth classes enable rings, otherwise
  rings are hidden.
- Planet page gas giant visuals now auto-sync style and ring state after
  edits and recipe application, removing manual style/ring drift from
  the physics model.
- Style suggestion now keeps Class I Saturn-mass, ring-prominent giants
  in the Saturn-like family while still allowing hazy candidates for
  high-metallicity cases.

### Debris Disk Engine & Outer Objects Page

**Resonance-sculpted debris disk physics** (engine/debrisDisk.js,
ui/outerObjectsPage.js)

Added a debris disk engine and dedicated Outer Objects page for
configuring asteroid-belt and Kuiper-belt-like zones. Disks are
auto-suggested from gas giant positions using mean-motion resonance
(MMR) placement across five priority levels, or from the frost line
when no gas giants are present.

The engine computes comprehensive disk properties from orbital
boundaries, host-star parameters, and gas giant positions:

- **Resonance placement** — Five priority tiers: primary outer belt
  (outermost giant 3:2→2:1 exterior MMR), primary inner belt
  (innermost giant 4:1→2:1 interior MMR), inter-giant gap disks,
  extended outer belt (2:1→5:2), and warm inner belt (8:1→4:1).
  Verified against Solar System: Kuiper belt 39.4–47.7 AU from
  Neptune, asteroid belt 2.06–3.28 AU from Jupiter.
- **Composition** — Condensation-sequence classification (Lodders 2003)
  from equilibrium temperature: Refractory silicate, Mixed rock/ice,
  Icy, or Ultra-cold. Twelve species from corundum (1700 K) to N₂ ice
  (22 K) with mass fractions.
- **Fractional luminosity** — Wyatt et al. (2007) steady-state maximum:
  f_max ∝ r^(7/3) × (Δr/r) × t^(-1). Optical depth derived from
  fractional luminosity.
- **Grain physics** — Radiation-pressure blowout size (Burns, Lamy &
  Soter 1979), Poynting-Robertson drag timescale, and collisional
  lifetime. Collision vs PR-drag dominance classification.
- **Mass estimation** — Dohnanyi (1969) cascade from optical depth, or
  user override with reverse-derived optical depth.
- **Collision dynamics** — Kepler velocity at midpoint, eccentricity-
  scaled collision velocity, and regime classification (gentle/
  erosive/catastrophic).
- **IR detectability** — 24 μm excess from Planck-function ratio of
  disk and star emission, with detection-threshold labels.
- **Zodiacal delivery** — PR-drag inflow rate of small grains toward
  the inner system.
- **Dynamical stability** — Chaotic-zone overlap check against gas
  giant positions using Wisdom (1980) zone widths.
- **Surface density** — Absolute value and ratio to the Minimum Mass
  Solar Nebula (MMSN) profile.

The UI page provides inputs for disk name, inner/outer edges (or
center + width), eccentricity, inclination, and optional mass override.
Auto-sync updates suggested disks when gas giant positions change.

**NASA validation** (tests/debrisDisk-nasa-validation.test.js)

Validated against Solar System asteroid belt and classical Kuiper belt
using observed values from Pitjeva & Pitjev (2018), JPL Kirkwood gap
diagrams, and Stern & Colwell (1997).

**Tests** (tests/debrisDisk.test.js,
tests/debrisDisk-nasa-validation.test.js)

- 68 tests: resonance suggestions (frost-line fallback, single/multi-
  giant placement, count limiting, overlap filtering), disk physics
  (temperature, composition, luminosity, mass, grains, collision
  regime, stability, IR excess, zodiacal delivery), NASA validation
  (asteroid belt and Kuiper belt properties)

**References**

- Wyatt, M. C. et al. (2007), "Steady State Evolution of Debris
  Disks around A Stars", ApJ 663, 365
- Dohnanyi, J. S. (1969), "Collisional Model of Asteroids and Their
  Debris", JGR 74, 2531
- Burns, J. A., Lamy, P. L. & Soter, S. (1979), "Radiation forces on
  small particles in the solar system", Icarus 40, 1
- Lodders, K. (2003), "Solar System Abundances and Condensation
  Temperatures of the Elements", ApJ 591, 1220
- Pitjeva, E. V. & Pitjev, N. P. (2018), "Mass of the Kuiper belt",
  Astron. Lett. 44, 554

## 1.12.0

### 3D Planet Splash Screen

**Interactive loading overlay with Three.js planet**
(ui/splashOverlay.js, app.js, styles.css, index.html)

Added a full-screen splash overlay shown on every page load. A 3D
model of the planet (`assets/planet.glb`, created in Blender) is
rendered via Three.js loaded lazily from the jsdelivr CDN. The planet
auto-rotates and can be grabbed and spun on its axis via OrbitControls
(rotation only — no zoom or pan). Biome colouring is applied at
runtime from vertex positions: ocean (blue), latitude-driven biomes
(tropical, savanna, desert, temperate, boreal, tundra, polar), and
elevation-based mountain/snow colouring. Clouds render as translucent
white, the atmosphere as a faint blue rim, and city lights as warm
amber dots on the night side. Day/night lighting uses a directional
sun with a dim cool-blue fill on the dark side.

The user dismisses the overlay by clicking "Enter WorldSmith", which
triggers a 0.5 s fade-out transition. All Three.js resources
(renderer, geometries, materials, controls) are disposed on dismiss.
If Three.js or the GLB fails to load, the enter button still appears
so the user is never blocked. Respects `prefers-reduced-motion` by
disabling auto-rotation.

- CSP updated: `wasm-unsafe-eval` added to `script-src`;
  `https://cdn.jsdelivr.net` added to `connect-src` for Draco decoder
- Three.js + GLTFLoader + DRACOLoader + OrbitControls loaded via
  dynamic `import()` from CDN with cached promise (retry on failure)
- Draco decoder forced to JS-only mode to avoid WASM CSP issues

### Rocky Planet Visual Rendering

**Physics-driven canvas visuals for rocky planets**
(ui/rockyPlanetStyles.js, ui/planetPage.js, ui/systemPage.js,
ui/visualizerPage.js, styles.css)

Rocky planets now render with the same visual richness as gas giants.
A new physics-driven rendering system translates engine-derived
properties (composition class, water regime, surface temperature,
tectonic regime, atmospheric pressure, vegetation, axial tilt) into
a layered canvas visual — no user-selectable style presets, everything
is determined by the planet's physics.

- **Surface palettes** — Seven composition classes (Earth-like,
  Mars-like, Mercury-like, Iron world, Coreless, Ice world, Ocean
  world) each with a three-tone colour palette
- **Oceans** — Coverage from water regime (Dry → 0, Shallow → 0.3,
  Extensive → 0.65, Global → 0.95, Deep → 1.0); frozen when T < 273 K
- **Ice caps** — Piecewise-linear extent from surface temperature with
  axial-tilt asymmetry between poles
- **Clouds** — Coverage from pressure × water vapour; Venus-like
  worlds get near-total yellowish cloud cover
- **Atmosphere rim** — Logarithmic thickness from surface pressure,
  coloured by sky colour
- **Terrain** — Cratered (stagnant + airless), worn (stagnant +
  atmosphere), continental (mobile), volcanic (episodic), or smooth
  (plutonic-squishy)
- **Vegetation** — Semi-transparent tinted patches near the equator
  for habitable worlds with vegetation hex values
- **Special effects** — Lava cracks (T > 1200 K), frozen crystalline
  highlight (T < 100 K + airless)
- **Tidal lock** — Terminator darkening on the far side
- **Deterministic** — Seeded RNG from planet name for reproducible
  rendering across reloads

Integrated into three rendering contexts: 180 px preview card on the
Planet page (matching the gas giant preview), the System Poster on the
Planetary System page, and the system Visualiser — all with
star-directed lighting and scale-aware detail simplification.

**Tests** (tests/rockyPlanetStyles.test.js)

- 44 new tests across 9 groups: palette (8), ocean (8), ice caps (5),
  clouds (3), atmosphere (4), terrain (5), special effects (3),
  vegetation (3), determinism and edge cases (5)

### Gas Giant Engine — Six New Physics Features

**Oblateness, mass loss, interior, age-radius cooling, ring properties,
and tidal effects** (engine/gasGiant.js, ui/planetPage.js)

Added six new physics subsystems to the gas giant engine, bringing it
closer to parity with the rocky planet engine. All six features are
computed from the existing user inputs (mass, radius, orbit, rotation,
star parameters) and appear in the derived-readout panel.

1. **Oblateness** — Rotational flattening via Darwin-Radau approximation
   with calibrated effective C/(MR²). Returns flattening, equatorial and
   polar radii, and J₂. Gas giants use log-mass interpolation between
   Saturn and Jupiter calibration points; ice giants use a
   density-dependent MOI. Equatorial gravity (GM/R_eq²) matches the NASA
   convention for surface gravity reporting.

2. **Atmospheric mass loss** — XUV-driven energy-limited escape (Ribas
   et al. 2005 power-law decay). Returns mass-loss rate (kg/s),
   evaporation timescale (Gyr), XUV flux at orbit, Roche lobe radius
   (Eggleton 1983), and overflow flag. Uses `starAgeGyr` (previously
   accepted but unused).

3. **Interior structure** — Heavy-element mass from Thorngren et al.
   (2016): M_Z = 49.3 × (M/Mj)^0.61 M⊕. Core mass capped at 25 M⊕
   (Juno constraint). Returns total heavy elements, estimated core mass,
   and bulk metallicity fraction.

4. **Age-dependent radius** — Fortney et al. (2007) cooling
   approximation: R(t)/R(5 Gyr) ≈ 1 + 0.1 × (5/t)^0.35. Hot Jupiters
   (T_eq > 1000 K) receive proximity inflation (+0.1 to +0.3 Rj).
   Returns suggested radius, inflation factor, and diagnostic note.

5. **Ring properties** — Temperature-dependent composition (Icy < 150 K,
   Mixed 150–300 K, Rocky > 300 K). Mass scaled from Saturn:
   3×10¹⁹ × (M/M_Saturn)^0.5 kg. Returns ring type, composition,
   estimated mass, optical depth class, and radial extent.

6. **Tidal effects** — Locking timescale ∝ a⁶ and circularisation
   timescale ∝ a^6.5, both compared to star age for locked/circularised
   flags. Hot Jupiters at 0.03 AU are tidally locked; Jupiter at 5.2 AU
   is not.

**Tests** (tests/gasGiant.test.js)

- 22 new tests: oblateness (5), mass loss (4), interior (3),
  age-radius (3), rings (3), tidal (4)

### Gas Giant NASA Validation

**Engine vs NASA/JPL factsheet comparison** (engine/gasGiant.js,
tests/gasGiant-nasa-validation.test.js)

Created a NASA validation test suite comparing engine outputs for
Jupiter, Saturn, Uranus, and Neptune against observed values from
NASA/JPL Planetary Fact Sheets (references/\*-factsheet.md). Ten
properties are compared per planet with error percentages displayed
in a summary table.

The Darwin-Radau oblateness model reduced flattening errors from
3.6–35.1% to under 0.3% for all four giants. Equatorial gravity
(GM/R_eq²) matches NASA's convention, reducing gravity error from
4.6–7.2% to under 0.5%. J₂ uses the first-order hydrostatic relation
(2f − q)/3 instead of the previous q/3 approximation.

| Property                | Before          | After |
| ----------------------- | --------------- | ----- |
| Flattening (worst)      | 35.1% (Neptune) | 0.3%  |
| Gravity (worst)         | 7.2% (Uranus)   | 0.5%  |
| Fair comparisons ≤ 1.5% | 24/28           | 32/32 |

Effective temperature and bond albedo remain footnoted as model
limitations (Sudarsky classification vs real atmospheric properties).

**Tests** (tests/gasGiant-nasa-validation.test.js)

- 33 new tests: summary table (1), per-planet assertions for density,
  escape velocity, orbital period, orbital velocity, equatorial radius,
  polar radius, flattening, and equatorial gravity (8 × 4 planets)

**References**

- Ribas, I. et al. (2005), "Evolution of the Solar Activity over Time
  and Effects on Planetary Atmospheres", ApJ 622, 680
- Thorngren, D. P. et al. (2016), "The Mass–Metallicity Relation for
  Giant Planets", ApJ 831, 64
- Fortney, J. J. et al. (2007), "Planetary Radii across Cool Jupiters
  to Hot Neptunes", ApJ 659, 1661
- Eggleton, P. P. (1983), "Approximations to the Radii of Roche
  Lobes", ApJ 268, 368
- NASA/JPL Planetary Fact Sheets (science.nasa.gov)

### Lagrange Points in the System Visualiser

**L1–L5 equilibrium point overlay** (engine/lagrange.js, ui/visualizerPage.js)

Added a toggle-able Lagrange point overlay to the system visualiser.
When enabled, L4/L5 Trojan points appear as small teal diamonds on every
body's orbit. Clicking a body promotes the display to all five L-points
(L1–L5) rendered as labelled cross markers. L1/L2 use the Hill sphere
approximation; L3 uses the restricted three-body mass-ratio correction;
L4/L5 are the exact equilateral points at +/-60 degrees.

- Teal/cyan colour (`rgba(80,200,200,X)`) distinct from purple Hill
  spheres, green HZ, and blue frost line
- Works with log/linear scale, eccentric orbits, and 3D rotation
- Separate render blocks for gas giants (Jupiter-mass units) and rocky
  planets (Earth-mass units)

**Tests** (tests/lagrange.test.js)

- 9 new tests: Earth-Sun and Jupiter-Sun Hill radii, L4/L5 symmetry,
  L3 mass correction, monotonicity, and invalid-input guards

### Metallicity in Local Cluster Star Generation

**Per-system [Fe/H] assignment** (engine/localCluster.js,
ui/localClusterPage.js, ui/vizClusterRenderer.js)

Each generated star system now receives a metallicity value based on
galactic position and spectral class. The mean [Fe/H] is shifted by a
radial gradient (-0.06 dex/kpc, Luck & Lambert 2011) and a vertical
gradient (-0.30 dex/kpc, Schlesinger et al. 2014), with per-class
offsets (O/B slightly metal-rich, brown dwarfs slightly metal-poor) and
Gaussian scatter (sigma 0.20 dex, Nordstrom et al. 2004). The home
system uses the value set on the Star page.

- [Fe/H] and P(giant) columns added to the system coordinates table
- Giant planet probability per system via Fischer & Valenti (2005):
  P = 0.1 x 10^(2 x [Fe/H])
- Cluster visualiser labels now show [Fe/H] on hover and when labels
  are enabled
- Deterministic generation via Box-Muller transform on the existing
  Park-Miller PRNG (phase offset 37)

**Tests** (tests/localCluster.test.js)

- 8 new tests: determinism, physical range, home system override,
  solar neighbourhood mean, radial gradient direction, seed variation

**References**

- Nordstrom, B. et al. (2004), "The Geneva-Copenhagen survey", A&A 418
- Luck, R. E. & Lambert, D. L. (2011), "The Distribution of the
  Elements in the Galactic Disk", AJ 142, 136
- Schlesinger, K. J. et al. (2014), "The Vertical Metallicity Gradient
  of the Milky Way Disk", ApJ 791, 112
- Fischer, D. A. & Valenti, J. (2005), "The Planet-Metallicity
  Correlation", ApJ 622, 1102

### Stellar Evolution Engine

**Main-sequence luminosity, radius, and temperature evolution**
(engine/star.js, ui/starPage.js, ui/store.js)

Added a stellar evolution mode based on Hurley, Pols & Tout (2000)
analytical single-star evolution (SSE) formulae. When the "Evolved"
toggle is enabled on the Star page, the engine computes age-dependent
luminosity, radius, and temperature instead of the static Eker (2018)
mass–luminosity/mass–radius relations. Metallicity ([Fe/H]) feeds
into Tout et al. (1996) ZAMS baselines and Hurley evolution rates.

- **ZAMS baseline** — Tout et al. (1996) rational-function fits for
  zero-age main-sequence luminosity and radius as functions of mass
  and metallicity Z
- **MS lifetime** — Hurley (2000) eq. 4 for time to base of giant
  branch (t_BGB), with t_MS ≈ 0.95 × t_BGB
- **Luminosity evolution** — Parametric interpolation
  log(L/L_ZAMS) = α·τ + β·τ^η + γ·τ² with piecewise α_L, β_L from
  Hurley eqs. 19–20, constrained so L(τ=1) = L_TMS
- **Radius evolution** — log(R/R_ZAMS) = α·τ + γ·τ³ with α_R from
  Hurley, constrained so R(τ=1) = R_TMS
- **Temperature** — Stefan-Boltzmann: T = (L/R²)^0.25 × 5772 K
- **Override propagation** — Star R/L/T overrides from the evolved
  model flow through to planet insolation, surface temperature,
  habitable zone, and moon illumination via all UI call sites
- **Store schema** — Migrated to v45; new `evolutionMode` field
  ("zams" default, "evolved") persisted in localStorage
- **Star page toggle** — "Evolved" checkbox wired to applyFromInputs,
  updateWorld, Sol preset, and Reset handlers

**NASA validation** (tests/star-evolution-nasa-validation.test.js)

Validated against 9 benchmark main-sequence stars (Sun, Alpha Cen A/B,
Tau Ceti, 70 Oph A, Epsilon Eridani, 61 Cyg A, Sirius A, Pi3 Orionis)
with observed L, R, T from IAU 2015, Kervella+ 2017, Bond+ 2017, and
other interferometric sources. Also validated downstream propagation
to planet insolation and habitable zone boundaries.

| Metric          | Mean error | Max error |
| --------------- | ---------- | --------- |
| Luminosity (L)  | 9.8%       | 15.5%     |
| Radius (R)      | 1.1%       | 4.4%      |
| Temperature (T) | 1.7%       | 3.8%      |

R and T accuracy is near the practical ceiling of Hurley analytical
SSE. The ~10% mean L error is intrinsic to the polynomial fits
(Tout 1996 ZAMS baseline + Hurley evolution rates); sub-2% L accuracy
would require tabulated MIST/MESA isochrone grids.

**Tests** (tests/star.test.js, tests/star-evolution-nasa-validation.test.js)

- 22 new unit tests: feHtoZ conversion, ZAMS L/R values and
  monotonicity, MS lifetime scaling, evolved Sun at 4.6 Gyr,
  evolution-exceeds-ZAMS at mid-MS, age=0 matches ZAMS, calcStar
  evolved/zams mode fields, metallicity effects on lifetime and
  luminosity
- 10 NASA validation tests: per-star L/R/T assertions, ZAMS vs
  standard solar model, MS lifetime benchmarks, calcStar integration,
  evolved-vs-ZAMS comparison, metallicity effects, planet insolation
  propagation, HZ boundary shift, summary table with quality gates

**References**

- Hurley, J. R., Pols, O. R. & Tout, C. A. (2000), "Comprehensive
  analytic formulae for stellar evolution as a function of mass and
  metallicity", MNRAS 315, 543
- Tout, C. A. et al. (1996), "Rapid fitting formulae for the ZAMS",
  MNRAS 281, 257
- Eker, Z. et al. (2018), "Interrelated main-sequence mass–luminosity,
  mass–radius, and mass–effective temperature relations", MNRAS 479, 5491

## 1.11.1

### System Poster

**Dynamic solar system lineup visualization**
(ui/systemPage.js, styles.css)

Added a System Poster panel at the top of the Planetary System page.
The poster renders a poster-style lineup of all bodies in the current
system: the star as a glowing half-disk on the left, with rocky planets,
gas giants, debris disks, and moons arranged left-to-right by orbital
distance.

- **Body sizing** — Power-law scale so rocky planets remain visible
  next to gas giants (`(radiusKm / EARTH_R_KM) ^ 0.45`)
- **Gas giants** — Full banded rendering with rings, spots, and
  special effects via `drawGasGiantViz`
- **Rocky planets** — Radial gradient spheres using sky colours from
  the planet engine, lit from the star direction
- **Moons** — Stacked vertically below parent bodies with name labels
- **Habitable zone** — Semi-transparent green arc band curving around
  the star
- **Frost line** — Dashed vertical line
- **Debris disks** — Curved arc bands with irregular asteroid rock
  particles and fine dust, with name labels
- **Control panel** — Toggle visibility of labels, moons, habitable
  zone, frost line, debris disks, orbital guides, and starfield
- **Scale modes** — Logarithmic (default) and Linear scale toggle
- **Fullscreen** — Fullscreen API integration for immersive viewing
- **Export PNG** — Download poster as timestamped PNG
- **Collapsible** — Click header or arrow button to collapse/expand

## 1.11.0

### Apparent Size & Brightness

**Moon distance bug fix + angular diameters + multi-moon support**
(engine/apparent.js, ui/apparentPage.js)

Fixed a bug in moon apparent magnitude where the heliocentric distance
was squared (`home ** 2` instead of `home`). At 1 AU the error cancels
(log₁₀(1) = 0), but at 2 AU moons appeared ~1.5 mag too dim.

Added angular diameter computation for stars, planets, and moons.
Results are returned as arcseconds and a smart label that switches
between degrees, arcminutes, and arcseconds depending on magnitude.
All three tables on the Apparent Size page now include an angular
diameter column.

Replaced the single-moon selector with automatic multi-moon rendering:
the moon table now shows all moons assigned to the home world. A global
phase slider applies to every moon. Added a Sol System References panel
showing familiar objects (Sun, Full Moon, Venus, Jupiter, Mars, Sirius)
for comparison.

**Moon brightness calibration**
(engine/apparent.js, ui/apparentPage.js, ui/store.js, engine/moon.js)

Corrected default Moon Bond albedo from 0.136 to 0.11 (NASA factsheet).
Added Bond-to-geometric albedo conversion in the UI using phase integral
q ≈ 0.9 for regolith-covered rocky bodies. Updated the full-moon
reference magnitude from −12.67 to −12.74. Moon brightness ratio now
reads 1.0 for an Earth-like moon at 1 AU, matching observation.

Updated Bond albedo tooltip references across Moon and Planet pages to
match NASA factsheets: Mercury 0.068, Venus 0.77, Jupiter 0.343,
Moon 0.11.

**Tests** (tests/apparent.test.js, tests/nasa-validation.test.js)

- 18 apparent engine tests updated for geometric albedo 0.12
- 6 new NASA validation tests: absolute magnitudes for 7 planets,
  Sun/Moon from Earth (magnitude + angular diameter), planets at
  opposition, Galilean moons from Jupiter surface, summary table

### Sol System Preset Accuracy

**Updated 19 planets and moons to NASA/JPL reference values**
(ui/solPreset.js)

Audited every value in the Sol preset against NASA Planetary Fact
Sheets and JPL Solar System Dynamics. Corrected semi-major axes,
eccentricities, inclinations, densities, albedos, and rotation
parameters across 4 rocky planets, 4 gas giants, and 11 moons.

Notable fixes:

| Body    | Parameter | Old     | New     |
| ------- | --------- | ------- | ------- |
| Venus   | albedo    | 0.76    | 0.77    |
| Saturn  | radiusRj  | 0.843   | 0.862   |
| Uranus  | radiusRj  | 0.357   | 0.366   |
| Neptune | radiusRj  | 0.346   | 0.354   |
| Triton  | inc (°)   | 156.885 | 157.345 |
| Triton  | albedo    | 0.719   | 0.70    |

Gas giant radii were systematically ~2.2% too small because the old
values divided equatorial radius by Jupiter's equatorial radius
(71,492 km), but the engine converts back using volumetric mean
radius (69,911 km). Corrected all four to use equatorial / 69,911.

### Sky Canvas

**Angular size comparison chart with day/night toggle**
(ui/apparentPage.js, styles.css)

Added a canvas-based visualization to the Apparent Size page that
renders all system objects as disks at their true relative angular
sizes. The star is drawn with a radial gradient in its spectral
colour, moons as grey disks with albedo-scaled lightness and a
phase crescent that follows the moon phase slider, and planets as
brightness-scaled point-source dots with glow halos.

Dotted reference outlines overlay familiar Solar System objects
(Sun, Luna, Venus, Jupiter, Mars) for intuitive comparison. The
Sol outline on the star uses a high-contrast dark stroke when the
star disk is larger than the Sun, switching to a light stroke when
smaller. When the star is more than 10× larger than any other
object, a split scale is used: the star appears at reduced scale
on the left with moons and planets at full scale on the right.

A Night/Day toggle switches the background between a starfield and
the home world's computed sky colour (zenith-to-horizon gradient
from the planet engine's spectral/pressure sky model). All labels
use drop shadows for legibility against any sky background.

## 1.10.0

### Rocky Planet Composition

**CMF/WMF-driven interior model with seven composition classes**
(engine/planet.js, ui/planetPage.js, ui/store.js)

Replaced the old density-floor formula with a full interior
composition model driven by Core Mass Fraction (CMF) and Water Mass
Fraction (WMF). The mass–radius relation uses Zeng et al. (2016) CMF
scaling with a mass-dependent compression exponent calibrated to
Solar System data:

    R(M, CMF) = (1.07 − 0.21 × CMF) × M^α
    α(M) = min(1/3, 0.257 − 0.0161 × ln M)

Solar System validation: Mercury 0.3% error, Venus 0.8%, Earth 0.2%,
Mars 0.5%. The old formula was 16–21% off for iron-rich sub-Earths.

Seven composition classes are derived from CMF/WMF thresholds:

| Class        | Condition   | Example      |
| ------------ | ----------- | ------------ |
| Ice world    | WMF > 10%   | Europa       |
| Ocean world  | WMF 0.1–10% | —            |
| Iron world   | CMF > 60%   | —            |
| Mercury-like | CMF 45–60%  | Mercury      |
| Earth-like   | CMF 25–45%  | Earth, Venus |
| Mars-like    | CMF 10–25%  | Mars         |
| Coreless     | CMF < 10%   | —            |

Six water regimes (Dry through Ice world) describe surface hydrology.
CMF can be auto-suggested from stellar metallicity [Fe/H] via molar
mass balance (Schulze et al. 2021).

Core radius is derived from the Zeng & Jacobsen (2017)
approximation CRF = √CMF, and water-layer radius inflation uses a
Zeng & Sasselov (2016) interpolation between dry and 50%-water
endmembers.

Tidal rigidity and quality factor Q now scale continuously with
composition: silicate baseline 30 GPa with iron boost above CMF 0.33,
ice layers at 3.5 GPa, and Q ranging from 12 (low CMF) to ~47
(Mercury-like).

**References**

- Zeng, L. et al. (2016), "Mass–Radius Relation for Rocky Planets
  Based on PREM", ApJ 819, 127
- Zeng, L. & Jacobsen, S. B. (2017), "A Simple Analytical Model for
  Rocky Planet Interiors", ApJ 837, 164
- Zeng, L. & Sasselov, D. (2013), "A Detailed Model Grid for Solid
  Planets from 0.1 to 100 Earth Masses", PASP 125, 227
- Schulze, J. G. et al. (2021), "An Earth-like Stellar Abundances
  Proxy for Rocky Planet Composition", PSJ 2, 113

### Rocky Planet Atmosphere

**Ten-gas atmosphere model with three greenhouse modes**
(engine/planet.js, ui/planetPage.js)

Built a physically-grounded atmosphere system with ten gases across
three user-selectable modes:

| Mode   | Gases                                        |
| ------ | -------------------------------------------- |
| Manual | User sets greenhouse effect directly (0–500) |
| Core   | N₂, O₂, CO₂, Ar, H₂O, CH₄                    |
| Full   | Core gases + H₂, He, SO₂, NH₃ (expert gases) |

The greenhouse model computes optical depth τ from partial pressures
using functional forms grounded in published physics — logarithmic
for CO₂ and H₂O (band saturation, Myhre 1998), square-root for CH₄
(IPCC TAR). Coefficients are calibrated to simultaneously match
NASA Planetary Fact Sheet surface temperatures: Earth 288 K,
Venus 737 K, Mars 211 K.

Band-overlap suppression prevents double-counting where absorption
bands coincide: CO₂–H₂O overlap at k = 6, SO₂ at k = 8, NH₃ at
k = 20. Expert gases include H₂–N₂ collision-induced absorption
(CIA) for reducing atmospheres.

Mantle outgassing guidance (Ortenzi et al. 2020) suggests primary
species by oxidation state: highly reduced mantles outgas H₂ + CO,
Earth-like mantles outgas CO₂ + H₂O, and oxidised mantles add SO₂.

Additional atmosphere-derived outputs:

- **Sky colours** from a PanoptesV-inspired lookup table interpolated
  in OKLab colour space over star temperature and effective surface
  pressure, with CO₂ tint correction. Outputs high-sun and horizon
  colour pairs rendered as radial gradients.
- **Vegetation colours** from a spectral-class × pressure LUT with
  pale/deep pigment stops, insolation correction, and twilight
  variants for tidally locked K/M worlds.
- **Circulation cells** (1, 3, 5, or 7 Hadley cells) keyed to
  rotation period.
- **Atmospheric tide resistance** — when atmospheric thermal torque
  exceeds gravitational torque (b_atm ≥ 1), tidal synchronisation
  is prevented (explains Venus's slow retrograde rotation).
- **Liquid water feasibility** from Clausius–Clapeyron boiling point
  at the surface pressure and temperature.

**References**

- Myhre, G. et al. (1998), "New estimates of radiative forcing due
  to well mixed greenhouse gases", Geophys. Res. Lett. 25, 2715
- Ortenzi, G. et al. (2020), "Mantle redox state drives outgassing
  chemistry and atmospheric composition", Sci. Rep. 10, 10907
- Leconte, J. et al. (2015), "Asynchronous rotation of Earth-mass
  planets in the habitable zone of lower-mass stars", Science 347, 632

### Magnetic Field Model

**Self-normalised dynamo with dipolar/multipolar regimes**
(engine/planet.js, ui/planetPage.js)

The magnetic field model determines dynamo activity from CMF, planet
mass, age, and rotation period. Core solidification timescale uses
τ = 2 + 12 × CMF × √M Gyr, giving a three-phase convective boost:
ramping during early solidification, peaking at 50–85% solid fraction
(compositional convection), then exponentially suppressed as the
liquid shell thins.

A dipolar/multipolar transition at P_dip = 96√M × √(CMF/0.33) hours
determines whether the field is coherent (dipolar) or fragmented
(multipolar, 10× weaker). Field strength follows Olson & Christensen
(2006) scaling with buoyancy flux.

Solar System validation: 96% of rocky-planet fields within 5% of
observed values, 98% within 15%.

**References**

- Olson, P. & Christensen, U. R. (2006), "Dipole moment scaling for
  convection-driven planetary dynamos", EPSL 250, 561–571

### Tectonic Regime Probabilities

**Four-regime probability model** (engine/planet.js, ui/planetPage.js)

Assigns probability weights across four tectonic regimes — stagnant
lid, mobile lid (plate tectonics), episodic resurfacing, and
plutonic-squishy — using five multiplicative factors: mass, age,
surface water, CMF, and tidal heating. Each factor applies
Gaussian preference curves tuned to published GCM and geodynamic
results. The highest-probability regime is suggested with a
qualitative advisory.

### Divergences from Published Science

**22 documented deviations on the Science page** (ui/sciencePage.js)

Added a new section to the Science & Maths page cataloguing every
place where WorldSmith diverges from a single published formula.
Each entry states what was changed, why, and whether the deviation
is a simplification, calibration, or novel parameterisation. Covers
greenhouse coefficients, band-overlap suppression, mass–radius
exponent, core solidification, magnetic field phases, CRF
approximation, tectonic probabilities, atmospheric tides,
composition-dependent rigidity, vegetation extrapolation, spin-orbit
thresholds, flare rate binning, and more.

The Science page now documents 93 equations across 11 sections.

### NASA Validation Suite

**41 Solar System validation tests** (tests/planet-nasa-validation.test.js)

A dedicated test suite compares engine outputs for Mercury, Venus,
Earth, and Mars against NASA Planetary Fact Sheet data (compiled in
the references/ folder from JPL SSD and science.nasa.gov). Tests
cover density, radius, gravity, surface temperature, core radius,
composition class, magnetic field activity, habitable-zone
membership, and tidal evolution. Tolerance-based assertions use
percentage-error checks to allow for model approximations while
catching regressions.

### Light / Dark Theme

**Full light-mode theme with toggle** (styles.css, app.js, index.html,
STYLE_GUIDE.md)

Added a light theme activated via `data-theme="light"` on the root
element. All ~170 hardcoded `rgba()` colour values were extracted into
CSS custom properties using an RGB-channel technique:

| Variable          | Dark            | Light           |
| ----------------- | --------------- | --------------- |
| `--overlay-color` | `255, 255, 255` | `0, 0, 0`       |
| `--bg-rgb`        | `15, 18, 32`    | `240, 241, 245` |
| `--panel-rgb`     | `23, 27, 46`    | `255, 255, 255` |
| `--accent-rgb`    | `126, 178, 255` | `48, 112, 200`  |

A sun/moon toggle button in the header saves the preference to
localStorage and falls back to the OS `prefers-color-scheme` media
query. The moons.svg icon was updated from a hardcoded fill to
`currentColor` for theme compatibility.

Dark mode appearance is unchanged from 1.9.1.

### Tests

**448 tests total** (tests/)

- 79 planet model tests (composition, atmosphere, sky/vegetation
  colours, tectonic regimes, magnetic field)
- 41 NASA validation tests (Mercury, Venus, Earth, Mars)
- 36 moon tests (tidal heating, recession, composition overrides)
- Remaining tests cover star, system, calendar, apparent magnitude,
  local cluster, gas giants, debris disks, import/export, and
  utilities

## 1.9.1

### Cluster Import

**Paste-to-import for Local Cluster** (ui/localClusterPage.js)

Added an Import Cluster panel to the Local Cluster page. Users can
paste a tab-separated table of star systems (name, coordinates,
distance, constituents) to replace the generated neighbourhood with
custom data.

The parser handles:

- Tab-separated columns with optional header row
- Coordinates in `(x, y, z)` format
- Spectral types: main sequence (F9V, MV, KV), giants (MIII),
  brown dwarfs (L, T), white dwarfs (D)
- Multi-star systems via `+` separator (e.g. `MV + MV`, `L + L + T`)
- Trailing notes stripped (e.g. `MIII, originally GV`)
- Home system auto-detected from `(0, 0, 0)` coordinates
- Neighbourhood radius auto-expanded to fit farthest system
- System names preserved (including Unicode)

## 1.9.0

### Tidal Heating

**Wisdom (2008) eccentricity-accurate tidal dissipation model**
(engine/moon.js, ui/moonPage.js, ui/sciencePage.js)

Added a full tidal heating calculation for moons using the standard
Peale, Cassen & Reynolds (1979) formula with the Wisdom (2004/2008)
eccentricity function replacing the simple e² truncation:

    Ė = (21/2)(k₂/Q)(G M_p² R_m⁵ n / a⁶) · f(e)

The eccentricity function f(e) uses a polynomial series accurate to
<0.1% for e < 0.8, giving correct heating at high eccentricities
where the e² truncation underestimates by 5× at e=0.3 and 30× at
e=0.5.

Love number k₂ and quality factor Q are derived from bulk density
via a 10-point interpolation table spanning 0.5–8.0 g/cm³, with
rigidity interpolated in log-space for physical accuracy.

Outputs include total power (W), surface heat flux (W/m²), and flux
normalised to Earth's mean geothermal heat (0.09 W/m²).

### Composition Override System

**Interior-state-aware material properties** (engine/moon.js,
ui/moonPage.js, ui/store.js)

Bulk density is a reliable proxy for cold, geologically quiet moons,
but systematically underestimates heating for bodies with extreme
interiors. Two calibrated override classes address this:

| Class            | μ (GPa) | Q   | Calibration target | Accuracy |
| ---------------- | ------- | --- | ------------------ | -------- |
| Partially molten | 10      | 10  | Io (10¹⁴ W)        | ~1%      |
| Subsurface ocean | 0.3     | 2   | Enceladus (10¹⁰ W) | ~10%     |

A composition override dropdown on the Moon page allows users to
select from seven classes: Very icy, Icy, Mixed rock/ice, Rocky,
Iron-rich, Subsurface ocean, and Partially molten. "Auto (from
density)" is the default.

### Tidal Recession

**Orbital migration rate and fate** (engine/moon.js, ui/moonPage.js)

Computes da/dt from two competing tidal torques using the constant-
time-lag model (Leconte et al. 2010):

- **Planet tide** — when the planet spins faster than the moon
  orbits, angular momentum transfers outward (Earth–Moon: +3.8 cm/yr)
- **Moon tide** — eccentricity damping always drives inward migration

Linear extrapolation estimates time to Roche limit (inward) or Hill
sphere escape (outward). Output includes recession rate (cm/yr),
direction, and orbital fate.

### Solar System Validation

**NASA reference data and validation suite** (references/,
scripts/tidal-heating-validation.mjs)

Added 14 NASA factsheet reference files compiled from JPL Solar
System Dynamics and science.nasa.gov, covering the Sun, all eight
planets, Earth's Moon, the four Galilean satellites, Saturn's major
moons, and Triton.

A validation script tests WorldSmith predictions against observed
Solar System values:

| Body           | Override         | Predicted / Observed     |
| -------------- | ---------------- | ------------------------ |
| Io             | Partially molten | 1.01×                    |
| Enceladus      | Subsurface ocean | 1.11×                    |
| Europa         | —                | 1.42×                    |
| Earth's Moon   | —                | 0.91×                    |
| Moon recession | —                | 0.90× (3.5 vs 3.8 cm/yr) |

### Science Page Updates

**Two new equations** (ui/sciencePage.js)

Added Tidal Heating and Tidal Recession formulas to the Orbital
Mechanics section with full variable legends, the composition class
table, calibration rationale, and validation summary. The science
page now documents 66 equations across ten sections.

### Moon Page Enhancements

**New outputs and tooltips** (ui/moonPage.js)

- Six new KPI cards: Tidal Heating (total power, surface flux, Earth
  comparison), Orbital Recession (rate, direction), and Orbital Fate
- Expanded tooltips for Composition and Composition Override
  explaining the physical meaning of each class, when to use each
  override, calibration notes, and caveats

**Tests** (tests/moon.test.js)

- 36 moon tests total (up from 20), including:
- Io tidal heating ~10¹⁴ W order of magnitude
- Enceladus with Subsurface ocean matches ~1.6×10¹⁰ W
- Higher-order e: e=0.3 produces much more heating than e² truncation
- Earth–Moon recession ≈ 3.8 cm/yr outward
- Fast/slow planet spin → outward/inward recession
- Composition override uses correct μ/Q values
- Override null falls back to density-derived

**References**

- Peale, S. J., Cassen, P. & Reynolds, R. T. (1979), "Melting of Io
  by Tidal Dissipation", Science 203, 892–894
- Wisdom, J. (2004), "Spin-Orbit Secondary Resonance Dynamics of
  Enceladus", AJ 128, 484–491
- Wisdom, J. (2008), "Tidal dissipation at arbitrary eccentricity and
  obliquity", Icarus 193, 637–640
- Leconte, J. et al. (2010), "Tidal dissipation within hot Jupiters:
  a new appraisal", A&A 516, A64

## 1.8.1

### Atmospheric System & Greenhouse Effect Overhaul

**Three-mode greenhouse calculation** (engine/planet.js, ui/planetPage.js)

Overhauled the rocky planet atmospheric system with a new tiered
greenhouse effect model:

- **Core mode** — Derives the greenhouse optical depth (tau) from
  atmospheric composition using species-specific absorption
  coefficients for CO2, H2O, CH4, and H2-N2 collision-induced
  absorption (CIA). Includes cross-suppression logic: H2O contribution
  is reduced in CO2-dominated atmospheres (Venus-like), and SO2 is
  suppressed under high CO2 partial pressures.
- **Full mode** — Extends Core with additional trace gases (SO2, NH3,
  H2, He) for fine-grained control over exotic atmospheres.
- **Manual mode** — Bypasses all gas-based calculation and applies a
  user-specified greenhouse effect value directly.

Gas balance enforces physical consistency: the nine tracked gases
(N2, O2, CO2, Ar, H2O, CH4, SO2, NH3, He) always sum to 100%, with
N2 acting as the remainder gas.

### Sol Preset NASA Corrections

**Cross-referenced against NASA Planetary Fact Sheet**
(ui/solPreset.js, tests/importExport.test.js)

All Sol preset values audited and corrected to match the NASA
Planetary Fact Sheet:

| Body    | Field           | Old      | New       |
| ------- | --------------- | -------- | --------- |
| Mercury | Axial tilt      | 0.03°    | 0.034°    |
| Venus   | Eccentricity    | 0.0068   | 0.0067    |
| Venus   | Rotation period | 5832.0h  | 5832.5h   |
| Venus   | Argon %         | 3.5%     | 0.007%    |
| Earth   | Rotation period | 24.0h    | 23.934h   |
| Mars    | Eccentricity    | 0.0934   | 0.0935    |
| Mars    | O2 %            | 0.13%    | 0.146%    |
| Mars    | CO2 %           | 95.3%    | 95.32%    |
| Jupiter | Semi-major axis | 5.20 AU  | 5.203 AU  |
| Saturn  | Semi-major axis | 9.58 AU  | 9.583 AU  |
| Saturn  | Radius          | 0.84 Rj  | 0.843 Rj  |
| Uranus  | Semi-major axis | 19.2 AU  | 19.19 AU  |
| Uranus  | Radius          | 0.36 Rj  | 0.357 Rj  |
| Uranus  | Mass            | 0.046 Mj | 0.0457 Mj |
| Neptune | Semi-major axis | 30.05 AU | 30.07 AU  |
| Neptune | Radius          | 0.35 Rj  | 0.346 Rj  |

### Local Cluster Manual Editing

**Add/remove stars and companions** (ui/localClusterPage.js,
ui/store.js, ui/vizClusterRenderer.js, styles.css)

Added interactive editing to the Local Cluster page:

- **Random seed button** — generates a new random seed and
  regenerates the cluster in one click.
- **+/− buttons** on the Stellar Object Breakdown table — manually
  add or remove systems of any spectral class. Added systems receive
  random coordinates within the neighbourhood sphere (cube-root
  uniform-in-volume sampling with disk z-compression).
- **Right-click context menu** on the Star System Coordinates table —
  add or remove companion stars to change system multiplicity
  (single → binary → triple → quadruple, max 4 components). Users
  select the companion's spectral class from a visual menu.
- **Confirmation prompt** — Apply, Randomise, and Reset actions warn
  the user before discarding manual adjustments.
- **Visualiser sync** — manually added or modified systems appear
  correctly in the 3D cluster visualiser.

Adjustments are stored as a layered data model
(`clusterAdjustments`) on top of the engine-generated baseline and
persist across page navigation. They are cleared when Apply or Reset
regenerates the cluster from seed.

## 1.8.0

### Sky Colour Calculations

**Gravity, temperature, and CO₂ corrections** (engine/planet.js,
ui/planetPage.js)

Sky colours now account for atmospheric column density via scale height.
Lower gravity or higher surface temperature increases the column depth,
shifting colours toward thicker-atmosphere look-up table entries.
CO₂-rich atmospheres receive a warm amber tint, with strength
proportional to the square root of CO₂ fraction (perceptually gradual
curve, negligible at Earth-like 0.04%).

Effective pressure is computed as:

    P_eff = P_surface × (T / T⊕) × (g⊕ / g)

Colour interpolation uses OKLab space for perceptual uniformity. Two
KPI cards display the results: "Sky Colour (Sun High)" and "Sky Colour
(Low Sun)", each with a radial gradient swatch and hex value.

**References**

- PanoptesV radiative-transfer simulations
  (panoptesv.com/SciFi/ColorsOfAlienWorlds/AlienSkies.php)
- Bjorn Ottosson (2020), "A perceptual color space for image
  processing" (OKLab)

### Vegetation Colours (0.1–100 atm)

**Pressure-dependent plant colour range with tidally locked variants**
(engine/planet.js, ui/planetPage.js)

Plant colours now span 0.1 to 100 atm via log-pressure interpolation
across a two-dimensional look-up table keyed by spectral class (A0–M9)
and pressure (1, 3, 10 atm anchors). Below 1 atm the 1→3 atm trend is
reversed with 50% dampening; above 10 atm the 3→10 atm trend continues
with 50% dampening.

Tidally locked planets orbiting K- and M-class stars receive dedicated
twilight-adapted vegetation variants — paler, more tan/brown colours
reflecting permanent terminator-zone conditions where plants receive
only scattered and refracted starlight. An insolation-darkening factor
is applied to all variants: low-light environments favour
broader-spectrum absorption (darker pigments).

Output is a 6-stop gradient from pale to deep, with a Details button
revealing the full colour breakdown on hover.

**References**

- Kiang, N. Y. et al. (2007), "Spectral Signatures of Photosynthesis.
  II. Coevolution with Other Stars and the Atmosphere on Extrasolar
  Worlds", Astrobiology 7, 252–274
- Lehmer, O. R. et al. (2021), "Peak Absorbance Wavelength of
  Photosynthetic Pigments Around Other Stars From Spectral Optimization",
  Frontiers in Astronomy and Space Sciences 8, 689441
- Arp, T. B. et al. (2020), "Quieting a Noisy Antenna Reproduces
  Photosynthetic Light-Harvesting Spectra", Science 368, 1490–1495

### Science & Maths Reference Page

**New page** (ui/sciencePage.js)

A comprehensive reference documenting all 61 equations used across the
engine, organised into nine sections: Stellar Physics, Planetary
Physics, Orbital Mechanics, Photometry & Magnitudes, Atmosphere &
Colour, Stellar Activity, Calendar Systems, Local Cluster, and System
Architecture.

Each equation includes:

- LaTeX-rendered formula (via KaTeX, loaded on demand from CDN)
- Variable legend with units
- Plain-language explanation and calibration notes
- Citation to the originating paper or textbook

Seven interactive calculators are embedded for live exploration:
mass-to-luminosity, habitable zone, planet density, H-magnitude, flare
rate, leap cycles, and galactic habitable zone probability.

### Planet Temperature Accuracy

**Scaled surface divisor and recalibrated Sol preset**
(engine/planet.js, ui/solPreset.js)

The four-step temperature chain (Stefan-Boltzmann energy balance →
Eddington grey-atmosphere greenhouse → surface correction → fourth-root
recovery) is unchanged in structure, but the surface divisor — which
accounts for the temperature difference between the atmospheric
effective-emission level and the surface — now ramps with optical depth
instead of being a flat 0.9:

    surfDiv = 1 − (1 − 0.9) × min(τ, 1)

This gives 1.0 for airless bodies (τ = 0) and 0.9 for Earth-like or
thicker atmospheres (τ ≥ 1). The old flat divisor inflated airless-body
temperatures by ~2.7% (e.g. Mercury: +12 K, Mars: +7 K).

Sol preset values recalibrated against NASA Planetary Fact Sheet data:

| Planet  | Old GH | New GH | Model | NASA  | Error |
| ------- | ------ | ------ | ----- | ----- | ----- |
| Mercury | 0.0    | 0.0    | 440 K | 440 K | 0 K   |
| Venus   | 200.0  | 217.0  | 737 K | 737 K | 0 K   |
| Earth   | 1.65   | 1.19   | 288 K | 288 K | 0 K   |
| Mars    | 0.15   | 0.05   | 211 K | 210 K | +1 K  |

Bond albedos also updated to match NASA values (Mercury: 0.088 → 0.068,
Venus: 0.77 → 0.76).

### General UI Improvements

**Expandable KPI cards** (styles.css, all page files)

KPI output cards now expand on hover to reveal additional detail. The
card itself grows — background, borders, and gradients extend seamlessly
with the content. A `.kpi-wrap` container holds the grid slot while the
inner card lifts to `position: absolute`, overlaying neighbours without
pushing content below. A chevron indicator marks cards with hidden
detail. Closing is instant (no transition) to prevent layout shift.

**Contrast-aware text** (engine/utils.js, ui/planetPage.js,
ui/starPage.js)

Text colour on colour-swatch KPIs (sky colour, vegetation, star colour)
now automatically switches between dark and light based on WCAG 2.0
relative luminance of the background. A `data-light` attribute is
computed from `relativeLuminance(hex)` at a threshold of 0.18, and CSS
rules adjust label, value, meta, tooltip, and chevron colours
accordingly.

**Unified outputs and tooltips** (all page files)

Tooltip dictionaries expanded across all pages to cover new features
(gravity correction, CO₂ tint, twilight variants, greenhouse effect,
atmospheric composition). Engine files received JSDoc headers and
`@param`/`@returns` documentation for all exported functions.

## 1.7.0

### Unified Visualiser

The System Visualiser and Local Cluster Visualiser are now a single page.
Zoom out past the outermost system object and the view seamlessly transitions
into the 3D local stellar neighbourhood — no page navigation required. Zoom
back into the home star to return to the system view.

- **Single canvas, two modes** — the draw loop dispatches to either the system
  renderer or the cluster renderer based on the current mode. Controls in the
  dropdown swap dynamically (system toggles vs cluster toggles).
- **Zoom-based transitions** — shrink → mode switch → expand animation plays
  entirely on one canvas. A progress bar appears at the bottom as you
  approach the transition threshold.
- **First-load toast** — "Tip: Zoom out past the system to view your local
  stellar neighbourhood" appears until the user completes the transition once
  (tracked in localStorage).
- **Representative body zoom scaling** — planets, gas giants, and moons now
  grow proportionally as you zoom in on representative scale (zoom^0.4
  factor). Physical-scale mode is unchanged.
- Navigation consolidated: both top-nav and side-nav now show a single
  "Visualiser" entry instead of separate System / Cluster links.
- Cluster rendering extracted into `ui/vizClusterRenderer.js` as pure
  functions (no closure dependencies on page state).

### Stellar Metallicity [Fe/H]

**New input** (engine/star.js, ui/starPage.js)

Added stellar metallicity [Fe/H] as a worldbuilding input — a slider ranging
from −3.0 (extreme metal-poor halo) to +1.0 (super-metal-rich), defaulting to
0.0 (solar). Metallicity does not modify the Eker mass–luminosity or
mass–radius relations (their empirical scatter already includes metallicity
variation). Instead it drives two new downstream outputs:

- **Giant Planet Probability** — Fischer & Valenti (2005, ApJ 622, 1102)
  scaling: P = 10% × 10^(2·[Fe/H]). At solar metallicity the probability is
  ~10%; at [Fe/H] = +0.3 it rises to ~40%; at [Fe/H] = −0.5 it drops to ~1%.
  Baseline from Cumming et al. (2008, PASP 120, 531).
- **Stellar Population label** — Pop I (solar neighbourhood), Intermediate
  (old thin disk), Pop II (metal-poor halo/thick disk), or Metal-rich (inner
  disk).

Both appear as KPI cards in the Star page outputs panel.

**References**

- Fischer, D. A. & Valenti, J. (2005), "The Planet–Metallicity Correlation",
  ApJ 622, 1102–1117
- Cumming, A. et al. (2008), "The Keck Planet Search: Detectability and the
  Minimum Mass and Orbital Period Distribution of Extrasolar Planets", PASP
  120, 531–554

### Star Generation — Scientific Accuracy Overhaul

**Mass-Luminosity Relation** (engine/star.js)

Replaced the classical textbook three-piece approximation (L = 0.23 M^2.3 /
M^4 / 1.4 M^3.5) with the Eker et al. (2018, MNRAS 479, 5491) six-piece
empirical relation, calibrated from 509 detached eclipsing binary components.

The old formula significantly overestimated luminosity for K-dwarf and low-mass
M-dwarf stars — by 33–86% in the 0.5–0.9 Msol range — which cascaded to:

- Maximum age underestimated by 25–46% (e.g. a 0.70 Msol K5V star showed
  ~29 Gyr instead of ~46 Gyr)
- Habitable zone pushed ~25% too far out (HZ scales as sqrt(L))
- Effective temperature and spectral class off by ~1 subtype for K dwarfs

The new relation uses Eker's published exponents with coefficients adjusted to
enforce continuity at each mass boundary and to anchor L = 1.0 at M = 1.0 Msol
(all adjustments within Eker's quoted uncertainties).

| Segment                   | Mass range     | Exponent (alpha) |
| ------------------------- | -------------- | ---------------- |
| Fully convective M dwarfs | < 0.45 Msol    | 2.028            |
| Late-K / early-M          | 0.45–0.72 Msol | 4.572            |
| Solar-type (G/K)          | 0.72–1.05 Msol | 5.743            |
| F/A stars                 | 1.05–2.40 Msol | 4.329            |
| B stars                   | 2.40–7.0 Msol  | 3.967            |
| O / early-B               | > 7.0 Msol     | 2.865            |

**Mass-Radius Relation** (engine/star.js)

Replaced the simple power-law (R = M^0.8 for M < 1, R = M^0.57 for M >= 1)
with:

- M <= 1.0 Msol: Eker et al. (2018) quadratic from eclipsing binaries
  (R = 0.438 M^2 + 0.479 M + 0.075, normalised to R = 1.0 at M = 1.0)
- M > 1.0 Msol: R = M^0.57 (Demircan & Kahraman 1991), continuous at boundary

The quadratic improves radius accuracy for K dwarfs (e.g. Alpha Centauri B
error drops from +8% to +2%).

**Tooltips** (ui/starPage.js)

Updated Luminosity, Radius, Maximum Age, and override tooltips to cite the
Eker et al. (2018) source and explain the derivation method.

**Tests** (tests/star.test.js)

- Replaced old formula-branch tests with new Eker segment verification tests
- Added MLR continuity test across all 5 segment boundaries
- Added MLR monotonicity test across full mass range
- Added MRR continuity test at M = 1.0 boundary
- Added benchmark star accuracy tests: 61 Cyg A, epsilon Eridani, Alpha Cen A/B,
  Sirius A (all within 15% of observed luminosities; most within 10%)

**References**

- Eker, Z. et al. (2018), "Interrelated main-sequence mass–luminosity,
  mass–radius and mass–effective temperature relations", MNRAS 479, 5491–5511.
  arXiv:1807.02568
- Demircan, O. & Kahraman, G. (1991), "Stellar mass-luminosity and
  mass-radius relations", Ap&SS 181, 313–322
