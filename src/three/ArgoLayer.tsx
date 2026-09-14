import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useExplorerStore } from '../store/explorerStore';
import { geoToScene } from '../utils/geoToScene';
import { demoArgoFloat } from '../data/demoObservations';
import { isLandCoordinate } from '../geography/landMask';

export const ArgoLayer: React.FC = () => {
  const showArgo = useExplorerStore((state) => state.showArgo);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const selectedInstrumentId = useExplorerStore((state) => state.selectedInstrumentId);
  const setSelectedInstrumentId = useExplorerStore((state) => state.setSelectedInstrumentId);

  const [hovered, setHovered] = useState(false);

  // 1. Land Validation before rendering
  const isLand = useMemo(() => {
    return isLandCoordinate(demoArgoFloat.longitude, demoArgoFloat.latitude);
  }, []);

  const floatPos = useMemo<[number, number, number]>(() => {
    return geoToScene(
      demoArgoFloat.longitude,
      demoArgoFloat.latitude,
      demoArgoFloat.currentDepth,
      verticalExaggeration
    );
  }, [verticalExaggeration]);

  const isSelected = selectedInstrumentId === demoArgoFloat.id;

  if (!showArgo || isLand) return null;

  return (
    <group position={floatPos}>
      {/* Small Clean Colored Observation Dot (#F4C542 Yellow/Gold) */}
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
          setSelectedInstrumentId(demoArgoFloat.id);
        }}
      >
        {/* Outer White Outline Ring */}
        <mesh>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.9} depthTest={false} />
        </mesh>

        {/* Inner Colored Dot (#F4C542) */}
        <mesh scale={hovered || isSelected ? [1.25, 1.25, 1.25] : [1.0, 1.0, 1.0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial
            color={isSelected ? '#FFF2B2' : hovered ? '#FFD85A' : '#F4C542'}
            depthTest={false}
          />
        </mesh>

        {/* Subtle Selection Halo Ring (Active ONLY when selected) */}
        {isSelected && (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.12, 0.16, 24]} />
              <meshBasicMaterial color="#F4C542" transparent opacity={0.85} side={THREE.DoubleSide} depthTest={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshBasicMaterial color="#F4C542" transparent opacity={0.2} depthTest={false} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};
