import { buildDynamicalContext } from "../../engine/dynamics/context.js";

function titleCase(value) {
  const text = String(value || "unknown").replace(/[-_]/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildLongTermDynamicsSection(world, bodyId) {
  if (!bodyId) return null;
  let bodyContext = null;
  try {
    bodyContext =
      buildDynamicalContext({ world, detailLevel: "summary" }).bodies?.[bodyId]
        ?.longTermDynamicsContext || null;
  } catch {
    bodyContext = null;
  }
  if (!bodyContext) return null;

  const secular = bodyContext.secularContext?.outputs || {};
  const precession = bodyContext.precessionContext?.outputs || {};
  const cassini = bodyContext.cassiniStateContext?.outputs || {};
  const trojan = bodyContext.trojanPopulationContext?.outputs || {};
  const variability = bodyContext.dynamicalVariabilityContext?.outputs || {};
  const summary = bodyContext.summary || {};
  const items = [
    {
      label: "Secular Forcing",
      value: titleCase(summary.secularClass),
      meta: `KL ${titleCase(secular.kozaiLidovClass)} | hierarchy ${titleCase(
        secular.hierarchyClass,
      )}`,
    },
    {
      label: "Precession",
      value: titleCase(summary.precessionClass),
      meta:
        precession.climateCycleCaution ||
        "Read-only long-cycle cue; climate and calendar calculations are unchanged.",
    },
    {
      label: "Cassini Readiness",
      value: titleCase(summary.cassiniReadinessClass),
      meta:
        cassini.captureConfidence ||
        "No named Cassini state is assigned without a parameter-ready solve.",
    },
    {
      label: "Migration Evidence",
      value: titleCase(bodyContext.migrationEvidenceClass),
      meta: "Evidence class only; no unique migration history is reconstructed.",
    },
    {
      label: "Variability",
      value: titleCase(variability.dynamicalVariabilityRiskClass || summary.variabilityClass),
      meta:
        variability.habitabilityVariabilityWarning === "none"
          ? "No extra climate-persistence warning from long-cycle diagnostics."
          : "Warning only; authored orbit, obliquity, and climate outputs are unchanged.",
    },
  ];
  if (bodyContext.trojanPopulationContext) {
    items.push({
      label: "Trojan Reservoir",
      value: titleCase(summary.trojanReservoirClass),
      meta: `L4/L5 ${titleCase(trojan.l45LinearStabilityClass)} | ${titleCase(
        trojan.captureHistoryClass,
      )}`,
    });
  }

  return {
    id: `long-term-dynamics-${bodyId}`,
    title: "Long-term Dynamics",
    density: "compact",
    items,
  };
}
