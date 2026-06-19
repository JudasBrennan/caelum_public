import { clamp, toFinite } from "../utils.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "migration-history-context-v1";
const SOURCE_KEYS = ["migrationHistory"];

function positive(value, fallback = NaN) {
  const number = toFinite(value, fallback);
  return Number.isFinite(number) && number > 0 ? number : NaN;
}

function isGiant(body) {
  const kind = String(body?.kind || body?.bodyKind || "").toLowerCase();
  const massEarth = positive(body?.massEarth);
  return kind.includes("giant") || massEarth >= 50;
}

function bodyOrbit(body) {
  return positive(body?.semiMajorAxisAu ?? body?.orbitAu ?? body?.orbitalState?.semiMajorAxisAu);
}

function bodyEccentricity(body) {
  return clamp(toFinite(body?.eccentricity ?? body?.orbitalState?.eccentricity, 0), 0, 0.99);
}

function bodyInclination(body) {
  const value = Number(body?.inclinationDeg ?? body?.orbitalState?.inclinationDeg);
  return Number.isFinite(value) ? Math.abs(value) : 0;
}

function evidenceEntry(type, strength, note) {
  return { type, strength, note };
}

function strengthRank(strength) {
  return { weak: 1, moderate: 2, strong: 3 }[strength] || 0;
}

function evidenceClass(evidence, scenario) {
  if (scenario === "ambiguous") return "ambiguous";
  const strongest = evidence.reduce((rank, item) => Math.max(rank, strengthRank(item.strength)), 0);
  if (strongest >= 3) return "strong";
  if (strongest === 2) return "moderate";
  if (strongest === 1) return "weak";
  return "none";
}

