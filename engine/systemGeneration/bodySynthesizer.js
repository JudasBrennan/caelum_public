import {
  buildGasGiantRecipeApplyInputs,
  getGasGiantArchetype,
  getRecipeForGasGiantArchetype,
} from "../../ui/guidedCreation/adapters/gasGiant.js";
import {
  buildMoonRecipeApplyInputs,
  getMoonArchetype,
  getRecipeForArchetype as getMoonRecipeForArchetype,
} from "../../ui/guidedCreation/adapters/moon.js";
import {
  buildRockyRecipeApplyInputs,
  getRecipeForArchetype as getRockyRecipeForArchetype,
  getRockyArchetype,
} from "../../ui/guidedCreation/adapters/rockyPlanet.js";

function normalizedRatio(slotAu, inner, outer) {
  const lo = Number(inner);
  const hi = Number(outer);
  const distance = Number(slotAu);
  if (!(Number.isFinite(lo) && Number.isFinite(hi) && hi > lo && Number.isFinite(distance))) {
    return 0.5;
  }
  return Math.max(0, Math.min(1, (distance - lo) / (hi - lo)));
}

export function selectRockyArchetypeId({ request, slot, isHomeworld = false, rng }) {
  if (isHomeworld) {
    const pool =
      request?.systemProfile === "rocky-rich"
        ? ["earthlike-rocky-planet", "ocean-world-planet", "tropical-jungle-planet"]
        : ["earthlike-rocky-planet", "ocean-world-planet", "arid-steppe-planet"];
    return rng.pick(pool, "earthlike-rocky-planet");
  }
  const hzInner = Number(slot?.habitableZoneAu?.inner);
  const hzOuter = Number(slot?.habitableZoneAu?.outer);
  const ratio = normalizedRatio(slot?.au, hzInner, hzOuter);
  if (slot?.withinHabitableZone) {
    return rng.pick(
      ["arid-steppe-planet", "ocean-world-planet", "tropical-jungle-planet"],
      "arid-steppe-planet",
    );
  }
  if (Number.isFinite(hzInner) && Number(slot?.au) < hzInner * 0.8) {
    return rng.pick(["lava-planet", "venuslike-greenhouse-planet"], "lava-planet");
  }
  if (Number.isFinite(hzOuter) && Number(slot?.au) > hzOuter * 1.25) {
    return rng.pick(["snowball-planet", "marslike-desert-planet"], "snowball-planet");
  }
  if (slot?.beyondFrostLine) {
    return rng.pick(["snowball-planet", "airless-rocky-planet"], "snowball-planet");
  }
  if (ratio < 0.35) return "arid-steppe-planet";
  if (ratio > 0.7) return "marslike-desert-planet";
  return "airless-rocky-planet";
}

export function selectGasGiantArchetypeId({ slot, rng }) {
  const au = Number(slot?.au || 0);
  const frostLineAu = Number(slot?.frostLineAu || 0);
  if (au > 0 && frostLineAu > 0) {
    if (au < frostLineAu * 1.15) {
      return rng.pick(["warm-water-cloud-giant", "cloudless-warm-giant"], "warm-water-cloud-giant");
    }
    if (au > frostLineAu * 4.5) {
      return rng.pick(["neptune-like-ice-giant", "sub-neptune-giant"], "neptune-like-ice-giant");
    }
  }
  return rng.pick(["jupiter-cold-giant", "saturnian-ringed-giant"], "jupiter-cold-giant");
}

export function selectMoonArchetypeId({ request, parentKind = "gasGiant", index = 0, rng }) {
  if (request?.systemProfile === "moon-rich" && parentKind === "gasGiant" && index === 0) {
    return rng.pick(["subsurface-ocean-moon", "temperate-ocean-moon"], "subsurface-ocean-moon");
  }
  if (parentKind === "planet") {
    return rng.pick(["airless-rocky-moon", "irregular-capture-moon"], "airless-rocky-moon");
  }
  return rng.pick(
    [
      "airless-rocky-moon",
      "subsurface-ocean-moon",
      "volcanic-moon",
      "hazy-atmosphere-moon",
      "irregular-capture-moon",
    ],
    "airless-rocky-moon",
  );
}

