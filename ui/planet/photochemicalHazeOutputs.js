const HAZE_COOLING_NOTE =
  "Cooling potential feeds the Phase 4 coupled-climate diagnostic, but the baseline surface-temperature solve remains unchanged.";

export function buildPhotochemicalHazeOutputItems({ derived, display } = {}) {
  const haze = derived?.photochemistry?.haze || null;
  const hazeClass = String(haze?.hazeClass || "None");
  const showHazeKpi = !!haze && hazeClass !== "None";
  const hazeLightReduction = Number(haze?.surfaceLightReductionFraction);
  const showSurfaceLightDetail = Number.isFinite(hazeLightReduction) && hazeLightReduction >= 0.1;
  const hazeNotes =
    Array.isArray(haze?.notes) && haze.notes.length
      ? haze.notes.join(" | ")
      : "Organic haze likelihood from CH4/CO2, O2, pressure, and UV supply";

  return {
    haze,
    hazeClass,
    compactItem: showHazeKpi
      ? {
          label: "Photochemical Haze",
          value: display?.photochemicalHaze,
          meta: [
            display?.hazeCooling,
            display?.surfaceLightReduction,
            haze?.confidence ? `${haze.confidence} confidence` : "",
          ]
            .filter(Boolean)
            .join(" | "),
        }
      : null,
    environmentDetailItems: [
      {
        label: "Photochemical Haze",
        value: display?.photochemicalHaze || "None",
        meta: hazeNotes,
      },
      {
        label: "Haze Cooling Potential",
        value: display?.hazeCooling || "0.0 K potential",
        meta: HAZE_COOLING_NOTE,
      },
    ],
    habitabilityDetailItems: showSurfaceLightDetail
      ? [
          {
            label: "Surface Light",
            value: display?.surfaceLightReduction,
            meta: `${display?.photochemicalHaze || "Organic haze"} reduces visible light in the surface environment diagnostic.`,
          },
        ]
      : [],
  };
}
