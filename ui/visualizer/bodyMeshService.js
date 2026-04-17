import { clamp } from "../../engine/utils.js";
import { normalizeAxialTiltDeg } from "./projectionMath.js";
import {
  previewPbrMaterial,
  generateCelestialTextureCanvasesLocal,
  buildCelestialTextureSignature,
  getCachedTextures,
  cacheTextures,
  hasLayer,
  shouldFlattenStyleMaps,
  loadFromIDBToCache,
} from "../celestialVisualPreview.js";
import {
  isCelestialTextureJobCanceledError,
  requestQueuedCelestialTextureMaps,
} from "../celestialTextureJobQueue.js";
import {
  acquireRendererTextureBundle,
  disposeRendererTextureBundleCache,
  releaseRendererTextureBundle,
} from "../rendererTextureBundleCache.js";
import { composeCelestialDescriptor } from "../celestialComposer.js";
import {
  acquireRingTextureBundle,
  disposeRendererRingTextureBundleCache,
  getOrCreateRingTexturePayload,
  releaseRingTextureBundle,
} from "../ringTextureCache.js";
import {
  createRingLightingMaterial,
  updateRingLightingMaterial,
  updateRingLightingUniforms,
} from "../ringLightingShader.js";
import {
  applyRingShadowBodyPatch,
  clearRingShadowBodyPatch,
  updateRingShadowBodyUniforms,
} from "../ringShadowBodyPatch.js";
import { recordCelestialTextureFulfillment } from "../celestialPerfDebug.js";

export const BODY_MESH_MIN_PX = 4;

export function vizBodyCacheKey(type, body) {
  const id = body?.id || "";
  if (type === "rocky") return `rocky:${id}`;
  if (type === "gas") return `gas:${id}`;
  if (type === "moon") return `moon:${id}`;
  return id;
}

export function collectBodyMeshWarmItems(snapshot, options = {}) {
  const { hasKey = () => false, includeMoons = true } = options;
  const needed = [];

  for (const planet of snapshot.planetNodes || []) {
    if (!planet.visualProfile) continue;
    const key = vizBodyCacheKey("rocky", planet);
    const model = {
      bodyType: "rocky",
      visualProfile: planet.visualProfile,
      ringAppearance: planet.ringAppearance,
      axialTiltDeg: normalizeAxialTiltDeg(planet.axialTiltDeg),
    };
    if (hasKey(key, model)) continue;
    needed.push({ key, model });
  }

  for (const gasGiant of snapshot.gasGiants || []) {
    if (gasGiant?.renderModel === "brownDwarfStar") continue;
    const key = vizBodyCacheKey("gas", gasGiant);
    const model = {
      bodyType: "gasGiant",
      styleId: gasGiant.style || "jupiter",
      showRings: !!gasGiant.rings,
      ringMode: gasGiant.ringMode,
      ringStyleId: gasGiant.ringAppearance?.ringStyleId,
      ringAppearance: gasGiant.ringAppearance,
      gasCalc: gasGiant.gasCalc,
      axialTiltDeg: normalizeAxialTiltDeg(gasGiant.axialTiltDeg ?? 0),
    };
    if (hasKey(key, model)) continue;
    needed.push({ key, model });
  }

  if (includeMoons) {
    for (const parent of [...(snapshot.planetNodes || []), ...(snapshot.gasGiants || [])]) {
      for (const moon of parent.moons || []) {
        if (!moon.moonCalc) continue;
        const key = vizBodyCacheKey("moon", moon);
        const model = {
          bodyType: "moon",
          moonCalc: moon.moonCalc,
          axialTiltDeg: normalizeAxialTiltDeg(moon.axialTiltDeg),
        };
        if (hasKey(key, model)) continue;
        needed.push({ key, model });
      }
    }
  }

  return needed;
}

function normalizeExplicitWarmItems(items, hasKey = () => false) {
  const list = Array.isArray(items) ? items : [];
  const needed = [];
  const seen = new Set();
  for (const item of list) {
    const key = String(item?.key || "");
    const model = item?.model || null;
    if (!key || !model || seen.has(key)) continue;
    seen.add(key);
    if (hasKey(key, model)) continue;
    needed.push({ key, model });
  }
  return needed;
}

function createEntryReadyPromise() {
  let resolveReady = null;
  const promise = new Promise((resolve) => {
    resolveReady = resolve;
  });
  return { promise, resolveReady };
}

