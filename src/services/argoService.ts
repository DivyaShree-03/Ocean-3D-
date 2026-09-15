const BASE_URL = 'https://sih2026-oceanx.onrender.com';

export interface ArgoFloat {
  platform_id: string;
  platform_type?: string;
  latitude?: number;
  longitude?: number;
  depth?: number;
  last_seen?: string;
}

export interface ArgoTrajectoryPoint {
  platform_id?: string;
  cycle_number?: number;
  observation_time?: string;
  time?: string;
  latitude: number;
  longitude: number;
  depth?: number;
}

export interface ArgoProfilePoint {
  platform_id: string;
  cycle_number?: number;
  observation_time?: string;
  latitude?: number;
  longitude?: number;
  depth?: number;
  temperature?: number;
  salinity?: number;
}

export interface ArgoMarker {
  id: string;
  type: 'ARGO';
  latitude: number;
  longitude: number;
  depth?: number;
  cycleNumber?: number;
  time?: string;
}

/**
 * Normalizes API response payload into a flat array.
 * Handles top-level array as well as object wrapper keys (e.g. { floats: [...] }).
 */
function normalizeArray<T>(data: any, keys: string[]): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

export async function getArgoFloats(): Promise<ArgoFloat[]> {
  const response = await fetch(`${BASE_URL}/api/argo/floats`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Argo floats: ${response.status}`);
  }

  const data = await response.json();
  return normalizeArray<ArgoFloat>(data, [
    'floats',
    'platforms',
    'data',
    'results',
  ]);
}

export async function getArgoTrajectory(
  platformId: string
): Promise<ArgoTrajectoryPoint[]> {
  const response = await fetch(
    `${BASE_URL}/api/argo/trajectory?platform_id=${encodeURIComponent(platformId)}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Argo trajectory for ${platformId}: ${response.status}`
    );
  }

  const data = await response.json();
  return normalizeArray<ArgoTrajectoryPoint>(data, [
    'trajectory',
    'points',
    'data',
    'results',
  ]);
}

export async function getArgoProfile(
  platformId: string,
  cycleNumber?: number
): Promise<ArgoProfilePoint[]> {
  const query = cycleNumber
    ? `?platform_id=${encodeURIComponent(platformId)}&cycle_number=${cycleNumber}`
    : `?platform_id=${encodeURIComponent(platformId)}`;

  const response = await fetch(`${BASE_URL}/api/argo/profile${query}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Argo profile for ${platformId}: ${response.status}`
    );
  }

  const data = await response.json();
  return normalizeArray<ArgoProfilePoint>(data, [
    'profile',
    'profiles',
    'data',
    'results',
  ]);
}
