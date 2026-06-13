import { confirmDestructiveAction } from "../destructiveActionDialog.js";
import {
  applyPlanetaryBodyVisualPatch,
  findPlanetaryBody,
  loadWorld,
  resetPlanetaryBodyVisualOverrides,
} from "../store.js";
import { buildPlanetaryVisualControlManifest } from "../planetaryVisual/controlManifest.js";
import { openPlanetaryVisualEditor } from "../planetaryVisual/editorDom.js";
import {
  VISUALIZER_APPEARANCE_ACTION_EDIT,
  VISUALIZER_APPEARANCE_ACTION_RESET,
} from "./focusSummary.js";

function findFocusedVisualBody(snapshot, kind, id) {
  if (kind === "planet") {
    return (snapshot?.planetNodes || []).find((entry) => entry?.id === id) || null;
  }
  if (kind === "gasGiant") {
    return (snapshot?.gasGiants || []).find((entry) => entry?.id === id) || null;
  }
  return null;
}

function bodySelectorValue(kind, id) {
  const bodyId = String(id || "").trim();
  if (!bodyId) return "";
  return kind === "gasGiant" ? `gasGiant:${bodyId}` : `planet:${bodyId}`;
}

function resolveStoredBody(world, kind, node) {
  const selector = bodySelectorValue(kind, node?.id);
  return (
    (selector ? findPlanetaryBody(world, selector) : null) ||
    (node?.id ? findPlanetaryBody(world, node.id) : null) ||
    null
  );
}

function renderFamilyFor(kind, node) {
  if (kind === "gasGiant") return "gas";
  return node?.renderFamily === "volatile" ? "volatile" : "rocky";
}

function renderModelFor(renderFamily, node, classification) {
  if (renderFamily !== "gas") return "";
  if (node?.renderModel) return String(node.renderModel);
  return classification?.family === "brownDwarf" ? "brownDwarfStar" : "gasGiant";
}

function fallbackClassification(kind, renderFamily, node) {
  if (
    kind === "gasGiant" &&
    (node?.companionClass === "brownDwarf" || node?.regime === "brownDwarf")
  ) {
    return {
      family: "brownDwarf",
      solverFamily: "brownDwarf",
      displayLabel: node?.classLabel || "Brown dwarf",
      surfaceApplicability: "none",
    };
  }
  if (renderFamily === "gas") {
    return {
      family: "gasGiant",
      solverFamily: "gasGiant",
      displayLabel: node?.classLabel || "Gas giant",
      surfaceApplicability: "none",
    };
  }
  if (renderFamily === "volatile") {
    return {
      family: "miniNeptune",
      solverFamily: "volatile",
      displayLabel: node?.classLabel || "Volatile body",
      surfaceApplicability: "none",
    };
  }
  return {
    family: "rocky",
    solverFamily: "rocky",
    displayLabel: node?.classLabel || "Rocky planet",
    surfaceApplicability: "full",
  };
}

function classificationFor(kind, renderFamily, node, storedBody) {
  const classification = node?.classification || storedBody?.classification || null;
  if (classification && typeof classification === "object") return classification;
  return fallbackClassification(kind, renderFamily, node);
}

function ringStateFor(node) {
  if (node?.ringState && typeof node.ringState === "object") return node.ringState;
  const ringAppearance = node?.ringAppearance || node?.visualDescriptor?.ringAppearance || null;
  const effectiveEnabled =
    typeof ringAppearance?.enabled === "boolean" ? ringAppearance.enabled : !!node?.rings;
  return {
    ringMode: node?.ringMode || "auto",
    effectiveEnabled,
  };
}

function ringWarningFor(renderModel, manifest) {
  if (renderModel === "brownDwarfStar") return "Brown dwarf visuals do not expose ring controls.";
  if (!manifest?.context?.ringCapable) return "";
  return "Ring controls are display overrides; auto science remains the baseline.";
}

