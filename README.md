# WorldSmith Web 2.1.0

WorldSmith Web is a browser-based worldbuilding toolkit by Judas Brennan for generating stars, brown dwarfs, planetary systems, planets, moons, comets, Oort clouds, debris disks, local stellar neighborhoods, and supporting reference outputs for tabletop and fiction workflows.

This project is based on WorldSmith 8.0 by Artifexian.

## Current Highlights

- Consequence-aware destructive confirmations now explain what will change before deleting planets, moons, stars, calendar profiles, cluster items, or replacing browser data.
- The shell interaction model now treats dialogs and the mobile nav drawer consistently, with better focus handling, clearer route orientation, and a quieter accessibility surface.
- Star and Calendar now surface current-state summaries and inline guidance so dense editor workflows are easier to scan without tooltip hunting.
- Touch targets, tooltip behavior, and reduced-motion handling are now more usable across the sidebar, tutorials, and reference-heavy pages.
- Brown dwarfs now work as first-class objects across host-star authoring, orbiting giant companions, shared outputs, and the visualizer.
- Editable comets now have dedicated authoring, appearance previews, import/export support, and Local Frame rendering.
- System-wide Oort clouds now use a paper-backed baseline model with `Auto / Guided / Manual` controls and seeded long-period comet generation.
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
- Import/export with JSON, legacy WorldSmith 8.x XLSX import, and built-in presets.

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
- `About WorldSmith`

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
- `npm run check:ux-guardrails` - Verify the shell accessibility, overlay, and help-pattern contracts that keep the UX pass from drifting.
- `npm run check:bundle-budget` - Verify the built entry bundle, largest app-owned lazy chunk, and largest vendor-only lazy chunk stay within budget.
- `npm run lint` - Run ESLint.
- `npm run lint:fix` - Run ESLint with auto-fixes.
- `npm run format:check` - Check formatting with Prettier.
- `npm run format` - Apply Prettier formatting.
- `npm run serve` - Serve the built `dist/` folder locally.
- `npm run serve:dist` - Serve the built `dist/` folder locally for smoke testing.
- `npm run dev` - Build, serve, and rebuild `dist/` automatically for local development.
- `npm run test:engine` - Run engine-focused tests.
- `npm run test:ui` - Run UI-focused tests.
- `npm run test:browser:install` - Install the Playwright Chromium browser used by smoke tests.
- `npm run test:browser` - Run Playwright smoke tests against the built production app.
- `npm run test` - Run the full test suite with custom reporter output.
- `npm run test:report` - Generate `test-results.md`.
- `npm run check` - Run repo integrity, syntax, runtime dependency, mojibake, lint, format, and test checks.
- `npm run assets:runtime` - Sync KaTeX and Draco runtime assets into `assets/vendor/`.
- `npm run build` - Bundle production files into `dist/`.
- `npm run backup:live` - Create a zip backup of live deploy files in `Backup/`.
- `npm run profile:engine` - Run the engine profiling harness and compare against the checked-in baseline.
- `npm run release:verify` - Run checks, build, bundle budget verification, install Chromium if needed, and run browser smoke tests.

## Build Output

`npm run build` creates a production `dist/` folder:

- Bundled production JavaScript (`app.js`, route chunks as needed, worker bundle)
- Copied only the runtime files and assets needed for deployment
- `index.html` stamped with the current release and release-busted top-level runtime URLs
- `build-summary.json` with machine-readable entry and chunk-budget metadata for release verification
- `build-metafile.json` and `chunk-provenance.json` for chunk-level bundle analysis and provenance

## Data Storage and Safety

- World data is stored in browser storage, primarily IndexedDB with `localStorage` reserved for lightweight settings and migration markers.
- Debounced world saves are flushed when the tab is hidden or closed, reducing the risk of losing the latest edits during shutdown.
- If the current saved world becomes unreadable, the app now shows a recovery flow that clears only the broken current save while preserving backups.
- Imports create in-app restore points before replacement.
- Export/import JSON is the recommended way to move worlds between browsers or devices.
- Built-in presets are available for Sol, Realmspace, and Arrakis.
- Clearing browser site data removes local saves.

## Release Verification

- `npm run release:verify` is the automated pre-release gate.
- `npm run release:verify` now starts by validating repo integrity so CI fails early if required tracked files are missing from the pushed commit.
- `npm run release:verify` now includes the maintainability guardrail check, so oversized route shells and missing refactor seams fail before a release candidate is built.
- `npm run release:verify` now includes the UX guardrail check, so live-region misuse, unlabeled shell controls, and overlay/help contract drift fail before release.
- `npm run release:verify` is intended to work from a clean clone on Windows, macOS, and Linux without relying on machine-specific Git line-ending settings.
- `RELEASE_CHECKLIST.md` covers the manual clean-install, build-output, and browser-pass steps.

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
- `npm run check:ux-guardrails` is the fast source-level guardrail for shell accessibility and help-pattern contracts. Keep blocking overlays on `ui/overlayController.js`, keep tutorial panels non-modal, and do not reintroduce broad live regions on the app shell.

## Refactor Map

- `ui/starPage.js` is the route shell. Guided creation and preset actions live under `ui/star/`.
- `ui/planetPage.js` is the route shell. Guided flows, preset actions, and render helpers live under `ui/planet/`.
- `ui/calendarPage.js` is the route shell. Transfer/export flows, detail overlay logic, and rule-editor flows live under `ui/calendar/`.
- `ui/visualizerPage.js` is the route shell. Route chrome, focus summary rendering, and lower-level rendering helpers live under `ui/visualizer/`.
- `ui/worldStorage.js` remains the public persistence boundary. IndexedDB, legacy storage, and lifecycle flushing helpers live under `ui/worldStorage/`.

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
