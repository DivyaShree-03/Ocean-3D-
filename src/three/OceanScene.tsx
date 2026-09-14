import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { generateDemoOceanVolume } from '../data/demoOcean';
import { OceanVolumeLayer } from './OceanVolumeLayer';
import { GeographicLandLayer } from './GeographicLandLayer';
import { CurrentLayer } from './CurrentLayer';
import { ArgoLayer } from './ArgoLayer';
import { GliderLayer } from './GliderLayer';
import { useExplorerStore } from '../store/explorerStore';
import { SCENE_BOUNDS } from '../utils/geoToScene';

export const OceanSceneContent: React.FC = () => {
  const opacity = useExplorerStore((state) => state.opacity);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const depthMin = useExplorerStore((state) => state.depthMin);
  const depthMax = useExplorerStore((state) => state.depthMax);
  const setDepthScreenRange = useExplorerStore((state) => state.setDepthScreenRange);

  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Generate 3D volume dataset once
  const volumeData = useMemo(() => generateDemoOceanVolume(), []);

  // Compute volume scale dimensions
  const scaleX = SCENE_BOUNDS.VOLUME_SIZE.x; // 16.0
  const scaleY = SCENE_BOUNDS.VOLUME_SIZE.yBase * verticalExaggeration; // 4.0 * exaggeration
  const scaleZ = SCENE_BOUNDS.VOLUME_SIZE.z; // 12.0

  // Project 3D surface (Y=0) and ocean bottom (Y=-scaleY) to 2D screen pixels for depth HUD scale
  useFrame(({ camera, size }) => {
    const top3D = new THREE.Vector3(-scaleX / 2, 0, scaleZ / 2);
    const bot3D = new THREE.Vector3(-scaleX / 2, -scaleY, scaleZ / 2);

    top3D.project(camera);
    bot3D.project(camera);

    const topPixelY = ((1 - top3D.y) / 2) * size.height;
    const botPixelY = ((1 - bot3D.y) / 2) * size.height;

    setDepthScreenRange({ top: topPixelY, bottom: botPixelY });
  });

  return (
    <>
      <color attach="background" args={['#0B1D33']} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[10, 24, 15]} intensity={1.3} />
      <directionalLight position={[-10, 15, -10]} intensity={0.4} />

      {/* 3D Geographic Land Layer */}
      <GeographicLandLayer />

      {/* GPU Ray-Marching 3D Temperature Volume Layer with Land Mask */}
      <OceanVolumeLayer
        volume={volumeData}
        opacity={opacity}
        verticalExaggeration={verticalExaggeration}
        depthMin={depthMin}
        depthMax={depthMax}
      />

      {/* Surface Current Trajectory Layer */}
      <CurrentLayer />

      {/* Argo Float Layer */}
      <ArgoLayer />

      {/* Underwater Glider Layer */}
      <GliderLayer />

      {/* Camera OrbitControls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
        minDistance={11}
        maxDistance={28}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.15}
        target={[0.2, -1.8, -0.8]}
      />
    </>
  );
};

export const OceanScene: React.FC<{ resetKey?: number }> = ({ resetKey }) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0B1D33]">
      <Canvas
        key={resetKey}
        camera={{ position: [0.5, 14.8, 19.5], fov: 38 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <OceanSceneContent />
      </Canvas>
    </div>
  );
};
