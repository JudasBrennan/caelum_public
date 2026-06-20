// Lightweight starbirth splash overlay. It avoids startup 3D dependencies and
// uses a small canvas scene so the first-load moment can feel rich without
// delaying the app behind it.

import { APP_NAME, APP_SLOGAN, APP_SLOGAN_TRANSLATION } from "./appIdentity.js";

const SPLASH_ENTER_REVEAL_MS = 900;
const SPLASH_DISMISS_FALLBACK_MS = 600;
const STAR_COUNT = 180;
const STARBIRTH_DURATION_MS = 2200;
const CONSTELLATION_REVEAL_DELAY_MS = 200;
const CONSTELLATION_REVEAL_DELAY_PROGRESS = CONSTELLATION_REVEAL_DELAY_MS / STARBIRTH_DURATION_MS;
const CONSTELLATION_PALETTE = Object.freeze([
  "159, 215, 255",
  "130, 226, 204",
  "255, 220, 150",
  "192, 208, 255",
]);
const CONSTELLATION_ZONES = Object.freeze([
  { center: [0.18, 0.26], jitter: [0.035, 0.04], scale: 0.095, rotation: -0.08 },
  { center: [0.82, 0.25], jitter: [0.035, 0.04], scale: 0.095, rotation: 0.08 },
  { center: [0.2, 0.7], jitter: [0.035, 0.035], scale: 0.085, rotation: 0.12 },
  { center: [0.8, 0.69], jitter: [0.035, 0.035], scale: 0.085, rotation: -0.12 },
  { center: [0.5, 0.16], jitter: [0.06, 0.025], scale: 0.078, rotation: 0 },
]);
const CONSTELLATION_TEMPLATES = Object.freeze([
  {
    name: "Orion hourglass",
    points: [
      [-0.72, -0.72],
      [0.62, -0.66],
      [-0.25, -0.12],
      [0, -0.08],
      [0.26, -0.04],
      [-0.64, 0.78],
      [0.72, 0.7],
      [0.08, 0.56],
    ],
    segments: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
      [3, 7],
    ],
  },
  {
    name: "Cassiopeia W",
    points: [
      [-0.9, -0.22],
      [-0.44, -0.6],
      [0, -0.16],
      [0.44, -0.56],
      [0.9, 0.12],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    name: "Cygnus cross",
    points: [
      [0, -0.9],
      [0, -0.32],
      [0, 0.28],
      [0, 0.9],
      [-0.62, 0.04],
      [0.62, 0.04],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [4, 2],
      [2, 5],
    ],
  },
  {
    name: "Lyra kite",
    points: [
      [0, -0.78],
      [0.6, -0.08],
      [0.18, 0.7],
      [-0.62, 0.16],
      [-0.08, -0.16],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 1],
    ],
  },
  {
    name: "Scorpius hook",
    points: [
      [-0.82, -0.54],
      [-0.48, -0.3],
      [-0.16, -0.06],
      [0.12, 0.23],
      [0.4, 0.48],
      [0.68, 0.36],
      [0.86, 0.1],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    name: "Ursa dipper",
    points: [
      [-0.9, -0.18],
      [-0.56, -0.38],
      [-0.16, -0.3],
      [0.14, -0.08],
      [0.52, 0.02],
      [0.78, 0.34],
      [0.36, 0.3],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
  },
  {
    name: "Corona arc",
    points: [
      [-0.82, 0.2],
      [-0.46, -0.18],
      [0, -0.34],
      [0.46, -0.18],
      [0.82, 0.2],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    name: "Delphinus diamond",
    points: [
      [-0.22, -0.46],
      [0.38, -0.34],
      [0.5, 0.18],
      [-0.08, 0.4],
      [-0.66, 0.02],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
    ],
  },
  {
    name: "Pegasus square",
    points: [
      [-0.7, -0.56],
      [0.34, -0.66],
      [0.6, 0.34],
      [-0.54, 0.46],
      [-0.96, 0.08],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
    ],
  },
  {
    name: "Aquila wings",
    points: [
      [0, -0.78],
      [-0.58, -0.12],
      [0, 0.04],
      [0.58, -0.12],
      [-0.28, 0.64],
      [0.3, 0.58],
    ],
    segments: [
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
      [2, 5],
    ],
  },
  {
    name: "Taurus V",
    points: [
      [-0.78, -0.42],
      [-0.32, -0.08],
      [0, 0.14],
      [0.36, -0.1],
      [0.82, -0.42],
      [0.08, 0.68],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
    ],
  },
  {
    name: "Leo sickle",
    points: [
      [-0.86, 0.18],
      [-0.48, -0.1],
      [-0.12, -0.3],
      [0.22, -0.12],
      [0.3, 0.24],
      [0.04, 0.54],
      [0.74, 0.42],
    ],
    segments: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [4, 6],
    ],
  },
]);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function shuffleCopy(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / Math.max(edge1 - edge0, 0.0001));
  return t * t * (3 - 2 * t);
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function createStar(seedIndex) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.12 + Math.random() * 0.9;
  return {
    angle,
    radius,
    size: 0.55 + Math.random() * 1.9,
    delay: Math.random() * 0.45,
    drift: 0.04 + Math.random() * 0.12,
    twinkle: Math.random() * Math.PI * 2,
    tint:
      seedIndex % 7 === 0
        ? "255, 220, 150"
        : seedIndex % 5 === 0
          ? "126, 220, 205"
          : "210, 228, 255",
  };
}