function previewModelFor(kind, renderFamily, renderModel, node) {
  const ringAppearance = node?.ringAppearance || node?.visualDescriptor?.ringAppearance || null;
  if (renderFamily === "rocky") {
    return {
      bodyType: "rocky",
      name: node?.name || "Rocky world",
      recipeId: node?.recipeId || node?.visualProfile?.recipeId || "",
      inputs: node?.planetCalc?.inputs || {},
      derived: node?.planetCalc?.derived || {},
      visualProfile: node?.visualProfile || node?.visualDescriptor?.visualProfile || null,
      ringAppearance,
      rotationPeriodHours: Number(node?.rotationPeriodHours) || 24,
      axialTiltDeg: Number(node?.axialTiltDeg) || 0,
      visualDescriptor: node?.visualDescriptor || null,
      visualOverrideSignature: node?.visualOverrideSignature || "",
      visualRenderSignature: node?.visualRenderSignature || "",
    };
  }
  return {
    bodyType: "gasGiant",
    name: node?.name || (kind === "gasGiant" ? "Gas giant" : "Volatile body"),
    styleId: node?.visualDescriptor?.styleId || node?.style || "jupiter",
    gasCalc: node?.gasCalc || node?.unifiedBodyCalc || node?.planetCalc || null,
    gasProfile: node?.gasProfile || node?.visualDescriptor?.gasProfile || null,
    ringAppearance,
    ringStyleId: ringAppearance?.ringStyleId,
    ringMode: node?.ringMode || "auto",
    renderModel,
    showRings:
      typeof ringAppearance?.enabled === "boolean" ? ringAppearance.enabled : !!node?.rings,
    rotationPeriodHours: Number(node?.rotationPeriodHours) || 10,
    axialTiltDeg: Number(node?.axialTiltDeg) || 0,
    visualDescriptor: node?.visualDescriptor || null,
    visualOverrideSignature: node?.visualOverrideSignature || "",
    visualRenderSignature: node?.visualRenderSignature || "",
  };
}

function solvedBodyFor(renderFamily, node) {
  if (renderFamily === "gas") return node?.gasCalc || null;
  return node?.unifiedBodyCalc || node?.planetCalc || null;
}

export function buildVisualizerVisualEditorContext({
  world = loadWorld(),
  snapshot,
  kind,
  id,
} = {}) {
  const node = findFocusedVisualBody(snapshot, kind, id);
  if (!node) return null;
  const storedBody = resolveStoredBody(world, kind, node);
  const renderFamily = renderFamilyFor(kind, node);
  const classification = classificationFor(kind, renderFamily, node, storedBody);
  const renderModel = renderModelFor(renderFamily, node, classification);
  const editorBody = {
    ...(storedBody || {}),
    id: storedBody?.id || node.id,
    name: storedBody?.name || node.name || node.id,
    appearance: storedBody?.appearance || null,
    renderFamily,
    renderModel,
    visualSubtypeKey: node.visualSubtypeKey || storedBody?.visualSubtypeKey || "",
    ringAppearance: node.ringAppearance || node.visualDescriptor?.ringAppearance || null,
  };
  const manifest = buildPlanetaryVisualControlManifest({
    body: editorBody,
    classification,
    renderFamily,
    renderModel,
    ringCapable: renderModel !== "brownDwarfStar",
  });
  const ringAppearance = node.ringAppearance || node.visualDescriptor?.ringAppearance || null;
  const styleId = node.visualDescriptor?.styleId || node.style || "";
  const baseDescriptorInput = {
    body: editorBody,
    solvedBody: solvedBodyFor(renderFamily, node),
    renderFamily,
    renderModel,
    visualProfile: node.visualProfile || node.visualDescriptor?.visualProfile || null,
    gasProfile: node.gasProfile || node.visualDescriptor?.gasProfile || null,
    ringAppearance,
    baseRecipeId: node.recipeId || node.visualProfile?.recipeId || "",
    styleId,
    manifest,
  };
  return {
    body: editorBody,
    bodyId: editorBody.id,
    bodyName: editorBody.name,
    classification,
    classificationLabel: classification?.displayLabel || node.classLabel || "Planetary body",
    subtypeSummary: node.subtypeSummary || null,
    subtypeLabels: node.subtypeLabels || [],
    manifest,
    ringState: ringStateFor(node),
    ringWarning: ringWarningFor(renderModel, manifest),
    previewContext: {
      body: editorBody,
      solvedBody: baseDescriptorInput.solvedBody,
      manifest,
      previewModel: previewModelFor(kind, renderFamily, renderModel, node),
      baseDescriptorInput,
    },
  };
}

