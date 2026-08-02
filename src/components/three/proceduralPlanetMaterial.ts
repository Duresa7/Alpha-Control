import * as THREE from 'three';
import type { PlanetAppearance, PlanetSurfaceStyle } from '@/types';
import { DIRECTIONAL_LIGHT } from '@/config/lightingConfig';

const SURFACE_INDEX: Record<PlanetSurfaceStyle, number> = {
  landmass: 0,
  dunes: 1,
  icy: 2,
  ridged: 3,
  urban: 4,
  bands: 5,
  cratered: 6,
};

/**
 * The shaders shade in linear space, which is what three hands them: a Color
 * built from a hex string is converted on the way into the uniform. Each output
 * ends on `colorspace_fragment` so three encodes per render target — sRGB
 * straight to the canvas, identity into an EffectComposer's linear buffer,
 * which encodes on its own way out. Both paths land on the same pixel, and the
 * surface renders as the colour the designer's picker shows.
 */

/**
 * Value noise keeps the surface generation dependency-free and stable across
 * drivers. Gradient noise looks marginally better but costs roughly twice as
 * much for a difference nobody notices at planet scale.
 */
const NOISE_CHUNK = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm(vec3 p, int octaves) {
    float amp = 0.5;
    float sum = 0.0;
    float norm = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      sum += amp * vnoise(p);
      norm += amp;
      amp *= 0.5;
      p *= 2.03;
    }
    return sum / norm;
  }

  float ridgedNoise(vec3 p, int octaves) {
    float amp = 0.5;
    float sum = 0.0;
    float norm = 0.0;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      float v = 1.0 - abs(2.0 * vnoise(p) - 1.0);
      sum += amp * v * v;
      norm += amp;
      amp *= 0.5;
      p *= 2.07;
    }
    return sum / norm;
  }
