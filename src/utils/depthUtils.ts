/**
 * Backend:
 * depth = 850
 *
 * UI:
 * depth = -850 m
 */
export function toDisplayDepth(
  depth: number | null | undefined
): number | null {
  if (depth == null || !Number.isFinite(depth)) {
    return null;
  }

  return -Math.abs(depth);
}

/**
 * Use this when sending depth into geoToScene().
 *
 * geoToScene already converts positive depth
 * into negative Y internally.
 */
export function toSceneDepth(
  depth: number | null | undefined
): number {
  if (depth == null || !Number.isFinite(depth)) {
    return 0;
  }

  return Math.abs(depth);
}
