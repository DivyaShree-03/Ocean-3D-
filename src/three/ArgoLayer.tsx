import React, { useMemo } from 'react';
import { useExplorerStore } from '../store/explorerStore';
import { isLandCoordinate } from '../geography/landMask';
import type { ArgoMarker as ArgoMarkerData } from '../services/argoService';
import type { VisualTrajectoryPoint } from '../types/trajectory';
import AnimatedArgoMarker from './AnimatedArgoMarker';

interface ArgoLayerProps {
  observations?: ArgoMarkerData[];
  onSelect?: (id: string) => void;
  argoTrajectories?: Record<string, VisualTrajectoryPoint[]>;
}

const SingleArgoMarkerItem: React.FC<{
  argo: ArgoMarkerData;
  onSelect?: (id: string) => void;
  verticalExaggeration: number;
  selectedInstrumentId: string | null;
  trajectory?: VisualTrajectoryPoint[];
}> = ({ argo, onSelect, verticalExaggeration, selectedInstrumentId, trajectory }) => {
  const setSelectedInstrumentId = useExplorerStore((state) => state.setSelectedInstrumentId);

  const isLand = useMemo(() => {
    return isLandCoordinate(argo.longitude, argo.latitude);
  }, [argo.longitude, argo.latitude]);

  if (isLand) return null;

  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
    } else {
      setSelectedInstrumentId(id);
    }
  };

  return (
    <AnimatedArgoMarker
      id={argo.id}
      latitude={argo.latitude}
      longitude={argo.longitude}
      depth={argo.depth ?? 0}
      trajectory={trajectory}
      active={selectedInstrumentId === argo.id}
      verticalExaggeration={verticalExaggeration}
      selectedInstrumentId={selectedInstrumentId}
      onSelect={handleSelect}
    />
  );
};

export const ArgoLayer: React.FC<ArgoLayerProps> = ({
  observations = [],
  onSelect,
  argoTrajectories = {},
}) => {
  const showArgo = useExplorerStore((state) => state.showArgo);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const selectedInstrumentId = useExplorerStore((state) => state.selectedInstrumentId);

  if (!showArgo || !observations.length) return null;

  return (
    <group>
      {observations.map((argo) => (
        <SingleArgoMarkerItem
          key={argo.id}
          argo={argo}
          selectedInstrumentId={selectedInstrumentId}
          onSelect={onSelect}
          verticalExaggeration={verticalExaggeration}
          trajectory={argoTrajectories[argo.id]}
        />
      ))}
    </group>
  );
};
