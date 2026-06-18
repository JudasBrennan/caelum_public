import { DYNAMICAL_SCIENCE_REGISTRY_VERSION } from "./scienceRegistry.js";

const CONFIDENCE_VALUES = new Set(["high", "medium", "low", "unknown"]);
const SUMMARY_STATES = new Set(["stable", "packed", "crowded", "unstable", "unknown"]);
const TORQUE_STATES = new Set(["outward", "inward", "balanced", "mixed", "unknown"]);

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function optionalString(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeDynamicalConfidence(value, fallback = "unknown") {
  const text = String(value || "").toLowerCase();
  return CONFIDENCE_VALUES.has(text) ? text : fallback;
}

export function normalizeDynamicalSummaryState(value, fallback = "unknown") {
  const text = String(value || "").toLowerCase();
  return SUMMARY_STATES.has(text) ? text : fallback;
}

export function normalizeTorqueState(value, fallback = "unknown") {
  const text = String(value || "").toLowerCase();
  return TORQUE_STATES.has(text) ? text : fallback;
}

export function makeUnknownDynamicalContext(note = "Dynamical context is unknown.") {
  return normalizeDynamicalContext({
    confidence: "unknown",
    systemSummary: {
      state: "unknown",
      limitingFactors: [note],
      repairSuggestions: [],
      userFacingNotes: [note],
    },
  });
}

export function normalizeDynamicalContext(rawContext = {}) {
  const raw = objectOrEmpty(rawContext);
  const hostFramesRaw = objectOrEmpty(raw.hostFrames);
  const bodiesRaw = objectOrEmpty(raw.bodies);
  const moonSystemsRaw = objectOrEmpty(raw.moonSystems);
  const summaryRaw = objectOrEmpty(raw.systemSummary);

  const hostFrames = Object.create(null);
  for (const [id, frame] of Object.entries(hostFramesRaw)) {
    const source = objectOrEmpty(frame);
    const architecture = objectOrEmpty(source.orbitalArchitecture);
    hostFrames[id] = {
      frameKind: optionalString(source.frameKind, "unknown"),
      stability: source.stability || null,
      orbitalArchitecture: source.orbitalArchitecture || null,
      constraints: arrayOrEmpty(source.constraints),
      summary: {
        state: normalizeDynamicalSummaryState(source.summary?.state ?? architecture.summary?.state),
        confidence: normalizeDynamicalConfidence(
          source.summary?.confidence ?? architecture.summary?.confidence,
        ),
        note: optionalString(source.summary?.note ?? architecture.summary?.note),
      },
    };
  }

  const bodies = Object.create(null);
  for (const [id, body] of Object.entries(bodiesRaw)) {
    const source = objectOrEmpty(body);
    const tidalContext = objectOrEmpty(source.tidalContext);
    bodies[id] = {
      bodyId: optionalString(source.bodyId, id),
      bodyKind: optionalString(source.bodyKind, "unknown"),
      hostFrameId: optionalString(source.hostFrameId, ""),
      parentBodyId: optionalString(source.parentBodyId, ""),
      parentKind: optionalString(source.parentKind, ""),
      orbitalState: source.orbitalState || {},
      stabilityContext: {
        ...(source.stabilityContext || {}),
        state: normalizeDynamicalSummaryState(source.stabilityContext?.state),
        confidence: normalizeDynamicalConfidence(source.stabilityContext?.confidence),
        reasons: arrayOrEmpty(source.stabilityContext?.reasons),
      },
      tidalContext: {
        ...tidalContext,
        synchronousOrbitKm: finiteOrNull(tidalContext.synchronousOrbitKm),
        relativeToSynchronousOrbit: optionalString(
          tidalContext.relativeToSynchronousOrbit,
          "unknown",
        ),
        migrationDirection: optionalString(tidalContext.migrationDirection, "unknown"),
        eccentricityPersistence: optionalString(tidalContext.eccentricityPersistence, "unknown"),
        sustainedHeatingClass: optionalString(tidalContext.sustainedHeatingClass, "unknown"),
        confidence: normalizeDynamicalConfidence(tidalContext.confidence),
        reasons: arrayOrEmpty(tidalContext.reasons),
      },
      habitabilityBridge: source.habitabilityBridge || null,
      moonSystemContext: source.moonSystemContext || null,
      generationGuidance: source.generationGuidance || null,
      display: source.display || {},
    };
  }

  const moonSystems = Object.create(null);
  for (const [id, system] of Object.entries(moonSystemsRaw)) {
    const source = objectOrEmpty(system);
    const torqueBudget = objectOrEmpty(source.torqueBudget);
    moonSystems[id] = {
      parentBodyId: optionalString(source.parentBodyId, id),
      synchronousOrbit: source.synchronousOrbit || null,
      torqueBudget: source.torqueBudget || null,
      resonanceNetwork: source.resonanceNetwork || null,
      moons: arrayOrEmpty(source.moons),
      sustainedTidalHeating: source.sustainedTidalHeating || null,
      ringContext: source.ringContext || null,
      radiationContext: source.radiationContext || null,
      constraints: arrayOrEmpty(source.constraints),
      summary: {
        state: normalizeTorqueState(source.summary?.state ?? torqueBudget.netTorqueClass),
        confidence: normalizeDynamicalConfidence(source.summary?.confidence),
        note: optionalString(source.summary?.note),
      },
    };
  }

  return {
    modelVersion: "dynamical-context-v1",
    scienceRegistryVersion: raw.scienceRegistryVersion || DYNAMICAL_SCIENCE_REGISTRY_VERSION,
    confidence: normalizeDynamicalConfidence(raw.confidence),
    assumptions: arrayOrEmpty(raw.assumptions),
    hostFrames,
    bodies,
    moonSystems,
    systemSummary: {
      state: normalizeDynamicalSummaryState(summaryRaw.state),
      confidence: normalizeDynamicalConfidence(summaryRaw.confidence),
      limitingFactors: arrayOrEmpty(summaryRaw.limitingFactors),
      repairSuggestions: arrayOrEmpty(summaryRaw.repairSuggestions),
      userFacingNotes: arrayOrEmpty(summaryRaw.userFacingNotes),
    },
  };
}

export function assertDynamicalContextSchema(context = {}) {
  const normalized = normalizeDynamicalContext(context);
  if (normalized.modelVersion !== "dynamical-context-v1") {
    throw new Error("Dynamical context must use modelVersion dynamical-context-v1");
  }
  if (normalized.scienceRegistryVersion !== DYNAMICAL_SCIENCE_REGISTRY_VERSION) {
    throw new Error("Dynamical context science registry version mismatch");
  }
  for (const [bodyId, body] of Object.entries(normalized.bodies)) {
    if (!body.bodyId) throw new Error(`Dynamical body context missing bodyId for ${bodyId}`);
    if (!body.bodyKind) throw new Error(`Dynamical body context missing bodyKind for ${bodyId}`);
    if (!CONFIDENCE_VALUES.has(body.stabilityContext.confidence)) {
      throw new Error(`Dynamical body context ${bodyId} has invalid stability confidence`);
    }
  }
  return normalized;
}
