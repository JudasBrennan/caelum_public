import { clamp, round } from "../utils.js";

export const MOON_INFLUENCE_SUMMARY_MODEL_VERSION = "gas-giant-moon-influence-summary-v1";

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const number = finiteOrNull(value);
    if (number != null) return number;
  }
  return null;
}

function textIncludes(value, needle) {
  return String(value || "")
    .toLowerCase()
    .includes(String(needle || "").toLowerCase());
}

function confidenceRank(confidence) {
  const text = String(confidence || "").toLowerCase();
  if (text === "high") return 3;
  if (text === "medium") return 2;
  if (text === "low") return 1;
  return 0;
}

function confidenceFromRank(rank) {
  if (rank >= 3) return "high";
  if (rank >= 2) return "medium";
  if (rank >= 1) return "low";
  return "unknown";
}

function plasmaSourceClass(score) {
  if (score >= 0.7) return "strong";
  if (score >= 0.45) return "moderate";
  if (score >= 0.18) return "weak";
  return "minimal";
}

function volatileEscapeScore(value) {
  const text = String(value || "").toLowerCase();
  if (textIncludes(text, "extreme") || textIncludes(text, "high")) return 0.9;
  if (textIncludes(text, "elevated") || textIncludes(text, "moderate")) return 0.6;
  if (textIncludes(text, "low") || textIncludes(text, "stable")) return 0.25;
  return 0.35;
}

function radiationSputteringScore(value, insideParentMagnetosphere) {
  const text = String(value || "").toLowerCase();
  const base =
    textIncludes(text, "sterilizing") || textIncludes(text, "extreme")
      ? 0.9
      : textIncludes(text, "harsh") || textIncludes(text, "high")
        ? 0.7
        : textIncludes(text, "elevated") || textIncludes(text, "moderate")
          ? 0.45
          : textIncludes(text, "low")
            ? 0.2
            : 0.3;
  return clamp(base * (insideParentMagnetosphere ? 1 : 0.45), 0, 1);
}

function tidalFluxScore(tidalHeatingWm2) {
  const flux = Math.max(finiteOrNull(tidalHeatingWm2) ?? 0, 0);
  if (flux <= 0) return 0;
  return clamp((Math.log10(flux) + 4) / 4, 0, 1);
}

function pressureEscapeScore(pressurePa, volatileRiskClass) {
  const pressureScore = clamp(Math.log10(1 + Math.max(finiteOrNull(pressurePa) ?? 0, 0)) / 6, 0, 1);
  return clamp(pressureScore * volatileEscapeScore(volatileRiskClass), 0, 1);
}

function inferVolcanicActivityScore(moonModel = {}, tidalScore = 0) {
  const geology = moonModel.geology || {};
  const interiorOutputs = moonModel.interiorEvolutionContext?.outputs || {};
  const dominantProcess = String(geology.dominantProcess || geology.resurfacingClass || "");
  const textBoost =
    textIncludes(dominantProcess, "volcan") || textIncludes(dominantProcess, "lava") ? 0.65 : 0;
  return clamp(
    Math.max(
      finiteOrNull(geology.volcanicActivityScore) ?? 0,
      finiteOrNull(interiorOutputs.tidalVolcanismScore) ?? 0,
      textBoost,
      tidalScore >= 0.85 ? 0.75 : tidalScore >= 0.65 ? 0.45 : 0,
    ),
    0,
    1,
  );
}

function inferCryovolcanicActivityScore(moonModel = {}, tidalScore = 0) {
  const geology = moonModel.geology || {};
  const hydrosphere = moonModel.hydrosphere || moonModel.derived?.hydrosphere || {};
  const dominantProcess = String(geology.dominantProcess || geology.resurfacingClass || "");
  const textBoost =
    textIncludes(dominantProcess, "cryo") || textIncludes(dominantProcess, "plume") ? 0.7 : 0;
  return clamp(
    Math.max(
      finiteOrNull(geology.cryovolcanicActivityScore) ?? 0,
      textBoost,
      (finiteOrNull(hydrosphere.subsurfaceOceanScore) ?? 0) * 0.6,
      hydrosphere.subsurfaceOceanPresent ? 0.45 : 0,
      tidalScore >= 0.65 ? 0.35 : 0,
    ),
    0,
    1,
  );
}

