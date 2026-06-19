import { analyseOrbitalArchitecture } from "../orbitalArchitecture.js";
import { buildWorldSnapshot } from "../worldSnapshot.js";
import { buildMoonTorqueBudget } from "../moon/tidalEvolution.js";
import { formatDynamicalConstraintSummary } from "./display.js";
import { buildGenerationGuidanceForContext } from "./generationGuidance.js";
import {
  buildSustainedTidalHeatingContext,
  buildHabitabilityPersistenceBridge,
} from "./habitabilityBridge.js";
import { makeUnknownDynamicalContext, normalizeDynamicalContext } from "./schema.js";
import { buildLongTermDynamicsContext } from "../contexts/longTermDynamicsContext.js";

const EARTH_MASS_PER_MJUP = 317.828406;

function normalizeDetailLevel(detailLevel) {
  return detailLevel === "full" ? "full" : "summary";
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function valuesOf(value) {
  return Object.values(objectOrEmpty(value));
}

function optionalFinite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function positiveFinite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeHostFrameId(value, fallbackId = null) {
  const id = String(value ?? "").trim();
  return id || fallbackId || null;
}

function stateRank(state) {
  return (
    {
      unknown: 0,
      stable: 1,
      packed: 2,
      crowded: 3,
      unstable: 4,
    }[String(state || "unknown")] ?? 0
  );
}

function confidenceRank(confidence) {
  return { high: 3, medium: 2, low: 1, unknown: 0 }[String(confidence || "unknown")] ?? 0;
}

function worstState(left, right) {
  return stateRank(right) > stateRank(left) ? right : left;
}

function lowestConfidence(left, right) {
  return confidenceRank(right) < confidenceRank(left) ? right : left;
}

function hostMassMsolForFrame(hostFrame, snapshot) {
  return (
    positiveFinite(hostFrame?.system?.starMassMsol) ??
    positiveFinite(hostFrame?.primaryMassMsol) ??
    positiveFinite(hostFrame?.hostMassMsol) ??
    positiveFinite(hostFrame?.combinedMassMsol) ??
    positiveFinite(hostFrame?.star?.massMsol) ??
    positiveFinite(hostFrame?.stars?.primary?.massMsol) ??
    positiveFinite(snapshot?.star?.inputs?.massMsol) ??
    positiveFinite(snapshot?.star?.massMsol) ??
    positiveFinite(snapshot?.system?.starMassMsol) ??
    1
  );
}

function bodyMassEarth(entry) {
  if (entry?.kind === "gasGiant") {
    const sourceMassMjup =
      positiveFinite(entry?.source?.massMjup) ?? positiveFinite(entry?.source?.massJupiter);
    return (
      positiveFinite(entry?.model?.physical?.massEarth) ??
      positiveFinite(entry?.source?.massEarth) ??
      (sourceMassMjup == null ? null : sourceMassMjup * EARTH_MASS_PER_MJUP) ??
      null
    );
  }
  return (
    positiveFinite(entry?.model?.inputs?.massEarth) ??
    positiveFinite(entry?.model?.physical?.massEarth) ??
    positiveFinite(entry?.source?.inputs?.massEarth) ??
    null
  );
}

function orbitAu(entry) {
  return (
    positiveFinite(entry?.orbitAu) ??
    positiveFinite(entry?.model?.inputs?.semiMajorAxisAu) ??
    positiveFinite(entry?.model?.inputs?.orbitAu) ??
    positiveFinite(entry?.source?.inputs?.semiMajorAxisAu) ??
    positiveFinite(entry?.source?.au) ??
    positiveFinite(entry?.source?.orbitAu) ??
    null
  );
}

function eccentricity(entry) {
  return (
    optionalFinite(entry?.model?.inputs?.eccentricity) ??
    optionalFinite(entry?.source?.inputs?.eccentricity) ??
    optionalFinite(entry?.source?.eccentricity) ??
    0
  );
}

function inclinationDeg(entry) {
  return (
    optionalFinite(entry?.model?.inputs?.inclinationDeg) ??
    optionalFinite(entry?.source?.inputs?.inclinationDeg) ??
    optionalFinite(entry?.source?.inclinationDeg) ??
    null
  );
}

function periodDays(entry) {
  return (
    optionalFinite(entry?.model?.derived?.orbitalPeriodEarthDays) ??
    optionalFinite(entry?.model?.orbital?.orbitalPeriodDays) ??
    optionalFinite(entry?.model?.orbit?.orbitalPeriodDays) ??
    optionalFinite(entry?.orbitalPeriodEarthDays) ??
    optionalFinite(entry?.orbitalPeriodDays) ??
    null
  );
}

function architectureInputBodies(snapshot, hostFrameId) {
  return [...valuesOf(snapshot?.planetsById), ...valuesOf(snapshot?.gasGiantsById)]
    .filter((entry) => normalizeHostFrameId(entry?.hostFrameId, hostFrameId) === hostFrameId)
    .map((entry) => ({
      id: entry.id,
      name: entry.name || entry.id,
      kind: entry.kind,
      hostFrameId,
      semiMajorAxisAu: orbitAu(entry),
      massEarth: bodyMassEarth(entry),
      eccentricity: eccentricity(entry),
    }));
}

function pairForBody(architecture, bodyId) {
  return (architecture?.pairs || []).find(
    (pair) => pair.innerId === bodyId || pair.outerId === bodyId,
  );
}

function stabilityContextForBody(architecture, bodyId) {
  const pair = pairForBody(architecture, bodyId);
  if (!pair) {
    return {
      state: architecture?.summary?.state || "unknown",
      confidence: architecture?.summary?.confidence || "unknown",
      limitingConstraint: "host-frame-orbital-architecture",
      reasons: [architecture?.summary?.note].filter(Boolean),
    };
  }
  return {
    state: pair.state || "unknown",
    confidence: pair.confidence || "unknown",
    limitingConstraint: "mutual-hill-spacing",
    reasons: [pair.note].filter(Boolean),
    pairIds: [pair.innerId, pair.outerId],
    separationMutualHill: pair.separationMutualHill,
    eccentricityOverlapRisk: pair.eccentricityOverlapRisk,
  };
}

function stabilityContextForMoon(model) {
  const orbit = model?.orbit || {};
  const stabilityClass = String(orbit.orbitStabilityClass || "unknown");
  const requestedStabilityClass = String(orbit.requestedOrbitStabilityClass || "");
  const hardClasses = [
    "inside-parent-collision-limit",
    "inside-roche-limit",
    "outside-hill-sphere",
    "outside-conservative-stable-region",
  ];
  let state = "stable";
  let confidence = "high";
  if (hardClasses.includes(stabilityClass) || hardClasses.includes(requestedStabilityClass)) {
    state = "unstable";
    confidence = "high";
  } else if (stabilityClass === "near-outer-stability-edge" || orbit.longTermStable === false) {
    state = "crowded";
    confidence = "low";
  } else if (!stabilityClass || stabilityClass === "unknown") {
    state = "unknown";
    confidence = "unknown";
  }

  return {
    state,
    confidence,
    limitingConstraint: hardClasses.includes(requestedStabilityClass)
      ? requestedStabilityClass
      : stabilityClass,
    reasons: [
      hardClasses.includes(requestedStabilityClass)
        ? orbit.requestedOrbitStabilityLabel
        : orbit.orbitStabilityLabel,
      orbit.semiMajorAxisGuard && orbit.semiMajorAxisGuard !== "none"
        ? `Solver guard: ${orbit.semiMajorAxisGuard}.`
        : "",
    ].filter(Boolean),
    stabilityMarginFraction: optionalFinite(orbit.stabilityMarginFraction),
    hillRadiusKm: optionalFinite(orbit.hillRadiusKm),
    stableOuterLimitKm: optionalFinite(orbit.stableOuterLimitKm),
    effectiveInnerLimitKm: optionalFinite(orbit.effectiveInnerLimitKm),
    semiMajorAxisGuard: orbit.semiMajorAxisGuard || "none",
  };
}

function buildBodyOrbitalState(entry) {
  return {
    semiMajorAxisAu: orbitAu(entry),
    eccentricity: eccentricity(entry),
    inclinationDeg: inclinationDeg(entry),
    periodDays: periodDays(entry),
    periodSource: entry?.kind === "gasGiant" ? "gas-giant-model" : "planet-model",
  };
}

function buildMoonOrbitalState(entry) {
  const model = entry?.model || {};
  return {
    semiMajorAxisKm: positiveFinite(model?.inputs?.semiMajorAxisKm ?? entry?.orbitKm),
    eccentricity: eccentricity(entry),
    inclinationDeg: inclinationDeg(entry),
    periodDays: optionalFinite(model?.orbit?.orbitalPeriodSiderealDays),
    periodSource: "moon-model",
  };
}

function buildMoonTidalContext(model) {
  const tides = model?.tides || {};
  const equilibrium =
    model?.tidalEvolution?.eccentricityEquilibrium ||
    model?.resonance?.eccentricityEquilibrium ||
    null;
  const sustained = buildSustainedTidalHeatingContext({
    tidalHeatingEarth: tides.tidalHeatingEarth,
    eccentricityPersistence: equilibrium?.state,
    heatingLikelySustained: equilibrium?.heatingLikelySustained,
    supportingMechanism:
      model?.resonance?.forcedEccentricitySource ||
      (model?.resonance?.nearestResonance ? "near-resonance" : "none"),
    limitingFactor:
      equilibrium?.state === "damping"
        ? "no-sustained-eccentricity-pump"
        : tides.synchronousOrbitValid === false
          ? "unknown-parent-synchronous-orbit"
          : "",
    reasons: [equilibrium?.note, tides.synchronousOrbitNote].filter(Boolean),
  });
  return {
    synchronousOrbitKm: optionalFinite(tides.synchronousOrbitKm),
    synchronousOrbitParentRadii: optionalFinite(tides.synchronousOrbitParentRadii),
    relativeToSynchronousOrbit:
      tides.insideSynchronousOrbit == null
        ? "unknown"
        : tides.insideSynchronousOrbit
          ? "inside"
          : "outside",
    migrationDirection: tides.migrationDirectionFromSync || "unknown",
    eccentricityPersistence: equilibrium?.state || "uncertain",
    heatingLikelySustained: equilibrium?.heatingLikelySustained === true,
    currentTidalHeatingClass: sustained.currentTidalHeatingClass,
    sustainedHeatingClass: sustained.sustainedTidalHeatingClass,
    persistenceConfidence: sustained.confidence,
    currentTidalHeatingEarth: optionalFinite(tides.tidalHeatingEarth),
    tidalHeatingEarth: optionalFinite(tides.tidalHeatingEarth),
    dadtTotalMs: optionalFinite(tides.dadtTotalMs),
    confidence: equilibrium?.confidence || sustained.confidence || "unknown",
    supportingMechanism: sustained.supportingMechanism,
    limitingFactor: sustained.limitingFactor,
    dynamicalPersistenceContext: sustained,
    reasons: sustained.reasons,
  };
}

function summarizeSustainedHeating(moons) {
  const classes = moons.map((moon) => moon.sustainedTidalHeatingClass).filter(Boolean);
  if (!classes.length) {
    return {
      class: "unknown",
      confidence: "unknown",
      note: "No assigned moon heating context is available.",
    };
  }
  if (classes.includes("overdriven")) {
    return {
      class: "overdriven",
      confidence: "medium",
      note: "At least one moon has overdriven sustained tidal heating.",
    };
  }
  if (classes.includes("likely-sustained")) {
    return {
      class: "likely-sustained",
      confidence: "medium",
      note: "At least one moon has likely sustained tidal heating.",
    };
  }
  if (classes.includes("damping")) {
    return {
      class: "damping",
      confidence: "medium",
      note: "Moon heating is present but likely damping without stronger forcing.",
    };
  }
  return {
    class: classes.includes("uncertain") ? "uncertain" : "low",
    confidence: classes.includes("uncertain") ? "low" : "medium",
    note: "Moon-system tidal heating is low or uncertain.",
  };
}

function parentContext(snapshot, parentId) {
  return snapshot?.planetsById?.[parentId] || snapshot?.gasGiantsById?.[parentId] || null;
}

function parentRotationHours(parent) {
  return (
    positiveFinite(parent?.model?.inputs?.rotationPeriodHours) ??
    positiveFinite(parent?.source?.rotationPeriodHours) ??
    positiveFinite(parent?.source?.inputs?.rotationPeriodHours) ??
    null
  );
}

function strongestRadiationClass(moonEntries) {
  const rankByClass = {
    low: 1,
    elevated: 2,
    harsh: 3,
    "surface-sterilizing": 4,
  };
  let strongest = null;
  let strongestRank = 0;
  for (const entry of moonEntries) {
    const label = String(entry?.model?.radiation?.surfaceClass || "").toLowerCase();
    const rank = rankByClass[label] || 0;
    if (rank > strongestRank) {
      strongestRank = rank;
      strongest = entry.model.radiation.surfaceClass;
    }
  }
  return strongest || "unknown";
}

function buildParentSpinContext(parent, moonSystem) {
  const rotationPeriodHours = parentRotationHours(parent);
  const synchronousOrbit = moonSystem?.synchronousOrbit || null;
  const hasSharedSynchronousOrbit = synchronousOrbit?.valid === true;
  const reasons = [];
  if (hasSharedSynchronousOrbit) {
    reasons.push("Parent rotation is shared with the solved moon synchronous-orbit context.");
  } else {
    reasons.push(
      "Parent synchronous-orbit context is unavailable or invalid for this moon system.",
    );
  }
  if (!(rotationPeriodHours > 0)) {
    reasons.push("Parent rotation period is missing, so spin coupling confidence is unknown.");
  }

  return {
    modelVersion: "dynamical-parent-spin-context-v1",
    rotationPeriodHours,
    synchronousOrbitKm: synchronousOrbit?.radiusKm ?? null,
    synchronousOrbitParentRadii: synchronousOrbit?.radiusParentRadii ?? null,
    sharedWithMoonMigration: hasSharedSynchronousOrbit,
    confidence: rotationPeriodHours > 0 && hasSharedSynchronousOrbit ? "medium" : "unknown",
    reasons,
  };
}

function buildParentRingContext({ parent, moonSystem }) {
  const model = parent?.model || {};
  const ringProperties = model.ringProperties || null;
  const gravity = model.gravity || {};
  const hasRingModel = !!ringProperties || !!model.derived?.ringScienceReason;
  const notes = [
    "Ring interpretation uses existing Roche/ring models plus assigned moon context; no migration history is solved.",
  ];
  if (!hasRingModel) {
    notes.push("No parent ring model is available, so ring context remains qualitative.");
  }
  if (moonSystem?.constraints?.length) {
    notes.push(
      "Assigned moon stability constraints should be checked before interpreting ring support.",
    );
  }

  return {
    modelVersion: "dynamical-ring-context-v1",
    parentBodyId: moonSystem?.parentBodyId || parent?.id || null,
    parentKind: parent?.kind || "unknown",
    moonCount: moonSystem?.moons?.length || 0,
    ringType: ringProperties?.ringType || model.derived?.ringType || "unknown",
    ringComposition: ringProperties?.ringComposition || "unknown",
    opticalDepthClass: ringProperties?.opticalDepthClass || "unknown",
    rocheLimitIceKm: optionalFinite(gravity.rocheLimit_iceKm),
    rocheLimitRockKm: optionalFinite(gravity.rocheLimit_rockKm),
    ringZoneInnerKm: optionalFinite(gravity.ringZoneInnerKm),
    ringZoneOuterKm: optionalFinite(gravity.ringZoneOuterKm),
    dominantMoonId: moonSystem?.torqueBudget?.dominantMoonId || null,
    netTorqueClass: moonSystem?.torqueBudget?.netTorqueClass || "unknown",
    confidence: hasRingModel ? "medium" : "unknown",
    notes,
  };
}

function buildParentRadiationContext({ parent, moonEntries, moonSystem }) {
  const model = parent?.model || {};
  const magnetic = model.magnetic || {};
  const magnetosphereEnvironment =
    magnetic.magnetosphereEnvironment || model.derived?.magnetosphereEnvironment || null;
  const notes = [
    "Parent radiation and plasma diagnostics should be read with the solved moon-system torque/heating context; this is not a detailed magnetodisk model.",
  ];
  if (!magnetosphereEnvironment) {
    notes.push(
      "No parent magnetosphere environment is available, so radiation context remains qualitative.",
    );
  }
  if (moonSystem?.sustainedTidalHeating?.class === "overdriven") {
    notes.push(
      "Overdriven moon heating may imply strong plasma sources, but no detailed plasma transport is solved.",
    );
  }

  return {
    modelVersion: "dynamical-parent-radiation-context-v1",
    parentBodyId: moonSystem?.parentBodyId || parent?.id || null,
    parentKind: parent?.kind || "unknown",
    magnetosphereSupported: magnetosphereEnvironment?.supported === true,
    compressionClass: magnetosphereEnvironment?.compressionClass || "unknown",
    magnetopauseRp: optionalFinite(magnetosphereEnvironment?.magnetopauseRp),
    sputteringPlasmaW: optionalFinite(magnetic.sputteringPlasmaW),
    moonPlasmaSourcePowerW: optionalFinite(magnetic.moonPlasmaSourcePowerW),
    moonPlasmaSourceClass: magnetic.moonPlasmaSourceClass || "unknown",
    moonPlasmaSourceMode: magnetic.moonPlasmaSourceMode || "unknown",
    strongestMoonSurfaceRadiationClass: strongestRadiationClass(moonEntries),
    moonCount: moonSystem?.moons?.length || 0,
    netTorqueClass: moonSystem?.torqueBudget?.netTorqueClass || "unknown",
    dominantMoonId: moonSystem?.torqueBudget?.dominantMoonId || null,
    sustainedTidalHeatingClass: moonSystem?.sustainedTidalHeating?.class || "unknown",
    confidence: magnetosphereEnvironment ? "medium" : "unknown",
    notes,
  };
}

function buildParentMoonSystemContext({ parent, moonSystem }) {
  const spinContext = buildParentSpinContext(parent, moonSystem);
  const confidence = lowestConfidence(
    lowestConfidence(
      moonSystem?.summary?.confidence || "unknown",
      moonSystem?.ringContext?.confidence || "unknown",
    ),
    moonSystem?.radiationContext?.confidence || "unknown",
  );
  return {
    modelVersion: "dynamical-parent-moon-system-context-v1",
    parentBodyId: moonSystem?.parentBodyId || parent?.id || null,
    parentKind: parent?.kind || "unknown",
    moonCount: moonSystem?.moons?.length || 0,
    spinContext,
    torqueBudget: moonSystem?.torqueBudget || null,
    sustainedTidalHeating: moonSystem?.sustainedTidalHeating || null,
    ringContext: moonSystem?.ringContext || null,
    radiationContext: moonSystem?.radiationContext || null,
    confidence,
    notes: [
      "Parent moon-system context shares solved spin, torque, ring, and radiation diagnostics without adding orbital history claims.",
    ],
  };
}

function attachParentMoonSystemContexts({ snapshot, bodies, moonSystems }) {
  for (const [parentId, moonSystem] of Object.entries(moonSystems)) {
    const body = bodies[parentId];
    if (!body) continue;
    body.moonSystemContext = buildParentMoonSystemContext({
      parent: parentContext(snapshot, parentId),
      moonSystem,
    });
  }
}

function buildMoonSystems(snapshot, bodyContexts) {
  const moonSystems = Object.create(null);
  for (const [parentId, moonIds] of Object.entries(objectOrEmpty(snapshot?.moonsByParentId))) {
    const parent = parentContext(snapshot, parentId);
    const moonEntries = moonIds.map((moonId) => snapshot?.moonsById?.[moonId]).filter(Boolean);
    const torqueBudget = buildMoonTorqueBudget({
      parent: {
        id: parentId,
        name: parent?.name || parentId,
      },
      moonResults: moonEntries.map((entry) => ({
        raw: entry.source || { id: entry.id, inputs: { name: entry.name } },
        model: entry.model,
      })),
    });
    const moons = moonEntries.map((entry) => ({
      moonId: entry.id,
      moonName: entry.name || entry.id,
      stabilityState: bodyContexts[entry.id]?.stabilityContext?.state || "unknown",
      migrationDirection: bodyContexts[entry.id]?.tidalContext?.migrationDirection || "unknown",
      sustainedTidalHeatingClass:
        bodyContexts[entry.id]?.tidalContext?.sustainedHeatingClass || "unknown",
      eccentricityPersistence:
        bodyContexts[entry.id]?.tidalContext?.eccentricityPersistence || "unknown",
    }));

    moonSystems[parentId] = {
      parentBodyId: parentId,
      synchronousOrbit: moonEntries[0]?.model?.tides
        ? {
            radiusKm: optionalFinite(moonEntries[0].model.tides.synchronousOrbitKm),
            radiusParentRadii: optionalFinite(
              moonEntries[0].model.tides.synchronousOrbitParentRadii,
            ),
            valid: moonEntries[0].model.tides.synchronousOrbitValid === true,
            note: moonEntries[0].model.tides.synchronousOrbitNote || "",
          }
        : null,
      torqueBudget,
      resonanceNetwork: {
        resonantMoonIds: moonEntries
          .filter((entry) => entry.model?.resonance?.nearestResonance)
          .map((entry) => entry.id),
        chainIds: [
          ...new Set(
            moonEntries.map((entry) => entry.model?.resonance?.laplaceChainId).filter(Boolean),
          ),
        ],
      },
      moons,
      sustainedTidalHeating: summarizeSustainedHeating(moons),
      constraints: moons
        .filter((moon) => moon.stabilityState !== "stable")
        .map((moon) => ({
          bodyId: moon.moonId,
          state: moon.stabilityState,
        })),
      summary: {
        state: torqueBudget.netTorqueClass || "unknown",
        confidence: torqueBudget.netTorqueClass === "unknown" ? "unknown" : "medium",
        note: torqueBudget.notes?.[0] || "",
      },
    };
    moonSystems[parentId].ringContext = buildParentRingContext({
      parent,
      moonSystem: moonSystems[parentId],
    });
    moonSystems[parentId].radiationContext = buildParentRadiationContext({
      parent,
      moonEntries,
      moonSystem: moonSystems[parentId],
    });
  }
  return moonSystems;
}

function buildSystemSummary({ hostFrames, bodies, generationGuidance, longTermDynamicsContext }) {
  let state = "unknown";
  let confidence = "high";
  const limitingFactors = [];
  const userFacingNotes = [];

  for (const frame of Object.values(hostFrames)) {
    state = worstState(state, frame.summary?.state);
    confidence = lowestConfidence(confidence, frame.summary?.confidence);
    if (frame.summary?.note) limitingFactors.push(frame.summary.note);
  }
  for (const body of Object.values(bodies)) {
    state = worstState(state, body.stabilityContext?.state);
    confidence = lowestConfidence(confidence, body.stabilityContext?.confidence);
    for (const reason of body.stabilityContext?.reasons || []) {
      if (body.stabilityContext?.state !== "stable") limitingFactors.push(reason);
    }
    for (const reason of body.tidalContext?.reasons || []) {
      if (body.tidalContext?.sustainedHeatingClass === "uncertain") {
        userFacingNotes.push(reason);
      }
    }
    const variability = body.dynamicalVariabilityContext?.outputs || {};
    const variabilityWarning = String(variability.habitabilityVariabilityWarning || "none");
    if (variabilityWarning !== "none") {
      for (const note of variability.climateWarningMessages || []) {
        userFacingNotes.push(note);
      }
      if (variabilityWarning === "high-orbital-variability") {
        confidence = lowestConfidence(confidence, "medium");
      }
    }
  }
  for (const note of generationGuidance?.displayNotes || []) {
    userFacingNotes.push(note);
  }
  for (const note of longTermDynamicsContext?.outputs?.userFacingSummary || []) {
    userFacingNotes.push(note);
  }
  const kozaiClass = String(longTermDynamicsContext?.outputs?.kozaiLidovClass || "");
  if (kozaiClass === "possible" || kozaiClass === "likely") {
    userFacingNotes.push(
      "Long-term secular diagnostics indicate possible Kozai-Lidov cycling; treat this as a bounded warning, not an integrated orbit history.",
    );
  }
  const variabilityClass = String(
    longTermDynamicsContext?.outputs?.dynamicalVariabilityClass || "",
  );
  if (variabilityClass === "moderate" || variabilityClass === "high") {
    userFacingNotes.push(
      "Long-cycle dynamical variability is shown as a warning only; authored orbit values are unchanged.",
    );
  }

  if (!Object.keys(hostFrames).length && !Object.keys(bodies).length) {
    confidence = "unknown";
    limitingFactors.push("No orbiting bodies are available for shared dynamical context.");
  }

  return {
    state,
    confidence,
    limitingFactors: [...new Set(limitingFactors.filter(Boolean))],
    repairSuggestions: generationGuidance?.repairSuggestions || [],
    userFacingNotes: [...new Set(userFacingNotes.filter(Boolean))],
  };
}

function buildContextFromSnapshot(snapshot, { includeGenerationGuidance }) {
  const defaultHostFrameId = snapshot?.meta?.defaultHostFrameId || "star_a";
  const allHostFrames = objectOrEmpty(snapshot?.hostFramesById);
  const hostFrameIds = new Set([
    ...Object.keys(allHostFrames),
    ...valuesOf(snapshot?.planetsById)
      .map((entry) => entry.hostFrameId)
      .filter(Boolean),
    ...valuesOf(snapshot?.gasGiantsById)
      .map((entry) => entry.hostFrameId)
      .filter(Boolean),
    defaultHostFrameId,
  ]);
  const hostFrames = Object.create(null);
  const architectureByHostFrameId = new Map();

  for (const rawHostFrameId of hostFrameIds) {
    const hostFrameId = normalizeHostFrameId(rawHostFrameId, defaultHostFrameId);
    if (!hostFrameId) continue;
    const hostFrame = allHostFrames[hostFrameId] || null;
    const architecture = analyseOrbitalArchitecture({
      hostMassMsol: hostMassMsolForFrame(hostFrame, snapshot),
      hostFrameId,
      bodies: architectureInputBodies(snapshot, hostFrameId),
    });
    architectureByHostFrameId.set(hostFrameId, architecture);
    hostFrames[hostFrameId] = {
      frameKind:
        hostFrame?.frameKind || (hostFrameId === defaultHostFrameId ? "single" : "unknown"),
      stability: hostFrame?.stability || null,
      orbitalArchitecture: architecture,
      constraints: hostFrame?.stability?.warnings || [],
      summary: {
        state: architecture.summary.state,
        confidence: architecture.summary.confidence,
        note: architecture.summary.note,
      },
    };
  }

  const bodies = Object.create(null);
  for (const entry of [...valuesOf(snapshot?.planetsById), ...valuesOf(snapshot?.gasGiantsById)]) {
    const hostFrameId = normalizeHostFrameId(entry.hostFrameId, defaultHostFrameId);
    const architecture = architectureByHostFrameId.get(hostFrameId);
    bodies[entry.id] = {
      bodyId: entry.id,
      bodyKind: entry.kind === "gasGiant" ? "gasGiant" : "planet",
      hostFrameId,
      orbitalState: buildBodyOrbitalState(entry),
      stabilityContext: stabilityContextForBody(architecture, entry.id),
      tidalContext: {
        migrationDirection: "unknown",
        eccentricityPersistence: "unknown",
        sustainedHeatingClass: "unknown",
        confidence: "unknown",
        reasons: [],
      },
      habitabilityBridge: null,
      display: {},
    };
  }

  for (const entry of valuesOf(snapshot?.moonsById)) {
    const model = entry.model || {};
    const stabilityContext = stabilityContextForMoon(model);
    const tidalContext = buildMoonTidalContext(model);
    const habitabilityBridge = buildHabitabilityPersistenceBridge({
      bodyId: entry.id,
      bodyKind: "moon",
      stabilityContext,
      tidalContext,
      hydrosphere: model.habitability?.hydrosphere || model.hydrosphere || null,
      geology: model.geology || null,
    });
    bodies[entry.id] = {
      bodyId: entry.id,
      bodyKind: "moon",
      hostFrameId: normalizeHostFrameId(entry.hostFrameId, defaultHostFrameId),
      parentBodyId: entry.parentId,
      parentKind: entry.parentKind || "unknown",
      orbitalState: buildMoonOrbitalState(entry),
      stabilityContext,
      tidalContext,
      habitabilityBridge,
      display: {},
    };
  }

  const moonSystems = buildMoonSystems(snapshot, bodies);
  attachParentMoonSystemContexts({ snapshot, bodies, moonSystems });
  const longTermDynamicsContext = buildLongTermDynamicsContext({
    snapshot,
    hostFrames,
    architectureByHostFrameId,
  });
  for (const bodyContext of Object.values(longTermDynamicsContext.bodyContextsByRef || {})) {
    if (!bodyContext?.bodyId || !bodies[bodyContext.bodyId]) continue;
    bodies[bodyContext.bodyId].longTermDynamicsContext = bodyContext;
    bodies[bodyContext.bodyId].dynamicalVariabilityContext =
      bodyContext.dynamicalVariabilityContext || null;
    const variability = bodyContext.dynamicalVariabilityContext?.outputs || {};
    const tidalCaveats = Array.isArray(variability.tidalPersistenceCaveats)
      ? variability.tidalPersistenceCaveats
      : [];
    if (tidalCaveats.length) {
      bodies[bodyContext.bodyId].tidalContext = {
        ...bodies[bodyContext.bodyId].tidalContext,
        reasons: [
          ...new Set([
            ...(bodies[bodyContext.bodyId].tidalContext?.reasons || []),
            ...tidalCaveats,
          ]),
        ],
      };
    }
    const variabilityPersistenceModifier = Number(variability.persistenceModifier);
    if (
      bodies[bodyContext.bodyId].habitabilityBridge &&
      Number.isFinite(variabilityPersistenceModifier) &&
      variabilityPersistenceModifier < 1
    ) {
      bodies[bodyContext.bodyId].habitabilityBridge = {
        ...bodies[bodyContext.bodyId].habitabilityBridge,
        persistenceModifier: Math.min(
          bodies[bodyContext.bodyId].habitabilityBridge.persistenceModifier ?? 1,
          variabilityPersistenceModifier,
        ),
        reasons: [
          ...new Set([
            ...(bodies[bodyContext.bodyId].habitabilityBridge.reasons || []),
            ...(variability.climateWarningMessages || []),
          ]),
        ],
      };
    }
  }
  const baseContext = normalizeDynamicalContext({
    confidence: "high",
    assumptions: [
      {
        key: "bounded-shared-context",
        label: "Shared context is diagnostic",
        appliesTo: "system",
        severity: "info",
      },
    ],
    hostFrames,
    bodies,
    moonSystems,
    longTermDynamicsContext,
    systemSummary: {
      state: "unknown",
      limitingFactors: [],
      repairSuggestions: [],
      userFacingNotes: [],
    },
  });
  const generationGuidance = includeGenerationGuidance
    ? buildGenerationGuidanceForContext(baseContext)
    : null;
  const systemSummary = buildSystemSummary({
    hostFrames: baseContext.hostFrames,
    bodies: baseContext.bodies,
    generationGuidance,
    longTermDynamicsContext: baseContext.longTermDynamicsContext,
  });
  const context = normalizeDynamicalContext({
    ...baseContext,
    confidence: systemSummary.confidence,
    systemSummary,
  });

  if (generationGuidance) {
    for (const body of Object.values(context.bodies)) {
      body.generationGuidance = {
        hardBlocks: generationGuidance.hardBlocks.filter((entry) => entry.targetId === body.bodyId),
        softWarnings: generationGuidance.softWarnings.filter(
          (entry) => entry.targetId === body.bodyId,
        ),
        repairSuggestions: generationGuidance.repairSuggestions.filter(
          (entry) => entry.targetId === body.bodyId,
        ),
      };
    }
    context.generationGuidance = generationGuidance;
  }

  return context;
}

export function buildDynamicalContext({
  world,
  detailLevel = "summary",
  includeGenerationGuidance = false,
} = {}) {
  if (!world || typeof world !== "object") {
    return makeUnknownDynamicalContext("No world is available for shared dynamical context.");
  }
  const requestedDetailLevel = normalizeDetailLevel(detailLevel);
  const snapshot = buildWorldSnapshot(world, {
    mode: "full",
    dynamicalDetailLevel: requestedDetailLevel,
  });
  return buildContextFromSnapshot(snapshot, { includeGenerationGuidance });
}

export function getBodyDynamicalContext(dynamicalContext, bodyId) {
  return dynamicalContext?.bodies?.[String(bodyId || "")] || null;
}

export function getMoonSystemDynamicalContext(dynamicalContext, parentBodyId) {
  return dynamicalContext?.moonSystems?.[String(parentBodyId || "")] || null;
}

export function summarizeDynamicalConstraints(dynamicalContext, options = {}) {
  return formatDynamicalConstraintSummary(dynamicalContext, options);
}