function createConstellationInstances(metrics) {
  const canFitThree = metrics.width >= 760 && metrics.height >= 560;
  const count = canFitThree && Math.random() < 0.55 ? 3 : 2;
  const templates = shuffleCopy(CONSTELLATION_TEMPLATES);
  const zones = shuffleCopy(CONSTELLATION_ZONES);

  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length];
    const zone = zones[index % zones.length];
    return {
      points: template.points,
      segments: template.segments,
      tint: CONSTELLATION_PALETTE[Math.floor(Math.random() * CONSTELLATION_PALETTE.length)],
      center: [
        clamp(zone.center[0] + randomBetween(-zone.jitter[0], zone.jitter[0]), 0.1, 0.9),
        clamp(zone.center[1] + randomBetween(-zone.jitter[1], zone.jitter[1]), 0.12, 0.86),
      ],
      scale: zone.scale * randomBetween(0.88, 1.1),
      rotation: zone.rotation + randomBetween(-0.18, 0.18),
      mirrorX: Math.random() < 0.5,
    };
  });
}

function resizeCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, window.innerWidth || canvas.clientWidth || 1);
  const height = Math.max(1, window.innerHeight || canvas.clientHeight || 1);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return { dpr, width, height };
}

function drawGlow(ctx, cx, cy, radius, alpha) {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(255, 241, 194, ${0.95 * alpha})`);
  gradient.addColorStop(0.14, `rgba(138, 201, 255, ${0.32 * alpha})`);
  gradient.addColorStop(0.36, `rgba(78, 222, 202, ${0.16 * alpha})`);
  gradient.addColorStop(1, "rgba(3, 7, 18, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function transformConstellationPoint(point, constellation, width, height) {
  const minDimension = Math.min(width, height);
  const scale = minDimension * constellation.scale;
  const mirroredX = constellation.mirrorX ? -point[0] : point[0];
  const localX = mirroredX * scale;
  const localY = point[1] * scale;
  const cos = Math.cos(constellation.rotation);
  const sin = Math.sin(constellation.rotation);

  return [
    constellation.center[0] * width + localX * cos - localY * sin,
    constellation.center[1] * height + localX * sin + localY * cos,
  ];
}

function drawConstellations(ctx, constellations, width, height, dpr, progress) {
  const alpha = smoothstep(
    0.54 + CONSTELLATION_REVEAL_DELAY_PROGRESS,
    0.92 + CONSTELLATION_REVEAL_DELAY_PROGRESS,
    progress,
  );
  if (alpha <= 0) return;

  for (const constellation of constellations) {
    const points = constellation.points.map((point) =>
      transformConstellationPoint(point, constellation, width, height),
    );

    ctx.lineWidth = 0.8 * dpr;
    ctx.strokeStyle = `rgba(${constellation.tint}, ${0.32 * alpha})`;
    ctx.beginPath();
    for (const [fromIndex, toIndex] of constellation.segments) {
      const from = points[fromIndex];
      const to = points[toIndex];
      if (!from || !to) continue;
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
    }
    ctx.stroke();

    for (const [x, y] of points) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 8 * dpr);
      glow.addColorStop(0, `rgba(${constellation.tint}, ${0.46 * alpha})`);
      glow.addColorStop(1, "rgba(3, 7, 18, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 8 * dpr, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(238, 248, 255, ${0.9 * alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.9 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStarfield(ctx, stars, constellations, metrics, elapsedMs, reduceMotion = false) {
  const { dpr, width, height } = metrics;
  const w = width * dpr;
  const h = height * dpr;
  const cx = w * 0.5;
  const cy = h * 0.47;
  const maxRadius = Math.hypot(w, h) * 0.52;
  const baseRadius = Math.min(w, h) * 0.34;
  const progress = reduceMotion ? 1 : clamp01(elapsedMs / STARBIRTH_DURATION_MS);
  const expansion = reduceMotion ? 1 : smoothstep(0.03, 0.88, progress);
  const firstLight = reduceMotion ? 0.72 : smoothstep(0, 0.32, progress);

  ctx.clearRect(0, 0, w, h);

  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, "#02040d");
  sky.addColorStop(0.48, "#071326");
  sky.addColorStop(1, "#030712");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  drawGlow(ctx, cx, cy, baseRadius * (0.8 + firstLight * 0.9), firstLight);

  for (const star of stars) {
    const born = smoothstep(star.delay, star.delay + 0.42, progress);
    if (born <= 0) continue;
    const distance = maxRadius * star.radius * (0.12 + expansion * 0.94);
    const swirl = star.angle + expansion * star.drift * (reduceMotion ? 0 : 0.62);
    const x = cx + Math.cos(swirl) * distance;
    const y = cy + Math.sin(swirl) * distance * 0.72;
    const pulse = reduceMotion ? 0.74 : 0.68 + Math.sin(elapsedMs * 0.004 + star.twinkle) * 0.24;
    const alpha = clamp01(born * pulse);

    ctx.fillStyle = `rgba(${star.tint}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, star.size * dpr, 0, Math.PI * 2);
    ctx.fill();
  }

  drawConstellations(ctx, constellations, w, h, dpr, progress);

  ctx.fillStyle = `rgba(255, 244, 204, ${0.86 * firstLight})`;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(2.5 * dpr, baseRadius * 0.018), 0, Math.PI * 2);
  ctx.fill();
}