export function buildSolvedMoonInfluenceSummary(moonModel = {}) {
  const tidalHeatingWm2 = firstFinite(
    moonModel.tides?.tidalHeatingWm2,
    moonModel.tidal?.tidalHeatingWm2,
    moonModel.derived?.tidalHeatingWm2,
  );
  const tidalHeatingW = firstFinite(
    moonModel.tides?.tidalHeatingW,
    moonModel.tidal?.tidalHeatingW,
    moonModel.derived?.tidalHeatingW,
  );
  const tidalScore = tidalFluxScore(tidalHeatingWm2);
  const volcanicActivityScore = inferVolcanicActivityScore(moonModel, tidalScore);
  const cryovolcanicActivityScore = inferCryovolcanicActivityScore(moonModel, tidalScore);
  const atmospherePressurePa = firstFinite(
    moonModel.atmosphere?.surfacePressurePa,
    moonModel.atmosphere?.pressurePa,
    moonModel.derived?.surfacePressurePa,
  );
  const volatileEscapeRisk =
    moonModel.derived?.atmosphereEvolutionContext?.volatileLossRiskClass ||
    moonModel.environment?.atmosphereEvolutionContext?.volatileLossRiskClass ||
    moonModel.habitability?.atmosphereEvolutionContext?.volatileLossRiskClass ||
    "unknown";
  const insideParentMagnetosphere =
    moonModel.radiation?.insideParentMagnetosphere === true ||
    moonModel.radiation?.withinParentMagnetosphere === true;
  const radiationSputteringClass =
    moonModel.radiation?.surfaceClass ||
    moonModel.radiation?.subsurfaceClass ||
    moonModel.display?.radiationSurface ||
    "unknown";
  const escapeScore = pressureEscapeScore(atmospherePressurePa, volatileEscapeRisk);
  const sputteringScore = radiationSputteringScore(
    radiationSputteringClass,
    insideParentMagnetosphere,
  );
  const plasmaSourceScore = clamp(
    0.52 * volcanicActivityScore +
      0.22 * cryovolcanicActivityScore +
      0.1 * escapeScore +
      0.1 * sputteringScore +
      0.06 * tidalScore,
    0,
    1,
  );
  const tidalBranch =
    Math.max(tidalHeatingW ?? 0, 0) *
    Math.max(volcanicActivityScore, cryovolcanicActivityScore * 0.35) *
    (insideParentMagnetosphere ? 1 : 0.35);
  const plumeBranch =
    insideParentMagnetosphere && cryovolcanicActivityScore >= 0.35
      ? 1e11 * cryovolcanicActivityScore ** 2
      : 0;
  const sputteringBranch =
    insideParentMagnetosphere && escapeScore > 0
      ? 1e10 * escapeScore * Math.max(sputteringScore, 0.2)
      : 0;
  const plasmaSourcePowerW = Math.max(tidalBranch, plumeBranch, sputteringBranch);
  const confidenceInputs = [
    tidalHeatingWm2 != null || tidalHeatingW != null,
    moonModel.geology && typeof moonModel.geology === "object",
    moonModel.radiation && typeof moonModel.radiation === "object",
  ].filter(Boolean).length;
  const confidence = confidenceInputs >= 3 ? "high" : confidenceInputs >= 2 ? "medium" : "low";
  const notes = [
    "Solved moon influence is a bounded plasma-source summary for the parent magnetosphere, not an MHD plasma transport model.",
  ];
  if (!insideParentMagnetosphere) {
    notes.push(
      "Moon is not flagged inside the parent magnetosphere, so plasma coupling is reduced.",
    );
  }

  return {
    modelVersion: MOON_INFLUENCE_SUMMARY_MODEL_VERSION,
    moonId: moonModel.id || moonModel.inputs?.id || moonModel.name || null,
    moonName: moonModel.name || moonModel.inputs?.name || null,
    tidalHeatingWm2: tidalHeatingWm2 == null ? null : round(tidalHeatingWm2, 8),
    tidalHeatingW: tidalHeatingW == null ? null : round(tidalHeatingW, 0),
    volcanicActivityScore: round(volcanicActivityScore, 4),
    cryovolcanicActivityScore: round(cryovolcanicActivityScore, 4),
    atmospherePressurePa: atmospherePressurePa == null ? null : round(atmospherePressurePa, 4),
    volatileEscapeRisk,
    insideParentMagnetosphere,
    radiationSputteringClass,
    plasmaSourceScore: round(plasmaSourceScore, 4),
    plasmaSourceClass: plasmaSourceClass(plasmaSourceScore),
    plasmaSourcePowerW: round(plasmaSourcePowerW, 0),
    confidence,
    notes,
  };
}

export function summarizeMoonInfluenceSummaries(summaries = []) {
  const valid = Array.isArray(summaries)
    ? summaries.filter((summary) => summary && typeof summary === "object")
    : [];
  if (!valid.length) {
    return {
      modelVersion: MOON_INFLUENCE_SUMMARY_MODEL_VERSION,
      count: 0,
      totalPlasmaSourcePowerW: 0,
      dominantMoonId: null,
      plasmaSourceScore: 0,
      plasmaSourceClass: "minimal",
      confidence: "unknown",
      mode: "fallback-raw-moon-proxies",
    };
  }
  const totalPower = valid.reduce(
    (sum, summary) => sum + Math.max(finiteOrNull(summary.plasmaSourcePowerW) ?? 0, 0),
    0,
  );
  const dominant =
    [...valid].sort(
      (a, b) =>
        Math.max(finiteOrNull(b.plasmaSourcePowerW) ?? 0, 0) -
        Math.max(finiteOrNull(a.plasmaSourcePowerW) ?? 0, 0),
    )[0] || null;
  const maxScore = valid.reduce(
    (score, summary) => Math.max(score, finiteOrNull(summary.plasmaSourceScore) ?? 0),
    0,
  );
  const confidence = confidenceFromRank(
    Math.min(
      ...valid.map((summary) => confidenceRank(summary.confidence)).filter((rank) => rank > 0),
    ),
  );

  return {
    modelVersion: MOON_INFLUENCE_SUMMARY_MODEL_VERSION,
    count: valid.length,
    totalPlasmaSourcePowerW: round(totalPower, 0),
    dominantMoonId: dominant?.moonId || null,
    dominantMoonName: dominant?.moonName || null,
    plasmaSourceScore: round(maxScore, 4),
    plasmaSourceClass: plasmaSourceClass(maxScore),
    confidence,
    mode: "solved-moon-context",
  };
}
