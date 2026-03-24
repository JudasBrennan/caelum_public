import { createElement } from "./domHelpers.js";
import { createGuidedCreationOverlay } from "./guidedCreation/components/overlay.js";
import { createBlockingOverlayController } from "./overlayController.js";

let activeDialogState = null;

export function confirmDestructiveAction({
  title = "Confirm deletion",
  description = "This action cannot be undone.",
  consequences = [],
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
} = {}) {
  if (typeof document === "undefined" || !document.body) {
    if (typeof window?.confirm === "function") {
      const consequenceText =
        Array.isArray(consequences) && consequences.length
          ? `\n\nConsequences:\n- ${consequences.join("\n- ")}`
          : "";
      return Promise.resolve(window.confirm(`${title}\n\n${description}${consequenceText}`));
    }
    return Promise.resolve(false);
  }

  if (activeDialogState?.close) {
    activeDialogState.close(false);
  }

  return new Promise((resolve) => {
    const { overlayEl, dialogEl, contentEl, closeButtonEl } = createGuidedCreationOverlay({
      overlayClassName: "destructive-overlay",
      dialogClassName: "destructive-dialog",
      closeLabel: cancelLabel,
    });

    const titleId = `destructiveTitle-${Math.random().toString(36).slice(2, 8)}`;
    const descriptionId = `destructiveDescription-${Math.random().toString(36).slice(2, 8)}`;
    const cancelButton = createElement("button", {
      className: "small",
      attrs: { type: "button" },
      dataset: { destructiveAction: "cancel" },
      text: cancelLabel,
    });
    const confirmButton = createElement("button", {
      className: "small danger",
      attrs: { type: "button" },
      dataset: { destructiveAction: "confirm" },
      text: confirmLabel,
    });

    const consequenceList = Array.isArray(consequences)
      ? consequences.map((item) =>
          createElement("li", {
            className: "destructive-dialog__consequence",
            dataset: { destructiveConsequence: "true" },
            text: item,
          }),
        )
      : [];

    // Destructive confirms use a single explicit cancel action in the footer.
    closeButtonEl.remove();

    dialogEl.setAttribute("role", "alertdialog");
    dialogEl.setAttribute("aria-modal", "true");
    dialogEl.setAttribute("aria-labelledby", titleId);
    dialogEl.setAttribute("aria-describedby", descriptionId);
    overlayEl.dataset.destructiveDialog = "true";
    overlayEl.dataset.helpPattern = "destructive-confirmation";
    overlayEl.dataset.overlayMode = "blocking";
    overlayEl.dataset.overlayController = "shared";

    contentEl.append(
      createElement("div", { className: "panel destructive-dialog__panel" }, [
        createElement("div", { className: "panel__header" }, [
          createElement("h2", { attrs: { id: titleId }, text: title }),
        ]),
        createElement("div", { className: "panel__body destructive-dialog__body" }, [
          createElement("p", {
            className: "destructive-dialog__description",
            attrs: { id: descriptionId },
            text: description,
          }),
          consequenceList.length
            ? createElement("div", { className: "destructive-dialog__consequences" }, [
                createElement("div", {
                  className: "destructive-dialog__section-title",
                  text: "Consequences",
                }),
                createElement("ul", { className: "destructive-dialog__list" }, consequenceList),
              ])
            : null,
          createElement("div", { className: "button-row destructive-dialog__actions" }, [
            cancelButton,
            confirmButton,
          ]),
        ]),
      ]),
    );

    let settled = false;
    const overlayController = createBlockingOverlayController({
      overlayEl,
      focusRoot: dialogEl,
      initialFocus: () => cancelButton,
      dismissTarget: overlayEl,
      onDismiss: () => cleanup(false),
    });

    function cleanup(result) {
      if (settled) return;
      settled = true;
      if (!activeDialogState || activeDialogState.overlayEl !== overlayEl) return;
      cancelButton.removeEventListener("click", onCancel);
      confirmButton.removeEventListener("click", onConfirm);
      overlayController.deactivate({ restoreFocus: true });
      overlayEl.remove();
      activeDialogState = null;
      resolve(result);
    }

    function onCancel(event) {
      event?.preventDefault?.();
      cleanup(false);
    }

    function onConfirm(event) {
      event?.preventDefault?.();
      cleanup(true);
    }

    cancelButton.addEventListener("click", onCancel);
    confirmButton.addEventListener("click", onConfirm);

    activeDialogState = {
      overlayEl,
      close: cleanup,
    };

    document.body.appendChild(overlayEl);
    overlayController.activate();
  });
}
