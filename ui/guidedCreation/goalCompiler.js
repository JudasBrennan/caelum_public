import { sortDiagnostics } from "./diagnostics.js";
import {
  findGoalTemplate,
  getGoalTemplate,
  getGoalTrait,
  goalEditScopeSatisfies,
  normalizeGoalAllowedEdits,
  normalizeGoalObjectType,
  normalizeGoalPriority,
  normalizeGoalSearchBudget,
  normalizeGoalTraitRole,
} from "./goalTraits.js";

const POSITIVE_TRAIT_ROLES = Object.freeze(["required", "preferred"]);

const HABITABILITY_PRIORITY_BOOSTS = Object.freeze(
  new Set([
    "surface-liquid-water",
    "retained-atmosphere",
    "in-habitable-zone",
    "in-stellar-habitable-zone",
    "breathable-oxygen-window",
    "surface-biosphere-plausible",
    "vegetation-plausible",
    "high-habitability",
    "high-esi",
    "low-radiation",
    "low-flare-rate",
    "earthlike-life-possible",
    "long-main-sequence-lifetime",
  ]),
);

const REALISM_PRIORITY_BOOSTS = Object.freeze(
  new Set([
    "subsurface-ocean",
    "resonance-supported-heating",
    "tectonically-active",
    "class-ii-iii",
    "class-iv-v",
    "ice-giant-mass-range",
    "main-sequence",
    "high-luminosity",
  ]),
);

const CONTEXT_PRIORITY_WEIGHTS = Object.freeze({
  "maximize-realism": { contextDeviationWeight: 1, orbitDeviationWeight: 1 },
  "maximize-habitability": { contextDeviationWeight: 1, orbitDeviationWeight: 1 },
  "preserve-current-system": { contextDeviationWeight: 3, orbitDeviationWeight: 2 },
  "preserve-current-orbit-context": { contextDeviationWeight: 2, orbitDeviationWeight: 3 },
});

function normalizeTraitList(value) {
  return [
    ...new Set(
      (Array.isArray(value) ? value : [])
        .map((entry) => String(entry || "").trim())
        .filter(Boolean),
    ),
  ].sort();
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map((entry) => sortObjectKeys(entry));
  if (!value || typeof value !== "object") return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectKeys(value[key]);
      return acc;
    }, {});
}

function stableSignature(value) {
  return JSON.stringify(sortObjectKeys(value));
}

function diagnostic(severity, code, title, detail, suggestedActions = []) {
  return {
    severity,
    code,
    title,
    detail,
    suggestedActions: (Array.isArray(suggestedActions) ? suggestedActions : [])
      .map((entry) => String(entry || "").trim())
      .filter(Boolean),
  };
}

function inferObjectType(rawDraft = {}) {
  const explicit = normalizeGoalObjectType(rawDraft.objectType);
  if (explicit) return explicit;
  return normalizeGoalObjectType(findGoalTemplate(rawDraft.goalTemplateId)?.objectType);
}

function buildDraft(rawDraft = {}) {
  const objectType = inferObjectType(rawDraft);
  return {
    objectType,
    goalTemplateId: String(rawDraft.goalTemplateId || "").trim(),
    priority: String(rawDraft.priority || "").trim(),
    allowedEdits: String(rawDraft.allowedEdits || "").trim(),
    searchBudget: String(rawDraft.searchBudget || "").trim(),
    requiredTraits: normalizeTraitList(rawDraft.requiredTraits),
    preferredTraits: normalizeTraitList(rawDraft.preferredTraits),
    avoidTraits: normalizeTraitList(rawDraft.avoidTraits),
  };
}

function buildTemplateFallback(objectType, goalTemplateId, diagnostics) {
  if (!objectType) {
    diagnostics.push(
      diagnostic(
        "blocked",
        "missing-object-type",
        "Unknown object type",
        "Choose which kind of body this goal is trying to create.",
      ),
    );
    return null;
  }
  const template = getGoalTemplate(objectType, goalTemplateId);
  if (!template) {
    diagnostics.push(
      diagnostic(
        "blocked",
        "unknown-goal-template",
        "Unknown goal template",
        `The goal template "${goalTemplateId || "unknown"}" is not registered for ${objectType}.`,
      ),
    );
    return null;
  }
  return template;
}

function mergeTraits(template, draft) {
  return {
    requiredTraits: normalizeTraitList([
      ...(template?.requiredTraits || []),
      ...draft.requiredTraits,
    ]),
    preferredTraits: normalizeTraitList([
      ...(template?.preferredTraits || []),
      ...draft.preferredTraits,
    ]),
    avoidTraits: normalizeTraitList([...(template?.avoidTraits || []), ...draft.avoidTraits]),
  };
}

