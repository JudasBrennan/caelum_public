import { normalizeWorld } from "./store/worldMigration.js";

export function createStarterPresetEnvelope(worldLike) {
  return { world: normalizeWorld(worldLike) };
}
