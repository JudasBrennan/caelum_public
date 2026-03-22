const MJUP_PER_MSOL = 1047.35;

export const GAS_GIANT_MAX_MJUP = 13;
export const BROWN_DWARF_MIN_MJUP = GAS_GIANT_MAX_MJUP;
export const BROWN_DWARF_MAX_MJUP = 75;
export const STAR_MIN_MJUP = BROWN_DWARF_MAX_MJUP;

export const GAS_GIANT_MAX_MSOL = GAS_GIANT_MAX_MJUP / MJUP_PER_MSOL;
export const BROWN_DWARF_MIN_MSOL = BROWN_DWARF_MIN_MJUP / MJUP_PER_MSOL;
export const BROWN_DWARF_MAX_MSOL = BROWN_DWARF_MAX_MJUP / MJUP_PER_MSOL;
export const STAR_MIN_MSOL = STAR_MIN_MJUP / MJUP_PER_MSOL;

export function massMjupToMsol(massMjup) {
  const mass = Number(massMjup);
  return Number.isFinite(mass) ? mass / MJUP_PER_MSOL : 0;
}

export function massMsolToMjup(massMsol) {
  const mass = Number(massMsol);
  return Number.isFinite(mass) ? mass * MJUP_PER_MSOL : 0;
}

export function classifyCompanionRegimeByMass({ massMjup, massMsol } = {}) {
  const mjup = Number.isFinite(Number(massMjup)) ? Number(massMjup) : massMsolToMjup(massMsol);
  if (!(mjup > 0)) return "gasGiant";
  if (mjup < BROWN_DWARF_MIN_MJUP) return "gasGiant";
  if (mjup < STAR_MIN_MJUP) return "brownDwarf";
  return "star";
}

export function classifyHostRegimeByMass({ massMsol, massMjup } = {}) {
  return classifyCompanionRegimeByMass({ massMsol, massMjup });
}

export function isBrownDwarfRegime(value) {
  return String(value || "") === "brownDwarf";
}

export function getInsolationZoneKindForRegime(regime) {
  return isBrownDwarfRegime(regime) ? "currentTemperateZone" : "habitableZone";
}

export function getInsolationZoneLabelForRegime(regime) {
  return isBrownDwarfRegime(regime) ? "Current Temperate Zone" : "Habitable Zone";
}

export function normalizeGiantCompanionClass(value, fallback = "gasGiant") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "browndwarf" || normalized === "brown-dwarf" || normalized === "brown_dwarf") {
    return "brownDwarf";
  }
  if (normalized === "gasgiant" || normalized === "gas-giant" || normalized === "gas_giant") {
    return "gasGiant";
  }
  return fallback === "brownDwarf" ? "brownDwarf" : "gasGiant";
}

export function regimeDisplayLabel(regime) {
  if (isBrownDwarfRegime(regime)) return "Brown Dwarf";
  if (String(regime || "") === "gasGiant") return "Gas Giant";
  return "Star";
}
