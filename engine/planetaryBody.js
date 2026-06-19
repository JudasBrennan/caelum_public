import { calcGasGiant } from "./gasGiant.js";
import { calcPlanetExact } from "./planet.js";
import { calcVolatilePlanet } from "./volatilePlanet.js";
import {
  EARTH_MASS_PER_MJUP,
  JUPITER_RADIUS_EARTH,
  classifyPlanetaryBody,
} from "./planetaryClassification.js";
import {
  getGasGiantSourceForSolve,
  getRockySourceForSolve,
  getVolatileSourceForSolve,
} from "./planetaryBodyAdapters.js";
import {
  classifyPlanetarySubtypes,
  derivePlanetaryDescriptors,
  selectPrimaryPlanetarySubtype,
} from "./planetarySubtypes.js";
import { buildPlanetaryEraTimelineForPlanetaryBody } from "./planetaryEraTimeline.js";

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const number = finiteOrNull(value);
    if (number != null) return number;
  }
  return null;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return undefined;
}

function withFallback(target, key, value) {
  if (target[key] === undefined && value !== undefined && value !== null) target[key] = value;
}

function normalizeCalculationRequest(bodyOrRequest, context) {
  if (isObject(bodyOrRequest) && isObject(bodyOrRequest.body)) {
    const { body, context: nestedContext, ...inlineContext } = bodyOrRequest;
    return {
      body,
      context: {
        ...(isObject(nestedContext) ? nestedContext : {}),
        ...inlineContext,
      },
    };
  }
  return {
    body: isObject(bodyOrRequest) ? bodyOrRequest : {},
    context: isObject(context) ? context : {},
  };
}

function readStarContext(context = {}) {
  const starConfig = isObject(context.starConfig) ? context.starConfig : {};
  const starModel = isObject(context.starModel)
    ? context.starModel
    : isObject(context.star)
      ? context.star
      : {};
  return {
    starMassMsol: firstFinite(context.starMassMsol, starConfig.massMsol, starModel.massMsol, 1),
    starAgeGyr: firstFinite(context.starAgeGyr, starConfig.ageGyr, starModel.ageGyr, 4.6),
    starMetallicityFeH: firstFinite(
      context.starMetallicityFeH,
      starConfig.metallicityFeH,
      starModel.metallicityFeH,
      0,
    ),
    starRadiusRsolOverride: firstDefined(
      context.starRadiusRsolOverride,
      starConfig.radiusRsolOverride,
      null,
    ),
    starLuminosityLsolOverride: firstDefined(
      context.starLuminosityLsolOverride,
      starConfig.luminosityLsolOverride,
      null,
    ),
    starTempKOverride: firstDefined(context.starTempKOverride, starConfig.tempKOverride, null),
    starEvolutionMode: firstDefined(
      context.starEvolutionMode,
      starConfig.evolutionMode,
      starModel.evolutionMode,
      "zams",
    ),
    starLuminosityLsol: firstFinite(
      context.starLuminosityLsol,
      starModel.luminosityLsol,
      starConfig.luminosityLsolOverride,
      1,
    ),
    starRadiusRsol: firstFinite(
      context.starRadiusRsol,
      starModel.radiusRsol,
      starConfig.radiusRsolOverride,
      1,
    ),
  };
}

function normalizeHostContext(body, context = {}) {
  return {
    hostFrameId:
      firstDefined(context.hostFrameId, body?.hostFrameId, body?.orbit?.hostFrameId, null) ?? null,
    hostFrame: isObject(context.hostFrame) ? context.hostFrame : null,
    hostXuvFluxEarthAt1Au: firstDefined(context.hostXuvFluxEarthAt1Au, null),
    hostPrebioticUvEarthAt1Au: firstDefined(context.hostPrebioticUvEarthAt1Au, null),
    hostWindPressureEarthAt1Au: firstDefined(context.hostWindPressureEarthAt1Au, null),
    companionFluxEarth: firstFinite(context.companionFluxEarth, 0),
    companionXuvFluxEarth: firstFinite(context.companionXuvFluxEarth, 0),
    companionPrebioticUvEarth: firstFinite(context.companionPrebioticUvEarth, 0),
    companionWindPressureEarth: firstFinite(context.companionWindPressureEarth, 0),
    fluxVariabilityFraction: firstFinite(context.fluxVariabilityFraction, 0),
  };
}

