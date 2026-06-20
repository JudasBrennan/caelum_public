export const RESERVED_IMPORT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

import { validateStellarSystemDefinition } from "./stellarSystemModel.js";
import { normalizeVisualMode } from "../planetaryVisual/overrides.js";

const VISUAL_OVERRIDE_ROOT_KEYS = new Set([
  "schemaVersion",
  "presetId",
  "seed",
  "lockedFields",
  "palette",
  "surface",
  "atmosphere",
  "clouds",
  "bands",
  "storms",
  "rings",
  "subtype",
  "material",
]);
const VISUAL_OVERRIDE_MAX_DEPTH = 8;
const VISUAL_OVERRIDE_MAX_ARRAY_ITEMS = 64;
const VISUAL_OVERRIDE_MAX_STRING_LENGTH = 160;
const VISUAL_OVERRIDE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const STRICT_COLOR_KEY_PATTERN = /(^|\.)(c[1-3]|color|colour|primary|secondary|accent)$/i;
const HEX_COLOR_PATTERN = /^#?[0-9a-fA-F]{6}$/;

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

function visualOverridePath(path, key) {
  return path ? `${path}.${key}` : key;
}

function isStrictColorPath(path) {
  return STRICT_COLOR_KEY_PATTERN.test(String(path || ""));
}

function validateVisualOverrideValue(value, path, errors, depth = 0) {
  if (depth > VISUAL_OVERRIDE_MAX_DEPTH) {
    errors.push(`'${path}' exceeds the maximum visual override depth.`);
    return;
  }
  if (value == null) return;
  if (Array.isArray(value)) {
    if (!path.endsWith(".lockedFields") && path !== "lockedFields") {
      errors.push(`'${path}' must not be an array.`);
      return;
    }
    if (value.length > VISUAL_OVERRIDE_MAX_ARRAY_ITEMS) {
      errors.push(`'${path}' has too many entries.`);
      return;
    }
    for (const [index, item] of value.entries()) {
      if (typeof item !== "string" || item.length > VISUAL_OVERRIDE_MAX_STRING_LENGTH) {
        errors.push(`'${path}[${index}]' must be a short string.`);
      }
    }
    return;
  }
  if (isPlainObjectLike(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (RESERVED_IMPORT_KEYS.has(key)) {
        errors.push(`'${visualOverridePath(path, key)}' uses a reserved key.`);
        continue;
      }
      if (!VISUAL_OVERRIDE_KEY_PATTERN.test(key)) {
        errors.push(`'${visualOverridePath(path, key)}' has an invalid visual override key.`);
        continue;
      }
      if (depth === 0 && !VISUAL_OVERRIDE_ROOT_KEYS.has(key)) {
        errors.push(`'visualOverrides.${key}' is not an allowed visual override section.`);
        continue;
      }
      validateVisualOverrideValue(child, visualOverridePath(path, key), errors, depth + 1);
    }
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) errors.push(`'${path}' must be a finite number.`);
    return;
  }
  if (typeof value === "string") {
    if (value.length > VISUAL_OVERRIDE_MAX_STRING_LENGTH) {
      errors.push(`'${path}' must be ${VISUAL_OVERRIDE_MAX_STRING_LENGTH} characters or fewer.`);
    }
    if (isStrictColorPath(path) && value && !HEX_COLOR_PATTERN.test(value.trim())) {
      errors.push(`'${path}' must be a 6-digit hex color.`);
    }
    return;
  }
  if (typeof value === "boolean") return;
  errors.push(`'${path}' must be a string, finite number, boolean, null, or object.`);
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

function validatePlanetaryBodyVisualAppearanceRecord(body, bodyPath, errors) {
  if (!isPlainObjectLike(body)) return;
  const appearance = body.appearance;
  if (appearance == null) return;
  if (!isPlainObjectLike(appearance)) {
    errors.push(`'${bodyPath}.appearance' must be an object when provided.`);
    return;
  }
  if (
    Object.prototype.hasOwnProperty.call(appearance, "visualMode") &&
    (typeof appearance.visualMode !== "string" ||
      normalizeVisualMode(appearance.visualMode) !==
        String(appearance.visualMode)
          .trim()
          .toLowerCase()
          .replace(/[\s_-]+/g, ""))
  ) {
    errors.push(`'${bodyPath}.appearance.visualMode' must be auto, mixed, or custom.`);
  }
  if (Object.prototype.hasOwnProperty.call(appearance, "visualOverrides")) {
    if (!isPlainObjectLike(appearance.visualOverrides)) {
      errors.push(`'${bodyPath}.appearance.visualOverrides' must be an object.`);
    } else {
      validateVisualOverrideValue(
        appearance.visualOverrides,
        `${bodyPath}.appearance.visualOverrides`,
        errors,
      );
    }
  }
}

function validatePlanetaryBodyVisualAppearanceCollection(collection, collectionPath, errors) {
  const byId = collection?.byId;
  if (!isPlainObjectLike(byId)) return;

  for (const [id, body] of Object.entries(byId)) {
    validatePlanetaryBodyVisualAppearanceRecord(body, `${collectionPath}.byId.${id}`, errors);
  }
}

function validatePlanetaryBodyVisualAppearance(world, errors) {
  validatePlanetaryBodyVisualAppearanceCollection(
    world?.planetaryBodies,
    "planetaryBodies",
    errors,
  );
  validatePlanetaryBodyVisualAppearanceCollection(world?.planets, "planets", errors);
  validatePlanetaryBodyVisualAppearanceCollection(
    world?.system?.gasGiants,
    "system.gasGiants",
    errors,
  );
  validatePlanetaryBodyVisualAppearanceRecord(world?.planet, "planet", errors);
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
    errors.push("Import JSON is not a recognised Caelum or WorldSmith-format world.");
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
  validatePlanetaryBodyVisualAppearance(normalizedWorld, errors);
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
