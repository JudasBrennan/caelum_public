import { buildCassiniStateContext } from "./cassiniStateContext.js";
import { buildDynamicalVariabilityContext } from "./dynamicalVariabilityContext.js";
import { buildMigrationHistoryContext } from "./migrationHistoryContext.js";
import { buildPrecessionContext } from "./precessionContext.js";
import { buildSecularDynamicsContext } from "./secularDynamicsContext.js";
import { buildTrojanPopulationContext } from "./trojanPopulationContext.js";
import { CONFIDENCE, CONTEXT_STATUS, makeContext, roundMaybe } from "./validation.js";

const MODEL_VERSION = "long-term-dynamics-context-v1";
const SOURCE_KEYS = [
  "longTermDynamics",
  "secularDynamics",
  "precession",
  "cassiniState",
  "migrationHistory",
  "trojanPopulation",
  "dynamicalVariability",
];
const EARTH_MASS_PER_MSOL = 332946.0487;
const EARTH_MASS_PER_MJUP = 317.828406;

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function valuesOf(value) {
  return Object.values(objectOrEmpty(value));
}

function positive(value, fallback = NaN) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function optionalNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeHostFrameId(value, fallback = null) {
  const text = String(value ?? "").trim();
  return text || fallback || null;
}

function bodyRefFor(entry) {
  const kind = entry?.kind === "moon" ? "moon" : entry?.kind === "gasGiant" ? "gasGiant" : "planet";
  return `${kind}:${entry?.id || ""}`;
}

function bodyMassEarth(entry) {
  if (entry?.kind === "gasGiant") {
    const sourceMassMjup = positive(entry?.source?.massMjup ?? entry?.source?.massJupiter);
    return (
      positive(entry?.model?.physical?.massEarth) ||
      positive(entry?.source?.massEarth) ||
      (Number.isFinite(sourceMassMjup) ? sourceMassMjup * EARTH_MASS_PER_MJUP : NaN)
    );
  }
  if (entry?.kind === "moon") {
    return positive(entry?.model?.physical?.massEarth);
  }
  return (
    positive(entry?.model?.inputs?.massEarth) ||
    positive(entry?.model?.physical?.massEarth) ||
    positive(entry?.source?.inputs?.massEarth)
  );
}

function bodyOrbitAu(entry) {
  return positive(
    entry?.orbitAu ??
      entry?.model?.inputs?.semiMajorAxisAu ??
      entry?.model?.inputs?.orbitAu ??
      entry?.source?.inputs?.semiMajorAxisAu ??
      entry?.source?.au ??
      entry?.source?.orbitAu,
  );
}

function bodyPeriodDays(entry) {
  return optionalNumber(
    entry?.model?.derived?.orbitalPeriodEarthDays ??
      entry?.model?.orbital?.orbitalPeriodDays ??
      entry?.model?.orbit?.orbitalPeriodDays ??
      entry?.orbitalPeriodEarthDays ??
      entry?.orbitalPeriodDays,
  );
}

function bodyEccentricity(entry) {
  return optionalNumber(
    entry?.model?.inputs?.eccentricity ??
      entry?.model?.orbit?.eccentricity ??
      entry?.source?.inputs?.eccentricity ??
      entry?.source?.eccentricity,
    0,
  );
}

function bodyInclination(entry) {
  return optionalNumber(
    entry?.model?.inputs?.inclinationDeg ??
      entry?.model?.orbit?.inclinationDeg ??
      entry?.source?.inputs?.inclinationDeg ??
      entry?.source?.inclinationDeg,
    null,
  );
}

function hostMassMsolForFrame(hostFrame, snapshot) {
  return (
    positive(hostFrame?.system?.inputs?.starMassMsol) ||
    positive(hostFrame?.system?.starMassMsol) ||
    positive(hostFrame?.primaryMassMsol) ||
    positive(hostFrame?.combinedMassMsol) ||
    positive(snapshot?.star?.inputs?.massMsol) ||
    positive(snapshot?.star?.massMsol) ||
    1
  );
}

function hostFrameKind(hostFrame, snapshot) {
  return (
    hostFrame?.orbitFamilyKind || hostFrame?.frameKind || snapshot?.meta?.topologyKind || "single"
  );
}

