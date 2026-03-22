import { clamp } from "../engine/utils.js";
import { seededRng } from "./renderUtils.js";

const COMET_APPEARANCE_PRESETS = Object.freeze({
  waterRich: Object.freeze({
    label: "Blue-white ice plume",
    description: "Water-ice activity drives a bright blue-white coma with a cool cyan ion tail.",
    nucleusCoreHex: "#eef8ff",
    nucleusHaloHex: "#9fe9ff",
    comaHex: "#d8f8ff",
    dustTailHex: "#f1dfc8",
    ionTailHex: "#72ddff",
    orbitHex: "#8abfe8",
    bgInnerHex: "#0d1930",
    bgOuterHex: "#030711",
    sparkleHex: "#f8fdff",
  }),
  mixed: Object.freeze({
    label: "Aqua-gold mixed plume",
    description:
      "Mixed water and carbon dioxide volatiles add both cool ion glow and a warmer dust veil.",
    nucleusCoreHex: "#f2f7ff",
    nucleusHaloHex: "#89e0ef",
    comaHex: "#c9f6ee",
    dustTailHex: "#efd1a8",
    ionTailHex: "#60d6cb",
    orbitHex: "#89b6d8",
    bgInnerHex: "#101a2d",
    bgOuterHex: "#030711",
    sparkleHex: "#fff7ea",
  }),
  co2Rich: Object.freeze({
    label: "Rose-amber CO2 plume",
    description: "Carbon-dioxide-rich activity leans warmer, with amber dust and a pale rose coma.",
    nucleusCoreHex: "#fff3ee",
    nucleusHaloHex: "#ffc3ae",
    comaHex: "#ffe5d9",
    dustTailHex: "#ffbf8d",
    ionTailHex: "#f3a6be",
    orbitHex: "#d6a7b2",
    bgInnerHex: "#1a1321",
    bgOuterHex: "#04060d",
    sparkleHex: "#fff1eb",
  }),
  coRich: Object.freeze({
    label: "Teal cryovolatile plume",
    description:
      "CO-rich volatiles stay active far out and favor a ghostly teal coma with an electric ion tail.",
    nucleusCoreHex: "#edfdf8",
    nucleusHaloHex: "#74e6d1",
    comaHex: "#baf8ea",
    dustTailHex: "#d7dbc9",
    ionTailHex: "#4effc9",
    orbitHex: "#6fcfb8",
    bgInnerHex: "#0b1d1d",
    bgOuterHex: "#02070a",
    sparkleHex: "#effff9",
  }),
});

function normalizeVolatileClass(value) {
  const id = String(value || "").trim();
  return Object.hasOwn(COMET_APPEARANCE_PRESETS, id) ? id : "waterRich";
}

