import { Html } from '@react-three/drei';
import type { MouseEvent } from 'react';

interface MapLabelProps {
  markerSize: number;
  color: string;
  hovered: boolean;
  title: string;
  subtitle?: string;
  fontSize?: string;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export function MapLabel({
  markerSize,
  color,
  hovered,
  title,
  subtitle,
  fontSize = '13px',
  onClick,
  onDoubleClick,
}: MapLabelProps) {
  const interactive = Boolean(onClick);

  return (
    <Html
      position={[0, 0, -markerSize * 1.5]}
      center
      zIndexRange={[0, 0]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div
        data-map-label
        className="text-center whitespace-nowrap px-3 py-1 rounded"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        style={{
          color: '#FFFFFF',
          backgroundColor: hovered ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.75)',
          textShadow: `0 0 10px ${color}, 0 0 5px ${color}`,
          fontSize,
          fontWeight: 'bold',
          borderBottom: `2px solid ${color}`,
          // Panning still works from here: R3F binds its events to the
          // container the labels are portalled into, not to the canvas.
          pointerEvents: interactive ? 'auto' : 'none',
          cursor: interactive ? 'pointer' : undefined,
        }}
      >
        {title}
        {subtitle && (
          <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.7 }}>
            {subtitle}
          </div>
        )}
      </div>
    </Html>
  );
}
