import { listGoalTemplates, listGoalTraits } from "./goalTraits.js";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupePhrases(phrases = []) {
  const seen = new Set();
  const next = [];
  for (const phrase of Array.isArray(phrases) ? phrases : []) {
    const normalized = normalizeText(phrase);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
  }
  return next;
}

function labelSuffixVariant(label = "", suffixes = []) {
  const normalized = normalizeText(label);
  for (const suffix of suffixes) {
    const normalizedSuffix = normalizeText(suffix);
    if (!normalizedSuffix) continue;
    if (normalized === normalizedSuffix) continue;
    if (normalized.endsWith(` ${normalizedSuffix}`)) {
      const stripped = normalized.slice(0, -(` ${normalizedSuffix}`).length).trim();
      if (stripped.split(" ").length >= 2) return stripped;
    }
  }
  return "";
}

function aliasEntry(kind, objectType, value, config = {}) {
  return {
    kind,
    objectType: String(objectType || "").trim(),
    value: String(value || "").trim(),
    role: String(config.role || "").trim(),
    label: String(config.label || config.valueLabel || value || "").trim(),
    phrases: dedupePhrases(config.phrases || []),
    draftPatch:
      config.draftPatch && typeof config.draftPatch === "object" && !Array.isArray(config.draftPatch)
        ? { ...config.draftPatch }
        : {},
  };
}

const OBJECT_SUFFIXES = Object.freeze({
  moon: ["moon"],
  rockyPlanet: ["world", "planet", "rocky world", "rocky planet"],
  gasGiant: ["gas giant", "giant"],
  star: ["star"],
});

const GENERIC_ALIASES = Object.freeze([
  aliasEntry("priority", "", "preserve-current-system", {
    label: "Preserve current system",
    phrases: [
      "keep current system",
      "preserve current system",
      "keep the current system",
      "stay in the current system",
    ],
  }),
  aliasEntry("priority", "", "preserve-current-orbit-context", {
    label: "Preserve current orbit",
    phrases: [
      "keep current orbit",
      "preserve current orbit",
      "keep the current orbit",
      "stay at the current orbit",
      "preserve current phase",
      "keep current phase",
    ],
  }),
  aliasEntry("priority", "", "maximize-habitability", {
    label: "Maximize habitability",
    phrases: [
      "maximize habitability",
      "most habitable",
      "make it habitable",
      "life friendly",
      "life-friendly",
    ],
  }),
  aliasEntry("priority", "", "maximize-realism", {
    label: "Maximize realism",
    phrases: [
      "maximize realism",
      "most realistic",
      "scientifically realistic",
      "scientifically defensible",
    ],
  }),
  aliasEntry("allowedEdits", "", "edit-object-only", {
    label: "Object only",
    phrases: [
      "object only",
      "only edit this object",
      "edit this object only",
      "only edit this",
      "just this object",
    ],
  }),
  aliasEntry("allowedEdits", "", "edit-object-plus-host", {
    label: "Object plus host",
    phrases: [
      "edit host too",
      "change host too",
      "allow host edits",
      "allow host changes",
      "edit object plus host",
    ],
  }),
  aliasEntry("allowedEdits", "", "edit-object-plus-local-system", {
    label: "Object plus local system",
    phrases: [
      "edit local system",
      "change local system",
      "allow local system edits",
      "allow local system changes",
      "edit moon system too",
    ],
  }),
  aliasEntry("searchBudget", "", "fast", {
    label: "Fast search",
    phrases: ["fast search", "quick search", "fast", "quick"],
  }),
  aliasEntry("searchBudget", "", "balanced", {
    label: "Balanced search",
    phrases: ["balanced search", "balanced"],
  }),
  aliasEntry("searchBudget", "", "deep", {
    label: "Deep search",
    phrases: ["deep search", "thorough search", "deep", "thorough"],
  }),
]);