function pairById(snapshot, id) {
  return snapshot?.stellarSystem?.pairs?.byId?.[String(id || "")] || null;
}

function companionSeparationAu(hostFrame, snapshot) {
  const direct = positive(hostFrame?.pair?.semiMajorAxisAu);
  if (Number.isFinite(direct)) return direct;
  const parentPair = pairById(snapshot, hostFrame?.parentPairId);
  if (parentPair) return positive(parentPair.semiMajorAxisAu);
  const ancestorId =
    hostFrame?.ancestorPairIds?.[0] || hostFrame?.stability?.ancestorConstraints?.[0]?.pairId;
  const ancestorPair = pairById(snapshot, ancestorId);
  if (ancestorPair) return positive(ancestorPair.semiMajorAxisAu);
  return positive(hostFrame?.stability?.criticalOuterAu);
}

function companionEccentricity(hostFrame, snapshot) {
  const direct = optionalNumber(hostFrame?.pair?.eccentricity);
  if (direct != null) return direct;
  const parentPair = pairById(snapshot, hostFrame?.parentPairId);
  if (parentPair) return optionalNumber(parentPair.eccentricity, 0);
  const ancestor = hostFrame?.stability?.ancestorConstraints?.[0];
  return optionalNumber(ancestor?.eccentricity, 0);
}

function hostFrameBodies(snapshot, hostFrameId) {
  return [...valuesOf(snapshot?.planetsById), ...valuesOf(snapshot?.gasGiantsById)].filter(
    (entry) =>
      normalizeHostFrameId(entry?.hostFrameId, snapshot?.meta?.defaultHostFrameId) === hostFrameId,
  );
}

function snowLineAu(snapshot, hostFrame) {
  return (
    positive(hostFrame?.zones?.frostLineAu) ||
    positive(hostFrame?.system?.frostLineAu) ||
    positive(snapshot?.system?.frostLineAu) ||
    2.7 * Math.sqrt(positive(snapshot?.star?.luminosityLsol, 1))
  );
}

function perturbationClassForArchitecture(architecture, bodyId) {
  const pair = (architecture?.pairs || []).find(
    (entry) => entry.innerId === bodyId || entry.outerId === bodyId,
  );
  const state = pair?.state || architecture?.summary?.state || "unknown";
  if (state === "unstable" || state === "crowded") return "strong";
  if (state === "packed") return "moderate";
  if (state === "stable") return "weak";
  return "unknown";
}

function rankClass(value, order) {
  return order.indexOf(String(value || "unknown"));
}

function maxByRank(values, order, fallback = "unknown") {
  let best = fallback;
  let bestRank = rankClass(best, order);
  for (const value of values) {
    const rank = rankClass(value, order);
    if (rank > bestRank) {
      best = value;
      bestRank = rank;
    }
  }
  return best;
}

function displayLabel(value) {
  return String(value || "unknown").replace(/[-_]/g, " ");
}

function bodyNameForEntry(entry) {
  const fallbackKind =
    entry?.kind === "moon" ? "Moon" : entry?.kind === "gasGiant" ? "Gas giant" : "Planet";
  const candidates = [
    entry?.source?.inputs?.name,
    entry?.model?.inputs?.name,
    entry?.source?.name,
    entry?.name,
  ];
  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim();
    if (text && text !== String(entry?.id || "").trim()) return text;
  }
  return fallbackKind;
}

