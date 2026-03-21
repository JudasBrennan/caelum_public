function normalizeSeedSource(seed) {
  const text = String(seed ?? "")
    .trim()
    .toLowerCase();
  return text || "worldsmith-system-generation";
}

export function hashSeed(seed) {
  const source = normalizeSeedSource(seed);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0;
}

export function createSeededRng(seed) {
  let state = hashSeed(seed) || 0x12345678;
  const seedText = normalizeSeedSource(seed);

  function nextUint32() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  function next() {
    return nextUint32() / 4294967296;
  }

  return {
    seed: seedText,
    next,
    nextUint32,
    range(min = 0, max = 1) {
      const lo = Number(min);
      const hi = Number(max);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) return lo;
      if (hi <= lo) return lo;
      return lo + (hi - lo) * next();
    },
    int(min = 0, max = 0) {
      const lo = Math.ceil(Number(min) || 0);
      const hi = Math.floor(Number(max) || 0);
      if (hi <= lo) return lo;
      return lo + Math.floor(next() * (hi - lo + 1));
    },
    bool(probability = 0.5) {
      return next() < Math.max(0, Math.min(1, Number(probability) || 0));
    },
    pick(list = [], fallback = null) {
      if (!Array.isArray(list) || !list.length) return fallback;
      return list[this.int(0, list.length - 1)];
    },
    pickWeighted(weightedItems = [], fallback = null) {
      if (!Array.isArray(weightedItems) || !weightedItems.length) return fallback;
      const normalized = weightedItems
        .map((entry) => ({
          value: entry?.value,
          weight: Math.max(0, Number(entry?.weight) || 0),
        }))
        .filter((entry) => entry.weight > 0);
      if (!normalized.length) return fallback;
      const totalWeight = normalized.reduce((sum, entry) => sum + entry.weight, 0);
      let cursor = next() * totalWeight;
      for (const entry of normalized) {
        cursor -= entry.weight;
        if (cursor <= 0) return entry.value;
      }
      return normalized[normalized.length - 1].value;
    },
    shuffle(list = []) {
      const nextList = Array.isArray(list) ? [...list] : [];
      for (let index = nextList.length - 1; index > 0; index -= 1) {
        const swapIndex = this.int(0, index);
        [nextList[index], nextList[swapIndex]] = [nextList[swapIndex], nextList[index]];
      }
      return nextList;
    },
    fork(label = "fork") {
      return createSeededRng(`${seedText}:${String(label || "").trim()}:${nextUint32()}`);
    },
  };
}
