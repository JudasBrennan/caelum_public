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
