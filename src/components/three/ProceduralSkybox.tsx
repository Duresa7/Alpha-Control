import { Nebula } from '@/components/three/Nebula';
import { Starfield } from '@/components/three/Starfield';

/**
 * The sky behind the map: a nebula band, then three shells of stars.
 * Each shell sways a different amount, which is what sells the depth —
 * the near layer swings visibly further than the far one.
 */
export function ProceduralSkybox() {
  return (
    <>
      <Nebula />

      <Starfield
        count={4500}
        shape="shell"
        innerRadius={1300}
        outerRadius={1500}
        sizeRange={[1.3, 3.6]}
        opacity={0.7}
        glow={0.7}
        sway={0.03}
        swaySpeed={0.035}
      />
      <Starfield
        count={3000}
        shape="shell"
        innerRadius={1000}
        outerRadius={1280}
        sizeRange={[1.8, 5.5]}
        opacity={0.9}
        glow={0.7}
        sway={0.055}
        swaySpeed={0.05}
      />
      <Starfield
        count={1500}
        shape="shell"
        innerRadius={700}
        outerRadius={960}
        sizeRange={[2.4, 8.5]}
        glow={0.7}
        spikes={1}
        sway={0.09}
        swaySpeed={0.07}
      />
    </>
  );
}
