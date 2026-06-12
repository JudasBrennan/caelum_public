// Compatibility boundary for persisted world-shape migration.
//
// The public facade preserves the Phase 1 migration re-exports while also
// exposing named helper boundaries for compatibility-focused tests and tools.

export { migrateWorld, normalizeWorld } from "../worldMigration.js";
export { SCHEMA_VERSION, defaultWorld, mergeWorldForMigration } from "../worldSchema.js";
export {
  applyCompatibilityStarShape,
  ensureLegacyMoonCollection,
  ensureLegacyPlanetCollection,
  migrateLegacyOutermostGasGiant,
  normalizeLegacyMoonInputs,
  normalizeLegacyPlanetInputs,
} from "./worldShapeMigrationHelpers.js";
