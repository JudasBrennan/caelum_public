# Store Compatibility Boundaries

This directory is the home for store-level compatibility bridges between older
WorldSmith data shapes and the current canonical world model.

Compatibility modules may know about old field names, old collection layouts,
and transitional runtime projections. Normal feature modules should prefer
canonical store APIs and current world shapes.

## Rules

- Translate old shapes at storage, import, migration, or domain-owned adapter
  boundaries.
- Keep compatibility helpers domain-specific. Do not add a broad catch-all
  `legacy` module.
- Route shells should not introduce new legacy checks. Add or extend a boundary
  helper instead.
- Core calculators should receive canonical or adapter-normalized inputs.
- Preserve existing public exports until callers have been moved deliberately.

## Current Modules

- `planetaryBodyCompatibility.js` exposes the existing planetary body
  split-collection bridge as a named compatibility boundary.
- `worldShapeCompatibility.js` is the public world-shape compatibility facade.
  It preserves migration entry-point re-exports and exposes the named repair
  helpers.
- `worldShapeMigrationHelpers.js` contains the actual legacy star,
  planet/moon collection, historical gas-giant field, and old input backfill
  helpers used by `migrateWorld()`.

Keep migrating callers deliberately. Public feature code should continue to use
the canonical store APIs unless it is explicitly performing compatibility work.