`;

const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vObject;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLightDir;

  uniform vec3 uLightDir;

  void main() {
    vObject = normalize(position);
    vNormalView = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vLightDir = normalize((viewMatrix * vec4(uLightDir, 0.0)).xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const SURFACE_FRAGMENT = /* glsl */ `
  varying vec3 vObject;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLightDir;

  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uAtmosphereColor;
  uniform vec3 uNightLightColor;
  uniform vec3 uSeedOffset;
  uniform float uWaterLevel;
  uniform float uIceCaps;
  uniform float uAtmosphere;
  uniform float uNightLights;
  uniform float uRoughness;
  uniform int uSurface;
  uniform bool uHolo;

  ${NOISE_CHUNK}

  void surface(vec3 p, vec3 n, out float height, out float emissive) {
    emissive = 0.0;

    if (uSurface == 0) {
      float warp = (fbm(p * 0.9 + 11.0, 3) - 0.5) * 0.9;
      height = clamp((fbm(p * 1.9 + warp, 5) - 0.30) / 0.40, 0.0, 1.0);
    } else if (uSurface == 1) {
      float warp = (fbm(p * 1.2, 3) - 0.5) * 1.1;
      height = clamp(
        (fbm(vec3(p.x * 2.6 + warp, p.y * 7.5 + warp, p.z * 2.6 + warp), 4) - 0.31) / 0.38,
        0.0, 1.0
      );
    } else if (uSurface == 2) {
      float base = fbm(p * 2.4, 5);
      float cracks = ridgedNoise(p * 4.6, 3);
      height = clamp((base - 0.34) / 0.36, 0.0, 1.0) * 0.74 + (1.0 - cracks) * 0.26;
    } else if (uSurface == 3) {
      float cracks = ridgedNoise(p * 2.7, 5);
      height = clamp(0.12 + cracks * 0.95, 0.0, 1.0);
      emissive = smoothstep(0.72, 0.95, cracks);
    } else if (uSurface == 4) {
      float base = clamp((fbm(p * 2.0, 4) - 0.33) / 0.38, 0.0, 1.0);
      float districts = vnoise(p * 15.0);
      height = clamp(base * 0.72 + districts * 0.28, 0.0, 1.0);
      emissive = smoothstep(0.40, 0.86, height) * (0.30 + 0.70 * vnoise(p * 28.0));
    } else if (uSurface == 5) {
      float lat = asin(clamp(n.y, -1.0, 1.0));
      float turbulence = (fbm(p * 2.4, 4) - 0.5) * 1.0;
      float bands = 0.5 + 0.5 * sin(lat * 8.5 + turbulence * 2.8);
      height = clamp(bands * 0.86 + (fbm(p * 6.0, 3) - 0.5) * 0.24, 0.0, 1.0);
    } else {
      float base = clamp((fbm(p * 2.2, 4) - 0.32) / 0.40, 0.0, 1.0);
      float craters = ridgedNoise(p * 5.5, 3);
      height = base * 0.68 + (1.0 - craters) * 0.32;
    }
  }

  vec3 surfaceColor(float height) {
    vec3 c = height < 0.5
      ? mix(uColorLow, uColorMid, height * 2.0)
      : mix(uColorMid, uColorHigh, (height - 0.5) * 2.0);

    if (uWaterLevel > 0.0 && height < uWaterLevel) {
      float depth = height / max(1e-4, uWaterLevel);
      return uColorLow * mix(0.45, 1.0, depth);
    }

    // A narrow shore band stops coastlines reading as a hard colour switch.
    if (uWaterLevel > 0.0) {
      float shore = smoothstep(uWaterLevel, uWaterLevel + 0.04, height)
        * (1.0 - smoothstep(uWaterLevel + 0.04, uWaterLevel + 0.11, height));
      c = mix(c, mix(uColorMid, vec3(1.0), 0.55), shore * 0.6);
    }
    return c;
  }

  void main() {
    vec3 n = vObject;
    vec3 p = n + uSeedOffset;

    float height;
    float emissive;
    surface(p, n, height, emissive);

    vec3 normal = normalize(vNormalView);
    vec3 lightDir = normalize(vLightDir);
    vec3 viewDir = normalize(vViewDir);
    float ndl = dot(normal, lightDir);
    float facing = max(0.0, dot(normal, viewDir));
    float fresnel = pow(1.0 - facing, 3.2);

    if (uHolo) {
      float banded = floor(clamp(ndl, 0.0, 1.0) * 4.3) / 4.0;
      float level = 0.13 + banded * 0.81;

      float lat = asin(clamp(n.y, -1.0, 1.0));
      float lon = atan(n.z, n.x);
      float meridians = abs(fract(lon / 6.2831853 * 16.0) - 0.5) * 2.0;
      float parallels = abs(fract(lat / 3.1415927 * 10.0) - 0.5) * 2.0;
      float width = 0.06 + 0.34 * (1.0 - facing);
      float grid = max(
        1.0 - smoothstep(0.0, width, meridians),
        1.0 - smoothstep(0.0, width * 0.6, parallels)
      );

      float scanline = mod(gl_FragCoord.y, 3.0) < 1.0 ? 0.78 : 1.0;
      vec3 tint = mix(uColorMid, vec3(0.577, 0.407, 0.152), 0.55);
      vec3 color = tint * level
        + uAtmosphereColor * fresnel * 0.55
        + vec3(0.0, 0.868, 1.0) * grid * 0.55;

      gl_FragColor = vec4(color * scanline, clamp(0.30 + level * 0.70 + grid * 0.35, 0.0, 1.0));
      #include <colorspace_fragment>
      return;
    }

    vec3 albedo = surfaceColor(height);

    if (uIceCaps > 0.0) {
      float jitter = (fbm(p * 4.0, 2) - 0.5) * 0.18;
      float cap = smoothstep(0.70, 0.93, abs(n.y) + jitter) * uIceCaps;
      albedo = mix(albedo, vec3(0.911, 0.955, 1.0), cap);
    }

    float lambert = 0.008 + 1.05 * pow(max(0.0, (ndl + 0.18) / 1.18), 1.9);
    float fill = max(0.0, -ndl) * 0.015;
    vec3 halfVec = normalize(lightDir + viewDir);
    float specular = ndl > 0.0
      ? pow(max(0.0, dot(normal, halfVec)), mix(12.0, 100.0, 1.0 - uRoughness))
        * mix(0.004, 0.32, 1.0 - uRoughness)
      : 0.0;

    vec3 color = albedo * (lambert + fill) + vec3(specular);
    color += uAtmosphereColor * fresnel * uAtmosphere * (0.16 + 0.30 * max(0.0, ndl));

    float night = smoothstep(0.12, -0.22, ndl) * emissive * uNightLights;
    color += uNightLightColor * night;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const CLOUD_VERTEX = /* glsl */ `
  varying vec3 vObject;
  varying vec3 vNormalView;
  varying vec3 vLightDir;

  uniform vec3 uLightDir;

  void main() {
    vObject = normalize(position);
    vNormalView = normalize(normalMatrix * normal);
    vLightDir = normalize((viewMatrix * vec4(uLightDir, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CLOUD_FRAGMENT = /* glsl */ `
  varying vec3 vObject;
  varying vec3 vNormalView;
  varying vec3 vLightDir;

  uniform vec3 uCloudColor;
  uniform vec3 uSeedOffset;
  uniform float uCoverage;

  ${NOISE_CHUNK}

  void main() {
    vec3 p = vObject + uSeedOffset;
    float warp = (fbm(p * 1.4, 3) - 0.5) * 1.2;
    float v = fbm(vec3(p.x * 2.9 + warp, p.y * 4.6 + warp, p.z * 2.9 + warp), 5);

    float lat = asin(clamp(vObject.y, -1.0, 1.0));
    v = v * 0.84 + 0.16 * (0.5 + 0.5 * sin(lat * 6.0));

    // Coverage slides the threshold rather than scaling alpha, so low values
    // thin the deck out instead of making the whole sky translucent.
    float threshold = mix(0.72, 0.38, uCoverage);
    float alpha = smoothstep(threshold, threshold + 0.22, v);
    if (alpha <= 0.001) discard;

    float ndl = dot(normalize(vNormalView), normalize(vLightDir));
    float lambert = 0.015 + 1.0 * pow(max(0.0, (ndl + 0.18) / 1.18), 1.9);

    gl_FragColor = vec4(uCloudColor * lambert, alpha);
    #include <colorspace_fragment>
  }
`;

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLightDir;

  uniform vec3 uLightDir;

  void main() {
    vNormalView = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vLightDir = normalize((viewMatrix * vec4(uLightDir, 0.0)).xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vLightDir;

  uniform vec3 uAtmosphereColor;
  uniform float uStrength;
  uniform float uShellRatio;


  void main() {
    // Back-side shell: the normal points away from us, so flip it.
    vec3 normal = normalize(-vNormalView);
    float facing = max(0.0, dot(normal, normalize(vViewDir)));

    // Only the annulus between the planet's limb and the shell's silhouette is
    // visible. Facing runs 0 at the shell edge up to maxFacing at the limb, so
    // normalising by maxFacing puts the glow against the planet and fades it
    // outward. Using raw fresnel here instead lights the shell edge and reads
    // as a hard bubble.
    float maxFacing = sqrt(max(1e-4, 1.0 - uShellRatio * uShellRatio));
    float glow = pow(clamp(facing / maxFacing, 0.0, 1.0), 2.2);

    float ndl = dot(normal, normalize(vLightDir));
    float lit = 0.25 + 0.75 * smoothstep(-0.45, 0.55, ndl);
    gl_FragColor = vec4(uAtmosphereColor, glow * uStrength * lit * 0.85);
    #include <colorspace_fragment>
  }
`;

const RING_VERTEX = /* glsl */ `
  varying vec3 vLocal;

  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RING_FRAGMENT = /* glsl */ `
  varying vec3 vLocal;

  uniform vec3 uRingColor;
  uniform vec3 uSeedOffset;
  uniform float uInner;
  uniform float uOuter;
  uniform float uOpacity;

  ${NOISE_CHUNK}

  void main() {
    float radius = length(vLocal.xy);
    float t = clamp((radius - uInner) / max(1e-4, uOuter - uInner), 0.0, 1.0);

    float bands = 0.35 + 0.5 * abs(sin(t * 34.0 + uSeedOffset.x));
    bands *= 0.6 + 0.6 * fbm(vec3(t * 24.0, uSeedOffset.y, uSeedOffset.z), 3);

    float edges = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.86, 1.0, t));
    float alpha = clamp(bands * edges * uOpacity, 0.0, 1.0);
    if (alpha <= 0.002) discard;

    gl_FragColor = vec4(uRingColor, alpha);
    #include <colorspace_fragment>
  }
