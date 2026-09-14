import React, { useMemo } from 'react';
import { useExplorerStore } from '../store/explorerStore';
import { geoToScene } from '../utils/geoToScene';
import { isLandCoordinate } from '../geography/landMask';
import type { ArgoMarker as ArgoMarkerData } from '../services/argoService';
import { InstrumentMarker } from './InstrumentMarker';

interface ArgoLayerProps {
  observations?: ArgoMarkerData[];
  onSelect?: (id: string) => void;
}

const SingleArgoMarker: React.FC<{
  argo: ArgoMarkerData;
  onSelect?: (id: string) => void;
  verticalExaggeration: number;
  selectedInstrumentId: string | null;
}> = ({ argo, onSelect, verticalExaggeration, selectedInstrumentId }) => {
  const setSelectedInstrumentId = useExplorerStore((state) => state.setSelectedInstrumentId);

  const isLand = useMemo(() => {
    return isLandCoordinate(argo.longitude, argo.latitude);
  }, [argo.longitude, argo.latitude]);

  const floatPos = useMemo<[number, number, number]>(() => {
    return geoToScene(
      argo.longitude,
      argo.latitude,
      0,
      verticalExaggeration
    );
  }, [argo.longitude, argo.latitude, verticalExaggeration]);

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
      id={argo.id}
      type="ARGO"
      position={floatPos}
      selectedInstrumentId={selectedInstrumentId}
      onSelect={handleSelect}
    />
  );
};

export const ArgoLayer: React.FC<ArgoLayerProps> = ({ observations = [], onSelect }) => {
  const showArgo = useExplorerStore((state) => state.showArgo);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const selectedInstrumentId = useExplorerStore((state) => state.selectedInstrumentId);

  if (!showArgo || !observations.length) return null;

  return (
    <group>
      {observations.map((argo) => (
        <SingleArgoMarker
          key={argo.id}
          argo={argo}
          selectedInstrumentId={selectedInstrumentId}
          onSelect={onSelect}
          verticalExaggeration={verticalExaggeration}
        />
      ))}
    </group>
  );
};
