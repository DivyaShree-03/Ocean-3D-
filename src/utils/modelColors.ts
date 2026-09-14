import * as THREE from 'three';

export const TEMPERATURE_COLORS = [
  '#29105F',
  '#2624A6',
  '#1746D1',
  '#0088E8',
  '#00C8D7',
  '#51D46A',
  '#F2DC36',
  '#FF9D24',
  '#FF5318',
  '#E51D28',
];

export const SALINITY_COLORS = [
  '#352A87',
  '#2457C5',
  '#1595D3',
  '#20B8B0',
  '#45C878',
  '#8BD05B',
  '#D0D95A',
];

export function getScalarColor(
  value: number,
  min: number,
  max: number,
  variable: 'thetao' | 'so'
): THREE.Color {
  const palette =
    variable === 'thetao' ? TEMPERATURE_COLORS : SALINITY_COLORS;

  const denominator = Math.max(max - min, 0.000001);

  const normalized = THREE.MathUtils.clamp(
    (value - min) / denominator,
    0,
    1
  );

  const scaled = normalized * (palette.length - 1);
  const left = Math.floor(scaled);
  const right = Math.min(left + 1, palette.length - 1);
  const t = scaled - left;

  const c1 = new THREE.Color(palette[left]);
  const c2 = new THREE.Color(palette[right]);

  return c1.lerp(c2, t);
}
