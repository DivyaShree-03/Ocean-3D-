import React, { useMemo } from 'react';
import * as THREE from 'three';
import { geoToScene, SCENE_BOUNDS } from '../utils/geoToScene';
import type { ScalarVariable } from '../services/modelService';

interface MultiDepthSliceLayerProps {
  variable?: ScalarVariable;
  timeStep?: number;
  verticalExaggeration?: number;
  opacity?: number;
  selectedDepth?: number;
  visible?: boolean;
}

const DEPTH_LEVELS = [0, 500, 1000, 1500, 2000, 3000, 4000, 5500];

type SingleSliceProps = {
  depth: number;
  verticalExaggeration: number;
  baseOpacity: number;
};

const DepthSliceMesh: React.FC<SingleSliceProps> = ({
  depth,
  verticalExaggeration,
  baseOpacity,
}) => {
  const geometry = useMemo(() => {
    const lonSteps = 48;
    const latSteps = 32;

    const positions: number[] = [];
    const indices: number[] = [];

    const minLon = SCENE_BOUNDS.MIN_LON;
    const maxLon = SCENE_BOUNDS.MAX_LON;
    const minLat = SCENE_BOUNDS.MIN_LAT;
    const maxLat = SCENE_BOUNDS.MAX_LAT;

    for (let j = 0; j <= latSteps; j++) {
      const lat = minLat + (j / latSteps) * (maxLat - minLat);

      for (let i = 0; i <= lonSteps; i++) {
        const lon = minLon + (i / lonSteps) * (maxLon - minLon);

        const [x, y, z] = geoToScene(lon, lat, depth, verticalExaggeration);
        positions.push(x, y, z);
      }
    }

    const numCols = lonSteps + 1;

    for (let j = 0; j < latSteps; j++) {
      for (let i = 0; i < lonSteps; i++) {
        const idx00 = j * numCols + i;
        const idx10 = j * numCols + (i + 1);
        const idx01 = (j + 1) * numCols + i;
        const idx11 = (j + 1) * numCols + (i + 1);

        indices.push(idx00, idx01, idx10);
        indices.push(idx10, idx01, idx11);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();

    return geo;
  }, [depth, verticalExaggeration]);

  if (!geometry) return null;

  // Subtle neutral depth reference plane opacity (0.06 - 0.08) so real scalar data shines through
  const opacity = Math.max(0.05, Math.min(0.08, baseOpacity * 0.08));

  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshBasicMaterial
        color="#0B5470"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthTest={true}
        depthWrite={false}
      />
    </mesh>
  );
};

export function MultiDepthSliceLayer({
  verticalExaggeration = 2.0,
  opacity = 0.8,
  selectedDepth = 0,
  visible = true,
}: MultiDepthSliceLayerProps) {
  if (!visible) return null;

  return (
    <group>
      {DEPTH_LEVELS.map((depth) => {
        // Skip neutral reference slice if it sits within 150m of the active backend data depth
        const isNearSelectedDepth = Math.abs(depth - selectedDepth) < 150;
        if (isNearSelectedDepth) {
          return null;
        }

        return (
          <DepthSliceMesh
            key={depth}
            depth={depth}
            verticalExaggeration={verticalExaggeration}
            baseOpacity={opacity}
          />
        );
      })}
    </group>
  );
}

export default MultiDepthSliceLayer;
