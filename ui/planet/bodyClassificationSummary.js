import { classifyPlanetaryBody } from "../../engine/planetaryClassification.js";

export const BODY_CLASSIFICATION_LABELS = Object.freeze({
  brownDwarf: "Brown-dwarf companion",
  gasGiant: "Gas giant",
  iceGiant: "Ice giant",
  miniNeptune: "Mini-Neptune",
  volatileCandidate: "Volatile world",
  radiusValley: "Radius-valley world",
  superEarth: "Super-Earth",
  rocky: "Rocky world",
  dwarfRocky: "Dwarf rocky body",
});

export const AUTHORING_INTENT_LABELS = Object.freeze({
  rocky: "Rocky start",
  volatile: "Volatile start",
  iceGiant: "Ice-giant start",
  gasGiant: "Gas-giant start",
  substellar: "Substellar start",
  auto: "Auto start",
});

const SURFACE_APPLICABILITY_LABELS = Object.freeze({
  full: "Surface model full",
  limited: "Surface model limited",
  none: "No accessible surface",
  "solid-surface": "Surface model full",
  "possible-solid-surface": "Surface model limited",
  "no-accessible-solid-surface": "No accessible surface",
  substellar: "Substellar companion",
});

const PAGE_GUIDANCE_LABELS = Object.freeze({
  apparent: "Apparent view",
  calendar: "Calendar",
  climate: "Climate",
  population: "Population",
  tectonics: "Tectonics",
});

const PAGE_GUIDANCE_STATUS_LABELS = Object.freeze({
  full: "supported",
  limited: "limited",
  none: "unsupported",
});

const PAGE_GUIDANCE_STATUS_SEVERITY = Object.freeze({
  full: 1,
  limited: 2,
  none: 3,
});

const SUBTYPE_PAGE_GUIDANCE_FALLBACKS = Object.freeze({
  roguePlanet: Object.freeze({
    calendar: "limited",
  }),
});

const INTENT_EXPECTED_FAMILIES = Object.freeze({
  rocky: new Set(["dwarfRocky", "rocky", "superEarth", "radiusValley"]),
  volatile: new Set(["volatileCandidate", "miniNeptune", "iceGiant"]),
  iceGiant: new Set(["iceGiant"]),
  gasGiant: new Set(["gasGiant"]),
  substellar: new Set(["brownDwarf"]),
});

function titleCase(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getPlanetaryBodyClassification(body) {
  if (!body || typeof body !== "object") return null;
  return body.classification || classifyPlanetaryBody(body);
}

export function getPlanetaryBodyClassificationLabel(classificationOrFamily) {
  const family =
    typeof classificationOrFamily === "string"
      ? classificationOrFamily
      : classificationOrFamily?.family || classificationOrFamily?.code;
  return (
    BODY_CLASSIFICATION_LABELS[family] || classificationOrFamily?.displayLabel || titleCase(family)
  );
}

export function getAuthoringIntentLabel(authoringIntent) {
  const intent = String(authoringIntent || "auto");
  return AUTHORING_INTENT_LABELS[intent] || titleCase(intent || "auto");
}

export function getSurfaceApplicabilityLabel(surfaceApplicability) {
  const key = String(surfaceApplicability || "");
  return SURFACE_APPLICABILITY_LABELS[key] || titleCase(key || "unknown surface");
}

function normalizePageStatus(status) {
  const normalized = String(status || "").trim();
  return PAGE_GUIDANCE_STATUS_LABELS[normalized] ? normalized : "";
}

function pageLabelFor(pageId) {
  const key = String(pageId || "").trim();
  return PAGE_GUIDANCE_LABELS[key] || titleCase(key || "This page");
}

function isClassificationLike(value) {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value.family ||
      value.code ||
      value.solverFamily ||
      value.surfaceApplicability ||
      Array.isArray(value.subtypes))
  );
}

function resolveBodyAndClassification(value) {
  if (!value || typeof value !== "object") {
    return { body: null, classification: null };
  }
  if (value.classification && typeof value.classification === "object") {
    return { body: value, classification: value.classification };
  }
  if (isClassificationLike(value)) {
    return { body: null, classification: value };
  }
  return { body: value, classification: getPlanetaryBodyClassification(value) };
}

function bodyDisplayName(body) {
  return body?.name || body?.inputs?.name || body?.id || "The selected body";
}

function getSubtypePageGuidance(subtype, pageId) {
  const explicit = subtype?.pageGuidance?.[pageId];
  return normalizePageStatus(explicit || SUBTYPE_PAGE_GUIDANCE_FALLBACKS[subtype?.id]?.[pageId]);
}

function normalizeReason(reason) {
  if (!reason || typeof reason !== "object") return null;
  const label = String(reason.label || "").trim();
  const detail = String(reason.detail || "").trim();
  if (!label && !detail) return null;
  return {
    code: String(reason.code || ""),
    label: label || detail,
    detail: label ? detail : "",
    severity: reason.severity || "info",
  };
}

