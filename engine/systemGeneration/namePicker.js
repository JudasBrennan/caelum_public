import { getNameCatalog, NAME_CATALOG_VERSION } from "./nameCatalog.js";
import { createSeededRng } from "./seededRng.js";

function fallbackName(prefix = "Name", index = 1) {
  return `${prefix} ${Math.max(1, Number(index) || 1)}`;
}

export function createNamePicker({ seed = "104729", namingStyle = "mixed" } = {}) {
  const rng = createSeededRng(`${seed}:${namingStyle}:name-picker`);
  const pools = {
    systemStems: rng.shuffle(getNameCatalog("systemStems", namingStyle)),
    planets: rng.shuffle(getNameCatalog("planets", namingStyle)),
    moons: rng.shuffle(getNameCatalog("moons", namingStyle)),
  };
  const used = new Set();
  const counters = { systemStems: 0, planets: 0, moons: 0 };

  function nextName(category, prefix) {
    const pool = pools[category] || [];
    while (counters[category] < pool.length) {
      const name = pool[counters[category]];
      counters[category] += 1;
      if (!name || used.has(name)) continue;
      used.add(name);
      return name;
    }
    let fallbackIndex = counters[category] + 1;
    while (used.has(fallbackName(prefix, fallbackIndex))) fallbackIndex += 1;
    const name = fallbackName(prefix, fallbackIndex);
    counters[category] = fallbackIndex;
    used.add(name);
    return name;
  }

  return {
    catalogVersion: NAME_CATALOG_VERSION,
    namingStyle,
    pickSystemStem() {
      return nextName("systemStems", "System");
    },
    pickPlanetName() {
      return nextName("planets", "Planet");
    },
    pickMoonName() {
      return nextName("moons", "Moon");
    },
    reserve(name) {
      const normalized = String(name || "").trim();
      if (!normalized || used.has(normalized)) return false;
      used.add(normalized);
      return true;
    },
    buildStarNames(starCount = 1) {
      const stem = nextName("systemStems", "System");
      if ((Number(starCount) || 1) <= 1) return { systemStem: stem, starNames: [stem] };
      const suffixes = ["A", "B", "C", "D"];
      const starNames = [];
      for (let index = 0; index < Math.max(1, Number(starCount) || 1); index += 1) {
        const name = `${stem} ${suffixes[index] || index + 1}`;
        used.add(name);
        starNames.push(name);
      }
      return { systemStem: stem, starNames };
    },
  };
}
