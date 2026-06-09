import { TIP_LABEL } from "./constants.js";

export function formatRecurrence(ratePerDay, formatNumber = (value) => String(value)) {
  const rate = Number(ratePerDay);
  if (!(rate > 0)) return "Rare";
  const days = 1 / rate;
  if (days >= 365) return `~${formatNumber(days / 365, 2)} years`;
  if (days >= 1) return `~${formatNumber(days, 2)} days`;
  const hours = days * 24;
  if (hours >= 1) return `~${formatNumber(hours, 2)} hours`;
  return `~${formatNumber(hours * 60, 2)} minutes`;
}

export function shortPopulationLabel(label) {
  const txt = String(label || "").trim();
  if (txt === "Population I (solar neighbourhood)") return "Pop I";
  if (txt === "Intermediate (old thin disk)") return "Intermediate";
  if (txt === "Population II (metal-poor)") return "Pop II";
  if (txt === "Metal-rich (inner disk)") return "Metal-rich";
  return txt;
}

function hasPositiveLifeSignal(value) {
  return /^yes$/i.test(String(value || "").trim());
}

function hasYoungLifeSignal(value) {
  return /young/i.test(String(value || ""));
}

function indefiniteArticleFor(text) {
  return /^[aeiou]/i.test(String(text || "").trim()) ? "an" : "a";
}

function describeSpectralKind(classValue, isBrownDwarf) {
  const raw = String(classValue || "").trim();
  if (isBrownDwarf) return raw ? `${raw} brown dwarf` : "brown dwarf";
  const spectralLetter = raw.match(/[OBAFGKM]/i)?.[0]?.toUpperCase() || "";
  const family =
    {
      O: "hot O-type star",
      B: "blue B-type star",
      A: "white A-type star",
      F: "yellow-white F-type star",
      G: "G-type main-sequence star",
      K: "cool K-type star",
      M: "red M-type star",
    }[spectralLetter] || "main-sequence star";
  return raw ? `${family} (${raw})` : family;
}

function buildLifeInterpretation({ lifeValue, isBrownDwarf }) {
  if (isBrownDwarf) {
    return "Direct Earth-like life is not assigned to substellar hosts; use the current temperate-zone and moon outputs for habitability work.";
  }
  if (hasPositiveLifeSignal(lifeValue)) {
    return "Earth-like life is plausible at the current age by the Star page rule of thumb.";
  }
  if (hasYoungLifeSignal(lifeValue)) {
    return "Earth-like life is delayed by the current age; let the star mature or choose an older system.";
  }
  return "Earth-like life is unlikely for this focused host under the current mass and age rule.";
}

function buildTopologyInterpretation({
  isMulti,
  topologyLabel,
  activeHostFrameLabel,
  activeHostFrameModeLabel,
  topologyHealth,
}) {
  if (!isMulti) {
    return "Single-star layout keeps future planets, moons, and debris anchored to this host.";
  }
  const healthHeadline = String(topologyHealth?.headline || "").trim();
  const healthCopy = healthHeadline ? ` Hierarchy health: ${healthHeadline}.` : "";
  return `${topologyLabel} layout defaults future orbits to ${activeHostFrameLabel} (${activeHostFrameModeLabel}).${healthCopy}`;
}

