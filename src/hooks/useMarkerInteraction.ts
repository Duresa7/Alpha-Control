import { useEffect, useRef } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRole } from '@/hooks/useRole';
import { DRAG_THRESHOLD_PX, SINGLE_CLICK_DELAY_MS } from '@/config/topDownMarkerConfig';

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _intersection = new THREE.Vector3();
const _nextPosition = new THREE.Vector3();

type StoppableEvent = { stopPropagation: () => void };

interface UseMarkerInteractionOptions {
  entityId: string;
  position: THREE.Vector3;
  placementMode: boolean;
  onSingleClick: () => void;
  onDoubleClick: () => void;
  previewPosition: (id: string, pos: THREE.Vector3) => void;
  commitPosition: (id: string, pos: THREE.Vector3, origin: THREE.Vector3) => void;
  setDragging: (dragging: boolean) => void;
}

export function useMarkerInteraction({
  entityId,
  position,
  placementMode,
  onSingleClick,
  onDoubleClick,
  previewPosition,
  commitPosition,
  setDragging,
}: UseMarkerInteractionOptions) {
  const { isAdmin } = useRole();
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const dragOriginRef = useRef<THREE.Vector3 | null>(null);
  const dragPositionRef = useRef<THREE.Vector3 | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const { gl, camera } = useThree();
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Typed by capability rather than by event so the map labels, which are DOM
  // nodes rather than meshes, can share the click/double-click disambiguation.
  const handleClick = (e: StoppableEvent) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (placementMode) return;
    e.stopPropagation();
    if (clickTimeoutRef.current !== null) return;
    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
      onSingleClick();
    }, SINGLE_CLICK_DELAY_MS);
  };

  const handleDoubleClick = (e: StoppableEvent) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (placementMode) return;
    e.stopPropagation();
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    onDoubleClick();
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (placementMode) return;
    e.stopPropagation();
    if (!isAdmin) return;

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOriginRef.current = position.clone();
    dragPositionRef.current = position.clone();
    didDragRef.current = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.x;
      const dy = moveEvent.clientY - dragStartRef.current.y;
      if (!isDraggingRef.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) {
        isDraggingRef.current = true;
        setDragging(true);
        didDragRef.current = true;
      }
      if (didDragRef.current) {
        const rect = gl.domElement.getBoundingClientRect();
        const mouseX = ((moveEvent.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((moveEvent.clientY - rect.top) / rect.height) * 2 + 1;
        _mouse.set(mouseX, mouseY);
        _raycaster.setFromCamera(_mouse, cameraRef.current);
        _raycaster.ray.intersectPlane(_plane, _intersection);
        if (_intersection) {
          _nextPosition.set(_intersection.x, 0, _intersection.z);
          dragPositionRef.current = _nextPosition.clone();
          previewPosition(entityId, _nextPosition.clone());
        }
      }
    };

    const onPointerUp = () => {
      if (didDragRef.current && dragPositionRef.current) {
        const origin = dragOriginRef.current ?? position.clone();
        commitPosition(entityId, dragPositionRef.current, origin);
      }

      dragStartRef.current = null;
      isDraggingRef.current = false;
      setDragging(false);
      dragOriginRef.current = null;
      dragPositionRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = isAdmin ? 'grab' : 'pointer';
  };

  const handlePointerOut = () => {
    if (!isDraggingRef.current) {
      document.body.style.cursor = 'auto';
    }
  };

  return {
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    handlePointerOver,
    handlePointerOut,
    isAdmin,
  };
}
