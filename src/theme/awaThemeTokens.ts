import {
  getAwaThemeById,
  type AwaThemeColors,
  type AwaThemeId,
} from '../config/awaThemes';
import {homeShadow} from '../components/home/homeTheme';

/* -------------------------------------------------------------------------- */
/*                                   SCOPE                                    */
/* -------------------------------------------------------------------------- */

// Phase A foundation only — see AwaThemeProvider.tsx. This module is pure
// (no React, no AsyncStorage) and turns a *selectable* AwaThemeId + a
// light/dark flag + the true-black preference into one fully resolved,
// ready-to-render token set. Nothing in the app consumes these tokens yet;
// no screen/component is migrated in this phase.
//
// 'midnight' (see awaThemes.ts) is NEVER resolvable through this module as a
// user-facing theme — it is used only as the internal color donor for AWA
// Original's dark variant below, exactly as awaThemes.ts's own header
// comment already documents ("Midnight reste dans le registre pour pouvoir
// utiliser ses couleurs comme base technique du mode sombre"). This mirrors
// AppearanceScreen.tsx's own existing DARK_CHROME, which already does the
// same thing.
//
// Semantic/medical/calendar colors (period, fertile, ovulation, Postpartum's
// DELIVERY_COLOR, Menopause's stage tints, MENOPAUSE_MOOD_COLORS/
// MENOPAUSE_INTENSITY_COLORS, the Dhul Hijja marker, success/warning/danger
// as used for medical status elsewhere) are DELIBERATELY OUT OF SCOPE here.
// They live in their own per-feature files today and must keep doing so —
// this module never reads or overrides them.

/** Every id `resolveAwaTheme` can actually resolve — i.e. every currently
 * *selectable* theme. `midnight` is excluded on purpose (see above). */
export type ResolvableAwaThemeId = Exclude<AwaThemeId, 'midnight'>;

const RESOLVABLE_IDS: readonly ResolvableAwaThemeId[] = [
  'awa-original',
  'lavender-night',
  'rose-quartz',
  'sage-serenity',
  'ocean-calm',
  'warm-sand',
];

