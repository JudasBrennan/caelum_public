# WorldSmith Web 2.11.0

WorldSmith Web is a browser-based worldbuilding toolkit by Judas Brennan for generating stars, brown dwarfs, planetary systems, planets, moons, comets, Oort clouds, debris disks, local stellar neighborhoods, and supporting reference outputs for tabletop and fiction workflows.

This project is based on WorldSmith 8.0 by Artifexian.

## Current Highlights

- Planetary System diagnostics now show bounded host-frame orbital integrity context, including mutual-Hill spacing confidence for crowded or packed systems.
- Orbital architecture, moon tidal persistence, generation guidance, habitability persistence, parent ring/radiation context, timelines, and page explanations now share one bounded dynamical context.
- Guided orbit slots and moon parent assignment are clearer in the Planetary System viewer, with drag-to-move slot swaps, manual-to-guided slot inference, and visible locked-parent guidance.
- Stellar environment modelling now includes differential rotation, Rossby/activity coupling, stellar wind, UV bands, prebiotic UV context, and photochemical haze diagnostics.
- Planet and moon environments now share coupled forcing, magnetosphere, radiation, atmosphere ledger, climate-chemistry, cloud, carbon-cycle, ocean-chemistry, and biosignature-context diagnostics.
- The Validation page now ships a Science Verification Matrix that combines benchmark anchors with invariants, trend checks, boundary checks, cross-system coupling checks, unit checks, formula oracles, population checks, and release gates.
- Era timelines, visual auto-coverage, world snapshots, and visualizer summaries now consume the shared coupled-environment contexts instead of rebuilding separate science summaries.
- Planet and Moon outputs now include a top-level Era Timeline that presents past, current, and future physical-history entries with confidence and driver context.
- Planet and Moon output panels now use shared tabs, matching section names, Result Summaries, and an All view for users who prefer the original long-column scan.
- Planet visual editor coverage controls now show the current Auto percentages with short model reasons, and text/number inputs keep focus while editing.
- Planet selectors now show authored host-star or host-pair names instead of raw IDs, while very small cohesive moons can survive Roche-only crossings when material strength dominates.
- Celestial previews now rotate planets and moons around their tilted local axes, so axial tilt affects both pose and visible spin direction.
- Import/export now separates current-world actions, backup management, import validation, starter worlds, and danger-zone resets, with clearer preview, restore, backup-only import, and destructive cleanup flows.
- The splash screen now lets users enter immediately and no longer blocks app startup if the decorative 3D planet preview hangs in a browser-specific way.
- Backup previews now explain why a preview cannot be built, and Sol, Realmspace, and Arrakis starter worlds are normalized through the current import engine before use.
- Ocean-world high-pressure ice warnings now compare local seafloor pressure and estimated bottom-ocean temperature against the water liquidus boundary, with pressure-band fallback only when temperature is unconstrained.
- Rocky planets with substantial surface liquid now surface mean ocean depth and seafloor pressure context even when they are not exotic ocean worlds.
- The Science and Maths page now includes a WorldSmith-tailored ocean-floor water phase guide with the implemented dense-ice boundary, example model points, and uncertainty notes.
- Planet visuals can now be customized from the Planet page or Visualizer with draft-safe previews, presets, sparse overrides, seeded procedural variation, locks, and reset/randomize controls.
- The visual editor keeps science-derived auto visuals as the default while letting custom appearances persist through save, import/export, snapshots, the Visualizer, Apparent Size, and system posters.
- Visual editor color controls now stage native color-picker changes until Apply, keep compact swatches and hex fields aligned, and keep lock controls visible in dense rows.
- Star, Moon, Planet, and Calendar authoring now use compact workflow summaries, clearer first-screen context, and progressively disclosed output sections so dense pages are easier to scan.
- Star and Moon outputs now lead with plain-language Result Summaries before deeper KPI detail.
- Apparent Size and Brightness now prevents very bright night-side planets from being mislabeled as visible "Day and night" when their elongation makes daytime viewing impossible.
- The local dev server now falls forward to an available port when the requested port is busy, and targeted test runs can filter by filename.
- Star authoring now accepts spectral class text such as `G2V`, `K dwarf`, `sun-like`, `red dwarf`, and L/T/Y brown dwarf targets, then solves the nearest matching mass for the focused star or companion.
- Rocky planets, gas giants, debris disks, and comets now share AU controls that keep inner-system slider precision while still allowing distant bodies out to the million-AU model ceiling.
- Rocky-planet tidal locking estimates now use differentiated-body Love-number and inertia factors, bringing standalone planet and moon-context tidal outputs into closer agreement.
- The calendar builder supports structural intercalary periods before months, after months, at year end, or appended inside a month, with dedicated authoring, rendering, and export support.
- Holiday and festival rules follow authored calendar years correctly, support cyclic year intervals, and expose a Rule Audit workflow with preview, agenda, and trace surfaces.
- Calendar JSON, printable, and ICS flows preserve the updated calendar model more faithfully, and the Sol and Realmspace presets better demonstrate the shipped calendar structure.
- Consequence-aware destructive confirmations now explain what will change before deleting planets, moons, stars, calendar profiles, cluster items, or replacing browser data.
- The shell interaction model now treats dialogs and the mobile nav drawer consistently, with better focus handling, clearer route orientation, and a quieter accessibility surface.
- Star and Calendar now surface current-state summaries and inline guidance so dense editor workflows are easier to scan without tooltip hunting.
- Touch targets, tooltip behavior, and reduced-motion handling are now more usable across the sidebar, tutorials, and reference-heavy pages.
- Brown dwarfs now work as first-class objects across host-star authoring, orbiting giant companions, shared outputs, and the visualizer.
- Editable comets now have dedicated authoring, appearance previews, import/export support, and Local Frame rendering.
- System-wide Oort clouds now use a paper-backed baseline model with `Auto / Guided / Manual` controls and seeded long-period comet generation.
- Exotic planetary subtypes now layer conservative labels, evidence notes, and visual hints onto the unified planetary body model, including carbon-rich, ocean/water, lava, icy dwarf, chthonian, rogue, sub-Neptune, hycean, and inflated giant candidates.
- The Science and Maths page now has search and live filtering, making the growing reference catalogue much easier to navigate.
- Multistar home systems now work as a normalized first-class feature across binary, triple, and quad layouts, including paired quads, host-frame-aware editing, and whole-system visualizer overviews.
- Seeded random system generation can now draft complete star systems with curated names, AU-safe orbit allocation, and preserve/reroll strategies.
- Star modelling with metallicity, advanced R/L/T overrides, stellar evolution, and animated flare/CME preview.
- Planetary system generation with habitable zone, frost line, orbit-slot assignment, and system poster view.
- Rocky planets with composition, atmosphere, magnetic field, tectonics, sky/vegetation colours, periapsis/apoapsis temperatures, volatile sublimation flags, and gas giant resonance.
- Gas giants with eccentricity/inclination/tilt inputs, Christensen energy-flux dynamo, Chapman-Ferraro magnetopause with moon plasma inflation, per-species Jeans escape, and spin-orbit resonance.
- Moons with atmospheres, hydrosphere states, climate, geology, biosphere outputs, moon-specific habitability, and model-driven visual recipes.
- Guided creation flows for moons, rocky worlds, gas giants, and stars with Quick archetypes, staged recommendations, Recipes handoff, and goal-seeking guided search.
- Unified planet and moon habitability metrics with explicit surface-water, subsurface-water, chemistry, radiation, and persistence handling.
- Moon habitability now distinguishes surface-ocean, radiation-limited, and subsurface-ocean outcomes with explicit shielding, stability, and cool-star surface calibration.
- Star-owned XUV evolution now drives atmospheric escape, moon radiation, and star activity outputs more consistently.
- Science-aligned ring overrides for gas giants and rocky worlds, plus deterministic ring families with banding, gaps, lighting, and soft ring shadows.
- Unified body rendering pipeline across Planet, System Poster, Visualiser, and Apparent views.
- Resonance-driven debris disk suggestions and derived disk physics.
- Tectonics with mountain ranges, shield volcanoes, rift valleys, and seafloor spreading outputs.
- Climate zones with latitude-based Koppen classification, aridity profiles, and tidally-locked zone modelling.
- Population modelling with carrying capacity, logistic growth, land-use cascades, and Zipf rank-size distribution.
- Apparent size and brightness modelling for stars, planets, and moons.
- Calendar builder for solar, lunar, and lunisolar systems.
- Local cluster generator with editable nearby systems.
- Desktop sidebar with an expanded-by-default collapsible rail, light/dark mode toggle, and splash-screen toggle.
- Lessons page with 20-lesson progressive curriculum, Basic/Advanced toggle, and embedded mini-calculators.
- Science and Maths reference page with equations and interactive calculators.
- Import/export with JSON, legacy WorldSmith 8.x XLSX import, normalized starter presets, scoped current-world reset, backup-only import, and a manageable backup library.

