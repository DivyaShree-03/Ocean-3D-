import type { OceanVolumeData } from '../types/ocean';

/**
 * Utility functions for depth slicing and bounds clipping calculations.
 */
export function getDepthSliceIndices(
  volume: OceanVolumeData,
  minDepthMeters: number,
  maxDepthMeters: number
): { minSliceNorm: number; maxSliceNorm: number } {
  const totalDepth = volume.bounds.maxDepth - volume.bounds.minDepth;
  const minSliceNorm = Math.max(0.0, Math.min(1.0, minDepthMeters / totalDepth));
  const maxSliceNorm = Math.max(0.0, Math.min(1.0, maxDepthMeters / totalDepth));
  
  return { minSliceNorm, maxSliceNorm };
}