function captureViewState(state) {
  return {
    activeHostFrameId: state?.activeHostFrameId ?? null,
    focusTargetKind: state?.focusTargetKind ?? null,
    focusTargetId: state?.focusTargetId ?? null,
    focusZoomTarget: state?.focusZoomTarget ?? null,
    zoom: state?.zoom,
    zoomTarget: state?.zoomTarget,
    panX: state?.panX,
    panY: state?.panY,
    panVelX: state?.panVelX,
    panVelY: state?.panVelY,
    yaw: state?.yaw,
    yawVel: state?.yawVel,
    pitch: state?.pitch,
    pitchVel: state?.pitchVel,
    resetting: state?.resetting,
    resetTargets: state?.resetTargets,
  };
}

function restoreViewState(state, saved) {
  if (!state || !saved) return;
  for (const [key, value] of Object.entries(saved)) {
    if (value !== undefined) state[key] = value;
  }
}

function refreshVisualizer({
  state,
  savedView,
  invalidateSnapshot,
  getSnapshot,
  draw,
  startCameraLoop,
}) {
  restoreViewState(state, savedView);
  invalidateSnapshot?.({ disposeBodyMeshes: true });
  const snapshot = getSnapshot?.({ force: true }) || null;
  restoreViewState(state, savedView);
  draw?.(snapshot);
  startCameraLoop?.();
  return snapshot;
}

function contextFromCurrentFocus({ state, getSnapshot }) {
  const snapshot = getSnapshot?.() || null;
  return buildVisualizerVisualEditorContext({
    world: loadWorld(),
    snapshot,
    kind: state?.focusTargetKind,
    id: state?.focusTargetId,
  });
}

export function openFocusedVisualizerAppearanceEditor(options = {}) {
  const context = contextFromCurrentFocus(options);
  if (!context) return null;
  const savedView = captureViewState(options.state);
  return openPlanetaryVisualEditor({
    ...context,
    onCancel() {
      restoreViewState(options.state, savedView);
      options.draw?.(options.getSnapshot?.());
    },
    onSave(patch) {
      applyPlanetaryBodyVisualPatch(context.bodyId, patch);
      refreshVisualizer({ ...options, savedView });
    },
  });
}

export async function resetFocusedVisualizerAppearance(options = {}) {
  const context = contextFromCurrentFocus(options);
  if (!context) return false;
  const confirmed = await confirmDestructiveAction({
    title: "Reset visual appearance?",
    description: `Reset ${context.bodyName} to the auto-generated appearance.`,
    consequences: [
      "Saved visual overrides for this body will be removed.",
      "The visualizer will stay focused on the current body.",
    ],
    confirmLabel: "Reset to auto",
  });
  if (!confirmed) return false;
  const savedView = captureViewState(options.state);
  resetPlanetaryBodyVisualOverrides(context.bodyId, "all");
  refreshVisualizer({ ...options, savedView });
  return true;
}

export function handleVisualizerAppearanceAction(options = {}) {
  if (options.actionId === VISUALIZER_APPEARANCE_ACTION_EDIT) {
    return openFocusedVisualizerAppearanceEditor(options);
  }
  if (options.actionId === VISUALIZER_APPEARANCE_ACTION_RESET) {
    return resetFocusedVisualizerAppearance(options);
  }
  return null;
}
