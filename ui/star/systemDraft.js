import {
  buildHomeSystemContext,
  resolveHostFrameContext,
} from "../../engine/homeSystem/context.js";
import { buildTopologyGuardrailSummary } from "../../engine/homeSystem/stability.js";
import { listStellarSystemHostFrames } from "../store/stellarSystemModel.js";
import { getProjectedPrimaryStar, loadWorld } from "../store.js";
import { normalizeQuadLayoutKind } from "./draftState.js";

export function buildHostFrameOptionText(frame) {
  if (!frame) return "Orbit host";
  if (frame.id === "star_a") return `Around Star A (${frame.label})`;
  if (frame.id === "star_b") return `Around Star B (${frame.label})`;
  if (frame.id === "star_c") return `Around Star C (${frame.label})`;
  if (frame.id === "star_d") return `Around Star D (${frame.label})`;
  if (frame.id === "pair_ab") return `Around Pair A+B barycentre (${frame.label})`;
  if (frame.id === "pair_cd") return `Around Pair C+D barycentre (${frame.label})`;
  if (frame.id === "pair_abc") return `Around Pair (A+B)+C barycentre (${frame.label})`;
  if (frame.id === "pair_abcd") return `Around Pair ((A+B)+C)+D barycentre (${frame.label})`;
  if (frame.id === "pair_root") return `Around Pair (A+B)+(C+D) barycentre (${frame.label})`;
  return frame.frameKind === "pair" ? `Around ${frame.label} barycentre` : `Around ${frame.label}`;
}

export function buildDefaultOrbitHostSummary(frame) {
  if (!frame) {
    return "New planets and gas giants will use this host frame by default. Existing bodies keep their current host frame until you reassign them later.";
  }
  if (frame.frameKind === "pair") {
    return `New planets and gas giants will default to orbiting the ${frame.label} barycentre in a P-type frame. Existing bodies keep their current host frame until reassigned on the Planets or System pages.`;
  }
  return `New planets and gas giants will default to orbiting ${frame.label} in an S-type circumstellar frame. Existing bodies keep their current host frame until reassigned on the Planets or System pages.`;
}

function buildTopologyGuardrailInput(draftState = {}) {
  return {
    topologyKind: draftState.topologyKind,
    quadLayoutKind: draftState.quadLayoutKind,
    primaryMassMsol: draftState.massMsol,
    companionMassMsol: draftState.companionMassMsol,
    binarySemiMajorAxisAu: draftState.binarySemiMajorAxisAu,
    binaryEccentricity: draftState.binaryEccentricity,
    binaryInclinationDeg: draftState.binaryInclinationDeg,
    tertiaryMassMsol: draftState.tertiaryMassMsol,
    tripleOuterSemiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
    tripleOuterEccentricity: draftState.tripleOuterEccentricity,
    tripleOuterInclinationDeg: draftState.tripleOuterInclinationDeg,
    quaternaryMassMsol: draftState.quaternaryMassMsol,
    quadOuterSemiMajorAxisAu: draftState.quadOuterSemiMajorAxisAu,
    quadOuterEccentricity: draftState.quadOuterEccentricity,
    quadOuterInclinationDeg: draftState.quadOuterInclinationDeg,
    quadSecondarySemiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
    quadSecondaryEccentricity: draftState.tripleOuterEccentricity,
    quadSecondaryInclinationDeg: draftState.tripleOuterInclinationDeg,
  };
}