function normalizeMoonInputs(moons, bodyId) {
  if (!Array.isArray(moons)) return [];
  return moons
    .filter((moon) => {
      if (!isObject(moon)) return false;
      if (moon.planetId == null || !bodyId) return true;
      return String(moon.planetId) === String(bodyId);
    })
    .map((moon) => ({
      id: moon.id,
      ...(isObject(moon.inputs) ? moon.inputs : moon),
    }));
}

function normalizeGasGiantPerturbers(gasGiants, bodyId = null) {
  if (!Array.isArray(gasGiants)) return [];
  return gasGiants
    .filter((entry) => isObject(entry) && (!bodyId || String(entry.id || "") !== String(bodyId)))
    .map((entry) => ({
      ...entry,
      au: firstFinite(entry.au, entry.orbitAu, entry.semiMajorAxisAu),
    }));
}

function buildRockyPlanetPayload(body) {
  const legacyInputs = getRockySourceForSolve(body);
  const planet = { ...legacyInputs };
  withFallback(planet, "name", body?.name);
  withFallback(planet, "semiMajorAxisAu", body?.orbit?.semiMajorAxisAu);
  withFallback(planet, "eccentricity", body?.orbit?.eccentricity);
  withFallback(planet, "inclinationDeg", body?.orbit?.inclinationDeg);
  withFallback(planet, "longitudeOfPeriapsisDeg", body?.orbit?.longitudeOfPeriapsisDeg);
  withFallback(planet, "axialTiltDeg", body?.rotation?.axialTiltDeg);
  withFallback(planet, "rotationPeriodHours", body?.rotation?.rotationPeriodHours);
  withFallback(planet, "subsolarLongitudeDeg", body?.rotation?.subsolarLongitudeDeg);
  withFallback(planet, "massEarth", body?.composition?.massEarth);
  withFallback(planet, "radiusEarth", body?.composition?.radiusEarth);
  withFallback(planet, "cmfPct", body?.composition?.cmfPct);
  withFallback(planet, "wmfPct", body?.composition?.wmfPct);
  withFallback(planet, "hHeEnvelopeMassPct", body?.composition?.hHeEnvelopeMassPct);
  withFallback(planet, "pressureAtm", body?.atmosphere?.pressureAtm);
  withFallback(planet, "greenhouseMode", body?.atmosphere?.greenhouseMode);
  withFallback(planet, "greenhouseEffect", body?.atmosphere?.greenhouseEffect);
  withFallback(planet, "atmosphericEscape", body?.atmosphere?.escapeFilterEnabled);
  withFallback(planet, "ringMode", body?.rings?.mode);
  withFallback(planet, "ringStyleId", body?.rings?.styleId);
  return planet;
}

function buildVolatilePlanetPayload(body) {
  const legacyInputs = getVolatileSourceForSolve(body);
  return {
    name: body?.name || legacyInputs.name || "Volatile planet",
    massEarth: firstFinite(
      body?.composition?.massEarth,
      body?.classificationSeed?.massEarth,
      legacyInputs.massEarth,
      5,
    ),
    observedRadiusEarth: firstFinite(
      body?.composition?.radiusEarth,
      body?.classificationSeed?.radiusEarth,
      legacyInputs.radiusEarth,
    ),
    cmfPct: firstFinite(
      body?.composition?.cmfPct,
      body?.classificationSeed?.cmfPct,
      legacyInputs.cmfPct,
      32,
    ),
    wmfPct: firstFinite(
      body?.composition?.wmfPct,
      body?.classificationSeed?.wmfPct,
      legacyInputs.wmfPct,
      0,
    ),
    hHeEnvelopeMassPct: firstFinite(
      body?.composition?.hHeEnvelopeMassPct,
      body?.classificationSeed?.hHeEnvelopeMassPct,
      legacyInputs.hHeEnvelopeMassPct,
      0,
    ),
    envelopeMetallicitySolar: firstFinite(
      body?.composition?.envelopeMetallicitySolar,
      body?.classificationSeed?.envelopeMetallicitySolar,
      legacyInputs.envelopeMetallicitySolar,
      1,
    ),
    ageGyr: firstFinite(body?.ageGyr, body?.classificationSeed?.ageGyr),
    semiMajorAxisAu: firstFinite(
      body?.orbit?.semiMajorAxisAu,
      body?.classificationSeed?.semiMajorAxisAu,
      legacyInputs.semiMajorAxisAu,
      1,
    ),
    eccentricity: firstFinite(body?.orbit?.eccentricity, legacyInputs.eccentricity, 0),
    inclinationDeg: firstFinite(body?.orbit?.inclinationDeg, legacyInputs.inclinationDeg, 0),
    albedoBond: firstFinite(body?.thermal?.albedoBond, legacyInputs.albedoBond, 0.3),
  };
}