function parseHexRgb(hex) {
  const raw = String(hex || "")
    .trim()
    .replace(/^#/, "");
  if (!/^[0-9a-f]{6}$/i.test(raw)) return { r: 255, g: 255, b: 255 };
  const value = Number.parseInt(raw, 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

function rgba(hex, alpha = 1) {
  const { r, g, b } = parseHexRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function mixHex(baseHex, mixHexValue, fraction = 0.5) {
  const t = clamp(Number(fraction) || 0, 0, 1);
  const base = parseHexRgb(baseHex);
  const mix = parseHexRgb(mixHexValue);
  const out = {
    r: Math.round(base.r + (mix.r - base.r) * t),
    g: Math.round(base.g + (mix.g - base.g) * t),
    b: Math.round(base.b + (mix.b - base.b) * t),
  };
  return `#${((out.r << 16) | (out.g << 8) | out.b).toString(16).padStart(6, "0")}`;
}

function normalizePlanarVector(x, y, fallback = { x: 1, y: 0 }) {
  const mag = Math.hypot(x, y);
  if (!(mag > 0)) return fallback;
  return { x: x / mag, y: y / mag };
}

export function hexToColorNumber(hex, fallback = 0xffffff) {
  const raw = String(hex || "")
    .trim()
    .replace(/^#/, "");
  return /^[0-9a-f]{6}$/i.test(raw) ? Number.parseInt(raw, 16) : fallback;
}

function resolveActivityLevel(activityState, activeNow) {
  const state = String(activityState || "")
    .trim()
    .toLowerCase();
  if (state === "active") return 1;
  if (state === "weakly active") return 0.58;
  return activeNow ? 0.45 : 0.12;
}

export function resolveCometAppearance({ comet = null, cometModel = null } = {}) {
  const volatileClass = normalizeVolatileClass(
    comet?.volatileClass ||
      cometModel?.inputs?.volatileClass ||
      cometModel?.classification?.volatileClass,
  );
  const preset = COMET_APPEARANCE_PRESETS[volatileClass];
  const activityState =
    cometModel?.display?.activityState ||
    cometModel?.activity?.state ||
    comet?.activityState ||
    "Dormant";
  const activeNow =
    cometModel?.activity?.activeNow != null ? !!cometModel.activity.activeNow : !!comet?.activeNow;
  const activityLevel = resolveActivityLevel(activityState, activeNow);
  const dustToGasRatio = clamp(
    Number(comet?.dustToGasRatio ?? cometModel?.inputs?.dustToGasRatio ?? 1.2) || 1.2,
    0.5,
    4,
  );
  const dustBias = clamp((dustToGasRatio - 0.5) / 3.5, 0, 1);
  const ionBias = clamp(1 - dustBias * 0.55, 0.35, 1);
  const volatileLabel =
    cometModel?.classification?.volatileLabel ||
    cometModel?.display?.volatileClass ||
    comet?.volatileLabel ||
    preset.label;
  return {
    volatileClass,
    volatileLabel,
    activityState,
    activityLevel,
    dustToGasRatio,
    dustBias,
    ionBias,
    label: preset.label,
    description: preset.description,
    nucleusCoreHex: mixHex(preset.nucleusCoreHex, "#ffffff", 0.1 + activityLevel * 0.18),
    nucleusHaloHex: mixHex(preset.nucleusHaloHex, "#ffffff", activityLevel * 0.08),
    comaHex: mixHex(preset.comaHex, "#ffffff", activityLevel * 0.05),
    dustTailHex: mixHex(preset.dustTailHex, "#fff5ea", dustBias * 0.12),
    ionTailHex: mixHex(preset.ionTailHex, "#ffffff", activityLevel * 0.08),
    orbitHex: preset.orbitHex,
    bgInnerHex: preset.bgInnerHex,
    bgOuterHex: preset.bgOuterHex,
    sparkleHex: preset.sparkleHex,
    meta: `${volatileLabel} | ${activityState}`,
  };
}

export function resolveCometTailDirections({ cometPos, futurePos, starPos, dustBias = 0.5 } = {}) {
  const antiSolarDir = normalizePlanarVector(
    Number(cometPos?.x) - Number(starPos?.x),
    Number(cometPos?.y) - Number(starPos?.y),
    { x: 1, y: 0 },
  );
  const velocityDir = normalizePlanarVector(
    Number(futurePos?.x) - Number(cometPos?.x),
    Number(futurePos?.y) - Number(cometPos?.y),
    antiSolarDir,
  );
  const trailingDir = normalizePlanarVector(-velocityDir.x, -velocityDir.y, antiSolarDir);
  const dustMix = clamp(Number(dustBias) || 0.5, 0, 1);
  const dustControlDir = normalizePlanarVector(
    antiSolarDir.x * 0.72 + trailingDir.x * (0.42 + dustMix * 0.12),
    antiSolarDir.y * 0.72 + trailingDir.y * (0.42 + dustMix * 0.12),
    antiSolarDir,
  );
  const dustDir = normalizePlanarVector(
    antiSolarDir.x * (0.16 + (1 - dustMix) * 0.08) + trailingDir.x * (0.92 + dustMix * 0.18),
    antiSolarDir.y * (0.16 + (1 - dustMix) * 0.08) + trailingDir.y * (0.92 + dustMix * 0.18),
    trailingDir,
  );
  return {
    antiSolarDir,
    velocityDir,
    trailingDir,
    dustControlDir,
    dustDir,
  };
}

export function buildCometParticleLayout({ comet = null, cometModel = null, seed = "" } = {}) {
  const appearance = resolveCometAppearance({ comet, cometModel });
  const activityLevel = clamp(Number(appearance.activityLevel) || 0, 0, 1);
  const dustBias = clamp(Number(appearance.dustBias) || 0, 0, 1);
  const ionBias = clamp(Number(appearance.ionBias) || 0.35, 0.35, 1);
  const rng = seededRng(
    `${seed || comet?.id || cometModel?.inputs?.id || appearance.volatileClass}:` +
      `${appearance.activityState}:${appearance.dustToGasRatio}:${appearance.volatileClass}`,
  );
  const dustCount = Math.max(16, Math.round(18 + activityLevel * 28 + dustBias * 12));
  const ionCount = Math.max(10, Math.round(10 + activityLevel * 18 + ionBias * 8));
  const comaCount = Math.max(12, Math.round(12 + activityLevel * 22));
  const dustParticles = [];
  const ionParticles = [];
  const comaParticles = [];

  for (let i = 0; i < dustCount; i += 1) {
    const t = Math.pow(rng(), 0.88);
    const spread = (0.035 + 0.22 * t) * (0.8 + dustBias * 0.75);
    dustParticles.push({
      t,
      lateral: (rng() * 2 - 1) * spread * (0.45 + rng() * 0.9),
      alpha: clamp((0.18 + (1 - t) * 0.52) * (0.42 + activityLevel * 0.58), 0.08, 0.95),
      size: 0.7 + (1 - t) * 1.2 + dustBias * 0.35 + rng() * 0.25,
    });
  }

  for (let i = 0; i < ionCount; i += 1) {
    const t = Math.pow(rng(), 0.95);
    ionParticles.push({
      t,
      lateral: (rng() * 2 - 1) * (0.012 + 0.05 * t) * (0.65 + (1 - ionBias) * 0.4),
      alpha: clamp((0.22 + (1 - t) * 0.5) * (0.38 + activityLevel * 0.62), 0.1, 0.92),
      size: 0.55 + (1 - t) * 0.8 + ionBias * 0.22 + rng() * 0.18,
    });
  }

  for (let i = 0; i < comaCount; i += 1) {
    const radiusNorm = Math.pow(rng(), 1.55);
    const angle = rng() * Math.PI * 2;
    comaParticles.push({
      radiusNorm,
      angle,
      alpha: clamp((1 - radiusNorm) * (0.22 + activityLevel * 0.42), 0.05, 0.84),
      size: 0.5 + (1 - radiusNorm) * 1.3 + rng() * 0.2,
    });
  }

  return {
    appearance,
    dustParticles,
    ionParticles,
    comaParticles,
  };
}

function drawParticle(ctx, x, y, radius, color, alpha) {
  ctx.beginPath();
  ctx.fillStyle = rgba(color, alpha);
  ctx.arc(x, y, Math.max(0.4, radius), 0, Math.PI * 2);
  ctx.fill();
}

function quadraticPoint(sx, sy, cx, cy, ex, ey, t) {
  const inv = 1 - t;
  return {
    x: inv * inv * sx + 2 * inv * t * cx + t * t * ex,
    y: inv * inv * sy + 2 * inv * t * cy + t * t * ey,
  };
}

function offsetPointInFrame(base, axis, normal, along, offset = 0) {
  return {
    x: base.x + axis.x * along + normal.x * offset,
    y: base.y + axis.y * along + normal.y * offset,
  };
}

function resolveTailNormal(axis, preferredNormal = null) {
  let normal = normalizePlanarVector(-axis.y, axis.x, { x: 0, y: 1 });
  if (preferredNormal) {
    const preferred = normalizePlanarVector(preferredNormal.x, preferredNormal.y, normal);
    if (normal.x * preferred.x + normal.y * preferred.y < 0) {
      normal = { x: -normal.x, y: -normal.y };
    }
  }
  return normal;
}

export function buildCometTailGeometry({
  tailBase,
  tailDir,
  preferredNormal = null,
  dustLength = 0,
  ionLength = 0,
  baseFlare = 0,
} = {}) {
  const base = {
    x: Number(tailBase?.x) || 0,
    y: Number(tailBase?.y) || 0,
  };
  const tailAxis = normalizePlanarVector(Number(tailDir?.x), Number(tailDir?.y), { x: -1, y: 0 });
  const tailNormal = resolveTailNormal(tailAxis, preferredNormal);
  const safeDustLength = Math.max(0, Number(dustLength) || 0);
  const safeIonLength = Math.max(0, Number(ionLength) || 0);
  const safeBaseFlare = Math.max(0, Number(baseFlare) || 0);
  return {
    tailBase: base,
    tailAxis,
    tailNormal,
    ionEnd: offsetPointInFrame(base, tailAxis, tailNormal, safeIonLength, -safeIonLength * 0.12),
    dustUpperControl: offsetPointInFrame(
      base,
      tailAxis,
      tailNormal,
      safeDustLength * 0.42,
      -safeDustLength * 0.18,
    ),
    dustTip: offsetPointInFrame(base, tailAxis, tailNormal, safeDustLength, safeDustLength * 0.1),
    dustLowerControl: offsetPointInFrame(
      base,
      tailAxis,
      tailNormal,
      safeDustLength * 0.54,
      safeDustLength * 0.18,
    ),
    dustBaseReturn: offsetPointInFrame(base, tailAxis, tailNormal, 0, safeBaseFlare),
  };
}

export function paintCometPreview(canvas, appearance) {
  if (!canvas || typeof canvas.getContext !== "function" || !appearance) return;
  let ctx = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    ctx = null;
  }
  if (!ctx) return;
  const width = Number(canvas.width) || 180;
  const height = Number(canvas.height) || 180;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const nucleusX = width * 0.62;
  const nucleusY = height * 0.55;
  const activityLevel = clamp(Number(appearance.activityLevel) || 0, 0, 1);
  const dustBias = clamp(Number(appearance.dustBias) || 0, 0, 1);
  const ionBias = clamp(Number(appearance.ionBias) || 0, 0, 1);
  const {
    dustParticles = [],
    ionParticles = [],
    comaParticles = [],
  } = buildCometParticleLayout({ comet: appearance, seed: `${appearance.volatileClass}:preview` });

  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createRadialGradient(cx, cy, 6, cx, cy, Math.max(width, height) * 0.58);
  bg.addColorStop(0, appearance.bgInnerHex);
  bg.addColorStop(1, appearance.bgOuterHex);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = rgba(appearance.orbitHex, 0.36);
  ctx.lineWidth = 1.35;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy + 4, width * 0.38, height * 0.25, -0.34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const dustLen = width * (0.18 + activityLevel * (0.18 + dustBias * 0.08));
  const ionLen = width * (0.12 + activityLevel * (0.2 + ionBias * 0.1));
  const tailBaseX = nucleusX - 2;
  const tailBaseY = nucleusY - 1;
  const tailGeometry = buildCometTailGeometry({
    tailBase: { x: tailBaseX, y: tailBaseY },
    tailDir: { x: -1, y: 0 },
    preferredNormal: { x: 0, y: 1 },
    dustLength: dustLen,
    ionLength: ionLen,
    baseFlare: 5 + dustBias * 3,
  });

  if (activityLevel > 0.16) {
    const dustGradient = ctx.createLinearGradient(
      tailGeometry.dustTip.x,
      tailGeometry.dustTip.y + dustLen * 0.06,
      tailGeometry.tailBase.x,
      tailGeometry.tailBase.y,
    );
    dustGradient.addColorStop(0, rgba(appearance.dustTailHex, 0));
    dustGradient.addColorStop(0.35, rgba(appearance.dustTailHex, 0.18 + dustBias * 0.2));
    dustGradient.addColorStop(1, rgba(appearance.dustTailHex, 0.52));
    ctx.fillStyle = dustGradient;
    ctx.beginPath();
    ctx.moveTo(tailGeometry.tailBase.x, tailGeometry.tailBase.y);
    ctx.quadraticCurveTo(
      tailGeometry.dustUpperControl.x,
      tailGeometry.dustUpperControl.y,
      tailGeometry.dustTip.x,
      tailGeometry.dustTip.y,
    );
    ctx.quadraticCurveTo(
      tailGeometry.dustLowerControl.x,
      tailGeometry.dustLowerControl.y,
      tailGeometry.dustBaseReturn.x,
      tailGeometry.dustBaseReturn.y,
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(appearance.ionTailHex, 0.62 + activityLevel * 0.16);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(tailGeometry.tailBase.x, tailGeometry.tailBase.y);
    ctx.lineTo(tailGeometry.ionEnd.x, tailGeometry.ionEnd.y);
    ctx.stroke();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const particle of dustParticles) {
      const p = quadraticPoint(
        tailGeometry.tailBase.x,
        tailGeometry.tailBase.y,
        tailGeometry.dustUpperControl.x,
        tailGeometry.dustUpperControl.y,
        tailGeometry.dustTip.x,
        tailGeometry.dustTip.y,
        particle.t,
      );
      const spread = dustLen * particle.lateral;
      drawParticle(
        ctx,
        p.x + tailGeometry.tailNormal.x * spread,
        p.y + tailGeometry.tailNormal.y * spread,
        particle.size,
        appearance.dustTailHex,
        particle.alpha,
      );
    }
    for (const particle of ionParticles) {
      const x =
        tailGeometry.tailBase.x +
        (tailGeometry.ionEnd.x - tailGeometry.tailBase.x) * particle.t +
        tailGeometry.tailNormal.x * ionLen * particle.lateral;
      const y =
        tailGeometry.tailBase.y +
        (tailGeometry.ionEnd.y - tailGeometry.tailBase.y) * particle.t +
        tailGeometry.tailNormal.y * ionLen * particle.lateral;
      drawParticle(ctx, x, y, particle.size, appearance.ionTailHex, particle.alpha);
    }
    ctx.restore();
  }

  const comaRadius = 14 + activityLevel * 16;
  const coma = ctx.createRadialGradient(nucleusX, nucleusY, 0, nucleusX, nucleusY, comaRadius);
  coma.addColorStop(0, rgba(appearance.comaHex, 0.38 + activityLevel * 0.18));
  coma.addColorStop(0.55, rgba(appearance.comaHex, 0.16 + activityLevel * 0.12));
  coma.addColorStop(1, rgba(appearance.comaHex, 0));
  ctx.fillStyle = coma;
  ctx.beginPath();
  ctx.arc(nucleusX, nucleusY, comaRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const particle of comaParticles) {
    const radius = comaRadius * particle.radiusNorm;
    drawParticle(
      ctx,
      nucleusX + Math.cos(particle.angle) * radius,
      nucleusY + Math.sin(particle.angle) * radius,
      particle.size,
      appearance.comaHex,
      particle.alpha,
    );
  }
  ctx.restore();

  const halo = ctx.createRadialGradient(nucleusX, nucleusY, 0, nucleusX, nucleusY, 10);
  halo.addColorStop(0, rgba(appearance.nucleusHaloHex, 0.65));
  halo.addColorStop(1, rgba(appearance.nucleusHaloHex, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(nucleusX, nucleusY, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = appearance.nucleusCoreHex;
  ctx.beginPath();
  ctx.arc(nucleusX, nucleusY, 4.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgba(appearance.sparkleHex, 0.8);
  ctx.beginPath();
  ctx.arc(nucleusX - 1.5, nucleusY - 1.8, 1.4, 0, Math.PI * 2);
  ctx.fill();
}
