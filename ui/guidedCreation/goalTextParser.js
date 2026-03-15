import { sortDiagnostics } from "./diagnostics.js";
import { normalizeGoalAliasText, listGoalTextAliases } from "./goalAliases.js";
import { getGoalTemplate, getGoalTrait } from "./goalTraits.js";

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

function splitTokens(value = "") {
  const normalized = normalizeGoalAliasText(value);
  return normalized ? normalized.split(" ") : [];
}

function levenshteinDistance(left = "", right = "") {
  const a = String(left || "");
  const b = String(right || "");
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

function similarityScore(left = "", right = "") {
  const maxLength = Math.max(String(left || "").length, String(right || "").length, 1);
  return 1 - levenshteinDistance(left, right) / maxLength;
}

function bestWindowSimilarity(text = "", phrase = "") {
  const textTokens = splitTokens(text);
  const phraseTokens = splitTokens(phrase);
  if (!textTokens.length || !phraseTokens.length)
    return { score: 0, distance: Number.POSITIVE_INFINITY };
  const phraseLength = phraseTokens.length;
  let best = { score: 0, distance: Number.POSITIVE_INFINITY };
  for (let length = Math.max(1, phraseLength - 1); length <= phraseLength + 1; length += 1) {
    for (let index = 0; index <= textTokens.length - length; index += 1) {
      const windowText = textTokens.slice(index, index + length).join(" ");
      const score = similarityScore(windowText, phrase);
      const distance = levenshteinDistance(windowText, phrase);
      if (score > best.score || (score === best.score && distance < best.distance)) {
        best = { score, distance };
      }
    }
  }
  return best;
}

function isExactPhraseMatch(text = "", phrase = "") {
  const haystack = ` ${normalizeGoalAliasText(text)} `;
  const needle = ` ${normalizeGoalAliasText(phrase)} `;
  return haystack.includes(needle);
}

function fuzzyThresholdForPhrase(phrase = "") {
  const length = String(phrase || "").length;
  if (length <= 6) return 0.92;
  if (length <= 12) return 0.86;
  return 0.8;
}

function matchAliasText(text = "", phrase = "") {
  const normalizedText = normalizeGoalAliasText(text);
  const normalizedPhrase = normalizeGoalAliasText(phrase);
  if (!normalizedText || !normalizedPhrase) return null;
  if (isExactPhraseMatch(normalizedText, normalizedPhrase)) {
    return {
      matchType: "exact",
      score: 200 + normalizedPhrase.length,
      similarity: 1,
      distance: 0,
      phrase: normalizedPhrase,
    };
  }
  const fuzzy = bestWindowSimilarity(normalizedText, normalizedPhrase);
  const threshold = fuzzyThresholdForPhrase(normalizedPhrase);
  const maxDistance = Math.max(1, Math.floor(normalizedPhrase.length * 0.2));
  if (fuzzy.score >= threshold && fuzzy.distance <= maxDistance) {
    return {
      matchType: "fuzzy",
      score: 100 + Math.round(fuzzy.score * 50) + normalizedPhrase.length,
      similarity: fuzzy.score,
      distance: fuzzy.distance,
      phrase: normalizedPhrase,
    };
  }
  return null;
}

function mergeTraitRoles(base = {}, patch = {}) {
  return {
    ...(base && typeof base === "object" && !Array.isArray(base) ? base : {}),
    ...(patch && typeof patch === "object" && !Array.isArray(patch) ? patch : {}),
  };
}

function controlLabel(kind, value) {
  switch (`${kind}:${value}`) {
    case "priority:preserve-current-system":
      return "preserve current system";
    case "priority:preserve-current-orbit-context":
      return "preserve current orbit";
    case "priority:maximize-habitability":
      return "maximize habitability";
    case "priority:maximize-realism":
      return "maximize realism";
    case "allowedEdits:edit-object-only":
      return "edit object only";
    case "allowedEdits:edit-object-plus-host":
      return "allow host edits";
    case "allowedEdits:edit-object-plus-local-system":
      return "allow local-system edits";
    case "searchBudget:fast":
      return "fast search";
    case "searchBudget:balanced":
      return "balanced search";
    case "searchBudget:deep":
      return "deep search";
    default:
      return String(value || "").trim();
  }
}

function buildMatchedAliasEntries(objectType = "", text = "") {
  const aliases = listGoalTextAliases(objectType);
  const matches = [];
  for (const alias of aliases) {
    for (const phrase of alias.phrases || []) {
      const match = matchAliasText(text, phrase);
      if (!match) continue;
      matches.push({
        ...alias,
        ...match,
        phrase,
      });
      break;
    }
  }
  return matches.sort(
    (left, right) => right.score - left.score || left.label.localeCompare(right.label),
  );
}

function chooseTemplateMatch(matches = []) {
  const templateMatches = matches.filter((entry) => entry.kind === "template");
  if (!templateMatches.length) return { match: null, diagnostics: [] };
  const [best, next] = templateMatches;
  if (
    next &&
    next.value !== best.value &&
    next.matchType === best.matchType &&
    Math.abs((next.score || 0) - (best.score || 0)) <= 2
  ) {
    return {
      match: null,
      diagnostics: [
        diagnostic(
          "blocked",
          "ambiguous-template-alias",
          "Ambiguous goal text",
          `The text could refer to either "${best.label}" or "${next.label}".`,
          ["Use a more specific phrase, or pick a goal card directly."],
        ),
      ],
    };
  }
  const diagnostics = [];
  if (best.matchType === "fuzzy") {
    diagnostics.push(
      diagnostic(
        "warning",
        "fuzzy-template-alias",
        "Interpreted a near-match template phrase",
        `Treated "${best.phrase}" as "${best.label}".`,
      ),
    );
  }
  return { match: best, diagnostics };
}

function chooseBestControl(matches = [], kind = "") {
  const options = matches.filter((entry) => entry.kind === kind);
  if (!options.length) return { value: "", diagnostics: [] };
  const [best, next] = options;
  const diagnostics = [];
  if (
    next &&
    next.value !== best.value &&
    next.matchType === best.matchType &&
    Math.abs((next.score || 0) - (best.score || 0)) <= 2
  ) {
    diagnostics.push(
      diagnostic(
        "warning",
        `ambiguous-${kind}-alias`,
        "Ambiguous modifier",
        `The text suggested both "${controlLabel(kind, best.value)}" and "${controlLabel(kind, next.value)}". Keeping ${controlLabel(kind, best.value)}.`,
      ),
    );
  }
  if (best.matchType === "fuzzy") {
    diagnostics.push(
      diagnostic(
        "warning",
        `fuzzy-${kind}-alias`,
        "Interpreted a near-match modifier",
        `Treated "${best.phrase}" as "${controlLabel(kind, best.value)}".`,
      ),
    );
  }
  return { value: best.value, diagnostics };
}

function chooseTraitRoles(matches = []) {
  const diagnostics = [];
  const traitRoles = {};
  const grouped = new Map();
  for (const match of matches.filter((entry) => entry.kind === "trait")) {
    if (!grouped.has(match.value)) grouped.set(match.value, []);
    grouped.get(match.value).push(match);
  }
  for (const [traitId, entries] of grouped.entries()) {
    entries.sort(
      (left, right) => right.score - left.score || left.label.localeCompare(right.label),
    );
    const [best, next] = entries;
    traitRoles[traitId] = best.role || "preferred";
    if (
      next &&
      next.role &&
      best.role &&
      next.role !== best.role &&
      next.matchType === best.matchType &&
      Math.abs((next.score || 0) - (best.score || 0)) <= 2
    ) {
      diagnostics.push(
        diagnostic(
          "warning",
          "ambiguous-trait-role-alias",
          "Ambiguous trait role",
          `The text both prefers and avoids "${getGoalTrait(traitId)?.label || traitId}". Keeping ${best.role}.`,
        ),
      );
    }
    if (best.matchType === "fuzzy") {
      diagnostics.push(
        diagnostic(
          "warning",
          "fuzzy-trait-alias",
          "Interpreted a near-match trait phrase",
          `Treated "${best.phrase}" as "${getGoalTrait(traitId)?.label || traitId}".`,
        ),
      );
    }
    const patchTraitRoles =
      best.draftPatch?.traitRoles &&
      typeof best.draftPatch.traitRoles === "object" &&
      !Array.isArray(best.draftPatch.traitRoles)
        ? best.draftPatch.traitRoles
        : {};
    Object.assign(traitRoles, patchTraitRoles);
  }
  return { traitRoles, diagnostics };
}

function mergeAliasDraftPatches(matches = []) {
  const merged = {};
  let traitRoles = {};
  for (const match of matches) {
    const draftPatch =
      match.draftPatch && typeof match.draftPatch === "object" && !Array.isArray(match.draftPatch)
        ? match.draftPatch
        : {};
    if (draftPatch.priority) merged.priority = draftPatch.priority;
    if (draftPatch.allowedEdits) merged.allowedEdits = draftPatch.allowedEdits;
    if (draftPatch.searchBudget) merged.searchBudget = draftPatch.searchBudget;
    traitRoles = mergeTraitRoles(traitRoles, draftPatch.traitRoles);
  }
  if (Object.keys(traitRoles).length) merged.traitRoles = traitRoles;
  return merged;
}

function topTemplateSuggestions(objectType = "", text = "", limit = 3) {
  const suggestions = [];
  const templates = listGoalTextAliases(objectType).filter((entry) => entry.kind === "template");
  for (const entry of templates) {
    for (const phrase of entry.phrases || []) {
      const score = bestWindowSimilarity(text, phrase);
      if (score.score <= 0) continue;
      suggestions.push({
        label: entry.label,
        value: entry.value,
        score: score.score,
      });
      break;
    }
  }
  return [...suggestions]
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .filter(
      (entry, index, array) =>
        array.findIndex((candidate) => candidate.value === entry.value) === index,
    )
    .slice(0, limit);
}

function buildInterpretationSummary(result = {}) {
  const parts = [];
  if (result.templateLabel) parts.push(result.templateLabel);
  const preferredTraits = Object.entries(result.goalDraft?.traitRoles || {})
    .filter(([, role]) => role === "preferred")
    .map(([traitId]) => getGoalTrait(traitId)?.label || traitId);
  const requiredTraits = Object.entries(result.goalDraft?.traitRoles || {})
    .filter(([, role]) => role === "required")
    .map(([traitId]) => getGoalTrait(traitId)?.label || traitId);
  const avoidTraits = Object.entries(result.goalDraft?.traitRoles || {})
    .filter(([, role]) => role === "avoid")
    .map(([traitId]) => getGoalTrait(traitId)?.label || traitId);
  if (result.goalDraft?.priority) parts.push(controlLabel("priority", result.goalDraft.priority));
  if (result.goalDraft?.allowedEdits) {
    parts.push(controlLabel("allowedEdits", result.goalDraft.allowedEdits));
  }
  if (result.goalDraft?.searchBudget) {
    parts.push(controlLabel("searchBudget", result.goalDraft.searchBudget));
  }
  if (requiredTraits.length) parts.push(`must have ${requiredTraits.join(", ")}`);
  if (preferredTraits.length) parts.push(`prefer ${preferredTraits.join(", ")}`);
  if (avoidTraits.length) parts.push(`avoid ${avoidTraits.join(", ")}`);
  return parts.join("; ");
}

export function interpretGoalText(objectType = "", text = "", options = {}) {
  const normalizedObjectType = String(objectType || "").trim();
  const rawText = String(text || "");
  const normalizedText = normalizeGoalAliasText(rawText);
  const currentGoalTemplateId = String(options.currentGoalTemplateId || "").trim();
  const diagnostics = [];

  if (!normalizedText) {
    diagnostics.push(
      diagnostic(
        "blocked",
        "empty-goal-text",
        "No goal text entered",
        "Type a short description before trying to interpret it.",
      ),
    );
    return {
      objectType: normalizedObjectType,
      sourceText: rawText,
      normalizedText,
      selectedGoalTemplateId: currentGoalTemplateId || "",
      templateLabel: currentGoalTemplateId
        ? getGoalTemplate(normalizedObjectType, currentGoalTemplateId)?.label || ""
        : "",
      goalDraft: {},
      matchedAliases: [],
      diagnostics: sortDiagnostics(diagnostics),
      confidence: "low",
      summary: "",
    };
  }

  const matches = buildMatchedAliasEntries(normalizedObjectType, normalizedText);
  const templateChoice = chooseTemplateMatch(matches);
  diagnostics.push(...templateChoice.diagnostics);
  const selectedGoalTemplateId = templateChoice.match?.value || currentGoalTemplateId || "";

  const priorityChoice = chooseBestControl(matches, "priority");
  const allowedEditsChoice = chooseBestControl(matches, "allowedEdits");
  const searchBudgetChoice = chooseBestControl(matches, "searchBudget");
  diagnostics.push(
    ...priorityChoice.diagnostics,
    ...allowedEditsChoice.diagnostics,
    ...searchBudgetChoice.diagnostics,
  );

  const traitChoice = chooseTraitRoles(matches);
  diagnostics.push(...traitChoice.diagnostics);

  const aliasPatch = mergeAliasDraftPatches(matches);
  const goalDraft = {
    ...aliasPatch,
    ...(priorityChoice.value ? { priority: priorityChoice.value } : {}),
    ...(allowedEditsChoice.value ? { allowedEdits: allowedEditsChoice.value } : {}),
    ...(searchBudgetChoice.value ? { searchBudget: searchBudgetChoice.value } : {}),
    traitRoles: mergeTraitRoles(aliasPatch.traitRoles, traitChoice.traitRoles),
  };

  if (!selectedGoalTemplateId) {
    const suggestions = topTemplateSuggestions(normalizedObjectType, normalizedText);
    diagnostics.push(
      diagnostic(
        "blocked",
        "no-goal-template-recognized",
        "No supported goal was recognized",
        suggestions.length
          ? `Try a more specific phrase. Closest matches: ${suggestions.map((entry) => entry.label).join(", ")}.`
          : "Use a supported goal phrase or pick a goal card directly.",
        suggestions.length
          ? ["Try the closest suggested goal, or select a goal card directly."]
          : [],
      ),
    );
  } else if (!templateChoice.match && currentGoalTemplateId) {
    diagnostics.push(
      diagnostic(
        "info",
        "used-current-template",
        "Kept the current goal template",
        `Applied the recognized modifiers to the current ${getGoalTemplate(normalizedObjectType, currentGoalTemplateId)?.label || "goal"} template.`,
      ),
    );
  }

  const templateLabel = selectedGoalTemplateId
    ? getGoalTemplate(normalizedObjectType, selectedGoalTemplateId)?.label || ""
    : "";

  const exactMatches = matches.filter((entry) => entry.matchType === "exact").length;
  const fuzzyMatches = matches.filter((entry) => entry.matchType === "fuzzy").length;
  const confidence = diagnostics.some((entry) => entry.severity === "blocked")
    ? "low"
    : fuzzyMatches > 0
      ? "medium"
      : exactMatches > 0
        ? "high"
        : "low";

  const result = {
    objectType: normalizedObjectType,
    sourceText: rawText,
    normalizedText,
    selectedGoalTemplateId,
    templateLabel,
    goalDraft,
    matchedAliases: matches.map((entry) => ({
      kind: entry.kind,
      value: entry.value,
      role: entry.role || "",
      label: entry.label,
      phrase: entry.phrase,
      matchType: entry.matchType,
      score: entry.score,
    })),
    diagnostics: sortDiagnostics(diagnostics),
    confidence,
    summary: "",
  };
  result.summary = buildInterpretationSummary(result);
  return result;
}
