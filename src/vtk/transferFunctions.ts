import * as THREE from 'three';

export interface ColorStop {
  temp: number; // Temperature in °C
  hex: string;
  r: number;
  g: number;
  b: number;
}

export const THERMAL_COLOR_STOPS: ColorStop[] = [
  { temp: 0.0,  hex: '#29105F', r: 0.1608, g: 0.0627, b: 0.3725 },
  { temp: 4.0,  hex: '#2624A6', r: 0.1490, g: 0.1412, b: 0.6510 },
  { temp: 8.0,  hex: '#1746D1', r: 0.0902, g: 0.2745, b: 0.8196 },
  { temp: 12.0, hex: '#0088E8', r: 0.0000, g: 0.5333, b: 0.9098 },
  { temp: 16.0, hex: '#00C8D7', r: 0.0000, g: 0.7843, b: 0.8431 },
  { temp: 20.0, hex: '#51D46A', r: 0.3176, g: 0.8314, b: 0.4157 },
  { temp: 24.0, hex: '#F2DC36', r: 0.9490, g: 0.8627, b: 0.2118 },
  { temp: 27.0, hex: '#FF9D24', r: 1.0000, g: 0.6157, b: 0.1412 },
  { temp: 30.0, hex: '#FF5318', r: 1.0000, g: 0.3255, b: 0.0941 },
  { temp: 32.0, hex: '#E51D28', r: 0.8980, g: 0.1137, b: 0.1569 },
];

/**
 * Creates a 256x1 RGBA DataTexture representing the thermal color transfer function.
 * Used by GLSL ray-marching shaders to map normalized temperature [0, 1] to RGBA.
 */
export function createTransferFunctionTexture(stops = THERMAL_COLOR_STOPS): THREE.DataTexture {
  const width = 256;
  const data = new Uint8Array(width * 4);

  const minTemp = stops[0].temp;
  const maxTemp = stops[stops.length - 1].temp;

  for (let i = 0; i < width; i++) {
    const norm = i / (width - 1);
    const temp = minTemp + norm * (maxTemp - minTemp);

    // Find bounding color stops
    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let s = 0; s < stops.length - 1; s++) {
      if (temp >= stops[s].temp && temp <= stops[s + 1].temp) {
        lower = stops[s];
        upper = stops[s + 1];
        break;
      }
    }

    const span = upper.temp - lower.temp;
    const factor = span > 0 ? (temp - lower.temp) / span : 0;

    const r = lower.r + factor * (upper.r - lower.r);
    const g = lower.g + factor * (upper.g - lower.g);
    const b = lower.b + factor * (upper.b - lower.b);

    // Dynamic alpha: surface warm water slightly more opaque, deep water smooth translucency
    const alpha = Math.min(1.0, 0.4 + 0.6 * norm);

    data[i * 4 + 0] = Math.round(r * 255);
    data[i * 4 + 1] = Math.round(g * 255);
    data[i * 4 + 2] = Math.round(b * 255);
    data[i * 4 + 3] = Math.round(alpha * 255);
  }

  const texture = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
