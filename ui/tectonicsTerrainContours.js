function interpolatePoint(level, a, b, ax, ay, bx, by) {
  const denom = b - a;
  const t = Math.abs(denom) < 1e-9 ? 0.5 : (level - a) / denom;
  return {
    x: ax + (bx - ax) * t,
    y: ay + (by - ay) * t,
  };
}

function crosses(level, a, b) {
  return (a < level && b >= level) || (a >= level && b < level);
}

function traceTopographyContourSegments(
  raster,
  { stepM = 250, majorEvery = 5, showMinorContours = true, showOceanContours = true } = {},
  onSegment,
) {
  if (
    !(raster?.contourHeights?.length || raster?.heights?.length) ||
    typeof onSegment !== "function"
  )
    return;
  const width = Number(raster.width) || 0;
  const height = Number(raster.height) || 0;
  if (width < 2 || height < 2) return;

  const heights = raster.contourHeights?.length ? raster.contourHeights : raster.heights;
  const step = Math.max(25, Number(stepM) || 250);
  const majorInterval = Math.max(step, step * Math.max(1, Number(majorEvery) || 5));

  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const tl = heights[y * width + x];
      const tr = heights[y * width + x + 1];
      const bl = heights[(y + 1) * width + x];
      const br = heights[(y + 1) * width + x + 1];

      if (![tl, tr, bl, br].every(Number.isFinite)) continue;
      const minHeight = Math.min(tl, tr, bl, br);
      const maxHeight = Math.max(tl, tr, bl, br);

      const firstLevel = Math.ceil(minHeight / step) * step;
      const lastLevel = Math.floor(maxHeight / step) * step;
      if (firstLevel > lastLevel) continue;

      for (let level = firstLevel; level <= lastLevel; level += step) {
        const intersections = [];
        if (crosses(level, tl, tr)) {
          intersections.push(interpolatePoint(level, tl, tr, x, y, x + 1, y));
        }
        if (crosses(level, tr, br)) {
          intersections.push(interpolatePoint(level, tr, br, x + 1, y, x + 1, y + 1));
        }
        if (crosses(level, bl, br)) {
          intersections.push(interpolatePoint(level, bl, br, x, y + 1, x + 1, y + 1));
        }
        if (crosses(level, tl, bl)) {
          intersections.push(interpolatePoint(level, tl, bl, x, y, x, y + 1));
        }

        if (intersections.length < 2) continue;
        const kind =
          level === 0
            ? "coast"
            : Math.abs(level % majorInterval) < 1e-6
              ? level < 0
                ? "majorOcean"
                : "majorLand"
              : level < 0
                ? "minorOcean"
                : "minorLand";

        if (!showMinorContours && (kind === "minorLand" || kind === "minorOcean")) continue;
        if (!showOceanContours && (kind === "minorOcean" || kind === "majorOcean")) continue;

        if (intersections.length === 2) {
          onSegment(kind, intersections[0], intersections[1], level);
          continue;
        }

        if (intersections.length === 4) {
          const center = (tl + tr + bl + br) * 0.25;
          if (center >= level) {
            onSegment(kind, intersections[0], intersections[3], level);
            onSegment(kind, intersections[1], intersections[2], level);
          } else {
            onSegment(kind, intersections[0], intersections[1], level);
            onSegment(kind, intersections[2], intersections[3], level);
          }
        }
      }
    }
  }
}

function buildContourGroupKey(kind, level) {
  return `${kind}:${level}`;
}

function buildEndpointKey(point) {
  return `${Math.round(point.x * 10000)},${Math.round(point.y * 10000)}`;
}

function appendPoint(path, point) {
  const last = path[path.length - 1];
  if (!last || last.x !== point.x || last.y !== point.y) {
    path.push(point);
  }
}

function prependPoint(path, point) {
  const first = path[0];
  if (!first || first.x !== point.x || first.y !== point.y) {
    path.unshift(point);
  }
}

function normalizeContourPathPoints(points) {
  const normalized = [];
  for (const point of points) {
    const last = normalized[normalized.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) {
      normalized.push(point);
    }
  }
  if (normalized.length > 2) {
    const first = normalized[0];
    const last = normalized[normalized.length - 1];
    if (first.x === last.x && first.y === last.y) {
      normalized.pop();
    }
  }
  return normalized;
}

function consumeMatchingSegment(segments, endpointMap, endpointKey, used) {
  const candidates = endpointMap.get(endpointKey);
  if (!candidates) return null;
  while (candidates.length) {
    const candidate = candidates.pop();
    if (!used.has(candidate.segmentIndex)) {
      return candidate;
    }
  }
  return null;
}

function stitchContourSegments(segments) {
  if (!segments.length) return [];

  const endpointMap = new Map();
  segments.forEach((segment, segmentIndex) => {
    const aKey = buildEndpointKey(segment.from);
    const bKey = buildEndpointKey(segment.to);
    const aList = endpointMap.get(aKey) || [];
    aList.push({ segmentIndex, side: "from" });
    endpointMap.set(aKey, aList);
    const bList = endpointMap.get(bKey) || [];
    bList.push({ segmentIndex, side: "to" });
    endpointMap.set(bKey, bList);
  });

  const used = new Set();
  const paths = [];

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
    if (used.has(segmentIndex)) continue;
    used.add(segmentIndex);
    const seed = segments[segmentIndex];
    const path = [seed.from, seed.to];

    let extended = true;
    while (extended) {
      extended = false;

      const startKey = buildEndpointKey(path[0]);
      const startMatch = consumeMatchingSegment(segments, endpointMap, startKey, used);
      if (startMatch) {
        const match = segments[startMatch.segmentIndex];
        used.add(startMatch.segmentIndex);
        const otherPoint = startMatch.side === "from" ? match.to : match.from;
        prependPoint(path, otherPoint);
        extended = true;
      }

      const endKey = buildEndpointKey(path[path.length - 1]);
      const endMatch = consumeMatchingSegment(segments, endpointMap, endKey, used);
      if (endMatch) {
        const match = segments[endMatch.segmentIndex];
        used.add(endMatch.segmentIndex);
        const otherPoint = endMatch.side === "from" ? match.to : match.from;
        appendPoint(path, otherPoint);
        extended = true;
      }
    }

    paths.push(path);
  }

  return paths;
}

