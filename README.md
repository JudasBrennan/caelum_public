# Caelum 3.7.0

Caelum is a browser-based worldbuilding toolkit by Judas Brennan for generating stars, brown dwarfs, planetary systems, planets, moons, comets, Oort clouds, debris disks, local stellar neighborhoods, and supporting reference outputs for tabletop and fiction workflows.

**Ex Nihilo, Astra** means "from nothing, the stars": start with a blank worldbuilding page and grow it into a physically grounded system.

This project is based on WorldSmith 8.0 by Artifexian.

## Repositories

- Main development repository: https://github.com/JudasBrennan/caelum
- Public runtime release repository: https://github.com/JudasBrennan/caelum_public

## Current Highlights

- Moon surfaces now combine coherent terrain, craters, fractures, vents,
  deposits, flows, dunes, liquids, haze, and plumes across previews, the
  Visualiser, and exported images.
- Gas giants, ice giants, sub-Neptunes, super-puffs, irradiated giants, and
  brown dwarfs now use layered atmospheric fields, stable storms, subtle
  weather motion, palette-aware bands, and softly fading limbs.
- Planet and moon visual controls now share stricter validation, honest
  diagnostics, effective Auto provenance, adaptive quality, and final-pixel
  preview/export consistency.
- Stars now expose track provenance, raw and photosphere-corrected effective
  temperatures, metallicity/alpha/rotation context, and MIST-backed
  main-sequence grid coverage with analytic fallback.
- Stellar outputs now separate physical track classification from the displayed
  observational MK estimate, including log g, luminosity class, bolometric
  magnitude, confidence, caveats, and subtype morphology offsets.
- The observational MK layer can use a bundled compact BOSZ reduced line-index
  grid for Balmer, Ca K, Mg 4481, metal-blanketing, molecular, helium, and
  rotation-broadening diagnostics without known-star runtime lookups.
- Spectral morphology calibration now has validation-only empirical fixtures,
  release gates, and calibration reports so runtime physics can be checked
  against templates without importing catalogue answers.
- The Sol preset Local Cluster now opens on an authored 25 light-year
  nearby-star catalogue while preserving normal cluster editing and visualiser
  behaviour.
- Stellar Neighbourhood Hazards is now a main-nav workspace for reading the
  saved system's external deep-time risk from nearby supernovae, stellar
  flybys, comet showers, dense-cluster stress, affected worlds, assumptions,
  and copy-ready reports.
- Local Cluster now feeds a Hazard Lens in the Visualiser, with optional
  supernova proxy shells, massive-star candidate highlights, a flyby/Oort inset,
  and a compact Spatial Read link from the Hazards page.
- System Fate is now easier to scan, opening on a focused first-read overview
  with current promise, future windows, major risks, endpoint context, and
  compact selected-body previews before the deeper timelines and rankings.
- Stars now expose analytic lifecycle tracks with stage timing, evolved
  luminosity/radius context, mass-loss/core-mass proxies, remnant endpoints,
  HZ migration, confidence labels, and model-limit caveats.
- Star, planet, moon, and System Fate views now include clearer
  birth-to-endpoint lifecycle timelines, while moons gain an Origin Pathway
  selector that feeds formation evidence without rewriting authored orbits.
- Moons now use deeper solid-body structure and material-response context for
  tides, geology, hydrosphere, atmosphere, magnetosphere, dynamo plausibility,
  and habitability caveats.
- Loading skeletons now cover route transitions and heavier generated previews,
  and high-value tooltips now follow the structured overview/source/caveat
  pattern from the style guide.
- Planets and moons now share a manual rocky-body composition inventory with
  inferred, reservoir, and expert-element modes.
- The composition editor can seed scientifically bounded starter values for
  reservoirs, major elements, and trace heat-producing elements, then leave
  users free to adjust them.
- Reservoir inventories now drive structure where the science supports it, and
  element inventories feed chemistry, diagnostics, validation, and downstream
  context without pretending to solve full mineralogy.
- Moon composition is now deeper: metal, silicate, water ice, volatile ice,
  carbonaceous, sulfur, salts, and major elements can influence hydrosphere,
  ocean chemistry, atmosphere sourcing, geology, magnetism, and visual context.
