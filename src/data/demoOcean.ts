import type { OceanVolumeData } from '../types/ocean';

/**
 * Generates synthetic 3D temperature volume scalar dataset for Northern Indian Ocean.
 * Bounds: 60°E – 98°E, 0° – 25°N, 0 – 5500 m
 * Dimensions: 96 (lon) x 48 (vertical depth) x 72 (lat)
 * Array Layout for Data3DTexture: index = x + y * nx + z * (nx * ny)
 * y=0 is ocean bottom (5500m depth, cold ~1.5°C), y=ny-1 is sea surface (0m depth, ~28°C-31.5°C)
 */
export function generateDemoOceanVolume(): OceanVolumeData {
  const nx = 96; // Longitude
  const ny = 48; // Vertical depth layers
  const nz = 72; // Latitude

  const scalars = new Float32Array(nx * ny * nz);

  const minLon = 60.0;
  const maxLon = 98.0;
  const minLat = 0.0;
  const maxLat = 25.0;
  const minDepth = 0.0;
  const maxDepth = 5500.0;

  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let z = 0; z < nz; z++) {
    const latNorm = z / (nz - 1);
    const lat = minLat + latNorm * (maxLat - minLat);

    for (let y = 0; y < ny; y++) {
      // yNorm = 0.0 at ocean floor (5500m), yNorm = 1.0 at sea surface (0m)
      const yNorm = y / (ny - 1);

      // Vertical thermocline profile
      const baseTemp = 1.5 + 22.5 * Math.pow(yNorm, 2.2);

      for (let x = 0; x < nx; x++) {
        const lonNorm = x / (nx - 1);
        const lon = minLon + lonNorm * (maxLon - minLon);

        // Smooth, continuous thermal field across Northern Indian Ocean (seamless ocean temperature gradient)
        const latWarmth = 2.5 * Math.sin(latNorm * Math.PI * 0.85) * Math.pow(yNorm, 2.0);
        const lonWarmth = 3.5 * Math.sin(lonNorm * Math.PI * 0.95 + 0.1) * Math.pow(yNorm, 2.1);
        const centralWarmPool = 2.5 * Math.exp(-Math.pow((lon - 84.0) / 14.0, 2) - Math.pow((lat - 12.0) / 9.0, 2)) * Math.pow(yNorm, 2.2);

        // Combined temperature scalar
        let temp = baseTemp + latWarmth + lonWarmth + centralWarmPool;

        // Clamp between 0.0°C and 32.0°C
        temp = Math.max(0.0, Math.min(32.0, temp));

        if (temp < minVal) minVal = temp;
        if (temp > maxVal) maxVal = temp;

        const index = x + y * nx + z * nx * ny;
        scalars[index] = temp;
      }
    }
  }

  return {
    dimensions: { nx, ny, nz },
    bounds: { minLon, maxLon, minLat, maxLat, minDepth, maxDepth },
    scalars,
    minVal,
    maxVal,
  };
}
