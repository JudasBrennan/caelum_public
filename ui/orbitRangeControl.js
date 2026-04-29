import { createElement } from "./domHelpers.js";

export const ORBIT_AU_MIN = 0.01;
export const ORBIT_AU_MAX = 1000000;

export const ORBIT_RANGE_MODES = Object.freeze([
  Object.freeze({ id: "inner", label: "Inner", min: 0.01, max: 30, step: 0.01 }),
  Object.freeze({ id: "outer", label: "Outer", min: 30, max: 1000, step: 0.1 }),
  Object.freeze({ id: "distant", label: "Distant", min: 1000, max: 1000000, step: 1 }),
]);

function toFiniteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatAu(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (Math.abs(number) >= 1000) return number.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (Math.abs(number) >= 100) return number.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (Math.abs(number) >= 10) return number.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return number.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

function formatRangeEndpoint(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (number >= 1000) return number.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return String(number);
}

export function orbitRangeModeForValue(value) {
  const number = Math.max(
    toFiniteNumber(value, ORBIT_RANGE_MODES[0].min),
    ORBIT_RANGE_MODES[0].min,
  );
  return (
    ORBIT_RANGE_MODES.find((mode) => number >= mode.min && number <= mode.max) ||
    ORBIT_RANGE_MODES[ORBIT_RANGE_MODES.length - 1]
  );
}

export function createOrbitRangeModeToggleNode({
  name,
  selectedModeId = ORBIT_RANGE_MODES[0].id,
  className = "physics-trio-toggle orbit-range-toggle",
} = {}) {
  const groupName = name || `orbitRange_${Math.random().toString(36).slice(2, 9)}`;
  return createElement(
    "div",
    {
      className,
      attrs: { "data-toggle": "orbit-range" },
    },
    [
      ...ORBIT_RANGE_MODES.flatMap((mode) => {
        const id = `${groupName}_${mode.id}`;
        return [
          createElement("input", {
            attrs: {
              type: "radio",
              name: groupName,
              id,
              value: mode.id,
            },
            dataset: { orbitRangeMode: mode.id },
            checked: mode.id === selectedModeId,
          }),
          createElement("label", { attrs: { for: id }, text: mode.label }),
        ];
      }),
      createElement("span"),
    ],
  );
}

export function bindOrbitRangeControl({
  numberEl,
  sliderEl,
  root = null,
  modeInputs = null,
  statusEl = null,
  minLabelEl = null,
  maxLabelEl = null,
  min = ORBIT_AU_MIN,
  max = ORBIT_AU_MAX,
  step = 0.01,
  commitOnInput = true,
  onChange,
  statusSubject = "orbit",
} = {}) {
  if (!numberEl || !sliderEl) {
    return {
      ready: false,
      syncFromNumber() {
        return null;
      },
      syncFromSlider() {
        return null;
      },
    };
  }

  const fullMin = Math.max(Number(min) || ORBIT_AU_MIN, ORBIT_AU_MIN);
  const fullMax = Math.min(Number(max) || ORBIT_AU_MAX, ORBIT_AU_MAX);
  const configuredStep = Number(step) > 0 ? Number(step) : 0.01;
  const controlsRoot = root || numberEl.closest(".orbit-range-control") || numberEl.parentElement;
  const radios =
    modeInputs != null
      ? [...modeInputs]
      : [...(controlsRoot?.querySelectorAll("[data-orbit-range-mode]") || [])];
  const metaSpans = controlsRoot?.querySelectorAll(".range-meta span") || [];
  const resolvedMinLabelEl = minLabelEl || metaSpans[0] || null;
  const resolvedMaxLabelEl = maxLabelEl || metaSpans[1] || null;
  const resolvedStatusEl = statusEl || controlsRoot?.querySelector(".orbit-range-status") || null;
  let lastCommittedValue = null;

  numberEl.min = String(fullMin);
  numberEl.max = String(fullMax);
  numberEl.step = String(configuredStep);

  function readNumberValue() {
    const raw = String(numberEl.value ?? "").trim();
    if (!raw) return Number.NaN;
    const valueAsNumber = numberEl.valueAsNumber;
    if (Number.isFinite(valueAsNumber)) return valueAsNumber;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  function getCheckedMode() {
    const checked = radios.find((radio) => radio.checked);
    return ORBIT_RANGE_MODES.find((mode) => mode.id === checked?.value) || ORBIT_RANGE_MODES[0];
  }

  function getModeForValue(value) {
    const clamped = clamp(value, fullMin, fullMax);
    return orbitRangeModeForValue(clamped);
  }

  function updateStatus(value, mode) {
    if (!resolvedStatusEl) return;
    const number = Number(value);
    if (!Number.isFinite(number) || number <= ORBIT_RANGE_MODES[0].max) {
      resolvedStatusEl.textContent = "";
      resolvedStatusEl.dataset.rangeKind = "inner";
      return;
    }
    const label = mode?.label || getModeForValue(number).label;
    resolvedStatusEl.textContent = `${label} ${statusSubject}: ${formatAu(number)} AU`;
    resolvedStatusEl.dataset.rangeKind = mode?.id || getModeForValue(number).id;
  }

  function applyMode(mode, valueForSlider = readNumberValue()) {
    const boundedMode = {
      ...mode,
      min: Math.max(mode.min, fullMin),
      max: Math.min(mode.max, fullMax),
      step: Math.max(Number(mode.step) || configuredStep, configuredStep),
    };
    for (const radio of radios) {
      radio.checked = radio.value === boundedMode.id;
    }
    sliderEl.min = String(boundedMode.min);
    sliderEl.max = String(boundedMode.max);
    sliderEl.step = String(boundedMode.step);
    if (resolvedMinLabelEl) resolvedMinLabelEl.textContent = formatRangeEndpoint(boundedMode.min);
    if (resolvedMaxLabelEl) resolvedMaxLabelEl.textContent = formatRangeEndpoint(boundedMode.max);
    const finiteValue = Number.isFinite(valueForSlider)
      ? clamp(valueForSlider, fullMin, fullMax)
      : boundedMode.min;
    sliderEl.value = String(clamp(finiteValue, boundedMode.min, boundedMode.max));
    updateStatus(finiteValue, boundedMode);
    return boundedMode;
  }

  function commitValue(value) {
    if (Number.isFinite(lastCommittedValue) && Object.is(value, lastCommittedValue)) return;
    lastCommittedValue = value;
    onChange?.(value);
  }

  function syncFromNumber({ commit = commitOnInput, normalize = false } = {}) {
    const rawValue = readNumberValue();
    if (!Number.isFinite(rawValue)) return null;
    const clampedValue = clamp(rawValue, fullMin, fullMax);
    const nextMode = getModeForValue(clampedValue);
    applyMode(nextMode, clampedValue);
    if (normalize) numberEl.value = String(clampedValue);
    if (commit) commitValue(clampedValue);
    return clampedValue;
  }

  function syncFromSlider() {
    const sliderValue = Number(sliderEl.value);
    if (!Number.isFinite(sliderValue)) return null;
    const mode = getCheckedMode();
    let nextValue = sliderValue;
    if (configuredStep > 0) {
      nextValue = Math.round(nextValue / configuredStep) * configuredStep;
    }
    nextValue = clamp(nextValue, Math.max(mode.min, fullMin), Math.min(mode.max, fullMax));
    numberEl.value = String(nextValue);
    applyMode(mode, nextValue);
    commitValue(nextValue);
    return nextValue;
  }

  numberEl.addEventListener("input", () => syncFromNumber());
  numberEl.addEventListener("change", () => syncFromNumber({ commit: true, normalize: true }));
  sliderEl.addEventListener("input", syncFromSlider);
  for (const radio of radios) {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      const mode = ORBIT_RANGE_MODES.find((candidate) => candidate.id === radio.value);
      if (!mode) return;
      const currentValue = readNumberValue();
      applyMode(mode, Number.isFinite(currentValue) ? currentValue : mode.min);
    });
  }

  const initialValue = readNumberValue();
  if (Number.isFinite(initialValue)) {
    lastCommittedValue = clamp(initialValue, fullMin, fullMax);
  }
  applyMode(
    Number.isFinite(initialValue) ? getModeForValue(initialValue) : ORBIT_RANGE_MODES[0],
    initialValue,
  );

  return {
    ready: true,
    syncFromNumber,
    syncFromSlider,
  };
}
