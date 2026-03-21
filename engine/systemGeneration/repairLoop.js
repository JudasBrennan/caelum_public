import {
  buildRandomSystemDraftEnvelope,
  buildSystemBodyTargets,
  normalizeRandomSystemRequest,
  RANDOM_SYSTEM_GENERATOR_VERSION,
} from "./contracts.js";
import {
  buildGenerationModeLabel,
  buildPreserveWorldSections,
  buildPreservedHomeworldCandidate,
} from "./ambitiousDrafts.js";
import { buildTopologyDraftFromWorld, reserveStarNames } from "./currentWorldHelpers.js";
import { buildDraftWorld } from "./draftBuilder.js";
import { createNamePicker } from "./namePicker.js";
import { tuneOrbitLadder } from "./orbitLadderTuner.js";
import { createSeededRng } from "./seededRng.js";
import { allocateSystemBodies } from "./slotAllocator.js";
import { buildTopologyDraft } from "./topologyPicker.js";
import { validateGeneratedDraftWorld } from "./validators.js";

function fitRank(fitClass) {
  switch (fitClass) {
    case "exact-match":
      return 3;
    case "near-miss":
      return 2;
    case "blocked":
    default:
      return 1;
  }
}

function mergeDiagnostics(...groups) {
  return groups.flat().filter(Boolean);
}

export function runRandomSystemRepairLoop(rawRequest = {}, options = {}) {
  const request = normalizeRandomSystemRequest(rawRequest);
  const currentWorld = options?.currentWorld;
  const preserveStarNames = request?.rerollMode === "keep-stars-reroll-planets";
  const fixedTopologyDraft = preserveStarNames ? buildTopologyDraftFromWorld(currentWorld) : null;
  const baseRng = createSeededRng(`${request.seed}:system-generator`);
  const bodyTargets = buildSystemBodyTargets(request, baseRng.fork("body-targets"));
  bodyTargets.preferredHomeworldFrameKind =
    bodyTargets.preferredHomeworldFrameKind || request?.preferredHomeworldFrameKind || null;
  bodyTargets.preservedHomeworldCandidate = buildPreservedHomeworldCandidate(currentWorld, request);

  let best = null;
  const topologyAttempts = fixedTopologyDraft ? 1 : 2;
  const ladderAttempts = 4;

  for (let topologyAttempt = 0; topologyAttempt < topologyAttempts; topologyAttempt += 1) {
    const topologyDraft =
      fixedTopologyDraft ||
      buildTopologyDraft(request, baseRng.fork(`topology:${topologyAttempt}`));

    for (let ladderAttempt = 0; ladderAttempt < ladderAttempts; ladderAttempt += 1) {
      const tunedLadder = tuneOrbitLadder({
        topologyDraft,
        request,
        bodyTargets,
        attemptIndex: ladderAttempt,
      });
      if (!tunedLadder?.ok) {
        const failed = buildRandomSystemDraftEnvelope({
          request,
          generationMeta: {
            generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
            seed: request.seed,
            topologyKind: topologyDraft?.stellarSystem?.topologyKind || "single",
            quadLayoutKind: topologyDraft?.quadLayoutKind || null,
            attempts: { topologyAttempt, ladderAttempt },
          },
          diagnostics: tunedLadder?.diagnostics || [],
          fitClass: "blocked",
        });
        if (!best || fitRank(failed.fitClass) > fitRank(best.fitClass)) best = failed;
        continue;
      }

      const namePicker = createNamePicker({
        seed: request.seed,
        namingStyle: request.namingStyle,
      });
      if (preserveStarNames) reserveStarNames(namePicker, topologyDraft?.stellarSystem);
      const allocation = allocateSystemBodies({
        request,
        bodyTargets,
        tunedLadder,
        namePicker,
        rng: baseRng.fork(`allocation:${topologyAttempt}:${ladderAttempt}`),
      });
      const preservedHomeworld = !!allocation?.preservedHomeworld;

      const built = buildDraftWorld({
        topologyDraft,
        allocation,
        worldSystemInputs: tunedLadder.worldSystemInputs,
        request,
        generationMeta: {
          generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
          seed: request.seed,
          topologyKind: topologyDraft?.stellarSystem?.topologyKind || "single",
          quadLayoutKind: topologyDraft?.quadLayoutKind || null,
          rerollMode: request.rerollMode,
          generationModeLabel: buildGenerationModeLabel(request.rerollMode),
          goalTemplateId: request.goalTemplateId,
          goalTemplateLabel: request.goalTemplateLabel,
          preserveWorldSections: buildPreserveWorldSections(request, {
            preservedHomeworld,
          }),
          preservedHomeworldId: allocation?.preservedHomeworld?.id || null,
        },
        namePicker,
        preserveStarNames,
        selectedPlanetId: allocation?.preservedHomeworld?.id || allocation?.homeworld?.id || null,
      });

      const validation = validateGeneratedDraftWorld(built.draftWorld, request);
      const fitClass = !validation.ok
        ? "blocked"
        : allocation.fitClass === "near-miss" || validation.fitClass === "near-miss"
          ? "near-miss"
          : "exact-match";
      const diagnostics = mergeDiagnostics(
        tunedLadder.diagnostics,
        allocation.diagnostics,
        validation.diagnostics,
      );

      const candidate = buildRandomSystemDraftEnvelope({
        request,
        generationMeta: {
          generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
          seed: request.seed,
          topologyKind: topologyDraft?.stellarSystem?.topologyKind || "single",
          quadLayoutKind: topologyDraft?.quadLayoutKind || null,
          rerollMode: request.rerollMode,
          generationModeLabel: buildGenerationModeLabel(request.rerollMode),
          goalTemplateId: request.goalTemplateId,
          goalTemplateLabel: request.goalTemplateLabel,
          attempts: {
            topologyAttempt: topologyAttempt + 1,
            ladderAttempt: ladderAttempt + 1,
          },
          nameCatalogVersion: namePicker.catalogVersion,
          preserveWorldSections: buildPreserveWorldSections(request, {
            preservedHomeworld,
          }),
          preservedHomeworldId: allocation?.preservedHomeworld?.id || null,
        },
        draftWorld: built.draftWorld,
        preview: built.preview,
        diagnostics,
        fitClass,
      });

      if (!best) {
        best = candidate;
      } else if (fitRank(candidate.fitClass) > fitRank(best.fitClass)) {
        best = candidate;
      } else if (
        fitRank(candidate.fitClass) === fitRank(best.fitClass) &&
        candidate.preview?.counts?.rockyPlanets + candidate.preview?.counts?.gasGiants >
          (best.preview?.counts?.rockyPlanets || 0) + (best.preview?.counts?.gasGiants || 0)
      ) {
        best = candidate;
      }

      if (candidate.fitClass === "exact-match") {
        return candidate;
      }
    }
  }

  return (
    best ||
    buildRandomSystemDraftEnvelope({
      request,
      generationMeta: {
        generatorVersion: RANDOM_SYSTEM_GENERATOR_VERSION,
        seed: request.seed,
        topologyKind: "single",
        quadLayoutKind: null,
        rerollMode: request.rerollMode,
        generationModeLabel: buildGenerationModeLabel(request.rerollMode),
        goalTemplateId: request.goalTemplateId,
        goalTemplateLabel: request.goalTemplateLabel,
      },
      diagnostics: [
        {
          severity: "blocked",
          code: "generator-failed",
          title: "Generator could not build a usable draft",
          detail: "The seeded repair loop did not find a workable home-system draft.",
        },
      ],
      fitClass: "blocked",
    })
  );
}
