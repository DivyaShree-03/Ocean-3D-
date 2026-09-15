/**
 * DEMO_CURRENT_FIELD_V1
 * Synthetic 2D Surface Current Vector Field for Northern Indian Ocean (60°E – 98°E, 0° – 25°N).
 * This is a simulated demonstration field and NOT live INCOIS observation data.
 */

export interface CurrentVector {
  u: number; // East-West velocity (m/s)
  v: number; // North-South velocity (m/s)
  speed: number; // Magnitude sqrt(u^2 + v^2) (m/s)
}

export function sampleCurrentField(
  lon: number,
  lat: number,
  timeStep: number = 0
): CurrentVector {
  const phase = timeStep * 0.08;

  // 1. Bay of Bengal Clockwise Circulation Gyre (~87.5°E, 15.0°N)
  const bobLon = 87.5 + Math.sin(phase * 0.5) * 0.5;
  const bobLat = 15.0 + Math.cos(phase * 0.5) * 0.4;
  const bobDx = (lon - bobLon) / 8.5;
  const bobDz = (lat - bobLat) / 6.5;
  const bobR2 = bobDx * bobDx + bobDz * bobDz;
  const bobFactor = Math.exp(-bobR2 * 0.8) * 1.1;

  // Tangential velocity vector for clockwise rotation
  const uBob = (+bobDz * Math.cos(phase) - bobDx * Math.sin(phase * 0.5)) * bobFactor;
  const vBob = (-bobDx * Math.cos(phase) - bobDz * Math.sin(phase * 0.5)) * bobFactor;

  // 2. Arabian Sea Clockwise Flow Gyre (~70.0°E, 14.5°N)
  const arabLon = 70.0;
  const arabLat = 14.5;
  const arabDx = (lon - arabLon) / 7.5;
  const arabDz = (lat - arabLat) / 6.0;
  const arabR2 = arabDx * arabDx + arabDz * arabDz;
  const arabFactor = Math.exp(-arabR2 * 0.7) * 0.9;

  const uArab = (+arabDz * Math.cos(phase * 0.8)) * arabFactor;
  const vArab = (-arabDx * Math.cos(phase * 0.8)) * arabFactor;

  // 3. Equatorial & Coastal Jet around Southern India / Sri Lanka (~75°E - 82°E, 4°N - 10°N)
  const eqDx = (lon - 79.0) / 9.0;
  const eqDz = (lat - 6.0) / 4.0;
  const eqR2 = eqDx * eqDx + eqDz * eqDz;
  const eqFactor = Math.exp(-eqR2 * 0.9) * 0.85;

  // Eastward jet bending northeastward around Sri Lanka into Bay of Bengal
  const uEq = 0.6 * eqFactor;
  const vEq = 0.35 * Math.sin((lon - 75.0) * 0.25 + phase) * eqFactor;

  // 4. Broad North Equatorial West-to-East Drift (background flow)
  const uDrift = 0.22 + 0.15 * Math.cos(lat * 0.12 + phase);
  const vDrift = 0.08 * Math.sin(lon * 0.1 + phase);

  // Combine vectors
  let u = uBob + uArab + uEq + uDrift;
  let v = vBob + vArab + vEq + vDrift;

  // Compute speed magnitude
  let speed = Math.sqrt(u * u + v * v);

  // Clamp speed to realistic ocean current range [0.15, 1.25] m/s
  const clampedSpeed = Math.max(0.15, Math.min(1.25, speed));
  if (speed > 0) {
    u = (u / speed) * clampedSpeed;
    v = (v / speed) * clampedSpeed;
  }

  return { u, v, speed: clampedSpeed };
}
