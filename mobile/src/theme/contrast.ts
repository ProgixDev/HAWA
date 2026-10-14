// WCAG 2.x contrast utilities for AWA's design tokens (Phase 1, additive).
//
// Why a second luminance implementation: awaThemeTokens.ts already has `relativeLuminance`, but it is a deliberately
// simple, non-gamma-corrected helper whose 0.45 threshold is pinned by tests (`pickReadableTextColor`). It must not be
// "fixed". WCAG contrast ratios need the gamma-corrected luminance defined by the specification, so this module owns
// that. Pure functions only: no React, no storage, no theme reads.

export type Rgba = {r: number; g: number; b: number; a: number};

/** WCAG 2.x thresholds. */
export const WCAG_AA_TEXT = 4.5;
export const WCAG_AA_LARGE_TEXT = 3;
/** Non-text UI components and graphical objects (borders of inputs, icons that carry meaning). */
export const WCAG_AA_UI = 3;
export const WCAG_AAA_TEXT = 7;

const clampChannel = (value: number): number => Math.max(0, Math.min(255, value));

/**
 * Parses `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`, `rgb(r, g, b)` and `rgba(r, g, b, a)`.
 * Throws on anything else (a token that cannot be parsed is a bug, never a silent default).
 */
export function parseColor(input: string): Rgba {
  const value = input.trim();
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const expanded =
      hex.length === 3 || hex.length === 4
        ? hex
            .split('')
            .map(char => char + char)
            .join('')
        : hex;
    if ((expanded.length !== 6 && expanded.length !== 8) || /[^0-9a-fA-F]/.test(expanded)) {
      throw new Error(`parseColor: unsupported hex color "${input}"`);
    }
    return {
      r: parseInt(expanded.slice(0, 2), 16),
      g: parseInt(expanded.slice(2, 4), 16),
      b: parseInt(expanded.slice(4, 6), 16),
      a: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    };
  }
  const match = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (match) {
    return {
      r: clampChannel(Number(match[1])),
      g: clampChannel(Number(match[2])),
      b: clampChannel(Number(match[3])),
      a: match[4] === undefined ? 1 : Math.max(0, Math.min(1, Number(match[4]))),
    };
  }
  throw new Error(`parseColor: unsupported color "${input}"`);
}

/** `#RRGGBB` (upper case, the same convention as awaThemeTokens.ts) for opaque channels. */
export function toHex({r, g, b}: Pick<Rgba, 'r' | 'g' | 'b'>): string {
  const part = (channel: number) => Math.round(clampChannel(channel)).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** Alpha-composites `foreground` over an OPAQUE `background` (the only physically meaningful case on a screen). */
export function compositeOver(foreground: string, background: string): {r: number; g: number; b: number} {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
  };
}

/** WCAG relative luminance of an opaque sRGB colour (gamma-corrected, 0 = black, 1 = white). */
export function wcagLuminance(color: string | {r: number; g: number; b: number}): number {
  const {r, g, b} = typeof color === 'string' ? parseColor(color) : color;
  const linear = (channel: number) => {
    const c = clampChannel(channel) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Contrast ratio between `foreground` and an opaque `background`, 1 … 21. A translucent foreground (rgba / #RRGGBBAA)
 * is composited over the background first, so `contrastRatio('rgba(0,0,0,0.5)', '#fff')` is the ratio the user sees.
 */
export function contrastRatio(foreground: string, background: string): number {
  const bg = parseColor(background);
  const opaqueBackground = {r: bg.r, g: bg.g, b: bg.b};
  const fg = compositeOver(foreground, background);
  const l1 = wcagLuminance(fg);
  const l2 = wcagLuminance(opaqueBackground);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrast(foreground: string, background: string, minimum: number = WCAG_AA_TEXT): boolean {
  return contrastRatio(foreground, background) >= minimum;
}

const mix = (from: {r: number; g: number; b: number}, to: {r: number; g: number; b: number}, t: number) => ({
  r: from.r + (to.r - from.r) * t,
  g: from.g + (to.g - from.g) * t,
  b: from.b + (to.b - from.b) * t,
});

/**
 * Returns `foreground` unchanged when it already reaches `minimum` against EVERY given background; otherwise the
 * closest colour on the straight line from `foreground` toward `towards` (typically the theme's own `text` colour)
 * that does. If even `towards` is not enough, `towards` is returned (best effort, never throws).
 *
 * Deterministic: a fixed 64-step bisection, so the result is stable across runs and platforms.
 */
export function ensureContrast(
  foreground: string,
  backgrounds: string | readonly string[],
  minimum: number,
  towards: string,
): string {
  const list = typeof backgrounds === 'string' ? [backgrounds] : backgrounds;
  const passes = (candidate: string) => list.every(background => contrastRatio(candidate, background) >= minimum);
  if (passes(foreground)) {
    return foreground;
  }
  const from = parseColor(foreground);
  const target = parseColor(towards);
  const start = {r: from.r, g: from.g, b: from.b};
  const end = {r: target.r, g: target.g, b: target.b};
  if (!passes(toHex(end))) {
    return toHex(end);
  }
  let low = 0; // fails
  let high = 1; // passes
  for (let step = 0; step < 24; step += 1) {
    const middle = (low + high) / 2;
    if (passes(toHex(mix(start, end, middle)))) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return toHex(mix(start, end, high));
}