export function buildStarResultSummary({
  focusedStar,
  model,
  activity,
  isMulti,
  topologyLabel,
  topologyHealth,
  activeHostFrameLabel,
  activeHostFrameModeLabel,
  classValue,
  zoneLabel,
  zoneValue,
  lifeValue,
  isBrownDwarf,
  energeticRecurrenceText,
  formatLuminosityLsol,
} = {}) {
  const name = String(focusedStar?.name || "Focused star").trim() || "Focused star";
  const spectralKind = describeSpectralKind(classValue, isBrownDwarf);
  const article = indefiniteArticleFor(spectralKind);
  const luminosity = Number(model?.luminosityLsol);
  const formatLuminosity =
    typeof formatLuminosityLsol === "function"
      ? formatLuminosityLsol
      : (value) => String(value ?? "n/a");
  const luminosityCopy = Number.isFinite(luminosity)
    ? ` at ${formatLuminosity(luminosity, 3)} Lsol`
    : "";
  const zoneCopy = zoneValue
    ? `The current ${String(zoneLabel || "temperate zone").toLowerCase()} spans ${zoneValue} AU.`
    : "No temperate-zone distance is available yet.";
  const lifeCopy = buildLifeInterpretation({ lifeValue, isBrownDwarf });
  const topologyCopy = buildTopologyInterpretation({
    isMulti,
    topologyLabel,
    activeHostFrameLabel,
    activeHostFrameModeLabel,
    topologyHealth,
  });
  const activityCopy = activity?.teffBin
    ? `Activity reads as ${activity.teffBin}/${activity.ageBand}, with energetic flares about every ${energeticRecurrenceText}.`
    : "";
  const blocked =
    topologyHealth?.blocked || /blocked|inverted|caution/i.test(topologyHealth?.headline || "");
  const tone =
    blocked || hasYoungLifeSignal(lifeValue)
      ? "warning"
      : hasPositiveLifeSignal(lifeValue)
        ? "good"
        : "neutral";

  return {
    tone,
    body: `${name} is ${article} ${spectralKind}${luminosityCopy}. ${zoneCopy} ${lifeCopy} ${topologyCopy} ${activityCopy}`.trim(),
    items: [
      { label: "Focus", value: name },
      { label: "Temperate zone", value: zoneValue ? `${zoneValue} AU` : "n/a" },
      {
        label: isMulti ? "Hierarchy" : "Life signal",
        value: isMulti ? topologyHealth?.headline || "Check" : lifeValue || "n/a",
      },
    ],
  };
}

