import { Html } from '@react-three/drei';

export type InstrumentMarkerProps = {
  id: string;
  type: 'ARGO' | 'GLIDER';
  position: [number, number, number];
  selectedInstrumentId: string | null;
  onSelect: (id: string) => void;
};

function ArgoMarker({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: '#F4C542',
        border: '2px solid #8A6A00',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected
          ? '0 0 0 4px rgba(244,197,66,0.25), 0 0 12px rgba(244,197,66,0.7)'
          : '0 2px 6px rgba(0,0,0,0.30)',
      }}
    >
      <svg width="10" height="14" viewBox="0 0 30 60">
        <line x1="15" y1="3" x2="15" y2="14" stroke="#152235" strokeWidth="3" />
        <rect x="9" y="14" width="12" height="13" rx="2" fill="#FFF3A5" />
        <rect x="10" y="27" width="10" height="21" fill="#152235" />
        <polygon points="10,48 20,48 15,57" fill="#64748B" />
      </svg>
    </div>
  );
}

function GliderMarker({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: 28,
        height: 17,
        borderRadius: 999,
        background: '#FB923C',
        border: '2px solid #9A4A12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected
          ? '0 0 0 4px rgba(251,146,60,0.25), 0 0 12px rgba(251,146,60,0.7)'
          : '0 2px 6px rgba(0,0,0,0.30)',
      }}
    >
      <svg width="19" height="12" viewBox="0 0 40 40">
        <rect x="5" y="17" width="27" height="7" rx="3.5" fill="#FFF1D6" />
        <polygon points="32,17 38,20.5 32,24" fill="#FFF1D6" />
        <rect x="10" y="20" width="17" height="3" fill="#152235" />
        <polygon points="18,20 8,7 12,7 23,20" fill="#152235" />
        <polygon points="18,21 8,34 12,34 23,21" fill="#152235" />
      </svg>
    </div>
  );
}

export function InstrumentMarker({
  id,
  type,
  position,
  selectedInstrumentId,
  onSelect,
}: InstrumentMarkerProps) {
  const isSelected = selectedInstrumentId === id;
  const hasSelection = selectedInstrumentId !== null;

  const opacity = isSelected ? 1 : hasSelection ? 0.45 : 0.9;
  const scale = isSelected ? 1.15 : 1;

  return (
    <group position={position}>
      <Html
        center
        zIndexRange={[5, 0]}
        style={{
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
          title={type === 'ARGO' ? `Argo ${id}` : `Glider ${id}`}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            opacity,
            transform: `scale(${scale})`,
            transition: 'transform 180ms ease, opacity 180ms ease',
          }}
        >
          {type === 'ARGO' ? (
            <ArgoMarker selected={isSelected} />
          ) : (
            <GliderMarker selected={isSelected} />
          )}
        </button>
      </Html>
    </group>
  );
}

export default InstrumentMarker;
