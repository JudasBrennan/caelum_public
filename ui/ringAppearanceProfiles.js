import { RING_MODE_AUTO } from "../engine/planetaryRings.js";

export const RING_STYLE_AUTO = "auto";
export const RING_STYLE_SATURNIAN_BRIGHT = "saturnian-bright";
export const RING_STYLE_ICY_BANDED = "icy-banded";
export const RING_STYLE_DUSTY_VEIL = "dusty-veil";
export const RING_STYLE_NARROW_DARK = "narrow-dark";
export const RING_STYLE_ARC_DUSTY = "arc-dusty";
export const RING_STYLE_ROCKY_DEBRIS = "rocky-debris";

const RING_STYLE_IDS = new Set([
  RING_STYLE_AUTO,
  RING_STYLE_SATURNIAN_BRIGHT,
  RING_STYLE_ICY_BANDED,
  RING_STYLE_DUSTY_VEIL,
  RING_STYLE_NARROW_DARK,
  RING_STYLE_ARC_DUSTY,
  RING_STYLE_ROCKY_DEBRIS,
]);

export const RING_STYLE_OPTIONS = Object.freeze([
  { id: RING_STYLE_AUTO, label: "Auto (recommended)", bodyTypes: ["gasGiant", "rocky"] },
  {
    id: RING_STYLE_SATURNIAN_BRIGHT,
    label: "Saturnian Bright",
    bodyTypes: ["gasGiant", "rocky"],
  },
  { id: RING_STYLE_ICY_BANDED, label: "Icy Banded", bodyTypes: ["gasGiant", "rocky"] },
  { id: RING_STYLE_DUSTY_VEIL, label: "Dusty Veil", bodyTypes: ["gasGiant", "rocky"] },
  { id: RING_STYLE_NARROW_DARK, label: "Narrow Dark", bodyTypes: ["gasGiant", "rocky"] },
  { id: RING_STYLE_ARC_DUSTY, label: "Arc Dusty", bodyTypes: ["gasGiant", "rocky"] },
  { id: RING_STYLE_ROCKY_DEBRIS, label: "Rocky Debris", bodyTypes: ["gasGiant", "rocky"] },
]);

const STYLE_LABELS = Object.fromEntries(
  RING_STYLE_OPTIONS.map((option) => [option.id, option.label]),
);

const BASE_APPEARANCE = Object.freeze({
  inner: 1.22,
  outer: 2.02,
  opacity: 0.42,
  macroBandCount: 6,
  macroBandContrast: 0.22,
  microBandStrength: 0.14,
  dustStrength: 0.08,
  edgeFeatherInner: 0.16,
  edgeFeatherOuter: 0.2,
  asymmetry: 0,
  tiltDeg: 100,
  yawDeg: 18,
});

const BASE_SHADING = Object.freeze({
  litFaceGain: 0.82,
  backscatterGain: 0.38,
  grazingViewGain: 0.18,
  unlitFloor: 0.14,
  planetShadowStrength: 0.78,
  planetShadowSoftness: 0.055,
  planetShadowRadiusBias: 0.02,
  ringShadowOnBodyStrength: 0.44,
  ringShadowOnBodySoftness: 0.12,
  ringShadowOnBodySpecularRetention: 0.56,
});

