const TOOLTIP_BLOCKS = [
  ["Overview", "overview"],
  ["Feeds into", "feedsInto"],
  ["Drawn from", "drawnFrom"],
  ["Changes", "changes"],
  ["Interpret as", "interpretAs"],
  ["Typical range", "typicalRange"],
  ["Caveat", "caveat"],
  ["References", "references"],
];

export function structuredTip(blocks = {}) {
  return TOOLTIP_BLOCKS.map(([label, key]) => [label, blocks[key]])
    .filter(([, value]) => hasTooltipValue(value))
    .map(([label, value]) => `${label}: ${normalizeTooltipValue(value)}`)
    .join("\n\n");
}

function hasTooltipValue(value) {
  if (Array.isArray(value)) return value.some(hasTooltipValue);
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function normalizeTooltipValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeTooltipValue).filter(Boolean).join("; ");
  }
  return String(value).trim().replace(/\s+/g, " ");
}
