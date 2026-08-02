import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ProceduralSkybox } from './ProceduralSkybox';
import type { ShipModelType } from '@/types';
import { getPlanetModelPath } from '@/utils/planetModels';

const MODEL_PATHS = {
  sithDreadnought: '/models/ships/sith_dreadnought.glb',
  republicFrigate: '/models/ships/republic_frigate.glb',
  republicValor: '/models/ships/valor_class_cruiser.glb',
  sithTerminus: '/models/ships/terminus_destroyer.glb',
  civilianFreighter: '/models/ships/civilian_freighter.glb',
  civilianCorvette: '/models/ships/civilian_corvette.glb',
  civilianTransport: '/models/ships/civilian_transport.glb',
};

interface ShipModelProps {
  type: ShipModelType;
  position: THREE.Vector3;
  scale?: number;
  rotation?: [number, number, number];
}

export function ShipModel({ type, position, scale = 0.5, rotation = [0, 0, 0] }: ShipModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelPath = useMemo(() => {
    switch (type) {
      case 'sith':
        return MODEL_PATHS.sithDreadnought;
      case 'valor':
        return MODEL_PATHS.republicValor;
      case 'terminus':
        return MODEL_PATHS.sithTerminus;
      case 'republic':
      default:
        return MODEL_PATHS.republicFrigate;
    }
  }, [type]);

  const { scene } = useGLTF(modelPath);

  const clonedScene = useMemo(() => scene.clone(), [scene]);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

interface PlanetModelProps {
  planetId: string;
  position: THREE.Vector3;
  scale?: number;
  rotation?: [number, number, number];
}

export function PlanetModel({
  planetId,
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: PlanetModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const modelPath = getPlanetModelPath(planetId);
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload(MODEL_PATHS.sithDreadnought);
useGLTF.preload(MODEL_PATHS.republicFrigate);
useGLTF.preload(MODEL_PATHS.republicValor);
useGLTF.preload(MODEL_PATHS.sithTerminus);

useGLTF.preload(MODEL_PATHS.civilianFreighter);
useGLTF.preload(MODEL_PATHS.civilianCorvette);
useGLTF.preload(MODEL_PATHS.civilianTransport);

export function GalaxySkybox() {
  return <ProceduralSkybox />;
}