function validateTraitSupport(traits, role, objectType, diagnostics, traitDetails) {
  for (const traitId of traits) {
    const entry = getGoalTrait(traitId);
    if (!entry) {
      diagnostics.push(
        diagnostic(
          "blocked",
          "unknown-trait",
          "Unknown trait",
          `The trait "${traitId}" is not registered.`,
        ),
      );
      continue;
    }
    traitDetails[traitId] = entry;
    if (!entry.objectTypes.includes(objectType)) {
      diagnostics.push(
        diagnostic(
          "blocked",
          "trait-object-type-mismatch",
          "Trait does not apply to this object type",
          `The trait "${entry.label}" does not apply to ${objectType}.`,
        ),
      );
    }
    if (!entry.allowedRoles.includes(normalizeGoalTraitRole(role))) {
      diagnostics.push(
        diagnostic(
          "blocked",
          "trait-role-mismatch",
          "Trait cannot be used in this role",
          `The trait "${entry.label}" cannot be used as ${role}.`,
        ),
      );
    }
  }
}

function applyPrerequisites(compiled, diagnostics, traitDetails) {
  for (const role of POSITIVE_TRAIT_ROLES) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const traitId of [...compiled[`${role}Traits`]]) {
        const entry = traitDetails[traitId] || getGoalTrait(traitId);
        if (!entry) continue;
        for (const prerequisiteId of entry.prerequisites || []) {
          if (
            compiled.requiredTraits.includes(prerequisiteId) ||
            compiled.preferredTraits.includes(prerequisiteId) ||
            compiled.avoidTraits.includes(prerequisiteId)
          ) {
            continue;
          }
          const prerequisiteEntry = getGoalTrait(prerequisiteId);
          if (!prerequisiteEntry) continue;
          compiled[`${role}Traits`].push(prerequisiteId);
          compiled[`${role}Traits`].sort();
          traitDetails[prerequisiteId] = prerequisiteEntry;
          diagnostics.push(
            diagnostic(
              "info",
              "prerequisite-added",
              "Prerequisite added",
              `Added "${prerequisiteEntry.label}" because "${entry.label}" depends on it.`,
            ),
          );
          changed = true;
        }
      }
    }
  }
}

function detectRoleContradictions(compiled, traitDetails, diagnostics) {
  for (const traitId of compiled.requiredTraits) {
    if (compiled.avoidTraits.includes(traitId)) {
      diagnostics.push(
        diagnostic(
          "blocked",
          "required-vs-avoid-conflict",
          "Trait selected as both Must have and Avoid",
          `The trait "${traitDetails[traitId]?.label || traitId}" cannot be both required and avoided.`,
        ),
      );
    }
  }
  for (const traitId of compiled.preferredTraits) {
    if (compiled.avoidTraits.includes(traitId)) {
      diagnostics.push(
        diagnostic(
          "blocked",
          "preferred-vs-avoid-conflict",
          "Trait selected as both Prefer and Avoid",
          `The trait "${traitDetails[traitId]?.label || traitId}" cannot be both preferred and avoided.`,
        ),
      );
    }
  }
}

function detectIncompatiblePositiveTraits(compiled, traitDetails, diagnostics) {
  const positives = [...compiled.requiredTraits, ...compiled.preferredTraits].sort();
  for (const traitId of positives) {
    const entry = traitDetails[traitId] || getGoalTrait(traitId);
    if (!entry) continue;
    for (const incompatibleId of entry.incompatibleWith || []) {
      if (!positives.includes(incompatibleId)) continue;
      if (traitId.localeCompare(incompatibleId) >= 0) continue;
      diagnostics.push(
        diagnostic(
          "blocked",
          "incompatible-positive-traits",
          "Incompatible positive traits",
          `The traits "${entry.label}" and "${traitDetails[incompatibleId]?.label || incompatibleId}" cannot both be targeted together.`,
        ),
      );
    }
  }
}

function detectScopeConflicts(compiled, templateEntry, traitDetails, diagnostics) {
  const requiredScope = [templateEntry?.minimumAllowedEdits || ""]
    .concat(
      [...compiled.requiredTraits, ...compiled.preferredTraits].map(
        (traitId) => traitDetails[traitId]?.minimumAllowedEdits || "",
      ),
    )
    .filter(Boolean)
    .reduce((strictest, candidate) => {
      if (!strictest) return candidate;
      return goalEditScopeSatisfies(candidate, strictest) ? candidate : strictest;
    }, "");

  if (requiredScope && !goalEditScopeSatisfies(compiled.allowedEdits, requiredScope)) {
    diagnostics.push(
      diagnostic(
        "blocked",
        "edit-scope-too-narrow",
        "Allowed edits are too narrow",
        `This goal requires at least ${requiredScope.replaceAll("-", " ")} but the current goal only allows ${compiled.allowedEdits.replaceAll("-", " ")}.`,
      ),
    );
  }
}

function computePreferredWeight(traitId, priority) {
  let weight = 1;
  if (priority === "maximize-habitability" && HABITABILITY_PRIORITY_BOOSTS.has(traitId))
    weight += 1;
  if (priority === "maximize-realism" && REALISM_PRIORITY_BOOSTS.has(traitId)) weight += 0.5;
  if (priority === "preserve-current-system" || priority === "preserve-current-orbit-context") {
    weight += 0.25;
  }
  return Number(weight.toFixed(2));
}

