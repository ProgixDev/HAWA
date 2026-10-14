// Additive spacing scale for AWA (Phase 1, keys renamed in Phase 2).
//
// `src/theme/spacing.ts` (xs…xxl, the top/bottom/floating-tab-bar helpers) is deliberately NOT edited: 173 files import
// it and its tests pin it. This file only ADDS a 4-dp grid next to it.
//
// KEY NAMES are the numeric value (`s16` = 16 dp), on purpose: `spacing.sm` is 8 and `spacing.lg` is 24, so reusing
// the t-shirt names for a different scale (as the first version of this file did) was a misuse hazard.
//
// PROVENANCE: the 4-dp grid and the 16-dp screen margin are Material layout guidance and an AWA observation (16 is the
// most frequent `paddingHorizontal` in the app, 196 uses). They are NOT in the Material 3 JSON export. Provisional.

export const awaSpace = {
  s0: 0,
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s40: 40,
  s48: 48,
  s64: 64,
} as const;

export type AwaSpaceToken = keyof typeof awaSpace;

export const AWA_SPACE_PROVENANCE = 'provisional: material layout 4-dp grid + AWA observation; not in the JSON export';

/** Default horizontal screen margin. */
export const AWA_SCREEN_MARGIN = awaSpace.s16;

/** The grid step closest to a legacy spacing literal (audit helper; ties resolve toward the smaller step). */
export function nearestSpace(value: number): AwaSpaceToken {
  const tokens = Object.keys(awaSpace) as AwaSpaceToken[];
  let best = tokens[0];
  let bestDistance = Math.abs(awaSpace[best] - value);
  for (const token of tokens) {
    const distance = Math.abs(awaSpace[token] - value);
    if (distance < bestDistance) {
      best = token;
      bestDistance = distance;
    }
  }
  return best;
}
