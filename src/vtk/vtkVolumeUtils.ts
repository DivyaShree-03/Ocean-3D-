import * as THREE from 'three';
import type { OceanVolumeData } from '../types/ocean';

/**
 * Creates a Three.js Data3DTexture backed by an Float32 scalar array.
 * Uses RedFormat and FloatType for high-precision WebGL2 sampler3D sampling.
 */
export function createData3DTexture(volume: OceanVolumeData): THREE.Data3DTexture {
  const { nx, ny, nz } = volume.dimensions;
  
  // Create Float32Array for GPU sampling
  const texture = new THREE.Data3DTexture(volume.scalars, nx, ny, nz);
  texture.format = THREE.RedFormat;
  texture.type = THREE.FloatType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Helper to compute min and max temperature scalar values in the array
 */
export function computeScalarRange(scalars: Float32Array): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < scalars.length; i++) {
    const val = scalars[i];
    if (val < min) min = val;
    if (val > max) max = val;
  }
  return { min, max };
}
