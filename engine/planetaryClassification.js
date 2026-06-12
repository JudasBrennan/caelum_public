import {
  BROWN_DWARF_MIN_MJUP,
  classifyCompanionRegimeByMass,
  normalizeGiantCompanionClass,
} from "./substellarRegime.js";
import { getClassificationSourceForSolve } from "./planetaryBodyAdapters.js";

export const EARTH_MASS_PER_MJUP = 317.83;
export const JUPITER_RADIUS_EARTH = 69911 / 6371;
export const EARTH_DENSITY_GCM3 = 5.51;

export const PLANETARY_CLASSIFICATIONS = Object.freeze({
  BROWN_DWARF: "brownDwarf",
  GAS_GIANT: "gasGiant",
  ICE_GIANT: "iceGiant",
  MINI_NEPTUNE: "miniNeptune",
  VOLATILE_CANDIDATE: "volatileCandidate",
  RADIUS_VALLEY: "radiusValley",
  SUPER_EARTH: "superEarth",
  ROCKY: "rocky",
  DWARF_ROCKY: "dwarfRocky",
});

const DISPLAY_LABELS = Object.freeze({
  brownDwarf: "Brown dwarf",
  gasGiant: "Gas giant",
  iceGiant: "Ice giant",
  miniNeptune: "Mini-Neptune",
  volatileCandidate: "Volatile candidate",
  radiusValley: "Radius-valley planet",
  superEarth: "Super-Earth",
  rocky: "Rocky planet",
  dwarfRocky: "Dwarf rocky body",
});

const ROCKY_RADIUS_TRANSITION_RE = 1.6;
const VOLATILE_CANDIDATE_RADIUS_RE = 2.0;
const MEANINGFUL_HHE_ENVELOPE_PCT = 0.1;
const SUPER_EARTH_MIN_MASS_EARTH = 2;
const MINI_NEPTUNE_MAX_MASS_EARTH = 10;
const GAS_GIANT_MIN_MASS_EARTH = 95;
const ICE_GIANT_MAX_MASS_MJUP = 0.15;

function finiteOrNull(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveOrNull(value) {
  const number = finiteOrNull(value);
  return number != null && number > 0 ? number : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const number = finiteOrNull(value);
    if (number != null) return number;
  }
  return null;
}

function firstPositive(...values) {
  for (const value of values) {
    const number = positiveOrNull(value);
    if (number != null) return number;
  }
  return null;
}

function reason(code, label, detail = "", severity = "info") {
  return { code, label, detail, severity };
}

function makeClassification({
  family,
  confidence,
  reasons,
  warnings = [],
  surfaceApplicability,
  solverFamily,
  physical,
  modelVersion = "planetary-classification-v1",
}) {
  return {
    family,
    code: family,
    displayLabel: DISPLAY_LABELS[family] || family,
    confidence,
    modelVersion,
    reasonCodes: reasons.map((entry) => entry.code),
    reasons,
    warningCodes: warnings.map((entry) => entry.code),
    warnings,
    surfaceApplicability,
    solverFamily,
    physical,
  };
}

function getCompanionClass(body) {
  const legacySource = getClassificationSourceForSolve(body).source;
  return normalizeGiantCompanionClass(
    body?.giant?.companionClass ??
      body?.classificationSeed?.companionClass ??
      legacySource.companionClass,
  );
}

