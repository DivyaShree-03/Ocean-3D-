import type { VisualTrajectoryPoint } from './trajectory';

export interface Trajectory3DPoint {
  latitude: number;
  longitude: number;
  depth: number; // positive magnitude internally
  time?: string;
  source: 'backend' | 'simulated';
}

/**
 * Builds 3D zigzag dive trajectory for Gliders.
 * Combines horizontal track lat/lon with depth oscillation cycles.
 */
export function buildGlider3DZigzag(
  points: VisualTrajectoryPoint[],
  maxDepth = 1000,
  diveCycles = 4
): Trajectory3DPoint[] {
  if (!points || points.length === 0) return [];

  const count = points.length;

  return points.map((p, i) => {
    const phase = count > 1 ? i / (count - 1) : 0;
    const wave = Math.abs(Math.sin(phase * Math.PI * diveCycles));
    const depth = Math.min(maxDepth, wave * maxDepth);

    return {
      latitude: p.latitude,
      longitude: p.longitude,
      depth: Math.round(depth),
      time: p.time,
      source: 'simulated' as const,
    };
  });
}
