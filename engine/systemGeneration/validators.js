import { buildWorldSnapshot } from "../worldSnapshot.js";

function normalizeHostFrameId(value, fallbackId = "star_a") {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

export function validateGeneratedDraftWorld(draftWorld, request = {}) {
  const diagnostics = [];
  let snapshot = null;

  try {
    snapshot = buildWorldSnapshot(draftWorld, { mode: "summary" });
  } catch (error) {
    diagnostics.push({
      severity: "blocked",
      code: "snapshot-validation-failed",
      title: "Generated system failed snapshot validation",
      detail: error instanceof Error ? error.message : "Snapshot validation failed.",
    });
    return {
      ok: false,
      snapshot: null,
      fitClass: "blocked",
      diagnostics,
    };
  }

  const defaultHostFrameId = snapshot?.meta?.defaultHostFrameId || "star_a";
  for (const entry of Object.values(snapshot?.planetsById || {})) {
    const hostFrameId = normalizeHostFrameId(entry?.hostFrameId, defaultHostFrameId);
    const orbitEntry = snapshot?.bodiesInOrbitOrderByHostFrame?.[hostFrameId]?.find(
      (candidate) => candidate.id === entry.id,
    );
    if (!orbitEntry) {
      diagnostics.push({
        severity: "blocked",
        code: "planet-host-frame-mismatch",
        title: "Generated rocky world is outside its host-frame ordering",
        detail: `Planet "${entry.name || entry.id}" does not resolve inside host frame "${hostFrameId}".`,
      });
      break;
    }
  }

  if (request?.homeworldPolicy === "guarantee-temperate-rocky") {
    const homeworldCandidate = Object.values(snapshot?.planetsById || {}).find(
      (entry) => Number(entry?.surfaceTempK || 0) >= 220 && Number(entry?.surfaceTempK || 0) <= 340,
    );
    if (!homeworldCandidate) {
      diagnostics.push({
        severity: "blocked",
        code: "missing-temperate-homeworld",
        title: "No defended temperate rocky world",
        detail:
          "The generated draft does not contain a rocky world in a defendable temperate band.",
      });
    }
  } else if (request?.homeworldPolicy === "allow-any-rocky") {
    if (!Object.keys(snapshot?.planetsById || {}).length) {
      diagnostics.push({
        severity: "blocked",
        code: "missing-rocky-homeworld",
        title: "No rocky homeworld candidate",
        detail:
          "The generated draft does not contain any rocky world to act as a homeworld candidate.",
      });
    }
  }

  return {
    ok: diagnostics.every((entry) => entry.severity !== "blocked"),
    snapshot,
    fitClass: diagnostics.length ? "near-miss" : "exact-match",
    diagnostics,
  };
}