export function getPlanetaryClassificationInputs(body = {}) {
  const legacySource = getClassificationSourceForSolve(body);
  const legacyGiant = legacySource.source;
  const legacyInputs = legacySource.inputs;
  const massMjup = firstPositive(
    body?.giant?.massMjup,
    body?.classificationSeed?.massMjup,
    legacyGiant.massMjup,
    legacyGiant.massJupiter,
    legacyGiant.massMj,
  );
  const massEarth = firstPositive(
    body?.composition?.massEarth,
    body?.classificationSeed?.massEarth,
    legacyInputs.massEarth,
    massMjup == null ? null : massMjup * EARTH_MASS_PER_MJUP,
  );
  const radiusRj = firstPositive(
    body?.giant?.radiusRj,
    body?.classificationSeed?.radiusRj,
    legacyGiant.radiusRj,
    legacyGiant.radiusJupiter,
    legacyGiant.sizeRj,
    legacyGiant.radiusRadiiJupiter,
  );
  const radiusEarth = firstPositive(
    body?.composition?.radiusEarth,
    body?.classificationSeed?.radiusEarth,
    legacyInputs.radiusEarth,
    radiusRj == null ? null : radiusRj * JUPITER_RADIUS_EARTH,
  );
  const densityGcm3 = firstPositive(
    body?.physical?.densityGcm3,
    body?.classificationSeed?.densityGcm3,
    massEarth != null && radiusEarth != null
      ? EARTH_DENSITY_GCM3 * (massEarth / radiusEarth ** 3)
      : null,
  );
  const hHeEnvelopeMassPct = Math.max(
    firstFinite(
      body?.composition?.hHeEnvelopeMassPct,
      body?.classificationSeed?.hHeEnvelopeMassPct,
      legacyInputs.hHeEnvelopeMassPct,
      0,
    ) ?? 0,
    0,
  );
  const wmfPct = Math.max(
    firstFinite(
      body?.composition?.wmfPct,
      body?.classificationSeed?.wmfPct,
      legacyInputs.wmfPct,
      0,
    ) ?? 0,
    0,
  );
  return {
    legacyKind: body?.legacyKind || body?.legacy?.kind || null,
    authoringIntent: body?.authoringIntent || "auto",
    companionClass: getCompanionClass(body),
    massEarth,
    massMjup: massMjup ?? (massEarth == null ? null : massEarth / EARTH_MASS_PER_MJUP),
    radiusEarth,
    radiusRj: radiusRj ?? (radiusEarth == null ? null : radiusEarth / JUPITER_RADIUS_EARTH),
    densityGcm3,
    cmfPct: firstFinite(
      body?.composition?.cmfPct,
      body?.classificationSeed?.cmfPct,
      legacyInputs.cmfPct,
    ),
    wmfPct,
    hHeEnvelopeMassPct,
    irradiationEarth: firstFinite(
      body?.thermal?.insolationEarth,
      body?.classificationSeed?.irradiationEarth,
    ),
    ageGyr: firstFinite(body?.ageGyr, body?.classificationSeed?.ageGyr),
  };
}

function classifyGasGiantLegacy(inputs, commonReasons, warnings) {
  if (inputs.massMjup != null) {
    if (inputs.massMjup < ICE_GIANT_MAX_MASS_MJUP) {
      return makeClassification({
        family: PLANETARY_CLASSIFICATIONS.ICE_GIANT,
        confidence: "high",
        reasons: [
          ...commonReasons,
          reason(
            "giantMassInIceGiantRange",
            "Giant mass is in the ice-giant range.",
            `${inputs.massMjup.toFixed(4)} Mjup`,
          ),
        ],
        warnings,
        surfaceApplicability: "none",
        solverFamily: "gasGiant",
        physical: inputs,
      });
    }
    return makeClassification({
      family: PLANETARY_CLASSIFICATIONS.GAS_GIANT,
      confidence: "high",
      reasons: [
        ...commonReasons,
        reason(
          "giantMassInGasGiantRange",
          "Giant mass is in the gas-giant range.",
          `${inputs.massMjup.toFixed(4)} Mjup`,
        ),
      ],
      warnings,
      surfaceApplicability: "none",
      solverFamily: "gasGiant",
      physical: inputs,
    });
  }

  const radiusSuggestsIceGiant = inputs.radiusRj != null && inputs.radiusRj < 0.6;
  return makeClassification({
    family: radiusSuggestsIceGiant
      ? PLANETARY_CLASSIFICATIONS.ICE_GIANT
      : PLANETARY_CLASSIFICATIONS.GAS_GIANT,
    confidence: "medium",
    reasons: [
      ...commonReasons,
      radiusSuggestsIceGiant
        ? reason(
            "giantRadiusInIceGiantRange",
            "Giant radius is closer to the ice-giant range.",
            `${inputs.radiusRj.toFixed(3)} Rj`,
          )
        : reason(
            "legacyGasGiantWithoutMass",
            "Legacy giant entry has no usable mass, so its stored type is used.",
          ),
    ],
    warnings,
    surfaceApplicability: "none",
    solverFamily: "gasGiant",
    physical: inputs,
  });
}