function isResolvableAwaThemeId(value: AwaThemeId): value is ResolvableAwaThemeId {
  return (RESOLVABLE_IDS as readonly AwaThemeId[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/*                          RESOLVED TOKEN MODEL                              */
/* -------------------------------------------------------------------------- */

/** Additive extension of `AwaThemeColors` (src/config/awaThemes.ts) — the
 * base 14 fields are untouched; these three are new roles needed for
 * whole-app theming (tab bar active/inactive icon tint, a muted/disabled
 * text tier) that don't exist per-theme in the registry yet. */
export type AwaResolvedColors = AwaThemeColors & {
  textMuted: string;
  navigationActive: string;
  navigationInactive: string;
};

export type AwaThemeGradients = {
  /** The canonical full-bleed page background gradient duplicated today as a
   * raw literal across ~40 files (e.g. `['#FAF8FD','#F4EFFA','#EEE7F7','#E9E1F3']`
   * with `locations={[0,0.32,0.7,1]}`). For `awa-original` LIGHT this is
   * exactly that literal. No screen is migrated to read this in Phase A. */
  pageBackground: readonly [string, string, string, string];
};

export type AwaThemeShadow = {
  shadowColor: string;
  shadowOffset: {width: number; height: number};
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export type ResolvedAwaTheme = {
  /** Always one of the 6 selectable ids — never 'midnight'. */
  id: ResolvableAwaThemeId;
  isDark: boolean;
  colors: AwaResolvedColors;
  gradients: AwaThemeGradients;
  shadow: AwaThemeShadow;
  /** Derived from the resolved background's luminance — safe even when
   * true-black is active. */
  statusBarStyle: 'light-content' | 'dark-content';
};

/* -------------------------------------------------------------------------- */
/*                        SMALL, DETERMINISTIC COLOR MATH                     */
/* -------------------------------------------------------------------------- */

// Deliberately simple and fully deterministic — used only to (a) interpolate
// a 4-stop gradient between two colors ALREADY defined by a given theme's own
// palette (never invented from nothing), and (b) derive a muted text tone and
// a StatusBar style from real luminance. This is NOT used to invert a light
// palette into a dark one — every dark variant below is a hand-authored
// literal, not a formula (see "DARK VARIANTS" section).

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: readonly [number, number, number]): string {
  const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel)));
  return `#${[r, g, b].map(channel => clamp(channel).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function interpolateHex(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return rgbToHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
}

/** A 4-stop gradient drifting from `from` toward `to`, matching the shape
 * (`locations={[0,0.32,0.7,1]}`) of the app's existing canonical gradient. */
function buildPageGradient(from: string, to: string): readonly [string, string, string, string] {
  return [
    from,
    interpolateHex(from, to, 0.32),
    interpolateHex(from, to, 0.7),
    to,
  ] as const;
}

/** Simplified (non-gamma-corrected) relative luminance — sufficient to
 * decide whether a background reads as visually light or dark. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channel => channel / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function pickStatusBarStyle(backgroundHex: string): 'light-content' | 'dark-content' {
  return relativeLuminance(backgroundHex) > 0.5 ? 'dark-content' : 'light-content';
}

/* -------------------------------------------------------------------------- */
/*                              TRUE BLACK                                    */
/* -------------------------------------------------------------------------- */

// Intentionally the exact same literals as AppearanceScreen.tsx's own
// TRUE_BLACK_BACKGROUND/TRUE_BLACK_CARD constants — kept in sync manually
// since Phase A does not modify AppearanceScreen.tsx. Only ever applied on
// top of a DARK resolved theme; Light is never affected (see resolveAwaTheme).
const TRUE_BLACK_BACKGROUND = '#030304';
const TRUE_BLACK_CARD = '#0B0B10';

/* -------------------------------------------------------------------------- */
/*                    PER-THEME VARIANT DEFINITIONS                           */
/* -------------------------------------------------------------------------- */

type ThemeVariant = {
  colors: AwaResolvedColors;
  shadowColor: string;
};

function withDerivedFields(
  base: AwaThemeColors,
  extra: {textMuted: string; navigationActive: string; navigationInactive: string},
): AwaResolvedColors {
  return {...base, ...extra};
}

/* ---- LIGHT VARIANTS ---- */
// 5 of these 6 are byte-identical to the CURRENT awaThemes.ts registry
// entries — this is the AWA Original LIGHT contract (§ see AwaThemeProvider
// header) extended to every other palette's own already-shipped definition,
// so none of the 6 palettes' current appearance changes. `lavender-night`
// is the one deliberate exception: its existing registry entry is itself a
// dark-toned "night" palette by design (dark background, light text) — it
// cannot also serve as ITS OWN light variant without breaking the
// System/Light/Dark contract (selecting "Light" must always produce a light
// UI, regardless of which palette is selected). Its current values are
// therefore used as its DARK variant below, and a new, distinct light
// reading — built from the same lavender hue family — is authored here.

const AWA_ORIGINAL_LIGHT: AwaThemeColors = getAwaThemeById('awa-original')!.colors;
const ROSE_QUARTZ_LIGHT: AwaThemeColors = getAwaThemeById('rose-quartz')!.colors;
const SAGE_SERENITY_LIGHT: AwaThemeColors = getAwaThemeById('sage-serenity')!.colors;
const OCEAN_CALM_LIGHT: AwaThemeColors = getAwaThemeById('ocean-calm')!.colors;
const WARM_SAND_LIGHT: AwaThemeColors = getAwaThemeById('warm-sand')!.colors;
const LAVENDER_NIGHT_DARK_SOURCE: AwaThemeColors = getAwaThemeById('lavender-night')!.colors;

// New light reading for Lavender Night — same primary/secondary/accent hue
// family (periwinkle-lavender), re-balanced for a light background instead
// of the existing dark one.
const LAVENDER_NIGHT_LIGHT: AwaThemeColors = {
  background: '#F6F2FE',
  surface: '#FFFFFF',
  surfaceSecondary: '#EDE6FA',
  primary: '#8C74D6',
  primarySoft: '#EDE6FA',
  secondary: '#B79CF2',
  text: '#2A2145',
  textSecondary: '#6B5D8C',
  border: 'rgba(140,116,214,0.18)',
  navigation: '#FFFFFF',
  accent: '#5B3FA0',
  success: LAVENDER_NIGHT_DARK_SOURCE.success,
  warning: LAVENDER_NIGHT_DARK_SOURCE.warning,
  danger: LAVENDER_NIGHT_DARK_SOURCE.danger,
};

/* ---- DARK VARIANTS ---- */
// Hand-authored, not derived by formula/inversion — each keeps its palette's
// own hue family (primary/secondary/accent lightened for legibility on a
// dark background) while success/warning/danger stay identical to that same
// theme's light variant (they are tuned status accents, not the true
// semantic/medical colors, which live elsewhere and are untouched by this
// file entirely — see the SCOPE note above).

// AWA Original's dark variant reuses Midnight's own colors wholesale
// (including ITS success/warning/danger, since Midnight was authored as one
// coherent dark palette) — exactly what awaThemes.ts's own header comment
// says Midnight is kept in the registry for, and exactly what
// AppearanceScreen.tsx's existing DARK_CHROME already does today.
const AWA_ORIGINAL_DARK: AwaThemeColors = getAwaThemeById('midnight')!.colors;

const LAVENDER_NIGHT_DARK: AwaThemeColors = LAVENDER_NIGHT_DARK_SOURCE;

const ROSE_QUARTZ_DARK: AwaThemeColors = {
  background: '#241A1C',
  surface: '#2E2224',
  surfaceSecondary: '#3A2B2E',
  primary: '#E3B4BC',
  primarySoft: '#3A2B2E',
  secondary: '#D9AFAE',
  text: '#F7EBEA',
  textSecondary: '#C9A9AE',
  border: 'rgba(227,180,188,0.20)',
  navigation: '#2E2224',
  accent: '#F0C7CD',
  success: ROSE_QUARTZ_LIGHT.success,
  warning: ROSE_QUARTZ_LIGHT.warning,
  danger: ROSE_QUARTZ_LIGHT.danger,
};

const SAGE_SERENITY_DARK: AwaThemeColors = {
  background: '#1C201A',
  surface: '#242A21',
  surfaceSecondary: '#2E362A',
  primary: '#A9C29E',
  primarySoft: '#2E362A',
  secondary: '#A9B98F',
  text: '#EFF2EA',
  textSecondary: '#B7C2AE',
  border: 'rgba(169,194,158,0.20)',
  navigation: '#242A21',
  accent: '#C3D9B8',
  success: SAGE_SERENITY_LIGHT.success,
  warning: SAGE_SERENITY_LIGHT.warning,
  danger: SAGE_SERENITY_LIGHT.danger,
};

const OCEAN_CALM_DARK: AwaThemeColors = {
  background: '#141E22',
  surface: '#1B282D',
  surfaceSecondary: '#22333A',
  primary: '#8FBCD3',
  primarySoft: '#22333A',
  secondary: '#8FB4C4',
  text: '#E9F2F5',
  textSecondary: '#A9C2CC',
  border: 'rgba(143,188,211,0.20)',
  navigation: '#1B282D',
  accent: '#B7DCEC',
  success: OCEAN_CALM_LIGHT.success,
  warning: OCEAN_CALM_LIGHT.warning,
  danger: OCEAN_CALM_LIGHT.danger,
};

const WARM_SAND_DARK: AwaThemeColors = {
  background: '#221B12',
  surface: '#2C2418',
  surfaceSecondary: '#382D1D',
  primary: '#D9B486',
  primarySoft: '#382D1D',
  secondary: '#CBA97C',
  text: '#F5ECDF',
  textSecondary: '#C7AF8E',
  border: 'rgba(217,180,134,0.20)',
  navigation: '#2C2418',
  accent: '#E8CBA0',
  success: WARM_SAND_LIGHT.success,
  warning: WARM_SAND_LIGHT.warning,
  danger: WARM_SAND_LIGHT.danger,
};

function buildVariant(base: AwaThemeColors, isDark: boolean): ThemeVariant {
  const textMuted = interpolateHex(base.textSecondary, base.background, 0.35);
  return {
    colors: withDerivedFields(base, {
      textMuted,
      navigationActive: base.primary,
      navigationInactive: textMuted,
    }),
    // Light shadows read as a soft tint of the palette's own accent (exactly
    // homeShadow.shadowColor for awa-original, since accent there IS
    // homeColors.primaryDark). Dark surfaces already provide their own
    // depth, so dark shadows are a plain, slightly stronger black instead.
    shadowColor: isDark ? '#000000' : base.accent,
  };
}

const LIGHT_VARIANTS: Record<ResolvableAwaThemeId, ThemeVariant> = {
  'awa-original': buildVariant(AWA_ORIGINAL_LIGHT, false),
  'lavender-night': buildVariant(LAVENDER_NIGHT_LIGHT, false),
  'rose-quartz': buildVariant(ROSE_QUARTZ_LIGHT, false),
  'sage-serenity': buildVariant(SAGE_SERENITY_LIGHT, false),
  'ocean-calm': buildVariant(OCEAN_CALM_LIGHT, false),
  'warm-sand': buildVariant(WARM_SAND_LIGHT, false),
};

const DARK_VARIANTS: Record<ResolvableAwaThemeId, ThemeVariant> = {
  'awa-original': buildVariant(AWA_ORIGINAL_DARK, true),
  'lavender-night': buildVariant(LAVENDER_NIGHT_DARK, true),
  'rose-quartz': buildVariant(ROSE_QUARTZ_DARK, true),
  'sage-serenity': buildVariant(SAGE_SERENITY_DARK, true),
  'ocean-calm': buildVariant(OCEAN_CALM_DARK, true),
  'warm-sand': buildVariant(WARM_SAND_DARK, true),
};

// AWA Original LIGHT's exact canonical page-background gradient, duplicated
// verbatim today across ~40 files — kept as a literal (not derived) so this
// one value is contractually guaranteed to match, byte for byte.
const AWA_ORIGINAL_LIGHT_GRADIENT: readonly [string, string, string, string] = [
  '#FAF8FD',
  '#F4EFFA',
  '#EEE7F7',
  '#E9E1F3',
];

function gradientFor(id: ResolvableAwaThemeId, isDark: boolean, variant: ThemeVariant): AwaThemeGradients {
  if (id === 'awa-original' && !isDark) {
    return {pageBackground: AWA_ORIGINAL_LIGHT_GRADIENT};
  }
  return {pageBackground: buildPageGradient(variant.colors.background, variant.colors.surfaceSecondary)};
}

/* -------------------------------------------------------------------------- */
/*                    PHASE C — SMALL SHARED-COMPONENT HELPERS                */
/* -------------------------------------------------------------------------- */

// Two small, pure, generic derivations needed repeatedly once real shared
// components consume `theme.colors.*` directly — added here (not
// re-implemented per component) per the "do not duplicate theme resolution
// logic inside components" rule. Neither is a new *color token*: both are
// pure functions of already-resolved values.

/**
 * The readable text/icon color for something drawn ON TOP of an arbitrary
 * already-resolved fill color (a filled button using `theme.colors.primary`,
 * a "done"/status badge using `theme.colors.success`, etc.) — decided from
 * THAT fill's own real luminance, never from `theme.isDark` or from a
 * different color entirely.
 *
 * PROVEN CONTRAST FINDING (Phase C): an earlier version of this helper
 * special-cased `theme.colors.primary` and picked purely from `theme.isDark`
 * ("white in light mode, dark background in dark mode"). Computing real
 * luminance for every one of the 12 theme × light/dark `primary` values
 * showed that rule fails broadly:
 *   - awa-original LIGHT: 0.36 (dark enough — matches the app's existing
 *     white-on-primary buttons exactly, unchanged).
 *   - rose-quartz LIGHT: 0.59, sage-serenity LIGHT: 0.55, ocean-calm LIGHT:
 *     0.52, warm-sand LIGHT: 0.56, lavender-night LIGHT: 0.50 — all
 *     light-luminance. White text on any of these has poor contrast; this
 *     was a real, pre-existing characteristic of these palettes' `primary`
 *     values (rose-quartz's in particular was already this way in the
 *     untouched awaThemes.ts registry) that nothing had ever actually
 *     rendered until this phase's migration made real UI use it as a bold
 *     fill for the first time.
 *   - every DARK variant's `primary` (0.59-0.75): all light-luminance by
 *     design (see the "DARK VARIANTS" section above) — white text is
 *     always wrong there too.
 *   - `theme.colors.success` (used as a badge fill, not `primary`) is
 *     ALSO light-luminance in every theme except awa-original's own DARK
 *     (Midnight) variant — the earlier helper being keyed to `primary`'s
 *     luminance while actually being applied on top of a `success` fill was
 *     itself a mismatch bug, not just a threshold problem.
 *
 * The fix: take the actual fill color as the argument and decide purely
 * from ITS real luminance — dark text once it's light enough to need it,
 * plain white otherwise. This keeps AWA Original LIGHT's existing
 * white-on-primary buttons pixel-identical (0.36 stays under the
 * threshold) while correctly fixing every other case, whichever token is
 * used as the fill.
 */
const READABLE_TEXT_LUMINANCE_THRESHOLD = 0.45;
const READABLE_DARK_TEXT = '#1A1626';

export function pickReadableTextColor(fillHex: string): string {
  return relativeLuminance(fillHex) > READABLE_TEXT_LUMINANCE_THRESHOLD
    ? READABLE_DARK_TEXT
    : '#FFFFFF';
}

/** Convenience alias for the single most common case — text/icons drawn on
 * top of `theme.colors.primary` specifically. */
export function onPrimaryTextColor(theme: ResolvedAwaTheme): string {
  return pickReadableTextColor(theme.colors.primary);
}

/** `#RRGGBB` (or `#RGB`) + an 0-1 alpha -> `rgba(r,g,b,a)`. Used only to
 * preserve an existing component's own translucency effect (e.g. a
 * frosted bottom bar) while sourcing the underlying color from the
 * resolved theme instead of a hardcoded literal. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* -------------------------------------------------------------------------- */