## App Sections

- `Star`
- `Planetary System`
- `Planets`
- `Moons`
- `Other Objects`
- `Local Cluster`
- `Visualiser`
- `Import/Export`
- `Apparent Size and Brightness`
- `Tectonics`
- `Climate Zones`
- `Population`
- `Calendar`
- `Lessons`
- `Science and Maths`
- `Validation`
- `About WorldSmith`

## Ocean-World Phase Guide

WorldSmith's ocean-world warnings are now pressure-and-temperature estimates,
not fixed-depth labels. The Planet and Moon pages may show seafloor pressure,
estimated bottom-ocean temperature, the relevant water liquidus boundary, and a
short interpretation.

- Pressure depends on both ocean depth and local gravity. A 80 km ocean on a
  low-gravity world can sit at much lower pressure than the same depth on a
  super-Earth.
- Mean ocean depth is a model estimate from water inventory and surface liquid
  coverage. It can appear for ordinary wet rocky planets as well as explicit
  ocean-world subtype cards.
- Bottom-ocean temperature is deliberately shown as a range. It uses a
  conservative first-pass thermal profile with surface state, depth,
  geothermal/tidal heating, and ice-shell context where available.
- The liquidus pressure is the pressure where pure water crosses from liquid to
  a dense ice phase at the estimated bottom temperature. Below that boundary,
  high-pressure ice is not treated as stable for the current estimate.
