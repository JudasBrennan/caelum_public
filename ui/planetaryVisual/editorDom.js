import { createElement, replaceChildren, replaceSelectOptions } from "../domHelpers.js";
import {
  applyPlanetaryVisualEditorPatch,
  buildPlanetaryVisualEditorSavePatch,
  createPlanetaryVisualEditorState,
  isPlanetaryVisualEditorDirty,
  mergePlanetaryVisualEditorOverrides,
  resetPlanetaryVisualEditorDraft,
  resetPlanetaryVisualEditorSection,
  setPlanetaryVisualEditorCompareMode,
  setPlanetaryVisualEditorControlValue,
  setPlanetaryVisualEditorLockedField,
  setPlanetaryVisualEditorMode,
  summarizePlanetaryVisualEditorState,
} from "./editorState.js";
import {
  createPlanetaryVisualEditorControls,
  listPlanetaryVisualCompareOptions,
  listPlanetaryVisualModeOptions,
} from "./editorControls.js";
import {
  createPlanetaryVisualEditorPreview,
  resolvePlanetaryVisualEditorAutoSeed,
} from "./editorPreview.js";
import { buildPlanetaryVisualPresetPatch } from "./presets.js";
import { randomizePlanetaryVisualOverrides, randomizePlanetaryVisualSection } from "./randomize.js";

function button(label, className, attrs = {}) {
  return createElement("button", {
    className,
    attrs: { type: "button", ...attrs },
    text: label,
  });
}

function createModeSelect(state) {
  const select = createElement("select", {
    className: "planetary-visual-editor__mode-select",
    attrs: { "aria-label": "Visual mode" },
  });
  replaceSelectOptions(select, listPlanetaryVisualModeOptions(state.draft.visualMode));
  return select;
}

function createCompareButtons(state) {
  return createElement(
    "div",
    {
      className: "planetary-visual-editor__compare",
      attrs: { role: "group", "aria-label": "Compare visual preview" },
    },
    listPlanetaryVisualCompareOptions(state.compareMode).map((option) =>
      button(option.label, "planetary-visual-editor__compare-btn", {
        "data-compare-mode": option.value,
        "aria-pressed": option.selected ? "true" : "false",
      }),
    ),
  );
}

function renderSummary(summary) {
  return createElement("div", { className: "planetary-visual-editor__summary" }, [
    createElement("div", {
      className: "planetary-visual-editor__eyebrow",
      text: summary.classificationLabel,
    }),
    createElement("h2", {
      className: "planetary-visual-editor__title",
      attrs: { id: "planetaryVisualEditorTitle" },
      text: summary.bodyName,
    }),
    createElement("div", {
      className: "planetary-visual-editor__meta",
      text: summary.subtypeText || "No exotic subtype selected",
    }),
  ]);
}

function setStatus(statusEl, state) {
  const summary = summarizePlanetaryVisualEditorState(state);
  statusEl.textContent = `${summary.overrideCount} active override${
    summary.overrideCount === 1 ? "" : "s"
  } | ${summary.visualMode} mode${summary.compareMode === "auto" ? " | comparing auto" : ""}`;
  statusEl.dataset.dirty = summary.dirty ? "true" : "false";
}

function syncControls(root, state) {
  const modeSelect = root.querySelector(".planetary-visual-editor__mode-select");
  if (modeSelect) modeSelect.value = state.draft.visualMode;
  root.querySelectorAll("[data-compare-mode]").forEach((node) => {
    node.setAttribute(
      "aria-pressed",
      node.getAttribute("data-compare-mode") === state.compareMode ? "true" : "false",
    );
  });
  const saveBtn = root.querySelector("[data-visual-editor-save]");
  if (saveBtn) saveBtn.disabled = !isPlanetaryVisualEditorDirty(state);
}

