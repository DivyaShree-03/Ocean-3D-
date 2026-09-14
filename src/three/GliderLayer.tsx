import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useExplorerStore } from '../store/explorerStore';
import { geoToScene } from '../utils/geoToScene';
import { demoGlider } from '../data/demoObservations';
import { isLandCoordinate } from '../geography/landMask';

export const GliderLayer: React.FC = () => {
  const showGlider = useExplorerStore((state) => state.showGlider);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const selectedInstrumentId = useExplorerStore((state) => state.selectedInstrumentId);
  const setSelectedInstrumentId = useExplorerStore((state) => state.setSelectedInstrumentId);

  const [hovered, setHovered] = useState(false);

  // 1. Land Validation before rendering
  const isLand = useMemo(() => {
    return isLandCoordinate(demoGlider.longitude, demoGlider.latitude);
  }, []);

  const gliderPos = useMemo<[number, number, number]>(() => {
    return geoToScene(
      demoGlider.longitude,
      demoGlider.latitude,
      demoGlider.currentDepth,
      verticalExaggeration
    );
  }, [verticalExaggeration]);

  const isSelected = selectedInstrumentId === demoGlider.id;

  if (!showGlider || isLand) return null;

  return (
    <group position={gliderPos}>
      {/* Small Clean Colored Observation Dot (#FF8A3D Orange/Coral) */}
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedInstrumentId(demoGlider.id);
        }}
      >
        {/* Outer White Outline Ring */}
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.9} depthTest={false} />
        </mesh>

        {/* Inner Colored Dot (#FF8A3D) */}
        <mesh scale={hovered || isSelected ? [1.25, 1.25, 1.25] : [1.0, 1.0, 1.0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial
            color={isSelected ? '#FFB885' : hovered ? '#FFA366' : '#FF8A3D'}
            depthTest={false}
          />
        </mesh>

        {/* Subtle Selection Halo Ring (Active ONLY when selected) */}
        {isSelected && (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.12, 0.16, 24]} />
              <meshBasicMaterial color="#FF8A3D" transparent opacity={0.85} side={THREE.DoubleSide} depthTest={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshBasicMaterial color="#FF8A3D" transparent opacity={0.2} depthTest={false} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};
