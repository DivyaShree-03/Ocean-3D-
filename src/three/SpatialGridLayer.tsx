import { useMemo } from 'react';
import * as THREE from 'three';
import { geoToScene } from '../utils/geoToScene';

interface SpatialGridLayerProps {
  visible?: boolean;
  depth?: number;
  verticalExaggeration?: number;
}

export function SpatialGridLayer({
  visible = true,
  depth = 0,
  verticalExaggeration = 1,
}: SpatialGridLayerProps) {
  const geometry = useMemo(() => {
    const positions: number[] = [];

    // Current OceanX domain
    const minLon = 60;
    const maxLon = 98;

    const minLat = 0;
    const maxLat = 25;

    const lonStep = 2;
    const latStep = 2;

    // Controls smoothness of each grid line
    const samples = 80;

    const addSegment = (a: THREE.Vector3, b: THREE.Vector3) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };

    // Longitude lines
    for (let lon = minLon; lon <= maxLon; lon += lonStep) {
      let previous: THREE.Vector3 | null = null;

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const lat = minLat + (maxLat - minLat) * t;

        const [x, y, z] = geoToScene(
          lon,
          lat,
          depth,
          verticalExaggeration
        );

        // Keep grid slightly above scalar layer
        const p = new THREE.Vector3(x, y + 0.03, z);

        if (previous) {
          addSegment(previous, p);
        }

        previous = p;
      }
    }

    // Latitude lines
    for (let lat = minLat; lat <= maxLat; lat += latStep) {
      let previous: THREE.Vector3 | null = null;

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const lon = minLon + (maxLon - minLon) * t;

        const [x, y, z] = geoToScene(
          lon,
          lat,
          depth,
          verticalExaggeration
        );

        const p = new THREE.Vector3(x, y + 0.03, z);

        if (previous) {
          addSegment(previous, p);
        }

        previous = p;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );

    return geo;
  }, [depth, verticalExaggeration]);

  if (!visible) {
    return null;
  }

  return (
    <lineSegments geometry={geometry} renderOrder={12}>
      <lineBasicMaterial
        color="#FFFFFF"
        transparent
        opacity={0.15}
        depthTest
        depthWrite={false}
      />
    </lineSegments>
  );
}
