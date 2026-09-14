import React, { useState } from 'react';
import { OceanScene } from '../../three/OceanScene';
import { useExplorerStore, type CurrentDensity } from '../../store/explorerStore';
import { demoObservations } from '../../data/demoObservations';
import { Sliders, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export const OceanViewport: React.FC = () => {
  const opacity = useExplorerStore((state) => state.opacity);
  const setOpacity = useExplorerStore((state) => state.setOpacity);
  const verticalExaggeration = useExplorerStore((state) => state.verticalExaggeration);
  const setVerticalExaggeration = useExplorerStore((state) => state.setVerticalExaggeration);
  const depthMin = useExplorerStore((state) => state.depthMin);
  const depthMax = useExplorerStore((state) => state.depthMax);
  const setDepthRange = useExplorerStore((state) => state.setDepthRange);

  const showCurrents = useExplorerStore((state) => state.showCurrents);
  const toggleLayer = useExplorerStore((state) => state.toggleLayer);
  const currentDensity = useExplorerStore((state) => state.currentDensity);
  const setCurrentDensity = useExplorerStore((state) => state.setCurrentDensity);

  const selectedInstrumentId = useExplorerStore((state) => state.selectedInstrumentId);
  const setSelectedInstrumentId = useExplorerStore((state) => state.setSelectedInstrumentId);

  const selectedObs = demoObservations.find((obs) => obs.id === selectedInstrumentId);

  // Collapsible state
  const [isControlsExpanded, setIsControlsExpanded] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const handleResetCamera = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 bg-[#0B1D33] overflow-hidden select-none">
      {/* Primary 3D WebGL Canvas Viewport */}
      <OceanScene resetKey={resetKey} />

      {/* Top-Right Stack: Collapsible Visualization Controls + Light Selected Instrument Card */}
      <div className="absolute top-4 right-4 z-20 flex flex-col space-y-3 w-80 items-end">
        {/* Visualization Controls Panel */}
        {!isControlsExpanded ? (
          <button
            onClick={() => setIsControlsExpanded(true)}
            className="bg-white/95 backdrop-blur border border-[#D7E1EA] text-[#152235] rounded-xl px-4 py-2.5 shadow-md flex items-center space-x-2 hover:bg-slate-50 transition-colors cursor-pointer text-xs font-bold"
          >
            <Sliders className="w-4 h-4 text-[#1479F6]" />
            <span>Visualization Controls</span>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>
        ) : (
          <div className="bg-white/95 backdrop-blur border border-[#D7E1EA] text-[#152235] rounded-xl p-4 shadow-xl w-80 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#D7E1EA] pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#1479F6]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#152235]">
                  Visualization Controls
                </span>
              </div>
              <button
                onClick={() => setIsControlsExpanded(false)}
                className="text-[#64748B] hover:text-[#152235] p-0.5 rounded transition-colors"
                title="Collapse controls"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* Opacity Control */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748B] font-medium">Opacity</span>
                <span className="font-mono text-[#1479F6] font-bold">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#EAF1F6] rounded-lg appearance-none cursor-pointer accent-[#1479F6]"
              />
            </div>

            {/* Vertical Exaggeration Control */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748B] font-medium">Vertical Exaggeration</span>
                <span className="font-mono text-[#1479F6] font-bold">{verticalExaggeration.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={verticalExaggeration}
                onChange={(e) => setVerticalExaggeration(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#EAF1F6] rounded-lg appearance-none cursor-pointer accent-[#1479F6]"
              />
            </div>

            {/* Depth Range Clipping Control */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748B] font-medium">Max Depth Clip</span>
                <span className="font-mono text-[#1479F6] font-bold">{depthMax} m</span>
              </div>
              <input
                type="range"
                min="1000"
                max="5500"
                step="250"
                value={depthMax}
                onChange={(e) => setDepthRange(depthMin, parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#EAF1F6] rounded-lg appearance-none cursor-pointer accent-[#1479F6]"
              />
            </div>

            {/* Surface Currents Toggle & Density Segmented Control */}
            <div className="pt-3 border-t border-[#D7E1EA]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#152235]">
                  Surface Currents (Demo)
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCurrents}
                    onChange={() => toggleLayer('showCurrents')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1479F6]" />
                </label>
              </div>

              {showCurrents && (
                <div className="flex items-center justify-between text-xs mt-2.5">
                  <span className="text-[#64748B] text-[11px] font-medium">Current Density</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-[#F1F5F9] border border-[#D7E1EA]">
                    {(['low', 'medium', 'high'] as CurrentDensity[]).map((density) => (
                      <button
                        key={density}
                        onClick={() => setCurrentDensity(density)}
                        className={`px-2.5 py-0.5 text-[10px] font-bold capitalize rounded-md transition-colors cursor-pointer ${
                          currentDensity === density
                            ? 'bg-[#1479F6] text-white shadow-sm'
                            : 'text-[#64748B] hover:text-[#152235]'
                        }`}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reset View Button */}
            <button
              onClick={handleResetCamera}
              className="w-full mt-3.5 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-[#F4F7FA] border border-[#D7E1EA] text-xs font-semibold text-[#152235] hover:bg-[#EAF1F6] hover:text-[#1479F6] transition-colors cursor-pointer"
              title="Reset camera view to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset View</span>
            </button>
          </div>
        )}

        {/* Selected Instrument Card (Light Theme) */}
        {selectedObs && (
          <div className="bg-white/95 backdrop-blur border border-[#D7E1EA] text-[#152235] rounded-xl p-4 shadow-xl w-80 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#D7E1EA] pb-2 mb-2.5">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: selectedObs.type === 'GLIDER' ? '#E8B933' : '#F4C542' }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#152235]">
                  Selected Instrument
                </span>
              </div>
              <button
                onClick={() => setSelectedInstrumentId(null)}
                className="text-xs text-[#64748B] hover:text-[#152235] p-0.5 rounded hover:bg-slate-100 transition-colors"
                title="Deselect instrument"
              >
                ✕
              </button>
            </div>

            <div className="flex items-start space-x-3.5 mb-3">
              {/* SVG Instrument Graphic Icon */}
              <div className="w-10 h-14 bg-[#F8FAFC] border border-[#D7E1EA] rounded-lg flex items-center justify-center p-1 shrink-0">
                {selectedObs.type === 'GLIDER' ? (
                  <svg className="w-full h-full" viewBox="0 0 40 40">
                    <rect x="5" y="17" width="28" height="7" rx="3.5" fill="#E8B933" />
                    <polygon points="33,17 38,20.5 33,24" fill="#E8B933" />
                    <circle cx="38" cy="20.5" r="1.2" fill="#D6DEE5" />
                    <rect x="10" y="21" width="18" height="3" fill="#18222C" />
                    <polygon points="18,20.5 8,6 12,6 23,20.5" fill="#303D48" />
                    <polygon points="18,20.5 8,35 12,35 23,20.5" fill="#303D48" />
                    <polygon points="8,17 3,9 7,9 11,17" fill="#303D48" />
                  </svg>
                ) : (
                  <svg className="w-full h-full" viewBox="0 0 30 60">
                    <line x1="15" y1="4" x2="15" y2="14" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="9" y="14" width="12" height="12" rx="2" fill="#F4C542" />
                    <rect x="9.5" y="26" width="11" height="3" fill="#0C1117" />
                    <rect x="10" y="29" width="10" height="22" fill="#17212B" stroke="#334155" strokeWidth="1" />
                    <polygon points="10,51 20,51 15,57" fill="#94A3B8" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#1479F6]">
                  {selectedObs.type === 'GLIDER' ? 'Glider' : 'Argo Float'}
                </div>
                <div className="text-lg font-black tracking-tight text-[#152235] font-mono leading-none my-0.5">
                  {selectedObs.id}
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#FFF4D6] text-[#946B00] uppercase tracking-wider">
                  DEMO DATA
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs pt-2.5 border-t border-[#D7E1EA] font-mono">
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Status</span>
                <span className="text-[#22A06B] font-semibold">{selectedObs.status}</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Latitude</span>
                <span className="text-[#152235] font-semibold">{selectedObs.latitude}° N</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Longitude</span>
                <span className="text-[#152235] font-semibold">{selectedObs.longitude}° E</span>
              </div>
              <div className="bg-[#F4F7FA] p-1.5 rounded-lg border border-[#D7E1EA] col-span-1">
                <span className="text-[#1479F6] text-[10px] uppercase font-sans font-bold block">
                  Current Depth
                </span>
                <span className="text-[#1479F6] text-sm font-extrabold">
                  {selectedObs.currentDepth.toLocaleString()} m
                </span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Max Profile Depth</span>
                <span className="text-[#152235] font-semibold">{selectedObs.maxDepth.toLocaleString()} m</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Last Update</span>
                <span className="text-[#64748B] text-[10px] font-sans truncate block">{selectedObs.time}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
