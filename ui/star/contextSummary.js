import { createElement, replaceChildren } from "../domHelpers.js";

function createContextSummaryCard(label, value, meta = "") {
  return createElement("div", { className: "context-summary__card" }, [
    createElement("div", { className: "context-summary__label", text: label }),
    createElement("div", { className: "context-summary__value", text: value }),
    meta ? createElement("div", { className: "context-summary__meta", text: meta }) : null,
  ]);
}

function createContextSummaryNote(title, body) {
  return createElement("div", { className: "context-summary__note" }, [
    createElement("strong", { text: `${title} ` }),
    body,
  ]);
}

export function renderStarCurrentStateSummary({
  copyEl,
  gridEl,
  notesEl,
  guidanceEl,
  isMulti,
  topologyLabel,
  hostFrameCount,
  activeHostFrameLabel,
  activeHostFrameModeLabel,
  topologyHealth,
  defaultOrbitHostSummary,
}) {
  if (!copyEl || !gridEl || !notesEl || !guidanceEl) return;

  copyEl.textContent = isMulti
    ? `This ${topologyLabel.toLowerCase()} layout exposes ${hostFrameCount} host frame${hostFrameCount === 1 ? "" : "s"} for later planet and debris authoring.`
    : "Single-star flow keeps the host model simple while still letting you tune the primary star in detail.";
  guidanceEl.textContent = isMulti
    ? "Topology decides which star and pair host frames exist. Changing it does not move any existing worlds; the default orbit host only affects newly added planets and gas giants."
    : "Single-star mode keeps one star host frame. Switch to Binary, Triple, or Quad only when you need additional stars or shared pair hosts for future bodies.";
  replaceChildren(gridEl, [
    createContextSummaryCard(
      "Topology",
      topologyLabel,
      isMulti ? `${hostFrameCount} available host frame(s)` : "One host frame available",
    ),
    createContextSummaryCard("Default Orbit Host", activeHostFrameLabel, activeHostFrameModeLabel),
    createContextSummaryCard(
      "Existing Orbit Ownership",
      "Preserved",
      "Changing topology never reassigns existing planets, gas giants, moons, or debris.",
    ),
    createContextSummaryCard(
      "Hierarchy Health",
      isMulti ? topologyHealth.headline : "Not needed",
      isMulti
        ? `${topologyHealth.summary} ${topologyHealth.fluxSummary}`.trim()
        : "Multi-star guardrails only apply after you add additional stars.",
    ),
  ]);
  replaceChildren(notesEl, [
    createContextSummaryNote("Default-host rule.", defaultOrbitHostSummary),
    createContextSummaryNote(
      "Guardrail meaning.",
      isMulti
        ? "Hierarchy health is a live save check: Good means comfortably wide, Caution means tight, and Blocked means the outer hierarchy must be widened before you can save."
        : "Hierarchy health appears automatically once you move into Binary, Triple, or Quad layouts.",
    ),
  ]);
}
