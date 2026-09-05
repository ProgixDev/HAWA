import {DefaultTheme, type Theme} from '@react-navigation/native';

import type {ResolvedAwaTheme} from './awaThemeTokens';

// Phase B — the only place a `ResolvedAwaTheme` is translated into React
// Navigation's own `Theme` shape. Pure (no React) so it's trivially testable
// and so AppNavigator.tsx only needs to `useMemo(() => toReactNavigationTheme(theme), [theme])`.
//
// Deliberate role mapping (never arbitrary hex — every value traces back to
// a resolved AWA token):
//   primary      -> theme.colors.primary        (brand accent)
//   background   -> theme.colors.background     (used by @react-navigation/
//                                                 native-stack as every
//                                                 screen's default
//                                                 `contentStyle` background —
//                                                 this is what actually shows
//                                                 during transitions/gaps)
//   card         -> theme.colors.surface         (nearest existing role to
//                                                 React Navigation's "card"/
//                                                 header-and-tab-bar surface)
//   text         -> theme.colors.text
//   border       -> theme.colors.border
//   notification -> theme.colors.danger          (React Navigation's own
//                                                 Default/DarkTheme both use
//                                                 a red-family color here —
//                                                 `danger` is this app's own
//                                                 closest semantic match)
//
// `fonts` is a required field on React Navigation v7's `Theme` type (see
// @react-navigation/native/src/theming/types.tsx) — AWA has no navigation
// typography system of its own and font styling is explicitly out of scope
// for theming (see awaThemeTokens.ts's own "radii/spacing/typography stay
// theme-independent" note), so the library's own default font set is reused
// verbatim (identical between its DefaultTheme and DarkTheme).
export function toReactNavigationTheme(theme: ResolvedAwaTheme): Theme {
  return {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
    fonts: DefaultTheme.fonts,
  };
}