export function buildRockyPlanetInputFromUnifiedBody(body, context = {}) {
  const starContext = readStarContext(context);
  const hostContext = normalizeHostContext(body, context);
  const args = {
    starMassMsol: starContext.starMassMsol,
    starAgeGyr: starContext.starAgeGyr,
    starMetallicityFeH: starContext.starMetallicityFeH,
    starRadiusRsolOverride: starContext.starRadiusRsolOverride,
    starLuminosityLsolOverride: starContext.starLuminosityLsolOverride,
    starTempKOverride: starContext.starTempKOverride,
    starEvolutionMode: starContext.starEvolutionMode,
    ...hostContext,
    planet: buildRockyPlanetPayload(body),
    moons: normalizeMoonInputs(context.moons, body?.id),
    gasGiants: normalizeGasGiantPerturbers(context.gasGiants),
    smallBodyReservoirContext: context.smallBodyReservoirContext || null,
  };
  if (typeof context.detailLevel === "string") args.detailLevel = context.detailLevel;
  if (context.habitabilityPolicy !== undefined)
    args.habitabilityPolicy = context.habitabilityPolicy;
  return args;
}

export function buildVolatilePlanetInputFromUnifiedBody(body, context = {}) {
  const starContext = readStarContext(context);
  const hostContext = normalizeHostContext(body, context);
  const payload = buildVolatilePlanetPayload(body);
  return {
    ...payload,
    ageGyr: payload.ageGyr ?? starContext.starAgeGyr,
    starMassMsol: starContext.starMassMsol,
    starLuminosityLsol: starContext.starLuminosityLsol,
    starAgeGyr: starContext.starAgeGyr,
    starRadiusRsol: starContext.starRadiusRsol,
    ...hostContext,
  };
}

function buildGiantPayload(body, context = {}) {
  const legacySource = getGasGiantSourceForSolve(body);
  const massEarth = firstFinite(
    body?.composition?.massEarth,
    body?.classificationSeed?.massEarth,
    legacySource?.inputs?.massEarth,
  );
  const radiusEarth = firstFinite(
    body?.composition?.radiusEarth,
    body?.classificationSeed?.radiusEarth,
    legacySource?.inputs?.radiusEarth,
  );
  const massMjup = firstFinite(
    body?.giant?.massMjup,
    body?.classificationSeed?.massMjup,
    legacySource.massMjup,
    legacySource.massJupiter,
    legacySource.massMj,
    massEarth == null ? null : massEarth / EARTH_MASS_PER_MJUP,
  );
  const radiusRj = firstFinite(
    body?.giant?.radiusRj,
    body?.classificationSeed?.radiusRj,
    legacySource.radiusRj,
    legacySource.radiusJupiter,
    legacySource.sizeRj,
    legacySource.radiusRadiiJupiter,
    radiusEarth == null ? null : radiusEarth / JUPITER_RADIUS_EARTH,
  );
  return {
    ...legacySource,
    companionClass:
      context.companionClass ??
      body?.giant?.companionClass ??
      body?.classificationSeed?.companionClass ??
      legacySource.companionClass,
    massMjup,
    radiusRj,
    orbitAu: firstFinite(
      body?.orbit?.semiMajorAxisAu,
      legacySource.orbitAu,
      legacySource.au,
      legacySource.semiMajorAxisAu,
    ),
    eccentricity: firstFinite(body?.orbit?.eccentricity, legacySource.eccentricity),
    inclinationDeg: firstFinite(body?.orbit?.inclinationDeg, legacySource.inclinationDeg),
    axialTiltDeg: firstFinite(body?.rotation?.axialTiltDeg, legacySource.axialTiltDeg),
    rotationPeriodHours: firstFinite(
      body?.rotation?.rotationPeriodHours,
      legacySource.rotationPeriodHours,
    ),
    metallicity: firstFinite(
      body?.giant?.metallicitySolar,
      legacySource.metallicity,
      legacySource.metallicitySolar,
    ),
  };
}

