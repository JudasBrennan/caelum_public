export function buildGasGiantIntrinsicHeatDetailItems(model, isBrownDwarf) {
  if (isBrownDwarf) return [];
  return [
    {
      label: "Intrinsic Temp",
      value: model.display.intrinsicTemp,
      meta: [model.display.interiorHeatClass, "internal cooling term"].filter(Boolean).join(" | "),
    },
    {
      label: "Heat transport",
      value: model.display.heatTransport,
      meta:
        model.display.intrinsicHeatCaveats ||
        "Auto inferred from mass, density, age, irradiation, and metallicity.",
    },
    {
      label: "Internal flux",
      value: model.display.internalFlux,
      meta: "Interior luminosity per square metre; T_eff^4 = T_eq^4 + T_int^4",
    },
  ];
}

export function buildGasGiantTemperatureItems(model, isBrownDwarf, equilibriumTip = "") {
  const temperatureMeta = isBrownDwarf
    ? `T_eq ${model.display.equilibriumTemp}`
    : [`T_eq ${model.display.equilibriumTemp}`, `T_int ${model.display.intrinsicTemp}`]
        .filter(Boolean)
        .join(" | ");
  return {
    temperatureItem: {
      label: isBrownDwarf ? "Intrinsic Temp" : "Effective Temp",
      tip: equilibriumTip,
      value: model.display.effectiveTemp,
      meta: temperatureMeta,
    },
    equilibriumTemperatureItem: {
      label: "Equilibrium Temp",
      tip: equilibriumTip,
      value: model.display.equilibriumTemp,
      meta: "Absorbed-starlight balance after Bond albedo; excludes intrinsic cooling.",
    },
    intrinsicHeatItems: buildGasGiantIntrinsicHeatDetailItems(model, isBrownDwarf),
  };
}

export function buildGasGiantThermalDetailItems(model, isBrownDwarf) {
  return [
    {
      label: "Equilibrium Temp",
      value: model.display.equilibriumTemp,
      meta: "Absorbed-starlight balance after Bond albedo; excludes intrinsic cooling.",
    },
    ...buildGasGiantIntrinsicHeatDetailItems(model, isBrownDwarf),
    {
      label: "Effective Temp",
      value: model.display.effectiveTemp,
      meta: "Observable emission temperature after intrinsic heat is added.",
    },
  ];
}

export function buildGasGiantCoupledContextItems(model) {
  const ringMeta = [model.display.ringLifetime, model.display.ringSourcePersistence]
    .filter(Boolean)
    .join(" | ");
  const transmissionMeta = model.display.observabilityTransmission
    ? [
        `Transmission features: ${model.display.observabilityTransmission}`,
        model.display.observabilityReadiness
          ? `Readiness: ${model.display.observabilityReadiness}`
          : "",
        model.display.observabilityActivityNoise
          ? `Activity noise: ${model.display.observabilityActivityNoise}`
          : "",
      ]
        .filter(Boolean)
        .join(" | ")
    : "";
  const radiationMeta = [
    model.display.radiationBelts ? `Radiation belts: ${model.display.radiationBelts}` : "",
    model.display.moonPlasmaSource ? `Moon plasma: ${model.display.moonPlasmaSource}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    ringArchitecture: {
      label: "Ring Architecture",
      value: model.display.ringArchitecture || "Not evaluated",
      meta: ringMeta,
    },
    observability: {
      label: "Observability",
      value: model.display.observabilityTransitSnr || "Not evaluated",
      meta: transmissionMeta,
    },
    aurora: {
      label: "Aurora",
      value: model.display.auroraLikelihood || "Not evaluated",
      meta: radiationMeta,
    },
    ringDetailItems: [
      { label: "Ring architecture", value: model.display.ringArchitecture || "Not evaluated" },
      { label: "Ring lifetime", value: model.display.ringLifetime || "Not evaluated" },
      { label: "Ring source", value: model.display.ringSourcePersistence || "Not evaluated" },
      { label: "Moon plasma source", value: model.display.moonPlasmaSource || "Minimal" },
    ],
    observabilityDetail: {
      label: "Observability class",
      value: model.display.observabilityTransitSnr || "Not evaluated",
      meta: [
        transmissionMeta,
        model.display.observabilityAtmospherePersistence
          ? `Atmosphere persistence: ${model.display.observabilityAtmospherePersistence}`
          : "",
      ]
        .filter(Boolean)
        .join(" | "),
    },
    auroraDetail: {
      label: "Aurora likelihood",
      value: model.display.auroraLikelihood || "Not evaluated",
      meta: radiationMeta,
    },
  };
}