export function synthesizeRockyPlanet({ id, name, slot, request, rng, isHomeworld = false } = {}) {
  const archetypeId = selectRockyArchetypeId({ request, slot, isHomeworld, rng });
  const archetype = getRockyArchetype(archetypeId);
  const recipe = getRockyRecipeForArchetype(archetypeId);
  const inputs = buildRockyRecipeApplyInputs(recipe?.apply || {}, recipe?.id, {
    semiMajorAxisAu: slot?.au,
  });
  inputs.semiMajorAxisAu = Number(slot?.au || inputs.semiMajorAxisAu || 1);
  inputs.eccentricity = isHomeworld ? rng.range(0.002, 0.04) : rng.range(0.001, 0.12);
  inputs.inclinationDeg = rng.range(0, 4);
  inputs.appearanceRecipeId = recipe?.id || inputs.appearanceRecipeId;
  return {
    id,
    name,
    slotIndex: Number(slot?.slotIndex || null),
    hostFrameId: String(slot?.hostFrameId || "").trim() || null,
    locked: false,
    archetypeId,
    archetypeLabel: archetype?.label || archetypeId,
    inputs,
  };
}

export function synthesizeGasGiant({ id, name, slot, rng } = {}) {
  const archetypeId = selectGasGiantArchetypeId({ slot, rng });
  const archetype = getGasGiantArchetype(archetypeId);
  const recipe = getRecipeForGasGiantArchetype(archetypeId);
  const giant = buildGasGiantRecipeApplyInputs(recipe?.apply || {}, recipe?.id, {
    au: slot?.au,
    slotIndex: slot?.slotIndex,
  });
  giant.au = Number(slot?.au || giant.au || 5.2);
  giant.slotIndex = Number(slot?.slotIndex || giant.slotIndex || null);
  giant.hostFrameId = String(slot?.hostFrameId || "").trim() || null;
  return {
    id,
    name,
    hostFrameId: giant.hostFrameId,
    au: giant.au,
    slotIndex: giant.slotIndex,
    style: giant.style,
    ringMode: giant.ringMode,
    ringStyleId: giant.ringStyleId,
    rings: giant.rings,
    radiusRj: giant.radiusRj,
    massMjup: giant.massMjup,
    rotationPeriodHours: giant.rotationPeriodHours,
    metallicity: giant.metallicity,
    eccentricity: giant.eccentricity,
    inclinationDeg: giant.inclinationDeg,
    axialTiltDeg: giant.axialTiltDeg,
    appearanceRecipeId: giant.appearanceRecipeId,
    archetypeId,
    archetypeLabel: archetype?.label || archetypeId,
  };
}

export function synthesizeMoon({
  id,
  name,
  request,
  parentId,
  parentKind = "gasGiant",
  index = 0,
  rng,
} = {}) {
  const archetypeId = selectMoonArchetypeId({ request, parentKind, index, rng });
  const archetype = getMoonArchetype(archetypeId);
  const recipe = getMoonRecipeForArchetype(archetypeId);
  const baseOrbitKm = parentKind === "gasGiant" ? 180000 + index * 120000 : 60000 + index * 45000;
  const inputs = buildMoonRecipeApplyInputs(recipe?.apply || {}, recipe?.id);
  inputs.semiMajorAxisKm = Math.max(12000, Math.round(baseOrbitKm * rng.range(0.8, 1.25)));
  inputs.eccentricity = rng.range(0.001, parentKind === "gasGiant" ? 0.08 : 0.04);
  inputs.inclinationDeg = rng.range(0, parentKind === "gasGiant" ? 6 : 3);
  return {
    id,
    name,
    planetId: parentId,
    locked: false,
    archetypeId,
    archetypeLabel: archetype?.label || archetypeId,
    inputs,
  };
}
