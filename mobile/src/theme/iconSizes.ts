// Icon size tokens for AWA (Phase 1, additive).
//
// PROVENANCE
//   awaIconSizes              : AWA DECISION (not in the Material 3 JSON export, which carries no icon dimensions).
//                               24 is the Material default; 20 / 16 / 32 are the nearest steps to the sizes the app
//                               uses today (18, 20, 22, 23, 24 …). Provisional until the .fig is consulted.
//   AWA_MIN_TOUCH_TARGET      : 48 dp, the Material / Android accessibility minimum for a tappable target.
//
// This phase does NOT introduce an icon component or a new icon library: the existing
// `@react-native-vector-icons/material-design-icons` glyphs, names and call sites stay untouched.

export const awaIconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
} as const;

export type AwaIconSize = keyof typeof awaIconSizes;

export const AWA_ICON_SIZE_PROVENANCE = 'awa-decision (provisional): not present in material3-tokens-normalized.json';

/** Minimum tappable size (dp). */
export const AWA_MIN_TOUCH_TARGET = 48;

/** The icon token closest to a legacy size literal (audit helper). Ties resolve toward the LARGER size so a legacy
 * 18 becomes 20 and a 22 becomes 24, never a smaller glyph. */
export function nearestIconSize(size: number): AwaIconSize {
  const tokens = Object.keys(awaIconSizes) as AwaIconSize[];
  let best = tokens[0];
  let bestDistance = Math.abs(awaIconSizes[best] - size);
  for (const token of tokens) {
    const distance = Math.abs(awaIconSizes[token] - size);
    if (distance <= bestDistance) {
      best = token;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * The `hitSlop` that extends a control whose visual box is `width` x `height` to at least AWA_MIN_TOUCH_TARGET on each
 * axis (React Native's `hitSlop` shape). Zero on an axis that is already large enough.
 */
export function touchTargetHitSlop(
  width: number,
  height: number = width,
): {top: number; bottom: number; left: number; right: number} {
  const horizontal = Math.max(0, Math.ceil((AWA_MIN_TOUCH_TARGET - width) / 2));
  const vertical = Math.max(0, Math.ceil((AWA_MIN_TOUCH_TARGET - height) / 2));
  return {top: vertical, bottom: vertical, left: horizontal, right: horizontal};
}
