import { appendChildren, createElement } from "../domHelpers.js";

export function createStarOutputStrip({
  buildPairEditorLabel,
  buildStarEditorLabel,
  buildTopologyMapStarMeta,
  formatNumber,
  getEditorTargetKind,
  getEditorUiState,
  getHostClassValue,
  getStarDraftState,
  listAvailableStarEditorIds,
  normalizeSelectedEditorTargetId,
  setSelectedEditorTarget,
  solveStarSummaryModel,
  render,
} = {}) {
  function buildOutputStarPreviewDescriptors(draftState = {}) {
    return listAvailableStarEditorIds(draftState).map((starId) => {
      const starDraft = getStarDraftState(starId, draftState);
      const model = solveStarSummaryModel(starId, draftState);
      const meta = buildTopologyMapStarMeta(starId, draftState);
      return {
        id: starId,
        starDraft,
        model,
        meta,
      };
    });
  }

  function buildOutputStarStripCopy(focusedStarId, draftState = {}) {
    const editorUiState = getEditorUiState();
    const focusedLabel = buildStarEditorLabel(focusedStarId, draftState);
    const starCount = listAvailableStarEditorIds(draftState).length;
    const selectedTargetId = normalizeSelectedEditorTargetId(
      editorUiState.selectedEditorTargetId,
      draftState,
      {
        preferredMode: editorUiState.selectedEditorMode,
        rememberedStarEditorId: editorUiState.rememberedStarEditorId,
        rememberedPairEditorId: editorUiState.rememberedPairEditorId,
      },
    );
    if (getEditorTargetKind(selectedTargetId) === "pair") {
      return `Showing outputs for ${focusedLabel} while ${buildPairEditorLabel(selectedTargetId, draftState)} is selected in the inspector. Click a star card to switch the main preview and focus that star.`;
    }
    if (starCount <= 1) {
      return `Showing outputs for ${focusedLabel}. This system currently has one star.`;
    }
    return `Showing outputs for ${focusedLabel}. Click another star to switch the main preview and derived outputs.`;
  }

  function createOutputStarPreviewCard(descriptor, isActive) {
    const buttonEl = createElement("button", {
      className: `star-output-strip__card${isActive ? " is-active" : ""}`,
      attrs: {
        type: "button",
        "aria-pressed": isActive ? "true" : "false",
        "aria-label": `Show outputs for ${descriptor.meta.accessibleLabel}`,
      },
      dataset: {
        outputStarId: descriptor.id,
      },
    });
    const swatchEl = createElement("div", {
      className: "star-output-strip__swatch",
      attrs: {
        "aria-hidden": "true",
      },
    });
    swatchEl.style.setProperty("--star-preview-hex", descriptor.model?.starColourHex || "#fff4dc");
    appendChildren(buttonEl, [
      createElement("div", { className: "star-output-strip__card-top" }, [
        createElement("div", {
          className: "star-output-strip__card-label",
          text: `Star ${descriptor.meta.title}`,
        }),
        isActive
          ? createElement("span", {
              className: "star-output-strip__card-badge",
              text: "Showing",
            })
          : null,
      ]),
      swatchEl,
      createElement("div", {
        className: "star-output-strip__card-name",
        text: descriptor.starDraft.name,
      }),
      createElement("div", {
        className: "star-output-strip__card-meta",
        text:
          `${getHostClassValue(descriptor.model)} · ` +
          `${formatNumber(descriptor.starDraft.massMsol, 4)} Msol`,
      }),
    ]);
    buttonEl.addEventListener("click", () => {
      const editorUiState = getEditorUiState();
      if (
        editorUiState.selectedEditorMode === "star" &&
        editorUiState.selectedEditorTargetId === descriptor.id
      ) {
        return;
      }
      setSelectedEditorTarget(descriptor.id);
      render();
    });
    return buttonEl;
  }

  function renderOutputStarStrip(summarySectionEl, focusedStarId, draftState = {}) {
    if (!summarySectionEl) return;
    summarySectionEl.querySelector("#starOutputStrip")?.remove();
    const descriptors = buildOutputStarPreviewDescriptors(draftState);
    if (!descriptors.length) return;
    const stripEl = createElement("div", {
      className: "star-output-strip",
      attrs: { id: "starOutputStrip" },
    });
    appendChildren(stripEl, [
      createElement("div", { className: "star-output-strip__header" }, [
        createElement("div", { className: "star-output-strip__title", text: "System Stars" }),
        createElement("div", {
          attrs: {
            id: "starOutputStripCopy",
            role: "status",
            "aria-live": "polite",
            "aria-atomic": "true",
          },
          className: "star-output-strip__copy",
          text: buildOutputStarStripCopy(focusedStarId, draftState),
        }),
      ]),
      createElement(
        "div",
        { className: "star-output-strip__grid" },
        descriptors.map((descriptor) =>
          createOutputStarPreviewCard(descriptor, descriptor.id === focusedStarId, draftState),
        ),
      ),
    ]);
    summarySectionEl.appendChild(stripEl);
  }

  return {
    buildOutputStarPreviewDescriptors,
    buildOutputStarStripCopy,
    createOutputStarPreviewCard,
    renderOutputStarStrip,
  };
}
