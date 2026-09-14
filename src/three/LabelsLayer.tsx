import React from 'react';
import { Html } from '@react-three/drei';
import { geoToScene } from '../utils/geoToScene';

interface LabelDef {
  text: string;
  lon: number;
  lat: number;
  type: 'india' | 'main-ocean' | 'sri-lanka' | 'andaman' | 'secondary-country';
  style?: React.CSSProperties;
}

const LABELS: LabelDef[] = [
  // Primary Geographic Focus
  { text: 'INDIA', lon: 78.5, lat: 21.2, type: 'india' },
  { text: 'SRI LANKA', lon: 80.7, lat: 7.2, type: 'sri-lanka' },
  { text: 'Arabian\nSea', lon: 66.8, lat: 14.8, type: 'main-ocean' },
  { text: 'Bay of\nBengal', lon: 89.5, lat: 14.8, type: 'main-ocean' },
  { text: 'Indian Ocean', lon: 79.0, lat: 1.8, type: 'main-ocean', style: { letterSpacing: '0.2em' } },
  { text: 'Andaman &\nNicobar Islands', lon: 93.5, lat: 10.5, type: 'andaman', style: { lineHeight: '1.2' } },

  // Secondary Context Countries
  { text: 'PAKISTAN', lon: 64.5, lat: 24.5, type: 'secondary-country' },
  { text: 'BANGLADESH', lon: 90.0, lat: 23.8, type: 'secondary-country' },
  { text: 'MYANMAR', lon: 95.5, lat: 20.5, type: 'secondary-country' },
  { text: 'THAILAND', lon: 98.0, lat: 12.0, type: 'secondary-country' },
  { text: 'INDONESIA', lon: 96.5, lat: 3.2, type: 'secondary-country' },
];

export const LabelsLayer: React.FC = () => {
  return (
    <group position={[0, 0.05, 0]}>
      {LABELS.map((item, idx) => {
        const [x, , z] = geoToScene(item.lon, item.lat, 0, 1.0);

        let className = '';
        if (item.type === 'india') {
          className = 'text-[18px] font-black tracking-[0.25em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]';
        } else if (item.type === 'sri-lanka') {
          className = 'text-[13px] font-bold text-white tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]';
        } else if (item.type === 'main-ocean') {
          className = 'text-[15px] italic font-bold text-white tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight';
        } else if (item.type === 'andaman') {
          className = 'text-[12px] font-semibold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]';
        } else {
          className = 'text-[10px] font-bold text-slate-200 tracking-wider opacity-85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]';
        }

        return (
          <Html
            key={idx}
            position={[x, 0.05, z]}
            center
            zIndexRange={[100, 0]}
            style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'pre-line' }}
          >
            <div className={`${className} text-center select-none`} style={item.style}>
              {item.text}
            </div>
          </Html>
        );
      })}
    </group>
  );
};
