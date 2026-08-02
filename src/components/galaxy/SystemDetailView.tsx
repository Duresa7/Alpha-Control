import { useRef, useState, useMemo, Suspense } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { StarSystem, Planet } from '@/types';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { PlanetModel } from '@/components/three/ModelLoader';
import { hasPlanetModel } from '@/utils/planetModels';
import { PLANET_APPEARANCES } from '@/config/planetAppearances';

interface SystemDetailViewProps {
  system: StarSystem;
}

export function SystemDetailView({ system }: SystemDetailViewProps) {
  const showLabels = useGalaxyUIStore((s) => s.showLabels);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const selectedPlanetId = useGalaxySelectionStore((s) => s.selectedPlanetId);
  const planet = system.planets.find((p) => p.id === selectedPlanetId) ?? system.planets[0];

  if (!planet) {
    return null;
  }

  return (
    <group>
      <StaticPlanet
        planet={planet}
        showLabels={showLabels}
        isDetailView={viewMode === 'system' && selectedPlanetId === planet.id}
        customColor={system.customColor}
      />
    </group>
  );
}
interface StaticPlanetProps {
  planet: Planet;
  showLabels: boolean;
  isDetailView: boolean;
  customColor?: string;
}

function StaticPlanet({ planet, showLabels, isDetailView, customColor }: StaticPlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const selectedPlanetId = useGalaxySelectionStore((s) => s.selectedPlanetId);
  const isSelected = selectedPlanetId === planet.id;

  const appearance = PLANET_APPEARANCES[planet.type] || PLANET_APPEARANCES.terrestrial;
  const planetSize = planet.radius * 2.2;
  const planetMaterial = useMemo(() => {
    return {
      color: planet.customColor || customColor || appearance.color,
      roughness: appearance.roughness,
      metalness: appearance.metalness,
    };
  }, [appearance, customColor, planet.customColor]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedPlanet(planet.id);
    setInfoPanelData({
      type: 'planet',
      data: planet,
    });
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  const viewScale = isDetailView ? 1.6 : 1.1;
  const hasGLBModel = hasPlanetModel(planet.id);

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {hasGLBModel ? (
        <Suspense
          fallback={
            <mesh scale={viewScale * planetSize}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial color={planetMaterial.color} />
            </mesh>
          }
        >
          <group scale={viewScale * planetSize}>
            <PlanetModel planetId={planet.id} position={new THREE.Vector3(0, 0, 0)} scale={1} />
          </group>
        </Suspense>
      ) : (
        <>
          <mesh scale={viewScale}>
            <sphereGeometry args={[planetSize, 64, 64]} />
            <meshStandardMaterial
              color={planetMaterial.color}
              roughness={planetMaterial.roughness}
              metalness={planetMaterial.metalness}
            />
          </mesh>
        </>
      )}

      {(hovered || isSelected) && (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={viewScale}>
          <ringGeometry args={[planetSize * 1.2, planetSize * 1.25, 64]} />
          <meshBasicMaterial
            color={isSelected ? '#00FF00' : '#00BFFF'}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {showLabels && (
        <Html
          position={[0, planetSize * viewScale + 1, 0]}
          center
          distanceFactor={10}
          zIndexRange={[0, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="text-center whitespace-nowrap holo-tooltip">
            <div className="text-sm font-medium text-white">{planet.name}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
