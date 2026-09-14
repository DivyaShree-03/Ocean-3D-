import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ModelFieldLayer from './ModelFieldLayer';
import { GeographicLandLayer } from './GeographicLandLayer';
import { CurrentLayer } from './CurrentLayer';
import { ArgoLayer } from './ArgoLayer';
import { GliderLayer } from './GliderLayer';
import { useExplorerStore } from '../store/explorerStore';
import { SCENE_BOUNDS } from '../utils/geoToScene';
import type { ArgoMarker } from '../services/argoService';
import type { ModelField, ScalarVariable } from '../services/modelService';

interface OceanSceneProps {
  resetKey?: number;
  argoMarkers?: ArgoMarker[];
  onSelectArgo?: (id: string) => void;
  scalarField?: ModelField | null;
  uField?: ModelField | null;
  vField?: ModelField | null;
  variable?: ScalarVariable;
  selectedDepth?: number;
  verticalExaggeration?: number;
}

export const OceanSceneContent: React.FC<{
  argoMarkers?: ArgoMarker[];
  onSelectArgo?: (id: string) => void;
  scalarField?: ModelField | null;
  uField?: ModelField | null;
  vField?: ModelField | null;
  variable?: ScalarVariable;
  selectedDepth?: number;
  verticalExaggeration?: number;
}> = ({
  argoMarkers,
  onSelectArgo,
  scalarField,
  uField,
  vField,
  variable = 'thetao',
  selectedDepth = 0,
  verticalExaggeration: customExaggeration,
}) => {
  const opacity = useExplorerStore((state) => state.opacity);
  const storeExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const setDepthScreenRange = useExplorerStore((state) => state.setDepthScreenRange);

  const verticalExaggeration = customExaggeration ?? storeExaggeration;

  // Compute volume scale dimensions
  const scaleX = SCENE_BOUNDS.VOLUME_SIZE.x;
  const scaleY = SCENE_BOUNDS.VOLUME_SIZE.yBase * verticalExaggeration;
  const scaleZ = SCENE_BOUNDS.VOLUME_SIZE.z;

  // Project 3D surface and ocean bottom to 2D screen pixels for depth HUD scale
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

      {/* Live Model Field Layer (Temperature / Salinity 2D Slice positioned at 3D physical selectedDepth) */}
      <ModelFieldLayer
        field={scalarField ?? null}
        variable={variable}
        opacity={opacity}
        selectedDepth={selectedDepth}
        verticalExaggeration={verticalExaggeration}
      />

      {/* Surface/Depth Current Trajectory Layer (Positioned at 3D physical selectedDepth) */}
      <CurrentLayer
        uField={uField}
        vField={vField}
        selectedDepth={selectedDepth}
        verticalExaggeration={verticalExaggeration}
      />

      {/* Real Argo Float Layer (surface floats) */}
      <ArgoLayer observations={argoMarkers} onSelect={onSelectArgo} />

      {/* Underwater Glider Layer */}
      <GliderLayer />

      {/* Camera OrbitControls */}
      <OrbitControls
        minDistance={3.5}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.15}
        target={[0.2, -1.8, -0.8]}
      />
    </>
  );
};

export const OceanScene: React.FC<OceanSceneProps> = ({
  resetKey,
  argoMarkers,
  onSelectArgo,
  scalarField,
  uField,
  vField,
  variable,
  selectedDepth,
  verticalExaggeration,
}) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0B1D33]">
      <Canvas
        key={resetKey}
        camera={{ position: [0.32, 8.82, 2.18], fov: 38 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <OceanSceneContent
          argoMarkers={argoMarkers}
          onSelectArgo={onSelectArgo}
          scalarField={scalarField}
          uField={uField}
          vField={vField}
          variable={variable}
          selectedDepth={selectedDepth}
          verticalExaggeration={verticalExaggeration}
        />
      </Canvas>
    </div>
  );
};