export function buildGasGiantInputFromUnifiedBody(body, context = {}) {
  const starContext = readStarContext(context);
  const hostContext = normalizeHostContext(body, context);
  const payload = buildGiantPayload(body, context);
  const args = {
    companionClass: payload.companionClass,
    massMjup: payload.massMjup,
    radiusRj: payload.radiusRj,
    orbitAu: payload.orbitAu,
    eccentricity: payload.eccentricity,
    inclinationDeg: payload.inclinationDeg,
    axialTiltDeg: payload.axialTiltDeg,
    rotationPeriodHours: payload.rotationPeriodHours,
    metallicity: payload.metallicity,
    starMassMsol: starContext.starMassMsol,
    starLuminosityLsol: starContext.starLuminosityLsol,
    starAgeGyr: starContext.starAgeGyr,
    starRadiusRsol: starContext.starRadiusRsol,
    ...hostContext,
    stellarMetallicityFeH: starContext.starMetallicityFeH,
    otherGiants: normalizeGasGiantPerturbers(context.otherGiants || context.gasGiants, body?.id),
    moons: normalizeMoonInputs(context.moons, body?.id),
  };
  if (Array.isArray(context.moonInfluenceSummaries)) {
    args.moonInfluenceSummaries = context.moonInfluenceSummaries;
  }
  if (typeof context.detailLevel === "string") args.detailLevel = context.detailLevel;
  return args;
}

export function buildBrownDwarfInputFromUnifiedBody(body, context = {}) {
  return buildGasGiantInputFromUnifiedBody(body, {
    ...context,
    companionClass: "brownDwarf",
  });
}

