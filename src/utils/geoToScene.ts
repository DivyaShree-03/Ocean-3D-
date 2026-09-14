/**
 * Converts Geographic Coordinates (Longitude, Latitude, Depth in meters)
 * into normalized 3D Scene Coordinates (X, Y, Z).
 *
 * Visual Footprint Proportions (4 : 1 : 3):
 * - X Axis (Longitude 65°E .. 100°E): -8.0 to +8.0 (16.0 units total, Ratio = 4)
 * - Z Axis (Latitude 0°N .. 25°N)   : +6.0 to -6.0 (12.0 units total, Ratio = 3)
 * - Y Axis (Depth 0m .. 5500m)      : 0.0 to -4.0 * verticalExaggeration (Surface at Y=0, Base Ratio = 1)
 */

export const SCENE_BOUNDS = {
  MIN_LON: 60.0,
  MAX_LON: 98.0,
  MIN_LAT: 0.0,
  MAX_LAT: 25.0,
  MIN_DEPTH: 0.0,
  MAX_DEPTH: 5500.0,

  VOLUME_SIZE: {
    x: 16.0,
    yBase: 4.0,
    z: 12.0,
  }
};

export function geoToScene(
  longitude: number,
  latitude: number,
  actualDepth: number,
  verticalExaggeration: number = 2.0
): [number, number, number] {
  // Normalize Longitude to [-8, +8]
  const lonNorm = (longitude - SCENE_BOUNDS.MIN_LON) / (SCENE_BOUNDS.MAX_LON - SCENE_BOUNDS.MIN_LON);
  const x = (lonNorm - 0.5) * SCENE_BOUNDS.VOLUME_SIZE.x;

  // Normalize Latitude to [+6, -6] (South to North)
  const latNorm = (latitude - SCENE_BOUNDS.MIN_LAT) / (SCENE_BOUNDS.MAX_LAT - SCENE_BOUNDS.MIN_LAT);
  const z = (0.5 - latNorm) * SCENE_BOUNDS.VOLUME_SIZE.z;

  // Normalize Depth to negative Y [0, -yBase * verticalExaggeration]
  const depthNorm = actualDepth / SCENE_BOUNDS.MAX_DEPTH;
  const y = -depthNorm * SCENE_BOUNDS.VOLUME_SIZE.yBase * verticalExaggeration;

  return [x, y, z];
}
