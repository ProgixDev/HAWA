import React from 'react';
import {Platform, StyleSheet, Text, TextInput, type TextStyle} from 'react-native';

import {getAppLanguage} from '../state/themePreferences';

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

// HINDI (Devanagari). The Android system font that draws Devanagari has taller vertical metrics than Inter (matras above the
// headline, conjuncts and marks below the baseline), so the Material line heights (1.25 – 1.43 x the font size) and the
// tighter legacy ones can crop them. Only while the app language is Hindi, and only for a Text / TextInput that really holds
// Devanagari, a numeric lineHeight below 1.45 x the font size is raised to it and a non-zero letterSpacing is reset to 0 (see
// devanagariAdjustment). Other languages, and Hindi texts without Devanagari (digits, "AWA"), keep their style exactly.
export const DEVANAGARI_LINE_HEIGHT_RATIO = 1.45;
const DEVANAGARI_RE = /[\u0900-\u097F]/;

/** True when a string, or any string inside the (nested) children, holds a Devanagari character. */
export function containsDevanagari(node: unknown, depth = 0): boolean {
  if (typeof node === 'string') {
    return DEVANAGARI_RE.test(node);
  }
  if (depth > 4 || node === null || typeof node !== 'object') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(item => containsDevanagari(item, depth + 1));
  }
  const props = (node as {props?: {children?: unknown}}).props;
  return props ? containsDevanagari(props.children, depth + 1) : false;
}

/** The raised lineHeight for a Devanagari text, or null when the style needs no change. */
export function devanagariLineHeight(style: TextStyle | undefined): number | null {
  const flat = style ?? {};
  if (typeof flat.lineHeight !== 'number' || typeof flat.fontSize !== 'number') {
    return null; // no explicit line height: the platform uses the font's own metrics
  }
  const wanted = Math.ceil(flat.fontSize * DEVANAGARI_LINE_HEIGHT_RATIO * 2) / 2;
  return flat.lineHeight < wanted ? wanted : null;
}

/** Everything the layer changes for a Devanagari text, or null when the style needs nothing. Besides the line height: Android
 * applies `letterSpacing` per glyph, which pulls a vowel sign or the parts of a conjunct away from their letter, so tracking is
 * reset to 0 (the Material tracking values are at most 0.5 sp, a difference nobody reads in a script that is not tracked). */
export function devanagariAdjustment(style: TextStyle | undefined): Pick<TextStyle, 'lineHeight' | 'letterSpacing'> | null {
  const lineHeight = devanagariLineHeight(style);
  const resetTracking = typeof style?.letterSpacing === 'number' && style.letterSpacing !== 0;
  if (lineHeight === null && !resetTracking) {
    return null;
  }
  return {...(lineHeight !== null ? {lineHeight} : {}), ...(resetTracking ? {letterSpacing: 0} : {})};
}

// JAPANESE (kana + kanji). Japanese text reads best on a taller line than the tight Material headline / display lines (1.12 - 1.33 x
// the font size), and Android applies `letterSpacing` between the characters of a script that is never tracked. Only while the app
// language is Japanese, and only for a Text / TextInput that really holds kana or kanji, a numeric lineHeight below 1.35 x the font
// size is raised to it and a non-zero letterSpacing is reset to 0 (see japaneseAdjustment). Other languages, and Japanese texts
// without kana or kanji (digits, "AWA"), keep their style exactly.
export const JAPANESE_LINE_HEIGHT_RATIO = 1.35;
const JAPANESE_RE = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/;

/** True when a string, or any string inside the (nested) children, holds a hiragana, katakana or kanji character. */
export function containsJapanese(node: unknown, depth = 0): boolean {
  if (typeof node === 'string') {
    return JAPANESE_RE.test(node);
  }
  if (depth > 4 || node === null || typeof node !== 'object') {
    return false;
  }
  if (Array.isArray(node)) {
    return node.some(item => containsJapanese(item, depth + 1));
  }
  const props = (node as {props?: {children?: unknown}}).props;
  return props ? containsJapanese(props.children, depth + 1) : false;
}

/** Everything the layer changes for a Japanese text, or null when the style needs nothing. */
export function japaneseAdjustment(style: TextStyle | undefined): Pick<TextStyle, 'lineHeight' | 'letterSpacing'> | null {
  let lineHeight: number | null = null;
  if (typeof style?.lineHeight === 'number' && typeof style.fontSize === 'number') {
    const wanted = Math.ceil(style.fontSize * JAPANESE_LINE_HEIGHT_RATIO * 2) / 2;
    lineHeight = style.lineHeight < wanted ? wanted : null;
  }
  const resetTracking = typeof style?.letterSpacing === 'number' && style.letterSpacing !== 0;
  if (lineHeight === null && !resetTracking) {
    return null;
  }
  return {...(lineHeight !== null ? {lineHeight} : {}), ...(resetTracking ? {letterSpacing: 0} : {})};
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
    let next = font ? {...props, style: [props.style, font]} : props;
    if (getAppLanguage() === 'hi' && (containsDevanagari(props.children) || containsDevanagari(props.value) || containsDevanagari(props.defaultValue) || containsDevanagari(props.placeholder))) {
      const adjustment = devanagariAdjustment(StyleSheet.flatten(next.style as TextStyle));
      if (adjustment !== null) {
        next = {...next, style: [next.style, adjustment]};
      }
    }
    if (getAppLanguage() === 'ja' && (containsJapanese(props.children) || containsJapanese(props.value) || containsJapanese(props.defaultValue) || containsJapanese(props.placeholder))) {
      const adjustment = japaneseAdjustment(StyleSheet.flatten(next.style as TextStyle));
      if (adjustment !== null) {
        next = {...next, style: [next.style, adjustment]};
      }
    }
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