const STYLE_PROFILES = Object.freeze({
  [RING_STYLE_SATURNIAN_BRIGHT]: {
    family: "bright-icy",
    outer: 2.18,
    opacity: 0.58,
    macroBandCount: 8,
    macroBandContrast: 0.34,
    microBandStrength: 0.2,
    dustStrength: 0.05,
    colourStops: [
      { at: 0, color: "#d9cfbf" },
      { at: 0.18, color: "#efe6d4" },
      { at: 0.44, color: "#b8ad97" },
      { at: 0.72, color: "#f1e8d8" },
      { at: 1, color: "#a69c89" },
    ],
    opacityStops: [
      { at: 0, value: 0.18 },
      { at: 0.12, value: 0.58 },
      { at: 0.46, value: 0.44 },
      { at: 0.78, value: 0.54 },
      { at: 1, value: 0.2 },
    ],
    gaps: [
      { center: 0.34, width: 0.09, depth: 0.88 },
      { center: 0.62, width: 0.03, depth: 0.94 },
    ],
    shading: {
      litFaceGain: 0.9,
      backscatterGain: 0.52,
      grazingViewGain: 0.24,
      unlitFloor: 0.18,
      ringShadowOnBodyStrength: 0.46,
      ringShadowOnBodySoftness: 0.13,
      ringShadowOnBodySpecularRetention: 0.54,
    },
  },
  [RING_STYLE_ICY_BANDED]: {
    family: "icy",
    outer: 2.05,
    opacity: 0.48,
    macroBandCount: 7,
    macroBandContrast: 0.24,
    microBandStrength: 0.16,
    colourStops: [
      { at: 0, color: "#c7c8cf" },
      { at: 0.2, color: "#e1e2e6" },
      { at: 0.5, color: "#b5b8c0" },
      { at: 0.78, color: "#dfdfdf" },
      { at: 1, color: "#a9aab2" },
    ],
    opacityStops: [
      { at: 0, value: 0.16 },
      { at: 0.2, value: 0.46 },
      { at: 0.55, value: 0.38 },
      { at: 0.8, value: 0.43 },
      { at: 1, value: 0.18 },
    ],
    gaps: [{ center: 0.58, width: 0.035, depth: 0.78 }],
    shading: {
      litFaceGain: 0.86,
      backscatterGain: 0.42,
      grazingViewGain: 0.2,
      ringShadowOnBodyStrength: 0.44,
      ringShadowOnBodySoftness: 0.12,
      ringShadowOnBodySpecularRetention: 0.56,
    },
  },
  [RING_STYLE_DUSTY_VEIL]: {
    family: "dusty",
    outer: 1.92,
    opacity: 0.24,
    macroBandCount: 4,
    macroBandContrast: 0.12,
    microBandStrength: 0.1,
    dustStrength: 0.2,
    colourStops: [
      { at: 0, color: "#948170" },
      { at: 0.32, color: "#b59a83" },
      { at: 0.66, color: "#907968" },
      { at: 1, color: "#6f5e52" },
    ],
    opacityStops: [
      { at: 0, value: 0.08 },
      { at: 0.2, value: 0.24 },
      { at: 0.6, value: 0.18 },
      { at: 1, value: 0.06 },
    ],
    gaps: [],
    shading: {
      litFaceGain: 0.68,
      backscatterGain: 0.22,
      grazingViewGain: 0.12,
      unlitFloor: 0.1,
      ringShadowOnBodyStrength: 0.3,
      ringShadowOnBodySoftness: 0.16,
      ringShadowOnBodySpecularRetention: 0.66,
    },
  },
  [RING_STYLE_NARROW_DARK]: {
    family: "dark",
    inner: 1.3,
    outer: 1.78,
    opacity: 0.32,
    macroBandCount: 5,
    macroBandContrast: 0.28,
    microBandStrength: 0.12,
    dustStrength: 0.04,
    colourStops: [
      { at: 0, color: "#4d5056" },
      { at: 0.22, color: "#757a82" },
      { at: 0.48, color: "#3a3d44" },
      { at: 0.74, color: "#666a72" },
      { at: 1, color: "#2f3238" },
    ],
    opacityStops: [
      { at: 0, value: 0.12 },
      { at: 0.18, value: 0.3 },
      { at: 0.5, value: 0.26 },
      { at: 0.84, value: 0.3 },
      { at: 1, value: 0.12 },
    ],
    gaps: [
      { center: 0.41, width: 0.04, depth: 0.82 },
      { center: 0.7, width: 0.025, depth: 0.76 },
    ],
    shading: {
      litFaceGain: 0.6,
      backscatterGain: 0.16,
      grazingViewGain: 0.08,
      unlitFloor: 0.08,
      ringShadowOnBodyStrength: 0.48,
      ringShadowOnBodySoftness: 0.1,
      ringShadowOnBodySpecularRetention: 0.48,
    },
  },
  [RING_STYLE_ARC_DUSTY]: {
    family: "arc",
    inner: 1.28,
    outer: 1.88,
    opacity: 0.22,
    macroBandCount: 4,
    macroBandContrast: 0.16,
    microBandStrength: 0.09,
    dustStrength: 0.18,
    asymmetry: 0.3,
    colourStops: [
      { at: 0, color: "#797c88" },
      { at: 0.26, color: "#9ea2ad" },
      { at: 0.52, color: "#6f7480" },
      { at: 0.82, color: "#aeb2bb" },
      { at: 1, color: "#5d616c" },
    ],
    opacityStops: [
      { at: 0, value: 0.06 },
      { at: 0.22, value: 0.2 },
      { at: 0.58, value: 0.14 },
      { at: 0.86, value: 0.18 },
      { at: 1, value: 0.05 },
    ],
    gaps: [{ center: 0.48, width: 0.05, depth: 0.58 }],
    shading: {
      litFaceGain: 0.66,
      backscatterGain: 0.2,
      grazingViewGain: 0.12,
      ringShadowOnBodyStrength: 0.34,
      ringShadowOnBodySoftness: 0.15,
      ringShadowOnBodySpecularRetention: 0.64,
    },
  },
  [RING_STYLE_ROCKY_DEBRIS]: {
    family: "rocky",
    inner: 1.24,
    outer: 1.9,
    opacity: 0.28,
    macroBandCount: 5,
    macroBandContrast: 0.18,
    microBandStrength: 0.12,
    dustStrength: 0.14,
    colourStops: [
      { at: 0, color: "#8d7763" },
      { at: 0.24, color: "#b19a82" },
      { at: 0.56, color: "#776455" },
      { at: 0.82, color: "#9c866f" },
      { at: 1, color: "#5f5146" },
    ],
    opacityStops: [
      { at: 0, value: 0.1 },
      { at: 0.22, value: 0.28 },
      { at: 0.54, value: 0.2 },
      { at: 0.82, value: 0.24 },
      { at: 1, value: 0.08 },
    ],
    gaps: [{ center: 0.63, width: 0.03, depth: 0.65 }],
    shading: {
      litFaceGain: 0.64,
      backscatterGain: 0.18,
      grazingViewGain: 0.1,
      unlitFloor: 0.09,
      ringShadowOnBodyStrength: 0.4,
      ringShadowOnBodySoftness: 0.13,
      ringShadowOnBodySpecularRetention: 0.58,
    },
  },
});

