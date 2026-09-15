import React, { useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ModelFieldLayer from './ModelFieldLayer';
import { OceanVolumeLayer } from './OceanVolumeLayer';
import { GeographicLandLayer } from './GeographicLandLayer';
import { CurrentLayer } from './CurrentLayer';
import MultiDepthSliceLayer from './MultiDepthSliceLayer';
import { ArgoLayer } from './ArgoLayer';
import { GliderLayer } from './GliderLayer';
import { Trajectory3DLayer } from './Trajectory3DLayer';
import { useExplorerStore } from '../store/explorerStore';
import { SCENE_BOUNDS, geoToScene } from '../utils/geoToScene';
import { generateDemoOceanVolume } from '../data/demoOcean';
import { buildGlider3DZigzag } from '../types/trajectoryUtils';
import type { ArgoMarker } from '../services/argoService';
import type { GliderMarker } from '../services/gliderService';
import type { ModelField, ScalarVariable } from '../services/modelService';
import type { VisualTrajectoryPoint } from '../types/trajectory';

interface OceanSceneProps {
  resetKey?: number;
  argoMarkers?: ArgoMarker[];
  gliderMarkers?: GliderMarker[];
  onSelectArgo?: (id: string) => void;
  onSelectGlider?: (id: string) => void;
  argoTrajectories?: Record<string, VisualTrajectoryPoint[]>;
  gliderTrajectories?: Record<string, VisualTrajectoryPoint[]>;
  selectedInstrumentId?: string | null;
  scalarField?: ModelField | null;
  uField?: ModelField | null;
  vField?: ModelField | null;
  variable?: ScalarVariable;
  selectedDepth?: number;
  verticalExaggeration?: number;
  showMultiDepthSlices?: boolean;
  demoTimeStep?: number;
  onDepthAxisProjection?: (value: { top: number; bottom: number; left: number }) => void;
}

function DepthProjectionTracker({
  verticalExaggeration,
  onChange,
}: {
  verticalExaggeration: number;
  onChange?: (value: { top: number; bottom: number; left: number }) => void;
}) {
  const { camera, size } = useThree();

  useFrame(() => {
    if (!onChange) return;

    const [topX, topYWorld, topZ] = geoToScene(60.0, 0.0, 0, verticalExaggeration);
    const [botX, botYWorld, botZ] = geoToScene(60.0, 0.0, 5500, verticalExaggeration);

    const top3D = new THREE.Vector3(topX, topYWorld, topZ);
    const bot3D = new THREE.Vector3(botX, botYWorld, botZ);

    top3D.project(camera);
    bot3D.project(camera);

    const topY = (-top3D.y * 0.5 + 0.5) * size.height;
    const botY = (-bot3D.y * 0.5 + 0.5) * size.height;
    const leftX = (top3D.x * 0.5 + 0.5) * size.width;

    onChange({
      top: Math.min(topY, botY),
      bottom: Math.max(topY, botY),
      left: leftX,
    });
  });

  return null;
}

export const OceanSceneContent: React.FC<{
  argoMarkers?: ArgoMarker[];
  gliderMarkers?: GliderMarker[];
  onSelectArgo?: (id: string) => void;
  onSelectGlider?: (id: string) => void;
  argoTrajectories?: Record<string, VisualTrajectoryPoint[]>;
  gliderTrajectories?: Record<string, VisualTrajectoryPoint[]>;
  selectedInstrumentId?: string | null;
  scalarField?: ModelField | null;
  uField?: ModelField | null;
  vField?: ModelField | null;
  variable?: ScalarVariable;
  selectedDepth?: number;
  verticalExaggeration?: number;
  showMultiDepthSlices?: boolean;
  demoTimeStep?: number;
  onDepthAxisProjection?: (value: { top: number; bottom: number; left: number }) => void;
}> = ({
  argoMarkers,
  gliderMarkers,
  onSelectArgo,
  onSelectGlider,
  argoTrajectories,
  gliderTrajectories,
  selectedInstrumentId,
  scalarField,
  uField,
  vField,
  variable = 'thetao',
  selectedDepth = 0,
  verticalExaggeration: customExaggeration,
  showMultiDepthSlices = true,
  demoTimeStep = 0,
  onDepthAxisProjection,
}) => {
  const opacity = useExplorerStore((state) => state.opacity);
  const storeExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const depthMin = useExplorerStore((state) => state.depthMin);
  const depthMax = useExplorerStore((state) => state.depthMax);
  const setDepthScreenRange = useExplorerStore((state) => state.setDepthScreenRange);

  const verticalExaggeration = customExaggeration ?? storeExaggeration;

  // Generate 3D volume dataset once for water-column bounding volume context
  const volumeData = useMemo(() => generateDemoOceanVolume(), []);

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

  // Calculate active 3D trajectories
  const activeArgoTrajectory = selectedInstrumentId && argoTrajectories?.[selectedInstrumentId];
  const activeGliderRawTrajectory = selectedInstrumentId && gliderTrajectories?.[selectedInstrumentId];

  const activeGliderTrajectory = useMemo(() => {
    if (!activeGliderRawTrajectory) return undefined;
    return buildGlider3DZigzag(activeGliderRawTrajectory, 1000, 4);
  }, [activeGliderRawTrajectory]);

  return (
    <>
      <color attach="background" args={['#0B1D33']} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[10, 24, 15]} intensity={1.3} />
      <directionalLight position={[-10, 15, -10]} intensity={0.4} />

      {/* Track projected screen bounds of 3D cube for DepthAxis HUD overlay */}
      <DepthProjectionTracker
        verticalExaggeration={verticalExaggeration}
        onChange={onDepthAxisProjection}
      />

      {/* 3D Geographic Land Layer */}
      <GeographicLandLayer />

      {/* 3D Water Column Volume Container (Transparent 0-5500m Context Box) */}
      <OceanVolumeLayer
        volume={volumeData}
        opacity={opacity * 0.35}
        verticalExaggeration={verticalExaggeration}
        depthMin={depthMin}
        depthMax={depthMax}
      />

      {/* Neutral depth reference planes */}
      {showMultiDepthSlices && (
        <MultiDepthSliceLayer
          variable={variable}
          timeStep={demoTimeStep}
          verticalExaggeration={verticalExaggeration}
          opacity={opacity}
          selectedDepth={scalarField?.selectedDepth ?? selectedDepth}
          visible={true}
        />
      )}

      {/* REAL BACKEND / MODEL DATA LAYER */}
      {scalarField && (
        <ModelFieldLayer
          field={scalarField}
          variable={variable}
          opacity={opacity}
          selectedDepth={scalarField.selectedDepth ?? selectedDepth}
          depthSliceEnabled={showMultiDepthSlices}
          verticalExaggeration={verticalExaggeration}
        />
      )}

      {/* Surface Current Trajectory Layer (Positioned at active depth) */}
      <CurrentLayer
        uField={uField}
        vField={vField}
        selectedDepth={scalarField?.selectedDepth ?? selectedDepth}
        verticalExaggeration={verticalExaggeration}
        demoTimeStep={demoTimeStep}
      />

      {/* 3D Trajectory Line Ribbons (Cyan for Argo, Orange for Glider) */}
      {activeArgoTrajectory && (
        <Trajectory3DLayer
          points={activeArgoTrajectory}
          type="ARGO"
          verticalExaggeration={verticalExaggeration}
        />
      )}

      {activeGliderTrajectory && (
        <Trajectory3DLayer
          points={activeGliderTrajectory}
          type="GLIDER"
          verticalExaggeration={verticalExaggeration}
        />
      )}

      {/* Real / Animated Argo Float Layer */}
      <ArgoLayer
        observations={argoMarkers}
        onSelect={onSelectArgo}
        argoTrajectories={argoTrajectories}
      />

      {/* Live Underwater Glider Layer */}
      <GliderLayer
        observations={gliderMarkers}
        onSelect={onSelectGlider}
      />

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
  gliderMarkers,
  onSelectArgo,
  onSelectGlider,
  argoTrajectories,
  gliderTrajectories,
  selectedInstrumentId,
  scalarField,
  uField,
  vField,
  variable,
  selectedDepth,
  verticalExaggeration,
  showMultiDepthSlices,
  demoTimeStep,
  onDepthAxisProjection,
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
          gliderMarkers={gliderMarkers}
          onSelectArgo={onSelectArgo}
          onSelectGlider={onSelectGlider}
          argoTrajectories={argoTrajectories}
          gliderTrajectories={gliderTrajectories}
          selectedInstrumentId={selectedInstrumentId}
          scalarField={scalarField}
          uField={uField}
          vField={vField}
          variable={variable}
          selectedDepth={selectedDepth}
          verticalExaggeration={verticalExaggeration}
          showMultiDepthSlices={showMultiDepthSlices}
          demoTimeStep={demoTimeStep}
          onDepthAxisProjection={onDepthAxisProjection}
        />
      </Canvas>
    </div>
  );
};
