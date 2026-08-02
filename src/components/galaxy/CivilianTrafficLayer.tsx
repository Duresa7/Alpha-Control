import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import {
  DEFAULT_CIVILIAN_TRAFFIC_SETTINGS,
  appendTrailPoint,
  advanceShipProgress,
  calculateDensityPlan,
  createCivilianRoute,
  sampleQuadraticBezier,
  selectRouteEndpoints,
  tangentQuadraticBezier,
  type CivilianRoute,
  type RouteAnchor,
} from '@/utils/civilianTraffic';

const CIVILIAN_FREIGHTER_PATH = '/models/ships/civilian_freighter.glb';
const CIVILIAN_CORVETTE_PATH = '/models/ships/civilian_corvette.glb';
const CIVILIAN_TRANSPORT_PATH = '/models/ships/civilian_transport.glb';

const SHIP_VARIANTS = [
  { path: CIVILIAN_FREIGHTER_PATH, scale: 0.65 },
  { path: CIVILIAN_CORVETTE_PATH, scale: 0.5 },
  { path: CIVILIAN_TRANSPORT_PATH, scale: 0.45 },
];

interface RuntimeTrafficShip {
  id: string;
  route: CivilianRoute;
  modelPath: string;
  modelScale: number;
}

interface CivilianTrafficShipProps {
  ship: RuntimeTrafficShip;
  trailLength: number;
  onComplete: (shipId: string) => void;
}

const SHIP_ALTITUDE = 0.35;
const TRAIL_ALTITUDE = 0.2;
const TRAIL_POINT_SPACING = 1.2;
const TRAIL_POINT_RADIUS = 0.16;
const TRAIL_POINT_SEGMENTS = 8;

