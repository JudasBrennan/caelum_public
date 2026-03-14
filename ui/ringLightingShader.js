import { clamp } from "../engine/utils.js";

export const DEFAULT_RING_SHADING = Object.freeze({
  litFaceGain: 0.82,
  backscatterGain: 0.38,
  grazingViewGain: 0.18,
  unlitFloor: 0.14,
  planetShadowStrength: 0.78,
  planetShadowSoftness: 0.055,
  planetShadowRadiusBias: 0.02,
  ringShadowOnBodyStrength: 0.44,
  ringShadowOnBodySoftness: 0.12,
  ringShadowOnBodySpecularRetention: 0.56,
});

const DEFAULT_LIGHT_DIR = Object.freeze({ x: -3, y: 2, z: 3 });

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

function normalizedVectorLike(source, fallback = DEFAULT_LIGHT_DIR) {
  const x = Number(source?.x);
  const y = Number(source?.y);
  const z = Number(source?.z);
  const raw = {
    x: Number.isFinite(x) ? x : Number(fallback.x) || 0,
    y: Number.isFinite(y) ? y : Number(fallback.y) || 0,
    z: Number.isFinite(z) ? z : Number(fallback.z) || 1,
  };
  const length = Math.hypot(raw.x, raw.y, raw.z) || 1;
  return {
    x: raw.x / length,
    y: raw.y / length,
    z: raw.z / length,
  };
}

export function normalizeRingShading(shading = {}) {
  return {
    litFaceGain: clamp(
      Number.isFinite(Number(shading?.litFaceGain))
        ? Number(shading.litFaceGain)
        : DEFAULT_RING_SHADING.litFaceGain,
      0,
      2,
    ),
    backscatterGain: clamp(
      Number.isFinite(Number(shading?.backscatterGain))
        ? Number(shading.backscatterGain)
        : DEFAULT_RING_SHADING.backscatterGain,
      0,
      2,
    ),
    grazingViewGain: clamp(
      Number.isFinite(Number(shading?.grazingViewGain))
        ? Number(shading.grazingViewGain)
        : DEFAULT_RING_SHADING.grazingViewGain,
      0,
      2,
    ),
    unlitFloor: clamp(
      Number.isFinite(Number(shading?.unlitFloor))
        ? Number(shading.unlitFloor)
        : DEFAULT_RING_SHADING.unlitFloor,
      0,
      1,
    ),
    planetShadowStrength: clamp(
      Number.isFinite(Number(shading?.planetShadowStrength))
        ? Number(shading.planetShadowStrength)
        : DEFAULT_RING_SHADING.planetShadowStrength,
      0,
      1,
    ),
    planetShadowSoftness: clamp(
      Number.isFinite(Number(shading?.planetShadowSoftness))
        ? Number(shading.planetShadowSoftness)
        : DEFAULT_RING_SHADING.planetShadowSoftness,
      0.001,
      0.5,
    ),
    planetShadowRadiusBias: clamp(
      Number.isFinite(Number(shading?.planetShadowRadiusBias))
        ? Number(shading.planetShadowRadiusBias)
        : DEFAULT_RING_SHADING.planetShadowRadiusBias,
      -0.2,
      0.5,
    ),
    ringShadowOnBodyStrength: clamp(
      Number.isFinite(Number(shading?.ringShadowOnBodyStrength))
        ? Number(shading.ringShadowOnBodyStrength)
        : DEFAULT_RING_SHADING.ringShadowOnBodyStrength,
      0,
      1,
    ),
    ringShadowOnBodySoftness: clamp(
      Number.isFinite(Number(shading?.ringShadowOnBodySoftness))
        ? Number(shading.ringShadowOnBodySoftness)
        : DEFAULT_RING_SHADING.ringShadowOnBodySoftness,
      0.001,
      0.5,
    ),
    ringShadowOnBodySpecularRetention: clamp(
      Number.isFinite(Number(shading?.ringShadowOnBodySpecularRetention))
        ? Number(shading.ringShadowOnBodySpecularRetention)
        : DEFAULT_RING_SHADING.ringShadowOnBodySpecularRetention,
      0,
      1,
    ),
  };
}

export function resolveDirectionalLightVector(lightLike, fallback = DEFAULT_LIGHT_DIR) {
  if (lightLike?.position) {
    const tx = Number(lightLike?.target?.position?.x) || 0;
    const ty = Number(lightLike?.target?.position?.y) || 0;
    const tz = Number(lightLike?.target?.position?.z) || 0;
    return normalizedVectorLike(
      {
        x: Number(lightLike.position.x) - tx,
        y: Number(lightLike.position.y) - ty,
        z: Number(lightLike.position.z) - tz,
      },
      fallback,
    );
  }
  return normalizedVectorLike(lightLike, fallback);
}

