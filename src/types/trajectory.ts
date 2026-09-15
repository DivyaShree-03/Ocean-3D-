export type TrajectoryMode = 'live' | 'simulated';

export interface VisualTrajectoryPoint {
  latitude: number;
  longitude: number;

  /**
   * Positive depth magnitude.
   */
  depth: number;

  time?: string;
}
