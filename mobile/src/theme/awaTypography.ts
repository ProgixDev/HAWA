import React from 'react';
import {Platform, StyleSheet, Text, TextInput, type TextStyle} from 'react-native';

// Typography of DESIGN.md (Material 3, AWA colours): Fraunces for display / screen titles, Inter for everything else,
// IBM Plex Mono for fixed-width text. Static files live in android/app/src/main/assets/fonts (sources in
// assets/fonts). React Native on Android resolves `fontFamily` to the file name and its asset families only know
// regular / bold, so every weight is its own family name and `fontWeight` is reset to 'normal' once a family is chosen
// (otherwise Android would synthesize bold on top of the SemiBold file).
//
// Legacy code states typography with the generic families `serif` / `monospace` (or none) and weights 400 – 900.
// `installAwaTypography()` maps them at render time, so every existing Text and TextInput follows DESIGN.md without
// touching each screen. Glyphs a family lacks (Cyrillic in Fraunces, hanzi everywhere) are drawn per character by
// the Android system fonts.

export type AwaFontCut = '400' | '500' | '600';
export type AwaFontKind = 'display' | 'sans' | 'mono';

export const AWA_FONT_FAMILIES: Readonly<Record<AwaFontKind, Readonly<Record<AwaFontCut, string>>>> = {
  display: {'400': 'Fraunces-Regular', '500': 'Fraunces-Medium', '600': 'Fraunces-SemiBold'},
  sans: {'400': 'Inter-Regular', '500': 'Inter-Medium', '600': 'Inter-SemiBold'},
  mono: {'400': 'IBMPlexMono-Regular', '500': 'IBMPlexMono-Medium', '600': 'IBMPlexMono-Medium'},
};

/** The generic family a component asks for to get the display face (Fraunces on Android, the system serif elsewhere). */
export const AWA_DISPLAY_FONT = 'serif';
/** The generic family a component asks for to get the fixed-width face. */
export const AWA_MONO_FONT = 'monospace';

const ALL_FAMILIES = new Set<string>(
  (Object.values(AWA_FONT_FAMILIES) as Array<Record<AwaFontCut, string>>).flatMap(cuts => Object.values(cuts)),
);

const SANS_ALIASES = new Set(['system', 'sans-serif', 'sans-serif-medium', 'sans-serif-light', 'sans-serif-thin', 'roboto']);

/** DESIGN.md ships 400 / 500 / 600: lighter weights read as 400, 700 and heavier read as 600. */
export function awaFontCut(weight: TextStyle['fontWeight'] | undefined, fallback: AwaFontCut = '400'): AwaFontCut {
  if (weight === undefined) {
    return fallback;
  }
  if (weight === 'normal') {
    return '400';
  }
  if (weight === 'bold') {
    return '600';
  }
  const value = Number(weight);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  if (value >= 600) {
    return '600';
  }
  return value >= 500 ? '500' : '400';
}

function kindOf(fontFamily: string | undefined): AwaFontKind | null {
  if (fontFamily === undefined) {
    return 'sans';
  }
  const family = fontFamily.trim();
  if (ALL_FAMILIES.has(family)) {
    return null; // already one of ours
  }
  const lower = family.toLowerCase();
  if (lower === 'serif') {
    return 'display';
  }
  if (lower === 'monospace') {
    return 'mono';
  }
  return SANS_ALIASES.has(lower) ? 'sans' : null; // an unknown custom family is left alone
}

/**
 * The style entries that give `style` its DESIGN.md face, or null when nothing has to change.
 * `inherited` is true for a <Text> nested in another <Text>: without an explicit family or weight it must keep
 * inheriting its parent's face.
 */
export function resolveAwaFont(style: TextStyle | undefined, inherited = false): Pick<TextStyle, 'fontFamily' | 'fontWeight'> | null {
  const flat = style ?? {};
  if (inherited && flat.fontFamily === undefined && flat.fontWeight === undefined) {
    return null;
  }
  const kind = kindOf(flat.fontFamily);
  if (kind === null) {
    return null;
  }
  const fallback: AwaFontCut = flat.fontFamily?.toLowerCase() === 'sans-serif-medium' ? '500' : '400';
  const cut = awaFontCut(flat.fontWeight, fallback);
  return {fontFamily: AWA_FONT_FAMILIES[kind][cut], fontWeight: 'normal'};
}

// True while rendering inside a <Text> that this layer already wrapped. It replaces React Native's private
// `TextAncestor` context (a deep import that RN deprecates): the layer provides it itself, using only public React API.
const AwaTextNestingContext = React.createContext(false);

export type Renderable = {render?: (props: Record<string, unknown>, ref: unknown) => unknown; __awaTypography?: boolean};

// Resolved faces per registered style object (StyleSheet entries and constant objects are reused between renders), so
// the common case costs one WeakMap lookup instead of a flatten per Text render. Arrays are recreated by callers and
// are resolved directly.
const resolvedCache = new WeakMap<object, Pick<TextStyle, 'fontFamily' | 'fontWeight'> | null>();
const resolvedCacheNested = new WeakMap<object, Pick<TextStyle, 'fontFamily' | 'fontWeight'> | null>();

function resolveStyleProp(style: unknown, inherited: boolean) {
  const cache = inherited ? resolvedCacheNested : resolvedCache;
  if (style && typeof style === 'object' && !Array.isArray(style)) {
    const hit = cache.get(style as object);
    if (hit !== undefined) {
      return hit;
    }
    const value = resolveAwaFont(StyleSheet.flatten(style as TextStyle), inherited);
    cache.set(style as object, value);
    return value;
  }
  return resolveAwaFont(StyleSheet.flatten(style as TextStyle), inherited);
}

/** Wraps `component.render` (exported for tests). Returns the function that removes the wrapper. */
export function patchAwaRender(component: Renderable, nestable: boolean): () => void {
  const original = component.render;
  if (typeof original !== 'function' || component.__awaTypography) {
    return () => undefined;
  }
  component.__awaTypography = true;
  component.render = function awaRender(this: unknown, props: Record<string, unknown>, ref: unknown) {
    // `nestable` is fixed per patched component, so the hook order never changes between renders.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const inherited = nestable ? React.useContext(AwaTextNestingContext) : false;
    const font = resolveStyleProp(props.style, inherited);
    const next = font ? {...props, style: [props.style, font]} : props;
    const rendered = original.call(this, next, ref);
    // Anything drawn inside this Text (nested Text, inline views) is "nested"; TextInput never has Text children.
    return nestable ? React.createElement(AwaTextNestingContext.Provider, {value: true}, rendered as React.ReactNode) : rendered;
  };
  return () => {
    component.render = original;
    component.__awaTypography = false;
  };
}

/** Installs the typography layer on Text and TextInput (Android only). Returns the function that removes it. */
export function installAwaTypography(): () => void {
  if (Platform.OS !== 'android') {
    return () => undefined;
  }
  const undoText = patchAwaRender(Text as unknown as Renderable, true);
  const undoInput = patchAwaRender(TextInput as unknown as Renderable, false);
  return () => {
    undoText();
    undoInput();
  };
}
