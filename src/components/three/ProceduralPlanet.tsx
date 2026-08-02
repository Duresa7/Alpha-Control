import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlanetAppearance } from '@/types';
import {
  ATMOSPHERE_SHELL,
  RING_INNER,
  RING_OUTER,
  createAtmosphereMaterial,
  createCloudMaterial,
  createRingMaterial,
  createSurfaceMaterial,
  updateAtmosphereMaterial,
  updateCloudMaterial,
  updateRingMaterial,
  updateSurfaceMaterial,
} from '@/components/three/proceduralPlanetMaterial';

interface ProceduralPlanetProps {
  appearance: PlanetAppearance;
  radius?: number;
  rotate?: boolean;
}

export function ProceduralPlanet({ appearance, radius = 1, rotate = true }: ProceduralPlanetProps) {
  const surfaceRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const [surfaceMaterial] = useState(() => createSurfaceMaterial(appearance));
  const [cloudMaterial] = useState(() => createCloudMaterial(appearance));
  const [atmosphereMaterial] = useState(() => createAtmosphereMaterial(appearance));
  const [ringMaterial] = useState(() => createRingMaterial(appearance));

  useEffect(() => {
    updateSurfaceMaterial(surfaceMaterial, appearance);
    updateCloudMaterial(cloudMaterial, appearance);
    updateAtmosphereMaterial(atmosphereMaterial, appearance);
    updateRingMaterial(ringMaterial, appearance);
  }, [appearance, surfaceMaterial, cloudMaterial, atmosphereMaterial, ringMaterial]);

  useEffect(
    () => () => {
      surfaceMaterial.dispose();
      cloudMaterial.dispose();
      atmosphereMaterial.dispose();
      ringMaterial.dispose();
    },
    [surfaceMaterial, cloudMaterial, atmosphereMaterial, ringMaterial],
  );

  useFrame((_, delta) => {
    if (!rotate) return;
    if (surfaceRef.current) surfaceRef.current.rotation.y += delta * 0.06;
    // Clouds drift slightly faster than the surface so the deck reads as weather.
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.085;
  });

  const isHolo = appearance.renderStyle === 'holo';
  const showClouds = !isHolo && appearance.clouds > 0;
  const showRings = !isHolo && appearance.rings > 0;
  // The schematic surface is transparent and so writes no depth, which would let
  // the shell's far hemisphere fill the disc. Its own fresnel supplies the rim.
  const showAtmosphere = !isHolo && appearance.atmosphere > 0;

  return (
    <group scale={radius}>
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={surfaceMaterial} attach="material" />
      </mesh>

      {showClouds && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[1.015, 48, 48]} />
          <primitive object={cloudMaterial} attach="material" />
        </mesh>
      )}

      {showAtmosphere && (
        <mesh>
          <sphereGeometry args={[ATMOSPHERE_SHELL, 32, 32]} />
          <primitive object={atmosphereMaterial} attach="material" />
        </mesh>
      )}

      {showRings && (
        <mesh rotation={[-Math.PI / 2 + 0.18, 0, 0.12]}>
          <ringGeometry args={[RING_INNER, RING_OUTER, 128]} />
          <primitive object={ringMaterial} attach="material" />
        </mesh>
      )}
    </group>
  );
}