- Hot deep oceans can remain liquid at pressures that sound enormous because
  the Ice VI and Ice VII melting boundaries rise strongly with temperature.
- If the app says `Pressure-only caution`, the bottom-ocean temperature is not
  constrained, so the warning is intentionally less certain than a
  phase-diagram result.

## Local Development

Install dependencies first:

```bash
npm install
```

Recommended development workflow:

```bash
npm run dev
```

Then open `http://127.0.0.1:4173`.

This command:

- builds the app into `dist-dev/`
- serves `dist-dev/` with the project static server
- watches the repo and rebuilds automatically when source or asset files change

Refresh the browser after a rebuild to see changes. This workflow does not inject Live Server reload scripts, so it remains compatible with the app's CSP.

For a production-style local serve without watch mode:

```bash
npm run build
npm run serve
```

Do not use the raw project root with VS Code Live Server. The app now relies on npm-managed modules that are bundled for browser delivery, and Live Server also injects an inline reload script that the CSP blocks.

## Developer Setup

Requirements:

- Node.js 20+ recommended
- npm

Install dependencies:

```bash
npm install
```

## NPM Scripts

- `npm run check:syntax` - Validate JavaScript syntax across the project.
- `npm run check:repo-integrity` - Verify required repo files are tracked and that `scripts/` and `tests/` do not hide untracked source files.
- `npm run check:runtime-deps` - Validate bundled runtime dependency configuration.
- `npm run check:mojibake` - Detect UTF-8 mojibake and replacement-character corruption in text files.
- `npm run check:maintainability` - Verify the largest route shells stay under line-count budgets and that the extracted Phase 3 seam modules still exist.
- `npm run check:compat-boundaries` - Verify legacy compatibility handling stays inside documented storage, import, migration, store, and engine adapter boundaries.
- `npm run check:compat-decommissioning` - Verify retained legacy compatibility paths have not been silently removed without a product decision, changelog entry, and test update.
- `npm run check:ux-guardrails` - Verify the shell accessibility, overlay, and help-pattern contracts that keep the UX pass from drifting.
- `npm run check:bundle-budget` - Verify the built entry bundle, largest app-owned lazy chunk, and largest vendor-only lazy chunk stay within budget.
- `npm run lint` - Run ESLint.
- `npm run lint:fix` - Run ESLint with auto-fixes.
- `npm run format:check` - Check formatting with Prettier.
- `npm run format` - Apply Prettier formatting.
- `npm run serve` - Serve the built `dist/` folder locally.
- `npm run serve:dist` - Serve the built `dist/` folder locally for smoke testing.
- `npm run deploy:ftp:dry-run` - Connect to the configured FTP webroot, compare remote file sizes, and report the `dist/` upload set without changing remote files.
- `npm run deploy:ftp` - Upload changed files from the built `dist/` folder to the configured FTP webroot. Requires `WORLDSMITH_FTP_HOST`, `WORLDSMITH_FTP_USER`, and `WORLDSMITH_FTP_PASSWORD`.
- `npm run dev` - Build, serve, and rebuild `dist/` automatically for local development.
- `npm run test:engine` - Run engine-focused tests.
- `npm run test:ui` - Run UI-focused tests.
- `npm run test:browser:install` - Install the Playwright Chromium browser used by smoke tests.
- `npm run test:browser` - Run Playwright smoke tests against the built production app, using `4174` by default and the next free local port if that port is busy.
- `npm run test` - Run the full test suite with custom reporter output.
- `npm run test:report` - Generate `test-results.md`.
- `npm run test:json` - Generate machine-readable test results in `test-results/test-results.json`.
- `npm run check` - Run repo integrity, syntax, runtime dependency, mojibake, maintainability, compatibility-boundary, compatibility-decommissioning, UX, lint, format, and test checks.
- `npm run science:verify` - Generate the Science Verification Matrix artifacts in `test-results/`.
- `npm run calibration:report` - Compatibility alias for `npm run science:verify`.
- `npm run assets:runtime` - Sync KaTeX and Draco runtime assets into `assets/vendor/`.
- `npm run build` - Bundle production files into `dist/`.
- `npm run backup:live` - Create a zip backup of live deploy files in `Backup/`.
- `npm run profile:engine` - Run the engine profiling harness and compare against the checked-in baseline.
- `npm run verify:science` - Run checks, regenerate the matrix, build, and verify bundle budgets.
- `npm run verify:release` - Run checks, regenerate the matrix, build, verify bundle budgets, install Chromium if needed, and run browser smoke tests.
- `npm run release:verify` - Compatibility alias for `npm run verify:release`.

