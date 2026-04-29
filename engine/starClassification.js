import { clamp, toFinite } from "./utils.js";

export const MAIN_SEQUENCE_SPECTRAL_BUCKETS = Object.freeze([
  Object.freeze({ family: "M", lo: 2000, hi: 3700, denom: 1700 }),
  Object.freeze({ family: "K", lo: 3700, hi: 5200, denom: 1500 }),
  Object.freeze({ family: "G", lo: 5200, hi: 6000, denom: 800 }),
  Object.freeze({ family: "F", lo: 6000, hi: 7500, denom: 1500 }),
  Object.freeze({ family: "A", lo: 7500, hi: 10000, denom: 2500 }),
  Object.freeze({ family: "B", lo: 10000, hi: 33000, denom: 23000 }),
  Object.freeze({ family: "O", lo: 33000, hi: 95000, denom: 62000 }),
]);

export const BROWN_DWARF_SPECTRAL_FAMILY_BOUNDS = Object.freeze([
  Object.freeze({ family: "L", minTempK: 1300, maxTempK: 2400, stepK: 110 }),
  Object.freeze({ family: "T", minTempK: 700, maxTempK: 1300, stepK: 60 }),
  Object.freeze({ family: "Y", minTempK: 250, maxTempK: 700, stepK: 45 }),
]);

const STELLAR_CLASS_ALIASES = Object.freeze([
  Object.freeze({
    aliasId: "sun-like",
    phrases: Object.freeze(["sun like", "sunlike", "sun like star", "sunlike star", "solar twin"]),
    regime: "star",
    family: "G",
    subtype: 2,
    canonicalLabel: "G2V",
  }),
  Object.freeze({
    aliasId: "red-dwarf",
    phrases: Object.freeze(["red dwarf", "m dwarf", "m star"]),
    regime: "star",
    family: "M",
    subtype: null,
    canonicalLabel: "M dwarf",
  }),
  Object.freeze({
    aliasId: "orange-dwarf",
    phrases: Object.freeze(["orange dwarf", "k dwarf", "k star"]),
    regime: "star",
    family: "K",
    subtype: null,
    canonicalLabel: "K dwarf",
  }),
  Object.freeze({
    aliasId: "g-dwarf",
    phrases: Object.freeze(["g dwarf", "g star"]),
    regime: "star",
    family: "G",
    subtype: null,
    canonicalLabel: "G dwarf",
  }),
  Object.freeze({
    aliasId: "f-star",
    phrases: Object.freeze(["f dwarf", "f star"]),
    regime: "star",
    family: "F",
    subtype: null,
    canonicalLabel: "F dwarf",
  }),
  Object.freeze({
    aliasId: "a-star",
    phrases: Object.freeze(["a dwarf", "a star"]),
    regime: "star",
    family: "A",
    subtype: null,
    canonicalLabel: "A dwarf",
  }),
  Object.freeze({
    aliasId: "b-star",
    phrases: Object.freeze(["b dwarf", "b star"]),
    regime: "star",
    family: "B",
    subtype: null,
    canonicalLabel: "B dwarf",
  }),
  Object.freeze({
    aliasId: "o-star",
    phrases: Object.freeze(["o dwarf", "o star"]),
    regime: "star",
    family: "O",
    subtype: null,
    canonicalLabel: "O dwarf",
  }),
  Object.freeze({
    aliasId: "l-dwarf",
    phrases: Object.freeze(["l dwarf"]),
    regime: "brownDwarf",
    family: "L",
    subtype: null,
    canonicalLabel: "L dwarf",
  }),
  Object.freeze({
    aliasId: "t-dwarf",
    phrases: Object.freeze(["t dwarf"]),
    regime: "brownDwarf",
    family: "T",
    subtype: null,
    canonicalLabel: "T dwarf",
  }),
  Object.freeze({
    aliasId: "y-dwarf",
    phrases: Object.freeze(["y dwarf"]),
    regime: "brownDwarf",
    family: "Y",
    subtype: null,
    canonicalLabel: "Y dwarf",
  }),
]);

function formatSubtype(subtype) {
  if (!Number.isFinite(subtype)) return "";
  return Number.isInteger(subtype) ? String(subtype) : String(subtype).replace(/\.?0+$/, "");
}

