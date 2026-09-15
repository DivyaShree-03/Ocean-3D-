import type { ModelField, ScalarVariable } from '../services/modelService';
import { isLandCoordinate } from '../geography/landMask';

export const DEMO_DEPTHS = [0.5, 10, 50, 100, 250, 500, 1000];

export const DEMO_TIMES = [
  '2025-01-01',
  '2025-01-02',
  '2025-01-03',
  '2025-01-04',
  '2025-01-05',
  '2025-01-06',
  '2025-01-07',
];

export function createDemoScalarValue(
  variable: ScalarVariable,
  lon: number,
  lat: number,
  depth: number,
  timeStep: number
): number {
  const phase = timeStep * 0.25;

  if (variable === 'thetao') {
    const surface =
      29.0 -
      lat * 0.08 +
      Math.sin(lon * 0.15 + phase) * 1.2 +
      Math.cos(lat * 0.18 - phase) * 0.8;

    const coolingWithDepth = depth * 0.008;

    return Math.max(2.0, Math.min(32.0, surface - coolingWithDepth));
  }

  // Salinity 'so'
  const surface =
    34.4 +
    Math.sin(lon * 0.12 + phase) * 0.35 +
    Math.cos(lat * 0.14 - phase) * 0.2;

  const depthVariation = Math.min(depth / 1000, 1) * 0.3;

  return Math.max(30.0, Math.min(37.0, surface + depthVariation));
}

export function createDemoScalarField(
  variable: ScalarVariable,
  depth: number,
  timeStep: number
): ModelField {
  const numLat = 51;
  const numLon = 77;

  const minLat = 0.0;
  const maxLat = 25.0;
  const minLon = 60.0;
  const maxLon = 98.0;

  const latitudes: number[] = [];
  for (let i = 0; i < numLat; i++) {
    latitudes.push(minLat + (i / (numLat - 1)) * (maxLat - minLat));
  }

  const longitudes: number[] = [];
  for (let j = 0; j < numLon; j++) {
    longitudes.push(minLon + (j / (numLon - 1)) * (maxLon - minLon));
  }

  const values: (number | null)[][] = [];
  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let i = 0; i < numLat; i++) {
    const lat = latitudes[i];
    const row: (number | null)[] = [];

    for (let j = 0; j < numLon; j++) {
      const lon = longitudes[j];

      if (isLandCoordinate(lon, lat)) {
        row.push(null);
      } else {
        const val = createDemoScalarValue(variable, lon, lat, depth, timeStep);
        row.push(val);

        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }
    values.push(row);
  }

  if (minVal === Infinity) minVal = variable === 'thetao' ? 24 : 33;
  if (maxVal === -Infinity) maxVal = variable === 'thetao' ? 31 : 36;

  const selectedTime = DEMO_TIMES[timeStep % DEMO_TIMES.length];

  return {
    variable,
    latitudes,
    longitudes,
    values,
    min: minVal,
    max: maxVal,
    selectedDepth: depth,
    selectedTime,
    unit: variable === 'thetao' ? '°C' : 'PSU',
    raw: { demo: true },
  };
}