## Build Output

`npm run build` creates a production `dist/` folder:

- Bundled production JavaScript (`app.js`, route chunks as needed, worker bundle)
- Copied only the runtime files and assets needed for deployment
- `index.html` stamped with the current release and release-busted top-level runtime URLs
- `build-summary.json` with machine-readable entry and chunk-budget metadata for release verification
- `build-metafile.json` and `chunk-provenance.json` for chunk-level bundle analysis and provenance
- `reports/science-verification-matrix.json`, `.md`, and `.html` for the bundled Validation page
- transitional `reports/model-calibration-report.json`, `.md`, and `.html` compatibility artifacts

## FTP Deployment

`npm run deploy:ftp` uploads the current `dist/` folder to the live static webroot. The script never stores credentials in the repo; set them in the release shell:

```powershell
$env:WORLDSMITH_FTP_HOST = "145.223.89.28"
$env:WORLDSMITH_FTP_USER = "<ftp-user>"
$env:WORLDSMITH_FTP_PASSWORD = "<ftp-password>"
$env:WORLDSMITH_FTP_PORT = "21"
$env:WORLDSMITH_FTP_REMOTE_DIR = "/domains/thebrokenwheel.co.uk/public_html/worldsmith"
```

Run `npm run deploy:ftp:dry-run` before every upload. The normal deploy compares remote file sizes and uploads only files that are missing or changed, while leaving stale remote files in place. Use `npm run deploy:ftp -- --force` only when deliberately overwriting every `dist/` file, and use `npm run deploy:ftp -- --delete` only when pruning stale files after the release backup and dry-run have been checked.