function buildStarbirthScene(canvas) {
  let ctx = null;
  try {
    ctx = canvas.getContext("2d", { alpha: false });
  } catch {
    ctx = null;
  }

  if (!ctx) {
    return {
      ready: false,
      resize() {},
      dispose() {},
    };
  }

  const reduceMotion = prefersReducedMotion();
  const stars = Array.from({ length: STAR_COUNT }, (_, index) => createStar(index));
  let metrics = resizeCanvas(canvas);
  const constellations = createConstellationInstances(metrics);
  let disposed = false;
  let animId = null;
  const startedAt = performance.now();

  function render(now = performance.now()) {
    if (disposed) return;
    drawStarfield(ctx, stars, constellations, metrics, now - startedAt, reduceMotion);
    if (!reduceMotion) {
      animId = requestAnimationFrame(render);
    }
  }

  render(startedAt);

  return {
    ready: true,
    resize() {
      metrics = resizeCanvas(canvas);
      drawStarfield(
        ctx,
        stars,
        constellations,
        metrics,
        performance.now() - startedAt,
        reduceMotion,
      );
    },
    dispose() {
      disposed = true;
      if (animId != null) cancelAnimationFrame(animId);
    },
  };
}

export function showSplashOverlay(options = {}) {
  const revealEnterAfterMs = Number.isFinite(options.revealEnterAfterMs)
    ? Math.max(0, options.revealEnterAfterMs)
    : SPLASH_ENTER_REVEAL_MS;
  const dismissFallbackMs = Number.isFinite(options.dismissFallbackMs)
    ? Math.max(0, options.dismissFallbackMs)
    : SPLASH_DISMISS_FALLBACK_MS;

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "splash-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", `${APP_NAME} splash screen`);
    overlay.innerHTML = `
      <canvas class="splash__canvas" aria-hidden="true"></canvas>
      <div class="splash__content">
        <div class="splash__mark" aria-hidden="true">C</div>
        <h1 class="splash__title">${APP_NAME}</h1>
        <div class="splash__subtitle">${APP_SLOGAN}</div>
        <div class="splash__translation">${APP_SLOGAN_TRANSLATION}</div>
        <button class="splash__enter primary">Enter ${APP_NAME}</button>
      </div>
    `;

    const canvas = overlay.querySelector(".splash__canvas");
    const enterBtn = overlay.querySelector(".splash__enter");

    document.body.appendChild(overlay);

    let sceneHandle = buildStarbirthScene(canvas);
    let cleaned = false;

    function revealEnter() {
      if (cleaned) return;
      overlay.classList.add("splash--ready");
      enterBtn.hidden = false;
    }

    const revealTimer = window.setTimeout(revealEnter, revealEnterAfterMs);

    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      window.clearTimeout(revealTimer);
      sceneHandle.dispose();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve();
    }

    function dismiss() {
      if (cleaned) return;
      overlay.classList.add("splash--dismissing");
      overlay.addEventListener("transitionend", cleanup, { once: true });
      window.setTimeout(cleanup, dismissFallbackMs);
    }

    function onResize() {
      sceneHandle.resize();
    }

    function onKeydown(event) {
      if (event.key === "Enter" || event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    }

    enterBtn.hidden = false;
    enterBtn.addEventListener("click", dismiss);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeydown);
    enterBtn.focus({ preventScroll: true });
  });
}
