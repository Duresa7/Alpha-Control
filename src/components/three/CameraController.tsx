import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { shouldRecenterTopdown } from '@/components/three/cameraTransition';

/** Duration (ms) for camera transition and reset animations */
const ANIMATION_DURATION_MS = 1500;

/** Interpolation factor per frame for camera lerp (lower = smoother/slower) */
const LERP_FACTOR = 0.03;

/** Near-zero polar angle used to lock top-down view to vertical */
const TOPDOWN_POLAR_LOCK = 0.001;

/** How much each +/- button click zooms (multiplied by current distance) */
const BUTTON_ZOOM_STEP = 0.15;

const CAMERA_CONFIG = {
  topdown: {
    distance: 100,
    height: 70,
    minDistance: 20,
    maxDistance: 250,
    panSpeed: 1.5,
    rotateSpeed: 0,
    enableRotate: false,
  },
  system: {
    distance: 20,
    height: 10,
    minDistance: 3,
    maxDistance: 80,
    panSpeed: 0.5,
    rotateSpeed: 0.5,
    enableRotate: true,
  },
  fleet: {
    distance: 12,
    height: 4,
    minDistance: 3,
    maxDistance: 40,
    panSpeed: 0.5,
    rotateSpeed: 0.5,
    enableRotate: true,
  },
};

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const viewMode = useGalaxySelectionStore((s) => s.viewMode);
  const selectedSystemId = useGalaxySelectionStore((s) => s.selectedSystemId);
  const selectedPlanetId = useGalaxySelectionStore((s) => s.selectedPlanetId);
  const selectedFleetId = useGalaxySelectionStore((s) => s.selectedFleetId);
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);
  const draggingCustomPlanet = useGalaxyUIStore((s) => s.draggingCustomPlanet);
  const draggingCustomFleet = useGalaxyUIStore((s) => s.draggingCustomFleet);
  const previousViewModeRef = useRef<'topdown' | 'system' | 'fleet' | null>(null);
  const targetPosition = useRef(new THREE.Vector3(0, 60, 120));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isAnimating = useRef(false);
  const animationEndTime = useRef<number | null>(null);

  useEffect(() => {
    const config = CAMERA_CONFIG[viewMode] || CAMERA_CONFIG.system;
    const previousViewMode = previousViewModeRef.current;
    previousViewModeRef.current = viewMode;
    const shouldRecenter = shouldRecenterTopdown(viewMode, previousViewMode);
    if (!shouldRecenter && viewMode === 'topdown') {
      isAnimating.current = false;
      return;
    }

    isAnimating.current = true;
    animationEndTime.current = performance.now() + ANIMATION_DURATION_MS;

    if (viewMode === 'topdown') {
      targetPosition.current.set(0, config.height, 0);
      targetLookAt.current.set(0, 0, 0);
    } else if (viewMode === 'system' && selectedSystemId) {
      const system = systems.find((s) => s.id === selectedSystemId);
      if (system) {
        targetLookAt.current.copy(system.position);
        targetPosition.current.set(
          system.position.x + config.distance * 0.5,
          system.position.y + config.height,
          system.position.z + config.distance,
        );
      }
    } else if (viewMode === 'fleet' && selectedFleetId) {
      const fleet = fleets.find((f) => f.id === selectedFleetId);
      if (fleet) {
        targetLookAt.current.copy(fleet.position);
        targetPosition.current.set(
          fleet.position.x + config.distance * 0.5,
          fleet.position.y + config.height,
          fleet.position.z + config.distance,
        );
      }
    }
    if (controlsRef.current) {
      controlsRef.current.minDistance = config.minDistance;
      controlsRef.current.maxDistance = config.maxDistance;
      controlsRef.current.enableRotate = config.enableRotate;
      controlsRef.current.rotateSpeed = config.rotateSpeed;
      if (viewMode === 'topdown') {
        controlsRef.current.minPolarAngle = 0;
        controlsRef.current.maxPolarAngle = TOPDOWN_POLAR_LOCK;
      } else {
        controlsRef.current.minPolarAngle = 0;
        controlsRef.current.maxPolarAngle = Math.PI;
      }
    }
  }, [viewMode, selectedSystemId, selectedPlanetId, selectedFleetId, systems, fleets]);

  useFrame(() => {
    if (controlsRef.current) {
      const store = useGalaxySelectionStore.getState();
      if (store.resetCameraFlag && viewMode === 'topdown' && !isAnimating.current) {
        store.clearResetCameraFlag();
        targetPosition.current.set(0, CAMERA_CONFIG.topdown.height, 0);
        targetLookAt.current.set(0, 0, 0);
        isAnimating.current = true;
        animationEndTime.current = performance.now() + ANIMATION_DURATION_MS;
      }

      if (store.zoomDelta !== 0 && !isAnimating.current) {
        const delta = store.zoomDelta;
        store.clearZoomDelta();
        const direction = new THREE.Vector3()
          .subVectors(camera.position, controlsRef.current.target)
          .normalize();
        const currentDist = camera.position.distanceTo(controlsRef.current.target);
        const config = CAMERA_CONFIG[viewMode] || CAMERA_CONFIG.system;
        const step = currentDist * BUTTON_ZOOM_STEP * delta;
        const newDist = THREE.MathUtils.clamp(
          currentDist + step,
          config.minDistance,
          config.maxDistance,
        );
        camera.position.copy(controlsRef.current.target).addScaledVector(direction, newDist);
      }

      if (isAnimating.current) {
        controlsRef.current.target.lerp(targetLookAt.current, LERP_FACTOR);
        camera.position.lerp(targetPosition.current, LERP_FACTOR);

        if (animationEndTime.current !== null && performance.now() >= animationEndTime.current) {
          isAnimating.current = false;
          animationEndTime.current = null;
          camera.position.copy(targetPosition.current);
          controlsRef.current.target.copy(targetLookAt.current);
        }
      }

      controlsRef.current.update();
    }
  });

  const config = CAMERA_CONFIG[viewMode] || CAMERA_CONFIG.system;

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={config.minDistance}
      maxDistance={config.maxDistance}
      enablePan={!draggingCustomPlanet && !draggingCustomFleet}
      panSpeed={config.panSpeed}
      screenSpacePanning={true}
      enableZoom
      enableRotate={viewMode !== 'topdown'}
      rotateSpeed={viewMode === 'topdown' ? 0 : config.rotateSpeed}
      zoomSpeed={0.9}
      minPolarAngle={0}
      maxPolarAngle={viewMode === 'topdown' ? TOPDOWN_POLAR_LOCK : Math.PI}
      minAzimuthAngle={viewMode === 'topdown' ? 0 : -Infinity}
      maxAzimuthAngle={viewMode === 'topdown' ? 0 : Infinity}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: viewMode === 'topdown' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      }}
    />
  );
}
