export interface OceanVolumeDimensions {
  nx: number; // Longitude resolution (e.g. 80)
  ny: number; // Latitude resolution (e.g. 60)
  nz: number; // Depth resolution (e.g. 32)
}

export interface OceanVolumeBounds {
  minLon: number; // 65.0 E
  maxLon: number; // 100.0 E
  minLat: number; // 0.0 N
  maxLat: number; // 25.0 N
  minDepth: number; // 0 m
  maxDepth: number; // 5500 m
}

export interface OceanVolumeData {
  dimensions: OceanVolumeDimensions;
  bounds: OceanVolumeBounds;
  scalars: Float32Array; // Flattened temperature values in °C
  minVal: number;
  maxVal: number;
}

export type OceanVariable = 'temperature' | 'salinity' | 'chlorophyll';
export type ColorPaletteName = 'Thermal' | 'Spectral' | 'Ocean' | 'Rainbow';

export interface InstrumentObservation {
  id: string;
  type: 'Argo Float' | 'Glider' | 'CTD Station';
  latitude: number;
  longitude: number;
  time: string;
  currentDepth: number;
  maxDepth: number;
  status: 'Active' | 'Inactive' | 'Profile In Progress';
}

export interface ProfilePoint {
  depth: number;
  observed: number;
  model: number;
}

export interface InstrumentProfile {
  instrumentId: string;
  timestamp: string;
  data: ProfilePoint[];
}

export interface ExplorerState {
  // Visualization variables
  selectedVariable: OceanVariable;
  depthMin: number;
  depthMax: number;
  opacity: number;
  verticalExaggeration: number;
  selectedTime: string;
  colorPalette: ColorPaletteName;

  // Layer Toggles
  showArgo: boolean;
  showGlider: boolean;
  showCtd: boolean;
  showCurrents: boolean;
  showIsosurface: boolean;
  showSeaFloor: boolean;

  // Selection & Playback
  selectedInstrumentId: string | null;
  isPlaying: boolean;
  playbackSpeed: number;

  // State Mutators
  setSelectedVariable: (variable: OceanVariable) => void;
  setDepthRange: (min: number, max: number) => void;
  setOpacity: (opacity: number) => void;
  setVerticalExaggeration: (exaggeration: number) => void;
  setSelectedTime: (time: string) => void;
  setColorPalette: (palette: ColorPaletteName) => void;
  toggleLayer: (layer: 'showArgo' | 'showGlider' | 'showCtd' | 'showCurrents' | 'showIsosurface' | 'showSeaFloor') => void;
  setSelectedInstrumentId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
}
