import React, { useState, useEffect } from 'react';
import { OceanScene } from '../../three/OceanScene';
import { useExplorerStore, type CurrentDensity } from '../../store/explorerStore';
import { demoGlider } from '../../data/demoObservations';
import { Sliders, RotateCcw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  getArgoFloats,
  getArgoTrajectory,
  getArgoProfile,
  type ArgoMarker,
} from '../../services/argoService';
import { useOceanModel } from '../../hooks/useOceanModel';
import FieldLegend from './FieldLegend';

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

  // Hook controlling model data (metadata, thetao/so, uo, vo)
  const {
    metadata,
    variable,
    setVariable,
    timeIndex,
    setTimeIndex,
    depth,
    setDepth,
    scalarField,
    uField,
    vField,
    loading,
    error,
  } = useOceanModel();

  // Live Argo Markers State
  const [argoMarkers, setArgoMarkers] = useState<ArgoMarker[]>([]);

  // Selected Instrument Detail State
  const [selectedObs, setSelectedObs] = useState<any>(null);
  const [selectedInstrumentLoading, setSelectedInstrumentLoading] = useState(false);
  const [selectedInstrumentError, setSelectedInstrumentError] = useState<string | null>(null);

  // Collapsible state
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [isInstrumentExpanded, setIsInstrumentExpanded] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Load live Argo floats from backend API
  useEffect(() => {
    let cancelled = false;

    async function loadArgoMarkers() {
      try {
        const floats = await getArgoFloats();

        const markers: (ArgoMarker | null)[] = await Promise.all(
          floats.map(async (float): Promise<ArgoMarker | null> => {
            try {
              if (float.latitude != null && float.longitude != null) {
                return {
                  id: float.platform_id,
                  type: 'ARGO' as const,
                  latitude: float.latitude,
                  longitude: float.longitude,
                  time: float.last_seen
                    ? new Date(float.last_seen).toUTCString()
                    : 'Recent',
                };
              }

              const trajectory = await getArgoTrajectory(float.platform_id);
              if (!trajectory.length) return null;

              const latest = trajectory[trajectory.length - 1];

              return {
                id: float.platform_id,
                type: 'ARGO' as const,
                latitude: latest.latitude,
                longitude: latest.longitude,
                cycleNumber: latest.cycle_number,
                time: latest.observation_time || latest.time || 'Recent',
              };
            } catch (error) {
              console.warn(
                `Could not load trajectory for ${float.platform_id}`,
                error
              );
              return null;
            }
          })
        );

        if (!cancelled) {
          const validMarkers: ArgoMarker[] = [];
          for (const m of markers) {
            if (m !== null) {
              validMarkers.push(m);
            }
          }
          setArgoMarkers(validMarkers);
        }
      } catch (error) {
        console.error('Error loading Argo floats:', error);
      }
    }

    loadArgoMarkers();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle instrument selection & detail fetching
  const handleInstrumentSelect = async (platformId: string) => {
    setSelectedInstrumentId(platformId);
    setIsInstrumentExpanded(true);

    if (platformId === demoGlider.id || platformId.toUpperCase().includes('GLIDER')) {
      setSelectedObs(demoGlider);
      setSelectedInstrumentLoading(false);
      setSelectedInstrumentError(null);
      return;
    }

    setSelectedInstrumentLoading(true);
    setSelectedInstrumentError(null);
    setSelectedObs(null);

    try {
      const marker = argoMarkers.find((m) => m.id === platformId);

      const [trajectory, profile] = await Promise.all([
        getArgoTrajectory(platformId).catch(() => []),
        getArgoProfile(platformId).catch(() => []),
      ]);

      const latestTraj = trajectory.length
        ? trajectory[trajectory.length - 1]
        : null;

      const lat = latestTraj?.latitude ?? marker?.latitude ?? 0;
      const lon = latestTraj?.longitude ?? marker?.longitude ?? 0;
      const cycleNum = latestTraj?.cycle_number ?? marker?.cycleNumber;
      const timeStr =
        latestTraj?.observation_time ||
        latestTraj?.time ||
        marker?.time ||
        'Recent';

      const depths = profile
        .map((p) => p.depth)
        .filter((d): d is number => typeof d === 'number');

      const minDepth = depths.length ? Math.min(...depths) : 0;
      const maxDepth = depths.length ? Math.max(...depths) : 2000;

      setSelectedObs({
        id: platformId,
        type: 'ARGO',
        latitude: Number(lat.toFixed(3)),
        longitude: Number(lon.toFixed(3)),
        cycleNumber: cycleNum,
        currentDepth: Math.round(minDepth),
        maxDepth: Math.round(maxDepth),
        time: typeof timeStr === 'string' && timeStr.includes('T') ? new Date(timeStr).toUTCString() : timeStr,
        status: 'Active',
        dataSource: 'INCOIS_LIVE_ARGO',
      });
    } catch (error) {
      console.error(`Error loading Argo platform ${platformId}:`, error);
      setSelectedInstrumentError('Unable to load details for this Argo float.');
    } finally {
      setSelectedInstrumentLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstrumentId) {
      setIsInstrumentExpanded(true);
    } else {
      setSelectedObs(null);
    }
  }, [selectedInstrumentId]);

  const handleResetCamera = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 bg-[#0B1D33] overflow-hidden select-none">
      {/* Loading Indicator Toast */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur px-4 py-2 rounded-lg shadow-md border border-[#D7E1EA] text-xs font-semibold text-[#152235] flex items-center space-x-2">
          <Loader2 className="w-4 h-4 text-[#1479F6] animate-spin" />
          <span>Loading ocean model data...</span>
        </div>
      )}

      {/* Error Indicator Toast */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50/95 backdrop-blur border border-red-200 px-4 py-2 rounded-lg text-xs font-semibold text-red-700 shadow-md">
          {error}
        </div>
      )}

      {/* Primary 3D WebGL Canvas Viewport */}
      <OceanScene
        resetKey={resetKey}
        argoMarkers={argoMarkers}
        onSelectArgo={handleInstrumentSelect}
        scalarField={scalarField}
        uField={uField}
        vField={vField}
        variable={variable}
      />

      {/* Dynamic Field Legend at Bottom Center */}
      <FieldLegend field={scalarField} variable={variable} />

      {/* Top-Right Stack: Collapsible Visualization Controls + Light Selected Instrument Card */}
      <div className="absolute top-4 right-4 z-[100] flex flex-col space-y-3 w-80 items-end">
        {/* Visualization Controls Panel */}
        {!isControlsExpanded ? (
          <button
            onClick={() => setIsControlsExpanded(true)}
            className="relative z-[100] bg-white/95 backdrop-blur border border-[#D7E1EA] text-[#152235] rounded-xl px-4 py-2.5 shadow-md flex items-center space-x-2 hover:bg-slate-50 transition-colors cursor-pointer text-xs font-bold"
          >
            <Sliders className="w-4 h-4 text-[#1479F6]" />
            <span>Visualization Controls</span>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>
        ) : (
          <div className="relative z-[100] bg-white/95 backdrop-blur border border-[#D7E1EA] text-[#152235] rounded-xl p-4 shadow-xl w-80 animate-fadeIn">
            <div
              onClick={() => setIsControlsExpanded(false)}
              className="flex items-center justify-between border-b border-[#D7E1EA] pb-2.5 mb-3 cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#1479F6]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#152235]">
                  Visualization Controls
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsControlsExpanded(false);
                }}
                className="text-[#64748B] hover:text-[#152235] p-0.5 rounded transition-colors cursor-pointer"
                title="Collapse controls"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>

            {/* Model Field Options: Variable, Date, Depth */}
            <div className="space-y-3 mb-4 pb-3 border-b border-[#D7E1EA]">
              {/* VARIABLE */}
              <div>
                <label className="text-[10px] uppercase text-[#64748B] font-semibold block mb-1">
                  Variable
                </label>
                <select
                  value={variable}
                  onChange={(e) =>
                    setVariable(e.target.value as 'thetao' | 'so')
                  }
                  className="w-full rounded-lg border border-[#D7E1EA] bg-white px-3 py-2 text-xs text-[#152235] font-semibold focus:outline-none focus:border-[#1479F6]"
                >
                  <option value="thetao">Temperature</option>
                  <option value="so">Salinity</option>
                </select>
              </div>

              {/* DATE */}
              <div>
                <label className="text-[10px] uppercase text-[#64748B] font-semibold block mb-1">
                  Date
                </label>
                <select
                  value={timeIndex}
                  onChange={(e) => setTimeIndex(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#D7E1EA] bg-white px-3 py-2 text-xs text-[#152235] font-semibold focus:outline-none focus:border-[#1479F6]"
                >
                  {metadata?.times.map((time, index) => {
                    const formattedDate = time.includes('T')
                      ? time.split('T')[0]
                      : time;
                    return (
                      <option key={`${time}-${index}`} value={index}>
                        {formattedDate}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* DEPTH */}
              <div>
                <label className="text-[10px] uppercase text-[#64748B] font-semibold block mb-1">
                  Depth
                </label>
                <select
                  value={depth ?? ''}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#D7E1EA] bg-white px-3 py-2 text-xs text-[#152235] font-semibold focus:outline-none focus:border-[#1479F6]"
                >
                  {metadata?.depths.map((d) => (
                    <option key={d} value={d}>
                      {Number(d).toFixed(1)} m
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Opacity Control */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748B] font-medium">Opacity</span>
                <span className="font-mono text-[#1479F6] font-bold">
                  {Math.round(opacity * 100)}%
                </span>
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
                <span className="font-mono text-[#1479F6] font-bold">
                  {verticalExaggeration.toFixed(1)}x
                </span>
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
                  Surface Currents
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
        {(selectedObs || selectedInstrumentLoading || selectedInstrumentError) && (
          !isInstrumentExpanded ? (
            <div className="relative z-[100] bg-white/95 backdrop-blur border border-[#D7E1EA] text-[#152235] rounded-xl px-4 py-2.5 shadow-md flex items-center justify-between w-80 animate-fadeIn select-none">
              <button
                onClick={() => setIsInstrumentExpanded(true)}
                className="flex items-center space-x-2 cursor-pointer flex-1 text-left font-bold"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                  style={{ backgroundColor: selectedObs?.type === 'GLIDER' ? '#E8B933' : '#F4C542' }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#152235]">
                  Selected Instrument
                </span>
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              </button>
              <button
                onClick={() => {
                  setSelectedInstrumentId(null);
                  setIsInstrumentExpanded(false);
                  setSelectedObs(null);
                }}
                className="text-xs text-[#64748B] hover:text-[#152235] p-0.5 rounded hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
                title="Deselect instrument"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative z-[100] bg-white/95 backdrop-blur border border-[#D7E1EA] text-[#152235] rounded-xl p-4 shadow-xl w-80 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#D7E1EA] pb-2 mb-2.5">
                <div
                  onClick={() => setIsInstrumentExpanded(false)}
                  className="flex items-center space-x-2 cursor-pointer flex-1 select-none"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: selectedObs?.type === 'GLIDER' ? '#E8B933' : '#F4C542' }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#152235]">
                    Selected Instrument
                  </span>
                  <ChevronUp className="w-4 h-4 text-[#64748B]" />
                </div>
                <button
                  onClick={() => {
                    setSelectedInstrumentId(null);
                    setIsInstrumentExpanded(false);
                    setSelectedObs(null);
                  }}
                  className="text-xs text-[#64748B] hover:text-[#152235] p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer ml-2"
                  title="Deselect instrument"
                >
                  ✕
                </button>
              </div>

              {selectedInstrumentLoading ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-2 text-[#1479F6]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-semibold">Loading platform data...</span>
                </div>
              ) : selectedInstrumentError ? (
                <div className="py-4 text-center text-xs text-red-600">
                  {selectedInstrumentError}
                </div>
              ) : selectedObs ? (
                <>
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
                      {selectedObs.type === 'ARGO' ? (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#E6F4EA] text-[#137333] uppercase tracking-wider">
                          LIVE DATA
                        </span>
                      ) : (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#FFF4D6] text-[#946B00] uppercase tracking-wider">
                          DEMO DATA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs pt-2.5 border-t border-[#D7E1EA] font-mono">
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Status</span>
                      <span className="text-[#22A06B] font-semibold">{selectedObs.status || 'Active'}</span>
                    </div>
                    {selectedObs.cycleNumber != null && (
                      <div>
                        <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Cycle Number</span>
                        <span className="text-[#152235] font-semibold">{selectedObs.cycleNumber}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Latitude</span>
                      <span className="text-[#152235] font-semibold">{selectedObs.latitude}° N</span>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Longitude</span>
                      <span className="text-[#152235] font-semibold">{selectedObs.longitude}° E</span>
                    </div>
                    {selectedObs.currentDepth != null && (
                      <div className="bg-[#F4F7FA] p-1.5 rounded-lg border border-[#D7E1EA] col-span-1">
                        <span className="text-[#1479F6] text-[10px] uppercase font-sans font-bold block">
                          Current Depth
                        </span>
                        <span className="text-[#1479F6] text-sm font-extrabold">
                          {selectedObs.currentDepth.toLocaleString()} m
                        </span>
                      </div>
                    )}
                    {selectedObs.maxDepth != null && (
                      <div>
                        <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Max Profile Depth</span>
                        <span className="text-[#152235] font-semibold">{selectedObs.maxDepth.toLocaleString()} m</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-[#64748B] text-[10px] uppercase font-sans font-medium block">Last Update</span>
                      <span className="text-[#64748B] text-[10px] font-sans truncate block">{selectedObs.time}</span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )
        )}
      </div>
    </div>
  );
};
