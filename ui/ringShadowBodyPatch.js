import { clamp } from "../engine/utils.js";
import { normalizeRingShading, resolveDirectionalLightVector } from "./ringLightingShader.js";

const PATCH_VERSION = "ring-shadow-body-v1";

function createVec3(THREE, x = 0, y = 0, z = 0) {
  if (typeof THREE?.Vector3 === "function") return new THREE.Vector3(x, y, z);
  return {
    x,
    y,
    z,
    set(nx, ny, nz) {
      this.x = nx;
      this.y = ny;
      this.z = nz;
      return this;
    },
    normalize() {
      const length = Math.hypot(this.x, this.y, this.z) || 1;
      this.x /= length;
      this.y /= length;
      this.z /= length;
      return this;
    },
    applyQuaternion() {
      return this;
    },
  };
}

function createQuaternion(THREE) {
  if (typeof THREE?.Quaternion === "function") return new THREE.Quaternion();
  return {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
    set(x, y, z, w) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    },
  };
}

function setVec3(target, source) {
  if (!target || !source) return;
  if (typeof target.set === "function") {
    target.set(Number(source.x) || 0, Number(source.y) || 0, Number(source.z) || 0);
    return;
  }
  target.x = Number(source.x) || 0;
  target.y = Number(source.y) || 0;
  target.z = Number(source.z) || 0;
}

function patchVertexShader(source) {
  if (!source || source.includes("vRingShadowWorldPos")) return source;
  let shader = source.replace(
    "#include <common>",
    `#include <common>
varying vec3 vRingShadowWorldPos;`,
  );
  shader = shader.replace(
    "#include <project_vertex>",
    `#include <project_vertex>
vRingShadowWorldPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;`,
  );
  return shader;
}

function patchFragmentShader(source) {
  if (!source || source.includes("uRingShadowEnabled")) return source;
  let shader = source.replace(
    "#include <common>",
    `#include <common>
varying vec3 vRingShadowWorldPos;
uniform float uRingShadowEnabled;
uniform sampler2D uRingShadowAlphaTex;
uniform vec3 uLightDirWorld;
uniform vec3 uPlanetCenterWorld;
uniform float uPlanetRadiusWorld;
uniform vec3 uRingPlaneOriginWorld;
uniform vec3 uRingPlaneNormalWorld;
uniform vec3 uRingPlaneTangentWorld;
uniform vec3 uRingPlaneBitangentWorld;
uniform float uRingInnerRadiusWorld;
uniform float uRingOuterRadiusWorld;
uniform float uRingShadowStrength;
uniform float uRingShadowSoftness;
uniform float uRingShadowSpecularRetention;

float sampleRingShadowAlphaBlurred(float radialUv, float angleUv, float blurUv) {
  float r0 = texture2D(uRingShadowAlphaTex, vec2(clamp(radialUv, 0.0, 1.0), fract(angleUv))).r * 0.26;
  float r1 = texture2D(uRingShadowAlphaTex, vec2(clamp(radialUv - blurUv, 0.0, 1.0), fract(angleUv))).r * 0.2;
  float r2 = texture2D(uRingShadowAlphaTex, vec2(clamp(radialUv + blurUv, 0.0, 1.0), fract(angleUv))).r * 0.2;
  float r3 = texture2D(uRingShadowAlphaTex, vec2(clamp(radialUv - blurUv * 2.2, 0.0, 1.0), fract(angleUv))).r * 0.1;
  float r4 = texture2D(uRingShadowAlphaTex, vec2(clamp(radialUv + blurUv * 2.2, 0.0, 1.0), fract(angleUv))).r * 0.1;
  float a0 = texture2D(uRingShadowAlphaTex, vec2(clamp(radialUv, 0.0, 1.0), fract(angleUv - blurUv * 0.4))).r * 0.07;
  float a1 = texture2D(uRingShadowAlphaTex, vec2(clamp(radialUv, 0.0, 1.0), fract(angleUv + blurUv * 0.4))).r * 0.07;
  return r0 + r1 + r2 + r3 + r4 + a0 + a1;
}

float computeRingShadowOnBody(vec3 worldPos, vec3 lightDir) {
  if (uRingShadowEnabled < 0.5) return 0.0;
  vec3 planeNormal = normalize(uRingPlaneNormalWorld);
  float denom = dot(lightDir, planeNormal);
  if (abs(denom) < 1e-5) return 0.0;
  float t = dot(uRingPlaneOriginWorld - worldPos, planeNormal) / denom;
  if (t <= 0.0) return 0.0;
  vec3 hit = worldPos + lightDir * t;
  vec3 rel = hit - uRingPlaneOriginWorld;
  vec3 tangent = normalize(uRingPlaneTangentWorld);
  vec3 bitangent = normalize(uRingPlaneBitangentWorld);
  float tangentCoord = dot(rel, tangent);
  float bitangentCoord = dot(rel, bitangent);
  float radius = length(vec2(tangentCoord, bitangentCoord));
  float inner = max(0.0001, uRingInnerRadiusWorld);
  float outer = max(inner + 0.0001, uRingOuterRadiusWorld);
  float softness = max(0.0001, uPlanetRadiusWorld * uRingShadowSoftness);
  float expandedInner = inner - softness * 1.6;
  float expandedOuter = outer + softness * 1.9;
  float innerMask = smoothstep(expandedInner, inner + softness * 0.8, radius);
  float outerMask = 1.0 - smoothstep(outer - softness * 0.8, expandedOuter, radius);
  float annulusMask = clamp(innerMask * outerMask, 0.0, 1.0);
  if (annulusMask <= 0.0) return 0.0;
  float radialUv = clamp((radius - inner) / max(outer - inner, 0.0001), 0.0, 1.0);
  float angleUv = atan(bitangentCoord, tangentCoord) / (PI * 2.0) + 0.5;
  float blurUv = clamp((softness * 1.65) / max(outer - inner, 0.0001), 0.006, 0.11);
  float ringAlpha = sampleRingShadowAlphaBlurred(radialUv, angleUv, blurUv);
  float softMask = smoothstep(0.02, 0.9, ringAlpha);
  float ringShadow = mix(ringAlpha, softMask, 0.35);
  return clamp(ringShadow * annulusMask * uRingShadowStrength, 0.0, 1.0);
}`,
  );
  shader = shader.replace(
    "#include <lights_fragment_end>",
    `#include <lights_fragment_end>
{
  vec3 ringShadowLightDir = normalize(uLightDirWorld);
  float ringShadowMask = computeRingShadowOnBody(vRingShadowWorldPos, ringShadowLightDir);
  float ringShadowDiffuseFactor = 1.0 - ringShadowMask;
  float ringShadowSpecularFactor = 1.0 - ringShadowMask * (1.0 - uRingShadowSpecularRetention);
  reflectedLight.directDiffuse *= ringShadowDiffuseFactor;
  reflectedLight.directSpecular *= ringShadowSpecularFactor;
  #ifdef USE_CLEARCOAT
    clearcoatSpecularDirect *= ringShadowSpecularFactor;
  #endif
  #ifdef USE_SHEEN
    sheenSpecularDirect *= ringShadowSpecularFactor;
  #endif
}`,
  );
  return shader;
}

