// SPDX-License-Identifier: MPL-2.0
// Shared climate-stability helpers for rocky-world habitability metrics.

import { clamp, toFinite } from "../utils.js";
import { climateLivabilityScore, habitabilityFraction } from "./climateLivability.js";

export function climateStatePenaltyFor(climateState = "Stable") {
  switch (String(climateState || "Stable")) {
    case "Snowball":
      return 0.35;
    case "Moist greenhouse":
      return 0.2;
    case "Runaway greenhouse":
      return 0.02;
    case "Stable":
    default:
      return 1;
  }
}

export function resolveClimateStability({
  climateState = "Stable",
  climateLivabilityFraction = 1,
  collapsePenalty = null,
} = {}) {
  const notes = [];
  const livabilityFraction = clamp(toFinite(climateLivabilityFraction, 1), 0, 1);
  const livabilityScore = climateLivabilityScore(livabilityFraction);
  const climateStatePenalty = climateStatePenaltyFor(climateState);
  const resolvedCollapsePenalty =
    collapsePenalty == null ? 1 : clamp(toFinite(collapsePenalty, 1), 0, 1);

  if (collapsePenalty == null) notes.push("collapse-model-pending");

  return {
    climateLivabilityFraction: livabilityFraction,
    climateLivabilityScore: livabilityScore,
    climateStatePenalty,
    collapsePenalty: resolvedCollapsePenalty,
    stabilityMultiplier: clamp(
      climateStatePenalty * livabilityScore * resolvedCollapsePenalty,
      0,
      1,
    ),
    notes,
  };
}

export function evaluateClimateLivability({
  zones = [],
  climateState = "Stable",
  tidallyLockedToStar: _tidallyLockedToStar = false,
  pressureAtm: _pressureAtm = 1,
  collapsePenalty = null,
} = {}) {
  return resolveClimateStability({
    climateState,
    climateLivabilityFraction: habitabilityFraction(zones),
    collapsePenalty,
  });
}
