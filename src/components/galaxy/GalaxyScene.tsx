import { Suspense, useEffect } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GalaxySkybox } from '@/components/three/ModelLoader';
import { CameraController } from '@/components/three/CameraController';
import { TopDownMarkers } from '@/components/galaxy/TopDownMarker';
import { GalaxyMapBackground } from '@/components/galaxy/GalaxyMapBackground';
import { FleetMarkers } from '@/components/galaxy/FleetMarker';
import { CivilianTrafficLayer } from '@/components/galaxy/CivilianTrafficLayer';
import { SystemDetailView } from '@/components/galaxy/SystemDetailView';
import { FleetDetailView } from '@/components/galaxy/FleetDetailView';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useRole } from '@/hooks/useRole';
import {
  AMBIENT_LIGHT,
  DIRECTIONAL_LIGHT,
  POINT_LIGHTS,
  HEMISPHERE_LIGHT,
  BACKGROUND_COLOR,
} from '@/config/lightingConfig';

function GalaxyContent() {
  const systems = useGalaxyDataStore((s) => s.systems);
  const setIsLoading = useGalaxyDataStore((s) => s.setIsLoading);
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const selectedSystemId = useGalaxySelectionStore((s) => s.selectedSystemId);
  const selectedFleetId = useGalaxySelectionStore((s) => s.selectedFleetId);
  const fleets = useGalaxyDataStore((s) => s.fleets);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [setIsLoading]);
  const selectedSystem = selectedSystemId ? systems.find((s) => s.id === selectedSystemId) : null;
  const selectedFleet = selectedFleetId ? fleets.find((f) => f.id === selectedFleetId) : null;
  const isSystemView = viewMode === 'system';
  const ambientConfig = isSystemView ? AMBIENT_LIGHT.system : AMBIENT_LIGHT.galaxy;
  const hemisphereConfig = isSystemView ? HEMISPHERE_LIGHT.system : HEMISPHERE_LIGHT.galaxy;
  const directionalConfig = isSystemView ? DIRECTIONAL_LIGHT.system : DIRECTIONAL_LIGHT.galaxy;
  const pointLightsConfig = isSystemView ? POINT_LIGHTS.system : POINT_LIGHTS.galaxy;

  return (
    <group>
      <Environment preset="night" background={false} blur={0.5} />
      <hemisphereLight
        args={[hemisphereConfig.skyColor, hemisphereConfig.groundColor, hemisphereConfig.intensity]}
      />
      <ambientLight intensity={ambientConfig.intensity} color={ambientConfig.color} />
      <directionalLight
        position={directionalConfig.position}
        intensity={directionalConfig.intensity}
        color={directionalConfig.color}
        castShadow={directionalConfig.castShadow}
      />
      {pointLightsConfig.map((light) => (
        <pointLight
          key={light.name}
          position={light.position}
          intensity={light.intensity}
          color={light.color}
          distance={light.distance}
          decay={light.decay}
        />
      ))}
      <GalaxySkybox />

      {viewMode === 'topdown' && <TopDownView />}
      {viewMode === 'system' && selectedSystem && (
        <group position={selectedSystem.position}>
          <SystemDetailView system={selectedSystem} />
        </group>
      )}
      {viewMode === 'fleet' && selectedFleet && (
        <group position={selectedFleet.position}>
          <FleetDetailView fleet={selectedFleet} />
        </group>
      )}

      <CameraController />
    </group>
  );
}

function TopDownView() {
  const { isAdmin } = useRole();
  const placementMode = useGalaxyUIStore((s) => s.placementMode);
  const pendingCustomPlanet = useGalaxyUIStore((s) => s.pendingCustomPlanet);
  const addCustomSystem = useGalaxyDataStore((s) => s.addCustomSystem);
  const fleetPlacementMode = useGalaxyUIStore((s) => s.fleetPlacementMode);
  const pendingCustomFleet = useGalaxyUIStore((s) => s.pendingCustomFleet);
  const addCustomFleet = useGalaxyDataStore((s) => s.addCustomFleet);

  const handlePlacementClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isAdmin) return;
    if (!placementMode && !fleetPlacementMode) return;
    e.stopPropagation();
    const point = e.point;

    if (placementMode && pendingCustomPlanet) {
      const uniqueId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      addCustomSystem({
        id: uniqueId,
        name: pendingCustomPlanet.name,
        position: new THREE.Vector3(point.x, 0, point.z),
        faction: pendingCustomPlanet.faction,
        starType: 'white' as const,
        importance: 'minor' as const,
        description: `Custom planet: ${pendingCustomPlanet.name}`,
        region: 'unknown_regions' as const,
        isCustom: true,
        customColor: pendingCustomPlanet.color,
        planets: [
          {
            id: `${uniqueId}-prime`,
            name: pendingCustomPlanet.name,
            type: pendingCustomPlanet.type,
            position: new THREE.Vector3(0, 0, 0),
            radius: 1,
            faction: pendingCustomPlanet.faction,
            description: `Custom planet: ${pendingCustomPlanet.name}`,
            systemId: uniqueId,
            appearance: pendingCustomPlanet.appearance,
          },
        ],
      });
      return;
    }

    if (fleetPlacementMode && pendingCustomFleet) {
      addCustomFleet({
        id: `custom-fleet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: pendingCustomFleet.name,
        position: new THREE.Vector3(point.x, 0, point.z),
        faction: pendingCustomFleet.faction,
        shipCount: pendingCustomFleet.shipCount,
        modelType: pendingCustomFleet.modelType,
        commander: pendingCustomFleet.commander,
        isCustom: true,
        composition: pendingCustomFleet.composition,
      });
    }
  };

  return (
    <>
      <GalaxyMapBackground />
      <CivilianTrafficLayer />
      <FleetMarkers />
      <TopDownMarkers />

      {(placementMode || fleetPlacementMode) && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.1, 0]}
          onClick={handlePlacementClick}
        >
          <planeGeometry args={[500, 500]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
    </>
  );
}

function LoadingFallback() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[2, 0.5, 16, 32]} />
        <meshBasicMaterial color="#00BFFF" wireframe />
      </mesh>
    </group>
  );
}

export function GalaxyScene() {
  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const placementMode = useGalaxyUIStore((s) => s.placementMode);
  const fleetPlacementMode = useGalaxyUIStore((s) => s.fleetPlacementMode);
  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setSelectedFleet = useGalaxySelectionStore((s) => s.setSelectedFleet);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const handlePointerMissed = () => {
    if (placementMode || fleetPlacementMode) return;
    switch (viewMode) {
      case 'system':
        setSelectedSystem(null);
        setInfoPanelData(null);
        break;
      case 'fleet':
        setSelectedFleet(null);
        setInfoPanelData(null);
        break;
      default:
        break;
    }
  };

  return (
    <Canvas
      onPointerMissed={handlePointerMissed}
      camera={{
        position: [0, 60, 100],
        fov: 60,
        near: 0.1,
        far: 2000,
      }}
      gl={{
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      shadows
      style={{
        background: BACKGROUND_COLOR,
      }}
    >
      <color attach="background" args={[BACKGROUND_COLOR]} />

      <Suspense fallback={<LoadingFallback />}>
        <GalaxyContent />
      </Suspense>
    </Canvas>
  );
}
