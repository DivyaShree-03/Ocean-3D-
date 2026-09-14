export interface InstrumentObservation {
  id: string;
  type: "ARGO" | "GLIDER";
  latitude: number;
  longitude: number;
  currentDepth: number;
  maxDepth: number;
  time: string;
  status: string;
  dataSource: string;
}

/**
 * DEMO Argo Float Observation Data.
 * IMPORTANT: This is demo data. Do not present it as live INCOIS data.
 */
export const demoArgoFloat: InstrumentObservation = {
  id: "2902345",
  type: "ARGO",
  latitude: 12.583,
  longitude: 88.412,
  currentDepth: 1964,
  maxDepth: 2000,
  time: "23 May 2025 06:00 UTC",
  status: "Active",
  dataSource: "DEMO_ARGO_V1"
};

/**
 * DEMO Underwater Glider Observation Data.
 * IMPORTANT: This is demo data. Do not present it as live INCOIS data.
 */
export const demoGlider: InstrumentObservation = {
  id: "SG567",
  type: "GLIDER",
  latitude: 8.214,
  longitude: 92.106,
  currentDepth: 1100,
  maxDepth: 1500,
  time: "23 May 2025 06:00 UTC",
  status: "Active",
  dataSource: "DEMO_GLIDER_V1"
};

export const demoObservations: InstrumentObservation[] = [
  demoArgoFloat,
  demoGlider
];
