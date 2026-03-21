import { createElement } from "../../domHelpers.js";
import { attachTooltips } from "../../tooltip.js";

export function createGuidedCreationOverlay({
  overlayClassName = "",
  dialogClassName = "",
  closeButtonClassName = "",
  contentClassName = "",
  closeLabel = "Close guided creation",
} = {}) {
  const contentEl = createElement("div", {
    className: `guided-overlay__content ${contentClassName || ""}`.trim(),
  });
  const closeButtonEl = createElement("button", {
    className: `small guided-overlay__close ${closeButtonClassName || ""}`.trim(),
    attrs: { type: "button", "aria-label": closeLabel },
    text: "Close",
  });
  const dialogEl = createElement(
    "div",
    {
      className: `rp-picker-dialog guided-dialog ${dialogClassName || ""}`.trim(),
    },
    [closeButtonEl, contentEl],
  );
  const overlayEl = createElement(
    "div",
    {
      className: `rp-picker-overlay guided-overlay ${overlayClassName || ""}`.trim(),
    },
    [dialogEl],
  );
  attachTooltips(overlayEl);

  return {
    overlayEl,
    dialogEl,
    contentEl,
    closeButtonEl,
  };
}
