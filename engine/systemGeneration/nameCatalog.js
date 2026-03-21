function buildCatalog(prefixes = [], suffixes = []) {
  const names = [];
  for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      const name = `${prefix}${suffix}`.replace(/\s+/g, " ").trim();
      if (name && !names.includes(name)) names.push(name);
    }
  }
  return names;
}

const MYTHIC_PREFIXES = Object.freeze([
  "Aether",
  "Astra",
  "Caelo",
  "Cyrene",
  "Delphi",
  "Eidon",
  "Elara",
  "Ephyra",
  "Helio",
  "Ilyra",
  "Isara",
  "Kalyp",
  "Lunara",
  "Lyra",
  "Nere",
  "Nyxa",
  "Oria",
  "Phae",
  "Rhea",
  "Selene",
  "Talos",
  "Thale",
  "Vesta",
  "Zephy",
  "Xanthe",
]);

const MYTHIC_SYSTEM_SUFFIXES = Object.freeze([
  "a",
  "ae",
  "ara",
  "aris",
  "ea",
  "eia",
  "ene",
  "eris",
  "ia",
  "ion",
  "ira",
  "is",
  "ora",
  "oria",
  "os",
  "arae",
  "eth",
  "yne",
  "elle",
  "arax",
]);

const MYTHIC_PLANET_SUFFIXES = Object.freeze([
  "a",
  "ea",
  "elle",
  "ene",
  "eris",
  "et",
  "ia",
  "ion",
  "ira",
  "is",
  "on",
  "ora",
  "oria",
  "os",
  "une",
  "yra",
  "yx",
  "ara",
  "eth",
  "ias",
]);

const MYTHIC_MOON_SUFFIXES = Object.freeze([
  "a",
  "ae",
  "el",
  "elle",
  "en",
  "ene",
  "et",
  "ia",
  "iel",
  "in",
  "ine",
  "is",
  "ite",
  "on",
  "or",
  "une",
  "ys",
  "yx",
  "ara",
  "ith",
]);

const SCIENTIFIC_PREFIXES = Object.freeze([
  "Axi",
  "Bore",
  "Cinder",
  "Dorsa",
  "Eclip",
  "Ferro",
  "Galene",
  "Helix",
  "Ion",
  "Juno",
  "Kepler",
  "Lumen",
  "Merid",
  "Nova",
  "Orbi",
  "Peri",
  "Quanta",
  "Radia",
  "Solis",
  "Tidal",
  "Umbra",
  "Vector",
  "Wave",
  "Xeno",
  "Zenith",
]);

const SCIENTIFIC_SYSTEM_SUFFIXES = Object.freeze([
  "base",
  "crest",
  "delta",
  "field",
  "gate",
  "line",
  "mark",
  "mere",
  "node",
  "point",
  "prime",
  "reach",
  "ridge",
  "rise",
  "sector",
  "span",
  "spire",
  "station",
  "trace",
  "ward",
]);

const SCIENTIFIC_PLANET_SUFFIXES = Object.freeze([
  "a",
  "axis",
  "bar",
  "core",
  "crest",
  "drift",
  "fall",
  "field",
  "gate",
  "line",
  "mark",
  "mere",
  "node",
  "point",
  "prime",
  "reach",
  "rift",
  "ring",
  "scar",
  "ward",
]);

const SCIENTIFIC_MOON_SUFFIXES = Object.freeze([
  "arc",
  "ash",
  "bar",
  "bit",
  "drift",
  "edge",
  "gleam",
  "hook",
  "ion",
  "lamp",
  "link",
  "loop",
  "mark",
  "mite",
  "nod",
  "ring",
  "rim",
  "shard",
  "trace",
  "whorl",
]);

const REGAL_PREFIXES = Object.freeze([
  "Aurel",
  "Belvoir",
  "Caldor",
  "Celestr",
  "Demer",
  "Elynd",
  "Falcor",
  "Gild",
  "Halcy",
  "Isolde",
  "Jasper",
  "Liora",
  "Merovin",
  "Noble",
  "Orlion",
  "Peregr",
  "Quillan",
  "Rosalin",
  "Sable",
  "Tiber",
  "Valcor",
  "Westren",
  "Ysol",
  "Zevran",
  "Corvin",
]);

const REGAL_SYSTEM_SUFFIXES = Object.freeze([
  "crest",
  "court",
  "crown",
  "garde",
  "gate",
  "hall",
  "haven",
  "keep",
  "march",
  "manor",
  "minster",
  "peak",
  "reach",
  "regent",
  "spire",
  "stead",
  "throne",
  "vale",
  "ward",
  "watch",
]);

const REGAL_PLANET_SUFFIXES = Object.freeze([
  "a",
  "ara",
  "elle",
  "en",
  "era",
  "ess",
  "ia",
  "iel",
  "ine",
  "ion",
  "is",
  "ora",
  "oria",
  "os",
  "une",
  "vale",
  "ward",
  "mere",
  "eth",
  "anne",
]);

const REGAL_MOON_SUFFIXES = Object.freeze([
  "bell",
  "crest",
  "dell",
  "el",
  "elle",
  "en",
  "et",
  "gleam",
  "hold",
  "iel",
  "in",
  "is",
  "lace",
  "mere",
  "pearl",
  "quill",
  "ring",
  "veil",
  "ward",
  "wisp",
]);

