import { EffectComposer, Bloom } from '@react-three/postprocessing';

/**
 * Bloom for close-up planet views. Mount only where one planet fills the frame;
 * across the map it would bloom every marker for a full extra pass. No
 * ToneMapping on purpose — a filmic curve on top washes every preset out.
 *
 * The wrapper never disposes the composer it builds, so unmounting this leaves
 * its multisampled buffers to the garbage collector. Disposing them from a
 * cleanup here does not work: StrictMode tears effects down and rebuilds them
 * while the wrapper's memo keeps the same composer, so the remounted effect
 * renders through a disposed one and the scene goes black.
 */
export function PlanetEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={1.3}
        luminanceThreshold={1.0}
        luminanceSmoothing={0.1}
        radius={0.6}
        mipmapBlur
      />
    </EffectComposer>
  );
}
