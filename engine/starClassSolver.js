import { calcStar } from "./star.js";
import {
  BROWN_DWARF_SPECTRAL_FAMILY_BOUNDS,
  MAIN_SEQUENCE_SPECTRAL_BUCKETS,
  parseStellarClassInput,
} from "./starClassification.js";
import { clamp, toFinite } from "./utils.js";
import { BROWN_DWARF_MAX_MSOL, BROWN_DWARF_MIN_MSOL, STAR_MIN_MSOL } from "./substellarRegime.js";

const DEFAULT_AGE_GYR = 4.6;
const DEFAULT_METALLICITY_FEH = 0;
const MAIN_SEQUENCE_MIN_MSOL = STAR_MIN_MSOL;
const MAIN_SEQUENCE_MAX_MSOL = 100;
const SOLVER_ITERATIONS = 80;
const SUBTYPE_BIN_CENTER_OFFSET = 0.05;

function failureResult({ parseResult = null, errorCode, message, notices = [] } = {}) {
  return {
    ok: false,
    parse: parseResult,
    regime: parseResult?.regime || null,
    requestedLabel: parseResult?.canonicalLabel || "",
    targetTempK: null,
    resolvedMassMsol: null,
    resolvedClass: "",
    model: null,
    notices,
    errorCode,
    message,
  };
}

function successResult({
  parseResult,
  targetTempK,
  resolvedMassMsol,
  resolvedClass,
  model,
  notices = [],
}) {
  return {
    ok: true,
    parse: parseResult,
    regime: parseResult.regime,
    requestedLabel: parseResult.canonicalLabel,
    targetTempK,
    resolvedMassMsol,
    resolvedClass,
    model,
    notices,
    errorCode: null,
    message: "",
  };
}

function findMainSequenceBucket(family) {
  return MAIN_SEQUENCE_SPECTRAL_BUCKETS.find((entry) => entry.family === family) || null;
}

function findBrownDwarfBounds(family) {
  return BROWN_DWARF_SPECTRAL_FAMILY_BOUNDS.find((entry) => entry.family === family) || null;
}

function subtypeBinCenter(subtype) {
  if (!Number.isFinite(subtype)) return 5;
  return clamp(subtype + SUBTYPE_BIN_CENTER_OFFSET, 0, 9.95);
}

export function targetTempKForMainSequenceClass(parseResult) {
  const bucket = findMainSequenceBucket(parseResult?.family);
  if (!bucket) return null;
  const subtype = subtypeBinCenter(parseResult?.subtype);
  return bucket.lo + (1 - subtype / 10) * bucket.denom;
}

export function targetTempKForBrownDwarfClass(parseResult) {
  const bounds = findBrownDwarfBounds(parseResult?.family);
  if (!bounds) return null;
  if (!Number.isFinite(parseResult?.subtype)) {
    return (bounds.minTempK + bounds.maxTempK) / 2;
  }
  const subtype = subtypeBinCenter(parseResult.subtype);
  return bounds.maxTempK - subtype * bounds.stepK;
}

function solveMassForTargetTemp({
  minMassMsol,
  maxMassMsol,
  targetTempK,
  ageGyr,
  metallicityFeH,
  evolutionMode,
}) {
  let lo = minMassMsol;
  let hi = maxMassMsol;
  let bestMass = lo;
  let bestModel = null;
  let bestDelta = Infinity;

  for (let index = 0; index < SOLVER_ITERATIONS; index += 1) {
    const mass = (lo + hi) / 2;
    const model = calcStar({
      massMsol: mass,
      ageGyr,
      metallicityFeH,
      evolutionMode,
    });
    const tempK = Number(model?.tempK);
    const delta = Math.abs(tempK - targetTempK);
    if (Number.isFinite(delta) && delta < bestDelta) {
      bestDelta = delta;
      bestMass = mass;
      bestModel = model;
    }
    if (tempK < targetTempK) lo = mass;
    else hi = mass;
  }

  const edgeModels = [minMassMsol, maxMassMsol].map((mass) => ({
    mass,
    model: calcStar({
      massMsol: mass,
      ageGyr,
      metallicityFeH,
      evolutionMode,
    }),
  }));
  edgeModels.forEach(({ mass, model }) => {
    const delta = Math.abs(Number(model?.tempK) - targetTempK);
    if (Number.isFinite(delta) && delta < bestDelta) {
      bestDelta = delta;
      bestMass = mass;
      bestModel = model;
    }
  });

  return { massMsol: bestMass, model: bestModel, deltaTempK: bestDelta };
}