function settleEntryTexturesReady(entry, ready = true) {
  if (!entry || entry._texturesReadySettled) return;
  entry._texturesReadySettled = true;
  entry._resolveTexturesReady?.(ready === true);
  entry._resolveTexturesReady = null;
}

function waitForWarmBatchYield(options = {}) {
  const delayMsRaw = Number(options.yieldDelayMs);
  const delayMs = Number.isFinite(delayMsRaw) && delayMsRaw > 0 ? delayMsRaw : 0;
  return new Promise((resolve) => {
    const finish = () => {
      if (delayMs > 0 && typeof setTimeout === "function") {
        setTimeout(resolve, delayMs);
      } else {
        resolve();
      }
    };
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => finish());
      return;
    }
    if (typeof setTimeout === "function") {
      setTimeout(resolve, delayMs);
      return;
    }
    resolve();
  });
}

function buildWarmItemsSignature(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => String(item?.key || ""))
    .filter(Boolean)
    .join("|");
}

export function buildBodyStructuralSignature(model) {
  return JSON.stringify({
    bodyType: model?.bodyType || "",
    styleId: model?.styleId || "",
    showRings: model?.showRings === true,
    ringMode: model?.ringMode || "",
    ringStyleId: model?.ringStyleId || "",
    ringAppearance: model?.ringAppearance || null,
    gasCalc: model?.gasCalc || null,
    visualProfile: model?.visualProfile || null,
    moonCalc: model?.moonCalc || null,
  });
}

function remapRingGeometryUv(geometry, inner, outer) {
  const uv = geometry?.attributes?.uv;
  const position = geometry?.attributes?.position;
  if (!uv || !position) return geometry;
  const span = Math.max(0.0001, outer - inner);
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const radius = Math.sqrt(x * x + y * y);
    const angle = (Math.atan2(y, x) + Math.PI) / (Math.PI * 2);
    const radial = clamp((radius - inner) / span, 0, 1);
    uv.setXY(i, radial, angle);
  }
  uv.needsUpdate = true;
  return geometry;
}

function createRingGeometry(THREE, inner, outer, segments = 192) {
  const geometry = new THREE.RingGeometry(inner, outer, segments);
  return remapRingGeometryUv(geometry, inner, outer);
}

function createRingTextureBundle(nativeThree, ringDescriptor) {
  if (!nativeThree?.renderer || !nativeThree?.THREE || !ringDescriptor) return null;
  const ringTextures = getOrCreateRingTexturePayload(ringDescriptor, {
    width: 1024,
    height: 32,
  });
  if (!ringTextures?.signature || !ringTextures.payload) return null;
  return acquireRingTextureBundle({
    renderer: nativeThree.renderer,
    THREE: nativeThree.THREE,
    ringTextureSignature: ringTextures.signature,
    payload: ringTextures.payload,
  });
}

function refreshRingLightingForEntry(entry, nativeThree, lightDirectionWorld = null) {
  if (!entry?.ring || !entry?.ringMat || !entry?.body) return;
  const THREE = nativeThree?.THREE;
  if (typeof THREE?.Vector3 !== "function") return;
  entry.group?.updateMatrixWorld?.(true);
  const planetCenterWorld = new THREE.Vector3();
  const planetScaleWorld = new THREE.Vector3(1, 1, 1);
  entry.body.getWorldPosition?.(planetCenterWorld);
  entry.body.getWorldScale?.(planetScaleWorld);
  updateRingLightingUniforms({
    material: entry.ringMat,
    lightDirectionWorld: lightDirectionWorld || nativeThree?.keyLight || null,
    planetCenterWorld,
    planetRadius: Math.max(0.0001, planetScaleWorld.x, planetScaleWorld.y, planetScaleWorld.z),
  });
}

