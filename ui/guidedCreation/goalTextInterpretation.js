import { interpretGoalText } from "./goalTextParser.js";

function cloneGoalDraft(goalDraft = {}) {
  return goalDraft && typeof goalDraft === "object" && !Array.isArray(goalDraft)
    ? { ...goalDraft }
    : {};
}

export function applyGuidedGoalTextInterpretation(
  controllerRef,
  flowState,
  objectType,
  goalText,
) {
  const currentGoalDraft = cloneGoalDraft(flowState?.goalDraft);
  const currentGoalTemplateId = String(
    flowState?.selectedGoalTemplateId || flowState?.selectedArchetypeId || "",
  ).trim();
  const interpretation = interpretGoalText(objectType, goalText, {
    currentGoalTemplateId,
  });

  const interpretedDraft = {
    ...cloneGoalDraft(interpretation.goalDraft),
    goalText: String(goalText || ""),
    goalTextInterpretation: interpretation,
  };

  if (interpretation.selectedGoalTemplateId) {
    controllerRef?.reset({
      objectType,
      uxMode: "guided",
      currentStepId: "type",
      selectedArchetypeId: interpretation.selectedGoalTemplateId,
      selectedGoalTemplateId: interpretation.selectedGoalTemplateId,
      goalDraft: interpretedDraft,
    });
  } else {
    controllerRef?.setGoalDraft({
      ...currentGoalDraft,
      goalText: String(goalText || ""),
      goalTextInterpretation: interpretation,
    });
  }

  return interpretation;
}

export function clearGuidedGoalTextInterpretation(controllerRef, flowState = {}) {
  const currentGoalDraft = cloneGoalDraft(flowState?.goalDraft);
  delete currentGoalDraft.goalText;
  delete currentGoalDraft.goalTextInterpretation;
  controllerRef?.setGoalDraft(currentGoalDraft);
  return currentGoalDraft;
}
