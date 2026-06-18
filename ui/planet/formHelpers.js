export function clampGasGiantRadiusRj(value, min, max, step) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return min;
  const clamped = Math.max(min, Math.min(max, raw));
  const inv = 1 / step;
  return Math.round(clamped * inv) / inv;
}

export function findNearestSlot(targetAu, orbitsAu, occupiedSlots) {
  let bestSlot = null;
  let bestDist = Infinity;
  for (let i = 0; i < orbitsAu.length; i++) {
    const slot = i + 1;
    if (occupiedSlots.has(slot)) continue;
    const dist = Math.abs(orbitsAu[i] - targetAu);
    if (dist < bestDist) {
      bestDist = dist;
      bestSlot = slot;
    }
  }
  return bestSlot;
}

export function guidedOrbitDistanceMessage(bodyLabel = "planet") {
  return `Guided orbit mode sets this ${bodyLabel}'s distance from its selected orbital slot. Switch the System page to Manual mode for direct AU entry.`;
}

export function isGuidedOrbitMode(world) {
  return (world?.system?.orbitMode || "guided") !== "manual";
}

export function applyGuidedOrbitDistanceGuard(root, inputId, message) {
  const numberEl = root.querySelector(`#${inputId}`);
  const sliderEl = root.querySelector(`#${inputId}_slider`);
  const rowEl = numberEl?.closest(".form-row");
  if (!numberEl || !sliderEl) return;
  numberEl.disabled = true;
  sliderEl.disabled = true;
  numberEl.setAttribute("aria-describedby", `${inputId}_orbit_status`);
  sliderEl.setAttribute("aria-describedby", `${inputId}_orbit_status`);
  for (const modeEl of root.querySelectorAll(`input[name="${inputId}_orbitRange"]`)) {
    modeEl.disabled = true;
  }
  if (rowEl) {
    rowEl.classList.add("is-guided-orbit-locked");
    rowEl.title = message;
  }
  const statusEl = root.querySelector(`#${inputId}_orbit_status`);
  if (statusEl) statusEl.textContent = message;
}

export function readOptionalSelectValue(selectEl) {
  const value = String(selectEl?.value || "").trim();
  return value || null;
}

export function readOptionalNonNegativeNumber(numberEl, previousValue = null) {
  if (!numberEl) return { ok: true, value: null };
  const raw = String(numberEl.value || "").trim();
  if (!raw) return { ok: true, value: null };
  const value = Number(raw);
  if (Number.isFinite(value) && value >= 0) return { ok: true, value };
  numberEl.value = previousValue ?? "";
  return { ok: false, value: previousValue ?? null };
}

export function numWithSlider(id, label, unit, hint, min, max, step, tipHtml = "") {
  const unitHtml = unit ? ` <span class="unit">${unit}</span>` : "";
  const hintHtml = hint ? `<div class="hint">${hint}</div>` : "";
  return `
  <div class="form-row">
    <div>
      <div class="label">${label}${unitHtml} ${tipHtml}</div>
      ${hintHtml}
    </div>
    <div class="input-pair">
      <input id="${id}" type="number" step="${step}" aria-label="${label}" />
      <input id="${id}_slider" type="range" aria-label="${label} slider" />
      <div class="range-meta"><span id="${id}_min">${min}</span><span id="${id}_max">${max}</span></div>
    </div>
  </div>`;
}
