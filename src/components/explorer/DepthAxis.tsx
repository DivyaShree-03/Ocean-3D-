import React from 'react';
import { toDisplayDepth } from '../../utils/depthUtils';

interface DepthAxisProps {
  selectedDepth: number;
  maxDepth?: number;
  onSelectDepth?: (depth: number) => void;
  visible?: boolean;
}

const DEPTH_TICKS = [0, 1000, 2000, 3000, 4000, 5000, 5500];

export const DepthAxis: React.FC<DepthAxisProps> = ({
  selectedDepth,
  maxDepth = 5500,
  onSelectDepth,
  visible = true,
}) => {
  if (!visible) return null;

  // Selected depth marker percentage position (0% at top = 0m, 100% at bottom = 5500m)
  const currentPercentage = Math.min(100, Math.max(0, (selectedDepth / maxDepth) * 100));

  return (
    <div className="relative h-full w-12 flex flex-col justify-between items-start pointer-events-none select-none">
      {/* Track Line */}
      <div className="absolute left-2.5 top-0 bottom-0 w-1 bg-[#1E293B]/80 border-r border-white/10 rounded-full backdrop-blur-sm" />

      {/* Selected Depth Pointer Indicator */}
      <div
        className="absolute left-0 -translate-y-1/2 flex items-center space-x-1.5 transition-all duration-300 pointer-events-auto cursor-pointer group z-20"
        style={{ top: `${currentPercentage}%` }}
      >
        <div className="w-5 h-2.5 bg-[#1479F6] border border-white rounded-sm shadow-lg shadow-[#1479F6]/50 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
        <span className="px-1.5 py-0.5 rounded bg-[#1479F6] text-white text-[10px] font-mono font-bold shadow-md whitespace-nowrap">
          {toDisplayDepth(selectedDepth)} m
        </span>
      </div>

      {/* Tick Marks & Labels */}
      {DEPTH_TICKS.map((tickDepth) => {
        const tickPercentage = (tickDepth / maxDepth) * 100;
        const isSelected = Math.abs(tickDepth - selectedDepth) < 100;

        return (
          <div
            key={tickDepth}
            onClick={() => onSelectDepth && onSelectDepth(tickDepth)}
            className={`absolute left-2.5 -translate-y-1/2 flex items-center space-x-2 transition-colors pointer-events-auto z-10 ${
              onSelectDepth ? 'cursor-pointer' : ''
            }`}
            style={{ top: `${tickPercentage}%` }}
            title={`Set depth to ${toDisplayDepth(tickDepth)} m`}
          >
            <div
              className={`h-0.5 ${
                isSelected ? 'w-3 bg-[#1479F6]' : 'w-2 bg-slate-400/60'
              }`}
            />
            <span
              className={`text-[9px] font-mono ${
                isSelected
                  ? 'text-[#1479F6] font-bold'
                  : 'text-slate-300/80 font-medium'
              }`}
            >
              {toDisplayDepth(tickDepth)}m
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default DepthAxis;
