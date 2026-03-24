const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const blockedElementState = new WeakMap();
const activeControllers = [];

function focusNodeLater(node) {
  if (!node || typeof node.focus !== "function") return;
  setTimeout(() => {
    try {
      if (node === document.body || document.contains(node)) {
        node.focus();
      }
    } catch {
      // Ignore focus failures.
    }
  }, 0);
}

function pushController(controller) {
  const index = activeControllers.indexOf(controller);
  if (index >= 0) activeControllers.splice(index, 1);
  activeControllers.push(controller);
}

function popController(controller) {
  const index = activeControllers.indexOf(controller);
  if (index >= 0) activeControllers.splice(index, 1);
}

function isTopController(controller) {
  return activeControllers[activeControllers.length - 1] === controller;
}

function getDefaultBackgroundElements(overlayEl) {
  if (!overlayEl || overlayEl.parentElement !== document.body) return [];
  return Array.from(document.body.children).filter((child) => child !== overlayEl);
}

function normalizeBackgroundElements(overlayEl, backgroundElements) {
  const source = Array.isArray(backgroundElements)
    ? backgroundElements
    : getDefaultBackgroundElements(overlayEl);
  return Array.from(new Set(source.filter(Boolean)));
}

function blockElement(element) {
  if (!element) return;
  const existing = blockedElementState.get(element);
  if (existing) {
    existing.count += 1;
    return;
  }

  const state = {
    count: 1,
    hadAriaHidden: element.hasAttribute("aria-hidden"),
    previousAriaHidden: element.getAttribute("aria-hidden"),
    hadInertAttr: element.hasAttribute("inert"),
    previousInert: "inert" in element ? element.inert : undefined,
  };
  blockedElementState.set(element, state);

  element.setAttribute("aria-hidden", "true");
  element.setAttribute("inert", "");
  if ("inert" in element) {
    element.inert = true;
  }
}

function unblockElement(element) {
  if (!element) return;
  const state = blockedElementState.get(element);
  if (!state) return;

  state.count -= 1;
  if (state.count > 0) return;

  if (state.hadAriaHidden) {
    element.setAttribute("aria-hidden", state.previousAriaHidden || "true");
  } else {
    element.removeAttribute("aria-hidden");
  }

  if (state.hadInertAttr) {
    element.setAttribute("inert", "");
  } else {
    element.removeAttribute("inert");
  }
  if ("inert" in element) {
    element.inert = state.previousInert === true;
  }

  blockedElementState.delete(element);
}

function isDisabled(element) {
  return !!element?.matches?.("[disabled]");
}

function isHidden(element) {
  if (!element) return true;
  if (element.hidden) return true;
  if (element.getAttribute?.("aria-hidden") === "true") return true;
  return false;
}

function getFocusableElements(root) {
  if (!root?.querySelectorAll) return [];
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !isDisabled(element) && !isHidden(element),
  );
}

function ensureFocusableTarget(target, fallbackRoot) {
  if (!target) return null;
  if (target !== fallbackRoot) return target;
  if (typeof target.focus !== "function") return null;
  if (target.matches?.(FOCUSABLE_SELECTOR)) return target;
  if (!target.hasAttribute("tabindex")) {
    target.dataset.overlayTempTabindex = "true";
    target.setAttribute("tabindex", "-1");
  }
  return target;
}

function clearTemporaryTabIndex(target) {
  if (!target?.dataset?.overlayTempTabindex) return;
  target.removeAttribute("tabindex");
  delete target.dataset.overlayTempTabindex;
}

export function createBlockingOverlayController({
  overlayEl,
  focusRoot = overlayEl,
  initialFocus = null,
  backgroundElements = null,
  dismissTarget = null,
  onDismiss = null,
} = {}) {
  const controller = {
    activate,
    deactivate,
    isActive: () => active,
  };

  let active = false;
  let previousActiveElement = null;
  let blockedElements = [];
  let fallbackFocusTarget = null;

  function resolvePreferredFocus() {
    const requestedFocus =
      typeof initialFocus === "function" ? initialFocus() : initialFocus || null;
    const focusableElements = getFocusableElements(focusRoot);
    return ensureFocusableTarget(requestedFocus || focusableElements[0] || focusRoot, focusRoot);
  }

  function focusPreferredTarget() {
    const target = resolvePreferredFocus();
    fallbackFocusTarget = target;
    focusNodeLater(target);
  }

  function redirectFocusIntoRoot(preferLast = false) {
    const focusableElements = getFocusableElements(focusRoot);
    const target = ensureFocusableTarget(
      focusableElements.length
        ? focusableElements[preferLast ? focusableElements.length - 1 : 0]
        : focusRoot,
      focusRoot,
    );
    fallbackFocusTarget = target;
    if (target) target.focus();
  }

  function handleKeyDown(event) {
    if (!active || !isTopController(controller)) return;

    if (event.key === "Escape") {
      if (typeof onDismiss === "function") {
        event.preventDefault();
        event.stopPropagation();
        onDismiss(event);
      }
      return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements(focusRoot);
    if (!focusableElements.length) {
      event.preventDefault();
      redirectFocusIntoRoot(event.shiftKey);
      return;
    }

    const activeElement = document.activeElement;
    if (!focusRoot?.contains?.(activeElement)) {
      event.preventDefault();
      redirectFocusIntoRoot(event.shiftKey);
      return;
    }

    const activeIndex = focusableElements.indexOf(activeElement);
    if (event.shiftKey) {
      if (activeIndex <= 0) {
        event.preventDefault();
        focusableElements[focusableElements.length - 1].focus();
      }
      return;
    }

    if (activeIndex === -1 || activeIndex === focusableElements.length - 1) {
      event.preventDefault();
      focusableElements[0].focus();
    }
  }

  function handleFocusIn(event) {
    if (!active || !isTopController(controller)) return;
    if (focusRoot?.contains?.(event.target)) return;
    focusPreferredTarget();
  }

  function handleDismissClick(event) {
    if (!active || !isTopController(controller)) return;
    if (event.target !== dismissTarget) return;
    if (typeof onDismiss !== "function") return;
    event.preventDefault();
    onDismiss(event);
  }

  function activate() {
    if (active) return;
    active = true;
    previousActiveElement =
      document.activeElement && typeof document.activeElement.focus === "function"
        ? document.activeElement
        : null;
    blockedElements = normalizeBackgroundElements(overlayEl, backgroundElements);
    blockedElements.forEach(blockElement);

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocusIn, true);
    dismissTarget?.addEventListener("click", handleDismissClick);

    pushController(controller);
    focusPreferredTarget();
  }

  function deactivate({ restoreFocus = true } = {}) {
    if (!active) return;
    active = false;
    popController(controller);

    document.removeEventListener("keydown", handleKeyDown, true);
    document.removeEventListener("focusin", handleFocusIn, true);
    dismissTarget?.removeEventListener("click", handleDismissClick);

    blockedElements.forEach(unblockElement);
    blockedElements = [];

    clearTemporaryTabIndex(fallbackFocusTarget);
    fallbackFocusTarget = null;

    const focusTarget = previousActiveElement;
    previousActiveElement = null;
    if (restoreFocus) {
      focusNodeLater(focusTarget);
    }
  }

  return controller;
}
