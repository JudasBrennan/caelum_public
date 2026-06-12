export const RESERVED_IMPORT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

import { validateStellarSystemDefinition } from "./stellarSystemModel.js";

function isPlainObjectLike(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function optionalNumberIsValid(value) {
  if (value == null || value === "") return true;
  if (typeof value !== "number" && typeof value !== "string") return false;
  return Number.isFinite(Number(value));
}

function optionalScalarIsValid(value) {
  if (value == null || value === "") return true;
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string";
}

function optionalFlagIsValid(value) {
  if (value == null || value === "") return true;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string") return false;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  return ["true", "yes", "y", "1", "on", "false", "no", "n", "0", "off"].includes(normalized);
}

function validateOptionalObjectSection(body, bodyPath, sectionName, errors) {
  const section = body?.[sectionName];
  if (section == null) return null;
  if (!isPlainObjectLike(section)) {
    errors.push(`'${bodyPath}.${sectionName}' must be an object when provided.`);
    return null;
  }
  return section;
}

function validateOptionalField(section, sectionPath, fieldName, isValid, errors, expected) {
  if (!section || !Object.prototype.hasOwnProperty.call(section, fieldName)) return;
  if (!isValid(section[fieldName])) {
    errors.push(`'${sectionPath}.${fieldName}' must be ${expected}.`);
  }
}

function validatePlanetaryBodySubtypeEvidence(world, errors) {
  const byId = world?.planetaryBodies?.byId;
  if (!isPlainObjectLike(byId)) return;

  for (const [id, body] of Object.entries(byId)) {
    const bodyPath = `planetaryBodies.byId.${id}`;
    if (!isPlainObjectLike(body)) continue;

    const composition = validateOptionalObjectSection(body, bodyPath, "composition", errors);
    validateOptionalField(
      composition,
      `${bodyPath}.composition`,
      "carbonRichness",
      optionalScalarIsValid,
      errors,
      "a string, finite number, null, or empty string",
    );
    validateOptionalField(
      composition,
      `${bodyPath}.composition`,
      "bulkDensityGcm3",
      optionalNumberIsValid,
      errors,
      "a finite number, null, or empty string",
    );

    const thermal = validateOptionalObjectSection(body, bodyPath, "thermal", errors);
    for (const fieldName of ["internalHeatFluxWm2", "tidalHeatFluxWm2"]) {
      validateOptionalField(
        thermal,
        `${bodyPath}.thermal`,
        fieldName,
        optionalNumberIsValid,
        errors,
        "a finite number, null, or empty string",
      );
    }

    const history = validateOptionalObjectSection(body, bodyPath, "history", errors);
    for (const fieldName of ["strippedEnvelopeCandidate", "migratedCloseIn", "rogueCandidate"]) {
      validateOptionalField(
        history,
        `${bodyPath}.history`,
        fieldName,
        optionalFlagIsValid,
        errors,
        "a boolean-like value, null, or empty string",
      );
    }
  }
}

export function sanitizeImportedValue(value, errors = null, path = "") {
  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeImportedValue(item, errors, `${path}[${index}]`));
  }

  if (!isPlainObjectLike(value)) {
    return value;
  }

  const out = {};
  for (const [key, rawChild] of Object.entries(value)) {
    if (RESERVED_IMPORT_KEYS.has(key)) {
      if (Array.isArray(errors)) {
        const location = path || "root";
        errors.push(`Import JSON contains reserved key "${key}" at ${location}.`);
      }
      continue;
    }
    const childPath = path ? `${path}.${key}` : key;
    out[key] = sanitizeImportedValue(rawChild, errors, childPath);
  }
  return out;
}

export function stripLegacyKeys(world) {
  if (!world || typeof world !== "object") return world;
  const stripped = JSON.parse(JSON.stringify(world));
  delete stripped.planet;
  delete stripped.moon;
  delete stripped.planetsSingle;
  delete stripped.moonsSingle;
  const hasCanonicalPlanetaryBodies =
    stripped.planetaryBodies &&
    typeof stripped.planetaryBodies === "object" &&
    !Array.isArray(stripped.planetaryBodies);
  if (hasCanonicalPlanetaryBodies) {
    delete stripped.planets;
    if (stripped.system && typeof stripped.system === "object" && !Array.isArray(stripped.system)) {
      delete stripped.system.gasGiants;
    }
  }
  return stripped;
}

