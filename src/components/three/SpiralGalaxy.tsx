import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * The galactic disc, drawn as a shaded plane rather than stacked circles.
 * Flat rings can only ever read as rings; a logarithmic spiral with dust
 * lanes and a noise break-up is what makes it look like a galaxy.
 */

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vPos;

  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uRadius;
  uniform float uArms;
  uniform float uTwist;
  uniform float uDust;
  uniform float uBrightness;
  uniform float uOpacity;
  uniform vec3 uCoreColor;
  uniform vec3 uInnerColor;
  uniform vec3 uMidColor;
  uniform vec3 uOuterColor;

  varying vec2 vPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    float total = 0.0;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      total += a;
      p *= 2.07;
      a *= 0.5;
    }
    return v / total;
  }

  void main() {
    float r = length(vPos) / uRadius;
    if (r > 1.0) discard;

    float ang = atan(vPos.y, vPos.x);

    // A logarithmic spiral: the arm angle advances with log(radius), which is
    // what holds a constant pitch instead of winding into a coil at the centre.
    float phase = ang * uArms - uTwist * log(max(r, 0.004)) * uArms;

    float arm = pow(0.5 + 0.5 * cos(phase), 2.0);
    // A tighter second set of spurs branching off the main arms — real
    // galaxies are never just N clean sweeps.
    float spur = pow(0.5 + 0.5 * cos(phase * 2.0 + 1.3), 3.0) * 0.45;
    arm = max(arm, spur);

    // Perfect arms read as a logo. Three noise scales — clumps, filaments,
    // grain — are what turn them into structure.
    arm *= 0.35 + 1.2 * fbm(vPos * 0.02);
    arm *= 0.55 + 0.9 * fbm(vPos * 0.075);
    arm *= 0.70 + 0.6 * fbm(vPos * 0.22);

    // Star-forming knots: rare bright spots strung along the arms.
    float knot = pow(fbm(vPos * 0.3 + 11.0), 6.0) * arm * smoothstep(0.08, 0.25, r);

    // Three separate falloffs: a tight white core, a broad central glow, and
    // the disc itself. One curve cannot be both a bulge and a spiral.
    float bulge = exp(-r * r * 90.0);
    float innerGlow = exp(-r * r * 9.0);
    float disc = exp(-r * 1.25);
    float density = disc * (0.09 + 1.25 * arm + knot * 3.0)
                  + innerGlow * 0.40
                  + bulge * 1.15;

    // Dust lanes ride just inside each arm — the dark edge of the sweep.
    float lane = pow(0.5 + 0.5 * cos(phase + 0.8), 3.0);
    lane *= smoothstep(0.04, 0.22, r) * smoothstep(1.0, 0.45, r);
    density *= 1.0 - uDust * lane * 0.8;

    // Fade the rim out rather than ending on a hard circle.
    density *= smoothstep(1.0, 0.62, r);

    vec3 col = mix(uInnerColor, uMidColor, smoothstep(0.03, 0.38, r));
    col = mix(col, uOuterColor, smoothstep(0.32, 0.9, r));
    col = mix(col, uCoreColor, clamp(bulge * 1.2 + knot * 2.0, 0.0, 1.0));

    gl_FragColor = vec4(col, clamp(density * uBrightness, 0.0, 1.0) * uOpacity);
  }
`;

export interface SpiralGalaxyProps {
  radius?: number;
  /** Number of spiral arms. */
  arms?: number;
  /** How tightly the arms wind. Higher is more coiled. */
  twist?: number;
  /** Strength of the dark lanes between arms. */
  dust?: number;
  brightness?: number;
  opacity?: number;
  coreColor?: string;
  innerColor?: string;
  midColor?: string;
  outerColor?: string;
}

export function SpiralGalaxy({
  radius = 260,
  arms = 4,
  twist = 1.9,
  dust = 0.8,
  brightness = 1,
  opacity = 1,
  coreColor = '#ffffff',
  innerColor = '#bfe8ff',
  midColor = '#3f7fd8',
  outerColor = '#3a1f7a',
}: SpiralGalaxyProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uRadius: { value: radius },
          uArms: { value: arms },
          uTwist: { value: twist },
          uDust: { value: dust },
          uBrightness: { value: brightness },
          uOpacity: { value: opacity },
          uCoreColor: { value: new THREE.Color(coreColor) },
          uInnerColor: { value: new THREE.Color(innerColor) },
          uMidColor: { value: new THREE.Color(midColor) },
          uOuterColor: { value: new THREE.Color(outerColor) },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    [radius, arms, twist, dust, brightness, opacity, coreColor, innerColor, midColor, outerColor],
  );

  return (
    <mesh material={material} frustumCulled={false}>
      <circleGeometry args={[radius, 128]} />
    </mesh>
  );
}
