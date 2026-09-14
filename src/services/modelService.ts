const BASE_URL = 'https://sih2026-oceanx.onrender.com';

export type ScalarVariable = 'thetao' | 'so';
export type ModelVariable = ScalarVariable | 'uo' | 'vo';

export interface ModelMetadata {
  depths: number[];
  times: string[];
  raw: any;
}

export interface ModelField {
  variable: ModelVariable;
  latitudes: number[];
  longitudes: number[];
  values: (number | null)[][];
  min: number;
  max: number;
  selectedDepth: number;
  selectedTime: string | number;
  unit?: string;
  raw: any;
}

function getValue(obj: any, keys: string[]) {
  if (!obj) return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
    if (obj.data?.[key] !== undefined) return obj.data[key];
  }
  return undefined;
}

export async function getModelMetadata(
  signal?: AbortSignal
): Promise<ModelMetadata> {
  const response = await fetch(`${BASE_URL}/api/model/metadata`, { signal });

  if (!response.ok) {
    throw new Error(`Metadata request failed: ${response.status}`);
  }

  const raw = await response.json();
  console.log('MODEL METADATA:', raw);

  const depths =
    getValue(raw, ['depths', 'available_depths', 'depth', 'model_depths']) ?? [];

  const times =
    getValue(raw, ['time', 'times', 'model_times', 'dates']) ?? [];

  return {
    depths: Array.isArray(depths) ? depths.map(Number) : [],
    times: Array.isArray(times) ? times.map(String) : [],
    raw,
  };
}

export async function getModelField(
  variable: ModelVariable,
  timeIndex: number,
  depth: number,
  signal?: AbortSignal
): Promise<ModelField> {
  const params = new URLSearchParams({
    variable,
    time_index: String(timeIndex),
    depth: String(depth),
  });

  const response = await fetch(
    `${BASE_URL}/api/model/field?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`${variable} request failed: ${response.status}`);
  }

  const raw = await response.json();
  console.log('FIELD RESPONSE:', raw);

  const latitudes =
    getValue(raw, ['latitude', 'latitudes', 'lat', 'lats']) ?? [];

  const longitudes =
    getValue(raw, ['longitude', 'longitudes', 'lon', 'lons']) ?? [];

  const values =
    getValue(raw, ['values', 'grid_values', 'grid', 'field']) ?? [];

  const min =
    getValue(raw, ['min_value', 'min', 'minimum']) ?? 0;

  const max =
    getValue(raw, ['max_value', 'max', 'maximum']) ?? 1;

  const selectedDepth =
    getValue(raw, ['actual_depth', 'requested_depth', 'selected_depth', 'depth']) ?? depth;

  const selectedTime =
    getValue(raw, ['time', 'selected_time', 'date']) ?? timeIndex;

  const unit = getValue(raw, ['unit', 'units']);

  return {
    variable,
    latitudes: Array.isArray(latitudes) ? latitudes : [],
    longitudes: Array.isArray(longitudes) ? longitudes : [],
    values: Array.isArray(values) ? values : [],
    min: Number(min),
    max: Number(max),
    selectedDepth: Number(selectedDepth),
    selectedTime,
    unit,
    raw,
  };
}