function ensurePatchState(material, THREE) {
  const userData = (material.userData = material.userData || {});
  if (userData.ringShadowBodyPatch) return userData.ringShadowBodyPatch;
  const uniforms = {
    uRingShadowEnabled: { value: 0 },
    uRingShadowAlphaTex: { value: null },
    uLightDirWorld: { value: createVec3(THREE, -0.6396, 0.4264, 0.6396) },
    uPlanetCenterWorld: { value: createVec3(THREE, 0, 0, 0) },
    uPlanetRadiusWorld: { value: 1 },
    uRingPlaneOriginWorld: { value: createVec3(THREE, 0, 0, 0) },
    uRingPlaneNormalWorld: { value: createVec3(THREE, 0, 0, 1) },
    uRingPlaneTangentWorld: { value: createVec3(THREE, 1, 0, 0) },
    uRingPlaneBitangentWorld: { value: createVec3(THREE, 0, 1, 0) },
    uRingInnerRadiusWorld: { value: 1.2 },
    uRingOuterRadiusWorld: { value: 2.0 },
    uRingShadowStrength: { value: 0.58 },
    uRingShadowSoftness: { value: 0.05 },
    uRingShadowSpecularRetention: { value: 0.35 },
  };
  const state = {
    uniforms,
    shader: null,
    originalOnBeforeCompile:
      typeof material.onBeforeCompile === "function" ? material.onBeforeCompile : null,
    originalCustomProgramCacheKey:
      typeof material.customProgramCacheKey === "function"
        ? material.customProgramCacheKey.bind(material)
        : null,
    temp: {
      quaternion: createQuaternion(THREE),
      ringOrigin: createVec3(THREE, 0, 0, 0),
      ringScale: createVec3(THREE, 1, 1, 1),
      ringNormal: createVec3(THREE, 0, 0, 1),
      ringTangent: createVec3(THREE, 1, 0, 0),
      ringBitangent: createVec3(THREE, 0, 1, 0),
    },
  };
  userData.ringShadowBodyPatch = state;
  return state;
}

