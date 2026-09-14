import type { ModelField, ScalarVariable } from '../../services/modelService';
import { SALINITY_COLORS, TEMPERATURE_COLORS } from '../../utils/modelColors';

interface Props {
  field: ModelField | null;
  variable: ScalarVariable;
}

export default function FieldLegend({ field, variable }: Props) {
  if (!field) return null;

  const colors =
    variable === 'thetao' ? TEMPERATURE_COLORS : SALINITY_COLORS;

  const title =
    variable === 'thetao' ? 'Temperature' : 'Salinity';

  const defaultUnit = variable === 'thetao' ? '°C' : 'psu';
  const displayUnit = field.unit || defaultUnit;

  const gradient = `linear-gradient(to right, ${colors.join(',')})`;

  const middle = ((field.min + field.max) / 2).toFixed(2);

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur rounded-xl px-4 py-3 shadow-lg border border-[#D7E1EA] min-w-[340px] z-50">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-bold text-[#152235]">{title}</span>
        <span className="text-[10px] text-[#64748B]">{displayUnit}</span>
      </div>

      <div
        className="h-2.5 rounded-full"
        style={{
          background: gradient,
        }}
      />

      <div className="flex justify-between mt-1 text-[10px] text-[#64748B] font-mono">
        <span>{field.min.toFixed(2)}</span>
        <span>{middle}</span>
        <span>{field.max.toFixed(2)}</span>
      </div>

      <div className="text-center text-[9px] text-[#94A3B8] mt-1">
        Depth: {Number(field.selectedDepth).toFixed(1)} m
      </div>
    </div>
  );
}
