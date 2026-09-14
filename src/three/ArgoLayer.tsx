import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useExplorerStore } from '../store/explorerStore';
import { geoToScene } from '../utils/geoToScene';
import { isLandCoordinate } from '../geography/landMask';
import type { ArgoMarker } from '../services/argoService';

interface ArgoLayerProps {
  observations?: ArgoMarker[];
  onSelect?: (id: string) => void;
}

const SingleArgoDot: React.FC<{
  argo: ArgoMarker;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  verticalExaggeration: number;
}> = ({ argo, isSelected, onSelect, verticalExaggeration }) => {
  const setSelectedInstrumentId = useExplorerStore((state) => state.setSelectedInstrumentId);
  const [hovered, setHovered] = useState(false);

  const isLand = useMemo(() => {
    return isLandCoordinate(argo.longitude, argo.latitude);
  }, [argo.longitude, argo.latitude]);

  const floatPos = useMemo<[number, number, number]>(() => {
    return geoToScene(
      argo.longitude,
      argo.latitude,
      0,
      verticalExaggeration
    );
  }, [argo.longitude, argo.latitude, verticalExaggeration]);

  if (isLand) return null;

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(argo.id);
    } else {
      setSelectedInstrumentId(argo.id);
    }
  };

  return (
    <group position={floatPos}>
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
        onClick={handleClick}
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

export const ArgoLayer: React.FC<ArgoLayerProps> = ({ observations = [], onSelect }) => {
  const showArgo = useExplorerStore((state) => state.showArgo);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const selectedInstrumentId = useExplorerStore((state) => state.selectedInstrumentId);

  if (!showArgo || !observations.length) return null;

  return (
    <group>
      {observations.map((argo) => (
        <SingleArgoDot
          key={argo.id}
          argo={argo}
          isSelected={selectedInstrumentId === argo.id}
          onSelect={onSelect}
          verticalExaggeration={verticalExaggeration}
        />
      ))}
    </group>
  );
};
