import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A soft cloud band on the inside of a sphere, sitting behind the starfield.
 * Gives the empty sky some colour and depth so it does not read as flat black
 * with dots on it.
 */

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vDir;

  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec3 vDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), u.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), u.x), u.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), u.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), u.x), u.y),
      u.z);
  }

  // Normalised to 0..1 — the raw octave sum only reaches ~0.97 and averages
  // ~0.48, which makes any threshold above that clip the whole cloud away.
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    float total = 0.0;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      total += a;
      p *= 2.03;
      a *= 0.5;
    }
    return v / total;
  }

  void main() {
    vec3 d = normalize(vDir);
    float drift = uTime * 0.004;
    float base = fbm(d * 2.1 + drift);
    float detail = fbm(d * 5.4 - drift * 0.6);

    // fbm clusters tightly around 0.5, so the window has to be narrow or the
    // cloud comes out as flat haze with no shape to it.
    float n = base * 0.65 + detail * 0.35;
    float density = pow(smoothstep(0.34, 0.62, n), 1.3);

    // Concentrate it into a band, so it reads as a galactic plane and not fog.
    float band = 1.0 - smoothstep(0.05, 0.6, abs(d.y));
    density *= mix(0.08, 1.0, band);

    vec3 rgb = mix(uColorA, uColorB, detail);
    gl_FragColor = vec4(rgb, density * uOpacity);
  }
`;

export interface NebulaProps {
  /** Sits outside the starfield but inside the camera's far plane. */
  radius?: number;
  opacity?: number;
  colorA?: string;
  colorB?: string;
}

export function Nebula({
  radius = 1600,
  opacity = 0.45,
  colorA = '#2a4d8f',
  colorB = '#6b2f7a',
}: NebulaProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: opacity },
          uColorA: { value: new THREE.Color(colorA) },
          uColorB: { value: new THREE.Color(colorB) },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [opacity, colorA, colorB],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[radius, 32, 32]} />
    </mesh>
  );
}
