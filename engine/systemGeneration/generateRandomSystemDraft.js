import { buildKeepPlanetsRerollMoonsDraft, buildNamesOnlyDraft } from "./ambitiousDrafts.js";
import { normalizeRandomSystemRequest } from "./contracts.js";
import { runRandomSystemRepairLoop } from "./repairLoop.js";

export function generateRandomSystemDraft(request = {}, options = {}) {
  const normalized = normalizeRandomSystemRequest(request);
  switch (normalized.rerollMode) {
    case "reroll-names-only":
      return buildNamesOnlyDraft(normalized, options);
    case "keep-planets-reroll-moons":
      return buildKeepPlanetsRerollMoonsDraft(normalized, options);
    case "keep-stars-reroll-planets":
    case "fresh-draft":
    default:
      return runRandomSystemRepairLoop(normalized, options);
  }
}