function normalizeSubtype(subtype) {
  if (!subtype || typeof subtype !== "object") return null;
  const id = String(subtype.id || "").trim();
  const label = String(subtype.label || "").trim() || titleCase(id);
  if (!id && !label) return null;
  return {
    ...subtype,
    id,
    label,
    confidence: subtype.confidence || "unknown",
    applicability: subtype.applicability || "",
    reasons: (subtype.reasons || []).map(normalizeReason).filter(Boolean),
    warnings: (subtype.warnings || []).map(normalizeReason).filter(Boolean),
    pageGuidance:
      subtype.pageGuidance && typeof subtype.pageGuidance === "object"
        ? { ...subtype.pageGuidance }
        : {},
  };
}

function subtypePriority(subtype, primarySubtypeId) {
  if (!subtype) return 0;
  if (subtype.id && subtype.id === primarySubtypeId) return 2;
  return 1;
}

function normalizeSubtypes(body, classification) {
  const rawSubtypes = Array.isArray(classification?.subtypes)
    ? classification.subtypes
    : Array.isArray(body?.subtypes)
      ? body.subtypes
      : [];
  const primarySubtypeId =
    classification?.primarySubtypeId || body?.primarySubtype?.id || rawSubtypes[0]?.id || "";
  const subtypes = rawSubtypes
    .map(normalizeSubtype)
    .filter(Boolean)
    .sort(
      (left, right) =>
        subtypePriority(right, primarySubtypeId) - subtypePriority(left, primarySubtypeId),
    );
  const primarySubtype =
    subtypes.find((subtype) => subtype.id === primarySubtypeId) || subtypes[0] || null;
  return {
    subtypes,
    primarySubtype,
    secondarySubtypes: primarySubtype
      ? subtypes.filter((subtype) => subtype.id !== primarySubtype.id)
      : subtypes.slice(1),
  };
}

function buildSubtypePageGuidance(subtypes) {
  const strongest = new Map();
  const severity = { none: 3, limited: 2, full: 1 };
  for (const subtype of subtypes || []) {
    for (const [pageId, status] of Object.entries(subtype.pageGuidance || {})) {
      const normalizedStatus = String(status || "").trim();
      if (!normalizedStatus) continue;
      const existing = strongest.get(pageId);
      if (!existing || (severity[normalizedStatus] || 0) > (severity[existing.status] || 0)) {
        strongest.set(pageId, {
          pageId,
          pageLabel: PAGE_GUIDANCE_LABELS[pageId] || titleCase(pageId),
          status: normalizedStatus,
          statusLabel: PAGE_GUIDANCE_STATUS_LABELS[normalizedStatus] || titleCase(normalizedStatus),
          subtypeLabel: subtype.label,
        });
      }
    }
  }
  return [...strongest.values()].sort((left, right) =>
    left.pageLabel.localeCompare(right.pageLabel),
  );
}

function isSupportReason(reason) {
  const code = String(reason?.code || "");
  return code.startsWith("legacyKind:") || code.startsWith("authoringIntent:");
}

function buildIntentWarning(body, classification, label) {
  const intent = body?.authoringIntent || body?.inputs?.authoringIntent || "auto";
  const expectedFamilies = INTENT_EXPECTED_FAMILIES[intent];
  if (!expectedFamilies || expectedFamilies.has(classification?.family)) return null;
  return {
    code: "authoringIntentDivergence",
    label: `Started as ${getAuthoringIntentLabel(intent)}, but physical inputs classify it as ${label}.`,
    detail: "",
    severity: "warning",
  };
}

export function buildPlanetaryBodyClassificationSummary(body) {
  if (!body || typeof body !== "object") return null;
  const classification = getPlanetaryBodyClassification(body);
  if (!classification) return null;
  const label = getPlanetaryBodyClassificationLabel(classification);
  const authoringIntent = body.authoringIntent || body.inputs?.authoringIntent || "auto";
  const reasons = (classification.reasons || [])
    .map(normalizeReason)
    .filter(Boolean)
    .filter((reason) => !isSupportReason(reason));
  const supportReasons = (classification.reasons || [])
    .map(normalizeReason)
    .filter(Boolean)
    .filter(isSupportReason);
  const { subtypes, primarySubtype, secondarySubtypes } = normalizeSubtypes(body, classification);
  const subtypeReasons = primarySubtype?.reasons?.length ? primarySubtype.reasons.slice(0, 2) : [];
  const subtypeWarnings = subtypes.flatMap((subtype) => subtype.warnings || []).slice(0, 3);
  const warnings = [
    buildIntentWarning(body, classification, label),
    ...(classification.warnings || []).map(normalizeReason).filter(Boolean),
    ...subtypeWarnings,
  ].filter(Boolean);
  const pageGuidance = buildSubtypePageGuidance(subtypes);

  return {
    bodyId: body.id || "",
    name: body.name || body.inputs?.name || body.id || "Selected body",
    label,
    family: classification.family || classification.code || "",
    confidence: classification.confidence || "unknown",
    authoringIntent,
    authoringIntentLabel: getAuthoringIntentLabel(authoringIntent),
    surfaceApplicability: classification.surfaceApplicability || "",
    surfaceApplicabilityLabel: getSurfaceApplicabilityLabel(classification.surfaceApplicability),
    solverFamily: classification.solverFamily || "",
    scale: classification.scale || "",
    boundaryTraits: Array.isArray(classification.boundaryTraits)
      ? classification.boundaryTraits
      : [],
    subtypes,
    primarySubtype,
    secondarySubtypes,
    reasons: reasons.length ? reasons.slice(0, 3) : supportReasons.slice(0, 3),
    subtypeReasons,
    warnings,
    pageGuidance,
  };
}

