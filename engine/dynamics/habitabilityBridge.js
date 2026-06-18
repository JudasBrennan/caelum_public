import { clamp, toFinite } from "../utils.js";

function confidenceRank(confidence) {
  return { high: 3, medium: 2, low: 1, unknown: 0 }[String(confidence || "unknown")] ?? 0;
}

function rankConfidence(rank) {
  if (rank >= 3) return "high";
  if (rank >= 2) return "medium";
  if (rank >= 1) return "low";
  return "unknown";
}

export function classifySustainedTidalHeating({
  tidalHeatingEarth,
  eccentricityPersistence,
  heatingLikelySustained,
} = {}) {
  const heating = Math.max(toFinite(tidalHeatingEarth, 0), 0);
  const persistence = String(eccentricityPersistence || "uncertain");
  if (heating <= 0.01) {
    return {
      class: "low",
      confidence: "medium",
      persistenceModifier: 0.95,
      note: "Current tidal heating is low, so sustained heating is not a major persistence support.",
    };
  }
  if (persistence === "overdriven") {
    return {
      class: "overdriven",
      confidence: "medium",
      persistenceModifier: 0.72,
      note: "Tidal heating is likely sustained but high enough to add stress before habitability claims.",
    };
  }
  if (persistence === "maintained" || heatingLikelySustained === true) {
    return {
      class: "likely-sustained",
      confidence: persistence === "maintained" ? "high" : "medium",
      persistenceModifier: 1,
      note: "Resonance or forced eccentricity suggests tidal heating can persist.",
    };
  }
  if (persistence === "damping") {
    return {
      class: "damping",
      confidence: "medium",
      persistenceModifier: 0.82,
      note: "Current tidal heating may damp without sustained eccentricity forcing.",
    };
  }
  return {
    class: "uncertain",
    confidence: "low",
    persistenceModifier: 0.9,
    note: "Tidal persistence is uncertain because forcing or damping context is incomplete.",
  };
}

function currentTidalHeatingClass(tidalHeatingEarth) {
  const heating = Math.max(toFinite(tidalHeatingEarth, 0), 0);
  if (heating < 0.01) return "low";
  if (heating < 0.5) return "elevated";
  if (heating < 10) return "high";
  return "extreme";
}

export function buildSustainedTidalHeatingContext({
  tidalHeatingEarth,
  eccentricityPersistence,
  heatingLikelySustained,
  supportingMechanism = "",
  limitingFactor = "",
  reasons = [],
} = {}) {
  const sustained = classifySustainedTidalHeating({
    tidalHeatingEarth,
    eccentricityPersistence,
    heatingLikelySustained,
  });
  return {
    modelVersion: "sustained-tidal-heating-context-v1",
    currentTidalHeatingClass: currentTidalHeatingClass(tidalHeatingEarth),
    sustainedTidalHeatingClass: sustained.class,
    eccentricityPersistence: String(eccentricityPersistence || "uncertain"),
    heatingLikelySustained: heatingLikelySustained === true,
    persistenceConfidence: sustained.confidence,
    confidence: sustained.confidence,
    persistenceModifier: sustained.persistenceModifier,
    supportingMechanism: String(supportingMechanism || "none"),
    limitingFactor: String(limitingFactor || ""),
    note: sustained.note,
    reasons: [sustained.note, ...reasons].filter(Boolean),
  };
}

export function buildHabitabilityPersistenceBridge({
  bodyId = null,
  bodyKind = "unknown",
  stabilityContext = null,
  tidalContext = null,
  hydrosphere = null,
  geology = null,
} = {}) {
  const reasons = [];
  const stability = stabilityContext || {};
  const tidal = tidalContext || {};
  const hydro = hydrosphere || {};
  const geo = geology || {};
  let confidence = "medium";
  let persistenceModifier = 1;
  let modifierTarget = "confidence";
  let noOpReason = "";

  if (stability.state === "unstable") {
    persistenceModifier = Math.min(persistenceModifier, 0.65);
    confidence = "low";
    reasons.push(
      stability.reasons?.[0] ||
        "Formal orbital stability is not satisfied, so long-term habitability persistence is reduced.",
    );
  } else if (stability.confidence === "low" || stability.state === "unknown") {
    persistenceModifier = Math.min(persistenceModifier, 0.86);
    confidence = "low";
    reasons.push(
      stability.reasons?.[0] ||
        "Dynamical stability is uncertain, so persistence confidence is reduced.",
    );
  }

  const sustained = classifySustainedTidalHeating({
    tidalHeatingEarth: tidal.tidalHeatingEarth,
    eccentricityPersistence: tidal.eccentricityPersistence,
    heatingLikelySustained: tidal.heatingLikelySustained,
  });
  persistenceModifier = Math.min(persistenceModifier, sustained.persistenceModifier);
  confidence = rankConfidence(
    Math.min(confidenceRank(confidence), confidenceRank(sustained.confidence)),
  );
  reasons.push(sustained.note);

  const hasSubsurfaceWater =
    hydro.subsurfaceOceanPresent === true || toFinite(hydro.subsurfaceOceanScore, 0) >= 0.35;
  const hasOceanPersistence = toFinite(geo.oceanPersistenceScore, 0) > 0.35;
  if (hasSubsurfaceWater && sustained.class === "likely-sustained") {
    reasons.push(
      "Subsurface water and likely sustained tidal heat support persistence confidence without asserting surface habitability.",
    );
  } else if (hasSubsurfaceWater && sustained.class === "damping") {
    reasons.push(
      "Subsurface water is present, but tidal support may fade without maintained eccentricity.",
    );
  } else if (!hasSubsurfaceWater && sustained.class === "low") {
    noOpReason =
      "No dynamical habitability adjustment: no strong sustained-heat water pathway is present.";
  }

  if (hasOceanPersistence && sustained.class !== "overdriven") {
    persistenceModifier = Math.max(persistenceModifier, 0.9);
  }

  return {
    modelVersion: "dynamical-habitability-bridge-v1",
    bodyId,
    bodyKind,
    persistenceModifier: clamp(persistenceModifier, 0, 1),
    modifierTarget,
    confidence,
    sustainedTidalHeatingClass: sustained.class,
    reasons: reasons.filter(Boolean),
    noOpReason,
  };
}
