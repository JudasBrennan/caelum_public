function fmtNumber(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return Number(num.toFixed(digits)).toString();
}

function fmtLuminosityLsol(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  const abs = Math.abs(num);
  if (abs === 0) return "0";
  if (abs < 1e-4) return num.toExponential(2);
  if (abs < 0.01) return fmtNumber(num, Math.max(digits, 6));
  return fmtNumber(num, digits);
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

function subtypeSummaryLine(body) {
  const labels = Array.isArray(body?.subtypeLabels)
    ? body.subtypeLabels
    : Array.isArray(body?.subtypeSummary?.subtypes)
      ? body.subtypeSummary.subtypes.map((entry) => entry?.label).filter(Boolean)
      : [];
  const primaryLabel =
    String(body?.primarySubtypeLabel || body?.subtypeSummary?.primarySubtypeLabel || "").trim() ||
    labels[0] ||
    "";
  const value = labels.length ? labels.join(", ") : primaryLabel;
  return value ? { label: labels.length > 1 ? "Subtypes" : "Subtype", value } : null;
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
  const subtypeLine = subtypeSummaryLine(planet);
  if (planet?.renderFamily === "volatile") {
    const lines = [
      { label: "Radius", value: `${fmtNumber(planet?.radiusEarth, 2)} Earth` },
      { label: "Envelope", value: planet?.envelopeState || "H/He envelope" },
      {
        label: "Surface",
        value: "No accessible solid surface model",
      },
      { label: "Moons", value: String(Array.isArray(planet?.moons) ? planet.moons.length : 0) },
    ];
    if (subtypeLine) lines.splice(1, 0, subtypeLine);
    return {
      title: planet?.name || "Planet",
      subtitle: `${planet?.classLabel || "Mini-Neptune"} | ${fmtNumber(planet?.au, 2)} AU`,
      lines,
      note: "Volatile planets use envelope and transit-radius outputs rather than rocky surface climate outputs.",
    };
  }
  const lines = [
    { label: "Radius", value: `${fmtNumber(planet?.radiusEarth, 2)} Earth` },
    { label: "Surface temp", value: `${fmtNumber(planet?.surfaceTempK, 0)} K` },
    { label: "Moons", value: String(Array.isArray(planet?.moons) ? planet.moons.length : 0) },
  ];
  if (subtypeLine) lines.splice(1, 0, subtypeLine);
  return {
    title: planet?.name || "Planet",
    subtitle: `${planet?.classLabel || "Rocky planet"} | ${fmtNumber(planet?.au, 2)} AU`,
    lines,
  };
}

function summarizeGasGiant(gasGiant) {
  const classLabel = gasGiant?.classLabel || "Gas giant";
  const isBrownDwarf = String(gasGiant?.companionClass || gasGiant?.regime || "") === "brownDwarf";
  const lines = [{ label: "Radius", value: `${fmtNumber(gasGiant?.radiusRj, 2)} RJ` }];
  const subtypeLine = subtypeSummaryLine(gasGiant);
  if (subtypeLine) lines.push(subtypeLine);
  if (isBrownDwarf) {
    if (gasGiant?.gasCalc?.classification?.substellarClass) {
      lines.push({
        label: "Class",
        value: gasGiant.gasCalc.classification.substellarClass,
      });
    }
    lines.push({
      label: "Luminosity",
      value: `${fmtLuminosityLsol(gasGiant?.gasCalc?.luminosityLsol, 6)} Lsol`,
    });
    lines.push({
      label: "Intrinsic temp",
      value: `${fmtNumber(gasGiant?.gasCalc?.thermal?.effectiveTempK, 0)} K`,
    });
  } else {
    lines.push({
      label: "Effective temp",
      value: `${fmtNumber(gasGiant?.gasCalc?.thermal?.effectiveTempK, 0)} K`,
    });
  }
  lines.push({
    label: "Moons",
    value: String(Array.isArray(gasGiant?.moons) ? gasGiant.moons.length : 0),
  });
  return {
    title: gasGiant?.name || classLabel,
    subtitle: `${classLabel} | ${fmtNumber(gasGiant?.au, 2)} AU`,
    lines,
  };
}

function summarizeComet(comet) {
  if (!comet) return null;
  const comaValue =
    Number(comet.comaRadiusKm) > 0 ? `${fmtNumber(comet.comaRadiusKm, 0)} km` : "None";
  const dustTailValue =
    Number(comet.dustTailLengthAu) > 0 ? `${fmtNumber(comet.dustTailLengthAu, 3)} AU` : "None";
  const ionTailValue =
    Number(comet.ionTailLengthAu) > 0 ? `${fmtNumber(comet.ionTailLengthAu, 3)} AU` : "None";
  return {
    title: comet.name || "Comet",
    subtitle: `${comet.dynamicalClass || "Comet"} | ${fmtNumber(comet.currentRadiusAu, 2)} AU`,
    lines: [
      { label: "Source", value: comet.sourceLabel || comet.sourceReservoir || "Manual" },
      { label: "Activity", value: comet.activityState || "Dormant" },
      { label: "Current radius", value: `${fmtNumber(comet.currentRadiusAu, 3)} AU` },
      { label: "Coma", value: comaValue },
      { label: "Dust tail", value: dustTailValue },
      { label: "Ion tail", value: ionTailValue },
    ],
    note: "Long-period comet orbits are clipped to the inner system in Local Frame so they do not distort scene scale.",
  };
}

function summarizeStar(snapshot) {
  const hostFrameLabel = String(snapshot?.activeHostFrameLabel || "").trim();
  const isPairHost = snapshot?.activeHostFrame?.frameKind === "pair";
  const hierarchySummary =
    snapshot?.hierarchySummary && typeof snapshot.hierarchySummary === "object"
      ? snapshot.hierarchySummary
      : null;
  const subtitle =
    hostFrameLabel && (snapshot?.topologyKind || "single") !== "single"
      ? isPairHost
        ? hierarchySummary?.isHierarchical
          ? `${hostFrameLabel} local host frame`
          : `${hostFrameLabel} barycenter host`
        : hierarchySummary?.isHierarchical
          ? `${hostFrameLabel} local host star`
          : `${hostFrameLabel} host star`
      : "Primary star";
  const lines = [
    {
      label: isPairHost ? "System mass" : "Mass",
      value: `${fmtNumber(snapshot?.starMassMsol, 2)} Msol`,
    },
    { label: "Age", value: `${fmtNumber(snapshot?.starAgeGyr, 2)} Gyr` },
    { label: "Luminosity", value: `${fmtLuminosityLsol(snapshot?.starLuminosityLsun, 2)} Lsol` },
    { label: "Temperature", value: `${fmtNumber(snapshot?.starTempK, 0)} K` },
  ];

  const localClimateDrivers =
    hierarchySummary?.localClimateDrivers?.length > 0
      ? hierarchySummary.localClimateDrivers
      : Array.isArray(snapshot?.hostStars)
        ? snapshot.hostStars.map((entry) => entry?.name).filter(Boolean)
        : [];
  if ((snapshot?.topologyKind || "single") !== "single" && localClimateDrivers.length > 0) {
    lines.push({
      label: "Local climate drivers",
      value: localClimateDrivers.join(", "),
    });
  }
  if (hierarchySummary?.outerBranches?.length > 0) {
    lines.push({
      label: hierarchySummary.outerBranches.length > 1 ? "Outer branches" : "Outer branch",
      value: hierarchySummary.outerBranches.map((branch) => branch.label).join(" | "),
    });
  } else if ((snapshot?.topologyKind || "single") !== "single") {
    lines.push({
      label: "Companion flux",
      value:
        Number(snapshot?.companionFluxEarth || 0) > 0.0005
          ? `${fmtNumber(snapshot?.companionFluxEarth, 3)}x Earth`
          : "Negligible",
    });
  }
  if (hierarchySummary?.notToScale) {
    lines.push({
      label: "Orientation",
      value: "Hierarchy inset and companion context are schematic, not to scale.",
    });
  }
  return {
    title: snapshot?.starName || "Star",
    subtitle,
    lines,
  };
}

function formatAssignedBodyCounts(bodyCounts) {
  if (!bodyCounts || typeof bodyCounts !== "object") return "None";
  const parts = [];
  if (Number(bodyCounts.rockyPlanets) > 0) {
    parts.push(
      `${Number(bodyCounts.rockyPlanets)} rocky planet${Number(bodyCounts.rockyPlanets) === 1 ? "" : "s"}`,
    );
  }
  if (Number(bodyCounts.volatilePlanets) > 0) {
    parts.push(
      `${Number(bodyCounts.volatilePlanets)} volatile planet${Number(bodyCounts.volatilePlanets) === 1 ? "" : "s"}`,
    );
  }
  if (Number(bodyCounts.gasGiants) > 0) {
    parts.push(
      `${Number(bodyCounts.gasGiants)} gas giant${Number(bodyCounts.gasGiants) === 1 ? "" : "s"}`,
    );
  }
  if (Number(bodyCounts.brownDwarfs) > 0) {
    parts.push(
      `${Number(bodyCounts.brownDwarfs)} brown dwarf${Number(bodyCounts.brownDwarfs) === 1 ? "" : "s"}`,
    );
  }
  if (Number(bodyCounts.debrisDisks) > 0) {
    parts.push(
      `${Number(bodyCounts.debrisDisks)} debris disk${Number(bodyCounts.debrisDisks) === 1 ? "" : "s"}`,
    );
  }
  return parts.join(" | ") || "None";
}

export function getOverviewSelectionSummary(snapshot) {
  if (!snapshot?.overviewModel || !snapshot?.activeHostFrameId) return null;
  const activeNode = snapshot.overviewModel.nodesById?.[snapshot.activeHostFrameId] || null;
  if (!activeNode) return null;
  const topologyKind = String(snapshot?.topologyKind || "single");
  const hierarchySummary =
    snapshot?.hierarchySummary && typeof snapshot.hierarchySummary === "object"
      ? snapshot.hierarchySummary
      : null;
  const isPairHost = activeNode.kind === "pair";
  const outerBranchLabels = Array.isArray(hierarchySummary?.outerBranches)
    ? hierarchySummary.outerBranches.map((branch) => branch?.label).filter(Boolean)
    : [];
  const localClimateDrivers = Array.isArray(hierarchySummary?.localClimateDrivers)
    ? hierarchySummary.localClimateDrivers.filter(Boolean)
    : [];
  const activePathNodeIds = Array.isArray(snapshot?.overviewModel?.activePathNodeIds)
    ? snapshot.overviewModel.activePathNodeIds
    : [];
  const pathLabels = activePathNodeIds
    .map((nodeId) => snapshot?.overviewModel?.nodesById?.[nodeId]?.shortLabel || nodeId)
    .filter(Boolean);
  const lines = [];
  if (topologyKind === "single") {
    lines.push({
      label: "System kind",
      value: "Single star",
    });
  } else {
    lines.push({
      label: "Hierarchy path",
      value: pathLabels.join(" -> ") || activeNode.id,
    });
  }
  if (localClimateDrivers.length > 0) {
    lines.push({
      label: "Local climate drivers",
      value: localClimateDrivers.join(", "),
    });
  }
  if (outerBranchLabels.length > 0) {
    lines.push({
      label: outerBranchLabels.length > 1 ? "Outer branches" : "Outer branch",
      value: outerBranchLabels.join(" | "),
    });
  }
  lines.push({
    label: "Assigned bodies",
    value: formatAssignedBodyCounts(activeNode.bodyCounts),
  });
  lines.push({
    label: "Host frame kind",
    value:
      topologyKind === "single"
        ? "Single-star"
        : isPairHost
          ? "Circumbinary / pair barycentre"
          : "Circumstellar / star host",
  });
  const subtitle =
    topologyKind === "single"
      ? "Single-star host frame"
      : isPairHost
        ? topologyKind === "binary"
          ? "Binary pair host frame"
          : "Pair host frame"
        : topologyKind === "binary"
          ? "Binary star host frame"
          : "Star host frame";
  const note =
    topologyKind === "single"
      ? "System overview is schematic and not to scale. This system has one host frame; use View locally for detailed orbits."
      : topologyKind === "binary"
        ? "System overview is schematic and not to scale. Click a star or the pair barycentre to inspect a different host frame."
        : "System overview is schematic and not to scale. Click another star or pair to inspect a different branch.";

  return {
    title: snapshot?.activeHostFrameLabel || activeNode.label || "Selected frame",
    subtitle,
    lines,
    note,
    actions: [{ id: "view-locally", label: "View locally" }],
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
  if (kind === "comet") {
    const comet = (snapshot.comets || []).find((entry) => entry?.id === id);
    return comet ? summarizeComet(comet) : null;
  }
  return null;
}
