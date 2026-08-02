import { memo, useMemo, useState } from 'react';
import { MapLabel } from '@/components/galaxy/MapLabel';
import type { StarSystem } from '@/types';
import { useGalaxySelectionStore } from '@/store/galaxySelectionStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useFactionStore } from '@/store/factionStore';
import { useMarkerInteraction } from '@/hooks/useMarkerInteraction';
import {
  TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE,
  DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE,
} from '@/config/topDownMarkerConfig';

interface TopDownMarkerProps {
  system: StarSystem;
}

const TopDownMarker = memo(function TopDownMarker({ system }: TopDownMarkerProps) {
  const [hovered, setHovered] = useState(false);

  const setSelectedSystem = useGalaxySelectionStore((s) => s.setSelectedSystem);
  const setTopDownSelection = useGalaxySelectionStore((s) => s.setTopDownSelection);
  const setSelectedPlanet = useGalaxySelectionStore((s) => s.setSelectedPlanet);
  const setInfoPanelData = useGalaxySelectionStore((s) => s.setInfoPanelData);
  const showLabels = useGalaxyUIStore((s) => s.showLabels);
  const previewCustomSystemPosition = useGalaxyDataStore((s) => s.previewCustomSystemPosition);
  const updateCustomSystemPosition = useGalaxyDataStore((s) => s.updateCustomSystemPosition);
  const setDraggingCustomPlanet = useGalaxyUIStore((s) => s.setDraggingCustomPlanet);
  const placementMode = useGalaxyUIStore((s) => s.placementMode);

  const getFactionMarkerColor = useFactionStore((s) => s.getFactionMarkerColor);
  const primaryPlanetColor = system.planets[0]?.customColor;
  const factionColor = primaryPlanetColor
    || (system.isCustom && system.customColor ? system.customColor : null)
    || getFactionMarkerColor(system.faction);
  const markerSize =
    system.markerSize ??
    TOPDOWN_SYSTEM_MARKER_SIZE_BY_IMPORTANCE[system.importance] ??
    DEFAULT_TOPDOWN_SYSTEM_MARKER_SIZE;

  const openTopDownPlanetEditor = () => {
    const primaryPlanet = system.planets[0];
    setTopDownSelection(system.id, primaryPlanet?.id ?? null);
    if (primaryPlanet) {
      setInfoPanelData({ type: 'planet', data: primaryPlanet });
      return;
    }
    setInfoPanelData({ type: 'system', data: system });
  };

  const {
    handleClick,
    handleDoubleClick,
    handlePointerDown,
    handlePointerOver: basePointerOver,
    handlePointerOut: basePointerOut,
  } = useMarkerInteraction({
    entityId: system.id,
    position: system.position,
    placementMode,
    onSingleClick: openTopDownPlanetEditor,
    onDoubleClick: () => {
      const primaryPlanet = system.planets[0];
      setSelectedSystem(system.id);
      if (primaryPlanet) {
        setSelectedPlanet(primaryPlanet.id);
        setInfoPanelData({ type: 'planet', data: primaryPlanet });
        return;
      }
      setInfoPanelData({ type: 'system', data: system });
    },
    previewPosition: previewCustomSystemPosition,
    commitPosition: updateCustomSystemPosition,
    setDragging: setDraggingCustomPlanet,
  });

  return (
    <group position={system.position}>
      <mesh
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => { basePointerOver(e); setHovered(true); }}
        onPointerOut={() => { basePointerOut(); setHovered(false); }}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[markerSize * (hovered ? 1.3 : 1), 16]} />
        <meshBasicMaterial
          color={factionColor}
          transparent
          opacity={hovered ? 1 : 0.9}
        />
      </mesh>

      {system.isCustom && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[markerSize * 1.1, markerSize * 1.3, 32]} />
          <meshBasicMaterial
            color={factionColor}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {(showLabels || hovered || system.importance === 'capital' || system.isCustom) && (
        <MapLabel
          markerSize={markerSize}
          color={factionColor}
          hovered={hovered}
          title={system.name}
          fontSize={system.importance === 'capital' ? '16px' : '13px'}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        />
      )}
    </group>
  );
});

export { TopDownMarker };

export function TopDownMarkers() {
  const allSystems = useGalaxyDataStore((s) => s.systems);
  const searchQuery = useGalaxyUIStore((s) => s.searchQuery);
  const factionFilters = useGalaxyUIStore((s) => s.factionFilters);
  const systems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return allSystems.filter((system) => {
      if (factionFilters[system.faction] === false) {
        return false;
      }

      if (!query) {
        return true;
      }

      const matchesName = system.name.toLowerCase().includes(query);
      const matchesRegion = system.region.replace('_', ' ').toLowerCase().includes(query);
      const matchesPlanet = system.planets.some((planet) => planet.name.toLowerCase().includes(query));
      return matchesName || matchesRegion || matchesPlanet;
    });
  }, [allSystems, searchQuery, factionFilters]);

  return (
    <>
      {systems.map(system => (
        <TopDownMarker key={system.id} system={system} />
      ))}
    </>
  );
}
