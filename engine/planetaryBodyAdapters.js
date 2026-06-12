function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getLegacySource(body) {
  return isObject(body?.legacy?.source) ? body.legacy.source : {};
}

function getLegacyInputSource(body) {
  const source = getLegacySource(body);
  return isObject(source.inputs) ? source.inputs : {};
}

export function getRockySourceForSolve(body) {
  return getLegacyInputSource(body);
}

export function getVolatileSourceForSolve(body) {
  return getLegacyInputSource(body);
}

export function getGasGiantSourceForSolve(body) {
  return getLegacySource(body);
}

export function getClassificationSourceForSolve(body) {
  const source = getLegacySource(body);
  return {
    source,
    inputs: isObject(source.inputs) ? source.inputs : {},
  };
}
