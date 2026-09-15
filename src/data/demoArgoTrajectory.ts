import type { VisualTrajectoryPoint } from '../types/trajectory';

interface ArgoAnchor {
  latitude: number;
  longitude: number;
  depth: number;
}

const OFFSETS = [
  { lat: 0, lon: 0, depth: 0 },
  { lat: 0.012, lon: 0.018, depth: 150 },
  { lat: 0.025, lon: 0.04, depth: 350 },
  { lat: 0.04, lon: 0.07, depth: 650 },
  { lat: 0.032, lon: 0.10, depth: 350 },
  { lat: 0.018, lon: 0.125, depth: 150 },
  { lat: 0, lon: 0.15, depth: 0 },
];

export function buildDemoArgoTrajectory(
  anchor: ArgoAnchor,
  maxDepth = 2000
): VisualTrajectoryPoint[] {
  const startingDepth = Math.max(0, Math.abs(anchor.depth));

  return OFFSETS.map((offset) => ({
    latitude: anchor.latitude + offset.lat,
    longitude: anchor.longitude + offset.lon,
    depth: Math.min(maxDepth, startingDepth + offset.depth),
  }));
}