/*                                 RESOLVER                                   */
/* -------------------------------------------------------------------------- */

/**
 * Turns a theme id + light/dark flag + true-black preference into one fully
 * resolved token set. Never throws — an unresolvable/unknown id (including
 * 'midnight', which must never surface as a user-facing runtime theme)
 * safely falls back to 'awa-original'.
 */
export function resolveAwaTheme(
  themeId: AwaThemeId,
  isDark: boolean,
  trueBlackEnabled: boolean,
): ResolvedAwaTheme {
  const safeId: ResolvableAwaThemeId = isResolvableAwaThemeId(themeId) ? themeId : 'awa-original';
  const variant = isDark ? DARK_VARIANTS[safeId] : LIGHT_VARIANTS[safeId];

  // True-black only ever meaningfully alters the DARK variant's deepest
  // surfaces — Light is never affected, and the preference itself is never
  // reset here; it simply has no visual effect while isDark is false.
  const colors: AwaResolvedColors =
    isDark && trueBlackEnabled
      ? {...variant.colors, background: TRUE_BLACK_BACKGROUND, surface: TRUE_BLACK_CARD}
      : variant.colors;

  const gradients =
    isDark && trueBlackEnabled
      ? {pageBackground: buildPageGradient(colors.background, colors.surfaceSecondary)}
      : gradientFor(safeId, isDark, variant);

  return {
    id: safeId,
    isDark,
    colors,
    gradients,
    shadow: {
      shadowColor: variant.shadowColor,
      shadowOffset: homeShadow.shadowOffset,
      shadowOpacity: isDark ? 0.4 : homeShadow.shadowOpacity,
      shadowRadius: homeShadow.shadowRadius,
      elevation: homeShadow.elevation,
    },
    statusBarStyle: pickStatusBarStyle(colors.background),
  };
}
