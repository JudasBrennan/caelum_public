function fmtNumber(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return Number(num.toFixed(digits)).toString();
}

function describeMoonSolventPathway(moonCalc) {
  const pathway = String(moonCalc?.habitability?.breakdown?.solventPathway || "");
  if (pathway === "subsurface-water") {
    return "Score currently benefits from subsurface-water support. Surface biology may still remain sterile.";
  }
  if (pathway === "alternative-solvent") {
    return "Score currently benefits from the alternative-solvent policy path.";
  }
  return "Surface and subsurface moon-world outputs are derived from the saved moon inputs.";
}

function summarizeMoon(parent, moon) {
  const moonCalc = moon?.moonCalc;
  if (!moonCalc) return null;
  const parentName = parent?.name || "Parent body";
  return {
    title: moon.name || "Moon",
    subtitle: `Moon around ${parentName}`,
    lines: [
      { label: "Atmosphere", value: moonCalc.display?.atmosphereClass || "Airless" },
      { label: "Hydrosphere", value: moonCalc.display?.hydrosphereState || "Dry surface" },
      { label: "Climate", value: moonCalc.display?.climateState || "Unknown" },
      { label: "Biosphere", value: moonCalc.display?.surfaceBiosphere || "Surface sterile" },
      {
        label: "Habitability",
        value:
          moonCalc.display?.habitabilityIndex ||
          fmtNumber(moonCalc.habitability?.habitabilityIndex, 3),
      },
      {
        label: "Surface vs subsurface",
        value:
          moonCalc.display?.subsurfaceOcean ||
          (moonCalc.hydrosphere?.subsurfaceOceanPresent ? "Yes" : "No"),
      },
    ],
    note: describeMoonSolventPathway(moonCalc),
  };
}

function summarizePlanet(planet) {
  return {
    title: planet?.name || "Planet",
    subtitle: `Rocky planet | ${fmtNumber(planet?.au, 2)} AU`,
    lines: [
      { label: "Radius", value: `${fmtNumber(planet?.radiusEarth, 2)} Earth` },
      { label: "Surface temp", value: `${fmtNumber(planet?.surfaceTempK, 0)} K` },
      { label: "Moons", value: String(Array.isArray(planet?.moons) ? planet.moons.length : 0) },
    ],
  };
}

function summarizeGasGiant(gasGiant) {
  return {
    title: gasGiant?.name || "Gas giant",
    subtitle: `Gas giant | ${fmtNumber(gasGiant?.au, 2)} AU`,
    lines: [
      { label: "Radius", value: `${fmtNumber(gasGiant?.radiusRj, 2)} RJ` },
      {
        label: "Effective temp",
        value: `${fmtNumber(gasGiant?.gasCalc?.thermal?.effectiveTempK, 0)} K`,
      },
      { label: "Moons", value: String(Array.isArray(gasGiant?.moons) ? gasGiant.moons.length : 0) },
    ],
  };
}

function summarizeStar(snapshot) {
  return {
    title: snapshot?.starName || "Star",
    subtitle: "Primary star",
    lines: [
      { label: "Mass", value: `${fmtNumber(snapshot?.starMassMsol, 2)} Msol` },
      { label: "Age", value: `${fmtNumber(snapshot?.starAgeGyr, 2)} Gyr` },
      { label: "Luminosity", value: `${fmtNumber(snapshot?.starLuminosityLsun, 2)} Lsol` },
      { label: "Temperature", value: `${fmtNumber(snapshot?.starTempK, 0)} K` },
    ],
  };
}

function findMoon(snapshot, moonId) {
  for (const planet of snapshot?.planetNodes || []) {
    const moon = (planet?.moons || []).find((entry) => entry?.id === moonId);
    if (moon) return { parent: planet, moon };
  }
  for (const gasGiant of snapshot?.gasGiants || []) {
    const moon = (gasGiant?.moons || []).find((entry) => entry?.id === moonId);
    if (moon) return { parent: gasGiant, moon };
  }
  return null;
}

export function getFocusedBodySummary(snapshot, kind, id) {
  if (!snapshot || !kind || !id) return null;
  if (kind === "star") return summarizeStar(snapshot);
  if (kind === "planet") {
    const planet = (snapshot.planetNodes || []).find((entry) => entry?.id === id);
    return planet ? summarizePlanet(planet) : null;
  }
  if (kind === "gasGiant") {
    const gasGiant = (snapshot.gasGiants || []).find((entry) => entry?.id === id);
    return gasGiant ? summarizeGasGiant(gasGiant) : null;
  }
  if (kind === "moon") {
    const result = findMoon(snapshot, id);
    return result ? summarizeMoon(result.parent, result.moon) : null;
  }
  return null;
}