function refreshBodyRingShadowForEntry(entry, nativeThree, lightDirectionWorld = null) {
  if (!entry?.bodyMat || !entry?.body) return;
  const THREE = nativeThree?.THREE;
  if (typeof THREE?.Vector3 !== "function") {
    clearRingShadowBodyPatch(entry.bodyMat);
    return;
  }
  entry.group?.updateMatrixWorld?.(true);
  const showRing = !!(entry.descriptor?.ring?.enabled && entry.ring && entry._ringTextures?.[1]);
  if (!showRing || entry.descriptor?.bodyType === "moon") {
    clearRingShadowBodyPatch(entry.bodyMat);
    return;
  }
  const planetCenterWorld = new THREE.Vector3();
  const planetScaleWorld = new THREE.Vector3(1, 1, 1);
  entry.body.getWorldPosition?.(planetCenterWorld);
  entry.body.getWorldScale?.(planetScaleWorld);
  updateRingShadowBodyUniforms({
    material: entry.bodyMat,
    lightDirectionWorld: lightDirectionWorld || nativeThree?.keyLight || null,
    ringDescriptor: entry.descriptor?.ring,
    ringAlphaTexture: entry._ringTextures?.[1] || null,
    planetCenterWorld,
    planetRadiusWorld: Math.max(0.0001, planetScaleWorld.x, planetScaleWorld.y, planetScaleWorld.z),
    ringMesh: entry.ring,
  });
}

