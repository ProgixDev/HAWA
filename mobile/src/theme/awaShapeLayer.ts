import {Platform, StyleSheet} from 'react-native';

import {awaShapes} from './shapes';

// Shapes of DESIGN.md (Material 3): rounded.default / md = 12 for cards, buttons and fields, lg = 16, full = pill,
// sheets keep the large 28 top corners. Existing screens declare their own radii (13 – 28); `installAwaShapes()`
// maps them onto that scale when a style sheet is created, so every screen gets the same corners without being
// rewritten. Circles and pills (a radius of at least half of the declared height / width) are never changed, nor
// are the small 4 – 8 radii of indicators and badges.
//
// The same pass applies the 11 sp floor of the Material 3 type scale (Label Small, 11 / 16): a smaller literal font
// size is raised to 11 and a line height under 16 follows it, so text never clips inside its own line box.

const FULL_RADIUS_THRESHOLD = 100;
const MIN_FONT_SIZE = 11;
const MIN_LINE_HEIGHT = 16;
const SHEET_MIN = 20;
const SHEET_MAX = 36;
const CORNER_KEYS = [
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderTopStartRadius',
  'borderTopEndRadius',
  'borderBottomStartRadius',
  'borderBottomEndRadius',
] as const;
const TOP_CORNER_KEYS = new Set<string>(['borderTopLeftRadius', 'borderTopRightRadius', 'borderTopStartRadius', 'borderTopEndRadius']);

type Loose = Record<string, unknown>;

function isRoundShape(radius: number, style: Loose): boolean {
  const height = typeof style.height === 'number' ? style.height : typeof style.minHeight === 'number' ? style.minHeight : undefined;
  const width = typeof style.width === 'number' ? style.width : undefined;
  return (height !== undefined && radius * 2 >= height - 1) || (width !== undefined && radius * 2 >= width - 1);
}

/** The Material 3 radius for a legacy one (pure; exported for tests). */
export function awaShapeRadius(radius: number, style: Loose = {}, corner?: string): number {
  if (!Number.isFinite(radius) || radius <= awaShapes.small || radius >= FULL_RADIUS_THRESHOLD) {
    return radius;
  }
  if (isRoundShape(radius, style)) {
    return radius;
  }
  if (corner && TOP_CORNER_KEYS.has(corner) && radius >= SHEET_MIN && radius <= SHEET_MAX) {
    return awaShapes.extraLarge;
  }
  if (radius <= 14) {
    return awaShapes.medium;
  }
  if (radius <= 17) {
    return awaShapes.large;
  }
  return awaShapes.medium;
}

/** A copy of a style object with its radii mapped (the input is never mutated). */
export function awaShapeStyle<T extends Loose>(style: T): T {
  let next: Loose | null = null;
  const set = (key: string, value: number) => {
    next = next ?? {...style};
    next[key] = value;
  };
  if (typeof style.borderRadius === 'number') {
    const mapped = awaShapeRadius(style.borderRadius, style);
    if (mapped !== style.borderRadius) {
      set('borderRadius', mapped);
    }
  }
  if (typeof style.fontSize === 'number' && style.fontSize > 0 && style.fontSize < MIN_FONT_SIZE) {
    set('fontSize', MIN_FONT_SIZE);
    if (typeof style.lineHeight === 'number' && style.lineHeight < MIN_LINE_HEIGHT) {
      set('lineHeight', MIN_LINE_HEIGHT);
    }
  }
  for (const key of CORNER_KEYS) {
    const value = style[key];
    if (typeof value === 'number') {
      const mapped = awaShapeRadius(value, style, key);
      if (mapped !== value) {
        set(key, mapped);
      }
    }
  }
  return (next ?? style) as T;
}

/** Maps every style of a StyleSheet.create() argument. */
export function awaShapeSheet<T extends Record<string, unknown>>(sheet: T): T {
  const out: Record<string, unknown> = {};
  for (const [name, style] of Object.entries(sheet)) {
    out[name] = style && typeof style === 'object' && !Array.isArray(style) ? awaShapeStyle(style as Loose) : style;
  }
  return out as T;
}

/** Wraps StyleSheet.create (Android only). Returns the function that restores it. */
export function installAwaShapes(): () => void {
  if (Platform.OS !== 'android') {
    return () => undefined;
  }
  const sheet = StyleSheet as unknown as {create: (styles: Record<string, unknown>) => unknown};
  const original = sheet.create;
  sheet.create = function create(styles: Record<string, unknown>) {
    return original.call(sheet, awaShapeSheet(styles));
  };
  return () => {
    sheet.create = original;
  };
}