function normalizeBodyType(bodyType) {
  return bodyType === "gasGiant" ? "gasGiant" : "rocky";
}

function normalizeOpticalDepthClass(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (key === "dense") return "Dense";
  if (key === "moderate") return "Moderate";
  if (key === "tenuous") return "Tenuous";
  return "";
}

function normalizeRingType(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (key === "icy") return "Icy";
  if (key === "rocky") return "Rocky";
  return "";
}

function profileForStyle(styleId) {
  return STYLE_PROFILES[styleId] || STYLE_PROFILES[RING_STYLE_ICY_BANDED];
}

function buildAppearance(styleId, seed) {
  const profile = profileForStyle(styleId);
  const styleSeed = String(seed || styleId || "ring");
  return {
    styleId,
    family: profile.family,
    colourStops: profile.colourStops.map((stop) => ({ ...stop })),
    opacityStops: profile.opacityStops.map((stop) => ({ ...stop })),
    gaps: (profile.gaps || []).map((gap) => ({ ...gap })),
    inner: Number.isFinite(profile.inner) ? profile.inner : BASE_APPEARANCE.inner,
    outer: Number.isFinite(profile.outer) ? profile.outer : BASE_APPEARANCE.outer,
    opacity: Number.isFinite(profile.opacity) ? profile.opacity : BASE_APPEARANCE.opacity,
    macroBandCount: Number.isFinite(profile.macroBandCount)
      ? profile.macroBandCount
      : BASE_APPEARANCE.macroBandCount,
    macroBandContrast: Number.isFinite(profile.macroBandContrast)
      ? profile.macroBandContrast
      : BASE_APPEARANCE.macroBandContrast,
    microBandStrength: Number.isFinite(profile.microBandStrength)
      ? profile.microBandStrength
      : BASE_APPEARANCE.microBandStrength,
    dustStrength: Number.isFinite(profile.dustStrength)
      ? profile.dustStrength
      : BASE_APPEARANCE.dustStrength,
    edgeFeatherInner: Number.isFinite(profile.edgeFeatherInner)
      ? profile.edgeFeatherInner
      : BASE_APPEARANCE.edgeFeatherInner,
    edgeFeatherOuter: Number.isFinite(profile.edgeFeatherOuter)
      ? profile.edgeFeatherOuter
      : BASE_APPEARANCE.edgeFeatherOuter,
    asymmetry: Number.isFinite(profile.asymmetry) ? profile.asymmetry : BASE_APPEARANCE.asymmetry,
    tiltDeg: Number.isFinite(profile.tiltDeg) ? profile.tiltDeg : BASE_APPEARANCE.tiltDeg,
    yawDeg: Number.isFinite(profile.yawDeg) ? profile.yawDeg : BASE_APPEARANCE.yawDeg,
    shading: {
      litFaceGain: Number.isFinite(profile.shading?.litFaceGain)
        ? profile.shading.litFaceGain
        : BASE_SHADING.litFaceGain,
      backscatterGain: Number.isFinite(profile.shading?.backscatterGain)
        ? profile.shading.backscatterGain
        : BASE_SHADING.backscatterGain,
      grazingViewGain: Number.isFinite(profile.shading?.grazingViewGain)
        ? profile.shading.grazingViewGain
        : BASE_SHADING.grazingViewGain,
      unlitFloor: Number.isFinite(profile.shading?.unlitFloor)
        ? profile.shading.unlitFloor
        : BASE_SHADING.unlitFloor,
      planetShadowStrength: Number.isFinite(profile.shading?.planetShadowStrength)
        ? profile.shading.planetShadowStrength
        : BASE_SHADING.planetShadowStrength,
      planetShadowSoftness: Number.isFinite(profile.shading?.planetShadowSoftness)
        ? profile.shading.planetShadowSoftness
        : BASE_SHADING.planetShadowSoftness,
      planetShadowRadiusBias: Number.isFinite(profile.shading?.planetShadowRadiusBias)
        ? profile.shading.planetShadowRadiusBias
        : BASE_SHADING.planetShadowRadiusBias,
      ringShadowOnBodyStrength: Number.isFinite(profile.shading?.ringShadowOnBodyStrength)
        ? profile.shading.ringShadowOnBodyStrength
        : BASE_SHADING.ringShadowOnBodyStrength,
      ringShadowOnBodySoftness: Number.isFinite(profile.shading?.ringShadowOnBodySoftness)
        ? profile.shading.ringShadowOnBodySoftness
        : BASE_SHADING.ringShadowOnBodySoftness,
      ringShadowOnBodySpecularRetention: Number.isFinite(
        profile.shading?.ringShadowOnBodySpecularRetention,
      )
        ? profile.shading.ringShadowOnBodySpecularRetention
        : BASE_SHADING.ringShadowOnBodySpecularRetention,
    },
    seed: styleSeed,
  };
}

