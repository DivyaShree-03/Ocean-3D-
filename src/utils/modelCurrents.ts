import type { ModelField } from '../services/modelService';

export interface CurrentVector {
  latitude: number;
  longitude: number;
  u: number;
  v: number;
  speed: number;
}

export function modelFieldsToCurrents(
  uField: ModelField | null,
  vField: ModelField | null,
  density: 'low' | 'medium' | 'high' | 'Low' | 'Medium' | 'High' = 'Medium'
): CurrentVector[] {
  if (!uField || !vField) {
    return [];
  }

  const latitudes = uField.latitudes;
  const longitudes = uField.longitudes;
  const uValues = uField.values;
  const vValues = vField.values;

  if (!latitudes.length || !longitudes.length || !uValues.length || !vValues.length) {
    return [];
  }

  const normalizedDensity = String(density).toLowerCase();
  const stride =
    normalizedDensity === 'low'
      ? 10
      : normalizedDensity === 'high'
      ? 3
      : 6;

  const result: CurrentVector[] = [];

  for (let i = 0; i < latitudes.length; i += stride) {
    for (let j = 0; j < longitudes.length; j += stride) {
      const u = uValues[i]?.[j];
      const v = vValues[i]?.[j];

      if (u == null || v == null) {
        continue;
      }

      const speed = Math.sqrt(u * u + v * v);

      if (!Number.isFinite(speed)) {
        continue;
      }

      result.push({
        latitude: latitudes[i],
        longitude: longitudes[j],
        u,
        v,
        speed,
      });
    }
  }

  return result;
}

/**
 * Fast lookup helper to sample u, v, speed at any (lon, lat) coordinate from real model grid fields.
 */
export function sampleModelCurrentVector(
  lon: number,
  lat: number,
  uField: ModelField | null,
  vField: ModelField | null
): { u: number; v: number; speed: number } {
  if (!uField || !vField || !uField.latitudes.length || !uField.longitudes.length) {
    return { u: 0, v: 0, speed: 0 };
  }

  const lats = uField.latitudes;
  const lons = uField.longitudes;

  // Simple nearest-neighbor grid lookup
  const minLat = lats[0];
  const maxLat = lats[lats.length - 1];
  const minLon = lons[0];
  const maxLon = lons[lons.length - 1];

  if (lat < Math.min(minLat, maxLat) || lat > Math.max(minLat, maxLat) ||
      lon < Math.min(minLon, maxLon) || lon > Math.max(minLon, maxLon)) {
    return { u: 0, v: 0, speed: 0 };
  }

  const latRatio = (lat - lats[0]) / (lats[lats.length - 1] - lats[0] || 1);
  const lonRatio = (lon - lons[0]) / (lons[lons.length - 1] - lons[0] || 1);

  const i = Math.min(Math.max(0, Math.floor(latRatio * (lats.length - 1))), lats.length - 1);
  const j = Math.min(Math.max(0, Math.floor(lonRatio * (lons.length - 1))), lons.length - 1);

  const u = uField.values[i]?.[j] ?? 0;
  const v = vField.values[i]?.[j] ?? 0;
  const speed = Math.sqrt(u * u + v * v);

  return { u, v, speed };
}
