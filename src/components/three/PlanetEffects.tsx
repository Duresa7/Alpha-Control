import { EffectComposer, Bloom } from '@react-three/postprocessing';

/**
 * Bloom for close-up planet views.
 *
 * The composer renders to a half-float buffer, so the planet shader's additive
 * highlights — atmosphere rim, specular, city lights, lava — keep their values
 * above 1.0 while the lit surface stays below it. Thresholding just above 1
 * therefore catches only those highlights and leaves the planet body sharp.
 *
 * No ToneMapping effect on purpose: the planet shader linearises its own output
 * so the composer's sRGB encoding lands exactly on the tuned look. Adding a
 * filmic curve on top lifts the midtones and washes every preset out.
 *
 * Mount this only where a single planet fills the frame. Across the top-down
 * map it would bloom every system marker and cost a full pass on the heaviest
 * scene in the app.
 */
export function PlanetEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={1.3}
        luminanceThreshold={1.05}
        luminanceSmoothing={0.1}
        radius={0.6}
        mipmapBlur
      />
    </EffectComposer>
  );
}