function CivilianTrafficShip({ ship, trailLength, onComplete }: CivilianTrafficShipProps) {
  const shipRef = useRef<THREE.Group>(null);
  const trailRefs = useRef<Array<THREE.Mesh | null>>([]);
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const trailPointsRef = useRef<THREE.Vector3[]>([]);
  const lastTrailPointRef = useRef<THREE.Vector3 | null>(null);
  const positionScratchRef = useRef(new THREE.Vector3());
  const tangentScratchRef = useRef(new THREE.Vector3());
  const trailScratchRef = useRef(new THREE.Vector3());

  const { scene } = useGLTF(ship.modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const trailGeometry = useMemo(
    () => new THREE.CircleGeometry(TRAIL_POINT_RADIUS, TRAIL_POINT_SEGMENTS),
    [],
  );

  useEffect(() => {
    return () => {
      trailGeometry.dispose();
    };
  }, [trailGeometry]);

  useFrame((_, delta) => {
    if (completedRef.current) return;

    const progress = advanceShipProgress(
      progressRef.current,
      delta,
      ship.route.speed,
      ship.route.distance,
    );
    progressRef.current = progress;

    const position = sampleQuadraticBezier(
      ship.route.start,
      ship.route.control,
      ship.route.end,
      progress,
      positionScratchRef.current,
    );
    position.y = SHIP_ALTITUDE;

    if (shipRef.current) {
      shipRef.current.position.copy(position);

      const tangent = tangentQuadraticBezier(
        ship.route.start,
        ship.route.control,
        ship.route.end,
        progress,
        tangentScratchRef.current,
      );
      const heading = Math.atan2(tangent.x, tangent.z) + Math.PI;
      shipRef.current.rotation.set(0, heading, 0);
    }

    const trailPoint = trailScratchRef.current.copy(position);
    trailPoint.y = TRAIL_ALTITUDE;
    const lastTrailPoint = lastTrailPointRef.current;
    if (
      !lastTrailPoint ||
      lastTrailPoint.distanceToSquared(trailPoint) >= TRAIL_POINT_SPACING * TRAIL_POINT_SPACING
    ) {
      trailPointsRef.current = appendTrailPoint(trailPointsRef.current, trailPoint, trailLength);
      lastTrailPointRef.current = trailPoint.clone();
    } else {
      lastTrailPoint.copy(trailPoint);
      const trail = trailPointsRef.current;
      if (trail.length > 0) {
        trail[trail.length - 1].copy(trailPoint);
      } else {
        trailPointsRef.current = appendTrailPoint([], trailPoint, trailLength);
      }
    }

    const trail = trailPointsRef.current;
    for (let i = 0; i < trailRefs.current.length; i++) {
      const mesh = trailRefs.current[i];
      if (!mesh) continue;

      const sourceIndex = trail.length - 1 - i;
      const sourcePoint = sourceIndex >= 0 ? trail[sourceIndex] : null;
      if (!sourcePoint) {
        mesh.visible = false;
        continue;
      }

      mesh.visible = true;
      mesh.position.copy(sourcePoint);
      const strength = 1 - i / trailLength;
      mesh.scale.setScalar(0.6 + strength * 0.8);
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.04 + strength * 0.32;
    }

    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete(ship.id);
    }
  });

  return (
    <group>
      <group ref={shipRef} scale={ship.modelScale}>
        <primitive object={clonedScene} />
      </group>

      {Array.from({ length: trailLength }).map((_, index) => (
        <mesh
          key={`${ship.id}-trail-${index}`}
          ref={(node) => {
            trailRefs.current[index] = node;
          }}
          geometry={trailGeometry}
          rotation={[Math.PI / 2, 0, 0]}
          visible={false}
        >
          <meshBasicMaterial
            color="#7CC9FF"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload(CIVILIAN_FREIGHTER_PATH);
useGLTF.preload(CIVILIAN_CORVETTE_PATH);
useGLTF.preload(CIVILIAN_TRANSPORT_PATH);

export function CivilianTrafficLayer() {
  const showCivilianTraffic = useGalaxyUIStore((s) => s.showCivilianTraffic);
  const allSystems = useGalaxyDataStore((s) => s.systems);
  const searchQuery = useGalaxyUIStore((s) => s.searchQuery);
  const factionFilters = useGalaxyUIStore((s) => s.factionFilters);

  const filteredSystems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allSystems.filter((system) => {
      if (factionFilters[system.faction] === false) return false;
      if (!query) return true;

      const matchesName = system.name.toLowerCase().includes(query);
      const matchesRegion = system.region.replace('_', ' ').toLowerCase().includes(query);
      const matchesPlanets = system.planets.some((planet) =>
        planet.name.toLowerCase().includes(query),
      );
      return matchesName || matchesRegion || matchesPlanets;
    });
  }, [allSystems, factionFilters, searchQuery]);
  const routeAnchors = useMemo<readonly RouteAnchor[]>(
    () => (filteredSystems.length >= 2 ? filteredSystems : allSystems),
    [allSystems, filteredSystems],
  );

  const [ships, setShips] = useState<RuntimeTrafficShip[]>([]);
  const nextShipIdRef = useRef(0);

  const createTrafficShip = useCallback((): RuntimeTrafficShip | null => {
    const selection = selectRouteEndpoints(
      routeAnchors,
      DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.minSystemDistance,
    );
    if (!selection) return null;

    const route = createCivilianRoute(selection.origin, selection.destination, {
      minCurvature: DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.minCurvature,
      maxCurvature: DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.maxCurvature,
      minDurationSec: DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.minDurationSec,
      maxDurationSec: DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.maxDurationSec,
    });

    const variant = SHIP_VARIANTS[Math.floor(Math.random() * SHIP_VARIANTS.length)];

    return {
      id: `civilian-traffic-${nextShipIdRef.current++}`,
      route,
      modelPath: variant.path,
      modelScale: variant.scale,
    };
  }, [routeAnchors]);

  const rebalanceShips = useCallback(
    (current: RuntimeTrafficShip[]): RuntimeTrafficShip[] => {
      if (!showCivilianTraffic || routeAnchors.length < 2) return [];

      let nextShips = current;
      if (nextShips.length > DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.maxConcurrent) {
        nextShips = nextShips.slice(
          nextShips.length - DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.maxConcurrent,
        );
      }

      const { spawnCount, trimCount } = calculateDensityPlan(
        nextShips.length,
        DEFAULT_CIVILIAN_TRAFFIC_SETTINGS,
      );

      if (trimCount > 0) {
        nextShips = nextShips.slice(trimCount);
      }

      if (spawnCount <= 0) return nextShips;

      const additions: RuntimeTrafficShip[] = [];
      for (let i = 0; i < spawnCount; i++) {
        const ship = createTrafficShip();
        if (!ship) break;
        additions.push(ship);
      }

      if (additions.length === 0) return nextShips;
      return [...nextShips, ...additions];
    },
    [createTrafficShip, routeAnchors.length, showCivilianTraffic],
  );

  useEffect(() => {
    setShips((current) => rebalanceShips(current));
  }, [rebalanceShips]);

  const handleShipComplete = useCallback(
    (shipId: string) => {
      setShips((current) => {
        const remaining = current.filter((ship) => ship.id !== shipId);
        return rebalanceShips(remaining);
      });
    },
    [rebalanceShips],
  );

  if (!showCivilianTraffic || routeAnchors.length < 2 || ships.length === 0) {
    return null;
  }

  return (
    <group>
      {ships.map((ship) => (
        <CivilianTrafficShip
          key={ship.id}
          ship={ship}
          trailLength={DEFAULT_CIVILIAN_TRAFFIC_SETTINGS.trailLength}
          onComplete={handleShipComplete}
        />
      ))}
    </group>
  );
}
