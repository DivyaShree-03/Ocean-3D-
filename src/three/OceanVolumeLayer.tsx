import React from 'react';
import * as THREE from 'three';
import type { OceanVolumeData } from '../types/ocean';

interface OceanVolumeLayerProps {
  volume?: OceanVolumeData;
  opacity?: number;
  verticalExaggeration?: number;
  depthMin?: number;
  depthMax?: number;
}

export const OceanVolumeLayer: React.FC<OceanVolumeLayerProps> = ({
  verticalExaggeration = 2.0,
}) => {
  // Volume scale dimensions: X=16 (width), Y=4 * exaggeration (depth), Z=12 (latitude)
  const VOLUME_SIZE = {
    x: 16.0,
    y: 4.0 * verticalExaggeration,
    z: 12.0,
  };

  const posY = -VOLUME_SIZE.y / 2;

  return (
    <group position={[0, posY, 0]}>
      {/* Semi-transparent blue water container shell */}
      <mesh scale={[VOLUME_SIZE.x, VOLUME_SIZE.y, VOLUME_SIZE.z]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#0B4F75"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Subtle blue wireframe bounding box edges */}
      <lineSegments scale={[VOLUME_SIZE.x, VOLUME_SIZE.y, VOLUME_SIZE.z]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial
          color="#8FD3FF"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};
