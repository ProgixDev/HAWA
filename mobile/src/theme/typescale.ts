import {Platform, type TextStyle} from 'react-native';

// Material Design 3 type scale for AWA (Phase 1, additive; read by the shared `components/ui` layer only).
//
// PROVENANCE
//   size / lineHeight / tracking : VERIFIED — `typescale.baseline.static<Role>{Size,LineHeight,Tracking}` in
//                                  docs/design-system/material3-tokens-normalized.json (a test compares every number
//                                  with that file, so drift fails the build).
//   weight                       : PROVISIONAL. In the export every `static<Role>Weight` is an unresolved
//                                  `VariableID:55064:1550x`. The three IDs are used in the order Regular (…15505),
//                                  Medium (…15506), Bold (…15507) and "WeightEmphasized" is one step higher, which
//                                  matches both `fontTheme.baseline` (Regular / Medium / "SemiBold") and the published
//                                  Material 3 type scale. That is an INFERENCE, not data: confirm with the Figma
//                                  variables before relying on it.
//   font family                  : none. `fontTheme.baseline` names Roboto, which is the Android system sans, so the
//                                  platform default is used and no custom font is bundled.
//
// `letterSpacing` is the JSON tracking number as-is. Its unit on React Native (dp vs sp) is NOT verified on device.
//
// RENDERED WEIGHT ON ANDROID (Option A, approved): Roboto, the Android system sans, ships static faces for 100, 300,
// 400, 500, 700 and 900 only. There is no 600 face, so a requested 600 snaps to Medium (500), which is exactly the
// role's regular weight: "emphasized" text looked unchanged on a real phone. React Native 0.80 does not synthesize the
// missing weight (`ReactFontManager.TypefaceStyle.apply` forwards the number to `Typeface.create`; below API 28 every
// weight under 700 collapses to Regular). So `AWA_TYPESCALE` keeps the DESIGN weight and `renderableFontWeight` resolves
// it to a weight the platform can actually draw (600 -> 700 on Android). No font file is bundled.

export type AwaTextRole =
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'headlineSmall'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall';

export type AwaFontWeight = '400' | '500' | '600';

/** A weight `awaTextStyle` can emit: a design weight, or the 700 that stands in for a 600 on Android. */
export type AwaRenderedFontWeight = AwaFontWeight | '700';

export type AwaTextRoleSpec = {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  /** PROVISIONAL (see header). */
  readonly fontWeight: AwaFontWeight;
  /** PROVISIONAL: the "WeightEmphasized" variant of the role. */
  readonly fontWeightEmphasized: AwaFontWeight;
};

export const AWA_TYPESCALE_PROVENANCE = {
  sizeLineHeightTracking: 'verified: material3-tokens-normalized.json typescale.baseline',
  weight: 'provisional: json-inferred from unresolved VariableID:55064:15505/15506/15507',
  renderedWeight: 'android: 600 resolves to 700 (Roboto has no 600 face); other platforms keep the design weight',
  fontFamily: 'platform default (Roboto on Android); no custom font bundled',
} as const;

export const AWA_TYPESCALE: Readonly<Record<AwaTextRole, AwaTextRoleSpec>> = {
  displayLarge: {fontSize: 57, lineHeight: 64, letterSpacing: -0.25, fontWeight: '400', fontWeightEmphasized: '500'},
  displayMedium: {fontSize: 45, lineHeight: 52, letterSpacing: 0, fontWeight: '400', fontWeightEmphasized: '500'},
  displaySmall: {fontSize: 36, lineHeight: 44, letterSpacing: 0, fontWeight: '400', fontWeightEmphasized: '500'},
  headlineLarge: {fontSize: 32, lineHeight: 40, letterSpacing: 0, fontWeight: '400', fontWeightEmphasized: '500'},
  headlineMedium: {fontSize: 28, lineHeight: 36, letterSpacing: 0, fontWeight: '400', fontWeightEmphasized: '500'},
  headlineSmall: {fontSize: 24, lineHeight: 32, letterSpacing: 0, fontWeight: '400', fontWeightEmphasized: '500'},
  titleLarge: {fontSize: 22, lineHeight: 28, letterSpacing: 0, fontWeight: '400', fontWeightEmphasized: '500'},
  titleMedium: {fontSize: 16, lineHeight: 24, letterSpacing: 0.15, fontWeight: '500', fontWeightEmphasized: '600'},
  titleSmall: {fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: '500', fontWeightEmphasized: '600'},
  bodyLarge: {fontSize: 16, lineHeight: 24, letterSpacing: 0.5, fontWeight: '400', fontWeightEmphasized: '500'},
  bodyMedium: {fontSize: 14, lineHeight: 20, letterSpacing: 0.25, fontWeight: '400', fontWeightEmphasized: '500'},
  bodySmall: {fontSize: 12, lineHeight: 16, letterSpacing: 0.4, fontWeight: '400', fontWeightEmphasized: '500'},
  labelLarge: {fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: '500', fontWeightEmphasized: '600'},
  labelMedium: {fontSize: 12, lineHeight: 16, letterSpacing: 0.5, fontWeight: '500', fontWeightEmphasized: '600'},
  labelSmall: {fontSize: 11, lineHeight: 16, letterSpacing: 0.5, fontWeight: '500', fontWeightEmphasized: '600'},
} as const;