function normalizeDirectClassInput(value = "") {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeStellarClassInput(value = "") {
  return normalizeDirectClassInput(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function failureResult(rawInput, normalizedInput, errorCode, message) {
  return {
    ok: false,
    rawInput,
    normalizedInput,
    sourceKind: null,
    regime: null,
    family: null,
    subtype: null,
    luminosityClass: null,
    canonicalLabel: "",
    aliasId: null,
    errorCode,
    message,
  };
}

function successResult({
  rawInput,
  normalizedInput,
  sourceKind,
  regime,
  family,
  subtype = null,
  luminosityClass = null,
  canonicalLabel,
  aliasId = null,
}) {
  return {
    ok: true,
    rawInput,
    normalizedInput,
    sourceKind,
    regime,
    family,
    subtype,
    luminosityClass,
    canonicalLabel,
    aliasId,
    errorCode: null,
    message: "",
  };
}

function buildCanonicalLabel({ regime, family, subtype = null, luminosityClass = null }) {
  if (!family) return "";
  if (regime === "brownDwarf") {
    if (Number.isFinite(subtype)) return `${family}${formatSubtype(subtype)} BD`;
    return `${family} dwarf`;
  }
  if (Number.isFinite(subtype)) return `${family}${formatSubtype(subtype)}V`;
  if (luminosityClass === "V") return `${family}V`;
  return `${family} dwarf`;
}

function isValidSpectralSubtype(subtype) {
  if (subtype == null) return true;
  if (!Number.isFinite(subtype) || subtype < 0 || subtype > 9.9) return false;
  return Math.abs(subtype * 10 - Math.round(subtype * 10)) < 1e-9;
}

export function parseStellarClassInput(value = "") {
  const rawInput = normalizeDirectClassInput(value);
  const normalizedInput = normalizeStellarClassInput(value);
  if (!normalizedInput) {
    return failureResult(
      rawInput,
      normalizedInput,
      "empty",
      "No stellar classification was provided.",
    );
  }

  const compactUpper = rawInput.toUpperCase().replace(/\s+/g, "");

  const mainSequenceMatch = compactUpper.match(/^([OBAFGKM])([0-9]+(?:\.[0-9]+)?)?(V)?$/);
  if (mainSequenceMatch) {
    const family = mainSequenceMatch[1];
    const subtype = mainSequenceMatch[2] == null ? null : Number(mainSequenceMatch[2]);
    if (!isValidSpectralSubtype(subtype)) {
      return failureResult(
        rawInput,
        normalizedInput,
        "unsupported-subtype",
        "Stellar subtype must be between 0 and 9.9.",
      );
    }
    return successResult({
      rawInput,
      normalizedInput,
      sourceKind: "direct",
      regime: "star",
      family,
      subtype,
      luminosityClass: "V",
      canonicalLabel: buildCanonicalLabel({
        regime: "star",
        family,
        subtype,
        luminosityClass: mainSequenceMatch[3] ? "V" : null,
      }),
    });
  }

  const brownDwarfMatch = compactUpper.match(/^([LTY])([0-9]+(?:\.[0-9]+)?)?(BD)?$/);
  if (brownDwarfMatch) {
    const family = brownDwarfMatch[1];
    const subtype = brownDwarfMatch[2] == null ? null : Number(brownDwarfMatch[2]);
    if (!isValidSpectralSubtype(subtype)) {
      return failureResult(
        rawInput,
        normalizedInput,
        "unsupported-subtype",
        "Brown-dwarf subtype must be between 0 and 9.9.",
      );
    }
    return successResult({
      rawInput,
      normalizedInput,
      sourceKind: "direct",
      regime: "brownDwarf",
      family,
      subtype,
      luminosityClass: "BD",
      canonicalLabel: buildCanonicalLabel({
        regime: "brownDwarf",
        family,
        subtype,
        luminosityClass: brownDwarfMatch[3] ? "BD" : null,
      }),
    });
  }

  const alias = STELLAR_CLASS_ALIASES.find((entry) => entry.phrases.includes(normalizedInput));
  if (alias) {
    return successResult({
      rawInput,
      normalizedInput,
      sourceKind: "alias",
      regime: alias.regime,
      family: alias.family,
      subtype: alias.subtype,
      luminosityClass: alias.regime === "brownDwarf" ? "BD" : "V",
      canonicalLabel: alias.canonicalLabel,
      aliasId: alias.aliasId,
    });
  }

  return failureResult(
    rawInput,
    normalizedInput,
    "unsupported",
    "Unsupported stellar classification format.",
  );
}

export function classifyMainSequenceSpectralClassFromTempK(tempK) {
  const t = Number(tempK);
  if (!Number.isFinite(t)) return "NA";

  const bucket = MAIN_SEQUENCE_SPECTRAL_BUCKETS.find((entry) => t >= entry.lo && t < entry.hi);
  if (!bucket) return "NA";

  const rawSubtype = (1 - (t - bucket.lo) / bucket.denom) * 10;
  const subtype = Math.floor(rawSubtype * 10) / 10;
  return `${bucket.family}${formatSubtype(subtype)}V`;
}

export function classifyBrownDwarfSpectralFamily(tempK) {
  const t = clamp(toFinite(tempK, 1000), 250, 3200);
  if (t >= 1300) {
    const subtype = clamp(Math.floor((2400 - Math.min(t, 2400)) / 110), 0, 9);
    return { family: "L", subtype };
  }
  if (t >= 700) {
    const subtype = clamp(Math.floor((1300 - t) / 60), 0, 9);
    return { family: "T", subtype };
  }
  const subtype = clamp(Math.floor((700 - t) / 45), 0, 9);
  return { family: "Y", subtype };
}