## Data Storage and Safety

- World data is stored in browser storage, primarily IndexedDB with `localStorage` reserved for lightweight settings and migration markers.
- Fresh saves and exports store planet-class bodies in the canonical `world.planetaryBodies` collection. Legacy rocky/gas-giant split collections are still read during migration, then restored as runtime compatibility projections where older modules need them.
- Old saves are normalized at storage, import, and migration boundaries before feature code consumes them. Add new legacy storage-key handling under `ui/worldStorage/`, legacy workbook parsing in `ui/legacyXlsxImport.js`, persisted shape migration in `ui/store/worldMigration.js`, and domain bridge code under `ui/store/compat/` or a narrow engine adapter.
- Compatibility projections exist only for older modules and transitional adapters. New route shells and feature modules should consume canonical store APIs instead of reading historical fields such as singleton `world.planet`/`world.moon` data directly.
- Do not remove an old data path as cleanup. Compatibility decommissioning requires a specific product decision, a changelog entry naming the removed path, current-world round-trip coverage, and a migration or backup story for users who may still have old saves.
- Canonical planet-class bodies may include optional subtype evidence fields when the authoring UI or import data provides them: `composition.carbonRichness`, `composition.bulkDensityGcm3`, `thermal.internalHeatFluxWm2`, `thermal.tidalHeatFluxWm2`, `history.strippedEnvelopeCandidate`, `history.migratedCloseIn`, and `history.rogueCandidate`. These fields are additive evidence for classification and visualization; old worlds that omit them still load unchanged.
- Debounced world saves are flushed when the tab is hidden or closed, reducing the risk of losing the latest edits during shutdown.
- If the current saved world becomes unreadable, the app shows a recovery flow that clears only the broken current save while preserving the Import/Export Backup Library.
- Imports, starter worlds, and backup restores create in-app restore points before replacement by default.
- The Import/Export page separates the current saved world, Backup Library, import validation, starter worlds, and full browser-data wipe actions. Starting fresh can preserve backups, backup deletion can preserve the current world, and full clear is isolated in the danger zone.
- Export/import JSON is the recommended way to move worlds between browsers or devices.
- Built-in presets are available for Sol, Realmspace, and Arrakis.
- Clearing browser site data removes local saves.

## Release Verification

- `npm run release:verify` is the automated pre-release gate.
- `npm run release:verify` now starts by validating repo integrity so CI fails early if required tracked files are missing from the pushed commit.
- `npm run release:verify` now includes the maintainability guardrail check, so oversized route shells and missing refactor seams fail before a release candidate is built.
- `npm run release:verify` now includes the compatibility-boundary guardrail through `npm run check`, so new legacy handling fails unless it lands in an approved boundary or an intentional transition budget.
- `npm run release:verify` now includes the compatibility-decommissioning guardrail through `npm run check`, so old-save paths cannot disappear without an intentional support decision and updated tests.
- `npm run release:verify` now includes the UX guardrail check, so live-region misuse, unlabeled shell controls, and overlay/help contract drift fail before release.
- The release checklist runs `npm run science:verify` early, immediately after version metadata is updated, so the Science Verification Matrix is reviewed before the deeper release gate begins.
- `npm run release:verify` regenerates the Science Verification Matrix so every release has current benchmark, invariant, trend, boundary, coupling, unit, oracle, population, browser, and release-gate evidence.
- `npm run release:verify` is intended to work from a clean clone on Windows, macOS, and Linux without relying on machine-specific Git line-ending settings.
- `RELEASE_CHECKLIST.md` covers the manual clean-install, build-output, and browser-pass steps.
- `filed-plans/EXOTIC_PLANETARY_SUBTYPES_PLAN.md` includes the subtype-specific manual smoke pass for old-world import, canonical save/export, Planet mobile behavior, Visualiser, System poster, unsupported-page guidance, and browser validation.

## Repository Hygiene

