import React, { useMemo } from 'react';
import { useExplorerStore } from '../store/explorerStore';
import { geoToScene } from '../utils/geoToScene';
import { demoGlider } from '../data/demoObservations';
import { isLandCoordinate } from '../geography/landMask';
import { InstrumentMarker } from './InstrumentMarker';

export const GliderLayer: React.FC = () => {
  const showGlider = useExplorerStore((state) => state.showGlider);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const selectedInstrumentId = useExplorerStore((state) => state.selectedInstrumentId);
  const setSelectedInstrumentId = useExplorerStore((state) => state.setSelectedInstrumentId);

  const isLand = useMemo(() => {
    return isLandCoordinate(demoGlider.longitude, demoGlider.latitude);
  }, []);

  const gliderPos = useMemo<[number, number, number]>(() => {
    return geoToScene(
      demoGlider.longitude,
      demoGlider.latitude,
      demoGlider.currentDepth,
      verticalExaggeration
    );
  }, [verticalExaggeration]);

  if (!showGlider || isLand) return null;

  return (
    <InstrumentMarker
      id={demoGlider.id}
      type="GLIDER"
      position={gliderPos}
      selectedInstrumentId={selectedInstrumentId}
      onSelect={(id) => setSelectedInstrumentId(id)}
    />
  );
};