export function normalizeRingStyleId(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  return RING_STYLE_IDS.has(key) ? key : RING_STYLE_AUTO;
}

export function listRingStyleOptions({ bodyType } = {}) {
  const normalizedBodyType = normalizeBodyType(bodyType);
  return RING_STYLE_OPTIONS.filter((option) => option.bodyTypes.includes(normalizedBodyType)).map(
    (option) => ({
      value: option.id,
      label: option.label,
      selected: false,
    }),
  );
}

export function suggestGasGiantRingStyle({ gasCalc, bodyStyleId } = {}) {
  const styleKey = String(bodyStyleId || "")
    .trim()
    .toLowerCase();
  if (styleKey === "saturn") return RING_STYLE_SATURNIAN_BRIGHT;
  if (styleKey === "uranus") return RING_STYLE_NARROW_DARK;
  if (styleKey.includes("neptune") || styleKey === "ringed-ice") return RING_STYLE_ARC_DUSTY;

  const ringType = normalizeRingType(gasCalc?.ringProperties?.ringType);
  const opticalDepthClass = normalizeOpticalDepthClass(gasCalc?.ringProperties?.opticalDepthClass);

  if (ringType === "Icy" && opticalDepthClass === "Dense") return RING_STYLE_SATURNIAN_BRIGHT;
  if (ringType === "Icy" && opticalDepthClass === "Moderate") return RING_STYLE_ICY_BANDED;
  if (ringType === "Rocky") return RING_STYLE_DUSTY_VEIL;
  if (opticalDepthClass === "Tenuous") return RING_STYLE_DUSTY_VEIL;
  return RING_STYLE_ICY_BANDED;
}

export function suggestRockyRingStyle({ derived } = {}) {
  const tempK = Number(derived?.surfaceTempK);
  if (!Number.isFinite(tempK)) return RING_STYLE_ROCKY_DEBRIS;
  if (tempK < 180) return RING_STYLE_ICY_BANDED;
  if (tempK < 350) return RING_STYLE_ROCKY_DEBRIS;
  return RING_STYLE_DUSTY_VEIL;
}

export function resolveRingAppearance({
  bodyType,
  ringState,
  ringStyleId,
  gasCalc,
  derived,
  bodyStyleId,
  seed,
} = {}) {
  const normalizedBodyType = normalizeBodyType(bodyType);
  const normalizedRingState = ringState || {};
  const normalizedStyleId = normalizeRingStyleId(ringStyleId);
  const suggestedStyleId =
    normalizedBodyType === "gasGiant"
      ? suggestGasGiantRingStyle({ gasCalc, bodyStyleId })
      : suggestRockyRingStyle({ derived });
  const manualStyleActive =
    normalizedStyleId !== RING_STYLE_AUTO &&
    normalizedRingState?.ringMode &&
    normalizedRingState.ringMode !== RING_MODE_AUTO;
  const effectiveStyleId = manualStyleActive ? normalizedStyleId : suggestedStyleId;
  const styleSource = manualStyleActive ? "manual" : "auto";
  const label = STYLE_LABELS[effectiveStyleId] || STYLE_LABELS[suggestedStyleId];
  const appearanceSeed = seed || derived?.name || gasCalc?.inputs?.name || effectiveStyleId;
  const appearance = buildAppearance(effectiveStyleId, appearanceSeed);

  return {
    enabled: normalizedRingState?.effectiveEnabled === true,
    ringStyleId: normalizedStyleId,
    suggestedStyleId,
    effectiveStyleId,
    styleSource,
    label,
    family: appearance.family,
    appearance,
  };
}
