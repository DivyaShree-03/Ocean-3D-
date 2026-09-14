import * as THREE from 'three';
import { geoToScene } from '../utils/geoToScene';
import { regionalLandData } from '../data/geography/regionalLand';
import { regionalCoastlineData } from '../data/geography/regionalCoastline';

export interface LandGeometryData {
  extrudedGeometry: THREE.BufferGeometry;
  coastlineGeometry: THREE.BufferGeometry;
}

export function buildLandGeometries(extrusionHeight = 0.035): LandGeometryData {
  const shapes: THREE.Shape[] = [];

  // 1. Build 3D Land Shapes from Natural Earth 1:50m Land dataset
  regionalLandData.features.forEach((feature: any) => {
    const geometry = feature.geometry;
    if (!geometry) return;

    const processPolygonRings = (rings: number[][][]) => {
      if (rings.length === 0) return;

      // Outer boundary ring
      const outerRing = rings[0];
      if (outerRing.length < 3) return;

      const shapePoints: THREE.Vector2[] = [];
      outerRing.forEach(([lon, lat]) => {
        const [x, , z] = geoToScene(lon, lat, 0, 1.0);
        shapePoints.push(new THREE.Vector2(x, -z));
      });

      const shape = new THREE.Shape(shapePoints);

      // Inner hole rings
      for (let r = 1; r < rings.length; r++) {
        const holeRing = rings[r];
        if (holeRing.length < 3) continue;

        const holePoints: THREE.Vector2[] = [];
        holeRing.forEach(([lon, lat]) => {
          const [x, , z] = geoToScene(lon, lat, 0, 1.0);
          holePoints.push(new THREE.Vector2(x, -z));
        });

        shape.holes.push(new THREE.Path(holePoints));
      }

      shapes.push(shape);
    };

    if (geometry.type === 'Polygon') {
      processPolygonRings(geometry.coordinates as number[][][]);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((rings: number[][][]) => {
        processPolygonRings(rings as number[][][]);
      });
    }
  });

  // Create shallow visual extrusion (0.035 scene units, fixed Y=0)
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: extrusionHeight,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 1,
  };

  const extrudedGeometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);

  // 2. Build Coastline Lines directly from Natural Earth 1:50m Coastline dataset
  const coastlineVertices: number[] = [];

  regionalCoastlineData.features.forEach((feature: any) => {
    const geometry = feature.geometry;
    if (!geometry) return;

    const processLineString = (coords: number[][]) => {
      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];

        const [x1, , z1] = geoToScene(lon1, lat1, 0, 1.0);
        const [x2, , z2] = geoToScene(lon2, lat2, 0, 1.0);

        // Slightly above top of land extrusion (extrusionHeight + 0.003)
        coastlineVertices.push(x1, extrusionHeight + 0.003, z1);
        coastlineVertices.push(x2, extrusionHeight + 0.003, z2);
      }
    };

    if (geometry.type === 'LineString') {
      processLineString(geometry.coordinates as number[][]);
    } else if (geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach((line: number[][]) => {
        processLineString(line);
      });
    }
  });

  const coastlineGeometry = new THREE.BufferGeometry();
  coastlineGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(coastlineVertices, 3)
  );

  return { extrudedGeometry, coastlineGeometry };
}
