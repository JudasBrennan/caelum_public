import { isBrownDwarfRegime, massMjupToMsol, normalizeGiantCompanionClass } from "./substellarRegime.js";

const BROWN_DWARF_STYLE_FALLBACKS = Object.freeze({
  "brown-dwarf-l": Object.freeze({ tempK: 1800, colourHex: "#b64a33" }),
  "brown-dwarf-t": Object.freeze({ tempK: 900, colourHex: "#6d2945" }),
  "brown-dwarf-y": Object.freeze({ tempK: 450, colourHex: "#2f1d2b" }),
  alkali: Object.freeze({ tempK: 1800, colourHex: "#b64a33" }),
  silicate: Object.freeze({ tempK: 1800, colourHex: "#b64a33" }),
  cloudless: Object.freeze({ tempK: 900, colourHex: "#6d2945" }),
  helium: Object.freeze({ tempK: 450, colourHex: "#2f1d2b" }),
});

function toPositiveFinite(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function toNonNegativeFinite(value, fallback = null) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

function normalizeHex(hex, fallback = "#6d2945") {
  const raw = String(hex || "")
    .trim()
    .replace(/^#/, "");
  const full = raw.length === 3 ? raw.replace(/(.)/g, "$1$1") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  return `#${full.toLowerCase()}`;
}

function resolveBrownDwarfFallbackStyle(styleId) {
  return BROWN_DWARF_STYLE_FALLBACKS[String(styleId || "").trim().toLowerCase()] || null;
}

export function isBrownDwarfCompanionVisual(input = {}) {
  const rawClass =
    input?.companionClass ??
    input?._companionClass ??
    input?.gasCalc?.companionClass ??
    input?.gasCalc?.inputs?.companionClass ??
    input?.model?.companionClass ??
    input?.model?.inputs?.companionClass ??
    "";
  const normalizedClass = normalizeGiantCompanionClass(rawClass, "");
  if (normalizedClass === "brownDwarf") return true;

  const rawRegime =
    input?.renderModel === "brownDwarfStar"
      ? "brownDwarf"
      : input?.regime ?? input?.gasCalc?.regime ?? input?.model?.regime ?? "";
  return isBrownDwarfRegime(rawRegime);
}

export function buildBrownDwarfStarVisual(input = {}, options = {}) {
  if (!isBrownDwarfCompanionVisual(input)) return null;

  const gasCalc = input?.gasCalc || input?.model || null;
  const styleFallback = resolveBrownDwarfFallbackStyle(input?.style || input?._styleId);
  const fallbackMassMjup = toPositiveFinite(
    input?.massMjup ?? gasCalc?.physical?.massMjup ?? gasCalc?.inputs?.massMjup,
    null,
  );
  const starMassMsol =
    toPositiveFinite(input?.starMassMsol ?? gasCalc?.inputs?.massMsol, null) ??
    (fallbackMassMjup != null ? massMjupToMsol(fallbackMassMjup) : 0.03);
  const starAgeGyr =
    toNonNegativeFinite(options?.ageGyr ?? input?.starAgeGyr ?? input?.ageGyr, null) ?? 4.6;
  const starTempK =
    toPositiveFinite(input?.starTempK ?? gasCalc?.thermal?.effectiveTempK ?? input?.tempK, null) ??
    styleFallback?.tempK ??
    900;
  const starColourHex = normalizeHex(
    input?.starColourHex ?? input?.colourHex ?? gasCalc?.appearance?.colourHex,
    styleFallback?.colourHex || "#6d2945",
  );
  const starName = String(
    options?.name ?? input?.starName ?? input?.name ?? gasCalc?.inputs?.name ?? "Brown Dwarf",
  ).trim() || "Brown Dwarf";

  return {
    regime: "brownDwarf",
    starName,
    starMassMsol,
    starAgeGyr,
    starTempK,
    starColourHex,
    seed: `${starName}:${starMassMsol.toFixed(6)}:${starAgeGyr.toFixed(6)}:${starTempK.toFixed(2)}`,
  };
}