- Active files under `scripts/` and `tests/` are expected to be tracked in source control.
- Ignore rules are reserved for generated or machine-local outputs such as `dist/`, `dist-dev/`, `playwright-report/`, `test-results/`, and visual-regression failure artifacts like `tests/snapshots/*.actual.png` and `tests/snapshots/*.diff.png`.
- Visual regression reference fixtures in `tests/snapshots/*.raw` are part of the tracked test suite.
- If `npm run release:verify` depends on a local file that is not tracked, treat that as a repo bug and fix the repository state rather than relying on local drift.

## Maintainer Contract

- `npm run release:verify` is the ship gate. If it fails, fix the repo or runtime state before merging or releasing.
- New routes in `app.js` should default to lazy loading. Keep eager loading only when there is a measured startup reason, and extend direct-route smoke coverage when a route is added or reshaped.
- When a change touches a known large route shell, prefer landing it in the extracted seam modules first and let the route file remain orchestration.
- `npm run check:maintainability` is the fast source-level guardrail for those seam locations and hotspot budgets. It also runs inside `npm run check` and CI.
- `npm run check:compat-boundaries` is the source-level guardrail for legacy support. Keep old shape parsing in storage/import/migration owners, keep planetary body bridges under `ui/store/compat/`, and use narrow engine adapters before calculators.
- `npm run check:compat-decommissioning` is the source-level guardrail against accidental compatibility removal. Update it only when there is an explicit decision to stop supporting a named old shape, with tests and release notes in the same change.
- `npm run check:ux-guardrails` is the fast source-level guardrail for shell accessibility and help-pattern contracts. Keep blocking overlays on `ui/overlayController.js`, keep tutorial panels non-modal, and do not reintroduce broad live regions on the app shell.

## Refactor Map

- `ui/starPage.js` is the route shell. Guided creation and preset actions live under `ui/star/`.
- `ui/planetPage.js` is the route shell. Guided flows, preset actions, and render helpers live under `ui/planet/`.
- `ui/calendarPage.js` is the route shell. Transfer/export flows, detail overlay logic, and rule-editor flows live under `ui/calendar/`.
- `ui/visualizerPage.js` is the route shell. Route chrome, focus summary rendering, and lower-level rendering helpers live under `ui/visualizer/`.
- `ui/worldStorage.js` remains the public persistence boundary. IndexedDB, legacy storage, and lifecycle flushing helpers live under `ui/worldStorage/`.
- `ui/store/compat/` owns old-to-current world-shape and planetary body bridges. Engine compatibility input normalization belongs in narrow adapters such as `engine/planetaryBodyAdapters.js`; small calculation-local fallbacks stay documented beside their calculator.

## Runtime Dependencies

Critical client-side libraries are now sourced from the local npm install in development and bundled into the production build:

- Three.js for WebGL rendering and previews
- XLSX for WorldSmith 8.x workbook import
- KaTeX for formula rendering on the Science and Maths and Lessons pages

Static runtime assets required by these libraries are synced into `assets/vendor/` during `npm install` and before `npm run build`.

WorldSmith no longer relies on remote runtime fallbacks for core browser features. If a local runtime asset fails to load, the app surfaces a local-only error instead of loading a CDN substitute.

## Repository Layout

- `engine/` - Core calculation and physics modules.
- `ui/` - Page modules, renderers, state store, and UI utilities.
- `ui/lessons/` - 20-lesson curriculum modules.
- `tests/` - Node and Playwright test suites.
- `scripts/` - Build, backup, syntax check, and test reporter scripts.
- `assets/` - Static assets, including the splash planet model.

## Credits

- Artifexian YouTube: https://www.youtube.com/c/Artifexian
- WorldSmith 8.0 spreadsheet: https://docs.google.com/spreadsheets/d/1AML0mIQcWDrrEHj-InXoYsV_QlhlFVuUalE3o-TwQco/copy
- Chromant Desmos correction model: https://www.desmos.com/calculator/gcgvefvuc7

Community:

- Artifexian Discord: https://discord.com/invite/hPvqDBPkhg
- Judas Brennan Discord: https://discord.gg/f63SfkW7vh

## Changelog

See `CHANGELOG.md` for full release history and detailed change notes.
