// SPDX-License-Identifier: MPL-2.0
import { latLonToXYZ } from "../plates.js";
import { clamp } from "../utils.js";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371;

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(v, s) {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function magnitude(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalize(v) {
  const m = magnitude(v);
  if (m < 1e-9) return { x: 0, y: 0, z: 1 };
  return scale(v, 1 / m);
}

function tangentVelocityVector(poleVec, pointVec, angularVelDegMyr) {
  return scale(cross(poleVec, pointVec), angularVelDegMyr * DEG * EARTH_RADIUS_KM);
}

function buildLocalBasis(latDeg, lonDeg) {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  return {
    east: { x: -Math.sin(lon), y: Math.cos(lon), z: 0 },
    north: {
      x: -Math.sin(lat) * Math.cos(lon),
      y: -Math.sin(lat) * Math.sin(lon),
      z: Math.cos(lat),
    },
  };
}

function bearingFromComponents(east, north) {
  return (Math.atan2(east, north) * RAD + 360) % 360;
}

function hashNoise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function lowFreqNoise(latDeg, lonDeg, salt) {
  const lat = latDeg / 180 + 0.5;
  const lon = lonDeg / 360 + 0.5;
  return hashNoise(lat * 137.2 + lon * 311.7 + salt);
}

export function computeLocalMotion(plate, latDeg, lonDeg) {
  const pointVec = latLonToXYZ(latDeg, lonDeg);
  const poleVec = latLonToXYZ(plate.eulerPoleLat, plate.eulerPoleLon);
  const tangential = tangentVelocityVector(poleVec, pointVec, plate.angularVelDegMyr);
  const basis = buildLocalBasis(latDeg, lonDeg);
  const eastMmYr = dot(tangential, basis.east);
  const northMmYr = dot(tangential, basis.north);
  const speedMmYr = Math.hypot(eastMmYr, northMmYr);
  return {
    eastMmYr,
    northMmYr,
    speedMmYr,
    bearingDeg: speedMmYr > 1e-6 ? bearingFromComponents(eastMmYr, northMmYr) : 0,
    tangentVec: tangential,
  };
}

export function computeBoundaryKinematics(boundaryPoint, seedA, seedB, plateA, plateB) {
  const boundaryVec = latLonToXYZ(boundaryPoint.latDeg, boundaryPoint.lonDeg);
  const seedAVec = latLonToXYZ(seedA.latDeg, seedA.lonDeg);
  const seedBVec = latLonToXYZ(seedB.latDeg, seedB.lonDeg);
  const poleA = latLonToXYZ(plateA.eulerPoleLat, plateA.eulerPoleLon);
  const poleB = latLonToXYZ(plateB.eulerPoleLat, plateB.eulerPoleLon);
  const velA = tangentVelocityVector(poleA, boundaryVec, plateA.angularVelDegMyr);
  const velB = tangentVelocityVector(poleB, boundaryVec, plateB.angularVelDegMyr);
  const relVel = sub(velA, velB);
  const radial = normalize(boundaryVec);
  const seedDir = sub(seedBVec, seedAVec);
  const boundaryNormal = normalize(sub(seedDir, scale(radial, dot(seedDir, radial))));
  const relTan = sub(relVel, scale(radial, dot(relVel, radial)));
  const normalComp = dot(relTan, boundaryNormal);
  const relSpeedMmYr = magnitude(relTan);
  const tangentialComp = Math.sqrt(Math.max(0, relSpeedMmYr ** 2 - normalComp ** 2));

  let type = "transform";
  if (relSpeedMmYr > 1e-6) {
    if (Math.abs(normalComp) < tangentialComp * 0.5) type = "transform";
    else type = normalComp > 0 ? "convergent" : "divergent";
  }

  return {
    type,
    relSpeedMmYr,
    convergenceMmYr: type === "convergent" ? Math.abs(normalComp) : 0,
    divergenceMmYr: type === "divergent" ? Math.abs(normalComp) : 0,
    strikeSlipMmYr: tangentialComp,
    normalCompMmYr: normalComp,
  };
}

export function resolveBoundaryAsymmetry(cellA, cellB, kinematics) {
  if (kinematics.type !== "convergent") {
    return {
      mode: kinematics.type === "divergent" ? "ridge" : "transform",
      subductingPlateId: null,
      overridingPlateId: null,
      trenchPlateId: null,
      arcPlateId: null,
      orogenType: null,
    };
  }

  const bothContinental = cellA.type === "continental" && cellB.type === "continental";
  const bothOceanic = cellA.type === "oceanic" && cellB.type === "oceanic";

  if (bothContinental) {
    return {
      mode: "collision",
      subductingPlateId: null,
      overridingPlateId: null,
      trenchPlateId: null,
      arcPlateId: null,
      orogenType: "himalayan",
    };
  }

  if (bothOceanic) {
    const ageA = cellA.crustAgeMyr ?? 0;
    const ageB = cellB.crustAgeMyr ?? 0;
    const subductingPlateId =
      ageA === ageB
        ? [cellA.plateId, cellB.plateId].sort()[1]
        : ageA > ageB
          ? cellA.plateId
          : cellB.plateId;
    const overridingPlateId = subductingPlateId === cellA.plateId ? cellB.plateId : cellA.plateId;
    return {
      mode: "subduction",
      subductingPlateId,
      overridingPlateId,
      trenchPlateId: subductingPlateId,
      arcPlateId: overridingPlateId,
      orogenType: "island-arc",
    };
  }

  const subductingPlateId = cellA.type === "oceanic" ? cellA.plateId : cellB.plateId;
  const overridingPlateId = subductingPlateId === cellA.plateId ? cellB.plateId : cellA.plateId;
  return {
    mode: "subduction",
    subductingPlateId,
    overridingPlateId,
    trenchPlateId: subductingPlateId,
    arcPlateId: overridingPlateId,
    orogenType: "andean",
  };
}

export function computeDistanceField(cells, predicate) {
  const indexById = new Map(cells.map((cell, index) => [cell.id, index]));
  const distances = Array.from({ length: cells.length }, () => Number.POSITIVE_INFINITY);
  const queue = [];

  cells.forEach((cell, index) => {
    if (!predicate(cell, index)) return;
    distances[index] = 0;
    queue.push(index);
  });

  for (let head = 0; head < queue.length; head += 1) {
    const index = queue[head];
    const distance = distances[index];
    for (const neighborId of cells[index].neighborIds) {
      const neighborIndex = indexById.get(neighborId);
      if (neighborIndex == null) continue;
      if (distances[neighborIndex] <= distance + 1) continue;
      distances[neighborIndex] = distance + 1;
      queue.push(neighborIndex);
    }
  }

  return distances.map((distance) => (Number.isFinite(distance) ? distance : 999));
}

export function enrichGeologyFields(cells, boundaries) {
  const trenchPlateIds = new Set();
  const arcPlateIds = new Set();
  const collisionPlateIds = new Set();
  const ridgePlateIds = new Set();

  for (const boundary of boundaries) {
    if (boundary.mode === "subduction") {
      if (boundary.trenchPlateId) trenchPlateIds.add(boundary.trenchPlateId);
      if (boundary.arcPlateId) arcPlateIds.add(boundary.arcPlateId);
    } else if (boundary.mode === "collision") {
      collisionPlateIds.add(boundary.plateAId);
      collisionPlateIds.add(boundary.plateBId);
    } else if (boundary.mode === "ridge") {
      ridgePlateIds.add(boundary.plateAId);
      ridgePlateIds.add(boundary.plateBId);
    }
  }

  const coastDistances = computeDistanceField(cells, (cell) =>
    cell.neighborTypes?.some((type) => type !== cell.type),
  );
  const ridgeDistances = computeDistanceField(
    cells,
    (cell) => ridgePlateIds.has(cell.plateId) && cell.boundaryCounts.divergent > 0,
  );
  const trenchDistances = computeDistanceField(
    cells,
    (cell) => trenchPlateIds.has(cell.plateId) && cell.boundaryRole === "trench",
  );
  const arcDistances = computeDistanceField(
    cells,
    (cell) => arcPlateIds.has(cell.plateId) && cell.boundaryRole === "arc",
  );
  const collisionDistances = computeDistanceField(
    cells,
    (cell) => collisionPlateIds.has(cell.plateId) && cell.boundaryRole === "collision",
  );

  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index];
    const coastDistance = coastDistances[index];
    const ridgeDistance = ridgeDistances[index];
    const trenchDistance = trenchDistances[index];
    const arcDistance = arcDistances[index];
    const collisionDistance = collisionDistances[index];
    const hotspotInfluence = clamp(
      Math.max(0, lowFreqNoise(cell.centerLatDeg * 1.8, cell.centerLonDeg * 1.4, 17) - 0.77) * 4.5,
      0,
      1,
    );
    const superswellInfluence = clamp(
      Math.max(0, lowFreqNoise(cell.centerLatDeg * 0.45, cell.centerLonDeg * 0.55, 91) - 0.62) *
        2.8,
      0,
      1,
    );
    const collisionStrength = clamp(1 - collisionDistance / 6, 0, 1);
    const arcStrength = clamp(1 - arcDistance / 5, 0, 1);
    const trenchStrength = clamp(1 - trenchDistance / 4, 0, 1);
    const ridgeStrength = clamp(1 - ridgeDistance / 5, 0, 1);
    const coastalStrength = clamp(1 - coastDistance / 4, 0, 1);
    const erosionFactor =
      cell.type === "continental"
        ? clamp(
            0.12 + (Math.max(0, cell.elevationM) / 9000) * 0.28 + coastalStrength * 0.12,
            0,
            0.45,
          )
        : 0;

    let terrainElevationM = cell.elevationM;
    if (cell.type === "continental") {
      terrainElevationM +=
        collisionStrength * 900 +
        arcStrength * 520 +
        hotspotInfluence * 240 +
        superswellInfluence * 180;
      terrainElevationM -= erosionFactor * Math.max(0, terrainElevationM) * 0.35;
      terrainElevationM = Math.max(-80, terrainElevationM);
      if (coastalStrength > 0.6)
        terrainElevationM = Math.min(terrainElevationM, 350 + coastalStrength * 120);
    } else {
      terrainElevationM += ridgeStrength * 850 + superswellInfluence * 380 + hotspotInfluence * 260;
      terrainElevationM -= trenchStrength * 1350;
      if (coastalStrength > 0.5) {
        const shelfDepth = -160 - coastDistance * 140;
        terrainElevationM = Math.max(terrainElevationM, shelfDepth);
      }
    }

    cell.ridgeDistance = ridgeDistance;
    cell.trenchDistance = trenchDistance;
    cell.arcDistance = arcDistance;
    cell.collisionDistance = collisionDistance;
    cell.coastDistance = coastDistance;
    cell.shelfDistance = cell.type === "oceanic" ? coastDistance : 0;
    cell.slopeDistance = cell.type === "oceanic" ? Math.max(0, coastDistance - 1) : 0;
    cell.hotspotInfluence = hotspotInfluence;
    cell.superswellInfluence = superswellInfluence;
    cell.collisionStrength = collisionStrength;
    cell.arcStrength = arcStrength;
    cell.trenchStrength = trenchStrength;
    cell.ridgeStrength = ridgeStrength;
    cell.coastalStrength = coastalStrength;
    cell.erosionFactor = erosionFactor;
    cell.terrainElevationM = clamp(terrainElevationM, -11000, 12000);
    cell.bathymetryM = Math.min(0, cell.terrainElevationM);
    cell.landElevationM = Math.max(0, cell.terrainElevationM);
  }
}
