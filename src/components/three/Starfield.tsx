import { useCallback, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Stars drawn as shaded points rather than THREE.PointsMaterial sprites.
 * PointsMaterial gives every star the same size and an untextured square;
 * a shader buys per-star size, a round core with a falloff halo, and a
 * twinkle that costs nothing because it runs on the GPU.
 */

const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aTwinkleRate;
  attribute float aIntensity;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uTwinkle;
  uniform float uPixelRatio;
  uniform float uSpikes;
  uniform float uGlow;

  varying vec3 vColor;
  varying float vBrightness;
  varying float vSpike;

  void main() {
    vColor = aColor;

    float wave = sin(uTime * aTwinkleRate + aPhase) * 0.5 + 0.5;
    vBrightness = aIntensity * mix(1.0, 0.55 + 0.45 * wave, uTwinkle);

    // Only the top few percent flare. Any looser and the sky fills with
    // blobs instead of holding a few standouts.
    vSpike = smoothstep(0.93, 1.0, aIntensity) * uSpikes;

    // Screen-space sizing: these stars sit at a fixed distance and should
    // not shrink as the camera dollies across the galactic plane. Flaring
    // stars need a wider quad, since the spikes are drawn inside the point.
    gl_PointSize = aSize * uPixelRatio * (0.85 + 0.15 * vBrightness)
                 * (1.0 + vSpike * 2.0) * (1.0 + uGlow * 0.35);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  uniform float uGlow;

  varying vec3 vColor;
  varying float vBrightness;
  varying float vSpike;

  void main() {
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float d = length(p);
    if (d > 1.0 && vSpike <= 0.0) discard;

    // A tight core plus a wide, weak halo is what separates a star from a dot.
    // The core stays near-solid so small stars keep the punch a flat sprite had.
    // Widening and strengthening the halo buys the look of a bloom pass without
    // a composer, which would otherwise re-grade the entire map along with it.
    float core = smoothstep(1.0, 0.0, smoothstep(0.0, 0.55, d));
    float halo = pow(max(0.0, 1.0 - d), mix(2.0, 1.5, uGlow));
    float alpha = (core + halo * mix(0.45, 0.75, uGlow)) * vBrightness;

    if (vSpike > 0.0) {
      // Two crossed streaks, the way a camera renders a bright point source.
      // The along-axis falloff has to stay shallow or the halo swallows the
      // ray before it clears the core and nothing reads as a flare.
      float ax = abs(p.x);
      float ay = abs(p.y);
      float h = pow(max(0.0, 1.0 - ax), 1.6) * pow(max(0.0, 1.0 - ay * 5.0), 2.0);
      float v = pow(max(0.0, 1.0 - ay), 1.6) * pow(max(0.0, 1.0 - ax * 5.0), 2.0);
      alpha += (h + v) * vSpike * vBrightness * 0.8;
    }

    alpha *= uOpacity;
    if (alpha < 0.002) discard;

    // Hot centre, colour toward the edge, the way a real point source blooms.
    vec3 rgb = mix(vColor, vec3(1.0), core * 0.55);
    gl_FragColor = vec4(rgb, clamp(alpha, 0.0, 1.0));
  }
`;

/** Cool white dominates; warm and blue stars are the accents that sell it. */
const STAR_COLORS: [string, number][] = [
  ['#f8f7ff', 0.34],
  ['#cad7ff', 0.22],
  ['#ffffff', 0.16],
  ['#aabfff', 0.10],
  ['#fff4ea', 0.09],
  ['#ffd2a1', 0.06],
  ['#9bb0ff', 0.02],
  ['#ffcc6f', 0.01],
];

function pickColor(): THREE.Color {
  let roll = Math.random();
  for (const [hex, weight] of STAR_COLORS) {
    roll -= weight;
    if (roll <= 0) return new THREE.Color(hex);
  }
  return new THREE.Color(STAR_COLORS[0][0]);
}

export interface StarfieldProps {
  count: number;
  /** `shell` wraps the camera for sky; `disc` fills the galactic plane. */
  shape: 'shell' | 'disc';
  innerRadius: number;
  outerRadius: number;
  /** Vertical spread for `disc`. */
  thickness?: number;
  /** Point size in CSS pixels, before the per-star curve. */
  sizeRange?: [number, number];
  opacity?: number;
  /** 0 disables twinkling entirely. */
  twinkle?: number;
  /** Peak angle of the slow left-to-right sway, in radians. 0 holds it still. */
  sway?: number;
  /** Cycles per second for that sway. */
  swaySpeed?: number;
  /** 0 disables diffraction spikes; 1 gives the brightest stars full flares. */
  spikes?: number;
  /** Widens each star's halo to imitate a bloom pass, without postprocessing. */
  glow?: number;
  ref?: React.Ref<THREE.Points>;
}

export function Starfield({
  count,
  shape,
  innerRadius,
  outerRadius,
  thickness = 6,
  sizeRange = [1.8, 6.5],
  opacity = 1,
  twinkle = 1,
  sway = 0,
  swaySpeed = 0.05,
  spikes = 0,
  glow = 0,
  ref,
}: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [minSize, maxSize] = sizeRange;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const rates = new Float32Array(count);
    const intensities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      if (shape === 'shell') {
        const r = innerRadius + Math.random() * (outerRadius - innerRadius);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      } else {
        // sqrt keeps the disc evenly covered instead of clumping at the core.
        const r = innerRadius + Math.sqrt(Math.random()) * (outerRadius - innerRadius);
        const theta = Math.random() * Math.PI * 2;
        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = Math.sin(theta) * r;
        positions[i * 3 + 2] = (Math.random() - 0.5) * thickness;
      }

      const color = pickColor();
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // A steep curve on both size and brightness: a real sky is mostly faint
      // pinpricks with a scattering of bright ones, which is what stops the
      // field reading as uniform noise.
      const magnitude = Math.pow(Math.random(), 2.4);
      sizes[i] = minSize + magnitude * (maxSize - minSize);
      intensities[i] = 0.22 + magnitude * 0.78;
      phases[i] = Math.random() * Math.PI * 2;
      rates[i] = 0.4 + Math.random() * 1.6;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aTwinkleRate', new THREE.BufferAttribute(rates, 1));
    geo.setAttribute('aIntensity', new THREE.BufferAttribute(intensities, 1));
    return geo;
    // sizeRange is spread into its two numbers: an inline array literal would
    // be a new identity every render and rebuild the whole field each time.
  }, [count, shape, innerRadius, outerRadius, thickness, minSize, maxSize]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uTwinkle: { value: twinkle },
          uOpacity: { value: opacity },
          uSpikes: { value: spikes },
          uGlow: { value: glow },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [twinkle, opacity, spikes, glow],
  );

  const attachRef = useCallback(
    (node: THREE.Points | null) => {
      pointsRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (sway && pointsRef.current) {
      // Drifts left and right rather than turning: a continuous spin reads as
      // the map itself moving, which fights the camera the user is driving.
      pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * swaySpeed) * sway;
    }
  });

  return (
    <points ref={attachRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}