export function buildMigrationHistoryContext({
  bodies = [],
  snowLineAu = 2.7,
  compactResonantChain = false,
  giantTackIndicators = false,
  giantResonanceCrossing = false,
  smallBodyMixingEvidence = false,
  trojanCaptureEvidence = false,
  debrisMixingEvidence = false,
  systemAgeGyr = null,
} = {}) {
  const normalizedBodies = Array.isArray(bodies) ? bodies.filter(Boolean) : [];
  const snowLine = positive(snowLineAu, 2.7);
  const evidence = [];
  const counterEvidence = [];
  for (const body of normalizedBodies) {
    const a = bodyOrbit(body);
    if (!Number.isFinite(a)) continue;
    const e = bodyEccentricity(body);
    const inc = bodyInclination(body);
    if (isGiant(body) && a < Math.min(0.15, snowLine * 0.1)) {
      evidence.push(
        evidenceEntry(
          "hot-giant-inside-snow-line",
          "strong",
          `${body.name || body.id || "A giant planet"} orbits well inside the snow line; migration evidence is strong but mechanism remains ambiguous.`,
        ),
      );
    } else if (isGiant(body) && a < snowLine) {
      evidence.push(
        evidenceEntry(
          "giant-inside-snow-line",
          "moderate",
          `${body.name || body.id || "A giant planet"} lies inside the snow line, consistent with disk migration or later scattering.`,
        ),
      );
    }
    if (isGiant(body) && (e >= 0.35 || inc >= 20)) {
      evidence.push(
        evidenceEntry(
          "excited-giant-orbit",
          "moderate",
          `${body.name || body.id || "A giant planet"} has excited eccentricity/inclination, consistent with scattering or high-eccentricity migration.`,
        ),
      );
    }
    if (
      !isGiant(body) &&
      a < snowLine &&
      String(body.compositionClass || "")
        .toLowerCase()
        .includes("ice")
    ) {
      evidence.push(
        evidenceEntry(
          "volatile-composition-tension",
          "weak",
          `${body.name || body.id || "A body"} has volatile-rich composition inside the snow line.`,
        ),
      );
    }
  }

  if (compactResonantChain) {
    evidence.push(
      evidenceEntry(
        "resonant-chain-migration",
        "moderate",
        "Compact resonant chains are evidence consistent with convergent disk migration.",
      ),
    );
  }
  if (giantTackIndicators) {
    evidence.push(
      evidenceEntry(
        "giant-tack-like",
        "strong",
        "Architecture is consistent with a Grand-Tack-style migration analogy, not a unique history.",
      ),
    );
  }
  if (giantResonanceCrossing && (smallBodyMixingEvidence || debrisMixingEvidence)) {
    evidence.push(
      evidenceEntry(
        "nice-model-like",
        "strong",
        "Giant-planet resonance/scattering plus small-body mixing is consistent with a Nice-model-style history.",
      ),
    );
  } else if (giantResonanceCrossing) {
    evidence.push(
      evidenceEntry(
        "giant-resonance-crossing",
        "moderate",
        "Giant-planet resonance crossing is indicated, but small-body mixing evidence is missing.",
      ),
    );
  }
  if (trojanCaptureEvidence) {
    evidence.push(
      evidenceEntry(
        "trojan-capture-evidence",
        "weak",
        "Trojan reservoir context is consistent with capture during migration, but not diagnostic by itself.",
      ),
    );
  }
  if (!evidence.length && normalizedBodies.length) {
    counterEvidence.push(
      "No strong migration evidence is indicated by current orbital architecture.",
    );
  }

  const dominant = [...evidence].sort(
    (left, right) => strengthRank(right.strength) - strengthRank(left.strength),
  )[0];
  let scenario = dominant?.type || "in-situ-plausible";
  if (
    evidence.some((item) => item.type === "hot-giant-inside-snow-line") &&
    !evidence.some((item) => item.type === "giant-tack-like" || item.type === "nice-model-like")
  ) {
    scenario = "ambiguous";
  }
  const migrationEvidenceClass = evidenceClass(evidence, scenario);
  const confidence =
    evidence.length >= 2 || dominant?.strength === "strong"
      ? CONFIDENCE.MEDIUM
      : evidence.length
        ? CONFIDENCE.LOW
        : normalizedBodies.length
          ? CONFIDENCE.LOW
          : CONFIDENCE.UNKNOWN;

  return makeContext({
    modelVersion: MODEL_VERSION,
    status: normalizedBodies.length ? CONTEXT_STATUS.SUPPORTED : CONTEXT_STATUS.UNKNOWN,
    confidence,
    inputs: {
      bodyCount: normalizedBodies.length,
      snowLineAu: roundMaybe(snowLine, 4),
      compactResonantChain: compactResonantChain === true,
      giantTackIndicators: giantTackIndicators === true,
      giantResonanceCrossing: giantResonanceCrossing === true,
      smallBodyMixingEvidence: smallBodyMixingEvidence === true,
      trojanCaptureEvidence: trojanCaptureEvidence === true,
      debrisMixingEvidence: debrisMixingEvidence === true,
      systemAgeGyr: roundMaybe(systemAgeGyr, 4),
    },
    outputs: {
      migrationEvidenceClass,
      dominantMigrationEvidence: dominant?.type || "none",
      migrationScenarioClass: scenario,
      formationLocationTensionClass: evidence.some((item) => item.type.includes("snow-line"))
        ? "present"
        : "not-indicated",
      resonantHistoryClass: compactResonantChain
        ? "resonant-chain-migration"
        : giantResonanceCrossing
          ? "resonance-crossing"
          : "not-indicated",
      smallBodyMixingClass:
        smallBodyMixingEvidence || debrisMixingEvidence ? "indicated" : "not-indicated",
      timelineAnnotations: evidence.map(
        (item) => `Evidence consistent with ${item.type}: ${item.note}`,
      ),
      evidence,
      counterEvidence,
    },
    assumptions: [
      "Migration history is evidence-based and non-unique.",
      "Outputs must be read as evidence consistent with scenarios, not as reconstructed histories.",
    ],
    limitingFactors: [
      ...(normalizedBodies.length ? [] : ["No orbiting bodies were supplied."]),
      "No gas-disk or N-body migration integration is solved.",
    ],
    notes: [],
    sourceKeys: SOURCE_KEYS,
  });
}