export function validateEnvelope(obj) {
  const errors = [];
  if (!obj || typeof obj !== "object") {
    return { ok: false, errors: ["Import data is not an object."] };
  }

  const sanitized = sanitizeImportedValue(obj, errors);
  const isEnvelope = !!(
    sanitized.world &&
    typeof sanitized.world === "object" &&
    !Array.isArray(sanitized.world)
  );
  const world = isEnvelope ? sanitized.world : sanitized;

  if (!world || typeof world !== "object" || Array.isArray(world)) {
    errors.push("Missing import world object.");
  }
  const normalizedWorld = world || {};

  const hasKnownWorldSection =
    (normalizedWorld.star && typeof normalizedWorld.star === "object") ||
    (normalizedWorld.stellarSystem && typeof normalizedWorld.stellarSystem === "object") ||
    (normalizedWorld.system && typeof normalizedWorld.system === "object") ||
    (normalizedWorld.planetaryBodies && typeof normalizedWorld.planetaryBodies === "object") ||
    (normalizedWorld.planets && typeof normalizedWorld.planets === "object") ||
    (normalizedWorld.planet && typeof normalizedWorld.planet === "object") ||
    (normalizedWorld.moons && typeof normalizedWorld.moons === "object") ||
    (normalizedWorld.moon && typeof normalizedWorld.moon === "object") ||
    Number.isFinite(Number(normalizedWorld.version));
  if (!hasKnownWorldSection) {
    errors.push("Import JSON is not a recognised WorldSmith world format.");
  }

  if (
    normalizedWorld.star != null &&
    (typeof normalizedWorld.star !== "object" || Array.isArray(normalizedWorld.star))
  ) {
    errors.push("'star' must be an object.");
  }
  if (
    normalizedWorld.stellarSystem != null &&
    (typeof normalizedWorld.stellarSystem !== "object" ||
      Array.isArray(normalizedWorld.stellarSystem))
  ) {
    errors.push("'stellarSystem' must be an object.");
  }
  if (
    normalizedWorld.system != null &&
    (typeof normalizedWorld.system !== "object" || Array.isArray(normalizedWorld.system))
  ) {
    errors.push("'system' must be an object.");
  }
  if (
    normalizedWorld.planetaryBodies != null &&
    (typeof normalizedWorld.planetaryBodies !== "object" ||
      Array.isArray(normalizedWorld.planetaryBodies))
  ) {
    errors.push("'planetaryBodies' must be an object.");
  }
  if (
    normalizedWorld.planets != null &&
    (typeof normalizedWorld.planets !== "object" || Array.isArray(normalizedWorld.planets))
  ) {
    errors.push("'planets' must be an object.");
  }
  if (
    normalizedWorld.planet != null &&
    (typeof normalizedWorld.planet !== "object" || Array.isArray(normalizedWorld.planet))
  ) {
    errors.push("'planet' must be an object.");
  }
  if (
    normalizedWorld.moons != null &&
    (typeof normalizedWorld.moons !== "object" || Array.isArray(normalizedWorld.moons))
  ) {
    errors.push("'moons' must be an object.");
  }
  if (
    normalizedWorld.moon != null &&
    (typeof normalizedWorld.moon !== "object" || Array.isArray(normalizedWorld.moon))
  ) {
    errors.push("'moon' must be an object.");
  }

  const planetsById = normalizedWorld.planets?.byId;
  if (planetsById && (typeof planetsById !== "object" || Array.isArray(planetsById))) {
    errors.push("'planets.byId' must be an object.");
  }
  const planetaryBodiesById = normalizedWorld.planetaryBodies?.byId;
  if (
    planetaryBodiesById &&
    (typeof planetaryBodiesById !== "object" || Array.isArray(planetaryBodiesById))
  ) {
    errors.push("'planetaryBodies.byId' must be an object.");
  }
  validatePlanetaryBodySubtypeEvidence(normalizedWorld, errors);
  const moonsById = normalizedWorld.moons?.byId;
  if (moonsById && (typeof moonsById !== "object" || Array.isArray(moonsById))) {
    errors.push("'moons.byId' must be an object.");
  }

  if (normalizedWorld.stellarSystem != null) {
    errors.push(
      ...validateStellarSystemDefinition(normalizedWorld.stellarSystem, {
        fallbackStar: normalizedWorld.star,
      }),
    );
  }

  return { ok: errors.length === 0, errors, isEnvelope, world };
}