function solveMainSequenceClass(parseResult, { ageGyr, metallicityFeH }) {
  const targetTempK = targetTempKForMainSequenceClass(parseResult);
  if (!Number.isFinite(targetTempK)) {
    return failureResult({
      parseResult,
      errorCode: "unsupported-class-family",
      message: "Unsupported main-sequence stellar class.",
    });
  }

  const resolved = solveMassForTargetTemp({
    minMassMsol: MAIN_SEQUENCE_MIN_MSOL,
    maxMassMsol: MAIN_SEQUENCE_MAX_MSOL,
    targetTempK,
    ageGyr,
    metallicityFeH,
    evolutionMode: "zams",
  });
  const resolvedClass = String(resolved.model?.spectralClass || "");
  if (!resolved.model || !resolvedClass.startsWith(parseResult.family)) {
    return failureResult({
      parseResult,
      errorCode: "no-main-sequence-match",
      message: "No supported main-sequence mass could resolve that stellar class.",
    });
  }

  return successResult({
    parseResult,
    targetTempK,
    resolvedMassMsol: resolved.massMsol,
    resolvedClass,
    model: resolved.model,
    notices:
      resolvedClass === parseResult.canonicalLabel
        ? []
        : [`Resolved to nearest engine class ${resolvedClass}.`],
  });
}

function solveBrownDwarfClass(parseResult, { ageGyr, metallicityFeH }) {
  const targetTempK = targetTempKForBrownDwarfClass(parseResult);
  if (!Number.isFinite(targetTempK)) {
    return failureResult({
      parseResult,
      errorCode: "unsupported-class-family",
      message: "Unsupported brown-dwarf class.",
    });
  }

  const resolved = solveMassForTargetTemp({
    minMassMsol: BROWN_DWARF_MIN_MSOL,
    maxMassMsol: BROWN_DWARF_MAX_MSOL,
    targetTempK,
    ageGyr,
    metallicityFeH,
    evolutionMode: "zams",
  });
  const resolvedClass = String(resolved.model?.spectralClass || "");
  const resolvedFamily = String(resolved.model?.spectralFamily || resolvedClass.slice(0, 1));
  if (
    !resolved.model ||
    resolved.model?.regime !== "brownDwarf" ||
    resolvedFamily !== parseResult.family
  ) {
    return failureResult({
      parseResult,
      errorCode: "no-brown-dwarf-match",
      message: "No brown-dwarf mass at the current age could resolve that class.",
      notices: ["Brown-dwarf spectral class depends on cooling age."],
    });
  }

  const notices = ["Brown-dwarf spectral class depends on cooling age."];
  if (resolvedClass !== parseResult.canonicalLabel) {
    notices.push(`Resolved to nearest engine class ${resolvedClass}.`);
  }

  return successResult({
    parseResult,
    targetTempK,
    resolvedMassMsol: resolved.massMsol,
    resolvedClass,
    model: resolved.model,
    notices,
  });
}

export function solveStellarClassInput(
  input,
  { ageGyr = DEFAULT_AGE_GYR, metallicityFeH = DEFAULT_METALLICITY_FEH } = {},
) {
  const parseResult =
    input && typeof input === "object" && Object.hasOwn(input, "ok")
      ? input
      : parseStellarClassInput(input);
  if (!parseResult.ok) {
    return failureResult({
      parseResult,
      errorCode: parseResult.errorCode || "malformed-input",
      message: parseResult.message || "Could not parse stellar classification.",
    });
  }

  const solverContext = {
    ageGyr: clamp(toFinite(ageGyr, DEFAULT_AGE_GYR), 0, 20),
    metallicityFeH: clamp(toFinite(metallicityFeH, DEFAULT_METALLICITY_FEH), -3, 1),
  };

  if (parseResult.regime === "star") {
    return solveMainSequenceClass(parseResult, solverContext);
  }
  if (parseResult.regime === "brownDwarf") {
    return solveBrownDwarfClass(parseResult, solverContext);
  }
  return failureResult({
    parseResult,
    errorCode: "unsupported-regime",
    message: "Unsupported stellar classification regime.",
  });
}