function computeAvoidPenalty(traitId, priority) {
  let penalty = 1;
  if (priority === "maximize-habitability" && HABITABILITY_PRIORITY_BOOSTS.has(traitId))
    penalty += 1;
  if (priority === "maximize-realism" && REALISM_PRIORITY_BOOSTS.has(traitId)) penalty += 0.5;
  return Number(penalty.toFixed(2));
}

function buildEvaluationPlan(compiled) {
  const contextWeights =
    CONTEXT_PRIORITY_WEIGHTS[compiled.priority] || CONTEXT_PRIORITY_WEIGHTS["maximize-realism"];
  return {
    priority: compiled.priority,
    hardConstraints: compiled.requiredTraits.map((traitId) => ({
      traitId,
      evaluatorKey: getGoalTrait(traitId)?.evaluatorKey || traitId,
      weight: 1,
    })),
    preferredTraits: compiled.preferredTraits.map((traitId) => ({
      traitId,
      evaluatorKey: getGoalTrait(traitId)?.evaluatorKey || traitId,
      weight: computePreferredWeight(traitId, compiled.priority),
    })),
    avoidTraits: compiled.avoidTraits.map((traitId) => ({
      traitId,
      evaluatorKey: getGoalTrait(traitId)?.evaluatorKey || traitId,
      penalty: computeAvoidPenalty(traitId, compiled.priority),
    })),
    contextDeviationWeight: contextWeights.contextDeviationWeight,
    orbitDeviationWeight: contextWeights.orbitDeviationWeight,
  };
}

export function compileGuidedGoal(rawDraft = {}) {
  const diagnostics = [];
  const draft = buildDraft(rawDraft);
  const templateEntry = buildTemplateFallback(draft.objectType, draft.goalTemplateId, diagnostics);

  if (!templateEntry) {
    return {
      valid: false,
      compiledGoal: null,
      diagnostics: sortDiagnostics(diagnostics),
    };
  }

  const compiled = {
    objectType: draft.objectType,
    goalTemplateId: templateEntry.id,
    templateLabel: templateEntry.label,
    priority: draft.priority
      ? normalizeGoalPriority(draft.priority)
      : templateEntry.defaultPriority,
    allowedEdits: draft.allowedEdits
      ? normalizeGoalAllowedEdits(draft.allowedEdits)
      : templateEntry.defaultAllowedEdits,
    searchBudget: draft.searchBudget
      ? normalizeGoalSearchBudget(draft.searchBudget)
      : templateEntry.defaultSearchBudget,
    ...mergeTraits(templateEntry, draft),
  };

  const traitDetails = {};
  validateTraitSupport(
    compiled.requiredTraits,
    "required",
    compiled.objectType,
    diagnostics,
    traitDetails,
  );
  validateTraitSupport(
    compiled.preferredTraits,
    "preferred",
    compiled.objectType,
    diagnostics,
    traitDetails,
  );
  validateTraitSupport(
    compiled.avoidTraits,
    "avoid",
    compiled.objectType,
    diagnostics,
    traitDetails,
  );
  applyPrerequisites(compiled, diagnostics, traitDetails);
  validateTraitSupport(
    compiled.requiredTraits,
    "required",
    compiled.objectType,
    diagnostics,
    traitDetails,
  );
  validateTraitSupport(
    compiled.preferredTraits,
    "preferred",
    compiled.objectType,
    diagnostics,
    traitDetails,
  );
  detectRoleContradictions(compiled, traitDetails, diagnostics);
  detectIncompatiblePositiveTraits(compiled, traitDetails, diagnostics);
  detectScopeConflicts(compiled, templateEntry, traitDetails, diagnostics);

  const sortedDiagnostics = sortDiagnostics(diagnostics);
  const valid = !sortedDiagnostics.some((entry) => entry.severity === "blocked");

  if (!valid) {
    return {
      valid: false,
      compiledGoal: null,
      diagnostics: sortedDiagnostics,
    };
  }

  const compiledGoal = {
    objectType: compiled.objectType,
    goalTemplateId: compiled.goalTemplateId,
    templateLabel: compiled.templateLabel,
    priority: normalizeGoalPriority(compiled.priority),
    allowedEdits: normalizeGoalAllowedEdits(compiled.allowedEdits),
    searchBudget: normalizeGoalSearchBudget(compiled.searchBudget),
    requiredTraits: normalizeTraitList(compiled.requiredTraits),
    preferredTraits: normalizeTraitList(compiled.preferredTraits),
    avoidTraits: normalizeTraitList(compiled.avoidTraits),
  };
  compiledGoal.evaluationPlan = buildEvaluationPlan(compiledGoal);
  compiledGoal.compiledGoalSignature = stableSignature({
    objectType: compiledGoal.objectType,
    goalTemplateId: compiledGoal.goalTemplateId,
    priority: compiledGoal.priority,
    allowedEdits: compiledGoal.allowedEdits,
    searchBudget: compiledGoal.searchBudget,
    requiredTraits: compiledGoal.requiredTraits,
    preferredTraits: compiledGoal.preferredTraits,
    avoidTraits: compiledGoal.avoidTraits,
    evaluationPlan: compiledGoal.evaluationPlan,
  });

  return {
    valid: true,
    compiledGoal,
    diagnostics: sortedDiagnostics,
  };
}