- Density validation for seeded or manual inventories now compares against the
  same compressed-density expectations used by the body solver, reducing false
  cautions for massive rocky planets.
- Earth-like water inventories now infer Earth-like surface ocean coverage from
  bounded basin-capacity and hypsometry context instead of requiring a manual
  ocean override.
- Europa-like icy moons can now surface replenished, non-breathable sputtered
  O2/H2 exospheres from parent-magnetosphere irradiation, with explicit abiotic
  oxygen cautions.
- Hydrosphere, carbon cycle, climate, productivity, ocean chemistry, tectonics,
  visual auto-coverage, timelines, and visualizer summaries now share the same
  surface-ocean coverage context.
- The Science Verification Matrix now carries active rows for Earth surface
  ocean coverage and icy-moon sputtered oxygen exospheres instead of treating
  those cases as accepted gaps.
- Planetary System diagnostics now show bounded host-frame orbital integrity context, including mutual-Hill spacing confidence for crowded or packed systems.
- Orbital architecture, moon tidal persistence, generation guidance, habitability persistence, parent ring/radiation context, timelines, and page explanations now share one bounded dynamical context.
- Guided orbit slots and moon parent assignment are clearer in the Planetary System viewer, with drag-to-move slot swaps, manual-to-guided slot inference, and visible locked-parent guidance.
- Stellar environment modelling now includes differential rotation, Rossby/activity coupling, stellar wind, UV bands, prebiotic UV context, and photochemical haze diagnostics.
- Planet and moon environments now share coupled forcing, magnetosphere, radiation, atmosphere ledger, climate-chemistry, cloud, carbon-cycle, ocean-chemistry, and biosignature-context diagnostics.
- The Validation page now ships a Science Verification Matrix that combines benchmark anchors with invariants, trend checks, boundary checks, cross-system coupling checks, unit checks, formula oracles, population checks, and release gates.
- Era timelines, visual auto-coverage, world snapshots, and visualizer summaries now consume the shared coupled-environment contexts instead of rebuilding separate science summaries.
- Planet and Moon outputs now include a top-level Era Timeline that presents past, current, and future physical-history entries with confidence and driver context.
- Planet and Moon output panels now use shared tabs, matching section names, Result Summaries, and an All view for users who prefer the original long-column scan.
- Planet and moon visual editor coverage controls now distinguish requested, constrained, and rendered percentages with short model reasons; stale worker results are ignored and text/number inputs keep focus while editing.
- Planet selectors now show authored host-star or host-pair names instead of raw IDs, while very small cohesive moons can survive Roche-only crossings when material strength dominates.
- Celestial previews now rotate planets and moons around their tilted local axes, so axial tilt affects both pose and visible spin direction.
- Import/export now separates current-world actions, backup management, import validation, starter worlds, and danger-zone resets, with clearer preview, restore, backup-only import, and destructive cleanup flows.
- The splash screen now lets users enter immediately and no longer blocks app startup if the decorative 3D planet preview hangs in a browser-specific way.
- Backup previews now explain why a preview cannot be built, and Sol, Realmspace, and Arrakis starter worlds are normalized through the current import engine before use.
- Ocean-world high-pressure ice warnings now compare local seafloor pressure and estimated bottom-ocean temperature against the water liquidus boundary, with pressure-band fallback only when temperature is unconstrained.
- Rocky planets with substantial surface liquid now surface mean ocean depth and seafloor pressure context even when they are not exotic ocean worlds.
- The Science and Maths page now includes a Caelum-tailored ocean-floor water phase guide with the implemented dense-ice boundary, example model points, and uncertainty notes.
- Planet visuals can now be customized from the Planet page or Visualizer with draft-safe previews, presets, sparse overrides, seeded procedural variation, locks, and reset/randomize controls.
- The shared visual editor keeps science-derived auto visuals as the default while sparse custom appearances—including dormant moon settings and exact-zero endpoints—persist through resets, presets, save/reload, import/export, snapshots, the Visualizer, Apparent Size, and system posters.
- Planet and moon diagnostics are generated only when requested, use bounded caches, and share the renderer's final masks; the editor modal is keyboard-contained, restores focus, and reflows without horizontal overflow on mobile.
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
- Moons with atmospheres, hydrosphere states, climate, geology, biosphere outputs, moon-specific habitability, and a trait-driven visual editor shared with planets.
- Guided creation flows for moons, rocky worlds, gas giants, and stars with Quick archetypes, staged recommendations, Recipes handoff, and goal-seeking guided search.
- Unified planet and moon habitability metrics with explicit surface-water, subsurface-water, chemistry, radiation, and persistence handling.
- Moon habitability now distinguishes surface-ocean, radiation-limited, and subsurface-ocean outcomes with explicit shielding, stability, and cool-star surface calibration.
- Star-owned XUV evolution now drives atmospheric escape, moon radiation, and star activity outputs more consistently.
- Science-aligned ring overrides for gas giants and rocky worlds, plus deterministic ring families with banding, gaps, lighting, and soft ring shadows.
- Unified, worker-parity body rendering across Planet, Moon, System Poster, Visualiser, and Apparent views, with coherent surface/material maps, diagnostic inspection, and persistent sparse appearance overrides.
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
- `System Fate`
- `Lessons`
- `Science and Maths`
- `Validation`
- `About Caelum`