function buildRockySections(model) {
  return {
    orbit: {
      semiMajorAxisAu: model.inputs?.semiMajorAxisAu ?? null,
      eccentricity: model.inputs?.eccentricity ?? null,
      inclinationDeg: model.inputs?.inclinationDeg ?? null,
      longitudeOfPeriapsisDeg: model.inputs?.longitudeOfPeriapsisDeg ?? null,
      periapsisAu: model.derived?.periapsisAu ?? null,
      apoapsisAu: model.derived?.apoapsisAu ?? null,
      orbitalPeriodDays: model.derived?.orbitalPeriodEarthDays ?? null,
      orbitalPeriodYears: model.derived?.orbitalPeriodEarthYears ?? null,
      localDaysPerYear: model.derived?.localDaysPerYear ?? null,
      orbitalDirection: model.derived?.orbitalDirection ?? null,
      dynamicalStability: model.derived?.dynamicalStabilityState ?? null,
      dynamicalStabilityNotes: model.derived?.dynamicalStabilityNotes || [],
    },
    physical: {
      massEarth: model.inputs?.massEarth ?? null,
      radiusEarth: model.derived?.radiusEarth ?? null,
      radiusKm: model.derived?.radiusKm ?? null,
      densityGcm3: model.derived?.densityGcm3 ?? null,
      gravityG: model.derived?.gravityG ?? null,
      gravityMs2: model.derived?.gravityMs2 ?? null,
      escapeVelocityKms: model.derived?.escapeVelocityKms ?? null,
      bodyClass: model.derived?.bodyClass ?? null,
      compositionClass: model.derived?.compositionClass ?? null,
      waterRegime: model.derived?.waterRegime ?? null,
    },
    thermal: {
      surfaceTempK: model.derived?.surfaceTempK ?? null,
      surfaceTempC: model.derived?.surfaceTempC ?? null,
      insolationEarth: model.derived?.insolationEarth ?? null,
      absorbedFluxWm2: model.derived?.absorbedFluxWm2 ?? null,
      tEqPeriK: model.derived?.tEqPeriK ?? null,
      tEqApoK: model.derived?.tEqApoK ?? null,
      companionFluxEarth: model.derived?.companionFluxEarth ?? null,
      fluxVariabilityFraction: model.derived?.fluxVariabilityFraction ?? null,
    },
    atmosphere: {
      pressureAtm: model.inputs?.pressureAtm ?? null,
      pressureKpa: model.derived?.pressureKpa ?? null,
      greenhouseMode: model.inputs?.greenhouseMode ?? null,
      greenhouseEffect: model.inputs?.greenhouseEffect ?? null,
      computedGreenhouseEffect: model.derived?.computedGreenhouseEffect ?? null,
      jeansEscape: model.derived?.jeansEscape ?? null,
      gasMix: {
        o2Pct: model.inputs?.o2Pct ?? null,
        co2Pct: model.inputs?.co2Pct ?? null,
        arPct: model.inputs?.arPct ?? null,
        h2oPct: model.inputs?.h2oPct ?? null,
        ch4Pct: model.inputs?.ch4Pct ?? null,
        h2Pct: model.inputs?.h2Pct ?? null,
        hePct: model.inputs?.hePct ?? null,
        so2Pct: model.inputs?.so2Pct ?? null,
        nh3Pct: model.inputs?.nh3Pct ?? null,
        n2Pct: model.derived?.n2Pct ?? null,
      },
    },
    rings: {
      ringScienceSupported: model.derived?.ringScienceSupported ?? false,
      ringScienceReason: model.derived?.ringScienceReason ?? null,
      ringSourceMoonId: model.derived?.ringSourceMoonId ?? null,
      rocheLimitKm: model.derived?.rocheLimitKm ?? null,
    },
    habitability: {
      liquidWaterPossible: model.derived?.liquidWaterPossible ?? false,
      climateState: model.derived?.climateState ?? null,
      surfaceState: model.derived?.surfaceState ?? null,
      hydrosphere: model.derived?.hydrosphere ?? null,
      earthSimilarityIndex: model.derived?.earthSimilarityIndex ?? null,
      habitabilityIndex: model.derived?.habitabilityIndex ?? null,
      habitabilityBreakdown: model.derived?.habitabilityBreakdown ?? null,
    },
    detection: {
      transitDepthFraction: model.derived?.transitDepthFraction ?? null,
      transitDepthPpm: model.derived?.transitDepthPpm ?? null,
      transitProbabilityFraction: model.derived?.transitProbabilityFraction ?? null,
      rvSemiAmplitudeMs: model.derived?.rvSemiAmplitudeMs ?? null,
    },
    visuals: {
      skyColourDayHex: model.derived?.skyColourDayHex ?? null,
      skyColourHorizonHex: model.derived?.skyColourHorizonHex ?? null,
      skySpectralKey: model.derived?.skySpectralKey ?? null,
      display: model.display || {},
    },
  };
}

function buildGiantSections(model) {
  return {
    orbit: {
      semiMajorAxisAu: model.inputs?.orbitAu ?? null,
      eccentricity: model.inputs?.eccentricity ?? null,
      inclinationDeg: model.inputs?.inclinationDeg ?? null,
      periapsisAu: model.orbital?.periapsisAu ?? null,
      apoapsisAu: model.orbital?.apoapsisAu ?? null,
      orbitalPeriodDays: model.orbital?.orbitalPeriodDays ?? null,
      orbitalPeriodYears: model.orbital?.orbitalPeriodYears ?? null,
      localDaysPerYear: model.orbital?.localDaysPerYear ?? null,
      orbitalDirection: model.orbital?.orbitalDirection ?? null,
      dynamicalStability: model.orbital?.dynamicalStability ?? null,
      dynamicalStabilityNotes: model.orbital?.dynamicalStabilityNotes || [],
    },
    physical: model.physical || {},
    thermal: model.thermal || {},
    atmosphere: model.atmosphere || null,
    rings: model.ringProperties || null,
    habitability: {
      liquidWaterPossible: false,
      climateState: null,
      surfaceState: "No solid surface model",
      hydrosphere: null,
      earthSimilarityIndex: null,
      habitabilityIndex: null,
      habitabilityBreakdown: null,
    },
    detection: model.detection || {},
    visuals: {
      appearance: model.appearance || null,
      clouds: model.clouds || null,
      display: model.display || {},
    },
  };
}

