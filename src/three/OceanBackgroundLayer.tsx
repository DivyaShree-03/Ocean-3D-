import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENE_BOUNDS } from '../utils/geoToScene';
import { createLandMaskTexture } from '../geography/landMask';

export const OceanBackgroundLayer: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Background plane dimensions (slightly larger than volume bounds)
  const width = SCENE_BOUNDS.VOLUME_SIZE.x * 1.5; // 24.0
  const height = SCENE_BOUNDS.VOLUME_SIZE.z * 1.5; // 18.0

  // 2D Land Mask Texture
  const landMaskTexture = useMemo(() => createLandMaskTexture(512, 512), []);

  // Custom Shader Material for blue ocean background ambience masked to ocean regions
  const backgroundShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;
        varying vec2 vMaskUv;

        void main() {
          vUv = uv;

          // Map world plane coordinates to land mask UV space [0, 1]
          vMaskUv = (position.xy / vec2(16.0, 12.0)) + vec2(0.5);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform sampler2D u_landMask;
        varying vec2 vUv;
        varying vec2 vMaskUv;

        void main() {
          // Strictly mask out land areas (no wave motion or blue backdrop over land)
          if (vMaskUv.x >= 0.0 && vMaskUv.x <= 1.0 && vMaskUv.y >= 0.0 && vMaskUv.y <= 1.0) {
            float land = texture(u_landMask, vMaskUv).r;
            if (land >= 0.5) {
              discard;
            }
          }

          // Palette: Deep Ocean Blue (#0E4D78), Medium Ocean Blue (#1A6D9B), Soft Cyan (#3EA0C8)
          vec3 deepBlue   = vec3(0.055, 0.302, 0.471); // #0E4D78
          vec3 mediumBlue = vec3(0.102, 0.427, 0.608); // #1A6D9B
          vec3 softCyan   = vec3(0.243, 0.627, 0.784); // #3EA0C8
          vec3 highlight  = vec3(1.0, 1.0, 1.0);

          // Very slow, low-frequency diagonal wave flow motion
          float t = uTime * 0.35;
          float wave1 = sin(vUv.x * 6.0 + vUv.y * 4.0 + t) * 0.5 + 0.5;
          float wave2 = cos(vUv.x * 3.5 - vUv.y * 7.0 + t * 0.8) * 0.5 + 0.5;
          float wavePattern = wave1 * 0.6 + wave2 * 0.4;

          // Soft pale wave highlights
          float band = pow(wavePattern, 3.0) * 0.12;

          vec3 oceanBase = mix(deepBlue, mediumBlue, vUv.y);
          oceanBase = mix(oceanBase, softCyan, wavePattern * 0.35);
          vec3 finalColor = mix(oceanBase, highlight, band);

          // Subdued marine backdrop opacity (0.45 to 0.65)
          float alpha = 0.50 + band * 0.10;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        u_landMask: { value: landMaskTexture },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [landMaskTexture]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.015, 0]}
    >
      <planeGeometry args={[width, height, 32, 32]} />
      <primitive object={backgroundShader} ref={materialRef} attach="material" />
    </mesh>
  );
};
