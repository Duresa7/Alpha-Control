import { useEffect, useRef } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { EffectComposer as EffectComposerImpl } from 'postprocessing';

/**
 * Bloom for close-up planet views. Mount only where one planet fills the frame;
 * across the map it would bloom every marker for a full extra pass.
 *
 * The half-float buffer keeps the shader's additive highlights above 1.0 while
 * the lit surface stays below, so a threshold just over 1 catches only those.
 * No ToneMapping on purpose — a filmic curve on top washes every preset out.
 */
export function PlanetEffects() {
  const composer = useRef<EffectComposerImpl>(null);

  // The wrapper never disposes the composer it builds, so leaving system view
  // would abandon its multisampled buffers — hundreds of megabytes per trip
  // between the map and a planet.
  useEffect(() => {
    const instance = composer.current;
    return () => instance?.dispose();
  }, []);

  return (
    <EffectComposer ref={composer} multisampling={4}>
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
