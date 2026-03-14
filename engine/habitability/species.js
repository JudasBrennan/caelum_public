// Canonical species normalization for the habitability layer.

const SUBSCRIPT_MAP = {
  "\u2080": "0",
  "\u2081": "1",
  "\u2082": "2",
  "\u2083": "3",
  "\u2084": "4",
  "\u2085": "5",
  "\u2086": "6",
  "\u2087": "7",
  "\u2088": "8",
  "\u2089": "9",
};

const BROKEN_SUBSCRIPT_DIGITS = Object.freeze({
  0: String.fromCodePoint(0x00e2, 0x201a, 0x20ac),
  1: String.fromCodePoint(0x00e2, 0x201a, 0x0081),
  2: String.fromCodePoint(0x00e2, 0x201a, 0x201a),
  3: String.fromCodePoint(0x00e2, 0x201a, 0x0192),
  4: String.fromCodePoint(0x00e2, 0x201a, 0x201e),
  5: String.fromCodePoint(0x00e2, 0x201a, 0x2026),
  6: String.fromCodePoint(0x00e2, 0x201a, 0x2020),
  7: String.fromCodePoint(0x00e2, 0x201a, 0x2021),
  8: String.fromCodePoint(0x00e2, 0x201a, 0x02c6),
  9: String.fromCodePoint(0x00e2, 0x201a, 0x2030),
});

const MOJIBAKE_REPLACEMENTS = Object.entries(BROKEN_SUBSCRIPT_DIGITS).map(([digit, broken]) => [
  broken,
  digit,
]);

const SPECIES_DEFS = {
  n2: {
    label: "N\u2082",
    aliases: ["n2", "N2", "N\u2082"],
    families: ["nitrogen", "heavy", "surface-volatiles"],
  },
  o2: {
    label: "O\u2082",
    aliases: ["o2", "O2", "O\u2082"],
    families: ["oxygen", "heavy", "surface-volatiles"],
  },
  co2: {
    label: "CO\u2082",
    aliases: ["co2", "CO2", "CO\u2082"],
    families: ["carbon", "heavy", "surface-volatiles"],
  },
  ar: {
    label: "Ar",
    aliases: ["ar", "Ar"],
    families: ["noble", "heavy", "surface-volatiles"],
  },
  h2o: {
    label: "H\u2082O",
    aliases: ["h2o", "H2O", "H\u2082O"],
    families: ["water", "hydrogen-carrier", "surface-volatiles"],
  },
  ch4: {
    label: "CH\u2084",
    aliases: ["ch4", "CH4", "CH\u2084"],
    families: ["carbon", "hydrogen-carrier", "alternative-solvent"],
  },
  nh3: {
    label: "NH\u2083",
    aliases: ["nh3", "NH3", "NH\u2083"],
    families: ["nitrogen", "hydrogen-carrier", "alternative-solvent"],
  },
  so2: {
    label: "SO\u2082",
    aliases: ["so2", "SO2", "SO\u2082"],
    families: ["sulfur", "heavy"],
  },
  co: {
    label: "CO",
    aliases: ["co", "CO"],
    families: ["carbon", "alternative-solvent"],
  },
  h2: {
    label: "H\u2082",
    aliases: ["h2", "H2", "H\u2082"],
    families: ["hydrogen-carrier", "light"],
  },
  he: {
    label: "He",
    aliases: ["he", "He"],
    families: ["noble", "light"],
  },
};

const ALIAS_TO_CANONICAL = new Map();

function normalizeAliasText(value) {
  let text = String(value || "").trim();
  for (const [needle, replacement] of Object.entries(SUBSCRIPT_MAP)) {
    text = text.split(needle).join(replacement);
  }
  for (const [needle, replacement] of MOJIBAKE_REPLACEMENTS) {
    text = text.split(needle).join(replacement);
  }
  return text.replace(/\s+/g, "").toLowerCase();
}

for (const [canonical, def] of Object.entries(SPECIES_DEFS)) {
  for (const alias of def.aliases) {
    ALIAS_TO_CANONICAL.set(normalizeAliasText(alias), canonical);
  }
}

export function canonicalHabitabilitySpeciesLabel(key) {
  return SPECIES_DEFS[String(key || "")]?.label || String(key || "");
}

export function normalizeHabitabilitySpecies(input) {
  return ALIAS_TO_CANONICAL.get(normalizeAliasText(input)) || "";
}

export function speciesFamilyFor(key) {
  const canonical = normalizeHabitabilitySpecies(key) || String(key || "");
  const def = SPECIES_DEFS[canonical];
  return def ? [...def.families] : [];
}

export function normalizeHabitabilityInventory(inventory = []) {
  const entries = Array.isArray(inventory) ? inventory : [];
  return entries.map((entry) => {
    const canonicalSpecies = normalizeHabitabilitySpecies(entry?.species);
    return {
      ...(entry && typeof entry === "object" ? entry : {}),
      species: canonicalSpecies || String(entry?.species || ""),
      canonicalSpecies,
      displaySpecies: canonicalSpecies
        ? canonicalHabitabilitySpeciesLabel(canonicalSpecies)
        : String(entry?.species || ""),
    };
  });
}

export function inventoryHasFamily(inventory = [], family) {
  const target = String(family || "")
    .trim()
    .toLowerCase();
  return normalizeHabitabilityInventory(inventory).some((entry) => {
    if (!entry?.present && !entry?.retained && entry?.status !== "Thin atmosphere") return false;
    return speciesFamilyFor(entry.canonicalSpecies).includes(target);
  });
}

export function inventoryRetainedSpeciesMap(inventory = []) {
  const retained = {};
  for (const entry of normalizeHabitabilityInventory(inventory)) {
    if (!entry.canonicalSpecies) continue;
    const status = String(entry?.status || "");
    let normalizedStatus = "Lost";
    if (
      entry?.retained === true ||
      status === "Thin atmosphere" ||
      status === "Stable ice" ||
      status === "Retained"
    ) {
      normalizedStatus = "Retained";
    } else if (status === "Exosphere" || status === "Marginal" || entry?.present === true) {
      normalizedStatus = "Marginal";
    }
    retained[entry.canonicalSpecies] = { status: normalizedStatus };
  }
  return retained;
}
