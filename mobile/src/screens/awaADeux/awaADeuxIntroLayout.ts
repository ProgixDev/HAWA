// Sizes of the "AWA à deux" introduction screen. The whole screen (back button,
// illustration, title, subtitle, four benefit cards, CTA) must fit in ONE viewport
// with no scrolling, so every size below shrinks / grows smoothly with the window
// height: `s` goes from 0 (a short phone, ≤ 600 dp) to 1 (a tall phone, ≥ 860 dp).
// The illustration takes whatever height is left (within a cap), so it is the
// flexible element; everything else keeps a readable minimum.
//
// Pure numbers, no colors: the theme is applied by the screen.

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const half = (value: number) => Math.round(value * 2) / 2;

export const INTRO_SHORT_SCREEN = 600;
export const INTRO_TALL_SCREEN = 860;
/** The illustration never gets less than this (dp) — below it the screen is simply too short for the layout. */
export const INTRO_HERO_MIN_HEIGHT = 90;
/** A benefit text is at most this many lines at the smallest supported width. */
export const INTRO_BENEFIT_MAX_LINES = 2;

const BACK_BUTTON_HEIGHT = 46; // 28 icon + 2 × 9 padding
const HEADER_BOTTOM_PADDING = 4;
const FOOTER_TOP_PADDING = 10;
const FOOTER_EXTRA_BOTTOM = 8;

export type IntroLayout = {
  headerTop: number;
  heroMaxHeight: number;
  titleFontSize: number;
  titleLineHeight: number;
  titleMarginTop: number;
  subtitleFontSize: number;
  subtitleLineHeight: number;
  subtitleMarginTop: number;
  benefitsMarginTop: number;
  benefitGap: number;
  benefitPaddingVertical: number;
  benefitPaddingHorizontal: number;
  benefitIconBox: number;
  benefitIconSize: number;
  benefitFontSize: number;
  benefitLineHeight: number;
  benefitCardMinHeight: number;
  ctaHeight: number;
  footerBottom: number;
  /** Estimated height (dp) of everything except the illustration. */
  fixedHeight: number;
};

export function getIntroLayout(height: number, insetTop: number, insetBottom: number): IntroLayout {
  const s = clamp01((height - INTRO_SHORT_SCREEN) / (INTRO_TALL_SCREEN - INTRO_SHORT_SCREEN));
  const lerp = (short: number, tall: number) => half(short + (tall - short) * s);

  const headerTop = Math.max(insetTop, 18) + 8;
  const titleFontSize = lerp(24, 27);
  const titleLineHeight = titleFontSize + 5;
  const titleMarginTop = lerp(4, 10);
  const subtitleFontSize = lerp(13, 15);
  const subtitleLineHeight = subtitleFontSize + 5;
  const subtitleMarginTop = lerp(2, 5);
  const benefitsMarginTop = lerp(10, 18);
  const benefitGap = lerp(7, 10);
  const benefitPaddingVertical = lerp(8, 12);
  const benefitFontSize = lerp(12.5, 14);
  const benefitLineHeight = benefitFontSize + 5;
  const benefitIconBox = lerp(34, 40);
  const benefitCardMinHeight = Math.max(
    benefitIconBox + benefitPaddingVertical * 2,
    INTRO_BENEFIT_MAX_LINES * benefitLineHeight + benefitPaddingVertical * 2,
  );
  const ctaHeight = lerp(46, 50);
  const footerBottom = Math.max(insetBottom, 16) + FOOTER_EXTRA_BOTTOM;

  const fixedHeight =
    headerTop +
    BACK_BUTTON_HEIGHT +
    HEADER_BOTTOM_PADDING +
    titleMarginTop +
    titleLineHeight +
    subtitleMarginTop +
    2 * subtitleLineHeight +
    benefitsMarginTop +
    4 * benefitCardMinHeight +
    3 * benefitGap +
    FOOTER_TOP_PADDING +
    ctaHeight +
    footerBottom;

  return {
    headerTop,
    heroMaxHeight: Math.round(height * (0.24 + 0.04 * s)),
    titleFontSize,
    titleLineHeight,
    titleMarginTop,
    subtitleFontSize,
    subtitleLineHeight,
    subtitleMarginTop,
    benefitsMarginTop,
    benefitGap,
    benefitPaddingVertical,
    benefitPaddingHorizontal: lerp(12, 14),
    benefitIconBox,
    benefitIconSize: lerp(18, 21),
    benefitFontSize,
    benefitLineHeight,
    benefitCardMinHeight,
    ctaHeight,
    footerBottom,
    fixedHeight,
  };
}