function createOrthoAtmosphereMaterial(THREE) {
  if (typeof THREE.ShaderMaterial !== "function") {
    return new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.12,
      color: 0x9cc2ff,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x9cc2ff) },
      uOpacity: { value: 0.12 },
      uPower: { value: 2.15 },
      uFalloff: { value: 0.66 },
    },
    vertexShader: `
      varying vec3 vNormalWorld;
      varying vec3 vViewDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        vViewDir = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPower;
      uniform float uFalloff;
      varying vec3 vNormalWorld;
      varying vec3 vViewDir;
      void main() {
        float ndv = clamp(dot(normalize(vNormalWorld), normalize(vViewDir)), 0.0, 1.0);
        float rim = pow(max(0.0, 1.0 - ndv), uPower);
        float alpha = clamp(rim * uOpacity, 0.0, 1.0);
        if (alpha < 0.001) discard;
        vec3 color = uColor * mix(uFalloff, 1.0, rim);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

export function createBodyMeshService(options = {}) {
  const {
    getCameraState = () => ({ pitch: 0, yaw: 0 }),
    getNativeThree,
    hashUnit,
    isDisposed = () => false,
  } = options;

  if (typeof getNativeThree !== "function") {
    throw new Error("createBodyMeshService requires getNativeThree");
  }
  if (typeof hashUnit !== "function") {
    throw new Error("createBodyMeshService requires hashUnit");
  }

  let sharedGeo = null;
  let bodyMeshWarmGen = 0;
  let activeWarmPromise = null;
  let activeWarmSignature = "";
  const bodyMeshCache = new Map();
  const posHelpers = {
    axisQuat: null,
    axisVec: null,
    pitchQ: null,
    yawQ: null,
    yUp: null,
  };

  function getRuntime() {
    return getNativeThree() || null;
  }

  function ensureSharedGeo() {
    const nativeThree = getRuntime();
    if (sharedGeo || !nativeThree) return;
    const THREE = nativeThree.THREE;
    sharedGeo = {
      bodyLow: new THREE.SphereGeometry(1, 32, 24),
      bodyHigh: new THREE.SphereGeometry(1, 112, 84),
      cloudLow: new THREE.SphereGeometry(1.03, 24, 16),
      cloudHigh: new THREE.SphereGeometry(1.03, 90, 64),
      hazeLow: new THREE.SphereGeometry(1.08, 24, 16),
      hazeHigh: new THREE.SphereGeometry(1.08, 90, 64),
    };
  }

  function disposeSharedGeo() {
    if (!sharedGeo) return;
    for (const geometry of Object.values(sharedGeo)) {
      try {
        geometry?.dispose?.();
      } catch {}
    }
    sharedGeo = null;
  }

  function resetPositionHelpers() {
    posHelpers.yUp = null;
    posHelpers.axisVec = null;
    posHelpers.axisQuat = null;
    posHelpers.yawQ = null;
    posHelpers.pitchQ = null;
  }

  function ensurePosHelpers(THREE) {
    if (posHelpers.yUp) return;
    posHelpers.yUp = new THREE.Vector3(0, 1, 0);
    posHelpers.axisVec = new THREE.Vector3();
    posHelpers.axisQuat = new THREE.Quaternion();
    posHelpers.yawQ = new THREE.Quaternion();
    posHelpers.pitchQ = new THREE.Quaternion();
  }

  function swapBodyLod(entry, lod) {
    if (!sharedGeo || entry.lod === lod) return;
    entry.lod = lod;
    entry.body.geometry = lod === "high" ? sharedGeo.bodyHigh : sharedGeo.bodyLow;
    entry.clouds.geometry = lod === "high" ? sharedGeo.cloudHigh : sharedGeo.cloudLow;
    entry.haze.geometry = lod === "high" ? sharedGeo.hazeHigh : sharedGeo.hazeLow;
  }

  function applyMapsToEntry(THREE, entry, textureSignature, maps, descriptor) {
    const nativeThree = getRuntime();
    if (!nativeThree || isDisposed()) return;
    if (entry.textureBundle?.signature === textureSignature) {
      entry.pendingTextureSignature = textureSignature;
      entry.texturesReady = true;
      if (textureSignature === entry.finalTextureSignature) settleEntryTexturesReady(entry, true);
      return;
    }
    const maxAniso = nativeThree.renderer?.capabilities?.getMaxAnisotropy?.() || 1;
    const aniso = clamp(Math.round(maxAniso), 1, 8);
    const nextBundle = acquireRendererTextureBundle({
      renderer: nativeThree.renderer,
      THREE,
      textureSignature,
      maps,
      anisotropy: aniso,
    });
    if (!nextBundle) return;

    const prevBundle = entry.textureBundle;
    entry.textureBundle = nextBundle;
    entry.textureBundleSignature = nextBundle.signature;
    entry.textureBundleRenderer = nativeThree.renderer;

    const mat = entry.bodyMat;
    mat.color.set(0xffffff);
    mat.map = nextBundle.surface;
    mat.normalMap = nextBundle.normal;
    mat.roughnessMap = nextBundle.roughness;
    mat.emissiveMap = nextBundle.emissive;
    mat.emissive?.set?.("#ffffff");
    mat.needsUpdate = true;

    const hasOcean = hasLayer(
      descriptor,
      "ocean-fill",
      (layer) => !layer?.params?.frozen && Number(layer?.params?.coverage || 0) > 0.12,
    );
    const warmEmissive =
      hasLayer(descriptor, "molten-fissures") ||
      hasLayer(descriptor, "volcanic-system") ||
      descriptor.profileId === "lava-world" ||
      descriptor.profileId === "molten-companion" ||
      descriptor.profileId === "io";
    const coolEmissive =
      hasLayer(descriptor, "fractures") ||
      hasLayer(descriptor, "plume-haze") ||
      descriptor.profileId === "europa" ||
      descriptor.profileId === "enceladus" ||
      descriptor.profileId === "triton";

    if (descriptor.bodyType === "gasGiant") {
      mat.roughness = 0.82;
      mat.metalness = 0.03;
      if (mat.normalScale?.set) mat.normalScale.set(0.4, 0.4);
      if ("clearcoat" in mat) mat.clearcoat = 0.02;
      if ("clearcoatRoughness" in mat) mat.clearcoatRoughness = 0.36;
    } else if (descriptor.bodyType === "moon") {
      mat.roughness = 0.82;
      mat.metalness = 0.01;
      if (mat.normalScale?.set) mat.normalScale.set(0.9, 0.9);
      if ("clearcoat" in mat) mat.clearcoat = 0.03;
      if ("clearcoatRoughness" in mat) mat.clearcoatRoughness = 0.58;
    } else {
      mat.roughness = hasOcean ? 0.88 : 0.82;
      mat.metalness = 0.02;
      if (mat.normalScale?.set) {
        const ts = hasOcean ? 0.62 : 0.78;
        mat.normalScale.set(ts, ts);
      }
      if ("clearcoat" in mat) mat.clearcoat = 0.02;
      if ("clearcoatRoughness" in mat) mat.clearcoatRoughness = hasOcean ? 0.3 : 0.48;
    }
    mat.emissiveIntensity = warmEmissive ? 0.72 : coolEmissive ? 0.48 : 0.08;

    entry.cloudMat.map = nextBundle.cloud;
    entry.cloudMat.alphaMap = nextBundle.cloud;
    entry.cloudMat.needsUpdate = true;
    entry.texturesReady = true;
    if (textureSignature === entry.finalTextureSignature) settleEntryTexturesReady(entry, true);
    if (prevBundle && prevBundle !== nextBundle) {
      releaseRendererTextureBundle({
        renderer: nativeThree.renderer,
        textureSignature: prevBundle.signature,
      });
    }
  }

  async function generateBodyTextures(entry) {
    const nativeThree = getRuntime();
    if (!nativeThree || isDisposed()) {
      settleEntryTexturesReady(entry, false);
      return;
    }
    const THREE = nativeThree.THREE;
    const descriptor = entry.descriptor;
    const textureSize = descriptor.textureSize || 128;
    const signature = buildCelestialTextureSignature(descriptor, textureSize);
    const entryIsActive = () => !!getRuntime() && !isDisposed() && !entry?.disposed;

    let maps = getCachedTextures(signature);
    if (maps) {
      recordCelestialTextureFulfillment("memory", { scope: "body-mesh" });
      entry.pendingTextureSignature = signature;
      applyMapsToEntry(THREE, entry, signature, maps, descriptor);
      return;
    }

    if (await loadFromIDBToCache(signature)) {
      if (!getRuntime() || isDisposed()) return;
      maps = getCachedTextures(signature);
      if (maps) {
        recordCelestialTextureFulfillment("indexedDB", { scope: "body-mesh" });
        entry.pendingTextureSignature = signature;
        applyMapsToEntry(THREE, entry, signature, maps, descriptor);
        return;
      }
    }

    const tinyDesc = composeCelestialDescriptor(entry.model, { lod: "tiny" });
    const tinySig = buildCelestialTextureSignature(tinyDesc, tinyDesc.textureSize || 64);
    let tinyMaps = getCachedTextures(tinySig);
    if (!tinyMaps) {
      try {
        tinyMaps = await requestQueuedCelestialTextureMaps({
          signature: tinySig,
          descriptor: tinyDesc,
          textureSize: tinyDesc.textureSize || 64,
          perfScope: "body-mesh-placeholder",
          priority: "high",
          shouldContinue: entryIsActive,
          localFactory: generateCelestialTextureCanvasesLocal,
          allowWorker: false,
        });
      } catch (error) {
        if (!isCelestialTextureJobCanceledError(error)) {
          /* placeholder generation is best-effort */
        }
        settleEntryTexturesReady(entry, false);
        return;
      }
      if (!tinyMaps) {
        settleEntryTexturesReady(entry, false);
        return;
      }
      cacheTextures(tinySig, tinyMaps);
    }
    if (!entryIsActive()) return;
    entry.pendingTextureSignature = tinySig;
    applyMapsToEntry(THREE, entry, tinySig, tinyMaps, descriptor);

    try {
      maps = await requestQueuedCelestialTextureMaps({
        signature,
        descriptor,
        textureSize,
        perfScope: "body-mesh",
        priority: "medium",
        shouldContinue: entryIsActive,
        localFactory: generateCelestialTextureCanvasesLocal,
      });
    } catch (error) {
      if (!isCelestialTextureJobCanceledError(error)) {
        /* texture generation is best-effort */
      }
      settleEntryTexturesReady(entry, false);
      return;
    }
    if (!entryIsActive()) {
      settleEntryTexturesReady(entry, false);
      return;
    }
    cacheTextures(signature, maps);
    entry.pendingTextureSignature = signature;
    applyMapsToEntry(THREE, entry, signature, maps, descriptor);
  }

  function releaseEntryTextureBundle(entry, renderer = null) {
    const targetRenderer = renderer || entry?.textureBundleRenderer || null;
    if (!entry?.textureBundle?.signature || !targetRenderer) {
      if (entry) {
        entry.textureBundle = null;
        entry.textureBundleSignature = "";
        entry.pendingTextureSignature = "";
        entry.textureBundleRenderer = null;
      }
      return;
    }
    releaseRendererTextureBundle({
      renderer: targetRenderer,
      textureSignature: entry.textureBundle.signature,
    });
    entry.textureBundle = null;
    entry.textureBundleSignature = "";
    entry.pendingTextureSignature = "";
    entry.textureBundleRenderer = null;
  }

  function releaseEntryRingTextureBundle(entry, renderer = null) {
    const targetRenderer = renderer || entry?.ringTextureBundleRenderer || null;
    if (!entry?.ringTextureBundle?.signature || !targetRenderer) {
      if (entry) {
        entry.ringTextureBundle = null;
        entry.ringTextureSignature = "";
        entry.ringTextureBundleRenderer = null;
        entry._ringTextures = null;
      }
      return;
    }
    releaseRingTextureBundle({
      renderer: targetRenderer,
      bundle: entry.ringTextureBundle,
    });
    entry.ringTextureBundle = null;
    entry.ringTextureSignature = "";
    entry.ringTextureBundleRenderer = null;
    entry._ringTextures = null;
  }

  function disposeBodyMeshEntry(key, entry) {
    if (!entry) return;
    entry.disposed = true;
    settleEntryTexturesReady(entry, false);
    releaseEntryTextureBundle(entry, getRuntime()?.renderer || null);
    releaseEntryRingTextureBundle(entry, getRuntime()?.renderer || null);
    for (const mat of [entry.bodyMat, entry.cloudMat, entry.hazeMat, entry.ringMat]) {
      try {
        mat?.dispose?.();
      } catch {}
    }
    if (entry.ring) {
      try {
        entry.ring.geometry?.dispose?.();
      } catch {}
    }
    try {
      entry.group?.parent?.remove?.(entry.group);
    } catch {}
    if (key) bodyMeshCache.delete(key);
  }

  function createBodyMeshEntry(model, key) {
    const nativeThree = getRuntime();
    if (!nativeThree || !sharedGeo) return null;
    const THREE = nativeThree.THREE;
    const descriptor = composeCelestialDescriptor(model, { lod: "low" });
    const modelSignature = buildBodyStructuralSignature(model);
    const group = new THREE.Group();
    group.visible = false;

    const bodyMat = previewPbrMaterial(THREE);
    applyRingShadowBodyPatch(bodyMat, THREE);
    const baseGrad = (descriptor?.layers || []).find((layer) => layer?.id === "base-gradient");
    if (baseGrad?.params?.c1) bodyMat.color.set(baseGrad.params.c1);
    const body = new THREE.Mesh(sharedGeo.bodyLow, bodyMat);
    body.renderOrder = 0;
    group.add(body);

    const flattenMaps = shouldFlattenStyleMaps(descriptor);
    const showCloudShell =
      !flattenMaps && descriptor.bodyType !== "gasGiant" && !!descriptor.clouds?.enabled;
    const cloudMat = new THREE.MeshStandardMaterial({
      map: null,
      alphaMap: null,
      transparent: true,
      opacity: showCloudShell ? clamp(Number(descriptor.clouds?.opacity) || 0.2, 0.04, 0.9) : 0,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(sharedGeo.cloudLow, cloudMat);
    clouds.renderOrder = 2;
    clouds.visible = showCloudShell;
    clouds.scale.setScalar(showCloudShell ? Number(descriptor.clouds?.scale) || 1.03 : 1.03);
    group.add(clouds);

    const showHaze = !!descriptor.atmosphere?.enabled;
    const hazeMat = createOrthoAtmosphereMaterial(THREE);
    const haze = new THREE.Mesh(sharedGeo.hazeLow, hazeMat);
    haze.renderOrder = 3;
    haze.visible = showHaze;
    haze.scale.setScalar(showHaze ? Number(descriptor.atmosphere?.scale) || 1.06 : 1.06);
    const hazeColour = descriptor.atmosphere?.colour || "#90b4ec";
    const hazeOpacity = showHaze
      ? clamp(Number(descriptor.atmosphere?.opacity) || 0.12, 0.03, 0.4)
      : 0;
    const hazeScale = clamp(Number(descriptor.atmosphere?.scale) || 1.06, 1, 1.6);
    if (hazeMat.uniforms?.uColor) {
      hazeMat.uniforms.uColor.value.set(hazeColour);
      hazeMat.uniforms.uOpacity.value = hazeOpacity;
      const powerBase =
        descriptor.bodyType === "gasGiant" ? 1.85 : descriptor.bodyType === "moon" ? 2.45 : 2.15;
      hazeMat.uniforms.uPower.value = clamp(powerBase - (hazeScale - 1) * 1.05, 1.35, 2.8);
      hazeMat.uniforms.uFalloff.value =
        descriptor.bodyType === "gasGiant" ? 0.72 : descriptor.bodyType === "moon" ? 0.62 : 0.66;
    } else {
      hazeMat.color?.set?.(hazeColour);
      hazeMat.opacity = hazeOpacity;
    }
    group.add(haze);

    let ring = null;
    let ringMat = null;
    let ringTextureBundle = null;
    if (descriptor.ring?.enabled) {
      const inner = clamp(Number(descriptor.ring.inner) || 1.22, 1.1, 2.5);
      const outer = clamp(Number(descriptor.ring.outer) || 1.95, inner + 0.05, 3.2);
      const ringGeom = createRingGeometry(THREE, inner, outer, 192);
      ringTextureBundle = createRingTextureBundle(nativeThree, descriptor.ring);

      ringMat = createRingLightingMaterial(THREE);
      updateRingLightingMaterial({
        material: ringMat,
        colourTexture: ringTextureBundle?.colorTex || null,
        alphaTexture: ringTextureBundle?.alphaTex || null,
        ringDescriptor: descriptor.ring,
      });
      ring = new THREE.Mesh(ringGeom, ringMat);
      ring.renderOrder = 1;
      ring.rotation.x = THREE.MathUtils.degToRad(Number(descriptor.ring.tiltDeg) || 100);
      ring.rotation.z = THREE.MathUtils.degToRad(Number(descriptor.ring.yawDeg) || 20);
      group.add(ring);
    }

    nativeThree.bodyGroup.add(group);
    const entry = {
      group,
      body,
      clouds,
      haze,
      ring,
      ringMat,
      bodyMat,
      cloudMat,
      hazeMat,
      descriptor,
      model,
      modelSignature,
      cacheKey: key,
      disposed: false,
      textureBundle: null,
      textureBundleSignature: "",
      textureBundleRenderer: null,
      ringTextureBundle,
      ringTextureSignature: ringTextureBundle?.signature || "",
      ringTextureBundleRenderer: ringTextureBundle ? nativeThree.renderer : null,
      pendingTextureSignature: "",
      texturesReady: false,
      finalTextureSignature: buildCelestialTextureSignature(
        descriptor,
        descriptor.textureSize || 128,
      ),
      texturesReadyPromise: null,
      _resolveTexturesReady: null,
      _texturesReadySettled: false,
      lod: "low",
      _ringTextures: ringTextureBundle
        ? [ringTextureBundle.colorTex, ringTextureBundle.alphaTex]
        : null,
    };
    const readySignal = createEntryReadyPromise();
    entry.texturesReadyPromise = readySignal.promise;
    entry._resolveTexturesReady = readySignal.resolveReady;
    bodyMeshCache.set(key, entry);
    void generateBodyTextures(entry);
    return entry;
  }

  async function warmBodyMeshes(snapshot, options = {}) {
    if (!getRuntime() || isDisposed()) return;
    ensureSharedGeo();
    const hasKey = (key, model) => {
      const entry = bodyMeshCache.get(key);
      return !!entry && entry.modelSignature === buildBodyStructuralSignature(model);
    };
    const needed = Array.isArray(options.items)
      ? normalizeExplicitWarmItems(options.items, hasKey)
      : collectBodyMeshWarmItems(snapshot, {
          includeMoons: options.includeMoons !== false,
          hasKey,
        });
    if (!needed.length) return;
    const warmSignature = buildWarmItemsSignature(needed);
    if (activeWarmPromise && warmSignature && activeWarmSignature === warmSignature) {
      return activeWarmPromise;
    }
    const gen = ++bodyMeshWarmGen;
    const maxBatchItemsRaw = Number(options.maxBatchItems);
    const maxBatchItems =
      Number.isFinite(maxBatchItemsRaw) && maxBatchItemsRaw > 0
        ? Math.round(maxBatchItemsRaw)
        : needed.length;
    const shouldYieldBetweenBatches =
      options.yieldBetweenBatches !== false && maxBatchItems < needed.length;
    const warmPromise = (async () => {
      for (let start = 0; start < needed.length; start += maxBatchItems) {
        if (gen !== bodyMeshWarmGen || isDisposed()) return;
        const batch = needed.slice(start, start + maxBatchItems);
        const batchEntries = [];
        for (const item of batch) {
          if (gen !== bodyMeshWarmGen || isDisposed()) return;
          const existing = bodyMeshCache.get(item.key);
          if (existing) disposeBodyMeshEntry(item.key, existing);
          const entry = createBodyMeshEntry(item.model, item.key);
          if (entry?.texturesReadyPromise) batchEntries.push(entry);
        }
        if (batchEntries.length) {
          await Promise.all(batchEntries.map((entry) => entry.texturesReadyPromise));
        }
        if (gen !== bodyMeshWarmGen || isDisposed()) return;
        if (shouldYieldBetweenBatches && start + maxBatchItems < needed.length) {
          await waitForWarmBatchYield(options);
        }
      }
    })().finally(() => {
      if (activeWarmPromise === warmPromise) {
        activeWarmPromise = null;
        activeWarmSignature = "";
      }
    });
    activeWarmSignature = warmSignature;
    activeWarmPromise = warmPromise;
    return warmPromise;
  }

  function disposeBodyMeshCache() {
    bodyMeshWarmGen += 1;
    activeWarmPromise = null;
    activeWarmSignature = "";
    for (const [, entry] of bodyMeshCache) {
      disposeBodyMeshEntry("", entry);
    }
    bodyMeshCache.clear();
    const renderer = getRuntime()?.renderer || null;
    if (renderer) disposeRendererTextureBundleCache(renderer);
    if (renderer) disposeRendererRingTextureBundleCache(renderer);
  }

  function positionBodyMesh(options) {
    const {
      axialTiltDeg,
      bodyId,
      bodyZ,
      key,
      lightDirectionWorld = null,
      model,
      pos,
      pr,
      spinAngle,
      touched,
    } = options;
    if (!sharedGeo || pr < BODY_MESH_MIN_PX) return null;
    const nativeThree = getRuntime();
    if (!nativeThree) return null;

    let entry = bodyMeshCache.get(key);
    const modelSignature = buildBodyStructuralSignature(model);
    if (entry && entry.modelSignature !== modelSignature) {
      disposeBodyMeshEntry(key, entry);
      entry = null;
    }
    if (!entry) entry = createBodyMeshEntry(model, key);
    if (!entry) return null;

    const THREE = nativeThree.THREE;
    ensurePosHelpers(THREE);

    const targetLod = pr >= 12 ? "high" : "low";
    if (entry.lod !== targetLod) swapBodyLod(entry, targetLod);

    entry.group.scale.setScalar(pr);
    entry.group.position.set(pos.x, pos.y, bodyZ);

    const { pitch = 0, yaw = 0 } = getCameraState() || {};
    const tilt = normalizeAxialTiltDeg(axialTiltDeg);
    const retrograde = tilt > 90;
    const obliquityRad = ((retrograde ? 180 - tilt : tilt) * Math.PI) / 180;
    const azimuth = hashUnit(`${bodyId}:axis`) * Math.PI * 2;
    const h = Math.sin(obliquityRad);
    posHelpers.axisVec
      .set(
        h * Math.cos(azimuth),
        Math.cos(obliquityRad) * (retrograde ? -1 : 1),
        h * Math.sin(azimuth),
      )
      .normalize();
    posHelpers.axisQuat.setFromUnitVectors(posHelpers.yUp, posHelpers.axisVec);
    posHelpers.yawQ.setFromAxisAngle(posHelpers.yUp, yaw);
    posHelpers.pitchQ.setFromAxisAngle(posHelpers.axisVec.set(1, 0, 0), pitch);
    posHelpers.pitchQ.multiply(posHelpers.yawQ);
    entry.group.quaternion.multiplyQuaternions(posHelpers.pitchQ, posHelpers.axisQuat);

    entry.body.rotation.set(0, spinAngle, 0);
    if (entry.clouds.visible) entry.clouds.rotation.set(0, spinAngle * 1.25, 0);
    if (entry.haze.visible) entry.haze.rotation.set(0, spinAngle * 0.35, 0);
    refreshRingLightingForEntry(entry, nativeThree, lightDirectionWorld);
    refreshBodyRingShadowForEntry(entry, nativeThree, lightDirectionWorld);

    entry.group.visible = true;
    touched?.add?.(key);
    return entry;
  }

  function hideUntouched(touched) {
    for (const [key, entry] of bodyMeshCache) {
      if (!touched.has(key)) entry.group.visible = false;
    }
  }

  return {
    disposeBodyMeshCache,
    disposeSharedGeo,
    hideUntouched,
    positionBodyMesh,
    resetPositionHelpers,
    warmBodyMeshes,
  };
}