function classifyEnvelopeBody(inputs, commonReasons, warnings) {
  if (inputs.massEarth != null && inputs.massEarth >= GAS_GIANT_MIN_MASS_EARTH) {
    return makeClassification({
      family: PLANETARY_CLASSIFICATIONS.GAS_GIANT,
      confidence: "high",
      reasons: [
        ...commonReasons,
        reason("meaningfulHHeEnvelope", "A meaningful H/He envelope is present."),
        reason(
          "envelopeMassInGasGiantRange",
          "Mass and envelope scale point to a gas giant.",
          `${inputs.massEarth.toFixed(2)} Mearth`,
        ),
      ],
      warnings,
      surfaceApplicability: "none",
      solverFamily: "gasGiant",
      physical: inputs,
    });
  }

  if (
    (inputs.massEarth != null && inputs.massEarth >= MINI_NEPTUNE_MAX_MASS_EARTH) ||
    inputs.hHeEnvelopeMassPct >= 5
  ) {
    return makeClassification({
      family: PLANETARY_CLASSIFICATIONS.ICE_GIANT,
      confidence: "modelled",
      reasons: [
        ...commonReasons,
        reason("meaningfulHHeEnvelope", "A meaningful H/He envelope is present."),
        reason(
          "envelopeMassInIceGiantRange",
          "Mass or envelope scale points to an ice giant.",
          `${inputs.hHeEnvelopeMassPct.toFixed(3)}% H/He`,
        ),
      ],
      warnings,
      surfaceApplicability: "none",
      solverFamily: "volatile",
      physical: inputs,
    });
  }

  return makeClassification({
    family: PLANETARY_CLASSIFICATIONS.MINI_NEPTUNE,
    confidence: "modelled",
    reasons: [
      ...commonReasons,
      reason("meaningfulHHeEnvelope", "A meaningful H/He envelope is present."),
      reason(
        "envelopeMassInMiniNeptuneRange",
        "Envelope-bearing low-mass body resolves as a mini-Neptune.",
        `${inputs.hHeEnvelopeMassPct.toFixed(3)}% H/He`,
      ),
    ],
    warnings,
    surfaceApplicability: "none",
    solverFamily: "volatile",
    physical: inputs,
  });
}

function classifyRockyLikeBody(inputs, commonReasons, warnings) {
  if (inputs.radiusEarth != null && inputs.radiusEarth >= VOLATILE_CANDIDATE_RADIUS_RE) {
    return makeClassification({
      family: PLANETARY_CLASSIFICATIONS.VOLATILE_CANDIDATE,
      confidence: "low",
      reasons: [
        ...commonReasons,
        reason(
          "radiusAboveRockyTransition",
          "Radius is above the conservative rocky transition without H/He evidence.",
          `${inputs.radiusEarth.toFixed(3)} Rearth`,
        ),
      ],
      warnings,
      surfaceApplicability: "limited",
      solverFamily: "volatile",
      physical: inputs,
    });
  }

  if (inputs.radiusEarth != null && inputs.radiusEarth >= ROCKY_RADIUS_TRANSITION_RE) {
    return makeClassification({
      family: PLANETARY_CLASSIFICATIONS.RADIUS_VALLEY,
      confidence: "low",
      reasons: [
        ...commonReasons,
        reason(
          "radiusValleyWithoutEnvelope",
          "Radius sits near the rocky/volatile transition without H/He evidence.",
          `${inputs.radiusEarth.toFixed(3)} Rearth`,
        ),
      ],
      warnings,
      surfaceApplicability: "limited",
      solverFamily: "rocky",
      physical: inputs,
    });
  }

  if (inputs.massEarth != null && inputs.massEarth < 0.01) {
    return makeClassification({
      family: PLANETARY_CLASSIFICATIONS.DWARF_ROCKY,
      confidence: "high",
      reasons: [
        ...commonReasons,
        reason(
          "rockyMassBelowPlanetScale",
          "Mass is below the rocky planet scale.",
          `${inputs.massEarth.toExponential(3)} Mearth`,
        ),
      ],
      warnings,
      surfaceApplicability: "full",
      solverFamily: "rocky",
      physical: inputs,
    });
  }

  if (inputs.massEarth != null && inputs.massEarth >= SUPER_EARTH_MIN_MASS_EARTH) {
    return makeClassification({
      family: PLANETARY_CLASSIFICATIONS.SUPER_EARTH,
      confidence: "high",
      reasons: [
        ...commonReasons,
        reason(
          "rockyMassInSuperEarthRange",
          "Mass is above Earth-like rocky scale without envelope evidence.",
          `${inputs.massEarth.toFixed(3)} Mearth`,
        ),
      ],
      warnings,
      surfaceApplicability: "full",
      solverFamily: "rocky",
      physical: inputs,
    });
  }

  return makeClassification({
    family: PLANETARY_CLASSIFICATIONS.ROCKY,
    confidence: inputs.massEarth == null ? "medium" : "high",
    reasons: [
      ...commonReasons,
      inputs.massEarth == null
        ? reason(
            "missingMassUsesRockyFallback",
            "No usable mass is present; rocky fallback is used.",
          )
        : reason(
            "rockyMassRange",
            "Mass and composition remain in the rocky planet range.",
            `${inputs.massEarth.toFixed(3)} Mearth`,
          ),
    ],
    warnings,
    surfaceApplicability: "full",
    solverFamily: "rocky",
    physical: inputs,
  });
}