export function applyRingShadowBodyPatch(material, THREE, options = {}) {
  if (!material || typeof material !== "object") return material;
  const state = ensurePatchState(material, THREE);
  if (material.userData?.ringShadowBodyPatchApplied) return material;

  material.onBeforeCompile = (shader, renderer) => {
    if (state.originalOnBeforeCompile) state.originalOnBeforeCompile(shader, renderer);
    Object.assign(shader.uniforms, state.uniforms);
    shader.vertexShader = patchVertexShader(shader.vertexShader);
    shader.fragmentShader = patchFragmentShader(shader.fragmentShader);
    state.shader = shader;
  };
  material.customProgramCacheKey = () => {
    const base = state.originalCustomProgramCacheKey ? state.originalCustomProgramCacheKey() : "";
    return `${base}|${PATCH_VERSION}`;
  };
  material.userData.ringShadowBodyPatchApplied = true;
  material.needsUpdate = options.forceRecompile !== false;
  return material;
}

export function clearRingShadowBodyPatch(material) {
  const state = material?.userData?.ringShadowBodyPatch;
  if (!state?.uniforms) return;
  state.uniforms.uRingShadowEnabled.value = 0;
  state.uniforms.uRingShadowAlphaTex.value = null;
  state.uniforms.uRingShadowStrength.value = 0;
  state.uniforms.uRingShadowSoftness.value = 0.05;
  state.uniforms.uRingShadowSpecularRetention.value = 1;
}

export function updateRingShadowBodyUniforms({
  material,
  lightDirectionWorld = null,
  ringDescriptor = null,
  ringAlphaTexture = null,
  planetCenterWorld = null,
  planetRadiusWorld = 1,
  ringMesh = null,
} = {}) {
  const state = material?.userData?.ringShadowBodyPatch;
  if (!state?.uniforms) return;

  const shading = normalizeRingShading(ringDescriptor?.shading);
  setVec3(state.uniforms.uLightDirWorld.value, resolveDirectionalLightVector(lightDirectionWorld));
  setVec3(state.uniforms.uPlanetCenterWorld.value, planetCenterWorld || { x: 0, y: 0, z: 0 });
  state.uniforms.uPlanetRadiusWorld.value = Math.max(0.0001, Number(planetRadiusWorld) || 1);

  const enabled = !!(ringDescriptor?.enabled && ringAlphaTexture && ringMesh);
  state.uniforms.uRingShadowEnabled.value = enabled ? 1 : 0;
  state.uniforms.uRingShadowAlphaTex.value = enabled ? ringAlphaTexture : null;
  state.uniforms.uRingShadowStrength.value = enabled ? shading.ringShadowOnBodyStrength : 0;
  state.uniforms.uRingShadowSoftness.value = shading.ringShadowOnBodySoftness;
  state.uniforms.uRingShadowSpecularRetention.value = clamp(
    shading.ringShadowOnBodySpecularRetention,
    0,
    1,
  );

  if (!enabled) return;

  const temp = state.temp;
  ringMesh.getWorldPosition?.(temp.ringOrigin);
  ringMesh.getWorldQuaternion?.(temp.quaternion);
  ringMesh.getWorldScale?.(temp.ringScale);

  temp.ringNormal.set(0, 0, 1).applyQuaternion(temp.quaternion).normalize();
  temp.ringTangent.set(1, 0, 0).applyQuaternion(temp.quaternion).normalize();
  temp.ringBitangent.set(0, 1, 0).applyQuaternion(temp.quaternion).normalize();

  setVec3(state.uniforms.uRingPlaneOriginWorld.value, temp.ringOrigin);
  setVec3(state.uniforms.uRingPlaneNormalWorld.value, temp.ringNormal);
  setVec3(state.uniforms.uRingPlaneTangentWorld.value, temp.ringTangent);
  setVec3(state.uniforms.uRingPlaneBitangentWorld.value, temp.ringBitangent);

  const radiusScale = Math.max(
    0.0001,
    Math.abs(Number(temp.ringScale.x) || 0),
    Math.abs(Number(temp.ringScale.y) || 0),
    Math.abs(Number(temp.ringScale.z) || 0),
  );
  state.uniforms.uRingInnerRadiusWorld.value = clamp(
    (Number(ringDescriptor?.inner) || 1.22) * radiusScale,
    0.0001,
    100000,
  );
  state.uniforms.uRingOuterRadiusWorld.value = clamp(
    (Number(ringDescriptor?.outer) || 1.95) * radiusScale,
    state.uniforms.uRingInnerRadiusWorld.value + 0.0001,
    100000,
  );
}
