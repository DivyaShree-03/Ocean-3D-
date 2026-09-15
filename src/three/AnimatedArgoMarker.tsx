import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geoToScene } from '../utils/geoToScene';
import { toSceneDepth } from '../utils/depthUtils';
import type { VisualTrajectoryPoint } from '../types/trajectory';
import InstrumentMarker from './InstrumentMarker';

interface Props {
  id: string;
  latitude: number;
  longitude: number;
  depth?: number;
  trajectory?: VisualTrajectoryPoint[];
  active: boolean;
  verticalExaggeration: number;
  selectedInstrumentId: string | null;
  onSelect: (id: string) => void;
}

export default function AnimatedArgoMarker({
  id,
  latitude,
  longitude,
  depth = 0,
  trajectory = [],
  active,
  verticalExaggeration,
  selectedInstrumentId,
  onSelect,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const isFinishedRef = useRef(false);

  const anchorPosition = useMemo(
    () =>
      geoToScene(
        longitude,
        latitude,
        toSceneDepth(depth),
        verticalExaggeration
      ),
    [longitude, latitude, depth, verticalExaggeration]
  );

  useEffect(() => {
    progressRef.current = 0;
    isFinishedRef.current = false;

    if (groupRef.current && !active) {
      groupRef.current.position.copy(
        new THREE.Vector3(...anchorPosition)
      );
    }
  }, [active, anchorPosition]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    if (!active) {
      groupRef.current.position.lerp(
        new THREE.Vector3(...anchorPosition),
        0.15
      );
      return;
    }

    if (isFinishedRef.current) return;

    // 1-Cycle Dive Animation if trajectory is empty or single-point
    if (trajectory.length < 2) {
      const cycleDuration = 3.5; // seconds
      progressRef.current += delta / cycleDuration;
      const progress = Math.min(progressRef.current, 1.0);

      const targetMaxDepth = depth > 0 ? depth : 1500;
      const depthFactor = Math.sin(Math.PI * progress);
      const currentDiveDepth = targetMaxDepth * depthFactor;

      const pos = geoToScene(
        longitude,
        latitude,
        toSceneDepth(currentDiveDepth),
        verticalExaggeration
      );

      groupRef.current.position.set(pos[0], pos[1], pos[2]);

      if (progress >= 1.0) {
        isFinishedRef.current = true;
      }
      return;
    }

    // Multi-point trajectory sequential dive animation
    const secondsPerSegment = 2.0;
    progressRef.current += delta / secondsPerSegment;

    const segmentCount = trajectory.length - 1;
    const progress = Math.min(progressRef.current, segmentCount);

    const index = Math.min(Math.floor(progress), segmentCount - 1);
    const localT = progress - index;
    const smoothT = localT * localT * (3 - 2 * localT);

    const a = trajectory[index];
    const b = trajectory[index + 1];

    const startPos = geoToScene(
      a.longitude,
      a.latitude,
      toSceneDepth(a.depth),
      verticalExaggeration
    );

    const endPos = geoToScene(
      b.longitude,
      b.latitude,
      toSceneDepth(b.depth),
      verticalExaggeration
    );

    const startVec = new THREE.Vector3(...startPos);
    const endVec = new THREE.Vector3(...endPos);

    groupRef.current.position.lerpVectors(startVec, endVec, smoothT);

    if (progress >= segmentCount) {
      isFinishedRef.current = true;
    }
  });

  return (
    <group ref={groupRef} position={anchorPosition}>
      <InstrumentMarker
        id={id}
        type="ARGO"
        position={[0, 0, 0]}
        selectedInstrumentId={selectedInstrumentId}
        onSelect={onSelect}
      />
    </group>
  );
}
