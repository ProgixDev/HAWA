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

const BOTTOM_SPACING_MIN_INSET = 16;

// Mirrors getTopPadding for the bottom edge: insets.bottom (floored so
// devices/tests reporting 0 still get breathing room) plus extra HAWA
// spacing — pass `spacing.md`/`spacing.lg` for a plain scrolling screen, or
// READING_CONTROLS_SPACE for screens that render <ReadingControls/> so the
// fixed bar never overlaps the last paragraph/card.
export function getBottomPadding(insetsBottom: number, extra: number = spacing.md): number {
  return Math.max(insetsBottom, BOTTOM_SPACING_MIN_INSET) + extra;
}

// Reserved space below scrollable Article content so the fixed
// ReadingControls bar (src/components/articles/ReadingControls.tsx) never
// overlaps the end of the article. Kept in one place so every article
// screen scrolls its last paragraph fully clear of the bar.
export const READING_CONTROLS_SPACE = 170;

// Mirrors the floating bottom tab bar's own occupied footprint
// (src/components/navigation/CustomBottomTabBar.tsx: `bottomBar` height 58,
// `bottomBarArea` paddingTop 4, and its own `Math.max(insets.bottom, 8)`
// SafeArea floor) — kept in sync manually since that file is out of scope
// for this change, exactly like awaThemeTokens.ts's TRUE_BLACK_* literals
// are kept in sync with AppearanceScreen.tsx's DARK_CHROME.
//
// Since the navbar became an absolute floating overlay, React Navigation no
// longer reserves layout space for it — every scrollable main-tab screen
// (Accueil/Calendrier/Statistiques/Profil, and every objective's own
// dashboard/calendar/statistics implementation) must add this to its OWN
// `contentContainerStyle.paddingBottom` so the last piece of content can
// scroll fully above the pill instead of being hidden behind it.
const FLOATING_TAB_BAR_PILL_HEIGHT = 58;
const FLOATING_TAB_BAR_TOP_SPACING = 4;
const FLOATING_TAB_BAR_MIN_BOTTOM_INSET = 8;

// `insetsBottom` must be that SAME screen's own `useSafeAreaInsets().bottom`
// — passed straight through, not pre-floored or added to separately, or the
// SafeArea inset ends up counted twice. `extra` is the screen's own existing
// breathing-room choice (its previous non-navbar-related bottom padding
// value, or `spacing.md` by default) — this only corrects the floor to
// additionally clear the floating pill, it does not reset per-screen intent.
export function getFloatingTabBarClearance(insetsBottom: number, extra: number = spacing.md): number {
  return (
    FLOATING_TAB_BAR_TOP_SPACING +
    FLOATING_TAB_BAR_PILL_HEIGHT +
    Math.max(insetsBottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET) +
    extra
  );
}
