const BASE_URL = 'https://sih2026-oceanx.onrender.com';

export interface GliderPlatform {
  glider_id: string;
  glider_name?: string;
  latitude: number;
  longitude: number;
  last_seen?: string;
}

export interface GliderMarker {
  id: string;
  type: 'GLIDER';
  latitude: number;
  longitude: number;
  depth?: number;
  time?: string;
}

export interface GliderTrajectoryPoint {
  observation_time: string;
  latitude: number;
  longitude: number;
}

export interface GliderProfilePoint {
  observation_time: string;
  depth: number;
  temperature: number | null;
  salinity: number | null;
}

export interface GliderProfileResponse {
  glider_id: string;
  count: number;
  selected_observation_time: string;
  profile: GliderProfilePoint[];
}

/* -----------------------------------------
   LIST GLIDERS
----------------------------------------- */

export async function getGliders(): Promise<GliderPlatform[]> {
  const response = await fetch(
    `${BASE_URL}/api/glider/gliders`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Gliders: ${response.status}`
    );
  }

  const data = await response.json();

  return Array.isArray(data)
    ? data
    : data.gliders ?? [];
}

/* -----------------------------------------
   TRAJECTORY
----------------------------------------- */

export async function getGliderTrajectory(
  gliderId: string
): Promise<GliderTrajectoryPoint[]> {
  const response = await fetch(
    `${BASE_URL}/api/glider/${encodeURIComponent(gliderId)}/trajectory`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Glider trajectory: ${response.status}`
    );
  }

  const data = await response.json();

  return Array.isArray(data)
    ? data
    : data.trajectory ?? [];
}

/* -----------------------------------------
   PROFILE
----------------------------------------- */

export async function getGliderProfile(
  gliderId: string,
  observationTime: string
): Promise<GliderProfileResponse> {
  const params = new URLSearchParams({
    observation_time: observationTime,
  });

  const response = await fetch(
    `${BASE_URL}/api/glider/${encodeURIComponent(gliderId)}/profile?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Glider profile: ${response.status}`
    );
  }

  return response.json();
}

/* -----------------------------------------
   COMPARISON & SUMMARY
----------------------------------------- */

export async function getGliderComparison(
  gliderId: string,
  limit = 100,
  offset = 0
) {
  const params = new URLSearchParams({
    glider_id: gliderId,
    limit: String(limit),
    offset: String(offset),
  });

  const response = await fetch(
    `${BASE_URL}/api/comparison/glider?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Glider comparison: ${response.status}`
    );
  }

  return response.json();
}

export async function getGliderComparisonSummary(
  gliderId?: string
) {
  const url = gliderId
    ? `${BASE_URL}/api/comparison/glider/summary?glider_id=${encodeURIComponent(gliderId)}`
    : `${BASE_URL}/api/comparison/glider/summary`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Glider summary: ${response.status}`
    );
  }

  return response.json();
}