const FRONTIER_PREFIXES = Object.freeze([
  "Ash",
  "Beacon",
  "Brass",
  "Cairn",
  "Cinder",
  "Cross",
  "Drift",
  "Ember",
  "Flint",
  "Forge",
  "Front",
  "Grit",
  "Harrow",
  "Iron",
  "Kestrel",
  "Lantern",
  "Morrow",
  "Pioneer",
  "Prospect",
  "Ridge",
  "Sable",
  "Tarn",
  "Trail",
  "Venture",
  "West",
]);

const FRONTIER_SYSTEM_SUFFIXES = Object.freeze([
  "basin",
  "bend",
  "camp",
  "crossing",
  "field",
  "fork",
  "gate",
  "landing",
  "line",
  "march",
  "outpost",
  "pass",
  "range",
  "reach",
  "run",
  "span",
  "station",
  "survey",
  "trail",
  "watch",
]);

const FRONTIER_PLANET_SUFFIXES = Object.freeze([
  "bar",
  "bend",
  "drift",
  "edge",
  "fall",
  "field",
  "flat",
  "forge",
  "gate",
  "line",
  "mark",
  "mesa",
  "pass",
  "reach",
  "rest",
  "ridge",
  "scar",
  "step",
  "trace",
  "ward",
]);

const FRONTIER_MOON_SUFFIXES = Object.freeze([
  "ash",
  "bit",
  "blink",
  "chip",
  "ember",
  "glint",
  "hook",
  "knell",
  "lamp",
  "loop",
  "mite",
  "nod",
  "nook",
  "rim",
  "shard",
  "spark",
  "trace",
  "weld",
  "whorl",
  "wink",
]);

const mythicSystemNames = buildCatalog(MYTHIC_PREFIXES, MYTHIC_SYSTEM_SUFFIXES);
const mythicPlanetNames = buildCatalog(MYTHIC_PREFIXES, MYTHIC_PLANET_SUFFIXES);
const mythicMoonNames = buildCatalog(MYTHIC_PREFIXES, MYTHIC_MOON_SUFFIXES);
const scientificSystemNames = buildCatalog(SCIENTIFIC_PREFIXES, SCIENTIFIC_SYSTEM_SUFFIXES);
const scientificPlanetNames = buildCatalog(SCIENTIFIC_PREFIXES, SCIENTIFIC_PLANET_SUFFIXES);
const scientificMoonNames = buildCatalog(SCIENTIFIC_PREFIXES, SCIENTIFIC_MOON_SUFFIXES);
const regalSystemNames = buildCatalog(REGAL_PREFIXES, REGAL_SYSTEM_SUFFIXES);
const regalPlanetNames = buildCatalog(REGAL_PREFIXES, REGAL_PLANET_SUFFIXES);
const regalMoonNames = buildCatalog(REGAL_PREFIXES, REGAL_MOON_SUFFIXES);
const frontierSystemNames = buildCatalog(FRONTIER_PREFIXES, FRONTIER_SYSTEM_SUFFIXES);
const frontierPlanetNames = buildCatalog(FRONTIER_PREFIXES, FRONTIER_PLANET_SUFFIXES);
const frontierMoonNames = buildCatalog(FRONTIER_PREFIXES, FRONTIER_MOON_SUFFIXES);

export const NAME_CATALOG_VERSION = "v2";

export const SYSTEM_STEM_NAME_CATALOGS = Object.freeze({
  mythic: mythicSystemNames,
  scientific: scientificSystemNames,
  regal: regalSystemNames,
  frontier: frontierSystemNames,
  mixed: [
    ...mythicSystemNames,
    ...scientificSystemNames,
    ...regalSystemNames,
    ...frontierSystemNames,
  ],
});

export const PLANET_NAME_CATALOGS = Object.freeze({
  mythic: mythicPlanetNames,
  scientific: scientificPlanetNames,
  regal: regalPlanetNames,
  frontier: frontierPlanetNames,
  mixed: [
    ...mythicPlanetNames,
    ...scientificPlanetNames,
    ...regalPlanetNames,
    ...frontierPlanetNames,
  ],
});

export const MOON_NAME_CATALOGS = Object.freeze({
  mythic: mythicMoonNames,
  scientific: scientificMoonNames,
  regal: regalMoonNames,
  frontier: frontierMoonNames,
  mixed: [...mythicMoonNames, ...scientificMoonNames, ...regalMoonNames, ...frontierMoonNames],
});

export function getNameCatalog(category = "systemStems", style = "mixed") {
  const normalizedStyle =
    style === "mythic" || style === "scientific" || style === "regal" || style === "frontier"
      ? style
      : "mixed";
  switch (String(category || "").trim()) {
    case "planets":
      return PLANET_NAME_CATALOGS[normalizedStyle];
    case "moons":
      return MOON_NAME_CATALOGS[normalizedStyle];
    case "systemStems":
    default:
      return SYSTEM_STEM_NAME_CATALOGS[normalizedStyle];
  }
}
