import {interpolateHex, onPrimaryTextColor, type ResolvedAwaTheme} from './awaThemeTokens';
import {WCAG_AA_TEXT, WCAG_AA_UI, contrastRatio, ensureContrast, parseColor} from './contrast';

const LIGHT_ON_COLOR = '#FFFFFF';
// Same dark ink awaThemeTokens.ts uses for text on light fills (READABLE_DARK_TEXT, not exported there).
const DARK_ON_COLOR = '#1A1626';

/** Whichever of white / dark ink has the higher WCAG contrast on `fill` (never relies on a luminance threshold). */
export function bestOnColor(fill: string): string {
  return contrastRatio(LIGHT_ON_COLOR, fill) >= contrastRatio(DARK_ON_COLOR, fill) ? LIGHT_ON_COLOR : DARK_ON_COLOR;
}

// Material 3-style semantic colour roles derived from AWA's EXISTING resolved theme (Phase 1, additive).
//
// Nothing here changes an existing colour: `ResolvedAwaTheme` / `AwaThemeColors` are untouched, the AWA purple stays
// the source of `primary`, and every role is a pure function of the resolved theme (so Light, Dark, True Black and all
// six palettes are covered by construction). The Google example palette is NOT imported.
//
// PROVENANCE
//   Role NAMES and the on* / container pairing structure follow Material 3 (names verified against `m3.*` in
//   material3-tokens-normalized.json). The VALUES are AWA-derived (they are not Google's numbers) and are tagged
//   "awa-derived" below. Medical / calendar / spiritual semantic colours (period, fertile, ovulation, pregnancy,
//   Postpartum, Menopause, Dhul Hijja …) are deliberately NOT roles here; they live in their feature files and stay
//   there.
//
// ACCESSIBILITY
// NOTE onPrimary reuses the app's existing onPrimaryTextColor() unchanged (its behaviour is pinned by tests); the other
// on* roles use bestOnColor(), which picks by real contrast.
//
//   Several existing tokens do not reach WCAG AA on every palette (measured: textSecondary, textMuted, primary used as
//   text, success / warning / danger on surface). They are NOT changed. The `accessible` group provides AA-safe
//   companions: the SAME colour when it already passes, otherwise the minimal shift toward the theme's own `text`.

export type AwaStateLayerKind = 'hover' | 'focus' | 'pressed' | 'drag';

/** Opacity of the Material state layers. The 0.08 / 0.10 / 0.16 steps exist in the export (`stateLayers*Opacity08|10|16`);
 * which interaction uses which step is Material guidance, not export data. */
export const AWA_STATE_LAYER_OPACITY: Readonly<Record<AwaStateLayerKind, number>> = {
  hover: 0.08,
  focus: 0.1,
  pressed: 0.1,
  drag: 0.16,
};

export type AwaAccessibleColors = {
  /** textSecondary, at least 4.5:1 on background, surface and surfaceSecondary. */
  onSurfaceVariant: string;
  /** textMuted, at least 4.5:1 on the same three. */
  textMuted: string;
  /** primary used AS TEXT or as a glyph that carries meaning, at least 4.5:1. */
  primaryAsText: string;
  /** Status colours used as text on surface, at least 4.5:1. */
  successText: string;
  warningText: string;
  dangerText: string;
};

export type AwaRoles = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  /** >= 3:1 on surface and background (non-text UI such as an input border). */
  outline: string;
  /** The existing translucent `border`. Decorative dividers only. */
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;
  inverseSurface: string;
  inverseOnSurface: string;
  scrim: string;
  accessible: AwaAccessibleColors;
};

/** A translucent state layer for `color` (rgba string). Pure. */
export function stateLayer(color: string, kind: AwaStateLayerKind): string {
  const {r, g, b} = parseColor(color);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${AWA_STATE_LAYER_OPACITY[kind]})`;
}

const cache = new WeakMap<ResolvedAwaTheme, AwaRoles>();

/**
 * The semantic roles of a resolved theme. Memoized per theme object (a theme change produces a new object, hence new
 * roles). Never mutates its input. Deterministic.
 */
export function deriveAwaRoles(theme: ResolvedAwaTheme): AwaRoles {
  const cached = cache.get(theme);
  if (cached) {
    return cached;
  }
  const c = theme.colors;
  const towardsText = c.text;
  const bases = [c.background, c.surface, c.surfaceSecondary];

  // Tinted containers: a fraction of the status / brand colour over the surface, so the readable pair stays calm.
  const tintAmount = theme.isDark ? 0.78 : 0.86;
  const tint = (fill: string) => interpolateHex(fill, c.surface, tintAmount);
  const onContainer = (container: string) => ensureContrast(towardsText, container, WCAG_AA_TEXT, towardsText);

  const errorContainer = tint(c.danger);
  const successContainer = tint(c.success);
  const warningContainer = tint(c.warning);

  const roles: AwaRoles = {
    primary: c.primary,
    onPrimary: onPrimaryTextColor(theme),
    primaryContainer: c.primarySoft,
    onPrimaryContainer: onContainer(c.primarySoft),
    secondary: c.secondary,
    onSecondary: bestOnColor(c.secondary),
    background: c.background,
    onBackground: c.text,
    surface: c.surface,
    onSurface: c.text,
    surfaceVariant: c.surfaceSecondary,
    onSurfaceVariant: c.textSecondary,
    surfaceContainerLowest: c.surface,
    surfaceContainerLow: interpolateHex(c.surface, c.surfaceSecondary, 0.5),
    surfaceContainer: c.surfaceSecondary,
    surfaceContainerHigh: interpolateHex(c.surfaceSecondary, c.primary, 0.06),
    surfaceContainerHighest: interpolateHex(c.surfaceSecondary, c.primary, 0.12),
    outline: ensureContrast(
      interpolateHex(c.textSecondary, c.background, 0.45),
      [c.background, c.surface],
      WCAG_AA_UI,
      towardsText,
    ),
    outlineVariant: c.border,
    error: c.danger,
    onError: bestOnColor(c.danger),
    errorContainer,
    onErrorContainer: onContainer(errorContainer),
    success: c.success,
    onSuccess: bestOnColor(c.success),
    successContainer,
    onSuccessContainer: onContainer(successContainer),
    warning: c.warning,
    onWarning: bestOnColor(c.warning),
    warningContainer,
    onWarningContainer: onContainer(warningContainer),
    inverseSurface: c.text,
    inverseOnSurface: c.background,
    scrim: 'rgba(0, 0, 0, 0.32)',
    accessible: {
      onSurfaceVariant: ensureContrast(c.textSecondary, bases, WCAG_AA_TEXT, towardsText),
      textMuted: ensureContrast(c.textMuted, bases, WCAG_AA_TEXT, towardsText),
      primaryAsText: ensureContrast(c.primary, bases, WCAG_AA_TEXT, towardsText),
      successText: ensureContrast(c.success, bases, WCAG_AA_TEXT, towardsText),
      warningText: ensureContrast(c.warning, bases, WCAG_AA_TEXT, towardsText),
      dangerText: ensureContrast(c.danger, bases, WCAG_AA_TEXT, towardsText),
    },
  };

  Object.freeze(roles.accessible);
  Object.freeze(roles);
  cache.set(theme, roles);
  return roles;
}