export function classifyPlanetaryBody(body = {}, context = {}) {
  const bodyInputs = getPlanetaryClassificationInputs(body);
  const inputs = {
    ...bodyInputs,
    irradiationEarth: firstFinite(context.irradiationEarth, bodyInputs.irradiationEarth) ?? null,
    ageGyr: firstFinite(context.ageGyr, bodyInputs.ageGyr) ?? null,
  };
  const reasons = [];
  const warnings = [];

  if (inputs.legacyKind) {
    reasons.push(
      reason(
        `legacyKind:${inputs.legacyKind}`,
        "Legacy storage kind is part of the classification input.",
        inputs.legacyKind,
      ),
    );
  }
  if (inputs.authoringIntent && inputs.authoringIntent !== "auto") {
    reasons.push(
      reason(
        `authoringIntent:${inputs.authoringIntent}`,
        "Authoring intent was supplied by the read model.",
        inputs.authoringIntent,
      ),
    );
  }

  const explicitBrownDwarf = inputs.companionClass === "brownDwarf";
  if (
    inputs.massMjup != null &&
    classifyCompanionRegimeByMass({ massMjup: inputs.massMjup }) === "brownDwarf"
  ) {
    return makeClassification({
      family: PLANETARY_CLASSIFICATIONS.BROWN_DWARF,
      confidence: "high",
      reasons: [
        ...reasons,
        reason(
          "massAboveBrownDwarfThreshold",
          "Mass is above the brown-dwarf threshold.",
          `${inputs.massMjup.toFixed(3)} Mjup`,
        ),
      ],
      warnings,
      surfaceApplicability: "none",
      solverFamily: "brownDwarf",
      physical: inputs,
    });
  }

  if (explicitBrownDwarf && inputs.massMjup != null && inputs.massMjup < BROWN_DWARF_MIN_MJUP) {
    warnings.push(
      reason(
        "explicitBrownDwarfBelowMassThreshold",
        "Explicit brown-dwarf class is not enough to override planet-mass physics.",
        `${inputs.massMjup.toFixed(3)} Mjup`,
        "warning",
      ),
    );
  } else if (explicitBrownDwarf && inputs.massMjup == null) {
    warnings.push(
      reason(
        "explicitBrownDwarfWithoutMass",
        "Explicit brown-dwarf class has no usable mass support.",
        "",
        "warning",
      ),
    );
  }

  if (inputs.legacyKind === "gasGiant") {
    return classifyGasGiantLegacy(inputs, reasons, warnings);
  }

  if (inputs.hHeEnvelopeMassPct >= MEANINGFUL_HHE_ENVELOPE_PCT) {
    return classifyEnvelopeBody(inputs, reasons, warnings);
  }

  return classifyRockyLikeBody(inputs, reasons, warnings);
}
