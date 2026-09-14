import { create } from 'zustand';
import type { ExplorerState } from '../types/ocean';

export type CurrentDensity = 'low' | 'medium' | 'high';

interface ExtendedExplorerState extends ExplorerState {
  depthScreenRange: { top: number; bottom: number };
  setDepthScreenRange: (range: { top: number; bottom: number }) => void;
  currentDensity: CurrentDensity;
  setCurrentDensity: (density: CurrentDensity) => void;
}

export const useExplorerStore = create<ExtendedExplorerState>((set) => ({
  // Visualization controls
  selectedVariable: 'temperature',
  depthMin: 0,
  depthMax: 5500,
  opacity: 0.60,
  verticalExaggeration: 2.0,
  selectedTime: '23 May 2025 06:00 UTC',
  colorPalette: 'Thermal',

  // Layers
  showArgo: true,
  showGlider: true,
  showCtd: true,
  showCurrents: true,
  showIsosurface: false,
  showSeaFloor: true,
  currentDensity: 'medium',

  // Selected Instrument & Playback
  selectedInstrumentId: null,
  isPlaying: false,
  playbackSpeed: 1,

  // Dynamic Depth Screen Projection
  depthScreenRange: { top: 120, bottom: 480 },

  // Actions
  setSelectedVariable: (variable) => set({ selectedVariable: variable }),
  setDepthRange: (min, max) => set({ depthMin: min, depthMax: max }),
  setOpacity: (opacity) => set({ opacity }),
  setVerticalExaggeration: (exaggeration) => set({ verticalExaggeration: exaggeration }),
  setSelectedTime: (time) => set({ selectedTime: time }),
  setColorPalette: (palette) => set({ colorPalette: palette }),
  toggleLayer: (layer) => set((state) => ({ [layer]: !state[layer] })),
  setSelectedInstrumentId: (id) => set({ selectedInstrumentId: id }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setDepthScreenRange: (range) => set({ depthScreenRange: range }),
  setCurrentDensity: (density) => set({ currentDensity: density }),
}));
