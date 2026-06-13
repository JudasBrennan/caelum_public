import { createCelestialVisualPreviewController } from "../lazyCelestialVisualPreview.js";
import { composeCelestialDescriptor } from "../celestialComposer.js";
import { resolvePlanetaryVisualDescriptor } from "./descriptor.js";
import { getPlanetaryVisualEditorPreviewAppearance } from "./editorState.js";

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value ?? null;
  return JSON.parse(JSON.stringify(value));
}

function buildDescriptorInput(context = {}, appearance) {
  const base = context.baseDescriptorInput || {};
  return {
    ...base,
    body: context.body || base.body,
    solvedBody: context.solvedBody || base.solvedBody,
    manifest: context.manifest || base.manifest,
    visualMode: appearance.visualMode,
    visualOverrides: appearance.visualOverrides,
  };
}

export function resolvePlanetaryVisualEditorDescriptor(context = {}, state) {
  return resolvePlanetaryVisualDescriptor(
    buildDescriptorInput(context, getPlanetaryVisualEditorPreviewAppearance(state)),
  );
}

export function buildPlanetaryVisualEditorPreviewModel(context = {}, state) {
  const basePreviewModel = cloneValue(context.previewModel || {});
  const descriptor = resolvePlanetaryVisualEditorDescriptor(context, state);
  const bodyType =
    basePreviewModel?.bodyType || (descriptor.renderFamily === "rocky" ? "rocky" : "gasGiant");

  if (bodyType === "rocky") {
    return {
      ...basePreviewModel,
      bodyType: "rocky",
      visualProfile: descriptor.visualProfile || basePreviewModel.visualProfile,
      ringAppearance: descriptor.ringAppearance || basePreviewModel.ringAppearance,
      recipeId: descriptor.baseRecipeId || basePreviewModel.recipeId || "",
      visualSubtypeKey: descriptor.visualSubtypeKey || basePreviewModel.visualSubtypeKey || "",
      visualOverrideSignature: descriptor.overrideSignature || "",
      visualRenderSignature: descriptor.renderSignature || "",
      visualDescriptor: descriptor,
    };
  }

  const ringAppearance = descriptor.ringAppearance || basePreviewModel.ringAppearance || null;
  return {
    ...basePreviewModel,
    bodyType: "gasGiant",
    styleId: descriptor.styleId || basePreviewModel.styleId || "jupiter",
    gasProfile: descriptor.gasProfile || basePreviewModel.gasProfile,
    ringAppearance,
    ringStyleId: ringAppearance?.ringStyleId || basePreviewModel.ringStyleId,
    showRings:
      typeof ringAppearance?.enabled === "boolean"
        ? ringAppearance.enabled
        : !!basePreviewModel.showRings,
    visualSubtypeKey: descriptor.visualSubtypeKey || basePreviewModel.visualSubtypeKey || "",
    visualOverrideSignature: descriptor.overrideSignature || "",
    visualRenderSignature: descriptor.renderSignature || "",
    visualDescriptor: descriptor,
  };
}

export function resolvePlanetaryVisualEditorAutoSeed(context = {}) {
  const autoState = {
    draft: {
      visualMode: "auto",
      visualOverrides: null,
    },
    compareMode: "custom",
  };
  const model = buildPlanetaryVisualEditorPreviewModel(context, autoState);
  try {
    return String(composeCelestialDescriptor(model, { lod: "low" })?.seed || "").trim();
  } catch {
    return String(model?.visualDescriptor?.seed || model?.seed || "").trim();
  }
}

export function createPlanetaryVisualEditorPreview(canvas, context = {}, options = {}) {
  const controller =
    options.controller ||
    options.createController?.() ||
    createCelestialVisualPreviewController({ speedDaysPerSec: 0.5 });
  let attached = false;

  return {
    update(state) {
      if (!canvas) return null;
      const model = buildPlanetaryVisualEditorPreviewModel(context, state);
      if (attached && typeof controller.update === "function") {
        controller.update(model);
      } else {
        controller.attach(canvas, model);
        attached = true;
      }
      return model;
    },
    dispose() {
      controller.detach?.();
      controller.dispose?.();
      attached = false;
    },
  };
}
