export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Shared breathing room added above the device safe-area inset so every
// screen's top spacing looks the same regardless of how it handles insets.
export const TOP_SPACING_EXTRA = 32;
export const TOP_SPACING_EXTRA_COMPACT = 20;
const TOP_SPACING_MIN_INSET = 20;
const TOP_SPACING_MIN_INSET_COMPACT = 16;

// For screens where the top safe-area inset is NOT already reserved by a
// SafeAreaView with the 'top' edge (e.g. a plain View, or edges omitting
// 'top'): returns insets.top (floored, for devices/tests reporting 0) plus
// the shared extra spacing above.
export function getTopPadding(insetsTop: number, compact = false): number {
  const minInset = compact ? TOP_SPACING_MIN_INSET_COMPACT : TOP_SPACING_MIN_INSET;
  const extra = compact ? TOP_SPACING_EXTRA_COMPACT : TOP_SPACING_EXTRA;
  return Math.max(insetsTop, minInset) + extra;
}
