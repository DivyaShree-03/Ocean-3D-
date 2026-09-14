import * as THREE from 'three';
import { regionalLandData } from '../data/geography/regionalLand';
import { SCENE_BOUNDS } from '../utils/geoToScene';

export function createLandMaskTexture(width = 1024, height = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for land mask canvas');
  }

  // Clear background with black (Ocean = 0.0)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Fill land polygons with white (Land = 255 / 1.0)
  ctx.fillStyle = '#FFFFFF';

  const lonSpan = SCENE_BOUNDS.MAX_LON - SCENE_BOUNDS.MIN_LON; // 38°
  const latSpan = SCENE_BOUNDS.MAX_LAT - SCENE_BOUNDS.MIN_LAT; // 25°

  const lonToPx = (lon: number) => ((lon - SCENE_BOUNDS.MIN_LON) / lonSpan) * width;
  // Canvas Y=0 is North (25°N), Canvas Y=height is South (0°N)
  const latToPy = (lat: number) => ((SCENE_BOUNDS.MAX_LAT - lat) / latSpan) * height;

  const drawPolygonRing = (ring: number[][]) => {
    if (!ring || ring.length === 0) return;
    ctx.moveTo(lonToPx(ring[0][0]), latToPy(ring[0][1]));
    for (let i = 1; i < ring.length; i++) {
      ctx.lineTo(lonToPx(ring[i][0]), latToPy(ring[i][1]));
    }
  };

  regionalLandData.features.forEach((feature: any) => {
    const geometry = feature.geometry;
    if (!geometry) return;

    ctx.beginPath();

    if (geometry.type === 'Polygon') {
      const rings = geometry.coordinates;
      if (rings.length > 0) {
        drawPolygonRing(rings[0] as number[][]);
      }
      for (let r = 1; r < rings.length; r++) {
        drawPolygonRing(rings[r] as number[][]);
      }
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygonRings: number[][][]) => {
        if (polygonRings.length > 0) {
          drawPolygonRing(polygonRings[0] as number[][]);
        }
        for (let r = 1; r < polygonRings.length; r++) {
          drawPolygonRing(polygonRings[r] as number[][]);
        }
      });
    }

    ctx.closePath();
    ctx.fill('evenodd');
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return texture;
}

function pointInPolygon(x: number, y: number, ring: any): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Validates whether a geographic coordinate (lon, lat) falls on land.
 */
export function isLandCoordinate(longitude: number, latitude: number): boolean {
  if (longitude < SCENE_BOUNDS.MIN_LON || longitude > SCENE_BOUNDS.MAX_LON ||
      latitude < SCENE_BOUNDS.MIN_LAT || latitude > SCENE_BOUNDS.MAX_LAT) {
    return true; // Out of bounds considered non-ocean
  }

  for (const feature of regionalLandData.features) {
    const geometry = feature.geometry;
    if (!geometry) continue;

    if (geometry.type === 'Polygon') {
      if (pointInPolygon(longitude, latitude, geometry.coordinates[0])) {
        return true;
      }
    } else if (geometry.type === 'MultiPolygon') {
      for (const poly of geometry.coordinates) {
        if (pointInPolygon(longitude, latitude, poly[0])) {
          return true;
        }
      }
    }
  }

  return false;
}