function makeFallbackMaterial(THREE) {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

export function createRingLightingMaterial(THREE) {
  if (typeof THREE?.ShaderMaterial !== "function") {
    const material = makeFallbackMaterial(THREE);
    material.userData = { ...(material.userData || {}), ringLightingShader: false };
    return material;
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColourTex: { value: null },
      uAlphaTex: { value: null },
      uOpacity: { value: 0.35 },
      uLightDirWorld: { value: createVec3(THREE, -0.6396, 0.4264, 0.6396) },
      uPlanetCenterWorld: { value: createVec3(THREE, 0, 0, 0) },
      uPlanetRadius: { value: 1 },
      uLitFaceGain: { value: DEFAULT_RING_SHADING.litFaceGain },
      uBackscatterGain: { value: DEFAULT_RING_SHADING.backscatterGain },
      uGrazingViewGain: { value: DEFAULT_RING_SHADING.grazingViewGain },
      uUnlitFloor: { value: DEFAULT_RING_SHADING.unlitFloor },
      uPlanetShadowStrength: { value: DEFAULT_RING_SHADING.planetShadowStrength },
      uPlanetShadowSoftness: { value: DEFAULT_RING_SHADING.planetShadowSoftness },
      uPlanetShadowRadiusBias: { value: DEFAULT_RING_SHADING.planetShadowRadiusBias },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vRingNormalWorld;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vUv = uv;
        vWorldPos = worldPos.xyz;
        vRingNormalWorld = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D uColourTex;
      uniform sampler2D uAlphaTex;
      uniform float uOpacity;
      uniform vec3 uLightDirWorld;
      uniform vec3 uPlanetCenterWorld;
      uniform float uPlanetRadius;
      uniform float uLitFaceGain;
      uniform float uBackscatterGain;
      uniform float uGrazingViewGain;
      uniform float uUnlitFloor;
      uniform float uPlanetShadowStrength;
      uniform float uPlanetShadowSoftness;
      uniform float uPlanetShadowRadiusBias;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vRingNormalWorld;

      float computePlanetShadow(vec3 worldPos, vec3 lightDir) {
        vec3 toPlanet = uPlanetCenterWorld - worldPos;
        float closestT = dot(toPlanet, lightDir);
        if (closestT <= 0.0) return 1.0;
        float distSq = max(dot(toPlanet, toPlanet) - closestT * closestT, 0.0);
        float dist = sqrt(distSq);
        float radius = max(0.0001, uPlanetRadius * (1.0 + uPlanetShadowRadiusBias));
        float softness = max(0.0001, uPlanetRadius * uPlanetShadowSoftness);
        float edge = smoothstep(radius - softness, radius + softness, dist);
        return 1.0 - (1.0 - edge) * uPlanetShadowStrength;
      }

      void main() {
        vec4 baseColour = texture2D(uColourTex, vUv);
        float sampledAlpha = texture2D(uAlphaTex, vUv).r * uOpacity;
        if (sampledAlpha < 0.002) discard;

        vec3 lightDir = normalize(uLightDirWorld);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 ringNormal = normalize(vRingNormalWorld);

        float faceLight = abs(dot(ringNormal, lightDir));
        float grazing = pow(clamp(1.0 - abs(dot(ringNormal, viewDir)), 0.0, 1.0), 1.2);
        float backscatter = pow(clamp(dot(viewDir, lightDir), 0.0, 1.0), 2.5);
        float lighting = clamp(
          max(uUnlitFloor, faceLight * uLitFaceGain) +
            grazing * uGrazingViewGain +
            backscatter * uBackscatterGain,
          0.0,
          2.5
        );
        float shadow = computePlanetShadow(vWorldPos, lightDir);
        float alpha = clamp(sampledAlpha * mix(0.88, 1.0, lighting) * mix(0.9, 1.0, shadow), 0.0, 1.0);
        vec3 colour = baseColour.rgb * lighting * shadow;
        gl_FragColor = vec4(colour, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  material.userData = { ...(material.userData || {}), ringLightingShader: true };
  return material;
}

export function updateRingLightingMaterial({
  material,
  colourTexture = null,
  alphaTexture = null,
  ringDescriptor = null,
} = {}) {
  if (!material) return;
  const shading = normalizeRingShading(ringDescriptor?.shading);
  if (material.userData?.ringLightingShader && material.uniforms) {
    material.uniforms.uColourTex.value = colourTexture;
    material.uniforms.uAlphaTex.value = alphaTexture;
    material.uniforms.uOpacity.value = clamp(Number(ringDescriptor?.opacity) || 0.35, 0.05, 0.8);
    material.uniforms.uLitFaceGain.value = shading.litFaceGain;
    material.uniforms.uBackscatterGain.value = shading.backscatterGain;
    material.uniforms.uGrazingViewGain.value = shading.grazingViewGain;
    material.uniforms.uUnlitFloor.value = shading.unlitFloor;
    material.uniforms.uPlanetShadowStrength.value = shading.planetShadowStrength;
    material.uniforms.uPlanetShadowSoftness.value = shading.planetShadowSoftness;
    material.uniforms.uPlanetShadowRadiusBias.value = shading.planetShadowRadiusBias;
    material.uniformsNeedUpdate = true;
    return;
  }

  material.map = colourTexture;
  material.alphaMap = alphaTexture;
  if (material.color?.set) material.color.set(0xffffff);
  material.opacity = clamp(Number(ringDescriptor?.opacity) || 0.35, 0.05, 0.8);
  material.needsUpdate = true;
}

export function updateRingLightingUniforms({
  material,
  lightDirectionWorld = DEFAULT_LIGHT_DIR,
  planetCenterWorld = null,
  planetRadius = 1,
} = {}) {
  if (!material?.userData?.ringLightingShader || !material.uniforms) return;
  setVec3(
    material.uniforms.uLightDirWorld.value,
    resolveDirectionalLightVector(lightDirectionWorld),
  );
  setVec3(material.uniforms.uPlanetCenterWorld.value, planetCenterWorld || { x: 0, y: 0, z: 0 });
  material.uniforms.uPlanetRadius.value = Math.max(0.0001, Number(planetRadius) || 1);
  material.uniformsNeedUpdate = true;
}