export const AWA_TEXT_ROLES = Object.keys(AWA_TYPESCALE) as AwaTextRole[];

/** The smallest size in the scale (Label Small). Anything below it is outside Material 3. */
export const AWA_MIN_TEXT_SIZE: number = AWA_TYPESCALE.labelSmall.fontSize;

/**
 * The weight to hand to React Native for a design weight on `platform` (default: the running platform). Android has no
 * 600 face (see the header), so 600 becomes 700 there; every other weight and platform is returned unchanged.
 */
export function renderableFontWeight(weight: AwaFontWeight, platform: string = Platform.OS): AwaRenderedFontWeight {
  return platform === 'android' && weight === '600' ? '700' : weight;
}

/**
 * The primary onboarding action label (the Welcome and Name buttons). AWA-specific, not a Material 3 role, hence an
 * exception in docs/design-system/EXCEPTIONS.md: 17 sp (approved by the product owner) at weight 700, the lightest
 * weight Android renders visibly heavier than Medium. Only size and weight are overridden; the line height stays the
 * button label role's own (labelLarge, 20).
 */
export const AWA_PRIMARY_ACTION_LABEL = {fontSize: 17, fontWeight: '700'} as const;

export type AwaTextStyleOptions = {
  /** Uses the role's "WeightEmphasized" variant (provisional). */
  emphasized?: boolean;
  color?: string;
  /** Escape hatch for an approved brand exception (e.g. the logotype); unset = platform default. */
  fontFamily?: string;
  /** Platform the weight is resolved for (tests / previews); default = the running platform. */
  platform?: string;
};

/** A React Native text style for a role. Pure for a given platform; returns a new plain object each call. */
export function awaTextStyle(role: AwaTextRole, options: AwaTextStyleOptions = {}): TextStyle {
  const spec = AWA_TYPESCALE[role];
  const style: TextStyle = {
    fontSize: spec.fontSize,
    lineHeight: spec.lineHeight,
    letterSpacing: spec.letterSpacing,
    fontWeight: renderableFontWeight(
      options.emphasized ? spec.fontWeightEmphasized : spec.fontWeight,
      options.platform,
    ),
  };
  if (options.color !== undefined) {
    style.color = options.color;
  }
  if (options.fontFamily !== undefined) {
    style.fontFamily = options.fontFamily;
  }
  return style;
}

// Order used to break ties in nearestTextRole: the most common functional roles first.
const NEAREST_PRIORITY: readonly AwaTextRole[] = [
  'bodyMedium',
  'labelLarge',
  'titleSmall',
  'bodyLarge',
  'titleMedium',
  'bodySmall',
  'labelMedium',
  'labelSmall',
  'titleLarge',
  'headlineSmall',
  'headlineMedium',
  'headlineLarge',
  'displaySmall',
  'displayMedium',
  'displayLarge',
];

/**
 * The role whose font size is closest to a legacy literal (for the migration audit and codemods; it is NOT used at
 * runtime). Ties resolve by NEAREST_PRIORITY, so the result is deterministic.
 */
export function nearestTextRole(fontSize: number): AwaTextRole {
  let best: AwaTextRole = NEAREST_PRIORITY[0];
  let bestDistance = Math.abs(AWA_TYPESCALE[best].fontSize - fontSize);
  for (const role of NEAREST_PRIORITY) {
    const distance = Math.abs(AWA_TYPESCALE[role].fontSize - fontSize);
    if (distance < bestDistance) {
      best = role;
      bestDistance = distance;
    }
  }
  return best;
}

/** True when a legacy literal is below the smallest Material 3 text size (accessibility floor of the scale). */
export function isBelowTextFloor(fontSize: number): boolean {
  return fontSize < AWA_MIN_TEXT_SIZE;
}
