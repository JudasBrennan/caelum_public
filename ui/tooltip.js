// Lightweight hover tooltips (event-delegated).
// Works for dynamically rendered content (e.g., KPI grids updated via innerHTML).
//
// Usage:
// - Render an icon/span with data-tip="..."
// - Call attachTooltips(root) once for the page root.

import { createElement } from "./domHelpers.js";

let activeEl = null;
let activeBubble = null;
let hideTimer = null;
let positionRafId = 0;
let activeBubbleId = 0;
let isPinned = false;

export function tipIcon(text) {
  if (!text) return "";
  const safe = escapeAttr(text);
  return `<span class="tip-icon" tabindex="0" role="button" aria-label="Show help" aria-expanded="false" data-help-pattern="tooltip" data-tip="${safe}">i</span>`;
}

export function tipAttr(text) {
  if (!text) return "";
  return `data-tip="${escapeAttr(text)}"`;
}

export function tipIconNode(text) {
  if (!text) return null;
  return createElement("span", {
    className: "tip-icon",
    attrs: {
      tabindex: "0",
      role: "button",
      "aria-label": "Show help",
      "aria-expanded": "false",
      "data-help-pattern": "tooltip",
      "data-tip": text,
    },
    text: "i",
  });
}

export function attachTooltips(root) {
  if (!root || root.__tooltipsAttached) return;
  root.__tooltipsAttached = true;

  root.addEventListener("mouseover", (e) => {
    if (isTouchLikeDevice()) return;
    const el = closestTipEl(e.target);
    if (!el) return;
    // Ignore transitions within the same tip element
    if (activeEl === el) return;
    show(el);
  });

  root.addEventListener("mouseout", (e) => {
    const from = closestTipEl(e.target);
    const to = closestTipEl(e.relatedTarget);
    if (from && from !== to) scheduleHide();
  });

  root.addEventListener("focusin", (e) => {
    const el = closestTipEl(e.target);
    if (el) show(el);
  });

  root.addEventListener("focusout", (e) => {
    const from = closestTipEl(e.target);
    const to = closestTipEl(e.relatedTarget);
    if (from && from !== to) scheduleHide();
  });

  root.addEventListener("click", (e) => {
    const el = closestTipEl(e.target);
    if (!isTipIcon(el)) return;
    e.preventDefault();
    e.stopPropagation();
    if (activeEl === el && isPinned) {
      destroy();
      return;
    }
    show(el, { pinned: true });
  });

  root.addEventListener("keydown", (e) => {
    const el = closestTipEl(e.target);
    if (!isTipIcon(el)) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeEl === el && isPinned) {
        destroy();
        return;
      }
      show(el, { pinned: true });
      return;
    }
    if (e.key === "Escape" && activeEl === el) {
      e.preventDefault();
      destroy();
      el.focus?.();
    }
  });
}

function closestTipEl(node) {
  if (!node) return null;
  if (node.closest) return node.closest("[data-tip]");
  // very old browsers fallback
  return null;
}

function isTipIcon(el) {
  return !!el?.classList?.contains("tip-icon");
}

function isTouchLikeDevice() {
  try {
    return !!window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches;
  } catch {
    return false;
  }
}

function updateTriggerState(el, expanded) {
  if (!isTipIcon(el)) return;
  el.setAttribute("aria-expanded", expanded ? "true" : "false");
  if (expanded && activeBubble?.id) {
    el.setAttribute("aria-describedby", activeBubble.id);
  } else {
    el.removeAttribute("aria-describedby");
  }
}

function show(el, { pinned = false } = {}) {
  clearTimeout(hideTimer);
  hideTimer = null;

  const text = el.getAttribute("data-tip");
  if (!text) return;

  if (activeBubble && activeEl === el && isPinned === pinned) return;

  destroy();

  activeEl = el;
  isPinned = pinned;
  activeBubble = document.createElement("div");
  activeBubble.className = "tooltip-bubble";
  activeBubble.id = `tooltipBubble-${++activeBubbleId}`;
  activeBubble.setAttribute("role", "tooltip");
  // data-tip is HTML-escaped; decode entities by leveraging DOM
  activeBubble.textContent = normalizeTooltipText(unescapeAttr(text));
  document.body.appendChild(activeBubble);
  updateTriggerState(activeEl, true);

  positionBubble();
  window.addEventListener("scroll", schedulePosition, true);
  window.addEventListener("resize", schedulePosition, true);
  document.addEventListener("pointerdown", handleDocumentPointerDown, true);
  document.addEventListener("keydown", handleDocumentKeydown, true);
}

function schedulePosition() {
  if (!positionRafId) {
    positionRafId = requestAnimationFrame(() => {
      positionRafId = 0;
      positionBubble();
    });
  }
}

function positionBubble() {
  if (!activeEl || !activeBubble) return;

  const rect = activeEl.getBoundingClientRect();
  const bubble = activeBubble;

  const padding = 10;
  const bw = bubble.offsetWidth;
  const bh = bubble.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x;
  let y;
  if (isTouchLikeDevice()) {
    x = rect.left + rect.width / 2 - bw / 2;
    y = rect.bottom + padding;
    if (y + bh > vh - padding) y = rect.top - padding - bh;
  } else {
    // Prefer right side
    x = rect.right + padding;
    y = rect.top + rect.height / 2 - bh / 2;
    if (x + bw > vw - padding) x = rect.left - padding - bw;
  }
  if (x < padding) x = padding;
  if (x + bw > vw - padding) x = vw - padding - bw;

  if (y + bh > vh - padding) y = vh - padding - bh;
  if (y < padding) y = padding;

  bubble.style.left = `${Math.round(x)}px`;
  bubble.style.top = `${Math.round(y)}px`;
}

function scheduleHide() {
  if (isPinned) return;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => destroy(), 180);
}

function handleDocumentPointerDown(event) {
  if (!activeBubble || !isPinned) return;
  const target = event.target;
  if (activeBubble.contains(target) || activeEl?.contains?.(target)) return;
  destroy();
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape" && activeBubble) destroy();
}

function destroy() {
  updateTriggerState(activeEl, false);
  if (activeBubble) {
    activeBubble.remove();
    activeBubble = null;
  }
  activeEl = null;
  isPinned = false;
  cancelAnimationFrame(positionRafId);
  positionRafId = 0;
  window.removeEventListener("scroll", schedulePosition, true);
  window.removeEventListener("resize", schedulePosition, true);
  document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  document.removeEventListener("keydown", handleDocumentKeydown, true);
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeAttr(s) {
  // Convert a small set of entities back for display
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalizeTooltipText(text) {
  const value = String(text || "").trim();
  if (!value) return "";
  if (
    /^(Overview|Feeds into|Drawn from|Changes|Interpret as|Typical range|Caveat|References):/i.test(
      value,
    )
  ) {
    return value;
  }
  return `Overview: ${value}`;
}
