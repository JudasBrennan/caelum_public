import {
  buildGuidedGoalQuestionValues,
  buildGuidedGoalStatus,
  buildGuidedGoalTextAssist,
  setGuidedGoalDraftValue,
} from "../guidedCreation/goalState.js";

const STAR_GOAL_FIELD_MAP = Object.freeze({
  system_architecture: "systemArchitecture",
});

export function buildStarGoalQuestionValues(flowState, questions = []) {
  return buildGuidedGoalQuestionValues(flowState, questions, {
    questionFieldMap: STAR_GOAL_FIELD_MAP,
  });
}

export function setStarGoalDraftValue(controllerRef, flowState, questionId, value) {
  return setGuidedGoalDraftValue(controllerRef, flowState, questionId, value, {
    questionFieldMap: STAR_GOAL_FIELD_MAP,
  });
}

export function buildStarGoalTextAssist(resolveController, flowState) {
  return buildGuidedGoalTextAssist(resolveController, flowState, {
    objectType: "star",
    objectLabel: "star",
  });
}

export function buildStarGoalStatus(flowState) {
  return buildGuidedGoalStatus(flowState, {
    readyDetail: "The structured goal is valid. Run Search to try seeded stellar candidates.",
    searchingDetail: "Trying seeded stellar candidates against the current star context.",
  });
}