function buildBodyLongTermContext({ entry, hostFrame, snapshot, architecture, migrationContext }) {
  const hostFrameId = normalizeHostFrameId(entry?.hostFrameId, snapshot?.meta?.defaultHostFrameId);
  const hostMassMsol = hostMassMsolForFrame(hostFrame, snapshot);
  const massEarth = bodyMassEarth(entry);
  const orbitAu = bodyOrbitAu(entry);
  const periodDays = bodyPeriodDays(entry);
  const inclinationDeg = bodyInclination(entry);
  const secularContext =
    entry?.kind === "moon"
      ? null
      : buildSecularDynamicsContext({
          hostFrameKind: hostFrameKind(hostFrame, snapshot),
          companionSeparationAu: companionSeparationAu(hostFrame, snapshot),
          innerSemiMajorAxisAu: orbitAu,
          outerSemiMajorAxisAu: companionSeparationAu(hostFrame, snapshot),
          innerOrbitalPeriodDays: periodDays,
          outerEccentricity: companionEccentricity(hostFrame, snapshot),
          eccentricity: bodyEccentricity(entry),
          mutualInclinationDeg: inclinationDeg,
          adjacentSpacingMutualHill: architecture?.summary?.minSeparationMutualHill,
          systemAgeGyr: optionalNumber(snapshot?.star?.inputs?.ageGyr ?? snapshot?.star?.ageGyr),
        });
  const precessionContext =
    entry?.kind === "moon"
      ? null
      : buildPrecessionContext({
          centralMassMsol: hostMassMsol,
          semiMajorAxisAu: orbitAu,
          eccentricity: bodyEccentricity(entry),
          inclinationDeg: inclinationDeg ?? 0,
          includeRelativistic: true,
        });
  const cassiniStateContext =
    entry?.kind === "moon"
      ? null
      : buildCassiniStateContext({
          obliquityDeg:
            entry?.model?.inputs?.axialTiltDeg ??
            entry?.source?.inputs?.axialTiltDeg ??
            entry?.source?.axialTiltDeg,
          spinPeriodHours:
            entry?.model?.inputs?.rotationPeriodHours ??
            entry?.source?.inputs?.rotationPeriodHours ??
            entry?.source?.rotationPeriodHours,
        });
  const moonOrientationContext = entry?.model?.dynamicalContext?.moonOrientationContext || null;
  const trojanPopulationContext =
    entry?.kind === "moon"
      ? null
      : buildTrojanPopulationContext({
          primaryMass: hostMassMsol * EARTH_MASS_PER_MSOL,
          secondaryMass: massEarth,
          secondaryMassEarth: massEarth,
          eccentricity: bodyEccentricity(entry),
          inclinationDeg: inclinationDeg ?? 0,
          neighboringPerturbationClass: perturbationClassForArchitecture(architecture, entry?.id),
          debrisReservoirClass: "unknown",
          migrationCaptureEvidence:
            migrationContext?.outputs?.dominantMigrationEvidence === "nice-model-like" ||
            migrationContext?.outputs?.dominantMigrationEvidence === "trojan-capture-evidence",
          semiMajorAxisAu: orbitAu,
          snowLineAu: snowLineAu(snapshot, hostFrame),
        });
  const secularClass =
    secularContext?.outputs?.secularForcingClass ||
    moonOrientationContext?.outputs?.laplaceRegimeClass ||
    "unknown";
  const precessionClass =
    precessionContext?.outputs?.calendarEraDriftClass ||
    moonOrientationContext?.outputs?.nodalPrecessionClass ||
    "unknown";
  const bodyRef = bodyRefFor(entry);
  const bodyName = bodyNameForEntry(entry);
  const eccentricity = bodyEccentricity(entry);
  const dynamicalVariabilityContext = buildDynamicalVariabilityContext({
    bodyId: entry?.id || "",
    bodyName,
    bodyRef,
    bodyKind: entry?.kind || "unknown",
    longTermDynamicsContext: {
      bodyRef,
      bodyId: entry?.id || "",
      bodyName,
      bodyKind: entry?.kind || "unknown",
      secularContext,
      precessionContext,
      cassiniStateContext,
      moonOrientationContext,
      migrationEvidenceClass: migrationContext?.outputs?.migrationEvidenceClass || "unknown",
      summary: {
        secularClass,
        precessionClass,
        cassiniReadinessClass:
          cassiniStateContext?.outputs?.cassiniReadinessClass ||
          moonOrientationContext?.outputs?.cassiniReadinessClass ||
          "unknown",
      },
      confidence: migrationContext?.confidence || "unknown",
    },
    secularDynamicsContext: secularContext,
    precessionContext,
    cassiniStateContext,
    moonOrientationContext,
    migrationHistoryContext: migrationContext,
    eccentricity,
    inclinationDeg,
    manualOverride: entry?.source?.locked === true || entry?.locked === true,
  });

  return {
    bodyRef,
    bodyId: entry?.id || "",
    bodyName,
    bodyKind: entry?.kind || "unknown",
    hostFrameId,
    secularContext,
    precessionContext,
    cassiniStateContext,
    moonOrientationContext,
    trojanPopulationContext,
    dynamicalVariabilityContext,
    migrationEvidenceClass: migrationContext?.outputs?.migrationEvidenceClass || "unknown",
    summary: {
      secularClass,
      precessionClass,
      variabilityClass:
        dynamicalVariabilityContext.outputs?.dynamicalVariabilityRiskClass || "unknown",
      cassiniReadinessClass:
        cassiniStateContext?.outputs?.cassiniReadinessClass ||
        moonOrientationContext?.outputs?.cassiniReadinessClass ||
        "unknown",
      trojanReservoirClass:
        trojanPopulationContext?.outputs?.trojanReservoirClass || "not-applicable",
    },
  };
}

