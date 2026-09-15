import React, { useMemo } from 'react';
import { useExplorerStore } from '../store/explorerStore';
import { geoToScene } from '../utils/geoToScene';
import { toSceneDepth } from '../utils/depthUtils';
import { isLandCoordinate } from '../geography/landMask';
import type { GliderMarker } from '../services/gliderService';
import { InstrumentMarker } from './InstrumentMarker';

interface GliderLayerProps {
  observations?: GliderMarker[];
  onSelect?: (id: string) => void;
}

const SingleGliderMarker: React.FC<{
  glider: GliderMarker;
  onSelect?: (id: string) => void;
  verticalExaggeration: number;
  selectedInstrumentId: string | null;
}> = ({ glider, onSelect, verticalExaggeration, selectedInstrumentId }) => {
  const setSelectedInstrumentId = useExplorerStore((state) => state.setSelectedInstrumentId);

  const isLand = useMemo(() => {
    return isLandCoordinate(glider.longitude, glider.latitude);
  }, [glider.longitude, glider.latitude]);

  const gliderPos = useMemo<[number, number, number]>(() => {
    return geoToScene(
      glider.longitude,
      glider.latitude,
      toSceneDepth(glider.depth),
      verticalExaggeration
    );
  }, [glider.longitude, glider.latitude, glider.depth, verticalExaggeration]);

  if (isLand) return null;

  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
    } else {
      setSelectedInstrumentId(id);
    }
  };

  return (
    <InstrumentMarker
      id={glider.id}
      type="GLIDER"
      position={gliderPos}
      selectedInstrumentId={selectedInstrumentId}
      onSelect={handleSelect}
    />
  );
};

export const GliderLayer: React.FC<GliderLayerProps> = ({
  observations = [],
  onSelect,
}) => {
  const showGlider = useExplorerStore((state) => state.showGlider);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const selectedInstrumentId = useExplorerStore((state) => state.selectedInstrumentId);

  if (!showGlider || !observations.length) return null;

  return (
    <group>
      {observations.map((glider) => (
        <SingleGliderMarker
          key={glider.id}
          glider={glider}
          selectedInstrumentId={selectedInstrumentId}
          onSelect={onSelect}
          verticalExaggeration={verticalExaggeration}
        />
      ))}
    </group>
  );
};