const CUSTOM_ALIASES = Object.freeze({
  moon: [
    aliasEntry("template", "moon", "temperate-ocean-moon", {
      label: "Temperate ocean moon",
      phrases: [
        "temperate ocean moon",
        "ocean moon",
        "habitable moon",
        "earthlike moon",
        "earth like moon",
      ],
    }),
    aliasEntry("template", "moon", "temperate-ocean-moon", {
      label: "Forest moon",
      phrases: ["forest moon", "verdant moon", "lush moon", "green moon"],
      draftPatch: {
        traitRoles: {
          "surface-biosphere-plausible": "preferred",
          "vegetation-plausible": "preferred",
        },
      },
    }),
    aliasEntry("template", "moon", "subsurface-ocean-moon", {
      label: "Subsurface-ocean moon",
      phrases: [
        "subsurface ocean moon",
        "europa like moon",
        "europa-like moon",
        "enceladus like moon",
        "enceladus-like moon",
      ],
    }),
    aliasEntry("template", "moon", "volcanic-moon", {
      label: "Volcanic moon",
      phrases: ["volcanic moon", "io like moon", "io-like moon"],
    }),
    aliasEntry("template", "moon", "titan-like-moon", {
      label: "Titan-like moon",
      phrases: ["titan like moon", "titan-like moon", "hazy moon"],
    }),
    aliasEntry("trait", "moon", "surface-biosphere-plausible", {
      label: "Biologically active",
      role: "preferred",
      phrases: ["biologically active", "living moon", "life bearing moon", "biosphere"],
    }),
    aliasEntry("trait", "moon", "vegetation-plausible", {
      label: "Vegetation plausible",
      role: "preferred",
      phrases: ["forest", "verdant", "lush", "green", "vegetation"],
    }),
  ],
  rockyPlanet: [
    aliasEntry("template", "rockyPlanet", "habitable-rocky-world", {
      label: "Habitable rocky world",
      phrases: [
        "habitable planet",
        "habitable rocky world",
        "earthlike planet",
        "earth like planet",
        "earthlike world",
        "earth like world",
      ],
    }),
    aliasEntry("template", "rockyPlanet", "ocean-world", {
      label: "Ocean world",
      phrases: ["ocean world", "water world", "ocean planet"],
    }),
    aliasEntry("template", "rockyPlanet", "desert-world", {
      label: "Desert world",
      phrases: ["desert world", "desert planet", "arid world", "dry planet"],
    }),
    aliasEntry("template", "rockyPlanet", "venus-like-world", {
      label: "Venus-like world",
      phrases: ["venus like world", "venus-like world", "greenhouse planet"],
    }),
    aliasEntry("template", "rockyPlanet", "mars-like-world", {
      label: "Mars-like world",
      phrases: ["mars like world", "mars-like world", "marslike world"],
    }),
  ],
  gasGiant: [
    aliasEntry("template", "gasGiant", "ringed-gas-giant", {
      label: "Ringed gas giant",
      phrases: ["ringed gas giant", "saturn like", "saturn-like", "ringed giant"],
    }),
    aliasEntry("template", "gasGiant", "hot-jupiter", {
      label: "Hot Jupiter",
      phrases: ["hot jupiter", "close in giant", "close-in giant"],
    }),
    aliasEntry("template", "gasGiant", "warm-cloud-giant", {
      label: "Warm cloud giant",
      phrases: ["warm cloud giant", "warm giant", "cloud giant"],
    }),
    aliasEntry("template", "gasGiant", "ice-giant", {
      label: "Ice giant",
      phrases: ["ice giant", "neptune like", "neptune-like", "sub neptune", "sub-neptune"],
    }),
    aliasEntry("trait", "gasGiant", "rings-visible", {
      label: "Rings visible",
      role: "required",
      phrases: ["with rings", "ringed", "show rings", "visible rings"],
    }),
    aliasEntry("trait", "gasGiant", "rings-visible", {
      label: "Avoid rings visible",
      role: "avoid",
      phrases: ["no rings", "ringless", "without rings", "hide rings"],
    }),
  ],
  star: [
    aliasEntry("template", "star", "quiet-habitable-star", {
      label: "Quiet habitable star",
      phrases: ["quiet habitable star", "quiet star for life", "calm habitable star"],
    }),
    aliasEntry("template", "star", "sun-like-star", {
      label: "Sun-like star",
      phrases: ["sun like star", "sun-like star", "solar twin", "sunlike star"],
    }),
    aliasEntry("template", "star", "long-lived-orange-dwarf", {
      label: "Long-lived orange dwarf",
      phrases: [
        "long lived orange dwarf",
        "long-lived orange dwarf",
        "orange dwarf",
        "k dwarf",
        "quiet orange dwarf",
      ],
    }),
    aliasEntry("template", "star", "bright-short-lived-star", {
      label: "Bright short-lived star",
      phrases: ["bright short lived star", "bright-short-lived star", "bright star"],
    }),
  ],
});

function buildTemplateAliases(objectType = "") {
  const suffixes = OBJECT_SUFFIXES[objectType] || [];
  return listGoalTemplates(objectType).map((template) => {
    const phrases = [template.label];
    const stripped = labelSuffixVariant(template.label, suffixes);
    if (stripped) phrases.push(stripped);
    return aliasEntry("template", objectType, template.id, {
      label: template.label,
      phrases,
    });
  });
}

function buildTraitAliases(objectType = "") {
  return listGoalTraits({ objectType }).map((trait) =>
    aliasEntry("trait", objectType, trait.id, {
      label: trait.label,
      role: trait.allowedRoles.includes("preferred") ? "preferred" : trait.allowedRoles[0] || "",
      phrases: [trait.label],
    }),
  );
}

function aliasKey(entry = {}) {
  return [
    entry.kind,
    entry.objectType,
    entry.value,
    entry.role,
    entry.label,
    ...(entry.phrases || []),
    JSON.stringify(entry.draftPatch || {}),
  ].join("|");
}

export function listGoalTextAliases(objectType = "") {
  const normalizedObjectType = String(objectType || "").trim();
  const entries = [
    ...GENERIC_ALIASES,
    ...buildTemplateAliases(normalizedObjectType),
    ...buildTraitAliases(normalizedObjectType),
    ...((CUSTOM_ALIASES[normalizedObjectType] || []).map((entry) => ({ ...entry }))),
  ];
  const seen = new Set();
  const deduped = [];
  for (const entry of entries) {
    const key = aliasKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
}

export function getGoalTextAliasHelp(objectType = "") {
  const normalizedObjectType = String(objectType || "").trim();
  switch (normalizedObjectType) {
    case "moon":
      return {
        placeholder: "Example: forest moon, ocean moon, or europa-like moon",
        examples: ["forest moon", "temperate ocean moon", "europa-like moon"],
      };
    case "rockyPlanet":
      return {
        placeholder: "Example: habitable planet, ocean world, or venus-like world",
        examples: ["habitable planet", "ocean world", "desert planet"],
      };
    case "gasGiant":
      return {
        placeholder: "Example: ringed gas giant, hot jupiter, or ice giant",
        examples: ["ringed gas giant", "hot jupiter", "ice giant"],
      };
    case "star":
      return {
        placeholder: "Example: sun-like star, quiet habitable star, or orange dwarf",
        examples: ["sun-like star", "quiet habitable star", "orange dwarf"],
      };
    default:
      return {
        placeholder: "Describe the outcome you want",
        examples: [],
      };
  }
}

export { normalizeText as normalizeGoalAliasText };
