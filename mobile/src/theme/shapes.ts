// Material Design 3 corner-radius tokens for AWA (Phase 1, additive — nothing reads these yet).
//
// PROVENANCE: all ten values are VERIFIED, copied from `shape.baseline` in
// docs/design-system/material3-tokens-normalized.json (a test compares them with that file).
//
// These are corner RADII, not component dimensions. Which token a given component uses is a design decision recorded
// separately (componentDimensions.ts proposals), never implied by this file.

export const awaShapes = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  largeIncreased: 20,
  extraLarge: 28,
  extraLargeIncreased: 32,
  extraExtraLarge: 48,
  full: 1000,
} as const;

export type AwaShapeToken = keyof typeof awaShapes;

export const AWA_SHAPE_TOKENS = Object.keys(awaShapes) as AwaShapeToken[];

/** Pill / circle. A literal radius at or above this is treated as "fully rounded" by `nearestShape`. */
export const AWA_FULL_RADIUS_THRESHOLD = 100;

/**
 * The shape token closest to a legacy `borderRadius` literal (for the migration audit and codemods; NOT used at
 * runtime). Ties resolve toward the SMALLER token (less visual change). Decorative radii that are clearly circles
 * (≥ AWA_FULL_RADIUS_THRESHOLD) map to `full`.
 */
export function nearestShape(radius: number): AwaShapeToken {
  if (radius >= AWA_FULL_RADIUS_THRESHOLD) {
    return 'full';
  }
  const candidates = AWA_SHAPE_TOKENS.filter(token => token !== 'full');
  let best: AwaShapeToken = candidates[0];
  let bestDistance = Math.abs(awaShapes[best] - radius);
  for (const token of candidates) {
    const distance = Math.abs(awaShapes[token] - radius);
    if (distance < bestDistance) {
      best = token;
      bestDistance = distance;
    }
  }
  return best;
}
