import { useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { Fleet } from '@/types';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useFactionStore } from '@/store/factionStore';
import { ShipModel } from '@/components/three/ModelLoader';

interface FleetDetailViewProps {
  fleet: Fleet;
}

export function FleetDetailView({ fleet }: FleetDetailViewProps) {
  const showLabels = useGalaxyUIStore((s) => s.showLabels);
  const groupRef = useRef<THREE.Group>(null);

  const getFactionMarkerColor = useFactionStore((s) => s.getFactionMarkerColor);
  const shipType = fleet.modelType;
  const factionColor = getFactionMarkerColor(fleet.faction);
  const shipScale = 8;

  return (
    <group ref={groupRef}>
      <Suspense
        fallback={
          <mesh scale={shipScale}>
            <boxGeometry args={[1, 0.5, 2]} />
            <meshStandardMaterial color={factionColor} wireframe />
          </mesh>
        }
      >
        <ShipModel
          type={shipType}
          position={new THREE.Vector3(0, 0, 0)}
          scale={shipScale}
          rotation={[0, Math.PI / 4, 0]}
        />
      </Suspense>

      {[...Array(2)].map((_, i) => (
        <Suspense key={i} fallback={null}>
          <ShipModel
            type={shipType}
            position={new THREE.Vector3(i === 0 ? -12 : 12, i === 0 ? 2 : -2, -10)}
            scale={shipScale * 0.4}
            rotation={[0, Math.PI / 4, 0]}
          />
        </Suspense>
      ))}

      {showLabels && (
        <Html
          position={[0, 8, 0]}
          center
          distanceFactor={15}
          zIndexRange={[0, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            className="text-center whitespace-nowrap holo-tooltip"
            style={{ padding: '12px 16px' }}
          >
            <div className="text-base font-semibold text-white">{fleet.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {fleet.commander || 'Unknown Commander'}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
