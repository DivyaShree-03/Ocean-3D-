import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { OceanVolumeData } from '../types/ocean';
import { createData3DTexture } from '../vtk/vtkVolumeUtils';
import { createTransferFunctionTexture } from '../vtk/transferFunctions';
import { createLandMaskTexture } from '../geography/landMask';

interface OceanVolumeLayerProps {
  volume: OceanVolumeData;
  opacity: number;
  verticalExaggeration: number;
  depthMin: number;
  depthMax: number;
}

const vertexShader = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vRayOrigin;

  void main() {
    // Unit cube position [-0.5, 0.5]^3 -> mapped to [0.0, 1.0]^3 local texture space
    vPosition = position + vec3(0.5);

    // Compute ray origin in local box space [0, 1]^3
    vec4 localCam = inverse(modelMatrix) * vec4(cameraPosition, 1.0);
    vRayOrigin = localCam.xyz + vec3(0.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  precision highp sampler3D;

  varying vec3 vPosition;
  varying vec3 vRayOrigin;

  uniform sampler3D u_volume;
  uniform sampler2D u_transferFunction;
  uniform sampler2D u_landMask;
  uniform float u_opacity;
  uniform float u_minDepthNorm; // 0.0 to 1.0
  uniform float u_maxDepthNorm; // 0.0 to 1.0
  uniform float u_minTemp;
  uniform float u_maxTemp;

  // Intersect ray with unit box [0, 1]^3
  bool intersectBox(vec3 ro, vec3 rd, out float t0, out float t1) {
    vec3 boxMin = vec3(0.0);
    vec3 boxMax = vec3(1.0);

    vec3 invR = 1.0 / rd;
    vec3 tbot = invR * (boxMin - ro);
    vec3 ttop = invR * (boxMax - ro);

    vec3 tmin = min(tbot, ttop);
    vec3 tmax = max(tbot, ttop);

    t0 = max(max(tmin.x, tmin.y), tmin.z);
    t1 = min(min(tmax.x, tmax.y), tmax.z);

    return t1 > max(t0, 0.0);
  }

  void main() {
    vec3 rayDir = normalize(vPosition - vRayOrigin);

    float tNear, tFar;
    if (!intersectBox(vRayOrigin, rayDir, tNear, tFar)) {
      discard;
    }

    tNear = max(tNear, 0.0);

    const int STEPS = 180;
    float stepSize = (tFar - tNear) / float(STEPS);

    vec4 accumulatedColor = vec4(0.0);

    for (int i = 0; i < STEPS; i++) {
      float t = tNear + (float(i) + 0.5) * stepSize;
      vec3 samplePos = vRayOrigin + t * rayDir;

      // Check bounds in unit space [0, 1]^3
      if (samplePos.x < 0.0 || samplePos.x > 1.0 ||
          samplePos.y < 0.0 || samplePos.y > 1.0 ||
          samplePos.z < 0.0 || samplePos.z > 1.0) {
        continue;
      }

      // Check Land Mask: Only mask land near top surface layer (y > 0.965) so deep rays sample continuously
      float land = texture(u_landMask, samplePos.xz).r;
      if (land >= 0.5 && samplePos.y > 0.965) {
        continue;
      }

      // Local box space: Y=1.0 is sea surface (0m), Y=0.0 is ocean bottom (5500m)
      float depthFrac = 1.0 - samplePos.y;

      if (depthFrac < u_minDepthNorm || depthFrac > u_maxDepthNorm) {
        continue;
      }

      // Sample scalar temperature from 3D texture
      float temp = texture(u_volume, samplePos).r;

      // Map temperature [0°C, 32°C] to normalized [0.0, 1.0]
      float normTemp = clamp((temp - u_minTemp) / (u_maxTemp - u_minTemp), 0.0, 1.0);

      // Sample RGBA from 1D transfer function texture
      vec4 srcColor = texture(u_transferFunction, vec2(normTemp, 0.5));

      // Smooth edge fading near domain boundaries (eliminates hard rectangular cube walls)
      float edgeFade = smoothstep(0.0, 0.08, samplePos.x) *
                       smoothstep(0.0, 0.08, 1.0 - samplePos.x) *
                       smoothstep(0.0, 0.08, samplePos.z) *
                       smoothstep(0.0, 0.08, 1.0 - samplePos.z) *
                       smoothstep(0.0, 0.12, samplePos.y);

      srcColor.a *= u_opacity * 0.18 * edgeFade; // Step opacity with edge fading

      // Front-to-back alpha blending
      accumulatedColor.rgb += (1.0 - accumulatedColor.a) * srcColor.a * srcColor.rgb;
      accumulatedColor.a += (1.0 - accumulatedColor.a) * srcColor.a;

      if (accumulatedColor.a >= 0.98) {
        break;
      }
    }

    if (accumulatedColor.a < 0.01) {
      discard;
    }

    gl_FragColor = accumulatedColor;
  }
`;

export const OceanVolumeLayer: React.FC<OceanVolumeLayerProps> = ({
  volume,
  opacity,
  verticalExaggeration,
  depthMin,
  depthMax,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // 1. Create Three.js Data3DTexture from volume scalar array
  const volumeTexture = useMemo(() => createData3DTexture(volume), [volume]);

  // 2. Create 1D Transfer Function texture
  const transferTexture = useMemo(() => createTransferFunctionTexture(), []);

  // 3. Create 2D Land Mask texture
  const landMaskTexture = useMemo(() => createLandMaskTexture(512, 512), []);

  // 4. Normalized depth range clipping
  const minDepthNorm = depthMin / volume.bounds.maxDepth;
  const maxDepthNorm = depthMax / volume.bounds.maxDepth;

  // 5. Uniforms
  const uniforms = useMemo(
    () => ({
      u_volume: { value: volumeTexture },
      u_transferFunction: { value: transferTexture },
      u_landMask: { value: landMaskTexture },
      u_opacity: { value: opacity },
      u_minDepthNorm: { value: minDepthNorm },
      u_maxDepthNorm: { value: maxDepthNorm },
      u_minTemp: { value: 0.0 },
      u_maxTemp: { value: 32.0 },
    }),
    [volumeTexture, transferTexture, landMaskTexture]
  );

  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_opacity.value = opacity;
      materialRef.current.uniforms.u_minDepthNorm.value = depthMin / volume.bounds.maxDepth;
      materialRef.current.uniforms.u_maxDepthNorm.value = depthMax / volume.bounds.maxDepth;
    }
  }, [opacity, depthMin, depthMax, volume.bounds.maxDepth]);

  // Volume size: X=16 (width), Y=4 * exaggeration (depth), Z=12 (latitude)
  const VOLUME_SIZE = {
    x: 16.0,
    y: 4.0 * verticalExaggeration,
    z: 12.0,
  };

  const posY = -VOLUME_SIZE.y / 2;

  return (
    <mesh
      ref={meshRef}
      position={[0, posY, 0]}
      scale={[VOLUME_SIZE.x, VOLUME_SIZE.y, VOLUME_SIZE.z]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};