export function hasLimitedSurfaceApplicability(summary) {
  const value = String(summary?.surfaceApplicability || "");
  return value && value !== "full" && value !== "solid-surface";
}

export function isSurfaceApplicableClassification(classificationOrSummary) {
  const value = String(classificationOrSummary?.surfaceApplicability || "");
  if (value === "full" || value === "solid-surface") return true;
  const solverFamily = String(classificationOrSummary?.solverFamily || "");
  return solverFamily === "rocky" && (value === "limited" || value === "possible-solid-surface");
}

export function getSubtypePageApplicability(bodyOrClassification, pageId) {
  const pageKey = String(pageId || "").trim();
  const { body, classification } = resolveBodyAndClassification(bodyOrClassification);
  const pageLabel = pageLabelFor(pageKey);
  const result = {
    pageId: pageKey,
    pageLabel,
    status: "full",
    statusLabel: PAGE_GUIDANCE_STATUS_LABELS.full,
    subtypeId: "",
    subtypeLabel: "",
    reason: "",
    surfaceApplicability: classification?.surfaceApplicability || "",
    surfaceApplicabilityLabel: getSurfaceApplicabilityLabel(classification?.surfaceApplicability),
  };

  if (!classification) return result;
  if (!isSurfaceApplicableClassification(classification)) {
    result.status = "none";
    result.statusLabel = PAGE_GUIDANCE_STATUS_LABELS.none;
    result.reason = "surfaceApplicability";
  }

  const { subtypes } = normalizeSubtypes(body || {}, classification);
  for (const subtype of subtypes) {
    const subtypeStatus = getSubtypePageGuidance(subtype, pageKey);
    if (!subtypeStatus) continue;
    const subtypeSeverity = PAGE_GUIDANCE_STATUS_SEVERITY[subtypeStatus] || 0;
    const currentSeverity = PAGE_GUIDANCE_STATUS_SEVERITY[result.status] || 0;
    if (subtypeSeverity < currentSeverity) continue;
    if (subtypeSeverity === currentSeverity && result.reason === "subtypePageGuidance") {
      continue;
    }
    result.status = subtypeStatus;
    result.statusLabel =
      PAGE_GUIDANCE_STATUS_LABELS[subtypeStatus] || titleCase(subtypeStatus || "supported");
    result.subtypeId = subtype.id;
    result.subtypeLabel = subtype.label;
    result.reason = "subtypePageGuidance";
  }

  return result;
}

export function buildSubtypeUnsupportedMessage(bodyOrClassification, pageId) {
  const { body, classification } = resolveBodyAndClassification(bodyOrClassification);
  const applicability = getSubtypePageApplicability(bodyOrClassification, pageId);
  if (applicability.status === "full") return "";
  const pageLabel = applicability.pageLabel || pageLabelFor(pageId);
  const name = bodyDisplayName(body);
  const subtypeText = applicability.subtypeLabel
    ? `${applicability.subtypeLabel} guidance marks this page as ${applicability.statusLabel}.`
    : `${getPlanetaryBodyClassificationLabel(classification)} (${applicability.surfaceApplicabilityLabel}) is not an ordinary accessible rocky surface.`;

  if (applicability.status === "none") {
    return `${pageLabel} is unsupported for ${name}. ${subtypeText} Surface outputs are not shown.`;
  }
  return `${pageLabel} is limited for ${name}. ${subtypeText} Outputs are conservative until a dedicated subtype model exists.`;
}

export function buildUnsupportedSurfaceMessage(
  body,
  classificationOrSummary,
  pageLabel = "This page",
) {
  const classification = classificationOrSummary || getPlanetaryBodyClassification(body);
  const label = getPlanetaryBodyClassificationLabel(classification);
  const name = body?.name || body?.inputs?.name || body?.id || "The selected body";
  const surfaceLabel = getSurfaceApplicabilityLabel(classification?.surfaceApplicability);
  return `${pageLabel} uses rocky, surface-applicable planet models. ${name} is classified as ${label} (${surfaceLabel}), so surface outputs are not shown.`;
}