## Ocean-World Phase Guide

Caelum's ocean-world warnings are now pressure-and-temperature estimates,
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
- `npm run check:dependency-security` - Audit production dependencies, reject unwaived High/Critical findings or expired waivers, and write audit/inventory release evidence under `test-results/`.
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
- `npm run deploy:ftps:dry-run` - Connect using certificate-verified explicit FTPS, compare SHA-256 hashes, and report the `dist/` transaction without changing remote files.
- `npm run deploy:ftps` - Stage, hash-verify, cut over, and post-verify the built `dist/` folder using encrypted FTPS control and data channels.
- `npm run deploy:ftp` / `npm run deploy:ftp:dry-run` - Compatibility aliases for the same FTPS-only implementation; they do not enable plaintext FTP.
- `npm run dev` - Build, serve, and rebuild `dist/` automatically for local development.
- `npm run test:engine` - Run engine-focused tests.
- `npm run test:ui` - Run UI-focused tests.
- `npm run test:browser:install` - Install the Playwright Chromium browser used by smoke tests.
- `npm run test:browser` - Run Playwright smoke tests against the built production app, using `4174` by default and the next free local port if that port is busy.
- `npm run ui:review` - Run the Phase 9 Playwright screenshot review and regenerate `test-results/ui-review/metrics.json`.
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
- `npm run verify:release` - Run the production dependency-security gate, checks, matrix generation, build and bundle verification, and browser smoke tests.
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

## FTPS Deployment

`npm run deploy:ftps` uploads the current `dist/` folder using explicit FTPS. TLS is established and the server certificate/hostname are validated before credentials are sent; `PROT P` encrypts uploads, downloads, and directory listings. There is no plaintext or certificate-bypass fallback. Credentials are never stored in the repo or printed by dry-run output; set them only in the release shell:

```powershell
$env:WORLDSMITH_FTP_HOST = "<certificate-matching-ftps-hostname>"
$env:WORLDSMITH_FTP_USER = "<ftp-user>"
$env:WORLDSMITH_FTP_PASSWORD = "<ftp-password>"
$env:WORLDSMITH_FTP_PORT = "21"
$env:WORLDSMITH_FTP_REMOTE_DIR = "/domains/thebrokenwheel.co.uk/public_html/caelum"
$env:WORLDSMITH_FTPS_TIMEOUT = "30"
# Optional only for a provider/private CA that is not in the system trust store:
$env:WORLDSMITH_FTPS_CA_FILE = "C:\path\to\provider-ca.pem"
```

Use the provider hostname present in the server certificate. Do not substitute a raw IP address unless that IP is explicitly covered by the certificate SAN.

Run `npm run deploy:ftps:dry-run` before every upload. The dry run inventories the remote tree and downloads expected files over the encrypted data channel to compare full SHA-256 hashes, so it can take longer than a size-only check. It also refuses to continue when a prior `.worldsmith-deploy-*` lock or transaction artifact needs manual recovery.