export function createStarOutputModelHelpers({
  buildDefaultOrbitHostSummary,
  buildHostFrameOptionText,
  buildLuminosityKpiMeta,
  buildLuminosityKpiTooltip,
  formatHostZoneValue,
  formatLuminosityLsol,
  formatScaledLuminosityLsol,
  formatNumber,
  getHostClassLabel,
  getHostClassValue,
  getHostLifetimeLabel,
  getHostLifetimeMeta,
  getHostLifetimeValue,
  getHostZoneLabel,
  isBrownDwarfModel,
  regimeDisplayLabel,
} = {}) {
  function buildStarOutputViewModel({
    state,
    focusedStar,
    model,
    activity,
    companionModel = null,
    tertiaryModel = null,
    quaternaryModel = null,
    hostFrameRecords = [],
    topologyHealth = {},
    activeHostFrameRecord = null,
  } = {}) {
    const energeticRecurrenceText = formatRecurrence(
      activity?.energeticFlareRatePerDay,
      formatNumber,
    );
    const totalRecurrenceText = formatRecurrence(activity?.totalFlareRatePerDay, formatNumber);
    const cmeTotalMeta =
      activity?.teffBin === "FGK"
        ? "Solar-cycle envelope split into associated + background"
        : "Empirical split model outside FGK solar envelope";
    const xuvFluxMeta = isBrownDwarfModel(model)
      ? `${model.display.xuvFluxRatioEarth} | negligible`
      : `${model.display.xuvFluxRatioEarth} | saturation ${model.display.xuvSaturationAge}`;
    const life = model.earthLikeLifePossible;
    const classLabel = getHostClassLabel(model);
    const classValue = getHostClassValue(model);
    const zoneLabel = getHostZoneLabel(model);
    const zoneValue = formatHostZoneValue(model);
    const zoneMeta = `AU | ${model.display.hzMkm} million km`;
    const lifetimeLabel = getHostLifetimeLabel(model);
    const lifetimeValue = getHostLifetimeValue(model);
    const lifetimeMeta = getHostLifetimeMeta(model);
    const lifeLabel = isBrownDwarfModel(model) ? "Direct Earth-like Life" : "Earth-like Life?";
    const lifeValue = isBrownDwarfModel(model) ? "No (substellar host)" : life;
    const lifeMeta = isBrownDwarfModel(model)
      ? "Use the current temperate zone and moon outputs instead"
      : "";
    const topologyLabel =
      state.topologyKind === "quad"
        ? state.quadLayoutKind === "paired"
          ? "Quad (Paired)"
          : "Quad (Chain)"
        : state.topologyKind === "triple"
          ? "Triple"
          : state.topologyKind === "binary"
            ? "Binary"
            : "Single";
    const isMulti = state.topologyKind !== "single";
    const isTripleLike = state.topologyKind === "triple" || state.topologyKind === "quad";
    const isQuad = state.topologyKind === "quad";
    const activeHostFrameLabel = activeHostFrameRecord
      ? buildHostFrameOptionText(activeHostFrameRecord)
      : "Star A";
    const activeHostFrameModeLabel =
      activeHostFrameRecord?.frameKind === "pair"
        ? "Pair host (P-type barycentric default)"
        : "Star host (S-type circumstellar default)";
    const tertiaryPairLabel =
      state.topologyKind === "quad" && state.quadLayoutKind === "paired"
        ? "Inner Pair C+D"
        : "Outer Pair (A+B)+C";
    const quaternaryPairLabel =
      state.topologyKind === "quad" && state.quadLayoutKind === "paired"
        ? "Root Pair (A+B)+(C+D)"
        : "Outer Pair ((A+B)+C)+D";

    const starKpi = (label, value, meta = "", overrides = {}) => ({
      label,
      tip: TIP_LABEL[overrides.tipLabel || label] || "",
      value,
      meta,
      ...overrides,
    });
    const collapsedKpiSection = (section) => ({
      ...section,
      collapsible: true,
      open: false,
    });

    const systemContextItems = [
      ...(isMulti
        ? [
            starKpi("Topology", topologyLabel, `${hostFrameRecords.length} host frame(s)`, {
              tipLabel: "Topology",
            }),
            starKpi("Default Orbit Host", activeHostFrameLabel, "Default future orbit host", {
              tipLabel: "Default Orbit Host",
            }),
            starKpi(
              "Secondary Mass",
              formatNumber(state.companionMassMsol, 4),
              `${getHostClassValue(companionModel)} | ${formatLuminosityLsol(companionModel?.luminosityLsol || 0, 3)} Lsol`,
              { tipLabel: "Companion Star" },
            ),
            starKpi(
              "Inner Pair A+B",
              formatNumber(state.binarySemiMajorAxisAu, 3),
              `AU | e = ${formatNumber(state.binaryEccentricity, 3)}`,
              { tipLabel: "Binary Pair" },
            ),
            starKpi("Hierarchy Health", topologyHealth.headline, topologyHealth.summary, {
              tipLabel: "Hierarchy Health",
            }),
            ...(isTripleLike
              ? [
                  starKpi(
                    "Tertiary Mass",
                    formatNumber(state.tertiaryMassMsol, 4),
                    `${getHostClassValue(tertiaryModel)} | ${formatLuminosityLsol(tertiaryModel?.luminosityLsol || 0, 3)} Lsol`,
                    { tipLabel: "Tertiary Star" },
                  ),
                  starKpi(
                    tertiaryPairLabel,
                    formatNumber(state.tripleOuterSemiMajorAxisAu, 3),
                    `AU | e = ${formatNumber(state.tripleOuterEccentricity, 3)}`,
                    { tipLabel: "Hierarchy Pair" },
                  ),
                ]
              : []),
            ...(isQuad
              ? [
                  starKpi(
                    "Quaternary Mass",
                    formatNumber(state.quaternaryMassMsol, 4),
                    `${getHostClassValue(quaternaryModel)} | ${formatLuminosityLsol(quaternaryModel?.luminosityLsol || 0, 3)} Lsol`,
                    { tipLabel: "Quaternary Star" },
                  ),
                  starKpi(
                    quaternaryPairLabel,
                    formatNumber(state.quadOuterSemiMajorAxisAu, 3),
                    `AU | e = ${formatNumber(state.quadOuterEccentricity, 3)}`,
                    { tipLabel: "Hierarchy Pair" },
                  ),
                ]
              : []),
          ]
        : []),
      starKpi(
        "Giant Planet Probability",
        `${formatNumber(model.giantPlanetProbability * 100, 1)}%`,
        "Fischer & Valenti (2005); Johnson et al. (2010)",
      ),
    ];

    const systemDetailItems = [
      ...(isMulti
        ? [
            { label: "Topology", value: topologyLabel },
            { label: "Default Orbit Host", value: activeHostFrameLabel },
            {
              label: "Hierarchy Health",
              value: topologyHealth.headline,
              meta: `${topologyHealth.summary} ${topologyHealth.fluxSummary}`.trim(),
            },
            {
              label: "Secondary Star",
              value: `${state.companionName} (${getHostClassValue(companionModel)})`,
              meta: `${formatNumber(state.companionMassMsol, 4)} Msol`,
            },
            {
              label: "Inner Pair A+B",
              value: `${formatNumber(state.binarySemiMajorAxisAu, 3)} AU`,
              meta: `e ${formatNumber(state.binaryEccentricity, 3)} | i ${formatNumber(state.binaryInclinationDeg, 1)}°`,
            },
            ...(isTripleLike
              ? [
                  {
                    label: "Tertiary Star",
                    value: `${state.tertiaryName} (${getHostClassValue(tertiaryModel)})`,
                    meta: `${formatNumber(state.tertiaryMassMsol, 4)} Msol`,
                  },
                  {
                    label: tertiaryPairLabel,
                    value: `${formatNumber(state.tripleOuterSemiMajorAxisAu, 3)} AU`,
                    meta: `e ${formatNumber(state.tripleOuterEccentricity, 3)} | i ${formatNumber(state.tripleOuterInclinationDeg, 1)}°`,
                  },
                ]
              : []),
            ...(isQuad
              ? [
                  {
                    label: "Quaternary Star",
                    value: `${state.quaternaryName} (${getHostClassValue(quaternaryModel)})`,
                    meta: `${formatNumber(state.quaternaryMassMsol, 4)} Msol`,
                  },
                  {
                    label: quaternaryPairLabel,
                    value: `${formatNumber(state.quadOuterSemiMajorAxisAu, 3)} AU`,
                    meta: `e ${formatNumber(state.quadOuterEccentricity, 3)} | i ${formatNumber(state.quadOuterInclinationDeg, 1)}°`,
                  },
                ]
              : []),
          ]
        : []),
      {
        label: "Giant Planet Probability",
        value: `${formatNumber(model.giantPlanetProbability * 100, 1)}%`,
        meta: "Fischer & Valenti (2005); Johnson et al. (2010)",
      },
    ];

    const resultSummary = buildStarResultSummary({
      focusedStar,
      model,
      activity,
      isMulti,
      topologyLabel,
      topologyHealth,
      activeHostFrameLabel,
      activeHostFrameModeLabel,
      classValue,
      zoneLabel,
      zoneValue,
      lifeValue,
      isBrownDwarf: isBrownDwarfModel(model),
      energeticRecurrenceText,
      formatLuminosityLsol,
    });

    const kpiSections = [
      {
        id: "star-summary",
        title: "Key Numbers",
        items: [
          starKpi(
            "Focused Star Preview",
            `${model.starColourHex}`,
            "Hex (derived from temperature) - Animated at 0.5 d/s with flares + CMEs",
            {
              kind: "sunVisual",
              tipLabel: "Star Colour",
            },
          ),
          starKpi(
            classLabel,
            classValue,
            isBrownDwarfModel(model) ? regimeDisplayLabel(model.regime) : "",
            {
              tipLabel: isBrownDwarfModel(model) ? "Brown Dwarf Class" : "Class",
            },
          ),
          starKpi(
            "Radius",
            formatNumber(model.radiusRsol, 3),
            `Rsol | ${formatNumber(model.metric.radiusKm, 0)} km${model.radiusOverridden ? " (Override)" : ""}`,
          ),
          starKpi(
            "Luminosity",
            formatScaledLuminosityLsol(model.luminosityLsol, 3),
            buildLuminosityKpiMeta(model),
            { tip: buildLuminosityKpiTooltip(model) },
          ),
          starKpi("Temperature", formatNumber(model.tempK, 0), "K"),
          starKpi(zoneLabel, zoneValue, zoneMeta, { tipLabel: "Habitable Zone" }),
          starKpi("Activity Regime", `${activity.teffBin}/${activity.ageBand}`, "Teff + age bins"),
          starKpi(lifeLabel, lifeValue, lifeMeta, { tipLabel: "Earth-like Life?" }),
        ],
      },
      collapsedKpiSection({
        id: "star-identity",
        title: "Identity & Class",
        density: "compact",
        items: [
          starKpi("Current Age", formatNumber(state.ageGyr, 3), "Gyr"),
          starKpi("Metallicity [Fe/H]", formatNumber(state.metallicityFeH, 2), "dex"),
          starKpi(
            "Population",
            shortPopulationLabel(model.populationLabel),
            `${model.populationLabel} | [Fe/H] = ${formatNumber(model.inputs.metallicityFeH, 2)}`,
            { tipLabel: "Stellar Population" },
          ),
        ],
      }),
      collapsedKpiSection({
        id: "star-physical",
        title: "Physical State",
        density: "compact",
        items: [
          starKpi(lifetimeLabel, lifetimeValue, lifetimeMeta, {
            tipLabel: isBrownDwarfModel(model) ? "Maximum Age" : lifetimeLabel,
          }),
          starKpi(
            "Radius",
            formatNumber(model.radiusRsol, 3),
            `Rsol | ${formatNumber(model.metric.radiusKm, 0)} km${model.radiusOverridden ? " (Override)" : ""}`,
          ),
          starKpi(
            "Luminosity",
            formatScaledLuminosityLsol(model.luminosityLsol, 3),
            buildLuminosityKpiMeta(model),
            { tip: buildLuminosityKpiTooltip(model) },
          ),
          starKpi("Density", formatNumber(model.densityGcm3, 3), "g/cm³"),
          starKpi("Temperature", formatNumber(model.tempK, 0), "K"),
        ],
      }),
      collapsedKpiSection({
        id: "star-environment",
        title: "Environment",
        density: "compact",
        items: [starKpi(zoneLabel, zoneValue, zoneMeta, { tipLabel: "Habitable Zone" })],
      }),
      collapsedKpiSection({
        id: "star-system",
        title: "System Context",
        density: "compact",
        items: systemContextItems,
      }),
      collapsedKpiSection({
        id: "star-activity",
        title: "Activity & Radiation",
        density: "compact",
        items: [
          starKpi("Activity Regime", `${activity.teffBin}/${activity.ageBand}`, "Teff + age bins"),
          starKpi("XUV Regime", model.display.xuvRegime, model.display.xuvSaturationAge),
          starKpi("XUV Flux at 1 AU", model.display.xuvFluxAt1Au, xuvFluxMeta),
          starKpi("XUV Luminosity", model.display.xuvLuminosityW, model.display.xuvLuminosityErgS),
          starKpi(
            "N32 Rate",
            formatNumber(activity.energeticFlareRatePerDay, 3),
            "flares/day (>1e32 erg)",
            { tipLabel: "Energetic Flare Rate (>1e32 erg)" },
          ),
          starKpi("Energetic Flare Recurrence", energeticRecurrenceText, "for >1e32 erg flares"),
          starKpi(
            "Total Flare Rate (>1e30 erg)",
            formatNumber(activity.totalFlareRatePerDay, 3),
            "flares/day",
          ),
          starKpi("Total Flare Recurrence", totalRecurrenceText, "for >1e30 erg flares"),
          starKpi(
            "Associated CME Rate",
            formatNumber(activity.cmeAssociatedRatePerDay, 3),
            "CME/day",
          ),
          starKpi(
            "Background CME Rate",
            formatNumber(activity.cmeBackgroundRatePerDay, 3),
            "CME/day",
          ),
          starKpi("Total CME Rate", formatNumber(activity.cmeTotalRatePerDay, 3), cmeTotalMeta),
          starKpi(
            "Solar CME Envelope (FGK)",
            activity.teffBin === "FGK" ? "0.5 to 6.0/day" : "n/a",
            activity.teffBin === "FGK" ? "Solar-cycle observed range" : "FGK stars only",
          ),
        ],
      }),
      collapsedKpiSection({
        id: "star-habitability",
        title: "Habitability",
        density: "compact",
        items: [starKpi(lifeLabel, lifeValue, lifeMeta, { tipLabel: "Earth-like Life?" })],
      }),
    ];

    const detailSections = [
      {
        id: "star-details-identity",
        title: "Identity & Class",
        items: [
          { label: "Name", value: focusedStar.name },
          { label: classLabel, value: classValue },
          { label: "Current Age", value: `${formatNumber(state.ageGyr, 3)} Gyr` },
          { label: "Metallicity [Fe/H]", value: `${formatNumber(state.metallicityFeH, 2)} dex` },
          { label: "Population", value: model.populationLabel },
          { label: "Stellar Evolution", value: model.evolutionMode === "evolved" ? "On" : "Off" },
          {
            label: "Physics Mode",
            value: focusedStar.physicsMode === "advanced" ? "Advanced" : "Simple",
          },
        ],
      },
      {
        id: "star-details-physical",
        title: "Physical State",
        items: [
          { label: lifetimeLabel, value: lifetimeValue, meta: lifetimeMeta },
          {
            label: "Radius",
            value: `${formatNumber(model.radiusRsol, 3)} Rsol`,
            meta: `${formatNumber(model.metric.radiusKm, 0)} km`,
          },
          {
            label: "Luminosity",
            value: `${formatLuminosityLsol(model.luminosityLsol, 3)} Lsol`,
            meta: `${formatNumber(model.metric.luminosityW, 0)} W`,
          },
          { label: "Density", value: `${formatNumber(model.densityGcm3, 3)} g/cm³` },
          { label: "Temperature", value: `${formatNumber(model.tempK, 0)} K` },
        ],
      },
      {
        id: "star-details-environment",
        title: "Environment",
        items: [
          {
            label: zoneLabel,
            value: zoneValue,
            meta: `${model.display.hzMkm} million km`,
          },
          { label: "Star Colour", value: model.starColourHex },
        ],
      },
      {
        id: "star-details-system",
        title: "System Context",
        items: systemDetailItems,
      },
      {
        id: "star-details-activity",
        title: "Activity & Radiation",
        items: [
          { label: "Activity Regime", value: `${activity.teffBin}/${activity.ageBand}` },
          {
            label: "XUV Regime",
            value: model.display.xuvRegime,
            meta: model.display.xuvSaturationAge,
          },
          {
            label: "XUV Flux at 1 AU",
            value: model.display.xuvFluxAt1Au,
            meta: model.display.xuvFluxRatioEarth,
          },
          {
            label: "XUV Luminosity",
            value: model.display.xuvLuminosityW,
            meta: model.display.xuvLuminosityErgS,
          },
          {
            label: "N32 Rate",
            value: `${formatNumber(activity.energeticFlareRatePerDay, 3)} flares/day`,
          },
          { label: "Energetic Flare Recurrence", value: energeticRecurrenceText },
          {
            label: "Total Flare Rate (>1e30 erg)",
            value: `${formatNumber(activity.totalFlareRatePerDay, 3)} flares/day`,
          },
          { label: "Total Flare Recurrence", value: totalRecurrenceText },
          {
            label: "Associated CME Rate",
            value: `${formatNumber(activity.cmeAssociatedRatePerDay, 3)} CME/day`,
          },
          {
            label: "Background CME Rate",
            value: `${formatNumber(activity.cmeBackgroundRatePerDay, 3)} CME/day`,
          },
          {
            label: "Total CME Rate",
            value: `${formatNumber(activity.cmeTotalRatePerDay, 3)} CME/day`,
            meta: cmeTotalMeta,
          },
          {
            label: "Solar CME Envelope (FGK)",
            value: activity.teffBin === "FGK" ? "0.5 to 6.0/day" : "n/a",
            meta: activity.teffBin === "FGK" ? "Solar-cycle observed range" : "FGK stars only",
          },
        ],
      },
      {
        id: "star-details-habitability",
        title: "Habitability",
        items: [{ label: lifeLabel, value: lifeValue, meta: lifeMeta }],
      },
    ];

    return {
      classLabel,
      classValue,
      detailSections,
      isMulti,
      kpiSections,
      resultSummary,
      currentStateSummary: {
        activeHostFrameLabel,
        activeHostFrameModeLabel,
        defaultOrbitHostSummary: buildDefaultOrbitHostSummary(activeHostFrameRecord),
        hostFrameCount: hostFrameRecords.length,
        isMulti,
        topologyHealth,
        topologyLabel,
      },
    };
  }

  return {
    buildStarOutputViewModel,
  };
}