export function buildLongTermDynamicsContext({
  snapshot,
  hostFrames = null,
  architectureByHostFrameId = null,
} = {}) {
  const sourceSnapshot = snapshot && typeof snapshot === "object" ? snapshot : null;
  if (!sourceSnapshot) {
    return makeContext({
      modelVersion: MODEL_VERSION,
      status: CONTEXT_STATUS.UNKNOWN,
      confidence: CONFIDENCE.UNKNOWN,
      limitingFactors: ["No world snapshot is available."],
      sourceKeys: SOURCE_KEYS,
    });
  }
  const defaultHostFrameId = sourceSnapshot.meta?.defaultHostFrameId || "star_a";
  const frameMap = objectOrEmpty(sourceSnapshot.hostFramesById);
  const hostFrameIds = new Set([
    ...Object.keys(frameMap),
    ...valuesOf(sourceSnapshot.planetsById).map((entry) =>
      normalizeHostFrameId(entry?.hostFrameId, defaultHostFrameId),
    ),
    ...valuesOf(sourceSnapshot.gasGiantsById).map((entry) =>
      normalizeHostFrameId(entry?.hostFrameId, defaultHostFrameId),
    ),
    defaultHostFrameId,
  ]);

  const bodyEntries = [
    ...valuesOf(sourceSnapshot.planetsById),
    ...valuesOf(sourceSnapshot.gasGiantsById),
    ...valuesOf(sourceSnapshot.moonsById),
  ];
  const firstHostFrame = frameMap[defaultHostFrameId] || Object.values(frameMap)[0] || null;
  const migrationContext = buildMigrationHistoryContext({
    bodies: bodyEntries
      .filter((entry) => entry.kind !== "moon")
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        kind: entry.kind,
        massEarth: bodyMassEarth(entry),
        semiMajorAxisAu: bodyOrbitAu(entry),
        eccentricity: bodyEccentricity(entry),
        inclinationDeg: bodyInclination(entry) ?? 0,
        compositionClass:
          entry?.classification?.family || entry?.model?.classification?.family || "",
      })),
    snowLineAu: snowLineAu(sourceSnapshot, firstHostFrame),
    compactResonantChain: Object.values(objectOrEmpty(hostFrames)).some(
      (frame) => frame?.orbitalArchitecture?.summary?.state === "packed",
    ),
    systemAgeGyr: optionalNumber(
      sourceSnapshot?.star?.inputs?.ageGyr ?? sourceSnapshot?.star?.ageGyr,
    ),
  });

  const hostFrameContexts = Object.create(null);
  const bodyContextsByRef = Object.create(null);
  for (const rawHostFrameId of hostFrameIds) {
    const hostFrameId = normalizeHostFrameId(rawHostFrameId, defaultHostFrameId);
    if (!hostFrameId) continue;
    const hostFrame = frameMap[hostFrameId] || null;
    const architecture =
      architectureByHostFrameId?.get?.(hostFrameId) ||
      architectureByHostFrameId?.[hostFrameId] ||
      hostFrames?.[hostFrameId]?.orbitalArchitecture ||
      null;
    const entries = hostFrameBodies(sourceSnapshot, hostFrameId);
    const strongestSecular = [];
    for (const entry of entries) {
      const bodyContext = buildBodyLongTermContext({
        entry,
        hostFrame,
        snapshot: sourceSnapshot,
        architecture,
        migrationContext,
      });
      bodyContextsByRef[bodyContext.bodyRef] = bodyContext;
      strongestSecular.push(bodyContext.secularContext?.outputs?.secularForcingClass || "unknown");
    }
    hostFrameContexts[hostFrameId] = {
      hostFrameId,
      frameKind: hostFrameKind(hostFrame, sourceSnapshot),
      secularForcingClass: maxByRank(strongestSecular, [
        "unknown",
        "minimal",
        "weak",
        "moderate",
        "strong",
      ]),
      companionSeparationAu: roundMaybe(companionSeparationAu(hostFrame, sourceSnapshot), 6),
      bodyCount: entries.length,
    };
  }

  for (const entry of valuesOf(sourceSnapshot.moonsById)) {
    const hostFrameId = normalizeHostFrameId(entry.hostFrameId, defaultHostFrameId);
    const hostFrame = frameMap[hostFrameId] || null;
    const bodyContext = buildBodyLongTermContext({
      entry,
      hostFrame,
      snapshot: sourceSnapshot,
      architecture: null,
      migrationContext,
    });
    bodyContextsByRef[bodyContext.bodyRef] = bodyContext;
  }

  const bodyContexts = Object.values(bodyContextsByRef);
  const systemSecularClass = maxByRank(
    bodyContexts.map((entry) => entry.secularContext?.outputs?.secularForcingClass || "unknown"),
    ["unknown", "minimal", "weak", "moderate", "strong"],
  );
  const kozaiLidovClass = maxByRank(
    bodyContexts.map((entry) => entry.secularContext?.outputs?.kozaiLidovClass || "unknown"),
    ["unknown", "not-indicated", "possible", "likely"],
  );
  const precessionRelevanceClass = maxByRank(
    bodyContexts.map((entry) => entry.summary?.precessionClass || "unknown"),
    ["unknown", "minimal", "geologic-era", "calendar-era", "historical-era"],
  );
  const dynamicalVariabilityClass = maxByRank(
    bodyContexts.map(
      (entry) => entry.dynamicalVariabilityContext?.outputs?.dynamicalVariabilityRiskClass,
    ),
    ["unknown", "minimal", "low", "moderate", "high"],
  );
  const trojanReservoirClass = maxByRank(
    bodyContexts.map(
      (entry) => entry.trojanPopulationContext?.outputs?.trojanReservoirClass || "none",
    ),
    ["unknown", "none", "unstable", "sparse", "possible", "rich"],
    "none",
  );
  const notes = [
    `Secular forcing is ${displayLabel(systemSecularClass)}.`,
    `Migration evidence is ${displayLabel(migrationContext.outputs?.migrationEvidenceClass)}.`,
    `Trojan reservoir support is ${displayLabel(trojanReservoirClass)}.`,
  ];
  if (dynamicalVariabilityClass === "moderate" || dynamicalVariabilityClass === "high") {
    notes.push(`Long-cycle variability warning is ${displayLabel(dynamicalVariabilityClass)}.`);
  }
  const confidence =
    bodyContexts.length && migrationContext.confidence !== CONFIDENCE.UNKNOWN
      ? CONFIDENCE.LOW
      : CONFIDENCE.UNKNOWN;

  return {
    ...makeContext({
      modelVersion: MODEL_VERSION,
      status: bodyContexts.length ? CONTEXT_STATUS.SUPPORTED : CONTEXT_STATUS.UNKNOWN,
      confidence,
      inputs: {
        hostFrameId: defaultHostFrameId,
        hostFrameCount: hostFrameIds.size,
        bodyCount: bodyContexts.length,
        sourceKeys: SOURCE_KEYS,
      },
      outputs: {
        systemSecularClass,
        kozaiLidovClass,
        precessionRelevanceClass,
        dynamicalVariabilityClass,
        migrationEvidenceClass: migrationContext.outputs?.migrationEvidenceClass || "unknown",
        trojanReservoirClass,
        userFacingSummary: notes,
      },
      assumptions: [
        "Long-term dynamics are diagnostic and read-only.",
        "No N-body integration or unique migration history is solved.",
        "Calendar, climate, and apparent-size calculations must not be changed by this context.",
      ],
      limitingFactors: [
        "Missing mutual inclinations, nodes, periapsis angles, and epochs limit long-term precision.",
      ],
      notes,
      sourceKeys: SOURCE_KEYS,
    }),
    hostFrameContexts,
    bodyContextsByRef,
    migrationHistoryContext: migrationContext,
  };
}