function buildTopographyContourPaths(raster, options = {}) {
  const grouped = new Map();
  traceTopographyContourSegments(raster, options, (kind, from, to, level) => {
    const key = buildContourGroupKey(kind, level);
    const segments = grouped.get(key) || [];
    segments.push({ from, to, kind, level });
    grouped.set(key, segments);
  });

  const paths = [];
  for (const segments of grouped.values()) {
    const stitched = stitchContourSegments(segments);
    for (const points of stitched) {
      const normalizedPoints = normalizeContourPathPoints(points);
      if (normalizedPoints.length >= 2) {
        paths.push({
          kind: segments[0].kind,
          level: segments[0].level,
          points: normalizedPoints,
        });
      }
    }
  }
  return paths;
}

export function collectTopographyContourStats(raster, options = {}) {
  const counts = {
    minorLand: 0,
    majorLand: 0,
    minorOcean: 0,
    majorOcean: 0,
    coast: 0,
  };
  const paths = buildTopographyContourPaths(raster, options);
  for (const path of paths) {
    counts[path.kind] = (counts[path.kind] || 0) + Math.max(1, path.points.length - 1);
  }
  return counts;
}

export function collectTopographyContourPathStats(raster, options = {}) {
  const counts = {
    minorLand: 0,
    majorLand: 0,
    minorOcean: 0,
    majorOcean: 0,
    coast: 0,
  };
  const paths = buildTopographyContourPaths(raster, options);
  for (const path of paths) {
    counts[path.kind] = (counts[path.kind] || 0) + 1;
  }
  return counts;
}

export function collectTopographyContours(raster, options = {}) {
  return buildTopographyContourPaths(raster, options).map((path) => ({
    kind: path.kind,
    level: path.level,
    points: path.points.map((point) => ({ x: point.x, y: point.y })),
  }));
}

export function drawTopographyContours(ctx, raster, options = {}) {
  if (!ctx || !raster) return;
  const coastlineEmphasis = clamp(Number(options.coastlineEmphasis) || 1, 0, 2.5);
  const coastWidthScale = 0.85 + coastlineEmphasis * 0.45;
  const coastGlowAlpha = 0.18 + coastlineEmphasis * 0.14;
  const coastCoreAlpha = 0.62 + coastlineEmphasis * 0.28;

  const showMinorContours = options.showMinorContours !== false;
  const showOceanContours = options.showOceanContours !== false;
  const styles = {
    minorLand: [
      { strokeStyle: "rgba(250, 247, 232, 0.36)", lineWidth: 2.05 },
      { strokeStyle: "rgba(78, 60, 40, 0.82)", lineWidth: 1.12 },
    ],
    majorLand: [
      { strokeStyle: "rgba(250, 247, 232, 0.42)", lineWidth: 2.55 },
      { strokeStyle: "rgba(76, 58, 38, 0.96)", lineWidth: 1.62 },
    ],
    minorOcean: [
      { strokeStyle: "rgba(196, 227, 255, 0.3)", lineWidth: 1.92 },
      { strokeStyle: "rgba(8, 40, 96, 0.76)", lineWidth: 1.02 },
    ],
    majorOcean: [
      { strokeStyle: "rgba(196, 227, 255, 0.36)", lineWidth: 2.35 },
      { strokeStyle: "rgba(8, 40, 96, 0.92)", lineWidth: 1.42 },
    ],
    coast: [
      {
        strokeStyle: `rgba(9, 29, 58, ${clamp(coastGlowAlpha + 0.08, 0.18, 0.62).toFixed(3)})`,
        lineWidth: 2.6 * coastWidthScale,
      },
      {
        strokeStyle: `rgba(250, 252, 255, ${clamp(coastCoreAlpha + 0.1, 0.58, 1).toFixed(3)})`,
        lineWidth: 1.5 * coastWidthScale,
      },
    ],
  };

  const contourPaths = buildTopographyContourPaths(raster, options);
  const groupedPaths = new Map();
  for (const path of contourPaths) {
    const group = groupedPaths.get(path.kind) || [];
    group.push(path);
    groupedPaths.set(path.kind, group);
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [kind, passes] of Object.entries(styles)) {
    if (!showMinorContours && (kind === "minorLand" || kind === "minorOcean")) continue;
    if (!showOceanContours && (kind === "minorOcean" || kind === "majorOcean")) continue;
    const groupPaths = groupedPaths.get(kind) || [];
    if (!groupPaths.length) continue;
    for (const pass of passes) {
      ctx.strokeStyle = pass.strokeStyle;
      ctx.lineWidth = pass.lineWidth;
      ctx.beginPath();
      for (const path of groupPaths) {
        ctx.moveTo(path.points[0].x + 0.5, path.points[0].y + 0.5);
        for (let i = 1; i < path.points.length; i += 1) {
          ctx.lineTo(path.points[i].x + 0.5, path.points[i].y + 0.5);
        }
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