export function openPlanetaryVisualEditor(options = {}) {
  const previewContext = {
    ...(options.previewContext || options),
    body: options.previewContext?.body || options.body,
    solvedBody: options.previewContext?.solvedBody || options.solvedBody,
    manifest: options.previewContext?.manifest || options.manifest,
  };
  const autoSeed = options.autoSeed || resolvePlanetaryVisualEditorAutoSeed(previewContext);
  let state = createPlanetaryVisualEditorState({ ...options, autoSeed });
  let randomizeCounter = 0;
  const overlay = createElement("div", {
    className: "planetary-visual-editor-overlay",
    attrs: { "data-planetary-visual-editor": "true" },
  });
  const status = createElement("div", {
    className: "planetary-visual-editor__status",
    attrs: { role: "status", "aria-live": "polite" },
  });
  const canvas = createElement("canvas", {
    className: "planetary-visual-editor__preview-canvas",
    attrs: {
      width: "320",
      height: "320",
      "aria-label": "Planetary visual preview",
    },
  });
  const modeSelect = createModeSelect(state);
  const compareButtons = createCompareButtons(state);
  const controlsRoot = createElement("div", {
    className: "planetary-visual-editor__controls-root",
  });
  const resetBtn = button("Reset all", "small", { "data-visual-editor-reset": "true" });
  const cancelBtn = button("Cancel", "small", { "data-visual-editor-cancel": "true" });
  const saveBtn = button("Save", "small primary", { "data-visual-editor-save": "true" });
  const closeBtn = button("Close", "small planetary-visual-editor__close", {
    "aria-label": "Close visual editor",
  });

  const dialog = createElement(
    "div",
    {
      className: "planetary-visual-editor",
      attrs: {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "planetaryVisualEditorTitle",
      },
    },
    [
      createElement("div", { className: "planetary-visual-editor__header" }, [
        renderSummary(summarizePlanetaryVisualEditorState(state)),
        closeBtn,
      ]),
      createElement("div", { className: "planetary-visual-editor__body" }, [
        createElement("div", { className: "planetary-visual-editor__preview" }, [canvas, status]),
        createElement("div", { className: "planetary-visual-editor__panel" }, [
          createElement("label", { className: "planetary-visual-editor__field" }, [
            createElement("span", { text: "Mode" }),
            modeSelect,
          ]),
          createElement("div", { className: "planetary-visual-editor__field" }, [
            createElement("span", { text: "Compare" }),
            compareButtons,
          ]),
          controlsRoot,
        ]),
      ]),
      createElement("div", { className: "planetary-visual-editor__actions" }, [
        resetBtn,
        createElement("span", { className: "planetary-visual-editor__action-spacer" }),
        cancelBtn,
        saveBtn,
      ]),
    ],
  );

  overlay.appendChild(dialog);
  const mount = options.mount || document.body;
  mount.appendChild(overlay);

  const preview =
    options.preview ||
    createPlanetaryVisualEditorPreview(canvas, previewContext, {
      controller: options.previewController,
      createController: options.createPreviewController,
    });

  function presetSource() {
    return (
      options.presetSource || {
        body: options.body,
        classification: options.classification,
        renderFamily: options.previewContext?.baseDescriptorInput?.renderFamily,
      }
    );
  }

  function randomizeSource() {
    return {
      ...(presetSource() || {}),
      id: state.bodyId,
      name: state.bodyName,
      appearance: {
        visualMode: state.draft?.visualMode,
        visualOverrides: state.draft?.visualOverrides,
      },
    };
  }

  function renderControls() {
    replaceChildren(
      controlsRoot,
      createPlanetaryVisualEditorControls(state, {
        ...options,
        presetSource: presetSource(),
        ringWarning: options.ringWarning,
        ringState: options.ringState,
      }),
    );
  }

  function renderPreview() {
    setStatus(status, state);
    syncControls(dialog, state);
    renderControls();
    const model = preview.update?.(state) || null;
    options.onPreview?.(model, state);
    return model;
  }

  function nextRandomSeed(scope) {
    randomizeCounter += 1;
    return `${state.bodyId || "body"}:${scope || "all"}:${randomizeCounter}`;
  }

  function readControlValue(target) {
    const type = target.dataset.controlType || target.type || "text";
    if (type === "boolean" || target.type === "checkbox") return target.checked === true;
    if (
      type === "range" ||
      type === "number" ||
      target.type === "range" ||
      target.type === "number"
    ) {
      const value = Number(target.value);
      return Number.isFinite(value) ? value : undefined;
    }
    return String(target.value || "").trim() || undefined;
  }

  function findColorInput(path) {
    return Array.from(controlsRoot.querySelectorAll("[data-control-type='color']")).find(
      (node) => node.dataset.controlPath === path,
    );
  }

  function isDeferredColorInput(target) {
    return target?.dataset?.controlType === "color";
  }

  function updateState(nextState) {
    state = nextState;
    return renderPreview();
  }

  function applyPreset(presetId) {
    const id = String(presetId || "").trim();
    if (!id) return;
    const patch = buildPlanetaryVisualPresetPatch(id, presetSource());
    if (!patch) return;
    updateState(applyPlanetaryVisualEditorPatch(state, patch));
  }

  function randomizeAllControls() {
    const overrides = randomizePlanetaryVisualOverrides(randomizeSource(), {
      manifest: state.manifest,
      seed: nextRandomSeed("all"),
      lockedFields: state.draft?.visualOverrides?.lockedFields,
    });
    updateState(mergePlanetaryVisualEditorOverrides(state, overrides));
  }

  function randomizeSection(sectionId) {
    const overrides = randomizePlanetaryVisualSection(randomizeSource(), sectionId, {
      manifest: state.manifest,
      seed: nextRandomSeed(sectionId),
      lockedFields: state.draft?.visualOverrides?.lockedFields,
    });
    updateState(mergePlanetaryVisualEditorOverrides(state, overrides));
  }

  function close(kind = "cancel") {
    preview.dispose?.();
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown);
    if (kind === "cancel") options.onCancel?.(state);
  }

  function save() {
    const patch = buildPlanetaryVisualEditorSavePatch(state);
    options.onSave?.(patch, state);
    close("save");
  }

  function onKeyDown(event) {
    if (event.key === "Escape") close();
  }

  modeSelect.addEventListener("change", () => {
    state = setPlanetaryVisualEditorMode(state, modeSelect.value);
    renderPreview();
  });
  compareButtons.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-compare-mode]");
    if (!target) return;
    state = setPlanetaryVisualEditorCompareMode(state, target.getAttribute("data-compare-mode"));
    renderPreview();
  });
  resetBtn.addEventListener("click", () => {
    updateState(resetPlanetaryVisualEditorDraft(state));
  });
  controlsRoot.addEventListener("input", (event) => {
    const target = event.target;
    if (!target?.dataset?.controlPath) return;
    if (isDeferredColorInput(target)) return;
    updateState(
      setPlanetaryVisualEditorControlValue(
        state,
        target.dataset.controlPath,
        readControlValue(target),
      ),
    );
  });
  controlsRoot.addEventListener("change", (event) => {
    const target = event.target;
    if (target?.dataset?.presetSelect) {
      applyPreset(target.value);
      return;
    }
    if (target?.dataset?.lockPath) {
      updateState(
        setPlanetaryVisualEditorLockedField(state, target.dataset.lockPath, target.checked),
      );
      return;
    }
    if (!target?.dataset?.controlPath) return;
    if (isDeferredColorInput(target)) return;
    updateState(
      setPlanetaryVisualEditorControlValue(
        state,
        target.dataset.controlPath,
        readControlValue(target),
      ),
    );
  });
  controlsRoot.addEventListener("click", (event) => {
    const colorCommit = event.target.closest?.("[data-color-commit-path]");
    if (colorCommit) {
      const path = colorCommit.dataset.colorCommitPath;
      const colorInput = findColorInput(path);
      if (!colorInput) return;
      updateState(setPlanetaryVisualEditorControlValue(state, path, readControlValue(colorInput)));
      return;
    }
    const swatch = event.target.closest?.("[data-swatch-value]");
    if (swatch) {
      updateState(
        setPlanetaryVisualEditorControlValue(
          state,
          swatch.dataset.controlPath,
          swatch.dataset.swatchValue,
        ),
      );
      return;
    }
    const resetSectionBtn = event.target.closest?.("[data-reset-section]");
    if (resetSectionBtn) {
      updateState(resetPlanetaryVisualEditorSection(state, resetSectionBtn.dataset.resetSection));
      return;
    }
    const randomizeSectionBtn = event.target.closest?.("[data-randomize-section]");
    if (randomizeSectionBtn) {
      randomizeSection(randomizeSectionBtn.dataset.randomizeSection);
      return;
    }
    const randomizeAllBtn = event.target.closest?.("[data-randomize-all]");
    if (randomizeAllBtn) randomizeAllControls();
  });
  cancelBtn.addEventListener("click", () => close());
  closeBtn.addEventListener("click", () => close());
  saveBtn.addEventListener("click", () => save());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener("keydown", onKeyDown);

  renderPreview();
  return {
    overlay,
    getState: () => state,
    setState(nextState) {
      return updateState(nextState);
    },
    save,
    cancel: () => close(),
  };
}
