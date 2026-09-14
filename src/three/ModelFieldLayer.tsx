import { useMemo } from 'react';
import * as THREE from 'three';
import type { ModelField, ScalarVariable } from '../services/modelService';
import { getScalarColor } from '../utils/modelColors';
import { geoToScene } from '../utils/geoToScene';

interface Props {
  field: ModelField | null;
  variable: ScalarVariable;
  opacity?: number;
}

export default function ModelFieldLayer({
  field,
  variable,
  opacity = 0.92,
}: Props) {
  const geometry = useMemo(() => {
    if (!field) return null;

    const { latitudes, longitudes, values, min, max } = field;

    if (
      !latitudes ||
      !longitudes ||
      latitudes.length < 2 ||
      longitudes.length < 2 ||
      !values ||
      !values.length
    ) {
      return null;
    }

    const positions: number[] = [];
    const colors: number[] = [];

    /**
     * Stride 2 for optimal render performance; 1 for full resolution.
     */
    const stride = 2;

    const addVertex = (lon: number, lat: number, value: number) => {
      const [x, y, z] = geoToScene(lon, lat, 0, 1);
      const yOffset = y + 0.015; // Tiny offset above ocean

      positions.push(x, yOffset, z);

      const c = getScalarColor(value, min, max, variable);
      colors.push(c.r, c.g, c.b);
    };

    for (let i = 0; i < latitudes.length - stride; i += stride) {
      for (let j = 0; j < longitudes.length - stride; j += stride) {
        const v00 = values[i]?.[j];
        const v10 = values[i]?.[j + stride];
        const v01 = values[i + stride]?.[j];
        const v11 = values[i + stride]?.[j + stride];

        /**
         * Null cells = land/masked.
         * Do not create triangles across land or missing values.
         */
        if (
          v00 == null ||
          v10 == null ||
          v01 == null ||
          v11 == null
        ) {
          continue;
        }

        const lat0 = latitudes[i];
        const lat1 = latitudes[i + stride];

        const lon0 = longitudes[j];
        const lon1 = longitudes[j + stride];

        // Triangle 1
        addVertex(lon0, lat0, v00);
        addVertex(lon1, lat0, v10);
        addVertex(lon0, lat1, v01);

        // Triangle 2
        addVertex(lon1, lat0, v10);
        addVertex(lon1, lat1, v11);
        addVertex(lon0, lat1, v01);
      }
    }

    if (positions.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    geo.computeBoundingSphere();

    return geo;
  }, [field, variable]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} renderOrder={5}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
}