A real deployment derives a deterministic ID from the complete build manifest and publishes the full tree under `_worldsmith/releases/<manifest-sha256>/`. Namespace files are write-once: matching files are reused, an interrupted incomplete namespace can be resumed after its transaction artifacts are reviewed, and any existing hash mismatch blocks instead of being overwritten. A deterministic completion manifest is uploaded last and the entire namespace is hash-verified before cutover. The generated root `index.html` points every runtime resource at that immutable namespace; it is the only live runtime file replaced. Before cutover, the deployer uses harmless probe files to require same-directory `RNFR`/`RNTO` replacement-over-existing support. Therefore a lost process or response leaves the root pointer on either the complete old release or the complete new release, never a mixture of top-level runtime files.

The stable root site shell (`.htaccess`, `robots.txt`, `sitemap.xml`, and the Open Graph/Twitter image) is installed only when absent and otherwise hash-verified. A mismatch blocks normal deployment and must be handled as a separate, explicitly authorized provider-side site-shell update. Prior immutable namespaces and legacy root assets are retained for old tabs and recovery. `--force` only re-verifies write-once content, while the compatibility `--delete` option deliberately prunes nothing; release pruning requires a separate retention design.

The hosting account must support certificate-valid explicit FTPS, private data channels, `RETR`/`STOR`, `MLSD`, exclusive `MKD`, `RMD`/`DELE`, and same-filesystem `RNFR`/`RNTO` replacement of an existing file. If those capabilities are unavailable, deployment is blocked. After the first release-owner-approved encrypted test deployment succeeds, rotate the deployment credentials and record that external action in the release record.

## Dependency Security Policy

`security/dependency-security-policy.json` is the only production advisory waiver list. A waiver must identify the exact advisory and installed `node_modules/` path, compensating controls, owner, and expiry date. Unknown fields, malformed paths, expired waivers, and unwaived High/Critical production findings fail closed. CI and `npm run verify:release` run the gate and retain `npm-audit-production.json` plus a deterministic lockfile-derived production dependency inventory as release evidence.

## Data Storage and Safety

- World data is stored in browser storage, primarily IndexedDB with `localStorage` reserved for lightweight settings and migration markers.
- Fresh saves and exports store planet-class bodies in the canonical `world.planetaryBodies` collection. Legacy rocky/gas-giant split collections are still read during migration, then restored as runtime compatibility projections where older modules need them.
- Old saves are normalized at storage, import, and migration boundaries before feature code consumes them. Add new legacy storage-key handling under `ui/store/worldStorage/`, legacy workbook parsing in `ui/legacyXlsxImport.js`, persisted shape migration in `ui/store/worldMigration.js`, and domain bridge code under `ui/store/compat/` or a narrow engine adapter.
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
- `npm run release:verify` now fails on unwaived High/Critical production dependency findings or any expired dependency waiver and emits machine-readable audit/inventory evidence.
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
- `ui/store/worldStorage.js` is the persistence boundary. IndexedDB, legacy storage, and lifecycle flushing helpers live under `ui/store/worldStorage/`.
- `ui/store/compat/` owns old-to-current world-shape and planetary body bridges. Engine compatibility input normalization belongs in narrow adapters such as `engine/planetaryBodyAdapters.js`; small calculation-local fallbacks stay documented beside their calculator.
- `scripts/import-layer-policy.mjs` defines the enforced dependency direction: engine is independent, store/compat may depend on engine, UI domain modules may depend on store/engine, and page shells sit above those layers. `npm run check:import-direction` prevents reverse edges.

## Runtime Dependencies

Critical client-side libraries are now sourced from the local npm install in development and bundled into the production build:

- Three.js for WebGL rendering and previews
- SheetJS CE 0.20.3 for WorldSmith 8.x workbook import, vendored as an integrity-checked tarball under `vendor/`
- KaTeX for formula rendering on the Science and Maths and Lessons pages

Static runtime assets required by these libraries are synced into `assets/vendor/` during `npm install` and before `npm run build`.

Caelum no longer relies on remote runtime fallbacks for core browser features. If a local runtime asset fails to load, the app surfaces a local-only error instead of loading a CDN substitute.

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
- Judas Brennan Discord: http://discord.gg/aZzaR3DjsG

## Changelog

See `CHANGELOG.md` for full release history and detailed change notes.
