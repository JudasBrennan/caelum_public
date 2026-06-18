import { fmt } from "../utils.js";

function titleCase(value) {
  const text = String(value || "unknown").replace(/[-_]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatArchitectureSummary(architecture = null) {
  const summary = architecture?.summary || {};
  const state = titleCase(summary.state);
  if (!architecture || summary.state === "unknown") {
    return {
      label: "Architecture unknown",
      detail: summary.note || "Not enough orbital data for architecture diagnostics.",
    };
  }
  const separation =
    Number(summary.minSeparationMutualHill) > 0
      ? `${fmt(summary.minSeparationMutualHill, 2)} mutual Hill radii`
      : "unknown spacing";
  return {
    label: `${state} architecture`,
    detail: `${summary.note || "Diagnostic suggests a bounded orbital architecture."} Minimum adjacent spacing: ${separation}.`,
  };
}

export function formatMoonTidalContext(tidalContext = {}) {
  const migration = titleCase(tidalContext.migrationDirection);
  const persistence = titleCase(tidalContext.eccentricityPersistence);
  const sustained = titleCase(tidalContext.sustainedHeatingClass);
  const sync =
    Number(tidalContext.synchronousOrbitKm) > 0
      ? `${fmt(tidalContext.synchronousOrbitKm, 0)} km`
      : "unknown sync orbit";
  return {
    label: `${migration} migration / ${persistence} eccentricity`,
    detail: `Synchronous orbit: ${sync}. Sustained heating context: ${sustained}.`,
  };
}

export function formatMoonSystemBudget(torqueBudget = null) {
  if (!torqueBudget || torqueBudget.netTorqueClass === "unknown") {
    return {
      label: "Moon-system torque unknown",
      detail: "Moon-system migration proxy needs solved moon masses and tidal rates.",
    };
  }
  const display = torqueBudget.display || {};
  return {
    label: `Net ${torqueBudget.netTorqueClass}`,
    detail:
      display.netMigrationProxy ||
      torqueBudget.notes?.[0] ||
      "Bounded moon-system migration proxy available.",
  };
}

export function formatDynamicalConstraintSummary(context = {}) {
  const summary = context.systemSummary || {};
  const state = titleCase(summary.state);
  const firstNote =
    summary.userFacingNotes?.[0] ||
    summary.limitingFactors?.[0] ||
    "No limiting dynamical factor is currently reported.";
  return {
    label: `${state} dynamical context`,
    detail: firstNote,
  };
}