`;

/** Seeds are hashed into a small offset so the noise stays in a precise float range. */
function seedOffset(seed: number): THREE.Vector3 {
  const a = Math.abs(Math.sin(seed * 12.9898) * 43758.5453);
  const b = Math.abs(Math.sin(seed * 78.233) * 24634.6345);
  const c = Math.abs(Math.sin(seed * 39.425) * 15731.7431);
  return new THREE.Vector3((a % 1) * 64, (b % 1) * 64, (c % 1) * 64);
}

const LIGHT_DIR = new THREE.Vector3(...DIRECTIONAL_LIGHT.system.position).normalize();

export function createSurfaceMaterial(appearance: PlanetAppearance): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERTEX,
    fragmentShader: SURFACE_FRAGMENT,
    transparent: appearance.renderStyle === 'holo',
    uniforms: {
      uLightDir: { value: LIGHT_DIR.clone() },
      uColorLow: { value: new THREE.Color(appearance.colorLow) },
      uColorMid: { value: new THREE.Color(appearance.colorMid) },
      uColorHigh: { value: new THREE.Color(appearance.colorHigh) },
      uAtmosphereColor: { value: new THREE.Color(appearance.atmosphereColor) },
      uNightLightColor: { value: new THREE.Color(appearance.nightLightColor) },
      uSeedOffset: { value: seedOffset(appearance.seed) },
      uWaterLevel: { value: appearance.waterLevel },
      uIceCaps: { value: appearance.iceCaps },
      uAtmosphere: { value: appearance.atmosphere },
      uNightLights: { value: appearance.nightLights },
      uRoughness: { value: appearance.roughness },
      uSurface: { value: SURFACE_INDEX[appearance.surface] },
      uHolo: { value: appearance.renderStyle === 'holo' },
    },
  });
}

export function updateSurfaceMaterial(
  material: THREE.ShaderMaterial,
  appearance: PlanetAppearance,
): void {
  const u = material.uniforms;
  u.uColorLow.value.set(appearance.colorLow);
  u.uColorMid.value.set(appearance.colorMid);
  u.uColorHigh.value.set(appearance.colorHigh);
  u.uAtmosphereColor.value.set(appearance.atmosphereColor);
  u.uNightLightColor.value.set(appearance.nightLightColor);
  u.uSeedOffset.value.copy(seedOffset(appearance.seed));
  u.uWaterLevel.value = appearance.waterLevel;
  u.uIceCaps.value = appearance.iceCaps;
  u.uAtmosphere.value = appearance.atmosphere;
  u.uNightLights.value = appearance.nightLights;
  u.uRoughness.value = appearance.roughness;
  u.uSurface.value = SURFACE_INDEX[appearance.surface];

  const holo = appearance.renderStyle === 'holo';
  u.uHolo.value = holo;
  if (material.transparent !== holo) {
    material.transparent = holo;
    material.needsUpdate = true;
  }
}

export function createCloudMaterial(appearance: PlanetAppearance): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: CLOUD_VERTEX,
    fragmentShader: CLOUD_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uLightDir: { value: LIGHT_DIR.clone() },
      uCloudColor: { value: new THREE.Color(appearance.cloudColor) },
      uSeedOffset: { value: seedOffset(appearance.seed + 977) },
      uCoverage: { value: appearance.clouds },
    },
  });
}

export function updateCloudMaterial(
  material: THREE.ShaderMaterial,
  appearance: PlanetAppearance,
): void {
  material.uniforms.uCloudColor.value.set(appearance.cloudColor);
  material.uniforms.uSeedOffset.value.copy(seedOffset(appearance.seed + 977));
  material.uniforms.uCoverage.value = appearance.clouds;
}

/** Radius of the atmosphere shell, as a multiple of the planet radius. */
export const ATMOSPHERE_SHELL = 1.16;

export function createAtmosphereMaterial(appearance: PlanetAppearance): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uLightDir: { value: LIGHT_DIR.clone() },
      uAtmosphereColor: { value: new THREE.Color(appearance.atmosphereColor) },
      uStrength: { value: appearance.atmosphere },
      uShellRatio: { value: 1 / ATMOSPHERE_SHELL },
    },
  });
}

export function updateAtmosphereMaterial(
  material: THREE.ShaderMaterial,
  appearance: PlanetAppearance,
): void {
  material.uniforms.uAtmosphereColor.value.set(appearance.atmosphereColor);
  material.uniforms.uStrength.value = appearance.atmosphere;
}

export const RING_INNER = 1.32;
export const RING_OUTER = 1.92;

export function createRingMaterial(appearance: PlanetAppearance): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: RING_VERTEX,
    fragmentShader: RING_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uRingColor: { value: new THREE.Color(appearance.ringColor) },
      uSeedOffset: { value: seedOffset(appearance.seed + 313) },
      uInner: { value: RING_INNER },
      uOuter: { value: RING_OUTER },
      uOpacity: { value: appearance.rings },
    },
  });
}

export function updateRingMaterial(
  material: THREE.ShaderMaterial,
  appearance: PlanetAppearance,
): void {
  material.uniforms.uRingColor.value.set(appearance.ringColor);
  material.uniforms.uSeedOffset.value.copy(seedOffset(appearance.seed + 313));
  material.uniforms.uOpacity.value = appearance.rings;
}