function buildVolatileSections(model) {
  return {
    orbit: model.orbit || {},
    physical: {
      ...(model.physical || {}),
      radiusEarth: model.physical?.transitRadiusEarth ?? null,
      radiusKm: model.physical?.transitRadiusKm ?? null,
      densityGcm3: model.physical?.bulkDensityGcm3 ?? null,
    },
    thermal: model.thermal || {},
    atmosphere: {
      envelope: model.envelope || null,
      pressureAtm: null,
      greenhouseMode: null,
      greenhouseEffect: null,
    },
    envelope: model.envelope || null,
    rings: null,
    habitability: model.habitability || {
      liquidWaterPossible: false,
      climateState: null,
      surfaceState: "No accessible solid surface model",
      hydrosphere: null,
      earthSimilarityIndex: null,
      habitabilityIndex: null,
      habitabilityBreakdown: null,
    },
    detection: model.detection || {},
    visuals: {
      display: model.display || {},
    },
  };
}

export function calcPlanetaryBody(bodyOrRequest, context = {}) {
  const request = normalizeCalculationRequest(bodyOrRequest, context);
  const broadClassification = classifyPlanetaryBody(request.body, request.context);
  const dispatch = broadClassification.solverFamily;
  let rockyModel = null;
  let gasGiantModel = null;
  let volatileModel = null;
  let sections;

  if (dispatch === "volatile") {
    const args = buildVolatilePlanetInputFromUnifiedBody(request.body, request.context);
    volatileModel = calcVolatilePlanet(args);
    sections = buildVolatileSections(volatileModel);
  } else if (dispatch === "gasGiant" || dispatch === "brownDwarf") {
    const args =
      dispatch === "brownDwarf"
        ? buildBrownDwarfInputFromUnifiedBody(request.body, request.context)
        : buildGasGiantInputFromUnifiedBody(request.body, request.context);
    gasGiantModel = calcGasGiant(args);
    sections = buildGiantSections(gasGiantModel);
  } else {
    const args = buildRockyPlanetInputFromUnifiedBody(request.body, request.context);
    rockyModel = calcPlanetExact(args);
    sections = buildRockySections(rockyModel);
  }

  const solvedModel =
    dispatch === "volatile"
      ? volatileModel
      : dispatch === "gasGiant" || dispatch === "brownDwarf"
        ? gasGiantModel
        : rockyModel;
  const descriptors = derivePlanetaryDescriptors({
    body: request.body,
    classification: broadClassification,
    solvedModel,
    context: request.context,
  });
  const subtypes = classifyPlanetarySubtypes({
    body: request.body,
    classification: broadClassification,
    solvedModel,
    context: request.context,
  });
  const primarySubtype = selectPrimaryPlanetarySubtype(subtypes, broadClassification);
  const classification = {
    ...broadClassification,
    scale: descriptors.scale,
    boundaryTraits: descriptors.boundaryTraits,
    durableFamily: descriptors.durableFamily,
    legacyFamily: descriptors.legacyFamily,
    descriptorModelVersion: descriptors.modelVersion,
    subtypes,
    primarySubtypeId: primarySubtype?.id || null,
  };

  const result = {
    id: request.body?.id ?? null,
    name: request.body?.name || request.body?.id || "Planetary body",
    role:
      classification.family === "brownDwarf"
        ? "substellarCompanion"
        : request.body?.role || "planetaryBody",
    authoringIntent: request.body?.authoringIntent || "auto",
    classification,
    descriptors,
    subtypes,
    primarySubtype,
    ...sections,
    legacy: {
      kind: request.body?.legacyKind || request.body?.legacy?.kind || null,
      rockyModel,
      gasGiantModel,
      volatileModel,
    },
  };

  const eraTimeline = buildPlanetaryEraTimelineForPlanetaryBody({
    body: request.body,
    model: {
      ...result,
      sourceModels: {
        rocky: rockyModel,
        gasGiant: gasGiantModel,
        volatile: volatileModel,
      },
    },
    star: request.context?.starModel || request.context?.star || null,
    systemContext: request.context,
  });

  result.derived = {
    ...(isObject(result.derived) ? result.derived : {}),
    eraTimeline,
  };
  result.display = {
    ...(isObject(result.display) ? result.display : {}),
    eraTimelineSummary: eraTimeline.summary,
  };

  return result;
}
