const COVERAGE_CONTROL_PATHS = Object.freeze([
  "surface.landCoverage",
  "surface.oceanCoverage",
  "surface.iceCoverage",
  "surface.vegetationCoverage",
  "surface.desertCoverage",
  "surface.lavaCoverage",
  "clouds.coverage",
]);

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(1, Math.max(0, number));
}

function getPath(value, path) {
  const parts = String(path || "")
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
  let cursor = value;
  for (const part of parts) {
    if (!isPlainObject(cursor)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function firstFinite(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function controlPathsFromManifest(manifest) {
  const paths = new Set();
  for (const section of manifest?.sections || []) {
    for (const control of section?.controls || []) {
      const path = firstString(control?.path, control?.id, control?.key);
      if (path) paths.add(path);
    }
  }
  return paths;
}

function controlVisible(manifestPaths, path) {
  return manifestPaths.size === 0 || manifestPaths.has(path);
}

function percentLabel(value) {
  const clamped = clamp01(value);
  return clamped == null ? "" : `${Math.round(clamped * 100)}%`;
}

function makeReadout(path, value, explanation, confidence = "medium") {
  const clamped = clamp01(value);
  if (clamped == null) {
    return {
      path,
      value: null,
      percentLabel: "",
      label: "Auto unavailable",
      explanation,
      confidence: "low",
      available: false,
    };
  }
  const label = percentLabel(clamped);
  return {
    path,
    value: clamped,
    percentLabel: label,
    label: `Auto ${label}`,
    explanation,
    confidence,
    available: true,
  };
}

function profileValue(profile, ...paths) {
  for (const path of paths) {
    const number = clamp01(getPath(profile, path));
    if (number != null) return number;
  }
  return null;
}

function averageFinite(...values) {
  const finite = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (!finite.length) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function gasStyleCoverage(styleId, renderFamily) {
  const family = String(renderFamily || "").toLowerCase();
  const style = String(styleId || "").toLowerCase();
  const gasLike =
    family.includes("gas") ||
    family.includes("volatile") ||
    family.includes("brown") ||
    style.includes("jupiter") ||
    style.includes("saturn") ||
    style.includes("neptune");
  if (!gasLike) return null;
  if (style.includes("cloudless") || style.includes("helium") || style.includes("uranus")) {
    return 0.12;
  }
  if (style.includes("neptune") || style.includes("patchy")) return 0.58;
  if (style.includes("hazy") || style.includes("sub-neptune") || style.includes("alkali")) {
    return 0.42;
  }
  if (style.includes("hot") || style.includes("silicate")) return 0.36;
  if (style.includes("saturn") || style.includes("jupiter") || style.includes("water-cloud")) {
    return 0.68;
  }
  return 0.52;
}

function solveSignal(source, path) {
  return getPath(source, path) ?? getPath(source?.derived, path) ?? getPath(source?.inputs, path);
}

function contextSignals({ autoDescriptor, solvedBody, body, classification }) {
  const source = solvedBody || body || {};
  const profile = autoDescriptor?.visualProfile || {};
  const gasProfile = autoDescriptor?.gasProfile || {};
  const hydrosphereLabel = firstString(
    solveSignal(source, "hydrosphere.regime"),
    solveSignal(source, "hydrosphere.hydrosphereState"),
    solveSignal(source, "hydrosphereState"),
    solveSignal(source, "waterRegime"),
  );
  const tempK = firstFinite(
    solveSignal(source, "surfaceTempK"),
    solveSignal(source, "climate.surfaceTempK"),
    solveSignal(source, "temperature.surfaceK"),
  );
  const pressureAtm = firstFinite(
    solveSignal(source, "pressureAtm"),
    solveSignal(source, "atmosphere.surfacePressureAtm"),
    solveSignal(source, "atmosphere.pressureAtm"),
  );
  const h2oPct = firstFinite(
    solveSignal(source, "h2oPct"),
    solveSignal(source, "atmosphere.h2oPct"),
  );
  const co2Pct = firstFinite(
    solveSignal(source, "co2Pct"),
    solveSignal(source, "atmosphere.co2Pct"),
  );
  const axialTiltDeg = firstFinite(solveSignal(source, "axialTiltDeg"));
  const renderFamily = firstString(
    autoDescriptor?.renderFamily,
    classification?.renderFamily,
    classification?.solverFamily,
    classification?.family,
  );
  const subtypeText = [
    firstString(classification?.primarySubtypeId),
    ...(Array.isArray(classification?.subtypes)
      ? classification.subtypes.map((entry) => firstString(entry?.id, entry?.subtypeId, entry))
      : []),
  ]
    .filter(Boolean)
    .join(" ");
  return {
    profile,
    gasProfile,
    hydrosphereLabel,
    tempK,
    pressureAtm,
    h2oPct,
    co2Pct,
    axialTiltDeg,
    renderFamily,
    subtypeText,
    styleId: firstString(
      gasProfile?.styleId,
      autoDescriptor?.styleId,
      autoDescriptor?.baseRecipeId,
    ),
  };
}

function oceanExplanation(signals, oceanCoverage) {
  if (oceanCoverage != null && oceanCoverage <= 0.02) {
    return signals.hydrosphereLabel
      ? `${signals.hydrosphereLabel} hydrosphere leaves little visible surface water.`
      : "Hydrosphere model leaves little visible surface water.";
  }
  if (oceanCoverage != null && oceanCoverage >= 0.9) {
    return signals.hydrosphereLabel
      ? `${signals.hydrosphereLabel} hydrosphere drives a near-global water or ice surface.`
      : "Hydrosphere model drives a near-global water or ice surface.";
  }
  return signals.tempK != null
    ? "Hydrosphere and surface temperature set the visible water fraction."
    : "Hydrosphere model sets the visible water fraction.";
}

function landExplanation() {
  return "Exposed land is the base surface complement; ice, vegetation, desert, and lava are overlays.";
}

function iceExplanation(signals, iceCoverage) {
  if (signals.tempK != null && signals.tempK < 273) {
    return "Low surface temperature and permanent ice support the auto ice overlay.";
  }
  if (signals.axialTiltDeg != null && signals.axialTiltDeg > 35 && iceCoverage > 0.02) {
    return "Axial tilt and polar temperature contrast shape the auto ice caps.";
  }
  return "Temperature and permanent ice fraction shape the auto ice overlay.";
}

function cloudExplanation(signals, cloudCoverage) {
  const gasLike = String(signals.renderFamily || "")
    .toLowerCase()
    .includes("gas");
  if (gasLike || signals.styleId) {
    return "Gas or volatile envelope style sets this visual cloud-deck estimate.";
  }
  if (signals.pressureAtm != null && signals.pressureAtm <= 0) {
    return "No modeled atmosphere leaves the auto cloud layer at zero.";
  }
  if (signals.co2Pct != null && signals.co2Pct > 80 && cloudCoverage > 0.5) {
    return "Dense CO2-rich atmosphere drives a high reflective cloud layer.";
  }
  return "Atmospheric pressure and water vapor drive the auto cloud estimate.";
}

function vegetationExplanation(signals, vegetationCoverage) {
  if (vegetationCoverage != null && vegetationCoverage > 0.02) {
    return "Temperature, exposed land, and vegetation-color signals allow a visual biosphere overlay.";
  }
  return "No strong vegetation-color, temperature, and exposed-land signal is present.";
}

function desertExplanation(signals, desertCoverage) {
  if (desertCoverage != null && desertCoverage > 0.02) {
    return "Dry hydrosphere, warm surface, and exposed land drive the desert overlay.";
  }
  return "Auto recipe does not find a strong warm, dry exposed-land desert signal.";
}

function lavaExplanation(signals, lavaCoverage) {
  const lavaSubtype = String(signals.subtypeText || "")
    .toLowerCase()
    .includes("lava");
  if ((signals.tempK != null && signals.tempK > 1200) || lavaSubtype || lavaCoverage > 0.02) {
    return "Very high surface temperature or lava subtype drives the molten overlay.";
  }
  return "Surface temperature is below the auto lava-overlay threshold.";
}

export function buildPlanetaryVisualAutoCoverageReadouts({
  autoDescriptor,
  solvedBody,
  body,
  classification,
  manifest,
} = {}) {
  const manifestPaths = controlPathsFromManifest(manifest);
  const readouts = {};
  const signals = contextSignals({ autoDescriptor, solvedBody, body, classification });
  const oceanCoverage = profileValue(signals.profile, "ocean.coverage");
  const landCoverage =
    profileValue(signals.profile, "surface.landCoverage") ??
    (oceanCoverage == null ? null : clamp01(1 - oceanCoverage));
  const iceCoverage =
    profileValue(signals.profile, "iceCoverage", "surface.iceCoverage") ??
    clamp01(
      averageFinite(
        getPath(signals.profile, "iceCaps.north"),
        getPath(signals.profile, "iceCaps.south"),
      ),
    );
  const cloudCoverage =
    profileValue(signals.profile, "clouds.coverage") ??
    profileValue(signals.gasProfile, "clouds.coverage") ??
    gasStyleCoverage(signals.styleId, signals.renderFamily);
  const vegetationCoverage = profileValue(signals.profile, "vegetation.coverage");
  const desertCoverage = profileValue(signals.profile, "desert.coverage");
  const lavaCoverage = profileValue(signals.profile, "lava.coverage");

  const candidates = [
    ["surface.landCoverage", landCoverage, landExplanation(), "medium"],
    ["surface.oceanCoverage", oceanCoverage, oceanExplanation(signals, oceanCoverage), "medium"],
    ["surface.iceCoverage", iceCoverage, iceExplanation(signals, iceCoverage), "medium"],
    ["clouds.coverage", cloudCoverage, cloudExplanation(signals, cloudCoverage), "medium"],
    [
      "surface.vegetationCoverage",
      vegetationCoverage,
      vegetationExplanation(signals, vegetationCoverage),
      vegetationCoverage > 0.02 ? "low" : "medium",
    ],
    ["surface.desertCoverage", desertCoverage, desertExplanation(signals, desertCoverage), "low"],
    ["surface.lavaCoverage", lavaCoverage, lavaExplanation(signals, lavaCoverage), "low"],
  ];

  for (const [path, value, explanation, confidence] of candidates) {
    if (!COVERAGE_CONTROL_PATHS.includes(path) || !controlVisible(manifestPaths, path)) continue;
    readouts[path] = makeReadout(path, value, explanation, confidence);
  }
  return readouts;
}
