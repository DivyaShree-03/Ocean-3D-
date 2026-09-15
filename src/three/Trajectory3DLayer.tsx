import React, { useMemo } from 'react';
import * as THREE from 'three';
import { geoToScene } from '../utils/geoToScene';
import type { Trajectory3DPoint } from '../types/trajectoryUtils';
import type { VisualTrajectoryPoint } from '../types/trajectory';

interface Trajectory3DLayerProps {
  points?: (Trajectory3DPoint | VisualTrajectoryPoint)[];
  type: 'ARGO' | 'GLIDER';
  verticalExaggeration?: number;
  visible?: boolean;
}

export const Trajectory3DLayer: React.FC<Trajectory3DLayerProps> = ({
  points = [],
  type,
  verticalExaggeration = 2.0,
  visible = true,
}) => {
  const color = type === 'ARGO' ? '#38BDF8' : '#FB923C';

  const geometry = useMemo(() => {
    if (!points || points.length < 2) return null;

    const linePositions: number[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const [x1, y1, z1] = geoToScene(
        p1.longitude,
        p1.latitude,
        Math.abs(p1.depth),
        verticalExaggeration
      );

      const [x2, y2, z2] = geoToScene(
        p2.longitude,
        p2.latitude,
        Math.abs(p2.depth),
        verticalExaggeration
      );

      linePositions.push(x1, y1 + 0.02, z1, x2, y2 + 0.02, z2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );

    return geo;
  }, [points, verticalExaggeration]);

  if (!visible || !geometry) return null;

  return (
    <lineSegments geometry={geometry} renderOrder={15}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.85}
        linewidth={2}
        depthTest={true}
        depthWrite={false}
      />
    </lineSegments>
  );
};

export default Trajectory3DLayer;
