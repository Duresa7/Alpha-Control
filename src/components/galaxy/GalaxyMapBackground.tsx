import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Starfield } from '@/components/three/Starfield';
import { SpiralGalaxy } from '@/components/three/SpiralGalaxy';
function ProceduralGalaxyMap() {
  const galaxyRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (galaxyRef.current) {
      galaxyRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.02) * 0.01;
    }
  });

  return (
    <group ref={galaxyRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
      <SpiralGalaxy
        radius={GALAXY_RADIUS}
        arms={4}
        twist={1.9}
        dust={0.9}
        brightness={0.85}
        coreColor="#dceefc"
        innerColor="#7fb6cf"
        midColor="#2d5f7a"
        outerColor="#0c1e2e"
      />

      <StarField />

      <GridOverlay />
    </group>
  );
}
/**
 * Sized so the arms stay bright out past the furthest system, which sits at
 * roughly 146 units. Systems keep their own coordinates either way.
 */
const GALAXY_RADIUS = 220;
function StarField() {
  return (
    <group position={[0, 0, 0.1]}>
      <Starfield
        count={4000}
        shape="disc"
        innerRadius={0}
        outerRadius={250}
        thickness={5}
        sizeRange={[1.6, 5.5]}
        opacity={0.9}
        glow={0.7}
      />
    </group>
  );
}
function GridOverlay() {
  const gridSpacing = 10;
  const gridRange = 20;
  const lineObjects = useMemo(() => {
    const objects: THREE.Line[] = [];
    for (let x = -gridRange; x <= gridRange; x++) {
      const points = [
        new THREE.Vector3(x * gridSpacing, -gridRange * gridSpacing, 0),
        new THREE.Vector3(x * gridSpacing, gridRange * gridSpacing, 0),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: x === 0 ? '#00FFFF' : '#00BFFF',
        transparent: true,
        opacity: x === 0 ? 0.3 : 0.08,
      });
      objects.push(new THREE.Line(geometry, material));
    }
    for (let y = -gridRange; y <= gridRange; y++) {
      const points = [
        new THREE.Vector3(-gridRange * gridSpacing, y * gridSpacing, 0),
        new THREE.Vector3(gridRange * gridSpacing, y * gridSpacing, 0),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: y === 0 ? '#00FFFF' : '#00BFFF',
        transparent: true,
        opacity: y === 0 ? 0.3 : 0.08,
      });
      objects.push(new THREE.Line(geometry, material));
    }

    return objects;
  }, []);

  return (
    <group position={[0, 0, 0.2]}>
      {lineObjects.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}
export function GalaxyMapBackground() {
  return <ProceduralGalaxyMap />;
}
