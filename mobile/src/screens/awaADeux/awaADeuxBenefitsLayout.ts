// Sizes of "Les avantages pour vous deux": the title, the five benefit cards and the
// CTA must fit in ONE viewport (no scrolling), so they shrink smoothly with the window
// height: s = 0 on a short phone (≤ 600 dp) … 1 on a tall one (≥ 860 dp).
// Pure numbers: the theme is applied by the screen.

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const half = (value: number) => Math.round(value * 2) / 2;

export const BENEFITS_SHORT_SCREEN = 600;
export const BENEFITS_TALL_SCREEN = 860;
export const BENEFITS_COUNT = 5;
/** Each benefit text is at most this many lines at the narrowest supported width. */
export const BENEFITS_MAX_LINES = 2;

const BACK_BUTTON_HEIGHT = 46; // 28 icon + 2 × 9 padding
const HEADER_BOTTOM_PADDING = 4;
const CONTENT_TOP_PADDING = 8;
const TITLE_LINES = 2;
const FOOTER_TOP_PADDING = 10;
const FOOTER_EXTRA_BOTTOM = 8;

export type BenefitsLayout = {
  titleFontSize: number;
  titleLineHeight: number;
  bodyMarginTop: number;
  cardGap: number;
  cardPaddingVertical: number;
  cardPaddingHorizontal: number;
  cardMinHeight: number;
  iconBox: number;
  iconSize: number;
  textFontSize: number;
  textLineHeight: number;
  ctaHeight: number;
  /** Estimated height (dp) of everything on the screen. */
  totalHeight: number;
};

export function getBenefitsLayout(height: number, insetTop: number, insetBottom: number): BenefitsLayout {
  const s = clamp01((height - BENEFITS_SHORT_SCREEN) / (BENEFITS_TALL_SCREEN - BENEFITS_SHORT_SCREEN));
  const lerp = (short: number, tall: number) => half(short + (tall - short) * s);

  const titleFontSize = lerp(23, 27);
  const titleLineHeight = titleFontSize + 6;
  const bodyMarginTop = lerp(10, 22);
  const cardGap = lerp(7, 12);
  const cardPaddingVertical = lerp(8, 14);
  const iconBox = lerp(38, 48);
  const textFontSize = lerp(14, 15.5);
  const textLineHeight = textFontSize + 5;
  const cardMinHeight = Math.max(
    iconBox + cardPaddingVertical * 2,
    BENEFITS_MAX_LINES * textLineHeight + cardPaddingVertical * 2,
  );
  const ctaHeight = lerp(48, 54);

  const totalHeight =
    Math.max(insetTop, 18) + 8 + BACK_BUTTON_HEIGHT + HEADER_BOTTOM_PADDING +
    CONTENT_TOP_PADDING + TITLE_LINES * titleLineHeight +
    bodyMarginTop +
    BENEFITS_COUNT * cardMinHeight + (BENEFITS_COUNT - 1) * cardGap +
    FOOTER_TOP_PADDING + ctaHeight + Math.max(insetBottom, 16) + FOOTER_EXTRA_BOTTOM;

  return {
    titleFontSize,
    titleLineHeight,
    bodyMarginTop,
    cardGap,
    cardPaddingVertical,
    cardPaddingHorizontal: lerp(12, 16),
    cardMinHeight,
    iconBox,
    iconSize: lerp(21, 24),
    textFontSize,
    textLineHeight,
    ctaHeight,
    totalHeight,
  };
}
