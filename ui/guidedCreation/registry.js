const REQUIRED_ADAPTER_METHODS = [
  "listArchetypes",
  "buildQuestions",
  "solveRecommendation",
  "applyRecommendation",
];

function normalizeObjectType(objectType) {
  return String(objectType || "").trim();
}

export function validateGuidedAdapter(adapter) {
  const errors = [];
  const candidate = adapter && typeof adapter === "object" ? adapter : null;
  const objectType = normalizeObjectType(candidate?.objectType);

  if (!candidate) {
    errors.push("Adapter must be an object.");
  }
  if (!objectType) {
    errors.push("Adapter must define a non-empty objectType.");
  }
  for (const methodName of REQUIRED_ADAPTER_METHODS) {
    if (typeof candidate?.[methodName] !== "function") {
      errors.push(`Adapter "${objectType || "<unknown>"}" is missing ${methodName}().`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    objectType,
  };
}

export function createGuidedRegistry() {
  const adapters = new Map();

  return {
    register(adapter, { replace = false } = {}) {
      const validation = validateGuidedAdapter(adapter);
      if (!validation.valid) {
        throw new TypeError(validation.errors.join(" "));
      }
      if (adapters.has(validation.objectType) && !replace) {
        throw new Error(`Guided adapter "${validation.objectType}" is already registered.`);
      }
      adapters.set(validation.objectType, adapter);
      return adapter;
    },

    get(objectType) {
      return adapters.get(normalizeObjectType(objectType)) || null;
    },

    list() {
      return [...adapters.values()];
    },

    clear() {
      adapters.clear();
    },
  };
}

const guidedRegistry = createGuidedRegistry();

export function registerGuidedAdapter(adapter, options = {}) {
  return guidedRegistry.register(adapter, options);
}

export function getGuidedAdapter(objectType) {
  return guidedRegistry.get(objectType);
}

export function listGuidedAdapters() {
  return guidedRegistry.list();
}

export function clearGuidedAdapterRegistry() {
  guidedRegistry.clear();
}