export function createStarSystemDraftHelpers({
  getDraftState = () => ({}),
  getStarDraftState,
  normalizeTopologyHostFrameId,
  buildHomeSystemContextFn = buildHomeSystemContext,
  buildTopologyGuardrailSummaryFn = buildTopologyGuardrailSummary,
  getProjectedPrimaryStarFn = getProjectedPrimaryStar,
  listStellarSystemHostFramesFn = listStellarSystemHostFrames,
  loadWorldFn = loadWorld,
  resolveHostFrameContextFn = resolveHostFrameContext,
} = {}) {
  function buildStarComponent(id = "star_a", draftState = getDraftState()) {
    const starDraft = getStarDraftState(id, draftState);
    return {
      id,
      name: starDraft.name,
      massMsol: starDraft.massMsol,
      physicsMode: starDraft.physicsMode,
      advancedDerivationMode: starDraft.advancedDerivationMode,
      radiusRsolOverride: starDraft.radiusRsolOverride,
      luminosityLsolOverride: starDraft.luminosityLsolOverride,
      tempKOverride: starDraft.tempKOverride,
      evolutionMode: starDraft.evolutionMode,
      activityModelVersion: starDraft.activityModelVersion,
    };
  }

  function buildPairComponent(id, childA, childB, pairState) {
    return {
      id,
      childA,
      childB,
      semiMajorAxisAu: pairState.semiMajorAxisAu,
      eccentricity: pairState.eccentricity,
      inclinationDeg: pairState.inclinationDeg,
      argPeriapsisDeg: pairState.argPeriapsisDeg,
      meanAnomalyDeg: pairState.meanAnomalyDeg,
    };
  }

  function buildStellarSystemFromDraft(draftState = getDraftState()) {
    const primaryStar = buildStarComponent("star_a", draftState);
    const shared = {
      ageGyr: draftState.ageGyr,
      metallicityFeH: draftState.metallicityFeH,
    };

    if (draftState.topologyKind === "single") {
      return {
        topologyKind: "single",
        shared,
        stars: {
          order: ["star_a"],
          byId: { star_a: primaryStar },
        },
        pairs: {
          order: [],
          byId: {},
        },
        rootNodeId: "star_a",
        defaultHostFrameId: "star_a",
      };
    }

    const starsOrder = ["star_a", "star_b"];
    const starsById = {
      star_a: primaryStar,
      star_b: buildStarComponent("star_b", draftState),
    };
    const pairsOrder = ["pair_ab"];
    const pairsById = {
      pair_ab: buildPairComponent(
        "pair_ab",
        { kind: "star", id: "star_a" },
        { kind: "star", id: "star_b" },
        {
          semiMajorAxisAu: draftState.binarySemiMajorAxisAu,
          eccentricity: draftState.binaryEccentricity,
          inclinationDeg: draftState.binaryInclinationDeg,
          argPeriapsisDeg: draftState.binaryArgPeriapsisDeg,
          meanAnomalyDeg: draftState.binaryMeanAnomalyDeg,
        },
      ),
    };
    let topologyKind = "binary";
    let rootNodeId = "pair_ab";

    if (draftState.topologyKind === "triple") {
      starsOrder.push("star_c");
      starsById.star_c = buildStarComponent("star_c", draftState);
      pairsOrder.push("pair_abc");
      pairsById.pair_abc = buildPairComponent(
        "pair_abc",
        { kind: "pair", id: "pair_ab" },
        { kind: "star", id: "star_c" },
        {
          semiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
          eccentricity: draftState.tripleOuterEccentricity,
          inclinationDeg: draftState.tripleOuterInclinationDeg,
          argPeriapsisDeg: draftState.tripleOuterArgPeriapsisDeg,
          meanAnomalyDeg: draftState.tripleOuterMeanAnomalyDeg,
        },
      );
      topologyKind = "triple";
      rootNodeId = "pair_abc";
    }

    if (draftState.topologyKind === "quad") {
      starsOrder.push("star_c");
      starsById.star_c = buildStarComponent("star_c", draftState);
      starsOrder.push("star_d");
      starsById.star_d = buildStarComponent("star_d", draftState);
      if (normalizeQuadLayoutKind(draftState.quadLayoutKind) === "paired") {
        pairsOrder.push("pair_cd");
        pairsById.pair_cd = buildPairComponent(
          "pair_cd",
          { kind: "star", id: "star_c" },
          { kind: "star", id: "star_d" },
          {
            semiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
            eccentricity: draftState.tripleOuterEccentricity,
            inclinationDeg: draftState.tripleOuterInclinationDeg,
            argPeriapsisDeg: draftState.tripleOuterArgPeriapsisDeg,
            meanAnomalyDeg: draftState.tripleOuterMeanAnomalyDeg,
          },
        );
        pairsOrder.push("pair_root");
        pairsById.pair_root = buildPairComponent(
          "pair_root",
          { kind: "pair", id: "pair_ab" },
          { kind: "pair", id: "pair_cd" },
          {
            semiMajorAxisAu: draftState.quadOuterSemiMajorAxisAu,
            eccentricity: draftState.quadOuterEccentricity,
            inclinationDeg: draftState.quadOuterInclinationDeg,
            argPeriapsisDeg: draftState.quadOuterArgPeriapsisDeg,
            meanAnomalyDeg: draftState.quadOuterMeanAnomalyDeg,
          },
        );
        rootNodeId = "pair_root";
      } else {
        pairsOrder.push("pair_abc");
        pairsById.pair_abc = buildPairComponent(
          "pair_abc",
          { kind: "pair", id: "pair_ab" },
          { kind: "star", id: "star_c" },
          {
            semiMajorAxisAu: draftState.tripleOuterSemiMajorAxisAu,
            eccentricity: draftState.tripleOuterEccentricity,
            inclinationDeg: draftState.tripleOuterInclinationDeg,
            argPeriapsisDeg: draftState.tripleOuterArgPeriapsisDeg,
            meanAnomalyDeg: draftState.tripleOuterMeanAnomalyDeg,
          },
        );
        pairsOrder.push("pair_abcd");
        pairsById.pair_abcd = buildPairComponent(
          "pair_abcd",
          { kind: "pair", id: "pair_abc" },
          { kind: "star", id: "star_d" },
          {
            semiMajorAxisAu: draftState.quadOuterSemiMajorAxisAu,
            eccentricity: draftState.quadOuterEccentricity,
            inclinationDeg: draftState.quadOuterInclinationDeg,
            argPeriapsisDeg: draftState.quadOuterArgPeriapsisDeg,
            meanAnomalyDeg: draftState.quadOuterMeanAnomalyDeg,
          },
        );
        rootNodeId = "pair_abcd";
      }
      topologyKind = "quad";
    }

    return {
      topologyKind,
      shared,
      stars: {
        order: starsOrder,
        byId: starsById,
      },
      pairs: {
        order: pairsOrder,
        byId: pairsById,
      },
      rootNodeId,
      defaultHostFrameId: normalizeTopologyHostFrameId(
        draftState.defaultHostFrameId,
        topologyKind,
        draftState.quadLayoutKind,
      ),
    };
  }

  function buildPreviewWorldFromDraft(draftState = getDraftState()) {
    const baseWorld = loadWorldFn();
    const basePrimaryStar = getProjectedPrimaryStarFn(baseWorld);
    const primaryStarDraft = getStarDraftState("star_a", draftState);
    const stellarSystem = buildStellarSystemFromDraft(draftState);
    return {
      ...baseWorld,
      star: {
        ...(basePrimaryStar || {}),
        name: primaryStarDraft.name,
        massMsol: primaryStarDraft.massMsol,
        ageGyr: draftState.ageGyr,
        metallicityFeH: draftState.metallicityFeH,
        physicsMode: primaryStarDraft.physicsMode,
        advancedDerivationMode: primaryStarDraft.advancedDerivationMode,
        radiusRsolOverride: primaryStarDraft.radiusRsolOverride,
        luminosityLsolOverride: primaryStarDraft.luminosityLsolOverride,
        tempKOverride: primaryStarDraft.tempKOverride,
        evolutionMode: draftState.evolutionMode,
        activityModelVersion: draftState.activityModelVersion,
      },
      stellarSystem,
    };
  }

  function buildTopologyHealthAssessment(draftState = getDraftState()) {
    const guardrails = buildTopologyGuardrailSummaryFn(buildTopologyGuardrailInput(draftState));
    const stellarSystem = buildStellarSystemFromDraft(draftState);

    let hostFrameLabel = "Star A";
    let fluxSummary =
      draftState.topologyKind === "single"
        ? "Single-star layout: no companion-driven flux variability."
        : "Flux context unavailable until the hierarchy preview resolves.";

    try {
      const previewWorld = buildPreviewWorldFromDraft(draftState);
      const homeSystemContext = buildHomeSystemContextFn(previewWorld);
      const solveContext = resolveHostFrameContextFn(
        homeSystemContext,
        normalizeTopologyHostFrameId(
          draftState.defaultHostFrameId,
          draftState.topologyKind,
          draftState.quadLayoutKind,
        ),
      );
      hostFrameLabel =
        solveContext?.hostFrame?.label ||
        listStellarSystemHostFramesFn(stellarSystem)[0]?.label ||
        "Star A";
      const fluxVariabilityFraction = Number(solveContext?.fluxVariabilityFraction || 0);
      const companionFluxEarth = Number(solveContext?.companionFluxEarth || 0);
      if (draftState.topologyKind === "single") {
        fluxSummary = "Single-star layout: no companion-driven flux variability.";
      } else if (guardrails.blocked) {
        fluxSummary = "Hierarchy preview paused until the inverted outer layer is widened.";
      } else if (fluxVariabilityFraction >= 0.1) {
        fluxSummary = `Strong flux variability (~${(fluxVariabilityFraction * 100).toFixed(1)}%) in the ${hostFrameLabel} frame.`;
      } else if (fluxVariabilityFraction >= 0.02) {
        fluxSummary = `Moderate flux variability (~${(fluxVariabilityFraction * 100).toFixed(1)}%) in the ${hostFrameLabel} frame.`;
      } else if (companionFluxEarth > 0.0005) {
        fluxSummary = `Outer-star heating stays mild in the ${hostFrameLabel} frame (~${companionFluxEarth.toFixed(3)}x Earth flux).`;
      } else {
        fluxSummary = `Outer-star heating is negligible in the ${hostFrameLabel} frame.`;
      }
    } catch {
      if (guardrails.blocked) {
        fluxSummary = "Hierarchy preview paused until the inverted outer layer is widened.";
      }
    }

    return {
      ...guardrails,
      hostFrameLabel,
      fluxSummary,
    };
  }

  return {
    buildPairComponent,
    buildPreviewWorldFromDraft,
    buildStarComponent,
    buildStellarSystemFromDraft,
    buildTopologyHealthAssessment,
  };
}
