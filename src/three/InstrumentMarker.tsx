import { Html } from '@react-three/drei';

export type InstrumentMarkerProps = {
  id: string;
  type: 'ARGO' | 'GLIDER';
  position: [number, number, number];
  selectedInstrumentId: string | null;
  onSelect: (id: string) => void;
};

const ARGO_COLOR = '#38BDF8';
const GLIDER_COLOR = '#FB923C';

function ArgoMarker({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: 22,
        height: 30,
        opacity: selected ? 1.0 : 0.65,
        transition: 'opacity 150ms ease, transform 150ms ease',
        transform: selected ? 'scale(1.12)' : 'scale(1)',
        cursor: 'pointer',
        filter: selected
          ? 'drop-shadow(0 0 8px rgba(56,189,248,0.8))'
          : 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 30 60">
        <line
          x1="15"
          y1="4"
          x2="15"
          y2="14"
          stroke={ARGO_COLOR}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <rect x="9" y="14" width="12" height="13" rx="2" fill={ARGO_COLOR} />
        <rect x="10" y="28" width="10" height="20" rx="2" fill={ARGO_COLOR} />
        <polygon points="10,48 20,48 15,57" fill={ARGO_COLOR} />
      </svg>
    </div>
  );
}

function GliderMarker({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: 30,
        height: 22,
        opacity: selected ? 1.0 : 0.65,
        transition: 'opacity 150ms ease, transform 150ms ease',
        transform: selected ? 'scale(1.12)' : 'scale(1)',
        cursor: 'pointer',
        filter: selected
          ? 'drop-shadow(0 0 8px rgba(251,146,60,0.8))'
          : 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 40 40">
        <rect x="5" y="17" width="27" height="7" rx="3.5" fill={GLIDER_COLOR} />
        <polygon points="32,17 38,20.5 32,24" fill={GLIDER_COLOR} />
        <polygon points="18,20 8,7 12,7 23,20" fill={GLIDER_COLOR} />
        <polygon points="18,21 8,34 12,34 23,21" fill={GLIDER_COLOR} />
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
            outline: 'none',
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
